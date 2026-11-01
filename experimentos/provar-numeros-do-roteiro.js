#!/usr/bin/env node
'use strict';

/**
 * provar-numeros-do-roteiro.js — o número que se lê é o do roteiro, nos TRÊS documentos.
 *
 * O DEFEITO QUE ISTO TRAVA (01/11/2026, lido na tela pela pesquisadora). «Eu estou aqui no plano
 * de observação, andando de bloco em bloco pelo botão avançar. Eu estou na sequência de exercícios
 * por bloco. No roteiro, ela é o número 12 e na página ela é o número 19.»
 *
 * Havia TRÊS réguas para a mesma contagem:
 *
 *   · o ROTEIRO numerava os DEGRAUS — os nós que se perguntam, e só eles;
 *   · o TÍTULO da página numerava o ÍNDICE do mapa (`INDICE + 1`), que conta também os nós de
 *     cabeçalho — escola, professor, turma, frequência, duração, calendário, número de aulas —,
 *     e esses não se perguntam: vêm do cadastro e leem-se na barra;
 *   · a BARRA dizia «respondidos N/26» — o mapa inteiro —, sobre um roteiro de 19 degraus.
 *
 * MEDIDO ANTES DA CORRECÇÃO, e é o que esta prova guarda:
 *
 *   · anamnese ......... 53 nós, 53 degraus, 0 desalinhados — é o documento onde o defeito NÃO
 *                        aparece, porque não tem nó de cabeçalho. Foi por isso que ele passou;
 *   · plano de ensino .. 26 nós, 19 degraus, 18 de 19 desalinhados (Δ −7): «Sequência de
 *                        exercícios por bloco» era o título 19 e o degrau 12;
 *   · plano de observação  33 nós, 30 degraus, os 30 desalinhados (Δ −2 e −3).
 *
 * O QUE SE MEDE, e em cada um dos três documentos:
 *
 *   1. o número do TÍTULO é o número do item ACTIVO do roteiro, em todos os degraus;
 *   2. a sequência dos números é 1..N, sem salto e sem repetição — a caminhada não perde nada;
 *   3. a BARRA conta o mesmo que o roteiro: o denominador é o número de degraus (e não o mapa),
 *      e os obrigatórios são os degraus obrigatórios;
 *   4. O BOTÃO «AVANÇAR» percorre os mesmos degraus, na mesma ordem — é assim que ela anda, e
 *      uma régua que só vale para o clique no roteiro não é uma régua;
 *   5. a barra continua a BARRAR o fecho quando falta um obrigatório do cabeçalho, e diz o NOME
 *      dele: a turma não tem degrau, mas o plano não fecha sem ela.
 *
 * CONTROLE NEGATIVO — `--controle-negativo` serve a `porta/index.html` de `REF_NEGATIVO` (padrão
 * `HEAD`) e corre as MESMAS asserções: com o código de antes, as do plano e do PO falham. Se
 * passassem, a prova não estaria a provar nada.
 *
 * A bancada é LOCAL: um `http.createServer` em porta efémera serve a porta com o mapa de verdade
 * de cada documento (`motor/nucleo/porta.js`). Não toca no ar nem gasta a cota do Cloudflare.
 *
 *   node experimentos/provar-numeros-do-roteiro.js
 *   node experimentos/provar-numeros-do-roteiro.js --controle-negativo
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const { mapa } = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

const negativo = process.argv.includes('--controle-negativo');
let PORTA_HTML = path.join(RAIZ, 'porta/index.html');
if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'porta-numeros-'));
  execSync('git archive ' + ref + ' porta/index.html | tar -x -C ' + destino,
    { cwd: RAIZ, stdio: 'pipe' });
  PORTA_HTML = path.join(destino, 'porta/index.html');
  console.log('CONTROLE NEGATIVO — porta/index.html de ' + ref + ' (antes da correcção)\n');
}

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* OS TRÊS DOCUMENTOS, com o caminho em que cada um abre. A anamnese leva a aluna porque a porta
 * a exige; o plano e o PO, não. */
