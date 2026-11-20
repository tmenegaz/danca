#!/usr/bin/env node
'use strict';

/*
 * provar-identidade-ao-lado.js — a marca e o nome da área na MESMA linha, nas duas colunas.
 *
 * O PEDIDO, ao vivo (15/11/2026): «esse título, Sistema Lastro ou Bastidores, que é da coluna
 * marca, ele está abaixo da logomarca. Ele tem que ficar ao lado, do lado direito, com um
 * espaçamento bonito que dê para ler.»
 *
 * O QUE ESTA PROVA MEDE, e por que não é uma prova de `grep`:
 *
 *   1. A ESTRUTURA — a marca e o nome são irmãos dentro da mesma linha, na ordem certa, nas DUAS
 *      colunas. Mede-se chamando os geradores verdadeiros (`nav.desenharColuna` e a página da
 *      Produção), e não lendo o fonte: uma cópia do markup num teste mediria o teste.
 *   2. A GEOMETRIA — num navegador de verdade, com a folha de verdade. «Ao lado» e «centrado» são
 *      afirmações sobre pixels, e um `flex` mal posto passa num teste de texto e falha no ecrã. É
 *      a lição da `provar-anamnese-antes-da-aluna`: o que o `grep` não vê é o que dói.
 *   3. O TELEMÓVEL — a marca sai (a barra mostra a sua) e o nome continua, com o ar da folha.
 *   4. A CAIXINHA DOS BASTIDORES (20/11/2026) — a `.lateral-lista` tem canto de 20px, e a marca
 *      encostava-lhe ao topo. O pedido: «a logomarca ela está colada no topo […] o column group
 *      […] um padding left de 10 pixels também». A geometria é a prova: a marca 10px abaixo do
 *      canto, e o primeiro grupo na mesma vertical que ela.
 *
 * SEM NAVEGADOR, A GEOMETRIA É DECLARADA COMO NÃO MEDIDA — nunca como aprovada. Uma prova que
 * passa por ausência de ferramenta é a pior das provas.
 *
 *   node experimentos/provar-identidade-ao-lado.js
 *   CHROME=/caminho/do/chrome node experimentos/provar-identidade-ao-lado.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const nav = require(path.join(RAIZ, 'motor/nucleo/nav.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

let ok = 0;
let ko = 0;
let pulados = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};
const pular = (rotulo, motivo) => { pulados += 1; console.log('  ----  NÃO MEDIDO ' + rotulo + ' — ' + motivo); };

/* ---------------------------------------------------------------- a escola de bancada */

function envDeBancada() {
  const kv = {
    _d: new Map([['bastidores/batata/professores',
      JSON.stringify([{ nome: 'Coqui De Redinha', slug: 'coqui-de-redinha' }])]]),
    async get(k) { return this._d.has(k) ? this._d.get(k) : null; },
    async put(k, v) { this._d.set(k, v); },
    async delete(k) { this._d.delete(k); },
    async list() { return { keys: [], list_complete: true }; },
  };
  return {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', PADD_KV: kv,
    SENHA_ADMIN: 'senha-de-bancada', PROFESSOR_NOME: 'Coqui De Redinha', PROFESSOR_SLUG: 'coqui-de-redinha',
    ASSETS: {
      async fetch(req) {
        const u = req instanceof URL ? req : new URL(req.url);
        if (/\.json$/.test(u.pathname)) return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
        return new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } });
      },
    },
  };
}

/* ------------------------------------------------- a marcação, das duas colunas */

function colunaDoSistema() {
  return nav.desenharColuna([{ tipo: 'direto', href: '/aulas/', rotulo: 'Aulas' }], '/aulas/');
}

async function paginaDosBastidores() {
  const r = await producao.fetch(new Request('https://batata.padd.com.br/bastidores/producao'), envDeBancada());
  return r.text();
}

/** O miolo de `.coluna-identidade` de um HTML — o que prova a ordem dos filhos. */
function mioloDaIdentidade(html) {
  const m = /<div class="coluna-identidade">([\s\S]*?)<\/div>/.exec(String(html));
  return m ? m[1] : null;
}

/* ------------------------------------- a geometria, num navegador de verdade */

const CANDIDATOS = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
  '/usr/bin/chromium-browser', '/snap/bin/chromium'];

const CHROME = process.env.CHROME
  || CANDIDATOS.filter((c) => {
    try { return fs.existsSync(c); } catch (e) { return false; }
  })[0];

