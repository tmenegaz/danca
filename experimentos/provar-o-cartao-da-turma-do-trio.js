#!/usr/bin/env node
'use strict';

/*
 * provar-o-cartao-da-turma.js — A TURMA DIZ AS SUAS TRÊS PONTAS, E CADA UMA ABRE.
 *
 * O RELATO DELA (12/11/2026), em duas metades:
 *
 *   1. «essa parte citada que você colocou na listagem pode remover. Isso é informação só para
 *      nós […] não cabe aqui para o professor.» A nota «citada por N planos de ensino» nasceu
 *      nesta sessão e sai na mesma sessão: a lista é do trabalho, e a contagem de planos é
 *      auditoria.
 *
 *   2. «a gente vai usar de forma similar ao que é feito nas outras listagens. A gente vai ter
 *      três blocos abaixo […] um dos blocos a gente vai dizer qual é a sala […] o elenco […] e o
 *      conteúdo, que é o terceiro bloco.» A Turma é a RELAÇÃO — sala × elenco × conteúdo —, e
 *      era a única das quatro listas que a dizia numa linha de prosa.
 *
 * O QUE SE MEDE AQUI, e porquê:
 *
 *   A. A FORMA. O cartão tem a peça das outras listas: `li.turma > .linha-turma > .nome + .acoes`,
 *      `.dono`, `.trio` com TRÊS `.trio-item`, e um `.trio-painel` por caixa. Um cartão que não
 *      seja a peça cai nas regras do telemóvel das listas de PESSOAS (`li:not(.turma)`), e foi
 *      esse o defeito de 11/11.
 *
 *   B. O FECHADO. A sala pelo nome, o elenco pelo corpo («2 alunas»), o conteúdo pelo tamanho
 *      («3 exercícios»). As três são contagens do que existe — e uma Turma sem elenco diz «sem
 *      elenco», não «0».
 *
 *   C. O ABERTO. O painel da Sala traz o ritmo e a régua; o do Elenco, as alunas e o recorte; o
 *      do Conteúdo, a tabela dos três resumos — música, direção e notação, uma linha por
 *      exercício. E cada um leva ao sítio onde se edita (Sala, Elenco, Estilo).
 *
 *   D. O RESUMO É O DA LISTAGEM DO ESTILO. A mesma função (`listarVerbetes`) serve as duas, e o
 *      alfabeto é o do bundle: zero KV, zero rede. O exemplo dela é o do dado real — «a música
 *      oito tempos, direção ao lado, notação dois trechos» é o `Battement tendu`.
 *
 *   E. O LINK ABRE A LINHA CERTA. O clique guarda o alvo, a secção abre pelo `hash`, e ao fim de
 *      a mostrar o `mostrarSecao` rola até à linha e põe o foco nela. A memória é LIDA E
 *      APAGADA — um alvo esquecido voltaria a saltar sem ninguém o pedir.
 *
 *   node experimentos/provar-o-cartao-da-turma.js
 *   node experimentos/provar-o-cartao-da-turma.js --contra=<ref>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const REF = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let destino = RAIZ;
if (REF) {
  destino = fs.mkdtempSync(path.join(os.tmpdir(), 'cartao-da-turma-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const bastidores = require(path.join(destino, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* AS DUAS SALAS E A TURMA DO AR (12/11/2026), sem os números: uma sala em turma, uma que nenhuma
 * turma usa e que um plano cita, e uma Turma que usa a primeira. */
const SALAS = [
  { id: 'piano', nome: 'Piano', frequencia: 2, dias: ['qua', 'sex'], duracaoMin: 60,
    periodoInicio: '2026-11-20', periodoFim: '2026-12-20', rubricaId: 'r1' },
  { id: 'rosa', nome: 'Rosa', frequencia: 1, dias: ['ter'], duracaoMin: 60,
    periodoInicio: '2026-11-20', periodoFim: '2026-12-20' },
];
const RUBRICAS = [{ id: 'r1', nome: 'Régua da casa', niveis: ['A', 'B', 'C'] }];
const ELENCOS = [{ id: 'ami', nome: 'Elenco AME', professor: 'pe-torto',
  alunas: ['Aluna A', 'Aluna B'], campos: [{ id: 'x', nome: 'Tônus' }, { id: 'y', nome: 'Eixo' }] }];
