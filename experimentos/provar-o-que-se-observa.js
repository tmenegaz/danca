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
 *      lado de cada aspecto, e não só o nome — e, quando o elenco NÃO tem leitura, diz que falta um
 *      passo e nomeia o botão («Ler as anamneses»), em vez de a mandar a um «passo 3» sem endereço;
 *   F. o elenco por ler é dito nos três sítios onde ela pode encontrá-lo: a conclusão (a resposta
 *      leva o aviso), o cartão da lista (o «!» com a dica do caminho) e a frase do painel; e uma
 *      anamnese que a chave não abre é um 409 com a sua frase — não um 200 «não há anamnese».
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `motor/nucleo/linha-de-base.js` e o
 * `derivar-ciclo.js` de `--contra=<rev>` (padrão `HEAD`). Espera-se que A, B, C, D e D2 caiam.
 * E, DEPOIS DA ENTREGA, o `HEAD` já é a versão nova: o controle só mede com a linha de base
 * fixada no commit anterior — `--contra=75b91620`, no caso desta.
 *
 * O QUE O CONTROLE NÃO ALCANÇA, e é dito: as secções E, F e G medem a PÁGINA e as ROTAS
 * (`bastidores.js`, `porta/index.html`), que ele NÃO reverte — elas passam nas duas versões. Medido:
 * com `--contra=7839fed0` caiem 0; com `--contra=75b91620` caiem as 14 do núcleo. Uma prova cujo
 * controle negativo nunca falha não é um controle: o número certo a citar é o da base do núcleo,
 * e o âmbito tem de estar escrito.
 *
 *   node experimentos/provar-o-que-se-observa.js [--controle-negativo [--contra=<rev>]]
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.indexOf('--controle-negativo') !== -1;
/* CONTRA QUE VERSÃO SE COMPARA. O padrão é `HEAD`, e ele serviu enquanto o trabalho estava por
 * commitar. Depois do commit, `HEAD` É a versão nova — e o controle negativo passa a comparar o
 * novo com o novo, que dá 41/41 e não prova nada. `--contra=<rev>` fixa a linha de base no commit
 * anterior à entrega: é a única forma de a prova continuar a valer depois de publicada. */
