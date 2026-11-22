#!/usr/bin/env node
'use strict';

/**
 * provar-ordem-e-duplicacao.js — a decomposição pela ordem em que foi escrita, e a duplicação de
 * UMA linha (10/11/2026).
 *
 * POR QUE EXISTE. Duas queixas da pesquisadora sobre a etapa da decomposição, e as duas com a
 * mesma raiz — a ordem não estava em lado nenhum:
 *
 *   1. «A ordenação dos compassos (1º, 2º, 3º, 4º) deve seguir estritamente a ordem cronológica em
 *      que o professor os cria (ex: frente, ao lado, atrás, ao lado), e não ser reagrupada ou
 *      reordenada automaticamente com base na direção escolhida.»
 *   2. «Adicionar um seletor/campo para escolher especificamente quais linhas da decomposição devem
 *      ser duplicadas (evitando duplicar todas as linhas de uma vez quando houver várias, como 6
 *      linhas). Garantir que a linha duplicada seja posicionada sempre no final.»
 *
 * A CAUSA DA PRIMEIRA, medida: `celulas` é um MAPA com a direção por chave. Percorrer o mapa dá os
 * trechos agrupados por gaveta — e um mapa não guarda a ordem entre gavetas. Quem escrevesse
 * frente, ao lado, atrás, ao lado via frente, ao lado, ao lado, atrás, com os compassos renumerados
 * por cima. A correção declara a ordem NA CÉLULA (`ordem`), e a leitura passa a ser uma só — a
 * mesma no motor, na tabela, na prévia e no documento.
 *
 * A CAUSA DA SEGUNDA: havia um «Duplicar o exercício» que copiava o verbete inteiro. Com seis
 * trechos, repetir um custava seis cópias e cinco remoções.
 *
 * O QUE SE PROVA AQUI:
 *
 *   A. O MOTOR — `segmentosDe` devolve os trechos na ordem cronológica declarada, e o compasso
 *      acompanha (por pista, como sempre).
 *   B. A COMPATIBILIDADE — uma célula SEM `ordem` (o que já está gravado) mantém exactamente a
 *      ordem que o documento publicava até hoje. É a prova de que a correção não reescreve o
 *      passado (P-03/P-04).
 *   C. A TABELA DA PÁGINA — as linhas e a numeração saem na mesma ordem do motor, com os mesmos
 *      dados. Duas contas do mesmo fato divergiriam; esta asserção existe para que não possam.
 *   D. A DUPLICAÇÃO — o botão é o de CADA linha, a cópia é daquela linha só, e vai para o FIM.
 *      Duplicar duas vezes põe a segunda cópia depois da primeira.
 *   E. A CORRECÇÃO NÃO MUDA A POSIÇÃO — editar um trecho do meio não o manda para o fim.
 *   F. CONTROLE NEGATIVO — reposta a leitura antiga (percorrer as gavetas), a asserção A tem de
 *      FALHAR. Se passasse, a prova não mediria o que diz medir.
 *
 * SEM REDE: a página é servida de um `http.createServer` local, o KV é de mentira e o GitHub
 * responde 404 (bancada sem token).
 *
 *   node experimentos/provar-ordem-e-duplicacao.js
 *   CHROME_PATH=/usr/bin/chromium node experimentos/provar-ordem-e-duplicacao.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));
const { segmentosDe, ordemDasCelulas } = require(path.join(raiz, 'motor/nucleo/notacao.js'));

const provas = [];
let falhou = 0;
function provar(descricao, obtido, esperado) {
  const ok = typeof esperado === 'function'
    ? esperado(obtido)
    : JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhou++;
  provas.push({ ok, descricao, obtido, esperado: typeof esperado === 'function' ? esperado.descricao : esperado });
}

/** Uma célula mínima: a ordem é o que se está a medir, o resto é preenchimento válido. */
const cel = (contagem, ordem, extra) => Object.assign({
  contagem, categoria: 'pernas', sinais: ['X'], descricao: 'o que acontece',
}, ordem == null ? {} : { ordem }, extra || {});

/**
 * O VERBETE DA PROVA — a sequência que ela descreveu: frente, ao lado, atrás, ao lado.
 *
 * As quatro células têm de estar em gavetas diferentes nas pontas e na mesma no meio: é isso que
 * faz a leitura por gavetas errar. `devant` · `a-lado` · `derriere` · `a-lado` é literalmente o
 * exemplo dela.
 */
