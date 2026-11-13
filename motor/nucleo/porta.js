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
const fusao = require('./fusao.js');
const ficha = require('./ficha.js');
/* O ELENCO DA TURMA É DERIVADO DA LINHA DE BASE (05/11/2026), e a conta é dela — não se repete
 * aqui a união das alunas nem a diferença entre o declarado e o derivado. Duas cópias da mesma
 * regra divergem na primeira correcção, e a que ficasse para trás seria a que marca o «rever». */
const recorte = require('./linha-de-base.js');

// As chaves do armazenamento. O envelope vive sob `envelope/<id>.json` — a
// MESMA notação que o disco sempre usou, para o adaptador Node ser o motor de
// sempre e o adaptador Cloudflare só trocar o meio, nunca o formato.
const PREFIXO_ENVELOPES = 'envelope/';
const ARQUIVO_DE = (id) => PREFIXO_ENVELOPES + id + '.json';

// O ÍNDICE DAS CHAVES (19/10/2026). A estante, a lista de sujeitos e a lista de planos
// começam todas por ENUMERAR o armazenamento — e no KV (`kv.list`) a enumeração tem cota
// diária própria: estourada a cota, ela LANÇA, e as três listas param ao mesmo tempo. Foi o
// que aconteceu no `calango`: o PO abriu com «não foi possível ler a lista agora» nos nós
// `plano-de-ensino` e `sujeitos`, com as anamneses e o plano gravados e invisíveis.
//
// A leitura (`get`) não tem essa cota e é a autoridade (a mesma lição do expurgo). Então o
// índice passa a ser um ARQUIVO: uma lista de nomes que se lê com `ler` e que as duas únicas
// portas de escrita (`gravarEnvelope`, `apagarEnvelope`) mantêm. Não substitui os envelopes —
// eles continuam um por arquivo, byte a byte onde sempre estiveram. É só o rol dos nomes.
//
// Quando o índice não existe ainda (escola anterior a esta mudança), cai-se na enumeração
// UMA vez e grava-se o resultado: a partir daí essa escola nunca mais paga a cota. A escola
// nova nasce com o índice vazio (o provisionamento grava-o), e não enumera nunca.
const INDICE_DOS_ENVELOPES = PREFIXO_ENVELOPES + '.indice.json';

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

/**
 * A TURMA de um plano — UM nome, ou `null`.
 *
 * O plano é de UMA turma (16/10/2026): uma turma por plano, e a escolhida não se repete nos
 * planos seguintes. O campo já foi MÚLTIPLO, e há envelopes gravados assim — por isso o
 * array é lido (a primeira turma vale) em vez de descartado: o histórico não se reescreve, e
 * uma estante que ignorasse esses planos mostraria a turma como livre quando não está.
 */
function turmaDoEnvelope(envelope) {
  const reg = envelope && envelope.respostas ? envelope.respostas['contexto-turma'] : null;
  const valor = reg && reg !== null && typeof reg === 'object' && 'valor' in reg ? reg.valor : reg;
  if (valor === undefined || valor === null) return null;
  const nome = Array.isArray(valor) ? valor[0] : valor;
  const s = String(nome == null ? '' : nome).trim();
  return s || null;
}

/** As turmas que uma curadoria declara, sempre como lista de nomes não vazios. */
function turmasDaCuradoria(c) {
  if (!c || typeof c !== 'object') return [];
  if (Array.isArray(c.turmas) && c.turmas.length) {
    return c.turmas.map((t) => String(t == null ? '' : t).trim()).filter(Boolean);
  }
  const uma = String(c.turma || '').trim();
  return uma ? [uma] : [];
}

/**
 * QUEM DIRIGE CADA TURMA HOJE — `Map<nomeDaTurma, slugDoProfessor>`.
 *
 * Lê as curadorias ACTIVAS (a substituída desce para o histórico, e não dirige nada). `null`
 * quando a lista não se conseguiu ler: quem chama trata `null` como «não sei», e não como
 * «ninguém dirige» — a mesma regra de `turmasCuradas`, e pela mesma razão. A ausência de dado
 * não é um facto sobre o mundo.
 */
function direcaoDasTurmas(curadorias) {
  if (!Array.isArray(curadorias)) return null;
  const mapa = new Map();
  for (const c of curadorias) {
    if (!c || typeof c !== 'object' || c.substituidaPor) continue;
    const professor = String(c.professor || '').trim();
    if (!professor) continue;
    for (const nome of turmasDaCuradoria(c)) mapa.set(nome, professor);
  }
  return mapa;
}

/**
 * O DOCUMENTO QUE PERDEU A TURMA (12/11/2026).
 *
 * O DEFEITO, relatado pela pesquisadora e medido no acervo do `calango`. Ela derivou a Turma
 * trocando o professor — Pé Torto → Redinha Rosa —, e a cadeia tomou o plano que o Pé Torto
 * escreveu e gravou-o de novo **com o nome da Redinha Rosa**. O mesmo com o PO. O resultado está
 * nos envelopes: `plano-20261110-2145` diz `redinha-rosa` e é `ajuste_de` um plano do `pe-torto`,
 * com o conteúdo do Pé Torto intacto por dentro. A Redinha nunca escreveu aquele plano, e a
 * listagem afirmava que sim: «ele trocou o nome do plano de ensino atual para quem fez sendo a
 * Redinha Rosa e isso não é verdade».
 *
 * A REGRA QUE PASSA A VALER: **a autoria não se reescreve.** Um plano nomeia uma turma e declara
 * quem o escreveu; quando a curadoria passa essa turma a outro professor, o documento não muda de
 * autor — muda de SITUAÇÃO. Ele deixa de ser o plano daquela turma, e o que fica dito é isso:
 * `sem turma`, e um traço onde a linha dizia a turma.
 *
 * O professor que passa a dirigir não herda o documento: ele faz o dele (ou o anterior faz o
 * vínculo do seu, à mão, noutra turma). É a diferença entre memória e falsificação.
 *
 * `null` quando não há nada a dizer — sem turma, turma não curada hoje, autor que ainda a dirige,
 * autor não declarado, ou curadorias não lidas.
 */
