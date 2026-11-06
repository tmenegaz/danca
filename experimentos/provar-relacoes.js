#!/usr/bin/env node
'use strict';

/**
 * provar-relacoes.js — o mapa de relações do ciclo, e a travessia que ele torna possível.
 *
 * A PERGUNTA DELA (06/11/2026), e é a origem de tudo isto:
 *
 *   «como a gente tem a proveniência e os nós são complexos, eu estava pensando se a gente tivesse
 *    de um nó ao outro nó que é complexo, passando por vários nós até chegar num objetivo
 *    específico, a gente precisa das arestas.»
 *
 * A decisão (06/11/2026, `ARQUITETURA-GERAL.md` §7.4): **por ciclo, e agora**. Porque uma aresta
 * descoberta tarde é uma ligação que ninguém testou, e o custo é um gerador — não um serviço.
 *
 * O QUE SE PROVA AQUI:
 *
 *   A. o mapa é DERIVADO do disco: os nós e as arestas do ciclo real, e cada aresta nomeia em
 *      `chave` o campo que a produziu;
 *   B. NENHUM CONTEÚDO entra no mapa — nas anamneses as respostas vão cifradas, e o nome de
 *      NENHUMA aluna do elenco aparece, nem no rótulo nem num id: `indices/` é servido pelo Worker
 *      e nenhum índice do acervo nomeia aluna (verificação 7 do `check-indices.js`);
 *   C. a PONTE entre os dois vocabulários (campo da anamnese × aspecto do lançamento) existe, liga
 *      4 de 4, e — contraprova — quando um nome muda de um lado a aresta DESAPARECE e a lacuna é
 *      declarada em vez de inventada;
 *   D. a TRAVESSIA que ela descreveu funciona nos dois sentidos: do aspecto até à anamnese que o
 *      recortou, e da anamnese de uma aluna até aos aspectos que o recorte dela escolheu;
 *   E. o mapa é DETERMINÍSTICO e o `--check` o confere;
 *   F. um ciclo sem plano, sem linha de base e sem PO **declara as lacunas** em vez de inventar
 *      uma turma.
 *
 *   node experimentos/provar-relacoes.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const { mapaDoCiclo, ciclosNoDisco, caminhoDoMapa, slug } = require(path.join(RAIZ, 'tools/gerar-relacoes.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const lerJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const PROF = 'rabo-gramde';
const VARIANTE = 'calango-bale-nivel-1-teste-1';
const PASTA = path.join(RAIZ, 'professores', PROF, 'ciclos', `ciclo-01-${VARIANTE}`);

/** Um índice de adjacência, nas duas direcções — é o que qualquer travessia precisa. */
function adjacencia(mapa) {
  const saindo = new Map(), entrando = new Map();
  for (const e of mapa.arestas) {
    if (!saindo.has(e.de)) saindo.set(e.de, []);
    saindo.get(e.de).push(e);
    if (!entrando.has(e.para)) entrando.set(e.para, []);
    entrando.get(e.para).push(e);
  }
  return { saindo, entrando };
}

