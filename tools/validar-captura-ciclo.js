#!/usr/bin/env node
'use strict';

/*
 * validar-captura-ciclo.js — lê a FOLHA DE CAPTURA como config legível por máquina.
 *
 *   uso: node tools/validar-captura-ciclo.js <schema.json> <ciclo-XX-<escola>-captura-aula-NN.md> [--json]
 *
 * IRMÃO do `validar-po-ciclo.js` e do `validar-plano-ciclo.js` — e distingue-se deles por isto:
 * **a folha varia por ciclo**, e os títulos das seções também ("Bloco 1 — Técnica (syllabus RAD)"
 * no Duo; "Bloco 1 — Técnica (método RAD)" e um "Bloco 2 — Par" a mais no Ritmos). Um mapa de
 * seções como o dos irmãos não serve: teria de ser escrito à mão por ciclo — que é exatamente o
 * problema que este extrator resolve.
 *
 * Então a leitura aqui é ESTRUTURAL, não por nome:
 *
 *   · cada `## Seção` é um BLOCO (o que vem antes da primeira é o `cabecalho`);
 *   · a primeira TABELA do bloco dá as COLUNAS (os cabeçalhos, menos o primeiro) e o GRÃO (o
 *     primeiro cabeçalho: "Aluna", "Aluna(o)", "Dupla");
 *   · as linhas da tabela viram as LINHAS (a primeira célula: os alunos, ou as duplas);
 *   · os RÓTULOS em negrito (`**Data:**`, `**Plano seguido?**`) são colhidos como os campos do
 *     bloco — é por eles que o cabeçalho, as condições de contorno (P-11) e o fecho aparecem.
 *
 * AS PRIMITIVAS SÃO DO CONTRATO (`tools/lib-extracao-md.js`): `celulasDaLinha`, `ehSeparador`,
 * `textoDaCelula`, `chaveDaColuna` — o mesmo jeito de partir uma linha de tabela que o PO e o
 * plano usam. O que é DESTE documento é a leitura estrutural, e o schema que ele valida.
 *
 * A SAÍDA, com `--json`, é o JSON no **stdout** (o resumo humano vai para o stderr) — como os
 * irmãos, porque é assim que o `gerar-ciclo.sh` grava `captura-XX.json` no pacote.
 */

const fs = require('fs');
const path = require('path');
const {
  lerYamlCabecalho, celulasDaLinha, ehSeparador, textoDaCelula, chaveDaColuna,
} = require('./lib-extracao-md.js');
const { validar } = require('./lib-validacao-md.js');

/** O grão de um bloco, a partir do primeiro cabeçalho da tabela. */
const graoDe = (cabecalho) => {
  const t = String(cabecalho).toLowerCase();
  if (/dupla/.test(t)) return 'dupla';
  if (/alun/.test(t)) return 'aluna';
  return chaveDaColuna(cabecalho) || 'item';
};

