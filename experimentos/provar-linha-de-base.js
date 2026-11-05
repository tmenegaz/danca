'use strict';

/**
 * provar-linha-de-base.js — A LINHA DE BASE DO CORPO (05/11/2026).
 *
 * A DECISÃO QUE ESTA BANCADA GUARDA. A anamnese recolhe **24** aspectos do corpo (blocos 2 a 9, sem
 * os seis de musicalidade). O plano lia sempre os MESMOS **quinze**, escritos à mão no conteúdo
 * (`lidoDasAnamneses`) desde 02/11/2026 — a mesma lista para todos os professores, todas as turmas
 * e todos os ciclos. Ficavam de fora «Formato anatômico dos joelhos», «Arquitetura do arco
 * plantar», «Impulsão e absorção (allegro)», «Mobilidade e estabilidade da escápula», «Mobilidade
 * da coluna cervical» — que em balé clássico não são acessórios.
 *
 * A pesquisadora, 05/11/2026: «a definição do que compõe a Linha de Base do Corpo para um
 * determinado trabalho passa a ser uma escolha ativa e customizada do professor».
 *
 * O QUE SE PROVA, e por que cada coisa:
 *
 *   1. O RECORTE. Vinte e quatro campos, e a musicalidade de fora — porque ela é dos verbetes da
 *      notação, como a pesquisadora declarou. Se este número mudar sem que a anamnese mude, ou o
 *      filtro partiu, ou alguém voltou a escrever a lista à mão.
 *   2. A RECUSA. Um id que a anamnese não tem é RECUSADO na gravação, com o nome do campo. Um
 *      documento a apontar para um campo inexistente imprimiria uma linha vazia sem falhar.
 *   3. A AGREGAÇÃO. «Ponto de atenção» é o que NÃO está na primeira opção da anamnese — a régua é
 *      a ordem das opções, não um juízo do sistema. Se a anamnese mudar a ordem, isto acompanha.
 *   4. A CASCATA DE TRÊS PASSOS. Com linhas de base, a ordem é Produção → PE → PO; e uma linha de
 *      base mais velha do que a anamnese mais recente entra nas pendências. Sem linhas de base, a
 *      ordem fica a de antes (duas) — as escolas que ainda não têm nenhuma não vêem um aviso que
 *      não podem resolver.
 *   5. AS ROTAS, com um KV falso: criar, listar, agregar, apagar. E o `opcoes` da porta no
 *      formato que o `opcoesDe` do formulário lê — um formato a mais seria uma divergência.
 *   6. O A/B DA CASCATA: sem o passo 1, a linha de base velha NÃO é marcada. É o controle
 *      negativo que impede uma prova de passar por não medir nada.
 *
 *   node experimentos/provar-linha-de-base.js
 */

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const RAIZ = path.resolve(__dirname, '..');
const lb = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const ANAMNESE = require(path.join(RAIZ, 'porta/conteudo/anamnese.json'));

let passou = 0;
const falhas = [];
function ok(titulo, fn) {
  try { fn(); passou += 1; console.log('  ok   ' + titulo); }
  catch (erro) { falhas.push({ titulo, erro }); console.log('  FALHA ' + titulo + '\n        ' + erro.message); }
}
async function okAsync(titulo, fn) {
  try { await fn(); passou += 1; console.log('  ok   ' + titulo); }
  catch (erro) { falhas.push({ titulo, erro }); console.log('  FALHA ' + titulo + '\n        ' + erro.message); }
}

console.log('\n1. O RECORTE DO CORPO — o que a anamnese oferece à escolha');

const DISPONIVEIS = lb.camposDisponiveis(ANAMNESE);

ok('vinte e quatro campos de corpo, e não os quinze fixos de antes', () => {
  assert.strictEqual(DISPONIVEIS.length, 24,
    'a anamnese tem 24 campos de dimensão tecnica/funcional; veio ' + DISPONIVEIS.length);
});

