#!/usr/bin/env node
'use strict';

/*
 * provar-proveniencia-do-expurgo.js — a proveniência existe, e está bem registada, ANTES de
 * o expurgo apagar seja o que for.
 *
 * O QUE ISTO PROTEGE. O expurgo é irreversível e leva as âncoras (`.fipp`). Se alguma fonte
 * estiver por ancorar no minuto em que ele corre, o que se perde não é «um arquivo»: é a prova
 * de que aquilo existiu — e depois já não há como distinguir «nunca foi ancorado» de «foi
 * ancorado e apagado». A auditoria (`motor/nucleo/proveniencia.js`) responde à pergunta antes,
 * e o expurgo pára quando a resposta é negativa.
 *
 * O QUE ESTA PROVA MEDE, e em três camadas, porque a regra atravessa as três:
 *
 *   A. o NÚCLEO (puro) — cada verificação reprova pelo seu motivo, e o conjunto saudável passa;
 *      e cada recusa CARREGA a correção daquele bloqueio (não uma do género);
 *   B. a leitura da ÁRVORE (`auditarProvenienciaDaEscola`) — as âncoras são lidas com o MESMO
 *      parser do índice, e as fases que esta metade não alcança são DITAS, não fingidas;
 *   C. o ELO — o que se apaga deixa registado o que existia: âncoras, hashes, impressão. E a
 *      rota `/api/apagar-escola` recusa com 409 sem tocar em nada, e só avança forçada com
 *      motivo declarado.
 *
 * O CONTROLE NEGATIVO é a secção C: o commit do expurgo NÃO chega a ser montado quando a
 * auditoria reprova. Sem essa medida, um «recusou» que ainda assim apagasse passaria por verde.
 *
 *   node experimentos/provar-proveniencia-do-expurgo.js
 */

const path = require('path');
const fs = require('fs');
const repo = require('../motor/servidor/repo-escola.js');
const prov = require('../motor/nucleo/proveniencia.js');

const RAIZ = path.resolve(__dirname, '..');

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const b64 = (texto) => Buffer.from(texto, 'utf8').toString('base64');

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

/** Uma âncora bem formada, na gramática que o `lerAncora` lê. */
const ancoraTexto = ({ id, hash = HASH_A, conteudo = HASH_B, cobertura = [], algoritmo = 'SHA-256' }) => [
  '# âncora de prova',
  'id: ' + id,
  'type: Ciclo',
  'hash_conteudo: ' + conteudo,
  'parentHash: ',
  'hash: ' + hash,
  'algoritmo: ' + algoritmo,
  'ancorado_em: 2026-11-07',
  'cobertura:',
  ...cobertura.map((c) => '  - ' + c),
  '',
].join('\n');

/**
 * A ÁRVORE de uma escola saudável: elo com criação declarada, uma variante com fontes, a
 * âncora a cobrir as duas, e os três derivados no lugar. É a base de todas as secções — cada
 * uma lhe tira ou estraga UMA coisa, e é essa diferença que se mede.
 */
const ARVORE_SAUDAVEL = [
  'escola/zzz/indice.json',
  'wrangler.zzz.jsonc',
  'professores/pp/ciclos/ciclo-01.conf',
  'professores/pp/ciclos/ciclo-01-zzz.conf',
  'professores/pp/ciclos/ciclo-01-zzz-po.md',
  'professores/pp/ciclos/ciclo-01-zzz.fipp',
  'indices/escolas/zzz.json',
  'indices/ciclos/pp/01-zzz.json',
];

const INVENTARIO = {
  escola: 'zzz',
  professor: { slug: 'pp', nome: 'P P' },
  ciclo: '01',
  arquivos: [],
  expurgo: [],
  recriacao: [{ em: '2026-11-07T00:00:00.000Z', professor: { slug: 'pp', nome: 'P P' }, ciclo: '01' }],
};

