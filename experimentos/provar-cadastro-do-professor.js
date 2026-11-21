#!/usr/bin/env node
'use strict';

/*
 * provar-cadastro-do-professor.js — as três abas do professor, e a ficha inteira editável
 * (16/11/2026).
 *
 * O QUE ELA PEDIU, em duas frases que são uma mudança só:
 *
 *   «Aqui vem novo professor, o nome da aba é cadastro de professor. Aí a gente vai ter uma outra
 *   aba é o Habilitações e a próxima é Desligamento. Então a gente vai organizar em abas.»
 *
 *   «Quando vou editar e aparece no nome do professor "Bri" sobrenome "e Volet". Tem que aparecer
 *   certo a edição, não pode ser desse jeito. Pode editar tudo, não tem campo desabilitado.»
 *
 * O «Bri»/«e Volet» ERA UM DEFEITO DE UMA BARRA SÓ. O `replace(/\s+/g, " ")` estava escrito dentro
 * de uma string de JavaScript (`'…replace(/\s+/g, " ")…'`), e na string de ORIGEM `\s` não é o
 * espaço da regex: é a letra `s`. Chegava ao navegador `.replace(/s+/g, " ")` — que em «Brise
 * Volet» troca o `s` por um espaço, dá «Bri e Volet», e a divisão em duas palavras devolve «Bri» +
 * «e Volet». O mesmo erro estava no `submit`: corrigir o nome de alguém gravaria o nome com o `s`
 * comido. É a família da crase dentro do template literal — uma string que atravessa duas
 * linguagens tem de ser escrita na linguagem em que está.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. a MARCAÇÃO — as três abas, os três painéis, e a listagem FORA deles (a regra que ela já
 *      tinha dado para a Audição: «a listagem deve permanecer visível em todas as abas»);
 *   B. as ABAS A CORRER, em jsdom — o clique troca o painel, o teclado também, e o «Editar» de uma
 *      linha leva à aba do cadastro;
 *   C. a FICHA a preencher — nome e sobrenome divididos CERTOS, e os seis campos abertos, com a
 *      senha em branco e à vista — e a HABILIDADE fechada, que é a ordem dela (20/11/2026);
 *   D. o SERVIDOR — a ficha (`GET`) e a gravação (`POST`), com as duas metades do que se pode e do
 *      que não se pode: o nome de quem já assinou documentos não muda (e a recusa é dele, com a
 *      razão), e tudo o resto — CPF, telefone, e-mail, habilidade, senha — muda;
 *   E. a HABILIDADE É A MESMA nos dois sítios: a lista do `<select>` do cadastro e as caixas da aba
 *      das Habilitações saem do MESMO catálogo (`biblioteca/modalidades/modalidades.json`).
 *
 *   node experimentos/provar-cadastro-do-professor.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const MODALIDADES = require(path.join(RAIZ, 'biblioteca/modalidades/modalidades.json'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const USOS_VAZIOS = () => ({ professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 });

/** A página como o servidor a desenha, com dois professores e o principal. */
function pagina(profs, { dono = 'Brise Volet', donoSlug = 'brise-volet' } = {}) {
  return bastidores.paginaProducao('breu', {}, profs, ['abreu'], dono, donoSlug,
    [], [], {}, [], [], [], USOS_VAZIOS(), null, null, [], new Set());
}

const PROFS = [
  { nome: 'Brise Volet', slug: 'brise-volet', sal: 's1', hash: 'h1' },
  { nome: 'Ana Diag', slug: 'ana-diag', sal: 's2', hash: 'h2' },
];

/** Um KV de bolso. */
function kvFalso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    bruto: dados,
  };
}

/**
 * O GITHUB DE MENTIRA — o mínimo que `lerPerfil`/`gravarPerfil` pedem. Guarda os ficheiros num
 * mapa, e um `PUT` grava o que veio (descodificado), como o repositório faria.
 */
function githubFalso(ficheiros) {
  const mapa = new Map(Object.entries(ficheiros || {}));
  const chamadas = [];
  const fetch = async (url, opcoes) => {
    const u = String(url);
    chamadas.push({ url: u, metodo: (opcoes && opcoes.method) || 'GET' });
    /* A ÁRVORE — o `acervo.doAmbiente` lê `git/trees?recursive=1` para saber que envelopes
     * existem. Uma árvore vazia é uma casa sem planos, que é o caso desta bancada: o professor
     * está livre porque não há plano nenhum que o cite. */
    /* `ok` É O CAMPO QUE OS LEITORES DA CASA CONFEREM (19/11/2026) — e sem ele a resposta era lida
     * como falha com `status: 200`. É a armadilha do duplo de teste: `!resposta.ok` sobre um objeto
     * que não tem `ok` é `true`, e o erro que sai («não li …: HTTP 200») aponta para o sítio
     * errado. Um 200 com `ok` em falta é o pior dos dois mundos para diagnosticar. */
    const ok = (status) => status >= 200 && status < 300;
    if (u.indexOf('/git/trees/') !== -1) {
      return { ok: true, status: 200, json: async () => ({ tree: [], sha: 'arvore' }), text: async () => '' };
    }
    const caminho = decodeURIComponent(u.replace(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\//, '').split('?')[0]);
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (metodo === 'GET') {
      if (!mapa.has(caminho)) return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
      const conteudo = mapa.get(caminho);
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: Buffer.from(conteudo, 'utf8').toString('base64'), sha: 'sha-' + caminho }),
        /* O `text()` TAMBÉM ENTREGA O FICHEIRO (19/11/2026). O leitor do inventário pede o conteúdo
         * cru (`Accept: raw`) e lê `.text()`; um `text()` vazio dava «não li escola/<slug>/
         * indice.json: HTTP 200» — um 200 com corpo nenhum, que é o pior dos dois mundos para
         * diagnosticar. Um duplo de teste que só responde por um dos caminhos mede o duplo, não a
         * página. */
        text: async () => conteudo,
      };
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      mapa.set(caminho, Buffer.from(String(corpo.content || ''), 'base64').toString('utf8'));
      return { ok: true, status: 200, json: async () => ({ commit: { sha: 'novo' } }), text: async () => '' };
    }
    return { ok: false, status: 405, json: async () => ({}), text: async () => '' };
  };
  return { fetch, ficheiros: mapa, chamadas };
}

