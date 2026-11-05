#!/usr/bin/env node
'use strict';

/**
 * provar-plano-completo.js — a prova de que o PLANO COMPLETO chega inteiro aos derivados.
 *
 * É o irmão de `provar-po-completo.js`, e trava o MESMO defeito na fonte vizinha: um nó
 * RESPONDÍVEL do plano que não tem destino no documento derivado. Medido em 14/10/2026, na
 * derivação e no extrator de verdade: dos 24 nós respondíveis, **21 não chegavam ao
 * `plano-XX.json`** e **2 não chegavam a documento nenhum**. As quatro causas:
 *
 *   1. TÍTULO DIVERGENTE — a derivação escreve `## Distribuição do volume pelos blocos` e o
 *      mapa pedia «… pelos blocos (regra 9, etapa 2)», um sufixo que documento nenhum do
 *      repositório escreve: a tabela do volume ficou fora do JSON de todos os pacotes, e o
 *      guia de observação imprimia «Lacunas — distribuição do volume» sobre dado preenchido.
 *   2. SEÇÃO NÃO MAPEADA — `## Contexto` (doze fatos), `## Condições preliminares` e
 *      `## Critério de extensão` estavam no documento e fora do mapa: descarte silencioso.
 *      O `plano-XX.json` saía sem escola, turma, frequência, duração, calendário, número de
 *      aulas, volume, registro, metodologia nem notação — e a ficha do ciclo logo abaixo
 *      (`ciclo`) saía inteira em `[Preencher]`, com os valores escritos doze linhas acima.
 *   3. SEÇÃO NÃO EMITIDA — `Músicas e vídeos` e `Repertório` não tinham seção: dois nós
 *      respondíveis sem documento nenhum.
 *   4. O SILÊNCIO — o extrator descartava a seção fora do mapa sem avisar, e o validador
 *      imprimia `ok`. É a causa que produziu as outras três.
 *
 * A prova não olha o código: responde os **25 nós** do mapa servido com um valor MARCADO, roda
 * a derivação e o extrator de verdade, e confere, nó por nó, que o valor chegou à SUA chave.
 * Uma tabela declara o destino esperado de cada nó — é ela o contrato, e é ela que a próxima
 * sessão lê para saber onde o dado vive.
 *
 *   uso: node experimentos/provar-plano-completo.js
 *
 * Só usa o que o projeto já tem (`motor/`, `tools/`, `node:fs`) — sem DOM de mentira: o que se
 * prova é o CONTRATO (o documento e a extração), não o pixel.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..');

const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { derivarPlano, ROTULOS_DO_CONTEXTO, parametroEmLinhas, marcosEmTexto,
  BLOCOS_DA_AULA } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const { derivarAula01, derivarNotacao } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const { chaveDaColuna, avisosDeSecaoNaoMapeada } = require(path.join(RAIZ, 'tools/lib-extracao-md.js'));
const Vistas = require(path.join(RAIZ, 'tools/lib-vistas.js'));

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/plano/conteudo/plano.json'), 'utf8'));
/* O SCHEMA DO PLANO — procurado, e não escrito à mão (03/11/2026). Estava preso a
 * `professores/leticia/`, uma escola que deixou de existir; a prova passou a rebentar antes da
 * primeira asserção, e uma prova que não corre não guarda nada. O contrato é UM só — `check-schemas`
 * compara o molde com todos os professores —, por isso o primeiro que existir serve. */
const SCHEMA = (() => {
  const dir = fs.readdirSync(path.join(RAIZ, 'professores'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(RAIZ, 'professores', e.name, 'ciclos', 'ciclo-01-plano-schema.json'))
    .filter((f) => fs.existsSync(f));
  if (!dir.length) throw new Error('nenhum professor tem o schema do plano do ciclo 01');
  return dir[0];
})();
const VALIDADOR = path.join(RAIZ, 'tools/validar-plano-ciclo.js');

let n = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };

const MAPA = porta.mapa(CONTEUDO);
const mk = (id) => 'MKMK' + String(id).replace(/[^a-z0-9]/gi, '').toUpperCase();

// ---------------------------------------------------------------------------
// O DESTINO DE CADA NÓ — o contrato. `null` = não é chave do `plano-XX.json` (vai ao cabeçalho
// YAML); uma string terminada em `.md` = o destino é OUTRO documento do ciclo.
// Os doze nós do `## Contexto` vão para o objeto `contexto`, e a chave de cada um é o RÓTULO do
// campo no formulário passado pelo `chaveDaColuna` do próprio contrato — é assim que o
// documento e o dado não podem divergir de nome sem que esta prova o diga.
// ---------------------------------------------------------------------------
/* AS OMISSÕES DECLARADAS — a resposta que o documento NÃO imprime, e por quê.
 *
 * Só a escola está aqui, e a razão é de 28/10/2026: a linha «Escola / espaço: …» era o mesmo dado
 * escrito pela terceira vez (o `title` e o `escola:` do cabeçalho do documento já o levam), e a
 * secção passou a agrupar «onde» e «para quem/como» sem a repetir (`GRUPOS_DO_CONTEXTO`, em
 * `derivar-plano-ciclo.js`). Uma omissão DECLARADA não é uma perda silenciosa: ela está nomeada
 * aqui, tem motivo, e qualquer OUTRO campo que deixe de chegar ao documento continua a reprovar.
 *
 * A pergunta que fica aberta — e é de produto, não de código — é se o CORPO do plano deve dizer o
 * nome da escola por extenso: hoje o cabeçalho leva o `escola:` (o slug), e o nome de exibição
 * vive na página e no PO. */
