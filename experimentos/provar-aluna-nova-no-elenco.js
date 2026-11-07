'use strict';

/**
 * provar-aluna-nova-no-elenco.js — A ALUNA QUE ENTRA NUM ELENCO QUE JÁ EXISTE (07/11/2026).
 *
 * O DEFEITO, como ela o relatou: «é frequente a entrada de uma nova aluna num elenco que já
 * existe e já está associado a uma turma em funcionamento. O professor edita o elenco para incluir
 * a nova aluna, lê as anamneses, escolhe o recorte e conclui. Depois atualiza a Turma e revê os
 * planos. E o vínculo da aluna B some — ela continua aparecendo como livre na anamnese e não é
 * contabilizada na aula para o lançamento de dados.»
 *
 * O QUE SE MEDE AQUI, e não se supõe. O fluxo inteiro, contra o SERVIDOR de verdade, com um KV
 * falso e sem repositório (o regime que a escola tem quando a série está no KV): criar o elenco,
 * atribuí-lo numa Turma, ACRESCENTAR UMA ALUNA, regravar a Turma — e então perguntar às duas
 * leituras que o sistema usa se ela lá está:
 *
 *   · a da PRODUÇÃO (`bastidores.linhasDeBase`) — a tela onde ela acabou de mexer;
 *   · a da PORTA (`cloudflare.lerLinhasDeBaseDoEnv`) — a que o Plano de Observação, o plano de
 *     ensino e a geração leem.
 *
 * As duas respondem à mesma pergunta, e é isso que a prova guarda: se discordarem, a tela mostra
 * uma coisa e o documento assina outra, sem falhar em lado nenhum.
 *
 *   node experimentos/provar-aluna-nova-no-elenco.js
 */

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const CF = require(path.join(RAIZ, 'motor/servidor/cloudflare.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const linhaDeBase = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));

const BASE = 'https://escola-de-prova.tmenegaz77.workers.dev';
const SENHA = 'senha-da-direcao';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

function criarKv() {
  const dados = new Map();
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix))
        .map((name) => ({ name })), list_complete: true };
    },
  };
}

function ambiente() {
  return {
    ESCOLA_SLUG: 'escola-de-prova',
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA,
    SENHA_PROFESSOR: 'senha-do-professor',
    PROFESSOR_NOME: 'Leticia',
    PADD_KV: criarKv(),
  };
}

async function pedir(env, caminho, init) {
  const r = await bastidores.fetchSemRede(new Request(BASE + caminho, init), env);
  let corpo = null;
  try { corpo = await r.json(); } catch { corpo = null; }
  return { status: r.status, corpo };
}

const postar = (env, caminho, corpo) => pedir(env, caminho, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.assign({ senhaDirecao: SENHA }, corpo)),
});

const RITMO = {
  dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
  duracaoMin: 60, periodoInicio: '2026-11-10', periodoFim: '2026-12-20',
};
const SALA = 'Sala Rosa';
const RECORTE = ['cinco-posicoes-1a-pes', 'cinco-posicoes-2a-pes'];

