#!/usr/bin/env node
'use strict';

/*
 * provar-operacao-entre-abas.js — UMA ABA A DERIVAR TRAVA AS OUTRAS (11/11/2026).
 *
 * O PEDIDO, na letra dela:
 *
 *   «se o usuário ele tá com várias abas abertas, então em uma aba ele tem aqui o ajuste que ele
 *    fez no professor, na turma atribuída, ele foi lá e derivou. Aí ele tem numa outra aba aberto,
 *    por exemplo, o plano do ciclo. O plano do ciclo que tem impacto direto ao que ele ajustou
 *    tem que estar inabilitado enquanto estiver processando. A mesma coisa o plano de observação,
 *    se ele tiver uma aba aberta, e a mesma coisa os documentos que vão ser derivados a partir do
 *    plano de observação.»
 *
 * E ainda, sobre o véu:
 *
 *   «o véu precisa ser bem transparente para o professor que estiver usando perceber que ele
 *    ainda tá na mesma página e tá processando. E aí ele consegue ver através do véu o
 *    formulário, ele consegue ver através do véu a listagem.»
 *
 * O QUE ESTA PROVA MEDE. Duas abas REAIS, no mesmo navegador e na mesma origem — é a única forma
 * de o `localStorage` e o `BroadcastChannel` serem os verdadeiros, e não um duplo que finge
 * metade da API. A aba A é a Produção (onde o gesto nasce); a aba B é uma página da porta — o
 * «plano do ciclo» que ela descreve.
 *
 *   A. EM REPOUSO as duas abas estão destravadas.
 *   B. A ABA A OCUPA: a aba B, sozinha, levanta o véu, tranca tudo e diz a ETIQUETA e a FRASE —
 *      sem receber ordem nenhuma da aba A além do que passa pelo canal.
 *   C. O VÉU É TRANSLÚCIDO — mede-se o alfa da cor computada (o navegador resolve a
 *      `color-mix`), e ele fica entre 0,3 e 0,8: vê-se a página por baixo.
 *   D. A ETIQUETA É SEMÂNTICA e é uma peça do catálogo (o `.selo`), não uma pílula inventada.
 *   E. A ABA A LIBERTA: a aba B baixa o véu e destranca.
 *   F. A ABA QUE ABRE A MEIO DA OPERAÇÃO já a vê — é o `localStorage` a fazer o que o canal não
 *      pode fazer por ela (ela não existia quando a operação foi transmitida).
 *   G. A OPERAÇÃO VENCIDA NÃO TRANCA NINGUÉM (a rede de segurança dos dois minutos).
 *   H. A ABA QUE SE RECARREGA A MEIO DO PRÓPRIO GESTO NÃO SE TRanca A SI MESMA.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): corre as MESMAS provas com o `nav.js` de
 * `REF_NEGATIVO` (por omissão `HEAD`), que não tem travessia nenhuma entre abas. Se passasse, a
 * prova não provava nada.
 *
 *   node experimentos/provar-operacao-entre-abas.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-operacao-entre-abas.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

let raizDoMaterial = RAIZ;
if (negativo) {
  const ref = process.env.REF_NEGATIVO || 'HEAD';
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'abas-negativo-'));
  execSync('git archive ' + ref + ' tools | tar -x -C ' + JSON.stringify(destino),
    { cwd: RAIZ, stdio: 'pipe' });
  raizDoMaterial = destino;
  console.log('CONTROLE NEGATIVO contra ' + ref + '\n');
}

/* ------------------------------------------------------------------------------------------
 * AS DUAS PÁGINAS. A da Produção é a de verdade, gerada pelo motor (tem o véu na marcação, e é
 * dela que sai o gesto). A da porta é uma página mínima COM A MESMA FOLHA E O MESMO `nav.js` —
 * é o que basta: a travessia não depende do conteúdo da página, depende do script.
 * ---------------------------------------------------------------------------------------- */

const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

function paginaDaProducao() {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
    [{ nome: 'Redinha Rosa', slug: 'redinha-rosa' }], [], 'Pe Torto', 'pe-torto',
    [], [], [], [], [], []);
}

/** O «plano do ciclo»: uma página da porta, com a folha e a barra, e conteúdo para se ver.
 *  `?privada=1` põe `data-operacao="so-esta-aba"` — é o modo que a bancada do véu usa. */
function paginaDoPlano(url) {
  const privada = String(url || '').indexOf('privada=1') !== -1;
  return '<!doctype html><html lang="pt-BR"' + (privada ? ' data-operacao="so-esta-aba"' : '') + '><head><meta charset="utf-8">'
    + '<title>Plano de ensino</title><link rel="stylesheet" href="/assets/style.css"></head><body>'
    + '<nav class="topnav"><a class="marca" href="/">Sistema Lastro</a></nav>'
    + '<main class="principal"><h1>Plano de ensino</h1>'
    + '<form id="form-plano"><label class="campo-rotulo">Objetivo</label>'
    + '<input id="objetivo" value="trabalhar o passé">'
    + '<button type="submit" class="acao">Gravar o plano</button></form>'
    + '</main><script src="/assets/nav.js"></script></body></html>';
}

