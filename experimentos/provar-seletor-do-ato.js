#!/usr/bin/env node
'use strict';

/**
 * provar-seletor-do-ato.js — o professor desligado não se oferece para um ATO (15/11/2026).
 *
 * O QUE ELA VIU. Na `breu`, o `prova-do-shard` está desligado desde 08/11/2026. Na anamnese, ele
 * continuava a ser a segunda opção do seletor do professor: escolhia-se, escrevia-se a senha dele,
 * e o ato abria. Como o seletor é o MESMO nas três fontes (anamnese, plano de ensino e PO), o
 * defeito não era da anamnese — era do seletor.
 *
 * A DISTINÇÃO QUE ESTA PROVA TRAVA, e é ela que a correção não pode perder:
 *
 *   · a LISTA DA ESCOLA (a Produção) guarda o desligado, com o selo e a data, porque o registo é
 *     proveniência e o nome dele está nos documentos que assinou;
 *   · o SELETOR DO ATO (`/api/bastidores/professores`) não o oferece, porque o desligamento
 *     encerrou a direção pedagógica dele e retomá-la é contratá-lo outra vez.
 *
 * As duas coisas vivem na mesma folha, a três listas de distância — a das habilitações, a do
 * desligamento e a da curadoria já saltavam o desligado desde 08/11/2026 («Quem saiu da escola
 * não se oferece»). Faltava a quarta: a que alimenta os formulários.
 *
 * O CONTROLO NEGATIVO É O MESMO REGISTO, UM CAMPO APARTADO. O registo é oferecido enquanto não
 * tiver `desligado_em`; com o campo, desaparece. Não são dois registos nem duas escolas: é o mesmo
 * array de professores, lido duas vezes.
 *
 *   uso: node experimentos/provar-seletor-do-ato.js
 *        node experimentos/provar-seletor-do-ato.js --controle-negativo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

/* CONTROLE NEGATIVO: o `motor/` de `HEAD`, com as MESMAS asserções. Se a bancada passasse também
 * ali, ela não estaria a medir a correção — estaria a medir-se a si mesma. Em `HEAD` reprovam A e
 * C inteiras (o seletor oferecia o desligado, a senha dele valia, o bilhete era emitido) e a
 * segunda asserção de D. Passam nos dois lados as que não estavam em causa: o dono, e as duas
 * metades da lista da escola. */
let RAIZ_DO_MOTOR = RAIZ;
if (NEGATIVO) {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'seletor-do-ato-'));
  execSync('git archive HEAD motor biblioteca tools teste modelo porta | tar -x -C ' + destino,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = destino;
  console.log('CONTROLE NEGATIVO — o motor de HEAD (antes de o desligado deixar de se oferecer)\n');
}

const bastidores = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/bastidores.js'));

const BASE = 'https://breu.tmenegaz77.workers.dev';
const ESCOLA = 'breu';

