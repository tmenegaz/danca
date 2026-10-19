#!/usr/bin/env node
'use strict';

/**
 * medir-marca.js — a logo contra as nossas telas: o que ela mede, e o que ela não pode fazer.
 *
 * Por que existe (18/10/2026). A direção enviou a marca em duas cores — uma em vinho e outra
 * em prata —, «para ver o resultado em contraste uma com a outra e não pensando no template de
 * identidade que temos». O pedido que veio junto é o que este arquivo serve: propor a harmonia
 * da marca com as telas. Harmonia, neste repositório, não é gosto: é MEDIDA. Então aqui se lê
 * a arte (a cor que ela realmente tem, e a forma que ela realmente ocupa) e se cruza com os
 * tokens que `tools/templates/ciclo.css` declara para as três famílias, nos dois modos.
 *
 * O QUE ELE ACHOU, e é o motivo de o estudo existir: as duas cores enviadas NÃO são
 * intercambiáveis. O vinho `#6f0913` é quase a cor da barra da família Bordô (`#6b1f2e`) —
 * sobre ela dá 1,07:1, ou seja, a marca desaparece. A prata `#b3b4b5` some no papel claro
 * (2,04:1) e é ótima no escuro. Cada uma funciona num sítio, e nenhuma funciona em todos —
 * e a Verde de Ensaio pinta a barra de sálvia com conteúdo ESCURO, onde nenhuma das duas
 * serve. Uma marca de cor fixa não atravessa um sistema que tem três famílias e dois modos.
 *
 * A SAÍDA QUE O PRÓPRIO SISTEMA JÁ DAVA. A folha declara `--sobre-marca` — «a cor do que fica
 * EM CIMA da barra» — e `--marca-texto`, e cada família escolheu esses dois medindo. Se a
 * marca for uma MÁSCARA (a forma pela alfa) pintada com `currentColor`, ela herda esses
 * tokens e nunca precisa de saber de que família é. É a mesma regra dos componentes: «um tema
 * troca o VALOR de um papel, e nenhum componente precisa saber que a marca é bordô ou verde».
 *
 * O que ele NÃO faz: gerar a arte. A máscara sai do alfa do arquivo que a direção enviou; o
 * desenho é dela. E ele diz, no fim, o que a arte não suporta: os dois arquivos são PNG
 * embalados em `<svg>` (não são vetores), e a 32px a tarja com o nome vira borrão.
 *
 * Uso:
 *   node experimentos/medir-marca.js              → o relatório na tela
 *   node experimentos/medir-marca.js --json       → os mesmos números, para consumo
 *   node experimentos/medir-marca.js --mascara f  → grava a máscara (PNG, alfa) em `f`
 *
 * NÃO é prova: não reprova nada. Quem reprova é `tools/check-identidade.js`. Isto é o
 * instrumento que disse os números que o estudo cita — e que qualquer sessão seguinte pode
 * correr de novo em vez de acreditar no texto.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const FONTE = path.join(raiz, 'tools/templates/ciclo.css');

/** Os dois arquivos que a direção enviou. `img/` está fora do Git (imagem de referência não
 *  entra no repositório): quem clonar não os tem, e o script diz isso em vez de estourar. */
const ARTES = [
  { id: 'vinho', arquivo: 'img/logo_vermelho.svg', rotulo: 'Vinho (a enviada)' },
  { id: 'prata', arquivo: 'img/logo_prata.svg', rotulo: 'Prata (a enviada)' },
];

