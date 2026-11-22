#!/usr/bin/env node
'use strict';

/*
 * provar-anamnese-antes-da-aluna.js — o recado e o caminho, quando a escola ainda não tem aluna.
 *
 * O DEFEITO QUE ISTO MEDE, ao vivo na `batata` (15/11/2026). Numa escola recém-criada, o passo 2
 * da Audição — «escolha do elenco» — dizia «falta a anamnese de pelo menos uma aluna» e mandava
 * fazer a anamnese. Mas não havia aluna nenhuma: a anamnese PEDE o sujeito, e o link levava ao
 * formulário com o professor e SEM a aluna — a porta devolvia a pessoa à lista em silêncio. O
 * formulário aparecia e fugia.
 *
 * AS TRÊS CORREÇÕES, e é isto que a prova fixa:
 *   1. o recado distingue «falta a aluna» de «falta a anamnese», e a ordem do que fazer;
 *   2. o link leva à LISTA da anamnese — onde se escolhe de quem é o retrato —, e não ao
 *      formulário sem sujeito;
 *   3. o servidor fecha o caminho do meio: contexto parcial e sem aluna devolve 302 à lista, em
 *      vez de servir um formulário que o browser ia abandonar.
 *
 * O CONTROLE NEGATIVO, e é o que impede a correcção de fechar o que deve ficar aberto: o contexto
 * VAZIO (`?fonte=anamnese`, o «Fazer anamnese» da lista) e os atalhos que trazem o contexto do
 * envelope (`editar`, `ajustar`, `novo`) NÃO podem ser desviados. Se fossem, a anamnese deixaria
 * de se poder criar, editar, ajustar e duplicar — e a correcção de um recado teria fechado a
 * porta.
 *
 * Corre fora do ar: monta a ponte com um ASSETS de mentira e pergunta-lhe o status e o destino.
 *
 *   node experimentos/provar-anamnese-antes-da-aluna.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

/** Um `env` de escola com tudo o que a ponte toca — e um ASSETS que responde a tudo. */
function envDeEscola() {
  const kv = {
    _dados: new Map(),
    async get(k) { return this._dados.has(k) ? this._dados.get(k) : null; },
    async put(k, v) { this._dados.set(k, v); },
    async delete(k) { this._dados.delete(k); },
    async list() { return { keys: [], list_complete: true }; },
  };
  /* A ESCOLA TEM UM PROFESSOR (senão a Área do Professor está fechada e mediríamos o freio) e
   * TEM ALUNAS CADASTRADAS — sem elas não se mede a distinção que esta prova existe para medir. */
  kv._dados.set('bastidores/batata/professores', JSON.stringify([{ nome: 'Coqui De Redinha', slug: 'coqui-de-redinha' }]));
  kv._dados.set('bastidores/batata/alunas', JSON.stringify(['Aluna A', 'Aluna B']));
  const assets = {
    async fetch(req) {
      /* O `ASSETS.fetch` DO RUNTIME ACEITA UM `URL` (e a ponte passa um). O de mentira tem de
       * aceitar os dois, senão mede-se um erro da bancada e não o do motor. */
      const u = req instanceof URL ? req : new URL(req.url);
      if (u.pathname === '/escola.json') {
        return new Response(JSON.stringify({ escola: 'batata' }), { headers: { 'Content-Type': 'application/json' } });
      }
      if (/\.html$/.test(u.pathname) || u.pathname === '/' || u.pathname.endsWith('/')) {
        return new Response('<!doctype html><title>porta</title>', { headers: { 'Content-Type': 'text/html' } });
      }
      return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
    },
  };
  return {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', PADD_KV: kv, ASSETS: assets,
    /* AS SENHAS SÃO DESCARTÁVEIS, e o `pre-push` é a razão (15/11/2026): o hook confere se o VALOR
     * de cada senha local aparece em arquivo versionado, e barrou o primeiro envio por causa
     * destas duas linhas. Nesta bancada a senha não é usada para nada — nenhum caso escreve —, e
     * um valor inventado mantém a regra verdadeira em vez de lhe abrir uma exceção. */
    SENHA_ADMIN: 'senha-de-bancada', SENHA_PROFESSOR: 'senha-de-bancada', PROFESSOR_NOME: 'Coqui De Redinha',
    PROFESSOR_SLUG: 'coqui-de-redinha', GITHUB_TOKEN: '',
  };
}

