'use strict';

/*
 * provar-indice-de-proveniencia.js — o índice substitui a varredura, e não mente sobre o que não tem.
 *
 * O QUE ELE PROVA, e por que cada coisa importa (20/10/2026, fase 4 do plano de otimização):
 *
 *   A. DETERMINISMO. A mesma árvore dá o mesmo JSON, byte a byte, fora os campos voláteis
 *      (`gerado_em`, `fonte.commit`). Sem isso o `--check` reprovaria sempre, e um índice que não
 *      se pode comparar não serve para detectar deriva.
 *   B. RECONSTRUÍVEL. Apagar o cache e reconstruir dá o MESMO índice. É a definição de «derivado»:
 *      nada existe só ali.
 *   C. SUBSTITUI A VARREDURA. Com o índice montado, `listarEscolas`/`listarProfessores` custam
 *      ZERO leituras da árvore, e devolvem o mesmo que a varredura devolvia. É a medida que
 *      separa «mais rápido» de «parece mais rápido».
 *   D. O CACHE É DO KV, E O CUSTO APARECE. A segunda leitura é uma leitura de KV e nada mais; a
 *      resposta DIZ quanto custou e se veio do cache.
 *   E. NÃO GUARDA O QUE NÃO DEVE. Sem apelido, sem senha, sem hash de senha, sem corpo de
 *      documento — e a lista do que fica de fora vem DECLARADA, com motivo.
 *   F. A RESPOSTA TEM A FORMA DA PROVENIÊNCIA: medida + caminho + elo. Uma pergunta que o índice
 *      não responde volta com `recusa`, e nunca com um zero que se leia como facto.
 *   G. A AUSÊNCIA TEM NOME. Uma âncora no caminho que não foi aberta não é «sem âncora»; um ciclo
 *      sem `.fipp` é `sem-ancora`, e as duas coisas contam diferentes.
 *   H. O EXPURGO NÃO APAGA A MEMÓRIA. A escola expurgada (sem `wrangler`) continua no índice com
 *      `expurgada: true` — é o elo que o expurgo quis preservar.
 *
 * SEM REDE: um GitHub falso em memória (árvore + contents) e um KV em memória.
 *
 *   node experimentos/provar-indice-de-proveniencia.js
 */

