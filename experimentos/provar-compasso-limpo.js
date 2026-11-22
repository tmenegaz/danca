#!/usr/bin/env node
'use strict';

/**
 * provar-compasso-limpo.js — o dono da música não é compasso.
 *
 * O DEFEITO, dito pela pesquisadora (03/11/2026): «na tabela de sequência de exercícios por bloco
 * dentro do Plano de Ensino, a coluna correspondente ao compasso exibe atualmente dados técnicos
 * internos do sistema, aparecendo no formato técnico (ex: 2/4 @breu)». Medido ao vivo antes da
 * correção: `/api/bastidores/termos` servia `Battement tendu → ["8|2/4@breu"]`.
 *
 * DE ONDE VEM O SUFIXO. O alfabeto guarda o verbete do catálogo e o de cada escola; um registo de
 * escola leva o dono na chave (`8|2/4@breu`) para os dois poderem declarar a mesma música sem
 * colidir no objecto. É ARMAZENAMENTO, e a única razão de existir. Quem compõe o documento já o
 * tira (via `registosDaEscola`), e o dicionário também (`comum.js`, `chaveDaMusica`). Faltava o
 * caminho da TELA: o mapa que alimenta o plano mandava a chave em cru, e a coluna «Compasso»
 * mostrava `2/4@breu`.
 *
 * AS DUAS LIMPEZAS, E PORQUE SÃO DUAS. A do servidor (`musicasDosExercicios`) é a correção da
 * fonte: usa `musicaDaChave` do núcleo — a regra é uma só — e deduplica, porque quando o catálogo
 * e a escola declaram a mesma música o alfabeto tem as duas chaves. A do cliente
 * (`musicasDoExercicio`) é a mesma regra do lado de quem MOSTRA: protege o ecrã de um adaptador
 * que sirva o alfabeto em cru (uma bancada, um servidor antigo). A §C é essa prova, e é por isso
 * que ela serve chaves COM dono de propósito.
 *
 * E O DADO NÃO SE LIMPA (P-03/P-04). O dono continua na chave do alfabeto — é o que permite à
 * escola ter a sua versão sem apagar a do catálogo. A §D prova o par: a chave limpa e a chave
 * gravada convivem, e a de armazenamento continua a ser a que tem o sufixo.
 *
 *   node experimentos/provar-compasso-limpo.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const notacao = require(path.join(RAIZ, 'motor/nucleo/notacao.js'));
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(PORTA, 'plano/conteudo/plano.json'), 'utf8'));
const MAPA = Object.assign({ ok: true }, mapa(CONTEUDO));

/* A TURMA E O VOCABULÁRIO DA PROVA: os dois exercícios que têm verbete no alfabeto publicado —
 * o `Plié` (do catálogo, `4|2/4`) e o `Battement tendu` (da `breu`, `8|2/4@breu`). São os dois
 * lados do problema, e um deles traz o sufixo. */
const TURMA = {
  id: 't1', nome: 'Turma da prova', frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
  periodoInicio: '2027-02-02', periodoFim: '2027-04-29',
};
const EXERCICIOS = ['Plié', 'Battement tendu'];

/** As chaves CRUAS do alfabeto publicado, por exercício — o que o servidor mandava antes. */
function chavesCruas() {
  const saida = {};
  for (const { alfabeto } of notacao.alfabetos()) {
    for (const nome of Object.keys((alfabeto && alfabeto.verbetes) || {})) {
      if (nome.startsWith('_')) continue;
      const ks = Object.keys(alfabeto.verbetes[nome] || {}).filter((k) => /^\d+\|/.test(k));
      if (ks.length) saida[nome] = ks;
    }
  }
  return saida;
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
};

