'use strict';

/**
 * acervo-envelopes.js — OS ENVELOPES no repositório, e não no KV.
 *
 * O QUE MOTIVOU (20/10/2026, a fase 3 do plano de otimização). A fase 1 levou a ANAMNESE para
 * o repositório (`escola/<escola>/anamneses/<apelido>--<carimbo>.json`) e deixou o plano e o PO
 * no KV. Ficaram dois mundos: metade dos registros tinha uma segunda cópia num repositório, a
 * outra metade vivia num cache com cota diária. E a anamnese tinha, no `rotas.js`, um caminho
 * próprio — escrever aqui, listar ali, ler acolá — que os outros dois não tinham. Duas regras
 * para a mesma coisa é a receita para as duas divergirem.
 *
 * A MUDANÇA DE FUNDO: em vez de um módulo por família, este módulo é um ARMAZENAMENTO. Ele
 * implementa o mesmo contrato de `motor/adaptadores/cloudflare.js` — `ler`, `guardar`,
 * `apagar`, `existe`, `listar` (e `mutar`, que só ele tem) — sobre a família `envelope/`.
 * Quem o recebe é o `porta.js`, que nunca soube (nem passa a saber) onde o dado vive. Tudo o
 * que já existia — a derivação, o índice com os resumos, os estados, os vínculos, a
 * proveniência — funciona sem uma linha de mudança, porque a chave lógica continua a mesma:
 * `envelope/<carimbo>.json`.
 *
 * O DESENHO, em cinco decisões:
 *
 *   1. O CAMINHO É A CHAVE. `escola/<escola>/envelopes/<chave>` — `envelope/plano-….json` vira
 *      `escola/x/envelopes/plano-….json`. A correspondência é uma soma de prefixo, sem tabela,
 *      sem índice de caminhos, e reversível. A LISTAGEM sai de UMA chamada à árvore do
 *      repositório (`git/trees?recursive=1`).
 *
 *   2. DADO DE MENOR VAI CIFRADO, E SÓ ELE. O envelope da ANAMNESE é gravado com o metadado em
 *      claro e as RESPOSTAS num `_cifrado` com a `SENHA_CRIPTO` da escola — o mesmo esquema do
 *      cofre e do `-dados.json` do pacote, decifrável pelo mesmo `tools/lib-cifra.js`. O plano
 *      e o PO vão em claro, e isso é uma decisão, não um esquecimento: a fonte que a geração
 *      escreve (`ciclo-XX-<escola>-po.md`) já vai em claro para o mesmo repositório, com as
 *      mesmas respostas. Cifrar o JSON e deixar o `.md` aberto seria teatro.
 *
 *   3. O 409 REPETE. A Contents API exige o `sha` corrente; dois «Guardar» simultâneos fazem o
 *      segundo falhar com 409. Toda escrita relê o `sha` e repete — inclusive o índice, que é
 *      um LER-MODIFICAR-GRAVAR e por isso tem a sua própria porta (`mutar`), com a mutação
 *      reaplicada sobre a versão que ganhou a corrida.
 *
 *   4. O KV ANTIGO NÃO EVAPORA. Uma escola que já trabalhava antes desta fase tem envelopes no
 *      KV, e a fase não pode fazer os registros dela desaparecerem da tela. A leitura é
 *      REPOSITÓRIO PRIMEIRO, com o KV como reserva — e a reserva só é consultada quando a
 *      árvore não tem o nome (uma chave por registro que falta, não uma por carga de página).
 *      A escrita é só no repositório: cada registro migra na primeira vez que é regravado, e o
 *      KV envelhece sem ser lido.
 *
 *   5. UMA CARGA, UMA LEITURA. O armazenamento é criado POR PEDIDO (a ponte constrói um por
 *      `fetch`) e guarda o que leu num `Map`. As três rotas que consultam o índice numa só
 *      página (`/api/envelopes`, `/api/planos`, `/api/plano-estados`) pagam UMA ida ao GitHub,
 *      e não três. O cache morre com o pedido, portanto nunca serve estado de ontem.
 *
 * O QUE ELE **NÃO** FAZ: apagar em cascata, migrar em lote, ou escrever no KV. Um ajuste gera
 * carimbo novo (`ajuste_de` aponta para o anterior) — nada se reescreve.
 */

