'use strict';

/*
 * provar-verbos-do-armazenamento.js — todo o verbo do contrato chega ao motor, por QUALQUER
 * armazenamento que o sistema monte.
 *
 * O DEFEITO QUE ISTO EXISTE PARA IMPEDIR, e ele aconteceu duas vezes no mesmo dia (04/11/2026):
 *
 *   1. o `criar` nasceu no acervo do repositório e ficou de fora do `combinar` — a blindagem
 *      contra dois «Guardar» no mesmo minuto existia no adaptador e nunca chegava ao motor. As
 *      bancadas não o viram porque montavam o acervo DIRETO, e o Worker monta o COMPOSTO;
 *   2. o `anexar` também estava de fora do `combinar`, e o registro de custo da IA é acrescentado
 *      por ele — a rota chamava `armazenamento.anexar` e recebia «não é uma função»;
 *   3. e, por baixo dos dois, os DOIS adaptadores de base (`node.js`, `cloudflare.js`) não
 *      implementavam o `criar` que o contrato declara — de modo que o CLI e o KV do Worker
 *      caíam sempre no `guardar`, sem escrita condicional nenhuma.
 *
 * A CLASSE DO DEFEITO é sempre a mesma: **um verbo novo declarado no contrato e não propagado**.
 * Um furo de roteamento não falha onde está — falha três camadas acima, com a cara de outra
 * coisa. Por isso esta prova não testa um verbo: testa a REGRA, em todos os armazenamentos que o
 * sistema sabe montar, e falha por ausência.
 *
 * O CONTRATO É LIDO DO PRÓPRIO FICHEIRO que o declara (`motor/nucleo/armazenamento.js`), e não
 * de uma lista escrita aqui: uma lista à mão seria uma quarta cópia do mesmo contrato, e é
 * exactamente essa duplicação que produziu o defeito.
 *
 *   node experimentos/provar-verbos-do-armazenamento.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const RAIZ = path.join(__dirname, '..');

const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarNode } = require(path.join(RAIZ, 'motor/adaptadores/node.js'));
const { criarCloudflare } = require(path.join(RAIZ, 'motor/adaptadores/cloudflare.js'));
const acervo = require(path.join(RAIZ, 'motor/servidor/acervo-envelopes.js'));
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

/** Os verbos que o CONTRATO declara — lidos do ficheiro que o declara. */
function verbosDoContrato() {
  const texto = fs.readFileSync(path.join(RAIZ, 'motor/nucleo/armazenamento.js'), 'utf8');
  const nomes = [];
  // As linhas do bloco de contrato são ` *   verbo(chave…)` — a forma que o ficheiro usa.
  for (const m of texto.matchAll(/^ \* {3}([a-z]+)\(/gm)) nomes.push(m[1]);
  return [...new Set(nomes)];
}

/** Um KV falso, com o mínimo que os verbos do adaptador tocam. */
function kvFalso() {
  const mapa = new Map();
  return {
    mapa,
    async get(chave) { return mapa.has(chave) ? mapa.get(chave) : null; },
    async put(chave, valor) { mapa.set(chave, String(valor)); },
    async delete(chave) { return mapa.delete(chave); },
    async list(opcoes) {
      const prefixo = (opcoes && opcoes.prefix) || '';
      return { keys: [...mapa.keys()].filter((k) => k.startsWith(prefixo)).map((name) => ({ name })) };
    },
  };
}

/** Um GitHub falso, com o `sha` do contents — o suficiente para o acervo responder. */
function githubFalso() {
  const arquivos = new Map();
  const estado = { puts: 0 };
  const falso = async (url, opcoes) => {
    const metodo = (opcoes && opcoes.method) || 'GET';
    const u = new URL(url);
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({ tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob' })) }), { status: 200 });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return new Response('{}', { status: 404 });
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('nf', { status: 404 });
      return new Response(JSON.stringify({
        sha: 'sha-' + caminho, content: Buffer.from(arquivos.get(caminho), 'utf8').toString('base64'),
      }), { status: 200 });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      estado.puts += 1;
      if (arquivos.has(caminho) && !corpo.sha) {
        return new Response(JSON.stringify({ message: 'Invalid request.\n\n"sha" wasn\'t supplied.' }), { status: 422 });
      }
      arquivos.set(caminho, Buffer.from(corpo.content, 'base64').toString('utf8'));
      return new Response(JSON.stringify({ commit: { sha: 'c' } }), { status: 201 });
    }
    if (metodo === 'DELETE') { arquivos.delete(caminho); return new Response('{}', { status: 200 }); }
    return new Response('{}', { status: 405 });
  };
  estado.arquivos = arquivos;
  estado.fetch = falso;
  return estado;
}

async function main() {
  const CONTRATO = verbosDoContrato();
  console.log('\n0. O contrato declara ' + CONTRATO.length + ' verbos: ' + CONTRATO.join(' · '));
  checar('o contrato foi LIDO do ficheiro (não de uma lista à mão)', CONTRATO.length >= 7, CONTRATO);
  checar('e traz os dois que faltaram a 04/11/2026', CONTRATO.includes('criar') && CONTRATO.includes('anexar'), CONTRATO);

  // ------------------------------------------------ 1. os adaptadores de base
  console.log('\n1. Todo adaptador de BASE implementa todo o verbo do contrato');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verbos-'));
  try {
    const bases = [
      ['memória (bancada)', criarMemoria()],
      ['node (disco)', criarNode(dir)],
      ['cloudflare (KV)', criarCloudflare({ PADD_KV: kvFalso(), ESCOLA_SLUG: 'breu' })],
    ];
    for (const [rotulo, arm] of bases) {
      const faltando = CONTRATO.filter((v) => typeof arm[v] !== 'function');
      checar(rotulo + ' implementa os ' + CONTRATO.length, faltando.length === 0, faltando);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // ------------------------------------------- 2. o acervo e o composto
  console.log('\n2. O acervo e o COMPOSTO — o que o Worker monta — também');
  {
    const gh = githubFalso();
    const umAcervo = acervo.criarAcervoDeEnvelopes({
      token: 't', dono: 'd', repo: 'r', ref: 'main', escola: 'breu', senhaCripto: 's', fetchImpl: gh.fetch,
    });
    /* O ACERVO ACRESCENTA verbos que o contrato base não tem (o `mutar` do índice e o
     * `gravarComFusao`), e é legítimo: ele é um adaptador a mais, não outro contrato. O que se
     * exige dele é o contrato INTEIRO mais os seus. */
    const faltandoAcervo = CONTRATO.filter((v) => typeof umAcervo[v] !== 'function');
    checar('o acervo do repositório implementa o contrato inteiro', faltandoAcervo.length === 0, faltandoAcervo);
    checar('e acrescenta os dele (`mutar`, `gravarComFusao`)',
      typeof umAcervo.mutar === 'function' && typeof umAcervo.gravarComFusao === 'function');

    const kv = kvFalso();
    const composto = acervo.combinar(umAcervo, criarCloudflare({ PADD_KV: kv, ESCOLA_SLUG: 'breu' }));
    const faltandoComposto = CONTRATO.filter((v) => typeof composto[v] !== 'function');
    checar('o COMPOSTO (`combinar`) encaminha o contrato inteiro — é aqui que os dois furos estavam',
      faltandoComposto.length === 0, faltandoComposto);
    checar('e também o `mutar` (o índice) e o `gravarComFusao` (a edição que unifica)',
      typeof composto.mutar === 'function' && typeof composto.gravarComFusao === 'function');
  }

  // ------------------------------ 3. o verbo FUNCIONA, e não só existe
  console.log('\n3. O `criar` funciona nos três adaptadores de base (não só existe)');
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verbos-criar-'));
    try {
      for (const [rotulo, arm] of [
        ['memória', criarMemoria()],
        ['node', criarNode(dir)],
        ['cloudflare', criarCloudflare({ PADD_KV: kvFalso(), ESCOLA_SLUG: 'breu' })],
      ]) {
        const r1 = await arm.criar('envelope/x.json', 'um');
        const r2 = await arm.criar('envelope/x.json', 'dois');
        checar(rotulo + ': a primeira criação entra', r1 && r1.criado === true, r1);
        checar(rotulo + ': a segunda sabe que o nome é de outro', r2 && r2.jaExiste === true, r2);
        checar(rotulo + ': e NÃO sobrescreveu', (await arm.ler('envelope/x.json')) === 'um',
          await arm.ler('envelope/x.json'));
        // O `guardar` continua a sobrescrever de propósito — é a edição do mesmo documento.
        await arm.guardar('envelope/x.json', 'três');
        checar(rotulo + ': o `guardar` continua a gravar por cima (a edição)',
          (await arm.ler('envelope/x.json')) === 'três');
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  // ------------------ 4. e o motor VÊ o verbo — a ponta que interessa
  console.log('\n4. O motor vê o `criar` pelo composto — a corrida do nome fica fechada em produção');
  {
    const gh = githubFalso();
    const composto = acervo.combinar(
      acervo.criarAcervoDeEnvelopes({
        token: 't', dono: 'd', repo: 'r', ref: 'main', escola: 'breu', senhaCripto: 's', fetchImpl: gh.fetch,
      }),
      criarCloudflare({ PADD_KV: kvFalso(), ESCOLA_SLUG: 'breu' }),
    );
    const rel = (id) => ({
      id, estado: 'x', contagem: { respondidos: 1, obrigatorios: 1 }, elos: [], paradas: [],
      idsDesconhecidos: [], validacao: { resultado: 'ok', contrato: 'x' }, errosDoDocumento: [], avisos: [],
    });
    const CARIMBO = '2026-11-04T19:30';
    const a = await porta.identificar(composto, 'plano', () => CARIMBO);
    const b = await porta.identificar(composto, 'plano', () => CARIMBO);
    checar('dois pedidos no mesmo minuto recebem o mesmo nome (a janela existe)', a.id === b.id, [a.id, b.id]);
    const g1 = await porta.gravarEnvelope(composto, { id: a.id, respostas: { x: { valor: 1 } } }, rel(a.id), { substituir: false });
    const g2 = await porta.gravarEnvelope(composto, { id: b.id, respostas: { x: { valor: 2 } } }, rel(b.id), { substituir: false });
    checar('e os dois documentos ficam (a corrida está fechada)', g1.ok && g2.ok && g1.id !== g2.id,
      { g1: g1.id, g2: g2.id });
  }

  // ------------------- 5. nenhum verbo fica de fora de um adaptador novo
  console.log('\n5. A regra vale para amanhã: nenhum ficheiro de adaptador declara verbos a menos');
  {
    const pasta = path.join(RAIZ, 'motor/adaptadores');
    for (const nome of fs.readdirSync(pasta).filter((f) => f.endsWith('.js'))) {
      const texto = fs.readFileSync(path.join(pasta, nome), 'utf8');
      const declarados = [...texto.matchAll(/^ {4}async ([a-z]+)\(/gm)].map((m) => m[1]);
      if (!declarados.length) continue;
      const faltando = CONTRATO.filter((v) => !declarados.includes(v));
      checar('motor/adaptadores/' + nome + ' declara o contrato inteiro', faltando.length === 0, faltando);
    }
  }

  // ------------------- 6. o composto não tem lista: um verbo inventado agora flui
  console.log('\n6. O COMPOSTO NÃO ENUMERA — um verbo que apareça amanhã chega sozinho');
  {
    const a = criarMemoria();
    const r = criarMemoria();
    a.contar = async () => 'do acervo';
    r.contar = async () => 'do resto';
    const composto = acervo.combinar(a, r);
    checar('um verbo que ninguém pôs numa lista é encaminhado',
      (await composto.contar('envelope/x')) === 'do acervo'
      && (await composto.contar('outra/coisa')) === 'do resto');
    let recusou = null;
    try { await composto.inexistente('envelope/x'); } catch (e) { recusou = e.message; }
    checar('e um verbo que NINGUÉM implementa é recusado, não devolvido vazio',
      Boolean(recusou) && /não sabe inexistente/.test(recusou), recusou);
    // A armadilha real: se o `Proxy` respondesse a tudo, o composto seria uma *thenable* e
    // `await` sobre ele ficaria pendurado para sempre.
    checar('o composto não é uma thenable (o `await` não fica pendurado)', composto.then === undefined);
    checar('e `in` responde pelo que algum dos dois sabe fazer',
      'ler' in composto && 'contar' in composto && !('inexistente' in composto));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: os ' + CONTRATO.length + ' verbos do contrato chegam '
    + 'aos três adaptadores de base, ao acervo e ao COMPOSTO, o `criar` funciona (e não só existe) nos '
    + 'três, o motor vê-o onde o Worker o monta, e o composto não enumera verbos — um que apareça '
    + 'amanhã flui sozinho.');
}

main().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
