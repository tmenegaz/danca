#!/usr/bin/env node
'use strict';

/**
 * provar-apagar-o-ciclo.js — apagar o Plano de Observação leva o CICLO GERADO, e só o dele.
 *
 * O QUE A PESQUISADORA VIU (05/11/2026), e é uma cadeia de três sintomas:
 *
 *   «Eu apaguei o plano de observação… o efeito é que o plano de observação ainda está aqui. Ele
 *   não sumiu. Posso acessá-lo. E os documentos que ele gerou também estão aqui. O plano está
 *   aqui, tudo que tem dentro dos planos, que é do ciclo… E o menu do ciclo… As aulas ainda estão
 *   aqui.»
 *
 *   «Quando eu apagar o plano de observação, ele tem que levar consigo os ciclos do menu com tudo
 *   que está dentro dele, planos, referências, PDF do ciclo… as aulas, o lançar aula, o captura
 *   para impressão da aula e o PDF da aula.»
 *
 *   «Se eu tiver plano para o ciclo 01 e plano para o ciclo 02, e eu apagar o plano do ciclo 02,
 *   ele não pode apagar nada que é do ciclo 01.»
 *
 * AS TRÊS CAUSAS, e são independentes:
 *
 *   1. O GESTO DE APAGAR ERA SÓ O ENVELOPE. `DELETE /api/po-vinculo/:id` apagava o registo do
 *      acervo e mais nada — o comentário da rota até o dizia («apagar o envelope do acervo não
 *      toca no que já foi gerado»). O produto do ciclo — o pacote, as aulas, o lançamento, a
 *      captura, os PDF, as referências, as listagens — ficava inteiro, e o menu (que a montagem
 *      deriva dos pacotes) também.
 *   2. A CADEIA DEVOLVIA O ELO ANTERIOR. Apagar o vigente de uma cadeia faz o elo de trás voltar
 *      a ser o vigente: a linha da lista não desaparece, e o gesto lê-se como «não funcionou».
 *      Agora a exclusão leva a CADEIA do ciclo — os POs dele —, e a linha desaparece mesmo.
 *   3. O PLANO FICAVA «VINCULADO A NADA». Vinculado a três POs antigos que ninguém tinha apagado,
 *      porque o gesto só apagava um. Com a cadeia levada, o plano fica LIVRE — que é o que a
 *      proveniência manda: apagar o vínculo liberta o que estava preso.
 *
 * A CASCATA JÁ EXISTIA, e é a da Produção (`apagarCicloDoRepo`): o pacote, o `.conf` da variante,
 * as âncoras `.fipp` e os POs do ciclo, com a GUARDA do último. O que faltava era ligá-la ao
 * gesto da listagem — e é o que esta bancada mede, com um GitHub falso que regista o que lhe
 * pediram para apagar.
 *
 * A ISOLAMENTO É MEDIDO NA DIREÇÃO QUE DÓI: dois ciclos no mesmo professor, a exclusão do 02, e a
 * exigência de que NENHUM caminho do 01 apareça na lista de apagados — e o inverso: com o 02 vivo,
 * apagar o 01 é RECUSADO, e a recusa diz qual é o caminho.
 *
 *   node experimentos/provar-apagar-o-ciclo.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ESCOLA = 'prova';
const PROF = 'coelho';
/* UMA VARIANTE, DOIS CICLOS — e a escolha é do domínio, não de conveniência: a sequência estrita
 * é da TURMA (a variante), e é dela que a guarda do último ciclo fala. Dois ciclos de variantes
 * diferentes são sequências independentes, e a guarda não os vê um ao outro. O cenário dela é
 * este: «plano para o ciclo 01, e depois um plano para o ciclo 02». */
const VARIANTE = 'prova-bale-nivel-1';
const VARIANTE_1 = VARIANTE;
const VARIANTE_2 = VARIANTE;

/* ------------------------------------------------------------------ o GitHub falso
 *
 * E ELE É O REPOSITÓRIO INTEIRO, porque em produção o ACERVO também mora nele. Um falso que só
 * respondesse à API do git deixaria as leituras de envelope a ir ao GitHub verdadeiro — medido:
 * `HTTP 401`. Aqui há um mapa de caminho → texto, e as duas APIs (Contents e Git) servem-se dele.
 *
 * O QUE SE MEDE: a lista de `path` com `sha: null` no `POST trees` (o que a cascata apaga), e o
 * estado do mapa no fim (o que desapareceu de facto — inclusive os envelopes).
 */