const Cifra = require('../../tools/lib-cifra.js');

const API_VERSAO = '2022-11-28';
const ACEITE = 'application/vnd.github+json';

// O teto do runtime do Worker (o mesmo do `cifrar-envelope.js`: o WebCrypto do workerd recusa
// PBKDF2 acima de 100.000). O envelope é autodescritivo — `_cifrado.iteracoes` viaja no
// arquivo, e quem decifra lê a contagem DE VOLTA.
const ITERACOES_DO_WORKER = 100000;

const PREFIXO = 'escola/';
const PASTA = 'envelopes/';
const CHAVE_DO_INDICE = 'envelope/.indice.json';

// O repositório do sistema. É o mesmo do `disparar.js` e do `escrever-po.js`; está aqui para
// que a ponte e os Bastidores não precisem de o repetir (e não possam divergir).
const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const REF_PADRAO = 'main';

const NOTA = 'Um envelope da elicitação. Nas ANAMNESES as respostas vão cifradas pela senha da '
  + 'escola (SENHA_CRIPTO, o mesmo tools/lib-cifra.js do cofre e do JSON de dados do pacote), e o '
  + 'metadado fica em claro de propósito: a listagem lê o contexto e nunca precisa de abrir as '
  + 'respostas. No plano e no PO as respostas vão em claro — a fonte que a geração escreve '
  + '(`ciclo-XX-<escola>-po.md`) já as leva abertas para este mesmo repositório. O carimbo é a '
  + 'identidade do registro, e um ajuste gera um carimbo novo (nada se reescreve). Não editar à mão.';

// --------------------------------------------------------------- caminho ↔ chave

/**
 * O caminho de uma chave no repositório: `escola/<escola>/envelopes/<chave sem o prefixo>`.
 *
 * A BARRA É RECUSADA, e não codificada: o `encodeURIComponent` transforma-a em `%2F`, mas a
 * Contents API DECODIFICA o caminho antes de o resolver, e `%2F` volta a ser separador de
 * pasta. O arquivo cairia noutro sítio, ou não cairia em nenhum.
 */
function caminhoDaChave(escola, chave) {
  const slug = String(escola || '').trim();
  const nome = String(chave || '').trim();
  if (!slug) throw new Error('acervo: falta a escola');
  if (!nome.startsWith('envelope/')) throw new Error('acervo: só a família envelope/ mora aqui: ' + nome);
  const arquivo = nome.slice('envelope/'.length);
  if (!arquivo || arquivo.indexOf('/') !== -1) {
    throw new Error('acervo: nome de envelope inválido: ' + arquivo);
  }
  return PREFIXO + slug + '/' + PASTA + arquivo;
}

/** O INVERSO: de um caminho da árvore, `{escola, chave}` — ou null se não for do acervo. */
function lerCaminho(caminho) {
  const m = /^escola\/([^/]+)\/envelopes\/([^/]+)$/.exec(String(caminho || ''));
  if (!m) return null;
  return { escola: m[1], chave: 'envelope/' + m[2] };
}

/** O acervo de uma escola inteira — o que o expurgo apaga. */
function ehAcervoDaEscola(caminho, slug) {
  const alvo = String(caminho || '');
  return alvo.indexOf(PREFIXO + slug + '/' + PASTA) === 0
    // O caminho da fase 1 (a anamnese sozinha, com o apelido no nome do arquivo). Uma escola
    // anterior a esta fase pode tê-lo; o expurgo não pode deixar de o ver.
    || alvo.indexOf(PREFIXO + slug + '/anamneses/') === 0;
}

// ------------------------------------------------------------------- cifra
//
// O ARQUIVO CIFRADO DA ANAMNESE. É o mesmo formato da fase 1 — metadado em claro, respostas
// num `_cifrado` —, porque há escolas com anamneses gravadas assim, e mudar o formato para
// ganhar nada seria perder o que já está escrito.

