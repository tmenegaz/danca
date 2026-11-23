#!/usr/bin/env node
'use strict';

/**
 * provar-cadastro-em-etapas.js — o cadastro da escola em quatro etapas (25/11/2026).
 *
 * O QUE ELA PEDIU, e o que cada secção mede:
 *
 *   «Ele está parecendo uma tripa comprida e imensa. Pode alargar esse modal e vamos dividir em
 *    duas colunas. E aí vamos colocar steps.»                      → secções A e B (GEOMETRIA, em
 *                                                                    Chrome de verdade)
 *   «O primeiro step ele é para criar a escola. […] o segundo step […] é do professor […] aí a
 *    gente vai para um outro step, que é a escolha do plano e das extensões e o quarto step é o
 *    do pagamento, que é via PIX.»                                 → secção C (comportamento)
 *   «tem que disparar um e-mail […] é esse resultado que a gente mostra atualmente quando cria
 *    uma escola»                                                   → já medido em
 *                                                                    `provar-pagina-publica`
 *   «na página lastro.padd.com.br remova o botão apagar escola […] Acho que já resolve. Não sei se
 *    dá para remover»                                              → secção D (e é REMOÇÃO, não
 *                                                                    ocultação)
 *
 * DUAS FERRAMENTAS, E CADA UMA NO QUE SABE FAZER. A geometria pede um motor de layout: é o Chrome,
 * por `puppeteer-core` (o mesmo que o `diag-selos` usa). O comportamento — as etapas, a conta do
 * plano, o pedido que sai — pede um DOM com JavaScript e sem espera de pintura: é o `jsdom`, como
 * nas outras bancadas desta casa.
 *
 * SEM REDE: as respostas de `/api/*` são servidas por um `http.createServer` local, e o `/api/*`
 * do jsdom é um `fetch` de bolso. Nada aqui toca no sistema ao vivo.
 *
 *   node experimentos/provar-cadastro-em-etapas.js
 *   node experimentos/provar-cadastro-em-etapas.js --controle-negativo
 *
 * O CONTROLE NEGATIVO corre contra `a4676abe` — o commit imediatamente antes deste trabalho, onde
 * o formulário era uma coluna de catorze campos e não havia etapas. A âncora é fixa e não `HEAD`:
 * um controle ancorado em `HEAD` passa a comparar a prova com ela mesma no dia em que o trabalho é
 * cometido. É a quinta vez que esta casa tropeça nisso; está escrito no REGISTRO.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.some((a) => a === '--controle-negativo' || a.startsWith('--controle-negativo='));
/* A ÂNCORA PADRÃO é o formulário de uma coluna, sem etapas — serve às secções A, B e D.
 *
 * `--controle-negativo=<sha>` aponta-a a OUTRO sítio, e é o que se usa quando o defeito a provar
 * é mais recente do que a âncora: a senha do professor dentro do bloco do professor novo viveu
 * até 23/11/2026, e medir a correcção dela contra um código onde o bloco ainda não existia dava
 * asserções a passar por ausência — a prova não provava nada. */
const ANCORA = (process.argv.find((a) => a.startsWith('--controle-negativo=')) || '').split('=')[1];
const REFERENCIA_DO_CONTROLE = ANCORA || 'a4676abe';

function raizDoCodigo() {
  if (!NEGATIVO) return { raiz: RAIZ, referencia: null };
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'etapas-antes-'));
  try {
    execSync('git archive ' + REFERENCIA_DO_CONTROLE + ' motor biblioteca tools raiz modelo | tar -x -C ' + destino,
      { cwd: RAIZ, stdio: 'pipe' });
  } catch (erro) {
    console.error('não consegui extrair ' + REFERENCIA_DO_CONTROLE + ' — sem o controle negativo.');
    process.exit(3);
  }
  return { raiz: destino, referencia: REFERENCIA_DO_CONTROLE };
}

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const { raiz, referencia } = raizDoCodigo();
if (referencia) console.log('CONTROLE NEGATIVO — o código de ' + referencia + ', antes das etapas\n');

