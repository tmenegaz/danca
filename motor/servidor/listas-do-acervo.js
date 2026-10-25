'use strict';

/**
 * listas-do-acervo.js — AS TRÊS LISTAS DA ÁREA DO PROFESSOR, servidas pela ponte (24/10/2026).
 *
 * PORQUE NÃO SÃO MONTADAS NO DEPLOY. Elas listavam **turmas** — uma linha por turma, e as três
 * páginas iguais. Mas o que a listagem tem de dizer é «a anamnese de quem, feita por quem,
 * quando», e isso não está no disco: está no ACERVO, no KV da escola, e muda a cada ato
 * registado. Uma página montada no deploy mostrava o acervo do dia do deploy, e não o de hoje.
 *
 * A PONTE JÁ SERVE A PORTA e os Bastidores por esta razão, e é o mesmo lugar: quem tem o KV e o
 * índice de envelopes é ela. O desenho da lista é o MESMO dos outros cinco — `lista-html.js` —,
 * porque a listagem é o padrão de todas; o que muda é de onde vêm os dados.
 *
 * O QUE ESTA LISTA **NÃO** INVENTA. Sem `gerado_em` no resumo do índice, a data aparece como
 * «—»; sem turma na curadoria, a caixa diz «sem turma». Uma listagem que preenche as lacunas com
 * uma suposição é pior do que uma que as mostra: a suposição parece um facto.
 */

const listas = require('../nucleo/lista-html.js');
const porta = require('../nucleo/porta.js');
const nav = require('../nucleo/nav.js');
const { criarArmazenamento } = require('./cloudflare.js');

