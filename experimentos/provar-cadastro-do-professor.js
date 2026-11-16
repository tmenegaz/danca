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
 *   C. a FICHA a preencher — nome e sobrenome divididos CERTOS, e os sete campos abertos, com a
 *      senha em branco e à vista;
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
    if (u.indexOf('/git/trees/') !== -1) {
      return { status: 200, json: async () => ({ tree: [], sha: 'arvore' }), text: async () => '' };
    }
    const caminho = decodeURIComponent(u.replace(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\//, '').split('?')[0]);
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (metodo === 'GET') {
      if (!mapa.has(caminho)) return { status: 404, json: async () => ({}), text: async () => '' };
      const conteudo = mapa.get(caminho);
      return {
        status: 200,
        json: async () => ({ content: Buffer.from(conteudo, 'utf8').toString('base64'), sha: 'sha-' + caminho }),
        text: async () => '',
      };
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      mapa.set(caminho, Buffer.from(String(corpo.content || ''), 'base64').toString('utf8'));
      return { status: 200, json: async () => ({ commit: { sha: 'novo' } }), text: async () => '' };
    }
    return { status: 405, json: async () => ({}), text: async () => '' };
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
    conferir('as três abas, pela ordem dela: cadastro, habilitações, desligamento',
      JSON.stringify(rotulos) === JSON.stringify([
        ['cadastro', 'Cadastro de professor'], ['habilitacoes', 'Habilitações'], ['desligamento', 'Desligamento'],
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
    conferir('o «Seções» do telemóvel existe, e a pílula diz qual folha abre',
      /id="pf-abas-folha"/.test(html) && /data-folha="pf-abas"/.test(html), null);
    conferir('a folha do telemóvel tem os três itens',
      (html.match(/class="menu-de-acoes-item" data-aba="(cadastro|habilitacoes|desligamento)"/g) || []).length === 3, null);
    /* AS PEÇAS DA CASA, e não desenho novo: a tira usa `.abas`/`.aba`, o painel `.aba-painel`. */
    conferir('as abas usam as peças da casa (`.abas`, `.aba`, `.aba-painel`)',
      /\.abas\{/.test(html) && /\.aba-painel\{/.test(html) && /class="aba"/.test(html), null);
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
            cpf: '021.500.629-17', telefone: '(51) 99999-0000', email: 'brise@exemplo.com',
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
    conferir('o CPF vem preenchido do servidor', campo('pcpf') === '021.500.629-17', campo('pcpf'));
    conferir('o telefone também', campo('ptelefone') === '(51) 99999-0000', campo('ptelefone'));
    conferir('o e-mail também', campo('pemail') === 'brise@exemplo.com', campo('pemail'));
    conferir('a habilidade vem a que ele declara', campo('pmodalidade') === 'bale-classico', campo('pmodalidade'));
    /* «PODE EDITAR TUDO, NÃO TEM CAMPO DESABILITADO» — nesta página, `disabled` em campo é o
     * defeito, não o desenho. */
    const campos = ['pnome', 'psobrenome', 'pcpf', 'ptelefone', 'pemail', 'pmodalidade', 'psenha'];
    const apagados = campos.filter((id) => {
      const el = d.getElementById(id);
      return !el || el.disabled || el.readOnly;
    });
    conferir('nenhum dos sete campos está desabilitado ou só-de-leitura', apagados.length === 0, apagados);
    conferir('a senha está à vista, e em branco (em branco mantém a que ele usa)',
      !d.getElementById('prof-senha').hidden && campo('psenha') === '', null);
    conferir('o modo é «editar» e o alvo é o slug', campo('prof-modo') === 'editar' && campo('prof-alvo') === 'brise-volet',
      { modo: campo('prof-modo'), alvo: campo('prof-alvo') });
    conferir('o botão diz o que vai fazer', /Gravar as mudanças/.test(d.getElementById('prof-enviar').textContent), null);
    dom.window.close();
  }

  console.log('\nD. O servidor: a ficha (GET) e a gravação (POST)');
  const fetchDeVerdade = globalThis.fetch;
  {
    const kv = kvFalso({
      'bastidores/breu/professores': JSON.stringify(PROFS),
      'bastidores/breu/dono': JSON.stringify({ nome: 'Brise Volet', slug: 'brise-volet' }),
      'bastidores/breu/cadastro': JSON.stringify({
        escolaNome: 'Breu', cpf: '021.500.629-17', professorEmail: 'brise@exemplo.com',
        professorTelefone: '(51) 99999-0000',
      }),
      'professores/ana-diag/contato': JSON.stringify({ cpf: '111.444.777-35', email: 'ana@exemplo.com' }),
      /* O CONTATO DO PRINCIPAL — é ele que a unicidade do CPF encontra. O CPF dele também está no
       * cadastro da escola; o `contato` é o documento que a varredura lê, e é o que a primeira
       * gravação da ficha escreve. Semear os dois é o estado de uma escola já corrigida uma vez. */
      'professores/brise-volet/contato': JSON.stringify({ cpf: '021.500.629-17', email: 'brise@exemplo.com' }),
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

    const fichaDono = await pedir(env, '/api/bastidores/professor?slug=brise-volet');
    conferir('a ficha do principal responde 200', fichaDono.status === 200, fichaDono.status);
    conferir('…e traz o CPF do cadastro da escola quando ele não tem contato próprio',
      fichaDono.dados.cpf === '021.500.629-17', fichaDono.dados);
    conferir('…e a habilidade, do perfil no repositório',
      fichaDono.dados.modalidade === 'bale-classico', fichaDono.dados.modalidade);

    const fichaAna = await pedir(env, '/api/bastidores/professor?slug=ana-diag');
    conferir('a ficha de um professor cadastrado traz o contato dele',
      fichaAna.dados.cpf === '111.444.777-35' && fichaAna.dados.email === 'ana@exemplo.com', fichaAna.dados);

    const inexistente = await pedir(env, '/api/bastidores/professor?slug=ninguem');
    conferir('professor que não é desta escola responde 404', inexistente.status === 404, inexistente.status);

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
      editar: 'ana-diag', nome: 'Ana', sobrenome: 'Diagnóstico', cpf: '021.500.629-17',
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

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
