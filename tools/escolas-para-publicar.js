#!/usr/bin/env node
'use strict';

/**
 * escolas-para-publicar.js — QUEM o `publicar.yml` põe na lista de publicação.
 *
 * (Até 17/11/2026 era «uma matriz»; os dois fluxos de deploy passaram a um job só com um laço,
 * porque o GitHub factura por job arredondado ao minuto. A regra daqui não mudou.)
 *
 * POR QUE ISTO SAIU DO `workflow` (24/11/2026). A descoberta era um bloco `bash` com dois laços e
 * um `node -e` embutido, e o segundo laço — o das escolas de shard — **nunca correu**. O
 * `node -e` levava um `return` de topo (`if (!fs.existsSync(dir)) return;`), que o Node recusa
 * com `SyntaxError: Illegal return statement`; e como ele estava dentro de uma substituição de
 * processo (`< <(node -e …)`), o erro não chegava ao `set -e`: o `while` lia uma saída vazia, o
 * passo terminava com sucesso, e a matriz saía `[]`.
 *
 * O EFEITO, que é o que se via: `publicar` ficava `skipped` em todos os runs. Uma correção do
 * motor (`motor/**`, `tools/templates/**`) era empurrada para o repositório e **nunca** para o
 * Worker do shard — o shard continuava a servir o código da véspera. Medido no run 43759456951:
 * `descobrir` → success, `descobertas: []`, e o bundle publicado sem a correção.
 *
 * O QUE ISSO NÃO ERA: não era uma escola sem pacote, nem um shard vazio. A `calango` estava no
 * índice, com `shard: lastro-teste` e pacote-zero em `professores/demi-plie/ciclos/ciclo-01-calango`.
 * Era código que não corria.
 *
 * AS DUAS FONTES, e as duas são precisas:
 *   · as CONFIGS (`wrangler.<slug>.jsonc`) — as escolas do regime de antes, um Worker cada uma;
 *   · os ÍNDICES (`escola/<slug>/indice.json`, campo `shard`) — as escolas que nascem DENTRO de um
 *     shard e que, por isso, não têm config nenhuma. Sem esta fonte, o shard nunca é republicado.
 *
 * A SAÍDA É SÓ O JSON. As explicações vão para `stderr`: o `stdout` alimenta o `$GITHUB_OUTPUT`, e
 * uma linha de log lá dentro corromperia a matriz.
 *
 *   node tools/escolas-para-publicar.js
 *   node tools/escolas-para-publicar.js --filtro calango
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

/** O `.jsonc` destas configs tem comentários; para ler o `name` basta tirar as linhas `//`. */
function lerJsonc(arquivo) {
  const bruto = fs.readFileSync(arquivo, 'utf8');
  const semComentarios = bruto.replace(/^\s*\/\/.*$/gm, '');
  try { return JSON.parse(semComentarios); } catch (erro) { return {}; }
}

/**
 * O shard que serve uma escola, lido do índice dela — a MESMA resposta que
 * `tools/lib-shard.sh` dá ao `bash`, pela mesma linha e pelo mesmo ficheiro. Duas opiniões
 * sobre «esta escola está num shard?» divergiriam, e a que ficasse para trás seria a que
 * apaga a árvore das outras.
 */
function shardDaEscola(escola, raiz) {
  const arquivo = path.join(raiz || RAIZ, 'escola', escola, 'indice.json');
  if (!fs.existsSync(arquivo)) return '';
  try {
    const d = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    return String((d && d.shard) || '').trim();
  } catch (erro) { return ''; }
}

/**
 * O pacote-zero é o que a escola SERVE. Sem ele não há o que publicar — e é esta pergunta, e não
 * «tem config?», que impede o deploy de ressuscitar uma escola expurgada.
 */
