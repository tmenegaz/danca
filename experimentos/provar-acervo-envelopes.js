'use strict';

/*
 * provar-acervo-envelopes.js — os envelopes vivem no repositório, e o KV deixa de ser o dono.
 *
 * O QUE MUDOU (20/10/2026, a fase 3). A fase 1 levou a ANAMNESE para o repositório e deixou o
 * plano e o PO no KV. Ficaram dois mundos, e a anamnese com um caminho próprio no `rotas.js` —
 * escrever num sítio, listar noutro, ler num terceiro. Esta fase troca a peça, não o discurso:
 * o acervo passa a ser um ARMAZENAMENTO (o mesmo contrato do adaptador do KV) sobre a família
 * `envelope/`, e a ponte compõe «acervo para os envelopes, KV para o resto». O `porta.js` — a
 * derivação, o índice, os estados, os vínculos — não mudou uma linha por causa disto.
 *
 * O que esta prova fixa:
 *
 *   A. O CAMINHO. `envelope/<chave>` ↔ `escola/<escola>/envelopes/<chave>`, reversível, e a
 *      barra recusada (a Contents API decodifica o caminho e `%2F` volta a ser separador).
 *   B. A CIFRA. A anamnese vai com as respostas ilegíveis no arquivo; o plano e o PO vão em
 *      claro (a fonte que a geração escreve já os leva abertos). Quem lê pela porta recebe
 *      sempre o envelope em claro — a cifra não vaza para o núcleo.
 *   C. A LISTAGEM. Uma chamada à árvore, e NENHUMA leitura de conteúdo.
 *   D. O 409. Duas escritas concorrentes não perdem o registro: o escritor relê o `sha` e
 *      repete; o índice (`mutar`) reaplica a mutação e não perde a entrada do outro.
 *   E. O LEGADO. Um registro que só existe no KV continua a aparecer e a abrir; a escrita vai
 *      para o repositório, e é essa que manda.
 *   F. A COMPOSIÇÃO. `envelope/` vai para o acervo; o cofre, os cadastros e o cartão da geração
 *      continuam no KV. Uma página, uma leitura do índice (o cache do pedido).
 *   G. O EXPURGO. O acervo da escola sai com ela — incluindo o caminho antigo da fase 1.
 *
 * SEM REDE: um GitHub falso em memória, com `contents` e `git/trees`, e um KV em memória.
 *
 *   node experimentos/provar-acervo-envelopes.js
 */

const crypto = require('node:crypto');

const acervo = require('../motor/servidor/acervo-envelopes.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
const porta = require('../motor/nucleo/porta.js');
const { criarRotas } = require('../motor/servidor/rotas.js');

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PORTA = path.join(RAIZ, 'porta');
const ler = (p) => JSON.parse(fs.readFileSync(path.join(PORTA, p), 'utf8'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
    return;
  }
  falhas += 1;
  console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : '  \u2192 ' + JSON.stringify(detalhe)));
}

// --------------------------------------------------------------- o GitHub falso

/** Um GitHub em memória: um mapa caminho → conteúdo, `sha` derivado, e uma árvore. */
function githubFalso() {
  const arquivos = new Map();
  const estado = { puts: [], gets: 0, arvores: 0, conflitosRestantes: 0, putFalha: null };
  const shaDe = (texto) => 'sha' + crypto.createHash('sha1').update(texto).digest('hex').slice(0, 10);

  const json = (corpo, status) => new Response(JSON.stringify(corpo), {
    status: status || 200, headers: { 'content-type': 'application/json' },
  });

  estado.fetch = async (url, opcoes) => {
    const u = new URL(url);
    const metodo = (opcoes && opcoes.method) || 'GET';

    if (u.pathname.indexOf('/git/trees/') !== -1) {
      estado.arvores += 1;
      return json({
        sha: 'arvore',
        tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: shaDe(arquivos.get(p)) })),
      });
    }

    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return json({}, 404);
    const caminho = decodeURIComponent(m[1]);

    if (metodo === 'GET') {
      estado.gets += 1;
      if (!arquivos.has(caminho)) return new Response('not found', { status: 404 });
      return json({
        sha: shaDe(arquivos.get(caminho)),
        content: Buffer.from(arquivos.get(caminho), 'utf8').toString('base64'),
      });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      estado.puts.push({ caminho, tinhaSha: Boolean(corpo.sha), mensagem: corpo.message });
      if (estado.conflitosRestantes > 0) {
        estado.conflitosRestantes -= 1;
        return json({ message: 'sha does not match' }, 409);
      }
      if (estado.putFalha && estado.putFalha(caminho)) {
        return json({ message: 'recusado de propósito' }, 500);
      }
      arquivos.set(caminho, Buffer.from(corpo.content, 'base64').toString('utf8'));
      return json({ commit: { sha: 'commit-' + estado.puts.length } }, 201);
    }
    if (metodo === 'DELETE') {
      const corpo = JSON.parse(opcoes.body);
      if (!arquivos.has(caminho)) return json({ message: 'not found' }, 404);
      arquivos.delete(caminho);
      estado.puts.push({ caminho, apagou: true, mensagem: corpo.message });
      return json({ commit: { sha: 'commit-del' } }, 200);
    }
    return json({}, 405);
  };
  estado.arquivos = arquivos;
  return estado;
}