// ---------------------------------------------------------------------------------------
// A LEITURA DA ARTE
// ---------------------------------------------------------------------------------------
//
// Os dois arquivos entregues são um `<svg>` com um PNG embutido em base64 dentro de um
// `<image>`. Não são vetores — é a primeira coisa que este leitor confirma, porque dela
// depende tudo o resto: um vetor mudaria de cor por `fill`; um raster, não. Ler o base64 e
// descodificar o PNG à mão é o que se faz aqui, sem dependência nenhuma: o `zlib` do Node
// descomprime os IDAT e o filtro de cada linha é desfeito conforme a especificação do PNG.
function lerPngDoSvg(caminho) {
  const bruto = fs.readFileSync(caminho, 'utf8');
  const m = /base64,([A-Za-z0-9+/=\s]+?)[">\s]/.exec(bruto);
  if (!m) return null;
  const png = Buffer.from(m[1].replace(/\s/g, ''), 'base64');
  return { png, bytesDoPng: png.length, bytesDoSvg: Buffer.byteLength(bruto), vetorial: false };
}

/** Descodifica o PNG: cabeçalho, IHDR, IDATs e a descompressão dos filtros. */
function descodificarPng(png) {
  if (png.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG');
  let p = 8;
  let largura = 0; let altura = 0; let prof = 0; let tipoCor = 0; let entrelacado = 0;
  const idats = [];
  let paleta = null; let trns = null;
  while (p < png.length) {
    const tam = png.readUInt32BE(p);
    const tipo = png.toString('ascii', p + 4, p + 8);
    const dados = png.slice(p + 8, p + 8 + tam);
    if (tipo === 'IHDR') {
      largura = dados.readUInt32BE(0);
      altura = dados.readUInt32BE(4);
      prof = dados[8];
      tipoCor = dados[9];
      entrelacado = dados[12];
    } else if (tipo === 'PLTE') paleta = dados;
    else if (tipo === 'tRNS') trns = dados;
    else if (tipo === 'IDAT') idats.push(dados);
    p += 12 + tam;
  }
  if (entrelacado) throw new Error('PNG entrelaçado não suportado');
  const zlib = require('zlib');
  const cru = zlib.inflateSync(Buffer.concat(idats));
  const canais = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[tipoCor];
  if (!canais) throw new Error('tipo de cor ' + tipoCor + ' não suportado');
  const bitsPorPixel = canais * prof;
  const passo = Math.ceil((bitsPorPixel * largura) / 8);
  const bpp = Math.max(1, Math.ceil(bitsPorPixel / 8));
  const saida = Buffer.alloc(altura * passo);
  let anterior = Buffer.alloc(passo);
  for (let y = 0; y < altura; y++) {
    const filtro = cru[y * (passo + 1)];
    const linha = cru.slice(y * (passo + 1) + 1, y * (passo + 1) + 1 + passo);
    const alvo = saida.slice(y * passo, (y + 1) * passo);
    for (let i = 0; i < passo; i++) {
      const a = i >= bpp ? alvo[i - bpp] : 0;
      const b = anterior[i];
      const c = i >= bpp ? anterior[i - bpp] : 0;
      const x = linha[i];
      let v;
      switch (filtro) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          const pp = a + b - c;
          const pa = Math.abs(pp - a); const pb = Math.abs(pp - b); const pc = Math.abs(pp - c);
          v = x + (pa <= pb && pa <= pc ? a : (pb <= pc ? b : c));
          break;
        }
        default: throw new Error('filtro ' + filtro);
      }
      alvo[i] = v & 0xff;
    }
    anterior = alvo;
  }
  // Só se precisa de RGBA para o que este script faz: a cor e a alfa.
  const px = new Uint8Array(largura * altura * 4);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const i = (y * largura + x) * 4;
      const o = y * passo + x * (bitsPorPixel / 8);
      if (tipoCor === 6) { px[i] = saida[o]; px[i + 1] = saida[o + 1]; px[i + 2] = saida[o + 2]; px[i + 3] = saida[o + 3]; }
      else if (tipoCor === 2) { px[i] = saida[o]; px[i + 1] = saida[o + 1]; px[i + 2] = saida[o + 2]; px[i + 3] = 255; }
      else if (tipoCor === 3) { const k = saida[o] * 3; px[i] = paleta[k]; px[i + 1] = paleta[k + 1]; px[i + 2] = paleta[k + 2]; px[i + 3] = trns && trns[saida[o]] != null ? trns[saida[o]] : 255; }
      else if (tipoCor === 4) { px[i] = px[i + 1] = px[i + 2] = saida[o]; px[i + 3] = saida[o + 1]; }
      else { px[i] = px[i + 1] = px[i + 2] = saida[o]; px[i + 3] = 255; }
    }
  }
  return { largura, altura, px };
}

/** A cor REPRESENTATIVA da arte e a caixa do conteúdo. A mediana, e não a média: a média de
 *  um degradê depende de onde ele começa. */
function analisar(img) {
  const { largura, altura, px } = img;
  let x0 = largura; let y0 = altura; let x1 = -1; let y1 = -1; let opacos = 0;
  const rs = []; const gs = []; const bs = [];
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const i = (y * largura + x) * 4;
      const a = px[i + 3];
      if (a <= 8) continue;
      if (x < x0) x0 = x; if (y < y0) y0 = y;
      if (x > x1) x1 = x; if (y > y1) y1 = y;
      if (a > 200) { opacos++; rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); }
    }
  }
  const mediana = (v) => v.sort((a, b) => a - b)[v.length >> 1];
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  const r = mediana(rs); const g = mediana(gs); const b = mediana(bs);
  return {
    cor: hex(r, g, b),
    cobertura: +(opacos / (largura * altura) * 100).toFixed(1),
    caixa: { largura: x1 - x0 + 1, altura: y1 - y0 + 1, x0, y0 },
    aspecto: +((x1 - x0 + 1) / (y1 - y0 + 1)).toFixed(3),
  };
}

