#!/usr/bin/env node
'use strict';

/**
 * provar-proveniencia-e-turma.js — a turma no alto dos documentos, e a anamnese de cada aluna na
 * §6 «Proveniência consolidada».
 *
 * O PEDIDO DELA (06/11/2026), e são duas coisas:
 *
 *   «Aí em baixo a gente vai colocar proveniência. E aqui a proveniência a gente vai colocar uma
 *    lista para o professor escolher de qual aluna da turma ele quer olhar a proveniência. […]
 *    vai aparecer dois links para ele, um link de edição da anamnese da aluna e um outro link que
 *    é imprimir a anamnese da aluna.»
 *
 *   «Vamos acrescentar aqui no topo quando a gente abre o plano de ensino […] Vamos dizer qual é a
 *    turma do qual se aplica esse plano de ensino. […] para o professor não se perder, para ele
 *    saber do que se trata se ele ficar muito tempo aqui.»
 *
 * O QUE ESTA PROVA GUARDA, e são quatro coisas:
 *
 *   A. a turma no alto — do plano de ensino E da aula, uma linha de cabeçalho (`subtitle`), que é
 *      o que o pandoc põe debaixo do título no HTML e no bloco de título do PDF;
 *   B. a §6 lista uma linha por aluna do elenco, com os dois gestos;
 *   C. o gesto é o que o servidor aceita: «novo registo» quando a anamnese já está vinculada
 *      (04/11/2026 — o retrato é datado e não se reescreve), «editar» quando está solta;
 *   D. o CONTRATO DE EXTRAÇÃO continua a ler a §6 como TEXTO — é o modo de falha silencioso desta
 *      secção: `proveniencia` é `string` no schema, e um `###` ou uma tabela a mais mudá-lo-ia
 *      para objeto sem que a página perdesse nada.
 *   G. a TURMA NA NOTAÇÃO (06/11/2026) — a terceira volta do mesmo pedido: «você colocou no
 *      documento plano para a aula um a turma logo acima do botão abrir notação e não colocou a
 *      turma dentro da notação, precisa colocar»;
 *   H. o RESPIRO entre o menu das alunas e os botões (06/11/2026): «quando eu escolho a aluna, o
 *      botão novo registro e imprimir estão colados no dropdown … tem que ter um espaço». MEDIDO
 *      no documento publicado: o `<select>` acabava em 3139,6px e o `<div>` começava em 3139,6px
 *      — **1px** de vão entre o menu e o botão. Aqui mede-se em navegador, e mede-se a peça.
 *
 *   node experimentos/provar-proveniencia-e-turma.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const { derivarAula01, derivarNotacao } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

const TURMA = 'Balé Nível 1 — Teste 1';
const OUTRA = 'Balé Nível 2 — Quarta';

const PLANO = {
  id: 'plano-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01', turma: TURMA },
  respostas: {
    'contexto-turma': { valor: TURMA },
    'marcos-por-aula': { valor: ['reconhecer o apoio'] },
    'estrutura-de-cada-aula': { valor: [{ marco: 1, marcados: ['Barra'] }] },
    'objetivo-geral': { valor: 'consolidar o alinhamento' },
  },
};

const PO = {
  id: 'po-da-prova',
  contexto: { escola: 'prova', professor: 'prova', ciclo: '01' },
  respostas: {
    'plano-de-ensino': { valor: PLANO.id },
    sujeitos: { valor: ['Aluna A', 'Aluna B', 'Aluna C'] },
    'dimensoes-de-observacao': { valor: ['Barra'] },
    question: { valor: 'o que se observa' },
  },
};

const CONTEXTO = { professor: 'prova', ciclo: '01', escola: 'prova', escolaNome: 'Prova' };

/** A linha do cabeçalho com a turma, ou `null`. */
function linhaDaTurma(md) {
  const m = /^subtitle: "(.*)"$/m.exec(String(md).split('\n---')[0] || '');
  return m ? m[1] : null;
}

