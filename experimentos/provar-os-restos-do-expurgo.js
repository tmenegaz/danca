#!/usr/bin/env node
'use strict';

/**
 * provar-os-restos-do-expurgo.js — a escola sai, e o que o prefixo não alcança sai com ela
 * (23/11/2026).
 *
 * O QUE ELA PEDIU: «fiz o expurgo da escola breu. verifique se nada sobrou».
 *
 * O QUE SE MEDIU, no repositório e no KV de produção, com o expurgo já feito (`3ffa914f`):
 *
 *   · `escola/breu/` — 268 arquivos apagados, e ficou `indice.json`, que é a memória (14 expurgos,
 *     13 recriações): fica por desenho, é o elo.
 *   · `professores/demi-plie/ciclos/ciclo-01-breu*` — apagados. O professor ficou com o `perfil.json`
 *     e os cinco schemas, que são o modelo de toda escola nova.
 *   · KV: 0 chaves sob `breu/` e sob `bastidores/breu/`, em três namespaces.
 *   · **`indices/**` VELHO** — o workflow «Fechar os derivados» FALHOU no commit do expurgo, e a
 *     `breu` continuou `expurgada: false` com 76 registos no acervo depois de o repositório já não
 *     ter nenhum. O log, textualmente: `fatal: pathspec '*.fipp' did not match any files`.
 *   · **`financeiro/mensalidades` com as 7 linhas da `breu`** — o livro é UMA chave de todas as
 *     escolas, o expurgo limpa por PREFIXO, e a limpeza do livro só existia na rota de retomada.
 *   · **`monitor/cache` com `"breu": {total:1, bytes:0}`** — o mapa só acrescentava, nunca riscava.
 *
 * TRÊS DEFEITOS, UMA FAMÍLIA: uma regra que existe numa porta e não na outra, e uma condição que é
 * suposta em vez de perguntada. Cada um tem o seu grupo de asserções:
 *
 *   A. O PATHSPEC — um `git add` de um caminho que não casa com nada é um ERRO (exit 128), e não um
 *      no-op. Um repositório com zero ciclos ancorados é um estado legítimo: o expurgo da última
 *      escola produz exactamente isso. A prova extrai a função do `derivados.yml` — o texto que vai
 *      correr na Actions, não uma cópia — e corre-a num repositório de verdade.
 *   B. O LIVRO — expurgar limpa as linhas daquela escola e de mais nenhuma; a falha é `ok:false`, e
 *      não um silêncio que parece sucesso.
 *   C. O DESFECHO E A CACHE — o desfecho do KV passa a levar o livro (e uma falha dele põe o bloco
 *      a `ok:false`, para a retomada a encontrar); a cache perde a escola morta e conserva a viva,
 *      distinguindo «não perguntei» (`null`) de «perguntei e não há» (`[]`).
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` carrega o `raiz.js` E o `derivados.yml` DAQUELE commit e corre
 * as mesmas asserções sobre eles. Lá as três correcções não existem, e o `git add` do expurgo da
 * última escola morre com 128 — o vermelho que ficou no `main`.
 *
 *   node experimentos/provar-os-restos-do-expurgo.js
 *   node experimentos/provar-os-restos-do-expurgo.js --contra=8b877844
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_MOTOR = RAIZ;
let TEMPORARIO = null;
if (CONTRA) {
  TEMPORARIO = fs.mkdtempSync(path.join(os.tmpdir(), 'restos-'));
  execSync('git archive ' + CONTRA + ' motor modelo biblioteca tools porta .github | tar -x -C ' + TEMPORARIO,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = TEMPORARIO;
}
const raiz = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/raiz.js'));
const CAMINHO_DO_WORKFLOW = path.join(RAIZ_DO_MOTOR, '.github/workflows/derivados.yml');

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 330)));
}

/** O KV de bolso, com a forma que o livro e o desfecho usam. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, v); },
    async delete(c) { dados.delete(c); },
  };
}

const LIVRO = 'financeiro/mensalidades';
const linha = (escola, mes) => ({ escola, mes, status: 'pago', valorCentavos: 15990 });
const livroCom = (linhas, carimbo) => JSON.stringify({ lista: linhas, atualizadoEm: carimbo || '2026-11-17T19:47:31.649Z' });
const lerLivroDe = (kv) => JSON.parse(kv.dados.get(LIVRO) || 'null');

/* ─────────────────────────── A. O PATHSPEC DO `derivados.yml` ───────────────────────────
 *
 * O defeito não está numa função do motor: está no texto que a Actions corre. Por isso a prova não
 * reescreve o passo — ela o EXTRAI do arquivo e corre o que lá está. Uma cópia do passo mediria a
 * cópia, e a cópia é a que não corre.
 */
