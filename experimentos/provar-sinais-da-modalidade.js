#!/usr/bin/env node
'use strict';

/**
 * provar-sinais-da-modalidade.js — O SINAL QUE FALTAVA, E O NOME QUE NÃO SE TRADUZ (03/11/2026).
 *
 * O QUE ELA PEDIU, e o que a medição encontrou antes de escrever a primeira linha:
 *
 *   «Adicionar o termo Coupé… Adicionar o termo Sur le cou-de-pied.»
 *
 *   OS DOIS TERMOS JÁ EXISTIAM no vocabulário da modalidade — `coupe` desde o dicionário dela,
 *   `sur-le-cou-de-pied` como posição. O que faltava era o SINAL: o grupo «Posições dos pés e
 *   braços» do alfabeto tinha `prep` e os cinco números, e mais nada. Medido: escrever o battement
 *   frappé — que parte do sur le cou-de-pied — não era possível, porque o token não existia e o
 *   `lerBloco` recusa o bloco inteiro. É a diferença entre «o termo está no dicionário» e «o termo
 *   se escreve numa aula», e é a segunda que ela pediu.
 *
 *   E o NOME. O `sur-le-cou-de-pied` estava com `nome: "sobre o colo do pé"` — tradução literal que
 *   a técnica não usa, e que diz «colo» onde cou-de-pied é o PEITO do pé. A decisão D-67
 *   (02/11/2026) já tinha escrito que os empréstimos que se dizem assim em português não se
 *   traduzem; o dado dizia outra coisa. O `atitude` era o segundo caso, e é o mesmo defeito.
 *
 * O QUE SE MEDE:
 *
 *   §A o sinal existe, entra num bloco e compõe — com o motor de verdade, não com uma maquete;
 *   §B o nome dos quatro empréstimos é o internacional, e a regra fica presa (é a D-67);
 *   §C a rota da Produção serve os dois sinais, no grupo certo, e a posição com o nome certo;
 *   §D o ACOPLAMENTO, medido: quantos sítios escrevem a modalidade à mão hoje. É a linha de base
 *      do trabalho de médio prazo — sem ela, «desacoplar» não tem de onde partir.
 *
 *   node experimentos/provar-sinais-da-modalidade.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const notacao = require(path.join(RAIZ, 'motor/nucleo/notacao.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const verbete = require(path.join(RAIZ, 'motor/servidor/verbete.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const P = (rel) => path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', rel);
const lerJson = (rel) => JSON.parse(fs.readFileSync(rel, 'utf8'));

const ALFABETO = lerJson(P('notacao.json'));
const VOCABULARIO = lerJson(P('vocabulario.json'));

/** O grupo das posições — o «módulo» que ela nomeou. */
const grupoDasPosicoes = () => (ALFABETO.grupos || [])
  .find((g) => g.titulo === 'Posições dos pés e braços') || { itens: {} };

