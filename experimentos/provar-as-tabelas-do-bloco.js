/**
 * provar-as-tabelas-do-bloco.js — NENHUMA TABELA SAI DA MOLDURA DO SEU BLOCO.
 *
 * O DEFEITO, na letra dela (20/11/2026): «A minha tela ela é de 1360 por 768 pixels. E aí aqui na
 * leitura eu tenho […] uma tabela aqui dentro desse bloco. O que já é bom também tem tabela,
 * musicalidade também tem tabela e o que o grupo tem em comum também tem tabela. Só que por causa
 * da minha resolução no meu monitor as tabelas estão para fora da margem do bloco delas. Tá
 * quebrado isso.» E, para a decomposição do Estilo: «essa tabela está fora das dimensões aqui do
 * bloco dela por causa da resolução da minha tela.»
 *
 * PORQUE ACONTECE, e não é um `overflow:hidden` a faltar: `table { width: 100% }` é um **mínimo**
 * quando o texto não cabe. O conteúdo mínimo das células (a palavra mais longa, sem quebra) manda
 * na largura, a tabela cresce para fora, e — sem uma caixa que role — atravessa a moldura.
 *
 * O QUE SE MEDE, e é a geometria, não o gosto:
 *   A. A 1360×768 (a tela dela), cada tabela da LEITURA das anamneses cabe no seu bloco.
 *   B. …e a da DECOMPOSIÇÃO do Estilo também.
 *   C. Quando não cabe, há caixa que rola — e ela é alcançável pelo teclado (`tabindex="0"`).
 *      Uma tabela que rola mas não se alcança sem rato é meia correcção.
 *   D. Um controlo negativo: uma tabela LARGA de propósito continua a não transbordar, porque
 *      a caixa a contém. Sem isto, a prova passaria por a tabela ser estreita, e não pelo desenho.
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');
const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let provas = 0;
let falhas = 0;
function conferir(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('ok    ' + titulo); return; }
  falhas += 1;
  console.log('FALHA ' + titulo
    + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/* A página real da Produção, com o mínimo para ela montar: uma Sala, um exercício, uma Turma. */
const HTML = bastidores.paginaProducao('breu', {},
  [{ nome: 'Demi Plié', slug: 'demi-plie' }], [], 'Demi', 'demi-plie',
  [{ nome: 'Rosa', modalidade: 'bale-classico', professor: 'demi-plie' }],
  [{ id: 'plie', termo: 'Plié', categoria: 'passo' }], { 'sala-n': ['plie'] },
  [{ id: 'cu-n', professor: 'demi-plie', modalidade: 'bale-classico', turmas: ['Rosa'],
    alunas: ['A'], repertorio: ['Plié'], linhaDeBase: 'e' }],
  [{ id: 'padrao', nome: 'Padrão', professor: 'demi-plie', niveis: ['Ótimo'] }],
  [{ professor: 'demi-plie', turma: 'Rosa', ciclo: '01' }],
  { professores: new Set(['demi-plie']), turmas: new Set(['Rosa']),
    termos: new Set(['plie']), planos: 1 },
  null, 'sala-n', [], new Set(), { ok: true, contrato: null });

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8',
        fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(RAIZ, 'tools/templates/nav.js')));
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}

/** O que se mede de uma tabela: transborda o pai? e há caixa que role a contê-la? */
/* `raiz` — o id do contentor a medir. Sem ele varria-se a PÁGINA INTEIRA, e a primeira medida
 * apanhou o calendário (quatro colunas, largura zero porque está numa secção fechada): contava
 * como «tabela da leitura» e reprovava a leitura por um defeito que não era dela. Medir o conjunto
 * responde a outra pergunta. */
