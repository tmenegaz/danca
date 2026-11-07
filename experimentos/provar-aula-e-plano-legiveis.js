#!/usr/bin/env node
'use strict';

/*
 * provar-aula-e-plano-legiveis.js — o documento que o gerador escreve é o que o validador lê.
 *
 * O QUE ESTA PROVA TRAVA. O gerador (`motor/nucleo/derivar-ciclo.js`) escreve o `.md` e o
 * validador (`tools/validar-aula-ciclo.js`, `tools/validar-plano-ciclo.js`,
 * `tools/validar-captura-ciclo.js`) lê-o de volta para produzir o JSON de dados. Os dois são
 * escrita da mesma casa, e por isso a divergência entre eles é invisível: cada um está «certo»
 * do seu lado, o validador imprime `ok`, e o pacote sai com o campo vazio.
 *
 * Foram três, todas medidas a 20/10/2026 na primeira aula derivada da escola `batata`:
 *
 *   1. O TÍTULO FORA DO MAPA. O §4 sai do gerador como `## 4. Bloco de musicalidade`, sem o
 *      parêntese dos tempos que as duas entradas do mapa traziam (elas nasceram de documentos
 *      escritos à mão). A seção inteira era descartada: `blocoDeMusicalidade` não nascia.
 *   2. A CÉLULA QUE ATRAVESSAVA LINHAS. O «Parâmetro de medição» era escrito com quebras de
 *      linha dentro de uma célula de tabela. Uma célula não atravessa linhas: o parser fechava a
 *      tabela na primeira quebra e abria OUTRA com o resto, e as linhas seguintes (`Duração`,
 *      `Volume ativo`) passavam a ser cabeçalho da tabela descartada. `identificacao` saía sem
 *      `duracao` nem `volumeAtivo`, com o aviso «uma SEGUNDA tabela ficou de fora».
 *   3. O AVISO QUE MENTIA. Uma seção cuja tabela É o campo — e que ainda tem uma nota em citação,
 *      como a distribuição do volume — era contada como «só tem citação»: o validador dizia «o
 *      campo `distribuicaoDeVolume` não é criado» com o campo criado e preenchido.
 *
 * O QUE ESTA PROVA NÃO FAZ. Não gera o pacote (isso é `tools/gerar-ciclo.sh`, que precisa de
 * pandoc, TeX e pdfinfo). Ela mede o CONTRATO entre a derivação e a leitura, que é a parte que
 * pode divergir em silêncio.
 *
 * SEM REDE, SEM DISCO ALÉM DOS TEMPORÁRIOS: o PO e o plano são construídos aqui, na forma que o
 * formulário grava; a derivação é a de produção; os validadores correm como processo, sobre os
 * `.md` que a derivação escreveu.
 *
 *   node experimentos/provar-aula-e-plano-legiveis.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const { derivarAula01, derivarCaptura, declaracaoDeCaptura } = require('../motor/nucleo/derivar-ciclo.js');
const { derivarPlano } = require('../motor/nucleo/derivar-plano-ciclo.js');

/**
 * O PROFESSOR DE QUE SE PEGAM OS SCHEMAS — descoberto, e não nomeado (07/11/2026).
 *
 * Aqui esteve `professores/tiago-menegaz/`, escrito à mão em quatro sítios. A limpeza do
 * repositório apagou essa pasta, e a prova morreu num ENOENT que nada dizia sobre o contrato
 * que ela mede — o dos validadores com a derivação. Não importa QUAL professor: o conteúdo dos
 * schemas varia por escola, não por pessoa, e a variante que esta prova acrescenta é a dela.
 * Descobrir em vez de nomear é o que impede a prova de morrer quando um professor sai.
 */
function professorDeProva() {
  const base = path.join(RAIZ, 'professores');
  const faltando = (slug) => ['aula', 'plano', 'captura']
    .some((t) => !fs.existsSync(path.join(base, slug, 'ciclos', `ciclo-01-${t}-schema.json`)));
  for (const slug of fs.readdirSync(base).sort()) {
    if (!faltando(slug)) return slug;
  }
  console.error('provar-aula-e-plano-legiveis: nenhum professor com os cinco schemas do ciclo'
    + ' — sem uma base real, a prova não mede o que diz medir.');
  process.exit(1);
}

