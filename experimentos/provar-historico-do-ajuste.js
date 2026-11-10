#!/usr/bin/env node
'use strict';

/*
 * provar-historico-do-ajuste.js — o bloco «ajustes anteriores» diz o QUE mudou, QUANDO e PORQUÊ
 * (10/11/2026).
 *
 * O QUE ESTA PROVA FIXA, e porquê. O bloco existia desde 16/10/2026 e dizia o ritmo de cada
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
 *   A. O RÓTULO em português corrente, singular e plural — e nenhum `(ões)`/`(es)` na página.
 *   B. A DIFERENÇA calculada (Salas): a hora agrupada por transição, a duração, o período — e
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

/** O miolo do `<details class="historico">`, ou `''` quando não há bloco. */
function bloco(html) {
  const i = html.indexOf('<details class="historico">');
  if (i === -1) return '';
  const j = html.indexOf('</details>', i);
  return j === -1 ? html.slice(i) : html.slice(i, j + 10);
}

function todosOsBlocos(html) {
  const saida = [];
  let i = 0;
  for (;;) {
    const a = html.indexOf('<details class="historico">', i);
    if (a === -1) break;
    const b = html.indexOf('</details>', a);
    saida.push(html.slice(a, b === -1 ? undefined : b + 10));
    i = b === -1 ? html.length : b + 10;
  }
  return saida;
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
    const comTres = pagina();
    const blocoTres = bloco(comTres);
    provar('três versões na cadeia dão dois ajustes anteriores',
      /2 ajustes anteriores/.test(texto(blocoTres)), texto(blocoTres));
    provar('…e NENHUM «(ões)» na página inteira', !/\(ões\)|\(es\)/.test(comTres),
      (comTres.match(/[^ ]*\(ões\)[^ ]*/g) || []).slice(0, 3));

    const comUma = pagina({
      salas: [
        sala({ substituidaPor: 'so-uma', substituidaEm: '2026-03-15' }),
        sala({ id: 'so-uma', substitui: 'bale-nivel-1', vigenteDe: '2026-03-15' }),
      ],
    });
    provar('uma versão anterior diz «1 ajuste anterior», sem o plural',
      /1 ajuste anterior/.test(texto(bloco(comUma))), texto(bloco(comUma)));
    provar('…e não escreve «ajustes»', !/1 ajustes/.test(texto(bloco(comUma))));

    const semElo = pagina({ salas: [sala()] });
    provar('sem versão anterior não há bloco nenhum', bloco(semElo) === '', bloco(semElo));
  }

  // ==========================================================================================
  console.log('\nB. A DIFERENÇA — o que mudou, e não duas fotografias');

  {
    const t = texto(bloco(pagina()));
    provar('a hora agrupada por transição: «ter, qui: 18:00 → 19:00»',
      /ter, qui: 18:00 → 19:00/.test(t), t);
    provar('…e não repetida por dia (a versão anterior dizia duas vezes)',
      !/ter 18:00 → 19:00/.test(t), t);
    provar('a duração aparece como mudança: «60 min → 75 min»', /60 min → 75 min/.test(t), t);
    provar('o motivo vem na linha do ajuste que o declarou',
      /motivo: «a sala mudou para o período da noite»/.test(t), t);
    provar('cada linha começa pelo fim da validade da versão', /até 01\/11\/2026/.test(t), t);

    // Uma derivação sem alteração nenhuma não pode inventar uma diferença.
    const igual = sala({
      id: 's-igual-2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01',
    });
    const semMudanca = pagina({ salas: [sala({ substituidaPor: 's-igual-2', substituidaEm: '2026-11-01' }), igual] });
    provar('derivar sem mudar nada diz «(sem alteração)», e não finge uma diferença',
      /\(sem alteração\)/.test(texto(bloco(semMudanca))), texto(bloco(semMudanca)));

    // A entrada e a saída de um dia são ditas como tal, e não como mudança de hora.
    const mudouDia = sala({
      id: 's-dia-2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01',
      dias: ['ter', 'sex'], horarios: { ter: '18:00', sex: '18:00' },
    });
    const trocaDeDia = pagina({
      salas: [sala({ substituidaPor: 's-dia-2', substituidaEm: '2026-11-01' }), mudouDia],
    });
    const td = texto(bloco(trocaDeDia));
    provar('um dia que entrou é «entrou sex 18:00»', /entrou sex 18:00/.test(td), td);
    provar('…e um que saiu é «saiu qui 18:00»', /saiu qui 18:00/.test(td), td);

    // O período também é um eixo do ritmo.
    const periodo = sala({
      id: 's-per-2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01', periodoFim: '2026-12-15',
    });
    const comPeriodo = pagina({
      salas: [sala({ substituidaPor: 's-per-2', substituidaEm: '2026-11-01' }), periodo],
    });
    provar('o fim do período aparece como mudança: «fim 31/12/2026 → 15/12/2026»',
      /fim 31\/12\/2026 → 15\/12\/2026/.test(texto(bloco(comPeriodo))), texto(bloco(comPeriodo)));
  }

  // ==========================================================================================
  console.log('\nC. A DATA — em BR, nas duas listas e no selo');

  {
    const html = pagina({
      curadorias: [{
        id: 'c-velha', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
        turmas: [NOME_DA_SALA], alunas: ['Ana'], repertorio: [],
        substituidaPor: 'c-nova', substituidaEm: '2026-11-01',
      }, {
        id: 'c-nova', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
        turmas: [NOME_DA_SALA], alunas: ['Ana'], repertorio: [],
        vigenteDe: '2026-11-01', substitui: 'c-velha',
      }],
    });
    const blocos = todosOsBlocos(html);
    provar('a página tem os dois blocos (Salas e Turmas)', blocos.length === 2, blocos.length);
    provar('a data sai em BR no bloco das Salas', /até 01\/11\/2026/.test(texto(blocos[0])), texto(blocos[0]));
    provar('…e também no bloco das Turmas', /até 01\/11\/2026/.test(texto(blocos[1])), texto(blocos[1]));
    provar('…e nenhuma data ISO crua em nenhum dos dois',
      !/\d{4}-\d{2}-\d{2}/.test(texto(blocos[0]) + ' ' + texto(blocos[1])),
      [texto(blocos[0]), texto(blocos[1])]);
    provar('o selo «ajustada em» também está em BR', /ajustada em 01\/11\/2026/.test(html),
      (html.match(/ajustada em [^<]*/g) || []).slice(0, 2));
  }

  // ==========================================================================================
  console.log('\nD. O MOTIVO — aparece quando existe, cala-se quando não');

  {
    const comMotivo = texto(bloco(pagina()));
    provar('o motivo declarado é mostrado', /motivo: «a sala mudou para o período da noite»/.test(comMotivo), comMotivo);

    // Sem motivo no elo, o bloco NÃO escreve razão nenhuma.
    const semMotivo = pagina({
      salas: [
        sala({ substituidaPor: 's2', substituidaEm: '2026-11-01' }),
        sala({ id: 's2', substitui: 'bale-nivel-1', vigenteDe: '2026-11-01', duracaoMin: 75 }),
      ],
    });
    const t = texto(bloco(semMotivo));
    provar('sem motivo declarado, o bloco não escreve «motivo:»', !/motivo:/.test(t), t);
    provar('…e continua a mostrar a mudança', /60 min → 75 min/.test(t), t);

    /* O MOTIVO NÃO SE HERDA. A derivação faz `Object.assign({}, anterior, …)`: sem o `delete`,
     * a razão do primeiro ajuste viajaria para todos os elos seguintes. Aqui a cadeia tem o
     * motivo no elo do MEIO, e o último (que não declarou nada) não pode exibi-lo. */
    const herdado = pagina({
      salas: [
        sala({ substituidaPor: 's2', substituidaEm: '2026-03-15' }),
        sala({
          id: 's2', substitui: 'bale-nivel-1', substituidaPor: 's3', substituidaEm: '2026-11-01',
          duracaoMin: 75, motivoDoAjuste: 'razão do ajuste do meio',
        }),
        sala({
          id: 's3', substitui: 's2', vigenteDe: '2026-11-01', duracaoMin: 90,
        }),
      ],
    });
    const blocos = todosOsBlocos(herdado);
    const th = texto(blocos[0]);
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
      derivarDe: novo.id, vigencia: '2026-12-01', senhaDirecao: SENHA,
      duracaoMin: 90, dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31',
    });
    provar('a segunda derivação é aceite', r2.status === 201, r2.json);
    const lista2 = salasGravadas(ambiente);
    const segundo = lista2.find((t) => t.id === r2.json.id);
    provar('sem motivo no corpo, o elo novo fica SEM motivo — a razão do anterior não é herdada',
      segundo && segundo.motivoDoAjuste === undefined, segundo && segundo.motivoDoAjuste);

    // E a página servida depois disso mostra a mudança, com o motivo só onde ele existe.
    const htmlDepois = bastidores.paginaProducao(ESCOLA,
      { professor: 'pe-torto', ciclo: '01', query: '' },
      [{ nome: 'Petorto', slug: 'pe-torto' }], ['Ana'], 'Petorto', 'pe-torto',
      lista2, [], {}, [], [], []);
    const blocosDepois = todosOsBlocos(htmlDepois);
    const tDepois = texto(blocosDepois[0]);
    provar('a página mostra dois ajustes, com o motivo uma vez',
      /2 ajustes anteriores/.test(tDepois) && (tDepois.match(/motivo:/g) || []).length === 1, tDepois);
    provar('…e a mudança do segundo ajuste é a duração: «75 min → 90 min»',
      /75 min → 90 min/.test(tDepois), tDepois);
  }

  // ==========================================================================================
  console.log('\nF. A TURMA (curadoria) — a diferença nomeia o professor, não o slug');

  {
    const curadorias = [{
      id: 'c-velha', professor: 'pe-torto', modalidade: 'Balé clássico', tradicao: 'RAD',
      turmas: [NOME_DA_SALA], alunas: ['Ana'], repertorio: [],
      substituidaPor: 'c-nova', substituidaEm: '2026-11-01',
    }, {
      id: 'c-nova', professor: 'marina', modalidade: 'Dança contemporânea', tradicao: 'Laban',
      turmas: ['Balé Nível 2'], alunas: ['Ana', 'Bia'], repertorio: [],
      vigenteDe: '2026-11-01', substitui: 'c-velha', motivoDoAjuste: 'a professora passou a assumir',
    }];
    const html = pagina({ curadorias });
    const blocos = todosOsBlocos(html);
    const t = texto(blocos[blocos.length - 1]);
    provar('o professor aparece pelo NOME: «professor Petorto → Marina Souza»',
      /professor Petorto → Marina Souza/.test(t), t);
    provar('…e o slug não aparece no histórico', !/pe-torto →|→ marina/.test(t), t);
    provar('a sala que mudou é «sala Balé Nível 1 → Balé Nível 2»',
      /sala Balé Nível 1 → Balé Nível 2/.test(t), t);
    provar('a modalidade e a tradição também são ditas',
      /modalidade Balé clássico → Dança contemporânea/.test(t) && /tradição RAD → Laban/.test(t), t);
    provar('o elenco/alunas entram quando mudam: «1 aluna → 2»', /1 aluna → 2/.test(t), t);
    provar('…e o motivo fecha a linha', /motivo: «a professora passou a assumir»/.test(t), t);
    provar('o rótulo é o mesmo da outra lista: «1 ajuste anterior»',
      /1 ajuste anterior/.test(t), t);
  }

  globalThis.fetch = fetchOriginal;

  console.log('\nprovar-historico-do-ajuste: ' + (provas - falhas) + ' de ' + provas + ' passaram\n');
  process.exitCode = falhas === 0 ? 0 : 1;
})().catch((erro) => { console.error(erro); process.exit(1); });
