#!/usr/bin/env node
'use strict';

/*
 * provar-historico-do-ajuste.js — a PEÇA «ajustes anteriores» diz o QUE mudou, QUANDO e PORQUÊ —
 * e NÃO APARECE NA LISTAGEM (18/11/2026).
 *
 * O QUE MUDOU A 18/11/2026, e é o que manda no resto deste ficheiro. Ela viu o acordeão no cartão
 * da sala e cortou-o: «Esse é um item de auditoria […] Ele não tem que aparecer aqui na tela. Pode
 * tirar. […] Imagina, isso aqui vai ficar gigantesco se colocar esse histórico toda vez. […] por
 * enquanto, ele existe internamente, mas ele não aparece aqui na listagem.»
 *
 * A CONSEQUÊNCIA PARA ESTA PROVA, e ela é o motivo de o ficheiro ter sido reescrito: as asserções
 * que liam o bloco da PÁGINA deixaram de ter onde o ler. O que se mede agora é a PEÇA — chamada
 * directamente, porque `historicoDoAjuste` e `diferencaDeRitmo` passaram a ser exportadas —, mais
 * uma secção nova que prova a AUSÊNCIA na listagem. A peça não fica órfã nem apodrece em silêncio
 * até ao dia em que o item de auditoria for desenhado.
 *
 * (Já antes desta data a prova estava parcialmente quebrada: a lista de TURMAS perdeu o histórico
 * a 11/11/2026 e ninguém reviu as oito asserções que contavam dois blocos na página. Fica dito, em
 * vez de varrido para debaixo do tapete.)
 *
 * O que se prova, contra o código servido:
 *
 * O QUE ESTA PROVA FIXAVA, e porquê. O bloco existia desde 16/10/2026 e dizia o ritmo de cada
 * versão em texto corrido. A pesquisadora perguntou para que servia — «por que a pessoa gostaria
 * de saber isso?» —, e a resposta honesta era: para saber desde quando vale o ritmo de hoje e o
 * que valia antes. A tela não respondia nem uma nem outra de forma directa:
 *
 *   · o rótulo era `2 versão(ões) anterior(es)` — hesitação de máquina, que se lê como defeito;
 *   · eram duas fotografias, e a diferença era o leitor a calcular de olho;
 *   · a data saía em DOIS formatos: `01/11/2026` nas Salas e `2026-11-01` nas Turmas, porque o
 *     bloco era um por lista;
 *   · e o motivo não existia em lado nenhum do cartão — só no log da cadeia, noutro ecrã.
 *
 * Aqui prova-se, contra o código servido:
 *
 *   A. O RÓTULO em português corrente, singular e plural — e nenhum `(ões)`/`(es)`.
 *   B. A DIFERENÇA calculada: a hora agrupada por transição, a duração, o período — e
 *      «(sem alteração)» quando uma derivação não mudou nada.
 *   C. A DATA em BR nas DUAS listas, e no selo «ajustada em».
 *   D. O MOTIVO: aparece quando foi declarado, NÃO aparece quando não foi — o sistema não
 *      inventa razão —, e NÃO é herdado pelo elo seguinte (o `Object.assign` da derivação
 *      copiaria o registo inteiro; sem o `delete`, a razão do primeiro ajuste ficaria para
 *      sempre em todas as versões).
 *   E. AS ROTAS: `turma-derivar` e `curadoria-derivar` gravam o motivo no elo novo, com o texto
 *      normalizado, e o elo antigo não é tocado.
 *   F. A TURMA (curadoria): a diferença nomeia o PROFESSOR (e não o slug), a sala que entrou e a
 *      que saiu, o elenco e as alunas.
 *
 * SEM REDE: o KV é de mentira e o `fetch` devolve 404 (bancada sem GitHub).
 *
 *   node experimentos/provar-historico-do-ajuste.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'historico';
const SENHA = 'senha-de-prova';
const NOME_DA_SALA = 'Balé Nível 1';

const RITMO = {
  nome: NOME_DA_SALA, frequencia: 2, dias: ['ter', 'qui'],
  horarios: { ter: '18:00', qui: '18:00' }, duracaoMin: 60,
  periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
};

const sala = (extra) => Object.assign({ id: 'bale-nivel-1' }, RITMO, extra || {});
const salaDois = (extra) => Object.assign({ id: 'bale-nivel-2' }, RITMO,
  { nome: 'Balé Nível 2', dias: ['qua'], horarios: { qua: '19:00' } }, extra || {});

/** A cadeia de três versões como a derivação a produz: `substitui` aponta para trás. */
const cadeiaDeSalas = () => [
  sala({ substituidaPor: 'bale-nivel-1-2026-03-15', substituidaEm: '2026-03-15' }),
  sala({
    id: 'bale-nivel-1-2026-03-15', substitui: 'bale-nivel-1',
    substituidaPor: 'bale-nivel-1-2026-11-01', substituidaEm: '2026-11-01',
    duracaoMin: 75,
  }),
  sala({
    id: 'bale-nivel-1-2026-11-01', substitui: 'bale-nivel-1-2026-03-15',
    vigenteDe: '2026-11-01', duracaoMin: 75, horarios: { ter: '19:00', qui: '19:00' },
    motivoDoAjuste: 'a sala mudou para o período da noite',
  }),
];