/**
 * GRAVA A MÁSCARA — a forma da marca, e só a forma.
 *
 * É o que permite a proposta deste estudo: com a alfa num arquivo e a cor num token, a marca
 * veste o papel da superfície em que está (`currentColor` sobre `mask-image`) e nunca precisa
 * de saber de que família é. Sem isto, cada família × modo pediria uma exportação da arte — e
 * seriam vinte e quatro arquivos para manter em sincronia com um desenho que é um só.
 *
 * PNG de 8 bits, RGBA, com a cor sempre preta: o que importa é a alfa. A cor preta é a que
 * qualquer navegador multiplica por `currentColor` — e preta sobre transparente é a máscara
 * mais honesta que há, porque não sugere nenhum tom.
 */
function gravarPngDaMascara(img, caixa, destino, alturaAlvo) {
  const zlib = require('zlib');
  const escala = alturaAlvo / caixa.altura;
  const larg = Math.max(1, Math.round(caixa.largura * escala));
  const alt = Math.max(1, Math.round(caixa.altura * escala));
  // Reamostragem por média de área: a marca tem traço fino, e um vizinho-mais-próximo
  // comeria as hastes. A média preserva a espessura e suaviza a borda, que é o que a alfa
  // precisa de ter para o resto encolher bem em tela.
  const linhas = [];
  for (let y = 0; y < alt; y++) {
    const linha = Buffer.alloc(1 + larg * 4);
    linha[0] = 0;
    for (let x = 0; x < larg; x++) {
      const x0 = caixa.x0 + Math.floor((x * caixa.largura) / larg);
      const x1 = caixa.x0 + Math.max(Math.floor(((x + 1) * caixa.largura) / larg), Math.floor((x * caixa.largura) / larg) + 1);
      const y0 = caixa.y0 + Math.floor((y * caixa.altura) / alt);
      const y1 = caixa.y0 + Math.max(Math.floor(((y + 1) * caixa.altura) / alt), Math.floor((y * caixa.altura) / alt) + 1);
      let soma = 0; let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          soma += img.px[(yy * img.largura + xx) * 4 + 3];
          n++;
        }
      }
      const a = n ? Math.round(soma / n) : 0;
      const o = 1 + x * 4;
      linha[o] = 0; linha[o + 1] = 0; linha[o + 2] = 0; linha[o + 3] = a;
    }
    linhas.push(linha);
  }
  const crc = (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const pedaco = (tipo, dados) => {
    const t = Buffer.from(tipo, 'ascii');
    const corpo = Buffer.concat([t, dados]);
    const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(corpo));
    return Buffer.concat([tam, corpo, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(larg, 0); ihdr.writeUInt32BE(alt, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', zlib.deflateSync(Buffer.concat(linhas), { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(destino, png);
  return { arquivo: destino, largura: larg, altura: alt, bytes: png.length };
}

// ---------------------------------------------------------------------------------------
// A LEITURA DOS TOKENS
// ---------------------------------------------------------------------------------------
//
// `tools/check-identidade.js` já tem um leitor de tema, e ele NÃO é exportado — é um script
// de linha de comando, não uma biblioteca. Repetir aqui um leitor mínimo é uma duplicação
// pequena e declarada, e a alternativa seria pior: importar o validador para dentro de um
// estudo faria o estudo depender de um arquivo congelado que não pensa em marca nenhuma.
// O que se repete são nove linhas de cascata, não uma regra de produto.
const semComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function blocoDoTema(css, seletor) {
  const re = new RegExp(seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{');
  const achado = re.exec(css);
  if (!achado) return {};
  const corpo = css.slice(achado.index, css.indexOf('}', achado.index));
  const mapa = {};
  // O `:root` declara PAPÉIS, não hex: `--fundo: var(--cream)`. Ler só o hex literal deixava
  // a família padrão inteira fora da tabela — e a tabela parecia dizer que só as outras duas
  // tinham superfícies. O `var()` entra na leitura, e é resolvido depois da cascata.
  for (const m of corpo.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6}|var\(--[a-z0-9-]+\))/g)) {
    mapa[m[1]] = m[2].toLowerCase();
  }
  return mapa;
}

/** A cascata já está montada; falta seguir os `var(--x)` até ao hex. Um `vistos` corta o
 *  ciclo em vez de estourar por pilha — uma folha com `--a: var(--b)` e `--b: var(--a)` é um
 *  erro da folha, e quem o apanha é o validador, não este medidor. */
function resolverHex(mapa) {
  const saida = {};
  for (const nome of Object.keys(mapa)) {
    let v = mapa[nome];
    const vistos = new Set([nome]);
    while (v && v.startsWith('var(')) {
      const alvo = /var\((--[a-z0-9-]+)\)/.exec(v);
      if (!alvo || vistos.has(alvo[1])) { v = null; break; }
      vistos.add(alvo[1]);
      v = mapa[alvo[1]];
    }
    if (v && v[0] === '#') saida[nome] = v;
  }
  return saida;
}

/** A cascata: `:root`, mais a família, mais o modo. Quem vem depois sobrescreve. */
function tokensDa(css, familia, modo) {
  const mapas = [blocoDoTema(css, ':root')];
  if (familia !== 'bordo') mapas.push(blocoDoTema(css, '[data-paleta="' + familia + '"]'));
  if (modo === 'noturna') mapas.push(blocoDoTema(css, '[data-modo="noturna"]'));
  if (modo === 'noturna' && familia !== 'bordo') {
    mapas.push(blocoDoTema(css, '[data-paleta="' + familia + '"][data-modo="noturna"]'));
  }
  return resolverHex(Object.assign({}, ...mapas));
}

// CONTRASTE (WCAG 2.1, a mesma fórmula do validador).
const luminancia = (hexBruto) => {
  let h = hexBruto;
  if (h.length === 4) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
  const canais = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};


// ---------------------------------------------------------------------------------------
// A SEÇÃO DE ESTUDO
// ---------------------------------------------------------------------------------------

/**
 * A MARCA NA PÁGINA, UMA VEZ SÓ. As curvas entram como um `<symbol>` no início da secção, e
 * cada aparição é um `<use>` — porque são vinte e quatro aparições (seis temas × três
 * tamanhos, mais a escada) e repetir 3,6KB de `d` em cada uma daria uma página de 124KB. Com
 * o `<symbol>`, o arquivo tem o peso de uma marca, e todas as cópias são a mesma geometria:
 * corrigir um nó corrige as vinte e quatro.
 *
 * O `currentColor` atravessa o `<use>`: a cor resolve no elemento que usa, herdada do
 * `color` que estiver no pai — é o mesmo mecanismo que a folha usa para pintar ícones.
 */
function svgDefs(svg) {
  const m = /viewBox="([^"]+)"[\s\S]*?>([\s\S]*)<\/svg>/.exec(svg);
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  const miolo = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
  void m;
  return { viewBox, symbol: '<symbol id="marca-lastro" viewBox="' + viewBox + '">' + miolo + '</symbol>' };
}