function extrairFuncaoDasAncoras(texto) {
  const linhas = texto.split('\n');
  const inicio = linhas.findIndex((l) => l.indexOf('acrescentar_ancoras() {') !== -1);
  if (inicio === -1) return null;
  const recuo = linhas[inicio].match(/^\s*/)[0];
  for (let i = inicio + 1; i < linhas.length; i += 1) {
    if (linhas[i].trim() === '}' && linhas[i].indexOf(recuo) === 0) {
      return linhas.slice(inicio, i + 1).map((l) => l.slice(recuo.length)).join('\n');
    }
  }
  return null;
}

/**
 * O SCRIPT QUE O PASSO CORRE, na versão do arquivo que está à frente — e não numa versão que eu
 * escrevesse aqui. É isto que faz o controle negativo valer: com o `derivados.yml` antigo, o script
 * é o `git add` cru, e é ele que falha.
 */
function scriptDoPasso(texto) {
  const funcao = extrairFuncaoDasAncoras(texto);
  if (funcao) {
    return ['set -euo pipefail', funcao, 'acrescentar_ancoras', 'git add -A -- indices/', ''].join('\n');
  }
  const cru = texto.split('\n').find((l) => /git add -A -- '\*\.fipp' indices\//.test(l));
  if (!cru) return null;
  return ['set -euo pipefail', cru.trim(), ''].join('\n');
}

function repoDeBolso(preparar) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ancoras-'));
  const git = (cmd) => execSync('git ' + cmd, { cwd: dir, stdio: 'pipe' }).toString();
  git('init -q .');
  git('config user.email prova@exemplo');
  git('config user.name prova');
  fs.mkdirSync(path.join(dir, 'indices'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'indices/acervo.json'), '{"v":1}\n');
  preparar({ dir, git });
  return dir;
}

function correr(cwd, script) {
  const arquivo = path.join(cwd, '.passo.sh');
  fs.writeFileSync(arquivo, script);
  try {
    execSync('bash .passo.sh', { cwd, stdio: 'pipe' });
    return { ok: true, codigo: 0, staged: execSync('git diff --cached --name-status', { cwd }).toString() };
  } catch (erro) {
    const staged = (() => {
      try { return execSync('git diff --cached --name-status', { cwd }).toString(); } catch { return ''; }
    })();
    return {
      ok: false,
      codigo: erro.status,
      erro: String((erro.stderr && erro.stderr.toString()) || (erro.stdout && erro.stdout.toString()) || erro.message),
      staged,
    };
  }
}

const textoDoWorkflow = fs.readFileSync(CAMINHO_DO_WORKFLOW, 'utf8');
const script = scriptDoPasso(textoDoWorkflow);

