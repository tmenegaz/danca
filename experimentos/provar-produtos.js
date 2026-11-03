'use strict';

/**
 * provar-produtos.js — o motor dos produtos (dicionário e syllabus) faz o que o plano promete.
 *
 * O QUE ESTA PROVA MEDE, e por que cada secção existe:
 *
 *   A. A FRONTEIRA. Os módulos de produto vivem no núcleo, e o núcleo não toca em `fs`, `path`,
 *      `http` nem `process`. É a condição que permite o mesmo módulo correr no Worker e na
 *      bancada — e é a primeira coisa do plano (§9, critério 1). O `provar-agnosticismo.js` não
 *      existe neste worktree; esta secção faz a parte que se aplica aos produtos, e di-lo.
 *   B. O DICIONÁRIO. Sobre uma fixture declarada: a ordem das categorias, a definição em falta, a
 *      fonte em falta, a tabela da decomposição com o compasso por pista, e o verbete que NÃO
 *      fecha a publicar `[conferir]` em vez da contagem errada.
 *   C. O SYLLABUS. A ordem declarada das unidades, a camada pedagógica quando existe, a lacuna
 *      quando não existe, a relação órfã, e o nível que ainda não declarou nada.
 *   D. A COMPOSIÇÃO catálogo × escola. As adições NÃO entram por omissão; entram quando pedidas,
 *      e o manifesto diz quantas são de cada camada.
 *   E. O DETERMINISMO. Duas execuções sobre a mesma entrada dão o mesmo byte.
 *   F. O PRODUTO NÃO CARREGA RITMO. Nenhum manifesto tem dias, frequência nem período (C19).
 *   G. O CATÁLOGO DE VERDADE. Os dois produtos geram-se do disco, sem rede, e as contagens do
 *      manifesto batem com o que os documentos dizem. Não se afirma sobre o CONTEÚDO (quantos
 *      termos, quais): isso muda com a mão dela, e a lição de 02/11/2026 é que uma prova que
 *      mede o conteúdo reprova quando o conteúdo muda.
 *   H. O CLI. Escreve os documentos no destino, e o `--json` imprime o manifesto.
 *
 *   node experimentos/provar-produtos.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const comum = require(path.join(RAIZ, 'motor', 'nucleo', 'produtos', 'comum.js'));
const dicionario = require(path.join(RAIZ, 'motor', 'nucleo', 'produtos', 'dicionario.js'));
const syllabus = require(path.join(RAIZ, 'motor', 'nucleo', 'produtos', 'syllabus.js'));
const produtos = require(path.join(RAIZ, 'motor', 'servidor', 'produtos.js'));
const cli = require(path.join(RAIZ, 'motor', 'produtos.js'));

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// ---------------------------------------------------------------- a fixture
//
// TUDO AQUI É DECLARADO, E É DE PROPÓSITO. A prova do mecanismo não pode depender do conteúdo
// editorial do alfabeto — ela apagou os onze verbetes em 02/11/2026 e as provas ficaram a medir o
// dado. O catálogo de verdade é medido na §G, e só nas CONTAGENS.

const ALFABETO = {
  id: 'alfabeto-de-prova',
  versao: 7,
  modalidade: 'bale-classico',
  nome: 'Alfabeto de prova',
  categorias: ['Pé', 'Peso', 'Perna', 'Braço', 'Cabeça'],
  convencoes: {
    abre: { sinal: '[', nome: 'abre bloco' },
    fecha: { sinal: ']', nome: 'fecha bloco' },
    separa: { sinal: ':', nome: 'dois-pontos' },
  },
  grupos: [
    { titulo: 'Movimento', itens: { '→': { nome: 'conduz a' }, '●': { nome: 'fecha' }, '+': { nome: 'à frente' }, '-': { nome: 'ao lado' }, '×': { nome: 'atrás' }, '↓': { nome: 'cede' }, '↑': { nome: 'sobe' } } },
  ],
  gramatica: { direcoesDoMembro: {}, orientacoesDoCorpo: {} },
  verbetes: {
    _comentario: 'o comentário não é exercício',
    'Battement tendu': {
      '8|4/4': {
        cobre: 8,
        celulas: {
          devant: [
            { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'extensão à frente' },
            { contagem: '3–4', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: 'retorno' },
          ],
          derriere: [
            { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '×'], descricao: 'extensão atrás' },
            { contagem: '3–4', categoria: 'Pé', sinais: ['×', '●', '1ª'], descricao: 'retorno' },
          ],
        },
      },
    },
    // NÃO FECHA DE PROPÓSITO: declara 12 numa música de 8. É o caso que o produto tem de recusar
    // a contagem — e não arredondar.
    'Plié': {
      '8|4/4': {
        cobre: 12,
        celulas: {
          '': [
            { contagem: '1–4', categoria: 'Perna', sinais: ['1ª', '↓', '↑'], repeticoes: 2, descricao: 'desce e sobe' },
          ],
        },
      },
    },
  },
};

const VOCABULARIO = [
  { id: 'tendu', termo: 'Battement tendu', categoria: 'passo', tradicao: 'francesa',
    descricao: 'a extensão da perna de trabalho', fonte: 'fonte declarada na prova' },
  { id: 'plie', termo: 'Plié', categoria: 'passo', tradicao: 'compartilhada', descricao: '', fonte: '' },
  { id: 'premiere', termo: 'Première position', categoria: 'posicao', membro: 'pes',
    descricao: 'os calcanhares juntos', fonte: 'fonte declarada na prova' },
  // UM EXERCÍCIO SEM VERBETE, de propósito: é ele que mede a lacuna «exercício sem decomposição».
  { id: 'fondu', termo: 'Battement fondu', categoria: 'passo',
    descricao: 'a flexão e a extensão coordenadas', fonte: 'fonte declarada na prova' },
];

const ADICOES = [
  { id: 'salao', termo: 'Salão', categoria: 'ligacao', tradicao: 'compartilhada',
    descricao: 'deslocamento de salão', fonte: 'escrita pela escola' },
];

const PROGRESSAO = {
  turmas: [
    { id: 'n1', nome: 'Nível 1', ordem: 1, programaReferencia: 'RAD', nivelReferencia: 'Grade 1', ativo: true },
    { id: 'n2', nome: 'Nível 2', ordem: 2, programaReferencia: 'RAD', nivelReferencia: 'Grade 2', ativo: true },
  ],
  relacoes: [
    { turma: 'n1', termo: 'tendu', exige: ['o pé esticado', 'o joelho firme'],
      ensina: 'a extensão sem transferir o peso', expressa: ['a linha contínua'] },
    { turma: 'n1', termo: 'plie' },
    { turma: 'n1', termo: 'premiere', exige: 'o apoio nos três pontos', ensina: 'a base',
      expressa: 'a calma' },
    { turma: 'n1', termo: 'termo-que-nao-existe' },
  ],
};

const BASE = {
  modalidade: 'bale-classico',
  alfabeto: ALFABETO,
  vocabulario: VOCABULARIO,
  progressao: PROGRESSAO,
  rotulosDeCategoria: { passo: 'Passos', posicao: 'Posições', ligacao: 'Ligações' },
  ordemDeCategoria: ['passo', 'posicao', 'ligacao'],
  rotuloDaTradicao: (t) => String(t || ''),
  versao: '9.9.9',
  licenca: 'licença de prova',
};

const texto = (r) => (r.documentos || []).map((d) => d.texto).join('\n');

// ================= A. A FRONTEIRA =============================================
console.log('A. A FRONTEIRA — o produto é do núcleo, e o núcleo não sabe onde corre');
{
  const dir = path.join(RAIZ, 'motor', 'nucleo', 'produtos');
  const fontes = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  const proibidos = /require\(\s*['"](fs|path|http|https|process)['"]\s*\)/;
  const usos = /process\.|__dirname|__filename/;
  const sujos = [];
  for (const f of fontes) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    if (proibidos.test(s) || usos.test(s)) sujos.push(f);
  }
  checar('os módulos de produto são ' + fontes.length + ', e nenhum requer fs/path/http/process',
    fontes.length >= 3 && sujos.length === 0, sujos);
  checar('e nenhum olha o relógio — a geração é determinística por construção',
    fontes.every((f) => !/Date\.now|new Date\(/.test(fs.readFileSync(path.join(dir, f), 'utf8'))));
}

// ================= B. O DICIONÁRIO ============================================
console.log('\nB. O DICIONÁRIO — o que cada termo é, e o que falta dito');
const dic = dicionario.gerar(BASE);
{
  const t = texto(dic);
  checar('gera um documento, com o id e a versão no manifesto',
    dic.ok === true && dic.documentos.length === 1 && dic.manifesto.id === 'produto:dicionario:bale-classico'
      && dic.versao === '9.9.9', dic.manifesto && dic.manifesto.id);
  checar('o documento declara a proveniência (produto, alfabeto, versão, licença) no cabeçalho',
    /produto: dicionário/.test(t) && /alfabeto: alfabeto-de-prova v7/.test(t)
      && /versao: 9\.9\.9/.test(t) && /licenca: licença de prova/.test(t));
  checar('as categorias saem na ordem declarada — «Passos» antes de «Posições»',
    t.indexOf('## Passos') !== -1 && t.indexOf('## Passos') < t.indexOf('## Posições'),
    [t.indexOf('## Passos'), t.indexOf('## Posições')]);

  checar('os termos de uma categoria saem em ordem alfabética',
    t.indexOf('### Battement tendu') < t.indexOf('### Plié'));

  checar('a definição presente sai; a que falta sai como [Preencher]',
    /a extensão da perna de trabalho/.test(t) && /\[Preencher: a definição do que acontece\]/.test(t));
  checar('a origem declarada sai; a que falta diz que sem ela não entra na edição paga',
    /fonte declarada na prova/.test(t)
      && /\[Preencher: de onde vem esta definição/.test(t) && /edição paga/.test(t));
  checar('a contagem do manifesto bate com o documento — 4 termos, 3 com definição, 3 com origem',
    dic.manifesto.contagens.termos === 4 && dic.manifesto.contagens.com_definicao === 3
      && dic.manifesto.contagens.com_origem === 3, dic.manifesto.contagens);

  // O COMPASSO É POR PISTA, e a conta é a do editor: quatro trechos de `Pé` em 4/4 dão 1,1,2,2.
  const compassos = [...t.matchAll(/^\| (\d+) \| [^|]+ \| [^|]+ \| Pé \|/gm)].map((m) => m[1]);
  checar('a decomposição sai em tabela, com o compasso por pista — 1, 1, 2, 2',
    JSON.stringify(compassos) === JSON.stringify(['1', '1', '2', '2']), compassos);
  checar('e a notação vai composta, como o documento a escreve',
    /`\[Pé: 1ª → \+]`/.test(t));
  checar('cada trecho leva o «o que acontece» dele',
    /extensão à frente/.test(t) && /extensão atrás/.test(t));

  // O VERBETE QUE NÃO FECHA NÃO PUBLICA A CONTAGEM.
  checar('o verbete que não fecha sai com [conferir] e o motivo, e não com o número torto',
    /\[conferir\].*`cobre` diz 12 tempos e a música declara 8/.test(t)
      && dic.manifesto.contagens.verbetes_que_nao_fecham === 1,
    dic.manifesto.contagens.verbetes_que_nao_fecham);
  checar('…e a lacuna do manifesto diz onde e porquê',
    dic.lacunas.some((l) => l.tipo === 'verbete-nao-fecha' && /8\|4\/4/.test(l.onde)));

  checar('o exercício sem verbete declara a lacuna, e é nomeado no manifesto',
    /\[Preencher: a decomposição em música/.test(t)
      && dic.lacunas.some((l) => l.tipo === 'exercicio-sem-verbete' && l.onde === 'fondu'),
    dic.lacunas.filter((l) => l.tipo === 'exercicio-sem-verbete').map((l) => l.onde));
  checar('a posição NÃO pede decomposição — o pedido é só do exercício',
    !dic.lacunas.some((l) => l.tipo === 'exercicio-sem-verbete' && l.onde === 'premiere'),
    dic.lacunas.filter((l) => l.tipo === 'exercicio-sem-verbete').map((l) => l.onde));

  checar('o comentário do alfabeto não vira exercício',
    t.indexOf('_comentario') === -1 && !dic.lacunas.some((l) => l.onde === '_comentario'));
}

// ================= C. O SYLLABUS ==============================================
console.log('\nC. O SYLLABUS — a ordem, a camada pedagógica, e o que falta');
const sil = syllabus.gerar(BASE);
{
  const t = texto(sil);
  checar('gera o índice e um documento por nível — 3 documentos para 2 níveis',
    sil.ok === true && sil.documentos.length === 3
      && sil.documentos[0].nome === 'syllabus-bale-classico.md', sil.documentos.map((d) => d.nome));
  checar('o manifesto lista os dois níveis, com a ordem e as contagens',
    sil.manifesto.niveis.length === 2 && sil.manifesto.niveis[0].id === 'n1'
      && sil.manifesto.niveis[0].ordem === 1 && sil.manifesto.niveis[0].unidades === 4,
    sil.manifesto.niveis);
  checar('o índice diz quantas unidades cada nível tem — e o nível vazio não é escondido',
    /\| 1 \| Nível 1 \| 4 \| 2 \| 2 \|/.test(t) && /\| 2 \| Nível 2 \| 0 \| 0 \| 0 \|/.test(t)
      && /Nível 2/.test(t) && /ainda não t[eê]m unidades/.test(t));

  const doN1 = sil.documentos.find((d) => d.nome === 'syllabus-n1.md').texto;
  checar('as unidades saem na ORDEM declarada, e não por alfabeto',
    doN1.indexOf('### 1. Battement tendu') < doN1.indexOf('### 2. Plié')
      && doN1.indexOf('### 2. Plié') < doN1.indexOf('### 3. Première position')
      && doN1.indexOf('### 3. Première position') < doN1.indexOf('### 4. termo-que-nao-existe'),
    (doN1.match(/^### \d+\. .+$/gm) || []));

  checar('a camada pedagógica sai quando existe, e com as três declarações',
    /\*\*Exige do corpo\.\*\* o pé esticado; o joelho firme/.test(doN1)
      && /\*\*Ensina\.\*\* a extensão sem transferir o peso/.test(doN1)
      && /\*\*Expressa\.\*\* a linha contínua/.test(doN1));
  checar('e o que falta sai como [Preencher], não como texto de encher',
    /\*\*Exige do corpo\.\*\* \[Preencher: exige do corpo\]/.test(doN1)
      && sil.lacunas.some((l) => l.tipo === 'unidade-sem-camada' && /Plié/.test(l.onde)));

  checar('a relação órfã é declarada, com o id que não existe',
    /\[conferir\].*termo-que-nao-existe/.test(doN1)
      && sil.lacunas.some((l) => l.tipo === 'relacao-orfa' && /termo-que-nao-existe/.test(l.onde)));
  checar('a unidade com decomposição mostra os tempos; a que não tem, declara a lacuna',
    /\*\*Decomposição\.\*\* 8 tempos em 4\/4/.test(doN1)
      && /\[Preencher: o exercício ainda não tem verbete\]/.test(doN1)
      && sil.lacunas.some((l) => l.tipo === 'unidade-sem-verbete'));
  checar('a unidade cujo verbete não fecha é marcada no próprio syllabus',
    /\[conferir: o `cobre` diz 12 tempos/.test(doN1)
      && sil.lacunas.some((l) => l.tipo === 'verbete-nao-fecha'));

  const doN2 = sil.documentos.find((d) => d.nome === 'syllabus-n2.md').texto;
  checar('o nível sem unidades diz que é a lacuna, e não que não ensina nada',
    /\[Preencher\]\*\* Este nível ainda não tem unidades declaradas/.test(doN2)
      && /publicá-lo vazio seria dizer/.test(doN2)
      && sil.lacunas.some((l) => l.tipo === 'nivel-sem-unidades' && l.onde === 'n2'));

  // UM SÓ NÍVEL NÃO GERA ÍNDICE — o documento do nível é o produto.
  const soN1 = syllabus.gerar(Object.assign({}, BASE, { nivel: 'n1' }));
  checar('pedido um nível só, sai um documento e nenhum índice',
    soN1.ok === true && soN1.documentos.length === 1 && soN1.documentos[0].nome === 'syllabus-n1.md',
    soN1.documentos.map((d) => d.nome));
  const inexistente = syllabus.gerar(Object.assign({}, BASE, { nivel: 'nao-existe' }));
  checar('um nível que não existe é RECUSADO, e não gera documento vazio',
    inexistente.ok === false && /não existe/.test(inexistente.erro)
      && inexistente.documentos.length === 0, inexistente.erro);
}

// ================= D. A COMPOSIÇÃO catálogo × escola ==========================
console.log('\nD. A COMPOSIÇÃO — o catálogo é o que se vende, e as adições não entram sozinhas');
{
  const semAdicoes = dicionario.gerar(Object.assign({}, BASE, { adicoes: ADICOES }));
  checar('por omissão, as adições da escola NÃO entram no dicionário',
    semAdicoes.manifesto.contagens.termos === 4
      && texto(semAdicoes).indexOf('Salão') === -1
      && semAdicoes.manifesto.fonte.vocabulario.incluidas === false,
    semAdicoes.manifesto.fonte.vocabulario);

  const comAdicoes = dicionario.gerar(Object.assign({}, BASE, { adicoes: ADICOES, incluirAdicoes: true }));
  checar('pedidas, entram — com o selo da origem e a contagem no manifesto',
    comAdicoes.manifesto.contagens.termos === 5
      && /### Salão/.test(texto(comAdicoes))
      && /acréscimo da escola/.test(texto(comAdicoes))
      && comAdicoes.manifesto.fonte.vocabulario.adicoes === 1,
    comAdicoes.manifesto.fonte.vocabulario);
  checar('e o documento avisa que NÃO é o do catálogo',
    /Adições da escola incluídas/.test(texto(comAdicoes)) && /NÃO é o do/.test(texto(comAdicoes)));

  // A PRECEDÊNCIA É UMA SÓ, e a escola ganha — mas o catálogo mantém a posição na ordem.
  const composto = comum.compor(VOCABULARIO, [{ id: 'plie', termo: 'Plié (escola)', categoria: 'passo' }]);
  const plie = composto.find((t) => t.id === 'plie');
  checar('a mesma chave nos dois lados: a escola ganha, e o resultado diz que ganhou',
    composto.length === VOCABULARIO.length && plie.termo === 'Plié (escola)'
      && plie.origem === 'escola', plie);
  checar('…e a ordem do catálogo não muda por causa de uma edição de escola',
    composto.map((t) => t.id).join(',') === VOCABULARIO.map((t) => t.id).join(','),
    composto.map((t) => t.id));
}

// ================= E. O DETERMINISMO ==========================================
console.log('\nE. O DETERMINISMO — mesma entrada, mesmo byte');
{
  const d1 = dicionario.gerar(BASE);
  const d2 = dicionario.gerar(BASE);
  checar('o dicionário sai igual em duas execuções',
    JSON.stringify(d1) === JSON.stringify(d2)
      && d1.documentos[0].texto === d2.documentos[0].texto);
  const s1 = syllabus.gerar(BASE);
  const s2 = syllabus.gerar(BASE);
  checar('o syllabus também — documentos e manifesto',
    JSON.stringify(s1) === JSON.stringify(s2));
}

// ================= F. O PRODUTO NÃO CARREGA RITMO =============================
console.log('\nF. O RITMO NÃO VIAJA NO PRODUTO (C19) — a turma é que o manda');
{
  const proibidos = ['dias', 'frequencia', 'periodoInicio', 'periodoFim', 'duracaoMin'];
  const nosManifestos = JSON.stringify([dic.manifesto, sil.manifesto]);
  checar('nenhum manifesto tem dias, frequência, período nem duração',
    proibidos.every((p) => nosManifestos.indexOf('"' + p + '"') === -1),
    proibidos.filter((p) => nosManifestos.indexOf('"' + p + '"') !== -1));
  checar('e nenhum documento os escreve', proibidos.every((p) => texto(dic).indexOf(p) === -1
    && texto(sil).indexOf(p) === -1));
}

// ================= G. O CATÁLOGO DE VERDADE ===================================
console.log('\nG. O CATÁLOGO DE VERDADE — do disco, sem rede, e as contagens batem');
{
  const catalogo = cli.catalogoDoDisco('bale-classico');
  const dReal = produtos.gerarDicionario(catalogo);
  const sReal = produtos.gerarSyllabus(catalogo);

  checar('o dicionário do catálogo real gera',
    dReal.ok === true && dReal.documentos.length === 1 && dReal.documentos[0].texto.length > 1000);
  checar('…e a contagem de termos é a do vocabulário',
    dReal.manifesto.contagens.termos === catalogo.vocabulario.length,
    { manifesto: dReal.manifesto.contagens.termos, ficheiro: catalogo.vocabulario.length });
  checar('…e cada termo sem origem declarada está nomeado nas lacunas',
    dReal.lacunas.filter((l) => l.tipo === 'termo-sem-fonte').length
      === catalogo.vocabulario.filter((t) => !String(t.fonte || '').trim()).length,
    dReal.lacunas.filter((l) => l.tipo === 'termo-sem-fonte').length);
  checar('…e o documento conta o que o manifesto conta',
    new RegExp('\\*\\*Conteúdo\\.\\*\\* ' + dReal.manifesto.contagens.termos + ' termo').test(texto(dReal)));

  checar('o syllabus do catálogo real cobre TODOS os níveis, e não só os que têm conteúdo',
    sReal.ok === true && sReal.manifesto.contagens.niveis === catalogo.progressao.turmas.length
      && sReal.documentos.length === catalogo.progressao.turmas.length + 1,
    { niveis: sReal.manifesto.contagens.niveis, docs: sReal.documentos.length });
  checar('…e o nível que não declarou nada está nas lacunas, com o nome',
    sReal.lacunas.filter((l) => l.tipo === 'nivel-sem-unidades').length
      === catalogo.progressao.turmas.length - new Set((catalogo.progressao.relacoes || []).map((r) => r.turma)).size,
    sReal.lacunas.filter((l) => l.tipo === 'nivel-sem-unidades').length);
  checar('…e toda unidade declarada aparece — o syllabus não perde nenhuma',
    sReal.manifesto.contagens.unidades === (catalogo.progressao.relacoes || []).length,
    { unidades: sReal.manifesto.contagens.unidades, relacoes: (catalogo.progressao.relacoes || []).length });
  checar('os dois manifestos nomeiam a mesma versão do alfabeto',
    dReal.manifesto.fonte.alfabeto.id === sReal.manifesto.fonte.alfabeto.id
      && dReal.manifesto.fonte.alfabeto.versao === sReal.manifesto.fonte.alfabeto.versao);
}

// ================= H. O CLI ===================================================
console.log('\nH. O CLI — escreve os documentos, e o --json imprime o manifesto');
{
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'produtos-prova-'));
  try {
    execFileSync('node', [path.join(RAIZ, 'motor', 'produtos.js'), 'dicionario', '--out', destino],
      { cwd: RAIZ, stdio: 'pipe' });
    const escritos = fs.readdirSync(destino);
    checar('o dicionário é escrito no destino pedido',
      escritos.length === 1 && escritos[0] === 'dicionario-bale-classico.md', escritos);
    checar('…e o ficheiro escrito é o documento gerado, não um resumo',
      /# Dicionário — /.test(fs.readFileSync(path.join(destino, escritos[0]), 'utf8')));

    const saida = execFileSync('node',
      [path.join(RAIZ, 'motor', 'produtos.js'), 'syllabus', '--json'],
      { cwd: RAIZ, stdio: 'pipe' }).toString();
    const manifesto = JSON.parse(saida);
    checar('o `--json` do syllabus imprime um manifesto legível por máquina',
      manifesto.produto === 'syllabus' && Array.isArray(manifesto.niveis)
        && manifesto.id === 'produto:syllabus:bale-classico', manifesto.id);

    const umNivel = execFileSync('node',
      [path.join(RAIZ, 'motor', 'produtos.js'), 'syllabus', '--nivel', 'bale-nivel-1', '--out', '-'],
      { cwd: RAIZ, stdio: 'pipe' }).toString();
    checar('o `--nivel` gera um só documento, e na saída padrão', /# Syllabus — Balé Nível 1/.test(umNivel)
      && !/syllabus-bale-classico\.md/.test(umNivel));
  } finally {
    fs.rmSync(destino, { recursive: true, force: true });
  }
}

console.log('');
if (falhas) {
  console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
  process.exit(1);
}
console.log('TUDO CERTO — ' + n + ' asserções: o dicionário e o syllabus são gerados do catálogo,');
console.log('declaram o que falta em vez de o inventar, não carregam ritmo, e o mesmo dado dá');
console.log('o mesmo byte.');