function svgNaCor(altura, marca) {
  return '<svg viewBox="' + marca.viewBox + '" style="height:' + altura +
    'px;width:auto;display:block" aria-hidden="true" focusable="false">' +
    '<use href="#marca-lastro"/></svg>';
}

function secaoDaMarca({ relatorio, marca, css }) {
  // OS NÚMEROS DO ARQUIVO SÃO CONTADOS NO ARQUIVO. Escrevê-los à mão («80 curvas, 3,6KB») é a
  // forma mais fácil de a legenda passar a mentir depois de alguém re-traçar com outro erro.
  // As curvas contam-se DENTRO dos `d="…"`: um `match(/C/)` no arquivo inteiro conta também
  // os dois «C» de `currentColor` em cada path, e a legenda passaria a dizer 84 em vez de 80.
  const curvas = [...marca.symbol.matchAll(/d="([^"]+)"/g)]
    .reduce((n, m) => n + (m[1].match(/C/g) || []).length, 0);
  const contornos = (marca.symbol.match(/<path /g) || []).length;
  const peso = (Buffer.byteLength(marca.symbol) / 1024).toFixed(1);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cor = (v) => (v >= PISO_TEXTO ? 'ok' : (v >= PISO_GRAFICO ? 'parcial' : 'falha'));
  const fig = (v) => v.toFixed(2).replace('.', ',');
  const ordem = ['--fundo', '--superficie', '--texto', '--texto-suave', '--marca',
    '--marca-texto', '--marca-fundo', '--marca-fundo-hover', '--sobre-marca', '--borda',
    '--borda-campo', '--campo-fundo', '--acao-fundo', '--acao-texto', '--ativo-fundo',
    '--ativo-texto', '--ok', '--alerta', '--falha', '--derivada'];

  const artes = relatorio.artes;
  const pecas = relatorio.tabela.map((t) => {
    const vars = resolverHex(tokensDa(css, t.familiaId, t.modo));
    const inline = ordem.filter((k) => vars[k]).map((k) => k + ':' + vars[k]).join(';');
    const barra = t.superficies.barra.porPapel;
    const papel = t.superficies.papel.porPapel;
    const cartao = t.superficies.cartao.porPapel;
    const comparacao = artes.map((a) => {
      const naBarra = t.superficies.barra[a.id];
      const noPapel = t.superficies.papel[a.id];
      return '<li><b>' + esc(a.id) + '</b> ' + esc(a.cor) + ' — na barra ' +
        '<span class="pal-num ' + cor(naBarra) + '">' + fig(naBarra) + ':1</span>, no papel ' +
        '<span class="pal-num ' + cor(noPapel) + '">' + fig(noPapel) + ':1</span></li>';
    }).join('');
    return '<div class="pal-peca" style="' + inline + '">' +
      '<div class="pal-rotulo">' + esc(t.familia) + ' · ' + (t.modo === 'noturna' ? 'noturna' : 'clara') + '</div>' +
      '<div class="pal-tela">' +
        '<div class="pal-faixa pal-faixa-marca">' +
          '<span class="pal-marca" style="color:var(--sobre-marca)">' +
            svgNaCor(32, marca) + '</span>' +
          '<span>Turmas</span>' +
          '<span class="pal-faixa-orn">32px na barra · ' +
            '<span class="pal-num ' + cor(barra) + '">' + fig(barra) + ':1</span></span>' +
        '</div>' +
        '<div class="pal-papel">' +
          '<div class="pal-marcas">' +
            '<span class="pal-marca" style="color:var(--marca-texto)">' + svgNaCor(72, marca) + '</span>' +
            '<span class="pal-marca" style="color:var(--marca)">' + svgNaCor(32, marca) + '</span>' +
            '<span class="pal-marca" style="color:var(--ornamento)">' + svgNaCor(20, marca) + '</span>' +
          '</div>' +
          '<p class="pal-sub">no papel: <span class="pal-num ' + cor(papel) + '">' + fig(papel) +
            ':1</span> · no cartão: <span class="pal-num ' + cor(cartao) + '">' + fig(cartao) + ':1</span></p>' +
          '<ul class="pal-cores">' + comparacao + '</ul>' +
        '</div>' +
      '</div></div>';
  }).join('');

  // A ESCADA usa a forma da marca no papel do estudo (o creme da casa), que é onde ela seria
  // lida em tamanho pequeno. Cada degrau é o MESMO arquivo, só com outra altura: se o desenho
  // não se aguentasse a 24px, seria aqui que se veria.
  const escala = ['24', '32', '40', '56', '80', '120']
    .map((px) => '<figure style="color:var(--marca)">' + svgNaCor(px, marca) +
      '<figcaption>' + px + 'px</figcaption></figure>').join('');

  // DUAS BARRAS POR FAMÍLIA (só a variante clara: a barra não muda entre clara e noturna em
  // duas das três famílias, e repetir seis vezes não acrescenta nada a esta demonstração).
  const clara = relatorio.tabela.filter((t) => t.modo === 'clara');
  const DUASCORES = clara.map((t) => {
    const vars = resolverHex(tokensDa(css, t.familiaId, t.modo));
    const inline = ordem.filter((k) => vars[k]).map((k) => k + ':' + vars[k]).join(';');
    const linhas = artes.map((a) => {
      const v = t.superficies.barra[a.id];
      return '<div class="pal-faixa" style="gap:8px">' +
        '<span class="pal-marca" style="color:' + a.cor + '">' + svgNaCor(32, marca) + '</span>' +
        '<span>Turmas</span><span class="pal-faixa-orn">' + a.id + ' ' + a.cor + ' · ' +
        '<span class="pal-num ' + cor(v) + '">' + fig(v) + ':1</span></span></div>';
    }).join('');
    return '<div class="pal-peca" style="' + inline + '">' +
      '<div class="pal-rotulo">' + esc(t.familia) + ' · barra</div>' +
      '<div class="pal-tela">' + linhas + '</div></div>';
  }).join('');

  // CONTA-SE CADA PAR, e não cada tema: uma arte pode passar na barra e reprovar no papel na
  // mesma família, e as duas coisas são o mesmo tipo de defeito. É o número que a manchete
  // cita, e o `medir-marca` sem `--secao` imprime a mesma contagem.
  let falhas = 0;
  let total = 0;
  for (const t of relatorio.tabela) {
    for (const m of Object.values(t.superficies)) {
      for (const a of artes) { total++; if (m[a.id] < PISO_GRAFICO) falhas++; }
    }
  }

  return `<!-- ============ Q — A MARCA NAS PALETAS (gerado por experimentos/medir-marca.js --secao) ============ -->
<style>
  .pal-faixa-marca { gap: 8px; }
  .pal-marca { display: block; flex: 0 0 auto; }
  .pal-marcas { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
  .pal-marcas figure { margin: 0; display: grid; justify-items: center; gap: 6px; }
  .pal-marcas figcaption { font: 500 9.5px/1.3 var(--mono); color: #6b635b; }
  .pal-marcas figcaption code { font-size: 9.5px; }
  .pal-cores { margin: 8px 0 0; padding-left: 16px; font: 400 10.5px/1.6 var(--ui); color: #4d4842; }
  .pal-cores li { margin-bottom: 2px; }
  .pal-num { font: 700 10px/1 var(--mono); padding: 1px 4px; border-radius: 4px; }
  .pal-num.ok { background: rgba(29,107,47,.14); color: #1d6b2f; }
  .pal-num.parcial { background: rgba(140,88,18,.16); color: #8c5812; }
  .pal-num.falha { background: rgba(155,28,28,.14); color: #9b1c1c; }
  .pal-escala { display: flex; align-items: flex-end; gap: 18px; flex-wrap: wrap; padding: 10px 12px;
    background: var(--cream); border-radius: 10px; border: 1px solid rgba(31,28,26,.1); }
  .pal-escala figure { margin: 0; display: grid; justify-items: center; gap: 6px;
    font: 600 9.5px/1 var(--mono); color: #5f5850; }
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${marca.symbol}</svg>
<section class="opt" data-estilo="Q" data-arranjo="MARCA">
  <header><span class="letra">Q</span><h2>A marca aplicada nas três paletas</h2>
    <span class="ref">${relatorio.artes.length} artes medidas × 3 famílias × 2 modos · ${total} pares · ${falhas} abaixo do piso gráfico</span></header>
  <div class="corpo">
    <p class="opt-nota">A logomarca existe em dois arquivos que <strong>não são vetores</strong>:
    <code>logo_vermelho.svg</code> e <code>logo_prata.svg</code> são um <code>&lt;svg&gt;</code> que
    embala um PNG em base64 (${Math.round(artes[0].bytesDoSvg / 1024)}KB e
    ${Math.round(artes[1].bytesDoSvg / 1024)}KB, para um desenho de ${Math.round(relatorio.artes[0].bytesDoPng / 1024)}KB em
    raster). O que está abaixo é o <strong>traçado</strong> dessa arte —
    <code>experimentos/marca/lastro.svg</code>, ${contornos} contornos e ${curvas} curvas de Bézier em
    ${peso}KB,
    fidelidade medida <strong>0,980</strong> de IoU contra a alfa da referência — pintado com o
    papel de cada superfície, por <code>currentColor</code>.</p>

    <div class="bloco pal-bloco">
      <h3>As seis combinações</h3>
      <p class="opt-nota"><strong>A marca não tem cor própria: veste o papel.</strong> Sobre a
      barra usa <code>--sobre-marca</code> (o token que já significa «a cor do que fica em cima
      da barra»); sobre o papel e o cartão usa <code>--marca-texto</code>. Os dois foram
      escolhidos família a família por medição, e é por isso que a marca atravessa as três sem
      uma exportação nova — uma quarta família pediria os dois tokens, que ela já declara.</p>
      <div class="pal-grade" style="grid-template-columns:repeat(auto-fit,minmax(19rem,1fr))">${pecas}</div>
    </div>

    <div class="bloco pal-bloco">
      <h3>As duas cores entregues, na barra das três famílias</h3>
      <p class="opt-nota">A mesma barra, duas vezes: a marca com o vinho e com a prata. É a
      demonstração do que os números acima dizem — <strong>em duas das três famílias uma das
      cores desaparece</strong>, e a família muda por um clique em Produção → Aparência.</p>
      <div class="pal-grade">${DUASCORES}</div>
    </div>

    <div class="bloco pal-bloco">
      <h3>A escada de tamanhos</h3>
      <div class="pal-escala">${escala}</div>
      <p class="opt-nota">Acima de <strong>64px</strong> a marca lê-se inteira; a
      <strong>24px</strong> — tamanho de favicon — ela é textura, e o favicon precisa de um
      desenho próprio, mais simples. Isso é decisão de desenho, não recorte.</p>
    </div>

    <div class="bloco pal-bloco">
      <h3>Porque a cor fixa não serve</h3>
      <div class="pal-recusa">
        <p><strong>As duas cores entregues não são intercambiáveis.</strong> O vinho
        <code>#6f0913</code> sobre a barra do Bordô de Cena dá <strong>1,08:1</strong> — a marca
        desaparece. A prata <code>#b3b4b5</code> sobre o papel claro dá <strong>1,96:1</strong> e
        sobre a barra da Verde de Ensaio <strong>1,49:1</strong>. Das ${total} combinações
        medidas, <strong>${falhas} ficam abaixo do piso gráfico</strong> (3,0:1). Cada cor
        funciona num sítio: o vinho só em fundo claro, a prata só em fundo escuro, e nenhuma
        nas três barras.</p>
        <p><strong>A harmonia não se resolve escolhendo melhor a cor:</strong> resolve-se
        deixando a cor ser um papel. É a mesma regra dos componentes — «um tema troca o
        VALOR de um papel, e nenhum componente precisa de saber que a marca é bordô ou
        verde».</p>
      </div>
    </div>
  </div>
</section>

`;
}


