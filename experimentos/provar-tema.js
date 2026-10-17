'use strict';

/**
 * provar-tema.js — a aparência clara/noturna tem prova própria.
 *
 * Por que existe: o tema é a única parte da identidade que depende de JavaScript e de
 * estado do NAVEGADOR. O `check-identidade.js` mede os pares de contraste dos dois
 * temas, mas não executa comportamento — e um botão que não troca, ou um `data-modo`
 * que não é aplicado, passaria com o contraste verde.
 *
 * O que esta prova confere, sem dependências:
 *
 *   1. o comportamento do `assets/nav.js` servido, num DOM de mentira: sem valor
 *      guardado fica clara; com `noturna` guardada, o atributo é aplicado; o clique
 *      alterna nos dois sentidos e PERSISTE; `aria-pressed` e o rótulo acompanham;
 *   2. o comportamento quando o `localStorage` LANÇA (modo privado / política): não
 *      quebra, fica clara, e o clique continua funcionando na aba;
 *   3. página SEM navbar (a raiz não tem `.topnav`): o tema ainda funciona — o bloco
 *      do tema vem antes do `return` que protege a navegação;
 *   4. o CSS da fonte declara os dois temas, a impressão repõe a variante clara com
 *      `!important`, e a escolha NÃO depende de `prefers-color-scheme` (decisão
 *      registada no `IDENTIDADE-VISUAL.md`);
 *   5. o anti-flash está em todas as superfícies e o botão `.tema` existe no esqueleto
 *      da navbar e na raiz.
 *
 *   uso: node experimentos/provar-tema.js
 */

const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const NAV = path.join(raiz, 'tools/templates/nav.js');
const CSS = path.join(raiz, 'tools/templates/ciclo.css');

let passou = 0;
let falhou = 0;

function provar(nome, obtido, esperado) {
  const igual = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (igual) {
    passou++;
    console.log('ok     ' + nome);
  } else {
    falhou++;
    console.log('FALHOU ' + nome);
    console.log('  obtido:   ' + JSON.stringify(obtido));
    console.log('  esperado: ' + JSON.stringify(esperado));
  }
}

// --------------------------------------------------------------------------
// Um DOM mínimo, honesto no que o nav.js usa: querySelector, classList,
// atributos, textContent, addEventListener e o documentElement.
// --------------------------------------------------------------------------
function criarElemento(tag) {
  const el = {
    tagName: tag,
    className: '',
    texto: '',
    atributos: {},
    ouvintes: {},
    classList: null,
    offsetHeight: 80,
    style: { propriedades: {}, setProperty(nome, valor) { el.style.propriedades[nome] = valor; } },
    get textContent() { return el.texto; },
    set textContent(v) { el.texto = String(v); },
    getAttribute(n) { return Object.prototype.hasOwnProperty.call(el.atributos, n) ? el.atributos[n] : null; },
    setAttribute(n, v) { el.atributos[n] = String(v); },
    removeAttribute(n) { delete el.atributos[n]; },
    addEventListener(tipo, fn) { (el.ouvintes[tipo] = el.ouvintes[tipo] || []).push(fn); },
    disparar(tipo) { (el.ouvintes[tipo] || []).forEach((fn) => fn({ target: el })); },
    contains() { return false; },
  };
  el.classList = {
    aberto: false,
    toggle(classe) {
      if (classe !== 'aberto') return false;
      el.classList.aberto = !el.classList.aberto;
      return el.classList.aberto;
    },
    remove() { el.classList.aberto = false; },
    add() { el.classList.aberto = true; },
  };
  return el;
}

function criarAmbiente({ navbar = true, armazenamento = 'memoria' } = {}) {
  const html = criarElemento('html');
  const tema = criarElemento('button');
  const nav = navbar ? criarElemento('nav') : null;
  const hamburger = navbar ? criarElemento('button') : null;

  const elementos = new Map();
  if (nav) elementos.set('.topnav', nav);
  if (hamburger) elementos.set('.hamburger', hamburger);
  elementos.set('.tema', tema);

  const memoria = new Map();
  const localStorage = {
    getItem(chave) {
      if (armazenamento === 'lanca') throw new Error('SecurityError');
      return memoria.has(chave) ? memoria.get(chave) : null;
    },
    setItem(chave, valor) {
      if (armazenamento === 'lanca') throw new Error('SecurityError');
      memoria.set(chave, String(valor));
    },
  };

  const documento = {
    documentElement: html,
    querySelector(sel) { return elementos.get(sel) || null; },
    querySelectorAll() { return []; },
    addEventListener() {},
  };

  const janela = {
    matchMedia() { return { matches: true, addEventListener() {} }; },
    addEventListener() {},
  };

  return { html, tema, nav, hamburger, documento, janela, localStorage, memoria };
}