const ANCORA = {
  'professores/pp/ciclos/ciclo-01-zzz.fipp': ancoraTexto({
    id: 'ciclo-01-zzz',
    cobertura: ['professores/pp/ciclos/ciclo-01-zzz.conf', 'professores/pp/ciclos/ciclo-01.conf',
      'professores/pp/ciclos/ciclo-01-zzz-po.md'],
  }),
};

/** Um GitHub falso: serve a árvore e os ficheiros que a auditoria e o expurgo leem. */
function githubFalso({ arvore, arquivos }) {
  const estado = { corposDeArvore: [], commits: 0, leituras: [] };
  estado.fetch = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const responde = (status, corpo) => ({ ok: status >= 200 && status < 300, status, json: async () => corpo });
    const u = String(url);

    if (u.indexOf('/git/trees/') !== -1 && metodo === 'GET') {
      return responde(200, { tree: arvore.map((p) => ({ type: 'blob', path: p })) });
    }
    if (u.indexOf('/contents/') !== -1 && metodo === 'GET') {
      const m = /\/contents\/([^?]+)/.exec(u);
      const caminho = m ? decodeURIComponent(m[1]) : '';
      estado.leituras.push(caminho);
      if (arquivos[caminho] === undefined) return responde(404, { message: 'Not Found' });
      const cru = typeof arquivos[caminho] === 'string' ? arquivos[caminho] : JSON.stringify(arquivos[caminho], null, 2);
      return responde(200, { content: b64(cru) });
    }
    if (u.indexOf('/git/ref/heads/') !== -1 && metodo === 'GET') {
      return responde(200, { object: { sha: 'commit-base' } });
    }
    if (u.indexOf('/git/commits/') !== -1 && metodo === 'GET') {
      return responde(200, { sha: 'commit-base', tree: { sha: 'arvore-base' } });
    }
    if (u.indexOf('/git/trees') !== -1 && metodo === 'POST') {
      estado.corposDeArvore.push(JSON.parse(init.body));
      return responde(201, { sha: 'arvore-nova' });
    }
    if (u.indexOf('/git/commits') !== -1 && metodo === 'POST') {
      estado.commits += 1;
      return responde(201, { sha: 'commit-novo' });
    }
    if (u.indexOf('/git/refs/heads/') !== -1 && metodo === 'PATCH') {
      return responde(200, { object: { sha: 'commit-novo' } });
    }
    return responde(200, {});
  };
  return estado;
}

const auditarArvore = (estado, arvore) => repo.auditarProvenienciaDaEscola({
  token: 'x', dono: 'd', repo: 'r', ref: 'main', slug: 'zzz',
  caminhos: arvore, fetchImpl: estado.fetch,
});