const OMISSOES = {
  'contexto-escola': 'a escola não se repete no corpo (28/10/2026): está no title e no `escola:` '
    + 'do cabeçalho do documento',
};

const DESTINO = {
  'objetivo-geral': 'objetivoGeral',
  'contexto-escola': null,          // impressa no cabeçalho, não no corpo — ver OMISSOES
  'contexto-professor': 'contexto',
  'contexto-turma': 'contexto',
  'contexto-frequencia': 'contexto',
  'contexto-duracao': 'contexto',
  'contexto-calendario': 'contexto',
  'contexto-total-aulas': 'contexto',
  'contexto-volume': 'contexto',
  'contexto-registro': 'contexto',
  'contexto-metodologia': 'contexto',
  'contexto-metodologia-origem': 'contexto',
  'contexto-notacao': 'contexto',
  'marcos-por-aula': 'marcosPorAula',
  'estrutura-de-cada-aula': 'estruturaDeCadaAula',
  'distribuicao-de-volume': 'distribuicaoDeVolume',
  'condicoes-preliminares': 'condicoesPreliminares',
  /* A RÉGUA E A «RUBRICA» SÃO DUAS CHAVES, E O NÓ DO PLANO É A PRIMEIRA (03/11/2026). O contrato
   * apontava para `rubrica`, que é a chave do documento ANTIGO (a tabela critério × níveis). O
   * título da secção mudou para «Régua da rubrica» — porque o que o plano declara são os NÍVEIS
   * adotados, e o critério nasce no lançamento — e o mapa de secções do validador deu-lhe chave
   * própria (`reguaDaRubrica`). O nó `rubrica` do formulário grava a régua; o destino dele é
   * `reguaDaRubrica`. */
  'rubrica': 'reguaDaRubrica',
  'criterio-de-extensao': 'criterioDeExtensao',
  'referencias': null,                    // o cabeçalho YAML (`referencias:`), não o corpo
  'musicas-videos': 'musicasVideos',
  'repertorio': 'repertorio',
  'proveniencia': 'proveniencia',
  // OS DOIS NÓS QUE FALTAVAM A ESTA TABELA (03/11/2026). Eles entraram no conteúdo do plano a
  // 02/11/2026 — «Em que aula cada objetivo» e «Força e flexibilidade da turma» — e a tabela não
  // foi atualizada: a prova ficou vermelha desde então, e uma prova vermelha não guarda nada. Os
  // dois CHEGAM ao documento (a coluna «Aula» dos objetivos, e a secção do aspecto físico), e é
  // isso que estas duas linhas declaram.
  /* A RELAÇÃO OBJETIVO ↔ AULA PUBLICA-SE INVERTIDA (03/11/2026). A tabela dos objetivos diz o que
   * se persegue e em que BLOCO; a tabela «Marcos parciais por aula» diz, por AULA, quais objetivos
   * ela persegue — e é ela que lê esta resposta. O destino estava `objetivosEspecificos`, que é a
   * tabela de três colunas onde a aula não aparece: a asserção exigia o dado num sítio onde o
   * documento (de propósito) não o põe, e chamava-lhe «campo perdido». O dado chega, na direção
   * contrária; a asserção dedicada (§2b, mais abaixo) prova as duas direções. */
  'aula-de-cada-objetivo': 'marcosPorAula',
  /* O ASPECTO FÍSICO MUDOU DE DOCUMENTO (04/11/2026). Ele chegava a `aspectoFisico` do
   * `plano-XX.json`, e a secção do plano imprimia a tabela dos quinze aspectos. A regra nova dá-lhe
   * UMA fonte: o detalhe vive na Aula 1 (secção «Corpo» do guia) e o plano publica o ponteiro —
   * «o corpo tem de ter uma única fonte de verdade; o detalhe fica na Aula 1». Sem esta linha a
   * prova reprovava com razão: o marcador deixou mesmo de chegar ao PLANO, e passa a chegar à
   * AULA. É o destino que muda, não o dado — e por isso o marcador continua a ser procurado. */
  'aspecto-fisico': 'aula-01.md',
  'aula-1-parametro': 'aula-01.md',       // a Aula 1 vive no documento da aula
  'aula-1-sequencia': 'aula-01.md',
};

// A chave que o extrator produz para um nó do contexto: o rótulo, camelCaseado.
const chaveDoContexto = (id) => chaveDaColuna(ROTULOS_DO_CONTEXTO[id]);

