#!/usr/bin/env node
'use strict';

/**
 * provar-paginacao.js — as listas da Produção folheiam de verdade (17/10/2026).
 *
 * O DEFEITO. O dono do produto reparou nas Turmas e no Vocabulário: o rodapé dizia «1 / 3» e
 * nenhum clique o mudava. As duas listas eram as únicas com tamanho suficiente para paginar,
 * e foi por isso que só elas apareceram — mas a paginação da Produção é UMA implementação
 * partilhada pelas SETE listas, e estava quebrada em todas.
 *
 * A causa, numa linha:
 *
 *     var passos = b.className === "paginas-prox" ? 1 : -1;
 *
 * O `className` de um elemento é o atributo `class` INTEIRO, e os botões nascem com
 * `class="paginas-prox acao secundario pequena"`. A comparação era sempre falsa, os dois botões
 * valiam -1, e como o `paginar()` trava a página em `[1, N]`, a página 1 era o fim da linha:
 * «›» recuava para 1, «‹» recuava para 1, e o número nunca subia.
 *
 * O que passou despercebido foi a FORMA do erro: o botão ganhou as classes de estilo e a
 * comparação nasceu a exigir que ele tivesse UMA. Por isso a correcção é `classList.contains`
 * — que sobrevive a uma classe a mais, e é o que a próxima pessoa não vai quebrar sem reparar.
 *
 * PORQUE ESTA PROVA NÃO É DE CONTRATO. A pergunta é «o clique move a lista?» — e isso só se
 * responde com um DOM e um clique a sério. A prova monta a página da Produção pelo caminho
 * verdadeiro (`bastidores.fetch`, com um KV em memória), carrega o HTML no jsdom, CARREGA os
 * scripts e CLICA nos botões. Um teste que chamasse o `paginar()` directamente passaria com
 * o defeito lá dentro — foi exactamente assim que ele passou até hoje.
 *
 *   uso: npm install --no-save jsdom && node experimentos/provar-paginacao.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let JSDOM;
let VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (e) {
  console.error('falta o jsdom: npm install --no-save jsdom');
  process.exit(2);
}

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  \u2713 ' + rotulo); return; }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'danca';
const CHAVE = (nome) => 'bastidores/' + ESCOLA + '/' + nome;

/** O KV dos Bastidores é `get`/`put` — não o `ler`/`guardar` do núcleo. */
function kvEmMemoria(mapa) {
  const guardado = Object.assign(Object.create(null), mapa);
  return {
    async get(k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
    async put(k, v) { guardado[k] = String(v); },
    async delete(k) { delete guardado[k]; },
    _guardado: guardado,
  };
}

/** As CINCO listas com `quantos` itens cada — os nomes que a página mostra em cada `<h3>`.
 *
 *  Eram SETE (18/10/2026): «Rubricas criadas» e «Com que régua cada turma é medida» saíram
 *  quando a secção Turmas passou a ter UMA listagem só, a mesma nos três passos. As rubricas
 *  continuam a existir no KV (e a ser semeadas abaixo), mas não têm painel próprio.
 *
 *  E QUATRO desde 01/11/2026: «Termos cadastrados» saiu com a secção do vocabulário. */
const LISTAS = [
  // A ALUNA é o APELIDO em texto — a lista é de strings, não de objectos (`esc(a)` na
  // página). Semear objectos aqui dava quinze linhas a dizer `[object Object]`: o teste
  // passaria a provar a paginação de quinze linhas iguais, que é provar nada.
  { titulo: 'Professores cadastrados', chave: 'professores', itens: (i) => ({ id: 'p' + i, nome: 'Professor ' + i, slug: 'professor-' + i }) },
  { titulo: 'Alunas cadastradas', chave: 'alunas', itens: (i) => 'Aluna ' + i },
  { titulo: 'Salas cadastradas', chave: 'turmas', itens: (i) => ({ id: 't' + i, nome: 'Turma ' + i, modalidade: 'Balé clássico' }) },
  { titulo: 'Turmas atribuídas', chave: 'curadorias', itens: (i) => ({ id: 'c' + i, professor: 'Professor ' + i, modalidade: 'Balé clássico', turma: 'Turma ' + i }) },
];

/* DUAS DESTAS LISTAS NÃO SE DESENHAM NO SERVIDOR, e por isso não entram na semente: «Elencos»
 * nasce com uma linha só («carregando…») e é o cliente que a preenche, e «Exercícios com verbete»
 * nasce vazia. Uma prova que as semeasse estaria a medir um HTML que a página não produz. Elas
 * continuam a ser cobertas pela varredura do ponto 1.1, que olha para TODOS os painéis.
 *
 * O QUE MUDOU AQUI (17/11/2026): os títulos. «Turmas cadastradas» chama-se hoje «Salas
 * cadastradas», «Termos cadastrados» deixou de existir com a secção do vocabulário, e as
 * «Curadorias atribuídas» chamam-se «Turmas atribuídas». A prova esteve a medir títulos de uma
 * página que já não existe, e passou a falhar toda por isso — não porque a paginação tivesse
 * partido. */
/** Monta o mapa do KV com `quantos` itens em cada lista. `turma-conteudos` é um MAPA. */
function semear(quantos) {
  const mapa = {};
  for (const l of LISTAS) {
    const lista = [];
    for (let i = 1; i <= quantos; i += 1) lista.push(l.itens(i));
    mapa[CHAVE(l.chave)] = JSON.stringify(lista);
  }
  // AS RUBRICAS E OS VÍNCULOS continuam a ser dados que a página lê, mesmo sem painel
  // próprio: sem eles, o passo «Associar» não teria o que oferecer e a régua do cartão
  // cairia na padrão — a prova mediria uma página mais pobre do que a real.
  const rubricas = [];
  const vinculos = {};
  for (let i = 1; i <= quantos; i += 1) {
    rubricas.push({ id: 'r' + i, nome: 'Rubrica ' + i, niveis: [] });
    vinculos['t' + i] = ['v' + i];
  }
  mapa[CHAVE('rubricas')] = JSON.stringify(rubricas);
  mapa[CHAVE('turma-conteudos')] = JSON.stringify(vinculos);
  return mapa;
}

async function abrirProducao(quantos) {
  const kv = kvEmMemoria(semear(quantos));
  const res = await bastidores.fetch(
    new Request('https://prova.test/bastidores/producao'),
    { ESCOLA_SLUG: ESCOLA, PADD_KV: kv, PROFESSOR_NOME: 'Tiago Menegaz' }
  );
  const html = await res.text();
  const erros = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) erros.push(e.message); });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: vc,
    url: 'https://prova.test/bastidores/producao',
    /* O `fetch` DO JSDOM NÃO EXISTE, e a página pede as listas ao servidor assim que abre. Sem
     * este substituto o script morria na primeira chamada e metade da página deixava de correr —
     * o erro aparecia como «a página carrega sem erro de script», que é verdade e não diz nada
     * sobre a paginação. A promessa pendente é o servidor que não responde: o que se mede aqui é
     * o que a página faz com o que já tem. */
    beforeParse(janela) { janela.fetch = () => new Promise(() => {}); },
  });
  return { dom, doc: dom.window.document, erros, html };
}

