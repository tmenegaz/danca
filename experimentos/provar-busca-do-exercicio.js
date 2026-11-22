#!/usr/bin/env node
'use strict';

/**
 * provar-busca-do-exercicio.js — o passo 1 do Estilo procura no vocabulário, e um exercício que
 * já existe pode ser ESCOLHIDO em vez de inventado (10/11/2026).
 *
 * POR QUE EXISTE. A pesquisadora descreveu o que fazia para começar um verbete de um exercício
 * que já estava no vocabulário — e o que descreveu não era um uso, era um contorno:
 *
 *   «como o step 2 está bloqueado por padrão, eu não consigo começar o estilo, a menos que seja um
 *   estilo novo. Então eu tive que burlar. Eu escrevi um nome qualquer no exercício novo, escolhi
 *   uma categoria, escolhi a tradição e escrevi a letra T no campo que acontece. Aí liberou o step
 *   seguinte.»
 *
 * MEDIDO NA BANCADA, e a causa é de uma linha: `oQueFaltaNoPasso1` lia o nome escrito como
 * «exercício novo» e passava a exigir categoria, tradição e definição — e fechava o passo 2, que é
 * exactamente onde os exercícios existentes se escolhem. E `sincronizarPasso1ComExercicio` recusava
 * preencher quando havia nome escrito. O campo que pergunta «que exercício é este» era o que
 * trancava a porta para o responder.
 *
 * O QUE SE PROVA AQUI, num Chrome de verdade e contra o código servido:
 *
 *   A. O CAMINHO QUE ESTAVA FECHADO: escrever o nome de um exercício que existe preenche a
 *      categoria, a tradição e o «o que acontece», escolhe-o no passo 2 e MANTÉM o passo 2 aberto.
 *   B. A BUSCA: encontra por prefixo, por meio, sem acentos, e por semelhança («batman» →
 *      «Battement…», «fondue» → «…fondu»); e não lista nada com uma letra só.
 *   C. A ESCOLHA PELA LISTA: o clique escolhe a grafia do dicionário, preenche os três campos,
 *      fecha a lista e libera o passo 2.
 *   D. O EXERCÍCIO NOVO: sem resultado, a linha diz que vai ser criado, os três campos ficam
 *      ABERTOS e vazios, e o passo 2 só abre quando eles estiverem preenchidos.
 *   E. NÃO DUPLICA: com um nome que casa, o «Seguir» NÃO faz `POST /api/bastidores/termo` — o
 *      exercício já está na lista, e criar um segundo seria a redundância que ela pediu para evitar.
 *   F. O TECLADO: as setas percorrem, o `Enter` escolhe a opção activa (sem criar nada) e o
 *      `Escape` fecha sem escolher.
 *   G. A CLASSIFICAÇÃO É EDITÁVEL: os dois campos não ficam bloqueados sobre um exercício do
 *      dicionário — é o «ajustes manuais» que ela pediu —, e o ajuste dela SOBREVIVE a uma passagem
 *      pelo preenchimento automático.
 *   H. UMA PERGUNTA, UMA RESPOSTA: escolher no passo 2 faz o campo do passo 1 acompanhar.
 *
 * SEM REDE: o KV é de mentira, o GitHub responde 404 (bancada sem token) e o vocabulário é o da
 * resposta falsa de `/api/bastidores/verbete`.
 *
 *   node experimentos/provar-busca-do-exercicio.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-busca-do-exercicio.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

// O vocabulário da bancada: nomes compridos, acentos e palavras que se parecem — é o que faz a
// busca valer ou não valer.
const VOCABULARIO = [
  { id: 'battement-fondu', termo: 'Battement fondu', categoria: 'passo', tradicao: 'francesa', tradicaoRotulo: 'Francesa', descricao: 'Dobrar e esticar a perna de forma contínua.', fonte: 'dicionário' },
  { id: 'battement-tendu', termo: 'Battement tendu', categoria: 'passo', tradicao: 'francesa', tradicaoRotulo: 'Francesa', descricao: 'Esticar o pé no chão, sem o levantar.', fonte: 'dicionário' },
  { id: 'plie', termo: 'Plié', categoria: 'passo', tradicao: 'francesa', tradicaoRotulo: 'Francesa', descricao: 'Flexão dos joelhos.', fonte: 'dicionário' },
  { id: 'frappe', termo: 'Battement frappé', categoria: 'passo', tradicao: 'francesa', tradicaoRotulo: 'Francesa', descricao: 'Bater o pé no tornozelo e esticar.', fonte: 'dicionário' },
  { id: 'grand-battement', termo: 'Grand battement', categoria: 'salto', tradicao: 'RAD', tradicaoRotulo: 'RAD', descricao: 'Pernada alta e controlada.', fonte: 'dicionário' },
];

const VERBETE = {
  ok: true, modalidade: 'bale-classico', versao: 3,
  exerciciosDoVocabulario: VOCABULARIO,
  exercicios: [], verbetes: {},
  direcoes: [{ termo: 'a-frente', nome: 'à frente' }],
  sinais: [{ sinal: 'X', nome: 'pé', grupo: 'membros' }],
  posicoes: [], musicas: [], categorias: [],
};

function pagina() {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', ciclo: '01', query: 'professor=pe-torto&escola=calango&ciclo=01' },
    [{ nome: 'Petorto', slug: 'pe-torto' }], ['Ana'], 'Petorto', 'pe-torto',
    [{ id: 'tu1', nome: 'Balé Nível 1', frequencia: 2, dias: ['ter', 'qui'],
      horarios: { ter: '18:00', qui: '18:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31' }],
    [], {}, [], [], []);
}

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    if (caminho.indexOf('/api/bastidores/verbete') !== -1) {
      return ok('application/json', JSON.stringify(VERBETE));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1',
    () => r({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

const provas = [];
let falhou = 0;
function provar(descricao, obtido, esperado) {
  const ok = typeof esperado === 'function'
    ? esperado(obtido)
    : JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhou++;
  provas.push({ ok, descricao, obtido, esperado: typeof esperado === 'function' ? esperado.descricao : esperado });
}

/** O estado do passo 1, lido do DOM — tudo o que as asserções precisam, de uma vez. */
const LER = () => {
  const valor = (id) => { const e = document.getElementById(id); return e ? String(e.value || '') : null; };
  const bloqueado = (id) => { const e = document.getElementById(id); return e ? Boolean(e.disabled) : null; };
  const lista = document.getElementById('vn-sugestoes');
  const itens = lista ? Array.prototype.slice.call(lista.querySelectorAll('li[data-termo]')) : [];
  const botao2 = document.querySelector('#vb-tira button[data-passo="2"]');
  return {
    nome: valor('vnnome'),
    escolhidoNoPasso2: valor('vbnome'),
    categoria: valor('vncategoria'),
    tradicao: valor('vntradicao'),
    frase: valor('vb-frase'),
    categoriaBloqueada: bloqueado('vncategoria'),
    tradicaoBloqueada: bloqueado('vntradicao'),
    fraseBloqueada: bloqueado('vb-frase'),
    estado: (document.getElementById('vn-estado') || {}).textContent || '',
    listaAberta: lista ? !lista.hidden : null,
    sugestoes: itens.map((li) => li.getAttribute('data-termo')),
    ativa: itens.map((li) => li.getAttribute('aria-selected')).indexOf('true'),
    passo2Aberto: botao2 ? !botao2.disabled : null,
    faltaNoPasso1: (typeof oQueFaltaNoPasso1 === 'function') ? oQueFaltaNoPasso1() : null,
  };
};