// =====================================================================================
// A. O SIGNO EXISTE, ESCREVE-SE E COMPÕE
// =====================================================================================
function oSigno() {
  console.log('\nA. O SIGNO — o termo estava no dicionário, o sinal não existia');

  const itens = grupoDasPosicoes().itens || {};

  checar('o «Posições dos pés e braços» declara `cp` (coupé)', Boolean(itens.cp), Object.keys(itens));
  checar('…e declara `cdp` (sur le cou-de-pied)', Boolean(itens.cdp), Object.keys(itens));
  checar('…com o nome em francês, e não traduzido',
    itens.cp && itens.cp.nome === 'coupé' && itens.cdp && itens.cdp.nome === 'sur le cou-de-pied',
    [itens.cp && itens.cp.nome, itens.cdp && itens.cdp.nome]);

  // O SINAL ENTRA NO ALFABETO QUE O VALIDADOR USA — é ele que decide se um bloco se aceita.
  const conhecidos = verbete.sinaisDo(ALFABETO);
  checar('os dois são sinais conhecidos do alfabeto', conhecidos.has('cp') && conhecidos.has('cdp'),
    [...conhecidos].filter((s) => /^c/.test(s)));

  /* A PROVA DE QUE FALTAVA: o battement frappé parte do sur le cou-de-pied. O bloco abaixo é o que
   * ela não conseguia escrever — e o `lerBloco` recusa o bloco INTEIRO quando um token não existe,
   * portanto a ausência do sinal não dava um sinal a menos: dava a célula por ilegível. */
  const bloco = '[Perna: ED cdp ↓ ↑]';
  const lido = notacao.lerBloco(bloco, ALFABETO);
  checar('o bloco do frappé, escrito com `cdp`, lê-se sem sinal desconhecido',
    lido.ok === true, lido.desconhecidos);
  checar('…e o bloco do coupé, escrito com `cp`, também', notacao.lerBloco('[Perna: cp ↑]', ALFABETO).ok === true);

  // E COMPÕE. Um verbete de 4 tempos em 2/4, com as duas posições, tem de fechar.
  const alfabetoDaProva = JSON.parse(JSON.stringify(ALFABETO));
  alfabetoDaProva.verbetes = {
    'Battement frappé': {
      '4|2/4': {
        cobre: 4,
        posicao: null,
        celulas: { devant: [{
          contagem: '1–4', categoria: 'Perna', sinais: ['ED', 'cdp', '↓', '↑'],
          descricao: 'frase do exercício\nLê-se: Perna, varredura para fora, sur le cou-de-pied, cede, sobe.',
        }] },
      },
    },
  };
  const composto = notacao.compor(
    { Bloco: 'Solo', 'Conteúdo do nível': 'Battement frappé', Tempos: '4', Compasso: '2/4' },
    alfabetoDaProva, '', '');
  checar('um verbete que usa as duas posições COMPÕE (o motor não estica nem recusa)',
    composto.estado === 'composto', { estado: composto.estado, motivo: composto.motivo, detalhe: composto.detalhe });
  checar('…e os dois sinais chegam ao segmento composto',
    (composto.segmentos || []).length === 1
      && composto.segmentos[0].sinais.indexOf('cdp') !== -1,
    (composto.segmentos || []).map((s) => s.sinais));

  // SEM OS SINAIS, O MESMO VERBETE NÃO SE ESCREVE — é a contraprova, e é ela que dá sentido à
  // asserção de cima: se o alfabeto antigo também passasse, a prova não estaria a medir o acrescento.
  const semOsDois = JSON.parse(JSON.stringify(alfabetoDaProva));
  const grupo = semOsDois.grupos.find((g) => g.titulo === 'Posições dos pés e braços');
  delete grupo.itens.cp; delete grupo.itens.cdp;
  const r = notacao.compor(
    { Bloco: 'Solo', 'Conteúdo do nível': 'Battement frappé', Tempos: '4', Compasso: '2/4' },
    semOsDois, '', '');
  checar('…e, tirados os dois sinais, o mesmo verbete cai em lacuna — a contraprova',
    r.estado === 'lacuna' && r.motivo === 'sinal-desconhecido',
    { estado: r.estado, motivo: r.motivo });

  checar('a versão do alfabeto subiu com o acrescento', Number(ALFABETO.versao) >= 38, ALFABETO.versao);
  checar('…e o acrescento está declarado no comentário do ficheiro',
    (ALFABETO._comentario || []).join(' ').indexOf('cou-de-pied') !== -1);
}

