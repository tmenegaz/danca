#!/usr/bin/env node
'use strict';

/**
 * provar-po-completo.js — a prova de que o PO COMPLETO chega inteiro aos derivados.
 *
 * O defeito que esta prova trava: um nó RESPONDÍVEL do PO que não tem destino no documento
 * derivado. O formulário pergunta, o professor responde, e a resposta **não chega a lado
 * nenhum** — sem erro e sem aviso. Foi assim que ficaram sem destino o horizonte, o plano de
 * ensino, as dimensões observadas, os itens de cada dimensão e os quatro campos dos módulos
 * condicionais; foi assim que a seção `## Metodologia e notação` passou a ser EMITIDA pela
 * derivação e ignorada pelo extrator (a ligação L5 morria no caminho); e foi assim que as
 * flutuantes e as restrições físicas (P-22) passaram a viajar DENTRO de outro campo
 * (`subjects`, `linhaDeBase`), porque o documento as escrevia como bullet/`###` da seção alheia.
 *
 * A prova não olha o código: responde os **33 nós** do mapa servido com um valor MARCADO, roda
 * a derivação e o extrator de verdade, e confere, nó por nó, que o valor chegou à SUA chave.
 * Uma tabela declara o destino esperado de cada nó — é ela o contrato, e é ela que a próxima
 * sessão lê para saber onde o dado vive.
 *
 *   uso: node experimentos/provar-po-completo.js
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
const { derivarPO, rotulosDoChecklist, ROTULOS_DO_CONTEXTO, ROTULO_DO_CHECKLIST, CHECKLIST,
  itensPorDimensao } = require(path.join(RAIZ, 'motor/nucleo/derivar-po.js'));
const { declaracaoDeCaptura, derivarCaptura } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const { BLOCOS_DA_AULA } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const Vistas = require(path.join(RAIZ, 'tools/lib-vistas.js'));

const CONTEUDO_PO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/po/conteudo/po.json'), 'utf8'));
const CONTEUDO_PLANO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/plano/conteudo/plano.json'), 'utf8'));
/* O ESQUEMA VEM DO MOLDE (03/11/2026). Era `professores/leticia/ciclos/ciclo-01-po-schema.json`,
 * e a pasta do professor `leticia` deixou de existir quando a escola `barra` foi expurgada em
 * 15/10/2026 — a prova morria a tentar ler um ficheiro, e a mensagem falava de schema, não de
 * fixture. O molde (`modelo/ciclos/`) é a fonte de onde `criar-escola.sh` copia o de cada
 * professor, e é o que esta prova quer medir: o CONTRATO do PO, não o do professor. */
const SCHEMA_PO = path.join(RAIZ, 'modelo/ciclos/ciclo-01-po-schema.json');

let n = 0;
const ok = (titulo) => { n += 1; console.log(`  ${String(n).padStart(2)}. ${titulo}`); };

const MAPA = porta.mapa(CONTEUDO_PO);
const mk = (id) => 'MKMK' + String(id).replace(/[^a-z0-9]/gi, '').toUpperCase();

// ---------------------------------------------------------------------------
// O DESTINO DE CADA NÓ — o contrato. `null` = não é campo do `po-XX.json`: vai no cabeçalho
// YAML do documento (a identidade) ou é COMPOSTO numa linha cujo valor vem do plano (`field`,
// `context`), e nesses casos o que se confere é o valor composto.
// ---------------------------------------------------------------------------
const DESTINO = {
  'professor': null,
  'escola': null,
  'horizonte': 'horizonte',
  'plano-de-ensino': 'planoDeEnsino',
  'question': 'question',
  'fenomeno': 'phenomenon',
  'campo-escola': null,
  /* `campo-outro`, `contexto-outro`, `flutuantes`, `linha-de-base`, `inclusao` e `exclusao`
   * SAÍRAM do formulário a 06/11/2026 — o recorte do passo 4 e o elenco da turma passaram a ser a
   * fonte desses dados. Não estão neste mapa porque não são nós: uma chave a mais aqui faria a
   * prova exigir um destino para um nó que já não existe. */
  'dimensoes-de-observacao': 'dimensoesObservadas',
  'itens-por-dimensao': 'itensPorDimensao',
  'sujeitos': 'subjects',
  'restricoes': 'restricoes',
  'condicoes-de-contorno': 'condicoesDeContorno',
  'referencia-ao-problema': 'justification.referenceToProblem',
  'explicacao-do-recorte': 'justification.explanationOfCut',
  'o-que-fica-de-fora': 'justification.whatIsLeftOut',
  'base-teorica': 'justification.theoreticalBasis',
  'limitacoes': 'limitations',
  'objetivo-geral-de-conjunto': 'horizonteDoConjunto.objetivoGeralDeConjunto',
  'numero-estimado-de-ciclos': 'horizonteDoConjunto.numeroEstimadoDeCiclos',
  'marcos-decididos-ate': 'compromissoDeReavaliacao.marcosDecididosAte',
  'criterio-de-extensao': 'compromissoDeReavaliacao.criterioDeExtensao',
};
for (const [id, chave] of CHECKLIST) DESTINO[id] = 'validationChecklist.' + chave;

