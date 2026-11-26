#!/usr/bin/env node
'use strict';

/*
 * validar-dados-ciclo.js — valida o JSON DE DADOS de um ciclo (o lançamento por aula).
 *
 *   uso: node tools/validar-dados-ciclo.js <ciclo-XX[-<escola>]-dados.json> [--json]
 *
 * Irmão do `validar-po-ciclo.js` — e a peça que o §4.3 do relatório do experimento
 * (experimentos/captura-json/RELATORIO.md) nomeia como o análogo de produção do dublê de DOM:
 * "um validador do JSON (no espírito de validar-po-ciclo.js): o par `plano_seguido` × `mudou`,
 * o `ultimo_lancamento` de cada aula, a ordem do schema". O §4.5 o põe como passo 3, ANTES do
 * ciclo-piloto. Como os irmãos, ele só CONFERE: não escreve, não normaliza, não corrige.
 *
 * O QUE É DESTE DOCUMENTO — e o que ele NÃO é. O JSON de dados não tem schema em arquivo: as
 * regras dele são do §4.1 do relatório ("o que já está decidido e é só transportar") e do
 * formulário de lançamento (experimentos/captura-json/formulario.html), que é quem CONSTROI o
 * objeto na ordem canônica. Um `ciclo-XX-dados-schema.json` exigiria um por escola — os três
 * schemas compartilhados do ciclo são byte a byte iguais entre professores, e o da captura já
 * varia por variante. Aqui a tabela de regras é INLINE, e é a decisão declarada desta peça.
 *
 * A FONTE × O DERIVADO. O arquivo que este validador lê é `ciclos/ciclo-XX[-<escola>]-dados.json`,
 * o TEXTO PLANO, que é FONTE (entra no hash da âncora). A cópia dentro do pacote publicado é o
 * ENVELOPE `{_cifrado, lancamentos, _nota}` — DERIVADO, que o gerador reescreve a cada
 * `gerar-ciclo.sh`. Validar o envelope seria validar o que não é fonte: o validador o RECUSA,
 * como o `renomear-chaves-dados.js` recusa (a migração se faz no plano, nunca no derivado).
 *
 * AS LACUNAS SÃO DECLARADAS (§4.6). O JSON cobre a AULA — não o PO nem o plano. O que falta
 * (a estrutura executada, o horário de início e fim, o volume em tempos, o que foi abandonado,
 * o caminho do PO, a musicalidade, a linha de base, os materiais brutos e as ocorrências
 * físicas de P-22) não vira campo inventado nem erro: sai DECLARADO, com o motivo, para o
 * documento escrever `[Preencher: …]`. É a mesma regra do plano e do PO — e é o resultado do
 * experimento, não um defeito a esconder.
 *
 * AS TRÊS LEITURAS DO §4.6, que a saída repete porque são a razão de existir da peça:
 *   1. Quem manda nos campos é o PO, não o schema (§7.1): as colunas da tabela técnica são as
 *      do PO ("Metatarsos"), o formulário escreve as genéricas (`alinhamento`, `tempo`) e o
 *      Duo guarda `metatarsos`. As CHAVES DE BLOCO VARIAM por variante — este validador confere
 *      a FORMA de cada bloco por aluno, nunca a lista de chaves: fixá-la seria contradizer a §7.1.
 *   2. O campo `relatorio` no JSON é do CADERNO. Desde 06/11/2026 ele NÃO é prosa toda: `texto` é
 *      «o que aconteceu de novo» — a única escrita obrigatória —, `surpresas` é uma MARCA
 *      (`sim`/`nao`, ou a prosa de um lançamento antigo, que não se apaga) e `ajustes` é vazio ou
 *      o texto do ajuste (não vazio quer dizer «precisou de ajuste, e foi este»). O nome deveria
 *      ser `caderno` (ou `notas`) — renomear é decisão do professor, e o validador apenas o
 *      registra.
 *   3. A precedência do caderno mudou de lugar: com a janela de ajuste o texto cru é EDITÁVEL, e
 *      quem sustenta a precedência é o HISTÓRICO DO GIT (cada estado do JSON é um commit) mais a
 *      lista `ajustes`, gravada no ato. Não há carimbo dentro do JSON para provar nada disso.
 *
 * O QUE ELE CONFERE (erro = barra o commit; aviso = reporta):
 *   · o CARIMBO por aula (§4.1: `ultimo_lancamento` DENTRO da aula, não na raiz);
 *   · o PAR `plano_seguido` × `mudou`: `mudou` vazio se e só se o plano foi seguido;
 *   · `observado` — os eixos (`corpo`/`tecnica`/`poiesis`), o texto de cada item e a marca;
 *   · `plano_seguido ∈ {sim, parcial, nao}`, as três notas inteiras de 1 a 5, e as cinco chaves
 *     de `condicoes_contorno`, na ordem canônica;
 *   · a ORDEM DAS CHAVES — a da raiz e a da aula — contra a que o formulário constrói;
 *   · `presentes` ∪ `ausentes` = PARTIÇÃO dos apelidos do PO (nem repetido, nem em duas listas,
 *     nem esquecido, nem inventado), e `tecnica`/`funcional` com exatamente as pessoas presentes;
 *   · as MARCAS: a vocabulário é fechado (`ok`, `parcial`, `nao`, `nao_vi`) — valor fora dele é erro;
 *   · o aviso de colisão de nomes (raiz `ajustes` × `relatorio.ajustes`) — §4.1/§5.1;
 *   · o PRAZO é REPORTADO, nunca afirmado: quem o calcula é o `ciclos.json`, e ele ainda sai nulo.
 *
 * Sai com 0 se as regras se sustentam (com as lacunas declaradas e com o ciclo ainda sem aula
 * lançada); com 1 imprimindo os problemas; com 2 se a chamada está errada.
 */

const fs = require('fs');
const path = require('path');
const { validar } = require('./lib-validacao-md.js');