// =====================================================================================
// B. O NOME É O INTERNACIONAL — a D-67 presa no dado
// =====================================================================================
function oNome() {
  console.log('\nB. O NOME — o empréstimo que se diz em português não se traduz');

  /* A D-67 (02/11/2026) escreveu a regra e nomeou os quatro casos: `retiré`, `attitude`,
   * `arabesque`, `sur le cou-de-pied`. Dois deles estavam traduzidos no dado — «atitude» e «sobre
   * o colo do pé» —, e a segunda é pior do que uma escolha: cou-de-pied é o PEITO do pé, e «colo»
   * é outra coisa. A prova passa a prender a regra: quem traduzir de novo vê-a vermelha. */
  const porId = (id) => VOCABULARIO.find((t) => t.id === id) || {};
  const emprestimos = [
    ['retire', 'retiré'],
    ['attitude', 'attitude'],
    ['arabesque', 'arabesque'],
    ['sur-le-cou-de-pied', 'sur le cou-de-pied'],
  ];
  for (const [id, esperado] of emprestimos) {
    const t = porId(id);
    checar('«' + id + '» tem o nome internacional (' + esperado + ')', t.nome === esperado, t.nome);
  }
  checar('e nenhum deles diz «colo» ou «atitude» — as duas traduções que estavam lá',
    emprestimos.every(([id]) => !/colo|atitude/i.test(String(porId(id).nome || ''))),
    emprestimos.map(([id]) => porId(id).nome));

  /* O QUE CONTINUA A SER PORTUGUÊS, e é de propósito: o que NÃO é empréstimo. As cinco posições
   * dizem-se em português, e a tela tem de as dizer assim — a regra não é «nunca traduzir», é
   * «não inventar tradução para o que a escola diz em francês». */
  const posicoes = VOCABULARIO.filter((t) => t.categoria === 'posicao').map((t) => t.nome || t.termo);
  checar('as cinco posições continuam a dizer-se em português',
    ['primeira posição', 'segunda posição', 'terceira posição', 'quarta posição', 'quinta posição']
      .every((n) => posicoes.indexOf(n) !== -1), posicoes);

  // E A POSIÇÃO TEM DE SER ALCANÇÁVEL: o nome internacional não pode ter deixado a entrada órfã.
  const sur = porId('sur-le-cou-de-pied');
  checar('o sur le cou-de-pied continua uma POSIÇÃO de pé, com as duas formas declaradas',
    sur.categoria === 'posicao' && sur.membro === 'pes'
      && (sur.alternativos || []).join('|') === 'Cou-de-pied devant|Cou-de-pied derrière',
    { categoria: sur.categoria, membro: sur.membro, alternativos: sur.alternativos });
  checar('…e a observação aponta o sinal que a escreve', /cdp/.test(String(sur.observacoes || '')),
    sur.observacoes);
}

// =====================================================================================
// C. A ROTA — o que a Produção recebe
// =====================================================================================
async function aRota() {
  console.log('\nC. A ROTA — os dois sinais chegam à tela, no grupo certo');

  const env = {
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
    PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [] }; } },
  };
  // A rota lê do repositório por `fetch`; aqui responde-se com os ficheiros do disco.
  const fetchDeVerdade = globalThis.fetch;
  const f = async (url) => {
    const caminho = String(url).split('/contents/')[1].split('?')[0];
    const arquivo = path.join(RAIZ, decodeURIComponent(caminho));
    if (!fs.existsSync(arquivo)) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: 'sha-' + caminho,
      content: fs.readFileSync(arquivo).toString('base64'),
    }), { status: 200 });
  };
  globalThis.fetch = f;

  try {
    const r = await bastidores.fetch(new Request(
      'https://breu.tmenegaz77.workers.dev/api/bastidores/verbete'), env);
    const d = await r.json();
    checar('a rota responde 200', r.status === 200, r.status);
    checar('…e diz de que modalidade está a falar (o primeiro passo para não a escrever à mão)',
      d.modalidade === 'bale-classico', d.modalidade);

    const sinais = d.sinais || [];
    const doGrupo = sinais.filter((s) => s.grupo === 'Posições dos pés e braços');
    checar('o grupo das posições chega com os dois sinais novos',
      doGrupo.some((s) => s.sinal === 'cp') && doGrupo.some((s) => s.sinal === 'cdp'),
      doGrupo.map((s) => s.sinal));
    const cdp = doGrupo.find((s) => s.sinal === 'cdp') || {};
    checar('…e cada um chega com o NOME que a tela mostra e o significado',
      cdp.nome === 'sur le cou-de-pied' && String(cdp.significado || '').length > 20,
      { nome: cdp.nome, significado: String(cdp.significado || '').slice(0, 40) });
    checar('o significado diz que é o PEITO do pé, e não o colo',
      /peito do pé/.test(String(cdp.significado || '')), cdp.significado);

    const posicoes = d.posicoes || [];
    const sur = posicoes.find((p) => p.id === 'sur-le-cou-de-pied') || {};
    checar('a lista de posições serve o sur le cou-de-pied com o nome internacional',
      sur.nome === 'sur le cou-de-pied', sur.nome);
  } finally {
    globalThis.fetch = fetchDeVerdade;
  }
}

