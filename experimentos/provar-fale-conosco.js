#!/usr/bin/env node
'use strict';

/**
 * provar-fale-conosco.js — o rodapé da página pública é um canal, e o canal abre (18/11/2026).
 *
 * O QUE ELA PEDIU: «lá no rodapé tá escrito Projeto Ciclo Raiz. Pode tirar isso daqui, você vai
 * colocar um Fale Conosco e o e-mail é lastro@padd.com.br. Quando clicar aqui no Fale Conosco,
 * vai abrir um modal ou um formulário, vai abrir um formulário para a pessoa mandar o e-mail. Aí
 * ela encaminha o e-mail e aí já coloca também um outro campo que é para o telefone. […] E aí
 * vamos ver se ele abre o WhatsApp Web.»
 *
 * O QUE SE MEDE:
 *
 *   1. o rodapé JÁ NÃO diz «Projeto Ciclo · raiz» — o nome de dentro de casa, a quem chegou de
 *      fora;
 *   2. o e-mail e o número do WhatsApp estão à vista, como texto que se copia — e o número do
 *      link é o do `wa.me` (dígitos com o país), que é o único que abre;
 *   3. o «Fale conosco» abre a janela, e ela tem os três campos (e-mail, telefone, mensagem);
 *   4. O WHATSAPP ABRE COM A MENSAGEM COMPOSTA, e ela leva o e-mail e o telefone de quem escreve.
 *      É o gesto que ela quer testar, e é medido no clique — não no texto do ficheiro;
 *   5. sem mensagem, ou sem um contacto, o botão NÃO abre nada e diz por quê: um link de WhatsApp
 *      com o texto vazio é uma mensagem que ninguém sabe de quem é.
 *
 * O QUE CORRE É A PÁGINA SERVIDA (a de `raiz/index.html`, que é a de `lastro.padd.com.br`), num
 * jsdom. O que não se mede aqui: o programa de correio — `mailto:` não navega num jsdom —, e é
 * por isso que a asserção do e-mail é sobre o ENDEREÇO VISÍVEL na própria janela, e não sobre o
 * que o navegador faria com ele.
 *
 *   node experimentos/provar-fale-conosco.js
 */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const raiz = path.resolve(__dirname, '..');
const FONTE = path.join(raiz, 'raiz/index.html');

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

const EMAIL = 'lastro@padd.com.br';
/* O número em DÍGITOS, com o país e o DDD: é esta a forma que o `wa.me` aceita. O número
 * escrito com parênteses e hífen é o que se lê — e o link com ele não abre. */
const WHATSAPP = '5554991752662';

const espera = (win, ms = 250) => new Promise((r) => win.setTimeout(r, ms));

async function abrir({ registoFalha = false } = {}) {
  const html = fs.readFileSync(FONTE, 'utf8');
  const vc = new VirtualConsole();
  const problemas = [];
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) problemas.push(e.message); });

  const dom = new JSDOM(html, {
    url: 'https://lastro.padd.com.br/',
    runScripts: 'dangerously',
    virtualConsole: vc,
    beforeParse(w) {
      /* O `window.open` do WhatsApp é o que se observa: o jsdom não navega, e um clique que
       * «abre uma aba» sem dizer para onde mediria nada. */
      w.__abriu = [];
      w.open = (url) => { w.__abriu.push(String(url)); return { closed: false, focus() {} }; };
      /* O ORDEM DOS GESTOS É O QUE SE MEDE: o pedido tem de ficar registado ANTES de o canal
       * abrir, porque `mailto:` e `wa.me` NAVEGAM e levam a página com eles. A lista guarda os
       * dois na ordem em que aconteceram. */
      w.__gestos = [];
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = () => {};
      w.fetch = (alvo, opcoes) => {
        const caminho = String(alvo);
        if (caminho.indexOf('/api/contato') !== -1) {
          w.__gestos.push('contato:' + String((opcoes && opcoes.body) || ''));
          if (registoFalha) return Promise.reject(new Error('sem rede'));
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, registado: true }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, modo: 'publica' }) });
      };
    },
  });
  await espera(dom.window);
  return { win: dom.window, doc: dom.window.document, problemas, fechar: () => dom.window.close() };
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