function envCom(kv, gh) {
  return {
    ESCOLA_SLUG: 'breu',
    PADD_KV: kv,
    GITHUB_TOKEN: 'gh-de-mentira',
    SENHA_ADMIN: '123',
    /* A IDENTIDADE DO PRINCIPAL — sem ela `slugDoDono(env)` é `''`, o `dono` não é reconhecido
     * e a ficha dele cai no caminho de «professor cadastrado», que não é o que se está a medir. */
    PROFESSOR_SLUG: 'brise-volet',
    PROFESSOR_NOME: 'Brise Volet',
    ASSETS: { fetch: async () => new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) },
    __gh: gh,
  };
}

/** Um pedido à escola, sem rede — `fetchSemRede` é a rota, não a moldura. */
async function pedir(env, caminho, metodo, corpo) {
  const req = new Request('https://breu.padd.com.br' + caminho, {
    method: metodo || 'GET',
    ...(corpo ? { body: JSON.stringify(corpo), headers: { 'Content-Type': 'application/json' } } : {}),
  });
  const r = await bastidores.fetchSemRede(req, env);
  const d = await r.json().catch(() => ({}));
  return { status: r.status, dados: d };
}

const comSenha = (corpo) => Object.assign({ senhaDirecao: '123' }, corpo || {});

