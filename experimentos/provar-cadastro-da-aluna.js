'use strict';

/**
 * provar-cadastro-da-aluna.js — O CADASTRO EM DOIS PASSOS E A ANAMNESE POR MODALIDADE
 * (18/11/2026).
 *
 * O QUE ELA PEDIU, na letra:
 *
 *   «Eu cadastro alunas, aí eu coloco aqui o apelido da aluna […] Aí quando eu cadastrar a aluna,
 *   eu vou colocar aqui um outro step no cadastro da aluna que eu vou dizer que se chama anamnese
 *   […] eu vou escolher nessa etapa da anamnese a modalidade primeiro e aí a modalidade vai listar
 *   somente os professores daquela modalidade.»
 *
 * E a pergunta que decidiu o resto — o que acontece quando a aluna já tem uma anamnese e muda de
 * modalidade, ou faz outra na mesma: «no momento em que ela escolhe mudar de modalidade ou ter
 * mais uma modalidade […] tem que ser feito a anamnese dela para ver o retrato dela atual».
 *
 * O QUE ESTA PROVA MEDE, e por que cada coisa:
 *
 *   1. **O vínculo é o par (aluna × modalidade), e não um campo da aluna.** Duas modalidades são
 *      dois vínculos, com professores diferentes — é o que a secretária tem de poder dizer.
 *   2. **Derivar na MESMA modalidade põe o elo anterior no histórico** (`substituidaPor`): é uma
 *      segunda anamnese do mesmo par, e as duas não podem valer ao mesmo tempo.
 *   3. **Derivar para OUTRA modalidade não derruba o anterior**: ela passa a fazer as duas coisas.
 *      A regra é da modalidade, e não do gesto de carregar no botão.
 *   4. **O correio diz a verdade quando não sai.** Sem `RESEND_API_KEY`, ou com um professor sem
 *      e-mail, a resposta diz `enviado: false` e o motivo escrito — nunca finge que avisou. É a
 *      diferença entre «o professor sabe» e «o professor não sabe», e quem cadastrou tem de a ver.
 *   5. **A listagem diz o que ela pediu**: o nome, o selo, e a linha do vínculo com a modalidade,
 *      a turma, o professor e o estado da anamnese. E o «ajustado em» leva o motivo, quando há.
 *
 * O QUE ESTA PROVA **NÃO** MEDE: a entrega do e-mail. O Resend é HTTP e externo; o que se prova
 * aqui é o DESFECHO que a rota devolve, que é o que a tela mostra.
 *
 * Sem navegador: as rotas correm em processo, com um KV de memória. **Nada toca no ar.**
 *
 *   node experimentos/provar-cadastro-da-aluna.js
 */

const path = require('path');

const raiz = path.resolve(__dirname, '..');
const bastidores = require(path.join(raiz, 'motor/servidor/bastidores.js'));

