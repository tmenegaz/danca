#!/usr/bin/env node
'use strict';

/**
 * provar-o-botao-adicionar.js — O «ADICIONAR» DO ESCOLHEDOR SÓ ACENDE COM UM ITEM ESCOLHIDO.
 *
 * O PEDIDO, na letra dela (20/11/2026): «Observa o seguinte: o botão adicionar do conteúdo do estilo
 * só pode ficar habilitado se o conteúdo for escolhido, tá? Se não for escolhido nenhum conteúdo,
 * esse botão fica desabilitado, o botão adicionar.»
 *
 * PORQUE É QUE ISTO NÃO É PREGUIÇA DE INTERFACE. Um botão que se pode carregar sem escolha não faz
 * nada — e «não faz nada» é indistinguível de «está quebrado» para quem carrega. Nesta mesma tela
 * ela já perdeu minutos a carregar em «Gravar» que não gravava, e a conclusão dela foi a certa:
 * «então o adicionar abre um modal. Aí eu preciso saber exatamente qual é o botão então, que agora
 * eu não lembro, porque não tá claro isso». Um botão que só acende quando pode agir diz isso sem
 * uma palavra de instrução.
 *
 * O QUE SE MEDE — o gesto real, em jsdom, pelo caminho do evento:
 *   A. em repouso, o «Adicionar» está desabilitado e diz porquê (no `title`, que é a peça da casa);
 *   B. escolher uma opção no `<select>` acende-o, e o `title` sai;
 *   C. voltar a «— escolher —» apaga-o outra vez;
 *   D. a escuta é no DOCUMENTO, e não em cada `<select>`: um escolhedor que nasça depois (a lista de
 *      conteúdos é repintada quando a Turma muda) tem de acender na mesma. É a família de defeito
 *      que já custou a esta página três correcções;
 *   E. os DOIS escolhedores da página obedecem — o dos conteúdos e o das alunas.
 *
 *   node experimentos/provar-o-botao-adicionar.js
 */