(async () => {
  const env = ambiente();

  // -------------------------------------------------------------------------------------------
  bloco('1. O FLUXO INTEIRO, CONTRA O SERVIDOR: elenco com uma aluna → Turma → entra a segunda');

  const sala = await postar(env, '/api/bastidores/turma', Object.assign({ nome: SALA }, RITMO));
  provar('a sala é criada', sala.status === 201 || sala.status === 200,
    { status: sala.status, erro: sala.corpo && sala.corpo.erro });

  /* O ELENCO. Duas gravações, como no formulário: primeiro um RASCUNHO (o que cada «Seguir»
   * faz enquanto não há recorte), e só depois o «Concluir elenco». A diferença entre as duas é o
   * que a correcção de hoje separa — e é ela que a asserção seguinte mede. */
  const rascunho = await postar(env, '/api/bastidores/linha-de-base', {
    nome: 'Tami', professor: 'leticia', alunas: ['Aluna A'], campos: [], rascunho: true,
  });
  provar('o rascunho grava (é o que cada «Seguir» faz)',
    rascunho.status === 201 || rascunho.status === 200,
    { status: rascunho.status, erro: rascunho.corpo && rascunho.corpo.erro });

  const criado = await postar(env, '/api/bastidores/linha-de-base', {
    nome: 'Tami', professor: 'leticia', alunas: ['Aluna A'], campos: RECORTE,
    rascunho: false, concluir: true,
  });
  provar('o elenco é concluído com a aluna A', criado.status === 201 || criado.status === 200,
    { status: criado.status, erro: criado.corpo && criado.corpo.erro });
  provar('a conclusão grava um ACTO — com carimbo, que é o que os leitores reconhecem',
    !!(criado.corpo && criado.corpo.linha && criado.corpo.linha.carimbo),
    { carimbo: criado.corpo && criado.corpo.linha && criado.corpo.linha.carimbo,
      gravado: criado.corpo && criado.corpo.gravado });
  const idElenco = criado.corpo && criado.corpo.linha && criado.corpo.linha.id;
  provar('o elenco não declara turma — quem a declara é a Turma (nomenclatura de 07/11/2026)',
    criado.corpo && criado.corpo.linha && !criado.corpo.linha.turma,
    criado.corpo && criado.corpo.linha && criado.corpo.linha.turma);

  const turma = await postar(env, '/api/bastidores/curadoria', {
    professor: 'leticia', modalidade: 'bale-classico', tradicao: 'RAD',
    turmas: [SALA], linhaDeBase: idElenco, repertorio: [],
  });
  provar('a Turma é criada escolhendo esse elenco',
    turma.status === 201 || turma.status === 200,
    { status: turma.status, erro: turma.corpo && turma.corpo.erro });
  provar('e o registo da Turma carimba a aluna A — o «antes» contra que a cascata compara',
    turma.corpo && turma.corpo.curadoria
    && JSON.stringify(turma.corpo.curadoria.alunas) === JSON.stringify(['Aluna A']),
    turma.corpo && turma.corpo.curadoria && turma.corpo.curadoria.alunas);

  // A SEGUNDA ALUNA ENTRA NO ELENCO — pela Audição, com o mesmo id (é uma edição, não um elenco novo).
  const editado = await postar(env, '/api/bastidores/linha-de-base', {
    id: idElenco, nome: 'Tami', professor: 'leticia',
    alunas: ['Aluna A', 'Aluna B'], campos: RECORTE, rascunho: false, concluir: true,
  });
  provar('a aluna B entra no elenco (edição do mesmo id)',
    editado.corpo && editado.corpo.linha
    && JSON.stringify(editado.corpo.linha.alunas) === JSON.stringify(['Aluna A', 'Aluna B']),
    editado.corpo && editado.corpo.linha && editado.corpo.linha.alunas);

  // A TURMA É REGRAVADA — o gesto que ela descreve («atualiza a Turma»).
  const turma2 = await postar(env, '/api/bastidores/curadoria', {
    professor: 'leticia', modalidade: 'bale-classico', tradicao: 'RAD',
    turmas: [SALA], linhaDeBase: idElenco, repertorio: [],
  });
  provar('a Turma regrava (ou recusa a edição e manda derivar)',
    turma2.status === 200 || turma2.status === 201 || turma2.status === 409,
    { status: turma2.status, erro: turma2.corpo && turma2.corpo.erro });
  provar('e o registo da Turma passa a declarar as DUAS alunas',
    turma2.corpo && turma2.corpo.curadoria
    && JSON.stringify(turma2.corpo.curadoria.alunas) === JSON.stringify(['Aluna A', 'Aluna B']),
    turma2.corpo && turma2.corpo.curadoria && turma2.corpo.curadoria.alunas);

  // -------------------------------------------------------------------------------------------
  bloco('\n2. AS DUAS LEITURAS DA MESMA LISTA — a Produção e a porta');

  const daProducao = await bastidores.linhasDeBaseDaEscola(env, 'escola-de-prova');
  const daPorta = await CF.lerLinhasDeBaseDoEnv(env)('escola-de-prova');

  provar('a PRODUÇÃO vê o elenco', daProducao.some((l) => l.id === idElenco),
    daProducao.map((l) => l.id));
  provar('a PORTA vê o mesmo elenco — é o que o PO, o plano e a geração leem',
    daPorta.some((l) => l.id === idElenco), daPorta.map((l) => l.id));
  provar('e as duas dizem as MESMAS alunas',
    JSON.stringify((daProducao.find((l) => l.id === idElenco) || {}).alunas)
      === JSON.stringify((daPorta.find((l) => l.id === idElenco) || {}).alunas),
    {
      producao: (daProducao.find((l) => l.id === idElenco) || {}).alunas,
      porta: (daPorta.find((l) => l.id === idElenco) || {}).alunas,
    });

  // -------------------------------------------------------------------------------------------
  bloco('\n3. O QUE A TURMA ENTREGA A QUEM OBSERVA — a pergunta da aluna B');

  const curs = (daProducao.length, await bastidores.curadorias(env.PADD_KV, 'escola-de-prova'));
  const pelaProducao = porta.alunasDaTurma(curs, { professor: 'leticia', turma: SALA }, daProducao);
  const pelaPorta = porta.alunasDaTurma(curs, { professor: 'leticia', turma: SALA }, daPorta);
  provar('pela lista da Produção, a turma entrega as duas', JSON.stringify(pelaProducao)
    === JSON.stringify(['Aluna A', 'Aluna B']), pelaProducao);
  provar('pela lista da porta, a turma entrega as duas', JSON.stringify(pelaPorta)
    === JSON.stringify(['Aluna A', 'Aluna B']), pelaPorta);

  /* O RECORTE É A OUTRA METADE. A lista de nomes é o que se vê; o `recorte` é o corpo que o PO
   * mede, o plano importa e a aula imprime. Um elenco que chega só com nomes deixaria a aluna B
   * na lista e sem nenhum aspecto observado — que é a mesma perda, com outra cara. */
  const lbDaPorta = porta.linhaDeBaseDoElenco(daPorta, idElenco);
  provar('o RECORTE do elenco chega à porta — o corpo que o PO, o plano e a aula imprimem',
    !!(lbDaPorta && Array.isArray(lbDaPorta.recorte) && lbDaPorta.recorte.length === RECORTE.length),
    lbDaPorta && lbDaPorta.recorte);
  provar('e o elenco que a porta lê não é rascunho — é o concluído',
    !!(lbDaPorta && !lbDaPorta.rascunho), lbDaPorta && { rascunho: lbDaPorta.rascunho });

  /* A CONTRAPROVA: um rascunho NÃO é um acto. Sem este negativo, «a porta vê o elenco» ficaria
   * verdadeiro mesmo que a porta aceitasse tudo — inclusive o que o professor abandonou a meio. */
  const idRascunho = (await postar(env, '/api/bastidores/linha-de-base', {
    nome: 'Rascunho', professor: 'leticia', alunas: ['Aluna C'], campos: [], rascunho: true,
  })).corpo.linha.id;
  const daPorta2 = await CF.lerLinhasDeBaseDoEnv(env)('escola-de-prova');
  provar('e um rascunho sem recorte NÃO entra na lista da porta',
    !daPorta2.some((l) => l.id === idRascunho), { id: idRascunho, ids: daPorta2.map((l) => l.id) });

  /* O ELENCO ANTIGO — criado antes desta correcção, sem `carimbo` e sem `concluida_em`, mas JÁ
   * escolhido por uma Turma. Ele tem de ser lido na mesma: senão cada escola ficaria a ter de
   * abrir o elenco e concluí-lo outra vez para o corpo voltar à cadeia. É a migração sem
   * migração — a declaração da Turma já chega. */
  const kv = env.PADD_KV;
  const CHAVE = 'bastidores/escola-de-prova/linhas-de-base';
  const brutos = JSON.parse(await kv.get(CHAVE) || '[]');

  // (a) O ELENCO DA PRÓPRIA TURMA, SEM AS MARCAS DO ACTO — o estado exacto dos elencos criados
  // entre a saída do passo 5 e esta correcção.
  const semMarcas = brutos.map((l) => {
    if (l.id !== idElenco) return l;
    const copia = Object.assign({}, l);
    delete copia.carimbo;
    delete copia.concluida_em;
    return copia;
  });
  await kv.put(CHAVE, JSON.stringify(semMarcas));
  const daPorta3 = await CF.lerLinhasDeBaseDoEnv(env)('escola-de-prova');
  provar('um elenco anterior à correcção, sem carimbo, é lido quando a Turma já o escolheu',
    daPorta3.some((l) => l.id === idElenco), daPorta3.map((l) => l.id));

  // (b) E UM ELENCO SEM ACTO E SEM TURMA, que ninguém escolheu — a lista não aceita tudo.
  await kv.put(CHAVE, JSON.stringify(semMarcas.concat([{
    id: 'elenco-solto', nome: 'Solto', professor: 'leticia',
    alunas: ['Aluna C'], campos: RECORTE,
  }])));
  const daPorta4 = await CF.lerLinhasDeBaseDoEnv(env)('escola-de-prova');
  provar('…e um elenco sem acto e sem Turma continua de fora — a lista não aceita tudo',
    !daPorta4.some((l) => l.id === 'elenco-solto'), daPorta4.map((l) => l.id));

  // -------------------------------------------------------------------------------------------
  bloco('\n4. A LISTAGEM DA ANAMNESE — «livre» ou vinculada à sala');

  const turmasDasAlunas = require(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js')).turmasDasAlunas;
  const mapa = turmasDasAlunas(curs, daProducao);
  provar('a aluna B aparece com a sala na listagem da anamnese', mapa.get('Aluna B') === SALA,
    { 'Aluna A': mapa.get('Aluna A'), 'Aluna B': mapa.get('Aluna B') });

  // A etiqueta «nova» é `!turma && !linhaDeBase`. A B tem as duas: não é nova, e não é «livre sem
  // vínculo» — está na sala.
  const filiacao = linhaDeBase.filiacaoDasAlunas(daProducao);
  provar('e a filiação do elenco diz a que elenco a B pertence',
    !!(filiacao.get('Aluna B') && filiacao.get('Aluna B').linhas.length),
    filiacao.get('Aluna B'));

  /* A ALUNA NOVA NUM ELENCO QUE JÁ TINHA TURMA, E A TURMA AINDA COM O ELENCO ANTIGO. É o instante
   * entre os dois gestos — o professor acabou de concluir o elenco e ainda não regravou a Turma —,
   * e é onde o vínculo «sumia»: a lista da anamnese perguntava à curadoria, que ainda dizia o
   * elenco de ontem. A resposta certa é a do ELENCO, que é quem declara o corpo: a B pertence ao
   * elenco «Tami», e o elenco «Tami» é o que a Turma escolheu. */
  const cursAntigas = curs.map((c) => Object.assign({}, c, { alunas: ['Aluna A'] }));
  const mapaAntes = turmasDasAlunas(cursAntigas, daProducao);
  provar('antes de a Turma ser regravada, a aluna B já aparece com a sala',
    mapaAntes.get('Aluna B') === SALA,
    { 'Aluna A': mapaAntes.get('Aluna A'), 'Aluna B': mapaAntes.get('Aluna B') });

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
    : 'TUDO CERTO — ' + total + ' asserções, 0 falha(s)') + '.');
  process.exit(falhas ? 1 : 0);
})().catch((err) => {
  console.error('provar-aluna-nova-no-elenco: ' + (err && err.stack ? err.stack : err));
  process.exit(2);
});