ok('a MUSICALIDADE fica de fora — ela é dos verbetes da notação', () => {
  const musicais = ['musicalidade-e-pulsacao-ritmica', 'coordenacao-motora-e-dissociacao',
    'memoria-e-retencao-de-sequencias', 'discriminacao-de-lateralidade',
    'orientacao-espacial-basica', 'espiral-rotacao-de-tronco'];
  for (const id of musicais) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), false,
      'o campo de musicalidade «' + id + '» não pertence ao eixo do corpo');
  }
  // E o controle positivo, no mesmo bloco 9 que mistura as duas dimensões: o vestibular e as
  // cócoras são funcionais, e TÊM de estar. Sem esta metade, um filtro que devolvesse zero
  // campos também passaria.
  for (const id of ['estabilidade-vestibular-e-deslocamento', 'cocoras-profundas-squat',
    'coordenacao-fina-dedo-nariz']) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), true,
      '«' + id + '» é funcional e tem de estar no corpo');
  }
});

ok('os campos que o recorte fixo deixava de fora passam a estar disponíveis', () => {
  for (const id of ['formato-anatomico-dos-joelhos', 'arquitetura-do-arco-plantar',
    'impulsao-e-absorcao-allegro', 'mobilidade-e-estabilidade-da-escapula',
    'mobilidade-da-coluna-cervical-e-cabeca', 'mobilidade-de-quadril-pelve']) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), true,
      '«' + id + '» ficava fora dos quinze e tem de ser escolhível');
  }
});

ok('cada campo leva o nome, o bloco e a RÉGUA (as opções, na ordem da anamnese)', () => {
  const isquio = DISPONIVEIS.find((c) => c.id === 'flexibilidade-dos-isquiotibiais');
  assert.ok(isquio, 'o campo dos isquiotibiais tem de estar');
  assert.strictEqual(isquio.nome, 'Flexibilidade dos isquiotibiais');
  assert.strictEqual(isquio.grupo, 'Flexibilidade e Amplitude Articular');
  assert.deepStrictEqual(isquio.opcoes, ['Alta', 'Média', 'Baixa ("dura")'],
    'as opções vêm da anamnese e na ordem dela — é essa ordem que define «ponto de atenção»');
});

ok('a ordem é a da anamnese, bloco a bloco — não alfabética', () => {
  const blocos = DISPONIVEIS.map((c) => c.bloco);
  const ordenados = blocos.slice().sort((a, b) => a - b);
  assert.deepStrictEqual(blocos, ordenados, 'os campos saem na ordem dos blocos da anamnese');
});

console.log('\n2. A GRAVAÇÃO — o que é recusado, e porquê');

ok('sem nome é recusado', () => {
  const r = lb.normalizar({ campos: ['equilibrio-unipodal'] }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, false);
  assert.ok(/nome/i.test(r.erros.join(' ')), 'a recusa tem de dizer que falta o nome');
});

ok('sem campos é recusado — o vazio é o estado de quem ainda não criou', () => {
  const r = lb.normalizar({ nome: 'Turma infantil' }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, false);
  assert.ok(/pelo menos um/i.test(r.erros.join(' ')));
});

ok('um campo que a anamnese não tem é recusado, e o nome dele aparece', () => {
  const r = lb.normalizar({
    nome: 'X', campos: ['equilibrio-unipodal', 'flexibilidade-do-joelho-esquerdo'],
  }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, false);
  assert.ok(r.erros.join(' ').indexOf('flexibilidade-do-joelho-esquerdo') !== -1,
    'a recusa tem de nomear o campo que não casou');
});

ok('grava o NOME de cada campo, e não só o id — o passado não se reescreve', () => {
  const r = lb.normalizar({ nome: 'Nível 1', campos: ['equilibrio-unipodal'] },
    DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, true, r.erros && r.erros.join(' '));
  assert.deepStrictEqual(r.linha.campos[0], {
    id: 'equilibrio-unipodal',
    nome: 'Equilíbrio unipodal',
    grupo: 'Equilíbrio, Sustentação e Força de MMSS/Core',
  });
});

ok('a ordem dos campos é a da anamnese, mesmo que o pedido venha trocado', () => {
  const r = lb.normalizar({
    nome: 'X', campos: ['equilibrio-unipodal', 'formato-anatomico-dos-joelhos'],
  }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, true, r.erros && r.erros.join(' '));
  assert.deepStrictEqual(r.linha.campos.map((c) => c.id),
    ['formato-anatomico-dos-joelhos', 'equilibrio-unipodal'],
    'o joelho é do bloco 2 e o equilíbrio do bloco 8 — o joelho vem primeiro');
});

