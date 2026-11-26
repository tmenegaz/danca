#!/usr/bin/env node
'use strict';

/*
 * provar-o-contrato-em-vigor.js — a memória do contrato, a franquia no plano, e o botão que só
 * acende com mudança (25/11/2026).
 *
 * O QUE ELA PEDIU, e cada pedido tem a sua asserção:
 *
 *   1. «Junto com o texto da listagem, eu tenho o preço […] Coloca junto também a franquia de cada
 *      um deles que está sendo contratada. Pode colocar um traço e a franquia para cada um.»
 *      → `Básico — R$ 69,90 — 130 aulas/mês`, e o número vem do catálogo.
 *
 *   2. «Ela não tem nesse momento a indicação no espaço de pacote de aula na mensalidade, ela não
 *      tem a indicação de qual pacote ela contratou. […] Então deixa uma memória aqui.»
 *      → a linha do contrato em vigor diz o plano, a franquia e o pacote — por extenso, e não só
 *      por campos pré-preenchidos. «sem pacote de aulas extra» é uma AFIRMAÇÃO, e não um silêncio.
 *
 *   3. «O botão gravar o contrato, deixa ele habilitado apenas se o plano vigente for editado. […]
 *      Aí quando mudar de plano ou mudar de pacote de aula, aí sim habilita o botão.»
 *      → o botão nasce `disabled`, acende no `change`, e apaga-se se a pessoa voltar ao que estava.
 *
 *   4. «Coloca aqui também uma auditoria, uma linha acima do botão gravar o contrato que indica a
 *      data em que foi feita a contratação do contrato. […] E se for gravado o contrato, atualiza a
 *      auditoria.»
 *      → `contratadoEm`, carimbada SÓ quando o contrato muda — nem em cada escrita do registo, nem
 *      num `POST` sem alteração.
 *
 *   node experimentos/provar-o-contrato-em-vigor.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** Um KV de bolso — o mesmo contrato que o Worker usa (`get`/`put`), sem rede nenhuma. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    chaves() { return [...dados.keys()].sort(); },
  };
}

const CATALOGO = comercial.catalogoDaPagina();

/** O extrato de uma escola, com o contrato que se lhe der. */
function conta(contrato) {
  const agora = new Date('2026-11-25T10:00:00.000Z');
  return mensalidades.situacaoDaEscola({
    escola: 'breu',
    contrato: Object.assign({
      plano: 'avancado', planoNome: 'Avançado', valorCentavos: 13990,
      criadoEm: '2026-11-20T12:00:00.000Z', estado: 'ativa',
    }, contrato || {}),
    livro: [], agora,
  });
}

const paginar = (contas) => painel.paginaFinanceira({
  pix: {}, descontos: [], escolas: [], extrato: contas, catalogo: CATALOGO,
});