(async () => {
  console.log('A. A marcação: três abas, três painéis, e a listagem fora deles');
  {
    const html = pagina(PROFS);
    conferir('a tira das abas existe e diz a que grupo pertence',
      /<nav class="abas"[^>]*id="pf-abas"[^>]*data-abas="professor"/.test(html), null);
    const rotulos = [...html.matchAll(/<button[^>]*id="pf-aba-([a-z]+)"[^>]*>([^<]+)<\/button>/g)]
      .map((m) => [m[1], m[2].trim()]);
    /* O RÓTULO DA PRIMEIRA É «Cadastro», e não «Cadastro de professor» (19/11/2026): o «de
     * professor» repetia o título da secção, e o passo 1 da tira passou a ter o mesmo nome. Esta
     * asserção ficou a afirmar o rótulo antigo e reprovava a página certa — corrigida aqui, com
     * nota, como manda a regra: uma bancada que codifica o desenho antigo muda de sinal em
     * público. */
    conferir('as três abas, pela ordem dela: cadastro, habilitações, desligamento',
      JSON.stringify(rotulos) === JSON.stringify([
        ['cadastro', 'Cadastro'], ['habilitacoes', 'Habilitações'], ['desligamento', 'Desligamento'],
      ]), rotulos);
    conferir('a primeira nasce aberta, as outras fechadas',
      !/id="pf-painel-cadastro"[^>]*hidden/.test(html)
      && /id="pf-painel-habilitacoes"[^>]*hidden/.test(html)
      && /id="pf-painel-desligamento"[^>]*hidden/.test(html), null);
    /* A LISTAGEM FICA FORA DOS PAINÉIS — é a regra que ela já tinha dado para a Audição, e a
     * única forma de ela valer nas três abas. */
    const corpoDaSecao = html.slice(html.indexOf('id="sec-professores"'), html.indexOf('id="sec-alunas"'));
    const posColLista = corpoDaSecao.indexOf('class="col-lista"');
    const posUltimoPainel = corpoDaSecao.lastIndexOf('id="pf-painel-desligamento"');
    conferir('a listagem vive DEPOIS dos painéis, fora deles (à vista nas três abas)',
      posColLista > posUltimoPainel && posUltimoPainel > 0, { posColLista, posUltimoPainel });
    /* SEM PROSA NO DESLIGAMENTO (19/11/2026) — «é simplesmente colocar o nome do professor, o
     * motivo e desligar o professor. Só isso […] Não precisa ter nada de texto.» A ficha pede os
     * dois campos e o botão, e mais nada: um parágrafo a explicar o que acontece à escola antes de
     * a pessoa agir é a prosa que a regra da casa não admite dentro de um formulário. O critério é
     * o da Audição — prosa é o parágrafo SEM `id`, porque o que não tem `id` não é reescrito por
     * ninguém; o que diz ESTADO («não há ninguém para desligar») tem `id` e é reescrito. */
    const painelDesl = corpoDaSecao.slice(corpoDaSecao.indexOf('id="pf-painel-desligamento"'),
      corpoDaSecao.indexOf('class="col-lista"'));
    const prosasDesl = [...painelDesl.matchAll(/<p class="(?:sub|aviso|nota)"(?![^>]*\sid=")([^>]*)>/g)]
      .map((m) => m[0].slice(0, 40));
    conferir('o painel do Desligamento não traz prosa: nome, motivo e o botão',
      prosasDesl.length === 0 && /<form id="form-desligar">/.test(painelDesl)
        && /id="desl-professor"/.test(painelDesl) && /id="desl-motivo"/.test(painelDesl)
        && /id="desl-enviar"/.test(painelDesl), prosasDesl);
    /* E o painel VAZIO não fica em branco: o parágrafo que diz que não há ninguém tem `id`. */
    const semNinguem = pagina([PROFS[0]]);
    const painelVazio = semNinguem.slice(semNinguem.indexOf('id="pf-painel-desligamento"'),
      semNinguem.indexOf('class="col-lista"'));
    conferir('sem ninguém para desligar, o painel diz o estado — e o parágrafo tem id',
      /<p class="aviso" id="desl-vazio">[^<]{20,}<\/p>/.test(painelVazio)
        && !/<form id="form-desligar">/.test(painelVazio), painelVazio.slice(0, 200));
    conferir('o «Seções» do telemóvel existe, e a pílula diz qual folha abre',
      /id="pf-abas-folha"/.test(html) && /data-folha="pf-abas"/.test(html), null);
    /* A CONTAGEM É DENTRO DO MENU DO PROFESSOR (16/11/2026). Ela era feita no HTML inteiro, e
     * passou a contar quatro quando a Produção ganhou o terceiro grupo de abas («A escola», cuja
     * primeira aba também se chama `cadastro`): `data-aba` é o gancho de TODOS os grupos, e contar
     * por ele no documento inteiro conta os grupos uns com os outros. É a mesma lição que a prova
     * do financeiro já traz — mede-se no DOM, e no DOM daquele grupo. */
    const menuDoProfessor = (html.match(/id="pf-abas-menu"[\s\S]*?<\/ul>/) || [''])[0];
    conferir('a folha do telemóvel tem os três itens',
      (menuDoProfessor.match(/class="menu-de-acoes-item" data-aba="(cadastro|habilitacoes|desligamento)"/g) || []).length === 3,
      (menuDoProfessor.match(/data-aba="[a-z]+"/g) || []));
    /* AS PEÇAS DA CASA, e não desenho novo. Desde 16/11/2026 a peça mora na FOLHA — a página não a
     * redeclara, e é isso que se afirma: as marcas (`.aba`, `role="tab"`, `.aba-painel`) estão no
     * documento, e a geometria não está (não há `.aba{` com desenho aqui). A regra `.abas{display:
     * none}` que a página ainda tem é a decisão dela — esconder a tira onde há pílula —, e não uma
     * segunda declaração da peça. */
    conferir('as abas usam as peças da casa, e a página não redeclara a geometria',
      /class="aba"/.test(html) && /aba-painel/.test(html)
        && !/\.aba\{[^}]*border-radius/.test(html) && !/\.aba-painel\{[^}]*padding/.test(html), null);
    conferir('e os dois grupos têm as duas pílulas, cada uma com a sua folha',
      /data-folha="lb-abas"/.test(html) && /data-folha="pf-abas"/.test(html), null);
  }

  console.log('\nB. As abas a correr (jsdom): clique, teclado e a listagem à vista');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const html = pagina(PROFS);
    const vc = new VirtualConsole();
    const erros = [];
    vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/producao', virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        Object.defineProperty(w, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
        w.scrollTo = () => {};
        w.fetch = () => Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ ok: true }) });
      },
    });
    await new Promise((r) => setTimeout(r, 350));
    const d = dom.window.document;
    d.getElementById('sec-professores').hidden = false;
    const aberto = () => ['cadastro', 'habilitacoes', 'desligamento']
      .filter((k) => !d.getElementById('pf-painel-' + k).hidden);
    conferir('na carga abre um painel só, e é o do cadastro',
      JSON.stringify(aberto()) === JSON.stringify(['cadastro']), aberto());

    d.getElementById('pf-aba-habilitacoes').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    conferir('clicar «Habilitações» troca o painel',
      JSON.stringify(aberto()) === JSON.stringify(['habilitacoes']), aberto());
    conferir('…e a aba clicada fica marcada como selecionada',
      d.querySelector('#pf-abas [aria-selected="true"]').getAttribute('data-aba') === 'habilitacoes', null);
    conferir('…e a listagem continua à vista (não está dentro do painel que abriu)',
      !d.getElementById('pf-painel-habilitacoes').contains(d.querySelector('#sec-professores .col-lista')), null);

    const nav = d.getElementById('pf-abas');
    nav.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    conferir('o teclado anda para a esquerda e volta ao cadastro',
      aberto()[0] === 'cadastro', aberto());

    /* O «EDITAR» DE UMA LINHA LEVA À ABA DO CADASTRO — quem clica a partir das habilitações não
     * pode aterrar a olhar para caixas de seleção. */
    d.getElementById('pf-aba-desligamento').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    const ed = d.querySelector('#sec-professores button.editar');
    conferir('a lista tem «Editar» numa linha', Boolean(ed), null);
    if (ed) ed.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    conferir('…e ele abre a aba do cadastro', aberto()[0] === 'cadastro', aberto());
    conferir('os scripts da página não lançam', erros.length === 0, erros.slice(0, 1));
    dom.window.close();
  }

  console.log('\nC. A ficha a preencher: o nome dividido CERTO, e os sete campos abertos');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const html = pagina(PROFS);
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => console.log('   (jsdom: ' + String((e && e.message) || e).split('\n')[0] + ')'));
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/producao', virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        Object.defineProperty(w, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
        w.scrollTo = () => {};
        w.fetch = () => Promise.resolve({
          status: 200, ok: true,
          json: () => Promise.resolve({
            ok: true, slug: 'brise-volet', nome: 'Brise Volet', dono: true,
            cpf: '987.654.321-00', telefone: '(51) 99999-0000', email: 'brise@exemplo.com',
            modalidade: 'bale-classico',
          }),
        });
      },
    });
    await new Promise((r) => setTimeout(r, 350));
    const d = dom.window.document;
    d.getElementById('sec-professores').hidden = false;
    const eds = [...d.querySelectorAll('#sec-professores button.editar')];
    conferir('todas as linhas têm «Editar», e não só a do principal', eds.length === 2, eds.length);
    conferir('…e cada botão leva o SLUG da pessoa (o nome é rótulo, o slug identifica)',
      eds.every((b) => b.getAttribute('data-slug')), eds.map((b) => b.getAttribute('data-slug')));

    eds[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    const campo = (id) => (d.getElementById(id) || {}).value;
    /* O DEFEITO DELA, AO PÉ DA LETRA: «aparece no nome do professor "Bri" sobrenome "e Volet"». */
    conferir('o nome é «Brise» e o sobrenome «Volet» — o `s` não é comido',
      campo('pnome') === 'Brise' && campo('psobrenome') === 'Volet',
      { nome: campo('pnome'), sobrenome: campo('psobrenome') });
    conferir('o CPF vem preenchido do servidor', campo('pcpf') === '987.654.321-00', campo('pcpf'));
    conferir('o telefone também', campo('ptelefone') === '(51) 99999-0000', campo('ptelefone'));
    conferir('o e-mail também', campo('pemail') === 'brise@exemplo.com', campo('pemail'));
    conferir('a habilidade vem a que ele declara', campo('pmodalidade') === 'bale-classico', campo('pmodalidade'));
    /* «PODE EDITAR TUDO» DEIXOU DE SER VERDADE PARA UM CAMPO, E A ORDEM É DELA (20/11/2026):
     *
     *   «este campo habilidade, o que ele ensina é somente leitura. Ele foi criado lá no cadastro
     *    do professor quando nasceu a escola. E se ele quiser modificar esse campo da habilidade,
     *    ele tem que fazer isso pela aba habilitações.»
     *
     * E a razão de ser assim, e não ao contrário: a habilidade não é um dado do cadastro, é o que
     * a Turma lê para saber de que modalidade é o professor. Mudá-la por aqui seria uma segunda
     * porta para a mesma coisa — e a porta que o `Atualizar o ciclo` vigia é a das Habilitações.
     * Duas portas para o mesmo dado é a garantia de que uma delas fica por vigiar.
     *
     * A prova afirmava o contrário e por isso reprovava a página certa: passa a afirmar o
     * contrato novo, que é mais estreito e não mais largo. */
    const campos = ['pnome', 'psobrenome', 'pcpf', 'ptelefone', 'pemail', 'psenha'];
    const apagados = campos.filter((id) => {
      const el = d.getElementById(id);
      return !el || el.disabled || el.readOnly;
    });
    conferir('os seis campos do cadastro continuam abertos', apagados.length === 0, apagados);
    conferir('a habilidade é SOMENTE LEITURA no cadastro — muda-se na aba das Habilitações',
      d.getElementById('pmodalidade').disabled === true, d.getElementById('pmodalidade').disabled);
    conferir('…e o campo diz onde se muda, ao lado dele',
      Boolean(d.getElementById('pmodalidade-nota'))
        && /habilita/i.test(d.getElementById('pmodalidade-nota').textContent),
      d.getElementById('pmodalidade-nota') && d.getElementById('pmodalidade-nota').textContent.trim());
    conferir('a senha está à vista, e em branco (em branco mantém a que ele usa)',
      !d.getElementById('prof-senha').hidden && campo('psenha') === '', null);
    conferir('o modo é «editar» e o alvo é o slug', campo('prof-modo') === 'editar' && campo('prof-alvo') === 'brise-volet',
      { modo: campo('prof-modo'), alvo: campo('prof-alvo') });
    /* O BOTÃO DO PASSO 1 DIZ «Avançar» — TAMBÉM EM EDIÇÃO (19/11/2026). Dizia «Gravar as mudanças»
     * e com isso prometia o fim do trabalho quando ainda falta o passo 2, que é a régua do
     * professor; e o passo 1 deixou de gravar (`type="button"`). Quem grava é o passo 2. A
     * asserção afirmava o rótulo antigo e reprovava a página certa: passa a afirmar as duas
     * metades do gesto. */
    conferir('o passo 1 diz «Avançar», e quem grava é o passo 2',
      /Avançar/.test(d.getElementById('prof-enviar').textContent)
        && /Gravar/.test(d.getElementById('rubr-gravar').textContent),
      { passo1: d.getElementById('prof-enviar').textContent, gravar: d.getElementById('rubr-gravar').textContent });
    dom.window.close();
  }

  console.log('\nD. O servidor: a ficha (POST, com credencial) e a gravação');
  const fetchDeVerdade = globalThis.fetch;
  {
    const kv = kvFalso({
      'bastidores/breu/professores': JSON.stringify(PROFS),
      'bastidores/breu/dono': JSON.stringify({ nome: 'Brise Volet', slug: 'brise-volet' }),
      'bastidores/breu/cadastro': JSON.stringify({
        escolaNome: 'Breu', cpf: '987.654.321-00', professorEmail: 'brise@exemplo.com',
        professorTelefone: '(51) 99999-0000',
      }),
      'professores/ana-diag/contato': JSON.stringify({ cpf: '111.444.777-35', email: 'ana@exemplo.com' }),
      /* O CONTATO DO PRINCIPAL — é ele que a unicidade do CPF encontra. O CPF dele também está no
       * cadastro da escola; o `contato` é o documento que a varredura lê, e é o que a primeira
       * gravação da ficha escreve. Semear os dois é o estado de uma escola já corrigida uma vez. */
      'professores/brise-volet/contato': JSON.stringify({ cpf: '987.654.321-00', email: 'brise@exemplo.com' }),
    });
    const gh = githubFalso({
      'professores/brise-volet/perfil.json': JSON.stringify({ slug: 'brise-volet', nome: 'Brise Volet', modalidades: ['bale-classico'], criado: '2026-11-16' }),
    });
    const env = envCom(kv, gh);
    /* O GITHUB É DO MÓDULO INTEIRO (16/11/2026): além da ficha e do perfil, a regra do «nome
     * preso» lê a ÁRVORE do repositório para saber que planos existem. Sem esta troca, essa
     * leitura falhava, e `professorVinculadoA(null, …)` responde «preso» — na dúvida, não se
     * mexe em quem assina documentos. A bancada estaria a medir a própria falta de rede. */
    globalThis.fetch = gh.fetch;

    const fichaDono = await pedir(env, '/api/bastidores/ficha-do-professor', 'POST', comSenha({ professor: 'brise-volet' }));
    conferir('a ficha do principal responde 200', fichaDono.status === 200, fichaDono.status);
    conferir('…e traz o CPF do cadastro da escola quando ele não tem contato próprio',
      fichaDono.dados.cpf === '987.654.321-00', fichaDono.dados);
    conferir('…e a habilidade, do perfil no repositório',
      fichaDono.dados.modalidade === 'bale-classico', fichaDono.dados.modalidade);

    const fichaAna = await pedir(env, '/api/bastidores/ficha-do-professor', 'POST', comSenha({ professor: 'ana-diag' }));
    conferir('a ficha de um professor cadastrado traz o contato dele',
      fichaAna.dados.cpf === '111.444.777-35' && fichaAna.dados.email === 'ana@exemplo.com', fichaAna.dados);

    const inexistente = await pedir(env, '/api/bastidores/ficha-do-professor', 'POST', comSenha({ professor: 'ninguem' }));
    conferir('professor que não é desta escola responde 404', inexistente.status === 404, inexistente.status);

    /* A FICHA É DADO PESSOAL: sem a credencial da direção, não sai. */
    const semCredencial = await pedir(env, '/api/bastidores/ficha-do-professor', 'POST', { professor: 'brise-volet' });
    conferir('sem a credencial da direção, a ficha (com CPF e telefone) NÃO sai',
      semCredencial.status === 401, semCredencial.status);

    /* — A GRAVAÇÃO, com o nome LIVRE: muda tudo. */
    const r1 = await pedir(env, '/api/bastidores/professor', 'POST', comSenha({
      editar: 'ana-diag', nome: 'Ana', sobrenome: 'Diagnóstico',
      cpf: '529.982.247-25', telefone: '(51) 98888-0000', email: 'ana.nova@exemplo.com',
      modalidade: 'bale-classico', senha: 'nova-senha',
    }));
    conferir('gravar a ficha de um professor livre responde 200', r1.status === 200, r1.dados);
    conferir('…e o nome NOVO vai para o registo',
      JSON.parse(kv.bruto.get('bastidores/breu/professores')).some((p) => p.slug === 'ana-diag' && p.nome === 'Ana Diagnóstico'),
      JSON.parse(kv.bruto.get('bastidores/breu/professores')));
    conferir('…e o nome antigo já não está lá', !JSON.parse(kv.bruto.get('bastidores/breu/professores'))
      .some((p) => p.nome === 'Ana Diag'), null);
    const contato = JSON.parse(kv.bruto.get('professores/ana-diag/contato'));
    conferir('…e a ficha (CPF, telefone, e-mail) foi gravada no contato',
      contato.cpf === '52998224725' && contato.telefone === '(51) 98888-0000'
      && contato.email === 'ana.nova@exemplo.com', contato);
    const registoAna = JSON.parse(kv.bruto.get('bastidores/breu/professores')).find((p) => p.slug === 'ana-diag');
    conferir('…e o registo ganhou um par sal+hash novo (a senha foi trocada)',
      registoAna.sal !== 's2' && Boolean(registoAna.hash) && registoAna.hash !== 'h2', registoAna);
    conferir('…e a habilidade foi para o perfil do professor, no repositório',
      /bale-classico/.test(gh.ficheiros.get('professores/ana-diag/perfil.json') || ''),
      gh.ficheiros.get('professores/ana-diag/perfil.json'));

    /* — O NOME PRESO: com a pessoa numa curadoria, o nome não muda e a recusa diz porquê. */
    const kvPreso = kvFalso({
      'bastidores/breu/professores': JSON.stringify(PROFS),
      'bastidores/breu/curadorias': JSON.stringify([{ id: 'c1', professor: 'ana-diag', modalidade: 'bale-classico', turmas: ['t1'] }]),
      'bastidores/breu/turmas': JSON.stringify([{ id: 't1', nome: 'Balé 1', vigente: true }]),
    });
    const envPreso = envCom(kvPreso, gh);
    const r2 = await pedir(envPreso, '/api/bastidores/professor', 'POST', comSenha({
      editar: 'ana-diag', nome: 'Outra', sobrenome: 'Pessoa',
    }));
    conferir('com a pessoa numa curadoria, mudar o NOME é recusado', r2.status === 409, r2.dados);
    conferir('…e a recusa diz que o problema é o nome, e que o resto pode ser corrigido',
      /nome do professor/i.test(String(r2.dados.erro)) && /CPF/i.test(String(r2.dados.erro)), r2.dados.erro);
    const r3 = await pedir(envPreso, '/api/bastidores/professor', 'POST', comSenha({
      editar: 'ana-diag', nome: 'Ana', sobrenome: 'Diag', cpf: '390.533.447-05',
    }));
    conferir('…mas a MESMA ficha sem mudar o nome grava', r3.status === 200, r3.dados);

    /* — O CPF DE OUTRA PESSOA. */
    const r4 = await pedir(env, '/api/bastidores/professor', 'POST', comSenha({
      editar: 'ana-diag', nome: 'Ana', sobrenome: 'Diagnóstico', cpf: '987.654.321-00',
    }));
    conferir('um CPF que já é de outro professor é recusado', r4.status === 409, r4.dados);
    conferir('…e a recusa diz de quem é o número', /já é do professor/i.test(String(r4.dados.erro)), r4.dados.erro);

    /* — E O PRINCIPAL: o nome vive na sobreposição do dono, a senha no par do dono. */
    const r5 = await pedir(env, '/api/bastidores/professor', 'POST', comSenha({
      editar: 'brise-volet', nome: 'Brise', sobrenome: 'Volet Silva', modalidade: 'bale-classico',
    }));
    conferir('gravar a ficha do principal responde 200', r5.status === 200, r5.dados);
    const dono = JSON.parse(kv.bruto.get('bastidores/breu/dono'));
    conferir('…e o nome novo fica na sobreposição do dono',
      dono.nome === 'Brise Volet Silva', dono.nome);
  }

  globalThis.fetch = fetchDeVerdade;

  console.log('\nE. A habilidade é a MESMA nos dois sítios');
  {
    const html = pagina(PROFS);
    const doSelect = [...html.matchAll(/<select id="pmodalidade"[^>]*>([\s\S]*?)<\/select>/g)]
      .map((m) => [...m[1].matchAll(/value="([^"]+)"/g)].map((x) => x[1]))[0] || [];
    const dasCaixas = [...html.matchAll(/name="hab-modalidade" value="([^"]+)"/g)].map((m) => m[1]);
    const doCatalogo = (MODALIDADES.modalidades || []).map((m) => m.id);
    conferir('o `<select>` do cadastro tem o catálogo inteiro',
      JSON.stringify(doSelect.filter(Boolean)) === JSON.stringify(doCatalogo), { doSelect, doCatalogo });
    conferir('…e as caixas da aba das Habilitações têm o MESMO catálogo',
      JSON.stringify(dasCaixas) === JSON.stringify(doCatalogo), { dasCaixas, doCatalogo });
    conferir('…e nenhum dos dois está escrito à mão na página',
      dasCaixas.length === doCatalogo.length && doCatalogo.length > 0, doCatalogo.length);
  }

  console.log('\nE. O CADASTRO NOVO GUARDA A FICHA — CPF, telefone, e-mail e habilidade');
  {
    /* O DEFEITO, na letra dela (19/11/2026): «Eu fui cadastrar o professor novo […] preenchi todos
     * os campos: o nome, o sobrenome, o CPF, o telefone, o e-mail, a habilidade e a senha. […]
     * Quando eu fui editar o Bombom, ele indica no cadastro, step um, que não tem CPF, telefone,
     * e-mail. E aí quando eu fui vincular um aluno, não disparou o e-mail porque não tem e-mail
     * vinculado a este professor Bombom.»
     *
     * A CAUSA: o `POST /professor` de CRIAÇÃO escrevia `{nome, slug, sal, hash}` e mais nada. Os
     * três campos eram recolhidos pelo formulário, viajavam no corpo e eram deitados fora. A ficha
     * e a habilidade só existiam se alguém voltasse a «Editar» e os escrevesse outra vez.
     *
     * O QUE ESTA SECÇÃO MEDE: o cadastro grava a ficha, e o que ele grava é o que a ficha DEVOLVE
     * — a ida e a volta, que é onde o defeito se via. Sem a correcção, as quatro primeiras
     * asserções falham (o `contato` não existe, e a ficha volta vazia). */
    const kv = kvFalso({
      'bastidores/breu/professores': JSON.stringify(PROFS),
      'bastidores/breu/dono': JSON.stringify({ nome: 'Brise Volet', slug: 'brise-volet' }),
    });
    const gh = githubFalso({
      'escola/breu/indice.json': JSON.stringify({ slug: 'breu', nome: 'Breu', professores: [] }),
    });
    const env = envCom(kv, gh);
    globalThis.fetch = gh.fetch;

    const novo = await pedir(env, '/api/bastidores/professor', 'POST', comSenha({
      nome: 'Bombom', sobrenome: 'Teste',
      cpf: '529.982.247-25', telefone: '(51) 99175-2662', email: 'bombom@exemplo.com',
      modalidade: 'danca-moderna', senha: 'segredo-do-bombom',
    }));
    conferir('o cadastro de um professor novo responde 201', novo.status === 201, novo.dados);
    conferir('…e a resposta diz que a ficha foi gravada, e com que modalidade',
      novo.dados.ficha && novo.dados.ficha.contato === true
        && novo.dados.ficha.modalidade === 'danca-moderna', novo.dados.ficha);
    const slug = String((novo.dados && novo.dados.slug) || '');
    const contato = JSON.parse(kv.bruto.get('professores/' + slug + '/contato') || 'null');
    conferir('…e o CPF, o telefone e o e-mail estão no contato do professor',
      Boolean(contato) && contato.cpf === '52998224725'
        && contato.telefone === '(51) 99175-2662' && contato.email === 'bombom@exemplo.com', contato);
    conferir('…e a habilidade foi para o perfil, no repositório',
      /danca-moderna/.test(gh.ficheiros.get('professores/' + slug + '/perfil.json') || ''),
      gh.ficheiros.get('professores/' + slug + '/perfil.json'));

    /* A IDA E A VOLTA — é o gesto dela: cadastrar, sair, abrir o «Editar». */
    const ficha = await pedir(env, '/api/bastidores/ficha-do-professor', 'POST', comSenha({ professor: slug }));
    conferir('ao abrir o «Editar», a ficha traz o CPF, o telefone e o e-mail que se escreveu',
      ficha.dados.cpf === '52998224725' && ficha.dados.telefone === '(51) 99175-2662'
        && ficha.dados.email === 'bombom@exemplo.com', ficha.dados);
    conferir('…e a modalidade, que é o que o e-mail do vínculo da aluna usa',
      ficha.dados.modalidade === 'danca-moderna', ficha.dados.modalidade);

    /* A RECUSA É ANTES DA ESCRITA: um CPF inválido não deixa um professor na lista sem ficha. */
    const antesDaRecusa = JSON.parse(kv.bruto.get('bastidores/breu/professores')).length;
    const recusado = await pedir(env, '/api/bastidores/professor', 'POST', comSenha({
      nome: 'Sem', sobrenome: 'Cpf', cpf: '111.111.111-11', modalidade: 'danca-moderna', senha: 'x',
    }));
    conferir('um CPF inválido recusa o cadastro', recusado.status === 400, recusado.dados);
    conferir('…e nenhum professor entra na lista por causa disso',
      JSON.parse(kv.bruto.get('bastidores/breu/professores')).length === antesDaRecusa,
      JSON.parse(kv.bruto.get('bastidores/breu/professores')).map((p) => p.nome));

    globalThis.fetch = fetchDeVerdade;
  }

  console.log('\nF. O rótulo da ficha: «Editar» enquanto é livre, «Derivar» quando já está em turma');
  {
    /* A REGRA (18/11/2026). «O professor já está vinculado a uma turma. Então lá é derivar, não é
     * editar.» É a mesma leitura que a Turma faz, e o rótulo tem de a seguir — senão a lista diz
     * «Editar» sobre quem já não é um registo solto.
     *
     * O GESTO NÃO MUDA: a classe continua `editar`, e é ela que o ouvinte delegado procura. Por
     * isso se mede o RÓTULO (o texto) e a presença do atributo que o clique usa — não a classe
     * sozinha, que passaria mesmo com o rótulo errado. */
    const curs = [{
      id: 'ana-diag-bale-classico-rosa', professor: 'Ana Diag', modalidade: 'bale-classico',
      turmas: ['Rosa'], alunas: ['abreu'], criadaEm: '2026-11-18',
    }];
    const html = bastidores.paginaProducao('breu', {}, PROFS, ['abreu'], 'Brise Volet', 'brise-volet',
      [], [], {}, curs, [], [], USOS_VAZIOS(), null, null, [], new Set());
    const linha = (nome) => {
      const m = new RegExp('<button class="editar[^>]*data-alvo="' + nome + '"[\\s\\S]{0,400}?<\\/button>')
        .exec(html);
      return m ? m[0] : '';
    };
    conferir('o professor que está numa turma diz «Derivar»',
      />Derivar<\/button>$/.test(linha('Ana Diag')) && /class="editar/.test(linha('Ana Diag')),
      linha('Ana Diag').slice(0, 120));
    conferir('…e o que está livre continua a dizer «Editar»',
      />Editar<\/button>$/.test(linha('Brise Volet')), linha('Brise Volet').slice(0, 120));
    conferir('…e o «Derivar» abre a MESMA ficha — leva o slug, como o «Editar»',
      /data-slug="ana-diag"/.test(linha('Ana Diag')));
    conferir('…e o título diz que é a mesma ficha, corrigida no lugar',
      /abre o mesmo formul/i.test(linha('Ana Diag')), linha('Ana Diag').slice(0, 200));
  }

  console.log('\nG. As abas «Habilitações» e «Desligamento» fecham enquanto há um professor a meio');
  {
    /* O PEDIDO (19/11/2026): «Enquanto eu faço o cadastro e navego pelos steps, cadastro e rubrica,
     * até que eu conclua isso, o habilitação e o desligamento devem ficar desligados, tá? Não podem
     * ser acessados. Eles só vão ser acessados essas duas abas quando eu não estiver num processo de
     * criar um novo professor ou de editar um novo professor.»
     *
     * E A RAZÃO, na letra dela: a modalidade nasce no CADASTRO; a aba das Habilitações é o outro
     * gesto — «quando eu quero incluir mais de uma modalidade para o professor ou apenas visualizar
     * as modalidades dele». Sair do cadastro a meio deixaria metade do trabalho numa aba e metade na
     * outra.
     *
     * O QUE SE MEDE: os quatro sinais que valem «em processo» (o modo de edição, o rascunho do
     * «Avançar», o passo da régua e o nome escrito), um a um — e a volta ao normal quando o
     * «Cancelar» limpa os quatro. */
    const { JSDOM, VirtualConsole } = require('jsdom');
    const html = pagina(PROFS);
    const vc = new VirtualConsole();
    const erros = [];
    vc.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    const dom = new JSDOM(html, {
      runScripts: 'dangerously', url: 'https://breu.padd.com.br/bastidores/producao', virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        Object.defineProperty(w, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });
        w.scrollTo = () => {};
        w.fetch = () => Promise.resolve({
          status: 200, ok: true,
          json: () => Promise.resolve({ ok: true, slug: 'ana-diag', nome: 'Ana Diag', cpf: '', telefone: '', email: '', modalidade: 'bale-classico' }),
        });
      },
    });
    await new Promise((r) => setTimeout(r, 350));
    const d = dom.window.document;
    const W = dom.window;
    d.getElementById('sec-professores').hidden = false;
    const aba = (k) => d.getElementById('pf-aba-' + k);
    const abertas = () => ['cadastro', 'habilitacoes', 'desligamento']
      .filter((k) => !d.getElementById('pf-painel-' + k).hidden);
    const travadas = () => ['habilitacoes', 'desligamento'].filter((k) => aba(k).disabled);
    const clicar = (el) => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true }));

    conferir('na carga, com o formulário vazio, as três abas abrem', travadas().length === 0, travadas());
    clicar(aba('habilitacoes'));
    conferir('…e a consulta às habilitações de quem já está na lista continua possível',
      JSON.stringify(abertas()) === JSON.stringify(['habilitacoes']), abertas());
    clicar(aba('cadastro'));

    /* O SINAL 4 — o nome escrito. */
    const nome = d.getElementById('pnome');
    nome.value = 'Bombom';
    nome.dispatchEvent(new W.Event('input', { bubbles: true }));
    conferir('escrever o nome fecha as duas abas', JSON.stringify(travadas()) === JSON.stringify(['habilitacoes', 'desligamento']), travadas());
    conferir('…e a aba travada diz PORQUE, e não fica muda',
      /conclua ou cancele/i.test(aba('habilitacoes').getAttribute('title') || ''), aba('habilitacoes').getAttribute('title'));
    conferir('…e o leitor de ecrã sabe que ela existe e está travada (aria-disabled)',
      aba('habilitacoes').getAttribute('aria-disabled') === 'true'
        && aba('desligamento').getAttribute('aria-disabled') === 'true', null);
    /* A TRAVA É DO MOTOR, e não só do atributo: o clique e o teclado passam os dois pelo `pode`. */
    clicar(aba('habilitacoes'));
    conferir('clicar a aba travada não abre o painel',
      JSON.stringify(abertas()) === JSON.stringify(['cadastro']), abertas());
    d.getElementById('pf-abas').dispatchEvent(new W.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    conferir('…e o teclado também não a alcança',
      JSON.stringify(abertas()) === JSON.stringify(['cadastro']), abertas());

    /* A ABA ABERTA QUE PERDE O DIREITO FECHA-SE: quem está no Desligamento e começa a cadastrar
     * não pode ficar a olhar para uma aba que já não se abre. */
    nome.value = '';
    nome.dispatchEvent(new W.Event('input', { bubbles: true }));
    clicar(aba('desligamento'));
    conferir('sem nada escrito, o Desligamento volta a abrir',
      JSON.stringify(abertas()) === JSON.stringify(['desligamento']), abertas());
    nome.value = 'Bombom';
    nome.dispatchEvent(new W.Event('input', { bubbles: true }));
    conferir('…e ao começar a escrever, a tela volta ao cadastro sozinha',
      JSON.stringify(abertas()) === JSON.stringify(['cadastro']), abertas());

    /* O SINAL 2 — o rascunho do «Avançar». O passo 1 compõe e vai para a régua. */
    clicar(d.getElementById('prof-enviar'));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o «Avançar» abre o passo da régua', !d.getElementById('passo-prof-rubrica').hidden, null);
    conferir('…e as duas abas continuam fechadas no passo 2', travadas().length === 2, travadas());

    /* E O «CANCELAR» DEVOLVE AS TRÊS — é o caminho de quem desiste a meio. */
    clicar(d.getElementById('rubr-cancelar'));
    await new Promise((r) => setTimeout(r, 120));
    conferir('o «Cancelar» limpa o processo e devolve as duas abas',
      travadas().length === 0, { travadas: travadas(), nome: d.getElementById('pnome').value });

    /* O SINAL 1 — a edição de quem já está na lista. É o caminho em que ela viu o defeito. */
    const ed = d.querySelector('#sec-professores button.editar');
    clicar(ed);
    await new Promise((r) => setTimeout(r, 200));
    conferir('abrir um professor em «Editar» fecha as duas abas', travadas().length === 2, travadas());
    conferir('…e a ficha dele continua na aba do cadastro', JSON.stringify(abertas()) === JSON.stringify(['cadastro']), abertas());
    clicar(d.getElementById('prof-cancelar'));
    await new Promise((r) => setTimeout(r, 120));
    conferir('…e o «Cancelar» da ficha devolve-as', travadas().length === 0, travadas());

    /* A FOLHA DO TELEMÓVEL TEM DE DIZER O MESMO — é a terceira porta das abas. */
    nome.value = 'Bombom';
    nome.dispatchEvent(new W.Event('input', { bubbles: true }));
    const item = d.querySelector('#pf-abas-menu [data-aba="habilitacoes"]');
    conferir('o item da folha do telemóvel também fica travado',
      Boolean(item) && item.disabled === true, item ? item.outerHTML.slice(0, 90) : null);
    conferir('os scripts da página não lançam', erros.length === 0, erros.slice(0, 1));
    dom.window.close();
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
