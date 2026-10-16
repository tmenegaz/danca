'use strict';

/**
 * porta.js — a lógica da porta, SEM infraestrutura.
 *
 * O que a porta (a tela + as rotas) decide está aqui, e não num `fs` nem num
 * `http`: como uma resposta crua vira registro, como o mapa dos nós é montado,
 * como a proveniência deriva o vínculo e os três estados da anamnese, como um
 * envelope é identificado e gravado. Nada aqui importa `fs`, `path`, `http`,
 * `process` — o armazenamento chega por parâmetro (o contrato de
 * `./armazenamento.js`) e o conteúdo também.
 *
 * As funções são ASSÍNCRONAS quando tocam o armazenamento (o KV é assíncrono);
 * as puras (registro, linhas, carimbo, mapa) são síncronas.
 */

const motor = require('./elicitar.js');
const ficha = require('./ficha.js');

// As chaves do armazenamento. O envelope vive sob `envelope/<id>.json` — a
// MESMA notação que o disco sempre usou, para o adaptador Node ser o motor de
// sempre e o adaptador Cloudflare só trocar o meio, nunca o formato.
const PREFIXO_ENVELOPES = 'envelope/';
const ARQUIVO_DE = (id) => PREFIXO_ENVELOPES + id + '.json';

// O endereço do conteúdo que viaja no envelope — a referência ao artefato lido.
// São rótulos ESTÁVEIS, não caminhos resolvidos no runtime: o núcleo não sabe
// onde os ficheiros vivem; sabe o endereço que o envelope declara.
const ENDERECOS = {
  anamnese: 'conteudo/anamnese.json',
  po: '../po/conteudo/po.json',
  plano: '../plano/conteudo/plano.json',
};

// ---------------------------------------------------------------- puras

/**
 * A resposta crua que chega do navegador vira registro de quatro chaves:
 * {valor, origem, respondente, nota}. Um objeto SEM chave de registro é um
 * VALOR ESTRUTURADO (medida/periodicidade/data) e viaja cru.
 */
function registro(cru) {
  if (cru === null || cru === undefined || cru === '') return null;
  if (typeof cru === 'object' && !Array.isArray(cru)) {
    if (!('valor' in cru)) {
      if ('origem' in cru || 'respondente' in cru || 'nota' in cru) {
        throw new Error(
          'resposta em forma de objeto sem a chave `valor` — o motor leria isso como valor cru',
        );
      }
      return cru;
    }
    const nota = cru.nota == null || cru.nota === '' ? null : String(cru.nota);
    if (cru.origem === 'perguntado' && nota === null) return cru.valor;
    return {
      valor: cru.valor,
      origem: cru.origem || 'perguntado',
      respondente: cru.respondente || 'professor',
      nota,
    };
  }
  return cru;
}

/** O valor de uma resposta do envelope, desembrulhado (o plano guarda o objetivo). */
function valorDe(envelope, id) {
  const reg = envelope && envelope.respostas ? envelope.respostas[id] : null;
  const valor = reg && reg !== null && typeof reg === 'object' && 'valor' in reg ? reg.valor : reg;
  if (valor === undefined || valor === null) return null;
  return Array.isArray(valor) ? valor.join(' ') : String(valor);
}

/** O relatório do motor, em linhas legíveis — o `alvo` é o rótulo da gravação. */
function linhasDoRelatorio(relatorio, alvo) {
  const linhas = [];
  const c = relatorio.contagem;
  linhas.push(
    `${relatorio.id} · ${relatorio.estado} · ${c.respondidos}/${c.obrigatorios}`,
  );
  for (const elo of relatorio.elos) {
    linhas.push(`elo ${elo.no} = ${elo.valor} → ${elo.ramo}`);
  }
  for (const parada of relatorio.paradas) {
    linhas.push(`PARADA [${parada.tipo}] ${parada.motivo}`);
  }
  if (relatorio.idsDesconhecidos.length) {
    linhas.push(`⚠ ignorados: ${relatorio.idsDesconhecidos.join(', ')}`);
  }
  linhas.push(
    `validação: ${relatorio.validacao.resultado} (${relatorio.validacao.contrato})`,
  );
  for (const erro of relatorio.errosDoDocumento) {
    linhas.push(`ERRO ${erro.caminho}: ${erro.mensagem}`);
  }
  if (alvo) linhas.push(`escrito: ${alvo}`);
  return linhas;
}

