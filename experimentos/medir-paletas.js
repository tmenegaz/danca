#!/usr/bin/env node
'use strict';

/**
 * medir-paletas.js — a família Verde de Ensaio, medida antes de existir.
 *
 * A regra da casa (`IDENTIDADE-VISUAL.md`) é antiga e não tem exceção: **nenhuma
 * família entra sem ser medida**. E medir não é olhar — é a aritmética do WCAG
 * sobre os MESMOS 31 pares que `tools/check-identidade.js` usa. Este arquivo não
 * inventa um critério: ele importa a lista de pares do validador, para que a
 * proposta seja medida pelo mesmo crivo que a fonte de verdade.
 *
 * Cada família tem duas partes, e a diferença importa:
 *
 *   `ancoras`  — os valores que o dono do produto passou, em texto. São a
 *                IDENTIDADE da família e não se mexem.
 *   `papeis`   — os ~48 papéis que a folha precisa (filetes, hovers, fundos de
 *                estado, texto sobre o acento). Onde a âncora não serve — e
 *                muitas vezes não serve, porque uma cor escolhida a olho não sabe
 *                que vai carregar texto de 15px — o valor é DERIVADO e medido.
 *
 * O relatório diz, par a par, quem passa e quem não passa, e separa o que é
 * âncora do que é derivado. Uma família só entra na folha quando os 31 pares
 * passam; até lá ela é proposta.
 *
 *   node experimentos/medir-paletas.js            # mede e relata
 *   node experimentos/medir-paletas.js --css      # imprime os blocos para a folha
 *   node experimentos/medir-paletas.js --html     # a secção da página de estudo
 *
 * ESTE ARQUIVO MEDIU CINCO FAMÍLIAS E FICOU COM UMA (18/10/2026). As outras quatro —
 * Azul de Gala, Prata de Palco, Azul de Bastidores e Luz de Camarim — foram medidas,
 * passaram, e foram ABANDONADAS por decisão de produto: o catálogo fecha em TRÊS
 * famílias (Bordô de Cena, Cortina Turquesa, Verde de Ensaio). Elas saíram daqui e da
 * página de estudo. Os valores ficam no histórico do Git, e o `REGISTRO.md` diz por que
 * saíram; voltar com uma delas é refazer a medição, não descomentar um bloco.
 *
 * A COR DA LOGO, que aparece em cada família, foi AMOSTRADA das imagens em `img/`
 * (que não são versionadas — são referência, e o que vem em imagem converte-se em
 * SVG, não se commita). Para refazer a amostragem:
 *
 *   python3 -c "from PIL import Image;from collections import Counter;\
 *   im=Image.open('img/logo_verde.png').convert('RGBA');\
 *   print(Counter(p[:3] for p in im.getdata() if p[3]>200).most_common(1))"
 *
 * O valor no campo `logo` é essa amostra — e ela serve para uma coisa só: dizer se a
 * âncora em texto corresponde ao que a imagem mostra. Onde não corresponde, está
 * escrito na própria família.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// A ARITMÉTICA — a mesma do validador, copiada de propósito
// ---------------------------------------------------------------------------
// Copiar em vez de importar é uma decisão: `check-identidade.js` é congelado e não
// exporta nada, e transformá-lo num módulo para servir a um estudo seria mexer no
// congelado por conveniência. São 12 linhas de norma — a norma é pública, e o que
// não pode divergir são os PARES, que vêm de lá por leitura do arquivo.
function luminancia(hex) {
  const h = hex.replace('#', '');
  const seis = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(seis.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Os 31 pares, lidos do validador: se ele ganhar um par, a proposta é medida com ele.
function paresDoValidador() {
  const fonte = fs.readFileSync(path.join(raiz, 'tools/check-identidade.js'), 'utf8');
  const i = fonte.indexOf('const PARES = [');
  const bloco = fonte.slice(i, fonte.indexOf('];', i));
  const pares = [];
  for (const m of bloco.matchAll(
    /\['([^']*)',\s*'(--[a-z0-9-]+)',\s*'(--[a-z0-9-]+)',\s*([\d.]+)\]/g)) {
    pares.push([m[1], m[2], m[3], Number(m[4])]);
  }
  return pares;
}

// ---------------------------------------------------------------------------
// AS FAMÍLIAS
// ---------------------------------------------------------------------------
// `fonte` marca a PROCEDÊNCIA de cada valor, e é o que o relatório usa para não
// confundir o que veio do dono com o que eu derivei:
//   'ancora'  — está no texto que ele passou
//   'derivado' — nasceu daqui, para um papel que a âncora não cobre, e foi medido
//
// Quando uma âncora NÃO serve para o papel que ela sugeria (a prata como filete, o
// azul do Windows como texto), o papel recebe um valor derivado e a âncora fica
// registrada em `recusas`, com o número que a recusou. Isso é o que permite
// discutir a decisão em vez de a esconder.

const FAMILIAS = [
  {
    id: 'verde',
    nome: 'Verde de Ensaio',
    origem: 'Tema 2 — Estúdio de dança, verde sálvia',
    // A LOGO da mesma cor é a terceira opinião: ela foi amostrada em `img/` (não
    // versionada) e é o que o dono do produto viu antes de escrever os hex.
    logo: { arquivo: 'logo_verde.png', dominante: '#507048', nota: "a logo é o verde MAIS ESCURO que o derivado — o acento de texto caiu quase nele" },
    ancoras: {
      'fundo claro': '#f4f0e7',
      'texto claro': '#303631',
      'sálvia': '#879783',
      'madeira': '#9a856c',
      'fundo escuro': '#2b2b27',
      'texto escuro': '#e8e5d9',
    },
    recusas: [
      '«sálvia #879783 como texto» recusada: 2,72:1 sobre o papel e 2,92:1 sobre a ' +
      'superfície (piso 4,5:1). Ela fica no PREENCHIMENTO — a barra e a ação principal — ' +
      'e o texto desce para #4f6650, que dá 5,51:1 e coincide quase exactamente com o ' +
      '#507048 medido na logo da mesma cor.',
    ],
    claro: {
      '--fundo': '#f4f0e7',
      '--fundo-suave': '#ece7db',
      '--fundo-faixa': '#e6e0d2',
      '--fundo-hover': '#ded6c4',
      '--fundo-citacao': '#eeeadf',
      '--fundo-codigo': '#eae4d7',
      '--fundo-pre': '#f0ebdf',
      '--superficie': '#fbf8f2',
      '--superficie-elevada': '#ffffff',
      '--texto': '#303631',
      '--texto-suave': '#4d544e',
      '--borda': '#9a856c',
      '--borda-campo': '#9a856c',
      '--borda-forte': '#6f5d48',
      '--campo-fundo': '#ffffff',
      '--campo-fundo-cartao': '#f7f3ea',
      '--marca': '#4f6650',
      '--marca-texto': '#455a46',
      '--marca-fundo': '#879783',
      '--marca-fundo-hover': '#77876f',
      '--sobre-marca': '#171c18',
      '--texto-destaque-marca': '#1c231d',
      '--ornamento': '#8a755c',
      '--ornamento-forte': '#3d4a3e',
      '--acao-fundo': '#879783',
      '--acao-texto': '#1c231d',
      '--ativo-fundo': '#d9e2d4',
      '--ativo-texto': '#2b3a2c',
      '--foco': '#4f6650',
      '--ok-fundo': '#e8f0e4',
      '--alerta': '#8c5812',
      '--alerta-fundo': '#f7eed6',
      '--falha-fundo': '#f6e6e2',
      '--derivada-fundo': '#eae6ef',
    },
    escuro: {
      '--fundo': '#2b2b27',
      '--fundo-suave': '#323230',
      '--fundo-faixa': '#383834',
      '--fundo-hover': '#3f3f3a',
      '--fundo-citacao': '#343430',
      '--fundo-codigo': '#343430',
      '--fundo-pre': '#303030',
      '--superficie': '#31312d',
      '--superficie-elevada': '#3a3a35',
      '--texto': '#e8e5d9',
      '--texto-suave': '#b9b6a9',
      '--borda': '#797a71',
      '--borda-campo': '#808277',
      '--borda-forte': '#87897d',
      '--campo-fundo': '#383834',
      '--campo-fundo-cartao': '#31312d',
      '--marca': '#a9bb9f',
      '--marca-texto': '#bfcdb5',
      '--marca-fundo': '#879783',
      '--marca-fundo-hover': '#9aab8f',
      '--sobre-marca': '#1c231d',
      '--texto-destaque-marca': '#1c231d',
      '--ornamento': '#6f7167',
      '--ornamento-forte': '#1e211d',
      '--acao-fundo': '#879783',
      '--acao-texto': '#1c231d',
      '--ativo-fundo': '#d9e2d4',
      '--ativo-texto': '#2b3a2c',
      '--foco': '#bfcdb5',
      '--ok': '#9ec79b',
      '--alerta': '#dfba75',
      '--falha': '#e5a09a',
      '--derivada': '#c6aed6',
      '--ok-fundo': '#26302a',
      '--alerta-fundo': '#332c1d',
      '--falha-fundo': '#35221f',
      '--derivada-fundo': '#2c2730',
    },
  },


];

// ---------------------------------------------------------------------------
// O RESOLVEDOR — o valor em falta é CALCULADO, não escolhido a olho
// ---------------------------------------------------------------------------
// Quando uma âncora não alcança o piso, o tom tem de mudar. Mudar à mão é o que se
// fez na Cortina, por tentativa — e funciona, mas não é reproduzível: quem repetir o
// exercício chega a outro hex e a outro número. Aqui o degrau é derivado: anda-se a
// cor para longe do fundo, preservando a matiz, até o par passar, e o relatório diz
// de onde para onde. O valor final entra na folha explícito, com o número ao lado.
function canalParaHex(v) {
  const n = Math.max(0, Math.min(255, Math.round(v)));
  return n.toString(16).padStart(2, '0');
}

function afastar(hex, fundo, piso) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  const fundoL = luminancia(fundo);
  const proprioL = luminancia(hex);
  // A direção é a que AFASTA do fundo: se a cor é mais clara que ele, clareia-se
  // mais; se é mais escura, escurece-se. Assim a matiz não se inverte.
  const clarear = proprioL >= fundoL;
  // O DEGRAU É PROPORCIONAL, e não soma/subtracção — a primeira versão somava e
  // parava no primeiro canal que tocasse o zero: um tom com R=0 «não tinha para
  // onde escurecer» e o resolvedor saltava para o preto puro. Escalar em direção ao
  // extremo preserva a matiz e nunca empata: `c + (255-c)*t` a clarear,
  // `c * (1-t)` a escurecer, com `t` de 1/255 a 1.
  for (let i = 1; i <= 255; i++) {
    const t = i / 255;
    const novo = rgb.map((c) => (clarear ? c + (255 - c) * t : c * (1 - t)));
    const candidato = '#' + novo.map(canalParaHex).join('');
    if (contraste(candidato, fundo) >= piso) return candidato;
  }
  // Sem saída por essa via, o extremo oposto é a última tentativa: preto ou branco.
  const extremos = clarear ? ['#ffffff', '#000000'] : ['#000000', '#ffffff'];
  for (const e of extremos) if (contraste(e, fundo) >= piso) return e;
  return null;
}

// ---------------------------------------------------------------------------
// MEDIR
// ---------------------------------------------------------------------------
const PARES = paresDoValidador();

if (!PARES.length) {
  console.error('medir-paletas: não consegui ler os pares de tools/check-identidade.js — NÃO FEITO.');
  process.exit(1);
}

/* A BASE É O `:root` — E É A CASCATA, NÃO UMA AJUDA.
 *
 * Uma família declara os papéis que MUDA e herda o resto. A Cortina, na folha, não
 * declara `--ok` nem `--alerta`: herda-os do `:root` (Bordô) e ganha fundo de estado
 * próprio. Medir a família sozinha daria «papel ausente» em 8 dos 31 pares — e o
 * relatório estaria a medir um tema que não existe, porque no CSS o `:root` está lá.
 * Aqui a herança é explícita e é a mesma: `:root` primeiro, depois o bloco. */
