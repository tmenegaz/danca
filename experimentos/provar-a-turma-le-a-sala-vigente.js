#!/usr/bin/env node
'use strict';

/**
 * provar-a-turma-le-a-sala-vigente.js — A TURMA LÊ A SALA QUE VALE, E NÃO A PRIMEIRA DA HISTÓRIA
 * (19/11/2026).
 *
 * O RELATO DELA, e é a letra do que a tela devolveu:
 *
 *   «Fui criar uma turma na rota bastidores produção e não deu certo. Gerou o seguinte erro: Erro: a
 *   sala «Rosa» ainda não diz o professor e a modalidade […] Complete a modalidade, no passo 1; o
 *   professor, no passo 2 (aba Salas, em «Editar»), e atribua depois.»
 *
 * O QUE ESTAVA A ACONTECER, medido no ar da `breu` antes de tocar em código: o `GET
 * /api/bastidores/turmas` devolvia UMA sala «Rosa», com `professor: "demi-plie"` e `modalidade:
 * "Balé clássico"`; o `GET /api/bastidores/curadoria-meta` devolvia **OITO** opções «Rosa». Oito,
 * porque a sala deriva — cada correcção deixa um elo com o mesmo nome e um `substituidaPor`.
 *
 * E a rota da Turma procurava a sala assim:
 *
 *   (await turmas(kv, escola)).find(t => String(t.nome) === 'Rosa')      ← a HISTÓRIA inteira
 *
 * O `find` devolve o primeiro, e o primeiro é o elo MAIS ANTIGO — o que foi gravado antes de a sala
 * saber o par. Daí o par vir vazio, a Turma não nascer, e a frase mandar completar uma sala que já
 * estava completa.
 *
 * O QUE ESTA PROVA MEDE — e cada alínea reprova no código de antes:
 *
 *   A. A CRIAÇÃO. Com oito «Rosa» na história e o par no elo vigente, o `POST /curadoria` responde
 *      201 e a Turma nasce com o professor e a modalidade da sala — e com o id do trio, não com o
 *      degenerado `-rosa`.
 *   B. O FORMULÁRIO. O `curadoria-meta` oferece UMA «Rosa», não oito: o que não vale não se
 *      escolhe.
 *   C. A DERIVAÇÃO. A turma que nasceu sem par (o dano que já está gravado) deriva-se com o par
 *      tirado da SALA — a origem declarada do par desde 18/11 —, e não herdado do elo vazio.
 *   D. A FRASE. Quando a sala ainda não diz o par, a recusa manda ao passo «Associar» — onde a
 *      modalidade e o professor passaram a viver os dois a 19/11 —, e não ao «passo 1».
 *   E. A MARCA. A `descontinuada` cai do elo VIGENTE; antes caía (ou não caía) no elo antigo, e o
 *      registo que a listagem mostra ficava marcado para sempre.
 *
 * O CONTROLADOR NEGATIVO. Com `--contra=<ref>` a prova corre contra o código de antes e TEM de
 * reprovar. `--contra=HEAD` mede nada depois de a correcção entrar, porque o HEAD passa a ser o
 * código novo: o negativo quer o pacote ANTERIOR.
 *
 *   node experimentos/provar-a-turma-le-a-sala-vigente.js
 *   node experimentos/provar-a-turma-le-a-sala-vigente.js --contra=af365efa
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const REF = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let DESTINO = RAIZ;
if (REF) {
  DESTINO = fs.mkdtempSync(path.join(os.tmpdir(), 'turma-le-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(DESTINO), { cwd: RAIZ, stdio: 'pipe' });
  const modulos = path.join(RAIZ, 'node_modules');
  if (fs.existsSync(modulos)) fs.symlinkSync(modulos, path.join(DESTINO, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const bastidores = require(path.join(DESTINO, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
const bloco = (t) => console.log('\n' + t);

/* ------------------------------------------------------------------------------------------ */
/* O PALCO — a escola `breu` em memória, com o estado que se mediu no ar. */

const CHAVE_TURMAS = 'bastidores/breu/turmas';
const CHAVE_CURADORIAS = 'bastidores/breu/curadorias';

const PAR = { professor: 'demi-plie', modalidade: 'Balé clássico' };

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
    async list(op) {
      const p = (op && op.prefix) || '';
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(p)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    _dados: dados,
  };
}

/**
 * A SALA «ROSA» COMO ELA ESTÁ GRAVADA: sete elos antigos (todos com o mesmo nome, todos sem o par,
 * cada um a apontar para o seguinte) e o oitavo, o vigente. É a forma que a derivação produz e a
 * que se contou no ar.
 */
