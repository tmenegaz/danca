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
 * …e mais sete, cada uma com o caso que a criou escrito ao lado: 4) «Declarantes»,
 * 5) «Circuito» (as cópias), 6) «a porta de cada pacote», 7) «Forma», 8) «Peça»,
 * 9) «Famílias», 10) «Respiro» — esta última nasceu em 06/11/2026, quando as nove
 * anteriores passaram todas com o título do cabeçalho a 0,3px da barra: elas mediam
 * PRESENÇA, e o defeito era de DISTÂNCIA.
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

// Um TEMA é um bloco que declara papéis (hex ou `var(--primitivo)`). Até 18/10/2026
// eram dois — `:root` (clara) e `[data-modo="noturna"]`; com a segunda família são
// QUATRO, porque família × modo é um produto cartesiano, e um tema não medido é um
// tema que ninguém sabe se passa.
//
// A LEITURA PASSA A SER CUMULATIVA, e é o que a segunda família exige. A Cortina
// declara os papéis QUE MUDAM e herda o resto (os semânticos de estado, por
// exemplo): ler o bloco sozinho daria «papel inexistente» para metade dos pares.
// A herança é a mesma do CSS — a cascata —, e por isso a ordem da mesclagem
// reproduz a ordem do arquivo e a especificidade dos seletores.
//
// Os comentários saem ANTES da busca: o comentário desta família CITA
// `[data-paleta="cortina"]` para dizer por que a ordem importa, e um `indexOf` cru
// encontraria a citação em vez do seletor. (O `semComentarios` é declarado mais
// abaixo, mas a declaração de função é içada — e apaga o texto preservando as
// quebras de linha, o que mantém os números de linha dos erros.)
function lerTema(seletor) {
  const css = semComentarios(fs.readFileSync(fonte, 'utf8'), 'tools/templates/ciclo.css');
  // O seletor tem de ser seguido de `{` (com espaço), e não de mais seletor: sem
  // isto, `[data-paleta="cortina"]` cairia dentro do bloco que acrescenta o modo.
  const re = new RegExp(seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{');
  const achado = re.exec(css);
  if (!achado) return null;
  const i = achado.index;
  const bloco = css.slice(i, css.indexOf('}', i));
  const mapa = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6}|var\(--[a-z0-9-]+\))/g)) {
    mapa[m[1]] = m[2].toLowerCase();
  }
  return mapa;
}

/** A cascata, em ordem: o que vem depois sobrescreve. */
function mesclar(...mapas) {
  const saida = {};
  for (const m of mapas) if (m) Object.assign(saida, m);
  return saida;
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

// A ORDEM DE CADA LINHA É A DA CASCATA. Para a Cortina noturna, o arquivo aplica
// `:root` → `[data-modo="noturna"]` → `[data-paleta="cortina"]` (mesma
// especificidade, vence por vir depois) → `[data-paleta="cortina"][data-modo="noturna"]`
// (0,2,0, vence todos). Mesclar noutra ordem mediria um tema que não existe.
const TEMAS = [
  ['Bordô de Cena — clara', lerTema(':root')],
  ['Bordô de Cena — noturna', mesclar(lerTema(':root'), lerTema('[data-modo="noturna"]'))],
  ['Cortina Turquesa — clara', mesclar(lerTema(':root'), lerTema('[data-paleta="cortina"]'))],
  ['Cortina Turquesa — noturna', mesclar(
    lerTema(':root'),
    lerTema('[data-modo="noturna"]'),
    lerTema('[data-paleta="cortina"]'),
    lerTema('[data-paleta="cortina"][data-modo="noturna"]'))],
  // A TERCEIRA, e a última: o catálogo fecha em três famílias (18/10/2026).
  ['Verde de Ensaio — clara', mesclar(lerTema(':root'), lerTema('[data-paleta="verde"]'))],
  ['Verde de Ensaio — noturna', mesclar(
    lerTema(':root'),
    lerTema('[data-modo="noturna"]'),
    lerTema('[data-paleta="verde"]'),
    lerTema('[data-paleta="verde"][data-modo="noturna"]'))],
];

/* A GUARDA QUE FALTAVA — e que a terceira família tornou obrigatória.
 *
 * `TEMAS` é uma lista escrita à mão, e até hoje nada conferia se ela COBRE a folha. Um
 * bloco `[data-paleta="nova"]` entrava, ficava desenhado, aparecia no seletor da escola —
 * e nenhum par dele era medido. As duas listas podiam divergir em silêncio: a folha dizia
 * uma coisa, o validador media outra, e os dois passavam.
 *
 * Agora a folha é a fonte: toda família que ela declara tem de estar em `TEMAS` (o que
 * garante que está medida), e nenhuma família de `TEMAS` pode não estar na folha (o que
 * garante que não se mede o que não existe). É o mesmo princípio do «Declarante», aplicado
 * às famílias em vez dos tokens. */
const FAMILIAS_NA_FOLHA = [...new Set(
  [...semComentarios(fs.readFileSync(fonte, 'utf8'), 'tools/templates/ciclo.css')
    .matchAll(/\[data-paleta="([a-z0-9-]+)"\]/g)].map((m) => m[1]))].sort();

const FAMILIAS_MEDIDAS = [...new Set(
  TEMAS.map(([nome]) => {
    const achado = /^(.+?) — (clara|noturna)$/.exec(nome);
    return achado ? achado[1] : nome;
  }))].sort();

// A TERCEIRA LISTA: a que o SELETOR oferece (`PALETAS`, em `motor/servidor/bastidores.js`).
// Ela é lida daqui — e não repetida — porque foi exatamente esta a avaria de 18/10/2026: a
// ponte de produção tinha `['bordo', 'cortina']` escrito à mão, a terceira família entrou, e
// `verde` caiu no padrão em tudo o que a escola serve por ali. A Produção pintava de verde e a
// anamnese, o plano e o pacote ficavam bordô — «a cor só tem efeito dentro dos bastidores».
// Uma lista da mesma coisa por sítio é uma lista a menos; aqui as três são conferidas.
function familiasDoSeletor() {
  const arq = path.join(raiz, 'motor/servidor/bastidores.js');
  if (!fs.existsSync(arq)) return null;
  const texto = semComentarios(fs.readFileSync(arq, 'utf8'), 'motor/servidor/bastidores.js');
  const i = texto.indexOf('const PALETAS = [');
  if (i < 0) return null;
  const bloco = texto.slice(i, texto.indexOf('];', i));
  return [...bloco.matchAll(/\{\s*id:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]).sort();
}

// NENHUMA OUTRA LISTA À MÃO. A varredura é estreita de propósito: procura ids de família
// entre aspas no código de `motor/` (fora de comentários). Um arquivo que cite DOIS ids
// diferentes está a enumerar famílias — e essa enumeração vive num lugar só, `PALETAS`.
// Citar UM id é legítimo (um padrão, um exemplo, uma rota); enumerar não é.
function listasEscritasAMao(ids) {
  const achados = [];
  const varrer = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const alvo = path.join(dir, entrada.name);
      if (entrada.isDirectory()) { varrer(alvo); continue; }
      if (!/\.js$/.test(entrada.name)) continue;
      const rel = path.relative(raiz, alvo);
      if (rel === path.join('motor/servidor/bastidores.js')) continue; // a fonte da lista
      const texto = semComentarios(fs.readFileSync(alvo, 'utf8'), rel);
      const citados = ids.filter((id) =>
        new RegExp("['\"]" + id + "['\"]").test(texto));
      if (citados.length >= 2) achados.push(rel + ' (' + citados.join(', ') + ')');
    }
  };
  if (fs.existsSync(path.join(raiz, 'motor'))) varrer(path.join(raiz, 'motor'));
  return achados;
}

// O `:root` é a família de base e não declara `[data-paleta]`: os temas dela são os dois
// primeiros, sem sufixo de paleta. Cada família da folha custa DOIS temas (clara e noturna).
const FAMILIAS_ESPERADAS = FAMILIAS_NA_FOLHA.length + 1;
if (FAMILIAS_MEDIDAS.length !== FAMILIAS_ESPERADAS) {
  erros.push(`Identidade: a folha declara ${FAMILIAS_NA_FOLHA.length} família(s) ` +
    `(${FAMILIAS_NA_FOLHA.join(', ') || 'nenhuma'}) além da base, e o validador mede ` +
    `${FAMILIAS_MEDIDAS.length} — ${FAMILIAS_MEDIDAS.join(', ')}. Uma família a mais na ` +
    'folha é uma família sem medição: acrescente os dois temas dela a TEMAS');
} else {
  for (const nome of FAMILIAS_MEDIDAS) {
    for (const modo of ['clara', 'noturna']) {
      if (!TEMAS.some(([n]) => n === `${nome} — ${modo}`)) {
        erros.push(`Identidade: a família "${nome}" não tem tema "${modo}" em TEMAS`);
      }
    }
  }
  ok.push(`Famílias: ${FAMILIAS_MEDIDAS.length} medidas (${FAMILIAS_MEDIDAS.join(' · ')}), ` +
    'e são exatamente as que a folha declara');
}

