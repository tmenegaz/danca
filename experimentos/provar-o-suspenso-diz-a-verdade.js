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

  console.log('');
  console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
