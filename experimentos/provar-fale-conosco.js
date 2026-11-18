#!/usr/bin/env node
'use strict';

/**
 * provar-fale-conosco.js — o rodapé é um canal, o formulário ENVIA, e a janela fecha (18/11/2026).
 *
 * O QUE ELA PEDIU, em duas passagens no mesmo dia:
 *
 *   1. «lá no rodapé tá escrito Projeto Ciclo Raiz. Pode tirar isso daqui, você vai colocar um Fale
 *      Conosco e o e-mail é lastro@padd.com.br […] já coloca também um outro campo que é para o
 *      telefone»;
 *   2. «o formulário é para enviar direto, não vai abrir nada, ele vai enviar, igual a gente fez a
 *      solução quando a secretaria cadastra um novo aluno […] quando enviar por e-mail, fecha o
 *      modal»; «não tem o botão abrir o WhatsApp»; «faltou colocar nesse formulário o nome da
 *      pessoa e da escola — obrigatoriamente tem que saber os nomes, o e-mail e o telefone e
 *      mensagem».
 *
 * O QUE SE MEDE:
 *
 *   A. o rodapé diz a que veio, e o canal está escrito nele;
 *   B. o «Fale conosco» abre a janela, e ela tem os CINCO campos — e não tem o botão do WhatsApp;
 *   C. o envio vai ao servidor com os cinco campos, a janela FECHA, e o rodapé agradece;
 *   C2. se o aviso por e-mail não sair, a janela NÃO fecha e o recado não mente;
 *   C3. se o servidor não responder, a janela fica aberta e dá o endereço à mão;
 *   D. falta de campo não envia nada, e diz qual falta;
 *   E. o sininho do botão «Contatos» acende com pedido por ler, e apaga sem ele;
 *   F. o rodapé não se duplica numa página que já o traga.
 *
 * O QUE CORRE É A PÁGINA SERVIDA (a de `raiz/index.html`), num jsdom, com o `assets/nav.js` — o
 * ficheiro de verdade — injetado: o rodapé e a janela passaram a viver lá, e uma prova que lesse só
 * o HTML mediria a ausência deles. O que não se mede aqui: o programa de correio, que não navega
 * num jsdom — e o único `mailto:` que sobrou é o do endereço escrito no rodapé, que ela quer
 * mantido.
 *
 *   node experimentos/provar-fale-conosco.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const raiz = path.resolve(__dirname, '..');
const FONTE = path.join(raiz, 'raiz/index.html');
const NAV = path.join(raiz, 'tools/templates/nav.js');

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const EMAIL = 'lastro@padd.com.br';
/* O número em DÍGITOS, com o país e o DDD: é esta a forma que o `wa.me` aceita. O número escrito
 * com parênteses e hífen é o que se lê — e o link com ele não abre. */
const WHATSAPP = '5554991752662';

const espera = (win, ms = 250) => new Promise((r) => win.setTimeout(r, ms));

/**
 * A PÁGINA, COM O `nav.js` DENTRO.
 *
 * O `<script src="assets/nav.js">` é substituído pelo CONTEÚDO do ficheiro: o jsdom não busca
 * recursos, e um rodapé injetado por um script que não corre seria invisível para a prova — que
 * diria «o rodapé não existe» sobre uma página que o tem.
 */
function pagina({ duasVezes = false } = {}) {
  const html = fs.readFileSync(FONTE, 'utf8');
  const nav = fs.readFileSync(NAV, 'utf8');
  const inline = '<script>\n' + nav + '\n</script>';
  return html.replace('<script src="assets/nav.js"></script>',
    duasVezes ? inline + inline : inline);
}

