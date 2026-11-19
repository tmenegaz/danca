'use strict';

/**
 * provar-dicionario.js — O EXERCÍCIO NASCE NO DICIONÁRIO, E O ESTILO ESCOLHE DELE (19/11/2026).
 *
 * O PEDIDO, nas palavras dela:
 *
 *   «A gente vai criar, irmão das salas, audição, estilo e turmas, o dicionário. E aí esse
 *    formulário, exercício que a gente declara, a categoria que a gente declara, a tradição que a
 *    gente declara e o que acontece, que é a definição do exercício, e o botão carregar as turmas
 *    iniciais, que agora não vai se chamar mais carregar turmas iniciais, ele vai se chamar
 *    carregar verbetes, vai mudar para esse novo espaço que é dicionário. […] vai ter também
 *    complexidade. […] Agora o step um do estilo passa a ser o exercício. […] A gente vai chamar
 *    apenas de o exercício.»
 *
 * O QUE ESTA PROVA MEDE — e cada alínea reprova sem a correcção:
 *
 *   A. A SECÇÃO. O Dicionário é irmão das outras quatro: item no menu, `<section>` própria, título
 *      com acordeão, e a listagem fora do formulário (a regra de identidade da Audição).
 *   B. O FORMULÁRIO. Os cinco campos — exercício, categoria, tradição, complexidade, o que
 *      acontece —, as listas vindas do DADO (não escritas à mão), e a acção a gravar dentro de
 *      `.par-botoes`, com o «Cancelar» ao lado.
 *   C. A LISTAGEM. Três nichos — categoria, tradição, complexidade —, montados com a peça da casa
 *      (`.trio-item`/`.trio-painel`), e um cartão por verbete do vocabulário.
 *   D. O ESTILO. Cinco passos (era seis), o 1.º chamado «O exercício», com a ESCOLHA visível e o
 *      CADASTRO fora da vista — mas ainda no DOM, porque é dele que o motor lê a frase dos trechos.
 *   E. O DADO. A `complexidade` é aceite e validada pelo `validarTermo`, é opcional (os verbetes
 *      antigos ficam «—», e não em erro), e a edição do termo NÃO rouba o dono nem os campos que o
 *      formulário não pergunta.
 *   F. «CARREGAR VERBETES». A rota adopta os exercícios da progressão de referência, é idempotente,
 *      e não copia o catálogo inteiro.
 *   G. A PONTE DO CATÁLOGO. O que o ficheiro do vocabulário diz chega INTEIRO à tela — campo a
 *      campo, e não por uma lista de nomes escrita à mão. Sem esta secção, um campo novo do
 *      vocabulário (a `complexidade`, a 19/11/2026) fica no ficheiro e a tela mostra-o vazio: a
 *      gravação é aceite, o commit é feito, e o sintoma lê-se como «não grava».
 *   I. A EDIÇÃO GRAVA NO TERMO CERTO — o da escola, e não o do catálogo. Com duas cópias do mesmo
 *      `id` no ficheiro, procurar só pelo `id` editava a do catálogo: a escola não via a sua
 *      mudança («mudei a complexidade para complexo e não gravou») e as outras mudavam sem ninguém
 *      pedir. E o `membro`: a régua exigia-o sempre, mas nenhuma tela o pergunta desde 02/11/2026 —
 *      a exigência só bloqueava a edição.
 *   H. O DICIONÁRIO É DE CADA ESCOLA, E O FILTRO É AUTOMÁTICO. O termo de `breu` não aparece em
 *      `viva`, e o de `batata` não aparece em `breu` — e quem o decide é o `ESCOLA_SLUG` do Worker
 *      que serve a página, sem nenhum campo de escolha na tela. Sem esta secção, o dono está
 *      escrito no ficheiro e ignorado na leitura: o vocabulário de uma escola aparece em todas.
 *
 *   node experimentos/provar-dicionario.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const termoRepo = require(path.join(raiz, 'motor/servidor/termo-repo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** A página da Produção, com o mínimo que ela exige (a assinatura é posicional). */