// ── a folha, o validador e o SELETOR dizem o mesmo ────────────────────────────────────────
// A família PADRÃO não tem bloco `[data-paleta]`: ela É o `:root`. Por isso entra na conta
// dos dois lados — o seletor oferece-a, a folha desenha-a, só não por um seletor de paleta.
const FAMILIA_PADRAO = 'bordo';
const idsNaFolha = [FAMILIA_PADRAO, ...FAMILIAS_NA_FOLHA].sort();
const idsDoSeletor = familiasDoSeletor();
if (idsDoSeletor === null) {
  erros.push('Identidade: não consegui ler a lista PALETAS de motor/servidor/bastidores.js — ' +
    'sem ela não há como conferir que o seletor oferece o que a folha desenha');
} else {
  const soNaFolha = idsNaFolha.filter((id) => idsDoSeletor.indexOf(id) === -1);
  const soNoSeletor = idsDoSeletor.filter((id) => idsNaFolha.indexOf(id) === -1);
  if (soNaFolha.length) {
    erros.push(`Identidade: a folha desenha ${soNaFolha.join(', ')} e o seletor não oferece — ` +
      'uma família desenhada que ninguém pode escolher');
  }
  if (soNoSeletor.length) {
    erros.push(`Identidade: o seletor oferece ${soNoSeletor.join(', ')} e a folha não desenha — ` +
      'escolher essa família pintaria a escola de nada');
  }
  if (!soNaFolha.length && !soNoSeletor.length) {
    ok.push(`Seletor: oferece exatamente as ${idsDoSeletor.length} famílias da folha ` +
      `(${idsDoSeletor.join(' · ')})`);
  }
}

// ── e nenhuma outra lista escrita à mão ───────────────────────────────────────────────────
const aMao = listasEscritasAMao(idsDoSeletor || []);
if (aMao.length) {
  for (const achado of aMao) {
    erros.push(`Identidade: ${achado} enumera famílias à mão — a lista é PALETAS ` +
      '(motor/servidor/bastidores.js), e uma segunda cópia foi a avaria de 18/10/2026: ' +
      'a terceira família não passou na ponte e o site ficou metade verde, metade bordô');
  }
} else {
  ok.push('Lista de famílias: nenhum outro arquivo a enumera — só PALETAS');
}

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
  // O FAVICON DECLARA (18/10/2026), e por uma razão de facto: um favicon é servido SOZINHO —
  // não tem `<link>` para a folha, e um `var(--burgundy)` sem declaração deixaria o ícone
  // preto. As duas cores viajam dentro do SVG como custom properties, e é aqui que se confere
  // que elas dizem o mesmo que `tools/templates/ciclo.css` diz. Um ícone de aba é o artefacto
  // mais fácil de esquecer numa mudança de paleta, e o mais visível quando envelhece.
  'tools/templates/marca/favicon.svg',
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
        // O FAVICON viaja no mesmo circuito (18/10/2026). Ele é pedido por caminho
        // (`/assets/favicon.svg`) em TODAS as superfícies, e um pacote sem ele dá uma aba
        // com o globo do navegador — um defeito que ninguém vê até reparar. Aqui ele é
        // comparado como os outros dois: a cópia tem de ser a fonte, byte a byte.
        ['tools/templates/marca/favicon.svg', 'assets/favicon.svg'],
        /* O CONTRATO DA PORTA TAMBÉM VIAJA, E TAMBÉM ENVELHECE (18/11/2026).
         *
         * O QUE ACONTECEU, medido. O contexto da anamnese ganhou dois campos (`alunaId` e
         * `modalidade`), e o ESQUEMA que os valida — `envelope/elicitacao-schema.json` — é copiado
         * de `porta/` para o pacote, e é ESSA CÓPIA que o Worker carrega dos assets. Mudou-se a
         * fonte, não a cópia: o motor passou a emitir dois campos que o contrato servido
         * recusava, com `additionalProperties: false`. O efeito não seria um campo a menos — seria
         * a anamnese inteira a não gravar, com um «não passou na validação» que ninguém liga a um
         * ficheiro de contrato.
         *
         * E O CONTEÚDO É O MESMO CASO. O item 50 da anamnese (a matriz metodológica) vive em
         * `conteudo/anamnese.json`, também copiado: uma lista nova na fonte e uma lista velha no
         * pacote dão uma escola que não oferece a opção que o mapa já documenta.
         *
         * A COMPARAÇÃO É O QUE FECHA A CLASSE. Não é estilo: é a mesma regra do `assets/style.css`
         * — a cópia tem de ser a fonte, byte a byte, e quem divergir regenera o pacote. */
        ['porta/envelope/elicitacao-schema.json', 'plano-observacao/envelope/elicitacao-schema.json'],
        ['porta/conteudo/anamnese.json', 'plano-observacao/conteudo/anamnese.json'],
        ['porta/plano/conteudo/plano.json', 'plano-observacao/plano/conteudo/plano.json'],
        ['porta/po/conteudo/po.json', 'plano-observacao/po/conteudo/po.json'],
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
      // A porta: o corpo tem de ser o de `porta/index.html`, e a barra injetada tem de ser a
      // ATUAL — isto é, a que NÃO traz o botão da aparência.
      //
      // A conferência era o contrário («tem de trazer `class="tema"`»), e ela existia por um
      // bom motivo: uma cópia com a barra velha deixava a tela do professor sem conseguir
      // escurecer. O motivo acabou em 18/10/2026, quando a decisão **C15** deu a preferência
      // à ESCOLA e tirou o botão da barra: o modo passou a ser servido no `<html>`. Se o
      // botão voltasse numa cópia, o sintoma seria o inverso e igualmente silencioso — cada
      // visitante desfaria, no seu navegador, a aparência que a escola escolheu.
      //
      // A asserção é INVERTIDA em vez de apagada: o que se mede continua a ser «a barra desta
      // cópia é a de hoje», e é isso que faz a cópia velha falhar em vez de passar.
      const portaCopia = path.join(pacote, 'plano-observacao/index.html');
      if (fs.existsSync(portaFonte) && fs.existsSync(portaCopia)) {
        const rel = path.relative(raiz, portaCopia);
        const html = fs.readFileSync(portaCopia, 'utf8');
        if (semBarra(fs.readFileSync(portaFonte, 'utf8')) !== semBarra(html)) {
          erros.push(`Circuito: ${rel} divergiu de porta/index.html — regenere o pacote`);
        }
        if (/class="tema"/.test(html)) {
          erros.push(`Circuito: ${rel} ainda traz o botão da aparência na barra — a C15 tirou-o de lá; regenere o pacote`);
        }
      }
    }
  }
}
/* `--sem-pacotes` — A CONFERÊNCIA DOS PACOTES NÃO PERTENCE A TODA A PUBLICAÇÃO (06/11/2026).
 *
 * O passo da raiz (`publicar.yml`) publica `raiz/` e nada de `professores/`. Mesmo assim corria a
 * comparação dos pacotes inteira e, em 06/11/2026, reprovou: o commit que ele tinha à frente
 * trazia a folha nova em `tools/templates/ciclo.css` e o `gerar-ciclo` concorrente ainda não
 * tinha commitado o pacote regenerado. A raiz ficou por publicar por causa de um ficheiro que
 * ela não serve — e o vermelho dizia «regenere o pacote», que é um conselho para outra pessoa.
 *
 * O que se mede continua a ser tudo o resto (tokens, contraste, cópias da raiz, peças, respiro):
 * o que sai é só a comparação byte a byte dos pacotes de ciclo, e SÓ quando quem chama declara
 * que não os publica. Quem publica pacotes (o passo seguinte do MESMO `publicar.yml`) continua a
 * correr tudo. Desde 17/11/2026 os dois passos vivem num job só, e a distinção passou a ser de
 * PASSO e já não de ficheiro — mas a razão dela não mudou. */
const SEM_PACOTES = process.argv.includes('--sem-pacotes');
if (SEM_PACOTES) ok.push('Circuito: pacotes de ciclo não conferidos (--sem-pacotes: esta publicação não os serve)');
else compararPacotes();

// A RAIZ também serve cópias da folha e do nav, e não é um pacote de ciclo: as duas são
// geradas por `tools/gerar-raiz.sh`. Antes, a cópia era manual e nada a conferia — o modo
// de falha que o contrato diz ter eliminado.
//
// O `nav.js` faltava nesta comparação (17/10/2026): só a folha era medida, e o
// `gerar-raiz.sh` copia as DUAS. Uma raiz com o nav velho passava no contrato — e agora é
// este contrato que autoriza o passo da raiz a publicar, sem passo de geração no
// runner. Se ele não olha, a identidade velha chega à produção com aval de «ok».
for (const [rel, origem] of [
  ['raiz/assets/style.css', 'tools/templates/ciclo.css'],
  ['raiz/assets/nav.js', 'tools/templates/nav.js'],
  ['raiz/assets/favicon.svg', 'tools/templates/marca/favicon.svg'],
]) {
  const copia = path.join(raiz, rel);
  if (!fs.existsSync(copia)) {
    erros.push(`Circuito: ${rel} não existe — rode tools/gerar-raiz.sh`);
  } else if (fs.readFileSync(path.join(raiz, origem), 'utf8') !== fs.readFileSync(copia, 'utf8')) {
    erros.push(`Circuito: ${rel} divergiu de ${origem} — rode tools/gerar-raiz.sh`);
  }
}

if (!erros.some((e) => e.startsWith('Circuito'))) {
  ok.push('Circuito: assets/style.css, assets/nav.js e assets/favicon.svg de cada pacote e da raiz batem com a fonte');
}

