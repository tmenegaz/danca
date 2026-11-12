#!/usr/bin/env node
'use strict';

/*
 * provar-revisao-do-recorte.js — A TROCA DE ALUNA OBRIGA A REFAZER O PASSO 3 E O RECORTE
 * (12/11/2026).
 *
 * O QUE MOTIVOU, na letra dela: «quando há a transferência de alunas de um elenco para o outro, o
 * cenário da leitura dessas anamneses, ele é modificado. […] se uma aluna tinha uma certa
 * característica que as outras não tinham e estava selecionada no recorte, não faz mais sentido ter
 * esse item selecionado no recorte. […] a gente não tem como saber se isso foi feito.»
 *
 * AS DUAS RESPOSTAS, medidas no código e nesta prova:
 *
 *   · o botão «Ler as anamneses dessas alunas» **não é disparado** pela transferência — e a
 *     leitura guardada é **descartada** nos dois lados (`delete linha.leitura`), porque descrevia
 *     os corpos que estavam juntos e deixou de ser verdade. Nada a repõe;
 *   · o **recorte (`campos`) fica exactamente como estava**. É o defeito: um aspecto escolhido por
 *     causa de uma aluna que saiu continua marcado, e o documento continua a imprimi-lo.
 *
 * A MARCA É DERIVADA — e é isso que a torna certa. A transferência já deixa o rasto datado
 * (`transferida`/`recebida` com `em`). A revisão está feita quando `leitura.em` **e**
 * `atualizada_em` são posteriores a esse `em`; antes disso, o «!» está aceso. Não há um terceiro
 * campo «revisado» para alguém esquecer de limpar, e a marca nunca sai sozinha.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   1. O NÚCLEO — `revisaoPendente`: sem troca, `null`; com troca, as duas metades em falta; só a
 *      leitura refeita, uma; as duas, `null`. E a comparação é ESTRITA (o acto da troca grava
 *      `atualizada_em = em`, e `>=` daria a revisão por feita no instante da própria troca).
 *   2. A FRASE — diz «perdeu»/«recebeu», nomeia o elenco, a aluna e o outro lado, e é um MODELO
 *      (`%DATA%`), preenchido no servidor: escrita duas vezes, divergiria.
 *   3. A ROTA — depois de uma transferência, `…/linhas-de-base` devolve `revisoes` com os DOIS
 *      elencos, e cada frase está preenchida.
 *   4. O RASCUNHO NÃO ESCONDE A MARCA — o rascunho aberto substitui o acto na lista, e não tem as
 *      marcas da troca (elas nascem no acto). Sem a herança em `linhasDeBase`, a marca desaparecia
 *      exactamente com o elenco aberto para editar. É a asserção que reprovava o código de antes.
 *   5. O CLIENTE — o «!» aparece nos DOIS cartões (o que perdeu e o que recebeu), com o `title` e o
 *      `aria-label`; o da Turma é revelado pela repintura, sem recarregar a página; e, refeitos os
 *      dois passos, as marcas apagam-se.
 *   6. A PEÇA — é o `.selo alerta` que já existe, não uma pílula inventada.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` corre o núcleo e o servidor de `REF_NEGATIVO`.
 *
 *   node experimentos/provar-revisao-do-recorte.js
 *   REF_NEGATIVO=ae04b17a node experimentos/provar-revisao-do-recorte.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;
const REF = process.env.REF_NEGATIVO || 'HEAD';

let destino = RAIZ;
if (negativo) {
  destino = fs.mkdtempSync(path.join(os.tmpdir(), 'revisao-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const nucleo = require(path.join(destino, 'motor/nucleo/linha-de-base.js'));
const transferencia = require(path.join(destino, 'motor/nucleo/transferencia.js'));
const bastidores = require(path.join(destino, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'calango';
const T = '2026-11-12T10:00:00.000Z';          // o instante da troca
const DEPOIS = '2026-11-12T11:00:00.000Z';     // a leitura refeita
const DEPOIS2 = '2026-11-12T11:05:00.000Z';    // o recorte regravado

function linha(extra) {
  return Object.assign({
    id: 'ame', nome: 'AME', professor: 'pe-torto', alunas: ['Aluna B'],
    campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
    /* O CARIMBO É O DA CASA (`AAAAMMDD-HHMM`): `vigentes()` escolhe o maior por ordem de TEXTO, e
     * um carimbo de mentira (`c1`) ganharia a qualquer data real — a prova mediria o fixture. */
    atualizada_em: T, carimbo: '20260101-0900', chave: 'ame--20260101-0900.json',
  }, extra || {});
}
const SAIU = linha({ transferida: { aluna: 'Aluna A', para: 'tami', em: T } });
const ENTROU = linha({
  id: 'tami', nome: 'TAMI', carimbo: '20260101-0910', chave: 'tami--20260101-0910.json',
  recebida: { aluna: 'Aluna A', de: 'ame', em: T },
});

