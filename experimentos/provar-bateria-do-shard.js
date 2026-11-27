#!/usr/bin/env node
'use strict';

/*
 * provar-bateria-do-shard.js — a bateria de dez gestos do `PLANO-SHARD.md` §4, contra as escolas
 * de teste REAIS, pelo domínio próprio.
 *
 * POR QUE ELA É UM PROGRAMA E NÃO UMA LISTA DE CLICKS. A bateria existe para ser corrida DUAS
 * vezes: antes do shard (três Workers, três escolas) e depois dele (um Worker, três escolas). Se
 * for feita à mão, a segunda corrida mede outra coisa — a memória de quem clicou. Sendo programa,
 * o que muda entre as duas corridas é só a topologia, e qualquer diferença de resultado é do
 * shard.
 *
 * O QUE ELA PROVA, e o que cada prova quer dizer:
 *
 *   · ROTEAMENTO — cada host serve a SUA escola (`/api/saude` diz `slug` e `escola_do_pacote`), e
 *     `origem: "mapa"` diz que quem resolveu foi o mapa em KV, não uma `var` de deploy.
 *   · ISOLAMENTO — o gesto feito na escola A não muda a impressão digital de B nem de C. É a
 *     asserção que dá sentido às outras: sem ela, «funcionou» pode querer dizer «funcionou na
 *     escola errada».
 *   · DOCUMENTO SERVIDO — `/aulas/`, `/ciclos/planos/` e um PDF de verdade respondem 200, no
 *     caminho de hoje (é o que o shard promete não mudar).
 *   · ASSETS SEM WORKER — `/assets/style.css` e `/nav.js` servem, e são IGUAIS nas três escolas.
 *     A igualdade é o que torna legítima a cópia partilhada de `/assets/` no passo 2 (§2.2 do
 *     plano): partilhar um ficheiro que difere seria unificar aparências por acidente.
 *
 * O QUE ELA NÃO FAZ POR OMISSÃO, E PORQUÊ — O MOTIVO ESTAVA ERRADO (15/11/2026). Os gestos 4–7
 * (anamnese, plano de ensino, PO, linha de base) estavam ditos como pendentes por «passarem por
 * `POST /api/elicitar`, que ELICITA com o modelo». **Não passa.** Com um mapa de `respostas`,
 * `/api/elicitar` grava pelo runtime puro (`motor/nucleo/elicitar.js`) e não fala com o modelo —
 * quem fala é `/api/ia`, que serve a condução. A bancada de comandos (`elicitar.js --respostas`) e
 * a cadeia automática do servidor (`cadeia.js`) usam o mesmo caminho, e é por isso que ele é o
 * caminho normal e não um atalho de teste.
 *
 * O motivo verdadeiro é outro, e é de CUSTÓDIA: cada gesto grava um envelope no repositório da
 * escola (um commit por documento), e um PO concluído escreve as fontes do ciclo e DISPARA a
 * geração. Numa bateria que corre duas vezes por topologia, isso são dezenas de commits em `main`,
 * cada um a acordar os dois workflows do repositório. Por isso continuam a exigir um sim explícito
 * — `--com-documentos` —, e o que fica medido por omissão é a bancada local
 * (`experimentos/provar-gestos-do-shard.js`), que exercita os mesmos quatro caminhos sem rede.
 *
 *   node experimentos/provar-bateria-do-shard.js
 *   node experimentos/provar-bateria-do-shard.js --com-documentos     # corre 4–7 AO VIVO (grava)
 *   node experimentos/provar-bateria-do-shard.js --zona padd.com.br     # outro domínio
 *   node experimentos/provar-bateria-do-shard.js --so-leitura           # não escreve nada
 *
 * As senhas vêm de `tools/.senhas-locais` (local, fora do Git). As escritas vão com
 * `senhaDirecao`, que é a senha da direção — a mesma que a tela pede.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const args = process.argv.slice(2);
const arg = (nome, padrao) => {
  const i = args.indexOf(nome);
  return i === -1 ? padrao : (args[i + 1] || padrao);
};
const ZONA = arg('--zona', 'padd.com.br');
const SO_LEITURA = args.includes('--so-leitura');
/* OS GESTOS 4–7, E O SIM EXPLÍCITO. Não é o modelo que eles custam — é a custódia: cada gesto
 * grava um envelope no repositório (um commit por documento) e um PO concluído dispara a geração.
 * Ver o cabeçalho. */
const COM_DOCUMENTOS = args.includes('--com-documentos');

/** As escolas de teste — e o número que `motor/servidor/teste-fixtures.js` lhes dá pelo nome. */
const ESCOLAS = [
  { slug: 'calango', teste: '1', professor: 'pe-torto' },
  { slug: 'batata', teste: '2', professor: 'coqui-de-redinha' },
  { slug: 'breu', teste: '3', professor: 'redinha-rosa' },
];

