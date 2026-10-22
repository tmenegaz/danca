#!/usr/bin/env node
'use strict';

/**
 * provar-derivados-do-po.js — o PO mudou, e as fontes derivadas mudam com ele (22/10/2026).
 *
 * O QUE SE MEDIU. Em 22/10/2026 a escola `batata` recebeu dois POs para o mesmo plano — e o
 * segundo foi gravado com tudo a correr bem, sem erro nenhum. O `-po.md` foi ATUALIZADO em
 * sítio (`escrever-po.js` é «cria ou atualiza»), o `po-01.json` do pacote saiu dele — e a
 * `-aula-01.md`, a `-harmonizacao.md`, a `-captura-aula-01.md` e o `-dados.json` continuaram
 * do PO anterior, porque o passo 3 do `escrever-ciclo.js` era `if (atual.existe) continue`.
 *
 * A justificação era certa e o alvo errado: «a proveniência acrescenta, não edita» vale para o
 * MATERIAL (a aula lançada, o relatório, a observação) — não para um DERIVADO, que é
 * reconstruível por definição. Tratar o derivado como material deixava dois documentos do mesmo
 * ciclo a dizer coisas diferentes, com um `.fipp` a certificar o conjunto.
 *
 * O QUE ESTA PROVA TRAVA.
 *
 *   1. a fonte derivada que MUDOU é reescrita;
 *   2. a versão substituída NÃO se perde: fica em `historico/`, com o carimbo de quem a
 *      substituiu no nome;
 *   3. o relatório diz o que foi substituído e para onde foi o anterior (`elos`);
 *   4. a cópia cifrada do `-dados.json` é regerada quando a fonte muda;
 *   5. o nome do elo NÃO é alcançável por quem varre a pasta do ciclo — e isto prova-se com o
 *      GLOB E O `sed` VERDADEIROS do `tools/lib-fontes.sh` e do `gerar-handoff.sh`;
 *   6. gravar duas vezes o MESMO PO não escreve nada (idempotente).
 *
 *   uso: node experimentos/provar-derivados-do-po.js
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { criarEscritorDeCiclo } = require('../motor/servidor/escrever-ciclo.js');

let falhas = 0;
let n = 0;
const conferir = (nome, ok, detalhe) => {
  n += 1;
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  -> ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const CONF = [
  'CICLO="01"',
  'ESCOLA="batata"',
  'NOME="Ciclo 01 — batata"',
  'DURACOES="60"',
  'VOLUME_MIN="3"',
  'VOLUME_MAX="5"',
  'DOCS="plano harmonizacao aula-01 notacao"',
  'DIAS="segunda 18:00"',
].join('\n') + '\n';

const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

/**
 * O GitHub falso que PERSISTE: o que uma passagem escreve, a seguinte lê. É a única forma
 * honesta de provar «o segundo PO reescreve o que o primeiro deixou» — adivinhar o conteúdo
 * esperado mediria a minha adivinhação, não o escritor.
 */
function githubFalso(inicial) {
  const chamadas = [];
  const arquivos = Object.assign({}, inicial || {});
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    chamadas.push({ url: u, metodo });
    const corpo = init && init.body ? JSON.parse(init.body) : null;

    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = u.split('/contents/')[1].split('?')[0];
      if (/\.conf$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's1', content: Buffer.from(CONF).toString('base64') }) };
      }
      if (/captura-schema\.json$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
      }
      if (Object.prototype.hasOwnProperty.call(arquivos, caminho)) {
        return {
          status: 200,
          ok: true,
          json: async () => ({ sha: 'x' + caminho, content: Buffer.from(arquivos[caminho]).toString('base64') }),
        };
      }
      return { status: 404, ok: false, json: async () => ({}) };
    }
    if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
    if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
    if (metodo === 'POST' && /\/git\/blobs$/.test(u)) {
      const sha = 'b' + chamadas.length;
      arquivos.__blob = arquivos.__blob || {};
      arquivos.__blob[sha] = Buffer.from(String(corpo.content), 'base64').toString('utf8');
      return { status: 201, ok: true, json: async () => ({ sha }) };
    }
    if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
      arquivos.__tree = {};
      for (const t of corpo.tree || []) arquivos.__tree[t.path] = (arquivos.__blob || {})[t.sha];
      return { status: 201, ok: true, json: async () => ({ sha: 't1' }) };
    }
    if (metodo === 'POST' && /\/git\/commits$/.test(u)) return { status: 201, ok: true, json: async () => ({ sha: 'c1' }) };
    if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) {
      // O COMMIT passa a existir: é isto que faz a segunda passagem ler o que a primeira gravou.
      Object.assign(arquivos, arquivos.__tree || {});
      delete arquivos.__tree;
      delete arquivos.__blob;
      return { status: 200, ok: true, json: async () => ({}) };
    }
    return { status: 200, ok: true, json: async () => ({}) };
  };
  return { fetch: f, chamadas, arquivos };
}

