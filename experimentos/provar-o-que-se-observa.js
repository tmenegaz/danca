#!/usr/bin/env node
'use strict';

/**
 * provar-o-que-se-observa.js — «o que se observa» é o que a anamnese registou: nível, apoio E nota.
 *
 * O QUE MOTIVOU (21/11/2026). Ela, a olhar o Bloco 2 do Plano de Observação:
 *
 *   «o painel do corpo ele mostra os aspectos agrupados, só os nomes. […] Não mostra os valores
 *    lidos de cada um, e é exatamente isso que a gente tem que ter lá. […] tem algumas medições que
 *    têm duas etapas, tem que pegar as duas etapas quando elas existirem — primeira posição dos
 *    pés, a gente vê se foi bom e também ver se a pessoa fez por consciência própria ou precisou
 *    de ajuda ou do auxílio da barra.»
 *
 * E, na mesma mensagem, o requisito que quase passava: «na poiesis também tem observações que o
 * professor pode ter feito […] Se ele tomou nota de alguma coisa, essa anotação dele também tem
 * que aparecer […] são todos os campos da anamnese que o professor usou.»
 *
 * O DADO SEMPRE EXISTIU, e é isso que este ficheiro mede antes de o corrigir:
 *
 *   · o nível e o apoio estão na frase que o passo 3 grava — «1 de 1 em «Bom» (por consciência
 *     própria)» —, e essa frase já chegava ao documento;
 *   · a NOTA do professor está no registo da resposta (`{valor, origem, respondente, nota}`) e era
 *     LIDA e DEITADA FORA: `nivelDaResposta` só olhava para o `valor`;
 *   · e o recorte é do CORPO — os aspectos de musicalidade que o professor mediu na anamnese
 *     ficavam fora do recorte, e o eixo Poiesis da aula não os podia ler.
 *
 * O QUE SE PROVA:
 *
 *   A. a nota atravessa `nivelDaResposta` → `classificar` → `mostraDaLeitura`, com o apelido de
 *      quem a escreveu, e NÃO se repete quando o aspecto aparece em duas listas;
 *   B. uma nota sem nível NÃO é um aspecto sem registo — e a primeira versão desta correção
 *      perdia-a (a nota exigia um valor); o caso fica medido;
 *   C. `formaDaLinhaDeBase`: `mostra` é o recorte, `mostraCompleta` são os 45 campos;
 *   D. o derivador da aula: o Corpo leva nível + apoio + nota; a Poiesis leva os aspectos de
 *      musicalidade da anamnese, com a nota;
 *   E. na página (Chrome, acervo real servido em 127.0.0.1): o painel do Corpo mostra o valor ao
 *      lado de cada aspecto, e não só o nome.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `motor/nucleo/linha-de-base.js` de `HEAD` e o
 * `derivar-ciclo.js` de `HEAD`. Espera-se que A, B, C e D caiam.
 *
 *   node experimentos/provar-o-que-se-observa.js [--controle-negativo]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.indexOf('--controle-negativo') !== -1;

/** O módulo de hoje — ou o de `HEAD`, no controle negativo. */
function carregarDe(modulo) {
  if (!NEGATIVO) return require(path.join(RAIZ, modulo));
  const fonte = execFileSync('git', ['show', 'HEAD:' + modulo], { cwd: RAIZ, encoding: 'utf8' });
  const sandbox = {
    module: {}, require: (p) => require(p.startsWith('.') ? path.join(RAIZ, path.dirname(modulo), p) : p),
    console, process, Buffer, URL, URLSearchParams, Set, Map, Array, Object, String, Number, JSON,
    Boolean, Error, Promise, RegExp, Math, Date, Intl, isNaN, parseInt, parseFloat, encodeURIComponent,
  };
  sandbox.module.exports = {};
  sandbox.exports = sandbox.module.exports;
  const ctx = vm.createContext(sandbox);
  new vm.Script('(function(module, exports, require){' + fonte + '\n})', { filename: modulo })
    .runInContext(ctx)(sandbox.module, sandbox.exports, sandbox.require);
  return sandbox.module.exports;
}

const lb = carregarDe('motor/nucleo/linha-de-base.js');
const derivar = carregarDe('motor/nucleo/derivar-ciclo.js');

