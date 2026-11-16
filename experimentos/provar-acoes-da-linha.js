#!/usr/bin/env node
'use strict';

/*
 * provar-acoes-da-linha.js — os dois botões da coluna «Acesso» ficam EMPILHADOS, com ar entre
 * eles, e nenhum rótulo se trunca (16/11/2026).
 *
 * O QUE ELA VIU, ao pé da letra:
 *
 *   «A tabela das escolas vivas, na coluna acesso, aumenta um pouco a largura dela porque quando eu
 *   clico em habilitar fica truncado o habilitar e o desabilitar. […] Vamos deixar na coluna acesso
 *   os dois botões, o habilitar e o desabilitar, sempre um abaixo do outro na vertical, vamos
 *   colocar assim, empilhados. E aí arruma o espaço entre eles, tá? Porque as margens estão ficando
 *   acavaladas. Ajeita isso para ficar no padrão da identidade visual que a gente tem dos
 *   espaçamentos dos botões.»
 *
 * MEDIDO, E O DEFEITO ERA O VÃO. Os botões já caíam um abaixo do outro (`.acao` tem
 * `white-space: nowrap`: não encolhem), mas `.acao` declara `margin: 0` e não havia `gap` nenhum —
 * a distância entre o filete de baixo de um e o de cima do outro era **0px**, encostados. Era o
 * «acavalado». A largura da coluna era a do conteúdo exacto, sem folga para um tipo de letra
 * diferente do meu.
 *
 * O QUE ESTA PROVA MEDE, em navegador de verdade, a 1440/1280/1024/900/768/390/360:
 *
 *   A. O EMPILHAMENTO — os dois botões têm a mesma borda esquerda, o segundo abaixo do primeiro, e
 *      a mesma largura (empilhados de larguras diferentes lêem-se como dois desenhos);
 *   B. O VÃO — é `--esp-2` (8px), lido da folha e não escrito aqui; é o mesmo que a casa usa entre
 *      os dois botões da `.acoes-da-aluna`;
 *   C. A LARGURA — a coluna tem, no mínimo, os 8rem da peça, e nenhum rótulo se trunca
 *      (`scrollWidth <= clientWidth`) — inclusive com um tipo de letra mais largo que o meu;
 *   D. O CONTROLE NEGATIVO — com a marcação antiga (dois botões soltos na célula, sem a peça), o
 *      vão é 0px e a largura volta a ser a do conteúdo: o «acavalado» reproduzido.
 *
 * Requer Chrome/Chromium (usa o `puppeteer-core` que vem com o marp-cli global), como a
 * `provar-celular.js`. Sem ele o resultado é declarado NÃO FEITO — nunca um «passou» silencioso.
 *
 *   node experimentos/provar-acoes-da-linha.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/**
 * AS ESCOLAS DA PÁGINA — uma ativa (só «Desabilitar» clicável) e uma suspensa em carência (só
 * «Habilitar» clicável). É a linha real, com os quatro estados possíveis de cada botão.
 */
const ESCOLAS = [
  {
    slug: 'duo', nome: 'Duo', professor: 'tiago-menegaz', criada_em: '2026-11-16T11:00:00.000Z',
    comercial: {
      estado: 'ativa', planoNome: 'Intermediário', valor: '99,90',
      habilitadaEm: '2026-11-16T12:25:53.252Z', desabilitadaEm: null, carenciaAte: null,
      expurgavel: false, restanteMs: null,
    },
  },
  {
    slug: 'valse', nome: 'Valse', professor: 'ana', criada_em: '2026-01-05T10:00:00.000Z',
    comercial: {
      estado: 'suspensa', habilitadaEm: '2026-08-01T10:30:00.000Z',
      desabilitadaEm: '2026-11-15T22:51:00.000Z', carenciaAte: '2027-02-15T22:51:00.000Z',
      expurgavel: false, restanteMs: 90 * 24 * 60 * 60 * 1000,
    },
  },
];