/** O carimbo `AAAAMMDD-HHMM` em português — com sufixo de colisão tolerado. */
function carimboEmPortugues(id) {
  const casou = String(id || '').match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(?:-\d+)?$/);
  if (!casou) return null;
  return casou[3] + '/' + casou[2] + '/' + casou[1] + ' às ' + casou[4] + ':' + casou[5];
}

/** Serializa com as chaves de objeto em ordem fixa: dois documentos iguais dão a mesma string. */
function canonico(valor) {
  return JSON.stringify(valor, (_chave, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v).sort().reduce((acc, k) => ((acc[k] = v[k]), acc), {})
      : v,
  );
}

/**
 * Duas coleções de respostas são IGUAIS quando todo nó tem o mesmo VALOR (e a mesma nota).
 * A ordem das listas conta (é ordem declarada); a das chaves, não. Compara o CONTEÚDO, e não
 * como a resposta foi obtida (`origem`/`respondente`): isso o formulário de edição não mexe.
 */
function mesmasRespostas(antes, depois) {
  const mapa = (respostas) => {
    const saida = {};
    for (const [id, reg] of Object.entries(respostas || {})) {
      if (reg === null || reg === undefined) continue;
      const caixa = typeof reg === 'object' && 'valor' in reg ? reg : { valor: reg };
      const valor = caixa.valor === undefined ? null : caixa.valor;
      saida[id] = canonico([valor, caixa.nota === undefined ? null : caixa.nota]);
    }
    return saida;
  };
  const a = mapa(antes);
  const b = mapa(depois);
  const ids = new Set(Object.keys(a).concat(Object.keys(b)));
  for (const id of ids) if (a[id] !== b[id]) return false;
  return true;
}

/**
 * A edição MUDOU DE FATO? Compara o que o professor pode mexer: as respostas e o contexto
 * (o apelido da aluna mora nele). NÃO compara o carimbo nem o id — esses são consequência,
 * não conteúdo. Só quem mudou de fato recarimba (16/10/2026): abrir e mandar gravar sem
 * mexer não é edição, e a data não se mexe por nada.
 */
function mudouDeFato(anterior, novo) {
  if (!mesmasRespostas(anterior && anterior.respostas, novo && novo.respostas)) return true;
  return canonico(anterior && anterior.contexto) !== canonico(novo && novo.contexto);
}

// A correção socrática é INFRAESTRUTURA, não conteúdo (Frente 5). O conteúdo
// declara só o SEMA do campo (`socratico: "objetivo"`); quem sabe o que um
// «objetivo» exige — e a pergunta que ensina — é o SISTEMA. Os marcadores são
// verbos de AÇÃO (o que a professora faz em aula): uma resposta que começa por
// eles descreve o fazer, não o resultado que a aluna vai alcançar.
const SOCRATICA = {
  objetivo: {
    quando: ['dar', 'ensinar', 'passar', 'mostrar', 'corrigir', 'treinar', 'aplicar', 'apresentar', 'trabalhar', 'montar'],
    pergunta: 'Isso é o que você vai fazer. Mas o objetivo é o que a aluna vai conseguir fazer depois. Quer reformular?',
  },
};

/**
 * O mapa dos nós respondíveis, enriquecido com o contexto do conteúdo. A MESMA
 * função da porta original — sem o `fs` de ler o conteúdo: ele chega pronto.
 */
