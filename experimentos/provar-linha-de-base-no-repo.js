#!/usr/bin/env node
'use strict';

/**
 * provar-linha-de-base-no-repo.js — a linha de base saiu do KV: o ACTO mora num ficheiro, no Git.
 *
 * O QUE ELA PEDIU (05/11/2026), e são três razões que se somam:
 *
 *   · «o KV também é custo, e esse é um espaço que o professor vai mexer muitas vezes»;
 *   · «não há série temporal. A gente tem que encontrar uma solução para isso» — no KV o «Gravar»
 *     do passo 4 faz `lista[idx] = linha` e o que existia antes desaparece;
 *   · «um ranque entre escolas exige que o KV seja alcançável pela mesma leitura» — e não é.
 *
 * O QUE ESTA PROVA MEDE, e cada asserção existe porque a alternativa é uma mentira silenciosa:
 *
 *   A. O CAMINHO E A CHAVE. `escola/<escola>/linhas-de-base/<id>--<carimbo>.json`, e o `id` NÃO
 *      muda entre versões — é ele que o plano guarda em `linha-de-base-alvo`, e um id que mudasse
 *      a cada envio quebraria o ponteiro do plano a cada ajuste.
 *   B. APPEND-ONLY. Dois envios = DOIS arquivos. A versão anterior não é reescrita, e a nova diz
 *      de qual veio (`anterior`) — a cadeia explícita, que sobrevive a um squash.
 *   C. APAGAR É UM ACTO. O `DELETE` grava uma versão com `apagada_em`; a linha sai da lista de
 *      vigentes e o registo de que existiu fica. A alternativa era o único esquecimento que este
 *      sistema não pode ter.
 *   D. A VIGENTE É A DE CARIMBO MAIOR, e não a que o ficheiro diz ser a mais recente: um relógio
 *      errado numa máquina não reordena o passado.
 *   E. A FUSÃO COM O KV. O rascunho vence na lista da EDIÇÃO (é o que o professor está a ver) e
 *      NÃO vence na lista dos ACTOS (um rascunho que muda o elenco não muda o corpo que a turma
 *      observa). Um registo antigo do KV que já tem turma continua a valer — é o que faz a
 *      `teste` de produção não desaparecer no dia do deploy.
 *   F. A ESCRITA FALHADA NÃO MENTE. Sem token, `concluir` devolve `ok: false` — e a rota responde
 *      erro em vez de dizer «enviado» sobre um ficheiro que não existe.
 *
 * SEM REDE: um GitHub em memória que implementa `contents` (GET/PUT) e `git/trees`.
 *
 *   node experimentos/provar-linha-de-base-no-repo.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const repo = require(path.join(RAIZ, 'motor/servidor/linhas-de-base-repo.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/**
 * O GitHub em memória. Implementa as três chamadas que o store usa, com a mesma semântica:
 * `contents` GET devolve `content` em base64 e `sha`; PUT exige o `sha` de um ficheiro existente
 * (é assim que o 409 aparece na vida real); a árvore lista os blobs.
 */
