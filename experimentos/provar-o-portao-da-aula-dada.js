#!/usr/bin/env node
'use strict';

/**
 * provar-o-portao-da-aula-dada.js — O BOTÃO «CRIAR AULA» ABRE DEPOIS DO LANÇAMENTO DA ANTERIOR.
 *
 * O QUE ELA PEDIU (22/11/2026), e é uma regra de operação e não uma conveniência:
 *
 *   «todas as outras aulas que estão lá no nosso calendário com o botão, todos os outros botões,
 *   melhor dizendo, que estão no calendário, que é criar aula, eles ficam desabilitados até que os
 *   dados lançados da aula dada estejam registados no sistema, aí habilita o próximo e assim
 *   sucessivamente.»
 *
 * E a resposta à pergunta que eu fiz — «o professor pode preparar duas aulas seguidas?» — foi
 * **não**: a aula seguinte só depois de a anterior ser dada e lançada. **Bloquear**, e não avisar.
 *
 * O FACTO QUE ABRE O BOTÃO, e é o mesmo de três sítios: `aulas[NN]` no `-dados.json`. Não é a data:
 * uma aula que aconteceu e não foi lançada continua sem registro, e o portão continua fechado. É a
 * regra que `motor/nucleo/aulas-do-ciclo.js` (`aulasLancadas`) já aplica à regeneração, e a mesma
 * chave que o índice do `gerar-ciclo.sh` lê (`ler_lancadas`).
 *
 * O QUE SE MEDE, e em três camadas diferentes:
 *
 *   A. A CÉLULA — `celula_da_coluna_criar`, a função que decide. Cinco casos, incluindo os dois
 *      extremos (a Aula 01 nunca espera; com tudo lançado, nada está travado).
 *   B. O GERADOR — `tools/calendario.py` a correr de verdade, com um `-dados.json` de fixture. O
 *      que se mede é a TABELA, e não a função: é ela que chega à página.
 *   C. O PACOTE PUBLICADO — o `plano.html` do ciclo da `breu`, que é a página que ela abre.
 *
 *   D. O CONTROLE NEGATIVO, e são três porque a regra tem três metades:
 *      · sem `--dados` o gerador NÃO tranca nada — prova que é o argumento que fecha, e não uma
 *        mudança de feitio do gerador que travaria as provas de datas;
 *      · o `plano.html` do commit ANTERIOR ao portão não tem um único botão desabilitado — prova
 *        que a coluna travada é desta mudança;
 *      · o `calendario.py` desse mesmo commit, corrido com a MESMA fixture, não tranca nada e
 *        RECUSA o `--dados` — a flag é nova, e antes não havia como saber.
 *
 * PORQUE O CONTROLE É FIXO E NÃO UM `--contra=`. Esta prova não corre código antigo para o
 * comparar: ela lê o ARTEFACTO publicado e o GERADOR, e o artefacto de antes é um ficheiro no
 * histórico. Um `--contra=<sha>` a repetir asserções passaria nelas com o código de hoje — a
 * tentação de chamar a isso «controlo conforme» é exactamente o que ele não é. O sha fica
 * declarado aqui, é o commit imediatamente anterior a esta mudança, e a asserção é afirmativa:
 * «naquele artefacto não há um único botão travado».
 *
 *   node experimentos/provar-o-portao-da-aula-dada.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync, spawnSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
/** O commit imediatamente ANTERIOR ao portão — o artefacto e o gerador de antes. */
const SEM_PORTAO = '22b99699';

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 320)));
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'portao-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {} });

/** Um `-dados.json` de fixture com as aulas que se dizem lançadas. */
function dadosCom(lancadas) {
  const aulas = {};
  for (const nn of lancadas) aulas[nn] = { quando: '2026-09-18T18:30', por: 'professora' };
  const caminho = path.join(TMP, 'dados-' + (lancadas.join('-') || 'vazio') + '.json');
  fs.writeFileSync(caminho, JSON.stringify({ ciclo: '01', aulas }, null, 2) + '\n');
  return caminho;
}