function ehAnamnese(chave) {
  return String(chave || '').indexOf('envelope/anamnese-') === 0;
}

/**
 * O arquivo que vai para o repositório, a partir do envelope em claro.
 * `envelope` é o envelope elicitado (o mesmo texto que o núcleo produziu).
 */
async function montarArquivoCifrado(envelope, senha, cifrar) {
  if (!senha) throw new Error('anamnese no repositório: falta a SENHA_CRIPTO');
  const e = envelope || {};
  const contexto = e.contexto || {};
  const id = String(e.id || '').trim();
  if (!id) throw new Error('anamnese no repositório: o envelope não tem id');

  const respostas = JSON.stringify(
    { respostas: e.respostas || {}, notas: e.notas || {} }, null, 2,
  );
  const _cifrado = cifrar
    ? await cifrar(respostas, senha)
    : await Cifra.cifrar(respostas, senha, { iteracoes: ITERACOES_DO_WORKER });

  return JSON.stringify({
    $nota: NOTA,
    id,
    documento: e.documento || 'anamnese',
    envelope: e.envelope || null,
    gerado_em: e.gerado_em || null,
    contexto: {
      escola: contexto.escola || null,
      professor: contexto.professor || null,
      ciclo: contexto.ciclo || null,
      aluna: contexto.aluna || null,
    },
    ajuste_de: e.ajuste_de || undefined,
    estado: e.estado || undefined,
    respostas: { _cifrado, _nota: NOTA },
  }, null, 2) + '\n';
}

/** O INVERSO do arquivo cifrado — o envelope em claro que o núcleo sabe ler. */
async function abrirArquivoCifrado(arquivo, senha) {
  if (!senha) throw new Error('sem SENHA_CRIPTO: não consigo abrir as respostas');
  const claro = await Cifra.decifrar(
    arquivo.respostas && arquivo.respostas._cifrado,
    senha,
    (arquivo.respostas && arquivo.respostas._cifrado && arquivo.respostas._cifrado.iteracoes) || 0,
  );
  const conteudo = JSON.parse(claro);
  return Object.assign({}, arquivo, {
    respostas: conteudo.respostas || {},
    notas: conteudo.notas || {},
  });
}

// --------------------------------------------------------------- HTTP

/** Base64 em UTF-8 SEM `Buffer` (ausente no runtime dos Workers). */
function base64De(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}

function textoDeBase64(base64) {
  return new TextDecoder().decode(Uint8Array.from(atob(String(base64).replace(/\s+/g, '')), (c) => c.charCodeAt(0)));
}

function cabecalhosDe(token) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    // O GitHub exige um User-Agent; o `fetch` do Worker não o envia por padrão.
    'User-Agent': 'danca-worker',
  };
}

// --------------------------------------------------------------- o acervo

/**
 * O ARMAZENAMENTO da família `envelope/`, sobre o repositório.
 *
 * `legado` é o armazenamento antigo (o KV), consultado só quando o repositório não tem o nome.
 * Sem ele, o acervo é a autoridade única — é o que as provas usam, e é o que a escola nova é.
 *
 * `escola` vazia não tem acervo: sem slug não há caminho (o Worker da raiz não é escola).
 */