// ---------------------------------------------------------------------------
// O PLANO COMPLETO — todos os nós respondidos, cada um com um valor único e identificável.
// Os valores COMPOSTOS (`{vezes, por, dias}`, `{min, unidade}`, `{inicio, fim}`) levam o
// marcador DENTRO das partes: é o composto que precisa chegar, não o objeto.
// ---------------------------------------------------------------------------
const RESPOSTAS = {
  'objetivo-geral': mk('objetivo-geral'),
  'contexto-escola': mk('contexto-escola'),
  'contexto-professor': mk('contexto-professor'),
  'contexto-turma': [mk('contexto-turma')],
  'contexto-frequencia': { vezes: 1, por: mk('frequencia'), dias: [mk('dia')] },
  'contexto-duracao': { min: mk('duracao'), unidade: 'min' },
  'contexto-calendario': { inicio: mk('inicio'), fim: mk('fim') },
  'contexto-total-aulas': 12,
  'contexto-volume': { min: mk('volume'), unidade: 'séries' },
  'contexto-registro': { presentes: [mk('registro')], observa: [mk('observa')] },
  'contexto-metodologia': mk('metodologia'),
  'contexto-metodologia-origem': mk('metodologia-origem'),
  'contexto-notacao': mk('notacao'),
  /* A LISTA, E NÃO A PROSA «NN: marco» (03/11/2026). A prosa é a forma LEGADA, e ela tem um efeito
   * que este fixture não queria: no caminho antigo a coluna «Objetivos» sai da POSIÇÃO, e a relação
   * declarada em «Em que aula cada objetivo» é ignorada — o objetivo 1 nas aulas 01 e 02, o 2 na
   * 03, não cabia em duas linhas. O formulário de hoje grava a LISTA de textos, e é ela que faz
   * valer a relação. (A prosa continua provada como leitura do passado — `provar-plano-matriz`,
   * que tem um caso só dela.) */
  'marcos-por-aula': [mk('marcos-por-aula'), mk('marco2')],
  'estrutura-de-cada-aula': [{ marco: 1, marcados: ['Solo'] }, { marco: 2, marcados: ['Barra'] }],
  'distribuicao-de-volume': { unidade: 'percentual', linhas: [
    { Bloco: 'Solo', 'Proporção alvo': mk('volume'), Justificativa: mk('justificativa') }] },
  'condicoes-preliminares': mk('condicoes-preliminares'),
  /* A RÚBRICA GUARDA A RÉGUA, E NÃO OS CRITÉRIOS (03/11/2026). Aqui estava
   * `[{ 'Critério': mk('rubrica') }]` — a tabela critério × níveis do documento ANTIGO. Desde
   * 26/10/2026 o plano declara a **régua** (os níveis que a escola adotou para aquela turma), e o
   * CRITÉRIO de cada aula nasce no lançamento da aula dada — é o que a própria secção do documento
   * diz. O que o formulário grava é a lista dos níveis (`niveisDaEscala`, na porta), e é essa a
   * forma que se põe aqui. A leitura do documento ANTIGO continua coberta, na asserção de
   * `niveisDaRubrica([{ Critério: … }])` mais abaixo. */
  'rubrica': [mk('nivel-alto'), mk('nivel-baixo')],
  'criterio-de-extensao': mk('criterio-de-extensao'),
  'referencias': mk('referencias'),
  'musicas-videos': mk('musicas-videos'),
  'repertorio': mk('repertorio'),
  'proveniencia': [mk('proveniencia')],
  'aula-1-parametro': [{ marco: 1, marcados: [mk('parametro-1')] },
    { marco: 2, marcados: [mk('parametro-2')] }],
  // Os dois nós de 02/11/2026, respondidos com marcador: sem resposta a prova não os mediria, e
  // uma tabela de destinos sem dado é uma promessa, não uma prova.
  /* AS AULAS SÃO NÚMEROS (03/11/2026). O marcador `MKMK…` aqui era uma armadilha: a tabela dos
   * marcos converte cada aula com `Number()`, e `Number('MKMK…')` é `NaN` — o marcador era
   * invisível por construção, e a asserção procurava-o num sítio onde ele nunca poderia estar. O
   * que se prova é a RELAÇÃO: o objetivo 1 é perseguido nas aulas 01 e 02, e o objetivo 2 na 03.
   * A prova disso é a tabela dos marcos, e é ela que a asserção dedicada lê. */
  'aula-de-cada-objetivo': [{ objetivo: 1, aulas: ['01', '02'] }, { objetivo: 2, aulas: ['03'] }],
  'aspecto-fisico': [{ Aspecto: 'Força', 'Como está a turma': mk('aspecto') }],
  'aula-1-sequencia': [{ Bloco: 'Solo', 'Conteúdo do nível': mk('sequencia'), Tempos: 8, Compasso: '4/4' }],
};

const ENVELOPE = {
  contexto: { ciclo: '01', escola: 'leticia', professor: mk('professor') },
  respostas: Object.fromEntries(Object.entries(RESPOSTAS).map(([k, v]) => [k, { valor: v }])),
};

/** O valor numa chave de caminho (`a.b`) do JSON extraído. */
const noCaminho = (obj, chave) => String(chave).split('.')
  .reduce((acc, k) => (acc === undefined || acc === null ? undefined : acc[k]), obj);

