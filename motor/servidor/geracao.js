'use strict';

/**
 * geracao.js — O ESTADO DA GERAÇÃO, para a tela poder dizer o que está a acontecer.
 *
 * O «Guardar» do PO escreve as fontes e DISPARA o workflow `gerar-ciclo.yml`. Até
 * 19/10/2026 a tela terminava ali: dizia «gravado» e nada mais. A geração corre no
 * GitHub Actions por minutos — e quem estava à frente do ecrã não sabia se ela tinha
 * começado, se estava a correr, se falhou, nem em que passo. Recarregar não mudava nada,
 * porque nada era guardado.
 *
 * O que este módulo faz:
 *   1. REGISTA o disparo no KV da escola, com o contexto e os documentos que o PO
 *      derivou. É o que sobrevive ao recarregar (o KV é o único estado durável da
 *      escola — o navegador não serve, porque outra máquina não o vê);
 *   2. CONSULTA o GitHub pelo estado da execução. A chave de procura é o NOME da
 *      execução: o workflow declara `run-name: Gerar o ciclo · <professor>/<ciclo>/<escola>`,
 *      e `rotuloDaGeracao` compõe exactamente a mesma string. Sem esse acordo, duas
 *      gerações simultâneas de escolas diferentes seriam indistinguíveis — e a tela
 *      mostraria o estado da geração de outra pessoa.
 *
 * O que ele NÃO faz: disparar, escrever no repositório, autenticar pessoas. É leitura de
 * estado e um registro pequeno. Toda a autorização de escrita continua onde estava.
 */

const { varianteDoContexto } = require('./escrever-po.js');

const WORKFLOW = 'gerar-ciclo.yml';
const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

/** O mesmo slug das outras pontes — a chave do KV não pode ter acentos nem espaços. */
function slugificar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * O RÓTULO DA EXECUÇÃO — uma string, dois consumidores: o `run-name` do workflow e a
 * procura em `estado()`. Se um dos dois mudar sozinho, a tela deixa de achar a execução;
 * por isso a prova `provar-geracao.js` compara os dois textos.
 */
function rotuloDaGeracao(contexto) {
  const c = contexto || {};
  return 'Gerar o ciclo · ' + String(c.professor || '') + '/' + String(c.ciclo || '') + '/' +
    varianteDoContexto(c);
}

/** A chave do registro no KV — uma por variante (professor × ciclo × escola × turma). */
/**
 * O PONTEIRO para o último registro da escola: um `get`, em vez de uma enumeração.
 *
 * É DERIVADO, como todo o resto desta família: se ele faltar (escola anterior a 20/10/2026), a
 * leitura cai na enumeração — que é o caminho antigo — e o ponteiro é reescrito na próxima
 * gravação. Nada se perde quando o ponteiro se perde.
 */
const CHAVE_DO_ULTIMO = (escola) => 'bastidores/' + slugificar(escola) + '/geracao/.ultimo';

function chaveDoRegistro(escola, contexto) {
  const e = slugificar(escola);
  const variante = slugificar(varianteDoContexto(contexto || {}));
  if (!e || !variante) return null;
  return 'bastidores/' + e + '/geracao/' + variante;
}

/**
 * OS DOCUMENTOS que o ciclo derivou, em nomes legíveis. O registro guarda os nomes
 * técnicos (`aula-01`, `glossario-benesh`); a tela mostra o que a pessoa reconhece. As chaves
 * são históricas e não se renomeiam (ver a nota em `glossario-benesh`); os rótulos, sim.
 */
const NOMES_DOS_DOCUMENTOS = {
  /* OS DOIS PLANOS TÊM NOMES QUE SE DISTINGUEM (04/11/2026). Antes: «Plano de ensino» e «Aula
   * 01» — dois nomes que não diziam que são a MESMA família (um plano do ciclo, um plano da
   * aula), e «Plano de ensino» era ainda o rótulo do FORMULÁRIO no menu, o que fazia duas coisas
   * diferentes aparecerem com o mesmo nome. Agora o registo diz o que cada documento é. */
  'plano': 'Plano do ciclo',
  'harmonizacao': 'Harmonização',
  'aula-01': 'Plano para a Aula 01',
  'captura-aula-01': 'Captura da aula 01',
  'notacao': 'Notação de dança',
  /* O NOME QUE A PESSOA LÊ MUDOU (18/11/2026); A CHAVE TÉCNICA NÃO.
   *
   * «Glossário Benesh» era o rótulo de um documento cuja chave no registo é `glossario-benesh` —
   * e a chave é o que já está gravado em todos os ciclos existentes. Renomeá-la faria os registos
   * de ontem apontarem para um documento que passou a ter outro nome, e um ciclo antigo deixaria
   * de encontrar o seu glossário. O mesmo par de sempre: o rótulo muda, a chave fica.
   *
   * O que se lê passa a ser «Glossário do código de dança» — o código é nosso, e o nome dele não é
   * de ninguém. */
  'glossario-benesh': 'Glossário do código de dança',
  'referencias': 'Referências',
};