function perdeuATurma(registo, direcao) {
  if (!direcao || typeof direcao.get !== 'function') return null;
  const turma = String((registo && registo.turma) || '').trim();
  if (!turma) return null;
  const dono = String(direcao.get(turma) || '').trim();
  if (!dono) return null;
  const autor = String((registo && registo.professor) || '').trim();
  if (!autor || autor === dono) return null;
  return { turma, dono, autor };
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
    /*
     * O NÓ ENTRA INTEIRO, E O QUE A PORTA ACRESCENTA VEM POR CIMA (20/10/2026).
     *
     * Era uma SEGUNDA lista fechada, chave a chave, sobre a que o `descritores()` do motor já
     * tinha feito. Duas listas em série querem dizer duas chances de perder o mesmo dado — e o
     * dado perdeu-se nas duas: o `recortePeloPlano`, declarado no conteúdo do PO, atravessou o
     * gerador do mapa e morreu aqui, na porta que o serve. O sintoma era o pior possível: a rota
     * a recortar certo (`?plano=` → uma aluna) e a tela a pedir a lista SEM recorte, porque o nó
     * que ela recebia não trazia a marca.
     *
     * Com o `...no`, o que o motor produz chega ao cliente sem uma terceira declaração pelo
     * caminho. O que a porta faz depois continua a ser o que ela sabe e o motor não: normalizar
     * `|| null`, `=== true`, os valores da forma, o sema resolvido.
     *
     * POR QUE NÃO BASTAVA ACRESCENTAR MAIS UMA LINHA: porque a lista seguinte perderia outra
     * chave, e ninguém dá por isso — o sintoma é sempre mudo. Uma lista fechada é uma promessa
     * de esquecimento.
     */
    const base = {
      ...no,
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
      /* A REGRA DO «PRÉ-PREENCHIDO»: de que campos a folha derivada se lê. Vem do conteúdo
         (`derivadoDe`) e viaja com o nó para o formulário aplicar a MESMA declaração que o
         documento aplica na derivação — o selo «pré-preenchido» só pode aparecer numa folha
         que de facto se pré-preenche. */
      derivadoDe: no.derivadoDe || null,
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
  const { nomes } = await lerIndice(armazenamento);
  return nomes
    .filter((nome) => padrao.test(nome))
    .sort();
}

/**
 * OS RESUMOS dos envelopes que casam com o padrão — `[{nome, resumo}]`, na ordem dos nomes.
 *
 * A LISTA NÃO LÊ O CONTEÚDO (20/10/2026). `planos()` e `estadosDasAnamneses()` liam CADA
 * envelope para saber um rótulo, a turma ou o apelido: com 3 planos, 4 anamneses e 2 POs, uma
 * carga da página do PO custava 11 leituras no KV — e crescia com o acervo da escola. O que a
 * lista precisa é METADADO, e o metadado cabe no índice, que já era lido de qualquer forma.
 *
 * O envelope continua a ser a autoridade: quem ABRE um registo lê o arquivo (`lerEnvelope`).
 * O resumo é para a ESTANTE — e por isso carrega só o que a estante mostra.
 */
async function resumosDeEnvelopes(armazenamento, padrao, jaLido) {
  // O índice é UM arquivo: quem precisa do resumo de duas famílias (o PO precisa dos planos E
  // dos POs, para saber os vínculos) passa o que já leu, e não o lê outra vez (20/10/2026).
  const { nomes, resumos } = jaLido || (await lerIndice(armazenamento));
  const lista = [];
  for (const nome of nomes.filter((n) => padrao.test(n)).sort()) {
    if (resumos[nome]) {
      lista.push({ nome, resumo: resumos[nome] });
      continue;
    }
    // Sem resumo (índice antigo, ou reconstruído sem conseguir ler o arquivo): lê ESTE e
    // segue. É a saída de emergência — não pode ser o caminho normal, ou nada se ganhou.
    const envelope = await lerArquivo(armazenamento, nome);
    if (envelope) lista.push({ nome, resumo: resumoDoEnvelope(envelope, nome) });
  }
  return lista;
}

/**
 * O RESUMO de um envelope — o que a ESTANTE precisa, e nada mais.
 *
 * Ele é derivado do envelope na ÚNICA porta de escrita (`gravarEnvelope`), pela mesma função
 * que reconstrói o índice: uma implementação só, para o índice não divergir do dado. O que
 * aqui entra é o que um dia uma lista pediu — se uma lista nova precisar de outro campo, é
 * aqui que ele passa a existir, e o índice se reconstrói sozinho (a `versao` sobe).
 */
const VERSAO_DO_RESUMO = 4;

/**
 * OS CAMPOS QUE A DEFINIÇÃO DE HOJE ESCREVE SEMPRE — e a razão de eles existirem (24/10/2026).
 *
 * O NÚMERO DA VERSÃO NÃO CHEGA, e a produção provou-o. `gravarIndice` grava com
 * `versao: VERSAO_DO_RESUMO` — ou seja, **qualquer escrita carimba a versão de hoje nos resumos
 * que já lá estão**. Bastou uma escrita depois de a versão 4 entrar para o índice do repositório
 * ficar a dizer «versão 4» com resumos feitos pela 3, sem `gerado_em`: a data continuou vazia, e
 * o índice jurava estar na versão nova.
 *
 * A PERGUNTA CERTA NÃO É «QUE VERSÃO DIZ», É «QUE CAMPOS TEM». Um resumo sem um campo que a
 * definição de hoje escreve sempre é um resumo de outra definição, diga o número o que disser.
 * A lista acompanha o `resumoDoEnvelope`: quem acrescentar um campo lá acrescenta-o aqui, e o
 * índice refaz-se sozinho uma vez.
 */
const CAMPOS_DO_RESUMO = ['id', 'fonte', 'gerado_em'];

/** O resumo tem todos os campos que a definição de hoje escreve? */
function resumoCompleto(resumo) {
  if (!resumo || typeof resumo !== 'object') return false;
  return CAMPOS_DO_RESUMO.every((c) => Object.prototype.hasOwnProperty.call(resumo, c));
}

function resumoDoEnvelope(envelope, nome) {
  const id = (envelope && envelope.id) || String(nome || '').replace(/\.json$/, '');
  const contexto = (envelope && envelope.contexto) || {};
  const fonte = String(id).split('-')[0];
  const resumo = {
    id,
    fonte,
    escola: contexto.escola || null,
    professor: contexto.professor || null,
    ciclo: contexto.ciclo || null,
    ajuste_de: (envelope && envelope.ajuste_de) || null,
    /* A DATA DO REGISTO (24/10/2026) — a versão 4 do resumo.
     *
     * Ela existia só no envelope, e a listagem precisa dela para a terceira caixa de toda a
     * gente: a anamnese «feita quando», o plano «registado quando», o PO «quando». Sem ela no
     * índice, a lista teria de LER cada envelope para saber uma data — e a regra desta estante
     * é que a lista se faz com METADADO, numa leitura só.
     *
     * O índice reconstrói-se sozinho: quem guarda compara a `versao` e, se for menor, refaz. */
    gerado_em: (envelope && envelope.gerado_em) || null,
  };
  // O SUJEITO da anamnese é o apelido do CONTEXTO (não a resposta): é o que a lista mostra.
  if (fonte === 'anamnese') resumo.aluna = contexto.aluna || null;
  // O PLANO: o objetivo é o rótulo humano da estante; a turma diz de quem é o plano.
  //
  // O REPERTÓRIO E O NOME DO PROFESSOR ENTRAM AQUI (20/10/2026) porque a regra de proveniência
  // dos Bastidores («o que já entrou num plano não se apaga») precisa dos dois — e ela lia os
  // envelopes um por um, com uma enumeração à cabeça, para os ir buscar. Com eles no resumo,
  // essa regra passa a custar UMA leitura do índice.
  if (fonte === 'plano') {
    resumo.objetivo = valorDe(envelope, 'objetivo-geral');
    resumo.turma = turmaDoEnvelope(envelope);
    resumo.repertorio = listaDeResposta(envelope, 'repertorio');
    // O nome que o formulário gravou (o slug já viaja em `professor`); são os dois que a
    // curadoria compara, porque planos de épocas diferentes usam um ou outro.
    const nome = valorDe(envelope, 'contexto-professor');
    resumo.professorNome = nome || null;
  }
  // O PO: é dele que saem os VÍNCULOS (quem observa quem, e qual plano referencia).
  if (fonte === 'po') {
    resumo.sujeitos = listaDeResposta(envelope, 'sujeitos');
    resumo.plano = listaDeResposta(envelope, 'plano-de-ensino');
  }
  return resumo;
}

/** Uma resposta que é LISTA (ou um valor só), sempre como lista de strings não vazias. */
function listaDeResposta(envelope, id) {
  const reg = envelope && envelope.respostas ? envelope.respostas[id] : null;
  const valor = reg && reg !== null && typeof reg === 'object' && 'valor' in reg ? reg.valor : reg;
  if (valor === undefined || valor === null) return [];
  return (Array.isArray(valor) ? valor : [valor])
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(String);
}

/*
 * O VIGENTE DE CADA DOCUMENTO — a estante mostra o topo, e o histórico fica na proveniência
 * (03/11/2026).
 *
 * O QUE ACONTECEU. O professor ajustou o Plano de Observação três vezes até a geração passar, e a
 * listagem da Área do Professor passou a mostrar três linhas com o MESMO nome («Plano de
 * Observação — Balé Nível 1 — Teste 3»): uma por envelope. Do lado de quem dá a aula, ele fez UMA
 * coisa — ajustou e salvou —, e o empilhamento é o mecanismo de proveniência a aparecer onde não
 * deve. O registo e a cadeia continuam inteiros (é o lastro, e é a razão de o sistema existir); o
 * que muda é o que a ESTANTE mostra.
 *
 * A REGRA TEM DUAS METADES, porque há dois modos de nascer uma versão nova:
 *
 *   1. A CADEIA — um envelope que algum outro aponta em `ajuste_de` está SUBSTITUÍDO. É a
 *      proveniência a dizê-lo: quem derivou declarou de quem, e não há inferência nenhuma.
 *   2. O CONTEXTO — dois envelopes do MESMO documento sem cadeia entre eles (duas tentativas
 *      irmãs, ambas derivadas do mesmo original, ou duas gravações independentes) são a mesma
 *      coisa vista duas vezes. Fica o mais recente, e o outro é declarado no histórico.
 *
 * O QUE NÃO SE AGRUPA. A chave de contexto exige o campo que IDENTIFICA o documento — a aluna, o
 * plano observado —, e um registo que não o tenha **não é agrupado**: juntar desconhecidos é a
 * maneira mais fácil de esconder um documento que é outro. E o ciclo faz parte da chave do PO,
 * como a pesquisadora pediu: o mesmo documento noutro ciclo é outro documento, e continua com a
 * sua linha.
 *
 * O PLANO DE ENSINO NÃO TEM CHAVE DE CONTEXTO, e a razão é MEDIDA. A primeira versão desta regra
 * agrupava-o por (professor, ciclo, turma) — e a bancada `provar-apagar-da-listagem` ficou vermelha
 * com o dado que ela própria monta: dois planos da MESMA turma e do MESMO ciclo, um deles
 * observado por um PO e o outro não, são dois documentos de verdade, e o plano observado
 * desaparecia da estante. O plano é identificado pelo que ele ENSINA (o objetivo), e não pela
 * turma; o que o substitui é a derivação, e quem a declara é o `ajuste_de`. Para o plano, a
 * metade 1 da regra basta — e é a única que não esconde nada que o professor não tenha
 * substituído.
 *
 * A ANAMNESE É A OUTRA EXCEPÇÃO DECLARADA, e ela vem do sistema, não desta função: a anamnese já
 * é uma só por aluna (`anamneses` e `estadosDasAnamneses` derivam o vigente pelo apelido, sem
 * olhar o ciclo). Pôr o ciclo na chave aqui faria a estante mostrar duas linhas da mesma aluna
 * enquanto a lista de sujeitos do PO mostrava uma — duas verdades sobre quem é a aluna.
 *
 * O QUE VOLTA. `{ vigentes, historico }`: os registos que a estante mostra, e — por id do vigente —
 * os ids que ele substituiu. O `historico` existe para a linha PODER DIZER que há versões
 * anteriores: esconder sem o dizer é a família de defeito que este repositório mais evita.
 */
const CONTEXTO_DO_REGISTO = {
  anamnese: (r) => (r.aluna ? ['aluna', r.escola || '', r.aluna] : null),
  // `plano` fica SEM chave, de propósito: ver o parágrafo acima. A derivação (`ajuste_de`) é o que
  // o substitui, e dois planos da mesma turma e ciclo são dois documentos.
  plano: () => null,
  po: (r) => {
    const planos = (Array.isArray(r.plano) ? r.plano : []).map(String).filter(Boolean).sort();
    return planos.length ? ['po', r.escola || '', planos.join('+')] : null;
  },
};

/**
 * OS CICLOS DE UMA ESCOLA — quantos planos e quantos POs cada um tem (04/11/2026).
 *
 * A PERGUNTA QUE ISTO RESPONDE, e ela é de negócio e não de arrumação: «os ciclos são
 * estritamente sequenciais; o campo do ciclo não pode ser texto livre». Para travar o campo no
 * próximo número válido é preciso saber **quais existem** — e a resposta não pode ser um cadastro
 * à parte: um segundo registo dos ciclos divergiria do primeiro no dia em que um documento fosse
 * apagado, e a tela passaria a oferecer um ciclo que já não tem nada dentro.
 *
 * A FONTE É O ÍNDICE DOS ENVELOPES (o mesmo que a estante lê), e é o que torna a regra
 * verificável: **um ciclo existe porque tem documento**. Um `ciclo-02` sem plano e sem PO não é
 * um ciclo — é um número que alguém escreveu.
 *
 * O QUE VOLTA: `[{ ciclo, planos, pos, temPlano }]` em ordem NUMÉRICA. `temPlano` é o que o
 * Plano de Observação precisa: não se observa um ciclo que não tem plano de ensino, e o seletor
 * do PO mostra só os que têm. A ordem é numérica e não alfabética porque `'10'` ordena antes de
 * `'2'` como texto — o mesmo defeito de contar texto que este repositório já pagou nas aulas.
 */
async function ciclosDaEscola(armazenamento, { escola, professor, jaLido } = {}) {
  const { nomes, resumos } = jaLido || (await lerIndice(armazenamento));
  const doProfessor = String(professor || '').trim();
  const daEscola = String(escola || '').trim();
  const porCiclo = new Map();
  for (const nome of nomes) {
    const r = resumos[nome];
    if (!r || !r.ciclo) continue;
    if (daEscola && String(r.escola || '') !== daEscola) continue;
    if (doProfessor && String(r.professor || '') !== doProfessor) continue;
    const chave = String(r.ciclo);
    if (!porCiclo.has(chave)) porCiclo.set(chave, { ciclo: chave, planos: 0, pos: 0 });
    const alvo = porCiclo.get(chave);
    if (String(r.fonte) === 'plano') alvo.planos += 1;
    if (String(r.fonte) === 'po') alvo.pos += 1;
  }
  return [...porCiclo.values()]
    .map((c) => Object.assign(c, { temPlano: c.planos > 0 }))
    .sort((a, b) => Number(a.ciclo) - Number(b.ciclo));
}

/**
 * O PRÓXIMO CICLO VÁLIDO: `01` quando não há nenhum, e o seguinte ao maior quando há.
 *
 * É o que trava o campo. Não é «o último + 1» por conveniência: é a definição de sequência
 * estrita (1, 2, 3, … N) — um ciclo 50 sem os anteriores não é um ciclo, é um número, e a
 * numeração é a posição na cadeia (a âncora encadeia `NN-1` → `NN`).
 *
 * `null` quando há um BURACO na sequência (01 e 03 sem o 02): aí não há próximo válido a sugerir,
 * e inventar um número por cima do buraco esconderia o problema em vez de o dizer. Quem mostra
 * decide dizer a lacuna — o silêncio é a família de defeito que esta casa mais evita.
 */
function proximoCiclo(ciclos) {
  const lista = (Array.isArray(ciclos) ? ciclos : [])
    .map((c) => Number(typeof c === 'object' ? c.ciclo : c))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (!lista.length) return '01';
  for (let i = 0; i < lista.length; i += 1) {
    if (lista[i] !== i + 1) return null;      // buraco: 1, 3 → não há «próximo» honesto
  }
  return String(lista[lista.length - 1] + 1).padStart(2, '0');
}

/**
 * O QUE PRECISA DE REVALIDAÇÃO, depois de entrar um retrato físico novo (04/11/2026).
 *
 * A REGRA, dita pela pesquisadora: «a anamnese alimenta o aspecto físico do plano através de uma
 * acção de carregar no Plano de Observação, onde a professora edita e consolida a linha de base.
 * Quando há alteração, os documentos gerados anteriormente precisam de ser revalidados: cabe ao
 * professor abrir os documentos, avaliar os impactos no aspecto físico, realizar os ajustes e
 * solicitar uma nova geração.»
 *
 * A ORDEM É ESTRITA E NÃO É NEGOCIÁVEL: **primeiro o Plano de Ensino, depois o Plano de
 * Observação**. O PO observa o que o PE fixou — revalidar o PO sobre um PE velho é consolidar
 * uma linha de base sobre um plano que já não vale. É por isso que os dois são marcados, e é por
 * isso que a resposta traz a ordem: quem mostra diz «comece por aqui».
 *
 * PORQUE É DERIVADO E NÃO UM CAMPO NO ENVELOPE. Um campo `revalidar: true` seria uma SEGUNDA
 * declaração do mesmo facto — e a primeira gravação deixaria as duas a divergir; pior, alguém
 * teria de o limpar à mão, e um sinal que se esquece de apagar é um sinal que mente. Aqui a
 * pergunta é refeita de cada vez: «a anamnese de algum sujeito é mais recente do que este
 * documento?». Quando o documento é gravado de novo, ele fica mais novo e o sinal cai sozinho.
 *
 * O QUE ENTRAM COMO SUJEITO: o que o PO declara em `sujeitos`. O plano não nomeia alunas — o
 * `aspecto-fisico` dele é consolidado por turma —, e por isso o plano é marcado pela CADEIA: se
 * o PO que o observa está pendente, o plano que ele fixou também está, e vem primeiro.
 *
 * O QUE **NÃO** SE FAZ AQUI, e é decisão dela: não há periodicidade, nem validade, nem «a
 * anamnese está velha». O controlo de quando se refaz o retrato é política da escola, e um motor
 * que a impusesse estaria a decidir pedagogia por conta própria.
 */
async function revalidacaoPendente(armazenamento, jaLido, linhasDeBase, curadorias, salas) {
  const indice = jaLido || (await lerIndice(armazenamento));

  // 1. A DATA DE CADA SUJEITO — a da anamnese mais recente. A chave é a aluna, não o ciclo: a
  //    anamnese é do sujeito (decisão de 04/11/2026), e uma do ciclo 07 conta para o ciclo 03.
  const anamneseDe = new Map();
  for (const { resumo } of await resumosDeEnvelopes(armazenamento, /^anamnese-.*\.json$/, indice)) {
    const aluna = String(resumo.aluna || '').trim();
    if (!aluna) continue;
    const quando = ordemDoRegisto(resumo);
    const atual = anamneseDe.get(aluna);
    if (!atual || quando > atual.quando) anamneseDe.set(aluna, { quando, id: resumo.id });
  }

  // 2. OS POs — quem declara sujeitos, e quando foi gravado.
  const pendentes = new Map();
  const pos = [];
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/, indice)) {
    const id = resumo.id || nome.replace(/\.json$/, '');
    /* OS SUJEITOS VÊM DO RESUMO, E NÃO DO ARQUIVO (13/11/2026).
     *
     * Aqui estava `await lerArquivo(armazenamento, nome)` — um envelope lido do repositório,
     * um por PO, só para buscar `respostas.sujeitos`. E o resumo JÁ os tem: `resumoDoEnvelope`
     * os escreve desde que o índice passou a carregar os vínculos do PO (ver o bloco «O PO: é
     * dele que saem os VÍNCULOS»). Era trabalho pago duas vezes, e a segunda vez era a cara:
     * medido a 13/11/2026, a lista do plano de ensino lia **19 envelopes** e a do PO outros
     * **19** — 24 idas à API do GitHub por carga, ~7,5 s de espera para desenhar uma lista
     * cujos dados já estavam no índice.
     *
     * O RECURSO FICA. Um índice escrito antes de `sujeitos` existir não o tem, e uma lista que
     * perdesse o vínculo do PO em silêncio seria pior do que uma lista lenta: sem vínculo, o
     * selo «precisa de revisão» não aparece e a regra de proveniência mente. Por isso o arquivo
     * só é lido quando o resumo não traz o campo — e, quando o índice se reconstruir uma vez
     * (`VERSAO_DO_RESUMO`), este caminho deixa de ser usado por si. */
    let lista;
    if (Array.isArray(resumo.sujeitos)) {
      lista = resumo.sujeitos.map(String);
    } else {
      const envelope = await lerArquivo(armazenamento, nome);
      const bruto = envelope && envelope.respostas && envelope.respostas.sujeitos;
      const sujeitos = bruto ? (bruto.valor !== undefined ? bruto.valor : bruto) : null;
      lista = Array.isArray(sujeitos) ? sujeitos.map(String) : (sujeitos ? [String(sujeitos)] : []);
    }
    const quando = ordemDoRegisto(resumo);
    const novos = [];
    for (const aluna of lista) {
      const a = anamneseDe.get(aluna.trim());
      if (a && a.quando > quando) novos.push({ aluna: aluna.trim(), anamnese: a.id, quando: a.quando });
    }
    const plano = Array.isArray(resumo.plano) ? resumo.plano.map(String) : [];
    pos.push({ id, novos, plano });
    if (novos.length) {
      pendentes.set(id, {
        familia: 'po',
        motivo: novos.length === 1
          ? 'Há uma anamnese de ' + novos[0].aluna + ' mais recente do que este plano de observação ('
            + novos[0].quando + ').'
          : 'Há anamneses mais recentes do que este plano de observação: '
            + novos.map((n) => n.aluna + ' (' + n.quando + ')').join(', ') + '.',
        anamneses: novos,
      });
    }
  }

  /* 3. OS PLANOS dos POs pendentes — e o motivo deles diz o LUGAR na ordem, não o do vizinho.
   *
   * A primeira versão escrevia «o plano de observação precisa de revisão primeiro: …», que é o
   * contrário da regra. O plano é o PRIMEIRO; o que ele tem de dizer é que o PO vem depois. */
  for (const p of pos) {
    if (!pendentes.has(p.id)) continue;
    const doPo = pendentes.get(p.id);
    const quando = (doPo.anamneses || []).map((n) => n.quando).sort().pop() || '';
    for (const plano of p.plano) {
      if (pendentes.has(plano)) continue;
      pendentes.set(plano, {
        familia: 'plano',
        motivo: 'O retrato físico mais recente é de ' + quando + ', e este plano é anterior. '
          + 'Revalide ESTE plano PRIMEIRO; o plano de observação (' + p.id + ') vem depois, '
          + 'porque observa o que este plano fixou.',
        dependenteDe: p.id,
      });
    }
  }

  /* 4. AS LINHAS DE BASE — o PRIMEIRO passo da cascata (05/11/2026).
   *
   * A ORDEM, decidida por ela: **Produção (o recorte do corpo) → Plano de Ensino → Plano de
   * Observação**. E é uma ordem de DEPENDÊNCIA, não de arrumação de ecrã: o PO observa o que o
   * PE fixou, e o PE fixa um recorte do corpo. Revalidar o PO sobre um recorte decidido com
   * retratos que já não valem é consolidar uma linha de base sobre o que não se mediu. Por isso
   * o passo 1 vem primeiro, e só aparece quando há linhas de base — sem elas, a cascata é a de
   * antes, e é assim que as escolas que ainda não têm nenhuma não vêem um aviso que não podem
   * resolver.
   *
   * A REGRA É A MESMA DO PO, e é derivada: «há alguma anamnese mais recente do que a decisão
   * desta linha de base?». Nada se marca com um campo — um sinal que se esquece de apagar é um
   * sinal que mente, e um campo a limpar à mão é uma segunda declaração do mesmo facto.
   *
   * COMPARA-SE COM AS ANAMNESES DA ESCOLA, e não só com as da turma. A linha de base não
   * declara turma — é do professor, e pode servir a mais de uma («Nível 1 — mobilidade e
   * pés»). Recortar por turma exigiria uma curadoria que esta função não tem, e escolher uma
   * turma ao acaso daria um falso negativo — o pior dos dois erros: a linha de base pareceria
   * actual sobre um retrato que já mudou. Um falso positivo custa um clique ao professor.
   */
  const linhas = Array.isArray(linhasDeBase) ? linhasDeBase : [];
  if (linhas.length) {
    const retratos = [...anamneseDe.values()].map((d) => String(d.quando || '')).filter(Boolean).sort();
    const maisRecente = retratos.length ? retratos[retratos.length - 1] : null;
    for (const lb of linhas) {
      if (!lb || !lb.id) continue;
      const decidida = String(lb.atualizada_em || '').trim();
      if (!decidida || !maisRecente || maisRecente <= decidida) continue;
      pendentes.set('linha-de-base:' + lb.id, {
        familia: 'linha-de-base',
        motivo: 'Há uma anamnese mais recente (' + maisRecente.slice(0, 10) + ') do que a decisão '
          + 'desta linha de base (' + decidida.slice(0, 10) + ') — reavalie o recorte do corpo '
          + 'antes de revalidar o plano.',
        // O PRIMEIRO LUGAR é a Produção, e o motivo di-lo: o recorte do corpo é uma decisão da
        // Produção, e é lá que ele se refaz — não no formulário do plano.
        onde: 'producao',
        linha: lb.id,
        nome: lb.nome || lb.id,
        decisao: decidida,
        anamnese: maisRecente,
      });
    }
  }

  /* 4.5 A SALA MUDOU — o ritmo do plano é uma fotografia (09/11/2026).
   *
   * O DEFEITO QUE ISTO FECHA, e que estava declarado no §3.3 do `ARQUITETURA-GERAL.md`: o plano
   * declara a frequência, a duração, o calendário e o total de aulas — e esses quatro campos são
   * `daTurma` no conteúdo. Quando a Sala deriva um elo novo (horário, duração ou período mudou),
   * NADA marcava o plano: ele continuava a dizer o ritmo antigo no documento impresso, e o
   * professor não recebia o aviso que recebe quando é o ELENCO que muda. A assimetria tinha
   * nome: o elenco tem um sinal derivado (`recorte.elencoDiferente`); a Sala não tinha.
   *
   * A REGRA É A MESMA FORMA, e é derivada: compara-se o `vigenteDe` do elo da Sala com o
   * `gerado_em` do plano. Um elo posterior ao plano quer dizer «o plano foi decidido sobre um
   * ritmo que já não vale» — e é isso que se marca.
   *
   * A COMPARAÇÃO É POR DIA, e com `>` estrito: o elo da Sala só declara a DATA (não a hora), e
   * marcar o que foi decidido no mesmo dia seria marcar o trabalho que acabou de ser feito — a
   * cadeia automática deriva o plano no mesmo dia da mudança, e um sinal que nasce aceso sobre a
   * correção de hoje nunca se apagaria sozinho.
   *
   * SEM `vigenteDe` NÃO SE AFIRMA NADA: uma Sala que nunca derivou não declara desde quando
   * vale, e inventar uma data marcaria toda a escola antiga. Sem plano com turma declarada,
   * também não — a pergunta não tem sujeito.
   */
  const salasVigentes = (Array.isArray(salas) ? salas : [])
    .filter((t) => t && t.id && !t.substituidaPor && String(t.nome || '').trim());
  if (salasVigentes.length) {
    const salaPorNome = new Map(salasVigentes.map((t) => [String(t.nome).trim(), t]));
    for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, indice)) {
      const id = resumo.id || nome.replace(/\.json$/, '');
      if (pendentes.has(id)) continue;
      const turmaDoPlano = String(resumo.turma || '').trim();
      if (!turmaDoPlano) continue;
      const sala = salaPorNome.get(turmaDoPlano);
      if (!sala || !sala.vigenteDe) continue;
      const diaDaSala = String(sala.vigenteDe).slice(0, 10);
      const diaDoPlano = String(resumo.gerado_em || id).slice(0, 10);
      if (!diaDoPlano || diaDaSala <= diaDoPlano) continue;
      pendentes.set(id, {
        familia: 'plano',
        motivo: 'O ritmo da sala «' + turmaDoPlano + '» mudou em ' + diaDaSala + ' — depois deste '
          + 'plano (' + diaDoPlano + '). Revalide o plano de ensino: ele declara a frequência, a '
          + 'duração e o calendário da sala, e esses campos estão na fotografia de ' + diaDoPlano + '.',
        onde: 'porta',
        sala: { nome: turmaDoPlano, vigenteDe: diaDaSala },
      });
    }
  }

  /* 5. O ELENCO DA TURMA — o segundo passo, e o que a 05/11/2026 veio acrescentar.
   *
   * A pesquisadora: «tenho uma turma A com dez meninas, e há uma menina que não pode mais naquele
   * horário; ela precisa agora ir para a turma C. […] eu não vou fazer a edição lá na turma, também
   * não vou fazer na curadoria. Eu vou fazer a edição na linha de base, porque se eu trocar a
   * menina, ela vai com outras características para a turma.»
   *
   * O ELENCO NÃO É UMA LISTA DE PRESENÇA. É a composição de corpos que a turma vai observar — e
   * mexer nele muda o recorte que o plano de ensino fixa e o que o plano de observação mede. Por
   * isso a troca não é um ajuste local: é o começo de uma cascata, e a cascata é o OLHAR do
   * professor, não um botão que dispara tudo.
   *
   * A REGRA É DERIVADA, e é a mesma forma do resto desta função: comparam-se duas listas que já
   * existem — **o que a curadoria declara** (`alunas`) e **o que a turma tem hoje** (a união das
   * alunas das linhas de base enviadas para ela). Nada se marca com um campo; o sinal cai sozinho
   * quando a curadoria é gravada de novo com o elenco novo. Um campo a limpar à mão seria uma
   * segunda declaração do mesmo facto, e o primeiro gesto que o esquecesse de limpar faria o
   * «rever» mentir para sempre.
   *
   * SEM LINHA DE BASE ENVIADA NÃO SE AFIRMA NADA. Uma turma cujo elenco não vem de linha de base
   * nenhuma (a curadoria foi preenchida à mão) não tem derivado contra que comparar — e inventar
   * um «está vazio» marcaria toda a curadoria antiga para sempre.
   */
  const linhasEnviadas = linhas.filter((l) => l && l.id && String(l.turma || '').trim());
  const curadoriasVigentes = (Array.isArray(curadorias) ? curadorias : [])
    .filter((c) => c && c.id && !c.substituidaPor);
  const turmasComElencoPendente = new Set();
  /* A TURMA QUE ESCOLHEU O ELENCO (07/11/2026) — a comparação nova. O elenco declarado pela
   * Turma (`linhaDeBase`) é comparado com o que ela carimbou em `alunas`; se o elenco mudou, a
   * cascata abre-se a partir daí. A comparação antiga (por linha de base enviada para a sala)
   * continua a correr para as curadorias que ainda não declaram `linhaDeBase`. */
  for (const c of curadoriasVigentes) {
    if (!c || !c.linhaDeBase) continue;
    const elenco = linhas.find((l) => l && String(l.id) === String(c.linhaDeBase) && !l.apagada_em);
    if (!elenco) continue;
    const derivado = (Array.isArray(elenco.alunas) ? elenco.alunas : [])
      .map((a) => String(a == null ? '' : a).trim()).filter(Boolean);
    if (!derivado.length) continue;
    const diferenca = recorte.elencoDiferente(c.alunas, derivado);
    if (!diferenca.mudou) continue;
    const nome = String((Array.isArray(c.turmas) && c.turmas.length ? c.turmas[0] : c.turma) || '').trim();
    const partes = [];
    if (diferenca.saiu.length) partes.push('saiu ' + diferenca.saiu.join(', '));
    if (diferenca.entrou.length) partes.push('entrou ' + diferenca.entrou.join(', '));
    pendentes.set('curadoria:' + c.id, {
      familia: 'curadoria',
      motivo: 'O elenco da turma «' + nome + '» mudou — ' + partes.join('; ')
        + '. Reveja a turma: é dela que o plano de ensino e o plano de observação recebem '
        + 'quem observam.',
      onde: 'bastidores',
      curadoria: c.id,
      turma: nome,
      saiu: diferenca.saiu,
      entrou: diferenca.entrou,
    });
    if (nome) turmasComElencoPendente.add(nome);
  }
  if (linhasEnviadas.length && curadoriasVigentes.length) {
    for (const c of curadoriasVigentes) {
      // AS QUE JÁ DECLARAM ELENCO FORAM TRATADAS ACIMA — não se comparam duas vezes.
      if (c.linhaDeBase) continue;
      const turmasDaCuradoria = Array.isArray(c.turmas) && c.turmas.length
        ? c.turmas : (c.turma ? [c.turma] : []);
      for (const t of turmasDaCuradoria) {
        const nome = String(t || '').trim();
        if (!nome) continue;
        const derivado = recorte.elencoDaTurma(linhasEnviadas, nome);
        if (!derivado.length) continue;
        const diferenca = recorte.elencoDiferente(c.alunas, derivado);
        if (!diferenca.mudou) continue;
        const partes = [];
        if (diferenca.saiu.length) partes.push('saiu ' + diferenca.saiu.join(', '));
        if (diferenca.entrou.length) partes.push('entrou ' + diferenca.entrou.join(', '));
        pendentes.set('curadoria:' + c.id, {
          familia: 'curadoria',
          motivo: 'O elenco da turma «' + nome + '» mudou na linha de base — ' + partes.join('; ')
            + '. Reveja a curadoria: é dela que o plano de ensino e o plano de observação recebem '
            + 'quem observam.',
          onde: 'bastidores',
          curadoria: c.id,
          turma: nome,
          saiu: diferenca.saiu,
          entrou: diferenca.entrou,
        });
        turmasComElencoPendente.add(nome);
      }
    }
  }

  /* 6. E A CASCATA DESCE — da curadoria para o plano de ensino, e do plano para o PO.
   *
   * A ORDEM É DE DEPENDÊNCIA, e o motivo escrito di-lo em cada passo: a curadoria declara quem está
   * na turma; o plano de ensino fixa o que se ensina a esses corpos; o plano de observação mede o
   * que o plano fixou. Quem revalida o PO antes da curadoria está a consolidar uma observação sobre
   * um elenco que já não é o da turma.
   *
   * Nada aqui é automático, e é decisão dela: «a gente não vai deixar um botão automático que
   * dispara tudo em cadeia porque precisa do olhar do professor para tomar as decisões e as medidas
   * que ele julga pertinente». O que a função faz é dizer ONDE passar e EM QUE ORDEM — o gesto é
   * de quem ensina.
   */
  if (turmasComElencoPendente.size) {
    const planos = [];
    for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, indice)) {
      const id = resumo.id || nome.replace(/\.json$/, '');
      planos.push({ id, turma: String(resumo.turma || '').trim() });
    }
    const planosPendentes = new Set();
    for (const p of planos) {
      if (!p.turma || !turmasComElencoPendente.has(p.turma)) continue;
      if (!pendentes.has(p.id)) {
        pendentes.set(p.id, {
          familia: 'plano',
          motivo: 'O elenco da turma «' + p.turma + '» mudou na linha de base, e a curadoria '
            + 'ainda não foi revista. Reveja a CURADORIA primeiro; este plano vem depois, porque '
            + 'fixa o que se ensina a quem ela declara.',
          dependenteDe: 'curadoria',
          turma: p.turma,
        });
      }
      planosPendentes.add(p.id);
    }
    for (const p of pos) {
      if (pendentes.has(p.id)) continue;
      const planoPendente = (p.plano || []).find((id) => planosPendentes.has(id));
      if (!planoPendente) continue;
      pendentes.set(p.id, {
        familia: 'po',
        motivo: 'O elenco da turma mudou na linha de base. O plano de ensino (' + planoPendente
          + ') tem de ser revalidado primeiro — este plano de observação observa o que ele fixou.',
        dependenteDe: planoPendente,
      });
    }
  }

  return {
    pendentes,
    /* A ORDEM, dita uma vez para quem mostra: é a regra, não uma sugestão de arrumação. */
    ordem: linhas.length
      ? ['linha-de-base', 'curadoria', 'plano-de-ensino', 'plano-de-observacao']
      : ['plano-de-ensino', 'plano-de-observacao'],
    anamneses: Object.fromEntries([...anamneseDe.entries()].map(([a, d]) => [a, d.quando])),
  };
}