function historiaDaRosa({ comPar = true, marcaNoVigente = false } = {}) {
  const lista = [];
  const ritmo = {
    ordem: -2, frequencia: 3, dias: ['seg', 'qua', 'sex'],
    horarios: { seg: '16:30', qua: '16:30', sex: '16:30' },
    duracaoMin: 45, periodoInicio: '2026-12-14', periodoFim: '2027-02-05', ativo: true,
  };
  for (let i = 0; i < 7; i += 1) {
    lista.push(Object.assign({ id: 'rosa-2026111' + i, nome: 'Rosa' }, ritmo,
      { substituidaPor: 'rosa-2026111' + (i + 1) }));
  }
  lista.push(Object.assign({ id: 'rosa-20261118', nome: 'Rosa' }, ritmo,
    comPar ? PAR : {}, marcaNoVigente ? { descontinuada: true } : {}));
  return lista;
}

function ambiente(kv) {
  return { ESCOLA_SLUG: 'breu', SENHA_ADMIN: 'senha-da-prova', PADD_KV: kv };
}

async function pedir(kv, rota, corpo) {
  const r = await bastidores.fetch(new Request('https://breu.padd.com.br' + rota, {
    method: corpo ? 'POST' : 'GET',
    headers: corpo ? { 'content-type': 'application/json' } : undefined,
    body: corpo ? JSON.stringify(Object.assign({ senhaDirecao: 'senha-da-prova' }, corpo)) : undefined,
  }), ambiente(kv));
  let json = null;
  try { json = await r.json(); } catch (e) { json = null; }
  return { status: r.status, corpo: json };
}

function escola(extra) {
  return Object.assign({
    [CHAVE_TURMAS]: JSON.stringify(historiaDaRosa()),
    [CHAVE_CURADORIAS]: JSON.stringify([]),
    'bastidores/breu/professores': JSON.stringify([{ nome: 'Demi Plié', slug: 'demi-plie' }]),
    'bastidores/breu/alunas': JSON.stringify(['Aluna A']),
  }, extra || {});
}