function mapa(conteudo) {
  const nos = motor.nosRespondiveis(conteudo);

  const desdobramentoPorId = new Map(
    conteudo.observacaoInicial.desdobramentos.map((d) => [d.id, d]),
  );
  const elementoPorId = new Map(
    conteudo.observacaoInicial.elementos.map((e) => [e.id, e]),
  );
  const blocoPorNumero = new Map(conteudo.blocos.map((b) => [b.bloco, b]));
  const moduloPorId = new Map(conteudo.modulosCondicionais.map((m) => [m.id, m]));

  const enriquecidos = nos.map((no) => {
    const base = {
      id: no.id,
      campo: no.campo,
      obrigatorio: no.obrigatorio,
      familia: no.familia,
      endereco: no.endereco,
      explicacao: no.explicacao || null,
      opcoesDe: no.opcoesDe || null,
      criarEm: no.criarEm || null,
      derivarDe: no.derivarDe || null,
      repetirPor: no.repetirPor || null,
      camposDoItem: no.camposDoItem || null,
      medida: no.medida || null,
      periodicidade: no.periodicidade || null,
      data: no.data || null,
      deContexto: no.deContexto || null,
      multipla: no.multipla === true,
      colunas: no.colunas || null,
      /* A GRELHA da tabela (a rubrica, a distribuição do volume): `{colunas, minimo}`, com as
         colunas NOMEADAS. Sem esta linha a porta não a recebe, e o campo cai no texto livre —
         foi o que aconteceu à rubrica, que saiu partida (uma célula sob um cabeçalho de cinco).
         Não confundir com `colunas` (o NÚMERO de colunas da escolha múltipla do histórico):
         são coisas diferentes, e por isso esta viaja aninhada. */
      tabela: no.tabela || null,
      /* A LISTA NUMERADA (o marco parcial): `{minimo}`. Caminha como a `tabela` — sem
         esta linha o nó cai no texto livre, e o professor volta a escrever tudo numa
         caixa só em vez de um marco por linha. */
      lista: no.lista || null,
      /* A ESCALA FIXA (a régua da rubrica): os níveis decididos, só de leitura. */
      escala: no.escala || null,
      /* O RITMO DA TURMA (frequência, duração, calendário, nº de aulas): o nó lê o
         cadastro da turma em vez de perguntar. */
      daTurma: no.daTurma || null,
      /* O QUE VEM DO PLANO: a lista do nó é DERIVADA do plano referenciado (os blocos
         da aula que ele marca, sob um eixo) em vez de perguntada. Sem bloco marcado,
         cai nos blocos canónicos que o próprio nó declara. */
      doPlano: no.doPlano || null,
      /* O que a direção ATRIBUIU no plano (a turma curada): o nó filtra e pré-marca. */
      daCuradoria: no.daCuradoria || null,
      /* A MATRIZ POR MARCO (blocos da aula, parâmetro de medição): uma linha por marco. */
      porMarco: no.porMarco || null,
      /* A CONDIÇÃO DE REGISTRO: os dois grupos de marcação (presentes × quem observa). */
      registro: no.registro || null,
      /* OS VALORES de uma ESCOLHA (a origem declarada do plano): a lista marcável do
         conteúdo. No caminho da anamnese/PO eles vêm da `forma` (quebrada por «·»); aqui
         vêm DECLARADOS, porque no plano a forma é a frase da pergunta e a lista é própria.
         Sem esta linha o nó cai no texto livre — e uma escolha de cinco opções vira prosa. */
      valores: Array.isArray(no.valores) ? no.valores : [],
      /* O RÓTULO DA LINHA LIVRE («…ou declare outra origem») — o conteúdo declara o que a
         linha do fim é, para um nó de escolha não dizer sempre «outra prática». */
      abertoRotulo: no.abertoRotulo || null,
      /* A folha DERIVADA do checklist: o sistema pré-preenche-a, e o selo da tela diz
         «pré-preenchido» em vez de «opcional». */
      derivado: no.derivado === true,
      exclusiva: no.exclusiva || null,
      aberto: no.aberto === true,
      // O SEMA vira a regra resolvida: o conteúdo declarou «objetivo», o sistema
      // entrega `{ quando, pergunta }` — ou null, se o sema for desconhecido.
      socratico: no.socratico ? (SOCRATICA[no.socratico] || null) : null,
    };

    if (no.familia === 'basilar' || no.familia === 'subitem') {
      const desmembra = no.familia === 'subitem';
      const elemento = elementoPorId.get(desmembra ? no.grupo : no.id);
      const agrupador = desmembra ? elementoPorId.get(no.grupo) : null;
      return {
        ...base,
        natureza: no.natureza,
        elemento: desmembra ? no.campo : elemento ? elemento.elemento : no.campo,
        grupo: no.grupo || null,
        agrupador: agrupador ? agrupador.elemento : null,
        oQueE: desmembra ? null : elemento ? elemento.oQueE : null,
        nota: desmembra ? null : elemento ? elemento.nota : null,
        orientacao: elemento ? elemento.orientacao || null : null,
        forma: no.forma || null,
        valores: no.valores || [],
        aprofunda: (
          desmembra
            ? agrupador
              ? agrupador.ondeAprofunda
              : []
            : elemento
              ? elemento.ondeAprofunda
              : []
        ).map((n) => {
            const b = blocoPorNumero.get(n);
            return { bloco: n, titulo: b ? b.titulo : null };
          }),
        desdobramentos: (no.desdobramentos || []).map(
          (id) => desdobramentoPorId.get(id) || { id, forma: id, exemplo: null },
        ),
      };
    }

    if (no.familia === 'bloco') {
      const bloco = blocoPorNumero.get(no.bloco);
      return {
        ...base,
        bloco: no.bloco,
        blocoTitulo: bloco ? bloco.titulo : null,
        blocoObjetivo: bloco ? bloco.objetivo : null,
        blocoNota: bloco ? bloco.nota || null : null,
        dimensaoDoBloco: bloco ? bloco.dimensao : null,
        dimensaoPorItem: bloco ? Boolean(bloco.dimensaoPorItem) : false,
        dimensao: no.dimensao,
        opcoes: no.opcoes || [],
        forma: no.forma || null,
        valores: no.valores || [],
      };
    }

    if (no.familia === 'modulo') {
      const modulo = moduloPorId.get(no.modulo);
      return {
        ...base,
        modulo: no.modulo,
        moduloTitulo: modulo ? modulo.titulo : null,
        moduloFuncao: modulo ? modulo.funcao : null,
        moduloCondicao: modulo ? modulo.condicaoDeEntrada : null,
        opcoes: no.opcoes || [],
      };
    }

    return {
      ...base,
      forma: no.forma || null,
      valores: no.valores || [],
      ramifica: no.ramifica || null,
      nota: no.nota || null,
      multipla: no.multipla === true,
      colunas: no.colunas || null,
      exclusiva: no.exclusiva || null,
      aberto: no.aberto === true,
    };
  });

  const noGatilho = enriquecidos.find((no) => no.familia === 'gatilho') || null;

  return {
    documento: conteudo.documento,
    norma: conteudo.norma,
    explicacao: conteudo.explicacao || null,
    tituloCabecalho: conteudo.cabecalho.titulo || null,
    apelidoObrigatorio: conteudo.apelidoObrigatorio,
    oQueFicaFora: conteudo.oQueFicaFora,
    ondeODadoVive: conteudo.ondeODadoVive,
    listaAberta: conteudo.listaAberta,
    metodos: ficha.metodosDeOrigem(conteudo),
    dimensoes: conteudo.dimensoes,
    perfisDeEntrada: conteudo.observacaoInicial.perfisDeEntrada,
    notaDesdobramentos: conteudo.observacaoInicial.notaDesdobramentos,
    gatilho: noGatilho ? noGatilho.endereco : null,
    total: enriquecidos.length,
    obrigatorios: enriquecidos.filter((no) => no.obrigatorio).length,
    nos: enriquecidos,
  };
}

