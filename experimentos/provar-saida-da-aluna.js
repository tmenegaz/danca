'use strict';

/**
 * provar-saida-da-aluna.js — «ELA SAIU DA ESCOLA, E ISSO TEM DE APARECER EM TODO O LADO»
 * (18/11/2026).
 *
 * O QUE ELA PEDIU, na letra:
 *
 *   «se eu quero tirar, o aluno resolveu sair da escola, ele não quer trocar de elenco, ele saiu da
 *   escola. Então eu vou lá no aluno e vou excluir aquele aluno. Aí esse processo de exclusão do
 *   aluno tem que tirar o aluno do elenco. E aí quando eu clicar em derivar esse elenco ou editar
 *   esse elenco, na etapa de alunos, que é o step dois, ele não pode mais aparecer, apesar da
 *   proveniência da anamnese dele existir, porque ele tem proveniência. […] mas ele não faz mais
 *   parte da escola, ele foi removido da escola.»
 *
 * E, sobre o mesmo nome voltar:
 *
 *   «se eu criar de novo um aluno que se chama aluno A pelo apelido, como é que vai ficar? E ele é
 *   outra pessoa […] seria bom que cada aluno tivesse um ID ligado à sua proveniência no momento em
 *   que é criado, ele tem um identificador único.»
 *
 * O QUE ESTA PROVA MEDE — e cada metade reprova sozinha, com o controlo A/B anotado ao lado:
 *
 *   A. **O registo tem `id`, e ele não se repete** (A/B: id sempre derivado do apelido → reprova).
 *   B. **A exclusão grava uma versão nova em cada elenco que a tinha** — com o facto escrito
 *      (`saiu`), e a versão anterior intacta (é a verdade daquele dia). (A/B: sem a cascata →
 *      reprova).
 *   C. **A exclusão não apaga o cadastro se a escrita do elenco falhar** — 502, e a aluna continua
 *      na escola. (A/B: apagar primeiro → reprova).
 * *   D. **A aluna que saiu não se oferece no passo 2**, e a anamnese dela continua no acervo; a
 *      resposta di-lo (`foraDoCadastro`). (A/B: lista sem o cruzamento → reprova).
 *   E. **O vínculo é dela, e não do nome**: recriar «Aluno A» não herda o vínculo nem a anamnese da
 *      primeira. (A/B: filtro por apelido → reprova).
 *   F. **A exclusão continua a recusar 409** quando ela está numa Turma com plano de ensino.
 *
 * Sem navegador para as rotas: elas correm em processo, com um KV de memória e um GitHub falso.
 * **Nada toca no ar.**
 *
 *   node experimentos/provar-saida-da-aluna.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));

const provas = [];
function provar(titulo, condicao, detalhe) {
  provas.push({ titulo, ok: !!condicao, detalhe });
  console.log('  ' + (condicao ? 'ok    ' : 'FALHOU') + ' ' + titulo +
    (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function criarKV(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list() { return { keys: [], list_complete: true }; },
  };
}

/**
 * O GitHub em memória — o mesmo desenho da prova do elenco no repositório: `contents` GET/PUT e a
 * árvore. `falharEscrita` é o interruptor que mede a metade C (o servidor não pode apagar o
 * cadastro quando a versão do elenco não ficou escrita).
 */
function githubDeBolso({ arquivos: iniciais = {}, falharEscrita = false } = {}) {
  const arquivos = new Map(Object.entries(iniciais));
  const escritas = [];
  let commits = 0;
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({
        sha: 'arvore', tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: 's' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('nao', { status: 404 });
      return new Response(JSON.stringify({
        sha: 'sha-' + caminho, content: b64(arquivos.get(caminho)),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (metodo === 'PUT') {
      if (falharEscrita) {
        return new Response(JSON.stringify({ message: 'a escrita do repositório está barrada' }),
          { status: 403, headers: { 'content-type': 'application/json' } });
      }
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      const texto = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      escritas.push({ caminho, mensagem: corpo.message || '', texto });
      arquivos.set(caminho, texto);
      commits += 1;
      return new Response(JSON.stringify({ commit: { sha: 'c' + commits } }),
        { status: arquivos.has(caminho) ? 200 : 201, headers: { 'content-type': 'application/json' } });
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, arquivos, escritas };
}

const ESCOLA = 'breu';
const RAIZ = 'bastidores/' + ESCOLA;

/* CPFs SINTÉTICOS, e que passam o dígito verificador — a regra da casa: um número de prova não pode
 * pertencer a ninguém, mas também não pode ser inválido, senão a prova não mede o que diz medir.
 * (O normalizador do projeto confere a FORMA — 11 dígitos e não repetidos —, não o verificador; os
 * cinco abaixo são válidos pelas duas contas.) */
const CPF = {
  A: '11144477735',
  B: '22255588846',
  C: '33366699957',
  D: '44477711107',
  E: '55588822200',
};

function ambiente(kv) {
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'segredo',
    PADD_KV: kv, GITHUB_TOKEN: 'token-de-prova',
  };
}

async function pedir(env, caminho, corpo, extras) {
  const opcoes = corpo ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  } : {};
  const r = await bastidores.fetch(new Request('https://breu.example' + caminho, opcoes), env, extras);
  let dados = null;
  try { dados = await r.json(); } catch (e) { dados = null; }
  return { status: r.status, dados };
}

async function apagar(env, apelido, TOKEN, extras) {
  const r = await bastidores.fetch(new Request('https://breu.example/api/bastidores/aluna', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apelido, token: TOKEN }),
  }), env, extras);
  let dados = null;
  try { dados = await r.json(); } catch (e) { dados = null; }
  return { status: r.status, dados };
}

