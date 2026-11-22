#!/usr/bin/env node
'use strict';

/**
 * provar-a-dobra-e-a-aula-anterior.js — a aula que lê a aula anterior, e cada secção que abre e fecha.
 *
 * O QUE ELA PEDIU (22/11/2026), em duas metades que se provam de maneiras diferentes:
 *
 *  1. «Aí tem uma coluna a adicionar [n]esses espaços […] uma outra coluna que pode ser o nome de
 *     resultado obtido na aula anterior […] Ainda não tem essa coluna porque ainda não foi dada
 *     nenhuma aula […] Só vai ter a partir da aula dois.» E, sobre o que veio do formulário: «a
 *     gente vai mostrar em percentual […] o ânimo da aula, o interesse da aula e a harmonia da
 *     aula […] se a aula foi dada no dia certo […] se aconteceu na sala correta […] o plano foi
 *     seguido? […] se algo surpreendeu […] o que que aconteceu de novo.»
 *  2. «todos, todos eles, todos eles tem que ter isso de colapsar e expandir.»
 *
 * PORQUE ESTA PROVA TEM DUAS METADES. A coluna e o §3.1 são TEXTO DERIVADO: medem-se no markdown
 * que o derivador escreve, com um lançamento de fixture como entrada — sem browser e sem rede. A
 * dobra é COMPORTAMENTO no documento publicado: mede-se no navegador, na página que o pacote
 * realmente serve, com o `nav.js` e o `ciclo.css` da folha. Medir as duas no mesmo sítio seria
 * medir uma delas no lugar errado.
 *
 * O QUE A FIXTURE DIZ, e é o caso que ela descreveu: a Aula 01 foi dada no dia dela, com as duas
 * alunas, ânimo 5 · interesse 4 · harmonia 3, o plano seguido «em parte» com a justificativa
 * escrita, algo surpreendeu, e a aluna A ficou «Satisfatório» na 1ª posição dos pés enquanto a
 * aluna B ficou «Razoável». A Aula 02 tem de mostrar tudo isso — em percentagem e em frase
 * agregada, nunca em duas colunas de alunas.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai `motor/ tools/ …` desse commit e mede o MESMO, com a
 * MESMA fixture. Antes desta mudança não há §3.1, não há terceira coluna, não há dobra nenhuma —
 * e é isso que o controle tem de reproduzir.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-a-dobra-e-a-aula-anterior.js
 *   node experimentos/provar-a-dobra-e-a-aula-anterior.js --contra=49fb6f87
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const PACOTE = path.join(raiz, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');

/** O envelope mais recente de um tipo, lido do REPÓSITORIO (é fixture, não é código). */
function envelope(prefixo) {
  const pasta = path.join(raiz, 'escola/breu/envelopes');
  const nome = fs.readdirSync(pasta)
    .filter((n) => n.startsWith(prefixo + '-') && n.endsWith('.json')).sort().pop();
  return JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'));
}

/* A FIXTURE DO LANÇAMENTO — o que o formulário grava (ver `coletarCaptura` no `lancamento.html`):
 * `aulas[NN]` com a data, as presentes, a duração, as condições de contorno, o relatório, e as
 * marcas por bloco. As chaves dos blocos são as que `declaracaoDeCaptura` declara. */
const LANCAMENTO_DA_AULA_01 = {
  aulas: {
    '01': {
      data: '2026-12-14',
      presentes: ['aluna-a', 'aluna-b'],
      ausentes: [],
      duracao_min: 120,
      condicoes_contorno: {
        plano_seguido: 'parcial',
        animo: 5,
        interesse: 4,
        harmonia: 3,
        mudou: 'o centro encurtou porque a sala estava ocupada',
      },
      relatorio: {
        texto: 'a aluna B pediu para repetir a barra devagar',
        surpresas: 'sim',
        ajustes: 'o centro encurtou porque a sala estava ocupada',
      },
      linha_de_base: {
        'aluna-a': [{ chave: '1_posicao_dos_pes', item: '1ª posição dos pés', marca: 'Satisfatório' }],
        'aluna-b': [{ chave: '1_posicao_dos_pes', item: '1ª posição dos pés', marca: 'Razoável' }],
      },
      solo: {
        'aluna-a': { reconhecer_o_apoio_e_alinhar_o_eixo_vertical: 'Satisfatório' },
        'aluna-b': { reconhecer_o_apoio_e_alinhar_o_eixo_vertical: 'Em desenvovimento' },
      },
    },
  },
};