function criarAcervoDeEnvelopes({ token, dono, repo, ref, escola, senhaCripto, cifrar, fetchImpl, legado }) {
  const slug = String(escola || '').trim();
  const f = fetchImpl || fetch;
  const base = 'https://api.github.com/repos/' + (dono || DONO_PADRAO) + '/' + (repo || REPO_PADRAO);
  const cabecalhos = cabecalhosDe(token);
  const ramo = ref || REF_PADRAO;
  const comRamo = (url) => url + (ramo ? (url.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(ramo) : '');

  // O CACHE DO PEDIDO. Vive o tempo deste armazenamento, que a ponte cria por `fetch`: as
  // três rotas de uma página leem o índice uma vez. Não sobrevive ao pedido, e por isso não
  // pode servir estado de ontem.
  const lidos = new Map();   // chave → {texto, sha} | null
  let indice = null;         // a árvore, lida no máximo uma vez por pedido

  function exigirToken() {
    if (!token) throw new Error('acervo: sem GITHUB_TOKEN — o envelope não vai para o repositório');
    if (!slug) throw new Error('acervo: sem ESCOLA_SLUG — este Worker não é escola');
  }

  async function conteudo(chave) {
    if (lidos.has(chave)) return lidos.get(chave);
    const url = comRamo(base + '/contents/' + caminhoDaChave(slug, chave));
    const r = await f(url, { method: 'GET', headers: cabecalhos });
    if (r.status === 404) { lidos.set(chave, null); return null; }
    if (!r.ok) throw new Error('acervo: leitura de ' + chave + ': HTTP ' + r.status);
    const dados = await r.json().catch(() => null);
    const cru = dados && dados.content ? String(dados.content) : '';
    if (!cru) throw new Error('acervo: o arquivo veio vazio: ' + chave);
    const achado = { texto: textoDeBase64(cru), sha: (dados && dados.sha) || null };
    lidos.set(chave, achado);
    return achado;
  }

  /** A árvore do repositório (UMA chamada), filtrada no acervo desta escola. */
  async function arvore() {
    if (indice) return indice;
    const r = await f(base + '/git/trees/' + encodeURIComponent(ramo) + '?recursive=1',
      { method: 'GET', headers: cabecalhos });
    if (!r.ok) throw new Error('acervo: não li a árvore do repositório: HTTP ' + r.status);
    const dados = await r.json().catch(() => null);
    const nomes = [];
    for (const item of (dados && dados.tree) || []) {
      if (!item || item.type !== 'blob') continue;
      const achado = lerCaminho(item.path);
      if (!achado || achado.escola !== slug) continue;
      nomes.push(achado.chave);
    }
    indice = nomes;
    return nomes;
  }

  /** Escreve um texto já pronto. Repete o 409 (o `sha` mudou entre a leitura e a escrita). */
  async function escrever(chave, texto, mensagem) {
    const url = base + '/contents/' + caminhoDaChave(slug, chave);
    let ultimo = { ok: false, erro: 'não se tentou' };
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let sha = null;
      const atual = await f(comRamo(url), { method: 'GET', headers: cabecalhos });
      if (atual.status === 200) {
        const dados = await atual.json().catch(() => null);
        sha = (dados && dados.sha) || null;
      } else if (atual.status !== 404) {
        return { ok: false, status: atual.status, erro: 'leitura do sha: HTTP ' + atual.status };
      }
      const resposta = await f(url, {
        method: 'PUT',
        headers: cabecalhos,
        body: JSON.stringify({
          message: mensagem || ('feat(acervo): ' + chave),
          content: base64De(texto),
          branch: ramo,
          ...(sha ? { sha } : {}),
        }),
      });
      if (resposta.status >= 200 && resposta.status < 300) {
        const dados = await resposta.json().catch(() => null);
        // A próxima leitura deste pedido vê o que acabou de ser escrito.
        lidos.delete(chave);
        if (Array.isArray(indice) && indice.indexOf(chave) === -1) indice.push(chave);
        return {
          ok: true,
          status: resposta.status,
          criado: !sha,
          // O CAMINHO NO REPOSITÓRIO VAI NA RESPOSTA (20/10/2026). A tela mostrava o CARIMBO e o
          // caminho do COFRE — e quem copiava o segundo para procurar no GitHub não achava nada,
          // porque o cofre é uma chave do KV, não um arquivo. O que se mostra tem de ser o que
          // existe, e o endereço disso é este.
          caminho: caminhoDaChave(slug, chave),
          commit: dados && dados.commit && dados.commit.sha ? dados.commit.sha : null,
        };
      }
      if (resposta.status !== 409) {
        return { ok: false, status: resposta.status, erro: 'o GitHub recusou a escrita: HTTP ' + resposta.status };
      }
      ultimo = { ok: false, status: 409, erro: 'conflito de escrita (409) — a repetir' };
    }
    return ultimo;
  }

  return {
    /**
     * LÊ. O repositório primeiro; o KV só quando a árvore não tem o nome.
     *
     * A anamnese é DEVOLVIDA EM CLARO: quem está acima (o `porta.js`) nunca soube que ela é
     * cifrada, e não é neste nível que ele deve saber. A chave do índice é a excepção — um
     * índice não tem respostas para cifrar.
     */
    async ler(chave) {
      if (slug && token) {
        const nome = String(chave || '');
        if (nome.startsWith('envelope/')) {
          const achado = await conteudo(nome);
          if (achado) {
            if (!ehAnamnese(nome)) return achado.texto;
            const arquivo = JSON.parse(achado.texto);
            if (!arquivo || !arquivo.respostas || !arquivo.respostas._cifrado) return achado.texto;
            return JSON.stringify(await abrirArquivoCifrado(arquivo, senhaCripto), null, 2) + '\n';
          }
        }
      }
      return legado && typeof legado.ler === 'function' ? legado.ler(chave) : null;
    },

    /**
     * GRAVA — e só no repositório. A anamnese é embrualhada no formato cifrado aqui, no único
     * ponto por onde uma anamnese pode passar a caminho do disco.
     */
    async guardar(chave, texto, mensagem) {
      // SEM TOKEN A ESCOLA É A DE ANTES. Um Worker que nunca recebeu o `GITHUB_TOKEN` (as
      // escolas anteriores a esta fase, a raiz) continua a gravar onde sempre gravou: o
      // armazenamento não pode transformar «não sei escrever no repositório» em «não sei
      // gravar». Quem tem token grava no acervo — e o KV envelhece sem ser escrito.
      if (!token || !slug) {
        if (legado && typeof legado.guardar === 'function') {
          const r = await legado.guardar(chave, texto);
          // SEM ACERVO NÃO HÁ CAMINHO NO REPOSITÓRIO — e inventá-lo seria mentir sobre onde o
          // dado está. O resultado diz que ficou no armazenamento antigo, e a tela diz o mesmo.
          return Object.assign({}, r, { noArmazenamentoAntigo: true });
        }
        exigirToken();   // sem um nem outro: a falta tem nome
      }
      const nome = String(chave || '');
      let corpo = texto;
      if (ehAnamnese(nome)) {
        corpo = await montarArquivoCifrado(JSON.parse(texto), senhaCripto, cifrar);
      }
      const r = await escrever(nome, corpo, mensagem);
      if (!r.ok) throw new Error(r.erro || 'o acervo recusou a escrita');
      return r;
    },

    /**
     * GRAVA SÓ SE A CHAVE NÃO EXISTIR — a corrida do carimbo, fechada do lado da escrita
     * (04/11/2026).
     *
     * `guardar` lê o `sha` e grava por cima dele. É o certo para EDITAR o mesmo documento —
     * o «Guardar» de uma correção —, e é o errado para CRIAR um nome novo: o nome foi
     * decidido antes da leitura, e dois pedidos que decidam o mesmo nome perdem um dos
     * documentos sem erro nenhum. `escrever` não pode resolver isto, porque a pergunta tem
     * de ser feita no instante da escrita.
     *
     * A escrita vai SEM `sha`, e é o GitHub que responde pela existência: criado → 2xx;
     * já existe → **422 «"sha" wasn't supplied.»**. MEDIDO contra a API real em 04/11/2026,
     * num ramo descartável (apagado a seguir, e nada foi escrito no `main`). O 422 só conta
     * como «já existe» quando o recado fala do `sha`: um 422 por outro motivo (caminho
     * inválido, por exemplo) é um erro, e tratá-lo como «já existe» faria quem chama pedir
     * sufixos sem fim.
     */
    async criar(chave, texto, mensagem) {
      if (!token || !slug) {
        // SEM ACERVO NÃO HÁ CRIAR: quem não escreve no repositório grava onde sempre gravou.
        if (legado && typeof legado.guardar === 'function') {
          const existia = typeof legado.existe === 'function' ? await legado.existe(chave) : false;
          if (existia) return { criado: false, jaExiste: true };
          await legado.guardar(chave, texto);
          return { criado: true, noArmazenamentoAntigo: true };
        }
        exigirToken();
      }
      const nome = String(chave || '');
      let corpo = texto;
      if (ehAnamnese(nome)) {
        corpo = await montarArquivoCifrado(JSON.parse(texto), senhaCripto, cifrar);
      }
      const url = base + '/contents/' + caminhoDaChave(slug, nome);
      let ultimo = 'não se tentou';
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        const resposta = await f(url, {
          method: 'PUT',
          headers: cabecalhos,
          body: JSON.stringify({
            message: mensagem || ('feat(acervo): ' + nome),
            content: base64De(corpo),
            branch: ramo,
          }),
        });
        if (resposta.status >= 200 && resposta.status < 300) {
          const dados = await resposta.json().catch(() => null);
          lidos.delete(nome);
          if (Array.isArray(indice) && indice.indexOf(nome) === -1) indice.push(nome);
          return {
            criado: true,
            caminho: caminhoDaChave(slug, nome),
            commit: dados && dados.commit && dados.commit.sha ? dados.commit.sha : null,
          };
        }
        const corpoDoRecado = await resposta.json().catch(() => null);
        const recado = corpoDoRecado && corpoDoRecado.message ? ' — ' + corpoDoRecado.message : '';
        // «JÁ EXISTE» TEM NOME PRÓPRIO: não é falha — é a resposta que faz quem chama
        // escolher outro nome.
        if (resposta.status === 422 && /sha/i.test(recado)) {
          lidos.delete(nome);   // o cache deste pedido envelheceu: a chave existe
          return { criado: false, jaExiste: true, status: 422 };
        }
        ultimo = 'HTTP ' + resposta.status + recado;
        // Uma corrida do índice (o `.indice.json` mudou no meio) não impede este arquivo:
        // repetir é o certo, e o 422 já saiu por cima.
        if (resposta.status !== 409) {
          return { criado: false, status: resposta.status, erro: 'o GitHub recusou a escrita: ' + ultimo };
        }
        await new Promise((s) => setTimeout(s, tentativa * 300));
      }
      return { criado: false, erro: 'a criação de ' + nome + ' não entrou depois de 3 tentativas — ' + ultimo };
    },

    /**
     * LER-MODIFICAR-GRAVAR, com a mutação reaplicada sobre a versão que ganhou a corrida.
     *
     * É o que o índice precisa: dois isolates gravando ao mesmo tempo perderiam uma entrada se
     * cada um escrevesse a sua lista por cima da do outro. Aqui a lista é relida e a mutação
     * volta a ser aplicada — o resultado é o mesmo que se as duas escritas tivessem sido
     * sequenciais.
     */
    async mutar(chave, mutacao, mensagem) {
      if (!token || !slug) {
        // O mesmo critério: sem acervo, o índice é lido-modificado-gravado no legado.
        if (!legado || typeof legado.guardar !== 'function') return { ok: false, erro: 'sem acervo' };
        const atual = await legado.ler(chave);
        const novo = await mutacao(atual);
        if (novo === null || novo === undefined) return { ok: true, semMudanca: true };
        await legado.guardar(chave, novo);
        return { ok: true, status: 200 };
      }
      let ultimo = { ok: false, erro: 'não se tentou' };
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        const achado = await conteudo(chave);
        const novo = await mutacao(achado ? achado.texto : null);
        if (novo === null || novo === undefined) return { ok: true, semMudanca: true };
        const url = base + '/contents/' + caminhoDaChave(slug, chave);
        const resposta = await f(url, {
          method: 'PUT',
          headers: cabecalhos,
          body: JSON.stringify({
            message: mensagem || ('feat(acervo): ' + chave),
            content: base64De(novo),
            branch: ramo,
            ...(achado && achado.sha ? { sha: achado.sha } : {}),
          }),
        });
        if (resposta.status >= 200 && resposta.status < 300) {
          lidos.delete(chave);
          return { ok: true, status: resposta.status };
        }
        if (resposta.status !== 409) {
          return { ok: false, status: resposta.status, erro: 'o GitHub recusou a escrita: HTTP ' + resposta.status };
        }
        lidos.delete(chave);   // relê na próxima volta
        ultimo = { ok: false, status: 409, erro: 'conflito de escrita (409) — a repetir' };
      }
      return ultimo;
    },

    /** APAGA. Devolve `true` se existia (a mesma resposta do adaptador do KV). */
    async apagar(chave) {
      const nome = String(chave || '');
      if (!nome.startsWith('envelope/')) {
        return legado && typeof legado.apagar === 'function' ? legado.apagar(nome) : false;
      }
      /* A MESMA SIMETRIA DO `guardar` (03/11/2026). Sem token, o `guardar` cai no armazenamento
       * antigo («não sei escrever no repositório» não pode virar «não sei gravar»); o `apagar`
       * exigia token e respondia 500. A assimetria era invisível enquanto ninguém apagava — e
       * deixou de ser no dia em que a listagem voltou a oferecer o «Apagar» do registo solto: o
       * botão funciona numa escola com token e dá erro na que não tem, sem que nada na tela
       * explique porquê. Apagar é o inverso de gravar, e onde se gravou é onde se apaga. */
      if (!token || !slug) {
        if (legado && typeof legado.apagar === 'function') return legado.apagar(nome);
        exigirToken();   // sem um nem outro: a falta tem nome
      }
      const achado = await conteudo(nome);
      if (!achado) return false;
      const r = await f(base + '/contents/' + caminhoDaChave(slug, nome), {
        method: 'DELETE',
        headers: cabecalhos,
        body: JSON.stringify({ message: 'chore(acervo): apagar ' + nome, sha: achado.sha, branch: ramo }),
      });
      if (!r.ok && r.status !== 404) throw new Error('acervo: apagar ' + nome + ': HTTP ' + r.status);
      lidos.delete(nome);
      if (Array.isArray(indice)) indice = indice.filter((n) => n !== nome);
      return true;
    },

    /** EXISTE? Uma leitura, com o cache do pedido. */
    async existe(chave) {
      const nome = String(chave || '');
      if (!nome.startsWith('envelope/') || !slug || !token) {
        return legado && typeof legado.existe === 'function' ? legado.existe(nome) : false;
      }
      return (await conteudo(nome)) !== null;
    },

    /**
     * LISTA as chaves com o prefixo dado. A árvore é a enumeração — uma chamada, e a mesma para
     * todos os prefixos deste pedido. O KV antigo entra como UNIÃO: um registro que existe nos
     * dois lados aparece uma vez, e um que só existe lá (nunca regravado) não desaparece.
     */
    async listar(prefixo) {
      const pedido = String(prefixo || '');
      let doRepo = [];
      if (slug && token) {
        doRepo = (await arvore()).filter((n) => n.startsWith(pedido));
      }
      let doLegado = [];
      if (legado && typeof legado.listar === 'function') {
        try { doLegado = await legado.listar(pedido); } catch (erro) { doLegado = []; }
      }
      const todos = doRepo.slice();
      for (const nome of doLegado) if (todos.indexOf(nome) === -1) todos.push(nome);
      return todos;
    },

    /** A árvore deste pedido, para quem quiser os nomes sem passar por `listar`. */
    async nomes() {
      return slug && token ? (await arvore()).slice() : [];
    },
  };
}