const srv = http.createServer((req, res) => {
  const caminho = decodeURIComponent(req.url).split('?')[0];
  const ok = (tipo, corpo) => {
    res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
    res.end(corpo);
  };
  if (caminho.endsWith('/assets/style.css')) {
    return ok('text/css; charset=utf-8',
      fs.readFileSync(path.join(raizDoMaterial, 'tools/templates/ciclo.css')));
  }
  if (caminho.endsWith('/assets/nav.js')) {
    return ok('text/javascript',
      fs.readFileSync(path.join(raizDoMaterial, 'tools/templates/nav.js')));
  }
  if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
  if (caminho.indexOf('/plano-ensino') === 0) return ok('text/html; charset=utf-8', paginaDoPlano(req.url));
  ok('text/html; charset=utf-8', paginaDaProducao());
});

/* ------------------------------------------------------------------------------------------ */

/** O estado do véu numa aba: o que se vê, o que está trancado, o que ele diz. */
function lerVeu(p) {
  return p.evaluate(() => {
    const v = document.getElementById('veu');
    if (!v) return { existe: false };
    const cs = getComputedStyle(v);
    const cartao = v.querySelector('.veu-cartao');
    const etiqueta = v.querySelector('.veu-etiqueta');
    const corpo = v.querySelector('.veu-texto');
    const filhos = [...document.body.children].filter((x) => x.id !== 'veu');
    const cor = cs.backgroundColor;
    const alfa = (function (c) {
      let mm = c.match(/rgba?\(([^)]+)\)/);
      if (mm) {
        const p = mm[1].split(',').map((x) => Number(x.trim()));
        return p.length === 4 ? p[3] : (p.length === 3 ? 1 : null);
      }
      mm = c.match(/\/\s*([\d.]+)\s*%/);
      if (mm) return Number(mm[1]) / 100;
      mm = c.match(/\/\s*([\d.]+)\s*\)/);
      if (mm) return Number(mm[1]);
      return c === 'transparent' ? 0 : null;
    })(cor);
    return {
      existe: true,
      visivel: cs.display !== 'none',
      remota: v.getAttribute('data-remota') === 'sim',
      etiqueta: etiqueta ? etiqueta.textContent.trim() : '',
      etiquetaEhSelo: Boolean(etiqueta && etiqueta.classList.contains('selo')),
      texto: corpo ? corpo.textContent.trim() : '',
      cor, alfa,
      /* A FORMA MUDOU EM 11/11/2026 («implementa a opção 2: o texto na tela, sem caixa»): o cartão
         opaco que aqui se exigia deixou de existir, e o que protege a leitura é o HALO. O que se
         mede passa a ser o halo — e a caixa é o que se exige AUSENTE. */
      cartaoComCaixa: Boolean(cartao) && (() => {
        const c = getComputedStyle(cartao);
        return c.borderTopWidth !== '0px' || c.boxShadow !== 'none'
          || c.backgroundColor !== 'rgba(0, 0, 0, 0)';
      })(),
      textoComHalo: Boolean(corpo) && /rgb/.test(getComputedStyle(corpo).textShadow || ''),
      trancados: filhos.filter((x) => x.inert).length,
      filhos: filhos.length,
      /* O TESTEMUNHO DO TECLADO: o clique não chega ao que está por baixo. Mede-se no elemento
         que está no centro da tela — se ele for o véu, o ponteiro não passa. */
      quemRecebeOClique: (function () {
        const alvo = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        if (!alvo) return null;
        return alvo.id === 'veu' || Boolean(alvo.closest && alvo.closest('#veu')) ? 'veu' : alvo.tagName;
      })(),
    };
  });
}

