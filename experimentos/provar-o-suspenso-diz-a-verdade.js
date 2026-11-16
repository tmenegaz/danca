'use strict';

/*
 * provar-o-suspenso-diz-a-verdade.js — a escola suspensa deixa LER, e a tela diz porquê (16/11/2026).
 *
 * O QUE ELA DISSE, e é a frase que originou esta prova:
 *
 *   «Eu estou conseguindo navegar pela escola e quando eu coloco a senha nos bastidores dá erro de
 *   senha, diz que a senha não existe. E quando a escola está habilitada, aí a senha funciona. […]
 *   Eu entendo que ao invés de dizer que a senha está errada, é melhor dizer que a escola está
 *   desabilitada. Acesso negado, né? […] É melhor dizer a verdade do que mentir.»
 *
 * HAVIA DOIS DEFEITOS, e nenhum deles era a senha:
 *
 *   1. `/api/bastidores/validar-producao` — a PORTA — não estava na lista das rotas que só leem, e
 *      uma escola suspensa a recusava com 402. Ou seja: a suspensão fechava a única porta que dá
 *      acesso a tudo o que é «só ler». Contradiz a decisão dela, com todas as letras: «só tem
 *      acesso a ler as coisas que já foram desenvolvidas».
 *   2. As duas telas de senha traduziam QUALQUER falha na mesma frase. A dos Bastidores dizia
 *      «Senha não reconhecida.» para um 402 de estado; a da Área do Professor colapsava o 402 no
 *      veredicto 'errada'. A mentira era nossa, e mandava a pessoa conferir o que estava certo.
 *
 * O QUE SE MEDE, e por que cada um é preciso:
 *   · o 402 do estado existe, e o corpo dele DIZ que é suspensão (é o que as telas vão ler);
 *   · as três rotas de entrada — a porta, a senha do professor, o bilhete do ato — passam com a
 *     escola suspensa, e uma escrita não passa;
 *   · a tela dos Bastidores mostra o que o servidor diz, e não a frase fixa;
 *   · a tela da Área do Professor tem o quarto veredicto, com a mensagem certa;
 *   · os dois scripts compilam (a lição do mesmo dia: um script inválido não avisa).
 *
 *   node experimentos/provar-o-suspenso-diz-a-verdade.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const producao = require(path.join(RAIZ, 'motor/servidor/producao.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const listas = require(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/** Um KV de bolso que responde o estado comercial de UMA escola. */
function kvCom(estado, escola) {
  const dados = new Map();
  dados.set('bastidores/' + (escola || 'breu') + '/comercial',
    JSON.stringify({ estado, criadoEm: '2026-11-16T10:00:00.000Z', plano: 'basico' }));
  // O mapa, para o host resolver a escola sem `ESCOLA_SLUG`.
  dados.set('escolas/por-host', JSON.stringify({ 'breu.padd.com.br': 'breu' }));
  /* UM PROFESSOR COM SENHA, e em claro: é o caminho legado do registo, e é o que permite pedir
   * a rota da senha com uma senha que CONFERE — sem isso, a prova nunca chegaria ao veredicto
   * que interessa (senha certa, escola fechada) e mediria só a recusa da senha. */
  dados.set('bastidores/' + (escola || 'breu') + '/professores',
    JSON.stringify([{ nome: 'Brise Volet', senha: '123' }]));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })) }; },
    async put(k, v) { dados.set(k, String(v)); },
  };
}

const PAGINA = '<!doctype html><html><body><p>conteudo</p></body></html>';

/** Um `env` de escola, com os assets a responder o que quer que se peça. */
function envDa(estado) {
  return {
    ESCOLA_SLUG: 'breu',
    PADD_KV: kvCom(estado),
    ASSETS: {
      fetch: async () => new Response(PAGINA, {
        status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' },
      }),
    },
  };
}