const CONTEXTO = {
  escola: 'batata', professor: 'acucar-branco', ciclo: '01',
  turma: 'bale-nivel-1-teste-2', variante: 'batata-bale-nivel-1-teste-2',
};
const PLANO = { objetivo: 'x', turma: 'bale-nivel-1-teste-2', professor: 'acucar-branco', ciclo: '01' };

/** O PO com o `id` (o carimbo) que o escritor usa no nome do elo. */
const poDe = (id, horizonte) => ({
  id,
  ciclo: '01',
  escola: 'batata',
  contexto: CONTEXTO,
  respostas: { horizonte, 'dimensoes-de-observacao': ['Equilíbrio ' + horizonte], sujeitos: ['Aluna A'] },
});

async function guardar(fetch, po) {
  const escrever = criarEscritorDeCiclo({
    token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: fetch,
  });
  return escrever({ plano: PLANO, po, contexto: CONTEXTO });
}

const BASE = 'professores/acucar-branco/ciclos';
const DADOS = BASE + '/ciclo-01-batata-bale-nivel-1-teste-2-dados.json';

async function principais() {
  // ── o primeiro PO grava tudo ─────────────────────────────────────────────
  const gh = githubFalso();
  const primeiro = await guardar(gh.fetch, poDe('po-20261022-1039', 'Nível 1'));
  conferir('o primeiro PO grava as fontes derivadas', primeiro.escritas.length >= 5,
    primeiro.escritas.map((e) => e.caminho));
  const antes = Object.assign({}, gh.arquivos);
  conferir('…e não deixa elo nenhum (nada a substituir)',
    Array.isArray(primeiro.elos) && primeiro.elos.length === 0, primeiro.elos);

  // ── 2. o SEGUNDO PO, com o conteúdo mudado, reescreve o que mudou ────────
  const segundo = await guardar(gh.fetch, poDe('po-20261022-1108', 'Nível 2'));
  conferir('o segundo PO SUBSTITUI as fontes derivadas (não as pula)',
    Array.isArray(segundo.elos) && segundo.elos.length > 0, segundo.elos);

  const eloDados = (segundo.elos || []).find((e) => /-dados\.json$/.test(e.de));
  conferir('o `-dados.json` está entre as fontes substituídas', Boolean(eloDados), segundo.elos);
  const eloAula = (segundo.elos || []).find((e) => /-aula-01\.md$/.test(e.de));
  conferir('a `-aula-01.md` também (o PO alimenta a aula pelas dimensões observadas)',
    Boolean(eloAula), segundo.elos);

  // ── 3. o anterior não se perde: fica em `historico/`, com o carimbo ─────
  conferir('o elo vai para `historico/` (fora do alcance de quem varre as fontes)',
    Boolean(eloDados) && /\/ciclos\/historico\//.test(eloDados.para), eloDados && eloDados.para);
  conferir('…e o nome do elo carrega o carimbo de quem substituiu',
    Boolean(eloDados) && /antes-de-po-20261022-1108/.test(eloDados.para), eloDados && eloDados.para);
  conferir('…e o conteúdo ANTERIOR está lá, intacto',
    Boolean(eloDados) && gh.arquivos[eloDados.para] === antes[DADOS],
    eloDados && { agora: gh.arquivos[eloDados.para], antes: antes[DADOS] });

  // ── 4. a fonte passou a dizer o que o PO novo diz ────────────────────────
  conferir('a fonte `-dados.json` passou a declarar o PO NOVO',
    /"po":\s*"po-20261022-1108"/.test(gh.arquivos[DADOS] || ''), gh.arquivos[DADOS]);
  // O que o PO muda nos derivados são as DIMENSÕES OBSERVADAS (a aula e a folha de captura as
  // leem); o `-dados.json` carrega os apelidos e a procedência. É isso que se confere.
  const aulaDepois = gh.arquivos[BASE + '/ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md'] || '';
  conferir('…e o que o PO novo mudou chegou à `-aula-01.md` (as dimensões observadas)',
    /Nível 2/.test(aulaDepois), aulaDepois.slice(0, 400));

  // ── 5. a cópia cifrada é regerada quando a fonte muda ───────────────────
  conferir('a cópia cifrada foi regerada (a fonte mudou)',
    segundo.cifrado && segundo.cifrado.ok === true && !segundo.puladas.includes(
      BASE + '/ciclo-01-batata-bale-nivel-1-teste-2-dados.cifrado.json'),
    segundo.cifrado);

  // ── 6. gravar o MESMO PO outra vez não escreve nada ─────────────────────
  const terceiro = await guardar(gh.fetch, poDe('po-20261022-1108', 'Nível 2'));
  conferir('o MESMO PO gravado de novo não escreve nenhuma fonte',
    terceiro.escritas.length === 0, terceiro.escritas.map((e) => e.caminho));
  conferir('…e não cria elo nenhum', (terceiro.elos || []).length === 0, terceiro.elos);

  // ── 7. O GLOBO E O `sed` VERDADEIROS não alcançam o elo ─────────────────
  //
  // Esta é a asserção que justifica a subpasta. Monta-se um ciclo em disco com as fontes e o
  // elo, e correm-se os DOIS mecanismos reais que varrem a pasta:
  //   · `familias_por_aula` do `tools/lib-fontes.sh` (o glob + o `sed` que tira o número);
  //   · o `find -maxdepth 1` do `tools/gerar-handoff.sh`.
  // Se o elo estivesse ao lado das fontes, o `sed` o leria como «aula 1108».
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'danca-elos-'));
    const ciclos = path.join(tmp, 'ciclos');
    fs.mkdirSync(path.join(ciclos, 'historico'), { recursive: true });
    const escrever = (rel) => fs.writeFileSync(path.join(ciclos, rel), '# x\n');
    escrever('ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md');
    escrever('ciclo-01-batata-bale-nivel-1-teste-2-harmonizacao.md');
    const relElo = eloAula.para.replace(BASE + '/', '');
    escrever(relElo);

    const script = `
      set -e
      RAIZ="${path.join(__dirname, '..')}"
      CICLOS="${ciclos}"
      CICLO="01"
      VARIANTE="batata-bale-nivel-1-teste-2"
      source "$RAIZ/tools/lib-fontes.sh"
      familias_por_aula aula
    `;
    const aulas = execFileSync('bash', ['-c', script], { encoding: 'utf8' })
      .split('\n').map((x) => x.trim()).filter(Boolean);
    conferir('o glob real do `lib-fontes.sh` vê UMA aula (a 01), e não uma 1108',
      aulas.length === 1 && aulas[0] === '01', aulas);

    const contadas = execFileSync('bash', ['-c',
      `find "${ciclos}" -maxdepth 1 \\( -name "ciclo-01-aula-*.md" -o -name "ciclo-01-*-aula-*.md" \\) ! -name "*captura*" | wc -l`,
    ], { encoding: 'utf8' }).trim();
    conferir('o `find -maxdepth 1` do `gerar-handoff.sh` conta UMA aula', contadas === '1', contadas);

    // E o contrário: ao lado das fontes, o mesmo nome SERIA lido como a aula 1108 — é o defeito
    // que a subpasta evita, medido em vez de afirmado.
    escrever(relElo.replace('historico/', ''));
    const comEloAoLado = execFileSync('bash', ['-c', script], { encoding: 'utf8' })
      .split('\n').map((x) => x.trim()).filter(Boolean);
    conferir('…e, ao lado das fontes, o MESMO nome seria lido como a aula 1108 (o defeito evitado)',
      comEloAoLado.indexOf('1108') !== -1, comEloAoLado);

    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

principais()
  .then(() => {
    if (falhas) {
      console.log('\n' + falhas + ' falha(s) em ' + n + ' asserção(ões).');
      process.exit(1);
    }
    console.log('\nTUDO CERTO — ' + n + ' asserções, 0 falha(s).');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
