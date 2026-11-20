#!/usr/bin/env node
'use strict';

/*
 * provar-cadeia-automatica.js — A TROCA E A SAÍDA PERCORREM A CADEIA SOZINHAS (09/11/2026).
 *
 * O QUE ESTA PROVA FIXA, e porquê:
 *
 *   A. O ÍNDICE — as quatro etapas na ordem da dependência, o estado derivado do que existe, e a
 *      porta do fluxo completo. Sem isto, «a cadeia correu» seria uma frase sem conteúdo.
 *   B. A TRAVESSIA INTEIRA — com plano e PO, o gesto deriva UM elo novo de plano e UM elo novo de
 *      PO (com `ajuste_de` a apontar os anteriores), escreve a fonte do plano e fecha o pacote.
 *      É o que a pesquisadora pediu: acabar com a via crucis passo a passo.
 *   C. O REGISTO INCOMPLETO — sem plano, a cadeia NÃO inventa: sincroniza os vínculos (é o que
 *      pode fazer), pára, e diz o que falta com o sítio onde se resolve.
 *   D. A IDEMPOTÊNCIA — repetir o gesto não empilha elos: o que já está em dia é `feita`.
 *   E. O LOG — cada execução fica registada com o gatilho, os alvos, o resultado e o que faltou.
 *   G. O ORÇAMENTO — a travessia não começa quando o pedido já gastou o teto.
 *   H. A TROCA DE DIREÇÃO — o elo novo nasce com o professor que passa a dirigir, e não inventa
 *      campos de contexto que o envelope não admite (a modalidade mora na curadoria).
 *   F. AS ROTAS — `elenco-mover` entrega os DOIS elencos à cadeia e devolve o resultado na
 *      resposta; e `GET /api/bastidores/cadeia` lê o log.
 *
 * SEM REDE: o armazenamento é memória, e as saídas do ciclo são espiões. A cadeia é o motor; os
 * escritores são de quem chama.
 *
 *   node experimentos/provar-cadeia-automatica.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const nucleoCadeia = require(path.join(RAIZ, 'motor/nucleo/cadeia.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarCadeia } = require(path.join(RAIZ, 'motor/servidor/cadeia.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

const ler = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova';
const TURMA = 'Balé Nível 1 — Teste 3';
// O CARIMBO DO MOTOR: `YYYY-MM-DDTHH:MM`, sem segundos — é o formato do `gerado_em`.
const QUANDO = '2026-11-09T20:00';
const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

function relatorioDe(id) {
  return {
    id, estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [], paradas: [], idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [], linhas: [],
  };
}

function planoFixture(id, { ajusteDe, geradoEm, turma } = {}) {
  const envelope = {
    id,
    contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma: turma || TURMA },
    respostas: {
      'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
      'contexto-turma': r(turma || TURMA),
      'contexto-duracao': r([{ numero: 45, unidade: 'minuto' }]),
      'marcos-por-aula': r(['reconhecer o apoio', 'transferir o peso']),
      'estrutura-de-cada-aula': r([{ marco: 1, marcados: ['Barra', 'Centro'] }]),
      'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu'] }]),
      'distribuicao-de-volume': r({ unidade: 'percentual', linhas: [
        { Bloco: 'Barra', 'Proporção alvo': '40%', Justificativa: 'Apoio.' },
        { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Deslocamento.' },
        { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
        { Bloco: 'Expressão', 'Proporção alvo': '20%', Justificativa: 'Braços.' },
      ] }),
      'aula-1-sequencia': r([{ Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio',
        'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' }]),
      'condicoes-preliminares': r('Sala com barra.'),
      'criterio-de-extensao': r('Estender em duas aulas.'),
      referencias: r('RAD (2015).'),
      'musicas-videos': r('Faixa em 4/4.'),
      repertorio: r('Battement tendu'),
      proveniencia: r(['Plano derivado da metodologia RAD']),
      'contexto-metodologia': r('RAD'),
      'contexto-notacao': r('Benesh'),
      'contexto-escola': r(ESCOLA),
      'contexto-professor': r('coqui'),
    },
    gerado_em: geradoEm || '2026-11-03T22:00',
  };
  if (ajusteDe) envelope.ajuste_de = ajusteDe;
  return envelope;
}

function poFixture(id, { planoId, ajusteDe, geradoEm } = {}) {
  const envelope = {
    id,
    contexto: { escola: ESCOLA, professor: 'coqui', ciclo: '01', turma: TURMA },
    respostas: {
      'dimensoes-de-observacao': r(['Técnica — Barra']),
      'itens-por-dimensao': r([{ sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu' }]),
      sujeitos: r(['Aluna A']),
      'plano-de-ensino': r([planoId]),
      'linha-de-base': r([{ sujeito: 'Aluna A', traz: 'prática anterior', precisaDesenvolver: 'tendu' }]),
      question: r('O que se observa, aula a aula?'),
      horizonte: r('Ao fim do ano, o en dehors do quadril.'),
      fenomeno: r(['a rotação externa visível na 1ª posição']),
      'condicoes-de-contorno': r('Sala com barra e espelho.'),
      'referencia-ao-problema': r('o en dehors que sai do joelho'),
      'explicacao-do-recorte': r('a técnica nos cinco blocos'),
      'o-que-fica-de-fora': r('allegro e ponta'),
      'base-teorica': r('RAD (2015).'),
      limitacoes: r('depende do espelho'),
      professor: r('coqui'),
      escola: r(ESCOLA),
      'campo-escola': r(ESCOLA),
      'checklist-fenomeno-definido': r('sim'),
      'checklist-fronteiras-claras': r('sim'),
      'checklist-norma-estabelecida': r('sim'),
      'checklist-criterios-exclusivos': r('nao'),
      'checklist-justificativa-fundada': r('sim'),
      'checklist-recorte-viavel': r('sim'),
    },
    gerado_em: geradoEm || '2026-11-03T22:21',
  };
  if (ajusteDe) envelope.ajuste_de = ajusteDe;
  return envelope;
}

/** O KV de mentira — o contrato mínimo que a cadeia usa. */
function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })) }; },
    _dados: dados,
  };
}

const elenco = (extra) => Object.assign({
  id: 'elenco-a', nome: 'Elenco A', professor: 'coqui',
  alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x', nome: 'X' }],
  carimbo: '20261107-1000', atualizada_em: '2026-11-07T10:00:00.000Z',
}, extra || {});

const curadoria = (extra) => Object.assign({
  id: 'coqui-bale-classico-teste-3', professor: 'coqui', modalidade: 'Balé clássico',
  tradicao: 'RAD', turmas: [TURMA], linhaDeBase: 'elenco-a', alunas: ['Aluna A'],
}, extra || {});