/** `cru` = o servidor a mandar as chaves do alfabeto tal como estão (o comportamento de antes). */
function servir(cru) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const rel = u.pathname.replace(/^\/+/, '').replace(/^\/?plano-ensino\//, '');
    const envia = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));

    if (rel === 'api/mapa') return json(MAPA);
    if (rel === 'api/bastidores/professores') {
      return json({ ok: true, professores: [{ nome: 'Prova', slug: 'prova' }],
        opcoes: [{ valor: 'prova', rotulo: 'Prova' }] });
    }
    if (rel === 'api/bastidores/turmas') {
      return json({ ok: true, turmas: [TURMA], opcoes: [{ valor: TURMA.nome, rotulo: TURMA.nome }] });
    }
    if (rel === 'api/bastidores/termos') {
      const cruas = chavesCruas();
      // O MESMO VOCABULÁRIO, COM A MÚSICA EM CRU OU LIMPA — é a única variável da bancada.
      const termos = EXERCICIOS.map((termo, i) => ({
        id: 't' + i, termo, categoria: 'passo',
        musicas: cru ? (cruas[termo] || []) : (cruas[termo] || []).map((k) => notacao.musicaDaChave(k)),
      }));
      return json({ ok: true, termos, opcoes: termos.map((t) => ({ valor: t.id, rotulo: t.termo })) });
    }
    if (rel === 'api/bastidores/turma-conteudos') {
      return json({ ok: true, relacoes: { [TURMA.id]: ['plie', 'battement-tendu'] } });
    }
    if (rel.startsWith('api/bastidores/curadoria-professor')) {
      return json({ ok: true, curadorias: [{ id: 'c1', professor: 'prova', modalidade: 'Balé clássico',
        tradicao: 'RAD', turmas: [TURMA.nome], alunas: [] }] });
    }
    if (rel.startsWith('api/')) return json({ ok: true, opcoes: [] });

    /* O `markdown.js` DA PORTA (22/11/2026 — fixture). A página carrega-o por um caminho ABSOLUTO
     * (`/plano-observacao/assets/markdown.js`), que é onde o produto o serve; a bancada serve a
     * porta em `/plano-ensino/` e devolvia a própria página em vez do script, e o primeiro `md()`
     * lançava «Markdown is not defined» — a prova morria antes de medir uma única asserção. */
    if (rel === 'plano-observacao/assets/markdown.js') {
      return envia(MIME['.js'], fs.readFileSync(path.join(PORTA, 'assets/markdown.js')));
    }
    if (rel === 'assets/style.css') return envia(MIME['.css'], fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    if (rel === 'assets/nav.js') return envia(MIME['.js'], fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    const alvo = rel ? path.join(PORTA, rel) : path.join(PORTA, 'index.html');
    if (alvo.startsWith(PORTA) && fs.existsSync(alvo) && fs.statSync(alvo).isFile()) {
      return envia(MIME[path.extname(alvo)] || 'application/octet-stream', fs.readFileSync(alvo));
    }
    return envia(MIME['.html'], fs.readFileSync(path.join(PORTA, 'index.html')));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir(cru) {
  const { srv, base } = await servir(cru);
  const caminho = 'plano-ensino/?professor=prova&escola=prova&ciclo=01';
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base + '/' + caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + '/' + caminho), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
      const semear = w.setInterval(() => {
        try {
          w.eval("if (typeof RESPOSTAS !== 'undefined' && typeof MAPA !== 'undefined'"
            + " && !RESPOSTAS.get('contexto-turma')) RESPOSTAS.set('contexto-turma', "
            + JSON.stringify(TURMA.nome) + ");");
        } catch (e) { /* a página ainda não tem estas variáveis */ }
      }, 4);
      w.addEventListener('load', () => w.setTimeout(() => w.clearInterval(semear), 2500));
      w.addEventListener('unhandledrejection', (e) => {
        problemas.push('REJEIÇÃO: ' + ((e.reason && e.reason.message) || e.reason));
      });
      w.addEventListener('error', (e) => problemas.push('ERRO: ' + e.message));
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 1200));
  return { w, srv, problemas };
}

/* A MATRIZ DA AULA: os dois exercícios marcados no objetivo 1, no bloco Barra. É o que faz a
 * sequência nascer com as duas linhas — e é nelas que os tempos e o compasso se leem. */
const SEMEAR = `(function(){
  RESPOSTAS.set('contexto-turma', ${JSON.stringify(TURMA.nome)});
  RESPOSTAS.set('marcos-por-aula', ['Objetivo A']);
  RESPOSTAS.set('estrutura-de-cada-aula', [{ marco: 1, marcados: ['Barra'] }]);
  RESPOSTAS.set('aula-1-parametro', [{ marco: 1, marcados: ${JSON.stringify(EXERCICIOS)} }]);
  pintarRoteiro();
  return true;
})()`;

/** O que a página sabe das músicas de cada exercício, pela função dela. */
const LER_MUSICAS = `(function(){
  var saida = {};
  ${JSON.stringify(EXERCICIOS)}.forEach(function(nome){ saida[nome] = musicasDoExercicio(nome); });
  return saida;
})()`;

/** A LEITURA da música, como o nó «Música e vídeo de referência» a escreve. */
const LER_LEITURA = `(function(){
  var i = MAPA.nos.findIndex(function(n){ return n.id === 'musicas-videos'; });
  INDICE = i;
  renderPergunta();
  var q = document.getElementById('pergunta');
  var l = q.querySelectorAll('.leitura-do-cabecalho');
  return { textos: Array.prototype.slice.call(l).map(function(x){ return x.textContent; }) };
})()`;

