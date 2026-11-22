#!/usr/bin/env node
'use strict';

/**
 * provar-a-musica-do-modal.js — o diálogo que cria a aula pergunta a música dela.
 *
 * O QUE ELA DISSE (22/11/2026): «falta a gente colocar também tempo, a parte toda da musicalidade
 * ali naquele modal quando ele abre».
 *
 * O DEFEITO, medido no produto publicado: o diálogo criava a aula com `"Tempos": ""` e
 * `"Compasso": ""` — e o §4 do documento da Aula 02 da `rosa` saía a dizer «Nenhum exercício desta
 * aula tem tempos e compasso declarados na sequência — sem eles não há música a consolidar.»
 *
 * O QUE MUDOU. A música é do EXERCÍCIO (é a regra do §4: o mesmo exercício em Barra, Centro e
 * Expressão tem a mesma música) e o verbete já a declara. O diálogo passa a mostrar, por exercício
 * escolhido, uma linha com **Tempos** e **Compasso**, com três formas decididas pelo dado:
 *   · o verbete declara UMA música  → os valores vêm preenchidos e são leitura;
 *   · declara VÁRIAS                → os dois são escolha, e só as declaradas se oferecem;
 *   · não declara NENHUMA           → os dois ficam em branco para escrever à mão, com a nota.
 *
 * O QUE SE MEDE, e onde: no NAVEGADOR, na página do plano que o pacote serve, com a escrita
 * stubada — o POST de `api/elicitar` é capturado e o que se lê é o corpo que o professor enviaria.
 * É a única maneira de medir «o que fica gravado na sequência» sem escrever no repositório.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` serve a `plano.html` DAQUELE commit — a página que o código
 * antigo produzia — e mede o mesmo. Sem a caixa da música, e com a sequência a nascer vazia.
 *
 * Requer Chrome/Chromium (puppeteer-core do marp-cli global). Sem ele: NÃO FEITO.
 *
 *   node experimentos/provar-a-musica-do-modal.js
 *   node experimentos/provar-a-musica-do-modal.js --contra=33xxxxxxxx
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const raiz = path.resolve(__dirname, '..');
const REL_PAGINA = 'professores/demi-plie/ciclos/ciclo-01-breu-rosa/plano.html';
const PACOTE = path.join(raiz, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');

function envelope() {
  const pasta = path.join(raiz, 'escola/breu/envelopes');
  const nome = fs.readdirSync(pasta)
    .filter((n) => n.startsWith('plano-') && n.endsWith('.json')).sort().pop();
  return fs.readFileSync(path.join(pasta, nome), 'utf8');
}

/** A página e as respostas de `api/*`, com o corpo do POST guardado para se ler depois. */
function servir(html, templates) {
  const enviados = [];
  const env = envelope();
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (req.method === 'POST') {
      let corpo = '';
      req.on('data', (c) => { corpo += c; });
      req.on('end', () => {
        enviados.push({ caminho, corpo });
        ok('application/json', JSON.stringify({ ok: true, gravado: true }));
      });
      return;
    }
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(templates, 'ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(templates, 'nav.js')));
    }
    if (caminho.indexOf('/api/envelope/') !== -1) return ok('application/json', env);
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, enviados, base: 'http://127.0.0.1:' + srv.address().port })));
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-a-musica-do-modal: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-a-musica-do-modal: puppeteer-core não encontrado — NÃO FEITO.');
    process.exit(1);
  }

  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  let templates = path.join(raiz, 'tools/templates');
  let html = fs.readFileSync(path.join(raiz, REL_PAGINA), 'utf8');
  let temporario = null;
  if (contra) {
    /* A PÁGINA DO COMMIT, e não uma reconstrução: é o documento que o código antigo produzia. O
     * `plano.html` é saída gerada e está versionado — é por isso que o controle pode ser o
     * artefacto, e não uma re-execução. */
    html = execSync('git show ' + contra + ':' + REL_PAGINA, { cwd: raiz, maxBuffer: 64 * 1024 * 1024 }).toString();
    temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'musica-'));
    execSync('git archive ' + contra + ' tools | tar -x -C ' + temporario, { cwd: raiz, stdio: 'pipe' });
    templates = path.join(temporario, 'tools/templates');
  }

  let total = 0;
  let falhas = 0;
  const provar = (nome, cond, extra) => {
    total += 1;
    if (!cond) falhas += 1;
    console.log((cond ? '  ok    ' : '  FALHA ') + nome
      + (extra !== undefined ? '  → ' + JSON.stringify(extra).slice(0, 260) : ''));
  };

  const br = await puppeteer.launch({
    executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const pg = await br.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  const interagir = async (fn, arg) => {
    try { return await pg.evaluate(fn, arg); } catch (e) { return { erro: String((e && e.message) || e) }; }
  };

  const abrir = async (base, nn) => {
    await pg.goto(base + '/plano-ensino/?criar-aula=' + nn, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 260));
  };

  /* ───────────────────── a) a caixa da música existe, e nasce fechada ───────────────────── */
  console.log('\na) a caixa da música no diálogo');
  let servico = await servir(html, templates);
  await abrir(servico.base, '03');

  const forma = await interagir(() => {
    const caixa = document.getElementById('criar-aula-musica');
    const tabela = document.getElementById('criar-aula-musica-tabela');
    const modal = document.getElementById('criar-aula');
    return {
      modalAberto: !!modal && !modal.hidden,
      temCaixa: !!caixa,
      escondida: caixa ? caixa.hidden : null,
      colunas: tabela ? [...tabela.querySelectorAll('thead th')].map((t) => t.textContent.trim()) : [],
    };
  });
  provar('o diálogo abre (pelo endereço `?criar-aula=03`)', forma.modalAberto === true, forma);
  provar('tem a caixa «Tempos e compasso de cada exercício»', forma.temCaixa === true);
  provar('as três colunas são Exercício · Tempos · Compasso',
    (forma.colunas || []).join(' | ') === 'Exercício | Tempos | Compasso', forma.colunas);
  provar('sem exercício escolhido, a caixa está fechada', forma.escondida === true);

  /* ───── b) A MÚSICA VEM DO VERBETE E O CAMPO É DE ESCREVER (22/11/2026) ─────
   *
   * Palavras dela: «tempos e compassos são editáveis, vão abrir como campos de formulário
   * carregados com os valores reais, mas também editáveis, para que o professor possa editar. E aí
   * ele vai decidir se realmente ele quer trabalhar nesse tempo e com esses compassos.»
   *
   * ANTES: quando o verbete declarava uma música, a célula era um `span` de LEITURA com um `input`
   * escondido. Um campo travado obrigava-a a ir ao Estilo mudar a música do exercício — e isso
   * mudaria a música de TODAS as aulas do ciclo, por causa de uma decisão de uma aula. */
  console.log('\nb) uma música declarada: o campo abre PREENCHIDO e é editável');
  const uma = await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement tendu"]').click();
    const corpo = document.getElementById('criar-aula-musica-corpo');
    const tr = corpo.querySelectorAll('tr')[0];
    if (!tr) return { linhas: 0 };
    const td = [...tr.querySelectorAll('td')];
    const campos = [...tr.querySelectorAll('input')];
    return {
      linhas: corpo.querySelectorAll('tr').length,
      visivel: !document.getElementById('criar-aula-musica').hidden,
      nome: td[0].textContent.trim(),
      tempos: campos[0] ? campos[0].value : null,
      compasso: campos[1] ? campos[1].value : null,
      tipo: campos.map((c) => c.type),
      escondidos: tr.querySelectorAll('input[type=hidden]').length,
      titulo: campos[0] ? campos[0].title : '',
      nota: document.getElementById('criar-aula-musica-nota').textContent.trim(),
    };
  });
  provar('marcar um exercício abre a caixa e acrescenta a linha dele',
    uma.visivel === true && uma.linhas === 1 && uma.nome === 'Battement tendu', uma);
  provar('os campos abrem CARREGADOS com o valor real (8 e 2/4)',
    uma.tempos === '8' && uma.compasso === '2/4', [uma.tempos, uma.compasso]);
  provar('…e são campos de ESCREVER — nenhum `hidden` a fazer de campo travado',
    (uma.tipo || []).join(',') === 'text,text' && uma.escondidos === 0,
    { tipo: uma.tipo, escondidos: uma.escondidos });
  provar('o campo DIZ de onde vem o valor («declarado no verbete: 8 em 2/4»)',
    /declarado no verbete: 8 em 2\/4/.test(uma.titulo || ''), uma.titulo);
  provar('a nota separa o que está carregado do que fica gravado',
    /verbete declara/.test(uma.nota || '') && /só para esta/.test(uma.nota || ''), uma.nota);

  /* ────────── c) O DEFEITO QUE ELA VIU: a música de OUTRA escola não entra ──────────
   *
   * Palavras dela: «o Batman GT apareceu opções para eu escolher o tempo e opções para eu escolher o
   * compasso. Está errado isso, porque o Batman GT já tem isso definido. Por que é que não está
   * atualizado do mesmo lugar onde você pegou para os outros exercícios?»
   *
   * A causa era a leitura: o alfabeto guarda o registo do catálogo e o de CADA escola, e a lista
   * que alimentava o diálogo tirava o dono e juntava tudo. O Battement jeté tem `4|4/4@batata` e
   * `8|2/4@breu`; depois de tirar o dono, «este exercício tem duas músicas» — e a tela, vendo duas,
   * pedia uma escolha onde a `breu` tem uma resposta. */
  console.log('\nc) a música de outra escola NÃO entra (o defecto do «Batman GT»)');
  const doJete = await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement jeté"]').click();
    const tr = document.querySelectorAll('#criar-aula-musica-corpo tr')[1];
    const tds = [...tr.querySelectorAll('td')];
    const campos = [...tr.querySelectorAll('input')];
    return {
      nome: tds[0].textContent.trim(),
      tempos: campos[0] ? campos[0].value : '',
      compasso: campos[1] ? campos[1].value : '',
      controles: tr.querySelectorAll('select, input[type=text]').length,
      musicasDoDado: (function () {
        try {
          return JSON.parse(document.getElementById('dados-criar-aula').textContent).musicas['Battement jeté'];
        } catch (e) { return null; }
      })(),
    };
  });
  provar('o Battement jeté da `breu` vem com UMA música (a dela), e não com as duas',
    Array.isArray(doJete.musicasDoDado) && doJete.musicasDoDado.length === 1
    && doJete.musicasDoDado[0] === '8|2/4', doJete.musicasDoDado);
  provar('…e por isso os campos abrem preenchidos (8 e 2/4), sem escolha a fazer',
    doJete.tempos === '8' && doJete.compasso === '2/4' && doJete.controles === 2, doJete);
  provar('…e a música da `batata` (4 em 4/4) não aparece em lado nenhum do diálogo',
    JSON.stringify(doJete.musicasDoDado || null).indexOf('4|4/4') === -1, doJete.musicasDoDado);

  /* O PRIMEIRO SERVIDOR FECHA, O NAVEGADOR NÃO: a página da fixture seguinte abre-se na mesma
   * aba, e fechar o browser aqui deixava a prova a falar com um alvo morto. */
  servico.srv.close();

  /* ───────── d) DUAS músicas declaradas pela MESMA escola: aí sim, escolha ─────────
   *
   * A regra não desapareceu — mudou de dono. Para prová-la é preciso uma escola que declare duas
   * músicas para o mesmo exercício, e nenhuma declara hoje. A fixture é a PÁGINA, com um `4|4/4`
   * acrescentado ao lado do `8|2/4` da `breu`: dois registos do MESMO dono, que é o que o alfabeto
   * permite e o que o diálogo tem de saber mostrar. */
  console.log('\nd) duas músicas da MESMA escola: abre com a primeira, e diz as duas');
  const htmlDuas = html.replace('"Battement jeté":["8|2/4"]', '"Battement jeté":["8|2/4","4|4/4"]');
  const temFixture = htmlDuas !== html;
  servico = await servir(htmlDuas, templates);
  await abrir(servico.base, '03');
  const duas = await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement jeté"]').click();
    const corpo = document.getElementById('criar-aula-musica-corpo');
    const tr = corpo.querySelectorAll('tr')[0];
    const campos = [...tr.querySelectorAll('input')];
    return {
      nome: tr.querySelector('td').textContent.trim(),
      campos: campos.length,
      antes: {
        valorTempos: campos[0] ? campos[0].value : null,
        valorCompasso: campos[1] ? campos[1].value : null,
        titulo: campos[0] ? campos[0].title : '',
      },
    };
  });
  provar('a fixture das duas músicas da mesma escola foi aplicada', temFixture || Boolean(contra));
  provar('o exercício com duas músicas também abre em dois campos de escrever',
    duas.nome === 'Battement jeté' && duas.campos === 2, duas);
  /* COM VÁRIAS, ABRE COM A PRIMEIRA DECLARADA — e o `title` lista todas: a escolha é informada, e
   * não há opção escondida (o campo aceita qualquer valor, e o documento marca «conferir» se o
   * verbete não cobrir o que ela escrever). A fixture declara o `8` primeiro, que é o registo da
   * `breu`. */
  const antes = (duas && duas.antes) || {};
  provar('…preenchido com a primeira música declarada (8 em 2/4)',
    antes.valorTempos === '8' && antes.valorCompasso === '2/4', antes);
  provar('…e o campo nomeia as duas declaradas (8 em 2/4 · 4 em 4/4)',
    /o verbete declara 8 em 2\/4 · 4 em 4\/4/.test(antes.titulo || ''), antes.titulo);

  /* ─────────────────── e) o que fica gravado na sequência (o corpo do POST) ─────────────────── */
  console.log('\ne) o que a professora ESCREVE é o que fica gravado');
  /* A PÁGINA RECOMEÇA (a secção (d) deixou o Battement jeté marcado, e um segundo clique
   * DESmarcava-o): recarregar é o que garante que esta secção mede o que diz medir. */
  await abrir(servico.base, '03');
  await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement tendu"]').click();
    document.querySelector('#criar-aula-exercicios input[value="Battement jeté"]').click();
    /* A EDIÇÃO É O PONTO DESTA SECÇÃO. Os campos abrem com o declarado — e é ela que decide o
     * que a aula trabalha: o tendu passa a 16 em 4/4 (outra música, da mesma família) e o jeté
     * fica no que veio. O que tem de ficar gravado é o ESCOLHIDO, e não o declarado. */
    const tr = document.querySelectorAll('#criar-aula-musica-corpo tr')[0];
    const t = tr.querySelector('input[data-qual="tempos"]');
    const c = tr.querySelector('input[data-qual="compasso"]');
    t.value = '16';
    c.value = '4/4';
    const marco = document.getElementById('criar-aula-marco');
    marco.value = 'o que esta aula persegue';
    document.querySelector('#criar-aula-blocos input[value="Barra"]').click();
  });
  await pg.click('#criar-aula-guardar');
  await new Promise((r) => setTimeout(r, 700));
  const enviado = servico.enviados.find((e) => e.caminho.indexOf('elicitar') !== -1);
  let corpo = null;
  try { corpo = enviado ? JSON.parse(enviado.corpo) : null; } catch { corpo = null; }
  const linhas = (corpo && corpo.respostas && corpo.respostas['aula-3-sequencia']
    && corpo.respostas['aula-3-sequencia'].valor) || [];
  provar('o diálogo manda a aula criada para a porta', !!enviado, servico.enviados.map((e) => e.caminho));
  provar('a sequência tem uma linha por exercício escolhido', linhas.length === 2,
    linhas.map((l) => l['Conteúdo do nível']));
  const doTendu = linhas.find((l) => l['Conteúdo do nível'] === 'Battement tendu') || {};
  const doJeteGravado = linhas.find((l) => l['Conteúdo do nível'] === 'Battement jeté') || {};
  provar('o Battement tendu nasce com o que a professora ESCREVEU (16 em 4/4), e não com o declarado',
    doTendu['Tempos'] === '16' && doTendu['Compasso'] === '4/4',
    [doTendu['Tempos'], doTendu['Compasso']]);
  provar('…e o jeté, que ela deixou como veio, nasce com o declarado (8 em 2/4)',
    doJeteGravado['Tempos'] === '8' && doJeteGravado['Compasso'] === '2/4',
    [doJeteGravado['Tempos'], doJeteGravado['Compasso']]);
  provar('o bloco escolhido é o da linha', linhas.every((l) => l['Bloco'] === 'Barra'),
    linhas.map((l) => l['Bloco']));

  await br.close();
  servico.srv.close();
  if (temporario) fs.rmSync(temporario, { recursive: true, force: true });

  /* ────────── f) um exercício sem música declarada: escreve-se à mão, e meio par não passa ────────── */
  console.log('\nf) sem música declarada no verbete');
  /* A PÁGINA SEM A MÚSICA DO «Plié» — é o que acontece quando o verbete não declara nenhuma. A
   * troca é no JSON que o diálogo recebe, e o resto da página fica exatamente o mesmo. */
  const semMusica = html.replace('"Plié":["4|2/4"],', '');
  const tinha = html.indexOf('"Plié":["4|2/4"],') !== -1;
  provar('a fixture do «sem música» foi aplicada (o JSON do Plié saiu)',
    !contra ? tinha : true, tinha);
  let servico2 = null;
  let br2 = null;
  if (!contra) {
    servico2 = await servir(semMusica, path.join(raiz, 'tools/templates'));
    br2 = await puppeteer.launch({
      executablePath: executavel, args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const pg2 = await br2.newPage();
    const avaliar = async (fn) => {
      try { return await pg2.evaluate(fn); } catch (e) { return { erro: String((e && e.message) || e) }; }
    };
    await pg2.setViewport({ width: 1280, height: 900 });
    await pg2.goto(servico2.base + '/plano-ensino/?criar-aula=03', { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 260));
    const livre = await avaliar(() => {
      document.querySelector('#criar-aula-exercicios input[value="Plié"]').click();
      const tr = document.querySelector('#criar-aula-musica-corpo tr');
      return {
        escreve: tr ? tr.querySelectorAll('input[type=text]').length : 0,
        nota: document.getElementById('criar-aula-musica-nota').textContent.trim(),
      };
    });
    provar('sem verbete, os dois campos são de ESCREVER (e não selects)',
      livre.escreve === 2, livre);
    provar('a nota nomeia o exercício sem música', /Sem música declarada[^]*Plié/.test(livre.nota || ''), livre.nota);

    await avaliar(() => {
      document.getElementById('criar-aula-marco').value = 'o que esta aula persegue';
      document.querySelector('#criar-aula-blocos input[value="Barra"]').click();
      const tr = document.querySelector('#criar-aula-musica-corpo tr');
      tr.querySelector('input[data-qual="tempos"]').value = '8';
    });
    await pg2.click('#criar-aula-guardar');
    await new Promise((r) => setTimeout(r, 400));
    const aviso = await avaliar(() => document.getElementById('criar-aula-aviso').textContent.trim());
    provar('meio par (tempos sem compasso) é RECUSADO, com o nome do exercício',
      /Tempos e compasso andam juntos/.test(aviso || '') && /Plié/.test(aviso || ''), aviso);
    provar('…e nada foi enviado', servico2.enviados.length === 0,
      servico2.enviados.map((e) => e.caminho));
    await br2.close();
    servico2.srv.close();
  }

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: o diálogo '
    + 'que cria a aula mostra a música de cada exercício em campos que abrem PREENCHIDOS com o que '
    + 'o verbete declara e são EDITÁVEIS; a música de outra escola não entra; meio par é recusado; e '
    + 'o que fica gravado na sequência é o que a professora escreveu, não o declarado.');
})();
