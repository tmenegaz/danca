#!/usr/bin/env node
'use strict';

/*
 * provar-registro-de-custo-por-mes.js — a linha de custo cai no mês dela, e o ficheiro não cresce
 * para sempre.
 *
 * O QUE FOI MEDIDO (13/11/2026). O registo de custo da IA era **uma chave só** —
 * `ia-registro/registro.jsonl` —, e com o KV isso tem duas consequências que só aparecem com o
 * tempo:
 *
 *   · o `anexar` do KV é LER-MODIFICAR-ESCREVER (o KV não tem append, e está declarado em
 *     `motor/adaptadores/cloudflare.js`). Cada linha nova lê o ficheiro inteiro e reescreve-o
 *     inteiro: **o custo da escrita cresce com o histórico**, e o valor tem um tecto de 25 MiB
 *     por chave que não avisa — um dia o `put` recusa e a linha perde-se em silêncio;
 *   · uma chave de 25 MiB é uma **leitura de 25 MiB** para o leitor do catálogo (GE06/GE10) que
 *     queira uma linha do mês passado.
 *
 * A CORREÇÃO NÃO MUDA A LINHA. Os campos são os mesmos que o `ARQUITETURA-AGENTE.md` desenha
 * (`{contexto, turnos, chamadas, ferramentas[], tokens_in, tokens_out, carimbo}`) — o que muda é
 * o NOME DO FICHEIRO onde ela cai: um mês, um ficheiro.
 *
 * O QUE ESTA PROVA FIXA:
 *
 *   1. a chave sai do CARIMBO da linha (não de um relógio lido à parte), e corta no mês;
 *   2. a mesma sessão escrita em dois meses cai em dois ficheiros — e cada um recebe só a sua
 *      linha (é o que impede o ficheiro de crescer);
 *   3. o `POST /api/ia` escreve MESMO nesta chave, pela ponta a ponta (rota → adaptador → KV);
 *   4. um carimbo ilegível LANÇA, em vez de inventar uma chave — um `ia-registro/undefined.jsonl`
 *      é um ficheiro que ninguém procura;
 *   5. CONTROLO NEGATIVO: com a chave única de antes, as asserções 2 e 3 reprovam — se passassem
 *      nos dois casos, a prova não estaria a medir nada.
 *
 *   node experimentos/provar-registro-de-custo-por-mes.js
 */

const path = require('path');