(async () => {
  /* ── A. O PLANO, O PREÇO E A FRANQUIA ────────────────────────────────────────────────── */
  console.log('\nA. O SELECT DIZ O PLANO, O PREÇO E A FRANQUIA');

  {
    const html = paginar([conta()]);
    for (const plano of CATALOGO.assinaturas) {
      const esperado = plano.nome + ' — ' + plano.precoTexto + ' — ' + plano.aulas + ' aulas/mês';
      provar('a opção «' + plano.nome + '» diz «' + esperado + '»',
        html.indexOf('>' + esperado + '</option>') !== -1, plano);
    }
    provar('a franquia que o select diz é a do CATÁLOGO, e não um número escrito na página',
      CATALOGO.assinaturas.every((p) => html.indexOf('— ' + p.aulas + ' aulas/mês</option>') !== -1));
    /* O CONTROLO: a assinatura antiga («Nome — R$ X») não pode ter ficado para trás — é o defeito
     * que a mudança fecha, e uma página com as duas formas diria as duas coisas. */
    provar('CONTROLO: o preço não aparece sozinho, sem a franquia a seguir',
      CATALOGO.assinaturas.every((p) => !new RegExp('>' + p.nome + ' — ' + p.precoTexto
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</option>').test(html)));
  }

  /* ── B. A MEMÓRIA DO CONTRATO, POR EXTENSO ───────────────────────────────────────────── */
  console.log('\nB. A LINHA DO CONTRATO EM VIGOR — o plano, a franquia, o pacote e a data');

  {
    const semPacote = paginar([conta()]);
    const i = semPacote.indexOf('data-contrato-em-vigor');
    const linha = i === -1 ? '' : semPacote.slice(i, i + 400);
    provar('a linha existe, e está ACIMA do botão de gravar',
      i !== -1 && i < semPacote.indexOf('data-contrato-gravar'), { i });
    provar('…diz o plano em vigor', /Avançado/.test(linha), linha);
    provar('…diz a franquia do plano', /500 aulas\/mês/.test(linha), linha);
    /* «sem pacote de aulas extra» é a asserção que interessa: a queixa dela era o SILÊNCIO sobre o
     * pacote. Uma caixa desmarcada pode ser «não contratou» ou «o registo perdeu-se»; a frase não
     * deixa a dúvida. */
    provar('…e DIZ que não há pacote extra, em vez de ficar em silêncio',
      /sem pacote de aulas extra/.test(linha), linha);
    provar('…e diz desde quando', /desde 20\/11\/2026/.test(linha), linha);

    const comPacote = paginar([conta({ pacotes: ['m'] })]);
    const j = comPacote.indexOf('data-contrato-em-vigor');
    const linhaCom = j === -1 ? '' : comPacote.slice(j, j + 400);
    provar('com um pacote comprado, a linha nomeia-o', /Pacote médio \(\+50 aulas\)/.test(linhaCom),
      linhaCom);
    provar('…e a franquia mostrada soma o pacote (500 + 50)', /550 aulas\/mês/.test(linhaCom), linhaCom);
    provar('…e deixa de dizer que não há nenhum', !/sem pacote de aulas extra/.test(linhaCom));

    /* SEM DATA NENHUMA, a linha diz que não há — não inventa uma. */
    const semData = paginar([conta({ criadoEm: null, contratadoEm: null, habilitadaEm: null })]);
    const k = semData.indexOf('data-contrato-em-vigor');
    provar('sem data no registo, a linha DIZ que não há — e não inventa uma',
      k !== -1 && /sem data registada/.test(semData.slice(k, k + 400)), semData.slice(k, k + 200));
  }

  /* ── C. O BOTÃO NASCE DESLIGADO ──────────────────────────────────────────────────────── */
  console.log('\nC. O BOTÃO — desligado até algo mudar, e com a memória do estado inicial');

  {
    const html = paginar([conta()]);
    const i = html.indexOf('data-contrato-gravar="breu"');
    const botao = i === -1 ? '' : html.slice(i, i + 200);
    provar('o botão de gravar o contrato nasce com `disabled`', / disabled>/.test(botao), botao);
    provar('…e leva a assinatura do estado em que a página abriu',
      /data-contrato-assinatura="avancado\|"/.test(botao), botao);

    const comPacote = paginar([conta({ pacotes: ['m'] })]);
    const j = comPacote.indexOf('data-contrato-gravar="breu"');
    provar('a assinatura leva os pacotes em vigor — ordenados, porque a ordem das caixas não é uma escolha',
      /data-contrato-assinatura="avancado\|m"/.test(comPacote.slice(j, j + 200)),
      comPacote.slice(j, j + 200));
  }

  /* ── D. O CLIENTE — acende com mudança, apaga ao voltar atrás ────────────────────────── */
  console.log('\nD. O CLIENTE — o botão acende na mudança e apaga-se quando se volta ao que estava');

  {
    /* A PÁGINA CORRE EM JSDOM, como as outras provas do painel: o que se mede é o comportamento do
     * script, e não a presença de uma string no fonte. */
    let jsdom = null;
    try { jsdom = require(path.join(RAIZ, 'apresentacoes', 'apresentacao-01-rizoma', 'node_modules', 'jsdom')); }
    catch (e) { try { jsdom = require('jsdom'); } catch (e2) { jsdom = null; } }
    if (!jsdom) {
      console.log('  NÃO FEITO — sem jsdom nesta máquina; a secção D não corre.');
    } else {
      const html = paginar([conta()]);
      const dom = new jsdom.JSDOM(html, { runScripts: 'dangerously', url: 'https://danca.padd.com.br/financeiro' });
      const d = dom.window.document;
      const caixa = d.querySelector('[data-contrato="breu"]');
      const botao = caixa.querySelector('[data-contrato-gravar]');
      const select = caixa.querySelector('[data-contrato-plano]');
      const caixas = caixa.querySelectorAll('[data-contrato-pacote]');

      provar('ao abrir, o botão está desligado', botao.disabled === true, botao.disabled);

      select.value = 'intermediario';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      provar('mudar o plano ACENDE o botão', botao.disabled === false, botao.disabled);

      select.value = 'avancado';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      provar('voltar ao plano que estava APAGA-o outra vez', botao.disabled === true, botao.disabled);

      if (caixas.length) {
        caixas[0].checked = true;
        caixas[0].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        provar('marcar um pacote ACENDE o botão', botao.disabled === false, botao.disabled);
        caixas[0].checked = false;
        caixas[0].dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        provar('desmarcá-lo APAGA-o outra vez', botao.disabled === true, botao.disabled);
      }
      dom.window.close();
    }
  }

  /* ── E. O SERVIDOR — a data só se carimba quando o contrato muda ─────────────────────── */
  console.log('\nE. A DATA DA CONTRATAÇÃO — carimbada só quando há contrato novo');

  {
    const kv = kvDeBolso();
    /* A criação do registo NÃO carimba: ele não passa pela opção, e o `criadoEm` é a reserva que a
     * página lê. É por isso que uma escola nascida com um plano continua a ter data. */
    await raiz.gravarComercial(kv, 'breu', {
      estado: 'ativa', plano: 'basico', planoNome: 'Básico',
      criadoEm: '2026-11-20T12:00:00.000Z',
    }, 'proprietario');
    let c = await raiz.lerComercial(kv, 'breu');
    provar('sem a opção, a gravação NÃO carimba `contratadoEm`', !c.contratadoEm, c.contratadoEm);
    provar('…e a reserva dela está lá: o `criadoEm` da criação',
      c.criadoEm === '2026-11-20T12:00:00.000Z', c.criadoEm);

    await new Promise((r) => setTimeout(r, 5));
    await raiz.gravarComercial(kv, 'breu', { plano: 'avancado', planoNome: 'Avançado' },
      'proprietario', { contratoNovo: true });
    c = await raiz.lerComercial(kv, 'breu');
    provar('com a opção, o `contratadoEm` é carimbado', Boolean(c.contratadoEm), c.contratadoEm);
    provar('…e é o mesmo instante do `atualizadoEm` — um relógio, não dois',
      c.contratadoEm === c.atualizadoEm, { c: c.contratadoEm, a: c.atualizadoEm });

    const primeiro = c.contratadoEm;
    await new Promise((r) => setTimeout(r, 5));
    /* HABILITAR A ESCOLA NÃO É CONTRATAR: é a escrita que fazia o `atualizadoEm` andar e que teria
     * levado a data da contratação com ele, se o carimbo fosse incondicional. */
    await raiz.gravarComercial(kv, 'breu', { estado: 'ativa' }, 'proprietario');
    c = await raiz.lerComercial(kv, 'breu');
    provar('habilitar a escola NÃO move a data da contratação',
      c.contratadoEm === primeiro, { antes: primeiro, depois: c.contratadoEm });
    provar('…mas move o `atualizadoEm`, que é a data da última escrita',
      c.atualizadoEm > primeiro, { c: c.contratadoEm, a: c.atualizadoEm });
  }

  /* ── F. A ROTA — um pedido sem alteração não move a auditoria ────────────────────────── */
  console.log('\nF. A ROTA — um `POST` sem alteração não reescreve a data');

  {
    const kv = kvDeBolso({
      'bastidores/breu/comercial': JSON.stringify({
        estado: 'ativa', plano: 'avancado', planoNome: 'Avançado',
        valor: '139,90', valorCentavos: 13990, capacidade: 500,
        pacotes: [], criadoEm: '2026-11-20T12:00:00.000Z',
        contratadoEm: '2026-11-20T12:00:00.000Z',
        atualizadoEm: '2026-11-20T12:00:00.000Z',
      }),
    });
    const env = { PADD_KV: kv, HOST_DONO: 'danca.padd.com.br', SENHA_RAIZ: 'x' };
    /* A PORTA DO DONO PEDE A SENHA (`autorizado`: Basic com o utilizador fixo), e o pedido tem de
     * a levar — sem ela a rota responde 401 e a prova mediria o portão em vez do contrato. */
    const autorizacao = 'Basic ' + Buffer.from('tmenegaz:x').toString('base64');
    const pedir = async (corpo) => {
      const r = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: autorizacao },
        body: JSON.stringify(Object.assign({ escola: 'breu' }, corpo)),
      }), env);
      let json = null;
      try { json = await r.json(); } catch (e) { json = null; }
      return { status: r.status, json };
    };

    const igual = await pedir({ plano: 'avancado', pacotes: [] });
    provar('o mesmo contrato responde `ok`', igual.status === 200 && igual.json && igual.json.ok === true,
      { status: igual.status, json: igual.json });
    provar('…e diz que NADA mudou', igual.json && igual.json.mudou === false,
      igual.json && igual.json.mudou);
    let c = await raiz.lerComercial(kv, 'breu');
    provar('…e a data da contratação fica onde estava',
      c.contratadoEm === '2026-11-20T12:00:00.000Z', c.contratadoEm);

    const mudou = await pedir({ plano: 'avancado', pacotes: ['m'] });
    provar('acrescentar um pacote muda o contrato', mudou.json && mudou.json.mudou === true,
      mudou.json && mudou.json.mudou);
    c = await raiz.lerComercial(kv, 'breu');
    provar('…e a data da contratação passa a ser agora',
      Boolean(c.contratadoEm) && c.contratadoEm !== '2026-11-20T12:00:00.000Z', c.contratadoEm);
    provar('…e é a data que a resposta devolve, para a tela não ter de adivinhar',
      mudou.json && mudou.json.contrato && mudou.json.contrato.contratadoEm === c.contratadoEm,
      mudou.json && mudou.json.contrato);

    /* A ORDEM DAS CAIXAS NÃO É UMA MUDANÇA: mandar os mesmos pacotes por outra ordem não pode
     * carimbar a data outra vez. É o defeito clássico de uma comparação de listas. */
    await pedir({ plano: 'avancado', pacotes: ['p', 'm'] });
    const antesDaOrdem = (await raiz.lerComercial(kv, 'breu')).contratadoEm;
    await new Promise((r) => setTimeout(r, 5));
    const invertido = await pedir({ plano: 'avancado', pacotes: ['m', 'p'] });
    provar('a mesma lista por outra ordem NÃO é uma mudança',
      invertido.json && invertido.json.mudou === false, invertido.json && invertido.json.mudou);
    provar('…e a data não se move', (await raiz.lerComercial(kv, 'breu')).contratadoEm === antesDaOrdem,
      (await raiz.lerComercial(kv, 'breu')).contratadoEm);
  }

  /* ── G. A ESCOLA QUE NASCE COM UM PACOTE NÃO O PERDE ────────────────────────────────── */
  console.log('\nG. O PACOTE CONTRATADO NA CRIAÇÃO CHEGA AO REGISTO');

  {
    /* A gravação da criação é uma linha de `raiz.js`, e a prova lê-a: o registo tem de receber
     * `pacotes`, senão a escola nasce com o pacote e acorda sem ele. Medir o objecto gravado seria
     * mais fiel, mas a criação passa pelo deploy e pelo GitHub — o que se pode medir sem rede é o
     * que a gravação leva, e é aí que o defeito estava. */
    /* O ANCORA ERA LITERAL, E PARTIU A 25/11/2026 — sem que a asserção tivesse deixado de ser
     * verdadeira. Ela cortava o texto a partir de `const estadoComercial = escolha.pagamento`, e a
     * F3 substituiu essa linha por uma chamada ao núcleo (o estado ao nascer passou a depender da
     * porta). O `indexOf` devolveu -1, o trecho ficou vazio, e a prova reprovou uma gravação que
     * estava certa.
     *
     * O conserto é no ANCORA, e a lição é a de sempre: uma prova que se ancora numa linha que outra
     * mudança legítima vai reescrever mede o texto, não a regra. Passa a ancorar-se na GRAVAÇÃO —
     * `gravarCadastro`, que é o que a criação faz antes de gravar o comercial —, e o que se afirma
     * continua a ser o que interessava: o registo leva os pacotes escolhidos. */
    const fonte = fs.readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    const trecho = (() => {
      const marca = 'const cadastroGravado = await gravarCadastro({';
      const i = fonte.indexOf(marca);
      return i === -1 ? '' : fonte.slice(i, fonte.indexOf('const correioEnviado', i));
    })();
    provar('o registo da criação leva os pacotes escolhidos', /pacotes: escolha\.pacotes/.test(trecho),
      trecho.slice(0, 200));
    provar('…e o trecho medido não está vazio (o âncora encontrou a gravação)', trecho.length > 200, trecho.length);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o plano diz o preço e a franquia, a linha do contrato '
      + 'diz o que está em vigor e desde quando, o botão só acende com uma mudança — e o servidor '
      + 'não move a data da contratação sem que ela exista.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})();