(async () => {
  if (!fs.existsSync(PASTA)) {
    console.error('provar-relacoes: o ciclo da calango não está no disco — NÃO FEITO.');
    process.exit(1);
  }

  const alvo = ciclosNoDisco().find((c) => c.variante === VARIANTE);
  const mapa = mapaDoCiclo(alvo);

  // ---------------------------------------------------------------------------------------------
  console.log('A. O mapa é derivado do disco — e cada aresta diz de que campo veio');
  {
    provar('o mapa sabe de que ciclo é, de que escola e de que turma',
      mapa.ciclo === `${PROF}/01/${VARIANTE}` && mapa.escola === 'calango'
        && /Balé Nível 1/.test(mapa.turma || ''), { ciclo: mapa.ciclo, escola: mapa.escola, turma: mapa.turma });
    provar('há nós e há arestas, e nenhum dos dois está vazio',
      mapa.nos.length > 20 && mapa.arestas.length > 20,
      { nos: mapa.nos.length, arestas: mapa.arestas.length });
    /* O ELENCO NÃO É NÓ — e isto é a verificação 7 do `check-indices.js` a mandar (05/11/2026).
     * `indices/` é servido pelo Worker, e a regra da casa é que nenhum índice do acervo nomeia
     * aluna, nem pelo apelido. A primeira versão deste mapa criava nós `aluna` com o nome no
     * rótulo e reprovou. A pessoa entra na cadeia pela ANAMNESE, cujo carimbo é livre de nome. */
    provar('o ELENCO não é um nó do mapa — quem está na turma é conteúdo da linha de base',
      mapa.nos.every((n) => n.tipo !== 'aluna'),
      mapa.nos.filter((n) => n.tipo === 'aluna').map((n) => n.rotulo));
    provar('as duas anamneses LIDAS são nós, identificadas só pelo carimbo',
      mapa.nos.filter((n) => n.tipo === 'anamnese').length === 2
        && mapa.nos.filter((n) => n.tipo === 'anamnese').every((n) => /^anamnese-\d{8}-\d{4}$/.test(n.rotulo)),
      mapa.nos.filter((n) => n.tipo === 'anamnese').map((n) => n.rotulo));
    provar('TODA aresta nomeia o campo que a produziu — nenhuma é opinião',
      mapa.arestas.every((e) => typeof e.chave === 'string' && e.chave.length > 0),
      mapa.arestas.filter((e) => !e.chave).map((e) => `${e.de}->${e.para}`).slice(0, 3));
    provar('nenhuma aresta aponta para um nó que não existe (nem para si mesma)',
      mapa.arestas.every((e) => e.de !== e.para
        && mapa.nos.some((n) => n.id === e.de) && mapa.nos.some((n) => n.id === e.para)),
      mapa.arestas.filter((e) => !mapa.nos.some((n) => n.id === e.para)).map((e) => e.para).slice(0, 3));
    provar('um ciclo completo não declara lacuna nenhuma', mapa.lacunas.length === 0, mapa.lacunas);
    provar('as âncoras do ciclo e das aulas são nós, e ancoram o que dizem ancorar',
      mapa.nos.filter((n) => n.tipo === 'ancora').length >= 2
        && mapa.arestas.some((e) => e.tipo === 'ancorada_por'),
      mapa.nos.filter((n) => n.tipo === 'ancora').map((n) => n.rotulo).slice(0, 3));
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nB. Nenhum conteúdo entra no mapa — só chave, tipo, data e vínculo');
  {
    const cru = JSON.stringify(mapa);
    /* AS RESPOSTAS DAS ANAMNESES VÃO CIFRADAS: se alguma aparecesse, a prova tinha de a encontrar
     * por outro caminho. O que se procura é o TEXTO de uma resposta real; o que o mapa leva é o
     * carimbo do envelope, que não diz de quem é. */
    const envelope = lerJson(path.join(RAIZ, 'escola', 'calango', 'envelopes', 'anamnese-20261105-2301.json'));
    provar('as respostas da anamnese vão CIFRADAS na fonte (é o que impede o vazamento na origem)',
      !!(envelope.respostas && envelope.respostas._cifrado), Object.keys(envelope.respostas || {}));
    provar('…e o mapa NÃO leva o bloco de respostas, nem cifrado',
      !/_cifrado/.test(cru) && !/endereco/.test(cru));
    provar('o mapa declara o que guarda e o que não guarda',
      /nunca conteúdo/.test(mapa._nota) && /cifrad/.test(mapa._nota), mapa._nota.slice(0, 60));
    /* O QUE O MAPA **PODE** LEVAR: apelido, carimbo, data, id de campo. O que **não** pode: nível,
     * texto de classificação, resposta. As chaves dos nós são a lista fechada disso. */
    const chavesPermitidas = new Set(['id', 'tipo', 'rotulo', 'grupo', 'eixo', 'data',
      'estado', 'tipoDocumento', 'aula', 'aspecto', 'marca']);
    const intrusas = [];
    for (const n of mapa.nos) for (const k of Object.keys(n)) if (!chavesPermitidas.has(k)) intrusas.push(`${n.id}.${k}`);
    provar('…e nenhum nó carrega um campo fora da lista declarada',
      intrusas.length === 0, intrusas.slice(0, 5));
    /* A PROVA QUE INTERESSA A QUEM PUBLICA: o nome de nenhuma aluna do elenco aparece no mapa.
     * Não se procura a chave `aluna` — procura-se o VALOR. Uma regra que só olha nomes de campo
     * deixa passar «rotulo: "Aluna A"», e é exactamente assim que o elenco vazaria. */
    const base = (() => {
      const dir = path.join(RAIZ, 'escola', 'calango', 'linhas-de-base');
      // O `.indice.json` da pasta NÃO é um acto: não tem carimbo nem elenco, e ordenado por
      // carimbo (`undefined`) vinha primeiro. Filtrar pelo nome é o que o gerador já faz.
      return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'))
        .map((f) => lerJson(path.join(dir, f))).filter(Boolean)
        .sort((a, b) => String(b.carimbo).localeCompare(String(a.carimbo)))[0];
    })();
    const elenco = (base && base.alunas) || [];
    const vazados = elenco.filter((nome) => cru.includes(nome));
    provar('…e o nome de NENHUMA aluna do elenco aparece no mapa — nem no rótulo, nem num id',
      elenco.length > 0 && vazados.length === 0, { elenco, vazados });
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nC. A ponte entre os dois vocabulários — e o que acontece quando ela parte');
  {
    const pares = mapa._ponte.pares;
    provar('o mesmo aspecto tem dois identificadores, e o mapa liga-os',
      pares.length === 4, pares);
    provar('…e liga-os PELO NOME, e diz isso na aresta',
      mapa.arestas.filter((e) => e.tipo === 'mesmo_aspecto').every((e) => e.chave === 'nome'),
      mapa.arestas.filter((e) => e.tipo === 'mesmo_aspecto').map((e) => e.chave));
    provar('o identificador do campo é o da anamnese, e o do aspecto é o do lançamento — são DIFERENTES',
      pares.every((p) => p.campo !== p.aspecto
        && /^[a-z0-9-]+$/.test(p.campo) && /^[a-z0-9_]+$/.test(p.aspecto)),
      pares[0]);
    provar('nenhum aspecto do recorte ficou sem correspondência',
      mapa._ponte.semCorrespondencia.length === 0, mapa._ponte.semCorrespondencia);

    /* A CONTRAPROVA, e é a que importa: se o NOME mudar de um lado, a aresta não existe — e o mapa
     * DIZ que não existe, em vez de inventar uma correspondência por posição. */
    const copia = JSON.parse(JSON.stringify(alvo));
    const pastaFalsa = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-rel-'));
    const ciclosFalsos = path.join(pastaFalsa, 'ciclos');
    fs.mkdirSync(ciclosFalsos, { recursive: true });
    for (const f of fs.readdirSync(path.dirname(PASTA))) {
      const de = path.join(path.dirname(PASTA), f);
      if (fs.statSync(de).isFile()) fs.copyFileSync(de, path.join(ciclosFalsos, f));
    }
    fs.cpSync(PASTA, path.join(ciclosFalsos, path.basename(PASTA)), { recursive: true });
    const poFalso = path.join(ciclosFalsos, path.basename(PASTA), 'po-01.json');
    const po = lerJson(poFalso);
    for (const d of po.itensPorDimensao || []) {
      if (String(d.eixo) === 'Corpo') d.itens = String(d.itens).replace('1ª posição — braços', '1ª posição — braço esquerdo');
    }
    fs.writeFileSync(poFalso, JSON.stringify(po, null, 2) + '\n');
    const mapaRompido = mapaDoCiclo({ professor: PROF, ciclo: '01', variante: VARIANTE,
      pasta: path.join(ciclosFalsos, path.basename(PASTA)) });
    provar('quando o NOME muda de um lado, a aresta da ponte DESAPARECE (não se inventa por posição)',
      mapaRompido._ponte.pares.length === 3, mapaRompido._ponte.pares.length);
    provar('…e o mapa declara a lacuna, com o nome que ficou órfão',
      mapaRompido.lacunas.some((l) => /não encadeia/.test(l) && /braços/.test(l)),
      mapaRompido.lacunas.filter((l) => /não encadeia/.test(l)));
    fs.rmSync(pastaFalsa, { recursive: true, force: true });
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nD. A travessia que ela descreveu: de um nó ao outro, até um objetivo');
  {
    const { saindo, entrando } = adjacencia(mapa);
    const aspecto = 'aspecto:1_posicao_bracos';

    // 1) o aspecto volta ao campo que a anamnese nomeia (a ponte)
    const ponte = (entrando.get(aspecto) || []).filter((e) => e.tipo === 'mesmo_aspecto');
    provar('do ASPECTO chega-se ao CAMPO que a anamnese nomeia',
      ponte.length === 1, ponte.map((e) => e.de));
    // 2) o campo volta à linha de base que o recortou
    const recorte = (entrando.get(ponte[0].de) || []).filter((e) => e.tipo === 'recorta');
    provar('…do CAMPO chega-se à LINHA DE BASE que o recortou',
      recorte.length === 1, recorte.map((e) => e.de));
    // 3) a linha de base LÊ as anamneses (a direção vira aqui, e é um facto do modelo)
    const base = recorte[0].de;
    const leituras = (saindo.get(base) || []).filter((e) => e.tipo === 'le');
    provar('…da LINHA DE BASE saem as ANAMNESES que ela leu — a direção vira aqui',
      leituras.length === 2, leituras.map((e) => e.para));
    // 4) o carimbo da anamnese é o bilhete da pessoa: é ele que a folha de presença resolve
    provar('…e o carimbo de cada ANAMNESE é a chave da pessoa — a base guarda-o em `lida`',
      leituras.length === 2 && leituras.every((e) => /^\d{8}-\d{4}$/.test(e.para.slice('anamnese:'.length + 'anamnese-'.length))),
      leituras.map((e) => e.para));

    /* A ÁRVORE INTEIRA, montada por travessia — é o que a pergunta dela pedia: «passando por vários
     * nós até chegar num objetivo específico». Cinco tipos, nenhum deles uma pessoa: o mapa anda
     * do aspecto até à anamnese que o recortou, e aí para — de quem é o envelope, diz a linha de
     * base (`lida`), que não é índice. */
    const rastro = [aspecto, ponte[0].de, base, ...leituras.map((e) => e.para)];
    provar('o rastro completo tem os tipos todos pelos quais ela quis passar',
      ['aspecto', 'campo', 'linha-de-base', 'anamnese']
        .every((t) => rastro.some((id) => id.startsWith(t + ':'))),
      rastro.map((id) => id.split(':')[0]));

    /* E O SENTIDO INVERSO — da ANAMNESE (a porta da pessoa) até aos aspectos que o recorte dela
     * escolheu. É assim que a pergunta dela se responde: o ecrã selecciona a aluna pelo nome, o
     * nome resolve-se no carimbo, e daí para dentro o caminho não precisa de nomes. */
    const baseDoMapa = (() => {
      const dir = path.join(RAIZ, 'escola', 'calango', 'linhas-de-base');
      return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'))
        .map((f) => lerJson(path.join(dir, f))).filter(Boolean)
        .sort((a, b) => String(b.carimbo).localeCompare(String(a.carimbo)))[0];
    })();
    const alunaA = 'anamnese:' + baseDoMapa.lida['Aluna A'];
    const anamneses = (entrando.get(alunaA) || []).filter((e) => e.tipo === 'le');
    const bases = new Set(anamneses.map((e) => e.de));
    // O `recorta` sai da base e ENTRA no campo: quem interessa é o `para`, não o `de`.
    const campos = [...bases].flatMap((b) => (saindo.get(b) || []).filter((e) => e.tipo === 'recorta'));
    const aspectos = campos.flatMap((c) => (saindo.get(c.para) || []).filter((e) => e.tipo === 'mesmo_aspecto'));
    provar('da ANAMNESE da aluna A chega-se, pelo caminho inverso, aos ASPECTOS que o recorte escolheu',
      aspectos.length === 4, aspectos.map((e) => e.para));
    provar('…e o mesmo caminho passa pela linha de base da turma, e não por uma cópia',
      bases.size === 1, [...bases]);
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nE. O mapa é determinístico, e o `--check` confere-o');
  {
    const a = JSON.stringify(mapaDoCiclo(alvo));
    const b = JSON.stringify(mapaDoCiclo(alvo));
    provar('duas construções seguidas dão o mesmo texto', a === b, { iguais: a === b });

    const rel = caminhoDoMapa(alvo);
    const abs = path.join(RAIZ, rel);
    provar('o mapa está escrito no disco, em `indices/relacoes/<prof>/<NN>-<variante>.json`',
      fs.existsSync(abs) && rel === `indices/relacoes/${PROF}/01-${VARIANTE}.json`.split(path.sep).join('/')
        .replace(/\//g, path.sep), rel);

    let codigo = 0, saida = '';
    try {
      saida = execSync('node tools/gerar-relacoes.js --check', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { codigo = e.status || 1; saida = String((e.stdout || '') + (e.stderr || '')); }
    provar('o `--check` passa com os mapas em dia', codigo === 0 && /em dia/.test(saida),
      { codigo, saida: saida.trim().split('\n').slice(-2) });

    /* A CONTRAPROVA DO `--check`: um mapa com uma aresta a menos tem de ser acusado. Sem isto, o
     * `--check` seria uma promessa. */
    const copia = fs.readFileSync(abs, 'utf8');
    try {
      const m = JSON.parse(copia);
      m.arestas = m.arestas.slice(1);
      fs.writeFileSync(abs, JSON.stringify(m, null, 2) + '\n');
      let c2 = 0, s2 = '';
      try { execSync('node tools/gerar-relacoes.js --check', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (e) { c2 = e.status || 1; s2 = String((e.stdout || '') + (e.stderr || '')); }
      provar('…e acusa um mapa com uma aresta a menos', c2 !== 0 && /diverge/.test(s2), { c2 });
    } finally {
      fs.writeFileSync(abs, copia);
    }
    let c3 = 0;
    try { execSync('node tools/gerar-relacoes.js --check', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { c3 = e.status || 1; }
    provar('…e o mapa reposto volta a passar', c3 === 0);
  }

  // ---------------------------------------------------------------------------------------------
  console.log('\nF. Um ciclo vazio DECLARA as lacunas — não inventa uma turma');
  {
    const vazio = mapaDoCiclo({ professor: PROF, ciclo: '01', variante: 'calango',
      pasta: path.join(RAIZ, 'professores', PROF, 'ciclos', 'ciclo-01-calango') });
    provar('sem plano, sem linha de base e sem PO, a turma NÃO é inventada',
      vazio.turma === null, vazio.turma);
    provar('…e a lacuna da turma é declarada, com o motivo',
      vazio.lacunas.some((l) => /a turma:/.test(l)), vazio.lacunas);
    provar('…e a da linha de base também',
      vazio.lacunas.some((l) => /a linha de base/.test(l)), vazio.lacunas);
    provar('…e mesmo vazio o mapa não mente: as arestas que existem continuam a existir',
      vazio.nos.length > 0 && vazio.arestas.every((e) => e.chave),
      { nos: vazio.nos.length, arestas: vazio.arestas.length });
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o mapa é derivado do disco e cada aresta nomeia'
    + ' o campo que a produziu; nenhum conteúdo entra nele; a ponte entre os dois vocabulários liga'
    + ' 4 de 4 e DESAPARECE quando um nome muda (com a lacuna declarada); a travessia do aspecto à'
    + ' aluna e o caminho inverso funcionam; o mapa é determinístico e o `--check` acusa-o quando'
    + ' está velho; e um ciclo vazio declara o que lhe falta em vez de inventar.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
