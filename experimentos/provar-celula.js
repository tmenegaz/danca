#!/usr/bin/env node
'use strict';

/**
 * provar-celula.js — os dois modos do verbete e o editor de trecho, num navegador de verdade.
 *
 * A prova pergunta o que a tela responde, e não o que o código diz:
 *
 *   1. o formulário abre no MODO DO VERBETE, e o do exercício não está no documento;
 *   2. a tabela das direções NÃO é uma pergunta: mostra o que o alfabeto cobre, diz «este
 *      exercício não vai ao lado» quando não vai;
 *   3. o «+» abre o modo do exercício — e nesse modo os campos do verbete NÃO ESTÃO, o `select`
 *      e o «+» ficam BLOQUEADOS (e bloqueados vê-se: a opacidade cai);
 *   4. o Enter no campo do nome não grava um verbete com os campos escondidos;
 *   5. gravar o exercício devolve ao modo do verbete, com ele escolhido;
 *   6. o editor de trecho É DE PÍLULAS — não há uma única lista suspensa, e os dois eixos estão
 *      separados: três direções do membro, cinco orientações do corpo;
 *   7. os sinais compõem-se por CLIQUE e não se substituem uns aos outros — o defeito de origem,
 *      em que escolher o segundo sinal apagava o primeiro;
 *   8. a direção e a orientação FICAM depois de acrescentar um trecho, e a FRASE TAMBÉM — só os
 *      sinais e a contagem se limpam (31/10/2026: era ela que se reescrevia a cada trecho);
 *   9. a frase vem do dicionário, escreve-se UMA vez para o exercício, e o ajuste da professora
 *      não se perde;
 *  10. o trecho acrescentado leva a `orientacao` ao repositório — e não a leva quando é en face;
 *  11. o último passo mostra o texto composto de cada trecho, e o «×» tira o trecho;
 *  12. os CINCO passos estão na tira — fora do formulário, à esquerda da listagem —, e a
 *      listagem está ao lado com as etiquetas de cada verbete (posição, direções, compasso,
 *      trechos); modelo da turma, desde 01/11/2026;
 *  13. nada transborda em 320, 390, 768 e 1280px, e nenhum erro de JavaScript aparece.
 *
 * A bancada é LOCAL: um `http.createServer` em porta efémera serve a página que o módulo monta,
 * a folha, a barra e as respostas de `/api` stubadas. **Nada aqui toca no ar** — a regra do
 * projeto é medir na bancada e deixar a carga ao vivo para o fim.
 *
 * Requer Chrome/Chromium (puppeteer-core vem com o marp-cli global). Sem ele: NÃO FEITO.
 *
 *   uso: node experimentos/provar-celula.js
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
    console.log('  ok     ' + rotulo);
  } else {
    falhas += 1;
    console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

/** O alfabeto de mentira da bancada: um exercício COM decomposição e outro sem nenhuma. */
const ALFABETO = {
  ok: true,
  versao: 5,
  // A LISTAGEM PASSOU A DIZER O QUE O VERBETE É (31/10/2026): o servidor manda a posição, os
  // trechos, as direções e os compassos, e a tela veste-os de etiqueta. O fixture tem de os
  // trazer — sem eles a prova mediria uma linha que já não existe.
  exercicios: [
    {
      nome: 'Battement tendu', musicas: ['4|4/4', '8|4/4'], descontinuado: false,
      posicao: { membro: 'pes', termo: 'premiere-position' },
      trechos: 4, direcoes: ['devant', 'derriere', 'a-la-seconde'], compassos: ['4/4'],
      // O DETALHE POR MÚSICA (02/11/2026) — é ele que dá uma linha a cada uma, e a porta que
      // faltava. O servidor manda-o (`detalhePorMusica`), e a fixture tem de o mandar também:
      // sem ele a listagem cai na linha única de antes, e é isso que ela acabou de medir.
      porMusica: [
        { chave: '4|4/4', tempos: 4, compasso: '4/4', cobre: 4, trechos: 2,
          direcoes: ['devant', 'derriere', 'a-la-seconde'], categorias: ['Pé'],
          linhas: [
            { compasso: 1, contagem: '1–2', categoria: 'Pé', sinais: '1ª → +', descricao: 'extensão à frente' },
            { compasso: 1, contagem: '3–4', categoria: 'Pé', sinais: '+ ● 1ª', descricao: 'retorno à 1ª posição' },
          ] },
        { chave: '8|4/4', tempos: 8, compasso: '4/4', cobre: 8, trechos: 2,
          direcoes: ['devant', 'derriere', 'a-la-seconde'], categorias: ['Pé'],
          linhas: [
            { compasso: 1, contagem: '1–2', categoria: 'Pé', sinais: '1ª → +', descricao: 'extensão à frente' },
            { compasso: 2, contagem: '1–2', categoria: 'Pé', sinais: '1ª → ×', descricao: 'extensão atrás' },
          ] },
      ],
    },
    {
      nome: 'Plié', musicas: ['8|4/4'], descontinuado: false,
      posicao: { membro: 'pes', termo: 'premiere-position' },
      trechos: 2, direcoes: ['devant'], compassos: ['4/4'],
      porMusica: [
        { chave: '8|4/4', tempos: 8, compasso: '4/4', cobre: 8, trechos: 2,
          direcoes: ['devant'], categorias: ['Pé'] },
      ],
    },
  ],
  verbetes: {
    'Battement tendu': {
      '8|4/4': {
        posicao: { membro: 'pes', termo: 'premiere-position' },
        cobre: 8,
        celulas: {
          // A FORMA NOVA DA CÉLULA (28/10/2026): a direção é a chave, e o campo `bloco` deixou de
          // ser texto — a notação passou a ser `categoria` + `sinais`, que se compõem na tela.
          devant: [
            { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'extensão à frente a partir da 1ª posição, a ponta no chão' },
            { contagem: '3–4', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: 'retorno à 1ª posição' },
          ],
          derriere: [
            { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '×'], descricao: 'extensão atrás, a ponta no chão' },
            { contagem: '3–4', categoria: 'Pé', sinais: ['×', '●', '1ª'], descricao: 'retorno à 1ª posição' },
          ],
        },
      },
    },
  },
  // A DEFINIÇÃO VAI JUNTO (31/10/2026) — o formulário pré-enche «o que acontece» com ela. O
  // `Changement` fica SEM definição de propósito: é o caso que cai para o dicionário do trecho,
  // e é o que a prova mede na secção da sugestão.
  exerciciosDoVocabulario: [
    { id: 'plie', termo: 'Plié', categoria: 'passo', descricao: '', fonte: '' },
    // A TRADIÇÃO VAI NO PAYLOAD (02/11/2026) — é dela que o «Método deste exercício» se pré-enche.
    // O `tradicaoRotulo` é a chave em caixa alta, e é o que a tela mostra.
    { id: 'battement-tendu', termo: 'Battement tendu', categoria: 'passo', descricao: '', fonte: '',
      tradicao: 'francesa', tradicaoRotulo: 'FRANCESA' },
    { id: 'changement', termo: 'Changement', categoria: 'salto', descricao: '', fonte: '',
      tradicao: 'cubana', tradicaoRotulo: 'CUBANA' },
    {
      id: 'rond-de-jambe-en-l-air', termo: 'Rond de jambe en l’air', categoria: 'passo',
      descricao: 'Círculo da perna no ar.', fonte: '',
    },
  ],
  // A POSIÇÃO TEM `nome` EM PORTUGUÊS (02/11/2026). O `termo` é o nome na língua da modalidade e
  // é o que se grava; o `nome` é o que a tela mostra. E ele não é decoração: o sistema atende hip
  // hop, jazz e contemporâneo, e uma listagem em francês obriga a traduzir de cabeça.
  posicoes: [{
    id: 'premiere-position', termo: 'Première position', nome: 'primeira posição', membro: 'pes',
  }],
  // DOIS EIXOS (versão 5, 28/10/2026). A rota deixou de os mandar concatenados: a direção diz
  // para onde o membro vai, a orientação diz como o corpo está voltado. O fixture tem de ter a
  // forma que a rota serve — três e cinco, e não oito numa lista só.
  direcoes: [
    { termo: 'devant', nome: 'à frente', glifo: '+' },
    { termo: 'a-la-seconde', nome: 'ao lado', glifo: '-' },
    { termo: 'derriere', nome: 'atrás', glifo: '×' },
  ],
  // O NOME É O UNIVERSAL E A TRADIÇÃO VAI AO LADO (01/11/2026). Era `nome: 'croisé'` — o
  // nome da tradição como rótulo da pílula —, e a pesquisadora pediu o contrário: «orientação
  // do corpo, nós estamos adotando exclusivamente nomes do balé clássico […] a gente precisa
  // adotar nomes que sejam mais universais». A rota serve `nome` (a leitura em português) e
  // `tradicao` (como o ballet lhe chama), e o fixture tem de ter a forma que a rota serve.
  orientacoes: [
    { termo: 'en-face', nome: 'de frente', tradicao: 'en face', glifo: 'en-face' },
    { termo: 'croise', nome: 'pernas cruzadas', tradicao: 'croisé', glifo: 'croise' },
    { termo: 'efface', nome: 'pernas abertas', tradicao: 'effacé', glifo: 'efface' },
    { termo: 'ecarte', nome: 'na diagonal', tradicao: 'écarté', glifo: 'ecarte' },
    { termo: 'epaulement', nome: 'ombros rodados', tradicao: 'épaulement', glifo: 'epaulement' },
  ],
  categoriasDeBloco: ['Pé', 'Peso', 'Perna', 'Braço'],
  // O DICIONÁRIO DO QUE ACONTECE, como a rota o serve — indexado pela NOTAÇÃO, e não pelo nome
  // do exercício: o Plié tem duas coisas (desce, sobe) e por isso duas frases.
  descricoes: {
    '[Pé: 1ª → +]': 'extensão à frente a partir da 1ª posição, a ponta no chão',
    '[Pé: + ● 1ª]': 'retorno à 1ª posição',
  },
  // OS SINAIS VÊM COM NOME E GRUPO (28/10/2026) — a rota deixou de mandar símbolos soltos, e
  // deixou de meter as categorias dentro deles. O fixture tem de ter a forma que a rota serve,
  // senão a prova mede uma tela que não existe (foi o que aconteceu: `x.grupo` de uma string).
  sinais: [
    { sinal: '→', nome: 'conduz a', grupo: 'Movimento' },
    { sinal: '●', nome: 'fecha', grupo: 'Movimento' },
    { sinal: '↓', nome: 'cede', grupo: 'Movimento' },
    { sinal: '↑', nome: 'sobe', grupo: 'Movimento' },
    // O `⌒` ENTROU COM A SECÇÃO 20-A (02/11/2026): é o sinal que se acrescenta a UMA célula para
    // provar que corrigir não a move. Um fixture sem ele obrigaria a prova a adivinhar.
    { sinal: '⌒', nome: 'arco', grupo: 'Movimento' },
    { sinal: '+', nome: 'à frente', grupo: 'Destino do membro' },
    { sinal: '-', nome: 'ao lado', grupo: 'Destino do membro' },
    { sinal: '×', nome: 'atrás', grupo: 'Destino do membro' },
    { sinal: '1ª', nome: 'primeira posição', grupo: 'Posições dos pés e braços' },
    { sinal: '2ª', nome: 'segunda posição', grupo: 'Posições dos pés e braços' },
  ],
};

/** O último corpo que a tela mandou gravar — lido no POST, não adivinhado na tela. */
let ULTIMO_CORPO = null;
/** Os pedidos de TERMO — cada um com o corpo que a tela mandou. */
const TERMOS = [];
/** Os pedidos de APAGAR — o corpo do DELETE, para se medir o que a tela manda sair (02/11/2026). */
const APAGADOS = [];

function servir(html) {
  const srv = http.createServer((req, res) => {
    const caminho = decodeURIComponent(req.url).split('?')[0];
    const ok = (tipo, corpo) => {
      // `no-store`: sem ele o Chrome reaproveita a página entre as navegações da prova.
      res.writeHead(200, { 'content-type': tipo, 'cache-control': 'no-store' });
      res.end(corpo);
    };
    if (caminho.endsWith('/assets/style.css')) {
      return ok('text/css; charset=utf-8', fs.readFileSync(path.join(raiz, 'tools/templates/ciclo.css')));
    }
    if (caminho.endsWith('/assets/nav.js')) {
      return ok('text/javascript', fs.readFileSync(path.join(raiz, 'tools/templates/nav.js')));
    }
    // O CORPO DO POST É GUARDADO. A orientação do corpo é o que se quer ver no que a tela
    // manda gravar — e o que não se vê na tela é o que se mede no corpo.
    if (caminho === '/api/bastidores/verbete' && req.method === 'POST') {
      let cru = '';
      req.on('data', (t) => { cru += t; });
      return req.on('end', () => {
        try { ULTIMO_CORPO = JSON.parse(cru); } catch { ULTIMO_CORPO = null; }
        ok('application/json', JSON.stringify({ ok: true, versao: 6 }));
      });
    }
    // O APAGAR SAI DA TELA E CHEGA AQUI (02/11/2026). O que se mede não é que o fixture mude — é
    // que a tela mande o pedido certo, com o nome e a modalidade, em vez de dizer que apagou.
    if (caminho === '/api/bastidores/verbete' && req.method === 'DELETE') {
      let cru = '';
      req.on('data', (t) => { cru += t; });
      return req.on('end', () => {
        try { APAGADOS.push(JSON.parse(cru)); } catch { APAGADOS.push(null); }
        ok('application/json', JSON.stringify({ ok: true, versao: 7 }));
      });
    }
    if (caminho === '/api/bastidores/verbete') return ok('application/json', JSON.stringify(ALFABETO));
    if (caminho === '/api/bastidores/termo') {
      // O PEDIDO É CONTADO E GUARDADO (02/11/2026). O `Enter` no nome passou a criar o exercício,
      // e o que se quer medir é isso mesmo: que ele cria um TERMO e não grava um verbete.
      let cru = '';
      req.on('data', (t) => { cru += t; });
      return req.on('end', () => {
        try { TERMOS.push(JSON.parse(cru)); } catch { TERMOS.push(null); }
        ok('application/json', JSON.stringify({ ok: true, termo: 'Sissonne ouverte', id: 'sissonne-ouverte' }));
      });
    }
    if (caminho.indexOf('/api/') !== -1) return ok('application/json', '{"ok":true}');
    ok('text/html; charset=utf-8', html);
  });
  return new Promise((pronto) => srv.listen(0, '127.0.0.1', () => pronto({
    srv, base: 'http://127.0.0.1:' + srv.address().port,
  })));
}

