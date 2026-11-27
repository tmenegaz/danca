#!/usr/bin/env node
'use strict';

/*
 * provar-o-fim-do-convite.js — O VÉU COBRE A CRIAÇÃO, E O FIM DÁ O ENDEREÇO (26/11/2026).
 *
 * O QUE ELA RELATOU, e é o pedido inteiro:
 *
 *   «cliquei no botão criar a escola. Só que agora eu estou preso nessa página, criar a escola.
 *    Assim, não tem nada errado, nenhum erro. Mas ele não me mostrou um link para ir para a escola
 *    criada, não me deu nenhum feedback, nenhum retorno a respeito do processo, do que está
 *    acontecendo com essa etapa.»
 *
 * O QUE A PÁGINA FAZIA, e explica as duas queixas de uma vez. No clique, escrevia
 * «a criar o acesso…» num `<p class="res">` NO MEIO do formulário e desabilitava o botão. Quem
 * acabou de clicar está no FIM de uma página comprida, a olhar para o botão — o recado nasce fora do
 * campo de visão. E quando o servidor respondia `ok`, o endereço da escola ia **dentro de uma frase
 * em texto puro**, sem link e sem nada em que se pudesse clicar. Medido com o DOM desta página e um
 * `fetch` de mentira antes de mexer no código: o `«recado»` dizia «…o endereço da escola é
 * https://breu.padd.com.br.», havia **0** links, e o botão ficava desabilitado para sempre.
 *
 * O QUE ESTA PROVA MEDE, no DOM da página de verdade, com o `fetch` interceptado:
 *
 *   A. O VÉU, DURANTE — está de pé com `data-ocupado`, DIZ o passo, e o resto da página fica
 *      `inert` (o segundo clique não passa). É a peça do catálogo, e não um desenho novo.
 *   B. O FIM — o formulário sai, o bloco de resultado entra, e há um **link** para o endereço que o
 *      servidor devolveu, com o rótulo a dizer para onde vai.
 *   C. O ERRO — o véu SAI e a frase aparece. Um véu que fica preso sobre um erro é pior do que não
 *      haver véu: a página fica trancada sem dizer nada.
 *   D. A FALHA DE REDE — o véu sai, e a frase NÃO afirma «nada foi alterado»: o browser não sabe o
 *      que o servidor fez, e a promessa era dele, não do servidor.
 *
 * CONTROLE NEGATIVO, que é o que dá valor ao resto: as mesmas asserções correm contra o `HEAD` de
 * `motor/servidor/painel-html.js` — a página SEM esta correcção. A e B têm de falhar lá; se
 * passassem, a prova estaria a medir a si mesma.
 *
 *   node experimentos/provar-o-fim-do-convite.js
 *   node experimentos/provar-o-fim-do-convite.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { JSDOM } = require('jsdom');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');

let provas = 0;
let falhas = 0;
const provar = (titulo, condicao, detalhe) => {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
};

/**
 * A PÁGINA, do módulo que estiver à frente. No controlo negativo é o `HEAD` que a serve — a página
 * que ela viu. O módulo vem de um ficheiro temporário para não haver dois `require` do mesmo
 * caminho na cache do Node.
 */
function paginaDoModulo() {
  if (!NEGATIVO) return require(path.join(RAIZ, 'motor/servidor/painel-html.js')).paginaDoConvite;
  const fonte = execSync('git show HEAD:motor/servidor/painel-html.js', { cwd: RAIZ, encoding: 'utf8' });
  /* AO LADO DO ORIGINAL, e não no `/tmp`. O módulo faz `require('../../tools/templates/nav-html.js')`,
   * que é relativo ao SÍTIO dele — em `/tmp` não resolve, e o controlo negativo morria antes de
   * medir nada (e um `provar` que nunca corre é a forma mais barata de «passar»). O ficheiro é
   * apagado logo depois do `require`, que é síncrono. */
  const alvo = path.join(RAIZ, 'motor/servidor', '.painel-head-' + process.pid + '.js');
  fs.writeFileSync(alvo, fonte);
  try { return require(alvo).paginaDoConvite; } finally { fs.unlinkSync(alvo); }
}