// ------------------------------------------------------------ armazenamento

/** Os NOMES (sem o prefixo) dos envelopes que casam com o padrão, ordenados. */
async function nomesDeEnvelopes(armazenamento, padrao) {
  const chaves = await armazenamento.listar(PREFIXO_ENVELOPES);
  return chaves
    .map((chave) => chave.slice(PREFIXO_ENVELOPES.length))
    .filter((nome) => padrao.test(nome))
    .sort();
}

/** Lê um envelope pelo NOME do arquivo (ex.: `anamnese-….json`); null se ilegível. */
async function lerArquivo(armazenamento, nome) {
  const texto = await armazenamento.ler(PREFIXO_ENVELOPES + nome);
  if (texto === null) return null;
  try {
    return JSON.parse(texto);
  } catch (erro) {
    return null;
  }
}

/** O envelope pelo ID (o carimbo), com a trava de forma do id; null se ausente. */
async function lerEnvelope(armazenamento, id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  return lerArquivo(armazenamento, id + '.json');
}

/** O texto cru de um envelope (para a rota que o devolve byte a byte). */
async function lerEnvelopeCru(armazenamento, id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return null;
  return armazenamento.ler(PREFIXO_ENVELOPES + id + '.json');
}

/** O id do envelope mais recente (a ordenação lexicográfica é a cronológica). */
async function ultimoEnvelope(armazenamento) {
  const nomes = await nomesDeEnvelopes(armazenamento, /\.json$/);
  return nomes.length ? nomes[nomes.length - 1].replace(/\.json$/, '') : '';
}

