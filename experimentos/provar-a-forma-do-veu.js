#!/usr/bin/env node
'use strict';

/*
 * provar-a-forma-do-veu.js — O VÉU DO PRODUTO É «O TEXTO NA TELA, SEM CAIXA» (11/11/2026).
 *
 * O QUE MOTIVOU, na letra dela: «implementa a opção 2: o texto na tela, sem caixa».
 *
 * A escolha foi feita a olhar para três bancadas; o que esta prova garante é que a folha do
 * PRODUTO ficou com a escolhida, e não com uma parecida. Uma decisão que se aplica mudando um
 * punhado de linhas é exactamente o género de mudança que se perde numa regressão silenciosa.
 *
 * O QUE ESTA PROVA MEDE, na página da Produção de verdade:
 *
 *   A. NÃO HÁ CAIXA — o `.veu-cartao` não tem fundo, filete, sombra nem ar próprio, e o raio é 0.
 *      É a asserção central: um cartão opaco voltaria a tapar a página que se quis deixar ver.
 *   B. O HALO EXISTE — a etiqueta e a frase têm `text-shadow`, e o giro tem o anel de papel. É o
 *      halo que substitui a caixa; sem ele a frase competia com o formulário por baixo.
 *   C. A ETIQUETA É PALAVRA, NÃO SELO — versalete bordô em `--marca`, sem pílula nem fundo de
 *      alerta. Um selo é uma etiqueta colada a um objecto, e aqui não há objecto a que colar.
 *   D. CONTINUA A LER-SE — o contraste é medido em PIXÉIS da captura (percentis da tinta contra o
 *      halo), e tem de passar AA: 4,5:1 no corpo. É a única forma de saber que o halo faz o
 *      trabalho que a caixa fazia, em vez de o afirmar.
 *   E. A FRASE NÃO DESAPARECE PARA QUEM OUVE — o véu é `role=status`/`aria-live` e continua a
 *      dizer o passo; nada do texto é escondido.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` serve a folha de `REF_NEGATIVO` (por omissão `HEAD`,
 * que ainda tem o cartão) às mesmas páginas. A e C reprovam — se passassem, a prova não provava
 * nada.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-a-forma-do-veu.js
 *   REF_NEGATIVO=HEAD node experimentos/provar-a-forma-do-veu.js --controle-negativo
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;

let ok = 0, ko = 0;
function provar(nome, condicao, detalhe) {
  if (condicao) { ok++; console.log('  ok   ' + nome); return true; }
  ko++;
  console.log('  FALHA ' + nome);
  if (detalhe !== undefined) console.log('        ' + JSON.stringify(detalhe));
  return false;
}

/* A FOLHA EM ESTUDO. No controle negativo ela vem de outra referência, e é servida no lugar da
 * de hoje — o resto da página é o mesmo, para a comparação ser sobre a folha e só sobre ela. */
let folha = path.join(RAIZ, 'tools/templates/ciclo.css');
let destinoNegativo = null;

/**
 * CONTRA QUE FOLHA CORRE O CONTROLE — e a resposta não pode ser `HEAD` (15/11/2026).
 *
 * Era `HEAD`, e funcionou enquanto o trabalho não estava cometido. Cometido, `HEAD` passou a ser a
 * folha NOVA: o controle comparava a prova com ela mesma, tudo passava, e ele mesmo o disse —
 * «A PROVA NÃO PROVA NADA: a folha de antes passou tudo». É a mesma armadilha que a
 * `provar-cofre-e-shard` já pagou uma vez: um controle que envelhece ao ser cometido não é um
 * controle.
 *
 * A âncora passa a ser o commit que RENOMEOU a peça (`.veu` → `.veu-de-operacao`): o pai dele é a
 * folha imediatamente antes, e esse ponto não se move nunca. `REF_NEGATIVO` sobrepõe-no.
 */
function referenciaDaFolhaAntiga() {
  if (process.env.REF_NEGATIVO) return process.env.REF_NEGATIVO;
  try {
    const achou = execSync('git log --diff-filter=M --format=%H -S "veu-de-operacao" -- tools/templates/ciclo.css',
      { cwd: RAIZ, stdio: 'pipe' }).toString().trim().split('\n').filter(Boolean).pop();
    if (achou) return achou + '~1';
  } catch (erro) { /* sem git: cai-se em HEAD, e o controle dirá que não prova nada */ }
  return 'HEAD';
}