function pagina(extra) {
  const e = extra || {};
  return bastidores.paginaProducao(ESCOLA,
    { professor: 'pe-torto', ciclo: '01', query: 'professor=pe-torto&escola=' + ESCOLA },
    e.profs || [{ nome: 'Petorto', slug: 'pe-torto' }, { nome: 'Marina Souza', slug: 'marina' }],
    e.alunas || ['Ana', 'Bia'], 'Petorto', 'pe-torto',
    e.salas === undefined ? cadeiaDeSalas() : e.salas,
    [], {}, e.curadorias || [], [], []);
}

/** A PEÇA, chamada directamente — e não colhida da página (18/11/2026).
 *
 * `elos` é a cadeia como a derivação a produz, e a peça espera `{versao, sucessor}`: a versão
 * antiga e a que tomou o seu lugar. É o mesmo emparelhamento que a listagem fazia antes de o bloco
 * sair do ecrã, e ele fica aqui para a prova não depender de uma tela que já não o tem. */
function peca(salas) {
  const lista = (salas || []).slice();
  if (lista.length < 2) return '';
  /* A ÚLTIMA É A VIGENTE, e as outras são o passado — emparelhadas como a listagem as lia: cada
   * versão antiga com a que lhe tomou o lugar, e a MAIS RECENTE primeiro (o elo que acabou de
   * acontecer é o que se procura). O `i === 0` é o elo da versão imediatamente anterior com a
   * versão de hoje. */
  const atual = lista[lista.length - 1];
  const passado = lista.slice(0, -1).reverse();
  const elos = passado.map((v, i) => ({ versao: v, sucessor: i === 0 ? atual : passado[i - 1] }));
  return bastidores.historicoDoAjuste(elos, bastidores.diferencaDeRitmo);
}

/** O miolo do `<details class="historico">`, ou `''` quando a peça não produz bloco. */
function bloco(html) {
  const i = String(html || '').indexOf('<details class="historico">');
  if (i === -1) return '';
  const j = String(html).indexOf('</details>', i);
  return j === -1 ? String(html).slice(i) : String(html).slice(i, j + 10);
}

/** O texto de um bloco, sem marcação — é o que a pessoa lê. */
const texto = (html) => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

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

