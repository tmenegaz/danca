'use strict';

/**
 * provar-tema.js — a aparência clara/noturna tem prova própria.
 *
 * Por que existe: o tema é a única parte da identidade que depende de estado e de
 * JavaScript. O `check-identidade.js` mede os pares de contraste dos dois temas, mas não
 * executa comportamento — um modo que não é aplicado passaria com o contraste verde.
 *
 * A APARÊNCIA MUDOU DE DONO em 18/10/2026 (decisão **C15**): era escolha do NAVEGADOR
 * (`localStorage`), passou a ser da **ESCOLA**, aplicada no SERVIDOR. Isto muda o que há
 * para provar, e é por isso que este ficheiro tem duas metades:
 *
 *   · o que RESTA do modelo antigo — o `assets/nav.js` continua a saber alternar a
 *     aparência num DOM de mentira, porque é ele que serve a RAIZ (a plataforma, que não
 *     é escola e não tem Produção onde pendurar a escolha);
 *   · o que o modelo novo EXIGE — que o `nav.js` **não** faça nada quando a fonte é a
 *     escola, que a barra das escolas já não traga botão, que as páginas servidas cheguem
 *     com o atributo posto, e que o anti-flash (a rede de quem abre o `.html` do disco)
 *     consulte a fonte ANTES de ler o navegador.
 *
 * O que esta prova confere, sem dependências:
 *
 *   1. o comportamento do `assets/nav.js` servido, num DOM de mentira: sem valor
 *      guardado fica clara; com `noturna` guardada, o atributo é aplicado; o clique
 *      alterna nos dois sentidos e PERSISTE; `aria-pressed` e o rótulo acompanham;
 *   2. o comportamento quando o `localStorage` LANÇA (modo privado / política): não
 *      quebra, fica clara, e o clique continua funcionando na aba;
 *   2b. **a escola manda**: com `data-modo-fonte` no `<html>`, o `nav.js` não age — nem lê,
 *      nem escreve, nem liga o botão — e o modo do servidor sobrevive à memória do navegador;
 *   3. página SEM navbar (a raiz não tem `.topnav`): o tema ainda funciona — o bloco
 *      do tema vem antes do `return` que protege a navegação;
 *   4. o CSS da fonte declara os dois temas, a impressão repõe a variante clara com
 *      `!important`, e a escolha NÃO depende de `prefers-color-scheme` (decisão
 *      registada no `IDENTIDADE-VISUAL.md`);
 *   5. o anti-flash está nas superfícies estáticas e nas geradas, sempre GUARDADO; o botão
 *      `.tema` já não existe no esqueleto da navbar nem em página nenhuma de escola, e
 *      continua — como exceção declarada — na raiz; e o servidor publica `data-modo` com
 *      `data-modo-fonte="escola"`, tanto na vista dos Bastidores como na ponte de produção.
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
    hasAttribute(n) { return Object.prototype.hasOwnProperty.call(el.atributos, n); },
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

function criarAmbiente({ navbar = true, armazenamento = 'memoria', modoDaEscola = null } = {}) {
  const html = criarElemento('html');
  // A ESCOLA DECIDIU: a página chega do servidor com o atributo posto. É este o estado das
  // páginas do Worker desde a C15, e o `data-modo-fonte` é a fronteira que o `nav.js` lê.
  if (modoDaEscola) {
    html.setAttribute('data-modo', modoDaEscola);
    html.setAttribute('data-modo-fonte', 'escola');
  }
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
// 2b. A ESCOLA MANDA (18/10/2026) — a decisão C15
//
// As páginas servidas pelo Worker chegam com `data-modo` no `<html>` e com
// `data-modo-fonte="escola"`. Nesse caso o `nav.js` NÃO age: nem lê o `localStorage`, nem
// escreve, nem liga o botão. Se agisse, a memória de um navegador usado antes desfaria em
// silêncio a escolha que vale para a escola inteira — e o sintoma seria o pior possível:
// cada pessoa veria uma pele diferente da que a escola escolheu, e nenhuma saberia por quê.
// --------------------------------------------------------------------------
{
  const env = criarAmbiente({ modoDaEscola: 'clara' });
  env.memoria.set('ciclo-modo', 'noturna'); // sobra de uma visita antiga, de antes da C15
  rodar(env);
  provar('a escola escolheu clara: a memória do navegador NÃO a desfaz',
    env.html.getAttribute('data-modo'), 'clara');
  provar('…e o atributo da fonte continua a dizer de quem é a decisão',
    env.html.getAttribute('data-modo-fonte'), 'escola');
}

{
  const env = criarAmbiente({ modoDaEscola: 'noturna' });
  // O navegador diz clara (o padrão de quem nunca clicou): ainda assim vale a noturna da escola.
  rodar(env);
  provar('a escola escolheu noturna: o servidor vence o navegador',
    env.html.getAttribute('data-modo'), 'noturna');
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
  // O «ANTI-FLASH» CONTINUA A EXISTIR — mas GUARDADO. Ele deixou de ser a forma de escolher
  // a aparência e passou a ser a rede de segurança de quem abre um `.html` direto do disco,
  // sem servidor: aí não há Worker a pôr o atributo, e a memória do navegador é a única
  // informação que existe. A guarda (`!hasAttribute('data-modo-fonte')`) é o que impede que
  // essa rede desfaça, nas páginas SERVIDAS, a decisão da escola.
  const superficies = [
    'tools/templates/ciclo.html',
    'tools/templates/lancamento.html',
    'raiz/index.html',
    'porta/index.html',
  ];
  const faltam = superficies.filter((rel) => {
    const t = fs.readFileSync(path.join(raiz, rel), 'utf8');
    return !/ciclo-modo/.test(t);
  });
  provar('o anti-flash está em todas as superfícies estáticas', faltam, []);

  const semGuarda = superficies.filter((rel) => {
    const t = fs.readFileSync(path.join(raiz, rel), 'utf8');
    const linha = t.split('\n').find((l) => l.indexOf('ciclo-modo') >= 0) || '';
    return linha.indexOf('data-modo-fonte') < 0;
  });
  provar('…e cada um consulta a fonte ANTES de ler o navegador', semGuarda, []);

  // AS PÁGINAS JÁ GERADAS: mesma guarda, para que o pacote e a fonte não divergam.
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
  const semGuardaGerada = geradas.filter(([, html]) => {
    const linha = html.split('\n').find((l) => l.indexOf('ciclo-modo') >= 0) || '';
    return linha.indexOf('data-modo-fonte') < 0;
  }).map(([rel]) => rel);
  provar('as páginas geradas também consultam a fonte', semGuardaGerada, []);
}

{
  // O BOTÃO DO TEMA SAIU DA BARRA (18/10/2026). A decisão C15 é «a preferência é da escola»,
  // e uma escolha que vale para todos não pode ter, ao lado, um botão que a desfaça por
  // visitante. O controlo passou a viver na Produção — que é onde só a escola e o professor
  // principal entram. O que se prova aqui é a AUSÊNCIA: um botão que voltasse ao esqueleto
  // reintroduziria, sem ninguém notar, a preferência por navegador.
  const { navSistema } = require('../tools/templates/nav-html.js');
  const nav = navSistema({ anamnese: 'a', plano: 'b', po: 'c' });
  provar('o esqueleto da navbar NÃO traz botão de tema', nav.includes('class="tema"'), false);
  provar('…e não sobra o atributo do estado', nav.includes('aria-pressed'), false);

  const comBotao = geradas => geradas.filter(([, html]) => html.includes('class="tema"')).map(([rel]) => rel);
  // (as páginas geradas já estão em memória do bloco anterior; recolhem-se de novo para que
  // este bloco seja legível sozinho)
  const paginas = [];
  const dirProf = path.join(raiz, 'professores');
  for (const prof of fs.readdirSync(dirProf)) {
    const dirCiclos = path.join(dirProf, prof, 'ciclos');
    if (!fs.existsSync(dirCiclos)) continue;
    for (const e of fs.readdirSync(dirCiclos, { withFileTypes: true })) {
      if (!e.isDirectory() || !e.name.startsWith('ciclo-')) continue;
      for (const pagina of ['index.html', 'plano-observacao/index.html']) {
        const p = path.join(dirCiclos, e.name, pagina);
        if (!fs.existsSync(p)) continue;
        paginas.push([path.relative(raiz, p), fs.readFileSync(p, 'utf8')]);
      }
    }
  }
  provar('nenhuma página gerada traz o botão', comBotao(paginas), []);

  // A RAIZ É A EXCEÇÃO DECLARADA: ela não é uma escola — é a plataforma, que serve a criação
  // de escolas e não tem Produção onde pendurar a escolha. Fica com o botão, e é a ÚNICA.
  const raizHtml = fs.readFileSync(path.join(raiz, 'raiz/index.html'), 'utf8');
  provar('a raiz mantém o botão (não é escola, não tem Produção)', raizHtml.includes('class="tema"'), true);
  provar('…e carrega o comportamento compartilhado', raizHtml.includes('assets/nav.js'), true);
}

{
  // O SERVIDOR DECIDE, E DIZ DE QUEM É A DECISÃO. A vista dos Bastidores emite o atributo e
  // o `data-modo-fonte`; sem ele, o `nav.js` voltaria a mandar no navegador e a escolha da
  // escola perderia para uma memória antiga. E o anti-flash por `localStorage` SAIU de lá:
  // já não há nada para evitar, porque o atributo chega pronto.
  const fonte = fs.readFileSync(path.join(raiz, 'motor/servidor/bastidores.js'), 'utf8');
  // O ATRIBUTO PASSOU A SER DOIS (18/10/2026): `data-modo` e `data-paleta`, e o segundo
  // entra antes do `data-modo-fonte`. A asserção media a ordem antiga — e uma prova que fixa
  // a ordem das palavras é uma prova que quebra quando a frase muda, não quando a regra muda.
  // O que se mede agora é o que importa: os TRÊS atributos estão no `<html>` da vista.
  provar('a vista dos Bastidores publica o modo no <html>',
    fonte.includes(`data-modo="' + modo + '"`), true);
  provar('…e a família, no mesmo <html>',
    fonte.includes(`data-paleta="' +`) && fonte.includes('esc(ap.paleta)'), true);
  provar('…e a fonte, que é o que impede o navegador de mandar',
    fonte.includes(`data-modo-fonte="escola">`), true);
  provar('…e não deixou o anti-flash por localStorage',
    /localStorage\.getItem\("ciclo-modo"\)/.test(fonte), false);

  const prod = fs.readFileSync(path.join(raiz, 'motor/servidor/producao.js'), 'utf8');
  provar('a ponte de produção injeta o modo no que serve',
    prod.includes('comAparencia') && prod.includes("data-modo-fonte=\"escola\""), true);
}

// --------------------------------------------------------------------------
console.log('\nprovar-tema: ' + passou + ' de ' + (passou + falhou) + ' passaram');
process.exit(falhou ? 1 : 0);
