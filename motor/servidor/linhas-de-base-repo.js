'use strict';

/**
 * linhas-de-base-repo.js — A LINHA DE BASE NO REPOSITÓRIO, e não no KV (05/11/2026).
 *
 * PORQUE SAIU DO KV, e são três razões, todas dela:
 *
 *   1. **CUSTO E COTA.** «O KV também é custo, e esse é um espaço que o professor vai mexer
 *      muitas vezes.» A cota diária do KV já se gastou uma vez a medir sem querer, e um dado que
 *      o professor edita a cada aula não pode viver num recurso com tecto diário.
 *   2. **PROVENIÊNCIA.** «Não há série temporal. A gente tem que encontrar uma solução para isso.
 *      Essa é uma característica que vai valer muito dinheiro.» O KV guarda o estado de hoje: o
 *      «Gravar» do passo 4 faz `lista[idx] = linha` e o que existia antes desaparece. Aqui cada
 *      acto é um ARQUIVO NOVO — o passado não se reescreve, acrescenta-se, que é a lei da casa
 *      (P-03) e o que o `.fipp` já faz com os documentos.
 *   3. **O ÍNDICE E O RANQUE ENTRE ESCOLAS.** Um índice robusto e um ranque que atravesse escolas
 *      exigem que o dado seja alcançável pela mesma leitura. O KV de cada escola é uma ilha; o
 *      repositório é um só.
 *
 * O DESENHO, e porquê esta forma:
 *
 *   · O CAMINHO É A CHAVE. `escola/<escola>/linhas-de-base/<id>--<carimbo>.json`, a mesma forma
 *     dos envelopes (`escola/<escola>/envelopes/<carimbo>.json`). O `id` é o NOME da linha de base
 *     e NÃO muda entre versões — é ele que o plano guarda em `linha-de-base-alvo`, e um id que
 *     mudasse a cada envio quebraria o ponteiro do plano a cada ajuste. O `carimbo` separa as
 *     versões, e a versão VIGENTE de uma linha é a de carimbo maior.
 *
 *   · APPEND-ONLY, E O `anterior` DECLARA O ELO. Cada envio cria um arquivo novo e diz de qual
 *     veio. É a cadeia explícita, legível sem `git log` — e sobrevive a um squash, a um rebase e a
 *     uma migração, coisas que a história do Git não garante.
 *
 *   · APAGAR É UM ACTO, NÃO UM ESQUECIMENTO. O `DELETE` grava uma versão com `apagada_em`. A linha
 *     sai da lista (a versão apagada não é vigente), e o registo de que ela existiu e foi apagada
 *     fica. Uma linha de base apagada sem rasto é a única coisa que este sistema não pode ter.
 *
 *   · O RASCUNHO NÃO VIAJA. Só o acto de «Concluir e enviar para a turma» (passo 5) escreve aqui.
 *     O que o professor vai preenchendo fica no KV — é intenção, edita-se e descarta-se; o acto é
 *     facto, e é o que a turma, o plano e o PO leem. A distinção é a mesma do `aula-NN.md`
 *     (planejada) e do lançamento (dada).
 *
 * O QUE ELE **NÃO** FAZ: migrar em lote, escrever no KV, ou apagar arquivos. Um registo antigo do
 * KV continua a ser lido (`legado`), e migra na primeira vez que for concluído outra vez.
 */

const { RAIZ, base64De, textoDeBase64, detalheDe, cabecalhosDe } = require('./github-api.js');

const PREFIXO = 'escola/';
const PASTA = 'linhas-de-base/';

const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const REF_PADRAO = 'main';

/** O carimbo de um acto: `AAAAMMDD-HHMM`, a mesma forma dos envelopes. */
function carimboDe(iso) {
  const s = String(iso || new Date().toISOString());
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s);
  if (!m) return s.replace(/[^0-9]/g, '').slice(0, 12);
  return m[1] + m[2] + m[3] + '-' + m[4] + m[5];
}

/** O `id` de uma linha de base, sem acento e sem o separador das versões. */
function idDeChave(chave) {
  const nome = String(chave || '').replace(/\.json$/, '');
  const i = nome.lastIndexOf('--');
  return i === -1 ? nome : nome.slice(0, i);
}

/** O carimbo de uma chave; `''` quando a chave não o traz. */
function carimboDaChave(chave) {
  const nome = String(chave || '').replace(/\.json$/, '');
  const i = nome.lastIndexOf('--');
  return i === -1 ? '' : nome.slice(i + 2);
}

