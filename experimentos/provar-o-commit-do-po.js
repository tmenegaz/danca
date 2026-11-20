/**
 * provar-o-commit-do-po.js — O `-po.md` E AS FONTES DO CICLO ENTRAM JUNTOS, OU NÃO ENTRA NENHUM.
 *
 * O DEFEITO QUE ISTO FECHA, medido no `main`. A 20/11/2026, às 18:18, o «Guardar» do PO gravou
 * duas linhas do `-po.md` (commit `6c5947b5`, `envelope: po-20261120-1802` → `1818`) e **não**
 * gravou nenhum derivado: o `-dados.json` continuou a dizer `po-20261120-1802`. Os dois ciclos
 * vizinhos (18:03 e 18:54) têm os três commits — `feat(plano)`, `feat(po)`, `feat(ciclo)`. Faltou
 * o terceiro, e o pacote ficou a «misturar dois Planos de Observação» — o que a checagem 7.1 do
 * `check-pacote` recusa, a geração não publica, e o botão «Atualizar o ciclo» não resolve.
 *
 * PORQUE ACONTECIA. O `-po.md` era um commit (`escreverPO`) e as fontes do ciclo outro
 * (`escreverCiclo`). A previsão de orçamento em `concluir-po.js` tentava torná-los atómicos «na
 * prática» — e uma previsão é uma estimativa: quando o teto de 50 subpedidos do Cloudflare
 * estourava entre os dois (ver `subpedidos.js`, que documenta o mesmo defeito em 08/11), o
 * primeiro já tinha entrado.
 *
 * A CORRECÇÃO. O `-po.md` passa a ser **mais um ficheiro do lote** do `escreverCiclo`, que escreve
 * tudo num commit só (árvore + commit + avanço da referência). Aqui mede-se o que DECIDE:
 *
 *   A. o `escreverCiclo` aceita o `poMarkdown` e põe-no no lote, com o caminho do `-po.md`;
 *   B. um `-po.md` igual ao que está lá não gera escrita (idempotência preservada);
 *   C. quando o commit falha, NADA é escrito — nem o PO, nem as fontes (é a atomicidade);
 *   D. quando o orçamento não cabe, o escritor recusa ANTES de escrever o `-po.md`;
 *   E. o `concluirPO` deixa de chamar o `escreverPO` separado quando há `escreverCiclo`.
 *
 * A bancada usa um `fetch` de mentira que imita o Contents API e a API de git data (a leitura da
 * referência, a árvore, o commit e o avanço do `ref`), e conta as escritas. Sem rede.
 */

const path = require('path');
const fs = require('fs');
const RAIZ = path.resolve(__dirname, '..');
const { criarEscritorDeCiclo } = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));

let provas = 0;
let falhas = 0;
function conferir(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('ok    ' + titulo); return; }
  falhas += 1;
  console.log('FALHA ' + titulo
    + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ENVELOPE_PLANO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'escola/breu/envelopes/plano-20261120-1817.json'), 'utf8'));
const ENVELOPE_PO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'escola/breu/envelopes/po-20261120-1818.json'), 'utf8'));

const CONTEXTO = { escola: 'breu', professor: 'demi-plie', ciclo: '01', turma: 'Rosa' };
const CAMINHO_PO = 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-po.md';
const CAMINHO_DADOS = 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-dados.json';

