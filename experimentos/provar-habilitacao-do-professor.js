#!/usr/bin/env node
'use strict';

/**
 * provar-habilitacao-do-professor.js — A COMPETÊNCIA É DA PESSOA, A TURMA SÓ FICA MARCADA
 * (03/11/2026).
 *
 * AS TRÊS DECISÕES DELA, e o que cada uma obriga a medir:
 *
 *   1. **Onde vive a habilitação:** `professores/<slug>/perfil.json`, independente do tenant da
 *      escola. Nascida com a escola, editável nos Bastidores · Produção.
 *   2. **A turma cuja modalidade o professor deixou de ter:** não se apaga — fica **descontinuada**,
 *      com o histórico intacto.
 *   3. **O nível tem a forma da tradição:** numerada na RAD (`Grade 3`), por graus nas outras
 *      (`Intermediário 2`).
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   §A o núcleo — o que é um perfil válido, quem está habilitado, que turmas ficam sem quem as
 *      ensine. Sem IO: é a regra.
 *   §B o ficheiro — pela ROTA DE VERDADE, com um GitHub de mentira: onde grava, o que recusa, e
 *      que o `criado` não se reescreve.
 *   §C a consequência — a marca no KV, pela gravação das habilitações: acende, e **apaga** quando
 *      a modalidade volta (uma marca irrevogável seria uma pena perpétua por uma decisão que se
 *      corrige).
 *   §D o expurgo — o perfil está na lista do que NÃO se apaga, e a guarda recusa antes de apagar.
 *   §E o nível — a forma de cada tradição, o rótulo composto, e o texto antigo que não se perde.
 *
 * O CONTROL NEGATIVO está no §D e no §C: sem a guarda, a lista passaria; sem a revogação, a
 * turma continuaria marcada depois de a modalidade voltar. Uma prova que só medisse o caminho
 * feliz não distinguiria a regra de um acidente.
 *
 *   node experimentos/provar-habilitacao-do-professor.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const nucleo = require(path.join(RAIZ, 'motor/nucleo/perfil-do-professor.js'));
const niveis = require(path.join(RAIZ, 'motor/nucleo/niveis.js'));
const perfilRepo = require(path.join(RAIZ, 'motor/servidor/perfil-professor.js'));
const repoEscola = require(path.join(RAIZ, 'motor/servidor/repo-escola.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function criarKv(inicial) {
  const mapa = new Map(Object.entries(inicial || {}));
  return {
    mapa,
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}

/** Um GitHub de mentira que guarda ficheiros por caminho — o mesmo contrato das outras provas. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial || {}));
  const pedidos = [];
  const f = async (url, opcoes) => {
    const caminho = decodeURIComponent(String(url).split('/contents/')[1].split('?')[0]);
    const metodo = (opcoes && opcoes.method) || 'GET';
    pedidos.push({ metodo, caminho });
    if (metodo === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      const atual = arquivos.get(caminho);
      if (atual && corpo.sha && corpo.sha !== atual.sha) {
        return new Response(JSON.stringify({ message: 'sha mismatch' }), { status: 409 });
      }
      arquivos.set(caminho, {
        sha: 'sha-' + (arquivos.size + 1),
        conteudo: Buffer.from(corpo.content, 'base64').toString('utf8'),
        mensagem: corpo.message,
      });
      return new Response(JSON.stringify({ commit: { sha: 'commit-' + arquivos.size } }), { status: 200 });
    }
    const atual = arquivos.get(caminho);
    if (!atual) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: atual.sha,
      content: Buffer.from(atual.conteudo, 'utf8').toString('base64'),
    }), { status: 200 });
  };
  return { f, arquivos, pedidos };
}

// =====================================================================================
// A. O NÚCLEO — o que é um perfil, e quem está habilitado
// =====================================================================================
function oNucleo() {
  console.log('\nA. O NÚCLEO — a regra, sem IO');

  const vazio = nucleo.perfilVazio({ slug: 'braco-em-quinta', nome: 'Braço em Quinta', hoje: '2026-11-03' });
  checar('um professor que nasce com a escola já nasce habilitado na modalidade principal',
    vazio.modalidades.length === 1 && vazio.modalidades[0] === 'bale-classico', vazio.modalidades);
  checar('…e o perfil guarda de onde ele é e quando nasceu',
    vazio.slug === 'braco-em-quinta' && vazio.criado === '2026-11-03', vazio);

  const bom = nucleo.normalizarPerfil({ slug: 'x', nome: 'X', modalidades: ['bale-classico', 'jazz'] });
  checar('duas modalidades conhecidas passam', bom.ok && bom.perfil.modalidades.length === 2, bom.erros);
  checar('…e a repetida entra uma vez só',
    nucleo.normalizarPerfil({ modalidades: ['jazz', 'jazz'] }).perfil.modalidades.length === 1);

  const ma = nucleo.normalizarPerfil({ modalidades: ['kuduro'] });
  checar('uma modalidade que o catálogo não tem é RECUSADA — e a mensagem diz qual',
    ma.ok === false && /kuduro/.test(ma.erros.join(' ')), ma.erros);

  const nenhuma = nucleo.normalizarPerfil({ slug: 'x', modalidades: [] });
  checar('ZERO modalidades é uma declaração válida, e não um erro de forma',
    nenhuma.ok === true && nenhuma.perfil.modalidades.length === 0, nenhuma.erros);

  checar('quem declara a modalidade está habilitado',
    nucleo.estadoDaHabilitacao({ modalidades: ['jazz'] }, 'jazz') === 'habilitado');
  checar('quem deixou de a declarar «perdeu»',
    nucleo.estadoDaHabilitacao({ modalidades: ['bale-classico'] }, 'jazz') === 'perdeu');
  checar('sem perfil, a resposta é «não sei» — e «não sei» NÃO descontinua nada',
    nucleo.estadoDaHabilitacao(null, 'jazz') === 'sem-perfil'
      && nucleo.estadoDaHabilitacao(undefined, 'jazz') === 'sem-perfil');

  const turmas = [
    { id: 't1', nome: 'Jazz 1', modalidade: 'jazz', professor: 'x' },
    { id: 't2', nome: 'Balé 1', modalidade: 'bale-classico', professor: 'x' },
    { id: 't3', nome: 'Turma antiga' },
    { id: 't4', nome: 'Jazz de outro', modalidade: 'jazz', professor: 'outro' },
  ];
  const perdeu = nucleo.turmasDescontinuadas(turmas, { slug: 'x', modalidades: ['bale-classico'] }, { professor: 'x' });
  checar('só a turma da modalidade perdida fica sem quem a ensine — e é uma só',
    perdeu.length === 1 && perdeu[0].id === 't1', perdeu);
  checar('…e o motivo nomeia a modalidade, em português',
    /Jazz/.test(perdeu[0].motivo), perdeu[0].motivo);
  checar('a turma sem modalidade declarada NÃO é descontinuada (a ausência não é a negação)',
    perdeu.every((t) => t.id !== 't3'), perdeu);
  checar('a turma de OUTRO professor não é descontinuada pela habilitação deste',
    perdeu.every((t) => t.id !== 't4'), perdeu);
  checar('e um professor SEM perfil não descontinua turma nenhuma',
    nucleo.turmasDescontinuadas(turmas, null, { professor: 'x' }).length === 0);
}

// =====================================================================================
// B. O FICHEIRO — pela rota de verdade, com um GitHub de mentira
// =====================================================================================
async function oFicheiro() {
  console.log('\nB. O FICHEIRO — onde grava, o que recusa, e a data que não se reescreve');

  checar('o caminho é `professores/<slug>/perfil.json`',
    perfilRepo.caminhoDoPerfil('braco-em-quinta') === 'professores/braco-em-quinta/perfil.json',
    perfilRepo.caminhoDoPerfil('braco-em-quinta'));
  checar('sem slug, não há caminho (e a rota recusa antes de escrever)',
    perfilRepo.caminhoDoPerfil('') === '');

  const repo = githubFalso({});
  const env = {
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
    PADD_KV: criarKv({
      'bastidores/breu/professores': JSON.stringify([{ nome: 'Braço em Quinta' }]),
    }),
  };
  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = repo.f;
  const BASE = 'https://breu.tmenegaz77.workers.dev';

  try {
    // GET de um professor que ainda não tem perfil: 200 com `existe: false`, e não 404.
    const r1 = await bastidores.fetch(new Request(
      BASE + '/api/bastidores/perfil?professor=braco-em-quinta'), env);
    const d1 = await r1.json();
    checar('um professor sem perfil responde 200 com «não declarado» — e não um erro',
      r1.status === 200 && d1.ok === true && d1.existe === false, { status: r1.status, d: d1.existe });
    checar('…e a lista do catálogo vai junto, para a tela não ter uma segunda cópia',
      Array.isArray(d1.catalogo) && d1.catalogo.length >= 5, (d1.catalogo || []).length);

    // POST: grava.
    const r2 = await bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'x', professor: 'braco-em-quinta', nome: 'Braço em Quinta',
        modalidades: ['bale-classico', 'jazz'] }),
    }), env);
    const d2 = await r2.json();
    checar('as habilitações gravam', r2.status === 200 && d2.ok === true, d2);
    checar('…no ficheiro do PROFESSOR, e não no KV da escola',
      repo.arquivos.has('professores/braco-em-quinta/perfil.json'),
      [...repo.arquivos.keys()]);
    checar('…e nada foi escrito sob o prefixo da escola',
      [...repo.arquivos.keys()].every((c) => c.indexOf('bastidores/') === -1),
      [...repo.arquivos.keys()]);
    const escrito = JSON.parse(repo.arquivos.get('professores/braco-em-quinta/perfil.json').conteudo);
    checar('…com as duas modalidades, e a nota de quem é o ficheiro',
      escrito.modalidades.join(',') === 'bale-classico,jazz' && /PESSOA/.test(String(escrito._nota)),
      escrito);

    // POST do mesmo professor outra vez: o `criado` fica.
    const r3 = await bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'x', professor: 'braco-em-quinta', modalidades: ['bale-classico'] }),
    }), env);
    checar('regravar substitui a lista', r3.status === 200);
    const depois = JSON.parse(repo.arquivos.get('professores/braco-em-quinta/perfil.json').conteudo);
    checar('…e o `criado` NÃO se reescreve, mas o `atualizado` sim',
      depois.criado === escrito.criado && Boolean(depois.atualizado), { antes: escrito.criado, depois: depois.criado });
    checar('…e o nome de exibição que já estava não se perde',
      depois.nome === 'Braço em Quinta', depois.nome);

    /*  A TRADIÇÃO ATRAVESSA A ROTA (18/11/2026) — e este é o par de asserções que impede o
     *  defeito silencioso: o ecrã manda `tradicoes`, a rota deixava-o cair, e a gravação
     *  devolvia as antigas. Um campo que se escreve, se grava e se perde não dá erro nenhum.
     *
     *  As duas metades são diferentes de propósito:
     *    · MANDAR as tradições grava-as;
     *    · NÃO MANDAR (cliente antigo) não as apaga — «ausente» ≠ «vazio». */
    const r6 = await bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'x', professor: 'braco-em-quinta',
        modalidades: ['bale-classico', 'jazz'],
        tradicoes: { 'bale-classico': ['RAD', 'cubana'], jazz: [] } }),
    }), env);
    const d6 = await r6.json();
    /* O ACESSO DEFENSIVO, pela razão escrita na secção F: um valor que não existe tem de dar
     * «falhou», e não `TypeError`. Foi o controlo negativo desta própria asserção que o mostrou —
     * removido o campo da rota, a prova estourava em vez de reprovar. */
    const lerPerfilGravado = () => {
      const bruto = repo.arquivos.get('professores/braco-em-quinta/perfil.json');
      if (!bruto) return {};
      try { return JSON.parse(bruto.conteudo); } catch (e) { return {}; }
    };
    const trad6 = (lerPerfilGravado().tradicoes || {})['bale-classico'] || [];
    checar('as tradições atravessam a rota e ficam no ficheiro',
      r6.status === 200 && d6.ok === true && trad6.join(',') === 'RAD,cubana',
      { status: r6.status, tradicoes: lerPerfilGravado().tradicoes });

    const r7 = await bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'x', professor: 'braco-em-quinta',
        modalidades: ['bale-classico', 'jazz'] }),
    }), env);
    const trad7 = (lerPerfilGravado().tradicoes || {});
    checar('…e um cliente que NÃO as manda não as apaga (ausente ≠ vazio)',
      r7.status === 200 && Array.isArray(trad7.jazz) && trad7.jazz.length === 0,
      { status: r7.status, tradicoes: trad7 });

    // A GUARDA: o perfil de quem não é desta escola não se edita aqui.
    const r4 = await bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'x', professor: 'de-outra-escola', modalidades: ['jazz'] }),
    }), env);
    checar('o perfil de um professor de OUTRA escola é recusado (403)',
      r4.status === 403, r4.status);
    checar('…e nada foi escrito para ele',
      !repo.arquivos.has('professores/de-outra-escola/perfil.json'));

    // Sem token, não grava.
    const r5 = await bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor: 'braco-em-quinta', modalidades: ['jazz'] }),
    }), env);
    checar('sem a senha da direção, não grava', r5.status === 401, r5.status);
  } finally {
    globalThis.fetch = fetchDeVerdade;
  }
}

