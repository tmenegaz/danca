#!/usr/bin/env node
'use strict';

/*
 * validar-captura-ciclo.js — lê a FOLHA DE CAPTURA como config legível por máquina.
 *
 *   uso: node tools/validar-captura-ciclo.js <schema.json> <ciclo-XX-<escola>-captura-aula-NN.md>
 *                                            [--variante <slug>] [--json]
 *
 * IRMÃO do `validar-po-ciclo.js` e do `validar-plano-ciclo.js` — e distingue-se deles por isto:
 * **a folha varia por ciclo**, e os títulos das seções também ("Bloco 1 — Técnica (syllabus RAD)"
 * no Duo; "Bloco 1 — Técnica (método RAD)" e um "Bloco 2 — Par" a mais no Ritmos). Um mapa de
 * seções como o dos irmãos não serve: teria de ser escrito à mão por ciclo — que é exatamente o
 * problema que este extrator resolve.
 *
 * A leitura da FOLHA é ESTRUTURAL, não por nome:
 *
 *   · cada `## Seção` é um BLOCO (o que vem antes da primeira é o `cabecalho`);
 *   · a primeira TABELA do bloco dá as COLUNAS (os cabeçalhos, menos o primeiro) e o GRÃO SUGERIDO
 *     (o primeiro cabeçalho: "Aluna", "Aluna(o)", "Dupla");
 *   · as linhas da tabela viram as LINHAS (a primeira célula: os alunos, ou as duplas);
 *   · os `### <nome>` do bloco entram em `secoes`, e o cabeçalho repetido de uma tabela SEGUINTE é
 *     reconhecido e pulado — é ele que, sem isto, virava "linha" no config (a linha de base do
 *     Ritmos é uma tabela POR aluna);
 *   · os RÓTULOS em negrito (`**Data:**`, `**Plano seguido?**`) viram os campos do bloco.
 *
 * E o que a folha NÃO pode dizer vem do SCHEMA (`_declaracao.porVariante`), que é a autoridade
 * sobre as CHAVES e os TIPOS: cada coluna sai como `{ rotulo, chave, tipo }`, e o GRÃO passa a ser
 * o declarado (o do cabeçalho é sugestão). Coluna ou bloco que o schema não declara **não é
 * inventado**: sai com `chave: null` e um erro — o gerador para, e quem lê sabe o que falta.
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

/** O grão que o CABEÇALHO sugere. A declaração do schema é que decide — ver `enriquecer`. */
const graoDe = (cabecalho) => {
  const t = String(cabecalho).toLowerCase();
  if (/dupla/.test(t)) return 'dupla';
  if (/alun/.test(t)) return 'aluna';
  return chaveDaColuna(cabecalho) || 'item';
};

/**
 * A leitura estrutural da folha: os blocos, com as colunas, o grão sugerido e as linhas.
 *
 * Duas dores de folha real estão tratadas aqui:
 *   · os `### <apelido>` (a linha de base do Ritmos é uma tabela POR aluna): o nome da seção vai
 *     para `secoes`, e o cabeçalho da tabela seguinte é reconhecido e PULADO — sem isto ele virava
 *     "linha" do config;
 *   · o grão do cabeçalho é SUGESTÃO, guardada em `graoDaFolha`: no bloco por aluna o primeiro
 *     cabeçalho é a pergunta do PO ("O que o PO declara que ela precisa desenvolver"), que não é
 *     grão nenhum. Quem decide é o schema, e a divergência é reportada.
 */
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

  // O que decide se a linha `|` é cabeçalho: o que vem DEPOIS dela — a linha de traços. Comparar
  // o TEXTO do cabeçalho não serve: a folha escreve "que ela precisa" numa seção e "que ele
  // precisa" noutra, e o segundo deixava de ser reconhecido (virava linha de dado).
  const proximaEhSeparador = (i) => {
    for (let j = i + 1; j < linhas.length; j++) {
      const l = linhas[j].trim();
      if (!l) continue;
      return /^\|/.test(l) ? ehSeparador(celulasDaLinha(l)) : false;
    }
    return false;
  };

  linhas.forEach((linha, i) => {
    const secao = /^##\s+(.+?)\s*$/.exec(linha);
    if (secao) {
      atual = { titulo: secao[1], tipo: 'texto', rotulos: [] };
      blocos.push(atual);
      return;
    }
    const sub = /^###\s+(.+?)\s*$/.exec(linha);
    if (sub) {
      // As seções são colhidas SEMPRE: a primeira delas (a da 1ª aluna) vem ANTES da primeira
      // tabela do bloco, e é ela que diz que o bloco é "uma tabela por seção". Bloco que não é
      // tabela não as emite (o `enriquecer` só põe `secoes` em bloco de tabela).
      atual.secoes = atual.secoes || [];
      if (!atual.secoes.includes(sub[1])) atual.secoes.push(sub[1]);
      return;
    }
    if (/^\|/.test(linha)) {
      const celulas = celulasDaLinha(linha);
      if (ehSeparador(celulas)) return;
      const texto = celulas.map(textoDaCelula);
      if (!atual.colunasBrutas) {                             // a 1ª linha é o cabeçalho
        atual.tipo = 'tabela';
        atual.graoDaFolha = graoDe(texto[0] || '');
        atual.colunasBrutas = texto.slice(1);
        atual.linhas = [];
        return;
      }
      // Cabeçalho de uma tabela SEGUINTE (as seções `###`): não é dado.
      if (proximaEhSeparador(i)) {
        atual.cabecalhosRepetidos = (atual.cabecalhosRepetidos || 0) + 1;
        return;
      }
      const rotulo = texto[0] || '';
      if (rotulo) atual.linhas.push(rotulo);
      return;
    }
    rotulosDe(linha);
  });
  // Blocos sem nada (nem tabela, nem rótulo) não entram: são ruído de formatação.
  return blocos.filter((b) => b.tipo === 'tabela' || b.rotulos.length);
}

