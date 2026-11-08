#!/usr/bin/env node
'use strict';

/**
 * provar-remocao-do-elenco.js — a aluna que SAI da turma, e o que fica dela.
 *
 * O CENÁRIO DELA (08/11/2026), na letra: «uma aluna, a aluna A, decide sair da escola. Então eu
 * preciso remover ela do elenco. […] Da mesma forma como quando eu incluo uma aluna eu preciso
 * rever o plano de ensino e o plano de observação, eu vou precisar também rever […] e aí essa
 * aluna não faz mais parte do formulário que eu vou usar para lançar os dados coletados da aula
 * dada. […] E digamos que ela tenha saído antes da aula acontecer. […] o que foi feito dela nas
 * aulas passadas, aquele registro dela pela nossa lógica de proveniência deve continuar existindo.
 * Ele não é perdido.»
 *
 * O QUE ESTAVA GARANTIDO, e o que não estava — medido, não suposto:
 *
 *   ✓ A CASCATA. `porta.revalidacaoPendente` compara o elenco que a Turma carimbou (`alunas`) com
 *     o da linha de base e, quando alguém sai, marca `curadoria → plano → po`, nessa ordem.
 *     Já existia, e continua a existir.
 *   ✗ A FONTE `-dados.json`. `derivarDados` escrevia `aulas: {}` em TODA a geração — e a geração
 *     é disparada pelo «Guardar» do PO, que é exactamente o gesto que a cascata exige. Tirar uma
 *     aluna do elenco e regravar o PO **apagava as aulas lançadas** da fonte: elas só sobreviviam
 *     no elo de `historico/`, que ninguém lê. O passado do ciclo desaparecia por causa de uma
 *     correcção do presente.
 *   ✗ O FORMULÁRIO. Depois da remoção, a aluna deixava de aparecer — correcto —, MAS o mesmo
 *     `apelidos` que alimentava a lista era o mapa de nomes das aulas já lançadas: sem ela, os
 *     relatórios passariam a imprimir `aluna_a` no lugar do apelido.
 *
 * A REGRA QUE FICOU (e é uma só, aplicada a três sítios):
 *
 *   · `elenco` — quem a turma observa AGORA; é o que o formulário oferece para marcar;
 *   · `apelidos` — o mapa de nomes de hoje MAIS o de quem aparece numa aula lançada (o passado
 *     continua legível, com nome);
 *   · `aulas` — PRESERVADAS na geração: um derivado não reescreve o material.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A CASCATA, no núcleo: a remoção marca a curadoria com `saiu`, e desce ao plano e ao PO.
 *   B. A GERAÇÃO: as aulas sobrevivem a um «Guardar» de PO que rode com o elenco novo; o elenco
 *      encolhe; o mapa de nomes mantém quem já foi lançada; a cópia cifrada cifra o MESMO texto
 *      (é o que o `check-pacote` compara).
 *   C. O FORMULÁRIO, num Chrome: numa aula NOVA oferece só o elenco; numa aula JÁ LANÇADA
 *      continua a mostrar quem lá esteve, com o nome.
 *   D. A COMPATIBILIDADE: um `-dados.json` sem `elenco` (anterior a esta regra) lista o mapa
 *      inteiro, como sempre.
 *   E. O ACERVO: a anamnese de quem saiu continua VINCULADA — os POs antigos declaram-na, e o
 *      cadeado não se abre só porque a turma mudou. (É o que impede o registo de ser apagado.)
 *
 * Requer Chrome/Chromium para a secção C. Sem ele: a secção C diz NÃO FEITO e o resto corre.
 *
 *   node experimentos/provar-remocao-do-elenco.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarEscritorDeCiclo } = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));
const { derivarDados } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const resp = (v) => ({ valor: v });
const env = (o) => JSON.stringify(o);

/* ========================================================================================== */
console.log('\nA · A CASCATA — quem sai é dito, e a ordem da revisão é a de dependência');
/* ========================================================================================== */
(async () => {
  {
    const arm = criarMemoria({
      'envelope/plano-1.json': env({
        id: 'plano-1', gerado_em: '2026-11-01T11:00',
        contexto: { escola: 'x', professor: 'p', ciclo: '01', turma: 'sala rosa' },
        respostas: { 'contexto-turma': resp('sala rosa'), 'objetivo-geral': resp('o') },
      }),
      'envelope/po-1.json': env({
        id: 'po-1', gerado_em: '2026-11-01T12:00',
        contexto: { escola: 'x', professor: 'p', ciclo: '01' },
        respostas: {
          sujeitos: resp(['Aluna A', 'Aluna B', 'Aluna C']),
          'plano-de-ensino': resp(['plano-1']),
        },
      }),
    });
    const cursoDaTurma = [{ id: 'c1', professor: 'p', turmas: ['sala rosa'], linhaDeBase: 'tami',
      alunas: ['Aluna A', 'Aluna B', 'Aluna C'] }];
    const antes = [{ id: 'tami', nome: 'tami', alunas: ['Aluna A', 'Aluna B', 'Aluna C'],
      campos: [{ id: 'c', nome: 'c' }], atualizada_em: '2026-11-01T09:00' }];
    const depois = [{ id: 'tami', nome: 'tami', alunas: ['Aluna A', 'Aluna B'],
      campos: [{ id: 'c', nome: 'c' }], atualizada_em: '2026-11-08T10:00', carimbo: '20261108-1000' }];

    const r1 = await porta.revalidacaoPendente(arm, null, antes, cursoDaTurma);
    provar('com o elenco intacto, a turma, o plano e o PO não estão pendentes',
      !r1.pendentes.has('curadoria:c1') && !r1.pendentes.has('plano-1') && !r1.pendentes.has('po-1'),
      [...r1.pendentes.keys()]);

    const r2 = await porta.revalidacaoPendente(arm, null, depois, cursoDaTurma);
    const curadoria = r2.pendentes.get('curadoria:c1') || {};
    provar('a remoção MARCA a turma, e diz quem saiu',
      curadoria.familia === 'curadoria' && (curadoria.saiu || []).join(',') === 'Aluna C',
      curadoria);
    provar('…e o motivo diz que é da turma que o plano e o PO recebem quem observam',
      /plano de ensino e o plano de observa/.test(String(curadoria.motivo || '')),
      curadoria.motivo);
    provar('o PLANO entra na cascata, e diz que a turma vem primeiro',
      (r2.pendentes.get('plano-1') || {}).familia === 'plano'
      && /CURADORIA primeiro/.test(String((r2.pendentes.get('plano-1') || {}).motivo || '')),
      r2.pendentes.get('plano-1'));
    provar('o PO entra depois do plano, e nomeia-o',
      (r2.pendentes.get('po-1') || {}).dependenteDe === 'plano-1',
      r2.pendentes.get('po-1'));
    provar('a ORDEM declarada é a de dependência (linha de base → turma → plano → PO)',
      (r2.ordem || []).join(' → ') === 'linha-de-base → curadoria → plano-de-ensino → plano-de-observacao',
      r2.ordem);
  }

  /* ======================================================================================== */
  console.log('\nB · A GERAÇÃO — as aulas lançadas sobrevivem, e o elenco é o de hoje');
  /* ======================================================================================== */

  const CONF = ['CICLO="01"', 'ESCOLA="batata"', 'NOME="Ciclo"', 'DURACOES="60"',
    'VOLUME_MIN="3"', 'VOLUME_MAX="5"', 'DOCS="plano harmonizacao aula-01 notacao"',
    'DIAS="segunda 18:00"'].join('\n') + '\n';
  const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

  function githubFalso(inicial) {
    const arquivos = Object.assign({}, inicial || {});
    const chamadas = [];
    const f = async (url, init) => {
      const metodo = (init && init.method) || 'GET';
      const u = String(url);
      chamadas.push({ u, metodo });
      const corpo = init && init.body ? JSON.parse(init.body) : null;
      if (metodo === 'GET' && /\/contents\//.test(u)) {
        const caminho = decodeURIComponent(u.split('/contents/')[1].split('?')[0]);
        if (/\.conf$/.test(caminho)) {
          return { status: 200, ok: true, json: async () => ({ sha: 's1', content: Buffer.from(CONF).toString('base64') }) };
        }
        if (/captura-schema\.json$/.test(caminho)) {
          return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
        }
        if (Object.prototype.hasOwnProperty.call(arquivos, caminho)) {
          return { status: 200, ok: true, json: async () => ({ sha: 'x' + caminho, content: Buffer.from(arquivos[caminho]).toString('base64') }) };
        }
        return { status: 404, ok: false, json: async () => ({}) };
      }
      if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
      if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
      if (metodo === 'POST' && /\/git\/blobs$/.test(u)) {
        arquivos.__n = (arquivos.__n || 0) + 1;
        const sha = 'b' + arquivos.__n;
        arquivos.__blob = arquivos.__blob || {};
        arquivos.__blob[sha] = Buffer.from(String(corpo.content), 'base64').toString('utf8');
        return { status: 201, ok: true, json: async () => ({ sha }) };
      }
      if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
        arquivos.__tree = {};
        // O conteúdo viaja na entrada da árvore desde 08/11/2026 (`content`), sem um blob por
        // arquivo; as duas formas são aceites — o que se mede é o que cada caminho recebeu.
        for (const t of corpo.tree || []) {
          arquivos.__tree[t.path] = t.content !== undefined
            ? String(t.content) : (arquivos.__blob || {})[t.sha];
        }
        return { status: 201, ok: true, json: async () => ({ sha: 't1' }) };
      }
      if (metodo === 'POST' && /\/git\/commits$/.test(u)) return { status: 201, ok: true, json: async () => ({ sha: 'c1' }) };
      if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) {
        Object.assign(arquivos, arquivos.__tree || {});
        delete arquivos.__tree; delete arquivos.__blob; delete arquivos.__n;
        return { status: 200, ok: true, json: async () => ({}) };
      }
      return { status: 200, ok: true, json: async () => ({}) };
    };
    return { fetch: f, arquivos, chamadas };
  }

  const CTX = { escola: 'batata', professor: 'acucar', ciclo: '01', turma: 'sala-rosa', variante: 'batata-sala-rosa' };
  const BASE = 'professores/acucar/ciclos';
  const DADOS = BASE + '/ciclo-01-batata-sala-rosa-dados.json';
  const PLANO = { objetivo: 'x', turma: 'sala-rosa', professor: 'acucar', ciclo: '01' };

  const dadosComAulas = JSON.stringify({
    ciclo: '01', escola: 'batata', professor: 'acucar', criado_em: '2026-11-01', po: 'po-velho',
    apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B', aluna_c: 'Aluna C' },
    aulas: {
      '01': {
        data: '2026-11-02', ultimo_lancamento: '2026-11-02T20:00',
        presentes: ['aluna_a', 'aluna_b', 'aluna_c'], ausentes: [],
        marcas: {
          aluna_a: { solo: { teste: 'bom' } },
          aluna_b: { solo: { teste: 'razoavel' } },
          aluna_c: { solo: { teste: 'otimo' } },
        },
      },
    },
  }, null, 2) + '\n';

  const gh = githubFalso({ [DADOS]: dadosComAulas });
  const escrever = criarEscritorDeCiclo({
    token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
  });
  const po = {
    id: 'po-20261108-1000', ciclo: '01', escola: 'batata', contexto: CTX,
    respostas: { horizonte: 'x', sujeitos: ['Aluna A', 'Aluna B'] },
  };
  /* A linha de base JÁ SEM a Aluna C — é o estado depois de ela sair do elenco. */
  const linhaDeBase = { id: 'tami', alunas: ['Aluna A', 'Aluna B'], campos: [] };
  const r = await escrever({ plano: PLANO, po, contexto: CTX, linhaDeBase });

  const gravado = gh.arquivos[DADOS] || '';
  let j = null;
  try { j = JSON.parse(gravado); } catch (e) { j = null; }
  provar('a geração escreveu a fonte de dados', Boolean(j), gravado.slice(0, 120));
  provar('…e a AULA LANÇADA sobreviveu (era `aulas: {}` antes desta correcção)',
    Boolean(j && j.aulas && j.aulas['01']), j && Object.keys(j.aulas || {}));
  const aula1 = (j && j.aulas && j.aulas['01']) || {};
  const marcas1 = aula1.marcas || {};
  provar('…com as marcas das TRÊS alunas, intactas',
    Boolean(marcas1.aluna_c && marcas1.aluna_c.solo && marcas1.aluna_c.solo.teste === 'otimo'),
    Object.keys(marcas1));
  provar('…e a presença do dia também',
    (Array.isArray(aula1.presentes) ? aula1.presentes.join(',') : '') === 'aluna_a,aluna_b,aluna_c',
    aula1.presentes);

  provar('o ELENCO passou a ser só quem está na turma',
    Boolean(j && (j.elenco || []).join(',') === 'aluna_a,aluna_b'), j && j.elenco);
  provar('o MAPA DE NOMES mantém quem já foi lançada (o passado continua legível)',
    Boolean(j && j.apelidos.aluna_c === 'Aluna C'), j && j.apelidos);
  provar('e o de quem está na turma também está lá',
    Boolean(j && j.apelidos.aluna_a === 'Aluna A' && j.apelidos.aluna_b === 'Aluna B'),
    j && j.apelidos);

  const elo = (r.elos || []).find((e) => /-dados\.json$/.test(e.de));
  provar('a versão anterior fica como ELO — o passado não se perde nem quando a fonte muda',
    Boolean(elo) && /\/historico\//.test(elo.para), elo);
  provar('…e o elo guarda o ficheiro anterior inteiro',
    Boolean(elo) && gh.arquivos[elo.para] === dadosComAulas, elo && elo.para);

  /* A CÓPIA CIFRADA TEM DE SER O MESMO TEXTO — é o que o `check-pacote` compara. */
  const caminhoCifrado = BASE + '/ciclo-01-batata-sala-rosa-dados.cifrado.json';
  let envelope = null;
  try { envelope = JSON.parse(gh.arquivos[caminhoCifrado] || ''); } catch (e) { envelope = null; }
  provar('a cópia cifrada existe', Boolean(envelope), caminhoCifrado);
  provar('…e conta UM lançamento, como a fonte',
    Boolean(envelope && envelope.lancamentos === 1), envelope && envelope.lancamentos);
  provar('…e leva a mesma estrutura de nomes (a condição do `check-pacote`)',
    Boolean(envelope && JSON.stringify(envelope.apelidos) === JSON.stringify(j.apelidos)),
    envelope && envelope.apelidos);

  /* A DERIVAÇÃO PURA, sem repositório: o ciclo «do zero» continua a nascer sem aulas e com o
   * elenco — e um ficheiro sem `aulas` não inventa nenhuma. */
  const zero = JSON.parse(derivarDados({ po, contexto: CTX, linhaDeBase }));
  provar('sem ficheiro anterior, a fonte nasce com `aulas` vazio e o elenco de hoje',
    Object.keys(zero.aulas).length === 0
    && (Array.isArray(zero.elenco) ? zero.elenco.join(',') : '') === 'aluna_a,aluna_b', zero);

  /* ======================================================================================== */
  console.log('\nC · O FORMULÁRIO — a nova aula oferece o elenco; a aula lançada mostra quem lá esteve');
  /* ======================================================================================== */

  let puppeteer = null;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) { puppeteer = null; }
  const chrome = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));

  if (!puppeteer || !chrome) {
    console.log('  NÃO FEITO — sem Chrome/Chromium nesta máquina; a secção C não corre.');
  } else {
    const { umPacote } = require('./lib-pacote.js');
    const PACOTE = umPacote();
    const ABS = path.join(RAIZ, PACOTE);
    const indice = JSON.parse(fs.readFileSync(path.join(ABS, 'ciclos.json'), 'utf8'));
    const ciclo = indice.ciclos[0];
    const arquivoDados = ciclo.arquivo;
    const aula = String(((ciclo.aulas || [])[0] || {}).n || '01').padStart(2, '0');

    const comAulaLancada = JSON.stringify({
      ciclo: ciclo.id, escola: 'batata', aulas: j.aulas, apelidos: j.apelidos,
      elenco: j.elenco, po: j.po,
    }, null, 2) + '\n';
    const semAula = JSON.stringify({
      ciclo: ciclo.id, escola: 'batata', aulas: {}, apelidos: j.apelidos,
      elenco: j.elenco, po: j.po,
    }, null, 2) + '\n';
    /* O ANTIGO: sem `elenco`, o mapa é a lista (o comportamento de antes desta regra). */
    const antigo = JSON.stringify({
      ciclo: ciclo.id, escola: 'batata', aulas: {}, apelidos: j.apelidos, po: j.po,
    }, null, 2) + '\n';

    const MAPA = {
      'assets/style.css': 'tools/templates/ciclo.css',
      'assets/nav.js': 'tools/templates/nav.js',
      'assets/lib-vistas.js': 'tools/lib-vistas.js',
      'assets/lib-cifra.js': 'tools/lib-cifra.js',
      'lancamento.html': 'tools/templates/lancamento.html',
    };

    async function abrirCom(dadosTexto, consulta) {
      const srv = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
        if (rel === arquivoDados) {
          res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
          res.end(dadosTexto);
          return;
        }
        const alvo = [MAPA[rel], rel, path.join(PACOTE, rel)].filter(Boolean)
          .map((x) => path.join(RAIZ, x))
          .find((x) => x.startsWith(RAIZ) && fs.existsSync(x) && !fs.statSync(x).isDirectory());
        if (!alvo) { res.writeHead(404); res.end('nao encontrado'); return; }
        const tipo = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
          '.svg': 'image/svg+xml' }[path.extname(alvo)] || 'application/octet-stream';
        res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
        res.end(fs.readFileSync(alvo));
      });
      const base = await new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok('http://127.0.0.1:' + srv.address().port)));
      const navegador = await puppeteer.launch({ executablePath: chrome, headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage'] });
      const pagina = await navegador.newPage();
      await pagina.goto(base + '/lancamento.html' + (consulta || ''), { waitUntil: 'networkidle0' });
      await pagina.waitForSelector('.presenca-lista', { timeout: 15000 }).catch(() => {});
      const nomes = await pagina.$$eval('.presenca-lista label', (els) => els.map((e) => e.textContent.trim()))
        .catch(() => []);
      const linhas = await pagina.$$eval('.captura.matriz tr th.aluna', (els) => els.map((e) => e.textContent.trim()))
        .catch(() => []);
      /* O TEXTO DA PÁGINA: uma aula JÁ LANÇADA abre em LEITURA (as marcas do dia), e não no
       * formulário de marcação — os nomes aparecem na tabela de resultados, não numa lista de
       * caixas. É essa a superfície que prova que o passado continua legível. */
      const texto = await pagina.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
      await navegador.close();
      srv.close();
      return { nomes, linhas, texto };
    }

    /* 1. A AULA NOVA, com o elenco de hoje: só A e B. */
    const nova = await abrirCom(semAula);
    provar('na aula NOVA, a lista de presença é o elenco — sem a aluna que saiu',
      nova.nomes.length === 2 && !nova.nomes.includes('Aluna C'), nova.nomes);
    provar('…e a matriz das marcas também',
      nova.linhas.length === 0 || !nova.linhas.includes('Aluna C'), nova.linhas);

    /* 2. A AULA JÁ LANÇADA: quem lá esteve continua a ler-se, com nome. */
    /* A AULA JÁ LANÇADA abre-se pelo endereço (`?aula=NN`) — é o link que a lista das aulas dadas
     * usa. Sem ele, o formulário cai na «primeira sem dado», e com a 01 lançada não há nenhuma. */
    const passada = await abrirCom(comAulaLancada, '?aula=' + aula);
    provar('na aula JÁ LANÇADA, a aluna que saiu continua a ver-se — o passado não se reescreve',
      /Aluna C/.test(passada.texto), passada.texto.slice(0, 200));
    provar('…com o NOME dela, e não a chave (a aula lançada abre em LEITURA)',
      /Aluna C/.test(passada.texto) && !/aluna_c/.test(passada.texto),
      passada.texto.slice(0, 200));

    /* 3. O ANTIGO: sem `elenco`, tudo o que está no mapa. */
    const velho = await abrirCom(antigo);
    provar('um ficheiro SEM `elenco` (anterior a esta regra) continua a listar o mapa inteiro',
      velho.nomes.length === 3, velho.nomes);
  }

  /* ======================================================================================== */
  console.log('\nD · O ACERVO — a anamnese de quem saiu continua protegida');
  /* ======================================================================================== */
  {
    /* O PO ANTIGO declara as três; o NOVO declara duas. `vinculos` soma todos os POs do acervo —
     * e é isso que impede o registo de uma aluna já observada de ficar editável/apagável só
     * porque a turma mudou. */
    const arm = criarMemoria({
      'envelope/anamnese-2026c.json': env({
        id: 'anamnese-2026c', gerado_em: '2026-11-01T10:00',
        contexto: { escola: 'x', professor: 'p', ciclo: '01', aluna: 'Aluna C' }, respostas: {},
      }),
      'envelope/anamnese-2026a.json': env({
        id: 'anamnese-2026a', gerado_em: '2026-11-01T10:00',
        contexto: { escola: 'x', professor: 'p', ciclo: '01', aluna: 'Aluna A' }, respostas: {},
      }),
      'envelope/plano-1.json': env({
        id: 'plano-1', gerado_em: '2026-11-01T11:00',
        contexto: { escola: 'x', professor: 'p', ciclo: '01', turma: 'sala rosa' },
        respostas: { 'contexto-turma': resp('sala rosa'), 'objetivo-geral': resp('o') },
      }),
      'envelope/po-1.json': env({
        id: 'po-1', gerado_em: '2026-11-01T12:00',
        contexto: { escola: 'x', professor: 'p', ciclo: '01' },
        respostas: { sujeitos: resp(['Aluna A', 'Aluna B', 'Aluna C']), 'plano-de-ensino': resp(['plano-1']) },
      }),
      'envelope/po-2.json': env({
        id: 'po-2', gerado_em: '2026-11-08T10:00', ajuste_de: 'po-1',
        contexto: { escola: 'x', professor: 'p', ciclo: '01' },
        respostas: { sujeitos: resp(['Aluna A', 'Aluna B']), 'plano-de-ensino': resp(['plano-1']) },
      }),
    });
    const linhaDepois = [{ id: 'tami', alunas: ['Aluna A', 'Aluna B'], campos: [], carimbo: '20261108-1000' }];
    const est = await porta.estadosDasAnamneses(arm, { linhas: linhaDepois, curadorias: [] });
    provar('a anamnese de quem saiu continua VINCULADA (o PO antigo observou-a)',
      (est['anamnese-2026c'] || {}).vinculada === true, est['anamnese-2026c']);
    provar('…e a de quem ficou também',
      (est['anamnese-2026a'] || {}).vinculada === true, est['anamnese-2026a']);
  }

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