const PROFESSOR = professorDeProva();

let n = 0;
let falhas = 0;
function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  \u2713 ' + rotulo); return; }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// --------------------------------------------------------------- as fontes de prova

const CONTEXTO = { escola: 'Batata', professor: PROFESSOR, ciclo: '01', turma: 'Balé Nível 1' };

/** A resposta no formato do envelope. */
const r = (valor) => ({ valor: valor, origem: 'perguntado', respondente: 'professor', nota: null });

/**
 * O PO com DUAS dimensões e TRÊS marcos — o suficiente para o §4 (musicalidade) existir e para o
 * parâmetro de medição ter mais de uma linha, que é onde os dois primeiros defeitos aparecem.
 */
const PO = {
  id: 'po-20261020-0000',
  fonte: 'po',
  contexto: CONTEXTO,
  respostas: {
    sujeitos: r(['Aluna A', 'Aluna B']),
    'dimensoes-de-observacao': r(['Técnica — Solo', 'Técnica — Musicalidade']),
    'itens-por-dimensao': r([
      { sujeito: 'Técnica — Solo', itens: 'Eixo do corpo\nAlinhamento do pé' },
      { sujeito: 'Técnica — Musicalidade', itens: 'Resposta ao pulso' },
    ]),
    'linha-de-base': r([
      { sujeito: 'Aluna A', 'Observado na aula': 'ok' },
      { sujeito: 'Aluna B', 'Observado na aula': 'parcial' },
    ]),
    objetivo: r('observar o eixo e a resposta ao pulso'),
    'plano-de-ensino': r('plano-20261020-0000'),
  },
};

const PLANO = {
  id: 'plano-20261020-0000',
  fonte: 'plano',
  contexto: CONTEXTO,
  respostas: {
    'objetivo-geral': r('Consolidar o eixo vertical e a transferência de peso em três encontros.'),
    'marcos-por-aula': r([
      'reconhecer o apoio e alinhar o eixo vertical',
      'transferir o peso sem perder o alinhamento',
      'sustentar a transferência com resposta ao pulso',
    ]),
    'estrutura-de-cada-aula': r([
      { marco: 1, marcados: ['Solo', 'Barra'] },
      { marco: 2, marcados: ['Barra', 'Centro'] },
      { marco: 3, marcados: ['Centro', 'Musicalidade'] },
    ]),
    'aula-1-parametro': r([
      { marco: 1, marcados: ['Plié', 'Battement tendu'] },
      { marco: 2, marcados: ['Port de bras'] },
      { marco: 3, marcados: ['Rond de jambe'] },
    ]),
    'distribuicao-de-volume': r({
      unidade: 'percentual',
      linhas: [
        { Bloco: 'Solo', 'Proporção alvo': '30%', Justificativa: 'Aquecimento.' },
        { Bloco: 'Barra', 'Proporção alvo': '30%', Justificativa: 'Apoio.' },
        { Bloco: 'Centro', 'Proporção alvo': '30%', Justificativa: 'Sequência.' },
        { Bloco: 'Musicalidade', 'Proporção alvo': '10%', Justificativa: 'Pulso.' },
      ],
    }),
    'aula-1-sequencia': r([
      { Bloco: 'Solo', 'Objetivo específico': '1 — reconhecer o apoio e alinhar o eixo vertical', 'Conteúdo do nível': 'Plié', Tempos: '8', Compasso: '4/4' },
      { Bloco: 'Barra', 'Objetivo específico': '2 — transferir o peso sem perder o alinhamento', 'Conteúdo do nível': 'Port de bras', Tempos: '8', Compasso: '4/4' },
    ]),
    'condicoes-preliminares': r('Sala com barra, espelho e aparelho de som.'),
    'criterio-de-extensao': r('Estender o ciclo em duas aulas se o último marco não for alcançado.'),
    referencias: r('RAD (2015).'),
    'musicas-videos': r('Faixa em 4/4.'),
    repertorio: r('Sequência com plié e port de bras.'),
    proveniencia: r(['Plano derivado da metodologia RAD, adaptado ao âmbito da turma']),
    'contexto-metodologia': r('RAD'),
    'contexto-notacao': r('Benesh'),
  },
};