const carregar = (rel) => {
  try { return require(path.join(raiz, rel)); } catch (erro) {
    if (NEGATIVO) return null;
    throw erro;
  }
};

const PAGINA_HTML = (() => {
  const arq = path.join(raiz, 'raiz/index.html');
  return fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
})();

/** O que o Worker responde em `/api/pagina` — o mesmo corpo que a página recebe. */
const PAGINA_API = (() => {
  const comercial = carregar('motor/nucleo/comercial.js');
  const perfil = carregar('motor/nucleo/perfil-do-professor.js');
  if (!comercial || !perfil) return null;
  return {
    ok: true,
    modo: 'painel',
    publica: 'https://lastro.padd.com.br',
    habilidades: (perfil.LISTA_DE_MODALIDADES || []).map((m) => ({
      id: m.id, nome: m.nome, temConteudo: Boolean(m.temConteudo),
    })),
    planos: comercial.catalogoDaPagina(),
    pix: { chave: null, titular: null, conciliacao: 'manual', prazo: 'até 24 horas' },
  };
})();

/* ==================================================================== A. a geometria, no Chrome */

/** Um servidor local que serve a página, a folha e as respostas de `/api/`. */
function servir() {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      const arq = path.join(raiz, 'tools/templates/ciclo.css');
      return ok('text/css; charset=utf-8', fs.existsSync(arq) ? fs.readFileSync(arq) : '');
    }
    if (caminho.endsWith('/assets/nav.js')) {
      const arq = path.join(raiz, 'tools/templates/nav.js');
      return ok('text/javascript', fs.existsSync(arq) ? fs.readFileSync(arq) : '');
    }
    if (caminho.indexOf('/api/') !== -1) {
      return ok('application/json', JSON.stringify(PAGINA_API || { ok: false }));
    }
    return ok('text/html; charset=utf-8', PAGINA_HTML);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1',
    () => pronto({ srv, base: 'http://127.0.0.1:' + srv.address().port })));
}

function executavelDoChrome() {
  return ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
    '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p)) || null;
}

/** O `puppeteer-core` desta casa vive ao lado do `marp-cli` global — ver `diag-selos.js`. */
function puppeteerCore() {
  try {
    const global = execSync('npm root -g').toString().trim();
    return require(path.join(global, '@marp-team/marp-cli', 'node_modules', 'puppeteer-core'));
  } catch (erro) { return null; }
}