/** O que se mede, dentro da página. Uma função só, chamada de fora. */
function estado() {
  const q = (s) => document.getElementById(s);
  const visivel = (e) => Boolean(e) && !e.hidden && getComputedStyle(e).display !== 'none'
    && e.getBoundingClientRect().height > 0;
  const pílulas = (id) => [...((q(id) || {}).querySelectorAll
    ? q(id).querySelectorAll('input') : [])].map((x) => ({
    // A PÍLULA «SEM DIREÇÃO» TEM `data-valor=""`, E O `||` A TRANSFORMAVA EM «on» (01/11/2026):
    // o fallback para `x.value` só pode valer para uma caixa SEM o atributo.
    valor: x.hasAttribute('data-valor') ? x.getAttribute('data-valor') : x.value,
    marcado: x.checked,
  }));
  const sel = q('vbnome');
  const painel = (n) => document.querySelector('#form-verbete .passo-painel[data-passo="' + n + '"]');
  return {
    /* O PASSO 1 É O EXERCÍCIO NOVO, E NÃO UM «+» (02/11/2026). O que se mede agora é o
     * contrário do que se media antes: já não há «modo» nenhum, nem «+», nem os dois botões — há
     * um passo com quatro controlos, e a tira que diz onde se está. */
    painel1Visivel: visivel(painel(1)),
    painel2Visivel: visivel(painel(2)),
    rotulosDaTira: [...document.querySelectorAll('#vb-tira .passo-t:not([id])')]
      .map((x) => x.textContent.trim()),
    // Um «+» que voltasse seria a regressão: o cadastro é o passo, não um widget.
    temMais: Boolean(q('vb-novo-exercicio')),
    // Os dois botões que morreram com o widget.
    botoesDoPasso1: [...(painel(1) ? painel(1).querySelectorAll('button') : [])]
      .map((b) => b.textContent.trim()),
    nomeNovo: (q('vnnome') || {}).value || '',
    temSemear: Boolean(q('semear')),
    tiraVisivel: (() => {
      const t = q('vb-tira');
      return Boolean(t) && !t.hidden && t.getBoundingClientRect().height > 0;
    })(),
    opcoesDoExercicio: sel ? [...sel.options].map((o) => o.value).filter(Boolean) : [],
    exercicioEscolhido: sel ? sel.value : null,
    foco: document.activeElement ? document.activeElement.id : '',
    // UMA TABELA, UMA LISTA DE TRECHOS (01/11/2026). Era um `<table>` por direção do alfabeto;
    // passou a ser uma só, com a direção como COLUNA — e a coluna pode dizer «sem direção».
    tabela: [...document.querySelectorAll('#vb-tabela table')].map((t) => ({
      cabecalho: [...t.tHead.rows[0].cells].map((c) => c.textContent.trim()),
      linhas: [...t.tBodies[0].rows].map((l) => [...l.cells].map((c) => {
        const campo = c.querySelector('input');
        return campo ? campo.value : c.textContent.trim();
      }).join(' | ')),
    })),
    cobertura: (q('vb-cobertura') || {}).textContent || '',
    // A NOTA DO ESTADO VAZIO (01/11/2026): sem trechos, é ela que fica no lugar da tabela.
    notaDaTabela: ((q('vb-tabela') || {}).textContent || '').trim(),
    // OS DOIS EIXOS, medidos como a tela os mostra.
    direcoes: pílulas('vb-dir'),
    orientacoes: pílulas('vb-orient'),
    contagens: pílulas('vb-contagem'),
    // O ESTADO INTERNO, para a falha dizer qual dos dois lados está errado: o dado ou a tela.
    dir: window.DIRECAO,
    orient: window.ORIENTACAO,
    // NENHUMA LISTA SUSPENSA NO TRECHO. É a asserção que impede o `<select>` de voltar.
    suspensasNoTrecho: [...document.querySelectorAll(
      '#vb-dir select, #vb-orient select, #vb-contagem select, #vb-sinais select')].length,
    sinaisMarcados: [...document.querySelectorAll('#vb-sinais input:checked')].length,
    // ESCOLHA ÚNICA *vs* MÚLTIPLA (29/10/2026). A direção e a orientação são UMA escolha, e o
    // `radio` é o que garante que a tela e o estado não divergem: com `checkbox` e sem repintura,
    // o navegador marcava a nova e deixava a anterior — a tela mostrava «à frente» e gravava
    // «atrás». É esta a asserção que impede o regresso.
    tipos: [...new Set([...document.querySelectorAll('#vb-dir input, #vb-orient input')]
      .map((x) => x.type))],
    direcoesMarcadas: [...document.querySelectorAll('#vb-dir input:checked')]
      .map((x) => x.getAttribute('data-valor')),
    orientacoesMarcadas: [...document.querySelectorAll('#vb-orient input:checked')]
      .map((x) => x.getAttribute('data-valor')),
    chips: (q('vb-chips') || {}).textContent.trim(),
    // A FRASE É DO VERBETE, E O QUE FICA ESCRITO É DERIVADO (31/10/2026). O campo «o que
    // acontece neste trecho» deixou de existir: a frase escreve-se uma vez, no passo 2, e o
    // último passo mostra o texto composto de cada trecho (frase + «lê-se») — que é o que se
    // grava. É este par que se mede, e não um campo que já não há.
    frase: (q('vb-frase') || {}).value || '',
    notaDaFrase: (q('vb-frase-nota') || {}).textContent || '',
    fica: (q('vb-fica') || {}).textContent.replace(/\s+/g, ' ').trim(),
    blocosDaFica: document.querySelectorAll('#vb-fica p').length,
    // As colunas contam-se pelo CABEÇALHO. Era `cells[0].colSpan` — havia UMA célula de título
    // com `colspan` e as colunas contavam-se por ela; com a tabela de lista (01/11/2026) o
    // cabeçalho tem uma célula por coluna, e conta-se o número delas.
    colunasDaTabela: [...document.querySelectorAll('#vb-tabela table')]
      .map((t) => t.tHead.rows[0].cells.length),
    // OS SEIS PASSOS E O MODO DE EDIÇÃO (31/10/2026).
    passo: window.PASSO,
    avisoDeEdicao: (() => {
      const a = q('vb-edicao');
      return a && !a.hidden ? a.textContent.replace(/\s+/g, ' ').trim() : null;
    })(),
    tiraEditando: (q('vb-tira') || {}).dataset
      ? q('vb-tira').getAttribute('data-editando') : null,
    alertasVisiveis: [...document.querySelectorAll('#vb-tira .passo-alerta')]
      .filter((a) => getComputedStyle(a).display !== 'none').length,
    contagensMarcadas: [...document.querySelectorAll('#vb-contagem input:checked')]
      .map((x) => x.getAttribute('data-valor')),
    // OS DOIS BOTÕES DO TRECHO (02/11/2026). Eram um só, com rótulo que alternava; passaram a ser
    // dois, e o que se mede é qual está à vista — porque «esconder o Acrescentar em correcção» é
    // o pedido, e um rótulo que muda não esconde nada.
    rotuloDoBotao: (q('vb-cel-guardar') || {}).textContent || '',
    acrescentarVisivel: Boolean(q('vb-cel-acrescentar')) && !q('vb-cel-acrescentar').hidden,
    guardarVisivel: Boolean(q('vb-cel-guardar')) && !q('vb-cel-guardar').hidden,
    linhaEmEdicao: Boolean(document.querySelector('#vb-tabela tr.em-edicao')),
    temBotaoTirar: Boolean(document.querySelector('#vb-tabela button[data-tirar]')),
    // OS PAINÉIS QUE ESTÃO À VISTA (02/11/2026). O número do passo já não chega para dizer o que
    // o utilizador vê: em edição, os painéis do trecho aparecem ONDE ELE ESTÁ. Sem esta lista, a
    // asserção do «Editar» mediria o passo e não o ecrã.
    // O COMPASSO DE CADA LINHA, na ordem em que a tabela as mostra. É o dado que o bug relatado
    // reescrevia sem ninguém pedir.
    compassos: [...document.querySelectorAll('#vb-tabela tbody tr')]
      .map((r) => (r.cells[0] || {}).textContent.trim()),
    // Quais linhas têm o sinal `⌒` — o que a correcção acrescentou a UMA delas.
    linhasComSinal: [...document.querySelectorAll('#vb-tabela tbody tr')]
      .map((r, i) => (/⌒/.test(r.textContent) ? i : -1))
      .filter((i) => i !== -1),
    paineisVisiveis: [...document.querySelectorAll('#form-verbete .passo-painel')]
      .filter((p) => !p.hidden)
      .map((p) => Number(p.getAttribute('data-passo')) || 0),
    linhasDaTabela: [...document.querySelectorAll('#vb-tabela tr:not(.em-edicao)')]
      .map((r) => r.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
    recado: (document.querySelector('[data-res=verbetes]') || {}).textContent || '',
    botaoVerboNoModoB: (() => {
      const b = q('vb-modo-exercicio');
      return b ? /Gravar verbete/.test(b.textContent) : null;
    })(),
    transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
}

(async () => {
  const executavel = process.env.CHROME_PATH
    || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!executavel) {
    console.error('provar-celula: Chrome/Chromium não encontrado — conferência NÃO FEITA.');
    process.exit(1);
  }
  let puppeteer;
  try {
    const MARP = path.join(execSync('npm root -g').toString().trim(), '@marp-team/marp-cli');
    puppeteer = require(path.join(MARP, 'node_modules', 'puppeteer-core'));
  } catch {
    console.error('provar-celula: puppeteer-core não encontrado (vem com o marp-cli global) — NÃO FEITO.');
    process.exit(1);
  }

  const html = bastidores.paginaProducao('valse', { professor: 'perna-boa', ciclo: '01', query: '' },
    [], [], 'Tiago', 'tiago', [], [], [], [], [], []);
  const { srv, base } = await servir(html);
  const browser = await puppeteer.launch({ executablePath: executavel, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errosDeJs = [];
  page.on('pageerror', (e) => errosDeJs.push(e.message));
  // OS DIÁLOGOS SÃO FECHADOS E REGISTADOS. O formulário usa `alert` para dizer o que falta, e
  // um `alert` pendente bloqueia a página inteira — uma prova que o ignore não mede a tela, mede
  // o silêncio dela. Registá-lo também mostra qual foi a recusa.
  const dialogos = [];
  page.on('dialog', async (d) => { dialogos.push(d.message()); await d.dismiss(); });
  /* AS NAVEGAÇÕES SÃO CONTADAS, E NÃO IMPRESSAS (02/11/2026). O «Apagar» do verbete recarregava a
   * página — o ouvinte genérico do `button.apagar` apanhava o clique, mandava o pedido para
   * `/api/bastidores/null` e fazia `location.reload()`. O recado que a tela tinha acabado de
   * escrever desaparecia com o reload, e uma prova que só lesse o texto leria o vazio. Contar as
   * navegações é o que torna isso visível: um `reload` no meio de um fluxo apaga o estado, e o
   * que se medisse depois seria outra página. */
  const navegacoes = [];
  page.on('framenavigated', (f) => navegacoes.push(f.url()));

  /**
   * Clicar numa pílula — o gesto que a tela pede, e não uma escrita de valor.
   *
   * O clique vai para o `<label>` da pílula, e não para a caixa que ele contém: é o que a mão
   * faz (a caixa é parte da peça, não um alvo separado), e é o que funciona mesmo quando a
   * folha desenha a caixa com `appearance:none` e a esconde por baixo da peça.
   */
  // ================= OS SEIS PASSOS (02/11/2026) ==================================
  // Só o painel do passo actual está no ecrã — e um controlo num painel escondido não se pode
  // clicar. A prova leva-se ao passo onde o controlo vive, em vez de fingir que estão todos à
  // vista: é isso que a tela faz, e é isso que a prova deve fazer.
  //
  // O MAPA DESDOBROU-SE. O exercício NOVO — nome, categoria, tradição — é o passo 1, e a FRASE
  // desceu para lá (02/11/2026): ela é a definição do exercício, e o exercício define-se quando
  // se nomeia. O exercício escolhido é o passo 2; a música desceu a 3, o «para onde» a 4, os
  // sinais a 5 e a decomposição a 6. É o passo onde o controlo VIVE, e não a ordem em que se
  // aprende — por isso a música vem antes do exercício escolhido.
  //
  // A POSIÇÃO SAIU DO MAPA, porque saiu do formulário: ela deixou de ser um campo do passo 2 e
  // passou a ser o que se escreve nos sinais do trecho.
  const PASSO_DE = [
    [/^#vnnome|^#vncategoria|^#vntradicao|^#semear|^#vb-frase|^#vb-frase-nota/, 1],
    [/^#vbnome/, 2],
    [/^#vbtempos|^#vbcompasso/, 3],
    [/^#vb-dir|^#vb-orient|^#vb-categoria|^#vb-contagem/, 4],
    [/^#vb-sinais|^#vb-chips/, 5],
    [/^#vb-tabela|^#vb-fica|^#vb-cel-acrescentar|^input\[name=vb-cat\]/, 6],
  ];
  const passoDe = (seletor) => {
    for (const [re, n] of PASSO_DE) if (re.test(seletor)) return n;
    return null;
  };
  // O ÚLTIMO PASSO lê-se DA PÁGINA, e só depois de ela abrir: uma prova que escreve «7» à mão
  // mede a constante dela, não o comportamento — e já ficou com números errados quando a lista
  // mudou de tamanho. (`let`, e não `const`: a página ainda está em `about:blank` aqui.)
  let ULTIMO = null;
  const irA = async (n) => {
    await page.evaluate((k) => { if (typeof irParaPasso === 'function') irParaPasso(k); }, n);
    await new Promise((r) => setTimeout(r, 150));
  };
  const noPassoDe = async (seletor) => {
    const n = passoDe(seletor);
    if (n) await irA(n);
  };
  /** Clicar numa pílula — o gesto que a tela pede, e não uma escrita de valor. */
  const clicar = async (seletor) => {
    await noPassoDe(seletor);
    await page.evaluate((s) => {
      const alvo = document.querySelector(s);
      if (!alvo) throw new Error('pílula não encontrada: ' + s);
      (alvo.closest('label') || alvo).click();
    }, seletor);
    await new Promise((r) => setTimeout(r, 200));
  };
  /* O PASSO 1 TEM QUATRO OBRIGATÓRIOS (02/11/2026): o nome, «o que acontece», a categoria e a
   * tradição de referência. Antes desta data os dois `<select>` nasciam com uma resposta já
   * escolhida — a tela perguntava «qual é a categoria?» mostrando «passo» —, e por isso a prova
   * avançava só com o nome. O que ela media era o defeito, lido como se fosse a regra. */
  const completarPasso1 = async (nome, frase) => {
    await irA(1);
    await page.evaluate((n, f) => {
      const c = document.getElementById('vnnome');
      c.value = n;
      c.dispatchEvent(new Event('input'));
      const fr = document.getElementById('vb-frase');
      fr.value = f;
      fr.dispatchEvent(new Event('input'));
      document.getElementById('vncategoria').value = 'salto';
      document.getElementById('vntradicao').value = 'francesa';
    }, nome, frase);
    await new Promise((r) => setTimeout(r, 150));
  };
  const marcada = (lista) => (lista.find((x) => x.marcado) || {}).valor;
  const valores = (lista) => lista.map((x) => x.valor);

  try {
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto(base + '/bastidores/producao', { waitUntil: 'networkidle0' });
    ULTIMO = await page.evaluate(() => window.ULTIMO_PASSO);
    conferir('a página diz qual é o último passo, e são seis', ULTIMO === 6, ULTIMO);
    // A Produção é uma página de sessão: `abrirSessao` é o que revela o conteúdo e o que o
    // login faz ao vivo. Ir pelo formulário da senha exigiria a rota de sessão, que aqui não
    // é o que se mede.
    await page.evaluate(() => {
      if (typeof abrirSessao === 'function') abrirSessao('token-de-prova');
      location.hash = '#verbetes';
      if (typeof mostrarSecao === 'function') mostrarSecao();
    });
    await new Promise((r) => setTimeout(r, 700));

    console.log('\n1. O FORMULÁRIO ABRE NO PASSO 1 — O EXERCÍCIO NOVO');
    const inicial = await page.evaluate(estado);
    conferir('o passo 1 está à vista', inicial.painel1Visivel, inicial.painel1Visivel);
    conferir('e o passo 2 não está', inicial.painel2Visivel === false, inicial.painel2Visivel);
    conferir('a tira mostra os SEIS passos, um de cada vez',
      inicial.rotulosDaTira.length === 6, inicial.rotulosDaTira);
    conferir('o primeiro é «O exercício novo», e o segundo é o do exercício a escolher',
      inicial.rotulosDaTira[0] === 'O exercício novo'
      && /exerc[ií]cio/i.test(inicial.rotulosDaTira[1]), inicial.rotulosDaTira);
    conferir('o passo 1 tem os quatro controlos: nome, categoria, tradição e as turmas',
      await page.evaluate(() => ['vnnome', 'vncategoria', 'vntradicao', 'semear']
        .every((id) => document.getElementById(id))));
    conferir('e NÃO tem «+» — criar o exercício é o passo, não um botão que abre um cadastro',
      inicial.temMais === false, inicial.temMais);
    conferir('nem «Gravar exercício» nem «Cancelar»: quem grava é o «Seguir →»',
      inicial.botoesDoPasso1.length === 1
      && /Carregar as turmas iniciais/.test(inicial.botoesDoPasso1[0]), inicial.botoesDoPasso1);
    conferir('a decomposição pede o exercício antes de o haver',
      /Escolha o exercício/.test(await page.evaluate(
        () => document.getElementById('vb-tabela').textContent)));

    console.log('\n2. A TABELA MOSTRA O QUE O ALFABETO COBRE, SEM PERGUNTAR');
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 400));
    const comExercicio = await page.evaluate(estado);
    conferir('a decomposição é UMA tabela, com a direção como coluna', comExercicio.tabela.length === 1,
      comExercicio.tabela.map((x) => x.cabecalho));
    conferir('…e as colunas são compasso · contagem · direção · orientação · notação',
      JSON.stringify(comExercicio.tabela[0].cabecalho.slice(0, 5))
        === JSON.stringify(['compasso', 'contagem', 'direção', 'orientação', 'notação']),
      comExercicio.tabela[0].cabecalho);
    conferir('o trecho coberto aparece, com o compasso CALCULADO e a direção em palavras',
      /^1 \| 1–2 \| à frente \| de frente \| \[Pé: 1ª → \+\]/.test(comExercicio.tabela[0].linhas[0]),
      comExercicio.tabela[0].linhas[0]);
    /* A FRASE QUE SAIU (01/11/2026). Havia três blocos, um por direção, e os dois que o
     * exercício não faz diziam «não vai ao lado» e «não vai atrás». A pesquisadora leu as três
     * ausências como um erro do sistema — e era: a tela afirmava três factos sobre um exercício
     * cujo eixo é outro. O que se mede agora é que a afirmação não existe. */
    conferir('o que o exercício não faz NÃO vira três blocos a dizer «não vai»',
      !/não vai/.test(comExercicio.tabela[0].linhas.join(' '))
        && !/não vai/.test(comExercicio.tabela[0].cabecalho.join(' ')),
      comExercicio.tabela[0].linhas);
    conferir('a cobertura é dita em tempos', /Cobre os 8 tempos/.test(comExercicio.cobertura),
      comExercicio.cobertura);
    // «EN FACE» VIROU «DE FRENTE» (01/11/2026), com o resto do eixo: o nome que a tela mostra
    // é a leitura em português, e o da tradição vive em `tradicao`.
    conferir('a célula sem orientação diz «de frente» em palavras — a coluna não fica em branco',
      /de frente/.test(comExercicio.tabela[0].linhas[0]), comExercicio.tabela[0].linhas[0]);

    /* 3. O «+» ABRE O CADASTRO DENTRO DO PASSO 1 — E NADA DESAPARECE (02/11/2026).
     *
     * ESTA SECÇÃO MEDIA O CONTRÁRIO, E O CONTRÁRIO ERA O DEFEITO. O «+» abria o «MODO B», que
     * escondia `#vb-modo-verbete` inteiro, escondia a tira dos passos e bloqueava o `select` e o
     * próprio «+». A pesquisadora, a usar: «o professor não vai saber que quando ele clicar em
     * cancelar, ele vai para onde de facto ele cria o verbete da aula» — um formulário que
     * substitui a página inteira e cujo único caminho de saída se chama «Cancelar» não diz onde se
     * está nem para onde se vai.
     *
     * O cadastro passa a viver DENTRO do passo 1. O que se mede, por isso, inverteu-se: o
     * verbete FICA, o seletor NÃO fica bloqueado, a tira NÃO sai — e o «+» diz em que estado
     * está. A asserção que guarda a mudança é a do lugar: `#vb-modo-exercicio` tem de estar
     * dentro do painel do passo 1. */
    /* 3. O «SEGUIR →» DO PASSO 1 GRAVA O EXERCÍCIO E AVANÇA (02/11/2026).
     *
     * ESTA SECÇÃO JÁ MEDIU OUTRAS COISAS, e todas erradas por serem a mesma: um «+» que abria um
     * cadastro; depois, um cadastro dentro do passo 1 com os botões dele. A pesquisadora, ao ver:
     * «somente esses campos — exercício novo, categoria, tradição e carregar as turmas iniciais —
     * vão ser o step 1 (…) e esse botão de mais (…) deixa de existir». Com seis passos, criar o
     * exercício deixa de ser um widget e passa a ser o primeiro passo: quem grava é o «Seguir →»,
     * que já existia, e não há segundo botão nenhum. */
    console.log('\n3. O «SEGUIR →» DO PASSO 1 GRAVA O EXERCÍCIO E AVANÇA');
    ULTIMO_CORPO = null;
    const termosAntesDoAvancar = TERMOS.length;
    await completarPasso1('Sissonne ouverte', 'salta e fecha');
    await page.click('#vb-seguir');
    await new Promise((r) => setTimeout(r, 800));
    const depoisDeAvancar = await page.evaluate(estado);
    conferir('o «Seguir →» manda UM pedido de termo', TERMOS.length === termosAntesDoAvancar + 1,
      { antes: termosAntesDoAvancar, depois: TERMOS.length });
    conferir('…com o nome, a categoria e a tradição que estão nos campos',
      Boolean(TERMOS[TERMOS.length - 1]) && TERMOS[TERMOS.length - 1].termo === 'Sissonne ouverte'
      && TERMOS[TERMOS.length - 1].categoria && TERMOS[TERMOS.length - 1].tradicao,
      TERMOS[TERMOS.length - 1]);
    conferir('e NENHUM verbete foi enviado', ULTIMO_CORPO === null, ULTIMO_CORPO);
    conferir('avança para o passo 2', depoisDeAvancar.painel2Visivel, depoisDeAvancar);
    conferir('e o exercício novo está escolhido no campo do passo 2',
      depoisDeAvancar.exercicioEscolhido === 'Sissonne ouverte', depoisDeAvancar.exercicioEscolhido);
    conferir('o campo do nome fica vazio, para não criar duas vezes o mesmo',
      depoisDeAvancar.nomeNovo === '', depoisDeAvancar.nomeNovo);

    /* 4. O ENTER NO NOME FAZ O MESMO — E NÃO SUBMETE UM VERBETE (02/11/2026).
     *
     * A asserção antiga era «o Enter não grava um verbete», e o mecanismo era uma guarda do modo.
     * Com o cadastro como passo, o Enter passa a ter sentido: cria o exercício e avança. O que se
     * mede é o pedido que sai — um TERMO, nunca um verbete. */
    console.log('\n4. O ENTER NO NOME CRIA O EXERCÍCIO, E NÃO SUBMETE UM VERBETE');
    const termosAntesDoEnter = TERMOS.length;
    await completarPasso1('Sissonne fermée', 'salta e fecha atrás');
    await page.focus('#vnnome');
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 800));
    const depoisDoEnter = await page.evaluate(estado);
    conferir('o Enter manda UM pedido de termo', TERMOS.length === termosAntesDoEnter + 1,
      { antes: termosAntesDoEnter, depois: TERMOS.length });
    conferir('…com o nome que está no campo',
      Boolean(TERMOS[TERMOS.length - 1]) && TERMOS[TERMOS.length - 1].termo === 'Sissonne fermée',
      TERMOS[TERMOS.length - 1]);
    conferir('e nenhum verbete é submetido', ULTIMO_CORPO === null, ULTIMO_CORPO);
    conferir('e o formulário avança para o passo 2', depoisDoEnter.painel2Visivel, depoisDoEnter);

    /* 5. AVANÇAR SEM NOME NÃO GRAVA NADA — E SEGUE (02/11/2026).
     *
     * Quem já tem o exercício no vocabulário não escreve nada no passo 1: avança. Se o passo
     * recusasse o avanço sem nome, o formulário trancava para quem só quer editar um verbete que
     * já existe. */
    console.log('\n5. AVANÇAR SEM NOME NÃO GRAVA NADA, E SEGUE');
    await irA(1);
    const termosAntesDoVazio = TERMOS.length;
    await page.click('#vb-seguir');
    await new Promise((r) => setTimeout(r, 400));
    const semNome = await page.evaluate(estado);
    conferir('nenhum pedido de termo é mandado', TERMOS.length === termosAntesDoVazio,
      { antes: termosAntesDoVazio, depois: TERMOS.length });
    conferir('e o formulário fica no passo 2', semNome.painel2Visivel, semNome);

    /* 6. O MESMO EXERCÍCIO NÃO ENTRA DUAS VEZES NA LISTA (02/11/2026). Ele pode já lá estar
     * porque a página foi recarregada depois do commit — e um `option` repetido é uma segunda
     * verdade na mesma lista. */
    console.log('\n6. O MESMO EXERCÍCIO NÃO ENTRA DUAS VEZES NA LISTA');
    await completarPasso1('Sissonne ouverte', 'salta e fecha');
    await page.click('#vb-seguir');
    await new Promise((r) => setTimeout(r, 800));
    const repetido = await page.evaluate(estado);
    conferir('o nome aparece uma só vez na lista',
      repetido.opcoesDoExercicio.filter((x) => x === 'Sissonne ouverte').length === 1,
      repetido.opcoesDoExercicio);
    conferir('e continua escolhido', repetido.exercicioEscolhido === 'Sissonne ouverte',
      repetido.exercicioEscolhido);

    console.log('\n7. O EDITOR DE TRECHO É DE PÍLULAS, E OS DOIS EIXOS ESTÃO SEPARADOS');
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Battement tendu');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 400));
    const eixos = await page.evaluate(estado);
    conferir('não há uma única lista suspensa no trecho', eixos.suspensasNoTrecho === 0, eixos.suspensasNoTrecho);
    // A DIREÇÃO PASSOU A SER OPCIONAL (01/11/2026). «sem direção» entra primeiro, como o
    // `en face` na orientação: é a AUSÊNCIA, e não uma quarta direção da gramática.
    conferir('a direção do membro oferece as TRÊS da gramática e a ausência declarada',
      JSON.stringify(valores(eixos.direcoes))
        === JSON.stringify(['', 'devant', 'a-la-seconde', 'derriere']),
      valores(eixos.direcoes));
    conferir('e a orientação do corpo oferece CINCO — é o outro eixo',
      valores(eixos.orientacoes).length === 5, valores(eixos.orientacoes));
    conferir('antes de o professor escolher, está marcada «sem direção» — a omissão, e vê-se',
      marcada(eixos.direcoes) === '', marcada(eixos.direcoes));
    // «EN FACE» APARECE MARCADA DESDE O INÍCIO (29/10/2026). Ela é a omissão — o campo
    // `orientacao` só existe quando não é en face —, mas a pílula tem de o DIZER: antes era a
    // única que nunca marcava, e a pesquisadora leu isso como «não habilita»: um clique que não
    // dizia nada, num campo onde todos os outros diziam.
    conferir('a orientação já vem em «en face», que é a omissão — e vê-se',
      marcada(eixos.orientacoes) === 'en-face', marcada(eixos.orientacoes));
    conferir('direção e orientação são ESCOLHA ÚNICA (radio), e não lista de caixas',
      JSON.stringify(eixos.tipos) === JSON.stringify(['radio']), eixos.tipos);
    conferir('«en face» aparece marcada quando nenhuma outra está — é a omissão, e vê-se',
      JSON.stringify(eixos.orientacoesMarcadas) === JSON.stringify(['en-face']),
      eixos.orientacoesMarcadas);
    /* O SEGUNDO ERRO DA PESQUISADORA (01/11/2026). Sem direção, a contagem oferecia ZERO opções
     * e dizia «escolha a direção primeiro» — e ela TINHA a contagem. O compasso é corrido; a
     * direção não é a régua dele. Um trecho sem direção conta como qualquer outro. */
    conferir('sem direção, a contagem continua a oferecer o que cabe',
      JSON.stringify(valores(eixos.contagens)) === JSON.stringify(['1', '1–2']), eixos.contagens);

    await clicar('#vb-dir input[data-valor="devant"]');
    const comDirecao = await page.evaluate(estado);
    conferir('a pílula da direção fica marcada', marcada(comDirecao.direcoes) === 'devant',
      { marcada: marcada(comDirecao.direcoes), estado: comDirecao.dir, tudo: comDirecao.direcoes });
    conferir('em 2/4 a contagem só oferece o que cabe: 1 e 1–2',
      JSON.stringify(valores(comDirecao.contagens)) === JSON.stringify(['1', '1–2']),
      { contagens: valores(comDirecao.contagens), estado: comDirecao.dir });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 300));
    conferir('em 4/4 oferece até 4',
      JSON.stringify(valores((await page.evaluate(estado)).contagens))
        === JSON.stringify(['1', '1–2', '1–3', '1–4']),
      valores((await page.evaluate(estado)).contagens));
    /* O COMPASSO COMPOSTO (02/11/2026). Em 6/8 o pulso vale TRÊS tempos — dois pulsos de três —,
     * e a lista deixa de ser a rampa de um em um: os fins que FECHAM pulso vêm primeiro (1–3, 1–6)
     * e os que caem a meio vêm no fim. É a diferença entre «cabe» e «fecha», que o numerador
     * sozinho não sabe fazer. */
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '6/8');
    await new Promise((r) => setTimeout(r, 300));
    conferir('em 6/8 os fins que fecham pulso vêm primeiro, e os de meio no fim',
      JSON.stringify(valores((await page.evaluate(estado)).contagens))
        === JSON.stringify(['1', '1–3', '1–6', '1–2', '1–4', '1–5']),
      valores((await page.evaluate(estado)).contagens));
    // A LEGENDA DIZ A PISTA E O AGRUPAMENTO. «1–3» num 6/8 não se distingue de um erro sem isto.
    const legendaContagem = await page.$eval('#vb-contagem legend', (el) => el.textContent.replace(/\s+/g, ' ').trim());
    conferir('…e a legenda diz em que pista a contagem corre',
      /pista de (Pé|Peso|Perna|Braço)/.test(legendaContagem) && /pulsos de três/.test(legendaContagem),
      legendaContagem);
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 300));

    /* A REPETIÇÃO E O MÉTODO (02/11/2026). Os dois campos são novos e os dois são de HERANÇA ou de
     * MULTIPLICAÇÃO: a repetição diz quantas vezes o trecho ocupa o compasso (e entra na conta do
     * tempo), o método sobrepõe-se ao do plano e a primeira opção diz que herda. */
    const repeticoes = await page.$eval('#vb-repeticoes', (el) => [...el.options].map((o) => o.value));
    conferir('o passo do «quando» tem a repetição, de 1× a 4×',
      JSON.stringify(repeticoes) === JSON.stringify(['1', '2', '3', '4']), repeticoes);
    const metodos = await page.$eval('#vbmetodo', (el) => [...el.options].map((o) => o.value));
    conferir('o passo 2 tem o método, e a primeira opção é a herança',
      metodos[0] === '' && metodos.indexOf('RAD') !== -1 && metodos.indexOf('Vaganova') !== -1, metodos);

    console.log('\n8. TRÊS CLIQUES EM TRÊS DIREÇÕES DEIXAM UMA SÓ — E É A ÚLTIMA');
    for (const d of ['devant', 'a-la-seconde', 'derriere']) {
      await clicar('#vb-dir input[data-valor="' + d + '"]');
    }
    const tres = await page.evaluate(estado);
    conferir('só uma direção fica marcada', tres.direcoesMarcadas.length === 1, tres.direcoesMarcadas);
    conferir('e é a última clicada — a tela não diz uma coisa e o estado outra',
      tres.direcoesMarcadas[0] === 'derriere' && tres.dir === 'derriere',
      { marcada: tres.direcoesMarcadas, estado: tres.dir });
    await clicar('#vb-dir input[data-valor="devant"]');
    conferir('e clicar noutra troca-a, sem deixar rasto da anterior',
      (await page.evaluate(estado)).direcoesMarcadas.length === 1,
      (await page.evaluate(estado)).direcoesMarcadas);

    console.log('\n9. OS SINAIS COMPÕEM-SE POR CLIQUE — NÃO SE SUBSTITUEM');
    await clicar('#vb-contagem input[data-valor="1–2"]');
    for (const s of ['1ª', '→', '+']) await clicar('#vb-sinais input[data-sinal="' + s + '"]');
    const composto = await page.evaluate(estado);
    conferir('três cliques puseram TRÊS sinais na ficha', /1\. 1ª/.test(composto.chips)
      && /2\. →/.test(composto.chips) && /3\. \+/.test(composto.chips), composto.chips);
    // A LEITURA EM PALAVRAS DEIXOU DE SER ESCRITA (31/10/2026): ela é DERIVADA da notação e só
    // aparece quando há trecho — antes disso não há nada para ler, e inventar um texto seria a
    // sugestão a competir com a frase do verbete.
    conferir('a leitura em palavras não é escrita antes de haver trecho',
      !/Lê-se:/.test(composto.fica), composto.fica);
    // OS SINAIS NÃO TOCAM NA FRASE DO VERBETE (31/10/2026). Era o defeito que a pesquisadora
    // descreveu como «toda vez que eu vou acrescentar um trecho, eu preciso digitar novamente o
    // que acontece»: o campo vivia no passo do trecho e era reescrito a cada acrescento. Agora a
    // frase é do exercício, e escolher sinais não a muda — muda o «lê-se» que se lhe acrescenta.
    conferir('escolher sinais não reescreve a frase do verbete',
      composto.frase === '', composto.frase);
    conferir('e o último passo ainda não tem trechos para mostrar',
      /Ainda não há trechos/.test(composto.fica), composto.fica);
    await clicar('#vb-sinais input[data-sinal="1ª"]');
    conferir('um sinal pode repetir-se no mesmo trecho — clicar outra vez acrescenta ao fim',
      /4\. 1ª/.test((await page.evaluate(estado)).chips), (await page.evaluate(estado)).chips);
    // O defeito de origem: escolher o segundo sinal apagava o primeiro. Com pílulas, nunca.
    conferir('nenhuma pílula de sinal fica marcada — o estado está nas fichas, não na caixa',
      (await page.evaluate(estado)).sinaisMarcados === 0, (await page.evaluate(estado)).sinaisMarcados);

    console.log('\n10. A FRASE ESCRITA À MÃO NÃO SE PERDE AO ESCOLHER UM SINAL');
    await noPassoDe('#vb-frase');
    await page.evaluate(() => {
      const d = document.getElementById('vb-frase');
      d.value = 'a minha própria frase';
      d.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vb-sinais');
    await clicar('#vb-sinais input[data-sinal="●"]');
    conferir('o que a professora escreveu fica',
      (await page.evaluate(estado)).frase === 'a minha própria frase',
      (await page.evaluate(estado)).frase);
    conferir('e a nota passa a dizer que a frase é dela',
      /A sua frase/.test((await page.evaluate(estado)).notaDaFrase),
      (await page.evaluate(estado)).notaDaFrase);

    console.log('\n11. A ORIENTAÇÃO DO CORPO ENTRA NO TRECHO — E É O OUTRO EIXO');
    await clicar('#vb-orient input[data-valor="croise"]');
    conferir('a orientação escolhida vê-se marcada',
      marcada((await page.evaluate(estado)).orientacoes) === 'croise',
      marcada((await page.evaluate(estado)).orientacoes));
    await clicar('#vb-orient input[data-valor="ecarte"]');
    conferir('e clicar noutra troca-a: uma só fica marcada',
      JSON.stringify((await page.evaluate(estado)).orientacoesMarcadas) === JSON.stringify(['ecarte']),
      (await page.evaluate(estado)).orientacoesMarcadas);
    await clicar('#vb-orient input[data-valor="en-face"]');
    conferir('clicar em «en face» volta à omissão, e a pílula fica marcada',
      marcada((await page.evaluate(estado)).orientacoes) === 'en-face',
      marcada((await page.evaluate(estado)).orientacoes));
    conferir('e o estado volta a vazio — é vazio que se grava',
      (await page.evaluate(estado)).orient === '',
      (await page.evaluate(estado)).orient);
    await clicar('#vb-orient input[data-valor="croise"]');

    console.log('\n12. ACRESCENTAR RECUSA O QUE FALTA, CAMPO A CAMPO');
    await noPassoDe('#vb-frase');
    await page.evaluate(() => {
      const d = document.getElementById('vb-frase');
      d.value = '';
      d.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 250));
    conferir('a recusa nomeia a frase que falta, e o passo onde se escreve',
      /Falta a frase do verbete \(no passo 1\)/.test((await page.evaluate(estado)).recado),
      (await page.evaluate(estado)).recado);
    await noPassoDe('#vb-frase');
    await page.evaluate(() => {
      const d = document.getElementById('vb-frase');
      d.value = 'a perna sai em croisé e conduz à frente';
      d.dispatchEvent(new Event('input'));
    });
    ULTIMO_CORPO = null;
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 350));
    const acrescentado = await page.evaluate(estado);
    conferir('acrescentado, o trecho entra na tabela com a notação composta',
      /\[Pé: 1ª → \+ 1ª ●\]/.test(acrescentado.tabela[0].linhas.join(' ')),
      acrescentado.tabela[0].linhas);
    // A COLUNA DIZ O NOME UNIVERSAL (01/11/2026): «pernas cruzadas», e não «croisé» — o nome
    // da tradição vive no `title` da pílula. É a mesma escolha que a direção do membro já fazia
    // («à frente», e não «devant»).
    conferir('e a tabela mostra a ORIENTAÇÃO na sua coluna',
      /pernas cruzadas/.test(acrescentado.tabela[0].linhas[acrescentado.tabela[0].linhas.length - 1] || ''),
      acrescentado.tabela[0].linhas);
    conferir('e a cobertura passa a contar os tempos dele',
      /Cobre 2 de 4 tempos/.test(acrescentado.cobertura), acrescentado.cobertura);

    console.log('\n13. A DIREÇÃO, A ORIENTAÇÃO E A FRASE FICAM — SÓ OS SINAIS SE LIMPAM');
    conferir('a direção continua marcada', marcada(acrescentado.direcoes) === 'devant',
      marcada(acrescentado.direcoes));
    conferir('a orientação continua marcada', marcada(acrescentado.orientacoes) === 'croise',
      marcada(acrescentado.orientacoes));
    conferir('as fichas é que se limpam', /Escolha a categoria/.test(acrescentado.chips),
      acrescentado.chips);
    // A FRASE NÃO SE LIMPA: era ela que obrigava a escrever a mesma coisa por cada trecho.
    conferir('a frase do verbete NÃO se limpa — é o que impede escrevê-la outra vez',
      acrescentado.frase === 'a perna sai em croisé e conduz à frente', acrescentado.frase);
    // O QUE FICA ESCRITO VÊ-SE NO ÚLTIMO PASSO: frase do verbete + «lê-se» do trecho.
    conferir('o último passo mostra o trecho composto — a frase e o «lê-se»',
      /a perna sai em croisé e conduz à frente/.test(acrescentado.fica)
        && /Lê-se: Pé, primeira posição, conduz a, à frente, primeira posição, fecha\./.test(acrescentado.fica),
      acrescentado.fica);

    console.log('\n14. A TABELA TEM QUATRO COLUNAS — A DA FRASE SAIU');
    // A QUINTA COLUNA ERA REDUNDANTE (31/10/2026). Com a frase a vir da definição do exercício,
    // todas as linhas diziam o mesmo; e a parte que muda por trecho (o «lê-se») é função da
    // notação, que já tem coluna. A pesquisadora viu-o e mandou tirá-la.
    const quatroColunas = await page.evaluate(estado);
    // SEIS COLUNAS, E NÃO CINCO (01/11/2026): a da DIREÇÃO entrou quando a decomposição deixou
    // de ser um bloco por direção — sem ela, a lista não dizia para onde cada trecho vai.
    conferir('a tabela tem seis colunas — e a da frase continua fora',
      quatroColunas.colunasDaTabela.every((n) => n === 6), quatroColunas.colunasDaTabela);
    conferir('não há nenhum campo de frase dentro da tabela',
      (await page.evaluate(() => document.querySelectorAll('#vb-tabela input').length)) === 0);

    /* 14. A GRAVAÇÃO RECUSA UM VERBETE QUE NÃO FECHA A MÚSICA (02/11/2026).
     *
     * O DEFEITO QUE ISTO GUARDA é o que a pesquisadora viu na Aula 01: o `Battement fondu` está
     * gravado em «2|4/4» com células que somam 6 tempos, e o `Plié` em «8|4/4» com células que
     * somam 12 — os dois passaram a gravação, porque a única igualdade que se conferia era `cobre`
     * contra a soma das células, uma conta que o formulário faz de si para si. A música, que é a
     * chave do verbete, não era comparada com nada.
     *
     * Aqui a tela está com 4 tempos e um trecho de 2: a gravação tem de recusar, dizer o que falta
     * e apontar os dois sítios onde se corrige — a música (passo 2) ou os trechos (passo 3). */
    console.log('\n15. A GRAVAÇÃO RECUSA UM VERBETE QUE NÃO FECHA A MÚSICA');
    const passoAntesDaRecusa = (await page.evaluate(estado)).passo;
    ULTIMO_CORPO = null;
    await page.evaluate(() => {
      const f = document.getElementById('form-verbete');
      if (f) f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 400));
    const recusado = await page.evaluate(estado);
    conferir('a gravação é RECUSADA, e nada é enviado', ULTIMO_CORPO === null, ULTIMO_CORPO);
    conferir('a recusa diz quantos tempos faltam',
      /faltam 2 tempos/.test(recusado.recado), recusado.recado);
    conferir('e aponta os DOIS sítios: a música e os trechos',
      /passo 3/.test(recusado.recado) && /passo 4/.test(recusado.recado), recusado.recado);
    // O NÚMERO DOS PASSOS NÃO É ESCRITO À MÃO: sai da lista que desenha a tira. Se a lista mudar
    // e a mensagem não, a prova apanha.
    conferir('…e cada um pelo nome que a tira usa',
      /«A música»/.test(recusado.recado) && /«Para onde»/.test(recusado.recado), recusado.recado);

    /* A RECUSA NÃO NAVEGA (02/11/2026). Era `irParaPasso(...)`, e o efeito foi o relatado: «o
     * sistema identificou uma inconsistência de tempo e redirecionou o usuário automaticamente
     * para o Step 3 (Música) (…) impede que o professor leia a mensagem de erro com calma no
     * contexto em que estava». A mensagem diz ONDE se corrige; ir é decisão de quem lê. */
    conferir('a recusa NÃO muda de passo: o utilizador fica onde estava',
      recusado.passo === passoAntesDaRecusa, { antes: passoAntesDaRecusa, depois: recusado.passo });
    conferir('…e a mensagem fica à vista, na própria página — não num alerta que se fecha',
      /não fecha a música/.test(recusado.recado), recusado.recado);

    /* 15-A. O VERBETE DE DUAS PISTAS EM PARALELO NÃO PODE SER RECUSADO (02/11/2026).
     *
     * É O SEGUNDO PONTO DO RELATÓRIO, com o número exacto: «as células somam 12 tempos e a música
     * declara 8». O caso dela — perna 1–2 ×2 e 1–4, braço igual, em paralelo — ocupa 8 e não 12,
     * e a tela RECUSAVA-O antes de chegar ao servidor, que já o aceitava. A régua das pistas foi
     * aplicada no motor, no validador e na cobertura da tabela; a conta do `submit` ficou para
     * trás. O sintoma é o pior dos dois mundos: o dado está certo e a tela diz que não.
     *
     * O cenário é montado no próprio estado da página e restaurado em seguida — o que se mede é a
     * CONTA, não o desenho. */
    const contaDasPistas = await page.evaluate(() => {
      const antes = CELULAS;
      CELULAS = {
        devant: [
          { contagem: '1–2', categoria: 'Perna', repeticoes: 2, sinais: ['1ª', '↓'], descricao: 'desce e sobe' },
          { contagem: '1–4', categoria: 'Perna', sinais: ['1ª', '↓'], descricao: 'grand plié' },
        ],
        '': [
          { contagem: '1–2', categoria: 'Braço', repeticoes: 2, sinais: ['⌒'], descricao: 'port de bras' },
          { contagem: '1–4', categoria: 'Braço', sinais: ['⌒'], descricao: 'port de bras longo' },
        ],
      };
      const porPista = pistasDe(CELULAS);
      const total = cobertura();
      CELULAS = antes;
      return { total, pistas: porPista.pistas, somaLinear: 12 };
    });
    conferir('…e a conta da tela é a da maior pista: perna 8, braço 8, verbete 8 — não 12',
      contaDasPistas.total === 8 && contaDasPistas.pistas.Perna === 8 && contaDasPistas.pistas.Braço === 8,
      contaDasPistas);

    console.log('\n16. FECHADA A MÚSICA, A GRAVAÇÃO PASSA — E LEVA A ORIENTAÇÃO');
    // O TRECHO QUE FALTA: a contagem que a tela ainda oferece, escolhida como a mão a escolhe.
    const contagensLivres = (await page.evaluate(estado)).contagens
      .map((c) => c.valor).filter(Boolean);
    conferir('a tela oferece a contagem que falta', contagensLivres.length > 0, contagensLivres);
    // A QUE FECHA: as opções são crescentes, e a última é a que cobre o resto dos dois tempos. A
    // primeira seria 1 tempo, e o verbete continuaria a não fechar.
    await clicar('#vb-contagem input[data-valor="'
      + contagensLivres[contagensLivres.length - 1] + '"]');
    const sinaisDoTrecho = await page.evaluate(() => {
      const s = document.querySelector('#vb-sinais input[data-sinal]');
      return s ? s.getAttribute('data-sinal') : null;
    });
    await clicar('#vb-sinais input[data-sinal="' + sinaisDoTrecho + '"]');
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 350));
    const comDoisTrechos = await page.evaluate(estado);
    conferir('o trecho que faltava entra, e a cobertura fecha a música',
      /Cobre os 4 tempos/.test(comDoisTrechos.cobertura), comDoisTrechos.cobertura);
    ULTIMO_CORPO = null;
    await page.evaluate(() => {
      const f = document.getElementById('form-verbete');
      if (f) f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 700));
    const corpo = ULTIMO_CORPO;
    const gravadas = (corpo && corpo.verbete && corpo.verbete.celulas) || null;
    const diagnostico = { semCorpo: corpo === null, recado: (await page.evaluate(estado)).recado, dialogos };
    conferir('o corpo gravado tem a célula nova',
      Boolean(gravadas && Array.isArray(gravadas.devant) && gravadas.devant.length),
      gravadas || diagnostico);
    const nova = gravadas && gravadas.devant ? gravadas.devant[gravadas.devant.length - 1] : null;
    conferir('e ela leva `orientacao: croise`', Boolean(nova) && nova.orientacao === 'croise',
      nova || diagnostico);
    // A FRASE GRAVADA É A DO CAMPO (31/10/2026) — definição + «lê-se», em duas linhas. A tabela
    // deixou de a mostrar, e por isso é aqui que se mede que ela não se perdeu.
    conferir('a frase gravada é a do campo, com as duas linhas',
      Boolean(nova) && /Lê-se:/.test(nova.descricao || ''), nova || diagnostico);
    /* O QUE É OMISSÃO NÃO SE ESCREVE (28/10/2026 — e continua a valer). «En face» é o estado de
     * omissão: escrevê-lo em todas as células encheria o alfabeto de ruído que não diz nada de
     * novo. Com a escolha em «croisé», TODAS as células desta gravação levam o campo — e nenhuma
     * leva «en-face». Era o que o título desta secção prometia e só metade se media. */
    conferir('as células levam a orientação em vigor, e não a omissão',
      Boolean(gravadas) && gravadas.devant.length > 1
      && gravadas.devant.every((c) => c.orientacao === 'croise'),
      gravadas && gravadas.devant);

    console.log('\n17. O «×» TIRA O TRECHO — E O QUE FICA É O QUE SE GRAVA');
    // Volta a 8/4/4, que tem células no alfabeto: é onde o «×» se pode medir sem deixar a
    // direção vazia. Depois do submit a lista é recarregada, e é isso que se quer ver.
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 500));
    const antesDeTirar = await page.evaluate(estado);
    const linhasAntes = antesDeTirar.tabela[0].linhas.length;
    await page.evaluate(() => {
      // O «×» da PRIMEIRA tabela — a da direção «à frente», que é a que se está a medir.
      const botoes = [...document.querySelectorAll('#vb-tabela table')[0]
        .querySelectorAll('button[data-tirar]')];
      botoes[botoes.length - 1].click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const depoisDeTirar = await page.evaluate(estado);
    conferir('o «×» tira uma linha da tabela',
      depoisDeTirar.tabela[0].linhas.length === linhasAntes - 1,
      { antes: linhasAntes, depois: depoisDeTirar.tabela[0].linhas.length });
    conferir('e a cobertura diminui os tempos dela', depoisDeTirar.cobertura !== antesDeTirar.cobertura,
      { antes: antesDeTirar.cobertura, depois: depoisDeTirar.cobertura });

    console.log('\n18. UM EN CROIX INTEIRO: CADA TRECHO NO SEU BLOCO, E O COMPASSO CORRIDO');
    // O EXERCÍCIO SEM VERBETE é o caso de quem está a escrever de raiz — e era o caso dela:
    // battement frappé, 16 tempos, 2/4, três direções. O `Changement` do fixture não tem verbete
    // nenhum, e é por isso que a decomposição começa vazia.
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Changement');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '16';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 500));
    const vazio = await page.evaluate(estado);
    /* SEM TRECHOS, NÃO HÁ DECOMPOSIÇÃO A MOSTRAR (01/11/2026). Eram três tabelas — uma por
     * direção — a dizer «este exercício não vai à frente / ao lado / atrás». Para o `relevé`, que
     * não tem eixo horizontal nenhum, eram três afirmações inventadas sobre o exercício. Depois
     * disso passou a haver uma linha a dizer porquê — e essa linha SAIU a 03/11/2026, com a
     * limpeza dos formulários: o botão que acrescenta o trecho está logo abaixo, e a tela vazia
     * já diz que está vazia. A asserção fica INVERTIDA em vez de apagada — o que se mede é que
     * não há nem tabela nem «não vai» nem sermão. */
    conferir('sem trechos, não há tabela de decomposição — e nenhum «não vai»',
      vazio.tabela.length === 0, vazio.tabela.map((t) => t.cabecalho));
    conferir('…nem frase de instrução no lugar da tabela',
      !/Ainda sem trechos|Escreva o primeiro|opcional/.test(vazio.notaDaTabela) && !/não vai/.test(vazio.notaDaTabela),
      vazio.notaDaTabela);
    conferir('e a mesma direção oferece 1 e 1–2 em 2/4',
      JSON.stringify(valores(vazio.contagens)) === JSON.stringify(['1', '1–2']), valores(vazio.contagens));

    /** Acrescenta um trecho na direção dada, com a PRIMEIRA contagem que a tela oferecer. */
    // A FRASE É ESCRITA UMA VEZ PARA O EXERCÍCIO (31/10/2026). Era o parâmetro que obrigava a
    // repeti-la em cada trecho — e é isso que a prova agora impede: quem acrescenta três trechos
    // não volta a escrever a mesma frase.
    const escreverFrase = async (texto) => {
      await noPassoDe('#vb-frase');
      await page.evaluate((f) => {
        const d = document.getElementById('vb-frase');
        d.value = f;
        d.dispatchEvent(new Event('input'));
      }, texto);
    };
    const acrescentar = async (dir) => {
      await noPassoDe('#vb-dir');
      await clicar('#vb-dir input[data-valor="' + dir + '"]');
      const oferecidas = valores((await page.evaluate(estado)).contagens);
      await clicar('#vb-contagem input[data-valor="' + oferecidas[0] + '"]');
      for (const sg of ['1ª', '→', '+']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
      await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
      await new Promise((r) => setTimeout(r, 400));
      return oferecidas;
    };

    await escreverFrase('o pé bate e volta');
    const offDevant = await acrescentar('devant');
    await acrescentar('a-la-seconde');
    await acrescentar('derriere');
    const croix = await page.evaluate(estado);
    conferir('os três trechos estão numa lista só, cada um com a SUA direção na coluna',
      croix.tabela.length === 1 && croix.tabela[0].linhas.length === 3
        && /\| à frente \|/.test(croix.tabela[0].linhas[0])
        && /\| ao lado \|/.test(croix.tabela[0].linhas[1])
        && /\| atrás \|/.test(croix.tabela[0].linhas[2]),
      croix.tabela[0].linhas);
    conferir('e o de «atrás» cai no compasso 2, e não no 1',
      /^2 \|/.test(croix.tabela[0].linhas[2]), croix.tabela[0].linhas[2]);
    // A CONTAGEM CONTINUA ONDE O COMPASSO ESTÁ (29/10/2026) — em 2/4, «à frente» ocupa o tempo 1
    // e «ao lado» tem de ocupar o 2, senão dois trechos caem no mesmo tempo.
    conferir('a contagem de «ao lado» é 2, e não 1 — o compasso é corrido',
      /^1 \| 2 \| ao lado/.test(croix.tabela[0].linhas[1]), croix.tabela[0].linhas[1]);
    conferir('e a de «atrás» recomeça em 1, no compasso 2',
      /^2 \| 1 \| atrás/.test(croix.tabela[0].linhas[2]), croix.tabela[0].linhas[2]);
    conferir('a cobertura soma os três tempos', /Cobre 3 de 16 tempos/.test(croix.cobertura),
      croix.cobertura);
    // A FRASE FOI ESCRITA UMA VEZ E ESTÁ NOS TRÊS (31/10/2026). É a asserção que fecha o defeito
    // que ela descreveu: antes, cada trecho obrigava a escrever outra vez «o que acontece».
    /* A FRASE ENTRA UMA VEZ, E NÃO UMA VEZ POR TRECHO (02/11/2026). A asserção guardava o
     * contrário — «entra nos três trechos» —, e era o defeito que ela mandou corrigir: «está
     * repetindo em todos os trechos a mesma frase descritiva definida na etapa 2». A frase é do
     * EXERCÍCIO; repeti-la em cada linha de uma barra de oito é a repetição massiva que se vê na
     * tela. Agora sobe para o topo do bloco, uma vez, e cada trecho traz só o «lê-se» dele. */
    conferir('a frase do exercício aparece UMA vez na prévia, e não uma por trecho',
      (croix.fica.match(/o pé bate e volta/g) || []).length === 1,
      { vezes: (croix.fica.match(/o pé bate e volta/g) || []).length, fica: croix.fica });
    conferir('e cada trecho traz o «lê-se» dele, que é o que muda de trecho para trecho',
      (croix.fica.match(/Lê-se:/g) || []).length === 3
        && /compasso 1/.test(croix.fica) && /compasso 2/.test(croix.fica),
      croix.fica);
    // Com a lista única, «ao lado» é a SEGUNDA linha — e a prova continua a olhar para ela.
    conferir('a segunda direção já não ofereceu o tempo 1',
      JSON.stringify(offDevant) === JSON.stringify(['1', '1–2'])
        && /^1 \| 2 \| ao lado/.test(croix.tabela[0].linhas[1]),
      { ofereceu: offDevant, linha: croix.tabela[0].linhas[1] });

    console.log('\n19. A DEFINIÇÃO DO EXERCÍCIO PRÉ-ENCHE «O QUE ACONTECE»');
    // O CASO QUE ORIGINOU ISTO (31/10/2026): a pesquisadora escreveu o primeiro verbete a sério,
    // de Rond de jambe en l'air, e em cada um dos três trechos o campo — vazio, e sem nada que
    // dissesse o que ele quer — recebeu o NOME do exercício. A definição do vocabulário passa a
    // ser a versão de partida.
    await noPassoDe('#vbnome'); await page.select('#vbnome', 'Rond de jambe en l’air');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso'); await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 500));
    const comDefinicao = await page.evaluate(estado);
    conferir('escolhido o exercício, o campo já traz a definição do vocabulário',
      comDefinicao.frase === 'Círculo da perna no ar.', comDefinicao.frase);
    conferir('e a nota diz de QUE exercício é a definição',
      /Rond de jambe en l’air/.test(comDefinicao.notaDaFrase), comDefinicao.notaDaFrase);
    conferir('a definição aparece SEM sinal nenhum escolhido — ela não depende do trecho',
      comDefinicao.chips.length > 0 && !/1\./.test(comDefinicao.chips), comDefinicao.chips);
    // SEM TRECHOS, A PRÉVIA DIZ A FRASE E SÓ ISSO (02/11/2026). Antes mostrava o aviso de «ainda
    // não há trechos»; agora a frase subiu para o topo do bloco, e é ela que lá está — o aviso
    // aparece quando também não há frase. O que se mede é o que importa: o «lê-se» não existe.
    conferir('e nada ainda foi acrescentado, por isso não há «lê-se» a mostrar',
      comDefinicao.fica.indexOf('Lê-se') === -1, comDefinicao.fica);
    // A DEFINIÇÃO NÃO É TEXTO A REESCREVER: quem ajustou não a vê voltar sozinha.
    await escreverFrase('o círculo da perna no ar, a partir do retiré');
    await noPassoDe('#vb-dir');
    await clicar('#vb-dir input[data-valor="devant"]');
    await clicar('#vb-contagem input[data-valor="1"]');
    // Os sinais do fixture (a lista real tem 18; aqui bastam dois para compor a leitura).
    for (const sg of ['-', '1ª']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 400));
    const ajustada = await page.evaluate(estado);
    conferir('a frase ajustada sobrevive a escolher a direção e os sinais',
      ajustada.frase === 'o círculo da perna no ar, a partir do retiré', ajustada.frase);
    conferir('e o «lê-se» aparece no trecho, em palavras, por baixo da frase',
      /primeira posição/.test(ajustada.fica)
        && /Lê-se: Pé, ao lado, primeira posição\./.test(ajustada.fica),
      ajustada.fica);

    console.log('\n20. UM TRECHO ACRESCENTADO PODE SER CORRIGIDO — E É O PEDIDO DELA');
    // «quando eu acrescento um trecho, seria bom que eu pudesse editar esse trecho». A correcção
    // atravessa os dois passos do trecho, e é por isso que ela é um ESTADO: o aviso, o «!» nos
    // dois números da tira, o rótulo do botão do último passo e a linha da tabela têm todos de
    // saber.
    // Um trecho novo, num exercício sem verbete: é o caso de quem está a escrever de raiz, e é
    // onde a edição se mede sem depender do alfabeto de exemplo.
    await noPassoDe('#vbnome');
    await page.select('#vbnome', 'Changement');
    await noPassoDe('#vbtempos');
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
    });
    await noPassoDe('#vbcompasso');
    await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 500));
    await escreverFrase('o pé bate e troca');
    const oferecidas = await acrescentar('devant');
    await irA(ULTIMO);
    const comTrecho = await page.evaluate(estado);
    const botoesDaLinha = await page.evaluate(
      () => [...document.querySelectorAll('#vb-tabela button')].map((b) => b.textContent.trim()));
    conferir('a linha do trecho tem «Editar» e «×»',
      botoesDaLinha.indexOf('Editar') !== -1 && botoesDaLinha.indexOf('×') !== -1, botoesDaLinha);

    await page.evaluate(() => { document.querySelector('#vb-tabela button[data-editar]').click(); });
    await new Promise((r) => setTimeout(r, 400));
    const emEdicao = await page.evaluate(estado);
    /* «EDITAR» NÃO MUDA DE PASSO (02/11/2026) — e esta asserção é o contrário da que aqui estava.
     *
     * A anterior dizia «leva ao primeiro passo do trecho, que é onde a correcção começa», e era a
     * regra de então. A pesquisadora relatou o efeito medido: «ao clicar no botão de editar um
     * item na decomposição, a interface força um redirecionamento automático para o Step 4 (…)
     * deve ocorrer na tela/Step atual de Decomposição, sem saltar para Steps anteriores.» O
     * formulário passa a vir ter com ela. */
    conferir('«Editar» NÃO salta de passo: a correcção acontece na decomposição',
      emEdicao.passo === ULTIMO, { passo: emEdicao.passo, ultimo: ULTIMO });
    /* UM PASSO, UM PAINEL — TAMBÉM A CORRIGIR (02/11/2026). A asserção anterior pedia os três
     * painéis à vista (4, 5 e 6), e era a decisão da manhã. Ela foi corrigida no mesmo dia, pela
     * mesma pessoa, com o efeito medido: «ao clicar em Editar (…) abre tudo em um formulário
     * único (página única), transformando os steps em meros indicadores visuais». As duas coisas
     * que ela pediu — não saltar de passo, e andar por passos — não competem: a correcção fica
     * onde está, e o formulário mostra um painel de cada vez, como em qualquer outro momento. */
    conferir('…e o formulário continua a mostrar UM painel de cada vez — não vira página única',
      emEdicao.paineisVisiveis.length === 1 && emEdicao.paineisVisiveis[0] === ULTIMO,
      emEdicao.paineisVisiveis);
    conferir('o aviso de edição está à vista e diz qual é o trecho',
      emEdicao.avisoDeEdicao !== null && /trecho 1/.test(emEdicao.avisoDeEdicao), emEdicao.avisoDeEdicao);
    conferir('a tira acende o «!» — e só nos passos do trecho',
      emEdicao.tiraEditando === 'sim' && emEdicao.alertasVisiveis === 2,
      { tira: emEdicao.tiraEditando, alertas: emEdicao.alertasVisiveis });
    conferir('os valores do trecho estão carregados nas pílulas',
      emEdicao.direcoesMarcadas.length === 1 && emEdicao.contagensMarcadas.length === 1,
      { dir: emEdicao.direcoesMarcadas, cont: emEdicao.contagensMarcadas });
    conferir('e a contagem carregada é a DELE — a edição não desloca o trecho',
      emEdicao.contagensMarcadas[0] === oferecidas[0],
      { carregada: emEdicao.contagensMarcadas, era: oferecidas });
    /* «ACRESCENTAR TRECHO» DESAPARECE NA CORRECÇÃO (02/11/2026). Era um botão só, e o rótulo
     * alternava entre «Acrescentar trecho» e «Guardar a alteração» — a pesquisadora pediu para o
     * esconder, e mudar um rótulo não esconde: quem está a corrigir vê o mesmo botão no mesmo
     * sítio e tem de ler para saber o que ele faz agora. Com dois botões, o que se pode fazer
     * vê-se. Estas três asserções são o par: um sai, o outro entra, e o que entra diz o que faz. */
    conferir('em correcção, «Acrescentar trecho» NÃO está à vista',
      emEdicao.acrescentarVisivel === false, emEdicao.acrescentarVisivel);
    conferir('…e o «Guardar a alteração» está, e diz o que faz',
      emEdicao.guardarVisivel === true && emEdicao.rotuloDoBotao === 'Guardar a alteração',
      { visivel: emEdicao.guardarVisivel, rotulo: emEdicao.rotuloDoBotao });

    // A LINHA EM EDIÇÃO: marcada, sem «×» e com «Cancelar». Já se está no último passo — a edição
    // não mudou de sítio —, e é isso que a linha 1 desta secção passou a medir.
    await irA(ULTIMO);
    const linhaEmEdicao = await page.evaluate(estado);
    conferir('a linha em edição está marcada e não tem «×»',
      linhaEmEdicao.linhaEmEdicao === true && linhaEmEdicao.temBotaoTirar === false,
      { marcada: linhaEmEdicao.linhaEmEdicao, tirar: linhaEmEdicao.temBotaoTirar });

    // CANCELAR: nada muda, e fica-se onde se está. O pedido dela é explícito — «Cancelar: mantém o
    // usuário no mesmo Step. Status: CORRETO (deve ser preservado como está)» —, e o
    // comportamento de antes (saltar para o último passo) dava o mesmo resultado por acidente,
    // enquanto a edição começava nos passos do trecho. Agora começa na tabela, e o «mesmo passo»
    // passa a ser o da tabela por decisão, não por coincidência.
    await page.evaluate(() => { document.getElementById('vb-cancelar-edicao').click(); });
    await new Promise((r) => setTimeout(r, 400));
    const cancelado = await page.evaluate(estado);
    conferir('«Cancelar a edição» deixa o utilizador no mesmo passo', cancelado.passo === ULTIMO, cancelado.passo);
    conferir('…e os painéis do trecho voltam a esconder-se',
      cancelado.paineisVisiveis.indexOf(4) === -1, cancelado.paineisVisiveis);
    conferir('e apaga o modo: o aviso e o «!» desaparecem',
      cancelado.avisoDeEdicao === null && cancelado.tiraEditando === 'nao',
      { aviso: cancelado.avisoDeEdicao, tira: cancelado.tiraEditando });
    conferir('o trecho continua na tabela, intacto',
      cancelado.linhasDaTabela === comTrecho.linhasDaTabela,
      { antes: comTrecho.linhasDaTabela, depois: cancelado.linhasDaTabela });

    /* 20-A. CORRIGIR UM TRECHO NÃO LHE MUDA O COMPASSO NEM O LUGAR (02/11/2026).
     *
     * É O BUG QUE ELA RELATOU, com estas palavras: «ao editar um item já salvo no Compasso 1 (por
     * exemplo, os braços), o sistema move o item editado para o final da fila/lista e altera
     * automaticamente a atribuição do compasso de Compasso 1 para Compasso 2».
     *
     * A CAUSA ERA UMA LINHA. O handler fazia `splice` no índice antigo e `push` no fim — e como o
     * compasso de cada trecho sai da ORDEM (um relógio por pista), corrigir uma descrição
     * reescrevia a posição temporal do trecho. A correcção substitui NO LUGAR.
     *
     * O CENÁRIO: três trechos de PERNA, que é a mesma pista e por isso partilham o relógio. Em
     * 2/4, um tempo cada: 1 → compasso 1, 2 → compasso 1 (fecha o compasso), 1 → compasso 2. Se o
     * primeiro for para o fim, o que estava no compasso 1 passa a 2 e o que estava no 2 passa a 3.
     */
    console.log('\n20-A. CORRIGIR UM TRECHO NÃO LHE MUDA O COMPASSO — O BUG RELATADO');
    await irA(1);
    await page.select('#vbnome', 'Changement');
    await new Promise((r) => setTimeout(r, 400));
    await irA(3);
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4';
      t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 400));
    await escreverFrase('sobe e desce');
    // Três trechos que partilham a pista, e que por isso partilham o relógio.
    for (let i = 0; i < 3; i += 1) {
      await noPassoDe('#vb-dir');
      await clicar('#vb-dir input[data-valor="devant"]');
      // `#vb-categoria` é o id do fieldset, e é ele que o `PASSO_DE` conhece — o seletor por
      // `input[name=vb-cat]` existia para outra altura e não dizia o passo.
      await clicar('#vb-categoria input[value="Perna"]');
      const opcoes = valores((await page.evaluate(estado)).contagens);
      await clicar('#vb-contagem input[data-valor="' + opcoes[0] + '"]');
      for (const sg of ['1ª', '↓']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
      await noPassoDe('#vb-cel-acrescentar');
      await page.click('#vb-cel-acrescentar');
      await new Promise((r) => setTimeout(r, 350));
    }
    const antesDeEditar = await page.evaluate(estado);
    /* «ACRESCENTAR TRECHO» NÃO SAI DA DECOMPOSIÇÃO (02/11/2026). Era `irParaPasso(PASSOS_DO_TRECHO[0])`,
     * e o efeito era o relatado: «ao clicar em "Acrescentar Trecho" dentro do Step 6, o sistema
     * executa a ação e redireciona o usuário de volta para o Step de onde ele veio». Agora fica-se
     * onde se está — e é preciso, porque a linha nova só se vê na tabela. */
    conferir('«Acrescentar trecho» mantém o utilizador na decomposição',
      antesDeEditar.passo === ULTIMO, { passo: antesDeEditar.passo, ultimo: ULTIMO });
    conferir('…e sem correcção em curso, é o «Acrescentar» que está à vista',
      antesDeEditar.acrescentarVisivel === true && antesDeEditar.guardarVisivel === false,
      { acrescentar: antesDeEditar.acrescentarVisivel, guardar: antesDeEditar.guardarVisivel });
    conferir('o cenário tem os três trechos, e os compassos são 1, 1 e 2',
      antesDeEditar.tabela.length === 1 && antesDeEditar.tabela[0].linhas.length === 3
        && antesDeEditar.compassos.join(',') === '1,1,2',
      { compassos: antesDeEditar.compassos, linhas: antesDeEditar.tabela[0] && antesDeEditar.tabela[0].linhas });

    // Corrige-se o PRIMEIRO — o que está no compasso 1, e o que o `push` mandava para o fim.
    await page.evaluate(() => { document.querySelector('#vb-tabela button[data-editar]').click(); });
    await new Promise((r) => setTimeout(r, 350));
    await clicar('#vb-sinais input[data-sinal="⌒"]');
    // A ÁREA DO TRECHO, MEDIDA EM EDIÇÃO E NO PASSO DOS SINAIS. É o caso difícil: os sinais
    // vivem no 5, o botão que guarda vive no 6 — e sem a área aberta o utilizador teria de
    // procurar o passo onde se guarda. Mede-se aqui, e não depois de guardar, porque guardar
    // fecha a edição e a área volta ao normal (que é o comportamento certo).
    const areaEmEdicao = await page.evaluate(estado);
    // NO PASSO DOS SINAIS, SÓ O PAINEL DOS SINAIS. É o caso que a decisão da manhã abria, e que
    // ela mandou fechar: quem está a corrigir os sinais vê os sinais; a decomposição e o botão de
    // guardar estão a um clique na tira, como sempre estiveram.
    conferir('em edição e no passo dos sinais, está à vista o painel dos sinais — e só ele',
      areaEmEdicao.paineisVisiveis.length === 1 && areaEmEdicao.paineisVisiveis[0] === 5,
      areaEmEdicao.paineisVisiveis);
    await page.evaluate(() => { document.getElementById('vb-cel-acrescentar').click(); });
    await new Promise((r) => setTimeout(r, 400));
    const depoisDeEditar = await page.evaluate(estado);
    conferir('depois de corrigir, o trecho continua no COMPASSO 1 — e não foi para o 2',
      depoisDeEditar.compassos.join(',') === antesDeEditar.compassos.join(','),
      { antes: antesDeEditar.compassos, depois: depoisDeEditar.compassos });
    // A ORDEM É A OUTRA METADE DO MESMO BUG: o `push` punha a célula corrigida no FIM. O sinal `⌒`
    // foi acrescentado só ao primeiro trecho, logo é ele que diz, sem ambiguidade, onde a célula
    // corrigida está agora — e tem de continuar a ser a primeira linha.
    conferir('…e a ordem das linhas não mudou: a corrigida continua a ser a PRIMEIRA',
      depoisDeEditar.tabela[0].linhas.length === 3
        && depoisDeEditar.linhasComSinal.length === 1
        && depoisDeEditar.linhasComSinal[0] === 0,
      { comSinal: depoisDeEditar.linhasComSinal, depois: depoisDeEditar.tabela[0].linhas });
    // O PASSO NÃO MUDA SOZINHO. A prova navegou ao 5 para clicar o sinal (é lá que os sinais
    // vivem), e é no 5 que fica: guardar não empurra para lado nenhum. O que se mede é que quem
    // manda é o utilizador — e que a área do trecho fica toda aberta, com o botão de guardar à
    // vista, para não ter de procurar o passo onde se guarda.
    conferir('…e guardar não muda de passo: fica-se onde se estava',
      depoisDeEditar.passo === 5, depoisDeEditar.passo);
    conferir('…e a edição termina: a área do trecho fecha-se e o «!» apaga-se',
      depoisDeEditar.paineisVisiveis.indexOf(4) === -1 && depoisDeEditar.tiraEditando === 'nao',
      { paineis: depoisDeEditar.paineisVisiveis, tira: depoisDeEditar.tiraEditando });

    /* 20-B. UM BALDE VAZIO NÃO É ENVIADO (02/11/2026).
     *
     * O 400 REAL que ela recebeu, com estas palavras da consola: «a direção «devant» não tem
     * célula» — e a resposta dela, que é a chave do defeito: «Em nenhum momento eu escolhi
     * «devant»». Não escolheu: o editor deixou `CELULAS["devant"] = []` quando o último trecho
     * daquela direção saiu, e um balde vazio é INVISÍVEL — a tabela percorre as células, e zero
     * células não desenham linha nenhuma.
     *
     * O QUE SE MEDE, em três sítios: (1) o «×» que tira o último trecho leva a direção consigo;
     * (2) `limparBaldesVazios` deixa o mapa sem chaves vazias; (3) o corpo que o `submit` monta
     * não tem nenhuma.
     */
    console.log('\n20-B. UM BALDE VAZIO NÃO É ENVIADO — O 400 QUE ELA RECEBEU');
    const baldes = await page.evaluate(() => {
      const antes = CELULAS;
      CELULAS = { devant: [], '': [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª'], descricao: 'x' }] };
      const tinha = Object.keys(CELULAS);
      limparBaldesVazios();
      const ficou = Object.keys(CELULAS);
      CELULAS = antes;
      return { tinha, ficou };
    });
    conferir('`limparBaldesVazios` tira a chave vazia e deixa a que tem célula',
      JSON.stringify(baldes.tinha) === JSON.stringify(['devant', ''])
        && JSON.stringify(baldes.ficou) === JSON.stringify(['']),
      baldes);

    // E PELO GESTO: o «×» que tira o ÚLTIMO trecho de uma direção tem de levar a direção consigo.
    await irA(1);
    await page.select('#vbnome', 'Changement');
    await new Promise((r) => setTimeout(r, 400));
    await irA(3);
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '2'; t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '2/4');
    await new Promise((r) => setTimeout(r, 400));
    await escreverFrase('sobe e desce');
    await noPassoDe('#vb-dir');
    await clicar('#vb-dir input[data-valor="devant"]');
    await clicar('#vb-categoria input[value="Perna"]');
    const contagemUnica = valores((await page.evaluate(estado)).contagens);
    await clicar('#vb-contagem input[data-valor="' + contagemUnica[0] + '"]');
    for (const sg of ['1ª', '↓']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 400));
    const antesDoX = await page.evaluate(() => Object.keys(CELULAS));
    await page.evaluate(() => { document.querySelector('#vb-tabela button[data-tirar]').click(); });
    await new Promise((r) => setTimeout(r, 350));
    const depoisDoX = await page.evaluate(() => Object.keys(CELULAS));
    conferir('tirar o último trecho de uma direção leva a direção consigo — não fica balde vazio',
      antesDoX.length === 1 && antesDoX[0] === 'devant' && depoisDoX.length === 0,
      { antes: antesDoX, depois: depoisDoX });

    console.log('\n20-C. DUPLICAR O EXERCÍCIO — A BARRA REPETE-SE, A POSIÇÃO NÃO SE TOCA');
    // A BARRA REPETE-SE (02/11/2026). O pedido dela: o `Plié` em 1ª, 2ª, 4ª e 5ª — a mesma
    // estrutura rítmica e os mesmos braços, mudando só a posição das pernas. Montar do zero cada
    // compasso de cada posição é trabalho repetido, e o que varia é uma coisa só.
    const dup = await page.evaluate(() => {
      const antes = CELULAS;
      const campo = document.getElementById('vbtempos');
      const sel = document.getElementById('vbcompasso');
      const temposAntes = campo.value, musicaAntes = MUSICA_EM_FOCO, compassoAntes = sel.value;
      campo.value = '4'; sel.value = '4/4';
      CELULAS = { '': [
        { contagem: '1–2', categoria: 'Perna', sinais: ['ED', '1ª', '↓', '↑'], descricao: 'x', repeticoes: 2 },
        { contagem: '1–2', categoria: 'Braço', sinais: ['⌒', '2ª', '→', '1ª', '→', '2ª'], descricao: 'y', repeticoes: 2 },
      ] };
      const cobAntes = cobertura();
      const visivelAntes = !document.getElementById('vb-cel-duplicar').hidden;
      duplicarExercicio();
      const mapa = compassosDosTrechos();
      const linhas = CELULAS[''].map((c, k) => ({
        cat: c.categoria, comp: mapa[':' + k], sinais: (c.sinais || []).join(' '),
      }));
      const r = {
        cobAntes, cobDepois: cobertura(), n: CELULAS[''].length,
        tempos: campo.value, musica: MUSICA_EM_FOCO, linhas, visivelAntes,
      };
      CELULAS = antes; campo.value = temposAntes; sel.value = compassoAntes;
      MUSICA_EM_FOCO = musicaAntes;
      return r;
    });
    conferir('o «Duplicar» aparece quando há trechos', dup.visivelAntes, dup);
    conferir('duplicar duplica a decomposição e a cobertura',
      dup.cobAntes === 4 && dup.cobDepois === 8 && dup.n === 4, dup);
    // OS TEMPOS SOBEM SOZINHOS. Duplicar um bloco de 4 numa música de 4 deixaria a música a
    // declarar 4 e as células a cobrir 8 — a gravação recusaria com «sobram 4 tempos» o
    // resultado de uma acção que a própria tela ofereceu.
    conferir('e a música cresce um bloco — o campo e a música em foco acompanham',
      dup.tempos === '8' && dup.musica === '8|4/4', dup);
    // A CÓPIA ENTRA NOS COMPASSOS SEGUINTES, e não a repetir o primeiro: o compasso é derivado
    // da ordem dentro da pista, e é isso que faz 4 tempos virarem 8 — e 8 virarem 16.
    conferir('as cópias caem nos compassos seguintes, não repetem o primeiro',
      dup.linhas.map((l) => l.comp).join(',') === '1,1,2,2', dup.linhas);
    // NENHUM SINAL É REESCRITO. O `1ª` está nas duas pistas — a perna é `ED 1ª ↓ ↑` e o caminho
    // do braço é `⌒ 2ª → 1ª → 2ª` —, e uma troca de posição feita pela máquina escreveria
    // `⌒ 2ª → 2ª → 2ª`. A cópia é tal e qual; a posição muda-se no «Editar», onde se vê o que
    // se está a mudar.
    conferir('a cópia é tal e qual: nenhum sinal é trocado — o `1ª` do braço fica onde está',
      dup.linhas[2].sinais === 'ED 1ª ↓ ↑' && dup.linhas[3].sinais === '⌒ 2ª → 1ª → 2ª', dup.linhas);

    // O QUE QUASE SE PARTIU, E FICA GUARDADO: trocar de exercício LIMPA as células. Cheguei a
    // conservá-las quando a música ainda não existe, e a suite apanhou treze asserções a medir o
    // exercício anterior. A regra fica com prova para quem a queira mudar outra vez.
    const trocou = await page.evaluate(() => {
      const antes = CELULAS;
      CELULAS = { '': [{ contagem: '1–2', categoria: 'Perna', sinais: ['1ª'], descricao: 'x' }] };
      const n = document.getElementById('vbnome');
      const guardado = n.value;
      const o = document.createElement('option');
      o.value = 'Exercício que não tem nada'; o.textContent = o.value; n.appendChild(o);
      n.value = o.value;
      carregarRascunho();
      const ficou = Object.keys(CELULAS).length;
      n.value = guardado;
      n.removeChild(o);
      carregarRascunho();
      CELULAS = antes;
      return { ficou };
    });
    conferir('trocar de exercício limpa a decomposição — as células eram do anterior',
      trocou.ficou === 0, trocou);

    console.log('\n20-D. TROCAR UM SINAL NO LUGAR — O «INVIÁVEL E FRUSTRANTE» DELA');
    /* O QUE ELA DESCREVEU: «quando um arranjo possui muitos sinais (ex: 10 a 20) e o professor
     * precisa alterar apenas um item intermediário (o 3º), o sistema exige que o usuário limpe
     * todos os sinais posteriores», refazendo o trecho do zero. A posição na sequência É a
     * informação — é a ordem em que o gesto acontece —, e mandar o sinal corrigido para o fim
     * seria dizer que ele acontece no fim.
     *
     * A troca tem de ser cirúrgica: um índice substituído, os vizinhos intactos, a ordem igual. */
    await irA(1);
    await page.select('#vbnome', 'Battement tendu');
    await new Promise((r) => setTimeout(r, 400));
    await irA(3);
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4'; t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 400));
    await escreverFrase('sobe e desce');
    await noPassoDe('#vb-dir');
    await clicar('#vb-dir input[data-valor="devant"]');
    await clicar('#vb-categoria input[value="Pé"]');
    await noPassoDe('#vb-sinais');
    for (const sg of ['1ª', '→', '+', '●', '1ª']) {
      await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
    }
    const antesDaTroca = await page.evaluate(() => SINAIS.slice());
    // A FICHA 2 (índice 1) É A QUE SE QUER CORRIGIR — um «→» no meio de cinco sinais.
    await page.evaluate(() => { document.querySelectorAll('#vb-chips [data-trocar]')[1].click(); });
    await new Promise((r) => setTimeout(r, 250));
    const marcado = await page.evaluate(() => ({
      fichas: [...document.querySelectorAll('#vb-chips .chip')].map((x) => x.className),
      indice: SINAL_EM_TROCA,
      nota: (document.getElementById('vb-chips').textContent.match(/a corrigir[^—]*—/) || [''])[0],
      // E AS PÍLULAS DA PALETA NÃO FICAM MARCADAS: marcar para troca não é escolher um sinal.
      paletaMarcada: [...document.querySelectorAll('#vb-sinais input[data-sinal]')]
        .filter((x) => x.checked).length,
    }));
    conferir('a ficha clicada fica marcada — e só ela', marcado.indice === 1
      && marcado.fichas[1].indexOf('em-troca') !== -1
      && marcado.fichas.filter((c) => c.indexOf('em-troca') !== -1).length === 1, marcado);
    conferir('e a ficha diz qual é, em palavras', /sinal 2/.test(marcado.nota), marcado.nota);
    conferir('marcar para troca não marca nenhuma pílula da paleta', marcado.paletaMarcada === 0,
      marcado.paletaMarcada);

    await clicar('#vb-sinais input[data-sinal="⌒"]');
    const depoisDaTroca = await page.evaluate(() => ({
      sinais: SINAIS.slice(), indice: SINAL_EM_TROCA,
    }));
    conferir('o sinal novo entra NO LUGAR do antigo, e não no fim',
      depoisDaTroca.sinais[1] === '⌒' && depoisDaTroca.sinais.length === antesDaTroca.length,
      { antes: antesDaTroca, depois: depoisDaTroca.sinais });
    conferir('…e os vizinhos ficam exactamente onde estavam',
      JSON.stringify(depoisDaTroca.sinais) === JSON.stringify(
        [antesDaTroca[0], '⌒', antesDaTroca[2], antesDaTroca[3], antesDaTroca[4]]),
      depoisDaTroca.sinais);
    conferir('e a marca desaparece — a troca é um gesto, não um modo',
      depoisDaTroca.indice === null, depoisDaTroca.indice);

    // SEM MARCA, A PALETA VOLTA A ACRESCENTAR AO FIM: o gesto antigo não se perdeu.
    await clicar('#vb-sinais input[data-sinal="×"]');
    const voltouAAcrescentar = await page.evaluate(() => SINAIS.slice());
    conferir('sem marca, o clique na paleta volta a acrescentar ao fim',
      voltouAAcrescentar.length === depoisDaTroca.sinais.length + 1
        && voltouAAcrescentar[voltouAAcrescentar.length - 1] === '×',
      voltouAAcrescentar);

    // O «×» TIRA O SINAL CERTO, E DESFAZ A MARCA QUANDO OS ÍNDICES ANDAM PARA TRÁS. Sem isto,
    // uma marca deixada em cima do vizinho trocaria o sinal errado sem ninguém dar por isso.
    await page.evaluate(() => {
      const f = document.querySelectorAll('#vb-chips [data-trocar]');
      f[f.length - 1].click();
    });
    await new Promise((r) => setTimeout(r, 200));
    const antesDoXTroca = await page.evaluate(() => ({ sinais: SINAIS.slice(), i: SINAL_EM_TROCA }));
    await page.evaluate(() => {
      document.querySelectorAll('#vb-chips button[data-sinal]')[0].click();
    });
    await new Promise((r) => setTimeout(r, 200));
    const depoisDoXTroca = await page.evaluate(() => ({ sinais: SINAIS.slice(), i: SINAL_EM_TROCA }));
    conferir('tirar um sinal anterior ao marcado desfaz a marca — os índices andaram para trás',
      antesDoXTroca.i === antesDoXTroca.sinais.length - 1 && depoisDoXTroca.i === null
        && depoisDoXTroca.sinais.length === antesDoXTroca.sinais.length - 1,
      { antes: antesDoXTroca, depois: depoisDoXTroca });

    // CLICAR OUTRA VEZ NA MESMA FICHA DESISTE — não há como ficar preso num modo.
    await page.evaluate(() => { document.querySelectorAll('#vb-chips [data-trocar]')[0].click(); });
    await new Promise((r) => setTimeout(r, 200));
    await page.evaluate(() => { document.querySelectorAll('#vb-chips [data-trocar]')[0].click(); });
    await new Promise((r) => setTimeout(r, 200));
    const desistiu = await page.evaluate(() => SINAL_EM_TROCA);
    conferir('clicar a mesma ficha duas vezes desiste da troca', desistiu === null, desistiu);

    console.log('\n20-E. EDITAR E ESTICAR A MÚSICA SUBSTITUI — NÃO ACRESCENTA AO LADO');
    /* O RELATO DELA, e o que a prova tem de fixar: «ao tentar realizar a evolução de um exercício
     * existente (transformando um Plié de 8 tempos em um novo Plié expandido de 16 tempos), o
     * sistema criou um novo registro e manteve o registro antigo».
     *
     * As duas metades do comportamento: o que VAI no corpo (a chave de onde se veio), e o que a
     * tela DIZ antes de apagar — porque isto apaga dados, e uma coisa que apaga dados tem de o
     * dizer antes, não depois. */
    await irA(1);
    await page.select('#vbnome', 'Battement tendu');
    await new Promise((r) => setTimeout(r, 400));
    await irA(3);
    await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '4'; t.dispatchEvent(new Event('input'));
    });
    await page.select('#vbcompasso', '4/4');
    await new Promise((r) => setTimeout(r, 400));
    await escreverFrase('sobe e desce');
    await noPassoDe('#vb-dir');
    await clicar('#vb-dir input[data-valor="devant"]');
    await clicar('#vb-categoria input[value="Pé"]');
    const contagemP = valores((await page.evaluate(estado)).contagens);
    await clicar('#vb-contagem input[data-valor="' + contagemP[0] + '"]');
    for (const sg of ['1ª', '→', '+']) await clicar('#vb-sinais input[data-sinal="' + sg + '"]');
    await noPassoDe('#vb-cel-acrescentar'); await page.click('#vb-cel-acrescentar');
    await new Promise((r) => setTimeout(r, 400));

    // Estica a música: é o gesto de «evoluir o exercício», e é o que muda a chave.
    const antesDeEsticar = await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      t.value = '8';
      t.dispatchEvent(new Event('input'));
      irParaPasso(6);
      return { nota: document.getElementById('vb-gravar-nota').textContent,
        caixa: document.getElementById('vb-como-nova-caixa').hidden,
        substitui: substituiMusica() };
    });
    conferir('antes de mexer na música não há substituição nenhuma a anunciar',
      antesDeEsticar.substitui === false && antesDeEsticar.nota === ''
        && antesDeEsticar.caixa === true, antesDeEsticar);

    // Com a música mudada, a nota e a caixa aparecem — e dizem qual sai.
    const comMusicaNova = await page.evaluate(() => {
      const guardado = MUSICA_ABERTA;
      MUSICA_ABERTA = '4|4/4';
      pintarComoNova();
      irParaPasso(6);
      const r = {
        substitui: substituiMusica(),
        nota: document.getElementById('vb-gravar-nota').textContent,
        caixa: document.getElementById('vb-como-nova-caixa').hidden,
        antiga: document.getElementById('vb-como-nova-antiga').textContent,
        guardado,
      };
      return r;
    });
    conferir('com a música mudada, a nota DIZ que gravar substitui — e qual sai',
      comMusicaNova.substitui === true && /substitui a música de 4 tempos em 4\/4/.test(comMusicaNova.nota),
      comMusicaNova);
    conferir('…e a caixa de «guardar como música nova» aparece, com a música antiga escrita',
      comMusicaNova.caixa === false && /4 tempos em 4\/4/.test(comMusicaNova.antiga), comMusicaNova);

    // O CORPO. Sem a caixa marcada, `musicaAnterior` vai; com ela, não vai.
    const corpoSemCaixa = await page.evaluate(() => {
      document.getElementById('vb-como-nova').checked = false;
      const comoNova = document.getElementById('vb-como-nova');
      const manter = Boolean(comoNova && comoNova.checked);
      return { musicaAnterior: (!manter && substituiMusica()) ? MUSICA_ABERTA : undefined };
    });
    const corpoComCaixa = await page.evaluate(() => {
      document.getElementById('vb-como-nova').checked = true;
      const comoNova = document.getElementById('vb-como-nova');
      const manter = Boolean(comoNova && comoNova.checked);
      return { musicaAnterior: (!manter && substituiMusica()) ? MUSICA_ABERTA : undefined };
    });
    conferir('sem a caixa marcada, o corpo leva a música de onde se veio — é o que faz substituir',
      corpoSemCaixa.musicaAnterior === '4|4/4', corpoSemCaixa);
    conferir('com a caixa marcada, não leva — e as duas ficam',
      corpoComCaixa.musicaAnterior === undefined, corpoComCaixa);
    await page.evaluate(() => { document.getElementById('vb-como-nova').checked = false; });

    console.log('\n21. OS SEIS PASSOS FORA DO FORMULÁRIO, E A LISTAGEM AO LADO');
    // OS CINCO PASSOS (01/11/2026). A tira é a navegação e o resumo; se um passo desaparecer
    // dela, o painel dele fica inalcançável. Eram sete — e a fusão do exercício, da frase e da
    // posição num só é uma decisão dela, não uma simplificação minha: a prova guarda os cinco,
    // senão volta a sete por inércia, ou a seis, que é como estava antes de nascer o sétimo.
    //
    // O ESTADO É PREPARADO, E NÃO HERDADO DO QUE A SECÇÃO 18 DEIXOU. A tira resume o passo 2 com
    // o nome do exercício escolhido — o «Changement» da secção 18 não tem verbete no alfabeto de
    // exemplo. A posição já não entra no resumo (02/11/2026): ela deixou de ser um campo.
    await irA(2);
    await page.select('#vbnome', 'Battement tendu');
    await new Promise((r) => setTimeout(r, 500));
    const tira = await page.evaluate(() => ({
      numeros: [...document.querySelectorAll('#vb-tira button.passo')]
        .map((b) => b.getAttribute('data-passo')),
      rotulos: [...document.querySelectorAll('#vb-tira button.passo')]
        .map((b) => (b.querySelectorAll('.passo-t')[0] || {}).textContent.trim()),
      valores: [...document.querySelectorAll('#vb-tira .passo-t[id^=vb-v]')]
        .map((x) => x.textContent.trim()),
      paineis: [...document.querySelectorAll('#form-verbete .passo-painel')].map(
        (p) => p.getAttribute('data-passo')),
      // A TIRA TEM DE ESTAR FORA DO `<form>` (01/11/2026) — é o desenho da turma, e é o que ela
      // pediu. `closest` conta a história inteira: se a tira voltar para dentro, isto falha.
      dentroDoFormulario: Boolean(document.getElementById('vb-tira').closest('form')),
      antesDoFormulario: document.getElementById('vb-tira')
        .compareDocumentPosition(document.getElementById('form-verbete'))
        & Node.DOCUMENT_POSITION_FOLLOWING ? true : false,
      // E A TIRA ATRAVESSA A SECÇÃO (01/11/2026). Ela vivia na COLUNA do formulário — a
      // esquerda —, e a pesquisadora viu o resultado: «os steps ficam amontoados em cima do
      // formulário e a listagem fica à direita também dos steps. O que a gente precisa é mover
      // os steps para um bloco acima […] ocupando uma linha só, do começo ao fim da página».
      // Agora é filha directa da secção, e as duas colunas começam ABAIXO dela.
      tiraForaDaColuna: !document.getElementById('vb-tira').closest('.col-form'),
      tiraAtravessaASecao: (() => {
        const tira = document.getElementById('vb-tira').getBoundingClientRect();
        const colForm = document.querySelector('#sec-verbetes .col-form').getBoundingClientRect();
        const lista = document.querySelector('#sec-verbetes .col-lista').getBoundingClientRect();
        return Math.round(tira.top) < Math.round(colForm.top)
          && Math.round(tira.top) < Math.round(lista.top)
          && tira.width > colForm.width + 1;
      })(),
    }));
    /* A TIRA TEM SEIS PASSOS (02/11/2026), e a ordem é a da criação: o exercício novo, o
     * exercício a escolher, a música, o para onde, os sinais, a decomposição. Era cinco, e o
     * primeiro juntava o exercício, a frase e a posição — o «+» do exercício novo não era passo
     * nenhum. */
    conferir('a tira tem seis passos, numerados de 1 a 6',
      JSON.stringify(tira.numeros) === JSON.stringify(['1', '2', '3', '4', '5', '6']),
      tira.numeros);
    conferir('o primeiro é o exercício NOVO — criar deixou de ser um «+»',
      tira.rotulos[0] === 'O exercício novo', tira.rotulos);
    conferir('e o segundo é o exercício a escolher — o antigo passo 1',
      tira.rotulos[1] === 'O exercício', tira.rotulos);
    conferir('e a música é o terceiro — o resto desceu um número, não mudou de sítio',
      tira.rotulos[2] === 'A música', tira.rotulos);
    // A TIRA LÊ O QUE O SELECT MOSTRA — e o select passou a mostrar a etiqueta localizada
    // (02/11/2026). O que se mede continua a ser o mesmo: o passo 2 diz o exercício, e não a
    // frase. A POSIÇÃO NÃO ENTRA (02/11/2026): ela saiu do formulário, e um resumo que ainda a
    // prometesse estaria a pedir uma escolha que já não se faz aqui.
    conferir('o passo 2 diz o nome do exercício — e não promete uma posição que já não se escolhe',
      tira.valores[1] === 'Battement tendu', tira.valores);
    conferir('e o passo 1 diz o que está a ser criado, ou que não há nada a criar',
      typeof tira.valores[0] === 'string' && tira.valores[0].length > 0, tira.valores);
    // UM PASSO, UM PAINEL — agora sem excepção: o antigo passo 1 tinha dois (o par do exercício,
    // que o «modo» bloqueava, e a frase com a posição), e o par desceu para dentro do passo 2.
    conferir('cada passo da tira tem o seu painel — e um só',
      [...new Set(tira.paineis)].sort().join(',') === '1,2,3,4,5,6'
        && tira.paineis.length === tira.numeros.length,
      tira.paineis);
    conferir('a tira está FORA do formulário, e antes dele',
      tira.dentroDoFormulario === false && tira.antesDoFormulario === true, tira);
    conferir('e atravessa a secção, acima do formulário e da listagem',
      tira.tiraForaDaColuna === true && tira.tiraAtravessaASecao === true,
      { foraDaColuna: tira.tiraForaDaColuna, atravessa: tira.tiraAtravessaASecao });

    // O VALOR É DO PASSO EM QUE SE ESTÁ (01/11/2026). Os cinco passos com rótulo E valor mediam
    // 1262px de conteúdo para 1048px de secção — uma linha só não cabia, e cortar os valores
    // com reticências cortava o que eles dizem. O que se mede é a regra: um valor à vista, e é
    // o do passo activo. Visibilidade a sério (`getBoundingClientRect`), não `textContent`: um
    // `display:none` continua a ter texto, e uma asserção sobre texto passaria sem provar nada.
    const valoresDaTira = await page.evaluate(() => {
      const visivel = (e) => e.getBoundingClientRect().width > 0;
      const vals = [...document.querySelectorAll('#vb-tira .passo-t[id^=vb-v]')];
      return {
        total: vals.length,
        visiveis: vals.filter(visivel).map((e) => e.id),
        ativo: (document.querySelector('#vb-tira .passo.ativo') || {}).getAttribute
          ? document.querySelector('#vb-tira .passo.ativo').getAttribute('data-passo') : null,
        rotulosInteiros: [...document.querySelectorAll('#vb-tira .passo-t:not([id^=vb-v])')]
          .filter((t) => t.scrollWidth > t.clientWidth + 1).length,
      };
    });
    conferir('a tira mostra UM valor, e é o do passo em que se está',
      valoresDaTira.visiveis.length === 1 && valoresDaTira.total === 6 &&
      valoresDaTira.visiveis[0] === 'vb-v' + valoresDaTira.ativo, valoresDaTira);
    // OS RÓTULOS INTEIROS SÃO UMA REGRA DE DESENHO, e o rótulo do passo 1 é o mais comprido que
    // a tira já teve («O exercício novo»). O que se mede é o que ela suporta: no passo activo, o
    // rótulo inteiro. Nos outros a folha corta com reticências, e é de propósito.
    conferir('e o rótulo do passo em que se está fica inteiro',
      valoresDaTira.rotulosInteiros === 0, valoresDaTira.rotulosInteiros);

    // O PADRÃO DA SECÇÃO: FORMULÁRIO À ESQUERDA, LISTAGEM À DIREITA (01/11/2026). A 31/10/2026
    // ela tinha passado a uma coluna por causa dos sete passos; a fusão tirou a causa, e a secção
    // voltou a ser o que é em todas as outras. O que se mede é a GEOMETRIA: duas colunas, o
    // formulário na da esquerda, a listagem à direita dele — e presa, a rolar por dentro.
    const layout = await page.evaluate(() => {
      const sec = document.getElementById('sec-verbetes');
      const form = sec.querySelector('.col-form');
      const lista = sec.querySelector('.col-lista');
      const r = (e) => e.getBoundingClientRect();
      return {
        colunas: getComputedStyle(sec).gridTemplateColumns.split(' ').length,
        larguraSec: Math.round(r(sec).width),
        larguraForm: Math.round(r(form).width),
        direitaForm: Math.round(r(form).right),
        esquerdaLista: Math.round(r(lista).left),
        topoForm: Math.round(r(form).top),
        topoLista: Math.round(r(lista).top),
        presa: getComputedStyle(lista).position,
        transbordo: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    conferir('a secção dos verbetes tem DUAS colunas, como as outras',
      layout.colunas === 2, layout);
    conferir('e o formulário fica à esquerda, com a largura da coluna dele',
      layout.larguraForm < layout.larguraSec * 0.6 && layout.larguraForm > 400, layout);
    conferir('a listagem fica AO LADO, à direita do formulário',
      layout.esquerdaLista >= layout.direitaForm, layout);
    conferir('e começa no topo, como o formulário', Math.abs(layout.topoLista - layout.topoForm) <= 2,
      layout);
    conferir('volta a ser uma coluna presa', layout.presa === 'sticky', layout.presa);
    conferir('e as duas colunas cabem na largura da secção', layout.transbordo === 0, layout);

    // AS ETIQUETAS DA LISTAGEM. Antes era o nome e a chave crua da música — «4 | 4/4 · 8 | 4/4»,
    // com o `|` a vazar para a tela. Agora a posição vai em selo e o complemento diz as direções,
    // o compasso, em quantas músicas está escrito e quantos trechos tem.
    const linha = await page.evaluate(() => {
      const li = [...document.querySelectorAll('#lista-verbetes li')]
        .find((x) => /Battement tendu/.test(x.textContent)) || {};
      return {
        selos: [...(li.querySelectorAll ? li.querySelectorAll('.selo') : [])]
          .map((x) => x.textContent.trim()),
        dono: ((li.querySelector ? li.querySelector('.dono') : null) || {}).textContent || '',
        botao: Boolean(li.querySelector && li.querySelector('button.verbetes-editar')),
        musicas: [...document.querySelectorAll('#lista-verbetes li button.verbetes-editar')]
          .filter((x) => /Battement tendu/.test(x.getAttribute('data-nome') || ''))
          .map((x) => x.getAttribute('data-musica')),
      };
    });
    // EM PORTUGUÊS, E O FRANCÊS NÃO APARECE. A asserção anterior pedia «Première position» — o
    // `termo` em cru —, que é precisamente o que ela mandou corrigir. Mede-se agora as duas
    // metades: a etiqueta localizada está lá, e a estrangeira não.
    conferir('a posição do exercício vai num selo, em português',
      linha.selos.indexOf('primeira posição') !== -1, linha.selos);
    conferir('…e o nome estrangeiro não aparece na listagem',
      !/Premi[eè]re/.test(linha.selos.join(' ')), linha.selos);
    /* UMA LINHA POR MÚSICA (02/11/2026). O complemento deixou de agregar («2 músicas»): cada
     * música é uma linha, com os seus tempos, o seu compasso e os seus trechos — e é isso que lhe
     * dá porta. As direções continuam a vir em português, porque a listagem lê o `nome` da
     * gramática e nunca o `termo` em francês. */
    /* O COMPLEMENTO MUDOU DE CONTEÚDO COM O CARTÃO (02/11/2026, escolha dela). A linha diz os
     * factos do exercício — tempos, compasso, trechos e as partes do corpo —, e as DIREÇÕES
     * passaram para a caixinha «Direção», que é onde se abrem. Medir as direções no complemento
     * seria medir o desenho de ontem. */
    conferir('o complemento diz os tempos, o compasso, os trechos e as partes do corpo',
      /4 tempos/.test(linha.dono) && /4\/4/.test(linha.dono)
        && /2 trechos/.test(linha.dono) && /Pé/.test(linha.dono), linha.dono);
    // E A MÚSICA VAI NO BOTÃO. Sem ela, o «editar» abre sempre a primeira — foi o defeito que ela
    // relatou: gravou o `Plié` de 16 tempos e a versão nova não apareceu em sítio nenhum.
    conferir('a música de cada linha vai no botão de editar, e as duas estão lá',
      linha.musicas.join(',') === '4|4/4,8|4/4', linha.musicas);
    conferir('o nome continua a ser o botão que abre o verbete', linha.botao, linha.botao);

    /* O CARTÃO — TRÊS CAIXINHAS, E A DA NOTAÇÃO ABRE A DECOMPOSIÇÃO (02/11/2026).
     *
     * É a opção 1 que ela escolheu na bancada. O que se mede é o que a bancada prometeu: as três
     * caixinhas com «?», o painel a abrir NO CARTÃO EM QUE SE CARREGOU, e a tabela com os trechos
     * que o motor compôs. */
    const cartao = await page.evaluate(() => {
      const li = [...document.querySelectorAll('#lista-verbetes > li')]
        .find((x) => /Battement tendu/.test(x.textContent));
      const caixas = [...li.querySelectorAll('.trio-item')].map((b) => ({
        qual: b.getAttribute('data-balao'), rotulo: b.querySelector('.trio-k').textContent,
        valor: b.querySelector('.trio-v').textContent,
      }));
      const alvo = li.querySelector('.trio-item[data-balao="notacao"]');
      alvo.click();
      const painel = li.querySelector('.trio-painel[data-painel="notacao"]');
      const outros = [...li.querySelectorAll('.trio-painel')].filter((x) => !x.hidden).length;
      const linhasDaTabela = [...(painel.querySelectorAll('tbody tr') || [])].map((tr) => tr.textContent);
      // O QUE SE MEDE ANTES DO SEGUNDO CLIQUE: aberto é o estado DEPOIS de abrir, e `fechou` o
      // estado depois de tocar outra vez. Lidos pela ordem errada, os dois trocam de sentido.
      const aberto = !painel.hidden;
      alvo.click();
      return { caixas, aberto, outros, linhasDaTabela,
        fechou: li.querySelector('.trio-painel[data-painel="notacao"]').hidden };
    });
    conferir('o cartão tem três caixinhas: música, direção e notação',
      cartao.caixas.map((c) => c.rotulo).join(',') === 'Música,Direção,Notação', cartao.caixas);
    conferir('e os valores são os da música daquela linha — não os do exercício inteiro',
      cartao.caixas[0].valor === '4 tempos' && /2 trechos/.test(cartao.caixas[2].valor), cartao.caixas);
    conferir('a caixinha da notação abre a decomposição, e só ela',
      cartao.aberto === true && cartao.outros === 1, cartao);
    conferir('…com uma linha por trecho, o compasso e os sinais do motor',
      cartao.linhasDaTabela.length === 2
        && /1 · 1–2/.test(cartao.linhasDaTabela[0]) && /\[Pé: 1ª → \+\]/.test(cartao.linhasDaTabela[0]),
      cartao.linhasDaTabela);
    conferir('e tocar outra vez na mesma caixinha fecha o painel', cartao.fechou === true, cartao);


    console.log('\n23. A POSIÇÃO SAIU, A MÚSICA TRAVA E O VERBETE PODE SER APAGADO (02/11/2026)');
    /* TRÊS PEDIDOS DELA, E UM DELES REVERTE UMA REGRA ANTIGA.
     *
     *   1. «Faltou fazer o verbo deletar o verbete.» Havia um DELETE que recusava com 409 — o
     *      argumento era o P-03/P-04, e o argumento continua verdadeiro para o HISTÓRICO. Mas um
     *      verbete escrito ontem numa música que não serve não é história: é lixo no dicionário, e
     *      quem o escreveu tem de o poder tirar. O que sai é a decomposição daquela música; o
     *      exercício fica no vocabulário.
     *   2. «Se você escrever os tempos à mão, os trechos desaparecem no mesmo instante. — solução
     *      bloqueia. Não pode editar esse campo.»
     *   3. «Posição em que o exercício acontece» é redundante com os sinais do trecho — o campo
     *      sai, e a posição deixa de se pedir duas vezes.
     */

    // ---- 23-A. O CAMPO DA POSIÇÃO SAIU DO PASSO 2 -----------------------------------
    const v23_posicaoFora = await page.evaluate(() => {
      const painel2 = document.querySelector('#form-verbete .passo-painel[data-passo="2"]');
      return {
        campo: Boolean(document.getElementById('vbposicao')),
        nota: ((painel2 && painel2.querySelector('.nota')) || {}).textContent || '',
        listagem: ((document.getElementById('lista-verbetes') || {}).textContent || ''),
      };
    });
    conferir('o passo 2 já não pergunta a posição — o campo não existe',
      v23_posicaoFora.campo === false, v23_posicaoFora.campo);
    conferir('…e a nota diz onde ela passou a viver: nos sinais do trecho',
      /posi/i.test(v23_posicaoFora.nota) && /sinais/i.test(v23_posicaoFora.nota), v23_posicaoFora.nota);
    // O DADO NÃO SAIU COM O CAMPO. A posição de um verbete antigo continua no alfabeto e continua
    // a ler-se na listagem — tirar o campo é tirar o pedido, não a informação.
    conferir('e o dado fica: a listagem continua a dizer a posição dos verbetes que a têm',
      /primeira posição/.test(v23_posicaoFora.listagem), v23_posicaoFora.listagem.slice(0, 160));

    // ---- 23-B. COM TRECHOS ESCRITOS, A MÚSICA NÃO SE MUDA POR BAIXO DELES -----------
    // O GESTO É O DELA: clicar o nome na listagem. Abrir pelo caminho real importa, porque é o
    // `editarVerbete` que carrega o rascunho e trava (ou não) a música.
    await page.evaluate(() => {
      const b = document.querySelector('#lista-verbetes button.verbetes-editar[data-musica="4|4/4"]');
      if (!b) throw new Error('o verbete do Battement tendu em 4|4 não está na listagem');
      b.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    const v23_travada = await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      const c = document.getElementById('vbcompasso');
      const n = document.getElementById('vb-musica-nota');
      return {
        passo: window.PASSO,
        tempos: t.readOnly, ariaTempos: t.getAttribute('aria-readonly'),
        compasso: c.disabled, marca: n.getAttribute('data-travada'), nota: n.textContent,
        celulas: Object.keys(window.CELULAS || {})
          .reduce((s, d) => s + (window.CELULAS[d] || []).length, 0),
      };
    });
    // EDITAR ABRE NO PASSO 1 (02/11/2026 — era o 2). A frase mora lá, e é ela que se vem corrigir
    // quando se abre um verbete; o seletor do exercício está a um clique na tira.
    conferir('abrir um verbete começa no passo 1, onde está a frase do exercício',
      v23_travada.passo === 1, v23_travada.passo);
    conferir('com trechos escritos, os tempos ficam só de leitura e o compasso fica desactivado',
      v23_travada.celulas > 0 && v23_travada.tempos === true && v23_travada.compasso === true,
      { celulas: v23_travada.celulas, tempos: v23_travada.tempos, compasso: v23_travada.compasso });
    conferir('…e o campo diz que está travado, também para quem lê com leitor de ecrã',
      v23_travada.ariaTempos === 'true' && v23_travada.marca === 'sim',
      { aria: v23_travada.ariaTempos, marca: v23_travada.marca });
    conferir('a nota diz PORQUE está travado, e qual é a saída para outra duração',
      /Já tem trechos escritos/.test(v23_travada.nota) && /Duplicar o exercício/.test(v23_travada.nota),
      v23_travada.nota);

    // ---- 23-C. O «LÊ-SE» ATRÁS DE UM CLIQUE, E A FRASE UMA VEZ SÓ ----------------
    // O trecho novo nasce composto — frase do exercício + «Lê-se: …» —, e é ele que faz aparecer
    // o `<details>`: os trechos do fixture são de uma linha só e não têm «lê-se» para dobrar.
    await acrescentar('derriere');
    await irA(6);
    const v23_dobra = await page.evaluate(() => {
      const tabela = document.getElementById('vb-tabela');
      const fica = document.getElementById('vb-fica');
      const frase = String((document.getElementById('vb-frase') || {}).value || '')
        .split('\n')[0].trim();
      const conta = (txt, alvo) => (alvo ? (String(txt).split(alvo).length - 1) : 0);
      const ds = [...tabela.querySelectorAll('details.dito')];
      return {
        frase,
        quantos: ds.length,
        fechados: ds.filter((d) => !d.open).length,
        sumario: ds.length ? ds[0].querySelector('summary').textContent.trim() : '',
        naTabela: conta(tabela.textContent, frase),
        naPrevia: conta(fica.textContent, frase),
      };
    });
    conferir('o «lê-se» de um trecho fica atrás de um clique, e o clique começa fechado',
      v23_dobra.quantos >= 1 && v23_dobra.fechados === v23_dobra.quantos, v23_dobra);
    conferir('…e o botão que o abre diz «lê-se»', v23_dobra.sumario === 'lê-se', v23_dobra.sumario);
    // A FRASE É DO EXERCÍCIO, E NÃO DE CADA TRECHO: na tabela não se repete nenhuma vez, e na
    // prévia aparece UMA — à frente do que varia.
    conferir('a frase do exercício não se repete em linha nenhuma da tabela',
      v23_dobra.frase.length > 0 && v23_dobra.naTabela === 0, v23_dobra);
    conferir('…e na prévia aparece uma vez, no topo, e não uma por trecho',
      v23_dobra.naPrevia === 1, v23_dobra);

    // ---- 23-D. O «APAGAR» — O VERBO QUE FALTAVA ----------------------------------
    // A CONFIRMAÇÃO É LIDA ANTES DE SER ACEITE: uma coisa que apaga dados tem de dizer o que se
    // perde. Aqui aceita-se, e o que se mede é o pedido que sai e o estado em que a tela fica.
    const v23_antesDeApagar = await page.evaluate(() => {
      const b = document.querySelector('#lista-verbetes button[data-apagar-verbete]');
      return b ? { nome: b.getAttribute('data-apagar-verbete'), texto: b.textContent.trim() } : null;
    });
    conferir('cada exercício da listagem tem um «Apagar», ao lado do nome',
      Boolean(v23_antesDeApagar) && v23_antesDeApagar.texto === 'Apagar', v23_antesDeApagar);

    // O CLIQUE É UM GESTO SÓ, E A LEITURA VEM DEPOIS. Devolver uma promessa de dentro do
    // `evaluate` deixava a prova à espera dentro de um contexto que a própria gravação pode
    // substituir — e o que se perdia era a medição, não o comportamento.
    await page.evaluate(() => {
      // `confirm` é do navegador, e a prova responde por ele — mas guarda o TEXTO da pergunta,
      // que é o que se quer medir: a consequência escrita antes do gesto.
      window.__perguntaDoApagar = '';
      window.confirm = (t) => { window.__perguntaDoApagar = String(t); return true; };
      const b = document.querySelector('#lista-verbetes button[data-apagar-verbete]');
      b.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    const v23_apagar = await page.evaluate(() => {
      const t = document.getElementById('vbtempos');
      const c = document.getElementById('vbcompasso');
      const n = document.getElementById('vb-musica-nota');
      return {
        pergunta: window.__perguntaDoApagar || '',
        recado: ((document.querySelector('[data-res=verbetes]') || {}).textContent || ''),
        passo: window.PASSO,
        nome: ((document.getElementById('vbnome') || {}).value || ''),
        travada: n.getAttribute('data-travada'),
        tempos: t.readOnly, compasso: c.disabled,
      };
    });
    const v23_apagado = APAGADOS[APAGADOS.length - 1] || {};
    conferir('o «Apagar» manda o DELETE com o exercício e a modalidade — o corpo certo',
      v23_apagado && v23_apagado.nome === v23_antesDeApagar.nome && v23_apagado.modalidade === 'bale-classico'
        && Boolean(v23_apagado.token), v23_apagado);
    conferir('a pergunta diz o que se perde antes do gesto: a aula publicada sai em lacuna',
      /não há como a ler de volta/.test(v23_apagar.pergunta) && /lacuna/.test(v23_apagar.pergunta)
        && /dicionário/.test(v23_apagar.pergunta), v23_apagar.pergunta);
    conferir('e o recado diz que foi apagado, com a versão nova',
      /apagado/.test(v23_apagar.recado) && /vers[aã]o 7/.test(v23_apagar.recado), v23_apagar.recado);
    // O FORMULÁRIO SAI DE CIMA DO VERBETE APAGADO — senão a gravação seguinte recriava-o.
    conferir('apagar o verbete que está aberto limpa o formulário e volta ao passo 1',
      v23_apagar.nome === '' && v23_apagar.passo === 1, v23_apagar);
    conferir('…e a música fica outra vez editável — sem trechos, não há o que perder',
      v23_apagar.tempos === false && v23_apagar.compasso === false && v23_apagar.travada === 'nao', v23_apagar);
    // DUAS NAVEGAÇÕES, E SÓ ISSO: a abertura e a âncora da secção. Qualquer outra seria um
    // `reload` — e um `reload` aqui apagou o recado deste gesto até 02/11/2026.
    conferir('e apagar não recarrega a página — o recado fica onde foi escrito',
      navegacoes.length === 2, navegacoes);

    // ---- 23-E. O PASSO 1 É CONDICIONAL: SEM NOME, NINGUÉM É OBRIGADO A NADA --------
    // O PEDIDO DELA, ao pé da letra: «se não preencher o nome, os campos seguintes permanecem
    // opcionais e ele pode navegar livremente; se escrever o nome, os seguintes tornam-se
    // estritamente obrigatórios». O nome é a chave: sem ele não há exercício a criar.
    const v23_semNomeNaCriacao = await page.evaluate(() => ({
      falta: oQueFaltaNoPasso1(),
      passo: window.PASSO,
      termos: 0,
    }));
    conferir('sem nome, o passo 1 não exige mais nada — a navegação é livre',
      v23_semNomeNaCriacao.falta.length === 0 && v23_semNomeNaCriacao.passo === 1, v23_semNomeNaCriacao);

    const v23_antesDosTermos = TERMOS.length;
    const v23_soComNome = await page.evaluate(() => {
      const g = document.getElementById('vnnome');
      g.value = 'Sissonne ouverte';
      g.dispatchEvent(new Event('input'));
      // A FRASE É ESVAZIADA DEPOIS DO NOME, e de propósito: o passo 1 pré-enche «o que acontece»
      // com a definição do dicionário quando o exercício já tem uma. O que se mede aqui é a
      // REGRA (com nome e sem frase, falta), não o pré-enchimento — que tem a sua asserção.
      const f = document.getElementById('vb-frase');
      f.value = '';
      f.dispatchEvent(new Event('input'));
      return { falta: oQueFaltaNoPasso1(),
        categoria: document.getElementById('vncategoria').value,
        tradicao: document.getElementById('vntradicao').value };
    });
    conferir('os dois escolhedores começam VAZIOS — a pergunta não traz a resposta pronta',
      v23_soComNome.categoria === '' && v23_soComNome.tradicao === '',
      { categoria: v23_soComNome.categoria, tradicao: v23_soComNome.tradicao });
    conferir('escrito o nome, o que acontece, a categoria e a tradição passam a faltar',
      v23_soComNome.falta.length === 3
        && /o que acontece/.test(v23_soComNome.falta[0])
        && /categoria/.test(v23_soComNome.falta[1]) && /tradi/.test(v23_soComNome.falta[2]),
      v23_soComNome.falta);

    /* O «SEGUIR» ESTÁ DESACTIVADO — e por isso o clique não faz nada (é o que a linha seguinte
     * mede). A RECUSA CONTINUA A VALER para quem chega por outro caminho (o `Enter` no nome, uma
     * página antiga em cache), e é ela que se mede aqui: chama-se a função, não o botão. */
    await page.evaluate(() => {
      document.getElementById('vb-seguir').click();
      if (typeof criarExercicioDoPasso1 === 'function') criarExercicioDoPasso1();
    });
    await new Promise((r) => setTimeout(r, 400));
    const v23_recusado = await page.evaluate(() => ({
      passo: window.PASSO,
      recado: ((document.querySelector('[data-res=verbetes]') || {}).textContent || ''),
    }));
    conferir('com o nome escrito e o resto em branco, o «Seguir» NÃO avança — e não grava nada',
      v23_recusado.passo === 1 && TERMOS.length === v23_antesDosTermos,
      { passo: v23_recusado.passo, termos: TERMOS.length - v23_antesDosTermos });
    conferir('…e o recado diz, pelo nome, o que falta',
      /Sissonne ouverte/.test(v23_recusado.recado) && /falta/.test(v23_recusado.recado),
      v23_recusado.recado);

    // COMPLETO, O PASSO 1 GRAVA O TERMO — E LEVA A FRASE, que agora é dele.
    await escreverFrase('salta e fecha em quinta');
    await page.select('#vncategoria', 'salto');
    await page.select('#vntradicao', 'francesa');
    await new Promise((r) => setTimeout(r, 150));
    await page.evaluate(() => document.getElementById('vb-seguir').click());
    await new Promise((r) => setTimeout(r, 700));
    const v23_criado = await page.evaluate(() => ({
      passo: window.PASSO,
      falta: oQueFaltaNoPasso1(),
    }));
    const v23_termoNovo = TERMOS[TERMOS.length - 1] || {};
    conferir('com os quatro preenchidos, o «Seguir» cria o exercício e avança para o passo 2',
      TERMOS.length === v23_antesDosTermos + 1 && v23_criado.passo === 2, { v23_criado, termos: TERMOS.length });
    conferir('…e o termo leva a definição escrita no passo 1',
      v23_termoNovo.descricao === 'salta e fecha em quinta', v23_termoNovo);


    console.log('\n24. O BLOCO DO PASSO 1 SÓ VALE COM NOME, O MÉTODO HERDA A TRADIÇÃO (02/11/2026)');

    /* O PEDIDO DELA, pela segunda vez: «os campos Categoria, Tradição de Referência e O que
     * acontece só entram em vigor (e passam a ser obrigatórios para o avanço) se o campo Nome do
     * Exercício Novo estiver devidamente preenchido (…) Se não digitar um nome, permanecem
     * desativados/desconsiderados, permitindo navegar livremente».
     *
     * A regra do servidor já era essa desde o commit anterior; o que faltava era a TELA. Um campo
     * habilitado que não vale nada é pior do que um apagado: parece pedir uma resposta que
     * ninguém vai ler. */

    // ---- 24-A. SEM NOME, OS TRÊS ESTÃO DESACTIVADOS ------------------------------
    const semNomeVigor = await page.evaluate(() => {
      const f = document.getElementById('form-verbete');
      if (f) f.reset();
      document.getElementById('vbacao').value = 'criar';
      window.CELULAS = {}; window.SINAIS = [];
      irParaPasso(1);
      alternarPasso1();
      const q = (id) => document.getElementById(id);
      return {
        cat: q('vncategoria').disabled, ariaCat: q('vncategoria').getAttribute('aria-disabled'),
        tra: q('vntradicao').disabled, frase: q('vb-frase').disabled,
        nota: q('vb-vigor-nota').textContent.trim(),
      };
    });
    conferir('sem nome do exercício novo, a categoria, a tradição e a frase ficam DESACTIVADAS',
      semNomeVigor.cat === true && semNomeVigor.tra === true && semNomeVigor.frase === true,
      semNomeVigor);
    conferir('…e o `aria-disabled` diz o mesmo a quem lê com leitor de ecrã',
      semNomeVigor.ariaCat === 'true', semNomeVigor.ariaCat);
    conferir('a nota diz porque, e que sem nome se avança livremente',
      /entram em vigor quando houver um exercício/.test(semNomeVigor.nota)
        && /avançar livremente/.test(semNomeVigor.nota), semNomeVigor.nota);

    // ---- 24-B. COM NOME, ACORDAM ------------------------------------------------
    const comNomeVigor = await page.evaluate(() => {
      const g = document.getElementById('vnnome');
      g.value = 'Sissonne ouverte';
      g.dispatchEvent(new Event('input'));
      const q = (id) => document.getElementById(id);
      return {
        cat: q('vncategoria').disabled, tra: q('vntradicao').disabled, frase: q('vb-frase').disabled,
        nota: q('vb-vigor-nota').textContent.trim(),
      };
    });
    conferir('escrito o nome, os três passam a estar em vigor',
      comNomeVigor.cat === false && comNomeVigor.tra === false && comNomeVigor.frase === false,
      comNomeVigor);
    conferir('…e a nota desaparece — não há nada a explicar', comNomeVigor.nota === '', comNomeVigor.nota);

    /* ---- 24-C. O PASSO 1 LÊ O PASSO 2, E CONGELA O QUE VEM DO DICIONÁRIO -----------
     *
     * ESTA SECÇÃO MEDIA O CONTRÁRIO, e o contrário era o defeito da manhã: escolher um exercício
     * existente deixava os três campos ABERTOS, porque a frase «é o que a página da aula publica»
     * e quem a veio corrigir não podia ser travado. A pesquisadora reviu-o à tarde: se o exercício
     * já existe, os três campos são a DEFINIÇÃO OFICIAL congelada do dicionário — «devem ficar
     * rigorosamente bloqueados para edição (disabled / readonly)».
     *
     * O que se mede agora, e são três coisas: os campos vêm PREENCHIDOS do termo escolhido, ficam
     * `disabled`, e a nota diz onde é que se mudam. */
    const aCorrigir = await page.evaluate(() => {
      const g = document.getElementById('vnnome');
      g.value = '';
      g.dispatchEvent(new Event('input'));
      document.getElementById('vb-frase').value = '';
      const sel = document.getElementById('vbnome');
      const op = [...sel.options].find((o) => o.value === 'Battement tendu');
      if (!op) throw new Error('o exercício do fixture não está na lista do passo 2');
      sel.value = 'Battement tendu';
      sel.dispatchEvent(new Event('change'));
      const q = (id) => document.getElementById(id);
      return {
        frase: q('vb-frase').disabled, cat: q('vncategoria').disabled, tra: q('vntradicao').disabled,
        valorCat: q('vncategoria').value,
        congelado: q('vncategoria').getAttribute('data-congelado'),
        nota: q('vb-vigor-nota').textContent.trim(),
      };
    });
    conferir('com um exercício ESCOLHIDO no passo 2, os três campos ficam CONGELADOS (disabled)',
      aCorrigir.frase === true && aCorrigir.cat === true && aCorrigir.tra === true, aCorrigir);
    conferir('…e a categoria aparece preenchida com a do exercício, não vazia',
      aCorrigir.valorCat === 'passo' && aCorrigir.congelado === 'sim', aCorrigir);
    conferir('…e a nota diz que a definição é do dicionário e onde se muda',
      /dicionário/.test(aCorrigir.nota) && /bloqueados/.test(aCorrigir.nota), aCorrigir.nota);

    // ---- 24-D. O MÉTODO HERDA A TRADIÇÃO DO EXERCÍCIO ---------------------------
    // «Ao selecionar um exercício no Step 2, o campo Método deste Exercício deve ser preenchido
    // automaticamente com base no valor predefinido no campo Tradição de Referência.»
    const metodoHerdado = await page.evaluate(() => {
      const sel = document.getElementById('vbnome');
      sel.value = 'Battement tendu';
      sel.dispatchEvent(new Event('change'));
      const m = document.getElementById('vbmetodo');
      return {
        valor: m.value,
        texto: (m.selectedOptions[0] || {}).textContent || '',
        opcoes: [...m.options].map((o) => o.value),
        metodo: window.METODO,
      };
    });
    conferir('escolher o exercício pré-enche o método com a tradição DELE — «Francesa»',
      metodoHerdado.valor === 'francesa' && metodoHerdado.texto === 'Francesa', metodoHerdado);
    conferir('…e o valor gravado é a CHAVE, não o rótulo — é ela que a tabela do alfabeto usa',
      metodoHerdado.metodo === 'francesa', metodoHerdado.metodo);
    conferir('e a lista do método é a do `tradicoes.json`, com o rótulo do ficheiro, mais os dois livres',
      ['RAD', 'francesa', 'Vaganova', 'cubana', 'Cecchetti', 'Escola livre']
        .every((v) => metodoHerdado.opcoes.indexOf(v) !== -1), metodoHerdado.opcoes);

    // A ESCOLHA À MÃO NÃO É ATROPELADA. Quem pôs «Cecchetti» neste verbete não o perde por mudar
    // de exercício — a sugestão só entra num campo vazio ou ainda com a sugestão anterior.
    const escolhaAMao = await page.evaluate(() => {
      const m = document.getElementById('vbmetodo');
      m.value = 'Cecchetti';
      m.dispatchEvent(new Event('change'));
      const sel = document.getElementById('vbnome');
      sel.value = 'Changement';
      sel.dispatchEvent(new Event('change'));
      return { valor: m.value, metodo: window.METODO };
    });
    conferir('a escolha feita à mão sobrevive à troca de exercício',
      escolhaAMao.valor === 'Cecchetti' && escolhaAMao.metodo === 'Cecchetti', escolhaAMao);

    // E NUM CAMPO VAZIO, A SUGESTÃO ENTRA — agora CUBANA, que é a tradição do `Changement`.
    const sugestaoNova = await page.evaluate(() => {
      const m = document.getElementById('vbmetodo');
      m.value = '';
      m.dispatchEvent(new Event('change'));
      const sel = document.getElementById('vbnome');
      sel.value = 'Battement tendu';
      sel.dispatchEvent(new Event('change'));
      const antes = m.value;
      sel.value = 'Changement';
      sel.dispatchEvent(new Event('change'));
      return { antes, depois: m.value, metodo: window.METODO };
    });
    conferir('num campo vazio a sugestão entra, e muda com o exercício — FRANCESA, depois CUBANA',
      sugestaoNova.antes === 'francesa' && sugestaoNova.depois === 'cubana', sugestaoNova);

    // ---- 24-E. SEM DECOMPOSIÇÃO, O «GRAVAR» ESTÁ DESACTIVADO --------------------
    // «O botão Gravar Verbete só deve ser habilitado ou processado se houver pelo menos uma linha
    // consolidada na Tabela de Decomposição (Step 6).»
    await page.evaluate(() => {
      window.CELULAS = {}; window.SINAIS = [];
      irParaPasso(6);
      pintarGravar();
    });
    const semTrechos = await page.evaluate(() => {
      const b = document.getElementById('vb-gravar');
      return {
        desactivado: b.disabled, aria: b.getAttribute('aria-disabled'), titulo: b.getAttribute('title'),
        nota: (document.getElementById('vb-gravar-nota') || {}).textContent || '',
      };
    });
    conferir('sem nenhum trecho, o «Gravar verbete» está desactivado',
      semTrechos.desactivado === true && semTrechos.aria === 'true', semTrechos);
    conferir('…e o título do botão diz o que falta',
      /sem decomposição não existe/.test(semTrechos.titulo || '')
        && /ao menos um trecho/.test(semTrechos.titulo || ''), semTrechos.titulo);
    /* A NOTA DO RODAPÉ NÃO REPETE O QUE O BOTÃO DIZ (03/11/2026). Ela dizia «Ainda não há nenhum
     * trecho. Escreva ao menos um na decomposição…» — instrução dentro de um formulário, que a
     * limpeza pedida por ela removeu. O rodapé passou a ter um ofício só: a substituição da
     * música. O `disabled` e o `title` são quem diz o que falta. */
    conferir('…e a nota do rodapé não repete o aviso em prosa',
      !/Ainda não há nenhum trecho|Escreva ao menos um/.test(semTrechos.nota), semTrechos.nota);

    /* ---- 24-F. O «APAGAR» SAIU DO PASSO 6 (02/11/2026, segunda correcção do mesmo dia) ----
     *
     * ESTA SECÇÃO MEDIA O CONTRÁRIO, E O CONTRÁRIO ERA O DEFEITO. A manhã de 02/11/2026 pediu o
     * botão «na listagem e na tela de decomposição»; à tarde ela reviu: o passo 6 é onde se
     * ESCREVE a decomposição, e um botão que apaga o verbete inteiro ao lado do «Acrescentar
     * trecho» é um alvo a um clique do gesto mais frequente. O lugar de apagar é a LISTA.
     *
     * A prova passa a medir três coisas: que o botão não está no passo 6, que o verbo continua na
     * listagem (com a confirmação), e que nada mais o pinta — porque um botão escondido por script
     * que já não existe na marcação é código que ninguém executa. */
    const apagarNo6 = await page.evaluate(() => ({
      noPasso6: Boolean(document.querySelector('#vb-tabela, #form-verbete') &&
        document.getElementById('vb-cel-apagar')),
      noScript: /vb-cel-apagar/.test(document.documentElement.innerHTML),
    }));
    conferir('o passo 6 já não tem o «Apagar o verbete» — nem na marcação, nem no script',
      apagarNo6.noPasso6 === false && apagarNo6.noScript === false, apagarNo6);

    const apagarNaLista = await page.evaluate(() => {
      const b = document.querySelector('#lista-verbetes button[data-apagar-verbete]');
      return { existe: Boolean(b), alvo: b ? b.getAttribute('data-apagar-verbete') : null,
        texto: b ? (b.textContent || '').trim() : '' };
    });
    conferir('…e o verbo continua na LISTAGEM, que é o lugar de apagar um registo',
      apagarNaLista.existe && apagarNaLista.alvo === 'Battement tendu', apagarNaLista);

    /* ---- 24-G. A NAVEGAÇÃO É PROGRESSIVA (02/11/2026, segunda correcção) ----------------
     *
     * O PEDIDO: «enquanto o utilizador não preencher/selecionar os campos obrigatórios da etapa
     * actual, o step seguinte permanece desabilitado; o botão Seguir permanece bloqueado; o botão
     * Voltar permanece habilitado».
     *
     * A REGRA ANTERIOR ERA A OPOSTA — «a tira não bloqueia, é a diferença entre conduzir e
     * impedir» —, e ela reviu-a. Para trás continua tudo aberto: voltar não perde nada, e travar a
     * volta seria impedir a correcção. */
    const navVazia = await page.evaluate(() => {
      document.getElementById('vnnome').value = '';
      document.getElementById('vbnome').value = '';
      window.CELULAS = {}; window.SINAIS = [];
      const t = document.getElementById('vbtempos');
      t.value = ''; t.dispatchEvent(new Event('input'));
      irParaPasso(1);
      pintarPassos();
      const passos = Array.prototype.slice
        .call(document.querySelectorAll('#vb-tira button.passo'))
        .map((b) => ({ n: b.getAttribute('data-passo'), disabled: b.disabled }));
      const seguir = document.getElementById('vb-seguir');
      return { passos, seguir: seguir.disabled, titulo: seguir.getAttribute('title') || '',
        voltar: document.getElementById('vb-voltar').disabled };
    });
    /* O PASSO 1 VAZIO NÃO É UMA FALTA: sem nome de exercício novo, não há nada a exigir, e o
     * passo 2 abre. É a mesma regra de 02/11/2026, do lado do bloqueio — «sem nome, pode avançar
     * livremente». Do 3 em diante fecha tudo, porque já falta o exercício escolhido. */
    conferir('sem exercício novo e sem música, o passo 2 abre e do 3 em diante fecha',
      navVazia.passos.filter((p) => p.n === '1')[0].disabled === false
        && navVazia.passos.filter((p) => p.n === '2')[0].disabled === false
        && navVazia.passos.filter((p) => Number(p.n) >= 3).every((p) => p.disabled === true),
      navVazia.passos);
    conferir('o «Voltar» está desactivado no primeiro passo (não há para onde voltar)',
      navVazia.voltar === true, navVazia.voltar);

    const navComExercicio = await page.evaluate(() => {
      const sel = document.getElementById('vbnome');
      sel.value = 'Battement tendu';
      sel.dispatchEvent(new Event('change'));
      irParaPasso(2);
      pintarPassos();
      const t = document.getElementById('vbtempos');
      const selP = Array.prototype.slice
        .call(document.querySelectorAll('#vb-tira button.passo'))
        .map((b) => ({ n: b.getAttribute('data-passo'), disabled: b.disabled }));
      return { passos: selP, seguir: document.getElementById('vb-seguir').disabled,
        voltar: document.getElementById('vb-voltar').disabled,
        tempos: t.value };
    });
    conferir('com o exercício escolhido, o passo 3 abre — e o «Voltar» volta a poder',
      navComExercicio.passos.filter((p) => p.n === '3')[0].disabled === false
        && navComExercicio.passos.filter((p) => p.n === '4')[0].disabled === true
        && navComExercicio.voltar === false,
      navComExercicio);

    // O «SEGUIR» DIZ O QUE FALTA — um botão apagado sem explicação lê-se como avaria.
    const semMusica = await page.evaluate(() => {
      document.getElementById('vbtempos').value = '';
      document.getElementById('vbtempos').dispatchEvent(new Event('input'));
      irParaPasso(3);
      pintarPassos();
      const b = document.getElementById('vb-seguir');
      return { desactivado: b.disabled, titulo: b.getAttribute('title') || '' };
    });
    conferir('sem os tempos da música, o «Seguir» do passo 3 fica bloqueado e diz o que falta',
      semMusica.desactivado === true && /quantos tempos/.test(semMusica.titulo), semMusica);

    // ---- 24-H. O «ACRESCENTAR TRECHO» ESPERA OS PASSOS 1 A 5 -------------------------
    // «O botão "Acrescentar Trecho" só deve ser habilitado quando todos os campos obrigatórios
    // dos steps anteriores (1 a 5) estiverem devidamente preenchidos e válidos.»
    const acrescentarFechado = await page.evaluate(() => {
      window.SINAIS = [];
      window.CELULAS = {};
      pintarPassos();
      const b = document.getElementById('vb-cel-acrescentar');
      return { desactivado: b.disabled, titulo: b.getAttribute('title') || '' };
    });
    conferir('sem sinais, o «Acrescentar trecho» está desactivado',
      acrescentarFechado.desactivado === true
        && /falta .*sinal/i.test(acrescentarFechado.titulo), acrescentarFechado);

    console.log('\n22. NADA TRANSBORDA, E O SCRIPT NÃO REBENTA');
    for (const largura of [320, 390, 768, 1280]) {
      await page.setViewport({ width: largura, height: 900 });
      await new Promise((r) => setTimeout(r, 250));
      const m = await page.evaluate(estado);
      conferir('em ' + largura + 'px não há transbordo horizontal', m.transbordo === 0, m.transbordo);
    }
    conferir('nenhum erro de JavaScript na página', errosDeJs.length === 0, errosDeJs);
  } finally {
    await browser.close();
    srv.close();
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: os seis passos, o exercício novo como');
  console.log('passo 1 (o «Seguir →» grava o termo e avança, sem «+» nem botões próprios), os dois');
  console.log('eixos separados, os sinais a comporem-se por clique, a orientação a gravar-se com o');
  console.log('trecho, e a gravação a recusar um verbete que não fecha a música.');
})().catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