const CALIBRACAO = { duracaoMinutos: 50, volumeMin: 80, volumeMax: 100 };

const TEMP = fs.mkdtempSync(path.join(os.tmpdir(), 'legiveis-'));
function escrever(nome, texto) {
  const p = path.join(TEMP, nome);
  fs.writeFileSync(p, texto, 'utf8');
  return p;
}

/** Corre um validador e devolve `{codigo, saida, json}`. */
function validar(script, schema, md, extras) {
  const args = [path.join(RAIZ, 'tools', script), path.join(RAIZ, schema), md].concat(extras || []);
  try {
    const saida = execFileSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { codigo: 0, saida };
  } catch (e) {
    return { codigo: e.status === undefined ? 1 : e.status, saida: String((e.stdout || '') + (e.stderr || '')) };
  }
}

function validarJson(script, schema, md, extras) {
  const resultado = validar(script, schema, md, (extras || []).concat(['--json']));
  const linhas = resultado.saida.split('\n');
  const inicio = linhas.findIndex((l) => l.trim().startsWith('{'));
  if (inicio === -1) return { codigo: resultado.codigo, dados: null, saida: resultado.saida };
  let dados = null;
  try { dados = JSON.parse(linhas.slice(inicio).join('\n')); } catch { dados = null; }
  return { codigo: resultado.codigo, dados, saida: resultado.saida };
}

// ---------------------------------------------------------------------------- a prova

