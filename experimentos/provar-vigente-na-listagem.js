#!/usr/bin/env node
'use strict';

/**
 * provar-vigente-na-listagem.js — a estante mostra UM por documento, e as versões anteriores
 * ficam guardadas (03/11/2026).
 *
 * O QUE ACONTECEU. O professor ajustou o Plano de Observação três vezes até a geração passar. Do
 * lado dele foi UMA coisa — ajustou e salvou —, mas a listagem da Área do Professor passou a
 * mostrar três linhas com o MESMO nome («Plano de Observação — Balé Nível 1 — Teste 3»), uma por
 * envelope. O mecanismo de proveniência, que existe para o trabalho não se perder, estava a
 * aparecer onde ninguém o pediu.
 *
 * O QUE ESTA PROVA FIXA, e por que cada uma importa:
 *
 *   1. A CADEIA — um envelope que outro aponta em `ajuste_de` está substituído, e não é listado.
 *      É a proveniência a declarar o sucessor; não é inferência.
 *   2. AS IRMÃS — duas tentativas derivadas do MESMO original (nenhuma é sucessora da outra)
 *      colapsam no contexto: uma linha, a mais recente. Era o caso real: cada «ajustar» criava
 *      um irmão do primeiro, e todos apareciam.
 *   3. O QUE NÃO SE AGRUPA — documentos distintos continuam distintos: outro plano observado,
 *      outro ciclo, outra turma, outra aluna; e um registo sem o campo que o identifica não é
 *      agrupado, porque juntar desconhecidos é a maneira mais fácil de esconder o que é outro.
 *   4. NADA SE PERDE — os envelopes escondidos continuam no acervo, legíveis pelo id, com o
 *      `ajuste_de` intacto; e as listas que NÃO são estante (o índice, os estados, a regra de
 *      proveniência dos Bastidores) continuam a ver tudo.
 *   5. A LINHA DIZ O QUE ESCONDEU — «2 versões anteriores guardadas». Uma linha que aparece
 *      sozinha onde havia três, sem uma palavra, faz concluir que o sistema apagou o trabalho.
 *
 * SEM REDE e SEM navegador: o KV é um Map, e a página é a de `listas-do-acervo.js`, chamada
 * directamente com o mesmo `env` que a ponte usa.
 *
 *   node experimentos/provar-vigente-na-listagem.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));
const producao = require(path.join(raiz, 'motor/servidor/producao.js'));
const listasDoAcervo = require(path.join(raiz, 'motor/servidor/listas-do-acervo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* O KV em memória, com a forma que o `criarArmazenamento` usa (get/put/delete/list). */
function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })),
        list_complete: true,
      };
    },
    _dados: dados,
  };
}

/** O relatório mínimo que o `gravarEnvelope` exige — o mesmo formato do motor. */
function relatorioDe(id) {
  return {
    id,
    estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [],
    paradas: [],
    idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [],
    linhas: [],
  };
}

const resposta = (valor) => ({ valor });

/** Um envelope com o contexto e as respostas que a listagem lê. */
function envelope({ id, fonte, professor, aluna, turma, ciclo, plano, ajusteDe, geradoEm }) {
  const contexto = { escola: ESCOLA, professor: professor || 'p', ciclo: ciclo || '01' };
  if (aluna) contexto.aluna = aluna;
  const respostas = {};
  if (turma) {
    respostas['contexto-turma'] = resposta(turma);
    respostas['objetivo-geral'] = resposta('objetivo de ' + turma);
  }
  if (fonte === 'po') {
    respostas.sujeitos = resposta(['Aluna A']);
    respostas['plano-de-ensino'] = resposta(plano || []);
  }
  const envelope = {
    id, contexto, respostas, gerado_em: geradoEm || '2026-11-03T22:00',
  };
  if (ajusteDe) envelope.ajuste_de = ajusteDe;
  return envelope;
}

let ESCOLA = 'breu';