/**
 * O id de um envelope novo — o documento se auto-identifica (M1): a anamnese é
 * `anamnese-…`, o PO é `po-…`. A colisão é resolvida por sufixo, como sempre.
 */
async function identificarComCarimbo(armazenamento, documento, carimbo) {
  const compacto = carimbo.replace(/[-:]/g, '').replace('T', '-');
  const nome = (documento || 'anamnese') + '-' + compacto;
  let id = nome;
  let n = 2;
  while (await armazenamento.existe(ARQUIVO_DE(id))) {
    id = nome + '-' + n;
    n += 1;
  }
  return { id, geradoEm: carimbo };
}

async function identificar(armazenamento, documento, agora) {
  const carimbo = (agora || motor.carimbarAgora)();
  return identificarComCarimbo(armazenamento, documento, carimbo);
}

/** Grava o envelope — só quando o documento passou na validação. */
async function gravarEnvelope(armazenamento, documento, relatorio) {
  if (relatorio.errosDoDocumento.length) {
    return { ok: false, erro: 'o documento não passou na validação', linhas: linhasDoRelatorio(relatorio) };
  }
  const chave = ARQUIVO_DE(relatorio.id);
  await armazenamento.guardar(chave, JSON.stringify(documento, null, 2) + '\n');
  return { ok: true, linhas: linhasDoRelatorio(relatorio, chave) };
}

/** Apaga um envelope; `false` se não existia. */
async function apagarEnvelope(armazenamento, id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return false;
  return armazenamento.apagar(ARQUIVO_DE(id));
}

/*
 * O VÍNCULO (a regra de proveniência): uma anamnese é VINCULADA quando um PO
 * selecionou o sujeito no nó `sujeitos`. É DERIVADO — varre-se os envelopes de
 * PO e vê-se quem declara o apelido; não se grava nada na anamnese.
 */
async function vinculos(armazenamento) {
  const por = new Map();
  const nomes = await nomesDeEnvelopes(armazenamento, /^po-.*\.json$/);
  for (const nome of nomes) {
    const envelope = await lerArquivo(armazenamento, nome);
    if (!envelope) continue;
    const reg = envelope.respostas && envelope.respostas.sujeitos;
    const valor = reg && reg.valor !== undefined ? reg.valor : reg;
    const lista = Array.isArray(valor) ? valor : valor === undefined || valor === null ? [] : [valor];
    for (const apelido of lista) {
      if (!por.has(apelido)) por.set(apelido, []);
      por.get(apelido).push(envelope.id || nome.replace(/\.json$/, ''));
    }
  }
  return por;
}

/*
 * O VÍNCULO do PLANO — o PO referencia o plano no nó `plano-de-ensino` (o id do
 * envelope). É DERIVADO, como o da anamnese: varre-se os envelopes de PO e vê-se
 * quem declara qual plano; não se grava nada no plano.
 */
async function vinculosDePlano(armazenamento) {
  const por = new Map();
  const nomes = await nomesDeEnvelopes(armazenamento, /^po-.*\.json$/);
  for (const nome of nomes) {
    const envelope = await lerArquivo(armazenamento, nome);
    if (!envelope) continue;
    const reg = envelope.respostas && envelope.respostas['plano-de-ensino'];
    const valor = reg && reg.valor !== undefined ? reg.valor : reg;
    const lista = Array.isArray(valor) ? valor : valor === undefined || valor === null ? [] : [valor];
    for (const planoId of lista) {
      if (!planoId) continue;
      if (!por.has(planoId)) por.set(planoId, []);
      por.get(planoId).push(envelope.id || nome.replace(/\.json$/, ''));
    }
  }
  return por;
}

/**
 * A ESTANTE de planos de ensino já lançados — um por carimbo, com o OBJETIVO
 * como resumo (o rótulo humano) e o estado de vínculo. Devolve só METADADO,
 * nunca as respostas (a mesma fronteira da `anamneses`).
 */
