#!/usr/bin/env node
'use strict';

/**
 * provar-slug-do-professor.js — a pasta do professor não se DERIVA do nome (17/10/2026).
 *
 * O que aconteceu. A escola `valse` foi criada com o nome de exibição do professor «Tiago», e o
 * motor derivava o slug da pasta do nome (`slugificar("Tiago")` → `tiago`). A pasta é
 * `professores/tiago-menegaz/`. O seletor da porta passou a oferecer `tiago`, e a gravação do PO
 * montou:
 *
 *     professores/tiago/ciclos/ciclo-01-valse-po.md
 *
 * — uma pasta fantasma, que a âncora do ciclo (`hash-ciclo.sh tiago-menegaz 01 valse`) nunca vê.
 * A escola parecia criada e não conseguia guardar.
 *
 * A causa não é o nome: é a ATRIBUIÇÃO. Duas coisas distintas estavam ligadas por uma conta:
 * a etiqueta («Tiago») e a pasta («tiago-menegaz»). Quem cria a pasta é o workflow, com
 * `--professor`; quem escolhe a etiqueta é o formulário. O slug passa a ser DECLARADO
 * (`PROFESSOR_SLUG`) por quem cria a pasta, e o motor prefere-o ao nome.
 *
 * Esta prova trava três elos:
 *
 *   1. `criarEscola` GRAVA o `PROFESSOR_SLUG` (e não só o `PROFESSOR_NOME`);
 *   2. o motor LÊ o `PROFESSOR_SLUG` no seletor — devolve `tiago-menegaz`, não `tiago`;
 *   3. um Worker ANTIGO (sem o secret) continua a derivar do nome — as escolas já criadas não
 *      precisam de migração, e é isso que impede esta correção de quebrar a `fita`.
 *
 *   uso: node experimentos/provar-slug-do-professor.js
 */

const provisionar = require('../motor/servidor/provisionar-escola.js');
const bastidores = require('../motor/servidor/bastidores.js');

const BASE = 'https://valse.tmenegaz77.workers.dev';
const CONTA = 'conta-de-teste';

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

/** Um `fetch` de mentira que anota as chamadas e responde o que a Cloudflare responderia.
 *  `provisionar-escola.js` usa o `fetch` GLOBAL (`api()` não o recebe por parâmetro) — por isso
 *  a prova o substitui e o repõe no fim, em vez de pedir ao módulo um ponto de injecção que ele
 *  não tem. Trocar a produção para caber na prova seria inverter a ordem das coisas. */
function fetchFalso() {
  const chamadas = [];
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    let corpo = null;
    try { corpo = init && init.body ? JSON.parse(init.body) : null; } catch { corpo = null; }
    chamadas.push({ url: String(url), metodo, corpo });
    // `escolaExiste` faz GET no script da escola: 404 = não existe.
    if (metodo === 'GET') {
      return { ok: false, status: 404, json: async () => ({ success: false, result: null }) };
    }
    return { ok: true, status: 200, json: async () => ({ success: true, result: {} }) };
  };
  return { fetch: f, chamadas };
}

/** Um KV de mentira, com o contrato que os Bastidores usam. */
function criarKv() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