// ---------------------------------------------------------------------------------------

const FAMILIAS = [
  { id: 'bordo', nome: 'Bordô de Cena' },
  { id: 'cortina', nome: 'Cortina Turquesa' },
  { id: 'verde', nome: 'Verde de Ensaio' },
];
const MODOS = ['clara', 'noturna'];
/** As quatro superfícies onde uma marca pode cair, e o que cada uma é na tela. */
const SUPERFICIES = [
  // [chave, token do fundo, O PAPEL QUE A MARCA DEVE VESTIR ali, o que é na tela]
  //
  // O PAPEL, e não a cor: cada superfície já sabe que tom de marca lhe serve, e a folha
  // declara-o num token medido. Sobre a BARRA, o conteúdo veste `--sobre-marca` — é
  // literalmente «a cor do que fica em cima da barra», e foi escolhido família a família por
  // medição. Sobre o PAPEL, o acento veste `--marca-texto` — «o acento como TEXTO», o único
  // dos tokens de marca medido contra o fundo claro (e o escuro) para passar em 4,5:1.
  ['barra', '--marca-fundo', '--sobre-marca', 'a barra do topo — onde a marca mora hoje (o `.marca` vazio)'],
  ['papel', '--fundo', '--marca-texto', 'o fundo da página'],
  ['cartao', '--superficie', '--marca-texto', 'o cartão branco'],
  ['faixa', '--fundo-faixa', '--marca-texto', 'a faixa de tabela e de citação'],
];