let ok = 0;
let ko = 0;
let pendentes = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); }
  else { ko += 1; console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe))); }
};
const pendente = (rotulo, motivo) => {
  pendentes += 1;
  console.log('  ····  PENDENTE ' + rotulo + ' — ' + motivo);
};

/** As senhas da casa: `LOGIN_<SUJEITO>="…"`. Fora do Git, e é por isso que se lê daqui. */
function senhas() {
  const texto = fs.readFileSync(path.join(RAIZ, 'tools/.senhas-locais'), 'utf8');
  const mapa = {};
  for (const l of texto.split('\n')) {
    const m = /^(?:export\s+)?([A-Z0-9_]+)\s*=\s*"([^"]*)"/.exec(l.trim());
    if (m) mapa[m[1]] = m[2];
  }
  return mapa;
}
const SENHAS = senhas();
const senhaDe = (slug) => SENHAS['LOGIN_' + slug.toUpperCase().replace(/-/g, '_')] || '';

const base = (slug) => 'https://' + slug + '.' + ZONA;

/** Um pedido, com a senha da direção no `Authorization` e, quando é escrita, no corpo. */
async function chamar(slug, caminho, opcoes) {
  const o = opcoes || {};
  const auth = 'Basic ' + Buffer.from(slug + ':' + senhaDe(slug)).toString('base64');
  const init = { method: o.metodo || 'GET', headers: { Authorization: auth } };
  if (o.corpo !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(Object.assign({ senhaDirecao: senhaDe(slug) }, o.corpo));
  }
  const res = await fetch(base(slug) + caminho, init);
  let corpo = null;
  const texto = await res.text();
  try { corpo = JSON.parse(texto); } catch (erro) { corpo = null; }
  return { status: res.status, corpo, texto };
}

/** O hash do texto — para dizer «isto não mudou» sem guardar o conteúdo todo. */
const impressao = (texto) => crypto.createHash('sha256').update(String(texto)).digest('hex').slice(0, 12);

/**
 * A IMPRESSÃO DIGITAL DE UMA ESCOLA. Três listas que os gestos tocam. É o que permite afirmar
 * «o gesto em A não tocou em B»: comparam-se os hashes antes e depois, e o que não devia mudar
 * tem de ter o mesmo hash.
 */
async function digital(slug) {
  const d = {};
  for (const [nome, caminho] of [['turmas', '/api/bastidores/turmas'],
    ['professores', '/api/bastidores/professores'],
    ['alunas', '/api/bastidores/alunas']]) {
    const r = await chamar(slug, caminho);
    d[nome] = impressao(JSON.stringify(r.corpo && (r.corpo[nome] || r.corpo.slug || r.corpo)));
  }
  return d;
}