async function principais() {
  // --- 1. criarEscola GRAVA o slug ----------------------------------------
  const original = globalThis.fetch;
  const { fetch, chamadas } = fetchFalso();
  globalThis.fetch = fetch;
  await provisionar.criarEscola({
    nome: 'Valse',
    senhaAdmin: 's',
    token: 't',
    accountId: CONTA,
    githubToken: 'gh',
    professorNome: 'Tiago',
    professorSlug: 'tiago-menegaz',
    senhaProfessor: 'p',
    professorEhDono: true,
  });
  const secrets = chamadas
    .filter((c) => c.metodo === 'PUT' && /\/secrets$/.test(c.url))
    .map((c) => c.corpo && c.corpo.name)
    .filter(Boolean);
  conferir('criarEscola grava o PROFESSOR_NOME', secrets.indexOf('PROFESSOR_NOME') !== -1, secrets);
  conferir('…e grava o PROFESSOR_SLUG', secrets.indexOf('PROFESSOR_SLUG') !== -1, secrets);
  const valorDoSlug = (chamadas.find((c) => c.metodo === 'PUT' && /\/secrets$/.test(c.url)
    && c.corpo && c.corpo.name === 'PROFESSOR_SLUG') || {}).corpo;
  conferir('…com o slug da PASTA, não o do nome', valorDoSlug && valorDoSlug.text, 'tiago-menegaz');
  conferir('…e o NOME continua a ser a etiqueta', (chamadas.find((c) => c.corpo
    && c.corpo.name === 'PROFESSOR_NOME') || {}).corpo.text, 'Tiago');

  // Sem slug declarado (o caminho antigo), o secret NÃO é gravado — nada de valor vazio.
  const semSlug = fetchFalso();
  globalThis.fetch = semSlug.fetch;
  await provisionar.criarEscola({
    nome: 'Outra', senhaAdmin: 's', token: 't', accountId: CONTA, githubToken: 'gh',
    professorNome: 'Fulano', senhaProfessor: 'p', professorEhDono: true,
  });
  globalThis.fetch = original;
  const secretsSemSlug = semSlug.chamadas.filter((c) => c.metodo === 'PUT' && /\/secrets$/.test(c.url))
    .map((c) => c.corpo && c.corpo.name);
  conferir('sem slug declarado, nenhum PROFESSOR_SLUG é gravado',
    secretsSemSlug.indexOf('PROFESSOR_SLUG') === -1, secretsSemSlug);

  // --- 2. o motor LÊ o slug declarado ------------------------------------
  const env = (extra) => Object.assign({
    ESCOLA_SLUG: 'valse',
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 's',
    PADD_KV: criarKv(),
  }, extra);
  const pedir = async (e, caminho) =>
    bastidores.fetch(new Request(BASE + caminho), e);

  const comSlug = await (await pedir(env({ PROFESSOR_NOME: 'Tiago', PROFESSOR_SLUG: 'tiago-menegaz' }),
    '/api/bastidores/professores')).json();
  conferir('com PROFESSOR_SLUG, o seletor oferece a PASTA',
    comSlug.professores[0].slug, 'tiago-menegaz');
  conferir('…e o rótulo continua a ser o nome',
    comSlug.professores[0].nome, 'Tiago');

  // --- 3. o Worker ANTIGO continua a funcionar ---------------------------
  const antigo = await (await pedir(env({ PROFESSOR_NOME: 'Tiago Menegaz' }),
    '/api/bastidores/professores')).json();
  conferir('sem o secret (Worker antigo), o slug é derivado do nome',
    antigo.professores[0].slug, 'tiago-menegaz');
  conferir('…e a fita (nome completo) fica exatamente como estava',
    antigo.professores[0].slug,
    (await (await pedir(env({ PROFESSOR_NOME: 'Tiago Menegaz' }), '/api/bastidores/professores')).json())
      .professores[0].slug);

  // O slug derivado de «Tiago» sozinho é o defeito — e é isto que se deixa de usar quando o
  // secret está presente.
  const defeito = await (await pedir(env({ PROFESSOR_NOME: 'Tiago' }),
    '/api/bastidores/professores')).json();
  conferir('sem o secret, «Tiago» sozinho produziria o slug errado (o defeito medido)',
    defeito.professores[0].slug, 'tiago');

  // --- 4. o NOME PODE MUDAR; A PASTA NÃO (22/10/2026) -------------------
  // O «Editar» do professor principal passou a mudar o nome pelo formulário, e com isso a
  // pergunta deixou de ser hipotética: se algum lugar derivar o slug do nome EXIBIDO, mudar o
  // nome move a pasta do professor — e as turmas, os planos e os PO dele passam a apontar para
  // um sítio que não existe. Estes três conferem que o slug sobrevive à edição.
  {
    const kv = criarKv();
    const e = env({ PROFESSOR_NOME: 'Tiago', PROFESSOR_SLUG: 'tiago-menegaz' });
    e.PADD_KV = kv;
    // A sobreposição de exibição — o que `/api/bastidores/dono` grava.
    await kv.put('bastidores/valse/dono', JSON.stringify({ nome: 'Ana Maria Silva' }));

    const depois = await (await pedir(e, '/api/bastidores/professores')).json();
    conferir('depois de o nome ser editado, o slug do principal continua o da PASTA',
      depois.professores[0].slug, 'tiago-menegaz');
    conferir('…e o nome exibido é o novo',
      depois.professores[0].nome, 'Ana Maria Silva');

    // A PORTA recebe o mesmo slug no `?professor=` — é ele que entra no caminho do PO e do plano.
    const pagina = await (await pedir(e, '/bastidores/estudio')).text();
    conferir('a página da Produção usa o slug da pasta (e não o do nome novo)',
      pagina.indexOf('professor=tiago-menegaz') !== -1 && pagina.indexOf('professor=ana-maria-silva') === -1,
      { temOPasta: pagina.indexOf('professor=tiago-menegaz') !== -1, temONome: pagina.indexOf('professor=ana-maria-silva') !== -1 });
  }

  // --- 5. o caminho de gravação com o slug certo -------------------------
  const { caminhoDoPO } = require('../motor/servidor/escrever-po.js');
  conferir('o PO é escrito na pasta que existe',
    caminhoDoPO({ professor: comSlug.professores[0].slug, ciclo: '01', escola: 'valse' }),
    'professores/tiago-menegaz/ciclos/ciclo-01-valse-po.md');

  // --- 6. A LISTA DE REÚSO É A LISTA DE PASTAS (24/11/2026) --------------
  /* O OUTRO LADO DA MESMA REGRA, e o defeito que ela causou.
   *
   * O `criarEscola` recusa um professor cujo slug já existe dizendo «se for a mesma, use «usar
   * este professor»» — a colisão é a PASTA `professores/<slug>/`. E a lista que o formulário
   * oferece era outra coisa: o professor cujas escolas estavam TODAS expurgadas saía dela. Com
   * as escolas de teste apagadas, a lista ficou vazia e a opção desabilitou-se: o servidor
   * mandava escolher um professor que o formulário não deixava escolher. Ela ficou sem saída a
   * 24/11/2026, ao recriar a `calango` com a «Demi Plié».
   *
   * A INVARIANTE, aqui: OFERECIDO ⇔ TEM PASTA. Quem pode ser escolhido é exactamente quem
   * colide, e quem colide é exactamente quem pode ser escolhido.
   *
   * Sem rede: um `fetch` falso serve a árvore e os conteúdos do GitHub, como nas outras secções.
   * Uma escola EXPURGADA (sem config, sem pacote) e um professor FANTASMA (nome que só sobrevive
   * na memória dela, sem pasta) são o caso difícil, e são os dois que se medem. */
  {
    const repo = require('../motor/servidor/repo-escola.js');
    const conteudos = {
      'escola/morta/indice.json': JSON.stringify({
        escola: 'morta', ciclo: '01', shard: 'um-shard',
        professor: { slug: 'demi-plie', nome: 'Demi Plié' },
        // O fantasma: a memória do expurgo nomeia quem já não tem pasta.
        expurgo: [{ em: '2026-11-15T17:49:00Z', motivo: 'teste', apagado: ['professores/sapo/ciclos/ciclo-01-morta.conf'] }],
      }),
    };
    const caminhos = [
      'escola/morta/indice.json',
      // A PASTA da demi-plie — é ela que o `criarEscola` encontra ao recusar.
      'professores/demi-plie/ciclos/ciclo-01-morta.conf',
      'professores/demi-plie/ciclos/ciclo-01-morta/index.html',
      // Nada de `professores/sapo/`: o fantasma não tem pasta nenhuma.
    ];
    const falso = async (url) => {
      const u = String(url);
      const json = (o) => ({ ok: true, status: 200, json: async () => o, text: async () => JSON.stringify(o) });
      if (u.indexOf('/git/trees/') !== -1) {
        return json({ sha: 'arvore-1', tree: caminhos.map((caminho) => ({ type: 'blob', path: caminho })) });
      }
      const m = /\/contents\/(.+?)\?ref=/.exec(u);
      if (m) {
        const texto = conteudos[decodeURIComponent(m[1])];
        if (texto === undefined) return { ok: false, status: 404, json: async () => null };
        return json({ content: Buffer.from(texto, 'utf8').toString('base64'), encoding: 'base64' });
      }
      return { ok: false, status: 404, json: async () => null };
    };
    const kv = { async ler() { return null; }, async guardar() {} };
    const r = await repo.listarProfessoresPeloIndice({
      token: 't', dono: 'd', repo: 'r', ref: 'main', fetchImpl: falso, kv,
    });
    const oferecidos = (r.professores || []).map((x) => x.slug);
    conferir('o professor de uma escola TODA expurgada continua na lista (tem pasta)',
      oferecidos.indexOf('demi-plie') !== -1, oferecidos);
    conferir('…e o nome dele vem do elo, com acento',
      ((r.professores || []).find((x) => x.slug === 'demi-plie') || {}).nome, 'Demi Plié');
    conferir('…e é dito que nenhuma escola dele está viva (rótulo, não exclusão)',
      ((r.professores || []).find((x) => x.slug === 'demi-plie') || {}).viva, false);
    conferir('o FANTASMA sem pasta NÃO é oferecido (o servidor diria «não existe»)',
      oferecidos.indexOf('sapo') === -1, oferecidos);
    conferir('a lista não fica vazia quando todas as escolas estão apagadas',
      oferecidos.length > 0, oferecidos);
  }

  console.log('');
  console.log(falhas ? 'FALHOU: ' + falhas + ' caso(s)' : 'TODAS AS PROVAS PASSARAM');
  return falhas ? 1 : 0;
}

if (require.main === module) {
  principais()
    .then((c) => { process.exitCode = c; })
    .catch((e) => { console.error('erro: ' + e.message); console.error(e.stack); process.exitCode = 1; });
}