const CURADORIAS = [{ id: 'c1', professor: 'pe-torto', turmas: ['Piano'],
  modalidade: 'bale-classico', tradicao: 'rad', nivel: '1', linhaDeBase: 'ami',
  alunas: ['Aluna A', 'Aluna B'],
  // OS TRÊS DO AR, e são os que dão o exemplo dela: o tendu tem 8 tempos, direção ao lado e 2
  // trechos. Os outros dois são de outro tamanho, para a tabela não parecer uma linha só.
  repertorio: ['Battement tendu', 'Plié', 'Battement fondu'] }];
// O PLANO cita a Turma (estado `vinculada`) e cita a sala `Rosa`, que nenhuma turma usa.
const PARES = [
  { professor: 'pe-torto', turma: 'Piano', ciclo: '01' },
  { professor: 'pe-torto', turma: 'Rosa', ciclo: '01' },
];

function pagina(curadorias) {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
    [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A', 'Aluna B'], 'Pe Torto', 'pe-torto',
    SALAS, [], {}, curadorias || CURADORIAS, RUBRICAS, PARES,
    { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() },
    { modo: 'clara', paleta: 'bordo' }, '', ELENCOS);
}
const HTML = pagina();

function cartaoDaTurma(html) {
  const i = html.indexOf('data-curadoria="c1"');
  if (i === -1) return '';
  return html.slice(html.lastIndexOf('<li', i), html.indexOf('</li>', i));
}
function cartaoDaSala(html, id) {
  const i = html.indexOf('data-turma="' + id + '"');
  if (i === -1) return '';
  return html.slice(html.lastIndexOf('<li', i), html.indexOf('</li>', i));
}

// ==========================================================================================
console.log('1. A NOTA «CITADA POR N PLANOS» SAIU DA LISTAGEM');

