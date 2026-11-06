#!/usr/bin/env node
'use strict';

/**
 * indice-lancamentos.js — o ÍNDICE DE LANÇAMENTOS de um ciclo, a partir do JSON de dados.
 *
 * PORQUE EXISTE. O [PLANO-INDICES.md](../PLANO-INDICES.md) §4.9 declara cinco famílias de
 * metadado que o lançamento tem de alimentar — `presenca`, `marcas`, `condicoes`, `ajustes` e
 * `rubrica` — e diz, sem rodeios, que «o lançamento é o dado que responde às perguntas da escola,
 * e hoje **não tem leitor**». Este é o leitor. Sem ele, o formulário grava marcas que ninguém
 * conta, e perguntas como «em quantas aulas a aluna X demorou a estabilizar o adágio?» não têm
 * por onde ser respondidas.
 *
 * O QUE ELE **NÃO** GUARDA, e é regra do plano, não economia: a prosa. O texto de `relatorio.texto`,
 * de `condicoes_contorno.mudou` e o de qualquer ajuste fica no original autenticado. O índice
 * guarda **que houve**, **quando** e **em que aula** — copiar a prosa criaria uma segunda fonte de
 * conteúdo pedagógico e o risco de vazar nome de aluna num arquivo de metadados.
 *
 * AS COLUNAS DE CADA AULA vêm do config daquela aula (`captura-aula-NN.json`, ou o
 * `captura-XX.json` do ciclo quando o índice não declara um), porque é ele que diz o TIPO de cada
 * coluna: `rubrica` alimenta a família `rubrica` (o nível), `marca` alimenta `marcas`. Uma coluna
 * de outro tipo (número, booleano) não entra em nenhuma das duas — e o relatório de lacunas diz
 * quais ficaram de fora, em vez de as inventar.
 *
 * SAÍDA DETERMINÍSTICA. Sem `--com-data`, o JSON não leva carimbo: rodar duas vezes tem de dar o
 * mesmo texto (é a mesma regra das vistas — `lib-vistas.js`). Com `--com-data`, entra `gerado_em`,
 * para quem precisa de datar.
 *
 *   node tools/indice-lancamentos.js <ciclo-XX[-<escola>]-dados.json> [--com-data] [--json <arquivo>]
 *   node tools/indice-lancamentos.js <dados> --check    # o que a pergunta AL03 devolveria
 */

const fs = require('fs');
const path = require('path');

const { chaveDoItem } = require('./lib-vistas.js').helpers;

const MARCAS = ['', 'ok', 'parcial', 'nao', 'nao_vi'];

const NAO_GUARDADO = [
  'o texto de `relatorio.texto` — o índice guarda que houve aula com registro, não o que diz',
  'o texto de `condicoes_contorno.mudou` — guarda-se `mudou: true|false`',
  'o texto de qualquer ajuste — guarda-se `houve: true|false`',
  'o nome completo, o contato e o `contexto.aluna` dos envelopes — nunca saem do original',
];

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/** A pasta das peças do ciclo: o pacote fica ao lado do JSON de dados, com o nome sem `-dados`. */
function pastaDoCiclo(caminhoDados) {
  return caminhoDados.replace(/-dados\.json$/, '');
}

/** O config de uma aula: o que o índice declara para ela, ou o `captura-XX.json` do ciclo. */
function configDaAula(pasta, ciclo, n) {
  const tentar = (nome) => {
    const p = path.join(pasta, nome);
    if (!fs.existsSync(p)) return null;
    try { return lerJson(p); } catch (e) { return null; }
  };
  const idx = tentar('ciclos.json');
  let declarado = null;
  if (idx && Array.isArray(idx.ciclos)) {
    const c = idx.ciclos.find((x) => String(x.id) === String(ciclo))
      || (idx.ciclos.length === 1 ? idx.ciclos[0] : null);
    const a = c && Array.isArray(c.aulas) ? c.aulas.find((x) => String(x.n) === String(n)) : null;
    declarado = (a && a.config) || null;
  }
  const escolhido = (declarado && tentar(declarado)) || tentar(`captura-${ciclo}.json`);
  if (!escolhido) return null;
  const blocos = new Map();
  for (const b of (escolhido.blocos || [])) {
    if (!b || !b.chave) continue;
    blocos.set(b.chave, b);
  }
  return blocos;
}

/** O tipo de uma coluna de um bloco — `marca` é o ramo padrão do formulário, e é o que se assume. */
function tipoDaColuna(bloco, chave) {
  const c = (bloco.colunas || []).find((x) => x.chave === chave);
  if (!c) return null;
  return c.tipo || 'marca';
}