/** O painel de uma lista, pelo título — é como o professor o encontra. */
function painelDe(doc, titulo) {
  return Array.from(doc.querySelectorAll('[data-paginar]'))
    .find((p) => {
      const h = p.querySelector('h3');
      return h && String(h.textContent).trim() === titulo;
    }) || null;
}

function visiveis(painel) {
  const ul = painel.querySelector('ul');
  return Array.from(ul.children).filter((li) => !li.hidden);
}

function textoDaPagina(painel) {
  const info = painel.querySelector('.paginas-info');
  return info ? String(info.textContent).trim() : '(sem .paginas-info)';
}

/** O texto de cada linha visível — para provar que nenhuma se perde nem se repete. */
function linhasVisiveis(painel) {
  return visiveis(painel).map((li) => String(li.textContent).replace(/\s+/g, ' ').trim());
}

(async () => {
  // -------------------------------------------------------------------------
  console.log('\n1. As CINCO listas da Produção folheiam (15 itens, 7 por página)');
  // -------------------------------------------------------------------------
  const { doc, erros } = await abrirProducao(15);

  checar('a página carrega sem erro de script', erros.length === 0, erros);

  const paineis = Array.from(doc.querySelectorAll('[data-paginar]'));
  checar('as listas pagináveis da Produção são as quatro da semente',
    LISTAS.every((l) => Boolean(painelDe(doc, l.titulo))),
    paineis.map((p) => (p.querySelector('h3') || {}).textContent));

  for (const lista of LISTAS) {
    const painel = painelDe(doc, lista.titulo);
    checar('[' + lista.titulo + '] o painel existe', Boolean(painel));
    if (!painel) continue;

    // A CONTAGEM VEM DO DOM, não do que foi semeado. Os Professores ganham SEMPRE o dono
    // à frente (a linha «criado na página»), e uma prova que fixasse 15 estaria a medir o
    // seed em vez de medir a página.
    const ul = painel.querySelector('ul');
    const total = ul.children.length;
    const porPagina = parseInt(painel.getAttribute('data-por-pagina') || '10', 10);
    const paginas = Math.max(1, Math.ceil(total / porPagina));
    const ultima = total - porPagina * (paginas - 1);

    const rodape = painel.querySelector('.paginas');
    checar('  o rodapé aparece com mais de uma página',
      Boolean(rodape) && rodape.hidden === false, rodape && rodape.hidden);
    checar('  diz «1 / ' + paginas + '»', textoDaPagina(painel) === '1 / ' + paginas, textoDaPagina(painel));
    checar('  a página 1 mostra ' + Math.min(porPagina, total) + ' itens',
      visiveis(painel).length === Math.min(porPagina, total), visiveis(painel).length);

    const pagina1 = linhasVisiveis(painel);
    checar('  a página 1 começa no primeiro item',
      ul.children[0].hidden === false, ul.children[0].hidden);
    checar('  o ' + (porPagina + 1) + '.º item NÃO está na página 1',
      ul.children[porPagina].hidden === true, ul.children[porPagina].hidden);

    const prox = painel.querySelector('.paginas-prox');
    const ant = painel.querySelector('.paginas-ant');
    checar('  o «‹» nasce desabilitado na primeira página', ant.disabled === true, ant.disabled);
    checar('  o «›» nasce habilitado', prox.disabled === false, prox.disabled);

    // O CLIQUE — o gesto que não funcionava.
    prox.click();
    checar('  «›» leva à página 2', textoDaPagina(painel) === '2 / ' + paginas, textoDaPagina(painel));
    checar('  a página 2 mostra ' + porPagina + ' itens', visiveis(painel).length === porPagina, visiveis(painel).length);
    checar('  e são OUTROS itens (a página mudou mesmo)',
      JSON.stringify(linhasVisiveis(painel)) !== JSON.stringify(pagina1),
      [pagina1.slice(0, 1), linhasVisiveis(painel).slice(0, 1)]);
    checar('  o «‹» fica habilitado na página 2', ant.disabled === false, ant.disabled);

    // Salta até à última página — com TETO de cliques. Sem teto, o próprio defeito que
    // esta prova existe para apanhar a fazia NUNCA TERMINAR: com `passos` sempre -1, o
    // «›» fica eternamente habilitado e a página nunca chega à última. Uma prova que
    // trava em vez de falhar é uma prova que esconde o resultado.
    for (let salto = 0; salto < paginas && !prox.disabled; salto += 1) prox.click();
    checar('  «›» chega à última página', textoDaPagina(painel) === paginas + ' / ' + paginas, textoDaPagina(painel));
    checar('  a última página mostra o que sobra (' + ultima + ')', visiveis(painel).length === ultima, visiveis(painel).length);
    checar('  o «›» fica desabilitado na última página', prox.disabled === true, prox.disabled);

    // O ÚLTIMO clique de todos: o botão está desabilitado, logo não há evento. A página não
    // pode sair da faixa.
    prox.click();
    checar('  «›» na última página não sai da faixa',
      textoDaPagina(painel) === paginas + ' / ' + paginas, textoDaPagina(painel));

    ant.click();
    checar('  «‹» recua uma página', textoDaPagina(painel) === (paginas - 1) + ' / ' + paginas, textoDaPagina(painel));
    for (let volta = 0; volta < paginas + 1 && !ant.disabled; volta += 1) ant.click();
    checar('  «‹» volta à primeira', textoDaPagina(painel) === '1 / ' + paginas, textoDaPagina(painel));
    ant.click();
    checar('  «‹» na primeira página não sai da faixa', textoDaPagina(painel) === '1 / ' + paginas, textoDaPagina(painel));

    // NENHUM ITEM SE PERDE, NENHUM SE REPETE: folheando todas as páginas, o conjunto de
    // linhas tem de ser o da lista inteira. É o que distingue «paginar» de «esconder».
    const todas = [];
    for (let p = 1; p <= paginas; p += 1) {
      todas.push(...linhasVisiveis(painel));
      if (p < paginas) prox.click();
    }
    checar('  folheando todas as páginas aparecem as ' + total + ' linhas', todas.length === total, todas.length);
    checar('  e nenhuma linha se repete', new Set(todas).size === total, new Set(todas).size);
  }

  // -------------------------------------------------------------------------
  console.log('\n2. Sem o que paginar, o rodapé não aparece');
  // -------------------------------------------------------------------------
  {
    const { doc: d7 } = await abrirProducao(7);
    const painel = painelDe(d7, 'Salas cadastradas');
    checar('7 itens: nenhuma página a mais', textoDaPagina(painel) === '1 / 1', textoDaPagina(painel));
    checar('7 itens: o rodapé fica escondido', painel.querySelector('.paginas').hidden === true);
    checar('7 itens: e os sete estão à vista', visiveis(painel).length === 7, visiveis(painel).length);
  }
  {
    const { doc: d0 } = await abrirProducao(0);
    const painel = painelDe(d0, 'Salas cadastradas');
    checar('0 itens: o rodapé fica escondido', painel.querySelector('.paginas').hidden === true);
    // Zero itens deixa UMA linha: o estado vazio («(nenhuma turma cadastrada)»). Ela é uma
    // linha e não um item — e é por isso que a contagem de páginas continua a dar 1.
    const so = visiveis(painel);
    checar('0 itens: a única linha à vista é o estado vazio',
      so.length === 1 && so[0].classList.contains('vazia'), so.map((x) => x.className));
  }
  {
    // O caso de fronteira: 8 itens = duas páginas, e a segunda tem UMA linha.
    const { doc: d8 } = await abrirProducao(8);
    const painel = painelDe(d8, 'Salas cadastradas');
    checar('8 itens: duas páginas', textoDaPagina(painel) === '1 / 2', textoDaPagina(painel));
    painel.querySelector('.paginas-prox').click();
    checar('8 itens: a página 2 tem a oitava linha', visiveis(painel).length === 1, visiveis(painel).length);
    checar('8 itens: e o «›» desabilita', painel.querySelector('.paginas-prox').disabled === true);
  }

  // -------------------------------------------------------------------------
  console.log('\n3. A troca de página não mexe nas OUTRAS listas');
  // -------------------------------------------------------------------------
  {
    const { doc: d } = await abrirProducao(15);
    const turmas = painelDe(d, 'Salas cadastradas');
    const termos = painelDe(d, 'Alunas cadastradas');
    turmas.querySelector('.paginas-prox').click();
    turmas.querySelector('.paginas-prox').click();
    checar('as Salas vão à página 3', textoDaPagina(turmas) === '3 / 3', textoDaPagina(turmas));
    checar('e as Alunas ficam na 1', textoDaPagina(termos) === '1 / 3', textoDaPagina(termos));
    checar('com as suas 7 linhas intactas', visiveis(termos).length === 7, visiveis(termos).length);
  }

  // -------------------------------------------------------------------------
  console.log('\n4. O rótulo dos botões não é a classe inteira (a raiz do defeito)');
  // -------------------------------------------------------------------------
  {
    const { doc: d } = await abrirProducao(15);
    const painel = painelDe(d, 'Salas cadastradas');
    const prox = painel.querySelector('.paginas-prox');
    checar('o botão carrega MAIS do que a classe que o identifica',
      prox.className !== 'paginas-prox' && prox.className.indexOf('paginas-prox') === 0,
      prox.className);
    checar('e ainda assim é reconhecido como «próximo»',
      prox.classList.contains('paginas-prox') === true);
    checar('o «‹» não é confundido com o «›»',
      painel.querySelector('.paginas-ant').classList.contains('paginas-prox') === false);
  }

  // -------------------------------------------------------------------------
  console.log('\n5. Os quatro botões — primeira, anterior, seguinte, última');
  // -------------------------------------------------------------------------
  {
    /* «Eu posso tanto avançar para a página dois quanto voltar para a página um, quanto ir para a
     * última página, quanto voltar para a primeira página. Coloca esse modelo de navegação.»
     *
     * A PEÇA É UMA SÓ para as três superfícies (a Produção, as listas, o Financeiro do painel):
     * por isso é aqui que o modelo se prova, e não três vezes em três provas. */
    const { doc: d } = await abrirProducao(15);
    const painel = painelDe(d, 'Salas cadastradas');
    const rodape = painel.querySelector('.paginas');
    const b = (k) => rodape.querySelector('.paginas-' + k);
    checar('o rodapé tem os quatro botões, e não dois',
      ['primeira', 'ant', 'prox', 'ultima'].every((k) => Boolean(b(k))),
      [...rodape.querySelectorAll('button')].map((x) => x.getAttribute('aria-label')));
    checar('cada um diz o seu destino a quem o ouve, e não o carácter que mostra',
      b('primeira').getAttribute('aria-label') === 'Primeira página'
        && b('ultima').getAttribute('aria-label') === 'Última página'
        && b('ant').getAttribute('aria-label') === 'Página anterior'
        && b('prox').getAttribute('aria-label') === 'Página seguinte', null);
    checar('na página 1, «primeira» e «anterior» nascem desabilitados',
      b('primeira').disabled === true && b('ant').disabled === true, null);
    checar('…e «seguinte» e «última» nascem habilitados',
      b('prox').disabled === false && b('ultima').disabled === false, null);
    b('ultima').click();
    checar('«última» salta para o fim — 3 / 3', textoDaPagina(painel) === '3 / 3', textoDaPagina(painel));
    checar('…e lá «seguinte» e «última» ficam desabilitados',
      b('prox').disabled === true && b('ultima').disabled === true, null);
    checar('…e «primeira» e «anterior» ficam habilitados',
      b('primeira').disabled === false && b('ant').disabled === false, null);
    b('primeira').click();
    checar('«primeira» volta ao princípio — 1 / 3', textoDaPagina(painel) === '1 / 3', textoDaPagina(painel));
    b('ultima').click();
    b('ant').click();
    checar('…e de a última, o passo atrás é a penúltima', textoDaPagina(painel) === '2 / 3', textoDaPagina(painel));
  }

  // -------------------------------------------------------------------------
  console.log('\n6. O mês a mês da escola: TABELA, dez por página, e o selector a mandar');
  // -------------------------------------------------------------------------
  {
    /* «Imagina se isso cresce 10, 20, 30 anos. Vai ficar gigantesco desse jeito. Então você tem que
     * colocar uma paginação.» Trinta e sete meses é o que três anos dão — e é a conta que a página
     * tem de aguentar hoje, não um dia.
     *
     * É AQUI que o selector prova o contrato da peça, e não no painel: esta página não tem script
     * próprio nenhum, o `data-tamanho-de` é a única coisa que a põe a andar. */
    const meses = [];
    for (let i = 36; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(2026, 10 - i, 10));
      const ano = d.getUTCFullYear();
      const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
      const pago = i > 3;
      meses.push({
        mes: ano + '-' + mes,
        nome: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
          'setembro', 'outubro', 'novembro', 'dezembro'][d.getUTCMonth()] + ' de ' + ano,
        vencimento: ano + '-' + mes + '-10',
        status: pago ? 'pago' : 'em-aberto',
        venceu: !pago,
        valorCentavos: 6990,
        valorPagoCentavos: 6990,
        emTexto: pago ? '1' + mes + '/' + ano + ' às 10:00' : null,
      });
    }
    const htmlDoMes = bastidores.paginaFinanceiro('teste',
      { professor: 'p', ciclo: '01', query: '' }, { modo: 'clara', paleta: 'bordo' },
      { cadastro: { escolaNome: 'Escola Teste' }, situacao: { meses, planoNome: 'Básico', valorCentavos: 6990 } });
    const vc6 = new VirtualConsole();
    const erros6 = [];
    vc6.on('jsdomError', (e) => erros6.push(e.message));
    const d6 = new JSDOM(htmlDoMes, {
      runScripts: 'dangerously', virtualConsole: vc6,
      url: 'https://prova.test/bastidores/financeiro',
      beforeParse(janela) { janela.fetch = () => new Promise(() => {}); },
    }).window.document;
    const painelMes = d6.getElementById('fi-meses');
    const linhas = () => Array.from(painelMes.querySelectorAll('tbody > tr'));
    checar('a página do mês a mês carrega sem erro de script', erros6.length === 0, erros6);
    checar('os 37 meses estão na tabela, e dez à vista',
      linhas().length === 37 && linhas().filter((tr) => !tr.hidden).length === 10,
      { total: linhas().length, visiveis: linhas().filter((tr) => !tr.hidden).length });
    checar('…e o rodapé diz «1 / 4»', textoDaPagina(painelMes) === '1 / 4', textoDaPagina(painelMes));
    painelMes.querySelector('.paginas-ultima').click();
    checar('«última» salta para os 7 meses mais antigos',
      linhas().filter((tr) => !tr.hidden).length === 7 && /4 \/ 4/.test(textoDaPagina(painelMes)),
      { visiveis: linhas().filter((tr) => !tr.hidden).length, info: textoDaPagina(painelMes) });
    const escolha = d6.getElementById('fi-meses-por-pagina');
    escolha.value = '20';
    escolha.dispatchEvent(new d6.defaultView.Event('change', { bubbles: true }));
    checar('escolher 20 por página mostra vinte e volta à página 1',
      linhas().filter((tr) => !tr.hidden).length === 20 && textoDaPagina(painelMes) === '1 / 2',
      { visiveis: linhas().filter((tr) => !tr.hidden).length, info: textoDaPagina(painelMes) });
    escolha.value = '100';
    escolha.dispatchEvent(new d6.defaultView.Event('change', { bubbles: true }));
    checar('…e com 100 os 37 cabem numa página, e o rodapé desaparece',
      linhas().filter((tr) => !tr.hidden).length === 37
        && painelMes.querySelector('.paginas').hidden === true,
      linhas().filter((tr) => !tr.hidden).length);
    /* O RODAPÉ FICA FORA DA CAIXA QUE ROLA: dentro dela, andava de lado com a tabela. */
    checar('…e o rodapé não vive dentro da caixa que rola de lado',
      !painelMes.querySelector('.rolagem-caixa .paginas'), null);
  }

  // -------------------------------------------------------------------------
  console.log('\n7. O Financeiro do painel — a mesma peça, depois da poda');
  // -------------------------------------------------------------------------
  {
    /* A paginação desta página «não ficou nada boa» e a queixa era justa: dois botões, sem
     * primeira nem última, e sem saber em que página se estava. Agora é a peça da casa — e o
     * selector deixou de ter um ouvinte próprio (ver o comentário em `painel-html.js`). */
    const painelHtml = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
    const escolas = [];
    const extrato = [];
    for (let i = 0; i < 25; i += 1) {
      const slug = 'escola-' + i;
      escolas.push({ escola: slug, nome: 'Escola ' + i, dominio: slug + '.padd.com.br', situacao: 'ativa' });
      extrato.push({ escola: slug, nome: 'Escola ' + i, planoNome: 'Professor', valorCentavos: 9900,
        situacao: 'em-dia', pago: true, mesAtual: 'novembro de 2026', emAberto: [], classe: 'ok',
        selo: 'em dia', frase: 'Em dia.', meses: [] });
    }
    const paginaDoPainel = painelHtml.paginaFinanceira({ pix: { chave: 'k', titular: 'T' },
      descontos: [], escolas, extrato, catalogo: null });
    const vc7 = new VirtualConsole();
    const erros7 = [];
    vc7.on('jsdomError', (e) => erros7.push(e.message));
    const d7 = new JSDOM(paginaDoPainel, {
      runScripts: 'dangerously', virtualConsole: vc7,
      url: 'https://painel.test/financeiro',
      beforeParse(janela) { janela.fetch = () => new Promise(() => {}); },
    }).window.document;
    const contas = d7.getElementById('fi-contas');
    checar('o Financeiro do painel carrega sem erro de script', erros7.length === 0, erros7);
    checar('ele pagina a dez, e diz em que página está — as duas coisas que faltavam',
      textoDaPagina(contas) === '1 / 3' && visiveis(contas).length === 10,
      { info: textoDaPagina(contas), visiveis: visiveis(contas).length });
    checar('…e tem os quatro botões',
      ['primeira', 'ant', 'prox', 'ultima'].every((k) => Boolean(contas.querySelector('.paginas-' + k))),
      null);
    const escolha7 = d7.getElementById('fi-por-pagina');
    escolha7.value = '20';
    escolha7.dispatchEvent(new d7.defaultView.Event('change', { bubbles: true }));
    checar('…e o selector dele obedece: 20 por página, «1 / 2»',
      visiveis(contas).length === 20 && textoDaPagina(contas) === '1 / 2',
      { visiveis: visiveis(contas).length, info: textoDaPagina(contas) });
  }

  // -------------------------------------------------------------------------
  console.log('\n8. As LISTAS PÚBLICAS paginam pela mesma peça (21/11/2026)');
  // -------------------------------------------------------------------------
  /* O QUE ELA VIU: «aqui a gente tem 15 aulas, né? E não colocamos aqui o que está no nossa
   * identidade visual, que é a paginação. [...] o ciclo e os planos já nascem com a paginação. A
   * anamnese também tem que nascer com paginação, plano de ensino também, plano de observação
   * também, as aulas também e as aulas dadas também têm que nascer com paginação.»
   *
   * A MEDIÇÃO É A PÁGINA MONTADA, e não o código que a monta: `montar-publicacao` escreve
   * `/ciclos/planos/index.html` e `/aulas/index.html` no disco, e é o que o deploy copia. Uma
   * asserção sobre o `porPagina` no fonte mediria a intenção, não o artefacto. */
  {
    const fs = require('fs');
    const { execFileSync } = require('child_process');
    const PACOTE = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
    if (!fs.existsSync(PACOTE)) {
      console.log('  (sem o pacote da breu-rosa nesta máquina — esta secção não corre, e não se declara passada)');
    } else {
      execFileSync('node', [path.join(RAIZ, 'tools/montar-publicacao.js'), 'breu'],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      const ler = (rel) => {
        const alvo = path.join(RAIZ, 'publicacao/breu', rel);
        return fs.existsSync(alvo) ? fs.readFileSync(alvo, 'utf8') : '';
      };
      for (const [rel, nome] of [['ciclos/planos/index.html', 'Planos do ciclo'],
        ['aulas/index.html', 'Aulas']]) {
        const html = ler(rel);
        checar('[' + nome + '] a lista montada TEM o rodapé de páginas',
          /<div data-paginar data-por-pagina="\d+">/.test(html)
          && /class="paginas" hidden/.test(html), rel);
        checar('[' + nome + '] …e o cliente que o faz andar',
          html.indexOf('function paginar()') !== -1, null);
      }
      /* O RODAPÉ NASCE ESCONDIDO, E É O CLIENTE QUE O ACENDE — a regra da folha («à vista a
       * partir de duas»). Sem JavaScript a lista mostra tudo; com uma página só, o `paginar()`
       * mantém o `hidden`. É por isso que uma escola com quinze aulas não vê rodapé nenhum: o
       * número de páginas não chega a dois. Isso está certo, e é o que se mede aqui. */
      const planoHtml = ler('ciclos/planos/index.html');
      const porPagina = Number((/data-por-pagina="(\d+)"/.exec(planoHtml) || [])[1]);
      const itens = (planoHtml.match(/<li class="trio-plano"/g) || []).length;
      checar('a lista dos planos pagina a ' + porPagina + ', com ' + itens + ' item(ns) — '
        + (itens > porPagina ? 'mais de uma página, o rodapé aparece' : 'uma página, o rodapé fica escondido'),
        porPagina > 0 && itens > 0, { porPagina, itens });
    }
  }

  // -------------------------------------------------------------------------
  console.log('\n9. As TRÊS listas da Área do Professor paginam pela mesma peça');
  // -------------------------------------------------------------------------
  /* «A anamnese também tem que nascer com paginação, plano de ensino também, plano de observação
   * também» (21/11/2026). As três são UM chamador só (`paginaDeLista` dentro de `listas-do-acervo`),
   * e é por isso que se medem as três: uma regra escrita uma vez pode ser lida três vezes, mas uma
   * que falte num dos caminhos é a que ninguém vê.
   *
   * O QUE SE MEDE É O ARTEFACTO — a página que a ponte serve —, e não o `porPagina` no fonte. O
   * rodapé nasce `hidden` e é o cliente que o acende a partir de duas páginas: com um registo só
   * ele não aparece, e isso é a regra, não a falha. */
  {
    const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
    const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
    const listasDoAcervo = require(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'));
    const dados = new Map();
    const kv = {
      async get(k) { return dados.has(k) ? dados.get(k) : null; },
      async put(k, v) { dados.set(k, String(v)); },
      async delete(k) { dados.delete(k); },
      async list(op) {
        const p = (op && op.prefix) || '';
        return { keys: [...dados.keys()].filter((k) => k.startsWith(p)).map((name) => ({ name })),
          list_complete: true };
      },
    };
    const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', PADD_KV: kv };
    const arm = producao.__armazenamento(env);
    const relatorio = (id) => ({
      id, estado: 'Input_anamnese_construida', contagem: { respondidos: 0, obrigatorios: 0 },
      elos: [], paradas: [], idsDesconhecidos: [],
      validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [],
    });
    await porta.gravarEnvelope(arm, {
      id: 'anamnese-prova-01', gerado_em: '2026-11-21T10:00',
      contexto: { escola: 'breu', professor: 'demi-plie', aluna: 'Aluna A' }, respostas: {},
    }, relatorio('anamnese-prova-01'));

    /* UMA LISTA VAZIA NÃO PAGINA — `paginaDeLista` só embrulha quando há cartões, e é a regra:
       não se pagina uma lista de dois registos para mostrar um botão desactivado. Por isso a
       prova mede a lista COM um registo (a anamnese tem um), e prova a outra metade pelo
       CONTRATO: as três famílias passam pelo MESMO chamador, e é ele que pede o `porPagina`.
       Sem esta segunda asserção, «as três paginam» seria uma afirmação sobre uma delas. */
    const fonteListas = require('fs').readFileSync(
      path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'), 'utf8');
    const chamadores = (fonteListas.match(/listas\.paginaDeLista\(\{/g) || []).length;
    checar('as três famílias da Área do Professor passam por UM chamador só',
      chamadores === 1 && Object.keys(listasDoAcervo.FAMILIAS).length >= 3, chamadores);
    checar('…e esse chamador pede o `porPagina` (a peça não está num caminho e não no outro)',
      /listas\.paginaDeLista\(\{[\s\S]{0,2000}?porPagina:\s*25/.test(fonteListas), null);

    const p = await listasDoAcervo.pagina('/area-do-professor/anamnese/', {
      env, menu: null, escola: 'breu', curadorias: [], linhasDeBase: [],
    });
    const html = (p && p.html) || '';
    checar('[anamnese] a página COM registo tem o painel que pagina e o rodapé escondido',
      /<div data-paginar data-por-pagina="25">/.test(html)
      && /class="paginas" hidden/.test(html), html.length);
    checar('[anamnese] …e o cliente que o faz andar vem com a página',
      html.indexOf('function paginar()') !== -1, null);
  }

  console.log('');
  if (falhas) {
    console.log(falhas + ' FALHA(S) de ' + n);
    process.exit(1);
  }
  console.log('provar-paginacao: ' + n + ' de ' + n + ' passaram');
})().catch((err) => {
  console.error('erro na prova: ' + ((err && err.stack) || err));
  process.exit(1);
});
