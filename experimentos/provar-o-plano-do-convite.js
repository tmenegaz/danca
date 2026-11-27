#!/usr/bin/env node
'use strict';

/*
 * provar-o-plano-do-convite.js — A CAPACIDADE DO PLANO CHEGA À PÁGINA (27/11/2026).
 *
 * O QUE ELA RELATOU, e é a razão desta prova existir:
 *
 *   «Ontem eu tinha o plano básico e aí expurguei a escola. E agora eu recrio a escola com o plano
 *    básico, não faz sentido dizer que o plano não cobre o que a escola tinha. […] A mensagem diz
 *    que o retrato tem um professor e uma aluna, e vão perder-se um professor e uma aluna.»
 *
 * A MENSAGEM QUE ELA VIU, e que era verdade sobre o que a página tinha lido:
 *
 *   «Este plano inclui 0 professores e 0 alunas. O retrato desta escola tem 1 professor e 1 aluna:
 *    vão perder-se 1 professor e 1 aluna.»
 *
 * A CAUSA, medida. A 17/11/2026 o `catalogoDaPagina` mudou de forma: a FRANQUIA (`aulas`) é o que a
 * página apresenta como limite, e `professores`/`alunos` foram para dentro de `referencia` — «para a
 * controladoria, e a página não os apresenta como limite» (§ADITIVO §2). A leitura que emite
 * `data-professores`/`data-alunos` continuou a pedir `p.professores` no TOPO, recebeu `undefined`, e
 * `Number(undefined) || 0` deu **zero**. Com capacidade zero, qualquer retrato de uma escola real
 * «não cabe» — e a página pedia confirmação para perder o que não se perde. O SERVIDOR estava certo
 * o tempo todo (`provar-recriar-escola` mede o 409 com os números certos); era a página que mentia.
 *
 * O QUE ESTA PROVA MEDE, e são quatro metades de naturezas diferentes:
 *
 *   A. A DERIVA — o atributo emitido é o do catálogo, para os TRÊS planos. É a asserção que teria
 *      apanhado o defeito no dia em que ele nasceu, e é a que impede a repetição: um campo que se
 *      muda de sítio e um leitor que não se actualiza.
 *   B. O CASO DELA — retrato 1 professor + 1 aluna, plano básico (1/10): NÃO há pergunta, e o
 *      pedido PARTE. É o gesto, e não o desenho: o aviso nasce no clique, não na troca de plano.
 *   C. O CONTROLO — retrato 5 professores + 20 alunas, plano básico: a pergunta aparece, com os
 *      números certos, e o pedido NÃO parte. Sem esta metade, a correcção seria «desligar o aviso».
 *   D. AS DUAS DEFESAS — (1) capacidade ilegível não vira «zero»: não se afirma uma perda que não
 *      se sabe contar, e o servidor decide; (2) a recusa do SERVIDOR (`perdidos`) mostra a caixa com
 *      a frase dele, e o «Sim» volta a poder mandar o pedido — antes disto, a resposta certa do
 *      servidor era um beco sem saída.
 *
 * SEM REDE: o `fetch` da página é interceptado. O catálogo é o de verdade
 * (`motor/nucleo/comercial.js`), excepto na secção A-bis, onde se injeta um catálogo sintético para
 * medir as DUAS formas — a de hoje (`referencia`) e a antiga (achatada).
 *
 *   node experimentos/provar-o-plano-do-convite.js
 */

const path = require('path');
const { JSDOM } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));

let provas = 0;
let falhas = 0;
const provar = (titulo, condicao, detalhe) => {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
};

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** O retrato com N professores e M alunas — a forma que o convite guarda e a página recebe. */
const retratoDe = (nP, nA) => ({
  documentos: nP + nA,
  professores: Array.from({ length: nP }, (_, i) => 'prof-' + i),
  alunos: Array.from({ length: nA }, (_, i) => 'aluna-' + i),
});

/** Monta a página do convite com um catálogo, e um `fetch` que conta os pedidos. */
function pagina({ retrato, catalogo, plano } = {}) {
  const html = painel.paginaDoConvite({
    escola: 'breu', nome: 'Breu', token: 'abc-123',
    catalogo: catalogo === undefined ? comercial.catalogoDaPagina() : catalogo,
    pix: null, estado: { ok: true }, retrato, identidade: null,
  });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://lastro.padd.com.br/recriar/abc-123',
  });
  const w = dom.window;
  const d = w.document;
  const visto = { pedidos: [], corpo: null };
  w.fetch = async (u, o) => {
    visto.pedidos.push(String(u));
    try { visto.corpo = JSON.parse((o && o.body) || 'null'); } catch (e) { visto.corpo = null; }
    return visto.resposta
      ? visto.resposta()
      : { ok: true, status: 201, json: async () => ({ ok: true, escola: 'breu', nome: 'Breu', url: 'https://breu.padd.com.br' }) };
  };
  const sel = d.getElementById('convite-plano');
  if (sel && plano) sel.value = plano;
  const campo = d.getElementById('convite-senha-escola');
  if (campo) campo.value = '2805';
  const caixa = d.getElementById('convite-perda');
  return {
    w, d, visto, html,
    sel,
    caixa,
    visivel: () => Boolean(caixa) && caixa.hidden === false,
    textoDaCaixa: () => (d.getElementById('convite-perda-texto') || {}).textContent || '',
    clicar: () => d.getElementById('convite-enviar').click(),
    sim: () => { const b = d.getElementById('convite-perda-sim'); if (b) b.click(); },
  };
}