(async () => {
  console.log('\nFALE CONOSCO — o rodapé da página pública, e os dois canais');

  console.log('\nA · o rodapé diz a que veio');
  {
    const { doc, fechar } = await abrir();
    const rodape = doc.querySelector('footer.rodape');
    const texto = rodape ? rodape.textContent : '';
    provar('o rodapé existe', Boolean(rodape));
    provar('o rodapé JÁ NÃO diz «Projeto Ciclo · raiz»', !/Projeto Ciclo/.test(texto), texto.trim());
    /* A ABA DO NAVEGADOR DIZIA O MESMO. A queixa dela foi sobre o rodapé, e o nome que ela leu
     * — «Projeto Ciclo Raiz» — aparecia duas vezes na mesma página: no rodapé e no título da
     * aba. Corrigir uma e deixar a outra era meio conserto. */
    provar('…nem o título da aba',
      (doc.querySelector('title') || {}).textContent === 'Sistema Lastro',
      (doc.querySelector('title') || {}).textContent);
    provar('o rodapé oferece o «Fale conosco»', Boolean(doc.getElementById('btn-fale-conosco')));
    provar('…e escreve o e-mail da casa', texto.indexOf(EMAIL) !== -1, texto.trim());
    const link = rodape ? rodape.querySelector('a[href^="https://wa.me/"]') : null;
    provar('…e o endereço do WhatsApp é o do wa.me, em dígitos com o país',
      Boolean(link) && link.getAttribute('href').indexOf('https://wa.me/' + WHATSAPP) === 0,
      link && link.getAttribute('href'));
    fechar();
  }

  console.log('\nB · o clique abre a janela, e a janela tem os três campos');
  {
    const { win, doc, problemas, fechar } = await abrir();
    const modal = doc.getElementById('modal-fale');
    provar('a janela nasce fechada', Boolean(modal) && modal.hidden === true);
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    provar('o «Fale conosco» abre a janela', modal.hidden === false);
    provar('…com o campo do e-mail', Boolean(doc.getElementById('fale-email')));
    provar('…com o campo do telefone', Boolean(doc.getElementById('fale-telefone')));
    provar('…e com a mensagem', Boolean(doc.getElementById('fale-mensagem')));
    /* A JANELA NÃO REPETE OS DOIS ENDEREÇOS (18/11/2026). Eles estão no rodapé, que é onde ela os
     * quis; repeti-los dentro do formulário era a mesma informação duas vezes no mesmo ecrã. */
    provar('a janela JÁ NÃO repete o e-mail e o WhatsApp — eles vivem no rodapé',
      !/lastro@padd\.com\.br/.test(modal.textContent), modal.textContent.replace(/\s+/g, ' ').slice(-90));

    /* AS TRÊS CORRECÇÕES DE FORMA (18/11/2026), e a do telefone é a que ela viu como defeito. */
    const caixa = modal.querySelector('.modal-caixa');
    provar('a janela é a LARGA — duas colunas, como o cadastro da escola',
      Boolean(caixa) && /modal-largo/.test(caixa.className), caixa && caixa.className);
    const telefone = doc.getElementById('fale-telefone');
    /* O CAMPO DO TELEFONE TEM DE SER UM CAMPO DA FOLHA. A folha desenha por TIPO, e `tel` não
     * está na lista: com `type="tel"` o campo saía com o desenho cru do navegador. A convenção
     * da casa — a mesma do cadastro da escola — é `inputmode="tel"` sem `type`. */
    provar('o telefone não é `type="tel"` (a folha não desenha esse tipo)',
      Boolean(telefone) && !telefone.getAttribute('type'), telefone && telefone.getAttribute('type'));
    provar('…mas o teclado do celular continua a ser o numérico',
      Boolean(telefone) && telefone.getAttribute('inputmode') === 'tel',
      telefone && telefone.getAttribute('inputmode'));
    const mensagem = doc.getElementById('fale-mensagem');
    provar('o placeholder da mensagem convida a pedir contacto',
      /autorize que um consultor entre em contato/i.test(mensagem.getAttribute('placeholder') || ''),
      mensagem.getAttribute('placeholder'));
    /* A INTRODUÇÃO FICOU NUMA LINHA. O texto longo («nada é enviado sem você mandar…») dizia o
     * que o comportamento já diz, e ela pediu só a primeira linha. */
    provar('a janela tem uma linha de introdução, e só uma',
      /Escreva aqui como quer falar conosco\./.test(modal.textContent)
      && !/Nada é enviado sem você mandar/.test(modal.textContent),
      modal.textContent.replace(/\s+/g, ' ').slice(0, 120));
    provar('a página não escreveu erro nenhum', problemas.length === 0, problemas.slice(0, 2));
    fechar();
  }

  console.log('\nC · o WhatsApp abre com a mensagem composta — e leva quem escreveu');
  {
    const { win, doc, fechar } = await abrir();
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    preencher(doc, {
      'fale-email': 'pessoa@exemplo.com.br',
      'fale-telefone': '(51) 98888-7777',
      'fale-mensagem': 'Queria saber como criar a escola da minha companhia.',
    });
    clicar(doc, 'fale-por-whatsapp');
    await espera(win, 50);

    const abriu = win.__abriu;
    provar('o clique abriu UM endereço', abriu.length === 1, abriu);
    const url = abriu[0] || '';
    provar('…e é o do WhatsApp da casa, com a mensagem no texto',
      url.indexOf('https://wa.me/' + WHATSAPP + '?text=') === 0, url.slice(0, 80));
    const texto = decodeURIComponent(url.split('?text=')[1] || '');
    provar('a mensagem leva o e-mail de quem escreve', texto.indexOf('pessoa@exemplo.com.br') !== -1,
      texto.slice(0, 160));
    provar('a mensagem leva o telefone de quem escreve', texto.indexOf('98888-7777') !== -1,
      texto.slice(0, 160));
    provar('a mensagem leva o que a pessoa escreveu',
      texto.indexOf('criar a escola da minha companhia') !== -1, texto.slice(0, 200));
    provar('e a página di-lo, em vez de ficar em silêncio',
      /WhatsApp/.test((doc.getElementById('fale-res') || {}).textContent || ''),
      (doc.getElementById('fale-res') || {}).textContent);

    /* O PEDIDO FICOU REGISTADO — a pergunta dela, na letra: «tá salvando isso aonde?». O gesto é
     * medido, e medido ANTES do canal: `wa.me` navega, e um pedido depois não chegaria. */
    const gestos = win.__gestos;
    provar('o clique REGISTA o pedido em /api/contato', gestos.length === 1, gestos.length);
    const corpoEnviado = gestos.length ? JSON.parse(gestos[0].replace(/^contato:/, '')) : {};
    provar('…com o e-mail, o telefone e a mensagem de quem escreveu',
      corpoEnviado.email === 'pessoa@exemplo.com.br'
      && /98888-7777/.test(String(corpoEnviado.telefone))
      && /companhia/.test(String(corpoEnviado.mensagem)), corpoEnviado);
    provar('…e o pedido é registado ANTES de o WhatsApp abrir (o canal navega e leva a página)',
      gestos.length === 1 && abriu.length === 1, { gestos: gestos.length, janelas: abriu.length });
    fechar();
  }

  console.log('\nC2 · se o registo falhar, o canal abre na mesma — e o recado não mente');
  {
    const { win, doc, fechar } = await abrir({ registoFalha: true });
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    preencher(doc, {
      'fale-telefone': '(54) 99175-2662',
      'fale-mensagem': 'Falha no registo, mas a mensagem tem de sair.',
    });
    clicar(doc, 'fale-por-whatsapp');
    await espera(win, 120);
    provar('o WhatsApp abre apesar da falha', win.__abriu.length === 1, win.__abriu.length);
    const recado = (doc.getElementById('fale-res') || {}).textContent || '';
    provar('…e o recado diz que o pedido NÃO ficou registado',
      /não conseguimos registar|Não conseguimos registar/i.test(recado), recado);
    provar('…e pede que a mensagem vá pelo canal',
      /envie por lá/i.test(recado), recado);
    provar('o botão volta a estar disponível', (doc.getElementById('fale-por-whatsapp') || {}).disabled === false);
    fechar();
  }

  console.log('\nD · sem mensagem, ou sem contacto, não se abre nada — e diz-se por quê');
  {
    const { win, doc, fechar } = await abrir();
    clicar(doc, 'btn-fale-conosco');
    await espera(win, 50);
    preencher(doc, { 'fale-email': 'pessoa@exemplo.com.br', 'fale-mensagem': '' });
    clicar(doc, 'fale-por-whatsapp');
    await espera(win, 50);
    provar('mensagem vazia: nada é aberto', win.__abriu.length === 0, win.__abriu);
    provar('…e o aviso pede a mensagem',
      /mensagem/i.test((doc.getElementById('fale-res') || {}).textContent || ''),
      (doc.getElementById('fale-res') || {}).textContent);

    preencher(doc, { 'fale-email': '', 'fale-telefone': '', 'fale-mensagem': 'Olá!' });
    clicar(doc, 'fale-por-whatsapp');
    await espera(win, 50);
    provar('sem e-mail nem telefone: nada é aberto', win.__abriu.length === 0, win.__abriu);
    provar('…e o aviso diz que sem um dos dois não há como responder',
      /e-mail|telefone/i.test((doc.getElementById('fale-res') || {}).textContent || ''),
      (doc.getElementById('fale-res') || {}).textContent);
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
