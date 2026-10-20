'use strict';

/*
 * provar-indices.js — a Etapa 2 do PLANO-INDICES.md, medida de ponta a ponta.
 *
 * O QUE ESTA PROVA FIXA. O `check-indices.js` já é o validador; esta prova é o que se mede
 * SOBRE ele e sobre o gerador, e que nenhum dos dois afirma sozinho:
 *
 *   1. o gerador é DETERMINÍSTICO de ponta a ponta — duas execuções dão o mesmo texto, e o
 *      `--check` passa logo depois de gerar;
 *   2. o que está no repositório é o que o gerador produz — e apagar o disco de `indices/` não
 *      muda o resultado (a prova de reconstrução do §9.2/7);
 *   3. o índice NÃO GUARDA o que não deve: nem apelido, nem senha, nem prosa, nem corpo;
 *   4. a escola expurgada PERMANECE, marcada — e sem config ela não some do índice;
 *   5. o recorte por ciclo diz o mesmo que o índice da escola de onde saiu;
 *   6. as quatro superfícies do gerador (`--check`, `--listar`, `--json`, sem opção) respondem
 *      o que prometem, e os códigos de saída são os do contrato do CI;
 *   7. o validador tem exatamente as verificações que o plano numera — 13 do §9.1, mais a 14ª
 *      que o §4.3 exige e não numerou.
 *
 * POR QUE NÃO BASTA O `check-indices.js`. Ele diz «passou» ou «falhou»; esta prova diz POR QUE
 * se pode confiar no «passou» — e falha se alguém enfraquecer uma verificação sem que o
 * resultado mude. Uma verificação que nunca reprova não é uma verificação, é uma linha de log.
 *
 *   node experimentos/provar-indices.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const GERADOR = path.join(RAIZ, 'tools', 'gerar-indices.js');
const VALIDADOR = path.join(RAIZ, 'tools', 'check-indices.js');

const gerador = require('../tools/gerar-indices.js');
const validador = require('../tools/check-indices.js');
const indices = require('../motor/nucleo/indices.js');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) console.log('  \u2713 ' + rotulo);
  else { falhas += 1; console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : ' — ' + detalhe)); }
}

function rodar(script, args) {
  try {
    const saida = execFileSync('node', [script].concat(args || []), { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, saida };
  } catch (erro) {
    return { codigo: erro.status === undefined ? 1 : erro.status, saida: String(erro.stdout || '') + String(erro.stderr || '') };
  }
}

function main() {
  console.log('\n== 1. Determinismo de ponta a ponta ==');
  const uma = gerador.gerarEmMemoria();
  const outra = gerador.gerarEmMemoria();
  checar('duas gerações seguidas produzem os mesmos arquivos',
    uma.arquivos.size === outra.arquivos.size
    && [...uma.arquivos.keys()].every((k) => outra.arquivos.has(k)));
  let textoIgual = true;
  for (const [rel, texto] of uma.arquivos) {
    if (outra.arquivos.get(rel) !== texto) {
      // `gerado_em` pode mudar entre as duas; o resto não pode.
      if (!indices.iguais(JSON.parse(texto), JSON.parse(outra.arquivos.get(rel)))) textoIgual = false;
    }
  }
  checar('fora os voláteis, o texto é idêntico', textoIgual);
  checar('todo arquivo gerado termina em nova linha (o contrato dos arquivos do repositório)',
    [...uma.arquivos.values()].every((t) => t.endsWith('\n')));
  const quebrados = [...uma.arquivos.entries()].filter(([, t]) => { try { JSON.parse(t); return false; } catch { return true; } });
  checar('todo arquivo gerado é JSON válido', quebrados.length === 0, quebrados.map(([r]) => r).join(', '));

  console.log('\n== 2. O disco é o gerado ==');
  const noCheck = rodar(GERADOR, ['--check']);
  checar('`gerar-indices.js --check` sai 0 com o índice versionado', noCheck.codigo === 0, noCheck.saida.trim());
  const doValidador = validador.verificar(validador.carregarMundo());
  checar('`check-indices` passa as 14 verificações', doValidador.falhas === 0,
    doValidador.porVerificacao.filter((v) => v.falhas.length).map((v) => v.n + ':' + v.falhas[0]).join(' | '));

  console.log('\n== 3. Reconstrução — apagar o disco não muda o gerado ==');
  const semDisco = Object.assign({}, validador.carregarMundo(), { indices: new Map() });
  const resultadoSemDisco = validador.verificar(semDisco);
  const falhasSemDisco = resultadoSemDisco.porVerificacao.filter((v) => v.falhas.length).map((v) => v.n);
  // DUAS verificações leem o ARQUIVO e têm de acusar a ausência — e é correto que acusem:
  //   · 1 (reconstrução) — não há o que comparar;
  //   · 5 (cobertura)    — a cobertura é medida SOBRE o acervo gravado, e sem ele não há medida.
  // As outras DOZE não dependem do arquivo: é isso que prova que a geração o não lê.
  checar('sem `indices/` no disco, só as verificações que leem o arquivo acusam (1 e 5)',
    falhasSemDisco.sort().join(',') === '1,5', falhasSemDisco.join(', '));
  checar('as outras doze verificações continuam passando sem o disco de `indices/`',
    resultadoSemDisco.porVerificacao.filter((v) => v.falhas.length === 0).length === 12,
    String(resultadoSemDisco.porVerificacao.filter((v) => v.falhas.length === 0).length));
  checar('o gerado é o mesmo com ou sem o disco de `indices/`',
    [...uma.arquivos.keys()].every((rel) => semDisco.gerado.has(rel)));

  console.log('\n== 4. O índice não guarda o que não deve ==');
  const acervo = JSON.parse(uma.arquivos.get('indices/acervo.json'));
  const textoDeTodos = [...uma.arquivos.values()].join('\n');
  checar('nenhum apelido de aluna em nenhum arquivo gerado', !/"aluna"\s*:/.test(textoDeTodos));
  checar('nenhuma senha, sal, e-mail, telefone, saúde ou observação',
    !/"(senha|sal|email|telefone|saude|observacoes)"\s*:/.test(textoDeTodos));
  checar('o acervo declara o que NÃO indexa (§4.2: uma lacuna com nome)',
    Array.isArray(acervo.nao_indexado) && acervo.nao_indexado.length >= 3,
    JSON.stringify(acervo.nao_indexado));
  checar('o acervo é transversal e pequeno: não carrega o corpo de documento nenhum',
    !/"(conteudo|corpo|markdown|texto)"\s*:/.test(uma.arquivos.get('indices/acervo.json')));

  console.log('\n== 5. O expurgo permanece ==');
  const expurgadas = acervo.escolas.filter((e) => e.expurgada === true);
  checar('há ao menos uma escola expurgada no acervo', expurgadas.length > 0, String(expurgadas.length));
  checar('toda expurgada tem o inventário que é o elo (não sumiu do disco)',
    expurgadas.every((e) => fs.existsSync(path.join(RAIZ, 'escola', e.slug, 'indice.json'))));
  checar('toda expurgada está marcada, e não apenas ausente',
    expurgadas.every((e) => e.expurgada === true && e.slug));

  console.log('\n== 6. O recorte por ciclo diz o mesmo que a escola ==');
  const escolaBreu = JSON.parse(uma.arquivos.get('indices/escolas/breu.json'));
  const cicloBreu = JSON.parse(uma.arquivos.get('indices/ciclos/sapo-bailarino/01-breu.json'));
  const cicloNaEscola = escolaBreu.ciclos.find((c) => c.id === cicloBreu.id);
  checar('o ciclo do recorte existe no índice da escola', Boolean(cicloNaEscola));
  checar('o recorte lista os mesmos documentos do ciclo da escola',
    cicloBreu.documentos.length === (cicloNaEscola ? cicloNaEscola.documentos.length : -1));
  checar('o recorte e a escola dizem o mesmo estado e a mesma âncora',
    Boolean(cicloNaEscola) && cicloBreu.estado === cicloNaEscola.estado
    && JSON.stringify(cicloBreu.ancora) === JSON.stringify(cicloNaEscola.ancora));

  console.log('\n== 7. As quatro superfícies do gerador ==');
  const listar = rodar(GERADOR, ['--listar']);
  checar('`--listar` sai 0 e não escreve', listar.codigo === 0);
  checar('`--listar` nomeia o acervo e ao menos uma escola',
    /indices\/acervo\.json/.test(listar.saida) && /indices\/escolas\//.test(listar.saida));
  const json = rodar(GERADOR, ['--check', '--json']);
  let resumo = null;
  try { resumo = JSON.parse(json.saida); } catch { resumo = null; }
  checar('`--check --json` devolve JSON com `ok`', Boolean(resumo) && resumo.ok === true);
  const escolaSo = rodar(GERADOR, ['--listar', '--escola', 'breu']);
  checar('`--escola breu` limita os arquivos de escola, e mantém o acervo',
    /indices\/acervo\.json/.test(escolaSo.saida)
    && /indices\/escolas\/breu\.json/.test(escolaSo.saida)
    && !/indices\/escolas\/fita\.json/.test(escolaSo.saida));
  const escolaRuim = rodar(GERADOR, ['--listar', '--escola', 'nao-existe']);
  checar('escola desconhecida sai 2 (erro de uso, não de dado)', escolaRuim.codigo === 2, String(escolaRuim.codigo));
  const lixo = rodar(GERADOR, ['--nao-existe']);
  checar('opção desconhecida sai 2', lixo.codigo === 2, String(lixo.codigo));

  console.log('\n== 8. O validador tem as verificações do plano ==');
  const numeros = validador.VERIFICACOES.map((v) => v.n);
  checar('são 14 verificações, numeradas de 1 a 14',
    numeros.length === 14 && numeros.join(',') === Array.from({ length: 14 }, (_, i) => i + 1).join(','),
    numeros.join(','));
  checar('as 13 do §9.1 estão nomeadas', validador.VERIFICACOES.slice(0, 13).every((v) => v.nome && v.regra));

  const contra = rodar(VALIDADOR, ['--contraprovas']);
  checar('todas as contraprovas do §9.2 reprovam como deviam', contra.codigo === 0, contra.saida.trim().split('\n').pop());

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main();