// A ORDEM CANÔNICA. É a que o `coletarCaptura` do formulário constrói, e ela importa por um
// motivo de MEMÓRIA e não de estilo: o arquivo inteiro do ciclo é baixado a cada lançamento para
// o diff de um commit ficar pequeno e legível ("cada estado do JSON é um commit" — é isso que
// sustenta a precedência do caderno, §4.6/3). Chave que anda troca linha no diff e borra o rastro.
// `ultimo_lancamento` e a `_nota` da aula são OPCIONAIS — o carimbo está em migração (o leitor
// cai para a raiz) e a nota é de quem transcreveu.
const ORDEM_RAIZ = ['ciclo', 'escola', 'professor', 'criado_em', 'ultimo_lancamento', 'apelidos',
  'aulas', '_nota'];
const ORDEM_AULA = ['data', 'presentes', 'ausentes', 'duracao_min', 'condicoes_contorno', 'tecnica',
  'funcional', 'relatorio', 'observado', '_nota'];

// As cinco condições de contorno, na ordem do formulário, e o vocabulário fechado dos três
// campos de escolha. `plano_seguido` sai de um `<select>` e as marcas de uma lista fixa.
const CHAVES_CONTORNO = ['plano_seguido', 'animo', 'interesse', 'harmonia', 'mudou'];
const PLANO_SEGUIDO = ['sim', 'parcial', 'nao'];
const MARCAS = ['', 'ok', 'parcial', 'nao', 'nao_vi'];

// OS TRÊS EIXOS DA CAPTURA (06/11/2026). `observado` é o que se marcou ao fim da aula, por EIXO,
// e os eixos são estes — a mesma tríade que o PO usa em «Itens de cada dimensão». A chave é
// fechada porque é ela que agrupa a leitura; o TEXTO do item é livre (vem do PO, e o PO muda com
// o ciclo). `poiesis` também aceita a grafia `poiese`, que é a que a pesquisadora usa ao falar.
const EIXOS_DA_AULA = ['corpo', 'tecnica', 'poiesis'];

// O que NÃO é pessoa nem bloco: as chaves escalares da aula. O que sobra, e é objeto de
// objetos, é um BLOCO POR PESSOA (`tecnica`, `funcional`, `musicalidade`, `par`, `linha_de_base`
// — e os da Diaghilev, que não têm as mesmas chaves). A lista é de FORMA, não de conteúdo.
const CHAVES_ESCALARES = ['data', 'presentes', 'ausentes', 'duracao_min', 'condicoes_contorno',
  'relatorio'];

// As duas chaves cujo grão é a ALUNA PRESENTE (a declaração da captura diz `grao: aluna` para
// ambas). É só nelas que as chaves têm de ser exatamente o `presentes`; nos outros blocos o grão
// pode ser a dupla, escrita à mão a cada aula.
const BLOCOS_POR_PRESENTE = ['tecnica', 'funcional'];

const SCHEMA_RAIZ = {
  title: 'Raiz do JSON de dados do ciclo',
  type: 'object',
  properties: {
    ciclo: { type: 'string', description: "O número do ciclo como o .conf o escreve: '01'." },
    escola: { type: 'string', description: 'O slug da variante (o VARIANTE do .conf).' },
    professor: { type: 'string', description: 'O professor do ciclo (P-13).' },
    criado_em: { type: 'string', description: 'Quando o JSON nasceu (AAAA-MM-DD).' },
    ultimo_lancamento: {
      type: 'string',
      description: 'Carimbo da raiz. OPCIONAL, e LEGADO: a §4.1 decide o carimbo DENTRO da aula;'
        + ' o leitor ainda cai para cá.',
    },
    apelidos: {
      type: 'object',
      description: 'Mapa apelido → nome de exibição. A lista vem do PO (P-12); os apelidos são'
        + ' ESTÁVEIS e nunca o nome completo.',
    },
    aulas: {
      type: 'object',
      description: 'As aulas lançadas, por id de dois dígitos. OBJETO, e não array: o id é a'
        + ' chave. Vazio é estado legítimo — um ciclo sem aula lançada.',
    },
    _nota: { type: 'string', description: 'Metadado do documento, não campo.' },
  },
  required: ['ciclo', 'escola', 'professor', 'criado_em', 'apelidos', 'aulas', '_nota'],
  additionalProperties: true,
};

const SCHEMA_AULA = {
  title: 'Uma aula lançada',
  type: 'object',
  properties: {
    data: { type: 'string' },
    // `type: ['array']` — o ARRAY LITERAL, e não `'array'`, de propósito: a `lib-validacao-md.js`
    // recusa array vazio, e aqui o vazio é RESPOSTA. `ausentes: []` é a aula em que todas vieram
    // (as três reais são assim), e `presentes: []` seria a aula em que ninguém veio.
    presentes: { type: ['array'] },
    ausentes: { type: ['array'] },
    duracao_min: { type: 'number' },
    condicoes_contorno: {
      type: 'object',
      required: CHAVES_CONTORNO,
      properties: {
        plano_seguido: { type: 'string', description: "sim|parcial|nao — o <select> do formulário." },
        animo: { type: 'number' },
        interesse: { type: 'number' },
        harmonia: { type: 'number' },
        mudou: { type: 'string', description: 'O que mudou em relação ao PLANO. Vazio se e só se'
          + ' o plano foi seguido — é o PAR da §4.1.' },
      },
    },
    // Os blocos por pessoa: a forma é conferida (objeto de objetos), as CHAVES não — quem manda
    // nas chaves é o PO (§7.1), e elas variam por variante.
    tecnica: { type: 'object' },
    funcional: { type: 'object' },
    // O QUE SE MARCOU AO FIM DA AULA, POR EIXO (`corpo`, `tecnica`, `poiesis`): uma lista de
    // `{ item, marca }` por eixo. A forma é aberta de propósito — os itens vêm do PO do ciclo, e
    // uma lista fechada aqui seria uma segunda fonte do vocabulário (§7.1).
    observado: { type: 'object' },
    relatorio: {
      type: 'object',
      required: ['texto'],
      properties: {
        texto: { type: 'string' },
        surpresas: { type: 'string' },
        ajustes: { type: 'string' },
      },
    },
    ultimo_lancamento: { type: 'string', description: 'O carimbo da aula (§4.1), ainda em migração.' },
    _nota: { type: 'string' },
  },
  // `tecnica` E `funcional` NÃO SÃO OBRIGATÓRIOS (06/11/2026) — e a lista os exigia. Os dois são os
  // blocos do ciclo DUO; os blocos de cada ciclo são os que o `captura-XX.json` declara (§7.1), e o
  // da calango declara `solo`, `barra`, `centro`, `musicalidade`, `expressao` e `linha_de_base`. A
  // exigência fazia o lançamento de um ciclo real ser recusado pelo validador do próprio projeto —
  // medido em `experimentos/provar-formulario-da-aula.js`, que é o JSON que o formulário monta.
  // O que continua exigido é o que vale em TODO ciclo: a aula, quem estava, o tempo, as condições
  // de contorno e o relatório. E a ausência de QUALQUER bloco por pessoa é erro próprio
  // (`conferirBlocos`): sem bloco nenhum, o lançamento não observou ninguém.
  required: ['data', 'presentes', 'ausentes', 'duracao_min', 'condicoes_contorno', 'relatorio'],
  additionalProperties: true,
};