let provas = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 320)));
}

const CONTEUDO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/conteudo/anamnese.json'), 'utf8'));
const DISP = lb.camposDisponiveis(CONTEUDO);
const CAMPO = 'cinco-posicoes-1a-pes';

/* As três formas de responder que o professor usa, e a terceira é a que se perdia. */
/* UM ASPECTO DE MUSICALIDADE, que fica FORA do recorte do corpo — é o caso da Poiesis. */
const MUSICAL = DISP.find((d) => d.eixo === 'Musicalidade' && (d.opcoes || []).length);

const ANAMNESES = [
  { aluna: 'Aluna A', respostas: {
    [CAMPO]: { valor: ['Bom', 'consciencia-propria'], nota: 'o arco cede quando sobe a meia ponta' },
    [MUSICAL.id]: { valor: [String(MUSICAL.opcoes[1] || MUSICAL.opcoes[0])], nota: 'entra atrasada no 2º tempo' } } },
  { aluna: 'Aluna B', respostas: { [CAMPO]: { valor: ['razoável', 'com-barra'], nota: '' } } },
  { aluna: 'Aluna C', respostas: { [CAMPO]: { valor: null, nota: 'só escreveu, não marcou' } } },
];

console.log('\nO QUE SE OBSERVA — nível, apoio e a nota do professor');

/* ------------------------------------------------------------------------------------------- */
console.log('\nA. A nota atravessa a leitura, e não se repete entre as listas');
/* ------------------------------------------------------------------------------------------- */
{
  const r = lb.classificar(DISP, ANAMNESES);
  const item = r.atencao.concat(r.excelencia, r.comuns).find((x) => x.id === CAMPO);
  provar('o aspecto classificado existe', Boolean(item));
  provar('o nível e o apoio estão no texto (as duas etapas)',
    /«Bom»/.test(String(item && item.texto)) && /consciência própria/.test(String(item && item.texto)),
    item && item.texto);
  provar('o apoio da segunda aluna também («com a barra como apoio»)',
    /barra como apoio/.test(String(item && item.texto)), item && item.texto);
  provar('a NOTA do professor está no item, com o apelido de quem a escreveu',
    Array.isArray(item && item.notas) && item.notas.some((n) => /arco cede/.test(n.texto)
      && n.aluna === 'Aluna A'), item && item.notas);
  provar('…e a nota de quem só escreveu, sem nível, também',
    Boolean(item) && Array.isArray(item.notas) && item.notas.some((n) => /só escreveu/.test(n.texto) && n.aluna === 'Aluna C'),
    item && item.notas);
  provar('uma nota vazia não vira uma nota com aspas vazias',
    Boolean(item) && Array.isArray(item.notas) && !item.notas.some((n) => !String(n.texto).trim()));

  const m = lb.mostraDaLeitura({ classificacao: r }).filter((x) => x.id === CAMPO);
  provar('na mostra, o aspecto aparece UMA vez', m.length === 1, m.length);
  provar('…e as notas não se duplicam entre `atencao` e `comuns`',
    Boolean(m[0]) && Array.isArray(m[0].notas)
    && m[0].notas.filter((n) => /arco cede/.test(n.texto)).length === 1, m[0] && m[0].notas);
}

/* ------------------------------------------------------------------------------------------- */
console.log('\nB. Nota sem nível não é aspecto sem registo');
/* ------------------------------------------------------------------------------------------- */
{
  const soNota = [{ aluna: 'Aluna C', respostas: { [CAMPO]: { valor: null, nota: 'escreveu e não marcou' } } }];
  const r = lb.classificar(DISP, soNota);
  const item = r.atencao.concat(r.excelencia, r.comuns).find((x) => x.id === CAMPO);
  provar('o aspecto NÃO cai em «sem registo»',
    !r.semRegisto.some((x) => x.id === CAMPO));
  provar('…e traz a nota', Boolean(item) && Array.isArray(item.notas)
    && item.notas.some((n) => /escreveu e não marcou/.test(n.texto)), item && item.notas);
  const semNada = lb.classificar(DISP, [{ aluna: 'Aluna C', respostas: {} }]);
  provar('sem nada mesmo, continua a cair em «sem registo»',
    semNada.semRegisto.some((x) => x.id === CAMPO));
}

