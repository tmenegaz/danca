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
 * Ele não olha o que o Worker DEVOLVE. Esta prova olha: compara o que está no ar com o que o motor
 * daqui produz — byte a byte onde a ponte não toca, e pelo que a página AFIRMA onde ela reescreve.
 *
 * O que se prova, em cada escola:
 *
 *   1. `/api/saude` responde `ok`, com o `slug` do Worker — a página que se vê é desta escola;
 *   2. `/assets/style.css` é BYTE A BYTE `tools/templates/ciclo.css`;
 *   3. `/assets/nav.js` é BYTE A BYTE `tools/templates/nav.js`;
 *   4. a porta responde nos três caminhos (`/anamnese/`, `/plano-ensino/`, `/plano-observacao/`) e
 *      é a PORTA, não a lista para onde a rota vazia desvia — o marcador é `id="ctx-aluna"`, que
 *      só o formulário do ato tem;
 *   5. o `<style>` e o `<script>` da Produção são os que `motor/servidor/bastidores.js`
 *      produz agora — o script, com os dados embutidos neutralizados, porque os dados são
 *      da escola e não do motor.
 *
 *      A neutralização é a do `codigoDoScript`, abaixo: os `var <DADOS> = …` são consumidos como
 *      JSON a sério e trocados por `0` — o resto do script é código, e código que diverge é motor
 *      velho.
 *
 * O `<style>` DA PORTA NÃO É COMPARADO, e a razão é medida (25/11/2026). Ele era, byte a byte,
 * contra `porta/index.html` — e nunca mais podia ser: a ponte MINIFICA a folha ao servir
 * (47 398 → 17 067 bytes) e reescreve-a por escola. Medido no `breu`, o minificador tira os
 * comentários e os espaços, o `;` antes de `}`, as aspas dos atributos (`[aria-current="page"]` →
 * `[aria-current=page]`), troca `::before` por `:before` e funde listas de seletores. Uma
 * comparação byte a byte mediria o MINIFICADOR, não a identidade — e uma normalização que
 * perseguisse cada uma dessas regras seria uma segunda implementação dele, a apodrecer ao lado.
 *
 * O que garante essa cópia é outra prova, e ela corre em cada commit:
 * `tools/check-identidade.js` exige que a cópia da porta em cada pacote seja a de
 * `porta/index.html`, byte a byte. Aqui fica o que só o ar pode dizer: a folha servida
 * (`/assets/style.css`, byte a byte) e a família que a porta declara — que tem de ser a mesma da
 * Produção.
 *
 * QUAIS ESCOLAS (25/11/2026), e porque é que isto deixou de ser uma lista à mão. Ela era
 * `[fita, valse]`, e as duas já não existem: a prova falhava em ambas por 404 — o que ainda se lia
 * como «o Worker não respondeu», e não como «a lista está velha». O pior veio depois: `--escola
 * breu` filtrava a lista para nada, o laço não corria, e a prova respondia «TUDO CERTO — 0
 * escola(s)». Um falso verde, que é a família de erro que este repositório persegue.
 *
 * A lista passa a ser DERIVADA das mesmas fontes que o `publicar.yml` usa: as escolas de
 * `escola/<slug>/indice.json` que têm pacote-zero (`temPacoteZero`, de
 * `tools/escolas-para-publicar.js` — uma regra, um sítio) e o endereço de
 * `dominio-da-escola.hostname` (`<escola>.padd.com.br`, a única composição que existe). E, o que
 * importa mais: **lista vazia é FALHA**, e um `--escola` que não casa com nenhuma escola viva
 * também. Uma prova que passa sem medir nada não é uma prova.
 *
 * Sem rede (ou sem o Worker no ar) isto NÃO É FEITO, e não é verde: sai com código 1 e diz
 * qual escola falhou. Uma garantia que passa por omissão não garante nada.
 *
 *   node experimentos/provar-ambiente.js
 *   node experimentos/provar-ambiente.js --escola breu
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const raiz = path.resolve(__dirname, '..');