(async () => {
  console.log('A. O PATHSPEC — o `git add` de um caminho que não casa com nada');
  provar('o passo do `derivados.yml` foi encontrado', Boolean(script),
    script === null ? 'nem a função nem a linha crua' : undefined);

  // A1. Zero âncoras no repositório (o estado em que o expurgo da última escola deixa a árvore).
  {
    const dir = repoDeBolso(({ dir: d, git }) => {
      git('add -A .');
      git('commit -qm base');
      fs.writeFileSync(path.join(d, 'indices/acervo.json'), '{"v":2}\n');
    });
    const r = correr(dir, script);
    provar('A1. sem nenhuma âncora no repositório, o passo NÃO morre (era exit 128)', r.ok === true, r.erro);
    provar('A1. e o índice derivado entra no commit mesmo assim',
      /indices\/acervo\.json/.test(r.staged), r.staged);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // A2. Uma âncora nova e solta: entra, como sempre entrou.
  {
    const dir = repoDeBolso(({ dir: d, git }) => {
      git('add -A .');
      git('commit -qm base');
      fs.mkdirSync(path.join(d, 'professores/demi-plie/ciclos'), { recursive: true });
      fs.writeFileSync(path.join(d, 'professores/demi-plie/ciclos/ciclo-01-x.fipp'), 'hash\n');
      fs.writeFileSync(path.join(d, 'indices/acervo.json'), '{"v":2}\n');
    });
    const r = correr(dir, script);
    provar('A2. uma âncora solta entra no commit', /ciclo-01-x\.fipp/.test(r.staged), r.staged);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // A3. Uma âncora APAGADA: o `-A` existe para isto, e a condição tem de a apanhar.
  {
    const dir = repoDeBolso(({ dir: d, git }) => {
      fs.mkdirSync(path.join(d, 'professores/demi-plie/ciclos'), { recursive: true });
      fs.writeFileSync(path.join(d, 'professores/demi-plie/ciclos/ciclo-01-x.fipp'), 'hash\n');
      git('add -A .');
      git('commit -qm base');
      fs.rmSync(path.join(d, 'professores/demi-plie/ciclos/ciclo-01-x.fipp'));
      fs.writeFileSync(path.join(d, 'indices/acervo.json'), '{"v":2}\n');
    });
    const r = correr(dir, script);
    provar('A3. a âncora apagada entra no commit como apagamento',
      /^D\s+professores\/demi-plie\/ciclos\/ciclo-01-x\.fipp$/m.test(r.staged), r.staged);
    fs.rmSync(dir, { recursive: true, force: true });
  }

  console.log('');
  console.log('B. O LIVRO DO FINANCEIRO — uma chave de todas as escolas que o prefixo não alcança');
  const limpar = raiz.limparOLivroDaEscola;
  provar('B0. a limpeza do livro existe e é uma função', typeof limpar === 'function');
  if (typeof limpar === 'function') {
    // B1. O caso medido: só a expurgada sai.
    {
      const kv = kvDeBolso({
        [LIVRO]: livroCom([linha('breu', '2026-11'), linha('breu', '2026-12'), linha('outra', '2026-11')]),
      });
      const r = await limpar({ PADD_KV: kv }, 'breu');
      const ficou = lerLivroDe(kv);
      provar('B1. as duas linhas da expurgada saem', r.ok === true && r.removidas === 2, r);
      provar('B1. a linha da OUTRA escola não é tocada',
        ficou.lista.length === 1 && ficou.lista[0].escola === 'outra', ficou.lista);
      provar('B1. o carimbo do livro é reescrito com a limpeza (a limpeza é uma escrita)',
        ficou.atualizadoEm !== '2026-11-17T19:47:31.649Z', ficou.atualizadoEm);
    }
    // B2. Livro sem a escola: nada a fazer, e não é falha.
    {
      const kv = kvDeBolso({ [LIVRO]: livroCom([linha('outra', '2026-11')]) });
      const r = await limpar({ PADD_KV: kv }, 'breu');
      provar('B2. livro sem a escola: removidas 0 e ok — não se inventa trabalho',
        r.ok === true && r.removidas === 0, r);
      provar('B2. e o livro fica como estava',
        lerLivroDe(kv).lista.length === 1, lerLivroDe(kv).lista);
    }
    // B3. Sem KV: a resposta diz que NÃO limpou. «Não havia» e «não consegui» não são o mesmo.
    {
      const r = await limpar({}, 'breu');
      provar('B3. sem KV a resposta é ok:false — e não um silêncio que parece sucesso',
        r.ok === false && Boolean(r.erro), r);
    }
    // B4. O KV que explode na escrita: a excepção não escapa, vira facto do relatório.
    {
      const kv = kvDeBolso({ [LIVRO]: livroCom([linha('breu', '2026-11')]) });
      kv.put = async () => { throw new Error('cota do KV'); };
      const r = await limpar({ PADD_KV: kv }, 'breu');
      provar('B4. o KV que explode não mata a rota: devolve ok:false com o motivo',
        r.ok === false && /cota do KV/.test(String(r.erro)), r);
    }
  }

  console.log('');
  console.log('C. O DESFECHO E A CACHE — o que a próxima sessão lê primeiro');
  const desfecho = raiz.desfechoDoKvParaOElo;

  // C1. O desfecho com o livro limpo vai para o elo, e o bloco continua verde.
  {
    const bloco = desfecho({
      cloudflare: { kv: { ok: true, apagadas: 3, restantes: 0 } },
      morada: { kvNamespaceId: 'ns' }, slug: 'breu',
      livro: { ok: true, removidas: 7 },
    });
    provar('C1. o desfecho leva o livro', Boolean(bloco && bloco.livro), bloco);
    provar('C1. e continua ok quando as duas metades fecharam',
      bloco.ok === true && Boolean(bloco.livro) && bloco.livro.removidas === 7, bloco);
  }
  // C2. Livro falhado: o bloco FICA vermelho — a pendência nasce para a retomada encontrar.
  {
    const bloco = desfecho({
      cloudflare: { kv: { ok: true, apagadas: 3, restantes: 0 } },
      morada: { kvNamespaceId: 'ns' }, slug: 'breu',
      livro: { ok: false, removidas: 0, erro: 'cota' },
    });
    provar('C2. livro falhado põe o desfecho a ok:false', bloco.ok === false, bloco);
  }
  // C3. Escola sem namespace declarado E livro falhado: a pendência não pode desaparecer
  //     (era o `null` do `!:namespaceId` — «não há o que limpar» —, que engolia o livro).
  {
    const bloco = desfecho({
      cloudflare: {}, morada: { kvNamespaceId: null }, slug: 'breu',
      livro: { ok: false, removidas: 0, erro: 'cota' },
    });
    provar('C3. sem namespace mas com o livro falhado, a pendência existe', Boolean(bloco) && bloco.ok === false, bloco);
    const limpo = desfecho({
      cloudflare: {}, morada: { kvNamespaceId: null }, slug: 'breu',
      livro: { ok: true, removidas: 0 },
    });
    provar('C3. sem namespace e com o livro limpo, não se inventa pendência', limpo === null, limpo);
  }
  // C4. A cache: a morta sai, a viva fica.
  const podar = raiz.podarChavesDeEscolasMortas;
  provar('C4.0. a poda da cache existe e é uma função', typeof podar === 'function');
  if (typeof podar === 'function') {
    const antes = { breu: { total: 1, bytes: 0 }, viva: { total: 3, bytes: 10 } };
    const depois = podar(antes, [{ slug: 'viva' }]);
    provar('C4. a escola expurgada sai da cache', !('breu' in depois), depois);
    provar('C4. a escola viva fica', depois.viva && depois.viva.total === 3, depois);
    provar('C4. o mapa de entrada não é mutado', 'breu' in antes, antes);
  }
  // C5. Os três estados da lista. `null` é «não perguntei»; `[]` é «perguntei e não há».
  if (typeof podar === 'function') {
    const cache = { breu: { total: 1 } };
    provar('C5. lista desconhecida (null): não se risca nada', 'breu' in podar(cache, null));
    provar('C5. lista desconhecida (undefined): não se risca nada', 'breu' in podar(cache, undefined));
    provar('C5. lista VAZIA e conhecida: risca-se tudo — é o parque inteiro expurgado',
      Object.keys(podar(cache, [])).length === 0, podar(cache, []));
  }

  if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true });
  console.log('');
  if (CONTRA) {
    console.log((falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de ' + total
      + ' asserções falham com o `raiz.js` e o `derivados.yml` de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: o commit dos derivados sobrevive a um repositório '
    + 'sem âncoras (e ainda apanha as que existem e as que foram apagadas), o livro do financeiro perde '
    + 'as linhas da escola expurgada e mais nenhuma, o desfecho leva o livro e fica vermelho quando ele '
    + 'falha, e a cache do monitor deixa de guardar escola que já não existe — sem confundir «não '
    + 'perguntei» com «não há nenhuma».');
})();