/** O valor de um atributo de uma opção do `<select>` dos planos. */
function atributoDaOpcao(html, plano, nome) {
  const bloco = new RegExp('<option[^>]*value="' + plano + '"[^>]*>').exec(html);
  if (!bloco) return null;
  const m = new RegExp('\\s' + nome + '="([^"]*)"').exec(bloco[0]);
  return m ? m[1] : null;
}

(async () => {
  console.log('A. A DERIVA — o atributo emitido é o do catálogo, nos três planos');
  {
    const cat = comercial.catalogoDaPagina();
    const p = pagina({ retrato: retratoDe(0, 0) });
    for (const plano of cat.assinaturas) {
      const ref = plano.referencia || {};
      provar('`' + plano.id + '`: professores = ' + ref.professores + ' (o do catálogo)',
        atributoDaOpcao(p.html, plano.id, 'data-professores') === String(ref.professores),
        atributoDaOpcao(p.html, plano.id, 'data-professores'));
      provar('`' + plano.id + '`: alunos = ' + ref.alunos,
        atributoDaOpcao(p.html, plano.id, 'data-alunos') === String(ref.alunos),
        atributoDaOpcao(p.html, plano.id, 'data-alunos'));
    }
    /* E NENHUM É ZERO. Esta é a asserção que a mensagem dela violava, escrita como negação — se
     * um dia a forma do catálogo mudar outra vez e o leitor ficar para trás, é esta que cai. */
    const zeros = cat.assinaturas.filter((pl) => atributoDaOpcao(p.html, pl.id, 'data-professores') === '0'
      || atributoDaOpcao(p.html, pl.id, 'data-alunos') === '0');
    provar('…e nenhum plano real emite zero (era o sintoma: «inclui 0 professores e 0 alunas»)',
      zeros.length === 0, zeros.map((pl) => pl.id));

    console.log('\nA-bis. AS DUAS FORMAS DO CATÁLOGO — a de hoje e a antiga');
    {
      /* A FORMA ANTIGA (achatada) continua a ser lida: a reserva existe para um catálogo que não
       * tenha `referencia`, e sem esta metade a correcção podia ter passado a exigir a forma nova. */
      const achatado = {
        moeda_simbolo: 'R$',
        assinaturas: [{ id: 'plano-x', nome: 'X', preco: 10, precoTexto: 'R$ 10,00', aulas: 5,
          professores: 2, alunos: 7 }],
      };
      const px = pagina({ retrato: retratoDe(0, 0), catalogo: achatado });
      provar('catálogo ACHATADO (sem `referencia`): ainda se lê a capacidade',
        atributoDaOpcao(px.html, 'plano-x', 'data-professores') === '2'
        && atributoDaOpcao(px.html, 'plano-x', 'data-alunos') === '7',
        [atributoDaOpcao(px.html, 'plano-x', 'data-professores'),
          atributoDaOpcao(px.html, 'plano-x', 'data-alunos')]);

      /* SEM CAPACIDADE NENHUMA, O ATRIBUTO É VAZIO — e não `"0"`. É a diferença entre «não sei» e
       * «zero», e é o que a secção D usa. */
      const semNada = {
        moeda_simbolo: 'R$',
        assinaturas: [{ id: 'plano-y', nome: 'Y', preco: 10, precoTexto: 'R$ 10,00', aulas: 5 }],
      };
      const py = pagina({ retrato: retratoDe(0, 0), catalogo: semNada });
      provar('plano sem capacidade declarada: o atributo vem VAZIO, e não «0»',
        atributoDaOpcao(py.html, 'plano-y', 'data-professores') === '',
        JSON.stringify(atributoDaOpcao(py.html, 'plano-y', 'data-professores')));
    }
  }

  console.log('\nB. O CASO DELA — 1 professor e 1 aluna, plano básico (1 e 10)');
  {
    /* O RETRATO É O DE VERDADE, medido na `breu` a 27/11/2026: o professor é o dono (`demi-plie`) e
     * a aluna vem de uma anamnese de 23/11 que a recriação anterior restaurou. A prova usa os nomes
     * reais de propósito — foi com eles que a mensagem apareceu. */
    const p = pagina({ retrato: { documentos: 7, professores: ['demi-plie'], alunos: ['Vavá'] }, plano: 'basico' });
    provar('a caixa de perda está escondida à partida', p.visivel() === false);
    p.clicar();
    await espera(80);
    provar('ao clicar, NÃO se pergunta nada (o básico cobre 1 professor e 1 aluna)',
      p.visivel() === false, p.textoDaCaixa());
    provar('…e o pedido PARTE — não fica presa na página',
      p.visto.pedidos.length === 1, p.visto.pedidos);
    provar('…e sem `perderDados`, porque não há nada a perder',
      p.visto.corpo && p.visto.corpo.perderDados === false, p.visto.corpo && p.visto.corpo.perderDados);
  }

  console.log('\nC. O CONTROLO — 5 professores e 20 alunas no básico (1 e 10): a pergunta tem de aparecer');
  {
    const p = pagina({ retrato: retratoDe(5, 20), plano: 'basico' });
    p.clicar();
    await espera(80);
    provar('a pergunta APARECE', p.visivel() === true);
    const t = p.textoDaCaixa();
    provar('…e nomeia a capacidade certa («inclui 1 professor e 10 alunas»)',
      /inclui 1 professor e 10 alunas/.test(t), t);
    provar('…e o que se perde («4 professores e 10 alunas»)',
      /perder-se 4 professores e 10 alunas/.test(t), t);
    provar('…e o pedido NÃO parte sem a confirmação', p.visto.pedidos.length === 0, p.visto.pedidos);

    /* O «SIM» FECHA O LAÇO: confirma, e o pedido seguinte leva `perderDados: true`. */
    p.sim();
    p.clicar();
    await espera(80);
    provar('depois do «Sim», o pedido parte', p.visto.pedidos.length === 1, p.visto.pedidos);
    provar('…e leva `perderDados: true`',
      p.visto.corpo && p.visto.corpo.perderDados === true, p.visto.corpo && p.visto.corpo.perderDados);
  }

  console.log('\nD. AS DUAS DEFESAS');
  {
    /* (1) CAPACIDADE ILEGÍVEL NÃO É ZERO. Um catálogo sem capacidade nenhuma não pode fazer a página
     * afirmar que se perde tudo — quem sabe é o servidor, que responde 409 com o número certo. */
    const semCapacidade = {
      moeda_simbolo: 'R$',
      assinaturas: [{ id: 'plano-y', nome: 'Y', preco: 10, precoTexto: 'R$ 10,00', aulas: 5 }],
    };
    const p1 = pagina({ retrato: retratoDe(5, 20), catalogo: semCapacidade, plano: 'plano-y' });
    p1.clicar();
    await espera(80);
    provar('capacidade ilegível: a página NÃO inventa uma perda', p1.visivel() === false, p1.textoDaCaixa());
    provar('…e deixa o pedido partir, para o servidor decidir', p1.visto.pedidos.length === 1, p1.visto.pedidos);
    void p1;

    /* (2) A RECUSA DO SERVIDOR TEM DE PODER SER ACEITE. Antes desta correcção, o 409 com `perdidos`
     * aparecia como erro e reabilitava o botão — sem caixa, sem «Sim», sem saída.
     *
     * O CENÁRIO É O DA ALÍNEA ANTERIOR, e é o único em que as duas metades divergem de propósito: a
     * página NÃO sabe a capacidade (catálogo sem ela), manda o pedido, e o servidor — que tem o
     * catálogo a sério — recusa. É o caso em que a defesa do cliente transfere a decisão, e por isso
     * o servidor tem de poder responder com uma pergunta que a pessoa consiga aceitar. */
    const p2 = pagina({ retrato: retratoDe(5, 20), catalogo: semCapacidade, plano: 'plano-y' });
    p2.visto.resposta = () => ({
      ok: false, status: 409,
      json: async () => ({
        ok: false, semRecriar: true,
        erro: 'Este plano inclui 1 professor e 10 alunas. O retrato desta escola tem 5 professores e '
          + '20 alunas: vão perder-se 4 professores e 10 alunas — os registos mais antigos. '
          + 'Se quiser este plano mesmo assim, confirme que aceita perder esses registos.',
        perdidos: {
          cabe: false,
          professores: { total: 5, mantidos: ['prof-0'], descartados: ['prof-1', 'prof-2', 'prof-3', 'prof-4'] },
          alunos: { total: 20, mantidos: [], descartados: [] },
        },
      }),
    });
    p2.clicar();
    await espera(120);
    provar('a recusa do servidor MOSTRA a caixa de confirmação', p2.visivel() === true, p2.textoDaCaixa());
    provar('…com a frase do SERVIDOR (uma só, não uma segunda calculada aqui)',
      /Se quiser este plano mesmo assim/.test(p2.textoDaCaixa()), p2.textoDaCaixa());
    provar('…e o botão volta a poder ser clicado (não é um beco)',
      p2.d.getElementById('convite-enviar').disabled === false);

    p2.visto.resposta = null;
    p2.sim();
    p2.clicar();
    await espera(120);
    provar('…e depois do «Sim», o pedido repete-se com `perderDados: true`',
      p2.visto.pedidos.length === 2
      && p2.visto.corpo && p2.visto.corpo.perderDados === true,
      { pedidos: p2.visto.pedidos.length, corpo: p2.visto.corpo && p2.visto.corpo.perderDados });
  }

  console.log('');
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + provas + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: a capacidade do plano chega à página pelo sítio '
    + 'certo, o básico cobre 1 professor e 1 aluna sem perguntar nada, a pergunta acontece quando '
    + 'há o que perder, e uma capacidade ilegível não vira uma afirmação.');
})();