// =====================================================================================
// C. A CONSEQUÊNCIA — a turma fica marcada, e a marca é revogável
// =====================================================================================
async function aConsequencia() {
  console.log('\nC. A CONSEQUÊNCIA — a turma fica DESCONTINUADA, e volta atrás quando a modalidade volta');

  const turmasIniciais = [
    { id: 'jazz-1', nome: 'Jazz 1', modalidade: 'jazz', professor: 'braco-em-quinta', ativo: true },
    { id: 'bale-1', nome: 'Balé 1', modalidade: 'bale-classico', professor: 'braco-em-quinta', ativo: true },
  ];
  const kv = criarKv({
    'bastidores/breu/professores': JSON.stringify([{ nome: 'Braço em Quinta' }]),
    'bastidores/breu/turmas': JSON.stringify(turmasIniciais),
  });
  const repo = githubFalso({});
  const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't', PADD_KV: kv };
  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = repo.f;
  const BASE = 'https://breu.tmenegaz77.workers.dev';
  const gravar = (modalidades) => bastidores.fetch(new Request(BASE + '/api/bastidores/perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: 'x', professor: 'braco-em-quinta', modalidades }),
  }), env).then((r) => r.json());
  const turmasAgora = () => JSON.parse(kv.mapa.get('bastidores/breu/turmas'));

  try {
    // 1) Declara AS DUAS: nada fica descontinuado.
    await gravar(['bale-classico', 'jazz']);
    checar('com as duas modalidades declaradas, nenhuma turma é descontinuada',
      turmasAgora().every((t) => !t.descontinuada), turmasAgora());

    // 2) Deixa de declarar jazz.
    const r = await gravar(['bale-classico']);
    const depois = turmasAgora();
    const jazz = depois.find((t) => t.id === 'jazz-1') || {};
    const bale = depois.find((t) => t.id === 'bale-1') || {};
    checar('a turma da modalidade perdida fica DESCONTINUADA',
      Boolean(jazz.descontinuada), jazz.descontinuada);
    checar('…e NÃO é apagada — continua na lista, com tudo o que tinha',
      depois.length === 2 && jazz.nome === 'Jazz 1' && jazz.modalidade === 'jazz', depois.length);
    checar('…com a data e o motivo gravados',
      Boolean(jazz.descontinuada.em) && /Jazz/.test(String(jazz.descontinuada.motivo)),
      jazz.descontinuada);
    checar('a turma da modalidade que continua declarada fica intacta',
      !bale.descontinuada, bale.descontinuada);
    checar('…e a resposta diz QUAIS foram marcadas', (r.turmasMarcadas || []).indexOf('Jazz 1') !== -1,
      r.turmasMarcadas);

    // 3) Volta a declarar jazz: a marca SAI. Sem isto, era uma pena perpétua.
    await gravar(['bale-classico', 'jazz']);
    const voltou = turmasAgora().find((t) => t.id === 'jazz-1') || {};
    checar('declarar a modalidade outra vez APAGA a marca (a descontinuidade é revogável)',
      !voltou.descontinuada, voltou.descontinuada);

    // 4) Uma turma sem modalidade nunca é marcada.
    kv.mapa.set('bastidores/breu/turmas', JSON.stringify(
      turmasIniciais.concat([{ id: 'antiga', nome: 'Turma antiga', professor: 'braco-em-quinta' }])));
    await gravar(['bale-classico']);
    const comAntiga = turmasAgora().find((t) => t.id === 'antiga') || {};
    checar('uma turma sem modalidade declarada nunca é descontinuada',
      !comAntiga.descontinuada, comAntiga.descontinuada);
  } finally {
    globalThis.fetch = fetchDeVerdade;
  }
}