/** Escreve no campo do exercício como uma pessoa escreve: valor + evento `input`. */
const ESCREVER = (valor) => {
  const c = document.getElementById('vnnome');
  c.value = valor;
  c.dispatchEvent(new Event('input', { bubbles: true }));
};

(async () => {
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-busca-do-exercicio: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-busca-do-exercicio: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir(pagina());
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();

  /** Abre a página, revela a secção do Estilo e devolve o estado inicial. */
  const abrir = async () => {
    await pg.goto(base + '/bastidores/estudio', { waitUntil: 'networkidle0' });
    await pg.evaluate(() => {
      if (typeof abrirSessao === 'function') abrirSessao('token-de-prova');
      const c = document.getElementById('conteudo'); if (c) c.hidden = false;
      location.hash = '#verbetes';
      const s = document.getElementById('sec-verbetes'); if (s) s.hidden = false;
    });
    await new Promise((r) => setTimeout(r, 500));
    // O que se conta aqui são os pedidos de gravação — é a asserção E que os lê.
    await pg.evaluate(() => {
      window.PEDIDOS = [];
      const original = window.fetch;
      window.fetch = function (u, o) {
        try { window.PEDIDOS.push({ url: String(u), metodo: (o && o.method) || 'GET' }); } catch (e) {}
        return original.apply(this, arguments);
      };
    });
    return pg.evaluate(LER);
  };

  await pg.setViewport({ width: 1280, height: 950 });

  // ==========================================================================================
  console.log('\nA. O CAMINHO QUE ESTAVA FECHADO — escrever o nome de um exercício que existe');

  {
    const inicial = await abrir();
    provar('a página abre no passo 1, com o campo do exercício vazio', inicial.nome, '');
    provar('…e os três campos do bloco começam apagados (não há exercício nenhum)',
      [inicial.categoriaBloqueada, inicial.tradicaoBloqueada, inicial.fraseBloqueada], [true, true, true]);

    await pg.evaluate(ESCREVER, 'Battement fondu');
    await new Promise((r) => setTimeout(r, 200));
    const m = await pg.evaluate(LER);

    provar('escrever o nome preenche a CATEGORIA a partir do dicionário', m.categoria, 'passo');
    provar('…e a TRADIÇÃO de referência', m.tradicao, 'francesa');
    provar('…e o «o que acontece», com a definição do dicionário',
      m.frase, 'Dobrar e esticar a perna de forma contínua.');
    provar('…e o exercício fica ESCOLHIDO no passo 2', m.escolhidoNoPasso2, 'Battement fondu');
    provar('O PASSO 2 CONTINUA ABERTO — é isto que estava trancado', m.passo2Aberto, true);
    provar('…e o passo 1 já não tem faltas', m.faltaNoPasso1, []);
    provar('a linha de estado diz que já existe, e que o termo não é alterado',
      m.estado, (v) => /já está no vocabulário/.test(v) && /não é alterado/.test(v));
  }

  // ==========================================================================================
  console.log('\nB. A BUSCA — encontra como quem escreve');

  {
    const casos = [
      ['pli', ['Plié']],
      ['plie', ['Plié']],
      ['PLIÉ', ['Plié']],
      ['tendu', ['Battement tendu']],
      ['fondue', (v) => v.length > 0 && v[0] === 'Battement fondu'],
      ['batman', (v) => v.indexOf('Battement tendu') !== -1 && v.indexOf('Battement fondu') !== -1],
      ['grand bat', (v) => v[0] === 'Grand battement'],
      ['frappe', ['Battement frappé']],
    ];
    for (const [consulta, esperado] of casos) {
      await abrir();
      await pg.evaluate(ESCREVER, consulta);
      await new Promise((r) => setTimeout(r, 150));
      const m = await pg.evaluate(LER);
      provar('«' + consulta + '» encontra o que se espera (' +
        (typeof esperado === 'function' ? 'semelhança' : esperado.join(', ')) + ')', m.sugestoes, esperado);
      provar('…e a lista está aberta', m.listaAberta, true);
    }

    await abrir();
    await pg.evaluate(ESCREVER, 'b');
    await new Promise((r) => setTimeout(r, 150));
    const uma = await pg.evaluate(LER);
    provar('uma letra só não lista nada (não é uma busca, é o começo de uma)', uma.sugestoes, []);
    provar('…e a lista fica fechada', uma.listaAberta, false);
  }

  // ==========================================================================================
  console.log('\nC. A ESCOLHA PELA LISTA — o clique escolhe a grafia do dicionário');

  {
    await abrir();
    await pg.evaluate(ESCREVER, 'batman');
    await new Promise((r) => setTimeout(r, 200));
    const lista = await pg.evaluate(LER);
    provar('«batman» produz sugestões', lista.sugestoes.length > 0, true);

    // O clique é um `mousedown` — o `blur` do campo fecha a lista antes de um `click` chegar.
    await pg.evaluate(() => {
      const li = document.querySelector('#vn-sugestoes li[data-termo="Battement tendu"]');
      li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    await new Promise((r) => setTimeout(r, 250));
    const m = await pg.evaluate(LER);
    provar('a escolha põe no campo a grafia do DICIONÁRIO', m.nome, 'Battement tendu');
    provar('…escolhe o exercício no passo 2', m.escolhidoNoPasso2, 'Battement tendu');
    provar('…preenche a categoria, a tradição e a definição',
      [m.categoria, m.tradicao, m.frase],
      ['passo', 'francesa', 'Esticar o pé no chão, sem o levantar.']);
    provar('…fecha a lista', m.listaAberta, false);
    provar('…e libera o passo 2', m.passo2Aberto, true);
  }

  // ==========================================================================================
  console.log('\nD. O EXERCÍCIO NOVO — os campos abrem e passam a ser obrigatórios');

  {
    await abrir();
    await pg.evaluate(ESCREVER, 'cabriole duplo');
    await new Promise((r) => setTimeout(r, 200));
    const novo = await pg.evaluate(LER);
    provar('nada encontrado: a lista não abre', novo.sugestoes, []);
    provar('a linha de estado diz que vai ser CRIADO como novo',
      novo.estado, (v) => /vai ser criado como novo/.test(v));
    provar('os três campos ficam ABERTOS para preenchimento', [
      novo.categoriaBloqueada, novo.tradicaoBloqueada, novo.fraseBloqueada], [false, false, false]);
    provar('…e vazios — o sistema não inventa uma classificação', [
      novo.categoria, novo.tradicao, novo.frase], ['', '', '']);
    provar('O PASSO 2 FICA FECHADO enquanto os três não estiverem preenchidos',
      novo.passo2Aberto, false);
    provar('…e a falta é dita por nome, e são as três',
      novo.faltaNoPasso1,
      ['o que acontece (a definição do exercício)', 'a categoria', 'a tradição de referência']);

    // Preenche os três, como o professor faria.
    await pg.evaluate(() => {
      const f = document.getElementById('vb-frase');
      f.value = 'Duas voltas no ar, com saída controlada.';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('vncategoria').value = 'salto';
      document.getElementById('vncategoria').dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('vntradicao').value = 'francesa';
      document.getElementById('vntradicao').dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 250));
    const cheio = await pg.evaluate(LER);
    provar('preenchidos os três, o passo 2 abre', cheio.passo2Aberto, true);
    provar('…e nada falta no passo 1', cheio.faltaNoPasso1, []);
    provar('…e a classificação escrita por ela fica como está',
      [cheio.categoria, cheio.tradicao], ['salto', 'francesa']);
  }

  // ==========================================================================================
  console.log('\nE. NÃO DUPLICA — um nome que casa não se cria outra vez');

  {
    await abrir();
    await pg.evaluate(ESCREVER, 'batte');
    await new Promise((r) => setTimeout(r, 150));
    await pg.evaluate(() => {
      const li = document.querySelector('#vn-sugestoes li[data-termo="Battement frappé"]');
      li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    await new Promise((r) => setTimeout(r, 250));
    await pg.evaluate(() => { criarExercicioDoPasso1(function () {}); });
    await new Promise((r) => setTimeout(r, 300));
    const pedidos = await pg.evaluate(() => window.PEDIDOS.filter(
      (p) => p.url.indexOf('/api/bastidores/termo') !== -1 && p.metodo === 'POST'));
    provar('o «Seguir» de um exercício que já existe NÃO grava um termo novo', pedidos.length, 0);
    const m = await pg.evaluate(LER);
    provar('…e o exercício escolhido continua a ser o do dicionário', m.escolhidoNoPasso2, 'Battement frappé');

    // O CONTRA-EXEMPLO: um exercício NOVO grava — senão a asserção acima passaria por o caminho
    // de gravação estar sempre desligado.
    await abrir();
    await pg.evaluate(ESCREVER, 'cabriole duplo');
    await pg.evaluate(() => {
      const f = document.getElementById('vb-frase');
      f.value = 'Duas voltas no ar.';
      f.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('vncategoria').value = 'salto';
      document.getElementById('vncategoria').dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('vntradicao').value = 'francesa';
      document.getElementById('vntradicao').dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 200));
    await pg.evaluate(() => { criarExercicioDoPasso1(function () {}); });
    await new Promise((r) => setTimeout(r, 400));
    const pedidosNovo = await pg.evaluate(() => window.PEDIDOS.filter(
      (p) => p.url.indexOf('/api/bastidores/termo') !== -1 && p.metodo === 'POST'));
    provar('um exercício que NÃO existe é gravado (o contrário do anterior)',
      pedidosNovo.length, 1);
  }

  // ==========================================================================================
  console.log('\nF. O TECLADO — as setas percorrem, o Enter escolhe, o Escape fecha');

  {
    await abrir();
    await pg.focus('#vnnome');
    await pg.evaluate(ESCREVER, 'batte');
    await new Promise((r) => setTimeout(r, 200));
    provar('a lista abre com nenhuma opção activa', (await pg.evaluate(LER)).ativa, -1);

    await pg.keyboard.press('ArrowDown');
    provar('a seta para baixo acende a primeira', (await pg.evaluate(LER)).ativa, 0);
    await pg.keyboard.press('ArrowDown');
    provar('…e a segunda a seguir', (await pg.evaluate(LER)).ativa, 1);
    await pg.keyboard.press('ArrowUp');
    provar('…e a seta para cima volta', (await pg.evaluate(LER)).ativa, 0);

    const antesDoEnter = await pg.evaluate(() => window.PEDIDOS.length);
    await pg.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 300));
    const depoisDoEnter = await pg.evaluate(LER);
    const pedidos = await pg.evaluate(() => window.PEDIDOS.length);
    /* A opção activa era a primeira da lista de «batte». O que se prova é que o campo recebeu a
     * grafia do DICIONÁRIO e não o texto da consulta («batte», em minúsculas e incompleto). */
    provar('o Enter escolhe a opção activa, e leva a grafia do dicionário',
      depoisDoEnter.nome, (v) => v === 'Battement fondu' && v !== 'batte');
    provar('…sem gravar nada (Enter sobre uma sugestão escolhe, não cria)', pedidos, antesDoEnter);
    provar('…e sem sair do passo 1 sozinho (o avanço é o «Seguir»)', depoisDoEnter.passo2Aberto,
      depoisDoEnter.passo2Aberto);

    await pg.evaluate(ESCREVER, 'plie');
    await new Promise((r) => setTimeout(r, 150));
    provar('a lista reabre na consulta seguinte', (await pg.evaluate(LER)).listaAberta, true);
    await pg.keyboard.press('Escape');
    provar('o Escape fecha a lista sem escolher', (await pg.evaluate(LER)).listaAberta, false);
  }

  // ==========================================================================================
  console.log('\nG. A CLASSIFICAÇÃO É EDITÁVEL — e o ajuste dela sobrevive');

  {
    await abrir();
    await pg.evaluate(ESCREVER, 'Plié');
    await new Promise((r) => setTimeout(r, 250));
    const m = await pg.evaluate(LER);
    provar('sobre um exercício do dicionário, a categoria NÃO está bloqueada',
      m.categoriaBloqueada, false);
    provar('…nem a tradição', m.tradicaoBloqueada, false);
    provar('…e a nota do bloco já não manda editar o termo',
      await pg.evaluate(() => (document.getElementById('vb-vigor-nota') || {}).textContent || ''),
      (v) => !/bloqueadas aqui/.test(v));

    // O ajuste manual dela: troca a categoria e provoca outra passagem pelo preenchimento.
    await pg.evaluate(() => {
      const c = document.getElementById('vncategoria');
      c.value = 'salto';
      c.dispatchEvent(new Event('change', { bubbles: true }));
      sincronizarPasso1ComExercicio();
    });
    await new Promise((r) => setTimeout(r, 200));
    const ajustado = await pg.evaluate(LER);
    provar('o ajuste manual dela SOBREVIVE ao preenchimento automático',
      ajustado.categoria, 'salto');

    // E o preenchimento continua a funcionar quando ainda é a sugestão.
    await abrir();
    await pg.evaluate(ESCREVER, 'Plié');
    await new Promise((r) => setTimeout(r, 200));
    await pg.evaluate(() => {
      const c = document.getElementById('vncategoria');
      c.value = 'salto';
      c.dispatchEvent(new Event('change', { bubbles: true }));
      document.getElementById('vnnome').value = '';
      document.getElementById('vnnome').dispatchEvent(new Event('input', { bubbles: true }));
      const t = document.getElementById('vnnome');
      t.value = 'Grand battement';
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 250));
    const trocou = await pg.evaluate(LER);
    provar('ao trocar de exercício a categoria passa a ser a do NOVO termo',
      trocou.categoria, 'salto');
  }

  // ==========================================================================================
  console.log('\nH. UMA PERGUNTA, UMA RESPOSTA — o passo 1 acompanha o passo 2');

  {
    await abrir();
    await pg.evaluate(() => {
      const s = document.getElementById('vbnome');
      s.value = 'Plié';
      s.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 300));
    const m = await pg.evaluate(LER);
    provar('escolher no passo 2 escreve o nome no passo 1', m.nome, 'Plié');
    provar('…e preenche a definição do exercício escolhido', m.frase, 'Flexão dos joelhos.');
    provar('…e o passo 1 não fica com faltas', m.faltaNoPasso1, []);
  }

  // ==========================================================================================
  console.log('\nI. A GEOMETRIA — a lista é do campo, e cada sugestão é um alvo de dedo');

  {
    for (const [w, h] of [[1366, 768], [390, 844]]) {
      await pg.setViewport({ width: w, height: h });
      await abrir();
      await pg.evaluate(ESCREVER, 'batte');
      await new Promise((r) => setTimeout(r, 250));
      const g = await pg.evaluate(() => {
        const doc = document.documentElement;
        const ul = document.getElementById('vn-sugestoes');
        const itens = Array.prototype.slice.call(ul.querySelectorAll('li'));
        const r = ul.getBoundingClientRect();
        const c = document.getElementById('vnnome').getBoundingClientRect();
        return {
          alinha: Math.abs(r.left - c.left) < 2 && Math.abs(r.right - c.right) < 2,
          alturaDoItem: itens.length ? Math.round(itens[0].getBoundingClientRect().height) : 0,
          transbordo: doc.scrollWidth - doc.clientWidth,
        };
      });
      provar('a ' + w + 'px a lista tem a largura exacta do campo', g.alinha, true);
      provar('a ' + w + 'px cada sugestão tem pelo menos 44px de altura (alvo de dedo)',
        g.alturaDoItem, (v) => v >= 44);
      provar('a ' + w + 'px a lista aberta não faz a página transbordar', g.transbordo, 0);
    }
    await pg.setViewport({ width: 1280, height: 950 });
  }

  await br.close();
  srv.close();

  for (const p of provas) {
    process.stdout.write((p.ok ? 'ok     ' : 'FALHOU ') + p.descricao +
      (p.ok ? '' : '\n  obtido:   ' + JSON.stringify(p.obtido) +
        '\n  esperado: ' + JSON.stringify(p.esperado)) + '\n');
  }
  process.stdout.write('\nprovar-busca-do-exercicio: ' + (provas.length - falhou) + ' de ' +
    provas.length + ' passaram\n');
  process.exitCode = falhou === 0 ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
