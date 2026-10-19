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

/* QUANTAS REQUISIÇÕES AO AR ESTA PROVA FAZ (18/10/2026).
 *
 * Ela é a ÚNICA prova que vai à rede de propósito: confere o que está publicado. O custo
 * disso não é tempo — é COTA. O Cloudflare KV limita as operações por conta e por dia, e
 * `list()` está entre elas; quando a cota acaba, os endpoints de estado respondem 500 e a
 * lista de fichas fica sem nome e sem os botões de edição (foi o que aconteceu hoje, e a
 * causa fui eu: carregar as páginas ao vivo dezenas de vezes para medir largura).
 *
 * Uma prova não pode esconder o que gasta. Cada `baixar()` conta, e o total sai no fim —
 * para quem correr isto a seguir saber que duas escolas custam N requisições, e que
 * medir geometria se faz na bancada local, não aqui.
 */
let requisicoesAoAr = 0;

async function baixar(url) {
  requisicoesAoAr++;
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
  // O MAIOR script, e não «o segundo». O índice era `[1]` porque havia três blocos: o
  // anti-flash no `<head>`, o script da página e o `<script src>` da navegação. Em
  // 18/10/2026 o anti-flash saiu dos Bastidores (o modo passou a vir no `<html>`, com a
  // C15) e o `[1]` passou a apontar para o `<script src>`, que é vazio — a prova deixou de
  // medir o script e passou a medir o nada, sem falhar por isso. O critério passa a ser o
  // TAMANHO, que é o que distingue o código da página de um carregador.
  const scriptsDaPagina = blocos(motorProducao, 'script').sort((a, b) => b.length - a.length);
  const motorJs = codigoDoScript(scriptsDaPagina[0] || '');

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

    // O FAVICON (18/10/2026). Ele é pedido por caminho em todas as superfícies, e o defeito
    // de um pacote sem ele é silencioso: a aba fica com o globo do navegador e ninguém
    // repara. A prova custa UMA requisição por escola, e é a única forma de saber que o
    // arquivo chegou ao diretório estático — o Circuito do validador confere a cópia no
    // repositório, não o que o Worker serve.
    const favAr = await baixar(base + '/assets/favicon.svg');
    const favFonte = fs.readFileSync(path.join(raiz, 'tools/templates/marca/favicon.svg'), 'utf8');
    provar('o favicon servido é o de tools/templates/marca/favicon.svg',
      favAr === favFonte, { noAr: h(favAr), fonte: h(favFonte) });

    // A PORTA nos três caminhos. O corpo é o mesmo; o que muda é a fonte da elicitação.
    const familiasDaPorta = new Map();
    for (const caminho of ['/anamnese/', '/plano-ensino/', '/plano-observacao/']) {
      const html = await baixar(base + caminho + '?professor=tiago-menegaz&escola=' + escola.slug + '&ciclo=01');
      const css = blocos(html, 'style')[0] || '';
      provar(`o <style> de ${caminho} é o de porta/index.html`,
        css === portaCss, { noAr: h(css), fonte: h(portaCss) });
      familiasDaPorta.set(caminho, (html.match(/data-paleta="([^"]+)"/) || [])[1]);
    }

    // A PRODUÇÃO — o CSS e o CÓDIGO do motor. O CSS primeiro: é o que desenha a página.
    const prod = await baixar(base + '/bastidores/producao');

    // A FAMÍLIA CHEGA AO QUE A ESCOLA SERVE, e não só aos Bastidores (18/10/2026). A Produção
    // lê a lista de famílias e pinta; a porta e o pacote passam pela ponte, e a ponte tinha a
    // lista escrita à mão — «verde» caía no bordô em tudo o que ela serve, e a cor «só tinha
    // efeito dentro dos bastidores». A prova que faltava é esta, e não custa requisição nenhuma:
    // as duas páginas já foram baixadas, e basta comparar o que cada uma AFIRMA ser. Também não
    // se fixa aqui qual é a família — a escola muda de preferência, e a prova não pode ter
    // opinião sobre isso.
    const familiaProducao = (prod.match(/data-paleta="([^"]+)"/) || [])[1];
    provar('a Produção declara uma família do catálogo',
      (bastidores.IDS_DAS_PALETAS || []).indexOf(familiaProducao) !== -1, familiaProducao);
    for (const [caminho, familia] of familiasDaPorta) {
      provar(`a família da escola é a mesma na porta (${caminho}) e na Produção`,
        familia === familiaProducao, { porta: familia, producao: familiaProducao });
    }

    const prodCss = blocos(prod, 'style')[0] || '';
    provar('o <style> da Produção é o que o motor produz agora',
      prodCss === motorCss, { noAr: h(prodCss), motor: h(motorCss) });

    // O MAIOR script, pelo mesmo motivo do lado do motor: `[1]` deixou de ser o da página
    // quando o anti-flash saiu dos Bastidores, e passou a apontar para o `<script src>` vazio.
    const prodJs = codigoDoScript(blocos(prod, 'script').sort((a, b) => b.length - a.length)[0] || '');
    provar('o <script> da Produção é o do motor (dados da escola fora)',
      prodJs === motorJs, { noAr: h(prodJs), motor: h(motorJs) });
  }

  console.log(`\nprovar-ambiente: ${falhas === 0
    ? 'TUDO CERTO — o que está no ar é o motor'
    : falhas + ' FALHA(S)'}`);
  // O CUSTO, à vista. Se este número crescer sem motivo, alguém está a medir no ar o que
  // devia medir na bancada — e a cota do KV é diária.
  console.log(`requisições ao ar: ${requisicoesAoAr} ` +
    `(${escolas.length} escola(s) × ~${Math.round(requisicoesAoAr / Math.max(1, escolas.length))}) ` +
    '— medir geometria, largura e estado faz-se em bancada local (experimentos/README.md)');
  process.exit(falhas ? 1 : 0);
})();