// ==========================================================================================
console.log('1. A REGRA — a marca só sai quando os dois passos são refeitos');

/* No controle negativo a função não existe — e é isso que se mede. As asserções seguintes passam
 * a correr sobre uma função que devolve `null` sempre: a prova REPROVA em vez de rebentar, que é o
 * que um controle negativo precisa de fazer para valer alguma coisa. */
if (typeof nucleo.revisaoPendente !== 'function') nucleo.revisaoPendente = () => null;
{
  provar('o núcleo tem `revisaoPendente`', true);
  provar('sem troca nenhuma, não há nada a revisar', nucleo.revisaoPendente(linha()) === null,
    nucleo.revisaoPendente(linha()));

  const r = nucleo.revisaoPendente(SAIU);
  provar('o elenco que perdeu a aluna fica com a revisão pendente', Boolean(r), r);
  provar('…e o que falta são as DUAS metades',
    r && r.falta.join(',') === 'leitura,recorte', r && r.falta);
  provar('…e o movimento é «saiu»', r && r.movimento === 'saiu', r && r.movimento);

  const soLeitura = nucleo.revisaoPendente(Object.assign({}, SAIU, { leitura: { em: DEPOIS } }));
  provar('só a leitura refeita: continua pendente, e falta o recorte',
    soLeitura && soLeitura.falta.join(',') === 'recorte', soLeitura && soLeitura.falta);
  provar('…e a frase diz o que falta, e só isso',
    Boolean(soLeitura) && /Por fazer: o recorte \(passo 4\)/.test(soLeitura.texto),
    soLeitura && soLeitura.texto);

  provar('a leitura E o recorte refeitos: a marca sai',
    nucleo.revisaoPendente(Object.assign({}, SAIU, {
      leitura: { em: DEPOIS }, atualizada_em: DEPOIS2,
    })) === null);

  /* A COMPARAÇÃO É ESTRITA. O acto da troca grava `atualizada_em = em` exactamente — e um `>=`
   * daria a revisão do recorte por feita no instante em que ela começou a faltar. */
  provar('recorte com o MESMO instante da troca NÃO conta como refeito',
    Boolean(nucleo.revisaoPendente(Object.assign({}, SAIU, {
      leitura: { em: DEPOIS }, atualizada_em: T,
    }))));

  /* O LADO QUE RECEBEU também precisa de revisão — é o caso dela: a aluna que chega traz
   * características que ninguém do elenco tinha, e o recorte foi decidido sem ela. */
  const e = nucleo.revisaoPendente(ENTROU);
  provar('o elenco que recebeu a aluna também fica pendente', Boolean(e), e);
  provar('…e o movimento é «entrou»', e && e.movimento === 'entrou', e && e.movimento);

  /* AS DUAS MARCAS: manda a MAIS RECENTE. A versão nova herda as marcas da anterior, e um elenco
   * que perdeu uma aluna em Outubro e recebeu outra em Novembro tem as duas. Comparar com a mais
   * antiga daria a revisão por feita por causa de um trabalho feito antes da última mudança — um
   * falso negativo. O caso é real: nos dados do ar, «ami» tinha `transferida` às 10:47 e
   * `recebida` às 11:15. */
  const duas = Object.assign({}, SAIU, {
    recebida: { aluna: 'Aluna Z', de: 'tami', em: DEPOIS },
  });
  const r2 = nucleo.revisaoPendente(duas);
  provar('com as duas marcas, manda a troca MAIS RECENTE',
    r2 && r2.em === DEPOIS && r2.movimento === 'entrou' && r2.aluna === 'Aluna Z', r2);
  provar('…e uma leitura feita antes da última troca NÃO conta como revisão',
    Boolean(nucleo.revisaoPendente(Object.assign({}, duas, {
      leitura: { em: '2026-11-12T10:30:00.000Z' }, atualizada_em: DEPOIS2,
    }))));

  provar('sem data na troca não se inventa uma revisão',
    nucleo.revisaoPendente(linha({ transferida: { aluna: 'X', para: 'y' } })) === null);
  provar('um rascunho recém-criado não é uma revisão',
    nucleo.revisaoPendente({ id: 'novo', nome: 'Novo', alunas: [], campos: [] }) === null);
}