(async () => {
  console.log('\nA. O NÚCLEO — cada verificação reprova pelo seu motivo, e o saudável passa');

  const lerAncora = (texto) => require('../motor/servidor/indice-acervo.js').lerAncora(texto);
  const ancorasLidas = (mapa) => Object.fromEntries(
    Object.entries(mapa).map(([c, t]) => [c, lerAncora(t)]));

  const saudavel = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_SAUDAVEL, indice: INVENTARIO, ancoras: ancorasLidas(ANCORA),
  });
  checar('a árvore saudável passa, e diz por quê (1 âncora, 2 fontes)',
    saudavel.ok && saudavel.resumo.ancoras === 1 && saudavel.resumo.fontes === 2, saudavel.problemas);
  checar('a impressão é SHA-256 do conjunto de âncoras',
    /^[0-9a-f]{64}$/.test(String(saudavel.impressao)), saudavel.impressao);

  const semAncora = await prov.auditar({
    slug: 'zzz',
    caminhos: ARVORE_SAUDAVEL.filter((c) => !c.endsWith('.fipp')),
    indice: INVENTARIO, ancoras: {},
  });
  checar('sem a âncora, reprova por «sem-ancora»',
    !semAncora.ok && semAncora.problemas.some((p) => p.codigo === 'sem-ancora'),
    semAncora.problemas.map((p) => p.codigo));

  const hashMau = JSON.parse(JSON.stringify(ANCORA));
  hashMau['professores/pp/ciclos/ciclo-01-zzz.fipp'] = ancoraTexto({ id: 'ciclo-01-zzz', hash: 'xyz',
    cobertura: ['professores/pp/ciclos/ciclo-01-zzz.conf', 'professores/pp/ciclos/ciclo-01.conf',
      'professores/pp/ciclos/ciclo-01-zzz-po.md'] });
  checar('com um hash que não é SHA-256, reprova por «ancora-hash»',
    (await prov.auditar({ slug: 'zzz', caminhos: ARVORE_SAUDAVEL, indice: INVENTARIO, ancoras: ancorasLidas(hashMau) }))
      .problemas.some((p) => p.codigo === 'ancora-hash'), null);

  const semRecriacao = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_SAUDAVEL, indice: { escola: 'zzz', expurgo: [] }, ancoras: ancorasLidas(ANCORA),
  });
  checar('um elo sem criação NENHUMA reprova por «sem-recriacao»',
    semRecriacao.problemas.some((p) => p.codigo === 'sem-recriacao'), semRecriacao.problemas.map((p) => p.codigo));

  /* A PRIMEIRA CRIAÇÃO NÃO TEM `recriacao[]` — E NÃO É UM ELO MUDO (16/11/2026).
   *
   * O FALSO POSITIVO, medido no expurgo da `duo`: ela nasceu naquele dia, com `criado_em` e
   * `professor` no topo do elo, e a auditoria mandou-a «reancorar, regerar os índices» — que não
   * podia resolver nada, porque a âncora e o derivado já conferiam (`--check` das duas fases a
   * passar). O `recriacao[]` só existe quando a escola é APAGADA e volta com o mesmo nome: exigir
   * esse elo de toda a escola era exigir que toda a escola tivesse sido apagada uma vez.
   *
   * As asserções abaixo são as duas metades: a primeira criação passa, e cada metade em falta
   * (quando / quem) continua a reprovar — o `sem-recriacao` não foi desligado, foi corrigido. */
  const primeiraCriacao = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_SAUDAVEL, ancoras: ancorasLidas(ANCORA),
    indice: {
      escola: 'zzz', ciclo: '01', criado_em: '2026-11-16T12:25:10.980318+00:00',
      professor: { slug: 'pp', nome: 'P P' }, arquivos: [],
    },
  });
  checar('a PRIMEIRA criação (`criado_em` + `professor`, sem `recriacao[]`) passa — é o caso da `duo`',
    primeiraCriacao.ok, primeiraCriacao.problemas);

  const semQuando = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_SAUDAVEL, ancoras: ancorasLidas(ANCORA),
    indice: { escola: 'zzz', professor: { slug: 'pp', nome: 'P P' } },
  });
  checar('…e sem o «quando» continua a reprovar (o elo não diz quando nasceu)',
    semQuando.problemas.some((p) => p.codigo === 'sem-recriacao'), semQuando.problemas.map((p) => p.codigo));

  const semQuem = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_SAUDAVEL, ancoras: ancorasLidas(ANCORA),
    indice: { escola: 'zzz', criado_em: '2026-11-16T12:25:10.980318+00:00' },
  });
  checar('…e sem o «quem» também (o elo não diz de quem são os arquivos)',
    semQuem.problemas.some((p) => p.codigo === 'sem-recriacao'), semQuem.problemas.map((p) => p.codigo));

  const recriada = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_SAUDAVEL, ancoras: ancorasLidas(ANCORA),
    indice: {
      escola: 'zzz', professor: { slug: 'pp', nome: 'P P' },
      recriacao: [{ em: '2026-11-16T12:00:00.000Z', professor: { slug: 'pp', nome: 'P P' }, ciclo: '01' }],
    },
  });
  checar('…e a RECRIAÇÃO declarada só no elo também passa (o elo novo vale, o topo é memória)',
    recriada.ok, recriada.problemas);

  const semCobertura = await prov.auditar({
    slug: 'zzz',
    caminhos: ARVORE_SAUDAVEL.concat(['professores/pp/ciclos/ciclo-01-zzz-plano.md']),
    indice: INVENTARIO, ancoras: ancorasLidas(ANCORA),
  });
  checar('uma fonte que nenhuma âncora cobre reprova por «fonte-sem-cobertura» (a âncora é velha)',
    semCobertura.problemas.some((p) => p.codigo === 'fonte-sem-cobertura'),
    semCobertura.problemas.map((p) => p.codigo));

  const semDerivado = await prov.auditar({
    slug: 'zzz',
    caminhos: ARVORE_SAUDAVEL.filter((c) => !c.startsWith('indices/')),
    indice: INVENTARIO, ancoras: ancorasLidas(ANCORA),
  });
  /* A ÂNCORA DE UMA AULA NÃO TEM MANIFESTO PRÓPRIO (07/11/2026) — e a regra exigia um.
   *
   * O DEFEITO, medido no expurgo da `breu`: uma `…-aula-01.fipp` era reprovada por
   * `ancora-orfa` porque não existia `…-aula-01.conf` — um ficheiro que não existe nem pode
   * existir, já que o manifesto é o da VARIANTE e a âncora da aula é aditiva a ele. A auditoria
   * recusava uma cadeia íntegra e mandava «reancorar», que não podia resolver nada: o nome do
   * manifesto não muda por se reancorar. O expurgo ficou bloqueado por um falso positivo.
   *
   * A árvore daqui é a saudável MAIS uma âncora de aula e a sua fonte — o manifesto que se
   * procura é o `ciclo-01-zzz.conf`, que já lá está. */
  const ARVORE_COM_AULA = ARVORE_SAUDAVEL.concat([
    'professores/pp/ciclos/ciclo-01-zzz-aula-01.md',
    'professores/pp/ciclos/ciclo-01-zzz-aula-01.fipp',
  ]);
  const ancoraDeAula = ancoraTexto({
    id: 'ciclo-01-zzz-aula-01',
    cobertura: ['professores/pp/ciclos/ciclo-01-zzz-aula-01.md'],
  });
  const ANCORA_COM_AULA = Object.assign({}, ANCORA, {
    'professores/pp/ciclos/ciclo-01-zzz-aula-01.fipp': ancoraDeAula,
  });
  /* A COBERTURA DA ÂNCORA DO CICLO cresce com a fonte nova — senão o bloqueio seria
   * «fonte-sem-cobertura», e estaríamos a medir outra coisa. */
  ANCORA_COM_AULA['professores/pp/ciclos/ciclo-01-zzz.fipp'] = ancoraTexto({
    id: 'ciclo-01-zzz',
    cobertura: ['professores/pp/ciclos/ciclo-01-zzz.conf', 'professores/pp/ciclos/ciclo-01.conf',
      'professores/pp/ciclos/ciclo-01-zzz-po.md', 'professores/pp/ciclos/ciclo-01-zzz-aula-01.md'],
  });

  const comAula = await prov.auditar({
    slug: 'zzz', caminhos: ARVORE_COM_AULA, indice: INVENTARIO, ancoras: ancorasLidas(ANCORA_COM_AULA),
  });
  checar('uma âncora de AULA com o manifesto da VARIANTE no lugar é aprovada (não há órfã)',
    comAula.ok, comAula.problemas);
  checar('…e as duas âncoras contam, e a da aula é reconhecida como tal',
    comAula.resumo.ancoras === 2 && comAula.ancoras.some((a) => a.aula === '01'),
    comAula.ancoras.map((a) => [a.id, a.aula]));

  /* A CONTRAPROVA, e é ela que impede a correção de ser um alívio da regra: tirado o manifesto
   * DA VARIANTE, a âncora da aula tem de reprovar — por órfã, e não por outra coisa. */
  const semManifestoDaVariante = await prov.auditar({
    slug: 'zzz',
    caminhos: ARVORE_COM_AULA.filter((c) => c !== 'professores/pp/ciclos/ciclo-01-zzz.conf'),
    indice: INVENTARIO, ancoras: ancorasLidas(ANCORA_COM_AULA),
  });
  checar('tirado o manifesto da variante, a âncora da aula REPROVA por «ancora-orfa»',
    !semManifestoDaVariante.ok
    && semManifestoDaVariante.problemas.some((p) => p.codigo === 'ancora-orfa'
      && p.mensagem.indexOf('ciclo-01-zzz.conf') !== -1),
    semManifestoDaVariante.problemas.map((p) => [p.codigo, p.mensagem]));

  /* E a âncora do CICLO continua a exigir o manifesto dela — a correção não tocou nessa. */
  const semManifestoDoCiclo = await prov.auditar({
    slug: 'zzz',
    caminhos: ARVORE_COM_AULA.filter((c) => c !== 'professores/pp/ciclos/ciclo-01-zzz.conf'),
    indice: INVENTARIO, ancoras: ancorasLidas(ANCORA_COM_AULA),
  });
  checar('…e a do ciclo também, as duas pelo mesmo motivo (duas órfãs, não uma)',
    semManifestoDoCiclo.problemas.filter((p) => p.codigo === 'ancora-orfa').length === 2,
    semManifestoDoCiclo.problemas.filter((p) => p.codigo === 'ancora-orfa').map((p) => p.mensagem));

  checar('sem os derivados, reprova por «indexacao-pendente» (a derivação ficou para trás)',
    semDerivado.problemas.filter((p) => p.codigo === 'indexacao-pendente').length === 2,
    semDerivado.problemas.map((p) => p.codigo));

  /* A CORREÇÃO VEM COM A RECUSA (16/11/2026).
   *
   * O DEFEITO, medido no expurgo da `duo`: a página dizia, para QUALQUER bloqueio, «corrija
   * primeiro: reancore e regere os índices». O bloqueio era o elo, e as duas fases que essa
   * instrução manda correr já passavam — a pessoa repetia e batia no mesmo muro. A correção passa
   * a ser a do CÓDIGO do bloqueio, e a asserção que interessa é a que separa os dois conselhos. */
  const todos = [semAncora, semRecriacao, semCobertura, semDerivado, semManifestoDoCiclo]
    .flatMap((r) => r.problemas);
  checar('todo bloqueio traz a SUA correção, e nenhuma é vazia',
    todos.length > 0 && todos.every((p) => typeof p.comoCorrigir === 'string' && p.comoCorrigir.length > 20),
    todos.filter((p) => !p.comoCorrigir).map((p) => p.codigo));

  const correcao = (lista, codigo) => {
    const p = lista.problemas.find((x) => x.codigo === codigo);
    return (p && p.comoCorrigir) || '';
  };
  checar('o bloqueio do ELO não manda reancorar — foi o defeito da `duo`',
    !/hash-ciclo/.test(correcao(semRecriacao, 'sem-recriacao')), correcao(semRecriacao, 'sem-recriacao'));
  checar('…e diz onde se corrige: no elo (`criado_em` + `professor`, ou a recriação)',
    /criado_em/.test(correcao(semRecriacao, 'sem-recriacao'))
      && /registrar-recriacao/.test(correcao(semRecriacao, 'sem-recriacao')),
    correcao(semRecriacao, 'sem-recriacao'));
  checar('o bloqueio da ÂNCORA manda reancorar (é o que resolve aquele)',
    /hash-ciclo/.test(correcao(semAncora, 'sem-ancora')), correcao(semAncora, 'sem-ancora'));
  checar('…e o da derivação manda regerar o derivado, e não reancorar',
    /gerar-indices\.js/.test(correcao(semDerivado, 'indexacao-pendente'))
      && !/hash-ciclo/.test(correcao(semDerivado, 'indexacao-pendente')),
    correcao(semDerivado, 'indexacao-pendente'));
  checar('a ÂNCORA ÓRFÃ não manda reancorar (reancorar não cria o manifesto que falta)',
    !/hash-ciclo/.test(correcao(semManifestoDoCiclo, 'ancora-orfa')),
    correcao(semManifestoDoCiclo, 'ancora-orfa'));

  /* E OS TRÊS CONSUMIDORES IMPRIMEM A FRASE DO NÚCLEO — nenhum reescreve a sua. */
  const pagina = fs.readFileSync(path.join(RAIZ, 'raiz/index.html'), 'utf8');
  checar('a página de apagar imprime `comoCorrigir` (e já não a frase do género)',
    /p\.comoCorrigir/.test(pagina)
      && !/reancora, `node tools\/gerar-indices\.js` regera o derivado/.test(pagina), null);
  checar('o `tools/auditar-proveniencia.js` também',
    /p\.comoCorrigir/.test(fs.readFileSync(path.join(RAIZ, 'tools/auditar-proveniencia.js'), 'utf8')), null);
  checar('e a metade local do expurgo também',
    /comoCorrigir/.test(fs.readFileSync(path.join(RAIZ, 'escola/expurgar.js'), 'utf8')), null);

  console.log('\nB. A ÁRVORE — a âncora é lida pelo MESMO parser do índice, e as fases são ditas');

  const estadoSaudavel = githubFalso({
    arvore: ARVORE_SAUDAVEL,
    arquivos: Object.assign({ 'escola/zzz/indice.json': INVENTARIO }, ANCORA),
  });
  const daArvore = await auditarArvore(estadoSaudavel, ARVORE_SAUDAVEL);
  checar('a auditoria sobre a árvore passa, e traz as âncoras com id e hash',
    daArvore.ok && daArvore.ancoras.length === 1 && daArvore.ancoras[0].id === 'ciclo-01-zzz',
    daArvore.problemas);
  checar('as fases que a metade do repositório NÃO alcança são declaradas',
    daArvore.fases && daArvore.fases.ancora === 'nao-recalculada' && daArvore.fases.derivacao === 'nao-conferida',
    daArvore.fases);
  checar('só os ficheiros que a auditoria precisa foram lidos (o elo e a âncora)',
    estadoSaudavel.leituras.length === 2, estadoSaudavel.leituras);

  const estadoQuebrado = githubFalso({
    arvore: ARVORE_SAUDAVEL.filter((c) => !c.endsWith('.fipp')),
    arquivos: { 'escola/zzz/indice.json': INVENTARIO },
  });
  const daArvoreQuebrada = await auditarArvore(estadoQuebrado, ARVORE_SAUDAVEL.filter((c) => !c.endsWith('.fipp')));
  checar('sem a âncora na árvore, a auditoria da árvore reprova',
    !daArvoreQuebrada.ok, daArvoreQuebrada.problemas.map((p) => p.codigo));

  console.log('\nC. O ELO — o que existia fica registado; e a rota recusa sem apagar');

  const estadoElo = githubFalso({
    arvore: ARVORE_SAUDAVEL,
    arquivos: Object.assign({ 'escola/zzz/indice.json': INVENTARIO }, ANCORA),
  });
  const r = await repo.apagarEscolaDoRepo({
    token: 'x', dono: 'd', repo: 'r', ref: 'main',
    slug: 'zzz', confirmacao: 'zzz', motivo: 'prova', quando: '2026-11-07T00:00:00.000Z',
    proveniencia: daArvore, fetchImpl: estadoElo.fetch,
  });
  const corpo = estadoElo.corposDeArvore[estadoElo.corposDeArvore.length - 1] || { tree: [] };
  const doIndice = (corpo.tree || []).find((t) => t.path === 'escola/zzz/indice.json');
  const indiceNovo = doIndice && doIndice.content ? JSON.parse(doIndice.content) : null;
  const elo = indiceNovo && indiceNovo.expurgo ? indiceNovo.expurgo[indiceNovo.expurgo.length - 1] : null;
  checar('o expurgo entra (o commit é montado)', r.ok === true, r);
  checar('o elo registra a proveniência que existia — âncoras, hashes e impressão',
    Boolean(elo && elo.proveniencia && elo.proveniencia.ancoras.length === 1
      && elo.proveniencia.ancoras[0].hash === HASH_A
      && /^[0-9a-f]{64}$/.test(String(elo.proveniencia.impressao))),
    elo && elo.proveniencia);
  checar('…e diz que foi auditada', Boolean(elo && elo.proveniencia && elo.proveniencia.auditada === true),
    elo && elo.proveniencia);
  checar('a âncora sai no commit (a proveniência é apagada, depois de registada)',
    (corpo.tree || []).some((t) => t.path === 'professores/pp/ciclos/ciclo-01-zzz.fipp' && t.sha === null),
    (corpo.tree || []).map((t) => t.path));

  /* A ROTA. O `fetch` global é substituído porque é ele que `raiz.js` usa: o GitHub responde
   * pelo falso, e o Cloudflare LANÇA — o que é a medida certa, porque na recusa (409) ele nem
   * chega a ser chamado. Se fosse chamado, o relatório diria. */
  const raiz = require('../motor/servidor/raiz.js');
  const autorizacao = { Authorization: 'Basic ' + Buffer.from('tmenegaz:segredo').toString('base64') };
  /* `HOST_DONO` É O QUE FAZ ESTE ENDEREÇO SER O PAINEL (25/11/2026). Sem ele, `danca.internal`
   * não é `*.workers.dev` nem o host do dono, e `ehPaginaPublica` responde **404** — a prova
   * passou a medir a ausência da rota em vez do 409 que ela existe para medir.
   *
   * E O ESTADO COMERCIAL ENTROU NA PROVA (16/11/2026). A rota passou a exigir que a escola esteja
   * SUSPENSA e com a carência vencida antes de auditar a proveniência — «apagá-la seria apagar o
   * que está a ser usado». Sem essa metade, a prova media a recusa COMERCIAL nas quatro asserções
   * seguintes, e chamava-lhe «proveniência»: o 409 vinha do sítio errado. A `PADD_KV` de memória
   * declara a escola suspensa desde 2025, muito antes dos três meses de carência. */
  const dadosKv = new Map([
    ['bastidores/zzz/comercial', JSON.stringify({ estado: 'suspensa', desabilitadaEm: '2025-06-01T00:00:00.000Z' })],
    /* O MARCO DO REGIME DE TESTE, declarado à mão. Sem esta chave o próprio `regimeDeTeste` a
     * CRIA com a hora de agora — e uma escola suspensa em 2025 fica «antes de este prazo existir»,
     * que é a recusa certa para o caso errado. Com o marco a 2025-01-01, a suspensão de Junho é
     * posterior a ele, e a carência conta como contaria a sério. */
    ['expurgo/regime-de-teste-desde', '2025-01-01T00:00:00.000Z'],
  ]);
  const kvDaRota = {
    async get(k) { return dadosKv.has(k) ? dadosKv.get(k) : null; },
    async put(k, v) { dadosKv.set(k, String(v)); },
    async delete(k) { dadosKv.delete(k); },
    async list() { return { keys: [], list_complete: true }; },
  };
  const envDaRota = { SENHA_RAIZ: 'segredo', GITHUB_TOKEN: 'x', CLOUDFLARE_API_TOKEN: 'y',
    ASSETS: null, HOST_DONO: 'danca.internal', PADD_KV: kvDaRota };
  const pedirExpurgo = async (corpo, estado) => {
    const original = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      const u = String(url);
      if (u.indexOf('api.github.com') !== -1) return estado.fetch(url, init);
      throw new Error('Cloudflare não devia ser chamado nesta prova');
    };
    try {
      const req = new Request('https://danca.internal/api/apagar-escola', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, autorizacao),
        body: JSON.stringify(Object.assign({ escola: 'zzz', confirmacao: 'zzz' }, corpo)),
      });
      const res = await raiz.fetch(req, envDaRota);
      let json = null;
      try { json = await res.json(); } catch { json = null; }
      return { status: res.status, corpo: json };
    } finally {
      globalThis.fetch = original;
    }
  };

  const estadoRecusa = githubFalso({
    arvore: ARVORE_SAUDAVEL.filter((c) => !c.endsWith('.fipp')),
    arquivos: { 'escola/zzz/indice.json': INVENTARIO },
  });
  const recusa = await pedirExpurgo({}, estadoRecusa);
  checar('a rota recusa com 409 quando a proveniência não está em ordem',
    recusa.status === 409, { status: recusa.status, erro: recusa.corpo && recusa.corpo.erro });
  checar('…e NÃO monta commit nenhum (nada foi apagado)',
    estadoRecusa.corposDeArvore.length === 0 && estadoRecusa.commits === 0,
    { arvores: estadoRecusa.corposDeArvore.length, commits: estadoRecusa.commits });
  checar('…e o relatório traz os bloqueios, um a um',
    Boolean(recusa.corpo && recusa.corpo.proveniencia && recusa.corpo.proveniencia.problemas
      && recusa.corpo.proveniencia.problemas.length),
    recusa.corpo && recusa.corpo.proveniencia);

  const estadoSemMotivo = githubFalso({
    arvore: ARVORE_SAUDAVEL.filter((c) => !c.endsWith('.fipp')),
    arquivos: { 'escola/zzz/indice.json': INVENTARIO },
  });
  const semMotivo = await pedirExpurgo({ forcar: true }, estadoSemMotivo);
  checar('forçar SEM motivo é recusado com 400 — quem força, declara',
    semMotivo.status === 400 && estadoSemMotivo.corposDeArvore.length === 0,
    { status: semMotivo.status, arvores: estadoSemMotivo.corposDeArvore.length });

  const estadoForcado = githubFalso({
    arvore: ARVORE_SAUDAVEL.filter((c) => !c.endsWith('.fipp')),
    arquivos: { 'escola/zzz/indice.json': INVENTARIO, 'wrangler.zzz.jsonc': '{ "name": "zzz" }' },
  });
  const forcado = await pedirExpurgo({ forcar: true, motivoDoForcar: 'escola de teste, registo perdido' }, estadoForcado);
  const corpoForcado = estadoForcado.corposDeArvore[estadoForcado.corposDeArvore.length - 1] || { tree: [] };
  const doIndiceForcado = (corpoForcado.tree || []).find((t) => t.path === 'escola/zzz/indice.json');
  const indiceForcado = doIndiceForcado && doIndiceForcado.content ? JSON.parse(doIndiceForcado.content) : null;
  const eloForcado = indiceForcado && indiceForcado.expurgo
    ? indiceForcado.expurgo[indiceForcado.expurgo.length - 1] : null;
  checar('forçado com motivo, o expurgo do repositório avança',
    Boolean(forcado.corpo && forcado.corpo.repositorio && forcado.corpo.repositorio.ok),
    forcado.corpo && forcado.corpo.repositorio);
  checar('…e o elo diz que foi FORÇADO, com o motivo e os bloqueios',
    Boolean(eloForcado && eloForcado.proveniencia && eloForcado.proveniencia.forcada === 'escola de teste, registo perdido'
      && Array.isArray(eloForcado.proveniencia.problemas) && eloForcado.proveniencia.problemas.length),
    eloForcado && eloForcado.proveniencia);

  console.log('\n' + (falhas ? falhas + ' FALHA(S) em ' + n + ' verificações' : n + '/' + n + ' ok'));
  process.exit(falhas ? 1 : 0);
})();