/** A chave de contexto do registo — `null` quando ele não se agrupa (campo identificador ausente). */
function chaveDoContexto(resumo, familia) {
  const doContexto = CONTEXTO_DO_REGISTO[familia];
  if (!doContexto) return null;
  const partes = doContexto(resumo || {});
  return Array.isArray(partes) ? partes.join('\u0000') : null;
}

/**
 * AS FAMÍLIAS QUE SE AGRUPAM PELA CADEIA, E NÃO PELO CAMPO (13/11/2026).
 *
 * O DEFEITO, medido no acervo do `calango` depois da correção de 12/11. Uma mesma cadeia de plano
 * com **18 elos**, alternando Pé Torto ↔ Redinha Rosa, aparecia na listagem como **cinco linhas**
 * na turma `Piano` — e o PO, igual. A pesquisadora: «a gente vai listar somente aquele mais recente
 * que é pertinente […] dois planos mesmo, que é o do pé torto e o da redinha».
 *
 * Por que cinco. `CONTEXTO_DO_REGISTO.plano` é `() => null` **de propósito** (dois documentos da
 * mesma turma e ciclo são dois documentos), portanto a fase «um por contexto» nunca se aplicava ao
 * plano; e a regra de 12/11 — «um sucessor que trocou de mãos não substitui nada» — impede o
 * escondimento em **toda** troca de autor. Sozinha, cada regra está certa; juntas, cada elo da
 * alternância ficava visível, e nasciam linhas **órfãs**: não são escondidas por um sucessor (o
 * sucessor é de outro autor) e não acumulam histórico próprio.
 *
 * A REGRA QUE PASSA A VALER: dentro de **cada cadeia** (a raiz dos `ajuste_de`), fica **o elo mais
 * recente de cada professor**; os outros são proveniência e contam em «N versões anteriores». A
 * cadeia é a identidade do documento — não o nome da turma, que muda no meio dela (os primeiros
 * elos deste caso são da `Rosa` e os últimos da `Piano`) —, e por isso o grupo é `raiz + professor`,
 * e não `turma + professor`.
 *
 * O que **não** muda: a exigência de 12/11 de o documento verdadeiro continuar à vista. O elo do
 * autor que **escreveu** é, na cadeia, o mais recente **daquele autor** — é ele que a regra guarda.
 */
const FAMILIAS_POR_CADEIA = new Set(['plano', 'po']);

/** A raiz de uma cadeia de `ajuste_de`, com memória e guarda de ciclo. `null` se não há cadeia. */
function raizDaCadeia(id, porId, memoria) {
  const memo = memoria || new Map();
  if (memo.has(id)) return memo.get(id);
  let atual = String(id);
  const vistos = new Set();
  for (;;) {
    if (vistos.has(atual)) { memo.set(String(id), null); return null; }  // ciclo: não se agrupa
    vistos.add(atual);
    const r = porId.get(atual);
    const pai = r && r.ajuste_de ? String(r.ajuste_de) : '';
    if (!pai || pai === atual || !porId.has(pai)) { memo.set(String(id), atual); return atual; }
    atual = pai;
  }
}

/** A chave de agrupamento de uma família que se agrupa pela cadeia: `raiz + professor`. */
function chaveDaCadeia(resumo, porId, memoria) {
  const professor = String((resumo && resumo.professor) || '').trim();
  if (!professor) return null;   // sem autor não se agrupa: agrupar juntaria autores num só
  const raiz = raizDaCadeia(String(resumo.id), porId, memoria);
  if (!raiz) return null;
  return raiz + '\u0000' + professor;
}

/** A ordem do registo: o `gerado_em` e, quando ele falta, o carimbo do próprio id. */
function ordemDoRegisto(resumo) {
  return String((resumo && (resumo.gerado_em || resumo.id)) || '');
}

/**
 * OS REGISTOS VIGENTES de uma família, e o histórico que cada um substituiu.
 *
 * `resumos` são os do índice (ou objetos com os mesmos campos: `id`, `fonte`, `escola`,
 * `professor`, `ciclo`, `ajuste_de`, `gerado_em`, e o identificador da família — `aluna`, `turma`
 * ou `plano`). Nada é lido do armazenamento: a regra é derivada de metadado, como todas as listas.
 */