/**
 * A DECLARAÇÃO do schema entra aqui: cada coluna da folha ganha `{rotulo, chave, tipo}`, e o grão
 * passa a ser o declarado. Coluna ou bloco que o schema não declara NÃO é inventado: sai
 * `chave: null` e um ERRO (o gerador para — é a regra da peça: reportar, não inventar).
 */
function enriquecer(blocos, declaracao) {
  const erros = [];
  const avisos = [];
  const declarados = (declaracao && declaracao.blocos) || {};

  const saida = blocos.map((b) => {
    if (b.tipo !== 'tabela') {
      return { titulo: b.titulo, tipo: b.tipo, rotulos: b.rotulos };
    }
    const d = declarados[b.titulo];
    if (!d) erros.push(`bloco da folha não declarado no schema: '${b.titulo}'`);

    const colunas = (b.colunasBrutas || []).map((rotulo) => {
      const c = d && d.colunas && d.colunas[rotulo];
      if (!c) {
        erros.push(`coluna da folha não declarada no schema: '${b.titulo}' → '${rotulo}'`);
        return { rotulo, chave: null, tipo: null };
      }
      return { rotulo, chave: c.chave, tipo: c.tipo };
    });

    if (d && d.grao && b.graoDaFolha !== d.grao) {
      const generico = b.graoDaFolha !== 'aluna' && b.graoDaFolha !== 'dupla';
      avisos.push(`bloco '${b.titulo}': ` + (generico
        ? `o primeiro cabeçalho da folha ('${b.graoDaFolha}') não é um grão —`
        : `o cabeçalho da folha diz '${b.graoDaFolha}' e a declaração diz '${d.grao}' —`)
        + ` usando o declarado ('${d.grao}')`);
    }
    if (b.cabecalhosRepetidos) {
      avisos.push(`bloco '${b.titulo}': ${b.cabecalhosRepetidos} cabeçalho(s) de tabela(s)`
        + ' seguinte(s) ignorado(s) — as linhas de cada seção não se misturam');
    }

    if (d && (!d.chave || !d.rotulo)) {
      erros.push(`bloco declarado sem chave ou sem rótulo: '${b.titulo}'`);
    }
    const bloco = {
      titulo: b.titulo,
      tipo: 'tabela',
      // A CHAVE e o RÓTULO do bloco vêm da declaração: sem a chave, o lançamento não sabe em que
      // bloco do JSON de dados guardar a marca (era o que o prendia a `tecnica`/`funcional`); sem o
      // rótulo, as vistas teriam de encurtar o título da folha.
      chave: (d && d.chave) || null,
      rotulo: (d && d.rotulo) || null,
      grao: (d && d.grao) || b.graoDaFolha,
      colunas,
      linhas: b.linhas || [],
    };
    if (b.secoes && b.secoes.length) bloco.secoes = b.secoes;
    return bloco;
  });
  return { blocos: saida, erros, avisos };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  // `--variante <slug>` tem valor: não pode cair no balde dos posicionais.
  const posicionais = [];
  let variante = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--variante') { variante = args[i + 1] || ''; i++; continue; }
    if (!args[i].startsWith('--')) posicionais.push(args[i]);
  }
  const [caminhoSchema, caminhoCaptura] = posicionais;
  if (!caminhoSchema || !caminhoCaptura) {
    console.error('uso: node tools/validar-captura-ciclo.js <schema.json>'
      + ' <ciclo-XX-<escola>-captura-aula-NN.md> [--variante <slug>] [--json]');
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
  const declaracao = schema._declaracao || null;
  const porVariante = (declaracao && declaracao.porVariante) || {};
  const avisos = [];

  // QUAL variante: o `--variante` manda (é o que o gerador passa, do VARIANTE do .conf). Sem ele,
  // a folha decide — pela `escola:` do front-matter, que a declaração repete em cada variante.
  if (!variante) {
    const achadas = Object.entries(porVariante)
      .filter(([, d]) => d.escola === (meta.escola || '')).map(([k]) => k);
    if (achadas.length === 1) variante = achadas[0];
    else if (achadas.length > 1) avisos.push(`a escola '${meta.escola}' aparece em mais de uma`
      + ` variante (${achadas.join(', ')}) — passe --variante <slug>`);
    else if (declaracao) avisos.push(`nenhuma variante declara a escola '${meta.escola}':`
      + ' as colunas saem sem chave — declare-a no _declaracao.porVariante');
  }
  const decl = porVariante[variante] || null;
  if (declaracao && variante && !decl) {
    avisos.push(`a variante '${variante}' não está declarada no schema`);
  }
  if (decl && decl.escola && decl.escola !== (meta.escola || '')) {
    avisos.push(`a declaração da variante '${variante}' diz escola '${decl.escola}' e a folha diz`
      + ` '${meta.escola}'`);
  }
  if (!declaracao) avisos.push('o schema não declara _declaracao: as colunas saem sem chave e sem tipo');

  const { blocos, erros: errosDaDeclaracao, avisos: avisosDaDeclaracao } =
    enriquecer(lerBlocos(linhas), decl);
  const campos = {
    escola: meta.escola || '',
    ciclo: meta.ciclo || '',
    aula: meta.aula || '',
    folha: path.basename(caminhoCaptura),
    blocos,
  };
  if (variante) campos.variante = variante;

  const { erros: errosDaValidacao, avisos: avisosDaValidacao, provisorios } =
    validar(campos, schema, {});
  const erros = [...errosDaDeclaracao, ...errosDaValidacao];
  const todosAvisos = [...avisos, ...avisosDaDeclaracao, ...avisosDaValidacao];
  const comTabela = blocos.filter((b) => b.tipo === 'tabela');
  const resumo = `captura: ${comTabela.length} bloco(s) com tabela`;
  const detalhe = comTabela.map((b) => `${b.titulo} [${b.grao}: `
    + `${b.colunas.map((c) => `${c.rotulo}→${c.chave || '(sem chave)'}`).join(', ')}]`).join(' · ');

  if (json) {
    process.stdout.write(`${JSON.stringify(campos, null, 2)}\n`);
    erros.forEach((e) => console.error(`  ERRO  ${e}`));
    todosAvisos.forEach((a) => console.error(`  aviso ${a}`));
    console.error(`${resumo} · ${detalhe}`);
    return erros.length ? 1 : 0;
  }

  console.log(`folha: ${campos.folha} · ciclo ${campos.ciclo} · aula ${campos.aula}`
    + ` · escola ${campos.escola}${variante ? ` · variante ${variante}` : ''}`);
  blocos.forEach((b) => {
    if (b.tipo === 'tabela') {
      console.log(`  bloco   ${b.titulo}`);
      console.log(`          grão: ${b.grao} · ${b.linhas.length} linha(s)`
        + `${b.secoes ? ` · ${b.secoes.length} seção(ões): ${b.secoes.join(', ')}` : ''}`);
      b.colunas.forEach((c) => console.log(`          ${c.rotulo} → ${c.chave || '(SEM CHAVE)'}`
        + ` (${c.tipo || 'sem tipo'})`));
    } else {
      console.log(`  bloco   ${b.titulo} — rótulos: ${b.rotulos.join(' · ')}`);
    }
  });
  todosAvisos.forEach((a) => console.log(`  aviso   ${a}`));
  erros.forEach((e) => console.log(`  ERRO    ${e}`));
  console.log(`\n${erros.length ? 'FALHOU' : 'OK'}: ${erros.length} erro(s), `
    + `${todosAvisos.length} aviso(s)${provisorios.length ? `, ${provisorios.length} provisório(s)` : ''}.`);
  return erros.length ? 1 : 0;
}

process.exit(main());

