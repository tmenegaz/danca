#!/usr/bin/env node
'use strict';

/*
 * provar-anamnese-da-aluna-certa.js — a anamnese pertence a uma PESSOA, e quem lê sabe qual.
 *
 * O QUE ELA RELATOU (18/11/2026), depois de o cadastro da aluna ganhar `id`:
 *
 *   «Eu fiz a anamnese da aluna A com o CPF e gerei com sucesso a anamnese. Agora estou tentando
 *   criar o elenco e não consigo porque não aparece a aluna que eu fiz a anamnese. Na listagem de
 *   anamneses aparece a aluna A, que é a antiga, justamente esse o objetivo do teste. Ela é a
 *   antiga, ela aparece desvinculada, mas não aparece a aluna A nova, a que tem CPF.»
 *
 * AS TRÊS CAUSAS, e são independentes — é por isso que a prova tem três secções que reprovam
 * sozinhas:
 *
 *   1. **O ENVELOPE NÃO DECLARAVA A PESSOA.** O contexto do acto levava o apelido e mais nada, e o
 *      apelido deixou de identificar uma pessoa no dia em que a primeira «Aluno A» saiu e outra
 *      entrou. Toda a leitura caía na regra dos envelopes antigos («sem id, é do primeiro titular
 *      do apelido»), e o retrato da nova era lido como sendo o da antiga — que já não está na
 *      escola. A lista do passo 2 cruzava-o com o cadastro, não o encontrava, e calava-se.
 *   2. **O CONTEXTO ERA FILTRADO DUAS VEZES, em sítios que não sabiam um do outro.** O núcleo
 *      copiava só a lista fixa `CAMPOS_DE_CONTEXTO` (que não tinha `alunaId` nem `modalidade`), e
 *      o acervo que cifra a anamnese reconstruía o contexto com quatro campos escolhidos à mão.
 *      Nos dois sítios o que sobrava era descartado EM SILÊNCIO — nada falhava, e o documento
 *      saía a afirmar uma identidade incompleta.
 *   3. **O ESTADO DO VÍNCULO LIA A FORMA ERRADA.** `estadoDaAnamnese` procurava `a.contexto`, e as
 *      listas passam RESUMOS (campos achatados). Nunca casava: o cadastro da aluna dizia
 *      «anamnese pedida» para sempre, mesmo com a anamnese gravada — a mesma família do «sem
 *      apelido», a tela a afirmar um facto que não leu.
 *
 * O QUE SE MEDE, e cada asserção reprova sem a sua correcção:
 *
 *   A. A gravação escreve `alunaId` e `modalidade` no envelope, pela rota de verdade.
 *   B. A anamnese ANTIGA (sem id) continua a ser do primeiro titular — o acervo antigo não migra.
 *   C. A lista do passo 2 traz a aluna NOVA, e diz quantas anamneses ficaram fora do cadastro.
 *   D. O cartão do vínculo diz «concluída» quando o resumo do índice diz que a anamnese existe.
 *
 * Sem rede e sem navegador: GitHub falso em memória, KV em memória, rotas em processo.
 * **Nada toca no ar.**
 *
 *   node experimentos/provar-anamnese-da-aluna-certa.js
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const acervo = require(path.join(raiz, 'motor/servidor/acervo-envelopes.js'));
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const { criarRotas } = require(path.join(raiz, 'motor/servidor/rotas.js'));
/* O adaptador do KV que a produção usa — é ele que namespaça `envelope/x` para
 * `<escola>/envelope/x`. Usá-lo aqui, e não um mapa cru, é o que faz a bancada ver os envelopes
 * exactamente como a rota os vê. */
const { criarCloudflare } = require(path.join(raiz, 'motor/adaptadores/cloudflare.js'));

const PORTA = path.join(raiz, 'porta');
const lerConteudo = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

const ESCOLA = 'breu';
const RAIZ = 'bastidores/' + ESCOLA;
/* CPFs sintéticos e válidos — a regra da casa: um número de prova não pertence a ninguém, mas
 * também não pode ser inválido, senão a prova não mede o que diz medir. */
const CPF = { A: '11144477735', B: '22255588846' };