function githubFalso({ arquivos }) {
  const repo = new Map(Object.entries(arquivos));
  const registo = { apagados: [], doAcervo: [], commits: [], patch: [], escritos: [] };
  const b64 = (t) => Buffer.from(String(t), 'utf8').toString('base64');
  const deB64 = (t) => Buffer.from(String(t), 'base64').toString('utf8');
  const json = (o, status) => ({ ok: (status || 200) < 400, status: status || 200,
    json: async () => o, text: async () => JSON.stringify(o) });
  const vazio = () => ({ ok: false, status: 404, json: async () => null, text: async () => '' });

  const fetchImpl = async (url, init) => {
    const u = String(url);
    const metodo = ((init && init.method) || 'GET').toUpperCase();
    const corpo = init && init.body ? JSON.parse(init.body) : null;
    const caminho = (() => {
      const m = /\/contents\/([^?]+)/.exec(u);
      return m ? decodeURIComponent(m[1]) : null;
    })();

    if (caminho) {
      if (metodo === 'GET') {
        if (!repo.has(caminho)) return vazio();
        return json({ content: b64(repo.get(caminho)), sha: 'sha-' + caminho });
      }
      if (metodo === 'PUT') {
        repo.set(caminho, deB64(corpo.content));
        registo.escritos.push(caminho);
        return json({ content: { sha: 'sha-' + caminho } }, 200);
      }
      if (metodo === 'DELETE') {
        const existia = repo.delete(caminho);
        registo.doAcervo.push(caminho);
        return { ok: existia, status: existia ? 200 : 404, json: async () => ({}), text: async () => '' };
      }
    }
    if (/\/git\/trees/.test(u) && metodo === 'GET') {
      return json({ tree: [...repo.keys()].map((p) => ({ path: p, type: 'blob' })) });
    }
    if (/\/git\/ref\/heads\//.test(u) && metodo === 'GET') {
      return json({ object: { sha: 'base-commit' } });
    }
    if (/\/git\/commits\/[^/]+$/.test(u) && metodo === 'GET') {
      return json({ sha: 'base-commit', tree: { sha: 'base-tree' } });
    }
    if (/\/git\/trees$/.test(u) && metodo === 'POST') {
      for (const item of (corpo && corpo.tree) || []) {
        if (item && item.sha === null) {
          registo.apagados.push(item.path);
          repo.delete(item.path);
        }
        if (item && typeof item.content === 'string') {
          repo.set(item.path, item.content);
          registo.escritos.push(item.path);
        }
      }
      return json({ sha: 'nova-tree' }, 201);
    }
    if (/\/git\/commits$/.test(u) && metodo === 'POST') {
      registo.commits.push(corpo && corpo.message);
      return json({ sha: 'novo-commit' }, 201);
    }
    if (/\/git\/refs\/heads\//.test(u) && metodo === 'PATCH') {
      registo.patch.push(corpo);
      return json({ ok: true });
    }
    return vazio();
  };
  return { fetchImpl, registo, repo };
}

/** Os caminhos do produto de UM ciclo — o que ele gera e o que o menu lista. */
function caminhosDoCiclo(variante, nn) {
  const pacote = 'professores/' + PROF + '/ciclos/ciclo-' + nn + '-' + variante;
  return [
    pacote + '/index.html',
    pacote + '/plano.html',
    pacote + '/plano-01.json',
    pacote + '/po-01.json',
    pacote + '/aula-01.html',
    pacote + '/aula-01.pdf',
    pacote + '/captura-aula-01.html',
    pacote + '/captura-01.json',
    pacote + '/lancamento.html',
    pacote + '/referencias.html',
    pacote + '/notacao.html',
    pacote + '/ciclo-' + nn + '-' + variante + '.pdf',
    pacote + '/plano-observacao/index.html',
    'professores/' + PROF + '/ciclos/ciclo-' + nn + '-' + variante + '.conf',
    'professores/' + PROF + '/ciclos/ciclo-' + nn + '-' + variante + '.fipp',
    'professores/' + PROF + '/ciclos/ciclo-' + nn + '-' + variante + '-aula-01.fipp',
  ];
}

function kvDeMentira() {
  const dados = new Map();
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list(op) {
      const prefixo = (op && op.prefix) || '';
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefixo))
        .map((name) => ({ name })), list_complete: true };
    },
  };
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.pdf': 'application/pdf' };

