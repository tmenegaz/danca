'use strict';

const fs = require('fs');

function celulasDaTabela(linha) {
  const texto = linha.trim();
  if (!texto.startsWith('|') || !texto.endsWith('|')) return null;

  const interior = texto.slice(1, -1);
  const celulas = [];
  let atual = '';
  for (let i = 0; i < interior.length; i++) {
    if (interior[i] === '\\' && interior[i + 1] === '|') {
      atual += '\\|';
      i++;
    } else if (interior[i] === '|') {
      celulas.push(atual.trim());
      atual = '';
    } else {
      atual += interior[i];
    }
  }
  celulas.push(atual.trim());
  return celulas;
}

function ehSeparador(celulas) {
  return celulas.every((celula) => /^:?-{2,}:?$/.test(celula));
}

function linhaDeTabela(celulas) {
  return '| ' + celulas.join(' | ') + ' |';
}

function partesDoMarkdown(markdown, nome) {
  const cabecalho = /^(---\r?\n[\s\S]*?\r?\n---)(?:\r?\n|$)/.exec(markdown);
  if (!cabecalho) {
    throw new Error('A fonte de ' + nome + ' precisa declarar front matter.');
  }
  return {
    cabecalho: cabecalho[1],
    corpo: markdown.slice(cabecalho[0].length).trim(),
  };
}

function transformarExercicios(markdown) {
  const linhas = markdown.split(/\r?\n/);
  const inicio = linhas.findIndex((linha) => /^## Exercícios da Aula \d+\b/.test(linha));
  if (inicio < 0) {
    throw new Error('A fonte de Notação não contém a seção "Exercícios da Aula NN".');
  }

  let fim = linhas.findIndex((linha, indice) => indice > inicio && /^##\s/.test(linha));
  if (fim < 0) fim = linhas.length;

  const numero = linhas[inicio].match(/^## Exercícios da Aula (\d+)\b/)[1];
  const secao = linhas.slice(inicio, fim);
  const resultado = [];
  let tabelasEncontradas = 0;

  for (let i = 0; i < secao.length; i++) {
    const cabecalho = celulasDaTabela(secao[i]);
    if (!cabecalho || i + 1 >= secao.length) {
      resultado.push(secao[i]);
      continue;
    }

    const separador = celulasDaTabela(secao[i + 1]);
    if (!separador || !ehSeparador(separador)) {
      resultado.push(secao[i]);
      continue;
    }

    const nomes = cabecalho.map((celula) => celula.replace(/\*/g, '').trim().toLocaleLowerCase('pt-BR'));
    const detalhada = nomes.length === 4
      && nomes[0] === 'compasso'
      && nomes[1] === 'contagem'
      && nomes[2] === 'notação'
      && nomes[3] === 'descrição';
    const registro = nomes.length === 2
      && nomes[0] === 'exercício'
      && nomes[1] === 'registro';

    if (!detalhada && !registro) {
      if (nomes.includes('notação') || nomes.includes('registro')) {
        throw new Error('Tabela de Notação não reconhecida na seção de exercícios: ' + secao[i]);
      }
      resultado.push(secao[i], secao[i + 1]);
      i++;
      continue;
    }

    const colunas = detalhada ? [0, 1, 3] : [0];
    const cabecalhoProsa = detalhada
      ? ['Compasso', 'Contagem', 'Descrição']
      : ['Exercício', 'Descrição'];
    const separadorProsa = detalhada
      ? separador.filter((_, indice) => colunas.includes(indice))
      : ['---', '---'];

    resultado.push(
      linhaDeTabela(cabecalhoProsa),
      linhaDeTabela(separadorProsa),
    );
    i++;
    tabelasEncontradas++;

    while (i + 1 < secao.length) {
      const celulas = celulasDaTabela(secao[i + 1]);
      if (!celulas) break;
      if (ehSeparador(celulas)) {
        throw new Error('Separador inesperado dentro da tabela de exercícios: ' + secao[i + 1]);
      }
      if (detalhada && celulas.length !== 4) {
        throw new Error('A tabela de Notação deve ter quatro colunas: ' + secao[i + 1]);
      }
      if (registro && celulas.length !== 2) {
        throw new Error('A tabela de Registro deve ter duas colunas: ' + secao[i + 1]);
      }
      resultado.push(detalhada
        ? linhaDeTabela(colunas.map((indice) => celulas[indice]))
        : linhaDeTabela([celulas[0], '[Preencher: descrição em prosa]']));
      i++;
    }
  }

  if (!tabelasEncontradas) {
    throw new Error('Nenhuma tabela de exercícios reconhecida na seção da Aula ' + numero + '.');
  }

  return resultado.join('\n');
}

function gerarAulaProsa(aula, notacao) {
  return aula.trimEnd() + '\n\n' + transformarExercicios(notacao) + '\n';
}

function gerarAulaNotacao(aula, notacao) {
  const aulaPartes = partesDoMarkdown(aula, 'Aula');
  const notacaoPartes = partesDoMarkdown(notacao, 'Notação');
  return notacaoPartes.cabecalho + '\n\n'
    + aulaPartes.corpo + '\n\n'
    + notacaoPartes.corpo + '\n';
}

if (require.main === module) {
  const modoNotacao = process.argv[2] === '--notacao';
  const inicioArgumentos = modoNotacao ? 3 : 2;
  const [arquivoAula, arquivoNotacao, arquivoSaida] =
    process.argv.slice(inicioArgumentos, inicioArgumentos + 3);
  if (!arquivoAula || !arquivoNotacao || !arquivoSaida) {
    console.error('Uso: node tools/gerar-aula-prosa.js [--notacao] <aula.md> <notacao.md> <saida.md>');
    process.exitCode = 2;
  } else {
    try {
      const aula = fs.readFileSync(arquivoAula, 'utf8');
      const notacao = fs.readFileSync(arquivoNotacao, 'utf8');
      const gerar = modoNotacao ? gerarAulaNotacao : gerarAulaProsa;
      fs.writeFileSync(arquivoSaida, gerar(aula, notacao), 'utf8');
    } catch (erro) {
      console.error('Não foi possível gerar a leitura da aula: ' + erro.message);
      process.exitCode = 1;
    }
  }
}

module.exports = { gerarAulaNotacao, gerarAulaProsa, transformarExercicios };
