'use strict';
// O FORMULÁRIO «CRIAR NOVA ESCOLA» — a escolha do professor, provada no script REAL da página.
//
// A prova NÃO reimplementa a regra: extrai o `<script>` de `raiz/index.html`, roda-o contra um
// DOM falso e observa o que ele escreve nos elementos. Se a página e esta prova discordarem, a
// prova falha — que é o ponto.
//
// O que se mede é a regra que o dono do produto fixou em 15/10/2026:
//   1. o caminho «usar um professor que já existe» só se habilita DEPOIS do nome da escola —
//      é o nome que diz QUAL professor já está nesta escola;
//   2. quem JÁ é o professor da escola digitada APARECE, mas desabilitado: ele já está nela;
//   3. a escola que já existe é avisada ANTES de o formulário ser preenchido.
const fs = require('fs');
const path = require('path');

let falhas = 0;
const conferir = (nome, ok, detalhe) => {
  console.log((ok ? '  ok   ' : '  FALHA') + '  ' + nome + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const html = fs.readFileSync(path.join(__dirname, '..', 'raiz', 'index.html'), 'utf8');

/* O SCRIPT DO FORMULÁRIO, E NÃO O PRIMEIRO DA PÁGINA (24/11/2026).
 *
 * Era `/…/.exec(html)[1]` — o PRIMEIRO `<script>`. Quando a página ganhou o anti-flash no
 * `<head>` (que aplica o modo guardado antes de pintar), esse passou a ser ele: um bloco de
 * três linhas que não conhece formulário nenhum. A prova continuou a correr, o DOM falso ficou
 * todo por preencher, e ela reprovava «o caminho do reúso está DESABILITADO → false» — um
 * sintoma que parecia do formulário e era da bancada. Uma prova que mede o bloco errado é pior
 * do que nenhuma: ela dá a mesma resposta para qualquer mudança.
 *
 * O critério passa a ser o CONTEÚDO: o bloco que fala do formulário. Se um dia nenhum falar, a
 * prova morre dizendo isso — em vez de medir o vazio. */
const SCRIPT = (() => {
  const blocos = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const doFormulario = blocos.filter((b) => b.indexOf('modo-professor') !== -1);
  if (!doFormulario.length) {
    console.log('  FALHA  achei o <script> do formulário em raiz/index.html  → ' + blocos.length + ' bloco(s), nenhum com «modo-professor»');
    process.exit(1);
  }
  return doFormulario.sort((a, b) => b.length - a.length)[0];
})();

/** Um elemento falso com o que o script usa — e mais nada. */
function elemento(id) {
  const e = {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    className: '',
    hidden: false,
    disabled: false,
    checked: false,
    selectedIndex: 0,
    options: [],
    ouvintes: {},
    offsetHeight: 0,
    classList: {
      _c: new Set(),
      add(c) { this._c.add(c); },
      remove(c) { this._c.delete(c); },
      toggle(c, forca) { if (forca) this._c.add(c); else this._c.delete(c); },
      contains(c) { return this._c.has(c); },
    },
    addEventListener(t, fn) { (this.ouvintes[t] = this.ouvintes[t] || []).push(fn); },
    /* O QUE O FORMULÁRIO EM ETAPAS ACRESCENTOU AO ELEMENTO (25/11/2026). `irPara` marca o título
     * da etapa com `tabindex` e tira-o das outras; os atributos são um mapa, e é isso que o
     * arreio precisa de saber deles — que existem e que guardam o que lhes dão. */
    atributos: {},
    setAttribute(n, v) { this.atributos[n] = String(v); },
    getAttribute(n) { return this.atributos[n] === undefined ? null : this.atributos[n]; },
    removeAttribute(n) { delete this.atributos[n]; },
    querySelectorAll() { return []; },
    appendChild(o) { this.options.push(o); return o; },
    remove(i) { this.options.splice(i, 1); },
    focus() {},
    closest() { return null; },
    style: { setProperty() {} },
  };
  return e;
}

/** Monta um DOM falso, roda o script real e devolve os atalhos para observá-lo. */
function montar(respostas) {
  const porId = new Map();
  const byId = (id) => {
    if (!porId.has(id)) porId.set(id, elemento(id));
    return porId.get(id);
  };
  const radios = ['novo', 'existente'].map((v) => {
    const r = elemento('modo-' + v);
    r.value = v;
    // OS MESMOS objetos que o `getElementById` devolve: no navegador é um elemento só, e é
    // isso que faz `radiosModo[i].checked` e `getElementById("modo-novo").checked` falarem do
    // mesmo lugar. Sem isto, o arreio testaria dois formulários diferentes.
    porId.set('modo-' + v, r);
    return r;
  });
  // RADIOS DE MESMO `name` SÃO MUTUAMENTE EXCLUSIVOS — no navegador, marcar um desmarca o
  // outro. Sem modelar isso, o arreio diria que os dois estão marcados ao mesmo tempo, e
  // reprovaria um formulário que no navegador está certo.
  for (const r of radios) {
    let marcado = r.value === 'novo';
    Object.defineProperty(r, 'checked', {
      get() { return marcado; },
      set(v) {
        marcado = Boolean(v);
        if (marcado) for (const outro of radios) if (outro !== r) outro.checked = false;
      },
    });
  }
  const document = {
    getElementById: byId,
    querySelectorAll: (sel) => (sel.indexOf('modo-professor') !== -1 ? radios : []),
    createElement: (tag) => elemento(tag),
    addEventListener() {},
    documentElement: {
      style: { setProperty() {} },
      /* A PÁGINA PERGUNTA AO `<html>` QUAL DAS DUAS É (25/11/2026) — `data-pagina` é escrito
       * pelo servidor, e o formulário decide por ele se o professor se escolhe numa lista (painel)
       * ou se escreve o nome (público). O arreio falso é do PAINEL: sem o atributo, é isso que a
       * página responde. */
      getAttribute: () => null,
    },
  };
  const fetchFalso = (url) => {
    const chave = String(url).replace(/^\//, '');
    const dados = respostas[chave];
    if (dados === undefined) return Promise.reject(new Error('fetch não previsto: ' + url));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(dados) });
  };
  const janela = { addEventListener() {} };
  // O script real, rodado como está.
  new Function('document', 'window', 'location', 'fetch', SCRIPT)(document, janela, {}, fetchFalso);

  function digitar(valor) {
    byId('nome').value = valor;
    (byId('nome').ouvintes.input || []).forEach((fn) => fn());
  }
  async function abrirModal() {
    (byId('btn-criar').ouvintes.click || []).forEach((fn) => fn());
    // Os dois `fetch` do `carregarProfessores` resolvem em microtarefas.
    for (let i = 0; i < 8; i++) await Promise.resolve();
  }
  const opcoes = () => byId('professor-existente').options.map((o) => ({ slug: o.value, rotulo: o.textContent, desabilitado: o.disabled }));
  return { byId, radios, opcoes, digitar, abrirModal };
}

const LISTA = [
  { slug: 'tiago', nome: null, escolas: [], pasta: true },
  { slug: 'tiago-menegaz', nome: 'Tiago', escolas: ['fita'], pasta: true, viva: true },
  /* O PROFESSOR DE UMA ESCOLA QUE FOI APAGADA (24/11/2026). A pasta existe — é ela que o
   * servidor encontra quando recusa por colisão —, e nenhuma escola dele está viva. É o caso
   * dela: expurgou a `calango` e foi recriá-la com a «Demi Plié». */
  { slug: 'demi-plie', nome: 'Demi Plié', escolas: ['morta'], pasta: true, viva: false },
  /* O FANTASMA: nome que só sobrevive na memória de uma escola expurgada, sem pasta nenhuma.
   * Não pode ser oferecido — o servidor responderia «não existe — recarregue a lista». */
  { slug: 'sapo-bailarino', nome: 'Sapo Bailarino', escolas: ['morta'], pasta: false, viva: false },
];
const RESPOSTAS = {
  'api/professores': { ok: true, professores: LISTA },
  // `fita` está VIVA; `morta` não está nesta lista — é o que a distingue de uma escola viva.
  'api/escolas': { ok: true, escolas: [{ slug: 'fita', professor: 'Tiago Menegaz' }] },
};

(async () => {
  // ------------------------------------------------------------------------------------
  console.log('\n1. SEM O NOME DA ESCOLA, o caminho do reúso não se habilita');
  {
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    conferir('o caminho «usar um professor que já existe» está DESABILITADO',
      d.byId('modo-existente').disabled === true, d.byId('modo-existente').disabled);
    conferir('…e o rótulo diz por quê',
      d.byId('dica-existente').textContent === '— informe o nome da escola primeiro', d.byId('dica-existente').textContent);
    conferir('a opção fica apagada (não parece clicável)', d.byId('opcao-existente').classList.contains('apagada'), null);
    conferir('nenhum aviso de escola existente', d.byId('aviso-escola-existente').hidden === true, null);
    conferir('a lista já está carregada (para você VER antes de digitar)',
      d.opcoes().length === 3, d.opcoes());
    /* O FANTASMA NÃO ENTRA. Ele tem `pasta: false` — nome que só sobrevive na memória de uma
     * escola expurgada. Oferecê-lo daria «não existe — recarregue a lista» ao escolhê-lo. */
    conferir('…e o professor SEM pasta não é oferecido (o servidor diria «não existe»)',
      !d.opcoes().some((o) => o.slug === 'sapo-bailarino'), d.opcoes());
  }

  // ------------------------------------------------------------------------------------
  console.log('\n2. COM O NOME DE UMA ESCOLA QUE JÁ EXISTE («fita»): o dono dela não se escolhe');
  {
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    d.digitar('fita');
    const ops = d.opcoes();
    const menegaz = ops.find((o) => o.slug === 'tiago-menegaz');
    const tiago = ops.find((o) => o.slug === 'tiago');
    conferir('Tiago Menegaz APARECE na lista', Boolean(menegaz), ops);
    conferir('…e está DESABILITADO — ele já é o professor desta escola', menegaz && menegaz.desabilitado === true, menegaz);
    conferir('…e o rótulo diz isso', Boolean(menegaz) && /já é o professor desta escola/.test(menegaz.rotulo), menegaz && menegaz.rotulo);
    conferir('o professor que NÃO está nesta escola continua escolhível', tiago && tiago.desabilitado === false, tiago);
    conferir('a escolha caiu no professor livre, não no desabilitado',
      d.byId('professor-existente').options[d.byId('professor-existente').selectedIndex].value === 'tiago',
      d.byId('professor-existente').selectedIndex);
    conferir('o caminho do reúso agora se HABILITA (há um professor livre)',
      d.byId('modo-existente').disabled === false, d.byId('modo-existente').disabled);
    /* O RÓTULO CONTA QUANTOS HÁ, e não afirma uma coisa que pode ser falsa. «já dá aula em
     * outra escola» era o texto de antes, e deixou de ser verdade no dia em que a lista passou a
     * incluir quem não tem escola viva nenhuma — que é exactamente o caso do reúso. */
    conferir('…e o rótulo diz quantos professores há para escolher',
      d.byId('dica-existente').textContent === '— 2 professores cadastrados', d.byId('dica-existente').textContent);
    conferir('A ESCOLA QUE JÁ EXISTE é avisada antes',
      d.byId('aviso-escola-existente').hidden === false, null);
    conferir('…nomeando a escola e o professor dela',
      /«fita» já existe/.test(d.byId('aviso-escola-existente').textContent) &&
      /Tiago Menegaz/.test(d.byId('aviso-escola-existente').textContent),
      d.byId('aviso-escola-existente').textContent);
    conferir('…e dizendo que não se sobrescreve',
      /proveniência acrescenta/.test(d.byId('aviso-escola-existente').textContent),
      d.byId('aviso-escola-existente').textContent);
  }

  // ------------------------------------------------------------------------------------
  console.log('\n3. O NOME DA ESCOLA É NORMALIZADO — «Fíta» é a mesma «fita»');
  {
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    d.digitar('  FÍTA  ');
    const menegaz = d.opcoes().find((o) => o.slug === 'tiago-menegaz');
    conferir('com acento e espaço, o dono de «fita» ainda é reconhecido e desabilitado',
      menegaz && menegaz.desabilitado === true, menegaz);
    conferir('e o aviso de escola existente também aparece',
      d.byId('aviso-escola-existente').hidden === false, null);
  }
  {
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    d.digitar('Fita');
    const menegaz = d.opcoes().find((o) => o.slug === 'tiago-menegaz');
    conferir('com maiúscula («Fita»), idem', menegaz && menegaz.desabilitado === true, menegaz);
  }

  // ------------------------------------------------------------------------------------
  console.log('\n4. NOME DE ESCOLA NOVA: ninguém é barrado, e não há aviso');
  {
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    d.digitar('Ponta');
    const ops = d.opcoes();
    conferir('nenhum professor desabilitado', ops.every((o) => !o.desabilitado), ops);
    conferir('nenhum aviso de escola existente', d.byId('aviso-escola-existente').hidden === true, null);
    conferir('o caminho do reúso habilitado', d.byId('modo-existente').disabled === false, null);
  }

  // ------------------------------------------------------------------------------------
  console.log('\n5. SEM PROFESSOR NENHUM CADASTRADO');
  {
    const d = montar({ 'api/professores': { ok: true, professores: [] }, 'api/escolas': { ok: true, escolas: [] } });
    await d.abrirModal();
    d.digitar('Ponta');
    conferir('o caminho do reúso fica desabilitado mesmo com o nome dado',
      d.byId('modo-existente').disabled === true, null);
    conferir('…e o rótulo explica («nenhum professor cadastrado ainda»)',
      d.byId('dica-existente').textContent === '— nenhum professor cadastrado ainda', d.byId('dica-existente').textContent);
    conferir('a nota de «sem professores» aparece', d.byId('nota-sem-professores').hidden === false, null);
  }

  // ------------------------------------------------------------------------------------
  console.log('\n6. RECRIAR UMA ESCOLA APAGADA: o professor dela PODE ser reutilizado');
  {
    /* O DEFEITO DE 24/11/2026, medido pelo lado do formulário. Ela expurgou a `calango` e foi
     * recriá-la; o servidor respondeu «já existe o professor “Demi Plié” […] se for a mesma, use
     * «usar este professor»» — e a opção estava desabilitada, porque a lista vinha VAZIA e,
     * mesmo não vindo, ele seria excluído por «já dá aula nesta escola». Sem saída. */
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    d.digitar('morta');
    const demi = d.opcoes().find((o) => o.slug === 'demi-plie');
    conferir('o professor da escola APAGADA é oferecido', Boolean(demi), d.opcoes());
    conferir('…e PODE ser escolhido — é para isto que o reúso existe',
      demi && demi.desabilitado === false, demi);
    conferir('…e o rótulo diz que a escola dele já não está viva',
      Boolean(demi) && /sem escola viva/.test(demi.rotulo), demi && demi.rotulo);
    conferir('o caminho do reúso SE HABILITA ao digitar o nome da escola',
      d.byId('modo-existente').disabled === false, d.byId('modo-existente').disabled);
    conferir('…e nenhum aviso de escola existente (ela foi apagada, não está viva)',
      d.byId('aviso-escola-existente').hidden === true, null);
  }

  console.log('\n6b. TODOS OS PROFESSORES JÁ ESTÃO NESTA ESCOLA');
  {
    const d = montar({
      'api/professores': { ok: true, professores: [{ slug: 'tiago-menegaz', nome: 'Tiago', escolas: ['fita'] }] },
      'api/escolas': { ok: true, escolas: [{ slug: 'fita', professor: 'Tiago Menegaz' }] },
    });
    await d.abrirModal();
    d.digitar('fita');
    conferir('o único professor está desabilitado', d.opcoes()[0].desabilitado === true, d.opcoes());
    conferir('…e o reúso não se habilita (não há quem escolher)',
      d.byId('modo-existente').disabled === true, null);
    /* O RÓTULO DIZ O CASO, não um genérico: este professor existe, e o que o impede de servir é
     * a escola já existir com ele dentro. A frase antiga («não há outro professor cadastrado»)
     * era falsa — há um. */
    conferir('…com o rótulo dizendo por que não serve',
      d.byId('dica-existente').textContent === '— o único professor é o desta escola, e ela já existe',
      d.byId('dica-existente').textContent);
    /* A NOTA «sem professores» SAIU DA PÁGINA em 26/10/2026 (`2a8f3687`), e a prova continuou a
     * exigir que ela estivesse escondida. Um elemento que não existe é criado pelo DOM falso com
     * `hidden: false`, de modo que a asserção reprovava sempre — e o defeito que ela acusava era
     * o da prova. O recado passou a ser a `dica-existente`, medida acima; o que se afirma aqui é
     * que NÃO há uma segunda peça a dizer a mesma coisa. */
    conferir('não há uma segunda nota de «sem professores» — o recado é a dica, e só ela',
      html.indexOf('nota-sem-professores') === -1, 'a peça voltou: duas opiniões sobre o mesmo estado');
  }

  // ------------------------------------------------------------------------------------
  console.log('\n7. O CAMINHO ESCOLHIDO VOLTA PARA «NOVO» QUANDO O REÚSO DEIXA DE EXISTIR');
  {
    const d = montar(RESPOSTAS);
    await d.abrirModal();
    d.digitar('fita');
    d.radios[1].checked = true; d.radios[0].checked = false;   // escolhe «usar um professor que já existe»
    d.digitar('');                                            // apaga o nome da escola
    conferir('sem o nome da escola, o caminho volta sozinho para «professor novo»',
      d.radios[0].checked === true && d.radios[1].checked === false, d.radios.map((r) => r.checked));
    conferir('…e o bloco visível é o do professor novo',
      d.byId('bloco-novo').hidden === false && d.byId('bloco-existente').hidden === true, null);
  }

  console.log('\n' + (falhas === 0 ? 'TODAS as provas passaram.' : falhas + ' prova(s) FALHARAM.'));
  process.exit(falhas === 0 ? 0 : 1);
})();