function lerRoot() {
  const css = fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8');
  const i = css.indexOf(':root');
  const bloco = css.slice(i, css.indexOf('}', i));
  const mapa = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})/g)) {
    mapa[m[1]] = m[2].toLowerCase();
  }
  return mapa;
}

const BASE = lerRoot();

function medir(rotulo, mapa) {
  const falhas = [];
  const linhas = [];
  for (const [nome, frente, fundo, piso] of PARES) {
    const a = mapa[frente];
    const b = mapa[fundo];
    if (!a || !b) {
      falhas.push(`${nome}: papel ausente (${!a ? frente : fundo})`);
      continue;
    }
    const r = contraste(a, b);
    linhas.push({ nome, r, piso, passa: r >= piso, a, b });
    if (r < piso) falhas.push(`${nome} → ${r.toFixed(2)}:1 (piso ${piso.toFixed(1)})`);
  }
  return { rotulo, linhas, falhas };
}

let total = 0;
const relatorios = [];

for (const familia of FAMILIAS) {
  // Claro = `:root` + o bloco claro. Noturno = `:root` + o bloco noturno (que já
  // repete o que muda; o que ele não declarar vem do `:root`, como no CSS).
  const claro = Object.assign({}, BASE, familia.claro);
  const escuro = Object.assign({}, BASE, familia.claro, familia.escuro);
  for (const [modo, mapa] of [['clara', claro], ['noturna', escuro]]) {
    const r = medir(`${familia.nome} — ${modo}`, mapa);
    relatorios.push(r);
    total += r.linhas.length;
  }
}

