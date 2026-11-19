'use strict';

/**
 * provar-gravar-e-gravar.js — UM RÓTULO PARA O GESTO, E O FIM DO GESTO EM TODAS AS SECÇÕES
 * (19/11/2026).
 *
 * O PEDIDO, nas palavras dela:
 *
 *   «quando eu for gravar é só gravar, não precisa inventar tentando justificar o que é que eu estou
 *    gravando ou explicar para o usuário o que é que está gravando. Gravar é gravar. Não importa se
 *    eu estou derivando, editando ou criando um novo, é sempre gravar. Então você vai varrer todos os
 *    botões e vai ver esses nomes e vai tudo se chamar gravar. E aí evita redundância de código, tá?
 *    Faz de um jeito bonitinho, com uma arquitetura bonita, boa, prática, e a gente mexe só em um
 *    lugar, porque afinal de contas gravar é gravar.»
 *
 * E, no mesmo relato, três secções que não fechavam o gesto:
 *
 *   «Na Audição não deu certo o que eu te pedi. […] Ele grava o que tem que gravar, mostra a
 *    mensagem no formulário ainda, não é no formulário, é na tela que tem que mostrar a mensagem, e
 *    aí ele não colapsa.»
 *   «No dicionário, quando eu tento criar um novo, eu preenchi todos os campos […] Ele diz assim:
 *    erro, informe o termo.»
 *   «em professores […] Não limpou o formulário do cadastro. Ficou na rubrica dois, tudo preenchido.»
 *
 * O QUE ESTA PROVA MEDE — e cada alínea reprova sem a correcção:
 *
 *   A. OS RÓTULOS. Os oito botões que gravam um formulário dizem «Gravar», e cada um está dentro da
 *      sua secção. Antes eram oito frases — «Criar dicionário», «Gravar verbete», «Cadastrar
 *      aluna», «Gravar ajuste», «Atribuir turma», «Criar elenco», «Gravar cadastrar professor»,
 *      «Gravar as habilitações» —, e cinco delas eram reescritas pelo cliente conforme o modo.
 *   B. NENHUMA REESCRITA. O script servido não volta a escrever o texto de nenhum desses botões. A
 *      asserção é negativa de propósito: é a reescrita que reabre a divergência.
 *   C. O DICIONÁRIO CRIA. `POST /api/bastidores/termo` com o corpo que o FORMULÁRIO manda (`nome`,
 *      e não `termo`) grava. Era esta a causa do «informe o termo» com os cinco campos preenchidos
 *      — e sem nome nenhum continua a recusar (a guarda não foi apagada).
 *   D. A AUDIÇÃO FECHA O GESTO, a correr em jsdom: aviso na pilha do canto, formulário limpo,
 *      secção recolhida, a cadeia FORA do formulário (na coluna da lista), e nenhuma excepção.
 *   E. O PROFESSOR LIMPA OS DOIS PASSOS. O fim do gesto é `sairDaEdicaoDoProfessor` — o mesmo do
 *      «Cancelar» —, e não só o esquecimento do rascunho.
 *   F. A ALUNA LIVRE VOLTA A PODER SER CORRIGIDA. A guarda que recusava a correcção por a anamnese
 *      já estar feita saiu; a que fica é a da casa — «livre edita-se, vinculada deriva-se».
 *
 *   node experimentos/provar-gravar-e-gravar.js
 */

const path = require('path');
const fs = require('fs');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** A página da Produção, com o mínimo que ela exige (a assinatura é posicional). */
function aPagina() {
  return bastidores.paginaProducao('breu', { escola: 'breu' },
    [{ nome: 'Ana Diag', slug: 'ana-diag', rubrica: { nome: 'Padrão', niveis: ['Ótimo', 'Bom'] } }],
    ['abreu'], 'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
    { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
    { modo: 'clara', paleta: 'bordo' }, null, [], new Set(),
    { ok: true, contrato: { plano: 'avancado', capacidade: {} } });
}

/** O script que a página emite — o que o navegador corre, e não o comentário que o explica. */
function oScript(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).join('\n');
}