const LINHA_DE_BASE = {
  id: 'tami',
  nome: 'Tami',
  recorte: [{ id: 'a1', nome: '1ª posição dos pés' }, { id: 'a2', nome: '1ª posição dos braços' }],
  mostra: [
    { id: 'a1', texto: '1 de 2 em «Bom» (com toque)' },
    { id: 'a2', texto: '2 de 2 em «Bom»' },
  ],
};

const CALENDARIO = { inicio: '14/12/2026', dias: '1@10:30,3@10:30,5@10:30', total: 15 };
const CALIBRACAO = { duracaoMinutos: 120, volumeMin: 150, volumeMax: 200 };

/** A aula N derivada pelo código do commit pedido. `lancamentos` é a única entrada que varia. */
function derivar(raizDoCodigo, nn, lancamentos) {
  const { derivarAula } = require(path.join(raizDoCodigo, 'motor/nucleo/derivar-ciclo.js'));
  return derivarAula({
    nn,
    plano: envelope('plano'),
    po: envelope('po'),
    contexto: {
      aulas: ['aula-01', 'aula-02'],
      professorNome: 'Demi Plié',
      calendario: CALENDARIO,
      lancamentos,
    },
    calibracao: CALIBRACAO,
    linhaDeBase: LINHA_DE_BASE,
    anamneses: {},
  });
}

/** O corpo de uma secção `## N.` do markdown, até à secção seguinte. */
function secao(md, titulo) {
  const i = md.indexOf('## ' + titulo);
  if (i === -1) return '';
  const j = md.indexOf('\n## ', i + 3);
  return md.slice(i, j === -1 ? md.length : j);
}

/** As linhas de uma tabela markdown do tipo `| x | y |` → arrays de células. */
function linhasDaTabela(texto) {
  return texto.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && !/^\|[\s:|-]+\|$/.test(l))
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
}