/** O GitHub de mentira: guarda ficheiros, imita git data, e conta as escritas. */
function fazerGithub({ falharCommit = false, teto } = {}) {
  const ficheiros = new Map();   // caminho → texto
  /* O `.conf` e os schemas já existem no repositório: o escritor recusa-se a trabalhar sem o
   * manifesto da variante, e sem os schemas a bancada mediria a falta deles em vez do lote. */
  ficheiros.set('professores/demi-plie/ciclos/ciclo-01-breu-rosa.conf',
    fs.readFileSync(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa.conf'), 'utf8'));
  ficheiros.set('professores/demi-plie/ciclos/ciclo-01-breu-rosa-dados.json',
    fs.readFileSync(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-dados.json'), 'utf8'));
  const estado = { escritas: [], chamadas: 0, commits: 0, pedidos: [] };
  /* A ÁRVORE NÃO MEXE NO `main` (20/11/2026) — só o avanço da referência mexe. É a diferença que
   * faz o teste C medir o que interessa: se a bancada aplicasse a árvore ao mapa logo no POST, um
   * commit falhado apareceria como «gravado», e a atomicidade não estaria a ser medida. */
  let arvorePendente = [];
  const conteudo = (caminho) => {
    const texto = ficheiros.get(caminho);
    if (texto === undefined) return { status: 404 };
    return { ok: 200 < 400, status: 200, json: async () => ({ sha: 'blob-' + caminho, content: Buffer.from(texto).toString('base64') }) };
  };
  const f = async (url, opcoes = {}) => {
    estado.chamadas += 1;
    if (teto && estado.chamadas > teto) {
      const e = new Error('Too many subrequests by single Worker invocation');
      e.estouroDeSubpedidos = true;
      throw e;
    }
    const metodo = (opcoes.method || 'GET').toUpperCase();
    const u = String(url);
    estado.pedidos.push(metodo + ' ' + u.replace(/^.*\/repos\/d\/r/, ''));

    // git data: a referência, a árvore, o commit
    if (/\/git\/refs?\/heads\//.test(u) && metodo === 'GET') {
      return { ok: 200 < 400, status: 200, json: async () => ({ object: { sha: 'commit-antigo' } }) };
    }
    if (/\/git\/commits\?sha=/.test(u) && metodo === 'GET') {
      return { ok: 200 < 400, status: 200, json: async () => ({ tree: { sha: 'arvore-antiga' } }) };
    }
    if (/\/git\/commits\/[^/?]+$/.test(u) && metodo === 'GET') {
      return { ok: 200 < 400, status: 200, json: async () => ({ tree: { sha: 'arvore-antiga' } }) };
    }
    if (/\/git\/trees$/.test(u) && metodo === 'POST') {
      /* A ÁRVORE É ONDE O CONTEÚDO VIAJA (a lição de 08/11: um blob por ficheiro gastava o
       * orçamento). A bancada aplica-a ao mapa — sem isto mediria o relatório e não o repositório. */
      const corpo = JSON.parse(opcoes.body || '{}');
      arvorePendente = (corpo.tree || [])
        .filter((e) => e && e.type === 'blob' && typeof e.content === 'string')
        .map((e) => ({ caminho: String(e.path || ''), conteudo: e.content }));
      return { ok: true, status: 201, json: async () => ({ sha: 'arvore-nova' }) };
    }
    if (/\/git\/commits$/.test(u) && metodo === 'POST') {
      if (falharCommit) return { ok: 500 < 400, status: 500, text: async () => 'boom' };
      estado.commits += 1;
      return { ok: 201 < 400, status: 201, json: async () => ({ sha: 'commit-novo' }) };
    }
    if (/\/git\/refs?\/heads\//.test(u) && metodo === 'PATCH') {
      if (falharCommit) return { ok: false, status: 500, text: async () => 'boom' };
      // o avanço da referência é o que publica a árvore
      for (const e of arvorePendente) {
        ficheiros.set(e.caminho, e.conteudo);
        estado.escritas.push(e.caminho);
      }
      arvorePendente = [];
      return { ok: true, status: 200, json: async () => ({ object: { sha: 'commit-novo' } }) };
    }
    // Contents API
    if (metodo === 'GET') {
      const caminho = decodeURIComponent(u.replace(/^.*\/contents\//, '').split('?')[0]);
      if (/\/contents\/[^?]*$/.test(u) && !caminho.includes('/')) {
        return { ok: 200 < 400, status: 200, json: async () => [] };     // listagem de pasta
      }
      return conteudo(caminho);
    }
    if (metodo === 'PUT') {
      const caminho = decodeURIComponent(u.replace(/^.*\/contents\//, '').split('?')[0]);
      const corpo = JSON.parse(opcoes.body || '{}');
      if (process.env.DBG) console.log('   [dbg] entradas:', (corpo.tree || []).map((e) => e.path));
      ficheiros.set(caminho, Buffer.from(corpo.content || '', 'base64').toString('utf8'));
      estado.escritas.push(caminho);
      return { ok: 201 < 400, status: 201, json: async () => ({ commit: { sha: 'commit-novo' } }) };
    }
    return { ok: 404 < 400, status: 404, json: async () => ({}) };
  };
  return { f, ficheiros, estado };
}

/** O link de subpedidos que o escritor consulta (`orcamentoDe`). */
function comTeto(fetchBase, teto) {
  const estado = { limite: teto, usados: 0, estourou: false };
  Object.defineProperty(estado, 'restantes', { get: () => Math.max(0, estado.limite - estado.usados) });
  estado.coube = (n) => Number(n) <= estado.restantes;
  estado.motivo = (n) => 'não cabem ' + n + ' subpedidos: restam ' + estado.restantes;
  const f = async (u, o) => { estado.usados += 1; return fetchBase(u, o); };
  f.subpedidos = estado;
  return f;
}

(async () => {
  // ==========================================================================
  console.log('\nA. O `-po.md` VAI NO MESMO LOTE DAS FONTES');

  {
    const { f, ficheiros, estado } = fazerGithub();
    const escrever = criarEscritorDeCiclo({
      token: 'x', dono: 'd', repo: 'r', ref: 'main', senhaCripto: null, fetchImpl: f });
    const poTexto = fs.readFileSync(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-po.md'), 'utf8');
    const relatorio = await escrever({
      plano: ENVELOPE_PLANO, po: ENVELOPE_PO, contexto: CONTEXTO,
      linhaDeBase: null, anamneses: {}, poMarkdown: poTexto,
    });

    conferir('o `-po.md` está no lote (é uma das escritas do relatório)',
      (relatorio.escritas || []).some((e) => /-po\.md$/.test(e.caminho || '')),
      (relatorio.escritas || []).map((e) => e.caminho));
    conferir('…e as fontes do ciclo também, na mesma chamada',
      (relatorio.escritas || []).some((e) => /-dados\.json$/.test(e.caminho || '')),
      (relatorio.escritas || []).map((e) => e.caminho));
    conferir('…e houve UM commit só (a árvore e o commit são um)',
      estado.commits === 1, { commits: estado.commits, pedidos: estado.pedidos });
    if (process.env.DBG) console.log('   [dbg] pedidos:', estado.pedidos, '| ficheiros:',
      [...ficheiros.keys()], '| escritas:', estado.escritas);
    conferir('o `-po.md` ficou no repositório com o conteúdo que veio',
      ficheiros.get(CAMINHO_PO) === poTexto, null);
    conferir('…e o `-dados.json` declara o PO do envelope novo, e não o anterior',
      JSON.parse(ficheiros.get(CAMINHO_DADOS) || '{}').po === 'po-20261120-1818',
      JSON.parse(ficheiros.get(CAMINHO_DADOS) || '{}').po);
    conferir('…e o `-po.md` e o `-dados.json` foram escritos na MESMA chamada de commit',
      estado.commits === 1 && Boolean(ficheiros.get(CAMINHO_PO)) && Boolean(ficheiros.get(CAMINHO_DADOS)),
      { commits: estado.commits });
  }

  // ==========================================================================
  console.log('\nB. UM `-po.md` IGUAL AO QUE ESTÁ NÃO GERA COMMIT');

  {
    const { f, ficheiros, estado } = fazerGithub();
    const escrever = criarEscritorDeCiclo({
      token: 'x', dono: 'd', repo: 'r', ref: 'main', senhaCripto: null, fetchImpl: f });
    const poTexto = fs.readFileSync(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-po.md'), 'utf8');
    // primeira gravação: cria
    await escrever({ plano: ENVELOPE_PLANO, po: ENVELOPE_PO, contexto: CONTEXTO,
      linhaDeBase: null, anamneses: {}, poMarkdown: poTexto });
    const depoisDaPrimeira = ficheiros.get(CAMINHO_PO);
    estado.commits = 0;
    estado.escritas.length = 0;
    // segunda gravação, com o mesmo texto: nada muda
    const relatorio = await escrever({ plano: ENVELOPE_PLANO, po: ENVELOPE_PO, contexto: CONTEXTO,
      linhaDeBase: null, anamneses: {}, poMarkdown: poTexto });
    conferir('o `-po.md` foi PULADO quando o texto é o mesmo',
      (relatorio.puladas || []).some((c) => /-po\.md$/.test(c)) && ficheiros.get(CAMINHO_PO) === depoisDaPrimeira,
      relatorio.puladas);
  }

  // ==========================================================================
  console.log('\nC. QUANDO O COMMIT FALHA, NADA É ESCRITO — nem o PO, nem as fontes');

  {
    const { f, ficheiros, estado } = fazerGithub({ falharCommit: true });
    const escrever = criarEscritorDeCiclo({
      token: 'x', dono: 'd', repo: 'r', ref: 'main', senhaCripto: null, fetchImpl: f });
    const poTexto = fs.readFileSync(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-po.md'), 'utf8');
    let atirou = null;
    let relatorio = null;
    try {
      relatorio = await escrever({ plano: ENVELOPE_PLANO, po: ENVELOPE_PO, contexto: CONTEXTO,
        linhaDeBase: null, anamneses: {}, poMarkdown: poTexto });
    } catch (erro) { atirou = erro.message; }
    /* O escritor devolve um relatório com `ok:false` ou atira — as duas contam como «não entrou»;
     * o que NÃO pode acontecer é um ficheiro lá estar e o outro não. */
    /* O `-dados.json` já existe no repositório (a bancada semeia-o): «não entrou» quer dizer que
     * ele não foi SOBRESCRITO, e não que o caminho não existe. */
    const dadosSemeados = fs.readFileSync(
      path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-dados.json'), 'utf8');
    const entrou = ficheiros.has(CAMINHO_PO)
      || ficheiros.get(CAMINHO_DADOS) !== dadosSemeados
      || estado.escritas.length > 0;
    conferir('nenhum dos dois ficheiros ficou no repositório',
      entrou === false, { po: ficheiros.has(CAMINHO_PO),
        dadosReescrito: ficheiros.get(CAMINHO_DADOS) !== dadosSemeados,
        escritas: estado.escritas, ok: relatorio && relatorio.ok, atirou });
  }

  // ==========================================================================
  console.log('\nD. O ORÇAMENTO É PERGUNTADO ANTES DE ESCREVER O `-po.md`');

  {
    const { f, estado } = fazerGithub();
    const limitado = comTeto(f, 3);   // cabe quase nada
    const escrever = criarEscritorDeCiclo({
      token: 'x', dono: 'd', repo: 'r', ref: 'main', senhaCripto: null, fetchImpl: limitado });
    const poTexto = fs.readFileSync(path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-po.md'), 'utf8');
    const relatorio = await escrever({ plano: ENVELOPE_PLANO, po: ENVELOPE_PO, contexto: CONTEXTO,
      linhaDeBase: null, anamneses: {}, poMarkdown: poTexto });
    conferir('com o orçamento curto, o relatório diz `motivo: orcamento`',
      relatorio && relatorio.ok === false && relatorio.motivo === 'orcamento', relatorio && relatorio.motivo);
    conferir('…e NADA foi escrito — nem o `-po.md`, que antes era o primeiro a entrar',
      estado.escritas.length === 0, estado.escritas);
  }

  // ==========================================================================
  console.log('\nE. O `concluirPO` DEIXOU DE GRAVAR O PO NUM COMMIT SEPARADO');

  {
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/concluir-po.js'), 'utf8');
    conferir('o `poMarkdown` é passado ao `escreverCiclo`',
      /poMarkdown,/.test(fonte) && /poMarkdown:/.test(fonte) === false ? true : /poMarkdown,/.test(fonte),
      null);
    conferir('…e o `escreverPO` só corre quando NÃO há ciclo (recurso, não caminho)',
      /if \(!poMarkdown\) \{/.test(fonte), null);
    conferir('…e a linha de base é pedida uma vez e usada nos dois lados',
      (fonte.match(/linhaDeBaseDaVez/g) || []).length >= 3, null);
    const escritor = fs.readFileSync(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'), 'utf8');
    conferir('o `escreverCiclo` põe o `-po.md` no lote, à cabeça',
      /if \(poMarkdown\) fontes\.unshift\(\{ sufixo: '-po\.md', md: poMarkdown \}\)/.test(escritor), null);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o `-po.md` e as fontes do ciclo entram no mesmo '
      + 'commit, um `-po.md` igual não escreve nada, um commit falhado não deixa metade no '
      + 'repositório, e um orçamento curto recusa antes de escrever a primeira pedra. Deixou de '
      + 'existir o estado «o PO entrou e as fontes não» — que é o que a `breu-rosa` publicou a '
      + '20/11 e o que o `check-pacote` recusa.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a bancada rebentou:', erro && erro.message);
  console.error(erro && erro.stack);
  process.exit(1);
});