function vigentesDaFamilia(resumos, familia) {
  const lista = (Array.isArray(resumos) ? resumos : []).filter((r) => r && r.id);
  const porId = new Map(lista.map((r) => [String(r.id), r]));

  /* UM SUCESSOR QUE TROCOU DE MÃOS NÃO SUBSTITUI NADA (12/11/2026).
   *
   * Um elo cujo autor não é o autor do seu `ajuste_de` não é «o mesmo documento, mais novo»: é um
   * documento que assina o texto de outro. Ele existe, e a listagem di-lo — mas não pode ESCONDER
   * o documento verdadeiro, que é o que a pesquisadora pediu que continuasse à vista: «continua
   * existindo na listagem o plano de ensino que pertence ao pé torto, porque foi ele que elaborou
   * […] e vai ficar com outra etiqueta». Com o sucessor inválido a substituir, o plano do Pé Torto
   * desaparecia na contagem de versões e a etiqueta `sem turma` nunca chegava a ver-se. */
  const autoresDiferem = (a, b) => {
    const autorDe = (r) => String((r && r.professor) || '').trim();
    const um = autorDe(a);
    const outro = autorDe(b);
    return Boolean(um && outro && um !== outro);
  };

  // 1. Quem tem SUCESSOR está substituído. Um id repetido no `ajuste_de` (duas tentativas irmãs)
  //    fica com o sucessor mais recente — é ele que a estante mostra.
  const substituidoPor = new Map();
  for (const r of lista) {
    const anterior = r.ajuste_de ? String(r.ajuste_de) : '';
    if (!anterior || anterior === String(r.id) || !porId.has(anterior)) continue;
    if (autoresDiferem(r, porId.get(anterior))) continue;
    const atual = substituidoPor.get(anterior);
    if (!atual || ordemDoRegisto(r) > ordemDoRegisto(porId.get(atual))) {
      substituidoPor.set(anterior, String(r.id));
    }
  }

  // 2. Do mais recente para o mais antigo: o primeiro de cada contexto fica, os outros são
  //    histórico. A ordem é a mesma que a listagem já usa (`gerado_em`, e o id a desempatar).
  const ordenados = lista.slice().sort((a, b) => {
    const oa = ordemDoRegisto(a);
    const ob = ordemDoRegisto(b);
    if (oa !== ob) return oa < ob ? 1 : -1;
    return String(a.id) < String(b.id) ? 1 : -1;
  });

  const vigenteDaChave = new Map();
  const escondido = new Map();      // id escondido → id que o substituiu (o DIRECT imediato)
  const vigentes = [];
  const guardar = (id, vigente) => {
    if (id === vigente) return;
    escondido.set(id, vigente);
  };
  /* A memória da raiz é do chamado — uma vez por família, não uma por registo (13/11/2026). */
  const raizes = new Map();
  const porCadeia = FAMILIAS_POR_CADEIA.has(familia);

  for (const r of ordenados) {
    const id = String(r.id);
    if (substituidoPor.has(id)) { guardar(id, substituidoPor.get(id)); continue; }
    const chave = porCadeia ? chaveDaCadeia(r, porId, raizes) : chaveDoContexto(r, familia);
    if (chave && vigenteDaChave.has(chave)) { guardar(id, vigenteDaChave.get(chave)); continue; }
    if (chave) vigenteDaChave.set(chave, id);
    vigentes.push(r);
  }

  // 3. O histórico resolve-se ATÉ AO VIGENTE FINAL: numa cadeia de três, os dois elos escondidos
  //    pertencem à mesma linha, e é essa linha que diz «2 versões anteriores guardadas».
  const historico = new Map();
  for (const [id, direto] of escondido) {
    let alvo = direto;
    let voltas = 0;
    while (escondido.has(alvo) && voltas <= escondido.size) { alvo = escondido.get(alvo); voltas += 1; }
    if (alvo === id) continue;   // um ciclo de `ajuste_de`: não se esconde nada por engano
    if (!historico.has(alvo)) historico.set(alvo, []);
    historico.get(alvo).push(id);
  }
  for (const ids of historico.values()) ids.sort();

  return { vigentes, historico };
}

/**
 * O ÍNDICE: o rol dos nomes dos envelopes, lido como UM arquivo.
 *
 * Devolve uma lista de nomes já normalizada (só strings, sem repetições). Se o índice ainda
 * não existe, ele é CONSTRUÍDO a partir de uma enumeração — e gravado, para a próxima leitura
 * não voltar a pagar. Quando a enumeração também falha (cota), a falha SOBE: uma lista vazia
 * por falha de leitura é indistinguível de «não há nada gravado», e essa leitura errada já
 * custou uma vez ao professor a impressão de ter perdido as fichas.
 */
async function lerIndice(armazenamento) {
  const cru = await armazenamento.ler(INDICE_DOS_ENVELOPES);
  const guardado = decodificarIndice(cru);

  if (cru !== null && !guardado.incompleto) return { nomes: guardado.nomes, resumos: guardado.resumos };

  // Índice ausente (escola anterior a esta mudança), incompleto (uma escrita não conseguiu
  // enumerar) ou de uma versão sem resumos: enumera UMA vez, completa o que falta — inclusive
  // o resumo de cada envelope, que exige lê-lo — e grava. É o único momento em que esse preço
  // é pago; a partir daí as listas não voltam a ler envelope nenhum.
  try {
    const listados = await enumerarEnvelopes(armazenamento);
    const nomes = unir(guardado.nomes, listados);
    /* Numa versão nova, os resumos antigos NÃO servem — ver `decodificarIndice`. */
    const resumos = guardado.versaoVelha ? {} : Object.assign({}, guardado.resumos);
    for (const nome of nomes) {
      if (resumos[nome]) continue;
      const envelope = await lerArquivo(armazenamento, nome);
      if (envelope) resumos[nome] = resumoDoEnvelope(envelope, nome);
    }
    await gravarIndice(armazenamento, nomes, resumos, false);
    return { nomes, resumos };
  } catch (erro) {
    // Sem índice E sem enumeração não há como responder: a falha sobe (uma lista vazia por
    // falha de leitura é indistinguível de «não há nada gravado»). Com índice incompleto,
    // responde-se o que se sabe — e a próxima leitura volta a tentar.
    if (cru === null) throw erro;
    return { nomes: guardado.nomes, resumos: guardado.resumos };
  }
}

/** A enumeração de recurso: as chaves do armazenamento. No KV, é o `kv.list` de cota diária. */
async function enumerarEnvelopes(armazenamento) {
  const chaves = await armazenamento.listar(PREFIXO_ENVELOPES);
  return chaves
    .map((chave) => chave.slice(PREFIXO_ENVELOPES.length))
    .filter((nome) => nome && nome.indexOf('.indice.json') === -1);
}

/**
 * O índice gravado → `{nomes, resumos, incompleto}`. Um índice ilegível é um índice vazio.
 *
 * UM ÍNDICE SEM RESUMOS É UM ÍNDICE INCOMPLETO (20/10/2026). A primeira versão do índice
 * guardava só os nomes, e as listas liam cada envelope para saber o que mostrar. Quem abrir
 * uma escola com o índice antigo paga UMA enumeração e UMA leitura por envelope — e nunca
 * mais. É o mesmo caminho da escola que ainda não tem índice.
 */
function decodificarIndice(cru) {
  if (cru === null || cru === undefined) return { nomes: [], resumos: {}, incompleto: true };
  try {
    const dados = JSON.parse(String(cru));
    if (Array.isArray(dados)) return { nomes: limparNomes(dados), resumos: {}, incompleto: true };
    const resumos = {};
    const guardados = (dados && dados.resumos) || {};
    for (const [nome, resumo] of Object.entries(guardados)) {
      if (resumo && typeof resumo === 'object') resumos[nome] = resumo;
    }
    /* A VERSÃO ANTIGA NÃO É O MESMO QUE «INCOMPLETO» (24/10/2026), e confundi-las deixava o
     * índice a mentir para sempre.
     *
     * `incompleto` significa «uma escrita não conseguiu enumerar»: o que está lá é bom, e falta
     * preencher o resto — por isso a reconstrução APROVEITA os resumos que existem.
     *
     * `versaoVelha` significa «os resumos que estão lá foram feitos por outra definição de
     * resumo». Aproveitá-los é guardar o dado velho: quando a versão 4 acrescentou `gerado_em`,
     * a reconstrução enumerou tudo, encontrou um resumo para cada nome, e não leu envelope
     * nenhum — a data continuou vazia, e o índice passou a jurar a versão 4 com o conteúdo da 3.
     * Quem apanhou isto foi a produção: as três anamneses da `batata` mostravam «—» na coluna
     * «Quando» depois do deploy.
     *
     * Numa versão nova, o resumo antigo é DESCARTADO e refaz-se de zero — que é exactamente o
     * preço que a `VERSAO_DO_RESUMO` existe para poder cobrar uma vez. */
    /* A VERSÃO **E** A FORMA. O número sozinho não serve — ver `CAMPOS_DO_RESUMO`: uma escrita
     * carimba a versão de hoje em resumos de ontem. Um resumo a que falte um campo da definição
     * actual é um resumo velho, e é isso que se detecta. */
    const semForma = Object.values(resumos).some((r) => !resumoCompleto(r));
    const versaoVelha = Number(dados && dados.versao) !== VERSAO_DO_RESUMO || semForma;
    return {
      nomes: limparNomes((dados && dados.nomes) || []),
      resumos,
      versaoVelha,
      incompleto: Boolean(dados && dados.incompleto) || versaoVelha,
    };
  } catch (erro) {
    return { nomes: [], resumos: {}, incompleto: true };
  }
}

function limparNomes(lista) {
  const limpos = [];
  for (const nome of lista) {
    if (typeof nome !== 'string' || nome === '') continue;
    if (limpos.indexOf(nome) === -1) limpos.push(nome);
  }
  return limpos;
}

function unir(a, b) {
  return limparNomes([].concat(a, b));
}

function corpoDoIndice(nomes, resumos, incompleto) {
  const limpos = limparNomes(nomes).sort();
  const corpo = { versao: VERSAO_DO_RESUMO, nomes: limpos, resumos: {} };
  // Só o resumo de quem ainda está no rol: um nome que saiu não deixa resumo para trás (o
  // índice cresceria sem limite, e a estante mostraria um registo que já não existe).
  for (const nome of limpos) {
    if (resumos && resumos[nome]) corpo.resumos[nome] = resumos[nome];
  }
  if (incompleto) corpo.incompleto = true;
  return JSON.stringify(corpo, null, 2) + '\n';
}

async function gravarIndice(armazenamento, nomes, resumos, incompleto, remover) {
  const aRemover = Array.isArray(remover) ? remover : [];
  // O ÍNDICE É UM CACHE, e um cache que não se pode gravar não derruba a leitura: um
  // armazenamento só-de-leitura (as bancadas de prova, um adaptador futuro) continua a
  // enumerar como antes. Os adaptadores de verdade — memória, disco, KV — têm `guardar`.
  if (typeof armazenamento.guardar !== 'function') return;

  // QUEM SABE GRAVAR COM RELEITURA GRAVA ASSIM (20/10/2026). No repositório, o índice é um
  // LER-MODIFICAR-GRAVAR: dois isolates a gravar ao mesmo tempo (dois professores, duas abas)
  // perderiam uma entrada se cada um escrevesse a sua lista por cima da do outro — e uma
  // entrada perdida é um registo invisível na estante. O `mutar` relê e reaplica a MESMA
  // lista sobre o que ganhou a corrida. O KV, que não o tem, grava por cima como sempre.
  if (typeof armazenamento.mutar === 'function') {
    let r = null;
    try {
      r = await armazenamento.mutar(INDICE_DOS_ENVELOPES, (atual) => {
      const lido = decodificarIndice(atual);
      // A lista que esta chamada quer gravar manda; o que veio de fora (outro isolate) e não
      // está nela é somado — é o que faltaria para a estante mostrar o registo do outro. E o
      // que esta chamada quer TIRAR sai, seja qual for a versão que ganhou a corrida: sem
      // isto, esquecer um nome seria desfeito pela soma da versão lida.
      const nomesFinais = unir(nomes, lido.incompleto ? [] : lido.nomes)
        .filter((nome) => aRemover.indexOf(nome) === -1);
      const resumosFinais = Object.assign({}, lido.resumos, resumos || {});
        const corpo = corpoDoIndice(nomesFinais, resumosFinais, incompleto);
        if (atual !== null && corpo === atual) return null;   // nada mudou: não se escreve
        return corpo;
      });
    } catch (erro) {
      r = null;   // sem acervo (sem token, sem escola) não há `mutar` a fazer
    }
    if (r && r.ok) return;
    // O `mutar` falhou (rede, 403, 409 persistente, acervo ausente): cai na escrita simples.
  }
  const finais = aRemover.length ? nomes.filter((nome) => aRemover.indexOf(nome) === -1) : nomes;
  // O ÍNDICE É UM CACHE: uma falha a escrevê-lo não derruba a operação que o mandou gravar (o
  // registo é o dado; o índice é só o rol dele). Quem lê sabe reconstruí-lo — é o que a
  // `lerIndice` faz quando ele está ausente ou incompleto.
  try {
    await armazenamento.guardar(INDICE_DOS_ENVELOPES, corpoDoIndice(finais, resumos, incompleto));
  } catch (erro) {
    // sem índice, a próxima leitura enumera e reconstrói
  }
}

/** Acrescenta um nome (e o resumo dele) ao índice. Chamado só por `gravarEnvelope`. */
async function registrarNoIndice(armazenamento, nome, envelope) {
  let nomes;
  let resumos = {};
  let incompleto = false;
  try {
    const indice = await lerIndice(armazenamento);
    nomes = indice.nomes;
    resumos = indice.resumos;
  } catch (erro) {
    // Gravar não pode depender de enumerar: o envelope é o dado, o índice é o rol dele.
    nomes = [];
    incompleto = true;
  }
  if (nomes.indexOf(nome) === -1) nomes.push(nome);
  if (envelope) resumos[nome] = resumoDoEnvelope(envelope, nome);
  await gravarIndice(armazenamento, nomes, resumos, incompleto);
}

