#!/usr/bin/env node
'use strict';

/**
 * provar-o-estudio.js — Bastidores tem UM destino, e ele chama-se Estúdio (22/11/2026).
 *
 * O PEDIDO, na letra dela:
 *
 *   «Nós temos aqui bastidores, e bastidores tem dois endereços, o estúdio de dança e a produção.
 *    Esse endereço estúdio de dança vai deixar de existir. Em bastidores a gente vai ter apenas a
 *    produção e tudo o que a gente já desenvolveu dentro dela. Só que nós vamos rebatizar a
 *    produção. A produção vai se chamar estúdio. E aí os demais endereços, tudo o que está contido
 *    dentro dessa parte que chama produção, vai ficar agora dentro do estúdio. […] aqui dentro do
 *    estúdio nós temos o bloco produção, que aí tem um painel inicial, isso continua assim.
 *    Configuração com o que tem dentro dele continua. Pessoa também e pedagogia e tudo que tem
 *    dentro também.»
 *
 * O QUE SE MEDE, e por que cada asserção existe:
 *
 *   A. O ENDEREÇO É UM SÓ. `/bastidores/estudio` serve a página; `/bastidores` e
 *      `/bastidores/producao` (e o mês a mês nas duas formas) respondem 302 para ele, com a
 *      query — quem tem um favorito antigo chega ao mesmo sítio, e não a um 404. Sem a segunda
 *      metade, a mudança de nome apagaria o endereço de quem o tinha guardado.
 *
 *   B. AS SECÇÕES CONTINUAM TODAS DENTRO. O que ela enumerou — Painel inicial, Configuração,
 *      Pessoas, Pedagogia — e os destinos de cada grupo. Uma mudança de nome que levasse uma
 *      secção consigo seria uma mudança de conteúdo disfarçada.
 *
 *   C. A PÁGINA DIZ ONDE SE ESTÁ. O `<h1>` e o título do documento são «Estúdio»; o grupo
 *      «Produção» da coluna fica, porque é o BLOCO produção que continua dentro do estúdio.
 *
 *   D. O MENU TEM UM DESTINO, e é «Estúdio». «Estúdio de Dança» desapareceu — do menu, do código
 *      e de qualquer página servida. É a metade que impede o endereço de voltar por um link
 *      esquecido.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai o `motor/` e o `tools/` de outro commit com
 * `git archive` e corre A, C e D contra eles. Na base, `/bastidores/estudio` é a página da
 * «cena» (um parágrafo), `/bastidores/producao` serve o gabinete, e o menu tem dois itens: as
 * asserções caem. Uma prova que passasse na base não estaria a medir esta mudança.
 *
 *   node experimentos/provar-o-estudio.js
 *   node experimentos/provar-o-estudio.js --contra=feac5b03
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ESCOLA = 'breu';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 220)));
}

/** Um KV de bolso — a página lê a aparência e os cadastros; vazios servem. */
function kvDeBolso() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

function ambiente() {
  return {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PADD_KV: kvDeBolso(), ASSETS: null,
    SENHA_ADMIN: 'senha-de-bancada', SENHA_PROFESSOR: 'senha-de-bancada',
    PROFESSOR_NOME: 'Demi Plié', PROFESSOR_SLUG: 'demi-plie', GITHUB_TOKEN: '',
    SENHA_MESTRA: 'mestra-de-bancada',
  };
}

/** O motor a medir: o deste worktree, ou o de outro commit (o controle negativo). */
function motorEm(sha) {
  if (!sha) return RAIZ;
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'estudio-' + sha.slice(0, 7) + '-'));
  /* AS FONTES DE DADOS VÃO JUNTO, e não é zelo: o `motor/` sozinho não carrega — o perfil do
   * professor lê `biblioteca/modalidades/modalidades.json` ao ser requerido. Um controle que
   * morre no `require` não mede nada (e um `catch` à volta dele esconderia o motivo). */
  /* AS PASTAS DE QUE O `require` PRECISA, e a lista aprendeu-se a medir. O motor abre ficheiros ao
   * ser requerido — `biblioteca/modalidades/…` (o perfil do professor), `modelo/ciclos/…` (os
   * schemas), `porta/conteudo/…` (as sementes do corpo e do catálogo). Um controle que morresse
   * num `require` não mediria nada, e um `catch` à volta esconderia o motivo em vez de o dizer. */
  execSync('git archive ' + sha + ' motor tools biblioteca modelo porta | tar -x -C ' + destino,
    { cwd: RAIZ });
  return destino;
}

const pedido = (caminho) => new Request('https://' + ESCOLA + '.exemplo' + caminho);

