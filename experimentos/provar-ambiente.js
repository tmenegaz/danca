#!/usr/bin/env node
'use strict';

/**
 * provar-ambiente.js — o que está NO AR é o motor, ou é uma cópia que envelheceu?
 *
 * Por que existe (18/10/2026). O dono do produto fez a pergunta certa: «não tem sentido eu
 * testar se eu estou testando uma coisa e no motor é outra». Ele estava a apontar a
 * fragilidade do arranjo: cada escola é um Worker que serve, de um diretório de ASSETS,
 * cópias GERADAS da folha (`assets/style.css`) e da porta (`plano-observacao/index.html`),
 * enquanto a página de Produção vem do JavaScript do Worker. Três origens, três chances de
 * divergir em silêncio — e a única que dava para ver a olho era o selo da etiqueta.
 *
 * `tools/check-identidade.js` confere o CIRCUITO no repositório (a cópia é igual à fonte).
 * Ele não olha o que o Worker DEVOLVE. Esta prova olha: para cada escola, compara byte a
 * byte o que está no ar com o que o motor daqui produz.
 *
 * O que se prova, em cada escola (fita e valse):
 *
 *   1. `/api/saude` responde `ok`, com o `slug` do Worker — a página que se vê é desta escola;
 *   2. `/assets/style.css` é BYTE A BYTE `tools/templates/ciclo.css`;
 *   3. `/assets/nav.js` é BYTE A BYTE `tools/templates/nav.js`;
 *   4. o `<style>` da anamnese é o de `porta/index.html` (a porta servida em três caminhos:
 *      `/anamnese/`, `/plano-ensino/`, `/plano-observacao/`);
 *   5. o `<style>` e o `<script>` da Produção são os que `motor/servidor/bastidores.js`
 *      produz agora — o script, com os dados embutidos neutralizados, porque os dados são
 *      da escola e não do motor.
 *
 *      A neutralização é por LINHA e só nos `var <DADOS> = …`, que é exactamente o que o
 *      builder concatena em tempo de execução: o resto do script é código, e código que
 *      diverge é motor velho.
 *
 * Sem rede (ou sem o Worker no ar) isto NÃO É FEITO, e não é verde: sai com código 1 e diz
 * qual escola falhou. Uma garantia que passa por omissão não garante nada.
 *
 *   node experimentos/provar-ambiente.js
 *   node experimentos/provar-ambiente.js --escola fita
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const raiz = path.resolve(__dirname, '..');

const ESCOLAS = [
  { slug: 'fita', pacote: 'professores/tiago-menegaz/ciclos/ciclo-01-fita' },
  { slug: 'valse', pacote: 'professores/tiago-menegaz/ciclos/ciclo-01-valse' },
];

const escolas = process.argv.includes('--escola')
  ? ESCOLAS.filter((e) => e.slug === process.argv[process.argv.indexOf('--escola') + 1])
  : ESCOLAS;

const h = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

/** Os `<style>` e os `<script>` de uma página, na ordem em que aparecem. */
const blocos = (html, tag) =>
  [...html.matchAll(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'g'))].map((m) => m[1]);

// Os dados que o builder EMBUTE no script em tempo de execução. São da escola, não do
// motor: dois Workers com os mesmos dados são o mesmo motor, e comparar o texto cru
// acusaria divergência onde só há conteúdo diferente.
const DADOS = ['RUBRICAS', 'TURMAS', 'CURADORIAS', 'ALUNAS_TODAS', 'NIVEIS_PADRAO'];

/**
 * O CÓDIGO do script, com os DADOS embutidos neutralizados.
 *
 * A primeira versão desta função trabalhava por LINHA — e não fazia nada, porque o script
 * servido é UMA linha só (o builder concatena tudo). O defeito passou despercebido porque
 * deu «ok» na valse: lá os dados são vazios (`[]`), e o texto coincidia com o do motor
 * local, que também os produz vazios. A fita, com dados, reprovava. Um neutralizador que
 * não neutraliza tem exactamente o mesmo defeito do validador que não olha.
 *
 * Agora o valor é consumido como JSON a sério: percorre-se o texto respeitando strings e
 * o aninhamento de `[]`/`{}`, e o valor inteiro é trocado por `0`.
 */