function servir(pacote, templates) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const responder = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return responder('text/css; charset=utf-8',
        fs.readFileSync(path.join(templates, 'ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return responder('text/javascript', fs.readFileSync(path.join(templates, 'nav.js')));
    }
    const arquivo = path.join(pacote, caminho.replace(/^\/+/, '') || 'index.html');
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isFile()) {
      return responder('text/html; charset=utf-8', fs.readFileSync(arquivo));
    }
    return responder('text/html; charset=utf-8', fs.readFileSync(path.join(pacote, 'index.html')));
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

(async () => {
  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let raizDoCodigo = raiz;
  let templates = path.join(raiz, 'tools/templates');
  let temporario = null;
  if (contra) {
    temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'dobra-'));
    /* `biblioteca` e `modelo` também vêm: o derivador lê a notação do verbete, e sem elas o
     * `require` estoura antes de medir nada (a lição de sempre nos controles negativos). */
    execSync('git archive ' + contra + ' motor tools biblioteca modelo | tar -x -C ' + temporario,
      { cwd: raiz, stdio: 'pipe' });
    raizDoCodigo = temporario;
    templates = path.join(temporario, 'tools/templates');
  }

  let total = 0;
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    total += 1;
    if (!cond) falhas += 1;
    console.log((cond ? '  ok    ' : '  FALHA ') + nome
      + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 240) : ''));
  };

  /* ─────────────────────────── a) A AULA 02 LÊ A AULA 01 ─────────────────────────── */
  console.log('\na) o que a aula anterior mostrou');
  const aula01 = derivar(raizDoCodigo, '01', LANCAMENTO_DA_AULA_01);
  const aula02 = derivar(raizDoCodigo, '02', LANCAMENTO_DA_AULA_01);
  const aula02Sem = derivar(raizDoCodigo, '02', { aulas: {} });

  provar('a Aula 01 NÃO tem o bloco «3.1» (não há aula anterior)',
    secao(aula01, '3.1 ').length === 0);
  provar('a Aula 01 NÃO tem a coluna «Resultado na Aula»',
    aula01.indexOf('Resultado na Aula') === -1);
  provar('a Aula 02 tem o bloco «3.1 O que a aula anterior mostrou»',
    secao(aula02, '3.1 O que a aula anterior mostrou').length > 0);

  const bloco = secao(aula02, '3.1 O que a aula anterior mostrou');
  /* O RÓTULO VAI ESCAPADO: «O plano foi seguido?» tem um `?`, e num `RegExp` ele é um
   * quantificador — a asserção falhava por causa do nome da linha, não do conteúdo dela. */
  const cidade = (rotulo) => {
    const seguro = rotulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp('^- \\*\\*' + seguro + '\\*\\* — (.*)$', 'm').exec(bloco);
    return m ? m[1].trim() : '';
  };
  provar('a PRESENÇA sai em percentagem, e não em número de alunas',
    /^100% \(2 de 2/.test(cidade('Presença')), cidade('Presença'));
  provar('o ânimo, o interesse e a harmonia estão lá, e na escala 1–5',
    cidade('A turma no dia') === 'ânimo 5/5 · interesse 4/5 · harmonia 3/5', cidade('A turma no dia'));
  provar('a data e a duração conferem contra a Aula 01 (a aula foi no dia dela)',
    /^OK: segunda-feira, 14\/12\/2026, 120 min\.$/.test(cidade('Data e duração')),
    cidade('Data e duração'));
  provar('a SALA diz o que sabe e nomeia o campo que o formulário não pergunta',
    /programada era «Rosa»/.test(cidade('Sala')) && /não pergunta/.test(cidade('Sala')),
    cidade('Sala'));
  provar('o plano seguido sai por extenso, com a justificativa de quando não foi «sim»',
    cidade('O plano foi seguido?') === 'em parte: «o centro encurtou porque a sala estava ocupada»',
    cidade('O plano foi seguido?'));
  provar('algo surpreendeu sai como marca, e não como prosa',
    cidade('Algo surpreendeu?') === 'sim', cidade('Algo surpreendeu?'));
  provar('o que aconteceu de novo sai entre aspas, como texto dele',
    cidade('O que aconteceu de novo') === '«a aluna B pediu para repetir a barra devagar»',
    cidade('O que aconteceu de novo'));

  /* O bloco tem de vir DEPOIS da distribuição do tempo — foi assim que ela o situou. */
  provar('o «3.1» vem depois da §3 e antes da §4',
    aula02.indexOf('## 3. Distribuição do tempo') < aula02.indexOf('## 3.1 ')
    && aula02.indexOf('## 3.1 ') < aula02.indexOf('## 4. Bloco de musicalidade'));

  /* ────────────────────── b) A COLUNA «RESULTADO NA AULA 01» ────────────────────── */
  console.log('\nb) a coluna do resultado anterior');
  provar('a Aula 02 tem a coluna, com o número da aula anterior no cabeçalho',
    aula02.indexOf('| Resultado na Aula 01 |') !== -1);
  const tabelaDoCorpo = linhasDaTabela(secao(aula02, '5. Guia de observação do professor')
    .slice(secao(aula02, '5. Guia de observação do professor').indexOf('### Corpo')));
  provar('as tabelas do §5 passam a ter TRÊS colunas',
    tabelaDoCorpo.length > 0 && tabelaDoCorpo[0].length === 3, tabelaDoCorpo[0]);
  const linhaDosPes = tabelaDoCorpo.find((l) => l[0] === '1ª posição dos pés') || [];
  provar('o resultado da anamnese na Aula 01 é AGREGADO, com o nível e o total',
    linhaDosPes[2] === '1 de 2 em «Satisfatório» · 1 de 2 em «Razoável»', linhaDosPes[2]);
  provar('a ordem dos níveis é a da régua da turma (Satisfatório antes de Razoável)',
    (linhaDosPes[2] || '').indexOf('Satisfatório') < (linhaDosPes[2] || '').indexOf('Razoável'));
  const linhaDaBarra = tabelaDoCorpo.find((l) => l[0] === '1ª posição dos braços') || [];
  provar('o critério que ninguém marcou diz «não marcado», e não fica em branco',
    linhaDaBarra[2] === 'não marcado na Aula 01', linhaDaBarra[2]);

  const tabelaDaTecnica = linhasDaTabela(secao(aula02, '5. Guia de observação do professor')
    .slice(secao(aula02, '5. Guia de observação do professor').indexOf('### Técnica')));
  const apoio = tabelaDaTecnica.find((l) => l[2] && l[2].indexOf('Satisfatório') !== -1) || [];
  provar('o critério de um BLOCO de dimensão (Solo) também encontra a marca da aula anterior',
    /^1 de 2 em «Satisfatório» · 1 de 2 em «Em desenvovimento»$/.test(apoio[2] || ''), apoio[2]);

  provar('sem lançamento nenhum, a Aula 02 NÃO inventa a coluna',
    aula02Sem.indexOf('Resultado na Aula') === -1);
  provar('sem lançamento, o «3.1» diz que a aula anterior não foi lançada',
    /ainda não foi lançada/.test(secao(aula02Sem, '3.1 O que a aula anterior mostrou')),
    secao(aula02Sem, '3.1 O que a aula anterior mostrou').split('\n').filter(Boolean).pop());

  /* ─────────────────────────── c) O §1 E O §5, CORRIGIDOS ─────────────────────────── */
  console.log('\nc) o §1 sem a linha repetida, o §5 com um botão só');
  const s1 = secao(aula02, '1. Validação');
  provar('o §1 já não repete o objetivo específico',
    s1.indexOf('**Objetivo específico**') === -1);
  provar('o §1 continua a dizer quem dá a aula, onde e em que dia',
    /\*\*Professor responsável\*\*/.test(s1) && /\*\*Sala\*\*/.test(s1) && /\*\*Data e dia\*\*/.test(s1));
  const s5 = secao(aula02, '5. Guia de observação do professor');
  provar('o botão «Como preencher o formulário» saiu',
    s5.indexOf('Como preencher o formulário') === -1);
  provar('o botão que leva ao formulário ficou, e é um só',
    (s5.match(/class="acao[^"]*" href="lancamento\.html"/g) || []).length === 1,
    (s5.match(/class="acao[^"]*"/g) || []));
  provar('a explicação bloco a bloco continua lá, dentro de um bloco que abre',
    s5.indexOf('<details class="bloco-lista" id="guia-do-formulario">') !== -1);

  /* ───────────────────────────── d) A DOBRA DE CADA SECÇÃO ───────────────────────────── */
  console.log('\nd) a dobra de cada secção (no navegador)');
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  let puppeteer = null;
  if (executavel) {
    try {
      const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
      puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
    } catch { puppeteer = null; }
  }
  if (!puppeteer) {
    total += 1;
    falhas += 1;
    console.log('  FALHA a dobra não foi medida: Chrome/Chromium ou puppeteer-core ausente — NÃO FEITO.');
  } else {
    const { srv, base } = await servir(PACOTE, templates);
    const br = await puppeteer.launch({
      executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const pg = await br.newPage();
    await pg.setViewport({ width: 1280, height: 900 });
    await pg.goto(base + '/aula-01.html', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 200));

    const forma = await pg.evaluate(() => ({
      titulos: document.querySelectorAll('.conteudo > h2[id]').length,
      botoes: document.querySelectorAll('.secao-dobra').length,
      dentroDoTitulo: [...document.querySelectorAll('.secao-dobra')].every((b) => b.parentNode.tagName === 'H2'),
      corpos: document.querySelectorAll('.conteudo > .secao-corpo').length,
      tabelasSoltas: document.querySelectorAll('.conteudo > table').length,
      abertas: [...document.querySelectorAll('.secao-corpo')]
        .filter((c) => c.getAttribute('data-recolhido') !== 'sim' && c.offsetHeight > 0).length,
    }));
    provar('cada título de secção ganhou o seu botão, dentro do próprio título',
      forma.botoes === forma.titulos && forma.titulos > 5 && forma.dentroDoTitulo,
      { titulos: forma.titulos, botoes: forma.botoes });
    provar('o corpo de cada secção é um bloco só, e nada ficou solto no documento',
      forma.corpos === forma.titulos && forma.tabelasSoltas === 0,
      { corpos: forma.corpos, soltas: forma.tabelasSoltas });
    provar('todas as secções nascem ABERTAS',
      forma.abertas === forma.titulos, { abertas: forma.abertas });

    /* CADA PASSO É TOLERANTE À AUSÊNCIA DO BOTÃO. No controle negativo não há botão nenhum, e
     * sem isto a prova estourava a meio em vez de REPRODUZIR o defeito que tem de reproduzir —
     * um controle que rebenta não é um controle. */
    const interagir = async (fn) => {
      try { return await pg.evaluate(fn); } catch (e) { return { erro: String((e && e.message) || e) }; }
    };

    const primeiro = await interagir(() => {
      const b = document.querySelector('.secao-dobra');
      const corpo = document.getElementById(b.getAttribute('aria-controls'));
      const antes = corpo.querySelectorAll('table').length;
      b.click();
      return {
        antes,
        depois: getComputedStyle(corpo).display,
        recolhido: corpo.getAttribute('data-recolhido'),
        expandido: b.getAttribute('aria-expanded'),
        altura: Math.round(corpo.getBoundingClientRect().height),
      };
    });
    provar('clicar no botão FECHA a secção (o corpo sai do ecrã)',
      !primeiro.erro && primeiro.depois === 'none' && primeiro.recolhido === 'sim'
      && primeiro.expandido === 'false' && primeiro.altura === 0, primeiro);
    const segundo = await interagir(() => {
      const b = document.querySelector('.secao-dobra');
      const corpo = document.getElementById(b.getAttribute('aria-controls'));
      b.click();
      return { depois: getComputedStyle(corpo).display, expandido: b.getAttribute('aria-expanded') };
    });
    provar('clicar outra vez ABRE (e o conteúdo está lá, inteiro)',
      !segundo.erro && segundo.depois !== 'none' && segundo.expandido === 'true', segundo);

    /* O ÍNDICE MANDA: uma secção fechada tem de abrir quando se clica no índice. */
    const peloIndice = await interagir(() => {
      const alvo = document.querySelectorAll('.conteudo > h2[id]')[4];
      const b = alvo.querySelector('.secao-dobra');
      const corpo = document.getElementById(b.getAttribute('aria-controls'));
      if (corpo.getAttribute('data-recolhido') !== 'sim') b.click();
      const fechadaAntes = corpo.getAttribute('data-recolhido');
      document.querySelector('.toc-local a[href="#' + alvo.id + '"]').click();
      return { fechadaAntes, depois: corpo.getAttribute('data-recolhido') };
    });
    provar('clicar no índice abre a secção que estava fechada',
      !peloIndice.erro && peloIndice.fechadaAntes === 'sim' && peloIndice.depois === 'nao', peloIndice);

    /* O PAPEL NÃO TEM DOBRA: uma secção fechada no ecrã imprime-se inteira. */
    await interagir(() => {
      const b = document.querySelectorAll('.secao-dobra')[4];
      const corpo = document.getElementById(b.getAttribute('aria-controls'));
      if (corpo.getAttribute('data-recolhido') !== 'sim') b.click();
    });
    await pg.emulateMediaType('print');
    const noPapel = await interagir(() => {
      const corpo = document.querySelectorAll('.secao-corpo')[4];
      return {
        corpo: getComputedStyle(corpo).display,
        botao: getComputedStyle(corpo.parentNode.querySelector('.secao-dobra')).display,
      };
    });
    await pg.emulateMediaType('screen');
    provar('no papel a secção fecha-se à força de abrir, e o botão não se imprime',
      !noPapel.erro && noPapel.corpo === 'block' && noPapel.botao === 'none', noPapel);

    await br.close();
    srv.close();
  }

  if (temporario) fs.rmSync(temporario, { recursive: true, force: true });

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: a Aula 02 lê '
    + 'o resultado da Aula 01 (agregado, pela régua da turma), o §3.1 conta o que aconteceu, o §1 e '
    + 'o §5 ficaram com o que é deles, e cada secção abre e fecha — com o índice a mandar.');
})();
