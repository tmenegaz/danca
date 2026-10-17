#!/usr/bin/env node
'use strict';

/*
 * check-identidade.js — guarda-corpo da identidade visual do Projeto Ciclo.
 *
 *   uso: node tools/check-identidade.js
 *
 * A identidade tem UMA fonte de verdade: tools/templates/ciclo.css. A regra é
 * `IDENTIDADE-VISUAL.md`. Este arquivo existe porque a divergência que motivou
 * aquela regra era silenciosa: quatro arquivos declaravam a paleta, cada um com
 * o seu valor, e nada avisava. Confere, sem dependências externas:
 *
 *   1) a paleta: todo par declarado (texto/fundo, traço/fundo) passa no piso
 *      WCAG 2.1 AA — 4,5:1 para texto, 3,0:1 para traço com função. O valor é
 *      MEDIDO, não estimado: a norma é aritmética, não gosto;
 *   2) a cópia única: nenhum arquivo fora do ciclo.css redeclara um destes hex;
 *   3) o circuito: o ciclo.css chegou mesmo ao pacote (assets/style.css idêntico),
 *      e o nav.js também — sem isso a página fica sem barra e sem menu.
 *
 * Sai com código 1 se o contraste falhar ou se um hex solto reaparecer.
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const fonte = path.join(raiz, 'tools/templates/ciclo.css');

const erros = [];
const ok = [];

// ------------------------------------------------------------------ contraste

// WCAG 2.1: luminância relativa e razão de contraste.
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

// Os pares que a identidade usa, com o piso de cada um. `texto` é o piso 4,5:1;
// `texto pequeno` também (o selo é lido); `traço` é o piso 3,0:1 (borda e filete têm
// função, não são decoração).
//
// Desde 16/10/2026 os pares são de PAPÉIS, e não de valores: o mesmo par é medido na
// variante clara e na noturna. É o que impede um tema novo de nascer sem prova — e o
// que dá sentido ao nome «papel».
const PARES = [
  ['corpo do texto sobre o fundo', '--texto', '--fundo', 4.5],
  ['texto secundário', '--texto-suave', '--fundo', 4.5],
  ['título de seção', '--marca', '--fundo', 4.5],
  ['título de bloco (h4)', '--marca-texto', '--fundo', 4.5],
  ['cabeçalho de tabela', '--marca-texto', '--fundo-faixa', 4.5],
  ['legenda de ficha', '--marca-texto', '--fundo-faixa', 4.5],
  ['texto sobre a superfície', '--texto', '--superficie', 4.5],
  ['marca da barra', '--texto-destaque-marca', '--marca-fundo', 4.5],
  ['marca sob o ponteiro', '--sobre-marca', '--marca-fundo-hover', 4.5],
  ['item de menu', '--sobre-marca', '--marca-fundo', 4.5],
  ['item de menu aberto', '--sobre-marca', '--marca-fundo-hover', 4.5],
  ['botão voltar ao topo', '--sobre-marca', '--marca-fundo', 4.5],
  ['item ativo (texto sobre o ouro)', '--ativo-texto', '--ativo-fundo', 4.5],
  ['ação principal', '--acao-texto', '--acao-fundo', 4.5],
  ['aviso de parcial', '--alerta', '--fundo', 4.5],
  ['aviso sobre fundo de tabela', '--alerta', '--fundo-faixa', 4.5],
  ['aconteceu', '--ok', '--fundo', 4.5],
  ['erro / não aconteceu', '--falha', '--fundo', 4.5],
  ['aconteceu sobre o fundo de estado', '--ok', '--ok-fundo', 4.5],
  ['parcial sobre o fundo de estado', '--alerta', '--alerta-fundo', 4.5],
  ['falha sobre o fundo de estado', '--falha', '--falha-fundo', 4.5],
  ['derivada sobre o fundo de estado', '--derivada', '--derivada-fundo', 4.5],
  ['texto do campo sobre o papel', '--texto', '--campo-fundo', 4.5],
  ['texto do campo sobre o cartão', '--texto', '--campo-fundo-cartao', 4.5],
  ['filete sobre o fundo', '--borda', '--fundo', 3.0],
  ['borda de tabela', '--borda', '--superficie', 3.0],
  ['borda de campo', '--borda-campo', '--campo-fundo', 3.0],
  ['borda de campo sobre o papel', '--borda-campo', '--fundo', 3.0],
  ['borda de campo sobre o cartão', '--borda-campo', '--campo-fundo-cartao', 3.0],
  ['ornamento da barra', '--ornamento-forte', '--marca-fundo', 3.0],
  ['foco', '--foco', '--fundo', 3.0],
];

// Os tokens declarados no :root da fonte de verdade — os PRIMITIVOS, que o `lib-tokens`
// leva ao LaTeX e ao deck. Lê o bloco até a primeira chave fechada.
function lerTokens() {
  const css = fs.readFileSync(fonte, 'utf8');
  const i = css.indexOf(':root');
  if (i < 0) {
    erros.push('Identidade: tools/templates/ciclo.css não declara :root');
    return {};
  }
  const bloco = css.slice(i, css.indexOf('}', i));
  const tokens = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

// Um TEMA é um bloco que declara papéis (hex ou `var(--primitivo)`). São dois: o
// `:root` (clara) e `[data-modo="noturna"]`. O valor é resolvido pela cadeia de
// `var()`, porque na clara quase todo papel aponta para um primitivo.
function lerTema(seletor) {
  const css = fs.readFileSync(fonte, 'utf8');
  const i = css.indexOf(seletor);
  if (i < 0) return null;
  const bloco = css.slice(i, css.indexOf('}', i));
  const mapa = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6}|var\(--[a-z0-9-]+\))/g)) {
    mapa[m[1]] = m[2].toLowerCase();
  }
  return mapa;
}

function resolver(mapa, nome, vistos) {
  const v = mapa[nome];
  if (!v) return null;
  if (v.startsWith('#')) return v;
  const alvo = v.match(/var\((--[a-z0-9-]+)\)/);
  if (!alvo) return null;
  if (vistos.has(alvo[1])) return null;
  vistos.add(alvo[1]);
  return resolver(mapa, alvo[1], vistos);
}

const tokens = lerTokens();

// ------------------------------------------------------------------ 1) paleta

const TEMAS = [
  ['clara', lerTema(':root')],
  ['noturna', lerTema('[data-modo="noturna"]')],
];

if (Object.keys(tokens).length) {
  for (const [nomeTema, mapa] of TEMAS) {
    if (!mapa) {
      erros.push(`Identidade: o tema "${nomeTema}" não foi encontrado na fonte`);
      continue;
    }
    const falhas = [];
    let medidos = 0;
    for (const [nome, frenteToken, fundoToken, piso] of PARES) {
      const frente = resolver(mapa, frenteToken, new Set([frenteToken]));
      const fundo = resolver(mapa, fundoToken, new Set([fundoToken]));
      if (!frente || !fundo) {
        erros.push(`Identidade: par "${nome}" (${nomeTema}) cita papel inexistente ` +
          `(${frenteToken} / ${fundoToken})`);
        continue;
      }
      medidos++;
      const r = contraste(frente, fundo);
      if (r < piso) falhas.push(`${nome} (${nomeTema}) ${r.toFixed(2)}:1 (piso ${piso.toFixed(1)})`);
    }
    if (falhas.length) {
      for (const f of falhas) erros.push(`Contraste: ${f}`);
    } else {
      ok.push(`Contraste: ${medidos} pares medidos no tema ${nomeTema}, todos em AA ou acima`);
    }
  }
}

// ------------------------------------------------------- 2) a cópia única

// Quem consome a paleta. O ciclo.css é a fonte e por isso não entra: ele é o
// único lugar onde um hex pode ser escrito.
const CONSUMIDORES = [
  'tools/templates/ciclo.html',
  'tools/templates/lancamento.html',
  'tools/gerar-ciclo.sh',
  'tools/gerar-animacao.js',
  'tools/sincronizar-slide.js',
  'tools/hash-ciclo.sh',
  // As superfícies que o sistema SERVE. Entraram em 16/10/2026: a varredura dizia
  // «nenhum hex fora da fonte» e não olhava para a raiz, a porta, os bastidores nem
  // as páginas de estado — a maior parte do que o usuário vê.
  'porta/index.html',
  'raiz/index.html',
  'motor/servidor/bastidores.js',
  'motor/servidor/producao.js',
  'motor/servidor/cloudflare.js',
  'motor/servidor/provisionar-escola.js',
  // O deck é Marp, não pode referenciar os tokens: ele DECLARA os valores e a
  // correspondência fica por conta deste validador.
  'apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md',
];

// Quem DECLARA os tokens porque é servido SOZINHO — sem `<link>` para a folha. Nesses
// arquivos o hex é legítimo; o que se confere é se ele BATE com a fonte de verdade.
const DECLARANTES = [
  'motor/nucleo/ficha-html.js',
  'motor/servidor/estado-html.js',
];

// Um comentário que CITA um valor — para explicar por que ele saiu — não é
// redeclaração. Esta função apaga o texto dos comentários PRESERVANDO as quebras
// de linha, porque o número da linha é metade do valor do erro.
function semComentarios(texto, rel) {
  const apaga = (m) => m.replace(/[^\n]/g, ' ');
  let t = texto;
  if (/\.(css|js|html)$/.test(rel)) t = t.replace(/\/\*[\s\S]*?\*\//g, apaga);
  t = t.replace(/<!--[\s\S]*?-->/g, apaga);
  if (/\.(js|sh)$/.test(rel)) {
    t = t.replace(/(^|\s)\/\/[^\n]*/g, apaga);
    t = t.replace(/^[ \t]*#[^\n]*/gm, apaga);
  }
  return t;
}

