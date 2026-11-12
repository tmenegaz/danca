#!/usr/bin/env node
'use strict';

/*
 * provar-o-veu-de-cada-gesto.js — UM VÉU, TODOS OS GESTOS (12/11/2026).
 *
 * O QUE MOTIVOU, na letra dela: «Nós fizemos uma solução na alteração da turma ou na criação da
 * turma. E aí a gente tem um véu, tem um spinning e tem a mensagem. […] Acontece que não podemos ter
 * decisões conflitantes, e o conflito está justamente na audição. Quando eu edito ou eu crio um
 * elenco na audição […] eu não tenho a mesma solução apresentada. […] Eu já tenho ali na audição a
 * mesma solução quando eu cancelo um processo. Mas quando eu vou concluir o elenco, não, é uma outra
 * solução e não pode ser assim. Tem que ser a mesma solução.»
 *
 * A CAUSA, medida. Dois sítios chamavam `ocuparBotao(botao, "gravando...", "button")` — um BOTÃO
 * onde a função esperava um FORMULÁRIO. Ela fazia `form.querySelector("button[type=submit]")`,
 * que dentro de um `<button>` não acha nada, e devolvia `null` ANTES de chamar `ocupar`. Nenhum
 * véu, nenhum giro, nenhuma frase — e nenhum erro na consola, porque `return null` é um caminho
 * legítimo. Os dois gestos sem véu eram o «Concluir elenco» e o «Ler as anamneses».
 *
 * E o terceiro argumento era o `id` de um elemento passado no lugar da etiqueta: onde se lia
 * `"button"`, a etiqueta do véu diria a palavra «button».
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   1. A CAUSA — `ocuparBotao` aceita um botão e um formulário, e nenhum sítio do cliente passa o
 *      literal `"button"` como terceiro argumento. É a asserção que reprovava o código de antes.
 *   2. O ELENCO — criar, regravar e guardar rascunho levantam O MESMO véu, com a etiqueta «Elenco»
 *      e a frase do passo; o botão diz «Criar elenco» quando é novo e «Gravar elenco» quando há um
 *      aberto — a decisão dela, entre «selecionar» e «criar», foi «dinâmico».
 *   3. A LEITURA DAS ANAMNESES — o gesto do passo 3, que também estava sem véu.
 *   4. O VERBETE — gravar levanta o véu com a etiqueta «Verbete»; e a listagem diz se o exercício
 *      está EM TURMA ou LIVRE, que é o que muda o que a gravação faz (ajuste com histórico, ou
 *      correcção no lugar).
 *   5. A SALA — cadastro, edição e derivação: as três levantam o véu, e as três dizem coisas
 *      diferentes porque as coisas são diferentes.
 *   6. É O MESMO ELEMENTO — em todos os gestos, o véu é o `#veu` com `.veu-cartao`, a mesma peça da
 *      folha, com `role="status"` e o `data-ocupado`. Não há uma segunda solução em lado nenhum.
 *
 * CONTROLE NEGATIVO: `--controle-negativo` corre a página de `REF_NEGATIVO`.
 *
 *   node experimentos/provar-o-veu-de-cada-gesto.js
 *   REF_NEGATIVO=fa3bea6a node experimentos/provar-o-veu-de-cada-gesto.js --controle-negativo
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const negativo = process.argv.indexOf('--controle-negativo') !== -1;
const REF = process.env.REF_NEGATIVO || 'HEAD';

let destino = RAIZ;
if (negativo) {
  destino = fs.mkdtempSync(path.join(os.tmpdir(), 'veu-gestos-'));
  execSync('git archive ' + REF + ' motor modelo porta biblioteca tools teste | tar -x -C '
    + JSON.stringify(destino), { cwd: RAIZ, stdio: 'pipe' });
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(destino, 'node_modules'), 'dir');
  console.log('CONTROLE NEGATIVO contra ' + REF + '\n');
}

const bastidores = require(path.join(destino, 'motor/servidor/bastidores.js'));

let n = 0;
let falhas = 0;
function provar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const usos = { professores: new Set(), alunas: new Set(), turmas: new Set(), termos: new Set() };
const LINHAS = [{
  id: 'e1', nome: 'Elenco Um', professor: 'pe-torto', alunas: ['Aluna A'],
  campos: [{ id: 'x', nome: 'X' }], carimbo: '20260101-0900', chave: 'e1--20260101-0900.json',
}];
function pagina(linhas) {
  return bastidores.paginaProducao('calango',
    { professor: 'pe-torto', escola: 'calango', query: 'professor=pe-torto&escola=calango' },
    [{ nome: 'Pe Torto', slug: 'pe-torto' }], ['Aluna A'], 'Pe Torto', 'pe-torto',
    [{ nome: 'Piano', frequencia: 2, dias: ['qua'], duracaoMin: 60,
      periodoInicio: '2026-11-20', periodoFim: '2026-12-20' }],
    [], {}, [], [], [], usos, { modo: 'clara', paleta: 'bordo' }, '', linhas || LINHAS);
}
const HTML = pagina();

// ==========================================================================================
console.log('1. A CAUSA — o véu não aparecia porque a função recusava um botão');

{
  const fonte = fs.readFileSync(path.join(destino, 'motor/servidor/bastidores.js'), 'utf8');
  /* A ASSERÇÃO É SOBRE O TEXTO DO CLIENTE, e é a que reprova o código de antes: o literal
   * `"button"` no TERCEIRO argumento é o `id` de um elemento passado como etiqueta.
   *
   * E ELA OLHA SÓ AS LINHAS EMITIDAS — as que começam por `'`, que são as que vão para a página.
   * A primeira versão procurava no ficheiro inteiro e encontrou o COMENTÁRIO que narra o defeito,
   * a citar a chamada antiga: uma asserção que procura texto no código encontra também o texto que
   * fala dele. É a mesma armadilha que a prova do elenco sem ninguém já pagou. */
  const emitidaComButton = /^\s*'[^']*ocuparBotao\([^)]*,\s*"button"\s*\)/m.exec(fonte);
  provar('nenhum sítio EMITIDO passa o id «button» como etiqueta do véu',
    emitidaComButton === null, emitidaComButton && emitidaComButton[0].trim());
  /* E a função tem de aceitar as duas formas — o nome do teste é o que a distingue. */
  provar('`ocuparBotao` aceita um botão, e não só um formulário',
    /tagName/.test(fonte) && /"BUTTON"/.test(fonte), 'procura no cliente');
  provar('…e a frase do véu é um argumento próprio, separado do rótulo do botão',
    /function ocuparBotao\(alvo, rotulo, etiqueta, frase\)/.test(fonte), 'assinatura');
}