async function planos(armazenamento) {
  const nomes = await nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
  const ligacoes = await vinculosDePlano(armazenamento);
  const opcoes = [];
  for (const nome of nomes) {
    const envelope = await lerArquivo(armazenamento, nome);
    if (!envelope) continue;
    const carimbo = envelope.id || nome.replace(/\.json$/, '');
    const objetivo = valorDe(envelope, 'objetivo-geral');
    const por = ligacoes.get(carimbo) || [];
    opcoes.push({
      valor: carimbo,
      rotulo: objetivo || carimbo,
      carimbo,
      detalhe: 'api/envelope/' + encodeURIComponent(carimbo),
      escola: (envelope.contexto || {}).escola || null,
      professor: (envelope.contexto || {}).professor || null,
      ciclo: (envelope.contexto || {}).ciclo || null,
      vinculada: por.length > 0,
      por,
      ajuste_de: envelope.ajuste_de || null,
    });
  }
  opcoes.sort((a, b) => (a.carimbo < b.carimbo ? 1 : -1));
  return opcoes;
}

/**
 * O ESTADO de TODOS os planos — os três estados (solta / legado / vinculada).
 * Sem o apelido (o plano é um por objetivo, não um por aluna), o «legado» é o
 * plano que um sucessor ajustou: quem tem `ajuste_de` apontando para ele.
 */
async function estadosDosPlanos(armazenamento) {
  const ligacoes = await vinculosDePlano(armazenamento);
  const nomes = await nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
  const envelopes = [];
  for (const nome of nomes) {
    const envelope = await lerArquivo(armazenamento, nome);
    if (envelope) envelopes.push({ nome, envelope });
  }
  const sucessores = new Map();
  for (const { envelope } of envelopes) {
    if (!envelope.ajuste_de) continue;
    if (!sucessores.has(envelope.ajuste_de)) sucessores.set(envelope.ajuste_de, []);
    sucessores.get(envelope.ajuste_de).push(envelope.id);
  }
  const estados = {};
  for (const { nome, envelope } of envelopes) {
    const carimbo = envelope.id || nome.replace(/\.json$/, '');
    const por = ligacoes.get(carimbo) || [];
    const substituido_por = sucessores.get(carimbo) || [];
    let estado;
    if (por.length > 0) estado = 'vinculada';
    else if (substituido_por.length > 0) estado = 'legado';
    else estado = 'solta';
    estados[carimbo] = {
      estado,
      carimbo,
      objetivo: valorDe(envelope, 'objetivo-geral'),
      vinculada: por.length > 0,
      por,
      ajuste_de: envelope.ajuste_de || null,
      substituido_por,
    };
  }
  return estados;
}

/** O ESTADO de um plano, derivado — reusa a derivação da lista de gestão. */
async function estadoDoPlano(armazenamento, envelope) {
  const carimbo = envelope.id || null;
  const todos = await estadosDosPlanos(armazenamento);
  return todos[carimbo] || {
    estado: 'solta',
    carimbo,
    objetivo: valorDe(envelope, 'objetivo-geral'),
    vinculada: false,
    por: [],
    ajuste_de: envelope.ajuste_de || null,
    substituido_por: [],
  };
}

/**
 * A LISTA de anamneses já lançadas — um SUJEITO (apelido) por vez, o vigente.
 * Devolve só METADADO, nunca as respostas (Frente 5 do plano).
 */
async function anamneses(armazenamento) {
  const nomes = await nomesDeEnvelopes(armazenamento, /^anamnese-.*\.json$/);
  const ligacoes = await vinculos(armazenamento);
  const opcoes = [];
  for (const nome of nomes) {
    const envelope = await lerArquivo(armazenamento, nome);
    if (!envelope) continue;
    const contexto = envelope.contexto || {};
    const aluna = contexto.aluna || null;
    if (!aluna) continue;
    const carimbo = envelope.id || nome.replace(/\.json$/, '');
    const quando = carimboEmPortugues(carimbo);
    const por = ligacoes.get(aluna) || [];
    opcoes.push({
      valor: aluna,
      rotulo: aluna + (quando ? ' · ' + quando : ''),
      carimbo,
      detalhe: 'api/envelope/' + encodeURIComponent(carimbo),
      escola: contexto.escola || null,
      professor: contexto.professor || null,
      ciclo: contexto.ciclo || null,
      vinculada: por.length > 0,
      por,
      ajuste_de: envelope.ajuste_de || null,
    });
  }
  opcoes.sort((a, b) => (a.carimbo < b.carimbo ? 1 : -1));
  const vistos = new Set();
  const vigentes = [];
  for (const o of opcoes) {
    if (vistos.has(o.valor)) continue;
    vistos.add(o.valor);
    o.vigente = true;
    vigentes.push(o);
  }
  return vigentes;
}

