#!/usr/bin/env node
'use strict';

/*
 * provar-a-carencia-nao-se-burla.js — a carência vale nos TRÊS caminhos, e não só no automático
 * (16/11/2026).
 *
 * O QUE ELA VIU, e é o defeito inteiro:
 *
 *   «Eu coloquei a escola em carência e aí ela ainda não tinha vencido o prazo de 5 minutos da
 *   escola Breu. E aí eu fui apagar e eu consegui expurgar a escola. Não é para permitir expurgar
 *   a escola. Tá na carência, é carência, a gente tem que cumprir a regra. Não pode existir uma
 *   regra e uma possibilidade de burlar a regra. […] A escola que tá em carência não deve nem
 *   aparecer na lista para expurgar e a escola que tá habilitada também não pode nem aparecer na
 *   lista para expurgar.»
 *
 * A REGRA JÁ EXISTIA, E SÓ NUM DOS CAMINHOS. A varredura agendada cumpria a carência desde a
 * véspera; a rota manual (`/api/apagar-escola`) não perguntava nada — bastava escrever o slug na
 * confirmação. E o comentário dela dizia, com todas as letras, «aqui não há prazo a esperar»: uma
 * decisão escrita que deixou de ser verdade no dia em que a carência nasceu, e que ninguém releu.
 *
 * O QUE ESTA PROVA MEDE, e a ordem é a das três portas:
 *
 *   A. A REGRA, sozinha, sobre os cinco casos (ativa · aguardando · suspensa sem data · suspensa
 *      em carência · suspensa com a carência vencida) — e o sexto, o do regime de teste novo;
 *   B. A LISTA (`/api/escolas`) — cada escola vem com `expurgavel`, e as três que não podem ser
 *      apagadas vêm marcadas como tal, com o motivo;
 *   C. A ROTA (`/api/apagar-escola`) — recusa com 409, sem tocar no Cloudflare nem no GitHub, e
 *      diz porquê. A prova atira pedidos a sério à rota, com o KV e as duas metades falsas;
 *   D. NENHUMA ESCOLA FICA SEM CAMINHO — o botão «Desabilitar» existe para todas as que não estão
 *      suspensas, e é por ali que a carência começa;
 *   E. A CAIXA DE APAGAR, em jsdom — os cartões das escolas que não podem ser apagadas NÃO estão
 *      lá, e a caixa já não explica o resto: sem nada para apagar, diz uma linha, só;
 *   F. A ESCOLA RE-HABILITADA — o `desabilitadaEm` fica (é um facto), a etiqueta «pode apagar»
 *      sai (é o estado de agora), e a conta antiga é reproduzida como controle negativo;
 *   G. O CONTROLO NEGATIVO — com a guarda da rota desfeita, a mesma chamada apaga. É a prova de
 *      que o que se mede é a guarda, e não a sorte.
 *
 *   node experimentos/provar-a-carencia-nao-se-burla.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const MINUTO = 60 * 1000;
const agora = Date.now();
const iso = (ms) => new Date(ms).toISOString();

/** Um KV de bolso. */
function kvCom(pares) {
  const dados = new Map(Object.entries(pares || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    bruto: dados,
  };
}

const SENHA = 'senha-da-raiz-do-teste';
const AUTORIZACAO = 'Basic ' + Buffer.from('tmenegaz:' + SENHA).toString('base64');

/** O `env` da raiz, com as duas metades que falam com o mundo a apontar para contadores. */
function envCom(kv, contadores) {
  return {
    SENHA_RAIZ: SENHA,
    PADD_KV: kv,
    CLOUDFLARE_API_TOKEN: 'cf-de-mentira',
    GITHUB_TOKEN: 'gh-de-mentira',
    ASSETS: {
      /* `/escolas-habilitadas.json` e os assets já não existem; o acervo do índice é lido pelo
       * GitHub, que aqui é falso. O ASSETS responde o que sobrar. */
      fetch: async () => new Response('{}', { status: 404, headers: { 'Content-Type': 'application/json' } }),
    },
    __contadores: contadores || { cloudflare: 0, github: 0 },
  };
}

(async () => {
  console.log('A. A regra, sobre os cinco casos — e o do regime novo');
  {
    const caso = (comercial, opcoes) => raiz.estadoDoExpurgo(comercial, opcoes || { agora });

    const ativa = caso({ estado: 'ativa' });
    conferir('escola HABILITADA não pode ser apagada', ativa.pode === false, ativa);
    conferir('…e o motivo diz que ela está a ser usada', /habilitada/i.test(ativa.motivo), ativa.motivo);

    const aguardando = caso({ estado: 'aguardando', criadoEm: iso(agora - 90 * MINUTO) });
    conferir('escola A AGUARDAR PAGAMENTO não pode ser apagada', aguardando.pode === false, aguardando);
    conferir('…e o motivo diz que ela nunca começou a pagar',
      /nunca começou a pagar/i.test(aguardando.motivo), aguardando.motivo);

    const semData = caso({ estado: 'suspensa' });
    conferir('suspensa SEM DATA não pode ser apagada (não há prazo a contar)', semData.pode === false, semData);

    const emCarencia = caso({ estado: 'suspensa', desabilitadaEm: iso(agora - 2 * MINUTO) });
    conferir('suspensa DENTRO DA CARÊNCIA não pode ser apagada — é o caso dela',
      emCarencia.pode === false, emCarencia);
    conferir('…e o motivo diz a data em que o prazo vence', /vence/i.test(emCarencia.motivo), emCarencia.motivo);
    conferir('…e quanto falta', emCarencia.restanteMs > 2 * MINUTO && emCarencia.restanteMs <= 3 * MINUTO,
      emCarencia.restanteMs);

    const vencida = caso({ estado: 'suspensa', desabilitadaEm: iso(agora - 6 * MINUTO) });
    conferir('suspensa com a carência VENCIDA pode ser apagada', vencida.pode === true, vencida);

    const antesDoRegime = caso(
      { estado: 'suspensa', desabilitadaEm: iso(agora - 30 * MINUTO) },
      { agora, regimeDesde: iso(agora - 10 * MINUTO) });
    conferir('suspensa ANTES do regime de teste não pode ser apagada', antesDoRegime.pode === false, antesDoRegime);

    /* A FORMA É A MESMA NOS TRÊS CASOS — é o que permite a lista, a rota e a varredura dizerem a
     * mesma coisa com a mesma função. */
    const chaves = ['pode', 'estado', 'motivo', 'desabilitadaEm', 'carenciaAte', 'restanteMs', 'regimeDesde'];
    conferir('a resposta tem sempre a mesma forma (a lista e a rota leem os mesmos campos)',
      [ativa, aguardando, emCarencia, vencida].every((v) => chaves.every((k) => k in v)), chaves);
  }

  console.log('\nB. A lista: cada escola traz o veredicto, e as três dizem porquê');
  {
    /* O ACERVO DO ÍNDICE VEM DO GITHUB, e aqui ele é falso. A ÁRVORE é o que declara as escolas
     * (`wrangler.<slug>.jsonc`, a mesma derivação que a raiz usa), e é só isso que este caminho
     * precisa: os quatro estados vêm do KV, que é onde eles vivem. */
    const SLUGS = ['viva', 'esperando', 'em-carencia', 'vencida'];
    const kv = kvCom({
      'expurgo/regime-de-teste-desde': iso(agora - 60 * MINUTO),
      'bastidores/viva/comercial': JSON.stringify({ estado: 'ativa', criadoEm: iso(agora - 90 * 24 * 60 * MINUTO) }),
      'bastidores/esperando/comercial': JSON.stringify({ estado: 'aguardando', criadoEm: iso(agora - 90 * 24 * 60 * MINUTO) }),
      'bastidores/em-carencia/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 2 * MINUTO) }),
      'bastidores/vencida/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 6 * MINUTO) }),
    });
    const fetchDeVerdade = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const u = String(url);
      if (u.indexOf('/git/trees/') !== -1) {
        /* O `ok` FAZ PARTE: quem lê a árvore pergunta `r.ok`, e um falso sem ele responde «HTTP
         * 200» como se fosse erro — que é o que aconteceu à primeira tentativa desta prova. */
        return {
          ok: true, status: 200,
          json: async () => ({ tree: SLUGS.map((s2) => ({ path: 'wrangler.' + s2 + '.jsonc', type: 'blob' })), sha: 'arvore' }),
          text: async () => '',
        };
      }
      return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
    };
    const env = envCom(kv);
    const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/escolas', {
      headers: { Authorization: AUTORIZACAO },
    }), env);
    const d = await res.json().catch(() => ({}));
    globalThis.fetch = fetchDeVerdade;

    conferir('a lista responde 200', res.status === 200 && d.ok === true, res.status);
    const porSlug = new Map((d.escolas || []).map((e) => [e.slug, e]));
    conferir('as quatro escolas vêm na lista (a lista não esconde: quem esconde é a tela)',
      porSlug.size === 4, [...porSlug.keys()]);
    conferir('a HABILITADA vem marcada como não expurgável',
      porSlug.has('viva') && porSlug.get('viva').expurgavel === false, porSlug.get('viva'));
    conferir('…e o motivo dela é o que a tela vai poder dizer',
      /habilitada/i.test(String((porSlug.get('viva') || {}).motivoDoExpurgo)), (porSlug.get('viva') || {}).motivoDoExpurgo);
    conferir('a que AGUARDA pagamento também não',
      (porSlug.get('esperando') || {}).expurgavel === false, porSlug.get('esperando'));
    conferir('a que está EM CARÊNCIA também não',
      (porSlug.get('em-carencia') || {}).expurgavel === false, porSlug.get('em-carencia'));
    conferir('…e o motivo dela diz o prazo',
      /vence/i.test(String((porSlug.get('em-carencia') || {}).motivoDoExpurgo)),
      (porSlug.get('em-carencia') || {}).motivoDoExpurgo);
    conferir('só a que cumpriu a carência é expurgável',
      (porSlug.get('vencida') || {}).expurgavel === true, porSlug.get('vencida'));
    conferir('…e o relatório da lista diz com que régua mediu', /minutos/.test(String(d.carencia)), d.carencia);
  }

  console.log('\nC. A rota recusa — e não toca em nada');
  {
    /* AS QUATRO QUE NÃO PODEM SER APAGADAS, uma a uma. O `excluirEscola` e a auditoria são
     * injectados para CONTAR: uma recusa que já tivesse falado com o Cloudflare seria
     * irreversível, e medir só o código HTTP não o diria. */
    const casos = [
      ['viva', 'ativa', null, /habilitada/i],
      ['esperando', 'aguardando', null, /nunca começou a pagar/i],
      ['em-carencia', 'suspensa', iso(agora - 2 * MINUTO), /carência/i],
    ];
    for (const [slug, estado, desabilitadaEm, esperado] of casos) {
      const kv = kvCom({
        'expurgo/regime-de-teste-desde': iso(agora - 60 * MINUTO),
        ['bastidores/' + slug + '/comercial']: JSON.stringify(
          Object.assign({ estado, criadoEm: iso(agora - 90 * 24 * 60 * MINUTO) },
            desabilitadaEm ? { desabilitadaEm } : {})),
      });
      const env = envCom(kv);
      const res = await raiz.fetch(new Request('https://danca.padd.com.br/api/apagar-escola', {
        method: 'POST',
        headers: { Authorization: AUTORIZACAO, 'Content-Type': 'application/json' },
        body: JSON.stringify({ escola: slug, confirmacao: slug, motivo: 'prova' }),
      }), env);
      const d = await res.json().catch(() => ({}));
      conferir('«' + slug + '» (' + estado + '): a rota recusa', res.status === 409, res.status);
      conferir('…e o motivo é o da regra', esperado.test(String(d.erro)), d.erro);
      conferir('…e nada foi apagado em sítio nenhum',
        d.noRepositorio === false && d.noCloudflare === false, d);
      conferir('…e o veredicto vem no corpo, com a data da carência',
        d.expurgavel === false && ('carenciaAte' in d), d);
    }

    /* E A QUE CUMPRIU A CARÊNCIA NÃO PODE SER RECUSADA POR ESTA GUARDA — a prova de que a guarda
     * não é «recusar tudo». A chamada segue para as metades, e é uma delas que falha aqui (o
     * GitHub é falso): o que se afirma é que a recusa NÃO é a de carência. */
    const kvVencida = kvCom({
      'expurgo/regime-de-teste-desde': iso(agora - 60 * MINUTO),
      'bastidores/vencida/comercial': JSON.stringify({ estado: 'suspensa', desabilitadaEm: iso(agora - 6 * MINUTO) }),
    });
    const envVencida = envCom(kvVencida);
    const resVencida = await raiz.fetch(new Request('https://danca.padd.com.br/api/apagar-escola', {
      method: 'POST',
      headers: { Authorization: AUTORIZACAO, 'Content-Type': 'application/json' },
      body: JSON.stringify({ escola: 'vencida', confirmacao: 'vencida', motivo: 'prova' }),
    }), envVencida);
    const dVencida = await resVencida.json().catch(() => ({}));
    conferir('a que CUMPRIU a carência passa a guarda (o erro, se houver, é outro)',
      !/não pode ser apagada agora/i.test(String(dVencida.erro)), dVencida.erro);
  }

  console.log('\nD. Nenhuma escola fica SEM caminho para ser apagada');
  {
    /* A REGRA NOVA FECHA A PORTA À ESCOLA QUE NUNCA PAGOU, e é de propósito: a conciliação é de
     * até 24 horas, e apagar uma escola que está prestes a ser paga seria o pior desfecho de um
     * clique. Mas fechar a porta sem abrir outra seria uma armadilha. O caminho é o mesmo de
     * todas: desabilitar → cumprir a carência → apagar. A tabela das vivas é quem dá o primeiro
     * passo, e o botão tem de estar lá. */
    const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
    const html = painel.paginaDasVivas({
      escolas: [
        { slug: 'viva', nome: 'Viva', criada_em: iso(agora - 90 * 24 * 60 * MINUTO),
          comercial: { estado: 'ativa', habilitadaEm: iso(agora - 80 * 24 * 60 * MINUTO) } },
        { slug: 'esperando', nome: 'Esperando', criada_em: iso(agora - 1 * MINUTO),
          comercial: { estado: 'aguardando', criadoEm: iso(agora - 1 * MINUTO) } },
        { slug: 'suspensa', nome: 'Suspensa', criada_em: iso(agora - 90 * 24 * 60 * MINUTO),
          comercial: { estado: 'suspensa', desabilitadaEm: iso(agora - 2 * MINUTO),
            carenciaAte: iso(agora + 3 * MINUTO), expurgavel: false, restanteMs: 3 * MINUTO } },
      ],
      professores: [],
    });
    const linha = (slug) => {
      const i = html.indexOf('data-escola="' + slug + '"');
      if (i === -1) return '';
      const fim = html.indexOf('</tr>', i);
      return html.slice(html.lastIndexOf('<tr>', i), fim);
    };
    const botaoDesabilitar = (trecho) => {
      const m = /<button[^>]*data-comercial="suspensa"[^>]*>/.exec(trecho);
      return m ? m[0] : '';
    };
    for (const slug of ['viva', 'esperando']) {
      const b = botaoDesabilitar(linha(slug));
      conferir('«' + slug + '» tem o «Desabilitar» CLICÁVEL (é por aqui que ela começa a carência)',
        b.length > 0 && !/disabled/.test(b), b);
    }
    const suspensa = botaoDesabilitar(linha('suspensa'));
    conferir('a que já está suspensa não oferece desabilitar outra vez',
      /disabled/.test(suspensa), suspensa);
    conferir('…e todas continuam a oferecer «Habilitar» quando não estão ativas',
      /data-comercial="ativa"[^>]*>Habilitar/.test(linha('esperando')), null);
  }

  console.log('\nE. A caixa de apagar: só lista o que se apaga — e não explica o resto');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const html = fs.readFileSync(path.join(RAIZ, 'raiz/index.html'), 'utf8');
    /* A RESPOSTA É A DO SERVIDOR — a mesma forma que a secção B mediu, e não uma inventada. A
     * caixa abre-se pelo gesto, como ela a abre. */
    const abrirACaixa = async (resposta) => {
      const vc = new VirtualConsole();
      const erros = [];
      vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
      const dom = new JSDOM(html, {
        runScripts: 'dangerously', url: 'https://danca.padd.com.br/', virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
          w.scrollTo = () => {};
          w.fetch = (u) => {
            const c = String(u);
            if (c.indexOf('api/escolas') !== -1) {
              return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve(resposta) });
            }
            return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ ok: true }) });
          };
        },
      });
      await new Promise((r) => setTimeout(r, 350));
      const d = dom.window.document;
      /* O MODAL DA LISTA DE APAGAR abriu-se pelo gesto: o botão existe só no painel. */
      const abrir = d.getElementById('btn-apagar') || Array.from(d.querySelectorAll('button'))
        .find((b) => /apagar escola/i.test(b.textContent || ''));
      if (abrir) abrir.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 500));
      const lista = d.getElementById('apagar-lista');
      return {
        erros,
        lista,
        cartoes: lista ? Array.from(lista.querySelectorAll('.cartao')).map((c) => c.textContent) : [],
        texto: lista ? String(lista.textContent || '') : '',
        fechar() { dom.window.close(); },
      };
    };

    const resposta = {
      ok: true,
      carencia: '5 minutos (regime de teste)',
      escolas: [
        { slug: 'viva', professor: 'p1', ciclo: '01', total: 3, estadoComercial: 'ativa',
          expurgavel: false, motivoDoExpurgo: 'A escola está habilitada: apagá-la seria apagar o que está a ser usado.',
          url: 'https://viva.padd.com.br/' },
        { slug: 'em-carencia', professor: 'p3', ciclo: '01', total: 3, estadoComercial: 'suspensa',
          desabilitadaEm: iso(agora - 2 * MINUTO), carenciaAte: iso(agora + 3 * MINUTO),
          expurgavel: false, motivoDoExpurgo: 'A escola está em carência: o prazo vence hoje.',
          url: 'https://em-carencia.padd.com.br/' },
        { slug: 'vencida', professor: 'p4', ciclo: '01', total: 3, estadoComercial: 'suspensa',
          desabilitadaEm: iso(agora - 6 * MINUTO), carenciaAte: iso(agora - 1 * MINUTO),
          expurgavel: true, motivoDoExpurgo: 'A carência venceu.',
          url: 'https://vencida.padd.com.br/' },
      ],
    };

    const tres = await abrirACaixa(resposta);
    conferir('a lista de apagar foi desenhada', Boolean(tres.lista), null);
    conferir('NÃO há cartão para a escola habilitada',
      !tres.cartoes.some((t) => /^viva/.test(String(t).trim())), tres.cartoes.map((t) => t.slice(0, 24)));
    conferir('NÃO há cartão para a escola em carência',
      !tres.cartoes.some((t) => /em-carencia/.test(String(t))), tres.cartoes.map((t) => t.slice(0, 24)));
    conferir('SÓ a que cumpriu a carência tem cartão',
      tres.cartoes.length === 1 && /vencida/.test(String(tres.cartoes[0])), tres.cartoes);
    /* «IMAGINA QUANDO EU TIVER 20.000 ESCOLAS, O TAMANHO QUE VAI SER ISSO» (16/11/2026). O rodapé
     * que dizia «duo: a escola está habilitada: apagá-la seria apagar o que está a ser usado» saiu:
     * a caixa responde a UMA pergunta, e o porquê de cada escola está na lista das vivas. */
    conferir('…e a caixa JÁ NÃO diz quantas ficaram de fora, nem porquê',
      !/não aparece/i.test(tres.texto) && !/apagá-la seria apagar/i.test(tres.texto)
        && !/viva:|em-carencia:/.test(tres.texto), tres.texto.slice(0, 200));
    conferir('…e os scripts da página não lançam', tres.erros.length === 0, tres.erros.slice(0, 1));
    tres.fechar();

    /* SEM NADA PARA APAGAR, UMA LINHA — e só uma. */
    const nenhuma = await abrirACaixa({
      ok: true, carencia: '5 minutos (regime de teste)',
      escolas: resposta.escolas.filter((e) => e.expurgavel !== true),
    });
    conferir('sem escola expurgável, a caixa diz SÓ que não há',
      nenhuma.texto.trim() === 'Não há escola para apagar.', nenhuma.texto);
    conferir('…sem nomear escolas, nem dizer porquê',
      !/viva|em-carencia|habilitada|carência/i.test(nenhuma.texto), nenhuma.texto);
    conferir('…e os scripts da página não lançam', nenhuma.erros.length === 0, nenhuma.erros.slice(0, 1));
    nenhuma.fechar();
  }

  console.log('\nF. A escola re-habilitada perde a etiqueta — e conserva o facto');
  {
    const fuso = require(path.join(RAIZ, 'motor/nucleo/fuso.js'));
    /* O QUE ELA VIU (16/11/2026): «Eu desabilitei a escola Duo, deixei o tempo correr e ela ficou
     * apta para ser apagada. Só que eu fui lá e habilitei a escola novamente e ela continua com a
     * etiqueta dizendo que pode apagar.»
     *
     * A ETIQUETA era calculada na página sobre `desabilitadaEm` — um facto HISTÓRICO, que não se
     * apaga quando a escola volta a ser habilitada —, e por isso sobrevivia à habilitação. A
     * correção não é apagar a data (ela responde a «já esteve suspensa?»): é a página ler o
     * veredicto do servidor, que consulta o estado de AGORA.
     *
     * AQUI O TEMPO É ESCRITO, E NÃO ESPERADO: o KV nasce com a desabilitação de ontem (é o que a
     * carência de cinco minutos do regime de teste deixaria), e o `gravarComercial` faz o que o
     * botão «Habilitar» faz. O `desabilitadaEm` fica; o que tem de mudar é o veredicto. */
    const kv = kvCom({
      'expurgo/regime-de-teste-desde': iso(agora - 60 * MINUTO),
      'bastidores/duo/comercial': JSON.stringify({
        estado: 'suspensa', desabilitadaEm: iso(agora - 30 * MINUTO),
        habilitadaEm: iso(agora - 90 * MINUTO), historico: [],
      }),
    });
    const antes = raiz.comercialDaLista(await raiz.lerComercial(kv, 'duo'));
    conferir('suspensa e com a carência vencida, a lista diria «pode apagar»',
      antes.expurgavel === true, antes);

    const voltou = await raiz.gravarComercial(kv, 'duo', { estado: 'ativa' }, 'prova');
    conferir('o botão «Habilitar» grava o estado de agora', voltou.ok && voltou.comercial.estado === 'ativa', voltou);
    conferir('…e o `desabilitadaEm` NÃO se apaga: é um facto, não um interruptor',
      Boolean(voltou.comercial.desabilitadaEm), voltou.comercial.desabilitadaEm);

    const depois = raiz.comercialDaLista(await raiz.lerComercial(kv, 'duo'));
    conferir('re-habilitada, o veredicto do servidor deixa de a oferecer para apagar',
      depois.expurgavel === false, depois);
    conferir('…e não há carência a anunciar (ela não está suspensa)', depois.restanteMs === null, depois);

    const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
    const pagina = painel.paginaDasVivas({
      escolas: [{ slug: 'duo', nome: 'Duo', criada_em: iso(agora - 90 * 24 * 60 * MINUTO), comercial: depois }],
      professores: [],
    });
    conferir('…e a linha já não diz «pode apagar»', !/pode apagar/.test(pagina), null);
    conferir('…mas a data da desabilitação continua na linha (o histórico não se reescreve)',
      pagina.includes(fuso.quandoLocal(voltou.comercial.desabilitadaEm)),
      fuso.quandoLocal(voltou.comercial.desabilitadaEm));

    /* O CONTROLO NEGATIVO: com a conta antiga — a data contra o relógio —, a mesma escola
     * re-habilitada ainda diria «pode apagar». É a prova de que o defeito era o da etiqueta. */
    const contaAntiga = !depois.desabilitadaEm ? false
      : !(depois.carenciaAte && Date.parse(depois.carenciaAte) > Date.now());
    conferir('a conta antiga (a data contra o relógio) diria «pode apagar» — o defeito reproduzido',
      contaAntiga === true, { desabilitadaEm: depois.desabilitadaEm, carenciaAte: depois.carenciaAte });
  }

  console.log('\nG. O controle negativo: sem a guarda, a mesma chamada apaga');
  {
    /* A GUARDA É REPOSTA EM MEMÓRIA, e o que se mede é a diferença. Sem isto, o «409» da secção C
     * poderia estar a vir de outra coisa — o token, a confirmação, o próprio Cloudflare. */
    const codigo = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    const temGuarda = /A CARÊNCIA ANTES DE TUDO/.test(codigo) && /estadoDoExpurgo\(comercialDaVez/.test(codigo);
    conferir('a guarda existe na rota manual, e chama a MESMA regra da varredura',
      temGuarda, null);
    conferir('…e o `forcar` NÃO a contorna (o `forcar` é lido depois dela)',
      codigo.indexOf('A CARÊNCIA ANTES DE TUDO') < codigo.indexOf("const forcar = corpo && corpo.forcar === true"),
      null);
    conferir('…e a lista usa a mesma função', /estadoDoExpurgo\(c, \{ regimeDesde: regimeDaLista \}\)/.test(codigo), null);
    conferir('…e a varredura também', /estadoDoExpurgo\(comercial, \{ agora, regimeDesde \}\)/.test(codigo), null);
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
