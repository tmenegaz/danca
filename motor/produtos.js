'use strict';

/**
 * produtos.js — o CLI que GERA os produtos a partir do catálogo.
 *
 * O QUE ELE É. O adaptador Node do motor de produtos: lê o catálogo do disco (ou do `main`), chama
 * o núcleo puro e escreve os documentos. Não decide conteúdo, não inventa lacuna e não assina
 * nada — a âncora do produto é a fase 3 do plano.
 *
 *   node motor/produtos.js dicionario
 *   node motor/produtos.js syllabus
 *   node motor/produtos.js syllabus --nivel bale-nivel-1
 *   node motor/produtos.js dicionario --out -            (para a saída padrão)
 *   node motor/produtos.js dicionario --do-repo          (lê o `main`, não o disco)
 *
 * A SAÍDA VAI PARA `publicacao/produtos/<modalidade>/`, que é uma pasta GERADA e está no
 * `.gitignore` — como o resto de `publicacao/`. O produto não é fonte: a fonte é o catálogo, e o
 * documento reconstrói-se dele. (A fase 3 é que dá ao produto um pacote e uma âncora próprios.)
 *
 * AS LACUNAS CONTAM-SE NO FIM, EM VOZ ALTA. Um produto gerado com 59 termos sem origem declarada
 * não pode sair como se estivesse completo: quem corre o comando lê o número antes de o publicar.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');

function lerJson(rel) {
  const caminho = path.join(RAIZ, rel);
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (erro) {
    throw new Error('não consegui ler ' + rel + ': ' + erro.message);
  }
}

function uso() {
  console.log('uso: node motor/produtos.js <dicionario|syllabus> [opções]');
  console.log('');
  console.log('  --modalidade <slug>   modalidade do catálogo (por omissão, bale-classico)');
  console.log('  --escola <slug>       a edição de uma escola: o catálogo + os termos dela, com a');
  console.log('                        dela a vencer. Sem isto, o produto é o do CATÁLOGO');
  console.log('  --nivel <id>          só um nível do syllabus (id de progressao.json)');
  console.log('  --versao <v>          versão do produto (por omissão, 0.1.0)');
  console.log('  --licenca <texto>     a licença do produto (por omissão, a de biblioteca/LICENSE.md)');
  console.log('  --edicao <interna|paga>  a interna mostra tudo (omissão); a paga deixa de fora as');
  console.log('                        definições sem origem declarada — é a licença, §3');
  console.log('  --out <dir|->         onde escrever; `-` é a saída padrão');
  console.log('                        (por omissão, publicacao/produtos/<modalidade>/)');
  console.log('  --do-repo             ler o `main` do GitHub em vez do disco (precisa de GITHUB_TOKEN)');
  console.log('  --json                imprimir o manifesto, e não os documentos');
}

function argumentos(argv) {
  const opts = { tipo: '', modalidade: 'bale-classico', nivel: '', versao: '0.1.0',
    licenca: '', edicao: 'interna', escola: '', out: '', doRepo: false, json: false };
  const resto = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const valor = () => {
      i += 1;
      if (i >= argv.length) throw new Error('falta o valor de ' + a);
      return argv[i];
    };
    if (a === '--modalidade') opts.modalidade = valor();
    else if (a === '--nivel') opts.nivel = valor();
    else if (a === '--versao') opts.versao = valor();
    else if (a === '--licenca') opts.licenca = valor();
    else if (a === '--edicao') opts.edicao = valor();
    else if (a === '--escola') opts.escola = valor();
    else if (a === '--out') opts.out = valor();
    else if (a === '--do-repo') opts.doRepo = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') opts.ajuda = true;
    else resto.push(a);
  }
  opts.tipo = resto[0] || '';
  return opts;
}

/** O catálogo no disco: a fonte que o gerador lê é a mesma que o repositório guarda. */
function catalogoDoDisco(modalidade) {
  const pasta = 'biblioteca/modalidades/' + modalidade;
  return {
    modalidade,
    alfabeto: lerJson(pasta + '/notacao.json'),
    vocabulario: lerJson(pasta + '/vocabulario.json'),
    progressao: lerJson(pasta + '/progressao.json'),
  };
}