let total = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** O KV do Worker: `get`/`put`/`delete`/`list`, com o valor como texto. */
function criarKV(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list() { return { keys: [], list_complete: true }; },
    /* O adaptador de memória do núcleo (o `legado` do acervo) usa outro contrato — este par
     * liga-o ao mesmo mapa, para o acervo e o cadastro verem o mesmo dado. */
    async ler(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async guardar(chave, valor) { dados.set(chave, String(valor)); },
    async apagar(chave) { return dados.delete(chave); },
    async listar(prefixo) { return [...dados.keys()].filter((k) => k.startsWith(prefixo)); },
    async existe(chave) { return dados.has(chave); },
  };
}

/** O GitHub em memória: a árvore e o `contents`, que é o que o acervo lê e escreve. */
function githubDeBolso() {
  const arquivos = new Map();
  const escritos = [];
  const fetchFalso = async (url, opcoes) => {
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (String(url).indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({
        sha: 'arvore', tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: 'sha' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+?)(\?|$)/.exec(String(url));
    const caminho = m ? decodeURIComponent(m[1]) : '';
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('not found', { status: 404 });
      return new Response(JSON.stringify({
        sha: 'sha', content: Buffer.from(arquivos.get(caminho), 'utf8').toString('base64'),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    escritos.push(caminho);
    let enviado = null;
    try { enviado = JSON.parse((opcoes && opcoes.body) || '{}'); } catch { enviado = null; }
    arquivos.set(caminho, enviado && enviado.content
      ? Buffer.from(enviado.content, 'base64').toString('utf8') : '');
    return new Response(JSON.stringify({ content: { sha: 'sha' }, commit: { sha: 'commit' } }), {
      status: 201, headers: { 'content-type': 'application/json' },
    });
  };
  return { fetchFalso, arquivos, escritos };
}

/**
 * AS DUAS «ALUNO A» DO CADASTRO — a antiga, que saiu, e a nova, que tem CPF.
 *
 * É o estado real da escola dela: ela apagou as alunas, criou a nova, e as duas partilham o
 * apelido. O `pessoaId` da nova é o dela própria porque é a primeira passagem desta pessoa.
 */
function cadastroComDuasAlunoA() {
  return JSON.stringify([
    { id: 'aluno-a', apelido: 'Aluno A', criadaEm: '2026-11-01T10:00:00.000Z',
      desligadaEm: '2026-11-10T10:00:00.000Z' },
    { id: 'aluno-a-2', apelido: 'Aluno A', cpf: CPF.A, pessoaId: 'aluno-a-2',
      criadaEm: '2026-11-18T10:00:00.000Z' },
  ]);
}

function ambiente(kv, github) {
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'segredo',
    PADD_KV: kv, GITHUB_TOKEN: 'token-de-prova', SENHA_CRIPTO: 'senha-de-prova',
  };
}

/**
 * AS ROTAS DA PORTA, com o leitor do cadastro ligado — é o que a produção faz.
 *
 * `semLeitor` é o interruptor do controlo A/B da secção A: sem ele, a rota não sabe o id da
 * pessoa e não escreve nenhum, que é exactamente o comportamento de antes.
 */
function rotasDaPorta({ kv, github, semLeitor }) {
  const armazenamento = acervo.combinar(acervo.criarAcervoDeEnvelopes({
    token: 'token-de-prova', escola: ESCOLA, senhaCripto: 'senha-de-prova',
    fetchImpl: github.fetchFalso, legado: kv,
  }), kv);
  return criarRotas({
    armazenamento,
    conteudo: lerConteudo('conteudo/anamnese.json'),
    esquema: lerConteudo('envelope/elicitacao-schema.json'),
    conteudoPO: lerConteudo('po/conteudo/po.json'),
    conteudoPlano: lerConteudo('plano/conteudo/plano.json'),
    escolaDoWorker: ESCOLA,
    agora: () => '2026-11-18T19:30',
    lerAlunas: semLeitor ? undefined : async (escola) => {
      const bruto = await kv.get('bastidores/' + escola + '/alunas');
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    },
  });
}

async function pedirNaPorta(rotas, corpo) {
  const resposta = await rotas.responder(new Request('http://local/api/elicitar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  }));
  let dados = null;
  try { dados = await resposta.json(); } catch { dados = null; }
  return { status: resposta.status, dados };
}

/**
 * UM ENVELOPE DE ANAMNESE COMO ELE VIVE NO REPOSITÓRIO — metadado em claro, respostas cifradas.
 *
 * É o formato que a produção grava (`montarArquivoCifrado`), reproduzido com a MESMA cifra
 * (`tools/lib-cifra.js`) e a mesma `SENHA_CRIPTO`. Escrever um envelope em claro na bancada seria
 * medir um acervo que não existe: o caminho de leitura decifra o que encontra, e um ficheiro sem
 * `_cifrado` passaria ao lado dessa metade.
 */
async function envelopeNoRepo(github, id, contexto, geradoEm) {
  const Cifra = require(path.join(raiz, 'tools/lib-cifra.js'));
  const _cifrado = await Cifra.cifrar(JSON.stringify({ respostas: {}, notas: {} }), 'senha-de-prova');
  github.arquivos.set('escola/' + ESCOLA + '/envelopes/' + id + '.json', JSON.stringify({
    id,
    documento: 'anamnese',
    envelope: '1.3.0',
    gerado_em: geradoEm,
    contexto,
    respostas: { _cifrado },
  }, null, 2));
}

/**
 * COM O GITHUB FALSO NO LUGAR DO `fetch` DO PROCESSO.
 *
 * As rotas dos Bastidores compõem o acervo com `acervo.doAmbiente(env, {legado, escola})`, e essa
 * composição NÃO recebe um `fetchImpl`: quem serve de transporte é o `fetch` global (no Worker, o
 * do runtime). Numa bancada, isso é o que faria a prova bater na API do GitHub — e a leitura
 * voltava 401, não porque o código estivesse errado mas porque a bancada não tem token.
 *
 * Trocar o global durante a secção é o que mantém a prova a medir o caminho REAL (a rota, o
 * acervo, o índice, a derivação) em vez de substituir as peças por atalhos. É trocado e reposto no
 * `finally`: um `fetch` falso que ficasse ligado contaminaria o resto do processo.
 */
async function comGitHubFalso(fetchFalso, corpo) {
  const verdadeiro = global.fetch;
  global.fetch = fetchFalso;
  try { return await corpo(); } finally { global.fetch = verdadeiro; }
}

const CONTEXTO_DA_ANAMNESE = {
  professor: 'demi-plier', aluna: 'Aluno A', modalidade: 'Balé clássico',
};

async function principal() {
  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * A. A GRAVAÇÃO ESCREVE A PESSOA — e o controlo negativo diz de onde ela vem
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nA — a anamnese gravada hoje declara de que PESSOA ela é');
  let envelopeGravado = null;
  {
    for (const semLeitor of [false, true]) {
      const github = githubDeBolso();
      const kv = criarKV({ [RAIZ + '/alunas']: cadastroComDuasAlunoA() });
      const rotas = rotasDaPorta({ kv, github, semLeitor });
      const r = await pedirNaPorta(rotas, {
        fonte: 'anamnese',
        respostas: { apelido: { valor: 'Aluno A', origem: 'declarado' } },
        contexto: Object.assign({}, CONTEXTO_DA_ANAMNESE),
      });
      const chave = [...github.arquivos.keys()].find((k) => /anamnese-.*\.json$/.test(k));
      const gravado = chave ? JSON.parse(github.arquivos.get(chave)) : null;
      if (!semLeitor) {
        provar('a gravação da anamnese responde 200 e grava', r.status === 200
          && r.dados && r.dados.gravado === true, r.dados && (r.dados.erroDaGravacao || r.dados));
        provar('…e o contexto do envelope leva o ID DA PESSOA',
          gravado && gravado.contexto && gravado.contexto.alunaId === 'aluno-a-2',
          gravado && gravado.contexto);
        provar('…e a MODALIDADE, que é o que diz de que modalidade é esta anamnese',
          gravado && gravado.contexto && gravado.contexto.modalidade === 'Balé clássico',
          gravado && gravado.contexto);
        provar('…e o apelido continua lá, que é o rótulo que a lista mostra',
          gravado && gravado.contexto && gravado.contexto.aluna === 'Aluno A',
          gravado && gravado.contexto);
        envelopeGravado = { chave, texto: chave ? github.arquivos.get(chave) : null };
      } else {
        /* O CONTROLO NEGATIVO: sem o leitor do cadastro — que é o estado do código antes desta
         * correcção —, a gravação continua a passar e o contexto sai SEM id. É esta a asserção
         * que prova que o id não aparece por acaso. */
        provar('sem o leitor do cadastro, a gravação passa e o envelope NÃO tem id (o defeito)',
          r.dados && r.dados.gravado === true && gravado && gravado.contexto
          && !gravado.contexto.alunaId, gravado && gravado.contexto);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * B. A ANAMNESE ANTIGA CONTINUA A SER DO PRIMEIRO TITULAR
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nB — o acervo antigo não migra: o envelope sem id é do primeiro titular');
  {
    const kv = criarKV();
    const github = githubDeBolso();
    /* Um envelope dos tempos em que o contexto não declarava id nenhum — e do primeiro titular,
     * que é quem tinha este apelido quando ele foi gravado. Vive no REPOSITÓRIO, que é onde os
     * envelopes vivem desde 20/10/2026. */
    await envelopeNoRepo(github, 'anamnese-20261101-0900',
      { escola: ESCOLA, professor: 'demi-plier', aluna: 'Aluno A' }, '2026-11-01T09:00:00Z');
    const env = ambiente(kv, github);
    const legado = criarCloudflare(env);
    const armazenamento = acervo.combinar(acervo.criarAcervoDeEnvelopes({
      token: 't', escola: ESCOLA, senhaCripto: 'senha-de-prova', fetchImpl: github.fetchFalso, legado,
    }), legado);
    const estados = await comGitHubFalso(github.fetchFalso,
      () => porta.estadosDasAnamneses(armazenamento, null));
    const estado = estados['anamnese-20261101-0900'] || {};
    provar('o envelope antigo é lido, e o estado dele é «solta»',
      estado.estado === 'solta', estado.estado);
    provar('…e não declara id nenhum — a ausência é o facto, e não um id inventado',
      estado.alunaId === null || estado.alunaId === undefined, estado.alunaId);

    /* A REGRA DA DERIVAÇÃO, do lado de quem decide: o vínculo sem id também cai na derivação, e o
     * par antigo continua a casar consigo próprio. É o que impede a segunda «Aluno A» de herdar
     * esta anamnese. */
    const doPrimeiro = { aluna: 'Aluno A', modalidade: '', pedidaEm: '2026-11-01' };
    const conclusao = bastidores.estadoDaAnamnese
      ? bastidores.estadoDaAnamnese(doPrimeiro, [{
        aluna: 'Aluno A', modalidade: '', gerado_em: '2026-11-01T09:00:00Z',
      }])
      : null;
    provar('…e o vínculo do primeiro titular (sem id) casa com ele',
      conclusao && conclusao.estado === 'concluida', conclusao);

    const daSegunda = bastidores.estadoDaAnamnese
      ? bastidores.estadoDaAnamnese({ aluna: 'Aluno A', alunaId: 'aluno-a-2', modalidade: '',
        pedidaEm: '2026-11-18' }, [{ aluna: 'Aluno A', modalidade: '',
        gerado_em: '2026-11-01T09:00:00Z' }])
      : null;
    provar('…e a segunda «Aluno A» NÃO herda essa anamnese (id diferente, estado «pedida»)',
      daSegunda && daSegunda.estado === 'pedida', daSegunda);
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * C. A LISTA DO PASSO 2 TRAZ A ALUNA NOVA
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nC — o passo 2 do elenco mostra a aluna que TEM a anamnese de hoje');
  {
    /* O ACERVO COM AS DUAS ANAMNESES: a antiga (sem id, do primeiro titular, que saiu) e a nova
     * (com o id da pessoa que está na escola). É o estado em que ela ficou depois do teste. */
    const kv = criarKV({
      [RAIZ + '/alunas']: cadastroComDuasAlunoA(),
      [RAIZ + '/matriculas']: JSON.stringify([{
        id: 'aluno-a-2-bale-classico', aluna: 'Aluno A', alunaId: 'aluno-a-2',
        modalidade: 'Balé clássico', professor: 'demi-plier', pedidaEm: '2026-11-18',
      }]),
    });
    const github = githubDeBolso();
    /* As duas anamneses: a ANTIGA (do primeiro titular, sem id — ela já saiu da escola) e a de
     * HOJE (com o id da pessoa que está na escola). É o estado em que o teste dela a deixou. */
    await envelopeNoRepo(github, 'anamnese-20261101-0900',
      { escola: ESCOLA, professor: 'demi-plier', aluna: 'Aluno A' }, '2026-11-01T09:00:00Z');
    await envelopeNoRepo(github, 'anamnese-20261118-1930',
      { escola: ESCOLA, professor: 'demi-plier', aluna: 'Aluno A',
        alunaId: 'aluno-a-2', modalidade: 'Balé clássico' }, '2026-11-18T19:30:00Z');
    const env = ambiente(kv, github);
    const dados = await comGitHubFalso(github.fetchFalso, async () => {
      const r = await bastidores.fetch(
        new Request('https://breu.example/api/bastidores/alunas-com-anamnese'), env,
        { fetchImpl: github.fetchFalso });
      return r.json();
    });
    const nomes = ((dados && dados.alunas) || []).map((a) => a.aluna);
    provar('a lista do passo 2 traz a «Aluno A» que está na escola',
      JSON.stringify(nomes) === JSON.stringify(['Aluno A']), dados);
    provar('…e o carimbo é o da anamnese de HOJE, e não o da antiga',
      ((dados.alunas || [])[0] || {}).carimbo === 'anamnese-20261118-1930',
      (dados.alunas || [])[0]);
    provar('…e a resposta diz que há 1 anamnese fora do cadastro — o número não se esconde',
      dados && dados.foraDoCadastro === 1, dados && dados.foraDoCadastro);
    provar('…e `registradas` conta a aluna activa',
      dados && dados.registradas === 1, dados && dados.registradas);

    /* E O CARTÃO DO VÍNCULO, que é a outra ponta do mesmo dado: o cadastro tem de dizer que a
     * anamnese desta modalidade está feita. Era aqui que a leitura da forma errada (contexto num
     * RESUMO achatado) dizia «pedida» para sempre. */
    const matriculas = await comGitHubFalso(github.fetchFalso, async () => {
      const rm = await bastidores.fetch(
        new Request('https://breu.example/api/bastidores/matriculas'), env,
        { fetchImpl: github.fetchFalso });
      return rm.json();
    });
    const m = ((matriculas && matriculas.matriculas) || [])[0] || {};
    provar('o vínculo diz «concluída» — a anamnese desta modalidade está feita',
      m.anamnese && m.anamnese.estado === 'concluida', m.anamnese);
    provar('…e a data é a do registo, e não a do pedido',
      m.anamnese && m.anamnese.desde === '2026-11-18', m.anamnese);

    /* O RÓTULO DA OPÇÃO (20/11/2026): «Aluno A · 18/11/2026 às 19:30 · demi-plier». A data já
     * estava; o AUTOR entrou hoje, e é o que ela pediu — «quando a gente escolhe a anamnese do
     * aluno, tem que estar acompanhado ali na opção […] a data em que foi feita e o nome do
     * professor que fez a anamnese dele». A asserção não fixa o DIA (as duas anamneses disputam o
     * «vigente»), fixa a FORMA: o apelido, uma data, e quem fez. */
    const legadoC = criarCloudflare(env);
    const armC = acervo.combinar(acervo.criarAcervoDeEnvelopes({
      token: 't', escola: ESCOLA, senhaCripto: 'senha-de-prova',
      fetchImpl: github.fetchFalso, legado: legadoC,
    }), legadoC);
    const daLista = await comGitHubFalso(github.fetchFalso,
      () => porta.anamneses(armC, null, null));
    /* `anamneses()` devolve a LISTA (a rota é que a embrulha em `{opcoes}`). */
    const opcoes = Array.isArray(daLista) ? daLista : [];
    const rotulos = opcoes.map((o) => o.rotulo).join(' | ');
    provar('a opção da anamnese leva o apelido, a data e QUEM FEZ',
      opcoes.length === 1 && /^Aluno A · \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2} · \S+$/.test(opcoes[0].rotulo),
      rotulos);
    provar('…e quem fez viaja também em campo próprio',
      opcoes.length === 1 && String(opcoes[0].professorNome || '') === 'demi-plier',
      opcoes[0] && opcoes[0].professorNome);

    /* O CONTROLO NEGATIVO do id: o MESMO acervo, com o envelope novo sem `alunaId` — que é o
     * estado de ontem —, deixa a lista vazia. É a asserção que prova que a correcção é a causa. */
    const kvSemId = criarKV(Object.fromEntries(kv.dados));
    const githubSemId = githubDeBolso();
    await envelopeNoRepo(githubSemId, 'anamnese-20261101-0900',
      { escola: ESCOLA, professor: 'demi-plier', aluna: 'Aluno A' }, '2026-11-01T09:00:00Z');
    await envelopeNoRepo(githubSemId, 'anamnese-20261118-1930',
      { escola: ESCOLA, professor: 'demi-plier', aluna: 'Aluno A' }, '2026-11-18T19:30:00Z');
    const envSemId = ambiente(kvSemId, githubSemId);
    const dadosSem = await comGitHubFalso(githubSemId.fetchFalso, async () => {
      const rSem = await bastidores.fetch(
        new Request('https://breu.example/api/bastidores/alunas-com-anamnese'), envSemId,
        { fetchImpl: github.fetchFalso });
      return rSem.json();
    });
    provar('CONTROLO: sem o id no envelope, a lista esconde a aluna nova — é o defeito relatado',
      ((dadosSem && dadosSem.alunas) || []).length === 0, dadosSem);
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * D. O PRÓXIMO COLÉGIO NASCE A FUNCIONAR
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nD — nada disto é dado semeado: uma escola nova passa pelo mesmo caminho');
  {
    /* A ESCOLA NOVA é literalmente o caso acima com outro nome e um cadastro criado do zero pelo
     * caminho normal (`POST /api/bastidores/aluna`). Se a correcção estivesse nos dados da `breu`,
     * esta secção reprovava. */
    const OUTRA = 'escola-nova';
    const kv = criarKV();
    const github = githubDeBolso();
    const env = ambiente(kv, github);
    env.ESCOLA_SLUG = OUTRA;
    const entrada = await bastidores.fetch(new Request('https://novo.example/api/bastidores/validar-producao', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: 'segredo' }),
    }), env, { fetchImpl: github.fetchFalso });
    const token = (await entrada.json()).token;
    const criada = await bastidores.fetch(new Request('https://novo.example/api/bastidores/aluna', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apelido: 'Aluno A', cpf: CPF.B, token }),
    }), env, { fetchImpl: github.fetchFalso });
    const registo = await criada.json();
    provar('a escola nova cadastra a primeira «Aluno A», e ela tem id',
      criada.status === 201 && registo.id === 'aluno-a', registo);

    /* A GRAVAÇÃO da anamnese nesta escola, com o mesmo leitor — e o envelope tem de sair com o id
     * DESTA escola, sem nada herdado da `breu`. */
    const rotas = criarRotas({
      armazenamento: acervo.combinar(acervo.criarAcervoDeEnvelopes({
        token: 't', escola: OUTRA, senhaCripto: 's', fetchImpl: github.fetchFalso, legado: kv,
      }), kv),
      conteudo: lerConteudo('conteudo/anamnese.json'),
      esquema: lerConteudo('envelope/elicitacao-schema.json'),
      escolaDoWorker: OUTRA,
      agora: () => '2026-11-18T20:00',
      lerAlunas: async (escola) => {
        const bruto = await kv.get('bastidores/' + escola + '/alunas');
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
      },
    });
    const r = await pedirNaPorta(rotas, {
      fonte: 'anamnese',
      respostas: { apelido: { valor: 'Aluno A', origem: 'declarado' } },
      contexto: { professor: 'demi-plier', aluna: 'Aluno A', modalidade: 'Balé clássico' },
    });
    const chave = [...github.arquivos.keys()].find((k) => /^escola\/escola-nova\/envelopes\/anamnese-/.test(k));
    const gravado = chave ? JSON.parse(github.arquivos.get(chave)) : null;
    provar('…e a anamnese dela grava-se com o id dela, desde o primeiro dia',
      r.dados && r.dados.gravado === true && gravado
      && gravado.contexto.alunaId === 'aluno-a', gravado && gravado.contexto);
  }

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total);
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