const DOCUMENTOS = [
  { nome: 'anamnese', conteudo: 'porta/conteudo/anamnese.json',
    // A ANAMNESE É A ÚNICA DAS TRÊS QUE EXIGE AUTORIZAÇÃO PARA COMEÇAR, e no browser ela chega
    // por um BILHETE no endereço (`?ato=`) — é o link que o professor recebe da lista. Sem ele a
    // porta devolve a pessoa à lista antes de abrir o formulário, e a bancada mediria uma página
    // que nunca abriu (o roteiro fica pintado, e o título não existe: parece que carregou).
    caminho: 'anamnese/?escola=escola-de-prova&professor=docente&ciclo=01&aluna=Aluna&ato=bilhete-da-bancada' },
  { nome: 'plano de ensino', conteudo: 'porta/plano/conteudo/plano.json',
    caminho: 'plano-ensino/?escola=escola-de-prova&professor=docente&ciclo=01' },
  { nome: 'plano de observação', conteudo: 'porta/po/conteudo/po.json',
    caminho: 'plano-observacao/?escola=escola-de-prova&professor=docente&ciclo=01' },
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
  '.js': 'text/javascript', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml' };

function servir(conteudo) {
  const MAPA = mapa(conteudo);
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://local');
    const envia = (tipo, corpo, codigo) => {
      res.writeHead(codigo || 200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    const json = (o) => envia(MIME['.json'], JSON.stringify(o));
    if (/\/api\/mapa$/.test(u.pathname)) return json(MAPA);
    // A CURADORIA É PRÉ-REQUISITO DE ENTRADA no plano e no PO: sem ela `podePreencher` devolve
    // falso, a porta manda à lista e o formulário nunca abre — a página fica com o roteiro
    // pintado e sem pergunta nenhuma, o que parece um sucesso de carregamento. É a armadilha da
    // bancada, não da página.
    // O BILHETE DA ANAMNESE (ver o comentário em DOCUMENTOS): o que a página confere é que ele
    // diz o MESMO ato que está nos campos.
    if (/\/api\/bastidores\/ato\/consumir$/.test(u.pathname)) {
      return json({ ok: true, ato: { fonte: 'anamnese', professor: 'docente', ciclo: '01',
        aluna: 'Aluna' } });
    }
    if (/\/api\/bastidores\/alunas$/.test(u.pathname)) {
      return json({ ok: true, alunas: ['Aluna'], novas: [] });
    }
    if (/curadoria-professor/.test(u.pathname)) {
      return json({ ok: true, curadorias: [{ id: 'c1', professor: 'docente',
        modalidade: 'Balé clássico', turmas: [], alunas: [] }] });
    }
    // As restantes rotas da porta não são o que se mede aqui; um `ok` vazio evita que a página
    // escreva um erro de rede num canto e siga.
    if (/\/api\//.test(u.pathname)) return json({ ok: true, opcoes: [], fichas: [], turmas: [] });
    if (u.pathname.indexOf('assets/') !== -1) {
      const nome = path.basename(u.pathname);
      for (const p of [
        path.join(RAIZ, 'porta/assets', nome),
        path.join(RAIZ, 'tools/templates', nome === 'style.css' ? 'ciclo.css' : nome),
        path.join(RAIZ, 'tools', nome),
      ]) {
        if (fs.existsSync(p)) {
          return envia(MIME[path.extname(p)] || 'application/octet-stream', fs.readFileSync(p));
        }
      }
      return envia(MIME['.js'], '');
    }
    return envia(MIME['.html'], fs.readFileSync(PORTA_HTML));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

async function abrir(doc) {
  const conteudo = JSON.parse(fs.readFileSync(path.join(RAIZ, doc.conteudo), 'utf8'));
  const { srv, base } = await servir(conteudo);
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base + '/' + doc.caminho, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + '/' + doc.caminho), i);
      // O jsdom não traz `CSS.escape`; o navegador traz. É do AMBIENTE, não da página.
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true;
      w.alert = () => {};
      // O CONTEXTO VAI NA URL, e é o suficiente: `?escola=&professor=&ciclo=&aluna=` preenche os
      // campos que `podePreencher` confere, e a porta não se descarta. Não se toca em
      // `w.location` — no jsdom é só leitura, e redefini-la rebenta antes de a página abrir.
    },
  });
  await new Promise((r) => setTimeout(r, 900));
  return { w: dom.window, srv, problemas, conteudo, MAPA: mapa(conteudo) };
}

/** O número do título do nó actual, como o professor o lê. */
const TITULO = `(function(){
  const t = document.querySelector('.titulo-do-no');
  if (!t) return null;
  const m = /^\\s*(\\d+)\\./.exec(t.textContent);
  return m ? Number(m[1]) : null;
})()`;

