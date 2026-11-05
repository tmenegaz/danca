#!/usr/bin/env node
'use strict';

/**
 * provar-curadoria-e-limpeza.js — o menu que só promete o que existe, os rótulos iguais e o
 * formulário sem sermão.
 *
 * Três pedidos da pesquisadora na mesma volta (03/11/2026), e cada um mede-se de uma maneira
 * diferente:
 *
 *   1. A LISTA DE CONTEÚDOS DA CURADORIA é o vocabulário inteiro — 93 palavras — e só duas têm
 *      decomposição. «Ela deve crescer e refletir dinamicamente apenas os passos/verbetes que de
 *      fato possuem notação/conteúdo cadastrado.» Mede-se aqui: o menu oferece exactamente os
 *      exercícios que têm um verbete com música E trecho, derivado do alfabeto publicado — não um
 *      número escrito à mão. A §D é o CONTROLE NEGATIVO: um vocabulário de prova sem verbete
 *      nenhum tem de dar um menu vazio, senão a §A estaria a passar por acidente.
 *
 *   2. OS RÓTULOS DIVERGEM. «Professor, Modalidade, Tradição, Grau, Nível e Turma» usam
 *      `.campo-rotulo`; «Alunas» e «Conteúdos desta curadoria» eram `<label>` nu, e o navegador
 *      desenhava-os em linha, com outra cor e outro peso. Esta secção mede-se no CHROMIUM, com a
 *      folha de verdade: `getComputedStyle` dos seis contra os dois. Comparar classes no HTML
 *      provaria que o atributo está lá, não que se vê o mesmo.
 *
 *   3. O FORMULÁRIO NÃO EXPLICA. Saíram o «(nada escolhido ainda)», as legendas «— opcional; sem
 *      escolha, …», a instrução dos sinais, a frase do passo 4 e as notas de estado vazio da
 *      decomposição. O que NÃO sai: o feedback funcional — a contagem de tempos e compassos, o
 *      aviso de desacordo entre a música e a decomposição, a cobertura. A §E mede os dois lados:
 *      o que foi embora não voltou, e o que informa continua lá.
 *
 *   node experimentos/provar-curadoria-e-limpeza.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

let falhas = 0;
let total = 0;
function provar(nome, cond, extra) {
  total += 1;
  if (cond) { console.log('ok     ' + nome); return; }
  falhas += 1;
  console.log('FALHA  ' + nome + (extra === undefined ? '' : ' → ' + JSON.stringify(extra)));
}

const CONTEXTO = { escola: 'fita', professor: 'tiago-menegaz', ciclo: '01' };
const PROFS = [{ nome: 'Tiago Menegaz', slug: 'tiago-menegaz', principal: true }];
const ALUNAS = ['Vavá'];
const TURMAS = [{ id: 'tu1', nome: 'Balé nível 1', dias: ['seg', 'qua'], horarioInicio: '19:00',
  duracaoMin: 60, periodoInicio: '2027-02-01', periodoFim: '2027-06-30', frequencia: 2 }];

/* O VOCABULÁRIO DE PROVA — o caso da §A e o da §D, e a diferença entre os dois é a ÚNICA coisa
 * que muda: o nome dos termos. Um casa com o verbete do alfabeto («Plié», «Battement tendu»), o
 * outro não casa com nada. */
const TERMOS_COM_VERBETE = [
  { id: 'plie', termo: 'Plié', categoria: 'passo' },
  { id: 'battement-tendu', termo: 'Battement tendu', categoria: 'passo' },
  { id: 'jete', termo: 'Jeté', categoria: 'salto' },
];
const TERMOS_SEM_VERBETE = [
  { id: 'plie', termo: 'plié', categoria: 'passo' },
  { id: 'battement-tendu', termo: 'battement tendu', categoria: 'passo' },
  { id: 'jete', termo: 'jeté', categoria: 'salto' },
];

function pagina(termos) {
  return bastidores.paginaProducao('fita', CONTEXTO, PROFS, ALUNAS, 'Tiago Menegaz', 'tiago-menegaz',
    TURMAS, termos, {}, [], [], []);
}

/* OS EXERCÍCIOS QUE TÊM NOTAÇÃO NESTA ESCOLA, derivados do alfabeto publicado — a expectativa da
 * §A sai daqui, e não de um número. Um exercício conta quando tem uma música (`<tempos>|<compasso>`)
 * com pelo menos um trecho dentro **na vista da escola**.
 *
 * A VISTA DA ESCOLA ENTROU A 05/11/2026, e é a regra que a tela passou a seguir: o alfabeto guarda
 * o verbete do catálogo e o de cada escola (`8|2/4` e `8|2/4@breu`), e o verbete de OUTRA escola
 * não é oferecível — a composição também o recusa (`verbetePara` → `registosDaEscola`), e cairia
 * em lacuna. A expectativa usa a MESMA função que a produção usa: uma segunda regra escrita aqui
 * divergiria dela ao primeiro verbete de escola. */