function chaveDe(id, carimbo) {
  return String(id) + '--' + String(carimbo) + '.json';
}

function caminhoDaChave(escola, chave) {
  const base = String(escola || '').replace(/[\\/]+$/, '');
  return PREFIXO + base + '/' + PASTA + String(chave).replace(/^\/+/, '');
}

/** `escola/x/linhas-de-base/y.json` → `{escola, chave}`; `null` quando não é da família. */
function lerCaminho(caminho) {
  const p = String(caminho || '');
  if (!p.startsWith(PREFIXO)) return null;
  const resto = p.slice(PREFIXO.length);
  const barra = resto.indexOf('/');
  if (barra === -1) return null;
  const escola = resto.slice(0, barra);
  const cauda = resto.slice(barra + 1);
  if (!cauda.startsWith(PASTA)) return null;
  const chave = cauda.slice(PASTA.length);
  if (!chave || chave.indexOf('/') !== -1) return null;
  return { escola, chave };
}

/**
 * O leitor/escritor. Sem `token` ele fica INERTE e diz que não leu — não finge uma lista vazia
 * (uma lista vazia silenciosa faz a escola achar que perdeu as linhas de base).
 */
function criarStore({ token, dono, repo, ref, escola, fetchImpl }) {
  const slug = String(escola || '').trim();
  const f = fetchImpl || fetch;
  const base = RAIZ + '/repos/' + (dono || DONO_PADRAO) + '/' + (repo || REPO_PADRAO);
  const cabecalhos = cabecalhosDe(token);
  const ramo = ref || REF_PADRAO;
  const comRamo = (url) => url
    + (url.indexOf('?') === -1 ? '?' : '&') + 'ref=' + encodeURIComponent(ramo);

  const lidos = new Map();   // chave → {texto, sha} | null
  let nomes = null;          // a árvore, lida no máximo uma vez por instância

  const activo = Boolean(slug && token);
  const motivo = !slug ? 'sem ESCOLA_SLUG' : (!token ? 'sem GITHUB_TOKEN' : null);

  /**
   * A CHAMADA AO GITHUB QUE NÃO ESTOURA (05/11/2026).
   *
   * O DEFEITO QUE ISTO CORRIGE, medido a 05/11/2026 no «Concluir e enviar para a turma»: um erro
   * de rede, um 5xx do GitHub ou um corpo ilegível atiravam uma EXCEPÇÃO para fora do módulo, e a
   * rota — que não tem um `catch` à volta — caía na página de erro do runtime, um HTML. O cliente
   * faz `r.json()` sobre esse HTML e mostra «Unexpected token '<', "<!DOCTYPE"…», que não é o erro:
   * é o erro a esconder-se. Uma escrita que falha tem de dizer PORQUÊ, em JSON, e é a promessa
   * que este módulo já fazia por palavras («a escrita falhada não mente») e não cumpria por código.
   */
  async function pedir(url, opcoes) {
    try {
      return await f(url, opcoes);
    } catch (erro) {
      return {
        ok: false, status: 0,
        texto: 'a chamada ao GitHub falhou: ' + (erro && erro.message ? erro.message : String(erro)),
        json: async () => null,
      };
    }
  }

  async function conteudo(chave) {
    if (lidos.has(chave)) return lidos.get(chave);
    if (!activo) { lidos.set(chave, null); return null; }
    const r = await pedir(comRamo(base + '/contents/' + caminhoDaChave(slug, chave)),
      { method: 'GET', headers: cabecalhos });
    if (r.status === 404) { lidos.set(chave, null); return null; }
    if (!r.ok) {
      throw new Error('linhas-de-base: leitura de ' + chave + ': ' + await detalheDe(r));
    }
    const dados = await r.json().catch(() => null);
    const cru = dados && dados.content ? String(dados.content) : '';
    if (!cru) throw new Error('linhas-de-base: o arquivo veio vazio: ' + chave);
    const achado = { texto: textoDeBase64(cru), sha: (dados && dados.sha) || null };
    lidos.set(chave, achado);
    return achado;
  }

  async function arvore() {
    if (nomes) return nomes;
    if (!activo) { nomes = []; return nomes; }
    const r = await pedir(base + '/git/trees/' + encodeURIComponent(ramo) + '?recursive=1',
      { method: 'GET', headers: cabecalhos });
    if (!r.ok) {
      throw new Error('linhas-de-base: não li a árvore do repositório: ' + await detalheDe(r));
    }
    const dados = await r.json().catch(() => null);
    const achadas = [];
    for (const item of (dados && dados.tree) || []) {
      if (!item || item.type !== 'blob') continue;
      const achado = lerCaminho(item.path);
      if (!achado || achado.escola !== slug) continue;
      achadas.push(achado.chave);
    }
    nomes = achadas;
    return nomes;
  }

  async function escrever(chave, texto, mensagem) {
    if (!activo) return { ok: false, erro: 'sem token ou sem escola: ' + motivo };
    const url = base + '/contents/' + caminhoDaChave(slug, chave);
    let ultimo = { ok: false, erro: 'não se tentou' };
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let sha = null;
      const atual = await pedir(comRamo(url), { method: 'GET', headers: cabecalhos });
      if (atual.status === 200) {
        const dados = await atual.json().catch(() => null);
        sha = (dados && dados.sha) || null;
      } else if (atual.status !== 404) {
        return { ok: false, status: atual.status,
          erro: 'leitura do sha: ' + await detalheDe(atual) };
      }
      const resposta = await pedir(url, {
        method: 'PUT',
        headers: cabecalhos,
        body: JSON.stringify({
          message: mensagem || ('feat(linha de base): ' + chave),
          content: base64De(texto),
          branch: ramo,
          ...(sha ? { sha } : {}),
        }),
      });
      if (resposta.status >= 200 && resposta.status < 300) {
        const dados = await resposta.json().catch(() => null);
        lidos.delete(chave);
        if (Array.isArray(nomes) && nomes.indexOf(chave) === -1) nomes.push(chave);
        return {
          ok: true,
          status: resposta.status,
          criado: !sha,
          caminho: caminhoDaChave(slug, chave),
          commit: dados && dados.commit && dados.commit.sha ? dados.commit.sha : null,
        };
      }
      if (resposta.status !== 409) {
        return { ok: false, status: resposta.status,
          erro: 'o GitHub recusou a escrita: ' + await detalheDe(resposta) };
      }
      ultimo = { ok: false, status: 409, erro: 'conflito de escrita (409) — a repetir' };
    }
    return ultimo;
  }

  /**
   * O ÍNDICE DAS VERSÕES — `escola/<escola>/linhas-de-base/.indice.json`.
   *
   * PORQUE ELE EXISTE, e é o segundo desenho desta família no mesmo dia (05/11/2026).
   *
   * A primeira versão descobria as versões pela ÁRVORE do repositório (`git/trees?recursive=1`):
   * uma chamada para saber os nomes, e depois uma leitura por ficheiro. Duas coisas a mataram.
   * A primeira foi de CUSTO: para gravar UM acto era preciso listar o repositório inteiro — e o
   * índice responde o mesmo com uma leitura só.
   *
   * **Correção de 05/11/2026, e a redação anterior desta linha estava errada.** Aqui dizia-se que
   * «a árvore respondeu 403 em produção enquanto `/contents/` continuava a funcionar». **Não era
   * isso.** O 403 era o do GitHub a toda a requisição sem cabeçalho `User-Agent`, e atingia as
   * duas chamadas por igual: este módulo nasceu com a lista de cabeçalhos montada à mão e sem esse
   * campo. Com o `User-Agent` posto (`./github-api.js`), a árvore responde 200. A observação que
   * sustentava a conclusão antiga — «o acervo dos envelopes lê-se e escreve-se pelo mesmo token» —
   * era verdadeira e não dizia o que se pensou que dizia: o acervo põe o `User-Agent`, e era essa
   * a diferença, não o endereço.
   *
   * O ACERVO DOS ENVELOPES JÁ TINHA RESOLVIDO ISTO (`envelope/.indice.json`), e a solução é a
   * mesma: um ficheiro que diz quais são as versões e o essencial de cada uma. `vigentes()`,
   * `versoes()` e `vigente(id)` passam a custar UMA leitura; a árvore fica como último recurso,
   * para o dia em que o índice ainda não exista.
   *
   * O QUE O RESUMO GUARDA, e é o mínimo que evita ler o ficheiro: `id`, `carimbo`, `arquivo`,
   * `nome`, `turma`, as datas, `aspectos` (vocabulário da anamnese — não é dado de
   * pessoa) e `alunas` como CONTAGEM. O `professor` saiu do resumo a 20/11/2026, com o campo do
   * formulário: ele não tinha desdobramento nenhum, e o registo antigo que ainda o tenha continua
   * a ler-se (o índice novo simplesmente não o escreve). O conteúdo que falta — os `campos` com nome e grupo, e os
   * apelidos que o elenco da turma precisa — lê-se do ficheiro da versão vigente, uma vez por
   * linha, e não uma vez por versão.
   *
   * A ESCRITA É LER-MODIFICAR-GRAVAR, e por isso tem a sua própria repetição no 409: dois envios
   * simultâneos fazem o segundo perder a corrida, e a versão perdida tem de voltar a entrar no
   * índice. O padrão é o do `mutar` do acervo, e não foi inventado aqui.
   */
  const CHAVE_DO_INDICE = '.indice.json';

  function resumoDe(linha, chave) {
    return {
      id: String(linha.id),
      carimbo: String(linha.carimbo || carimboDaChave(chave)),
      arquivo: caminhoDaChave(slug, chave),
      nome: linha.nome ? String(linha.nome) : null,
      turma: linha.turma ? String(linha.turma) : null,
      atualizada_em: linha.atualizada_em || null,
      enviada_em: linha.enviada_em || null,
      aspectos: (Array.isArray(linha.campos) ? linha.campos : [])
        .map((c) => String((c && typeof c === 'object' ? c.id : c) || '').trim())
        .filter(Boolean),
      alunas: Array.isArray(linha.alunas) ? linha.alunas.length : Number(linha.alunas) || 0,
      ...(linha.anterior ? { anterior: String(linha.anterior) } : {}),
      ...(linha.apagada_em ? { apagada_em: linha.apagada_em } : {}),
    };
  }

  /** O índice lido, ou `null` quando ainda não existe (a primeira vez de uma escola). */
  async function lerIndiceDeVersoes() {
    if (!activo) return null;
    let achado = null;
    try {
      achado = await conteudo(CHAVE_DO_INDICE);
    } catch (erro) {
      /* Um índice ilegível não pode derrubar a escrita: perde-se o elo (`anterior`) e recomeça-se
       * o índice, mas o acto grava-se. Perder o acto por causa da sua lista seria pior. */
      return null;
    }
    if (!achado) return null;
    try {
      const lido = JSON.parse(achado.texto);
      if (!lido || typeof lido !== 'object' || !lido.versoes) return null;
      return lido;
    } catch (erro) { return null; }
  }

  /** Grava o índice com a versão nova dentro. Repete o 409 — a versão perdida volta a entrar. */
  async function gravarNoIndice(resumo, mensagem) {
    let ultimo = { ok: false, erro: 'não se tentou' };
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const atual = await lerIndiceDeVersoes();
      const versoes = Object.assign({}, (atual && atual.versoes) || {});
      versoes[resumo.arquivo.split('/').pop()] = resumo;
      const corpo = {
        versao: 1,
        escola: slug,
        // AS CHAVES ORDENADAS: o ficheiro é comparável e o `git diff` fica legível.
        versoes: Object.keys(versoes).sort().reduce((o, k) => { o[k] = versoes[k]; return o; }, {}),
      };
      const r = await escrever(CHAVE_DO_INDICE, JSON.stringify(corpo, null, 2) + '\n',
        mensagem || 'feat(linha de base): índice das versões');
      if (r.ok) return r;
      if (r.status !== 409) return r;
      ultimo = r;
    }
    return ultimo;
  }

  /**
   * O CARIMBO LIVRE — porque DOIS ACTOS NO MESMO MINUTO NÃO PODEM SER O MESMO ARQUIVO.
   *
   * O DEFEITO QUE ISTO FECHA, medido a 09/11/2026. O carimbo é a DATA DO MINUTO
   * (`AAAAMMDD-HHMM`), e o caminho é `<id>--<carimbo>.json`. Dois actos no mesmo minuto — a
   * transferência e o «Concluir elenco» a seguir, por exemplo — caíam no MESMO ficheiro, e o
   * `escrever` (que lê o `sha` antes de gravar) **sobrescrevia-o**: o elo anterior desaparecia da
   * série, que é a única coisa que este módulo promete não fazer. Medido na bancada: o acto da
   * transferência foi substituído pelo rascunho antigo, e a aluna ficou nos dois elencos.
   *
   * A SAÍDA É O SUFIXO (`20261109-2144-2`), e não um desempate por ordem de chegada em memória:
   * a unicidade tem de valer entre pedidos diferentes, e por isso pergunta-se ao REPOSITÓRIO.
   * `carimboDaChave` e `idDeChave` partem no último `--`, e a ordenação lexicográfica continua a
   * pôr `2144-2` entre `2144` e `2145` — a série lê-se pela mesma regra.
   */
  async function carimboLivre(id, em) {
    const base = carimboDe(em);
    let carimbo = base;
    for (let n = 2; n <= 99; n++) {
      let existe = null;
      try { existe = await conteudo(chaveDe(id, carimbo)); } catch (erro) { existe = null; }
      if (!existe) return carimbo;
      carimbo = base + '-' + n;
    }
    return carimbo;
  }

  /** O corpo do acto: calcula o carimbo, lê a versão anterior e grava a nova. */
  async function concluirDeVerdade(linha, { quando, mensagem } = {}) {
    const id = String((linha && linha.id) || '').trim();
    if (!id) return { ok: false, erro: 'a linha de base não tem identificador' };
    const em = String(quando || new Date().toISOString());
    const anterior = await this.vigente(id);
    const carimbo = await carimboLivre(id, em);
    const chave = chaveDe(id, carimbo);
    const corpo = Object.assign({}, linha, {
      id,
      carimbo,
      enviada_em: String((linha && linha.enviada_em) || em),
      ...(anterior ? { anterior: anterior.chave } : {}),
      gravada_em: em,
    });
    const r = await escrever(chave, JSON.stringify(corpo, null, 2) + '\n', mensagem);
    if (!r.ok) return r;
    /* O ÍNDICE DEPOIS DO FICHEIRO, e nesta ordem: se a segunda escrita falhar, a versão existe e o
     * índice é que fica atrás — recuperável pela árvore ou pela próxima escrita; ao contrário,
     * haveria uma entrada a apontar para um ficheiro que não existe. */
    const doIndice = await gravarNoIndice(resumoDe(corpo, chave),
      'feat(linha de base): índice — ' + id + ' ' + carimbo);
    return Object.assign({}, r, {
      chave, carimbo, linha: corpo,
      anterior: anterior ? anterior.chave : null,
      ...(doIndice.ok ? {} : { avisoIndice: doIndice.erro || 'o índice não foi actualizado' }),
    });
  }

  /** O corpo do apagar: uma versão que diz que a linha foi apagada, com a data e por quem. */
  async function apagarDeVerdade(id, { quando, por } = {}) {
    const alvo = await this.vigente(id);
    if (!alvo) return { ok: false, erro: 'linha de base não encontrada: ' + id };
    const em = String(quando || new Date().toISOString());
    // A LÁPIDE TAMBÉM PODE CAIR NO MESMO MINUTO — a mesma regra, e ela apagaria um acto.
    const carimbo = await carimboLivre(String(id), em);
    const chave = chaveDe(String(id), carimbo);
    const corpo = Object.assign({}, alvo, {
      id: String(id),
      carimbo,
      apagada_em: em,
      ...(por ? { apagada_por: String(por) } : {}),
      anterior: alvo.chave,
    });
    delete corpo.chave;
    const r = await escrever(chave, JSON.stringify(corpo, null, 2) + '\n',
      'chore(linha de base): apagar ' + id);
    if (!r.ok) return r;
    const doIndice = await gravarNoIndice(resumoDe(corpo, chave),
      'chore(linha de base): índice — apagar ' + id);
    return Object.assign({}, r, {
      chave, carimbo, apagada: corpo,
      ...(doIndice.ok ? {} : { avisoIndice: doIndice.erro || 'o índice não foi actualizado' }),
    });
  }

  return {
    activo,
    motivo,
    escola: slug,

    /**
     * A LISTA DE VERSÕES — `Map<chave, resumo>`, do ÍNDICE em ficheiro.
     *
     * UMA LEITURA, e é a diferença que este desenho faz. A versão anterior deste módulo perguntava
     * à ÁRVORE do repositório (uma chamada ao repositório inteiro) e depois lia cada ficheiro. O
     * 403 que se lhe atribuiu em 05/11/2026 **não era da árvore**: era do `User-Agent` que faltava
     * nos cabeçalhos deste módulo, e que agora vem de `./github-api.js`. A árvore funciona — e
     * continua a ser o ÚLTIMO RECURSO, por uma razão de custo: só se usa quando o índice ainda não
     * existe, que é a primeira vez de uma escola.
     *
     * `fonte` diz de onde veio, e a resposta da estante mostra-o: quem lê precisa de saber se está
     * a ver o índice ou uma reconstrução, e um silêncio aqui é o que faz um dado parecer perdido.
     */
    async lista() {
      const indice = await lerIndiceDeVersoes();
      if (indice) {
        const por = new Map();
        for (const [chave, resumo] of Object.entries(indice.versoes || {})) {
          if (!resumo || typeof resumo !== 'object') continue;
          por.set(chave, resumo);
        }
        return { fonte: 'indice', versoes: por, aviso: null };
      }
      /* O RECURSO: a árvore. Se ela também recusar, a lista é vazia E DIZ-SE — uma lista vazia
       * silenciosa lê-se como «as linhas de base desapareceram». */
      try {
        const por = new Map();
        for (const chave of await arvore()) {
          const achado = await conteudo(chave);
          if (!achado) continue;
          try {
            const linha = JSON.parse(achado.texto);
            if (!linha || typeof linha !== 'object') continue;
            por.set(chave, resumoDe(Object.assign({}, linha, {
              id: linha.id || idDeChave(chave),
              carimbo: carimboDaChave(chave),
            }), chave));
          } catch (erro) { /* um arquivo ilegível não derruba a lista */ }
        }
        return { fonte: 'arvore', versoes: por, aviso: null };
      } catch (erro) {
        return {
          fonte: 'nenhuma', versoes: new Map(),
          aviso: 'não li as versões: ' + (erro && erro.message ? erro.message : String(erro)),
        };
      }
    },

    /** As CHAVES de todas as versões, da mais recente para a mais antiga. */
    async chaves() {
      const { versoes } = await this.lista();
      return [...versoes.keys()].sort((a, b) => carimboDaChave(b).localeCompare(carimboDaChave(a)));
    },

    /**
     * TODAS as versões, como RESUMOS — sem ler um ficheiro por versão.
     *
     * O resumo tem o que a série e o índice gerado precisam: o carimbo, a data, os `aspectos`
     * daquele momento e a contagem de alunas. O que ele NÃO tem — `campos` com nome e grupo, e os
     * apelidos — lê-se do ficheiro da versão vigente (`vigente`, abaixo), uma vez por linha.
     */
    async versoes() {
      const { versoes } = await this.lista();
      return [...versoes.values()]
        .slice()
        .sort((a, b) => String(b.carimbo || '').localeCompare(String(a.carimbo || '')));
    },

    /**
     * A VIGENTE DE CADA LINHA — a versão de carimbo maior que não foi apagada, JÁ LIDA do
     * ficheiro (porque quem a pede quer os campos e as alunas).
     *
     * A ORDEM É O CARIMBO, e não a data que o ficheiro diz: o carimbo é do NOME, e um relógio
     * errado numa máquina não reordena o passado.
     */
    async vigentes() {
      const { versoes } = await this.lista();
      const porId = new Map();
      for (const r of versoes.values()) {
        const id = String(r.id || idDeChave(r.arquivo || '') || '');
        if (!id) continue;
        const atual = porId.get(id);
        if (!atual || String(r.carimbo || '') > String(atual.carimbo || '')) porId.set(id, r);
      }
      /* A LÁPIDE APAGA A LINHA, e não só a si mesma — se a versão MAIS RECENTE de um id é uma
       * lápide, a linha está apagada, e não se procura mais atrás. Foi o primeiro erro desta
       * família, apanhado pela prova: saltar só a lápide promovia a versão anterior. */
      /* AS LINHAS LÊEM-SE AO MESMO TEMPO (13/11/2026). Era um `for` com `await` por linha: cada
       * ficheiro esperava o anterior, e uma escola com quatro linhas pagava quatro viagens ao
       * GitHub em fila — a soma, e não o máximo. São ficheiros INDEPENDENTES, e é isso que
       * `Promise.all` diz. A ordem do resultado é a mesma (o `map` a garante), e o custo em
       * pedidos não muda: muda só o tempo de espera. Medido na lista da anamnese, que era a mais
       * rápida das três e mesmo assim levava 2,4 s. */
      const alvos = [...porId.values()].filter((r) => !r.apagada_em);
      const completas = await Promise.all(alvos.map((r) => this.vigente(r.id)));
      const vigentes = [];
      for (const completa of completas) if (completa) vigentes.push(completa);
      return vigentes;
    },

    /** A versão vigente de UMA linha, lida do ficheiro — `null` quando não existe ou está apagada. */
    async vigente(id) {
      const alvo = String(id || '').trim();
      if (!alvo) return null;
      const { versoes } = await this.lista();
      let escolhida = null;
      for (const r of versoes.values()) {
        const dono = String(r.id || idDeChave(r.arquivo || '') || '');
        if (dono !== alvo) continue;
        if (!escolhida || String(r.carimbo || '') > String(escolhida.carimbo || '')) escolhida = r;
      }
      if (!escolhida || escolhida.apagada_em) return null;
      const chave = String(escolhida.arquivo || '').split('/').pop();
      if (!chave) return null;
      try {
        const achado = await conteudo(chave);
        if (!achado) return null;
        const linha = JSON.parse(achado.texto);
        if (!linha || linha.apagada_em) return null;
        return Object.assign({}, linha, { id: alvo, carimbo: carimboDaChave(chave), chave });
      } catch (erro) { return null; }
    },

    /**
     * O ACTO. Grava uma versão NOVA — nunca reescreve a anterior — e devolve a chave dela.
     *
     * O `anterior` é a chave da versão vigente no momento, e vai dentro do ficheiro: é o elo
     * explícito da cadeia. Se a gravação falhar, o KV continua a ter o rascunho — e o servidor
     * responde com o erro em vez de dizer que concluiu.
     *
     * NÃO ESTOURA: devolve `{ok:false, erro}`. Medido a 05/11/2026 no «Concluir e enviar para a
     * turma» — uma excepção aqui subia até ao runtime, que responde uma página de erro em HTML,
     * e o cliente a fazer `r.json()` sobre ela mostra «Unexpected token '<', "<!DOCTYPE"…». O erro
     * verdadeiro ficava escondido atrás do erro de leitura. Quem escreve para uma API responde
     * JSON, sempre.
     */
    async concluir(linha, { quando, mensagem } = {}) {
      try {
        return await concluirDeVerdade.call(this, linha, { quando, mensagem });
      } catch (erro) {
        return { ok: false, erro: erro && erro.message ? erro.message : String(erro) };
      }
    },

    /**
     * APAGAR É UM ACTO: uma versão com `apagada_em`. A linha sai da lista; o rasto fica.
     * Pela mesma razão do `concluir`, também não estoura.
     */
    async apagar(id, { quando, por } = {}) {
      try {
        return await apagarDeVerdade.call(this, id, { quando, por });
      } catch (erro) {
        return { ok: false, erro: erro && erro.message ? erro.message : String(erro) };
      }
    },

    /** A história de UMA linha, da mais recente para a mais antiga. */
    async historia(id) {
      const alvo = String(id || '').trim();
      const lista = [];
      for (const chave of (await this.chaves()).filter((c) => idDeChave(c) === alvo)) {
        try {
          const achado = await conteudo(chave);
          if (!achado) continue;
          const linha = JSON.parse(achado.texto);
          if (!linha) continue;
          lista.push(Object.assign({}, linha, { id: alvo, carimbo: carimboDaChave(chave), chave }));
        } catch (erro) { /* fica de fora */ }
      }
      return lista;
    },
  };
}

/** O store a partir do `env` do Worker — a única porta que a Produção e a ponte usam. */
function doAmbiente(env, escola, fetchImpl) {
  const e = env || {};
  return criarStore({
    token: e.GITHUB_TOKEN,
    dono: e.GITHUB_DONO || DONO_PADRAO,
    repo: e.GITHUB_REPO || REPO_PADRAO,
    ref: e.GITHUB_REF || REF_PADRAO,
    escola: escola || e.ESCOLA_SLUG,
    // O ORÇAMENTO DO PEDIDO, quando a ponte o tem (09/11/2026). Sem isto, o store leria o
    // repositório por fora do contador, e a cadeia — que corre no mesmo pedido — julgaria ter
    // mais folga do que tem. `null` mantém o caminho das bancadas.
    fetchImpl: fetchImpl || null,
  });
}

module.exports = {
  PREFIXO,
  PASTA,
  DONO_PADRAO,
  REPO_PADRAO,
  REF_PADRAO,
  carimboDe,
  idDeChave,
  carimboDaChave,
  chaveDe,
  caminhoDaChave,
  lerCaminho,
  criarStore,
  doAmbiente,
};