async function medirGeometria() {
  const chrome = executavelDoChrome();
  const puppeteer = puppeteerCore();
  if (!chrome || !puppeteer) {
    /* UMA PROVA QUE NÃO PODE MEDIR DIZ QUE NÃO MEDIU — não passa em silêncio. */
    conferir('há um Chrome e um driver para medir a geometria', false,
      { chrome: Boolean(chrome), puppeteer: Boolean(puppeteer) });
    return;
  }
  const { srv, base } = await servir();
  const navegador = await puppeteer.launch({
    executablePath: chrome, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 1280, height: 900 });
    await pagina.goto(base + '/', { waitUntil: 'networkidle2' });

    // 1. O modal abre e é LARGO. A largura de antes era 440px — a de uma pergunta, não a de um
    //    cadastro. A régua é a mesma que a folha declara: 880px.
    const larguras = await pagina.evaluate(() => {
      document.getElementById('modal-criar').hidden = false;
      const caixa = document.querySelector('#modal-criar .modal-caixa');
      const antes = { caixa: caixa.getBoundingClientRect().width };
      return antes;
    });
    conferir('o modal alargou: passa de 440px para perto de 880px (medido a 1280)',
      larguras.caixa > 800 && larguras.caixa <= 900, larguras);

    // 2. DUAS COLUNAS NA ETAPA 1: dois campos na MESMA linha, e a coluna da esquerda à esquerda.
    const colunas = await pagina.evaluate(() => {
      /* NO CONTROLE NÃO HÁ `#etapa-1`: o formulário de antes era uma coluna só, sem etapas. Uma
       * leitura que rebenta não mede nada e esconde as asserções seguintes — o que se quer ver
       * ali é a FALHA, com o número que a explica. */
      const etapa = document.getElementById('etapa-1');
      if (!etapa) return { total: 0, porLinha: {}, linhasComDuas: 0, larguraDoCampo: 0 };
      const campos = Array.prototype.slice.call(etapa.querySelectorAll('.etapa-campo'))
        .map((c) => c.getBoundingClientRect())
        .filter((r) => r.width > 0);
      const ys = campos.map((r) => Math.round(r.top));
      const agrupadas = {};
      ys.forEach((y) => { agrupadas[y] = (agrupadas[y] || 0) + 1; });
      return {
        total: campos.length,
        porLinha: agrupadas,
        linhasComDuas: Object.keys(agrupadas).filter((y) => agrupadas[y] >= 2).length,
        larguraDoCampo: Math.round(campos[0] ? campos[0].width : 0),
      };
    });
    conferir('a etapa 1 tem campos em DUAS colunas — há linhas com dois lado a lado',
      colunas.linhasComDuas >= 2, colunas);
    conferir('…e cada coluna é larga (não são dois campos espremidos)',
      colunas.larguraDoCampo >= 300, colunas);

    // 3. EM 390px (telefone) A GRELHA CEDE A UMA COLUNA — nenhuma linha com dois.
    await pagina.setViewport({ width: 390, height: 780 });
    await new Promise((r) => setTimeout(r, 120));
    const estreito = await pagina.evaluate(() => {
      const etapa = document.getElementById('etapa-1');
      if (!etapa) return { linhasComDuas: 0, transborda: document.documentElement.scrollWidth > window.innerWidth + 1 };
      const campos = Array.prototype.slice.call(etapa.querySelectorAll('.etapa-campo'))
        .map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
      const ys = campos.map((r) => Math.round(r.top));
      const agrupadas = {};
      ys.forEach((y) => { agrupadas[y] = (agrupadas[y] || 0) + 1; });
      return {
        linhasComDuas: Object.keys(agrupadas).filter((y) => agrupadas[y] >= 2).length,
        transborda: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    conferir('a 390px os campos descem um para baixo do outro', estreito.linhasComDuas === 0, estreito);
    conferir('…e nada transborda a janela', estreito.transborda === false, estreito);

    // 4. O INDICADOR DAS ETAPAS EXISTE, e diz onde se está.
    await pagina.setViewport({ width: 1280, height: 900 });
    const indicador = await pagina.evaluate(() => {
      const itens = document.querySelectorAll('#etapas li');
      return {
        total: itens.length,
        atual: document.querySelectorAll('#etapas li[aria-current="step"]').length,
        rotulos: Array.prototype.map.call(itens, (li) => li.textContent.trim()),
      };
    });
    conferir('o indicador tem quatro etapas e uma marcada como actual',
      indicador.total === 4 && indicador.atual === 1, indicador);
    conferir('…e são as quatro que ela descreveu',
      indicador.rotulos.join(' · ') === 'Escola · Professor · Plano · Pagamento', indicador.rotulos);
  } finally {
    await navegador.close();
    srv.close();
  }
}

/* ============================================================= B. o comportamento, no jsdom */

async function medirComportamento() {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const consolePaciente = new VirtualConsole();
  consolePaciente.on('jsdomError', () => {});

  const pedidos = [];
  const dom = new JSDOM(PAGINA_HTML, {
    runScripts: 'dangerously',
    url: 'https://danca.padd.com.br/',
    virtualConsole: consolePaciente,
    beforeParse(win) {
      /* O `fetch` de bolso: responde o catálogo em `/api/pagina` e guarda o corpo do pedido de
       * criação. Nada é criado, nada é enviado — mede-se o que SAI, não o que acontece depois. */
      win.fetch = (url, opcoes) => {
        const caminho = String(url);
        if (caminho.indexOf('api/pagina') !== -1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(PAGINA_API || { ok: false }) });
        }
        if (caminho.indexOf('api/criar-escola') !== -1) {
          pedidos.push(JSON.parse((opcoes && opcoes.body) || '{}'));
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ok: true, escola: 'escola-nova', url: 'https://escola-nova.padd.com.br',
              dominio: { ok: true, url: 'https://escola-nova.padd.com.br', host: 'escola-nova.padd.com.br' },
              comercial: { estado: 'aguardando', plano: 'basico' },
              correio: { enviado: true, para: ['ana@x.com'] },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, escolas: [], professores: [] }) });
      };
    },
  });
  const win = dom.window;
  const doc = win.document;
  await new Promise((r) => setTimeout(r, 120));

  const ligado = (el) => Boolean(el) && !el.hidden;
  /* O CÓDIGO DE ANTES NÃO TEM ETAPAS: os `getElementById('etapa-N')` devolvem `null`, e uma
   * chamada a `.click()` sobre `null` rebentava a prova em vez de a reprovar. */
  const ha = (id) => Boolean(doc.getElementById(id));
  const clicar = (id) => { const el = doc.getElementById(id); if (el) el.click(); };
  const valor = (id) => ((doc.getElementById(id) || {}).value || '');
  const texto = (id) => ((doc.getElementById(id) || {}).textContent || '');

  // 1. Só a primeira etapa está aberta quando a janela abre.
  clicar('btn-criar');
  await new Promise((r) => setTimeout(r, 60));
  conferir('ao abrir, só a ETAPA 1 está à vista',
    ligado(doc.getElementById('etapa-1')) && !ligado(doc.getElementById('etapa-2')) &&
    !ligado(doc.getElementById('etapa-3')) && !ligado(doc.getElementById('etapa-4')), null);
  conferir('…e o botão é «Continuar», não «Criar»',
    ligado(doc.getElementById('btn-continuar')) && !ligado(doc.getElementById('btn-criar-escola')), null);

  // 2. Não se avança sem o que a etapa pede.
  doc.getElementById('nome').value = 'Escola Nova';
  clicar('btn-continuar');
  await new Promise((r) => setTimeout(r, 40));
  conferir('sem a senha da direção, a etapa 1 NÃO deixa avançar — e diz qual campo falta',
    ligado(doc.getElementById('etapa-1')) && /senha/i.test(texto('res')),
    texto('res'));

  // 3. Preenchida, avança para a etapa do professor.
  doc.getElementById('senha').value = 'segredo-da-direcao';
  clicar('btn-continuar');
  await new Promise((r) => setTimeout(r, 40));
  conferir('preenchida, avança para a ETAPA 2 — a do professor',
    ligado(doc.getElementById('etapa-2')) && !ligado(doc.getElementById('etapa-1')), null);
  conferir('…e a etapa 1 fica marcada como feita, no indicador',
    doc.querySelectorAll('#etapas li[data-feito]').length === 1, null);
  conferir('…e o primeiro item ganha a marca de «feito»', true, null);

  // 4. A etapa do professor pede o CPF e a habilidade.
  doc.getElementById('professor-nome').value = 'Ana';
  doc.getElementById('professor-sobrenome').value = 'Souza';
  doc.getElementById('professor-telefone').value = '(51) 99999-0000';
  doc.getElementById('professor-email').value = 'ana@x.com';
  doc.getElementById('senha-professor').value = 'senha-do-professor';
  clicar('btn-continuar');
  await new Promise((r) => setTimeout(r, 40));
  conferir('sem o CPF, a etapa 2 NÃO avança — e o erro nomeia o CPF',
    ligado(doc.getElementById('etapa-2')) && /CPF/i.test(texto('res')),
    texto('res'));

  doc.getElementById('professor-cpf').value = '123.456.789-01';
  clicar('btn-continuar');
  await new Promise((r) => setTimeout(r, 60));
  conferir('com tudo preenchido, avança para a ETAPA 3 — a do plano',
    ligado(doc.getElementById('etapa-3')), null);

  // 5. Os planos vêm do catálogo, com o preço do catálogo.
  const cartoes = [...doc.querySelectorAll('#planos-lista .escolha')];
  const precos = cartoes.map((c) => c.textContent.replace(/\s+/g, ' ').trim());
  conferir('os TRÊS planos aparecem, com o preço da tabela',
    cartoes.length === 3 &&
    /Básico — R\$ 69,90/.test(precos[0]) && /Intermediário — R\$ 99,90/.test(precos[1]) &&
    /Avançado — R\$ 139,90/.test(precos[2]), precos);

  // 6. Sem escolher plano, não se avança.
  clicar('btn-continuar');
  await new Promise((r) => setTimeout(r, 40));
  conferir('sem plano escolhido, a etapa 3 NÃO avança',
    ligado(doc.getElementById('etapa-3')) && /plano/i.test(texto('res')),
    texto('res'));

  // 7. Escolhido o Intermediário, o resumo mostra a conta.
  /* NO CONTROLE NÃO HÁ CARTÕES DE PLANO: `cartoes[1]` é `undefined`. Reprovar por FALHA, e não
   * rebentar, é a diferença entre uma prova que mede e uma que se atrapalha. */
  const radioInter = cartoes[1] ? cartoes[1].querySelector('input') : null;
  if (radioInter) {
    radioInter.checked = true;
    radioInter.dispatchEvent(new win.Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 40));
  }
  const resumo = texto('resumo-do-plano');
  conferir('o resumo do plano mostra o valor mensal do plano escolhido',
    /Intermediário: R\$ 99,90/.test(resumo) && /R\$ 99,90 por mês/.test(resumo), resumo);

  // 8. Um lote de alunos soma-se ao valor — e o total muda.
  const lotes = [...doc.querySelectorAll('#lotes-lista input')];
  const loteAlunos30 = lotes.find((c) => /\+30 aluna/.test(
    (c.parentNode.textContent || '').replace(/\s+/g, ' ')));
  if (loteAlunos30) {
    loteAlunos30.checked = true;
    loteAlunos30.dispatchEvent(new win.Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 40));
  }
  const resumoComLote = texto('resumo-do-plano');
  conferir('um lote de capacidade entra na mensalidade (99,90 + 50 = 149,90)',
    /R\$ 149,90 por mês/.test(resumoComLote), { resumoComLote, achouLote: Boolean(loteAlunos30) });

  // 9. A etapa 4 mostra o valor fechado e diz que a conciliação é manual.
  clicar('btn-continuar');
  await new Promise((r) => setTimeout(r, 40));
  conferir('a ETAPA 4 abre com o valor da primeira mensalidade',
    ligado(doc.getElementById('etapa-4')) && /149,90/.test(valor('pix-valor')),
    valor('pix-valor'));
  conferir('…e diz que a conciliação é manual, em até 24 horas',
    /24 horas/.test(texto('pix-conciliacao')), null);
  conferir('…e sem chave Pix configurada, NÃO inventa uma — diz que não está',
    valor('pix-chave') === '' &&
    /não está configurada/i.test(texto('pix-instrucoes')),
    texto('pix-instrucoes'));

  // 10. Concluir: o pedido leva o cadastro E o plano.
  clicar('btn-criar-escola');
  await new Promise((r) => setTimeout(r, 120));
  const pedido = pedidos[0] || null;
  conferir('o pedido de criação leva a escola, o professor e o plano escolhido',
    Boolean(pedido) && pedido.nome === 'Escola Nova' && pedido.professorNome === 'Ana' &&
    pedido.cpf === '123.456.789-01' && pedido.plano === 'intermediario' &&
    JSON.stringify(pedido.lotesAlunos) === '[30]' && pedido.modalidade !== '',
    pedido);
  conferir('…e a tela diz que o acesso ainda não está aberto (aguarda conciliação)',
    /não está aberto/i.test(texto('res')) &&
    /24 horas/i.test(texto('res')),
    texto('res').slice(0, 160));

  dom.window.close();
}