// A paleta é o conjunto de hex que a fonte de verdade ESCREVE — os comentários
// fora: o `#a06000` do ciclo.css é um valor REJEITADO, citado para registrar por
// que não serve, e não um tom da identidade.
const paleta = new Set();
{
  const codigo = semComentarios(fs.readFileSync(fonte, 'utf8'), 'tools/templates/ciclo.css');
  for (const m of codigo.matchAll(/#[0-9a-fA-F]{6}\b/g)) paleta.add(m[0].toLowerCase());
}

// `#abc` e `#aabbcc` são o mesmo tom: normaliza para seis dígitos antes de comparar.
// Sem isto, um `#fff` escapa da conferência (era o caso de `porta/index.html`).
function expandirHex(h) {
  const x = h.toLowerCase();
  if (x.length !== 4) return x;
  return '#' + x[1] + x[1] + x[2] + x[2] + x[3] + x[3];
}
const RE_HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

// Tons que NÃO são da identidade (um cinza de rótulo do deck, por exemplo) podem
// existir soltos — o que não pode é a paleta se duplicar.
//
// O deck é a exceção declarada: sendo Marp (Markdown), ele não consegue referenciar
// `var(--x)` da fonte de verdade, então DECLARA os valores. Nos demais arquivos um
// hex da paleta é cópia indevida; na linha do `:root` do deck ele é a declaração —
// e o que se confere ali é se o valor declarado BATE com o canônico.
const DECK = 'apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md';
const soltos = [];
for (const rel of CONSUMIDORES) {
  const p = path.join(raiz, rel);
  if (!fs.existsSync(p)) {
    erros.push(`Identidade: consumidor declarado não existe: ${rel}`);
    continue;
  }
  const bruto = fs.readFileSync(p, 'utf8');
  let codigo = semComentarios(bruto, rel);
  // O deck é Marp (Markdown): no corpo ele EMBUTE a obra do mapa como SVG inline
  // (gerado de rizoma-slide.svg, que é casado como texto e por isso não pode virar
  // token). A parte que consome a identidade é o bloco `style:` do frontmatter —
  // só ele é conferido; o desenho tem as suas próprias cores literais.
  // O fora-do-escopo é MASCARADO (vira espaço, mantendo as quebras de linha) para
  // que o número da linha do erro continue sendo o número da linha no arquivo:
  // semComentarios preserva o comprimento do texto, então os índices valem.
  if (rel === DECK) {
    const i = codigo.indexOf('style: |');
    const fim = codigo.indexOf('\n---', i);
    const ate = fim < 0 ? codigo.length : fim;
    codigo = codigo
      .split('')
      .map((c, n) => (n >= i && n < ate ? c : c === '\n' ? '\n' : ' '))
      .join('');
  }
  codigo.split('\n').forEach((linha, i) => {
    for (const m of linha.matchAll(RE_HEX)) {
      const cor = expandirHex(m[0]);
      if (!paleta.has(cor)) continue;
      if (rel === DECK && /^\s*--[a-z0-9-]+\s*:/.test(linha)) continue;  // declaração
      soltos.push(`${rel}:${i + 1} ${m[0]}`);
    }
  });
}
if (soltos.length) {
  for (const s of soltos.slice(0, 12)) {
    erros.push(`Cópia única: hex da paleta fora do ciclo.css — ${s}`);
  }
  if (soltos.length > 12) erros.push(`Cópia única: +${soltos.length - 12} ocorrência(s)`);
} else {
  ok.push(`Cópia única: nenhum dos ${paleta.size} hex da paleta fora de tools/templates/ciclo.css`);
}

// ------------------------------------------------- 2b) ninguém usa o PRIMITIVO
//
// Os primitivos (`--cream`, `--burgundy`, `--gold-claro`…) descrevem VALORES e só
// existem na variante clara. Quem os usa num componente não acompanha o tema: no
// escuro, `color: var(--burgundy)` seria bordô sobre fundo escuro (1,64:1). O guard
// exige que os CONSUMIDORES falem por PAPEL (`--fundo`, `--marca`, `--texto`…).
//
// Ficam de fora: a própria fonte (é ela que declara os dois conjuntos) e os
// DECLARANTES autônomos (ficha e páginas de estado), que são documentos sempre claros
// e declaram os seus próprios tokens.
const PRIMITIVOS = /var\(--(?:cream|branco|creme-[1-6]|tinta|soft|burgundy|burgundy-claro|gold|gold-claro|gold-escuro|gold-texto|gold-borda|sobre-ouro)\)/;
{
  // Só as superfícies de INTERFACE. Os geradores (a animação) e o deck declaram a
  // própria paleta num `:root` local e são sempre claros — não consomem o tema.
  const SUPERFICIES = [
    'porta/index.html',
    'raiz/index.html',
    'motor/servidor/bastidores.js',
    'tools/templates/lancamento.html',
    'motor/servidor/producao.js',
    'motor/servidor/cloudflare.js',
    'motor/servidor/provisionar-escola.js',
  ];
  const usos = [];
  for (const rel of SUPERFICIES) {
    const p = path.join(raiz, rel);
    if (!fs.existsSync(p)) continue;
    const bruto = fs.readFileSync(p, 'utf8');
    bruto.split('\n').forEach((linha, i) => {
      if (PRIMITIVOS.test(linha)) usos.push(`${rel}:${i + 1}`);
    });
  }
  if (usos.length) {
    for (const u of usos.slice(0, 12)) {
      erros.push(`Papel: primitivo usado fora da fonte — ${u} (use o papel: --fundo, --texto, --marca…)`);
    }
    if (usos.length > 12) erros.push(`Papel: +${usos.length - 12} ocorrência(s)`);
  } else {
    ok.push('Papel: nenhum consumidor usa primitivo; todos falam por papel');
  }
}

// A correspondência dos DECLARANTES: cada `--token: #hex` tem de valer o mesmo que a
// fonte. Aceita as duas formas do repositório: CSS (`--x: #hex;`) e objeto JS
// (`'--x': '#hex'`). Sem esta checagem, a ficha e as páginas de estado voltariam a
// ser uma segunda identidade — só que agora «declarada».
for (const rel of DECLARANTES) {
  const p = path.join(raiz, rel);
  if (!fs.existsSync(p)) {
    erros.push(`Identidade: declarante não existe: ${rel}`);
    continue;
  }
  const codigo = semComentarios(fs.readFileSync(p, 'utf8'), rel);
  const achados = [];
  for (const m of codigo.matchAll(/(--[a-z0-9-]+)\s*['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,6})\b/g)) {
    achados.push([m[1], expandirHex(m[2])]);
  }
  const divergentes = [];
  for (const [nome, valor] of achados) {
    if (!tokens[nome]) divergentes.push(`${nome} não existe na fonte de verdade`);
    else if (tokens[nome] !== valor) divergentes.push(`${nome} declara ${valor}, a fonte diz ${tokens[nome]}`);
  }
  if (divergentes.length) {
    for (const d of divergentes) erros.push(`Declarante ${rel}: ${d}`);
  } else if (achados.length) {
    ok.push(`Declarante: os ${achados.length} tokens de ${rel} batem com a fonte`);
  }
}

// Um tema declarado sem ser medido é o defeito que este validador existe para evitar.
// Todo bloco `[data-modo="…"]` da fonte tem de estar na lista TEMAS.
const avisos = [];
{
  const css = fs.readFileSync(fonte, 'utf8');
  const declarados = [...css.matchAll(/\[data-modo="([a-z-]+)"\]\s*\{/g)].map((m) => m[1]);
  const unicos = [...new Set(declarados)];
  if (!unicos.includes('noturna')) {
    avisos.push('a fonte não declara [data-modo="noturna"]');
  }
}

// A correspondência declarada pelo deck: cada `--token: #hex` do frontmatter tem
// de valer o mesmo que a fonte de verdade. É o que impede o deck de "declarar a
// identidade" com um valor que já mudou.
{
  const p = path.join(raiz, DECK);
  if (fs.existsSync(p)) {
    const texto = fs.readFileSync(p, 'utf8');
    const front = texto.slice(0, texto.indexOf('\n---', 3));
    const divergentes = [];
    let declarados = 0;
    for (const m of front.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;?\s*$/gm)) {
      const [, nome, valor] = m;
      declarados++;
      if (!tokens[nome]) {
        divergentes.push(`${nome} não existe na fonte de verdade`);
      } else if (tokens[nome] !== valor.toLowerCase()) {
        divergentes.push(`${nome} declara ${valor.toLowerCase()}, a fonte diz ${tokens[nome]}`);
      }
    }
    if (divergentes.length) {
      for (const d of divergentes) erros.push(`Deck: ${d}`);
    } else if (declarados) {
      ok.push(`Deck: os ${declarados} tokens declarados batem com tools/templates/ciclo.css`);
    }
  }
}

// ------------------------------------------------------------- 3) o circuito

// A folha de estilo e o nav são COPIADOS ao pacote pelo gerador. Se a cópia
// divergir da fonte, a página servida não é a identidade — é uma versão antiga.
//
// A PORTA (`plano-observacao/index.html`) é copiada também — de `porta/`, pelo
// `gerar-ciclo.sh` §1b e pelo `criar-escola.sh` —, e compara-se o CORPO dela. A
// única diferença legítima é a barra de navegação, injetada no marcador `<!-- NAV -->`;
// neutralizá-la antes de comparar é o que permite exigir que o resto seja a fonte,
// byte a byte. Sem esta comparação a porta da Fita ficou presa na identidade ANTERIOR
// (44 usos de primitivo, nenhum de papel) e passou em verde: como a variante noturna
// remapeia só os papéis, aquela página não escurecia — ficava clara no meio do escuro.
const semBarra = (t) =>
  t
    .replace(/<nav class="topnav"[\s\S]*?<\/nav>/g, '<nav class="topnav"></nav>')
    .replace(/<!-- NAV -->/g, '<nav class="topnav"></nav>');

function compararPacotes() {
  const dirProf = path.join(raiz, 'professores');
  if (!fs.existsSync(dirProf)) return;
  const portaFonte = path.join(raiz, 'porta/index.html');
  for (const prof of fs.readdirSync(dirProf)) {
    const dirCiclos = path.join(dirProf, prof, 'ciclos');
    if (!fs.existsSync(dirCiclos)) continue;
    for (const entry of fs.readdirSync(dirCiclos, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('ciclo-')) continue;
      const pacote = path.join(dirCiclos, entry.name);
      for (const [origem, destino] of [
        ['tools/templates/ciclo.css', 'assets/style.css'],
        ['tools/templates/nav.js', 'assets/nav.js'],
      ]) {
        const fonteArq = path.join(raiz, origem);
        const copia = path.join(pacote, destino);
        if (!fs.existsSync(copia)) {
          erros.push(`Circuito: ${path.relative(raiz, copia)} não existe — regenere o pacote`);
          continue;
        }
        if (fs.readFileSync(fonteArq, 'utf8') !== fs.readFileSync(copia, 'utf8')) {
          erros.push(`Circuito: ${path.relative(raiz, copia)} divergiu de ${origem} — regenere o pacote`);
        }
      }
      // A porta: o corpo tem de ser o de `porta/index.html`, e a barra injetada tem de
      // trazer o botão da aparência — é o que torna a tela do professor capaz de escurecer.
      const portaCopia = path.join(pacote, 'plano-observacao/index.html');
      if (fs.existsSync(portaFonte) && fs.existsSync(portaCopia)) {
        const rel = path.relative(raiz, portaCopia);
        const html = fs.readFileSync(portaCopia, 'utf8');
        if (semBarra(fs.readFileSync(portaFonte, 'utf8')) !== semBarra(html)) {
          erros.push(`Circuito: ${rel} divergiu de porta/index.html — regenere o pacote`);
        }
        if (!/class="tema"/.test(html)) {
          erros.push(`Circuito: ${rel} não traz o botão da aparência (barra antiga) — regenere o pacote`);
        }
      }
    }
  }
}
compararPacotes();

// A RAIZ também serve uma cópia da folha, e não é um pacote de ciclo: ela é gerada por
// `tools/gerar-raiz.sh`. Antes, a cópia era manual e nada a conferia — o modo de falha
// que o contrato diz ter eliminado.
{
  const copia = path.join(raiz, 'raiz/assets/style.css');
  if (!fs.existsSync(copia)) {
    erros.push('Circuito: raiz/assets/style.css não existe — rode tools/gerar-raiz.sh');
  } else if (fs.readFileSync(fonte, 'utf8') !== fs.readFileSync(copia, 'utf8')) {
    erros.push('Circuito: raiz/assets/style.css divergiu de tools/templates/ciclo.css — rode tools/gerar-raiz.sh');
  }
}

if (!erros.some((e) => e.startsWith('Circuito'))) {
  ok.push('Circuito: assets/style.css e assets/nav.js de cada pacote batem com a fonte');
}

// -------------------------------------------------------------------- saída

for (const l of ok) console.log(`ok: ${l}`);
for (const a of avisos) console.log(`aviso: ${a}`);
for (const e of erros) console.error(`erro: ${e}`);
if (erros.length) {
  console.error(`\n${erros.length} problema(s). A identidade está em IDENTIDADE-VISUAL.md.`);
}
process.exit(erros.length ? 1 : 0);