/** A cadeia, com escritores espiões. As curadorias vivem no KV e são lidas de lá. */
function montar({ linhas = [elenco()], curadorias = [curadoria()], temPlano = true, temPo = true,
  pendencias = null, regua = null, tradicao = null } = {}) {
  const kv = kvDeMentira({ ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify(curadorias) });
  const visto = { planos: [], pos: [], conclusoes: [], disparos: [] };
  const arm = criarMemoria();
  const cadeia = criarCadeia({
    armazenamento: arm, porta,
    conteudo: ler('conteudo/anamnese.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    carimbar: () => QUANDO,
    escreverPlano: async (envelope) => {
      visto.planos.push(envelope.id);
      return { ok: true, pendencias: pendencias || [] };
    },
    escreverPO: async () => ({ ok: true }),
    escreverCiclo: async () => ({ ok: true, documentos: [{}] }),
    disparar: async () => { visto.disparos.push(true); return { ok: true }; },
    geracao: null,
    concluirPO: async (envelope) => {
      visto.conclusoes.push(envelope && envelope.id);
      return { fonte: { ok: true }, ciclo: { ok: true }, disparo: { ok: true } };
    },
    lerCuradorias: async () => JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias')),
    lerTurmas: async () => [{ nome: TURMA }],
    lerLinhasDeBase: async () => linhas,
    linhaDeBaseDaTurma: async () => linhas[0] || null,
    /* OS DOIS LEITORES DO CADASTRO QUE O BOTÃO PROMETE (20/11/2026) — ver `criarCadeia`. São
     * opcionais: sem eles a derivação comporta-se como antes (a fotografia do elo anterior). */
    reguaDaSala: regua === null ? undefined : (async () => regua),
    tradicaoDoProfessor: tradicao === null ? undefined : (async () => tradicao),
    kv, escola: ESCOLA,
    urlDaPorta: (base, contexto, extra) => base,
  });
  return { cadeia, arm, kv, visto, semPlano: !temPlano, semPo: !temPo };
}

async function semear(arm, { planoId = 'plano-20261103-2200', poId = 'po-20261103-2221',
  planoGerado = '2026-11-03T22:00', poGerado = '2026-11-03T22:21' } = {}) {
  await porta.gravarEnvelope(arm, planoFixture(planoId, { geradoEm: planoGerado }), relatorioDe(planoId));
  await porta.gravarEnvelope(arm, poFixture(poId, { planoId, geradoEm: poGerado }), relatorioDe(poId));
}

/** Todos os ids de uma família, no armazenamento. */
async function ids(arm, familia) {
  const nomes = await porta.nomesDeEnvelopes(arm, new RegExp('^' + familia + '-.*\\.json$'));
  return nomes.map((n) => n.replace(/\.json$/, ''));
}

(async () => {
  // ==========================================================================
  console.log('\nA. O ÍNDICE — as quatro etapas, na ordem da dependência');

  {
    const e = nucleoCadeia.etapas();
    provar('são quatro, e a ordem é vínculos → plano → PO → pacote',
      e.map((x) => x.chave).join(',') === 'vinculos,plano-de-ensino,plano-de-observacao,pacote',
      e.map((x) => x.chave));
    provar('cada etapa declara onde se resolve (`onde`)',
      e.every((x) => Boolean(x.onde && x.rotulo)));

    provar('as alunas comparam-se por CONJUNTO, não por ordem',
      nucleoCadeia.mesmasAlunas(['A', 'B'], ['B', 'A']) === true);
    provar('…e uma diferença é uma diferença',
      nucleoCadeia.mesmasAlunas(['A', 'B'], ['A']) === false);

    const completo = nucleoCadeia.indice({
      elenco: { id: 'e', nome: 'Elenco', alunas: ['A', 'B'] },
      curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA,
      plano: { id: 'plano-1', gerado_em: '2026-11-01' },
      po: { id: 'po-1', gerado_em: '2026-11-01' },
      quando: QUANDO, pacoteEmDia: false,
    });
    provar('com elenco, Turma, plano e PO o fluxo é COMPLETO', completo.completa === true);
    provar('…e o índice diz que os vínculos estão pendentes',
      completo.etapas[0].estado === 'pendente' && /saiu|entrou/.test(completo.etapas[0].falta),
      completo.etapas[0]);
    provar('…e que os dois planos são anteriores à mudança',
      completo.etapas[1].estado === 'pendente' && completo.etapas[2].estado === 'pendente',
      completo.etapas.map((x) => x.estado));

    const incompleto = nucleoCadeia.indice({
      elenco: { id: 'e', nome: 'Elenco', alunas: ['A'] },
      curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA, plano: null, po: null, quando: QUANDO,
    });
    provar('sem plano o fluxo NÃO é completo', incompleto.completa === false);
    provar('…e a etapa do plano é `bloqueada`, com a frase do que fazer',
      incompleto.etapas[1].estado === 'bloqueada' && /ainda não tem plano/.test(incompleto.etapas[1].falta),
      incompleto.etapas[1]);

    const emDia = nucleoCadeia.indice({
      elenco: { id: 'e', alunas: ['A'] }, curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA,
      plano: { id: 'plano-2', gerado_em: '2026-11-09T21:00' },
      po: { id: 'po-2', gerado_em: '2026-11-09T21:01' },
      quando: QUANDO, pacoteEmDia: true,
    });
    provar('documentos posteriores ao gatilho são `feita`',
      emDia.etapas.every((x) => x.estado === 'feita'), emDia.etapas);
    provar('e o resumo fica `ok`', nucleoCadeia.resumo(emDia.etapas).ok === true);

    const resumo = nucleoCadeia.resumo(incompleto.etapas);
    provar('o resumo aponta a PRÓXIMA etapa em falta', resumo.proxima && resumo.proxima.chave === 'plano-de-ensino',
      resumo.proxima && resumo.proxima.chave);
    provar('o rótulo do gatilho é o que a tela lê',
      nucleoCadeia.rotuloDoGatilho('troca-de-aluna') === 'troca de aluna entre elencos');
  }

  // ==========================================================================
  console.log('\nB. A TRAVESSIA INTEIRA — plano e PO ganham elo novo, e o pacote fecha');

  {
    const { cadeia, arm, kv, visto } = montar();
    await semear(arm);
    const antesPlanos = (await ids(arm, 'plano')).length;
    const antesPos = (await ids(arm, 'po')).length;

    const r1 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'Aluna B entrou no elenco',
    });

    const depoisPlanos = await ids(arm, 'plano');
    const depoisPos = await ids(arm, 'po');
    provar('a cadeia respondeu `ok`', r1.ok === true, r1.erro);
    provar('UM elo novo de plano', depoisPlanos.length === antesPlanos + 1,
      { antes: antesPlanos, depois: depoisPlanos });
    provar('…e a fonte do plano foi escrita', visto.planos.length === 1, visto.planos);
    provar('UM elo novo de PO', depoisPos.length === antesPos + 1,
      { antes: antesPos, depois: depoisPos });
    provar('…e a conclusão do PO correu com o elo novo',
      visto.conclusoes.length === 1 && depoisPos.indexOf(visto.conclusoes[0]) !== -1,
      { conclusoes: visto.conclusoes, depoisPos });

    const novoPlano = await porta.lerEnvelope(arm, depoisPlanos.find((x) => x !== 'plano-20261103-2200'));
    provar('o elo novo do plano aponta o anterior (`ajuste_de`) — a proveniência acrescenta',
      novoPlano && novoPlano.ajuste_de === 'plano-20261103-2200', novoPlano && novoPlano.ajuste_de);
    const novoPo = await porta.lerEnvelope(arm, depoisPos.find((x) => x !== 'po-20261103-2221'));
    provar('o elo novo do PO aponta o anterior', novoPo && novoPo.ajuste_de === 'po-20261103-2221',
      novoPo && novoPo.ajuste_de);
    const referencia = novoPo && novoPo.respostas['plano-de-ensino'];
    const refId = referencia && referencia.valor !== undefined ? referencia.valor : referencia;
    provar('…e observa o plano VIGENTE, não o substituído',
      String(refId) === String(novoPlano && novoPlano.id), { ref: refId, plano: novoPlano && novoPlano.id });

    const turma = JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias'))[0];
    provar('a Turma passou a declarar o corpo do elenco',
      JSON.stringify(turma.alunas) === JSON.stringify(['Aluna A', 'Aluna B']), turma.alunas);
    provar('…e o resto do registo dela ficou intacto',
      turma.professor === 'coqui' && turma.modalidade === 'Balé clássico', turma);
    provar('todas as etapas ficaram `feita`',
      r1.alvos[0].etapas.every((x) => x.estado === 'feita'), r1.alvos[0].etapas);
  }

  // ==========================================================================
  console.log('\nB2. A DECISÃO DO PROFESSOR CHEGA AO DOCUMENTO — o reescalonamento (20/11/2026)');

  /* O GESTO PERGUNTA, E O SIM TEM DE ACONTECER ALGURES. Quando a duração de uma Sala muda e a
   * distribuição por bloco está declarada em MINUTOS, a soma antiga deixa de fechar com a duração
   * nova — 18+18+18+6 numa aula que passou de 60 a 120 minutos deixa metade da aula por declarar.
   * O professor vê os números no modal e responde «sim, recalcula». É essa resposta que se mede
   * aqui, no sítio onde ela tem de aparecer: no ELO NOVO DO PLANO.
   *
   * O elo ANTERIOR não pode mudar. A proveniência acrescenta — e um reescalonamento que
   * reescrevesse o passado faria a pergunta «como estava planeada a aula de 60 minutos» deixar de
   * ter resposta. */
  {
    const { cadeia, arm } = montar();
    const emMinutos = planoFixture('plano-20261103-2200', { geradoEm: '2026-11-03T22:00' });
    emMinutos.respostas['distribuicao-de-volume'] = r({ unidade: 'minutos', linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '30 min', Justificativa: 'Apoio.' },
      { Bloco: 'Centro', 'Proporção alvo': '18 min', Justificativa: 'Deslocamento.' },
      { Bloco: 'Musicalidade', 'Proporção alvo': '6 min', Justificativa: 'Pulso.' },
      { Bloco: 'Expressão', 'Proporção alvo': '6 min', Justificativa: 'Braços.' },
    ] });
    /* Os quatro blocos somam 60 — a duração antiga. A nova é 120. */
    await porta.gravarEnvelope(arm, emMinutos, relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm, poFixture('po-20261103-2221',
      { planoId: 'plano-20261103-2200', geradoEm: '2026-11-03T22:21' }), relatorioDe('po-20261103-2221'));

    /* O GATILHO É O DESTA PROVA (`troca-de-aluna`), e não o da sala: o que se mede aqui não é
     * quando a decisão nasce — é que, nascendo, ela chega ao documento. O gesto da Sala já está
     * medido em `provar-salas-e-elencos`, secção L. */
    const r2 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'a duração da sala passou de 60 para 120 minutos',
      ajusteDeVolume: { proporcao: true, reverDose: true, deMin: 60, paraMin: 120 },
    });
    provar('a travessia corre com o ajuste declarado', r2.ok === true,
      { erro: r2.erro, etapas: (r2.alvos || []).map((a) => a.etapas.map((e) => e.chave + ':' + e.estado)) });
    const novos = (await ids(arm, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    provar('…e há UM elo novo de plano', novos.length === 1, novos);
    const novo = novos.length ? await porta.lerEnvelope(arm, novos[0]) : null;
    const valor = novo && novo.respostas['distribuicao-de-volume'];
    const linhas = valor && (valor.valor || valor).linhas || [];
    provar('…e os minutos dos blocos foram reescalonados de 60 para 120',
      linhas.map((l) => String(l['Proporção alvo'])).join(' '), '60 min 36 min 12 min 12 min');
    provar('…e a soma fecha com a duração nova',
      linhas.reduce((t, l) => t + parseInt(l['Proporção alvo'], 10), 0), 120);
    /* A RELAÇÃO ENTRE BLOCOS É A INTENÇÃO, e é ela que a regra de três preserva: a Barra valia
     * metade da aula e continua a valer metade da aula. */
    provar('…e a relação entre os blocos é a mesma (a Barra era metade, e continua metade)',
      parseInt(linhas[0]['Proporção alvo'], 10) * 2, 120);

    /* O ELO ANTERIOR NÃO SE TOCA. */
    const antes = await porta.lerEnvelope(arm, 'plano-20261103-2200');
    const linhasAntes = ((antes.respostas['distribuicao-de-volume'].valor
      || antes.respostas['distribuicao-de-volume']).linhas || []);
    provar('…e o elo ANTERIOR continua a declarar os minutos da duração antiga',
      linhasAntes.map((l) => String(l['Proporção alvo'])).join(' '), '30 min 18 min 6 min 6 min');

    /* AS DUAS FRASES QUE O GESTO PASSA A DIZER — o que foi feito e o que fica por decidir. */
    const avisos = (r2.avisos || []).join(' | ');
    provar('…e o gesto diz que reescalonou', /reescalonada de 60 para 120 minutos/.test(avisos), avisos);
    /* A DOSE NÃO ENTRA NOS AVISOS (20/11/2026). Numa aula de dança a música divide-se em oito,
     * portanto três séries são 3×8 tempos musicais: a série mede-se contra a MÚSICA, não contra o
     * relógio da aula. «Não tem relação com o tempo de trabalho.» Um aviso que mandasse revê-la por
     * a duração ter mudado seria um aviso falso. */
    provar('…e NÃO manda rever a dose — ela mede-se contra a música, não contra a aula',
      !/dose/i.test(avisos), avisos);
    /* A OUTRA RESPOSTA DO MODAL, e é a metade que faltava medir: quando quem ajustou diz «manter»,
     * o aviso não pode dizer que reescalonou — o sistema registra a decisão, e a decisão foi essa.
     * O que ele faz é dizer que a distribuição ficou como estava, por decisão de quem ajustou. */
    const { cadeia: c3, arm: arm3 } = montar();
    const manter = planoFixture('plano-20261103-2200', { geradoEm: '2026-11-03T22:00' });
    manter.respostas['distribuicao-de-volume'] = r({ unidade: 'minutos', linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '30 min', Justificativa: 'Apoio.' },
      { Bloco: 'Centro', 'Proporção alvo': '30 min', Justificativa: 'Deslocamento.' },
    ] });
    await porta.gravarEnvelope(arm3, manter, relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm3, poFixture('po-20261103-2221',
      { planoId: 'plano-20261103-2200', geradoEm: '2026-11-03T22:21' }), relatorioDe('po-20261103-2221'));
    const r4 = await c3.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO, motivo: 'dose mantida',
      ajusteDeVolume: { proporcao: false, deMin: 60, paraMin: 120 },
    });
    const avisos4 = (r4.avisos || []).join(' | ');
    /* COM «NÃO» NÃO HÁ AVISO NENHUM, e é o comportamento certo: a pessoa decidiu, o sistema não tem
     * nada a acrescentar. A decisão está no `motivoDoElo`, que é onde o histórico a vai ler. Um aviso
     * a repetir a decisão que a pessoa acabou de tomar é ruído — e ensina a fechar avisos sem ler. */
    provar('…e quando a resposta é «não», não há aviso de reescalonamento',
      !/reescalonada/.test(avisos4), avisos4);
    /* E A DISTRIBUIÇÃO FICA INTACTA — é o que «não, deixar como está» quer dizer. */
    const novos4 = (await ids(arm3, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo4 = novos4.length ? await porta.lerEnvelope(arm3, novos4[0]) : null;
    const v4 = novo4 && novo4.respostas['distribuicao-de-volume'];
    const l4 = (v4 && (v4.valor || v4).linhas) || [];
    provar('…e os minutos NÃO são reescalonados', l4.map((l) => String(l['Proporção alvo'])).join(' '),
      '30 min 30 min');

    /* OS NÚMEROS QUE ELE ESCREVEU GANHAM DA CONTA (20/11/2026). O modal passou a ser um formulário:
     * vem preenchido com a regra de três, e ele acata ou corrige. Quando corrige, o que se grava é
     * o que ele escreveu — fazer a conta por cima seria desfazer, no servidor, a decisão do ecrã, e
     * mandá-lo de volta ao plano de ensino para escrever outra vez o mesmo número. */
    const { cadeia: c5, arm: arm5 } = montar();
    const escrito = planoFixture('plano-20261103-2200', { geradoEm: '2026-11-03T22:00' });
    escrito.respostas['distribuicao-de-volume'] = r({ unidade: 'minutos', linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '30 min', Justificativa: 'Apoio.' },
      { Bloco: 'Centro', 'Proporção alvo': '18 min', Justificativa: 'Deslocamento.' },
      { Bloco: 'Musicalidade', 'Proporção alvo': '6 min', Justificativa: 'Pulso.' },
      { Bloco: 'Expressão', 'Proporção alvo': '6 min', Justificativa: 'Braços.' },
    ] });
    await porta.gravarEnvelope(arm5, escrito, relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm5, poFixture('po-20261103-2221',
      { planoId: 'plano-20261103-2200', geradoEm: '2026-11-03T22:21' }), relatorioDe('po-20261103-2221'));
    const r5 = await c5.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'a duração da sala passou de 60 para 120 minutos',
      ajusteDeVolume: { proporcao: true, deMin: 60, paraMin: 120, total: 120,
        minutos: [{ bloco: 'Barra', valor: 50 }, { bloco: 'Centro', valor: 40 },
          { bloco: 'Musicalidade', valor: 20 }, { bloco: 'Expressão', valor: 10 }] },
    });
    const novos5 = (await ids(arm5, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo5 = novos5.length ? await porta.lerEnvelope(arm5, novos5[0]) : null;
    const v5 = novo5 && novo5.respostas['distribuicao-de-volume'];
    const l5 = (v5 && (v5.valor || v5).linhas) || [];
    provar('os minutos ESCRITOS são os que ficam no documento — a regra de três é só o valor inicial',
      l5.map((l) => String(l['Proporção alvo'])).join(' '), '50 min 40 min 20 min 10 min');
    provar('…e não são 60 e 36 e 12 e 12, que é o que a conta daria',
      l5.map((l) => String(l['Proporção alvo'])).join(' ') !== '60 min 36 min 12 min 12 min', null);
    provar('…e o sufixo do plano é respeitado (o «min» continua lá)',
      l5.every((l) => / min$/.test(String(l['Proporção alvo']))), l5.map((l) => l['Proporção alvo']));
    const avisos5 = (r5.avisos || []).join(' | ');
    provar('…e o aviso diz que foram os minutos dele, e que fecham a aula',
      /refeita com os minutos que o professor escreveu/.test(avisos5)
        && /fecham os 120 minutos/.test(avisos5), avisos5);

    /* E QUANDO NÃO FECHAM, diz-se — sem distribuir a diferença. A lacuna é informação: quem a
     * abriu (ou a manteve aberta) foi quem escreveu, e o sistema não inventa o que falta. */
    const { cadeia: c6, arm: arm6 } = montar();
    const aberto = planoFixture('plano-20261103-2200', { geradoEm: '2026-11-03T22:00' });
    aberto.respostas['distribuicao-de-volume'] = r({ unidade: 'minutos', linhas: [
      { Bloco: 'Barra', 'Proporção alvo': '30 min', Justificativa: 'Apoio.' },
      { Bloco: 'Centro', 'Proporção alvo': '30 min', Justificativa: 'Deslocamento.' },
    ] });
    await porta.gravarEnvelope(arm6, aberto, relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm6, poFixture('po-20261103-2221',
      { planoId: 'plano-20261103-2200', geradoEm: '2026-11-03T22:21' }), relatorioDe('po-20261103-2221'));
    const r6 = await c6.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO, motivo: 'minutos a menos',
      ajusteDeVolume: { proporcao: true, deMin: 60, paraMin: 120, total: 45,
        minutos: [{ bloco: 'Barra', valor: 25 }, { bloco: 'Centro', valor: 20 }] },
    });
    const novos6 = (await ids(arm6, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo6 = novos6.length ? await porta.lerEnvelope(arm6, novos6[0]) : null;
    const v6 = novo6 && novo6.respostas['distribuicao-de-volume'];
    const l6 = (v6 && (v6.valor || v6).linhas) || [];
    provar('…e a soma que não fecha é conservada, não distribuída',
      l6.map((l) => String(l['Proporção alvo'])).join(' '), '25 min 20 min');
    provar('…e o aviso diz quanto é que soma, e quanto é que a aula tem',
      /somam 45 dos 120 minutos/.test((r6.avisos || []).join(' | ')), r6.avisos);

    /* O CONTROLE NEGATIVO: sem ajuste, nada disto acontece. Um reescalonamento que corresse
     * sempre seria uma reescrita silenciosa de planos que ninguém pediu para mudar. */
    const { cadeia: c2, arm: arm2 } = montar();
    await semear(arm2);
    const r3 = await c2.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO, motivo: 'sem ajuste',
    });
    const novos2 = (await ids(arm2, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo2 = novos2.length ? await porta.lerEnvelope(arm2, novos2[0]) : null;
    const v2 = novo2 && novo2.respostas['distribuicao-de-volume'];
    const l2 = v2 && (v2.valor || v2).linhas || [];
    provar('CONTROLE NEGATIVO: sem ajuste, as fatias ficam como estavam',
      l2.map((l) => String(l['Proporção alvo'])).join(' '), '40% 30% 10% 20%');
    provar('…e sem ajuste não há aviso de reescalonamento',
      !/reescalonada/.test((r3.avisos || []).join(' | ')), r3.avisos);
  }

  // ==========================================================================
  console.log('\nB3. O EXERCÍCIO NOVO CHEGA AO PARÂMETRO — a declaração da Turma (20/11/2026)');

  /* A DECLARAÇÃO NASCE NA TURMA E É A DERIVAÇÃO QUE A ESCREVE NO PLANO. A pergunta «a que objetivo
   * serve este exercício?» foi feita ao acrescentar a ficha ao conteúdo da Turma; a resposta viajou
   * no pedido (`declaracoes`), e o elo novo do plano tem de nascer com ela em `aula-1-parametro`
   * — que é a matriz que o documento imprime como «**1** reconhecer… — observa: …».
   *
   * E COM ELA NO `repertorio` DO PLANO. Sem isso, `parametroEmLinhas` filtra o termo de volta (ele
   * confere o parâmetro contra o repertório do próprio plano, e não contra o da Turma): a
   * declaração seria escrita e apagada na leitura, e o documento sairia como se nunca tivesse
   * existido. É o efeito que esta secção existe para tornar impossível.
   */
  {
    const comONovo = curadoria({ repertorio: ['Battement tendu', 'Battement jeté'] });
    const { cadeia, arm } = montar({ curadorias: [comONovo] });
    await semear(arm);

    const r = await cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO,
      motivo: 'o «Battement jeté» entrou no conteúdo desta Turma',
      declaracoes: { 'Battement jeté': [1] },
    });
    provar('a travessia corre com a declaração declarada', r.ok === true,
      { erro: r.erro, etapas: (r.alvos || []).map((a) => a.etapas.map((e) => e.chave + ':' + e.estado)) });
    const novos = (await ids(arm, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    provar('…e há UM elo novo de plano', novos.length === 1, novos);
    const novo = novos.length ? await porta.lerEnvelope(arm, novos[0]) : null;
    const matriz = ((novo && novo.respostas['aula-1-parametro']) || {});
    const linhaDoUm = (matriz.valor || matriz || []).find((l) => Number(l.marco) === 1) || {};
    provar('…e o objetivo 1 passa a observar o exercício novo',
      (linhaDoUm.marcados || []).indexOf('Battement jeté') !== -1, linhaDoUm.marcados);
    provar('…e o que já lá estava não se perde',
      (linhaDoUm.marcados || []).indexOf('Battement tendu') !== -1, linhaDoUm.marcados);
    const repDoNovo = ((novo && novo.respostas.repertorio) || {});
    const listaDoNovo = repDoNovo.valor !== undefined ? repDoNovo.valor : repDoNovo;
    provar('…e o termo entra na lista acordada do PLANO, senão é escrito e apagado na leitura',
      (Array.isArray(listaDoNovo) ? listaDoNovo : [listaDoNovo]).indexOf('Battement jeté') !== -1,
      listaDoNovo);

    /* O ELO ANTERIOR NÃO SE TOCA — a proveniência acrescenta. */
    const antes = await porta.lerEnvelope(arm, 'plano-20261103-2200');
    const matrizAntes = ((antes.respostas['aula-1-parametro'] || {}).valor
      || antes.respostas['aula-1-parametro'] || []);
    provar('…e o elo ANTERIOR continua sem o exercício novo',
      (matrizAntes.find((l) => Number(l.marco) === 1) || {}).marcados, ['Battement tendu']);

    /* A SEGUNDA DERIVAÇÃO NÃO REAPLICA. O professor que desmarcar o exercício no plano não pode
     * vê-lo voltar em cada elo — e é esta metade que torna a regra utilizável e não uma armadilha. */
    const r2 = await cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO,
      motivo: 'a mesma declaração outra vez',
      declaracoes: { 'Battement jeté': [1] },
    });
    const todos = (await ids(arm, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const segundo = await porta.lerEnvelope(arm, todos[todos.length - 1]);
    const matriz2 = ((segundo && segundo.respostas['aula-1-parametro']) || {});
    const marcos2 = (matriz2.valor || matriz2 || []).find((l) => Number(l.marco) === 1) || {};
    provar('…e a derivação seguinte não duplica o termo na matriz',
      (marcos2.marcados || []).filter((t) => t === 'Battement jeté').length, 1);
    provar('…e a segunda travessia correu', r2.ok === true, r2.erro);

    /* O CONTROLE NEGATIVO: sem declaração, o elo novo nasce como nasceria antes desta alteração. */
    const { cadeia: c2, arm: arm2 } = montar({ curadorias: [comONovo] });
    await semear(arm2);
    await c2.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO, motivo: 'sem declaração',
    });
    const novos2 = (await ids(arm2, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo2 = novos2.length ? await porta.lerEnvelope(arm2, novos2[0]) : null;
    const matriz3 = ((novo2 && novo2.respostas['aula-1-parametro']) || {});
    const marcos3 = (matriz3.valor || matriz3 || []).find((l) => Number(l.marco) === 1) || {};
    provar('CONTROLE NEGATIVO: sem declaração, o parâmetro fica como estava',
      marcos3.marcados, ['Battement tendu']);
  }

  /* ==========================================================================
   * B4. O EXERCÍCIO QUE SAI DA TURMA SAI DO PLANO — a outra metade (20/11/2026)
   *
   * A INCLUSÃO TEM JANELA, A REMOÇÃO NÃO — «quando eu removo, não tem impacto […] ele se desvincula
   * dos objetivos». Desvincular é trabalho da derivação, e não era feito: o elo novo copiava o
   * `repertorio` e a matriz do parâmetro do elo anterior, e o exercício que a Turma já não ensinava
   * continuava a ser impresso no plano. O documento filtra o parâmetro pelo repertório do PRÓPRIO
   * plano, pelo que o termo ficava — a regra de 03/11/2026 («em nenhum lugar da aula pode existir
   * algo que não esteja definido na curadoria») era verdadeira só num sentido.
   */
  console.log('\nB4. O EXERCÍCIO QUE SAI DA TURMA SAI DO PLANO — e o elo anterior não se toca');

  {
    /* O plano de partida ensina DOIS exercícios; a Turma passa a ensinar um. */
    const planoComDois = planoFixture('plano-20261103-2200');
    planoComDois.respostas['aula-1-parametro'] = r([
      { marco: 1, marcados: ['Battement tendu', 'Plié'] },
    ]);
    planoComDois.respostas.repertorio = r(['Battement tendu', 'Plié']);
    const soTendu = curadoria({ repertorio: ['Battement tendu'] });
    const { cadeia, arm } = montar({ curadorias: [soTendu] });
    await porta.gravarEnvelope(arm, planoComDois, relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm, poFixture('po-20261103-2221', { planoId: 'plano-20261103-2200' }),
      relatorioDe('po-20261103-2221'));

    const r1 = await cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO,
      motivo: 'o «Plié» saiu do conteúdo desta Turma',
    });
    provar('a travessia corre', r1.ok === true, r1.erro);
    const novos = (await ids(arm, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo = novos.length ? await porta.lerEnvelope(arm, novos[0]) : null;
    const listaDe = (cru) => (cru && cru.valor !== undefined ? cru.valor : cru);
    const repDoNovo = listaDe(novo && novo.respostas.repertorio);
    provar('…e o exercício removido sai da lista acordada do plano',
      JSON.stringify(repDoNovo) === JSON.stringify(['Battement tendu']), repDoNovo);
    const matrizNova = listaDe(novo && novo.respostas['aula-1-parametro']);
    const linhaUm = (Array.isArray(matrizNova) ? matrizNova : [])
      .find((l) => Number(l.marco) === 1) || {};
    provar('…e sai da matriz do parâmetro',
      JSON.stringify(linhaUm.marcados) === JSON.stringify(['Battement tendu']), linhaUm.marcados);
    provar('…e a decisão sobe à tela, em vez de desaparecer em silêncio',
      (r1.avisos || []).some((a) => /já não está no conteúdo da Turma/.test(a) && /Plié/.test(a)),
      r1.avisos);

    /* A PROVENIÊNCIA ACRESCENTA: o elo anterior continua a dizer o que dizia. */
    const velho = await porta.lerEnvelope(arm, 'plano-20261103-2200');
    const repVelho = listaDe(velho.respostas.repertorio);
    provar('…e o elo ANTERIOR continua a declarar os dois exercícios',
      JSON.stringify(repVelho) === JSON.stringify(['Battement tendu', 'Plié']), repVelho);

    /* E O DOCUMENTO SEGUE — é ele que o professor imprime, e é ele que a prova mede. */
    const nucleoPlano = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
    const doc = nucleoPlano.derivarPlano(novo, ler('plano/conteudo/plano.json'));
    provar('…e o documento derivado já não imprime o exercício removido',
      !/Plié/.test(String(doc.markdown)), String(doc.markdown).split('\n')
        .filter((l) => /Plié/.test(l)));
  }

  {
    /* CONTROLE NEGATIVO — a poda é contra a LISTA, e não contra o gesto: uma Turma de antes do
     * campo `repertorio` existir não declara lista nenhuma, e comparar contra vazio apagaria o
     * plano inteiro. */
    const planoComDois = planoFixture('plano-20261103-2200');
    planoComDois.respostas['aula-1-parametro'] = r([
      { marco: 1, marcados: ['Battement tendu', 'Plié'] },
    ]);
    planoComDois.respostas.repertorio = r(['Battement tendu', 'Plié']);
    /* A Turma de antes do campo `repertorio`: o registo não declara lista nenhuma. */
    const { cadeia, arm } = montar({ curadorias: [curadoria()] });
    await porta.gravarEnvelope(arm, planoComDois, relatorioDe('plano-20261103-2200'));
    await porta.gravarEnvelope(arm, poFixture('po-20261103-2221', { planoId: 'plano-20261103-2200' }),
      relatorioDe('po-20261103-2221'));
    await cadeia.executar({ gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO });
    const novos = (await ids(arm, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const novo = novos.length ? await porta.lerEnvelope(arm, novos[0]) : null;
    const cru = novo && novo.respostas.repertorio;
    const rep = cru && cru.valor !== undefined ? cru.valor : cru;
    provar('CONTROLE NEGATIVO: sem repertório declarado na Turma, o plano não é podado',
      JSON.stringify(rep) === JSON.stringify(['Battement tendu', 'Plié']), rep);
  }

  /* ==========================================================================
   * B5. O PEDIDO DE ATUALIZAR AGORA — o botão da Turma (20/11/2026)
   *
   * «há derivações que são feitas, elas têm efeito diretamente na turma, mas elas param ali […]
   * se ele quiser que seja gerado agora, a gente vai colocar um botão na turma que dispara então a
   * regeneração.» O ajuste que não passa pela cadeia (a régua, o vocabulário, o verbete) só chega
   * ao papel quando um plano NOVO nasce — a régua viaja no envelope como fotografia. Logo o botão
   * tem de FORÇAR a derivação; sem isso gerava sobre o mesmo plano e não mudava um byte.
   */
  console.log('\nB5. «Atualizar o ciclo» força um plano novo — e só quando é pedido');

  {
    const { cadeia, arm } = montar();
    await semear(arm);
    /* O PRIMEIRO GESTO põe tudo em dia. */
    await cadeia.executar({ gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO });
    const antes = (await ids(arm, 'plano')).length;

    /* O CONTROLE NEGATIVO: repetir o gesto NÃO cria elo — é a idempotência de sempre. */
    const semPedido = await cadeia.executar({ gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO });
    provar('sem o pedido, a Turma em dia não deriva nada',
      (await ids(arm, 'plano')).length === antes && semPedido.ok === true, semPedido.erro);

    /* O PEDIDO: deriva, mesmo em dia. */
    const r = await cadeia.executar({
      gatilho: 'atualizacao-pedida', turmas: [TURMA], quando: QUANDO, forcar: true,
      motivo: 'o professor pediu para levar ao ciclo o que a Turma declara hoje',
    });
    provar('com o pedido, a travessia corre', r.ok === true, r.erro);
    provar('…e há UM elo novo de plano, mesmo com o anterior em dia',
      (await ids(arm, 'plano')).length === antes + 1,
      { antes, depois: (await ids(arm, 'plano')).length });
    /* E O GATILHO DIZ O QUE FOI — um clique, e não uma mudança: é o que distingue este elo dos
     * que nascem de factos, quando alguém lê o log meses depois. */
    provar('…e o registo diz que foi um pedido, e não uma mudança',
      /pediu para atualizar o ciclo/.test(nucleoCadeia.rotuloDoGatilho('atualizacao-pedida')),
      nucleoCadeia.rotuloDoGatilho('atualizacao-pedida'));
    /* O ELO NOVO HERDA O CONTEÚDO — atualizar não reescreve a pedagogia. */
    const novos = (await ids(arm, 'plano')).filter((x) => x !== 'plano-20261103-2200');
    const ultimo = await porta.lerEnvelope(arm, novos[novos.length - 1]);
    const matriz = (ultimo.respostas['aula-1-parametro'] || {});
    const linha = (matriz.valor || matriz || []).find((l) => Number(l.marco) === 1) || {};
    provar('…e o conteúdo do plano passa igual — atualizar não decide pedagogia',
      JSON.stringify(linha.marcados) === JSON.stringify(['Battement tendu']), linha.marcados);
  }

  // ==========================================================================
  console.log('\nC. O REGISTO INCOMPLETO — avança até onde pode, e diz o que falta');

  {
    const { cadeia, kv, visto } = montar({ temPlano: false });
    // Sem plano: o armazenamento fica vazio.
    const r1 = await cadeia.executar({
      gatilho: 'saida-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
    });
    provar('a cadeia NÃO responde `ok`', r1.ok === false);
    provar('os vínculos, que só dependem do elenco, foram feitos',
      JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias'))[0].alunas.length === 2);
    provar('nenhum plano foi derivado', visto.planos.length === 0, visto.planos);
    provar('nenhum PO foi concluído', visto.conclusoes.length === 0, visto.conclusoes);
    const etapa = r1.alvos[0].etapas.find((x) => x.chave === 'plano-de-ensino');
    provar('a etapa do plano é `bloqueada`, e a frase diz o caminho',
      etapa && etapa.estado === 'bloqueada' && /ainda não tem plano/.test(etapa.falta), etapa);
    provar('o erro global diz onde a cadeia parou', /plano-de-ensino/.test(String(r1.erro)), r1.erro);
  }

  // ==========================================================================
  console.log('\nD. A IDEMPOTÊNCIA — repetir não empilha elos');

  {
    const { cadeia, arm } = montar();
    await semear(arm);
    await cadeia.executar({ gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO });
    const depoisDeUm = { planos: (await ids(arm, 'plano')).length, pos: (await ids(arm, 'po')).length };
    const r2 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
    });
    const depoisDeDois = { planos: (await ids(arm, 'plano')).length, pos: (await ids(arm, 'po')).length };
    provar('o segundo gesto não cria plano', depoisDeDois.planos === depoisDeUm.planos,
      { um: depoisDeUm, dois: depoisDeDois });
    provar('…nem PO', depoisDeDois.pos === depoisDeUm.pos, { um: depoisDeUm, dois: depoisDeDois });
    provar('…e a cadeia diz que está em dia', r2.ok === true, r2.erro);
  }

  // ==========================================================================
  console.log('\nE. O LOG — o que a cadeia fez, quando, e onde parou');

  {
    const { cadeia } = montar();
    const r1 = await cadeia.executar({
      gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO,
      motivo: 'Aluna B entrou',
    });
    provar('o log aceitou a entrada', r1.log && r1.log.ok === true, r1.log);
    const log = await cadeia.lerLog();
    provar('há uma entrada no log', log.length === 1, log.length);
    provar('…com o gatilho', log[0].gatilho === 'troca-de-aluna');
    provar('…com o rótulo legível', log[0].rotulo === 'troca de aluna entre elencos');
    provar('…com os alvos e o estado de cada etapa',
      Array.isArray(log[0].alvos) && log[0].alvos[0].etapas.length === 4, log[0].alvos);
    provar('…e com o resultado global', typeof log[0].ok === 'boolean');
  }

  // ==========================================================================
  console.log('\nF. AS ROTAS — o gesto entrega os dois elencos, e o log lê-se');

  {
    const senha = 'senha-de-prova';
    const elencoA = elenco();
    const elencoB = elenco({ id: 'elenco-b', nome: 'Elenco B', alunas: ['Aluna C'] });
    const caminhoDe = (l) => 'escola/' + ESCOLA + '/linhas-de-base/' + l.id + '--' + l.carimbo + '.json';
    const arquivos = () => ({
      [caminhoDe(elencoA)]: JSON.stringify(elencoA, null, 2) + '\n',
      [caminhoDe(elencoB)]: JSON.stringify(elencoB, null, 2) + '\n',
      ['escola/' + ESCOLA + '/linhas-de-base/.indice.json']: JSON.stringify({
        versao: 1,
        versoes: Object.fromEntries([elencoA, elencoB].map((l) => [l.id + '--' + l.carimbo + '.json', {
          id: l.id, carimbo: l.carimbo, arquivo: caminhoDe(l), nome: l.nome,
          professor: l.professor, turma: null, atualizada_em: l.atualizada_em,
          enviada_em: l.atualizada_em, aspectos: (l.campos || []).map((c) => c.id),
          alunas: l.alunas.length,
        }])),
      }, null, 2) + '\n',
    });
    // O GitHub em memória — o contrato que a rota usa (a árvore, o `contents` GET/PUT).
    const ficheiros = new Map(Object.entries(arquivos()));
    const escritas = [];
    const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
    const json = (o, status) => new Response(JSON.stringify(o),
      { status: status || 200, headers: { 'content-type': 'application/json' } });
    const fetchFalso = async (url, opcoes) => {
      const u = new URL(String(url));
      const metodo = (opcoes && opcoes.method) || 'GET';
      if (u.pathname.indexOf('/git/trees/') !== -1) {
        return json({ sha: 'arvore', tree: [...ficheiros.keys()].map((p) => ({ path: p, type: 'blob', sha: 's' })) });
      }
      const m = /\/contents\/(.+)$/.exec(u.pathname);
      if (!m) return new Response('nao', { status: 404 });
      const caminho = decodeURIComponent(m[1]);
      if (metodo === 'GET') {
        if (!ficheiros.has(caminho)) return new Response('nao', { status: 404 });
        return json({ sha: 'sha-' + caminho, content: b64(ficheiros.get(caminho)) });
      }
      if (metodo === 'PUT') {
        const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
        const texto = Buffer.from(String(corpo.content), 'base64').toString('utf8');
        escritas.push({ caminho, mensagem: corpo.message || '', texto });
        ficheiros.set(caminho, texto);
        return json({ commit: { sha: 'c' + escritas.length } }, 201);
      }
      return new Response('nao', { status: 405 });
    };

    const env = {
      ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
      SENHA_ADMIN: senha, SENHA_PROFESSOR: 'outra',
      PROFESSOR_NOME: 'Professora Dona', PROFESSOR_SLUG: 'dona',
      GITHUB_TOKEN: 'token-de-prova', PADD_KV: kvDeMentira({}),
    };
    const chamadas = [];
    const cadeiaDeProva = {
      async executar(pedido) {
        chamadas.push(pedido);
        return {
          ok: false, completa: false, erro: 'sem plano de ensino na prova',
          alvos: [{ turma: TURMA, ok: false, erro: 'sem plano de ensino na prova', etapas: [
            { chave: 'vinculos', estado: 'feita' },
            { chave: 'plano-de-ensino', estado: 'bloqueada', falta: 'a Turma ainda não tem plano' },
            { chave: 'plano-de-observacao', estado: 'bloqueada' },
            { chave: 'pacote', estado: 'bloqueada' },
          ] }],
        };
      },
      async lerLog() { return [{ em: QUANDO, gatilho: 'troca-de-aluna', ok: false }]; },
      enderecos() {
        return {
          'producao-turmas': '#turmas', 'producao-elencos': '#corpo',
          'porta-plano': '/plano-ensino/', 'porta-po': '/plano-observacao/',
          'geracao': '/plano-observacao/',
        };
      },
    };

    const pedir = async (caminho, corpo, extras) => {
      const init = corpo === undefined ? { method: 'GET' } : {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
      };
      const resposta = await bastidores.fetch(
        new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), env, extras);
      const texto = await resposta.text();
      let corpoJson = null;
      try { corpoJson = JSON.parse(texto); } catch (erro) { corpoJson = null; }
      return { status: resposta.status, json: corpoJson, texto };
    };

    const original = globalThis.fetch;
    let troca;
    try {
      globalThis.fetch = fetchFalso;
      troca = await pedir('/api/bastidores/elenco-mover', {
        aluna: 'Aluna A', de: 'elenco-a', para: 'elenco-b', senhaDirecao: senha,
      }, { cadeia: cadeiaDeProva });
    } finally { globalThis.fetch = original; }

    provar('a transferência responde 200', troca.status === 200, { status: troca.status, corpo: troca.texto.slice(0, 300) });
    provar('…e a CADEIA vai na resposta', troca.json && Boolean(troca.json.cadeia), troca.json && troca.json.cadeia);
    provar('…com o resultado global e o que falta', troca.json && troca.json.cadeia.ok === false
      && Array.isArray(troca.json.cadeia.faltam) && troca.json.cadeia.faltam.length > 0,
      troca.json && troca.json.cadeia);
    provar('…e cada falta traz o rótulo e o ENDEREÇO',
      troca.json && troca.json.cadeia.faltam.every((f) => Boolean(f.rotulo && f.href)),
      troca.json && troca.json.cadeia.faltam);
    provar('o gesto entregou os DOIS elencos à cadeia',
      chamadas.length === 1 && JSON.stringify(chamadas[0].elencos) === JSON.stringify(['elenco-a', 'elenco-b']),
      chamadas);
    provar('…e o gatilho é o da troca', chamadas[0] && chamadas[0].gatilho === 'troca-de-aluna', chamadas[0]);

    // O LOG, pela rota verdadeira.
    const leitura = await pedir('/api/bastidores/cadeia', undefined, { cadeia: cadeiaDeProva });
    provar('GET /api/bastidores/cadeia responde 200', leitura.status === 200, leitura.status);
    provar('…e devolve o log', leitura.json && leitura.json.ok === true
      && Array.isArray(leitura.json.log) && leitura.json.log.length === 1, leitura.json);

    // SEM a cadeia montada, a rota diz que não correu — e não finge log vazio.
    const semCadeia = await pedir('/api/bastidores/cadeia', undefined, {});
    provar('sem a cadeia montada, a rota DIZ que ela não correu',
      semCadeia.json && semCadeia.json.ok === false && /não está montada/.test(semCadeia.json.motivo || ''),
      semCadeia.json);
  }

  // ==========================================================================
  console.log('\nH. A TROCA DE PROFESSOR — a cadeia pára, e diz de quem é o documento');

  {
    const { cadeia, arm } = montar({
      curadorias: [curadoria({ professor: 'novo-prof', modalidade: 'Balé contemporâneo' })],
    });
    await semear(arm);
    const antes = await ids(arm, 'plano');
    const r1 = await cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO,
      motivo: 'a direção da turma passou a novo-prof',
    });
    const depois = await ids(arm, 'plano');
    provar('a travessia correu pela turma', r1.alvos.length === 1 && r1.alvos[0].turma === TURMA, r1.alvos);
    /* A AUTORIA NÃO SE DERIVA (12/11/2026). Até aqui esta prova exigia o contrário — «o elo novo diz
     * o professor que passou a dirigir» —, e era esse o defeito. O elo novo era o plano do professor
     * anterior com o nome do novo por cima. */
    provar('…e NÃO derivou elo nenhum (o plano é de outro professor)',
      depois.length === antes.length, { antes, depois });
    const etapa = (r1.alvos[0].etapas || []).find((e) => e.chave === 'plano-de-ensino') || {};
    provar('…e a etapa do plano fica BLOQUEADA',
      etapa.estado === 'bloqueada', etapa);
    provar('…com a razão dita, e sem prometer derivação',
      /autoria não se reescreve/.test(String(etapa.falta || '')), etapa.falta);
    const envelope = await porta.lerEnvelope(arm, antes[0]);
    provar('…e o plano antigo continua a dizer o professor que o escreveu',
      envelope && envelope.contexto.professor === 'coqui', envelope && envelope.contexto);
    provar('…e não inventa um campo de contexto fora dos cinco do envelope',
      envelope && envelope.contexto.modalidade === undefined, envelope && envelope.contexto);
    provar('…sem perder o ciclo nem a escola',
      envelope && envelope.contexto.ciclo === '01' && envelope.contexto.escola === ESCOLA,
      envelope && envelope.contexto);
  }

  // ==========================================================================
  console.log('\nI. A MONTAGEM NA PONTE — os conteúdos da porta e o contador do pedido');

  {
    const servidor = (p) => new Response(fs.readFileSync(path.join(RAIZ, 'porta', p)),
      { status: 200, headers: { 'content-type': 'application/json' } });
    const envComAssets = {
      ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', GITHUB_TOKEN: 'token-de-prova',
      PADD_KV: kvDeMentira({}),
      ASSETS: {
        async fetch(pedido) {
          // O `carregarEstatico` passa uma `URL` (tem `pathname`), e não uma `Request`.
          const bruto = pedido && pedido.pathname ? pedido.pathname : String(pedido);
          const caminho = new URL(bruto, 'https://assets.local').pathname
            .replace(/^\/plano-observacao\//, '');
          try { return servidor(caminho); } catch (erro) { return new Response('nao', { status: 404 }); }
        },
      },
    };
    const cadeia = await producao.montarCadeia(envComAssets, ESCOLA);
    provar('com os conteúdos da porta, a cadeia monta-se', Boolean(cadeia && typeof cadeia.executar === 'function'),
      cadeia && Object.keys(cadeia));
    provar('…e sabe ler o log', Boolean(cadeia && typeof cadeia.lerLog === 'function'));

    const semAssets = await producao.montarCadeia({ ESCOLA_SLUG: ESCOLA, PADD_KV: kvDeMentira({}) }, ESCOLA);
    provar('sem os conteúdos, a montagem devolve `null` — e a rota continua', semAssets === null, semAssets);
  }

  // ==========================================================================
  console.log('\nG. O ORÇAMENTO — a travessia não começa o que não cabe');

  {
    const kv = kvDeMentira({ ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([curadoria()]) });
    const orcamento = { limite: 50, usados: 45, restantes: 5, coube: () => false, motivo: () => 'sem folga' };
    const cadeia = criarCadeia({
      armazenamento: criarMemoria(), porta,
      conteudo: ler('conteudo/anamnese.json'), conteudoPlano: ler('plano/conteudo/plano.json'),
      conteudoPO: ler('po/conteudo/po.json'), esquema: ler('envelope/elicitacao-schema.json'),
      carimbar: () => QUANDO, escreverPlano: async () => ({ ok: true }),
      escreverPO: async () => ({ ok: true }), escreverCiclo: async () => ({ ok: true }),
      disparar: async () => ({ ok: true }), geracao: null,
      concluirPO: async () => { throw new Error('não devia correr'); },
      lerCuradorias: async () => [curadoria()], lerTurmas: async () => [], lerLinhasDeBase: async () => [elenco()],
      linhaDeBaseDaTurma: async () => elenco(), kv, escola: ESCOLA, urlDaPorta: (b) => b,
      orcamento,
    });
    const r1 = await cadeia.executar({ gatilho: 'troca-de-aluna', elencos: ['elenco-a'], quando: QUANDO });
    provar('com o orçamento no fim, a cadeia NÃO corre', r1.ok === false && r1.orcamento === true, r1);
    provar('…e diz porquê, com os números', /45 de 50/.test(String(r1.erro)), r1.erro);
    provar('…e a Turma NÃO foi tocada', JSON.parse(kv._dados.get('bastidores/' + ESCOLA + '/curadorias'))[0]
      .alunas.length === 1);
    const log = await cadeia.lerLog();
    provar('…e a recusa fica no log', log.length === 1 && log[0].orcamento === true, log);
  }

  /* ==========================================================================
   * I. O AVISO QUE NÃO CHEGAVA A NINGUÉM (20/11/2026)
   *
   * A Sala `Rosa` passou a 110 minutos. A cadeia derivou o plano, o PO e o `.conf`, o
   * `comporConf` declarou a pendência certa — «a escola não declara VOLUME_MIN_110 nem
   * VOLUME_MAX_110 — o gerador recusa a aula de 110 min» — e ela ficou no relatório do
   * escrevedor. A cadeia respondeu `ok: true`, as quatro etapas disseram «feita», o professor
   * leu «está em dia», e o `gerar-ciclo` morreu dois minutos depois. O site ficou no pacote
   * antigo.
   *
   * O que se mede: a pendência SOBE ao topo da resposta do gesto, com uma frase que se lê.
   * ========================================================================== */
  console.log('\nI. A PENDÊNCIA DO MANIFESTO SOBE AO GESTO');

  {
    const pendencia = 'a escola não declara VOLUME_MIN_110 nem VOLUME_MAX_110 — o gerador recusa '
      + 'a aula de 110 min sem a faixa da Regra 9';
    const { cadeia, arm } = montar({ pendencias: [pendencia] });
    await semear(arm, { planoGerado: '2026-11-01T10:00', poGerado: '2026-11-01T11:00' });
    const r = await cadeia.executar({ gatilho: 'mudanca-de-sala', turmas: [TURMA], quando: QUANDO });

    provar('a pendência sobe ao topo da resposta, e não fica no relatório do escrevedor',
      Array.isArray(r.avisos) && r.avisos.length === 1, r.avisos);
    provar('…e diz o que vai acontecer, em vez de esperar pelo CI',
      /vai recusar esta aula/.test(String((r.avisos || [])[0])), (r.avisos || [])[0]);
    provar('…e nomeia a chave que falta',
      /VOLUME_MIN_110/.test(String((r.avisos || [])[0] || '')), (r.avisos || [])[0]);
    /* E O CONTRÁRIO: sem pendência, nenhum aviso é inventado. */
    const limpo = montar({});
    await semear(limpo.arm, { planoGerado: '2026-11-01T10:00', poGerado: '2026-11-01T11:00' });
    const r2 = await limpo.cadeia.executar({
      gatilho: 'mudanca-de-sala', turmas: [TURMA], quando: QUANDO });
    provar('CONTROLE NEGATIVO: sem pendência, a resposta não leva aviso nenhum',
      r2.avisos === undefined, r2.avisos);
  }

  // ==========================================================================
  /* J. O CONTEÚDO DA TURMA MANDA, E A DATA NÃO O SABE (20/11/2026)
   * ==========================================================================
   *
   * O DEFEITO, medido ao vivo na `breu`. Ela acrescentou o «Batman GT» à Turma `Rosa`, escolheu o
   * objetivo 3 na janela, gravou — e o `aula-1-parametro` do plano ficou SEM nenhum objetivo
   * marcado. O log da cadeia tem seis execuções entre 19:20 e 20:22, todas `ok: true`, todas com
   * `plano-de-ensino · feita · plano-20261120-1411`: o plano nunca foi derivado, e a declaração
   * nunca teve onde ser aplicada.
   *
   * A CAUSA É A ÚLTIMA PERGUNTA DA ESCADA. `novo(gerado_em)` compara strings, e `quando` é a
   * VIGÊNCIA da Turma — uma DATA. O plano é de `2026-11-20T14:11` e a vigência é `2026-11-20`:
   * `'2026-11-20T14:11' >= '2026-11-20'`, e o plano passa por mais novo do que a mudança. Todos
   * os dias, todas as vezes, porque tudo acontece no mesmo dia.
   *
   * O QUE SE MEDE AQUI são os DOIS SENTIDOS da guarda, com os números do caso real, e os três
   * controles negativos que a impedem de derivar para sempre.
   */
  console.log('\nJ. O CONTEÚDO DA TURMA MANDA, E A DATA NÃO SABE (o caso da breu, 20/11/2026)');

  {
    /* Os dados vêm do caso real: vigência `2026-11-20`, plano do MESMO dia às 14:11, a Turma com
     * quatro exercícios e a declaração do «Batman GT». */
    const PLANO_DA_BREU = {
      id: 'plano-20261120-1411', gerado_em: '2026-11-20T14:11',
      respostas: { repertorio: r(['Battement tendu', 'Plié', 'Relevé']) },
    };
    const TURMA_DA_BREU = {
      repertorio: ['Battement tendu', 'Plié', 'Relevé', 'Batman GT'],
      declaracoes: { 'Batman GT': [3] },
    };
    const indiceCom = (conteudo, plano) => nucleoCadeia.indice({
      elenco: { id: 'e', alunas: ['A'] }, curadoria: { id: 'c', turma: TURMA, alunas: ['A'] },
      turma: TURMA,
      plano: plano || PLANO_DA_BREU,
      po: { id: 'po-20261120-1411', gerado_em: '2026-11-20T14:11' },
      /* A VIGÊNCIA É UMA DATA, e é ela que faz o defeito. */
      quando: '2026-11-20', pacoteEmDia: true,
      conteudo,
    });
    const plano = (i) => i.etapas.find((x) => x.chave === 'plano-de-ensino');
    const po = (i) => i.etapas.find((x) => x.chave === 'plano-de-observacao');

    /* PRIMEIRO O DEFEITO, para a prova não passar por acidente: sem a guarda, tudo «feita». */
    const semGuarda = indiceCom(null);
    provar('sem o conteúdo no estado, a escada dá o plano do MESMO DIA por `feita` — é o defeito',
      plano(semGuarda).estado === 'feita', plano(semGuarda));

    const comDeclaracao = indiceCom(TURMA_DA_BREU);
    provar('com o conteúdo, o plano que não carrega o exercício DECLARADO fica `pendente`',
      plano(comDeclaracao).estado === 'pendente', plano(comDeclaracao));
    provar('…e a falta nomeia o exercício que a Turma declara',
      /Batman GT/.test(String(plano(comDeclaracao).falta)), plano(comDeclaracao).falta);
    provar('…e diz de que plano se trata',
      /plano-20261120-1411/.test(String(plano(comDeclaracao).falta)), plano(comDeclaracao).falta);
    provar('…e o PO segue o plano, porque observa um plano que vai mudar',
      po(comDeclaracao).estado === 'pendente', po(comDeclaracao));

    /* CONTROLE NEGATIVO 1: o mesmo conteúdo do plano. Nada a derivar. */
    const emDia = indiceCom({
      repertorio: ['Battement tendu', 'Plié', 'Relevé'],
      declaracoes: { 'Battement tendu': [1] },
    });
    provar('CONTROLE NEGATIVO: conteúdo igual ao do plano não deriva nada',
      plano(emDia).estado === 'feita', plano(emDia));

    /* CONTROLE NEGATIVO 2: um exercício da Turma SEM declaração não faz o plano mudar — a
     * derivação não o aplicaria, e exigi-la seria pedir uma derivação que não deriva nada, para
     * sempre. */
    const semDeclaracao = indiceCom({
      repertorio: ['Battement tendu', 'Plié', 'Relevé', 'Novo sem declaração'], declaracoes: {},
    });
    provar('CONTROLE NEGATIVO: exercício novo SEM declaração não põe o plano a derivar',
      plano(semDeclaracao).estado === 'feita', plano(semDeclaracao));

    /* CONTROLE NEGATIVO 3: uma Turma sem lista declarada não julga ninguém. */
    const semLista = indiceCom({ repertorio: [], declaracoes: {} });
    provar('CONTROLE NEGATIVO: Turma sem repertório declarado não acusa o plano',
      plano(semLista).estado === 'feita', plano(semLista));

    /* O OUTRO SENTIDO: o exercício que a Turma já não ensina sai do plano. É a remoção — o gesto
     * que ela fez primeiro («eu removi o Batman GT»), e que também parava na data. */
    const comRemocao = indiceCom({
      repertorio: ['Battement tendu', 'Plié'], declaracoes: {},
    });
    provar('o plano que carrega um exercício que a Turma já não ensina fica `pendente`',
      plano(comRemocao).estado === 'pendente', plano(comRemocao));
    provar('…e a frase diz o que sai, em vez de dizer só que mudou',
      /Relevé/.test(String(plano(comRemocao).falta)) && /já não/.test(String(plano(comRemocao).falta)),
      plano(comRemocao).falta);
    /* E A MESMA GUARDA NÃO DISPARA OUTRA VEZ depois de derivar: o plano podado já não carrega o
     * termo, e o aplicado já o tem. É isto que impede o ciclo infinito. */
    const depoisDePodar = indiceCom(
      { repertorio: ['Battement tendu', 'Plié'], declaracoes: {} },
      { id: 'plano-20261120-1500', gerado_em: '2026-11-20T15:00',
        respostas: { repertorio: r(['Battement tendu', 'Plié']) } });
    provar('…e depois de derivar, a guarda cala-se (é idempotente)',
      plano(depoisDePodar).estado === 'feita', plano(depoisDePodar));
    const depoisDeAplicar = indiceCom(
      { repertorio: ['Battement tendu', 'Plié', 'Relevé', 'Batman GT'],
        declaracoes: { 'Batman GT': [3] } },
      { id: 'plano-20261120-1500', gerado_em: '2026-11-20T15:00',
        respostas: { repertorio: r(['Battement tendu', 'Plié', 'Relevé', 'Batman GT']) } });
    provar('…e o mesmo com a declaração já aplicada',
      plano(depoisDeAplicar).estado === 'feita', plano(depoisDeAplicar));
  }

  // ==========================================================================
  /* K. A TRAVESSIA INTEIRA, COM O CONTEÚDO DA TURMA — o gesto dela, de ponta a ponta
   * ==========================================================================
   *
   * A secção J mediu o NÚCLEO: a escada passa a reconhecer que o plano está velho quando o
   * conteúdo da Turma mudou. Isto mede a LIGAÇÃO — que o servidor lhe ENTREGA esse conteúdo, e
   * que a declaração escolhida na janela chega, de facto, ao `aula-1-parametro` do elo novo.
   *
   * É a prova que faltava, e a falta dela é a história desta sessão: o núcleo estava certo e a
   * travessia não tinha por onde o saber. Uma prova que injeta o `conteudo` no `indice` e outra
   * que não o passa medem coisas diferentes — e o defeito vivia exactamente entre as duas.
   */
  console.log('\nK. A TRAVESSIA COM O CONTEÚDO DA TURMA — a declaração chega ao plano');

  {
    /* OS DADOS DO CASO REAL: vigência `2026-11-20` (uma DATA), plano do MESMO dia às 14:11, e a
     * Turma com o «Batman GT» a servir o objetivo 2 (a fixture só tem dois marcos). */
    const CU = curadoria({
      repertorio: ['Battement tendu', 'Batman GT'],
      objetivosDoRepertorio: { 'Batman GT': [2] },
    });
    const c = montar({ curadorias: [CU] });
    /* O plano não carrega o «Batman GT» — é o estado em que ela ficou. */
    await semear(c.arm, { planoGerado: '2026-11-20T14:11', poGerado: '2026-11-20T14:11' });

    /* SEM `declaracoes` NO PEDIDO (20/11/2026) — e é o caso REAL do botão «Atualizar o ciclo».
     *
     * A primeira versão desta prova passava a declaração no corpo, e por isso passava: o caminho
     * que ela usa (o «Gravar» da Turma) leva as declarações no pedido. O botão não leva corpo
     * nenhum, e a declaração que está registada na Turma nunca era lida — medido ao vivo na `breu`
     * com o `plano-20261120-1750`, que saiu podado e sem o exercício declarado. Uma prova que
     * injeta o que o gesto real não tem é a mesma família de prova que esta sessão já pagou quatro
     * vezes. */
    const r = await c.cadeia.executar({
      gatilho: 'atualizacao-pedida', turmas: [TURMA], quando: '2026-11-20',
      motivo: 'o professor pediu para levar a Turma ao ciclo agora',
    });

    provar('a travessia derivou um elo novo de plano (o do mesmo dia já não passa)',
      c.visto.planos.length === 1, { planos: c.visto.planos, erro: r.erro });
    const novoId = c.visto.planos[0];
    const novo = novoId ? await porta.lerEnvelope(c.arm, novoId) : null;
    provar('…e o elo novo existe no acervo', Boolean(novo), novoId);
    const valorNoNovo = (chave) => {
      const cru = novo && novo.respostas && novo.respostas[chave];
      return cru && typeof cru === 'object' && !Array.isArray(cru) && 'valor' in cru
        ? cru.valor : cru;
    };
    provar('…e o «Batman GT» ENTROU no repertório do plano',
      JSON.stringify(valorNoNovo('repertorio')) === JSON.stringify(['Battement tendu', 'Batman GT']),
      valorNoNovo('repertorio'));
    /* AS DUAS COISAS QUE ELA VIU FALTAR: a lista do item 10 e a marca no parâmetro. */
    const parametro = valorNoNovo('aula-1-parametro');
    const marcoDois = (Array.isArray(parametro) ? parametro : [])
      .find((l) => l && Number(l.marco) === 2);
    provar('…e o item 10 passou a citar o exercício no objetivo que ela marcou',
      Boolean(marcoDois) && (marcoDois.marcados || []).indexOf('Batman GT') !== -1, parametro);
    provar('…e o elo novo aponta o anterior — a proveniência acrescenta',
      novo && novo.ajuste_de === 'plano-20261103-2200', novo && novo.ajuste_de);
    /* O PO CONTA-SE PELO ACERVO, e não pelo espião: a fixture de `escreverPO` não regista nada, e
     * uma asserção que lesse o espião mediria a fixture em vez do produto. */
    provar('…e o PO também derivou, porque observa um plano que mudou',
      (await ids(c.arm, 'po')).length === 2, await ids(c.arm, 'po'));

    /* A IDEMPOTÊNCIA NA TRAVESSIA, e não só no núcleo: com a declaração já aplicada, a segunda
     * passagem não empilha elo nenhum. Sem isto, a guarda transformaria o «Atualizar o ciclo» num
     * gerador de elos infinitos — e é a diferença entre uma correcção e uma avaria. */
    const antes = (await ids(c.arm, 'plano')).length;
    /* A VIGÊNCIA DA SEGUNDA PASSAGEM É A DO ELO NOVO, e não a da primeira. Na produção é o que
     * acontece: derivada a Turma, a vigência dela passa a ser de agora, e o plano que nasceu nesta
     * travessia é do mesmo instante. Comparar outra vez com a data antiga mediria a escada da data
     * — que já tem as suas provas —, e não a guarda do conteúdo, que é o que esta secção mede. */
    await c.cadeia.executar({
      gatilho: 'troca-de-direcao', turmas: [TURMA], quando: QUANDO,
      motivo: 'segunda passagem', declaracoes: [],
    });
    provar('a segunda passagem, com a declaração já no plano, NÃO empilha elo',
      (await ids(c.arm, 'plano')).length === antes, { antes, depois: (await ids(c.arm, 'plano')).length });
  }

  // ==========================================================================
  /* L. A RÉGUA E A TRADIÇÃO RELIDAS — o botão só é honesto se a derivação as levar
   * ==========================================================================
   *
   * O DEFEITO QUE ISTO MEDE, e ele é o outro lado do botão «Atualizar o ciclo». A régua viaja no
   * envelope do plano como FOTOGRAFIA, e a tradição também (a resposta `contexto-metodologia`).
   * `derivarPlano` copiava as respostas do elo anterior e só relia o RITMO — portanto um elo novo
   * nascia com a régua e a tradição VELHAS. O botão acendia, derivava, e o documento saía igual.
   *
   * A REGRA É A MESMA QUE JÁ GOVERNA O RITMO, e está escrita no mesmo ficheiro: um campo
   * `deContexto` não é uma decisão do professor, é a leitura de um cadastro que mudou.
   */
  console.log('\nL. A RÉGUA E A TRADIÇÃO RELIDAS DO CADASTRO (o outro lado do botão)');

  {
    const REGUA_VELHA = ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'];
    const REGUA_NOVA = ['Ótimo', 'Bom', 'Em progresso'];
    /* A fixture do plano não declara `rubrica` nem `contexto-metodologia`; acrescentam-se para o
     * caso ser o real. O `contexto-modalidade` idem — é a chave que o perfil indexa. */
    const semearComRegua = async (arm, id, geradoEm, { rubrica, metodologia }) => {
      const env = planoFixture(id, { geradoEm });
      env.respostas.rubrica = r(rubrica);
      env.respostas['contexto-metodologia'] = r(metodologia);
      env.respostas['contexto-modalidade'] = r('bale-classico');
      await porta.gravarEnvelope(arm, env, relatorioDe(id));
    };

    const c = montar({ regua: REGUA_NOVA, tradicao: ['Francesa'] });
    const poId = 'po-20261103-2221';
    await semearComRegua(c.arm, 'plano-20261103-2200', '2026-11-03T22:00',
      { rubrica: REGUA_VELHA, metodologia: 'RAD' });
    await porta.gravarEnvelope(c.arm, poFixture(poId, { planoId: 'plano-20261103-2200',
      geradoEm: '2026-11-03T22:21' }), relatorioDe(poId));

    const rr = await c.cadeia.executar({
      gatilho: 'atualizacao-pedida', turmas: [TURMA], quando: QUANDO,
      motivo: 'o professor pediu para levar a Turma ao ciclo agora',
    });
    const novoId = c.visto.planos[0];
    const novo = novoId ? await porta.lerEnvelope(c.arm, novoId) : null;
    const valor = (chave) => {
      const cru = novo && novo.respostas && novo.respostas[chave];
      return cru && typeof cru === 'object' && !Array.isArray(cru) && 'valor' in cru ? cru.valor : cru;
    };

    provar('a travessia derivou um elo novo', Boolean(novo), { erro: rr.erro, planos: c.visto.planos });
    provar('…e o elo novo traz a RÉGUA de hoje, e não a fotografia do anterior',
      JSON.stringify(valor('rubrica')) === JSON.stringify(REGUA_NOVA), valor('rubrica'));
    provar('…e a TRADIÇÃO que o perfil declara hoje',
      String(valor('contexto-metodologia')) === 'Francesa', valor('contexto-metodologia'));
    provar('…e o aviso diz que a régua mudou, em vez de a trocar em silêncio',
      (rr.avisos || []).some((a) => /régua do plano passou a ser a da Sala/.test(a)), rr.avisos);
    provar('…e o mesmo para a tradição',
      (rr.avisos || []).some((a) => /tradição do plano passou a ser/.test(a)), rr.avisos);
    /* O ELO ANTERIOR não é tocado: a proveniência acrescenta. */
    const antigo = await porta.lerEnvelope(c.arm, 'plano-20261103-2200');
    const valorAntigo = (() => {
      const cru = antigo && antigo.respostas && antigo.respostas.rubrica;
      return cru && typeof cru === 'object' && 'valor' in cru ? cru.valor : cru;
    })();
    provar('…e o elo ANTERIOR continua a dizer a régua que valia (o passado não se reescreve)',
      JSON.stringify(valorAntigo) === JSON.stringify(REGUA_VELHA), valorAntigo);

    /* CONTROLE NEGATIVO 1: sem os leitores, nada muda — é o comportamento de antes, e ele não pode
     * ter sido quebrado por acidente. */
    const semLeitores = montar({});
    await semearComRegua(semLeitores.arm, 'plano-20261103-2200', '2026-11-03T22:00',
      { rubrica: REGUA_VELHA, metodologia: 'RAD' });
    await porta.gravarEnvelope(semLeitores.arm, poFixture(poId,
      { planoId: 'plano-20261103-2200', geradoEm: '2026-11-03T22:21' }), relatorioDe(poId));
    await semLeitores.cadeia.executar({
      gatilho: 'atualizacao-pedida', turmas: [TURMA], quando: QUANDO, motivo: 'sem leitores' });
    const semNovoId = semLeitores.visto.planos[0];
    const semNovo = semNovoId ? await porta.lerEnvelope(semLeitores.arm, semNovoId) : null;
    const valorSem = (() => {
      const cru = semNovo && semNovo.respostas && semNovo.respostas.rubrica;
      return cru && typeof cru === 'object' && 'valor' in cru ? cru.valor : cru;
    })();
    provar('CONTROLE: sem os leitores, a régua do elo novo é a do anterior (comportamento antigo)',
      JSON.stringify(valorSem) === JSON.stringify(REGUA_VELHA), valorSem);

    /* CONTROLE NEGATIVO 2: `null` é «não sei», e não é «apagar». Um perfil que não se pronuncia
     * deixa o método do plano como está. */
    const semSaber = montar({ regua: null, tradicao: null });
    await semearComRegua(semSaber.arm, 'plano-20261103-2200', '2026-11-03T22:00',
      { rubrica: REGUA_VELHA, metodologia: 'RAD' });
    await porta.gravarEnvelope(semSaber.arm, poFixture(poId,
      { planoId: 'plano-20261103-2200', geradoEm: '2026-11-03T22:21' }), relatorioDe(poId));
    await semSaber.cadeia.executar({
      gatilho: 'atualizacao-pedida', turmas: [TURMA], quando: QUANDO, motivo: 'não sei' });
    const semSaberId = semSaber.visto.planos[0];
    const semSaberNovo = semSaberId ? await porta.lerEnvelope(semSaber.arm, semSaberId) : null;
    const metodoSemSaber = (() => {
      const cru = semSaberNovo && semSaberNovo.respostas && semSaberNovo.respostas['contexto-metodologia'];
      return cru && typeof cru === 'object' && 'valor' in cru ? cru.valor : cru;
    })();
    provar('CONTROLE: «não sei» não apaga o que está escrito (a tradição fica RAD)',
      String(metodoSemSaber) === 'RAD', metodoSemSaber);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: a cadeia percorre vínculos → plano → PO → pacote, '
      + 'pára no que falta e diz onde, não empilha elos repetidos e deixa o rasto no log.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