/** Retira um nome do índice. Chamado só por `apagarEnvelope`. */
async function esquecerDoIndice(armazenamento, nome) {
  const indice = await lerIndice(armazenamento);
  const restantes = indice.nomes.filter((n) => n !== nome);
  // `remover` viaja para a mutação do índice: o nome tem de sair TAMBÉM se a versão que ganhou
  // a corrida ainda o tiver (é o caso da gravação que falhou depois de o índice já o citar).
  await gravarIndice(armazenamento, restantes, indice.resumos, false, [nome]);
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

/**
 * Grava o envelope — só quando o documento passou na validação.
 *
 * O ÍNDICE VEM PRIMEIRO (20/10/2026), e não é detalhe. O índice é o ROL dos nomes: se a gravação
 * do registro falhar depois de o índice já o citar, sobra um NOME ÓRFÃO — e quem lista salta os
 * nomes cujo arquivo não abre, portanto o órfão é inofensivo. Na ordem contrária, uma falha
 * deixaria o pior dos dois mundos: o registro gravado e invisível na estante.
 *
 * A FALHA DA GRAVAÇÃO É RESULTADO, NÃO EXCEPÇÃO. Desde que o envelope passou a viver no
 * repositório, gravar é uma chamada de rede que pode falhar; o professor tem de ler «não
 * gravou», com o motivo, e a memória do navegador segura o rascunho até a próxima tentativa.
 *
 * A CORRIDA DO CARIMBO (04/11/2026) — e por que o nome se resolve AQUI, e não em `identificar`.
 * O id de um envelope é um carimbo de minuto (`plano-20261104-1810`), e `identificar` o escolhe
 * perguntando ao armazenamento se o nome já existe. Entre essa pergunta e esta gravação há uma
 * janela: dois pedidos que perguntem antes de qualquer escrita recebem o MESMO nome, e o
 * segundo gravaria por cima do primeiro — os dois a responder «gravado», um documento a
 * desaparecer, nenhum erro. Medido em 04/11/2026, com dois `identificar` e duas gravações:
 * sobrava o segundo, e a estante mostrava um registo só.
 *
 * Quem fecha a janela é o armazenamento: `criar` grava só se a chave não existir, e a
 * existência é perguntada pelo próprio GitHub no instante da escrita (a gravação vai sem
 * `sha`, e a recusa 422 «"sha" wasn't supplied» é o «já existe»). Perdida a corrida, tenta-se
 * o sufixo seguinte — o mesmo `-2` que o `identificar` daria se a leitura tivesse visto a
 * outra escrita. O `documento.id` viaja junto: o id é o nome do arquivo E um campo do
 * envelope, e deixá-los divergir seria pior do que a corrida.
 */
const SUFIXOS_DA_CORRIDA = 5;

/**
 * A FUSÃO EM TEXTO — o que o adaptador chama quando o acervo mudou debaixo da edição.
 *
 * Ela mora aqui, e não no adaptador, porque a REGRA é do domínio: «campos diferentes unem, o
 * mesmo campo decide pela recência». O adaptador só sabe ler, gravar e repetir.
 */
function fundirTextosDeEnvelope(baseTexto, novoTexto, atualTexto) {
  let base = null;
  let minha = null;
  let atual = null;
  try { base = JSON.parse(baseTexto); } catch (e) { base = null; }
  try { minha = JSON.parse(novoTexto); } catch (e) { minha = null; }
  try { atual = JSON.parse(atualTexto); } catch (e) { atual = null; }
  if (!fusao.podeFundir(base, minha, atual, fusao.quandoDoEnvelope(minha))) {
    // Sem as três versões não se adivinha: fica o que o professor acabou de escrever. É o
    // comportamento de sempre, e é melhor do que uma fusão inventada sobre um JSON ilegível.
    return { texto: novoTexto, relato: { houveFusao: false, unidos: [], conflitos: [], semBase: true } };
  }
  const { documento, relato } = fusao.fundirEnvelopes({
    base,
    minha,
    atual,
    quandoMinha: fusao.quandoDoEnvelope(minha),
  });
  return { texto: JSON.stringify(documento, null, 2) + '\n', relato };
}

/** A mensagem do commit, que diz que houve fusão — o histórico é o que fica para quem audita. */
function mensagemDaEdicao(relatorio) {
  return 'feat(acervo): ' + relatorio.id + ' — edição';
}

/** O id com o sufixo da n-ésima tentativa: `plano-20261104-1810` → `…-2`. */
function comSufixoDaCorrida(id, n) {
  return id + '-' + n;
}

/**
 * O RESUMO DO NOME QUE A CORRIDA DEU A OUTRO. A entrada do índice já foi escrita com o NOSSO
 * documento antes de sabermos que o arquivo é de outro; o resumo passa a descrever o arquivo
 * que lá está — que é o dado —, e não o que tentámos gravar. O índice é projeção: quem manda é
 * o envelope.
 */
async function repararResumoDoIndice(armazenamento, nome) {
  const vencedor = await lerArquivo(armazenamento, nome);
  if (!vencedor) return false;
  await registrarNoIndice(armazenamento, nome, vencedor);
  return true;
}

/**
 * `opcoes.substituir` diz o que a gravação QUER, e não se adivinha:
 *
 *   · `true` (o omisso) — o id foi DADO, e o documento que lá está é este mesmo, numa versão
 *     anterior: a edição em sítio, a correção do erro de digitação. Grava por cima, como
 *     sempre gravou. É o omisso para nenhum chamador mudar de comportamento por esquecimento.
 *   · `false` — o id foi INVENTADO agora (`identificar`, um elo novo): ninguém revisou aquele
 *     nome, e se ele já estiver tomado é porque outro pedido o tomou. Aí sim vale a escrita
 *     condicional e o sufixo.
 */
async function gravarEnvelope(armazenamento, documento, relatorio, opcoes) {
  if (relatorio.errosDoDocumento.length) {
    return { ok: false, erro: 'o documento não passou na validação', linhas: linhasDoRelatorio(relatorio) };
  }
  // SEM `criar` NÃO HÁ COMO FECHAR A JANELA — e então grava-se como sempre se gravou. É o
  // caminho do armazenamento antigo (o KV), que não tem escrita condicional.
  const substituir = !opcoes || opcoes.substituir !== false;
  const condicional = !substituir && typeof armazenamento.criar === 'function';
  // A FUSÃO (decisão 84, 04/11/2026): quando o documento que já lá está NÃO é o que o professor
  // leu, há duas edições e elas são unificadas — e não escolhidas. Só a edição em sítio funde:
  // um elo novo é um documento novo, e não tem com o que se fundir.
  const baseDaFusao = opcoes && opcoes.base ? opcoes.base : null;
  const comFusao = substituir && baseDaFusao && typeof armazenamento.gravarComFusao === 'function';
  // O INSTANTE DESTA ESCRITA, ao milissegundo: é ele que a próxima fusão vai comparar. Vem do
  // chamador quando ele o fixa (a prova), senão do relógio.
  const instanteDaEscrita = (opcoes && opcoes.quando) || fusao.carimbarInstante();

  let id = relatorio.id;
  let linhas = linhasDoRelatorio(relatorio, ARQUIVO_DE(id));
  const tentativas = condicional ? SUFIXOS_DA_CORRIDA : 1;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const chave = ARQUIVO_DE(id);
    const corpo = Object.assign(
      {},
      documento,
      id === relatorio.id ? {} : { id },
      documento.escrito_em ? {} : { escrito_em: instanteDaEscrita },
    );

    try {
      await registrarNoIndice(armazenamento, id + '.json', corpo);
    } catch (erro) {
      // Sem índice o registro continua a valer: a leitura de um nome que não está no rol só
      // aparece na enumeração (que é a reconstrução). Gravar não depende de indexar.
    }

    try {
      const texto = JSON.stringify(corpo, null, 2) + '\n';
      // A EDIÇÃO COM FUSÃO VEM PRIMEIRO. Se o adaptador não a souber fazer, ele devolve
      // `{ semFusao: true }` e a gravação segue por baixo, como sempre — degradar, não rebentar.
      if (comFusao) {
        const baseTexto = typeof baseDaFusao === 'string'
          ? baseDaFusao
          : JSON.stringify(baseDaFusao, null, 2) + '\n';
        const fundido = await armazenamento.gravarComFusao(
          chave, baseTexto, texto, fundirTextosDeEnvelope, mensagemDaEdicao(relatorio),
        );
        if (fundido && fundido.ok) {
          return {
            ok: true,
            linhas,
            caminho: fundido.caminho || null,
            noArmazenamentoAntigo: false,
            id,
            fundido: fundido.fundido === true,
            relatoDaFusao: fundido.relato || null,
          };
        }
        if (!fundido || fundido.semFusao !== true) {
          return { ok: false, erro: (fundido && fundido.erro) || 'a gravação com fusão falhou', linhas };
        }
      }
      const r = condicional
        ? await armazenamento.criar(chave, texto)
        : await armazenamento.guardar(chave, texto);

      if (condicional && r && r.jaExiste) {
        // O NOME É DE OUTRO. Repõe-se o resumo dele no índice e tenta-se o sufixo seguinte.
        try { await repararResumoDoIndice(armazenamento, id + '.json'); } catch (e) { /* o índice se reconstrói */ }
        id = comSufixoDaCorrida(relatorio.id, tentativa + 1);
        linhas = linhasDoRelatorio(relatorio, ARQUIVO_DE(id));
        continue;
      }
      if (condicional && r && r.criado === false && r.erro) throw new Error(r.erro);

      // O CAMINHO ONDE O REGISTO FICOU, quando o armazenamento o sabe (o acervo sabe: é o
      // repositório). Quem mostra ao professor tem de mostrar o endereço que existe: o carimbo
      // sozinho é um nome, e um nome não se procura.
      const caminho = r && typeof r === 'object' ? (r.caminho || null) : null;
      const antigo = r && typeof r === 'object' ? r.noArmazenamentoAntigo === true : false;
      return { ok: true, linhas, caminho, noArmazenamentoAntigo: antigo, id };
    } catch (erro) {
      // O nome ficou órfão no índice; tira-se, sem que a falha da limpeza esconda a de origem.
      try { await esquecerDoIndice(armazenamento, id + '.json'); } catch (e) { /* já falhou o que importa */ }
      return { ok: false, erro: (erro && erro.message) || String(erro), linhas };
    }
  }
  return {
    ok: false,
    erro: 'a corrida do carimbo não deu um nome livre depois de ' + SUFIXOS_DA_CORRIDA +
      ' tentativas — outro pedido está a gravar o mesmo minuto',
    linhas,
  };
}

/** Apaga um envelope; `false` se não existia. */
async function apagarEnvelope(armazenamento, id) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return false;
  const existia = await armazenamento.apagar(ARQUIVO_DE(id));
  if (existia) await esquecerDoIndice(armazenamento, id + '.json');
  return existia;
}

/*
 * O VÍNCULO (a regra de proveniência): uma anamnese é VINCULADA quando um PO
 * selecionou o sujeito no nó `sujeitos`. É DERIVADO — varre-se os envelopes de
 * PO e vê-se quem declara o apelido; não se grava nada na anamnese.
 */
/**
 * O ELENCO QUE A TURMA ESCOLHEU (07/11/2026) — a fonte nova do vínculo.
 *
 * A TURMA (antiga curadoria) declara `linhaDeBase`: o id do elenco que aquela sala recebe. A
 * função procura a curadoria vigente que cobre a sala (e, quando indicado, o professor) e devolve
 * a linha de base correspondente, se ela ainda existir e não estiver apagada. `null` quando a
 * Turma não declarou elenco — e aí quem chama usa as fontes antigas, por ordem.
 */
function elencoEscolhidoPelaTurma(curadorias, turma, professor, linhas) {
  const alvo = String(turma || '').trim();
  const prof = String(professor || '').trim();
  if (!alvo) return null;
  const vigentes = (Array.isArray(curadorias) ? curadorias : [])
    .filter((c) => c && !c.substituidaPor && c.linhaDeBase);
  const daTurma = vigentes.find((c) => {
    if (prof && String(c.professor || '').trim() !== prof) return false;
    const nomes = Array.isArray(c.turmas) && c.turmas.length
      ? c.turmas.map((t) => String(t == null ? '' : t).trim())
      : [String(c.turma == null ? '' : c.turma).trim()];
    return nomes.indexOf(alvo) !== -1;
  });
  if (!daTurma) return null;
  return (Array.isArray(linhas) ? linhas : [])
    .find((l) => l && String(l.id) === String(daTurma.linhaDeBase) && !l.apagada_em) || null;
}

/*
 * QUEM ESTÁ NUMA TURMA — e por que isto não é a mesma pergunta do `daCuradoria` (20/10/2026).
 *
 * A ANAMNESE NÃO SABE DE TURMA. O conteúdo dela o declara em `oQueFicaFora`: «os nove blocos e
 * os módulos condicionais não decidem para que turma a aluna vai». Quem declara é a CURADORIA da
 * direção — `{professor, turmas[], alunas[]}` —, e ela declara as duas coisas juntas: aquela
 * professora, naquela turma, observa aquelas alunas.
 *
 * O DEFEITO QUE ISTO CORRIGE. O nó `sujeitos` do PO oferecia `api/anamneses`, que é a lista de
 * TODAS as anamneses da escola. Com três turmas e três alunas — uma por turma —, o Plano de
 * Observação da turma 1 oferecia as três, e nada impedia marcar a aluna da turma 2. A tela
 * filtrava por `daCuradoria('alunas')`, que é a UNIÃO de todas as curadorias daquele professor:
 * com três turmas, a união é sempre «todas», e o filtro que existia não filtrava nada. O recorte
 * tem de ser por TURMA, não por professor.
 *
 * Sem turma não há recorte (`null`) — quem chama decide o que fazer. Turma sem curadoria devolve
 * lista VAZIA, e não «todas»: a ausência de atribuição não é permissão. É o lado seguro do
 * vazamento, e a mesma escolha do `alunaVinculadaA` do `bastidores.js`.
 *
 * ============================================================================================
 * A FONTE DO ELENCO MUDOU A 05/11/2026 — e é esta a terceira correcção da mesma pergunta.
 *
 * A 05/11/2026 o passo 5 da linha de base passou a ser o acto que declara o elenco: «estas
 * alunas, com este recorte, foram para esta turma neste dia». A curadoria deixou de o declarar —
 * ela declara a ATRIBUIÇÃO (que professor, que turma), e o elenco lê-se de lá
 * (`/api/bastidores/alunas-da-turma`). A decisão de 03/11 explica porque não se pôs `alunas` na
 * turma: «a turma é o ritmo e nada mais», e o vínculo é um facto datado que mora no registo do
 * acto.
 *
 * O QUE ISSO PARTIU, MEDIDO EM PRODUÇÃO A 05/11/2026. Em `calango`, `curadorias` está VAZIO e há
 * uma linha de base («teste») enviada para «Balé Nível 1 — Teste 1» com a Aluna A e a Aluna B. O
 * `alunas-da-turma` devolvia as duas; esta função devolvia `[]`, e o nó `sujeitos` do PO oferecia
 * ZERO alunas a um professor que tinha tudo feito. A lista não estava a esconder as alunas: estava
 * a perguntar a uma fonte que já não é a dona do facto.
 *
 * POR ISSO A LINHA DE BASE VEM PRIMEIRO. `linhas` é a lista das linhas de base da escola; quando
 * existe uma enviada para esta turma, o elenco é o dela, e a curadoria não é consultada — duas
 * fontes do mesmo facto divergiriam, e a que ficasse para trás seria esta.
 *
 * A CURADORIA FICA COMO RECURSO, e é declarado: enquanto uma escola não mandar nenhuma linha de
 * base para uma turma, o elenco continua a poder vir da curadoria. Sem esse recurso, a resposta
 * seria `[]` — e um PO que ficou vazio sem explicação parece um defeito do sistema. Quem chama
 * pode dizer de onde veio (`fonteDoElenco`), e é o que a rota faz.
 */
function alunasDaTurma(curadorias, alvo, linhas) {
  const turma = String((alvo && alvo.turma) || '').trim();
  if (!turma) return null;
  /* A TURMA ESCOLHE O ELENCO (07/11/2026) — E ESSA É A PRIMEIRA FONTE.
   *
   * Com a nomenclatura nova, a SALA é o ritmo e o ELENCO é o corpo; a TURMA (antiga curadoria)
   * declara qual elenco a sala recebe. A leitura passa a ser, por ordem: (1) o elenco que a
   * turma escolheu; (2) a linha de base enviada para a sala (o fluxo antigo, que continua a
   * ler-se); (3) a curadoria como recurso. A ordem importa: se houver um elenco escolhido, é ele
   * que manda — e as duas fontes antigas só respondem quando a nova não tem resposta. */
  if (Array.isArray(curadorias) && Array.isArray(linhas)) {
    const escolhido = elencoEscolhidoPelaTurma(curadorias, turma, (alvo && alvo.professor) || '', linhas);
    if (escolhido) {
      return (Array.isArray(escolhido.alunas) ? escolhido.alunas : [])
        .map((a) => String(a == null ? '' : a).trim()).filter(Boolean);
    }
  }
  /* A LINHA DE BASE, QUANDO ELA EXISTE. `elencoDaTurma` é a MESMA leitura que
   * `/api/bastidores/alunas-da-turma` usa para dizer à curadoria quem a turma recebeu: uma
   * segunda derivação do mesmo facto divergiria da primeira. */
  if (Array.isArray(linhas)) {
    const doElenco = recorte.elencoDaTurma(linhas, turma);
    if (doElenco.length) return doElenco;
  }
  const professor = String((alvo && alvo.professor) || '').trim();
  const vistas = new Set();
  for (const c of Array.isArray(curadorias) ? curadorias : []) {
    if (!c || c.substituidaPor) continue;
    if (professor && String(c.professor || '').trim() !== professor) continue;
    // Os DOIS formatos do registo: `turmas` (lista, o actual) e `turma` (nome, o antigo).
    const daCuradoria = Array.isArray(c.turmas) && c.turmas.length
      ? c.turmas.map((t) => String(t == null ? '' : t).trim())
      : [String(c.turma == null ? '' : c.turma).trim()];
    if (daCuradoria.indexOf(turma) === -1) continue;
    for (const a of Array.isArray(c.alunas) ? c.alunas : []) {
      const nome = String(a == null ? '' : a).trim();
      if (nome) vistas.add(nome);
    }
  }
  return [...vistas];
}