function principal() {
  console.log('\n1. A AULA derivada é legível pelo validador da aula');
  const aula = derivarAula01({ plano: PLANO, po: PO, contexto: CONTEXTO, calibracao: CALIBRACAO });
  const mdAula = escrever('aula.md', aula.markdown || aula);
  const vAula = validarJson('validar-aula-ciclo.js', `professores/${PROFESSOR}/ciclos/ciclo-01-aula-schema.json`, mdAula);
  checar('o validador da aula aceita o documento que o gerador escreveu', vAula.codigo === 0, vAula.saida.trim().split('\n').slice(-3));
  const dadosAula = vAula.dados || {};

  // (1) O TÍTULO DO §4 ESTÁ NO MAPA. Sem isto, a seção inteira é descartada em silêncio: o
  // validador imprime `ok` e o campo não nasce. A asserção é sobre o CAMPO, não sobre o título —
  // é o campo que o formulário de lançamento consome.
  checar('a seção «Bloco de musicalidade» chega a campo (blocoDeMusicalidade)',
    Boolean(dadosAula.blocoDeMusicalidade) && String(JSON.stringify(dadosAula.blocoDeMusicalidade)).length > 4,
    dadosAula.blocoDeMusicalidade);

  // (2) A CÉLULA NÃO ATRAVESSA LINHAS. O §1 é item/valor: se a célula do parâmetro se partir, as
  // linhas seguintes viram cabeçalho de outra tabela e desaparecem.
  const identificacao = dadosAula.identificacao || {};
  checar('a identificação da aula traz a duração', Boolean(identificacao.duracao), identificacao.duracao);
  checar('e traz o volume ativo', Boolean(identificacao.volumeAtivo), identificacao.volumeAtivo);
  checar('e o parâmetro de medição com os TRÊS marcos, numa linha',
    Boolean(identificacao.parametroDeMedicao)
    && !/\n/.test(String(identificacao.parametroDeMedicao))
    && ['1', '2', '3'].every((k) => String(identificacao.parametroDeMedicao).indexOf('**' + k + '**') !== -1
      || String(identificacao.parametroDeMedicao).indexOf(k) !== -1),
    identificacao.parametroDeMedicao);

  // O aviso da segunda tabela não pode voltar: ele é o SINTOMA do defeito (2).
  checar('o validador não avisa de tabela descartada no bloco de validação',
    !/SEGUNDA tabela/.test(vAula.saida), vAula.saida.trim().split('\n').slice(-3));
  checar('e não avisa de seção fora do mapa', !/não está no mapa das seções/.test(vAula.saida));

  console.log('\n2. O PLANO derivado é legível pelo validador do plano');
  const plano = derivarPlano(PLANO);
  const mdPlano = escrever('plano.md', plano.markdown || plano);
  const vPlano = validarJson('validar-plano-ciclo.js', `professores/${PROFESSOR}/ciclos/ciclo-01-plano-schema.json`, mdPlano);
  checar('o validador do plano aceita o documento que o gerador escreveu', vPlano.codigo === 0,
    vPlano.saida.trim().split('\n').slice(-3));
  const dadosPlano = vPlano.dados || {};

  // (3) O AVISO NÃO MENTE. O bloco da distribuição do volume tem tabela E uma nota em citação;
  // o campo é criado, e o validador não pode dizer o contrário.
  checar('a distribuição do volume chega a campo, com as linhas',
    Array.isArray(dadosPlano.distribuicaoDeVolume) && dadosPlano.distribuicaoDeVolume.length > 0,
    dadosPlano.distribuicaoDeVolume);
  checar('e o validador não a anuncia como «só citação»',
    !/só tem citação/.test(vPlano.saida), vPlano.saida.trim().split('\n').slice(-3));

  console.log('\n3. A CAPTURA derivada é legível pelo validador da captura');
  const folha = derivarCaptura({ po: PO, contexto: CONTEXTO });
  const mdCaptura = escrever('captura.md', folha.markdown || folha);
  const declaracao = declaracaoDeCaptura({ po: PO, escola: 'Batata' });
  // O schema em disco é o das variantes reais; para esta prova, a declaração é a que o PO desta
  // prova produz — é a mesma que o «Guardar» grava no schema.
  //
  // O schema em disco é o das variantes reais (`professorDeProva`, no topo): a variante que
  // interessa é a que esta prova acrescenta (`prova-legiveis`), e a base vem de quem existe.
  const schemaDaProva = JSON.parse(fs.readFileSync(
    path.join(RAIZ, `professores/${PROFESSOR}/ciclos/ciclo-01-captura-schema.json`), 'utf8'));
  schemaDaProva._declaracao = schemaDaProva._declaracao || {};
  schemaDaProva._declaracao.porVariante = schemaDaProva._declaracao.porVariante || {};
  schemaDaProva._declaracao.porVariante['prova-legiveis'] = declaracao;
  const caminhoSchema = escrever('captura-schema.json', JSON.stringify(schemaDaProva, null, 2) + '\n');
  // `validar()` resolve o schema por `path.join(RAIZ, schema)` — aqui o schema é um TEMPORÁRIO, e
  // por isso a chamada é directa: o caminho absoluto não passa pela raiz do repositório.
  const vCaptura2 = (() => {
    try {
      const saida = execFileSync(process.execPath, [
        path.join(RAIZ, 'tools/validar-captura-ciclo.js'), caminhoSchema, mdCaptura, '--variante', 'prova-legiveis',
      ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      return { codigo: 0, saida };
    } catch (e) {
      return { codigo: e.status === undefined ? 1 : e.status, saida: String((e.stdout || '') + (e.stderr || '')) };
    }
  })();
  checar('o validador da captura aceita a folha com a declaração do PO', vCaptura2.codigo === 0,
    vCaptura2.saida.trim().split('\n').slice(-3));
  checar('e nenhuma coluna sai sem chave (a declaração cobre a folha)',
    !/coluna da folha não declarada/.test(vCaptura2.saida), vCaptura2.saida.trim().split('\n').slice(-3));

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  try { fs.rmSync(TEMP, { recursive: true, force: true }); } catch { /* temporário */ }
  process.exit(falhas === 0 ? 0 : 1);
}

principal();
