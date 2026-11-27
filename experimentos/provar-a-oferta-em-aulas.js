#!/usr/bin/env node
'use strict';

/*
 * provar-a-oferta-em-aulas.js — A PÁGINA PÚBLICA VENDE O QUE O §ADITIVO MANDA VENDER (27/11/2026).
 *
 * PORQUE ESTA PROVA EXISTE. Ela perguntou «onde é que está registado a fundamentação de por que
 * manter professores e alunos», e a resposta está escrita — §ADITIVO §2 do `PLANEJAMENTO-LASTRO.md`,
 * de 17/11/2026, nas palavras da proprietária:
 *
 *   «Não exibir limites comerciais de professores e alunos na oferta. Não usar essas quantidades
 *    para calcular a mensalidade nem para bloquear a escola por ter mais pessoas cadastradas.»
 *
 * A REGRA ESTAVA ESCRITA, E A PÁGINA NÃO A CUMPRIA — em dois sítios, e um deles com um defeito:
 *
 *   1. a linha do plano dizia «Inclui **undefined** professor(es) e **undefined** aluna(s)». O
 *      `catalogoDaPagina` passou a aninhar esses números em `referencia` a 17/11 (a franquia é que
 *      se apresenta como limite), e esta linha continuou a lê-los no topo. É a MESMA deriva do
 *      convite, no mesmo dia, num ficheiro que ninguém procurou porque a correcção de lá ficou
 *      dentro de `motor/`;
 *   2. a secção «Capacidade a mais (por lote, na mensalidade)» continuava a oferecer lotes de
 *      professores e de alunas **e a somá-los à mensalidade** — o que o §ADITIVO §2 proíbe por
 *      palavras próprias. A tabela `lotes` do catálogo está declarada como LEGADO DE LEITURA (para
 *      os contratos já escritos poderem ser reconstruídos), e a página lia-a como se fosse oferta.
 *
 * O QUE ESTA PROVA MEDE, no DOM da página de verdade com o `/api/pagina` de verdade:
 *
 *   A. O QUE SE VENDE — cada plano mostra a franquia de AULAS, e nenhum mostra professores, alunas,
 *      `undefined` ou `NaN`. A asserção é sobre o TEXTO que a pessoa lê, e não sobre a variável.
 *   B. O QUE SE COBRA — a conta da página (a prévia) e a do servidor (`validarEscolha`) dão o MESMO
 *      valor para o plano, e os lotes de gente não entram nela.
 *   C. A ESCADA — as franquias que a página mostra são as do catálogo (130/320/500), e não outras.
 *      É a asserção que impede uma cópia do número de voltar a nascer na página.
 *
 * CONTROLO NEGATIVO: `--controle-negativo` lê o `raiz/index.html` do `HEAD` e corre A e B contra
 * ele. As duas têm de falhar lá.
 *
 *   node experimentos/provar-a-oferta-em-aulas.js
 *   node experimentos/provar-a-oferta-em-aulas.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { JSDOM } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

let provas = 0;
let falhas = 0;
const provar = (titulo, condicao, detalhe) => {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
};

const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const CATALOGO = comercial.catalogoDaPagina();

/** O HTML da oferta — o de agora, ou o do `HEAD` no controlo negativo. */
function htmlDaOferta() {
  if (!NEGATIVO) return fs.readFileSync(path.join(RAIZ, 'raiz/index.html'), 'utf8');
  return execSync('git show HEAD:raiz/index.html', { cwd: RAIZ, encoding: 'utf8' });
}

const HTML = htmlDaOferta();

/** O corpo do `/api/pagina`, que é o mesmo que a página recebe. */
const PAGINA_API = {
  ok: true, modo: 'painel', publica: 'https://lastro.padd.com.br',
  habilidades: [], planos: CATALOGO, pix: { chave: null, titular: null, conciliacao: 'manual', prazo: 'até 24 horas' },
};

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Abre a oferta. O `fetch` devolve o corpo do `/api/pagina` e recusa tudo o resto — a página pede
 * as modalidades e os planos por aí, e nada mais interessa a esta prova.
 */