/**
 * AS ALUNAS DE UM PROFESSOR — o recorte possível quando o PO ainda não tem plano escolhido.
 *
 * O nó `sujeitos` pode ser aberto ANTES do `plano-de-ensino`, e sem turma a rota devolveria a
 * escola inteira. O que autoriza é a PESSOA, e a ausência de atribuição devolve lista vazia — a
 * mesma escolha do lado seguro de `alunasDaTurma` («não atribuído» não é «todos»).
 *
 * DESDE 05/11/2026 A FONTE É A LINHA DE BASE, e não a curadoria — pela mesma razão que a função
 * acima: o passo 5 da linha de base é o acto que declara o elenco, e a curadoria passou a declarar
 * só a atribuição. Uma aluna cuja linha de base ainda não existe NÃO ENTRA: a regra da
 * pesquisadora é explícita («as alunas só podem ser selecionadas no plano de observação quando já
 * tiverem a linha de base»), e é ela que fecha a ordem do processo — primeiro a anamnese, depois a
 * linha de base, só então a observação. Um PO que se pudesse escrever antes disso estaria a
 * observar um corpo que ninguém leu.
 *
 * A CURADORIA CONTINUA COMO RECURSO, e pelo mesmo motivo declarado em `alunasDaTurma`: uma escola
 * que nunca mandou uma linha de base para uma turma não pode ficar com o PO vazio sem explicação.
 */
function alunasDoProfessor(curadorias, professor, linhas) {
  const alvo = String(professor || '').trim();
  if (!alvo) return null;
  const vistas = new Set();
  if (Array.isArray(linhas)) {
    for (const l of linhas) {
      if (!l || !l.id) continue;
      // A linha de base é DO PROFESSOR que a fez — e a leitura atravessa os professores de
      // propósito («quem assume lê o que estava antes»), mas o ELENCO de um PO é de quem observa.
      if (String(l.professor || '').trim() !== alvo) continue;
      for (const a of Array.isArray(l.alunas) ? l.alunas : []) {
        const nome = String(a == null ? '' : a).trim();
        if (nome) vistas.add(nome);
      }
    }
    if (vistas.size) return [...vistas];
  }
  for (const c of Array.isArray(curadorias) ? curadorias : []) {
    if (!c || c.substituidaPor) continue;
    if (String(c.professor || '').trim() !== alvo) continue;
    for (const a of Array.isArray(c.alunas) ? c.alunas : []) {
      const nome = String(a == null ? '' : a).trim();
      if (nome) vistas.add(nome);
    }
  }
  return [...vistas];
}

/**
 * AS ALUNAS DA ANAMNESE — a regra MISTA (23/10/2026, decisão da pesquisadora).
 *
 * A ANAMNESE TEM DOIS PAPÉIS, e a lista tem de servir os dois:
 *
 *   · para a aluna **matriculada** — a que já está numa curadoria —, a anamnese é o registo
 *     inicial de quem já tem professor e turma. Quem a faz é o professor dela: ele conhece a
 *     aluna, e a observação fica melhor cuidada. Uma aluna curada a OUTRO professor não entra
 *     nesta lista — a autorização é a curadoria, e ela é declarada, não deduzida (P-16).
 *   · para a aluna **nova** — a que ainda não está em curadoria nenhuma —, a anamnese é o
 *     INSTRUMENTO DE ENTRADA: é dela que saem as evidências para decidir a turma («esta aluna
 *     vai para a X e não para a Y»), e por isso qualquer professor da escola a pode fazer.
 *     Travá-la seria travar a porta da escola.
 *
 * «NOVA» É DERIVADO, E NÃO UM CAMPO. Uma aluna é nova enquanto não estiver em curadoria
 * vigente nenhuma; no dia em que a direção a cura, deixa de o ser — e nada mudou no cadastro
 * dela. É a mesma lei do estado da aula: o que se pode derivar não se declara, senão há dois
 * sítios a discordar. E, desde 26/10/2026, também deixa de ser nova quando já tem anamnese
 * registada: a marca é o aviso de quem ainda falta entrevistar.
 *
 * O que a função devolve são as duas coisas que a tela precisa: a lista recortada (`alunas`) e
 * as que levam a marca (`novas`). A marca é da TELA, não do registo: o apelido que entra no
 * envelope é o nome limpo.
 *
 * `comAnamnese` — os apelidos que já têm anamnese, lidos pelo servidor. Sem o conjunto, a marca
 * fica como estava; a função é pura e não vai ao acervo.
 */
function alunasDaAnamnese(curadorias, professor, todas, pedida, comAnamnese) {
  const alvo = String(professor || '').trim();
  const cadastro = (Array.isArray(todas) ? todas : [])
    .map((a) => String(a == null ? '' : a).trim()).filter(Boolean);
  const vigentes = (Array.isArray(curadorias) ? curadorias : []).filter((c) => c && !c.substituidaPor);
  const emAlguma = new Set();
  for (const c of vigentes) {
    for (const a of Array.isArray(c.alunas) ? c.alunas : []) {
      const nome = String(a == null ? '' : a).trim();
      if (nome) emAlguma.add(nome);
    }
  }
  const doProfessor = new Set(alunasDoProfessor(vigentes, alvo) || []);
  let alunas = cadastro.filter((a) => doProfessor.has(a) || !emAlguma.has(a));
  let novas = alunas.filter((a) => !emAlguma.has(a));
  /* A ALUNA QUE VEM NO ENDEREÇO (o `?aluna=` do atalho do PO). Ela só entra se NÃO estiver no
     cadastro — é o caso do comentário original («aluna ainda não cadastrada na Produção»), e é
     o único em que a linha do servidor não pode decidir sozinha: quem não está no cadastro não
     está em curadoria nenhuma, logo não há autorização a invocar nem a negar.
     Se ela ESTIVER no cadastro e não for autorizada, não entra — e é aqui, no servidor, que
     isso se decide. O cliente já não re-acrescenta nada: quando tinha essa linha, o valor
     anterior do campo e o `?aluna=` entravam por cima do filtro (o defeito de 23/10/2026). */
  const doEndereco = String(pedida == null ? '' : pedida).trim();
  if (doEndereco && cadastro.indexOf(doEndereco) === -1 && alunas.indexOf(doEndereco) === -1) {
    alunas = alunas.concat([doEndereco]);
    novas = novas.concat([doEndereco]);
  }
  /* A MARCA «NOVA» SAI QUANDO A ANAMNESE JÁ EXISTE (26/10/2026) — e a LISTA não.
   *
   * A pesquisadora viu a Aluna A continuar marcada «— nova» depois de a anamnese dela ficar
   * pronta, e esperava que ela saísse da lista. Sai só a marca: a aluna tem de continuar
   * alcançável, senão voltar a mexer no que já foi respondido passaria a depender de outro ecrã.
   * O aviso quer dizer «ainda não foi entrevistada», e deixa de ser verdade no instante em que há
   * registo. Fica DEPOIS do `doEndereco` de propósito: a aluna que veio no endereço e já tem
   * anamnese também não leva a marca.
   */
  const entrevistadas = new Set((comAnamnese instanceof Set
    ? [...comAnamnese]
    : (Array.isArray(comAnamnese) ? comAnamnese : []))
    .map((a) => String(a == null ? '' : a).trim()).filter(Boolean));
  if (entrevistadas.size) {
    novas = novas.filter((a) => !entrevistadas.has(a));
  }
  return { alunas, novas };
}

/*
 * QUEM OBSERVA QUEM — e o elenco manda (08/11/2026).
 *
 * O DEFEITO, medido na `batata`. Ela incluiu a Aluna B no elenco da turma `tami` (a linha de base
 * da sala rosa, de 01:05) DEPOIS de o Plano de Observação estar gravado (`po-…-2211`, de 22:11 da
 * véspera). O documento derivado passou a observar as duas — o `## Sujeitos` diz «Aluna A · Aluna
 * B», e a §6 da Aula mostra as duas. A anamnese da Aluna B, porém, continuou marcada «livre», com
 * os botões «editar» e «apagar» a funcionar, e as rotas responderam 200 a apagá-la. Uma aluna que
 * está a ser observada podia ter o registo reescrito ou apagado: é a violação mais grave que esta
 * camada existe para impedir.
 *
 * A CAUSA é uma única: este vínculo derivava de `po.sujeitos` e só de `po.sujeitos`. Ora, o PO
 * **herda** o elenco e guarda-o como o leu no dia em que foi gravado — e quando o elenco cresce
 * depois, a cópia fica para trás. A casa já decidiu, duas vezes, qual é a autoridade:
 *
 *   · `elencoDoCiclo` (06/11/2026, §5.20/§5.21 do ARQUITETURA-GERAL): «O PO declara sujeitos, mas
 *     quem diz quem está na turma é o acto do passo 2 da linha de base; o PO herda-a, e quando
 *     herda mal — envelope anterior à regra, gravação antiga — é a linha de base que está certa.»
 *   · `alunasDaTurma` (05/11/2026): o elenco lê-se da linha de base, e a curadoria é recurso.
 *
 * Era o mesmo defeito, num terceiro sítio — e é o terceiro sítio que este comentário fecha.
 *
 * A REGRA, e é uma só: uma aluna está vinculada quando **o elenco da turma que o PO observa** a
 * inclui, ou quando o PO a declara em `sujeitos`. As duas fontes SOMAM-SE, e a soma é deliberada:
 * o `sujeitos` é o registo do dia (proveniência — não se reescreve) e o elenco é o presente. Quem
 * sai do elenco continua vinculada porque o PO a observou; um cadeado que se abre quando uma das
 * duas fontes esquece um nome não é cadeado.
 *
 * O `elenco` CHEGA DE FORA, e não é lido aqui: a linha de base mora no repositório, e o núcleo não
 * faz I/O que a ponte não declare. Quem chama passa `{ linhas, curadorias }` — o que já tem em
 * mãos para o resto do pedido. SEM ele, a derivação é a de antes (`sujeitos`), e é o que mantém a
 * leitura de pé nas escolas que ainda não têm linha de base nenhuma.
 */
async function vinculos(armazenamento, jaLido, elenco) {
  const por = new Map();
  const juntar = (apelido, carimbo) => {
    const nome = String(apelido == null ? '' : apelido).trim();
    if (!nome) return;
    if (!por.has(nome)) por.set(nome, []);
    if (por.get(nome).indexOf(carimbo) === -1) por.get(nome).push(carimbo);
  };
  // Do ÍNDICE: o resumo de cada PO já traz os sujeitos que ele declarou. Antes esta função lia
  // TODOS os envelopes de PO para colher uma lista de nomes — e cada lista de anamnese a
  // chamava outra vez (20/10/2026).
  const pos = await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/, jaLido);

  /* A TURMA DE CADA PLANO, também do índice — e não do envelope. O PO não guarda a turma (ela é
   * LEITURA do plano, é o que a tela diz); quem a guarda no resumo é o plano. Uma leitura do
   * índice serve os dois, e nenhum envelope é aberto. */
  const linhas = elenco && Array.isArray(elenco.linhas) ? elenco.linhas : null;
  const curadorias = elenco && Array.isArray(elenco.curadorias) ? elenco.curadorias : [];
  let turmaDoPlano = null;
  if (linhas) {
    turmaDoPlano = new Map();
    for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, jaLido)) {
      const id = resumo.id || nome.replace(/\.json$/, '');
      const turma = String(resumo.turma || '').trim();
      if (turma) turmaDoPlano.set(String(id), turma);
    }
  }

  for (const { nome, resumo } of pos) {
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    for (const apelido of resumo.sujeitos || []) juntar(apelido, carimbo);
    if (!turmaDoPlano) continue;
    /* O ELENCO DA TURMA QUE ELE OBSERVA. Um PO pode declarar mais de um plano (a mesma observação
     * sobre duas turmas); cada plano traz a sua turma, e o elenco de cada uma entra. */
    for (const planoId of resumo.plano || []) {
      const turma = turmaDoPlano.get(String(planoId));
      if (!turma) continue;
      const daTurma = alunasDaTurma(curadorias, { turma, professor: resumo.professor || '' }, linhas) || [];
      for (const apelido of daTurma) juntar(apelido, carimbo);
    }
  }
  return por;
}

/*
 * O PLANO DE OBSERVAÇÃO PRIMÁRIO — o único que pode existir para um plano de ensino.
 *
 * O PO declara a LINHA DE BASE dos sujeitos (P-10), e uma linha de base não tem duas versões
 * do mesmo momento: a segunda não seria uma observação nova, seria a primeira reescrita por
 * outro caminho. Enquanto o PO não foi usado, corrigi-lo é reescrever o MESMO carimbo
 * (`corpo.id`); depois disso, mudá-lo é derivar um elo novo (`ajuste_de` + motivo).
 *
 * O que existia até 22/10/2026 era o silêncio: nenhuma regra, em nenhum documento, dizia
 * «um PO por ciclo». Cada «Guardar» nascia com carimbo novo, o `-po.md` era SOBRESCRITO (é a
 * única fonte que se atualiza em sítio) e as fontes derivadas ficavam a descrever o PO
 * anterior. A escola `batata` ficou com `po-20261022-1039` e `po-20261022-1108` — mesmo plano,
 * mesma turma, `ajuste_de: null` nos dois —, indistinguíveis na tela e no repositório.
 *
 * A busca é pelo PLANO que o PO referencia (o nó `plano-de-ensino`), que é a chave verdadeira:
 * é ele que diz de que plano a linha de base é. Só quando o PO não declara plano — o caso em
 * que a rota cai no «plano mais recente do mesmo contexto» — se procura pelo escopo.
 */
async function poPrimarioDoPlano(armazenamento, planoId, jaLido) {
  if (!planoId) return null;
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/, jaLido)) {
    if (resumo.ajuste_de) continue;                    // derivado: é elo, não o primário
    if ((resumo.plano || []).indexOf(planoId) === -1) continue;
    return resumo.id || nome.replace(/\.json$/, '');
  }
  return null;
}

/** O PO primário pelo ESCOPO (escola · professor · ciclo) — só quando o PO não declara plano. */
async function poPrimarioDoEscopo(armazenamento, contexto, jaLido) {
  const ctx = contexto || {};
  const escola = String(ctx.escola || '');
  const professor = String(ctx.professor || '');
  const ciclo = String(ctx.ciclo || '');
  if (!escola || !ciclo) return null;
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/, jaLido)) {
    if (resumo.ajuste_de) continue;
    if (String(resumo.escola || '') !== escola) continue;
    if (String(resumo.ciclo || '') !== ciclo) continue;
    if (professor && String(resumo.professor || '') !== professor) continue;
    return resumo.id || nome.replace(/\.json$/, '');
  }
  return null;
}

/*
 * A CADEIA DO PLANO, E O PO QUE A ACOMPANHA (04/11/2026).
 *
 * O QUE ACONTECEU. A pesquisadora entrou para corrigir a proporção do bloco Expressão no plano
 * de ensino, e o «Guardar» fez o que a proveniência manda: criou um **elo novo**
 * (`plano-20261104-1732`, com `ajuste_de: plano-20261103-2200`). Do lado dela foi um ajuste; do
 * lado do sistema nasceu um segundo plano — e o PO continuou a observar o PRIMEIRO. O plano novo
 * apareceu na estante como «livre», o PO continuou «ligado» ao antigo, e a aula continuou a ler a
 * proporção de antes. A cadeia tinha dois elos e nenhum elo entre eles.
 *
 * A REGRA, e é de leitura: o PO observa **o plano que vale**, e o que vale é o topo da cadeia. Duas
 * funções, as duas derivadas do `ajuste_de` — nenhuma grava nada:
 *
 *   · `planosDaCadeia` sobe e desce a cadeia de um plano de ensino (o ancestral e os sucessores);
 *   · `planoVigenteDaCadeia` devolve o topo — o que não foi substituído por ninguém.
 *
 * `poDoPlano` procura o PO **vigente** que observa qualquer elo da cadeia. É ele que a rota usa
 * para dizer «o PO daquele plano é este», e é ele que o ajuste em cadeia tem de derivar.
 */
