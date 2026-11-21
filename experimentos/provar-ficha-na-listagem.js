#!/usr/bin/env node
'use strict';

/**
 * provar-ficha-na-listagem.js — LER NÃO É EDITAR (27/10/2026).
 *
 * O PEDIDO, nas palavras da pesquisadora: «Eu tô com a escola Batata e fiz a anamnese da aluna A e
 * da aluna B. […] A gente tinha combinado que quando elas estão na listagem, quando eu coloco o
 * mouse ou clico sobre o nome da aluna, eu consigo ir até a anamnese dela, sem eu ter que clicar
 * em editar, porque editar é um lugar de atenção. […] no formato de ficha preenchida, inclusive se
 * eu quisesse imprimir. […] A mesma coisa para o plano de ensino e para o plano de observação.»
 *
 * O QUE SE PERDEU, e o que NÃO se perdeu. As três folhas continuam a ser SERVIDAS — o endpoint
 * responde 200 com o documento inteiro. O que o layout novo da listagem não trouxe foi o LINK: a
 * linha passou a oferecer só «Editar»/«Ajustar»/«Apagar», e o nome virou texto morto. O documento
 * existia e não havia como chegar a ele a partir do sítio onde se procura por ele.
 *
 * O DESENHO JÁ ESTAVA DECIDIDO — e é isso que faz esta prova ser uma restauração, e não uma
 * invenção. Em `experimentos/propostas/construir.js` (a bancada de 24/10) o cartão tem
 * `<b><a href="api/ficha-preenchida.<id>?formato=html" target="_blank" rel="noopener">nome</a></b>`
 * e a linha «o nome abre a ficha em .html, pronta a imprimir». A bancada usou a classe
 * `nome-do-registo`, que nunca entrou na folha nem no catálogo — e é por isso que o desenho não
 * passou à produção: nenhuma classe se inventa. Aqui usa-se o `<a>` dentro do `<b>`, sem classe
 * nova, com o `main a` que a folha já tem.
 *
 * O QUE ESTA PROVA TRAVA:
 *
 *   1. o NOME de cada linha é um link para a ficha daquele registo, nas três famílias;
 *   2. o endereço leva o CARIMBO do registo e `formato=html` — o formato importa: sem ele o
 *      servidor devolve markdown, que o navegador mostra como texto corrido;
 *   3. o link abre em ABA NOVA (`_blank` + `noopener`): ler não é sair da lista;
 *   4. a ficha QUE O LINK APONTA responde 200, é HTML, tem `<h1>` e nomeia o registo — medida
 *      pela rota a sério, e não pela forma do endereço;
 *   5. «Editar» NÃO DESAPARECE: ler é acrescentar, não substituir;
 *   6. o PO ganhou folha (`po-preenchido`), que não tinha — até hoje abria o JSON cru.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): o `motor/nucleo/lista-html.js` de ANTES da correção,
 * lido do histórico (o commit que introduziu `nomeDaLista`, menos um). Espera-se que as asserções
 * do LINK reprovem — se passassem, a prova não estaria a medir a correção.
 *
 *   node experimentos/provar-ficha-na-listagem.js [--controle-negativo]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const ARQUIVO_DO_RENDER = path.join(raiz, 'motor/nucleo/lista-html.js');
/* O `producao` NÃO SE CARREGA AQUI. O controle negativo tem de o obrigar a usar o renderizador
   ANTIGO, e a única forma honesta de o fazer é pôr o antigo na cache do `require` ANTES de o
   servidor ser carregado — senão o servidor fica com o novo, a listagem sai com links, e o
   controle mede só a última secção (foi o que aconteceu à primeira versão: 1 falha em 35, quando
   deviam ser todas as do link). */
const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));

