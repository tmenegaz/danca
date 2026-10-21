'use strict';

/*
 * provar-manifesto-sem-base.js — o gerador e a âncora para um professor que NÃO criou a escola.
 *
 * O DEFEITO MEDIDO (22/10/2026, run `39652992659`). Uma turma da escola `calango` está na
 * curadoria da professora `murisoca-baiana`. O plano dela foi elicitado, o manifesto da variante
 * foi composto e gravado em `professores/murisoca-baiana/ciclos/` — e a partir daí DUAS coisas
 * quebraram, pela mesma razão:
 *
 *   · `Gerar o ciclo · murisoca-baiana/01/calango-bale-nivel-1-teste-1` morreu em
 *     «erro: manifesto base não encontrado: …/murisoca-baiana/ciclos/ciclo-01.conf»;
 *   · `Reancorar a cadeia` morreu no mesmo sítio, porque `tools/hash-ciclo.sh` tem a mesma guarda.
 *
 * A causa não é a professora: é o PAR (base, variante). O `ciclo-01.conf` nasce em
 * `tools/criar-escola.sh`, sob o professor que CRIA a escola, e é a única coisa que o gerador
 * exige e a única que aquele ato escreve. Quem nunca criou escola nunca tem base — e a base,
 * depois de `compor-conf.js`, não tem mais nada que a variante não declare.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   A. o manifesto da variante é um manifesto INTEIRO — declara o próprio `CICLO`, e sozinho
 *      satisfaz o schema do ciclo (é o que torna a base dispensável, em vez de só tolerada);
 *   B. `hash-ciclo.sh` e `gerar-ciclo.sh` atravessam o cenário: professor com variante e sem base;
 *   C. o controle negativo: os MESMOS scripts, na versão anterior à correção, morrem no cenário —
 *      a prova mede a correção, e não o estado do repositório.
 *
 * A fixture é sintética e temporária (`professores/<slug-de-prova>/`, apagada no `finally`): a
 * prova não depende de nenhuma escola viva, e sobrevive ao expurgo da próxima.
 *
 *   node experimentos/provar-manifesto-sem-base.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const PROF = 'prova-sem-base';
const CICLO = '01';
const VARIANTE = 'prova';
const DIR = path.join(RAIZ, 'professores', PROF, 'ciclos');

// A versão dos scripts ANTERIOR à correção — o controle negativo. Fixa de propósito: `HEAD`
// passaria a conter a correção e o controle mediria o que já foi consertado.
const SHA_ANTES = '499a97b';

const { comporConf, variaveisDoConf } = require('../motor/servidor/compor-conf.js');

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

function rodar(script, args) {
  const r = spawnSync('bash', [script].concat(args), { cwd: RAIZ, encoding: 'utf8' });
  return { status: r.status, saida: (r.stdout || '') + (r.stderr || '') };
}

// ── A fixture: uma turma de verdade, sem base ────────────────────────────────
const TURMA = {
  id: 'prova',
  nome: 'Turma de prova',
  dias: ['seg', 'qua'],
  horarios: { seg: '19:00', qua: '19:00' },
  duracaoMin: 60,
  periodoInicio: '2026-11-02',
  periodoFim: '2026-11-27',
};
const IDENTIDADE = {
  ESCOLA: 'Prova',
  RESPONSAVEL: 'Professora de Prova',
  PROFESSOR: 'Professora de Prova',
  ESCOLA_HABILITADA: 'sim',
  VOLUME_MIN: '80',
  VOLUME_MAX: '100',
};
const PLANO = {
  respostas: {
    'objetivo-geral': 'reconhecer o apoio e alinhar o eixo vertical',
    'contexto-professor': 'Professora de Prova',
  },
};

function escreverFixture(mudo) {
  fs.mkdirSync(DIR, { recursive: true });
  let texto = comporConf({
    turma: TURMA,
    plano: PLANO,
    identidade: IDENTIDADE,
    escola: 'prova',
    ciclo: CICLO,
    docs: 'plano',
  }).texto;
  if (mudo) texto = texto.replace(/^CICLO=.*$/m, '');   // o controle negativo da Parte A
  fs.writeFileSync(path.join(DIR, 'ciclo-01-prova.conf'), texto);
  fs.writeFileSync(path.join(DIR, 'ciclo-01-prova-plano.md'),
    '---\ntitle: "Plano de prova"\n---\n\n# Plano de prova\n\nUm parágrafo.\n');
  // O schema é o do ciclo, copiado do molde — a fixture não inventa schema.
  const molde = path.join(RAIZ, 'modelo', '01');
  const origem = fs.existsSync(molde)
    ? path.join(molde, 'ciclo-01-schema.json')
    : path.join(RAIZ, 'professores', 'tiago-menegaz', 'ciclos', 'ciclo-01-schema.json');
  if (fs.existsSync(origem)) fs.copyFileSync(origem, path.join(DIR, 'ciclo-01-schema.json'));
}

function limpar() {
  fs.rmSync(path.join(RAIZ, 'professores', PROF), { recursive: true, force: true });
}

async function prova() {
try {
  // ═══ A. a variante é o manifesto inteiro ═══════════════════════════════════
  console.log('\nA. O manifesto da variante basta sozinho');
  {
    limpar();
    escreverFixture(false);
    const conf = path.join(DIR, 'ciclo-01-prova.conf');
    const vars = variaveisDoConf(fs.readFileSync(conf, 'utf8'));

    checar('a variante composta declara o próprio CICLO', vars.CICLO === CICLO,
      'CICLO lido: ' + JSON.stringify(vars.CICLO));

    const semBase = spawnSync('node', ['tools/validar-schema-ciclo.js',
      'professores/' + PROF + '/ciclos/ciclo-01-schema.json',
      'professores/' + PROF + '/ciclos/ciclo-01-prova.conf'], { cwd: RAIZ, encoding: 'utf8' });
    checar('sozinha, ela satisfaz o schema do ciclo (sem a base)',
      semBase.status === 0, (semBase.stdout || '') + (semBase.stderr || ''));

    // Controle negativo: sem o CICLO que a base dava, o mesmo schema REPROVA. Sem isto, a
    // asserção acima passaria a valer nada no dia em que CICLO deixasse de ser obrigatório.
    const guardado = fs.readFileSync(conf, 'utf8');
    fs.writeFileSync(conf, guardado.replace(/^CICLO=.*$/m, ''));
    const semCiclo = spawnSync('node', ['tools/validar-schema-ciclo.js',
      'professores/' + PROF + '/ciclos/ciclo-01-schema.json',
      'professores/' + PROF + '/ciclos/ciclo-01-prova.conf'], { cwd: RAIZ, encoding: 'utf8' });
    fs.writeFileSync(conf, guardado);
    checar('controle negativo: sem o CICLO, o schema acusa CICLO', semCiclo.status !== 0,
      'o validador aceitou um .conf sem CICLO — a asserção anterior não mede nada');
  }

  // ═══ B. o gerador e a âncora atravessam o cenário ══════════════════════════
  console.log('\nB. Professor com variante e SEM base');
  {
    limpar();
    escreverFixture(false);
    const base = path.join(DIR, 'ciclo-01.conf');
    checar('a fixture é o cenário: existe variante, não existe base',
      !fs.existsSync(base) && fs.existsSync(path.join(DIR, 'ciclo-01-prova.conf')));

    const ancora = rodar('tools/hash-ciclo.sh', [PROF, CICLO, VARIANTE]);
    checar('hash-ciclo.sh ancora o ciclo sem a base', ancora.status === 0, ancora.saida);
    checar('o .fipp foi escrito', fs.existsSync(path.join(DIR, 'ciclo-01-prova.fipp')));
    checar('não se queixa do manifesto base', !/manifesto base não encontrado/.test(ancora.saida),
      ancora.saida);

    const confere = rodar('tools/hash-ciclo.sh', [PROF, CICLO, VARIANTE, '--check']);
    checar('hash-ciclo.sh --check fecha a âncora', confere.status === 0, confere.saida);

    // O gerador: DOCS vazio é o gate SEGUINTE ao da base. Chegar nele é a prova de que o da
    // base cedeu — e não se paga o preço de um PDF para o saber.
    fs.writeFileSync(path.join(DIR, 'ciclo-01-prova.conf'),
      fs.readFileSync(path.join(DIR, 'ciclo-01-prova.conf'), 'utf8').replace(/^DOCS=.*$/m, 'DOCS=""'));
    const gerar = rodar('tools/gerar-ciclo.sh', [PROF, CICLO, VARIANTE]);
    checar('gerar-ciclo.sh passa o gate da base e chega ao gate do DOCS',
      /DOCS está vazio/.test(gerar.saida) && !/manifesto base não encontrado/.test(gerar.saida),
      gerar.saida);
  }

  // ═══ C. o controle negativo: a versão anterior morre no cenário ═══════════
  console.log('\nC. Controle negativo — os scripts de ' + SHA_ANTES);
  {
    limpar();
    escreverFixture(false);
    const antigos = {};
    for (const nome of ['hash-ciclo.sh', 'gerar-ciclo.sh']) {
      let texto;
      try {
        texto = execFileSync('git', ['show', SHA_ANTES + ':tools/' + nome], { cwd: RAIZ, encoding: 'utf8' });
      } catch (erro) {
        texto = null;
      }
      if (!texto) { checar('git show ' + SHA_ANTES + ':tools/' + nome, false, 'não consegui ler a versão antiga'); continue; }
      const copia = path.join(RAIZ, 'tools', '.prova-antigo-' + nome);
      fs.writeFileSync(copia, texto);
      fs.chmodSync(copia, 0o755);
      antigos[nome] = copia;
    }

    if (antigos['hash-ciclo.sh']) {
      const r = rodar(antigos['hash-ciclo.sh'], [PROF, CICLO, VARIANTE]);
      checar('a versão anterior falha no cenário, e pelo motivo certo',
        r.status !== 0 && /manifesto base não encontrado/.test(r.saida), r.saida);
    }
    if (antigos['gerar-ciclo.sh']) {
      const r = rodar(antigos['gerar-ciclo.sh'], [PROF, CICLO, VARIANTE]);
      checar('a versão anterior do gerador falha no mesmo sítio',
        r.status !== 0 && /manifesto base não encontrado/.test(r.saida), r.saida);
    }
  }
  // ═══ D. o .conf da ESCOLA, onde ele estiver ═══════════════════════════════
  //
  // A segunda metade do mesmo defeito. O `.conf` da escola nasce sob quem CRIA a escola; a
  // turma pode estar na curadoria de outro professor. Procurá-lo só na pasta do plano deixava
  // RESPONSAVEL/PROFESSOR vazios e a faixa de volume da Regra 9 sem origem.
  console.log('\nD. O .conf da escola é procurado em todas as pastas, não só na do plano');
  {
    const { confDaEscolaPara } = require('../motor/servidor/escrever-plano.js');
    const RAIZ_API = 'https://api.github.com/repos/dono/repo';
    const CONF = 'ciclo-01-calango.conf';
    const CONTEUDO = 'ESCOLA="Calango"\nRESPONSAVEL="Outro Responsável"\nPROFESSOR="Outro Responsável"\nVOLUME_MIN="80"\nVOLUME_MAX="100"\n';
    const identidadeDoPlano = variaveisDoConf(CONTEUDO);
    const urlDoPlano = RAIZ_API + '/contents/professores/murisoca-baiana/ciclos/' + CONF;

    const fabrica = (pastas, ondeEsta) => async (url) => {
      if (url.endsWith('/contents/professores')) {
        return { status: 200, json: async () => pastas.map((nome) => ({ name: nome, type: 'dir' })) };
      }
      if (ondeEsta && url.endsWith('/contents/professores/' + ondeEsta + '/ciclos/' + CONF)) {
        return { status: 200, json: async () => ({ sha: 'x', content: Buffer.from(CONTEUDO).toString('base64') }) };
      }
      return { status: 404, json: async () => ({}) };
    };
    const cabecalhos = {};

    const achado = await confDaEscolaPara({
      f: fabrica(['murisoca-baiana', 'sapo-bailarino', 'tiago-menegaz'], 'tiago-menegaz'),
      url: urlDoPlano, cabecalhos, professor: 'murisoca-baiana', nome: CONF,
    });
    checar('acha o .conf da escola na pasta de OUTRO professor', achado.existe && achado.de === 'tiago-menegaz',
      'de=' + JSON.stringify(achado.de) + ' existe=' + achado.existe);
    checar('e traz o conteúdo dele (o responsável não fica vazio)',
      /RESPONSAVEL="Outro Responsável"/.test(achado.texto || ''), achado.texto);

    // O que o locator destrava: a faixa de volume da Regra 9 chega ao manifesto.
    const composto = comporConf({
      turma: TURMA, plano: PLANO, identidade: variaveisDoConf(achado.texto),
      escola: 'calango', ciclo: CICLO, docs: 'plano',
    });
    const vars = variaveisDoConf(composto.texto);
    checar('a identidade da escola encontrada vai para o manifesto (VOLUME e RESPONSAVEL)',
      vars.VOLUME_MIN === '80' && vars.VOLUME_MAX === '100' && vars.RESPONSAVEL === 'Outro Responsável',
      JSON.stringify({ VOLUME_MIN: vars.VOLUME_MIN, VOLUME_MAX: vars.VOLUME_MAX, RESPONSAVEL: vars.RESPONSAVEL }));
    checar('PROFESSOR deixa de sair vazio', String(vars.PROFESSOR || '').trim() !== '',
      'PROFESSOR=' + JSON.stringify(vars.PROFESSOR));
    // O rodapé do PDF nomeia QUEM DÁ A TURMA. A identidade da escola é o recurso, não a regra.
    checar('PROFESSOR é o do plano, não o responsável pela escola — pessoas diferentes',
      vars.PROFESSOR === 'Professora de Prova' && identidadeDoPlano.RESPONSAVEL === 'Outro Responsável',
      JSON.stringify({ PROFESSOR: vars.PROFESSOR, RESPONSAVEL_DA_ESCOLA: identidadeDoPlano.RESPONSAVEL }));

    // Controle negativo: sem o .conf em pasta nenhuma, o locator DIZ que não achou — não inventa.
    const nenhum = await confDaEscolaPara({
      f: fabrica(['murisoca-baiana'], null),
      url: urlDoPlano, cabecalhos, professor: 'murisoca-baiana', nome: CONF,
    });
    checar('controle negativo: sem o .conf em pasta nenhuma, devolve existe=false',
      nenhum.existe === false && nenhum.de === null, JSON.stringify(nenhum));
  }
} finally {
  limpar();
  for (const nome of ['hash-ciclo.sh', 'gerar-ciclo.sh']) {
    fs.rmSync(path.join(RAIZ, 'tools', '.prova-antigo-' + nome), { force: true });
  }
}

}

prova().then(() => {
  console.log('\n' + (falhas ? falhas + ' de ' + n + ' asserções FALHARAM' : n + ' asserções, todas passaram'));
  process.exit(falhas ? 1 : 0);
});