// AS LACUNAS DECLARADAS — a lista do §4.6, com o motivo de cada uma. Nenhuma vira campo: o
// validador não escreve, e o documento é que escreve `[Preencher: …]` quando precisa do dado.
const LACUNAS = [
  ['estrutura_executada',
    'vem do PLANO da aula — a terceira entrada —, e o JSON cobre a aula, não o plano (§4.6)'],
  ['horario_inicio_fim',
    'o JSON guarda a DURAÇÃO, não o horário executado; o previsto está no .conf (DIAS) (§4.6)'],
  ['volume_em_tempos',
    'não há campo de volume no lançamento; o alvo é do plano (§4.6)'],
  ['o_que_foi_abandonado',
    'não há campo — o que não aconteceu vive na prosa crua de `relatorio.texto` (§4.6)'],
  ['caminho_do_po',
    'o vínculo com o PO é convenção de pasta e nome de arquivo, não campo do JSON (§4.6)'],
  ['musicalidade',
    'bloco DECLARADO no schema da captura (e ausente do lançamento real) — sem regra de tipo própria'],
  ['linha_de_base',
    'DESDE 06/11/2026 ela É escrita pelo lançamento — `{aluna: [{item, marca}]}`, com os itens do'
    + ' eixo do corpo do PO (o recorte do passo 4). A chave de cada item ainda é o TEXTO: dar-lhe'
    + ' um slug estável é a peça que falta para o índice de lançamentos (§4.9 do PLANO-INDICES)'],
  ['materiais_brutos',
    'não há campo para os materiais (áudio, vídeo, partitura) (§4.6)'],
  ['ocorrencias_fisicas',
    'P-22 — o protocolo EXIGE registrar, e o JSON não tem campo; hoje vai à mão no documento (§4.6)'],
  ['pergunta_emergente',
    'falta no CADERNO, não no JSON: a pergunta não é campo do lançamento (§4.6)'],
];

const GRAFO = `\n  §4.6 — as três leituras: (1) quem manda nos campos é o PO (§7.1), e por isso as chaves de`
  + ` bloco variam por variante e NÃO são fixadas aqui;`
  + `\n         (2) o campo \`relatorio\` é do CADERNO — \`texto\`, \`surpresas\` e \`ajustes\` são prosa`
  + ` crua, e o nome (\`caderno\`/\`notas\`) é decisão do professor;`
  + `\n         (3) a precedência do caderno passou a ser o HISTÓRICO DO GIT (cada estado do JSON é`
  + ` um commit) mais a lista \`ajustes\` gravada no ato — não há carimbo dentro do JSON.`;

const lerJson = (caminho) => JSON.parse(fs.readFileSync(caminho, 'utf8'));
const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const ehInteiro = (v) => typeof v === 'number' && Number.isInteger(v);
const ehString = (v) => typeof v === 'string';
const ehData = (v) => ehString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const semEspaco = (v) => ehString(v) && v.trim() !== '';
const igual = (a, b) => a.join('\u0000') === b.join('\u0000');

/**
 * A ordem das chaves que EXISTEM, confrontada com a canônica. Chave desconhecida não entra na
 * conta (ela é reportada como extra, não como desordem): só as conhecidas são ordenadas.
 */
function conferirOrdem(objeto, ordem, onde, avisos) {
  const achadas = Object.keys(objeto).filter((k) => ordem.includes(k));
  const esperadas = ordem.filter((k) => Object.prototype.hasOwnProperty.call(objeto, k));
  if (!igual(achadas, esperadas)) {
    avisos.push(`ordem das chaves fora da canônica em ${onde}: esperada ${esperadas.join(', ')}`
      + ` — encontrada ${achadas.join(', ')}`);
  }
}