if (negativo) {
  const ref = referenciaDaFolhaAntiga();
  destinoNegativo = fs.mkdtempSync(path.join(os.tmpdir(), 'veu-forma-'));
  folha = path.join(destinoNegativo, 'style.css');
  fs.writeFileSync(folha, execSync('git show ' + ref + ':tools/templates/ciclo.css',
    { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }));
  console.log('CONTROLE NEGATIVO contra ' + ref + '\n');
}

const b = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const html = b.paginaProducao('calango',
  { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
  [{ nome: 'Redinha Rosa', slug: 'redinha-rosa' }], [], 'Pe Torto', 'pe-torto',
  [], [], [], [], [], []);

const puppeteer = require(execSync('npm root -g').toString().trim()
  + '/@marp-team/marp-cli/node_modules/puppeteer-core');

const srv = http.createServer((req, res) => {
  const rota = req.url.split('?')[0];
  if (rota.startsWith('/api/')) {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    return res.end('{}');
  }
  if (rota === '/' || rota.startsWith('/bastidores')) {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    return res.end(html);
  }
  if (rota.endsWith('style.css') || rota.endsWith('ciclo.css')) {
    res.setHeader('content-type', 'text/css; charset=utf-8');
    return res.end(fs.readFileSync(folha));
  }
  if (rota.endsWith('nav.js')) {
    res.setHeader('content-type', 'application/javascript; charset=utf-8');
    return res.end(fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
  }
  res.statusCode = 404; res.end('nao');
});

/** O contraste em PIXÉIS: recorta a caixa da tinta e compara os percentis contra o halo em volta.
 *  Descodifica com o `sharp` do projecto — a cor calculada a partir do token diria o que a folha
 *  declara; isto diz o que sai no ecrã, halo e véu translúcido incluídos. */
async function contrasteDaTinta(png, caixa) {
  let sharp;
  try { sharp = require(path.join(RAIZ, 'node_modules', 'sharp')); } catch (e) { return null; }
  if (typeof sharp !== 'function' && sharp && typeof sharp.default === 'function') sharp = sharp.default;
  if (typeof sharp !== 'function') return null;
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const lum = (x, y) => {
    const i = (info.width * y + x) * info.channels;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  };
  const dentro = [], fora = [];
  for (let y = caixa.y; y < caixa.y + caixa.height; y++) {
    for (let x = caixa.x; x < caixa.x + caixa.width; x++) dentro.push(lum(x, y));
  }
  for (let y = Math.max(0, caixa.y - 24); y < Math.min(info.height, caixa.y + caixa.height + 24); y++) {
    for (let x = Math.max(0, caixa.x - 24); x < Math.min(info.width, caixa.x + caixa.width + 24); x++) {
      if (y >= caixa.y && y < caixa.y + caixa.height && x >= caixa.x && x < caixa.x + caixa.width) continue;
      fora.push(lum(x, y));
    }
  }
  if (!dentro.length || !fora.length) return null;
  const p = (arr, q) => { const s = arr.slice().sort((a, b2) => a - b2);
    return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]; };
  /* A tinta é o percentil 1 da caixa (o núcleo escuro das letras); o papel é a MEDIANA da moldura,
   * que é o halo — e não o branco puro, porque o véu é translúcido e o halo é o que fica atrás. */
  const tinta = p(dentro, 0.01);
  const papel = p(fora, 0.5);
  const rel = (a, b2) => (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05);
  return { tinta: Math.round(tinta), papel: Math.round(papel), razao: rel(tinta, papel) };
}

(async () => {
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const nav = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox'] });
  const p = await nav.newPage();
  await p.setViewport({ width: 1280, height: 900 });
  p.on('dialog', (d) => d.dismiss());
  await p.goto(url, { waitUntil: 'networkidle0' });

  /* Acender o véu pela API VERDADEIRA do módulo — é o caminho do produto, não uma classe posta à
   * mão pela prova. */
  await p.evaluate(() => window.LastroDaOperacao.ocupar(
    'a derivar a Turma «ami» e a reencadear o plano de ensino e o plano de observação…', 'Derivação'));
  await new Promise((r) => setTimeout(r, 400));

  /* ========================================================================
   * A. NÃO HÁ CAIXA
   * ====================================================================== */
  console.log('A. o cartão deixou de ser cartão');
  const a = await p.evaluate(() => {
    const c = document.querySelector('#veu .veu-cartao');
    const cs = c && getComputedStyle(c);
    if (!cs) return { existe: false };
    return {
      existe: true,
      fundo: cs.backgroundColor,
      imagem: cs.backgroundImage,
      filete: cs.borderTopWidth + ' ' + cs.borderTopStyle,
      sombra: cs.boxShadow,
      raio: cs.borderTopLeftRadius,
      preenchimento: cs.paddingTop + ' ' + cs.paddingRight + ' ' + cs.paddingBottom + ' ' + cs.paddingLeft,
      largura: Math.round(c.getBoundingClientRect().width),
    };
  });
  provar('o cartão existe (o nav.js continua a montá-lo)', a.existe === true, a);
  provar('…sem fundo', a.fundo === 'rgba(0, 0, 0, 0)' && a.imagem === 'none', a);
  provar('…sem filete', a.filete === '0px none', a.filete);
  provar('…sem sombra de caixa', a.sombra === 'none', a.sombra);
  provar('…sem raio nem ar próprio', a.raio === '0px' && a.preenchimento === '0px 0px 0px 0px', a);
  provar('…e sem a largura de diálogo (34 rem ≈ 544 px)', a.largura !== 544, a.largura);

  /* ========================================================================
   * B. O HALO QUE SUBSTITUI A CAIXA
   * ====================================================================== */
  console.log('\nB. o halo, que faz o trabalho da caixa');
  const b2 = await p.evaluate(() => {
    const cs = (sel) => {
      const el = document.querySelector('#veu ' + sel);
      return el ? getComputedStyle(el) : null;
    };
    const texto = cs('.veu-texto'), etiqueta = cs('.veu-etiqueta'), giro = cs('.veu-cartao');
    const anel = giro ? getComputedStyle(document.querySelector('#veu .veu-cartao'), '::before') : null;
    return {
      textoHalo: texto && texto.textShadow,
      etiquetaHalo: etiqueta && etiqueta.textShadow,
      anelSombra: anel && anel.boxShadow,
      anelBorda: anel && anel.borderTopWidth,
      serif: texto && /serif/i.test(texto.fontFamily),
      tamanho: texto && parseFloat(texto.fontSize),
    };
  });
  provar('a frase tem halo (text-shadow)', /rgb/.test(String(b2.textoHalo)), b2.textoHalo);
  provar('a etiqueta tem halo', /rgb/.test(String(b2.etiquetaHalo)), b2.etiquetaHalo);
  provar('o giro tem anel de papel (box-shadow)', /rgb/.test(String(b2.anelSombra)), b2.anelSombra);
  provar('…e o anel continua fino (2 px)', b2.anelBorda === '2px', b2.anelBorda);
  provar('a frase está na serifa do corpo', b2.serif === true, b2.serif);
  provar('…e no tamanho aprovado (23,2 px a 1280)', b2.tamanho === 23.2, b2.tamanho);

  /* ========================================================================
   * C. A ETIQUETA É PALAVRA, NÃO SELO
   * ====================================================================== */
  console.log('\nC. a etiqueta deixou de ser selo');
  const c = await p.evaluate(() => {
    const el = document.querySelector('#veu .veu-etiqueta');
    const cs = el && getComputedStyle(el);
    if (!cs) return { existe: false };
    return {
      existe: true,
      fundo: cs.backgroundColor,
      filete: cs.borderTopWidth,
      pílula: cs.borderTopLeftRadius,
      cor: cs.color,
      espaco: cs.letterSpacing,
      peso: cs.fontWeight,
      maiusculas: cs.textTransform,
    };
  });
  provar('a etiqueta existe', c.existe === true, c);
  provar('…sem fundo de alerta', c.fundo === 'rgba(0, 0, 0, 0)', c.fundo);
  provar('…sem filete nem pílula', c.filete === '0px' && c.pílula === '0px', c);
  provar('…em versalete espaçado', c.maiusculas === 'uppercase' && parseFloat(c.espaco) > 2, c);
  provar('…e em negrito', Number(c.peso) >= 700, c.peso);
  // A cor é o acento do tema, lido do token — não um `rgb()` escrito na regra.
  const acento = await p.evaluate(() => {
    const el = document.querySelector('#veu .veu-etiqueta');
    const sonda = document.createElement('span');
    sonda.style.color = 'var(--marca)';
    document.body.appendChild(sonda);
    const cor = getComputedStyle(sonda).color;
    sonda.remove();
    return { esperado: cor, naTela: getComputedStyle(el).color };
  });
  provar('…na cor do acento do tema (--marca)',
    acento.esperado === acento.naTela, acento);

  /* ========================================================================
   * D. CONTINUA A LER-SE — medido em pixéis
   * ====================================================================== */
  console.log('\nD. o halo chega? (contraste medido na captura)');
  const caixa = await p.evaluate(() => {
    const r = document.querySelector('#veu .veu-texto').getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  });
  const png = await p.screenshot({ clip: {
    x: Math.max(0, caixa.x - 40), y: Math.max(0, caixa.y - 40),
    width: Math.min(1280, caixa.width + 80), height: Math.min(900, caixa.height + 80) } });
  const medida = await contrasteDaTinta(png, { x: 40, y: 40,
    width: Math.min(caixa.width, 1280 - 80), height: Math.min(caixa.height, 900 - 80) });
  if (!medida) {
    console.log('  (o sharp não está disponível — contraste NÃO MEDIDO)');
    provar('contraste medido em pixéis', false, 'sharp ausente');
  } else {
    console.log('        tinta ' + medida.tinta + ' · papel ' + medida.papel
      + ' · ' + medida.razao.toFixed(2) + ':1');
    provar('…e a frase lê-se com folga (AA: 4,5:1)', medida.razao >= 4.5, medida);
  }

  /* ========================================================================
   * E. NADA SE PERDEU PARA QUEM OUVE
   * ====================================================================== */
  console.log('\nE. o véu continua a dizer o passo');
  const e = await p.evaluate(() => {
    const v = document.getElementById('veu');
    return {
      papel: v.getAttribute('role'),
      vivo: v.getAttribute('aria-live'),
      texto: (v.querySelector('.veu-texto') || {}).textContent || '',
      etiqueta: (v.querySelector('.veu-etiqueta') || {}).textContent || '',
      escondido: (() => {
        const t = v.querySelector('.veu-texto');
        const cs = t && getComputedStyle(t);
        return !cs || cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0;
      })(),
    };
  });
  provar('o véu anuncia-se (role=status, aria-live)', e.papel === 'status' && /polite/.test(String(e.vivo)), e);
  provar('…e diz o passo por palavras', /derivar/.test(e.texto), e.texto.slice(0, 80));
  provar('…e nomeia a operação', /Deriva/.test(e.etiqueta), e.etiqueta);
  provar('…sem esconder o texto de quem ouve', e.escondido === false, e);

  /* E o véu continua a trancar e a sair — a forma mudou, o ofício não. */
  const trancado = await p.evaluate(() => Array.from(document.body.children)
    .filter((x) => x.id !== 'veu' && x.inert).length);
  provar('…e continua a trancar a página por baixo', trancado > 0, trancado);
  await p.evaluate(() => window.LastroDaOperacao.liberar());
  await new Promise((r) => setTimeout(r, 300));
  const saiu = await p.evaluate(() => ({
    ocupado: document.getElementById('veu').getAttribute('data-ocupado'),
    trancados: Array.from(document.body.children).filter((x) => x.id !== 'veu' && x.inert).length,
  }));
  provar('…e sai quando a operação acaba', saiu.ocupado === null && saiu.trancados === 0, saiu);

  /* ========================================================================
   * F. O VÉU DA PORTA — E O QUE ELE CUSTOU A 15/11/2026
   *
   * O QUE ELA RELATOU: «quando eu fiz a anamnese, não teve o véu. Quando eu fiz o plano de
   * ensino, também estava sem véu. E quando eu fiz o plano de observação, também sem véu.»
   *
   * Os três actos acontecem na MESMA página — a PORTA (`porta/index.html`, servida em
   * `/plano-observacao/`). E a porta traz o seu `<div id="veu">` na marcação, ao contrário da
   * Produção, que também o traz, e das listas, que não trazem nenhum.
   *
   * A CAUSA. Em 15/11 a classe do véu da operação passou a `.veu-de-operacao` (a colisão com o
   * véu da folha), e a folha de estilo foi corrigida inteira. A marcação de `porta/index.html`
   * NÃO: ficou `class="veu"`, que é a classe do véu da COLUNA — `opacity:0`, `z-index:55`.
   * Medido num Chromium, com o marcador de ocupação posto: `display:none`, `opacity:0`. O véu
   * cobria a janela e não se via, que é indistinguível de não existir.
   *
   * A SEGUNDA METADE, e é a que alcança o que está publicado: `garantirVeu` só escrevia a classe
   * quando CRIAVA o elemento. Um véu que viesse no HTML ficava com a classe velha para sempre.
   *
   * O QUE SE MEDE AQUI, os dois lados:
   *   · a FONTE e as cópias dos pacotes declaram `veu-de-operacao` (o que nasce certo);
   *   · e um véu que venha com a classe VELHA é normalizado pelo `nav.js` e aparece na mesma —
   *     é o caso das páginas já publicadas, que só se corrigem por aqui.
   * ====================================================================== */
  console.log('\nF. o véu da PORTA — a classe certa, e a que vem velha');
  {
    const fonte = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
    provar('a porta declara o véu da operação com a classe própria',
      /<div class="veu-de-operacao" id="veu"/.test(fonte), (fonte.match(/<div class="[^"]*" id="veu"/) || [''])[0]);
    provar('…e já não traz a classe do véu da coluna (`class="veu"`)',
      !/<div class="veu" id="veu"/.test(fonte), null);

    /* AS CÓPIAS DOS PACOTES. O `check-identidade` compara-as byte a byte com a fonte; aqui
     * afirma-se o facto que interessa ao véu, para que o defeito não volte por uma regeneração
     * com uma porta velha. */
    const copias = execSync('ls -d professores/*/ciclos/ciclo-*/plano-observacao/index.html',
      { cwd: RAIZ, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    const erradas = copias.filter((c) => !/<div class="veu-de-operacao" id="veu"/.test(fs.readFileSync(path.join(RAIZ, c), 'utf8')));
    provar('as ' + copias.length + ' cópias da porta nos pacotes trazem a classe certa', erradas.length === 0, erradas);
  }

  /* O CASO JÁ PUBLICADO: a marcação VELHA, o `nav.js` de hoje. É a combinação que existe em cada
   * escola até o próximo deploy — e é ela que tem de funcionar. */
  {
    const velha = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>x</title>'
      + '<link rel="stylesheet" href="/assets/style.css"></head><body>'
      + '<main><h1>a porta</h1></main>'
      + '<div class="veu" id="veu" role="status" aria-live="polite">'
      + '<p class="veu-texto">a trabalhar…</p></div>'
      + '<script src="/assets/nav.js"></script></body></html>';
    const srv2 = http.createServer((req, res) => {
      const rota = req.url.split('?')[0];
      if (rota === '/assets/style.css') { res.setHeader('content-type', 'text/css'); return res.end(fs.readFileSync(folha)); }
      if (rota === '/assets/nav.js') { res.setHeader('content-type', 'application/javascript'); return res.end(fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js'))); }
      if (rota.startsWith('/api/')) { res.setHeader('content-type', 'application/json'); return res.end('{}'); }
      res.setHeader('content-type', 'text/html'); res.end(velha);
    });
    await new Promise((r) => srv2.listen(0, '127.0.0.1', r));
    const p2 = await nav.newPage();
    await p2.setViewport({ width: 1280, height: 900 });
    try {
      await p2.goto('http://127.0.0.1:' + srv2.address().port + '/plano-observacao/', { waitUntil: 'load' });
      const antes = await p2.evaluate(() => {
        const v = document.getElementById('veu');
        const cs = getComputedStyle(v);
        return { classe: v.className, display: cs.display, opacity: cs.opacity, z: cs.zIndex };
      });
      provar('um véu que vem com a classe VELHA é normalizado pelo `nav.js`',
        /veu-de-operacao/.test(antes.classe) && !/(^|\s)veu(\s|$)/.test(antes.classe), antes);
      await p2.evaluate(() => window.LastroDaOperacao.ocupar('a gravar', 'Gravação'));
      await new Promise((r) => setTimeout(r, 300));
      const agora = await p2.evaluate(() => {
        const v = document.getElementById('veu');
        const cs = getComputedStyle(v);
        const r = v.getBoundingClientRect();
        return { display: cs.display, opacity: Number(cs.opacity), z: cs.zIndex,
          cobre: Math.round(r.width) > 1000 && Math.round(r.height) > 500 };
      });
      provar('…e ele APARECE: `display:flex`, opacidade 1, a cobrir a janela',
        agora.display === 'flex' && agora.opacity === 1 && agora.cobre, agora);
      provar('…acima da coluna (z-index 120, e não o 55 do véu dela)', Number(agora.z) === 120, agora.z);
    } finally {
      await p2.close();
      srv2.close();
    }
  }

  await nav.close();
  srv.close();
  console.log('\n' + (ko ? 'FALHARAM ' + ko + ' de ' + (ok + ko) : 'TUDO CERTO — ' + ok
    + ' asserções: o véu do produto é o texto na tela, sem caixa, com halo, e continua a dizer o passo.'));
  if (negativo) {
    if (ko === 0) { console.log('A PROVA NÃO PROVA NADA: a folha de antes passou tudo.'); process.exit(1); }
    console.log('Como esperado: a folha de antes reprova ' + ko + ' de ' + (ok + ko) + '.');
    process.exit(0);
  }
  process.exit(ko ? 1 : 0);
})().catch((e) => {
  console.error('A prova rebentou: ' + (e && e.stack || e));
  srv.close();
  process.exit(1);
});