ok('o id é o slug do nome, e um id fornecido manda (renomear não perde o vínculo)', () => {
  const a = lb.normalizar({ nome: 'Nível 1 — mobilidade e pés', campos: ['equilibrio-unipodal'] },
    DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(a.linha.id, 'nivel-1-mobilidade-e-pes');
  const b = lb.normalizar({ id: 'nivel-1-mobilidade-e-pes', nome: 'Outro nome',
    campos: ['equilibrio-unipodal'] }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(b.linha.id, 'nivel-1-mobilidade-e-pes', 'o id explícito manda');
});

ok('o id repetido no pedido entra uma vez', () => {
  const r = lb.normalizar({ nome: 'X', campos: ['equilibrio-unipodal', 'equilibrio-unipodal'] },
    DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.linha.campos.length, 1);
});

console.log('\n3. A AGREGAÇÃO — o que a turma mostra, nos aspectos ESCOLHIDOS');

const LINHA = lb.normalizar({
  nome: 'Turma de prova',
  campos: ['flexibilidade-dos-isquiotibiais', 'equilibrio-unipodal'],
}, DISPONIVEIS, '2026-11-05T10:00:00Z').linha;

const ANAMNESES = [
  { aluna: 'Aluna A', respostas: {
    'flexibilidade-dos-isquiotibiais': 'Alta',
    'equilibrio-unipodal': 'Perda rápida',
  } },
  { aluna: 'Aluna B', respostas: {
    'flexibilidade-dos-isquiotibiais': 'Média',
    'equilibrio-unipodal': 'Mantém > 5 s sem oscilação severa',
  } },
  { aluna: 'Aluna C', respostas: {
    // A forma `{valor: …}` existe nos envelopes gravados, e tem de ser lida como o valor cru.
    'flexibilidade-dos-isquiotibiais': { valor: 'Baixa ("dura")' },
  } },
];

ok('conta os níveis e escreve «1 de 3 em «Alta»»', () => {
  const r = lb.agregar(LINHA, DISPONIVEIS, ANAMNESES);
  const isquio = r.linhas.find((l) => l.id === 'flexibilidade-dos-isquiotibiais');
  assert.ok(isquio, 'a linha dos isquiotibiais tem de estar');
  assert.strictEqual(isquio.quantas, 3);
  assert.strictEqual(isquio.texto, '1 de 3 em «Alta» · 1 de 3 em «Média» · 1 de 3 em «Baixa ("dura")»',
    'a ordem dentro do texto é a das opções da anamnese, não a da contagem');
});

ok('o PONTO DE ATENÇÃO é o que não está na primeira opção — e um só basta', () => {
  const r = lb.agregar(LINHA, DISPONIVEIS, ANAMNESES);
  const isquio = r.linhas.find((l) => l.id === 'flexibilidade-dos-isquiotibiais');
  const eq = r.linhas.find((l) => l.id === 'equilibrio-unipodal');
  assert.strictEqual(isquio.atencao, true, 'só uma aluna está em «Alta» — é atenção');
  assert.strictEqual(eq.atencao, true, 'só uma mantém > 5 s — é atenção');
  assert.strictEqual(r.atencao, 2);
});

ok('a turma TODA no melhor nível não é atenção — é excelência, e a distinção existe', () => {
  const r = lb.agregar(LINHA, DISPONIVEIS, [
    { aluna: 'A', respostas: { 'flexibilidade-dos-isquiotibiais': 'Alta' } },
    { aluna: 'B', respostas: { 'flexibilidade-dos-isquiotibiais': 'Alta' } },
  ]);
  const isquio = r.linhas.find((l) => l.id === 'flexibilidade-dos-isquiotibiais');
  assert.strictEqual(isquio.atencao, false);
  assert.strictEqual(isquio.excelente, true);
  assert.strictEqual(r.soExcelente, 1);
});

ok('os pontos de atenção vêm PRIMEIRO na lista', () => {
  const r = lb.agregar({
    campos: [
      { id: 'flexibilidade-dos-isquiotibiais', nome: 'Isquiotibiais' },
      { id: 'equilibrio-unipodal', nome: 'Equilíbrio' },
    ],
  }, DISPONIVEIS, [
    { aluna: 'A', respostas: {
      'flexibilidade-dos-isquiotibiais': 'Alta',
      'equilibrio-unipodal': 'Perda rápida',
    } },
    { aluna: 'B', respostas: {
      'flexibilidade-dos-isquiotibiais': 'Alta',
      'equilibrio-unipodal': 'Perda rápida',
    } },
  ]);
  // Os isquiotibiais estão todos em «Alta» (excelência); o equilíbrio está em atenção.
  assert.strictEqual(r.linhas[0].id, 'equilibrio-unipodal',
    'o que pede atenção tem de vir antes do que está bem');
});

ok('um campo que ninguém preencheu vai para «sem registo», e não é erro', () => {
  const r = lb.agregar(LINHA, DISPONIVEIS, ANAMNESES);
  assert.ok(r.semRegisto.indexOf('Equilíbrio unipodal') === -1,
    'o equilíbrio foi preenchido por duas — só a terceira não o tem');
  assert.strictEqual(r.alunos, 3);
});

ok('sem anamnese nenhuma não se inventa um número', () => {
  const r = lb.agregar(LINHA, DISPONIVEIS, []);
  assert.strictEqual(r.linhas.length, 0);
  assert.strictEqual(r.alunos, 0);
  assert.strictEqual(r.semRegisto.length, 2, 'os dois campos ficam sem registo');
});

console.log('\n4. A CASCATA — Produção → Plano de Ensino → Plano de Observação');

ok('uma anamnese mais recente do que a decisão faz a linha de base envelhecer', () => {
  const velha = lb.envelheceu({ atualizada_em: '2026-11-01T10:00:00Z' },
    ['2026-10-01T10:00:00Z', '2026-11-04T10:00:00Z']);
  assert.strictEqual(velha, '2026-11-04T10:00:00Z');
});

ok('se a linha de base é mais recente do que todos os retratos, está fresca', () => {
  assert.strictEqual(lb.envelheceu({ atualizada_em: '2026-11-05T10:00:00Z' },
    ['2026-11-04T10:00:00Z']), null);
});

ok('sem data de decisão não se afirma que está velha', () => {
  assert.strictEqual(lb.envelheceu({}, ['2026-11-04T10:00:00Z']), null,
    'um aviso que nunca cai deixa de se ler');
});

ok('sem anamnese nenhuma não se afirma nada', () => {
  assert.strictEqual(lb.envelheceu({ atualizada_em: '2026-11-01T10:00:00Z' }, []), null);
});

console.log('\n5. AS ROTAS — com um KV falso, como em produção');

/** Um KV em memória com a forma que o `env.PADD_KV` tem (get/put/delete). */
function kvFalso(inicial) {
  const mapa = new Map(Object.entries(inicial || {}));
  return {
    mapa,
    async get(chave) { return mapa.has(chave) ? mapa.get(chave) : null; },
    async put(chave, valor) { mapa.set(chave, valor); },
    async delete(chave) { mapa.delete(chave); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}

const ESCOLA = 'calango';
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

function envFalso(kv) {
  return { PADD_KV: kv, ESCOLA_SLUG: ESCOLA, SENHA_ADMIN: 'senha-de-prova' };
}

async function chamar(env, caminho, opcoes) {
  const pedido = new Request('https://' + ESCOLA + '.workers.dev' + caminho, opcoes);
  const resposta = await bastidores.fetch(pedido, env);
  const texto = await resposta.text();
  let corpo = null;
  try { corpo = JSON.parse(texto); } catch (e) { corpo = null; }
  return { status: resposta.status, texto, corpo };
}

(async () => {
  await okAsync('GET /api/bastidores/campos-do-corpo — vinte e quatro, com os grupos', async () => {
    const env = envFalso(kvFalso());
    const r = await chamar(env, '/api/bastidores/campos-do-corpo');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    assert.strictEqual(r.corpo.campos.length, 24);
    assert.ok(Array.isArray(r.corpo.grupos) && r.corpo.grupos.length >= 5,
      'os grupos vêm na ordem da anamnese, para a tela não os reordenar');
  });

  await okAsync('POST sem a senha da direção é recusado', async () => {
    const env = envFalso(kvFalso());
    const r = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'X', campos: ['equilibrio-unipodal'] }),
    });
    assert.strictEqual(r.status, 401, 'sem senha não se grava: ' + r.texto.slice(0, 120));
  });

  await okAsync('POST com um campo que a anamnese não tem é recusado (400)', async () => {
    const env = envFalso(kvFalso());
    const r = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'X', campos: ['nao-existe'], senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.strictEqual(r.status, 400, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    assert.ok(/nao-existe/.test(r.corpo.erro), 'a recusa nomeia o campo: ' + r.corpo.erro);
  });

  await okAsync('POST cria, GET lista, e a chave do KV é a mesma que a Produção usa', async () => {
    const kv = kvFalso();
    const env = envFalso(kv);
    const criar = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Nível 1 — mobilidade e pés',
        professor: 'rabo-gramde',
        campos: ['flexibilidade-dos-isquiotibiais', 'arquitetura-do-arco-plantar'],
        senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.strictEqual(criar.status, 201, 'HTTP ' + criar.status + ': ' + criar.texto.slice(0, 300));
    assert.strictEqual(criar.corpo.linha.id, 'nivel-1-mobilidade-e-pes');

    const guardado = JSON.parse(kv.mapa.get('bastidores/' + ESCOLA + '/linhas-de-base'));
    assert.strictEqual(guardado.length, 1, 'gravou na chave bastidores/<escola>/linhas-de-base');
    assert.strictEqual(guardado[0].campos.length, 2);

    const lista = await chamar(env, '/api/bastidores/linhas-de-base');
    assert.strictEqual(lista.status, 200);
    assert.strictEqual(lista.corpo.linhas.length, 1);
    assert.strictEqual(lista.corpo.linhas[0].nome, 'Nível 1 — mobilidade e pés');
  });

  await okAsync('salvar de novo com o mesmo id NÃO duplica — atualiza', async () => {
    const kv = kvFalso();
    const env = envFalso(kv);
    const corpo = {
      nome: 'Nível 1', campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
    };
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
    });
    const segundo = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, corpo, {
        campos: ['equilibrio-unipodal', 'cocoras-profundas-squat'],
      })),
    });
    assert.strictEqual(segundo.status, 200, 'o segundo é uma atualização, não uma criação');
    assert.strictEqual(segundo.corpo.criada, false);
    const lista = await chamar(env, '/api/bastidores/linhas-de-base');
    assert.strictEqual(lista.corpo.linhas.length, 1, 'não duplicou');
    assert.strictEqual(lista.corpo.linhas[0].campos.length, 2);
  });

  await okAsync('a leitura guardada é DESCARTADA quando os campos mudam', async () => {
    const chave = 'bastidores/' + ESCOLA + '/linhas-de-base';
    const kv = kvFalso({
      [chave]: JSON.stringify([{
        id: 'nivel-1', nome: 'Nível 1', professor: null,
        campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal', grupo: 'x' }],
        atualizada_em: '2026-11-01T10:00:00Z',
        leitura: { em: '2026-11-01T11:00:00Z', turma: 'Infantil', alunos: 3, linhas: [] },
      }]),
    });
    const env = envFalso(kv);
    // (a) gravar sem mudar os campos PRESERVA a leitura — reabrir e corrigir o nome não obriga a
    //     reler trinta anamneses.
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1 (novo nome)',
        campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
      }),
    });
    let guardado = JSON.parse(kv.mapa.get(chave))[0];
    assert.ok(guardado.leitura, 'com os mesmos campos, a leitura tem de sobreviver');
    // (b) mudar os campos DESCARTA-A — um número que já não corresponde ao recorte é pior do que
    //     nenhum.
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1',
        campos: ['equilibrio-unipodal', 'cocoras-profundas-squat'], senhaDirecao: 'senha-de-prova',
      }),
    });
    guardado = JSON.parse(kv.mapa.get(chave))[0];
    assert.strictEqual(guardado.leitura, undefined,
      'com campos novos, a leitura antiga descrevia outro recorte');
  });

  await okAsync('DELETE apaga, e diz quantos planos apontavam para ela', async () => {
    const env = envFalso(kvFalso());
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'A apagar', campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
      }),
    });
    const apagar = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'a-apagar', senhaDirecao: 'senha-de-prova' }),
    });
    assert.strictEqual(apagar.status, 200, 'HTTP ' + apagar.status + ': ' + apagar.texto.slice(0, 200));
    assert.strictEqual(apagar.corpo.ok, true);
    const lista = await chamar(env, '/api/bastidores/linhas-de-base');
    assert.strictEqual(lista.corpo.linhas.length, 0);
  });

  console.log('\n6. A CASCATA NO SERVIDOR — três passos, e o controle negativo');

  await okAsync('sem linhas de base, a ordem continua a de antes (duas)', async () => {
    const armazenamento = armazenamentoFalso();
    const r = await porta.revalidacaoPendente(armazenamento, null, []);
    assert.deepStrictEqual(r.ordem, ['plano-de-ensino', 'plano-de-observacao'],
      'as escolas que ainda não têm linha de base não podem ver um passo que não resolvem');
  });

  await okAsync('com uma linha de base velha, a ordem tem TRÊS passos e ela entra nas pendências', async () => {
    const armazenamento = armazenamentoFalso([
      { id: 'anamnese-20261104-1000', aluna: 'Aluna A', gerado_em: '2026-11-04T10:00:00Z' },
    ]);
    const linhas = [{
      id: 'nivel-1', nome: 'Nível 1', atualizada_em: '2026-11-01T10:00:00Z',
      campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
    }];
    const r = await porta.revalidacaoPendente(armazenamento, null, linhas);
    assert.deepStrictEqual(r.ordem,
      ['linha-de-base', 'plano-de-ensino', 'plano-de-observacao'],
      'Produção vem primeiro: o recorte do corpo é o que o PE fixa');
    const entrada = r.pendentes.get('linha-de-base:nivel-1');
    assert.ok(entrada, 'a linha de base velha tem de estar nas pendências');
    assert.strictEqual(entrada.familia, 'linha-de-base');
    assert.strictEqual(entrada.onde, 'producao', 'o sítio onde se resolve é a Produção');
  });

  await okAsync('CONTROLE NEGATIVO: sem o passo 1, a linha de base velha não é marcada', async () => {
    const armazenamento = armazenamentoFalso([
      { id: 'anamnese-20261104-1000', aluna: 'Aluna A', gerado_em: '2026-11-04T10:00:00Z' },
    ]);
    const linhas = [{
      id: 'nivel-1', nome: 'Nível 1', atualizada_em: '2026-11-01T10:00:00Z',
      campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
    }];
    // O A/B: a MESMA chamada, sem o terceiro argumento. Se o passo 1 não dependesse dele, esta
    // prova passaria — e estaria a medir o nada.
    const sem = await porta.revalidacaoPendente(armazenamento, null);
    assert.strictEqual(sem.pendentes.get('linha-de-base:nivel-1'), undefined,
      'sem as linhas de base, a cascata não as pode marcar');
    assert.deepStrictEqual(sem.ordem, ['plano-de-ensino', 'plano-de-observacao']);
  });

  await okAsync('uma linha de base MAIS NOVA do que a anamnese não entra nas pendências', async () => {
    const armazenamento = armazenamentoFalso([
      { id: 'anamnese-20261101-1000', aluna: 'Aluna A', gerado_em: '2026-11-01T10:00:00Z' },
    ]);
    const linhas = [{
      id: 'nivel-1', nome: 'Nível 1', atualizada_em: '2026-11-04T10:00:00Z',
      campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
    }];
    const r = await porta.revalidacaoPendente(armazenamento, null, linhas);
    assert.strictEqual(r.pendentes.get('linha-de-base:nivel-1'), undefined);
  });

  console.log('\n7. O CONTEÚDO DO PLANO — a lista fixa saiu, o vínculo entrou');

  const PLANO = require(path.join(RAIZ, 'porta/plano/conteudo/plano.json'));
  const bloco10 = PLANO.blocos.find((b) => b.bloco === 10);
  const aspecto = bloco10.campos.find((c) => c.id === 'aspecto-fisico');
  const alvo = bloco10.campos.find((c) => c.id === 'linha-de-base-alvo');

  ok('o nó «aspecto-fisico» já não declara `lidoDasAnamneses` (os quinze fixos saíram)', () => {
    assert.strictEqual(aspecto.lidoDasAnamneses, undefined,
      'a lista fixa de quinze foi o que esta mudança veio substituir');
    assert.ok(aspecto.lidoDaLinhaDeBase, 'passa a declarar de onde lê: a linha de base');
    assert.strictEqual(aspecto.lidoDaLinhaDeBase.alvo, 'linha-de-base-alvo');
    assert.strictEqual(aspecto.lidoDaLinhaDeBase.turma, 'contexto-turma');
  });

  ok('existe o nó da escolha, e ele busca as opções à rota da escola', () => {
    assert.ok(alvo, 'o nó `linha-de-base-alvo` tem de existir no bloco do aspecto físico');
    assert.strictEqual(alvo.opcoesDe, 'api/linhas-de-base',
      'as opções vêm da escola, e não do conteúdo — a linha de base é criada em Produção');
    assert.strictEqual(alvo.obrigatorio, false,
      'não é obrigatório no formulário: a obrigação vive na cascata, e uma barreira aqui '
      + 'quebraria todos os planos já gravados sem migração');
  });

  ok('o título do bloco perdeu «força e flexibilidade»', () => {
    assert.strictEqual(/força e flexibilidade/i.test(bloco10.titulo), false,
      'o título prometia a lista fixa que já não existe: «' + bloco10.titulo + '»');
    assert.ok(/aspecto físico/i.test(bloco10.titulo), 'continua a dizer o que é: ' + bloco10.titulo);
  });

  ok('o motor repassa a declaração à tela (senão a chave morria em silêncio)', () => {
    const elicitar = require(path.join(RAIZ, 'motor/nucleo/elicitar.js'));
    const nos = elicitar.nosRespondiveis(PLANO);
    const daTela = nos.find((n) => n.id === 'aspecto-fisico');
    assert.ok(daTela.lidoDaLinhaDeBase, 'o descritor tem de chegar à tela');
    const doAlvo = nos.find((n) => n.id === 'linha-de-base-alvo');
    assert.strictEqual(doAlvo.opcoesDe, 'api/linhas-de-base',
      'sem este repasse o campo saía como texto livre');
  });

  console.log('\n' + (falhas.length ? falhas.length + ' de ' + (passou + falhas.length)
    : 'TUDO CERTO — ' + passou) + (falhas.length ? ' verificações FALHARAM' : ' asserções, 0 falha(s).'));
  if (falhas.length) {
    for (const f of falhas) console.log('\n✗ ' + f.titulo + '\n  ' + f.erro.message);
    process.exit(1);
  }
})();