/* ------------------------------------------------------------------------------------------- */
console.log('\nC. O recorte é do corpo; a leitura inteira é de todos os campos');
/* ------------------------------------------------------------------------------------------- */
{
  const actos = fs.readdirSync(path.join(RAIZ, 'escola/breu/linhas-de-base'))
    .filter((n) => n.endsWith('.json') && !n.startsWith('.'))
    .map((n) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/linhas-de-base', n), 'utf8')))
    .filter((l) => l.id === 'tami' && l.leitura && (l.campos || []).length);
  const acto = actos.sort((a, b) => String(b.enviada_em || '').localeCompare(String(a.enviada_em || '')))[0];
  provar('há um acto com leitura para medir', Boolean(acto));
  if (acto) {
    const forma = lb.formaDaLinhaDeBase(acto, 'Rosa');
    provar('`mostra` é SÓ o recorte',
      forma.mostra.length === forma.recorte.length && forma.mostra.length > 0,
      { mostra: forma.mostra.length, recorte: forma.recorte.length });
    provar('`mostraCompleta` é a leitura inteira (mais do que o recorte)',
      forma.mostraCompleta.length > forma.recorte.length,
      { completa: forma.mostraCompleta.length, recorte: forma.recorte.length });
    provar('…e inclui os aspectos de musicalidade',
      forma.mostraCompleta.some((m) => m.eixo === 'Musicalidade'),
      forma.mostraCompleta.filter((m) => m.eixo === 'Musicalidade').map((m) => m.nome).slice(0, 3));
  }
}

/* ------------------------------------------------------------------------------------------- */
console.log('\nD. O derivador da aula: Corpo com nível+apoio+nota, Poiesis com a anamnese');
/* ------------------------------------------------------------------------------------------- */
{
  /* Uma linha de base sintética com nota, para medir o documento sem depender de o acto real ter
   * notas — e uma série de musicalidade que NÃO está no recorte do corpo. */
  const leitura = {
    em: '2026-11-20T21:00:00.000Z', alunas: ['Aluna A'],
    classificacao: lb.classificar(DISP, ANAMNESES),
  };
  const campos = [{ id: CAMPO, nome: '1ª posição — pés', grupo: 'as cinco posições: uma visão geral' }];
  const forma = lb.formaDaLinhaDeBase({ id: 'sintetico', nome: 'Sintético', campos,
    alunas: ['Aluna A'], leitura, enviada_em: '2026-11-20T21:00:00.000Z' }, 'Rosa');
  provar('a forma sintética tem o recorte', forma.mostra.length === 1);

  const plano = JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/envelopes/plano-20261121-1120.json'), 'utf8'));
  const po = JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/envelopes/po-20261121-1120.json'), 'utf8'));
  const poResp = Object.fromEntries(Object.entries(po.respostas || {})
    .map(([k, v]) => [k, v && v.valor !== undefined ? v.valor : v]));
  const dims = Array.isArray(poResp['itens-por-dimensao']) ? poResp['itens-por-dimensao'] : [];
  const eixos = derivar.eixosDaObservacao(dims, plano, po, forma);

  const corpo = eixos.find((e) => e.id === 'corpo');
  const linhaDoCorpo = (corpo && corpo.linhas || []).find((l) => /1ª posição — pés/.test(String(l[0])));
  provar('o Corpo tem a linha do aspecto', Boolean(linhaDoCorpo), corpo && corpo.linhas);
  provar('…com o nível e o apoio', Boolean(linhaDoCorpo)
    && /«Bom»/.test(linhaDoCorpo[1]) && /consciência própria/.test(linhaDoCorpo[1]), linhaDoCorpo);
  provar('…E com a nota do professor', Boolean(linhaDoCorpo)
    && /nota do professor/.test(linhaDoCorpo[1]) && /arco cede/.test(linhaDoCorpo[1]), linhaDoCorpo);

  const poiesis = eixos.find((e) => e.id === 'poiesis');
  provar('a Poiesis tem as linhas da anamnese', Boolean(poiesis) && poiesis.linhas.length > 0,
    poiesis && poiesis.linhas.length);
  provar('…e são aspectos de musicalidade, que NÃO estão no recorte do corpo',
    Boolean(poiesis) && poiesis.linhas.every((l) => !/1ª posição — pés/.test(String(l[0]))),
    poiesis && poiesis.linhas.map((l) => l[0]).slice(0, 4));
  provar('…com o nível registado',
    Boolean(poiesis) && poiesis.linhas.some((l) => /em «/.test(String(l[1]))),
    poiesis && poiesis.linhas.slice(0, 2));
  /* A nota de um aspecto de musicalidade, que é o que ela pediu — o cenário tem de ter um. */
  const musical = MUSICAL;
  const anamnesesMusicais = ANAMNESES;
  const leitura2 = { em: '2026-11-20T21:00:00.000Z', alunas: ['Aluna A'],
    classificacao: lb.classificar(DISP, anamnesesMusicais) };
  const forma2 = lb.formaDaLinhaDeBase({ id: 's2', nome: 'S2', campos, alunas: ['Aluna A'],
    leitura: leitura2, enviada_em: '2026-11-20T21:00:00.000Z' }, 'Rosa');
  const eixos2 = derivar.eixosDaObservacao(dims, plano, po, forma2);
  const poiesis2 = eixos2.find((e) => e.id === 'poiesis');
  provar('a NOTA de um aspecto de musicalidade chega à Poiesis',
    Boolean(poiesis2) && poiesis2.linhas.some((l) => /entra atrasada no 2º tempo/.test(String(l[1]))),
    poiesis2 && poiesis2.linhas.filter((l) => /nota do professor/.test(String(l[1]))).slice(0, 2));
}

/* ------------------------------------------------------------------------------------------- */
console.log('\nD2. Entre as versões do mesmo elenco, vale a do carimbo maior');
/* ------------------------------------------------------------------------------------------- */
{
  /* O `id` do elenco não muda entre versões — cada acto é um ficheiro com o carimbo no nome. Um
   * `find` devolvia a PRIMEIRA, e no disco do `breu` isso era a versão de 17/11 (3 aspectos) em
   * vez da de 20/11 (10): um documento a assinar um recorte que o professor já substituiu. */
  const actos = fs.readdirSync(path.join(RAIZ, 'escola/breu/linhas-de-base'))
    .filter((n) => n.endsWith('.json') && !n.startsWith('.'))
    .map((n) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/breu/linhas-de-base', n), 'utf8')))
    .filter((l) => l.id === 'tami');
  const ordenadas = actos.slice().sort((a, b) => String(a.carimbo || '').localeCompare(String(b.carimbo || '')));
  const maisNova = ordenadas[ordenadas.length - 1];
  provar('a série do elenco tem mais de uma versão', ordenadas.length > 1, ordenadas.length);
  const forma = lb.linhaDeBaseDoElenco(actos, 'tami');
  provar('devolve a versão de carimbo MAIOR, e não a primeira da lista',
    Boolean(forma) && (forma.recorte.length === (maisNova.campos || []).length),
    { devolvido: forma && forma.recorte.length, esperado: (maisNova.campos || []).length,
      carimbo: maisNova.carimbo });
  provar('…e a lista foi dada ao contrário (a antiga em primeiro), para o teste valer',
    Boolean(forma) && lb.linhaDeBaseDoElenco(actos.slice().reverse(), 'tami').recorte.length
      === forma.recorte.length,
    { normal: forma && forma.recorte.length });
}

/* ------------------------------------------------------------------------------------------- */
console.log('\nE. Na página: o painel do Corpo mostra o valor, e não só o nome');
/* ------------------------------------------------------------------------------------------- */
(async () => {
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  let puppeteer = null;
  if (executavel) {
    try {
      const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
      puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
    } catch (e) { puppeteer = null; }
  }
  if (!puppeteer) {
    console.log('  NÃO FEITO — Chrome/puppeteer ausente; a secção E não foi medida.');
  } else {
    const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
    const kv = (i) => {
      const m = new Map(Object.entries(i || {}));
      return { async get(k) { return m.has(k) ? m.get(k) : null; },
        async put(k, v) { m.set(k, String(v)); }, async delete(k) { m.delete(k); },
        async list(p) { return { keys: [...m.keys()].filter((k) => !p || k.startsWith(p))
          .map((name) => ({ name })), list_complete: true }; } };
    };
    const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
      '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
    const assets = (dir) => ({ async fetch(r) {
      const u = r instanceof URL ? r : new URL(r.url);
      let p = path.join(dir, u.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' } });
    } });
    const ESP = 'breu';
    const base = {};
    for (const n of fs.readdirSync(path.join(RAIZ, 'escola', ESP, 'envelopes'))) {
      if (n.endsWith('.json')) base[ESP + '/envelope/' + n] =
        fs.readFileSync(path.join(RAIZ, 'escola', ESP, 'envelopes', n), 'utf8');
    }
    /* A LISTA, na chave onde o servidor a lê — e não um ficheiro por acto. Um elenco sintético
     * com LEITURA e com uma NOTA: é o estado que se quer medir na tela, e o acto real de hoje não
     * tem leitura (o passo 3 nunca foi refeito depois de o elenco ser esvaziado a 18/11). */
    const leituraSemeada = { em: '2026-11-20T21:00:00.000Z', alunas: ['Aluna A', 'Aluna B'],
      classificacao: lb.classificar(DISP, ANAMNESES) };
    /* A CHAVE TEM O PREFIXO `bastidores/` — `RAIZ` em bastidores.js é 'bastidores', e sem ele a
     * lista não é encontrada: a rota cai no ramo antigo e devolve o elenco sem linha nenhuma. */
    base['bastidores/' + ESP + '/linhas-de-base'] = JSON.stringify([{
      id: 'tami', nome: 'Tami', alunas: ['Aluna A', 'Aluna B'],
      campos: [
        { id: CAMPO, nome: '1ª posição — pés', grupo: 'as cinco posições: uma visão geral' },
        { id: 'passe', nome: 'o passé', grupo: 'Os elementos basilares' },
      ],
      leitura: leituraSemeada,
      enviada_em: '2026-11-20T21:00:00.000Z', carimbo: '20261120-2100', turma: 'Rosa',
    }]);
    base['bastidores/' + ESP + '/curadorias'] = JSON.stringify([{ id: 'c1', professor: 'demi-plie',
      turmas: ['Rosa'], alunas: ['Aluna A', 'Aluna B'], linhaDeBase: 'tami' }]);
    base['bastidores/' + ESP + '/turmas'] = JSON.stringify([{ id: 'rosa', nome: 'Rosa', ativo: true,
      frequencia: 3, dias: ['seg', 'qua', 'sex'],
      horarios: { seg: '10:30', qua: '10:30', sex: '10:30' }, duracaoMin: 120,
      periodoInicio: '2026-12-14', periodoFim: '2027-01-15', programaReferencia: 'RAD',
      nivelReferencia: 'Grade 1', rubrica: ['Excelente', 'Bom'] }]);
    base['bastidores/' + ESP + '/professores'] = JSON.stringify([{ nome: 'Demi Plié', slug: 'demi-plie', senha: 'p' }]);
    const env = { ESCOLA_SLUG: ESP, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Demi Plié',
      SENHA_PROFESSOR: 'p', SENHA_ADMIN: 'd', PADD_KV: kv(base),
      ASSETS: assets(path.join(RAIZ, 'publicacao', ESP)) };
    const srv = http.createServer(async (req, res) => {
      const pe = [];
      for await (const p of req) pe.push(p);
      const corpo = Buffer.concat(pe);
      const r = await producao.fetch(new Request('https://breu.tmenegaz77.workers.dev' + req.url, {
        method: req.method,
        headers: req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : undefined,
        body: corpo.length && req.method !== 'GET' ? corpo : undefined,
      }), env);
      res.writeHead(r.status, { 'content-type': r.headers.get('content-type') || 'text/html; charset=utf-8',
        'cache-control': 'no-store' });
      res.end(Buffer.from(await r.arrayBuffer()));
    });
    const URL0 = await new Promise((ok) => srv.listen(0, '127.0.0.1',
      () => ok('http://127.0.0.1:' + srv.address().port)));

    /* A ROTA, antes da página: ela é a que faltava devolver a mostra. */
    const r = await producao.fetch(new Request('https://breu.tmenegaz77.workers.dev/api/bastidores/alunas-da-turma?turma=Rosa'), env);
    const dados = await r.json().catch(() => ({}));
    provar('a rota responde o elenco', r.status === 200 && dados.ok === true, r.status);
    provar('…e devolve `mostra` (o que a turma mostra em cada aspecto)',
      Array.isArray(dados.mostra), Object.keys(dados));
    provar('…e `mostraCompleta` (a leitura inteira, para a poiesis)',
      Array.isArray(dados.mostraCompleta), Object.keys(dados));

    const br = await puppeteer.launch({ executablePath: executavel,
      args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const pg = await br.newPage();
    await pg.setViewport({ width: 1360, height: 900 });
    await pg.goto(URL0 + '/plano-observacao/?fonte=po&escola=breu&ajustar=po-20261121-1120'
      + '&professor=demi-plie&ciclo=01&plano=plano-20261121-1120', { waitUntil: 'networkidle2', timeout: 60000 });
    /* Ir ao degrau das dimensões, que é onde o painel vive. */
    await pg.evaluate(() => {
      const li = [...document.querySelectorAll('#roteiro li')].find((x) => /Dimensões observadas/.test(x.textContent));
      if (li) (li.querySelector('a, button') || li).click();
    });
    await new Promise((ok) => setTimeout(ok, 4000));
    const tela = await pg.evaluate(() => {
      const p = document.querySelector('.corpo-do-sujeito');
      return p ? p.innerText.replace(/\s+/g, ' ').trim().slice(0, 900) : null;
    });
    provar('o painel do Corpo foi desenhado', Boolean(tela), tela);
    provar('o painel nomeia os aspectos (o que já fazia)', Boolean(tela) && /1ª posição/.test(tela), tela);
    /* O DEFEITO: só nomes. O CONSERTO: o valor ao lado. */
    provar('…e mostra o VALOR lido ao lado do aspecto — «em «nível»»',
      Boolean(tela) && /em «/.test(tela), tela);
    provar('…ou diz que o elenco não tem leitura, em vez de deixar o nome sozinho',
      Boolean(tela) && (/em «/.test(tela) || /não foi feita|não têm leitura/.test(tela)), tela);

    /* O ESTADO QUE ESTÁ AO VIVO HOJE. O acto real do elenco (`tami--20261120-2146`) não tem
     * `leitura`: o passo 3 nunca foi refeito depois de o elenco ser esvaziado a 18/11. É preciso
     * medir que, nesse estado, o painel NOMEIA a falta do passo — e não que se limita a desenhar
     * nomes, que é o que ela viu e leu como «não é verdade que não há registo». */
    const camposDoElenco = [
      { id: CAMPO, nome: '1ª posição — pés', grupo: 'as cinco posições: uma visão geral' },
      { id: 'passe', nome: 'o passé', grupo: 'Os elementos basilares' },
    ];
    await env.PADD_KV.put('bastidores/' + ESP + '/linhas-de-base', JSON.stringify([{
      id: 'tami', nome: 'Tami', alunas: ['Aluna A', 'Aluna B'], campos: camposDoElenco,
      enviada_em: '2026-11-21T10:00:00.000Z', carimbo: '20261121-1000', turma: 'Rosa',
    }]));
    await pg.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await pg.evaluate(() => {
      const li = [...document.querySelectorAll('#roteiro li')].find((x) => /Dimensões observadas/.test(x.textContent));
      if (li) (li.querySelector('a, button') || li).click();
    });
    await new Promise((ok) => setTimeout(ok, 4000));
    const semLeitura = await pg.evaluate(() => {
      const p = document.querySelector('.corpo-do-sujeito');
      return p ? p.innerText.replace(/\s+/g, ' ').trim() : null;
    });
    provar('sem leitura no elenco, o painel diz que falta um passo (o estado de hoje ao vivo)',
      Boolean(semLeitura) && /ainda não foi feita/.test(semLeitura),
      semLeitura && semLeitura.slice(0, 300));
    await pg.close();
    await br.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: «o que se observa» é o que a anamnese registou — '
    + 'o nível, o apoio da segunda etapa e a nota escrita pelo professor —, o recorte é do Corpo e a '
    + 'leitura inteira serve a Poiesis, e o painel mostra o valor ao lado do aspecto em vez de só o nome.');
})();