async function abrir({ resposta, duasVezes = false, porLer = 0 } = {}) {
  const vc = new VirtualConsole();
  const problemas = [];
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(pagina({ duasVezes }), {
    url: 'https://lastro.padd.com.br/',
    runScripts: 'dangerously',
    virtualConsole: vc,
    beforeParse(w) {
      /* O QUE A PÁGINA ENVIOU, na ordem em que enviou: é o gesto que se mede, e não o texto do
       * ficheiro. */
      w.__enviados = [];
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = () => {};
      w.fetch = (alvo, opcoes) => {
        const caminho = String(alvo);
        if (caminho.indexOf('/api/contato') !== -1 && caminho.indexOf('/api/contatos') === -1) {
          w.__enviados.push(JSON.parse(String((opcoes && opcoes.body) || '{}')));
          const r = resposta || { ok: true, registado: true, enviado: true };
          return Promise.resolve({ ok: true, json: () => Promise.resolve(r) });
        }
        if (caminho.indexOf('/api/contatos/quantos') !== -1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, porLer: porLer }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, modo: 'publica' }) });
      };
    },
  });
  await espera(dom.window);
  return { win: dom.window, doc: dom.window.document, problemas, fechar: () => dom.window.close() };
}

/**
 * A JANELA — ou uma forma vazia que se comporta como uma janela fechada e sem conteúdo.
 *
 * Sem isto, um defeito que apagasse a janela fazia EXPLODIR a prova na primeira leitura de
 * `modal.hidden` — e uma prova que rebenta não conta o que se perdeu. Uma prova que mede um
 * defeito tem de o poder REPORTAR.
 */
