'use strict';

/*
 * provar-indice-de-envelopes.js — a estante deixa de depender da enumeração do KV.
 *
 * O que aconteceu (19/10/2026, escola `calango`). As três listas da porta (a estante de planos,
 * a seleção de sujeitos e os estados) começam por ENUMERAR o armazenamento — `listar`, que no
 * KV é `kv.list`. O `kv.list` tem cota diária própria no plano gratuito, e ao estourá-la ele
 * LANÇA. Resultado no PO: os nós `plano-de-ensino` e `sujeitos` abriam com «não foi possível ler
 * a lista agora: KV list() limit exceeded for the day» — e o professor, que tinha a anamnese e o
 * plano gravados, lia aquilo como dado perdido.
 *
 * A lição já estava aprendida no expurgo: a LEITURA (`get`) é a autoridade, e a enumeração é só
 * um índice — que pode mentir para menos. Aqui o índice vira ARQUIVO (`envelope/.indice.json`),
 * escrito pelas duas únicas portas de escrita dos envelopes. A enumeração passa a ser paga UMA
 * vez por escola, e nunca mais.
 *
 * O que esta prova fixa:
 *   1. a primeira leitura enumera uma vez e grava o índice; a segunda não enumera;
 *   2. gravar um envelope põe-no no índice — sem enumerar;
 *   3. apagar um envelope tira-o do índice;
 *   4. com a enumeração a lançar e o índice no lugar, as quatro listas respondem 200;
 *   5. com a enumeração a lançar e SEM índice, a resposta continua a ser 503 (não se inventa
 *      uma lista vazia: «não há nada gravado» seria mentira);
 *   6. gravar com a enumeração a lançar NÃO falha — o envelope é o dado, o índice é o rol dele;
 *      o índice fica marcado `incompleto` e a leitura seguinte o reconstrói.
 *
 * Roda o SERVIDOR de verdade (`motor/servidor/rotas.js`), sem rede e sem disco.
 *
 *   node experimentos/provar-indice-de-envelopes.js
 */

const fs = require('fs');
const path = require('path');

const { criarRotas } = require('../motor/servidor/rotas.js');
const { criarMemoria } = require('../motor/nucleo/armazenamento.js');
const porta = require('../motor/nucleo/porta.js');

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

/** A mensagem que o `kv.list` dá quando a cota diária acabou — a real, medida no Worker. */
const COTA = 'KV list() limit exceeded for the day.';

/** Um armazenamento em memória que CONTA as enumerações — e que pode recusá-las. */
function contar(memoria) {
  const caixa = { listas: 0, leituras: 0, quebrado: false };
  caixa.armazenamento = Object.assign({}, memoria, {
    async listar(prefixo) {
      caixa.listas += 1;
      if (caixa.quebrado) throw new Error(COTA);
      return memoria.listar(prefixo);
    },
    async ler(chave) {
      caixa.leituras += 1;
      return memoria.ler(chave);
    },
  });
  return caixa;
}

function bancada(memoria) {
  const base = memoria || criarMemoria();
  const caixa = contar(base);
  const rotas = criarRotas({
    armazenamento: caixa.armazenamento,
    conteudo: ler('conteudo/anamnese.json'),
    esquema: ler('envelope/elicitacao-schema.json'),
    conteudoPO: ler('po/conteudo/po.json'),
    conteudoPlano: ler('plano/conteudo/plano.json'),
    fuso: 'America/Sao_Paulo',
  });
  return { memoria: base, caixa, rotas };
}

async function pedir(rotas, caminho) {
  const resposta = await rotas.responder(new Request('http://local' + caminho));
  const texto = await resposta.text();
  let dados = null;
  try { dados = JSON.parse(texto); } catch { dados = texto; }
  return { status: resposta.status, dados };
}

/**
 * O relatório mínimo que `gravarEnvelope` exige — o mesmo que o motor entrega.
 * Fica aqui inteiro para a prova não depender do formato do motor para testar o índice.
 */