function aPagina() {
  return bastidores.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Ana Diag', slug: 'ana-diag', rubrica: { nome: 'Padrão', niveis: ['Ótimo', 'Bom'] } }],
    ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

/* ============================================================================================= */
console.log('\nA. O Dicionário é uma secção, e é irmão das outras quatro');

{
  const html = aPagina();
  provar('o menu «Pedagogia» tem o item «Dicionário»',
    /href="#dicionario"[^>]*data-secao="dicionario"[^>]*>[\s\S]{0,80}?Dicionário/.test(html)
      || /data-secao="dicionario"[\s\S]{0,120}?Dicionário/.test(html));
  provar('…e ele fica entre a Audição e o Estilo — a ordem do trabalho',
    html.indexOf('data-secao="dicionario"') > html.indexOf('data-secao="corpo"')
      && html.indexOf('data-secao="dicionario"') < html.indexOf('data-secao="verbetes"'));
  provar('existe a <section> com o id do apelido', /<section class="secao" id="sec-dicionario"/.test(html));
  provar('o título dela tem o acordeão, como as irmãs',
    /id="sec-dicionario"[\s\S]{0,900}?class="alternar-form"/.test(html));
  /* A REGRA DA AUDIÇÃO: a listagem de uma secção fica FORA dos painéis, para não piscar a cada
   * troca de assunto. Aqui o painel é um só, mas a regra é a mesma — e é ela que permite a lista
   * continuar à vista enquanto se abre e fecha o formulário. */
  provar('a listagem é uma coluna, e não um painel',
    /id="dicionario-miolo"[\s\S]*?<\/div>\s*<div class="col-lista"[^>]*>\s*<h3>Dicionário<\/h3>/.test(html));
}

/* ============================================================================================= */
console.log('\nB. O formulário: os cinco campos e as listas que vêm do dado');

{
  const html = aPagina();
  const secao = html.slice(html.indexOf('id="sec-dicionario"'), html.indexOf('id="sec-verbetes"'));
  for (const [id, rotulo] of [
    ['dicnome', 'Exercício'],
    ['diccategoria', 'Categoria'],
    ['dictradicao', 'Tradição de referência'],
    ['diccomplexidade', 'Complexidade'],
    ['dicfrase', 'O que acontece'],
  ]) {
    provar('o campo «' + rotulo + '» existe', new RegExp('id="' + id + '"').test(secao));
  }
  provar('a categoria começa vazia — uma pergunta, e não uma resposta de fábrica',
    /<select id="diccategoria">\s*<option value="">/.test(secao));
  provar('a tradição começa vazia', /<select id="dictradicao">\s*<option value="">/.test(secao));
  provar('a complexidade oferece as duas opções do dado',
    /<select id="diccomplexidade">[\s\S]*?value="simples"[\s\S]*?value="complexo"/.test(secao));
  provar('…e o vazio dela diz «ainda não classificado»',
    /<select id="diccomplexidade">\s*<option value="">— ainda não classificado —/.test(secao));
  provar('a acção que grava está na fileira, com o «Cancelar» ao lado',
    /<span class="par-botoes">[\s\S]{0,400}?id="dic-gravar"[\s\S]{0,400}?id="dic-cancelar"/.test(secao));
  provar('o botão diz o gesto pedido: «Criar dicionário»',
    /id="dic-gravar"[^>]*>Criar dicionário</.test(secao));
  provar('o botão da carga diz «Carregar verbetes», e não «turmas iniciais»',
    /id="dic-semear"[^>]*>Carregar verbetes</.test(secao) && !/turmas iniciais/i.test(secao));
}

/* ============================================================================================= */
console.log('\nC. A listagem: os três nichos, com a peça da casa');

{
  /* A lista é MONTADA NO CLIENTE (ela é longa e o servidor não tem os termos aqui), por isso o que
   * esta secção mede é o desenho que a função emite — a peça `.trio-item`/`.trio-painel`, com as
   * três caixas que ela pediu. O contrato é o mesmo do cartão da sala, de propósito: é a mesma
   * leitura de relance, e a folha já a desenha. */
  const html = aPagina();
  const script = html.split('<script>')[1].split('</script>')[0];
  provar('a listagem tem as três caixas: categoria, tradição e complexidade',
    /caixaDoDicionario\("categoria"/.test(script)
      && /caixaDoDicionario\("tradicao"/.test(script)
      && /caixaDoDicionario\("complexidade"/.test(script));
  provar('…e cada caixa tem o seu painel, que é a peça do nicho',
    /painelDoDicionario\("categoria"/.test(script)
      && /painelDoDicionario\("tradicao"/.test(script)
      && /painelDoDicionario\("complexidade"/.test(script));
  provar('o cartão usa as classes da folha, e não um desenho novo',
    /"<li class=\\"trio-plano\\"/.test(script) || /li class="trio-plano"/.test(script));
  provar('a lista é carregada da rota do vocabulário',
    /fetch\("\/api\/bastidores\/termos"\)/.test(script));
  /* A COMPLEXIDADE VAZIA DIZ-SE. «—» é o estado dos 98 verbetes anteriores ao campo, e mostrar um
   * espaço branco faria ler «falhou» onde está «ainda não classificado». */
  provar('a complexidade em branco diz «—», e não um vazio',
    /t\.complexidade \|\| "—"/.test(script));

  /* ── O CARTÃO SEGUE O DA AUDIÇÃO (19/11/2026) ─────────────────────────────────────────────
   *
   * A CORRECÇÃO. «A listagem do dicionário não está seguindo o padrão, porque categoria,
   * tradição e complexidade não ficam na mesma linha, ficam abaixo. […] Em audição […] os nichos
   * estão abaixo da descrição […] e no dicionário elas estão ao lado do botão editar e excluir.»
   *
   * A CAUSA ERA O CONTENTOR: `ul.lista` tem `li{display:flex}`, e um cartão (`li.trio-plano`,
   * `display:block`) dentro dela sai deitado. O que se mede é o que a correcção mudou: o
   * contentor, a ORDEM (nome → descrição → nichos) e a peça dos gestos. */
  const secaoDicionario = html.slice(html.indexOf('id="sec-dicionario"'), html.indexOf('id="sec-verbetes"'));
  provar('a lista é um `.trio-lista`, e não um `.lista` (a fita flex)',
    /<ul class="trio-lista" id="lista-dicionario">/.test(secaoDicionario)
      && !/<ul class="lista" id="lista-dicionario">/.test(secaoDicionario));
  provar('os gestos vão na peça da linha do cartão (`.trio-acoes`)',
    /class=\\"trio-acoes\\"/.test(script) || /trio-acoes/.test(script));
  /* A ORDEM É A DO CARTÃO DA AUDIÇÃO: a linha do nome, a descrição, e os nichos NO FIM. */
  const corpoDoCartao = script.slice(script.indexOf('function linhaDoDicionario'), script.indexOf('function carregarDicionario'));
  const posNome = corpoDoCartao.indexOf('trio-linha');
  const posFrase = corpoDoCartao.indexOf('trio-frase');
  const posTrio = corpoDoCartao.indexOf('"<div class=\\"trio\\">"');
  provar('…e a descrição vem DEPOIS do nome e ANTES dos nichos',
    posNome !== -1 && posFrase > posNome && posTrio > posFrase, { posNome, posFrase, posTrio });
  provar('a paginação é a da casa: `.paginas` dentro do `[data-paginar]`',
    /<div class="col-lista" data-paginar data-por-pagina="7">/.test(secaoDicionario)
      && /class="paginas"/.test(secaoDicionario));
  provar('…e o cliente a chama depois de encher a lista',
    /if \(typeof paginar === "function"\) paginar\(\);/.test(script));
}

/* ============================================================================================= */
console.log('\nD. O Estilo: cinco passos, e o 1.º é a escolha');

{
  const html = aPagina();
  const secao = html.slice(html.indexOf('id="sec-verbetes"'), html.indexOf('id="sec-curadorias"'));
  const rotulos = [...secao.matchAll(/<li><button type="button" class="passo" data-passo="(\d)">[\s\S]*?class="passo-t">([^<]*)<\/span>/g)]
    .map((m) => [m[1], m[2].trim()]);
  provar('a tira tem cinco passos', rotulos.length === 5, rotulos);
  provar('…e o primeiro chama-se «O exercício»', rotulos[0] && rotulos[0][1] === 'O exercício', rotulos[0]);
  provar('…e não há segundo passo a falar do exercício',
    !rotulos.some((r) => /exerc[ií]cio/i.test(r[1]) && r[0] !== '1'), rotulos);
  provar('os cinco painéis são 1..5, sem buraco',
    JSON.stringify([...secao.matchAll(/class="passo-painel" data-passo="(\d)"/g)].map((m) => m[1]))
      === '["1","2","3","4","5"]');

  /* O QUE O PASSO 1 MOSTRA É A ESCOLHA; o cadastro está no DOM e fora da vista. As duas metades
   * importam: sem a primeira, o formulário continua a ser dois cadastros; sem a segunda, o motor
   * fica sem a frase com que os trechos nascem e o `#vbnome` perde o par que o sincroniza. */
  /* A ÂNCORA É `class="passo-painel"` e não `data-passo="1"`: a TIRA também tem botões com esse
   * atributo, e o `indexOf` apanhava o primeiro dos da tira — a fatia saía entre dois botões e não
   * media o painel. É a armadilha de sempre: o atributo não diz de que peça é. */
  const painel1 = secao.slice(secao.indexOf('class="passo-painel" data-passo="1"'),
    secao.indexOf('class="passo-painel" data-passo="2"'));
  provar('o passo 1 tem a escolha do exercício', /<select id="vbnome">/.test(painel1));
  provar('…e o método, que é do exercício e não da música', /<select id="vbmetodo">/.test(painel1));
  const oculto = painel1.slice(painel1.indexOf('id="vb-cadastro-do-exercicio"'));
  provar('o cadastro do exercício está no DOM, dentro de um bloco oculto',
    /<div hidden id="vb-cadastro-do-exercicio">/.test(painel1) && oculto.length > 0);
  for (const id of ['vnnome', 'vncategoria', 'vntradicao', 'vb-frase']) {
    provar('…e o campo #' + id + ' continua lá, porque o motor o lê',
      new RegExp('id="' + id + '"').test(oculto));
  }
  provar('o botão das turmas iniciais saiu do Estilo', !/id="semear"/.test(secao));
  provar('…e o ouvinte dele também — um `null.addEventListener` mataria a página',
    !/getElementById\("semear"\)\.addEventListener/.test(html.split('<script>')[1].split('</script>')[0]));
}

async function main() {
/* ============================================================================================= */
console.log('\nE. O dado: a complexidade é aceite, opcional, e a edição não rouba o dono');

{
  const base = { termo: 'Cabriole', categoria: 'salto', tradicao: 'francesa', descricao: 'um salto' };
  const com = termoRepo.validarTermo(Object.assign({}, base, { complexidade: 'complexo' }), null);
  provar('«complexo» é aceite', com.ok && com.termo.complexidade === 'complexo', com);
  const sem = termoRepo.validarTermo(base, null);
  provar('sem complexidade é válido — é o estado dos 98 verbetes anteriores',
    sem.ok && sem.termo.complexidade === undefined, sem);
  const ma = termoRepo.validarTermo(Object.assign({}, base, { complexidade: 'dificil' }), null);
  provar('um valor inventado é recusado, e a recusa diz a lista',
    ma.ok === false && ma.erros.some((e) => /complexidade/.test(e)), ma.erros);

  /* A LISTA É UMA SÓ. Duas listas do mesmo vocabulário divergem ao primeiro item novo — e é
   * sempre a do validador que manda, porque é ela que recusa. */
  provar('a lista da tela é a mesma do validador',
    JSON.stringify(termoRepo.COMPLEXIDADES) === JSON.stringify(['simples', 'complexo']));
}

{
  /* A EDIÇÃO, com o repositório fingido: um vocabulário com dois termos, um do catálogo e um da
   * escola. O que se mede é o que ela NÃO pode perder. */
  const vocabulario = [
    { id: 'plie', termo: 'Plié', categoria: 'passo', tradicao: 'compartilhada',
      descricao: 'flexão', fonte: 'Dicionário v1', observacoes: 'nota antiga', estado: 'documentado' },
    { id: 'tendu', termo: 'Tendu', categoria: 'passo', tradicao: 'francesa', escola: 'breu' },
  ];
  let escrito = null;
  const f = async (url, opcoes) => {
    if (!opcoes || opcoes.method === 'GET' || !opcoes.method) {
      return { status: 200, json: async () => ({
        sha: 'abc', content: Buffer.from(JSON.stringify(vocabulario), 'utf8').toString('base64'),
      }) };
    }
    escrito = JSON.parse(opcoes.body || '{}');
    return { status: 200, json: async () => ({ commit: { sha: 'def' } }) };
  };

  const r = await termoRepo.editarTermo({
    f, token: 'x', dono: 'd', repo: 'r', ref: 'main', idAntigo: 'plie',
    corpo: { termo: 'Plié', categoria: 'passo', tradicao: 'francesa',
      complexidade: 'simples', descricao: 'flexão contínua' },
    tradicoes: ['compartilhada', 'francesa'],
  });
  provar('a edição grava', r.ok === true, r.erro || r.status);
  const gravado = JSON.parse(Buffer.from(escrito.content, 'base64').toString('utf8'));
  const plie = gravado.find((t) => t.id === 'plie');
  provar('…com a complexidade nova', plie.complexidade === 'simples', plie.complexidade);
  provar('…com a definição corrigida', plie.descricao === 'flexão contínua', plie.descricao);
  provar('…e o dono NÃO é roubado: o do catálogo continua do catálogo',
    String(plie.escola || '') === '', plie.escola);
  provar('…e o termo da escola continua dela',
    String(gravado.find((t) => t.id === 'tendu').escola) === 'breu');
  provar('…e o que o formulário não pergunta não se apaga',
    plie.fonte === 'Dicionário v1' && plie.observacoes === 'nota antiga', [plie.fonte, plie.observacoes]);
}

/* ============================================================================================= */
console.log('\nF. «Carregar verbetes» adopta a progressão, e não o catálogo inteiro');

{
  /* A ROTA, montada com o repositório fingido. O que se mede: quais entram, e que correr duas vezes
   * não duplica. A lista é a da progressão de referência (`progressao.json` → `relacoes`), e não as
   * 98 entradas do vocabulário — adoptar tudo sombrearia o catálogo para sempre. */
  const progressao = require(path.join(raiz, 'biblioteca/modalidades/bale-classico/progressao.json'));
  const idsDaProgressao = [...new Set((progressao.relacoes || []).map((r) => r.termo))];

  const catalogo = idsDaProgressao.map((id) => ({
    id, termo: id, categoria: 'passo', tradicao: 'compartilhada', descricao: 'd',
  }));
  catalogo.push({ id: 'fora-da-progressao', termo: 'Fora', categoria: 'passo', tradicao: 'compartilhada' });

  let guardado = catalogo.slice();
  const f = async (url, opcoes) => {
    if (!opcoes || !opcoes.method || opcoes.method === 'GET') {
      return { status: 200, json: async () => ({
        sha: 'abc', content: Buffer.from(JSON.stringify(guardado), 'utf8').toString('base64'),
      }) };
    }
    const corpo = JSON.parse(opcoes.body || '{}');
    guardado = JSON.parse(Buffer.from(corpo.content, 'base64').toString('utf8'));
    return { status: 200, json: async () => ({ commit: { sha: 'def' } }) };
  };

  // O ambiente do Worker, com a tabela de rotas montada à mão: `bastidores.fetch` exige um pedido
  // e um env, e é assim que as outras provas exercitam as rotas reais.
  async function chamar(env) {
    const pedido = new Request('https://escola.tmenegaz77.workers.dev/api/bastidores/semear-verbetes',
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaDirecao: (env && env.SENHA_ADMIN) || 's' }) });
    const resposta = await bastidores.fetch(pedido, env);
    return resposta && resposta.json ? resposta.json() : resposta;
  }

  const mem = new Map();
  const env = {
    ESCOLA_SLUG: 'breu', SENHA_ADMIN: 's', GITHUB_TOKEN: 'x',
    PADD_KV: {
      async get(k) { return mem.has(k) ? mem.get(k) : null; },
      async put(k, v) { mem.set(k, String(v)); },
      async delete(k) { mem.delete(k); },
      async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
    },
  };
  const original = globalThis.fetch;
  globalThis.fetch = f;
  let primeira, segunda, tamanhoDepoisDaPrimeira = 0;
  try {
    primeira = await chamar(env);
    tamanhoDepoisDaPrimeira = guardado.length;
    segunda = await chamar(env);
  } finally {
    globalThis.fetch = original;
  }

  provar('a carga responde ok', primeira && primeira.ok === true, primeira);
  provar('ela adopta os exercícios da progressão de referência',
    primeira && primeira.acrescentados && primeira.acrescentados.length === idsDaProgressao.length,
    primeira && { esperado: idsDaProgressao.length, veio: primeira && primeira.acrescentados && primeira.acrescentados.length });
  provar('…e NÃO adopta o catálogo inteiro — o que está fora da progressão fica de fora',
    primeira && primeira.acrescentados && primeira.acrescentados.indexOf('fora-da-progressao') === -1);
  provar('os adoptados passam a ser DESTA escola',
    guardado.filter((t) => String(t.escola || '') === 'breu').length === idsDaProgressao.length,
    guardado.filter((t) => String(t.escola || '') === 'breu').length);
  provar('correr outra vez não duplica — e di-lo',
    segunda && segunda.ok === true && segunda.acrescentados.length === 0
      && segunda.jaExistiam.length === idsDaProgressao.length, segunda);
  /* O FICHEIRO GUARDA AS DUAS — a cópia do catálogo e a da escola, com o mesmo `id` e donos
   * diferentes: é assim que `compor` sabe qual vence, e é o que permite à escola corrigir a sua sem
   * tocar no catálogo. O que não pode acontecer é a segunda passagem ACRESCENTAR outra vez. */
  provar('…e o ficheiro não cresceu com a segunda passagem',
    guardado.length === tamanhoDepoisDaPrimeira && tamanhoDepoisDaPrimeira > catalogo.length,
    { depoisDaPrimeira: tamanhoDepoisDaPrimeira, agora: guardado.length, catalogo: catalogo.length });
}

/* ============================================================================================= */
console.log('\nG. O que o vocabulário diz chega inteiro à tela');

{
  /* A PONTE É `catalogo-seed.js` → `termos()` → `/api/bastidores/termos`, e a prova atravessa-a
   * toda: compara o FICHEIRO com o que a ROTA devolve. É a única comparação que apanha o defeito,
   * porque o defeito é precisamente uma perda no meio do caminho. */
  const vocabulario = require(path.join(raiz, 'biblioteca/modalidades/bale-classico/vocabulario.json'));
  const mem = new Map();
  /* A ESCOLA É A `viva`, E NÃO A `breu` (19/11/2026) — e é a correcção de uma asserção minha, não
   * do produto. Esta secção compara o FICHEIRO com o que a tela recebe, campo a campo; com o filtro
   * por escola ligado, a `breu` recebe a versão DELA do «Plié» (é a regra: a escola vence o
   * catálogo), e a comparação acusava uma perda que não existe. A `viva` não tem termo próprio
   * nenhum, e por isso o que ela recebe é o catálogo — que é o que esta secção quer medir. O termo
   * da escola mede-se na secção H, pela pergunta que lhe compete. */
  const env = {
    ESCOLA_SLUG: 'viva', SENHA_ADMIN: 's', GITHUB_TOKEN: 'x',
    PADD_KV: {
      async get(k) { return mem.has(k) ? mem.get(k) : null; },
      async put(k, v) { mem.set(k, String(v)); },
      async delete(k) { mem.delete(k); },
      async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
    },
  };
  const resposta = await bastidores.fetch(
    new Request('https://escola.tmenegaz77.workers.dev/api/bastidores/termos'), env);
  const corpo = resposta && resposta.json ? await resposta.json() : {};
  const servidos = (corpo && corpo.termos) || [];
  const porId = new Map(servidos.map((t) => [String(t.id), t]));

  provar('a rota responde com os termos', servidos.length > 0, servidos.length);

  /* A COMPARAÇÃO É CAMPO A CAMPO, e o campo que interessa é o que a tela mostra. `escola` fica de
   * fora por decisão declarada (ver `catalogo-seed.js` e a pendência no ESTADO-ATUAL). */
  const perderam = [];
  for (const t of vocabulario) {
    const dono = String(t.escola || '').trim();
    if (dono) continue; // o termo de uma escola não atravessa a composição de outra
    const veio = porId.get(String(t.id));
    if (!veio) { perderam.push(t.id + ' (não veio)'); continue; }
    for (const chave of Object.keys(t)) {
      if (chave === 'escola') continue;
      const antes = JSON.stringify(t[chave]);
      const depois = JSON.stringify(veio[chave]);
      if (antes !== depois) perderam.push(t.id + '.' + chave + ': ' + antes + ' → ' + depois);
    }
  }
  provar('todo o campo do ficheiro chega ao que a tela recebe — nenhum se perde na ponte',
    perderam.length === 0, perderam.slice(0, 6));

  const comComplexidade = servidos.filter((t) => String(t.complexidade || '').trim());
  provar('a COMPLEXIDADE chega à listagem, e não só ao ficheiro (o defeito de 19/11/2026)',
    comComplexidade.length === servidos.length,
    { servidos: servidos.length, comComplexidade: comComplexidade.length });
  const plie = porId.get('plie');
  provar('…e o plié, que ela classificou à mão, vem classificado',
    plie && plie.complexidade === 'simples', plie && plie.complexidade);
  provar('…com o rótulo da categoria e da tradição, que é o que os nichos leem',
    plie && plie.categoriaRotulo && plie.tradicaoRotulo !== undefined,
    plie && { categoriaRotulo: plie.categoriaRotulo, tradicaoRotulo: plie.tradicaoRotulo });
}

/* ============================================================================================= */
console.log('\nH. O dicionário é de cada escola, e o filtro é automático');

{
  /* AS TRÊS ESCOLAS QUE TÊM TERMO PRÓPRIO, e uma que não tem nenhum. A pergunta que ela fez —
   * «é automático isso com a escola que está em evidência fazendo o filtro ou precisa colocar lá em
   * dicionários um campo para escolher a escola?» — mede-se aqui, pela única coisa que a resposta
   * pode ser: o MESMO pedido, com `ESCOLA_SLUG` diferente, dá listas diferentes. */
  async function termosDaEscola(slug) {
    const mem = new Map();
    const env = {
      ESCOLA_SLUG: slug, SENHA_ADMIN: 's', GITHUB_TOKEN: 'x',
      PADD_KV: {
        async get(k) { return mem.has(k) ? mem.get(k) : null; },
        async put(k, v) { mem.set(k, String(v)); },
        async delete(k) { mem.delete(k); },
        async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
      },
    };
    const r = await bastidores.fetch(
      new Request('https://escola.tmenegaz77.workers.dev/api/bastidores/termos'), env);
    const d = r && r.json ? await r.json() : {};
    return (d && d.termos) || [];
  }

  const daBreu = await termosDaEscola('breu');
  const daViva = await termosDaEscola('viva');
  const daBatata = await termosDaEscola('batata');
  const ids = (lista) => new Set(lista.map((t) => String(t.id)));
  const deBreu = ids(daBreu);
  const deViva = ids(daViva);
  const deBatata = ids(daBatata);

  /* «TANDU» É DA BREU, e só dela. O `viva` não tem termo próprio nenhum: vê o catálogo. */
  provar('o termo próprio da breu está na breu', deBreu.has('tandu'), [...deBreu].length);
  provar('…e NÃO está na viva', !deViva.has('tandu'), [...deViva].size);
  provar('…nem na batata', !deBatata.has('tandu'), [...deBatata].size);
  /* O PEDIDO É O MESMO — `ESCOLA_SLUG` é a única diferença. É isto que responde «é automático?». */
  provar('o MESMO pedido dá listas diferentes: o filtro é a escola do Worker, e não um campo da tela',
    daBreu.length !== daViva.length, { breu: daBreu.length, viva: daViva.length });
  provar('…e nenhuma escola vê o termo da outra',
    !deBreu.has('fora') && !deViva.has('tandu') && !deBatata.has('tandu'), null);

  /* O TERMO DO CATÁLOGO CONTINUA EM TODAS — o filtro separa as ESCOLAS, e não esconde o catálogo. */
  provar('o termo do catálogo aparece em todas as escolas',
    deBreu.has('releve') && deViva.has('releve') && deBatata.has('releve'), null);
  /* E QUEM TEM VERSÃO PRÓPIA DO MESMO `id` VÊ A SUA — a composição é a mesma dos produtos. */
  const plieDaBreu = daBreu.find((t) => t.id === 'plie');
  const plieDaViva = daViva.find((t) => t.id === 'plie');
  provar('quem tem versão própria do mesmo termo vê a SUA (a escola vence o catálogo)',
    plieDaBreu && plieDaBreu.origem === 'escola' && plieDaViva && plieDaViva.origem === 'catalogo',
    { breu: plieDaBreu && plieDaBreu.origem, viva: plieDaViva && plieDaViva.origem });
}

/* ============================================================================================= */
console.log('\nI. A edição grava no termo certo — e o «membro» deixou de bloquear');

{
  /* AS ROTAS DE VERDADE, com o repositório fingido — é a única forma de medir o que se grava. O
   * defeito que ela viveu («grava e não persiste») tem duas metades que só se vêem juntas: o que a
   * rota responde (ok) e QUAL linha do ficheiro mudou. */
  const vocabulario = require(path.join(raiz, 'biblioteca/modalidades/bale-classico/vocabulario.json'));
  const guardado = JSON.parse(JSON.stringify(vocabulario));
  const estado = { termos: guardado };

  const f = async (url, opcoes) => {
    const doVocabulario = /\/contents\/biblioteca\/modalidades\/[^/]+\/vocabulario\.json/.test(String(url));
    if (!opcoes || !opcoes.method || opcoes.method === 'GET') {
      if (doVocabulario) {
        return { ok: true, status: 200, json: async () => ({
          sha: 'abc', content: Buffer.from(JSON.stringify(estado.termos), 'utf8').toString('base64'),
        }) };
      }
      /* AS OUTRAS LEITURAS DO ACERVO RESPONDEM «NÃO HÁ NADA», e não uma excepção. A guarda de
       * proveniência (`usosDosPlanos`) devolve `null` quando a leitura dos planos falha — e `null`
       * significa «não sei se está em uso», que ela traduz em «não apago». Um stub que atira ao
       * chão todas as leituras recursava TODOS os apagamentos, e a prova teria de os declarar
       * impossíveis em vez de medir o caminho. A árvore vazia é a resposta honesta desta bancada:
       * nesta escola de prova não há plano nenhum. */
      /* A ÁRVORE VEM COM `ok: true`, e não só com `status: 200` — o acervo confere `r.ok`, e um
       * objecto de prova sem ele é «não li a árvore» (falhou a medir isto antes de o perceber). */
      if (/git\/trees/.test(String(url))) {
        return { ok: true, status: 200, json: async () => ({ tree: [], truncated: false }) };
      }
      return { status: 404, json: async () => ({ message: 'Not Found' }), text: async () => '' };
    }
    if (!doVocabulario) {
      /* AS OUTRAS ESCRITAS SÃO DO ACERVO (o índice dos envelopes), e o seu conteúdo não é o
       * vocabulário. Tratá-las como vocabulário reescreveria o dicionário com um índice — a prova
       * passaria a medir o seu próprio estrago. */
      /* A RESPOSTA TEM DE PARECER A DO GITHUB: o acervo lê o `sha` do ficheiro que acabou de
       * escrever, e uma resposta sem ele faz a escrita do índice falhar — e, com ela, a listagem
       * dos planos, que é o que a guarda de proveniência consulta antes de deixar apagar. */
      return { status: 200, json: async () => ({ content: { sha: 'indice' }, commit: { sha: 'indice' } }) };
    }
    const corpo = JSON.parse(opcoes.body || '{}');
    estado.termos = JSON.parse(Buffer.from(corpo.content, 'base64').toString('utf8'));
    return { status: 200, json: async () => ({ commit: { sha: 'def' } }) };
  };

  const mem = new Map();
  const env = {
    ESCOLA_SLUG: 'breu', SENHA_ADMIN: 's', GITHUB_TOKEN: 'x',
    PADD_KV: {
      async get(k) { return mem.has(k) ? mem.get(k) : null; },
      async put(k, v) { mem.set(k, String(v)); },
      async delete(k) { mem.delete(k); },
      async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
    },
  };

  async function chamar(metodo, corpo, escola) {
    const e = escola ? Object.assign({}, env, { ESCOLA_SLUG: escola }) : env;
    const anterior = globalThis.fetch;
    globalThis.fetch = f;
    try {
      const resposta = await bastidores.fetch(new Request(
        'https://escola.tmenegaz77.workers.dev/api/bastidores/termo',
        { method: metodo, headers: { 'Content-Type': 'application/json' },
          /* `senhaDirecao` E NÃO `token`: quando o corpo traz um `token`, é ele que a guarda
           * confere — e um token de prova inválido responde 401 antes de a rota olhar para o
           * termo. A senha da direção é a que o formulário usa. */
          body: JSON.stringify(Object.assign({ senhaDirecao: env.SENHA_ADMIN }, corpo)) }), e);
      return resposta && resposta.json ? await resposta.json() : resposta;
    } finally { globalThis.fetch = anterior; }
  }

  /* A RÉGUA CONHECE AS CATEGORIAS QUE O DADO USA — e não conhecia: seis escritas à mão contra oito
   * no vocabulário. Medido a 19/11/2026: os cinco termos de `conceito`/`qualidade` não se podiam
   * editar, e o `<select>` da tela caía na primeira opção (gravar mudava a categoria em silêncio). */
  const categoriasDoDado = [...new Set(vocabulario.map((t) => String(t.categoria || '')))].sort();
  const categoriasDaRegua = [...termoRepo.CATEGORIAS].sort();
  provar('a régua conhece TODAS as categorias que o vocabulário usa',
    categoriasDoDado.every((c) => categoriasDaRegua.indexOf(c) !== -1),
    { doDado: categoriasDoDado, daRegua: categoriasDaRegua });

  const copiasDePlie = () => estado.termos.filter((t) => t && t.id === 'plie')
    .map((t) => ({ dono: String(t.escola || ''), complexidade: t.complexidade, categoria: t.categoria }));

  /* ── O CASO DELA, EXACTO: só a complexidade, de «simples» para «complexo». ─────────────── */
  const antes = copiasDePlie();
  const r1 = await chamar('PUT', {
    id: 'plie', nome: 'Plié', categoria: 'passo', tradicao: 'compartilhada',
    complexidade: 'complexo', descricao: 'flexão contínua',
  });
  provar('editar só a complexidade é aceite', r1 && r1.ok === true, r1);
  const depois = copiasDePlie();
  provar('…e grava na cópia DA ESCOLA, que é a que a tela mostra',
    depois.some((c) => c.dono === 'breu' && c.complexidade === 'complexo'), depois);
  provar('…e NÃO reescreve a do catálogo, que é de todas as escolas',
    depois.some((c) => c.dono === '' && c.complexidade === antes.find((a) => a.dono === '').complexidade),
    depois);
  provar('…e não acrescenta uma terceira cópia do mesmo termo',
    depois.length === antes.length, { antes: antes.length, depois: depois.length });

  /* ── O «MEMBRO»: a herança que bloqueava, e o que continua a ser recusado. ─────────────── */
  const r2 = await chamar('PUT', {
    id: 'plie', nome: 'Plié', categoria: 'posicao', tradicao: 'francesa',
    complexidade: 'complexo', descricao: 'flexão contínua',
  });
  provar('mudar a categoria para «posição» sem dizer o membro é aceite — a régua exigia um campo '
    + 'que nenhuma tela pergunta desde 02/11/2026', r2 && r2.ok === true, r2);
  const plieDaBreu = estado.termos.find((t) => t && t.id === 'plie' && String(t.escola || '') === 'breu');
  provar('…e a categoria e a tradição gravam-se',
    plieDaBreu && plieDaBreu.categoria === 'posicao' && plieDaBreu.tradicao === 'francesa',
    plieDaBreu && { categoria: plieDaBreu.categoria, tradicao: plieDaBreu.tradicao });
  const r3 = await chamar('PUT', {
    id: 'retire', nome: 'Retiré', categoria: 'posicao', tradicao: 'compartilhada',
    membro: 'rabo', descricao: 'd',
  });
  provar('…mas um MEMBRO INVENTADO continua a ser recusado', r3 && r3.ok === false
    && JSON.stringify(r3.erros || []).indexOf('rabo') !== -1, r3 && r3.erros);
  provar('…e nada é gravado quando a régua recusa',
    !estado.termos.some((t) => t && t.id === 'retire' && String(t.escola || '') === 'breu'), null);
  /* O MEMBRO QUE JÁ EXISTE NÃO SE PERDE. O «Retiré» do catálogo declara «pernas»; uma edição que
   * não traz o campo (é o caso desta tela, que o não pergunta) não pode apagá-lo. */
  const membroDoCatalogo = String((estado.termos.find((t) => t && t.id === 'retire'
    && !String(t.escola || '')) || {}).membro || '');
  const r3b = await chamar('PUT', {
    id: 'retire', nome: 'Retiré', categoria: 'posicao', tradicao: 'compartilhada', descricao: 'd',
  });
  const retireDaBreu = estado.termos.find((t) => t && t.id === 'retire' && String(t.escola || '') === 'breu');
  provar('…e o membro que o termo já tinha não se perde numa edição que não o traz',
    r3b && r3b.ok === true && retireDaBreu && retireDaBreu.membro === membroDoCatalogo,
    retireDaBreu && { membro: retireDaBreu.membro, esperado: membroDoCatalogo });

  /* ── A ESCOLA QUE AINDA NÃO TINHA CÓPIA GANHA A SUA, e o catálogo fica como estava. ───── */
  const antesDoFork = estado.termos.length;
  /* O TERMO DA PROVA É O «APLOMB», e não um qualquer: a guarda de proveniência recusa apagar o que
   * um plano, uma turma ou o ALFABETO referem — e «Plié», «Relevé», «Battement tendu/jeté/fondu»
   * estão nos quatro sítios ao mesmo tempo. O «Aplomb» não está em nenhum, e por isso o ciclo
   * completo (a escola ganha a sua versão → apaga-a → o catálogo volta) pode ser medido. */
  const doCatalogo = estado.termos.find((t) => t && t.id === 'aplomb' && !String(t.escola || ''));
  const r4 = await chamar('PUT', {
    id: 'aplomb', nome: 'Aplomb', categoria: 'conceito', tradicao: 'compartilhada',
    complexidade: 'complexo', descricao: 'nova definição',
  }, 'viva');
  provar('uma escola sem cópia própria edita — e ganha a dela', r4 && r4.ok === true, r4);
  provar('…o ficheiro ganha uma cópia, e não uma reescrita',
    estado.termos.length === antesDoFork + 1, { antes: antesDoFork, agora: estado.termos.length });
  provar('…e a versão do catálogo fica intacta para as outras escolas',
    String(estado.termos.find((t) => t && t.id === 'aplomb' && !String(t.escola || '')).descricao)
      === String(doCatalogo.descricao), null);
  provar('…e a nova é DELA',
    estado.termos.some((t) => t && t.id === 'aplomb' && String(t.escola || '') === 'viva'),
    estado.termos.filter((t) => t && t.id === 'aplomb').map((t) => String(t.escola || '')));

  /* ── O TERMO DE OUTRA ESCOLA NÃO SE EDITA DAQUI. ──────────────────────────────────────── */
  const r5 = await chamar('PUT', {
    id: 'tandu', nome: 'Tandu', categoria: 'passo', tradicao: 'compartilhada',
    complexidade: 'complexo', descricao: 'x',
  }, 'viva');
  provar('o termo de OUTRA escola não se edita — a resposta é 404, e não uma edição cruzada',
    r5 && r5.ok === false && r5.status === 404, r5 && { status: r5.status, erro: r5.erro });

  /* ── APAGAR: sai a cópia da escola, e a do catálogo volta a valer. ───────────────────────
   *
   * O CASO É O DA `breu` E É O QUE ELA VAI VIVER: a `breu` ganhou agora uma versão sua do «Relevé»
   * (a asserção do fork acima correu na `viva`; esta repete-a na `breu`), e apagá-la não pode
   * levar consigo a do catálogo — que é a de todas as outras escolas. */
  const r6a = await chamar('PUT', {
    id: 'aplomb', nome: 'Aplomb', categoria: 'conceito', tradicao: 'compartilhada',
    complexidade: 'complexo', descricao: 'versão da breu',
  });
  provar('a breu ganha a sua versão do «Aplomb»', r6a && r6a.ok === true
    && estado.termos.some((t) => t && t.id === 'aplomb' && String(t.escola || '') === 'breu'), r6a);
  const r6 = await chamar('DELETE', { id: 'aplomb' });
  provar('apagar o termo da escola é aceite', r6 && r6.ok === true, r6);
  provar('…e o catálogo continua lá — a tela passa a mostrar a versão dele',
    r6 && r6.voltouAoCatalogo === true
      && estado.termos.some((t) => t && t.id === 'aplomb' && !String(t.escola || '')), r6);
  provar('…e só a cópia da escola desapareceu',
    !estado.termos.some((t) => t && t.id === 'aplomb' && String(t.escola || '') === 'breu'),
    estado.termos.filter((t) => t && t.id === 'aplomb').map((t) => String(t.escola || '')));
  provar('…e a versão da outra escola (a `viva`) não foi tocada',
    estado.termos.some((t) => t && t.id === 'aplomb' && String(t.escola || '') === 'viva'), null);
}

console.log('\n' + (falhas
  ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
  : 'TUDO CERTO — ' + provas + ' asserções: o Dicionário é irmão das outras secções e guarda o '
    + 'exercício (nome, categoria, tradição, complexidade, definição); o Estilo escolhe dele e '
    + 'ficou com cinco passos; a complexidade é opcional e não se escreve em cima do dono; '
    + '«Carregar verbetes» adopta a progressão de referência, sem duplicar; e o que o vocabulário '
    + 'diz chega inteiro à tela — a ponte do catálogo não perde campo; e o dicionário é de cada '
    + 'escola, filtrado automaticamente pela escola do Worker; e a edição grava no termo dessa '
    + 'escola, não no do catálogo.'));
process.exit(falhas ? 1 : 0);
}

main().catch((erro) => {
  console.error('erro na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