/** Roda o nav.js servido contra o ambiente. */
function rodar(env, contextoChamada) {
  const codigo = fs.readFileSync(NAV, 'utf8');
  // eslint-disable-next-line no-new-func
  new Function('document', 'window', 'localStorage', 'contextoChamada', codigo)(
    env.documento, env.janela, env.localStorage, contextoChamada
  );
}

// --------------------------------------------------------------------------
// 1–2. O comportamento do tema
// --------------------------------------------------------------------------
{
  const env = criarAmbiente();
  rodar(env);
  provar('sem valor guardado, começa clara', env.html.getAttribute('data-modo'), null);
  provar('o botão anuncia o estado clara', env.tema.getAttribute('aria-pressed'), 'false');
  provar('o rótulo diz o que o clique FAZ', env.tema.getAttribute('aria-label'),
    'Ativar a aparência noturna');

  env.tema.disparar('click');
  provar('o clique põe a página em noturna', env.html.getAttribute('data-modo'), 'noturna');
  provar('…e persiste a escolha', env.memoria.get('ciclo-modo'), 'noturna');
  provar('…e o botão acompanha', env.tema.getAttribute('aria-pressed'), 'true');
  provar('…e o rótulo vira o inverso', env.tema.getAttribute('aria-label'),
    'Ativar a aparência clara');

  env.tema.disparar('click');
  provar('o segundo clique volta à clara', env.html.getAttribute('data-modo'), null);
  provar('…e persiste a volta', env.memoria.get('ciclo-modo'), 'clara');
}

{
  const env = criarAmbiente();
  env.memoria.set('ciclo-modo', 'noturna');
  rodar(env);
  provar('valor guardado em noturna é aplicado ao abrir', env.html.getAttribute('data-modo'), 'noturna');
}

{
  const env = criarAmbiente({ armazenamento: 'lanca' });
  let erro = null;
  try { rodar(env); } catch (e) { erro = e.message; }
  provar('localStorage que lança não quebra a página', erro, null);
  provar('…e a página fica clara', env.html.getAttribute('data-modo'), null);

  let erroClique = null;
  try { env.tema.disparar('click'); } catch (e) { erroClique = e.message; }
  provar('…e o clique ainda funciona na aba', erroClique, null);
  provar('…aplicando a noturna', env.html.getAttribute('data-modo'), 'noturna');
}

{
  // A RAIZ não tem `.topnav`: o bloco do tema é ANTES do `return` da navegação.
  const env = criarAmbiente({ navbar: false });
  rodar(env);
  env.tema.disparar('click');
  provar('página sem navbar também troca o tema', env.html.getAttribute('data-modo'), 'noturna');
}