// ==========================================================================================
console.log('\n2. A FRASE — um modelo, e cada lado diz o que lhe aconteceu');

{
  const a = nucleo.revisaoPendente(SAIU);
  const b = nucleo.revisaoPendente(ENTROU);
  /* `null` quando não há revisão a calcular — o controle negativo chega aqui sem a regra, e a
   * prova tem de REPROVAR as frases em vez de rebentar a ler `.texto` de nada. */
  const texto = (r) => (r && r.texto) || '';
  provar('a frase do que perdeu diz «perdeu» e nomeia a aluna e o destino',
    /perdeu a aluna «Aluna A»/.test(texto(a)) && /foi para «tami»/.test(texto(a)), texto(a));
  provar('a frase do que recebeu diz «recebeu» e nomeia a origem',
    /recebeu a aluna «Aluna A»/.test(texto(b)) && /veio de «ame»/.test(texto(b)), texto(b));
  provar('as duas pedem os dois passos, pelos nomes que a tela usa',
    /passo 3/.test(texto(a)) && /passo 4/.test(texto(a)), texto(a));
  provar('…e a data fica como MODELO — quem a preenche é o servidor',
    /%DATA%/.test(texto(a)), texto(a).slice(0, 90));
}

// ==========================================================================================
console.log('\n3. O SERVIDOR — a frase preenchida, e a marca nos dois cartões');

const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
function pagina(linhas, curs) {
  return bastidores.paginaProducao(ESCOLA,
    { professor: 'pe-torto', escola: ESCOLA, query: 'professor=pe-torto&escola=' + ESCOLA },
    [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A', 'Aluna B', 'Aluna C'], 'Pe Torto',
    'pe-torto', [], [], {}, curs || [], [], [], usos,
    { modo: 'clara', paleta: 'bordo' }, '', linhas);
}
function curadoriaCom(elenco, turma) {
  return {
    id: 'pe-torto-bale-classico-' + turma, professor: 'pe-torto', modalidade: 'Balé clássico',
    tradicao: 'RAD', turma, turmas: [turma], linhaDeBase: elenco, linhaDeBaseNome: elenco,
    alunas: [], nivel: '1',
  };
}

{
  const html = pagina([SAIU, ENTROU], [curadoriaCom('ame', 'Piano'), curadoriaCom('tami', 'Rosa')]);
  const m = /var REVISOES_DOS_ELENCOS = (\{.*?\});/s.exec(html);
  const mapa = m ? JSON.parse(m[1]) : {};
  provar('o mapa das revisões chega ao cliente', Object.keys(mapa).length === 2, Object.keys(mapa));
  provar('…com a data PREENCHIDA, não o modelo',
    mapa.ame && /em 12\/11\/2026/.test(mapa.ame.texto) && !/%DATA%/.test(mapa.ame.texto),
    mapa.ame && mapa.ame.texto.slice(0, 150));
  provar('…e as duas metades em falta, para cada lado',
    mapa.ame && mapa.ame.falta.length === 2 && mapa.tami && mapa.tami.falta.length === 2,
    { ame: mapa.ame && mapa.ame.falta, tami: mapa.tami && mapa.tami.falta });
  provar('a marca está no cartão da Turma, com o elenco que ela lê',
    /data-revisao="ame"/.test(html) && /data-revisao="tami"/.test(html));
  provar('…e com a frase no `title`, para o rato',
    /title="o elenco «AME» perdeu a aluna/.test(html));
  provar('…e no `aria-label`, para quem ouve',
    /aria-label="o elenco «AME» perdeu a aluna/.test(html));
  provar('a peça é o `.selo alerta` que já existe — não uma pílula inventada',
    /class="selo alerta" data-revisao="ame"/.test(html), 'procura no HTML');
}

{
  /* SEM REVISÃO, a marca existe mas está escondida: é o que permite acendê-la sem desenhar o
   * cartão outra vez. E sem revisão nenhuma, o mapa é vazio. */
  const html = pagina([linha()], [curadoriaCom('ame', 'Piano')]);
  const m = /var REVISOES_DOS_ELENCOS = (\{.*?\});/s.exec(html);
  provar('sem troca, o mapa vem vazio', m && m[1].trim() === '{}', m && m[1]);
  provar('…e a marca da Turma vem escondida (`hidden`)',
    /data-revisao="ame"[^>]*hidden/.test(html), 'procura no HTML');
}

// ==========================================================================================
console.log('\n4. O RASCUNHO NÃO ESCONDE A MARCA');

/* AS ROTAS, com KV e GitHub em memória — o caminho verdadeiro da transferência. */
function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    _dados: dados,
  };
}
function githubDeBolso(arquivos) {
  const ficheiros = new Map(Object.entries(arquivos || {}));
  const escritas = [];
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const json = (o, st) => new Response(JSON.stringify(o),
    { status: st || 200, headers: { 'content-type': 'application/json' } });
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return json({ sha: 'arvore',
        tree: [...ficheiros.keys()].map((p) => ({ path: p, type: 'blob', sha: 's' })) });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!ficheiros.has(caminho)) return new Response('nao', { status: 404 });
      return json({ sha: 'sha-' + caminho, content: b64(ficheiros.get(caminho)) });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      const texto = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      escritas.push({ caminho, texto });
      ficheiros.set(caminho, texto);
      return json({ commit: { sha: 'c' + escritas.length } }, 201);
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, escritas };
}

