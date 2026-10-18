#!/usr/bin/env node
'use strict';

/**
 * provar-selo.js — a MESMA etiqueta tem de parecer a mesma em toda a tela.
 *
 * Por que existe (18/10/2026). O dono do produto abriu os Bastidores e a anamnese e viu a
 * etiqueta «livre» de dois jeitos: âmbar numa, cinza na outra. Estava certo — e o defeito
 * não era de cor, era de DONO. A folha declara o selo uma vez; `porta/index.html`
 * redeclarava quatro estados mudando só `border-color`/`color`. Como o `<style>` da página
 * vem depois de `/assets/style.css`, o resultado era um selo METADE da folha e METADE da
 * página: em `.vinculada`, o fundo continuava roxo (da folha) e a borda e o texto viravam
 * bordô (da página). Ninguém via a divergência porque cada metade vinha de um lugar.
 *
 * `tools/check-identidade.js` (checagem «Forma») agora reprova a REDECLARAÇÃO. Esta prova
 * mede a outra metade: o que a pessoa vê. Ela não lê o CSS — ela RENDERIZA as superfícies,
 * injeta os mesmos estados em todas e compara a geometria e a cor COMPUTADAS.
 *
 * O que se prova:
 *
 *   1. cada estado de `.selo` tem UMA assinatura (fundo, borda, cor, raio, tipo, peso,
 *      caixa, padding) em todas as superfícies que carregam a folha — Bastidores, anamnese,
 *      plano de ensino e plano de observação;
 *   2. a assinatura é a MESMA nos dois temas (clara e noturna) depois de resolvidos os
 *      papéis — o que muda é o valor do papel, não a forma;
 *   3. `.livre` e `.solta` são o MESMO desenho (a palavra é a mesma; o nome vem do dado);
 *      `.derivada` e `.vinculada` também; `.legado` é distinto de propósito;
 *   4. as páginas que DECLARAM a identidade (ficha e páginas de estado, servidas sem
 *      `<link>`) desenham o cartão, o botão e o código com as MESMAS medidas da folha.
 *
 * А 4 é a que teria pego o `border-radius: 4px` do cartão da ficha e o `6px` do botão da
 * página de estado — dois números que não existiam em nenhum outro lugar do sistema.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-selo.js
 */

const path = require('path');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const FONTE = path.join(raiz, 'tools/templates/ciclo.css');

