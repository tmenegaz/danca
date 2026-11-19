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

console.log('\n' + (falhas
  ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
  : 'TUDO CERTO — ' + provas + ' asserções: o Dicionário é irmão das outras secções e guarda o '
    + 'exercício (nome, categoria, tradição, complexidade, definição); o Estilo escolhe dele e '
    + 'ficou com cinco passos; a complexidade é opcional e não se escreve em cima do dono; e '
    + '«Carregar verbetes» adopta a progressão de referência, sem duplicar.'));
process.exit(falhas ? 1 : 0);
}

main().catch((erro) => {
  console.error('erro na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