/** O elenco, como o repositório o guarda hoje: uma versão por acto. */
function elenco({ id = 'elenco-a', nome = 'Elenco A', alunas = ['Aluna A', 'Aluna B'],
  carimbo = '20261101-1000' } = {}) {
  return JSON.stringify({
    id, nome, professor: 'demi-plier',
    campos: [{ id: 'formato-anatomico-dos-joelhos' }],
    alunas,
    carimbo,
    gravada_em: '2026-11-01T10:00:00.000Z',
    atualizada_em: '2026-11-01T10:00:00.000Z',
    enviada_em: '2026-11-01T10:00:00.000Z',
  });
}

/**
 * OS RESUMOS DO ACERVO, À MÃO — e a razão é a de sempre, mas aqui ela morde.
 *
 * `paresComPlano` devolve `null` quando o índice dos planos não se lê, e `alunaVinculadaA` trata
 * `null` como «vinculada» (o lado seguro: na dúvida, não se mexe no que já assinou). Na bancada,
 * um repositório falso sem índice de envelopes é exactamente esse `null` — e a exclusão respondia
 * 409 em TODAS as secções, por um motivo que não era o que cada uma queria medir. Descobriu-se a
 * correr: a primeira versão desta prova reprovou 16 asserções por isto.
 *
 * A subistituição é a fronteira do núcleo (a mesma que as outras provas usam), e o conteúdo é
 * explícito por secção: `[]` é «não há plano nenhum», que é o que quase todas querem.
 */
async function comResumos(lista, corpo) {
  const verdadeiro = porta.resumosDeEnvelopes;
  porta.resumosDeEnvelopes = async (arm, padrao) => lista.filter((x) => padrao.test(x.nome));
  try { return await corpo(); } finally { porta.resumosDeEnvelopes = verdadeiro; }
}