async function planosDaCadeia(armazenamento, planoId, jaLido) {
  const alvo = String(planoId || '').trim();
  if (!alvo) return [];
  const resumos = (await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, jaLido))
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }));
  const porId = new Map(resumos.map((r) => [String(r.id), r]));
  const vistos = new Set([alvo]);
  const fila = [alvo];
  while (fila.length) {
    const atual = fila.shift();
    const registro = porId.get(atual);
    // Para cima: o pai declarado. Para baixo: quem declara este como pai.
    const vizinhos = [registro && registro.ajuste_de]
      .concat(resumos.filter((r) => String(r.ajuste_de || '') === atual).map((r) => r.id))
      .filter(Boolean).map(String);
    for (const v of vizinhos) {
      if (vistos.has(v)) continue;
      vistos.add(v);
      fila.push(v);
    }
  }
  return [...vistos].filter((id) => porId.has(id));
}

/** O TOPO da cadeia de um plano — o que nenhum sucessor substituiu. Devolve o id, ou o próprio. */
async function planoVigenteDaCadeia(armazenamento, planoId, jaLido) {
  const alvo = String(planoId || '').trim();
  if (!alvo) return null;
  const resumos = (await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, jaLido))
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }));
  const temSucessor = new Set(resumos.map((r) => String(r.ajuste_de || '')).filter(Boolean));
  const daCadeia = new Set(await planosDaCadeia(armazenamento, alvo, jaLido));
  const tops = resumos.filter((r) => daCadeia.has(String(r.id)) && !temSucessor.has(String(r.id)));
  if (!tops.length) return alvo;
  // Mais de um topo só acontece com irmãos (duas ramificações da mesma origem): fica o mais novo.
  tops.sort((a, b) => {
    const oa = String(a.gerado_em || a.id);
    const ob = String(b.gerado_em || b.id);
    return oa === ob ? (String(a.id) < String(b.id) ? 1 : -1) : (oa < ob ? 1 : -1);
  });
  return String(tops[0].id);
}

/**
 * O PO VIGENTE de um plano de ensino — o que observa qualquer elo da cadeia e não foi, ele
 * próprio, substituído. `null` quando nenhum PO observa aquele plano.
 */
async function poDoPlano(armazenamento, planoId) {
  const alvo = String(planoId || '').trim();
  if (!alvo) return null;
  const daCadeia = new Set(await planosDaCadeia(armazenamento, alvo));
  const pos = (await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/))
    .map(({ nome, resumo }) => Object.assign({}, resumo, { id: resumo.id || nome.replace(/\.json$/, '') }))
    .filter((r) => (r.plano || []).some((p) => daCadeia.has(String(p))));
  if (!pos.length) return null;
  const substituidos = new Set(pos.map((r) => String(r.ajuste_de || '')).filter(Boolean));
  const vigentes = pos.filter((r) => !substituidos.has(String(r.id)));
  const lista = vigentes.length ? vigentes : pos;
  lista.sort((a, b) => {
    const oa = String(a.gerado_em || a.id);
    const ob = String(b.gerado_em || b.id);
    return oa === ob ? (String(a.id) < String(b.id) ? 1 : -1) : (oa < ob ? 1 : -1);
  });
  return String(lista[0].id);
}

/*
 * O VÍNCULO do PLANO — o PO referencia o plano no nó `plano-de-ensino` (o id do
 * envelope). É DERIVADO, como o da anamnese: varre-se os envelopes de PO e vê-se
 * quem declara qual plano; não se grava nada no plano.
 */
async function vinculosDePlano(armazenamento, jaLido) {
  const por = new Map();
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/, jaLido)) {
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    for (const planoId of resumo.plano || []) {
      if (!planoId) continue;
      if (!por.has(planoId)) por.set(planoId, []);
      por.get(planoId).push(carimbo);
    }
  }
  return por;
}

/**
 * A ESTANTE de planos de ensino já lançados — um por carimbo, com o OBJETIVO
 * como resumo (o rótulo humano) e o estado de vínculo. Devolve só METADADO,
 * nunca as respostas (a mesma fronteira da `anamneses`).
 *
 * O RECORTE DO PROFESSOR (22/10/2026). A lista era a da ESCOLA inteira: o PO de um
 * professor oferecia os planos dos outros, e a escolha podia cair num plano alheio.
 * Como a turma é a do plano, o vazamento ia mais fundo — a lista de sujeitos passava a
 * ser recortada pela turma do plano ERRADO. O recorte é uma regra do ACERVO, e não um
 * filtro da tela: a tela só manda o professor que já tem na barra, e o servidor decide.
 *
 * O plano declara o professor no CONTEXTO (o slug) e na resposta `contexto-professor`
 * (o nome). O recorte compara o valor pedido com os dois — quem chama manda o slug —, e
 * um valor que não casa com nenhum deles não entra.
 *
 * A ESTANTE DIZ QUEM FOI SUBSTITUÍDO, E NÃO O ESCONDE (07/11/2026).
 *
 * O DEFEITO, medido na `batata`: ela ajustou o plano de ensino para incluir a aluna que entrou
 * no elenco, e o PO passou a oferecer DOIS planos de ensino — o original e o ajuste, os dois com
 * o mesmo rótulo («Teste»), indistinguíveis. A proveniência está certa (o ajuste é um elo, e os
 * dois existem); o erro é a lista de ESCOLHA mostrar a história inteira. Quem escolhe qual plano
 * observar não está a ler o passado — está a decidir o presente, e ali a versão anterior não é
 * uma opção: é a mesma coisa, mais velha.
 *
 * POR QUE A MARCA E NÃO O CORTE. A estante serve duas coisas: a lista de onde se ESCOLHE, e a
 * leitura do plano que o documento em mãos DECLARA (a turma e o ciclo do PO saem daqui). São
 * perguntas diferentes, e cortar a lista no servidor respondia só à primeira — o PO antigo
 * apontava para um plano que já não vinha, e a turma e o ciclo apareciam vazios. A marca resolve
 * as duas com um dado só: `anterior` diz quem tem sucessor, e quem ESCOLHE (o `po.json`, a lista
 * do acervo) esconde as anteriores MENOS a que o documento declara. O histórico fica inteiro
 * para quem o lê, e a escolha fica curta para quem escolhe.
 *
 * `estadosDosPlanos` e a listagem do acervo já devolviam todos, com o `substituido_por`; nada
 * disso mudou.
 */
async function planos(armazenamento, recorte) {
  const professor = String((recorte && recorte.professor) || '').trim();
  const indice = await lerIndice(armazenamento);
  const ligacoes = await vinculosDePlano(armazenamento, indice);
  const opcoes = [];
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, indice)) {
    if (professor) {
      const doContexto = String(resumo.professor || '').trim();
      const doNome = String(resumo.professorNome || '').trim();
      if (doContexto !== professor && doNome !== professor) continue;
    }
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    const objetivo = resumo.objetivo || null;
    const por = ligacoes.get(carimbo) || [];
    opcoes.push({
      valor: carimbo,
      rotulo: objetivo || carimbo,
      carimbo,
      turma: resumo.turma || null,
      detalhe: 'api/envelope/' + encodeURIComponent(carimbo),
      escola: resumo.escola || null,
      professor: resumo.professor || null,
      ciclo: resumo.ciclo || null,
      vinculada: por.length > 0,
      por,
      ajuste_de: resumo.ajuste_de || null,
    });
  }
  /* A MARCA DA CADEIA. `ajuste_de` é a seta do elo: um plano que alguém ajustou tem um sucessor
   * que o nomeia — esse é o `anterior`. Um elo intermédio (A → B → C) também tem sucessor e tem
   * a mesma marca; quem escolhe esconde-o e mostra o topo. O rótulo fica intacto: é o objetivo do
   * plano, e o que muda na tela é a lista, não o nome do conteúdo. */
  const substituidos = new Set(opcoes.map((o) => String(o.ajuste_de || '')).filter(Boolean));
  const anotadas = opcoes.map((o) => (substituidos.has(o.carimbo)
    ? Object.assign({}, o, { anterior: true })
    : o));
  anotadas.sort((a, b) => (a.carimbo < b.carimbo ? 1 : -1));
  return anotadas;
}

/**
 * O ESTADO de TODOS os planos — os três estados (solta / legado / vinculada).
 * Sem o apelido (o plano é um por objetivo, não um por aluna), o «legado» é o
 * plano que um sucessor ajustou: quem tem `ajuste_de` apontando para ele.
 *
 * O AUTOR E O «SEM TURMA» ENTRAM AQUI (12/11/2026). O autor é o `contexto.professor` do
 * documento — quem o escreveu, e não quem dirige a turma hoje —, e é ele que a linha mostra em
 * «Quem fez». `semTurma` é a situação derivada por `perdeuATurma`: a turma que o plano nomeia
 * passou a ser dirigida por outro professor. As duas coisas andam juntas porque a segunda só se
 * pode afirmar com a primeira: sem autor não há como dizer que ele já não dirige nada.
 *
 * `opcoes.curadorias` é opcional, e a ausência dela não inventa o estado: sem curadorias lidas
 * não há `semTurma`, e o plano fica com o estado da cadeia, como sempre.
 */
async function estadosDosPlanos(armazenamento, opcoes) {
  const direcao = direcaoDasTurmas(opcoes && opcoes.curadorias);
  const indice = await lerIndice(armazenamento);
  const ligacoes = await vinculosDePlano(armazenamento, indice);
  const lista = await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, indice);
  const sucessores = new Map();
  /* O AUTOR DE CADA ELO, por carimbo — é o que permite perguntar se um elo trocou de mãos. */
  const autorDe = new Map();
  for (const { nome, resumo } of lista) {
    autorDe.set(resumo.id || nome.replace(/\.json$/, ''),
      String(resumo.professor || '').trim() || null);
  }
  for (const { nome, resumo } of lista) {
    if (!resumo.ajuste_de) continue;
    if (!sucessores.has(resumo.ajuste_de)) sucessores.set(resumo.ajuste_de, []);
    sucessores.get(resumo.ajuste_de).push(resumo.id || nome.replace(/\.json$/, ''));
  }
  const estados = {};
  for (const { nome, resumo } of lista) {
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    const por = ligacoes.get(carimbo) || [];
    const substituido_por = sucessores.get(carimbo) || [];
    let estado;
    if (por.length > 0) estado = 'vinculada';
    else if (substituido_por.length > 0) estado = 'legado';
    else estado = 'solta';
    const autor = String(resumo.professor || '').trim() || null;
    const perdeu = perdeuATurma({ turma: resumo.turma, professor: autor }, direcao);
    /* O ELO QUE TROCOU DE MÃOS (12/11/2026).
     *
     * Um elo e o seu `ajuste_de` são o MESMO documento, mais novo. Se o autor de um não é o autor
     * do outro, alguém trocou o nome do professor no caminho — foi o que a cadeia fez quatro
     * vezes, e o acervo do `calango` guarda os elos (`plano-20261110-2145`, `-0858`, `-1016`,
     * `-1527`, `-1450`, todos com o autor de um e o pai do outro). A regra nova impede os
     * próximos; este campo diz quais são os que já lá estão.
     *
     * E ele NÃO é um selo bonito: é uma admissão. Um elo reatribuído não conta como o plano da
     * Turma — nem para a ocupar, nem para calar o «!», nem para a cadeia o tomar como sendo de
     * quem dirige hoje. */
    const autorDoAnterior = resumo.ajuste_de ? (autorDe.get(String(resumo.ajuste_de)) || null) : null;
    const trocou = Boolean(resumo.ajuste_de && autorDoAnterior && autor && autorDoAnterior !== autor);
    estados[carimbo] = {
      estado,
      carimbo,
      objetivo: resumo.objetivo || null,
      turma: resumo.turma || null,
      professor: autor,
      /* O NOME DE EXIBIÇÃO VAI JUNTO (12/11/2026) — a marca do «!» no cabeçalho diz «o plano é de
       * X», e X tem de ser o nome que o professor lê, não o slug. Ele já está no resumo do
       * envelope (`contexto-professor`), e esta lista não faz uma segunda leitura por isso. */
      professorNome: String(resumo.professorNome || '').trim() || null,
      vinculada: por.length > 0,
      por,
      ajuste_de: resumo.ajuste_de || null,
      substituido_por,
      ...(trocou ? { reatribuido: true, autorDoAnterior } : {}),
      ...(perdeu ? { semTurma: true, turmaDe: perdeu.dono } : {}),
    };
  }
  return estados;
}

/**
 * O ESTADO de um PO, derivado — e a regra que decide se ele se pode apagar (04/11/2026).
 *
 * O PO NÃO TINHA ESTADO NENHUM, e a consequência era a que a pesquisadora viu: «o botão de
 * deletar o plano de observação não está aparecendo». Ele não aparecia porque **não existia** —
 * a linha do PO oferecia só «Ajustar», e não havia rota que o apagasse. O plano de ensino e a
 * anamnese tinham o par (estado → botão → rota); o PO ficou de fora quando a listagem passou a
 * ser a página da Área do Professor.
 *
 * A REGRA É A DAS OUTRAS DUAS FAMÍLIAS, e não uma nova: **enquanto o registo está solto, o
 * professor tem liberdade operacional sobre ele; depois de derivado, não se apaga — deriva-se.**
 * Um PO que já foi ajustado tem um sucessor que o referencia (`ajuste_de`), e apagá-lo deixaria o
 * sucessor a apontar para um pai que já não existe — o mesmo defeito do ciclo intermédio apagado,
 * noutra escala.
 *
 * O QUE O PO **NÃO** PRECISA DE TRAVA, e é uma diferença real em relação ao plano: nada aponta
 * para um PO. O ciclo gerado guarda a **sua própria** cópia do PO no pacote (`po-01.json` e o
 * `-po.md`), e é dela que a aula, a captura e a âncora vivem — apagar o envelope do acervo não
 * toca em nada do que já foi gerado. A trava do plano existe porque o PO o referencia; a do PO
 * existiria só contra o sucessor, e é essa que está aqui.
 */
async function estadoDoPo(armazenamento, envelope, opcoes) {
  const direcao = direcaoDasTurmas(opcoes && opcoes.curadorias);
  const carimbo = envelope.id || null;
  const lista = await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/);
  const sucessores = lista
    .filter(({ resumo }) => String(resumo.ajuste_de || '') === String(carimbo))
    .map(({ nome, resumo }) => resumo.id || nome.replace(/\.json$/, ''));
  /* O PO TAMBÉM PERDE A TURMA (12/11/2026) — é a mesma regra do plano, e a pesquisadora foi
   * explícita: «no plano de observação a gente tá com o mesmo problema […] Vai ser a mesma
   * regra.» O PO herda a turma do plano que observa, e o autor é o `contexto.professor`: quando
   * os dois divergem, o documento é de um professor que já não dirige aquela turma. */
  const turma = String((envelope && envelope.contexto && envelope.contexto.turma) || '').trim();
  const autor = String((envelope && envelope.contexto && envelope.contexto.professor) || '').trim();
  const perdeu = perdeuATurma({ turma, professor: autor }, direcao);
  /* O ELO QUE TROCOU DE MÃOS — a mesma derivação do plano, e a mesma razão. Custa UMA leitura, e
   * só quando o PO tem `ajuste_de`: quem lê um PO solto não paga nada por isto. */
  let reatribuido = false;
  let autorDoAnterior = null;
  if (envelope && envelope.ajuste_de) {
    try {
      const pai = await lerEnvelope(armazenamento, String(envelope.ajuste_de));
      autorDoAnterior = String((pai && pai.contexto && pai.contexto.professor) || '').trim() || null;
      reatribuido = Boolean(autorDoAnterior && autor && autorDoAnterior !== autor);
    } catch (erro) { reatribuido = false; }
  }
  return {
    estado: sucessores.length ? 'legado' : 'solta',
    carimbo,
    turma: turma || null,
    professor: autor || null,
    ajuste_de: envelope.ajuste_de || null,
    substituido_por: sucessores,
    derivado: sucessores.length > 0,
    ...(reatribuido ? { reatribuido: true, autorDoAnterior } : {}),
    ...(perdeu ? { semTurma: true, turmaDe: perdeu.dono } : {}),
  };
}