(async () => {
  const env = envDeEscola();

  /* ── A. O RECADO ──────────────────────────────────────────────────────────────────────────── */
  const pagina = await producao.fetch(
    new Request('https://batata.padd.com.br/bastidores/estudio'), env);
  const html = await pagina.text();

  provar('a Produção responde 200', pagina.status === 200, pagina.status);
  provar('o passo 2 sabe distinguir as duas faltas (usa `ALUNAS_REGISTRADAS`)',
    /ALUNAS_REGISTRADAS/.test(html), null);
  /* A ROTA, CHAMADA A SÉRIO — e não procurada no código-fonte.
   *
   * A PRIMEIRA VERSÃO DESTA PROVA FAZIA `grep` NO FICHEIRO e passou com a rota a responder
   * `ok:false` em TODAS as escolas: a contagem chamava `alunas(kv, escola)` dentro do escopo onde
   * `const alunas = …` sombreia a função, caía no `catch` e a rota dizia «não consegui ler o
   * acervo agora». Um `grep` não apanha um erro de escopo — um pedido apanha. É a diferença entre
   * medir o texto e medir o comportamento, e é a razão de esta asserção existir assim. */
  const rota = await producao.fetch(
    new Request('https://batata.padd.com.br/api/bastidores/alunas-com-anamnese'), env);
  const corpoRota = await rota.json();
  provar('a rota das alunas com anamnese responde `ok:true`', corpoRota.ok === true, corpoRota);
  provar('…e devolve quantas alunas estão CADASTRADAS (2, nesta bancada)',
    corpoRota.registradas === 2, corpoRota.registradas);
  provar('…sem inventar retratos: ninguém tem anamnese ainda',
    Array.isArray(corpoRota.alunas) && corpoRota.alunas.length === 0, corpoRota.alunas);
  /* A ROTA QUE NÃO CONSEGUE LER NÃO RESPONDE ZERO (17/11/2026).
   *
   * `registradas: 0` é um facto — «esta escola não tem alunas» —, e o `catch` o devolvia por
   * omissão. A tela lia o número e anunciava uma escola sem alunas quando o acervo estava apenas
   * ilegível. Mede-se com um KV que recusa: o que sai tem de ser «não sei», e «não sei» não é zero. */
  const envQueFalha = envDeEscola();
  envQueFalha.PADD_KV.get = async () => { throw new Error('KV fora do ar'); };
  const rotaQueFalha = await producao.fetch(
    new Request('https://batata.padd.com.br/api/bastidores/alunas-com-anamnese'), envQueFalha);
  const corpoQueFalha = await rotaQueFalha.json();
  provar('a contagem que não se conseguiu fazer NÃO vira zero',
    corpoQueFalha.registradas === null, corpoQueFalha.registradas);
  provar('…e o cliente lê a ausência de número como falha de leitura, não como escola vazia',
    /ALUNAS_REGISTRADAS = leu \? d\.registradas : null/.test(html), null);
  provar('o recado de «sem aluna» existe, e manda CADASTRAR primeiro',
    /Ainda não há nenhuma aluna cadastrada nesta escola/.test(html) &&
    /Cadastre a primeira em «Pessoas → Alunas»/.test(html), null);
  provar('…e diz a ORDEM: cadastrar, e depois a anamnese',
    /cadastre a primeira em «Pessoas → Alunas», e depois faça a anamnese dela/i.test(html), null);
  provar('o recado de «sem anamnese» continua a existir, para quando a aluna já existe',
    /Ainda não há nenhuma anamnese registada nesta escola/.test(html), null);
  provar('a página alimenta a contagem a partir da rota (e não de uma contagem própria)',
    /ALUNAS_REGISTRADAS = leu \? d\.registradas : null/.test(html) &&
    /typeof d\.registradas === "number"/.test(html), null);

  /* ── B. O DESTINO DO LINK ─────────────────────────────────────────────────────────────────── */
  provar('o link da anamnese aponta para a LISTA, e não para o formulário',
    /var LISTA_DA_ANAMNESE = "\/area-do-professor\/anamnese\/"/.test(html), null);
  provar('CONTROLE NEGATIVO: o link do formulário sem sujeito desapareceu',
    !/var ANAMNESE_DO_ALUNO = "\/anamnese\/\?/.test(html), null);
  provar('o menu «Anamnese do aluno» leva à lista',
    /href="\/area-do-professor\/anamnese\/">Anamnese do aluno</.test(html), null);

  /* ── C. A TRAVA DO SERVIDOR ───────────────────────────────────────────────────────────────── */
  const caso = async (query) => {
    const r = await producao.fetch(
      new Request('https://batata.padd.com.br/anamnese/' + query), env);
    /* A porta é servida pelo ASSETS de mentira; o que interessa é o status e o destino. */
    return { status: r.status, destino: r.headers.get('Location') };
  };

  const parcial = await caso('?professor=coqui-de-redinha&escola=batata');
  provar('contexto parcial sem aluna → 302', parcial.status === 302, parcial);
  provar('…e o destino é a lista da anamnese',
    parcial.destino === '/area-do-professor/anamnese/', parcial.destino);

  /* O CONTEXTO VAZIO JÁ ERA DESVIADO ANTES DESTA MUDANÇA, e continua — a guarda de 2026 para cá
   * desvia a página da porta sem nenhum parâmetro de ato. Não é um efeito colateral meu, e é
   * correcto: o «Fazer anamnese» da lista não navega por este endereço, ele abre um painel na
   * própria lista e vai daí com professor, aluna, bilhete e `abrir=1`. O que a prova fixa é que a
   * regra continua a valer — para ninguém a ler como regressão. */
  const semNada = await caso('?fonte=anamnese');
  provar('o contexto VAZIO continua a ser desviado (a regra de antes, intacta)',
    semNada.status === 302 && semNada.destino === '/area-do-professor/anamnese/', semNada);

  for (const atalho of ['?editar=anamnese-20260101-0000', '?ajustar=anamnese-20260101-0000',
    '?novo=anamnese-20260101-0000']) {
    const r = await caso(atalho + '&professor=coqui-de-redinha&escola=batata');
    provar('CONTROLE NEGATIVO: o atalho `' + atalho.split('=')[0] + '` NÃO é desviado',
      r.status !== 302, r);
  }

  const comAluna = await caso('?professor=coqui-de-redinha&escola=batata&aluna=Aluna%20A');
  provar('com aluna, a porta abre (não é desviada)', comAluna.status !== 302, comAluna);

  /* AS ROTAS `api/` FICAM DE FORA POR CONSTRUÇÃO, e a prova não as pede: a guarda só age quando
   * `rel` é `/` ou `/index.html` — é essa a condição que está escrita no código, e pedi-las aqui
   * exigiria montar o esquema inteiro da elicitação (a `ficha` renderiza a partir dele). O que se
   * afirma é o que se mede: a PÁGINA é desviada, o resto do prefixo não é a página. */

  console.log('\n' + (ko === 0 ? 'TUDO CERTO — ' + ok + ' asserções.'
    : 'FALHOU — ' + ok + ' asserção(ões), ' + ko + ' falha(s).'));
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => { console.error('erro: ' + ((erro && erro.stack) || erro)); process.exit(2); });