// ---------------------------------------------------------------------------
// O PO COMPLETO — todos os nós respondidos, cada um com um valor único e identificável.
// ---------------------------------------------------------------------------
const RESPOSTAS = {};
for (const no of MAPA.nos) {
  const marca = mk(no.id);
  if (no.repetirPor) {
    // O `repetirPor` repete pelo SUJEITO do nó de origem — aqui, pela primeira dimensão.
    const fonte = MAPA.nos.find((x) => x.id === no.repetirPor);
    RESPOSTAS[no.id] = [{ sujeito: mk(fonte ? fonte.id : no.repetirPor), itens: marca }];
  } else if (no.multipla) {
    RESPOSTAS[no.id] = [marca];
  } else if (/^checklist-/.test(no.id)) {
    RESPOSTAS[no.id] = 'sim';
  } else {
    RESPOSTAS[no.id] = marca;
  }
}
RESPOSTAS['fenomeno'] = mk('fenomeno') + ' um\n' + mk('fenomeno') + ' dois';
RESPOSTAS['linha-de-base'] = [{ sujeito: mk('sujeitos'), traz: mk('traz'),
  precisaDesenvolver: mk('precisa') }];

// O PLANO REFERENCIADO — o PO o lê para compor campo empírico, contexto e metodologia/notação.
const PLANO = {
  contexto: {},
  respostas: Object.fromEntries([
    'contexto-escola', 'contexto-professor', 'contexto-turma', 'contexto-frequencia',
    'contexto-duracao', 'contexto-calendario', 'contexto-total-aulas', 'contexto-volume',
    'contexto-registro', 'contexto-metodologia', 'contexto-metodologia-origem',
    'contexto-notacao',
  ].map((id) => [id, { valor: mk(id) }])),
};
// Os que o documento COMPÕE (o envelope guarda o objeto; o documento lê a frase).
PLANO.respostas['contexto-turma'] = { valor: [mk('contexto-turma')] };
PLANO.respostas['contexto-frequencia'] = { valor: { vezes: 1, por: 'semanal', dias: ['sexta'] } };
PLANO.respostas['contexto-duracao'] = { valor: { min: 60, unidade: 'min' } };
PLANO.respostas['contexto-calendario'] = { valor: { inicio: '2026-10-02', fim: '2026-12-18' } };
PLANO.respostas['contexto-registro'] = { valor: { presentes: ['professor'], observa: ['professor'] } };