const SENHA = 'senha-de-teste-do-acervo';

const ANAMNESE = {
  id: 'anamnese-20261019-1842',
  documento: 'anamnese',
  envelope: '1.2.0',
  gerado_em: '2026-10-19T18:42:00-03:00',
  contexto: { escola: 'calango', professor: 'sapo-bailarino', ciclo: '01', aluna: 'Ana María' },
  respostas: {
    idade: { valor: '12/03/2015', origem: 'declarado' },
    'cinco-posicoes-1a-pes': { valor: ['Bom', 'com-toque'], origem: 'declarado' },
  },
  notas: { idade: 'data de nascimento' },
};

const PLANO = {
  id: 'plano-20261019-1900',
  documento: 'plano',
  gerado_em: '2026-10-19T19:00:00-03:00',
  contexto: { escola: 'calango', professor: 'sapo-bailarino', ciclo: '01' },
  respostas: {
    'contexto-turma': { valor: 'Turma Teste', origem: 'declarado' },
    'objetivo-geral': { valor: 'Sustentar o equilíbrio na meia-ponta', origem: 'declarado' },
    repertorio: { valor: ['Cambré', 'Batlement'], origem: 'declarado' },
  },
};

const PO = {
  id: 'po-20261019-1910',
  documento: 'po',
  gerado_em: '2026-10-19T19:10:00-03:00',
  contexto: { escola: 'calango', professor: 'sapo-bailarino', ciclo: '01' },
  respostas: {
    sujeitos: { valor: ['Ana María'], origem: 'declarado' },
    'plano-de-ensino': { valor: 'plano-20261019-1900', origem: 'declarado' },
  },
};

/**
 * O KV COMO A ESCOLA O VÊ. No Worker, o adaptador de KV namespaça a família `envelope/` com o
 * slug da escola (`calango/envelope/…`); a chave LÓGICA que o núcleo usa continua a mesma.
 * Aqui o mesmo embrulho, para a prova medir o que a ponte mede.
 */
function kvDaEscola(memoria) {
  const fisica = (chave) => 'calango/' + chave;
  return {
    ler: (chave) => memoria.ler(fisica(chave)),
    guardar: (chave, texto) => memoria.guardar(fisica(chave), texto),
    apagar: (chave) => memoria.apagar(fisica(chave)),
    existe: (chave) => memoria.existe(fisica(chave)),
    listar: async (prefixo) => (await memoria.listar(fisica(prefixo)))
      .map((c) => c.slice('calango/'.length)),
  };
}

function criarAcervo(gh, extra) {
  return acervo.criarAcervoDeEnvelopes(Object.assign({
    token: 'token-de-teste',
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
    escola: 'calango',
    senhaCripto: SENHA,
    fetchImpl: gh.fetch,
  }, extra || {}));
}