/** O registro VIGENTE de um sujeito — `{carimbo, vinculada}` ou null. */
async function vigenteDoSujeito(armazenamento, aluna) {
  const o = (await anamneses(armazenamento)).find((x) => x.valor === aluna);
  return o ? { carimbo: o.carimbo, vinculada: o.vinculada } : null;
}

/**
 * O ESTADO de TODAS as anamneses — inclusive as SEM SUJEITO. Uma fonte só para
 * os três estados (solta / legado / vinculada) e o `sem-sujeito`.
 */
async function estadosDasAnamneses(armazenamento) {
  const ligacoes = await vinculos(armazenamento);
  const lista = await anamneses(armazenamento);
  const vigenteDe = new Map();
  for (const o of lista) if (!vigenteDe.has(o.valor)) vigenteDe.set(o.valor, o.carimbo);
  const nomes = await nomesDeEnvelopes(armazenamento, /^anamnese-.*\.json$/);

  const envelopes = [];
  const contagem = new Map();
  for (const nome of nomes) {
    const envelope = await lerArquivo(armazenamento, nome);
    if (!envelope) continue;
    const apelido = (envelope.contexto && envelope.contexto.aluna) || null;
    envelopes.push({ nome, envelope, apelido });
    if (apelido) contagem.set(apelido, (contagem.get(apelido) || 0) + 1);
  }

  const estados = {};
  for (const { nome, envelope, apelido } of envelopes) {
    const carimbo = envelope.id || nome.replace(/\.json$/, '');
    const por = apelido ? ligacoes.get(apelido) || [] : [];
    const vigente = apelido !== null && vigenteDe.get(apelido) === carimbo;
    let estado;
    if (apelido === null) estado = 'sem-sujeito';
    else if (por.length > 0) estado = 'vinculada';
    // O VIGENTE nunca é «legado»: ele é o que a regra lê. Antes, dois registros do mesmo
    // apelido marcavam OS DOIS como substituídos — e o atual saía no ecrã como
    // «substituída · vigente», que se contradiz.
    else if (vigente) estado = 'solta';
    else if ((contagem.get(apelido) || 0) >= 2) estado = 'legado';
    else estado = 'solta';
    estados[carimbo] = {
      estado,
      carimbo,
      apelido,
      semSujeito: apelido === null,
      vinculada: por.length > 0,
      por,
      vigente,
      ajuste_de: envelope.ajuste_de || null,
    };
  }
  return estados;
}

/** O ESTADO de uma anamnese, derivado — reusa a derivação da lista de gestão. */
async function estadoDaAnamnese(armazenamento, envelope) {
  const carimbo = envelope.id || null;
  const todos = await estadosDasAnamneses(armazenamento);
  return todos[carimbo] || {
    estado: 'sem-sujeito',
    carimbo,
    apelido: null,
    semSujeito: true,
    vinculada: false,
    por: [],
    vigente: false,
    ajuste_de: envelope.ajuste_de || null,
  };
}

/**
 * A ELICITAÇÃO inteira — o que a rota `POST /api/elicitar` decide. Recebe o
 * conteúdo e o esquema prontos (o runtime os carregou); o armazenamento é o
 * adaptador. A política de persistência da anamnese (substituir vs. empilhar)
 * está aqui — o cliente não decide, e a tela não sabe o estado para gravar.
 */