(async () => {
  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  const base = motorEm(contra);
  const bastidores = require(path.join(base, 'motor/servidor/bastidores.js'));
  const env = ambiente();
  /* `null` QUER DIZER «NÃO É DESTA ROTA» — e é o que o controle negativo devolve para os
   * endereços que só passaram a existir hoje (`/bastidores/estudio/financeiro` não existia como
   * rota dos Bastidores na base). Transformar isso em `status: 0` faz o controle FALHAR, que é o
   * que se quer; deixá-lo explodir num TypeError mediria a bancada, não o motor. */
  const resposta = async (caminho) => {
    const r = await bastidores.fetch(pedido(caminho), env, {});
    if (!r) return { status: 0, local: null, html: '' };
    return { status: r.status, local: r.headers.get('Location'), html: await r.text() };
  };

  /* ────────────────────────────────────────────────────────────────────────────── A. O ENDEREÇO */
  console.log('\nA. Um endereço só, e os antigos levam lá');
  const estudio = await resposta('/bastidores/estudio');
  provar('/bastidores/estudio responde 200', estudio.status === 200, estudio.status);
  provar('…e a página diz «Estúdio» no título do documento',
    /<title>[^<]*Estúdio[^<]*<\/title>/.test(estudio.html),
    (/<title>([^<]*)<\/title>/.exec(estudio.html) || [])[1]);

  const raiz = await resposta('/bastidores');
  provar('/bastidores é um 302', raiz.status === 302, raiz.status);
  provar('…e leva ao estúdio', raiz.local === '/bastidores/estudio', raiz.local);

  const antigo = await resposta('/bastidores/producao');
  provar('/bastidores/producao é um 302 — o favorito antigo não dá 404', antigo.status === 302, antigo.status);
  provar('…e leva ao estúdio, com a query', antigo.local === '/bastidores/estudio', antigo.local);

  const antigoComQuery = await resposta('/bastidores/producao?abrir=pagar#a-escola');
  provar('…e a query atravessa o redireccionamento', antigoComQuery.local === '/bastidores/estudio?abrir=pagar',
    antigoComQuery.local);

  const mesNovo = await resposta('/bastidores/estudio/financeiro');
  provar('/bastidores/estudio/financeiro responde 200 (o mês a mês mudou com a página)',
    mesNovo.status === 200, mesNovo.status);
  for (const velho of ['/bastidores/producao/financeiro', '/bastidores/financeiro']) {
    const r = await resposta(velho);
    provar(velho + ' é um 302 para o endereço novo',
      r.status === 302 && r.local === '/bastidores/estudio/financeiro', [r.status, r.local]);
  }

  /* ────────────────────────────────────────────────────────────────────────── B. AS SECÇÕES */
  console.log('\nB. As secções todas continuam dentro dele');
  const gruposEsperados = ['Produção', 'Configuração', 'Pessoas', 'Pedagogia'];
  for (const grupo of gruposEsperados) {
    provar('o grupo «' + grupo + '» continua na coluna',
      estudio.html.indexOf('>' + grupo + '<') !== -1 || estudio.html.indexOf(grupo) !== -1, null);
  }
  for (const secao of ['Painel inicial', 'Aparência', 'A escola', 'Professores', 'Alunas',
    'Salas', 'Audição', 'Dicionário', 'Estilo', 'Turmas']) {
    provar('…e a secção «' + secao + '» também',
      new RegExp('>' + secao + '<').test(estudio.html), null);
  }

  /* ──────────────────────────────────────────────────────────────────────────── C. ONDE SE ESTÁ */
  console.log('\nC. A página diz onde se está');
  provar('o <h1> é «Estúdio»', /<h1[^>]*>Estúdio<\/h1>/.test(estudio.html),
    (/<h1[^>]*>([^<]*)<\/h1>/.exec(estudio.html) || [])[1]);
  provar('o grupo «Produção» da coluna fica — é o BLOCO que continua dentro do estúdio',
    /grupoDoMenu\('Produção'|>Produção</.test(estudio.html), null);

  /* ───────────────────────────────────────────────────────────────────────────────── D. O MENU */
  console.log('\nD. O menu tem um destino, e chama-se Estúdio');
  const menu = (/<summary>Bastidores<\/summary>[\s\S]*?<\/details>/.exec(estudio.html) || [''])[0];
  provar('o grupo «Bastidores» do menu existe', menu.length > 0, null);
  const itens = [...menu.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .map((m) => ({ href: m[1], rotulo: m[2].trim() }));
  provar('…e tem UM item', itens.length === 1, itens);
  provar('…que se chama «Estúdio»', itens[0] && itens[0].rotulo === 'Estúdio', itens[0]);
  provar('…e leva a /bastidores/estudio', itens[0] && itens[0].href === '/bastidores/estudio', itens[0]);
  provar('«Estúdio de Dança» já não existe em página nenhuma servida',
    !/Estúdio de Dança/.test(estudio.html), (/[^>]{0,40}Estúdio de Dança[^<]{0,40}/.exec(estudio.html) || [])[0]);
  provar('…e o item está ACESO na página do estúdio',
    /<a class="ativo" href="\/bastidores\/estudio">Estúdio<\/a>/.test(estudio.html),
    (/<a[^>]*href="\/bastidores\/estudio"[^>]*>/.exec(estudio.html) || [])[0]);

  /* O MESMO MENU NA PÁGINA DO MÊS A MÊS — a barra é a mesma, e o destino também. */
  provar('o mês a mês traz o mesmo menu de um item',
    (() => {
      const m = (/<summary>Bastidores<\/summary>[\s\S]*?<\/details>/.exec(mesNovo.html) || [''])[0];
      return m.length > 0 && (m.match(/<a/g) || []).length === 1;
    })(), null);

  if (base !== RAIZ) {
    fs.rmSync(base, { recursive: true, force: true });
    console.log('\n(' + contra + ' extraído e apagado)');
  }

  console.log('');
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: Bastidores tem um destino só, chama-se Estúdio, '
    + 'os endereços antigos levam lá com a query, as secções continuam todas dentro, e o grupo '
    + '«Produção» fica como o bloco que ele é.');
})();