const esc = (t) => String(t == null ? '' : t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** `2026-10-20T14:32` → `20/10/2026`. A data que se lê numa listagem é o DIA. */
function dia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/** O nome de quem fez — o do slug quando não há o nome escrito no formulário. */
function nomeDoProfessor(registo) {
  const nome = String(registo.professorNome || '').trim();
  if (nome) return nome;
  const slug = String(registo.professor || '').trim();
  if (!slug) return '';
  return slug.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

/** A turma de cada aluna, lida das curadorias vigentes. `Map<apelido, nomeDaTurma>`. */
function turmaDaAluna(curadorias) {
  const mapa = new Map();
  const vigentes = (Array.isArray(curadorias) ? curadorias : []).filter((c) => c && !c.substituidaPor);
  for (const c of vigentes) {
    const nomes = (Array.isArray(c.turmas) ? c.turmas : [c.turma]).map((x) => String(x || '').trim()).filter(Boolean);
    for (const nome of nomes) {
      for (const a of (Array.isArray(c.alunas) ? c.alunas : [])) {
        if (!mapa.has(a)) mapa.set(a, nome);
      }
    }
  }
  return mapa;
}

/**
 * As três famílias, cada uma com o seu título, o seu vazio e a sua caixa de «quando».
 *
 * A ORDEM DAS CAIXAS É A MESMA EM TODAS — de quem · quem fez · quando —, e é isso que faz a
 * identidade da listagem. O que muda é o RÓTULO e o que vai dentro do painel.
 */
const FAMILIAS = {
  anamnese: {
    titulo: 'Anamnese do aluno',
    subtitulo: 'A escuta inicial de cada aluna, antes do primeiro registro',
    padrao: /^anamnese-.*\.json$/,
    vazio: 'Ainda não há anamnese nesta escola. Ela nasce na Área do Professor, com o professor '
      + 'que a faz e a aluna que a responde.',
    singular: 'anamnese', plural: 'anamneses',
    // A PORTA DE CADA FONTE — é lá que o formulário vive. Ver `acaoDaPagina` e `acoesDaLinha`.
    porta: '/anamnese/',
    acaoDeCriar: 'Nova anamnese',
  },
  'plano-de-ensino': {
    titulo: 'Plano de ensino',
    subtitulo: 'O plano da turma, elicitado com o professor',
    padrao: /^plano-.*\.json$/,
    vazio: 'Ainda não há plano de ensino nesta escola. Ele nasce quando o professor preenche o '
      + 'plano de uma turma curada.',
    singular: 'plano', plural: 'planos',
    porta: '/plano-ensino/',
    acaoDeCriar: 'Novo plano de ensino',
    fonte: 'plano',
  },
  'plano-de-observacao': {
    titulo: 'Plano de Observação',
    subtitulo: 'O que se vai observar na turma, e com que régua',
    padrao: /^po-.*\.json$/,
    vazio: 'Ainda não há Plano de Observação nesta escola. Ele nasce quando o professor decide o '
      + 'que vai observar numa turma.',
    singular: 'plano', plural: 'planos',
    porta: '/plano-observacao/',
    acaoDeCriar: 'Novo Plano de Observação',
    fonte: 'po',
  },
};

/*
 * A PORTA DO FORMULÁRIO, A PARTIR DA LISTA (25/10/2026).
 *
 * O DEFEITO QUE ISTO CORRIGE, e que foi meu. Quando as três listas passaram a ser servidas pelo
 * acervo (24/10/2026), cada linha ficou com `acoes: []` — e ninguém notou, porque uma lista que
 * se lê bem parece uma lista que funciona. Só que as listas anteriores (montadas no deploy) eram
 * `uma linha por TURMA`, e a linha levava `?professor=<slug>&ciclo=NN` para a porta: era por ali
 * que se abria o formulário, se editava e se derivava. Ao trocar a linha de turma por linha de
 * REGISTO, o destino do formulário desapareceu com ela. Resultado medido em produção: as três
 * páginas da Área do Professor com **zero** `class="acao"`, e a única coisa que se podia fazer
 * era ler. A Área do Professor ficou sem porta.
 *
 * O QUE OS PARÂMETROS SÃO — lidos de `porta/index.html`, não inventados:
 *   · `professor` (slug) e `ciclo` — semeiam a barra de contexto;
 *   · `aluna` — semeia o sujeito da anamnese (a lista da porta filtra-o pela curadoria, e um
 *     apelido fora dela é simplesmente ignorado: degrada, não mente);
 *   · `fonte=plano|po` — diz à MESMA página qual dos dois formulários abrir;
 *   · `editar=<carimbo>` — abre a edição do registo. **É lido só em `fonte === 'plano'`**
 *     (`porta/index.html`, «O ATALHO DE EDIÇÃO»), e por isso só o plano de ensino o recebe.
 */
function consulta(params) {
  const q = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params || {})) {
    const v = String(valor == null ? '' : valor).trim();
    if (v) q.set(chave, v);
  }
  const s = q.toString();
  return s ? '?' + s : '';
}

/** O botão do topo da página — a acção de CRIAR, que é a que faltava por inteiro. */
function acaoDaPagina(chave) {
  const f = FAMILIAS[chave];
  return { rotulo: f.acaoDeCriar, href: f.porta + consulta({ fonte: f.fonte }) };
}

/**
 * As acções de UMA linha. O que se promete é o que a porta cumpre:
 *   · plano de ensino ainda livre (`solta`) — a edição abre no registo;
 *   · plano de ensino já vinculado — o servidor recusa a escrita, e o atalho de edição abriria
 *     uma tela que avisa em vez de editar. Leva-se ao formulário, com o contexto posto;
 *   · anamnese e PO — não há atalho por endereço para o registo, e um botão «Editar» que não
 *     edita é pior do que nenhum. Leva-se ao formulário com o contexto e o sujeito.
 */
function acoesDaLinha(chave, registo, estado) {
  const f = FAMILIAS[chave];
  if (chave === 'plano-de-ensino' && estado && estado.estado === 'solta') {
    return [['Editar', f.porta + consulta({ fonte: f.fonte, editar: registo.id }), '']];
  }
  const contexto = consulta({
    fonte: f.fonte,
    professor: registo.professor,
    ciclo: registo.ciclo,
    aluna: chave === 'anamnese' ? registo.aluna : '',
  });
  return [['Abrir no formulário', f.porta + contexto, 'secundario']];
}

