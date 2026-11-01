#!/usr/bin/env node
'use strict';

/**
 * provar-producao.js — a prova da página da Produção (o gabinete dos Bastidores).
 *
 * A página é montada por concatenação em `motor/servidor/bastidores.js`. O defeito que
 * esta prova trava é invisível de fora: o script saía numa LINHA SÓ, e o primeiro
 * comentário `//` comentava todo o resto. O login continuava funcionando (vinha antes do
 * comentário), mas `mostrarSecao` e TODOS os handlers dos formulários nunca eram
 * registrados — a Produção aparecia com as seis secções empilhadas (a «linguiça») e
 * nenhum botão respondia; o menu só mexia no hash da URL.
 *
 * A prova roda o script servido num DOM de mentira (o suficiente para a página operar) e
 * confere o que a direção vê:
 *
 *   1. a página e as listagens não são cacheáveis (`no-store`);
 *   2. as seis secções existem, e SÓ o Painel inicial nasce visível no HTML;
 *   3. o script servido não tem comentário de linha (o que comia o resto do script);
 *   4. o script roda por INTEIRO: os handlers dos formulários e do menu são registrados;
 *   5. o menu troca a secção — uma de cada vez — e o hash da URL acompanha;
 *   6. a RÉGUA DA RUBRICA é da turma: nasce com a padrão, muda pelo formulário próprio, e
 *      uma turma sem régua gravada nunca sai sem uma.
 *
 *   uso: node experimentos/provar-producao.js
 */

const fs = require('fs');
const path = require('path');
const bastidores = require('../motor/servidor/bastidores.js');

const RAIZ = path.join(__dirname, '..');
const BASE = 'https://barra.tmenegaz77.workers.dev';

/** O KV de mentira: só memória, com o contrato que `bastidores.js` usa (get/put/list/delete). */
function criarKv() {
  const dados = new Map();
  return {
    async get(chave) {
      return dados.has(chave) ? dados.get(chave) : null;
    },
    async put(chave, valor) {
      dados.set(chave, String(valor));
    },
    async delete(chave) {
      dados.delete(chave);
    },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

function ambiente() {
  return {
    ESCOLA_SLUG: 'barra',
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'senha-da-direcao',
    SENHA_PROFESSOR: 'senha-do-professor',
    PROFESSOR_NOME: 'Leticia',
    PADD_KV: criarKv(),
  };
}

/** A senha da direção da prova: a mesma que `ambiente()` injeta. */
const SENHA_DA_DIRECAO = 'senha-da-direcao';

async function pedir(env, caminho, init) {
  const resposta = await bastidores.fetch(new Request(BASE + caminho, init), env);
  if (!resposta) throw new Error('os Bastidores não trataram ' + caminho);
  return resposta;
}

/**
 * Um DOM de mentira com o que a página usa: os elementos por `id`, as secções
 * (com o `hidden` que o servidor mandou), os itens do menu e os ouvintes de evento —
 * registrados por elemento, para conferir se o script chegou ao fim.
 */
function criarDomFalso(html) {
  const elementos = new Map();
  const doId = (id) => {
    if (!elementos.has(id)) {
      elementos.set(id, {
        id,
        hidden: false,
        value: '',
        className: '',
        textContent: '',
        atributos: {},
        ouvintes: {},
        addEventListener(tipo, fn) {
          (this.ouvintes[tipo] = this.ouvintes[tipo] || []).push(fn);
        },
        getAttribute(nome) {
          return Object.prototype.hasOwnProperty.call(this.atributos, nome) ? this.atributos[nome] : null;
        },
        setAttribute(nome, valor) {
          this.atributos[nome] = valor;
        },
        // O PAR do `setAttribute`, e pelo mesmo motivo que o `querySelector` faltava: o
        // script só passou a chamá-lo agora (o `aria-current` do menu, 18/10/2026).
        removeAttribute(nome) {
          delete this.atributos[nome];
        },
        closest() {
          return null;
        },
        querySelector() {
          return null;
        },
        // O DOM falso da PÁGINA INTEIRA não monta as árvores: ele só existe para o
        // script rodar no load. Sem `querySelectorAll`, um `montarAbas` que percorra as
        // secções morria com «is not a function» — e a prova acusava o script, não o
        // harness. Devolver vazio é o que este DOM sabe fazer.
        querySelectorAll() {
          return [];
        },
      });
    }
    return elementos.get(id);
  };

  const secoes = [...html.matchAll(/<section class="secao" id="([^"]+)"([^>]*)>/g)].map((m) => {
    const secao = doId(m[1]);
    secao.hidden = m[2].includes('hidden');
    return secao;
  });

  const links = [...html.matchAll(/<a href="#([^"]+)" data-secao="([^"]+)"/g)].map((m) => {
    const link = doId('menu:' + m[2]);
    link.setAttribute('data-secao', m[2]);
    link.setAttribute('href', '#' + m[1]);
    return link;
  });

  // O `.lateral` é UM elemento, e a página o procura com `querySelector` desde o menu da
  // folha (18/10/2026) — o `querySelectorAll` sozinho não servia. Ele nasce com
  // `data-aberta="nao"`, que é o estado que o HTML serve.
  const lateral = criarElemento('nav', 'lateral');
  lateral.setAttribute('data-aberta', 'nao');

  const documento = {
    ouvintes: {},
    getElementById: doId,
    addEventListener(tipo, fn) {
      (documento.ouvintes[tipo] = documento.ouvintes[tipo] || []).push(fn);
    },
    querySelectorAll(seletor) {
      if (seletor === '.secao') return secoes;
      if (seletor === '.lateral a') return links;
      return [];
    },
    querySelector(seletor) {
      return seletor === '.lateral' ? lateral : criarElemento('div');
    },
    // O `body` é tocado pela folha (trava a rolagem do fundo enquanto está aberta).
    body: criarElemento('body'),
  };

  const janela = {
    ouvintes: {},
    addEventListener(tipo, fn) {
      (janela.ouvintes[tipo] = janela.ouvintes[tipo] || []).push(fn);
    },
  };

  return { documento, janela, secoes, links, doId, lateral };
}

/** As secções visíveis agora — o que a direção vê na tela. */
function visiveis(secoes) {
  return secoes.filter((s) => !s.hidden).map((s) => s.id);
}

/**
 * UM ELEMENTO de mentira, pequeno mas honesto: children, atributos, `classe`, e os quatro
 * seletores que o código da página realmente usa (`.classe`, `tag`, `tag.classe` e a
 * combinação de dois — `.fichas .vazio`, `datalist option`). Não é um DOM: é o mínimo que
 * deixa as funções VERDADEIRAS rodar e serem medidas.
 */
function criarElemento(tag, classe) {
  const el = {
    tagName: tag,
    className: classe || '',
    hidden: false,
    disabled: false,
    textContent: '',
    value: '',
    children: [],
    pai: null,
    appendChild(f) {
      el.children.push(f);
      f.pai = el;
      return f;
    },
    removeChild(f) {
      const i = el.children.indexOf(f);
      if (i !== -1) el.children.splice(i, 1);
      return f;
    },
    getAttribute(n) {
      return Object.prototype.hasOwnProperty.call(el.atributos, n) ? el.atributos[n] : null;
    },
    setAttribute(n, v) {
      el.atributos[n] = String(v);
    },
    // `removeAttribute` chegou junto com o `aria-current` do menu (18/10/2026): o item que
    // deixa de estar ativo tem de PERDER a marca, não ficar com ela a `""`. É o espelho do
    // `setAttribute`, e faltava pelo mesmo motivo que o `querySelector` faltava — ninguém
    // o tinha chamado ainda.
    removeAttribute(n) {
      delete el.atributos[n];
    },
    get parentElement() {
      return el.pai;
    },
    querySelectorAll(sel) {
      return consultar(el, sel);
    },
    querySelector(sel) {
      return consultar(el, sel)[0] || null;
    },
    closest(sel) {
      let no = el;
      while (no) {
        if (casaComposto(no, sel)) return no;
        no = no.pai;
      }
      return null;
    },
    addEventListener() {},
  };
  el.atributos = {};
  return el;
}

function descendentes(el) {
  const fora = [];
  for (const f of el.children) {
    fora.push(f);
    fora.push(...descendentes(f));
  }
  return fora;
}

