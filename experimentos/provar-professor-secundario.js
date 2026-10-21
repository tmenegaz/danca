'use strict';

/*
 * provar-professor-secundario.js — a escola de um, a turma no plano de outro.
 *
 * É O CENÁRIO DE TESTE, medido de ponta a ponta, e não em pedaços. Uma escola é criada pelo
 * professor A (`tools/criar-escola.sh` escreve a base, a variante e os schemas na pasta DELE). A
 * turma entra na curadoria do professor B. B elicia o plano: nasce a pasta dele, com o `.conf` da
 * variante composto e as fontes. Depois, `hash-ciclo.sh` e `gerar-ciclo.sh` têm de atravessar —
 * e é aí que três defeitos desta semana apareceram, um de cada vez:
 *
 *   1. `manifesto base não encontrado` — o gerador e a âncora exigiam `ciclo-01.conf` na pasta de
 *      B, que nunca teve base (`provar-manifesto-sem-base.js`);
 *   2. `RESPONSAVEL=""`, sem faixa de volume — o `.conf` da ESCOLA era procurado só na pasta de B,
 *      e ele mora na de A;
 *   3. validação mais fraca, em silêncio — sem schemas na pasta de B, o validador do manifesto
 *      nem corria (`provar-schemas-do-professor.js`).
 *
 * Cada um tem a sua prova. O que faltava era a prova de que os três, JUNTOS, deixam o ciclo
 * atravessar — e é essa que existe aqui, com as ferramentas reais sobre um disco real.
 *
 * O repositório é uma fixture temporária (`professores/.prova-*`), apagada no `finally`: a prova
 * não depende de escola viva e sobrevive ao expurgo da próxima.
 *
 *   node experimentos/provar-professor-secundario.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const { criarEscritorDePlano } = require('../motor/servidor/escrever-plano.js');
const { SUFIXOS } = require('../motor/servidor/schemas-do-ciclo.js');

const CRIADOR = '.prova-criador';     // o professor A — criou a escola
const SECUNDARIO = '.prova-secundario'; // o professor B — a turma dele
const ESCOLA = 'prova-escola';
const TURMA = 't1';

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) console.log('  \u2713 ' + rotulo);
  else {
    falhas += 1;
    console.log('  \u2717 ' + rotulo);
    if (detalhe) console.log('      ' + String(detalhe).split('\n').join('\n      '));
  }
}

const dir = (prof) => path.join(RAIZ, 'professores', prof, 'ciclos');
const rel = (prof, nome) => 'professores/' + prof + '/ciclos/' + nome;

/**
 * Um Contents API de mentira sobre o DISCO de verdade. É isto que torna a prova de ponta a ponta:
 * o que o escritor grava fica em `professores/`, e as ferramentas de bash leem-no de lá como
 * leriam o repositório.
 */