(async () => {
  console.log('bateria do shard — ' + ESCOLAS.length + ' escolas em `' + ZONA + '`' +
    (SO_LEITURA ? '  (só leitura)' : '') + '\n');

  /* SEM ESCOLA NO AR, A BATERIA NÃO MEDE — E DIZ ISSO (15/11/2026).
   *
   * Medido depois de ela expurgar as três: a bateria corria e reportava **34 falhas**, todas a
   * dizer «responde 404/530» — que se lê como «o shard partiu». Não partiu: as escolas já não
   * existem, e uma bateria que mede o vazio a chamar-lhe falha é uma bateria que mente ao
   * contrário. É a mesma disciplina do `provar-navegacao` («Chrome não encontrado — conferência
   * NÃO FEITA») e do `umPacote()`: a ausência diz-se pelo estado, não por um número vermelho.
   *
   * O que se sonda é o `/api/saude` de cada host, que é a rota que existe em qualquer escola viva
   * e não pede senha. Sem NENHUMA a responder, sai com 0 e um recado — porque não há nada para
   * medir, e um código de erro faria o CI vermelho por uma razão que não é um defeito. */
  const vivas = [];
  for (const e of ESCOLAS) {
    try {
      const r = await chamar(e.slug, '/api/saude');
      if (r.status === 200 && r.corpo && r.corpo.ok) vivas.push(e.slug);
    } catch (erro) { /* host fora do ar: não está viva */ }
  }
  if (!vivas.length) {
    console.log('NÃO FEITO — nenhuma das ' + ESCOLAS.length + ' escolas responde: ' +
      ESCOLAS.map((e) => e.slug).join(', '));
    console.log('  O shard e o mapa estão de pé; o que não existe são as escolas. Crie-as pela');
    console.log('  página `danca`, e corra a bateria outra vez. Uma bateria sem escolas mede o');
    console.log('  vazio, e reportá-lo como falha diria «o shard partiu» — que é falso.');
    process.exit(0);
  }
  const ausentes = ESCOLAS.filter((e) => vivas.indexOf(e.slug) === -1).map((e) => e.slug);
  if (ausentes.length) {
    console.log('aviso: sem resposta (e por isso fora da bateria): ' + ausentes.join(', ') + '\n');
  }
  /* «FORA DA BATERIA» TEM DE SER VERDADE (26/11/2026) — e não era.
   *
   * Esta prova montava a lista das que respondem (`vivas`), escrevia «e por isso fora da bateria»,
   * e depois percorria `ESCOLAS` — TODAS — nos sete laços abaixo. Enquanto as três escolas estavam
   * no ar, a diferença era invisível. No dia em que duas saíram (o expurgo da `breu` e as duas de
   * teste já suspensas), o primeiro `fetch` a um host morto lançou `TypeError: fetch failed` e a
   * bateria inteira morreu sem medir nada — com a linha acima já a dizer que as tinha excluído.
   *
   * Uma frase que anuncia uma exclusão que o código não faz é pior do que não a anunciar: quem lê o
   * relatório conclui que as outras foram medidas. O que se percorre passa a ser a lista que
   * respondeu. */
  const ALVOS = ESCOLAS.filter((e) => vivas.indexOf(e.slug) !== -1);

  /* ── GESTÃO 1 · cada host serve a sua escola ─────────────────────────────────────────────── */
  console.log('1. abrir `/` de cada escola pelo domínio próprio');
  for (const e of ALVOS) {
    const r = await chamar(e.slug, '/');
    const teste = (/data-escola-teste="([^"]*)"/.exec(r.texto) || [])[1];
    provar('`/' + e.slug + '` responde 200', r.status === 200, r.status);
    /* SEM CAIXA EXACTA (14/11/2026). O `calango` nasceu com o título «— Calango» e a `batata`
     * com «— batata», porque o título segue o nome de exibição que a escola declarou. A asserção
     * é sobre NOMEAR a escola, não sobre a caixa da primeira letra. */
    provar('…e o título diz «Sistema Lastro — ' + e.slug + '»',
      new RegExp('<title>Sistema Lastro — ' + e.slug + '</title>', 'i').test(r.texto), null);
    provar('…e a página declara o número de teste ' + e.teste, teste === e.teste, teste);
  }

  /* ── GESTÃO 2 · os documentos servidos, no caminho de hoje ──────────────────────────────── */
  console.log('\n2. `/aulas/`, `/ciclos/planos/` e um PDF');
  for (const e of ALVOS) {
    for (const caminho of ['/aulas/', '/ciclos/planos/']) {
      const r = await chamar(e.slug, caminho);
      provar('`' + caminho + '` de ' + e.slug + ' responde 200', r.status === 200, r.status);
    }
  }
  {
    /* O PDF NÃO NASCE COM A ESCOLA (15/11/2026) — nasce do `gerar-ciclo.sh`, que corre DEPOIS de
     * o professor preencher o PO. Uma escola recém-criada tem o pacote-zero (a porta, o índice, a
     * apresentação) e nenhum ciclo gerado; exigir-lhe um PDF era exigir-lhe o resultado de um
     * trabalho que ainda não aconteceu. Medido a 15/11/2026, nas três escolas criadas nesse dia:
     * `404` — e o 404 estava certo.
     *
     * O QUE SE MEDE, então, é o que a bateria pode afirmar de uma escola em qualquer estado:
     *
     *   · o caminho do PDF é RECONHECIDO pelo Worker — ou seja, ele não devolve o 404 das páginas
     *     que não existem, e o pedido chega ao ASSETS;
     *   · e quando o PDF existe, ele vem como PDF.
     *
     * A primeira metade é a que apanha o defeito que esta secção existe para apanhar (o caminho
     * mal reescrito no shard); a segunda é a que confirma o tipo, quando há o que confirmar. */
    /* A ESCOLA VEM DA LISTA QUE RESPONDEU, e não escrita à mão (26/11/2026). Aqui estava
     * `calango` em dois sítios, e a `calango` já não existe: a bateria morria com `fetch failed` na
     * secção do PDF, depois de as secções anteriores terem corrido bem. O que esta secção mede é o
     * REWRITE do caminho pelo Worker — o nome da escola é acidente, e escreve-o quem sabe qual
     * está viva. */
    const escolaDoPdf = ALVOS[0].slug;
    const caminhoDoPdf = '/rosa/ciclo-01-' + escolaDoPdf + '-rosa.pdf';
    const r = await chamar(escolaDoPdf, caminhoDoPdf);
    const existe = r.status === 200;
    provar('o caminho do PDF é reconhecido (200 quando há, 404 de ASSETS quando ainda não)',
      existe || r.status === 404, r.status);
    if (existe) {
      provar('…e vem como PDF', /^%PDF/.test(r.texto.slice(0, 4)), r.texto.slice(0, 12));
    } else {
      provar('…e sem ciclo gerado, a ausência é do PDF e não da escola (a lista responde)',
        (await chamar(escolaDoPdf, '/ciclos/planos/')).status === 200, null);
    }
  }

  /* ── GESTÃO 3 · os assets, e a igualdade que autoriza partilhá-los ─────────────────────── */
  console.log('\n3. `/assets/style.css` e `/nav.js` — servidos, e iguais nas que respondem');
  const hashes = {};
  for (const e of ALVOS) {
    hashes[e.slug] = {};
    for (const f of ['style.css', 'nav.js']) {
      const r = await chamar(e.slug, '/assets/' + f);
      provar('`/assets/' + f + '` de ' + e.slug + ' responde 200', r.status === 200, r.status);
      hashes[e.slug][f] = impressao(r.texto);
    }
  }
  for (const f of ['style.css', 'nav.js']) {
    /* A IGUALDADE É ENTRE AS QUE RESPONDERAM. `ESCOLAS` aqui lia o `hashes` de uma escola que nunca
     * foi pedida (`undefined`), e o `.map` rebentava com «Cannot read properties of undefined» —
     * a terceira morte seguida da mesma causa: uma lista de escolas escrita à mão onde o código já
     * tinha, ao lado, a lista de quem existe. Com as três vivas a diferença era invisível. */
    const distintos = new Set(ALVOS.map((e) => hashes[e.slug][f]));
    provar('`' + f + '` é IGUAL em todas as escolas que responderam (é o que autoriza a cópia partilhada do passo 2)',
      distintos.size === 1, [...distintos]);
  }

  /* ── GESTÃO 10 · o mapa respondeu, e não uma `var` de deploy ───────────────────────────── */
  console.log('\n10. `/api/saude` de cada host');
  for (const e of ALVOS) {
    const r = await chamar(e.slug, '/api/saude');
    provar('`/api/saude` de ' + e.slug + ' diz `slug: ' + e.slug + '`',
      r.corpo && r.corpo.slug === e.slug, r.corpo && r.corpo.slug);
    provar('…`origem: "mapa"` (a escola veio do KV, não de uma variável de deploy)',
      r.corpo && r.corpo.origem === 'mapa', r.corpo && r.corpo.origem);
    provar('…`escola_do_pacote: ' + e.slug + '` (o pacote servido é o dela)',
      r.corpo && r.corpo.escola_do_pacote === e.slug, r.corpo && r.corpo.escola_do_pacote);
  }

  /* ── A IMPRESSÃO ANTES DOS GESTOS QUE ESCREVEM ─────────────────────────────────────────── */
  const antes = {};
  for (const e of ALVOS) antes[e.slug] = await digital(e.slug);

  /* A ESCOLA DOS GESTOS DE TURMA NASCE AQUI, no âmbito de fora, porque a secção do isolamento —
   * lá em baixo — tem de perguntar-lhe se a turma de prova ficou apagada. Declarada dentro do
   * `else`, ela não existia onde é usada. */
  let escolaDaTurma = null;
  if (SO_LEITURA) {
    console.log('\n(só leitura — os gestos 7, 8 e 9 não foram corridos)');
    pendente('gestos 8 e 9 (turma, professor)', '--so-leitura');
  } else {
    /* ── GESTÃO 8 · a turma: criar, mudar de sala, apagar ──────────────────────────────────── */
    /* A ESCOLA DA SECÇÃO É ESCOLHIDA PELO ESTADO QUE A SECÇÃO PRECISA (26/11/2026). Aqui estava
     * `batata` escrita à mão, e com uma razão: é a que não tinha turma nenhuma. O nome fixo virou
     * dependência de uma escola específica estar viva — quando ela saiu, a bateria morreu aqui.
     *
     * O que a secção precisa é «uma escola viva sem turmas de prova». Pergunta-se, em vez de se
     * supor; e quando nenhuma serve, a secção SALTA e diz porquê, em vez de inventar um alvo que
     * não existe ou de sujar a escola de outra pessoa. */
    escolaDaTurma = await (async () => {
      for (const e of ALVOS) {
        try {
          const r = await chamar(e.slug, '/api/bastidores/turmas');
          const lista = (r.corpo && r.corpo.turmas) || [];
          if (!lista.some((t) => /Prova do Shard/.test(String(t.nome)))) return e.slug;
        } catch (erro) { /* host que caiu entre a lista e agora: tenta o seguinte */ }
      }
      return null;
    })();
    if (!escolaDaTurma) {
      console.log('   NÃO FEITO — nenhuma escola viva está sem uma «Prova do Shard» de uma ' +
        'passagem anterior; a secção não corre para não deixar lixo na escola de outra pessoa.');
    } else {
    console.log('\n8. turma — criar, editar, apagar (na `' + escolaDaTurma + '`, que não tinha nenhuma)');
    const turma = {
      nome: 'Prova do Shard',
      dias: ['ter', 'qui'],
      horarios: { ter: '09:00', qui: '09:00' },
      duracaoMin: 60,
      periodoInicio: '2026-11-20',
      periodoFim: '2026-12-20',
    };
    const criada = await chamar(escolaDaTurma, '/api/bastidores/turma', { metodo: 'POST', corpo: turma });
    provar('criar a turma responde 201', criada.status === 201, [criada.status, criada.corpo && criada.corpo.erro]);
    const idTurma = criada.corpo && criada.corpo.id;

    /* O ID DA TURMA É O SLUG DO NOME, E POR ISSO MUDA AO RENOMEAR (medido a 14/11/2026, nesta
     * bancada). O apagar tem de usar o id que a edição DEVOLVEU — o antigo responde 404, e a
     * primeira versão desta bateria ficou a apontar para ele. Não é defeito do sistema: o
     * `turma-editar` reescreve a chave dos vínculos turma↔termo justamente porque o id mudou, e
     * diz o id novo na resposta (`id`, e o antigo em `eraId`). */
    const editada = await chamar(escolaDaTurma, '/api/bastidores/turma-editar', {
      metodo: 'POST', corpo: Object.assign({ id: idTurma }, turma, { nome: 'Prova do Shard (movida)' }),
    });
    provar('editar a turma responde 200', editada.status === 200, [editada.status, editada.corpo && editada.corpo.erro]);
    const idEditada = (editada.corpo && editada.corpo.id) || idTurma;
    provar('…e a resposta diz o id NOVO, e o antigo em `eraId`',
      editada.corpo && editada.corpo.id === 'prova-do-shard-movida' && editada.corpo.eraId === idTurma,
      editada.corpo && { id: editada.corpo.id, eraId: editada.corpo.eraId });
    const listaBatata = await chamar(escolaDaTurma, '/api/bastidores/turmas');
    provar('…e o nome novo está na lista', /Prova do Shard \(movida\)/.test(JSON.stringify(listaBatata.corpo)), null);
    provar('…e o nome antigo não ficou como segunda turma',
      (listaBatata.corpo.turmas || []).filter((t) => /Prova do Shard/.test(String(t.nome))).length === 1,
      (listaBatata.corpo.turmas || []).map((t) => t.nome));

    const apagada = await chamar(escolaDaTurma, '/api/bastidores/turma', { metodo: 'DELETE', corpo: { id: idEditada } });
    provar('apagar a turma responde 200', apagada.status === 200, [apagada.status, apagada.corpo && apagada.corpo.erro]);
    const depoisBatata = await chamar(escolaDaTurma, '/api/bastidores/turmas');
    provar('…e a escola volta a não ter turmas de prova',
      !(depoisBatata.corpo.turmas || []).some((t) => /Prova do Shard/.test(String(t.nome))), null);

    }

    /* ── GESTÃO 9 · o professor: cadastrar, desligar, excluir ──────────────────────────────── */
    console.log('\n9. professor — cadastrar, desligar, excluir (na `breu`)');
    /* A SENHA DO PROFESSOR DE PROVA NÃO É A DA CASA (14/11/2026). Aqui esteve a senha de teste
     * partilhada, e o `pre-push` barrou o push com razão: o valor estava a passar para um arquivo
     * versionado. O professor criado abaixo é desligado no gesto seguinte e nunca entra em lugar
     * nenhum — a senha dele não precisa de ser a de ninguém, e um valor descartável é o que
     * mantém a regra verdadeira («nenhuma senha em arquivo versionado»), em vez de abrir-lhe uma
     * excepção que amanhã serve para outra coisa. */
    const prof = { nome: 'Prova', sobrenome: 'Do Shard', senha: 'prova-do-shard-descartavel' };
    const cadastrado = await chamar('breu', '/api/bastidores/professor', { metodo: 'POST', corpo: prof });
    provar('cadastrar o professor responde 200/201', cadastrado.status === 200 || cadastrado.status === 201,
      [cadastrado.status, cadastrado.corpo && cadastrado.corpo.erro]);
    /* O MOTIVO É OBRIGATÓRIO, e não é formalidade: é ele que fica registado para a direção
     * (`motor/nucleo/desligamento.js`). Uma saída sem motivo é uma saída que ninguém explica
     * seis meses depois. */
    const desligado = await chamar('breu', '/api/bastidores/professor-desligar', {
      metodo: 'POST', corpo: { professor: 'prova-do-shard', motivo: 'bateria de bancada do shard' },
    });
    provar('desligar o professor responde 200', desligado.status === 200, [desligado.status, desligado.corpo && desligado.corpo.erro]);
    /* EXCLUIR UM PROFESSOR DESLIGADO É RECUSADO — e a recusa é a REGRA, não um defeito
     * (medido a 14/11/2026, nesta bancada). O sistema responde 409 e explica: «o registo dele fica
     * como proveniência, e o nome continua nos documentos que assinou. Se ele voltar à escola,
     * cadastre-o outra vez com o mesmo identificador: o cadastro o reactiva».
     *
     * É a mesma pétrea do expurgo, aplicada a uma pessoa: o passado não se apaga. A bancada
     * passou a afirmar a recusa — antes afirmava um «200» que o sistema, coerentemente, não dá. */
    const excluido = await chamar('breu', '/api/bastidores/professor', {
      metodo: 'DELETE', corpo: { nome: 'prova-do-shard' },
    });
    provar('excluir um professor DESLIGADO é RECUSADO (409) — a proveniência fica',
      excluido.status === 409, [excluido.status, excluido.corpo && excluido.corpo.erro]);
    provar('…e a recusa diz por quê, e o que fazer para o reactivar',
      /proveni[eê]ncia/.test(String(excluido.corpo && excluido.corpo.erro))
        && /reactiva/.test(String(excluido.corpo && excluido.corpo.erro)),
      excluido.corpo && excluido.corpo.erro);
    /* O SELETOR NÃO O OFERECE, MAS A LISTA DA ESCOLA GUARDA-O (15/11/2026).
     *
     * Aqui afirmava-se `/Prova Do Shard/i.test(... /api/bastidores/professores)` — «continua na
     * lista, marcado». Duas coisas se confundiam nessa linha, e a pesquisadora apanhou a segunda:
     * esta rota é o SELETOR dos formulários (anamnese, plano, PO), devolve `{nome, slug}` e não
     * tem selo nenhum. O que ela afirmava, na prática, era «o desligado continua a poder abrir um
     * ato» — o defeito. O registo dele continua na lista da ESCOLA, que é a Produção, e é lá que
     * o selo `desligado` está. */
    const depoisBreu = await chamar('breu', '/api/bastidores/professores');
    provar('…e o seletor do ato já NÃO o oferece',
      !/Prova Do Shard/i.test(JSON.stringify(depoisBreu.corpo)), depoisBreu.corpo);
    const producaoBreu = await chamar('breu', '/bastidores/estudio');
    provar('…mas a lista da escola continua a mostrá-lo, com o selo `desligado`',
      /Prova Do Shard/i.test(producaoBreu.texto) && /desligado/.test(producaoBreu.texto), null);

    /* ── OS GESTOS 4–7 · AS RESPOSTAS DECLARADAS ──────────────────────────────────────────── */
    /* O MAPA DE RESPOSTAS É O QUE TORNA ESTES GESTOS DETERMINÍSTICOS. `POST /api/elicitar` com
     * `respostas` grava pelo runtime puro e NÃO chama o modelo — é o mesmo corpo que a tela envia
     * depois de o professor responder, e o mesmo que `cadeia.js` usa. O que varia entre duas
     * corridas desta bateria, por isso, não é o documento: é a topologia. */
    if (!COM_DOCUMENTOS) {
      pendente('4. anamnese — criar, editar, apagar',
        'cada gesto grava um envelope no repositório da escola (um commit por documento); '
        + 'corra com --com-documentos, ou meça na bancada local (provar-gestos-do-shard)');
      pendente('5. plano de ensino — criar, derivar', 'idem');
      pendente('6. PO — criar, concluir, gerar', 'idem — e concluir DISPARA a geração de um pacote');
      pendente('7. linha de base — enviar, alterar elenco', 'idem');
    } else {
      const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });
      const anamneseDe = (aluna) => ({
        fonte: 'anamnese',
        respostas: {
          idade: r('12/03/2015'), 'categoria-etaria': r('Infantil'),
          conhecimentoPrevio: r('balé, um ano'), musicalidade: r('mantém o pulso'),
          tendu: r('reconhece o apoio'),
        },
        contexto: { professor: 'pe-torto', aluna },
      });
      const ESCOLA_DOS_DOCUMENTOS = 'calango';

      /* GESTÃO 4 · ANAMNESE — criar, editar, apagar (a aluna tem de existir no elenco). */
      console.log('\n4. anamnese — criar, editar, apagar (na `' + ESCOLA_DOS_DOCUMENTOS + '`)');
      const elenco = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/bastidores/alunas');
      const aluna = ((elenco.corpo && elenco.corpo.alunas) || [])[0] || null;
      if (!aluna) {
        pendente('4. anamnese', 'a escola não tem aluna nenhuma para receber a anamnese');
      } else {
        const criada = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/elicitar', {
          metodo: 'POST', corpo: anamneseDe(aluna),
        });
        const id = criada.corpo && criada.corpo.documento && criada.corpo.documento.id;
        provar('criar a anamnese responde 200', criada.status === 200, [criada.status, criada.corpo && criada.corpo.erro]);
        provar('…e devolve o envelope', Boolean(id), criada.corpo && criada.corpo.documento);
        if (id) {
          const editada = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/anamnese-editar/' + id, {
            metodo: 'PUT', corpo: Object.assign(anamneseDe(aluna), {
              respostas: Object.assign(anamneseDe(aluna).respostas, { musicalidade: r('antecipa o pulso') }),
            }),
          });
          provar('editar a anamnese LIVRE responde 200', editada.status === 200, [editada.status, editada.corpo && editada.corpo.erro]);
          /* O ID DA EDIÇÃO É O QUE A RESPOSTA DEVOLVE: uma anamnese livre que muda de facto é
           * reescrita com o carimbo da hora da mudança. Apontar para o id de entrada é o defeito
           * que já apareceu duas vezes nesta casa (`turma-editar`, e a bancada local). */
          const idEditado = (editada.corpo && editada.corpo.editada) || id;
          const apagada = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/anamnese-vinculo/' + idEditado, {
            metodo: 'DELETE', corpo: {},
          });
          provar('apagar a anamnese ainda SOLTA responde 200', apagada.status === 200, [apagada.status, apagada.corpo && apagada.corpo.erro]);
        }
      }

      /* GESTÃO 5 · PLANO DE ENSINO — criar, derivar. Sem curadoria para a turma, a rota do plano
       * recusa (403), e isso NÃO é falha da topologia: é a regra, e é medida na bancada local. */
      console.log('\n5. plano de ensino — criar, derivar (na `' + ESCOLA_DOS_DOCUMENTOS + '`)');
      {
        const curadoria = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/bastidores/curadoria-professor?professor=pe-torto');
        const dele = (curadoria.corpo && curadoria.corpo.curadorias) || [];
        const turma = dele.length ? ((dele[0].turmas || [])[0] || '') : '';
        if (!turma) {
          pendente('5. plano de ensino', 'o professor desta escola não tem turma curada — sem ela a rota recusa (403), e é a regra');
        } else {
          const respostas = {
            'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
            'contexto-escola': r(ESCOLA_DOS_DOCUMENTOS), 'contexto-professor': r('pe-torto'),
            'contexto-turma': r(turma), 'contexto-frequencia': r('2x/semana'),
            'contexto-duracao': r([{ numero: 60, unidade: 'minuto' }]),
            'contexto-calendario': r({ inicio: '2026-11-11', fim: '2026-12-20' }),
            'contexto-volume': r('21 aulas'), 'contexto-registro': r('captura escrita'),
            'marcos-por-aula': r(['reconhecer o apoio', 'transferir o peso']),
            'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu'] }]),
            'aula-1-sequencia': r([{ Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio',
              'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' }]),
            'criterio-de-extensao': r('estender em duas aulas'),
            proveniencia: r(['a bateria do shard']),
          };
          const criado = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/elicitar', {
            metodo: 'POST', corpo: { fonte: 'plano', respostas, contexto: { professor: 'pe-torto', ciclo: '01', turma } },
          });
          const idPlano = criado.corpo && criado.corpo.documento && criado.corpo.documento.id;
          provar('criar o plano de ensino responde 200', criado.status === 200, [criado.status, criado.corpo && criado.corpo.erro]);
          if (idPlano) {
            const derivado = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/elicitar', {
              metodo: 'POST',
              corpo: { fonte: 'plano', ajuste_de: idPlano, motivo: 'a bateria do shard',
                respostas: Object.assign({}, respostas, { 'criterio-de-extensao': r('estender em três aulas') }),
                contexto: { professor: 'pe-torto', ciclo: '01', turma } },
            });
            const idNovo = derivado.corpo && derivado.corpo.documento && derivado.corpo.documento.id;
            provar('derivar o plano responde 200 e dá um id NOVO',
              derivado.status === 200 && idNovo && idNovo !== idPlano, { status: derivado.status, idPlano, idNovo });
          }
        }
      }

      /* GESTÃO 6 · PO — criar, concluir, gerar. **ESTE É O GESTO CARO**: concluir escreve as
       * fontes do ciclo e dispara a geração. Fica dito no relatório, porque não é o mesmo que
       * criar um envelope. */
      console.log('\n6. Plano de Observação — criar, concluir, gerar');
      pendente('6. PO — criar, concluir, gerar',
        'concluir o PO escreve as fontes do ciclo e DISPARA a geração (um pacote novo em `main`); '
        + 'a bancada local mede os três passos com o disparo espiado (provar-gestos-do-shard, §6)');

      /* GESTÃO 7 · LINHA DE BASE — enviar, alterar elenco. */
      console.log('\n7. linha de base — enviar, alterar elenco');
      {
        const linhas = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/bastidores/linhas-de-base');
        const rascunhos = (linhas.corpo && (linhas.corpo.rascunhos || linhas.corpo.linhas)) || [];
        const livre = rascunhos.find((l) => l && l.id && (l.alunas || []).length && (l.campos || []).length);
        if (!livre) {
          pendente('7. linha de base', 'a escola não tem rascunho de elenco com alunas e recorte neste momento');
        } else {
          const turmas = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/bastidores/turmas');
          const turmaDaBase = (livre.turma || '')
            || (((turmas.corpo && turmas.corpo.turmas) || []).map((t) => t && t.nome).filter(Boolean)[0] || '');
          const enviada = await chamar(ESCOLA_DOS_DOCUMENTOS, '/api/bastidores/linha-de-base/enviar', {
            metodo: 'POST', corpo: { id: livre.id, turma: turmaDaBase },
          });
          provar('enviar a linha de base para a turma responde 200', enviada.status === 200,
            [enviada.status, enviada.corpo && enviada.corpo.erro]);
          provar('…e diz ONDE gravou (repositório ou KV), em vez de fingir',
            Boolean(enviada.corpo && enviada.corpo.gravado), enviada.corpo && enviada.corpo.gravado);
        }
      }
    }
  }

  /* ── O ISOLAMENTO · o gesto numa escola não toca nas outras ─────────────────────────────── */
  console.log('\nISOLAMENTO — a impressão de quem não devia mudar');
  const depois = {};
  for (const e of ALVOS) depois[e.slug] = await digital(e.slug);

  /* DUAS AFIRMAÇÕES DIFERENTES, e a distinção é o ponto.
   *
   *   · as escolas ONDE NADA FOI FEITO têm de fechar com a impressão digital idêntica — é a
   *     asserção de isolamento, e é a que o shard pode quebrar (um Worker a servir N escolas é
   *     exactamente onde uma escola pode começar a escrever na outra);
   *   · a escola ONDE O GESTO CORREU não fecha igual, e não é falha: o professor desligado FICA,
   *     por decisão (proveniência). Exigir-lhe o mesmo hash seria exigir que a bancada apagasse o
   *     que o sistema, coerentemente, guarda. */
  /* AS INTOCADAS SÃO AS QUE RESPONDERAM, e não um nome escrito à mão. Aqui estava `['calango']`,
   * e com a `calango` fora do ar o `antes[slug]` era `undefined` — o `Object.keys` rebentava, e a
   * bateria morria na ÚLTIMA secção, depois de todas as outras terem medido. Um isolamento que só
   * se pode medir contra uma escola específica não é um isolamento: é uma dependência. */
  const INTOCADAS = (SO_LEITURA ? ALVOS.map((e) => e.slug) : ALVOS.map((e) => e.slug)
    .filter((slug) => antes[slug] && depois[slug]))
    .filter((slug) => antes[slug] && depois[slug]);
  for (const slug of INTOCADAS) {
    const mudou = Object.keys(antes[slug]).filter((k) => antes[slug][k] !== depois[slug][k]);
    provar('`' + slug + '`, onde NENHUM gesto correu, fecha com a MESMA impressão digital',
      mudou.length === 0, { mudou, antes: antes[slug], depois: depois[slug] });
  }
  if (!SO_LEITURA) {
    const turmasDe = async (slug) => (await chamar(slug, '/api/bastidores/turmas')).corpo.turmas || [];
    /* O RÓTULO DIZ A ESCOLA QUE FOI USADA, e não a que costumava ser. «o gesto da batata» sobre um
     * gesto que correu na `breu` é a mesma mentira pequena do «fora da bateria»: quem lê procura o
     * rasto no sítio errado. */
    provar('o gesto da turma deixou `' + escolaDaTurma + '` sem turma de prova — o que se cria, apaga-se',
      !(await turmasDe(escolaDaTurma)).some((t) => /Prova do Shard/.test(String(t.nome))), null);
    provar('…e a `breu` (professor) ficou com o registo do desligado, como proveniência',
      /Prova Do Shard/i.test((await chamar('breu', '/bastidores/estudio')).texto), null);
  }

  const total = ok + ko;
  console.log('\n' + (ko === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + ok + '/' + total +
    ' asserção(ões)' + (ko ? ', ' + ko + ' falha(s)' : '') +
    (pendentes ? ' · ' + pendentes + ' gesto(s) pendente(s), com motivo' : '') + '.');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => { console.error('erro na bateria: ' + (erro && erro.stack || erro)); process.exit(2); });