function temPacoteZero(escola, raiz) {
  const base = path.join(raiz || RAIZ, 'professores');
  if (!fs.existsSync(base)) return false;
  const alvo = new RegExp('^ciclo-[0-9]{2}-' + escola.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$');
  for (const prof of fs.readdirSync(base, { withFileTypes: true })) {
    if (!prof.isDirectory()) continue;
    const ciclos = path.join(base, prof.name, 'ciclos');
    if (!fs.existsSync(ciclos)) continue;
    for (const nome of fs.readdirSync(ciclos)) {
      if (!alvo.test(nome)) continue;
      // `statSync` pode falhar num link quebrado; nesse caso não é pacote.
      try { if (fs.statSync(path.join(ciclos, nome)).isDirectory()) return true; } catch (erro) { /* não é */ }
    }
  }
  return false;
}

/** As escolas do regime de antes: as que têm `wrangler.<slug>.jsonc` de escola. */
function escolasDasConfiguracoes(raiz) {
  const base = raiz || RAIZ;
  const saida = [];
  for (const nome of fs.readdirSync(base).sort()) {
    if (!/^wrangler\..*\.jsonc$/.test(nome)) continue;
    const slug = nome.slice('wrangler.'.length, -'.jsonc'.length);
    if (!slug || slug === 'danca') continue;
    const cfg = lerJsonc(path.join(base, nome));
    // O SHARD NÃO É UMA ESCOLA — o mesmo marcador que o `publicar.yml` já usa.
    if (cfg && cfg.vars && cfg.vars.PACOTE_PARTILHADO) continue;
    if (!temPacoteZero(slug, base)) {
      console.error('pulando ' + slug + ' — o pacote-zero já não existe (escola expurgada)');
      continue;
    }
    saida.push(slug);
  }
  return saida;
}

/**
 * As escolas de shard. UMA ENTRADA POR SHARD, e não uma por escola: o passo de publicação monta o
 * shard inteiro e sobe o mesmo Worker, de modo que três escolas do mesmo shard seriam três
 * deploys idênticos sobre a mesma versão activa. Fica a primeira por ordem alfabética — e é
 * indiferente qual é, porque o que se monta e sobe é o todo.
 */
function escolasDeShard(raiz) {
  const base = path.join(raiz || RAIZ, 'escola');
  if (!fs.existsSync(base)) return [];
  const porShard = new Map();
  for (const item of fs.readdirSync(base, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!item.isDirectory()) continue;
    const shard = shardDaEscola(item.name, raiz);
    if (!shard) continue;
    if (!temPacoteZero(item.name, raiz)) continue;
    if (!porShard.has(shard) || item.name < porShard.get(shard)) porShard.set(shard, item.name);
  }
  return [...porShard.entries()].sort().map(([, escola]) => escola);
}

/**
 * A LISTA FINAL, com o alvo a deduplicar — e não a escola. Duas escolas do mesmo shard são o mesmo
 * Worker; duas entradas seriam dois `wrangler deploy` em paralelo sobre a mesma versão.
 */
function escolasParaPublicar({ raiz, filtro } = {}) {
  const lista = [];
  const vistos = new Set();
  const aceitar = (escola) => {
    if (filtro && filtro !== escola) return;
    const shard = shardDaEscola(escola, raiz);
    // O passo seguinte precisa de saber que o alvo é um shard; o nome da escola que o representa
    // viaja, porque é ela que o `montar-publicacao` sabe montar.
    const chave = shard ? 'shard:' + shard : 'escola:' + escola;
    if (vistos.has(chave)) {
      console.error('pulando ' + escola + ' — o Worker «' + chave + '» já está na lista');
      return;
    }
    vistos.add(chave);
    lista.push(escola);
  };
  for (const escola of escolasDasConfiguracoes(raiz)) aceitar(escola);
  for (const escola of escolasDeShard(raiz)) aceitar(escola);
  return lista;
}

module.exports = {
  shardDaEscola, temPacoteZero, escolasDasConfiguracoes, escolasDeShard, escolasParaPublicar,
};

if (require.main === module) {
  const i = process.argv.indexOf('--filtro');
  const filtro = i !== -1 && process.argv[i + 1] ? String(process.argv[i + 1]).trim() : '';
  process.stdout.write(JSON.stringify(escolasParaPublicar({ filtro })));
}