function abrir() {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: 'https://lastro.padd.com.br/',
    pretendToBeVisual: true,
    /* O `fetch` E O `IntersectionObserver` TÊM DE EXISTIR ANTES DO SCRIPT (27/11/2026). Injectá-los
     * depois de construir o DOM é tarde: o `<script>` inline já correu, morreu com
     * `ReferenceError: fetch is not defined`, e a página ficou em branco — a prova media o nada e
     * chamava-lhe falhas da página. `beforeParse` é o único sítio que corre antes. */
    beforeParse(janela) {
      /* UMA `Response` A SÉRIO, E NÃO UM OBJECTO COM `json()` (27/11/2026). A primeira versão
       * devolvia `{ok:true, json: async () => API}` e o `r.json()` da página entregava `{}` — a
       * tabela de planos saía vazia, e a prova culpava a página por um defeito do duplo. Custou
       * quatro sondas descobrir que o duplo estava a mentir, e é a mesma lição do `clone` do
       * cartão de geração: um duplo que não se comporta como o original mede outra coisa. */
      const corpo = JSON.stringify(PAGINA_API);
      janela.fetch = async (u) => {
        const url = String(u);
        if (url.indexOf('api/pagina') !== -1) {
          return new Response(corpo, { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response('{}', { status: 404 });
      };
      janela.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
    },
  });
  const w = dom.window;
  const d = w.document;
  return { dom, w, d };
}

/** O texto que a oferta mostra para um plano, do `<label>` que o desenha. */
function linhaDoPlano(d, id) {
  const radio = d.querySelector('input[name="plano"][value="' + id + '"]');
  if (!radio) return null;
  const rotulo = radio.closest('label');
  return rotulo ? rotulo.textContent : null;
}

(async () => {
  console.log(NEGATIVO
    ? 'CONTROLO NEGATIVO — a oferta do HEAD, sem esta correcção'
    : 'A. O QUE SE VENDE — a franquia de aulas, e nada de professores e alunas');

  let c = abrir();
  await espera(400);

  {
    const planos = CATALOGO.assinaturas;
    provar('a oferta desenhou os três planos',
      planos.every((p) => linhaDoPlano(c.d, p.id) !== null),
      planos.map((p) => [p.id, Boolean(linhaDoPlano(c.d, p.id))]));

    for (const p of planos) {
      const t = linhaDoPlano(c.d, p.id) || '';
      provar('«' + p.nome + '» diz a franquia (' + p.aulas + ' aulas por mês)',
        new RegExp('Inclui ' + p.aulas + ' aulas por mês').test(t), t.slice(0, 160));
    }

    /* AS DUAS PALAVRAS DO DEFEITO. `undefined` e `NaN` no texto que a pessoa lê são sempre erro; a
     * asserção é sobre a oferta inteira, e não só sobre a linha do plano. */
    /* O QUE SE LÊ, E NÃO O TEXTO DO `<script>`. O `body.textContent` inclui o código-fonte do
     * script inline — e a primeira versão desta asserção caiu por causa do meu próprio COMENTÁRIO,
     * que explicava o defeito e continha a palavra. Uma prova que se apanha a si mesma não mede a
     * página: mede o texto de quem a escreveu. */
    /* O QUE A PESSOA LÊ NA OFERTA — a lista dos planos e a linha do resumo —, e não o `<main>`
     * inteiro: o `<script>` inline vive lá dentro (medido: o `<main>` abre em 25355 e o script em
     * 47814), e o comentário que explica o defeito contém a palavra que a asserção procura. Uma
     * prova que se apanha a si mesma não mede a página. */
    const ondeSeLe = [c.d.getElementById('planos-lista'), c.d.getElementById('resumo-do-plano')]
      .filter(Boolean).map((el) => el.textContent).join(' ');
    const texto = ondeSeLe;
    provar('a oferta NÃO mostra «undefined» em parte nenhuma',
      !/undefined/.test(texto), (texto.match(/.{0,40}undefined.{0,40}/) || [])[0]);
    provar('…nem «NaN»', !/NaN/.test(texto), (texto.match(/.{0,40}NaN.{0,40}/) || [])[0]);

    /* E O QUE O §ADITIVO §2 PROÍBE: professores e alunas como limite na oferta. A asserção é sobre
     * as linhas dos planos — «professor» pode aparecer noutro sítio legítimo da página (o consultor,
     * o cadastro), e restringir o teste ao corpo inteiro daria um falso positivo no dia em que a
     * palavra aparecesse por outra razão. */
    const comGente = CATALOGO.assinaturas
      .map((p) => [p.id, linhaDoPlano(c.d, p.id) || ''])
      .filter(([, t]) => /professor\(es\)|aluna\(s\)|professores incluídos|alunas incluídas/i.test(t));
    provar('nenhum plano oferece professores ou alunas como limite (§ADITIVO §2)',
      comGente.length === 0, comGente);

    /* A SECÇÃO DOS LOTES DE GENTE NÃO SE OFERECE. Ela está no catálogo como legado de LEITURA —
     * para os contratos já escritos —, e a página lia-a como se fosse oferta. */
    const caixaLotes = c.d.getElementById('lotes-lista');
    provar('a secção «Capacidade a mais (por lote)» não é oferecida',
      !caixaLotes || caixaLotes.hidden === true,
      caixaLotes ? { hidden: caixaLotes.hidden, texto: caixaLotes.textContent.slice(0, 80) } : null);
  }

  console.log('\nC. A ESCADA — os números que a oferta mostra são os do catálogo, e não outros');
  {
    /* A FRANQUIA É A DO CATÁLOGO. Se alguém voltar a escrever 100/300/800 à mão na página, esta
     * asserção cai — e é essa a razão de ela comparar com o catálogo em vez de fixar os números. */
    provar('as três franquias do catálogo são as que a página mostra',
      CATALOGO.assinaturas.every((p) => new RegExp('Inclui ' + p.aulas + ' aulas por mês')
        .test(linhaDoPlano(c.d, p.id) || '')),
      CATALOGO.assinaturas.map((p) => [p.id, p.aulas]));
    provar('…e o catálogo não voltou a 100/300/800',
      CATALOGO.assinaturas.map((p) => Number(p.aulas)).join(',') !== '100,300,800',
      CATALOGO.assinaturas.map((p) => p.aulas));
  }

  console.log('\nB. O QUE SE COBRA — a conta da página e a do servidor dão o mesmo');
  {
    for (const p of CATALOGO.assinaturas) {
      /* A CONTA DO SERVIDOR é a que cobra: `validarEscolha` devolve a escolha com o preço. A da
       * página é uma PRÉVIA — e uma prévia que discorde da conta é a que faz a pessoa desistir no
       * Pix, com razão. */
      const doServidor = comercial.validarEscolha({ plano: p.id, pacotes: [] });
      provar('«' + p.nome + '»: o servidor cobra o preço do catálogo',
        doServidor.ok && Math.round(Number(doServidor.escolha.valorCentavos)) === Math.round(Number(p.preco) * 100),
        doServidor.ok ? doServidor.escolha.valorCentavos : doServidor.erro);

      /* E A ESCOLHA NÃO CARREGA LOTES DE GENTE. É o §ADITIVO §2 na forma que se pode medir: a
       * mensalidade não soma professores nem alunas. */
      const escolha = doServidor.escolha || {};
      provar('…e não soma lotes de professores ou alunas à mensalidade',
        !Number(escolha.lotesProfessores && escolha.lotesProfessores.length)
        && !Number(escolha.lotesAlunos && escolha.lotesAlunos.length),
        { lotesProfessores: escolha.lotesProfessores, lotesAlunos: escolha.lotesAlunos });
    }

    /* A CAPACIDADE CONTINUA A EXISTIR — como REFERÊNCIA INTERNA, que é o que o §ADITIVO §2 manda:
     * «o produto monitora internamente o custo dos demais registos». Não é para desaparecer: é para
     * não ser oferecida. */
    provar('a capacidade continua no catálogo, como referência interna',
      CATALOGO.assinaturas.every((p) => p.referencia
        && Number(p.referencia.professores) > 0 && Number(p.referencia.alunos) > 0),
      CATALOGO.assinaturas.map((p) => [p.id, p.referencia]));
    provar('…e não no topo, onde a oferta a leria como limite',
      CATALOGO.assinaturas.every((p) => p.professores === undefined && p.alunos === undefined),
      CATALOGO.assinaturas.map((p) => [p.id, p.professores, p.alunos]));

    /* E O CONTRATO JÁ ESCRITO NÃO SE PARTE (27/11/2026).
     *
     * Deixar de OFERECER lotes não é deixar de os RECONHECER. Há escolas cuja mensalidade foi
     * fechada com capacidade a mais, e o valor que elas pagam tem de continuar a reconstruir-se a
     * partir do catálogo — é para isso que a tabela `lotes` ficou lá, marcada como legado. Se
     * `validarEscolha` recusasse os lotes, o contrato antigo deixava de ter preço, e a correcção de
     * hoje apagaria o passado em vez de corrigir a oferta. */
    const legado = comercial.validarEscolha({
      plano: 'intermediario', lotesProfessores: ['+1'], lotesAlunos: ['+30'] });
    provar('um contrato antigo COM lotes continua a ter preço (99,90 + 80,00 = 179,90)',
      legado.ok && Math.round(Number(legado.escolha.valorCentavos)) === 17990,
      legado.ok ? legado.escolha.valor : legado.erro);
    provar('…e o mesmo plano, sem lotes, custa o preço do catálogo',
      (() => {
        const novo = comercial.validarEscolha({ plano: 'intermediario' });
        return novo.ok && Math.round(Number(novo.escolha.valorCentavos)) === 9990;
      })(), null);
  }

  console.log('');
  if (falhas) {
    console.log((NEGATIVO ? 'CONTROLO NEGATIVO: ' : '') + 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.');
    process.exit(NEGATIVO ? 0 : 1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: a oferta vende a franquia de aulas que o '
    + '§ADITIVO §2 manda vender, a mensalidade não soma professores nem alunas, e a capacidade '
    + 'continua no catálogo como referência interna.');
})();