/** O relatório do `escrever-ciclo.js` deixou as fontes prontas para gerar? */
function fontesDoCicloProntas(relatorio) {
  const r = relatorio;
  if (!r) return true; // sem escritor (modo local): não há o que bloquear
  if (r.conf && r.conf.ok === false) return false;
  if (r.docs && r.docs.ok === false) return false;
  if (r.cifrado && r.cifrado.ok === false) return false;
  if (Array.isArray(r.escritas) && r.escritas.some((e) => e && e.ok === false)) return false;
  return true;
}

/**
 * Monta o serviço de estado. Sem KV devolve um objeto inerte — o servidor local e as
 * provas não têm o armazenamento da escola, e a rota responde «indisponível» em vez de
 * inventar um estado.
 */
function criarGeracao({ kv, escola, token, dono, repo, fetchImpl, agora } = {}) {
  const relogio = typeof agora === 'function' ? agora : () => new Date();
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  const donoFinal = dono || DONO_PADRAO;
  const repoFinal = repo || REPO_PADRAO;

  // Uma cache de poucos segundos: a tela pergunta a cada ~5 s, e duas idas ao GitHub por
  // pergunta é o dobro do necessário. A chave inclui o `updated_at` da execução, para uma
  // mudança de estado nunca ficar presa na cache.
  let cache = { chave: '', em: 0, valor: null };
  const TTL_MS = 4000;

  async function consultarGitHub(url) {
    if (!f) return { ok: false, erro: 'sem fetch' };
    try {
      const resposta = await f(url, {
        headers: {
          'Accept': ACEITE,
          'Authorization': 'Bearer ' + token,
          'X-GitHub-Api-Version': API_VERSAO,
          'User-Agent': 'danca-worker',
        },
      });
      if (!resposta.ok) return { ok: false, erro: 'HTTP ' + resposta.status };
      return { ok: true, dados: await resposta.json() };
    } catch (erro) {
      return { ok: false, erro: (erro && erro.message) || String(erro) };
    }
  }

  /** REGISTA o disparo. Nunca lança: o envelope já está gravado, e o status é acessório. */
  async function registrar(contexto, { disparo, ciclo } = {}) {
    const chave = chaveDoRegistro(escola, contexto);
    if (!kv || !chave) return { ok: false, ignorado: true, erro: 'sem armazenamento da escola' };
    const c = contexto || {};
    const rel = ciclo || {};
    const documentos = (rel.docs && Array.isArray(rel.docs.docs)) ? rel.docs.docs.slice(0, 20) : [];
    const registro = {
      em: relogio().toISOString(),
      professor: c.professor || '',
      ciclo: c.ciclo || '',
      turma: c.turma || '',
      escola: slugificar(escola),
      variante: varianteDoContexto(c),
      rotulo: rotuloDaGeracao(c),
      documentos: documentos.map((d) => ({ id: d, nome: NOMES_DOS_DOCUMENTOS[d] || d })),
      escritas: Array.isArray(rel.escritas) ? rel.escritas.filter((e) => e && e.ok).length : 0,
      puladas: Array.isArray(rel.puladas) ? rel.puladas.length : 0,
      disparo: disparo || null,
    };
    try {
      await kv.put(chave, JSON.stringify(registro));
      /*
       * O PONTEIRO DO ÚLTIMO REGISTRO (20/10/2026). A tela pergunta pelo endereço da porta,
       * que não traz a turma; para responder «o que esta escola pediu por último» era preciso
       * ENUMERAR as chaves (`kv.list`) — a operação de cota diária, e a única que ainda estava
       * no caminho de uma página. Com o ponteiro, a resposta é um `get`.
       *
       * Custa UMA escrita por gravação (a mesma que já se pagava) e poupa uma enumeração por
       * PERGUNTA — a tela pergunta a cada poucos segundos enquanto o GitHub gera.
       */
      try { await kv.put(CHAVE_DO_ULTIMO(escola), chave); } catch (erro) { /* acessório */ }
      return { ok: true, chave, registro };
    } catch (erro) {
      return { ok: false, erro: (erro && erro.message) || String(erro) };
    }
  }

  /** LÊ o último registro daquela variante. */
  async function lerRegistro(contexto) {
    const chave = chaveDoRegistro(escola, contexto);
    if (!kv || !chave) return null;
    try {
      const bruto = await kv.get(chave);
      return bruto ? JSON.parse(bruto) : null;
    } catch (erro) {
      return null;
    }
  }

  /**
   * A MESMA LEITURA, POR CHAVE JÁ DERIVADA (13/11/2026).
   *
   * A lista do Plano de Observação pergunta pelo registo de CADA PO, e vários PO da mesma turma
   * perguntam pela MESMA chave. `lerRegistro` deriva a chave a cada chamada, e o chamador que
   * quer deduplicar precisa da chave ANTES de ler — esta porta é a que lhe dá isso sem que ele
   * tenha de repetir a derivação (que é daqui, e que ficaria errada em duplicado).
   */
  async function lerRegistroPorChave(chave) {
    if (!kv || !chave) return null;
    try {
      const bruto = await kv.get(chave);
      return bruto ? JSON.parse(bruto) : null;
    } catch (erro) {
      return null;
    }
  }

  /**
   * O ÚLTIMO REGISTRO DA ESCOLA, seja de que turma for.
   *
   * A tela pergunta pelo endereço da porta, e o endereço não traz a turma: ela é
   * escolhida no formulário e não vai para a barra de endereços. Exigir a turma para
   * responder obrigaria a tela a adivinhar — e a adivinhação erraria no dia em que a
   * escola tiver duas turmas a gerar. O KV lista as chaves por prefixo, e o registro
   * mais recente é a resposta honesta: «o que esta escola pediu por último».
   */
  async function ultimoDaEscola() {
    const prefixo = 'bastidores/' + slugificar(escola) + '/geracao/';
    if (!kv || !prefixo) return null;

    // O CAMINHO NORMAL: o ponteiro, e um `get`. Sem enumeração, sem cota diária.
    try {
      const apontado = await kv.get(CHAVE_DO_ULTIMO(escola));
      if (apontado) {
        const bruto = await kv.get(apontado);
        if (bruto) return JSON.parse(bruto);
      }
    } catch (erro) {
      // segue para o caminho antigo
    }

    // O CAMINHO ANTIGO — só para a escola que tem registros e ainda não tem ponteiro (as
    // anteriores a 20/10/2026). A enumeração pode falhar por cota; aí a resposta é `null`, e
    // não uma excepção: a tela diz «sem registro» em vez de estourar.
    if (typeof kv.list !== 'function') return null;
    try {
      const lista = await kv.list({ prefix: prefixo, limit: 20 });
      const chaves = ((lista && lista.keys) || []).map((k) => k && k.name).filter(Boolean)
        .filter((nome) => nome.indexOf('/.ultimo') === -1);
      let melhor = null;
      for (const chave of chaves) {
        const bruto = await kv.get(chave);
        if (!bruto) continue;
        let registro;
        try { registro = JSON.parse(bruto); } catch (erro) { continue; }
        if (!melhor || Date.parse(registro.em) > Date.parse(melhor.em)) melhor = registro;
      }
      // Adoptado o último, o ponteiro passa a existir: a próxima pergunta é um `get`.
      if (melhor && melhor.variante) {
        try {
          await kv.put(CHAVE_DO_ULTIMO(escola),
            'bastidores/' + slugificar(escola) + '/geracao/' + slugificar(melhor.variante));
        } catch (erro) { /* acessório */ }
      }
      return melhor;
    } catch (erro) {
      return null;
    }
  }

  /** O ESTADO: registro + execução do GitHub (quando há token). */
  async function estado(contexto) {
    const chave = chaveDoRegistro(escola, contexto);
    if (!kv || !chave) return { ok: true, fase: 'indisponivel' };
    const c = contexto || {};
    // Sem a turma no pedido, a resposta é a do último registro da escola (ver
    // `ultimoDaEscola`). Com a turma, é o registro daquela variante — exato.
    const registro = c.turma ? await lerRegistro(contexto) : await ultimoDaEscola();
    if (!registro) return { ok: true, fase: 'sem-registro' };

    // O disparo pode ter falhado ANTES de existir execução (token expirado, 401…). Isso é
    // um estado final, não uma espera: dizê-lo evita a tela a girar para sempre.
    if (registro.disparo && registro.disparo.ok === false) {
      return { ok: true, fase: 'falhou-no-disparo', registro,
        erro: registro.disparo.erro || ('HTTP ' + (registro.disparo.status || '?')) };
    }

    if (!token) return { ok: true, fase: 'sem-consulta', registro };

    const desde = Date.parse(registro.em) - 5 * 60 * 1000;
    const base = 'https://api.github.com/repos/' + donoFinal + '/' + repoFinal +
      '/actions/workflows/' + WORKFLOW;

    const lista = await consultarGitHub(base + '/runs?event=workflow_dispatch&per_page=20');
    if (!lista.ok) return { ok: false, fase: 'sem-consulta', registro, erro: lista.erro };

    const execucoes = ((lista.dados && lista.dados.workflow_runs) || [])
      .filter((r) => r && Date.parse(r.created_at) >= desde)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    /*
     * QUAL EXECUÇÃO É A NOSSA. O caminho exacto é o RÓTULO: o workflow declara
     * `run-name: Gerar o ciclo · <professor>/<ciclo>/<variante>` e `rotuloDaGeracao`
     * compõe a mesma string. É isso que separa duas gerações simultâneas.
     *
     * Mas há execuções SEM nome de geração — as de antes de o `run-name` existir, e as
     * que alguém dispara à mão pela interface do GitHub. Essas não se reconhecem pelo
     * título; reconhecem-se por não terem título de geração nenhum. A regra:
     *   · título que começa por «Gerar o ciclo · » é geração — só vale se for a NOSSA;
     *   · qualquer outro título é execução anónima — vale se for a ÚNICA na janela.
     * Sem essa distinção, ou a tela não acha nada (e gira para sempre «na fila»), ou
     * adopta a execução de outra escola — que é pior.
     */
    const ROTULO_DE_GERACAO = /^Gerar o ciclo · /;
    const anonimas = execucoes.filter((r) => !ROTULO_DE_GERACAO.test(String(r.display_title || '')));
    const execucao = execucoes.find((r) => r.display_title === registro.rotulo) ||
      (anonimas.length === 1 ? anonimas[0] : null);
    if (!execucao) return { ok: true, fase: 'enfileirada', registro };

    const resposta = {
      ok: true,
      registro,
      run: {
        id: execucao.id,
        status: execucao.status,
        conclusion: execucao.conclusion,
        html_url: execucao.html_url,
        created_at: execucao.created_at,
        updated_at: execucao.updated_at,
      },
    };

    if (execucao.status !== 'completed') {
      // A FILA NÃO É O MESMO QUE A CORRIDA. `queued` (ou `requested`/`waiting`) quer dizer
      // que o GitHub ainda não pegou o trabalho: não há passo nenhum para nomear, e dizer
      // «Gerando» aí seria mentira. Só se vai buscar os passos quando há execução a andar.
      if (execucao.status !== 'in_progress') {
        resposta.fase = 'enfileirada';
        return resposta;
      }
      resposta.fase = 'em-andamento';
      resposta.etapas = await etapasDaExecucao(base, execucao.id);
      resposta.etapaAtual = (resposta.etapas.find((e) => e.status === 'in_progress') ||
        resposta.etapas.find((e) => e.status === 'queued') || {}).nome || '';
      return resposta;
    }

    resposta.etapas = await etapasDaExecucao(base, execucao.id);
    if (execucao.conclusion === 'success') {
      resposta.fase = 'concluida';
      return resposta;
    }
    resposta.fase = 'falhou';
    resposta.etapaQueFalhou = (resposta.etapas.find((e) => e.conclusion === 'failure') || {}).nome || '';
    return resposta;

    async function etapasDaExecucao(enderecoBase, id) {
      const cacheChave = enderecoBase + '#' + id + '#' + execucao.updated_at;
      if (cache.chave === cacheChave && Date.now() - cache.em < TTL_MS && cache.valor) {
        return cache.valor;
      }
      const trabalhos = await consultarGitHub(enderecoBase + '/runs/' + id + '/jobs?per_page=10');
      const etapas = [];
      for (const trabalho of ((trabalhos.dados && trabalhos.dados.jobs) || [])) {
        for (const passo of (trabalho.steps || [])) {
          etapas.push({
            trabalho: trabalho.name,
            nome: passo.name,
            numero: passo.number,
            status: passo.status,
            conclusion: passo.conclusion,
          });
        }
      }
      cache = { chave: cacheChave, em: Date.now(), valor: etapas };
      return etapas;
    }
  }

  return { CHAVE_DO_ULTIMO, registrar, estado, lerRegistro, lerRegistroPorChave };
}

module.exports = {
  criarGeracao,
  rotuloDaGeracao,
  chaveDoRegistro,
  CHAVE_DO_ULTIMO,
  fontesDoCicloProntas,
  NOMES_DOS_DOCUMENTOS,
  WORKFLOW,
};
