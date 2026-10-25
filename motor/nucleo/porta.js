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
    const resumos = Object.assign({}, guardado.resumos);
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
    return {
      nomes: limparNomes((dados && dados.nomes) || []),
      resumos,
      incompleto: Boolean(dados && dados.incompleto)
        || Number(dados && dados.versao) !== VERSAO_DO_RESUMO,
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
 */
async function gravarEnvelope(armazenamento, documento, relatorio) {
  if (relatorio.errosDoDocumento.length) {
    return { ok: false, erro: 'o documento não passou na validação', linhas: linhasDoRelatorio(relatorio) };
  }
  const chave = ARQUIVO_DE(relatorio.id);
  const linhas = linhasDoRelatorio(relatorio, chave);

  try {
    await registrarNoIndice(armazenamento, relatorio.id + '.json', documento);
  } catch (erro) {
    // Sem índice o registro continua a valer: a leitura de um nome que não está no rol só
    // aparece na enumeração (que é a reconstrução). Gravar não depende de indexar.
  }

  try {
    const r = await armazenamento.guardar(chave, JSON.stringify(documento, null, 2) + '\n');
    // O CAMINHO ONDE O REGISTO FICOU, quando o armazenamento o sabe (o acervo sabe: é o
    // repositório). Quem mostra ao professor tem de mostrar o endereço que existe: o carimbo
    // sozinho é um nome, e um nome não se procura.
    const caminho = r && typeof r === 'object' ? (r.caminho || null) : null;
    const antigo = r && typeof r === 'object' ? r.noArmazenamentoAntigo === true : false;
    return { ok: true, linhas, caminho, noArmazenamentoAntigo: antigo };
  } catch (erro) {
    // O nome ficou órfão no índice; tira-se, sem que a falha da limpeza esconda a de origem.
    try { await esquecerDoIndice(armazenamento, relatorio.id + '.json'); } catch (e) { /* já falhou o que importa */ }
    return { ok: false, erro: (erro && erro.message) || String(erro), linhas };
  }
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
 */
function alunasDaTurma(curadorias, alvo) {
  const turma = String((alvo && alvo.turma) || '').trim();
  if (!turma) return null;
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
 * AS ALUNAS DE UM PROFESSOR — a união das curadorias vigentes dele, sem exigir a turma.
 *
 * É o recorte possível quando o PO ainda não tem plano escolhido: o nó `sujeitos` pode ser
 * aberto antes do `plano-de-ensino`, e sem turma a rota devolveria a escola inteira. O que
 * autoriza é a PESSOA, e a ausência de curadoria devolve lista vazia — a mesma escolha do
 * lado seguro de `alunasDaTurma` («não atribuído» não é «todos»).
 */
function alunasDoProfessor(curadorias, professor) {
  const alvo = String(professor || '').trim();
  if (!alvo) return null;
  const vistas = new Set();
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
 * sítios a discordar.
 *
 * O que a função devolve são as duas coisas que a tela precisa: a lista recortada (`alunas`) e
 * as que levam a marca (`novas`). A marca é da TELA, não do registo: o apelido que entra no
 * envelope é o nome limpo.
 */
function alunasDaAnamnese(curadorias, professor, todas, pedida) {
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
  return { alunas, novas };
}

async function vinculos(armazenamento, jaLido) {
  const por = new Map();
  // Do ÍNDICE: o resumo de cada PO já traz os sujeitos que ele declarou. Antes esta função lia
  // TODOS os envelopes de PO para colher uma lista de nomes — e cada lista de anamnese a
  // chamava outra vez (20/10/2026).
  for (const { nome, resumo } of await resumosDeEnvelopes(armazenamento, /^po-.*\.json$/, jaLido)) {
    const carimbo = resumo.id || nome.replace(/\.json$/, '');
    for (const apelido of resumo.sujeitos || []) {
      if (!por.has(apelido)) por.set(apelido, []);
      por.get(apelido).push(carimbo);
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
  opcoes.sort((a, b) => (a.carimbo < b.carimbo ? 1 : -1));
  return opcoes;
}

/**
 * O ESTADO de TODOS os planos — os três estados (solta / legado / vinculada).
 * Sem o apelido (o plano é um por objetivo, não um por aluna), o «legado» é o
 * plano que um sucessor ajustou: quem tem `ajuste_de` apontando para ele.
 */
async function estadosDosPlanos(armazenamento) {
  const indice = await lerIndice(armazenamento);
  const ligacoes = await vinculosDePlano(armazenamento, indice);
  const lista = await resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/, indice);
  const sucessores = new Map();
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
    estados[carimbo] = {
      estado,
      carimbo,
      objetivo: resumo.objetivo || null,
      turma: resumo.turma || null,
      vinculada: por.length > 0,
      por,
      ajuste_de: resumo.ajuste_de || null,
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
async function anamneses(armazenamento, recorte) {
  const indice = await lerIndice(armazenamento);
  const ligacoes = await vinculos(armazenamento, indice);
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
async function vigenteDoSujeito(armazenamento, aluna) {
  const o = (await anamneses(armazenamento)).find((x) => x.valor === aluna);
  return o ? { carimbo: o.carimbo, vinculada: o.vinculada } : null;
}

/**
 * O ESTADO de TODAS as anamneses — inclusive as SEM SUJEITO. Uma fonte só para
 * os três estados (solta / legado / vinculada) e o `sem-sujeito`.
 */
async function estadosDasAnamneses(armazenamento) {
  const indice = await lerIndice(armazenamento);
  const ligacoes = await vinculos(armazenamento, indice);

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
    if (corpo && corpo.ajuste_de) {
      opcoes.ajuste = { de: String(corpo.ajuste_de), motivo: (corpo && corpo.motivo) || null };
      delete opcoes.id;
    } else if (!opcoes.id) {
      const alvo = respostas['plano-de-ensino'];
      const planoId = alvo && alvo.valor !== undefined ? alvo.valor : alvo;
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
    // O MOTIVO de não ter gravado — a rota e a tela dizem-no em vez de deixar o professor a
    // adivinhar por que o «Guardar» não guardou (20/10/2026).
    erroDaGravacao: gravacao.ok ? null : (gravacao.erro || null),
    // ONDE FICOU. `caminho` é o do repositório, quando o acervo é o destino; `null` quando não
    // se sabe (o armazenamento antigo não tem caminho a declarar).
    caminhoNoAcervo: gravacao.ok ? (gravacao.caminho || null) : null,
    noArmazenamentoAntigo: gravacao.noArmazenamentoAntigo === true,
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
  INDICE_DOS_ENVELOPES,
  VERSAO_DO_RESUMO,
  resumoDoEnvelope,
  resumosDeEnvelopes,
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
  alunasDaTurma,
  alunasDoProfessor,
  alunasDaAnamnese,
  valorDe,
  turmaDoEnvelope,
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