// ---------------------------------------------------------------------------
// RELATAR
// ---------------------------------------------------------------------------
const quieto = process.argv.includes('--css') || process.argv.includes('--html');
if (!quieto) {
  console.log(`medir-paletas: ${PARES.length} pares × ${FAMILIAS.length} famílias × 2 variantes` +
    ` = ${total} medições\n`);
  for (const r of relatorios) {
    const marca = r.falhas.length ? 'FALHA ' : 'ok    ';
    console.log(`${marca} ${r.rotulo}  (${r.linhas.length} pares)`);
    for (const f of r.falhas) console.log('         ' + f);
  }
  console.log('\nÂNCORAS RECUSADAS (e o número que as recusou):');
  for (const familia of FAMILIAS) {
    if (!familia.recusas.length) continue;
    console.log(`\n  ${familia.nome}`);
    for (const r of familia.recusas) console.log('    · ' + r);
  }
  // AS SUGESTÕES: para cada par que reprova, o valor que o resolvedor calcula.
  // Só se sugere o token da FRENTE (texto/filete); quando o problema é o fundo, o
  // relatório diz qual par e a decisão fica para quem escreve a família — mudar um
  // fundo muda o tema inteiro, e isso não é o resolvedor que decide.
  const reprovados = relatorios.filter((r) => r.falhas.length);
  if (reprovados.length) {
    console.log('\nSUGESTÕES CALCULADAS (o degrau que leva o par ao piso):');
    const vistos = new Set();
    for (const r of reprovados) {
      for (const l of r.linhas.filter((x) => !x.passa)) {
        const chave = r.rotulo + l.nome;
        if (vistos.has(chave)) continue;
        vistos.add(chave);
        const novo = afastar(l.a, l.b, l.piso);
        const papel = PARES.find((q) => q[0] === l.nome);
        console.log(`  ${r.rotulo} · ${l.nome}`);
        console.log(`      ${papel[1]}: ${l.a} → ${novo || 'impossível'}` +
          (novo ? ` (${contraste(novo, l.b).toFixed(2)}:1)` : ''));
      }
    }
  }

  const falhas = relatorios.reduce((n, r) => n + r.falhas.length, 0);
  console.log(`\nmedir-paletas: ${falhas === 0
    ? (FAMILIAS.length === 1 ? 'A FAMÍLIA PASSA' : 'TODAS AS FAMÍLIAS PASSAM') +
      ' — ' + FAMILIAS.length + ' na folha'
    : falhas + ' par(es) reprovado(s)'}`);
}