function codigoDoScript(script) {
  let fora = script;
  for (const nome of DADOS) {
    const marca = 'var ' + nome + ' = ';
    let inicio = fora.indexOf(marca);
    while (inicio !== -1) {
      let i = inicio + marca.length;
      let fundo = 0;
      let emString = false;
      let escape = false;
      for (; i < fora.length; i++) {
        const c = fora[i];
        if (emString) {
          if (escape) escape = false;
          else if (c === '\\') escape = true;
          else if (c === '"') emString = false;
          continue;
        }
        if (c === '"') { emString = true; continue; }
        if (c === '[' || c === '{') { fundo++; continue; }
        if (c === ']' || c === '}') {
          fundo--;
          if (fundo === 0) { i++; break; }
          continue;
        }
        if (c === ';' && fundo === 0) break;
      }
      fora = fora.slice(0, inicio + marca.length) + '0' + fora.slice(i);
      inicio = fora.indexOf(marca, inicio + marca.length + 1);
    }
  }
  return fora;
}

async function baixar(url) {
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} em ${url}`);
  return r.text();
}

(async () => {
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    if (!cond) falhas++;
    console.log((cond ? 'ok     ' : 'FALHA  ') + nome + (extra !== undefined ? ' → ' + JSON.stringify(extra) : ''));
  };

  // O que o motor daqui produz, calculado UMA vez: não depende da escola.
  const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
  const motorProducao = bastidores.paginaProducao(
    'x', { professor: 'x', ciclo: '01', query: '' }, [], [], '', '', [], [], [], [], [], []);
  const motorCss = blocos(motorProducao, 'style')[0];
  const motorJs = codigoDoScript(blocos(motorProducao, 'script')[1] || '');

  const portaFonte = fs.readFileSync(path.join(raiz, 'porta/index.html'), 'utf8');
  const portaCss = blocos(portaFonte, 'style')[0];

  if (!motorCss || !motorJs || !portaCss) {
    console.error('provar-ambiente: o motor local não produziu os blocos esperados — NÃO FEITO.');
    process.exit(1);
  }

  for (const escola of escolas) {
    const base = `https://${escola.slug}.tmenegaz77.workers.dev`;
    console.log(`\n== ${escola.slug}  (${base})`);

    let saude;
    try {
      saude = JSON.parse(await baixar(base + '/api/saude'));
    } catch (err) {
      console.error(`FALHA  ${escola.slug}: o Worker não respondeu — ${err.message}`);
      falhas++;
      continue;
    }
    provar('o Worker responde e é desta escola',
      saude.ok === true && saude.slug === escola.slug, saude);
    if (!saude.ok) continue;

    // A FOLHA, byte a byte. É a identidade inteira num arquivo: se ela diverge, tudo o que
    // se vê diverge.
    const cssNoAr = await baixar(base + '/assets/style.css');
    const cssFonte = fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css'), 'utf8');
    provar('o style.css servido é o de tools/templates/ciclo.css',
      cssNoAr === cssFonte, { noAr: h(cssNoAr), fonte: h(cssFonte) });

    const navAr = await baixar(base + '/assets/nav.js');
    const navFonte = fs.readFileSync(path.join(raiz, 'tools/templates/nav.js'), 'utf8');
    provar('o nav.js servido é o de tools/templates/nav.js',
      navAr === navFonte, { noAr: h(navAr), fonte: h(navFonte) });

    // A PORTA nos três caminhos. O corpo é o mesmo; o que muda é a fonte da elicitação.
    for (const caminho of ['/anamnese/', '/plano-ensino/', '/plano-observacao/']) {
      const html = await baixar(base + caminho + '?professor=tiago-menegaz&escola=' + escola.slug + '&ciclo=01');
      const css = blocos(html, 'style')[0] || '';
      provar(`o <style> de ${caminho} é o de porta/index.html`,
        css === portaCss, { noAr: h(css), fonte: h(portaCss) });
    }

    // A PRODUÇÃO — o CSS e o CÓDIGO do motor. O CSS primeiro: é o que desenha a página.
    const prod = await baixar(base + '/bastidores/producao');
    const prodCss = blocos(prod, 'style')[0] || '';
    provar('o <style> da Produção é o que o motor produz agora',
      prodCss === motorCss, { noAr: h(prodCss), motor: h(motorCss) });

    const prodJs = codigoDoScript(blocos(prod, 'script')[1] || '');
    provar('o <script> da Produção é o do motor (dados da escola fora)',
      prodJs === motorJs, { noAr: h(prodJs), motor: h(motorJs) });
  }

  console.log(`\nprovar-ambiente: ${falhas === 0
    ? 'TUDO CERTO — o que está no ar é o motor'
    : falhas + ' FALHA(S)'}`);
  process.exit(falhas ? 1 : 0);
})();