/**
 * Um armazenamento falso com a forma que `porta.js` lê: um índice e um leitor de arquivos.
 *
 * `resumosDeEnvelopes` percorre o índice; `lerEnvelope` lê o arquivo. Basta o que a cascata usa —
 * e é de propósito que não se monta um repositório inteiro: o que se mede aqui é a REGRA, não o
 * adaptador (esse mede-se em `provar-apagar-o-ciclo`).
 */
function armazenamentoFalso(anamneses) {
  const lista = Array.isArray(anamneses) ? anamneses : [];
  const arquivos = new Map();
  for (const a of lista) {
    arquivos.set('envelope/' + a.id + '.json', JSON.stringify({
      id: a.id,
      gerado_em: a.gerado_em,
      // O APELIDO VEM DO CONTEXTO, não de uma resposta: é o que a lista mostra, e é assim que
      // `resumoDoEnvelope` o deriva. Pô-lo em `respostas` daria um envelope que a bancada lê e
      // que a produção não (o sintoma seria um `undefined` silencioso em `anamneseDe`).
      contexto: { escola: 'calango', professor: 'rabo-gramde', aluna: a.aluna },
      respostas: { sujeitos: { valor: [a.aluna] } },
    }));
  }
  return {
    /* O ÍNDICE NÃO EXISTE — e isso é o caso REAL de uma escola que ainda não o reconstruiu. O
     * `lerIndice` enumera e reconstrói, que é o caminho de produção; um índice escrito à mão na
     * bancada mediria o formato do fixture, não a regra. */
    async ler(chave) {
      const k = String(chave);
      return arquivos.has(k) ? arquivos.get(k) : null;
    },
    async listar(prefixo) {
      const p = String(prefixo || '');
      return [...arquivos.keys()].filter((k) => k.startsWith(p));
    },
    async escrever(chave, texto) { arquivos.set(String(chave), String(texto)); },
    async apagar(chave) { arquivos.delete(String(chave)); },
  };
}