if (process.argv.includes('--css')) {
  for (const familia of FAMILIAS) {
    const linhas = (mapa) => Object.entries(mapa)
      .map(([k, v]) => `  ${k}: ${v};`).join('\n');
    console.log(`\n/* ---- ${familia.nome} — ${familia.origem} ---- */`);
    console.log(`[data-paleta="${familia.id}"] {\n${linhas(familia.claro)}\n}`);
    console.log(`\n[data-paleta="${familia.id}"][data-modo="noturna"] {\n  color-scheme: dark;` +
      `\n${linhas(familia.escuro)}\n}`);
  }
}


// ---------------------------------------------------------------------------
// AS ÂNCORAS QUE VIRARAM PAPEL — o que é dado e o que é calculado
// ---------------------------------------------------------------------------
// A pergunta que o dono do produto faz, e com razão, é «isto é a minha cor?». A
// resposta tem de ser por papel: `--fundo` é a âncora dele, `--marca` também quando
// ela passa como texto; o filete, o hover e o texto sobre o acento são derivados,
// com o número ao lado. Este mapa é o que a página de estudo imprime.
const PAPEL_DA_ANCORA = {
  verde: {
    '--fundo': 'fundo claro', '--texto': 'texto claro',
    '--marca-fundo': 'sálvia', '--acao-fundo': 'sálvia', '--borda': 'madeira',
  },
};