let total = 0;
let falhas = 0;
const provar = (nome, ok, detalhe) => {
  total += 1;
  console.log('  ' + (ok ? 'ok    ' : 'FALHOU') + ' ' + nome
    + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const negativo = process.argv.includes('--controle-negativo');

/* ------------------------------------------------------------------ o módulo sob medida
 *
 * O CONTROLE NEGATIVO TROCA O RENDERIZADOR, e não o servidor: o que se mede é a marcação do
 * cartão. O ref não se fixa em `HEAD` (a lição de 26/10 e de hoje): é o commit que introduziu
 * `nomeDaLista`, menos um — o último estado em que o nome era texto morto. `REF_NEGATIVO`
 * sobrepõe-se.
 */
const entregador = (() => {
  if (!negativo) return require(ARQUIVO_DO_RENDER);
  const ARQUIVO = 'motor/nucleo/lista-html.js';
  const em = (ref) => {
    try { return execFileSync('git', ['show', ref + ':' + ARQUIVO], { cwd: raiz, encoding: 'utf8' }); }
    catch (e) { return null; }
  };
  let ref = process.env.REF_NEGATIVO || '';
  if (!ref) {
    if (em('HEAD') !== null && em('HEAD').indexOf('nomeDaLista') === -1) {
      ref = 'HEAD';
    } else {
      let sha = '';
      try {
        sha = execFileSync('git', ['log', '-1', '--format=%H', '-SnomeDaLista', '--', ARQUIVO],
          { cwd: raiz, encoding: 'utf8' }).trim();
      } catch (e) { sha = ''; }
      ref = sha ? sha + '~1' : 'HEAD';
    }
  }
  const texto = em(ref);
  if (texto === null) {
    console.error('provar-ficha-na-listagem: controle sem referência (' + ref + ') — NÃO FEITO.');
    process.exit(2);
  }
  console.log('  (controle sobre ' + ref + ')');
  /* O MÓDULO ANTIGO TEM DE SER CARREGADO DO SÍTIO DELE. As `require` do ficheiro são relativas
     (`../nucleo/…`), e um `new Function(...)` — a primeira tentativa — rebenta a resolver o
     primeiro `require` que não seja de biblioteca. Escreve-se ao lado do original, carrega-se, e
     apaga-se: um ficheiro temporário dentro de `motor/nucleo/` que existe durante a execução da
     prova e não fica. */
  const ALVO = path.join(raiz, ARQUIVO);
  const TEMP = path.join(path.dirname(ALVO), '.lista-html-antigo.' + process.pid + '.js');
  fs.writeFileSync(TEMP, texto, 'utf8');
  const antigo = require(TEMP);
  try { fs.unlinkSync(TEMP); } catch (e) { /* já não está lá */ }
  /* A CACHE, e não só o objeto devolvido: `listas-do-acervo.js` faz
     `require('../nucleo/lista-html.js')` — e essa resolução já aconteceu (ou vai acontecer) para o
     caminho REAL do ficheiro. Pôr o antigo nessa chave é o que faz o SERVIDOR desenhar com o
     código de antes; sem isto, o controle testa um objeto que ninguém usa. */
  require.cache[ARQUIVO_DO_RENDER] = { id: ARQUIVO_DO_RENDER, filename: ARQUIVO_DO_RENDER,
    loaded: true, exports: antigo };
  return antigo;
})();

/* SÓ AGORA o servidor — para ele apanhar o renderizador que o controle escolheu. */
const producao = require(path.join(raiz, 'motor/servidor/producao.js'));

/* ------------------------------------------------------------------ a bancada */

/* A ESCOLA MUDOU DE `batata` PARA `breu` (20/11/2026). Os envelopes já eram DECLARADOS aqui — o
 * que faltava era a publicação no disco, e a `batata` não a tem (foi expurgada). A `breu` tem
 * `publicacao/breu/`, que é o que o `ASSETS` desta bancada serve. O slug do professor acompanha,
 * porque é ele que aparece no contexto dos envelopes e no nome do dono. */
const ESCOLA = 'breu';
const PROF = 'demi-plie';
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json',
};

function kv(inicial) {
  const m = new Map(Object.entries(inicial || {}));
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, String(v)); },
    async delete(k) { m.delete(k); },
    async list(p) {
      return { keys: [...m.keys()].filter((k) => !p || k.startsWith(p)).map((name) => ({ name })),
        list_complete: true };
    },
  };
}

function assets(dir) {
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      let p = path.join(dir, url.pathname);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p)) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(p), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(p)] || 'application/octet-stream' } });
    },
  };
}

const relatorio = (id) => ({
  id, estado: 'x', contagem: { respondidos: 1, obrigatorios: 1 }, elos: [], paradas: [],
  idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' }, errosDoDocumento: [], linhas: [],
});
const resposta = (valor) => ({ valor });
const envelope = ({ id, professor, aluna, respostas, geradoEm }) => ({
  id,
  contexto: { escola: ESCOLA, professor, ciclo: '01', ...(aluna ? { aluna } : {}) },
  respostas: respostas || {},
  gerado_em: geradoEm,
});