function aJanela(doc) {
  return doc.getElementById('modal-fale') || {
    hidden: true,
    textContent: '',
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

function clicar(doc, id) {
  const b = doc.getElementById(id);
  if (b) b.dispatchEvent(new doc.defaultView.MouseEvent('click', { bubbles: true }));
  return b;
}

function preencher(doc, campos) {
  for (const [id, valor] of Object.entries(campos)) {
    const el = doc.getElementById(id);
    if (!el) continue;
    el.value = valor;
    el.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
  }
}

const CAMPOS = {
  'fale-nome': 'Ana Souza',
  'fale-escola': 'Studio Vila Nova',
  'fale-email': 'pessoa@exemplo.com.br',
  'fale-telefone': '(51) 98888-7777',
  'fale-mensagem': 'Queria saber como criar a escola da minha companhia.',
};

(async () => {
  console.log('\nFALE CONOSCO — o rodapé de todas as telas, e o formulário que envia');

  console.log('\nA · o rodapé diz a que veio, e o canal está escrito nele');
  {
    const { doc, problemas, fechar } = await abrir();
    const rodape = doc.querySelector('footer.rodape');
    const texto = rodape ? rodape.textContent : '';
    provar('o rodapé existe (o `nav.js` cria-o quando a página não o traz)', Boolean(rodape));
    provar('o rodapé JÁ NÃO diz «Projeto Ciclo»', !/Projeto Ciclo/.test(texto), texto.trim());
    /* A ABA DO NAVEGADOR DIZIA O MESMO. A queixa dela foi sobre o rodapé, e o nome que ela leu
     * — «Projeto Ciclo Raiz» — aparecia duas vezes na mesma página: no rodapé e no título da aba.
     * Corrigir uma e deixar a outra era meio conserto. */
    provar('…nem o título da aba',
      (doc.querySelector('title') || {}).textContent === 'Sistema Lastro',
      (doc.querySelector('title') || {}).textContent);
    provar('o rodapé oferece o «Fale conosco»', Boolean(doc.getElementById('btn-fale-conosco')));
    provar('…e escreve o e-mail da casa', texto.indexOf(EMAIL) !== -1, texto.trim());
    const link = rodape ? rodape.querySelector('a[href^="https://wa.me/"]') : null;
    provar('…e o endereço do WhatsApp é o do wa.me, em dígitos com o país',
      Boolean(link) && link.getAttribute('href').indexOf('https://wa.me/' + WHATSAPP) === 0,
      link && link.getAttribute('href'));
    /* O CLIQUE NO ENDEREÇO CONTINUA A ABRIR O PROGRAMA DE CORREIO — «isso está muito bom». O que
     * saiu do sistema foi o `mailto:` do FORMULÁRIO, que punha o envio nas mãos de quem escreve. */
    const correio = rodape ? rodape.querySelector('a[href^="mailto:"]') : null;
    provar('…e o endereço é um link de correio, que ela quer mantido',
      Boolean(correio) && correio.getAttribute('href') === 'mailto:' + EMAIL,
      correio && correio.getAttribute('href'));
    provar('a página não escreveu erro nenhum', problemas.length === 0, problemas.slice(0, 2));
    fechar();
  }

  console.log('\nB · o clique abre a janela, e a janela tem os cinco campos');
  {
    const { win, doc, problemas, fechar } = await abrir();
    const modal = aJanela(doc);
    provar('a janela nasce fechada', Boolean(modal) && modal.hidden === true);
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    provar('o «Fale conosco» abre a janela', modal.hidden === false);
    /* OS CINCO CAMPOS SÃO OBRIGATÓRIOS — «obrigatoriamente tem que saber os nomes, o e-mail e o
     * telefone e mensagem para poder enviar». O nome e a escola são os que faltavam. */
    provar('…com o nome de quem escreve', Boolean(doc.getElementById('fale-nome')));
    provar('…com o nome da escola', Boolean(doc.getElementById('fale-escola')));
    provar('…com o campo do e-mail', Boolean(doc.getElementById('fale-email')));
    provar('…com o campo do telefone', Boolean(doc.getElementById('fale-telefone')));
    provar('…e com a mensagem', Boolean(doc.getElementById('fale-mensagem')));
    /* O BOTÃO DO WHATSAPP SAIU DO FORMULÁRIO — «não tem o botão abrir o WhatsApp». Não há API de
     * WhatsApp nesta casa, e um botão que abre um `wa.me` sem a mensagem composta promete o que não
     * cumpre. O número continua no rodapé, que é onde ele é útil. */
    provar('a janela JÁ NÃO tem o botão «Abrir o WhatsApp»',
      !doc.getElementById('fale-por-whatsapp'), 'ainda existe');
    provar('…e o único botão de envio é o do e-mail',
      Boolean(doc.getElementById('fale-enviar'))
      && modal.querySelectorAll('.modal-acoes button').length === 1,
      modal.querySelectorAll('.modal-acoes button').length);

    /* A JANELA NÃO REPETE OS DOIS ENDEREÇOS. Eles estão no rodapé, que é onde ela os quis. */
    provar('a janela JÁ NÃO repete o e-mail e o WhatsApp — eles vivem no rodapé',
      !/lastro@padd\.com\.br/.test(modal.textContent), modal.textContent.replace(/\s+/g, ' ').slice(-90));

    const caixa = modal.querySelector('.modal-caixa');
    provar('a janela é a LARGA — duas colunas, como o cadastro da escola',
      Boolean(caixa) && /modal-largo/.test(caixa.className), caixa && caixa.className);
    const telefone = doc.getElementById('fale-telefone') || { getAttribute: () => null };
    /* O CAMPO DO TELEFONE TEM DE SER UM CAMPO DA FOLHA. A folha desenha por TIPO, e `tel` não está
     * na lista: com `type="tel"` o campo saía com o desenho cru do navegador, e ela chamou-lhe
     * «muito feio, destoante». A convenção da casa é `inputmode="tel"` sem `type`. */
    provar('o telefone não é `type="tel"` (a folha não desenha esse tipo)',
      Boolean(telefone) && !telefone.getAttribute('type'), telefone && telefone.getAttribute('type'));
    provar('…mas o teclado do celular continua a ser o numérico',
      Boolean(telefone) && telefone.getAttribute('inputmode') === 'tel',
      telefone && telefone.getAttribute('inputmode'));
    const mensagem = doc.getElementById('fale-mensagem') || { getAttribute: () => null };
    provar('o placeholder da mensagem convida a pedir contacto',
      /autorize que um consultor entre em contato/i.test(mensagem.getAttribute('placeholder') || ''),
      mensagem.getAttribute('placeholder'));
    provar('a janela tem uma linha de introdução, e só uma',
      /Escreva aqui como quer falar conosco\./.test(modal.textContent)
      && !/Nada é enviado sem você mandar/.test(modal.textContent),
      modal.textContent.replace(/\s+/g, ' ').slice(0, 120));
    provar('a página não escreveu erro nenhum', problemas.length === 0, problemas.slice(0, 2));
    fechar();
  }

  console.log('\nC · o envio vai ao servidor com os cinco campos, e a janela FECHA');
  {
    const { win, doc, fechar } = await abrir();
    const modal = aJanela(doc);
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    preencher(doc, CAMPOS);
    clicar(doc, 'fale-enviar');
    await espera(win, 120);

    provar('um pedido, um POST', win.__enviados.length === 1, win.__enviados.length);
    const corpo = win.__enviados[0] || {};
    provar('…com o nome de quem escreve', corpo.nome === 'Ana Souza', corpo.nome);
    provar('…com o nome da escola', corpo.escola === 'Studio Vila Nova', corpo.escola);
    provar('…com o e-mail', corpo.email === 'pessoa@exemplo.com.br', corpo.email);
    provar('…com o telefone', /98888-7777/.test(String(corpo.telefone)), corpo.telefone);
    provar('…e com a mensagem', /companhia/.test(String(corpo.mensagem)), corpo.mensagem);

    /* «QUANDO ENVIAR POR E-MAIL, FECHA O MODAL, NÃO DEIXA ELE ABERTO NÃO.» Fechar é o pedido — e é
     * por isso que o recado do rodapé existe: sem ele, a janela desaparecia sem dizer nada. */
    provar('a janela FECHOU depois de enviar', modal.hidden === true, modal.hidden);
    const recado = doc.querySelector('[data-fale-recado]');
    provar('…e o rodapé diz que a mensagem foi enviada',
      Boolean(recado) && recado.hidden === false && /Mensagem enviada/.test(recado.textContent),
      recado && recado.textContent);
    provar('…e o recado é anunciado por leitor de ecrã',
      Boolean(recado) && recado.getAttribute('role') === 'status');
    provar('…e o formulário ficou limpo para o próximo pedido',
      (doc.getElementById('fale-nome') || {}).value === '',
      (doc.getElementById('fale-nome') || {}).value);
    fechar();
  }

  console.log('\nC2 · sem o aviso por e-mail, a janela NÃO fecha — e o recado não mente');
  {
    /* O PEDIDO ESTÁ GRAVADO E O E-MAIL NÃO SAIU. Fechar a janela aqui seria dizer «enviado» sobre
     * uma mensagem que ninguém recebeu. O recado diz as duas metades, e dá o endereço à mão. */
    const { win, doc, fechar } = await abrir({
      resposta: { ok: true, registado: true, enviado: false, dica: 'falta o segredo RESEND_API_KEY no Worker' },
    });
    const modal = aJanela(doc);
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    preencher(doc, CAMPOS);
    clicar(doc, 'fale-enviar');
    await espera(win, 120);
    provar('a janela continua aberta', modal.hidden === false, modal.hidden);
    const texto = (doc.getElementById('fale-res') || {}).textContent || '';
    provar('…e o recado diz que o pedido FICOU registado', /ficou registado/i.test(texto), texto);
    provar('…e que o aviso NÃO saiu', /não saiu/i.test(texto), texto);
    provar('…e diz o motivo, para quem instala poder corrigir', /RESEND_API_KEY/.test(texto), texto);
    provar('…e dá o endereço em vez de deixar a pessoa sem saída', texto.indexOf(EMAIL) !== -1, texto);
    fechar();
  }

  console.log('\nC3 · servidor em baixo: a janela fica aberta e diz o que fazer');
  {
    const { win, doc, fechar } = await abrir();
    win.fetch = () => Promise.reject(new Error('sem rede'));
    const modal = aJanela(doc);
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    preencher(doc, CAMPOS);
    clicar(doc, 'fale-enviar');
    await espera(win, 120);
    provar('a janela continua aberta', modal.hidden === false, modal.hidden);
    const texto = (doc.getElementById('fale-res') || {}).textContent || '';
    provar('…e o recado manda escrever para o e-mail da casa', texto.indexOf(EMAIL) !== -1, texto);
    provar('o botão volta a estar disponível', (doc.getElementById('fale-enviar') || {}).disabled === false);
    fechar();
  }

  console.log('\nD · falta de campo não envia nada, e diz qual falta');
  {
    for (const [campo, pedaco] of [
      ['fale-nome', /nome/i],
      ['fale-escola', /escola/i],
      ['fale-email', /e-mail/i],
      ['fale-telefone', /telefone/i],
      ['fale-mensagem', /mensagem/i],
    ]) {
      const { win, doc, fechar } = await abrir();
      clicar(doc, 'btn-fale-conosco');
      await espera(win, 50);
      const cheios = Object.assign({}, CAMPOS);
      delete cheios[campo];
      preencher(doc, cheios);
      const vazio = doc.getElementById(campo);
      if (vazio) vazio.value = '';
      clicar(doc, 'fale-enviar');
      await espera(win, 60);
      provar('sem ' + campo.replace('fale-', '') + ': nada é enviado', win.__enviados.length === 0,
        win.__enviados.length);
      const texto = (doc.getElementById('fale-res') || {}).textContent || '';
      provar('…e o aviso nomeia o que falta', pedaco.test(texto), texto);
      fechar();
    }
  }

  console.log('\nE · o sininho do painel acende quando há pedido por ler');
  {
    /* «VALE A PENA COLOCAR UM SININHO AQUI EM CONTATOS sinalizando para mim que chegou uma
     * mensagem.» O número vem da rota que lê a MESMA lista que a página mostra; o que se mede é o
     * selo a acender e a apagar, e não o texto do ficheiro. */
    const comPedidos = await abrir({ porLer: 3 });
    const selo = comPedidos.doc.getElementById('contatos-por-ler');
    provar('o botão «Contatos» tem o lugar do selo', Boolean(selo));
    await espera(comPedidos.win, 80);
    provar('com 3 por ler, o selo aparece', Boolean(selo) && selo.hidden === false, selo && selo.hidden);
    provar('…e diz quantos', Boolean(selo) && selo.textContent === '3', selo && selo.textContent);
    comPedidos.fechar();

    const semPedidos = await abrir({ porLer: 0 });
    const mudo = semPedidos.doc.getElementById('contatos-por-ler');
    await espera(semPedidos.win, 80);
    provar('sem nada por ler, o selo fica escondido', Boolean(mudo) && mudo.hidden === true,
      mudo && mudo.hidden);
    semPedidos.fechar();
  }

  console.log('\nF · o rodapé não se duplica');
  {
    /* O `nav.js` é carregado uma vez por página, mas a guarda existe porque uma página pode trazer
     * o seu próprio rodapé (foi o caso da raiz até hoje). Duas linhas do canal no mesmo ecrã é o
     * defeito que a guarda impede — e é isso que se mede. */
    const { doc, fechar } = await abrir({ duasVezes: true });
    provar('com o script carregado duas vezes, há UM botão «Fale conosco»',
      doc.querySelectorAll('#btn-fale-conosco').length === 1,
      doc.querySelectorAll('#btn-fale-conosco').length);
    provar('…e UMA janela', doc.querySelectorAll('#modal-fale').length === 1,
      doc.querySelectorAll('#modal-fale').length);
    fechar();
  }

  console.log('');
  console.log(falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).');
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