(async () => {
  console.log('A. A escola suspensa: lê, e não escreve');
  {
    /* A PORTA TEM DE PASSAR. Sem isso, «só leitura» não é leitura nenhuma — ninguém entra para
     * ler. O 402 vem do estado comercial, e o corpo dele tem de dizer que é suspensão: é o que as
     * duas telas leem para não mentir. */
    const pedir = (caminho, metodo) => producao.fetch(
      new Request('https://breu.padd.com.br' + caminho, { method: metodo || 'GET' }),
      envDa('suspensa'));

    const entrada = await pedir('/api/bastidores/validar-producao', 'POST');
    const corpoEntrada = await entrada.json().catch(() => ({}));
    conferir('a PORTA (validar-producao) passa com a escola suspensa',
      entrada.status !== 402, { status: entrada.status, corpo: corpoEntrada });

    const senhaProfessor = await pedir('/api/bastidores/validar-senha', 'POST');
    conferir('…e a senha do professor também', senhaProfessor.status !== 402, senhaProfessor.status);

    const ato = await pedir('/api/bastidores/ato', 'POST');
    conferir('…e o bilhete do ato também', ato.status !== 402, ato.status);

    /* A LEITURA PASSA — é a decisão dela, e é o que os testes dela precisam. */
    const leitura = await pedir('/api/bastidores/alunas', 'GET');
    conferir('…e tudo o que é LER passa', leitura.status !== 402 && leitura.status !== 503, leitura.status);

    /* A ESCRITA NÃO PASSA, e diz porquê, em JSON, com a marca `suspensa`. */
    const escrita = await pedir('/api/bastidores/professor', 'POST');
    const corpoEscrita = await escrita.json().catch(() => ({}));
    conferir('…e uma ESCRITA é recusada', escrita.status === 402, escrita.status);
    conferir('…com a marca `suspensa` no corpo, que é o que as telas leem',
      corpoEscrita.suspensa === true, corpoEscrita);
    conferir('…e com a mensagem inteira, sem «senha» nem «não reconhecida»',
      /suspens/i.test(String(corpoEscrita.erro || '')) &&
      !/senha/i.test(String(corpoEscrita.erro || '')), corpoEscrita.erro);
  }

  console.log('\nB. A escola ativa não muda');
  {
    const pedir = (caminho, metodo) => producao.fetch(
      new Request('https://breu.padd.com.br' + caminho, { method: metodo || 'GET' }),
      envDa('ativa'));
    const escrita = await pedir('/api/bastidores/professor', 'POST');
    conferir('com a escola ativa, a escrita segue o caminho normal (não é 402)',
      escrita.status !== 402, escrita.status);
  }

  console.log('\nC. A tela dos Bastidores diz o que o servidor disse');
  {
    const html = bastidores.paginaProducao('breu', {}, [], [], null, null, null);
    conferir('a tela da Produção é servida', typeof html === 'string' && html.length > 1000, null);
    const blocos = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
      .map((m) => m[1]).filter((b) => b.trim());
    const maus = [];
    for (const bloco of blocos) {
      try { new Function(bloco); } catch (e) { maus.push(String((e && e.message) || e)); } // eslint-disable-line no-new-func
    }
    conferir('…e o script dela COMPILA', maus.length === 0, maus);
    conferir('…e usa o erro do servidor em vez de uma frase fixa',
      /\(d && d\.erro\) \? d\.erro/.test(html), null);

    /* E EXECUTADA, com o 402 que o servidor devolve. */
    const { JSDOM, VirtualConsole } = require('jsdom');
    const corrida = async (resposta) => {
      const paciente = new VirtualConsole();
      const erros = [];
      paciente.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
      const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        url: 'https://breu.padd.com.br/bastidores/producao',
        virtualConsole: paciente,
        beforeParse(win) {
          win.fetch = () => Promise.resolve({
            status: resposta.status || 200,
            ok: resposta.status ? resposta.status < 300 : true,
            json: () => Promise.resolve(resposta),
          });
        },
      });
      await new Promise((r) => setTimeout(r, 220));
      const d = dom.window.document;
      const campo = d.querySelector('input[type=password]');
      if (campo) campo.value = '123';
      const form = d.getElementById('form-senha');
      if (form) form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 220));
      const texto = ((d.getElementById('res-gate') || {}).textContent) || '';
      dom.window.close();
      return { texto, erros };
    };

    const suspensa = await corrida({
      status: 402, ok: false, suspensa: true,
      erro: 'O acesso desta escola está suspenso: é possível ler o que já foi criado, mas não criar nem editar. Fale com o Sistema Lastro para regularizar.',
    });
    conferir('com a escola suspensa, a tela diz que está SUSPENSA',
      /suspens/i.test(suspensa.texto), suspensa.texto);
    conferir('…e não mente dizendo «Senha não reconhecida»',
      !/senha não reconhecida/i.test(suspensa.texto), suspensa.texto);
    conferir('…e não lança', suspensa.erros.length === 0, suspensa.erros);

    const errada = await corrida({ ok: false, erro: 'senha da direção não reconhecida' });
    conferir('com a senha realmente errada, a tela diz o que o servidor disse',
      /senha da direção não reconhecida/i.test(errada.texto), errada.texto);
  }

  console.log('\nD. A Área do Professor tem quatro veredictos, e não três');
  {
    const html = listas.scriptDoPainel('anamnese', 'breu');
    conferir('o script do painel compila', (() => {
      const blocos = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      try { blocos.forEach((b) => new Function(b)); return true; } catch (e) { return false; } // eslint-disable-line no-new-func
    })(), null);
    conferir('…e conhece o veredicto «suspensa»', /SENHA === 'suspensa'/.test(html), null);
    conferir('…e o lê da resposta do servidor, não de uma suposição',
      /r\.dados\.suspensa/.test(html), null);
    conferir('…e diz que a senha NÃO é o problema',
      /acesso desta escola está suspenso/.test(html) && /ler o que já foi/.test(html), null);

    /* A ORDEM DAS PERGUNTAS: 'desligado' e 'suspensa' são factos; 'errada' é o que sobra. */
    conferir('…e a senha errada continua a ser dita quando é mesmo o caso',
      /SENHA === 'errada'/.test(html) && /não foi reconhecida/.test(html), null);
  }

  console.log('\nE. O CAMINHO INTEIRO: o que o SERVIDOR responde é o que a TELA mostra');
  {
    /* A LIÇÃO DESTA SECÇÃO (16/11/2026). A secção D afirmava o veredicto lendo o TEXTO do
     * script — e o script tinha o veredicto, sim, mas a resposta do servidor nunca trazia o facto
     * que ele lia. A prova passava e a tela continuava a mentir, porque a resposta que a secção D
     * usava era escrita à mão por mim. Uma resposta inventada na bancada mede a bancada.
     *
     * Aqui não há resposta escrita à mão: pede-se a rota DE VERDADE, através da porta (o
     * `producao.fetch`, com o estado comercial no KV), e é o JSON que voltar que se entrega à
     * tela. Se o servidor não disser que a escola está suspensa, o teste falha na primeira
     * asserção — antes de chegar à tela. */
    const env = envDa('suspensa');
    const pedir = (caminho, metodo, corpo) => producao.fetch(
      new Request('https://breu.padd.com.br' + caminho, {
        method: metodo || 'GET',
        ...(corpo ? { body: JSON.stringify(corpo), headers: { 'Content-Type': 'application/json' } } : {}),
      }), env);

    const lista = await (await pedir('/api/bastidores/professores')).json().catch(() => ({}));
    const professores = Array.isArray(lista.professores) ? lista.professores : [];
    conferir('o professor semeado aparece na lista que o servidor dá',
      professores.length >= 1, lista);
    const slug = professores.length ? professores[0].slug : '';

    const resposta = await pedir('/api/bastidores/validar-senha', 'POST', { senha: '123', professor: slug });
    const corpo = await resposta.json().catch(() => ({}));
    conferir('com a senha CERTA e a escola suspensa, a rota responde 200 (a senha não é o problema)',
      resposta.status === 200, resposta.status);
    conferir('…e diz que a senha confere', corpo.ok === true, corpo);
    conferir('…E diz que a escola está suspensa — o facto que faltava na resposta',
      corpo.suspensa === true, corpo);
    conferir('…com a frase da casa, a mesma da porta',
      /suspens/i.test(String(corpo.erro || '')), corpo.erro);

    /* E AGORA A TELA, com ESSA resposta — não com uma que eu escreva. */
    const { JSDOM, VirtualConsole } = require('jsdom');
    const html = listas.scriptDoPainel('anamnese', 'breu');
    const paciente = new VirtualConsole();
    const erros = [];
    paciente.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
    /* O PAINEL SÓ EXISTE DENTRO DO BLOCO DO ATO (o script desiste sem ele), e o veredicto da
     * senha só é alcançado quando o CONTEXTO ESTÁ INTEIRO: com o contexto faltando, a tela diz o
     * que falta — e é essa a ordem certa. Por isso o professor e a aluna são escolhidos aqui. */
    const dom = new JSDOM('<!doctype html><html><body>'
      + '<div id="bloco-ato">'
      + '<select data-ato="professor"><option value="">— escolher —</option></select>'
      + '<select data-ato="aluna"><option value="">— nenhuma —</option></select>'
      + '<select data-ato="ciclo"><option value="">— nenhum —</option></select>'
      + '<input type="password" data-ato="senha">'
      + '<span data-senha-status hidden>confere</span>'
      + '<button data-acao="nova" disabled>criar</button>'
      + '<p data-estado hidden></p><p data-resumo></p>'
      + '</div></body></html>', {
      runScripts: 'dangerously',
      url: 'https://breu.padd.com.br/anamnese/',
      virtualConsole: paciente,
      beforeParse(win) {
        win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
        /* O `localStorage` do jsdom é um getter: define-se, não se atribui. A memória do
         * preenchimento interrompido é dela, e aqui o que se mede é o veredicto da senha. */
        Object.defineProperty(win, 'localStorage', {
          configurable: true,
          value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
        });
        win.fetch = (url) => {
          const c = String(url);
          let d = { ok: true };
          if (c.indexOf('validar-senha') !== -1) d = corpo; // ← A RESPOSTA DO SERVIDOR
          else if (c.indexOf('professores') !== -1) d = { ok: true, professores: professores };
          else if (c.indexOf('/api/bastidores/alunas') !== -1) d = { ok: true, alunas: ['abreu'] };
          else if (c.indexOf('/api/bastidores/turmas') !== -1) d = { ok: true, turmas: [] };
          else if (c.indexOf('curadoria') !== -1 || c.indexOf('ciclos') !== -1) d = { ok: true, itens: [] };
          return Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve(d) });
        };
      },
    });
    await new Promise((r) => setTimeout(r, 60));
    /* O SCRIPT DO PAINEL É UMA FUNÇÃO, e é chamada como a página a chama: com o HTML dele. */
    const bloco = /<script[^>]*>([\s\S]*?)<\/script>/.exec(html);
    if (bloco) {
      try { dom.window.eval(bloco[1]); } catch (e) { erros.push('eval: ' + String((e && e.message) || e)); }
    }
    await new Promise((r) => setTimeout(r, 120));
    const d = dom.window.document;
    const escolher = d.querySelector('[data-ato="professor"]');
    if (escolher && escolher.options.length > 1) {
      escolher.value = escolher.options[1].value;
      escolher.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    }
    const aluna = d.querySelector('[data-ato="aluna"]');
    if (aluna && aluna.options.length > 1) {
      aluna.value = aluna.options[1].value;
      aluna.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    }
    const campo = d.querySelector('[data-ato="senha"]');
    if (campo) {
      campo.value = '123';
      campo.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      campo.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    }
    await new Promise((r) => setTimeout(r, 700));
    const estado = d.querySelector('[data-estado]');
    const texto = String((estado && estado.textContent) || '').replace(/\s+/g, ' ').trim();
    conferir('a tela do professor COMPILA e corre sem lançar', erros.length === 0, erros.slice(0, 1));
    conferir('com a resposta do servidor na mão, a tela diz que a escola está SUSPENSA',
      /suspens/i.test(texto), texto);
    conferir('…e NÃO culpa a senha (a senha está certa, e o servidor o disse)',
      !/senha do professor não foi reconhecida/i.test(texto), texto);
    dom.window.close();
  }

  console.log('');
  console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