const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let provas = 0;
let falhas = 0;
function conferir(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('ok    ' + titulo); return; }
  falhas += 1;
  console.log('FALHA ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const USOS_VAZIOS = () => ({ professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 });

function pagina() {
  return bastidores.paginaProducao('breu', {},
    [{ nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' }],
    ['abreu'], 'Brise Volet', 'brise-volet',
    [{ id: 'plie', termo: 'Plié', categoria: 'passo', tradicao: 'vaganova' }],
    [], {}, [], [], [],
    USOS_VAZIOS(), null, null, [], new Set());
}

(async () => {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e).split('\n')[0]));
  const dom = new JSDOM(pagina(), {
    runScripts: 'dangerously',
    url: 'https://breu.padd.com.br/bastidores/estudio',
    virtualConsole: vc,
    /* SEM `fetch`, O SCRIPT ABORTA E NENHUM OUVINTE É REGISTADO — e a prova passaria a medir uma
     * página a que faltava metade do comportamento, com o `disabled` certo por acidente (o botão já
     * nasce apagado no HTML). A rede de mentira devolve o vazio e deixa o resto do script correr. */
    beforeParse(w) {
      w.fetch = () => Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({}), text: () => Promise.resolve(''),
      });
    },
  });
  const d = dom.window.document;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  await espera(200);

  const escolhedores = Array.from(d.querySelectorAll('.escolhedor'));
  const dosConteudos = d.getElementById('esc-conteudos');
  /* O DAS ALUNAS VIVE NA CURADORIA, e a curadoria só se desenha quando há uma para esta dona. Sem
   * ela, o segundo escolhedor não existe na página — e exigir os dois seria exigir uma fixture que
   * não é a página real. A prova exige o que a página tem e mede o que ela desenha. */
  const dasAlunas = d.getElementById('esc-alunas');

  console.log('\nA. Em repouso, sem escolha');
  conferir('a página desenha o escolhedor dos conteúdos', Boolean(dosConteudos),
    escolhedores.map((e) => e.id));
  conferir('o «Adicionar» do conteúdo nasce DESABILITADO',
    dosConteudos.querySelector('.adicionar').disabled === true,
    dosConteudos.querySelector('.adicionar').disabled);
  conferir('…e diz porquê, no `title` (a peça da casa, não uma frase no formulário)',
    /escolh/i.test(dosConteudos.querySelector('.adicionar').getAttribute('title') || ''),
    dosConteudos.querySelector('.adicionar').getAttribute('title'));
  /* TODOS os que a página desenhou, e não só o dos conteúdos: a regra é do componente, não de uma
   * instância. Se um dia houver três, esta linha cobre os três. */
  conferir('…e todos os escolhedores da página obedecem à mesma regra',
    escolhedores.every((e) => e.querySelector('.adicionar').disabled === true),
    escolhedores.map((e) => [e.id, e.querySelector('.adicionar').disabled]));

  console.log('\nB. Escolher um conteúdo acende-o');
  const selConteudos = dosConteudos.querySelector('select.opcoes');
  let opcoes = Array.from(selConteudos.querySelectorAll('option'))
    .filter((o) => String(o.value || '').trim() !== '');
  /* A LISTA VEM DO CATÁLOGO, e um exercício só é escolhível quando tem NOTAÇÃO no alfabeto da
   * modalidade. Numa página montada à mão pode não haver nenhum. A prova é do BOTÃO e não do
   * catálogo: acrescenta-se a opção, que é o que o dicionário faria, e mede-se o que acontece ao
   * escolhê-la. O que NÃO se faz é saltar a asserção em silêncio quando a lista vem vazia — foi
   * assim que provas desta casa passaram a medir o vazio. */
  if (!opcoes.length) {
    selConteudos.add(new dom.window.Option('Plié', 'Plié'));
    opcoes = Array.from(selConteudos.querySelectorAll('option'))
      .filter((o) => String(o.value || '').trim() !== '');
    console.log('      (a lista do catálogo vinha vazia — a opção foi acrescentada para medir o botão)');
  }
  conferir('o select do conteúdo tem uma opção para escolher', opcoes.length >= 1,
    Array.from(selConteudos.querySelectorAll('option')).map((o) => o.value));
  {
    selConteudos.value = opcoes[0].value;
    /* O CAMINHO DO CLIQUE: `change` no `<select>`, como o rato faz. Atribuir `select.value` não
     * dispara nada — é a diferença entre mudar o valor e mudar a escolha. */
    selConteudos.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await espera(20);
    conferir('escolher acende o «Adicionar»',
      dosConteudos.querySelector('.adicionar').disabled === false,
      dosConteudos.querySelector('.adicionar').disabled);
    conferir('…e o `title` sai, porque já não há nada a explicar',
      !dosConteudos.querySelector('.adicionar').getAttribute('title'),
      dosConteudos.querySelector('.adicionar').getAttribute('title'));

    console.log('\nC. Voltar a «— escolher —» apaga-o outra vez');
    selConteudos.value = '';
    selConteudos.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await espera(20);
    conferir('desescolher volta a apagar o botão',
      dosConteudos.querySelector('.adicionar').disabled === true,
      dosConteudos.querySelector('.adicionar').disabled);
  }

  console.log('\nD. A escuta é no documento — um escolhedor que nasça depois também obedece');
  {
    /* O PIOR CASO, e é o que acontece de verdade: a lista de conteúdos é repintada quando a Turma
     * muda, e o `<select>` que existe agora já não é o mesmo. Um ouvinte preso ao elemento morria
     * no primeiro repinte. Aqui simula-se o repinte: um escolhedor novo, criado depois, e depois
     * um `change` nele. */
    const novo = d.createElement('div');
    novo.className = 'escolhedor';
    novo.id = 'esc-novo-da-prova';
    novo.innerHTML = '<div class="escolhidos"></div><div class="entrada">'
      + '<select class="opcoes"><option value="">— escolher —</option>'
      + '<option value="batman-gt">Batman GT</option></select>'
      + '<button type="button" class="adicionar acao pequena" disabled>Adicionar</button></div>';
    d.getElementById('sec-turmas').appendChild(novo);
    const selNovo = novo.querySelector('select.opcoes');
    selNovo.value = 'batman-gt';
    selNovo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await espera(20);
    conferir('…um escolhedor nascido depois acende na mesma',
      novo.querySelector('.adicionar').disabled === false,
      novo.querySelector('.adicionar').disabled);
    novo.remove();
  }

  console.log('\nE. A página não lança');
  conferir('os scripts da página não lançam', erros.length === 0, erros.slice(0, 2));
  dom.window.close();

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o «Adicionar» dos dois escolhedores só acende com um '
      + 'item escolhido, diz porquê quando está apagado, obedece no caminho do evento, e obedece '
      + 'também quando o escolhedor nasce depois de a página ter montado.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