const CELULAS_CRONOLOGICAS = {
  devant: [cel('1', 1)],
  'a-lado': [cel('1', 2), cel('3', 4)],
  derriere: [cel('2', 3)],
};
const ORDEM_ESPERADA = ['devant:1', 'a-lado:1', 'derriere:2', 'a-lado:3'];

/** A MESMA sequência, sem `ordem` nenhuma — é o que está gravado nos verbetes de antes de hoje. */
const CELULAS_ANTIGAS = {
  devant: [cel('1')],
  'a-lado': [cel('1'), cel('3')],
  derriere: [cel('2')],
};
const ORDEM_ANTIGA = ['devant:1', 'a-lado:1', 'a-lado:3', 'derriere:2'];

const etiqueta = (s) => s.direcao + ':' + s.contagem;

// ---------------------------------------------------------------------------------------------
console.log('\nA. O MOTOR — a ordem cronológica, e o compasso atrás dela');

{
  const segs = segmentosDe({ celulas: CELULAS_CRONOLOGICAS }, 4);
  provar('a ordem é a em que foram escritos: frente, ao lado, atrás, ao lado',
    segs.map(etiqueta), ORDEM_ESPERADA);
  provar('…e o motor diz a ordem de cada segmento, para quem o copiar não a perder',
    segs.map((s) => s.ordem), [1, 2, 3, 4]);
  // O compasso continua a correr POR PISTA (a regra de 02/11/2026), e agora sobre a ordem certa.
  provar('o compasso corre por pista sobre a ordem cronológica',
    segs.map((s) => s.pista + '@' + s.compasso), ['pernas@1', 'pernas@1', 'pernas@1', 'pernas@1']);

  /* O COMPASSO QUE VIRA A PÁGINA — para o número não ser sempre 1. Com 4 tempos por compasso e
   * células de 2 tempos, cada compasso leva duas: 1, 1, 2, 2. E a sequência vai por gavetas
   * alternadas, que é o que a leitura antiga erraria. */
  const viram = {
    devant: [cel('1–2', 1)],
    'a-lado': [cel('1–2', 2), cel('1–2', 4)],
    derriere: [cel('1–2', 3)],
  };
  provar('com dois tempos por célula e quatro por compasso, os compassos são 1, 1, 2, 2',
    segmentosDe({ celulas: viram }, 4).map((s) => s.compasso), [1, 1, 2, 2]);
  provar('…e a ordem continua a ser a cronológica, e não a das gavetas',
    segmentosDe({ celulas: viram }, 4).map((s) => s.direcao),
    ['devant', 'a-lado', 'derriere', 'a-lado']);
}

// ---------------------------------------------------------------------------------------------
console.log('\nB. A COMPATIBILIDADE — o que já estava gravado não muda de ordem');

{
  const segs = segmentosDe({ celulas: CELULAS_ANTIGAS }, 4);
  provar('sem `ordem` declarada, a leitura é a de sempre (a das gavetas)', segs.map(etiqueta), ORDEM_ANTIGA);
  provar('…e a ordem devolvida é a posição antiga, não um número inventado',
    segs.map((s) => s.ordem), [0, 1, 2, 3]);

  /* O VERBETE MISTO — o caso que acontece a seguir a esta entrega: um verbete antigo que recebe um
   * trecho novo. O novo tem de ir para o FIM, e os antigos têm de ficar como estavam. */
  const misto = {
    devant: [cel('1'), cel('2', 4)],
    'a-lado': [cel('1')],
  };
  const m = segmentosDe({ celulas: misto }, 4);
  provar('num verbete antigo, o trecho novo entra no FIM', m.map(etiqueta),
    ['devant:1', 'a-lado:1', 'devant:2']);

  /* O DESEMPATE: uma célula antiga (ordem herdada 0) e uma nova com `ordem = 1` empatam. O que
   * manda é a leitura antiga, e a antiga vem primeiro — é a ordem que o documento já tinha. */
  const empate = { devant: [cel('1'), cel('2', 1)] };
  provar('no empate entre uma antiga e uma nova, a antiga fica à frente',
    segmentosDe({ celulas: empate }, 4).map((s) => s.contagem), ['1', '2']);
  provar('`ordemDasCelulas` devolve as quatro posições com a direção e o índice',
    ordemDasCelulas(CELULAS_CRONOLOGICAS).map((i) => i.direcao + ':' + i.indice),
    ['devant:0', 'a-lado:0', 'derriere:0', 'a-lado:1']);
}