let falhas = 0;
let total = 0;
const conferir = (nome, ok, detalhe) => {
  total += 1;
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

/** Um KV de mentira, com o contrato que os Bastidores usam. */
function criarKv(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

const DONO = { nome: 'Redinha Rosa', slug: 'redinha-rosa' };
const ATIVO = { nome: 'Rimel Preto', slug: 'rimel-preto', senha: 'senha-do-ativo' };
const SAIDO = {
  nome: 'Prova Do Shard', slug: 'prova-do-shard', senha: 'senha-do-saido',
  desligado_em: '2026-11-08T10:00:00.000Z',
  desligado_motivo: 'bateria de bancada do shard',
  desligado_por: 'Direção',
};

function ambiente(professores) {
  const kv = criarKv({
    ['bastidores/' + ESCOLA + '/professores']: JSON.stringify(professores),
    ['bastidores/' + ESCOLA + '/curadorias']: JSON.stringify([]),
    ['bastidores/' + ESCOLA + '/turmas']: JSON.stringify([]),
  });
  return {
    kv,
    env: {
      ESCOLA_SLUG: ESCOLA,
      ESCOLA_HABILITADA: 'sim',
      SENHA_ADMIN: 's',
      PROFESSOR_NOME: DONO.nome,
      PROFESSOR_SLUG: DONO.slug,
      SENHA_PROFESSOR: 'senha-do-dono',
      PADD_KV: kv,
    },
  };
}

const pedir = async (env, caminho, opcoes) =>
  bastidores.fetch(new Request(BASE + caminho, opcoes || {}), env);

const postar = (env, caminho, corpo) => pedir(env, caminho, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(corpo),
});

(async () => {
  // --- A. O SELETOR DO ATO ----------------------------------------------
  console.log('A. O seletor dos formulários');

  {
    const { env, kv } = ambiente([ATIVO, SAIDO]);
    const r = await (await pedir(env, '/api/bastidores/professores')).json();
    const slugs = (r.professores || []).map((p) => p.slug);
    conferir('o dono vem primeiro, e é o primeiro da lista', slugs[0], DONO.slug);
    conferir('o professor que está na escola continua a ser oferecido',
      slugs.indexOf('rimel-preto') !== -1, slugs);
    conferir('o professor DESLIGADO já não é oferecido', slugs.indexOf('prova-do-shard') === -1, slugs);

    // O CONTROLO NEGATIVO — o mesmo registo, sem o campo que o desliga.
    const semACampo = Object.assign({}, SAIDO);
    delete semACampo.desligado_em;
    const kv2 = criarKv({
      ['bastidores/' + ESCOLA + '/professores']: JSON.stringify([ATIVO, semACampo]),
    });
    const semCampo = await (await pedir(Object.assign({}, env, { PADD_KV: kv2 }),
      '/api/bastidores/professores')).json();
    conferir('CONTROLO NEGATIVO: sem `desligado_em`, o mesmo registo É oferecido',
      (semCampo.professores || []).some((p) => p.slug === 'prova-do-shard'),
      (semCampo.professores || []).map((p) => p.slug));
    void kv;
  }

  // --- B. A LISTA DA ESCOLA GUARDA-O, MARCADO ---------------------------
  console.log('\nB. A lista da escola (a Produção)');

  {
    const { env } = ambiente([ATIVO, SAIDO]);
    const html = await (await pedir(env, '/bastidores/estudio')).text();
    /* A página é HTML inteiro; o que se procura é o nome dele e o selo `desligado` na MESMA
     * página. A data também: sem ela, «desligado» não diz desde quando, e é a data que a direção
     * de amanhã vai querer. */
    conferir('o nome do desligado continua na página da escola', /Prova Do Shard/.test(html), null);
    conferir('…com o selo `desligado`', /desligado/.test(html), null);
    conferir('…e com a data do desligamento', /2026-11-08/.test(html), null);
  }

  // --- C. O SERVIDOR RECUSA — E NÃO SÓ O `<select>` ---------------------
  console.log('\nC. A guarda do servidor (a senha dele está CERTA)');

  {
    const { env, kv } = ambiente([ATIVO, SAIDO]);

    const doSaido = await (await postar(env, '/api/bastidores/validar-senha',
      { professor: 'prova-do-shard', senha: 'senha-do-saido' })).json();
    conferir('a senha do desligado é RECUSADA', doSaido.ok === false, doSaido);
    conferir('…e a recusa diz que o motivo é o desligamento, não a senha',
      doSaido.desligado === true, doSaido);
    conferir('…com a data em que ele saiu', /2026-11-08/.test(String(doSaido.erro)), doSaido.erro);
    conferir('…e o caminho de volta (cadastrar outra vez reactiva)',
      /cadastrar outra vez/.test(String(doSaido.erro)), doSaido.erro);

    const doAtivo = await (await postar(env, '/api/bastidores/validar-senha',
      { professor: 'rimel-preto', senha: 'senha-do-ativo' })).json();
    conferir('a senha do professor que está na escola continua a valer', doAtivo.ok === true, doAtivo);

    const senhaErrada = await (await postar(env, '/api/bastidores/validar-senha',
      { professor: 'rimel-preto', senha: 'outra-coisa' })).json();
    conferir('senha errada de um professor activo continua a ser «não reconhecida»',
      senhaErrada.ok === false && senhaErrada.desligado === undefined, senhaErrada);

    /* O BILHETE é o que autoriza o ato na porta. Sem ele, não há segundo caminho: o servidor não
     * emite bilhete para quem saiu, e o KV não ganha a chave. */
    const bilheteDoSaido = await (await postar(env, '/api/bastidores/ato',
      { professor: 'prova-do-shard', senha: 'senha-do-saido', fonte: 'anamnese' })).json();
    conferir('o bilhete do ato é RECUSADO ao desligado',
      bilheteDoSaido.ok === false && bilheteDoSaido.desligado === true, bilheteDoSaido);
    const chaves = [...kv.dados.keys()].filter((k) => /\/ato\//.test(k));
    conferir('…e nenhum bilhete foi escrito no cofre da escola', chaves.length === 0, chaves);

    const bilheteDoAtivo = await (await postar(env, '/api/bastidores/ato',
      { professor: 'rimel-preto', senha: 'senha-do-ativo', fonte: 'anamnese', ciclo: '01' })).json();
    conferir('o bilhete continua a ser emitido para quem está na escola',
      bilheteDoAtivo.ok === true && typeof bilheteDoAtivo.ato === 'string', bilheteDoAtivo);
  }

  // --- D. AS BORDAS QUE O `continue` PODE PARTIR -----------------------
  console.log('\nD. As bordas');

  {
    /* O DONO NUNCA SAI — e por isso o `continue` não pode ser a linha que o cala. Ele entra na
     * lista ANTES do laço, portanto um registo dele no KV marcado como desligado (acidente de
     * dados: `desligarProfessor` recusa o dono pelo nome) não o remove do seletor. É a âncora
     * jurídica e operacional da escola, e a recusa é do servidor. */
    const donoDesligado = Object.assign({}, DONO, {
      desligado_em: '2026-11-01T00:00:00.000Z', desligado_motivo: 'acidente de dados',
    });
    const { env } = ambiente([donoDesligado, SAIDO]);
    const r = await (await pedir(env, '/api/bastidores/professores')).json();
    const slugs = (r.professores || []).map((p) => p.slug);
    conferir('o dono continua a ser oferecido mesmo com um registo desligado no KV',
      slugs.indexOf(DONO.slug) !== -1, slugs);
    conferir('…e é ele que sobra quando o único outro professor está desligado',
      r.professores.length === 1, r.professores);
  }

  const ok = total - falhas;
  console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + ok + '/' + total
    + ' asserção(ões)' + (falhas ? ', ' + falhas + ' falha(s)' : '') + '.');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('erro na prova: ' + (erro && erro.stack || erro));
  process.exit(2);
});