const ORIGEM = linha({ alunas: ['Aluna A', 'Aluna B'] });
const DESTINO = linha({ id: 'tami', nome: 'TAMI', alunas: ['Aluna C'],
  carimbo: '20260101-0910', chave: 'tami--20260101-0910.json' });
const caminhoDe = (l) => 'escola/' + ESCOLA + '/linhas-de-base/' + l.id + '--' + l.carimbo + '.json';
const arquivosDoRepo = () => ({
  [caminhoDe(ORIGEM)]: JSON.stringify(ORIGEM, null, 2) + '\n',
  [caminhoDe(DESTINO)]: JSON.stringify(DESTINO, null, 2) + '\n',
  ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']: JSON.stringify({
    versao: 1,
    versoes: Object.fromEntries([ORIGEM, DESTINO].map((l) => [l.id + '--' + l.carimbo + '.json', {
      id: l.id, carimbo: l.carimbo, arquivo: caminhoDe(l), nome: l.nome,
      professor: l.professor, turma: null, atualizada_em: l.atualizada_em, enviada_em: null,
      aspectos: (l.campos || []).map((c) => c.id), alunas: (l.alunas || []).length,
    }])),
  }, null, 2) + '\n',
});

const senha = 'senha-de-prova';
const prepEnv = (kv) => ({
  ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
  SENHA_ADMIN: senha, SENHA_PROFESSOR: 'outra',
  PROFESSOR_NOME: 'Professora Dona', PROFESSOR_SLUG: 'dona',
  GITHUB_TOKEN: 'token-de-prova',
  PADD_KV: kvDeMentira(kv || {}),
});
const pedir = async (env, caminho, corpo) => {
  const init = corpo === undefined ? { method: 'GET' } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
  };
  const r = await bastidores.fetch(
    new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), env);
  const texto = await r.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (e) { json = null; }
  return { status: r.status, json, texto };
};

const fetchOriginal = globalThis.fetch;

