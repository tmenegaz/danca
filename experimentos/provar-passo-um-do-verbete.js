#!/usr/bin/env node
'use strict';

/**
 * provar-passo-um-do-verbete.js — o passo 1 do verbete, num navegador de verdade.
 *
 * O QUE ELA MEDE, e porquê. Ela relatou duas coisas na mesma tela (07/11/2026):
 *
 *   «o botão Seguir encontra-se habilitado, porém ao ser clicado não executa nenhuma ação»; e
 *   «a listagem/campos referentes ao termo no vocabulário aparecem vazios».
 *
 * As duas eram verdade, e não tinham nada a ver uma com a outra:
 *
 *   1. **A NAVEGAÇÃO DO VERBETE ESTAVA MORTA.** A página dos Bastidores é UMA folha de
 *      `function`, e a turma, o verbete e a linha de base declaravam cada uma o seu
 *      `irParaPasso`. Em JavaScript a última vence — e a última era a da LINHA DE BASE. O
 *      «Seguir» chamava a navegação de outra superfície. Isto não se vê a ler o código de cada
 *      bloco: vê-se a contar os nomes. Por isso a secção A é estática e é a primeira.
 *
 *   2. **OS TRÊS CAMPOS ERAM PREENCHIDOS DE UMA LISTA QUE A PÁGINA NÃO TINHA.** A categoria, a
 *      tradição e a definição vêm de `VERBETES.exerciciosDoVocabulario`, a fotografia do
 *      vocabulário no instante do carregamento. Um exercício criado (ou encontrado) depois disso
 *      não está lá: a tela acrescentava o `<option>` do nome e mais nada — caixas bloqueadas,
 *      vazias, com uma nota ao lado a afirmar que eram «a definição do exercício no dicionário».
 *
 * A bancada é LOCAL: um `http.createServer` em porta efémera serve a página que o módulo monta,
 * a folha e as respostas de `/api` stubadas. **Nada aqui toca no ar.**
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   uso: node experimentos/provar-passo-um-do-verbete.js
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const raiz = path.join(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

let falhas = 0;
let total = 0;
function conferir(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

/* O VOCABULÁRIO DA BANCADA ESTÁ VAZIO DE PROPÓSITO. É o caso real: a página foi carregada
 * antes de o exercício existir, e é o único em que os três campos podem aparecer vazios. Uma
 * fixture que já trouxesse o termo mediria o caminho fácil e não veria o defeito. */
const ALFABETO = {
  ok: true,
  versao: 5,
  exercicios: [],
  verbetes: {},
  exerciciosDoVocabulario: [],
  posicoes: [],
  direcoes: [{ termo: 'devant', nome: 'à frente', glifo: '+' }],
  orientacoes: [{ termo: 'en-face', nome: 'de frente', tradicao: 'en face', glifo: 'en-face' }],
  categoriasDeBloco: ['Pé'],
  descricoes: {},
  sinais: [{ sinal: '→', nome: 'conduz a', grupo: 'Movimento' }],
};

/** O TERMO QUE A ROTA DEVOLVE — o mesmo que o `batata` guarda no vocabulário. */
const TERMO = {
  id: 'battement-jete',
  termo: 'Battement jeté',
  categoria: 'passo',
  tradicao: 'RAD',
  tradicaoRotulo: 'RAD',
  descricao: 'Lançamento rápido da perna estendida a uma altura baixa (45 graus), escovando o chão.',
  fonte: 'Redigida no projeto',
  escola: 'batata',
};

const PEDIDOS = [];

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
    if (caminho === '/api/bastidores/termo') {
      let cru = '';
      req.on('data', (t) => { cru += t; });
      return req.on('end', () => {
        let corpo = null;
        try { corpo = JSON.parse(cru); } catch { corpo = null; }
        PEDIDOS.push(corpo);
        // O QUE A ROTA DE HOJE RESPONDE A UM TERMO QUE JÁ EXISTE: 200, `jaExistia`, e o registo.
        return ok('application/json', JSON.stringify({
          ok: true, termo: TERMO.termo, id: TERMO.id, commit: null, jaExistia: true, dados: TERMO,
        }));
      });
    }
    if (caminho === '/api/bastidores/verbete') return ok('application/json', JSON.stringify(ALFABETO));
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

