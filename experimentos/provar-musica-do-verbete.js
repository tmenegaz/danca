#!/usr/bin/env node
'use strict';

/**
 * provar-musica-do-verbete.js — A MÚSICA EDITA-SE, E A DECOMPOSIÇÃO NÃO SE APAGA (03/11/2026).
 *
 * OS TRÊS DEFEITOS QUE ESTA PROVA TRAVA, e são os três do relatório dela:
 *
 *   1. DUPLICAR UM TRECHO MULTIPLICAVA A DURAÇÃO DA MÚSICA. Com uma música de 8 tempos e um
 *      bloco de 4, duplicar escrevia `12` no campo; duplicar outra vez escrevia `16`. A música é a
 *      base rítmica do exercício e define-se no passo 3 — duplicar um trecho não a reescreve.
 *   2. O CAMPO DA MÚSICA ESTAVA BLOQUEADO. A trava de 02/11 resolvia um defeito real (mudar os
 *      tempos recomeçava a decomposição a partir da chave e deixava `CELULAS` em zero), mas
 *      bloqueava o que ela pediu: «total liberdade para editar as informações da música a
 *      qualquer momento».
 *   3. O DESACORDO RECUSAVA A GRAVAÇÃO. Depois de 1 e 2, uma música que não fecha com os trechos
 *      é um ESTADO — e a regra é dela: não se apaga nada, mostra-se um alerta, e quem decide é
 *      quem ensina.
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   · A GRAVAÇÃO (servidor): `validarVerbete` devolve a divergência em `avisos` e não em `erros`,
 *     e `gravarVerbete` grava — o dado fica escrito, com o aviso na resposta.
 *   · A TELA (jsdom, com a página de verdade e o alfabeto de verdade): abrir o `Plié` pelo
 *     «editar» da listagem, duplicar, mudar a música, e ver que os trechos continuam lá e que o
 *     selo aparece. Não se mede o texto do JS: mede-se o que fica no DOM depois do gesto.
 *
 *   node experimentos/provar-musica-do-verbete.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const verbete = require(path.join(RAIZ, 'motor/servidor/verbete.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

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

/** Um GitHub de mentira — o mesmo contrato do `provar-verbete`: lê, honra o `sha` e grava. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial));
  const pedidos = [];
  const f = async (url, opcoes) => {
    const caminho = String(url).split('/contents/')[1].split('?')[0];
    pedidos.push({ metodo: (opcoes && opcoes.method) || 'GET', caminho });
    if ((opcoes && opcoes.method) === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      const atual = arquivos.get(caminho);
      if (atual && corpo.sha && corpo.sha !== atual.sha) {
        return new Response(JSON.stringify({ message: 'sha mismatch' }), { status: 409 });
      }
      const texto = Buffer.from(corpo.content, 'base64').toString('utf8');
      arquivos.set(caminho, { sha: 'sha-' + (arquivos.size + 1), conteudo: texto, mensagem: corpo.message });
      return new Response(JSON.stringify({ commit: { sha: 'commit-' + arquivos.size } }), { status: 200 });
    }
    const atual = arquivos.get(caminho);
    if (!atual) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: atual.sha,
      content: Buffer.from(atual.conteudo, 'utf8').toString('base64'),
    }), { status: 200 });
  };
  return { f, arquivos, pedidos };
}

// =====================================================================================
// A. A GRAVAÇÃO — o desacordo avisa e grava
// =====================================================================================
async function aGravacao() {
  console.log('\nA. A GRAVAÇÃO — o desacordo entre a música e as células não recusa');

  const ALFABETO = lerJson(P('notacao.json'));
  const VOCABULARIO = lerJson(P('vocabulario.json'));

  // QUATRO TEMPOS DE CÉLULAS NUMA MÚSICA DE OITO: é o desacordo do relatório, na forma mínima.
  const quatro = {
    cobre: 4,
    celulas: {
      devant: [
        { contagem: '1–4', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'ida' },
      ],
    },
  };

  const validado = verbete.validarVerbete(JSON.parse(JSON.stringify(quatro)), ALFABETO, VOCABULARIO, '8|4/4');
  checar('a divergência NÃO é erro de validação', validado.ok === true, validado.erros);
  checar('…e sai em `avisos`, com os dois números',
    (validado.avisos || []).length === 1 && /4 tempos/.test(validado.avisos[0])
      && /8/.test(validado.avisos[0]), validado.avisos);

  // O QUE CONTINUA A RECUSAR: o dado inválido do verbete consigo mesmo.
  const semSinais = JSON.parse(JSON.stringify(quatro));
  semSinais.celulas.devant[0].sinais = [];
  const r2 = verbete.validarVerbete(semSinais, ALFABETO, VOCABULARIO, '8|4/4');
  checar('uma célula sem sinais continua a ser recusada', r2.ok === false, r2.erros);

  // A GRAVAÇÃO INTEIRA, no repositório de mentira.
  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-a', conteudo: fs.readFileSync(P('notacao.json'), 'utf8'),
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-v', conteudo: fs.readFileSync(P('vocabulario.json'), 'utf8'),
    },
  });
  const gravado = await verbete.gravarVerbete({
    f: repo.f, token: 't', dono: 'd', repo: 'r', ref: 'main', modalidade: 'bale-classico',
    nome: 'Plié', musica: '8|4/4', acao: 'atualizar',
    verbete: quatro,
  });
  checar('a gravação passa (o trabalho não fica preso)', gravado.ok === true, gravado);
  checar('…e a resposta leva o aviso, para a tela o poder dizer',
    Array.isArray(gravado.avisos) && gravado.avisos.length === 1, gravado.avisos);
  const escrito = JSON.parse(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).conteudo);
  checar('…e o verbete ficou escrito no alfabeto, com os quatro tempos',
    escrito.verbetes['Plié']['8|4/4'].cobre === 4, escrito.verbetes['Plié']['8|4/4'].cobre);
}

// =====================================================================================
// B. A TELA — a página de verdade, num DOM
// =====================================================================================
/** O KV de mentira: o contrato que `bastidores.js` usa, sem rede. */
function criarKv() {
  const dados = new Map();
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, v); },
    async delete(c) { dados.delete(c); },
    async list() { return { keys: [], list_complete: true }; },
  };
}