// ------------------------------------------------------- 6b) a marca
//
// A MARCA É A PEÇA MAIS FÁCIL DE ENVELHECER EM SILÊNCIO (18/10/2026). Ela existe em dois
// lugares por uma razão técnica, e os dois podem divergir sem ninguém ver:
//
//   · `tools/templates/marca/lastro.svg` — o arquivo, aberto num editor, usado nas telas que
//     podem carregá-lo;
//   · `tools/templates/marca-lastro.js` — a mesma marca como STRING, porque a barra é gerada
//     pelo `nav-html.js`, que roda no Node e no Worker empacotado — e no Worker não há `fs`.
//
// O `nav-html.js` escreve o SVG INLINE no `<span class="marca">`, e não por `<img>`: uma
// `<img>` não herda `currentColor`, e a marca ficaria com a cor gravada dentro do arquivo —
// que é exatamente o problema que a marca-como-papel resolve. Desta escolha vem a obrigação
// de conferir que a STRING é a mesma coisa que o ARQUIVO.
//
// E confere-se mais uma coisa, que é a promessa da peça: que ela é VETOR. Um `<image>` com
// base64 dentro do SVG passaria por todas as outras checagens — é um SVG válido, abre no
// navegador e mostra a marca — e voltaria a ser o arquivo de 106KB que a direção enviou.
{
  const problemas = [];
  const arqSvg = path.join(raiz, 'tools/templates/marca/lastro.svg');
  const arqMod = path.join(raiz, 'tools/templates/marca-lastro.js');
  const arqNav = path.join(raiz, 'tools/templates/nav-html.js');
  const arqFav = path.join(raiz, 'tools/templates/marca/favicon.svg');

  const semEspacos = (t) => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();

  if (!fs.existsSync(arqSvg)) {
    problemas.push('a marca não existe: tools/templates/marca/lastro.svg');
  } else {
    const svg = fs.readFileSync(arqSvg, 'utf8');
    // A PROMESSA: vetor. As três coisas que fariam dela um raster disfarçado.
    if (/<image\b/.test(svg)) problemas.push('lastro.svg usa <image> — a marca voltou a ser raster embalado');
    if (/base64/i.test(svg)) problemas.push('lastro.svg tem base64 — a marca voltou a ser raster embalado');
    if (/<filter\b/.test(svg)) problemas.push('lastro.svg usa <filter> — o desenho deixou de ser só caminhos');
    const caminhos = (svg.match(/<path\b/g) || []).length;
    if (caminhos < 1) problemas.push('lastro.svg não tem nenhum <path>');
    if (!/\sd="[^"]*C/.test(svg)) problemas.push('lastro.svg não tem curvas Bézier nos caminhos');
    if (!/fill="currentColor"/.test(svg)) {
      problemas.push('lastro.svg não usa fill="currentColor" — a marca deixaria de vestir o papel da família');
    }

    // A STRING DA BARRA É O ARQUIVO. Sem esta comparação, corrigir um nó no SVG deixaria a
    // barra a desenhar a versão anterior — para sempre, e sem sintoma.
    if (!fs.existsSync(arqMod)) {
      problemas.push('falta tools/templates/marca-lastro.js — rode node experimentos/marca/vetorizar.js');
    } else {
      let doModulo = null;
      try {
        doModulo = require(arqMod).SVG;
      } catch (e) {
        problemas.push('tools/templates/marca-lastro.js não carrega: ' + e.message);
      }
      if (typeof doModulo === 'string' && semEspacos(doModulo) !== semEspacos(svg)) {
        problemas.push('marca-lastro.js divergiu de lastro.svg — rode node experimentos/marca/vetorizar.js');
      }
    }
  }

  // O SLOT DA BARRA NÃO VOLTA A FICAR VAZIO. Ele esteve assim desde que o texto «Ciclo NN ·
  // escola» saiu do menu, e o sintoma era invisível: um vão de 9em onde deveria haver marca.
  //
  // E O SLOT É UM LINK PARA A RAIZ DO DOMÍNIO (20/10/2026). Clicar na logo e voltar ao início é
  // o gesto que qualquer pessoa tenta; enquanto era um `<span>`, o clique não fazia nada. O href
  // tem de ser ABSOLUTO (`/`) e não `index.html`: o mesmo endereço relativo é o índice do ciclo
  // no pacote, a própria porta em `/plano-observacao/` e a pasta dos Bastidores em
  // `/bastidores/*` — três destinos diferentes para o mesmo gesto.
  if (!fs.existsSync(arqNav)) {
    problemas.push('falta tools/templates/nav-html.js');
  } else {
    const nav = fs.readFileSync(arqNav, 'utf8');
    if (!/class="marca"[^>]*>/.test(nav)) problemas.push('nav-html.js não tem o slot da marca');
    else if (/<span class="marca" aria-hidden="true"><\/span>/.test(nav)) {
      problemas.push('o slot da marca em nav-html.js voltou a ficar vazio');
    } else if (!/<a class="marca" href="\/"/.test(nav)) {
      problemas.push('a marca em nav-html.js não é um link para a raiz do domínio (`<a class="marca" href="/"`)');
    } else if (!/<a class="marca" href="\/"[^>]*aria-label="[^"]+"/.test(nav)) {
      // Um `<a>` cujo conteúdo é `aria-hidden` fica SEM NOME — o rótulo tem de estar no `<a>`.
      problemas.push('o link da marca não tem `aria-label` — um <a> com o desenho escondido fica sem nome acessível');
    }
  }

  // O FAVICON também é vetor, e também tem de ter o emblema — não um PNG disfarçado.
  if (!fs.existsSync(arqFav)) {
    problemas.push('falta tools/templates/marca/favicon.svg — rode node experimentos/marca/vetorizar.js');
  } else {
    const fav = fs.readFileSync(arqFav, 'utf8');
    if (/<image\b|base64|<filter\b/i.test(fav)) problemas.push('favicon.svg deixou de ser vetor');
    if (!/<path\b/.test(fav)) problemas.push('favicon.svg não tem o desenho (nenhum <path>)');
  }

  for (const p of problemas) erros.push('Marca: ' + p);
  if (!problemas.length) {
    ok.push('Marca: lastro.svg é vetor (só caminhos, `currentColor`), a string da barra é a mesma, ' +
      'o slot não está vazio, é um link com nome para `/` e o favicon também é vetor');
  }
}

// ------------------------------------------------------------- 7) a forma
//
// A CÓPIA ÚNICA MEDE COR, NÃO DESENHO (18/10/2026). Ela garante que nenhum hex da
// paleta está fora da fonte — e não viu o defeito que o dono do produto encontrou
// olhando duas telas: a MESMA etiqueta «livre» saía âmbar nos Bastidores e cinza na
// anamnese, e o selo «vinculada» saía roxo inteiro numa e meio bordô na outra.
//
// A causa: `porta/index.html` redeclarava quatro estados de `.selo` mudando só
// `border-color`/`color`. Como o `<style>` da página vem DEPOIS de `/assets/style.css`,
// essas quatro linhas venciam o componente PELA METADE — o fundo continuava o da
// fonte e a borda e o texto passavam a ser da página. A Fase 1 declarou «nenhum
// `<style>` de página define selo» e conferiu por grep do seletor nu (`.selo {`),
// que não vê `.selo.vinculada`. Verde, e errado.
//
// As duas regras que fecham isso:
//
//   7a. quem CARREGA a folha não redeclara componente;
//   7b. todo estado de `.selo` que alguma superfície usa existe na fonte.
//
// A 7a é a que teria pego o defeito. A 7b impede o contrário: um estado inventado
// numa página (o `.selo.sem-uso` dos Bastidores, que não existia em lugar nenhum).
// Os componentes da IDENTIDADE — os que a fonte declara COMO COMPONENTE. A lista é
// DERIVADA da fonte e não escrita à mão: é «raiz» a classe que aparece SOZINHA como
// alvo de uma regra (`.selo {`, `.caixa {`, `.aviso {`). Um `.selo.vinculada` não faz
// de `vinculada` um componente; um `.res.ok` não faz de `ok` um componente. O que a
// fonte desenha como peça é que manda.
//
// Derivar da fonte é o que a torna durável: quando um componente novo entra no
// `ciclo.css`, ele passa a ser coberto sem ninguém lembrar de o acrescentar aqui.
// (Uma lista à mão envelhece — e a lista velha é exactamente o que deixou passar o
// `.selo.vinculada` da porta.)
const raizesDaFonte = new Set();
for (const m of fs.readFileSync(fonte, 'utf8').matchAll(/([^{}]+)\{/g)) {
  for (const seletor of m[1].split(',')) {
    const alvo = (seletor.trim().split(/[\s>+~]+/).pop() || '').replace(/::?[a-z-]+(\([^)]*\))?/g, '');
    // Só a classe, e só ela: `.x`, `.x:hover`, `.x[attr]`.
    const so = alvo.match(/^\.([a-z][a-z0-9-]*)(?::|\[|$)/);
    if (so) raizesDaFonte.add(so[1]);
  }
}

// O que DEFINE o desenho de um componente. Um seletor que mexe nisto é dono do
// componente; um que mexe em `margin`/`gap`/`width` está a AJUSTAR a página, e é
// legítimo (é o que a camada de página existe para fazer).
const PROPRIEDADES_DE_FORMA =
  /(^|;|\s)(background|background-color|background-image|color|border|border-[a-z]+|border-radius|font|font-[a-z]+|text-transform|letter-spacing|box-shadow|padding)\s*:/;

/**
 * O ALVO de uma regra — o último composto do seletor, sem as pseudo-classes.
 *
 * É o que separa «a página redeclara o componente» de «a página ajusta o que está
 * dentro dele». `.selo.vinculada` tem o selo como ALVO: quem escreve isso está a
 * redesenhar o selo. `.turma .escala li` tem o `li` como alvo: a página está a
 * arrumar a sua própria peça, e o componente que ela usa de empréstimo não muda.
 */
const LADOS_DA_MOLDURA = ['top', 'right', 'bottom', 'left'];

/**
 * As arestas que uma regra REMOVE — `border-bottom:0`, `border-bottom-style:none`,
 * `border-bottom-width:0px`. Extraída de `conferirArestas` a 12/11/2026 para a checagem `Base` a
 * poder usar: são a MESMA pergunta («esta regra apaga uma borda?»), e escrevê-la duas vezes daria
 * duas respostas no dia em que uma delas mudasse.
 */
function arestasQueUmaRegraRemove(corpo) {
  const removidas = [];
  for (const lado of LADOS_DA_MOLDURA) {
    const curto = new RegExp('(?:^|;)\\s*border-' + lado + '\\s*:\\s*(none|0)(?:px)?\\b', 'i');
    const estilo = new RegExp('(?:^|;)\\s*border-' + lado + '-style\\s*:\\s*none\\b', 'i');
    const largura = new RegExp('(?:^|;)\\s*border-' + lado + '-width\\s*:\\s*0(?:px)?\\b', 'i');
    if (curto.test(corpo) || estilo.test(corpo) || largura.test(corpo)) removidas.push(lado);
  }
  // `border: none` remove as quatro — e isso é uma decisão, não uma aresta a menos.
  if (/(?:^|;)\\s*border\\s*:\\s*(none|0)\\b/i.test(corpo)) return [];
  return removidas;
}

function alvoDaRegra(seletor) {
  const ultimo = seletor.trim().split(/[\s>+~]+/).pop() || '';
  return ultimo.replace(/::?[a-z-]+(\([^)]*\))?/g, '');
}