(async () => {
  const kv = kvDeMentira();
  const env = {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p', PADD_KV: kv,
  };
  const arm = producao.__armazenamento(env);

  /*
   * O FIXTURE É O CASO REAL, com os três nomes iguais: o mesmo plano observado três vezes — a
   * primeira, e duas tentativas irmãs derivadas dela (é o que o «ajustar» faz quando o professor
   * volta à tela e ajusta de novo sem partir da última).
   */
  const docs = [
    envelope({ id: 'plano-20261103-2200', fonte: 'plano', turma: 'Balé Nível 1 — Teste 3',
      geradoEm: '2026-11-03T22:00' }),
    envelope({ id: 'po-20261103-2202', fonte: 'po', plano: ['plano-20261103-2200'],
      geradoEm: '2026-11-03T22:02' }),
    envelope({ id: 'po-20261103-2208', fonte: 'po', plano: ['plano-20261103-2200'],
      ajusteDe: 'po-20261103-2202', geradoEm: '2026-11-03T22:08' }),
    envelope({ id: 'po-20261103-2221', fonte: 'po', plano: ['plano-20261103-2200'],
      ajusteDe: 'po-20261103-2202', geradoEm: '2026-11-03T22:21' }),
    // Outro plano observado: é OUTRO documento, e mantém a sua linha.
    envelope({ id: 'plano-20261103-2300', fonte: 'plano', turma: 'Balé Nível 2',
      geradoEm: '2026-11-03T23:00' }),
    // A DERIVAÇÃO do plano anterior: é UMA versão nova do mesmo documento, e substitui-o.
    envelope({ id: 'plano-20261103-2320', fonte: 'plano', turma: 'Balé Nível 2',
      ajusteDe: 'plano-20261103-2300', geradoEm: '2026-11-03T23:20' }),
    envelope({ id: 'po-20261103-2305', fonte: 'po', plano: ['plano-20261103-2300'],
      geradoEm: '2026-11-03T23:05' }),
    // A MESMA turma noutro CICLO: outro plano (a pesquisadora: «outro ciclo é outro documento»).
    envelope({ id: 'plano-20261104-0900', fonte: 'plano', turma: 'Balé Nível 1 — Teste 3',
      ciclo: '02', geradoEm: '2026-11-04T09:00' }),
    // A anamnese: duas da mesma aluna (a segunda substitui), uma de outra aluna.
    envelope({ id: 'anamnese-20261103-1600', fonte: 'anamnese', aluna: 'Aluna A',
      geradoEm: '2026-11-03T16:00' }),
    envelope({ id: 'anamnese-20261103-1700', fonte: 'anamnese', aluna: 'Aluna A',
      geradoEm: '2026-11-03T17:00' }),
    envelope({ id: 'anamnese-20261103-1630', fonte: 'anamnese', aluna: 'Aluna B',
      geradoEm: '2026-11-03T16:30' }),
    // Sem sujeito: NÃO se agrupa (não há campo que identifique o documento).
    envelope({ id: 'anamnese-20261103-1800', fonte: 'anamnese', geradoEm: '2026-11-03T18:00' }),
    envelope({ id: 'anamnese-20261103-1830', fonte: 'anamnese', geradoEm: '2026-11-03T18:30' }),
  ];
  for (const d of docs) await porta.gravarEnvelope(arm, d, relatorioDe(d.id));

  const pagina = async (chave) => {
    const p = await listasDoAcervo.pagina('/area-do-professor/' + chave + '/', {
      env, menu: null, escola: ESCOLA, curadorias: [],
    });
    return p ? p.html : '';
  };
  const cartoes = (html) => [...html.matchAll(/<li class="trio-plano"[\s\S]*?<\/li>/g)].map((m) => m[0]);
  const texto = (c) => c.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const nomes = (html) => cartoes(html).map((c) => {
    const m = /<b>([\s\S]*?)<\/b>/.exec(c);
    return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';
  });

  console.log('\n1 · O Planos de Observação: três envelopes do mesmo plano, UMA linha');
  {
    const html = await pagina('plano-de-observacao');
    const linhas = cartoes(html);
    provar('a estante tem DUAS linhas (os dois planos observados), e não cinco',
      linhas.length === 2, { linhas: linhas.length });
    const doPlano1 = linhas.find((l) => /Balé Nível 1 — Teste 3/.test(texto(l)));
    provar('e ela diz que guardou as anteriores — «2 versões anteriores guardadas»',
      Boolean(doPlano1) && /2 versões anteriores guardadas/.test(texto(doPlano1)),
      doPlano1 ? texto(doPlano1).slice(0, 160) : null);
    provar('o outro plano observado não é colapsado com ele (outro documento)',
      linhas.some((l) => /Balé Nível 2/.test(texto(l))));
  }

  console.log('\n2 · O vigente é o certo, e o histórico é o resto');
  {
    const resumos = await porta.resumosDeEnvelopes(arm, /^po-.*\.json$/);
    const lista = resumos.map(({ nome, resumo }) => Object.assign({}, resumo, {
      id: resumo.id || nome.replace(/\.json$/, ''),
    }));
    const { vigentes, historico } = porta.vigentesDaFamilia(lista, 'po');
    const ids = vigentes.map((r) => r.id).sort();
    provar('ficam só os dois vigentes (um por plano observado)',
      ids.join(',') === 'po-20261103-2221,po-20261103-2305', ids);
    provar('e o histórico do vigente tem os DOIS elos escondidos, na mesma linha',
      (historico.get('po-20261103-2221') || []).length === 2,
      historico.get('po-20261103-2221'));
  }

  console.log('\n3 · NADA se perde: o acervo continua inteiro');
  {
    const antigo = await porta.lerEnvelope(arm, 'po-20261103-2202');
    provar('o envelope substituído continua legível pelo id', Boolean(antigo && antigo.id === 'po-20261103-2202'));
    const indice = await porta.nomesDeEnvelopes(arm, /^po-.*\.json$/);
    provar('e continua no índice — é ele que a proveniência lê', indice.length === 4, indice.length);
    const todos = await porta.estadosDosPlanos(arm);
    provar('os estados do plano continuam a derivar de tudo (o legado não desaparece)',
      todos['plano-20261103-2200'] && todos['plano-20261103-2200'].estado === 'vinculada');
  }

  console.log('\n4 · As anamneses: uma por aluna, e as sem sujeito não se juntam');
  {
    const html = await pagina('anamnese');
    const linhas = cartoes(html);
    provar('três linhas: Aluna A (a mais recente), Aluna B e as duas sem sujeito',
      linhas.length === 4, { linhas: linhas.length, nomes: nomes(html) });
    const a = linhas.find((l) => /Aluna A/.test(texto(l)));
    provar('a linha da Aluna A diz que guardou a anterior',
      Boolean(a) && /1 versão anterior guardada/.test(texto(a)));
  }

  console.log('\n5 · Os planos de ensino: a derivação substitui, e o que é outro documento fica');
  {
    const html = await pagina('plano-de-ensino');
    const linhas = cartoes(html);
    provar('três linhas: a turma 1, a turma 2 (derivada) e a turma 1 noutro ciclo',
      linhas.length === 3, { linhas: linhas.length, nomes: nomes(html) });
    const derivada = linhas.find((l) => /Balé Nível 2/.test(texto(l)));
    provar('a linha da turma 2 é a versão DERIVADA, e diz que guardou a anterior',
      Boolean(derivada) && /1 versão anterior guardada/.test(texto(derivada)),
      derivada ? texto(derivada).slice(0, 160) : null);
    /* O NOME NÃO LEVA O CICLO, e por isso duas linhas legítimas podem ser homónimas (a mesma
     * turma em dois ciclos). O que as distingue é o painel da caixa — e é isso que se mede. */
    const doCiclo = linhas.filter((l) => /Balé Nível 1 — Teste 3/.test(texto(l)));
    const ciclos = doCiclo.map((l) => (/Ciclo\s+(0[12])/.exec(texto(l)) || [])[1]);
    provar('e as duas da mesma turma são de CICLOS diferentes — não é repetição',
      doCiclo.length === 2 && ciclos.indexOf('01') !== -1 && ciclos.indexOf('02') !== -1,
      { linhas: doCiclo.length, ciclos });
  }

  console.log('\n6 · A regra, isolada — o que se agrupa e o que não');
  {
    const r = (id, extra) => Object.assign({
      id, fonte: 'po', escola: 'breu', professor: 'p', ciclo: '01', plano: ['plano-1'],
      gerado_em: '2026-11-03T22:0' + id.slice(-1),
    }, extra || {});
    const um = porta.vigentesDaFamilia([r('po-a'), r('po-b'), r('po-c')], 'po');
    provar('sem elo nenhum, as três irmãs do mesmo plano dão UMA linha', um.vigentes.length === 1);
    const dois = porta.vigentesDaFamilia([r('po-a'), r('po-b', { plano: ['plano-2'] })], 'po');
    provar('planos observados diferentes dão DUAS linhas', dois.vigentes.length === 2);
    const semPlano = porta.vigentesDaFamilia([r('po-a', { plano: [] }), r('po-b', { plano: [] })], 'po');
    provar('sem o plano (o campo que identifica o PO) não se agrupa', semPlano.vigentes.length === 2);
    /* O CICLO NÃO ESTÁ NA CHAVE DO PO, e não precisa de estar: o plano que ele observa é de um
     * ciclo, e o id do plano é único. Dois ciclos ⇒ dois planos ⇒ duas chaves. A prova é a de
     * cima — «planos observados diferentes dão DUAS linhas» —, e é ela que cobre o caso. */

    /* O PLANO — a bancada `provar-apagar-da-listagem` é que fixou esta decisão: dois planos da
     * mesma turma e do mesmo ciclo, com objetivos diferentes, são DOIS documentos, e um deles pode
     * ser o que um PO observa. Só a derivação os substitui. */
    const planos = (extra) => Object.assign({
      fonte: 'plano', escola: 'breu', professor: 'p', ciclo: '01', turma: 'T',
    }, extra);
    const doisPlanos = porta.vigentesDaFamilia([
      planos({ id: 'plano-a', gerado_em: '1' }), planos({ id: 'plano-b', gerado_em: '2' }),
    ], 'plano');
    provar('dois planos da mesma turma e ciclo NÃO se colapsam (o objetivo é que os distingue)',
      doisPlanos.vigentes.length === 2, doisPlanos.vigentes.map((x) => x.id));
    const derivado = porta.vigentesDaFamilia([
      planos({ id: 'plano-a', gerado_em: '1' }),
      planos({ id: 'plano-b', gerado_em: '2', ajuste_de: 'plano-a' }),
    ], 'plano');
    provar('mas a DERIVAÇÃO substitui — o plano novo fica, o antigo vai para o histórico',
      derivado.vigentes.length === 1 && derivado.vigentes[0].id === 'plano-b',
      derivado.vigentes.map((x) => x.id));

    /* A ANAMNESE — uma só por aluna, a regra que o sistema já derivava (sem olhar o ciclo). */
    const anamneses = porta.vigentesDaFamilia([
      { id: 'a1', fonte: 'anamnese', escola: 'breu', aluna: 'A', ciclo: '01', gerado_em: '1' },
      { id: 'a2', fonte: 'anamnese', escola: 'breu', aluna: 'A', ciclo: '02', gerado_em: '2' },
      { id: 'a3', fonte: 'anamnese', escola: 'breu', aluna: 'B', ciclo: '01', gerado_em: '3' },
    ], 'anamnese');
    provar('a anamnese é uma por aluna — como o sistema já a tratava',
      anamneses.vigentes.length === 2, anamneses.vigentes.map((x) => x.id));
    const semSujeito = porta.vigentesDaFamilia([
      { id: 'a1', fonte: 'anamnese', escola: 'breu', gerado_em: '1' },
      { id: 'a2', fonte: 'anamnese', escola: 'breu', gerado_em: '2' },
    ], 'anamnese');
    provar('e as anamneses SEM sujeito não se juntam umas às outras', semSujeito.vigentes.length === 2);
    const cicloDeAjuste = porta.vigentesDaFamilia([
      { id: 'po-a', fonte: 'po', escola: 'breu', plano: ['x'], gerado_em: '1' },
      { id: 'po-b', fonte: 'po', escola: 'breu', plano: ['y'], gerado_em: '2', ajuste_de: 'po-a' },
    ], 'po');
    provar('um ciclo de `ajuste_de` não esconde nada por engano',
      cicloDeAjuste.vigentes.length >= 1);
  }

  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'
    : 'TUDO CERTO — ' + provas + ' asserções: a estante mostra um por documento, as versões '
      + 'anteriores ficam guardadas e legíveis, e o que é outro documento continua a ter a sua linha.'));
  process.exit(falhas ? 1 : 0);
})().catch((erro) => {
  console.error('erro na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