const MEDIR = (raiz) => {
  const out = [];
  const onde = raiz ? document.getElementById(raiz) : document;
  if (!onde) return out;
  onde.querySelectorAll('table').forEach((t) => {
    const pai = t.closest('.bloco-corpo') || t.parentElement;
    if (!pai) return;
    const a = t.getBoundingClientRect();
    const b = pai.getBoundingClientRect();
    // o ancestral que rola
    let rola = null;
    let n = t.parentElement;
    while (n && n !== document.body) {
      const ox = getComputedStyle(n).overflowX;
      if (ox === 'auto' || ox === 'scroll') { rola = n; break; }
      n = n.parentElement;
    }
    /* O QUE SE MEDE É O CONTENTOR VISÍVEL, NÃO A TABELA (20/11/2026).
     *
     * A primeira versão comparava `tabela.right` com `pai.right` e por isso REPROVAVA o caso certo:
     * uma tabela de 865px dentro de uma caixa de 362px que rola tem, de facto, o `right` fora do
     * pai — é o que rolar significa. O que não pode sair da moldura é a **caixa**. Quando não há
     * caixa, então sim é a tabela que tem de estar contida.
     *
     * A asserção estava a punir o desenho por fazer o que lhe pediram. Corrigida a medição, sobra
     * a pergunta que interessa: o que a pessoa vê está dentro da moldura, e o que não cabe rola. */
    const contentor = rola || t;
    const c = contentor.getBoundingClientRect();
    out.push({
      colunas: t.querySelectorAll('thead th').length,
      larguraTabela: Math.round(a.width),
      larguraPai: Math.round(b.width),
      larguraContentor: Math.round(c.width),
      transbordaPai: c.right > b.right + 1 || c.left < b.left - 1,
      rolaDeFacto: Boolean(rola) && t.scrollWidth > rola.clientWidth,
      /* O CORTE É O DEFEITO COMO ELE SE VÊ. «As tabelas estão para fora da margem do bloco» pode
       * querer dizer que a tabela atravessa, ou que o texto dela é espremido até não se ler. A
       * segunda não se vê na largura da tabela — vê-se célula a célula. */
      celulasCortadas: [...t.querySelectorAll('th,td')]
        .filter((c) => c.scrollWidth > c.clientWidth + 1).length,
      largurasDasColunas: [...t.querySelectorAll('thead th')]
        .map((h) => Math.round(h.getBoundingClientRect().width)),
      temCaixaQueRola: Boolean(rola),
      caixaAlcancavel: rola ? (rola.getAttribute('tabindex') === '0' || rola.tabIndex >= 0) : null,
    });
  });
  return out;
};