/** Tira os `<style>` de um HTML ou as linhas CSS de uma string JS, com o comentário fora. */
function blocosDeEstilo(texto, rel) {
  const blocos = [];
  if (/\.html$/.test(rel)) {
    for (const m of texto.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) blocos.push(m[1]);
  } else {
    // As folhas de página escritas em string JS: `'.regra{...}' +`.
    for (const m of texto.matchAll(/'\s*([^{}']*?)\{([^{}']*)\}\s*'/g)) blocos.push(m[0].slice(1, -1));
  }
  return blocos.map((b) => semComentarios(b, rel));
}

// As superfícies que CARREGAM `/assets/style.css` — nelas o componente já veio pronto.
// As que são servidas sozinhas (ficha, estados) estão em DECLARANTES e não entram aqui:
// lá a declaração é obrigatória, e o regime é o da checagem 4.
const COM_FOLHA = [
  'porta/index.html',
  'raiz/index.html',
  'tools/templates/lancamento.html',
  'motor/servidor/bastidores.js',
];

function conferirForma() {
  const problemas = [];

  // 7a — quem carrega a folha não redeclara componente.
  for (const rel of COM_FOLHA) {
    const arq = path.join(raiz, rel);
    if (!fs.existsSync(arq)) continue;
    const texto = fs.readFileSync(arq, 'utf8');
    for (const bloco of blocosDeEstilo(texto, rel)) {
      // Cada regra: seletores { corpo }. O bloco já vem sem comentários.
      for (const m of bloco.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const seletores = m[1].trim();
        const corpo = m[2];
        if (!PROPRIEDADES_DE_FORMA.test(corpo)) continue;
        // `:where()` é o piso da própria fonte: não aparece em página.
        for (const seletor of seletores.split(',')) {
          const alvo = alvoDaRegra(seletor);
          // As classes do ALVO — as do elemento que a regra pinta.
          const doAlvo = [...alvo.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((c) => c[1]);
          const componente = doAlvo.find((c) => raizesDaFonte.has(c));
          if (!componente) continue;
          problemas.push(
            `Forma: ${rel} redeclara o componente «${componente}» ` +
            `(${seletor.trim().replace(/\s+/g, ' ')}) — o desenho mora em tools/templates/ciclo.css`);
        }
      }
    }
  }

  // 7b — todo estado de `.selo` usado existe na fonte.
  const fonteCss = fs.readFileSync(fonte, 'utf8');
  const declarados = new Set([...fonteCss.matchAll(/\.selo\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
  const usados = new Map();
  for (const rel of [...COM_FOLHA, ...DECLARANTES, 'tools/templates/ciclo.html']) {
    const arq = path.join(raiz, rel);
    if (!fs.existsSync(arq)) continue;
    const texto = fs.readFileSync(arq, 'utf8');
    for (const m of texto.matchAll(/class="selo ([a-z][a-z0-9-]*)"/g)) {
      if (!usados.has(m[1])) usados.set(m[1], new Set());
      usados.get(m[1]).add(rel);
    }
  }
  for (const [estado, onde] of usados) {
    if (!declarados.has(estado)) {
      problemas.push(
        `Forma: o estado «.selo.${estado}» é usado em ${[...onde].join(', ')} e não existe em ` +
        'tools/templates/ciclo.css — declare-o na fonte (ou use um estado de lá)');
    }
  }

  for (const p of problemas) erros.push(p);
  if (!problemas.length) {
    ok.push(`Forma: nenhuma das ${COM_FOLHA.length} superfícies com folha redeclara componente, ` +
      `e os ${usados.size} estados de selo em uso existem na fonte`);
  }
}
conferirForma();

// --------------------------------------------------------------- 8) a peça
//
// A FORMA MEDE A CÓPIA; NÃO MEDE O NOME (18/10/2026). A checagem 7 sabe dizer se
// uma página REDECLAROU uma peça da fonte. Não sabe dizer se alguém inventou uma
// peça que nunca existiu — e foi exactamente isso que aconteceu, no dia em que a
// secção «Aparência» nasceu com `<div class="fileira">`. `fileira` não estava em
// lugar nenhum: nem na fonte, nem no `<style>` da página. Sem desenho, os dois
// botões encostaram um no outro, e o dono do produto viu o defeito antes de
// qualquer prova — porque o defeito era visual, e nenhuma das oito checagens
// olhava para o NOME das coisas.
//
// A regra que fecha isso é a mais simples que existe: **toda classe usada na
// marcação tem de ser DESENHADA em algum lugar** — na fonte, ou no `<style>` da
// própria página, quando ela declara o que usa. Quem não desenha nada é uma de
// duas coisas, e as duas se declaram:
//
//   · um GANCHO — um nome que existe para o JavaScript achar o elemento, ou para
//     a composição do grid se ler. Não pinta nada de propósito, e está na lista
//     abaixo com a razão escrita. A lista é curta e à mão de propósito: cada
//     linha nova é uma decisão de alguém, e é aí que se pensa «isto é uma peça ou
//     é um gancho?»;
//   · um ERRO — e aí a marcação usa outra coisa, ou a peça nasce na fonte.
//
// O QUE CONTA COMO «DESENHADA». Uma classe é desenhada quando aparece no ÚLTIMO
// composto de alguma regra — `.acao.grande` desenha `acao` e `grande`; `.fileira >
// button` desenha `button`, e `fileira` só é PAI. Um modificador desenha-se assim,
// e um contentor que só ajusta o que está dentro não é peça: é gancho, e declara-se.
const GANCHOS = new Map(Object.entries({
  // — ganchos de JavaScript: o script procura estes nomes, e não os pinta
  adicionar: 'o botão «Adicionar» do escolhedor, que o script procura',
  editar: 'o «Editar» de uma linha, que o script procura para abrir a edição',
  'cancelar-edicao': 'o «Cancelar» do modo de edição, que o script procura',
  opcoes: 'o `<select>` de opções do escolhedor, que o script lê',
  /* A PEÇA DO RODAPÉ DE PÁGINAS (23/10/2026). O nome era `pag-*` até esta data; passou a
     `paginas-*` porque `paginacao` já era a classe da barra de controle do lançamento, e a regra
     nova passou a desenhar a barra dele — o «voltar ao topo» subiu 5px e caiu em cima do «⋯».
     Os três continuam a ser GANCHOS e não desenho: quem os procura é o script, e quem os pinta é
     `.acao`, que é a peça do botão. */
  'paginas-ant': 'o «anterior» do rodapé de páginas, que o script procura e desabilita',
  'paginas-prox': 'o «próximo» do rodapé de páginas, idem',
  /* OS DOIS SALTOS (17/11/2026). «Eu posso tanto avançar para a página dois quanto voltar para a
     página um, quanto ir para a última página, quanto voltar para a primeira página.» Com
     quarenta meses de mensalidades, andar de dez em dez até ao fim é uma tarefa.
     São ganchos pela mesma razão que os dois passos: não têm desenho — quem os pinta é `.acao`,
     que é a peça do botão — e o que o script faz com eles é desabilitá-los nos extremos. A folha
     não é tocada, e o « e o » que eles mostram é desenho de conteúdo, não de forma. */
  'paginas-primeira': 'o salto para a primeira página, que o script procura e desabilita',
  'paginas-ultima': 'o salto para a última página, idem',
  'paginas-info': 'o contador do rodapé de páginas, que o script escreve',
  menu: 'o `<details>` da barra, que `nav.js` abre e fecha (o desenho é de `summary`)',
  'ctx-turma': 'o bloco do contexto da turma na porta, que o script preenche',
  filtros: 'o grupo de filtros do lançamento, que o script lê',
  // — ganchos de composição: o desenho é do PAI (o grid da secção), e o filho só existe
  //   para o grid ter onde pôr a coluna
  /* A DOBRA DO TEXTO DE UM TRECHO (03/11/2026). Não tem desenho próprio — quem desenha é o
     `details` nativo, e é de propósito: a dobra é um comportamento, não uma forma. Fica declarada
     porque a marcação a emite (o «lê-se» de cada linha do passo 6 e a leitura de cada trecho no fim
     do formulário), e uma classe emitida que ninguém declara é a que se copia sem se saber o que é. */
  dito: 'a dobra fechada do texto de um trecho — o desenho é do `details` nativo',
  'col-form': 'a coluna do formulário no grid da secção — o desenho é do grid',
  principal: 'a coluna do conteúdo nos Bastidores — o desenho é do grid',
  form: 'o contentor do formulário na raiz — o desenho é do cartão que o contém',
}));

/** As classes que alguma regra DESENHA — as do último composto de cada seletor. */
function classesDesenhadas(css) {
  const conjunto = new Set();
  for (const bloco of css.split('}')) {
    const i = bloco.lastIndexOf('{');
    if (i < 0) continue;
    for (const seletor of bloco.slice(0, i).split(',')) {
      const compostos = seletor.trim().split(/[\s>+~]+/);
      const ultimo = compostos[compostos.length - 1] || '';
      for (const m of ultimo.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) conjunto.add(m[1]);
    }
  }
  return conjunto;
}

const desenhadasNaFonte = classesDesenhadas(fs.readFileSync(fonte, 'utf8'));

/** As superfícies que EMITEM marcação: o que um leitor vê tem de usar peça conhecida. */
function superficiesQueEmitem() {
  const lista = [];
  const ler = (rel) => {
    const arq = path.join(raiz, rel);
    return fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : null;
  };
  for (const rel of [
    'porta/index.html',
    'raiz/index.html',
    'tools/templates/ciclo.html',
    'tools/templates/lancamento.html',
  ]) {
    const t = ler(rel);
    if (t) lista.push([rel, t]);
  }
  // As que o MOTOR gera não estão em arquivo nenhum: pedem-se ao motor, que é o
  // único lugar onde o que se mede é o que se serve.
  try {
    const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
    lista.push(['bastidores/estudio', bastidores.paginaProducao(
      'x', { professor: 'x', ciclo: '01', query: '' }, [], [], '', '', [], [], [], [], [], [])]);
  } catch (e) {
    erros.push('Peça: não foi possível gerar a página de Produção para medir (' + e.message + ')');
  }
  try {
    const ficha = require(path.join(raiz, 'motor/nucleo/ficha-html.js'));
    lista.push(['ficha', ficha.paginaDaFicha('## x\n', { aba: 'a', titulo: 't', sub: 's' })]);
  } catch (e) {
    erros.push('Peça: não foi possível gerar a ficha (' + e.message + ')');
  }
  try {
    const estado = require(path.join(raiz, 'motor/servidor/estado-html.js'));
    lista.push(['estado', estado.paginaEstado('E', '<p>x</p>')]);
  } catch (e) {
    erros.push('Peça: não foi possível gerar a página de estado (' + (e && e.message) + ')');
  }
  /* AS PÁGINAS DE LISTA (23/10/2026). Elas são geradas na montagem, a partir do que existe no
   * disco — e por isso não estão em arquivo nenhum, como a ficha e os estados. Mede-se uma
   * amostra pequena: o que interessa é que a marcação use peças desenhadas (o trio, o selo, o
   * botão), e não que os dados sejam os desta escola. */
  try {
    const listas = require(path.join(raiz, 'motor/nucleo/lista-html.js'));
    lista.push(['lista-de-planos', listas.paginaDeLista({
      titulo: 'Planos do ciclo',
      subtitulo: 'Escola · 2 planos',
      nav: '<nav class="topnav"></nav>',
      planos: [
        { nome: 'Ciclo 01 — Escola · Turma A', turma: 'Turma A', professor: 'Professor A',
          ciclo: '01', aulas: '18', ancorada: '23/10/2026', po: 'PO aguardando', poClasse: 'alerta',
          hash: 'ca122b865128548b', hrefPlano: '/a/plano.html' },
        { nome: 'Ciclo 01 — Escola · Turma B', turma: 'Turma B', professor: 'Professor B',
          ciclo: '01', aulas: '18', ancorada: '23/10/2026', po: '', poClasse: 'discreto',
          hash: '', hrefPlano: '/b/plano.html' },
      ],
    })]);
    /* O BOTÃO DO TOPO DA LISTA (25/10/2026). A `acao` da página é a porta do formulário — o que
     * a Área do Professor tinha perdido. A amostra passa a exercitá-la: uma peça que nenhuma
     * amostra emite é uma peça que esta checagem aprova sem ver, e o modo de falhar mais silencioso
     * deste repositório é aprovar por omissão. */
    lista.push(['lista-de-documentos', listas.paginaDeLista({
      titulo: 'Aulas', subtitulo: 'A aula dada', nav: '<nav class="topnav"></nav>',
      acao: { rotulo: 'Novo plano de ensino', href: '/plano-ensino/?fonte=plano' },
      itens: [{
        nome: 'Aula 01 — marco · Turma A', turma: 'Turma A', complemento: 'Ciclo 01',
        acoes: [['Abrir a aula', '/a/aula-01.html', '']],
      }],
    })]);
    /* A LISTA PAGINADA (23/10/2026). A paginação saiu do `bastidores.js` para a folha, e a
     * amostra tem de a exercitar: sem uma lista com `porPagina`, o rodapé e os três botões dele
     * não apareceriam em marcação nenhuma — e a checagem «Peça» estaria a aprovar por omissão,
     * que é o modo mais silencioso de não verificar nada. */
    lista.push(['lista-paginada', listas.paginaDeLista({
      titulo: 'Aulas', subtitulo: 'A aula dada', nav: '<nav class="topnav"></nav>',
      itens: [{
        nome: 'Aula 01 — marco · Turma A', turma: 'Turma A', complemento: 'Ciclo 01',
        acoes: [['Abrir a aula', '/a/aula-01.html', '']],
      }],
      porPagina: 25, singular: 'aula', plural: 'aulas', campos: ['busca', 'turma'],
    })]);
    /* A LISTA DAS AULAS DADAS (06/11/2026). Ela é SERVIDA pela ponte, e por isso não está em
     * arquivo nenhum — como as três listas da Área do Professor. Entra aqui pela mesma razão das
     * outras amostras: uma superfície que emite marcação e não é medida é aprovada por omissão, e
     * «aprovar por omissão» é o modo mais silencioso de não verificar nada. O índice é uma amostra
     * de uma aula — o que se mede é a marcação, não os dados desta escola. */
    /* A AMOSTRA COMPÕE O CARTÃO COM A PÁGINA — e não chama `pagina()`, que é `async` e cuja
     * assinatura obrigaria a tornar esta checagem inteira assíncrona. O que se mede é a mesma
     * marcação: `itemDaAulaDada` (o cartão) dentro de `paginaDeLista` (a página), com os mesmos
     * parâmetros que `pagina()` passa. */
    const aulasDadas = require(path.join(raiz, 'motor/servidor/aulas-dadas.js'));
    lista.push(['aulas-dadas', listas.paginaDeLista({
      titulo: 'Aulas dadas', subtitulo: 'Escola · 1 aula lançada',
      nav: '<nav class="topnav"></nav>',
      itens: [aulasDadas.itemDaAulaDada({
        ciclo: '01', variante: 'escola-turma-a', professor: 'professor-a', escola: 'Escola',
        numero: '06', data: '2026-11-05', duracao: 60, marco: 'marco de amostra',
        prazo: '2026-11-09T19:00', presentes: 2, ausentes: 0,
        lancada_em: '2026-11-06T16:42', ajustada_em: '',
      }, new Date('2026-11-07T10:00:00'))],
      vazio: aulasDadas.VAZIO,
      aviso: 'Cada linha é uma aula que já aconteceu.',
      campos: ['busca', 'turma'], singular: 'aula', plural: 'aulas', porPagina: 25,
    })]);
  } catch (e) {
    erros.push('Peça: não foi possível gerar as páginas de lista (' + (e && e.message) + ')');
  }
  // O PAINEL DA RAIZ (22/10/2026) — as duas páginas que o Worker serve, mais o BLOCO que entra
  // na página da raiz. O bloco entra na medição de propósito: ele não está em arquivo nenhum, é
  // gerado em tempo de resposta, e é o pedaço do painel que mais muda.
  try {
    const painel = require(path.join(raiz, 'motor/servidor/painel-html.js'));
    const amostra = {
      slug: 'calango', nome: 'calango', professor: 'sapo-bailarino',
      criada_em: '2026-10-19T18:18:57Z', expurgada_em: '2026-10-22T10:48:48Z',
      expurgada: true, expurgos: 1,
    };
    const viva = Object.assign({}, amostra, { slug: 'maria', expurgada: false, expurgada_em: null });
    lista.push(['painel/bloco-na-raiz', painel.blocoDeEscolas()]);
    lista.push(['painel/escolas-apagadas', painel.paginaDasApagadas({ escolas: [amostra, viva] })]);
    lista.push(['painel/escolas-vivas', painel.paginaDasVivas({ escolas: [amostra, viva] })]);
    lista.push(['painel/professores', painel.paginaDosProfessores({
      professores: [
        { slug: 'sapo-bailarino', nome: 'Sapo Bailarino', escolas: ['calango', 'viva'] },
        { slug: 'so-slug', nome: null, escolas: ['calango'] },
      ],
      escolas: [amostra, viva],
    })]);
    lista.push(['painel/registo', painel.paginaDoRegistro({
      slug: 'calango',
      indice: {
        escola: 'Calango', criado_em: '2026-10-19T18:18:57Z', ciclo: '01',
        professor: { nome: 'Sapo Bailarino' },
        expurgo: [{
          em: '2026-10-22T10:48:48Z', motivo: 'expurgada pela página «Sistema Lastro»',
          apagado: ['wrangler.calango.jsonc', 'professores/x/ciclos/ciclo-01-calango.conf'],
          kv: { ok: true, apagadas: 3, restantes: 0, prefixos: ['calango/', 'bastidores/calango/'] },
        }],
      },
    })]);
    lista.push(['painel/sem-token', painel.paginaSemToken()]);
  } catch (e) {
    erros.push('Peça: não foi possível gerar as páginas do painel (' + (e && e.message) + ')');
  }
  return lista;
}

function conferirPecas() {
  const problemas = [];

  // 8a — a folha não pode ter comentário aberto. Um `/*` sem `*/` engole todas as
  // regras seguintes até ao próximo fecho, e as peças de lá ficam SEM DESENHO sem
  // que nada falhe — foi o que aconteceu a `.acao.perigo`, `.acao.grande` e
  // `.acao.pequena` numa das versões deste dia, e a página só perdia o desenho.
  const cru = fs.readFileSync(fonte, 'utf8');
  const abre = (cru.match(/\/\*/g) || []).length;
  const fecha = (cru.match(/\*\//g) || []).length;
  if (abre !== fecha) {
    problemas.push(`Peça: tools/templates/ciclo.css tem ${abre} «/*» e ${fecha} «*/» — ` +
      'um comentário aberto apaga as regras que vêm depois dele');
  }

  // 8b — toda classe usada na marcação é desenhada, ou é gancho declarado.
  const superficies = superficiesQueEmitem();
  const orfas = new Map();
  for (const [nome, html] of superficies) {
    // O `<script>` fica de fora: lá dentro as classes são strings montadas em tempo
    // de execução (`'selo ' + estado`), e medi-las seria medir a minha própria regex.
    const semScript = html.replace(/<script[\s\S]*?<\/script>/g, '');
    // O `<style>` da própria página conta como desenho: a página que declara o que
    // usa está no regime da checagem 4, e não no desta.
    const estilos = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    const desenhadasNaPagina = classesDesenhadas(estilos);
    for (const m of semScript.matchAll(/class="([^"]*)"/g)) {
      for (const classe of m[1].split(/\s+/)) {
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(classe)) continue;
        if (desenhadasNaFonte.has(classe) || desenhadasNaPagina.has(classe)) continue;
        if (GANCHOS.has(classe)) continue;
        if (!orfas.has(classe)) orfas.set(classe, new Set());
        orfas.get(classe).add(nome);
      }
    }
  }
  for (const [classe, onde] of orfas) {
    problemas.push(`Peça: a classe «${classe}» é usada em ${[...onde].join(', ')} e não é ` +
      'desenhada em lugar nenhum — use uma peça de tools/templates/ciclo.css, ou declare-a lá ' +
      '(e no catálogo de IDENTIDADE-VISUAL.md), ou registe-a como gancho nesta checagem');
  }

  for (const p of problemas) erros.push(p);
  if (!problemas.length) {
    ok.push(`Peça: as ${superficies.length} superfícies que emitem marcação usam só peças ` +
      `desenhadas ou ganchos declarados (${GANCHOS.size} ganchos), e a folha não tem comentário aberto`);
  }
}
conferirPecas();

// ------------------------------------------------- 9) as quatro arestas da moldura
//
// O CASO QUE CRIOU ESTA CHECAGEM (22/10/2026). `a.acao { border-bottom: none }` existia
// para cancelar o sublinhado pontilhado da prosa (`main a`), e o que fazia era AMPUTAR a
// aresta de baixo de todo link vestido de botão: `border: 1px solid` seguido de
// `border-bottom: none` deixa a base em 0. O «Painel» da raiz, o «Abrir» do painel e o
// «Voltar à lista» saíam com TRÊS lados. O comentário do próprio arquivo já dizia «o botão
// tem os quatro lados» — e o do `.secundario` culpava a falta de fundo, quando a causa era
// esta. Um comentário não mede; a checagem mede.
//
// A REGRA. Se uma peça recebe `border` completo (largura > 0 e estilo sólido), nenhuma regra
// POSTERIOR pode remover UMA aresta dela — `border-X: none`, `border-X-width: 0` ou
// `border-X-style: none` — a não ser que declare a moldura inteira outra vez. Remover a
// moldura toda (`border: none`) é uma decisão, e é visível; remover um lado é um defeito que
// se lê como «borda que sumiu».
function conferirArestas() {
  const problemas = [];
  const texto = semComentarios(fs.readFileSync(fonte, 'utf8'), 'ciclo.css');

  /** As classes do último composto de cada seletor. */
  const classesDoAlvo = (seletor) => {
    const alvo = alvoDaRegra(seletor);
    return [...alvo.matchAll(/\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]);
  };

  /** `border: <largura> <estilo> …` — devolve `{ largura, estilo }` quando há shorthand. */
  const molduraCompleta = (corpo) => {
    const m = /(?:^|;)\s*border\s*:\s*([^;]+)/.exec(corpo);
    if (!m) return null;
    const valor = m[1].trim();
    if (/^(none|0)\b/.test(valor)) return null;
    const estilo = /(solid|dashed|dotted|double|groove|ridge|inset|outset)/.exec(valor);
    if (!estilo) return null;
    return { estilo: estilo[1] };
  };

  const LADOS = LADOS_DA_MOLDURA;
  const arestasRemovidas = arestasQueUmaRegraRemove;

  // As peças com moldura, na ordem em que a folha as declara. O índice é a posição da regra:
  // só uma regra POSTERIOR pode amputar o que uma anterior desenhou.
  const comMoldura = new Map();
  let posicao = 0;
  for (const m of texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    posicao += 1;
    const seletores = m[1].split(',');
    const corpo = m[2];
    const completa = molduraCompleta(corpo);
    for (const seletor of seletores) {
      for (const classe of classesDoAlvo(seletor)) {
        if (completa && !comMoldura.has(classe)) comMoldura.set(classe, posicao);
      }
    }
    const removidas = arestasRemovidas(corpo);
    if (!removidas.length) continue;
    for (const seletor of seletores) {
      for (const classe of classesDoAlvo(seletor)) {
        const desde = comMoldura.get(classe);
        if (desde == null || posicao <= desde) continue;
        problemas.push(
          `Aresta: a regra «${seletor.trim().replace(/\s+/g, ' ')}» remove a aresta ` +
          `${removidas.join(' e ')} de «.${classe}», que tem moldura desde a regra ${desde} ` +
          '— a borda é sempre sólida nos quatro lados, e uma aresta a menos lê-se como defeito. ' +
          'Se a intenção é cancelar o sublinhado da prosa, declare a aresta com o mesmo estilo ' +
          'da moldura (`border-bottom: 1px solid var(--marca)`), em vez de a remover');
      }
    }
  }

  for (const p of problemas) erros.push(p);
  if (!problemas.length) {
    ok.push(`Aresta: as ${comMoldura.size} peças com moldura na folha têm os quatro lados — ` +
      'nenhuma regra posterior amputa uma aresta');
  }
}
conferirArestas();

// ------------------------------------------- 10) a base do bloco
//
// O CASO QUE CRIOU ESTA CHECAGEM (12/11/2026). Ela abriu o painel «Conteúdo» do cartão da Turma e
// viu o que já tinha visto antes, noutro sítio: «a última linha, a borda da última linha, está
// sendo engolida […] a borda inferior, que está com problema e esse problema tem sido recorrente.»
//
// MEDIDO: as duas primeiras linhas da tabela com `border-bottom: 1px`, a última com `0px`. A causa
// era uma regra escrita de boa-fé — `tbody tr:last-child td{border-bottom:0}` —, cuja intenção era
// a base da tabela não ficar com dois traços. O efeito é uma tabela que fecha em cima e fica
// aberta em baixo, e isso lê-se como tabela cortada.
//
// PORQUE É QUE A CHECAGEM 9 (`Aresta`) NÃO O APANHOU: ela mede a FOLHA (`tools/templates/ciclo.css`)
// e procura uma MOLDURA completa a ser amputada. Esta regra vive no `<style>` de uma página, e
// `border-bottom` de um lado só não é uma moldura — é um FILETE. São duas perguntas diferentes:
// «esta peça perdeu um lado da caixa?» e «este bloco perdeu a base?».
//
// A REGRA: se uma regra dá filete inferior a um alvo e OUTRA, mais adiante, o tira de um
// `:last-child`/`:last-of-type` desse mesmo alvo, o bloco fica sem base. Não há caso legítimo: quem
// quer separar o bloco do que vem a seguir usa o AR do contentor, não a ausência de aresta.
function conferirBase() {
  const problemas = [];
  const FILEITE = /(?:^|;)\s*border-bottom\s*:\s*([^;}]+)/i;
  const temFilete = (corpo) => {
    const m = FILEITE.exec(corpo);
    if (!m) return false;
    const v = m[1].trim();
    if (/^(none|0)\b/i.test(v)) return false;
    return /(solid|dashed|dotted|double)/i.test(v);
  };

  /** O que esta regra pinta: as classes do seletor e o ELEMENTO do último composto. */
  const pinta = (seletor) => {
    const classes = new Set();
    for (const m of seletor.matchAll(/\.([a-z][a-z0-9-]*)/g)) classes.add(m[1]);
    const elemento = (alvoDaRegra(seletor).match(/^[a-z][a-z0-9]*/i) || [''])[0].toLowerCase();
    return { classes, elemento };
  };
  const toca = (a, b) => {
    for (const c of a.classes) if (b.classes.has(c)) return true;
    return !!a.elemento && a.elemento === b.elemento;
  };

  // Uma folha de cada vez: a da casa e as das páginas (o `<style>` que cada uma emite). É a
  // segunda que faltava, e é onde este defeito viveu.
  const folhas = [['tools/templates/ciclo.css', fs.readFileSync(fonte, 'utf8')]];
  for (const [nome, html] of superficiesQueEmitem()) {
    for (const bloco of blocosDeEstilo(html, nome + '.html')) folhas.push([nome, bloco]);
  }

  for (const [nome, texto] of folhas) {
    const regras = [];
    let posicao = 0;
    for (const m of texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      posicao += 1;
      for (const seletor of m[1].split(',')) {
        regras.push({ posicao, seletor: seletor.trim().replace(/\s+/g, ' '), corpo: m[2] });
      }
    }
    for (const regra of regras) {
      if (!/(:last-child|:last-of-type)/.test(regra.seletor)) continue;
      if (arestasQueUmaRegraRemove(regra.corpo).indexOf('bottom') === -1) continue;
      const alvo = pinta(regra.seletor);
      const anterior = regras.find((r) => r.posicao < regra.posicao && temFilete(r.corpo)
        && toca(pinta(r.seletor), alvo));
      if (!anterior) continue;
      problemas.push(
        `Base: em ${nome}, a regra «${regra.seletor}» tira o filete inferior do ÚLTIMO elemento ` +
        `— e «${anterior.seletor}» dá-o a todos. O bloco fica sem base e lê-se como cortado. ` +
        'A última linha tem a mesma borda que as outras: para separar o bloco do que vem a ' +
        'seguir use o ar do contentor, não a ausência de aresta');
    }
  }

  for (const p of problemas) erros.push(p);
  if (!problemas.length) {
    ok.push(`Base: nenhuma das ${folhas.length} folhas (a da casa e as ${folhas.length - 1} das ` +
      'páginas) tira o filete da última linha de um bloco que o tem nas outras');
  }
}
conferirBase();

// ------------------------------------------- 10) o respiro do cabeçalho
//
// O CASO QUE CRIOU ESTA CHECAGEM (06/11/2026). A dona do produto abriu o plano da aula 01 e
// disse o que se lê em duas linhas: «os botões estão colados na margem superior» e «o botão
// Abrir notação está completamente colado na linha». Medido, era literal: no estado PRESO o
// `h1` começava a **0,3px** da barra (0px no celular) e o botão acabava a **0px** da linha
// da sombra. A causa é uma só e não tem nada de visual: `position: sticky` + `top` põe a
// CAIXA encostada à barra e **descarta a margem** — o `margin-top: 8px` que ali estava só
// valia com a página no topo, e no estado que o professor mais vê (a rolar) ele desaparecia.
// O ar tem de ser `padding`, que mora DENTRO da caixa, e é a caixa que se prende.
//
// PORQUE É UMA CHECAGEM, E NÃO SÓ UM COMENTÁRIO NA FOLHA. Nove checagens passavam com o
// defeito à vista: a «Peça» pergunta se a classe é desenhada, a «Forma» se algum valor foi
// copiado, a «Aresta» se sobra um lado de moldura — nenhuma pergunta «quanto ar tem». O
// `experimentos/provar-titulo-e-barra.js` passou a medir a geometria num navegador (é a
// medida que vale), mas uma bancada corre quando alguém se lembra. Esta corre a cada commit,
// pelo `pre-commit`, e é a que impede o valor de voltar a 0 sem ninguém notar.
//
// A REGRA. O respiro é `--esp-3` (12px) ou mais, acima e abaixo, em dois lugares que o
// mesmo mecanismo prende: `header.doc` (documentos pandoc) e `.titulo-fixo` (o lançamento).
// E não pode ser margem: uma margem no `header.doc` não separa nada no estado preso — é o
// erro que esta checagem existe para não repetir.
const RESPIRO_MINIMO = 12;
function conferirRespiro() {
  const problemas = [];
  const texto = semComentarios(fs.readFileSync(fonte, 'utf8'), 'ciclo.css');

  /** Os tokens de espaço, em px — a escala é a fonte, e não se repete o número. */
  const escala = new Map();
  for (const m of texto.matchAll(/(--esp-\d)\s*:\s*(\d+)px/g)) escala.set(m[1], Number(m[2]));

  /** Um valor de espaçamento em px, resolvido pelo token quando ele é um token. */
  const emPx = (valor) => {
    const v = (valor || '').trim();
    if (!v) return null;
    const token = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(v);
    if (token) return escala.has(token[1]) ? escala.get(token[1]) : null;
    const px = /^(\d+(?:\.\d+)?)px$/.exec(v);
    return px ? Number(px[1]) : null;
  };

  /** O comprimento de um `padding` em shorthand: 1 a 4 valores, na ordem do CSS. */
  const doShorthand = (valor) => {
    const partes = (valor || '').trim().split(/\s+(?![^()]*\))/);
    if (!partes.length) return { topo: null, fundo: null };
    const topo = partes[0];
    const fundo = partes.length === 1 ? partes[0]
      : partes.length === 2 ? partes[0]
        : partes.length === 3 ? partes[2] : partes[2];
    return { topo, fundo };
  };

  /** A última declaração de cada propriedade nas regras cujo seletor toca o alvo. */
  const arDoAlvo = (alvo) => {
    const achado = { topo: null, fundo: null, margemTopo: null, de: '' };
    for (const m of texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const seletores = m[1].split(',');
      // SÓ O COMPOSTO FINAL: `header.doc h1 { padding-bottom: 8px }` não é o ar do cabeçalho —
      // é o do título dentro dele. Medir o seletor inteiro dava 8px e 4px, e reprovava o certo.
      if (!seletores.some((s) => new RegExp(alvo + '(?![\\w-])').test(alvoDaRegra(s)))) continue;
      for (const d of m[2].split(';')) {
        const i = d.indexOf(':');
        if (i < 0) continue;
        const prop = d.slice(0, i).trim().toLowerCase();
        const val = d.slice(i + 1).trim();
        if (!prop || !val) continue;
        if (prop === 'padding') {
          const s = doShorthand(val);
          achado.topo = s.topo; achado.fundo = s.fundo;
        } else if (prop === 'padding-top') achado.topo = val;
        else if (prop === 'padding-bottom') achado.fundo = val;
        else if (prop === 'margin-top') achado.margemTopo = val;
        // O SHORTHAND DO `margin` TAMBÉM CONTA: `.rodape { margin: 40px auto 0 }` é o ar de
        // cima do rodapé, e ler só `margin-top` dizia «nenhum» onde havia 40px.
        else if (prop === 'margin') achado.margemTopo = doShorthand(val).topo;
        achado.de = m[1].trim().replace(/\s+/g, ' ');
      }
    }
    return achado;
  };

  const medidos = [];
  for (const [alvo, nome] of [['header\\.doc', 'header.doc'], ['\\.titulo-fixo', '.titulo-fixo']]) {
    const ar = arDoAlvo(alvo);
    const topo = emPx(ar.topo);
    const fundo = emPx(ar.fundo);
    medidos.push({ nome, topo, fundo });
    if (topo == null || fundo == null) {
      problemas.push(`Respiro: «${nome}» não declara o ar do cabeçalho — ` +
        `\`padding-top\` e \`padding-bottom\` têm de ser var(--esp-3) ou mais (ver «O cabeçalho ` +
        'respira» em IDENTIDADE-VISUAL.md)');
      continue;
    }
    if (topo < RESPIRO_MINIMO || fundo < RESPIRO_MINIMO) {
      problemas.push(`Respiro: «${nome}» guarda ${topo}px acima e ${fundo}px abaixo — o mínimo ` +
        `é ${RESPIRO_MINIMO}px (\`--esp-3\`). Abaixo disso o título encosta na barra e o último ` +
        'controle encosta na linha da sombra, que é o defeito de 06/11/2026');
    }
    // O AR NÃO PODE SER MARGEM: no estado preso o `position: sticky` descarta-a, e o
    // cabeçalho fica colado à barra exactamente quando o professor está a ler.
    const margem = emPx(ar.margemTopo);
    if (margem && margem > (topo || 0)) {
      problemas.push(`Respiro: «${nome}» separa-se da barra com \`margin-top: ${ar.margemTopo}\` e ` +
        'não com padding — no estado preso a margem é descartada e o título encosta na barra');
    }
  }

  /* ---- 10b) A FAIXA DO RODAPÉ — o ar de dentro é da PEÇA (06/11/2026).
   *
   * O DEFEITO, e é o mesmo do cabeçalho com outra roupa. A caixa da faixa
   * (`header.doc, main, footer.rodape, .rodape { … }`) nomeava o rodapé, e `footer.rodape`
   * pesa (0,1,1) — mais do que o `.rodape` da peça (0,1,0), que vem depois no arquivo. O
   * resultado, medido: o rodapé saía com `margin-top: 0` e `padding-top: 0` enquanto a peça
   * declarava **40px** e **16px**, e o texto ficava **5px** abaixo do próprio filete. É
   * exactamente «colado na linha», e não se vê numa captura de perto: vê-se lado a lado com
   * o que a peça diz.
   *
   * A REGRA. A linha da faixa (largura e centragem) não pode nomear `footer.rodape` — o
   * rodapé nomeia-se uma vez, em `.rodape`, com o box model completo. E a peça declara o ar:
   * 16px acima do texto (o mínimo é 12, `--esp-3`) e 24px antes do filete (o mínimo é 24,
   * `--esp-5`) — abaixo disso o filete encosta no último parágrafo. */
  for (const m of texto.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const seletores = m[1].split(',').map((x) => x.trim());
    if (!seletores.includes('footer.rodape')) continue;
    const corpo = m[2];
    if (/(^|;)\s*(padding|margin)\s*:/.test(corpo)) {
      problemas.push('Respiro: a regra «' + m[1].trim().replace(/\s+/g, ' ') + '» define o box ' +
        'model de `footer.rodape` — e `footer.rodape` pesa mais do que `.rodape`, e é o `.rodape` ' +
        'que tem o ar. Tire `footer.rodape` desta regra (o defeito de 06/11/2026: o rodapé saía ' +
        'com margin-top 0 e padding-top 0, e o texto a 5px do filete)');
    }
  }
  const rodape = arDoAlvo('\\.rodape');
  const arDoRodape = emPx(rodape.topo);
  const antesDoFilete = emPx(rodape.margemTopo);
  if (arDoRodape == null || arDoRodape < RESPIRO_MINIMO) {
    problemas.push('Respiro: o `.rodape` guarda ' + (arDoRodape == null ? 'nenhum ar' : arDoRodape + 'px') +
      ' entre o filete e o texto — o mínimo é ' + RESPIRO_MINIMO + 'px (`--esp-3`)');
  }
  if (antesDoFilete == null || antesDoFilete < 24) {
    problemas.push('Respiro: o `.rodape` guarda ' + (antesDoFilete == null ? 'nenhum ar' : antesDoFilete + 'px') +
      ' entre o conteúdo e o filete — o mínimo é 24px (`--esp-5`); sem ele o filete encosta no ' +
      'último parágrafo do documento (medido: 0,4px)');
  }

  /* ---- 10c) O AR DEPOIS DA FAIXA DO CABEÇALHO — uma vez, no contentor (06/11/2026).
   *
   * Medido nas nove páginas do pacote: 32px nos documentos que começam por um `##`, 8px nos
   * que começam por prosa. A diferença não vinha de decisão nenhuma — vinha de o vão ser o
   * `margin-top` do primeiro filho. A regra passa a ser do `.conteudo`, e o primeiro filho
   * perde a margem para não haver dois responsáveis. */
  const arDaColuna = /header\.doc\s*\+\s*main\s*>\s*\.conteudo\s*\{[^}]*padding-top\s*:\s*([^;}]+)/
    .exec(texto);
  const valDaColuna = arDaColuna ? emPx(arDaColuna[1]) : null;
  if (valDaColuna == null || valDaColuna < 24) {
    problemas.push('Respiro: a coluna de leitura não declara o ar depois da faixa do cabeçalho ' +
      '(`header.doc + main > .conteudo { padding-top: … }`) — sem ele o vão é o `margin-top` do ' +
      'primeiro bloco, e sai 32px nos documentos que abrem por `##` e 8px nos que abrem por prosa');
  }
  if (!/\.conteudo\s*>\s*:first-child\s*\{[^}]*margin-top\s*:\s*0/.test(texto)) {
    problemas.push('Respiro: falta o par do ar da coluna — `.conteudo > :first-child ' +
      '{ margin-top: 0 }`. Sem ele o vão é somado à margem do primeiro bloco, e o ar deixa de ser um só');
  }

  for (const p of problemas) erros.push(p);
  if (!problemas.length) {
    ok.push('Respiro: o cabeçalho declara ' + medidos.map((m) => `${m.nome} ${m.topo}/${m.fundo}px`).join(', ')
      + ' de ar acima e abaixo, em padding — o mínimo é ' + RESPIRO_MINIMO + 'px; o rodapé guarda '
      + arDoRodape + 'px do filete ao texto e ' + antesDoFilete + 'px do conteúdo ao filete; e a '
      + 'coluna de leitura começa ' + valDaColuna + 'px abaixo da faixa');
  }
}
conferirRespiro();

// ------------------------------------------- 20) a seta de abrir e fechar
//
// O QUE ESTA CHECAGEM IMPEDE (22/11/2026). Ela viu a seta grande e redonda nos Bastidores — nas
// Salas, nos Professores, nas Alunas, na Audição — e disse: «Vamos adotar isso como padrão […]
// onde é que vai ser padrão esse botão? Nesses títulos que a gente tem no contexto […] e nos
// demais títulos. Padroniza isso para deixar do mesmo jeito». E pediu que ficasse registado:
// «isso é algo que tem que ser preservado para a gente não estar toda hora ajustando de novo a
// identidade visual».
//
// A PEÇA EXISTE EM DUAS FOLHAS, e é essa a razão da checagem. Ela é `.alternar-form` no
// `<style>` da Produção (os Bastidores) e `.secao-dobra` em `tools/templates/ciclo.css` (o
// pacote). São duas folhas porque as duas superfícies não partilham ficheiro de estilo — a
// Produção injeta o seu. Duas declarações da mesma peça é exactamente o que diverge à primeira
// correcção: alguém arredonda uma e não a outra, e passam a existir duas setas parecidas no
// mesmo produto.
//
// A REGRA QUE SE MEDE são os QUATRO números que fazem a peça ser a peça: o lado (2rem), o raio
// (999px), o filete (1px) e o glifo (.9rem). O resto — as cores — sai dos tokens da folha, e o
// `--borda-campo` já é o mesmo dos dois lados. Não se comparam classes nem nomes: compara-se o
// que a pessoa vê.
const GEOMETRIA_DA_SETA = ['width', 'height', 'border-radius', 'border', 'font'];
function geometriaDa(classe, css) {
  /* TODAS as regras da classe, somadas na ordem — é o que o browser faz. Ler só a primeira
     encontrava o `.alternar-form{margin-top:.3rem}` (o ajuste fino, que não traz a geometria) e
     comparava cinco campos vazios contra cinco certos: a checagem reprovava o próprio produto
     que ela existe para defender. */
  const re = new RegExp('\\.' + classe + '\\s*\\{([^}]*)\\}', 'g');
  const lido = {};
  let m;
  let achou = false;
  while ((m = re.exec(css)) !== null) {
    achou = true;
    for (const par of m[1].split(';')) {
      const i = par.indexOf(':');
      if (i < 0) continue;
      lido[par.slice(0, i).trim()] = par.slice(i + 1).trim();
    }
  }
  if (!achou) return null;
  const saida = {};
  for (const chave of GEOMETRIA_DA_SETA) saida[chave] = lido[chave] == null ? '' : lido[chave];
  return saida;
}
function conferirSeta() {
  const problemas = [];
  const daFolha = geometriaDa('secao-dobra', fs.readFileSync(fonte, 'utf8'));
  if (!daFolha) {
    problemas.push('Seta: a folha não declara `.secao-dobra` — é a peça que abre e fecha as '
      + 'secções do documento, e sem ela o botão fica sem desenho');
  }
  // A declaração dos Bastidores vem do que o motor SERVE, e não de um comentário: é a única
  // forma de medir o que a página dele usa.
  let daProducao = null;
  try {
    const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
    const html = bastidores.paginaProducao(
      'x', { professor: 'x', ciclo: '01', query: '' }, [], [], '', '', [], [], [], [], [], []);
    daProducao = geometriaDa('alternar-form', html);
  } catch (e) {
    problemas.push('Seta: não foi possível ler a página de Produção para medir a `.alternar-form` ('
      + e.message + ')');
  }
  if (daFolha && daProducao) {
    const divergentes = GEOMETRIA_DA_SETA.filter((k) => daFolha[k] !== daProducao[k]);
    if (divergentes.length) {
      problemas.push('Seta: a peça diverge entre as duas folhas — '
        + divergentes.map((k) => `${k}: «${daFolha[k]}» na folha e «${daProducao[k]}» nos Bastidores`).join('; ')
        + '. A seta de abrir e fechar é UMA: 2rem de lado, redonda, filete de 1px e o glifo em '
        + '.9rem. Uma peça desenhada duas vezes é a que diverge à primeira correcção');
    }
  }
  for (const p of problemas) erros.push(p);
  if (!problemas.length) {
    ok.push('Seta: a `.secao-dobra` da folha e a `.alternar-form` dos Bastidores são a MESMA peça — '
      + GEOMETRIA_DA_SETA.map((k) => `${k} ${daFolha[k]}`).join(', '));
  }
}
conferirSeta();

// -------------------------------------------------------------------- saída

for (const l of ok) console.log(`ok: ${l}`);
for (const a of avisos) console.log(`aviso: ${a}`);
for (const e of erros) console.error(`erro: ${e}`);
if (erros.length) {
  console.error(`\n${erros.length} problema(s). A identidade está em IDENTIDADE-VISUAL.md.`);
}
process.exit(erros.length ? 1 : 0);