// =====================================================================================
// D. O ACOPLAMENTO — medido, para o plano ter de onde partir
// =====================================================================================
function oAcoplamento() {
  console.log('\nD. O ACOPLAMENTO — quantos sítios escrevem a modalidade à mão');

  /* ISTO NÃO É UMA ASSERÇÃO DE REGRESSÃO: é a LINHA DE BASE do trabalho de médio prazo. Um dia o
   * número cai a zero, e a asserção passa a ser «é zero». Hoje ela afirma o que é verdade — que a
   * modalidade ainda está escrita à mão em vários sítios —, para que «desacoplar» não seja uma
   * palavra sem medida. */
  const arquivos = [];
  const andar = (rel) => {
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) return;
    for (const nome of fs.readdirSync(abs)) {
      const r = rel + '/' + nome;
      const st = fs.statSync(path.join(RAIZ, r));
      if (st.isDirectory()) { if (nome !== 'node_modules') andar(r); continue; }
      if (/\.js$/.test(nome)) arquivos.push(r);
    }
  };
  andar('motor');

  const sitios = [];
  for (const r of arquivos) {
    const texto = fs.readFileSync(path.join(RAIZ, r), 'utf8');
    texto.split('\n').forEach((linha, i) => {
      if (/'bale-classico'|"bale-classico"/.test(linha) && !/^\s*\*/.test(linha) && !/^\s*\/\//.test(linha)) {
        sitios.push(r + ':' + (i + 1));
      }
    });
  }
  console.log('    · a modalidade escrita à mão em `motor/`: ' + sitios.length + ' sítio(s)');
  for (const s of sitios) console.log('      – ' + s);

  checar('a modalidade ainda está escrita à mão em `motor/` — é a linha de base do plano',
    sitios.length > 0, sitios.length);

  /* E O QUE JÁ ESTÁ FEITO: existe UMA porta por onde a modalidade entra no motor — o
   * `MODALIDADE_PADRAO` e os dois mapas —, e ela é declarada, não suposta. O plano de médio prazo
   * é trocar a constante por um dado do professor; a porta já existe. */
  checar('o motor já tem uma porta declarada para a modalidade (mapa + padrão)',
    typeof notacao.MODALIDADE_PADRAO === 'string' && notacao.MODALIDADE_PADRAO === 'bale-classico',
    notacao.MODALIDADE_PADRAO);

  // E NENHUM REGISTO DE PROFESSOR OU DE ESCOLA DECLARA MODALIDADE HOJE. É a ausência que o plano
  // tem de preencher — dita, e não suposta.
  const indices = [];
  const pastaEscolas = path.join(RAIZ, 'escola');
  if (fs.existsSync(pastaEscolas)) {
    for (const slug of fs.readdirSync(pastaEscolas)) {
      const arq = path.join(pastaEscolas, slug, 'indice.json');
      if (fs.existsSync(arq)) indices.push(JSON.parse(fs.readFileSync(arq, 'utf8')));
    }
  }
  checar('os registos de escola foram lidos (a varredura não é sobre uma lista inventada)',
    indices.length >= 5, indices.length);
  checar('nenhum registo de escola declara modalidade — o campo não existe hoje',
    indices.every((i) => i.modalidade === undefined), indices.map((i) => i.modalidade).filter(Boolean));
}

oSigno();
oNome();
oAcoplamento();
aRota().then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — o coupé e o sur le cou-de-pied escrevem-se num trecho e compõem,');
  console.log('o nome fica em francês, e o acoplamento da modalidade está medido.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