const CONTRA = ((process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || 'HEAD');

/** O módulo de hoje — ou o de `CONTRA`, no controle negativo. */
function carregarDe(modulo) {
  if (!NEGATIVO) return require(path.join(RAIZ, modulo));
  const fonte = execFileSync('git', ['show', CONTRA + ':' + modulo], { cwd: RAIZ, encoding: 'utf8' });
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
    /* `|| []` em tudo: no controle negativo `mostraCompleta` NÃO EXISTE, e sem a guarda o processo
     * morria aqui com um `TypeError` — a prova dizia «6 falhas» e mais nada, quando a falha que
     * interessa (a leitura inteira não existir) não chegava a ser contada. */
    const mostra = forma.mostra || [];
    const completa = forma.mostraCompleta || [];
    const recorte = forma.recorte || [];
    provar('`mostra` é SÓ o recorte',
      mostra.length === recorte.length && mostra.length > 0,
      { mostra: mostra.length, recorte: recorte.length });
    provar('`mostraCompleta` é a leitura inteira (mais do que o recorte)',
      completa.length > recorte.length,
      { completa: completa.length, recorte: recorte.length });
    provar('…e inclui os aspectos de musicalidade',
      completa.some((m) => m.eixo === 'Musicalidade'),
      completa.filter((m) => m.eixo === 'Musicalidade').map((m) => m.nome).slice(0, 3));
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
console.log('\nE. Na página: o painel do Corpo mostra as DIMENSÕES, e só elas');
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
    const BASE = URL0;

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
    provar('o painel nomeia os aspectos', Boolean(tela) && /1ª posição/.test(tela), tela);
    /* A DECISÃO DELA, 21/11/2026, e é uma REVERSÃO do que esta prova media antes:
     *
     *   «Eu não espero que os resultados estejam aqui no plano de observação, tá? O plano de
     *    observação é exatamente o que está aqui. Não precisa ter isso. E essa parte que você pôs,
     *    "sem leitura neste elenco", esses elementos aqui você tem que tirar. Esse monte de texto
     *    que você incluiu aqui também você tem que tirar.»
     *
     * O PO mostra as DIMENSÕES — os aspectos, agrupados. O valor lido vai para a coluna «o que se
     * observa» da AULA, que é o documento que se leva para a sala. Três asserções o medem, e são
     * negativas de propósito: uma peça a mais volta a entrar sem ninguém dar por isso. */
    provar('…e NÃO mostra o valor lido («em «nível»») — o valor é da aula, não do PO',
      Boolean(tela) && !/em «/.test(tela), tela);
    provar('…e NÃO diz «sem leitura neste elenco»',
      Boolean(tela) && !/sem leitura neste elenco|sem leitura registada/i.test(tela), tela);
    provar('…e NÃO traz instruções de outro ecrã («Ler as anamneses», «Bastidores →»)',
      Boolean(tela) && !/Ler as anamneses|Bastidores →|passo 3 «Anamneses»/.test(tela), tela);

    /* O MESMO PAINEL, COM O ELENCO POR LER — e ele fica IGUAL. É o que a decisão dela pede: a
     * leitura em falta não se explica no PO, porque o PO não é o sítio onde os valores aparecem. */
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
    provar('sem leitura no elenco, o painel é o MESMO — não acrescenta um recado',
      Boolean(semLeitura) && !/ainda não foi feita|sem leitura/i.test(semLeitura),
      semLeitura && semLeitura.slice(0, 300));
    provar('…e continua a nomear os aspectos',
      Boolean(semLeitura) && /1ª posição/.test(semLeitura), semLeitura && semLeitura.slice(0, 200));

    /* --------------------------------------------------------------------------------------- */
    console.log('\nF. O elenco por ler: dito na conclusão e na lista (o caminho inteiro)');
    /* --------------------------------------------------------------------------------------- */
    /* A ORIGEM DA API É A DAS OUTRAS BANCADAS (`https://breu.exemplo`), e não a do anfitrião
     * `…workers.dev` que as páginas usam: um POST nesse anfitrião cai na guarda de identidade do
     * Worker («Configuração incorreta») antes de chegar a rota nenhuma — medido, com o 500 dela.
     * O subdomínio `breu` bate com o `ESCOLA_SLUG` desta bancada, e é assim que as provas que
     * escrevem o fazem desde a primeira. */
    const ORIGEM = 'https://breu.exemplo';
    const pedir = (caminho, corpo) => producao.fetch(new Request(ORIGEM + caminho,
      corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo) } : undefined), env);
    const rl = await pedir('/api/bastidores/validar-producao', { senha: 'd' });
    const textoDoLogin = await rl.text();
    let dl = {};
    try { dl = JSON.parse(textoDoLogin); } catch (e) { dl = {}; }
    const TOKEN = dl.token;
    provar('a direção entra (sem isto a conclusão não se prova)',
      Boolean(TOKEN), { status: rl.status, corpo: textoDoLogin.slice(0, 300) });

    /* CONCLUIR SEM A LEITURA. O recorte pode vir da derivação — foi o que ela fez —, e a conclusão
     * aceitava-o calada: o elenco entrava na cadeia como se os corpos tivessem sido lidos. */
    const rc = await pedir('/api/bastidores/linha-de-base', {
      nome: 'Tami', alunas: ['Aluna A', 'Aluna B'], campos: camposDoElenco,
      rascunho: false, concluir: true, token: TOKEN });
    const textoDaConclusao = await rc.text();
    let dc = {};
    try { dc = JSON.parse(textoDaConclusao); } catch (e) { dc = {}; }
    provar('concluir um elenco por ler diz o que falta, em vez de calar',
      rc.status < 300 && /Ler as anamneses/.test(String(dc.avisoLeitura || '')),
      { status: rc.status, avisoLeitura: dc.avisoLeitura || null, erro: dc.erro || null,
        corpo: textoDaConclusao.slice(0, 300) });

    /* A LISTA — o segundo sítio onde a falta tem de ser visível, porque é por onde ela passou. */
    const pb = await br.newPage();
    await pb.goto(BASE + '/bastidores/producao', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await pb.evaluate((t) => { try { sessionStorage.setItem('producao:token', t); } catch (e) {} }, TOKEN);
    await pb.goto(BASE + '/bastidores/producao', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((ok) => setTimeout(ok, 3000));
    const cartao = await pb.evaluate(() => {
      const li = document.querySelector('[data-elenco]');
      if (!li) return null;
      const nome = li.querySelector('.trio-nome');
      if (!nome) return null;
      const alerta = nome.querySelector('.selo.alerta');
      return { texto: nome.textContent.replace(/\s+/g, ' ').trim(),
        dica: alerta ? String(alerta.getAttribute('title') || '') : null };
    });
    provar('o cartão do elenco por ler leva a marca (o mesmo «!» da revisão pendente)',
      Boolean(cartao) && cartao.dica !== null, cartao);
    /* E UM RASCUNHO NÃO A LEVA: um elenco a meio da composição ainda não devia ter lido nada, e o
     * «por completar» já diz o que lhe falta. Um aviso que aparece quando não é preciso deixa de se
     * ler quando é. */
    const rascunho = await pedir('/api/bastidores/linha-de-base', {
      nome: 'Rascunho', alunas: ['Aluna A'], campos: [], rascunho: true, token: TOKEN });
    provar('…e gravar um rascunho (sem recorte) continua a ser possível',
      rascunho.status < 300, { status: rascunho.status });
    await pb.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((ok) => setTimeout(ok, 2500));
    const doRascunho = await pb.evaluate(() => {
      const li = [...document.querySelectorAll('[data-elenco]')]
        .find((x) => /Rascunho/.test(x.textContent));
      if (!li) return { achou: false };
      const alerta = li.querySelector('.trio-nome .selo.alerta');
      return { achou: true, dica: alerta ? String(alerta.getAttribute('title') || '') : null,
        selo: alerta ? alerta.textContent.trim() : null };
    });
    provar('…e o cartão do rascunho NÃO leva o aviso da leitura (só o «por completar»)',
      doRascunho.achou && !/Ler as anamneses/.test(String(doRascunho.dica)), doRascunho);
    provar('…e a dica da marca diz o caminho: Audição, passo 3, «Ler as anamneses»',
      Boolean(cartao) && /Ler as anamneses/.test(String(cartao.dica)) && /Audição/.test(String(cartao.dica)),
      cartao && cartao.dica);

    /* A TERCEIRA MENTIRA: «não há anamnese» quando o que há é uma chave que não abre. O `catch` do
     * laço é justo (uma ilegível não impede ler as outras), mas ele engolia a causa. A frase e o
     * estado vivem no acervo, e é lá que se medem. */
    const acervoDeEnvelopes = require(path.join(RAIZ, 'motor/servidor/acervo-envelopes.js'));
    const Cifra = require(path.join(RAIZ, 'tools/lib-cifra.js'));
    const cifrado = await Cifra.cifrar(JSON.stringify({ respostas: { [CAMPO]: { valor: ['Bom'] } } }),
      'chave-certa', { iteracoes: 1000 });
    let erroDeChave = null;
    try {
      await acervoDeEnvelopes.abrirArquivoCifrado({ respostas: { _cifrado: cifrado } }, 'chave-errada');
    } catch (e) { erroDeChave = e; }
    provar('uma anamnese que a chave não abre é um 409 com a sua frase, e não um 200 «não há»',
      Boolean(erroDeChave) && erroDeChave.status === 409
        && /chave desta escola não abre/.test(String(erroDeChave.message)),
      erroDeChave && { status: erroDeChave.status, message: erroDeChave.message });

    /* --------------------------------------------------------------------------------------- */
    console.log('\nG. Porque é que a leitura dela não aparecia: duas pessoas com o mesmo apelido');
    /* --------------------------------------------------------------------------------------- */
    /* O DEFEITO MEDIDO AO VIVO, e é a resposta à pergunta dela («fiz exatamente o que você
     * descreve ali, mas não surtiu efeito»).
     *
     * O `vigente` de uma anamnese é por PESSOA (`alunaId`). Um envelope antigo não declara
     * `alunaId`, e a identidade dele cai no apelido derivado — que não é o id da pessoa nova. Com
     * dois envelopes do mesmo apelido, um com id e outro sem, a leitura de «Aluna A, Aluna B»
     * devolvia QUATRO nomes. Os valores não se corrompiam (o envelope antigo quase não tem
     * respostas), mas a lista de alunas ficava com repetições — e o «Gravar» compara essa lista
     * com a do elenco. Não batia, e a leitura era deitada fora em silêncio. Era este o fio.
     *
     * Aqui as duas coisas ficam medidas: uma anamnese por apelido (a mais recente), e o «Gravar»
     * que já não perde a leitura quando a lista traz um nome repetido. */
    /* O ENVELOPE VAI EM CLARO, e de propósito: sem `GITHUB_TOKEN` o acervo cai no KV, e o caminho
     * do KV devolve o arquivo como está — a decifra vive no acervo do REPOSITÓRIO (medido: com o
     * envelope cifrado, os 45 aspectos saíam em «sem registo»). O que esta secção mede é a CONTAGEM
     * das pessoas, não a cifra: essa já está medida na §F, com a chave errada. */
    const TOKEN2 = TOKEN;
    const respostas = { [CAMPO]: { valor: ['Bom', 'consciencia-propria'], nota: 'o arco cede' } };
    const selar = async (id, aluna, alunaId, quando) => {
      const arq = { id, documento: 'anamnese',
        contexto: { escola: ESP, professor: 'demi-plie', aluna, ...(alunaId ? { alunaId } : {}) },
        respostas };
      await env.PADD_KV.put(ESP + '/envelope/' + id + '.json', JSON.stringify(arq));
      return { nome: id + '.json', id, documento: 'anamnese',
        resumo: { id, fonte: 'anamnese', escola: ESP, professor: 'demi-plie', aluna,
          ...(alunaId ? { alunaId } : {}), gerado_em: quando } };
    };
    /* A «Aluna A» ANTIGA (sem id) e a NOVA (com id) — o caso que duplicava. E a «Aluna B» só uma. */
    const seladas = [];
    seladas.push(await selar('anamnese-20261116-2201', 'Aluna A', null, '2026-11-16T22:01'));
    seladas.push(await selar('anamnese-20261118-1737', 'Aluna A', 'aluna-a-3', '2026-11-18T17:37'));
    seladas.push(await selar('anamnese-20261119-1145', 'Aluna B', 'aluna-b-2', '2026-11-19T11:45'));
    await env.PADD_KV.put(ESP + '/envelope/.indice.json', JSON.stringify({
      versao: 2,
      nomes: seladas.map((x) => x.nome),
      resumos: Object.fromEntries(seladas.map((x) => [x.nome, x.resumo])),
    }));
    /* O elenco de novo na lista, agora sem leitura, para a rota a ir buscar. */
    await env.PADD_KV.put('bastidores/' + ESP + '/linhas-de-base', JSON.stringify([{
      id: 'tami', nome: 'Tami', alunas: ['Aluna A', 'Aluna B'], campos: camposDoElenco,
      enviada_em: '2026-11-21T10:00:00.000Z', carimbo: '20261121-1000', turma: 'Rosa',
    }]));

    const rl2 = await pedir('/api/bastidores/linha-de-base/leitura?id=tami&alunas='
      + encodeURIComponent('Aluna A,Aluna B'));
    const dl2 = await rl2.json().catch(() => ({}));
    const nomesLidos = (dl2.leitura && Array.isArray(dl2.leitura.alunas)) ? dl2.leitura.alunas : [];
    provar('a leitura lê as anamneses e devolve o resultado',
      rl2.status === 200 && dl2.ok === true && Boolean(dl2.classificacao),
      { status: rl2.status, erro: dl2.erro || null });
    provar('…e conta cada apelido UMA vez (dois envelopes da «Aluna A», um sem `alunaId`)',
      nomesLidos.length === 2, { alunas: nomesLidos });
    /* Um aspecto pode estar em mais de uma lista — procura-se em todas as que o classificam. */
    const lidoDoCampo = ['atencao', 'excelencia', 'comuns', 'musicalidade']
      .flatMap((k) => (dl2.classificacao && dl2.classificacao[k]) || [])
      .find((x) => x && x.id === CAMPO);
    provar('…e a frase é de DUAS alunas, não de três ou quatro',
      Boolean(lidoDoCampo) && /de 2 em /.test(String(lidoDoCampo.texto))
        && !/de [34] em /.test(String(lidoDoCampo.texto)),
      lidoDoCampo && lidoDoCampo.texto
        || { achou: Boolean(lidoDoCampo), contagens: Object.fromEntries(['atencao', 'excelencia',
          'comuns', 'musicalidade', 'semRegisto'].map((k) => [k,
          ((dl2.classificacao && dl2.classificacao[k]) || []).length])) });
    provar('…e a nota que o professor escreveu atravessa',
      Boolean(lidoDoCampo) && (lidoDoCampo.notas || []).some((n) => /arco cede/.test(n.texto)),
      lidoDoCampo && lidoDoCampo.notas);

    /* O «GRAVAR» QUE DEITAVA A LEITURA FORA. A lista de alunas da leitura traz um nome repetido —
     * o rascunho antigo, gravado antes do conserto —, e o elenco declara os dois uma vez. Com a
     * comparação antiga (lista ordenada) não batia e a leitura era descartada; com o conjunto
     * (sem repetições) bate, e a leitura vai para o acto. */
    const rascunhoComLeitura = JSON.parse(await env.PADD_KV.get('bastidores/' + ESP + '/linhas-de-base'));
    rascunhoComLeitura[0].leitura = Object.assign({}, dl2.leitura,
      { alunas: ['Aluna A', 'Aluna B', 'Aluna A', 'Aluna B'] });
    await env.PADD_KV.put('bastidores/' + ESP + '/linhas-de-base', JSON.stringify(rascunhoComLeitura));
    const rc2 = await pedir('/api/bastidores/linha-de-base', {
      nome: 'Tami', alunas: ['Aluna A', 'Aluna B'], campos: camposDoElenco,
      rascunho: false, concluir: true, token: TOKEN2 });
    const dc2 = await rc2.json().catch(() => ({}));
    provar('concluir o elenco LEVA a leitura, mesmo com a lista repetida no rascunho',
      rc2.status < 300 && Boolean(dc2.linha && dc2.linha.leitura),
      { status: rc2.status, temLeitura: Boolean(dc2.linha && dc2.linha.leitura), erro: dc2.erro || null });
    provar('…e por isso o «Concluir» já não avisa que falta um passo',
      !dc2.avisoLeitura, dc2.avisoLeitura || null);
    await pb.close();
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
    + 'o nível, o apoio da segunda etapa e a nota escrita pelo professor —, e é a AULA que o imprime; '
    + 'o recorte é do Corpo e a leitura inteira serve a Poiesis; o painel do PO mostra as dimensões e '
    + 'só elas; a leitura conta cada apelido uma vez, e o «Gravar» deixa de a deitar fora.');
})();