const paginaDoConvite = paginaDoModulo();
const HTML = paginaDoConvite({
  escola: 'breu', nome: 'Breu', token: 'abc-123',
  catalogo: null, pix: null, estado: { ok: true }, retrato: null, identidade: null,
});

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Abre a página com um `fetch` que fica PENDENTE até a prova o resolver. */
function abrir(resposta) {
  const dom = new JSDOM(HTML, {
    runScripts: 'dangerously',
    url: 'https://lastro.padd.com.br/recriar/abc-123',
  });
  const w = dom.window;
  const d = w.document;
  const controlo = {};
  const promessa = new Promise((resolver) => { controlo.libertar = resolver; });
  controlo.pedidos = [];
  w.fetch = async (u) => {
    controlo.pedidos.push(String(u));
    await promessa;
    if (resposta instanceof Error) throw resposta;
    return { ok: true, status: 201, json: async () => resposta };
  };
  const campo = d.getElementById('convite-senha-escola');
  if (campo) campo.value = '2805';
  const botao = d.getElementById('convite-enviar');
  if (botao) botao.click();
  return { dom, w, d, controlo };
}

const veu = (d) => d.getElementById('convite-veu');
const ocupado = (d) => {
  const v = veu(d);
  return v ? v.getAttribute('data-ocupado') : null;
};