const ENVELOPE = {
  contexto: { ciclo: '01', escola: 'leticia', professor: 'leticia' },
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

const texto = JSON.stringify; // conveniência de leitura abaixo

(async () => {
  console.log('PO COMPLETO — cada resposta no seu destino\n');

  // =========================================================================
  // A. O CONTRATO: todo nó respondível tem destino, e o valor chega à SUA chave
  // =========================================================================

  // 1. A tabela de destinos cobre o mapa inteiro: um nó novo (no conteúdo) sem destino
  //    declarado aqui FALHA — é o alarme do defeito, e ele soa antes de o dado se perder.
  const semDestino = MAPA.nos.filter((x) => !(x.id in DESTINO)).map((x) => x.id);
  assert.deepEqual(semDestino, [],
    'nó(s) respondível(is) sem destino declarado na prova: ' + semDestino.join(', '));
  ok(`os ${MAPA.nos.length} nós respondíveis do mapa têm destino declarado`);

  // 2. O documento derivado e o JSON extraído (o que os derivados leem).
  const { markdown } = derivarPO(ENVELOPE, PLANO, { rotulos: rotulosDoChecklist(CONTEUDO_PO) });
  const arquivo = path.join(os.tmpdir(), `po-completo-${process.pid}.md`);
  fs.writeFileSync(arquivo, markdown);
  const json = JSON.parse(execFileSync(process.execPath,
    [path.join(RAIZ, 'tools/validar-po-ciclo.js'), SCHEMA_PO, arquivo, '--json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
  fs.rmSync(arquivo, { force: true });

  // 3. NÓ POR NÓ: o valor respondido está no documento E na chave que lhe pertence. Uma seção
  //    emitida e ignorada pelo extrator (o caso da metodologia) não passa daqui.
  const perdidos = [];
  for (const no of MAPA.nos) {
    const chave = DESTINO[no.id];
    const marcas = marcadores(RESPOSTAS[no.id]);
    if (!marcas.length) continue;
    if (no.deContexto) continue;                 // a identidade tem prova própria (bloco B)
    if (/^checklist-/.test(no.id)) continue;     // a resposta é `sim`; a folha, própria (bloco C1)
    if (chave === null) {                        // composto numa linha do documento
      if (!marcas.every((m) => markdown.includes(m))) perdidos.push(no.id + ' (documento)');
      continue;
    }
    const achado = noCaminho(json, chave);
    if (achado === undefined) { perdidos.push(`${no.id} → ${chave} AUSENTE`); continue; }
    const faltando = marcas.filter((m) => !texto(achado).includes(m));
    if (faltando.length) perdidos.push(`${no.id} → ${chave}: ${faltando.join(', ')} fora`);
  }
  assert.deepEqual(perdidos, [], 'resposta(s) que não chegaram ao seu destino');
  ok('cada nó respondido chega ao documento E à chave que lhe pertence');

  // 4. NENHUM NÓ CAI NO CAMPO DE OUTRO — o defeito das flutuantes e das restrições, medido no
  //    dado: elas viajavam como item de `subjects` e como "linha" de `linhaDeBase`.
  assert.deepEqual(json.subjects, [mk('sujeitos')], 'o campo `subjects` tem os sujeitos, e só');
  /* `flutuantes` E `linha-de-base` DEIXARAM DE SER NÓS (06/11/2026): o elenco vem da turma e o
   * ponto de partida é o recorte do passo 4. O que a asserção guarda agora é o que sobrou da
   * mesma família — a restrição física continua a ter chave própria, e não cai em campo alheio. */
  assert.deepEqual(json.restricoes, [mk('restricoes')], 'o campo `restricoes` é o do nó');
  assert.deepEqual(json.restricoes, [mk('restricoes')], 'o campo `restricoes` é o do nó');
  const naLinhaDeBase = texto(json.linhaDeBase);
  assert.ok(!/Restrições|Flutuantes/.test(naLinhaDeBase),
    'a linha de base não pode carregar título nem valor de outro nó: ' + naLinhaDeBase);
  assert.equal(json.linhaDeBase.length, 1, 'a linha de base é a tabela, sem linhas alheias');
  ok('nenhum nó escreve dentro do campo de outro (sujeitos, restrições)');

  // 5. As chaves novas EXISTEM no schema, e o tipo confere com o que a extração produziu: uma
  //    chave fora do schema é descartada em silêncio pelo extrator.
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PO, 'utf8'));
  const conferirTipo = (chave, tipo) => {
    const prop = schema.properties[chave];
    assert.ok(prop, `o schema não declara «${chave}» — o extrator a descartaria`);
    assert.equal(prop.type, tipo, `«${chave}» devia ser ${tipo}`);
    assert.ok(prop.description && prop.description.length > 40,
      `«${chave}» precisa de descrição: é o que a próxima sessão lê`);
  };
  for (const [chave, tipo] of [['planoDeEnsino', 'string'], ['horizonte', 'string'],
    ['dimensoesObservadas', 'array'], ['itensPorDimensao', 'array'],
    ['metodologiaENotacao', 'string'], ['flutuantes', 'array'], ['restricoes', 'array'],
    ['horizonteDoConjunto', 'object'], ['compromissoDeReavaliacao', 'object']]) {
    conferirTipo(chave, tipo);
  }
  assert.ok(!schema.required.includes('planoDeEnsino'),
    'as chaves novas NÃO entram em `required`: os POs já escritos continuam válidos');
  ok('as 9 chaves novas estão declaradas no schema, com tipo e descrição, e nenhuma é obrigatória');

  // 6. Os valores que o PO compõe LENDO O PLANO chegam — inclusive a metodologia e a notação,
  //    que eram emitidas e nunca extraídas (a ligação L5 morria no caminho).
  // Uns chegam como o RÓTULO do plano (o PO os compõe: `{vezes,por,dias}` → «1x semanal — sexta»),
  // outros como o marcador. O que se prova é o COMPOSTO, não o valor cru do envelope.
  const doPlano = {
    'campo empírico': ['field', [
      ['Escola / espaço: ' + mk('campo-escola'), 'a escola é a do PO, não a do plano'],
      /* «TURMA OBSERVADA», no singular (03/11/2026). O rótulo dizia «Turmas observadas» e o
       * campo do formulário diz «Turma observada» — o plano é de UMA turma. Os dois divergiam, e
       * é o defeito que a verificação 10 desta mesma prova existe para travar; ela estava
       * vermelha havia tempo, e o vermelho de cima escondia-a. A fonte é o conteúdo. */
      ['Turma observada: ' + mk('contexto-turma'), 'a turma vem do plano'],
      ['Frequência semanal: 1x semanal — sexta', 'a frequência é composta do objeto do plano'],
      ['Duração por aula: 60 min', 'a duração idem'],
    ]],
    'contexto': ['context', [
      ['Calendário: 2026-10-02 → 2026-12-18', 'o calendário é composto'],
      ['Volume de trabalho: ' + mk('contexto-volume'), 'o volume vem do plano'],
      ['Condição de registro: Na sala: professor · observa: professor.',
        'o registro vira FRASE, não `[object Object]`'],
    ]],
    'metodologia e notação': ['metodologiaENotacao', [
      ['Metodologia de referência: ' + mk('contexto-metodologia'), 'a metodologia vem do plano'],
      ['Notação dominada: ' + mk('contexto-notacao'), 'e a notação'],
    ]],
  };
  for (const [nome, [chave, esperados2]] of Object.entries(doPlano)) {
    const valor = String(noCaminho(json, chave) || '');
    for (const [esperado2, porque] of esperados2) {
      assert.ok(valor.includes(esperado2), `${nome}: faltou «${esperado2}» (${porque}) — obtido: ${valor}`);
    }
  }
  ok('o campo empírico, o contexto e a metodologia/notação leem o plano e chegam ao JSON');

  // =========================================================================
  // B. A IDENTIDADE: a resposta vence o contexto, e o contexto é a reserva
  // =========================================================================

  const comCorrecao = { contexto: { escola: 'leticia', professor: 'leticia' },
    respostas: { professor: { valor: mk('professor') }, escola: { valor: mk('escola') } } };
  const metaCorrigido = derivarPO(comCorrecao, PLANO).meta;
  assert.equal(metaCorrigido.professor, mk('professor'),
    'a correção do professor não pode ser descartada pelo contexto');
  assert.equal(metaCorrigido.escola, mk('escola'), 'a correção da escola idem');
  const metaSemResposta = derivarPO({ contexto: { professor: 'leticia', escola: 'barra' },
    respostas: {} }, PLANO).meta;
  assert.equal(metaSemResposta.professor, 'leticia', 'sem resposta, o contexto é a reserva');
  ok('o cabeçalho do documento usa a RESPOSTA e cai no contexto só quando ela falta');

  // 8. O plano que o PO observa é DECLARADO no documento: ele lê o plano e diz de onde leu.
  assert.ok(markdown.includes('## Plano de ensino\n\n' + mk('plano-de-ensino')),
    'o documento tem de declarar QUAL plano observa');
  assert.ok(markdown.includes('## Horizonte\n\n' + mk('horizonte')),
    'o horizonte declarado tem de aparecer');
  ok('o plano de ensino e o horizonte, declarados no documento, com o valor que foi respondido');

  // =========================================================================
  // C. OS RÓTULOS: a fonte é o CONTEÚDO
  // =========================================================================

  const esperados = rotulosDoChecklist(CONTEUDO_PO);
  for (const [id, chave] of CHECKLIST) {
    assert.equal(ROTULO_DO_CHECKLIST[chave], esperados[id],
      `o rótulo de reserva de «${chave}» derivou do conteúdo: `
      + `«${ROTULO_DO_CHECKLIST[chave]}» × «${esperados[id]}»`);
  }
  for (const [id, chave] of CHECKLIST) {
    assert.ok(markdown.includes('- [x] ' + esperados[id]),
      `o documento assina «${esperados[id]}», o nome que o professor marcou`);
  }
  ok('os 6 rótulos do checklist são os do conteúdo — na reserva e no documento');

  // 10. Os rótulos do contexto (o que o PO compõe lendo o plano) são os do conteúdo do PLANO.
  const camposDoPlano = {};
  const colher = (blocos) => {
    for (const bloco of blocos) {
      for (const campo of bloco.campos || []) if (campo && campo.id) camposDoPlano[campo.id] = campo.campo;
    }
  };
  colher(CONTEUDO_PLANO.blocos || []);
  colher(CONTEUDO_PLANO.cabecalho ? [CONTEUDO_PLANO.cabecalho] : []);
  const rotulosErrados = Object.entries(ROTULOS_DO_CONTEXTO)
    .filter(([id, rotulo]) => camposDoPlano[id] !== rotulo)
    .map(([id, rotulo]) => `${id}: «${rotulo}» × «${camposDoPlano[id]}»`);
  assert.deepEqual(rotulosErrados, [],
    'rótulo do contexto diferente do campo que o formulário mostra');
  ok('os 12 rótulos do contexto são os do conteúdo do plano (fonte única)');

  // 11. A PORTA existe: os rótulos que chegam vencem a reserva. Agora que os dois coincidem
  //     (é o que a verificação acima garante), quem prova a porta é um rótulo SENTINELA — a
  //     reserva deve ficar de fora quando o conteúdo fala.
  const semRotulos = derivarPO(ENVELOPE, PLANO).markdown;
  assert.ok(semRotulos.includes('- [x] ' + ROTULO_DO_CHECKLIST.scopeBoundariesClear),
    'sem os rótulos do conteúdo, a reserva é o que o documento assina');
  const comSentinela = derivarPO(ENVELOPE, PLANO,
    { rotulos: { 'checklist-fronteiras-claras': 'RÓTULO-DE-PROVA' } }).markdown;
  assert.ok(comSentinela.includes('- [x] RÓTULO-DE-PROVA'),
    'os rótulos que chegam têm de vencer a reserva');
  assert.ok(!comSentinela.includes('- [x] ' + ROTULO_DO_CHECKLIST.scopeBoundariesClear),
    'com os rótulos do conteúdo, a reserva não pode ser usada');
  ok('os rótulos do conteúdo vencem a reserva (a porta que a rota usa)');

  // =========================================================================
  // D. A FOLHA DE CAPTURA DERIVADA DO PO
  // =========================================================================

  const contextoDaEscola = { ciclo: '01', escola: 'barra', escolaNome: 'Barra' };
  const poDaFolha = { respostas: Object.fromEntries(
    [['sujeitos', [mk('sujeitos')]], ['dimensoes-de-observacao', [mk('dimensoes')]],
      ['flutuantes', mk('flutuantes')],
      ['itens-por-dimensao', [{ sujeito: mk('dimensoes'), itens: mk('itens') + ': descrição' }]],
      ['linha-de-base', [{ sujeito: mk('sujeitos'), traz: 'a', precisaDesenvolver: 'b' }]]]
      .map(([k, v]) => [k, { valor: v }])) };
  const declaracao = declaracaoDeCaptura({ po: poDaFolha, escola: 'Barra' });
  const folha = derivarCaptura({ po: poDaFolha, contexto: contextoDaEscola });

  // 12. As dimensões viram blocos e os itens, as colunas — o que o conteúdo do PO declara.
  const bloco = declaracao.blocos['Bloco 1 — ' + mk('dimensoes')];
  assert.ok(bloco, 'a dimensão respondeu por um bloco: ' + Object.keys(declaracao.blocos).join(' | '));
  assert.equal(bloco.grao, 'aluna', 'a coluna do critério é por aluna');
  assert.ok(Object.keys(bloco.colunas)[0].startsWith(mk('itens')),
    'o item da dimensão é a coluna da folha');
  assert.ok(folha.includes('## Bloco 1 — ' + mk('dimensoes')),
    'o bloco da folha tem o título que a declaração confere');
  ok('as dimensões observadas viram blocos e os itens de cada dimensão viram colunas');

  // 13. O TIPO de cada coluna é o do registro: o critério mede-se pela régua da turma
  //     (`rubrica`), e o que só se observa — a linha de base — marca-se (`marca`).
  const tipos = Object.values(bloco.colunas).map((c) => c.tipo);
  assert.deepEqual([...new Set(tipos)], ['rubrica'],
    'os critérios da folha derivada medem-se pela régua da turma');
  /* O BLOCO DA LINHA DE BASE PERDEU O «(P-10)» DO TÍTULO (03/11/2026). A referência à pétrea
   * continua na documentação; o nome do bloco na folha é o que a pessoa lê, e «(P-10)» no meio de
   * um título de captura é ruído de método dentro do instrumento. A asserção passou a usar o nome
   * que existe — e continua a medir o que importa: o tipo das colunas. */
  assert.equal(declaracao.blocos['Linha de base revisitada'].colunas['Observado na aula'].tipo,
    'marca', 'a linha de base segue com as cinco marcas');
  assert.ok(folha.includes('régua da turma'), 'a folha derivada explica a régua');
  ok('a folha derivada mede o critério pela régua (`rubrica`) e a linha de base por `marca`');

  // 14. A folha derivada passa pelo validador da captura — com a declaração derivada junto.
  const schemaCaptura = JSON.parse(fs.readFileSync(
    /* O MOLDE, E NÃO A PASTA DE UM PROFESSOR (03/11/2026). Era `professores/tiago/…`, e o
     * professor `tiago` já não existe — a prova morria a ler um ficheiro. O schema da captura é
     * do ciclo e genérico; o molde é `modelo/ciclos/`, de onde `criar-escola.sh` copia o de cada
     * um. O que se valida é o CONTRATO. */
    path.join(RAIZ, 'modelo/ciclos/ciclo-01-captura-schema.json'), 'utf8'));
  const comDerivada = JSON.parse(JSON.stringify(schemaCaptura));
  comDerivada._declaracao.porVariante = { provaderivada: declaracao };
  const caminhoFolha = path.join(os.tmpdir(), `folha-derivada-${process.pid}.md`);
  const caminhoSchema = path.join(os.tmpdir(), `schema-derivado-${process.pid}.json`);
  fs.writeFileSync(caminhoFolha, folha);
  fs.writeFileSync(caminhoSchema, JSON.stringify(comDerivada));
  const saida = execFileSync(process.execPath,
    [path.join(RAIZ, 'tools/validar-captura-ciclo.js'), caminhoSchema, caminhoFolha,
      '--variante', 'provaderivada'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  fs.rmSync(caminhoFolha, { force: true });
  fs.rmSync(caminhoSchema, { force: true });
  assert.ok(/OK: 0 erro/.test(saida),
    'a folha derivada tem de passar no validador da captura:\n' + saida);
  ok('a folha derivada do PO passa pelo `validar-captura-ciclo.js` (0 erros)');

  // 15. O fecho da folha lista os BLOCOS CANÓNICOS da aula — a lista fixa («presença») saiu.
  const fecho = folha.slice(folha.indexOf('**Fecho da aula'));
  for (const b of BLOCOS_DA_AULA) {
    assert.ok(fecho.includes('☐ ' + b.toLowerCase()),
      `o fecho da folha tem de listar «${b.toLowerCase()}»`);
  }
  assert.ok(!fecho.includes('presença'),
    '«presença» não é um bloco da aula (BLOCOS_DA_AULA) — a lista fixa saiu');
  ok('o fecho da folha usa os blocos canónicos da aula: ' + BLOCOS_DA_AULA.join(' · '));

  // 16. `itensPorDimensao`: a dimensão marcada e NÃO preenchida sai declarada, e a que tem
  //     itens sai com eles — a lacuna é declarada, nunca um silêncio.
  const itens = itensPorDimensao([{ sujeito: 'técnica', itens: 'pelve\nombro' }],
    ['técnica', 'musicalidade']);
  assert.equal(itens.length, 2, 'as duas dimensões respondidas saem');
  assert.deepEqual(itens[0].itens, ['pelve', 'ombro'], 'os itens da dimensão preenchida saem em lista');
  assert.deepEqual(itens[1].itens, [], 'a dimensão sem itens sai vazia — a lacuna é declarada');
  ok('a dimensão marcada sem itens sai declarada (a lacuna não vira silêncio)');

  // =========================================================================
  // E. A VISTA (o guia de observação): o que ela lê mudou de lugar, e nada se perdeu
  // =========================================================================

  // 16. O guia imprime as RESTRIÇÕES (P-22) pela chave própria do nó — e NÃO imprime flutuantes,
  //     que deixaram de existir (06/11/2026). A asserção foi invertida, não apagada.
  const meta = { id: '01', escola: 'Barra' };
  const poDaVista = {
    phenomenon: ['o eixo'], subjects: [mk('sujeitos')],
    linhaDeBase: [{ aluno: mk('sujeitos'), traz: 'a', precisaDesenvolver: 'b' }],
    restricoes: [mk('restricoes')],
  };
  const guia = Vistas.guia({ meta, po: poDaVista, plano: null, aula: '1', data: '2026-10-08' });
  assert.ok(guia.includes('### Restrições físicas declaradas (P-22)'),
    'o guia tem de ter a seção das restrições');
  assert.ok(guia.includes(mk('restricoes')), 'e o valor delas');
  /* AS FLUTUANTES SAÍRAM DA VISTA (06/11/2026) — a asserção foi INVERTIDA, e não apagada. O nó
   * deixou de existir no PO: quem entra e sai do grupo é o elenco que a linha de base da turma
   * fixa. Um PO antigo que ainda traga a chave continua a ser lido, mas a vista já não a imprime —
   * e é isso que se mede: a lista dos observados não ganha um «flutuante» disfarçado de sujeito. */
  const poComFlutuantes = Object.assign({}, poDaVista, { flutuantes: [mk('flutuantes')] });
  const guiaComChaveAntiga = Vistas.guia({ meta, po: poComFlutuantes, plano: null, aula: '1', data: '2026-10-08' });
  const quemEObservado = guiaComChaveAntiga.slice(guiaComChaveAntiga.indexOf('### Quem é observado'),
    guiaComChaveAntiga.indexOf('### Procedência'));
  assert.ok(!quemEObservado.includes('**Flutuantes:**'),
    'os flutuantes não entram na lista dos apelidos observados');
  assert.ok(!guiaComChaveAntiga.includes('**Flutuantes:**'),
    'a vista já não imprime flutuantes: o nó deixou de existir no PO');
  ok('o guia de observação imprime as restrições (P-22) e não inventa flutuantes');

  // 17. O PO no formato ANTIGO (o das fontes já publicadas — as restrições dentro de
  //     `linhaDeBase`) continua lido como estava: a correção não pode apagar o que já foi escrito.
  const poAntigo = {
    phenomenon: ['o eixo'], subjects: [mk('sujeitos')],
    linhaDeBase: [{ aluno: mk('sujeitos'), traz: 'a', precisaDesenvolver: 'b' },
      '### Restrições físicas declaradas (P-22)', mk('restricoes')],
  };
  const guiaAntigo = Vistas.guia({ meta, po: poAntigo, plano: null, aula: '1', data: '2026-10-08' });
  assert.ok(guiaAntigo.includes(mk('restricoes')),
    'as restrições de um PO antigo continuam a aparecer na vista');
  assert.equal((guiaAntigo.match(/Restrições físicas declaradas/g) || []).length, 1,
    'e aparecem UMA vez (o formato antigo e o novo não coexistem no mesmo arquivo)');
  ok('o PO no formato antigo continua lido como estava (nenhum pacote publicado muda)');

  // =========================================================================
  // F. O HÍBRIDO (06/11/2026): os objetivos do plano entram como critérios
  // =========================================================================

  /* O QUE MUDOU, E PORQUÊ. A auditoria reversa da §5.15 de ARQUITETURA-GERAL mediu o que o campo
   * «Itens de cada dimensão» pedia à mão e o plano já tinha. A decisão dela foi o híbrido: os
   * OBJETIVOS que o plano trabalha em cada bloco entram **derivados** como critérios, e o campo
   * fica só com o que é do professor. O que estas verificações medem é o caminho inteiro — do
   * plano ao documento e do plano à folha de captura — e a NEGATIVA que prova que é o plano que
   * os põe lá: sem plano, o mesmo PO não os tem. */
  /* O BLOCO É O VALOR DA DIMENSÃO, e neste cenário ele é o marcador do nó que a declarou —
   * `mk('dimensoes-de-observacao')`. Usar `mk('dimensoes')` era a abreviação que eu tinha
   * escrito de cabeça; o cruzamento não casava, e a asserção falhava com razão. */
  const BLOCO_DO_PO = mk('dimensoes-de-observacao');
  /* A FOLHA usa OUTRO rótulo de dimensão (o `poDaFolha` da secção D é um PO à parte). Os dois
   * blocos são marcados no mesmo plano de propósito: o cruzamento é por NOME, e um plano que só
   * marcasse um deles provaria metade do caminho. */
  const BLOCO_DA_FOLHA = mk('dimensoes');
  const OBJ_UM = 'alinhar o eixo vertical na preparação';
  const OBJ_DOIS = 'transferir o peso sem perder o alinhamento';
  const PLANO_COM_OBJETIVOS = JSON.parse(JSON.stringify(PLANO));
  PLANO_COM_OBJETIVOS.respostas['marcos-por-aula'] = { valor: [OBJ_UM, OBJ_DOIS] };
  PLANO_COM_OBJETIVOS.respostas['estrutura-de-cada-aula'] = { valor: [
    { marco: 1, marcados: [BLOCO_DO_PO, BLOCO_DA_FOLHA] },
    { marco: 2, marcados: [BLOCO_DO_PO, BLOCO_DA_FOLHA] },
  ] };

  // 18. O DOCUMENTO: a linha do bloco leva os dois objetivos à frente do item escrito.
  const semObjetivos = derivarPO(ENVELOPE, PLANO, { rotulos: rotulosDoChecklist(CONTEUDO_PO) }).markdown;
  const comObjetivos = derivarPO(ENVELOPE, PLANO_COM_OBJETIVOS,
    { rotulos: rotulosDoChecklist(CONTEUDO_PO) }).markdown;
  assert.ok(!comObjetivos.includes(OBJ_UM) === false,
    'o documento do PO tem de trazer o objetivo do plano');
  assert.ok(semObjetivos.includes(mk('itens')) && !semObjetivos.includes(OBJ_UM),
    'sem plano com objetivos, o documento fica só com o que o professor escreveu');
  const linhaDoBloco = comObjetivos.split('\n')
    .find((l) => l.indexOf('**' + BLOCO_DO_PO + '**') !== -1) || '';
  assert.ok(linhaDoBloco.indexOf(OBJ_UM) !== -1 && linhaDoBloco.indexOf(OBJ_DOIS) !== -1,
    'os dois objetivos entram na linha do bloco: ' + linhaDoBloco);
  assert.ok(linhaDoBloco.indexOf(OBJ_UM) < linhaDoBloco.indexOf(mk('itens')),
    'e entram ANTES do que o professor escreveu — a ordem é a da autoridade');
  ok('o documento do PO traz os objetivos do plano como critérios, à frente do que se escreveu');

  // 19. A FOLHA: os objetivos viram COLUNAS — é por elas que se marca, aluna a aluna.
  const folhaSem = declaracaoDeCaptura({ po: poDaFolha, escola: 'Barra' });
  const folhaCom = declaracaoDeCaptura({ po: poDaFolha, plano: PLANO_COM_OBJETIVOS, escola: 'Barra' });
  const colunasCom = Object.keys(folhaCom.blocos['Bloco 1 — ' + BLOCO_DA_FOLHA].colunas);
  const colunasSem = Object.keys(folhaSem.blocos['Bloco 1 — ' + BLOCO_DA_FOLHA].colunas);
  assert.ok(colunasCom.indexOf(OBJ_UM) !== -1 && colunasCom.indexOf(OBJ_DOIS) !== -1,
    'as colunas da folha incluem os objetivos: ' + colunasCom.join(' | '));
  assert.ok(colunasSem.indexOf(OBJ_UM) === -1,
    'e sem o plano a folha fica como estava: ' + colunasSem.join(' | '));
  assert.ok(colunasCom.indexOf(mk('itens')) !== -1,
    'o que o professor escreveu não se perde: ' + colunasCom.join(' | '));
  ok('a folha de captura ganha uma coluna por objetivo do plano, e mantém o que se escreveu');

  // 20. NÃO SE DUPLICA: um professor que já escreveu o objetivo com as mesmas palavras
  //     (é o que a tela lhe diz para fazer) não o vê duas vezes na folha.
  const poRepetido = JSON.parse(JSON.stringify(poDaFolha));
  poRepetido.respostas['itens-por-dimensao'].valor =
    [{ sujeito: BLOCO_DA_FOLHA, itens: OBJ_UM.toUpperCase() + '; um item só meu' }];
  const folhaRepetida = declaracaoDeCaptura({ po: poRepetido, plano: PLANO_COM_OBJETIVOS, escola: 'Barra' });
  const chaves = Object.keys(folhaRepetida.blocos['Bloco 1 — ' + BLOCO_DA_FOLHA].colunas);
  const quantas = chaves.filter((c) => c.toLowerCase() === OBJ_UM.toLowerCase()).length;
  assert.equal(quantas, 1, 'o objetivo escrito com as mesmas palavras entra uma vez só: '
    + chaves.join(' | '));
  assert.ok(chaves.indexOf('um item só meu') !== -1, 'e o que é do professor continua lá');
  ok('o objetivo que o professor já escreveu não aparece duas vezes na folha');

  console.log(`\nOK: ${n} verificações — o PO completo chega inteiro aos derivados.`);
})().catch((e) => {
  console.error('\nFALHOU: ' + e.message);
  process.exit(1);
});