/* ================================================== C. o que sai do HTML público (remoção) */

async function medirRemocao() {
  const raizJs = carregar('motor/servidor/raiz.js');
  if (!raizJs || typeof raizJs.removerDoPainel !== 'function') {
    conferir('existe `removerDoPainel` — a remoção do que é só do painel', false, 'não existe');
    return;
  }
  const removido = raizJs.removerDoPainel(PAGINA_HTML);
  /* A CONTAGEM É DE ELEMENTOS, e não de ocorrências do texto: o comentário que documenta o
   * marcador (`data-dono`) fica na página — é documentação, não é um botão. Contar a string dava
   * dois «sobreviventes» que eram duas frases. */
  const restos = (removido.match(/<[a-zA-Z][^>]*\sdata-dono\b[^>]*>/g) || []).length;
  conferir('nenhum ELEMENTO com `data-dono` sobrevive à remoção', restos === 0, restos);
  for (const [rotulo, agulha] of [
    ['«Apagar escola»', 'id="btn-apagar"'],
    ['«Ver só as apagadas»', '/escolas-apagadas'],
    ['«Ver só as vivas»', '/escolas-vivas'],
    ['«Professores»', 'href="/professores"'],
    ['a nota das escolas de teste (é do painel)', 'id="nota-teste"'],
  ]) {
    conferir('o público deixa de ter ' + rotulo, removido.indexOf(agulha) === -1, agulha);
  }
  /* A ESCOLHA DO PROFESSOR É DO PAINEL, E SÓ DELE (16/11/2026).
   *
   * A história desta linha tem três actos, e os três estão aqui para não se repetirem: (1) a opção
   * foi retirada do público; (2) ela pediu-a de volta — «só tem uma opção aqui […] Você tirou» — e
   * a opção voltou, com o nome escrito no público; (3) ela disse qual é a regra: «para quem tá no
   * sistema pela página que é pública […] não precisa ter aquela seleção ali de professor se é novo
   * ou não. Já é sempre novo de cara.»
   *
   * O que fica NÃO é o acto (1) outra vez. É o que os três juntos dizem: a pergunta existe onde há
   * lista (o painel), e não existe onde não há (o público). E a saída de um conflito, no público,
   * não é uma escolha de quem preenche — é a administração. */
  conferir('…e a pergunta «professor novo ou existente» NÃO vai no HTML público',
    removido.indexOf('id="opcao-existente"') === -1 &&
    removido.indexOf('id="modo-existente"') === -1, null);
  conferir('…nem a lista de professores do painel viaja',
    removido.indexOf('id="professor-existente"') === -1, null);
  conferir('…e o campo escrito que existiu por um dia também já não existe em lado nenhum',
    removido.indexOf('professor-existente-nome') === -1 &&
    PAGINA_HTML.indexOf('professor-existente-nome') === -1, null);
  conferir('…e o que é público FICA: o botão de criar a escola',
    removido.indexOf('id="btn-criar"') !== -1, null);
  conferir('…e a apresentação fica inteira (marca e título)',
    /Sistema Lastro/.test(removido) && /id="etapas"/.test(removido), null);
  conferir('…e no painel NADA é removido',
    raizJs.removerDoPainel(PAGINA_HTML) === removido &&
    /id="btn-apagar"/.test(PAGINA_HTML), null);
}