(async () => {
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({});
    globalThis.fetch = gh.fetchFalso;
    let r, lista;
    try {
      r = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha,
      });
      lista = await pedir(env, '/api/bastidores/linhas-de-base');
    } finally { globalThis.fetch = fetchOriginal; }
    provar('a transferência responde 200', r.status === 200, r.json);
    /* A RESPOSTA DIZ O QUE A CADEIA NÃO FAZ. O `proximo` fala da cascata (Turma, plano, PO) e não
     * do que a troca estraga DENTRO do elenco. Sem esta frase, o professor só descobre o passo 3 e
     * o recorte pela marca — e uma marca que ninguém sabe ler é a mesma coisa que nada. */
    provar('…e manda refazer o passo 3 e o recorte nos dois elencos',
      /passo 3/.test(r.json && r.json.proximo || '')
        && /passo 4/.test(r.json.proximo || '')
        && /dois/i.test(r.json.proximo || ''), r.json && r.json.proximo);
    const rev = (lista.json && lista.json.revisoes) || {};
    provar('a rota devolve a revisão dos DOIS elencos',
      Boolean(rev.ame) && Boolean(rev.tami), Object.keys(rev));
    provar('…e o que perdeu está pendente das duas metades',
      rev.ame && rev.ame.falta.join(',') === 'leitura,recorte', rev.ame && rev.ame.falta);
    provar('…e o que recebeu também',
      rev.tami && rev.tami.falta.join(',') === 'leitura,recorte', rev.tami && rev.tami.falta);

    /* A PROVA DA PROVA: a transferência NÃO reescreveu o recorte. É o defeito que ela descreveu —
     * o aspecto escolhido por causa da aluna que saiu continua lá. */
    const doDestino = lista.json && lista.json.linhas
      && lista.json.linhas.find((l) => l && l.id === 'tami');
    provar('o recorte do destino NÃO foi tocado pela transferência (é o defeito, e é a razão da marca)',
      doDestino && (doDestino.campos || []).length === 1 && doDestino.campos[0].id
        === 'formato-anatomico-dos-joelhos', doDestino && doDestino.campos);
    provar('…e a leitura foi DESCARTADA nos dois lados (a transferência não a repõe)',
      lista.json.linhas.every((l) => !l.leitura), lista.json.linhas.map((l) => Boolean(l.leitura)));
  }

  /* O RASCUNHO ABERTO. É o caso em que a marca mais importa e o que a herança em `linhasDeBase`
   * salva: o rascunho substitui o acto na lista, e as marcas da troca nascem no acto. */
  {
    const gh = githubDeBolso(arquivosDoRepo());
    const env = prepEnv({
      ['bastidores/' + ESCOLA + '/linhas-de-base']: JSON.stringify([ORIGEM]),
    });
    globalThis.fetch = gh.fetchFalso;
    let r, lista;
    try {
      r = await pedir(env, '/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'ame', para: 'tami', senhaDirecao: senha,
      });
      lista = await pedir(env, '/api/bastidores/linhas-de-base');
    } finally { globalThis.fetch = fetchOriginal; }
    const doKv = JSON.parse(await env.PADD_KV.get('bastidores/' + ESCOLA + '/linhas-de-base'));
    const rascunhoDaOrigem = doKv.find((l) => l && l.id === 'ame');
    provar('havia um rascunho aberto, e ele continua na lista',
      r.status === 200 && Boolean(rascunhoDaOrigem), rascunhoDaOrigem && rascunhoDaOrigem.id);
    provar('o rascunho NÃO tem a marca da troca — ela nasce no acto',
      rascunhoDaOrigem && !rascunhoDaOrigem.transferida,
      rascunhoDaOrigem && Object.keys(rascunhoDaOrigem));
    const lida = lista.json.linhas.find((l) => l && l.id === 'ame');
    provar('…mas a LISTA mostra a marca, herdada do acto — o rascunho não a esconde',
      lida && Boolean(lida.transferida), lida && Object.keys(lida));
    provar('…e a revisão continua assinalada na rota',
      lista.json.revisoes && Boolean(lista.json.revisoes.ame),
      lista.json.revisoes && Object.keys(lista.json.revisoes));
  }

  // ========================================================================================
  console.log('\n5. O CLIENTE — o «!» nos dois cartões, e a marca que se apaga');

  {
    let JSDOM, VirtualConsole;
    try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      console.log('  —   o cliente a correr: NÃO MEDIDO (jsdom ausente)');
    } else {
      const html = pagina([SAIU, ENTROU], [curadoriaCom('ame', 'Piano'), curadoriaCom('tami', 'Rosa')]);
      let linhasDoFetch = [SAIU, ENTROU];
      const vc = new VirtualConsole();
      vc.on('jsdomError', () => {});
      const dom = new JSDOM(html.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://' + ESCOLA + '.workers.dev/bastidores/producao',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.confirm = () => true;
          w.alert = () => {};
          w.fetch = (u) => {
            const url = String(u);
            const revisoes = (typeof bastidores.revisoesDosElencos === 'function'
              ? bastidores.revisoesDosElencos(linhasDoFetch) : {});
            const corpo = url.indexOf('linhas-de-base') !== -1
              ? { ok: true, linhas: linhasDoFetch, revisoes,
                elencos: (typeof bastidores.elencosComAsTurmas === 'function'
                  ? bastidores.elencosComAsTurmas(linhasDoFetch, [])
                  : bastidores.elencosParaATurma(linhasDoFetch)) }
              : { ok: true };
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
          };
        },
      });
      const win = dom.window;
      const doc = win.document;
      await new Promise((r) => win.setTimeout(r, 350));

      const cartoes = [...doc.querySelectorAll('#lb-lista li.trio-plano')];
      const marcaDe = (nomeElenco) => {
        const li = cartoes.find((x) => new RegExp('>' + nomeElenco + '<').test(x.textContent)
          || x.textContent.indexOf(nomeElenco) === 0);
        if (!li) return null;
        return [...li.querySelectorAll('.selo')].find((s) => s.textContent.trim() === '!') || null;
      };
      const doAme = marcaDe('AME');
      const doTami = marcaDe('TAMI');
      provar('o elenco que perdeu a aluna tem o «!»', Boolean(doAme), cartoes.map((c) => c.textContent.slice(0, 20)));
      provar('…e o que recebeu também', Boolean(doTami));
      provar('…e o «!» diz o que fazer, no `title`',
        doAme && /passo 3/.test(doAme.getAttribute('title') || ''), doAme && doAme.getAttribute('title'));
      provar('…e é legível para quem ouve (`role="img"` + `aria-label`)',
        doAme && doAme.getAttribute('role') === 'img' && /passo 4/.test(doAme.getAttribute('aria-label') || ''),
        doAme && { role: doAme.getAttribute('role'), rotulo: doAme.getAttribute('aria-label') });

      /* A MARCA DA TURMA é revelada pela repintura — sem ela, só apareceria a seguir ao F5. */
      const antes = [...doc.querySelectorAll('#cu-lista [data-revisao]')];
      provar('há marcas nos cartões das Turmas', antes.length === 2, antes.length);
      provar('…e estão acesas (o servidor já as desenhou visíveis)',
        antes.every((el) => el.hidden === false), antes.map((el) => el.hidden));

      /* AGORA A REVISÃO É FEITA: leitura e recorte posteriores à troca. */
      linhasDoFetch = [
        Object.assign({}, SAIU, { leitura: { em: DEPOIS }, atualizada_em: DEPOIS2 }),
        Object.assign({}, ENTROU, { leitura: { em: DEPOIS }, atualizada_em: DEPOIS2 }),
      ];
      await win.carregarLinhas();
      await new Promise((r) => win.setTimeout(r, 120));

      const depois = [...doc.querySelectorAll('#cu-lista [data-revisao]')];
      provar('feita a revisão, as marcas das Turmas apagam-se',
        depois.every((el) => el.hidden === true), depois.map((el) => el.hidden));
      const cartoesDepois = [...doc.querySelectorAll('#lb-lista li.trio-plano')];
      provar('…e o «!» desaparece dos cartões dos elencos',
        cartoesDepois.every((li) => ![...li.querySelectorAll('.selo')]
          .some((s) => s.textContent.trim() === '!')),
        cartoesDepois.map((li) => li.textContent.slice(0, 30)));

      win.close();
    }
  }

  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + n
    : 'TUDO CERTO — ' + n + ' asserções: a troca de aluna deixa o passo 3 e o recorte por rever,'
      + ' nos dois elencos, e a marca só sai quando os dois estão refeitos.'));

  if (negativo) {
    if (falhas === 0) { console.log('A PROVA NÃO PROVA NADA: o código de antes passou tudo.'); process.exit(1); }
    console.log('Como esperado: o código de antes reprova ' + falhas + ' de ' + n + '.');
    process.exit(0);
  }
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('A prova rebentou: ' + (e && e.stack || e));
  process.exit(1);
});
