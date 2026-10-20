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
compararPacotes();

// A RAIZ também serve cópias da folha e do nav, e não é um pacote de ciclo: as duas são
// geradas por `tools/gerar-raiz.sh`. Antes, a cópia era manual e nada a conferia — o modo
// de falha que o contrato diz ter eliminado.
//
// O `nav.js` faltava nesta comparação (17/10/2026): só a folha era medida, e o
// `gerar-raiz.sh` copia as DUAS. Uma raiz com o nav velho passava no contrato — e agora é
// este contrato que autoriza o `deploy-raiz.yml` a publicar, sem passo de geração no
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
  'pag-ant': 'o «anterior» da paginação, que o script procura e desabilita',
  'pag-prox': 'o «próximo» da paginação, idem',
  'pag-info': 'o contador da paginação, que o script escreve',
  menu: 'o `<details>` da barra, que `nav.js` abre e fecha (o desenho é de `summary`)',
  'ctx-turma': 'o bloco do contexto da turma na porta, que o script preenche',
  filtros: 'o grupo de filtros do lançamento, que o script lê',
  // — ganchos de composição: o desenho é do PAI (o grid da secção), e o filho só existe
  //   para o grid ter onde pôr a coluna
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
    lista.push(['bastidores/producao', bastidores.paginaProducao(
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
    erros.push('Peça: não foi possível gerar a página de estado (' + e.message + ')');
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

// -------------------------------------------------------------------- saída

for (const l of ok) console.log(`ok: ${l}`);
for (const a of avisos) console.log(`aviso: ${a}`);
for (const e of erros) console.error(`erro: ${e}`);
if (erros.length) {
  console.error(`\n${erros.length} problema(s). A identidade está em IDENTIDADE-VISUAL.md.`);
}
process.exit(erros.length ? 1 : 0);