async function aTela() {
  console.log('\nB. A TELA — duplicar não muda a música, e editá-la não apaga os trechos');

  /* O CONTEÚDO É UMA FIXTURE, E NÃO O ALFABETO EDITORIAL (03/11/2026) — a mesma lição que o
   * `provar-verbete` já tinha aprendido. A prova mede o MECANISMO: um verbete de 8 tempos com
   * quatro trechos que fecham os 8. Ler o `Plié` de verdade faria a prova depender de ele existir,
   * de a música ser a que é, e de os trechos fecharem — três coisas que são dela e mudam.
   * A gramática, os sinais e o vocabulário continuam a ser os reais: é deles que a tela vive. */
  const ALFABETO_DA_TELA = lerJson(P('notacao.json'));
  const dois = (n, marca) => ({
    contagem: n + '–' + (n + 1),
    categoria: 'Pé',
    sinais: ['1ª', '→', '+'],
    descricao: marca,
  });
  ALFABETO_DA_TELA.verbetes = {
    'Battement tendu': {
      '8|4/4': {
        cobre: 8,
        posicao: null,
        celulas: {
          devant: [dois(1, 'ida'), dois(3, 'volta'), dois(5, 'ida outra vez'), dois(7, 'volta')],
        },
      },
    },
  };

  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-a', conteudo: JSON.stringify(ALFABETO_DA_TELA, null, 2) + '\n',
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-v', conteudo: fs.readFileSync(P('vocabulario.json'), 'utf8'),
    },
  });
  const env = {
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', GITHUB_TOKEN: 't',
    PADD_KV: criarKv(),
  };
  const BASE = 'https://breu.tmenegaz77.workers.dev';

  /* O GITHUB DE MENTIRA SUBSTITUI O `fetch` GLOBAL ENQUANTO A PÁGINA CORRE. As rotas dos
   * Bastidores leem o repositório por `globalThis.fetch` — é o `fetch` do runtime, e no Node ele
   * iria à rede de verdade. Trocá-lo aqui é o mesmo que o `provar-verbete` faz por parâmetro; a
   * diferença é que a página não recebe parâmetros, portanto a troca é global e é reposta no fim. */
  const fetchDeVerdade = globalThis.fetch;
  globalThis.fetch = repo.f;

  const resposta = await bastidores.fetch(new Request(BASE + '/bastidores/producao'), env);
  const html = await resposta.text();
  checar('a página da Produção é servida', resposta.status === 200 && html.length > 10000,
    { status: resposta.status, tamanho: html.length });

  /* A PÁGINA VAI AO AR COM AS ROTAS DO PRÓPRIO WORKER. O `fetch` de dentro do DOM é desviado para
   * o handler real, com o mesmo `env` — é a única forma de a tela receber o alfabeto de verdade
   * sem uma réplica do servidor. As rotas que dependem de Cloudflare (a lista de turmas, por
   * exemplo) devolvem o vazio: esta prova mede a música, não os Bastidores inteiros. */
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(html, {
    url: BASE + '/bastidores/producao',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.alert = () => {};
      w.confirm = () => true;
      w.fetch = async (u, i) => {
        const url = new URL(String(u), BASE + '/bastidores/producao');
        if (url.pathname.indexOf('/api/') === 0) {
          const r = await bastidores.fetch(new Request(url.toString(), i), env);
          if (r) return r;
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response('', { status: 404 });
      };
    },
  });
  const w = dom.window;
  const d = w.document;
  const espera = (ms) => new Promise((r) => w.setTimeout(r, ms));
  const disparar = (el, tipo) => el.dispatchEvent(new w.Event(tipo, { bubbles: true }));

  // A LISTAGEM É CARREGADA POR FETCH — espera-se que os botões de «editar» existam.
  let botao = null;
  for (let i = 0; i < 60 && !botao; i += 1) {
    await espera(25);
    const todos = Array.from(d.querySelectorAll('button.verbetes-editar'));
    botao = todos.find((b) => b.getAttribute('data-musica') === '8|4/4') || null;
  }
  checar('a listagem trouxe um verbete de «8|4/4» para abrir', Boolean(botao),
    Array.from(d.querySelectorAll('button.verbetes-editar')).map((b) => b.getAttribute('data-musica')));

  if (!botao) { dom.window.close(); return; }

  // ABRIR O VERBETE PELO «EDITAR» DA LISTAGEM — é o caminho da pessoa, não uma chamada interna.
  botao.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await espera(60);

  const tempos = d.getElementById('vbtempos');
  const compasso = d.getElementById('vbcompasso');
  const selo = d.getElementById('vb-musica-desacordo');
  const linhas = () => d.querySelectorAll('#vb-tabela tbody tr').length;

  checar('o campo da música está ABERTO para edição (o bloqueio saiu)',
    tempos && tempos.readOnly === false && compasso && compasso.disabled === false,
    { readOnly: tempos && tempos.readOnly, disabled: compasso && compasso.disabled });

  const antesDosTrechos = linhas();
  checar('abrir o verbete traz a decomposição gravada', antesDosTrechos > 0, antesDosTrechos);
  checar('…e, com a música a fechar, o selo do desacordo está escondido',
    selo && selo.hidden === true, { hidden: selo && selo.hidden, valor: tempos && tempos.value });

  const musicaAntes = tempos.value;

  /* 1) DUPLICAR UM TRECHO NÃO MUDA A DURAÇÃO DA MÚSICA.
   *
   * A DUPLICAÇÃO PASSOU A SER DE UMA LINHA (10/11/2026): o botão global saiu, e cada linha tem o
   * seu. O que esta secção mede não mudou — que a música não é reescrita pela cópia —, e a
   * contagem acompanha o mecanismo novo: uma linha copiada, não o dobro das linhas. */
  const duplicar = d.querySelector('#vb-tabela button[data-duplicar]');
  checar('o «Duplicar» está disponível em cada linha com trechos escritos', Boolean(duplicar));
  if (duplicar) duplicar.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await espera(40);

  checar('duplicar NÃO reescreve os tempos da música', tempos.value === musicaAntes,
    { antes: musicaAntes, depois: tempos.value });
  checar('…e UMA linha foi duplicada (a do botão, não a decomposição inteira)',
    linhas() === antesDosTrechos + 1, { antes: antesDosTrechos, depois: linhas() });
  checar('…e o selo do desacordo aparece, porque agora ocupam mais do que a música declara',
    selo && selo.hidden === false, { hidden: selo && selo.hidden });

  /* 2) MUDAR A MÚSICA NÃO APAGA OS TRECHOS.
   *
   * O NÚMERO DEIXOU DE SER 16 (10/11/2026). Com a duplicação de UMA linha, os trechos passam a
   * ocupar o que ocupavam MAIS a linha copiada — e não o dobro. Escrever «16» à mão era medir o
   * mecanismo antigo; o que se mede agora é a REGRA (o selo desaparece quando a música declarada
   * iguala o que os trechos ocupam), com o número lido da página. */
  const trechosAntesDaMusica = linhas();
  const coberturaAgora = typeof w.cobertura === 'function' ? w.cobertura() : null;
  tempos.value = String(coberturaAgora || 16);
  disparar(tempos, 'input');
  await espera(40);

  checar('mudar os tempos NÃO apaga a decomposição', linhas() === trechosAntesDaMusica,
    { antes: trechosAntesDaMusica, depois: linhas() });
  checar('…e, declarada a música com os tempos que os trechos ocupam, o selo desaparece',
    selo && selo.hidden === true,
    { hidden: selo && selo.hidden, tempos: tempos.value, cobertura: coberturaAgora });

  // 3) E O COMPASSO TAMBÉM NÃO APAGA.
  compasso.value = '3/4';
  disparar(compasso, 'change');
  await espera(40);
  checar('mudar o compasso NÃO apaga a decomposição', linhas() === trechosAntesDaMusica,
    { antes: trechosAntesDaMusica, depois: linhas() });

  checar('o script da página correu sem erro', problemas.length === 0, problemas);
  dom.window.close();
  globalThis.fetch = fetchDeVerdade;
}