(async () => {
  for (const doc of DOCUMENTOS) {
    console.log('\n' + doc.nome.toUpperCase() + ' — ' + doc.conteudo);
    const { w, srv, problemas, MAPA } = await abrir(doc);
    try {
      // A RÉGUA INDEPENDENTE: a que a prova calcula por si, e não a que a página declara. Se as
      // duas fossem a mesma função, isto mediria a função contra si mesma.
      let degrau = 0;
      const esperado = MAPA.nos.map((no) => (no.noCabecalho ? null : (degrau += 1)));
      const degraus = esperado.filter((n) => n !== null);
      const obrigatorios = MAPA.nos.filter((no, i) => !no.noCabecalho && no.obrigatorio).length;

      const roteiro = await w.eval(`(function(){
        const itens = [...document.querySelectorAll('#roteiro > li')]
          .filter((li) => li.dataset.i !== undefined);
        return {
          total: itens.length,
          indices: itens.map((li) => Number(li.dataset.i)),
          numeros: itens.map((li) => Number((li.querySelector('.n') || {}).textContent)),
          barraTotal: Number((document.getElementById('n-total') || {}).textContent),
          barraObrig: Number((document.getElementById('n-obrig-total') || {}).textContent),
        };
      })()`);

      provar('o roteiro tem um item por degrau, e nenhum pelo cabeçalho',
        roteiro.total === degraus.length
          && roteiro.indices.every((i) => esperado[i] !== null),
        { roteiro: roteiro.total, degraus: degraus.length });
      provar('e os números do roteiro são 1..N, sem salto nem repetição',
        JSON.stringify(roteiro.numeros) === JSON.stringify(degraus), roteiro.numeros);

      // 1. O TÍTULO, DEGRAU A DEGRAU — é o defeito que ela viu.
      const caminhada = await w.eval(`(function(){
        const itens = [...document.querySelectorAll('#roteiro > li')]
          .filter((li) => li.dataset.i !== undefined);
        const saida = [];
        for (const li of itens) {
          const i = Number(li.dataset.i);
          irPara(i, false);
          const activo = document.querySelector('#roteiro > li.aqui');
          saida.push({
            i: i,
            titulo: ${TITULO},
            roteiro: activo ? Number((activo.querySelector('.n') || {}).textContent) : null,
            rotulo: (document.querySelector('.titulo-do-no') || {}).textContent || '',
          });
        }
        return saida;
      })()`);

      const desalinhados = caminhada.filter((x) => x.titulo !== x.roteiro);
      provar('o número do título é o mesmo do roteiro, em todos os degraus',
        desalinhados.length === 0 && caminhada.length === degraus.length,
        desalinhados.slice(0, 4).map((x) => x.rotulo.trim() + ' → título ' + x.titulo + ' × roteiro ' + x.roteiro));
      provar('e a caminhada cobre 1..N em ordem, sem passar por nenhum nó de cabeçalho',
        JSON.stringify(caminhada.map((x) => x.titulo)) === JSON.stringify(degraus),
        caminhada.map((x) => x.titulo));

      // 3. A BARRA conta o mesmo.
      provar('a barra conta os degraus, e não o mapa inteiro',
        roteiro.barraTotal === degraus.length, { barra: roteiro.barraTotal, degraus: degraus.length });
      provar('e os obrigatórios da barra são os degraus obrigatórios',
        roteiro.barraObrig === obrigatorios, { barra: roteiro.barraObrig, esperado: obrigatorios });

      // 4. O BOTÃO «AVANÇAR» — é por ela que ela anda. As TRAVAS de resposta (a soma do volume,
      // a pergunta socrática) ficam desarmadas AQUI: elas decidem se se avança, e o que esta
      // secção mede é COMO SE NUMERA quando se avança. Armadas, o «avançar» pararia no nó do
      // volume — e a prova mediria a trava, que já tem as suas.
      const avancar = await w.eval(`(function(){
        const impedimento = window.impedimentoDoNo;
        const socratica = window.socraticaDisparada;
        window.impedimentoDoNo = function(){ return null; };
        window.socraticaDisparada = function(){ return false; };
        try {
          const itens = [...document.querySelectorAll('#roteiro > li')]
            .filter((li) => li.dataset.i !== undefined);
          irPara(Number(itens[0].dataset.i), false);
          const saida = [${TITULO}];
          const rastro = [INDICE];
          for (let k = 1; k < itens.length; k += 1) {
            document.getElementById('proxima').click();
            rastro.push(INDICE);
            saida.push(${TITULO});
          }
          return { titulos: saida, rastro: rastro };
        } finally {
          window.impedimentoDoNo = impedimento;
          window.socraticaDisparada = socratica;
        }
      })()`);
      provar('o «avançar» percorre os mesmos degraus, na mesma ordem',
        JSON.stringify(avancar.titulos) === JSON.stringify(degraus), avancar);

      provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
    } finally {
      w.close();
      srv.close();
    }
  }

  /* 5. O QUE NÃO TEM DEGRAU CONTINUA A BARRAR O FECHO. A turma é obrigatória no plano e vive no
   * cabeçalho: não há degrau para onde levar o professor, e tirá-la da conta não pode tirá-la da
   * trava. Sem esta secção, «alinhar os números» poderia ter aberto o fecho sobre um plano sem
   * turma — e as três réguas passariam a concordar num documento que não devia fechar. */
  console.log('\nO FECHO CONTINUA A BARRAR O QUE NÃO TEM DEGRAU');
  const semTurma = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'porta/plano/conteudo/plano.json'), 'utf8'));
  const { srv, base } = await servir(semTurma);
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = await JSDOM.fromURL(base + '/plano-ensino/?escola=escola-de-prova&professor=docente&ciclo=01', {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.fetch = (u, i) => fetch(new URL(String(u), base + '/plano-ensino/?escola=escola-de-prova&professor=docente&ciclo=01'), i);
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
      w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
    },
  });
  await new Promise((r) => setTimeout(r, 900));
  try {
    const w = dom.window;
    // Sem turma escolhida o plano não tem conteúdo de nível — e é o caso que já existe ao vivo.
    // `typeof` em vez de chamada directa: no CONTROLE NEGATIVO a régua nova não existe, e uma
    // prova que rebenta em vez de reprovar não mede nada.
    const r = await w.eval(`(function(){
      if (typeof RESPOSTAS !== 'undefined') RESPOSTAS.delete('contexto-turma');
      // O AVISO VIVE NO CARTÃO DO NÓ: sem repintar, não há aviso nenhum para ler.
      if (typeof renderPergunta === 'function') renderPergunta();
      const falta = obrigatoriosFaltando();
      const aviso = document.getElementById('aviso-fecho');
      const fechar = document.getElementById('fechar');
      const regua = typeof numerosDoMapa === 'function'
        ? numerosDoMapa() : { obrigatorios: MAPA.obrigatorios, total: MAPA.total };
      return {
        faltam: falta.map((n) => n.campo || n.id),
        cabecalho: falta.filter((n) => n.noCabecalho).length,
        fecharOculto: fechar ? fechar.hidden : null,
        denominador: regua.obrigatorios,
        total: regua.total,
        texto: aviso ? aviso.textContent.replace(/\\s+/g, ' ').trim() : null,
      };
    })()`);
    // O NÚMERO ESPERADO VEM DO MAPA, e não escrito à mão: um `10` na prova mediria a constante
    // dela, e a lista de obrigatórios muda com o conteúdo.
    const MAPA_PLANO = mapa(semTurma);
    const obrigatoriosDosDegraus = MAPA_PLANO.nos
      .filter((no) => !no.noCabecalho && no.obrigatorio).length;
    const obrigatoriosDoCabecalho = MAPA_PLANO.nos
      .filter((no) => no.noCabecalho && no.obrigatorio).length;
    provar('sem a turma, o obrigatório do cabeçalho entra na lista do que falta',
      r.cabecalho >= 1 && r.faltam.some((x) => /Turma/i.test(x)), r);
    provar('e o fecho não abre', r.fecharOculto === true, r.fecharOculto);
    provar('o denominador da barra continua a ser o dos degraus, sem somar o cabeçalho',
      r.denominador === obrigatoriosDosDegraus
        && obrigatoriosDoCabecalho > 0
        && r.denominador < obrigatoriosDosDegraus + obrigatoriosDoCabecalho,
      { denominador: r.denominador, degraus: obrigatoriosDosDegraus,
        cabecalho: obrigatoriosDoCabecalho });
    provar('e o aviso nomeia o que falta do contexto, em vez de o somar a um total',
      /Do contexto, na barra/.test(r.texto) && /Turma/i.test(r.texto), r.texto);
    provar('nenhum erro de JavaScript na página', problemas.length === 0, problemas.slice(0, 3));
  } finally {
    dom.window.close();
    srv.close();
  }

  console.log('\n' + (falhas ? 'FALHOU — ' : 'TUDO CERTO — ') + total + ' asserção(ões), ' + falhas + ' falha(s).');
  process.exit(falhas ? 1 : 0);
})().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