const MEDIDOR = [
  '<script>',
  "window.addEventListener('load', function () {",
  '  function r(el) { if (!el) return null; var b = el.getBoundingClientRect();',
  '    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height),',
  '             cy: Math.round(b.y + b.height / 2) }; }',
  "  var linha = document.querySelector('.coluna-identidade');",
  "  var marca = linha && linha.querySelector('.marca');",
  "  var nome = linha && linha.querySelector('.coluna-marca');",
  "  var coluna = document.querySelector('.coluna, .lateral-lista');",
  "  var caixa = document.querySelector('.lateral-lista');",
  "  var grupo = document.querySelector('.lateral .coluna-grupo');",
  "  var titulo = document.querySelector('.lateral .coluna-titulo');",
  "  var pre = document.createElement('pre'); pre.id = 'medida';",
  '  pre.textContent = JSON.stringify({ largura: window.innerWidth,',
  "    linhaDisplay: linha ? getComputedStyle(linha).display : null,",
  "    marcaDisplay: marca ? getComputedStyle(marca).display : null,",
  "    nomeDisplay: nome ? getComputedStyle(nome).display : null,",
  "    linhaPadTop: linha ? getComputedStyle(linha).paddingTop : null,",
  '    linha: r(linha), marca: r(marca), nome: r(nome), coluna: r(coluna),',
  '    caixa: r(caixa), grupo: r(grupo), titulo: r(titulo) });',
  '  document.body.appendChild(pre);',
  '});',
  '</script>',
].join('\n');

/** Monta a página de bancada: a marcação recebida + a folha de verdade, inline. */
function paginaDeBancada(corpo) {
  const css = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  return '<!doctype html><html lang="pt-BR" data-paleta="verde"><head><meta charset="utf-8">'
    + '<title>bancada</title><style>' + css + '</style></head>'
    + '<body data-layout="painel">' + corpo + MEDIDOR + '</body></html>';
}

/** Mede a página num Chrome sem interface. Devolve o objeto medido, ou lança. */
function medir(arquivo, largura) {
  const saida = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=2500', '--window-size=' + largura + ',900', '--dump-dom',
    'file://' + arquivo], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] });
  const m = /<pre id="medida">([\s\S]*?)<\/pre>/.exec(saida);
  if (!m) throw new Error('o navegador não devolveu a medida (a página não carregou?)');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