function githubDeBolso({ arvoreBloqueada = false } = {}) {
  const arquivos = new Map(); // caminho → texto
  let commits = 0;
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const fetchFalso = async (url, opcoes) => {
    const u = new URL(String(url));
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      /* O 403 MEDIDO EM PRODUÇÃO A 05/11/2026: a árvore recusa e o `/contents/` continua a
       * servir. Era este o par que parava o envio. */
      if (arvoreBloqueada) {
        return new Response(JSON.stringify({ message: 'Resource not accessible by integration' }),
          { status: 403, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        sha: 'arvore',
        tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: 'sha' })),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('nao', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('nao', { status: 404 });
      return new Response(JSON.stringify({
        sha: 'sha-' + caminho, content: b64(arquivos.get(caminho)),
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      const existia = arquivos.has(caminho);
      if (existia && !corpo.sha) {
        return new Response(JSON.stringify({ message: 'sha obrigatório' }), { status: 422 });
      }
      arquivos.set(caminho, Buffer.from(String(corpo.content), 'base64').toString('utf8'));
      commits += 1;
      return new Response(JSON.stringify({ commit: { sha: 'c' + commits } }),
        { status: existia ? 200 : 201, headers: { 'content-type': 'application/json' } });
    }
    return new Response('nao', { status: 405 });
  };
  return { fetchFalso, arquivos, commits: () => commits };
}

/** SÓ AS VERSÕES. O `.indice.json` também é um ficheiro da família, e contá-lo como se fosse um
 * acto foi o que fez esta prova reprovar quando o índice entrou (05/11/2026) — a asserção certa é
 * «dois envios, duas VERSÕES», e o índice é uma peça à parte, com asserções próprias. */
const versoesDe = (gh) => [...gh.arquivos.keys()].filter((c) => c.indexOf('.indice.json') === -1);

const ESCOLA = 'calango';

function store(gh, opts) {
  return repo.criarStore(Object.assign({
    token: 'token-de-prova', escola: ESCOLA, fetchImpl: gh.fetchFalso, ref: 'main',
  }, opts || {}));
}

function linha(extra) {
  return Object.assign({
    id: 'teste', nome: 'teste', professor: 'tiago-menegaz',
    alunas: ['Aluna A', 'Aluna B'],
    campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato', grupo: 'Técnica' }],
    turma: 'Balé Nível 1 — Teste 1',
  }, extra || {});
}

(async () => {
  console.log('\nA. O caminho e a chave: o `id` não muda entre versões');
  {
    provar('o caminho é `escola/<escola>/linhas-de-base/<chave>`',
      repo.caminhoDaChave(ESCOLA, 'teste--20261105-2155.json')
        === 'escola/calango/linhas-de-base/teste--20261105-2155.json',
      repo.caminhoDaChave(ESCOLA, 'teste--20261105-2155.json'));
    provar('a chave junta o id e o carimbo com `--` (a mesma forma dos envelopes)',
      repo.chaveDe('teste', '20261105-2155') === 'teste--20261105-2155.json');
    provar('o id lê-se da chave, e o carimbo também',
      repo.idDeChave('teste--20261105-2155.json') === 'teste'
        && repo.carimboDaChave('teste--20261105-2155.json') === '20261105-2155');
    provar('um id com `-` no nome não se confunde com o separador',
      repo.idDeChave('balé-nivel-1--20261105-2155.json') === 'balé-nivel-1');
    provar('o carimbo tem a forma `AAAAMMDD-HHMM`',
      repo.carimboDe('2026-11-05T21:55:43.186Z') === '20261105-2155',
      repo.carimboDe('2026-11-05T21:55:43.186Z'));
    provar('a leitura do caminho reconhece a família, e recusa o resto',
      Boolean(repo.lerCaminho('escola/calango/linhas-de-base/x.json'))
        && repo.lerCaminho('escola/calango/envelopes/x.json') === null,
      repo.lerCaminho('escola/calango/envelopes/x.json'));
  }

  console.log('\nB. Append-only: dois envios, dois arquivos, e o elo declarado');
  {
    const gh = githubDeBolso();
    const s = store(gh);
    const um = await s.concluir(linha(), { quando: '2026-11-05T21:00:00.000Z' });
    const dois = await s.concluir(linha({ alunas: ['Aluna A'] }), { quando: '2026-11-05T22:00:00.000Z' });
    provar('o primeiro envio grava', um.ok && um.criado === true, um);
    provar('o segundo NÃO reescreve o primeiro — são duas VERSÕES',
      versoesDe(gh).length === 2, versoesDe(gh));
    provar('…e diz de qual veio (`anterior`)',
      dois.anterior === um.chave, { anterior: dois.anterior, um: um.chave });
    provar('o id é o MESMO nas duas versões — o ponteiro do plano não quebra',
      repo.idDeChave(um.chave) === repo.idDeChave(dois.chave));
    provar('a versão gravada é a última que se escreveu',
      (await s.vigente('teste')).alunas.join('|') === 'Aluna A',
      (await s.vigente('teste')).alunas);
    const hist = await s.historia('teste');
    provar('a história tem as duas, da mais recente para a mais antiga',
      hist.length === 2 && hist[0].carimbo === '20261105-2200', hist.map((v) => v.carimbo));
    provar('o ficheiro gravado é JSON legível, e não um blob',
      (() => { try { JSON.parse(gh.arquivos.get(repo.caminhoDaChave(ESCOLA, dois.chave))); return true; } catch (e) { return false; } })(),
      [...gh.arquivos.keys()]);
    /* O ÍNDICE É A PEÇA NOVA, e existe por uma razão medida: a árvore do repositório respondeu
     * 403 em produção enquanto `/contents/` continuava a funcionar. Ele guarda as duas versões. */
    const doIndice = JSON.parse(gh.arquivos.get(repo.caminhoDaChave(ESCOLA, '.indice.json')) || 'null');
    provar('o índice das versões existe e conhece as duas',
      doIndice && Object.keys(doIndice.versoes || {}).length === 2, doIndice && Object.keys(doIndice.versoes || {}));
    provar('…e diz o carimbo, o arquivo e os aspectos de cada uma',
      doIndice && doIndice.versoes['teste--20261105-2200.json'].carimbo === '20261105-2200'
        && /teste--20261105-2200\.json$/.test(doIndice.versoes['teste--20261105-2200.json'].arquivo || '')
        && Array.isArray(doIndice.versoes['teste--20261105-2200.json'].aspectos),
      doIndice && doIndice.versoes['teste--20261105-2200.json']);
    provar('a lista diz que veio do ÍNDICE, e não de uma reconstrução',
      (await s.lista()).fonte === 'indice', await s.lista());
  }

  console.log('\nC. Apagar é um acto: o rasto fica');
  {
    const gh = githubDeBolso();
    const s = store(gh);
    await s.concluir(linha(), { quando: '2026-11-05T21:00:00.000Z' });
    const lapide = await s.apagar('teste', { quando: '2026-11-06T09:00:00.000Z', por: 'tiago-menegaz' });
    provar('o apagar grava uma versão nova', lapide.ok === true, lapide);
    /* O PASSADO NÃO SE APAGA NO ÍNDICE: ficam as duas versões, e só a MAIS RECENTE é a lápide.
     * Era aqui que eu ia escrever `every(...apagada_em)` — e estaria a exigir que o índice
     * apagasse a história, que é o oposto do que ele serve. */
    provar('…e o índice fica com as duas versões, e só a mais recente é a lápide',
      (() => {
        const i = JSON.parse(gh.arquivos.get(repo.caminhoDaChave(ESCOLA, '.indice.json')) || 'null');
        const v = (i && i.versoes) || {};
        const chaves = Object.keys(v).sort();
        return chaves.length === 2 && Boolean(v[chaves[chaves.length - 1]].apagada_em)
          && !v[chaves[0]].apagada_em;
      })());
    provar('…que declara quando e por quem',
      lapide.apagada.apagada_em === '2026-11-06T09:00:00.000Z'
        && lapide.apagada.apagada_por === 'tiago-menegaz', lapide.apagada);
    provar('…e aponta para a versão que apagou', Boolean(lapide.apagada.anterior));
    provar('a linha desaparece dos VIGENTES', (await s.vigentes()).length === 0,
      (await s.vigentes()).map((l) => l.id));
    provar('CONTROLE: a história continua a ter o que existiu', (await s.historia('teste')).length === 2,
      (await s.historia('teste')).map((v) => v.carimbo));
    provar('CONTROLE NEGATIVO: apagar o que não existe não inventa uma lápide',
      (await store(githubDeBolso()).apagar('nada')).ok === false);
  }

  console.log('\nD. A vigente é a de carimbo maior, e não a data que o ficheiro diz');
  {
    const gh = githubDeBolso();
    const s = store(gh);
    await s.concluir(linha({ alunas: ['Antiga'] }), { quando: '2026-11-05T22:00:00.000Z' });
    /* O SEGUNDO É ESCRITO COM UM CARIMBO ANTERIOR — o caso de um relógio atrasado. O que manda é
     * o carimbo do NOME, e não a data lá dentro. */
    await s.concluir(linha({ alunas: ['Nova'] }), { quando: '2026-11-05T21:00:00.000Z' });
    const v = await s.vigente('teste');
    provar('a vigente é a de carimbo maior', v && v.alunas.join('|') === 'Antiga', v && v.alunas);
  }

  console.log('\nE. A fusão com o KV: rascunho vence na edição, acto vence no elenco');
  {
    /* A FUSÃO É DO `bastidores.js` e depende de um KV — aqui ela é reproduzida com a MESMA regra
     * escrita ao lado do código, e o que se prova é a REGRA, não uma segunda implementação. */
    const acto = { id: 'teste', carimbo: '20261105-2155', turma: 'Balé Nível 1 — Teste 1', alunas: ['Aluna A'] };
    const rascunho = { id: 'teste', alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x' }] };
    const legado = { id: 'antiga', turma: 'Balé Nível 2', alunas: ['Aluna C'], campos: [{ id: 'y' }] };
    const soRascunho = { id: 'nova', alunas: ['Aluna D'], campos: [{ id: 'z' }] };
    const edicao = new Map([[acto.id, acto]]);
    for (const r of [rascunho, legado, soRascunho]) {
      const a = edicao.get(r.id);
      edicao.set(r.id, Object.assign({}, r, a ? { emEdicao: true } : {}));
    }
    provar('na lista da EDIÇÃO o rascunho vence, e leva a marca `emEdicao`',
      edicao.get('teste').alunas.length === 2 && edicao.get('teste').emEdicao === true,
      edicao.get('teste'));
    const concluidas = [...edicao.values()].filter((l) => l && (l.carimbo || l.turma));
    provar('na lista dos ACTOS o rascunho sem turma NÃO entra', !concluidas.some((l) => l.id === 'nova'),
      concluidas.map((l) => l.id));
    provar('…e o registo antigo do KV, que já tem turma, continua a valer',
      concluidas.some((l) => l.id === 'antiga'), concluidas.map((l) => l.id));
    /* O CASO DE PRODUÇÃO: a `teste` vive no KV com turma e não tem ficheiro nenhum. Sem esta
     * regra ela desaparecia da estante e o plano apontava para o nada. */
    const soLegado = [{ id: 'teste', turma: 'Balé Nível 1 — Teste 1', alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x' }] }];
    provar('CONTROLE: o registo de produção (KV, com turma, sem ficheiro) ainda conta como acto',
      soLegado.filter((l) => l.carimbo || l.turma).length === 1);
  }

  console.log('\nF. A escrita falhada não mente');
  {
    const inerte = repo.criarStore({ escola: ESCOLA, fetchImpl: githubDeBolso().fetchFalso });
    provar('sem token o store declara-se inactivo, e diz porquê',
      inerte.activo === false && /GITHUB_TOKEN/.test(inerte.motivo || ''), inerte.motivo);
    const r = await inerte.concluir(linha(), {});
    provar('…e `concluir` devolve erro em vez de fingir que gravou', r.ok === false, r);
    provar('CONTROLE: com token, o mesmo pedido grava', (await store(githubDeBolso()).concluir(linha(), {})).ok === true);
    provar('sem escola também não se inventa um caminho',
      repo.criarStore({ token: 't', fetchImpl: githubDeBolso().fetchFalso }).activo === false);
  }

  console.log('\nG. O 403 DA ÁRVORE NÃO PÁRA O ENVIO — foi o defeito de 05/11/2026 em produção');
  {
    /* O QUE ACONTECEU, e por que esta secção existe. A pesquisadora premiu «Concluir e enviar
     * para a turma» e recebeu: «não consegui gravar a linha de base no repositório:
     * linhas-de-base: não li a árvore do repositório: HTTP 403». O rascunho ficou intacto — mas o
     * acto não foi gravado, e a razão era a LISTAGEM, não a escrita.
     *
     * O `contents` do mesmo token funcionava (o acervo dos envelopes lia-se e escrevia-se). O que
     * recusava era `git/trees`. A correcção não foi pedir outro token: foi deixar de depender da
     * árvore — o índice em ficheiro responde à mesma pergunta com uma leitura que funciona. */
    const gh = githubDeBolso({ arvoreBloqueada: true });
    const s = store(gh);
    provar('com a árvore em 403, o store continua activo', s.activo === true);

    const um = await s.concluir(linha(), { quando: '2026-11-05T21:00:00.000Z' });
    provar('…e o PRIMEIRO envio grava, sem árvore nenhuma', um.ok === true, um);
    provar('…escrevendo só o ficheiro da versão e o índice',
      versoesDe(gh).length === 1
        && gh.arquivos.has(repo.caminhoDaChave(ESCOLA, '.indice.json')),
      [...gh.arquivos.keys()]);

    const dois = await s.concluir(linha({ alunas: ['Aluna A'] }), { quando: '2026-11-05T22:00:00.000Z' });
    provar('…e o SEGUNDO também, com o elo a vir do índice e não da árvore',
      dois.ok === true && dois.anterior === um.chave, { ok: dois.ok, anterior: dois.anterior, um: um.chave });

    const v = await s.vigente('teste');
    provar('a vigente lê-se sem tocar na árvore', v && v.alunas.join('|') === 'Aluna A', v && v.alunas);
    provar('…e a lista declara a fonte', (await s.lista()).fonte === 'indice', await s.lista());

    /* O CONTROLE NEGATIVO, e é o que prova que a árvore deixou de ser o caminho: com o índice
     * APAGADO e a árvore em 403, a lista fica vazia E DIZ-SE. Um vazio silencioso leria como
     * «as linhas de base desapareceram» — que é o pior desfecho possível. */
    const soArvore = githubDeBolso({ arvoreBloqueada: true });
    const semIndice = store(soArvore);
    const lido = await semIndice.lista();
    provar('sem índice e sem árvore, a lista diz o motivo em vez de fingir vazio',
      lido.fonte === 'nenhuma' && /403/.test(lido.aviso || ''), lido);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o acto da linha de base mora num ficheiro, append-only, com o elo declarado e a lápide quando se apaga.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