async function principal() {
  /* =========================================================================================== */
  console.log('\nA. Os oito botões que gravam dizem «Gravar» — e cada um na sua secção');

  const html = aPagina();

  /* OS OITO SÃO OS QUE GRAVAM UM FORMULÁRIO. Não entram os que fazem outra coisa — «Desligar o
   * professor» desliga, «Mover a aluna» move —, porque esses dizem o gesto que fazem e é isso que
   * se quer. A lista é explícita para a prova não passar a medir menos quando uma secção mudar de
   * id em silêncio. */
  const BOTOES = [
    ['sec-professores', 'rubr-gravar'],
    ['sec-professores', 'hab-enviar'],
    ['sec-alunas', 'aluna-gravar'],
    ['sec-turmas', 'vinc-gravar'],
    ['sec-dicionario', 'dic-gravar'],
    ['sec-verbetes', 'vb-gravar'],
    ['sec-curadorias', 'cu-enviar'],
    ['sec-corpo', 'lb-enviar'],
  ];
  for (const [secao, id] of BOTOES) {
    const achado = html.match(new RegExp('<button[^>]*id="' + id + '"[^>]*>([^<]*)<'));
    provar('«' + id + '» diz «Gravar»', Boolean(achado) && achado[1].trim() === 'Gravar',
      achado && achado[1].trim());
    /* E CADA UM ESTÁ NA SUA SECÇÃO — um botão com o rótulo certo na secção errada continuaria a
     * ser o defeito. A conta é de texto: o índice da secção vem antes do índice do botão. */
    const iSecao = html.indexOf('id="' + secao + '"');
    const iBotao = html.indexOf('id="' + id + '"');
    provar('…e «' + id + '» está dentro de «' + secao + '»',
      iSecao !== -1 && iBotao > iSecao, { secao: iSecao, botao: iBotao });
  }

  /* O SÍTIO É UM SÓ. Oito botões, oito rótulos — se aparecer um nono «Gravar» na marcação, é um
   * botão novo que ninguém declarou aqui: a prova avisa em vez de o deixar passar. */
  const ocorrencias = (html.match(/>Gravar</g) || []).length;
  provar('o rótulo aparece exactamente oito vezes na marcação', ocorrencias === 8, ocorrencias);

  /* =========================================================================================== */
  console.log('\nB. O script servido não reescreve o rótulo de nenhum deles');

  const script = oScript(html);

  /* A ASSERÇÃO É NEGATIVA, e é a que tem dentes: enquanto um `textContent = …` decidir o texto do
   * botão, o rótulo volta a divergir na primeira secção que precisar de um caso novo. As frases
   * mortas ficam listadas uma a uma para que o defeito seja nomeado quando voltar. */
  const MORTAS = ['Criar dicionário', 'Gravar alterações', 'Gravar verbete', 'Cadastrar aluna',
    'Gravar a correção', 'Gravar a anamnese nova', 'Gravar ajuste', 'Gravar turma', 'Gravar elenco',
    'Criar elenco', 'Atribuir turma', 'Gravar cadastrar professor', 'Gravar as habilitações',
    'Gravar sala'];
  for (const frase of MORTAS) {
    provar('«' + frase + '» não é escrito pelo script',
      script.indexOf(frase) === -1, script.indexOf(frase));
  }

  /* E O QUE SOBRA SÃO OS `title`, que dizem o que vai acontecer (criar ou regravar) sem mexer no
   * rótulo — é a distinção que ela não pediu para apagar: o botão diz o gesto, o `title` diz o
   * efeito. Se a asserção de cima passasse por alguém ter apagado a distinção toda, esta falha. */
  provar('o «title» do elenco continua a distinguir criar de regravar',
    /Regravar este elenco/.test(script), null);

  /* =========================================================================================== */
  console.log('\nC. O Dicionário cria com o corpo que o FORMULÁRIO manda');

  /* A ROTA, E NÃO A FUNÇÃO. O defeito foi medido na tela («preenchi todos os campos […] erro,
   * informe o termo»), e a tela manda `nome`; só o `POST` lia `termo`. Medir a rota é medir o que
   * a tela usa. O repositório é fingido — ver `provar-dicionario` §I, de onde vem esta forma. */
  const vocabulario = require(path.join(raiz, 'biblioteca/modalidades/bale-classico/vocabulario.json'));
  const estado = { termos: JSON.parse(JSON.stringify(vocabulario)) };

  const f = async (url, opcoes) => {
    const doVocabulario = /\/contents\/biblioteca\/modalidades\/[^/]+\/vocabulario\.json/.test(String(url));
    if (!opcoes || !opcoes.method || opcoes.method === 'GET') {
      if (doVocabulario) {
        return { ok: true, status: 200, json: async () => ({
          sha: 'abc', content: Buffer.from(JSON.stringify(estado.termos), 'utf8').toString('base64'),
        }) };
      }
      if (/git\/trees/.test(String(url))) {
        return { ok: true, status: 200, json: async () => ({ tree: [], truncated: false }) };
      }
      return { status: 404, json: async () => ({ message: 'Not Found' }), text: async () => '' };
    }
    if (!doVocabulario) {
      return { status: 200, json: async () => ({ content: { sha: 'indice' }, commit: { sha: 'indice' } }) };
    }
    const corpo = JSON.parse(opcoes.body || '{}');
    estado.termos = JSON.parse(Buffer.from(corpo.content, 'base64').toString('utf8'));
    return { status: 200, json: async () => ({ commit: { sha: 'def' } }) };
  };

  const mem = new Map();
  const env = {
    ESCOLA_SLUG: 'breu', SENHA_ADMIN: 's', GITHUB_TOKEN: 'x',
    PADD_KV: {
      async get(k) { return mem.has(k) ? mem.get(k) : null; },
      async put(k, v) { mem.set(k, String(v)); },
      async delete(k) { mem.delete(k); },
      async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
    },
  };

  async function chamar(metodo, corpo) {
    const anterior = globalThis.fetch;
    globalThis.fetch = f;
    try {
      const resposta = await bastidores.fetch(new Request(
        'https://escola.tmenegaz77.workers.dev/api/bastidores/termo',
        { method: metodo, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({ senhaDirecao: env.SENHA_ADMIN }, corpo)) }), env);
      return resposta && resposta.json ? await resposta.json() : resposta;
    } finally { globalThis.fetch = anterior; }
  }

  const criado = await chamar('POST', {
    /* O CORPO É O DO FORMULÁRIO, campo a campo: `nome`, `categoria`, `tradicao`,
     * `complexidade`, `descricao`. Era este corpo que a rota recusava. */
    nome: 'Cambré', categoria: 'passo', tradicao: 'francesa', complexidade: 'simples',
    descricao: 'inclinação do tronco com apoio num pé',
  });
  provar('o termo novo é criado com o corpo do formulário (`nome`)', criado && criado.ok === true, criado);
  provar('…e o servidor não responde «informe o termo»',
    String((criado && criado.erro) || '').indexOf('informe o termo') === -1, criado && criado.erro);
  provar('…e o termo fica no vocabulário com os campos que se preencheram',
    estado.termos.some((t) => t && t.termo === 'Cambré' && t.categoria === 'passo'
      && t.tradicao === 'francesa' && t.complexidade === 'simples'),
    estado.termos.filter((t) => t && t.termo === 'Cambré'));

  const semNome = await chamar('POST', { categoria: 'passo', tradicao: 'francesa' });
  provar('…e sem nome nenhum continua a recusar — a guarda não foi apagada',
    semNome && semNome.ok === false && /informe o termo/.test(String(semNome.erro)), semNome);

  /* =========================================================================================== */
  console.log('\nD. A Audição: aviso no canto, formulário limpo, secção recolhida');

  const { JSDOM, VirtualConsole } = require('jsdom');
  const vc = new VirtualConsole();
  const erros = [];
  vc.on('jsdomError', (e) => { erros.push(String((e && e.message) || e)); });
  vc.on('error', () => {});

  const dom = new JSDOM(aPagina().replace(/<script src="[^"]*"><\/script>/g, ''), {
    runScripts: 'dangerously', url: 'https://breu.workers.dev/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => true;
      w.alert = () => {};
      w.scrollTo = () => {};
      /* O RECOLHIMENTO VIVE EM `sessionStorage` — sem ele o `cancelarOFormularioDe` atira, e a
       * prova mediria uma excepção em vez do comportamento. */
      const memoria = new Map();
      Object.defineProperty(w, 'sessionStorage', {
        configurable: true,
        value: {
          getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
          setItem: (k, v) => memoria.set(k, String(v)),
          removeItem: (k) => memoria.delete(k),
          clear: () => memoria.clear(),
        },
      });
      w.fetch = (u, o) => {
        const url = String(u);
        const metodo = (o && o.method) || 'GET';
        const responde = (corpo) => Promise.resolve({
          ok: true, status: 200,
          json: () => Promise.resolve(corpo), text: () => Promise.resolve(''),
        });
        if (url.indexOf('/api/bastidores/linha-de-base') !== -1 && metodo === 'POST') {
          return responde({ ok: true, linha: { id: 'elenco-1', nome: 'Nível 1', professor: 'ana-diag' },
            disparos: [], aviso: '', cadeia: { executada: true, ok: true, faltam: [] } });
        }
        if (url.indexOf('/api/bastidores/revalidacao') !== -1) return responde({ ok: true, pendentes: [] });
        if (url.indexOf('/api/bastidores/linhas-de-base') !== -1) return responde({ ok: true, linhas: [] });
        if (url.indexOf('/api/bastidores/alunas') !== -1) return responde({ ok: true, alunas: [] });
        if (url.indexOf('/api/bastidores/campos') !== -1) return responde({ ok: true, campos: [] });
        return responde({ ok: true });
      };
    },
  });
  const w = dom.window;
  const d = w.document;
  const esperar = (ms) => new Promise((r) => w.setTimeout(r, ms));
  await esperar(600);

  const secao = d.getElementById('sec-corpo');
  const form = d.getElementById('form-linha-base');
  provar('a secção da Audição existe', Boolean(secao && form), null);

  /* O GESTO. Ele exige um elenco aberto (`#lb-modo` com id); a prova compõe esse estado e carrega
   * no botão, que é o caminho de quem usa a página. */
  d.getElementById('lb-modo').value = 'elenco-1';
  d.getElementById('lb-nome').value = 'Nível 1 — mobilidade e pés';
  w.definirSecaoRecolhida('sec-corpo', false);
  provar('…e o formulário está ABERTO antes do gesto — senão o recolher não se mede',
    secao.getAttribute('data-recolhido') === 'nao', secao.getAttribute('data-recolhido'));

  d.getElementById('lb-enviar').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await esperar(900);

  const avisos = d.getElementById('avisos');
  provar('o retorno do gesto vai para a pilha do canto, e não para o formulário',
    Boolean(avisos) && /elenco concluído/i.test(avisos.textContent),
    avisos && avisos.textContent.trim().slice(0, 90));
  provar('…e o formulário do elenco fica LIMPO',
    d.getElementById('lb-modo').value === '' && d.getElementById('lb-nome').value === '',
    { modo: d.getElementById('lb-modo').value, nome: d.getElementById('lb-nome').value });
  provar('…e a secção fica RECOLHIDA — «e aí ele não colapsa» era a queixa',
    secao.getAttribute('data-recolhido') === 'sim', secao.getAttribute('data-recolhido'));
  const resDoForm = d.querySelector('[data-res="linha-base"]');
  provar('…e o recado NÃO ficou escrito dentro do formulário recolhido',
    !/elenco concluído/i.test(resDoForm.textContent), resDoForm.textContent.trim().slice(0, 80));

  /* A CADEIA SAI DO FORMULÁRIO — o sítio dela é a coluna da lista, que não se recolhe. */
  const cadeia = d.getElementById('lb-cadeia');
  provar('a cadeia tem um sítio próprio, FORA do formulário',
    Boolean(cadeia) && !form.contains(cadeia), Boolean(cadeia));
  provar('…e o sítio está na coluna da lista, ao lado dos elencos',
    Boolean(cadeia && cadeia.closest('.col-lista')), null);

  /* E NENHUMA EXCEPÇÃO. Uma asserção que só medisse o DOM passaria com o script a atirar no fim —
   * foi assim que «limparOVerbete is not defined» atravessou uma sessão inteira. */
  provar('…e o caminho do gesto não atirou nenhuma excepção', erros.length === 0, erros.slice(0, 2));

  /* =========================================================================================== */
  console.log('\nE. O professor limpa os DOIS passos depois de gravar');

  /* «Não limpou o formulário do cadastro. Ficou na rubrica dois, tudo preenchido, e limpou apenas o
   * cadastro, que é o step um, né? No step dois ficou tudo preenchido. Não pode, tem que limpar
   * tudo.» O que se mede é o SÍTIO: o fim do gesto tem de ser o mesmo do «Cancelar» — um gesto só,
   * e não um esquecimento à mão de cada campo. */
  /* O SÍTIO DO GESTO, e não só a existência da função — ela já existia, e era chamada pelo
   * «Cancelar». O que mudou é que a GRAVAÇÃO passou a chamá-la: mede-se o bloco da gravação da
   * régua, e é lá que a asserção tem dentes. */
  const iGravaRegua = script.indexOf('rubrica-do-professor');
  const blocoDaRegua = iGravaRegua === -1 ? '' : script.slice(iGravaRegua, iGravaRegua + 900);
  provar('a gravação do professor termina no «sair da edição», e não só em esquecer o rascunho',
    /sairDaEdicaoDoProfessor\(\)/.test(blocoDaRegua), blocoDaRegua.slice(0, 120));
  provar('…e essa função limpa a régua, o foco, o passo e o rascunho',
    /pintarEditorDaRubrica\(\[\]\)/.test(script)
      && /producao:professor-em-foco/.test(script)
      && /producao:professor-passo/.test(script)
      && /producao:professor-rascunho/.test(script), null);

  /* =========================================================================================== */
  console.log('\nF. A aluna livre volta a poder ser corrigida');

  /* A GUARDA QUE SAIU. Ela foi escrita contra um perigo real (pôr o que um professor observou sob o
   * nome de outro), mas cobrava-o de quem está LIVRE — que não alimenta plano nenhum. A regra que
   * fica é a da casa, e é a que a rota agora aplica. Mede-se a AUSÊNCIA da frase, porque era ela
   * que a tela mostrava. */
  const fonte = fs.readFileSync(path.join(raiz, 'motor/servidor/bastidores.js'), 'utf8');
  provar('a recusa por «a anamnese já foi feita» saiu da rota da matrícula',
    fonte.indexOf('já foi feita pelo professor — corrigir o vínculo') === -1, null);
  /* E A OUTRA FICA. Sem ela, a correcção de uma aluna em turma com plano partiria a cadeia. */
  provar('…e a recusa por «está numa turma com plano de ensino» continua, com a palavra «Derivar»',
    /já está numa turma que tem plano de ensino/.test(fonte), null);

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o gesto de gravar tem um rótulo só («Gravar», escrito '
      + 'uma vez no servidor), o script não o reescreve, o Dicionário aceita o corpo que o '
      + 'formulário manda, a Audição fecha o gesto como as outras secções — aviso no canto, '
      + 'formulário limpo, secção recolhida, a cadeia na coluna da lista —, e o professor limpa os '
      + 'dois passos.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((e) => {
  console.error('a prova interrompeu-se: ' + (e && e.stack ? e.stack : e));
  process.exit(1);
});