function indexar(dados, pasta) {
  const ciclo = String(dados.ciclo || '');
  const ids = Object.keys(dados.aulas || {}).sort();
  const out = {
    ciclo, escola: dados.escola || '', professor: dados.professor || '',
    aulas: [], presenca: [], marcas: [], condicoes: [], ajustes: [], surpresas: [], rubrica: [],
    lacunas: [],
  };
  const lacunasDeTipo = new Set();

  for (const id of ids) {
    const a = dados.aulas[id] || {};
    const data = a.data || '';
    const cond = a.condicoes_contorno || {};
    const rel = a.relatorio || {};
    out.aulas.push({ n: id, data });

    out.presenca.push({
      aula: id, data,
      presentes: Array.isArray(a.presentes) ? a.presentes.slice() : [],
      ausentes: Array.isArray(a.ausentes) ? a.ausentes.slice() : [],
    });

    /* `mudou` é BOOLEANO no índice: o texto é do original. E «não vazio» é o critério que o par da
     * §4.1 usa — com o plano seguido, o campo fica vazio e vazio quer dizer «nada mudou». */
    out.condicoes.push({
      aula: id, data,
      plano_seguido: cond.plano_seguido || '',
      duracao_min: typeof a.duracao_min === 'number' ? a.duracao_min : null,
      animo: cond.animo ?? null,
      interesse: cond.interesse ?? null,
      harmonia: cond.harmonia ?? null,
      mudou: String(cond.mudou || '').trim() !== '',
    });

    out.ajustes.push({ aula: id, data, houve: String(rel.ajustes || '').trim() !== '' });

    /* `surpresas` NÃO ESTÁ na tabela do §4.9 — entrou aqui em 06/11/2026, quando o campo deixou de
     * ser prosa e passou a marca (`sim`/`nao`). Uma prosa antiga não vira booleano: fica `null`, e
     * quem lê sabe que não foi respondido. */
    const s = String(rel.surpresas || '').trim();
    out.surpresas.push({ aula: id, data,
      houve: s === 'sim' ? true : s === 'nao' ? false : null });

    const blocos = configDaAula(pasta, ciclo, id);
    if (!blocos) {
      out.lacunas.push(`aula ${id}: o config da aula não está na pasta do ciclo — as marcas dela`
        + ' ficaram fora do índice');
      continue;
    }

    for (const [chaveBloco, bloco] of blocos) {
      const valor = a[chaveBloco];
      if (!valor || typeof valor !== 'object') continue;

      // Um bloco de ITENS (a linha de base revisitada): `{aluna: [{chave, item, marca}]}`.
      const valores = Object.values(valor);
      if (valores.length && valores.every(Array.isArray)) {
        for (const aluna of Object.keys(valor).sort()) {
          for (const x of valor[aluna]) {
            if (!x || typeof x.marca !== 'string' || !MARCAS.includes(x.marca)) continue;
            const coluna = x.chave || chaveDoItem(x.item);
            if (x.chave === undefined) {
              out.lacunas.push(`aula ${id}: o item «${x.item}» da linha de base não tem chave —`
                + ' foi indexado pela chave calculada');
            }
            out.marcas.push({ aula: id, data, aluna, bloco: chaveBloco, coluna, marca: x.marca });
          }
        }
        continue;
      }

      // Um bloco por pessoa e por coluna: `{aluna: {coluna: valor}}`.
      for (const aluna of Object.keys(valor).sort()) {
        const daPessoa = valor[aluna];
        if (!daPessoa || typeof daPessoa !== 'object' || Array.isArray(daPessoa)) continue;
        for (const coluna of Object.keys(daPessoa).sort()) {
          const v = daPessoa[coluna];
          if (typeof v !== 'string') continue;
          const tipo = tipoDaColuna(bloco, coluna);
          if (tipo === 'rubrica') {
            // O NÍVEL vai como rótulo, e vazio é «não medido» — não é um nível da régua.
            if (v === '') continue;
            out.rubrica.push({ aula: id, data, aluna, criterio: coluna, nivel: v });
          } else if (tipo === 'marca') {
            if (!MARCAS.includes(v)) continue;
            out.marcas.push({ aula: id, data, aluna, bloco: chaveBloco, coluna, marca: v });
          } else {
            lacunasDeTipo.add(`${chaveBloco}.${coluna} (${tipo})`);
          }
        }
      }
    }
  }

  if (lacunasDeTipo.size) {
    out.lacunas.push('colunas que não alimentam `marcas` nem `rubrica` (o §4.9 não lhes dá família): '
      + [...lacunasDeTipo].sort().join(', '));
  }
  return out;
}

