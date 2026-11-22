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
 * O QUE MUDOU, E MUDOU DUAS VEZES NO MESMO DIA (22/11/2026).
 *
 * 1.º o diálogo passou a MOSTRAR a música do verbete, por exercício escolhido — uma linha com
 *     **Tempos** e **Compasso**.
 * 2.º os dois campos passaram a ser de ESCREVER, para ela poder ajustar sem sair da aula.
 * 3.º e voltaram a ser de LEITURA, com uma coluna **Ações** e um «Derivar» por exercício. A razão
 *     está escrita em `derivar-plano-ciclo.js`, e é uma regra do produto: no Estilo, a coluna do
 *     compasso é CALCULADA somando os trechos da decomposição (passo 5), e a chave do verbete é
 *     `tempos|compasso`. Um tempo escrito no plano que o verbete não cobre é uma música sem
 *     decomposição nenhuma — não é uma decisão da aula, é um verbete que falta. Quem quer outro
 *     tempo DERIVA, compõe no Estilo, e volta.
 *
 * O QUE SE MEDE, e são as três coisas que o desenho afirma:
 *   · a linha só se LÊ — nenhum `input` de escrever em parte nenhuma da tabela;
 *   · a música que fica gravada é a que o verbete declara SEM DÚVIDA (uma). Com nenhuma ou com
 *     várias a linha nasce sem música, e é o núcleo (`compor`) que declara a lacuna;
 *   · o «Derivar» leva ao Estilo, com o exercício e a música no endereço — e fecha o modal antes.
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
  provar('as quatro colunas são Exercício · Tempos · Compasso · Ações',
    (forma.colunas || []).join(' | ') === 'Exercício | Tempos | Compasso | Ações', forma.colunas);
  /* A LARGURA É A DO MODAL DA DURAÇÃO (22/11/2026). Palavras dela: «tem o padrão de modal que a
   * gente usa na sala […] A gente tem aqui um modal e esse modal tem um padrão, tem as dimensões
   * dele, da largura. Então tem que ser esse mesmo padrão, não pode ser diferente.» O «na sala» é
   * o `#modal-duracao` dos Bastidores, e o padrão é a modificação `.modal-largo` da folha: 880px em
   * vez dos 440px de uma pergunta de sim/não. Mede-se a CLASSE e a largura que ela impõe — a
   * segunda é a que ela vê. */
  const largura = await interagir(() => {
    const caixa = document.querySelector('#criar-aula .modal-caixa');
    const dur = document.createElement('div');
    dur.className = 'modal-caixa modal-largo';
    document.body.appendChild(dur);
    const medida = { classe: caixa ? caixa.className : '', nossa: caixa ? caixa.getBoundingClientRect().width : 0,
      padrao: dur.getBoundingClientRect().width };
    dur.remove();
    return medida;
  });
  provar('o modal usa a modificação larga da folha (`.modal-caixa.modal-largo`)',
    (largura.classe || '').indexOf('modal-largo') !== -1, largura);
  provar('…e mede o mesmo que o modal da duração (a largura do padrão)',
    largura.nossa > 0 && Math.abs(largura.nossa - largura.padrao) < 2, largura);
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
  console.log('\nb) uma música declarada: a célula LÊ o valor do verbete, e não se escreve por cima');
  const uma = await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement tendu"]').click();
    const corpo = document.getElementById('criar-aula-musica-corpo');
    const tr = corpo.querySelectorAll('tr')[0];
    if (!tr) return { linhas: 0 };
    const td = [...tr.querySelectorAll('td')];
    const b = tr.querySelector('button[data-derivar]');
    return {
      linhas: corpo.querySelectorAll('tr').length,
      visivel: !document.getElementById('criar-aula-musica').hidden,
      nome: td[0].textContent.trim(),
      tempos: td[1] ? td[1].textContent.trim() : null,
      compasso: td[2] ? td[2].textContent.trim() : null,
      titulo: td[1] ? td[1].title : '',
      acao: td[3] ? td[3].textContent.trim() : null,
      derivar: b ? { rotulo: b.textContent.trim(), alvo: b.getAttribute('data-derivar'),
        musica: b.getAttribute('data-musica'), titulo: b.title } : null,
      escrever: tr.querySelectorAll('input, select, textarea').length,
      nota: document.getElementById('criar-aula-musica-nota').textContent.trim(),
    };
  });
  provar('marcar um exercício abre a caixa e acrescenta a linha dele',
    uma.visivel === true && uma.linhas === 1 && uma.nome === 'Battement tendu', uma);
  provar('as células mostram o valor do verbete (8 e 2/4)', uma.tempos === '8' && uma.compasso === '2/4',
    [uma.tempos, uma.compasso]);
  /* O QUE ELA VIU E RECUSOU: «Essa solução não serve». Nenhum campo de escrever na tabela — nem
   * `text`, nem `hidden` a fazer de campo travado. */
  provar('…e NÃO HÁ NADA PARA ESCREVER na tabela (nem campo, nem `hidden`)',
    uma.escrever === 0, uma.escrever);
  provar('a célula DIZ de onde vem o valor («declarado no verbete: 8 em 2/4»)',
    /declarado no verbete: 8 em 2\/4/.test(uma.titulo || ''), uma.titulo);
  provar('a quarta coluna é a das AÇÕES, e tem o botão «Derivar»', uma.acao === 'Derivar',
    { acao: uma.acao, botao: uma.derivar });
  provar('…e o botão leva o exercício e a música no próprio atributo',
    uma.derivar && uma.derivar.alvo === 'Battement tendu' && uma.derivar.musica === '8|2/4', uma.derivar);
  provar('a nota diz que a célula é do verbete e que se deriva para ajustar',
    /verbete declara/.test(uma.nota || '') && /derive/.test(uma.nota || ''), uma.nota);
  /* A QUARTA COLUNA ACRESCENTA LARGURA, e uma tabela que transborda a caixa é o defeito que a
   * coluna nova podia ter trazido. Mede-se a tabela contra o interior do modal — não contra a
   * janela: o que importa é ela caber onde está. */
  const caibo = await interagir(() => {
    const caixa = document.querySelector('#criar-aula .modal-caixa');
    const tabela = document.getElementById('criar-aula-musica-tabela');
    const dentro = caixa ? caixa.getBoundingClientRect().width : 0;
    return {
      caixa: Math.round(dentro),
      tabela: Math.round(tabela.getBoundingClientRect().width),
      conteudo: tabela.scrollWidth,
    };
  });
  provar('a tabela das quatro colunas cabe dentro da caixa (sem transbordar)',
    caibo.tabela <= caibo.caixa && caibo.conteudo <= caibo.tabela + 1, caibo);

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
    return {
      nome: tds[0].textContent.trim(),
      tempos: tds[1] ? tds[1].textContent.trim() : '',
      compasso: tds[2] ? tds[2].textContent.trim() : '',
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
  /* O «Batman GT» dela: «ele apareceu opções para eu escolher o tempo e opções para eu escolher o
   * compasso. Está errado isso, porque o Batman GT já tem isso definido.» Com UMA música não há
   * escolha nenhuma — a célula mostra o valor e mais nada. */
  provar('…e por isso a linha mostra UM valor (8 em 2/4), sem escolha e sem campo',
    doJete.tempos === '8' && doJete.compasso === '2/4' && doJete.controles === 0, doJete);
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
  console.log('\nd) duas músicas da MESMA escola: mostra a primeira, diz as duas, e aponta o Derivar');
  const htmlDuas = html.replace('"Battement jeté":["8|2/4"]', '"Battement jeté":["8|2/4","4|4/4"]');
  const temFixture = htmlDuas !== html;
  servico = await servir(htmlDuas, templates);
  await abrir(servico.base, '03');
  const duas = await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement jeté"]').click();
    const corpo = document.getElementById('criar-aula-musica-corpo');
    const tr = corpo.querySelectorAll('tr')[0];
    const tds = [...tr.querySelectorAll('td')];
    return {
      nome: tr.querySelector('td').textContent.trim(),
      campos: tr.querySelectorAll('input').length,
      antes: {
        valorTempos: tds[1] ? tds[1].textContent.trim() : null,
        valorCompasso: tds[2] ? tds[2].textContent.trim() : null,
        titulo: tds[1] ? tds[1].title : '',
      },
      nota: document.getElementById('criar-aula-musica-nota').textContent.trim(),
    };
  });
  provar('a fixture das duas músicas da mesma escola foi aplicada', temFixture || Boolean(contra));
  provar('o exercício com duas músicas também é de LEITURA (nenhum campo)',
    duas.nome === 'Battement jeté' && duas.campos === 0, duas);
  /* COM VÁRIAS, ABRE COM A PRIMEIRA DECLARADA — e o `title` lista todas: a escolha é informada, e
   * não há opção escondida (o campo aceita qualquer valor, e o documento marca «conferir» se o
   * verbete não cobrir o que ela escrever). A fixture declara o `8` primeiro, que é o registo da
   * `breu`. */
  const antes = (duas && duas.antes) || {};
  provar('…preenchido com a primeira música declarada (8 em 2/4)',
    antes.valorTempos === '8' && antes.valorCompasso === '2/4', antes);
  provar('…e a célula nomeia as duas declaradas (8 em 2/4 · 4 em 4/4)',
    /o verbete declara 8 em 2\/4 · 4 em 4\/4/.test(antes.titulo || ''), antes.titulo);
  /* COM DUAS, A NOTA APONTA O SÍTIO DA DECISÃO — o Estilo —, porque a aula não pode escolher por
   * ela: a escolha depende de ver a decomposição, e a decomposição vive no passo 5. */
  provar('…e a nota diz que há mais de uma e que é no Estilo que se escolhe',
    /mais de uma música/.test(duas.nota || '') && /Estilo/.test(duas.nota || ''), duas.nota);

  /* ─────────────────── e) o que fica gravado na sequência (o corpo do POST) ─────────────────── */
  console.log('\ne) o que fica gravado é a música do verbete — e não há como escrever outra');
  /* A PÁGINA DESTA SECÇÃO É A ORIGINAL, com UMA música por exercício — a secção (d) trocou o
   * «Battement jeté» por duas de propósito, e medir aqui «o que fica gravado» com duas mediria a
   * outra regra. As duas páginas ficam de pé, e cada secção mede a sua. */
  const comUma = await servir(html, templates);
  await abrir(comUma.base, '03');
  await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement tendu"]').click();
    document.querySelector('#criar-aula-exercicios input[value="Battement jeté"]').click();
    /* NÃO HÁ EDIÇÃO A FAZER — é o ponto desta secção. A tabela é de leitura, e o que a linha leva
     * é o que o verbete declara. A tentativa de escrever outro tempo aqui é o defeito que ela
     * mandou desfazer: o campo já não existe, e é isso que se mede (a asserção dos `input` abaixo). */
    const tr = document.querySelectorAll('#criar-aula-musica-corpo tr')[0];
    const marco = document.getElementById('criar-aula-marco');
    marco.value = 'o que esta aula persegue';
    document.querySelector('#criar-aula-blocos input[value="Barra"]').click();
  });
  await pg.click('#criar-aula-guardar');
  await new Promise((r) => setTimeout(r, 700));
  const enviado = comUma.enviados.find((e) => e.caminho.indexOf('elicitar') !== -1);
  let corpo = null;
  try { corpo = enviado ? JSON.parse(enviado.corpo) : null; } catch { corpo = null; }
  const linhas = (corpo && corpo.respostas && corpo.respostas['aula-3-sequencia']
    && corpo.respostas['aula-3-sequencia'].valor) || [];
  provar('o diálogo manda a aula criada para a porta', !!enviado, comUma.enviados.map((e) => e.caminho));
  provar('a sequência tem uma linha por exercício escolhido', linhas.length === 2,
    linhas.map((l) => l['Conteúdo do nível']));
  const doTendu = linhas.find((l) => l['Conteúdo do nível'] === 'Battement tendu') || {};
  const doJeteGravado = linhas.find((l) => l['Conteúdo do nível'] === 'Battement jeté') || {};
  provar('o Battement tendu nasce com a música que o VERBETE declara (8 em 2/4)',
    doTendu['Tempos'] === '8' && doTendu['Compasso'] === '2/4',
    [doTendu['Tempos'], doTendu['Compasso']]);
  provar('…e o jeté, igual: 8 em 2/4, sem ninguém ter escolhido',
    doJeteGravado['Tempos'] === '8' && doJeteGravado['Compasso'] === '2/4',
    [doJeteGravado['Tempos'], doJeteGravado['Compasso']]);
  /* O CONTROLE DA SECÇÃO, e é ele que prova que a tabela é de leitura: a página não tem UM campo
   * de escrever na tabela da música. Sem esta asserção, «grava o declarado» seria indistinguível de
   * «grava o que ela escreveu, que por acaso era o declarado». */
  const camposNaTabela = await interagir(() => document
    .querySelectorAll('#criar-aula-musica-tabela input, #criar-aula-musica-tabela select').length);
  provar('…e em nenhum momento houve um campo para escrever outro tempo', camposNaTabela === 0,
    camposNaTabela);
  provar('o bloco escolhido é o da linha', linhas.every((l) => l['Bloco'] === 'Barra'),
    linhas.map((l) => l['Bloco']));
  await comUma.srv.close();

  /* ───────── e2) com DUAS músicas declaradas para o mesmo exercício, a linha nasce SEM música ─────────
   *
   * É a outra metade da regra, e é a que impede a tela de decidir por ela: escolher a primeira de
   * duas seria uma escolha feita no sítio onde a decomposição não está à vista. Quem decide é o
   * Estilo, com os trechos à frente — e o núcleo, ao compor a aula, declara a lacuna em vez de
   * inventar uma música. */
  console.log('\ne2) com duas músicas da mesma escola, a linha grava-se sem música');
  await abrir(servico.base, '03');
  await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement jeté"]').click();
    document.getElementById('criar-aula-marco').value = 'o que esta aula persegue';
    document.querySelector('#criar-aula-blocos input[value="Barra"]').click();
  });
  const antesDoEnvio = servico.enviados.length;
  await pg.click('#criar-aula-guardar');
  await new Promise((r) => setTimeout(r, 700));
  const enviado2musicas = servico.enviados.slice(antesDoEnvio).find((e) => e.caminho.indexOf('elicitar') !== -1);
  let corpoDuas = null;
  try { corpoDuas = enviado2musicas ? JSON.parse(enviado2musicas.corpo) : null; } catch { corpoDuas = null; }
  const linhaDuas = ((corpoDuas && corpoDuas.respostas && corpoDuas.respostas['aula-3-sequencia']
    && corpoDuas.respostas['aula-3-sequencia'].valor) || [])[0] || {};
  provar('com duas músicas declaradas, a linha nasce SEM música (a tela não escolhe por ela)',
    linhaDuas['Tempos'] === '' && linhaDuas['Compasso'] === '', linhaDuas);

  /* ───────── g) O «DERIVAR» — o modal fecha e o browser vai ao Estilo daquele exercício ─────────
   *
   * Palavras dela: «quando clicar em derivar, vai direto para bastidores e em bastidores é direto no
   * estilo e no estilo já aberto o derivar do que eu quero fazer o ajuste. […] O que acontece com o
   * modal se ele clicar no botão de derivar? O modal fecha.»
   *
   * A NAVEGAÇÃO É INTERCEPTADA, e é isso que deixa medir as duas coisas ao mesmo tempo: o ENDEREÇO
   * que o produto pediu (lido no pedido, antes de sair) e o ESTADO que ele deixou para trás (o modal
   * fechado). Sem a interceptação, o browser saía e o que ficasse à vista já era outra página. */
  console.log('\ng) o «Derivar» fecha o modal e leva ao Estilo daquele exercício');
  await abrir(servico.base, '03');
  await interagir(() => {
    document.querySelector('#criar-aula-exercicios input[value="Battement tendu"]').click();
  });
  /* O PEDIDO DE SAÍDA FICA PENDURADO, e não abortado. Uma navegação abortada comita a página de
   * erro do Chrome, e o que se ia medir a seguir — o modal que ficou para trás — deixava de existir.
   * Pendurada, a página antiga continua a ser a que está à vista: é o instante exacto entre o
   * `fechar()` e a chegada do documento novo. */
  const pedidosDeSaida = [];
  let pendurado = null;
  await pg.setRequestInterception(true);
  pg.on('request', (r) => {
    if (r.isNavigationRequest() && r.frame() === pg.mainFrame()
      && r.url().indexOf('/bastidores/') !== -1) {
      pedidosDeSaida.push(r.url());
      /* UM 204 NA NAVEGAÇÃO NÃO TROCA DE DOCUMENTO — o browser fica onde está, e o que se mede a
       * seguir é o instante exacto entre o `fechar()` e a chegada da página nova. */
      pendurado = r;
      r.respond({ status: 204, body: '' }).catch(() => {});
      return;
    }
    r.continue().catch(() => {});
  });
  /* O BOTÃO PODE NÃO EXISTIR — é o caso do controle negativo, e uma prova que morre com
   * `No element found` não diz quantas asserções falharam: diz que a página é outra. Mede-se a
   * ausência, e o resto da secção fica como falha declarada. */
  const temOBotao = await interagir(() => !!document.querySelector('#criar-aula-musica-corpo button[data-derivar]'));
  if (temOBotao) {
    await pg.click('#criar-aula-musica-corpo button[data-derivar]');
    await new Promise((r) => setTimeout(r, 400));
  }
  const saida = pedidosDeSaida.find((u) => u.indexOf('/bastidores/') !== -1) || '';
  provar('a linha do exercício tem o botão «Derivar»', temOBotao === true, temOBotao);
  provar('o clique no «Derivar» pede a página dos Bastidores', !!saida, pedidosDeSaida);
  provar('…na secção do Estilo (`#estilo`)', saida.indexOf('#estilo') !== -1, saida);
  provar('…com o exercício no endereço (`derivar=Battement tendu`)',
    /[?&]derivar=Battement(%20|\+)tendu(&|$)/.test(saida), saida);
  provar('…e com a música dele (`musica=8|2/4`)',
    /[?&]musica=8(%7C|\|)2(%2F|\/)4/.test(saida), saida);
  const depoisDoClique = await interagir(() => {
    const m = document.getElementById('criar-aula');
    return { hidden: m ? m.hidden : null };
  });
  provar('…e o modal está FECHADO (o gesto terminou, não ficou uma janela aberta)', depoisDoClique.hidden === true,
    depoisDoClique);
  if (pendurado) await pendurado.abort().catch(() => {});
  await pg.setRequestInterception(false);

  await br.close();
  servico.srv.close();
  if (temporario) fs.rmSync(temporario, { recursive: true, force: true });

  /* ────────── f) um exercício sem música declarada: a célula diz «—», e a linha nasce sem música ────────── */
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
      const tds = tr ? [...tr.querySelectorAll('td')] : [];
      return {
        escreve: tr ? tr.querySelectorAll('input, select').length : 0,
        tempos: tds[1] ? tds[1].textContent.trim() : null,
        compasso: tds[2] ? tds[2].textContent.trim() : null,
        titulo: tds[1] ? tds[1].title : '',
        temDerivar: !!tr && !!tr.querySelector('button[data-derivar]'),
        nota: document.getElementById('criar-aula-musica-nota').textContent.trim(),
      };
    });
    /* O QUE NÃO EXISTE LÊ-SE «—», e a célula diz porquê no `title`. Era aqui que os dois campos
     * apareciam em branco «para escrever à mão» — o caminho que a regra do passo 5 fechou. */
    provar('sem música no verbete, as duas células dizem «—» e não há campo nenhum',
      livre.tempos === '—' && livre.compasso === '—' && livre.escreve === 0, livre);
    provar('…e o `title` diz que o verbete não a declara',
      /não declara música/.test(livre.titulo || ''), livre.titulo);
    provar('a nota nomeia o exercício sem música e manda derivar',
      /Sem música declarada[^]*Plié/.test(livre.nota || '') && /derive/.test(livre.nota || ''), livre.nota);
    provar('…e o «Derivar» está lá, que é a saída para este caso', livre.temDerivar === true, livre);

    /* E A AULA NASCE, sem música — não é recusada. A recusa do meio par morreu com o campo que a
     * justificava: ninguém pode escrever meia música onde não há campo. Quem diz o que falta é o
     * §4 do documento, pela voz do núcleo (`compor`), e é lá que a lacuna se lê. */
    await avaliar(() => {
      document.getElementById('criar-aula-marco').value = 'o que esta aula persegue';
      document.querySelector('#criar-aula-blocos input[value="Barra"]').click();
    });
    await pg2.click('#criar-aula-guardar');
    await new Promise((r) => setTimeout(r, 700));
    const enviado2 = servico2.enviados.find((e) => e.caminho.indexOf('elicitar') !== -1);
    let corpo2 = null;
    try { corpo2 = enviado2 ? JSON.parse(enviado2.corpo) : null; } catch { corpo2 = null; }
    const linhas2 = (corpo2 && corpo2.respostas && corpo2.respostas['aula-3-sequencia']
      && corpo2.respostas['aula-3-sequencia'].valor) || [];
    provar('a aula é criada (não é recusada por falta de música)', linhas2.length === 1,
      linhas2.map((l) => l['Conteúdo do nível']));
    provar('…e a linha nasce SEM música — é o núcleo que declara a lacuna, não a tela',
      linhas2.length === 1 && linhas2[0]['Tempos'] === '' && linhas2[0]['Compasso'] === '',
      linhas2[0]);
    await br2.close();
    servico2.srv.close();
  }

  console.log('');
  if (falhas) {
    console.log((contra ? 'CONTROLE: ' : '') + 'FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log((contra ? 'CONTROLE CONFORME — ' : 'TUDO CERTO — ') + total + ' asserções: o diálogo '
    + 'que cria a aula mostra a música de cada exercício em LINHA DE LEITURA — a do verbete, e a da '
    + 'escola certa —, a coluna «Ações» leva cada um ao Derivar do Estilo com o exercício e a música '
    + 'no endereço, e o modal fecha antes de sair; o que a sequência grava é a música que o verbete '
    + 'declara sem dúvida (uma), e com nenhuma ou com várias a linha nasce sem música, para o núcleo '
    + 'declarar a lacuna em vez de escolher por ela.');
})();