async function main() {
  // =========================================================== A
  console.log('\nA. O caminho é a chave, e a barra é recusada');
  {
    checar('envelope/plano-… → escola/calango/envelopes/plano-…',
      acervo.caminhoDaChave('calango', 'envelope/plano-20261019-1900.json')
        === 'escola/calango/envelopes/plano-20261019-1900.json',
      acervo.caminhoDaChave('calango', 'envelope/plano-20261019-1900.json'));
    checar('e o inverso devolve a mesma chave',
      JSON.stringify(acervo.lerCaminho('escola/calango/envelopes/plano-20261019-1900.json'))
        === JSON.stringify({ escola: 'calango', chave: 'envelope/plano-20261019-1900.json' }),
      acervo.lerCaminho('escola/calango/envelopes/plano-20261019-1900.json'));

    let recusou = false;
    try { acervo.caminhoDaChave('calango', 'envelope/a/b.json'); } catch (e) { recusou = true; }
    checar('a barra no nome é RECUSADA, não codificada (a Contents API decodifica o caminho)', recusou);

    let semEscola = false;
    try { acervo.caminhoDaChave('', 'envelope/x.json'); } catch (e) { semEscola = true; }
    checar('sem escola não há caminho (o Worker da raiz não é escola)', semEscola);

    checar('o caminho da fase 1 (anamneses/) ainda é reconhecido como acervo',
      acervo.ehAcervoDaEscola('escola/calango/anamneses/Ana--anamnese-20261019-1842.json', 'calango'));
    checar('e o da fase 3 também',
      acervo.ehAcervoDaEscola('escola/calango/envelopes/plano-1.json', 'calango'));
    checar('o índice da escola NÃO é acervo (é o elo do expurgo, e sobrevive)',
      !acervo.ehAcervoDaEscola('escola/calango/indice.json', 'calango'));
    checar('o acervo de OUTRA escola não é desta',
      !acervo.ehAcervoDaEscola('escola/batata/envelopes/plano-1.json', 'calango'));
  }

  // =========================================================== B
  console.log('\nB. O dado de menor vai cifrado; o plano e o PO vão em claro');
  {
    const gh = githubFalso();
    const a = criarAcervo(gh);
    await a.guardar('envelope/anamnese-20261019-1842.json', JSON.stringify(ANAMNESE, null, 2) + '\n');
    await a.guardar('envelope/plano-20261019-1900.json', JSON.stringify(PLANO, null, 2) + '\n');
    await a.guardar('envelope/po-20261019-1910.json', JSON.stringify(PO, null, 2) + '\n');

    const daAnamnese = gh.arquivos.get('escola/calango/envelopes/anamnese-20261019-1842.json');
    checar('o arquivo da anamnese existe no repositório', Boolean(daAnamnese));
    checar('as RESPOSTAS não estão legíveis no arquivo',
      daAnamnese.indexOf('12/03/2015') === -1 && daAnamnese.indexOf('com-toque') === -1);
    const arquivo = JSON.parse(daAnamnese);
    checar('as respostas viajam num `_cifrado` autodescritivo',
      Boolean(arquivo.respostas && arquivo.respostas._cifrado && arquivo.respostas._cifrado.iteracoes));
    checar('e o metadado fica em claro (é o que a listagem lê, e não abre respostas)',
      arquivo.contexto.aluna === 'Ana María' && arquivo.id === 'anamnese-20261019-1842');

    const doPlano = gh.arquivos.get('escola/calango/envelopes/plano-20261019-1900.json');
    checar('o plano vai em CLARO (a fonte que a geração escreve já o leva aberto)',
      JSON.parse(doPlano).respostas['objetivo-geral'].valor.indexOf('meia-ponta') !== -1);

    // E quem lê pela porta recebe o envelope em claro: a cifra não vaza para o núcleo.
    const lido = await a.ler('envelope/anamnese-20261019-1842.json');
    const devolta = JSON.parse(lido);
    checar('a leitura devolve o envelope EM CLARO',
      devolta.respostas.idade.valor === '12/03/2015'
        && devolta.respostas['cinco-posicoes-1a-pes'].valor[1] === 'com-toque',
      Object.keys(devolta.respostas || {}));

    // SEM TOKEN, a escola é a de antes: grava no KV, e nada vai para o repositório. É o que
    // mantém viva uma escola que nunca recebeu o `GITHUB_TOKEN` — a fase não pode transformar
    // «não sei escrever no repositório» em «não sei gravar».
    const ghSemToken = githubFalso();
    const kvSemToken = criarMemoria();
    const semToken = acervo.criarAcervoDeEnvelopes({
      token: null, escola: 'calango', legado: kvSemToken, fetchImpl: ghSemToken.fetch,
    });
    await semToken.guardar('envelope/plano-20261019-1900.json', JSON.stringify(PLANO) + '\n');
    checar('sem GITHUB_TOKEN a gravação vai para o KV (a escola de antes continua a gravar)',
      (await kvSemToken.ler('envelope/plano-20261019-1900.json')) !== null);
    checar('e nada foi escrito no repositório', ghSemToken.arquivos.size === 0, ghSemToken.arquivos.size);

    // Sem SENHA_CRIPTO a anamnese não é escrita — nunca em claro no repositório.
    const gh2 = githubFalso();
    const semSenha = criarAcervo(gh2, { senhaCripto: null });
    let recusou = false;
    try {
      await semSenha.guardar('envelope/anamnese-20261019-1842.json', JSON.stringify(ANAMNESE) + '\n');
    } catch (e) { recusou = true; }
    checar('sem SENHA_CRIPTO a anamnese é RECUSADA (nada em claro)', recusou);
    checar('e nada foi escrito no repositório', gh2.arquivos.size === 0, gh2.arquivos.size);
  }

  // =========================================================== C
  console.log('\nC. A listagem é UMA chamada, e não lê conteúdo nenhum');
  {
    const gh = githubFalso();
    const a = criarAcervo(gh);
    for (let i = 0; i < 12; i++) {
      const id = 'anamnese-20261019-10' + String(i).padStart(2, '0');
      await a.guardar('envelope/' + id + '.json', JSON.stringify(Object.assign({}, ANAMNESE, { id })) + '\n');
    }
    await a.guardar('envelope/plano-20261019-1900.json', JSON.stringify(PLANO) + '\n');
    // Uma escola vizinha, que não pode aparecer nesta listagem.
    gh.arquivos.set('escola/batata/envelopes/plano-20261019-2000.json', '{}');

    const antes = { gets: gh.gets, arvores: gh.arvores };
    const lista = await a.listar('envelope/');
    checar('a lista traz os 13 registros desta escola', lista.length === 13, lista.length);
    checar('e não traz o da outra escola', lista.indexOf('envelope/plano-20261019-2000.json') === -1);
    checar('UMA árvore para a listagem', gh.arvores - antes.arvores === 1, gh.arvores - antes.arvores);
    checar('e NENHUMA leitura de conteúdo', gh.gets - antes.gets === 0, gh.gets - antes.gets);

    const depois = { arvores: gh.arvores };
    await a.listar('envelope/plano-');
    checar('a segunda listagem do mesmo pedido não volta ao GitHub (cache do pedido)',
      gh.arvores - depois.arvores === 0, gh.arvores - depois.arvores);
  }

  // =========================================================== D
  console.log('\nD. O 409 repete — e o índice não perde a entrada do outro');
  {
    const gh = githubFalso();
    const a = criarAcervo(gh);
    gh.conflitosRestantes = 1;
    const r = await a.guardar('envelope/plano-20261019-1900.json', JSON.stringify(PLANO) + '\n');
    checar('a escrita sobrevive a UM conflito', r.ok === true, r);

    // DUAS ESCRITAS DO ÍNDICE "AO MESMO TEMPO": a segunda leu a versão antes da primeira.
    // O `mutar` relê e reaplica; a entrada da primeira não pode desaparecer.
    const b = criarAcervo(gh);
    const c = criarAcervo(gh);
    await b.mutar('envelope/.indice.json', (atual) => {
      const d = atual ? JSON.parse(atual) : { nomes: [], resumos: {} };
      d.nomes.push('plano-20261019-1900.json');
      d.resumos['plano-20261019-1900.json'] = { id: 'plano-20261019-1900' };
      return JSON.stringify(d);
    });
    // A `c` leu a versão de ANTES da escrita da `b` (é o que acontece entre dois isolates).
    const lidoAntes = null;
    await c.mutar('envelope/.indice.json', (atual) => {
      const d = atual ? JSON.parse(atual) : { nomes: [], resumos: {} };
      d.nomes.push('anamnese-20261019-1842.json');
      d.resumos['anamnese-20261019-1842.json'] = { id: 'anamnese-20261019-1842' };
      return JSON.stringify(d);
    });
    const indice = JSON.parse(gh.arquivos.get('escola/calango/envelopes/.indice.json'));
    checar('as DUAS entradas sobrevivem ao índice (a mutação é reaplicada, não sobrescrita)',
      indice.nomes.length === 2 && indice.nomes.indexOf('plano-20261019-1900.json') !== -1,
      indice.nomes);

    checar('e com o conteúdo igual o índice NÃO é reescrito (nenhum commit de nada)',
      (await (async () => {
        const antes = gh.puts.length;
        const d = criarAcervo(gh);
        await d.mutar('envelope/.indice.json', (atual) => (atual === gh.arquivos.get('escola/calango/envelopes/.indice.json') ? null : atual));
        return gh.puts.length === antes;
      })()) === true);
    void lidoAntes;
  }

  // =========================================================== E
  console.log('\nE. O legado do KV: aparece, abre, e perde para o repositório');
  {
    const gh = githubFalso();
    const kv = kvDaEscola(criarMemoria());
    await kv.guardar('envelope/plano-20261018-0900.json',
      JSON.stringify(Object.assign({}, PLANO, { id: 'plano-20261018-0900' })) + '\n');
    await kv.guardar('envelope/.indice.json',
      JSON.stringify({ versao: porta.VERSAO_DO_RESUMO, nomes: ['plano-20261018-0900.json'], resumos: {} }));

    const a = criarAcervo(gh, { legado: kv });
    await a.guardar('envelope/plano-20261019-1900.json', JSON.stringify(PLANO) + '\n');

    const lista = await a.listar('envelope/');
    checar('a lista traz o do repositório E o do KV',
      lista.indexOf('envelope/plano-20261019-1900.json') !== -1
        && lista.indexOf('envelope/plano-20261018-0900.json') !== -1, lista);
    const velho = JSON.parse(await a.ler('envelope/plano-20261018-0900.json'));
    checar('o registro que só está no KV continua a abrir', velho.id === 'plano-20261018-0900');

    // A MESMA chave nos dois lados: o repositório manda.
    await kv.guardar('envelope/plano-20261019-1900.json',
      JSON.stringify(Object.assign({}, PLANO, { respostas: { 'objetivo-geral': { valor: 'do KV' } } })) + '\n');
    const vigente = JSON.parse(await a.ler('envelope/plano-20261019-1900.json'));
    checar('com a chave nos dois lados, o REPOSITÓRIO é a verdade',
      vigente.respostas['objetivo-geral'].valor.indexOf('meia-ponta') !== -1,
      vigente.respostas['objetivo-geral'].valor);

    await a.guardar('envelope/plano-20261020-0800.json', JSON.stringify(PLANO) + '\n');
    checar('e a ESCRITA não toca no KV (o legado é só de leitura)',
      (await kv.ler('envelope/plano-20261020-0800.json')) === null);
  }

  // =========================================================== F
  console.log('\nF. A composição: envelope/ no acervo, o resto no KV — uma página, uma leitura');
  {
    const gh = githubFalso();
    const kv = criarMemoria();
    const acervoSo = criarAcervo(gh);
    const composto = acervo.combinar(acervoSo, kv);

    await composto.guardar('envelope/plano-20261019-1900.json', JSON.stringify(PLANO) + '\n');
    await composto.guardar('calango/sapo-bailarino/01/anamnese/x', 'cifrado do cofre');
    checar('o envelope foi para o repositório',
      gh.arquivos.has('escola/calango/envelopes/plano-20261019-1900.json'));
    checar('e o cofre ficou no KV',
      (await kv.ler('calango/sapo-bailarino/01/anamnese/x')) === 'cifrado do cofre');
    checar('o cofre NÃO aparece no repositório',
      [...gh.arquivos.keys()].every((k) => k.indexOf('/anamnese/x') === -1));

    // UMA PÁGINA, TRÊS ROTAS: o índice é lido uma vez.
    await acervoSo.guardar('envelope/.indice.json', JSON.stringify({
      versao: porta.VERSAO_DO_RESUMO,
      nomes: ['plano-20261019-1900.json'],
      resumos: { 'plano-20261019-1900.json': porta.resumoDoEnvelope(PLANO, 'plano-20261019-1900.json') },
    }) + '\n');
    const umPedido = criarAcervo(gh);
    const antes = gh.gets;
    const rotas = criarRotas({
      armazenamento: acervo.combinar(umPedido, kv),
      conteudo: ler('conteudo/anamnese.json'),
      esquema: ler('envelope/elicitacao-schema.json'),
      conteudoPO: ler('po/conteudo/po.json'),
      conteudoPlano: ler('plano/conteudo/plano.json'),
      fuso: 'America/Sao_Paulo',
      escolaDoWorker: 'calango',
    });
    const pedir = async (caminho) => {
      const r = await rotas.responder(new Request('http://local' + caminho));
      return JSON.parse(await r.text());
    };
    const envelopes = await pedir('/api/envelopes');
    const planos = await pedir('/api/planos');
    const estados = await pedir('/api/plano-estados');
    checar('/api/envelopes responde pelo repositório',
      envelopes.ok && envelopes.envelopes.indexOf('plano-20261019-1900.json') !== -1, envelopes.envelopes);
    checar('/api/planos traz o objetivo do resumo (sem abrir o envelope)',
      planos.opcoes.length === 1 && planos.opcoes[0].rotulo.indexOf('meia-ponta') !== -1,
      planos.opcoes);
    checar('/api/plano-estados também', estados.estados['plano-20261019-1900'].estado === 'solta',
      estados.estados);
    // UMA leitura do índice: as três rotas passam pelo mesmo cache do pedido.
    checar('as TRÊS rotas custam UMA leitura do índice (' + (gh.gets - antes) + ')',
      gh.gets - antes === 1, gh.gets - antes);
  }

  // =========================================================== G
  console.log('\nG. O expurgo leva o acervo — e a gravação que falha não cega a estante');
  {
    const { escolaDosCaminhos } = require('../motor/servidor/repo-escola.js');
    const caminhos = [
      'wrangler.calango.jsonc',
      'escola/calango/indice.json',
      'escola/calango/envelopes/plano-20261019-1900.json',
      'escola/calango/envelopes/po-20261019-1910.json',
      'escola/calango/anamneses/Ana--anamnese-20261019-1842.json',
      'escola/batata/envelopes/plano-20261019-2000.json',
      'professores/sapo-bailarino/ciclos/ciclo-01-calango.conf',
    ];
    const escola = escolaDosCaminhos('calango', caminhos);
    checar('o acervo da fase 3 entra no expurgo',
      escola.arquivos.indexOf('escola/calango/envelopes/plano-20261019-1900.json') !== -1,
      escola.arquivos);
    checar('e o caminho da fase 1 também',
      escola.arquivos.indexOf('escola/calango/anamneses/Ana--anamnese-20261019-1842.json') !== -1);
    checar('o acervo da OUTRA escola não',
      escola.arquivos.indexOf('escola/batata/envelopes/plano-20261019-2000.json') === -1);
    checar('e o índice da escola sobrevive (é o elo)',
      escola.arquivos.indexOf('escola/calango/indice.json') === -1);

    // A GRAVAÇÃO QUE FALHA: o nome fica órfão no índice? Não — a ordem é índice, registro, e a
    // falha do registro limpa o nome. O que nunca acontece é o contrário: registro gravado e
    // invisível na estante.
    const gh = githubFalso();
    const a = criarAcervo(gh);
    gh.putFalha = (caminho) => caminho.indexOf('/envelopes/plano-') !== -1;
    const falhou = await porta.gravarEnvelope(a, PLANO, {
      id: 'plano-20261019-1900',
      estado: 'completo',
      errosDoDocumento: [],
      contagem: { respondidos: 2, obrigatorios: 2 },
      elos: [],
      paradas: [],
      idsDesconhecidos: [],
      validacao: { resultado: 'ok', contrato: 'envelope/elicitacao-schema.json' },
    });
    checar('a gravação que falha devolve `ok: false` com o motivo (não é excepção)',
      falhou.ok === false && Boolean(falhou.erro), falhou);
    const indice = JSON.parse(gh.arquivos.get('escola/calango/envelopes/.indice.json'));
    checar('e o nome não fica órfão no índice',
      indice.nomes.indexOf('plano-20261019-1900.json') === -1, indice.nomes);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
