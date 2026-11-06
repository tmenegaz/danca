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

ok('QUARENTA E CINCO campos — os 30 dos blocos 2 a 9 e os 15 da observação inicial', () => {
  /* A CONTA DA NORMA (`ARQUITETURA-ANAMNESE.md` §3): 4 da identificação + 15 da observação
   * inicial + 30 dos blocos. A linha de base lê os 45 que se MEDEM — a identificação fica de fora,
   * porque uma data de nascimento não se mede em três níveis.
   *
   * AOS TRINTA ANTERIORES FALTAM OS QUINZE DA OBSERVAÇÃO INICIAL (05/11/2026), e a falta foi
   * medida na tela: a pesquisadora marcou «2ª posição — pés» como excelente nas duas alunas, voltou
   * ao passo 3, e nada mudou — `cinco-posicoes-2a-pes` vive em `observacaoInicial`, e o módulo só
   * lia `blocos`. */
  assert.strictEqual(DISPONIVEIS.length, 45,
    'a anamnese tem 45 campos que se medem (15 da observação inicial + 30 dos blocos); veio '
    + DISPONIVEIS.length);
});

ok('a OBSERVAÇÃO INICIAL entra — é a porta de entrada, e era o que faltava', () => {
  /* «Não é um bloco à parte: é a versão rápida do que os nove blocos investigam em detalhe. Não é
   * ensino — verifica o que já existe. Dá o Norte.» Um aspecto que a anamnese pergunta e a linha de
   * base ignora é o pior dos dois mundos: o professor responde, o sistema não lê, e nada falha. */
  for (const id of ['cinco-posicoes-2a-pes', 'cinco-posicoes-1a-bracos', 'en-dehors', 'tendu',
    'passe', 'meia-ponta', 'musicalidade']) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), true,
      '«' + id + '» é da observação inicial e tem de ser escolhível');
  }
  // O elemento que DESMEMBRA não responde por si (§3.1): entram os dez subitens, não o pai.
  assert.strictEqual(DISPONIVEIS.some((c) => c.id === 'cinco-posicoes'), false,
    '«as cinco posições» agrupa e desmembra — quem se marca são os dez subitens');
  // E os quatro da identificação continuam de fora: não são aspectos do corpo que se observa.
  for (const id of ['idade', 'conhecimentoPrevio', 'categoria-etaria',
    'historico-de-praticas-corporais']) {
    assert.strictEqual(DISPONIVEIS.some((c) => c.id === id), false,
      '«' + id + '» é identificação, não é medida do corpo');
  }
  const pes = DISPONIVEIS.find((c) => c.id === 'cinco-posicoes-2a-pes');
  assert.strictEqual(pes.nome, '2ª posição — pés');
  assert.deepStrictEqual(pes.opcoes, ['Bom', 'razoável', 'precisa desenvolver'],
    'a régua é a `forma` que a anamnese declara — não uma segunda lista escrita aqui');
  assert.strictEqual(pes.referencia, 'Bom', 'o melhor nível é o primeiro da forma');
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