function conferirContorno(cc, onde, erros, avisos) {
  const fora = Object.keys(cc).filter((k) => !CHAVES_CONTORNO.includes(k));
  if (fora.length) erros.push(`${onde}: chave em condicoes_contorno fora do canônico: ${fora.join(', ')}`);
  const plano = cc.plano_seguido;
  if (ehString(plano) && !PLANO_SEGUIDO.includes(plano)) {
    erros.push(`${onde}: condicoes_contorno.plano_seguido '${plano}' não é ${PLANO_SEGUIDO.join('|')}`);
  }
  // O PAR (§4.1) — a regra que o §4.3 nomeia primeiro. As duas direções importam: `mudou`
  // preenchido com o plano seguido é contradição; plano NÃO seguido com `mudou` vazio apaga o
  // elo entre o plano e o que de fato se aplicou — que é justamente o que a memória registra.
  if (ehString(plano) && ehString(cc.mudou)) {
    if (plano === 'sim' && cc.mudou.trim() !== '') {
      erros.push(`${onde}: plano_seguido 'sim' com mudou preenchido ('${cc.mudou.trim()}') —`
        + ' se o plano foi seguido, o que mudou em relação a ele é vazio');
    }
    if (plano !== 'sim' && cc.mudou.trim() === '') {
      erros.push(`${onde}: plano_seguido '${plano}' com mudou vazio —`
        + ' o que mudou em relação ao plano tem de estar escrito');
    }
  }
  [['animo', cc.animo], ['interesse', cc.interesse], ['harmonia', cc.harmonia]].forEach(([k, v]) => {
    if (v === undefined) return; // ausente já é erro da lib
    if (!ehInteiro(v) || v < 1 || v > 5) {
      erros.push(`${onde}: condicoes_contorno.${k} ${JSON.stringify(v)} não é inteiro de 1 a 5`);
    }
  });
  if (cc.mudou !== undefined && !ehString(cc.mudou)) {
    erros.push(`${onde}: condicoes_contorno.mudou não é texto`);
  }
  if (cc.plano_seguido !== undefined && !ehString(cc.plano_seguido)) {
    erros.push(`${onde}: condicoes_contorno.plano_seguido não é texto`);
  }
  if (!ehString(cc.mudou) && avisos) avisos.push(`${onde}: mudou não é texto — o par não pode ser conferido`);
}

/** Um bloco por pessoa: objeto cujos VALORES são todos objetos (as marcas de cada pessoa). */
const ehBlocoPorPessoa = (v) => ehObjeto(v) && Object.values(v).every(ehObjeto);

function conferirParticao(aula, apelidos, onde, erros) {
  const universo = Object.keys(apelidos);
  const presentes = Array.isArray(aula.presentes) ? aula.presentes : [];
  const ausentes = Array.isArray(aula.ausentes) ? aula.ausentes : [];
  const naoTexto = [...presentes, ...ausentes].filter((p) => !ehString(p));
  if (naoTexto.length) {
    erros.push(`${onde}: presentes/ausentes com item que não é texto (${JSON.stringify(naoTexto[0])})`);
    return;
  }
  const repetidos = [...presentes, ...ausentes].filter((p, i, t) => t.indexOf(p) !== i);
  if (repetidos.length) erros.push(`${onde}: apelido repetido em presentes/ausentes: ${repetidos.join(', ')}`);
  const emDuas = presentes.filter((p) => ausentes.includes(p));
  if (emDuas.length) erros.push(`${onde}: apelido ao mesmo tempo presente e ausente: ${emDuas.join(', ')}`);
  const inventados = [...presentes, ...ausentes].filter((p) => !universo.includes(p));
  if (inventados.length) {
    erros.push(`${onde}: apelido que o PO não declara: ${inventados.join(', ')}`);
  }
  const esquecidos = universo.filter((p) => !presentes.includes(p) && !ausentes.includes(p));
  if (esquecidos.length) {
    erros.push(`${onde}: apelido que não está em presentes nem em ausentes: ${esquecidos.join(', ')}`);
  }
  return { presentes, ausentes };
}

/**
 * OS TIPOS QUE A CAPTURA DECLARA — e a razão de eles entrarem aqui (06/11/2026).
 *
 * Este validador só conhecia UM vocabulário: as cinco marcas (`ok`, `parcial`, `nao`, `nao_vi`,
 * vazio). Só que o formulário, desde a matriz de 06/11, escreve QUATRO tipos de coluna — a
 * `marca`, a `rubrica` (os níveis da régua da turma: «Satisfatório», «Razoável»…), o `booleano`
 * (verdadeiro/falso) e o `numero`. O primeiro lançamento real com rubrica foi recusado pelo
 * hook, com dez erros do género «'Satisfatório' não é marca do formulário» — a regra estava a
 * medir o registro errado, e o registro certo estava declarado, ao lado, no `captura-aula-NN.json`
 * do pacote.
 *
 * O que este leitor devolve é `{ <bloco>: { <coluna>: <tipo> } }`, e ele é OPCIONAL: sem a
 * captura (escola que ainda não gerou o pacote), vale o vocabulário fechado de antes — e assim
 * nenhuma guarda antiga enfraquece por omissão.
 */