(async () => {
  const executavel = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((p) => fs.existsSync(p));
  if (!executavel) {
    console.log('(sem Chrome nesta máquina — a prova não corre, e não se declara passada)');
    process.exit(1);
  }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  const { srv, base } = await servir(HTML);
  const br = await puppeteer.launch({ executablePath: executavel,
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const pg = await br.newPage();
    /* A TELA DELA, e não uma qualquer: 1360×768 é a medida em que o defeito aparece. */
    await pg.setViewport({ width: 1360, height: 768 });
    await pg.goto(base + '/bastidores/estudio', { waitUntil: 'load' });
    /* ABRIR OS ANTEPASSADOS É PARTE DA MEDIÇÃO, e não preparação. Sem isto as tabelas estão dentro
     * de `<section hidden>` e de painéis de passo também `hidden` — `display:none` —, todas as
     * larguras dão ZERO, e as asserções passam por vacuidade. Uma prova que mede o vazio declara
     * passado o que nunca viu: é a armadilha que esta sessão já pagou cinco vezes.
     *
     * Sobe-se a árvore a partir do alvo e mostra-se cada `hidden` do caminho — é o que a pessoa faz
     * ao abrir a secção e o passo. O que NÃO se toca é o CSS: se o desenho for o culpado, ele
     * aparece na medição. */
    await pg.evaluate(() => {
      window.__revelar = (id) => {
        const alvo = document.getElementById(id);
        if (!alvo) return false;
        let n = alvo;
        while (n && n !== document.documentElement) {
          if (n.hidden) { n.hidden = false; n.removeAttribute('data-recolhido'); }
          const d = getComputedStyle(n);
          if (d.display === 'none') n.style.display = '';
          n = n.parentElement;
        }
        const c = document.getElementById('conteudo');
        if (c) c.hidden = false;
        return true;
      };
    });

    // ========================================================================
    console.log('\nA. A LEITURA DAS ANAMNESES — as quatro tabelas, a 1360×768');

    {
      /* OS NOMES SÃO OS DO CATÁLOGO, copiados de `porta/conteudo/anamnese.json` — «Flexibilidade
       * anteroposterior (grand écart)», «Resistência de MMSS (port de bras prolongado)» e os eixos
       * «Flexibilidade e Amplitude Articular», «Complexo Escapulo-Umeral e Cervical».
       *
       * PORQUE É QUE ISTO IMPORTA: a primeira versão desta bancada inventou nomes de palavras
       * curtas («Alinhamento do eixo vertical…»), mediu 330px numa coluna de 362 — cabia — e
       * declarou tudo certo. Depois repus o defeito e a bancada **continuou a passar**: não media
       * nada, só concordava com o desenho. O que ocupa largura não é a frase, é a PALAVRA MAIS
       * LONGA de cada célula, e as palavras reais deste catálogo («anteroposterior»,
       * «Escapulo-Umeral») são o que aperta a tabela. Uma fixture de palavras curtas mede a
       * fixture. */
      const A = [
        { nome: 'Flexibilidade anteroposterior (grand écart)',
          eixo: 'Flexibilidade e Amplitude Articular',
          texto: 'A aluna mantém a amplitude, mas perde o en dehors na descida.' },
        { nome: 'Resistência de MMSS (port de bras prolongado)',
          eixo: 'Complexo Escapulo-Umeral e Cervical',
          texto: 'O braço cai antes do fim da frase, e o ombro sobe para compensar.' },
      ];
      const c = { alunos: 2, com_recorte: 2, atencao: A, excelencia: A, musicalidade: A, comuns: A };
      const abriu = await pg.evaluate((dados) => {
        window.__revelar('lb-leitura');
        pintarClassificacao(dados);
        return document.getElementById('lb-leitura').getBoundingClientRect().width > 0;
      }, c);
      conferir('a leitura abriu e tem largura (senão media-se o vazio)', abriu, abriu);
      await new Promise((r) => setTimeout(r, 250));
      const medidas = await pg.evaluate(MEDIR, 'lb-leitura');
      /* SÓ AS DA LEITURA: a página tem outras tabelas (o calendário, a composição), e medir o
       * conjunto responderia a outra pergunta. As da leitura são as de três colunas dentro de um
       * `.bloco-corpo`. */
      conferir('as tabelas da leitura existem e têm largura (as secções estão abertas)',
        medidas.length >= 4 && medidas.every((m) => m.larguraTabela > 0), medidas);
      conferir('…e NENHUMA transborda o bloco a 1360 px',
        medidas.every((m) => !m.transbordaPai), medidas);
      console.log('      medidas: ' + JSON.stringify(medidas.map((m) => ({
        col: m.colunas, tabela: m.larguraTabela, bloco: m.larguraPai,
        caixa: m.larguraContentor, rola: m.rolaDeFacto }))));
      conferir('…e NENHUMA célula tem o texto espremido até ao corte',
        medidas.every((m) => m.celulasCortadas === 0),
        medidas.map((m) => ({ colunas: m.colunas, cortadas: m.celulasCortadas,
          larguras: m.largurasDasColunas })));
      conferir('…e cada uma está dentro de uma caixa que rola, para o que não couber',
        medidas.every((m) => m.temCaixaQueRola), medidas);
      conferir('…e essa caixa é alcançável pelo teclado',
        medidas.every((m) => m.caixaAlcancavel === true), medidas);
    }

    // ========================================================================
    console.log('\nB. A DECOMPOSIÇÃO DO ESTILO — a tabela de seis colunas');

    {
      await pg.evaluate(() => {
        window.__revelar('vb-tabela');
        /* O `#vbnome` É UM `<SELECT>`, e a primeira versão da bancada escrevia-lhe
         * `value = 'Plié'`. Um `<select>` cujo valor não existe entre as opções fica em `''` — e
         * `pintarTabela` sai pelo caminho do «sem exercício», esvazia o alvo, e a asserção media
         * zero linhas. A bancada punha o nome, o select recusava-o em silêncio, e a falha
         * aparecia como «a decomposição não foi pintada» — um defeito que não existe. Acrescenta-se
         * a OPÇÃO, que é o que o dicionário faria. */
        const nome = document.getElementById('vbnome');
        if (nome) {
          nome.add(new Option('Plié', 'Plié'));
          nome.value = 'Plié';
        }
        // Os trechos, com o texto longo que empurra a tabela na tela dela.
        const linhas = [];
        for (let i = 1; i <= 4; i += 1) {
          linhas.push({ dir: 'frente', k: i + '|2/4',
            c: { compasso: '1', contagem: '1–2', direcao: 'frente', orientacao: 'en dehors',
              sinais: ['ED', '1ª', '↓'], descricao: 'Flexão contínua dos joelhos mantendo o en dehors absoluto.' } });
        }
        /* A DECOMPOSIÇÃO LÊ `CELULAS` — `trechosEmOrdem()` varre-o por direção. A bancada punha
         * `LINHAS`, que não existe em lado nenhum: `pintarTabela` via zero trechos, esvaziava o
         * alvo, e a asserção media o vazio. Uma fixture com o nome errado não falha — pinta a
         * mensagem de vazio e passa por boa. */
        CELULAS = { frente: linhas.map((l) => l.c) };
        pintarTabela();
      });
      await new Promise((r) => setTimeout(r, 250));
      const medidas = await pg.evaluate(MEDIR, 'vb-tabela');
      const daDecomposicao = medidas.filter((m) => m.colunas === 6);
      conferir('a tabela da decomposição foi pintada, com as seis colunas',
        daDecomposicao.length === 1, medidas);
      conferir('…e NÃO transborda o bloco a 1360 px',
        daDecomposicao.every((m) => !m.transbordaPai), daDecomposicao);
      console.log('      medidas: ' + JSON.stringify(daDecomposicao.map((m) => ({
        col: m.colunas, tabela: m.larguraTabela, bloco: m.larguraPai,
        caixa: m.larguraContentor, rola: m.rolaDeFacto }))));
      /* A ASSERÇÃO QUE APANHA O DEFEITO DELA — e que faltava.
       *
       * `overflow-x: auto` sozinho não corrige nada: `table { width: 100% }` manda a tabela caber
       * SEMPRE, o browser reparte as seis colunas pelos 364px do bloco, e cada uma fica com 55px —
       * onde cabem duas palavras. A tabela «não transborda», as células «não cortam nada», e o
       * texto lê-se aos pedaços. Foi por isso que a versão anterior desta prova passou com o
       * defeito reposto: media o transbordo e o corte, e o defeito não é nenhum dos dois. É a
       * coluna espremida.
       *
       * 7rem é o mínimo que a casa declara por coluna (`.rolagem-caixa > table` na folha), e é o
       * número que quem monta a tabela escreve em `--colunas`. Aqui mede-se o resultado: nenhuma
       * coluna abaixo disso. */
      conferir('…e NENHUMA das seis colunas foi espremida abaixo de 100px (o mínimo da folha é 6,5rem = 104px)',
        daDecomposicao.every((m) => m.largurasDasColunas.every((l) => l >= 100)),
        daDecomposicao.map((m) => m.largurasDasColunas));
      conferir('…e está dentro de uma caixa que rola, alcançável pelo teclado',
        daDecomposicao.every((m) => m.temCaixaQueRola && m.caixaAlcancavel === true),
        daDecomposicao);
    }

    // ========================================================================
    console.log('\nC. CONTROLO NEGATIVO — uma tabela larga de propósito continua contida');

    {
      await pg.evaluate(() => {
        const alvo = document.getElementById('lb-leitura');
        const bloco = alvo.querySelector('.bloco-corpo');
        if (!bloco) return;
        bloco.innerHTML = '<div class="rolagem-caixa" tabindex="0"><table><thead><tr>'
          + Array.from({ length: 12 }, (_, i) => '<th>coluna-' + i + '-com-nome-longo</th>').join('')
          + '</tr></thead><tbody><tr>'
          + Array.from({ length: 12 }, () => '<td>um conteúdo que não cabe de maneira nenhuma</td>').join('')
          + '</tr></tbody></table></div>';
      });
      await new Promise((r) => setTimeout(r, 200));
      const medidas = await pg.evaluate(MEDIR, 'lb-leitura');
      const larga = medidas.find((m) => m.colunas === 12);
      conferir('uma tabela de doze colunas cabe na moldura — porque a caixa a contém',
        Boolean(larga) && larga.transbordaPai === false, larga);
      conferir('…e ela ROLA de facto (a tabela é mais larga do que a caixa)',
        Boolean(larga) && larga.rolaDeFacto === true, larga);
    }
  } finally {
    await br.close();
    srv.close();
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: a 1360×768, as quatro tabelas da leitura das '
      + 'anamneses e a tabela de seis colunas da decomposição do Estilo ficam DENTRO da moldura '
      + 'do seu bloco, cada uma numa caixa que rola e que se alcança pelo teclado — e uma tabela '
      + 'larga de propósito continua contida, o que prova que é o desenho e não a sorte.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
