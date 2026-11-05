#!/usr/bin/env node
'use strict';

/**
 * provar-apagar-da-listagem.js — o registo SOLTO edita-se e apaga-se; o VINCULADO não (03/11/2026).
 *
 * O DEFEITO, dito pela pesquisadora: «na listagem atual de Planos de Ensino, o sistema exibe
 * corretamente o botão de editar para planos soltos. No entanto, o botão de apagar (excluir)
 * sumiu». Sumiu mesmo: a estante antiga da porta tinha `acoesDoPlano` com «editar» e «apagar», e
 * quando a listagem passou a ser a página da Área do Professor o segundo gesto não veio — ficou a
 * regra sem o botão.
 *
 * E HAVIA UM SEGUNDO DEFEITO, da mesma família, na linha da ANAMNESE: o «Apagar» era um `<a>`
 * para o MESMO endereço do «Editar». Dois botões, um destino, e o segundo a prometer uma coisa
 * que não fazia. Um `DELETE` não tem página de destino — o gesto tem de ser um botão que acontece
 * ali.
 *
 * A REGRA, e é a mesma para as duas famílias:
 *
 *   · SOLTO — não vinculado a nenhum Plano de Observação e não derivado: Editar **e** Apagar;
 *   · VINCULADO / DERIVADO (legado) — só «Ajustar» (acrescenta um elo); o Apagar não aparece, e
 *     o servidor recusa de qualquer maneira com 409 (`rotas.js`, 7.2 e 9).
 *
 * COMO É MEDIDA. A listagem não depende de existir ciclo gerado — o que ela lê é o acervo (KV) e
 * a folha. Por isso esta bancada monta uma PUBLICAÇÃO MÍNIMA num diretório temporário (o `nav.json`
 * e os três assets que a barra procura) e serve a página a sério por `producao.fetch`, com um KV
 * em memória: o que se mede é a página que o Worker serve, e não uma função isolada. O clique é
 * medido em JSDOM, com o `fetch`, o `confirm` e o `[data-senha-status]` em cima da mesa.
 *
 *   node experimentos/provar-apagar-da-listagem.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { JSDOM, VirtualConsole } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* A PUBLICAÇÃO MÍNIMA. A barra lê o `nav.json` e a folha; a página da lista não lê mais nada do
 * `ASSETS` — é o que permite medir a listagem sem um ciclo gerado (que hoje não existe). */
function publicacaoMinima() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lista-prova-'));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const [de, para] of [
    ['tools/templates/ciclo.css', 'assets/style.css'],
    ['tools/templates/nav.js', 'assets/nav.js'],
    ['tools/templates/marca/favicon.svg', 'assets/favicon.svg'],
  ]) fs.copyFileSync(path.join(RAIZ, de), path.join(dir, para));
  fs.writeFileSync(path.join(dir, 'nav.json'), JSON.stringify({ escola: 'prova', itens: [] }));
  return dir;
}

function kvDeMentira() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json',
};
/* O `ASSETS` SERVE AS DUAS COISAS: a moldura da lista (a folha, a barra, o `nav.json`) e o
 * conteúdo da PORTA — porque a rota que apaga vive no roteador dela, e ele lê o conteúdo e o
 * esquema do plano. A publicação mínima tem a primeira; a segunda vem do `porta/`, que é a fonte
 * de onde o gerador a copia. Sem esta segunda metade, o `DELETE` do plano vinculado respondia 500
 * («conteúdo ou esquema ausentes») e a recusa que se quer medir (409) nunca chegava a ser lida. */
function assetsDe(dir) {
  const procurar = (caminho) => {
    /* A PORTA É SERVIDA DEBAIXO DE `plano-observacao/` (é o subdiretório do ASSETS), e a fonte
     * dela é `porta/` — sem esse prefixo. Tirá-lo é o que faz o conteúdo e o esquema chegarem
     * ao roteador. */
    const semPrefixo = String(caminho).replace(/^\/+/, '').replace(/^plano-observacao\//, '');
    for (const [base, rel] of [
      [dir, semPrefixo],
      [path.join(RAIZ, 'porta'), semPrefixo],
    ]) {
      const alvo = path.join(base, rel);
      if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) return alvo;
    }
    return null;
  };
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      const alvo = procurar(url.pathname);
      if (!alvo) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(alvo), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' } });
    },
  };
}