/* AS ESCOLAS VIVAS — derivadas, nunca uma lista à mão. Ver a nota do cabeçalho: a lista fixa
 * (`fita`, `valse`) sobreviveu ao desaparecimento das duas escolas, e depois disso produziu um
 * «TUDO CERTO — 0 escola(s)» quando o filtro não casava com nada.
 *
 * O critério de «viva» é o do `publicar.yml`, e vem de `temPacoteZero`: é o pacote-zero que a
 * escola SERVE, e uma escola expurgada não tem nenhum. Duas opiniões sobre «esta escola existe»
 * divergiriam, e a que ficasse para trás seria esta.
 *
 * O `worker`/`shard` do índice NÃO muda o endereço: a escola responde no domínio dela, e é o mapa
 * de hosts do Worker que a resolve (medido em `breu.padd.com.br/api/saude`: `origem: "mapa"`). */
function escolasVivas() {
  const { temPacoteZero } = require(path.join(raiz, 'tools/escolas-para-publicar.js'));
  const { hostname } = require(path.join(raiz, 'motor/servidor/dominio-da-escola.js'));
  const base = path.join(raiz, 'escola');
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .sort()
    .filter((slug) => temPacoteZero(slug, raiz))
    .map((slug) => ({ slug, base: 'https://' + hostname(slug) }));
}

const ESCOLAS = escolasVivas();

const pedido = process.argv.includes('--escola')
  ? String(process.argv[process.argv.indexOf('--escola') + 1] || '').trim() : '';
const escolas = pedido ? ESCOLAS.filter((e) => e.slug === pedido) : ESCOLAS;

/* LISTA VAZIA É FALHA, e não um verde. Sem esta guarda, `--escola` com um nome que não existe (ou
 * um repositório sem nenhuma escola com pacote-zero) respondia «TUDO CERTO — 0 escola(s)» — que é
 * a mesma mentira por omissão de um validador que não olha. */
if (!escolas.length) {
  const existentes = ESCOLAS.map((e) => e.slug);
  console.error('provar-ambiente: NENHUMA escola a medir'
    + (pedido ? ' — «' + pedido + '» não é uma escola viva' : '')
    + '. Escolas vivas (com pacote-zero): ' + (existentes.length ? existentes.join(', ') : 'nenhuma')
    + '. Sem uma escola não há o que provar, e isto NÃO é verde.');
  process.exit(1);
}

const h = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

/** Os `<style>` e os `<script>` de uma página, na ordem em que aparecem. */
const blocos = (html, tag) =>
  [...html.matchAll(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'g'))].map((m) => m[1]);

// Os dados que o builder EMBUTE no script em tempo de execução. São da escola, não do
// motor: dois Workers com os mesmos dados são o mesmo motor, e comparar o texto cru
// acusaria divergência onde só há conteúdo diferente.
/* OS DADOS QUE O BUILDER EMITE E QUE SÃO DA ESCOLA — não do motor.
 *
 * A LISTA ESTAVA INCOMPLETA, e a prova reprovava por isso (25/11/2026): medido no `breu`, sete
 * variáveis divergiam entre o ar e o motor e só duas estavam aqui. O `ELENCOS_MOVIVEIS` era o
 * primeiro desvio, e a mensagem dizia «o `<script>` da Produção não é o do motor» — que é falso:
 * o motor era o mesmo, o dado é que era da escola. Uma prova que acusa o motor pelo dado alheio
 * manda procurar o defeito no sítio errado.
 *
 * A lista é DECLARADA de propósito, e não «neutraliza-se todo o `var X = …`»: uma constante do
 * motor também pode ser um literal JSON, e neutralizá-la esconderia uma divergência real. O que a
 * declaração custa é a manutenção — e esse preço é pago pela asserção que vem depois: quando os
 * dois scripts divergem, a falha NOMEIA a variável do primeiro desvio, e quem a lê sabe o que
 * fazer (se é dado da escola, junta-se a esta lista).
 *
 * A lista foi medida, não adivinhada: `RUBRICAS`, `TURMAS` e `NIVEIS_PADRAO` coincidiam no `breu`
 * (turmas vazias, régua padrão), mas são dado da escola em qualquer outra — ficam. E os DADOS NÃO
 * SÃO TODOS LISTAS: `ELENCOS_GRAVADOS` é um número e `TEM_PROFESSOR_COM_REGUA` é um booleano —
 * foram os dois desvios que sobraram depois da primeira correcção, e a falha nomeou-os um a um.
 * O neutralizador consome-os como consome os JSON: até ao `;`, respeitando os aninhamentos. */