/**
 * O ACERVO a partir do `env` do Worker — o mesmo par (dono, repo, ramo) dos outros escritores.
 *
 * `legado` é o armazenamento do KV (o que a ponte já construía). Passado aqui, ele nunca é
 * escrito; é a reserva de leitura dos registros que ainda não migraram.
 */
function doAmbiente(env, { legado, escola, cifrar } = {}) {
  return criarAcervoDeEnvelopes({
    token: (env && env.GITHUB_TOKEN) || null,
    dono: DONO_PADRAO,
    repo: REPO_PADRAO,
    ref: REF_PADRAO,
    escola: escola || (env && env.ESCOLA_SLUG) || '',
    senhaCripto: (env && env.SENHA_CRIPTO) || null,
    cifrar,
    legado,
  });
}

/**
 * O ARMAZENAMENTO COMBINADO: `envelope/` vai para o acervo; o resto (o lançamento cifrado, os
 * cadastros dos Bastidores, o cartão da geração) fica onde sempre esteve.
 *
 * É UMA linha de composição, e é de propósito: a fronteira entre «registro» e «estado» passa a
 * ser a FAMÍLIA da chave, não o módulo que a lê.
 */
function combinar(acervo, resto) {
  const ehDoAcervo = (chave) => String(chave || '').startsWith('envelope/');
  return {
    ler: (chave) => (ehDoAcervo(chave) ? acervo.ler(chave) : resto.ler(chave)),
    guardar: (chave, texto, mensagem) => (ehDoAcervo(chave)
      ? acervo.guardar(chave, texto, mensagem)
      : resto.guardar(chave, texto)),
    apagar: (chave) => (ehDoAcervo(chave) ? acervo.apagar(chave) : resto.apagar(chave)),
    existe: (chave) => (ehDoAcervo(chave) ? acervo.existe(chave) : resto.existe(chave)),
    listar: (prefixo) => (String(prefixo || '').startsWith('envelope/')
      ? acervo.listar(prefixo)
      : resto.listar(prefixo)),
    // `mutar` só existe no acervo (o índice é dele); o KV é escrito por cima, como sempre.
    mutar: (chave, mutacao, mensagem) => (ehDoAcervo(chave)
      ? acervo.mutar(chave, mutacao, mensagem)
      : (typeof resto.mutar === 'function' ? resto.mutar(chave, mutacao) : null)),
  };
}