/**
 * A FOTOGRAFIA DATADA DO CATÁLOGO — `catalogo@AAAA-MM-DD`, tirada do `git` e não do relógio.
 *
 * A MESMA TÉCNICA QUE TORNOU O PDF REPRODUTÍVEL (`SOURCE_DATE_EPOCH` em `tools/gerar-ciclo.sh`): a
 * data de um conteúdo versionado é a do último commit que o tocou. Usar `new Date()` daria uma data
 * diferente a cada geração para o mesmo catálogo — e uma licença que muda de data sem o conteúdo
 * mudar não é uma licença, é um carimbo.
 *
 * ELA É DERIVADA, E O CONTRATO É QUE NÃO É. A cláusula 1 da licença (`ARQUITETURA-GERAL` §10.2)
 * descreve a fotografia que o CONTRATO congela (`catalogo@AAAA-MM-DD`). Enquanto não há contrato
 * (C8), o produto cita esta — que é verdadeira e conferível por máquina. É a pendência declarada no
 * `REGISTRO.md` de 02/11/2026: no dia em que o contrato existir, a data dele **vence**, e esta
 * passa a ser só o que o gerador sabe dizer sozinho.
 *
 * Sem `git` (ou com o catálogo por commitar), devolve `null` — e o núcleo transforma isso na lacuna
 * `sem-fotografia`. É a diferença entre «não sei a data» e «inventei a data».
 */