// ---------------------------------------------------------------------------------------------
console.log('\nB2. A VALIDAÇÃO — a ordem, quando existe, é um inteiro positivo');

{
  const { validarVerbete } = require(path.join(raiz, 'motor/servidor/verbete.js'));
  const alfabeto = {
    sinais: [{ sinal: 'X' }], categorias: ['pernas'],
  };
  const montar = (celulas) => ({ celulas, cobre: 4 });
  /* O QUE SE MEDE É SÓ O QUE ESTA ENTREGA ACRESCENTA. O alfabeto daqui é um esqueleto — não tem a
   * gramática nem os sinais reais —, e ele produziria outros erros (a direção que não existe, o
   * sinal que não está no alfabeto). Filtrar os da ordem é o que separa a asserção do ruído do
   * fixtures; quem valida a notação inteira é a `provar-notacao`. */
  const daOrdem = (r) => r.erros.filter((e) => /ordem do trecho/.test(e));
  const comOrdem = validarVerbete(montar({ devant: [cel('1–4', 1)] }), alfabeto, [], '4|4/4');
  provar('uma ordem inteira não levanta erro de ordem', daOrdem(comOrdem), []);
  const comFracao = validarVerbete(montar({ devant: [cel('1–4', 2.5)] }), alfabeto, [], '4|4/4');
  provar('uma ordem fraccionária é recusada, e a frase diz o que usar',
    daOrdem(comFracao), (v) => v.length === 1 && /inteiro/.test(v[0]));
  const comZero = validarVerbete(montar({ devant: [cel('1–4', 0)] }), alfabeto, [], '4|4/4');
  provar('uma ordem zero é recusada', daOrdem(comZero).length, 1);
  const semOrdem = validarVerbete(montar({ devant: [cel('1–4')] }), alfabeto, [], '4|4/4');
  provar('sem ordem — o que está gravado até hoje — não levanta erro de ordem', daOrdem(semOrdem), []);
}

// ---------------------------------------------------------------------------------------------
console.log('\nF. CONTROLE NEGATIVO — a leitura antiga tem de reprovar o caso dela');

{
  // A leitura de antes: percorrer as gavetas, na ordem em que estão.
  const antiga = (celulas) => {
    const saida = [];
    for (const d of Object.keys(celulas)) for (const c of celulas[d] || []) saida.push(d + ':' + c.contagem);
    return saida;
  };
  provar('a leitura por gavetas dá a ordem ERRADA para frente/ao lado/atrás/ao lado',
    antiga(CELULAS_CRONOLOGICAS), (v) => JSON.stringify(v) !== JSON.stringify(ORDEM_ESPERADA));
  provar('…e dá a ordem CERTA para o verbete antigo (é por isso que ele não se mexe)',
    antiga(CELULAS_ANTIGAS), ORDEM_ANTIGA);
}

// =============================================================================================
// A PÁGINA — a partir daqui mede-se no navegador.
// =============================================================================================

const VERBETE = {
  ok: true, modalidade: 'bale-classico', versao: 3,
  exerciciosDoVocabulario: [
    { id: 'plie', termo: 'Plié', categoria: 'passo', tradicao: 'francesa', tradicaoRotulo: 'Francesa', descricao: 'Flexão dos joelhos.', fonte: 'd' },
  ],
  exercicios: [], verbetes: {},
  direcoes: [
    { termo: 'devant', nome: 'à frente' },
    { termo: 'a-lado', nome: 'ao lado' },
    { termo: 'derriere', nome: 'atrás' },
  ],
  sinais: [{ sinal: 'X', nome: 'pé', grupo: 'membros' }],
  posicoes: [], musicas: [], categorias: [],
};