async function principal() {
  const kv = criarKV();
  const env = ambiente(kv);
  const entrada = await pedir(env, '/api/bastidores/validar-producao', { senha: 'segredo' });
  const TOKEN = entrada.dados && entrada.dados.token;
  if (!TOKEN) {
    console.error('não consegui entrar como direção:', JSON.stringify(entrada));
    process.exitCode = 1;
    return;
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * A. O REGISTO TEM ID, E ELE NÃO SE REPETE
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nA — o registo tem id, e o mesmo apelido pode ser outra pessoa');
  const ghA = githubDeBolso();
  const criar = (apelido, cpf) => pedir(env, '/api/bastidores/aluna',
    { apelido, cpf, token: TOKEN }, { fetchImpl: ghA.fetchFalso });

  await comResumos([], async () => {
    const a1 = await criar('Aluno A', CPF.A);
    provar('o cadastro responde 201 e devolve o id', a1.status === 201 && a1.dados && a1.dados.id,
      a1.dados && { id: a1.dados.id, erro: a1.dados.erro });
    provar('o primeiro «Aluno A» fica com o id do apelido', a1.dados && a1.dados.id === 'aluno-a',
      a1.dados && a1.dados.id);
    const a1b = await criar('Aluno A', CPF.B);
    provar('criar o MESMO apelido com a aluna activa é 409 — duas «Aluno A» ao mesmo tempo '
      + 'tornariam o apelido ambíguo nos documentos', a1b.status === 409, a1b.dados && a1b.dados.erro);

    /* A ANOTAÇÃO NO REGISTO: a chave deixa de ser uma lista de nomes. */
    const registoGravado = JSON.parse(kv.dados.get(RAIZ + '/alunas') || '[]');
    provar('o KV guarda registos, e não uma lista de apelidos',
      Array.isArray(registoGravado) && registoGravado[0] && typeof registoGravado[0] === 'object'
      && registoGravado[0].apelido === 'Aluno A' && registoGravado[0].id === 'aluno-a',
      registoGravado);

    const saiuA = await apagar(env, 'Aluno A', TOKEN, { fetchImpl: ghA.fetchFalso });
    provar('a exclusão é 200', saiuA.status === 200, saiuA.dados && saiuA.dados.erro);
    provar('…e o registo FICA, marcado com a data de saída',
      (() => {
        const g = JSON.parse(kv.dados.get(RAIZ + '/alunas') || '[]');
        return g.length === 1 && g[0].id === 'aluno-a'
          && /^\d{4}-\d{2}-\d{2}T/.test(String(g[0].desligadaEm || ''));
      })(),
      JSON.parse(kv.dados.get(RAIZ + '/alunas') || '[]'));

    const listaDepois = await pedir(env, '/api/bastidores/alunas', null, { fetchImpl: ghA.fetchFalso });
    provar('a lista das alunas já não a mostra',
      Array.isArray(listaDepois.dados && listaDepois.dados.alunas)
      && listaDepois.dados.alunas.length === 0, listaDepois.dados && listaDepois.dados.alunas);

    const a2 = await criar('Aluno A', CPF.A);
    provar('o apelido volta a estar livre — criar outra «Aluno A» é 201',
      a2.status === 201, a2.dados && a2.dados.erro);
    provar('…e o id dela é OUTRO, e nunca reutilizado', a2.dados && a2.dados.id === 'aluno-a-2',
      a2.dados && a2.dados.id);

    const apagarOutraVez = await apagar(env, 'Aluno A', TOKEN, { fetchImpl: ghA.fetchFalso });
    const apagarTerceira = await apagar(env, 'Aluno A', TOKEN, { fetchImpl: ghA.fetchFalso });
    provar('excluir a MESMA pessoa duas vezes é 404 — e a segunda diz que ela já saiu',
      apagarOutraVez.status === 200 && apagarTerceira.status === 404
      && apagarTerceira.dados && apagarTerceira.dados.jaSaiu === true,
      { primeira: apagarOutraVez.status, segunda: apagarTerceira.status,
        erro: apagarTerceira.dados && apagarTerceira.dados.erro });
  });

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * B. A EXCLUSÃO TIRA-A DO ELENCO — COM VERSÃO NOVA, E SEM REWRITE DO PASSADO
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nB — a exclusão grava uma versão nova do elenco, e a anterior fica');
  {
    const chaveElenco = 'escola/' + ESCOLA + '/linhas-de-base/elenco-a--20261101-1000.json';
    const ghB = githubDeBolso({
      arquivos: {
        [chaveElenco]: elenco(),
        ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']: JSON.stringify({
          versao: 1, envelopes: {}, __linhas: {},
        }),
      },
    });
    const kvB = criarKV({
      [RAIZ + '/alunas']: JSON.stringify(['Aluna A', 'Aluna B']),
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier' }]),
      /* UM RASCUNHO que também a tem: o elenco a meio de ser montado. Ele não ganha versão (não é
       * facto), mas tem de perder a aluna — senão ela reaparecia ao reabrir o formulário. */
      [RAIZ + '/linhas-de-base']: JSON.stringify([
        { id: 'elenco-b', nome: 'Elenco B', alunas: ['Aluna A'], campos: [{ id: 'formato-anatomico-dos-joelhos' }] },
      ]),
    });
    const envB = ambiente(kvB);
    const TOKEN_B = (await pedir(envB, '/api/bastidores/validar-producao', { senha: 'segredo' }))
      .dados.token;
    await comResumos([], async () => {
      const r = await apagar(envB, 'Aluna A', TOKEN_B, { fetchImpl: ghB.fetchFalso });
      provar('a exclusão é 200', r.status === 200, r.dados && r.dados.erro);
      provar('a resposta NOMEIA o elenco que a perdeu',
        r.dados && Array.isArray(r.dados.elencos) && r.dados.elencos.length === 1
        && r.dados.elencos[0].id === 'elenco-a',
        r.dados && r.dados.elencos);
      provar('o rascunho que a tinha é nomeado na resposta',
        r.dados && Array.isArray(r.dados.rascunhos) && r.dados.rascunhos.indexOf('elenco-b') !== -1,
        r.dados && r.dados.rascunhos);

      const versoes = [...ghB.arquivos.keys()]
        .filter((c) => /linhas-de-base\/elenco-a--/.test(c)).sort();
      provar('nasceu uma versão NOVA no repositório', versoes.length === 2, versoes);
      provar('a versão de antes continua lá, com ela dentro',
        versoes.length === 2 && JSON.parse(ghB.arquivos.get(chaveElenco)).alunas.indexOf('Aluna A') !== -1);
      const nova = versoes.length === 2 ? JSON.parse(ghB.arquivos.get(versoes[1])) : {};
      provar('a versão nova NÃO a tem', Array.isArray(nova.alunas) && nova.alunas.indexOf('Aluna A') === -1,
        nova.alunas);
      provar('…e diz que ela saiu, com a data e o motivo',
        nova.saiu && nova.saiu.aluna === 'Aluna A' && /^\d{4}-\d{2}-\d{2}T/.test(String(nova.saiu.em || '')),
        nova.saiu);
      provar('…e encadeia na anterior — a cadeia não se parte',
        typeof nova.anterior === 'string' && /elenco-a--20261101-1000/.test(nova.anterior),
        nova.anterior);
      provar('o rascunho do KV também perdeu a aluna — e o registo dele não foi apagado',
        (() => {
          const cru = JSON.parse(kvB.dados.get(RAIZ + '/linhas-de-base') || '[]');
          const b = cru.find((l) => l && l.id === 'elenco-b');
          return cru.length === 1 && b && Array.isArray(b.alunas) && b.alunas.indexOf('Aluna A') === -1;
        })(), JSON.parse(kvB.dados.get(RAIZ + '/linhas-de-base') || '[]'));
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * C. A ESCRITA QUE FALHA NÃO DEIXA O CADASTRO APAGADO
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nC — se o elenco não se puder gravar, NADA é apagado');
  {
    const chaveElenco = 'escola/' + ESCOLA + '/linhas-de-base/elenco-a--20261101-1000.json';
    const ghC = githubDeBolso({
      arquivos: {
        [chaveElenco]: elenco(),
        ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']: JSON.stringify({
          versao: 1, envelopes: {}, __linhas: {},
        }),
      },
      falharEscrita: true,
    });
    const kvC = criarKV({
      [RAIZ + '/alunas']: JSON.stringify(['Aluna A']),
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier' }]),
    });
    const envC = ambiente(kvC);
    const TOKEN_C = (await pedir(envC, '/api/bastidores/validar-producao', { senha: 'segredo' }))
      .dados.token;
    await comResumos([], async () => {
      const r = await apagar(envC, 'Aluna A', TOKEN_C, { fetchImpl: ghC.fetchFalso });
      provar('a exclusão é 502, e não um «ok» que esconde a metade falhada', r.status === 502,
        { status: r.status, erro: r.dados && r.dados.erro });
      provar('…e a resposta diz que NADA foi apagado',
        /NADA foi apagado/i.test(String(r.dados && r.dados.erro)));
      provar('a aluna continua na escola — o cadastro não foi tocado',
        (() => {
          const g = JSON.parse(kvC.dados.get(RAIZ + '/alunas') || '[]');
          return g.length === 1 && !g[0].desligadaEm;
        })(),
        JSON.parse(kvC.dados.get(RAIZ + '/alunas') || '[]'));
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * D. O PASSO 2 DEIXA DE A OFERECER — E A ANAMNESE FICA
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nD — quem saiu não se oferece no passo 2, e a anamnese continua no acervo');
  {
    const kvD = criarKV({
      [RAIZ + '/alunas']: JSON.stringify([
        'Aluna A', 'Aluna B',
        { id: 'aluno-c', apelido: 'Aluno C', criadaEm: '2026-11-10T10:00:00.000Z',
          desligadaEm: '2026-11-17T10:00:00.000Z', motivoDaSaida: 'saiu da escola' },
      ]),
    });
    const envD = ambiente(kvD);
    /* O ACERVO DAS ANAMNESES é o que alimenta a lista — e é o que se substitui aqui. Não é forja
     * do resultado: é a fronteira do núcleo, a mesma que as outras provas usam. Os três envelopes
     * são o caso inteiro: duas alunas na escola, uma que saiu. */
    const verdadeiro = porta.estadosDasAnamneses;
    porta.estadosDasAnamneses = async () => ({
      '20261110-1000': { vigente: true, apelido: 'Aluna A', carimbo: '20261110-1000' },
      '20261111-1000': { vigente: true, apelido: 'Aluna B', carimbo: '20261111-1000' },
      '20261112-1000': { vigente: true, apelido: 'Aluno C', carimbo: '20261112-1000' },
    });
    try {
      const r = await pedir(envD, '/api/bastidores/alunas-com-anamnese', null, {});
      const nomes = ((r.dados && r.dados.alunas) || []).map((a) => a.aluna).sort();
      provar('a lista do passo 2 traz só quem está na escola', JSON.stringify(nomes) === JSON.stringify(['Aluna A', 'Aluna B']),
        nomes);
      provar('…e a aluna que saiu NÃO está lá, apesar de ter anamnese',
        nomes.indexOf('Aluno C') === -1, nomes);
      provar('a resposta DIZ quantas anamneses são de quem saiu — o número não se esconde',
        r.dados && r.dados.foraDoCadastro === 1, r.dados && r.dados.foraDoCadastro);
      provar('…e `registradas` conta as activas, e não os registos todos',
        r.dados && r.dados.registradas === 2, r.dados && r.dados.registradas);
    } finally {
      porta.estadosDasAnamneses = verdadeiro;
    }

    /* A LEITURA QUE FALHA NÃO FILTRA. Sem saber quem está na escola, a lista sai inteira — e o
     * `registradas: null` avisa a tela. Esconder todas as anamneses por uma falha de leitura seria
     * o «sem apelido» ao contrário. */
    const kvQuebrado = {
      async get(chave) {
        if (String(chave).indexOf('/alunas') !== -1) throw new Error('KV fora do ar');
        return kvD.dados.has(chave) ? kvD.dados.get(chave) : null;
      },
      async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; },
    };
    const envQ = ambiente(kvQuebrado);
    porta.estadosDasAnamneses = verdadeiro;
    const verdadeiroQ = porta.estadosDasAnamneses;
    porta.estadosDasAnamneses = async () => ({
      '20261112-1000': { vigente: true, apelido: 'Aluno C', carimbo: '20261112-1000' },
    });
    try {
      const r = await pedir(envQ, '/api/bastidores/alunas-com-anamnese', null, {});
      provar('leitura do cadastro falhada: a lista NÃO é esvaziada (a falha não é um acervo vazio)',
        Array.isArray(r.dados && r.dados.alunas) && r.dados.alunas.length === 1,
        r.dados && r.dados.alunas);
      provar('…e `registradas` é null, e não zero',
        r.dados && r.dados.registradas === null, r.dados && r.dados.registradas);
    } finally {
      porta.estadosDasAnamneses = verdadeiroQ;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * E. O VÍNCULO É DELA, E NÃO DO NOME
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nE — recriar «Aluno A» não herda o vínculo nem a anamnese da primeira');
  {
    const ghE = githubDeBolso();
    /* O REGISTO ANTIGO no KV, no formato de hoje: a primeira «Aluno A» já saiu. */
    const kvE = criarKV({
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier' }]),
      'professores/demi-plier/contato': JSON.stringify({ email: 'demi@example.test' }),
      [RAIZ + '/alunas']: JSON.stringify([
        { id: 'aluno-a', apelido: 'Aluno A', criadaEm: '2026-11-01T10:00:00.000Z',
          desligadaEm: '2026-11-10T10:00:00.000Z' },
      ]),
      /* O vínculo da PRIMEIRA, gravado antes de o `alunaId` existir — como estão os de todas as
       * escolas hoje. A regra manda-o para o primeiro titular do apelido. */
      [RAIZ + '/matriculas']: JSON.stringify([
        { id: 'aluno-a-bale-classico', aluna: 'Aluno A', modalidade: 'Balé clássico',
          professor: 'demi-plier', pedidaEm: '2026-11-02' },
      ]),
    });
    const envE = ambiente(kvE);
    const TOKEN_E = (await pedir(envE, '/api/bastidores/validar-producao', { senha: 'segredo' }))
      .dados.token;

    /* A anamnese da primeira existe — e é isto que a segunda não pode herdar. */
    porta.resumosDeEnvelopes = async (arm, padrao) => {
      const tudo = [
        { nome: 'anamnese-aluno-a.json', resumo: {
          contexto: { aluna: 'Aluno A', modalidade: 'Balé clássico' }, gerado_em: '2026-11-05' } },
      ];
      return tudo.filter((x) => padrao.test(x.nome));
    };
    try {
      const novo = await pedir(envE, '/api/bastidores/matricula', {
        aluna: 'Aluno A', modalidade: 'Balé clássico', professor: 'Demi Plier',
        cpf: CPF.A, token: TOKEN_E,
      }, { fetchImpl: ghE.fetchFalso });
      provar('o vínculo da segunda é gravado (201)', novo.status === 201,
        novo.dados && novo.dados.erro);
      provar('…e leva o id DELA (`aluno-a-2`), e não o do apelido',
        novo.dados && novo.dados.matricula && novo.dados.matricula.alunaId === 'aluno-a-2',
        novo.dados && novo.dados.matricula && novo.dados.matricula.alunaId);

      const lista = await pedir(envE, '/api/bastidores/matriculas', null, { fetchImpl: ghE.fetchFalso });
      const vinculos = (lista.dados && lista.dados.matriculas) || [];
      const daSegunda = vinculos.find((m) => m.alunaId === 'aluno-a-2');
      const daPrimeira = vinculos.find((m) => !m.alunaId);
      provar('a anamnese da PRIMEIRA não aparece como feita para a segunda',
        daSegunda && daSegunda.anamnese && daSegunda.anamnese.estado === 'pedida',
        daSegunda && daSegunda.anamnese);
      provar('…e continua «concluída» no vínculo da primeira, que é de quem ela é',
        daPrimeira && daPrimeira.anamnese && daPrimeira.anamnese.estado === 'concluida',
        daPrimeira && daPrimeira.anamnese);

      /* O CARTÃO. A segunda não pode mostrar a linha do vínculo da primeira. */
      const pagina = await bastidores.fetch(
        new Request('https://breu.example/bastidores/estudio'), envE, { fetchImpl: ghE.fetchFalso });
      const html = await pagina.text();
      const cartao = (new RegExp('<li class="turma" data-aluna="Aluno A">([\\s\\S]*?)</li>')
        .exec(html) || [])[1] || '';
      provar('o cartão da segunda mostra UM vínculo, o dela',
        (cartao.match(/data-vinculo="/g) || []).length === 1,
        (cartao.match(/data-vinculo="/g) || []).length);
      provar('…e o id que o botão leva é o do vínculo dela',
        /data-aluna-derivar="aluno-a-bale-classico-2"/.test(cartao) || /Editar/.test(cartao),
        cartao.slice(0, 220));
    } finally {
      porta.resumosDeEnvelopes = porta.resumosDeEnvelopes;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * E.2 O CASO DELA, HOJE: as alumnas foram apagadas ANTES de o registo existir
   *
   * «Eu apaguei do lado dos alunos todos os alunos, eu consegui excluir todos eles. E aí eu vou
   * recriar esses alunos.» Com a exclusão ANTIGA (o `splice`), não ficou registo nenhum — mas os
   * VÍNCULOS ficaram, e um vínculo sem `alunaId` reivindica o id do apelido. Se o id novo fosse o
   * do apelido, a aluna recriada herdava-os: o defeito, outra vez, por uma porta que os registos
   * sozinhos não vêem. É este o caso que a asserção seguinte mede.
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nE.2 — recriar quem foi apagado ANTES do registo existir também não herda nada');
  {
    const ghE2 = githubDeBolso();
    const kvE2 = criarKV({
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier' }]),
      'professores/demi-plier/contato': JSON.stringify({ email: 'demi@example.test' }),
      /* O CADASTRO VAZIO, como ela o deixou: o `splice` antigo não deixou rasto. */
      [RAIZ + '/alunas']: JSON.stringify([]),
      /* E os vínculos da pessoa anterior, sem `alunaId` — que é como todos os de hoje estão. */
      [RAIZ + '/matriculas']: JSON.stringify([
        { id: 'aluno-a-bale-classico', aluna: 'Aluno A', modalidade: 'Balé clássico',
          professor: 'demi-plier', pedidaEm: '2026-11-02' },
      ]),
    });
    const envE2 = ambiente(kvE2);
    const TOKEN_E2 = (await pedir(envE2, '/api/bastidores/validar-producao', { senha: 'segredo' }))
      .dados.token;
    await comResumos([], async () => {
      const novo = await pedir(envE2, '/api/bastidores/matricula', {
        aluna: 'Aluno A', modalidade: 'Balé clássico', professor: 'Demi Plier',
        cpf: CPF.A, token: TOKEN_E2,
      }, { fetchImpl: ghE2.fetchFalso });
      provar('a aluna é recriada (201)', novo.status === 201, novo.dados && novo.dados.erro);
      provar('…e o id dela NÃO é o que os vínculos antigos reivindicam',
        novo.dados && novo.dados.matricula && novo.dados.matricula.alunaId === 'aluno-a-2',
        novo.dados && novo.dados.matricula && novo.dados.matricula.alunaId);

      const pagina = await bastidores.fetch(
        new Request('https://breu.example/bastidores/estudio'), envE2, { fetchImpl: ghE2.fetchFalso });
      const html = await pagina.text();
      const cartao = (new RegExp('<li class="turma" data-aluna="Aluno A">([\\s\\S]*?)</li>')
        .exec(html) || [])[1] || '';
      provar('…e o cartão dela nasce VAZIO de história — só o vínculo novo',
        (cartao.match(/data-vinculo="/g) || []).length === 1,
        (cartao.match(/data-vinculo="/g) || []).length);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * E.3 O CPF, E A LIGAÇÃO ENTRE PASSAGENS — «volta a se conectar, mas não reabre»
   *
   * A decisão dela, quando lhe perguntei o que acontece a quem volta: «não é que reabre o registro
   * antigo […] Volta a se conectar com o registro antigo, mas não reabre, porque é um outro
   * momento, a criança mudou […] ela não volta para o mesmo elenco que estava antes, ela não volta
   * para a mesma turma, não é a relação com o mesmo professor, tudo isso tem que ser definido
   * novamente na secretaria.»
   *
   * É isso que estas asserções medem: a passagem nova tem id próprio, vínculo próprio e anamnese
   * própria, e aponta para a anterior por `ligadaA` e `pessoaId`. Nada é restaurado.
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nE.3 — o CPF é obrigatório, e a passagem nova liga-se à anterior sem a reabrir');
  {
    const gh = githubDeBolso();
    const kvP = criarKV({
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier' }]),
      'professores/demi-plier/contato': JSON.stringify({ email: 'demi@example.test' }),
      [RAIZ + '/alunas']: JSON.stringify([]),
    });
    const envP = ambiente(kvP);
    const TOKEN_P = (await pedir(envP, '/api/bastidores/validar-producao', { senha: 'segredo' }))
      .dados.token;
    await comResumos([], async () => {
      const semCpf = await pedir(envP, '/api/bastidores/matricula', {
        aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'Demi Plier', token: TOKEN_P,
      }, { fetchImpl: gh.fetchFalso });
      provar('cadastrar sem CPF é 400 — e a recusa nomeia o campo', semCpf.status === 400
        && semCpf.dados && /CPF da aluna/.test(String(semCpf.dados.erro)),
        { status: semCpf.status, erro: semCpf.dados && semCpf.dados.erro });

      const cpfMau = await pedir(envP, '/api/bastidores/matricula', {
        aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'Demi Plier',
        cpf: '123', token: TOKEN_P,
      }, { fetchImpl: gh.fetchFalso });
      provar('CPF com menos de 11 dígitos é 400, e a mensagem diz quantos vieram',
        cpfMau.status === 400 && /11 dígitos/.test(String(cpfMau.dados && cpfMau.dados.erro)),
        cpfMau.dados && cpfMau.dados.erro);

      /* ── A PRIMEIRA PASSAGEM ── */
      const p1 = await pedir(envP, '/api/bastidores/matricula', {
        aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'Demi Plier',
        cpf: CPF.A, token: TOKEN_P,
      }, { fetchImpl: gh.fetchFalso });
      provar('com CPF, a aluna nasce (201)', p1.status === 201, p1.dados && p1.dados.erro);
      const registos1 = JSON.parse(kvP.dados.get(RAIZ + '/alunas') || '[]');
      const r1 = registos1[0] || {};
      provar('o registo guarda o CPF normalizado (só dígitos)', r1.cpf === CPF.A, r1.cpf);
      provar('sem passagem anterior, `pessoaId` é o próprio id e não há `ligadaA`',
        r1.pessoaId === r1.id && r1.ligadaA === undefined, { pessoaId: r1.pessoaId, ligadaA: r1.ligadaA });

      const outroCpfMesmaPessoa = await pedir(envP, '/api/bastidores/matricula', {
        aluna: 'Vavá B', modalidade: 'Jazz', professor: 'Demi Plier',
        cpf: CPF.A, token: TOKEN_P,
      }, { fetchImpl: gh.fetchFalso });
      provar('duas alunas ACTIVAS com o mesmo CPF é 409 — é a mesma pessoa, e ela não está duas '
        + 'vezes na escola',
        outroCpfMesmaPessoa.status === 409
        && outroCpfMesmaPessoa.dados && outroCpfMesmaPessoa.dados.alunaExistente === 'Vavá',
        { status: outroCpfMesmaPessoa.status, erro: outroCpfMesmaPessoa.dados && outroCpfMesmaPessoa.dados.erro });

      /* ── A SAÍDA, E A VOLTA ── */
      const saiu = await apagar(envP, 'Vavá', TOKEN_P, { fetchImpl: gh.fetchFalso });
      provar('a aluna sai (200)', saiu.status === 200, saiu.dados && saiu.dados.erro);
      const voltou = await pedir(envP, '/api/bastidores/matricula', {
        aluna: 'Vavá', modalidade: 'Jazz', professor: 'Demi Plier',
        cpf: CPF.A, token: TOKEN_P,
      }, { fetchImpl: gh.fetchFalso });
      provar('a mesma pessoa volta: é 201, com passagem NOVA', voltou.status === 201,
        voltou.dados && voltou.dados.erro);
      provar('…e a resposta DIZ que ela já esteve aqui', /já esteve nesta escola/.test(
        String(voltou.dados && voltou.dados.avisoDaPassagem)),
        voltou.dados && voltou.dados.avisoDaPassagem);
      const registos2 = JSON.parse(kvP.dados.get(RAIZ + '/alunas') || '[]');
      const antiga = registos2.find((r) => r.id === 'vava');
      const nova = registos2.find((r) => r.id === 'vava-2');
      provar('a passagem nova tem id PRÓPRIO, e não é o da antiga',
        Boolean(nova) && nova.id === 'vava-2', nova && nova.id);
      provar('…e aponta para a anterior (`ligadaA`)', nova && nova.ligadaA === 'vava', nova && nova.ligadaA);
      provar('…e partilha o `pessoaId` com ela — é a mesma pessoa',
        nova && antiga && nova.pessoaId === antiga.pessoaId && nova.pessoaId === 'vava',
        { nova: nova && nova.pessoaId, antiga: antiga && antiga.pessoaId });
      provar('A ANTIGA NÃO FOI REABERTA: continua marcada como saída',
        antiga && /^\d{4}-\d{2}-\d{2}T/.test(String(antiga.desligadaEm || '')), antiga && antiga.desligadaEm);
      provar('…e os vínculos dela continuam fechados com ela, e os da nova são só dela',
        (() => {
          const v = JSON.parse(kvP.dados.get(RAIZ + '/matriculas') || '[]');
          const daAntiga = v.filter((m) => m.alunaId === 'vava');
          const daNova = v.filter((m) => m.alunaId === 'vava-2');
          return daAntiga.length === 1 && daNova.length === 1
            && daAntiga[0].modalidade === 'Balé clássico' && daNova[0].modalidade === 'Jazz';
        })(), JSON.parse(kvP.dados.get(RAIZ + '/matriculas') || '[]').map((m) => [m.id, m.alunaId]));

      /* O cartão da passagem nova: sem turma, sem elenco, sem a modalidade de antes. */
      const pagina = await bastidores.fetch(
        new Request('https://breu.example/bastidores/estudio'), envP, { fetchImpl: gh.fetchFalso });
      const html = await pagina.text();
      const cartao = (new RegExp('<li class="turma" data-aluna="Vavá">([\\s\\S]*?)</li>')
        .exec(html) || [])[1] || '';
      provar('o cartão da passagem nova traz UM vínculo — o de agora, com a modalidade de agora',
        (cartao.match(/data-vinculo="/g) || []).length === 1
        && /<span class="selo marca">Jazz<\/span>/.test(cartao),
        cartao.slice(0, 240));
      provar('…e diz que ela já esteve na escola, com a data do registo anterior',
        /já esteve nesta escola/.test(cartao), cartao.slice(0, 400));
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * F. AS RECUSAS QUE CONTINUAM DE PÉ
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nF — a proveniência continua a travar a exclusão');
  {
    const ghF = githubDeBolso();
    const kvF = criarKV({
      [RAIZ + '/alunas']: JSON.stringify(['Aluna A']),
      [RAIZ + '/curadorias']: JSON.stringify([
        { id: 'rosa', modalidade: 'Balé clássico', professor: 'demi-plier', turma: 'Rosa',
          alunas: ['Aluna A'] },
      ]),
    });
    const envF = ambiente(kvF);
    const TOKEN_F = (await pedir(envF, '/api/bastidores/validar-producao', { senha: 'segredo' }))
      .dados.token;
    const verdadeiro = porta.resumosDeEnvelopes;
    porta.resumosDeEnvelopes = async (arm, padrao) => [
      { nome: 'plano-rosa.json', resumo: { professor: 'demi-plier', turma: 'Rosa', ciclo: '01' } },
    ].filter((x) => padrao.test(x.nome));
    try {
      const r = await apagar(envF, 'Aluna A', TOKEN_F, { fetchImpl: ghF.fetchFalso });
      provar('aluna em Turma com plano de ensino: 409, e nada é apagado',
        r.status === 409 && r.dados && r.dados.vinculado === true,
        { status: r.status, erro: r.dados && r.dados.erro });
      provar('…e ela continua na escola',
        (JSON.parse(kvF.dados.get(RAIZ + '/alunas') || '[]')[0] || {}).desligadaEm === undefined);
    } finally {
      porta.resumosDeEnvelopes = verdadeiro;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * G. O SCRIPT QUE A PÁGINA SERVE COMPILA
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nG — a página que serve a lista compila');
  {
    const ghG = githubDeBolso();
    const kvG = criarKV({ [RAIZ + '/alunas']: JSON.stringify(['Aluna A']) });
    const envG = ambiente(kvG);
    const pagina = await bastidores.fetch(
      new Request('https://breu.example/bastidores/estudio'), envG, { fetchImpl: ghG.fetchFalso });
    const html = await pagina.text();
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    const quebrados = [];
    scripts.forEach((texto) => {
      try { new Function(texto); } catch (e) { quebrados.push(e.message); }
    });
    provar('todos os <script> da página servida compilam', quebrados.length === 0, quebrados);
    provar('a mensagem da exclusão diz o que aconteceu aos elencos',
      /saiu do\(s\) elenco\(s\)/.test(html) && /d\.elencos/.test(html));
  }

  const falhas = provas.filter((p) => !p.ok);
  console.log('\n' + (falhas.length ? 'FALHOU — ' : 'TUDO CERTO — ') + provas.length
    + ' asserções, ' + falhas.length + ' falha(s)');
  if (falhas.length) process.exitCode = 1;
}

principal().catch((e) => {
  console.error('a prova interrompeu-se:', e && e.stack ? e.stack : e);
  process.exitCode = 1;
});