const DADOS = [
  'RUBRICAS', 'TURMAS', 'CURADORIAS', 'ALUNAS_TODAS', 'NIVEIS_PADRAO',
  'ELENCOS', 'ELENCOS_MOVIVEIS', 'ELENCOS_GRAVADOS', 'VINCULADAS',
  'NOMES_DE_PROFESSOR', 'PROFESSORES_DA_ESCOLA', 'TEM_PROFESSOR_COM_REGUA',
];

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
  let neutralizados = 0;
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
      neutralizados++;
      inicio = fora.indexOf(marca, inicio + marca.length + 1);
    }
  }
  return { codigo: fora, neutralizados };
}

/**
 * A PRIMEIRA DIVERGÊNCIA, com o nome do `var` que a contém.
 *
 * Sem isto, a falha dizia «o script não é o do motor» e o diagnóstico começava por procurar um
 * defeito no motor. Com isto, diz QUAL variável divergiu — e o primeiro caso medido foi o
 * `ELENCOS_MOVIVEIS`, que é dado da escola e não código do motor. A mensagem passa a apontar o
 * sítio certo: ou o dado entra na lista `DADOS`, ou a diferença é mesmo do motor.
 */
function ondeDiverge(noAr, doMotor) {
  let i = 0;
  while (i < noAr.length && i < doMotor.length && noAr[i] === doMotor[i]) i++;
  const antes = noAr.slice(0, i);
  const marcas = [...antes.matchAll(/var\s+([A-Za-z_$][\w$]*)\s*=/g)];
  return {
    em: i,
    varNoAr: marcas.length ? marcas[marcas.length - 1][1] : null,
    noAr: JSON.stringify(noAr.slice(Math.max(0, i - 40), i + 40)),
    doMotor: JSON.stringify(doMotor.slice(Math.max(0, i - 40), i + 40)),
  };
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
  const motorNeutralizado = codigoDoScript(scriptsDaPagina[0] || '');
  const motorJs = motorNeutralizado.codigo;

  const portaFonte = fs.readFileSync(path.join(raiz, 'porta/index.html'), 'utf8');

  if (!motorCss || !motorJs) {
    console.error('provar-ambiente: o motor local não produziu os blocos esperados — NÃO FEITO.');
    process.exit(1);
  }
  /* O MARCADOR DA PORTA TEM DE EXISTIR NA FONTE. Ele é o que distingue a porta da lista ao vivo;
   * se um dia sair de `porta/index.html`, a asserção de lá passaria a procurar uma coisa que já
   * não é a porta — e a medida ficaria sem sujeito, em silêncio. Verifica-se aqui, uma vez. */
  if (!/id="ctx-aluna"/.test(portaFonte)) {
    console.error('provar-ambiente: o marcador `id="ctx-aluna"` já não está em porta/index.html — '
      + 'a asserção que distingue a porta da lista ficou sem sujeito. NÃO FEITO.');
    process.exit(1);
  }
  /* O NEUTRALIZADOR TEM DE NEUTRALIZAR. Ele já falhou duas vezes em silêncio neste ficheiro (por
   * linha, e por lista incompleta), e das duas o sintoma foi o mesmo: uma comparação a medir o
   * que não devia. Se nenhum dado for encontrado, a marca mudou — e isto diz-se em vez de passar. */
  if (!motorNeutralizado.neutralizados) {
    console.error('provar-ambiente: a neutralização dos dados não encontrou nenhum `var` da lista '
      + 'DADOS — o construtor mudou, e esta prova estaria a comparar dados da escola como se '
      + 'fosse código. NÃO FEITO.');
    process.exit(1);
  }

  for (const escola of escolas) {
    const base = escola.base;
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

    /* A PORTA NOS TRÊS CAMINHOS — e ela tem de ser a PORTA, não a lista.
     *
     * A ANAMNESE LEVA `aluna` DE PROPÓSITO. Sem sujeito, o servidor desvia para a lista antes de
     * servir um byte de formulário (a regra de 15/11/2026: «essa rota tem que ser uma rota
     * bloqueada»). Medido a 25/11/2026: `/anamnese/?professor=…&escola=…&ciclo=01` responde 302
     * para `/area-do-professor/anamnese/`, e o que se estava a comparar era a LISTA a passar por
     * porta. O `aluna=x` só satisfaz a guarda — a página não é executada aqui, só lida.
     *
     * O `<style>` deixou de ser comparado — ver a nota do cabeçalho: a ponte minifica e reescreve
     * a folha por escola. O que se afirma é que a resposta é a porta do ato (`id="ctx-aluna"`, que
     * só ela tem) e que a família que ela declara é do catálogo e a mesma da Produção. */
    const familiasDaPorta = new Map();
    for (const caminho of ['/anamnese/', '/plano-ensino/', '/plano-observacao/']) {
      const sufixo = caminho === '/anamnese/' ? '&aluna=x' : '';
      const html = await baixar(base + caminho + '?professor=tiago-menegaz&escola=' + escola.slug
        + '&ciclo=01' + sufixo);
      provar(`a porta responde em ${caminho} e é a porta do ato`,
        /id="ctx-aluna"/.test(html) && !/data-lista=/.test(html.slice(0, 4000)),
        { bytes: html.length });
      familiasDaPorta.set(caminho, (html.match(/data-paleta="([^"]+)"/) || [])[1]);
      // A MARCA DO SISTEMA NA PORTA (18/10/2026), ao vivo e sem requisição nova: o HTML já
      // está em mãos. Era aqui que ela faltava — a barra da porta é escrita no PACOTE, na
      // geração, e o pacote no ar era mais velho que a marca. A ponte passou a preencher o
      // slot ao servir; esta linha é o que confirma que o que está no ar a tem de facto.
      //
      // O `<span aria-hidden="true">` ENTRE O LINK E O `<svg>` É DE HOJE (25/11/2026), e a
      // regex antiga (`class="marca"[^>]*><svg`) reprovava por causa dele — o facto estava
      // certo e a medida é que estava presa a uma marcação que mudou. O que se exige é o link
      // com nome e um vetor lá dentro; o invólucro é decoração.
      provar(`a marca do sistema chega à porta (${caminho})`,
        /class="marca"[^>]*>[\s\S]{0,120}?<svg/.test(html),
        { trecho: (html.match(/class="marca"[^>]*>[\s\S]{0,80}/) || [])[0] });
    }

    // A PRODUÇÃO — o CSS e o CÓDIGO do motor. O CSS primeiro: é o que desenha a página.
    const prod = await baixar(base + '/bastidores/estudio');

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
    const prodNeutralizado = codigoDoScript(
      blocos(prod, 'script').sort((a, b) => b.length - a.length)[0] || '');
    const prodJs = prodNeutralizado.codigo;
    const igualAoMotor = prodJs === motorJs;
    provar('o <script> da Produção é o do motor (dados da escola fora)', igualAoMotor,
      igualAoMotor
        ? { noAr: h(prodJs), motor: h(motorJs), neutralizados: prodNeutralizado.neutralizados }
        /* A FALHA NOMEIA A VARIÁVEL, e é o que a torna acionável: se o nome é dado da escola,
         * entra na lista `DADOS`; se não é, a diferença é mesmo do motor. */
        : Object.assign(ondeDiverge(prodJs, motorJs),
          { noAr: h(prodJs), motor: h(motorJs), neutralizados: prodNeutralizado.neutralizados }));
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