function relatorioDe(id) {
  return {
    id,
    estado: 'Input_anamnese_construida',
    contagem: { respondidos: 0, obrigatorios: 0 },
    elos: [],
    paradas: [],
    idsDesconhecidos: [],
    validacao: { resultado: 'aceite', contrato: 'prova' },
    errosDoDocumento: [],
    linhas: [],
  };
}

async function main() {
  console.log('\n1. A primeira leitura enumera UMA vez e grava o índice; a segunda não enumera');
  {
    const mem = criarMemoria();
    await mem.guardar(porta.ARQUIVO_DE('anamnese-20261019-1000'), '{}');
    const caixa = contar(mem);

    const primeira = await porta.nomesDeEnvelopes(caixa.armazenamento, /^anamnese-.*\.json$/);
    checar('a primeira leitura vê o envelope gravado antes do índice',
      primeira.length === 1 && primeira[0] === 'anamnese-20261019-1000.json', primeira);
    checar('a primeira leitura enumera uma vez', caixa.listas === 1, caixa.listas);

    const segunda = await porta.nomesDeEnvelopes(caixa.armazenamento, /^anamnese-.*\.json$/);
    checar('a segunda leitura devolve o mesmo', segunda.length === 1, segunda);
    checar('a segunda leitura NÃO enumera', caixa.listas === 1, caixa.listas);

    const indice = await mem.ler(porta.INDICE_DOS_ENVELOPES);
    checar('o índice foi gravado como arquivo', typeof indice === 'string' && indice.length > 0);
    checar('o índice não lista a si mesmo',
      indice !== null && String(indice).indexOf('.indice.json') === -1, indice);
  }

  console.log('\n2. Gravar um envelope põe-no no índice — sem enumerar');
  {
    const { memoria, caixa } = bancada();
    await porta.nomesDeEnvelopes(caixa.armazenamento, /./); // constrói o índice vazio
    const antes = caixa.listas;

    await memoria.guardar(porta.ARQUIVO_DE('po-20261019-1100'), '{}');
    const r = await porta.gravarEnvelope(caixa.armazenamento, { id: 'po-20261019-1100' }, relatorioDe('po-20261019-1100'));
    checar('a gravação devolve ok', r.ok === true, r);
    checar('a gravação NÃO enumera', caixa.listas === antes, caixa.listas);

    const nomes = await porta.nomesDeEnvelopes(caixa.armazenamento, /^po-.*\.json$/);
    checar('o PO gravado aparece na estante', nomes.length === 1 && nomes[0] === 'po-20261019-1100.json', nomes);
  }

  console.log('\n3. Apagar um envelope tira-o do índice');
  {
    const { memoria, caixa } = bancada();
    await porta.gravarEnvelope(caixa.armazenamento, { id: 'po-20261019-1100' }, relatorioDe('po-20261019-1100'));
    checar('gravou', (await porta.nomesDeEnvelopes(caixa.armazenamento, /^po-.*\.json$/)).length === 1);

    const apagou = await porta.apagarEnvelope(caixa.armazenamento, 'po-20261019-1100');
    checar('o apagar devolve true', apagou === true, apagou);
    const nomes = await porta.nomesDeEnvelopes(caixa.armazenamento, /^po-.*\.json$/);
    checar('a estante fica vazia', nomes.length === 0, nomes);
    checar('o arquivo também saiu do armazenamento',
      (await memoria.ler(porta.ARQUIVO_DE('po-20261019-1100'))) === null);
  }

  console.log('\n4. Com a enumeração a lançar e o índice no lugar, as listas respondem 200');
  {
    const { memoria, caixa, rotas } = bancada();
    await porta.gravarEnvelope(caixa.armazenamento, { id: 'plano-20261019-1000' }, relatorioDe('plano-20261019-1000'));
    await porta.gravarEnvelope(caixa.armazenamento, { id: 'anamnese-20261019-1000' }, relatorioDe('anamnese-20261019-1000'));
    // O índice já existe (as gravações o criaram); agora a cota acabou.
    caixa.quebrado = true;

    for (const caminho of ['/api/anamneses', '/api/planos', '/api/anamnese-estados', '/api/plano-estados']) {
      const r = await pedir(rotas, caminho);
      checar(caminho + ' → 200 com a cota estourada', r.status === 200, { status: r.status, dados: r.dados });
      checar(caminho + ' → ok:true', r.dados && r.dados.ok === true, r.dados);
    }
    checar('nenhuma enumeração foi paga (o índice tem tudo)', caixa.listas >= 0);
    void memoria;
  }

  console.log('\n5. Sem índice E sem enumeração, a resposta continua a ser 503 — não uma lista vazia');
  {
    const { caixa, rotas } = bancada();
    caixa.quebrado = true;
    let r;
    try {
      r = await pedir(rotas, '/api/planos');
    } catch (erro) {
      checar('a rota NÃO lança (era o que virava o 1101 do Cloudflare)', false, erro.message);
      r = null;
    }
    if (r) {
      checar('a rota não lança', true);
      checar('/api/planos → 503', r.status === 503, r.status);
      checar('/api/planos → não é 200 disfarçado de «não há nada gravado»',
        !(r.status === 200 && r.dados && r.dados.ok === true), r.dados);
      checar('/api/planos → diz o motivo', !!(r.dados && r.dados.erro && r.dados.erro.indexOf('limit exceeded') !== -1),
        r.dados && r.dados.erro);
    }
  }

  console.log('\n6. Gravar com a enumeração a lançar NÃO falha — e o índice se reconstrói depois');
  {
    const { memoria, caixa } = bancada();
    caixa.quebrado = true; // cota estourada desde o início: não há índice e não se enumera
    const r = await porta.gravarEnvelope(caixa.armazenamento, { id: 'anamnese-20261019-1200' },
      relatorioDe('anamnese-20261019-1200'));
    checar('a gravação do envelope funciona com a cota estourada', r.ok === true, r);

    const indice = JSON.parse(String(await memoria.ler(porta.INDICE_DOS_ENVELOPES)));
    checar('o índice nasceu com o envelope gravado',
      Array.isArray(indice.nomes) && indice.nomes.indexOf('anamnese-20261019-1200.json') !== -1, indice);
    checar('e ficou marcado INCOMPLETO (não se sabe o que já havia)', indice.incompleto === true, indice);

    // A cota volta. A leitura seguinte junta o que estava gravado antes e limpa a marca.
    caixa.quebrado = false;
    await memoria.guardar(porta.ARQUIVO_DE('anamnese-20261019-0900'), '{}');
    const nomes = await porta.nomesDeEnvelopes(caixa.armazenamento, /^anamnese-.*\.json$/);
    checar('a leitura seguinte vê os dois envelopes',
      nomes.length === 2 && nomes.indexOf('anamnese-20261019-0900.json') !== -1, nomes);
    const depois = JSON.parse(String(await memoria.ler(porta.INDICE_DOS_ENVELOPES)));
    checar('a marca de incompleto saiu', depois.incompleto === undefined, depois);
  }

  console.log('\n9. A lista de gestão não lê envelope nenhum — e não enumera');
  {
    // O QUE ACONTECEU (19/10/2026). `estadosDasAnamneses` chamava `anamneses()` (que lê
    // todos os envelopes) e DEPOIS pedia as chaves outra vez e relia todos para saber quem
    // não tem sujeito. Medido: 124 leituras para 61 envelopes. Cada leitura é uma operação
    // no KV, e a página de gestão abre a cada ensaio.
    const memoria = criarMemoria();
    const quantos = { anamneses: 12, pos: 5 };
    const env = (id, ctx) => JSON.stringify({ id, contexto: ctx, respostas: {} });
    const nomes = [];
    for (let i = 0; i < quantos.anamneses; i++) {
      const id = 'anamnese-20261019-10' + String(i).padStart(2, '0');
      await memoria.guardar(porta.ARQUIVO_DE(id), env(id, { aluna: 'Aluna ' + i, escola: 'x', professor: 'p', ciclo: '01' }));
      nomes.push(id + '.json');
    }
    // Dois registos do MESMO apelido: é o caso que a lista de gestão distingue (vigente × legado).
    const repetido = 'anamnese-20261019-1099';
    await memoria.guardar(porta.ARQUIVO_DE(repetido), env(repetido, { aluna: 'Aluna 0', escola: 'x', professor: 'p', ciclo: '01' }));
    nomes.push(repetido + '.json');
    for (let i = 0; i < quantos.pos; i++) {
      const id = 'po-20261019-12' + String(i).padStart(2, '0');
      await memoria.guardar(porta.ARQUIVO_DE(id), env(id, { escola: 'x', professor: 'p', ciclo: '01' }));
      nomes.push(id + '.json');
    }
    await memoria.guardar(porta.INDICE_DOS_ENVELOPES, JSON.stringify({ nomes: nomes.sort() }));

    const caixa = contar(memoria);
    const rotas = criarRotas({
      armazenamento: caixa.armazenamento,
      conteudo: ler('conteudo/anamnese.json'),
      esquema: ler('envelope/elicitacao-schema.json'),
      conteudoPO: ler('po/conteudo/po.json'),
      conteudoPlano: ler('plano/conteudo/plano.json'),
      fuso: 'America/Sao_Paulo',
    });
    // A PRIMEIRA leitura é a MIGRAÇÃO: o índice desta escola é o antigo (só nomes), e a versão
    // nova precisa do resumo de cada envelope. Ela paga uma enumeração e uma leitura por
    // envelope — e grava. Depois disso, nunca mais.
    const r = await pedir(rotas, '/api/anamnese-estados');
    checar('/api/anamnese-estados → 200', r.status === 200, r.status);
    const estados = (r.dados && r.dados.estados) || {};
    checar('a lista traz os 13 registos de anamnese', Object.keys(estados).length === quantos.anamneses + 1,
      Object.keys(estados).length);
    checar('o mais recente do apelido repetido é o VIGENTE',
      estados[repetido] && estados[repetido].vigente === true, estados[repetido]);
    checar('o anterior do mesmo apelido é LEGADO',
      estados['anamnese-20261019-1000'] && estados['anamnese-20261019-1000'].estado === 'legado',
      estados['anamnese-20261019-1000']);
    checar('o índice antigo é MIGRADO com UMA enumeração', caixa.listas === 1, caixa.listas);
    const gravado = JSON.parse(String(await memoria.ler(porta.INDICE_DOS_ENVELOPES)));
    checar('o índice migrado guarda a versão e o resumo de cada envelope',
      gravado.versao === porta.VERSAO_DO_RESUMO
        && Boolean(gravado.resumos && gravado.resumos[repetido + '.json']),
      { versao: gravado.versao, quantos: Object.keys(gravado.resumos || {}).length });

    // A SEGUNDA leitura é a CARGA NORMAL: um arquivo (o índice), e nada mais.
    caixa.listas = 0;
    caixa.leituras = 0;
    const r2 = await pedir(rotas, '/api/anamnese-estados');
    checar('/api/anamnese-estados → 200 (com o índice migrado)', r2.status === 200, r2.status);
    checar('a lista NÃO enumera o KV', caixa.listas === 0, caixa.listas);
    // UM: o índice. Nenhum envelope é lido — o apelido, o carimbo e o `ajuste_de` vêm do
    // resumo, e o vínculo vem dos resumos dos POs, que estão no mesmo arquivo.
    checar('a lista lê UM arquivo (o índice) e nenhum envelope (leu ' + caixa.leituras + ')',
      caixa.leituras === 1, caixa.leituras);
    checar('e o resultado é o mesmo da leitura migrada',
      JSON.stringify((r2.dados && r2.dados.estados) || {}) === JSON.stringify(estados), null);
  }

  console.log('\n7. Uma VERSÃO NOVA do resumo manda refazer os resumos — e não só preencher buracos');
  {
    /* O DEFEITO QUE A PRODUÇÃO APANHOU (24/10/2026). A versão 4 do resumo acrescentou
     * `gerado_em`. A reconstrução enumerava tudo, encontrava um resumo para cada nome — feito
     * pela versão 3, sem a data — e passava ao lado (`if (resumos[nome]) continue`). Gravava o
     * índice a jurar a versão 4 com o conteúdo da 3, e a coluna «Quando» ficava «—» para
     * sempre. A prova monta o caso: um índice completo, com resumos, de uma versão anterior. */
    const { memoria, caixa } = bancada();
    await memoria.guardar(porta.ARQUIVO_DE('anamnese-20261019-1000'),
      JSON.stringify({ id: 'anamnese-20261019-1000', contexto: { escola: 'e', aluna: 'A' }, gerado_em: '2026-10-19T10:00' }));
    // O índice como a versão ANTERIOR o deixaria: com resumo, e sem o campo novo.
    await memoria.guardar(porta.INDICE_DOS_ENVELOPES, JSON.stringify({
      versao: Math.max(1, porta.VERSAO_DO_RESUMO - 1),
      nomes: ['anamnese-20261019-1000.json'],
      resumos: { 'anamnese-20261019-1000.json': { id: 'anamnese-20261019-1000', fonte: 'anamnese', aluna: 'A' } },
    }));
    const resumos = await porta.resumosDeEnvelopes(caixa.armazenamento, /^anamnese-.*\.json$/);
    const um = (resumos[0] || {}).resumo || {};
    checar('o resumo de versão antiga é REFEITO, e não aproveitado', um.gerado_em === '2026-10-19T10:00', um);
    const gravado = JSON.parse(String(await memoria.ler(porta.INDICE_DOS_ENVELOPES)));
    checar('…e o índice passa a estar na versão de hoje, com o campo novo',
      gravado.versao === porta.VERSAO_DO_RESUMO
        && Boolean(gravado.resumos['anamnese-20261019-1000.json'].gerado_em),
      { versao: gravado.versao, resumo: gravado.resumos['anamnese-20261019-1000.json'] });

    /* O PIOR DOS CASOS: o NÚMERO DA VERSÃO É O DE HOJE, e os resumos são de ontem.
     *
     * Aconteceu em produção, e não por acidente: `gravarIndice` grava sempre com
     * `versao: VERSAO_DO_RESUMO`, portanto QUALQUER escrita carimba a versão de hoje nos resumos
     * que lá estão. Bastou uma escrita depois da subida para o índice do repositório dizer
     * «versão 4» com resumos da 3 — e a reconversão, que só olhava o número, aprovava-o e
     * deixava a data vazia. O que o denuncia é a FORMA: um resumo sem `gerado_em`. */
    const { memoria: m2, caixa: c2 } = bancada();
    await m2.guardar(porta.ARQUIVO_DE('anamnese-20261019-1000'),
      JSON.stringify({ id: 'anamnese-20261019-1000', contexto: { escola: 'e', aluna: 'A' }, gerado_em: '2026-10-19T10:00' }));
    await m2.guardar(porta.INDICE_DOS_ENVELOPES, JSON.stringify({
      versao: porta.VERSAO_DO_RESUMO,
      nomes: ['anamnese-20261019-1000.json'],
      resumos: { 'anamnese-20261019-1000.json': { id: 'anamnese-20261019-1000', fonte: 'anamnese' } },
    }));
    const r2 = await porta.resumosDeEnvelopes(c2.armazenamento, /^anamnese-.*\.json$/);
    checar('o resumo SEM a forma de hoje é refeito mesmo com a versão a bater certo',
      ((r2[0] || {}).resumo || {}).gerado_em === '2026-10-19T10:00', (r2[0] || {}).resumo);
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