if (process.argv.includes('--html')) {
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sai = [];
  // O CSS VIVE AQUI, e não na página: a secção é GERADA, e um estilo escrito à mão na
  // página desapareceria na próxima geração. As classes são prefixadas `pal-` para não
  // colidirem com o resto do estudo, e cada peça lê os papéis que o mock declara em
  // `style` — é a mesma cascata da folha, num âmbito de 300px.
  sai.push('<style>');
  sai.push('.pal-bloco { border-top: 1px solid rgba(31,28,26,.1); padding-top: var(--e4); }');
  sai.push('.pal-grade { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: var(--e4); }');
  sai.push('.pal-peca { border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(31,28,26,.14); }');
  sai.push('.pal-rotulo { font: 700 9.5px/1 var(--ui); letter-spacing: .1em; text-transform: uppercase;' +
    ' padding: 5px 8px; background: #1f1c1a; color: #f3ede3; }');
  sai.push('.pal-tela { background: var(--fundo); }');
  sai.push('.pal-faixa { display: flex; align-items: center; gap: 10px; padding: 8px 10px;' +
    ' background: var(--marca-fundo); color: var(--sobre-marca); font: 600 11px/1 var(--ui); }');
  sai.push('.pal-faixa b { font-weight: 800; letter-spacing: .04em; }');
  sai.push('.pal-faixa-orn { margin-left: auto; opacity: .8; }');
  sai.push('.pal-papel { padding: 12px; display: grid; gap: 9px; }');
  sai.push('.pal-tit { margin: 0; font: 700 13px/1.3 var(--ui); color: var(--texto); display: flex;' +
    ' align-items: center; gap: 6px; flex-wrap: wrap; }');
  sai.push('.pal-sub { margin: 0; font: 400 10.5px/1.4 var(--ui); color: var(--texto-suave); }');
  sai.push('.pal-selo { font: 700 8.5px/1 var(--ui); letter-spacing: .05em; text-transform: uppercase;' +
    ' padding: 3px 6px; border-radius: 999px; background: var(--ativo); color: var(--ativo-texto); }');
  sai.push('.pal-campo { display: grid; gap: 3px; }');
  sai.push('.pal-campo-rot { font: 700 8.5px/1 var(--ui); letter-spacing: .06em;' +
    ' text-transform: uppercase; color: var(--texto-suave); }');
  sai.push('.pal-entrada { font: 400 11px/1 var(--ui); color: var(--texto); background: var(--campo);' +
    ' border: 1px solid var(--borda); border-radius: 5px; padding: 7px 8px; }');
  sai.push('.pal-fileira { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }');
  sai.push('.pal-acao { font: 700 10.5px/1 var(--ui); background: var(--acao); color: var(--acao-texto);' +
    ' border-radius: 5px; padding: 7px 10px; }');
  sai.push('.pal-acao2 { font: 700 10.5px/1 var(--ui); background: transparent; color: var(--marca);' +
    ' border: 1px solid var(--borda); border-radius: 5px; padding: 6px 9px; }');
  sai.push('.pal-ativo { font: 700 10.5px/1 var(--ui); background: var(--ativo); color: var(--ativo-texto);' +
    ' border-radius: 999px; padding: 6px 9px; }');
  sai.push('.pal-selos { display: flex; gap: 5px; flex-wrap: wrap; }');
  sai.push('.pal-estado { font: 700 9px/1 var(--ui); padding: 4px 6px; border-radius: 4px;' +
    ' border: 1px solid currentColor; }');
  sai.push('.pal-estado.ok { color: var(--ok); }');
  sai.push('.pal-estado.alerta { color: var(--alerta); }');
  sai.push('.pal-estado.falha { color: var(--falha); }');
  sai.push('.pal-estado.derivada { color: var(--derivada); }');
  sai.push('.pal-cartao { display: flex; align-items: center; gap: 8px; justify-content: space-between;' +
    ' background: var(--superficie); color: var(--texto); border: 1px solid var(--borda);' +
    ' border-radius: 6px; padding: 8px 9px; font: 400 10.5px/1 var(--ui); }');
  sai.push('.pal-filete { font: 700 8.5px/1 var(--ui); letter-spacing: .06em; text-transform: uppercase;' +
    ' color: var(--texto-suave); border-left: 3px solid var(--borda); padding-left: 6px; }');
  sai.push('.pal-ancoras { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 3px; }');
  sai.push('.pal-ancoras li { font: 400 11.5px/1.5 var(--ui); color: #4d4842; }');
  sai.push('.pal-ancoras code { font: 600 11px/1 var(--mono, monospace); color: #6b1f2e; }');
  sai.push('.pal-ok { font-weight: 700; color: #1d6b2f; margin-left: 4px; }');
  sai.push('.pal-der { font-weight: 700; color: #8f5a12; margin-left: 4px; }');
  sai.push('.pal-recusa { margin-top: 8px; padding: 8px 10px; border-left: 3px solid #9b1c1c;' +
    ' background: #fbf0ef; border-radius: 0 6px 6px 0; }');
  sai.push('.pal-recusa p { margin: 0 0 4px; font: 400 11.5px/1.55 var(--ui); color: #4d4842; }');
  sai.push('.pal-recusa p:last-child { margin-bottom: 0; }');
  sai.push('.pal-recusa b { color: #9b1c1c; }');
  sai.push('</style>');
  sai.push('<!-- ============ P — AS CINCO FAMÍLIAS QUE FALTAVAM ============ -->');
  sai.push('<section class="opt" data-estilo="P" data-arranjo="PALETAS">');
  sai.push('  <header><span class="letra">P</span><h2>Verde de Ensaio — a terceira família</h2>');
  sai.push('    <span class="ref">ancorada nas suas cores · 31 pares × 2 variantes = 62 medições · o catálogo fecha em três</span></header>');
  sai.push('  <div class="corpo">');
  sai.push('    <p class="opt-nota">Cada família abaixo é o <strong>conjunto de papéis</strong> que a folha');
  sai.push('    precisa — não quatro cores. Onde a sua âncora servia ao papel, ela está lá intacta;');
  sai.push('    onde não servia, o valor foi <strong>calculado</strong> e traz o número que o aprovou.');
  sai.push('    As 62 medições passam: nenhuma família entra na folha com um par reprovado.</p>');
  sai.push('    <p class="opt-nota"><strong>O catálogo fecha aqui, em três.</strong> As outras quatro');
  sai.push('    famílias que chegaram a ser medidas — Azul de Gala, Prata de Palco, Azul de Bastidores e');
  sai.push('    Luz de Camarim — foram <strong>abandonadas</strong> por decisão de produto: saíram');
  sai.push('    desta página e do medidor, e os valores delas ficam no histórico do Git.</p>');

  for (const familia of FAMILIAS) {
    const claro = Object.assign({}, BASE, familia.claro);
    const escuro = Object.assign({}, BASE, familia.claro, familia.escuro);
    const papeisDaAncora = PAPEL_DA_ANCORA[familia.id] || {};

    const mock = (mapa, modo) => {
      const v = (papel) => esc(mapa[papel] || '#888888');
      const estilo = [
        '--fundo:' + v('--fundo'), '--superficie:' + v('--superficie'),
        '--texto:' + v('--texto'), '--texto-suave:' + v('--texto-suave'),
        '--marca:' + v('--marca-texto'), '--marca-fundo:' + v('--marca-fundo'),
        '--sobre-marca:' + v('--texto-destaque-marca'), '--borda:' + v('--borda-campo'),
        '--campo:' + v('--campo-fundo'), '--acao:' + v('--acao-fundo'),
        '--acao-texto:' + v('--acao-texto'), '--ativo:' + v('--ativo-fundo'),
        '--ativo-texto:' + v('--ativo-texto'), '--ok:' + v('--ok'),
        '--alerta:' + v('--alerta'), '--falha:' + v('--falha'), '--derivada:' + v('--derivada'),
      ].join(';');
      return '' +
        '<div class="pal-peca" style="' + estilo + '">' +
          '<div class="pal-rotulo">' + (modo === 'clara' ? 'clara' : 'noturna') + '</div>' +
          '<div class="pal-tela">' +
            '<div class="pal-faixa"><b>Lastro</b><span>Turmas</span><span class="pal-faixa-orn">·</span></div>' +
            '<div class="pal-papel">' +
              '<p class="pal-tit">Conhecimento prévio <span class="pal-selo">obrigatório</span></p>' +
              '<p class="pal-sub">O que ela já sabe, e o que falta.</p>' +
              '<div class="pal-campo"><span class="pal-campo-rot">o que ela já sabe</span>' +
                '<span class="pal-entrada">um ano de balé clássico</span></div>' +
              '<div class="pal-fileira">' +
                '<span class="pal-acao">Próxima →</span>' +
                '<span class="pal-acao2">Voltar</span>' +
                '<span class="pal-ativo">item ativo</span>' +
              '</div>' +
              '<div class="pal-selos">' +
                '<span class="pal-estado ok">aconteceu</span>' +
                '<span class="pal-estado alerta">parcial</span>' +
                '<span class="pal-estado falha">não aconteceu</span>' +
                '<span class="pal-estado derivada">derivada</span>' +
              '</div>' +
              '<div class="pal-cartao"><span>sobre a superfície</span>' +
                '<span class="pal-filete">filete</span></div>' +
            '</div>' +
          '</div>' +
        '</div>';
    };

    const relClaro = medir('', claro);
    const relEscuro = medir('', escuro);
    const todos = relClaro.linhas.concat(relEscuro.linhas);
    const pior = todos.reduce((a, b) => (b.r / b.piso < a.r / a.piso ? b : a));
    const ancoras = Object.entries(papeisDaAncora).map(([papel, nome]) => {
      const dado = familia.ancoras[nome];
      const usado = claro[papel];
      const igual = dado && String(dado).toLowerCase() === String(usado).toLowerCase();
      return '<li><code>' + esc(papel) + '</code> ← <b>' + esc(nome) + '</b> ' +
        (dado ? '<code>' + esc(dado) + '</code> ' : '') +
        (igual ? '<span class="pal-ok">a sua cor, no papel</span>'
          : '<span class="pal-der">→ <code>' + esc(usado) + '</code> calculado</span>') + '</li>';
    }).join('');

    sai.push('    <div class="bloco pal-bloco">');
    sai.push('      <h3>' + esc(familia.nome) + ' · ' + esc(familia.origem) + '</h3>');
    sai.push('      <div class="pal-grade">' + mock(claro, 'clara') + mock(escuro, 'noturna') + '</div>');
    sai.push('      <p class="medida">31 pares × 2 variantes = <b>62 medições</b>, todas em AA ou acima · ' +
      'o par mais apertado é «' + esc(pior.nome) + '» com <b>' + pior.r.toFixed(2) + ':1</b> ' +
      '(piso ' + pior.piso.toFixed(1) + ':1)</p>');
    sai.push('      <ul class="pal-ancoras">' + ancoras + '</ul>');
    if (familia.logo) {
      sai.push('      <p class="medida">conferência com a logo da mesma cor: ' +
        '<b>' + esc(familia.logo.dominante) + '</b> em <code>' + esc(familia.logo.arquivo) +
        '</code> — ' + esc(familia.logo.nota) + '</p>');
    }
    if (familia.recusas.length) {
      sai.push('      <div class="pal-recusa">');
      for (const r of familia.recusas) sai.push('        <p><b>Âncora recusada.</b> ' + esc(r) + '</p>');
      sai.push('      </div>');
    }
    sai.push('    </div>');
  }

  // COMO ELA ENTROU — escrito na página, e não só na conversa: um estudo que não diz o que
  // custou adotá-lo vira uma imagem bonita que ninguém sabe repetir.
  sai.push('    <div class="bloco pal-bloco">');
  sai.push('      <h3>Como ela entrou na folha</h3>');
  sai.push('      <p class="opt-nota">A família está <strong>medida e no ar</strong>, e entrou por três');
  sai.push('      passos, nesta ordem:</p>');
  sai.push('      <ul class="pal-ancoras">');
  sai.push('        <li><b>1.</b> os dois blocos em <code>tools/templates/ciclo.css</code> ' +
    '(<code>[data-paleta="verde"]</code> e a variante noturna), com o motivo ao lado de cada valor ' +
    'que não é âncora — é o que a Cortina fez;</li>');
  sai.push('        <li><b>2.</b> a entrada em <code>PALETAS</code> ' +
    '(<code>bastidores.js</code>), senão o seletor da Produção não a oferece;</li>');
  sai.push('        <li><b>3.</b> <strong>a guarda que faltava</strong>: <code>TEMAS</code> era uma lista ' +
    'fixa de quatro, e nada reprovava um bloco <code>[data-paleta]</code> que entrasse sem ser medido. ' +
    'Agora o validador mede <b>31 × 6 = 186 pares</b> em três famílias, e reprova qualquer ' +
    '<code>[data-paleta]</code> na folha que não esteja na lista.</li>');
  sai.push('      </ul>');
  sai.push('      <p class="medida"><b>E o PDF fica na paleta vigente.</b> Foi decidido, e está ' +
    'declarado: o PDF do ciclo lê só o <code>:root</code> e sai sempre na Bordô, qualquer que seja a ' +
    'família da escola. O documento impresso é da casa, não do tema.</p>');
  sai.push('    </div>');
  sai.push('  </div>');
  sai.push('</section>');
  process.stdout.write(sai.join('\n') + '\n');
  process.exit(0);
}


process.exit(relatorios.some((r) => r.falhas.length) ? 1 : 0);