(async () => {
  let executavel = null;
  for (const c of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(c)) { executavel = c; break; }
  }
  if (!executavel) { console.log('sem Chrome — NÃO FEITO'); process.exit(1); }

  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const nav = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  /* UM CONTEXTO SÓ = UM `localStorage` SÓ. É a condição sem a qual nada disto se mede. */
  const contexto = await nav.createBrowserContext();
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  /* CHAMAR A API SEM QUE A SUA AUSÊNCIA DERRUBE A PROVA. No controle negativo o `nav.js` de
     antes não tem `LastroDaOperacao`, e um `evaluate` que a invoque lança — o que daria um erro
     em vez de uma reprovação. O resultado booleano é ele próprio uma asserção: «a API existe». */
  const chamar = (p, nome, ...args) => p.evaluate((n, a) => {
    if (!window.LastroDaOperacao || typeof window.LastroDaOperacao[n] !== 'function') return false;
    window.LastroDaOperacao[n].apply(null, a);
    return true;
  }, nome, args);

  const abrir = async (url) => {
    const p = await contexto.newPage();
    p.on('dialog', (d) => d.dismiss().catch(() => {}));
    await p.setViewport({ width: 1100, height: 800 });
    await p.goto(base + url, { waitUntil: 'networkidle0', timeout: 60000 });
    // o portão da direção esconde o conteúdo na Produção; o véu não depende disso
    await p.evaluate(() => { const c = document.getElementById('conteudo'); if (c) c.hidden = false; });
    return p;
  };

  /* ======================================================================================
   * A. EM REPOUSO
   * ==================================================================================== */
  console.log('A. EM REPOUSO AS DUAS ABAS ESTÃO DESTRAVADAS');
  const a = await abrir('/bastidores/producao');
  const b = await abrir('/plano-ensino/');

  const repousoA = await lerVeu(a);
  const repousoB = await lerVeu(b);
  provar('a aba da Produção tem o véu, e ele está baixo',
    repousoA.existe && repousoA.visivel === false, repousoA);
  provar('a aba do plano tem o véu (o `nav.js` criou-o), e ele está baixo',
    repousoB.existe && repousoB.visivel === false, repousoB);
  provar('…e nenhuma das duas tem a página trancada',
    repousoA.trancados === 0 && repousoB.trancados === 0,
    { a: repousoA.trancados, b: repousoB.trancados });

  /* ======================================================================================
   * B. A ABA A OCUPA — e a B, sozinha, reage
   * ==================================================================================== */
  console.log('\nB. A ABA QUE DERIVA TRAVA A OUTRA, COM ETIQUETA E FRASE');
  const temApi = await chamar(a, 'ocupar',
    'a derivar a Turma «tami» e a reencadear o plano de ensino…', 'Derivação');
  provar('o `nav.js` publica a operação (a API existe na página)', temApi === true);
  await esperar(300);

  const duranteB = await lerVeu(b);
  provar('a aba do plano levanta o véu sem ninguém lhe tocar', duranteB.visivel === true, duranteB);
  provar('…e sabe que a operação é de OUTRA aba', duranteB.remota === true, duranteB);
  provar('…e diz a ETIQUETA da operação',
    duranteB.etiqueta === 'Derivação', duranteB.etiqueta);
  provar('…e diz a FRASE do que está a acontecer',
    /a derivar a Turma «tami»/.test(duranteB.texto), duranteB.texto);
  provar('…e tranca a página inteira (o clique não chega ao que está por baixo)',
    duranteB.trancados === duranteB.filhos && duranteB.filhos > 0
      && duranteB.quemRecebeOClique === 'veu', duranteB);

  /* ======================================================================================
   * C e D. A TRANSPARÊNCIA E A PEÇA
   * ==================================================================================== */
  console.log('\nC. O VÉU DEIXA VER A PÁGINA POR BAIXO');
  provar('o véu é translúcido (alfa entre 0,3 e 0,8) — vê-se o formulário por baixo',
    typeof duranteB.alfa === 'number' && duranteB.alfa >= 0.3 && duranteB.alfa <= 0.8,
    { cor: duranteB.cor, alfa: duranteB.alfa });
  provar('…e o texto não está em caixa nenhuma (a forma escolhida não tem cartão)',
    duranteB.cartaoComCaixa === false, duranteB);
  provar('…e é o HALO que o protege da página por baixo', duranteB.textoComHalo === true, duranteB);

  console.log('\nD. A ETIQUETA NOMEIA A OPERAÇÃO, E NÃO É UMA PÍLULA INVENTADA');
  /* Ela nasce com a classe do `.selo` (é o `nav.js` que a monta, e a classe é a âncora do
   * catálogo), mas desde 11/11/2026 a folha despe-a do desenho de selo: sem fundo de alerta, sem
   * filete, sem pílula — a palavra em versalete bordô. Um selo é uma etiqueta colada a um objecto,
   * e no véu não há objecto a que colar. */
  provar('a etiqueta é a peça do catálogo (`.selo`), não uma classe inventada',
    duranteB.etiquetaEhSelo === true, duranteB);
  provar('…e diz o nome da operação, não um rótulo genérico',
    /^(Deriva|Vincula|Gera)/.test(duranteB.etiqueta), duranteB.etiqueta);

  /* ======================================================================================
   * E. A ABA A LIBERTA
   * ==================================================================================== */
  console.log('\nE. QUANDO A OPERAÇÃO ACABA, A OUTRA ABA VOLTA SOZINHA');
  await chamar(a, 'liberar');
  await esperar(350);
  const depoisB = await lerVeu(b);
  provar('a aba do plano baixa o véu sozinha', depoisB.visivel === false, depoisB);
  provar('…e destranca a página', depoisB.trancados === 0, depoisB);
  provar('…e o plano volta a receber o clique',
    depoisB.quemRecebeOClique !== 'veu', depoisB.quemRecebeOClique);

  /* ======================================================================================
   * F. A ABA QUE ABRE A MEIO
   * ==================================================================================== */
  console.log('\nF. A ABA QUE ABRE A MEIO DA OPERAÇÃO JÁ A VÊ');
  await chamar(a, 'ocupar', 'a gerar os documentos do ciclo…', 'Geração dos documentos');
  await esperar(250);
  const c = await abrir('/plano-ensino/');
  const recemAberto = await lerVeu(c);
  provar('a aba que nasce já encontra o véu de pé', recemAberto.visivel === true, recemAberto);
  provar('…e diz qual é a operação, sem ninguém lhe ter falado',
    recemAberto.etiqueta === 'Geração dos documentos', recemAberto.etiqueta);
  provar('…e tranca a página', recemAberto.trancados > 0, recemAberto);
  await chamar(a, 'liberar');
  await esperar(300);
  const recemDepois = await lerVeu(c);
  provar('…e sai quando a operação acaba', recemDepois.visivel === false, recemDepois);
  await c.close();

  /* ======================================================================================
   * G. A OPERAÇÃO VENCIDA NÃO TRANCA NINGUÉM
   * ==================================================================================== */
  console.log('\nG. A OPERAÇÃO VENCIDA NÃO TRANCA NINGUÉM');
  await b.evaluate(() => {
    localStorage.setItem('lastro:operacao', JSON.stringify({
      aba: 'aba-de-outra-pessoa', etiqueta: 'Derivação', texto: 'a derivar…',
      em: Date.now() - 300000, expira: Date.now() - 180000,
    }));
  });
  const depoisDeVencer = await abrir('/plano-ensino/');
  const vencida = await lerVeu(depoisDeVencer);
  provar('uma operação fora do prazo não levanta o véu', vencida.visivel === false, vencida);
  provar('…e é limpa do armazenamento',
    (await depoisDeVencer.evaluate(() => localStorage.getItem('lastro:operacao'))) === null);
  await depoisDeVencer.close();

  /* ======================================================================================
   * H. A ABA QUE SE RECARREGA A MEIO DO PRÓPRIO GESTO
   * ==================================================================================== */
  console.log('\nH. A ABA QUE SE RECARREGA A MEIO DO PRÓPRIO GESTO NÃO SE TRanca A SI MESMA');
  await chamar(b, 'ocupar', 'a gravar a Turma…', 'Vinculação');
  await esperar(200);
  await b.reload({ waitUntil: 'networkidle0' });
  await esperar(250);
  const recarregada = await lerVeu(b);
  provar('depois de recarregar, a aba não fica trancada pela operação que ela própria publicou',
    recarregada.visivel === false, recarregada);
  provar('…e a operação dela sai do armazenamento',
    (await b.evaluate(() => localStorage.getItem('lastro:operacao'))) === null);

  /* ======================================================================================
   * I. A PÁGINA QUE PEDE UMA OPERAÇÃO SÓ DELA
   * ==================================================================================== */
  console.log('\nI. `data-operacao="so-esta-aba"` ISOLA A PÁGINA (a bancada das formas do véu)');
  const privada = await abrir('/plano-ensino/?privada=1');
  const normal = await abrir('/plano-ensino/');

  const ocupouEmPrivado = await chamar(privada, 'ocupar', 'a mostrar o véu na bancada…', 'Derivação');
  await esperar(300);
  provar('a página em modo privado pinta o véu em si mesma',
    ocupouEmPrivado === true && (await lerVeu(privada)).visivel === true);
  provar('…e NÃO tranca as outras abas',
    (await lerVeu(normal)).visivel === false, await lerVeu(normal));
  provar('…e não escreve a operação no armazenamento partilhado',
    (await privada.evaluate(() => localStorage.getItem('lastro:operacao'))) === null);

  await chamar(normal, 'ocupar', 'a derivar a Turma…', 'Derivação');
  await esperar(300);
  provar('…e também não ESCUTA: uma operação de fora não a tranca',
    (await lerVeu(privada)).visivel === true
      && (await lerVeu(privada)).etiqueta === 'Derivação'
      && (await privada.evaluate(() => LastroDaOperacao.estado().remota)) === null,
    await lerVeu(privada));
  await chamar(privada, 'liberar');
  await chamar(normal, 'liberar');
  await privada.close();
  await normal.close();

  await nav.close();
  srv.close();
  console.log('\n' + (falhas === 0 ? 'TODAS AS ' : '') + provas + ' provas, '
    + falhas + (falhas === 1 ? ' falha' : ' falhas'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