// =====================================================================================
// D. O EXPURGO — o perfil fica, e a guarda recusa antes de apagar
// =====================================================================================
function oExpurgo() {
  console.log('\nD. O EXPURGO — o perfil do professor sobrevive à escola');

  checar('o caminho do perfil é reconhecido', repoEscola.ehPerfilDoProfessor('professores/x/perfil.json'));
  checar('…e o das fontes da escola não é',
    repoEscola.ehPerfilDoProfessor('professores/x/ciclos/ciclo-01-breu.conf') === false);
  checar('…nem o do caderno',
    repoEscola.ehPerfilDoProfessor('professores/x/cadernos/ciclo-01/aula-01.md') === false);

  const caminhos = [
    'professores/coqui/ciclos/ciclo-01-breu.conf',
    'professores/coqui/ciclos/ciclo-01-breu-plano.md',
    'professores/coqui/perfil.json',
    'professores/coqui/ciclos/ciclo-01-schema.json',
  ];
  const classificado = repoEscola.classificarPreservados(caminhos, 'coqui', 'breu');
  checar('o perfil entra no que o expurgo PRESERVA',
    classificado.doProfessor.indexOf('professores/coqui/perfil.json') !== -1,
    classificado.doProfessor);
  checar('…e não entra em nenhuma das listas de «de outra escola» (não é de escola nenhuma)',
    classificado.deOutrasEscolas.indexOf('professores/coqui/perfil.json') === -1,
    classificado.deOutrasEscolas);
  checar('as fontes da escola continuam a ser o que se apaga',
    repoEscola.ehArquivoDaEscola('professores/coqui/ciclos/ciclo-01-breu.conf', 'breu', '01'));

  // A GUARDA — e o controlo negativo: a mesma lista sem a guarda passaria.
  const lista = ['wrangler.breu.jsonc', 'professores/coqui/perfil.json'];
  let recusou = null;
  try { repoEscola.semPerfisNaLista(lista); } catch (e) { recusou = e; }
  checar('a guarda RECUSA uma lista que leve um perfil', Boolean(recusou), recusou && recusou.message);
  checar('…e a mensagem diz que a habilitação é da pessoa, não da escola',
    Boolean(recusou) && /habilitação é da pessoa/.test(recusou.message), recusou && recusou.message);
  checar('CONTROLO NEGATIVO: a mesma lista sem o perfil passa',
    repoEscola.semPerfisNaLista(['wrangler.breu.jsonc']).length === 1);
}