async function elicitar(armazenamento, corpo, dados) {
  const cruas = corpo && typeof corpo.respostas === 'object' && corpo.respostas ? corpo.respostas : {};
  const fonte = corpo && corpo.fonte;
  const conteudoAtual =
    fonte === 'po' ? dados.conteudoPO : fonte === 'plano' ? dados.conteudoPlano : dados.conteudo;

  const respostas = {};
  const recusadas = [];
  for (const [id, valor] of Object.entries(cruas)) {
    try {
      const reg = registro(valor);
      if (reg !== null) respostas[id] = reg;
    } catch (erro) {
      recusadas.push({ id, motivo: erro.message });
    }
  }

  const opcoes = { esquema: dados.esquema };
  if (corpo && corpo.id) opcoes.id = String(corpo.id);
  if (corpo && corpo.geradoEm) opcoes.geradoEm = String(corpo.geradoEm);

  // O PLANO espelha a regra da anamnese, mas sem sujeito único: a edição e a
  // derivação são EXPLÍCITAS (o professor escolhe o plano na estante).
  //   · `ajuste_de` → DERIVA (elo novo, sempre);
  //   · `id` solta → edita em sítio (o mesmo id);
  //   · `id` vinculada → vira elo novo (nunca se reescreve o que um PO usa).
  if (fonte === 'plano') {
    const ligacoes = await vinculosDePlano(armazenamento);
    if (corpo && corpo.ajuste_de) {
      opcoes.ajuste = { de: String(corpo.ajuste_de), motivo: (corpo && corpo.motivo) || null };
      delete opcoes.id;
    } else if (corpo && corpo.id) {
      const por = ligacoes.get(String(corpo.id)) || [];
      if (por.length > 0) {
        opcoes.ajuste = { de: String(corpo.id), motivo: (corpo && corpo.motivo) || null };
        delete opcoes.id;
      }
      // solta: `opcoes.id` já é o corpo.id — edita em sítio.
    }
  }

  if (!opcoes.id && fonte !== 'po' && fonte !== 'plano') {
    const aluna = corpo && corpo.contexto && corpo.contexto.aluna;
    const vigente = aluna ? await vigenteDoSujeito(armazenamento, aluna) : null;
    if (vigente && vigente.vinculada) {
      opcoes.ajuste = { de: vigente.carimbo, motivo: (corpo && corpo.motivo) || null };
    } else if (vigente) {
      opcoes.id = vigente.carimbo;
    }
  }

  opcoes.endereco =
    fonte === 'po' ? ENDERECOS.po : fonte === 'plano' ? ENDERECOS.plano : ENDERECOS.anamnese;
  if (!opcoes.id) {
    const { id, geradoEm } = await identificar(
      armazenamento,
      (conteudoAtual && conteudoAtual.documento) || 'anamnese',
      dados.agora,
    );
    opcoes.id = id;
    if (!opcoes.geradoEm) opcoes.geradoEm = geradoEm;
  }

  if (corpo && corpo.contexto) opcoes.contexto = corpo.contexto;

  const { documento, estado, relatorio } = motor.elicitar(conteudoAtual, respostas, opcoes);
  const simular = Boolean(corpo && corpo.simular);
  const gravacao = simular
    ? { ok: true, linhas: linhasDoRelatorio(relatorio) }
    : await gravarEnvelope(armazenamento, documento, relatorio);

  return {
    ok: relatorio.errosDoDocumento.length === 0,
    simular,
    gravado: !simular && gravacao.ok,
    estado,
    id: relatorio.id,
    contagem: relatorio.contagem,
    gatilho: relatorio.gatilho,
    elos: relatorio.elos,
    paradas: relatorio.paradas,
    idsDesconhecidos: relatorio.idsDesconhecidos,
    validacao: relatorio.validacao,
    errosDoDocumento: relatorio.errosDoDocumento,
    recusadas,
    linhas: gravacao.linhas,
    documento,
  };
}

module.exports = {
  PREFIXO_ENVELOPES,
  ARQUIVO_DE,
  ENDERECOS,
  registro,
  linhasDoRelatorio,
  carimboEmPortugues,
  mesmasRespostas,
  mudouDeFato,
  mapa,
  nomesDeEnvelopes,
  lerArquivo,
  lerEnvelope,
  lerEnvelopeCru,
  ultimoEnvelope,
  identificar,
  identificarComCarimbo,
  gravarEnvelope,
  apagarEnvelope,
  vinculos,
  valorDe,
  vinculosDePlano,
  planos,
  estadosDosPlanos,
  estadoDoPlano,
  anamneses,
  vigenteDoSujeito,
  estadosDasAnamneses,
  estadoDaAnamnese,
  elicitar,
};