// ==========================================================================================
(async () => {
  let JSDOM, VirtualConsole;
  try { ({ JSDOM, VirtualConsole } = require(path.join(RAIZ, 'node_modules', 'jsdom'))); } catch (e) {
    console.error('jsdom ausente: ' + e.message);
    process.exit(2);
  }

  /* O `nav.js` ENTRA NA PROVA (12/11/2026) — e é ele que constrói o cartão do véu. A página traz
   * o seu `<div id="veu">` simples; quem o normaliza em `.veu-cartao` + `.veu-etiqueta` +
   * `.veu-texto` é o módulo, que é o único script de TODAS as páginas. Uma prova sem ele media um
   * véu que o produto não tem: sem etiqueta e sem cartão — e a asserção da etiqueta reprovava por
   * causa da bancada, não do código. */
  const NAVJS = fs.readFileSync(path.join(destino, 'tools/templates/nav.js'), 'utf8');
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  vc.on('error', () => {});
  const dom = new JSDOM(HTML.replace(/<script src="[^"]*"><\/script>/g, '')
    .replace('</body>', '<script>' + NAVJS + '</script></body>'), {
    runScripts: 'dangerously',
    url: 'https://calango.workers.dev/bastidores/producao',
    pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {} });
      w.confirm = () => true;
      w.alert = () => {};
      /* O SERVIDOR, EM MINIATURA. O que importa é o que cada rota devolve para a tela poder
       * continuar o seu caminho — a resposta demora de propósito, para se poder ler o véu de pé. */
      w.fetch = (u) => {
        const url = String(u);
        const corpo = url.indexOf('alunas-com-anamnese') !== -1
          ? { ok: true, alunas: [{ aluna: 'Aluna A', carimbo: 'a1', novo: false, lidaEm: null }] }
          : url.indexOf('campos-do-corpo') !== -1
            ? { ok: true, campos: [{ id: 'x', nome: 'X', grupo: 'g', eixo: 'Técnica',
                dimensao: 'tecnica', opcoes: ['A', 'B'] }], grupos: ['g'] }
            : url.indexOf('linha-de-base/leitura') !== -1
              ? { ok: true, leitura: { alunas: ['Aluna A'] },
                  classificacao: { alunos: [], atencao: [], excelencia: [], musicalidade: [],
                    comuns: [], semRegisto: [] } }
              : url.indexOf('linhas-de-base') !== -1
                ? { ok: true, linhas: LINHAS, revisoes: {},
                    elencos: bastidores.elencosComAsTurmas(LINHAS, []) }
                : url.indexOf('/verbete') !== -1
                  ? { ok: true, versao: 5, posicoes: [], verbetes: {}, exercicios: [
                      { nome: 'Plié', posicao: null, descontinuado: false, emTurma: ['Piano'],
                        porMusica: [{ chave: '8|4/4', tempos: '8', compasso: '4/4', trechos: 2,
                          direcoes: [], orientacoes: [], categorias: ['passo'],
                          escola: 'calango', cobre: 8 }] },
                      { nome: 'Tendu', posicao: null, descontinuado: false, emTurma: [],
                        porMusica: [{ chave: '8|4/4', tempos: '8', compasso: '4/4', trechos: 1,
                          direcoes: [], orientacoes: [], categorias: ['passo'],
                          escola: 'calango', cobre: 8 }] },
                      { nome: 'Jeté', posicao: null, descontinuado: false, emTurma: null,
                        porMusica: [{ chave: '8|4/4', tempos: '8', compasso: '4/4', trechos: 1,
                          direcoes: [], orientacoes: [], categorias: ['salto'],
                          escola: 'calango', cobre: 8 }] }] }
                  : { ok: true };
        return new Promise((res) => w.setTimeout(() => res({
          ok: true, status: 200,
          json: () => Promise.resolve(corpo),
          text: () => Promise.resolve(JSON.stringify(corpo)),
        }), 60));
      };
    },
  });
  const win = dom.window;
  const doc = win.document;
  await new Promise((r) => win.setTimeout(r, 500));

  const veu = () => {
    const v = doc.getElementById('veu');
    if (!v) return { existe: false };
    const cartao = v.querySelector('.veu-cartao');
    const etiqueta = v.querySelector('.veu-etiqueta');
    const texto = v.querySelector('.veu-texto');
    return {
      existe: true,
      ocupado: v.getAttribute('data-ocupado'),
      papel: v.getAttribute('role'),
      vivo: v.getAttribute('aria-live'),
      temCartao: Boolean(cartao),
      etiqueta: etiqueta ? etiqueta.textContent.trim() : '',
      frase: texto ? texto.textContent.trim() : '',
    };
  };
  /* O VÉU, LIDO NO INSTANTE DO CLIQUE — e não depois. As rotas respondem, e a resposta baixa o
   * véu; medir depois media o vazio. É a mesma armadilha que já custou uma medição errada nesta
   * sessão. */
  const durante = async (fn) => {
    const promessa = fn();
    const agora = veu();
    await promessa;
    await new Promise((r) => win.setTimeout(r, 120));
    return { agora, depois: veu() };
  };

  // ========================================================================================
  console.log('\n2. O ELENCO — criar, regravar e o rascunho, com o mesmo véu');

  {
    /* CRIAR: sem id aberto. É o gesto que ela chamou «criar um elenco». */
    doc.getElementById('lb-modo').value = '';
    win.pintarTravasLb();
    const botao = doc.getElementById('lb-enviar');
    provar('sem elenco aberto, o botão diz «Criar elenco»',
      botao.textContent.trim() === 'Criar elenco', botao.textContent.trim());
    provar('…e o `title` usa o verbo do gesto («Para criar…»)',
      /^Para criar, falta /.test(botao.getAttribute('title') || ''), botao.getAttribute('title'));
    const r = await durante(() => win.gravarLinha(false, 'lb-enviar', true));
    provar('criar levanta O véU', r.agora.ocupado === 'sim', r.agora);
    provar('…com a etiqueta «Elenco»', r.agora.etiqueta === 'Elenco', r.agora.etiqueta);
    provar('…e a frase de quem CRIA, com a consequência',
      /a criar o Elenco e a revincular as Turmas/.test(r.agora.frase), r.agora.frase);
    provar('…e o véu sai quando a gravação acaba', r.depois.ocupado === null, r.depois.ocupado);
  }
  {
    /* REGRAVAR: com um elenco aberto. É o gesto de editar. */
    doc.getElementById('lb-modo').value = 'e1';
    win.pintarTravasLb();
    const botao = doc.getElementById('lb-enviar');
    provar('com um elenco aberto, o botão diz «Gravar elenco»',
      botao.textContent.trim() === 'Gravar elenco', botao.textContent.trim());
    provar('…e o `title` usa o verbo do gesto («Para gravar…», e não «Para concluir…»)',
      /^Para gravar, falta /.test(botao.getAttribute('title') || ''), botao.getAttribute('title'));
    const r = await durante(() => win.gravarLinha(false, 'lb-enviar', true));
    provar('regravar levanta o véu', r.agora.ocupado === 'sim', r.agora);
    provar('…e diz que é uma VERSÃO NOVA — não a mesma frase do criar',
      /nova versão do Elenco/.test(r.agora.frase), r.agora.frase);
  }
  {
    /* O RASCUNHO: guardar sem concluir não escreve versão nenhuma, e a frase di-lo. */
    doc.getElementById('lb-modo').value = 'e1';
    const r = await durante(() => win.gravarLinha(false, 'lb-seguir', false));
    provar('guardar o rascunho também levanta o véu', r.agora.ocupado === 'sim', r.agora);
    provar('…com a frase de quem só grava', r.agora.frase === 'a gravar o Elenco…', r.agora.frase);
  }
  /* A FRASE DO VÉU É CURTA NO BOTÃO E LONGA NO VÉU — a lição da primeira tentativa, em que a
   * frase inteira esticava o botão por uma linha e meia. */
  {
    doc.getElementById('lb-modo').value = 'e1';
    const botao = doc.getElementById('lb-enviar');
    /* LIDO NO INSTANTE, e não depois: a resposta repõe o rótulo, e medir no fim media o repouso. */
    const promessa = win.gravarLinha(false, 'lb-enviar', true);
    const rotuloDurante = botao.textContent;
    const fraseDurante = veu().frase;
    await promessa;
    provar('o RÓTULO do botão durante o gesto é curto («gravando...»)',
      /gravando/.test(rotuloDurante), rotuloDurante);
    provar('…e a FRASE longa fica no véu, onde há espaço',
      fraseDurante.length > 40, fraseDurante);
  }

  // ========================================================================================
  console.log('\n3. A LEITURA DAS ANAMNESES — o gesto do passo 3, que também estava sem véu');

  {
    doc.getElementById('lb-modo').value = 'e1';
    /* A aluna tem de estar MARCADA: o passo 3 recusa sem escolha, e essa recusa é anterior ao
     * véu — de propósito. */
    const caixa = doc.querySelector('input[name="lb-aluna"]');
    provar('há uma aluna para marcar (o passo 3 exige escolha)', Boolean(caixa));
    if (caixa) {
      caixa.checked = true;
      const r = await durante(() => { win.lerAnamneses(); return Promise.resolve(); });
      provar('ler as anamneses levanta o véu', r.agora.ocupado === 'sim', r.agora);
      provar('…com a etiqueta «Leitura das anamneses»',
        r.agora.etiqueta === 'Leitura das anamneses', r.agora.etiqueta);
      provar('…e a frase do passo', /a ler as anamneses/.test(r.agora.frase), r.agora.frase);
    }
  }

  // ========================================================================================
  console.log('\n4. O VERBETE — o véu, e a etiqueta que diz se está em turma');

  {
    const r = await durante(() => win.enviar('/api/bastidores/verbete', { nome: 'Plié' },
      'gravando...', false, function () {}));
    provar('gravar o verbete levanta o véu', r.agora.ocupado === 'sim', r.agora);
    provar('…com a etiqueta «Verbete»', r.agora.etiqueta === 'Verbete', r.agora.etiqueta);
    provar('…e a frase diz a consequência (as Turmas que o usam)',
      /reavaliar as Turmas que o usam/.test(r.agora.frase), r.agora.frase);
  }
  await new Promise((r) => win.setTimeout(r, 200));
  {
    const linhas = [...doc.querySelectorAll('#lista-verbetes li')];
    const selosDe = (nome) => {
      const li = linhas.find((x) => (x.textContent || '').indexOf(nome) === 0);
      if (!li) return null;
      return [...li.querySelectorAll('.selo')].map((s) => s.textContent.trim());
    };
    provar('a lista de verbetes tem os três exercícios', linhas.length === 3,
      linhas.map((l) => l.textContent.slice(0, 12)));
    provar('o exercício que compõe um plano diz «em turma»',
      (selosDe('Plié') || []).indexOf('em turma') !== -1, selosDe('Plié'));
    provar('…e o que não compõe nenhum diz «livre»',
      (selosDe('Tendu') || []).indexOf('livre') !== -1, selosDe('Tendu'));
    provar('…e o que não se conseguiu verificar NÃO é chamado «livre»',
      (selosDe('Jeté') || []).indexOf('livre') === -1, selosDe('Jeté'));
    /* A ETIQUETA NÃO É ORNAMENTO: é o que diz qual dos dois gestos vai acontecer. */
    const doPlie = linhas.find((x) => (x.textContent || '').indexOf('Plié') === 0);
    const titulo = doPlie
      ? (doPlie.querySelector('.selo.vinculada') || {}).getAttribute
        ? doPlie.querySelector('.selo.vinculada').getAttribute('title') : ''
      : '';
    provar('…e a dica diz que gravar é um AJUSTE, com o histórico',
      /AJUSTE/.test(titulo) && /histórico/.test(titulo), titulo);
  }

  // ========================================================================================
  console.log('\n5. A SALA — cadastro, edição e derivação, as três com véu');

  const preencherSala = (nome) => {
    doc.getElementById('tnome').value = nome;
    const dia = doc.querySelector('input[name="dia"]');
    if (dia) dia.checked = true;
    if (doc.getElementById('tduracao')) doc.getElementById('tduracao').value = '60';
    if (doc.getElementById('tinicio')) doc.getElementById('tinicio').value = '2026-11-20';
    if (doc.getElementById('tfim')) doc.getElementById('tfim').value = '2026-12-20';
  };
  const submeterSala = () => doc.getElementById('form-turma')
    .dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));

  {
    doc.getElementById('tderivar').value = '';
    preencherSala('Sala Nova');
    const r = await durante(() => { submeterSala(); return Promise.resolve(); });
    provar('cadastrar a Sala levanta o véu', r.agora.ocupado === 'sim', r.agora);
    provar('…com a etiqueta «Cadastro da Sala»', r.agora.etiqueta === 'Cadastro da Sala',
      r.agora.etiqueta);
  }
  {
    doc.getElementById('tderivar').value = 'sala-1';
    doc.getElementById('tmodo').value = 'editar';
    preencherSala('Sala Nova');
    const r = await durante(() => { submeterSala(); return Promise.resolve(); });
    provar('editar a Sala LIVRE levanta o véu', r.agora.ocupado === 'sim', r.agora);
    provar('…e diz que grava no lugar («Gravação da Sala», e não «Ajuste»)',
      r.agora.etiqueta === 'Gravação da Sala', r.agora.etiqueta);
  }
  {
    doc.getElementById('tderivar').value = 'sala-1';
    doc.getElementById('tmodo').value = 'derivar';
    doc.getElementById('tvigencia').value = '2026-12-01';
    preencherSala('Sala Nova');
    const r = await durante(() => { submeterSala(); return Promise.resolve(); });
    provar('ajustar a Sala VINCULADA levanta o véu', r.agora.ocupado === 'sim', r.agora);
    provar('…e diz o que a derivação faz de diferente (reler o ritmo, reencadear)',
      r.agora.etiqueta === 'Ajuste da Sala' && /reencadear/.test(r.agora.frase), r.agora);
  }

  // ========================================================================================
  console.log('\n6. É O MESMO VÉU EM TODOS — uma peça, não uma por página');

  {
    const v = veu();
    provar('o véu é o `#veu` com o `.veu-cartao` da folha', v.existe && v.temCartao, v);
    provar('…e anuncia-se a quem ouve (role=status, aria-live)',
      v.papel === 'status' && /polite/.test(String(v.vivo)), v);
    /* O GIRO é do `.veu-cartao::before`, na folha — a mesma peça para todos os gestos. O que a
     * prova pode medir aqui é que ele vem da folha e não de uma regra da página. */
    const fonteFolha = fs.readFileSync(path.join(destino, 'tools/templates/ciclo.css'), 'utf8');
    provar('o giro é a peça da folha (`.veu-cartao::before` com `veu-gira`)',
      /\.veu-cartao::before\s*\{[^}]*veu-gira/.test(fonteFolha.replace(/\n/g, ' ')), 'procura na folha');
    /* E a página NÃO redescreve o véu: uma segunda regra seria a segunda solução que ela recusou. */
    const fontePagina = fs.readFileSync(path.join(destino, 'motor/servidor/bastidores.js'), 'utf8');
    provar('a página não inventa um segundo véu (nenhum CSS de `.veu` no cliente)',
      !/\.veu\s*\{[^}]*position:\s*fixed/.test(fontePagina), 'procura no cliente');
  }

  win.close();
  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + n
    : 'TUDO CERTO — ' + n + ' asserções: elenco, leitura, verbete e sala levantam o MESMO véu,'
      + ' com a etiqueta e a frase do seu passo.'));

  if (negativo) {
    if (falhas === 0) { console.log('A PROVA NÃO PROVA NADA: o código de antes passou tudo.'); process.exit(1); }
    console.log('Como esperado: o código de antes reprova ' + falhas + ' de ' + n + '.');
    process.exit(0);
  }
  process.exit(falhas ? 1 : 0);
})().catch((e) => {
  console.error('A prova rebentou: ' + (e && e.stack || e));
  process.exit(1);
});