/**
 * AS LINHAS DE UMA FAMÍLIA, como o cartão da listagem as quer.
 *
 * Cada família tem o seu «de quem», e nenhuma delas o inventa:
 *   · anamnese — a ALUNA é o registo, e a turma vem da curadoria que a matriculou. Sem curadoria,
 *     «sem turma» e o selo «nova», que é derivado (deixa de o ser no dia em que entrar numa);
 *   · plano de ensino — a TURMA está no próprio registo (`turmaDoEnvelope`);
 *   · PO — a turma vem do plano de ensino que ele observa.
 */
function linhasDe(familia, registos, estados, turmasDaAluna, turmaDoPlano) {
  return registos.map((r) => {
    const estado = estados[r.id] || {};
    const quem = nomeDoProfessor(r);
    const quando = dia(r.gerado_em);
    if (familia === 'anamnese') {
      const turma = turmasDaAluna.get(r.aluna) || '';
      return {
        nome: r.aluna || 'Anamnese sem sujeito',
        selo: estado.vinculada ? 'vinculada' : (r.aluna && !turma ? 'nova' : ''),
        seloClasse: estado.vinculada ? 'vinculada' : 'livre',
        turma: turma,
        professor: quem,
        contexto: turma ? 'vinculada à turma ' + turma : 'aluna nova — sem turma',
        acoes: acoesDaLinha('anamnese', r, estado),
        caixas: [
          { rotulo: 'Turma', valor: turma || 'sem turma',
            painel: listaDePares([
              ['Turma', turma || 'sem turma'],
              ['Estado', estado.vinculada ? 'vinculada — um PO já a usa' : (estado.legado ? 'legado' : 'solta')]],
              turma
                ? 'A turma vem da curadoria, que é quem matricula a aluna.'
                : 'Aluna nova pode ser entrevistada por qualquer professor. O selo é derivado: '
                  + 'no dia em que entrar numa curadoria, deixa de o ser.') },
          { rotulo: 'Quem fez', valor: quem || '—',
            painel: listaDePares([['Professor', quem || '—'], ['Ciclo', r.ciclo || '—']]) },
          { rotulo: 'Quando', valor: quando || '—',
            painel: listaDePares([['Registada em', quando || '—'],
              ['Ajustes', estado.ajuste_de ? 'é um ajuste de ' + estado.ajuste_de : 'nenhum']],
              'A data vem do carimbo do registo: é a hora em que ele foi gravado.') },
        ],
      };
    }
    /* A TURMA DO PO VEM DO PLANO DE ENSINO QUE ELE OBSERVA (24/10/2026). O registo do PO não a
     * tem: ele referencia o plano, e é o plano que diz de que turma é. Sem esta resolução a caixa
     * «Turma» saía «—» — e um PO sem turma na listagem parece um PO solto, que é exactamente o
     * que ele não é. Medido em produção: era o único «—» que sobrava. */
    const doPlano = familia === 'plano-de-observacao'
      ? ((r.plano || []).map((id) => (turmaDoPlano || new Map()).get(id)).filter(Boolean)[0] || '')
      : '';
    const turma = r.turma || doPlano || '';
    return {
      nome: (familia === 'plano-de-ensino' ? 'Plano de ensino — ' : 'Plano de Observação — ')
        + (turma || 'turma não declarada'),
      selo: estado.estado || '',
      seloClasse: estado.estado === 'vinculada' ? 'vinculada'
        : estado.estado === 'legado' ? 'discreto' : 'livre',
      turma: turma,
      professor: quem,
      contexto: familia === 'plano-de-ensino'
        ? String(r.objetivo || '').slice(0, 120)
        : (r.plano && r.plano.length ? 'observa o plano de ensino de ' + r.plano.join(', ') : ''),
      acoes: acoesDaLinha(familia, r, estado),
      caixas: [
        { rotulo: 'Turma', valor: turma || '—',
          painel: listaDePares([
            ['Turma', turma || '—'], ['Ciclo', r.ciclo || '—'],
            ...(familia === 'plano-de-observacao'
              ? [['Sujeitos', (r.sujeitos || []).join(', ') || 'a turma inteira']] : [])]) },
        { rotulo: 'Quem fez', valor: quem || '—',
          painel: listaDePares([['Professor', quem || '—']],
            'É o professor da turma: o plano e a observação são dele sobre a turma dele.') },
        { rotulo: 'Quando', valor: quando || '—',
          painel: listaDePares([
            ['Registado em', quando || '—'],
            ...(familia === 'plano-de-ensino'
              ? [['Expira', 'não declarada — vale enquanto o ciclo correr']]
              : [['Plano de ensino', (r.plano || []).join(', ') || '—']])],
            familia === 'plano-de-ensino'
              ? 'O plano não expira por data própria: ele acompanha o período do ciclo, e o '
                + 'período está no plano do ciclo.'
              : 'O período observado é o do plano de ensino que este PO referencia.') },
      ],
    };
  });
}

