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
  const m = String(sel).match(/^([a-z]*)(?:\.([\w-]+))?$/i);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1]) return false;
  if (m[2] && String(el.className).split(/\s+/).indexOf(m[2]) === -1) return false;
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

/** Um seletor de duas partes («.paginacao button») vale para o ancestral que CONTÉM a
 *  segunda — que é o que `closest` significa quando se lhe passa um descendente. */
function casaComposto(el, sel) {
  const partes = String(sel).trim().split(/\s+/);
  if (partes.length === 1) return casaSimples(el, partes[0]);
  return casaSimples(el, partes[0]) && consultar(el, partes[partes.length - 1]).length > 0;
}

/** Uma lista paginada de mentira, com o mesmo formato que a página serve. */
function criarPainel(nItens, porPagina) {
  const painel = criarElemento('div');
  painel.setAttribute('data-paginar', '');
  painel.setAttribute('data-por-pagina', String(porPagina));
  const ul = criarElemento('ul');
  for (let i = 0; i < nItens; i++) ul.appendChild(criarElemento('li'));
  const rodape = criarElemento('div', 'paginacao');
  const info = criarElemento('span', 'pag-info');
  const ant = criarElemento('button', 'pag-ant');
  const prox = criarElemento('button', 'pag-prox');
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
    querySelectorAll(sel) {
      if (sel === '[data-paginar]') return paineis;
      return [];
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
  return api;
}

/** Uma secção Turmas de mentira, com a barra de abas e os três painéis. */
function criarSecaoDeAbas() {
  const nomes = ['turma', 'rubrica', 'vincular'];
  const secao = criarElemento('section');
  const abas = criarElemento('div', 'abas');
  const botoes = nomes.map((n) => {
    const b = criarElemento('button', n === 'turma' ? 'aba ativo' : 'aba');
    b.setAttribute('data-aba', n);
    abas.appendChild(b);
    return b;
  });
  secao.appendChild(abas);
  const paineis = nomes.map((n, i) => {
    const p = criarElemento('div', 'aba-painel');
    p.id = 'aba-' + n;
    p.hidden = i !== 0;
    secao.appendChild(p);
    return p;
  });
  return { secao, abas, botoes, paineis };
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
  conferir('as seis secções estão na página', dom.secoes.length, 6);
  conferir('só o Painel inicial nasce visível', visiveis(dom.secoes), ['sec-painel']);

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
    for (const alvo of ['painel', 'professores', 'alunas', 'turmas', 'vocabulario', 'curadorias']) {
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

  const handlers = ['form-senha', 'form-prof', 'form-aluna', 'form-turma', 'form-termo', 'form-curadoria'];
  const comSubmit = handlers.filter((id) => (dom.doId(id).ouvintes.submit || []).length >= 1);
  conferir('os formulários ficam com handler', comSubmit, handlers);
  conferir('o botão do catálogo fica com handler', (dom.doId('semear').ouvintes.click || []).length >= 1, true);

  // 6. AS TRÊS ABAS DA SECÇÃO TURMAS. A régua da rubrica era declarada DENTRO do cadastro da
  //    turma, e havia um segundo formulário abaixo que mudava a régua de uma turma existente.
  //    Agora são três atos separados — e este bloco mede os três, do cadastro da turma ao
  //    vínculo, incluindo o que o PLANO lê.
  const reguaPadrao = ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'];
  conferir('há três abas (turma, criar rubrica, vincular)',
    (html.match(/data-aba="[a-z]+"/g) || []).map((s) => s.replace(/^data-aba="|"$/g, '')), ['turma', 'rubrica', 'vincular']);
  conferir('…e só a primeira nasce visível',
    ['aba-turma', 'aba-rubrica', 'aba-vincular'].map((id) =>
      new RegExp('id="' + id + '"').test(html.split('id="' + id + '"')[1].slice(0, 60))), [false, false, false]);
  conferir('o cadastro da turma NÃO declara mais a régua',
    (html.match(/id="trubrica"|id="form-regua"/g) || []).length, 0);
  // OS FORMULÁRIOS NÃO EXPLICAM (16/10/2026): só rótulo, campo e placeholder. O que era
  // instrução dentro do formulário («o nome vira a pasta», «a régua não se declara aqui»,
  // «uma rubrica pode valer para várias turmas») saiu — quem usa o cadastro conhece o
  // sistema, e o texto a mais empurra os campos para fora da tela.
  conferir('nenhum formulário traz explicação (só rótulo, campo e placeholder)',
    (html.match(/class="dica"|<p class="nota">|<p class="sub">/g) || []).length, 0);
  // O comentário que VAZOU: três linhas `//` escritas dentro da concatenação, com `\n`, iam
  // parar ao HTML como texto da página. A página não pode conter `// ` no corpo.
  conferir('nenhum comentário de fonte vazou para o corpo da página',
    /\/\/ OS DIAS DA SEMANA|^ *\/\/ /.test(html), false);
  conferir('o formulário da rubrica nasce com os quatro níveis padrão',
    (html.match(/id="rubr-niveis">([\s\S]*?)<\/div>/) || [''])[0].match(/linha-regua/g || []).length, reguaPadrao.length);
  conferir('…e o da turma não traz nenhum campo de régua',
    (html.match(/name="rubrica"/g) || []).length, reguaPadrao.length); // só os do editor da rubrica
  conferir('a página sabe as rubricas (para o botão Editar)',
    script.includes('var RUBRICAS = ') && script.includes('editar-rubrica'), true);
  conferir('o editor de níveis existe na página', script.includes('linhaDaReguaNoDom') && script.includes('tirar-regua'), true);

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

  const secoesComLista = ['professores', 'alunas', 'turmas', 'vocabulario', 'curadorias'];
  for (const s of secoesComLista) {
    const trecho = html.split('id="sec-' + s + '"')[1] || '';
    const fim = trecho.indexOf('</section>');
    const corpo = trecho.slice(0, fim === -1 ? trecho.length : fim);
    conferir('a lista de ' + s + ' fica na coluna da direita, paginada',
      corpo.includes('class="col-lista"') && corpo.includes('data-paginar') && corpo.includes('class="paginacao"'), true);
  }
  conferir('o formulário fica na coluna da esquerda (4 secções + as 3 abas de Turmas)',
    (html.match(/class="col-form"/g) || []).length, 7);
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
  conferir('…e as ALUNAS e o REPERTÓRIO continuam múltiplos (escolhedor)',
    html.includes('class="escolhedor" id="esc-alunas"') &&
    html.includes('class="escolhedor" id="esc-repertorio"'), true);
  conferir('o repertório usa o MESMO escolhedor dos outros (a janela do navegador não se estiliza)',
    html.includes('class="escolhedor" id="esc-repertorio"'), true);
  conferir('…e não sobrou nenhum lookup no formulário',
    html.includes('<datalist') || html.includes('list="esc-repertorio-lista"'), false);
  // Os termos de verdade, no próprio menu: é o que dá a busca por digitação do navegador.
  // A prova cadastra dois termos e confere que eles aparecem como OPÇÕES do menu.
  await pedir(env, '/api/bastidores/termo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, termo: 'Arabesque', categoria: 'passo' }),
  });
  await pedir(env, '/api/bastidores/termo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: SENHA_DA_DIRECAO, termo: 'Plié', categoria: 'passo' }),
  });
  const comTermos = await (await pedir(env, '/bastidores/producao')).text();
  const menuDoRepertorio = (comTermos.match(/id="esc-repertorio"[\s\S]*?<\/select>/) || [''])[0];
  conferir('…e os termos do vocabulário entram como OPÇÕES do menu',
    (menuDoRepertorio.match(/<option /g) || []).length, 3); // «— escolher —» + os dois
  conferir('…com a categoria no rótulo, para distinguir dois termos de mesmo nome',
    menuDoRepertorio.includes('>Arabesque — passo<'), true);
  conferir('…e o formulário entrega os nomes que o servidor espera',
    script.includes('fichasDe("esc-repertorio")') && script.includes('fichasDe("esc-alunas")'), true);
  conferir('…e a turma vai como LISTA DE UM (o formato que o plano lê)',
    script.includes('turmas: umaTurma ? [umaTurma] : []'), true);
  conferir('não sobrou nenhuma caixa com rolagem no formulário', html.includes('cb-grupo'), false);
  conferir('nenhum tapete de pílulas longas sobrou (o de 84 era o pior)',
    (html.match(/class="escolha"/g) || []).length, 7);

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
  conferir('as listas mostram 7 linhas por página (4 secções + as 3 abas de Turmas)',
    (html.match(/data-por-pagina="7"/g) || []).length, 7);

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
  const escRep = criarEscolhedor('esc-repertorio', ['Plié', 'Arabesque', 'Lasconde']);
  conferir('adicionar uma ficha funciona', api.adicionarFicha(escRep, 'Arabesque'), true);
  conferir('…e ela aparece no escolhedor', api.fichasDe('esc-repertorio'), ['Arabesque']);
  conferir('a mesma ficha não entra duas vezes', api.adicionarFicha(escRep, 'Arabesque'), false);
  conferir('…e continua a haver só uma', api.fichasDe('esc-repertorio').length, 1);
  conferir('uma segunda ficha diferente entra', api.adicionarFicha(escRep, 'Plié'), true);
  conferir('…na ordem em que foi escolhida', api.fichasDe('esc-repertorio'), ['Arabesque', 'Plié']);
  const escNivel = criarEscolhedor('esc-niveis', ['Grade 1', 'Grade 2']);
  api.adicionarFicha(escNivel, 'Grade 2');
  api.adicionarFicha(escNivel, 'Grade 3');
  conferir('…e dois níveis saem como UM texto, que é o contrato do campo',
    api.fichasDe('esc-niveis').join(', '), 'Grade 2, Grade 3');
  const ficha = escNivel.querySelector('.escolhido');
  conferir('…e dá para tirar uma ficha', !!ficha.querySelector('.tirar'), true);

  // 11c. AS ABAS, CLICADAS. É o coração do pedido: três atos separados (cadastrar a turma,
  //      criar a rubrica, vincular), e cada aba mostra só o seu painel. Prova de markup não
  //      bastaria — o que o usuário faz é CLICAR, e uma aba que não troca é um botão morto.
  const abas = criarSecaoDeAbas();
  api.clicar(abas.botoes[1]);
  conferir('clicar em «Criar rubrica» marca a aba',
    abas.botoes.map((b) => b.className), ['aba', 'aba ativo', 'aba']);
  conferir('…e mostra só o painel dela',
    abas.paineis.map((p) => !p.hidden), [false, true, false]);
  conferir('…e o aria-selected acompanha',
    abas.botoes.map((b) => b.getAttribute('aria-selected')), ['false', 'true', 'false']);
  api.clicar(abas.botoes[2]);
  conferir('clicar em «Vincular» mostra só o painel do vínculo',
    abas.paineis.map((p) => !p.hidden), [false, false, true]);
  api.clicar(abas.botoes[0]);
  conferir('e voltar para «Turma» fecha as outras duas',
    abas.paineis.map((p) => !p.hidden), [true, false, false]);

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