(async () => {
  console.log(NEGATIVO
    ? 'CONTROLE NEGATIVO — a página do HEAD, sem esta correcção'
    : 'A. O VÉU, DURANTE — cobre, tranca e diz o passo');

  {
    const c = abrir({ ok: true, escola: 'breu', nome: 'Breu', url: 'https://breu.padd.com.br' });
    await espera(60);
    provar('o pedido partiu', c.controlo.pedidos.length === 1, c.controlo.pedidos);
    provar('o véu está de pé (`data-ocupado`)', ocupado(c.d) === 'sim', ocupado(c.d));
    const texto = (c.d.getElementById('convite-veu-texto') || {}).textContent || '';
    provar('…e diz o que está a acontecer', /a criar a escola/.test(texto), texto);
    provar('…e o resto da página não recebe clique nem teclado (`inert`)',
      c.d.querySelector('main').inert === true, c.d.querySelector('main').inert);
    provar('…e o botão fica travado (o duplo clique não abre duas criações)',
      c.d.getElementById('convite-enviar').disabled === true);
    /* O VÉU NÃO PODE FICAR INERT ELE PRÓPRIO: é ele que anuncia o estado a quem lê com leitor de
     * ecrã, e um `role="status"` dentro de uma árvore inerte não é anunciado. */
    /* AUSENTE É UMA FALHA, E NÃO UMA EXCEPÇÃO. Na página do `HEAD` não há véu nenhum, e a prova
     * tem de o DIZER («falhou», três asserções) em vez de morrer com um `TypeError` na primeira —
     * uma prova que rebenta não distingue «o defeito está lá» de «a prova está mal escrita». */
    const v = veu(c.d);
    provar('…e o próprio véu NÃO fica inerte', Boolean(v) && !v.inert, v && v.inert);
    provar('…e ele é a peça da folha, não um desenho novo',
      Boolean(v) && v.className === 'veu-de-operacao', v && v.className);

    console.log('\nB. O FIM — o formulário sai e o endereço vem como LINK');
    c.controlo.libertar();
    await espera(120);
    const fim = c.d.getElementById('convite-fim') || c.d.createElement('section');
    provar('o véu sai', ocupado(c.d) === null, ocupado(c.d));
    provar('…e a página volta a responder (o `inert` sai)',
      c.d.querySelector('main').inert === false, c.d.querySelector('main').inert);
    provar('o formulário sai de cena', c.d.querySelector('main .conteudo').hidden === true);
    provar('…e o bloco do fim aparece',
      Boolean(c.d.getElementById('convite-fim')) && fim.hidden === false, fim.hidden);
    const a = fim && fim.querySelector('a');
    provar('há um LINK, e não uma frase a dizer o endereço',
      Boolean(a && a.getAttribute('href') === 'https://breu.padd.com.br'),
      a && a.getAttribute('href'));
    provar('…e o rótulo diz para onde ele leva',
      Boolean(a && /abrir breu\.padd\.com\.br/.test(a.textContent)), a && a.textContent);
    provar('…e o título nomeia a escola',
      /Breu/.test((fim.querySelector('h2') || {}).textContent || ''),
      (fim.querySelector('h2') || {}).textContent);
    /* O SEGUNDO TEMPO DO PROCESSO. O servidor responde em segundos e o motor leva minutos — a
     * página que não o disser deixa a pessoa a achar que o link está quebrado. */
    provar('…e diz que o motor ainda está a subir, e que a porta avisa enquanto isso',
      /GitHub/.test(fim.textContent) && /implanta/.test(fim.textContent), fim.textContent.slice(0, 120));
    provar('…e diz quando o acesso abre (a conciliação do Pix)',
      /concilia/.test(fim.textContent), fim.textContent.slice(0, 160));

    /* SEM URL NA RESPOSTA: não se inventa um link. O aviso manda ao painel, e o formulário sai
     * na mesma — a escola existe, e repetir o pedido criaria a segunda. */
    console.log('\nB-bis. SEM ENDEREÇO NA RESPOSTA — a página não inventa um link');
    const s = abrir({ ok: true, escola: 'breu', nome: 'Breu' });
    await espera(50);
    s.controlo.libertar();
    await espera(120);
    const fimS = s.d.getElementById('convite-fim') || s.d.createElement('section');
    provar('sem `url`, não há link nenhum', !fimS.querySelector('a'), fimS.querySelector('a'));
    provar('…e o bloco do fim existe de facto (a página do HEAD não tem nenhum)',
      Boolean(s.d.getElementById('convite-fim')));
    provar('…e o aviso diz onde encontrar a escola',
      /Escolas/.test(fimS.textContent), fimS.textContent.slice(0, 140));
  }

  console.log('\nC. O ERRO — o véu sai, e a frase aparece');
  {
    const c = abrir({ ok: false, erro: 'o plano «basico» não existe no catálogo' });
    await espera(50);
    provar('durante o pedido o véu estava de pé', ocupado(c.d) === 'sim', ocupado(c.d));
    c.controlo.libertar();
    await espera(120);
    provar('o véu sai quando o servidor recusa', ocupado(c.d) === null, ocupado(c.d));
    const recado = c.d.getElementById('convite-recado');
    provar('…e a frase do servidor chega à tela',
      /não existe no catálogo/.test(recado.textContent), recado.textContent);
    provar('…marcada como erro', /erro/.test(recado.className), recado.className);
    provar('…e o formulário continua onde estava (nada se perdeu)',
      c.d.querySelector('main .conteudo').hidden === false);
    provar('…e o botão volta a poder ser clicado',
      c.d.getElementById('convite-enviar').disabled === false);
  }

  console.log('\nD. A FALHA DE REDE — o véu sai, e a frase não promete o que o browser não sabe');
  {
    const c = abrir(new Error('fetch failed'));
    await espera(50);
    c.controlo.libertar();
    await espera(120);
    provar('o véu sai também quando o pedido morre na rede', ocupado(c.d) === null, ocupado(c.d));
    const recado = c.d.getElementById('convite-recado');
    provar('…e a frase manda CONFERIR, em vez de afirmar que nada aconteceu',
      /Escolas/.test(recado.textContent), recado.textContent);
    provar('…e NÃO diz «nada foi alterado» — o browser não sabe o que o servidor fez',
      !/nada foi alterado/.test(recado.textContent), recado.textContent);
    provar('…e o formulário volta a responder',
      c.d.getElementById('convite-enviar').disabled === false);
  }

  console.log('');
  if (falhas) {
    console.log((NEGATIVO ? 'CONTROLE NEGATIVO: ' : '') + 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.');
    process.exit(NEGATIVO ? 0 : 1);
  }
  console.log('TUDO CERTO — ' + provas + ' asserções: o véu cobre a criação, o resto da página fica '
    + 'trancado, e o fim dá o endereço como link — com o erro e a falha de rede a levantarem o véu.');
})();