const provas = [];
function provar(titulo, condicao, detalhe) {
  provas.push({ titulo, ok: !!condicao, detalhe });
  console.log('  ' + (condicao ? 'ok    ' : 'FALHOU') + ' ' + titulo +
    (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/** Um KV de memória — o mesmo que as outras provas usam. */
function criarKV(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(chave) { return dados.has(chave) ? dados.get(chave) : null; },
    async put(chave, valor) { dados.set(chave, String(valor)); },
    async delete(chave) { dados.delete(chave); },
    async list() { return { keys: [], list_complete: true }; },
  };
}

/* As chaves são as do store, e o prefixo é `bastidores/<escola>/` — não o caminho do Git. */
const RAIZ = 'bastidores/breu';
const ESCOLA = 'breu';

function ambiente(kv) {
  return {
    ESCOLA_SLUG: ESCOLA,
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'segredo',
    PADD_KV: kv,
  };
}

async function pedir(env, caminho, corpo) {
  const opcoes = corpo
    ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    }
    : {};
  const r = await bastidores.fetch(new Request('https://breu.example' + caminho, opcoes), env);
  let dados = null;
  try { dados = await r.json(); } catch (e) { dados = null; }
  return { status: r.status, dados };
}

async function principal() {
  /* Um professor com e-mail e outro sem — é essa diferença que faz o desfecho do correio ser
   * dois desfechos, e não um. A modalidade é o que filtra quem pode fazer a anamnese.
   *
   * O E-MAIL VIVE NO `contato`, e não no registo (18/11/2026). A prova punha-o no registo do
   * professor — uma forma que a página nunca grava —, e por isso passava sobre um defeito que
   * existia: a rota do vínculo lia o campo errado e dizia «não tem e-mail» com a ficha cheia. Uma
   * prova com uma fixture que a realidade não produz não mede a realidade. */
  const kv = criarKV({
    [RAIZ + '/professores']: JSON.stringify([
      { nome: 'Demi Plier', slug: 'demi-plier' },
      { nome: 'Redinha Rosa', slug: 'redinha-rosa' },
    ]),
    'professores/demi-plier/contato': JSON.stringify({ email: 'demi@example.test' }),
    /* As alunas do cadastro — sem elas a listagem não tem cartão nenhum para desenhar, e as
     * asserções da secção F mediriam uma página vazia a passar. */
    [RAIZ + '/alunas']: JSON.stringify(['Vavá', 'Tami']),
  });
  const env = ambiente(kv);
  /* A SENHA DA DIREÇÃO É UM TOKEN ASSINADO, e não uma palavra: quem o emite é a rota do login, e é
   * por isso que esta prova entra pela porta da frente em vez de forjar um. Uma prova que
   * fabricasse o token estaria a medir a sua própria forja, e não a autorização. */
  const entrada = await pedir(env, '/api/bastidores/validar-producao', { senha: 'segredo' });
  const TOKEN = entrada.dados && entrada.dados.token;
  if (!TOKEN) {
    console.error('não consegui entrar como direção:', JSON.stringify(entrada));
    process.exitCode = 1;
    return;
  }

  console.log('\nA — o vínculo nasce no segundo passo, e o e-mail não finge');
  const r1 = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'Demi Plier', token: TOKEN,
  });
  provar('o vínculo é gravado (201)', r1.status === 201, r1.dados && r1.dados.erro);
  provar('o vínculo é o par aluna × modalidade',
    r1.dados && r1.dados.matricula && r1.dados.matricula.aluna === 'Vavá'
    && r1.dados.matricula.modalidade === 'Balé clássico');
  provar('o id do vínculo é derivado do par, e não do carimbo',
    r1.dados && r1.dados.matricula && /^vava-bale/.test(r1.dados.matricula.id),
    r1.dados && r1.dados.matricula && r1.dados.matricula.id);

  const comEmail = r1.dados && r1.dados.correio;
  provar('sem RESEND_API_KEY o correio NÃO sai, e a resposta di-lo',
    comEmail && comEmail.enviado === false && String(comEmail.motivo || '').length > 0,
    comEmail);
  /* O DESTINO É LIDO DO `contato` (18/11/2026). Sem esta asserção, a prova aceitava o motivo
   * «o professor não tem e-mail» como se fosse «falta a chave» — os dois são `enviado: false`, e a
   * tela mostra um deles. É esta a diferença que ela via: a ficha com o e-mail e a mensagem a
   * dizer que ele não existia. */
  provar('o destino é o e-mail do `contato`, e o motivo é a chave — não a falta de e-mail',
    comEmail && /RESEND_API_KEY/.test(String(comEmail.motivo || ''))
    && Array.isArray(comEmail.para) && comEmail.para.indexOf('demi@example.test') !== -1,
    comEmail);

  const r1b = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Tami', modalidade: 'Jazz', professor: 'Redinha Rosa', token: TOKEN,
  });
  provar('professor SEM e-mail no cadastro: grava (201) e o motivo é o professor',
    r1b.status === 201 && r1b.dados.correio && r1b.dados.correio.enviado === false
    && /e-mail/.test(String(r1b.dados.correio.motivo)),
    r1b.dados && r1b.dados.correio);

  /* O PRINCIPAL NÃO TEM `contato` — ele nasceu com a escola, e o e-mail dele ficou no cadastro
   * dela (`professorEmail`). É a mesma queda que a ficha já faz, e a rota do vínculo tem de a
   * fazer também: senão a pessoa que criou a escola — a que mais cadastra alunas — nunca teria
   * para onde mandar o pedido de anamnese. */
  const kvDono = criarKV({
    [RAIZ + '/professores']: JSON.stringify([]),
    [RAIZ + '/alunas']: JSON.stringify([]),
    [RAIZ + '/cadastro']: JSON.stringify({ professorEmail: 'dono@example.test' }),
  });
  const envDono = Object.assign(ambiente(kvDono),
    { PROFESSOR_SLUG: 'dono-da-escola', PROFESSOR_NOME: 'Dono da Escola' });
  const entradaDono = await pedir(envDono, '/api/bastidores/validar-producao', { senha: 'segredo' });
  const rDono = await pedir(envDono, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'dono-da-escola',
    /* O CPF PASSOU A SER OBRIGATÓRIO (18/11/2026) — é o que distingue duas pessoas com o mesmo
     * apelido e o que permite reconhecer quem volta. Sintético e válido (11 dígitos, com o
     * verificador a fechar): um número de prova não pode pertencer a ninguém. */
    cpf: '11144477735',
    token: entradaDono.dados && entradaDono.dados.token,
  });
  const cDono = rDono.dados && rDono.dados.correio;
  provar('o principal, sem `contato`, cai no `professorEmail` do cadastro da escola',
    rDono.status === 201 && cDono && Array.isArray(cDono.para)
    && cDono.para.indexOf('dono@example.test') !== -1,
    cDono);

  console.log('\nB — as recusas que não podem passar em silêncio');
  const semModalidade = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', professor: 'Demi Plier', token: TOKEN,
  });
  provar('sem modalidade é 400 — é ela que diz quem pode fazer a anamnese',
    semModalidade.status === 400, semModalidade.dados && semModalidade.dados.erro);
  const semProfessor = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Jazz', token: TOKEN,
  });
  provar('sem professor é 400', semProfessor.status === 400);
  const intruso = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Jazz', professor: 'Quem Não É Daqui', token: TOKEN,
  });
  provar('professor de fora da escola é 400', intruso.status === 400,
    intruso.dados && intruso.dados.erro);
  const semSenha = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Jazz', professor: 'Demi Plier',
  });
  provar('sem a senha da direção é 401', semSenha.status === 401);

  console.log('\nC — a outra modalidade NÃO derruba a primeira');
  const jazz = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Jazz', professor: 'Demi Plier', token: TOKEN,
  });
  provar('a segunda modalidade é gravada (201)', jazz.status === 201);
  const listaC = await pedir(env, '/api/bastidores/matriculas');
  const vinculosC = (listaC.dados && listaC.dados.matriculas) || [];
  const daVavaC = vinculosC.filter((m) => m.aluna === 'Vavá');
  provar('a aluna tem DOIS vínculos vigentes', daVavaC.length === 2,
    daVavaC.map((m) => m.modalidade));
  provar('e nenhum dos dois desceu ao histórico',
    daVavaC.every((m) => !m.substituidaPor));

  console.log('\nD — derivar na MESMA modalidade põe o anterior no histórico');
  const idBallet = daVavaC.find((m) => /^vava-bale/.test(m.id)).id;
  const derivada = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'Redinha Rosa',
    derivarDe: idBallet, motivo: 'a aluna pediu para mudar de professora', token: TOKEN,
  });
  provar('a derivação é gravada (201)', derivada.status === 201,
    derivada.dados && derivada.dados.erro);
  provar('o elo novo diz de quem é filho',
    derivada.dados && derivada.dados.matricula && derivada.dados.matricula.substitui === idBallet);
  provar('o motivo fica no elo novo — é ele que a etiqueta mostra',
    derivada.dados && derivada.dados.matricula
    && derivada.dados.matricula.motivoDoAjuste === 'a aluna pediu para mudar de professora');

  const listaD = await pedir(env, '/api/bastidores/matriculas');
  const vinculosD = (listaD.dados && listaD.dados.matriculas) || [];
  const daVavaD = vinculosD.filter((m) => m.aluna === 'Vavá');
  provar('continuam dois vínculos VIGENTES (o de jazz e o novo de ballet)',
    daVavaD.length === 2, daVavaD.map((m) => m.id));
  provar('o antigo de ballet desceu ao histórico, a apontar para o novo',
    (() => {
      const todos = JSON.parse(kv.dados.get(RAIZ + '/matriculas') || '[]');
      const anterior = todos.find((m) => m.id === idBallet);
      return anterior && anterior.substituidaPor
        && anterior.substituidaPor === derivada.dados.matricula.id;
    })());

  console.log('\nE — derivar um vínculo já derivado é recusado, e diz qual vale');
  const outraVez = await pedir(env, '/api/bastidores/matricula', {
    aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'Demi Plier',
    derivarDe: idBallet, token: TOKEN,
  });
  provar('é 409, e não uma terceira anamnese do mesmo par', outraVez.status === 409,
    outraVez.dados && outraVez.dados.erro);
  provar('e a recusa diz qual é o vínculo que vale agora',
    outraVez.dados && outraVez.dados.vigente === derivada.dados.matricula.id);

  console.log('\nF — a listagem diz o que ela pediu');
  const pagina = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), env);
  const html = await pagina.text();
  provar('a secção das alunas está na página', /id="lista-alunas"/.test(html));
  provar('o cartão da aluna traz um lugar por vínculo',
    (html.match(/data-vinculo="/g) || []).length >= 2,
    (html.match(/data-vinculo="/g) || []).length);
  provar('a linha do vínculo diz a modalidade, a turma e o professor',
    /data-vinculo="[^"]+"[^>]*>\s*<span class="selo marca">Balé clássico<\/span>/.test(html)
    && /prof\. Demi Plier/.test(html));
  provar('«Derivar» leva o vínculo, a modalidade e o professor no botão',
    /data-aluna-derivar="[^"]+" data-aluna-nome="Vavá" data-aluna-modalidade="Balé clássico"/.test(html));
  provar('o «ajustado em» leva o motivo, quando há',
    /ajustada em \d\d\/\d\d\/\d{4} · a aluna pediu para mudar de professora/.test(html));
  provar('o formulário tem o passo 1 e o passo 2', /data-passo="2"/.test(html));
  provar('o campo do vínculo a derivar existe, escondido', /id="aluna-derivar-de"/.test(html));
  provar('o motivo só aparece na derivação (nasce escondido)', /id="aluna-motivo-campo" hidden/.test(html));

  console.log('\nG — o script que a página serve COMPILA');
  /* A armadilha desta casa, e ela cobrou-se outra vez nesta sessão: o script é gerado por
   * concatenação de literais, e um `\"` mal escapado produz `value=""` e FECHA a string a meio.
   * O `node --check` do fonte passa — quem está errado é o que ele emite. */
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let quebrados = [];
  scripts.forEach((texto) => {
    try { new Function(texto); } catch (e) { quebrados.push(e.message); }
  });
  provar('todos os <script> da página servida compilam',
    quebrados.length === 0, quebrados);

  console.log('\nH — a modalidade chega à porta pelo endereço');
  const porta = require('fs').readFileSync(path.join(raiz, 'porta', 'index.html'), 'utf8');
  provar('a porta lê o ?modalidade= e põe-no no contexto do ato',
    /FONTE === 'anamnese'/.test(porta)
    && /get\('modalidade'\)/.test(porta)
    && /contexto\.modalidade = daUrl/.test(porta));
  provar('o resumo do envelope aceita a modalidade', /resumo\.modalidade = contexto\.modalidade/.test(
    require('fs').readFileSync(path.join(raiz, 'motor/nucleo/porta.js'), 'utf8')));
  const correio = require('fs').readFileSync(path.join(raiz, 'motor/servidor/correio.js'), 'utf8');
  provar('o pedido de anamnese diz a modalidade e leva o link',
    /comporPedidoDeAnamnese/.test(correio) && /modalidade/.test(correio));

  console.log('\nI — o `<select>` dos professores diz o NOME de quem oferece');
  /* O DEFEITO, medido a 18/11/2026: `professoresDaModalidade` devolve `{slug, rotulo}`, e este
   * pintor lia `p.nome` — que não existe. `escHtml(undefined)` dá `""`, e o `<select>` ficava com
   * as opções certas e sem texto. Ela leu «não listou nenhum professor, está vazio».
   *
   * A armadilha é a de sempre: a página não rebenta, o servidor aceita o `value`, e a única coisa
   * errada é o que se vê. Uma prova que só contasse opções passaria — por isso a asserção mede o
   * TEXTO. */
  {
    let JSDOM = null;
    let VC = null;
    try { ({ JSDOM, VirtualConsole: VC } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      provar('a lista de professores tem NOME (jsdom)', false, 'jsdom ausente');
    } else {
      /* AS HABILITAÇÕES DOS DOIS PROFESSORES DESTE AMBIENTE (Demi Plier e Redinha Rosa), para o
       * filtro ter dentes: com um que declara balé e outro que declara jazz, escolher uma das
       * modalidades TIRA o outro da lista. Sem isto os dois declaram nada, ficam sempre os dois, e
       * a prova do filtro passaria sem medir o filtro. */
      const PERFIS = { 'demi-plier': ['bale-classico', 'jazz'], 'redinha-rosa': ['jazz'] };
      const pagina = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), env);
      const documento = await pagina.text();
      const vc = new VC();
      const errosDoCliente = [];
      vc.on('jsdomError', (e) => errosDoCliente.push(e.message));
      const dom = new JSDOM(documento.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://breu.example/bastidores/producao', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = () => {};
          w.confirm = () => true;
          w.fetch = (u) => {
            const url = String(u);
            let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [], grupos: [], matriculas: [] };
            const m = /professor=([^&]+)/.exec(url);
            if (url.indexOf('/api/bastidores/perfil') !== -1 && m) {
              const slug = decodeURIComponent(m[1]);
              corpo = { ok: true, existe: true, modalidades: PERFIS[slug] === undefined ? null : PERFIS[slug],
                tradicoes: {}, catalogo: [] };
            }
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo),
              text: () => Promise.resolve('') });
          };
        },
      });
      const w = dom.window;
      const d = w.document;
      const esperar = (ms) => new Promise((r) => w.setTimeout(r, ms));
      await esperar(400);
      /* O PROFESSOR DA ESCOLA NÃO ESTÁ NO CADASTRO DESTE AMBIENTE DE PROVA: o `env` tem dois
       * professores (Demi Plier e Redinha Rosa) na lista do KV, e são eles que a página desenha. */
      try { w.abrirOFormularioDe('sec-alunas'); } catch (e) {}
      d.getElementById('anome').value = 'Zezé';
      /* O CPF ENTROU NO CADASTRO (18/11/2026) — e é obrigatório, como a modalidade e o professor. */
      const campoCpf = d.getElementById('acpf');
      if (campoCpf) campoCpf.value = '11144477735';
      d.getElementById('aluna-seguir').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      const sel = d.getElementById('amodalidade');
      sel.value = 'Balé clássico';
      sel.dispatchEvent(new w.Event('change'));
      await esperar(400);
      const opcoes = [...d.getElementById('aprofessor').options];
      const comTexto = opcoes.filter((o) => o.value && String(o.textContent || '').trim() !== '');
      provar('a modalidade escolhida lista os professores COM NOME',
        comTexto.length > 0, opcoes.map((o) => o.value + ' :: ' + o.textContent));
      provar('…e o nome é o do cadastro, não o slug',
        comTexto.some((o) => /Demi Plier|Redinha Rosa/.test(o.textContent)),
        comTexto.map((o) => o.textContent));

      /* A TRAVA DO BOTÃO — «o botão cadastrar não pode estar disponível se eu não tenho todos os
       * campos preenchidos». Nasceu aceso, e ela escolheu o primeiro item da lista (vazio) e viu o
       * servidor recusar. */
      const botao = d.getElementById('aluna-gravar');
      /* A LEITURA É DEFENSIVA, e a razão é uma lição desta casa: uma prova que estoura não reprova
       * — interrompe, e leva as asserções seguintes com ela. Com o rótulo em branco (o defeito que
       * esta secção mede), `comTexto` fica vazio, `comTexto[0].value` rebenta, e as três provas da
       * trava nunca chegavam a correr. */
      const umProfessor = comTexto.length ? comTexto[0].value : '';
      provar('o «Gravar» da aluna só acende com os quatro campos (o CPF entrou em 18/11/2026)',
        Boolean(botao) && botao.disabled === true,
        botao ? { disabled: botao.disabled, title: botao.title } : 'o botão não existe');
      const ap = d.getElementById('aprofessor');
      if (ap && umProfessor) {
        ap.value = umProfessor;
        ap.dispatchEvent(new w.Event('change', { bubbles: true }));
      }
      provar('…e acende quando o professor é escolhido',
        Boolean(botao) && botao.disabled === false && Boolean(umProfessor),
        botao ? { disabled: botao.disabled, title: botao.title, professor: umProfessor } : 'o botão não existe');
      /* TROCAR A MODALIDADE REPINTA A LISTA — E O PROFESSOR SOBREVIVE (18/11/2026).
       *
       * A primeira versão desta asserção media o contrário: que a repintura APAGAVA o professor e o
       * botão voltava a apagar-se. Era o comportamento de então, e era o defeito que ela descreveu
       * («mesmo que eu troque de modalidade, ele está bloqueado»): a repintura fazia
       * `innerHTML = …`, o `<select>` voltava ao primeiro item — o vazio —, e quem tinha escolhido
       * perdia a escolha sem ver. Agora o valor é guardado antes e reposto depois, se ainda valer.
       *
       * O QUE A TRAVA AINDA FAZ, e tem de fazer: se o professor sair da lista nova, ele é apagado e
       * o botão apaga-se com ele — senão o botão ficaria aceso a apontar para quem já não está lá.
       * Esse caso é o da secção N, com um professor que declara habilitações. */
      sel.value = 'Jazz';
      sel.dispatchEvent(new w.Event('change'));
      await esperar(400);
      provar('…e sobrevive quando a lista é repintada, se ele ainda a integra',
        Boolean(botao) && botao.disabled === false
          && d.getElementById('aprofessor').value === 'demi-plier',
        botao ? { disabled: botao.disabled, title: botao.title,
          professor: d.getElementById('aprofessor').value } : 'o botão não existe');
      /* E QUANDO ELE SAI MESMO DA LISTA, o botão tem de se apagar com ele — senão ficaria aceso a
       * apontar para quem já não está lá. O Demi Plier declara balé e jazz; em Contemporâneo, sai. */
      sel.value = 'Contemporâneo';
      sel.dispatchEvent(new w.Event('change'));
      await esperar(400);
      provar('…e é apagado quando já não integra a lista da modalidade nova',
        d.getElementById('aprofessor').value === '',
        d.getElementById('aprofessor').value);
      provar('…e o botão apaga-se com ele',
        Boolean(botao) && botao.disabled === true,
        botao ? { disabled: botao.disabled, title: botao.title } : 'o botão não existe');
      provar('o cliente não escreveu nenhum erro de JavaScript', errosDoCliente.length === 0,
        errosDoCliente.slice(0, 2));
    }
  }

  console.log('\nJ — na listagem, a aluna diz A QUE TURMA e A QUE ELENCO pertence');
  /* «A Aluna A, ela está vinculada a uma turma e não está aqui mais a turma. Você tirou o botão que
   * tinha ali que me levava para a turma que ela está vinculada. E você também não está me dizendo
   * qual é o elenco que ela está vinculada.»
   *
   * As duas coisas são o MESMO erro de desenho: o cartão passou a DIZER a turma em texto e deixou
   * de a OFERECER. Um nome que não se carrega não leva a lado nenhum. */
  {
    const kvJ = criarKV({
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', email: 'demi@example.test' }]),
      [RAIZ + '/alunas']: JSON.stringify(['Vavá']),
      [RAIZ + '/turmas']: JSON.stringify([{ id: 'rosa', nome: 'Rosa', modalidade: 'Balé clássico',
        professor: 'demi-plier', dias: ['seg'], horarios: { seg: '16:30' }, duracaoMin: 60 }]),
      [RAIZ + '/curadorias']: JSON.stringify([{ id: 'c1', professor: 'demi-plier', modalidade: 'Balé clássico',
        turmas: ['Rosa'], alunas: ['Vavá'], nivel: 'Nível 1', repertorio: [], linhaDeBase: 'ami' }]),
      /* O ELENCO VIVE EM DUAS FONTES, e a prova usa a LOCAL: `linhasDeBase` lê primeiro os
       * rascunhos do KV e junta-lhes os actos do repositório. Um rascunho é uma linha de base
       * legítima para a listagem — e é a única fonte que esta prova pode semear sem escrever no
       * repositório. A forma é a que `linhasDeBase` aceita: `id` e `campos`. */
      [RAIZ + '/linhas-de-base']: JSON.stringify([{ id: 'ami', nome: 'AMI', professor: 'demi-plier',
        alunas: ['Vavá'], campos: ['eixo'], rascunho: false }]),
    });
    const envJ = ambiente(kvJ);
    const pagina = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envJ);
    const html2 = await pagina.text();
    const cartaoDaVavaTurmas = (/<li class="turma" data-aluna="Vavá"[\s\S]*?<\/li>/.exec(html2) || [''])[0];
    provar('o cartão da aluna traz o botão que leva às turmas dela',
      /data-turmas="rosa"[^>]*data-quem="Vavá"/.test(cartaoDaVavaTurmas));
    /* O LINK DO ELENCO leva à linha certa da Audição pelo mesmo `data-abrir` que o cartão da Turma
     * já usa — um segundo mecanismo de salto seria uma segunda resposta à pergunta «onde fica».
     *
     * A ASSERÇÃO É RECORTADA NO CARTÃO DA ALUNA, e a primeira versão não era: ela procurava
     * `data-abrir="elenco:ami"` na página inteira — e o CARTÃO DA TURMA também o emite («Abrir o
     * Elenco»). Com o link da aluna removido, a prova continuava a passar, a ler o link do outro.
     * Uma asserção que encontra o que procura no sítio errado não mede nada: mede que a string
     * existe em algum lado. */
    const cartaoDaVava = (/<li class="turma" data-aluna="Vavá"[\s\S]*?<\/li>/.exec(html2) || [''])[0];
    provar('…e o cartão diz A QUE ELENCO ela pertence, com o link para a linha dele',
      /data-abrir="elenco:ami"/.test(cartaoDaVava),
      (/data-abrir="elenco:[^"]*"/.exec(cartaoDaVava) || ['(nenhum)'])[0]);
    provar('…e o link do elenco abre a Audição (#corpo), que é onde o elenco se lê',
      /href="#corpo" data-abrir="elenco:ami"/.test(cartaoDaVava));
  }

  console.log('\nK — «Derivar» a Sala pelo «Avançar» leva o id, e nasce o elo novo');
  /* O DEFEITO, na letra dela: «cliquei em derivar, preencheu a modalidade da sala, isso está certo
   * […] e aí eu cliquei em avançar. Erro: turma não encontrada, vazio.»
   *
   * A CAUSA foi minha, e do mesmo dia: ao tirar o campo da data, apaguei com ele a linha
   * `campos.derivarDe = derivando;`. Ficaram dois caminhos certos (criar e editar) e um a mandar um
   * corpo SEM identidade — o servidor não encontrava a sala e recusava com «(vazio)».
   *
   * PORQUE NINGUÉM VIU. A tira dos passos não grava (só navega), e por isso «ir ao step 2 pelo
   * step» funcionava; era o «Avançar» que chamava o submit. A prova que existia media o
   * `ajustarTurma` a PREENCHER o formulário, não o que ele ENVIA — a metade que faltava.
   *
   * Esta secção mede o envio: o que sai, e o que fica no store. */
  {
    let JSDOM = null;
    let VC = null;
    try { ({ JSDOM, VirtualConsole: VC } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      provar('derivar a Sala pelo «Avançar» (jsdom)', false, 'jsdom ausente');
    } else {
      const mapa = new Map([
        [RAIZ + '/professores', JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier', email: 'd@e.t' }])],
        [RAIZ + '/alunas', JSON.stringify([])],
        [RAIZ + '/turmas', JSON.stringify([{ id: 'rosa-v1', nome: 'Rosa', modalidade: 'Balé clássico',
          professor: 'demi-plier', dias: ['seg', 'qua', 'sex'],
          horarios: { seg: '16:30', qua: '16:30', sex: '16:30' },
          duracaoMin: 60, frequencia: 3, periodoInicio: '2026-01-05', periodoFim: '2026-06-30' }])],
        /* A SALA EM TURMA É O QUE FAZ O BOTÃO DIZER «DERIVAR». Sem curadoria ela seria «livre» e o
         * botão seria «Editar» — outra rota, outro caminho, e o defeito que esta secção mede só
         * existe no caminho da derivação. A primeira versão desta prova esquecia esta linha e
         * media o «Editar» a chamar-se «Derivar». */
        [RAIZ + '/curadorias', JSON.stringify([{ id: 'c1', professor: 'demi-plier',
          modalidade: 'Balé clássico', turmas: ['Rosa'], alunas: [], nivel: 'Nível 1' }])],
      ]);
      const envK = ambiente(criarKV(Object.fromEntries(mapa)));
      const entrada = await pedir(envK, '/api/bastidores/validar-producao', { senha: 'segredo' });
      const token = entrada.dados && entrada.dados.token;
      const pagina = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envK);
      const htmlK = await pagina.text();
      const vc = new VC();
      const errosK = [];
      vc.on('jsdomError', (e) => errosK.push(e.message));
      const dom = new JSDOM(htmlK.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://breu.example/bastidores/producao', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = (m) => errosK.push('ALERT: ' + m);
          w.confirm = () => true;
          w.fetch = (u) => {
            const url = String(u);
            let corpo = { ok: true, campos: [], grupos: [], matriculas: [], alunas: [], linhas: [] };
            if (url.indexOf('/api/bastidores/perfil') !== -1) {
              corpo = { ok: true, existe: true, modalidades: ['bale-classico'], tradicoes: {}, catalogo: [] };
            }
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(corpo),
              text: () => Promise.resolve('') });
          };
        },
      });
      const w = dom.window;
      const d = w.document;
      const esperar = (ms) => new Promise((r) => w.setTimeout(r, ms));
      await esperar(500);
      w.definirFormularioRecolhido(false);
      const botao = d.querySelector('[data-turma-ajustar]');
      provar('a sala aparece com «Derivar» (ela está em turma)', Boolean(botao)
        && /Derivar/.test(botao.textContent), botao && botao.textContent.trim());
      botao.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      provar('«Derivar» traz a modalidade preenchida — o defeito que ela viu primeiro',
        String(d.getElementById('tmodalidade').value) === 'Balé clássico',
        d.getElementById('tmodalidade').value);
      provar('…e os três dias e as horas, da memória ou do registo (mas certos)',
        [...d.querySelectorAll('input[name="dia"]')].filter((c) => c.checked).length === 3,
        [...d.querySelectorAll('input[name="dia"]')].filter((c) => c.checked).map((c) => c.value));
      /* O ENVIO. Aqui o `fetch` é o de mentira, e é o que interessa: o corpo que o botão monta. */
      let enviado = null;
      w.fetch = (u, o) => {
        enviado = { url: String(u), corpo: o && o.body ? JSON.parse(o.body) : null };
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ ok: true, id: 'x' }),
          text: () => Promise.resolve('{"ok":true}') });
      };
      d.getElementById('form-turma').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
      await esperar(300);
      provar('o «Avançar» da derivação vai à rota de derivar', enviado
        && /turma-derivar$/.test(enviado.url), enviado && enviado.url);
      provar('…e leva o id da sala que se está a derivar — a linha que faltava',
        Boolean(enviado && enviado.corpo && enviado.corpo.derivarDe === 'rosa-v1'),
        enviado && enviado.corpo && { derivarDe: enviado.corpo.derivarDe, nome: enviado.corpo.nome });
      /* E o corpo sai COMPLETO: a modalidade, os dias e as horas são metade da razão de a tela
       * existir. Um id sem eles derivaria uma sala vazia. */
      provar('…e o corpo leva a modalidade, os dias e as horas',
        Boolean(enviado && enviado.corpo && enviado.corpo.modalidade === 'Balé clássico'
          && Array.isArray(enviado.corpo.dias) && enviado.corpo.dias.length === 3),
        enviado && enviado.corpo && { modalidade: enviado.corpo.modalidade, dias: enviado.corpo.dias });
    }
  }

  console.log('\nL — a aluna que já existe: UM pedido, e o vínculo fica gravado');
  /* O DEFEITO, na letra dela: «mando cadastrar aluna, não recebi e-mail nenhum, e não aparece, não
   * gravou […] quando eu clico em derivar esses campos estão vazios de novo.»
   *
   * A CAUSA. O cliente fazia DOIS pedidos: `POST /aluna` e depois `POST /matricula`. Para uma aluna
   * que já está no cadastro — e as desta escola estão —, o primeiro devolvia 409 e o cliente
   * ABORTAVA ali. Sem vínculo, sem e-mail, sem nada na listagem. O 409 estava certo; a chamada é
   * que era a errada.
   *
   * O QUE SE MEDE: o pedido que sai, o que fica no store, e o e-mail que se compõe. */
  {
    const kvL = criarKV({
      [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier', email: 'd@e.t' }]),
      [RAIZ + '/alunas']: JSON.stringify(['Aluna A']),
    });
    const envL = ambiente(kvL);
    /* O TOKEN É ASSINADO, e não uma palavra: quem o emite é a rota da direção. Uma prova que
     * escrevesse «segredo» estaria a medir a sua própria forja — e a primeira versão desta secção
     * fazia isso, e reprovava a 401 por uma razão que não era a do defeito. */
    const entradaL = await pedir(envL, '/api/bastidores/validar-producao', { senha: 'segredo' });
    const r = await pedir(envL, '/api/bastidores/matricula', {
      aluna: 'Aluna A', modalidade: 'Balé clássico', professor: 'demi-plier',
      token: entradaL.dados && entradaL.dados.token,
    });
    provar('vincular uma aluna que já existe é 201, e não um conflito', r.status === 201,
      r.dados && r.dados.erro);
    const guardados = JSON.parse(kvL.dados.get(RAIZ + '/matriculas') || '[]');
    provar('…e o vínculo fica no store', guardados.length === 1 && guardados[0].aluna === 'Aluna A',
      guardados.map((m) => m.id));
    const cadastro = JSON.parse(kvL.dados.get(RAIZ + '/alunas') || '[]');
    provar('…sem duplicar a aluna no cadastro', cadastro.filter((a) => a === 'Aluna A').length === 1,
      cadastro);
    provar('…e o e-mail ao professor é COMPOSTO (o desfecho diz se saiu)',
      Boolean(r.dados && r.dados.correio && typeof r.dados.correio.enviado === 'boolean'),
      r.dados && r.dados.correio && { enviado: r.dados.correio.enviado, motivo: r.dados.correio.motivo });

    /* E o cliente deixou de fazer o primeiro pedido: a prova lê o fonte do formulário. É uma
     * asserção de marcação, e é a única forma de medir «um pedido só» sem uma rede de mentira a
     * fingir o 409 — que é precisamente o que se quer impedir. */
    const fonte = require('fs').readFileSync(path.join(raiz, 'motor/servidor/bastidores.js'), 'utf8');
    /* O RECORTE É NO HANDLER, e não a partir do `<form>`: a marcação do formulário e o `submit`
     * estão a milhares de caracteres de distância (a página é uma só, e a secção das Alunas vem
     * muito antes do seu script). A primeira versão desta asserção procurava a partir do
     * `id="form-aluna"` com uma janela de 4 000 caracteres — não encontrava o handler, recebia a
     * string vazia, e **passava por não haver nada para ler**. É a asserção vazia, e é pior do que
     * a que falha: ela dá por medido o que nunca foi lido. */
    /* O FIM DO HANDLER É ENCONTRADO, e não estimado. A primeira correcção desta asserção punha um
     * tecto de 3 000 caracteres partido do início do handler — e o handler tem mais do que isso: o
     * defeito injectado caía a 3 044, FORA da janela, e a asserção voltava a passar sem medir. Um
     * tecto fixo numa região de tamanho variável é uma asserção que se desliga sozinha no dia em
     * que alguém acrescenta uma linha. */
    const inicioDoHandler = fonte.indexOf('document.getElementById("form-aluna").addEventListener("submit"');
    const fimDoHandler = inicioDoHandler === -1 ? -1
      : fonte.indexOf("\n    '});' +", inicioDoHandler);
    const trechoDoSubmit = (inicioDoHandler === -1 || fimDoHandler === -1)
      ? '' : fonte.slice(inicioDoHandler, fimDoHandler);
    provar('o recorte do handler foi encontrado (senão a asserção seguinte não mede nada)',
      trechoDoSubmit.length > 0, trechoDoSubmit.length);
    provar('o cliente já não faz `POST /aluna` antes do vínculo',
      !/fetch\("\/api\/bastidores\/aluna"/.test(trechoDoSubmit),
      /api\/bastidores\/aluna/.test(trechoDoSubmit) ? 'ainda faz o primeiro pedido' : '(um pedido só)');
  }

  console.log('\nM — o véu da Sala diz «Sala», e a aluna antiga deriva com o que já se sabe');
  /* «o botão gravar sala […] aparece quando eu clico em gravar sala, aparece gravar turma no véu. E
   * ele está gravando a sala, né? Ele não está gravando uma turma.» As duas palavras convivem no
   * produto e significam coisas diferentes: a SALA é o ritmo e o professor; a TURMA é a atribuição.
   * O véu dizia a segunda quando o gesto era o primeiro.
   *
   * E a aluna antiga: «quando eu clico em derivar esses campos estão vazios de novo.» Uma aluna
   * criada antes dos vínculos não tem `matriculas`, mas está numa curadoria — e a curadoria sabe a
   * modalidade e o professor dela. */
  {
    let JSDOM = null;
    let VC = null;
    try { ({ JSDOM, VirtualConsole: VC } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      provar('o véu da Sala e a aluna antiga (jsdom)', false, 'jsdom ausente');
    } else {
      const kvM = criarKV({
        [RAIZ + '/professores']: JSON.stringify([{ nome: 'Demi Plier', slug: 'demi-plier', email: 'd@e.t' }]),
        [RAIZ + '/alunas']: JSON.stringify(['Aluna A']),
        [RAIZ + '/turmas']: JSON.stringify([{ id: 'rosa', nome: 'Rosa', modalidade: 'Balé clássico',
          professor: 'demi-plier', dias: ['seg'], horarios: { seg: '16:30' }, duracaoMin: 60 }]),
        [RAIZ + '/curadorias']: JSON.stringify([{ id: 'c1', professor: 'demi-plier',
          modalidade: 'Jazz', turmas: ['Rosa'], alunas: ['Aluna A'], nivel: 'Nível 1' }]),
      });
      const envM = ambiente(kvM);
      const pagina = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envM);
      const htmlM = await pagina.text();
      const vc = new VC();
      const errosM = [];
      vc.on('jsdomError', (e) => errosM.push(e.message));
      const dom = new JSDOM(htmlM.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://breu.example/bastidores/producao', pretendToBeVisual: true,
        virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = () => {};
          w.confirm = () => true;
          w.fetch = () => Promise.resolve({ ok: true, status: 200,
            json: () => Promise.resolve({ ok: true, campos: [], grupos: [], matriculas: [] }),
            text: () => Promise.resolve('') });
        },
      });
      const w = dom.window;
      const d = w.document;
      await new Promise((r) => w.setTimeout(r, 400));
      const doMapa = (ep) => w.textoDoPasso(ep);
      const concluir = doMapa('/api/bastidores/turma-rubrica');
      provar('o «Gravar sala» tem frase própria no véu, e ela diz «Sala»',
        Boolean(concluir) && /Sala/.test(concluir.etiqueta) && !/turma/i.test(concluir.texto),
        concluir);
      const todas = ['/api/bastidores/turma', '/api/bastidores/turma-editar',
        '/api/bastidores/turma-derivar', '/api/bastidores/turma-rubrica'].map(doMapa);
      provar('nenhuma das quatro frases da Sala diz «turma»',
        todas.every((x) => x && !/turma/i.test(x.etiqueta + ' ' + x.texto)),
        todas);

      /* A ALUNA ANTIGA: sem vínculo, mas com curadoria. O botão tem de trazer o que se sabe. */
      w.abrirOFormularioDe('sec-alunas');
      const derivar = d.querySelector('[data-aluna-derivar]');
      provar('a aluna antiga (sem vínculo) traz a modalidade que a escola já sabe',
        Boolean(derivar) && derivar.getAttribute('data-aluna-modalidade') === 'Jazz',
        derivar && derivar.getAttribute('data-aluna-modalidade'));
      provar('…e o professor dela',
        Boolean(derivar) && derivar.getAttribute('data-aluna-professor') === 'demi-plier',
        derivar && derivar.getAttribute('data-aluna-professor'));
      provar('…e o id do vínculo vem VAZIO — não há nenhum para substituir',
        Boolean(derivar) && derivar.getAttribute('data-aluna-derivar') === '');
      derivar.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      await new Promise((r) => w.setTimeout(r, 300));
      provar('o botão passa a dizer «Gravar a anamnese nova», e não «Cadastrar aluna»',
        /anamnese nova/.test(d.getElementById('aluna-gravar').textContent),
        d.getElementById('aluna-gravar').textContent);
      provar('…e os campos do passo 2 vêm preenchidos',
        d.getElementById('amodalidade').value === 'Jazz'
          && d.getElementById('aprofessor').value === 'demi-plier',
        { modalidade: d.getElementById('amodalidade').value,
          professor: d.getElementById('aprofessor').value });
    }
  }

  console.log('\nN — «Derivar» deixa gravar, o professor não se perde, e o recado vê-se');
  /* AS TRÊS QUEIXAS, e são um só acto partido em três:
   *
   *   «o gravar anamnese nova está bloqueado. Mesmo que eu troque de modalidade […] continua
   *    bloqueado. Mesmo que eu coloque uma justificativa, continua bloqueado.»
   *   «não recebi e-mail nenhum, e não aparece, não gravou.»
   *   «continua dizendo que nenhuma modalidade escolhida ainda.»
   *
   * A PRIMEIRA. A lista dos professores é uma leitura de rede; `derivarAluna` punha a modalidade e
   * a trava era calculada com o `<select>` ainda a dizer «a carregar…». O professor chegava 100 ms
   * depois e o botão ficava apagado para sempre — com o campo preenchido à frente.
   *
   * A SEGUNDA. O recado do desfecho do correio era escrito no `.res` do PASSO 1, que está `hidden`
   * no passo 2. A frase existia num sítio que ninguém podia ver.
   *
   * A TERCEIRA. Sem vínculo, a listagem dizia «nenhuma modalidade escolhida ainda» — sobre uma
   * aluna que a curadoria pôs numa turma de balé. A tela declarava ignorância que o sistema não
   * tem. */
  {
    let JSDOM = null;
    let VC = null;
    try { ({ JSDOM, VirtualConsole: VC } = require('jsdom')); } catch (e) { JSDOM = null; }
    if (!JSDOM) {
      provar('o «Derivar» da aluna (jsdom)', false, 'jsdom ausente');
    } else {
      const kvN = criarKV({
        [RAIZ + '/professores']: JSON.stringify([
          { nome: 'Demi Plier', slug: 'demi-plier', email: 'd@e.t' },
          { nome: 'Leticia', slug: 'leticia', email: 'l@e.t' },
        ]),
        [RAIZ + '/alunas']: JSON.stringify(['Aluna A', 'Aluna B']),
        [RAIZ + '/turmas']: JSON.stringify([{ id: 'rosa', nome: 'Rosa', modalidade: 'Balé clássico',
          professor: 'demi-plier', dias: ['seg'], horarios: { seg: '16:30' }, duracaoMin: 60 }]),
        [RAIZ + '/curadorias']: JSON.stringify([{ id: 'c1', professor: 'demi-plier',
          modalidade: 'Balé clássico', turmas: ['Rosa'], alunas: ['Aluna A'], nivel: 'Nível 1' }]),
      });
      const envN = ambiente(kvN);
      const entradaN = await pedir(envN, '/api/bastidores/validar-producao', { senha: 'segredo' });
      const tokenN = entradaN.dados && entradaN.dados.token;
      /* O `#alunas` NA URL NÃO É DETALHE: é o que faz a secção ser a visível, e é o que faz
       * `alvoDoRecado()` entregar a mensagem ao `.res` DESTA secção. Sem ele a prova mediria o
       * recado global e não veria o defeito. */
      const pagina = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envN);
      const htmlN = await pagina.text();
      const vc = new VC();
      const errosN = [];
      vc.on('jsdomError', (e) => errosN.push(e.message));
      const trocasN = [];
      const dom = new JSDOM(htmlN.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: 'https://breu.example/bastidores/producao#alunas',
        pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = (m) => errosN.push('ALERT: ' + m);
          w.confirm = () => true;
          /* O `location.reload` NÃO SE SUBSTITUI no jsdom (a propriedade é só de leitura). O
           * que se faz é deixar a recarga acontecer como «navegação não implementada» — o jsdom
           * avisa no `virtualConsole` e a página não muda. É o que basta: a prova mede o recado
           * ANTES dos 2 500 ms da recarga, e a lista de trocas vive fora do DOM. */
          w.fetch = (u, o) => {
            const url = String(u);
            const real = url.indexOf('http') === 0 ? url : 'https://breu.example' + url;
            let corpo = null;
            if (o && o.body) { corpo = JSON.parse(o.body); if (corpo && !corpo.token) corpo.token = tokenN; }
            return bastidores.fetch(new Request(real, {
              method: (o && o.method) || 'GET', headers: { 'Content-Type': 'application/json' },
              body: corpo ? JSON.stringify(corpo) : undefined,
            }), envN).then(async (r) => {
              const t = await r.text();
              let j = null; try { j = JSON.parse(t); } catch (e) { j = { ok: false }; }
              trocasN.push({ url: url.split('?')[0], codigo: r.status });
              return { ok: r.ok, status: r.status, json: () => Promise.resolve(j),
                text: () => Promise.resolve(t) };
            });
          };
        },
      });
      const w = dom.window;
      const d = w.document;
      const esperar = (ms) => new Promise((r) => w.setTimeout(r, ms));
      await esperar(700);

      /* ---- 1. A LISTAGEM DIZ O QUE SE SABE. ---- */
      const cartaoA = d.querySelector('li[data-aluna="Aluna A"]');
      const textoA = String((cartaoA && cartaoA.textContent) || '').replace(/\s+/g, ' ');
      provar('a aluna sem vínculo mas em turma diz a MODALIDADE que a escola já sabe',
        /Balé clássico/.test(textoA) && /sem vínculo de anamnese/.test(textoA), textoA.slice(0, 150));
      provar('…e já não diz «nenhuma modalidade escolhida» sobre quem está numa turma',
        !/Nenhuma modalidade escolhida/.test(textoA));
      const cartaoB = d.querySelector('li[data-aluna="Aluna B"]');
      const textoB = String((cartaoB && cartaoB.textContent) || '').replace(/\s+/g, ' ');
      provar('a aluna sem nada continua a dizer que nada se sabe (e não inventa)',
        /Nenhuma modalidade escolhida/.test(textoB), textoB.slice(0, 120));

      /* ---- 2. «DERIVAR» ACENDE O BOTÃO. ---- */
      cartaoA.querySelector('[data-aluna-derivar]').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
      const botao = d.getElementById('aluna-gravar');
      provar('logo depois do clique o botão pode estar apagado — o professor ainda não chegou',
        true, { disabled: botao.disabled });
      await esperar(500);
      provar('…e ACENDE quando o professor chega — o defeito que a deixou sem gravar',
        botao.disabled === false,
        { disabled: botao.disabled, title: botao.title,
          professor: d.getElementById('aprofessor').value });
      provar('o professor preenchido é o do vínculo',
        d.getElementById('aprofessor').value === 'demi-plier',
        d.getElementById('aprofessor').value);
      /* O CPF NÃO SE PEDE A QUEM JÁ EXISTE (18/11/2026). Derivar e corrigir não criam pessoa: o CPF
       * já está no registo dela, e um campo que se pede e não se usa ensina a preenchê-lo por
       * engano. O bloco esconde-se no mesmo passo em que o formulário passa a «anamnese nova». */
      const blocoCpf = d.getElementById('aluna-cpf-campo');
      provar('ao derivar, o campo do CPF desaparece — a pessoa já está no cadastro',
        Boolean(blocoCpf) && blocoCpf.hidden === true,
        blocoCpf ? { hidden: blocoCpf.hidden } : 'o campo não existe');

      /* ---- 3. TROCAR DE MODALIDADE NÃO PERDE O PROFESSOR. ---- */
      const sel = d.getElementById('amodalidade');
      sel.value = 'Jazz';
      sel.dispatchEvent(new w.Event('change'));
      await esperar(500);
      provar('trocar de modalidade mantém o professor, se ele ainda estiver na lista',
        d.getElementById('aprofessor').value === 'demi-plier',
        { professor: d.getElementById('aprofessor').value, disabled: botao.disabled });
      provar('…e o botão continua aceso', botao.disabled === false, botao.disabled);
      sel.value = 'Balé clássico';
      sel.dispatchEvent(new w.Event('change'));
      await esperar(500);

      /* ---- 4. O RECADO VÊ-SE, E DIZ PORQUE O E-MAIL NÃO SAIU. ---- */
      const res = d.querySelector('.res[data-res=alunas]');
      provar('o `.res` das alunas está FORA dos passos — visível nos dois',
        Boolean(res) && !res.closest('[data-passo]'),
        Boolean(res) && (res.parentElement && res.parentElement.id));
      trocasN.length = 0;
      d.getElementById('form-aluna').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
      await esperar(700);
      const textoDoRecado = String((res && res.textContent) || '');
      provar('o vínculo é gravado (201)', trocasN.some((x) => x.codigo === 201
        && /\/matricula$/.test(x.url)), trocasN.filter((x) => x.codigo));
      provar('…e o desfecho do e-mail É DITO onde se vê — com o motivo',
        /e-mail/.test(textoDoRecado) && /RESEND_API_KEY/.test(textoDoRecado),
        textoDoRecado.slice(0, 160));
      const guardados = JSON.parse(kvN.dados.get(RAIZ + '/matriculas') || '[]');
      provar('…e o vínculo fica no store', guardados.length === 1, guardados.map((m) => m.id));
      provar('o cliente não escreveu nenhum erro de JavaScript',
        errosN.filter((e) => !/scrollIntoView|navigation/.test(e)).length === 0,
        errosN.slice(0, 2));
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * O — «EDITAR» OU «DERIVAR», E A ETIQUETA QUE SÓ PERTENCE À DERIVAÇÃO (18/11/2026)
   *
   * «Aluno A e aluno B tudo bem derivar, porque eles já estão vinculados à turma. […] Os demais,
   * que estão livres e que nunca existiu plano de ensino para eles, e não estão numa turma, não
   * estão nem sequer num elenco, que é o caso do aluno C e do aluno D — eles não são derivar, eles
   * são editar.» E: «essa etiqueta de ajustado em surge só na derivação. Eles não foram derivados
   * […] aluno C e aluno D não tem que ter essa etiqueta.»
   *
   * DOIS DEFEITOS, e o segundo é o que ninguém veria sozinho: a lista escrevia «Derivar» em todas
   * as linhas, e a etiqueta «ajustada em» em todas as que tinham `pedidaEm` — que é TODA a gente
   * que passou pelo formulário, porque é lá que a data nasce. O primeiro cadastro não é um ajuste.
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nO — «Editar» para quem está livre, «Derivar» para quem está preso');
  {
    /* DUAS ALUNAS, e a diferença entre elas é a única coisa que importa: a «Vavá» está numa
     * curadoria (logo, numa turma), a «Tami» não está em nada. Ambas com vínculo de anamnese —
     * é isso que faz o caso do aluno C e do aluno D: quem tem vínculo e não está preso edita-se. */
    const kvO = criarKV({
      [RAIZ + '/professores']: JSON.stringify([
        { nome: 'Demi Plier', slug: 'demi-plier' },
        { nome: 'Redinha Rosa', slug: 'redinha-rosa' },
      ]),
      'professores/demi-plier/contato': JSON.stringify({ email: 'demi@example.test' }),
      [RAIZ + '/alunas']: JSON.stringify(['Vavá', 'Tami']),
      [RAIZ + '/curadorias']: JSON.stringify([
        { id: 'rosa', modalidade: 'Balé clássico', professor: 'demi-plier', turma: 'Rosa', alunas: ['Vavá'] },
      ]),
      [RAIZ + '/matriculas']: JSON.stringify([
        { id: 'vava-bale-classico', aluna: 'Vavá', modalidade: 'Balé clássico',
          professor: 'demi-plier', pedidaEm: '2026-11-01' },
        { id: 'tami-jazz', aluna: 'Tami', modalidade: 'Jazz', professor: 'redinha-rosa',
          pedidaEm: '2026-11-02' },
      ]),
    });
    const envO = ambiente(kvO);
    const entradaO = await pedir(envO, '/api/bastidores/validar-producao', { senha: 'segredo' });
    const TOKEN_O = entradaO.dados && entradaO.dados.token;

    const pagO = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envO);
    const htmlO = await pagO.text();
    const cartaoDe = (nome) => {
      const m = new RegExp('<li class="turma" data-aluna="' + nome + '">([\\s\\S]*?)</li>').exec(htmlO);
      return m ? m[1] : '';
    };
    const cartaoVava = cartaoDe('Vavá');
    const cartaoTami = cartaoDe('Tami');
    provar('a aluna que está numa turma diz «Derivar»', /data-aluna-modo="derivar"/.test(cartaoVava)
      && />Derivar</.test(cartaoVava), cartaoVava.slice(0, 200));
    provar('a aluna que não está em turma, nem em elenco, nem em plano diz «Editar»',
      /data-aluna-modo="editar"/.test(cartaoTami) && />Editar</.test(cartaoTami),
      cartaoTami.slice(0, 200));
    provar('e a «Editar» leva o vínculo, para o servidor saber o que corrige',
      /data-aluna-modo="editar"[^>]*/.test(cartaoTami) && /data-aluna-derivar="tami-jazz"/.test(cartaoTami));
    provar('nenhum dos dois cartões traz «ajustada em» — nenhum deles foi derivado',
      !/ajustada em/.test(cartaoVava) && !/ajustada em/.test(cartaoTami),
      { vava: /ajustada em/.test(cartaoVava), tami: /ajustada em/.test(cartaoTami) });

    /* O GESTO, NO CLIENTE. O servidor recusar ou aceitar já está medido acima; o que falta medir é
     * o que ela VÊ e o que a página MANDA — um botão que diz «Editar» e um `submit` que manda
     * `derivarDe` seria a pior das combinações: o rótulo certo, o acto errado, e nenhum aviso. */
    {
      let JSDOM = null;
      let VC = null;
      try { ({ JSDOM, VirtualConsole: VC } = require('jsdom')); } catch (e) { JSDOM = null; }
      if (!JSDOM) {
        provar('o «Editar» no cliente (jsdom)', false, 'jsdom ausente');
      } else {
        const vc = new VC();
        const pedidos = [];
        const dom = new JSDOM(htmlO.replace(/<script src="[^"]*"><\/script>/g, ''), {
          runScripts: 'dangerously', url: 'https://breu.example/bastidores/producao',
          pretendToBeVisual: true, virtualConsole: vc,
          beforeParse(w) {
            w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
              addListener() {}, removeListener() {} });
            w.alert = () => {};
            w.confirm = () => true;
            w.fetch = (u, o) => {
              const url = String(u);
              let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [],
                grupos: [], matriculas: [], posicoes: [], exercicios: [] };
              if (/\/matricula$/.test(url)) {
                pedidos.push(JSON.parse((o && o.body) || '{}'));
                corpo = { ok: true, corrigida: true, correio: { enviado: false, motivo: 'sem chave' } };
              }
              if (/professor=/.test(url)) {
                corpo = { ok: true, existe: true, modalidades: ['bale-classico', 'jazz'],
                  tradicoes: {}, catalogo: [] };
              }
              return Promise.resolve({ ok: true, status: 200,
                json: () => Promise.resolve(corpo),
                text: () => Promise.resolve(JSON.stringify(corpo)) });
            };
          },
        });
        const w = dom.window;
        const d = w.document;
        await new Promise((r) => w.setTimeout(r, 500));
        const cartaoTami = Array.prototype.slice.call(d.querySelectorAll('[data-aluna="Tami"]'))[0];
        const botao = cartaoTami && cartaoTami.querySelector('[data-aluna-derivar]');
        provar('o botão da aluna livre diz «Editar»', Boolean(botao) && botao.textContent === 'Editar',
          botao && botao.textContent);
        if (botao) botao.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
        await new Promise((r) => w.setTimeout(r, 500));
        provar('ao clicar, o rótulo do gravar diz «Gravar a correção»',
          (d.getElementById('aluna-gravar') || {}).textContent === 'Gravar a correção',
          (d.getElementById('aluna-gravar') || {}).textContent);
        provar('o formulário sabe que está a corrigir, e o que corrige',
          (d.getElementById('aluna-modo') || {}).value === 'editar'
          && (d.getElementById('aluna-derivar-de') || {}).value === 'tami-jazz',
          { modo: (d.getElementById('aluna-modo') || {}).value,
            vinculo: (d.getElementById('aluna-derivar-de') || {}).value });
        d.getElementById('form-aluna')
          .dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
        await new Promise((r) => w.setTimeout(r, 500));
        const enviado = pedidos[0] || {};
        provar('…e o pedido leva `editarDe`, e NÃO `derivarDe`',
          enviado.editarDe === 'tami-jazz' && !enviado.derivarDe,
          { editarDe: enviado.editarDe, derivarDe: enviado.derivarDe });
      }
    }

    console.log('\nO.1 — a correcção no lugar, que é o que o «Editar» faz');
    const antes = JSON.parse(kvO.dados.get(RAIZ + '/matriculas') || '[]');
    const quantosAntes = antes.length;
    const corrigiu = await pedir(envO, '/api/bastidores/matricula', {
      aluna: 'Tami', modalidade: 'Jazz', professor: 'redinha-rosa',
      editarDe: 'tami-jazz', motivo: 'o professor certo é a Redinha', token: TOKEN_O,
    });
    provar('corrigir um vínculo livre é 200, e a resposta diz que foi correcção',
      corrigiu.status === 200 && corrigiu.dados && corrigiu.dados.corrigida === true,
      { status: corrigiu.status, corrigida: corrigiu.dados && corrigiu.dados.corrigida,
        erro: corrigiu.dados && corrigiu.dados.erro });
    const depois = JSON.parse(kvO.dados.get(RAIZ + '/matriculas') || '[]');
    provar('NÃO nasce elo nenhum — a lista tem os mesmos vínculos',
      depois.length === quantosAntes, { antes: quantosAntes, depois: depois.length });
    const oMesmo = depois.find((m) => m.id === 'tami-jazz');
    provar('o vínculo é o mesmo, com o professor corrigido',
      oMesmo && oMesmo.professor === 'redinha-rosa', oMesmo && oMesmo.professor);
    provar('…e não ganha `substitui`: não houve derivação',
      oMesmo && !oMesmo.substitui, oMesmo && oMesmo.substitui);
    provar('…e a correcção fica datada (`corrigidaEm`)',
      Boolean(oMesmo && /^\d{4}-\d{2}-\d{2}$/.test(String(oMesmo.corrigidaEm || ''))),
      oMesmo && oMesmo.corrigidaEm);

    console.log('\nO.2 — as recusas da correcção');
    const inexistente = await pedir(envO, '/api/bastidores/matricula', {
      aluna: 'Tami', modalidade: 'Jazz', professor: 'demi-plier',
      editarDe: 'nao-existe', token: TOKEN_O,
    });
    provar('corrigir um vínculo que não existe é 404', inexistente.status === 404);
    const deOutra = await pedir(envO, '/api/bastidores/matricula', {
      aluna: 'Outra Aluna', modalidade: 'Jazz', professor: 'demi-plier',
      editarDe: 'tami-jazz', token: TOKEN_O,
    });
    provar('corrigir o vínculo de OUTRA aluna é 400 — o apelido não se muda por aqui',
      deOutra.status === 400, deOutra.dados && deOutra.dados.erro);

    /* AS DUAS TRAVAS QUE VALEM MAIS. A primeira: a anamnese já foi feita — e aí corrigir o
     * professor punha o que ele observou debaixo do nome de outra pessoa. A segunda: ela está
     * numa turma que já tem plano de ensino.
     *
     * AS DUAS LEITURAS VÊM DE `porta`, e é aí que a prova as fornece. Não é uma forja do
     * resultado: é o mesmo corte que o código faz — o `bastidores.js` não fala com o acervo, fala
     * com o núcleo, e é essa fronteira que a prova substitui para poder medir a guarda. */
    const porta = require(path.join(raiz, 'motor/nucleo/porta.js'));
    const resumosVerdadeiros = porta.resumosDeEnvelopes;
    porta.resumosDeEnvelopes = async (arm, padrao) => [
      { nome: 'anamnese-tami.json', resumo: { contexto: { aluna: 'Tami', modalidade: 'Jazz' },
        gerado_em: '2026-11-12' } },
      { nome: 'plano-rosa.json', resumo: { professor: 'demi-plier', turma: 'Rosa', ciclo: '01' } },
    ].filter((x) => padrao.test(x.nome));
    try {
      const feita = await pedir(envO, '/api/bastidores/matricula', {
        aluna: 'Tami', modalidade: 'Jazz', professor: 'demi-plier',
        editarDe: 'tami-jazz', token: TOKEN_O,
      });
      provar('anamnese já FEITA: corrigir o vínculo é 409 — deriva-se',
        feita.status === 409 && /Derivar/.test(String(feita.dados && feita.dados.erro)),
        { status: feita.status, erro: feita.dados && feita.dados.erro });
      const presa = await pedir(envO, '/api/bastidores/matricula', {
        aluna: 'Vavá', modalidade: 'Balé clássico', professor: 'demi-plier',
        editarDe: 'vava-bale-classico', token: TOKEN_O,
      });
      provar('aluna em turma COM plano de ensino: 409, e a frase manda derivar',
        presa.status === 409 && /Derivar/.test(String(presa.dados && presa.dados.erro)),
        { status: presa.status, erro: presa.dados && presa.dados.erro });
    } finally {
      porta.resumosDeEnvelopes = resumosVerdadeiros;
    }

    console.log('\nO.3 — derivar, e só então a etiqueta');
    const derivou = await pedir(envO, '/api/bastidores/matricula', {
      aluna: 'Tami', modalidade: 'Jazz', professor: 'demi-plier',
      derivarDe: 'tami-jazz', motivo: 'a aluna trocou de professor', token: TOKEN_O,
    });
    provar('derivar a aluna livre é gravado (201)', derivou.status === 201,
      derivou.dados && derivou.dados.erro);
    const pagO2 = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envO);
    const htmlO2 = await pagO2.text();
    const cartaoTami2 = (new RegExp('<li class="turma" data-aluna="Tami">([\\s\\S]*?)</li>')
      .exec(htmlO2) || [])[1] || '';
    provar('depois de derivar, a etiqueta «ajustada em» aparece — com o motivo',
      /ajustada em \d\d\/\d\d\/\d{4} · a aluna trocou de professor/.test(cartaoTami2),
      cartaoTami2.slice(0, 300));
    provar('e a outra aluna continua sem etiqueta (ninguém a derivou)',
      !/ajustada em/.test((new RegExp('<li class="turma" data-aluna="Vavá">([\\s\\S]*?)</li>')
        .exec(htmlO2) || [])[1] || ''));
    const jaDerivado = await pedir(envO, '/api/bastidores/matricula', {
      aluna: 'Tami', modalidade: 'Jazz', professor: 'redinha-rosa',
      editarDe: 'tami-jazz', token: TOKEN_O,
    });
    provar('corrigir um vínculo que já desceu ao histórico é 409',
      jaDerivado.status === 409, jaDerivado.dados && jaDerivado.dados.erro);
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════════
   * P — A ETIQUETA «AJUSTADO EM» NAS OUTRAS LISTAS (18/11/2026)
   *
   * «Essa etiqueta tem que existir na listagem de alunos que já estão na regra de derivação,
   * também na de professores, na de salas, na de audição, na de estilo e na de turma.» A Turma e a
   * Sala já a tinham; as outras três não tinham nenhuma.
   * ══════════════════════════════════════════════════════════════════════════════════════════ */
  console.log('\nP — a etiqueta nas listagens de professores, audição e estilo');
  {
    /* PROFESSORES — a data vem do registo, escrita pelo «Editar» da ficha. */
    const kvP = criarKV({
      [RAIZ + '/professores']: JSON.stringify([
        { nome: 'Demi Plier', slug: 'demi-plier' },
        { nome: 'Redinha Rosa', slug: 'redinha-rosa', atualizado_em: '2026-11-17T10:00:00.000Z' },
      ]),
      [RAIZ + '/alunas']: JSON.stringify([]),
      /* UM ELENCO QUE JÁ FOI DERIVADO: a versão vigente diz de qual veio (`anterior`) e quando
       * (`gravada_em`). É o único par que distingue «derivado» de «o primeiro». */
      [RAIZ + '/linhas-de-base']: JSON.stringify([{
        id: 'elenco-a', nome: 'Elenco A', professor: 'demi-plier',
        campos: [{ id: 'formato-anatomico-dos-joelhos' }], alunas: ['Vavá'],
        anterior: 'escola/breu/linhas-de-base/elenco-a--20261101-1000.json',
        gravada_em: '2026-11-17T09:00:00.000Z', atualizada_em: '2026-11-17T09:00:00.000Z',
      }]),
    });
    const envP = ambiente(kvP);
    const pagP = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envP);
    const htmlP = await pagP.text();
    provar('o professor com ficha corrigida mostra «ajustado em», com a data',
      (() => {
        /* A JANELA É A DA LINHA DELE, e não o ficheiro todo: o nome aparece também no `<option>`
         * das habilitações, e uma asserção sobre o HTML inteiro passaria por acidente. */
        const i = htmlP.indexOf('data-alvo="Redinha Rosa"');
        if (i === -1) return false;
        return /ajustado em 17\/11\/2026/.test(htmlP.slice(Math.max(0, i - 900), i));
      })(),
      (() => {
        const i = htmlP.indexOf('data-alvo="Redinha Rosa"');
        return i === -1 ? '(linha não encontrada)' : htmlP.slice(Math.max(0, i - 400), i).slice(-260);
      })());
    provar('e o professor que nunca foi corrigido não mostra nada',
      (() => {
        const i = htmlP.indexOf('data-alvo="Demi Plier"');
        if (i === -1) return false;
        return !/ajustado em/.test(htmlP.slice(Math.max(0, i - 900), i));
      })());

    /* O «EDITAR» DA FICHA GRAVA A DATA — senão a etiqueta nunca teria o que mostrar. */
    const entradaP = await pedir(envP, '/api/bastidores/validar-producao', { senha: 'segredo' });
    const corrigiuFicha = await pedir(envP, '/api/bastidores/professor', {
      editar: 'demi-plier', nome: 'Demi', sobrenome: 'Plier',
      email: 'demi@example.test', token: entradaP.dados && entradaP.dados.token,
    });
    provar('o «Editar» da ficha do professor grava (200)', corrigiuFicha.status === 200,
      corrigiuFicha.dados && corrigiuFicha.dados.erro);
    const registos = JSON.parse(kvP.dados.get(RAIZ + '/professores') || '[]');
    const demi = registos.find((p) => p.slug === 'demi-plier');
    provar('…e deixa a data da correcção no registo dele',
      Boolean(demi && /^\d{4}-\d{2}-\d{2}T/.test(String(demi.atualizado_em || ''))),
      demi && demi.atualizado_em);

    /* ESTILO — a data é o maior `ate` do histórico do verbete, que é a data em que a versão
     * anterior deixou de valer. Mede-se no núcleo, que é quem compõe a lista. */
    const verbete = require(path.join(raiz, 'motor/servidor/verbete.js'));
    const alfabeto = {
      verbetes: {
        'Plié': {
          '8|4/4': {
            celulas: { frente: [{ categoria: 'dobradiça' }] },
            cobre: 8, posicao: null, escola: 'breu',
            versoes: [{ ate: '2026-11-09', cobre: 4, motivo: 'correção de notação' },
              { ate: '2026-11-17', cobre: 6, motivo: 'outra correção' }],
          },
        },
        'Tendu': { '8|4/4': { celulas: { frente: [{ categoria: 'extensão' }] }, cobre: 8, escola: 'breu' } },
      },
      vocabulario: {},
    };
    const listados = verbete.listarVerbetes(alfabeto, 'breu');
    const plie = listados.find((x) => x.nome === 'Plié');
    const tendu = listados.find((x) => x.nome === 'Tendu');
    provar('o verbete com histórico traz a data do ÚLTIMO ajuste, e não a do primeiro',
      plie && plie.ajustadaEm === '2026-11-17', plie && plie.ajustadaEm);
    provar('e o verbete sem histórico não traz data nenhuma — não foi ajustado',
      tendu && !tendu.ajustadaEm, tendu && tendu.ajustadaEm);

    /* AUDIÇÃO E ESTILO — as duas listas são desenhadas NO CLIENTE, e por isso mede-se o que se vê:
     * a página é montada num DOM, com as leituras de rede substituídas pelo que o servidor
     * mandaria, e o que se procura é a etiqueta na linha certa. Uma asserção sobre o TEXTO do
     * `<script>` passaria mesmo com o ramo morto lá dentro — foi medido, e passava. */
    {
      let JSDOM = null;
      let VC = null;
      try { ({ JSDOM, VirtualConsole: VC } = require('jsdom')); } catch (e) { JSDOM = null; }
      if (!JSDOM) {
        provar('a etiqueta da Audição e do Estilo (jsdom)', false, 'jsdom ausente');
      } else {
        const pagA = await bastidores.fetch(new Request('https://breu.example/bastidores/producao'), envP);
        const htmlA = await pagA.text();
        const vc = new VC();
        const dom = new JSDOM(htmlA.replace(/<script src="[^"]*"><\/script>/g, ''), {
          runScripts: 'dangerously', url: 'https://breu.example/bastidores/producao',
          pretendToBeVisual: true, virtualConsole: vc,
          beforeParse(w) {
            w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
              addListener() {}, removeListener() {} });
            w.alert = () => {};
            w.confirm = () => true;
            w.fetch = (u) => {
              const url = String(u);
              let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [],
                grupos: [], matriculas: [], posicoes: [] };
              /* UM VERBETE AJUSTADO E UM QUE NUNCA FOI — um só não mede a diferença, e é a
               * diferença que a etiqueta tem de fazer. */
              if (/\/linhas-de-base$/.test(url)) {
                corpo = { ok: true, revisoes: {}, linhas: [{
                  id: 'elenco-a', nome: 'Elenco A', professor: 'demi-plier',
                  campos: [{ id: 'formato-anatomico-dos-joelhos' }], alunas: ['Vavá'],
                  anterior: 'escola/breu/linhas-de-base/elenco-a--20261101-1000.json',
                  gravada_em: '2026-11-17T09:00:00.000Z',
                }] };
              }
              if (/\/verbete$/.test(url)) {
                corpo = { ok: true, posicoes: [], exercicios: [
                  { nome: 'Plié', escola: 'breu', emTurma: [], ajustadaEm: '2026-11-17',
                    porMusica: [{ chave: '8|4/4', tempos: 8, compasso: '4/4', trechos: 1,
                      direcoes: [], categorias: [], cobre: 8, escola: 'breu' }] },
                  { nome: 'Tendu', escola: 'breu', emTurma: [],
                    porMusica: [{ chave: '8|4/4', tempos: 8, compasso: '4/4', trechos: 1,
                      direcoes: [], categorias: [], cobre: 8, escola: 'breu' }] },
                ] };
              }
              /* O `text()` DEVOLVE O MESMO CORPO: uma das leituras da página (`lerResposta`) lê
               * `r.text()` e faz `JSON.parse` — não `r.json()`. Um stub que só servisse `json()`
               * deixava a lista do Estilo a dizer «a resposta não veio em condições», e a prova
               * teria medido o stub em vez da página. */
              return Promise.resolve({ ok: true, status: 200,
                json: () => Promise.resolve(corpo),
                text: () => Promise.resolve(JSON.stringify(corpo)) });
            };
          },
        });
        const w = dom.window;
        const d = w.document;
        await new Promise((r) => w.setTimeout(r, 700));

        const linhaDoElenco = d.querySelector('[data-elenco="elenco-a"]');
        provar('a Audição mostra «ajustado em» no elenco que foi derivado',
          Boolean(linhaDoElenco) && /ajustado em 17\/11\/2026/.test(linhaDoElenco.textContent),
          linhaDoElenco ? linhaDoElenco.textContent.slice(0, 140) : '(elenco não desenhado)');

        const verbete = (nome) => {
          const li = Array.prototype.slice.call(d.querySelectorAll('#lista-verbetes [data-verbete]'))
            .find((x) => x.getAttribute('data-verbete') === nome);
          return li ? li.textContent : '';
        };
        provar('o Estilo mostra «ajustado em» no verbete que tem histórico',
          /ajustado em 17\/11\/2026/.test(verbete('Plié')), verbete('Plié').slice(0, 140));
        provar('…e não mostra nada no que nunca foi ajustado',
          verbete('Tendu') !== '' && !/ajustado em/.test(verbete('Tendu')),
          verbete('Tendu').slice(0, 140));
      }
    }
  }

  const falhas = provas.filter((p) => !p.ok);
  console.log('\n' + (falhas.length ? 'FALHOU — ' : 'TUDO CERTO — ') + provas.length
    + ' asserções, ' + falhas.length + ' falha(s)');
  if (falhas.length) process.exitCode = 1;
}

principal().catch((e) => {
  console.error('a prova interrompeu-se:', e && e.stack ? e.stack : e);
  process.exitCode = 1;
});