(async () => {
  /* A BANCADA NÃO VAI AO AR: o `fetch` falso devolve 404 a tudo — «não há repositório», que é o
   * estado de uma bancada sem token. Sem isto, as rotas iriam falar com a API do GitHub. */
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () => new Response('nao', { status: 404 });

  // ==========================================================================================
  console.log('\nA. O RÓTULO — português corrente, singular e plural');

  {
    const comTres = peca(cadeiaDeSalas());
    provar('três versões na cadeia dão dois ajustes anteriores',
      /2 ajustes anteriores/.test(texto(comTres)), texto(comTres));
    provar('…e NENHUM «(ões)» no que a peça escreve', !/\(ões\)|\(es\)/.test(comTres),
      (comTres.match(/[^ ]*\(ões\)[^ ]*/g) || []).slice(0, 3));

    const comUma = peca([
      sala({ substituidaPor: 'so-uma', substituidaEm: '2026-03-15' }),
      sala({ id: 'so-uma', substitui: 'bale-nivel-1', vigenteDe: '2026-03-15' }),
    ]);
    provar('uma versão anterior diz «1 ajuste anterior», sem o plural',
      /1 ajuste anterior/.test(texto(comUma)), texto(comUma));
    provar('…e não escreve «1 ajustes»', !/1 ajustes/.test(texto(comUma)));

    provar('sem versão anterior não há bloco nenhum', peca([sala()]) === '', peca([sala()]));
  }

  // ==========================================================================================
  console.log('\nB. A DIFERENÇA — o que mudou, e não duas fotografias');

  {
    const t = texto(peca(cadeiaDeSalas()));
    provar('a hora agrupada por transição: «ter, qui: 18:00 → 19:00»',
      /ter, qui: 18:00 → 19:00/.test(t), t);
    provar('…e não repetida por dia (a versão anterior dizia duas vezes)',
      !/ter 18:00 → 19:00/.test(t), t);
    provar('a duração aparece como mudança: «60 min → 75 min»', /60 min → 75 min/.test(t), t);
    provar('o motivo vem na linha do ajuste que o declarou',
      /motivo: «a sala mudou para o período da noite»/.test(t), t);
    provar('cada linha começa pelo fim da validade da versão', /até 01\/11\/2026/.test(t), t);

    // Uma derivação sem alteração nenhuma não pode inventar uma diferença.
    const semMudanca = peca([
      sala({ substituidaPor: 's-igual-2', substituidaEm: '2026-11-01' }),
      sala({ id: 's-igual-2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01' }),
    ]);
    provar('derivar sem mudar nada diz «(sem alteração)», e não finge uma diferença',
      /\(sem alteração\)/.test(texto(semMudanca)), texto(semMudanca));

    // A entrada e a saída de um dia são ditas como tal, e não como mudança de hora.
    const trocaDeDia = peca([
      sala({ substituidaPor: 's-dia-2', substituidaEm: '2026-11-01' }),
      sala({
        id: 's-dia-2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01',
        dias: ['ter', 'sex'], horarios: { ter: '18:00', sex: '18:00' },
      }),
    ]);
    const td = texto(trocaDeDia);
    provar('um dia que entrou é «entrou sex 18:00»', /entrou sex 18:00/.test(td), td);
    provar('…e um que saiu é «saiu qui 18:00»', /saiu qui 18:00/.test(td), td);

    // O período também é um eixo do ritmo.
    const comPeriodo = peca([
      sala({ substituidaPor: 's-per-2', substituidaEm: '2026-11-01' }),
      sala({ id: 's-per-2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01', periodoFim: '2026-12-15' }),
    ]);
    provar('o fim do período aparece como mudança: «fim 31/12/2026 → 15/12/2026»',
      /fim 31\/12\/2026 → 15\/12\/2026/.test(texto(comPeriodo)), texto(comPeriodo));
  }

  // ==========================================================================================
  console.log('\nC. A DATA — em BR, e nunca em ISO');

  {
    const t = texto(peca(cadeiaDeSalas()));
    provar('a data sai em BR no bloco', /até 01\/11\/2026/.test(t), t);
    provar('…e nenhuma data ISO crua', !/\d{4}-\d{2}-\d{2}/.test(t),
      (t.match(/\d{4}-\d{2}-\d{2}/g) || []).slice(0, 2));
    /* O SELO CONTINUA NA PÁGINA — e é a única parte do histórico que fica à vista: ele diz que
     * ESTA versão nasceu de um ajuste, que é presente, e não a cadeia de elos. */
    const html = pagina();
    provar('o selo «ajustada em» continua na listagem, em BR',
      /ajustada em 01\/11\/2026/.test(html),
      (html.match(/ajustada em [^<]*/g) || []).slice(0, 2));
  }

  // ==========================================================================================
  console.log('\nD. O MOTIVO — aparece quando existe, cala-se quando não');

  {
    const comMotivo = texto(peca(cadeiaDeSalas()));
    provar('o motivo declarado é mostrado', /motivo: «a sala mudou para o período da noite»/.test(comMotivo), comMotivo);

    // Sem motivo no elo, o bloco NÃO escreve razão nenhuma.
    const semMotivo = peca([
      sala({ substituidaPor: 's2', substituidaEm: '2026-11-01' }),
      sala({ id: 's2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01', duracaoMin: 75 }),
    ]);
    const t = texto(semMotivo);
    provar('sem motivo declarado, o bloco não escreve «motivo:»', !/motivo:/.test(t), t);
    provar('…e continua a mostrar a mudança', /60 min → 75 min/.test(t), t);

    /* O MOTIVO NÃO SE HERDA. A derivação faz `Object.assign({}, anterior, …)`: sem o `delete`,
     * a razão do primeiro ajuste viajaria para todos os elos seguintes. Aqui a cadeia tem o
     * motivo no elo do MEIO, e o último (que não declarou nada) não pode exibi-lo. */
    const herdado = peca([
      sala({ substituidaPor: 's2', substituidaEm: '2026-03-15' }),
      sala({
        id: 's2', substitui: 'bale-nivel-1', substituidaPor: 's3', substituidaEm: '2026-11-01',
        duracaoMin: 75, motivoDoAjuste: 'razão do ajuste do meio',
      }),
      sala({ id: 's3', substitui: 's2', vigenteDe: '2026-11-01', duracaoMin: 90 }),
    ]);
    const th = texto(herdado);
    provar('o motivo aparece uma vez em toda a cadeia', (th.match(/motivo:/g) || []).length === 1, th);
    /* A linha do elo MAIS RECENTE é a primeira (`até 01/11/2026 75 → 90`): ela foi substituída
     * por um ajuste que não declarou razão, e por isso não pode exibir a do ajuste do meio. A
     * razão pertence à linha do elo que ela substituiu — a segunda. */
    const linhas = th.split('até ').slice(1);
    provar('o elo mais recente não exibe o motivo de outro ajuste',
      linhas.length === 2 && !/motivo:/.test(linhas[0]), linhas);
    provar('…e o motivo fica na linha do ajuste que o declarou',
      linhas.length === 2 && /motivo: «razão do ajuste do meio»/.test(linhas[1]), linhas);
  }

  // ==========================================================================================
  console.log('\nE. AS ROTAS — o motivo é gravado no elo, normalizado, e não se propaga');

  {
    const env = (estado) => ({
      ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim',
      SENHA_ADMIN: SENHA, SENHA_PROFESSOR: 'outra',
      PROFESSOR_NOME: 'Petorto', PROFESSOR_SLUG: 'pe-torto',
      GITHUB_TOKEN: 'token-de-prova',
      PADD_KV: kvDeMentira(estado.kv || {}),
    });
    const pedir = async (ambiente, caminho, corpo) => {
      const init = corpo === undefined ? { method: 'GET' } : {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo),
      };
      const resposta = await bastidores.fetch(
        new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho, init), ambiente, {});
      const txt = await resposta.text();
      let json = null;
      try { json = JSON.parse(txt); } catch (erro) { json = null; }
      return { status: resposta.status, json };
    };
    const salasGravadas = (ambiente) =>
      JSON.parse(ambiente.PADD_KV._dados.get('bastidores/' + ESCOLA + '/turmas'));

    const ambiente = env({
      kv: {
        ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([sala()]),
        ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([]),
      },
    });

    const r1 = await pedir(ambiente, '/api/bastidores/turma-derivar', {
      derivarDe: 'bale-nivel-1', vigencia: '2026-11-01', senhaDirecao: SENHA,
      duracaoMin: 75, dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
      motivo: '  a sala mudou   para o período da noite  ',
    });
    provar('a derivação da Sala é aceite (201)', r1.status === 201, r1.json);
    const lista1 = salasGravadas(ambiente);
    const novo = lista1.find((t) => t.id === r1.json.id);
    provar('o motivo fica no elo novo, com os espaços normalizados',
      novo && novo.motivoDoAjuste === 'a sala mudou para o período da noite',
      novo && novo.motivoDoAjuste);
    const velho = lista1.find((t) => t.id === 'bale-nivel-1');
    provar('…e o elo antigo NÃO ganha motivo (o passado não se reescreve)',
      velho && velho.motivoDoAjuste === undefined, velho && velho.motivoDoAjuste);

    // A SEGUNDA derivação, sem motivo: o elo novo não pode herdar o do anterior.
    const r2 = await pedir(ambiente, '/api/bastidores/turma-derivar', {
      derivarDe: novo.id, vigencia: '2026-10-20', senhaDirecao: SENHA,
      duracaoMin: 90, dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
    });
    provar('a segunda derivação é aceite', r2.status === 201, r2.json);
    const lista2 = salasGravadas(ambiente);
    const segundo = lista2.find((t) => t.id === r2.json.id);
    provar('sem motivo no corpo, o elo novo fica SEM motivo — a razão do anterior não é herdada',
      segundo && segundo.motivoDoAjuste === undefined, segundo && segundo.motivoDoAjuste);

    /* DEPOIS DA PÁGINA SERVIR, A PEÇA DIZ O MESMO — e a listagem não diz nada. O `bloco` que se
     * mede aqui é o da peça, não o do ecrã: o ecrã deixou de o ter a 18/11/2026, e é isso que a
     * secção F prova. */
    const tDepois = texto(peca(lista2));
    provar('a peça mostra dois ajustes, com o motivo uma vez',
      /2 ajustes anteriores/.test(tDepois) && (tDepois.match(/motivo:/g) || []).length === 1, tDepois);
    provar('…e a mudança do segundo ajuste é a duração: «75 min → 90 min»',
      /75 min → 90 min/.test(tDepois), tDepois);

    /* E A LISTAGEM SERVIDA COM ESSA MESMA CADEIA NÃO EMITE O BLOCO. É a decisão de 18/11/2026,
     * e ela mede-se onde se vê: na página. */
    const htmlDepois = bastidores.paginaProducao(ESCOLA,
      { professor: 'pe-torto', ciclo: '01', query: '' },
      [{ nome: 'Petorto', slug: 'pe-torto' }], ['Ana'], 'Petorto', 'pe-torto',
      lista2, [], {}, [], [], []);
    provar('…e a listagem das Salas, com dois ajustes na cadeia, não mostra bloco nenhum',
      htmlDepois.indexOf('<details class="historico">') === -1,
      (htmlDepois.match(/<details class="historico">/g) || []).length);
  }

  // ==========================================================================================
  console.log('\nF. O BLOCO NÃO APARECE NA TELA (18/11/2026) — e a peça continua a existir');

  {
    /* O QUE ELA DISSE: «Esse é um item de auditoria […] Ele não tem que aparecer aqui na tela.
     * Pode tirar. […] Imagina, isso aqui vai ficar gigantesco se colocar esse histórico toda vez.
     * […] por enquanto, ele existe internamente, mas ele não aparece aqui na listagem.»
     *
     * São duas coisas, e as duas se medem: (i) NÃO APARECE — nem na lista das Salas, nem na das
     * Turmas, com uma cadeia de três versões em cada; e (ii) EXISTE INTERNAMENTE — a peça é
     * exportada e devolve o bloco certo, que é o que a secção A a D acabou de medir. */
    const curadorias = [{
      id: 'c-velha', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
      turmas: [NOME_DA_SALA], alunas: ['Ana'], repertorio: [],
      substituidaPor: 'c-nova', substituidaEm: '2026-11-01',
    }, {
      id: 'c-nova', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
      turmas: [NOME_DA_SALA], alunas: ['Ana'], repertorio: [],
      vigenteDe: '2026-11-01', substitui: 'c-velha', motivoDoAjuste: 'a turma mudou de horário',
    }];
    const html = pagina({ curadorias });
    provar('a listagem das Salas não emite o bloco, mesmo com uma cadeia de três versões',
      html.indexOf('<details class="historico">') === -1,
      (html.match(/<details class="historico">/g) || []).length);
    provar('…e a das Turmas também não, com uma curadoria derivada',
      html.indexOf('<details class="historico">') === -1, null);
    provar('…e a palavra «ajustes anteriores» não aparece em lado nenhum da página',
      !/ajustes? anteriores/.test(html),
      (html.match(/[^>]{0,30}ajustes? anteriores/g) || []).slice(0, 2));

    /* O QUE FICA VISÍVEL É O PRESENTE: que esta versão nasceu de um ajuste, e quando. */
    provar('o selo «ajustada em» fica — ele diz o presente, não a cadeia',
      /ajustada em 01\/11\/2026/.test(html), null);

    /* E A PEÇA CONTINUA A EXISTIR, exportada — se um dia o item de auditoria for desenhado, ele
     * encontra isto a funcionar em vez de um cadáver. */
    provar('a peça do histórico continua exportada, para o item de auditoria que ela vai desenhar',
      typeof bastidores.historicoDoAjuste === 'function'
        && typeof bastidores.diferencaDeRitmo === 'function',
      { historicoDoAjuste: typeof bastidores.historicoDoAjuste,
        diferencaDeRitmo: typeof bastidores.diferencaDeRitmo });
    provar('…e ela ainda sabe escrever o bloco, com a cadeia que a derivação produz',
      /2 ajustes anteriores/.test(texto(peca(cadeiaDeSalas()))),
      texto(peca(cadeiaDeSalas())).slice(0, 120));
  }

  globalThis.fetch = fetchOriginal;

  console.log('\nprovar-historico-do-ajuste: ' + (provas - falhas) + ' de ' + provas + ' passaram\n');
  process.exitCode = falhas === 0 ? 0 : 1;
})().catch((erro) => { console.error(erro); process.exit(1); });