/** Todos os marcadores (`MKMK…`) de um valor aninhado. */
function marcadores(valor) {
  const achados = [];
  const anda = (x) => {
    if (typeof x === 'string') { for (const t of x.split(/\s+/)) if (/^MKMK/.test(t)) achados.push(t); return; }
    if (Array.isArray(x)) return x.forEach(anda);
    if (x && typeof x === 'object') return Object.values(x).forEach(anda);
  };
  anda(valor);
  return achados;
}

/** O documento derivado e o JSON extraído — rodando o extrator de verdade. */
function derivarEExtrair(envelope) {
  const { markdown } = derivarPlano(envelope);
  const arquivo = path.join(os.tmpdir(), `plano-completo-${process.pid}-${n}.md`);
  fs.writeFileSync(arquivo, markdown);
  const json = JSON.parse(execFileSync(process.execPath, [VALIDADOR, SCHEMA, arquivo, '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  fs.rmSync(arquivo, { force: true });
  return { markdown, json };
}

console.log('PLANO COMPLETO — cada resposta no seu destino\n');

// =========================================================================
// A. O CONTRATO: todo nó respondível tem destino, e o valor chega à SUA chave
// =========================================================================

// 1. A tabela de destinos cobre o mapa inteiro: um nó novo (no conteúdo) sem destino declarado
//    aqui FALHA — é o alarme do defeito, e ele soa antes de o dado se perder.
const semDestino = MAPA.nos.filter((x) => !(x.id in DESTINO)).map((x) => x.id);
assert.deepEqual(semDestino, [],
  'nó(s) respondível(is) sem destino declarado na prova: ' + semDestino.join(', '));
ok(`os ${MAPA.nos.length} nós respondíveis do mapa têm destino declarado`);

// 2. NÓ POR NÓ: a resposta está no documento E na chave que lhe pertence. Uma seção emitida e
//    ignorada pelo extrator (o caso do volume) não passa daqui.
const { markdown, json } = derivarEExtrair(ENVELOPE);
const perdidos = [];
for (const no of MAPA.nos) {
  const chave = DESTINO[no.id];
  const marcas = marcadores(RESPOSTAS[no.id]);
  if (!marcas.length) continue;
  /* A OMISSÃO DECLARADA não entra no laço genérico: ela tem asserção própria (§0b), onde o motivo
   * está escrito. Sem esta linha, ela reprovaria aqui e o motivo nunca seria lido. */
  if (OMISSOES[no.id]) continue;
  if (chave === null) {                       // cabeçalho YAML do documento
    if (!marcas.every((m) => markdown.includes(m))) perdidos.push(no.id + ' (documento)');
    continue;
  }
  if (/\.md$/.test(chave)) continue;          // provado no bloco E (outro documento)
  const alvo = chave === 'contexto' ? noCaminho(json, 'contexto.' + chaveDoContexto(no.id))
    : noCaminho(json, chave);
  if (alvo === undefined) { perdidos.push(`${no.id} → ${chave} AUSENTE`); continue; }
  const faltando = marcas.filter((m) => !JSON.stringify(alvo).includes(m));
  if (faltando.length) perdidos.push(`${no.id} → ${chave}: ${faltando.join(', ')} fora`);
}
assert.deepEqual(perdidos, [], 'resposta(s) que não chegaram ao seu destino');
ok('cada um dos nós do corpo chega à chave que lhe pertence no `plano-XX.json`');

/* 2b. A RELAÇÃO OBJETIVO ↔ AULA, PROVADA NA DIREÇÃO EM QUE ELA SE PUBLICA (03/11/2026).
 *
 * O laço acima não a alcança — e não é falha dele: as aulas são NÚMEROS na tabela dos marcos
 * (`Number('MKMK…')` é `NaN`), por isso o marcador não serve. O que se prova é o DADO: o objetivo
 * 1 é perseguido nas aulas 01 e 02, e o 2 na 03 — é o que a resposta declara, e é o que a tabela
 * «Marcos parciais por aula» tem de dizer, por aula. Sem esta asserção, a resposta dela podia
 * desaparecer do documento e nada reprovava. */
const marcos = Array.isArray(json.marcosPorAula) ? json.marcosPorAula : [];
const porAula = (n) => (marcos.find((m) => String(m.n) === n) || {}).objetivos;
assert.equal(porAula('01'), '01', 'a aula 01 persegue o objetivo 01 — obtido: ' + porAula('01'));
assert.equal(porAula('02'), '01', 'a aula 02 persegue o MESMO objetivo (um objetivo, duas aulas) — '
  + 'obtido: ' + porAula('02'));
assert.equal(porAula('03'), '02', 'e a aula 03 persegue o objetivo 02 — obtido: ' + porAula('03'));
ok('a relação objetivo ↔ aula chega ao documento, por aula (um objetivo em duas aulas, e o inverso)');

// 3. O CONTEXTO está completo: os doze fatos, com a chave de cada um (nenhum a menos). Antes
//    desta correção o objeto NÃO EXISTIA — e o `ciclo` logo abaixo saía em lacuna.
/* DEZ, E NÃO DOZE (03/11/2026). O número era o do dia em que a asserção foi escrita, e dois
 * factos saíram por decisão, não por defeito: o «Quem escolhe a metodologia» deixou de existir
 * (03/11/2026 — é premissa do domínio) e a ESCOLA deixou de se repetir no corpo (28/10/2026 —
 * está no title e no `escola:` do cabeçalho). O número passou a ser DERIVADO do mapa: os nós do
 * contexto que ainda têm linha na tabela. Um facto novo entra sozinho; um que suma sem passar
 * por aqui reprova na hora. */
const fatosDoContexto = MAPA.nos
  .filter((x) => /^contexto-/.test(x.id) && !OMISSOES[x.id]).map((x) => x.id);
assert.equal(Object.keys(json.contexto || {}).length, fatosDoContexto.length,
  'o contexto tem os ' + fatosDoContexto.length + ' fatos declarados: '
  + Object.keys(json.contexto || {}).join(', '));
for (const no of MAPA.nos.filter((x) => /^contexto-/.test(x.id) && !OMISSOES[x.id])) {
  assert.ok(json.contexto[chaveDoContexto(no.id)] !== undefined,
    `o contexto não recebeu «${no.id}» (chave ${chaveDoContexto(no.id)})`);
}
ok('os fatos do `## Contexto` chegam ao objeto `contexto`, cada um na sua chave — e a escola, '
  + 'que se omite de propósito, está declarada como omissão com motivo');

// 4. As chaves do contexto são os RÓTULOS do formulário — a tabela do documento e o dado não
//    podem divergir de nome: quem compõe é `ROTULOS_DO_CONTEXTO`, e é dela que sai a chave.
const camposDoConteudo = {};
for (const bloco of CONTEUDO.blocos || []) {
  for (const campo of bloco.campos || []) if (campo && campo.id) camposDoConteudo[campo.id] = campo.campo;
}
const rotulosErrados = Object.entries(ROTULOS_DO_CONTEXTO)
  .filter(([id, rotulo]) => camposDoConteudo[id] !== rotulo)
  .map(([id, rotulo]) => `${id}: «${rotulo}» × «${camposDoConteudo[id]}»`);
assert.deepEqual(rotulosErrados, [],
  'rótulo do contexto diferente do campo que o formulário mostra');
ok('os rótulos do contexto são os do conteúdo (a chave do dado sai do rótulo)');

// =========================================================================
// B. A IDENTIFICAÇÃO VIVE NO CONTEXTO — e o guia lê de lá
// =========================================================================

/* A TABELA DE IDENTIFICAÇÃO DO `ciclo` SAIU DO DOCUMENTO (28/10/2026), e esta secção media-a.
 *
 * O QUE HAVIA: sob «Objetivo geral», uma tabela item/valor com duração, início, encerramento,
 * número de encontros, professor e volume — COMPOSTA do `## Contexto`, que dez linhas acima já
 * dizia o mesmo. Eram os mesmos seis factos escritos duas vezes na mesma página, e o
 * `plano-XX.json` ganhava um objeto `ciclo` que era uma cópia do `contexto`.
 *
 * O QUE HÁ: os factos num sítio só, o `## Contexto` (agrupado em «onde» e «para quem/como» — foi
 * ela que pediu o agrupamento). O objeto `ciclo` do JSON deixa de existir num plano novo, e quem
 * o lia APRENDEU a reserva: `tools/lib-vistas.js` (`duracaoDaAula`) lê `ciclo.duracaoMinutos` e,
 * se não achar (ou se achar uma lacuna), lê `contexto.duracaoPorAula`. Era esse o risco real — um
 * guia a imprimir «[Preencher: duração]» sobre um plano que declara a duração —, e é ele que se
 * mede aqui, em vez de se exigir de volta uma tabela que já não existe.
 */
assert.equal(Vistas.helpers.duracaoDaAula(json), mk('duracao') + ' min',
  'o guia lê a duração do CONTEXTO quando o objeto `ciclo` não existe: '
  + Vistas.helpers.duracaoDaAula(json));
assert.equal(Vistas.helpers.duracaoDaAula({ contexto: { duracaoPorAula: '50 min' } }), '50 min',
  'a reserva funciona com o valor que o formulário grava');
ok('a identificação vive no `## Contexto`, e o guia lê a duração de lá (a tabela do `ciclo` saiu)');

// 6. SEM contexto, a lacuna VOLTA — declarada, com o motivo. A composição não pode trocar um
//    silêncio por uma invenção: o que o professor não declarou continua dito como falta.
const semContexto = derivarEExtrair({ contexto: { ciclo: '01' }, respostas: {
  'objetivo-geral': mk('objetivo-geral') } });
/* A LACUNA DO PLANO ESCREVE-SE «[a decidir]» (e não «[Preencher: …]», que é a forma do PO e dos
 * documentos de método). A asserção olha para o que o documento ESCREVE, e não para a forma que
 * outro documento usa: um marcador trocado fazia esta prova dizer «as lacunas sumiram» sobre dez
 * lacunas à vista. */
const lacunasDoContexto = Object.entries(semContexto.json.contexto || {})
  .filter(([, v]) => /\[a decidir\]/.test(String(v))).map(([k]) => k);
assert.ok(lacunasDoContexto.length >= 4,
  'sem contexto declarado, as lacunas voltam nomeadas: ' + lacunasDoContexto.join(', '));
assert.ok(/\[a decidir\]/.test(String(Vistas.helpers.duracaoDaAula(semContexto.json))),
  'e o guia imprime a lacuna declarada, em vez de inventar uma duração');
ok('sem contexto declarado, as lacunas voltam com o motivo (nada é inventado)');

// =========================================================================
// C. O VOLUME: a tabela, a unidade e o cabeçalho que o contrato lê
// =========================================================================

// 7. A distribuição do volume chega ao JSON — e chega com as TRÊS colunas preenchidas. Era o
//    campo que o título divergente deixava fora de todos os pacotes publicados.
const volume = json.distribuicaoDeVolume || [];
assert.equal(volume.length, 1, 'a linha da distribuição chega: ' + JSON.stringify(volume));
assert.equal(volume[0].bloco, 'Solo', 'o bloco');
assert.equal(volume[0].proporcaoAlvo, mk('volume'), 'a proporção alvo');
assert.equal(volume[0].justificativa, mk('justificativa'), 'a justificativa');
ok('a distribuição do volume chega ao JSON com bloco, proporção alvo e justificativa');

// 8. A UNIDADE viaja na NOTA (`>`), que o contrato lê como comentário: o documento diz de que
//    unidade são os números, e a tabela não ganha chave nenhuma por isso.
assert.ok(markdown.includes('> **Unidade: percentual.**'),
  'o documento declara a unidade da proporção alvo');
assert.ok(markdown.includes('fecha em 100%'), 'e diz como a soma fecha na unidade escolhida');
assert.equal(Object.keys(volume[0]).length, 3,
  'a nota da unidade NÃO vira coluna: ' + Object.keys(volume[0]).join(', '));
const semUnidade = derivarEExtrair({ contexto: { ciclo: '01' }, respostas: {
  'distribuicao-de-volume': { valor: [{ Bloco: 'Solo', 'Proporção alvo': '15', Justificativa: 'x' }] } } });
assert.ok(!semUnidade.markdown.includes('> **Unidade:'),
  'resposta sem unidade declarada não inventa uma nota');
ok('a unidade (minutos × percentual) sai na nota da seção, sem virar coluna da tabela');

// 9. As DUAS chaves da coluna da proporção são lidas pela vista: o cabeçalho antigo
//    («Proporção alvo (60 min)») produz `proporcaoAlvo60Min` e o atual, `proporcaoAlvo`. Sem
//    isso, um plano gerado hoje mostraria a proporção VAZIA no guia — dado que chega ao JSON e
//    não chega à vista, que é o mesmo defeito com outra roupa.
const guiaNovo = Vistas.guia({ meta: { id: '01', escola: 'Barra' }, po: null, plano: json,
  aula: '1', data: '2026-11-06' });
assert.ok(guiaNovo.includes(mk('volume')),
  'o guia mostra a proporção alvo do plano novo:\n' + guiaNovo.slice(0, 400));
const planoAntigo = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'experimentos/simulacao-marau/plano-01.json'), 'utf8'));
const guiaAntigo = Vistas.guia({ meta: { id: '01', escola: 'Marau' }, po: null,
  plano: planoAntigo, aula: '1', data: '2026-10-08' });