// =====================================================================================
// C. O DONO DO ALFABETO — a escola tem a sua versão, e o catálogo fica com a dele
// =====================================================================================
async function oDonoDoAlfabeto() {
  console.log('\nC. O DONO DO ALFABETO — o campo `escola`, como no vocabulário');

  const notacao = require(path.join(RAIZ, 'motor', 'nucleo', 'notacao.js'));
  const ALFABETO = lerJson(P('notacao.json'));
  const semComentario = (o) => Object.keys(o || {}).filter((k) => !k.startsWith('_')).length;
  void semComentario;

  const celula = (texto) => ({
    celulas: { devant: [{ contagem: '1–4', categoria: 'Pé', sinais: ['1ª'], descricao: texto }] },
    cobre: 4,
  });

  // A CHAVE: o catálogo na música, a escola com o dono ao lado.
  checar('a chave do catálogo é a música', notacao.chaveDoVerbete('8|4/4', '') === '8|4/4');
  checar('a chave de uma escola leva o dono', notacao.chaveDoVerbete('8|4/4', 'breu') === '8|4/4@breu');
  checar('e o dono lê-se da chave', notacao.escolaDoRegisto('8|4/4@breu') === 'breu'
    && notacao.escolaDoRegisto('8|4/4') === '');
  checar('e a música lê-se sem o dono', notacao.musicaDaChave('8|4/4@breu') === '8|4/4');

  const verbetes = {
    'Plié': Object.assign({}, {
      '8|4/4': celula('do catálogo'),
      '8|4/4@breu': Object.assign(celula('da breu'), { escola: 'breu' }),
      '8|4/4@maria': Object.assign(celula('da maria'), { escola: 'maria' }),
    }),
  };

  const daBreu = notacao.registosDaEscola(verbetes['Plié'], 'breu');
  checar('a escola vê UMA versão por música — a dela', Object.keys(daBreu).length === 1
    && daBreu['8|4/4'].escola === 'breu', Object.keys(daBreu));
  const doCatalogo = notacao.registosDaEscola(verbetes['Plié'], '');
  checar('o catálogo vê a dele, e não a de escola nenhuma',
    !doCatalogo['8|4/4'].escola && /catálogo/.test(doCatalogo['8|4/4'].celulas.devant[0].descricao));
  const daMaria = notacao.registosDaEscola(verbetes['Plié'], 'maria');
  checar('…e a `maria` não vê a versão da `breu`',
    daMaria['8|4/4'].escola === 'maria', daMaria['8|4/4'].escola);

  // A COMPOSIÇÃO DO DOCUMENTO — quem compõe uma aula da breu lê a versão da breu.
  const linha = { Bloco: 'Solo', 'Conteúdo do nível': 'Plié', Tempos: '8', Compasso: '4/4' };
  const alfabeto = JSON.parse(JSON.stringify(ALFABETO));
  alfabeto.verbetes = verbetes;
  const docDaBreu = notacao.compor(linha, alfabeto, '', 'breu');
  const docDoCatalogo = notacao.compor(linha, alfabeto, '');
  const docDaMaria = notacao.compor(linha, alfabeto, '', 'maria');
  checar('o documento da escola compõe a versão dela',
    /da breu/.test(JSON.stringify(docDaBreu.segmentos)), docDaBreu.estado);
  checar('o documento do catálogo compõe a do catálogo',
    /do catálogo/.test(JSON.stringify(docDoCatalogo.segmentos)), docDoCatalogo.estado);
  checar('…e o de outra escola não herda a edição da primeira',
    /da maria/.test(JSON.stringify(docDaMaria.segmentos)), docDaMaria.estado);

  // E A GRAVAÇÃO NÃO SOBRESCREVE O CATÁLOGO.
  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-a', conteudo: JSON.stringify(alfabeto, null, 2) + '\n',
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-v', conteudo: fs.readFileSync(P('vocabulario.json'), 'utf8'),
    },
  });
  const gravado = await verbete.gravarVerbete({
    f: repo.f, token: 't', dono: 'd', repo: 'r', ref: 'main', modalidade: 'bale-classico',
    nome: 'Plié', musica: '8|4/4', acao: 'atualizar', escola: 'breu',
    verbete: { cobre: 4, celulas: { devant: [{ contagem: '1–4', categoria: 'Pé', sinais: ['1ª', '→'], descricao: 'reescrita pela breu' }] } },
  });
  checar('a escola grava a sua versão', gravado.ok === true, gravado.erros || gravado.erro);
  const escrito = JSON.parse(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).conteudo);
  checar('…e o catálogo fica intacto', /do catálogo/.test(
    JSON.stringify(escrito.verbetes['Plié']['8|4/4'].celulas)));
  checar('…e o registo da escola leva o campo `escola`, como no vocabulário',
    escrito.verbetes['Plié']['8|4/4@breu'].escola === 'breu');

  // O APAGAR É DO DONO: a escola não apaga o catálogo.
  const apagado = await verbete.apagarVerbete({
    f: repo.f, token: 't', dono: 'd', repo: 'r', ref: 'main', modalidade: 'bale-classico',
    nome: 'Plié', escola: 'maria',
  });
  const depois = JSON.parse(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).conteudo);
  checar('apagar só tira os registos de quem apaga', apagado.ok === true
    && !depois.verbetes['Plié']['8|4/4@maria'] && Boolean(depois.verbetes['Plié']['8|4/4']),
    { ok: apagado.ok, chaves: Object.keys(depois.verbetes['Plié'] || {}) });
}

aGravacao().then(aTela).then(oDonoDoAlfabeto).then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — a música edita-se sempre, duplicar um trecho não a multiplica,');
  console.log('e o desacordo entre a música e a decomposição avisa em vez de apagar.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