// --------------------------------------------------------------------------
// 3. O CSS: os dois temas, a impressão e a não-dependência do sistema
// --------------------------------------------------------------------------
{
  const css = fs.readFileSync(CSS, 'utf8');
  provar('a fonte declara a variante noturna', /\[data-modo="noturna"\]\s*\{/.test(css), true);
  provar('a noturna declara color-scheme', /\[data-modo="noturna"\][\s\S]*?color-scheme:\s*dark/.test(css), true);
  provar('a clara declara color-scheme', /:root\s*\{[\s\S]*?color-scheme:\s*light/.test(css), true);

  const impressao = css.slice(css.indexOf('@media print'));
  provar('a impressão repõe o fundo claro', /--fundo:\s*#fbf8f3\s*!important/.test(impressao), true);
  provar('a impressão repõe o texto escuro', /--texto:\s*#1f1c1a\s*!important/.test(impressao), true);
  provar('a impressão vale também sob [data-modo]',
    /\[data-modo="noturna"\]\s*\{[\s\S]*?--texto:\s*#1f1c1a\s*!important/.test(impressao), true);

  // A decisão está escrita: a escolha é EXPLÍCITA, e o sistema operativo não manda.
  const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
  provar('a folha NÃO usa prefers-color-scheme', /prefers-color-scheme/.test(semComentarios), false);
}

// --------------------------------------------------------------------------
// 4. O anti-flash e o botão, em todas as superfícies
// --------------------------------------------------------------------------

/** A faixa [início, fim) do `.nav-links` — com profundidade, não com o primeiro `</div>`. */
function faixaDoPainel(html) {
  const abre = html.indexOf('<div class="nav-links"');
  if (abre < 0) return null;
  let i = abre + 4;
  let prof = 1;
  while (i < html.length) {
    const proxAbre = html.indexOf('<div', i);
    const proxFecha = html.indexOf('</div>', i);
    if (proxFecha < 0) return null;
    if (proxAbre >= 0 && proxAbre < proxFecha) { prof++; i = proxAbre + 4; }
    else { prof--; i = proxFecha + 6; if (prof === 0) return [abre, i]; }
  }
  return null;
}

function botaoForaDoPainel(html) {
  const botao = html.indexOf('class="tema"');
  if (botao < 0) return false;
  const faixa = faixaDoPainel(html);
  if (!faixa) return true;
  return botao < faixa[0] || botao >= faixa[1];
}
{
  const superficies = [
    'tools/templates/ciclo.html',
    'tools/templates/lancamento.html',
    'raiz/index.html',
    'porta/index.html',
    'motor/servidor/bastidores.js',
  ];
  const faltam = superficies.filter((rel) => {
    const t = fs.readFileSync(path.join(raiz, rel), 'utf8');
    return !/ciclo-modo/.test(t);
  });
  provar('o anti-flash está em todas as superfícies', faltam, []);

  const { navSistema } = require('../tools/templates/nav-html.js');
  const nav = navSistema({ anamnese: 'a', plano: 'b', po: 'c' });
  provar('o esqueleto traz o botão do tema', nav.includes('class="tema"'), true);
  provar('…com aria-pressed', nav.includes('aria-pressed="false"'), true);
  // O painel `.nav-links` colapsa no celular: entre a abertura dele e o botão tem de
  // haver o `</div>` que o FECHA. Sem esta conferência, o botão ficaria inalcançável
  // com o menu fechado — e a prova passaria (foi o que aconteceu na primeira versão).
  provar('…e o botão fica FORA do painel que colapsa', botaoForaDoPainel(nav), true);

  // As páginas JÁ GERADAS também: o gerador emite a nav, e uma ordem errada aqui só
  // apareceria no celular — com o menu fechado, o botão ficaria inalcançável.
  //
  // A coleta é de TODAS as páginas, e não só das que já têm o botão. Antes ela era
  // `if (html.includes('class="tema"')) geradas.push(...)` — o filtro tornava a
  // asserção vácua: uma página SEM o botão simplesmente não era provada, e a escola
  // criada pelo `criar-escola.sh` passou em verde sem nunca poder escurecer.
  const geradas = [];
  const dirProf = path.join(raiz, 'professores');
  for (const prof of fs.readdirSync(dirProf)) {
    const dirCiclos = path.join(dirProf, prof, 'ciclos');
    if (!fs.existsSync(dirCiclos)) continue;
    for (const e of fs.readdirSync(dirCiclos, { withFileTypes: true })) {
      if (!e.isDirectory() || !e.name.startsWith('ciclo-')) continue;
      for (const pagina of ['index.html', 'plano-observacao/index.html']) {
        const p = path.join(dirCiclos, e.name, pagina);
        if (!fs.existsSync(p)) continue;
        geradas.push([path.relative(raiz, p), fs.readFileSync(p, 'utf8')]);
      }
    }
  }
  const semBotao = geradas.filter(([, html]) => !html.includes('class="tema"')).map(([rel]) => rel);
  provar('toda página gerada traz o botão da aparência', semBotao, []);
  const fora = geradas.filter(([, html]) => !botaoForaDoPainel(html)).map(([rel]) => rel);
  provar('o botão está fora do painel também nas páginas geradas', fora, []);

  const raizHtml = fs.readFileSync(path.join(raiz, 'raiz/index.html'), 'utf8');
  provar('a raiz tem o botão (não tem navbar para hospedá-lo)', raizHtml.includes('class="tema"'), true);
  provar('…e carrega o comportamento compartilhado', raizHtml.includes('assets/nav.js'), true);
}

// --------------------------------------------------------------------------
console.log('\nprovar-tema: ' + passou + ' de ' + (passou + falhou) + ' passaram');
process.exit(falhou ? 1 : 0);