/** Os pares rótulo/valor de um painel — a mesma grelha em todas as listas. */
function listaDePares(pares, nota) {
  return listas.painelDoCartao(pares, nota);
}

/**
 * A PÁGINA de uma das três listas — ou `null` quando o caminho não é de nenhuma delas.
 *
 * Recebe o que a ponte já tem: o `env` (com o KV), o menu da escola e o caminho pedido. Devolve
 * o HTML pronto a servir, com a barra já desenhada — a mesma barra de todas as páginas, porque
 * quem a desenha é o mesmo módulo.
 */
async function pagina(caminho, { env, menu, escola, curadorias }) {
  const chave = Object.keys(FAMILIAS).find((k) => caminho === '/area-do-professor/' + k + '/'
    || caminho === '/area-do-professor/' + k);
  if (!chave) return null;
  const familia = FAMILIAS[chave];
  if (!env || !env.PADD_KV) return null;
  // O MESMO armazenamento da porta (estático → KV), e não uma segunda leitura do KV: uma lista
  // que lesse por um caminho diferente do da porta mostraria registos que a porta não encontra.
  const armazenamento = criarArmazenamento(env);

  const resumos = await porta.resumosDeEnvelopes(armazenamento, familia.padrao);
  /* O ESTADO é derivado, e vem de quem o deriva — não é recalculado aqui. Duas derivações da
   * mesma regra divergiriam, e a que ficasse para trás seria a do ecrã. */
  const estados = chave === 'anamnese'
    ? await porta.estadosDasAnamneses(armazenamento)
    : chave === 'plano-de-ensino' ? await porta.estadosDosPlanos(armazenamento) : {};

  const registos = resumos
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }))
    .sort((a, b) => String(b.gerado_em || b.id).localeCompare(String(a.gerado_em || a.id)));

  /* O MAPA plano → turma. O PO referencia o plano de ensino, e a turma do PO é a do plano. Sai do
   * MESMO índice que já foi lido — não é uma segunda leitura. */
  let turmaDoPlano = null;
  if (chave === 'plano-de-observacao') {
    turmaDoPlano = new Map();
    for (const { resumo } of await porta.resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/)) {
      if (resumo && resumo.id && resumo.turma) turmaDoPlano.set(resumo.id, resumo.turma);
    }
  }

  const linhas = linhasDe(chave, registos, estados, turmaDaAluna(curadorias), turmaDoPlano);
  const titulo = familia.titulo;
  const pedido = caminho.endsWith('/') ? caminho : caminho + '/';

  return {
    titulo,
    html: listas.paginaDeLista({
      titulo,
      subtitulo: escola ? escola + ' · ' + (linhas.length === 1
        ? '1 ' + familia.singular : linhas.length + ' ' + familia.plural) : familia.subtitulo,
      nav: nav.desenhar(menu, pedido, { titulo }) || '',
      itens: linhas,
      vazio: familia.vazio,
      campos: ['busca', 'turma'],
      singular: familia.singular,
      plural: familia.plural,
      dica: 'pelo nome, pela turma ou pelo professor',
      acao: acaoDaPagina(chave),
    }),
  };
}

module.exports = { pagina, FAMILIAS, turmaDaAluna, nomeDoProfessor, dia };