ok('as três dimensões estão representadas, e a soma fecha nos quarenta e cinco', () => {
  /* 9 de técnica + 15 de funcional + 6 de musicalidade (os blocos 2 a 9) e, da observação
   * inicial, 14 de técnica e 1 de musicalidade («a musicalidade», que a anamnese declara nesta
   * porta). A observação inicial não declara `dimensao` em nenhum elemento: a leitura é do núcleo,
   * e está escrita lá. */
  const por = {};
  for (const c of DISPONIVEIS) por[c.dimensao] = (por[c.dimensao] || 0) + 1;
  assert.deepStrictEqual(por, { tecnica: 23, funcional: 15, musicalidade: 7 },
    'vinte e três de técnica, quinze de funcional e sete de musicalidade: ' + JSON.stringify(por));
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

ok('sem campos e sem rascunho é recusado — e a recusa diz que a página é antiga', () => {
  /* A CRIAÇÃO SEM CAMPOS E SEM O SELO é a assinatura de uma ABA ANTERIOR ao deploy (05/11/2026:
   * o professor viu «escolha pelo menos um aspecto do corpo» no passo 1, minutos depois de o
   * sistema já estar corrigido — a página aberta mandava o corpo de ontem). A recusa tem de o
   * dizer, senão manda procurar um defeito que não existe. */
  const r = lb.normalizar({ nome: 'Turma infantil' }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, false);
  assert.ok(/recarregue/i.test(r.erros.join(' ')), 'a recusa manda recarregar: ' + r.erros.join(' '));
});

ok('em EDIÇÃO (com id) a recusa fala do RECORTE, e não de página antiga', () => {
  const r = lb.normalizar({ id: 'nivel-1', nome: 'Nível 1' }, DISPONIVEIS, '2026-11-05T10:00:00Z');
  assert.strictEqual(r.ok, false);
  assert.ok(/pelo menos um aspecto/i.test(r.erros.join(' ')), r.erros.join(' '));
  assert.ok(!/recarregue/i.test(r.erros.join(' ')),
    'quem está a editar não tem a página errada: tem o recorte vazio');
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
  await okAsync('GET /api/bastidores/campos-do-corpo — quarenta e cinco, com os grupos', async () => {
    const env = envFalso(kvFalso());
    const r = await chamar(env, '/api/bastidores/campos-do-corpo');
    assert.strictEqual(r.status, 200, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 200));
    assert.strictEqual(r.corpo.campos.length, 45, 'os quarenta e cinco campos que se medem');
    assert.ok(r.corpo.campos.some((c) => c.dimensao === 'musicalidade'),
      'e a musicalidade tem de vir na resposta da rota, não só na do núcleo');
    assert.ok(r.corpo.campos.some((c) => c.id === 'cinco-posicoes-2a-pes'),
      'a observação inicial tem de chegar à TELA — é ela que a escolher');
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

  await okAsync('a leitura SOBREVIVE ao recorte e CAI quando o elenco muda', async () => {
    const chave = 'bastidores/' + ESCOLA + '/linhas-de-base';
    const kv = kvFalso({
      [chave]: JSON.stringify([{
        id: 'nivel-1', nome: 'Nível 1', professor: null, alunas: ['Ana', 'Bia'],
        campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal', grupo: 'x' }],
        atualizada_em: '2026-11-01T10:00:00Z',
        leitura: { em: '2026-11-01T11:00:00Z', alunas: ['Ana', 'Bia'], alunos: 2, linhas: [] },
      }]),
    });
    const env = envFalso(kv);
    // (a) gravar sem mudar nada PRESERVA a leitura.
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1 (novo nome)', alunas: ['Bia', 'Ana'],
        campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
      }),
    });
    let guardado = JSON.parse(kv.mapa.get(chave))[0];
    assert.ok(guardado.leitura,
      'a leitura é dos CORPOS, não do recorte: corrigir o nome ou reordenar as alunas não a invalida');
    /* (b) MUDAR O RECORTE TAMBÉM A PRESERVA (05/11/2026). A leitura do passo 3 lê os TRINTA campos
     * antes de a escolha existir — logo, ela não descreve o recorte. Foi a regra antiga (descartar
     * quando os campos mudavam) que fez a leitura desaparecer no «Gravar» do passo 4. */
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1', alunas: ['Ana', 'Bia'],
        campos: ['equilibrio-unipodal', 'cocoras-profundas-squat'], senhaDirecao: 'senha-de-prova',
      }),
    });
    guardado = JSON.parse(kv.mapa.get(chave))[0];
    assert.ok(guardado.leitura, 'escolher o recorte não apaga a leitura que veio antes dele');
    // (c) mudar o ELENCO descarta-a — a leitura dizia de quem era, e essas já não são as alunas.
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1', alunas: ['Ana', 'Bia', 'Carla'],
        campos: ['equilibrio-unipodal', 'cocoras-profundas-squat'], senhaDirecao: 'senha-de-prova',
      }),
    });
    guardado = JSON.parse(kv.mapa.get(chave))[0];
    assert.strictEqual(guardado.leitura, undefined,
      'com elenco novo, a leitura antiga descrevia outros corpos');

    /* (d) E A LEITURA FEITA DEPOIS DA TROCA SOBREVIVE AO «GRAVAR» DO PASSO 4. O registo ainda tem
     * o elenco antigo; a leitura do passo 3 já é do elenco novo. Comparar com `antes.alunas`
     * apagaria exactamente a leitura que o professor acabou de fazer sobre a aluna que entrou. */
    guardado.leitura = { em: '2026-11-05T11:00:00Z', alunas: ['Ana', 'Bia', 'Carla'], linhas: [] };
    kv.mapa.set(chave, JSON.stringify([guardado]));
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1', alunas: ['Ana', 'Bia', 'Carla'],
        campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
      }),
    });
    guardado = JSON.parse(kv.mapa.get(chave))[0];
    assert.ok(guardado.leitura,
      'a leitura do elenco novo tem de sobreviver ao Gravar que o declara');
  });

  await okAsync('o RASCUNHO do passo 1 grava sem recorte — e só ele', async () => {
    /* O DEFEITO QUE ISTO FECHA (05/11/2026, reportado em produção): «Seguir» do passo 1 chamava
     * `gravarLinha`, que mandava `campos: []`; o servidor recusava com «escolha pelo menos um
     * aspecto do corpo», e o formulário não saía do passo 1. O recorte é o passo 4, mas a linha de
     * base tem de existir antes dele — é nela que a leitura do passo 3 fica guardada. */
    const kv = kvFalso();
    const env = envFalso(kv);
    const semSelo = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Nível 1', professor: 'rabo-gramde', alunas: [], campos: [],
        senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.strictEqual(semSelo.status, 400,
      'sem o selo de rascunho a ausência de recorte continua a ser recusada');
    /* O CORPO EXACTO DO RELATO DELA (05/11/2026): nome, professor, alunas vazias, campos vazios e
     * token — sem `rascunho`. Era a aba aberta antes do deploy. A recusa nomeia a causa. */
    assert.ok(/recarregue/i.test(semSelo.corpo.erro),
      'a recusa de uma criação sem selo diz que a página é anterior: ' + semSelo.corpo.erro);

    const rascunho = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Nível 1', professor: 'rabo-gramde', alunas: [], campos: [],
        rascunho: true, senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.strictEqual(rascunho.status, 201, 'HTTP ' + rascunho.status + ': ' + rascunho.texto.slice(0, 200));
    assert.strictEqual(rascunho.corpo.linha.rascunho, true, 'a linha guardada diz que é rascunho');
    assert.strictEqual(rascunho.corpo.linha.campos.length, 0);
  });

  await okAsync('o rascunho NÃO se envia para a turma — o recorte é o passo 4', async () => {
    const kv = kvFalso({
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([{ id: 'infantil', nome: 'Infantil' }]),
    });
    const env = envFalso(kv);
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Rascunho', alunas: ['Aluna A'], campos: [],
        rascunho: true, senhaDirecao: 'senha-de-prova',
      }),
    });
    const envio = await chamar(env, '/api/bastidores/linha-de-base/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'rascunho', turma: 'Infantil', senhaDirecao: 'senha-de-prova' }),
    });
    assert.strictEqual(envio.status, 400, 'HTTP ' + envio.status + ': ' + envio.texto.slice(0, 200));
    assert.ok(/recorte/i.test(envio.corpo.erro), 'a recusa diz o que falta: ' + envio.corpo.erro);
  });

  await okAsync('o selo de rascunho CAI quando o recorte é escolhido', async () => {
    const kv = kvFalso();
    const env = envFalso(kv);
    await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Nível 1', campos: [], rascunho: true, senhaDirecao: 'senha-de-prova',
      }),
    });
    const completo = await chamar(env, '/api/bastidores/linha-de-base', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'nivel-1', nome: 'Nível 1', campos: ['equilibrio-unipodal'], senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.strictEqual(completo.status, 200, 'HTTP ' + completo.status + ': ' + completo.texto.slice(0, 200));
    assert.strictEqual(completo.corpo.linha.rascunho, undefined,
      'com recorte, a linha já não é rascunho');
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

  await okAsync('com uma linha de base velha, a ordem tem QUATRO passos e ela entra nas pendências', async () => {
    const armazenamento = armazenamentoFalso([
      { id: 'anamnese-20261104-1000', aluna: 'Aluna A', gerado_em: '2026-11-04T10:00:00Z' },
    ]);
    const linhas = [{
      id: 'nivel-1', nome: 'Nível 1', atualizada_em: '2026-11-01T10:00:00Z',
      campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
    }];
    const r = await porta.revalidacaoPendente(armazenamento, null, linhas);
    /* QUATRO, e não três (05/11/2026). A curadoria entrou entre o recorte e o plano de ensino
     * porque o ELENCO da turma deriva da linha de base: mudar quem está na turma muda o que o
     * plano fixa, e quem declara quem está na turma é a curadoria. A ordem continua a ser de
     * dependência — e a ordem é a regra, não a arrumação do ecrã. */
    assert.deepStrictEqual(r.ordem,
      ['linha-de-base', 'curadoria', 'plano-de-ensino', 'plano-de-observacao'],
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

  ok('nem a anamnese nem o PO exigem o ciclo como campo próprio', () => {
    /* DUAS FAMÍLIAS, E A MESMA RAZÃO (06/11/2026). Na anamnese não há ciclo nenhum a pedir; no PO
     * o ciclo vem do plano observado, e o que existe é uma LEITURA. Exigir em qualquer das duas um
     * valor que ninguém tem para onde escrever é a pior das travas: o botão nunca habilita e não há
     * nada a corrigir. O PO tem, em vez disso, um recado próprio para o plano que não declara ciclo. */
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'), 'utf8');
    assert.ok(/if \(!CFG\.ehAnamnese && !CFG\.ehPo && !valor\('ciclo'\)\) falta\.push\('ciclo'\)/
      .test(fonte), 'exigir um campo que não se vê é a pior das travas: nunca habilita');
    assert.ok(/if \(CFG\.ehPo && valor\('plano'\) && !valor\('ciclo'\)\) falta\.push\('o ciclo do plano escolhido'\)/
      .test(fonte), 'no PO o que falta, quando falta, é o ciclo DO PLANO — e por isso tem nome');
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

  ok('o APOIO da observação inicial não é o NÍVEL — «Bom com a barra» é «Bom»', () => {
    /* O DEFEITO, medido no `calango` a 05/11/2026, com as duas alunas reais. A porta grava a
     * resposta da observação inicial como uma lista — `[escala, apoio]` —, e a leitura juntava as
     * duas com `join(' · ')`, tratando o resultado como nível. «Bom · consciencia-propria» nunca é
     * igual a «Bom», e por isso um aspecto em que as duas estavam no MELHOR nível entrava como
     * ponto de atenção e «o que já é bom» ficava vazio. A frase que ela leu — «nenhum aspecto com o
     * grupo todo no melhor nível» — é o sintoma, não a definição. A regra é a da `ficha.js`: a
     * escala é o elemento que NÃO pertence ao pool de apoios. */
    const c = lb.classificar(DISPONIVEIS, [
      { aluna: 'Aluna A', respostas: { 'cinco-posicoes-2a-pes': ['Bom', 'consciencia-propria'] } },
      { aluna: 'Aluna B', respostas: { 'cinco-posicoes-2a-pes': ['Bom', 'consciencia-propria'] } },
    ]);
    const noAtencao = c.atencao.find((x) => x.id === 'cinco-posicoes-2a-pes');
    const noBom = c.excelencia.find((x) => x.id === 'cinco-posicoes-2a-pes');
    assert.strictEqual(noAtencao, undefined,
      'as duas estão no melhor nível — não é ponto de atenção');
    assert.ok(noBom, 'tem de estar em «o que já é bom»');
    assert.ok(/em «Bom»/.test(noBom.texto) && !/com-barra|consciencia-propria/.test(noBom.texto),
      'o texto diz o NÍVEL, e não o slug do apoio: ' + noBom.texto);
    assert.ok(/por consciência própria/.test(noBom.texto),
      'e o apoio aparece em português quando é um só: ' + noBom.texto);
    assert.deepStrictEqual(noBom.noMelhor, ['Aluna A', 'Aluna B'],
      'e diz QUEM está no melhor nível — a leitura individual que a lista do grupo não dava');
  });

  ok('apoios DIFERENTES no mesmo nível: continua o mesmo nível, e continua comum', () => {
    /* «Bom com toque» e «Bom por consciência própria» são o mesmo ESTADO observado de duas
     * maneiras. O apoio diz como se viu, não quanto — e por isso não fragmenta a contagem. Este é
     * o outro caso dos dados dela: «2ª posição — braços». */
    const c = lb.classificar(DISPONIVEIS, [
      { aluna: 'A', respostas: { 'cinco-posicoes-2a-bracos': ['Bom', 'com-toque'] } },
      { aluna: 'B', respostas: { 'cinco-posicoes-2a-bracos': ['Bom', 'com-barra'] } },
    ]);
    const item = c.excelencia.find((x) => x.id === 'cinco-posicoes-2a-bracos');
    assert.ok(item, 'as duas estão no melhor nível');
    assert.strictEqual(item.texto, '2 de 2 em «Bom»',
      'sem eleger um apoio quando os dois diferem: ' + item.texto);
    assert.ok(c.comuns.some((x) => x.id === 'cinco-posicoes-2a-bracos'),
      'e é comum: o nível é o mesmo');
  });

  ok('«não foi medido» NÃO é ponto de atenção — é abstenção declarada, e diz-se', () => {
    /* O professor diz «não medi» e o sistema respondia «precisa de ser trabalhado». As duas coisas
     * não são a mesma, e a segunda põe no corpo da aluna uma falta que ninguém observou. */
    const c = lb.classificar(DISPONIVEIS, [
      { aluna: 'A', respostas: { 'equilibrio-unipodal': 'Mantém > 5 s sem oscilação severa' } },
      { aluna: 'B', respostas: { 'equilibrio-unipodal': ['não foi medido'] } },
    ]);
    const item = c.excelencia.find((x) => x.id === 'equilibrio-unipodal');
    assert.strictEqual(c.atencao.some((x) => x.id === 'equilibrio-unipodal'), false,
      'o que não se mediu não está abaixo do melhor — está por medir');
    assert.ok(item, 'a que se mediu está no melhor nível');
    assert.strictEqual(item.naoMedidos, 1);
    assert.ok(/1 não medido/.test(item.texto), 'e o texto não esconde a abstenção: ' + item.texto);
  });

  ok('«o que já é bom» é o que ALGUMA tem de bom, e não o que todas acertaram', () => {
    /* DECISÃO DELA, 05/11/2026, ao ler a tela: «esse aqui é para colocar o que é individual de cada
     * uma […] é o que já é bom de cada aluna. Eu vou listar o aspecto, o eixo e como está o grupo».
     * A definição anterior era «todas no melhor nível», e o efeito medido foi o contrário: numa
     * turma em que as duas diferem em quase tudo, o bloco ficava vazio — e a aluna com o tendu bom
     * «por consciência própria» não aparecia em sítio nenhum com esse mérito. */
    const c = lb.classificar(DISPONIVEIS, [
      { aluna: 'Aluna A', respostas: { tendu: ['precisa desenvolver', 'com-toque'] } },
      { aluna: 'Aluna B', respostas: { tendu: ['Bom', 'consciencia-propria'] } },
    ]);
    const noBom = c.excelencia.find((x) => x.id === 'tendu');
    const noAtencao = c.atencao.find((x) => x.id === 'tendu');
    assert.ok(noBom, 'o tendu bom da Aluna B tem de estar em «o que já é bom»');
    assert.ok(noAtencao, 'e o mesmo aspecto continua a ser ponto de atenção — as listas não se excluem');
    assert.strictEqual(noBom.noMelhorNivel, false,
      'não é «todas bem» — e o item declara isso, para a tela poder distinguir');
    assert.deepStrictEqual(noBom.noMelhor, ['Aluna B'], 'e diz quem (a tela ainda não nomeia)');
    assert.strictEqual(noBom.texto, '1 de 2 em «Bom» (por consciência própria) · 1 de 2 em «precisa desenvolver» (com toque)',
      'o texto diz o nível de cada uma, com o apoio em português: ' + noBom.texto);
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

  /* 12.1 O «SEGUIR» DO PASSO 1 GRAVA UM RASCUNHO — o defeito que ela viu em produção (05/11/2026).
   *
   * O SINTOMA: «quando tentei seguir do passo 1 para o 2» — `POST /api/bastidores/linha-de-base`
   * devolvia 400, «escolha pelo menos um aspecto do corpo». O recorte é o passo 4; o passo 1 não
   * tem nenhum para mandar. A prova mede o CORPO do pedido, e não só a marcação: um teste que
   * olhasse apenas para a página passaria com o pedido errado. */
  await okAsync('o «Seguir» do passo 1 pede RASCUNHO ao servidor — e só então avança', async () => {
    let JSDOM, VirtualConsole;
    ({ JSDOM, VirtualConsole } = require('jsdom'));
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {}); vc.on('error', () => {});
    const pedidos = [];
    const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''), {
      runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true; w.alert = () => {};
        w.fetch = (u, opcoes) => {
          const url = String(u);
          const metodo = (opcoes && opcoes.method) || 'GET';
          if (metodo === 'POST' && url.indexOf('linha-de-base') !== -1) {
            pedidos.push(JSON.parse((opcoes && opcoes.body) || '{}'));
            return Promise.resolve({ ok: true, status: 201,
              json: () => Promise.resolve({ ok: true, criada: true,
                linha: { id: 'recorte-de-prova', nome: 'Recorte de prova', campos: [], alunas: [], rascunho: true } }),
              text: () => Promise.resolve('') });
          }
          const corpo = url.indexOf('alunas-com-anamnese') !== -1
            ? { ok: true, alunas: [{ aluna: 'Aluna A', carimbo: 'anamnese-20261105-1240', novo: true }] }
            : url.indexOf('campos-do-corpo') !== -1
              ? { ok: true, campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal', grupo: 'g', eixo: 'Funcional', dimensao: 'funcional', opcoes: ['A', 'B'] }], grupos: ['g'] }
              : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas: [], divergentes: [] } : { ok: true };
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    await new Promise((r) => win.setTimeout(r, 250));
    assert.strictEqual(win.LB_PASSO, 1);

    win.document.getElementById('lb-nome').value = 'Recorte de prova';
    const sel = win.document.getElementById('lb-professor');
    if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
    win.pintarTravasLb();
    win.document.getElementById('lb-seguir').click();
    await new Promise((r) => win.setTimeout(r, 50));

    assert.strictEqual(pedidos.length, 1, 'o «Seguir» do passo 1 faz UM pedido de gravação');
    assert.strictEqual(pedidos[0].rascunho, true,
      'e declara rascunho — sem isso o servidor recusa a linha ainda sem recorte');
    assert.strictEqual(pedidos[0].campos.length, 0, 'o passo 1 não manda campos: o recorte é o passo 4');
    assert.strictEqual(win.LB_PASSO, 2, 'e só depois de gravar é que avança');
    dom.window.close();
  });

  /* 12.2 O «LER AS ANAMNESES» ACENDE — o botão morto do passo 3 (05/11/2026).
   *
   * O RELATO DELA: «agora eu estou no step 3 e aí ler a anamnese destas alunas está bloqueado, eu
   * não consigo clicar em lugar nenhum», com a anamnese da aluna A já pronta. Não era o dado: o
   * botão nasce `disabled` na marcação, o `travarTudo` também o desligava, e NENHUMA função o
   * voltava a ligar — ficava fechado para sempre, inclusive numa escola com trinta retratos.
   *
   * A prova mede o ESTADO DO BOTÃO, e não a marcação: um teste de presença passaria com ele morto. */
  await okAsync('o «Ler as anamneses» acende quando há anamnese e uma aluna escolhida', async () => {
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
          const corpo = url.indexOf('alunas-com-anamnese') !== -1
            ? { ok: true, alunas: [{ aluna: 'Aluna A', carimbo: 'anamnese-20261105-1240', novo: false }] }
            : url.indexOf('campos-do-corpo') !== -1 ? { ok: true, campos: [], grupos: [] }
              : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas: [], divergentes: [] } : { ok: true };
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    await new Promise((r) => win.setTimeout(r, 250));

    const ler = win.document.getElementById('lb-ler');
    assert.ok(ler, 'o botão do passo 3 tem de estar na página');
    /* (1) SEM ALUNA ESCOLHIDA, ele está fechado — e DIZ porquê. Fechado sem razão é o defeito. */
    assert.strictEqual(ler.disabled, true, 'sem aluna marcada não há a quem ler');
    assert.ok(/aluna/i.test(ler.title || ''), 'e o title diz que falta escolher: ' + ler.title);
    /* (2) ESCOLHIDA UMA ALUNA, ele abre. É isto que estava a faltar. */
    const caixa = win.document.querySelector('input[name="lb-aluna"]');
    assert.ok(caixa, 'a caixa da aluna tem de estar na página');
    caixa.checked = true;
    win.pintarTravasLb();
    assert.strictEqual(ler.disabled, false,
      'com anamnese e uma aluna escolhida, o «Ler as anamneses» tem de estar clicável');
    assert.ok(!ler.title, 'e sem title de falta — não falta nada');
    /* (3) O CONTROLO NEGATIVO: sem anamnese nenhuma, ele fecha outra vez e diz o que falta. */
    win.ALUNAS_COM_ANAMNESE = [];
    win.pintarTravasLb();
    assert.strictEqual(ler.disabled, true, 'sem anamnese na escola, não há o que ler');
    assert.ok(/anamnese/i.test(ler.title || ''), 'e o title diz isso: ' + ler.title);
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

  /* 14. O ELENCO MUDA, E A CASCATA DESCE (05/11/2026).
   *
   * O PEDIDO DELA, POR PALAVRAS: «tenho uma turma A com dez meninas, e há uma menina que não pode
   * mais naquele horário; ela precisa agora ir para a turma C. […] eu não vou fazer a edição lá na
   * turma, também não vou fazer na curadoria. Eu vou fazer a edição na linha de base, porque se eu
   * trocar a menina, ela vai com outras características para a turma.» E, sobre a travessia: «é
   * obrigatório esse processo […] a gente não vai deixar um botão automático que dispara tudo em
   * cadeia porque precisa do olhar do professor».
   *
   * O QUE SE MEDE, E PORQUE É AQUI. A regra é DERIVADA — compara-se o que a curadoria DECLARA com
   * o que a turma TEM HOJE (a união das alunas das linhas de base enviadas para ela). Não há campo
   * a limpar, e o sinal cai sozinho quando a curadoria é gravada de novo. Medir só a marcação não
   * provaria isso; por isso a prova corre a função contra envelopes de verdade.
   */
  console.log('\n14. O ELENCO MUDA, E A CASCATA DESCE — curadoria → plano de ensino → plano de observação');
  {
    /* A TURMA «Balé 1» RECEBEU DUAS ALUNAS da linha de base. A curadoria dela declara TRÊS — a
     * Carla saiu da linha de base (mudou de horário) e a curadoria ainda não sabe. */
    const cenario = () => armazenamentoFalso({
      anamneses: [{ id: 'anamnese-20261101-1000', aluna: 'Ana', gerado_em: '2026-11-01T10:00:00Z' }],
      planos: [{ id: 'plano-20261101-1100', turma: 'Balé 1', gerado_em: '2026-11-01T11:00:00Z' }],
      pos: [{ id: 'po-20261101-1200', gerado_em: '2026-11-01T12:00:00Z',
        sujeitos: ['Ana'], planos: ['plano-20261101-1100'] }],
    });

    const LINHAS = [{
      id: 'nivel-1', nome: 'Nível 1', atualizada_em: '2026-11-04T10:00:00Z',
      turma: 'Balé 1', alunas: ['Ana', 'Bia'],
      campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
    }];
    const curadoriasDe = (alunas) => [{ id: 'cu-1', turmas: ['Balé 1'], alunas }];

    await okAsync('a aluna que saiu da linha de base marca a CURADORIA da turma, e diz quem', async () => {
      const armazenamento = cenario();
      const r = await porta.revalidacaoPendente(armazenamento, null, LINHAS, curadoriasDe(['Ana', 'Bia', 'Carla']));
      const entrada = r.pendentes.get('curadoria:cu-1');
      assert.ok(entrada, 'a curadoria tem de estar nas pendências');
      assert.strictEqual(entrada.familia, 'curadoria');
      assert.strictEqual(entrada.turma, 'Balé 1', 'o motivo tem de dizer de QUE turma se fala');
      assert.deepStrictEqual([...entrada.saiu], ['Carla'], 'e QUEM saiu — «o elenco mudou» não decide nada');
      assert.deepStrictEqual([...entrada.entrou], []);
      assert.ok(/Carla/.test(entrada.motivo), 'o nome tem de estar no motivo escrito: ' + entrada.motivo);
    });

    await okAsync('e desce: o plano de ensino da turma, e depois o plano de observação', async () => {
      const armazenamento = cenario();
      const r = await porta.revalidacaoPendente(armazenamento, null, LINHAS, curadoriasDe(['Ana', 'Bia', 'Carla']));
      const plano = r.pendentes.get('plano-20261101-1100');
      const po = r.pendentes.get('po-20261101-1200');
      assert.ok(plano, 'o plano de ensino da mesma turma tem de ser marcado');
      assert.strictEqual(plano.familia, 'plano');
      assert.strictEqual(plano.turma, 'Balé 1');
      assert.ok(/CURADORIA/i.test(plano.motivo), 'e o motivo diz que a curadoria vem PRIMEIRO: ' + plano.motivo);
      assert.ok(po, 'e o plano de observação que observa esse plano também');
      assert.strictEqual(po.familia, 'po');
      assert.ok(po.motivo.indexOf('plano-20261101-1100') !== -1,
        'o motivo do PO nomeia o plano que tem de vir antes: ' + po.motivo);
      /* A ORDEM QUE SE DIZ É A QUE SE PRATICA: se a curadoria vem antes do plano de ensino, e o
       * plano antes do PO, a lista tem de os apresentar por essa ordem. */
      assert.deepStrictEqual(r.ordem,
        ['linha-de-base', 'curadoria', 'plano-de-ensino', 'plano-de-observacao']);
    });

    await okAsync('CONTROLE NEGATIVO: com o elenco igual, ninguém é marcado', async () => {
      const armazenamento = cenario();
      const r = await porta.revalidacaoPendente(armazenamento, null, LINHAS, curadoriasDe(['Ana', 'Bia']));
      assert.strictEqual(r.pendentes.get('curadoria:cu-1'), undefined);
      assert.strictEqual(r.pendentes.get('plano-20261101-1100'), undefined,
        'sem diferença não há cascata — um aviso que nunca cai deixa de se ler');
      assert.strictEqual(r.pendentes.get('po-20261101-1200'), undefined);
    });

    await okAsync('CONTROLE NEGATIVO A/B: sem as curadorias, o passo 5 não marca nada', async () => {
      const armazenamento = cenario();
      // A MESMA chamada, sem o quarto argumento. Se a marcação não dependesse dele, esta prova
      // passaria — e estaria a medir o nada.
      const r = await porta.revalidacaoPendente(armazenamento, null, LINHAS);
      assert.strictEqual(r.pendentes.get('curadoria:cu-1'), undefined,
        'sem curadorias não há declarado contra que comparar');
      assert.strictEqual(r.pendentes.get('plano-20261101-1100'), undefined);
    });

    await okAsync('a curadoria SUBSTITUÍDA não é marcada — quem se revê é a vigente', async () => {
      const armazenamento = cenario();
      const antigas = [
        { id: 'cu-0', turmas: ['Balé 1'], alunas: ['Ana', 'Bia', 'Carla'], substituidaPor: 'cu-1' },
        { id: 'cu-1', turmas: ['Balé 1'], alunas: ['Ana', 'Bia', 'Carla'] },
      ];
      const r = await porta.revalidacaoPendente(armazenamento, null, LINHAS, antigas);
      assert.strictEqual(r.pendentes.get('curadoria:cu-0'), undefined,
        'a que já foi substituída não se revalida: o histórico não se reescreve (P-03)');
      assert.ok(r.pendentes.get('curadoria:cu-1'), 'a vigente é que se revê');
    });

    await okAsync('uma turma sem linha de base enviada não é comparada com nada', async () => {
      const armazenamento = cenario();
      const curadorias = [{ id: 'cu-2', turmas: ['Balé 9'], alunas: ['Zefa'] }];
      const r = await porta.revalidacaoPendente(armazenamento, null, LINHAS, curadorias);
      assert.strictEqual(r.pendentes.get('curadoria:cu-2'), undefined,
        'sem elenco derivado, um «está vazio» marcaria toda a curadoria antiga para sempre');
    });

    /* E O AVISO NA TELA DIZ A TRAVESSIA INTEIRA — curadoria, plano de ensino e plano de
     * observação. O PO não tem turma (tem o plano de que depende); sem o puxar por ali, o último
     * passo da ordem que ela pediu ficava de fora da frase. */
    await okAsync('o aviso da cascata inclui o PO, que se puxa pelo plano da turma', async () => {
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
            if (url.indexOf('revalidacao') !== -1) {
              return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({
                ok: true,
                ordem: ['linha-de-base', 'curadoria', 'plano-de-ensino', 'plano-de-observacao'],
                pendentes: [
                  { id: 'curadoria:cu-1', familia: 'curadoria', turma: 'Balé 1' },
                  { id: 'plano-1', familia: 'plano', turma: 'Balé 1' },
                  { id: 'po-1', familia: 'po', dependenteDe: 'plano-1' },
                  { id: 'po-2', familia: 'po', dependenteDe: 'plano-de-outra-turma' },
                ],
              }), text: () => Promise.resolve('') });
            }
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve({ ok: true, linhas: [], divergentes: [], campos: [], alunas: [] }),
              text: () => Promise.resolve('') });
          };
        },
      });
      const win = dom.window;
      await new Promise((r) => win.setTimeout(r, 250));
      win.avisarCascata('Balé 1');
      await new Promise((r) => win.setTimeout(r, 50));
      const alvo = win.document.querySelector('[data-res="linha-base"]');
      const texto = (alvo && alvo.textContent) || '';
      assert.ok(/a curadoria/.test(texto), 'a curadoria entra: ' + texto);
      assert.ok(/o plano de ensino/.test(texto), 'o plano de ensino entra: ' + texto);
      assert.ok(/o plano de observação/.test(texto), 'e o PO também: ' + texto);
      assert.ok(texto.indexOf('a curadoria') < texto.indexOf('o plano de ensino')
        && texto.indexOf('o plano de ensino') < texto.indexOf('o plano de observação'),
        'na ORDEM da dependência, não na ordem do mapa: ' + texto);
      assert.ok(texto.indexOf('po-2') === -1 && texto.indexOf('plano-de-outra-turma') === -1,
        'o PO de outra turma não entra na travessia desta');
      dom.window.close();
    });
  }

  /* 15. A CRIAÇÃO NÃO ESCOLHE ALUNAS À MÃO — e a edição mostra o que lá está (05/11/2026).
   *
   * A pergunta foi feita e a resposta foi seca: «na criação ele desaparece, na edição aparece
   * pré-preenchido». A prova corre a página em jsdom e chama a função VERDADEIRA, com o `fetch`
   * substituído: é a única forma de medir um comportamento que depende de onde se está (criar ou
   * editar) e de uma resposta de rede.
   */
  /* 15. A CURADORIA NÃO ESCOLHE ALUNAS — o campo saiu, e o elenco vem da linha de base
   *      (05/11/2026).
   *
   * A DECISÃO, nas palavras dela: «tem que tirar o campo alunas, porque agora ele não faz mais
   * parte da curadoria. Ele vai ser embutido dentro da turma por meio da linha de base.» A versão
   * anterior desta secção media a criação-versus-edição de um campo que agora não existe: foi
   * reescrita, e não apagada — a asserção que envelhece sem ser invertida mente a favor de um
   * código que já não existe.
   *
   * O QUE SE MEDE AGORA, e porquê:
   *
   *   · o CAMPO não existe na página (nem a caixa, nem o escolhedor de alunas da curadoria);
   *   · a NOTA existe e diz de onde vem o elenco — sem ela, o campo desaparecia em silêncio e
   *     quem atribui a curadoria não saberia que a turma já traz gente;
   *   · o SERVIDOR aceita uma curadoria sem alunas e CARIMBA o elenco derivado da turma. É este
   *     carimbo que mantém viva a cascata do «rever» que ela pediu: sem «antes» gravado não há
   *     diferença para medir, e o aviso cairia em silêncio para sempre.
   */
  console.log('\n15. A CURADORIA NÃO ESCOLHE ALUNAS — o campo saiu, o elenco vem da linha de base');
  ok('o formulário da curadoria já não tem escolhedor de alunas', () => {
    assert.strictEqual(PAGINA.indexOf('id="cu-alunas-campo"'), -1,
      'a caixa do escolhedor saiu — o campo não faz parte da curadoria');
    assert.ok(PAGINA.indexOf('id="cu-elenco-nota"') !== -1,
      'a nota fica: é ela que diz de onde vem o elenco');
    const inicio = PAGINA.indexOf('id="form-curadoria"');
    const fim = PAGINA.indexOf('id="cu-elenco-nota"', inicio);
    const trecho = PAGINA.slice(inicio, fim);
    assert.ok(trecho.indexOf('id="cuturma"') !== -1, 'a turma continua a ser o campo da curadoria');
    assert.strictEqual(/esc-alunas/.test(trecho), false,
      'e entre a abertura do formulário e a nota não há escolhedor de alunas');
  });

  ok('o pedido da curadoria já não leva `alunas`', () => {
    const inicio = PAGINA.indexOf('var campos = {');
    const fim = PAGINA.indexOf('repertorio:', inicio);
    const trecho = PAGINA.slice(inicio, fim);
    assert.ok(trecho.indexOf('alunas:') === -1,
      'o corpo do pedido não declara alunas: o servidor carimba o elenco da turma');
  });

  await okAsync('o SERVIDOR aceita a curadoria sem alunas e carimba o elenco da turma', async () => {
    const chaveLB = 'bastidores/' + ESCOLA + '/linhas-de-base';
    const kv = kvFalso({
      [chaveLB]: JSON.stringify([{
        id: 'nivel-1', nome: 'Nível 1', turma: 'Balé 1', enviada_em: '2026-11-05T10:00:00Z',
        alunas: ['Ana', 'Bia'],
        campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
      }]),
      ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([{
        id: 'bale-1', nome: 'Balé 1', dias: ['segunda'], frequencia: 2, duracaoMin: 60,
        periodoInicio: '2026-10-20', periodoFim: '2026-12-17',
      }]),
    });
    const env = envFalso(kv);
    const r = await chamar(env, '/api/bastidores/curadoria', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professor: 'rabo-gramde', modalidade: 'bale-classico', tradicao: 'francesa',
        turmas: ['Balé 1'], senhaDirecao: 'senha-de-prova',
      }),
    });
    assert.ok(r.status === 200 || r.status === 201, 'HTTP ' + r.status + ': ' + r.texto.slice(0, 300));
    const guardada = JSON.parse(kv.mapa.get('bastidores/' + ESCOLA + '/curadorias'))[0];
    assert.deepStrictEqual([...guardada.alunas], ['Ana', 'Bia'],
      'o elenco é o da turma, carimbado no momento da atribuição');
  });

  await okAsync('e a cascata do «rever» continua a funcionar com esse carimbo', async () => {
    /* O A/B do carimbo: com o elenco da curadoria igual ao derivado, ninguém é marcado; tirando
     * uma aluna da linha de base, a curadoria daquela turma entra nas pendências. É exactamente
     * o que ela pediu — «ele vai ter que passar na curadoria» —, e sem o carimbo esta prova não
     * teria contra o que comparar. */
    const armazenamento = armazenamentoFalso({
      anamneses: [{ id: 'anamnese-20261101-1000', aluna: 'Ana', gerado_em: '2026-11-01T10:00:00Z' }],
      planos: [], pos: [],
    });
    const linhas = [{
      id: 'nivel-1', nome: 'Nível 1', turma: 'Balé 1', alunas: ['Ana'],
      atualizada_em: '2026-11-04T10:00:00Z',
      campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal' }],
    }];
    const carimbada = [{ id: 'cu-1', turmas: ['Balé 1'], alunas: ['Ana', 'Bia'] }];
    const r = await porta.revalidacaoPendente(armazenamento, null, linhas, carimbada);
    const entrada = r.pendentes.get('curadoria:cu-1');
    assert.ok(entrada, 'a aluna que saiu do elenco tem de marcar a curadoria');
    assert.deepStrictEqual([...entrada.saiu], ['Bia'], 'e dizer QUEM saiu');
  });

  /* 16. A CURADORIA AVISA NA LISTA — o primeiro passo da cascata tem de ser visível (05/11/2026).
   *
   * Ela: «ele vai ter que passar na curadoria, da curadoria ele vai ter que ir para o plano de
   * ensino, do plano de ensino ele vai ter que ir para o plano de observação». Um passo que não se
   * vê não se percorre — e o plano de ensino já tinha o seu «rever» na lista dele. Faltava o
   * primeiro. A conta corre na rota das linhas de base porque NÃO precisa de envelope nenhum: são
   * duas listas do KV, e a página da Produção já pede essa rota no arranque.
   */
  console.log('\n16. A CURADORIA AVISA NA LISTA — o primeiro passo da cascata fica visível');
  {
    const semear = async (alunasDaCuradoria) => {
      const kv = kvFalso();
      const env = envFalso(kv);
      await chamar(env, '/api/bastidores/linha-de-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Nível 1', campos: ['equilibrio-unipodal'],
          alunas: ['Ana', 'Bia'], senhaDirecao: 'senha-de-prova',
        }),
      });
      // O CADASTRO DA TURMA é uma escrita direta ao KV: a rota de turmas tem as suas próprias
      // regras, e o que se mede aqui é o ENVIO, não o cadastro.
      kv.mapa.set('bastidores/' + ESCOLA + '/turmas', JSON.stringify([{ nome: 'Balé 1' }]));
      kv.mapa.set('bastidores/' + ESCOLA + '/curadorias', JSON.stringify([
        { id: 'cu-1', turmas: ['Balé 1'], alunas: alunasDaCuradoria },
      ]));
      const envio = await chamar(env, '/api/bastidores/linha-de-base/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'nivel-1', turma: 'Balé 1', senhaDirecao: 'senha-de-prova' }),
      });
      assert.strictEqual(envio.status, 200, 'HTTP ' + envio.status + ': ' + envio.texto.slice(0, 200));
      const r = await chamar(env, '/api/bastidores/linhas-de-base');
      return r.corpo;
    };

    await okAsync('a curadoria cujo elenco já não é o da turma vem na lista de divergentes', async () => {
      const corpo = await semear(['Ana', 'Bia', 'Carla']);
      assert.ok(Array.isArray(corpo.divergentes), 'a rota tem de devolver `divergentes`');
      assert.strictEqual(corpo.divergentes.length, 1);
      assert.strictEqual(corpo.divergentes[0].curadoria, 'cu-1');
      assert.strictEqual(corpo.divergentes[0].turma, 'Balé 1');
    });

    await okAsync('CONTROLE NEGATIVO: com o elenco igual, a lista vem vazia', async () => {
      const corpo = await semear(['Ana', 'Bia']);
      assert.deepStrictEqual([...corpo.divergentes], [],
        'sem diferença não há aviso — um selo que nunca cai deixa de se ler');
    });

    await okAsync('e a lista das curadorias tem o gancho onde o selo entra', async () => {
      const corpo = await semear(['Ana', 'Bia', 'Carla']);
      assert.ok(corpo.linhas.length === 1);
      /* O GANCHO MORA NA MARCAÇÃO, e a marcação é uma string do servidor. Mede-se o que o
       * `paginaProducao` emite com uma curadoria: a lista com id e cada linha com o seu
       * `data-curadoria` — sem eles o script não tem onde escrever, e o aviso nunca apareceria.
       * A página sem curadorias não serve para esta medida: sem linhas, o gancho não se vê. */
      const b = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
      const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
      const html = b.paginaProducao('calango', { nome: 'Calango', modalidade: 'bale-classico' },
        [], ['Ana', 'Bia', 'Carla'], 'Dono', 'dono', [], [], {}, [
          { id: 'cu-1', turma: 'Balé 1', alunas: ['Ana', 'Bia', 'Carla'] },
        ], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '');
      assert.ok(html.indexOf('id="cu-lista"') !== -1, 'a lista das curadorias tem de ter id');
      assert.ok(/<li data-curadoria="cu-1"/.test(html),
        'e cada linha tem de dizer de que curadoria é');
    });
  }

  /* 17. A TIRA GRAVA, O LER GRAVA, O APAGAR LIMPA E A LISTA É A DA CASA (05/11/2026).
   *
   * O PERCURSO DELA, tal como o contou: preencheu o passo 1 («teste»), marcou a Aluna A no passo 2,
   * foi ao passo 3 e o botão respondeu «grave a linha de base primeiro — a leitura fica guardada
   * nela» — sem haver onde gravar. A lista mostrava «0 alunas» de uma linha cuja aluna estava
   * marcada no ecrã, e depois de «Apagar» a tela continuava no passo 2 com o nome do passo 1 e o
   * erro «a linha de base não encontrada: teste».
   *
   * A CAUSA ERA UMA SÓ, e é de fluxo: a tira chamava `mostrarPassoLb` directamente. Só o «Seguir»
   * do passo 1 e o fim do 4 gravavam; o 2 e o 3 nunca chegavam ao servidor. Estas asserções medem
   * o PEDIDO e o ESTADO, não a marcação — uma prova de presença passaria com tudo isto partido. */
  console.log('\n17. A TIRA GRAVA — o passo 2 chega ao servidor, e o apagar fecha o formulário');
  {
    const montar = async () => {
      let JSDOM, VirtualConsole;
      ({ JSDOM, VirtualConsole } = require('jsdom'));
      const vc = new VirtualConsole();
      vc.on('jsdomError', () => {}); vc.on('error', () => {});
      const pedidos = [];
      let linhas = [];
      const dom = new JSDOM(PAGINA.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.confirm = () => true; w.alert = () => {};
          w.fetch = (u, opcoes) => {
            const url = String(u);
            const metodo = (opcoes && opcoes.method) || 'GET';
            const responder = (corpo, status) => Promise.resolve({
              ok: true, status: status || 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve(''),
            });
            if (metodo === 'POST' && url.indexOf('/linha-de-base/enviar') !== -1) {
              return responder({ ok: true, turma: 'Balé 1', alunas: [] });
            }
            if (metodo === 'POST' && url.indexOf('linha-de-base') !== -1) {
              const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
              pedidos.push(corpo);
              const linha = {
                id: corpo.id || 'teste', nome: corpo.nome, professor: corpo.professor,
                alunas: corpo.alunas || [], campos: (corpo.campos || []).map((id) => ({ id })),
                rascunho: !(corpo.campos || []).length,
              };
              const i = linhas.findIndex((l) => l.id === linha.id);
              linhas = i === -1 ? linhas.concat([linha]) : linhas.map((l, k) => (k === i ? linha : l));
              return responder({ ok: true, criada: i === -1, linha }, i === -1 ? 201 : 200);
            }
            if (metodo === 'DELETE' && url.indexOf('linha-de-base') !== -1) {
              const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
              linhas = linhas.filter((l) => l.id !== corpo.id);
              return responder({ ok: true, linha: corpo.id, planosQueAUsavam: 0 });
            }
            if (url.indexOf('linha-de-base/leitura') !== -1) {
              return responder({ ok: true, leitura: { alunas: ['Aluna A'] },
                classificacao: { alunos: 1, atencao: [], excelencia: [], musicalidade: [], comuns: [], semRegisto: [] } });
            }
            const corpo = url.indexOf('alunas-com-anamnese') !== -1
              ? { ok: true, alunas: [{ aluna: 'Aluna A', carimbo: 'anamnese-20261105-1240', novo: true }] }
              : url.indexOf('campos-do-corpo') !== -1
                ? { ok: true, campos: [{ id: 'equilibrio-unipodal', nome: 'Equilíbrio unipodal', grupo: 'g', eixo: 'Funcional', dimensao: 'funcional', opcoes: ['A', 'B'] }], grupos: ['g'] }
                : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas, divergentes: [] } : { ok: true };
            return responder(corpo);
          };
        },
      });
      const win = dom.window;
      await new Promise((r) => win.setTimeout(r, 250));
      return { win, pedidos, lerLinhas: () => linhas };
    };

    await okAsync('clicar no passo 3 da TIRA grava o passo 2 — e leva a aluna no pedido', async () => {
      const { win, pedidos, lerLinhas } = await montar();
      win.document.getElementById('lb-nome').value = 'teste';
      const sel = win.document.getElementById('lb-professor');
      if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
      win.document.querySelector('input[name="lb-aluna"]').checked = true;
      win.pintarTravasLb();
      win.document.querySelector('#lb-tira button[data-passo="3"]').click();
      await new Promise((r) => win.setTimeout(r, 120));

      assert.ok(pedidos.length >= 1, 'a tira tem de gravar antes de mostrar o passo');
      const ultimo = pedidos[pedidos.length - 1];
      assert.strictEqual(ultimo.nome, 'teste');
      assert.strictEqual(ultimo.alunas.length, 1,
        'a aluna marcada no passo 2 vai no pedido — era o que faltava para a lista dizer «0 alunas»');
      assert.strictEqual(ultimo.alunas[0], 'Aluna A');
      assert.strictEqual(win.document.getElementById('lb-modo').value, 'teste',
        'e o formulário passa a saber o id: é isso que o «Ler» procura');
      assert.strictEqual(win.LB_PASSO, 3, 'só depois de gravar é que o passo 3 abre');
      assert.strictEqual(lerLinhas()[0].alunas.length, 1,
        'e o que ficou gravado é o que está no ecrã');
      win.close();
    });

    await okAsync('o «Ler as anamneses» grava em vez de mandar gravar', async () => {
      const { win, pedidos } = await montar();
      win.document.getElementById('lb-nome').value = 'teste';
      const sel = win.document.getElementById('lb-professor');
      if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
      win.document.querySelector('input[name="lb-aluna"]').checked = true;
      /* Chega-se ao passo 3 e LIMPA-SE o id — é o estado exacto do relato: a linha existia na
       * lista, o formulário não sabia dela, e a leitura respondia «grave primeiro». */
      win.mostrarPassoLb(3);
      win.document.getElementById('lb-modo').value = '';
      pedidos.length = 0;
      win.document.getElementById('lb-ler').click();
      await new Promise((r) => win.setTimeout(r, 200));

      assert.ok(pedidos.length >= 1, 'o «Ler» grava primeiro — o passo que pede não pode ser o que não existe');
      const alvo = win.document.querySelector('[data-res="linha-base"]');
      assert.ok(!/grave a linha de base primeiro/i.test((alvo && alvo.textContent) || ''),
        'e a mensagem «grave primeiro» desaparece: ' + (alvo && alvo.textContent));
      assert.strictEqual(win.LEITURA_FEITA, true, 'a leitura corre depois de gravar');
      win.close();
    });

    await okAsync('excluir a linha ABERTA limpa o formulário — o «não encontrada» não volta', async () => {
      const { win, lerLinhas } = await montar();
      win.document.getElementById('lb-nome').value = 'teste';
      const sel = win.document.getElementById('lb-professor');
      if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
      win.pintarTravasLb();
      win.document.getElementById('lb-seguir').click();
      await new Promise((r) => win.setTimeout(r, 120));
      assert.strictEqual(win.document.getElementById('lb-modo').value, 'teste');

      const excluir = win.document.querySelector('[data-lb-apagar="teste"]');
      assert.ok(excluir, 'a lista tem de oferecer o «Excluir» da linha aberta');
      excluir.click();
      await new Promise((r) => win.setTimeout(r, 150));

      assert.strictEqual(lerLinhas().length, 0, 'a linha saiu do servidor');
      assert.strictEqual(win.document.getElementById('lb-modo').value, '',
        'e o formulário deixa de apontar para ela — era daqui que vinha «não encontrada: teste»');
      assert.strictEqual(win.document.getElementById('lb-nome').value, '',
        'o nome do passo 1 também sai, como ela pediu');
      assert.strictEqual(win.LB_PASSO, 1, 'e a tela volta ao princípio');
      win.close();
    });

    await okAsync('a listagem usa a LINHA DA CASA — e não classes que ninguém desenhou', async () => {
      const { win, lerLinhas } = await montar();
      win.document.getElementById('lb-nome').value = 'teste';
      const sel = win.document.getElementById('lb-professor');
      if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
      win.pintarTravasLb();
      win.document.getElementById('lb-seguir').click();
      await new Promise((r) => win.setTimeout(r, 120));
      assert.strictEqual(lerLinhas().length, 1);

      const li = win.document.querySelector('#lb-lista li');
      /* A FORMA É A DO CARTÃO DO ACERVO, e ela deu o exemplo por palavras: «o nome, tem uma
       * etiqueta, aí tem dois botões e aí tem três blocos que eu expando ou colapso».
       * `.trio-plano` é o cartão; `.trio-linha` a linha do nome; `.fatos` a linha abaixo dele;
       * `.trio` as caixas; `.trio-painel` o que cada uma abre. */
      assert.ok(li.classList.contains('trio-plano'), 'o cartão é o da lista do acervo');
      assert.ok(li.querySelector('.trio-linha .trio-nome b'), 'o nome é o <b> dentro de .trio-nome');
      assert.ok(li.querySelector('.trio-linha .trio-acoes'),
        'e os botões vivem em .trio-acoes, à direita');
      assert.ok(li.querySelector('.fatos'), 'a linha abaixo do nome traz o que se lê sem abrir');
      assert.ok(li.querySelector('.trio-dono'), 'e o contexto desce para .trio-dono');
      assert.ok(li.querySelector('.selo'), 'o estado é um selo — não uma frase sobre passos');
      assert.strictEqual(li.querySelectorAll('.linha-titulo, .linha-sub').length, 0,
        'linha-titulo/linha-sub não existem na folha nem em gancho nenhum: eram texto solto');
      assert.ok(/por completar/.test(li.textContent),
        'sem recorte, o estado diz-se em português de lista: ' + li.textContent);
      assert.ok(!/passo 4/.test(li.textContent),
        'a lista não fala de passos — quem está a preencher é que sabe em que passo está: '
        + li.textContent);
      /* AS TRÊS CAIXAS, com o «?» que promete o que está lá dentro, e um painel para cada. */
      const caixas = li.querySelectorAll('.trio .trio-item');
      assert.strictEqual(caixas.length, 3,
        'o cartão tem as três caixas do percurso: ' + caixas.length);
      const rotulos = [...caixas].map((c) => c.getAttribute('data-balao'));
      assert.deepStrictEqual([...rotulos], ['alunas', 'recorte', 'turma'],
        'na ordem do percurso, não na do gosto: ' + rotulos.join(', '));
      assert.strictEqual(li.querySelectorAll('.trio-painel').length, 3,
        'e um painel para cada caixa');
      /* E AS CAIXAS ABREM: o handler é o mesmo das Turmas, e foi solto de `li.turma` para o
       * `<li>` da linha — sem isso, abrir o painel de um cartão fecharia o de outro. */
      caixas[1].click();
      await new Promise((r) => win.setTimeout(r, 30));
      const recorte = li.querySelector('.trio-painel[data-painel="recorte"]');
      assert.strictEqual(recorte.hidden, false, 'a caixa «Recorte» abre o painel dela');
      assert.strictEqual(caixas[1].getAttribute('aria-expanded'), 'true',
        'e o estado fica no aria-expanded, que é o que o leitor de ecrã anuncia');
      win.close();
    });

    await okAsync('«Editar» abre no princípio e não perde as alunas que lá estão', async () => {
      const { win, lerLinhas } = await montar();
      win.document.getElementById('lb-nome').value = 'teste';
      const sel = win.document.getElementById('lb-professor');
      if (sel && !sel.value) { sel.innerHTML = '<option value="rabo-gramde">rabo-gramde</option>'; sel.value = 'rabo-gramde'; }
      win.document.querySelector('input[name="lb-aluna"]').checked = true;
      win.pintarTravasLb();
      win.document.querySelector('#lb-tira button[data-passo="2"]').click();
      await new Promise((r) => win.setTimeout(r, 120));
      assert.strictEqual(lerLinhas()[0].alunas.length, 1, 'o passo 2 gravou a aluna');

      win.document.querySelector('[data-lb-editar="teste"]').click();
      await new Promise((r) => win.setTimeout(r, 80));
      assert.strictEqual(win.LB_PASSO, 1,
        'a edição começa onde a criação começa — os outros passos abrem-se pela tira');
      assert.strictEqual(win.document.getElementById('lb-nome').value, 'teste');
      const marcadas = win.document.querySelectorAll('input[name="lb-aluna"]:checked');
      assert.strictEqual(marcadas.length, 1, 'e as alunas voltam marcadas: não se perde o elenco');
      win.close();
    });
  }

  /* 18. SEM TURMA CADASTRADA, O PASSO 5 NÃO PEDE — DIZ O QUE FALTA (05/11/2026).
   *
   * O RELATO DELA: «eu não tenho nenhuma turma. […] ele tem que mostrar uma mensagem dizendo: olha,
   * ainda não existe nenhuma turma. Crie uma turma antes de definir a linha de base.» Um `select`
   * com uma única opção («— escolher —») diz que o professor não escolheu, quando o que falta é o
   * CADASTRO. São estados diferentes, e confundi-los manda procurar um defeito que não existe.
   *
   * A prova mede a página EMITIDA com zero turmas: o aviso, o caminho para as Turmas, e o
   * «Concluir» travado com o motivo certo — «uma turma cadastrada», e não «a turma de destino». */
  console.log('\n18. SEM TURMA CADASTRADA — o passo 5 diz o que falta e leva às Turmas');
  {
    const semTurmas = (() => {
      const b = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
      const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
      return b.paginaProducao('calango', { nome: 'Calango', modalidade: 'bale-classico' },
        [], ['Aluna A'], 'Dono', 'dono', [], [], {}, [], [], [], usos,
        { modo: 'clara', paleta: 'bordo' }, '');
    })();

    ok('a escola sem turma recebe a MENSAGEM, e não um select de uma opção', () => {
      assert.ok(/id="lb-sem-turma"/.test(semTurmas),
        'o aviso do estado vazio tem de estar na marcação');
      assert.ok(/Ainda não existe nenhuma turma cadastrada/.test(semTurmas),
        'e tem de dizer o que falta, por palavras');
      assert.ok(/antes de definir a linha de base/.test(semTurmas),
        'e quando é que se resolve: antes');
    });

    ok('e o caminho para resolver está escrito — um link para as Turmas', () => {
      assert.ok(/data-ir-para-turmas/.test(semTurmas),
        'o aviso leva à secção Turmas; um aviso sem caminho é um beco');
      assert.ok(/Ir a Turmas/.test(semTurmas), 'com um rótulo que diz para onde vai');
    });

    ok('o «Concluir» fica travado', () => {
      assert.ok(/id="lb-enviar"[^>]*disabled/.test(semTurmas),
        'sem turma não há para onde enviar');
    });

    /* A FALTA DO PASSO 5 TEM DE NOMEAR O CADASTRO, e isto mede-se a CORRER, não na marcação:
     * a frase «uma turma cadastrada (secção Turmas)» está escrita no `<script>` em qualquer caso —
     * é código —, e procurá-la na página passava com o `LB_TEM_TURMA` desligado. Foi o A/B que o
     * disse: a asserção anterior dava verde com o defeito lá. Agora a função é chamada. */
    await okAsync('a falta do passo 5 diz «uma turma cadastrada», e não «a turma de destino»', async () => {
      let JSDOM, VirtualConsole;
      ({ JSDOM, VirtualConsole } = require('jsdom'));
      const vc = new VirtualConsole();
      vc.on('jsdomError', () => {}); vc.on('error', () => {});
      const dom = new JSDOM(semTurmas.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://calango.workers.dev/bastidores/producao',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.confirm = () => true; w.alert = () => {};
          w.fetch = () => Promise.resolve({ ok: true, status: 200,
            json: () => Promise.resolve({ ok: true, linhas: [], divergentes: [], campos: [],
              grupos: [], alunas: [{ aluna: 'Aluna A', carimbo: 'anamnese-20260801-1000', novo: true }] }),
            text: () => Promise.resolve('') });
        },
      });
      const win = dom.window;
      await new Promise((r) => win.setTimeout(r, 250));
      assert.strictEqual(win.LB_TEM_TURMA, false, 'sem turma na escola, a flag diz que não há');
      const falta = [...win.faltasDoPassoLb(5)].join(' ');
      assert.ok(/turma cadastrada/i.test(falta),
        'a falta é do CADASTRO: ' + falta);
      assert.strictEqual(/turma de destino/.test(falta), false,
        'e não é «escolher uma turma que não existe»: ' + falta);
      dom.window.close();
    });

    ok('e o formulário do passo 5 continua completo (um input escondido, não um campo morto)', () => {
      assert.ok(/id="lb-turma-destino"/.test(semTurmas),
        'a função que envia continua a ter o que ler — sem valor');
      assert.strictEqual(/<select id="lb-turma-destino">/.test(semTurmas), false,
        'e não há um select que não se pode preencher');
    });

    /* O CONTROLE POSITIVO, na outra ponta: com turma, o select volta e o aviso não existe. Sem
     * isto, um `if` trocado deixaria as duas escolas iguais e esta secção passaria. */
    await okAsync('CONTROLE: com turma cadastrada, o select volta e o aviso desaparece', async () => {
      const b = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
      const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
      const comTurma = b.paginaProducao('calango', { nome: 'Calango', modalidade: 'bale-classico' },
        [], ['Aluna A'], 'Dono', 'dono', [{ nome: 'Balé 1' }], [], {}, [], [], [], usos,
        { modo: 'clara', paleta: 'bordo' }, '');
      assert.ok(/<select id="lb-turma-destino">/.test(comTurma), 'com turma, há o que escolher');
      assert.strictEqual(comTurma.indexOf('id="lb-sem-turma"'), -1,
        'e o aviso do vazio não aparece');
      assert.ok(/Balé 1/.test(comTurma), 'a turma da escola está na lista');
    });
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
  /* ACEITA OS TRÊS — anamneses, planos e POs (05/11/2026). A cascata do elenco precisa de medir a
   * DESCIDA (curadoria → plano de ensino → plano de observação), e para isso os envelopes têm de
   * existir no acervo falso. O formato antigo (um array de anamneses) continua válido: as doze
   * asserções anteriores chamam-no assim, e mudá-las para caber no formato novo seria reescrever a
   * prova para acomodar a bancada. */
  const entrada = Array.isArray(anamneses) ? { anamneses } : (anamneses || {});
  const lista = Array.isArray(entrada.anamneses) ? entrada.anamneses : [];
  const planos = Array.isArray(entrada.planos) ? entrada.planos : [];
  const pos = Array.isArray(entrada.pos) ? entrada.pos : [];
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
  /* A TURMA DO PLANO VEM DE `contexto-turma` (é a resposta, não o contexto do envelope): quem a lê
   * é `turmaDoEnvelope`, e um fixture com `contexto.turma` daria um plano sem turma — e uma cascata
   * que nunca desce, sem falhar. */
  for (const p of planos) {
    arquivos.set('envelope/' + p.id + '.json', JSON.stringify({
      id: p.id,
      gerado_em: p.gerado_em,
      contexto: { escola: 'calango', professor: p.professor || 'rabo-gramde', ciclo: '01' },
      respostas: {
        'objetivo-geral': { valor: p.objetivo || 'objetivo de prova' },
        'contexto-turma': { valor: p.turma },
      },
    }));
  }
  for (const o of pos) {
    arquivos.set('envelope/' + o.id + '.json', JSON.stringify({
      id: o.id,
      gerado_em: o.gerado_em,
      contexto: { escola: 'calango', professor: o.professor || 'rabo-gramde', ciclo: '01' },
      respostas: {
        sujeitos: { valor: o.sujeitos || [] },
        'plano-de-ensino': { valor: o.planos || [] },
      },
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