/** A §6 de um documento, do título ao `##` seguinte. */
function secao6(md) {
  const linhas = String(md).split('\n');
  const i = linhas.findIndex((l) => /^## 6\. Prov/.test(l));
  if (i === -1) return null;
  const j = linhas.findIndex((l, k) => k > i && /^## /.test(l));
  return linhas.slice(i, j === -1 ? undefined : j).join('\n');
}

const aula = (extra) => derivarAula01(Object.assign(
  { plano: PLANO, po: PO, contexto: CONTEXTO }, extra || {}));

/* O ELENCO DA TURMA — o acto do passo 2 da linha de base. Duas alunas, e o PO da fixture declara
 * três de propósito: é a diferença que mede o filtro. */
const ELENCO = { alunas: ['Aluna A', 'Aluna B'], recorte: [], mostra: [] };
const comLinhaDeBase = (extra) => aula(Object.assign({ linhaDeBase: ELENCO }, extra || {}));

/** O conteúdo do bloco `{=html}` de uma secção — o que só a página recebe. */
function blocoHtml(md) {
  const m = /^```\{=html\}\n([\s\S]*?)^```$/m.exec(String(md));
  return m ? m[1] : null;
}

(async () => {
// ---------------------------------------------------------------------------------------------
console.log('A. A TURMA NO ALTO DO PLANO DE ENSINO');
{
  const md = derivarPlano(PLANO).markdown;
  const cabeca = md.split('\n---')[0];
  provar('o cabeçalho do plano diz a turma a que se aplica',
    linhaDaTurma(md) === 'Turma: ' + TURMA, linhaDaTurma(md));
  provar('…e di-lo DEPOIS do título, no front-matter (é o que o pandoc mostra debaixo dele)',
    /^title: .*\nsubtitle: "Turma: /m.test(cabeca), cabeca.split('\n').slice(0, 9));

  /* DUAS TURMAS SOMAM-SE. Um plano que vale para duas não é o plano de uma delas. */
  const duas = JSON.parse(JSON.stringify(PLANO));
  duas.respostas['contexto-turma'] = { valor: [TURMA, OUTRA] };
  provar('com duas turmas, o cabeçalho nomeia as duas',
    linhaDaTurma(derivarPlano(duas).markdown) === 'Turma: ' + TURMA + ' · ' + OUTRA,
    linhaDaTurma(derivarPlano(duas).markdown));

  /* A RESERVA: o `contexto.turma` do envelope, quando o campo não está preenchido. */
  const soContexto = JSON.parse(JSON.stringify(PLANO));
  delete soContexto.respostas['contexto-turma'];
  provar('sem o campo, a turma vem do contexto do envelope',
    linhaDaTurma(derivarPlano(soContexto).markdown) === 'Turma: ' + TURMA,
    linhaDaTurma(derivarPlano(soContexto).markdown));

  /* SEM TURMA NÃO SE INVENTA A LINHA — «Turma: —» prometeria um dado que não existe. */
  const semTurma = { id: 'x', contexto: { escola: 'prova', ciclo: '01' }, respostas: {} };
  provar('sem turma nenhuma, a linha não existe (em vez de sair vazia)',
    linhaDaTurma(derivarPlano(semTurma).markdown) === null,
    linhaDaTurma(derivarPlano(semTurma).markdown));

  /* O DADO CONTINUA NA TABELA DO CONTEXTO — a linha nova não o substitui. */
  provar('a turma continua na tabela do `## Contexto` (nada se perdeu)',
    /\*\*Turma observada\*\* \| Balé Nível 1 — Teste 1/.test(md));
}

// ---------------------------------------------------------------------------------------------
console.log('\nB. A TURMA NO ALTO DA AULA — e vem do PLANO, não do PO');
{
  provar('a aula diz a mesma turma', linhaDaTurma(aula()) === 'Turma: ' + TURMA,
    linhaDaTurma(aula()));
  /* A FONTE É O PLANO. Se o PO trouxesse outra turma, a do plano é que manda: é o plano de ensino
   * que declara a turma, e o PO herda-a. Duas fontes para o mesmo facto seriam duas respostas. */
  const poComOutra = JSON.parse(JSON.stringify(PO));
  poComOutra.respostas['contexto-turma'] = { valor: OUTRA };
  poComOutra.contexto.turma = OUTRA;
  provar('…e a lê do plano de ensino (o PO não a sobrepõe)',
    linhaDaTurma(aula({ po: poComOutra })) === 'Turma: ' + TURMA,
    linhaDaTurma(aula({ po: poComOutra })));
  const planoSemTurma = { id: 'y', contexto: {}, respostas: {} };
  provar('sem turma no plano, a aula não inventa a linha',
    linhaDaTurma(aula({ plano: planoSemTurma })) === null,
    linhaDaTurma(aula({ plano: planoSemTurma })));
}

// ---------------------------------------------------------------------------------------------
console.log('\nG. A TURMA NA NOTAÇÃO — o terceiro documento, e a mesma fonte');
{
  /* «VOCÊ NÃO COLOCOU A TURMA DENTRO DA NOTAÇÃO» (06/11/2026). A notação é o documento que se
   * abre a partir do botão da aula — a meio do trabalho —, e chegava sem dizer de que turma era.
   * A linha é a mesma peça dos outros dois (o `subtitle`), e vem da mesma função: o envelope do
   * PLANO. Um valor, uma fonte. */
  const comNotacao = JSON.parse(JSON.stringify(PLANO));
  comNotacao.respostas['contexto-notacao'] = { valor: 'benesh' };
  const mdNot = derivarNotacao({ plano: comNotacao, contexto: CONTEXTO });
  provar('a notação diz a mesma turma do plano e da aula',
    mdNot && linhaDaTurma(mdNot) === 'Turma: ' + TURMA, mdNot && linhaDaTurma(mdNot));
  provar('…e di-lo no front-matter, debaixo do título (é o que o pandoc desenha)',
    /^title: "Notação em Benesh"\nsubtitle: "Turma: /m.test(String(mdNot).split('\n---')[0]),
    String(mdNot).split('\n').slice(0, 8));
  /* Sem turma não se inventa a linha — a mesma regra do plano. */
  const semTurma = JSON.parse(JSON.stringify(comNotacao));
  delete semTurma.respostas['contexto-turma'];
  semTurma.contexto = { escola: 'prova', professor: 'prova', ciclo: '01' };
  provar('sem turma declarada, a notação não inventa a linha',
    linhaDaTurma(derivarNotacao({ plano: semTurma, contexto: CONTEXTO })) === null,
    linhaDaTurma(derivarNotacao({ plano: semTurma, contexto: CONTEXTO })));
  /* O CICLO SEM NOTAÇÃO NÃO PRODUZ DOCUMENTO — a guarda de antes continua a valer. */
  provar('um plano sem notação escolhida continua a não gerar o documento',
    derivarNotacao({ plano: PLANO, contexto: CONTEXTO }) === null,
    derivarNotacao({ plano: PLANO, contexto: CONTEXTO }));
}

// ---------------------------------------------------------------------------------------------
console.log('\nC. A §6 — UM SELECTOR DO ELENCO, E AS ACÇÕES DA ALUNA ESCOLHIDA');
{
  /* QUEM FEZ A ANAMNESE E QUANDO (22/11/2026). O pedido dela: «tem que dizer aqui nessa listagem,
   * ao lado do nome da aluna, quem é o que fez a anamnese e a data em que essa anamnese foi feita.»
   *
   * A Aluna A leva autor; a Aluna B NÃO — é o caso dos envelopes anteriores ao campo existir, e o
   * documento não pode inventar um nome. A data sai do CARIMBO, e por isso as duas a têm. */
  const anamneses = {
    'Aluna A': { carimbo: 'anamnese-20261105-2301', vinculada: true, autor: 'demi-plie' },
    'Aluna B': { carimbo: 'anamnese-20261105-2031', vinculada: false },
  };
  const s6 = secao6(aula({ anamneses }));

  provar('a secção continua a chamar-se «6. Proveniência consolidada»',
    /^## 6\. Proveniência consolidada$/m.test(s6), s6 && s6.split('\n')[0]);
  provar('e há UMA só (duas secções 6 seriam uma delas lida como prosseguimento da outra)',
    (aula({ anamneses }).match(/^## 6\. /gm) || []).length === 1);
  provar('os dois links de origem continuam lá (PO e plano de ensino)',
    /\[Plano de Observação\]\(\/plano-observacao\/api\/po-preenchido\./.test(s6)
    && /\[Plano de ensino\]\(\/plano-ensino\/api\/plano-preenchido\./.test(s6), s6);

  /* O SELECTOR, E SÓ ELE — a lista deixou de ser uma parede de linhas. */
  const bloco = blocoHtml(s6);
  provar('as acções vivem num bloco `{=html}` — o único que o LaTeX descarta',
    Boolean(bloco) && /^```\{=html\}$/m.test(s6));
  provar('há um `<select>` com um `<option>` por aluna do ELENCO',
    Boolean(bloco) && /<select id="prov-seletor"/.test(bloco)
    && ((bloco || '').match(/<option value="Aluna /g) || []).length === 3, bloco && bloco.slice(0, 200));
  provar('…e NÃO há uma lista markdown de alunas (era a parede que ela recusou)',
    !/^- \*\*Aluna /m.test(s6), s6.split('\n').filter((l) => /^- /m.test(l)));

  /* QUEM FEZ, E QUANDO — na OPÇÃO (é o que se lê ao escolher) e na linha das acções. */
  {
    const op = (blocoHtml(s6) || '').match(/<option value="Aluna [AB]">[^<]*/g) || [];
    provar('a opção da aluna diz QUEM fez a anamnese e a DATA, ao lado do nome',
      op.some((o) => /<option value="Aluna A">Aluna A · por demi-plie em 05\/11\/2026$/.test(o)), op);
    provar('…e a data sai do CARIMBO, sem autor inventado quando o envelope não declara nenhum',
      op.some((o) => /<option value="Aluna B">Aluna B · em 05\/11\/2026$/.test(o)), op);
    provar('…e a mesma frase está na linha das acções (para quem não tem JavaScript)',
      /<span class="origem-da-aluna">anamnese por demi-plie em 05\/11\/2026 · /.test(blocoHtml(s6)),
      (blocoHtml(s6) || '').match(/<span class="origem-da-aluna">[^<]*/g));
  }

  /* O ELENCO É O DA LINHA DE BASE — o defeito que ela viu («a aluna C existe no banco geral, mas
   * não pertence àquela turma»). O PO da fixture continua a declarar três; a linha de base tem
   * duas, e é ela que manda. */
  const base = { alunas: ['Aluna A', 'Aluna B'], recorte: [], mostra: [] };
  const comBase = secao6(aula({ anamneses, linhaDeBase: base }));
  const blocoDaBase = blocoHtml(comBase);
  provar('com linha de base, o selector mostra SÓ o elenco dela (a aluna de fora desaparece)',
    Boolean(blocoDaBase) && !/Aluna C/.test(blocoDaBase), blocoDaBase && blocoDaBase.match(/<option[^>]*>[^<]*/g));
  provar('…e as duas do elenco ficam',
    Boolean(blocoDaBase) && /<option value="Aluna A">/.test(blocoDaBase)
    && /<option value="Aluna B">/.test(blocoDaBase));
  /* SEM linha de base legível, a reserva é o PO — e é declarada, não silenciosa. */
  provar('sem linha de base, cai no PO (a reserva) em vez de ficar sem elenco',
    ((bloco || '').match(/<option value="Aluna /g) || []).length === 3, bloco && bloco.slice(0, 120));

  /* O GESTO É O QUE O SERVIDOR ACEITA. */
  const b = bloco || '';
  /* A FILEIRA TEM CLASSE DESDE 06/11/2026 — o `div` deixou de ser nu, e a regex acompanha-o
   * (antes ela casava `<div data-prov-par=`, e o atributo passou a ser o segundo). */
  const daAluna = (nome) => (b.match(new RegExp('<div[^>]*data-prov-par="' + nome + '"[^\\n]*'))
    || [''])[0];
  const daA = daAluna('Aluna A');
  const daB = daAluna('Aluna B');
  const daC = daAluna('Aluna C');
  provar('anamnese VINCULADA — a acção diz «novo registo» e leva o carimbo',
    /novo=anamnese-20261105-2301/.test(daA) && />novo registo</.test(daA), daA);
  provar('anamnese SOLTA — a acção diz «editar» e leva o carimbo',
    /editar=anamnese-20261105-2031/.test(daB) && />editar</.test(daB), daB);
  provar('…e o endereço leva a aluna e o professor (o contexto do acto)',
    /aluna=Aluna%20A/.test(daA) && /professor=prova/.test(daA), daA);
  provar('o segundo link imprime a folha daquela aluna, na rota da estante',
    /href="\/anamnese\/api\/ficha-preenchida\.anamnese-20261105-2301\?formato=html"/.test(daA),
    daA);

  /* A ALUNA SEM ANAMNESE NÃO GANHA UM LINK QUE MENTE. */
  provar('aluna sem anamnese: diz-se, e oferece-se o gesto de a fazer',
    /sem anamnese registada/.test(daC) && />fazer a anamnese</.test(daC), daC);
  provar('…e NÃO lhe dá um «imprimir» (seria um 404 com aparência de dado)',
    !/ficha-preenchida/.test(daC) && !/novo=/.test(daC) && !/editar=/.test(daC), daC);

  /* AS PEÇAS SÃO DO CATÁLOGO: o `select` é desenhado pela folha, e as acções são `a.acao`. */
  provar('as acções usam a peça de acção da folha, e não uma classe inventada',
    (b.match(/class="acao secundario pequena"/g) || []).length >= 4, b.slice(0, 120));
  /* A FILEIRA TEM PEÇA, E A PEÇA É UMA SÓ (06/11/2026). A primeira versão desta secção emitia
   * `<div data-prov-par>` sem classe nenhuma, e um `<div>` nu não tem ar: medido no documento
   * publicado, o botão ficava 1px abaixo do menu das alunas. A classe que aqui se exige é a que
   * a folha desenha — não uma inventada na marcação (era o que esta asserção proibia antes). */
  provar('as acções de cada aluna vivem na fileira da folha (`.acoes-da-aluna`)',
    (b.match(/class="acoes-da-aluna" data-prov-par=/g) || []).length >= 2,
    (b.match(/<div[^>]*>/g) || []));
  provar('…e nenhuma outra classe é inventada no documento',
    b !== '' && !/class="(?!(acao secundario pequena|acoes-da-aluna))[^"]*"/.test(b),
    (b.match(/class="[^"]*"/g) || []));
  /* A PEÇA EXISTE NA FOLHA — a classe emitida não pode ser só um nome. */
  const folha = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  provar('…e essa fileira está DESENHADA em tools/templates/ciclo.css',
    /^\.acoes-da-aluna\s*\{[^}]*margin:/m.test(folha),
    (folha.match(/\.acoes-da-aluna[^{]*\{[^}]*\}/) || ['ausente'])[0]);

  /* O PAPEL NÃO FICA SEM PROVENIÊNCIA: o bloco some no LaTeX, mas a frase fica nos dois. */
  provar('a frase diz onde as anamneses estão — e é texto, não marcação (fica no PDF)',
    /está na \*\*Área do Professor\*\*/.test(s6), s6.split('\n').filter((l) => /Área do Professor/.test(l)));
  provar('…e diz o que cada gesto faz, e porque um deles é «novo registo»',
    /a senha é pedida lá/.test(s6) && /novo registo/.test(s6) && /o retrato anterior fica/.test(s6));
  provar('…e não imprime nome de ficheiro nem de função',
    !/derivar-ciclo|\.js\b|envelope/.test(s6.replace(/```[\s\S]*?```/g, '')), s6);
}

// ---------------------------------------------------------------------------------------------
console.log('\nD. O SELECTOR FUNCIONA, E DEGRADA SEM JAVASCRIPT');
{
  /* O SCRIPT É A PEÇA QUE NENHUM VALIDADOR LÊ. Aqui ele corre num DOM a sério (jsdom), sobre o
   * bloco que a derivação emite: escolher a aluna B tem de mostrar as acções dela, e só as dela. */
  const anamneses = {
    'Aluna A': { carimbo: 'anamnese-20261105-2301', vinculada: true },
    'Aluna B': { carimbo: 'anamnese-20261105-2031', vinculada: false },
  };
  const bloco = blocoHtml(secao6(comLinhaDeBase({ anamneses }))) || '';
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><body>' + bloco + '</body>', { runScripts: 'dangerously' });
  const win = dom.window;
  const visiveis = () => [...win.document.querySelectorAll('[data-prov-par]')]
    .filter((d) => !d.hidden).map((d) => d.getAttribute('data-prov-par'));
  const sel = win.document.getElementById('prov-seletor');
  provar('o `<select>` existe, e é uma peça da folha (sem classe nenhuma a desenhar)',
    Boolean(sel) && sel.getAttribute('class') === null, sel && sel.getAttribute('class'));
  provar('ao abrir, nenhuma acção está à vista (é o que a aluna escolhida revela)',
    visiveis().length === 0, visiveis());
  /* O `if (sel)` é o que faz a contraprova REPROVAR em vez de estourar: contra um motor sem
   * selector não há onde carregar, e um `TypeError` não é um veredicto. */
  if (sel) {
    sel.value = 'Aluna B';
    sel.dispatchEvent(new win.Event('change'));
    provar('escolher a aluna B mostra as acções DELA', visiveis().join(',') === 'Aluna B', visiveis());
    sel.value = 'Aluna A';
    sel.dispatchEvent(new win.Event('change'));
    provar('…e trocar para a A troca as acções', visiveis().join(',') === 'Aluna A', visiveis());
  } else {
    provar('escolher a aluna B mostra as acções DELA', false, 'sem selector');
    provar('…e trocar para a A troca as acções', false, 'sem selector');
  }

  /* A DEGRADAÇÃO: sem JavaScript nenhum atributo `hidden` é posto — e ficam todas as acções à
   * vista, que é o comportamento anterior. A página perde o conforto, não a função. */
  const semJs = new JSDOM('<!doctype html><body>' + bloco + '</body>');
  const todas = [...semJs.window.document.querySelectorAll('[data-prov-par]')];
  provar('sem JavaScript, todas as acções ficam à vista (nada se esconde para sempre)',
    todas.length === 2 && todas.every((d) => !d.hidden), todas.length);
}

// ---------------------------------------------------------------------------------------------
console.log('\nE2. SEM O MAPA DE CARIMBOS, A SECÇÃO DEGRADA (não parte)');
{
  /* `anamneses` é OPCIONAL: o derivador é puro e não lê o acervo. Sem ele, o que não se sabe não
   * se inventa — fica o gesto que não precisa de carimbo. */
  const s6 = secao6(aula());
  const bloco = blocoHtml(s6);
  const b2 = bloco || '';
  provar('todas as alunas continuam no selector',
    (b2.match(/<option value="Aluna /g) || []).length === 3, b2.slice(0, 120));
  provar('…todas com o gesto de fazer, e nenhum carimbo inventado',
    b2 !== '' && !/novo=/.test(b2) && !/editar=/.test(b2)
    && (b2.match(/>fazer a anamnese</g) || []).length === 3, b2.slice(0, 160));
  provar('…e a secção não promete «imprimir» o que não sabe onde está',
    !/ficha-preenchida/.test(b2), b2);
}

// ---------------------------------------------------------------------------------------------
console.log('\nE. O CARIMBO É O VIGENTE — a regra que alimenta a §6');
{
  /* A regra vive em `porta.anamneses`, que é quem a lista da Área do Professor também usa. Aqui
   * mede-se a FONTE: dois retratos da mesma aluna, um PO que a declara, e o que sai é o carimbo
   * mais recente — marcado como vinculado. */
  const prefixo = porta.PREFIXO_ENVELOPES;
  const envelopes = {
    'anamnese-20261105-2031.json': {
      id: 'anamnese-20261105-2031', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', aluna: 'Aluna A' },
      respostas: {},
    },
    'anamnese-20261105-2301.json': {
      id: 'anamnese-20261105-2301', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', aluna: 'Aluna A' },
      respostas: {},
    },
    'anamnese-20261106-0900.json': {
      id: 'anamnese-20261106-0900', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', aluna: 'Aluna B' },
      respostas: {},
    },
    'po-20261106-1108.json': {
      id: 'po-20261106-1108', envelope: '1.2.0',
      contexto: { escola: 'prova', professor: 'prova', ciclo: '01' },
      respostas: { sujeitos: { valor: ['Aluna A'] } },
    },
  };
  const chaves = Object.keys(envelopes).map((n) => prefixo + n);
  const armazenamento = {
    async listar(p) { return chaves.filter((c) => c.indexOf(p) === 0); },
    async ler(c) {
      const nome = c.indexOf(prefixo) === 0 ? c.slice(prefixo.length) : c;
      return Object.prototype.hasOwnProperty.call(envelopes, nome) ? JSON.stringify(envelopes[nome]) : null;
    },
    async gravar() { return { ok: true }; },
  };
  const lista = await porta.anamneses(armazenamento);
  const deA = lista.find((o) => o.valor === 'Aluna A');
  const deB = lista.find((o) => o.valor === 'Aluna B');
  provar('da mesma aluna, o carimbo que vale é o MAIS RECENTE',
    Boolean(deA) && deA.carimbo === 'anamnese-20261105-2301', deA && deA.carimbo);
  provar('…e a que aparece num PO vem marcada como vinculada',
    Boolean(deA) && deA.vinculada === true, deA && deA.vinculada);
  provar('…e a que não aparece em PO nenhum vem solta',
    Boolean(deB) && deB.vinculada === false, deB && deB.vinculada);
}

// ---------------------------------------------------------------------------------------------
console.log('\nH. O RESPIRO ENTRE O MENU DAS ALUNAS E OS BOTÕES (medido em navegador)');
{
  /* O RELATO: «quando eu escolho a aluna, o botão novo registro e imprimir estão colados no
   * dropdown na lista de seleção. Não pode, tem que ter um respiro.» Medido no documento
   * publicado, com a folha de antes: o `<select>` acabava em 3139,6px e o `<div>` das acções
   * começava em 3139,6px — **1px** entre o menu e o botão, em 1280 E em 390.
   *
   * PORQUE EM NAVEGADOR. A pergunta é de DISTÂNCIA, e nenhuma leitura do CSS a responde: um
   * `margin-top: 12px` pode ser comido pelo colapso de margens, ou o `<div>` pode trazer o
   * `margin: 0` do `.acao` (que é o que punha os botões na linha). A lição do respiro do
   * cabeçalho é esta mesma: o CSS dizia 8px e a tela mostrava 0,3px. */
  const anamneses = {
    'Aluna A': { carimbo: 'anamnese-20261105-2301', vinculada: true },
    'Aluna B': { carimbo: 'anamnese-20261105-2031', vinculada: false },
  };
  const bloco = blocoHtml(secao6(comLinhaDeBase({ anamneses }))) || '';

  /* A ESTÁTICA PRIMEIRO: a peça tem de existir e o vão tem de ser o do passo da escala. */
  const folha = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  const tokens = new Map([...folha.matchAll(/(--esp-\d)\s*:\s*(\d+)px/g)].map((m) => [m[1], Number(m[2])]));
  const regra = (/\.acoes-da-aluna\s*\{([^}]*)\}/.exec(folha) || [])[1] || '';
  const margem = (/margin\s*:\s*var\((--esp-\d)\)/.exec(regra) || [])[1];
  provar('a fileira separa-se do menu com um passo da ESCALA (e não com um número à mão)',
    Boolean(margem) && tokens.get(margem) >= 12, { regra: regra.trim().slice(0, 80), margem,
      px: margem ? tokens.get(margem) : null });

  let puppeteer = null;
  try {
    const MARP = path.join(require('node:child_process').execSync('npm root -g').toString().trim(),
      '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch { /* sem navegador, a medida geométrica não se faz — e diz-se */ }
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((c) => fs.existsSync(c));

  if (!puppeteer || !executavel) {
    console.log('  —     a medida geométrica NÃO FOI FEITA (sem puppeteer/Chrome neste ambiente)');
  } else {
    /* A PÁGINA É A DO PACOTE, em ponto pequeno: a folha da FONTE (é ela que o gerador copia) e
     * o bloco que a derivação emite. Mede-se o mesmo que se mediu na queixa. */
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-respiro-'));
    fs.mkdirSync(path.join(dir, 'assets'));
    fs.copyFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), path.join(dir, 'assets/style.css'));
    fs.writeFileSync(path.join(dir, 'aula.html'),
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
      + '<link rel="stylesheet" href="assets/style.css"></head><body><main>'
      + '<p>A anamnese de cada uma das 2 alunas do elenco desta turma está na <strong>Área do '
      + 'Professor</strong>.</p>' + bloco + '</main></body></html>');

    const MEDIR = () => {
      const s = document.getElementById('prov-seletor');
      const visiveis = [...document.querySelectorAll('[data-prov-par]')].filter((d) => !d.hidden);
      const acoes = visiveis.length ? [...visiveis[0].querySelectorAll('a.acao')] : [];
      const r2 = (n) => Math.round(n * 10) / 10;
      const cx = s ? s.getBoundingClientRect() : null;
      return {
        temSeletor: Boolean(s),
        vaoDoMenu: acoes.length && cx ? r2(acoes[0].getBoundingClientRect().top - cx.bottom) : null,
        vaoEntreAcoes: acoes.length > 1
          ? r2(acoes[1].getBoundingClientRect().left - acoes[0].getBoundingClientRect().right) : null,
        umaLinha: acoes.length > 1
          ? Math.abs(acoes[0].getBoundingClientRect().top - acoes[1].getBoundingClientRect().top) < 2
          : null,
      };
    };

    const br = await puppeteer.launch({ executablePath: executavel,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    try {
      for (const [w, h] of [[1280, 900], [390, 844]]) {
        const pg = await br.newPage();
        await pg.setViewport({ width: w, height: h });
        await pg.goto('file://' + path.join(dir, 'aula.html'), { waitUntil: 'load' });
        await pg.select('#prov-seletor', 'Aluna A');
        await new Promise((r) => setTimeout(r, 120));
        const m = await pg.evaluate(MEDIR);
        provar(`o menu e os botões têm respiro em ${w}px (o vão mínimo é 12px)`,
          m.temSeletor && m.vaoDoMenu !== null && m.vaoDoMenu >= 12, { ...m, largura: w });
        provar(`os dois botões não se encostam em ${w}px`, m.vaoEntreAcoes !== null && m.vaoEntreAcoes >= 8,
          { ...m, largura: w });
        await pg.close();
      }
    } finally { await br.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

// ---------------------------------------------------------------------------------------------
console.log('\nF. O CONTRATO DE EXTRAÇÃO CONTINUA A LER A §6 COMO TEXTO');
{
  /* O MODO DE FALHA SILENCIOSO DESTA SECÇÃO. `proveniencia` é `string` no schema da aula. Um `###`
   * a mais faria dele um objeto (`{subcampo: texto}`), e uma tabela a mais mudaria o texto — mas
   * NENHUMA das duas mudanças se vê na página. Quem as apanha é a validação, e é ela que aqui se
   * corre, com a ferramenta a sério. */
  const anamneses = {
    'Aluna A': { carimbo: 'anamnese-20261105-2301', vinculada: true },
    'Aluna B': { carimbo: 'anamnese-20261105-2031', vinculada: false },
  };
  const md = aula({ anamneses });
  const arquivo = path.join(os.tmpdir(), 'aula-proveniencia-' + process.pid + '.md');
  fs.writeFileSync(arquivo, md);
  let extraido = null;
  try {
    const r = spawnSync(process.execPath, [path.join(RAIZ, 'tools/validar-aula-ciclo.js'),
      path.join(RAIZ, 'modelo/ciclos/ciclo-01-aula-schema.json'), arquivo, '--json'],
    { encoding: 'utf8' });
    try { extraido = JSON.parse(r.stdout); } catch (erro) { extraido = null; }
  } finally {
    fs.rmSync(arquivo, { force: true });
  }
  const prov = extraido && extraido.proveniencia;
  provar('a §6 extrai-se como TEXTO (o tipo do schema), e não como objeto',
    typeof prov === 'string', typeof prov);
  /* A MARCAÇÃO NÃO ENTRA NO TEXTO. O selector vive num bloco `{=html}`, e um bloco declarado
   * para UM alvo não é conteúdo do campo (é a regra nova do contrato, §1.º deste ficheiro de
   * extracção). Sem ela, o `proveniencia` do JSON saía com `<select>` e `<option>` dentro. */
  provar('…e o texto extraído traz a frase, sem marcação nenhuma dentro',
    typeof prov === 'string' && /Anamnese de cada aluna/.test(prov)
    && /Área do Professor/.test(prov) && !/<(select|option|div|script|a )/.test(prov),
    typeof prov === 'string' ? prov.slice(-260) : prov);
}

// ---------------------------------------------------------------------------------------------
console.log('');
if (falhas) {
  console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
  process.exit(1);
}
console.log('TUDO CERTO — ' + total + ' asserções: o plano de ensino e a aula dizem a turma no '
  + 'cabeçalho; a §6 mostra um SELECTOR com o ELENCO DA LINHA DE BASE (a aluna de fora não entra) '
  + 'e, por aluna, o gesto que o servidor aceita (editar ou novo registo) e o link da folha; o '
  + 'selector funciona e degrada sem JavaScript; a aluna sem anamnese diz-se em vez de prometer um '
  + '404; e a '
  + '§6 extrai-se como texto — sem marcação dentro.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