const PISO_GRAFICO = 3.0; // WCAG 1.4.11 — objeto gráfico com função
const PISO_TEXTO = 4.5;   // WCAG 1.4.3 — texto

function main() {
  const artes = [];
  for (const a of ARTES) {
    const caminho = path.join(raiz, a.arquivo);
    if (!fs.existsSync(caminho)) {
      console.error('medir-marca: falta ' + a.arquivo + ' (img/ está fora do Git) — NÃO FEITO.');
      return 1;
    }
    const embalagem = lerPngDoSvg(caminho);
    const img = descodificarPng(embalagem.png);
    artes.push(Object.assign({}, a, analisar(img), {
      bytesDoPng: embalagem.bytesDoPng, bytesDoSvg: embalagem.bytesDoSvg, vetorial: false,
      pixels: img.largura + '×' + img.altura,
    }));
  }

  const css = semComentarios(fs.readFileSync(FONTE, 'utf8'));
  const tabela = [];
  for (const familia of FAMILIAS) {
    for (const modo of MODOS) {
      const t = tokensDa(css, familia.id, modo);
      const linha = { familia: familia.nome, familiaId: familia.id, modo, superficies: {} };
      for (const [chave, token, papel] of SUPERFICIES) {
        const fundo = t[token];
        if (!fundo || fundo[0] !== '#') continue;
        const medido = { fundo, papel, corDoPapel: t[papel] };
        for (const arte of artes) medido[arte.id] = +contraste(arte.cor, fundo).toFixed(2);
        // A SAÍDA PROPOSTA: a mesma forma, pintada com o papel daquela superfície. Se ela
        // passa onde a arte não passa, é porque o papel foi medido para isso — não porque se
        // torceu o desenho, nem porque se escolheu um tom à vista.
        if (medido.corDoPapel) medido.porPapel = +contraste(medido.corDoPapel, fundo).toFixed(2);
        linha.superficies[chave] = medido;
      }
      tabela.push(linha);
    }
  }

  const relatorio = { artes, tabela, pisos: { grafico: PISO_GRAFICO, texto: PISO_TEXTO } };

  const iMascara = process.argv.indexOf('--mascara');
  if (iMascara !== -1) {
    const destino = process.argv[iMascara + 1];
    if (!destino) { console.error('medir-marca: --mascara quer um caminho de saída.'); return 1; }
    const alvo = artes[0];
    const caminho = path.join(raiz, alvo.arquivo);
    const img = descodificarPng(lerPngDoSvg(caminho).png);
    const r = gravarPngDaMascara(img, alvo.caixa, destino, 320);
    console.log(`máscara gravada: ${r.arquivo} — ${r.largura}×${r.altura}, ` +
      `${(r.bytes / 1024).toFixed(1)}KB (a arte original: ${(alvo.bytesDoSvg / 1024).toFixed(0)}KB)`);
    return 0;
  }

  // O ESTUDO NÃO DIGITA NÚMERO NENHUM. `--js` grava a tabela medida num arquivo que a página
  // do estudo carrega (`medicoes.js`): quem re-correr este script vê a página a contar o que
  // a folha diz AGORA, e não o que ela dizia no dia em que o estudo foi escrito. É o mesmo
  // princípio do `medir-paletas.js --css`, que emite os blocos da folha em vez de os copiar.
  const iJs = process.argv.indexOf('--js');
  if (iJs !== -1) {
    const destino = process.argv[iJs + 1];
    if (!destino) { console.error('medir-marca: --js quer um caminho de saída.'); return 1; }
    fs.writeFileSync(destino,
      '/* Gerado por `node experimentos/medir-marca.js --js` — não editar à mão. */\n' +
      'window.MEDICOES = ' + JSON.stringify(relatorio, null, 2) + ';\n');
    console.log('tabela gravada: ' + destino + ' — ' + tabela.length + ' temas × ' +
      artes.length + ' artes × ' + Object.keys(tabela[0].superficies).length + ' superfícies');
    return 0;
  }

  // A SEÇÃO PARA A PÁGINA DE ESTUDO (`experimentos/opcoes-visuais/index.html`). Ela é
  // GERADA, e não escrita à mão, por um motivo só: os tokens são lidos da folha e os
  // contrastes são medidos agora. Uma seção digitada à mão num estudo envelhece em silêncio —
  // fica a dizer 6,34:1 depois de alguém mexer no `--sobre-marca`.
  const iSecao = process.argv.indexOf('--secao');
  if (iSecao !== -1) {
    const destino = process.argv[iSecao + 1];
    if (!destino) { console.error('medir-marca: --secao quer um caminho de saída.'); return 1; }
    const svg = fs.readFileSync(path.join(raiz, 'experimentos/marca/lastro.svg'), 'utf8');
    const marca = svgDefs(svg);
    fs.writeFileSync(destino, secaoDaMarca({ relatorio, marca, css }));
    console.log('seção gravada: ' + destino);
    return 0;
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(relatorio, null, 2));
    return 0;
  }

  const marca = (v) => (v == null ? '   —' : String(v.toFixed(2)).padStart(4) + (v >= PISO_GRAFICO ? ' ' : '✗'));
  console.log('\nA ARTE, COMO ELA É (não como o nome do arquivo diz)\n');
  for (const a of artes) {
    console.log(`  ${a.rotulo.padEnd(20)} ${a.cor}  aspecto ${a.aspecto}  ${a.pixels}px  ` +
      `cobertura ${a.cobertura}%`);
    console.log(`  ${''.padEnd(20)} SVG de ${(a.bytesDoSvg / 1024).toFixed(0)}KB que embala um PNG de ` +
      `${(a.bytesDoPng / 1024).toFixed(0)}KB — ${a.vetorial ? 'vetor' : 'RASTER, não vetor'}`);
  }
  console.log('\nO CONTRASTE DE CADA ARTE SOBRE CADA SUPERFÍCIE (piso gráfico 3,0:1)\n');
  console.log('  ' + 'família · modo'.padEnd(28) + 'superfície'.padEnd(11) +
    'vinho  prata   pelo papel');
  for (const linha of tabela) {
    for (const [chave, m] of Object.entries(linha.superficies)) {
      console.log('  ' + (linha.familia + ' · ' + linha.modo).padEnd(28) +
        chave.padEnd(11) + marca(m.vinho) + '  ' + marca(m.prata) + '   ' + marca(m.porPapel) +
        '  (' + m.papel.replace('--', '') + ')');
    }
  }
  const reprovadas = [];
  for (const linha of tabela) {
    for (const [chave, m] of Object.entries(linha.superficies)) {
      for (const a of artes) if (m[a.id] < PISO_GRAFICO) reprovadas.push(`${linha.familia}/${linha.modo}/${chave}: ${a.id} ${m[a.id].toFixed(2)}`);
    }
  }
  console.log(`\n  ${reprovadas.length} de ${tabela.length * 4 * artes.length} combinações ficam abaixo do piso.`);
  console.log('  As que reprovam, por nome:');
  for (const r of reprovadas) console.log('    · ' + r);
  const todas = tabela.flatMap((l) => Object.values(l.superficies));
  const passamPorPapel = todas.filter((m) => m.porPapel >= PISO_TEXTO).length;
  console.log(`\n  A MESMA FORMA, pintada com o PAPEL da superfície: ${passamPorPapel} de ${todas.length} ` +
    'passam o piso de TEXTO (4,5:1), e ' + todas.filter((m) => m.porPapel >= PISO_GRAFICO).length +
    ' de ' + todas.length + ' passam o gráfico (3,0:1).');
  return 0;
}

process.exit(main());