/** O ESTADO de um plano, derivado — reusa a derivação da lista de gestão. */
async function estadoDoPlano(armazenamento, envelope, opcoes) {
  const carimbo = envelope.id || null;
  const todos = await estadosDosPlanos(armazenamento, opcoes);
  return todos[carimbo] || {
    estado: 'solta',
    carimbo,
    objetivo: valorDe(envelope, 'objetivo-geral'),
    turma: turmaDoEnvelope(envelope),
    professor: String((envelope && envelope.contexto && envelope.contexto.professor) || '').trim() || null,
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
async function anamneses(armazenamento, recorte, elenco) {
  const indice = await lerIndice(armazenamento);
  // O ELENCO ENTRA AQUI (08/11/2026) — ver `vinculos`: a linha de base manda sobre `po.sujeitos`,
  // e é ela que impede uma aluna em observação de aparecer como «livre».
  const ligacoes = await vinculos(armazenamento, indice, elenco);
  // O RECORTE DA TURMA (20/10/2026) — ver `alunasDaTurma`. `null`/ausente = sem recorte; um
  // array (mesmo vazio) = só aquelas alunas. A distinção é o que impede «turma sem curadoria»
  // de virar «todas as alunas da escola»: lá o array vem vazio e a lista sai vazia.
  const permitidas = recorte && Array.isArray(recorte.alunas) ? new Set(recorte.alunas) : null;
  const opcoes = [];
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^anamnese-.*\.json$/, indice)) {
    const aluna = resumo.aluna || null;
    if (!aluna) continue;
    if (permitidas && !permitidas.has(String(aluna).trim())) continue;
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    const quando = carimboEmPortugues(carimbo);
    const por = ligacoes.get(aluna) || [];
    opcoes.push({
      valor: aluna,
      rotulo: aluna + (quando ? ' · ' + quando : ''),
      carimbo,
      detalhe: 'api/envelope/' + encodeURIComponent(carimbo),
      escola: resumo.escola || null,
      professor: resumo.professor || null,
      ciclo: resumo.ciclo || null,
      vinculada: por.length > 0,
      por,
      ajuste_de: resumo.ajuste_de || null,
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
async function vigenteDoSujeito(armazenamento, aluna, elenco) {
  const o = (await anamneses(armazenamento, null, elenco)).find((x) => x.valor === aluna);
  return o ? { carimbo: o.carimbo, vinculada: o.vinculada } : null;
}

/**
 * O ESTADO de TODAS as anamneses — inclusive as SEM SUJEITO. Uma fonte só para
 * os três estados (solta / legado / vinculada) e o `sem-sujeito`.
 */
async function estadosDasAnamneses(armazenamento, elenco) {
  const indice = await lerIndice(armazenamento);
  const ligacoes = await vinculos(armazenamento, indice, elenco);

  // UMA PASSAGEM, DUAS DERIVAÇÕES. Esta função precisa de tudo o que a `anamneses()`
  // precisa (o vigente de cada apelido) E dos registos que a `anamneses()` descarta (os
  // SEM SUJEITO). Ela chamava a primeira e voltava a ler todos os envelopes para a segunda —
  // 124 leituras para 61 envelopes, medido em 19/10/2026.
  //
  // E NENHUMA LEITURA DE ENVELOPE (20/10/2026): os quatro dados que esta lista deriva — o
  // apelido, o carimbo, o `ajuste_de` e a contagem por apelido — estão no RESUMO do índice.
  const envelopes = [];
  const contagem = new Map();
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^anamnese-.*\.json$/, indice)) {
    const apelido = resumo.aluna || null;
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    envelopes.push({ nome, resumo, apelido, carimbo });
    if (apelido) contagem.set(apelido, (contagem.get(apelido) || 0) + 1);
  }

  // O VIGENTE é o carimbo MAIS RECENTE de cada apelido — a mesma regra da `anamneses()`
  // (ordenação decrescente do carimbo, o primeiro que aparece ganha). Derivada dos mesmos
  // envelopes, para as duas listas nunca discordarem sobre quem é o vigente.
  const maisRecente = new Map();
  for (const e of envelopes) {
    if (!e.apelido) continue;
    const atual = maisRecente.get(e.apelido);
    if (!atual || atual < e.carimbo) maisRecente.set(e.apelido, e.carimbo);
  }

  const estados = {};
  for (const { resumo, apelido, carimbo } of envelopes) {
    const por = apelido ? ligacoes.get(apelido) || [] : [];
    const vigente = apelido !== null && maisRecente.get(apelido) === carimbo;
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
      ajuste_de: resumo.ajuste_de || null,
    };
  }
  return estados;
}

/** O ESTADO de uma anamnese, derivado — reusa a derivação da lista de gestão. */
async function estadoDaAnamnese(armazenamento, envelope, elenco) {
  const carimbo = envelope.id || null;
  const todos = await estadosDasAnamneses(armazenamento, elenco);
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
  // O ID FOI DADO OU INVENTADO? (04/11/2026) Um id que veio do chamador — `corpo.id`, o
  // carimbo de um registo que já está na estante — é o mesmo documento a ser reescrito: grava
  // por cima. Um id que nasce do carimbo agora é um nome livre que ninguém revisou: grava só
  // se ainda estiver livre, e cede o lugar ao pedido que chegou primeiro.
  let idDeDocumentoQueExiste = false;
  if (corpo && corpo.id) { opcoes.id = String(corpo.id); idDeDocumentoQueExiste = true; }
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

  /*
   * O PO TAMBÉM TEM REGRA — e ela BLOQUEIA (22/10/2026).
   *
   * Até aqui o PO estava excluído de toda a reconciliação (`fonte !== 'po'`), e a exclusão
   * era lida como «o PO não tem estado». Não é: o PO tem um estado simples e verdadeiro —
   * ou ainda não existe, ou já existe um. O que faltava era dizê-lo.
   *
   *   · `id`        → EDITA em sítio (corrigir o PO que existe, o mesmo carimbo);
   *   · `ajuste_de` → DERIVA (elo novo, com o motivo declarado — a proveniência acrescenta);
   *   · nenhum      → só quando ainda não há PO primário para este plano. Se há, RECUSA.
   *
   * A recusa é 409 e nomeia o carimbo existente: sem isso o professor recebe um «não» que
   * não diz onde está o registo nem o que fazer com ele — e o caminho antigo (gravar outra
   * vez, em silêncio, sobrescrevendo a fonte) era pior do que o «não».
   */
  if (fonte === 'po') {
    /*
     * O PO OBSERVA O PLANO QUE VALE — e não o elo que já foi substituído (04/11/2026).
     *
     * O que aconteceu, medido: a pesquisadora ajustou o plano de ensino (o elo
     * `plano-20261103-2200` → `plano-20261104-1732`), e o PO derivado continuou a declarar
     * `plano-de-ensino: plano-20261103-2200`. A observação passou a apontar para o documento
     * que o próprio sistema já tinha substituído — a cadeia existia nos dois lados e não se
     * tocava no meio. Sem esta linha, o professor podia derivar o PO quantas vezes quisesse e
     * ele nunca veria a correção do plano.
     *
     * O que se troca é a REFERÊNCIA, não o conteúdo: o PO continua a dizer o que o professor
     * escreveu; o que passa a ser verdade é «este PO observa a versão vigente do plano». E o
     * ajuste é DITO na resposta (`planoRetargetado`), para a tela poder contá-lo em vez de o
     * fazer em silêncio.
     */
    const alvo = respostas['plano-de-ensino'];
    const planoDeclarado = alvo && alvo.valor !== undefined ? alvo.valor : alvo;
    const planoId = String(planoDeclarado == null ? '' : planoDeclarado).trim();
    if (planoId) {
      const vigente = await planoVigenteDaCadeia(armazenamento, planoId);
      if (vigente && vigente !== planoId) {
        respostas['plano-de-ensino'] = {
          valor: vigente, origem: 'perguntado', respondente: 'professor', nota: null,
        };
        opcoes.planoRetargetado = { de: planoId, para: vigente };
      }
    }
    if (corpo && corpo.ajuste_de) {
      opcoes.ajuste = { de: String(corpo.ajuste_de), motivo: (corpo && corpo.motivo) || null };
      delete opcoes.id;
    } else if (!opcoes.id) {
      /* A BUSCA DO PO EXISTENTE USA A REFERÊNCIA JÁ CORRIGIDA: se o plano foi substituído, o
       * PO primário do plano NOVO é procurado pelo id vigente — o mesmo que vai ser gravado. */
      const existente = (planoId && String(planoId).trim())
        ? await poPrimarioDoPlano(armazenamento, String(planoId).trim())
        : await poPrimarioDoEscopo(armazenamento, (corpo && corpo.contexto) || {});
      if (existente) {
        return {
          ok: false,
          simular: Boolean(corpo && corpo.simular),
          gravado: false,
          erroDaGravacao: null,
          caminhoNoAcervo: null,
          noArmazenamentoAntigo: false,
          estado: null,
          id: existente,
          recusa: {
            status: 409,
            motivo: 'já existe o Plano de Observação «' + existente + '» para este plano de '
              + 'ensino: a linha de base dos sujeitos (P-10) é uma só, e um segundo PO não '
              + 'observaria outra coisa — reescreveria a primeira por outro caminho. Na '
              + 'estante, «' + existente + '» tem dois gestos: CORRIGIR grava o mesmo '
              + 'carimbo (para o erro de digitação); DERIVAR cria um elo novo que aponta '
              + 'para ele e deixa o registo anterior de pé.',
            carimbo: existente,
          },
        };
      }
    }
  }

  if (!opcoes.id && fonte !== 'po' && fonte !== 'plano') {
    const aluna = corpo && corpo.contexto && corpo.contexto.aluna;
    /* O ELENCO MANDA TAMBÉM AQUI (08/11/2026) — e aqui é DADO, não rótulo. A política de gravação
     * é «substitui enquanto não vinculada, empilha quando vinculada»: com o vínculo derivado só de
     * `po.sujeitos`, a anamnese de uma aluna que entrou no elenco depois era SOBRESCRITA por cima
     * do registo dela — o modo de falha que a proveniência existe para impedir, e o único desta
     * família que apaga em vez de acrescentar. O `elenco` chega pelo `dados`, como o resto do que
     * a ponte sabe e o núcleo não vai buscar. */
    const vigente = aluna ? await vigenteDoSujeito(armazenamento, aluna, dados.elenco) : null;
    if (vigente && vigente.vinculada) {
      opcoes.ajuste = { de: vigente.carimbo, motivo: (corpo && corpo.motivo) || null };
    } else if (vigente) {
      opcoes.id = vigente.carimbo;
      idDeDocumentoQueExiste = true;
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
    idDeDocumentoQueExiste = false;
    if (!opcoes.geradoEm) opcoes.geradoEm = geradoEm;
  }

  if (corpo && corpo.contexto) opcoes.contexto = corpo.contexto;

  /*
   * A BASE DA FUSÃO (decisão 84, 04/11/2026). Para unificar duas edições são precisas três
   * versões: a que o professor LEU, a que ele GRAVOU e a que está no acervo. A terceira o
   * adaptador lê; a primeira vem daqui.
   *
   * O cliente manda-a quando a tem (`corpo.base`) — é o caso da aba aberta há dez minutos, em
   * que a versão lida já não é a do acervo e só o cliente sabe qual era. Sem ela, a base é o
   * que o acervo tinha no INÍCIO deste pedido: isso já resolve o caso real da corrida (dois
   * pedidos em voo ao mesmo tempo), mas não o da aba velha — e é por isso que o cliente a manda.
   */
  let baseDaEdicao = null;
  if (idDeDocumentoQueExiste) {
    const daBase = corpo && corpo.base && typeof corpo.base === 'object' ? corpo.base : null;
    const doAcervo = daBase ? null : await lerEnvelope(armazenamento, opcoes.id);
    baseDaEdicao = daBase || doAcervo;
  }

  const { documento, estado, relatorio } = motor.elicitar(conteudoAtual, respostas, opcoes);
  const simular = Boolean(corpo && corpo.simular);
  const gravacao = simular
    ? { ok: true, linhas: linhasDoRelatorio(relatorio) }
    : await gravarEnvelope(armazenamento, documento, relatorio, { substituir: idDeDocumentoQueExiste, base: baseDaEdicao });

  return {
    ok: relatorio.errosDoDocumento.length === 0,
    simular,
    gravado: !simular && gravacao.ok,
    // O MOTIVO de não ter gravado — a rota e a tela dizem-no em vez de deixar o professor a
    // adivinhar por que o «Guardar» não guardou (20/10/2026).
    erroDaGravacao: gravacao.ok ? null : (gravacao.erro || null),
    // ONDE FICOU. `caminho` é o do repositório, quando o acervo é o destino; `null` quando não
    // se sabe (o armazenamento antigo não tem caminho a declarar).
    caminhoNoAcervo: gravacao.ok ? (gravacao.caminho || null) : null,
    noArmazenamentoAntigo: gravacao.noArmazenamentoAntigo === true,
    // HOUVE FUSÃO? A tela tem de o dizer: um documento que ficou com campos da outra edição
    // não é o mesmo que um documento que a minha edição substituiu, e a diferença não se vê.
    fusao: gravacao.relatoDaFusao || null,
    fundido: gravacao.fundido === true,
    estado,
    // O ID QUE FICOU NO ACERVO. É `relatorio.id` quase sempre; difere quando o minuto do
    // carimbo foi disputado e a gravação teve de usar o sufixo seguinte (04/11/2026).
    id: (gravacao && gravacao.id) || relatorio.id,
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
    // O AJUSTE DA REFERÊNCIA (04/11/2026): quando o plano declarado já tinha sido substituído, o
    // PO passa a observar o topo da cadeia. Vai na resposta para a tela o poder dizer — uma
    // correção em silêncio é a que ninguém consegue auditar depois.
    ...(opcoes.planoRetargetado ? { planoRetargetado: opcoes.planoRetargetado } : {}),
  };
}

module.exports = {
  revalidacaoPendente,
  ciclosDaEscola,
  proximoCiclo,
  PREFIXO_ENVELOPES,
  ARQUIVO_DE,
  INDICE_DOS_ENVELOPES,
  VERSAO_DO_RESUMO,
  resumoDoEnvelope,
  resumosDeEnvelopes,
  chaveDoContexto,
  planosDaCadeia,
  planoVigenteDaCadeia,
  poDoPlano,
  vigentesDaFamilia,
  ENDERECOS,
  registro,
  linhasDoRelatorio,
  carimboEmPortugues,
  mesmasRespostas,
  mudouDeFato,
  mapa,
  nomesDeEnvelopes,
  lerArquivo,
  fundirTextosDeEnvelope,
  lerEnvelope,
  lerEnvelopeCru,
  ultimoEnvelope,
  identificar,
  identificarComCarimbo,
  gravarEnvelope,
  apagarEnvelope,
  vinculos,
  alunasDaTurma,
  // O ELENCO ESCOLHIDO PELA TURMA (07/11/2026) — a fonte nova do vínculo, antes das antigas.
  elencoEscolhidoPelaTurma,
  alunasDoProfessor,
  /* A LINHA DE BASE DA TURMA, com o recorte (06/11/2026) — a mesma leitura para o cabeçalho do PO,
   * para o painel do corpo e para o documento derivado. */
  linhaDeBaseDaTurma: recorte.linhaDeBaseDaTurma,
  // A LINHA DE BASE ESCOLHIDA PELA TURMA (07/11/2026) — procurada pelo id que a Turma declara.
  linhaDeBaseDoElenco: recorte.linhaDeBaseDoElenco,
  /* O UNIVERSO do corpo: os campos que a anamnese oferece. É o denominador «N de M» do documento —
   * sem ele o recorte não tem contra o que se medir. */
  camposDoCorpo: recorte.camposDisponiveis,
  alunasDaAnamnese,
  valorDe,
  turmaDoEnvelope,
  direcaoDasTurmas,
  perdeuATurma,
  vinculosDePlano,
  planos,
  estadosDosPlanos,
  estadoDoPlano,
  estadoDoPo,
  anamneses,
  vigenteDoSujeito,
  estadosDasAnamneses,
  estadoDaAnamnese,
  elicitar,
};