(async () => {
  const dirDaPublicacao = path.join(raiz, 'publicacao', ESCOLA);
  if (!fs.existsSync(dirDaPublicacao)) {
    console.error('provar-ficha-na-listagem: falta publicacao/' + ESCOLA
      + ' — corra `node tools/montar-publicacao.js ' + ESCOLA + '` — NÃO FEITO.');
    process.exit(2);
  }

  const env = {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', PROFESSOR_NOME: 'Demi Plié',
    SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
    PADD_KV: kv(), ASSETS: assets(dirDaPublicacao),
  };
  /* O `PROFESSOR_NOME` É O QUE ABRE A ÁREA DO PROFESSOR (`temProfessor`): sem ele a porta
     responde «Área do Professor desabilitada», e a ficha — que vive debaixo do prefixo da porta —
     não seria servida. A primeira versão desta bancada esqueceu-o e mediu essa página em vez do
     documento. */
  const arm = producao.__armazenamento(env);
  const docs = [
    envelope({ id: 'anamnese-20261027-0939', professor: PROF, aluna: 'Aluna A',
      respostas: { idade: resposta('12'), 'contexto-aluna': resposta('Aluna A') },
      geradoEm: '2026-10-27T09:39' }),
    envelope({ id: 'anamnese-20261027-0943', professor: PROF, aluna: 'Aluna B',
      respostas: { idade: resposta('14'), 'contexto-aluna': resposta('Aluna B') },
      geradoEm: '2026-10-27T09:43' }),
    envelope({ id: 'plano-20261027-1000', professor: PROF,
      respostas: { 'objetivo-geral': resposta('consolidar o alinhamento'),
        'contexto-turma': resposta('Balé Nível 2') },
      geradoEm: '2026-10-27T10:00' }),
    envelope({ id: 'po-20261027-1010', professor: PROF,
      respostas: { sujeitos: resposta(['Aluna A']),
        'plano-de-ensino': resposta(['plano-20261027-1000']) },
      geradoEm: '2026-10-27T10:10' }),
  ];
  for (const d of docs) await porta.gravarEnvelope(arm, d, relatorio(d.id));

  const pedir = async (caminho) => {
    const r = await producao.fetch(new Request('https://' + ESCOLA + '.tmenegaz77.workers.dev' + caminho), env);
    return { status: r.status, tipo: r.headers.get('content-type') || '', html: await r.text() };
  };

  /** Os links de ficha de uma listagem: `{ nome, href, alvo, rel }`. */
  const linksDa = (html) => [...html.matchAll(
    /<a href="([^"]*preenchid[^"]*)"([^>]*)>([^<]*)<\/a>/g)]
    .map((m) => ({ href: m[1], attrs: m[2], nome: m[3].trim() }));

  console.log('\n1. O nome de cada linha abre a ficha — nas três famílias');
  const familias = [
    ['anamnese', '/area-do-professor/anamnese/', ['Aluna A', 'Aluna B'], 'ficha-preenchida'],
    ['plano de ensino', '/area-do-professor/plano-de-ensino/', ['Plano de ensino — Balé Nível 2'],
      'plano-preenchido'],
    ['plano de observação', '/area-do-professor/plano-de-observacao/', null, 'po-preenchido'],
  ];
  for (const [rotulo, caminho, nomes, rota] of familias) {
    const r = await pedir(caminho);
    const links = linksDa(r.html);
    provar(rotulo + ': a listagem responde 200', r.status === 200, r.status);
    provar(rotulo + ': a linha tem um link de ficha', links.length > 0,
      links.map((l) => l.href));
    provar(rotulo + ': o link aponta para `' + rota + '`',
      links.length > 0 && links.every((l) => l.href.indexOf(rota) !== -1),
      links.map((l) => l.href));
    provar(rotulo + ': o link leva o carimbo do registo',
      links.length > 0 && links.every((l) => /\.[a-z]+-\d{8}-?\d*$/.test(l.href.split('?')[0])),
      links.map((l) => l.href));
    /* O `formato=html` NÃO É PORMENOR: sem ele o servidor devolve MARKDOWN, e o navegador mostra
       o documento como texto corrido. Um link que abre markdown não é uma ficha. */
    provar(rotulo + ': o link pede `formato=html`',
      links.length > 0 && links.every((l) => /formato=html/.test(l.href)),
      links.map((l) => l.href));
    provar(rotulo + ': abre em ABA NOVA, sem dar ao destino acesso à lista',
      links.length > 0 && links.every((l) => /target="_blank"/.test(l.attrs)
        && /rel="noopener"/.test(l.attrs)),
      links.map((l) => l.attrs));
    provar(rotulo + ': o nome do registo está DENTRO do link, e não ao lado',
      links.length > 0 && links.every((l) => l.nome.length > 0),
      links.map((l) => l.nome));
    if (nomes) {
      provar(rotulo + ': cada registo tem o seu link, com o nome da linha',
        links.length === nomes.length && nomes.every((n) => links.some((l) => l.nome === n)),
        links.map((l) => l.nome));
    }
  }

  console.log('\n2. «Editar» continua lá — ler é ACRESCENTAR, não substituir');
  const daAnamnese = await pedir('/area-do-professor/anamnese/');
  provar('a listagem da anamnese ainda oferece «Editar»',
    />Editar<\/a>/.test(daAnamnese.html), daAnamnese.html.indexOf('Editar'));

  console.log('\n3. A ficha que o link aponta responde, e é o documento');
  /* MEDIDO PELA ROTA A SÉRIO, e não pela forma do endereço: um link bonito para um 404 seria
     exactamente o defeito que esta prova existe para impedir. */
  const daLista = linksDa((await pedir('/area-do-professor/anamnese/')).html);
  for (const l of daLista) {
    const f = await pedir(l.href);
    provar('a ficha de ' + l.nome + ' responde 200', f.status === 200, f.status);
    provar('…e é HTML, com a folha montada',
      /text\/html/.test(f.tipo) && /<h1/.test(f.html), f.tipo);
    provar('…e nomeia o registo que se pediu',
      f.html.indexOf(l.href.split('.').pop().split('?')[0]) !== -1
      || f.html.indexOf(l.nome) !== -1, l.href);
  }

  console.log('\n4. O PO ganhou folha — não abre mais o JSON cru');
  const doPO = linksDa((await pedir('/area-do-professor/plano-de-observacao/')).html);
  if (doPO.length) {
    const f = await pedir(doPO[0].href);
    provar('a folha do PO responde 200', f.status === 200, f.status);
    provar('…e é uma folha, e não um despejo de JSON',
      /text\/html/.test(f.tipo) && /<h1/.test(f.html) && f.html.indexOf('"respostas"') === -1,
      f.tipo);
    provar('…e não manda o professor para o envelope cru',
      doPO[0].href.indexOf('/api/envelope/') === -1, doPO[0].href);
  } else {
    provar('a listagem do PO não tem link de ficha (fixture vazio — não se inventa)', false, null);
  }

  console.log('\n5. Sem endereço de ficha, o nome continua texto — e não um link para o vazio');
  /* A REGRA DO RENDERIZADOR, isolada do servidor: `item.ler` ausente não pode produzir
     `<a href="">`, que é um link que recarrega a página e parece avariado. */
  const semLer = entregador.cartaoDaLista({ nome: 'Aluna Z', selo: 'livre' }, 0);
  provar('sem `ler`, o nome é `<b>` e não há `<a>`', /<b>Aluna Z<\/b>/.test(semLer)
    && semLer.indexOf('<a href="">') === -1, semLer.split('\n')[2]);
  const comLer = entregador.cartaoDaLista(
    { nome: 'Aluna Z', selo: 'livre', ler: '/anamnese/api/ficha-preenchida.x-1?formato=html' }, 0);
  provar('com `ler`, o link existe e está dentro do `<b>`',
    /<b><a href="\/anamnese\/api\/ficha-preenchida\.x-1\?formato=html"/.test(comLer),
    comLer.split('\n')[2]);

  const esperado = negativo ? 'reprovar' : 'passar';
  console.log('\n' + (falhas
    ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
    : 'TUDO CERTO — ' + total + ' asserção(ões), 0 falha(s)') + '.'
    + (negativo ? ' (controle negativo: esperado ' + esperado + ')' : ''));
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('provar-ficha-na-listagem: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