const RAIZ = path.join(__dirname, '..');
const registroDeCusto = require(path.join(RAIZ, 'motor/nucleo/registro-de-custo.js'));
const rotas = require(path.join(RAIZ, 'motor/servidor/rotas.js'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};

/* O corpo é assíncrono porque a ponta a ponta do `POST /api/ia` é — e `require` com
 * `await` de topo põe o Node em modo ambíguo (ERR_AMBIGUOUS_MODULE_SYNTAX). */
(async () => {
  /* ── 1. A DERIVAÇÃO DA CHAVE ────────────────────────────────────────────────────────────── */
  console.log('\n1 · a chave sai do carimbo, e corta no mês');
  {
    provar('um carimbo de outubro dá a chave de outubro',
      registroDeCusto.chaveDoMes('2026-10-31T23:59') === 'ia-registro/2026-10.jsonl',
      registroDeCusto.chaveDoMes('2026-10-31T23:59'));
    provar('um carimbo de novembro dá a chave de novembro',
      registroDeCusto.chaveDoMes('2026-11-01T00:01') === 'ia-registro/2026-11.jsonl',
      registroDeCusto.chaveDoMes('2026-11-01T00:01'));
    provar('o último instante do mês e o primeiro do seguinte NÃO caem no mesmo ficheiro',
      registroDeCusto.chaveDoMes('2026-10-31T23:59') !== registroDeCusto.chaveDoMes('2026-11-01T00:00'));

    let lancou = false;
    try { registroDeCusto.chaveDoMes('ontem à noite'); } catch (erro) { lancou = true; }
    provar('um carimbo ilegível LANÇA (não inventa `ia-registro/undefined.jsonl`)', lancou);
    lancou = false;
    try { registroDeCusto.chaveDoMes(''); } catch (erro) { lancou = true; }
    provar('um carimbo vazio também lança', lancou);

    provar('o período de três meses dá três chaves, e na ordem',
      registroDeCusto.chavesDoPeriodo('2026-10-05', '2026-12-20').join(',') ===
        'ia-registro/2026-10.jsonl,ia-registro/2026-11.jsonl,ia-registro/2026-12.jsonl',
      registroDeCusto.chavesDoPeriodo('2026-10-05', '2026-12-20'));
    provar('o período atravessa a virada do ano',
      registroDeCusto.chavesDoPeriodo('2026-12-31', '2027-01-01').join(',') ===
        'ia-registro/2026-12.jsonl,ia-registro/2027-01.jsonl');
    lancou = false;
    try { registroDeCusto.chavesDoPeriodo('2026-12-01', '2026-01-01'); } catch (erro) { lancou = true; }
    provar('um período invertido lança (a trava do laço infinito)', lancou);
  }

  /* ── 2. A MESMA SESSÃO EM DOIS MESES: DOIS FICHEIROS, UMA LINHA CADA ─────────────────────── */
  console.log('\n2 · dois meses, dois ficheiros — e nenhum cresce com o outro');
  {
    const memoria = new Map();
    const anexados = [];
    const armazenamento = {
      async anexar(chave, linha) {
        anexados.push(chave);
        memoria.set(chave, (memoria.get(chave) || '') + linha);
      },
    };
    const linha = (carimbo) => JSON.stringify({ contexto: { escola: 'e' }, turnos: 2, carimbo }) + '\n';

    /* As duas linhas pela MESMA função que o `POST /api/ia` usa — não por uma reimplementação. */
    await armazenamento.anexar(registroDeCusto.chaveDoMes('2026-10-31T22:00'), linha('2026-10-31T22:00'));
    await armazenamento.anexar(registroDeCusto.chaveDoMes('2026-11-01T09:00'), linha('2026-11-01T09:00'));

    provar('foram duas chaves distintas', new Set(anexados).size === 2, anexados);
    provar('o ficheiro de outubro tem UMA linha, e não as duas',
      memoria.get('ia-registro/2026-10.jsonl').trim().split('\n').length === 1,
      memoria.get('ia-registro/2026-10.jsonl'));
    provar('o ficheiro de novembro tem UMA linha, e não as duas',
      memoria.get('ia-registro/2026-11.jsonl').trim().split('\n').length === 1);
    provar('nenhum ficheiro se chama `registro.jsonl` (a chave única de antes)',
      ![...memoria.keys()].some((c) => c.endsWith('/registro.jsonl')), [...memoria.keys()]);
  }

  /* ── 3. A PONTA A PONTA: O `POST /api/ia` ESCREVE NA CHAVE DO MÊS ─────────────────────────── */
  console.log('\n3 · o `POST /api/ia` escreve mesmo na chave do mês (rota → adaptador → KV)');
  {
    /* O armazenamento é o do NÚCLEO (`armazenamento.js`), e o registo é escrito por `anexar` — é o
     * mesmo caminho do Worker com o adaptador do Cloudflare. Aqui, em memória, para a prova correr
     * sem rede e sem KV. */
    const fs = require('fs');
    const memoria = new Map();
    const armazenamento = {
      async ler(chave) { return memoria.has(chave) ? memoria.get(chave) : null; },
      async guardar(chave, valor) { memoria.set(chave, String(valor)); },
      async criar(chave, valor) { if (memoria.has(chave)) return { criado: false }; memoria.set(chave, String(valor)); return { criado: true }; },
      async anexar(chave, linha) { memoria.set(chave, (memoria.get(chave) || '') + String(linha)); },
      async listar() { return [...memoria.keys()]; },
      async existe(chave) { return memoria.has(chave); },
      async apagar(chave) { memoria.delete(chave); },
    };
    const lerEstatico = (rel) => {
      const base = path.join(RAIZ, 'porta');
      const f = path.join(base, rel);
      return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    };
    const servidor = rotas.criarRotas({
      conteudo: JSON.parse(lerEstatico('conteudo/anamnese.json')),
      esquema: JSON.parse(lerEstatico('envelope/elicitacao-schema.json')),
      armazenamento,
      agora: () => '2026-11-13T14:47',
    });

    /* Uma conversa que COMPILA: o stub compila quando a sentinela chega. Duas chamadas — a primeira
     * devolve a pergunta, a segunda encerra. O que interessa não é a conversa: é a chave onde a
     * linha caiu. */
    const responder = async (corpo) => {
      const r = await servidor.responder(new Request('https://porta.local/api/ia', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(corpo),
      }));
      return { status: r.status, corpo: await r.json() };
    };

    const primeira = await responder({ mensagens: [{ papel: 'professor', texto: 'oi' }] });
    provar('a rota responde', primeira.status === 200, primeira.status);

    /* A sentinela «compilar» com um turno já dado. O stub compila no texto, e a linha de custo é
     * escrita quando `saida.compilado` é verdadeiro. */
    const segunda = await responder({ mensagens: [
      { papel: 'professor', texto: 'oi' },
      { papel: 'ia', texto: String((primeira.corpo && primeira.corpo.pergunta) || 'seguir') },
      { papel: 'professor', texto: 'compilar' },
    ] });
    provar('a segunda chamada responde', segunda.status === 200, segunda.status);

    const chaves = [...memoria.keys()];
    if (!segunda.corpo.compilado) {
      /* Se o stub não compilou nesta sequência, a prova não pode afirmar o que não aconteceu — e
       * diz isso em vez de passar por omissão. */
      ko += 1;
      console.log('  FALHA a conversa não compilou: a prova não chegou a exercer a escrita');
    } else {
      const azul = 'ia-registro/2026-11.jsonl';
      provar('a linha caiu em `' + azul + '`', chaves.includes(azul), chaves);
      const texto = memoria.get(azul) || '';
      const linhas = texto.trim().split('\n').filter(Boolean);
      provar('a linha tem os campos do contrato (contexto, turnos, carimbo)',
        linhas.length === 1 && (() => {
          const l = JSON.parse(linhas[0]);
          return 'contexto' in l && 'turnos' in l && 'carimbo' in l;
        })(), linhas[0]);
      provar('o carimbo da linha é o do mês do ficheiro',
        JSON.parse(linhas[0]).carimbo.slice(0, 7) === '2026-11', JSON.parse(linhas[0]).carimbo);
    }
  }

  /* ── 4. CONTROLO NEGATIVO ───────────────────────────────────────────────────────────────── */
  console.log('\n4 · controlo negativo: com a chave única de antes, a prova reprova');
  {
    /* O que a chave de antes faz: TUDO no mesmo ficheiro. As asserções da secção 2 são reescritas
     * com ela — e têm de falhar. Se passassem, a prova estaria a medir o nome do sítio, e não a
     * partição. */
    const memoria = new Map();
    const anexar = async (chave, linha) => memoria.set(chave, (memoria.get(chave) || '') + linha);
    const antiga = () => 'ia-registro/registro.jsonl';
    await anexar(antiga(), JSON.stringify({ carimbo: '2026-10-31T22:00' }) + '\n');
    await anexar(antiga(), JSON.stringify({ carimbo: '2026-11-01T09:00' }) + '\n');
    const chaves = [...memoria.keys()];
    provar('com a chave única, é UM ficheiro (é o defeito)',
      chaves.length === 1 && chaves[0] === 'ia-registro/registro.jsonl', chaves);
    provar('e ele tem as DUAS linhas — cresce com o histórico, e é isso que a mudança corrige',
      memoria.get('ia-registro/registro.jsonl').trim().split('\n').length === 2);
  }

  console.log('\n' + (ko ? 'FALHOU' : 'TUDO CERTO') + ' — ' + ok + ' asserção(ões)' +
    (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko ? 1 : 0);
})().catch((erro) => { console.error(erro); process.exit(1); });
