#!/usr/bin/env node
'use strict';

/*
 * provar-forca-e-flexibilidade.js — o ponto de partida lê a anamnese, e abre-a inteira.
 *
 *   node experimentos/provar-forca-e-flexibilidade.js
 *
 * PORQUE EXISTE (02/11/2026). A Regra 4 pede os pré-requisitos de força e flexibilidade
 * declarados. A pesquisadora mostrou onde eles estão: na ANAMNESE, nos campos que já existem
 * (`flexibilidade-dos-isquiotibiais`, `controle-de-carga-no-demi-grand-plie`, …). O que faltava
 * era a travessia — o item 11 do PO («Ponto de partida») abria uma caixa com os primeiros
 * catorze campos crus, por ordem de chave, e a força e a flexibilidade podiam simplesmente não
 * estar entre eles.
 *
 * O QUE SE PROVA, e como:
 *
 *   1. o conteúdo do PO declara os campos que escolheu (e o descritor do motor NÃO os come — a
 *      lista de `descritores()` é fechada, e a chave que falta morre em silêncio);
 *   2. a caixa do registo mostra esses campos PELO NOME («Flexibilidade dos isquiotibiais»), e o
 *      nome vem do mapa da anamnese — não de uma segunda lista escrita à mão;
 *   3. a caixa mostra o valor que está no envelope;
 *   4. há um «abrir o registro completo» que leva à anamnese daquela aluna, noutra aba, com o
 *      contexto do ato;
 *   5. o `id` do campo não aparece como rótulo (era o que aparecia antes).
 *
 * A PÁGINA É A DE PRODUÇÃO (`porta/index.html`), servida em `/plano-observacao/` como o Worker a
 * serve, e o MAPA é o que o motor entrega — `porta.mapa()` sobre o conteúdo real. Um mapa
 * inventado mediria a minha imaginação, e o defeito que isto guarda é exactamente «a chave não
 * chegou ao mapa».
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const PAGINA = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
const CONTEUDO_PO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/po/conteudo/po.json'), 'utf8'));
const CONTEUDO_ANAMNESE = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/conteudo/anamnese.json'), 'utf8'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

// ---------------------------------------------------------------------------
// 1. O CONTEÚDO E O MAPA — antes de haver browser
// ---------------------------------------------------------------------------
console.log('\n1. O CONTEÚDO DO PO, E O QUE O MOTOR DEIXA PASSAR');

const noDaBase = (() => {
  for (const bloco of CONTEUDO_PO.blocos || []) {
    for (const campo of bloco.campos || []) if (campo.id === 'linha-de-base') return campo;
  }
  return null;
})();

const declaracao = noDaBase && noDaBase.registroDaAnamnese;
provar('o nó «linha-de-base» declara os campos da anamnese de que se alimenta', !!declaracao);
const idsDeclarados = declaracao
  ? declaracao.grupos.reduce((todos, g) => todos.concat(g.campos || []), [])
  : [];
provar('a declaração nomeia campos (dois grupos: flexibilidade e força)',
  declaracao && declaracao.grupos.length === 2 && idsDeclarados.length >= 10, idsDeclarados.length);

const mapaPO = PORTA.mapa(CONTEUDO_PO);
const noNoMapa = mapaPO.nos.find((n) => n.id === 'linha-de-base');
provar('o motor REPASSA a declaração ao mapa (a lista de descritores é fechada)',
  !!(noNoMapa && noNoMapa.registroDaAnamnese),
  noNoMapa ? Object.keys(noNoMapa).filter((k) => /registro|anamnese/i.test(k)) : null);

// Cada `id` declarado tem de existir na anamnese — um campo renomeado lá deixaria o PO a pedir
// um nome que já não existe, e a caixa mostraria um `id` cru em vez de um valor.
const camposDaAnamnese = new Set();
for (const bloco of CONTEUDO_ANAMNESE.blocos || []) {
  for (const campo of bloco.campos || []) camposDaAnamnese.add(campo.id);
}
const orfaos = idsDeclarados.filter((id) => !camposDaAnamnese.has(id));
provar('todos os campos declarados existem na anamnese', orfaos.length === 0, orfaos);

const mapaAnamnese = PORTA.mapa(CONTEUDO_ANAMNESE);
const rotuloDe = new Map(mapaAnamnese.nos.map((n) => [n.id, n.campo]));

// ---------------------------------------------------------------------------
// 2. A PÁGINA, NO BROWSER
// ---------------------------------------------------------------------------
const ENVELOPE = {
  id: 'anamnese-1', tipo: 'anamnese', escola: 'batata', professor: 'pe-junto',
  aluna: 'Aluna A', ciclo: '01', carimbo: 'anamnese-1',
  respostas: {
    'flexibilidade-dos-isquiotibiais': { valor: 'Média' },
    'flexibilidade-dos-adutores': { valor: 'Abertura parcial' },
    'controle-de-carga-no-demi-grand-plie': { valor: 'Desce com controle' },
    'forca-de-puxar-tracao': { valor: 'Dificuldade severa' },
    // Um campo que NÃO está declarado: não pode aparecer na caixa da força e flexibilidade.
    'formato-anatomico-dos-joelhos': { valor: 'Valgo leve' },
    'linha-de-base': { valor: { traz: 'prática anterior', precisaDesenvolver: 'o eixo' } },
  },
};

function servir() {
  const srv = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const caminho = decodeURIComponent(url.pathname);
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (obj) => ok('application/json', JSON.stringify(obj));

    if (caminho === '/plano-observacao/' || caminho === '/plano-observacao/index.html') {
      return ok('text/html; charset=utf-8', PAGINA);
    }
    if (/\/assets\/style\.css$/.test(caminho)) {
      return ok('text/css; charset=utf-8',
        fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8'));
    }
    if (/\/assets\/markdown\.js$/.test(caminho)) {
      return ok('text/javascript; charset=utf-8',
        fs.readFileSync(path.join(RAIZ, 'porta/assets/markdown.js'), 'utf8'));
    }
    if (caminho === '/assets/nav.js') {
      return ok('text/javascript; charset=utf-8',
        fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js'), 'utf8'));
    }
    // O MAPA PELO MOTOR: `?fonte=po` é o do PO, a omissão (e qualquer outro valor) é a anamnese
    // — é a mesma regra da rota do Worker, e é dela que a página tira os NOMES dos campos.
    if (caminho.indexOf('/api/mapa') !== -1) {
      return json(url.searchParams.get('fonte') === 'po' ? mapaPO : mapaAnamnese);
    }
    if (caminho.indexOf('/api/envelope/') !== -1) return json(ENVELOPE);
    if (caminho.endsWith('/api/anamneses')) {
      return json({ ok: true, anamneses: [{ valor: 'Aluna A', rotulo: 'anamnese-1', detalhe: 'api/envelope/anamnese-1', carimbo: 'anamnese-1' }] });
    }
    if (caminho.indexOf('/api/') !== -1) return json({ ok: true });
    res.writeHead(404); res.end('ausente');
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir(base) {
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => {
    if (!/Not implemented|Could not load (link|script)/.test(e.message)) problemas.push(e.message.slice(0, 200));
  });
  const caminho = '/plano-observacao/?professor=pe-junto&escola=batata&ciclo=01&fonte=po';
  const dom = await JSDOM.fromURL(base + caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + caminho), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
      w.scrollTo = () => {};
    },
  });
  await new Promise((r) => setTimeout(r, 1800));
  return { dom, problemas };
}

(async () => {
  console.log('\n2. A CAIXA DO REGISTO, NA PÁGINA');
  const { srv, base } = await servir();
  const { dom, problemas } = await abrir(base);
  const w = dom.window;

  provar('a página abriu sem erro de script', problemas.length === 0, problemas.slice(0, 2));

  // As funções da página são globais (o script é clássico, não módulo).
  const temFuncoes = typeof w.detalheDoEnvelope === 'function' && typeof w.referenciaDaAnamnese === 'function';
  provar('as funções da caixa estão na página', temFuncoes,
    { detalhe: typeof w.detalheDoEnvelope, referencia: typeof w.referenciaDaAnamnese });
  if (!temFuncoes) { srv.close(); process.exit(1); }

  // Os NOMES vêm do mapa da anamnese, buscado pela própria página.
  await w.carregarRotulosDaAnamnese();
  const caixa = w.detalheDoEnvelope(ENVELOPE, noNoMapa.registroDaAnamnese);
  const texto = String(caixa);

  provar('a caixa traz o rótulo do grupo («Flexibilidade e amplitude»)', /Flexibilidade e amplitude/.test(texto));
  provar('a caixa traz o rótulo do grupo («Força»)', />Força</.test(texto));
  provar('mostra o NOME do campo, não o `id`',
    /Flexibilidade dos isquiotibiais/.test(texto) && !/flexibilidade-dos-isquiotibiais/.test(texto),
    (texto.match(/(flexibilidade[a-z-]*|Flexibilidade[^<:]*)/) || [''])[0]);
  provar('mostra o valor que está no envelope',
    /Flexibilidade dos isquiotibiais: <b>Média<\/b>/.test(texto),
    (texto.match(/isquiotibiais[^<]*<\/b>/) || [''])[0]);
  provar('o campo NÃO declarado não entra na caixa de força e flexibilidade',
    !/Valgo leve/.test(texto));
  provar('o «o que traz / precisa desenvolver» continua a ser mostrado',
    /Traz:/.test(texto) && /Precisa desenvolver:/.test(texto));

  const referencia = String(w.referenciaDaAnamnese(
    { valor: 'Aluna A', rotulo: 'anamnese-1', detalhe: 'api/envelope/anamnese-1', carimbo: 'anamnese-1' },
    'Aluna A'));
  provar('há um «abrir o registro completo» que leva à anamnese daquela aluna',
    /abrir o registro completo/.test(referencia) && /\/anamnese\/\?/.test(referencia),
    (referencia.match(/href="[^"]*"/) || [''])[0]);
  provar('…e abre noutra aba', /target="_blank"/.test(referencia));
  provar('…levando o contexto do ato e o apelido da aluna',
    /professor=pe-junto/.test(referencia) && /aluna=Aluna\+A|aluna=Aluna%20A/.test(referencia),
    (referencia.match(/href="[^"]*"/) || [''])[0]);

  /* CONTROLE NEGATIVO — na mesma execução. A caixa SEM a declaração volta ao que era: os
   * primeiros campos crus, pelo `id`. Sem isto, «passou» poderia querer dizer que a caixa mostra
   * sempre os nomes — e não mostra: é a declaração do conteúdo que a manda ler a anamnese. */
  console.log('\n3. CONTROLE NEGATIVO — a caixa sem a declaração volta ao `id` cru');
  const semDeclaracao = w.detalheDoEnvelope(ENVELOPE, null);
  provar('sem a declaração, os campos de força e flexibilidade NÃO são mostrados pelo nome',
    !/Flexibilidade dos isquiotibiais/.test(String(semDeclaracao)),
    (String(semDeclaracao).match(/flexibilidade[a-z-]*/) || [''])[0]);
  // Sem a declaração, a caixa fica com o que sempre teve: o «traz / precisa desenvolver» e nada
  // de força e flexibilidade. (A lista crua dos catorze campos só aparece quando a anamnese nem
  // declara linha de base — é o outro ramo, e o envelope desta prova declara-a.)
  provar('…e sobra só o «traz / precisa desenvolver», sem a lista de força e flexibilidade',
    /Traz:/.test(String(semDeclaracao)) && !/<ul>/.test(String(semDeclaracao)));

  srv.close();
  console.log('\nprovar-forca-e-flexibilidade: ' + (falhas ? falhas + ' FALHA(S) de ' + total : 'TUDO CERTO — ' + total + ' asserções'));
  process.exit(falhas ? 1 : 0);
})().catch((erro) => {
  console.error('provar-forca-e-flexibilidade: ' + erro.message);
  process.exit(1);
});
