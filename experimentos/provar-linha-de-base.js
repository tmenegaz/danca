'use strict';

/**
 * provar-linha-de-base.js — A LINHA DE BASE DO CORPO (05/11/2026).
 *
 * A DECISÃO QUE ESTA BANCADA GUARDA. A anamnese recolhe **30** aspectos (blocos 2 a 9). O plano lia
 * sempre os MESMOS **quinze**, escritos à mão no conteúdo (`lidoDasAnamneses`) desde 02/11/2026 — a
 * mesma lista para todos os professores, todas as turmas e todos os ciclos. Ficavam de fora «Formato
 * anatômico dos joelhos», «Arquitetura do arco plantar», «Impulsão e absorção (allegro)»,
 * «Mobilidade e estabilidade da escápula», «Mobilidade da coluna cervical» — que em balé clássico
 * não são acessórios.
 *
 * E A PRIMEIRA VERSÃO DESTA ENTREGA CORTOU OUTRA COISA: os seis campos de **musicalidade**, com o
 * argumento de que «já são tratados nos verbetes da notação». Ela desmontou-o — «a musicalidade não
 * nasce por geração espontânea, ela é trabalhada, nem tampouco acontece por osmose» — e a bancada
 * passou a exigir os seis, e não a sua ausência. Uma asserção que exigisse a falta deles estaria a
 * prender o defeito ao repositório.
 *
 * A pesquisadora, 05/11/2026: «a definição do que compõe a Linha de Base do Corpo para um
 * determinado trabalho passa a ser uma escolha ativa e customizada do professor».
 *
 * O QUE SE PROVA, e por que cada coisa:
 *
 *   1. O RECORTE. Trinta campos, nas três dimensões — técnica, funcional e musicalidade. Se este
 *      número mudar sem que a anamnese mude, ou o recorte partiu, ou alguém voltou a escrever a
 *      lista à mão.
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

console.log('\n1. O RECORTE — o que a anamnese oferece à escolha');

const DISPONIVEIS = lb.camposDisponiveis(ANAMNESE);

ok('TRINTA campos — todos os da anamnese, e não os quinze fixos de antes', () => {
  assert.strictEqual(DISPONIVEIS.length, 30,
    'a anamnese tem 30 campos nos blocos 2 a 9; veio ' + DISPONIVEIS.length);
});

ok('a MUSICALIDADE ENTRA — o corte anterior era erro meu, e o argumento é pedagógico', () => {
  /* A PRIMEIRA VERSÃO EXCLUÍA ESTES SEIS, e a bancada EXIGIA a exclusão. Ela corrigiu:
   * «a musicalidade não nasce por geração espontânea, ela é trabalhada, nem tampouco acontece por
   * osmose». O verbete é onde ela se ENSINA; a anamnese é onde ela se MEDE. Uma asserção que
   * exigisse a ausência destes campos estaria a prender o defeito ao repositório — e é por isso
   * que ela foi invertida, e não apagada. */
  const musicais = ['musicalidade-e-pulsacao-ritmica', 'coordenacao-motora-e-dissociacao',
    'memoria-e-retencao-de-sequencias', 'discriminacao-de-lateralidade',
    'orientacao-espacial-basica', 'espiral-rotacao-de-tronco'];
  for (const id of musicais) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), true,
      'o campo de musicalidade «' + id + '» tem de estar: é um aspecto que se trabalha');
  }
  // E o controle positivo do outro lado, no mesmo bloco 9 que mistura as duas dimensões: se um
  // filtro inverso passasse a excluir o funcional, esta metade reprovava.
  for (const id of ['estabilidade-vestibular-e-deslocamento', 'cocoras-profundas-squat',
    'coordenacao-fina-dedo-nariz']) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), true,
      '«' + id + '» é funcional e tem de estar também');
  }
});

ok('as três dimensões estão representadas, e a soma fecha nos trinta', () => {
  const por = {};
  for (const c of DISPONIVEIS) por[c.dimensao] = (por[c.dimensao] || 0) + 1;
  assert.deepStrictEqual(por, { tecnica: 9, funcional: 15, musicalidade: 6 },
    'nove de técnica, quinze de funcional e seis de musicalidade: ' + JSON.stringify(por));
});