/** O gerador de verdade — a mesma linha que o `gerar-ciclo.sh` usa, com e sem o `--dados`. */
function calendario({ lancadas, prontas, comDados }) {
  const args = [
    path.join(RAIZ, 'tools/calendario.py'),
    '--escola', 'Teste', '--frequencia', '1x/semana', '--dias', '5@18:30',
    '--inicio', '17/09/2026', '--total', '5', '--duracao-curta', '60', '--volume-curto', '90',
    '--criar-aula', '--aulas-prontas', prontas || '',
  ];
  if (comDados) args.push('--dados', dadosCom(lancadas || []));
  const r = spawnSync('python3', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('calendario.py falhou: ' + (r.stderr || '').slice(0, 400));
  return r.stdout;
}

/** As linhas da tabela, por número de aula: `{ nn: { celula, disabled, title, abrir } }`. */
function linhasDoCalendario(texto) {
  const saida = {};
  for (const linha of texto.split('\n')) {
    const m = /^\| (\d{2})[^|]*\|[^|]*\|[^|]*\|[^|]*\| (.*) \|$/.exec(linha);
    if (!m) continue;
    const celula = m[2];
    const titulo = /title="([^"]*)"/.exec(celula);
    saida[m[1]] = {
      celula,
      disabled: /<button[^>]*\sdisabled[\s>]/.test(celula),
      botao: /data-criar-aula="(\d{2})"/.test(celula),
      abrir: /href="aula-\d{2}\.html"/.test(celula),
      title: titulo ? titulo[1] : '',
    };
  }
  return saida;
}

/* ═══════════════════ A · A CÉLULA — a decisão, caso a caso ═══════════════════ */

console.log('\nA · A CÉLULA — cinco casos, incluindo os dois extremos');
{
  const r = spawnSync('python3', ['-c', `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('cal', sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
casos = {
  'sem_nada':        m.celula_da_coluna_criar(1, set(), True, set()),
  'a02_sem_a01':     m.celula_da_coluna_criar(2, set(), True, set()),
  'a02_com_a01':     m.celula_da_coluna_criar(2, set(), True, {'01'}),
  'a03_sem_a02':     m.celula_da_coluna_criar(3, {'01','02'}, True, {'01'}),
  'tudo_lancado':    m.celula_da_coluna_criar(4, {'01','02','03'}, True, {'01','02','03'}),
  'sem_portao':      m.celula_da_coluna_criar(3, {'01','02'}, True, None),
  'ja_existe':       m.celula_da_coluna_criar(2, {'01','02'}, True, set()),
  'sem_a_coluna':    m.celula_da_coluna_criar(2, set(), False, set()),
}
print(json.dumps(casos))
`, path.join(RAIZ, 'tools/calendario.py')], { encoding: 'utf8' });
  let c = {};
  try { c = JSON.parse(r.stdout); } catch (e) { c = {}; }
  provar('a função respondeu aos oito casos', Object.keys(c).length === 8, Object.keys(c));

  provar('a Aula 01 NUNCA espera — não há aula anterior cujo lançamento lhe falte',
    !/disabled/.test(c.sem_nada || '') && /data-criar-aula="01"/.test(c.sem_nada || ''), c.sem_nada);
  provar('a Aula 02 sem a 01 lançada fica DESABILITADA',
    /<button[^>]*\sdisabled[\s>]/.test(c.a02_sem_a01 || ''), c.a02_sem_a01);
  provar('…e o `title` nomeia a aula que falta («A Aula 01 ainda não foi lançada»)',
    /A Aula 01 ainda não foi lançada/.test(c.a02_sem_a01 || ''), c.a02_sem_a01);
  provar('…e continua a saber o número DELA (`data-criar-aula="02"`)',
    /data-criar-aula="02"/.test(c.a02_sem_a01 || ''), c.a02_sem_a01);
  provar('com a 01 lançada, a Aula 02 abre',
    !/disabled/.test(c.a02_com_a01 || '') && /data-criar-aula="02"/.test(c.a02_com_a01 || ''),
    c.a02_com_a01);
  provar('a Aula 03 com a 02 por lançar fica desabilitada, mesmo com a 01 lançada',
    /<button[^>]*\sdisabled[\s>]/.test(c.a03_sem_a02 || ''), c.a03_sem_a02);
  provar('…e o motivo é a 02, e não a 01', /A Aula 02 ainda não foi lançada/.test(c.a03_sem_a02 || ''),
    c.a03_sem_a02);
  provar('com as anteriores lançadas, o botão abre — «aí habilita o próximo»',
    !/disabled/.test(c.tudo_lancado || ''), c.tudo_lancado);
  /* «NÃO SEI» NÃO TRANCA. Sem a lista (`None`), o botão abre como antes: é o caso das provas de
   * datas e o de quem chama o gerador sem os dados. Fechar por omissão transformaria uma falta de
   * argumento numa regra. */
  provar('sem a lista de lançadas (`None`), o botão NÃO é travado — «não sei» não é «não»',
    !/disabled/.test(c.sem_portao || ''), c.sem_portao);
  provar('a aula que já tem documento é uma LIGAÇÃO «Abrir», e não um botão',
    /<a class="acao secundario pequena" href="aula-02\.html">Abrir<\/a>/.test(c.ja_existe || ''),
    c.ja_existe);
  provar('sem `--criar-aula` a coluna não existe (o modo das provas de datas)',
    c.sem_a_coluna === '', JSON.stringify(c.sem_a_coluna));
}