/** A leitura estrutural da folha: os blocos, com as colunas, o grão e as linhas. */
function lerBlocos(linhas) {
  // O que vem antes do primeiro `##` é o cabeçalho da folha (data, presentes, início, fim…).
  const blocos = [{ titulo: 'cabecalho', tipo: 'texto', rotulos: [] }];
  let atual = blocos[0];
  const rotulosDe = (linha) => {
    const re = /\*\*([^*]+?)\*\*/g;
    let m;
    while ((m = re.exec(linha)) !== null) {
      const t = m[1].trim().replace(/[?:]\s*$/, '');
      if (t && !atual.rotulos.includes(t)) atual.rotulos.push(t);
    }
  };

  linhas.forEach((linha) => {
    const secao = /^##\s+(.+?)\s*$/.exec(linha);
    if (secao) {
      atual = { titulo: secao[1], tipo: 'texto', rotulos: [] };
      blocos.push(atual);
      return;
    }
    if (/^\|/.test(linha)) {
      const celulas = celulasDaLinha(linha);
      if (ehSeparador(celulas)) return;
      if (!atual.colunas) {                                     // a 1ª linha é o cabeçalho
        atual.tipo = 'tabela';
        atual.grao = graoDe(textoDaCelula(celulas[0] || ''));
        atual.colunas = celulas.slice(1).map(textoDaCelula);
        atual.linhas = [];
        return;
      }
      const rotulo = textoDaCelula(celulas[0] || '');
      if (rotulo) atual.linhas.push(rotulo);
      return;
    }
    rotulosDe(linha);
  });
  // Blocos sem nada (nem tabela, nem rótulo) não entram: são ruído de formatação.
  return blocos.filter((b) => b.tipo === 'tabela' || b.rotulos.length);
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const [caminhoSchema, caminhoCaptura] = args.filter((a) => !a.startsWith('--'));
  if (!caminhoSchema || !caminhoCaptura) {
    console.error('uso: node tools/validar-captura-ciclo.js <schema.json>'
      + ' <ciclo-XX-<escola>-captura-aula-NN.md> [--json]');
    return 2;
  }

  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(caminhoSchema, 'utf8'));
  } catch (e) {
    console.error(`erro: não consegui ler o schema ${caminhoSchema} (${e.message})`);
    return 1;
  }
  if (!Array.isArray(schema.required)) {
    console.error(`erro: o schema ${path.basename(caminhoSchema)} não declara 'required'`);
    return 1;
  }

  let linhas;
  try {
    linhas = fs.readFileSync(caminhoCaptura, 'utf8').split('\n');
  } catch (e) {
    console.error(`erro: não consegui ler ${caminhoCaptura} (${e.message})`);
    return 1;
  }

  const meta = lerYamlCabecalho(linhas);
  const blocos = lerBlocos(linhas);
  const campos = {
    escola: meta.escola || '',
    ciclo: meta.ciclo || '',
    aula: meta.aula || '',
    folha: path.basename(caminhoCaptura),
    blocos,
  };

  const { erros, avisos, provisorios } = validar(campos, schema, {});
  const comTabela = blocos.filter((b) => b.tipo === 'tabela');
  const resumo = `captura: ${comTabela.length} bloco(s) com tabela`;
  const detalhe = comTabela.map((b) => `${b.titulo} [${b.grao}: ${b.colunas.join(', ')}]`).join(' · ');

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
    if (erros.length) erros.forEach((e) => console.error(`  ERRO  ${e}`));
    avisos.forEach((a) => console.error(`  aviso ${a}`));
    console.error(`${resumo} · ${detalhe}`);
    return erros.length ? 1 : 0;
  }

  console.log(`folha: ${campos.folha} · ciclo ${campos.ciclo} · aula ${campos.aula}`
    + ` · escola ${campos.escola}`);
  blocos.forEach((b) => {
    if (b.tipo === 'tabela') {
      console.log(`  bloco   ${b.titulo}`);
      console.log(`          grão: ${b.grao} · ${b.linhas.length} linha(s)`
        + `${b.linhas.length ? ` (${b.linhas.slice(0, 3).join(', ')}${b.linhas.length > 3 ? ', …' : ''})` : ''}`);
      b.colunas.forEach((c) => console.log(`          coluna: ${c}`));
    } else {
      console.log(`  bloco   ${b.titulo} — rótulos: ${b.rotulos.join(' · ')}`);
    }
  });
  avisos.forEach((a) => console.log(`  aviso   ${a}`));
  erros.forEach((e) => console.log(`  ERRO    ${e}`));
  console.log(`\n${erros.length ? 'FALHOU' : 'OK'}: ${erros.length} erro(s), `
    + `${avisos.length} aviso(s)${provisorios.length ? `, ${provisorios.length} provisório(s)` : ''}.`);
  return erros.length ? 1 : 0;
}

process.exit(main());