function comNotacao(escola) {
  const alfabeto = JSON.parse(fs.readFileSync(
    path.join(raiz, 'biblioteca/modalidades/bale-classico/notacao.json'), 'utf8'));
  const { registosDaEscola } = require(path.join(raiz, 'motor/nucleo/notacao.js'));
  return Object.keys(alfabeto.verbetes || {}).filter((nome) => {
    if (nome.startsWith('_')) return false;
    const musicas = registosDaEscola(alfabeto.verbetes[nome] || {}, escola);
    return Object.keys(musicas).filter((k) => /^\d+\|/.test(k)).some((k) => {
      const celulas = (musicas[k] && musicas[k].celulas) || {};
      return Object.keys(celulas).some((d) => (celulas[d] || []).length > 0);
    });
  }).sort();
}

/** A LISTA DA PÁGINA DO VERBETE — a outra metade da mesma pergunta (05/11/2026). */
function listaDeVerbetes(escola) {
  const alfabeto = JSON.parse(fs.readFileSync(
    path.join(raiz, 'biblioteca/modalidades/bale-classico/notacao.json'), 'utf8'));
  const { listarVerbetes } = require(path.join(raiz, 'motor/servidor/verbete.js'));
  return listarVerbetes(alfabeto, escola).map((x) => x.nome).sort();
}

const opcoesDe = (html, id) => {
  const bloco = (html.match(new RegExp('id="' + id + '"[\\s\\S]*?</select>')) || [''])[0];
  return [...bloco.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)/g)]
    .filter((m) => m[1])
    .map((m) => ({ valor: m[1], rotulo: m[2] }));
};

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
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () =>
    pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