let puppeteer;
try {
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
} catch {
  console.error('provar-selo: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
  process.exit(1);
}
const executavel = process.env.CHROME_PATH
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!executavel) {
  console.error('provar-selo: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
  process.exit(1);
}

// ---------------------------------------------------------------- as superfícies
//
// Só as que CARREGAM a folha entram na comparação do selo: nas que a declaram (ficha,
// estados) o selo não existe, e o que se mede lá é o cartão e o botão.

const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const ficha = require(path.join(raiz, 'motor/nucleo/ficha-html.js'));
const estado = require(path.join(raiz, 'motor/servidor/estado-html.js'));

const TURMAS = [
  { id: 'tu1', nome: 'Balé nível 1', frequencia: 2, dias: ['seg', 'qua'], duracaoMin: 60,
    periodoInicio: '2026-02-01', periodoFim: '2026-06-30' },
];
const PAGINA_PRODUCAO = bastidores.paginaProducao(
  'fita', { professor: 'tiago-menegaz', ciclo: '01', query: '' },
  [{ nome: 'Leticia', slug: 'leticia' }], ['Vavá'], 'Tiago', 'tiago-menegaz',
  TURMAS, [], { tu1: ['t1'] }, [], ['Régua 1'],
  [{ professor: 'leticia', turma: 'Balé nível 1', ciclo: '01' }]);

// A PÁGINA DE REFERÊNCIA: só a folha, e um representante de cada componente. É dela que
// saem as medidas «da fonte» contra as quais as declarantes são comparadas.
const REFERENCIA = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/style.css"></head><body><main>
<div class="caixa"><p>cartão</p></div>
<div class="caixa nota"><p>cartão de leitura</p></div>
<pre>bloco</pre>
<button type="button">secundário</button>
<a class="acao" href="#">principal</a>
<p><code>código</code></p>
<pre>bloco</pre>
</main></body></html>`;

// A FICHA COM CÓDIGO: a ficha em branco não traz `code` nem `pre`; sem eles a prova
// mediria `null` e passaria sem comparar nada. O único `pre` que a ficha emite é a
// MOLDURA (o desenho ASCII do ciclo, `pre.moldura`), e é com ela que a comparação faz
// sentido — um `pre` genérico não existe neste renderizador.
const FICHA = ficha.paginaDaFicha(
  '## Secção\n\nUm `código` no meio da prosa.\n\n┌────┐\n│ cx │\n└────┘\n',
  { aba: 'Ficha', titulo: 'Ficha', sub: 'prova' });

const ESTADO = estado.paginaEstado('Escola desabilitada',
  '<p>Escola: <code>fita</code></p><div class="acoes"><a href="/">Voltar</a></div>');

const MAPA = {
  ok: true, nos: [], obrigatorios: 0, respondidas: 0, total: 0, tituloCabecalho: 'Prova',
};

// CONTROLE NEGATIVO: serve a porta de HEAD — a que tinha os quatro `.selo` redeclarados.
// Sem isto, uma prova que «passa» pode estar a passar porque não mede nada: é o padrão
// que o `provar-cabecalho-do-ato.js` fixou, e o que separa uma prova de um carimbo.
const NEGATIVO = process.argv.includes('--controle-negativo');
const PORTA = NEGATIVO
  ? execSync('git show HEAD:porta/index.html', { cwd: raiz, maxBuffer: 64 * 1024 * 1024 }).toString()
  : fs.readFileSync(path.join(raiz, 'porta/index.html'), 'utf8');

// O BANCO IMITA O WORKER — e é isto que o torna honesto (18/10/2026).
//
// Desde a C15, a aparência é da ESCOLA e chega no `<html>`, posto pelo Worker (`comAparencia`).
// Este banco servia os ficheiros crus: com o botão da barra, isso bastava, porque era o
// `nav.js` que escurecia a página. Sem o botão, um banco que não injete o atributo põe as
// quatro superfícies em peles diferentes — Bastidores clara, porta a ler o `localStorage` — e
// a prova acusa uma divergência que **não existe no ar**. O remédio não é afrouxar a prova:
// é o banco usar o MESMO código do Worker, que é o que se quer medir.
const { comAparencia } = require(path.join(raiz, 'motor/servidor/producao.js'));

function servir() {
  const srv = http.createServer(async (req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    // As páginas de ESCOLA saem como saem do Worker: com o modo no `<html>`.
    const okEscola = async (html) => {
      const r = await comAparencia(new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }), 'clara');
      ok('text/html; charset=utf-8', await r.text());
    };
    if (caminho.endsWith('/api/bastidores/professores')) {
      return ok('application/json', JSON.stringify({ ok: true, escola: 'fita',
        professores: [{ nome: 'Tiago Menegaz', slug: 'tiago-menegaz' }] }));
    }
    if (caminho.endsWith('/api/bastidores/alunas')) {
      return ok('application/json', JSON.stringify({ ok: true, alunas: ['Ana'] }));
    }
    if (caminho.endsWith('/api/planos')) {
      return ok('application/json', JSON.stringify({ ok: true, opcoes: [
        { valor: 'p1', rotulo: 'Balé nível 1', turma: 'Balé nível 1', escola: 'fita' }] }));
    }
    if (caminho.indexOf('/api/') !== -1) {
      return ok('application/json', JSON.stringify(Object.assign({ opcoes: [] }, MAPA)));
    }
    if (caminho.endsWith('/assets/style.css')) return ok('text/css; charset=utf-8', fs.readFileSync(FONTE));
    if (caminho.endsWith('/assets/nav.js')) return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    if (caminho.endsWith('/assets/lib-cifra.js')) return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/lib-cifra.js')));
    if (caminho.endsWith('/assets/markdown.js')) return ok('text/javascript', fs.readFileSync(path.join(raiz, 'porta/assets/markdown.js')));
    if (caminho === '/ref') return ok('text/html; charset=utf-8', REFERENCIA);
    if (caminho === '/ficha') return ok('text/html; charset=utf-8', FICHA);
    if (caminho === '/estado') return ok('text/html; charset=utf-8', ESTADO);
    if (caminho.indexOf('/bastidores/producao') !== -1) return okEscola(PAGINA_PRODUCAO);
    return okEscola(PORTA);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

// --------------------------------------------------------------------- a leitura
//
// Uma função só, para todas as superfícies medirem o mesmo. Ela INJETA os estados: cada
// página mostra o selo que o dado dela pede, e o que se quer comparar é o desenho de
// TODOS num lugar só. Comparar só os que aparecem deixaria `.solta` fora da anamnese e
// `.livre` fora do plano — exactamente os dois que divergiam.

const ESTADOS = ['ok', 'vigente', 'vigencia', 'preenchido', 'alerta', 'falta-ritmo', 'livre',
  'solta', 'falha', 'marca', 'obrig', 'derivada', 'vinculada', 'discreto', 'dim', 'legado',
  'sem-sujeito', 'ajuste', 'opt'];

function medirSelos(estados) {
  const alvo = document.querySelector('main') || document.querySelector('body');
  const caixa = document.createElement('div');
  caixa.id = 'sonda-de-selos';
  caixa.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;';
  caixa.innerHTML = estados.map((e) => '<span class="selo ' + e + '">livre</span>').join('');
  alvo.appendChild(caixa);
  const ler = (e) => {
    const s = getComputedStyle(e);
    return {
      fundo: s.backgroundColor,
      bordaCor: s.borderTopColor,
      bordaEstilo: s.borderTopStyle,
      bordaLargura: s.borderTopWidth,
      cor: s.color,
      raio: s.borderTopLeftRadius,
      fonte: s.fontSize,
      familia: s.fontFamily.split(',')[0].replace(/"/g, ''),
      peso: s.fontWeight,
      caixa: s.textTransform,
      espaco: s.letterSpacing,
      padding: s.padding,
    };
  };
  const sonda = [...caixa.querySelectorAll('.selo')].map((e, i) => ({ estado: estados[i], ...ler(e) }));
  // O selo que a página REALMENTE mostra também entra: ele pode carregar uma classe que a
  // sonda não conhece, e essa também tem de vir da folha.
  const reais = [...document.querySelectorAll('.selo')]
    .filter((e) => !caixa.contains(e))
    .map((e) => ({ estado: e.className.replace(/^selo\s*/, ''), real: true, ...ler(e) }));
  caixa.remove();
  return { sonda, reais };
}

// A SONDA DOS COMPONENTES PARTILHADOS: o mesmo representante de cada peça, injetado nas
// superfícies que carregam a folha. Não é o selo — é o resto do sistema, que também tem de
// ser um só: botão, ação, campo, lista, cartão, mensagem e aviso.
const SONDA_COMPONENTES = () => {
  const caixa = document.createElement('div');
  caixa.id = 'sonda-de-componentes';
  caixa.style.cssText = 'position:absolute;left:-9999px;top:0;';
  caixa.innerHTML = '<button type="button" id="p-b">b</button>' +
    '<button class="acao" type="button" id="p-a">a</button>' +
    '<input type="text" id="p-i"><select id="p-s"><option>x</option></select>' +
    '<div class="caixa" id="p-c">c</div><div class="res ok" id="p-r">r</div>' +
    '<div class="aviso" id="p-v">v</div>';
  document.body.appendChild(caixa);
  const ler = (id) => {
    const e = document.getElementById(id);
    const s = getComputedStyle(e);
    return {
      raio: s.borderTopLeftRadius, fundo: s.backgroundColor, borda: s.borderTopColor,
      cor: s.color, padding: s.padding, fonte: s.fontSize,
      familia: s.fontFamily.split(',')[0].replace(/"/g, ''),
    };
  };
  const pecas = {
    botao: ler('p-b'), acao: ler('p-a'), campo: ler('p-i'), select: ler('p-s'),
    cartao: ler('p-c'), mensagem: ler('p-r'), aviso: ler('p-v'),
  };
  caixa.remove();
  return pecas;
};

const MEDIR_COMPONENTES = () => {
  const ler = (e) => {
    if (!e) return null;
    const s = getComputedStyle(e);
    return {
      raio: s.borderTopLeftRadius, fundo: s.backgroundColor, bordaCor: s.borderTopColor,
      bordaLargura: s.borderTopWidth, padding: s.padding, fonte: s.fontSize,
      familia: s.fontFamily.split(',')[0].replace(/"/g, ''), peso: s.fontWeight, cor: s.color,
    };
  };
  // O cartão: numa página de documento é `.caixa`; na de estado é o próprio `main`
  // (não há cartão dentro da caixa — a caixa É o cartão). A primeira `.caixa` da ficha
  // pode ser a `.nota`, que é a variante de leitura e tem outro fundo: a comparação do
  // cartão é com a `.caixa` sem `.nota`, e a `.nota` tem a sua própria asserção.
  const primeiro = (sel) => [...document.querySelectorAll(sel)].find((e) => !e.classList.contains('nota'));
  return {
    cartao: ler(primeiro('.caixa') || document.querySelector('main')),
    nota: ler(document.querySelector('.caixa.nota')),
    botao: ler(document.querySelector('main button, .acoes a')),
    codigo: ler(document.querySelector('code')),
    bloco: ler(document.querySelector('pre')),
  };
};

// ------------------------------------------------------------------------ a prova

(async () => {
  if (NEGATIVO) console.log('CONTROLE NEGATIVO — a porta de HEAD (antes de o selo voltar a ser um só)\n');
  const { srv, base } = await servir();
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  const assinatura = (x) => JSON.stringify([x.fundo, x.bordaCor, x.bordaEstilo, x.bordaLargura,
    x.cor, x.raio, x.fonte, x.familia, x.peso, x.caixa, x.espaco, x.padding]);

  const superficies = [
    ['Bastidores', '/bastidores/producao', () => { const c = document.getElementById('conteudo'); if (c) c.hidden = false; }],
    ['anamnese', '/anamnese/?professor=tiago-menegaz&escola=fita&ciclo=01', null],
    ['plano de ensino', '/plano-ensino/?professor=tiago-menegaz&escola=fita&ciclo=01&fonte=plano', null],
    ['plano de observação', '/plano-observacao/?professor=tiago-menegaz&escola=fita&ciclo=01&fonte=po', null],
  ];

  // ---- 1 e 2: uma assinatura por estado, em todas as superfícies, EM CADA TEMA ----
  //
  // A comparação é POR TEMA, e não através deles: a variante noturna troca os VALORES
  // dos papéis de propósito (a voz passa a ser o ouro), e exigir a mesma cor nos dois
  // seria exigir que o tema não existisse. O que tem de ser igual nos dois é a FORMA —
  // raio, tipo, peso, caixa, espaçamento, padding e a espessura e o estilo do filete.
  const porEstado = new Map(); // estado → tema → assinatura → { medida, onde }
  for (const tema of ['clara', 'noturna']) {
    for (const [nome, url, prep] of superficies) {
      await pg.setViewport({ width: 1280, height: 900 });
      await pg.evaluateOnNewDocument((modo) => {
        try {
          if (modo === 'noturna') localStorage.setItem('ciclo-modo', 'noturna');
          else localStorage.removeItem('ciclo-modo');
        } catch (err) { /* modo privado */ }
      }, tema);
      await pg.goto(base + url, { waitUntil: 'load' });
      if (prep) await pg.evaluate(prep);
      // O tema aplicado é o do `<html data-modo>`; sem ele, a página fica clara.
      const aplicado = await pg.evaluate(() => document.documentElement.getAttribute('data-modo'));
      if (tema === 'noturna' && aplicado !== 'noturna') {
        await pg.evaluate(() => document.documentElement.setAttribute('data-modo', 'noturna'));
      }
      const r = await pg.evaluate(medirSelos, ESTADOS);
      for (const s of r.sonda) {
        const onde = `${nome}`;
        if (!porEstado.has(s.estado)) porEstado.set(s.estado, new Map());
        const porTema = porEstado.get(s.estado);
        if (!porTema.has(tema)) porTema.set(tema, new Map());
        const mapa = porTema.get(tema);
        const a = assinatura(s);
        if (!mapa.has(a)) mapa.set(a, { medida: s, onde: [] });
        mapa.get(a).onde.push(onde);
      }
    }
    await pg.evaluateOnNewDocument(() => {});
  }

  const divergentes = [];
  for (const [estado, porTema] of porEstado) {
    for (const [tema, mapa] of porTema) {
      if (mapa.size > 1) {
        divergentes.push({
          estado, tema,
          assinaturas: [...mapa.entries()].map(([, v]) => ({ onde: v.onde, medida: v.medida })),
        });
      }
    }
  }
  provar('cada estado do selo tem UMA assinatura nas quatro superfícies, em cada tema',
    divergentes.length === 0, divergentes.length ? divergentes : `${porEstado.size} estados medidos`);

  // ---- 2b: a FORMA é a mesma nos dois temas (o que muda é o valor do papel) ----
  const forma = (x) => JSON.stringify([x.raio, x.fonte, x.familia, x.peso, x.caixa, x.espaco,
    x.padding, x.bordaLargura, x.bordaEstilo]);
  const semForma = [];
  for (const [estado, porTema] of porEstado) {
    const formas = new Set();
    for (const mapa of porTema.values()) {
      for (const { medida } of mapa.values()) formas.add(forma(medida));
    }
    if (formas.size > 1) semForma.push(estado);
  }
  provar('…e a FORMA é a mesma na clara e na noturna (só o valor do papel muda)',
    semForma.length === 0, semForma.length ? semForma : `${porEstado.size} estados`);

  // ---- 3: os aliases declarados são aliases de verdade ----
  //
  // «`.solta`, `.vinculada` e `.legado` são aliases do MESMO desenho — não um segundo
  // desenho» (a declaração da fonte). `.legado` é a excepção: ele diz «isto já foi
  // substituído», e é o único que se distingue.
  const assinaturaDoEstado = (estado) => {
    const porTema = porEstado.get(estado);
    if (!porTema) return null;
    const mapa = porTema.get('clara');
    if (!mapa || mapa.size !== 1) return null;
    return [...mapa.keys()][0];
  };
  const mesmo = (a, b) => {
    const sa = assinaturaDoEstado(a); const sb = assinaturaDoEstado(b);
    return Boolean(sa) && sa === sb;
  };
  provar('«livre» e «solta» são o MESMO desenho (a palavra é uma; o nome vem do dado)',
    mesmo('livre', 'solta'), { livre: assinaturaDoEstado('livre'), solta: assinaturaDoEstado('solta') });
  provar('«derivada» e «vinculada» são o MESMO desenho', mesmo('derivada', 'vinculada'));
  provar('«legado» é DISTINTO — é o que já foi substituído', !mesmo('legado', 'vinculada'));

  // ---- 4: as que DECLARAM desenham os mesmos objetos ----
  //
  // A ficha e as páginas de estado não carregam `/assets/style.css` (quando uma delas
  // aparece, o CSS pode ser exactamente o que falhou). Elas DECLARAM os valores, e o que
  // esta parte exige é que as MEDIDAS batam com as da folha renderizada ao lado.
  const componentes = {};
  for (const [nome, url] of [['fonte', '/ref'], ['ficha', '/ficha'], ['estado', '/estado']]) {
    await pg.setViewport({ width: 900, height: 900 });
    await pg.goto(base + url, { waitUntil: 'load' });
    componentes[nome] = await pg.evaluate(MEDIR_COMPONENTES);
  }
  const ref = componentes.fonte;
  provar('a folha desenha o cartão (o ponto de referência da comparação)',
    ref.cartao && ref.cartao.raio === '20px', ref.cartao);

  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // O `pre` da ficha é de um corpo de letra próprio (é documento, não interface): comparam-se
  // os quatro números que fazem o objeto — raio, fundo, borda e padding —, não o tipo.
  const semTipo = (x) => x && JSON.stringify([x.raio, x.fundo, x.bordaCor, x.bordaLargura, x.padding]);

  // A comparação é com o cartão de LEITURA (`.caixa.nota`) porque é o que a ficha emite:
  // o `.caixa` puro nasce de uma construção de markdown que a ficha em branco não tem.
  // As duas variantes vêm do mesmo componente, e a `.nota` é a que se pode medir nos dois
  // lados sem inventar conteúdo.
  provar('a FICHA desenha o cartão com as medidas da folha', igual(componentes.ficha.nota, ref.nota),
    { ficha: componentes.ficha.nota, fonte: ref.nota });
  provar('…e o código inline com as medidas da folha', igual(componentes.ficha.codigo, ref.codigo),
    { ficha: componentes.ficha.codigo, fonte: ref.codigo });
  provar('…e o bloco de código com o mesmo raio, fundo, filete e medida',
    semTipo(componentes.ficha.bloco) === semTipo(ref.bloco),
    { ficha: componentes.ficha.bloco, fonte: ref.bloco });

  provar('a página de ESTADO desenha o botão com as medidas da folha',
    igual(componentes.estado.botao, ref.botao),
    { estado: componentes.estado.botao, fonte: ref.botao });
  provar('…e o código inline com as medidas da folha',
    igual(componentes.estado.codigo, ref.codigo),
    { estado: componentes.estado.codigo, fonte: ref.codigo });
  provar('…e o cartão dela tem o raio do cartão da folha (é a mesma peça)',
    componentes.estado.cartao && componentes.estado.cartao.raio === ref.cartao.raio,
    { estado: componentes.estado.cartao, fonte: ref.cartao });

  // ---- 5: os OUTROS componentes partilhados também são um só ----
  //
  // O selo foi o que se viu; o resto da folha vale o mesmo. A sonda injeta um representante
  // de cada peça nas superfícies e compara as medidas computadas — botão, ação, campo,
  // lista, cartão, mensagem de resultado e aviso.
  const pecasPorSuperficie = [];
  for (const [nome, url, prep] of superficies) {
    await pg.setViewport({ width: 1280, height: 900 });
    await pg.goto(base + url, { waitUntil: 'load' });
    if (prep) await pg.evaluate(prep);
    pecasPorSuperficie.push([nome, await pg.evaluate(SONDA_COMPONENTES)]);
  }
  const referencia = pecasPorSuperficie[0][1];
  const pecasDivergentes = [];
  for (const [nome, pecas] of pecasPorSuperficie.slice(1)) {
    for (const chave of Object.keys(referencia)) {
      if (JSON.stringify(pecas[chave]) !== JSON.stringify(referencia[chave])) {
        pecasDivergentes.push({ superficie: nome, peca: chave, la: pecas[chave], aqui: referencia[chave] });
      }
    }
  }
  provar('botão, ação, campo, select, cartão, mensagem e aviso são os MESMOS nas quatro superfícies',
    pecasDivergentes.length === 0,
    pecasDivergentes.length ? pecasDivergentes : `${Object.keys(referencia).length} peças × ${superficies.length} superfícies`);

  await br.close();
  srv.close();

  if (NEGATIVO) {
    // No controle negativo o resultado esperado é o CONTRÁRIO: a porta de HEAD tem de
    // reprovar. Se ela passasse, a prova não estaria a medir a divergência.
    console.log(`\nprovar-selo (controle negativo, porta de HEAD): ` +
      (falhas > 0 ? `${falhas} reprovação(ões) — como devia` : 'PASSOU — a prova não mede nada'));
    process.exit(falhas > 0 ? 0 : 1);
  }

  console.log(`\nprovar-selo: ${falhas === 0 ? 'TUDO CERTO' : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