/** A contagem de nomes de topo repetidos — a regra da secção A, isolada para se poder medir. */
function nomesRepetidos(script) {
  const contagem = {};
  for (const m of script.matchAll(/function ([A-Za-z_$][\w$]*)\s*\(/g)) {
    contagem[m[1]] = (contagem[m[1]] || 0) + 1;
  }
  return Object.entries(contagem).filter(([, n]) => n > 1).map(([nome]) => nome);
}

(async () => {
  const html = bastidores.paginaProducao('batata', { professor: 'dedao-aberto', ciclo: '01', query: '' },
    [], [], 'Tiago', 'tiago', [], [], [], [], [], []);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const script = scripts.slice().sort((a, b) => b.length - a.length)[0];

  console.log('\nA. UMA PÁGINA, UM NOME — nenhuma função de topo é declarada duas vezes');
  const repetidos = nomesRepetidos(script);
  conferir('nenhuma função do script é declarada duas vezes', repetidos.length === 0, repetidos);
  /* A CONTRAPROVA, no lugar: o detector tem de apanhar o que diz apanhar. Sem esta linha, um
   * detector quebrado (um regex que deixasse de casar) passaria a elogiar a página. */
  const artificial = 'function x(){}\nfunction y(){}\nfunction x(){ return 2; }';
  conferir('contraprova: o detector apanha um nome repetido de propósito',
    JSON.stringify(nomesRepetidos(artificial)) === JSON.stringify(['x']), nomesRepetidos(artificial));
  /* E os três nomes têm de existir: se alguém os «unificar» outra vez, isto reprova antes de a
   * navegação morrer em silêncio. */
  conferir('as três navegações são três nomes: turma, verbete e linha de base',
    ['irParaPassoTurma', 'irParaPassoVerbete', 'irParaPassoLb'].every((n) => new RegExp('function ' + n + '\\b').test(script)),
    ['irParaPassoTurma', 'irParaPassoVerbete', 'irParaPassoLb'].filter((n) => !new RegExp('function ' + n + '\\b').test(script)));
  conferir('…e o mesmo para os três «pode ir para»',
    ['podeIrParaVerbete', 'podeIrParaLb'].every((n) => new RegExp('function ' + n + '\\b').test(script)));

  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-passo-um-do-verbete: Chrome/Chromium não encontrado — NÃO FEITO.');
    process.exit(1);
  }
  const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
  const puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));

  const { srv, base } = await servir(html);
  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));

  const estado = () => page.evaluate(() => {
    const q = (id) => document.getElementById(id);
    const visivel = (e) => Boolean(e) && !e.hidden && getComputedStyle(e).display !== 'none'
      && e.getBoundingClientRect().height > 0;
    const painelDoVerbete = (n) => document.querySelector('#form-verbete .passo-painel[data-passo="' + n + '"]')
      || document.querySelector('#vb-modo-verbete .passo-painel[data-passo="' + n + '"]');
    const seguir = q('vb-seguir');
    return {
      passo: window.PASSO,
      passo1: visivel(painelDoVerbete(1)),
      passo2: visivel(painelDoVerbete(2)),
      categoria: (q('vncategoria') || {}).value,
      tradicao: (q('vntradicao') || {}).value,
      frase: (q('vb-frase') || {}).value || '',
      bloqueados: ['vncategoria', 'vntradicao', 'vb-frase'].map((id) => Boolean((q(id) || {}).disabled)),
      /* AS TRÊS LINHAS DE PROSA DO PASSO 1 SAÍRAM (18/11/2026), e o que se mede é a AUSÊNCIA
       * delas — não o texto que tinham. Ver `provar-producao` para a regra; aqui mede-se que
       * nenhuma sobrevive no documento que o navegador montou. */
      sobras: ['vb-frase-nota', 'vb-oficial', 'vb-vigor-nota'].filter((id) => q(id)),
      /* O «CANCELAR» — escondido ao abrir, aceso pela edição (18/11/2026). */
      cancelar: (() => {
        const b = q('vb-cancelar');
        return b ? { hidden: b.hidden, visivel: visivel(b) } : null;
      })(),
      seguir: seguir ? { disabled: seguir.disabled, titulo: seguir.getAttribute('title') || '' } : null,
      dicionario: (window.VERBETES && window.VERBETES.exerciciosDoVocabulario || []).map((t) => t && t.termo),
    };
  });
  const dispara = (id, tipo) => page.evaluate((i, t) => {
    document.getElementById(i).dispatchEvent(new Event(t, { bubbles: true }));
  }, id, tipo);

  try {
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    // A Produção é uma página de sessão: `abrirSessao` é o que o login faz ao vivo.
    await page.evaluate(() => {
      if (typeof abrirSessao === 'function') abrirSessao('token-de-prova');
      location.hash = '#verbetes';
      if (typeof mostrarSecao === 'function') mostrarSecao();
      /* A SECÇÃO NASCE RECOLHIDA (18/11/2026) — «quando abrir a primeira vez, deve estar
       * colapsado». Com o formulário fechado, o `page.click` não encontra caixa nenhuma para
       * clicar e a prova rebenta com «Node is either not clickable». Quem sabe abrir a secção é a
       * própria página: chama-se a função dela, e não se imita o efeito. */
      if (typeof definirSecaoRecolhida === 'function') definirSecaoRecolhida('sec-verbetes', false);
      var cf = document.querySelector('#sec-verbetes .col-form');
      if (cf) cf.hidden = false;
    });
    await new Promise((r) => setTimeout(r, 700));
    /* O ESTADO DO ARRANQUE, LIDO ANTES DE ALGUÉM LHE TOCAR (18/11/2026). É a única leitura que
     * responde a «como é que a página abre»; daqui para a frente a prova escreve nos campos e o
     * que se mede já é o efeito do que ela escreveu. */
    const aoAbrir = await estado();
    conferir('ao abrir, o passo 1 está vazio (o navegador repõe os campos, e nenhum é resposta)',
      JSON.stringify([aoAbrir.categoria, aoAbrir.tradicao, aoAbrir.frase]) === '["","",""]',
      [aoAbrir.categoria, aoAbrir.tradicao, aoAbrir.frase]);

    console.log('\nB. OS QUATRO OBRIGATÓRIOS — e o «Seguir» acorda com o último');
    // A ORDEM DELA: o nome, a categoria, a tradição — e a definição por último. É a ordem que
    // deixa o «Seguir» apagado, e era aqui que ele ficava apagado para sempre.
    await page.evaluate(() => { document.getElementById('vnnome').value = 'Battement jeté'; });
    await dispara('vnnome', 'input');
    await page.evaluate(() => { document.getElementById('vncategoria').value = 'passo'; });
    await dispara('vncategoria', 'change');
    await page.evaluate(() => { document.getElementById('vntradicao').value = 'RAD'; });
    await dispara('vntradicao', 'change');
    const semFrase = await estado();
    conferir('com nome, categoria e tradição mas sem a definição, o «Seguir» está bloqueado',
      semFrase.seguir && semFrase.seguir.disabled === true, semFrase.seguir);
    conferir('…e diz o que falta, pelo nome',
      /o que acontece/.test(semFrase.seguir.titulo), semFrase.seguir.titulo);

    await page.evaluate(() => {
      document.getElementById('vb-frase').value = 'Lançamento rápido da perna estendida.';
    });
    await dispara('vb-frase', 'input');
    const comFrase = await estado();
    conferir('escrever a definição ACORDA o «Seguir» (era o último obrigatório e o único que não repintava)',
      comFrase.seguir && comFrase.seguir.disabled === false, comFrase.seguir);
    conferir('…e o título que dizia faltar o que já está desaparece',
      comFrase.seguir.titulo === '', comFrase.seguir.titulo);

    console.log('\nC. O «SEGUIR» ANDA — e anda para o passo do VERBETE');
    await page.click('#vb-seguir');
    await new Promise((r) => setTimeout(r, 800));
    const depois = await estado();
    conferir('o clique levou o formulário ao passo 2', depois.passo === 2, depois.passo);
    conferir('…e é o painel 2 do VERBETE que está à vista', depois.passo2 === true && depois.passo1 === false,
      { p1: depois.passo1, p2: depois.passo2 });
    conferir('…e o pedido foi feito uma vez, com o nome e a definição que ela escreveu',
      PEDIDOS.length === 1 && PEDIDOS[0].termo === 'Battement jeté'
      && PEDIDOS[0].descricao === 'Lançamento rápido da perna estendida.', PEDIDOS);

    console.log('\nD. OS TRÊS CAMPOS — a classificação sugere, a correcção é dela, o oficial fica à vista');
    conferir('a categoria veio do termo, e está preenchida', depois.categoria === 'passo', depois.categoria);
    conferir('a tradição veio do termo, e está preenchida', depois.tradicao === 'RAD', depois.tradicao);
    /* A CLASSIFICAÇÃO VIROU SUGESTÃO (10/11/2026). «a classificação congela» foi o desenho de
     * 02/11; ela reviu-o e pediu «ajustes manuais». Os três campos ficam editáveis, e o que a
     * regra passou a proteger é outra coisa — e é isso que se mede a seguir: a sugestão do
     * dicionário não reescreve uma correcção humana. Uma asserção que só dissesse «estão
     * editáveis» seria decorativa; o que dá dentes é o par com a de baixo. */
    conferir('os três campos ficam EDITÁVEIS — a classificação do dicionário é sugestão, não sentença',
      depois.bloqueados[0] === false && depois.bloqueados[1] === false
        && depois.bloqueados[2] === false, depois.bloqueados);
    /* A DEFINIÇÃO NÃO SE BLOQUEIA (07/11/2026): «o espaço para notas/anotações pedagógicas
     * personalizadas do professor deve estar liberado e interativo». */
    conferir('a frase do professor NÃO é bloqueada', depois.bloqueados[2] === false, depois.bloqueados);
    conferir('…e é a que ela escreveu que fica no campo', depois.frase === 'Lançamento rápido da perna estendida.',
      depois.frase);
    /* A LINHA DA DEFINIÇÃO OFICIAL SAIU (18/11/2026), e a asserção vai atrás dela. Ela mostrava a
     * definição do dicionário como referência ao lado do campo; o pedido foi que o passo 1 ficasse
     * com rótulo, campo e placeholder — e a definição já chega ao campo. Uma prova que continuasse
     * a exigir o texto dela estaria a exigir uma tela que já não existe. */
    conferir('o passo 1 não guarda nenhuma das três linhas de prosa que ele tinha',
      depois.sobras.length === 0, depois.sobras);
    /* A CORRECÇÃO À MÃO SOBREVIVE À SUGESTÃO (18/11/2026 — a asserção que substitui as duas que
     * mediam o texto do antigo bloqueio, e que a regra de 10/11 apagou de propósito).
     *
     * Aqui estava a medir-se uma frase que já não existe («a nota do bloqueio fala da categoria e
     * da tradição»), e uma frase morta não protege nada. O que o código promete hoje é concreto: a
     * sugestão do dicionário só preenche quando o campo está vazio ou ainda tem a sugestão
     * anterior. Se voltar a reescrever por cima, o ajuste manual dela desaparece sem aviso — e esse
     * é o defeito que a frase antiga tentava descrever.
     *
     * O GESTO É O DELA: corrige a categoria à mão e volta a escolher o mesmo exercício. */
    const correcaoAMao = await page.evaluate(() => {
      const cat = document.getElementById('vncategoria');
      const tra = document.getElementById('vntradicao');
      cat.value = 'salto';
      tra.value = 'francesa';
      cat.dispatchEvent(new Event('change', { bubbles: true }));
      tra.dispatchEvent(new Event('change', { bubbles: true }));
      // O mesmo exercício, escolhido outra vez — é o caminho que sugeriria por cima.
      const sel = document.getElementById('vbnome');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { categoria: cat.value, tradicao: tra.value };
    });
    conferir('…e uma correcção à mão NÃO é reescrita pela sugestão do dicionário',
      correcaoAMao.categoria === 'salto' && correcaoAMao.tradicao === 'francesa', correcaoAMao);
    conferir('o termo encontrado entrou no dicionário da PÁGINA — é dele que os campos se enchem',
      depois.dicionario.indexOf('Battement jeté') !== -1, depois.dicionario);

    console.log('\nE. AS OUTRAS DUAS NAVEGAÇÕES CONTINUAM A SER DELAS');
    /* A TURMA. Ela era a primeira a ser sombreada (o verbete vinha depois), e por isso o
     * «Avançar» da turma já chamava a navegação de outra superfície desde 02/11. */
    /* A TURMA TEM UMA TRAVA PRÓPRIA — sem a turma completa, qualquer passo pedido cai no passo
     * «turma». É por isso que esta asserção não mede «chegou à rubrica»: mede o que distingue a
     * navegação CERTA da errada. Com a navegação da turma, o passo do VERBETE fica onde está (é
     * outra superfície); com a do verbete, `PASSO` mudava para 1 (`Number("vincular") || 1`); com
     * a da linha de base, os painéis dela mudavam. */
    const daTurma = await page.evaluate(() => {
      if (typeof irParaPassoTurma !== 'function') return { erro: 'irParaPassoTurma não existe' };
      const antes = { passoDoVerbete: window.PASSO, lb: window.LB_PASSO };
      irParaPassoTurma('vincular');
      return {
        antes,
        depois: { passoDoVerbete: window.PASSO, lb: window.LB_PASSO },
        turmaAVista: document.getElementById('passo-turma').hidden === false,
        rubricaEscondida: document.getElementById('passo-rubrica').hidden === true,
      };
    });
    conferir('«irParaPassoTurma» governa o painel da TURMA e não toca no do verbete',
      daTurma.turmaAVista === true && daTurma.depois.passoDoVerbete === daTurma.antes.passoDoVerbete,
      daTurma);
    conferir('…e a trava da turma continua a mandar: sem a turma completa, o passo pedido cai no 1',
      daTurma.rubricaEscondida === true, daTurma);

    /* A LINHA DE BASE. É a que estava a vencer por ser a última — e continua a funcionar. */
    const daLinha = await page.evaluate(() => {
      if (typeof irParaPassoLb !== 'function') return { erro: 'irParaPassoLb não existe' };
      const paineis = () => [...document.querySelectorAll('#corpo-miolo .passo-painel')]
        .map((p) => p.getAttribute('data-passo') + ':' + (p.hidden ? 'escondido' : 'à-vista'));
      const antes = paineis();
      irParaPassoLb(1);
      return { antes, depois: paineis(), lbPasso: window.LB_PASSO };
    });
    conferir('«irParaPassoLb» continua a abrir o passo 1 da linha de base',
      daLinha.lbPasso === 1 && /1:à-vista/.test(daLinha.depois.join(' ')), daLinha);

    console.log('\nF. ESCOLHER O EXERCÍCIO NO PASSO 2 ENCHE OS TRÊS CAMPOS');
    /* O CASO DELA, AO PÉ DA LETRA: as caixas apareciam VAZIAS. É o que acontece quando o
     * exercício é escolhido na lista em vez de escrito — não há nada digitado para ficar no
     * campo, e a única fonte possível é o dicionário. Sem o termo na lista da página, os três
     * ficam vazios e bloqueados, com a nota a dizer que são «a definição do dicionário». */
    await page.evaluate(() => {
      // Limpa o passo 1: o nome novo sai, e o exercício fica escolhido só pela lista.
      const novo = document.getElementById('vnnome');
      novo.value = '';
      novo.dispatchEvent(new Event('input', { bubbles: true }));
      const cat = document.getElementById('vncategoria'); cat.value = '';
      cat.dispatchEvent(new Event('change', { bubbles: true }));
      const tra = document.getElementById('vntradicao'); tra.value = '';
      tra.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // O gesto do passo 2: escolher da lista — e é o `change` que a tela escuta.
    const daLista = await page.evaluate(() => {
      const sel = document.getElementById('vbnome');
      sel.value = 'Battement jeté';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const q = (id) => document.getElementById(id);
      return {
        categoria: (q('vncategoria') || {}).value,
        tradicao: (q('vntradicao') || {}).value,
        // A FRASE: preenchida a partir do dicionário quando não há nada gravado (P-03/P-04).
        frase: (q('vb-frase') || {}).value || '',
        sobras: ['vb-frase-nota', 'vb-oficial', 'vb-vigor-nota'].filter((id) => document.getElementById(id)),
        bloqueados: ['vncategoria', 'vntradicao', 'vb-frase'].map((id) => Boolean((q(id) || {}).disabled)),
      };
    });
    conferir('escolhido na lista, a categoria enche-se — e não fica vazia',
      daLista.categoria === 'passo', daLista.categoria);
    conferir('…a tradição idem', daLista.tradicao === 'RAD', daLista.tradicao);
    conferir('…a frase nasce com a definição do dicionário, pronta a ajustar',
      /Lançamento rápido da perna estendida/.test(daLista.frase), daLista.frase);
    conferir('…e os três ficam editáveis, como os outros — o dicionário sugere, não tranca',
      daLista.bloqueados[0] === false && daLista.bloqueados[1] === false
        && daLista.bloqueados[2] === false, daLista.bloqueados);
    conferir('…e a lista de sugestões não ressuscita a linha da definição oficial',
      daLista.sobras.length === 0, daLista.sobras);

    /* ======================================================================================
     * H. O FORMULÁRIO NASCE LIMPO, E O «CANCELAR» SÓ EXISTE QUANDO HÁ O QUE CANCELAR
     * ======================================================================================
     *
     * «Nesse primeiro [passo] não tem esse botão cancelar» e «limpar o formulário quando carrega
     * ele na página, mantém ele limpo» (18/11/2026).
     *
     * OS DOIS DEFEITOS TÊM A MESMA FORMA: a tela a mostrar um estado que ninguém declarou. O
     * botão, à vista sem haver o que desfazer; os quatro campos do passo 1, preenchidos com o que
     * uma sessão anterior tinha escrito (o navegador repõe `<input>` e `<select>` sozinho, e os
     * dois `<select>` voltavam com «passo» e «compartilhada» como se fossem resposta).
     *
     * MEDE-SE A CONTRATO, e não o acidente: sujam-se os campos de propósito, chama-se a limpeza
     * que o arranque chama, e mede-se o que sai. A contraprova está na mesma secção — com os
     * campos sujos, o estado que se mede antes é o sujo. Sem isso, uma função que não fizesse
     * nada passaria a elogiar-se a si mesma. */
    console.log('\nH. O FORMULÁRIO NASCE LIMPO — e o «Cancelar» só existe com edição em curso');
    /* A LEITURA É A DO ARRANQUE (`aoAbrir`), e não a de agora: as secções B a F escreveram nos
     * campos, e o que se pergunta aqui é o que a página mostra a quem chega.
     *
     * O `hidden` DO MARKUP NÃO É O QUE ISTO MEDE, e vale a pena dizer porquê: ele está lá para o
     * botão não aparecer no instante entre o HTML e o script — uma janela que nenhuma prova lê.
     * O que a prova lê é a decisão, e ela é do `pintarCancelarDoVerbete`, chamado pela limpeza do
     * arranque. */
    conferir('ao abrir a página não há nada para cancelar, e o botão não está à vista',
      aoAbrir.cancelar && aoAbrir.cancelar.hidden === true && aoAbrir.cancelar.visivel === false,
      aoAbrir.cancelar);
    /* A CHAMADA DO ARRANQUE É ESTÁTICA, e vê-se no texto do script: é a única linha que garante
     * que a limpeza corre sem ninguém carregar em nada. Uma prova só do contrato da função
     * deixaria passar o dia em que a chamada desaparecesse do fim da página. */
    conferir('…e o arranque da página chama a limpeza, depois de tudo o resto',
      /preencherPerfisVisiveis\(\);[\s\S]{0,400}limparOFormularioDoEstilo\(\)/.test(script));
    const sujo = await page.evaluate(() => {
      const q = (id) => document.getElementById(id);
      q('vnnome').value = 'Plié';
      q('vncategoria').value = 'passo';
      q('vntradicao').value = 'compartilhada';
      q('vb-frase').value = 'Dobradiça dos joelhos.';
      q('vbacao').value = 'atualizar';
      window.MUSICA_ABERTA = '8|2/4';
      window.pintarCancelarDoVerbete();
      return {
        nome: q('vnnome').value,
        acao: q('vbacao').value,
        cancelar: { hidden: q('vb-cancelar').hidden, visivel: !q('vb-cancelar').hidden },
      };
    });
    conferir('com edição em curso, o «Cancelar» aparece',
      sujo.cancelar.hidden === false, sujo.cancelar);
    const limpo = await page.evaluate(() => {
      window.limparOFormularioDoEstilo();
      const q = (id) => document.getElementById(id);
      return {
        nome: q('vnnome').value, categoria: q('vncategoria').value, tradicao: q('vntradicao').value,
        frase: q('vb-frase').value, acao: q('vbacao').value,
        musicaAberta: window.MUSICA_ABERTA,
        cancelar: { hidden: q('vb-cancelar').hidden },
      };
    });
    conferir('a limpeza esvazia os quatro campos do passo 1',
      JSON.stringify([limpo.nome, limpo.categoria, limpo.tradicao, limpo.frase]) === '["","","",""]',
      [limpo.nome, limpo.categoria, limpo.tradicao, limpo.frase]);
    conferir('…devolve a acção a «criar» — senão gravaria por cima de um verbete que ninguém abriu',
      limpo.acao === 'criar', limpo.acao);
    conferir('…esquece a música aberta', limpo.musicaAberta === '', limpo.musicaAberta);
    conferir('…e esconde o «Cancelar» com o que ele cancelaria',
      limpo.cancelar.hidden === true, limpo.cancelar);

    console.log('\nG. NENHUM ERRO DE JAVASCRIPT');
    /* O `Unexpected token '<'` que a página já dava antes desta correção é do `perfil` — a rota
     * responde HTML nesta bancada e o cliente tenta lê-la como JSON. Está aqui nomeado para não
     * se confundir com um defeito desta correção nem esconder um que venha a aparecer. */
    const inesperados = erros.filter((m) => !/Unexpected token '<'/.test(m));
    conferir('nenhum erro de JavaScript além do que já existia', inesperados.length === 0, inesperados);
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('\n' + (falhas === 0 ? 'PASSOU' : 'FALHOU') + ' — ' + (total - falhas) + ' de ' + total + ' asserções');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((e) => {
  console.error('erro na prova:', e.message);
  console.error(e.stack);
  process.exit(1);
});