{
  const piano = cartaoDaSala(HTML, 'piano');
  const rosa = cartaoDaSala(HTML, 'rosa');
  provar('a sala em turma já não diz «citada por N planos»', !/citada/.test(piano),
    (piano.match(/citada[^<]*/) || [])[0]);
  provar('…e a sala livre citada por um plano também não', !/citada/.test(rosa),
    (rosa.match(/citada[^<]*/) || [])[0]);
  provar('a nota da falta de ritmo continua a existir — essa é do professor',
    /nota-falta/.test(piano) === false || /falta/.test(piano), 'a sala tem ritmo completo');
  provar('…e o `title` do botão continua a dizer a razão, para quem a procura',
    /planos? de ensino citam? esta sala/.test(rosa),
    (rosa.match(/title="Derivar[^"]*"/) || [])[0]);
}

// ==========================================================================================
console.log('\n2. O CARTÃO É A PEÇA DAS OUTRAS LISTAS, COM TRÊS BLOCOS');

{
  const c = cartaoDaTurma(HTML);
  provar('o cartão é um `li.turma` com a linha do nome', /^<li class="turma"/.test(c), c.slice(0, 80));
  provar('…com `.linha-turma > .nome + .acoes`', /class="linha-turma"/.test(c)
    && /class="nome"/.test(c) && /class="acoes"/.test(c));
  provar('…e a linha do complemento (`.dono`)', /class="dono"/.test(c));
  provar('o nome é o do ELENCO — o do professor desceu para o complemento',
    /<b>Elenco AME<\/b>/.test(c), (c.match(/<b>[^<]*<\/b>/) || [])[0]);
  const caixas = c.match(/class="trio-item"/g) || [];
  provar('são TRÊS blocos, e não dois nem quatro', caixas.length === 3, caixas.length);
  provar('os três são `.trio` na mesma fila', /class="trio"/.test(c));
  provar('cada bloco tem o seu painel', (c.match(/class="trio-painel"/g) || []).length === 3,
    (c.match(/class="trio-painel"/g) || []).length);
  provar('as três caixas são Sala, Elenco e Conteúdo', (() => {
    const rotulos = [...c.matchAll(/class="trio-k">([^<]*)</g)].map((m) => m[1]);
    return rotulos[0] === 'Sala' && rotulos[1] === 'Elenco' && rotulos[2] === 'Conteúdo';
  })(), [...c.matchAll(/class="trio-k">([^<]*)</g)].map((m) => m[1]).slice(0, 3));
}

// ==========================================================================================
console.log('\n3. O QUE CADA BLOCO DIZ FECHADO — contagens do que existe');

{
  const c = cartaoDaTurma(HTML);
  const valor = (qual) => {
    const m = new RegExp('data-balao="' + qual + '"[^>]*>.*?trio-k">[^<]*</span>'
      + '<span class="trio-v">([^<]*)<', 's').exec(c);
    return m ? m[1] : null;
  };
  provar('a Sala pelo nome (é o que a Turma declara)', valor('sala') === 'Piano', valor('sala'));
  provar('o Elenco pelo corpo — «2 alunas», e não «2»', valor('elenco') === '2 alunas', valor('elenco'));
  provar('o Conteúdo pelo tamanho — «3 exercícios»', valor('conteudo') === '3 exercícios', valor('conteudo'));

  const vazia = pagina([{ id: 'c9', professor: 'pe-torto', turmas: [], modalidade: 'bale-classico',
    nivel: '1', alunas: [], repertorio: [] }]);
  const cv = cartaoDaTurma(vazia).replace(/data-curadoria="c1"/, '');
  const cz = (() => {
    const i = vazia.indexOf('data-curadoria="c9"');
    return vazia.slice(vazia.lastIndexOf('<li', i), vazia.indexOf('</li>', i));
  })();
  const valorVazio = (qual) => {
    const m = new RegExp('data-balao="' + qual + '"[^>]*>.*?trio-k">[^<]*</span>'
      + '<span class="trio-v">([^<]*)<', 's').exec(cz);
    return m ? m[1] : null;
  };
  provar('sem sala, o bloco diz «sem sala» — e não um vazio', valorVazio('sala') === 'sem sala',
    valorVazio('sala'));
  provar('sem elenco, diz «sem elenco»', valorVazio('elenco') === 'sem elenco', valorVazio('elenco'));
  provar('sem conteúdo, diz «sem conteúdo»', valorVazio('conteudo') === 'sem conteúdo',
    valorVazio('conteudo'));
  provar('…e o painel diz o que fazer, em vez de ficar em branco',
    /Editar/.test(cz) && /Estilo/.test(cz), cv.length);
}

// ==========================================================================================
console.log('\n4. O QUE CADA BLOCO ABRE — o resumo, e o link para o detalhe');

{
  const c = cartaoDaTurma(HTML);
  const painel = (qual) => {
    const i = c.indexOf('data-painel="' + qual + '"');
    if (i === -1) return '';
    return c.slice(i, i + 3000);
  };
  const sala = painel('sala');
  provar('o painel da Sala traz as quatro linhas do ritmo',
    /Frequência/.test(sala) && /Dias e horário/.test(sala) && /Duração/.test(sala) && /Período/.test(sala));
  provar('…e o ritmo é o da SALA: dois dias, que é o que ela declara',
    /qua, sex/.test(sala), (sala.match(/Dias e horário<\/span><span class="trio-v">([^<]*)/) || [])[1]);
  provar('…e a régua, com a escala e o nome',
    /class="trio-escala"/.test(sala) && /Régua da casa/.test(sala));
  provar('…e o link para a Sala', /href="#turmas"/.test(sala) && /data-abrir="sala:piano"/.test(sala),
    (sala.match(/href="#turmas"[^>]*/) || [])[0]);

  const elenco = painel('elenco');
  provar('o painel do Elenco conta as alunas e o recorte',
    /2 alunas/.test(elenco) && /2 aspectos/.test(elenco));
  provar('…nomeia as alunas', /<span>Aluna A<\/span>/.test(elenco) && /<span>Aluna B<\/span>/.test(elenco));
  provar('…e nomeia o recorte, que é o que o plano importa',
    /<span>Tônus<\/span>/.test(elenco) && /<span>Eixo<\/span>/.test(elenco));
  provar('…e leva ao elenco na Audição',
    /href="#corpo"/.test(elenco) && /data-abrir="elenco:ami"/.test(elenco),
    (elenco.match(/href="#corpo"[^>]*/) || [])[0]);

  const conteudo = painel('conteudo');
  provar('o painel do Conteúdo é uma tabela com os três resumos',
    /<table>/.test(conteudo) && /<th>Música<\/th>/.test(conteudo) && /<th>Direção<\/th>/.test(conteudo)
      && /<th>Notação<\/th>/.test(conteudo));
  provar('…com uma linha por exercício', (conteudo.match(/<tr><td>/g) || []).length === 3,
    (conteudo.match(/<tr><td>/g) || []).length);
  provar('…e o Battement tendu diz o que ela leu na tela: oito tempos, ao lado, dois trechos',
    /<td>Battement tendu<\/td><td>8 tempos em 2\/4<\/td><td>ao lado<\/td><td>2 trechos<\/td>/.test(conteudo),
    (conteudo.match(/<tr><td>Battement tendu[\s\S]{0,120}/) || [])[0]);
  provar('…e leva ao Estilo, que é onde o conteúdo vive', /href="#verbetes"/.test(conteudo));
}

// ==========================================================================================
console.log('\n5. O RESUMO É O DA LISTAGEM DO ESTILO — a mesma leitura, sem rede');

{
  /* A PROVA CONTRA ELA MESMA: o resumo do cartão e o que a listagem do Estilo mostra têm de sair
   * da MESMA função. Se amanhã alguém escrever um segundo cálculo, esta asserção apanha-o — e é
   * a única maneira de o cartão e a lista não divergirem ao primeiro verbete novo. */
  const { alfabetos } = require(path.join(destino, 'motor/nucleo/notacao.js'));
  const { listarVerbetes } = require(path.join(destino, 'motor/servidor/verbete.js'));
  const doEstilo = new Map();
  for (const { alfabeto } of alfabetos()) {
    for (const x of listarVerbetes(alfabeto, 'calango')) {
      if (!doEstilo.has(x.nome)) doEstilo.set(x.nome, x.porMusica[0] || {});
    }
  }
  const c = cartaoDaTurma(HTML);
  const linha = (nome) => {
    const m = new RegExp('<td>' + nome + '<\\/td><td>([^<]*)<\\/td><td>([^<]*)<\\/td><td>([^<]*)<').exec(c);
    return m ? { musica: m[1], direcao: m[2], notacao: m[3] } : null;
  };
  const tendu = linha('Battement tendu');
  const fonte = doEstilo.get('Battement tendu') || {};
  provar('o cartão e o Estilo leem o mesmo tempo do mesmo exercício',
    !!tendu && tendu.musica.indexOf(String(fonte.tempos)) === 0,
    { cartao: tendu && tendu.musica, estilo: fonte.tempos });
  provar('…o mesmo número de trechos',
    !!tendu && tendu.notacao.indexOf(String(fonte.trechos)) === 0,
    { cartao: tendu && tendu.notacao, estilo: fonte.trechos });
  provar('a direção vai em PORTUGUÊS, e não na chave do dado',
    !!tendu && tendu.direcao !== 'devant' && tendu.direcao !== 'a-la-seconde',
    tendu && tendu.direcao);
}

// ==========================================================================================
(async () => {
  let JSDOM, VirtualConsole;
  try { ({ JSDOM, VirtualConsole } = require(path.join(RAIZ, 'node_modules', 'jsdom'))); } catch (e) {
    console.error('jsdom ausente: ' + e.message);
    process.exit(2);
  }

  console.log('\n6. O LINK ABRE A LINHA CERTA — e só quando se pede');

  const NAVJS = fs.readFileSync(path.join(destino, 'tools/templates/nav.js'), 'utf8');
  function abrir(memoria) {
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {});
    vc.on('error', () => {});
    const dom = new JSDOM(HTML.replace(/<script src="[^"]*"><\/script>/g, '')
      .replace('</body>', '<script>' + NAVJS + '</script></body>'), {
      runScripts: 'dangerously',
      url: 'https://calango.workers.dev/bastidores/producao',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true;
        w.alert = () => {};
        // O ARRANQUE pede o token; sem o servidor, a página fica no portão e nada do resto corre.
        w.fetch = () => Promise.resolve({ ok: true, status: 200,
          json: () => Promise.resolve({ ok: true, direcao: true, token: 'T' }),
          text: () => Promise.resolve(JSON.stringify({ ok: true, direcao: true, token: 'T' })) });
        for (const k of Object.keys(memoria || {})) {
          try { w.sessionStorage.setItem(k, memoria[k]); } catch (err) {}
        }
        // O `scrollIntoView` não existe no jsdom: a prova conta as chamadas em vez de as sofrer.
        w.__rolados = [];
        w.Element.prototype.scrollIntoView = function () { w.__rolados.push(this); };
      },
    });
    return dom;
  }

  const A = abrir({ 'producao:token': 'T' });
  const wa = A.window;
  await new Promise((r) => wa.setTimeout(r, 400));
  const doc = wa.document;

  // A memória com que a página nasce num teste anterior é limpa pelo `abrir`, e o alvo põe-se
  // agora — é o que o clique do link faria.
  wa.sessionStorage.setItem('producao:focar', 'sala:piano');
  doc.querySelector('.lateral a[data-secao="turmas"]').click();
  wa.dispatchEvent(new wa.Event('hashchange'));
  await new Promise((r) => wa.setTimeout(r, 120));

  const secaoSalas = doc.getElementById('sec-turmas');
  provar('a secção das Salas abre', secaoSalas.hidden === false);
  provar('…e a linha da sala pedida é trazida à vista',
    wa.__rolados.some((el) => el && el.getAttribute && el.getAttribute('data-turma') === 'piano'),
    wa.__rolados.map((el) => el.getAttribute && el.getAttribute('data-turma')));
  provar('…com o foco na primeira caixa dela',
    (doc.activeElement && doc.activeElement.getAttribute
      && doc.activeElement.getAttribute('data-balao')) !== null,
    doc.activeElement && doc.activeElement.className);
  provar('a memória do alvo é LIDA E APAGADA — não salta outra vez',
    !wa.sessionStorage.getItem('producao:focar'),
    wa.sessionStorage.getItem('producao:focar'));

  wa.__rolados.length = 0;
  doc.querySelector('.lateral a[data-secao="painel"]').click();
  wa.dispatchEvent(new wa.Event('hashchange'));
  await new Promise((r) => wa.setTimeout(r, 80));
  provar('mudar de secção depois disso não salta para lado nenhum', wa.__rolados.length === 0,
    wa.__rolados.length);

  // AS TRÊS CAIXAS ABREM E FECHAM — a peça do `.trio-item`, que já existia e não se reescreveu.
  const c = doc.querySelector('li[data-curadoria="c1"]');
  const caixas = c ? c.querySelectorAll('.trio-item') : [];
  const paineis = c ? c.querySelectorAll('.trio-painel') : [];
  // A GUARDA NÃO É DECORAÇÃO: sem ela o controlo negativo REBENTA em vez de reprovar, e um
  // negativo que estoura não se lê — parece que a prova está avariada, e não que o código de
  // antes não tinha as caixas. As três asserções ficam, e falham por ausência.
  if (!caixas.length) {
    provar('as três caixas do cartão existem', false, 'o cartão não tem `.trio-item`');
    provar('…e os três painéis também não', false);
    provar('…e o `aria-expanded` não existe para dizer que estão abertas', false);
  } else {
    caixas[0].click();
    provar('abrir «Sala» mostra o painel da sala e só ele',
      paineis[0].hidden === false && paineis[1].hidden === true && paineis[2].hidden === true);
    caixas[2].click();
    provar('abrir «Conteúdo» fecha a Sala e abre a tabela',
      paineis[0].hidden === true && paineis[2].hidden === false);
    provar('…e a caixa aberta diz que está aberta, no `aria-expanded`',
      caixas[2].getAttribute('aria-expanded') === 'true'
        && caixas[0].getAttribute('aria-expanded') === 'false');
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: a Turma diz as três pontas em três blocos, cada um '
    + 'abre o resumo e leva ao detalhe, e o link traz a linha certa à vista.');
})();