/** O que se serve: a página do painel e a folha da casa, sem cópia que possa envelhecer. */
function servir(html) {
  const MAPA = {
    '/assets/style.css': 'tools/templates/ciclo.css',
    '/assets/nav.js': 'tools/templates/nav.js',
    '/assets/favicon.svg': 'tools/templates/marca/favicon.svg',
  };
  const TIPOS = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const u = req.url.split('?')[0];
    if (u === '/' || u === '/index.html') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(html);
    }
    const alvo = MAPA[u];
    if (!alvo) { res.writeHead(404); return res.end('nao encontrado'); }
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream',
      /* `no-store` não é detalhe: sem ele o Chrome guarda a folha por heurística e a segunda
       * navegação mede o CSS da primeira — foi o que fez um controle negativo passar na
       * `provar-celular`. */
      'cache-control': 'no-store',
    });
    res.end(fs.readFileSync(path.join(RAIZ, alvo)));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

/**
 * A MEDIDA DE UMA CÉLULA DE ACÇÕES. Tudo o que o relato dela põe em causa: se estão empilhados,
 * o vão entre eles, a largura de cada um, se algum rótulo está cortado, e a largura da coluna.
 */
const MEDIR = () => {
  const out = [];
  for (const td of document.querySelectorAll('tbody td')) {
    const bs = [...td.querySelectorAll('button')];
    if (bs.length < 2) continue;
    const r = td.getBoundingClientRect();
    const caixa = td.firstElementChild;
    const fonte = getComputedStyle(document.documentElement);
    out.push({
      /* O VÃO ESPERADO VEM DA FOLHA, e não de um número escrito na prova. */
      esp2: parseFloat(fonte.getPropertyValue('--esp-2')),
      raiz: parseFloat(fonte.fontSize),
      celula: { w: Math.round(r.width), right: Math.round(r.right), h: Math.round(r.height) },
      conteiner: caixa ? caixa.className : null,
      flexao: caixa ? getComputedStyle(caixa).flexDirection : null,
      botoes: bs.map((b) => {
        const q = b.getBoundingClientRect();
        const c = getComputedStyle(b);
        return {
          texto: b.textContent.trim(),
          x: Math.round(q.left), y: Math.round(q.top),
          w: Math.round(q.width), h: Math.round(q.height),
          nowrap: c.whiteSpace === 'nowrap',
          corte: b.scrollWidth > b.clientWidth + 1,
          desborda: Math.round(q.right) > Math.round(r.right),
          margem: c.marginTop + ' ' + c.marginBottom,
          desabilitado: b.disabled,
        };
      }),
    });
  }
  return out;
};