(async () => {
  // ===================================================================================
  // A. O MENU DA CURADORIA — só o que tem notação
  // ===================================================================================
  console.log('\nA. A LISTA DE CONTEÚDOS — o que já se pode ENSINAR, e não o dicionário inteiro');
  const html = pagina(TERMOS_COM_VERBETE);
  const esperado = comNotacao('fita');
  const conteudos = opcoesDe(html, 'esc-conteudos');
  const alunas = opcoesDe(html, 'esc-alunas');

  provar('o alfabeto tem exercícios com notação (sem isto a prova não mediria nada)',
    esperado.length > 0, esperado);
  provar('o menu oferece exactamente esses — nem um a mais, nem um a menos',
    JSON.stringify(conteudos.map((o) => o.valor).sort()) === JSON.stringify(esperado),
    { menu: conteudos.map((o) => o.valor), alfabeto: esperado });
  /* A DIVERGÊNCIA QUE ISTO FECHA (05/11/2026). A Curadoria oferecia «Battement tendu» e a lista de
   * Verbetes da MESMA escola não o mostrava — o verbete existe no alfabeto, mas só na versão da
   * `breu` (`8|2/4@breu`). Duas listas da mesma pergunta, e a que prometia era a que mentia. */
  provar('a lista do verbete e o menu da curadoria são a MESMA lista, para a mesma escola',
    JSON.stringify(conteudos.map((o) => o.valor).sort()) === JSON.stringify(listaDeVerbetes('fita')),
    { menu: conteudos.map((o) => o.valor), verbetes: listaDeVerbetes('fita') });
  provar('…e o exercício que só a outra escola declarou não é oferecido a esta',
    !conteudos.some((o) => o.valor === 'Battement tendu'),
    { menu: conteudos.map((o) => o.valor), verbetes: listaDeVerbetes('fita') });
  provar('…mas na escola que o declarou ele aparece nas duas listas',
    comNotacao('breu').indexOf('Battement tendu') !== -1
      && listaDeVerbetes('breu').indexOf('Battement tendu') !== -1,
    { breu: listaDeVerbetes('breu') });
  provar('…e o vocabulário da prova tem MAIS termos do que o menu mostra (a lista filtra)',
    conteudos.length < TERMOS_COM_VERBETE.length, { menu: conteudos.length, termos: TERMOS_COM_VERBETE.length });
  provar('…o «Jeté», que é termo e não tem verbete, não é oferecido',
    !conteudos.some((o) => o.valor === 'Jeté'), conteudos.map((o) => o.valor));

  // O MESMO PADRÃO DAS ALUNAS: os dois escolhedores são a mesma peça, com o menu, o «Adicionar»
  // e a ficha. O que muda é a lista, não o comportamento.
  const formaDe = (id) => {
    const bloco = (html.match(new RegExp('id="' + id + '"[\\s\\S]*?</div></div>')) || [''])[0];
    return {
      escolhidos: /class="escolhidos"/.test(bloco),
      menu: /<select class="opcoes">/.test(bloco),
      adicionar: /class="adicionar acao pequena">Adicionar</.test(bloco),
    };
  };
  /* A ASSERÇÃO FOI INVERTIDA, E NÃO APAGADA (05/11/2026). Ela media que o escolhedor dos
   * conteúdos era a MESMA peça do das alunas. A pesquisadora tirou o campo das alunas da
   * curadoria — «ele vai ser embutido dentro da turma por meio da linha de base» —, e a pergunta
   * mudou de sujeito: agora mede-se que o dos conteúdos continua a ser a peça da casa, e que o
   * das alunas JÁ NÃO EXISTE aqui. Sem esta inversão, a prova exigiria de volta o campo que ela
   * mandou remover. */
  provar('o escolhedor dos conteúdos continua a ser a peça da casa (menu, «Adicionar», fichas)',
    JSON.stringify(formaDe('esc-conteudos')) ===
      JSON.stringify({ escolhidos: true, menu: true, adicionar: true }), formaDe('esc-conteudos'));
  provar('…e o escolhedor de ALUNAS saiu da curadoria — o elenco vem da linha de base',
    formaDe('esc-alunas').escolhidos === false && formaDe('esc-alunas').menu === false,
    formaDe('esc-alunas'));

  // ===================================================================================
  // B. OS RÓTULOS — os sete com a MESMA pele (medido no browser)
  // ===================================================================================
  console.log('\nB. OS RÓTULOS — «Conteúdos» veste o que os outros seis já vestiam');
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  let puppeteer = null;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch { puppeteer = null; }

  if (!executavel || !puppeteer) {
    provar('Chrome/Chromium disponível para medir a pele dos rótulos', false,
      'sem browser a §B NÃO FOI MEDIDA — e uma secção não medida não passa');
  } else {
    const { srv, base } = await servir(html);
    const br = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const pg = await br.newPage();
    await pg.goto(base + '/bastidores/producao', { waitUntil: 'load' });
    const pele = await pg.evaluate(() => {
      const alvos = {
        professor: 'label[for="cuprofessor"]',
        modalidade: 'label[for="cumodalidade"]',
        tradicao: 'label[for="cutradicao"]',
        grau: 'label[for="cugrau"]',
        nivel: 'label[for="cunivel"]',
        turma: 'label[for="cuturma"]',
        /* O `<label>` que antecede cada escolhedor. O das ALUNAS saiu com o campo (05/11/2026);
         * ficam os conteúdos, que é o único escolhedor do formulário — e o rótulo dele tem de
         * vestir o que os outros seis vestem. */
        conteudos: '#esc-conteudos',
      };
      const saida = {};
      for (const [nome, sel] of Object.entries(alvos)) {
        const el = sel.indexOf('#') === 0
          ? document.querySelector(sel).previousElementSibling
          : document.querySelector(sel);
        if (!el) { saida[nome] = null; continue; }
        const s = getComputedStyle(el);
        saida[nome] = {
          tag: el.tagName.toLowerCase(),
          classe: el.className,
          display: s.display,
          peso: s.fontWeight,
          tamanho: s.fontSize,
          cor: s.color,
          margemCima: s.marginTop,
          margemBaixo: s.marginBottom,
        };
      }
      return saida;
    });
    await br.close();
    srv.close();

    const seis = ['professor', 'modalidade', 'tradicao', 'grau', 'nivel', 'turma'];
    const peleDe = (n) => JSON.stringify({
      display: pele[n] && pele[n].display, peso: pele[n] && pele[n].peso,
      tamanho: pele[n] && pele[n].tamanho, cor: pele[n] && pele[n].cor,
      margemCima: pele[n] && pele[n].margemCima, margemBaixo: pele[n] && pele[n].margemBaixo,
    });
    const referencia = peleDe('professor');
    provar('os seis rótulos de sempre têm todos a mesma pele',
      seis.every((n) => peleDe(n) === referencia), seis.map((n) => [n, peleDe(n)]));
    /* «ALUNAS» SAIU DA LISTA (05/11/2026), e não por a asserção ter falhado: o campo deixou de
     * existir na curadoria. O que fica é a regra — todo o rótulo que existe veste o mesmo —, e ela
     * continua a ser medida no único escolhedor que sobrou. */
    provar('«Conteúdos desta curadoria» veste o mesmo que os seis',
      peleDe('conteudos') === referencia, { conteudos: pele.conteudos, professor: pele.professor });
    provar('…e são todos do tipo `label` — a peça é a mesma, não um `span` a imitá-la',
      Object.values(pele).every((p) => p && p.tag === 'label'), Object.values(pele).map((p) => p && p.tag));
  }

  // ===================================================================================
  // C. O FORMULÁRIO NÃO EXPLICA — o que saiu, e não volta
  // ===================================================================================
  console.log('\nC. O QUE SAIU — nenhuma instrução, nenhum estado vazio explicado por palavras');
  const script = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).join('\n');

  provar('sem «(nada escolhido ainda)» na página', !/nada escolhido/i.test(html));
  provar('…nem no script (o `mostrarVazio` saiu com a peça que ele mostrava)',
    !/mostrarVazio/.test(script) && !/escolhidos \.vazio/.test(html));
  provar('sem legendas «— opcional; sem escolha, …»',
    !/opcional; sem escolha/.test(html));
  provar('…e a instrução de clique nos sinais também saiu',
    !/clique para acrescentar ao fim/.test(html));
  provar('sem a frase «A posição de cada trecho escreve-se nos sinais dele»',
    !/A posição de cada trecho/.test(html));
  provar('sem «Escolha a categoria e os sinais.»',
    !/Escolha a categoria e os sinais/.test(html) && !/Escolha a categoria e os sinais/.test(script));
  provar('sem «Escolha o exercício para ver e escrever a decomposição dele.»',
    !/Escolha o exercício para ver e escrever/.test(script));
  provar('sem «Ainda sem trechos. Escreva o primeiro…»', !/Ainda sem trechos/.test(script));
  provar('sem «Ainda não há nenhum trecho…» no rodapé', !/Ainda não há nenhum trecho/.test(script));
  provar('sem opções que rotulem a ausência de escolha («— sem grau —», «não usa grau»…)',
    !/sem grau|não usa grau|ainda não tem tradições/.test(html.replace(/<!--[\s\S]*?-->/g, '')));

  // ===================================================================================
  // D. O CONTROLE NEGATIVO — sem verbete nenhum, o menu fica VAZIO
  // ===================================================================================
  console.log('\nD. O CONTROLE NEGATIVO — um vocabulário sem verbete não enche o menu');
  const vazio = pagina(TERMOS_SEM_VERBETE);
  const conteudosVazios = opcoesDe(vazio, 'esc-conteudos');
  provar('sem nenhum termo com verbete, o menu de conteúdos fica vazio',
    conteudosVazios.length === 0, conteudosVazios.map((o) => o.valor));
  /* O CONTROLE POSITIVO MUDOU DE SUJEITO (05/11/2026). Ele media «as alunas continuam a ser
   * oferecidas» — e já não há escolhedor de alunas na curadoria. O que continua a valer é a
   * REGRA que a asserção guardava: o filtro é dos conteúdos e só deles. Mede-se no escolhedor
   * que ficou: com o vocabulário sem verbete, o menu fica vazio e nada mais é afectado. */
  provar('…e o formulário continua inteiro (o fim do filtro é o menu de conteúdos)',
    /id="esc-conteudos"/.test(vazio) && /id="cuturma"/.test(vazio), 'formulário da curadoria');

  // ===================================================================================
  // E. O QUE NÃO SAI — o feedback que informa
  // ===================================================================================
  console.log('\nE. O QUE NÃO SAI — a informação que o professor lê continua lá');
  const vivos = [
    ['a contagem de tempos e compassos, abaixo da música', 'vb-musica-nota'],
    ['o aviso de desacordo entre a música e a decomposição', 'vb-musica-desacordo'],
    ['a cobertura da decomposição', 'vb-cobertura'],
    ['o estado da associação da turma («Hoje: …»)', 'vinc-estado'],
    ['o modo de edição do verbete', 'vb-edicao'],
    ['a nota do método herdado', 'vb-metodo-nota'],
    ['a nota da frase do dicionário', 'vb-frase-nota'],
    ['a nota das habilitações da curadoria', 'cu-habilitacao-nota'],
    ['a nota das tradições da modalidade', 'cu-tradicao-nota'],
  ];
  const emFalta = vivos.filter(([, id]) => !html.includes('id="' + id + '"')).map(([nome]) => nome);
  provar('os nove blocos de feedback funcional continuam na página', emFalta.length === 0, emFalta);
  provar('…e a nota que repete a substituição da música continua escrita',
    /Gravar substitui a música de /.test(script));

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — a lista promete só o que existe, os sete rótulos vestem o mesmo, e o formulário '
      + 'ficou com rótulos e feedback, sem instruções.'
    : 'FALHARAM ' + falhas + ' de ' + total + ' asserções.'));
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