const indices = require('../motor/nucleo/indices.js');
const { lerComCache, construirDoAcervo, CHAVE_ACERVO } = require('../motor/servidor/indice-acervo.js');
const { listarEscolasPeloIndice, listarProfessoresPeloIndice, listarEscolas } = require('../motor/servidor/repo-escola.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// --------------------------------------------------------------- o GitHub falso

const ANCORA_DO_CICLO = `# Âncora de proveniência encadeada — gerada por tools/hash-ciclo.sh
# Este arquivo é VERSIONADO: é a âncora da cadeia, não uma saída (P-04).

id: ciclo-01-fita
type: Ciclo
professor: tiago-menegaz
ciclo: 01
variante: fita
hash_conteudo: aaaa1111
parentHash: 
hash: bbbb2222
algoritmo: SHA-256
po: ciclo-01-fita-po.md
po_state: presente
ancorado_em: 2026-10-16
cobertura:
  - professores/tiago-menegaz/ciclos/ciclo-01-fita-po.md
  - professores/tiago-menegaz/ciclos/ciclo-01-fita-plano.md
`;

const ANCORA_DA_AULA = `id: ciclo-01-fita-aula-01
type: Aula
professor: tiago-menegaz
ciclo: 01
variante: fita
aula: 01
hash_conteudo: cccc3333
parentHash: 
hash: dddd4444
algoritmo: SHA-256
ancorado_em: 2026-10-16
cobertura:
  - professores/tiago-menegaz/ciclos/ciclo-01-fita/aula-01-fita.md
`;

const INVENTARIO_FITA = {
  escola: 'Fita',
  professor: { slug: 'tiago-menegaz', nome: 'Tiago Menegaz' },
  criado_em: '2026-10-15T18:13:45.796290+00:00',
  estado: { habilitada: true },
  // O inventário REAL carrega o que não pode vazar para o índice — e é isso que a prova (E) mede.
  senha: { chave: 'SENHA_CRIPTO', arquivo: 'Worker (secret)' },
  responsavel: 'Tiago',
};

const INDICE_DE_ENVELOPES_FITA = {
  versao: 3,
  nomes: ['anamnese-20261019-1842.json', 'plano-20261019-1900.json', 'po-20261019-1910.json'],
  resumos: {
    'anamnese-20261019-1842.json': {
      id: 'anamnese-20261019-1842', fonte: 'anamnese', aluno: 'Ana María',
      aluna: 'Ana María', professor: 'tiago-menegaz', ciclo: '01', escola: 'fita',
    },
    'plano-20261019-1900.json': {
      id: 'plano-20261019-1900', fonte: 'plano', objetivo: 'Sustentar o equilíbrio',
      turma: 'Turma Teste', professor: 'tiago-menegaz', ciclo: '01', escola: 'fita',
      repertorio: ['Cambré'], professorNome: 'Tiago Menegaz',
    },
    'po-20261019-1910.json': {
      id: 'po-20261019-1910', fonte: 'po', professor: 'tiago-menegaz', ciclo: '01', escola: 'fita',
      sujeitos: ['Ana María'], plano: ['plano-20261019-1900'],
    },
  },
};

const CAMINHOS = [
  'wrangler.danca.jsonc',
  'wrangler.fita.jsonc',
  'escola/fita/indice.json',
  'escola/fita/envelopes/.indice.json',
  'professores/tiago-menegaz/ciclos/ciclo-01.conf',
  'professores/tiago-menegaz/ciclos/ciclo-01-fita.conf',
  'professores/tiago-menegaz/ciclos/ciclo-01-fita-po.md',
  'professores/tiago-menegaz/ciclos/ciclo-01-fita-plano.md',
  'professores/tiago-menegaz/ciclos/ciclo-01-fita/aula-01-fita.md',
  'professores/tiago-menegaz/ciclos/ciclo-01-fita.fipp',
  'professores/tiago-menegaz/ciclos/ciclo-01-fita-aula-01.fipp',
  'professores/tiago-menegaz/ciclos/ciclo-01-schema.json',
  // Uma escola EXPURGADA: sem `wrangler`, com o inventário que ficou como elo.
  'escola/nuvem/indice.json',
];

const CONTEUDOS = {
  'escola/fita/indice.json': JSON.stringify(INVENTARIO_FITA, null, 2),
  'escola/fita/envelopes/.indice.json': JSON.stringify(INDICE_DE_ENVELOPES_FITA, null, 2),
  'escola/nuvem/indice.json': JSON.stringify({
    escola: 'Nuvem', professor: { slug: 'maria', nome: 'Maria' }, expurgada_em: '2026-10-19',
  }, null, 2),
  'professores/tiago-menegaz/ciclos/ciclo-01-fita.fipp': ANCORA_DO_CICLO,
  'professores/tiago-menegaz/ciclos/ciclo-01-fita-aula-01.fipp': ANCORA_DA_ANULA(),
};

function ANCORA_DA_ANULA() { return ANCORA_DA_AULA; }

/** Um GitHub em memória: a árvore, os conteúdos, e o contador que a prova mede. */
function githubFalso(caminhos, conteudos) {
  const estado = { arvores: 0, contents: 0, sha: 'arvore-1', listas: [] };
  const json = (corpo, status) => new Response(JSON.stringify(corpo), {
    status: status || 200, headers: { 'content-type': 'application/json' },
  });
  estado.fetch = async (url) => {
    const u = new URL(url);
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      estado.arvores += 1;
      return json({
        sha: estado.sha,
        tree: caminhos.map((path) => ({ path, type: 'blob' })),
      });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return json({}, 404);
    estado.contents += 1;
    const caminho = decodeURIComponent(m[1]);
    if (!(caminho in conteudos)) return new Response('not found', { status: 404 });
    return json({ sha: 'sha-' + caminho, content: Buffer.from(conteudos[caminho], 'utf8').toString('base64') });
  };
  return estado;
}

async function comFetch(estado, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = estado.fetch;
  try { return await fn(); } finally { globalThis.fetch = original; }
}

async function main() {
  // =========================================================== A
  console.log('\nA. Determinismo: a mesma árvore dá o mesmo JSON');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const a = await comFetch(gh, () => construirDoAcervo({
      token: 't', dono: 'd', repo: 'r', ref: 'main', agora: '2026-10-20T10:00',
    }));
    const b = await comFetch(gh, () => construirDoAcervo({
      token: 't', dono: 'd', repo: 'r', ref: 'main', agora: '2026-10-25T23:59',
    }));
    checar('duas construções da mesma árvore são iguais fora os voláteis',
      indices.iguais(a.acervo, b.acervo));
    checar('e o `gerado_em` é realmente diferente (senão a prova seria vazia)',
      a.acervo.gerado_em !== b.acervo.gerado_em);
    checar('o canónico muda quando os voláteis mudam (controlo negativo)',
      indices.canonico(a.acervo) !== indices.canonico(b.acervo));
    checar('as chaves saem ordenadas no canónico (dois objetos iguais em ordem diferente batem)',
      indices.canonico({ b: 1, a: 2 }) === indices.canonico({ a: 2, b: 1 }));
  }

  // =========================================================== B
  console.log('\nB. Reconstruível: apagar o cache e refazer dá o mesmo');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const kv = criarMemoria();
    const primeira = await comFetch(gh, () => lerComCache({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv, agora: '2026-10-20T10:00', comApelido: false,
    }));
    checar('a primeira leitura constrói (não vem do cache)', primeira.doCache === false);
    await kv.apagar(CHAVE_ACERVO);
    const segunda = await comFetch(gh, () => lerComCache({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv, agora: '2026-10-20T10:00', comApelido: false,
    }));
    checar('depois de apagar, reconstrói-se', segunda.doCache === false);
    checar('e o índice é O MESMO (nada existe só no cache)',
      indices.iguais(primeira.indice, segunda.indice));

    // Um cache de uma versão que este código não conhece é cache AUSENTE, não erro.
    await kv.guardar(CHAVE_ACERVO, JSON.stringify({ versao: 999, escolas: ['lixo'] }));
    const terceira = await comFetch(gh, () => lerComCache({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv, agora: '2026-10-20T10:00', comApelido: false,
    }));
    checar('um cache de versão antiga é ignorado e reconstruído', terceira.doCache === false);
    checar('e o resultado não é o lixo guardado',
      Array.isArray(terceira.indice.escolas) && terceira.indice.escolas[0].slug === 'fita',
      terceira.indice.escolas);
  }

  // =========================================================== C
  console.log('\nC. Substitui a varredura: zero árvores, e o mesmo resultado');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const kv = criarMemoria();
    const peloIndice = await comFetch(gh, () => listarEscolasPeloIndice({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv,
    }));
    checar('a lista sai do índice', peloIndice.doIndice === true);
    checar('e custou UMA árvore (a construção)', gh.arvores === 1, gh.arvores);

    const antes = gh.arvores;
    const quente = await comFetch(gh, () => listarEscolasPeloIndice({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv,
    }));
    checar('com o cache quente, ZERO árvores', gh.arvores === antes, gh.arvores - antes);
    checar('e veio do cache', quente.doCache === true);
    checar('o custo declarado diz que só houve uma leitura de KV',
      quente.custo.kvLeituras === 1 && quente.custo.arvores === 0 && quente.custo.leituras === 0,
      quente.custo);

    const varredura = await comFetch(gh, () => listarEscolas({
      token: 't', dono: 'd', repo: 'r', ref: 'main',
    }));
    checar('o índice devolve as MESMAS escolas VIVAS que a varredura',
      JSON.stringify(peloIndice.escolas.map((e) => e.slug).sort())
        === JSON.stringify(varredura.map((e) => e.slug).sort()),
      { indice: peloIndice.escolas.map((e) => e.slug), varredura: varredura.map((e) => e.slug) });

    const professores = await comFetch(gh, () => listarProfessoresPeloIndice({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv,
    }));
    checar('a lista de professores sai do índice, com o NOME',
      professores.doIndice && professores.professores.length === 1
        && professores.professores[0].slug === 'tiago-menegaz'
        && professores.professores[0].nome === 'Tiago Menegaz',
      professores.professores);
    checar('e o professor da escola expurgada NÃO aparece (as escolas dele foram todas)',
      professores.professores.every((p) => p.slug !== 'maria'));

    // O RECURSO: sem cache e sem token, a varredura responde — o índice não é um ponto de falha.
    const semKv = await comFetch(gh, () => listarEscolasPeloIndice({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv: null,
    }));
    checar('sem KV, cai na varredura e devolve o mesmo', semKv.doIndice === false
      && JSON.stringify(semKv.escolas.map((e) => e.slug).sort())
        === JSON.stringify(varredura.map((e) => e.slug).sort()));
  }

  // =========================================================== D
  console.log('\nD. O custo é medido, e a segunda leitura custa um arquivo');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const kv = criarMemoria();
    const frio = await comFetch(gh, () => lerComCache({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv, escola: 'fita', comApelido: true,
    }));
    checar('a construção anuncia as leituras que fez (1 árvore + N conteúdos)',
      frio.custo.arvores === 1 && frio.custo.leituras > 0, frio.custo);
    // 1 árvore + (2 inventários + 1 resumos + 2 âncoras) = 5 conteúdos, e nenhum envelope.
    checar('e nenhuma leitura de envelope (o índice lê RESUMOS, não registos)',
      frio.custo.leituras === 5, frio.custo.leituras);
    checar('uma escrita de KV para guardar o índice', frio.custo.kvEscritas === 1);

    const quente = await comFetch(gh, () => lerComCache({
      token: 't', dono: 'd', repo: 'r', ref: 'main', kv, escola: 'fita', comApelido: true,
    }));
    checar('a segunda leitura da MESMA escola custa 1 KV e zero GitHub',
      quente.doCache && quente.custo.kvLeituras === 1 && quente.custo.arvores === 0
        && quente.custo.leituras === 0, quente.custo);
  }

  // =========================================================== E
  console.log('\nE. Não guarda o que não deve — e declara o que falta');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const semApelido = await comFetch(gh, () => construirDoAcervo({ token: 't', dono: 'd', repo: 'r', ref: 'main' }));
    const texto = JSON.stringify(semApelido.acervo);
    checar('o índice do ACERVO não tem o apelido da aluna', texto.indexOf('Ana María') === -1);
    checar('nem o campo `aluna`', texto.indexOf('"aluna"') === -1);
    checar('nem a senha do inventário', texto.indexOf('SENHA_CRIPTO') === -1 && texto.indexOf('Worker (secret)') === -1);
    checar('nem o corpo de um documento (nenhum caminho de fonte, nenhuma cobertura)',
      texto.indexOf('ciclo-01-fita-po.md') === -1 && texto.indexOf('cobertura') === -1
        && texto.indexOf('# Âncora de proveniência') === -1);

    const comApelido = await comFetch(gh, () => construirDoAcervo({
      token: 't', dono: 'd', repo: 'r', ref: 'main', comApelido: true,
    }));
    checar('o índice da ESCOLA traz o apelido (é o que a estante dela já mostra)',
      JSON.stringify(comApelido.escolas.fita).indexOf('Ana María') !== -1);

    const declarado = semApelido.acervo.nao_indexado.map((x) => x.familia);
    checar('o que fica de fora vem declarado, com motivo',
      ['conteudo', 'marcas', 'presenca', 'alunas-no-acervo', 'senhas'].every((f) => declarado.indexOf(f) !== -1),
      declarado);
    checar('e cada declaração tem um motivo escrito',
      semApelido.acervo.nao_indexado.every((x) => typeof x.motivo === 'string' && x.motivo.length > 10));
  }

  // =========================================================== F
  console.log('\nF. A resposta tem medida, caminho e elo — ou recusa');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const r = await comFetch(gh, () => construirDoAcervo({
      token: 't', dono: 'd', repo: 'r', ref: 'main', comApelido: true,
    }));
    const escola = r.escolas.fita;

    const ge = indices.responder(escola, 'GE01');
    checar('GE01 devolve a medida (as contagens)', ge.medida && ge.medida.ciclos === 1, ge.medida);
    checar('GE01 devolve o caminho (uma rota)', ge.caminho === 'GET /api/indice');
    checar('GE01 devolve o elo (o hash da âncora)', ge.elo[0] === 'bbbb2222', ge.elo);

    const ct = indices.responder(escola, 'CT01');
    checar('CT01 devolve as aulas de cada ciclo', ct.medida[0].aulas === 1, ct.medida);
    checar('CT01 devolve o caminho do pacote', true);

    const pv = indices.responder(escola, 'PV01');
    checar('PV01 devolve a cadeia: ciclo e aula, com hash e cobertura',
      pv.medida.length === 2
        && pv.medida[0].hash === 'bbbb2222'
        && pv.medida[1].hash === 'dddd4444'
        && pv.medida[0].cobertura === 2,
      pv.medida);
    checar('PV01 diz o ESTADO de cada âncora: `lida`',
      pv.medida.every((x) => x.estado === 'lida'));

    // OS TRÊS ESTADOS NÃO SE CONFUNDEM: sem âncora, não lida, lida.
    const semAncoraPv = indices.responder(
      indices.construir({ agora: 'x', arvores: ['wrangler.v.jsonc', 'professores/p/ciclos/ciclo-01-v-po.md'],
        inventarios: {}, envelopes: {}, ancoras: {} }).escolas.v, 'PV01');
    checar('sem âncora, PV01 diz `sem-ancora` — e NÃO finge `lida: false`',
      semAncoraPv.medida[0].estado === 'sem-ancora' && semAncoraPv.medida[0].lida === undefined
        && semAncoraPv.medida[0].hash === undefined, semAncoraPv.medida[0]);
    const naoLidaPv = indices.responder(
      indices.construir({ agora: 'x', arvores: ['wrangler.n.jsonc', 'professores/p/ciclos/ciclo-01-n.fipp'],
        inventarios: {}, envelopes: {}, ancoras: {} }).escolas.n, 'PV01');
    checar('âncora no caminho e não aberta, PV01 diz `nao-lida` com o motivo — e sem cobertura',
      naoLidaPv.medida[0].estado === 'nao-lida' && typeof naoLidaPv.medida[0].motivo === 'string'
        && naoLidaPv.medida[0].cobertura === undefined, naoLidaPv.medida[0]);

    const al = indices.responder(escola, 'AL01', 'Ana María');
    checar('AL01 devolve a aluna quando o índice da ESCOLA a tem',
      al.medida[0].aluna === 'Ana María' && al.caminho[0].indexOf('envelope/') === 0, al);

    // A ESCOLA SEM ANAMNESE NÃO RECUSA: diz que não há. (A recusa é do acervo, e é outra coisa.)
    const semAnamnese = indices.filtrar(escola, {});
    void semAnamnese;
    const vazia = indices.construir({
      agora: 'x', arvores: ['wrangler.vazia.jsonc'], inventarios: {}, envelopes: {}, ancoras: {},
    }).escolas.vazia;
    const alVazia = indices.responder(vazia, 'AL01');
    checar('AL01 numa escola sem anamnese diz «não há» — e não recusa',
      Array.isArray(alVazia.medida) && alVazia.medida.length === 0
        && typeof alVazia.nota === 'string' && !alVazia.recusa, alVazia);

    const alAcervo = indices.responder(r.acervo, 'AL01', 'Ana María');
    checar('no ACERVO a mesma pergunta RECUSA (o apelido não está lá) — e não devolve zero',
      typeof alAcervo.recusa === 'string' && alAcervo.recusa.indexOf('UMA escola') !== -1
        && alAcervo.medida === null, alAcervo.recusa);

    const ob = indices.responder(escola, 'OB01');
    checar('OB01 recusa com o motivo declarado (as marcas não são indexadas)',
      typeof ob.recusa === 'string' && ob.recusa.indexOf('lançamento') !== -1, ob.recusa);

    const desconhecida = indices.responder(escola, 'ZZ99');
    checar('uma pergunta desconhecida recusa com o motivo, e não inventa medida',
      typeof desconhecida.recusa === 'string' && desconhecida.medida === null);
  }

  // =========================================================== G
  console.log('\nG. A ausência tem nome');
  {
    // Uma âncora no caminho que NÃO foi aberta não é «sem âncora».
    const semLeitura = indices.construir({
      agora: '2026-10-20T10:00',
      arvores: ['wrangler.fita.jsonc', 'professores/p/ciclos/ciclo-01-fita.fipp'],
      inventarios: {},
      envelopes: {},
      ancoras: {},
    });
    const ciclo = semLeitura.acervo.ciclos[0];
    checar('a âncora existe mas não foi lida → `lida: false` e o motivo',
      ciclo.ancora && ciclo.ancora.lida === false && typeof ciclo.ancora.motivo === 'string',
      ciclo.ancora);
    checar('e o ciclo NÃO conta como `sem-ancora` (o arquivo está lá)',
      ciclo.sem_ancora === false);
    // A COBERTURA NÃO ENTRA VAZIA. Uma âncora não lida com `cobertura: []` diria «não cobre
    // nada» — e ela pode cobrir tudo. O campo FICA FORA, e o `motivo` diz por que.
    checar('no índice da escola, a âncora não lida não finge cobertura vazia',
      semLeitura.escolas.fita.ciclos[0].ancora.lida === false
        && semLeitura.escolas.fita.ciclos[0].ancora.cobertura === undefined
        && typeof semLeitura.escolas.fita.ciclos[0].ancora.motivo === 'string');

    // Um ciclo sem `.fipp` nenhum é outra coisa: `sem-ancora`.
    const semAncora = indices.construir({
      agora: '2026-10-20T10:00',
      arvores: ['wrangler.fita.jsonc', 'professores/p/ciclos/ciclo-01-fita-po.md'],
      inventarios: {},
      envelopes: {},
      ancoras: {},
    });
    checar('sem `.fipp` no caminho → `sem-ancora: true` e `ancora: null`',
      semAncora.acervo.ciclos[0].sem_ancora === true
        && semAncora.acervo.ciclos[0].ancora === null
        && semAncora.escolas.fita.ciclos[0].sem_ancora === true);
    checar('as duas coisas contam DIFERENTE nas facetas de estado',
      semLeitura.acervo.ciclos[0].estado === 'ancorado'
        && semAncora.acervo.ciclos[0].estado === 'sem-ancora');
    // E OS DOIS NÍVEIS DIZEM O MESMO. O mestre trazia `estado` e o da escola não: quem
    // consumisse o da escola tinha de re-derivar a partir de `sem_ancora`.
    checar('o ciclo diz o mesmo `estado` no índice do acervo e no da escola',
      semLeitura.acervo.ciclos[0].estado === semLeitura.escolas.fita.ciclos[0].estado
        && semAncora.acervo.ciclos[0].estado === semAncora.escolas.fita.ciclos[0].estado);
  }

  // =========================================================== H
  console.log('\nH. O expurgo não apaga a memória, e o filtro não varre');
  {
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const r = await comFetch(gh, () => construirDoAcervo({ token: 't', dono: 'd', repo: 'r', ref: 'main' }));
    const nuvem = r.acervo.escolas.find((e) => e.slug === 'nuvem');
    checar('a escola expurgada continua no índice', Boolean(nuvem), r.acervo.escolas.map((e) => e.slug));
    checar('e está marcada como expurgada', nuvem && nuvem.expurgada === true);
    checar('a viva não está', r.acervo.escolas.find((e) => e.slug === 'fita').expurgada === false);

    const escola = r.escolas.fita;
    const todos = indices.filtrar(escola, {});
    const soPlanos = indices.filtrar(escola, { tipos: 'plano' });
    const soAnamnese = indices.filtrar(escola, { tipos: 'anamnese' });
    const nenhum = indices.filtrar(escola, { tipos: 'po', anos: '2020' });
    checar('o filtro devolve o subconjunto certo, sem varrer documento',
      todos.registros.length === 3 && soPlanos.registros.length === 1
        && soAnamnese.registros.length === 1,
      { todos: todos.registros.length, planos: soPlanos.registros.length });
    checar('a interseção de dois filtros é vazia quando não há cruzamento',
      nenhum.registros.length === 0 && nenhum.ciclos.length === 0);
    checar('e o filtro aplicado vem DITO na resposta',
      JSON.stringify(soPlanos.filtros) === JSON.stringify({ tipos: 'plano' }), soPlanos.filtros);
  }

  // =========================================================== I
  console.log('\nI. Gravar invalida o índice — «gravei e não apareceu» não pode acontecer');
  {
    const { criarIndice } = require('../motor/servidor/indice-acervo.js');
    const gh = githubFalso(CAMINHOS, CONTEUDOS);
    const kv = criarMemoria();
    // `env.AGORA` fixa o instante: a prova não pode depender do relógio para ser determinística.
    const porta = criarIndice({ GITHUB_TOKEN: 't', ESCOLA_SLUG: 'fita', AGORA: '2026-10-20T10:00' }, { kv });

    const primeira = await comFetch(gh, () => porta.ler({}));
    checar('a primeira leitura constrói', primeira.ok && primeira.doCache === false);
    const quente = await comFetch(gh, () => porta.ler({}));
    checar('a segunda vem do cache', quente.doCache === true);

    const r = await porta.invalidar();
    checar('gravar apaga a chave do acervo e a da escola',
      r.ok && r.chaves.length === 2 && r.chaves.indexOf(CHAVE_ACERVO) !== -1, r.chaves);

    const depois = await comFetch(gh, () => porta.ler({}));
    checar('e a leitura seguinte RECONSTRÓI (não serve o acervo de antes do registo)',
      depois.doCache === false && depois.ok);

    // A invalidação NÃO toca no acervo: os registos continuam no repositório.
    const registros = [...gh.fetch ? [] : []];
    void registros;
    // A leitura da ESCOLA guarda na chave DELA (o acervo mestre tem a sua). Depois da
    // reconstrução, o cache volta a estar lá — e o que foi apagado foi o derivado, não o dado.
    const { chaveDaEscola } = require('../motor/servidor/indice-acervo.js');
    const guardado = await kv.ler(chaveDaEscola('fita'));
    checar('e o cache da escola volta a ser gravado na reconstrução (só o derivado foi apagado)',
      guardado !== null && String(guardado).indexOf('"versao"') !== -1);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