(async () => {
  // ---- §A: a FONTE — o servidor -------------------------
  console.log('\nA. A FONTE — o que o servidor manda já não tem dono');
  const kv = {
    _d: new Map(),
    async get(k) { return this._d.has(k) ? this._d.get(k) : null; },
    async put(k, v) { this._d.set(k, String(v)); },
    async delete(k) { this._d.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...this._d.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true };
    },
  };
  const env = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'a', SENHA_PROFESSOR: 'b',
    PROFESSOR_NOME: 'Prova', PADD_KV: kv };
  const resposta = await bastidores.fetch(
    new Request('https://breu.tmenegaz77.workers.dev/api/bastidores/termos'), env);
  const corpo = await resposta.json();
  const comMusica = (corpo.termos || []).filter((t) => (t.musicas || []).length);
  provar('a rota do vocabulário responde com músicas declaradas', comMusica.length > 0,
    comMusica.map((t) => t.termo));
  provar('nenhuma música servida traz o dono (`@…`)',
    comMusica.every((t) => t.musicas.every((m) => m.indexOf('@') === -1)),
    comMusica.map((t) => [t.termo, t.musicas]));
  provar('…e o Battement tendu, que é da escola, chega como `8|2/4`',
    (() => {
      const t = comMusica.find((x) => x.termo === 'Battement tendu');
      return Boolean(t) && t.musicas.indexOf('8|2/4') !== -1;
    })(), (comMusica.find((x) => x.termo === 'Battement tendu') || {}).musicas);

  // ---- §B: a TELA, com o servidor a mandar limpo -------------------------
  console.log('\nB. A TELA — a coluna «Compasso» da sequência, com a fonte já limpa');
  const a = await abrir(false);
  await a.w.eval(SEMEAR);
  const musicasLimpo = await a.w.eval(LER_MUSICAS);
  const seqLimpo = await a.w.eval("RESPOSTAS.get('aula-1-sequencia')");
  const linha = (lista, nome) => (lista || []).find((l) => l && l['Conteúdo do nível'] === nome) || {};

  provar('a página lê as duas músicas sem dono',
    musicasLimpo['Battement tendu'][0].compasso === '2/4' && musicasLimpo['Plié'][0].compasso === '2/4',
    musicasLimpo);
  provar('…e a linha da sequência grava o compasso LIMPO',
    linha(seqLimpo, 'Battement tendu').Compasso === '2/4', linha(seqLimpo, 'Battement tendu'));
  provar('…e os tempos continuam certos (8 do tendu, 4 do plié)',
    linha(seqLimpo, 'Battement tendu').Tempos === '8' && linha(seqLimpo, 'Plié').Tempos === '4',
    { tendu: linha(seqLimpo, 'Battement tendu'), plie: linha(seqLimpo, 'Plié') });

  const leituraLimpo = await a.w.eval(LER_LEITURA);
  a.w.close(); a.srv.close();
  const textoLimpo = leituraLimpo.textos.join(' ');
  provar('a leitura da música diz «8 tempos em 2/4», sem sufixo',
    /Battement tendu — 8 tempos em 2\/4/.test(textoLimpo), textoLimpo);
  provar('…e não há `@` nenhum na leitura',
    textoLimpo.indexOf('@') === -1, textoLimpo);

  // ---- §C: a DEFESA do cliente, com a fonte a mandar CRU -----------------
  //
  // O CONTROLE INVERSO. Aqui o adaptador serve a chave como ela está no alfabeto —
  // `8|2/4@breu` —, que é exactamente o que o servidor fazia antes desta correção. O ecrã tem de
  // continuar limpo: quem mostra não repete o identificador de armazenamento de quem guarda.
  console.log('\nC. A DEFESA DA TELA — a mesma regra do lado de quem mostra (fonte em cru)');
  /* O QUE A BANCADA SERVE, medido no adaptador e não no resultado: se o stub mandasse a chave já
   * limpa, esta secção passaria sem medir nada — e um controlo que não controla é pior do que
   * nenhum, porque dá por provado o que ninguém provou. */
  const sonda = await servir(true);
  const cruDoStub = await (await fetch(sonda.base + '/api/bastidores/termos')).json();
  sonda.srv.close();
  const chavesDoStub = (cruDoStub.termos || []).flatMap((t) => t.musicas || []);
  provar('a bancada serve MESMO a chave com dono (senão a §C não mede nada)',
    chavesDoStub.some((m) => m.indexOf('@') !== -1), chavesDoStub);

  const b = await abrir(true);
  await b.w.eval(SEMEAR);
  const musicasCru = await b.w.eval(LER_MUSICAS);
  const seqCru = await b.w.eval("RESPOSTAS.get('aula-1-sequencia')");
  const leituraCru = await b.w.eval(LER_LEITURA);
  b.w.close(); b.srv.close();
  provar('…o compasso do tendu é `2/4`, e não `2/4@breu`',
    musicasCru['Battement tendu'][0].compasso === '2/4', musicasCru['Battement tendu']);
  provar('…e a linha da sequência também',
    linha(seqCru, 'Battement tendu').Compasso === '2/4', linha(seqCru, 'Battement tendu'));
  provar('…e a leitura da música também',
    /Battement tendu — 8 tempos em 2\/4/.test(leituraCru.textos.join(' ')), leituraCru.textos.join(' '));

  // ---- §D: o DADO não se limpa -------------------------------------------
  console.log('\nD. O DADO NÃO SE LIMPA — o dono continua na chave que se grava');
  const alfabeto = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'biblioteca/modalidades/bale-classico/notacao.json'), 'utf8'));
  const chavesDoTendu = Object.keys(alfabeto.verbetes['Battement tendu'] || {});
  provar('o alfabeto publicado continua a guardar a chave COM o dono',
    chavesDoTendu.indexOf('8|2/4@breu') !== -1, chavesDoTendu);
  provar('…e `musicaDaChave` devolve a música sem ele',
    notacao.musicaDaChave('8|2/4@breu') === '8|2/4', notacao.musicaDaChave('8|2/4@breu'));
  provar('…e `chaveDoVerbete` recompõe a de armazenamento',
    notacao.chaveDoVerbete('8|2/4', 'breu') === '8|2/4@breu', notacao.chaveDoVerbete('8|2/4', 'breu'));
  provar('…e a vista da escola resolve a música limpa para o registo DELA',
    Boolean(notacao.registosDaEscola(alfabeto.verbetes['Battement tendu'], 'breu')['8|2/4']),
    Object.keys(notacao.registosDaEscola(alfabeto.verbetes['Battement tendu'], 'breu')));

  /* ---- §E: A MÚSICA É A DESTA ESCOLA (22/11/2026) --------------------------
   *
   * O DEFEITO, dito por ela: «o Batman GT apareceu opções para eu escolher o tempo e opções para eu
   * escolher o compasso. Está errado isso, porque o Batman GT já tem isso definido. Por que é que
   * não está atualizado do mesmo lugar onde você pegou para os outros exercícios?»
   *
   * A causa: a lista que a grelha e o diálogo recebem tirava o dono de cada registo e juntava os de
   * TODAS as escolas. O Battement jeté tem `4|4/4@batata` e `8|2/4@breu`; sem dono, «este exercício
   * tem duas músicas» — e a tela pedia uma escolha onde a `breu` tem uma resposta só.
   *
   * A vista da escola é a mesma regra que compõe os documentos (`registosDaEscola`), e é ela que a
   * lista passa a usar. O que se mede: a lista que o SERVIDOR manda, e não uma função chamada à
   * parte — é o caminho que a grelha percorre. */
  console.log('\nE. A MÚSICA É A DESTA ESCOLA — o registo de outra não entra');
  const daBreu = notacao.musicasDosExercicios('breu');
  provar('o Battement jeté da `breu` tem UMA música, a dela (`8|2/4`)',
    JSON.stringify(daBreu.get('Battement jeté')) === JSON.stringify(['8|2/4']),
    daBreu.get('Battement jeté'));
  provar('…e a música da `batata` (`4|4/4`) não está na lista da `breu`',
    (daBreu.get('Battement jeté') || []).indexOf('4|4/4') === -1, daBreu.get('Battement jeté'));
  provar('o exercício do catálogo continua a valer para toda a gente (`Plié` → `4|2/4`)',
    JSON.stringify(daBreu.get('Plié')) === JSON.stringify(['4|2/4']), daBreu.get('Plié'));
  provar('…e o registo de OUTRA escola não aparece a esta (`Battement fondu` é da `calango`)',
    !daBreu.has('Battement fondu'), [...daBreu.keys()]);
  const daBatata = notacao.musicasDosExercicios('batata');
  provar('a mesma leitura, na `batata`, dá a música da `batata` (não é um caso da `breu`)',
    JSON.stringify(daBatata.get('Battement jeté')) === JSON.stringify(['4|4/4']),
    daBatata.get('Battement jeté'));

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — o compasso mostra a fórmula e só ela; o dono fica onde é útil, no armazenamento.'
    : 'FALHOU — ' + falhas + ' de ' + total + ' asserções.'));
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