function fetchNoDisco() {
  const escritas = [];
  const f = async (url, opcoes) => {
    const metodo = (opcoes && opcoes.method) || 'GET';
    const caminho = decodeURIComponent(url.split('/contents/')[1] || '');
    const absoluto = path.join(RAIZ, caminho);

    if (metodo === 'GET') {
      // A listagem de `professores` — o localizador do `.conf` da escola precisa dela.
      if (!path.extname(caminho) && fs.existsSync(absoluto) && fs.statSync(absoluto).isDirectory()) {
        const nomes = fs.readdirSync(absoluto, { withFileTypes: true })
          .map((e) => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' }));
        return { status: 200, json: async () => nomes };
      }
      if (!fs.existsSync(absoluto)) return { status: 404, json: async () => ({}) };
      return { status: 200, json: async () => ({ sha: 'sha-' + caminho, content: Buffer.from(fs.readFileSync(absoluto, 'utf8')).toString('base64') }) };
    }

    const corpo = JSON.parse(opcoes.body);
    fs.mkdirSync(path.dirname(absoluto), { recursive: true });
    fs.writeFileSync(absoluto, Buffer.from(corpo.content, 'base64').toString('utf8'));
    escritas.push(caminho);
    return { status: corpo.sha ? 200 : 201, json: async () => ({}) };
  };
  return { f, escritas };
}

/** A turma, como o cadastro da escola a devolve. */
const TURMAS = [{
  id: TURMA, nome: 'Turma de Prova',
  dias: ['seg', 'qua'], horarios: { seg: '19:00', qua: '19:00' },
  duracaoMin: 60, periodoInicio: '2026-11-02', periodoFim: '2026-11-27',
}];

const lerTurmas = async () => TURMAS;

const ENVELOPE = {
  contexto: { escola: ESCOLA, professor: SECUNDARIO, ciclo: '01', turma: TURMA },
  respostas: {
    'objetivo-geral': { valor: 'reconhecer o apoio e alinhar o eixo vertical' },
    'contexto-professor': { valor: 'Professora B' },
    'contexto-turma': { valor: TURMA },
  },
};

function rodar(script, args) {
  return spawnSync('bash', [script].concat(args), { cwd: RAIZ, encoding: 'utf8' });
}
const saida = (r) => ((r.stdout || '') + (r.stderr || '')).trim();

function montarCriador() {
  const d = dir(CRIADOR);
  fs.mkdirSync(d, { recursive: true });
  // O que `tools/criar-escola.sh` escreve na pasta de quem cria: a base, a variante da ESCOLA
  // (com a identidade e a faixa de volume) e os cinco schemas.
  fs.writeFileSync(path.join(d, 'ciclo-01.conf'),
    ['CICLO="01"', 'NOME="Ciclo 01 — Prova"', 'OBJETIVO_GERAL="[Preencher: objetivo geral]"',
     'PROFESSOR="Professor A"', 'TOTAL_AULAS="8"', 'VOLUME_MIN="80"', 'VOLUME_MAX="100"',
     'DOCS=""'].join('\n') + '\n');
  fs.writeFileSync(path.join(d, 'ciclo-01-' + ESCOLA + '.conf'),
    ['CICLO="01"', 'VARIANTE="' + ESCOLA + '"', 'ESCOLA="Prova"',
     'RESPONSAVEL="Professor A"', 'PROFESSOR="Professor A"', 'ESCOLA_HABILITADA="sim"',
     'FREQUENCIA="2x/semana"', 'DIAS="2@19:00"', 'DURACAO_POR_DIA="60 min por encontro"',
     'DURACOES="60"', 'DATA_INICIO="02/11/2026"', 'TOTAL_AULAS="8"',
     'NOME="Ciclo 01 — Prova"', 'OBJETIVO_GERAL="[Preencher: objetivo geral]"',
     'VOLUME_MIN="80"', 'VOLUME_MAX="100"', 'DOCS=""'].join('\n') + '\n');
  for (const s of SUFIXOS) {
    fs.copyFileSync(path.join(RAIZ, 'modelo', 'ciclos', 'ciclo-01-' + s + '.json'),
      path.join(d, 'ciclo-01-' + s + '.json'));
  }
}

function limpar() {
  for (const p of [CRIADOR, SECUNDARIO]) {
    fs.rmSync(path.join(RAIZ, 'professores', p), { recursive: true, force: true });
  }
}

async function prova() {
  limpar();
  montarCriador();

  // ═══ O ponto de partida ══════════════════════════════════════════════════
  console.log('\n0. O ponto de partida: B não tem pasta');
  checar('o professor B não tem pasta nenhuma antes do plano', !fs.existsSync(dir(SECUNDARIO)));
  const b0 = rodar('tools/hash-ciclo.sh', [SECUNDARIO, '01', ESCALA_OU(ESCOLA)]);
  checar('e sem pasta nada ancora (é o estado real de um professor novo)', b0.status !== 0,
    saida(b0));

  // ═══ B elicia o plano ═════════════════════════════════════════════════════
  console.log('\n1. B elicia o plano — o ato que cria a pasta dele');
  {
    const { f, escritas } = fetchNoDisco();
    const escritor = criarEscritorDePlano({
      token: 'x', dono: 'dono', repo: 'repo', ref: 'main',
      lerTurmas, fetchImpl: f,
    });
    const r = await escritor(ENVELOPE, 'feat(plano): eliciado');

    checar('a pasta de B nasce com os cinco schemas',
      r.schemas && r.schemas.criados.length === 5,
      JSON.stringify(r.schemas));
    checar('e com a fonte do plano', fs.existsSync(path.join(dir(SECUNDARIO), 'ciclo-01-' + ESCOLA + '-' + TURMA + '-plano.md')));
    checar('e com o manifesto da variante', r.docs && r.docs.ok === true, JSON.stringify(r.docs));
    checar('o professor A não perdeu nada', fs.existsSync(path.join(dir(CRIADOR), 'ciclo-01.conf')));
    checar('e a pasta de B continua SEM manifesto base (é o estado legítimo)',
      !fs.existsSync(path.join(dir(SECUNDARIO), 'ciclo-01.conf')));

    // ═══ 2. o manifesto composto: identidade de A, professor de B ═══════════
    console.log('\n2. O manifesto composto: a NORMA é da escola, o PROFESSOR é de quem dá a aula');
    const conf = fs.readFileSync(path.join(dir(SECUNDARIO), 'ciclo-01-' + ESCOLA + '-' + TURMA + '.conf'), 'utf8');
    const var_ = (k) => (new RegExp('^' + k + '="([^"]*)"', 'm').exec(conf) || [])[1];

    checar('o CICLO é declarado (a variante é um manifesto inteiro)', var_('CICLO') === '01', var_('CICLO'));
    checar('a identidade da ESCOLA chega (RESPONSAVEL, do professor A)', var_('RESPONSAVEL') === 'Professor A', var_('RESPONSAVEL'));
    checar('a faixa de volume da Regra 9 chega', var_('VOLUME_MIN') === '80' && var_('VOLUME_MAX') === '100',
      var_('VOLUME_MIN') + '–' + var_('VOLUME_MAX'));
    checar('o PROFESSOR é o do PLANO, não o responsável pela escola',
      var_('PROFESSOR') === 'Professora B', var_('PROFESSOR'));
    checar('o ritmo vem da TURMA', var_('FREQUENCIA') === '2x/semana' && var_('DURACOES') === '60',
      var_('FREQUENCIA') + ' / ' + var_('DURACOES'));

    // ═══ 3. as ferramentas atravessam ═══════════════════════════════════════
    console.log('\n3. As ferramentas reais atravessam sem a base');
    const alvo = ESCOLA + '-' + TURMA;
    const ancora = rodar('tools/hash-ciclo.sh', [SECUNDARIO, '01', alvo]);
    checar('hash-ciclo.sh ancora o ciclo de B', ancora.status === 0, saida(ancora));
    checar('sem se queixar do manifesto base', !/manifesto base não encontrado/.test(saida(ancora)), saida(ancora));
    checar('e SEM «PO não validado» (os schemas estão lá)',
      !/PO não validado/.test(saida(ancora)), saida(ancora));

    const confere = rodar('tools/hash-ciclo.sh', [SECUNDARIO, '01', alvo, '--check']);
    checar('e o --check fecha a âncora', confere.status === 0, saida(confere));

    // O gate que se procura é o de CONTEÚDO — «não há aula escrita ainda» —, e não um texto
    // exacto: `DOCS=""` e `DOCS="plano"` dão mensagens diferentes, e as duas são o estado
    // legítimo de um ciclo que tem plano e ainda não tem PO. O que a asserção mede é que o
    // gerador PASSOU o gate da base e chegou ao do conteúdo.
    const gerar = rodar('tools/gerar-ciclo.sh', [SECUNDARIO, '01', alvo]);
    const texto = saida(gerar);
    checar('gerar-ciclo.sh passa a base e chega ao gate do CONTEÚDO (plano sem PO)',
      /DOCS está vazio|nenhuma 'aula-\*' de DOCS tem fonte/.test(texto)
      && !/manifesto base não encontrado/.test(texto),
      texto);

    // ═══ 4. o professor A continua a gerar o dele ═══════════════════════════
    console.log('\n4. O professor A não foi afectado (a escola dele continua a andar)');
    const a = rodar('tools/hash-ciclo.sh', [CRIADOR, '01', ESCOLA]);
    checar('a âncora do professor A fecha', a.status === 0, saida(a));
    checar('e ele continua COM a base', fs.existsSync(path.join(dir(CRIADOR), 'ciclo-01.conf')));
  }
}

/** Um nome de variante para a asserção do passo 0 — a escola e a turma juntas. */
function ESCALA_OU(escola) { return escola + '-' + TURMA; }

prova().then(() => {
  limpar();
  console.log('\n' + (falhas ? falhas + ' de ' + n + ' asserções FALHARAM' : n + ' asserções, todas passaram'));
  process.exit(falhas ? 1 : 0);
}).catch((e) => {
  limpar();
  console.error(e);
  process.exit(1);
});