function pagina() {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', ciclo: '01', query: 'professor=pe-torto&escola=calango&ciclo=01' },
    [{ nome: 'Petorto', slug: 'pe-torto' }], ['Ana'], 'Petorto', 'pe-torto',
    [{ id: 'tu1', nome: 'Balé Nível 1', frequencia: 2, dias: ['ter', 'qui'],
      horarios: { ter: '18:00', qui: '18:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-12-31' }],
    [], {}, [], [], []);
}

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    if (caminho.indexOf('/api/bastidores/verbete') !== -1) {
      return ok('application/json', JSON.stringify(VERBETE));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1',
    () => r({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** Lê as linhas da tabela como a pessoa as vê: compasso, contagem e direção, por ordem. */
const LER_TABELA = () => {
  const tabela = document.querySelector('#vb-tabela table');
  if (!tabela) return { linhas: [], temTabela: false };
  const linhas = Array.prototype.slice.call(tabela.querySelectorAll('tbody tr')).map((tr) => {
    const tds = tr.querySelectorAll('td');
    return {
      compasso: (tds[0] || {}).textContent || '',
      contagem: ((tds[1] || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      direcao: (tds[2] || {}).textContent || '',
      temDuplicar: Boolean(tr.querySelector('button[data-duplicar]')),
      temTirar: Boolean(tr.querySelector('button[data-tirar]')),
    };
  });
  return {
    temTabela: true,
    linhas,
    ordinal: linhas.map((l) => l.compasso + '|' + l.direcao + '|' + l.contagem),
    duplicarPorLinha: linhas.every((l) => l.temDuplicar),
    botaoGlobal: Boolean(document.getElementById('vb-cel-duplicar')),
  };
};

(async () => {
  const executavel = process.env.CHROME_PATH ||
    ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-ordem-e-duplicacao: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch (e) {
    console.error('provar-ordem-e-duplicacao: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const { srv, base } = await servir(pagina());
  const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const pg = await br.newPage();

  /** Abre a página e injeta um verbo com as células dadas — como se fosse um verbete carregado. */
  const abrir = async (celulas) => {
    await pg.goto(base + '/bastidores/estudio', { waitUntil: 'networkidle0' });
    await pg.evaluate((c) => {
      if (typeof abrirSessao === 'function') abrirSessao('token-de-prova');
      const cont = document.getElementById('conteudo'); if (cont) cont.hidden = false;
      location.hash = '#verbetes';
      const s = document.getElementById('sec-verbetes'); if (s) s.hidden = false;
      const nomes = document.getElementById('vbnome');
      nomes.value = 'Plié';
      CELULAS = JSON.parse(JSON.stringify(c));
      pintarTabela();
      pintarTira();
    }, celulas);
    await new Promise((r) => setTimeout(r, 250));
    return pg.evaluate(LER_TABELA);
  };

  await pg.setViewport({ width: 1400, height: 1000 });

  // -------------------------------------------------------------------------------------------
  console.log('\nC. A TABELA — a mesma ordem do motor, e o compasso a acompanhar');

  {
    const t = await abrir(CELULAS_CRONOLOGICAS);
    provar('a tabela mostra as quatro linhas', t.linhas.length, 4);
    provar('na ordem em que foram escritas: frente, ao lado, atrás, ao lado',
      t.linhas.map((l) => l.direcao), ['à frente', 'ao lado', 'atrás', 'ao lado']);
    provar('…e a contagem de cada uma acompanha a sua célula',
      t.linhas.map((l) => l.contagem), ['1', '1', '2', '3']);
    /* A NUMERAÇÃO. As quatro células da prova são de 1, 1, 2 e 3 tempos numa música de 4 — o que
     * interessa é que os compassos NÃO se renumerem por causa do reagrupamento. Com a ordem
     * cronológica, a sequência de compassos é monótona: nunca desce. */
    provar('os compassos nunca descem ao longo da tabela (a numeração segue a ordem)',
      t.linhas.map((l) => Number(l.compasso)), (v) => v.every((n, i) => i === 0 || n >= v[i - 1]));

    /* E A MESMA ORDEM QUE O MOTOR DÁ. Duas contas do mesmo fato — a da página e a do documento —
     * divergiriam à primeira; esta asserção é o que impede que a divergência seja silenciosa. */
    const doMotor = segmentosDe({ celulas: CELULAS_CRONOLOGICAS }, 4).map((s) => s.direcao);
    provar('a ordem da página é a MESMA do motor/do documento',
      t.linhas.length, doMotor.length);
    provar('…e as direções coincidem, uma a uma',
      t.linhas.map((l) => l.direcao),
      doMotor.map((d) => (d === 'devant' ? 'à frente' : d === 'a-lado' ? 'ao lado' : 'atrás')));
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nD. A DUPLICAÇÃO — uma linha de cada vez, e sempre no fim');

  {
    const t = await abrir(CELULAS_CRONOLOGICAS);
    provar('NÃO há botão que duplique o exercício inteiro', t.botaoGlobal, false);
    provar('cada linha tem o seu «Duplicar»', t.duplicarPorLinha, true);

    // Duplica a SEGUNDA linha (ao lado, contagem 1) — o caso dela: uma de seis, não as seis.
    await pg.evaluate(() => {
      const tr = document.querySelectorAll('#vb-tabela tbody tr')[1];
      tr.querySelector('button[data-duplicar]').click();
    });
    await new Promise((r) => setTimeout(r, 200));
    const depois = await pg.evaluate(LER_TABELA);
    provar('duplicar uma linha acrescenta UMA linha (não as seis)', depois.linhas.length, 5);
    provar('…e a cópia vai para o FIM da tabela',
      depois.linhas[4].direcao + '|' + depois.linhas[4].contagem,
      depois.linhas[1].direcao + '|' + depois.linhas[1].contagem);
    provar('…e as outras quatro ficam exactamente onde estavam',
      depois.linhas.slice(0, 4).map((l) => l.direcao + '|' + l.contagem),
      t.linhas.map((l) => l.direcao + '|' + l.contagem));

    // Duas duplicações seguidas: a segunda cópia fica DEPOIS da primeira.
    await pg.evaluate(() => {
      document.querySelectorAll('#vb-tabela tbody tr')[0].querySelector('button[data-duplicar]').click();
      document.querySelectorAll('#vb-tabela tbody tr')[0].querySelector('button[data-duplicar]').click();
    });
    await new Promise((r) => setTimeout(r, 250));
    const tres = await pg.evaluate(LER_TABELA);
    provar('duas duplicações seguidas dão duas cópias, as duas no fim', tres.linhas.length, 7);
    provar('…e a segunda cópia fica depois da primeira',
      tres.linhas.slice(5).map((l) => l.direcao), ['à frente', 'à frente']);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nE. A CORRECÇÃO NÃO MUDA A POSIÇÃO — e o trecho novo entra no fim');

  {
    await abrir(CELULAS_CRONOLOGICAS);
    // Abre a correcção do SEGUNDO trecho e grava-o outra vez.
    await pg.evaluate(() => {
      const tr = document.querySelectorAll('#vb-tabela tbody tr')[1];
      tr.querySelector('button[data-editar]').click();
    });
    await new Promise((r) => setTimeout(r, 250));
    await pg.evaluate(() => {
      const g = document.getElementById('vb-cel-guardar');
      if (g) g.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const t = await pg.evaluate(LER_TABELA);
    provar('corrigir um trecho do meio não o manda para o fim',
      t.linhas.map((l) => l.direcao), ['à frente', 'ao lado', 'atrás', 'ao lado']);

    /* O TRECHO NOVO entra no fim. Acrescenta-se por código — o botão do passo 5 exige sinais e
     * contagem escolhidos, e o que se está a medir aqui é o destino, não o formulário. */
    await pg.evaluate(() => {
      var ordem = proximaOrdem();
      CELULAS['devant'] = (CELULAS['devant'] || []).concat([
        { contagem: '4', categoria: 'pernas', sinais: ['X'], descricao: 'novo', ordem: ordem },
      ]);
      pintarTabela();
    });
    await new Promise((r) => setTimeout(r, 200));
    const comNovo = await pg.evaluate(LER_TABELA);
    provar('um trecho acrescentado depois vai para o FIM, mesmo sendo da primeira direção',
      comNovo.linhas[comNovo.linhas.length - 1].contagem, '4');
  }

  await br.close();
  srv.close();

  for (const p of provas) {
    process.stdout.write((p.ok ? 'ok     ' : 'FALHOU ') + p.descricao +
      (p.ok ? '' : '\n  obtido:   ' + JSON.stringify(p.obtido) +
        '\n  esperado: ' + JSON.stringify(p.esperado)) + '\n');
  }
  process.stdout.write('\nprovar-ordem-e-duplicacao: ' + (provas.length - falhou) + ' de ' +
    provas.length + ' passaram\n');
  process.exitCode = falhou === 0 ? 0 : 1;
})().catch((e) => { console.error(e); process.exit(1); });