// =====================================================================================
// E. O NÍVEL — a forma de cada tradição
// =====================================================================================
function oNivel() {
  console.log('\nE. O NÍVEL — numerado na RAD, por graus nas outras');

  const tradicoes = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'biblioteca/modalidades/bale-classico/tradicoes.json'), 'utf8'));

  const rad = niveis.estruturaDaTradicao(tradicoes, 'RAD');
  checar('a RAD é NUMERADA, e o rótulo dela é «Grade»',
    rad.tipo === 'numerada' && rad.rotulo === 'Grade', rad);
  checar('…e não tem graus', rad.graus.length === 0, rad.graus);

  const vag = niveis.estruturaDaTradicao(tradicoes, 'Vaganova');
  checar('uma tradição por graus declara os três graus',
    vag.tipo === 'grau-e-nivel' && vag.graus.join(',') === 'Básico,Intermediário,Avançado', vag);

  const outra = niveis.estruturaDaTradicao(tradicoes, 'Cecchetti');
  checar('uma tradição que o ficheiro não conhece cai no PADRÃO (o «geral» dela)',
    outra.tipo === 'grau-e-nivel' && outra.graus.length === 3, outra);

  checar('na RAD, «3» vira «Grade 3» — o que o plano imprime',
    niveis.rotuloDoNivel(rad, { nivel: '3' }) === 'Grade 3', niveis.rotuloDoNivel(rad, { nivel: '3' }));
  checar('numa tradição por graus, «Intermediário» + «2» vira «Intermediário 2»',
    niveis.rotuloDoNivel(vag, { grau: 'Intermediário', nivel: '2' }) === 'Intermediário 2');
  checar('…e sem nível, fica só o grau', niveis.rotuloDoNivel(vag, { grau: 'Básico' }) === 'Básico');

  // O TEXTO ANTIGO NÃO SE PERDE: uma turma que só tem `nivelReferencia` continua a lê-lo.
  checar('uma turma antiga sem grau nem nível conserva o texto que tinha',
    niveis.rotuloDoNivel(vag, { nivelReferencia: 'Vaganova 3' }) === 'Vaganova 3');

  // E O QUE NÃO É NÍVEL NÃO PASSA.
  const sujo = niveis.normalizarNivel(tradicoes, { programaReferencia: 'RAD', nivel: 'terceiro' });
  checar('«terceiro» não é um nível — só dígitos', sujo.nivel === '', sujo);
  const fora = niveis.normalizarNivel(tradicoes, { programaReferencia: 'Vaganova', grau: 'Inventado', nivel: '2' });
  checar('um grau que a tradição não declara é descartado, e o nível fica',
    fora.grau === '' && fora.nivel === '2', fora);

  /* OS CAMPOS DO NÍVEL MUDARAM DE FORMULÁRIO NO MESMO DIA (03/11/2026), e esta asserção mudou
   * com eles: eram `#tgrau`/`#tnivel` (a turma) e passaram a `#cugrau`/`#cunivel` (a curadoria).
   * A prova mede o que a decisão pede — que o nível se possa declarar — e não o id de um
   * formulário; se um dia mudar outra vez, é esta linha que diz onde ele está. */
  const html = bastidores.paginaProducao('x', { professor: 'x', ciclo: '01', query: '' },
    [], [], '', '', [], [], [], [], [], []);
  for (const [campo, oque] of [
    ['id="cugrau"', 'o grau, na curadoria'],
    ['id="cunivel"', 'o nível, na curadoria'],
  ]) {
    checar('o formulário da curadoria traz ' + oque, html.indexOf(campo) !== -1);
  }
  /* A MODALIDADE VOLTOU AO CADASTRO DA SALA (18/11/2026), e esta asserção mudou com ela.
   *
   * O QUE ELA DIZIA: que o formulário da sala não trazia grau, nível, modalidade nem programa — a
   * decisão de 03/11/2026, que levou o enquadramento inteiro para a curadoria.
   *
   * O QUE MUDOU, e é OUTRA COISA: aquele enquadramento era o PEDAGÓGICO (que nível, que tradição,
   * que grau). O `modalidade` que voltou é o OPERACIONAL da sala — «a sala atende a uma modalidade
   * nesses dias, com essa duração, no período inicial até o período final». O grau e o nível
   * continuam fora: sem uma tradição escolhida não há como numerá-los, e é na curadoria que se
   * declara em que linha a aula acontece.
   *
   * A asserção fica mais estreita, e é isso que a mantém útil: ela agora guarda o que NÃO voltou. */
  checar('…e o formulário da SALA não traz grau, nível nem programa (o pedagógico ficou na curadoria)',
    html.indexOf('id="tgrau"') === -1 && html.indexOf('id="tnivel"') === -1
      && html.indexOf('id="tprograma"') === -1);
  checar('…e o grau é repovoado pela tradição escolhida (o dado vai para o cliente)',
    html.indexOf('NIVEIS_POR_TRADICAO') !== -1 && html.indexOf('function pintarGraus') !== -1);

  // O QUE A DECISÃO DELA EXIGE DO BLOCO DE HABILITAÇÕES.
  checar('a secção de Professores traz o bloco das habilitações',
    html.indexOf('id="form-habilitacao"') !== -1 && html.indexOf('Habilitações') !== -1);
  checar('…com uma pílula por modalidade do catálogo, e as sem repertório anunciadas',
    (html.match(/name="hab-modalidade"/g) || []).length === nucleo.LISTA_DE_MODALIDADES.length
      && html.indexOf('sem conteúdo ainda') !== -1,
    (html.match(/name="hab-modalidade"/g) || []).length);

  // ---------------------------------------------------------------------------------------
  /* §F A TRADIÇÃO DO PROFESSOR — POR MODALIDADE, COM FILTRO, E «NENHUMA» É UMA RESPOSTA
   * (18/11/2026).
   *
   * O QUE ELA PEDIU, e é o problema inteiro numa frase: «Se ele ensina ballet e jazz […] ele vai
   * ensinar uma tradição, ou é o RAD, ou é a cubana, ou é a francesa, ou é o Cecchetti […]. Agora,
   * se for o jazz, o jazz tem tradições? Eu não sei […] Então eu acho que tem que ter um filtro,
   * quando ele diz a modalidade que ele ensina […] filtra quais são as tradições dessa modalidade
   * […] se ele escolher ballet clássico e jazz […] tem que poder listar as tradições tanto do
   * ballet quanto do jazz».
   *
   * E o terceiro estado: «ele vai poder dizer também que é nenhuma, ele não ensina nenhuma
   * tradição […] um generalista». */
  console.log('\nF. A TRADIÇÃO DO PROFESSOR — por modalidade, e «nenhuma» é uma resposta');

  {
    /* O MAPA, no núcleo. Duas modalidades, três Estados distintos. */
    const dois = nucleo.normalizarPerfil({
      slug: 'duas-linhas', nome: 'Duas Linhas',
      modalidades: ['bale-classico', 'jazz'],
      tradicoes: { 'bale-classico': ['RAD', 'Vaganova'], jazz: [] },
    }, { tradicoesValidas: ['RAD', 'francesa', 'Vaganova', 'cubana'] });
    /* O ACESSO É DEFENSIVO, E NÃO É ZELO (18/11/2026). Com uma leitura directa
     * (`dois.perfil.tradicoes.jazz.length`), um mapa que perca a chave faz a prova ESTOURAR com
     * `TypeError` em vez de reprovar — e uma prova que estoura não reprova: interrompe, e o resto
     * do ficheiro deixa de correr. Foi o que aconteceu no controlo negativo desta mesma asserção,
     * que devolveu «0 falhas» para uma mutação que quebrava a regra. Uma prova tem de poder
     * dizer «falhou» sobre um valor que não existe. */
    const mapaDois = (dois.ok && dois.perfil && dois.perfil.tradicoes) || {};
    checar('a tradição grava-se POR MODALIDADE',
      dois.ok
        && Array.isArray(mapaDois['bale-classico']) && mapaDois['bale-classico'].length === 2
        && Array.isArray(mapaDois.jazz) && mapaDois.jazz.length === 0,
      dois.erros.concat([mapaDois]));

    checar('as tradições do clássico leem-se com `tradicoesDoPerfil`',
      JSON.stringify(nucleo.tradicoesDoPerfil(dois.perfil, 'bale-classico')) === '["RAD","Vaganova"]',
      nucleo.tradicoesDoPerfil(dois.perfil, 'bale-classico'));

    /* OS TRÊS ESTADOS, e o que os distingue — é isto que impede o sistema de chamar «generalista»
     * a quem apenas ainda não foi perguntado. */
    const jazzDeclarado = nucleo.tradicoesDoPerfil(dois.perfil, 'jazz');
    checar('«declarou nenhuma» é uma lista vazia, e NÃO é o mesmo que «não declarou»',
      Array.isArray(jazzDeclarado) && jazzDeclarado.length === 0
        && nucleo.tradicoesDoPerfil(dois.perfil, 'circo') === null,
      { jazz: jazzDeclarado, circo: nucleo.tradicoesDoPerfil(dois.perfil, 'circo') });

    /* A TRADIÇÃO ÓRFÃ É RECUSADA, e a frase diz qual: uma tradição declarada para uma modalidade
     * que ele NÃO declara ensinar é uma afirmação sobre uma coisa que ele não faz. */
    const orfa = nucleo.normalizarPerfil({
      modalidades: ['jazz'], tradicoes: { 'bale-classico': ['RAD'] },
    }, { tradicoesValidas: ['RAD'] });
    checar('uma tradição para uma modalidade que ele não ensina é recusada (400), e a frase nomeia-a',
      !orfa.ok && /bale-classico/.test(orfa.erros.join(' ')), orfa.erros);

    const inventada = nucleo.normalizarPerfil({
      modalidades: ['bale-classico'], tradicoes: { 'bale-classico': ['Cecchetti'] },
    }, { tradicoesValidas: ['RAD', 'francesa', 'Vaganova', 'cubana'] });
    checar('uma tradição fora do catálogo é recusada, e a frase diz quais existem',
      !inventada.ok && /Cecchetti/.test(inventada.erros.join(' '))
        && /RAD/.test(inventada.erros.join(' ')), inventada.erros);

    /* A UNIÃO DAS DUAS MODALIDADES — «tem que poder listar as tradições tanto do ballet quanto do
     * jazz». `tradicoesDeclaradas` achata o mapa sem repetir. */
    checar('as tradições declaradas das duas modalidades somam-se, sem repetir',
      JSON.stringify(nucleo.tradicoesDeclaradas(dois.perfil)) === '["RAD","Vaganova"]',
      nucleo.tradicoesDeclaradas(dois.perfil));

    /* O PERFIL QUE NUNCA TEVE TRADIÇÕES NÃO GANHA UM MAPA VAZIO — fica sem a chave, que é «não
     * declarado». É o que todos os perfis anteriores a hoje já são. */
    const antigo = nucleo.normalizarPerfil({ modalidades: ['bale-classico'] });
    checar('um perfil sem tradições fica SEM a chave — «não declarado», e não «nenhuma»',
      antigo.ok && !('tradicoes' in antigo.perfil), antigo.perfil);

    // ---------------------------------------------------------------- A TELA
    /* O PASSO 2 DAS SALAS MUDOU DE NOME E DE OFÍCIO (19/11/2026), e estas duas asserções afirmavam
     * o desenho de ontem — reprovavam a página certa.
     *
     * «Na sala, step um, fica apenas o nome da sala […] O step dois deixa de existir em salas. Todo o
     * step dois, ele passa a ir para professores. […] Na sala, o associar passa a ser associar o
     * professor pela modalidade e o professor.»
     *
     * O passo 2 das Salas chama-se agora «Associar» e compõe o par modalidade + professor; a régua
     * deixou de ser composta ali e passou a ser o passo 2 do CADASTRO DO PROFESSOR (é dela que trata
     * `provar-regua-do-professor`). Uma bancada que continue a exigir `rubr-professor` dentro das
     * Salas está a pedir o ecrã antigo de volta. */
    checar('o passo 2 das Salas chama-se «Associar»', /passo-t">Associar</.test(html), null);
    checar('…e já não se chama «Rubricas» nem «Professor»',
      !/passo-t">Rubricas</.test(html) && !/passo-t">Professor</.test(html), null);
    /* A ORDEM: a modalidade primeiro, e só depois o professor — é a modalidade que diz quais
     * professores existem («é pela modalidade que eu vou saber quais são os professores»). */
    const posMod = html.indexOf('for="vinc-modalidade"');
    const posProf = html.indexOf('for="vinc-professor"');
    const posTrad = html.indexOf('id="rubr-tradicao"');
    checar('no passo 2, a modalidade vem antes do professor',
      posMod !== -1 && posProf !== -1 && posMod < posProf, { posMod, posProf });
    /* A RÉGUA SAIU DAS SALAS: a sala sabe com que régua é medida pela ASSOCIAÇÃO ao professor, e é
     * por isso que não há aqui nem `rubr-professor` nem `rubr-nome`. */
    /* A MEDIDA É DENTRO DA SECÇÃO DAS SALAS — e não no documento inteiro: `rubr-nome` existe, mas na
     * secção do PROFESSOR, que é onde a régua passou a ser composta. Uma asserção sobre o HTML
     * inteiro reprovaria a página certa por causa de um id homónimo noutro sítio. */
    const secSalas = html.slice(html.indexOf('id="sec-turmas"'), html.indexOf('id="sec-verbetes"'));
    checar('…e a régua não se compõe nas Salas: não há `rubr-professor` nem `rubr-nome` na secção',
      secSalas.indexOf('id="rubr-professor"') === -1 && secSalas.indexOf('id="rubr-nome"') === -1,
      { rubrProfessor: secSalas.indexOf('id="rubr-professor"'), rubrNome: secSalas.indexOf('id="rubr-nome"') });
    checar('…e a tradição continua a ser LEITURA, e não um campo: não há `input` nem `select` para ela',
      posTrad !== -1
        && html.indexOf('<input id="rubr-tradicao"') === -1
        && html.indexOf('<select id="rubr-tradicao"') === -1, posTrad);

    /* A RÉGUA VIVE NO CADASTRO DO PROFESSOR, e é lá que se mede a ordem dela: professor em foco,
     * tradição que ele ensina, e o nome da régua. */
    const secProf = html.slice(html.indexOf('id="sec-professores"'), html.indexOf('id="sec-alunas"'));
    const posFoco = secProf.indexOf('id="rubr-prof-nome"');
    const posTrad2 = secProf.indexOf('id="rubr-tradicao"');
    const posNome2 = secProf.indexOf('id="rubr-nome"');
    checar('no passo 2 do professor, a tradição fica entre quem ele é e o nome da régua',
      posFoco !== -1 && posTrad2 !== -1 && posNome2 !== -1 && posFoco < posTrad2 && posTrad2 < posNome2,
      { posFoco, posTrad2, posNome2 });

    /* O PASSO 2 DAS SALAS diz de quem é a régua escolhida — é o circuito que fecha. */
    checar('o «Associar» tem a linha que diz de quem é a rubrica escolhida',
      html.indexOf('id="vinc-professor"') !== -1, null);

    /* AS HABILITAÇÕES: um bloco por modalidade, para ela declarar a tradição lá. */
    const blocos = (html.match(/id="hab-trad-[a-z-]+"/g) || []);
    checar('as habilidades têm um bloco de tradição por modalidade do catálogo',
      blocos.length === nucleo.LISTA_DE_MODALIDADES.length, blocos);
    /* E SÓ O CLÁSSICO OFERECE TRADIÇÕES, porque só ele tem catálogo próprio. Oferecer RAD ao jazz
     * seria a «afirmação falsa sobre o que se escolhe» que a nota da curadoria já recusa. */
    const iBloco = html.indexOf('id="hab-trad-bale-classico"');
    const iJazz = html.indexOf('id="hab-trad-jazz"');
    checar('…o do clássico oferece as quatro tradições',
      iBloco !== -1 && /value="RAD"/.test(html.slice(iBloco, iJazz)), null);
    checar('…e um bloco de modalidade sem catálogo diz que ainda não há — não inventa',
      iJazz !== -1 && /Ainda não há tradições cadastradas/.test(html.slice(iJazz, iJazz + 400)),
      html.slice(iJazz, iJazz + 200));
    checar('…e o generalista tem caixa própria, porque «nenhuma» é uma declaração',
      html.indexOf('name="hab-sem-tradicao"') !== -1, null);
  }
}

oNucleo();
oExpurgo();
oNivel();
oFicheiro()
  .then(aConsequencia)
  .then(() => {
    console.log('');
    if (falhas) { console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'); process.exit(1); }
    console.log('TUDO CERTO — a habilitação é da pessoa e vive no perfil do professor, a turma');
    console.log('sem quem a ensine fica marcada (e volta atrás), o nível tem a forma da tradição,');
    console.log('e a tradição que ele ensina declara-se POR modalidade — com «nenhuma» a valer.');
  })
  .catch((erro) => {
    console.error('erro na prova:', erro);
    process.exit(1);
  });