function tiposDaCaptura(dados, caminho) {
  const m = /^(ciclo-\d{2}(?:-[a-z0-9][a-z0-9-]*)?)-dados\.json$/.exec(path.basename(caminho));
  if (!m) return null;
  const pasta = path.join(path.dirname(caminho), m[1]);
  if (!fs.existsSync(pasta)) return null;
  const ler = (nome) => {
    try { return JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8')); } catch (e) { return null; }
  };
  const mapaDe = (cfg) => {
    const mapa = {};
    (cfg.blocos || []).forEach((b) => {
      if (!b || !b.chave || !Array.isArray(b.colunas)) return;
      mapa[b.chave] = {};
      b.colunas.forEach((c) => { if (c && c.chave) mapa[b.chave][c.chave] = c.tipo || 'marca'; });
    });
    return mapa;
  };
  const porAula = {};
  let doCiclo = null;
  fs.readdirSync(pasta).filter((n) => /^captura-(?:aula-)?\d{2}\.json$/.test(n)).sort()
    .forEach((nome) => {
      const cfg = ler(nome);
      if (!cfg) return;                                     // ilegível: o vocabulário fechado responde
      // `captura-aula-NN.json` é o config DA AULA (§4.2). O `captura-NN.json` é o do ciclo —
      // o legado, que o formulário usa como queda quando a aula não declara o seu.
      if (nome.startsWith('captura-aula-')) {
        const aula = String(cfg.aula || (/(\d{2})\.json$/.exec(nome) || [])[1] || '');
        if (aula) porAula[aula] = mapaDe(cfg);
      } else {
        doCiclo = mapaDe(cfg);
      }
    });
  /* A QUEDA É O CONFIG DO CICLO — a mesma que o formulário faz (`capturas[aula] ?? captura`).
   * Sem ela, a aula 06 de um ciclo cujo config é da 01 seria medida pelo vocabulário fechado, e
   * os dez erros do primeiro lançamento com rubrica voltariam. */
  Object.keys((dados && dados.aulas) || {}).forEach((id) => {
    if (!porAula[id] && doCiclo) porAula[id] = doCiclo;
  });
  return Object.keys(porAula).length ? porAula : null;
}

function conferirBlocos(aula, onde, presentes, erros, avisos, tipos) {
  // NENHUM BLOCO POR PESSOA É ERRO (06/11/2026). Era o que a lista `required` tentava garantir ao
  // exigir `tecnica` e `funcional` — e garantia só no ciclo do Duo. Aqui a regra vale para todos:
  // se há pessoas presentes, ao menos um bloco por pessoa tem de existir. Os NOMES são do ciclo.
  const nomesDeBloco = Object.keys(aula).filter((k) => !k.startsWith('_')
    && !CHAVES_ESCALARES.includes(k) && ehBlocoPorPessoa(aula[k]));
  if (presentes.length && !nomesDeBloco.length && Object.keys(aula).length) {
    erros.push(`${onde}: nenhum bloco por pessoa — a aula não registrou observação de ninguém`
      + ` (os blocos são os do captura-XX.json do ciclo)`);
  }
  Object.keys(aula).forEach((nome) => {
    if (nome.startsWith('_') || CHAVES_ESCALARES.includes(nome)) return;
    const bloco = aula[nome];
    if (!ehBlocoPorPessoa(bloco)) {
      if (ehObjeto(bloco) || Array.isArray(bloco)) return; // forma conferida pelo schema
      avisos.push(`${onde}: campo '${nome}' que este validador não conhece e não é bloco por pessoa`);
      return;
    }
    const pessoas = Object.keys(bloco);
    if (BLOCOS_POR_PRESENTE.includes(nome)) {
      const faltam = presentes.filter((p) => !pessoas.includes(p));
      const sobram = pessoas.filter((p) => !presentes.includes(p));
      if (faltam.length || sobram.length) {
        erros.push(`${onde}: ${nome} não tem as mesmas pessoas de presentes`
          + `${faltam.length ? ` — falta(m) ${faltam.join(', ')}` : ''}`
          + `${sobram.length ? ` — sobra(m) ${sobram.join(', ')}` : ''}`);
      }
    }
    pessoas.forEach((p) => {
      Object.entries(bloco[p]).forEach(([chave, valor]) => {
        const tipo = (tipos && tipos[nome] && tipos[nome][chave]) || 'marca';
        const rel = `${nome}.${p}.${chave}`;
        if (valor === null) {
          avisos.push(`${onde}: ${rel} nulo — o vazio é o estado, e ele se escreve ''`);
          return;
        }
        if (tipo === 'booleano') {
          if (typeof valor !== 'boolean') {
            erros.push(`${onde}: ${rel} não é booleano (a captura declara 'booleano')`);
          }
          return;
        }
        if (tipo === 'numero') {
          if (!(typeof valor === 'number' && Number.isFinite(valor))) {
            erros.push(`${onde}: ${rel} não é número (a captura declara 'numero')`);
          }
          return;
        }
        if (!ehString(valor)) {
          erros.push(`${onde}: ${rel} não é texto (a captura declara '${tipo}')`);
          return;
        }
        /* A RÉGUA E O TEXTO SÃO DE DOMÍNIO ABERTO — quem os declara é a escola (a régua está no
         * plano do ciclo), e fechá-los aqui seria esta ferramenta a inventar vocabulário. O que a
         * marca tem, e os outros não, é uma lista FECHADA; é só ela que se confere. */
        if (tipo === 'rubrica' || tipo === 'texto') return;
        if (!MARCAS.includes(valor)) {
          erros.push(`${onde}: ${rel} '${valor}' não é marca do formulário`
            + ` (${MARCAS.filter(Boolean).join(', ')} ou vazio)`);
        }
      });
    });
  });
}

/**
 * `observado` — as marcas dos três eixos. **Reformado em 06/11/2026**: o formulário deixou de o
 * escrever (não tinha aluna nem chave de coluna, e por isso nenhuma pergunta do catálogo o podia
 * ler — o «por aluna» é a matriz, nos blocos da folha). Fica aqui porque um arquivo que o tenha é
 * aceite, não recusado: retirar o campo é decisão de quem o escreveu, não deste validador.
 *
 * O QUE ELE CONFERE, E POR QUÊ: o eixo tem de ser um dos três (é a chave da leitura, e um eixo
 * inventado some das vistas sem aviso); o item tem de ser texto não vazio (é a redação que veio
 * do PO, e um item vazio não diz o que foi olhado); a marca tem de estar no vocabulário do
 * formulário (é o mesmo `MARCAS` das colunas por pessoa); e o mesmo item não pode aparecer duas
 * vezes no mesmo eixo (duas marcas para o mesmo item deixam a leitura ambígua).
 */
function conferirObservado(aula, onde, erros, avisos) {
  const o = aula.observado;
  if (o === undefined) return;
  if (!ehObjeto(o)) { erros.push(`${onde}: observado não é objeto`); return; }
  const fora = Object.keys(o).filter((k) => !EIXOS_DA_AULA.includes(k));
  if (fora.length) {
    erros.push(`${onde}: observado com eixo fora de ${EIXOS_DA_AULA.join('|')}: ${fora.join(', ')}`);
  }
  let total = 0;
  Object.entries(o).forEach(([eixo, lista]) => {
    if (!Array.isArray(lista)) { erros.push(`${onde}: observado.${eixo} não é lista`); return; }
    const vistos = [];
    lista.forEach((x, i) => {
      if (!ehObjeto(x)) { erros.push(`${onde}: observado.${eixo}[${i}] não é objeto`); return; }
      // `semEspaco` quer dizer «tem conteúdo» (é `v.trim() !== ''`) — o nome engana, e por isso a
      // negação é que está certa aqui.
      if (!semEspaco(x.item)) {
        erros.push(`${onde}: observado.${eixo}[${i}] sem o texto do item`);
        return;
      }
      const chave = x.item.trim().toLowerCase();
      if (vistos.includes(chave)) {
        erros.push(`${onde}: observado.${eixo} repete o item '${x.item.trim()}'`);
      }
      vistos.push(chave);
      if (x.marca === undefined || !ehString(x.marca)) {
        erros.push(`${onde}: observado.${eixo}[${i}].marca não é texto`);
      } else if (!MARCAS.includes(x.marca)) {
        erros.push(`${onde}: observado.${eixo}[${i}] '${x.marca}' não é marca do formulário`
          + ` (${MARCAS.filter(Boolean).join(', ')} ou vazio)`);
      }
      total++;
    });
  });
  // Zero item marcado numa aula lançada não é erro (a aula pode não ter sido observada item a
  // item), mas é o caso que se lê errado como «nada aconteceu» — fica o aviso.
  if (!total) avisos.push(`${onde}: observado sem nenhum item — «nada foi marcado» não é «nada aconteceu»`);
}

/**
 * OS BLOCOS DE ITENS — `{aluna: [{item, marca}]}`. É a forma da linha de base revisitada, e a
 * única que o `conferirBlocos` deixava passar sem olhar: o valor de cada pessoa é uma LISTA, não
 * um objecto, e o teste `ehBlocoPorPessoa` dava-a por «forma conferida pelo schema» — que só
 * confere que é um objecto.
 *
 * O QUE SE CONFERE: a chave é um apelido do PO (não se inventa gente), o item tem texto (é a
 * redação que o professor leu), e a marca está no vocabulário do formulário. É pouco, e é
 * exactamente o que a matriz escreve.
 */
function conferirItens(aula, onde, apelidos, erros, avisos, tipos) {
  const universo = Object.keys(apelidos || {});
  Object.keys(aula).forEach((nome) => {
    if (nome.startsWith('_') || CHAVES_ESCALARES.includes(nome)) return;
    const bloco = aula[nome];
    if (!ehObjeto(bloco)) return;
    const valores = Object.values(bloco);
    if (!valores.length || !valores.every(Array.isArray)) return;   // não é bloco de itens
    Object.entries(bloco).forEach(([p, lista]) => {
      if (!universo.includes(p)) {
        erros.push(`${onde}: ${nome}.${p} não é apelido do PO`);
      }
      lista.forEach((x, i) => {
        if (!ehObjeto(x)) { erros.push(`${onde}: ${nome}.${p}[${i}] não é objecto`); return; }
        if (!semEspaco(x.item)) erros.push(`${onde}: ${nome}.${p}[${i}] sem o texto do item`);
        // A CHAVE (06/11/2026). É ela que o índice de lançamentos usa para reconhecer o mesmo
        // aspecto entre aulas; sem ela, a marca existe e não encadeia nada. Não é erro (um arquivo
        // escrito antes dela continua válido), é aviso — e o aviso diz o que se perde.
        if (x.chave === undefined) {
          avisos.push(`${onde}: ${nome}.${p}[${i}] sem chave — a marca não será encadeada entre`
            + ' aulas pelo índice de lançamentos');
        } else if (!semEspaco(x.chave) || !/^[a-z0-9]+(_[a-z0-9]+)*$/.test(x.chave)) {
          erros.push(`${onde}: ${nome}.${p}[${i}].chave '${x.chave}' não é um slug`
            + ' (minúsculas, algarismos e `_`) — `Vistas.helpers.chaveDoItem` é a regra');
        }
        /* O TIPO DECLARADO MANDA TAMBÉM AQUI (26/11/2026) — e faltava.
         *
         * A `linha_de_base` é um bloco de ITENS, não um bloco por pessoa, e era a única coluna em
         * que este validador ainda exigia as cinco marcas. Só que a página, desde a decisão de
         * 22/11 («uma folha, uma régua»), desenha essa coluna como `rubrica` quando a folha mede
         * critérios pela régua da turma — e níveis como «Domina» ou «Satisfatório» passaram a ser
         * legítimos. O resultado foi o pior possível: **o lançamento da pesquisadora foi aceite
         * pelo servidor e recusado pelo validador do próprio repositório**, e o `pre-commit`
         * bloqueou o commit seguinte com dez erros sobre um registo verdadeiro.
         *
         * A regra é a mesma dos blocos por pessoa, e a fonte é a mesma: o `tipo` que a captura da
         * aula declara para a coluna. `rubrica` e `texto` são de DOMÍNIO ABERTO — quem os declara é
         * a escola, e fechá-los aqui seria esta ferramenta a inventar vocabulário. A marca, essa,
         * continua fechada. Sem a captura (escola que ainda não gerou o pacote), vale o vocabulário
         * de antes, e nenhuma guarda antiga enfraquece. */
        const colunaDaBase = (tipos && tipos[nome]) || {};
        const tipoDoItem = colunaDaBase.observado_na_aula
          || colunaDaBase[Object.keys(colunaDaBase)[0]] || 'marca';
        if (x.marca === undefined || !ehString(x.marca)) {
          erros.push(`${onde}: ${nome}.${p}[${i}].marca não é texto`);
        } else if (tipoDoItem === 'rubrica' || tipoDoItem === 'texto') {
          /* domínio aberto — ver o comentário acima */
        } else if (!MARCAS.includes(x.marca)) {
          erros.push(`${onde}: ${nome}.${p}[${i}] '${x.marca}' não é marca do formulário`
            + ` (${MARCAS.filter(Boolean).join(', ')} ou vazio)`);
        }
      });
    });
  });
}

function conferirAula(aula, id, apelidos, erros, avisos, provisorios, tipos) {
  const onde = `aula ${id}`;
  const { erros: e, avisos: a, provisorios: p } = validar(aula, SCHEMA_AULA, {});
  e.forEach((x) => erros.push(`${onde}: ${x}`));
  a.forEach((x) => avisos.push(`${onde}: ${x}`));
  p.forEach((x) => provisorios.push(`${onde}: ${x}`));

  conferirOrdem(aula, ORDEM_AULA, onde, avisos);

  if (semEspaco(aula.data) && !ehData(aula.data)) {
    erros.push(`${onde}: data '${aula.data}' não é AAAA-MM-DD`);
  }
  if (aula.duracao_min !== undefined && (!ehInteiro(aula.duracao_min) || aula.duracao_min <= 0)) {
    erros.push(`${onde}: duracao_min ${JSON.stringify(aula.duracao_min)} não é inteiro positivo`);
  }
  // O CARIMBO POR AULA — §4.1. Ele é OPCIONAL aqui de propósito: os três ciclos reais ainda têm
  // só o da raiz (o formulário antigo gravava lá), e o leitor cai para a raiz. O aviso é o
  // registro da migração, não uma regressão.
  if (aula.ultimo_lancamento === undefined) {
    avisos.push(`${onde}: sem carimbo próprio — a §4.1 decide \`ultimo_lancamento\` DENTRO da aula;`
      + ' o leitor usa o da raiz (o formulário antigo gravava lá)');
  } else if (semEspaco(aula.ultimo_lancamento) && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(aula.ultimo_lancamento)) {
    avisos.push(`${onde}: ultimo_lancamento '${aula.ultimo_lancamento}' não é ISO até o minuto`);
  }

  const cc = aula.condicoes_contorno;
  if (ehObjeto(cc)) conferirContorno(cc, onde, erros, avisos);

  let presentes = [];
  if (ehObjeto(apelidos)) presentes = conferirParticao(aula, apelidos, onde, erros).presentes;

  conferirBlocos(aula, onde, presentes, erros, avisos, tipos);
  conferirItens(aula, onde, apelidos, erros, avisos, tipos);
  conferirObservado(aula, onde, erros, avisos);

  // A duração funcional por pessoa é do bloco; a da aula é a referência. Divergir é possível
  // (a pessoa chegou depois, saiu antes) — por isso AVISO, e não erro.
  if (ehBlocoPorPessoa(aula.funcional) && ehInteiro(aula.duracao_min)) {
    Object.entries(aula.funcional).forEach(([p, m]) => {
      if (ehInteiro(m.duracao_min) && m.duracao_min !== aula.duracao_min) {
        avisos.push(`${onde}: funcional.${p}.duracao_min ${m.duracao_min} difere da duração da aula`
          + ` (${aula.duracao_min})`);
      }
    });
  }

  const rel = aula.relatorio;
  if (ehObjeto(rel)) {
    if (rel.texto !== undefined && !semEspaco(rel.texto)) {
      avisos.push(`${onde}: relatorio.texto vazio — é a prosa crua da aula (§4.6 leitura 2)`);
    }
    ['surpresas', 'ajustes'].forEach((k) => {
      if (rel[k] === undefined) {
        avisos.push(`${onde}: relatorio.${k} ausente — o formulário o emite sempre (vazio é '')`);
      } else if (!ehString(rel[k])) {
        erros.push(`${onde}: relatorio.${k} não é texto`);
      }
    });
  }
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const [caminho] = args.filter((a) => !a.startsWith('--'));
  if (!caminho) {
    console.error('uso: node tools/validar-dados-ciclo.js <ciclo-XX[-<escola>]-dados.json> [--json]');
    return 2;
  }

  let texto;
  try {
    texto = fs.readFileSync(caminho, 'utf8');
  } catch (e) {
    console.error(`erro: não consegui ler ${caminho} (${e.message})`);
    return 1;
  }
  // O ENVELOPE É DERIVADO (§2b do check-pacote.js): a fonte é o texto plano. Recusar aqui é o
  // mesmo que o `renomear-chaves-dados.js` faz, e evita dar "ok" no artefato errado.
  if (/_cifrado/.test(texto.slice(0, 400))) {
    console.error(`erro: ${path.basename(caminho)} é o ENVELOPE CIFRADO (derivado), não a fonte —`
      + ' valide o texto plano (ciclos/ciclo-XX[-<escola>]-dados.json).');
    return 1;
  }

  let dados;
  try {
    dados = JSON.parse(texto);
  } catch (e) {
    console.error(`erro: ${path.basename(caminho)} não é JSON válido (${e.message})`);
    return 1;
  }
  if (!ehObjeto(dados)) {
    console.error(`erro: ${path.basename(caminho)} não é um objeto JSON na raiz`);
    return 1;
  }

  /* OS TIPOS DA CAPTURA, quando o pacote os declara — ver `tiposDaCaptura`. Sem eles, o
   * vocabulário fechado das marcas responde como sempre respondeu. */
  const tiposPorAula = tiposDaCaptura(dados, caminho);

  const erros = [];
  const avisos = [];
  const provisorios = [];
  const { erros: errosRaiz, avisos: avisosRaiz, provisorios: provisoriosRaiz, extras } =
    validar(dados, SCHEMA_RAIZ, {});
  erros.push(...errosRaiz);
  avisos.push(...avisosRaiz);
  provisorios.push(...provisoriosRaiz);

  extras.forEach((k) => {
    if (k === 'ajustes') {
      // §4.1/§5.1 — a colisão de nomes que o experimento encontrou: a raiz `ajustes` (a lista do
      // que mudou, gravada no ato) e `relatorio.ajustes` (a mesma coisa em prosa, por aula).
      avisos.push('colisão de nomes: `ajustes` na RAIZ e `relatorio.ajustes` na aula (§4.1/§5.1)'
        + ' — diga qual é o dono antes de criar o campo');
      return;
    }
    avisos.push(`campo da raiz que este validador não conhece: '${k}' — declarado, nunca inventado`);
  });

  conferirOrdem(dados, ORDEM_RAIZ, 'raiz', avisos);

  // A raiz contra o NOME do arquivo: `ciclo-01-diaghilev-dados.json`. O validador não lê o .conf (a
  // variante não decide nada aqui — o JSON declara a sua escola) e por isso não recebe `--variante`.
  const doNome = /^ciclo-(\d+)(?:-([a-z0-9]+))?-dados\.json$/.exec(path.basename(caminho));
  if (doNome) {
    const [, numero, escola] = doNome;
    if (ehString(dados.ciclo) && dados.ciclo.replace(/^0+/, '') !== numero.replace(/^0+/, '')) {
      avisos.push(`ciclo '${dados.ciclo}' no conteúdo e '${numero}' no nome do arquivo`);
    }
    if (escola && ehString(dados.escola) && dados.escola !== escola) {
      avisos.push(`escola '${dados.escola}' no conteúdo e '${escola}' no nome do arquivo`);
    }
  }

  if (ehObjeto(dados.apelidos) && Object.keys(dados.apelidos).length === 0) {
    erros.push('apelidos: nenhum apelido — a lista vem do PO (P-12)');
  }
  if (ehObjeto(dados.apelidos)) {
    // O aviso de "nome completo em claro" só vale quando o texto NÃO é o apelido expandido (o
    // 'Pássaro Azul' de 'passaro-azul' é o apelido, e não um nome). Compara-se sem acento, sem
    // separador e sem caixa — senão a própria convenção de apelido vira falso positivo.
    const chato = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    Object.entries(dados.apelidos).forEach(([apelido, nome]) => {
      if (!ehString(nome)) {
        erros.push(`apelidos.${apelido} não é texto (o valor é o nome de exibição)`);
        return;
      }
      const duasPalavras = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+\s+\S/.test(nome.trim());
      if (duasPalavras && chato(nome) !== chato(apelido)) {
        avisos.push(`apelidos.${apelido} guarda '${nome}', com duas palavras capitalizadas —`
          + ' a convenção são APELIDOS estáveis, e nome completo não entra em claro');
      }
    });
  }

  const aulas = dados.aulas;
  if (ehObjeto(aulas)) {
    Object.entries(aulas).forEach(([id, aula]) => {
      if (!/^\d{2}$/.test(id)) {
        erros.push(`aulas: id '${id}' não é de dois dígitos (o id é a chave, zero à esquerda)`);
      }
      if (!ehObjeto(aula)) {
        erros.push(`aula ${id}: não é objeto`);
        return;
      }
      conferirAula(aula, id, dados.apelidos, erros, avisos, provisorios,
        tiposPorAula && tiposPorAula[String(id)]);
    });
  }

  const ids = ehObjeto(aulas) ? Object.keys(aulas) : [];
  const escrever = json ? (...x) => console.error(...x) : (...x) => console.log(...x);

  if (json) process.stdout.write(`${JSON.stringify(dados, null, 2)}\n`);

  const problemas = [...new Set(erros)];
  if (problemas.length) {
    console.error(`dados ${path.basename(caminho)} × as regras do lançamento (§4.1, §4.3, §4.6)`);
    console.error(`${problemas.length} problema(s):`);
    problemas.forEach((p) => console.error(`  - ${p}`));
    if (avisos.length) {
      console.error(`    aviso(s): ${avisos.length}`);
      avisos.forEach((x) => console.error(`      · ${x}`));
    }
    return 1;
  }

  escrever(`ok: ${path.basename(caminho)} satisfaz as regras do JSON de dados`
    + ` (${SCHEMA_RAIZ.required.length} campos obrigatórios na raiz,`
    + ` ${SCHEMA_AULA.required.length} por aula)`);
  escrever(`    ciclo ${dados.ciclo} · escola ${dados.escola} · professor ${dados.professor}`
    + ` · ${ids.length} aula(s) lançada(s) · ${ehObjeto(dados.apelidos) ? Object.keys(dados.apelidos).length : 0} apelido(s)`);
  if (ids.length) {
    const resumo = ids.map((id) => {
      const a = aulas[id];
      const p = Array.isArray(a.presentes) ? a.presentes.length : 0;
      const au = Array.isArray(a.ausentes) ? a.ausentes.length : 0;
      return `${id} (${a.data}: ${p} presente(s) · ${au} ausente(s))`;
    }).join(' · ');
    escrever(`    aulas conferidas: ${resumo}`);
  } else {
    escrever('    nenhuma aula lançada — estado legítimo (o ciclo ainda não teve lançamento)');
  }
  // O PRAZO É REPORTADO, NUNCA AFIRMADO: quem o calcula é o `ciclos.json`, a partir do calendário
  // e do `horario` de cada aula (§3.1). O validador apenas o mostra — afirmá-lo aqui seria conferir
  // um campo que este arquivo não recebe.
  escrever(`    prazo: reportado, não conferido — o cálculo é do ciclos.json`
    + ' (ancora sai nula enquanto não houver produtor)');
  escrever(`    lacunas declaradas: ${LACUNAS.length} — o JSON cobre a aula, não o PO nem o plano`
    + ' (§4.6)');
  LACUNAS.forEach(([campo, motivo]) => escrever(`      · ${campo} — ${motivo}`));
  GRAFO.split('\n').forEach((l) => escrever(l));
  if (provisorios.length) {
    escrever(`    provisórios '[Preencher]': ${provisorios.length} —`
      + ` ${provisorios.join(', ')} (decisão do professor, não do validador)`);
  }
  if (avisos.length) {
    escrever(`    avisos: ${avisos.length}`);
    avisos.forEach((a) => escrever(`      · ${a}`));
  }
  return 0;
}

process.exit(main());