/* ═══════════════════ B · O GERADOR — a tabela que chega à página ═══════════════════ */

console.log('\nB · O GERADOR — a tabela de verdade, com o `-dados.json` de fixture');
{
  const semNada = linhasDoCalendario(calendario({ lancadas: [], prontas: '', comDados: true }));
  provar('sem aula nenhuma lançada, a Aula 01 abre',
    semNada['01'] && !semNada['01'].disabled, semNada['01']);
  provar('…e TODO o resto fica travado, da 02 à última',
    ['02', '03', '04', '05'].every((n) => semNada[n] && semNada[n].disabled),
    ['02', '03', '04', '05'].map((n) => semNada[n] && semNada[n].disabled));

  const umaLancada = calendario({ lancadas: ['01'], prontas: '01', comDados: true });
  const l1 = linhasDoCalendario(umaLancada);
  provar('com a 01 lançada, a 02 abre', l1['02'] && !l1['02'].disabled, l1['02']);
  provar('…e a 03 continua travada, à espera da 02', l1['03'] && l1['03'].disabled, l1['03']);
  provar('a nota por baixo da tabela diz a REGRA uma vez, e nomeia a aula que falta',
    /O botão «Criar aula» abre depois do \*\*registro do lançamento\*\*/.test(umaLancada)
    && /Hoje está à espera do lançamento da \*\*Aula 02\*\*/.test(umaLancada),
    (umaLancada.split('\n').find((l) => l.indexOf('O botão «Criar aula» abre') !== -1) || '').slice(0, 200));

  const duas = linhasDoCalendario(calendario({ lancadas: ['01', '02'], prontas: '01 02', comDados: true }));
  provar('com a 01 e a 02 lançadas, a 03 abre e a 04 espera',
    !duas['03'].disabled && duas['04'].disabled, { '03': duas['03'].disabled, '04': duas['04'].disabled });

  /* O BOTÃO TRAVADO NÃO ABRE O DIÁLOGO — o script ouve `[data-criar-aula]`, e um `disabled` não
   * emite `click`. Mede-se o ATRIBUTO, que é o que o browser honra; o clique não é simulado porque
   * um evento despachado à mão passaria por cima do browser e mediria o contrário do real. */
  provar('o botão travado conserva o gancho `data-criar-aula` e é `disabled` — o browser não o clica',
    semNada['02'].disabled && semNada['02'].botao, semNada['02']);
}

/* ═══════════════════ C · O PACOTE PUBLICADO — a página que ela abre ═══════════════════ */