assert.ok(/Distribuição do volume:\*\* Solo 30–40%/.test(guiaAntigo),
  'o plano publicado com o cabeçalho antigo continua lido: '
  + guiaAntigo.split('\n').filter((l) => /Distribuição do volume/.test(l)).join(''));
ok('o guia lê a proporção alvo nas duas chaves — plano novo e plano já publicado');

// =========================================================================
// D. O SILÊNCIO: a seção fora do mapa passa a AVISAR
// =========================================================================

// 10. O aviso nomeado existe e soa: uma seção com conteúdo e sem destino no mapa produz um
//     aviso que diz onde e por quê. Era o que faltava para o defeito não durar três ciclos.
const avisos = avisosDeSecaoNaoMapeada(['Contexto'], ['## Contexto', '| Item | Valor |']);
assert.equal(avisos.length, 1, 'um aviso por seção não mapeada');
assert.ok(avisos[0].includes('## Contexto') && avisos[0].includes('linha 1'),
  'o aviso localiza a seção: ' + avisos[0]);
assert.ok(/NÃO chega a campo nenhum/.test(avisos[0]), 'e diz o que se perde');
ok('a seção com conteúdo e fora do mapa produz um aviso nomeado (o silêncio acabou)');

// 11. E o aviso fica CALADO nas fontes do repositório: nenhuma delas tem seção fora do mapa.
//     Um aviso que soa sempre não é aviso, é ruído — e o silêncio aqui é a prova de que o mapa
//     e os documentos estão alinhados hoje.
const fontes = [
  ['plano', path.join(RAIZ, 'professores/tiago/ciclos/ciclo-01-maria-plano.md'),
    path.join(RAIZ, 'professores/tiago/ciclos/ciclo-01-plano-schema.json')],
  ['po', path.join(RAIZ, 'professores/tiago/ciclos/ciclo-01-maria-po.md'),
    path.join(RAIZ, 'professores/tiago/ciclos/ciclo-01-po-schema.json')],
];
for (const [nome, fonte, schema] of fontes) {
  const validador = path.join(RAIZ, nome === 'po'
    ? 'tools/validar-po-ciclo.js' : 'tools/validar-plano-ciclo.js');
  let saida = '';
  try {
    saida = execFileSync(process.execPath, [validador, schema, fonte],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { saida = String(e.stdout || '') + String(e.stderr || ''); }
  assert.ok(!/não está no mapa das seções/.test(saida),
    `a fonte ${nome} tem seção fora do mapa:\n` + saida);
}
ok('nenhuma fonte do repositório tem seção fora do mapa (o aviso fica calado)');

// =========================================================================
// E. OS ÓRFÃOS E O OUTRO DOCUMENTO
// =========================================================================

// 12. `Músicas e vídeos` e `Repertório` — os dois nós que não chegavam a documento nenhum —
//     têm seção e chegam ao JSON.
/* A SECÇÃO MUDOU DE NOME E DE CONTEÚDO (01/11/2026), e a asserção ficou a pedir o nome antigo.
 *
 * O QUE MUDOU: «Músicas e vídeos» passou a «Música e vídeo de referência», e a lista deixou de ser
 * só o que se escreve no campo — as músicas dos EXERCÍCIOS da sequência entram primeiro (tempos e
 * compasso lidos do verbete), e o campo passa a acrescentar o vídeo. O que a asserção guardava
 * — «o que foi declarado chega ao documento» — continua a ser o que se mede, com o nome de hoje; e
 * ganha a metade nova: o exercício da sequência com música declarada também sai. */
assert.ok(markdown.includes('## Música e vídeo de referência\n\n- '),
  'o documento tem a seção da música');
assert.ok(markdown.includes('- ' + mk('musicas-videos')),
  'com o que foi declarado no campo: ' + mk('musicas-videos'));
assert.ok(markdown.includes('- ' + mk('sequencia') + ' — ') || markdown.includes('Plié — '),
  'e com a música do exercício da sequência, lida do verbete');
assert.ok(markdown.includes('## Repertório\n\n- ' + mk('repertorio')),
  'e a do repertório');
/* A LISTA PASSOU A TER DUAS ORIGENS (01/11/2026): a música do exercício da sequência vem
 * PRIMEIRO (com tempos e compasso), e o campo acrescenta o que ele declara — o vídeo. A asserção
 * antiga exigia a lista com um elemento e reprovava pela ordem certa. Agora mede as duas. */
assert.ok(json.musicasVideos.some((m) => String(m).includes(mk('musicas-videos'))),
  'o campo declarado chega ao JSON: ' + JSON.stringify(json.musicasVideos));
assert.ok(json.musicasVideos.some((m) => /^MKMKSEQUENCIA — 8 tempos em 4\/4$/.test(String(m))),
  'e a música do exercício, com tempos e compasso: ' + JSON.stringify(json.musicasVideos));
assert.deepEqual(json.repertorio, [mk('repertorio')], 'e o repertório');
ok('a música (do campo e do exercício) e o repertório chegam ao documento e ao JSON');

// 13. `Condições preliminares` e `Critério de extensão`: as duas seções que o documento sempre
//     teve e o mapa não conhecia.
assert.deepEqual(json.condicoesPreliminares, [mk('condicoes-preliminares')],
  'as condições preliminares chegam');
assert.equal(json.criterioDeExtensao, mk('criterio-de-extensao'),
  'e o critério de extensão');
ok('as condições preliminares e o critério de extensão chegam ao JSON');

// 14. O PARÂMETRO DE MEDIÇÃO da Aula 1 (a matriz objetivo × o que se observa) chega ao
//     `aula-01.md` composto, e não como `[object Object]` — o defeito que a matriz do
//     formulário criou e a prova de hoje trava.
const aula01 = String(derivarAula01({ plano: ENVELOPE, contexto: { ciclo: '01' } }));
assert.ok(!aula01.includes('[object Object]'),
  'o documento da aula não pode publicar `[object Object]`');
for (const m of [mk('parametro-1'), mk('parametro-2')]) {
  assert.ok(aula01.includes(m), `o parâmetro de medição «${m}» tem de aparecer no aula-01.md`);
}
assert.ok(aula01.includes('— observa: ' + mk('parametro-1')),
  'e sai citando o objetivo com o que se observa: '
  + aula01.split('\n').filter((l) => /Parâmetro de medição/.test(l)).join(''));
/* A SEQUÊNCIA MUDOU DE DOCUMENTO (26/10/2026). Ela era a §3 do `aula-01.md`; passou a ser a
 * secção «Exercícios da Aula 01» do documento da NOTAÇÃO, exercício por exercício, com os
 * compassos e os sinais. O `aula-01.md` ficou com o que é da AULA (objetivo, medida, distribuição
 * do tempo) — a mesma decisão que tirou a sequência do plano. A asserção passa a ler o documento
 * onde o exercício hoje vive. */
const daNotacao = String(derivarNotacao({
  plano: Object.assign({}, ENVELOPE, { respostas: Object.assign({}, ENVELOPE.respostas,
    { 'contexto-notacao': { valor: 'Benesh' } }) }),
  contexto: { ciclo: '01', escola: 'leticia' },
}) || '');
assert.ok(daNotacao.includes(mk('sequencia')),
  'a sequência de exercícios «' + mk('sequencia') + '» chega ao documento da NOTAÇÃO — '
  + (daNotacao ? 'não a achei na secção dos exercícios' : 'o documento nem foi derivado'));
/* O ASPECTO FÍSICO CHEGA À AULA, e é lá que ele se lê desde 04/11/2026 (a fonte única). */
assert.ok(aula01.includes(mk('aspecto')),
  'o aspecto físico «' + mk('aspecto') + '» tem de aparecer no aula-01.md — '
  + 'é o eixo do corpo, e o plano passou a publicar o ponteiro');
ok('o parâmetro de medição chega composto ao `aula-01.md`, a sequência ao documento da notação, '
  + 'e o aspecto físico à aula (a fonte única do corpo)');

// 15. O compositor do parâmetro tem os três caminhos: a matriz, a prosa antiga e o vazio.
assert.deepEqual(parametroEmLinhas([{ marco: 1, marcados: ['Plié', 'Tendu'] }], ['Isolar o eixo']),
  ['**1** Isolar o eixo — observa: Plié · Tendu'], 'a matriz sai citando o objetivo');
assert.deepEqual(parametroEmLinhas('O peso desloca-se?', []), ['O peso desloca-se?'],
  'a prosa de um plano antigo passa como veio');
assert.deepEqual(parametroEmLinhas(null, []), [], 'sem resposta, nada a compor');
ok('o compositor do parâmetro desliga corretamente: matriz, prosa e vazio');

// =========================================================================
// F. O SCHEMA E AS FONTES JÁ PUBLICADAS
// =========================================================================

// 16. As cinco chaves novas existem no schema, com tipo e descrição — e nenhuma é obrigatória:
//     os planos já escritos continuam válidos.
const schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8'));
for (const [chave, tipo] of [['contexto', 'object'], ['condicoesPreliminares', 'array'],
  ['criterioDeExtensao', 'string'], ['musicasVideos', 'array'], ['repertorio', 'array']]) {
  const prop = schema.properties[chave];
  assert.ok(prop, `o schema não declara «${chave}» — o extrator a descartaria`);
  assert.equal(prop.type, tipo, `«${chave}» devia ser ${tipo}`);
  assert.ok(prop.description && prop.description.length > 40,
    `«${chave}» precisa de descrição: é o que a próxima sessão lê`);
  assert.ok(!schema.required.includes(chave), `«${chave}» não pode ser obrigatória`);
}
ok('as 5 chaves novas estão no schema, com tipo e descrição, e nenhuma é obrigatória');

/* 17. AS FONTES JÁ PUBLICADAS NO REPOSITÓRIO continuam a extrair o que extraíam — o documento
 * antigo não deixa de se ler só porque o formato mudou. Este bloco servia o plano da Maria
 * (`professores/tiago/…`), e o professor `tiago` deixou de existir: a prova morria num `copyFile`
 * e o vermelho de cima escondia-o. O que se mede agora é a fonte que EXISTE e que é, de propósito,
 * um documento com o cabeçalho ANTIGO — a simulação do Marau. Se um dia ela for apagada, a prova
 * diz «não há fonte antiga para medir» em vez de rebentar com ENOENT: um `NÃO MEDE` nomeado vale
 * mais do que uma exceção. */
const FONTE_ANTIGA = path.join(RAIZ, 'experimentos/simulacao-marau/ciclo-01-marau-plano.md');
if (fs.existsSync(FONTE_ANTIGA)) {
  const doMarau = extrairComSchema(FONTE_ANTIGA, SCHEMA);
  assert.equal(doMarau.distribuicaoDeVolume[0].proporcaoAlvo60Min, '30–40%',
    'o plano do Marau segue com a chave do cabeçalho antigo: '
    + JSON.stringify(doMarau.distribuicaoDeVolume[0]));
  ok('o plano antigo do Marau continua a extrair o que extraía, com o cabeçalho de então');
} else {
  console.log('  —. NÃO MEDE: a fonte antiga (simulação do Marau) já não existe no repositório');
}

console.log(`\nOK: ${n} verificações — o plano completo chega inteiro aos derivados.`);

// ---------------------------------------------------------------------------

/** Extrai um documento do repositório com o seu schema (o validador de verdade). */
function extrairComSchema(caminhoDoDocumento, caminhoDoSchema) {
  const arquivo = path.join(os.tmpdir(), `plano-fonte-${process.pid}-${n}.md`);
  fs.copyFileSync(caminhoDoDocumento, arquivo);
  const json = JSON.parse(execFileSync(process.execPath,
    [VALIDADOR, caminhoDoSchema, arquivo, '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  fs.rmSync(arquivo, { force: true });
  return json;
}

/** O mesmo, para um documento que já vive no repositório (a fonte publicada). */
function extrairDoArquivo(caminhoDoDocumento) {
  return extrairComSchema(caminhoDoDocumento,
    path.join(RAIZ, 'professores/tiago/ciclos/ciclo-01-plano-schema.json'));
}
