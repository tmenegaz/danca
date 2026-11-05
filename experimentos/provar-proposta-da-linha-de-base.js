#!/usr/bin/env node
'use strict';

/**
 * provar-proposta-da-linha-de-base.js — A PROPOSTA DA LISTAGEM, MEDIDA (05/11/2026).
 *
 * PORQUE EXISTE. A proposta não é um desenho: é o CARTÃO QUE A PRODUÇÃO EMITE, lido do DOM depois
 * de `pintarLinhas()` correr, e embrulhado em duas janelas de medida (390 e 1240) para se ver o
 * telemóvel e o computador. Se a produção mudar, a proposta muda com ela — e é isso que a torna
 * uma proposta e não uma promessa.
 *
 * O QUE SE MEDE, e não é «parece bem»:
 *
 *   1. a lista que sai tem a FORMA do cartão da casa — `.trio-plano`, `.trio-linha`, `.fatos`,
 *      `.trio-dono`, três `.trio-item` e três `.trio-painel`;
 *   2. a 1240px as três caixas ficam em TRÊS COLUNAS, com mais de 200px cada e 48px de altura
 *      (o alvo de toque medido); a linha do nome cabe numa linha só;
 *   3. a 390px não há transbordo horizontal, e abaixo de 360px as caixas passam a UMA coluna —
 *      é a regra da folha, e é o ponto em que o desenho cede à largura;
 *   4. as caixas ABREM: o clique é o handler da própria página, extraído por marcador. Sem isto,
 *      a proposta mostrava quatro caixas e nenhuma que abrisse.
 *
 * Requer Chrome/Chromium. Sem ele: NÃO FEITO — e diz-se, em vez de passar em silêncio.
 *
 *   node experimentos/provar-proposta-da-linha-de-base.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PASTA = path.join(__dirname, 'propostas');
const construir = path.join(PASTA, 'propor-linha-de-base.js');

let passou = 0;
const falhas = [];
function ok(titulo, fn) {
  try { fn(); passou += 1; console.log('  ok   ' + titulo); }
  catch (erro) { falhas.push({ titulo, erro }); console.log('  FALHA ' + titulo + '\n        ' + erro.message); }
}
function igual(real, esperado, mensagem) {
  if (JSON.stringify(real) !== JSON.stringify(esperado)) {
    throw new Error(mensagem + ' — esperado ' + JSON.stringify(esperado) + ', veio ' + JSON.stringify(real));
  }
}

(async () => {
  /** Uma bancada HTTP em porta efémera, em 127.0.0.1: nada disto toca no ar. */
  const servir = () => new Promise((resolve) => {
    const servidor = http.createServer((pedido, resposta) => {
      const alvo = path.join(PASTA, decodeURIComponent(String(pedido.url).split('?')[0]));
      fs.readFile(alvo, (erro, dados) => {
        if (erro) { resposta.writeHead(404); resposta.end('nao'); return; }
        resposta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        resposta.end(dados);
      });
    });
    servidor.listen(0, '127.0.0.1', () => resolve({
      servidor, base: 'http://127.0.0.1:' + servidor.address().port + '/',
    }));
  });

  console.log('\n1. A PROPOSTA É CONSTRUÍDA DA PRODUÇÃO');
  execSync('node ' + JSON.stringify(construir), { cwd: RAIZ, stdio: 'pipe' });
  const celular = fs.readFileSync(path.join(PASTA, 'proposta-linha-de-base-celular.html'), 'utf8');
  const desktop = fs.readFileSync(path.join(PASTA, 'proposta-linha-de-base-desktop.html'), 'utf8');
  const indice = fs.readFileSync(path.join(PASTA, 'proposta-linha-de-base.html'), 'utf8');

  ok('as três páginas existem, e as duas larguras levam a MESMA lista', () => {
    const extrair = (html) => {
      const i = html.indexOf('id="lb-lista"');
      const j = html.indexOf('</ul>', i);
      if (i === -1) throw new Error('a lista não está na página');
      return html.slice(i, j);
    };
    igual(extrair(celular), extrair(desktop), 'a lista de 390 e a de 1240 têm de ser a mesma');
    if (indice.indexOf('postura celular') === -1 || indice.indexOf('postura desktop') === -1) {
      throw new Error('a página de abertura tem de mostrar as duas larguras');
    }
  });

  ok('o cartão é o da casa, e não uma linha de texto', () => {
    for (const peca of ['trio-plano', 'trio-linha', 'trio-nome', 'trio-acoes', 'fatos', 'trio-dono', 'trio-painel']) {
      if (celular.indexOf(peca) === -1) throw new Error('falta a peça «' + peca + '» no cartão');
    }
    if (/linha-titulo|linha-sub/.test(celular)) {
      throw new Error('as classes que ninguém desenhou voltaram ao cartão');
    }
  });

  ok('as três caixas são Alunas, Recorte e Turma — na ordem do percurso', () => {
    const chaves = [...celular.matchAll(/data-balao="([a-z]+)"/g)].map((m) => m[1]);
    igual([...new Set(chaves)], ['alunas', 'recorte', 'turma'], 'a ordem das caixas');
  });

  const { servidor, base } = await servir();
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    servidor.close();
    console.error('\nprovar-proposta-da-linha-de-base: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    servidor.close();
    console.error('\nprovar-proposta-da-linha-de-base: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const br = await puppeteer.launch({ executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();

  const medir = async (largura) => {
    await pg.setViewport({ width: largura, height: 900, deviceScaleFactor: 1 });
    /* CADA LARGURA TEM A SUA PÁGINA, e o `src` não é indiferente: o palco do telemóvel tem
     * `max-width: 390px` para o `@media` responder como num telefone. Carregar a página do
     * telemóvel a 1240px media 390px de conteúdo e chamava-lhe «desktop» — foi o que a primeira
     * versão fez, e as duas asserções de largura reprovaram com razão. A LISTA é a mesma nas
     * duas; o palco é que não. */
    await pg.goto(base + (largura > 390
      ? 'proposta-linha-de-base-desktop.html' : 'proposta-linha-de-base-celular.html'),
      { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 120));
    return pg.evaluate(() => {
      const li = document.querySelector('#lb-lista li.trio-plano');
      const doc = document.documentElement;
      const caixas = [...li.querySelectorAll('.trio .trio-item')].map((c) => {
        const r = c.getBoundingClientRect();
        return { k: c.querySelector('.trio-k').textContent, w: Math.round(r.width), h: Math.round(r.height) };
      });
      const r = (s) => { const x = li.querySelector(s).getBoundingClientRect(); return { w: Math.round(x.width), h: Math.round(x.height) }; };
      return {
        transborda: doc.scrollWidth > doc.clientWidth + 1,
        colunas: getComputedStyle(li.querySelector('.trio')).gridTemplateColumns.split(' ').length,
        caixas,
        linhaDoNome: r('.trio-linha'),
        fatos: r('.fatos'),
        paineis: li.querySelectorAll('.trio-painel').length,
      };
    });
  };

  console.log('\n2. A 1240px — as três colunas, e a linha do nome numa linha só');
  const grande = await medir(1240);
  ok('não há transbordo horizontal', () => { if (grande.transborda) throw new Error('a página transborda a 1240px'); });
  ok('as caixas ficam em TRÊS colunas', () => igual(grande.colunas, 3, 'colunas a 1240px'));
  ok('cada caixa tem mais de 200px e 48px de altura', () => {
    for (const c of grande.caixas) {
      if (c.w < 200) throw new Error('«' + c.k + '» ficou com ' + c.w + 'px');
      if (c.h < 44) throw new Error('«' + c.k + '» ficou com ' + c.h + 'px de altura (alvo de toque)');
    }
  });
  ok('o nome e os botões cabem na MESMA linha', () => {
    if (grande.linhaDoNome.h > 40) {
      throw new Error('a linha do nome ficou com ' + grande.linhaDoNome.h + 'px — partiu em duas');
    }
  });
  ok('e há três painéis para abrir, um por caixa', () => igual(grande.paineis, 3, 'painéis'));

  console.log('\n3. A 390px — a largura de um telemóvel');
  const medio = await medir(390);
  ok('não há transbordo horizontal a 390px', () => {
    if (medio.transborda) throw new Error('a página transborda a 390px');
  });
  ok('as caixas continuam em três colunas (a folha só cede abaixo de 360)', () => {
    igual(medio.colunas, 3, 'colunas a 390px');
  });

  console.log('\n4. A 360px e a 320px — onde o desenho cede à largura');
  for (const largura of [360, 320]) {
    const m = await medir(largura);
    ok('a ' + largura + 'px as caixas passam a UMA coluna', () => igual(m.colunas, 1, 'colunas a ' + largura));
    ok('a ' + largura + 'px não há transbordo', () => {
      if (m.transborda) throw new Error('a página transborda a ' + largura + 'px');
    });
  }

  console.log('\n5. AS CAIXAS ABREM — o handler é o da produção');
  await pg.setViewport({ width: 1240, height: 900 });
  await pg.goto(base + 'proposta-linha-de-base-celular.html', { waitUntil: 'load' });
  await pg.click('#lb-lista li.trio-plano .trio-item[data-balao="recorte"]');
  await new Promise((r) => setTimeout(r, 120));
  const aberto = await pg.evaluate(() => {
    const li = document.querySelector('#lb-lista li.trio-plano');
    const alvo = li.querySelector('.trio-painel[data-painel="recorte"]');
    return {
      visivel: !alvo.hidden,
      chips: alvo.querySelectorAll('.trio-chips span').length,
      outrosFechados: [...li.querySelectorAll('.trio-painel')]
        .filter((x) => x !== alvo).every((x) => x.hidden),
      aria: li.querySelector('.trio-item[data-balao="recorte"]').getAttribute('aria-expanded'),
    };
  });
  ok('o painel do «Recorte» abre, com os nomes dos aspectos', () => {
    if (!aberto.visivel) throw new Error('o painel não abriu');
    if (aberto.chips !== 4) throw new Error('esperava 4 aspectos no painel, veio ' + aberto.chips);
  });
  ok('e abre UM de cada vez, com o estado no aria-expanded', () => {
    if (!aberto.outrosFechados) throw new Error('outro painel ficou aberto ao mesmo tempo');
    if (aberto.aria !== 'true') throw new Error('aria-expanded não foi para true');
  });

  await br.close();
  servidor.close();

  console.log('');
  if (falhas.length) {
    for (const f of falhas) console.log('✗ ' + f.titulo + '\n  ' + f.erro.message);
    console.log('\nFALHOU — ' + falhas.length + ' de ' + (passou + falhas.length) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + passou + ' asserções. A proposta é o cartão da produção, '
    + 'medido a 1240, 390, 360 e 320px, e as caixas abrem.');
})().catch((erro) => {
  console.error('provar-proposta-da-linha-de-base: ' + erro.message);
  process.exit(1);
});