(async () => {
  /* ========================================================================================= */
  bloco('A. A criação: a Turma nasce com o par da sala que vale');

  {
    const kv = kvDeMentira(escola());
    const r = await pedir(kv, '/api/bastidores/curadoria', { turma: 'Rosa' });
    provar('a criação responde 201', r.status === 201, r.corpo && r.corpo.erro);
    const c = (r.corpo && r.corpo.curadoria) || {};
    provar('…o professor veio da sala vigente', c.professor === PAR.professor, c.professor);
    provar('…e a modalidade também', c.modalidade === PAR.modalidade, c.modalidade);
    provar('…e a turma é a «Rosa» pedida', Array.isArray(c.turmas) && c.turmas[0] === 'Rosa', c.turmas);
    provar('…e o id diz o trio, não o degenerado `-rosa`',
      typeof c.id === 'string' && c.id.indexOf('-') !== 0 && /demi-plie/.test(c.id), c.id);
    /* O REGISTO GRAVADO, e não só a resposta: é ele que o plano e a porta leem. */
    const gravadas = JSON.parse(kv._dados.get(CHAVE_CURADORIAS) || '[]');
    provar('…e ficou gravado com o par',
      gravadas.length === 1 && gravadas[0].professor === PAR.professor,
      gravadas.length);
  }

  /* ========================================================================================= */
  bloco('B. O formulário: uma «Rosa», e não oito');

  {
    const kv = kvDeMentira(escola());
    const r = await pedir(kv, '/api/bastidores/curadoria-meta');
    const opcoes = ((r.corpo && r.corpo.turmas) || []).filter((t) => t && t.valor === 'Rosa');
    provar('o `curadoria-meta` oferece UMA «Rosa»', opcoes.length === 1, opcoes.length);
  }

  /* ========================================================================================= */
  bloco('C. A derivação: o par vem da sala, não do elo vazio');

  {
    /* O DANO QUE JÁ ESTÁ GRAVADO: uma turma nascida antes da guarda, com o par vazio e o id
     * degenerado. Derivar é o gesto que a corrige — e ele tem de a corrigir de facto. */
    const degenerada = { id: '-rosa', professor: '', modalidade: '', tradicao: '',
      turmas: ['Rosa'], alunas: [] };
    const kv = kvDeMentira(escola({ [CHAVE_CURADORIAS]: JSON.stringify([degenerada]) }));
    const r = await pedir(kv, '/api/bastidores/curadoria-derivar', { derivarDe: '-rosa' });
    provar('a derivação responde 201', r.status === 201, r.corpo && r.corpo.erro);
    const c = (r.corpo && r.corpo.curadoria) || {};
    provar('…o professor novo vem da sala', c.professor === PAR.professor, c.professor);
    provar('…e a modalidade também', c.modalidade === PAR.modalidade, c.modalidade);
    provar('…e o elo novo substitui o degenerado', c.substitui === '-rosa', c.substitui);
  }

  /* ========================================================================================= */
  bloco('D. A frase da recusa manda ao sítio onde o par se escolhe');

  {
    const kv = kvDeMentira(escola({ [CHAVE_TURMAS]: JSON.stringify(historiaDaRosa({ comPar: false })) }));
    const r = await pedir(kv, '/api/bastidores/curadoria', { turma: 'Rosa' });
    const erro = String((r.corpo && r.corpo.erro) || '');
    provar('sem par, a criação é recusada com 400', r.status === 400, r.status);
    provar('…a frase diz o que falta', /ainda não diz o professor e a modalidade/.test(erro), erro.slice(0, 90));
    provar('…e manda ao passo «Associar»', /passo «Associar»/.test(erro), erro.slice(0, 220));
    /* A FRASE ERRADA, na letra dela: «Complete a modalidade, no passo 1». A modalidade saiu do
     * passo 1 a 19/11 — o cadastro da sala ficou com o nome, os dias, a duração e o período. */
    provar('…e NÃO manda a modalidade a um «passo 1» que já não a tem',
      !/passo 1/.test(erro), erro.slice(0, 220));
  }

  /* ========================================================================================= */
  bloco('E. A marca `descontinuada` cai do elo vigente');

  {
    const kv = kvDeMentira(escola({
      [CHAVE_TURMAS]: JSON.stringify(historiaDaRosa({ marcaNoVigente: true })),
    }));
    const r = await pedir(kv, '/api/bastidores/curadoria', { turma: 'Rosa' });
    provar('a criação responde 201', r.status === 201, r.corpo && r.corpo.erro);
    const depois = JSON.parse(kv._dados.get(CHAVE_TURMAS) || '[]');
    const vigente = depois.find((t) => t && t.id === 'rosa-20261118');
    provar('…e o vigente deixou de estar marcado',
      !!vigente && vigente.descontinuada === undefined,
      vigente && vigente.descontinuada);
    const antigo = depois.find((t) => t && t.id === 'rosa-20261110');
    provar('…e o elo antigo não foi tocado', !!antigo && antigo.id === 'rosa-20261110',
      antigo && antigo.id);
  }

  /* ========================================================================================= */
  bloco('F. A folha do plano lê o ritmo da sala que vale');

  {
    /* A MESMA LEITURA, DO OUTRO LADO DO PRODUTO: a folha do plano recebia a lista inteira e
     * procurava pelo nome — o elo mais antigo, e o documento lia o ritmo de quando a sala nasceu.
     * Aqui o elo velho declara 30 minutos e o vigente 45; o documento tem de dizer 45. */
    const ficha = require(path.join(DESTINO, 'motor/nucleo/ficha-do-plano.js'));
    const conteudo = require(path.join(DESTINO, 'porta/plano/conteudo/plano.json'));
    const historia = [
      { id: 'rosa-0', nome: 'Rosa', dias: ['seg'], duracaoMin: 30,
        periodoInicio: '2026-01-01', periodoFim: '2026-02-01', substituidaPor: 'rosa-1' },
      { id: 'rosa-1', nome: 'Rosa', dias: ['seg', 'qua', 'sex'], duracaoMin: 45,
        periodoInicio: '2026-12-14', periodoFim: '2027-02-05' },
    ];
    const folha = ficha.renderizar(conteudo, {
      contexto: { turma: 'Rosa' },
      respostas: { 'contexto-turma': { valor: 'Rosa' } },
      _turmas: historia,
    });
    const corpo = String(folha.markdown || '');
    provar('a folha diz a duração da sala vigente', /45 minutos/.test(corpo),
      (corpo.split('\n').find((l) => /Duração por aula/.test(l)) || '').slice(0, 80));
    provar('…e não a do elo antigo', !/30 minutos/.test(corpo), null);
  }

  console.log('\n' + n + ' asserções, ' + falhas + ' falhas');
  process.exitCode = falhas ? 1 : 0;
})().catch((erro) => {
  console.error('\nA BANCADA REBENTOU: ' + (erro && erro.stack ? erro.stack : erro));
  process.exitCode = 2;
});