ok('cada campo declara o seu EIXO — a dimensão não filtra, mas diz onde o aspecto cai', () => {
  const musical = DISPONIVEIS.find((c) => c.id === 'musicalidade-e-pulsacao-ritmica');
  assert.strictEqual(musical.eixo, 'Musicalidade');
  const funcional = DISPONIVEIS.find((c) => c.id === 'equilibrio-unipodal');
  assert.strictEqual(funcional.eixo, 'Funcional');
  const tecnico = DISPONIVEIS.find((c) => c.id === 'arquitetura-do-arco-plantar');
  assert.strictEqual(tecnico.eixo, 'Técnica');
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
  await okAsync('GET /api/bastidores/campos-do-corpo — trinta, com os grupos', async () => {
    const env = envFalso(kvFalso());
    const r = await chamar(env, '/api/bastidores/campos-do-corpo');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    assert.strictEqual(r.corpo.campos.length, 30, 'os trinta campos da anamnese');
    assert.ok(r.corpo.campos.some((c) => c.dimensao === 'musicalidade'),
      'e a musicalidade tem de vir na resposta da rota, não só na do núcleo');
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

  console.log('\n8. AS ALUNAS, E NÃO A TURMA — a correcção de desenho de 05/11/2026');

  await okAsync('a linha de base guarda as ALUNAS do recorte, e não uma turma', async () => {
    const kv = kvFalso();
    const env = envFalso(kv);
    const r = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Recorte da Aluna A', professor: 'rabo-gramde',
        alunas: ['Aluna A', 'Aluna B'], campos: ['equilibrio-unipodal'],
        senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.strictEqual(r.status, 201, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 300));
    assert.deepStrictEqual(r.corpo.linha.alunas, ['Aluna A', 'Aluna B'],
      'a lista de alunas tem de ir gravada — é ela que decide de quem é o corpo');
    assert.strictEqual(r.corpo.linha.turma, undefined,
      'a turma NÃO pertence a este registo: a turma nasce na curadoria');
  });

  await okAsync('a LEITURA do passo 3 lê as anamneses das ALUNAS escolhidas', async () => {
    const chave = 'bastidores/' + ESCOLA + '/linhas-de-base';
    const kv = kvFalso({
      [chave]: JSON.stringify([{
        id: 'recorte-a', nome: 'Recorte A', professor: null,
        alunas: ['Aluna A'],
        campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal', grupo: 'x' }],
        atualizada_em: '2026-11-05T10:00:00Z',
      }]),
    });
    const env = envFalso(kv);
    /* Sem acervo (o KV falso não tem envelopes), a resposta é o estado vazio DITO — e é isso que
     * se mede aqui: a rota não inventa uma tabela. A leitura real das anamneses está provada na
     * secção 3, com envelopes. */
    const r = await chamar(env, '/api/bastidores/linha-de-base/leitura?id=recorte-a&alunas=Aluna%20A');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    assert.strictEqual(r.corpo.semAnamneses, true,
      'sem retratos, a resposta DIZ que não há — em vez de devolver uma tabela vazia');
    assert.ok(/anamnese/i.test(r.corpo.erro || ''), 'a mensagem fala de anamnese: ' + r.corpo.erro);
  });

  /* A TELA. O que se prova aqui é o que ela EMITE: a secção nova tem a lista de alunas e não a de
   * turmas, o botão de gravar nasce travado, e a seta do título é a da secção (data-acordeao) e não
   * um id solto — que era o defeito que fazia o clique não fazer nada. */
  const PAGINA = (() => {
    const b = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
    const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
    return b.paginaProducao('calango', { nome: 'Calango', modalidade: 'bale-classico' },
      [], [], 'Dono', 'dono', [], [], {}, [], [], [], usos,
      { modo: 'clara', paleta: 'bordo' }, '');
  })();

  ok('a secção escolhe ALUNAS, e já não pede turma', () => {
    assert.ok(PAGINA.indexOf('id="lb-alunas"') !== -1, 'a lista de alunas tem de estar na tela');
    assert.strictEqual(PAGINA.indexOf('id="lb-turma"'), -1,
      'o campo de turma saiu: a turma nasce na curadoria, não aqui');
  });

  ok('sem anamnese o botão de gravar nasce DESABILITADO', () => {
    assert.ok(/id="lb-enviar"[^>]*disabled/.test(PAGINA),
      'o «Gravar» não pode estar activo quando não há retrato nenhum');
    assert.ok(/id="lb-ler"[^>]*disabled/.test(PAGINA),
      'e o «Ler as anamneses» também não');
  });

  ok('a seta do título recolhe a PRÓPRIA secção (data-acordeao), e não um id solto', () => {
    /* O defeito medido: `tituloComAcordeao(..., 'corpo-alternar-form')` dava ao botão um `id` e
     * NENHUM `data-acordeao`; o handler cai então no ramo do recolhedor das TURMAS, que não está
     * na página, e o clique não faz nada. A seta tem de declarar a secção. */
    assert.ok(/data-acordeao="sec-corpo"/.test(PAGINA),
      'sem data-acordeao a seta não recolhe nada');
    assert.ok(/SECOES_COM_ACORDEAO = \[[^\]]*"sec-corpo"/.test(PAGINA),
      'e a secção tem de estar na lista que o arranque aplica');
  });

  console.log('\n9. O CICLO SAIU DA ANAMNESE — e era ele que fechava o formulário');

  const LISTA = (() => {
    const l = require(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'));
    return l;
  })();

  /* O PAR QUE IMPORTA, e é o RESULTADO e não a condição: o painel é renderizado nos dois sentidos.
   * Um `regex` sobre o ficheiro provaria que a condição existe; isto prova que ela produz o que se
   * quer. O controle positivo — o plano de ensino continua a pedir o ciclo — impede que uma
   * correcção que apagasse o campo de todos os atos passasse. */
  ok('o painel da ANAMNESE já não desenha o campo ciclo, e o do PLANO continua a desenhá-lo', () => {
    assert.ok(typeof LISTA.painelDoAto === 'function', 'o painel tem de ser renderizável fora da página');
    const daAnamnese = LISTA.painelDoAto('anamnese', 'calango');
    const doPlano = LISTA.painelDoAto('plano-de-ensino', 'calango');
    assert.strictEqual(/id="ato-ciclo"/.test(daAnamnese), false,
      'a anamnese é do sujeito e atemporal: não pede ciclo');
    assert.strictEqual(/id="ato-ciclo"/.test(doPlano), true,
      'no plano o ciclo é a posição na cadeia — o campo fica');
    assert.strictEqual(/id="ato-aluna"/.test(daAnamnese), true,
      'e a anamnese continua a pedir a aluna, que é o sujeito do ato');
  });

  ok('nenhum campo da anamnese exige ciclo (o botão não pode ficar travado para sempre)', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'), 'utf8');
    assert.ok(/if \(!CFG\.ehAnamnese && !valor\('ciclo'\)\) falta\.push\('ciclo'\)/
      .test(fonte), 'exigir um campo que não se vê é a pior das travas: nunca habilita');
  });

  ok('o bilhete do ato não leva ciclo quando o ato é a anamnese', () => {
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'), 'utf8');
    assert.ok(/ciclo: CFG\.ehAnamnese \? '' : valor\('ciclo'\)/.test(fonte),
      'um ato sem ciclo não declara ciclo');
  });

  ok('a porta não confere o ciclo do bilhete quando a fonte é a anamnese', () => {
    const porta = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
    assert.ok(/FONTE === 'anamnese'\s*\n?\s*\|\| String\(r\.ato\.ciclo/.test(porta),
      'a conferência do bilhete tem de ser por ato: pedir à anamnese um ciclo que ela não tem '
      + 'recusa todos os bilhetes, e a página volta à lista');
  });

  ok('a porta esconde o campo do ciclo na anamnese (e o `hidden` vem do servidor)', () => {
    const porta = fs.readFileSync(path.join(RAIZ, 'porta/index.html'), 'utf8');
    assert.ok(/id="ctx-ciclo-campo"\$\{FONTE === 'anamnese' \? ' hidden' : ''\}/.test(porta),
      'escondido no markup, e não por JavaScript depois de pintar — senão aparece por um instante');
  });

  console.log('\n10. OS CINCO PASSOS — a trava, a classificação e a etiqueta NOVO');

  ok('as quatro leituras do passo 3, e cada uma responde a uma pergunta diferente', () => {
    const c = lb.classificar(DISPONIVEIS, [
      { aluna: 'A', respostas: {
        'arquitetura-do-arco-plantar': 'Normal/curvo',
        'musicalidade-e-pulsacao-ritmica': 'Precisa desenvolver',
        'equilibrio-unipodal': 'Perda rápida',
      } },
      { aluna: 'B', respostas: {
        'arquitetura-do-arco-plantar': 'Normal/curvo',
        'musicalidade-e-pulsacao-ritmica': 'Precisa desenvolver',
        'equilibrio-unipodal': 'Perda rápida',
      } },
    ]);
    // 1. O QUE PRECISA DE SER TRABALHADO: a musicalidade está abaixo do melhor nível.
    assert.ok(c.atencao.some((x) => x.id === 'musicalidade-e-pulsacao-ritmica'),
      'a musicalidade abaixo do melhor nível é um ponto de atenção');
    // 2. O QUE JÁ É BOM: o arco plantar está no melhor nível nas duas.
    assert.ok(c.excelencia.some((x) => x.id === 'arquitetura-do-arco-plantar'),
      'o arco plantar no melhor nível é excelência');
    assert.strictEqual(c.atencao.some((x) => x.id === 'arquitetura-do-arco-plantar'), false,
      'e não é atenção — as duas listas são perguntas diferentes ao mesmo dado');
    // 3. A MUSICALIDADE: o eixo completo, e não só o que está bem ou mal.
    assert.ok(c.musicalidade.length >= 1, 'o eixo musical tem de vir inteiro');
    assert.ok(c.musicalidade.every((x) => x.dimensao === 'musicalidade'));
    // 4. O QUE O GRUPO TEM EM COMUM: as duas deram a mesma resposta nos três.
    assert.strictEqual(c.comuns.length, 3, 'os três campos são unânimes');
    assert.ok(c.comuns.every((x) => x.unanimidade === true));
  });

  ok('o campo com a lista invertida não é contado como atenção quando está bem', () => {
    /* «Mobilidade da coluna cervical e cabeça» tem as opções na ordem INVERSa — a primeira
     * descreve uma limitação. O código supunha que a primeira era sempre o melhor nível, e com a
     * suposição uma aluna com a coluna perfeita entrava como ponto de atenção. O conteúdo passou
     * a declarar `referencia` neste campo, e é isso que se mede aqui. */
    const cerv = DISPONIVEIS.find((c) => c.id === 'mobilidade-da-coluna-cervical-e-cabeca');
    assert.strictEqual(cerv.referencia, 'Flexão/extensão/rotação livre',
      'o bom estado é DECLARADO, e não deduzido da posição');
    const c = lb.classificar(DISPONIVEIS, [
      { aluna: 'A', respostas: { 'mobilidade-da-coluna-cervical-e-cabeca': 'Flexão/extensão/rotação livre' } },
    ]);
    assert.strictEqual(c.atencao.some((x) => x.id === 'mobilidade-da-coluna-cervical-e-cabeca'), false,
      'uma aluna com a coluna livre NÃO é ponto de atenção');
    assert.strictEqual(c.excelencia.some((x) => x.id === 'mobilidade-da-coluna-cervical-e-cabeca'), true);
  });

  ok('a etiqueta NOVO: primeira vez, depois de lida, e com anamnese nova', () => {
    /* OS TRÊS ESTADOS, e é a razão de a função existir. A regra é de proveniência: compara-se a
     * anamnese vigente com o carimbo que alguma linha de base registou ao ler. */
    const alunas = [{ aluna: 'Aluna A', carimbo: 'anamnese-20261105-1240' }];
    // (1) ninguém a leu — NOVA.
    assert.strictEqual(lb.marcarNovas([], alunas)[0].novo, true, 'sem leitura, é nova');
    // (2) uma linha de base leu exactamente este carimbo — não é nova.
    const lida = [{ id: 'lb1', alunas: ['Aluna A'], lida: { 'Aluna A': 'anamnese-20261105-1240' } }];
    const depois = lb.marcarNovas(lida, alunas)[0];
    assert.strictEqual(depois.novo, false, 'lida, deixa de ser nova');
    assert.strictEqual(depois.lidaEm, 'anamnese-20261105-1240', 'e diz quando foi lida');
    // (3) chegou uma anamnese NOVA — volta a ser nova.
    const novaFoto = [{ aluna: 'Aluna A', carimbo: 'anamnese-20261106-0900' }];
    assert.strictEqual(lb.marcarNovas(lida, novaFoto)[0].novo, true,
      'uma anamnese mais recente volta a marcar a aluna');
  });

  ok('a etiqueta olha para TODAS as linhas de base, e fica com a leitura mais recente', () => {
    const lidas = [
      { id: 'lb1', lida: { 'Aluna A': 'anamnese-20261101-1000' } },
      { id: 'lb2', lida: { 'Aluna A': 'anamnese-20261104-1000' } },
    ];
    const r = lb.marcarNovas(lidas, [{ aluna: 'Aluna A', carimbo: 'anamnese-20261103-1000' }])[0];
    assert.strictEqual(r.lidaEm, 'anamnese-20261104-1000', 'o maior carimbo entre as linhas');
    assert.strictEqual(r.novo, false, 'uma leitura posterior cobre a anterior');
  });

  await okAsync('o servidor recusa enviar para a turma sem alunas', async () => {
    const env = envFalso(kvFalso());
    // Cria uma linha de base sem alunas e tenta enviá-la.
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Sem alunas', campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
      }),
    });
    const r = await chamar(env, '/api/bastidores/linha-de-base/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'sem-alunas', turma: 'Infantil', senhaDirecao: 'senha-de-prova' }),
    });
    assert.strictEqual(r.status, 400, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    assert.ok(/alunas/i.test(r.corpo.erro), 'a recusa diz o que falta: ' + r.corpo.erro);
  });

  await okAsync('o servidor recusa enviar para uma turma que não existe', async () => {
    const kv = kvFalso();
    const env = envFalso(kv);
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Com alunas', alunas: ['Aluna A'], campos: ['equilibrio-unipodal'],
        senhaDirecao: 'senha-de-prova',
      }),
    });
    const r = await chamar(env, '/api/bastidores/linha-de-base/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'com-alunas', turma: 'Turma Fantasma', senhaDirecao: 'senha-de-prova' }),
    });
    assert.strictEqual(r.status, 404, 'uma turma inventada não recebe ninguém');
  });

  await okAsync('o envio grava a turma e a data, e a turma passa a declarar o elenco', async () => {
    const chaveLB = 'bastidores/' + ESCOLA + '/linhas-de-base';
    const chaveT = 'bastidores/' + ESCOLA + '/turmas';
    const kv = kvFalso({
      [chaveLB]: JSON.stringify([{
        id: 'lb-1', nome: 'Recorte 1', professor: 'rabo-gramde',
        alunas: ['Aluna A', 'Aluna B'],
        campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
        atualizada_em: '2026-11-05T10:00:00Z',
      }]),
      [chaveT]: JSON.stringify([{ id: 'infantil', nome: 'Infantil', dias: ['segunda'], ativo: true }]),
    });
    const env = envFalso(kv);
    const r = await chamar(env, '/api/bastidores/linha-de-base/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'lb-1', turma: 'Infantil', senhaDirecao: 'senha-de-prova' }),
    });
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    const guardada = JSON.parse(kv.mapa.get(chaveLB))[0];
    assert.strictEqual(guardada.turma, 'Infantil');
    assert.ok(guardada.enviada_em, 'a data do acto vai gravada — o vínculo é datado');

    // E a turma passa a declarar o elenco — DERIVADO da linha de base, não guardado nela.
    const elenco = await chamar(env, '/api/bastidores/alunas-da-turma?turma=Infantil');
    assert.strictEqual(elenco.status, 200);
    assert.deepStrictEqual(elenco.corpo.alunas, ['Aluna A', 'Aluna B']);
    assert.strictEqual(elenco.corpo.linhaDeBase.id, 'lb-1',
      'a curadoria tem de poder dizer DE QUE linha de base vem o elenco');
    const daTurma = JSON.parse(kv.mapa.get(chaveT))[0];
    assert.strictEqual(daTurma.alunas, undefined,
      'a TURMA continua a ser o ritmo: o vínculo não se escreve nela');
  });

  await okAsync('a leitura do passo 3 não exige o recorte — vem antes de ele ser escolhido', async () => {
    const mapa = {};
    mapa['bastidores/' + ESCOLA + '/linhas-de-base'] = JSON.stringify([{
      id: 'lb-novo', nome: 'Recém-criada', alunas: ['Aluna A'], campos: [],
      atualizada_em: '2026-11-05T10:00:00Z',
    }]);
    const env = envFalso(kvFalso(mapa));
    const r = await chamar(env, '/api/bastidores/linha-de-base/leitura?id=lb-novo&alunas=Aluna%20A');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    // Sem acervo não há anamneses; o que se prova é que a rota NÃO recusa por `campos` vazio.
    assert.strictEqual(r.corpo.semAnamneses, true,
      'a rota aceita uma linha de base ainda sem recorte — é o passo 3, antes do 4');
  });

  console.log('\n11. A TELA — os cinco passos, a trava e a rolagem');

  ok('a secção tem a tira de cinco passos e os cinco painéis', () => {
    assert.ok(/id="lb-tira"/.test(PAGINA), 'a tira dos passos tem de estar');
    for (const n of [1, 2, 3, 4, 5]) {
      assert.ok(new RegExp('class="passo-painel" data-passo="' + n + '"').test(PAGINA),
        'o painel do passo ' + n + ' tem de existir');
    }
  });

  ok('a navegação é a do verbete: Seguir, Voltar e o Concluir só no último', () => {
    assert.ok(/id="lb-seguir"/.test(PAGINA) && /id="lb-voltar"/.test(PAGINA));
    assert.ok(/id="lb-enviar"[^>]*hidden[^>]*disabled/.test(PAGINA),
      'o «Concluir» nasce escondido e desabilitado: só existe no passo 5');
  });

  ok('a lista de alunas tem rolagem própria e um botão de carregar mais', () => {
    assert.ok(/id="lb-alunas"[^>]*rolagem-de-alunas/.test(PAGINA),
      'a caixa das alunas tem de rolar — a escola pode ter quatrocentos nomes');
    assert.ok(/id="lb-mais"/.test(PAGINA), 'e o «Carregar mais alunas» tem de existir');
    assert.ok(/\.rolagem-de-alunas\{[^}]*max-height/.test(PAGINA),
      'a peça é desenhada nesta página, com um teto — a checagem 4 permite, a peça 8 exige');
  });

  ok('a secção diz o que fazer quando não há anamnese nenhuma', () => {
    assert.ok(/id="lb-sem-anamnese"/.test(PAGINA), 'o aviso do estado vazio tem de estar na marcação');
  });

  /*
   * 12. A TRAVA A CORRER — em jsdom, na página de verdade.
   *
   * PORQUE NÃO BASTA A MARCAÇÃO. A prova anterior dizia que os painéis e os botões existem; o A/B
   * mostrou que ela PASSAVA com a trava desligada — estava a medir a presença dos elementos, não a
   * regra. Aqui a página é carregada, o `fetch` é substituído por um que devolve uma anamnese, e
   * as funções de trava são chamadas de fora. Se a regra cair, isto cai.
   */
  await okAsync('a trava dos passos, a correr: não se chega ao 2 sem nome e professor', async () => {
    let JSDOM, VirtualConsole;
    try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { throw new Error('jsdom ausente: ' + e.message); }
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {});
    vc.on('error', () => {});
    const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''), {
      runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true;
        w.alert = () => {};
        // O QUE O SERVIDOR RESPONDERIA, para a página poder arrancar.
        w.fetch = (u) => {
          const url = String(u);
          const corpo = url.indexOf('alunas-com-anamnese') !== -1
            ? { ok: true, alunas: [{ aluna: 'Aluna A', carimbo: 'anamnese-20261105-1240', novo: true, lidaEm: null }] }
            : url.indexOf('campos-do-corpo') !== -1
              ? { ok: true, campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal', grupo: 'g', eixo: 'Funcional', dimensao: 'funcional', opcoes: ['A', 'B'] }], grupos: ['g'] }
              : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas: [] } : { ok: true };
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    await new Promise((r) => win.setTimeout(r, 250));

    // A PÁGINA ARRANCOU: há uma aluna e a tira está no passo 1.
    assert.strictEqual(win.ALUNAS_COM_ANAMNESE.length, 1, 'a lista de alunas veio do servidor');
    assert.strictEqual(win.LB_PASSO, 1);

    // (1) SEM NOME E SEM PROFESSOR, O PASSO 2 ESTÁ FECHADO.
    assert.ok(win.faltasDoPassoLb(2).length > 0, 'falta o nome e o professor');
    win.mostrarPassoLb(2);
    assert.strictEqual(win.LB_PASSO, 1, 'a página NÃO avança para o 2 com o passo 1 incompleto');

    // (2) COM NOME E PROFESSOR, AVANÇA.
    win.document.getElementById('lb-nome').value = 'Recorte de prova';
    const sel = win.document.getElementById('lb-professor');
    if (sel && sel.options.length) sel.value = sel.options[sel.options.length - 1].value;
    if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
    /* ATENÇÃO AO `realm`: os arrays que vêm do jsdom são de OUTRO `Array.prototype`, e o
     * `deepStrictEqual` compara o protótipo — dois `[]` de mundos diferentes NÃO são iguais para
     * ele. Compara-se o comprimento, que é o que a regra quer dizer. */
    assert.strictEqual(win.faltasDoPassoLb(1).length, 0,
      'o passo 1 está completo; faltas: ' + JSON.stringify(win.faltasDoPassoLb(1)));
    win.mostrarPassoLb(2);
    assert.strictEqual(win.LB_PASSO, 2, 'avança quando o passo 1 está completo; '
      + 'faltas antes: ' + JSON.stringify(win.faltasAntesDeLb(2)));

    // (3) O PASSO 3 CONTINUA FECHADO — falta escolher uma aluna.
    win.mostrarPassoLb(3);
    assert.strictEqual(win.LB_PASSO, 2, 'sem aluna escolhida não se chega à leitura');

    // (4) ESCOLHIDA UMA ALUNA, O 3 ABRE — e o 4 não, porque falta a leitura.
    const caixa = win.document.querySelector('input[name="lb-aluna"]');
    assert.ok(caixa, 'a caixa da aluna tem de estar na página');
    caixa.checked = true;
    assert.strictEqual(win.faltasDoPassoLb(2).length, 0, 'com uma aluna, o passo 2 está completo');
    win.mostrarPassoLb(3);
    assert.strictEqual(win.LB_PASSO, 3);
    win.mostrarPassoLb(4);
    assert.strictEqual(win.LB_PASSO, 3, 'sem a leitura feita não se chega ao recorte');

    // (5) O «SEGUIR» ESTÁ DESABILITADO ENQUANTO FALTA ALGO, e a tira diz o mesmo.
    const seguir = win.document.getElementById('lb-seguir');
    win.pintarTravasLb();
    assert.strictEqual(seguir.disabled, true, 'o Seguir está desabilitado com falta');
    const passo5 = win.document.querySelector('#lb-tira button[data-passo="5"]');
    assert.strictEqual(passo5.disabled, true, 'e o passo 5 está fechado na tira');

    dom.window.close();
  });

  await okAsync('sem anamnese nenhuma, a página fecha tudo e diz porquê', async () => {
    let JSDOM, VirtualConsole;
    ({ JSDOM, VirtualConsole } = require('jsdom'));
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {}); vc.on('error', () => {});
    const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''), {
      runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true; w.alert = () => {};
        w.fetch = (u) => {
          const url = String(u);
          const corpo = url.indexOf('alunas-com-anamnese') !== -1 ? { ok: true, alunas: [] }
            : url.indexOf('campos-do-corpo') !== -1 ? { ok: true, campos: [], grupos: [] }
            : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas: [] } : { ok: true };
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    await new Promise((r) => win.setTimeout(r, 250));
    assert.strictEqual(win.ALUNAS_COM_ANAMNESE.length, 0);
    const aviso = win.document.getElementById('lb-sem-anamnese');
    assert.strictEqual(aviso.hidden, false, 'o aviso do estado vazio tem de aparecer');
    assert.ok(/anamnese/i.test(aviso.textContent), 'e tem de dizer que falta a anamnese');
    for (const n of [1, 2, 3, 4, 5]) {
      const b = win.document.querySelector('#lb-tira button[data-passo="' + n + '"]');
      assert.strictEqual(b.disabled, true, 'o passo ' + n + ' fica fechado');
    }
    assert.strictEqual(win.document.getElementById('lb-seguir').disabled, true);
    assert.ok(win.faltasDoPassoLb(1).length > 0, 'todos os passos têm falta declarada');
    dom.window.close();
  });

  /* 13. A SECÇÃO É A DONA DO CONTEÚDO — a asserção que faltava (05/11/2026).
   *
   * O DEFEITO QUE ELA NÃO APANHOU. A tira dos cinco passos, o formulário e a lista da linha de base
   * foram montados DEPOIS do `'</section>'` das Curadorias: ficaram soltos no `<main>`, e a
   * `<section id="sec-corpo">` ficou com o título e três `</div>` órfãos — vazia. No ecrã, «Corpo —
   * linha de base» abria em branco, e os cinco passos apareciam fora do menu.
   *
   * PORQUE PASSOU. As outras doze secções procuram os elementos por `id`, e `getElementById`
   * atravessa a árvore: `#lb-tira` existia, tinha os cinco passos, e a prova dizia que sim. O que
   * nunca se perguntou foi «de QUEM é este elemento?». Uma secção vazia e uma secção cheia dão a
   * mesma resposta a todas as perguntas menos a essa.
   *
   * É a mesma família do `if` que filtrava o título vazio no `check-pacote.js`: «está aqui?» e
   * «existe?» não são a mesma pergunta. Agora a prova pergunta pela PERTENÇA — e o jsdom resolve a
   * árvore como o navegador, incluindo os `</div>` a mais.
   */
  console.log('\n13. A SECÇÃO É A DONA — o conteúdo do corpo vive dentro de #sec-corpo');
  {
    let JSDOM;
    try { ({ JSDOM } = require('jsdom')); } catch (e) { throw new Error('jsdom ausente: ' + e.message); }
    const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''));
    const d = dom.window.document;

    const corpo = d.getElementById('sec-corpo');
    const curadorias = d.getElementById('sec-curadorias');
    ok('a secção Corpo existe e não está vazia', () => {
      assert.ok(corpo, '#sec-corpo tem de existir');
      assert.strictEqual(corpo.querySelectorAll('.passo-painel').length, 5,
        'os cinco painéis têm de ser filhos de #sec-corpo');
    });
    ok('a tira, o formulário e a lista estão DENTRO de #sec-corpo', () => {
      for (const id of ['lb-tira', 'corpo-miolo', 'lb-lista', 'form-linha-base', 'lb-campos']) {
        const el = d.getElementById(id);
        assert.ok(el, 'falta #' + id);
        assert.ok(corpo.contains(el), '#' + id + ' tem de viver dentro de #sec-corpo');
      }
    });
    ok('e NÃO estão dentro das Curadorias', () => {
      for (const id of ['lb-tira', 'corpo-miolo', 'lb-lista']) {
        assert.strictEqual(curadorias.contains(d.getElementById(id)), false,
          '#' + id + ' não pertence às Curadorias');
      }
    });
    /* A SETA RECOLHE O FORMULÁRIO DESTA SECÇÃO. `definirSecaoRecolhida` procura `.col-form` dentro
     * da secção: quando o miolo estava fora, `querySelector` devolvia `null`, o `if (miolo)` não
     * fazia nada e a seta mudava de glifo sem esconder coisa nenhuma — o «não faz nada» relatado. */
    ok('a seta do título encontra o miolo que manda recolher', () => {
      const seta = corpo.querySelector('.secao-titulo .alternar-form');
      assert.ok(seta, 'a seta tem de estar no título');
      assert.strictEqual(seta.getAttribute('data-acordeao'), 'sec-corpo',
        'sem id, a seta é da secção — e o handler recolhe pelo data-acordeao');
      const alvo = corpo.querySelector('#' + seta.getAttribute('aria-controls'));
      assert.ok(alvo, 'o aria-controls tem de apontar para um id que exista na secção');
      assert.ok(corpo.querySelector('.col-form'), 'o recolhedor procura `.col-form` na secção');
    });
    ok('a grade é a peça das Turmas, com a faixa por cima', () => {
      assert.ok(corpo.querySelector('.turmas-corpo'), 'a grade tem de ser a peça da casa');
      assert.ok(corpo.querySelector('.turmas-faixa #lb-tira'),
        'a tira vive na faixa, e a faixa é a primeira linha da grade');
      const css = PAGINA;
      assert.ok(css.indexOf('.secao[data-recolhido="sim"] .turmas-corpo>') !== -1,
        'recolhido, o col-form da grade tem de sair (não é filho directo da .secao)');
    });
    dom.window.close();
  }

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