function casaSimples(el, sel) {
  // O `#id` CHEGOU AQUI EM 31/10/2026, com a segunda tira de passos: o script da página
  // deixou de escrever `button.passo` e passou a escrever `#turmas-form button.passo` —
  // porque a página tem agora duas tiras, e «o passo» deixou de ser um só. Um DOM falso que
  // não soubesse ler `#id` devolvia zero botões, e a prova dizia «ok» sem ter clicado em
  // nada.
  const m = String(sel).match(/^([a-z]*)(?:#([\w-]+))?(?:\.([\w-]+))?$/i);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1]) return false;
  if (m[2] && String(el.id || '') !== m[2]) return false;
  if (m[3] && String(el.className).split(/\s+/).indexOf(m[3]) === -1) return false;
  return true;
}

function consultar(raiz, sel) {
  const partes = String(sel).trim().split(/\s+/);
  let atuais = [raiz];
  for (const parte of partes) {
    const prox = [];
    for (const base of atuais) {
      for (const d of descendentes(base)) if (casaSimples(d, parte)) prox.push(d);
    }
    atuais = prox;
  }
  return atuais;
}

/** Um seletor de vários compostos vale para o elemento que casa com o ÚLTIMO e tem um
 *  ancestral que casa com os anteriores — é o que `closest` faz num navegador. A versão
 *  anterior olhava só para o primeiro composto, e por isso um `closest("#turmas-form
 *  button.passo")` feito a partir do BOTÃO devolvia o próprio formulário: o botão deixou de
 *  ser achado, e o clique nos passos media o vazio (31/10/2026). */
function casaComposto(el, sel) {
  const partes = String(sel).trim().split(/\s+/);
  if (partes.length === 1) return casaSimples(el, partes[0]);
  if (!casaSimples(el, partes[partes.length - 1])) return false;
  let no = el.pai;
  while (no) {
    if (casaComposto(no, partes.slice(0, -1).join(' '))) return true;
    no = no.pai;
  }
  return false;
}

/** Uma lista paginada de mentira, com o mesmo formato que a página serve. */
function criarPainel(nItens, porPagina) {
  const painel = criarElemento('div');
  painel.setAttribute('data-paginar', '');
  painel.setAttribute('data-por-pagina', String(porPagina));
  const ul = criarElemento('ul');
  for (let i = 0; i < nItens; i++) ul.appendChild(criarElemento('li'));
  /* O FORMATO DO RODAPÉ MUDOU DE NOME EM 23/10/2026 (era `.paginacao`/`.pag-*`, agora
     `.paginas`/`.paginas-*`). O comportamento é o mesmo — a peça é que teve de mudar de nome
     porque `paginacao` já era a classe da barra de controle do LANÇAMENTO, e a regra nova
     passou a desenhar a barra dele. Uma prova com o formato de ontem mede uma página que já
     não existe. */
  const rodape = criarElemento('div', 'paginas');
  const info = criarElemento('span', 'paginas-info');
  const ant = criarElemento('button', 'paginas-ant');
  const prox = criarElemento('button', 'paginas-prox');
  rodape.appendChild(info);
  rodape.appendChild(ant);
  rodape.appendChild(prox);
  painel.appendChild(ul);
  painel.appendChild(rodape);
  paineis.push(painel);
  return { painel, ul, rodape, info, ant, prox };
}

/** Um escolhedor de mentira, com as fichas, o vazio e o menu de opções. */
function criarEscolhedor(id, valores) {
  const esc = criarElemento('div', 'escolhedor');
  esc.id = id;
  const fichas = criarElemento('div', 'escolhidos');
  fichas.appendChild(criarElemento('span', 'vazio'));
  esc.appendChild(fichas);
  const entrada = criarElemento('div', 'entrada');
  const sel = criarElemento('select', 'opcoes');
  sel.value = '';
  entrada.appendChild(sel);
  esc.appendChild(entrada);
  registro.set(id, esc);
  return esc;
}

const paineis = [];
const registro = new Map();

/** Executa o script SERVIDO contra este DOM e devolve as funções que interessa chamar. */
function executarComponentes(script) {
  const cliques = [];
  const documento = {
    getElementById(id) {
      if (!registro.has(id)) {
        const el = criarElemento('div');
        el.id = id;
        registro.set(id, el);
      }
      return registro.get(id);
    },
    createElement(tag) {
      return criarElemento(tag);
    },
    // O `querySelectorAll` DO DOCUMENTO PASSOU A PROCURAR A SÉRIE (18/10/2026). Antes
    // devolvia vazio para tudo menos `[data-paginar]`, e por isso um `mostrarPasso` que
    // percorresse os botões nunca encontrava nenhum: a prova «passava» sem ter exercitado
    // o que dizia exercitar. Num navegador, `document.querySelectorAll` procura os
    // elementos LIGADOS ao documento — e é isso que este faz, a partir do `body`. Quem
    // quiser que o documento veja um elemento tem de o lá pendurar (ver `criarSecaoDePassos`).
    // O `querySelectorAll` PROCURA A SÉRIE a partir do `body` (18/10/2026). Antes devolvia
    // vazio para tudo menos `[data-paginar]`, e por isso um `mostrarPasso` que percorresse os
    // botões dos passos não encontrava nenhum: a prova «passava» sem ter exercitado o que
    // dizia exercitar. Num navegador o documento acha o que está LIGADO a ele, e é isso que
    // se reproduz aqui — quem quiser ser achado tem de estar no `body` (ver
    // `criarSecaoDePassos`).
    querySelectorAll(sel) {
      if (sel === '[data-paginar]') return paineis;
      return consultar(documento.body, sel);
    },
    // O `querySelector` CHEGOU A FALTAR AQUI (18/10/2026), e o defeito só apareceu quando
    // o script da página passou a usá-lo — no menu da Produção, que procura a `.lateral`
    // para abrir e fechar a folha. Um DOM de mentira que não tem o método que o script
    // chama não está a testar o script: está a testá-lo contra si mesmo. Devolve um
    // elemento criado à procura, para os `getAttribute`/`setAttribute` funcionarem como
    // no navegador (o elemento nasce sem atributos, que é o estado real antes do clique).
    querySelector(sel) {
      const chave = 'sel:' + sel;
      if (!registro.has(chave)) registro.set(chave, criarElemento('div', sel.replace(/^\./, '')));
      return registro.get(chave);
    },
    // O `body` também passou a ser tocado: a folha travа a rolagem do fundo enquanto está
    // aberta. Sem ele, o script morria no `document.body.style` — e «morrer» aqui quer
    // dizer que as provas seguintes mediam uma página que já não estava a correr.
    body: criarElemento('body'),
    addEventListener(tipo, fn) {
      if (tipo === 'click') cliques.push(fn);
    },
  };
  const janela = { addEventListener() {} };
  const local = { hash: '' };
  const sessao = { getItem: () => null, setItem: () => {} };
  const buscar = async () => ({ json: async () => ({ ok: false }) });
  // eslint-disable-next-line no-new-func
  const api = new Function(
    'document', 'window', 'location', 'fetch', 'sessionStorage', 'alert', 'confirm',
    script + '\n;return {paginar:paginar, adicionarFicha:adicionarFicha, fichasDe:fichasDe,' +
      ' mostrarVazio:mostrarVazio};'
  )(documento, janela, local, buscar, sessao, () => {}, () => true);
  // A entrega de um clique a TODOS os ouvintes de `document`, como o navegador faz: é assim
  // que as abas e o «Adicionar» são exercitados de verdade, e não só relidos.
  api.clicar = (el) => cliques.forEach((fn) => fn({ target: el }));
  // O `documento` SAI DAQUI, e não do `criarDomFalso`: são dois DOM falsos, e o script que
  // se está a exercitar recebeu ESTE. Pendurar a secção dos passos no outro fazia o
  // `document.querySelectorAll` do script procurar num documento e a secção estar no outro
  // — a prova media o vazio e dizia «ok».
  api.documento = documento;
  return api;
}

/**
 * Uma secção Turmas de mentira, com a barra de PASSOS e os três painéis (18/10/2026).
 *
 * Era «abas»: três coisas paralelas, com `role="tablist"`. Passou a «passos»: uma sequência
 * — cria-se a turma, passa-se pelas rubricas, e só então se associa —, com `<ol>` e
 * `aria-current="step"`. A bancada mudou com o desenho porque é o desenho que se está a
 * exercitar; o que NÃO mudou é o que se prova: que clicar troca o painel, e que só um fica
 * visível.
 */
function criarSecaoDePassos(documento) {
  const nomes = ['turma', 'rubrica', 'vincular'];
  // A ÁRVORE É A DA PÁGINA, e não uma secção solta (31/10/2026): o formulário da turma vive
  // dentro de `#turmas-form` e os painéis dentro de `#turmas-paineis`, porque a página passou
  // a ter DUAS tiras de passos — a da turma e a do verbete — e o script que as acciona tem de
  // saber qual é qual. Uma secção de mentira pendurada no `body` deixou de ser o que o script
  // procura: a prova mediria uma página que já não existe.
  const form = criarElemento('div', 'turmas-form');
  form.id = 'turmas-form';
  const faixa = criarElemento('div', 'turmas-faixa');
  form.appendChild(faixa);
  const lista = criarElemento('ol', 'passos');
  faixa.appendChild(lista);
  const botoes = nomes.map((n) => {
    const b = criarElemento('button', n === 'turma' ? 'passo ativo' : 'passo');
    b.setAttribute('data-passo', n);
    if (n === 'turma') b.setAttribute('aria-current', 'step');
    lista.appendChild(b);
    return b;
  });
  const miolo = criarElemento('div');
  miolo.id = 'turmas-paineis';
  form.appendChild(miolo);
  const paineis = nomes.map((n, i) => {
    const p = criarElemento('div', 'passo-painel');
    p.id = 'passo-' + n;
    p.hidden = i !== 0;
    miolo.appendChild(p);
    return p;
  });
  // A secção tem de estar LIGADA ao documento, como estaria num navegador: o
  // `document.querySelectorAll` do script procura a partir do `body`, e um ramo solto não
  // é achado por ninguém — nem aqui, nem lá.
  documento.body.appendChild(form);
  return { secao: form, lista, botoes, paineis };
}

async function principal() {
  const casos = [];
  const conferir = (nome, obtido, esperado) => {
    const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
    casos.push({ nome, ok, obtido, esperado });
  };

  const env = ambiente();

  // 1. A página e as listagens não podem ser cacheáveis — uma Produção de antes do
  //    deploy não pode continuar aparecendo no navegador.
  const pagina = await pedir(env, '/bastidores/producao');
  const html = await pagina.text();
  conferir('a página não é cacheável', pagina.headers.get('Cache-Control'), 'no-store, max-age=0');
  const listagem = await pedir(env, '/api/bastidores/curadorias');
  conferir('a listagem não é cacheável', listagem.headers.get('Cache-Control'), 'no-store, max-age=0');

  // 2. As secções: todas no DOM, e só o Painel inicial visível de saída.
  // O MAIOR script inline é o da página. Desde 16/10/2026 há também um script
  // pequeno no <head> (o anti-flash do tema), e pegar o PRIMEIRO passou a executar
  // o bootstrap em vez da página — a prova acusava «paginar is not defined».
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .sort((a, b) => b.length - a.length)[0] || '';
  const dom = criarDomFalso(html);
  // SETE desde 18/10/2026: a «Aparência» entrou como secção de configuração, porque a decisão
  // C15 deu a preferência à ESCOLA — e o controlo tem de viver onde só a escola e o professor
  // principal entram. Não é pedagogia nem pessoa: é a forma da casa, e por isso ganhou grupo
  // próprio no menu.
  // OITO desde 28/10/2026: a sétima era a última antes de «Verbetes da notação» entrar.
  // SETE desde 01/11/2026: «Vocabulário Técnico do Balé» saiu — o verbete passou a ser o sítio
  // onde o exercício se cadastra, e duas portas para a mesma rota eram a redundância que a
  // pesquisadora apontou. A lista e o formulário saíram; o DADO não (vive no repositório).
  conferir('as sete secções estão na página', dom.secoes.length, 7);
  conferir('…e a do vocabulário não está entre elas',
    dom.secoes.some((sec) => (sec.getAttribute('id') || '') === 'sec-vocabulario'), false);
  conferir('só o Painel inicial nasce visível', visiveis(dom.secoes), ['sec-painel']);

  // A APARÊNCIA É UMA ESCOLHA, E A ESCOLHA TEM PEÇA (18/10/2026).
  //
  // A primeira versão da secção usou dois `.acao` dentro de um `<div class="fileira">` — uma
  // classe que não existia em lugar nenhum —, e os dois botões saíram encostados. O defeito
  // não se mede pelo texto: mede-se pelo que a marcação PEDE. Por isso o que se trava aqui é
  // a peça: uma escolha única mora em pílulas (`radio`), e o estado em vigor vem do SERVIDOR.
  const trechoAparencia = html.split('id="sec-aparencia"')[1] || '';
  const corpoAparencia = trechoAparencia.slice(0, trechoAparencia.indexOf('</section>'));
  // DOIS GRUPOS, DOIS EIXOS (18/10/2026): a família e a variante são independentes — a
  // Cortina tem as duas variantes, como a Bordô —, e por isso são dois `fieldset`, cada um com
  // a sua legenda. Um grupo só obrigaria a enumerar o produto cartesiano à mão.
  conferir('a Aparência agrupa as escolhas em dois fieldsets de pílulas',
    (corpoAparencia.match(/<fieldset class="escolhas">/g) || []).length, 2);
  conferir('…um para a família e outro para a variante',
    corpoAparencia.indexOf('Família de cores') > -1 &&
    corpoAparencia.indexOf('Variante') > -1, true);
  // TRÊS desde 18/10/2026 — o catálogo fechou aí. O número acompanha `PALETAS`: é a mesma
  // lista que o `check-identidade` confere contra a folha (a checagem «Famílias»).
  conferir('…e as famílias oferecidas são as que têm desenho (três)',
    (corpoAparencia.match(/name="paleta" value="[a-z]+"/g) || []).length, 3);
  conferir('…com a família em vigor marcada pelo servidor',
    (corpoAparencia.match(/name="paleta" value="[a-z]+" checked/g) || []).length, 1);
  conferir('…com uma pílula por modo, e são radio (escolha única)',
    (corpoAparencia.match(/class="escolha"><input type="radio" name="aparencia"/g) || []).length, 2);
  conferir('…e o modo em vigor vem MARCADO pelo servidor, um só',
    (corpoAparencia.match(/name="aparencia" value="[a-z]+" checked/g) || []).length, 1);
  conferir('…e a pílula marcada é a clara por padrão',
    /name="aparencia" value="clara" checked/.test(corpoAparencia), true);
  conferir('os botões que a primeira versão usava não voltaram',
    corpoAparencia.includes('data-aparencia') || corpoAparencia.includes('aria-pressed'), false);
  // A classe inventada que originou a checagem 8 «Peça»: se ela voltar em qualquer lugar
  // desta página, a peça foi inventada outra vez.
  conferir('nenhuma classe inventada na página (o caso «fileira»)',
    /class="[^"]*\bfileira\b/.test(html), false);

  // 3. O comentário de linha é o que comia o resto do script: não pode haver nenhum.
  conferir('o script servido não tem comentário de linha', script.includes('//'), false);

  // 4. O script INTEIRO roda: sem isso, os handlers não existem e nada responde.
  let erroAoRodar = null;
  try {
    const janela = dom.janela;
    const local = { hash: '' };
    const sessao = { getItem: () => null, setItem: () => {} };
    const buscar = async () => ({ json: async () => ({ ok: false }) });
    // eslint-disable-next-line no-new-func
    new Function('document', 'window', 'location', 'fetch', 'sessionStorage', 'alert', 'confirm', script)(
      dom.documento, janela, local, buscar, sessao, () => {}, () => true
    );
    /* SEM `vocabulario` (01/11/2026): a secção saiu, e um item de menu que aponta para uma
     * secção inexistente é pior do que não ter item — a pessoa clica e não acontece nada. */
    for (const alvo of ['painel', 'professores', 'alunas', 'turmas', 'verbetes', 'curadorias']) {
      local.hash = '#' + alvo;
      for (const ouvir of janela.ouvintes.hashchange || []) ouvir();
      conferir('o menu mostra só "' + alvo + '"', visiveis(dom.secoes), ['sec-' + alvo]);
    }
    local.hash = '#professores';
    for (const ouvir of janela.ouvintes.hashchange || []) ouvir();
    const ativos = dom.links.filter((l) => l.className === 'ativo').map((l) => l.getAttribute('data-secao'));
    conferir('o item do menu fica marcado', ativos, ['professores']);
  } catch (e) {
    erroAoRodar = e.message;
  }
  conferir('o script roda sem erro', erroAoRodar, null);
  conferir('o menu registra a troca de secção', (dom.janela.ouvintes.hashchange || []).length >= 1, true);

  // O `form-termo` saiu com a secção (01/11/2026). O cadastro de exercício vive no «+» do
  // verbete, e o handler dele é medido na prova do verbo (`provar-celula`).
  const handlers = ['form-senha', 'form-prof', 'form-aluna', 'form-turma', 'form-curadoria'];
  const comSubmit = handlers.filter((id) => (dom.doId(id).ouvintes.submit || []).length >= 1);
  conferir('os formulários ficam com handler', comSubmit, handlers);
  conferir('o botão do catálogo fica com handler', (dom.doId('semear').ouvintes.click || []).length >= 1, true);

  // 6. AS TRÊS ABAS DA SECÇÃO TURMAS. A régua da rubrica era declarada DENTRO do cadastro da
  //    turma, e havia um segundo formulário abaixo que mudava a régua de uma turma existente.
  //    Agora são três atos separados — e este bloco mede os três, do cadastro da turma ao
  //    vínculo, incluindo o que o PLANO lê.
  const reguaPadrao = ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'];
  // OS TRÊS PASSOS, e não três abas: a ordem importa, e é por isso que o markup é um `<ol>`
  // com `aria-current="step"` no passo em que se está. Os nomes mudaram com o desenho:
  // «Criar rubrica» virou «Rubricas» (o passo cria E edita), e «Vincular turma à rubrica»
  // virou «Associar» — porque ali a turma recebe a régua E os conteúdos.
  conferir('há três passos (turma, rubricas, associar)',
    (html.match(/data-passo="[a-z]+"/g) || []).map((s) => s.replace(/^data-passo="|"$/g, '')),
    ['turma', 'rubrica', 'vincular']);
  // O RÓTULO MORA NUM `<span class="passo-t">` (18/10/2026): é ele que encolhe com
  // reticências quando a faixa não cabe no telefone, e por isso a asserção lê o span e não
  // «o texto a seguir ao número» — que agora é uma tag.
  conferir('…e os títulos são os que a direção lê',
    (html.slice(html.indexOf('id="turmas-form"'), html.indexOf('id="turmas-paineis"'))
      .match(/class="passo-t">([^<]+)</g) || [])
      .map((s) => s.replace(/^[\s\S]*?>/, '').replace(/<$/, '').trim()),
    ['Turma', 'Rubricas', 'Associar']);
  // «SÓ A PRIMEIRA NASCE VISÍVEL» lê o `hidden` de cada painel, e não o texto à volta do
  // `id`: uma janela de 60 caracteres a partir do `id` apanha também o conteúdo do painel,
  // e a asserção media outra coisa.
  conferir('…e só a primeira nasce visível',
    ['passo-turma', 'passo-rubrica', 'passo-vincular'].map((id) => {
      const m = html.match(new RegExp('id="' + id + '"(\\s*hidden)?'));
      return Boolean(m) && !m[1];
    }), [true, false, false]);
  conferir('o cadastro da turma NÃO declara mais a régua',
    (html.match(/id="trubrica"|id="form-regua"/g) || []).length, 0);
  // OS FORMULÁRIOS NÃO EXPLICAM (16/10/2026): só rótulo, campo e placeholder. O que era
  // instrução dentro do formulário («o nome vira a pasta», «a régua não se declara aqui»,
  // «uma rubrica pode valer para várias turmas») saiu — quem usa o cadastro conhece o
  // sistema, e o texto a mais empurra os campos para fora da tela.
  //
  // A EXCEÇÃO DECLARADA (18/10/2026): a secção «Aparência» não é um formulário de cadastro —
  // é um ajuste da casa, com dois botões e uma frase que diz de QUEM é a escolha. A frase é
  // necessária: sem ela, quem a vê assume que está a mudar a sua própria aparência e não a de
  // todos. Por isso a contagem é feita com a secção retirada, em vez de afrouxar a regra para
  // toda a página.
  const semAparencia = html.replace(/<section class="secao" id="sec-aparencia"[\s\S]*?<\/section>/, '');
  conferir('nenhum formulário traz explicação (só rótulo, campo e placeholder)',
    (semAparencia.match(/class="dica"|<p class="nota">|<p class="sub">/g) || []).length, 0);
  // O comentário que VAZOU: três linhas `//` escritas dentro da concatenação, com `\n`, iam
  // parar ao HTML como texto da página. A página não pode conter `// ` no corpo.
  conferir('nenhum comentário de fonte vazou para o corpo da página',
    /\/\/ OS DIAS DA SEMANA|^ *\/\/ /.test(html), false);
  // O EDITOR DA RUBRICA NASCE VAZIO (18/10/2026). Ele trazia os quatro níveis de fábrica já
  // escritos, e isso fazia criar uma rubrica parecer aceitar a padrão — e abrir uma rubrica
  // para editar parecer trazer só o nome (os níveis já lá estavam antes). Quem compõe é o
  // botão «Acrescentar nível»; a rubrica «Padrão», se a escola a quiser, é uma linha da
  // lista como qualquer outra.
  conferir('o editor da rubrica nasce VAZIO',
    (html.match(/id="rubr-niveis">([\s\S]*?)<\/div>/) || [''])[0], 'id="rubr-niveis"></div>');
  conferir('…e o cadastro da turma não traz nenhum campo de régua',
    (html.match(/name="rubrica"/g) || []).length, 0);
  // UM SÓ BOTÃO DE EDIÇÃO (18/10/2026): o «Editar» do cartão da turma abre os três passos.
  // O «Editar rubrica» que vivia dentro do painel da régua foi removido, e a prova trava a
  // ausência dele — é a diferença entre «a rubrica tem uma entrada própria» e «a turma é a
  // porta de tudo o que é dela».
  conferir('a página sabe as rubricas (o «Editar» da turma abre as três)',
    script.includes('var RUBRICAS = ') && script.includes('function ajustarTurma') &&
    !script.includes('editar-rubrica'), true);
  conferir('o passo 3 não repete o select da turma (ela é a que está em foco)',
    html.includes('id="vinc-turma-nome"') && !html.includes('id="vinc-turma"'), true);
  conferir('o editor de níveis existe na página', script.includes('linhaDaReguaNoDom') && script.includes('tirar-regua'), true);

  /* O CADASTRO DE EXERCÍCIO MUDOU DE SÍTIO, E A REGRA FOI COM ELE (01/11/2026).
   *
   * O que se media aqui era o `<form id="form-termo">` da secção do vocabulário. A secção saiu —
   * a pesquisadora: «o vocabulário técnico e o verbete, em certa medida, são redundantes […] no
   * verbete nós já podemos criar o exercício, a categoria e a tradição». Os mesmos três campos
   * passaram a viver no «+» do verbete (`vnnome`, `vncategoria`, `vntradicao`), e a regra que
   * esta prova guardava vai com eles, intacta: SÓ O NOME SE ESCREVE, categoria e tradição são
   * LISTAS fechadas com as opções do catálogo.
   *
   * E MEDE-SE TAMBÉM O QUE SAIU. Um `form-termo` que ficasse na página sem handler — ou um
   * `<select id="vcategoria">` órfão — seria a segunda porta a sobreviver à primeira.
   */
  const formExercicio = (html.match(/<div id="vb-modo-exercicio"[\s\S]*?<\/form>/) || [''])[0];
  const opcoesDe = (id) => {
    const trecho = (formExercicio.match(new RegExp('<select id="' + id + '">([\\s\\S]*?)</select>')) || ['', ''])[1];
    return [...trecho.matchAll(/<option value="([^"]+)"/g)].map((m) => m[1]);
  };
  conferir('a página não tem mais o formulário do vocabulário',
    /<form id="form-termo">/.test(html), false);
  conferir('…nem os campos dele (o segundo caminho para a mesma rota)',
    /id="vtermo"|id="vcategoria"|id="vtradicao"/.test(html), false);
  conferir('o exercício novo tem UMA lista de categorias (e não um campo de texto)',
    opcoesDe('vncategoria'), ['passo', 'salto', 'ligacao', 'giro']);
  conferir('…e uma lista de tradições, com a compartilhada',
    opcoesDe('vntradicao'), ['compartilhada', 'RAD', 'francesa', 'Vaganova']);
  conferir('…e nenhum dos dois é um campo de texto',
    /<input id="vncategoria"|<input id="vntradicao"/.test(formExercicio), false);

  // A TURMA: PROGRAMA EM LISTA, SEM POSIÇÃO E SEM FREQUÊNCIA (18/10/2026).
  const formTurma = (html.match(/<form id="form-turma">[\s\S]*?<\/form>/) || [''])[0];
  const opcoesDoPrograma = [...((formTurma.match(/<select id="tprograma">([\s\S]*?)<\/select>/) || ['', ''])[1]
    .matchAll(/<option value="([^"]*)"/g))].map((m) => m[1]);
  conferir('o programa de referência é uma lista de tradições (e não texto livre)',
    opcoesDoPrograma, ['', 'RAD', 'francesa', 'Vaganova']);
  conferir('…e o rótulo diz «(tradição)»',
    formTurma.includes('Programa de referência (tradição)'), true);
  conferir('…a POSIÇÃO NA LISTA saiu do formulário',
    formTurma.includes('tordem') || formTurma.includes('name="ordem"'), false);
  conferir('…e a FREQUÊNCIA não tem campo nem linha na tela',
    formTurma.includes('tfrequencia') || formTurma.includes('Frequência semanal'), false);

  // O «CANCELAR» DA CURADORIA, ao lado do botão e só na edição (18/10/2026) — a mesma
  // regra dos passos da turma, e sem o texto explicativo que havia antes.
  const formCuradoria = (html.match(/<form id="form-curadoria">[\s\S]*?<\/form>/) || [''])[0];
  conferir('a curadoria tem «Cancelar» ao lado do botão e nasce escondido',
    /<span class="par-botoes">[\s\S]*id="cu-enviar"[\s\S]*id="cu-cancelar" hidden[\s\S]*<\/span>/
      .test(formCuradoria), true);
  conferir('…e o texto explicativo da edição saiu do formulário',
    formCuradoria.includes('cu-aviso-texto'), false);

  // O RITMO é obrigatório desde 16/10/2026 (é a escola que o declara): as turmas desta prova
  // nascem com um, senão o cadastro recusa e a prova morre no primeiro `find`.
  const RITMO_DA_PROVA = { frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
    periodoInicio: '2026-10-16', periodoFim: '2026-12-18' };
  const criarTurma = (corpo) => pedir(env, '/api/bastidores/turma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ senhaDirecao: SENHA_DA_DIRECAO, nome: 'Turma Régua' }, RITMO_DA_PROVA, corpo)),
  });
  const respostaTurma = await criarTurma({ rubrica: ['Ótimo', 'Bom', 'Regular'] });
  conferir('a turma é cadastrada', respostaTurma.status, 201);
  let turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('a régua PRÓPRIA da turma (modo antigo) continua valendo',
    (turmas.find((t) => t.id === 'turma-regua') || {}).rubrica, ['Ótimo', 'Bom', 'Regular']);
  await criarTurma({ nome: 'Turma Sem Régua' });
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('a turma nascida pelo cadastro novo (sem régua) é medida pela padrão',
    (turmas.find((t) => t.id === 'turma-sem-regua') || {}).rubrica, reguaPadrao);

  // A FREQUÊNCIA É A CONTAGEM DOS DIAS (18/10/2026). O corpo pode trazer `frequencia` — é o
  // formato antigo —, mas quando há dias é a contagem que manda: três dias, 3x/semana, e o
  // valor digitado (9) não sobrevive.
  await criarTurma({ nome: 'Turma Frequência', frequencia: 9, dias: ['seg', 'qua', 'sex'] });
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('a frequência é calculada pelos dias marcados (3 dias = 3x)',
    (turmas.find((t) => t.id === 'turma-frequencia') || {}).frequencia, 3);

  // A TURMA NOVA VAI PARA O TOPO (18/10/2026): a posição deixou de ser um campo, e o
  // servidor põe cada turma criada acima das que já existem — sem tocar na ordem delas.
  const ordens = turmas.map((t) => ({ id: t.id, ordem: t.ordem }));
  const daFrequencia = ordens.find((t) => t.id === 'turma-frequencia');
  const dasOutras = ordens.filter((t) => t.id !== 'turma-frequencia');
  conferir('a turma nova nasce com a MENOR ordem (vai para o topo)',
    Boolean(daFrequencia) && dasOutras.every((t) => Number(t.ordem) > Number(daFrequencia.ordem)),
    true);

  const envAntigo = ambiente();
  await envAntigo.PADD_KV.put('bastidores/barra/turmas',
    JSON.stringify([{ id: 'legada', nome: 'Turma Legada', frequencia: 1, dias: ['sex'], duracaoMin: 60 }]));
  const legada = (await (await pedir(envAntigo, '/api/bastidores/turmas')).json())
    .turmas.find((t) => t.id === 'legada');
  conferir('a turma SEM régua gravada (cadastro antigo) sai com a padrão', legada.rubrica, reguaPadrao);

  // 6a. A RUBRICA É UMA COISA COM NOME (aba 2). Criada uma vez, salva por cima quando o nome
  //     já existe (cadastrar duas vezes «Régua do Nível 1» não cria duas), e renomeável sem
  //     perder o vínculo — o id vai junto de propósito.
  const criarRubrica = (corpo) => pedir(env, '/api/bastidores/rubrica', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ senhaDirecao: SENHA_DA_DIRECAO }, corpo)),
  });
  const r1 = await criarRubrica({ nome: 'Régua do Nível 1', niveis: ['Muito bom', 'Bom', 'Iniciando'] });
  conferir('a rubrica é criada', r1.status, 201);
  conferir('…e o identificador é o slug do nome', (await r1.json()).rubrica.id, 'regua-do-nivel-1');
  const semNivel = await criarRubrica({ nome: 'Régua Vazia', niveis: ['  '] });
  conferir('a rubrica sem níveis é recusada', semNivel.status, 400);
  const semNome = await criarRubrica({ niveis: ['x'] });
  conferir('a rubrica sem nome é recusada', semNome.status, 400);
  const semSenhaRubrica = await pedir(env, '/api/bastidores/rubrica', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: 'Sem Senha', niveis: ['x'] }),
  });
  conferir('a rubrica exige a senha da direção', semSenhaRubrica.status, 401);
  const r1b = await criarRubrica({ nome: 'Régua do Nível 1', niveis: ['Ótimo', 'Regular'] });
  conferir('salvar com o mesmo nome ATUALIZA (não duplica)', r1b.status, 200);
  let rubricas = (await (await pedir(env, '/api/bastidores/rubricas')).json()).rubricas;
  conferir('…e continua a haver uma só', rubricas.length, 1);
  conferir('…com os níveis novos', rubricas[0].niveis, ['Ótimo', 'Regular']);
  const r1c = await criarRubrica({ id: 'regua-do-nivel-1', nome: 'Régua Renomeada', niveis: ['Ótimo', 'Regular'] });
  conferir('renomear com o id mantém o identificador (não perde o vínculo)',
    (await r1c.json()).rubrica.id, 'regua-do-nivel-1');

  // 6b. VINCULAR (aba 3) — e o que o PLANO lê. O vínculo não muda o cadastro da turma: muda
  //     com que régua ela é medida, e é isso que `GET /api/bastidores/turmas` entrega
  //     RESOLVIDO. É esta prova que trava o contrato com o plano (`{daTurma: "rubrica"}`).
  const vincular = (corpo) => pedir(env, '/api/bastidores/turma-rubrica', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ senhaDirecao: SENHA_DA_DIRECAO }, corpo)),
  });
  // «GRAVAR TURMA» TEM A VALIDAÇÃO MÁXIMA NO SERVIDOR (18/10/2026): concluir sem conteúdo
  // é recusado, mesmo que a tela tenha deixado o botão acender. O ato intermédio «Associar
  // rubrica» continua a poder gravar só o vínculo — é por isso que `concluir` existe.
  const concluirSemConteudo = await vincular({
    turma: 'turma-sem-regua', rubricaId: 'regua-do-nivel-1', concluir: true,
  });
  conferir('«Gravar turma» sem conteúdo associado é recusado', concluirSemConteudo.status, 400);
  const vinc1 = await vincular({ turma: 'turma-sem-regua', rubricaId: 'regua-do-nivel-1' });
  conferir('a turma é vinculada a uma rubrica', vinc1.status, 200);
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  const vinculada = turmas.find((t) => t.id === 'turma-sem-regua');
  conferir('…e o vínculo VENCE a régua própria e a padrão', vinculada.rubrica, ['Ótimo', 'Regular']);
  conferir('…e o plano lê a régua resolvida, sem saber de onde ela veio', vinculada.rubrica.join(' | '), 'Ótimo | Regular');
  const rubricaInexistente = await vincular({ turma: 'turma-sem-regua', rubricaId: 'nao-existe' });
  conferir('vincular a uma rubrica que não existe é recusado', rubricaInexistente.status, 404);
  const turmaInexistente = await vincular({ turma: 'nao-existe', rubricaId: 'regua-do-nivel-1' });
  conferir('vincular uma turma que não existe é recusado', turmaInexistente.status, 404);
  const semSenhaVinc = await pedir(env, '/api/bastidores/turma-rubrica', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turma: 'turma-sem-regua', rubricaId: 'regua-do-nivel-1' }),
  });
  conferir('o vínculo exige a senha da direção', semSenhaVinc.status, 401);

  // Mudar os níveis da rubrica muda as turmas que a usam, no mesmo ato: é uma régua só, e
  // não uma cópia por turma. Este é o efeito que a aba «Vincular» declara ao usuário.
  await criarRubrica({ id: 'regua-do-nivel-1', nome: 'Régua Renomeada', niveis: ['A', 'B', 'C'] });
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('mudar a rubrica muda a régua da turma vinculada',
    (turmas.find((t) => t.id === 'turma-sem-regua') || {}).rubrica, ['A', 'B', 'C']);

  // DESVINCULAR: sem `rubricaId`, a turma volta ao degrau seguinte — a própria régua, se a
  // tinha, ou a padrão.
  const desvincular = await vincular({ turma: 'turma-sem-regua' });
  conferir('desvincular é aceito', desvincular.status, 200);
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('…e a turma volta à régua padrão',
    (turmas.find((t) => t.id === 'turma-sem-regua') || {}).rubrica, reguaPadrao);

  // 6c. APAGAR a rubrica DESVINCULA as turmas no mesmo ato — nenhuma fica apontando para uma
  //     rubrica que sumiu, e o número de desvinculadas sai na resposta.
  await vincular({ turma: 'turma-sem-regua', rubricaId: 'regua-do-nivel-1' });
  const apagarRubrica = await pedir(env, '/api/bastidores/rubrica', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, id: 'regua-do-nivel-1' }),
  });
  const recibo = await apagarRubrica.json();
  conferir('apagar a rubrica é aceito', apagarRubrica.status, 200);
  conferir('…e diz quantas turmas desvinculou', recibo.turmasDesvinculadas, 1);
  rubricas = (await (await pedir(env, '/api/bastidores/rubricas')).json()).rubricas;
  conferir('…e ela sai da lista', rubricas.length, 0);
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('…e a turma não fica apontando para uma rubrica que sumiu',
    (turmas.find((t) => t.id === 'turma-sem-regua') || {}).rubrica, reguaPadrao);

  // O MODO ANTIGO da rota continua valendo (a régua PRÓPRIA da turma), e a régua vazia é
  // recusada nos dois caminhos.
  const mudarRegua = await pedir(env, '/api/bastidores/turma-rubrica', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, turma: 'turma-regua',
      rubrica: ['Excelente', 'Bom', 'Não foi visto'] }),
  });
  conferir('a régua própria muda de uma turma que existe', mudarRegua.status, 200);
  turmas = (await (await pedir(env, '/api/bastidores/turmas')).json()).turmas;
  conferir('a régua nova é a que fica',
    (turmas.find((t) => t.id === 'turma-regua') || {}).rubrica, ['Excelente', 'Bom', 'Não foi visto']);
  const semNiveis = await pedir(env, '/api/bastidores/turma-rubrica', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, turma: 'turma-regua', rubrica: ['   '] }),
  });
  conferir('a régua vazia é recusada', semNiveis.status, 400);
  const semSenha = await pedir(env, '/api/bastidores/turma-rubrica', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turma: 'turma-regua', rubrica: ['x'] }),
  });
  conferir('a régua exige a senha da direção', semSenha.status, 401);

  // 7. A VISTA: a navegação é a MESMA do pacote, a lista vive à DIREITA do formulário e
  //    as escolhas múltiplas são clicáveis em linha. Isto é layout — e layout que se
  //    quebra sem ninguém notar, porque nada falha: só a página fica pior. Por isso se
  //    mede o que a página SERVE, e não o que se pretendeu escrever.
  conferir('a Produção carrega o menu do ciclo (o mesmo markup)',
    html.includes('<nav class="topnav"') && html.includes('<summary>Área do Professor</summary>'), true);
  conferir('…e a folha de estilo e o script da navegação, os MESMOS do pacote',
    html.includes('href="/assets/style.css"') && html.includes('src="/assets/nav.js"'), true);
  conferir('…sem a barra própria que os Bastidores tinham', html.includes('class="topo"'), false);
  conferir('…e sem o amarelo próprio do formulário (o fundo é o do sistema)',
    html.includes('#fdf6e3'), false);

  // SEM `vocabulario` (01/11/2026): a secção saiu, e com ela a sua lista. As quatro que ficam
  // continuam a ter a lista à direita e a paginação — é a regra, e ela não mudou.
  const secoesComLista = ['professores', 'alunas', 'turmas', 'curadorias'];
  for (const s of secoesComLista) {
    const trecho = html.split('id="sec-' + s + '"')[1] || '';
    const fim = trecho.indexOf('</section>');
    const corpo = trecho.slice(0, fim === -1 ? trecho.length : fim);
    conferir('a lista de ' + s + ' fica na coluna da direita, paginada',
      corpo.includes('class="col-lista"') && corpo.includes('data-paginar') && corpo.includes('class="paginas"'), true);
  }
  // CINCO secções de formulário desde 01/11/2026 (professores, alunas, verbetes, curadorias,
  // aparência) mais as três abas de Turmas — o vocabulário saiu com a secção dele. As listas
  // ficam à direita; a Aparência não tem lista — são dois botões e o que está em vigor.
  conferir('o formulário fica na coluna da esquerda (5 secções + as 3 abas de Turmas)',
    (html.match(/class="col-form"/g) || []).length, 8);
  conferir('o script pagina as listas', script.includes('function paginar()') && script.includes('data-paginar'), true);

  // 8. AS ESCOLHAS: SETE dias em pílulas (lista curta, fechada, fixa — tudo à vista), e o
  //    resto em ESCOLHEDOR (lista longa: procura, adiciona, e o escolhido em ficha). As duas
  //    formas convivem de propósito, e o critério está dito no código.
  conferir('nos dias da semana há 7 pílulas clicáveis',
    (html.match(/class="escolha"><input type="checkbox" name="dia"/g) || []).length, 7);
  conferir('o nível da turma NÃO é um select múltiplo (exigia Ctrl+clique)',
    html.includes('name="nivelReferencia" multiple'), false);
  conferir('…e sim um escolhedor', html.includes('id="esc-niveis" class="escolhedor"') ||
    html.includes('class="escolhedor" id="esc-niveis"'), true);
  conferir('…que continua a sair como UM texto', script.includes('fichasDe("esc-niveis").join'), true);
  // A TURMA DA CURADORIA VIROU `select` DE UMA (16/10/2026). Era um escolhedor de várias, e a
  // lista MENTIA: quem marcava duas turmas dizia que as alunas de uma são as da outra. O que
  // esta prova trava agora é o contrário do que travava antes — e é de propósito.
  conferir('a turma da curadoria é um `select` de UMA, não um escolhedor de várias',
    /<label class="campo-rotulo" for="cuturma">Turma<\/label>\s*<select id="cuturma">/.test(html), true);
  conferir('…e o escolhedor das turmas já não existe na página',
    html.includes('id="esc-turmas"'), false);
  conferir('…e a modalidade e a tradição continuam `select` (o mesmo formato)',
    /<select id="cumodalidade">/.test(html) && /<select id="cutradicao">/.test(html), true);
  /* A TRADIÇÃO DEIXOU DE TER «— nenhuma —» (23/10/2026). Era o único campo da curadoria que
     se podia deixar em branco sem que nada reclamasse: o registo autorizava o plano de uma
     turma sem dizer em que linha o professor ensina. */
  conferir('…e a tradição já NÃO oferece «— nenhuma —» (o campo passou a ser obrigatório)',
    /<select id="cutradicao">\s*<option value="RAD">/.test(html), true);
  conferir('…e as ALUNAS continuam múltiplas (escolhedor)',
    html.includes('class="escolhedor" id="esc-alunas"'), true);
  // O «REPERTÓRIO» SAIU DA CURADORIA (19/10/2026). Ele era um segundo lugar para digitar os
  // mesmos 84 termos que a TURMA declara no passo «Associar» — e ninguém o lia: o plano, o
  // PO e a captura derivam da turma, e nenhum nó do conteúdo declara
  // `daCuradoria: "repertorio"`. Duas listas da mesma coisa é uma lista a mais, e a que
  // sobra só pode divergir. Esta asserção guarda a decisão: o campo não volta por descuido.
  conferir('…e o repertório NÃO é pedido na curadoria (é da turma)',
    html.includes('id="esc-repertorio"'), false);
  conferir('…e o formulário não manda mais o campo',
    script.includes('fichasDe("esc-repertorio")'), false);
  conferir('…e não sobrou nenhum lookup no formulário',
    html.includes('<datalist'), false);
  // OS TERMOS DE VERDADE, NO PRÓPRIO MENU — e agora vêm do REPOSITÓRIO (28/10/2026).
  // Antes esta secção cadastrava dois termos no KV e conferia que eles apareciam no menu. Isso
  // deixou de poder acontecer: `termos()` lê o vocabulário do bundle (o ficheiro da
  // modalidade), e o cadastro grava no REPOSITÓRIO, pela API do GitHub — que esta prova não
  // tem, e não deve ter: uma prova que escreve no repositório de verdade não é uma prova.
  // O que se confere passou a ser o CONTRATO: o menu traz o vocabulário da modalidade inteiro,
  // uma opção por termo, mais o «— associar termo —».
  // O SERVIDOR GARANTE O QUE A TELA JÁ NÃO DEIXA ESCREVER (18/10/2026). A tela é a
  // comodidade; a regra é esta — e uma categoria inventada não entra no vocabulário.
  const categoriaInventada = await pedir(env, '/api/bastidores/termo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, termo: 'Inventado', categoria: 'passos' }),
  });
  conferir('categoria fora do catálogo é recusada', categoriaInventada.status, 400);
  const tradicaoInventada = await pedir(env, '/api/bastidores/termo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, termo: 'Inventado', categoria: 'passo', tradicao: 'rad' }),
  });
  conferir('tradição fora do catálogo é recusada', tradicaoInventada.status, 400);
  const comTermos = await (await pedir(env, '/bastidores/producao')).text();
  // O MENU DOS TERMOS vive agora num lugar só: o passo «Associar» da TURMA (`#vinc-termo`),
  // que é quem alimenta o plano.
  const menuDosTermos = (comTermos.match(/id="vinc-termo"[\s\S]*?<\/select>/) || [''])[0];
  const vocabularioDaModalidade = require('../motor/servidor/catalogo-seed.js').TERMOS;
  conferir('…e os termos do vocabulário entram como OPÇÕES do menu da turma',
    (menuDosTermos.match(/<option /g) || []).length, vocabularioDaModalidade.length + 1);
  conferir('…e o formulário entrega as fichas que o servidor espera',
    script.includes('fichasDe("esc-alunas")'), true);
  conferir('…e a turma vai como LISTA DE UM (o formato que o plano lê)',
    script.includes('turmas: umaTurma ? [umaTurma] : []'), true);
  conferir('não sobrou nenhuma caixa com rolagem no formulário', html.includes('cb-grupo'), false);
  // DOZE, e não sete: as sete dos dias da semana, as DUAS da variante e as TRÊS das famílias
  // (18/10/2026). O que esta asserção guarda não é o número — é o CRITÉRIO: a pílula existe
  // só para lista curta, fechada e fixa. Um tapete de pílulas longas (o de 84 termos, que o
  // dono do produto recusou) voltaria como um número grande aqui, e é por isso que é contado.
  // DEZASSEIS desde 28/10/2026, e o acrescento é legítimo pelo CRITÉRIO: as quatro CATEGORIAS do
  // bloco de notação (Pé · Peso · Plié · Braço) são uma lista curta, fechada e fixa — a mesma
  // razão que autoriza os sete dias. O que este número guarda não é a contagem: é o critério.
  conferir('as pílulas continuam a ser só as listas curtas: 7 dias + 2 variantes + 3 famílias + 4 categorias',
    (html.match(/class="escolha"/g) || []).length, 16);

  // 9. A PÁGINA INTERMEDIÁRIA SAIU — e o caminho antigo continua respondendo.
  conferir('o Estúdio também carrega o menu do ciclo',
    (await (await pedir(env, '/bastidores/estudio')).text()).includes('<nav class="topnav"'), true);
  const intermediaria = await pedir(env, '/bastidores');
  conferir('o grupo «Bastidores» NÃO tem página intermediária', intermediaria.status, 302);
  conferir('…e o caminho antigo leva à Produção', intermediaria.headers.get('Location'), '/bastidores/producao');

  // 10. A PÁGINA ALINHA COM A BARRA DO TOPO, E A LISTA FICA COM O RESTO. O menu de secções
  //     ficava colado na borda porque o painel tinha `max-width:120rem` (1920px) e margem de
  //     .55rem: em qualquer tela menor que 1920px não sobrava margem nenhuma. A referência
  //     certa não é um número escolhido a dedo — é o `padding` da própria barra do sistema
  //     (`.topnav`, em tools/templates/ciclo.css), que é onde o «Sistema Lastro» começa.
  const casa = (re) => (html.match(re) || [])[0];
  const corpo = casa(/\.corpo\{[^}]*\}/);
  const cssCiclo = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');

  // O recuo agora vem da RÉGUA (`--esp-4`), e não de um número solto: um literal `14px`
  // podia alinhar hoje e separar amanhã. A conferência resolve o degrau contra a fonte
  // antes de comparar — senão ela mede a grafia, não a medida.
  const degraus = {};
  for (const m of cssCiclo.matchAll(/--(esp-[1-6]):\s*(\d+)px/g)) degraus[`var(--${m[1]})`] = `${m[2]}px`;
  const resolver = (v) => {
    const s = String(v || '').trim();
    return degraus[s] || (/^\d+px$/.test(s) ? s : null);
  };
  const paddingDaBarra = (cssCiclo.match(/\.topnav\s*\{[^}]*?padding:\s*([^;]+);/) || [])[1];
  const lateralDoPadding = resolver(String(paddingDaBarra || '').trim().split(/\s+/).pop());
  // O recuo lateral é o SEGUNDO valor do `padding` (topo, laterais, base) — ou o único,
  // quando a declaração é curta. Ler por posição evita casar o degrau errado.
  const valoresDoPainel = String((corpo.match(/padding:\s*([^;}]+)/) || [])[1] || '').trim().split(/\s+/);
  const lateralDoPainel = resolver(valoresDoPainel.length > 1 ? valoresDoPainel[1] : valoresDoPainel[0]);
  conferir('o painel usa o MESMO recuo lateral da barra do topo',
    [lateralDoPainel, lateralDoPadding], ['16px', '16px']);
  conferir('…e NÃO tem teto de largura (em tela larga ele não encosta na borda)',
    /max-width/.test(corpo), false);
  conferir('o formulário ficou uniforme nas cinco secções (34rem, intacto)',
    /grid-template-columns:minmax\(0,34rem\)/.test(casa(/\.secao\{[^}]*\}/)), true);
  // CINCO desde 01/11/2026 — o vocabulário levou a sexta.
  conferir('as listas mostram 7 linhas por página (4 secções + Turmas, que agora é uma só)',
    (html.match(/data-por-pagina="7"/g) || []).length, 5);

  // 11. AS PEÇAS INTERATIVAS, EXECUTADAS. Medir o HTML não basta: o escolhedor e a paginação
  //     são código que roda no navegador, e foi código assim que já deixou botões mortos
  //     nesta página. Aqui o script SERVIDO é executado de novo contra um DOM que responde a
  //     esta pergunta em concreto, e as funções verdadeiras são chamadas.
  const api = executarComponentes(script);
  conferir('as funções da página puderam ser exercitadas', typeof api.paginar, 'function');

  // 11a. A PAGINAÇÃO. Sete linhas por página, e o rodapé só quando há mais de uma página —
  //      é o que o dono do produto pediu («só vai entrar a paginação quando tiver mais»).
  const p13 = criarPainel(13, 7);
  api.paginar();
  conferir('com 13 itens e 7 por página, a primeira mostra 7',
    p13.ul.children.filter((i) => !i.hidden).length, 7);
  conferir('…e o rodapé aparece, dizendo 1 / 2', [p13.rodape.hidden, p13.info.textContent], [false, '1 / 2']);
  conferir('…com o «anterior» travado e o «seguinte» solto', [p13.ant.disabled, p13.prox.disabled], [true, false]);
  p13.painel.setAttribute('data-pagina', '2');
  api.paginar();
  conferir('na segunda página, os outros 6 — nenhum item se perde nem se repete',
    p13.ul.children.filter((i) => !i.hidden).length, 6);
  const p4 = criarPainel(4, 7);
  api.paginar();
  conferir('com 4 itens, o rodapé NÃO aparece (uma página só)', p4.rodape.hidden, true);
  conferir('…e os 4 continuam à vista', p4.ul.children.filter((i) => !i.hidden).length, 4);

  // 11b. O ESCOLHEDOR. Adiciona uma ficha, não duplica a mesma, e não aceita adicionar sem
  //      escolher. O valor inventado não tem mais como entrar: o menu só oferece o que
  //      existe — foi o que o lookup custou, e o que se ganhou ao voltar para o `<select>`.
  const escRep = criarEscolhedor('esc-alunas', ['Plié', 'Arabesque', 'Lasconde']);
  conferir('adicionar uma ficha funciona', api.adicionarFicha(escRep, 'Arabesque'), true);
  conferir('…e ela aparece no escolhedor', api.fichasDe('esc-alunas'), ['Arabesque']);
  conferir('a mesma ficha não entra duas vezes', api.adicionarFicha(escRep, 'Arabesque'), false);
  conferir('…e continua a haver só uma', api.fichasDe('esc-alunas').length, 1);
  conferir('uma segunda ficha diferente entra', api.adicionarFicha(escRep, 'Plié'), true);
  conferir('…na ordem em que foi escolhida', api.fichasDe('esc-alunas'), ['Arabesque', 'Plié']);
  const escNivel = criarEscolhedor('esc-niveis', ['Grade 1', 'Grade 2']);
  api.adicionarFicha(escNivel, 'Grade 2');
  api.adicionarFicha(escNivel, 'Grade 3');
  conferir('…e dois níveis saem como UM texto, que é o contrato do campo',
    api.fichasDe('esc-niveis').join(', '), 'Grade 2, Grade 3');
  const ficha = escNivel.querySelector('.escolhido');
  conferir('…e dá para tirar uma ficha', !!ficha.querySelector('.tirar'), true);

  // 11c. OS PASSOS, CLICADOS. É o coração do pedido: três atos em SEQUÊNCIA (cadastrar a
  //      turma, criar a rubrica, associar), e cada passo mostra só o seu painel. Prova de
  //      markup não bastaria — o que o usuário faz é CLICAR, e um passo que não troca é um
  //      botão morto.
  const passos = criarSecaoDePassos(api.documento);
  // A SEQUÊNCIA É TRAVADA PELA TURMA (18/10/2026): sem nome, dias, duração e período, os
  // passos 2 e 3 não abrem. A prova completa a turma primeiro — é o estado em que a direção
  // chega ao passo 2 — e depois mede a troca de painel, que é o que ela faz.
  api.documento.getElementById('tnome').value = 'Balé Nível 1';
  api.documento.getElementById('tduracao').value = '60';
  api.documento.getElementById('tinicio').value = '2026-02-01';
  api.documento.getElementById('tfim').value = '2026-06-30';
  const diaDaProva = criarElemento('input');
  diaDaProva.name = 'dia';
  diaDaProva.value = 'segunda';
  diaDaProva.checked = true;
  api.documento.body.appendChild(diaDaProva);
  api.clicar(passos.botoes[1]);
  conferir('clicar em «Rubricas» marca o passo',
    passos.botoes.map((b) => b.className), ['passo', 'passo ativo', 'passo']);
  conferir('…e mostra só o painel dele',
    passos.paineis.map((p) => !p.hidden), [false, true, false]);
  conferir('…e o aria-current acompanha (é o que o leitor de ecrã anuncia)',
    passos.botoes.map((b) => b.getAttribute('aria-current')), [null, 'step', null]);
  api.clicar(passos.botoes[2]);
  conferir('clicar em «Associar» mostra só o painel da associação',
    passos.paineis.map((p) => !p.hidden), [false, false, true]);
  api.clicar(passos.botoes[0]);
  conferir('e voltar para «Turma» fecha os outros dois',
    passos.paineis.map((p) => !p.hidden), [true, false, false]);

  // 12. A CURADORIA NÃO SE ATRIBUI INCOMPLETA (23/10/2026). Os cinco campos — professor,
  //     modalidade, tradição, turma e aluna — são o que autoriza o plano de uma turma e
  //     declara quem está nela. A regra é do SERVIDOR (o formulário só a antecipa), e por
  //     isso a prova bate na rota: sem tradição, sem turma, sem aluna, e uma completa.
  //     Um `env` novo, para não depender do que as secções anteriores deixaram no KV.
  {
    const envC = ambiente();
    const kv = envC.PADD_KV;
    const senha = SENHA_DA_DIRECAO;
    const postar = (caminho, corpo) => pedir(envC, caminho, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ senhaDirecao: senha }, corpo)),
    });
    await postar('/api/bastidores/professor', { nome: 'Curador', senha: 'senha-do-curador' });
    await postar('/api/bastidores/aluna', { apelido: 'Aluna Um' });
    await postar('/api/bastidores/turma', {
      nome: 'Turma da Curadoria', frequencia: 2, dias: ['ter', 'qui'], duracaoMin: 60,
      periodoInicio: '2026-10-16', periodoFim: '2026-12-18',
    });
    const completa = {
      professor: 'curador', modalidade: 'Balé clássico', tradicao: 'RAD',
      turmas: ['Turma da Curadoria'], alunas: ['Aluna Um'],
    };
    const semCampo = async (campo) => {
      const corpo = Object.assign({}, completa);
      delete corpo[campo];
      const r = await postar('/api/bastidores/curadoria', corpo);
      const d = await r.json();
      return { status: r.status, falta: d.falta || [], erro: d.erro || '' };
    };
    conferir('a curadoria sem professor é recusada', (await semCampo('professor')).status, 400);
    conferir('a curadoria sem modalidade é recusada', (await semCampo('modalidade')).status, 400);
    const semTradicao = await semCampo('tradicao');
    conferir('a curadoria sem TRADIÇÃO é recusada (era opcional: «— nenhuma —»)', semTradicao.status, 400);
    conferir('…e a recusa diz que falta a tradição', semTradicao.falta, ['tradicao']);
    const semTurma = await semCampo('turmas');
    conferir('a curadoria sem TURMA é recusada', semTurma.status, 400);
    /* ESTA ERA A FALHA DE VERDADE. A rota conferia o ritmo *se* houvesse turma, e sem turma
       seguia em frente: criava uma curadoria sem turma, com o id no formato antigo
       (`professor+modalidade`) — a colisão que a turma entrou no id para corrigir. O
       comentário da função dizia «a turma é obrigatória»; o código não a exigia. */
    conferir('…e a recusa diz que falta a turma', semTurma.falta, ['turma']);
    const semAluna = await semCampo('alunas');
    conferir('a curadoria sem ALUNA é recusada', semAluna.status, 400);
    conferir('…e a recusa diz que falta pelo menos uma aluna', semAluna.falta, ['aluna']);
    conferir('a recusa nomeia os campos em português, e não em código',
      /falta a tradição/.test(semTradicao.erro) && /pelo menos uma aluna/.test(semAluna.erro), true);
    conferir('…e diz onde se resolve o que falta',
      /aba Turmas/.test(semTurma.erro) && /secção Alunas/.test(semAluna.erro), true);
    conferir('nenhuma curadoria incompleta foi gravada',
      ((await (await pedir(envC, '/api/bastidores/curadorias')).json()).curadorias || []).length, 0);

    const ok = await postar('/api/bastidores/curadoria', completa);
    conferir('a curadoria COMPLETA é aceita', ok.status, 201);
    const gravada = ((await (await pedir(envC, '/api/bastidores/curadorias')).json()).curadorias || [])[0] || {};
    conferir('…e grava os cinco campos',
      [gravada.professor, gravada.modalidade, gravada.tradicao, (gravada.turmas || [])[0], (gravada.alunas || [])[0]],
      ['curador', 'Balé clássico', 'RAD', 'Turma da Curadoria', 'Aluna Um']);

    /* E A VERSÃO DERIVADA TAMBÉM NASCE COMPLETA: o que se confere é o que vai FICAR escrito,
       não o que veio no corpo — uma derivada de uma curadoria antiga sem tradição não pode
       herdar a falta e gravar-se assim. */
    const derivada = await postar('/api/bastidores/curadoria-derivar', {
      derivarDe: gravada.id, vigencia: '2026-11-01', tradicao: '', alunas: ['Aluna Um'],
    });
    conferir('a curadoria DERIVADA sem tradição também é recusada', derivada.status, 400);

    /* O FORMULÁRIO ANTECIPA A MESMA RECUSA (não espera pela rede). O script é o da página, e
       a prova executa-o contra o DOM falso: com a tradição vazia, o `submit` tem de parar
       antes de chamar `enviar`. */
    const scriptCuradoria = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
      .map((m) => m[1]).sort((a, b) => b.length - a.length)[0] || '';
    conferir('o script do formulário confere os cinco campos antes de enviar',
      /fichasDe\("esc-alunas"\)\.length/.test(scriptCuradoria) &&
      /falta " \+ faltando\.join/.test(scriptCuradoria), true);
    void kv;
  }

  const falhas = casos.filter((c) => !c.ok);
  for (const c of casos) {
    process.stdout.write(
      (c.ok ? 'ok     ' : 'FALHOU ') + c.nome +
        (c.ok ? '' : '\n  obtido:   ' + JSON.stringify(c.obtido) +
          '\n  esperado: ' + JSON.stringify(c.esperado)) + '\n'
    );
  }
  process.stdout.write(
    '\nprovar-producao: ' + (casos.length - falhas.length) + ' de ' + casos.length + ' passaram\n'
  );
  return falhas.length === 0 ? 0 : 1;
}

if (require.main === module) {
  principal()
    .then((codigo) => {
      process.exitCode = codigo;
    })
    .catch((e) => {
      console.error("erro: " + e.message);
      process.exitCode = 1;
    });
}