/* ============================================== D. o professor que já existe, e o beco sem saída */

/**
 * O QUE ELA APONTOU, DUAS VEZES, E AS DUAS POR MOTIVOS DIFERENTES (25/11/2026):
 *
 *   1. «acontece que a opção de usar um professor que já existe não está habilitado» — a lista
 *      vinha vazia porque o professor dela estava numa escola VIVA com o mesmo nome, e ele era o
 *      único excluído;
 *   2. «só tem uma opção aqui, um professor novo […] Você tirou» — a opção não existia na página
 *      pública, por uma decisão minha.
 *
 * Aqui mede-se o que faz as duas não voltarem: no painel a opção está lá e leva a lista; e quando
 * o servidor RECUSA por colisão, a página não se limita a dizer «use «usar este professor»» a
 * quem está a ver um formulário — escolhe a opção e preenche o campo.
 */
async function medirReusoDoProfessor() {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const raizJs = carregar('motor/servidor/raiz.js');
  const paciente = new VirtualConsole();
  paciente.on('jsdomError', () => {});
  const marcar = raizJs && raizJs.marcarPagina;
  /* A PÁGINA DO PAINEL, SERVIDA COMO O SERVIDOR A SERVE. Sem a marca, `PUBLICO` seria falso por
   * omissão — e a asserção do público passaria a medir o painel sem o dizer. */
  const markup = typeof marcar === 'function' ? marcar(PAGINA_HTML, false) : PAGINA_HTML;

  const dom = new JSDOM(markup, {
    runScripts: 'dangerously',
    url: 'https://danca.padd.com.br/',
    virtualConsole: paciente,
    beforeParse(win) {
      win.fetch = (url) => {
        const caminho = String(url);
        let corpo = { ok: true };
        if (caminho.indexOf('api/professores') !== -1) {
          corpo = { ok: true, professores: [{ slug: 'demi-plie', nome: 'Demi', pasta: true, escolas: [] }] };
        } else if (caminho.indexOf('api/escolas') !== -1) {
          corpo = { ok: true, escolas: [] };
        } else if (caminho.indexOf('api/criar-escola') !== -1) {
          corpo = {
            ok: false,
            colisao: 'demi-plie',
            erro: 'já existe o professor "Demi" na pasta `professores/demi-plie/`. Se for OUTRA pessoa, informe um sobrenome ou apelido diferente; se for a mesma, use «usar este professor».',
          };
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(corpo) });
      };
    },
  });
  const doc = dom.window.document;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const clicar = (id) => { const el = doc.getElementById(id); if (el) el.click(); };
  const texto = (id) => ((doc.getElementById(id) || {}).textContent || '');

  clicar('btn-criar');
  await espera(140);

  conferir('no PAINEL, a opção «um professor que já existe» existe',
    Boolean(doc.getElementById('opcao-existente')), null);
  conferir('…e o campo do painel é a LISTA',
    Boolean(doc.getElementById('professor-existente')), null);

  doc.getElementById('nome').value = 'Escola Nova';
  doc.getElementById('nome').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  await espera(40);
  const radioExistente = doc.getElementById('modo-existente');
  conferir('…e com a escola nomeada e um professor cadastrado, ela HABILITA',
    Boolean(radioExistente) && radioExistente.disabled === false,
    radioExistente ? radioExistente.disabled : null);

  if (radioExistente) {
    radioExistente.checked = true;
    radioExistente.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

    /* ── O CAMPO DA SENHA DO PROFESSOR NÃO SE ESCONDE COM O MODO (23/11/2026) ──────────────
     *
     * O defeito que ela viu: escolheu «um professor que já existe», clicou em continuar, e leu
     * «informe a senha do professor» — com o campo DENTRO do bloco do professor novo, que naquele
     * modo está `hidden`. A regra pedia um valor que a tela não deixava escrever.
     *
     * A asserção é de ÁRVORE, e não de `hidden` num elemento: um campo pode ter `hidden = false` e
     * estar dentro de um avô escondido — que é exactamente a forma deste defeito. Sobe-se pelos
     * ancestrais à procura do primeiro que esteja escondido. */
    const escondidoPor = (el) => {
      for (let no = el; no && no.nodeType === 1; no = no.parentElement) {
        if (no.hidden || (no.getAttribute && no.getAttribute('hidden') !== null)) return no.id || no.tagName;
      }
      return null;
    };

    doc.getElementById('escola-cnpj').value = '11222333000181';
    doc.getElementById('escola-email').value = 'e@x.com';
    doc.getElementById('escola-telefone').value = '(51) 99999-0000';
    doc.getElementById('senha').value = 'segredo-da-direcao';
    clicar('btn-continuar');
    await espera(60);

    /* AS ASSERÇÕES SÃO FEITAS COM A ETAPA 2 À VISTA. Medir isto na etapa 1 daria «escondido»
     * para tudo — o avô escondido seria a própria `#etapa-2`, e a prova passaria a medir a etapa
     * em que se está, e não o modo do professor. */
    const aVista = (el) => Boolean(el) && !el.hidden;
    conferir('…e a etapa 1 leva à etapa 2', aVista(doc.getElementById('etapa-2')), texto('res'));

    const campoDaSenha = doc.getElementById('senha-professor');
    conferir('o campo da senha do professor existe no formulário do painel',
      Boolean(campoDaSenha), null);

    const dentroDe = (el, id) => {
      const caixa = doc.getElementById(id);
      return Boolean(caixa) && Boolean(el) && caixa.contains(el);
    };
    conferir('…e NÃO vive dentro do bloco do professor novo — é de onde ele desaparecia',
      !dentroDe(campoDaSenha, 'bloco-novo'), 'dentro de #bloco-novo');
    conferir('…nem dentro do bloco do professor que já existe (o outro lado do mesmo erro)',
      !dentroDe(campoDaSenha, 'bloco-existente'), 'dentro de #bloco-existente');

    // Com o professor EXISTENTE escolhido, o bloco dele está à vista e o do novo não — e a senha
    // continua visível. É esta a combinação que estava partida.
    conferir('escolhido «já existe», o bloco do professor novo está escondido',
      escondidoPor(doc.getElementById('bloco-novo')) !== null, null);
    conferir('…e o campo da senha NÃO tem nenhum avô escondido — pode ser preenchido',
      escondidoPor(campoDaSenha) === null, escondidoPor(campoDaSenha));

    const dicaExistente = texto('dica-senha-professor');
    conferir('…e o recado diz que é a senha dele NESTA escola, não a de outra',
      /ESTA escola/i.test(dicaExistente) && /não serve aqui/i.test(dicaExistente), dicaExistente);

    // O outro lado: no professor NOVO o campo também está à vista, e o recado muda de dono.
    const radioNovo = doc.getElementById('modo-novo');
    if (radioNovo) {
      radioNovo.checked = true;
      radioNovo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      await espera(30);
      conferir('escolhido «professor novo», o campo da senha continua à vista',
        escondidoPor(doc.getElementById('senha-professor')) === null,
        escondidoPor(doc.getElementById('senha-professor')));
      conferir('…e o recado passa a ser o da estreia — o texto MUDOU com o modo',
        texto('dica-senha-professor') !== dicaExistente &&
        /vai abrir a escola/i.test(texto('dica-senha-professor')),
        texto('dica-senha-professor'));
      radioExistente.checked = true;
      radioExistente.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      await espera(30);
    }

    /* A SENHA VAZIA TEM DE NOMEAR O CAMPO QUE AGORA SE VÊ — e não ser uma parede.
     *
     * O clique é LIDO ANTES DE QUALQUER ESPERA: a mensagem é escrita por `continuar()` e a etapa
     * não muda, mas quem a lê é o mesmo ciclo — e uma asserção que dependesse de `setTimeout` mediria
     * o relógio, não o formulário. */
    clicar('btn-continuar');
    const recusaDaSenha = texto('res');
    conferir('com a senha vazia, a etapa 2 pede a senha do professor — e não o professor',
      /senha do professor/i.test(recusaDaSenha) && !/escolha o professor/i.test(recusaDaSenha),
      recusaDaSenha);
    doc.getElementById('senha-professor').value = 'senha-do-professor';
    clicar('btn-continuar');
    await espera(50);
    const etapa3 = doc.getElementById('etapa-3');
    conferir('…e escolhido um professor que existe, a etapa 1 vai à etapa 3 sem nome nem CPF dele',
      Boolean(etapa3) && etapa3.hidden === false, texto('res'));
  }

  dom.window.close();
}

/* ==================================================================== o veredicto */

(async () => {
  console.log('\nA. A geometria, num Chrome de verdade');
  await medirGeometria();

  console.log('\nB. O percurso em quatro etapas, num DOM com JavaScript');
  await medirComportamento();

  console.log('\nC. O público: o que é do painel SAI do HTML, e não só se esconde');
  await medirRemocao();

  console.log('\nD. O professor que já existe');
  await medirReusoDoProfessor();

  console.log('');
  if (referencia) {
    console.log('CONTROLE NEGATIVO: ' + ok + ' passaram, ' + ko + ' falharam — o código de '
      + referencia + ', de antes da correcção, tem de reprovar.');
    console.log(ko > 0 ? 'CONTROLE CERTO — o código de antes reprova.' : 'A PROVA NÃO PROVA NADA.');
    process.exit(ko > 0 ? 0 : 1);
  }
  console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