const relatorio = (id) => ({
  id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 }, elos: [], paradas: [],
  idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [],
});
const resp = (v) => ({ valor: v });
const envelope = (o) => ({
  id: o.id,
  contexto: { escola: 'prova', professor: o.professor || 'coqui', ciclo: '01',
    ...(o.aluna ? { aluna: o.aluna } : {}) },
  respostas: o.respostas || {},
  ajuste_de: o.ajusteDe || null,
  gerado_em: o.geradoEm || '2026-11-01T10:00',
});

/** Os cartões de uma página, com as acções de CADA linha (links e botões, separados). */
function cartoesDe(html) {
  return [...html.matchAll(/<li class="trio-plano"[\s\S]*?<\/li>/g)].map((m) => {
    const c = m[0];
    return {
      html: c,
      nome: ((/<b>([\s\S]*?)<\/b>/.exec(c) || [])[1] || '').replace(/<[^>]+>/g, '').trim(),
      links: [...c.matchAll(/<a class="acao[^"]*"[^>]*>([^<]*)<\/a>/g)].map((x) => x[1]),
      /* O «Apagar» é um BOTÃO, e é isso que se lê: o rótulo, o carimbo que ele leva e a rota. */
      apagar: [...c.matchAll(/<button[^>]*data-apagar="([^"]*)"[^>]*?data-apagar-rota="([^"]*)"[^>]*>([^<]*)<\/button>/g)]
        .map((x) => ({ id: x[1], rota: x[2], rotulo: x[3] })),
      /* CONTROLO NEGATIVO do defeito antigo: um LINK com o rótulo «Apagar» — abria o formulário
       * e não apagava nada. A asserção é de ausência, e é ela que impede a recaída. */
      apagarComoLink: [...c.matchAll(/<a class="acao[^"]*"[^>]*>([^<]*)<\/a>/g)]
        .map((x) => x[1]).filter((r) => /apagar/i.test(r)),
    };
  });
}

(async () => {
  const dir = publicacaoMinima();
  const env = {
    ESCOLA_SLUG: 'prova', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
    PROFESSOR_NOME: 'Coqui', PADD_KV: kvDeMentira(), ASSETS: assetsDe(dir),
  };
  await env.PADD_KV.put('bastidores/prova/curadorias', JSON.stringify([
    { id: 'c1', professor: 'coqui', modalidade: 'balé', turma: 'Balé Nível 1',
      turmas: ['Balé Nível 1'], alunas: ['Aluna A'] },
  ]));

  const armazenamento = producao.__armazenamento(env);
  const documentos = [
    /* O PLANO SOLTO — aquele que a pesquisadora não conseguia apagar. */
    envelope({ id: 'plano-20261101', respostas: {
      'objetivo-geral': resp('introduzir o port de bras'), 'contexto-turma': resp('Balé Nível 1') } }),
    /* O PLANO VINCULADO — o PO de baixo observa este. */
    envelope({ id: 'plano-20261022', respostas: {
      'objetivo-geral': resp('consolidar o alinhamento'), 'contexto-turma': resp('Balé Nível 1') } }),
    envelope({ id: 'po-20261023', respostas: {
      sujeitos: resp(['Aluna A']), 'plano-de-ensino': resp(['plano-20261022']) } }),
    /* O PLANO DERIVADO (legado) — outro plano aponta-lhe como `ajuste_de`. */
    envelope({ id: 'plano-20261010', respostas: {
      'objetivo-geral': resp('primeira versão do objetivo'), 'contexto-turma': resp('Balé Nível 1') } }),
    envelope({ id: 'plano-20261012', professor: 'coqui', ajusteDe: 'plano-20261010',
      geradoEm: '2026-10-12T10:00', respostas: {
        'objetivo-geral': resp('segunda versão do objetivo'), 'contexto-turma': resp('Balé Nível 1') } }),
    /* A ANAMNESE SOLTA, e a que o PO usa (vinculada). */
    envelope({ id: 'anamnese-20261102', aluna: 'Aluna B', geradoEm: '2026-11-02T10:00' }),
    envelope({ id: 'anamnese-20261020', aluna: 'Aluna A', geradoEm: '2026-10-20T10:00' }),
    /* DOIS POs (04/11/2026): um SOLTO, que a linha tem de saber apagar, e um DERIVADO (outro PO
     * aponta-lhe como `ajuste_de`), que não se apaga — acrescenta-se um elo. */
    /* Eles observam o plano que JÁ é vinculado (`plano-20261022`), e não o solto: um PO novo a
     * observar o solto torná-lo-ia vinculado, e o «Apagar» do plano — que a §1 mede — deixaria de
     * existir. Foi o que aconteceu na primeira versão desta secção, e as falhas caíram todas em
     * cascata, a começar pelo botão do plano.
     *
     * E o sujeito é a «Aluna C», que não tem anamnese no fixture: um PO a observar a «Aluna B»
     * vinculava a anamnese dela, e a §3 — que mede a anamnese SOLTA — ficava vermelha por um
     * motivo que não era o dela. */
    envelope({ id: 'po-20261103', professor: 'coqui', geradoEm: '2026-11-03T10:00',
      respostas: { sujeitos: resp(['Aluna C']), 'plano-de-ensino': resp(['plano-20261022']) } }),
    envelope({ id: 'po-20261104', professor: 'coqui', ajusteDe: 'po-20261103',
      geradoEm: '2026-11-04T10:00',
      respostas: { sujeitos: resp(['Aluna C']), 'plano-de-ensino': resp(['plano-20261022']) } }),
  ];
  for (const d of documentos) await porta.gravarEnvelope(armazenamento, d, relatorio(d.id));

  const pedir = async (caminho) => {
    const r = await producao.fetch(new Request('https://prova.tmenegaz77.workers.dev' + caminho), env);
    return { status: r.status, html: await r.text() };
  };

  /* --------------------------------------------------------------------------------------- */
  console.log('\n1 · O PLANO SOLTO — Editar e Apagar');
  /* --------------------------------------------------------------------------------------- */
  const planos = await pedir('/area-do-professor/plano-de-ensino/');
  const cartoes = cartoesDe(planos.html);
  const porObjetivo = (t) => cartoes.find((c) => new RegExp(t).test(c.html)) || { links: [], apagar: [], apagarComoLink: [] };

  const solto = porObjetivo('introduzir o port de bras');
  provar('a listagem responde 200', planos.status === 200, planos.status);
  provar('o plano solto oferece «Editar»', solto.links.indexOf('Editar') !== -1, solto.links);
  provar('…e oferece «Apagar»', solto.apagar.length === 1, solto.apagar);
  provar('…com o carimbo daquele registo', (solto.apagar[0] || {}).id === 'plano-20261101', solto.apagar);
  /* A ROTA LEVA O PREFIXO DA PORTA. As rotas de escrita vivem no roteador da porta, que a ponte
   * serve debaixo de `/plano-ensino` e `/anamnese`; relativa, ela resolvia para
   * `/area-do-professor/plano-ensino/api/…` e dava 404 — medido, e é o modo de falhar que esta
   * asserção passou a guardar. */
  provar('…e com a rota do plano, com o prefixo da porta',
    (solto.apagar[0] || {}).rota === '/plano-ensino/api/plano-vinculo/', solto.apagar);
  provar('«Apagar» NÃO é um link para o formulário (o defeito antigo)',
    solto.apagarComoLink.length === 0, solto.apagarComoLink);

  /* --------------------------------------------------------------------------------------- */
  console.log('\n2 · O PLANO VINCULADO — só «Ajustar», e o servidor recusa apagar');
  /* --------------------------------------------------------------------------------------- */
  const vinculado = porObjetivo('consolidar o alinhamento');
  provar('o plano vinculado a um PO não promete «Editar»',
    vinculado.links.indexOf('Editar') === -1, vinculado.links);
  provar('…nem «Apagar»', vinculado.apagar.length === 0, vinculado.apagar);
  provar('…e oferece «Ajustar»', vinculado.links.indexOf('Ajustar') !== -1, vinculado.links);

  /* O SERVIDOR DECIDE. A tela mostra o que a regra permite; a rota recusa de qualquer maneira — e
   * é essa recusa que se mede, porque é ela que vale quando alguém chega por outro caminho. */
  const tentativa = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/plano-ensino/api/plano-vinculo/plano-20261022',
    { method: 'DELETE' }), env);
  provar('o DELETE do plano vinculado é RECUSADO pelo servidor (409)', tentativa.status === 409,
    tentativa.status);
  const corpo = await tentativa.json().catch(() => ({}));
  provar('…e a recusa diz porquê', /VINCULADO/i.test(String(corpo.erro || '')), corpo.erro);

  const legado = porObjetivo('primeira versão do objetivo');
  provar('o plano DERIVADO (legado) também não se apaga', legado.apagar.length === 0, legado.apagar);
  provar('…nem se edita', legado.links.indexOf('Editar') === -1, legado.links);

  /* --------------------------------------------------------------------------------------- */
  console.log('\n3 · A ANAMNESE — a mesma regra, e o «Apagar» que era um link');
  /* --------------------------------------------------------------------------------------- */
  const anamneses = await pedir('/area-do-professor/anamnese/');
  const cartoesDaAnamnese = cartoesDe(anamneses.html);
  const daAluna = (n) => cartoesDaAnamnese.find((c) => new RegExp(n).test(c.html))
    || { links: [], apagar: [], apagarComoLink: [] };

  const solta = daAluna('Aluna B');
  provar('a anamnese solta oferece «Editar»', solta.links.indexOf('Editar') !== -1, solta.links);
  provar('…e «Apagar»', solta.apagar.length === 1, solta.apagar);
  provar('…pela rota da anamnese, com o prefixo da porta',
    (solta.apagar[0] || {}).rota === '/anamnese/api/anamnese-vinculo/', solta.apagar);
  provar('…e não como link para o formulário', solta.apagarComoLink.length === 0, solta.apagarComoLink);

  const vinculada = daAluna('Aluna A');
  provar('a anamnese usada por um PO não oferece «Apagar»', vinculada.apagar.length === 0, vinculada.apagar);
  provar('…nem «Editar»', vinculada.links.indexOf('Editar') === -1, vinculada.links);
  /* «AJUSTAR» DEIXOU DE EXISTIR NA ANAMNESE (04/11/2026) — o gesto é «Novo registo».
   *
   * A pesquisadora: «Se a anamnese é o retrato clínico/físico do corpo do sujeito num determinado
   * momento, ela é historicamente datada. Se a aluna evoluiu ou sofreu uma alteração física, isso
   * NÃO é um ajuste ou edição secreta do passado: é um novo estado físico no tempo.» O «Ajustar»
   * gravava `ajuste_de`, o que fazia o registo anterior passar a SUBSTITUÍDO — e um retrato físico
   * novo não substitui o anterior: os dois aconteceram. */
  provar('…e oferece «Novo registo» (era «Ajustar»)', vinculada.links.indexOf('Novo registo') !== -1,
    vinculada.links);
  provar('…e NÃO oferece «Ajustar» — a edição retroativa saiu',
    vinculada.links.indexOf('Ajustar') === -1, vinculada.links);

  /* --------------------------------------------------------------------------------------- */
  console.log('\n3b · O PO — o gesto que não existia (04/11/2026)');
  /* --------------------------------------------------------------------------------------- */
  /* A PESQUISADORA: «o botão ou a opção de deletar o plano de observação não está aparecendo ou
   * não está disponível». Não estava porque não existia: a linha do PO oferecia só «Ajustar», e
   * não havia rota que o apagasse. A regra é a das outras duas famílias — solto apaga-se,
   * derivado não —, e o servidor é quem decide. */
  const pos = await pedir('/area-do-professor/plano-de-observacao/');
  const cartoesDoPo = cartoesDe(pos.html);
  const poDe = (t) => cartoesDoPo.find((c) => new RegExp(t).test(c.html))
    || { links: [], apagar: [], apagarComoLink: [] };

  provar('a listagem do PO responde 200', pos.status === 200, pos.status);
  provar('há linhas de PO a medir', cartoesDoPo.length > 0, cartoesDoPo.length);
  const poSolto = poDe('Aluna C');
  provar('o PO oferece «Apagar»', poSolto.apagar.length === 1, poSolto.apagar);
  provar('…pela rota do PO, com o prefixo da porta',
    (poSolto.apagar[0] || {}).rota === '/plano-observacao/api/po-vinculo/', poSolto.apagar);
  provar('…e continua a oferecer «Ajustar»', poSolto.links.indexOf('Ajustar') !== -1, poSolto.links);
  provar('«Apagar» NÃO é um link para o formulário', poSolto.apagarComoLink.length === 0,
    poSolto.apagarComoLink);

  /* O SERVIDOR DECIDE — e a recusa é do registo DERIVADO, com o nome do sucessor. */
  const tentativaPo = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/plano-observacao/api/po-vinculo/po-20261103',
    { method: 'DELETE' }), env);
  provar('o DELETE do PO DERIVADO é RECUSADO (409)', tentativaPo.status === 409, tentativaPo.status);
  const corpoPo = await tentativaPo.json().catch(() => ({}));
  provar('…e a recusa nomeia o sucessor', /po-20261104/.test(String(corpoPo.erro || '')), corpoPo.erro);

  /* E O PO SOLTO APAGA-SE — com uma prova de que o ciclo já gerado não é tocado: o pacote
   * publicado tem a sua própria cópia (`po-01.json`), e é dela que a aula vive. */
  const apagarSolto = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/plano-observacao/api/po-vinculo/po-20261104',
    { method: 'DELETE' }), env);
  provar('o DELETE do PO sem sucessor é aceite', apagarSolto.status === 200, apagarSolto.status);
  const depois = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/api/envelope/po-20261104'), env);
  provar('…e o envelope sai do acervo', depois.status === 404, depois.status);

  /* --------------------------------------------------------------------------------------- */
  console.log('\n4 · O CLIQUE — a senha manda, e o carimbo é o da linha');
  /* --------------------------------------------------------------------------------------- */
  const problemas = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });
  const dom = new JSDOM(planos.html, {
    runScripts: 'dangerously', url: 'https://prova.tmenegaz77.workers.dev/area-do-professor/plano-de-ensino/',
    virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.CSS = w.CSS || {};
      if (!w.CSS.escape) w.CSS.escape = (v) => String(v).replace(/[^a-zA-Z0-9_-]/g, (c) => '\\' + c);
    },
  });
  const w = dom.window;
  const chamadas = [];
  w.fetch = (u, i) => {
    chamadas.push(String(u) + ' ' + ((i && i.method) || 'GET'));
    return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200,
      headers: { 'Content-Type': 'application/json' } }));
  };
  w.confirm = () => true;
  w.alert = () => {};
  await new Promise((r) => setTimeout(r, 250));

  const botao = w.document.querySelector('[data-apagar]');
  provar('o botão existe na página servida', !!botao, !!botao);

  // SEM a senha conferida: nada é apagado, e a razão é dita no painel.
  botao.click();
  await new Promise((r) => setTimeout(r, 200));
  provar('sem a senha conferida, NÃO se chama a rota',
    chamadas.filter((c) => /DELETE/.test(c)).length === 0, chamadas);
  const recado = (w.document.querySelector('[data-estado]') || {}).textContent || '';
  provar('…e o painel diz que a exclusão exige a senha', /senha do professor/.test(recado), recado);

  // COM a senha conferida: um DELETE, com o carimbo daquele registo.
  const selo = w.document.querySelector('[data-senha-status]');
  if (selo) selo.hidden = false;
  botao.click();
  await new Promise((r) => setTimeout(r, 300));
  const apagamentos = chamadas.filter((c) => /DELETE/.test(c));
  provar('com a senha conferida, chama-se a rota UMA vez', apagamentos.length === 1, chamadas);
  provar('…na rota do plano, com o carimbo do registo',
    apagamentos[0] === '/plano-ensino/api/plano-vinculo/plano-20261101 DELETE', apagamentos[0]);

  /* --------------------------------------------------------------------------------------- */
  console.log('\n5 · CONTROLO NEGATIVO — a página que não tem o botão também não o inventa');
  /* --------------------------------------------------------------------------------------- */
  /* Se o `acoesDaLinha` voltasse a devolver só o «Editar», a §1 ficava vermelha — mas estas duas
   * guardam o outro lado: a LISTA VAZIA não pode desenhar um botão, e nenhum cartão pode levar um
   * `data-apagar` para uma rota que o servidor recusaria.
   *
   * O PO PASSOU A TER O BOTÃO (04/11/2026), e a asserção antiga — «a lista do PO não tem Apagar em
   * cartão nenhum» — passou a ser o retrato do defeito: era ela que fixava a ausência que a
   * pesquisadora reportou. O que se mede agora é a REGRA: o cartão do PO **vigente** (o topo da
   * cadeia, que não tem sucessor) tem o botão; o que tem sucessor não está na lista e o servidor
   * recusa-o com 409 — provado na §3b. */
  const listaDoPo = await pedir('/area-do-professor/plano-de-observacao/');
  const cartoesDaListaDoPo = cartoesDe(listaDoPo.html);
  provar('o botão do PO leva a rota da PORTA do PO, e não a do plano',
    cartoesDaListaDoPo.every((c) => c.apagar.every((a) => a.rota === '/plano-observacao/api/po-vinculo/')),
    cartoesDaListaDoPo.map((c) => c.apagar.map((a) => a.rota)));
  provar('…e nenhum cartão leva a rota de OUTRA família',
    cartoesDaListaDoPo.every((c) => c.apagar.every((a) => !/plano-vinculo|anamnese-vinculo/.test(a.rota))),
    cartoesDaListaDoPo.map((c) => c.apagar.map((a) => a.rota)));

  /* --------------------------------------------------------------------------------------- */
  console.log('\n6 · A ROTA APAGA MESMO — e o registo sai da lista');
  /* --------------------------------------------------------------------------------------- */
  /* O BOTÃO NÃO PROVA NADA SOZINHO. Ele leva a uma rota; se a rota não apagasse, a linha voltava
   * no recarregamento seguinte e a pessoa concluía que o sistema não a ouve. Mede-se o caminho
   * inteiro: o `DELETE` do plano solto responde 200, o envelope desaparece do acervo, e a
   * listagem deixa de o listar. */
  const doSolto = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/plano-ensino/api/plano-vinculo/plano-20261101',
    { method: 'DELETE' }), env);
  provar('o DELETE do plano SOLTO é aceito (200)', doSolto.status === 200, doSolto.status);
  const sumiu = await porta.lerEnvelope(armazenamento, 'plano-20261101');
  provar('…e o envelope deixa de existir no acervo', !sumiu, !!sumiu);
  const depoisDeApagar = cartoesDe((await pedir('/area-do-professor/plano-de-ensino/')).html);
  provar('…e a listagem já não o mostra',
    !depoisDeApagar.some((c) => /introduzir o port de bras/.test(c.html)),
    depoisDeApagar.map((c) => c.nome));

  /* A ANAMNESE SOLTA, pela rota dela — a que o botão da §3 leva. */
  const daAnamnese = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/anamnese/api/anamnese-vinculo/anamnese-20261102',
    { method: 'DELETE' }), env);
  provar('o DELETE da anamnese SOLTA é aceito (200)', daAnamnese.status === 200, daAnamnese.status);

  /* E A OUTRA METADE, que é a razão de tudo: a anamnese que um PO usa NÃO se apaga. */
  const aVinculada = await producao.fetch(new Request(
    'https://prova.tmenegaz77.workers.dev/anamnese/api/anamnese-vinculo/anamnese-20261020',
    { method: 'DELETE' }), env);
  provar('o DELETE da anamnese VINCULADA é recusado (409)', aVinculada.status === 409, aVinculada.status);

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('');
  console.log((falhas ? 'FALHOU' : 'TUDO CERTO') + ' — ' + total + ' asserção(ões), ' + falhas + ' falha(s).');
  console.log(falhas
    ? 'O gesto de apagar não está onde a regra manda.'
    : 'O registo solto edita-se e apaga-se; o vinculado só ganha um registo novo — e quem decide é o servidor.');
  process.exit(falhas ? 1 : 0);
})();