console.log('\nC · O PACOTE — o `plano.html` do ciclo da `breu`');
{
  const REL = 'professores/demi-plie/ciclos/ciclo-01-breu-rosa/plano.html';
  const deHoje = fs.readFileSync(path.join(RAIZ, REL), 'utf8');
  const botoes = (html) => {
    const d = {};
    const re = /<button[^>]*data-criar-aula="(\d{2})"[^>]*>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      d[m[1]] = { tag: m[0], disabled: /\sdisabled[\s>]/.test(m[0]) };
    }
    return d;
  };
  const b = botoes(deHoje);
  provar('o pacote tem os botões das aulas que faltam (a 03 e as seguintes)', !!b['03'], Object.keys(b).length);
  provar('a Aula 03 está TRAVADA no pacote publicado', b['03'] && b['03'].disabled, b['03']);
  provar('…porque a Aula 02 existe mas não foi lançada — o `title` di-lo',
    b['03'] && /A Aula 02 ainda não foi lançada/.test(b['03'].tag), b['03']);
  provar('…e as que vêm depois esperam a sua própria anterior',
    b['04'] && /A Aula 03 ainda não foi lançada/.test(b['04'].tag), b['04']);
  provar('a nota da regra está na página publicada',
    /O botão «Criar aula» abre depois do/.test(deHoje)
    /* A NOTA É TEXTO CORRIDO NO HTML, e o conversor parte-a em linhas: `Hoje está` e `à espera do
     * lançamento da` podem cair em linhas diferentes. O `\s+` é o que faz a asserção medir a
     * FRASE, e não a posição das quebras. */
    && /Hoje está\s+à espera do lançamento da/.test(deHoje));

  /* A AULA 01 E A 02 TÊM DOCUMENTO, portanto são LIGAÇÕES — o portão não lhes toca. */
  provar('as aulas que já têm documento continuam a abrir (Abrir, e não um botão travado)',
    /href="aula-01\.html">Abrir</.test(deHoje) && /href="aula-02\.html">Abrir</.test(deHoje));

  /* ── O CONTROLE: o artefacto do commit anterior ao portão ── */
  let antes = '';
  try {
    antes = execSync('git show ' + SEM_PORTAO + ':' + REL,
      { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch (e) { antes = ''; }
  const a = botoes(antes);
  provar('CONTROLE: o `plano.html` de ' + SEM_PORTAO + ' tem os mesmos botões da 03',
    !!antes && !!a['03'], a['03']);
  provar('CONTROLE: …e NENHUM deles está travado — a coluna travada é desta mudança',
    !!a['03'] && !a['03'].disabled
    && ['03', '04', '05'].every((n) => !a[n] || !a[n].disabled),
    a['03']);
  provar('CONTROLE: …e a nota da regra não existia naquele artefacto',
    !!antes && !/O botão «Criar aula» abre depois do/.test(antes));
}

/* ═══════════════════ D · O CONTROLE NEGATIVO — é o argumento que fecha ═══════════════════ */

console.log('\nD · O CONTROLE — sem `--dados` o gerador não tranca nada');
{
  const semDados = linhasDoCalendario(calendario({ lancadas: [], prontas: '', comDados: false }));
  provar('sem `--dados`, NENHUM botão é travado — a regra é do argumento, e não do feitio',
    ['01', '02', '03', '04', '05'].every((n) => semDados[n] && !semDados[n].disabled),
    ['01', '02', '03', '04', '05'].map((n) => semDados[n] && semDados[n].disabled));
  provar('…e a nota da regra não aparece (não há regra a explicar)',
    !/O botão «Criar aula» abre depois do/.test(calendario({ lancadas: [], prontas: '', comDados: false })));

  /* O GERADOR DE ANTES, com a MESMA fixture: não tranca nada, e nem sabe o que é o `--dados`.
   * É a metade que faltava do controlo — o artefacto mostra que a página de antes não travava; este
   * mostra que a FERRAMENTA de antes não tinha como travar. */
  let geradorAntigo = '';
  try {
    geradorAntigo = execSync('git show ' + SEM_PORTAO + ':tools/calendario.py',
      { cwd: RAIZ, maxBuffer: 64 * 1024 * 1024 }).toString();
  } catch (e) { geradorAntigo = ''; }
  const caminhoAntigo = path.join(TMP, 'calendario-de-' + SEM_PORTAO + '.py');
  if (geradorAntigo) fs.writeFileSync(caminhoAntigo, geradorAntigo);
  const semDadosAntigo = geradorAntigo
    ? linhasDoCalendario(spawnSync('python3', [
      caminhoAntigo, '--escola', 'Teste', '--frequencia', '1x/semana', '--dias', '5@18:30',
      '--inicio', '17/09/2026', '--total', '5', '--duracao-curta', '60', '--volume-curto', '90',
      '--criar-aula', '--aulas-prontas', '',
    ], { encoding: 'utf8' }).stdout || '')
    : {};
  provar('CONTROLE: o `calendario.py` de ' + SEM_PORTAO + ' não tranca nenhum botão',
    !!geradorAntigo
    && ['01', '02', '03', '04', '05'].every((n) => semDadosAntigo[n] && !semDadosAntigo[n].disabled),
    ['01', '02', '03', '04', '05'].map((n) => semDadosAntigo[n] && semDadosAntigo[n].disabled));
  const recusa = geradorAntigo
    ? spawnSync('python3', [caminhoAntigo, '--escola', 'T', '--frequencia', '1x',
      '--dias', '5@18:30', '--inicio', '17/09/2026', '--total', '2', '--duracao-curta', '60',
      '--volume-curto', '90', '--criar-aula', '--dados', '/tmp/x.json'], { encoding: 'utf8' })
    : { status: 0 };
  provar('CONTROLE: …e RECUSA o `--dados` — a flag é nova (a ferramenta de antes não sabia o facto)',
    !!geradorAntigo && recusa.status !== 0, { status: recusa.status,
      erro: String(recusa.stderr || '').split('\n').slice(-1)[0].slice(0, 120) });

  /* E O `gerar-ciclo.sh` PASSA O `--dados` — sem isso, o portão existiria na ferramenta e não no
   * produto. Lê-se a chamada, porque é a única coisa que liga as duas metades. */
  const gerador = fs.readFileSync(path.join(RAIZ, 'tools/gerar-ciclo.sh'), 'utf8');
  provar('o `gerar-ciclo.sh` passa `--dados "$(fonte_dados)"` ao calendário',
    /--dados "\$\(fonte_dados\)"/.test(gerador),
    (gerador.split('\n').filter((l) => l.indexOf('--dados') !== -1)).join(' | ').slice(0, 200));
}

/* ═══════════════════ E · O FACTO É O MESMO DE TRÊS SÍTIOS ═══════════════════ */

console.log('\nE · O FACTO — `aulas[NN]`, e não a data');
{
  const aulasDoCiclo = require(path.join(RAIZ, 'motor/nucleo/aulas-do-ciclo.js'));
  const dados = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-dados.json'), 'utf8'));
  const daGuarda = [...aulasDoCiclo.aulasLancadas(dados)].sort();
  const r = spawnSync('python3', ['-c', `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('cal', sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print(json.dumps(sorted(m.lancadas_do_dados(sys.argv[2]))))
`, path.join(RAIZ, 'tools/calendario.py'),
    path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa-dados.json')], { encoding: 'utf8' });
  let doCalendario = null;
  try { doCalendario = JSON.parse(r.stdout); } catch (e) { doCalendario = null; }
  provar('o calendário lê o mesmo facto que a guarda da regeneração (`aulasLancadas`)',
    JSON.stringify(doCalendario) === JSON.stringify(daGuarda), { calendario: doCalendario, guarda: daGuarda });
  /* UMA ENTRADA SEM OBJECTO NÃO É UM LANÇAMENTO — é lixo de uma escrita interrompida, e as duas
   * leituras têm de concordar também nisso. */
  const sujo = path.join(TMP, 'sujo.json');
  fs.writeFileSync(sujo, JSON.stringify({ aulas: { '01': { quando: 'x' }, '02': null, '03': 'lixo' } }));
  const r2 = spawnSync('python3', ['-c', `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('cal', sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
print(json.dumps(sorted(m.lancadas_do_dados(sys.argv[2]))))
`, path.join(RAIZ, 'tools/calendario.py'), sujo], { encoding: 'utf8' });
  provar('…e concordam no lixo: só a entrada que é um objecto conta',
    JSON.stringify(JSON.parse(r2.stdout)) === JSON.stringify(['01']), r2.stdout.trim());
}

console.log('');
if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
console.log('TUDO CERTO — ' + total + ' asserções: o botão «Criar aula» abre depois do REGISTRO DO '
  + 'LANÇAMENTO da aula anterior — o facto, e não a data —, a Aula 01 nunca espera, a aula que já tem '
  + 'documento continua a ser uma ligação, «não sei» não tranca nada, e o pacote publicado da `breu` '
  + 'traz a Aula 03 travada à espera do lançamento da 02, com a regra escrita uma vez por baixo da tabela.');