(async () => {
  const sistema = colunaDoSistema();
  const bastidores = await paginaDosBastidores();

  /* ------------------------------------------------------------ 1. A ESTRUTURA */
  console.log('1. a estrutura — marca e nome na mesma linha, nas duas colunas');
  for (const [nome, html] of [['Sistema Lastro', sistema], ['Bastidores', bastidores]]) {
    const miolo = mioloDaIdentidade(html);
    provar('`' + nome + '`: existe a linha `.coluna-identidade`', miolo !== null, null);
    if (!miolo) continue;
    const posMarca = miolo.indexOf('class="marca"');
    const posNome = miolo.indexOf('class="coluna-marca"');
    provar('`' + nome + '`: a marca e o nome estão DENTRO da linha',
      posMarca !== -1 && posNome !== -1, { posMarca, posNome });
    provar('`' + nome + '`: a marca vem primeiro, o nome depois',
      posMarca !== -1 && posNome > posMarca, { posMarca, posNome });
    provar('`' + nome + '`: nada mais entra na linha (um só par)',
      (miolo.match(/class="coluna-marca"/g) || []).length === 1, null);
  }

  /* ---------------------------------------------------- 2. O CSS QUE ALINHA */
  console.log('\n2. a folha — a linha é flex, centrada, com vão declarado');
  const css = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  const regra = (seletor) => {
    const i = css.indexOf(seletor + ' {');
    if (i === -1) return null;
    return css.slice(i, css.indexOf('}', i));
  };
  const linhaCss = regra('.coluna-identidade') || '';
  provar('`.coluna-identidade` declara `display: flex`', /display:\s*flex/.test(linhaCss), linhaCss.slice(0, 120));
  provar('…e `align-items: center` — é o que põe a marca de 44px e o nome de 12px na mesma horizontal',
    /align-items:\s*center/.test(linhaCss), null);
  provar('…e um `gap` de verdade', /gap:\s*var\(--esp-[0-9]\)/.test(linhaCss), null);
  const nomeCss = regra('.coluna-identidade > .coluna-marca') || '';
  provar('o nome não traz ar próprio (o vão é da linha)',
    /padding:\s*0/.test(nomeCss) && /margin:\s*0/.test(nomeCss), nomeCss.slice(0, 160));
  provar('…e não empurra a linha para fora (`min-width: 0`)', /min-width:\s*0/.test(nomeCss), null);

  /* A CAIXINHA DOS BASTIDORES (20/11/2026). Aqui fica o declarado; a geometria abaixo mede-o.
   * A `.lateral-lista > .coluna-identidade` aparece DUAS vezes na folha (a que a esconde no
   * telemóvel e a que a desenha na coluna), e a primeira não serve para medir nada. */
  const regrasDaLinhaLateral = [...css.matchAll(/\.lateral-lista > \.coluna-identidade\s*\{([^}]*)\}/g)]
    .map((m) => m[1]);
  provar('a identificação dos Bastidores respira do canto da caixinha (10px em cima)',
    regrasDaLinhaLateral.some((r) => /padding:\s*10px\s+10px/.test(r)), regrasDaLinhaLateral);
  const regrasDoGrupo = [...css.matchAll(/\.lateral \.coluna-grupo\s*\{([^}]*)\}/g)].map((m) => m[1]);
  provar('…e o menu começa a 10px, na vertical da marca',
    regrasDoGrupo.some((r) => /padding-left:\s*10px/.test(r)), regrasDoGrupo);

  /* ---------------------------------------------------------- 3. A GEOMETRIA */
  console.log('\n3. a geometria, num navegador de verdade');
  if (!CHROME) {
    pular('ao lado / centrado / cabe na coluna', 'não há Chrome nesta máquina (declare `CHROME=…`)');
  } else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lastro-marca-'));
    const folha = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
    const arqSistema = path.join(dir, 'sistema.html');
    fs.writeFileSync(arqSistema, paginaDeBancada(
      '<main><div class="conteudo"><h1>Sistema Lastro</h1></div></main>' + sistema));
    /* OS BASTIDORES VÊM DA PÁGINA INTEIRA — com a `<style>` DELA, que é onde o `.lateral` tem a
     * sua medida. Extrair só o bloco daria uma coluna de 1400px de largura, e a medida seria da
     * bancada e não da página.
     *
     * E A FOLHA ENTRA NO LUGAR DO `<link>`: a página pede `/assets/style.css` por caminho
     * absoluto, que o `file://` não serve. Sem esta troca o navegador carrega a página SEM folha
     * nenhuma, e a primeira versão desta prova mediu um `.coluna-identidade` a `display:block` —
     * o defeito era da bancada, e teria passado por «o CSS está errado». */
    const arqBastidores = path.join(dir, 'bastidores.html');
    fs.writeFileSync(arqBastidores, bastidores
      .replace(/<link rel="stylesheet"[^>]*>/, '<style>' + folha + '</style>')
      .replace('</body>', MEDIDOR + '</body>'));

    for (const [nome, arquivo, largura] of [['Sistema Lastro', arqSistema, 1400],
      ['Bastidores', arqBastidores, 1400], ['Bastidores', arqBastidores, 800]]) {
      const d = medir(arquivo, largura);
      const rot = '`' + nome + '` @' + largura + 'px';
      if (!d.linha || !d.marca || !d.nome) { provar(rot + ': a linha, a marca e o nome existem', false, d); continue; }
      if (d.marca.w === 0) { provar(rot + ': a marca aparece', false, d.marca); continue; }
      provar(rot + ': o nome está À DIREITA da marca', d.nome.x > d.marca.x + d.marca.w, d);
      provar(rot + ': o vão entre os dois é de 8px ou mais (legível, sem colar)',
        d.nome.x - (d.marca.x + d.marca.w) >= 8, d.nome.x - (d.marca.x + d.marca.w));
      provar(rot + ': os centros verticais coincidem (é o que os põe na mesma linha)',
        Math.abs(d.marca.cy - d.nome.cy) <= 1, { marca: d.marca.cy, nome: d.nome.cy });
      provar(rot + ': o nome CABE na coluna, sem ser cortado',
        d.nome.x + d.nome.w <= d.coluna.x + d.coluna.w,
        { fim: d.nome.x + d.nome.w, coluna: d.coluna.x + d.coluna.w });
      /* A CAIXINHA (20/11/2026) — só nos Bastidores: é a única das duas colunas que é uma folha
       * com canto e sombra (`.folha-do-menu`), e é do canto dela que a marca se tinha de afastar. */
      if (d.caixa) {
        provar(rot + ': a marca não encosta ao canto da caixinha (10px de ar em cima)',
          d.marca.y - d.caixa.y >= 8, { marca: d.marca.y, caixa: d.caixa.y });
        provar(rot + ': o primeiro grupo do menu começa na vertical da marca',
          Boolean(d.titulo) && Math.abs(d.titulo.x - d.marca.x) <= 1,
          { titulo: d.titulo && d.titulo.x, marca: d.marca.x });
      }
    }

    /* O TELEMÓVEL — a folha. A marca da coluna sai (a barra mostra a sua) e o nome continua, com
     * o ar que a folha sempre lhe deu. */
    const pequeno = medir(arqSistema, 900);
    provar('na folha do telemóvel, a marca da coluna NÃO aparece (a da barra é que serve)',
      pequeno.marcaDisplay === 'none' || !pequeno.marca || pequeno.marca.w === 0, pequeno.marcaDisplay);
    provar('…e o nome continua visível, com o ar da folha',
      pequeno.nomeDisplay === 'block' && pequeno.nome.x >= 20, pequeno.nome);

    for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  }

  console.log('\n' + (ko === 0 ? 'TUDO CERTO — ' + ok + ' asserções'
    + (pulados ? ' (' + pulados + ' não medidas).' : '.')
    : 'FALHOU — ' + ok + ' asserção(ões), ' + ko + ' falha(s).'));
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => { console.error('erro: ' + ((erro && erro.stack) || erro)); process.exit(2); });