/**
 * A LEITURA DE UMA PERGUNTA — `AL03`. «Em que colunas a marca `parcial` ou `nao` se repete para
 * esta aluna, em que aulas, e desde quando?» Ela existe aqui porque é a razão de o índice existir:
 * um índice que ninguém consulta é uma tabela a mais.
 */
function reprovacoes(indice, aluna) {
  const porColuna = new Map();
  for (const m of indice.marcas) {
    if (m.aluna !== aluna) continue;
    if (m.marca !== 'parcial' && m.marca !== 'nao') continue;
    const k = `${m.bloco}/${m.coluna}`;
    if (!porColuna.has(k)) porColuna.set(k, []);
    porColuna.get(k).push(m);
  }
  return [...porColuna.entries()].sort()
    .map(([coluna, marcas]) => ({
      coluna,
      aulas: marcas.map((m) => m.aula),
      desde: marcas[0].data,
      marcas: marcas.map((m) => m.marca),
    }));
}

function main() {
  const args = process.argv.slice(2);
  const comData = args.includes('--com-data');
  const conferir = args.includes('--check');
  const iJson = args.indexOf('--json');
  const destino = iJson >= 0 ? args[iJson + 1] : null;
  const caminho = args.find((a, i) => !a.startsWith('--') && (iJson < 0 || i !== iJson + 1));

  if (!caminho) {
    console.error('uso: node tools/indice-lancamentos.js <ciclo-XX[-<escola>]-dados.json>'
      + ' [--com-data] [--json <arquivo>] [--check <aluna>]');
    return 2;
  }

  let texto;
  try { texto = fs.readFileSync(caminho, 'utf8'); } catch (e) {
    console.error(`erro: não consegui ler ${caminho} (${e.message})`);
    return 1;
  }
  // O ENVELOPE É DERIVADO e cifrado: a fonte é o texto plano. A mesma recusa do validador.
  if (/_cifrado/.test(texto.slice(0, 400))) {
    console.error(`erro: ${path.basename(caminho)} é o ENVELOPE CIFRADO (derivado), não a fonte —`
      + ' o índice lê-se do texto plano (ciclos/ciclo-XX[-<escola>]-dados.json).');
    return 1;
  }

  let dados;
  try { dados = JSON.parse(texto); } catch (e) {
    console.error(`erro: ${path.basename(caminho)} não é JSON válido (${e.message})`);
    return 1;
  }

  const indice = indexar(dados, pastaDoCiclo(caminho));
  indice._nota = 'Índice de lançamentos (PLANO-INDICES.md §4.9). Guarda QUE houve, QUANDO e em que'
    + ' aula — a prosa fica no original autenticado. Gerado por tools/indice-lancamentos.js.';
  indice._nao_guardado = NAO_GUARDADO;
  if (comData) indice.gerado_em = new Date().toISOString().slice(0, 16);

  if (conferir) {
    const aluna = (args[iJson + 1] && !caminho) ? args[iJson + 1] : (args[args.indexOf('--check') + 1] || '');
    if (!aluna || aluna.startsWith('--')) {
      console.error('uso: --check <apelido da aluna> — devolve as colunas onde a marca `parcial`'
        + ' ou `nao` se repete para ela, e em que aulas');
      return 2;
    }
    const r = reprovacoes(indice, aluna);
    if (!r.length) {
      console.log(`${aluna}: nenhuma coluna com \`parcial\` ou \`nao\` — só registo sem reparo, ou`
        + ' nenhum registo observado.');
      return 0;
    }
    console.log(`${aluna}: ${r.length} coluna(s) com \`parcial\`/\`nao\``);
    for (const x of r) {
      console.log(`  ${x.coluna}: aula(s) ${x.aulas.join(', ')} — desde ${x.desde}`
        + ` (${x.marcas.join(', ')})`);
    }
    return 0;
  }

  const saida = JSON.stringify(indice, null, 2) + '\n';
  if (destino) {
    fs.writeFileSync(destino, saida);
    console.log(`indice-lancamentos: ${Object.keys(dados.aulas || {}).length} aula(s), `
      + `${indice.marcas.length} marca(s), ${indice.rubrica.length} nível(is) → ${destino}`);
  } else {
    process.stdout.write(saida);
  }
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { indexar, reprovacoes, pastaDoCiclo };
