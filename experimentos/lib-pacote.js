#!/usr/bin/env node
'use strict';

/*
 * lib-pacote.js — encontra um pacote de ciclo GERADO, sem nomear escola nenhuma.
 *
 * POR QUE EXISTE (21/10/2026). As provas escritas nesta semana apontavam para
 * `professores/sapo-bailarino/ciclos/ciclo-01-batata-bale-nivel-1-teste-2`. As escolas deste
 * protótipo são DESCARTÁVEIS por desenho — nascem para provar o modelo e são expurgadas
 * quando cumpriram o papel. Uma prova que escreve o nome de uma delas morre no dia do
 * expurgo, e morre por um motivo que não tem nada a ver com o que mede: o título que encolhe,
 * o menu que cabia, o front-matter que abria.
 *
 * É a MESMA lição do alfabeto de notação (`39e24c5`): o alfabeto não nomeia escola nenhuma,
 * nem viva nem expurgada, porque o que ele declara é uma escrita e não um ciclo. Aqui o que
 * se procura é uma FORMA — um pacote gerado —, e qualquer uma serve: as provas medem o
 * documento, não a escola.
 *
 * O QUE CONTA COMO PACOTE. Um diretório `professores/<professor>/ciclos/ciclo-NN-<escola>/`
 * com PELO MENOS UMA PÁGINA de documento dentro — `plano.html`, `aula-NN.html`, `notacao.html`,
 * `referencias.html`… O `index.html` NÃO serve de critério: ele também existe no ESQUELETO do
 * ciclo-zero (a pasta que a escola tem antes de haver documentos, com `assets/` e a
 * apresentação), e uma prova que o apanhasse mediria uma pasta sem nada para medir. Foi o que
 * aconteceu à primeira versão deste módulo: ela escolheu o esqueleto `ciclo-01-batata` e não
 * achou nem `aula-01.html` nem `captura-aula-01.html`.
 *
 * E O ESQUELETO TEM OUTRA ARMADILHA: o nome dele é PREFIXO do nome da variante que vive ao
 * lado (`ciclo-01-batata` e `ciclo-01-batata-bale-nivel-1-teste-2`), de modo que «todos os
 * ficheiros que começam por `<pacote>-`» apanha as fontes da OUTRA variante. Por isso as
 * fontes são filtradas pela família de documento — a MESMA lista que o índice usa
 * (`motor/nucleo/indices.js`), e não uma segunda opinião escrita aqui.
 *
 * A ESCOLHA É DETERMINÍSTICA — ordem alfabética do caminho —, e não «a primeira que aparecer»:
 * o sistema de ficheiros não promete ordem, e uma prova que mede um pacote diferente a cada
 * execução não é reproduzível.
 */

const fs = require('fs');
const path = require('path');
const { tipoDoDocumento } = require('../motor/nucleo/indices.js');

const RAIZ = path.join(__dirname, '..');
const CICLOS = path.join(RAIZ, 'professores');

/** Todos os pacotes gerados, em ordem alfabética e como caminho RELATIVO à raiz. */
function pacotes() {
  const achados = [];
  let professores = [];
  try {
    professores = fs.readdirSync(CICLOS, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return achados;
  }
  for (const professor of professores) {
    const dir = path.join(CICLOS, professor, 'ciclos');
    let entradas = [];
    try {
      entradas = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entradas) {
      if (!e.isDirectory()) continue;
      if (!/^ciclo-\d{2}-.+/.test(e.name)) continue;
      let paginasDoPacote = [];
      try {
        paginasDoPacote = fs.readdirSync(path.join(dir, e.name))
          .filter((n) => n.endsWith('.html') && n !== 'index.html');
      } catch {
        continue;
      }
      if (!paginasDoPacote.length) continue;     // esqueleto do ciclo-zero, não pacote
      achados.push(path.posix.join('professores', professor, 'ciclos', e.name));
    }
  }
  return achados.sort();
}

/**
 * Um pacote gerado. Falha ALTO e com o remédio escrito quando não há nenhum — uma prova que
 * devolvesse `null` e medisse o vazio passaria sem provar nada, que é o pior desfecho possível
 * para uma prova.
 */
function umPacote() {
  const lista = pacotes();
  if (!lista.length) {
    throw new Error('lib-pacote: nenhum pacote de ciclo gerado no repositório. Gere um '
      + '(tools/gerar-ciclo.sh) — as provas que usam este módulo medem um pacote REAL, e sem '
      + 'um elas não teriam o que medir.');
  }
  return lista[0];
}

/** As páginas HTML do pacote, ordenadas. */
function paginas(pacote) {
  const dir = path.join(RAIZ, pacote);
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith('.html'))
    .sort();
}

/** O primeiro nome de página do pacote que casa com o padrão (ou `null`). */
function umaPagina(pacote, padrao) {
  return paginas(pacote).find((n) => padrao.test(n)) || null;
}

/**
 * As FONTES variantes do ciclo a que o pacote pertence — `ciclo-01-<escola>*.md`, sem o `.conf`
 * e sem os arquivos que não viram página (`-dados*`, `-po`, `-plano`).
 *
 * O `pacote` termina no nome da variante: `…/ciclos/ciclo-01-<escola>`, e as fontes vivem em
 * `…/ciclos/ciclo-01-<escola>-<documento>.md`, ao lado da pasta.
 */
function fontesDoPacote(pacote) {
  const dir = path.join(RAIZ, path.dirname(pacote));
  const variante = path.basename(pacote);
  return fs.readdirSync(dir)
    .filter((n) => n.startsWith(variante + '-') && /\.md$/.test(n))
    // A família vem do índice, não de uma lista paralela: aqui só interessam os documentos que
    // viram PÁGINA. O `-po`, o `-plano` e o `-dados` também são fontes, mas têm validadores
    // próprios e vêm de outros envelopes — quem os confere não é uma prova de documento.
    .filter((n) => {
      const tipo = tipoDoDocumento(n, variante.replace(/^ciclo-\d{2}-/, ''));
      return tipo === 'aula' || tipo === 'captura' || tipo === 'harmonizacao'
        || tipo === 'notacao' || tipo === 'glossario' || tipo === 'referencias';
    })
    .sort();
}

module.exports = { RAIZ, pacotes, umPacote, paginas, umaPagina, fontesDoPacote };