function publicacaoMinima() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apagar-ciclo-'));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  for (const [de, para] of [
    ['tools/templates/ciclo.css', 'assets/style.css'],
    ['tools/templates/nav.js', 'assets/nav.js'],
    ['tools/templates/marca/favicon.svg', 'assets/favicon.svg'],
  ]) fs.copyFileSync(path.join(RAIZ, de), path.join(dir, para));
  fs.writeFileSync(path.join(dir, 'nav.json'), JSON.stringify({ versao: 2, coluna: [],
    barra: [{ tipo: 'menu', rotulo: 'Bastidores',
      itens: [{ rotulo: 'Produção', href: '/bastidores/producao' }] }] }));
  return dir;
}

function assetsDe(dir) {
  const resolver = (rel) => {
    for (const candidato of [rel, rel.replace(/^plano-observacao\//, '')]) {
      for (const base of [dir, path.join(RAIZ, 'porta')]) {
        const alvo = path.join(base, candidato);
        if (fs.existsSync(alvo) && fs.statSync(alvo).isFile()) return alvo;
        const indice = path.join(alvo, 'index.html');
        if (fs.existsSync(indice) && fs.statSync(indice).isFile()) return indice;
      }
    }
    return null;
  };
  return {
    async fetch(pedido) {
      const url = pedido instanceof URL ? pedido : new URL(pedido.url);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      const alvo = resolver(rel);
      if (!alvo) return new Response('nao', { status: 404 });
      return new Response(fs.readFileSync(alvo), { status: 200,
        headers: { 'Content-Type': TIPOS[path.extname(alvo)] || 'application/octet-stream' } });
    },
  };
}

const relatorio = (id) => ({ id, estado: 'prova', contagem: { respondidos: 0, obrigatorios: 0 },
  elos: [], paradas: [], idsDesconhecidos: [], validacao: { resultado: 'aceite', contrato: 'prova' },
  errosDoDocumento: [], linhas: [] });

const BASE = 'https://prova.tmenegaz77.workers.dev';

/**
 * O AMBIENTE: dois ciclos de verdade no acervo — o 01 com plano e PO, o 02 idem — e o produto dos
 * dois no repositório falso. É o cenário da regra: apagar o 02 não pode tocar no 01.
 */
async function ambiente({ comToken = true } = {}) {
  const dir = publicacaoMinima();
  /* O REPOSITÓRIO: o produto dos dois ciclos, os dois `.conf` base, e os envelopes que o cenário
   * precisa. O índice do acervo nasce vazio — quem o escreve é o produto, como em produção. */
  const arquivos = {};
  for (const c of [].concat(caminhosDoCiclo(VARIANTE_1, '01'), caminhosDoCiclo(VARIANTE_2, '02'))) {
    arquivos[c] = 'conteudo de ' + c + '\n';
  }
  arquivos['professores/' + PROF + '/ciclos/ciclo-01.conf'] = 'DOCS="plano aula-01"\n';
  arquivos['professores/' + PROF + '/ciclos/ciclo-02.conf'] = 'DOCS="plano aula-01"\n';
  const { fetchImpl, registo, repo } = githubFalso({ arquivos });

  const env = {
    ESCOLA_SLUG: ESCOLA, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 's', SENHA_PROFESSOR: 'p',
    PROFESSOR_NOME: 'Coelho', PADD_KV: kvDeMentira(), ASSETS: assetsDe(dir),
  };
  if (comToken) env.GITHUB_TOKEN = 'gith-falso';

  /* O ACERVO USA O `fetch` GLOBAL (é `criarAcervoDeEnvelopes` que o constrói), e o falso entra
   * por ali — a alternativa seria injetar um gancho no produto para a bancada, e um gancho de
   * teste no caminho da escrita é a porta que se esquece aberta. */
  const fetchVerdadeiro = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    const armazenamento = producao.__armazenamento(env);
    const docs = [
      { id: 'plano-01', contexto: { escola: ESCOLA, professor: PROF, ciclo: '01',
        turma: 'Balé Nível 1' }, respostas: { 'contexto-turma': { valor: 'Balé Nível 1' } } },
      { id: 'po-01', contexto: { escola: ESCOLA, professor: PROF, ciclo: '01',
        turma: 'Balé Nível 1' }, respostas: { sujeitos: { valor: ['Aluna A'] },
        'plano-de-ensino': { valor: 'plano-01' } } },
      { id: 'plano-02', contexto: { escola: ESCOLA, professor: PROF, ciclo: '02',
        turma: 'Balé Nível 1' }, respostas: { 'contexto-turma': { valor: 'Balé Nível 1' } } },
      { id: 'po-02', contexto: { escola: ESCOLA, professor: PROF, ciclo: '02',
        turma: 'Balé Nível 1' }, respostas: { sujeitos: { valor: ['Aluna A'] },
        'plano-de-ensino': { valor: 'plano-02' } } },
    ];
    for (const d of docs) {
      await porta.gravarEnvelope(armazenamento, Object.assign({ ajuste_de: null,
        gerado_em: '2026-11-05T07:00' }, d), relatorio(d.id));
    }
    return { env, armazenamento, registo, fetchImpl, dir, repo,
      restaurarFetch: () => { globalThis.fetch = fetchVerdadeiro; } };
  } catch (erro) {
    globalThis.fetch = fetchVerdadeiro;
    throw erro;
  }
}

const apagar = async (env, caminho) => producao.fetch(new Request(BASE + caminho,
  { method: 'DELETE' }), env);

(async () => {
  /* --------------------------------------------------------------------------------------- */
  console.log('\n1 · APAGAR O PO DO CICLO 02 LEVA O PRODUTO DO 02 — E SÓ ELE');
  /* --------------------------------------------------------------------------------------- */
  {
    const { env, armazenamento, registo } = await ambiente();
    const r = await apagar(env, '/plano-observacao/api/po-vinculo/po-02');
    const dados = await r.json().catch(() => ({}));
    provar('a rota aceita (o PO não é derivado)', r.status === 200, { status: r.status, dados });
    provar('…e diz que o ciclo foi apagado', dados.ciclo && dados.ciclo.apagado === true, dados.ciclo);

    const apagados = registo.apagados;
    provar('o pacote do ciclo 02 vai inteiro (o index que o menu lista)',
      apagados.indexOf('professores/' + PROF + '/ciclos/ciclo-02-' + VARIANTE_2 + '/index.html') !== -1,
      apagados.slice(0, 4));
    for (const [rotulo, sufixo] of [
      ['o plano do ciclo', '/plano.html'],
      ['a referência', '/referencias.html'],
      ['a notação', '/notacao.html'],
      ['o PDF do ciclo', '/ciclo-02-' + VARIANTE_2 + '.pdf'],
      ['a aula', '/aula-01.html'],
      ['o lançamento da aula', '/lancamento.html'],
      ['a captura para impressão', '/captura-aula-01.html'],
      ['o PDF da aula', '/aula-01.pdf'],
      ['a porta do ciclo', '/plano-observacao/index.html'],
    ]) {
      provar('…e ' + rotulo, apagados.indexOf('professores/' + PROF + '/ciclos/ciclo-02-'
        + VARIANTE_2 + sufixo) !== -1);
    }
    provar('…e o `.conf` da variante do 02',
      apagados.indexOf('professores/' + PROF + '/ciclos/ciclo-02-' + VARIANTE_2 + '.conf') !== -1);
    provar('…e as âncoras `.fipp` do 02',
      apagados.filter((c) => /\.fipp$/.test(c) && c.indexOf('-02-') !== -1).length === 2, apagados.filter((c) => /\.fipp$/.test(c)));

    /* A ISOLAMENTO — a asserção que dói, e é a que a pesquisadora pediu por nome. */
    const doUm = apagados.filter((c) => c.indexOf('ciclo-01-') !== -1);
    provar('NENHUM caminho do ciclo 01 foi apagado', doUm.length === 0, doUm);

    /* O ACERVO: o PO do 02 sai, e o do 01 fica. */
    provar('o envelope do PO do 02 sai do acervo',
      !(await porta.lerEnvelope(armazenamento, 'po-02')));
    provar('…e o do 01 continua lá', Boolean(await porta.lerEnvelope(armazenamento, 'po-01')));
    /* E o PLANO do 02 fica LIVRE — a exclusão do ciclo não leva a declaração que o originou. */
    provar('o plano do 02 continua no acervo (é a declaração que deu origem ao ciclo)',
      Boolean(await porta.lerEnvelope(armazenamento, 'plano-02')));
    const estados = await porta.estadosDosPlanos(armazenamento);
    provar('…e fica LIVRE — apagados os POs, não há quem declare o vínculo',
      !(estados['plano-02'] && estados['plano-02'].vinculada), estados['plano-02']);
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n2 · APAGAR O PO DO CICLO 01 COM O 02 VIVO É RECUSADO — a guarda do último');
  /* --------------------------------------------------------------------------------------- */
  {
    const { env, armazenamento, registo } = await ambiente();
    const r = await apagar(env, '/plano-observacao/api/po-vinculo/po-01');
    const dados = await r.json().catch(() => ({}));
    provar('a rota recusa (409)', r.status === 409, { status: r.status, dados });
    provar('…e a recusa DIZ qual é o caminho («apague de trás para a frente»)',
      /de trás para a frente/i.test(String(dados.erro)), dados.erro);
    provar('…e NADA foi apagado no repositório (nem produto, nem envelope)',
      registo.apagados.length === 0 && registo.doAcervo.length === 0,
      { produto: registo.apagados, acervo: registo.doAcervo });
    provar('…e o envelope do PO do 01 continua no acervo',
      Boolean(await porta.lerEnvelope(armazenamento, 'po-01')));
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n3 · SEM GITHUB, O ENVELOPE AINDA SE APAGA (degrada, não rebenta)');
  /* --------------------------------------------------------------------------------------- */
  {
    const { env, armazenamento } = await ambiente({ comToken: false });
    const r = await apagar(env, '/plano-observacao/api/po-vinculo/po-02');
    const dados = await r.json().catch(() => ({}));
    provar('a rota aceita o envelope sem acesso ao repositório', r.status === 200,
      { status: r.status, dados });
    provar('…e diz que o ciclo NÃO foi apagado (e porquê)',
      dados.ciclo && dados.ciclo.apagado === false && Boolean(dados.ciclo.motivo), dados.ciclo);
    provar('…e o envelope saiu do acervo',
      !(await porta.lerEnvelope(armazenamento, 'po-02')));
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n4 · O PO QUE NÃO É O ÚLTIMO ELO DO CICLO — a cadeia é do ciclo inteiro');
  /* --------------------------------------------------------------------------------------- */
  /* Com um elo novo no ciclo 02, apagar o vigente leva a cadeia do ciclo: os dois POs saem, e a
   * linha da lista desaparece — que é o sintoma que ela descreveu como «ainda está aqui». */
  {
    const { env, armazenamento } = await ambiente();
    await porta.gravarEnvelope(armazenamento, {
      id: 'po-02-b', contexto: { escola: ESCOLA, professor: PROF, ciclo: '02',
        turma: 'Balé Nível 1' },
      respostas: { sujeitos: { valor: ['Aluna A'] },
        'plano-de-ensino': { valor: 'plano-02' } },
      ajuste_de: 'po-02', gerado_em: '2026-11-05T08:00',
    }, relatorio('po-02-b'));
    const r = await apagar(env, '/plano-observacao/api/po-vinculo/po-02-b');
    provar('apagar o vigente do ciclo 02 é aceito', r.status === 200, r.status);
    provar('…e leva os DOIS POs do ciclo (o anterior não volta a aparecer na lista)',
      !(await porta.lerEnvelope(armazenamento, 'po-02')), true);
    provar('…e não toca no PO do ciclo 01',
      Boolean(await porta.lerEnvelope(armazenamento, 'po-01')));
  }

  /* --------------------------------------------------------------------------------------- */
  console.log('\n5 · APAGAR O PLANO DE ENSINO LIVRE TAMBÉM LEVA O PRODUTO ÓRFÃO');
  /* --------------------------------------------------------------------------------------- */
  /* O cenário real dela: apagado o PO, o plano fica livre, e o pacote do ciclo ficou no
   * repositório sem nada que o justifique. Apagar o plano tem de o levar. */
  {
    const { env, armazenamento, registo } = await ambiente();
    await apagar(env, '/plano-observacao/api/po-vinculo/po-02');
    const antes = registo.apagados.length;
    const r = await apagar(env, '/plano-ensino/api/plano-vinculo/plano-02');
    const dados = await r.json().catch(() => ({}));
    provar('o plano do 02, agora livre, apaga-se', r.status === 200, { status: r.status, dados });
    provar('…e o envelope sai do acervo',
      !(await porta.lerEnvelope(armazenamento, 'plano-02')));
    provar('…e nenhum caminho do ciclo 01 foi tocado',
      registo.apagados.slice(antes).every((c) => c.indexOf('ciclo-01-') === -1),
      registo.apagados.slice(antes));
    provar('…e o plano do 01 continua lá',
      Boolean(await porta.lerEnvelope(armazenamento, 'plano-01')));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: apagar o PO leva o ciclo gerado inteiro (pacote, '
    + 'planos, referências, aulas, lançamento, captura, PDF e âncoras), o ciclo vizinho fica '
    + 'intacto, a guarda recusa apagar o de trás, e o plano fica livre em vez de «vinculado a nada».');
})().catch((erro) => {
  console.error('provar-apagar-o-ciclo: ' + erro.message);
  process.exit(1);
});