(async () => {
  const executablePath = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executablePath) {
    console.error('provar-acoes-da-linha: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (erro) {
    console.error('provar-acoes-da-linha: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const pagina = painel.paginaDasVivas({ escolas: ESCOLAS, professores: [] });
  const { srv, base } = await servir(pagina);
  const browser = await puppeteer.launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const LARGURAS = [1440, 1280, 1024, 900, 768, 390, 360];
  const colhidas = new Map();

  for (const largura of LARGURAS) {
    await page.setViewport({ width: largura, height: 900 });
    await page.goto(base + '/', { waitUntil: 'load' });
    colhidas.set(largura, await page.evaluate(MEDIR));
  }

  console.log('A. A peça: os dois botões empilhados, iguais, sem corte');
  {
    for (const [largura, celulas] of colhidas) {
      const c = celulas[0];
      if (!c) { conferir('a ' + largura + 'px há uma célula de acções', false, null); continue; }
      const [a, b] = c.botoes;
      conferir('a ' + largura + 'px: a célula leva a peça `.acoes-da-linha`, em coluna',
        c.conteiner === 'acoes-da-linha' && c.flexao === 'column', { peca: c.conteiner, flexao: c.flexao });
      conferir('a ' + largura + 'px: os dois botões partilham a borda esquerda',
        Math.abs(a.x - b.x) <= 1, [a.x, b.x]);
      conferir('a ' + largura + 'px: o «Desabilitar» fica ABAIXO do «Habilitar»',
        b.y >= a.y + a.h, { a: [a.y, a.h], b: b.y });
      conferir('a ' + largura + 'px: os dois têm a MESMA largura (é uma coluna de gestos)',
        Math.abs(a.w - b.w) <= 1, [a.w, b.w]);
      conferir('a ' + largura + 'px: nenhum rótulo é cortado nem sai da célula',
        !a.corte && !b.corte && !a.desborda && !b.desborda,
        c.botoes.map((x) => ({ t: x.texto, corte: x.corte, desborda: x.desborda })));
      conferir('a ' + largura + 'px: o rótulo não quebra linha (`white-space: nowrap`)',
        a.nowrap && b.nowrap, [a.nowrap, b.nowrap]);
      conferir('a ' + largura + 'px: a margem dos botões é zero — o ar é do `gap`, não da margem',
        a.margem === '0px 0px' && b.margem === '0px 0px', [a.margem, b.margem]);
    }
  }

  console.log('\nB. O vão: o da casa, e não um número inventado');
  {
    for (const [largura, celulas] of colhidas) {
      const c = celulas[0];
      if (!c) continue;
      const [a, b] = c.botoes;
      const vao = b.y - (a.y + a.h);
      conferir('a ' + largura + 'px: o vão entre os dois é `--esp-2` (' + c.esp2 + 'px)',
        Math.round(vao) === Math.round(c.esp2), { vao, esp2: c.esp2 });
    }
    /* O MESMO VÃO DA `.acoes-da-aluna` — a peça que já empilha/separava dois gestos irmãos. Se um
     * dia ela mudar, esta asserção diz que as duas divergiram, em vez de deixar passar. */
    const css = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
    const gaveta = (nome) => {
      const m = new RegExp('\\.' + nome + '\\s*\\{([^}]*)\\}').exec(css);
      const g = m && /gap:\s*var\((--esp-[0-9])\)/.exec(m[1]);
      return g ? g[1] : null;
    };
    conferir('as duas peças de acções usam o MESMO passo da escala',
      gaveta('acoes-da-aluna') === gaveta('acoes-da-linha') && gaveta('acoes-da-linha') === '--esp-2',
      { aluna: gaveta('acoes-da-aluna'), linha: gaveta('acoes-da-linha') });
  }

  console.log('\nC. A largura: a coluna ganhou folga, e o rótulo mais largo cabe');
  {
    for (const [largura, celulas] of colhidas) {
      const c = celulas[0];
      if (!c) continue;
      const minimo = 8 * c.raiz; /* os 8rem declarados na peça */
      conferir('a ' + largura + 'px: a coluna tem os 8rem da peça, no mínimo',
        c.botoes[0].w >= minimo - 1, { larguraBotao: c.botoes[0].w, minimo });
      conferir('a ' + largura + 'px: a célula acomoda os botões sem os apertar',
        c.celula.w >= c.botoes[0].w + 16 - 1, { celula: c.celula.w, botao: c.botoes[0].w });
    }
    /* COM UM TIPO DE LETRA MAIS LARGO QUE O MEU — o caso que produz o «truncado» numa máquina
     * que não é esta. Se o botão voltasse a ser do tamanho exacto do texto, aqui cortava. */
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.addStyleTag({ content: 'button{letter-spacing:.55px!important}' });
    const larga = await page.evaluate(MEDIR);
    const c = larga[0];
    conferir('com um tipo de letra mais largo, o rótulo continua inteiro',
      c && !c.botoes[0].corte && !c.botoes[1].corte,
      c && c.botoes.map((x) => ({ t: x.texto, corte: x.corte })));
    conferir('…e os dois continuam com a mesma largura',
      c && Math.abs(c.botoes[0].w - c.botoes[1].w) <= 1, c && [c.botoes[0].w, c.botoes[1].w]);
  }

  console.log('\nD. O controle negativo: a marcação antiga reproduz o «acavalado»');
  {
    /* A MARCAÇÃO DE ANTES, em memória: os dois botões soltos dentro do `<td>`, sem a peça. O que
     * se mede é a diferença — sem isto, um «8px» podia vir de qualquer coisa. */
    await page.goto(base + '/', { waitUntil: 'load' });
    await page.evaluate(() => {
      for (const cx of document.querySelectorAll('.acoes-da-linha')) {
        const td = cx.parentElement;
        while (cx.firstChild) td.appendChild(cx.firstChild);
        cx.remove();
      }
    });
    const antigo = (await page.evaluate(MEDIR))[0];
    const vao = antigo.botoes[1].y - (antigo.botoes[0].y + antigo.botoes[0].h);
    conferir('sem a peça, os dois botões encostam — o vão é 0px', Math.round(vao) === 0, vao);
    conferir('…e a largura volta a ser a do conteúdo (nada de 8rem)',
      antigo.botoes[0].w < 8 * antigo.raiz, { w: antigo.botoes[0].w, minimo: 8 * antigo.raiz });
  }

  await browser.close();
  srv.close();

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