function fotografiaDoCatalogo(modalidade) {
  const pasta = 'biblioteca/modalidades/' + String(modalidade || 'bale-classico');
  const git = (args) => execFileSync('git', args, { cwd: RAIZ, stdio: 'pipe' }).toString().trim();
  let data = '';
  let commit = '';
  try {
    data = git(['log', '-1', '--format=%ad', '--date=short', '--', pasta]);
    commit = git(['log', '-1', '--format=%h', '--', pasta]);
  } catch {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  return { data, commit: commit || null, rotulo: 'catalogo@' + data };
}

/**
 * A LICENÇA DO PRODUTO, LIDA DO FICHEIRO QUE A DECLARA (02/11/2026).
 *
 * O nome vem do **título** de `biblioteca/LICENSE.md` — uma fonte só, e não uma constante escrita
 * aqui que envelhece no dia em que o texto mudar. O `— ver biblioteca/LICENSE.md` vai junto porque
 * o manifesto do produto tem de levar um leitor ao documento, e um título sem caminho não leva.
 *
 * Sem ficheiro, devolve vazio — e o núcleo transforma isso na lacuna `sem-licenca`. É a diferença
 * entre «não há licença» e «há uma que eu não encontrei»: as duas levam a correcções diferentes, e
 * só a primeira é verdade quando o ficheiro não existe.
 */
function licencaDoDisco() {
  const caminho = path.join(RAIZ, 'biblioteca', 'LICENSE.md');
  let texto;
  try {
    texto = fs.readFileSync(caminho, 'utf8');
  } catch {
    return '';
  }
  const titulo = (texto.match(/^#\s+(.+)$/m) || [])[1];
  if (!titulo) return '';
  return titulo.trim() + ' · texto integral em biblioteca/LICENSE.md';
}

/** A escrita: cada documento no seu ficheiro, e a pasta criada se não existir. */
function escrever(destino, documentos) {
  fs.mkdirSync(destino, { recursive: true });
  const escritos = [];
  for (const d of documentos) {
    const caminho = path.join(destino, d.nome);
    fs.writeFileSync(caminho, d.texto, 'utf8');
    escritos.push(caminho);
  }
  return escritos;
}

/** O resumo para quem corre o comando — contagens e o que falta, sem enfeite. */
function resumo(produto) {
  const c = (produto.manifesto && produto.manifesto.contagens) || {};
  const linhas = [];
  linhas.push(produto.nomeDoProduto + ' — ' + produto.id + ' v' + produto.versao);
  if (produto.produto === 'dicionario') {
    linhas.push('  termos: ' + c.termos + ' · com definição: ' + c.com_definicao
      + ' · com origem: ' + c.com_origem + ' · com decomposição: ' + c.com_decomposicao);
  } else {
    linhas.push('  níveis: ' + c.niveis + ' · com unidades: ' + c.niveis_com_unidades
      + ' · unidades: ' + c.unidades);
  }
  linhas.push('  lacunas: ' + (c.lacunas == null ? 0 : c.lacunas));
  const tipos = {};
  for (const l of (produto.lacunas || [])) tipos[l.tipo] = (tipos[l.tipo] || 0) + 1;
  for (const tipo of Object.keys(tipos).sort()) linhas.push('    · ' + tipo + ': ' + tipos[tipo]);
  return linhas.join('\n');
}

async function main(argv) {
  const opts = argumentos(argv);
  if (opts.ajuda || !opts.tipo) {
    uso();
    process.exit(opts.ajuda ? 0 : 2);
  }
  if (opts.tipo !== 'dicionario' && opts.tipo !== 'syllabus') {
    console.error('produtos: «' + opts.tipo + '» não é um produto. Use `dicionario` ou `syllabus`.');
    process.exit(2);
  }

  const produtos = require('./servidor/produtos.js');
  const comuns = {
    versao: opts.versao,
    // A LICENÇA VEM DO FICHEIRO, e não de uma constante daqui (02/11/2026). O `--licenca` explícito
    // continua a vencer — é ele que a prova usa, e é ele que serve a quem gera um produto que não
    // é o do catálogo.
    licenca: opts.licenca || licencaDoDisco(),
    fotografia: fotografiaDoCatalogo(opts.modalidade),
    edicao: opts.edicao === 'paga' ? 'paga' : 'interna',
    escola: opts.escola || '',
    nivel: opts.nivel || undefined,
  };

  let produto;
  if (opts.doRepo) {
    const token = String(process.env.GITHUB_TOKEN || '').trim();
    if (!token) {
      console.error('produtos: --do-repo precisa de GITHUB_TOKEN no ambiente.');
      process.exit(2);
    }
    produto = await produtos.gerarDoRepo({
      tipo: opts.tipo, f: (u, o) => fetch(u, o), token,
      dono: 'tmenegaz', repo: 'danca', ref: 'main',
      modalidade: opts.modalidade, opcoes: comuns,
    });
  } else {
    const catalogo = catalogoDoDisco(opts.modalidade);
    const gerar = opts.tipo === 'dicionario' ? produtos.gerarDicionario : produtos.gerarSyllabus;
    const preparado = produtos.prepararCatalogo(catalogo.vocabulario, opts.escola);
    produto = gerar(Object.assign({}, catalogo, preparado, comuns));
  }

  if (!produto.ok) {
    console.error('produtos: ' + (produto.erro || 'não foi possível gerar'));
    process.exit(1);
  }
  produto.nomeDoProduto = opts.tipo === 'dicionario' ? 'Dicionário' : 'Syllabus';

  if (opts.json) {
    console.log(JSON.stringify(produto.manifesto, null, 2));
    return;
  }
  if (opts.out === '-') {
    for (const d of produto.documentos) {
      console.log('<!-- ' + d.nome + ' -->');
      console.log(d.texto);
    }
    console.error(resumo(produto));
    return;
  }
  const destino = opts.out || path.join('publicacao', 'produtos', opts.modalidade);
  // O CAMINHO DO `--out` PODE SER ABSOLUTO. `path.join(RAIZ, '/tmp/x')` dá `RAIZ/tmp/x` — o
  // `join` só normaliza, não respeita a raiz do segundo argumento. Quem pede um destino absoluto
  // quer AQUELE destino, e a prova escreve num temporário.
  const alvo = path.isAbsolute(destino) ? destino : path.join(RAIZ, destino);
  const escritos = escrever(alvo, produto.documentos);
  console.log(resumo(produto));
  console.log('  escritos: ' + escritos.length + ' documento(s) em '
    + (opts.out ? destino : path.relative(RAIZ, alvo)));
  for (const e of escritos) console.log('    ' + (path.isAbsolute(destino) ? e : path.relative(RAIZ, e)));
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((erro) => {
    console.error('produtos: ' + erro.message);
    process.exit(1);
  });
}

module.exports = { main, argumentos, catalogoDoDisco, licencaDoDisco, fotografiaDoCatalogo };