/**
 * O ÍNDICE COMO ELE ESTÁ NO REPOSITÓRIO — `{nomes, resumos}` ou `null` se ainda não existe.
 *
 * Existe para os Bastidores: a regra de proveniência («o que já entrou num plano não se apaga»)
 * precisa do professor, da turma e do repertório de cada plano, e antes lia TODOS os envelopes
 * do KV, um por um, com uma enumeração à cabeça. O índice já traz isso — é a mesma decisão da
 * fase 2, aplicada a quem lia por fora do `porta.js`.
 */
async function lerIndiceDoAcervo({ token, dono, repo, ref, escola, fetchImpl }) {
  const slug = String(escola || '').trim();
  if (!token || !slug) return null;
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + (dono || DONO_PADRAO) + '/' + (repo || REPO_PADRAO) +
    '/contents/' + PREFIXO + slug + '/' + PASTA + '.indice.json' +
    '?ref=' + encodeURIComponent(ref || REF_PADRAO);
  const r = await f(url, { method: 'GET', headers: cabecalhosDe(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('acervo: índice: HTTP ' + r.status);
  const dados = await r.json().catch(() => null);
  const cru = dados && dados.content ? textoDeBase64(dados.content) : '';
  if (!cru) return null;
  const lido = JSON.parse(cru);
  const resumos = {};
  for (const [nome, resumo] of Object.entries((lido && lido.resumos) || {})) {
    if (resumo && typeof resumo === 'object') resumos[nome] = resumo;
  }
  return { nomes: Array.isArray(lido && lido.nomes) ? lido.nomes : [], resumos };
}

module.exports = {
  PREFIXO,
  PASTA,
  CHAVE_DO_INDICE,
  ITERACOES_DO_WORKER,
  NOTA,
  DONO_PADRAO,
  REPO_PADRAO,
  REF_PADRAO,
  caminhoDaChave,
  lerCaminho,
  ehAcervoDaEscola,
  ehAnamnese,
  montarArquivoCifrado,
  abrirArquivoCifrado,
  criarAcervoDeEnvelopes,
  doAmbiente,
  combinar,
  lerIndiceDoAcervo,
};
