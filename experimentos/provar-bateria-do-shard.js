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
 * O QUE ELA NÃO FAZ, e é deliberado. Os gestos 4–7 (anamnese, plano de ensino, PO, linha de base)
 * passam por `POST /api/elicitar`, que ELICITA com o modelo — gastam tokens da chave da casa e não
 * são determinísticos. Uma bancada que chama o modelo a cada corrida não serve para comparar duas
 * topologias. Esses quatro gestos ficam ditos como PENDENTES no relatório, com o motivo, em vez de
 * aparecerem como «ok» por omissão.
 *
 *   node experimentos/provar-bateria-do-shard.js
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

  /* ── GESTÃO 1 · cada host serve a sua escola ─────────────────────────────────────────────── */
  console.log('1. abrir `/` de cada escola pelo domínio próprio');
  for (const e of ESCOLAS) {
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
  for (const e of ESCOLAS) {
    for (const caminho of ['/aulas/', '/ciclos/planos/']) {
      const r = await chamar(e.slug, caminho);
      provar('`' + caminho + '` de ' + e.slug + ' responde 200', r.status === 200, r.status);
    }
  }
  {
    /* O PDF vem da árvore montada, e é o mesmo caminho que a página publica. Só o `calango`
     * tem turmas hoje, e por isso só ele tem PDF — a asserção é sobre o caminho, não sobre a
     * existência em todas. */
    const r = await chamar('calango', '/rosa/ciclo-01-calango-rosa.pdf');
    provar('o PDF de um ciclo responde 200', r.status === 200, r.status);
    provar('…e vem como PDF', /^%PDF/.test(r.texto.slice(0, 4)), r.texto.slice(0, 12));
  }

  /* ── GESTÃO 3 · os assets, e a igualdade que autoriza partilhá-los ─────────────────────── */
  console.log('\n3. `/assets/style.css` e `/nav.js` — servidos, e iguais nas três');
  const hashes = {};
  for (const e of ESCOLAS) {
    hashes[e.slug] = {};
    for (const f of ['style.css', 'nav.js']) {
      const r = await chamar(e.slug, '/assets/' + f);
      provar('`/assets/' + f + '` de ' + e.slug + ' responde 200', r.status === 200, r.status);
      hashes[e.slug][f] = impressao(r.texto);
    }
  }
  for (const f of ['style.css', 'nav.js']) {
    const distintos = new Set(ESCOLAS.map((e) => hashes[e.slug][f]));
    provar('`' + f + '` é IGUAL nas três escolas (é o que autoriza a cópia partilhada do passo 2)',
      distintos.size === 1, [...distintos]);
  }

  /* ── GESTÃO 10 · o mapa respondeu, e não uma `var` de deploy ───────────────────────────── */
  console.log('\n10. `/api/saude` de cada host');
  for (const e of ESCOLAS) {
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
  for (const e of ESCOLAS) antes[e.slug] = await digital(e.slug);

  if (SO_LEITURA) {
    console.log('\n(só leitura — os gestos 7, 8 e 9 não foram corridos)');
    pendente('gestos 8 e 9 (turma, professor)', '--so-leitura');
  } else {
    /* ── GESTÃO 8 · a turma: criar, mudar de sala, apagar ──────────────────────────────────── */
    console.log('\n8. turma — criar, editar, apagar (na `batata`, que não tinha nenhuma)');
    const turma = {
      nome: 'Prova do Shard',
      dias: ['ter', 'qui'],
      horarios: { ter: '09:00', qui: '09:00' },
      duracaoMin: 60,
      periodoInicio: '2026-11-20',
      periodoFim: '2026-12-20',
    };
    const criada = await chamar('batata', '/api/bastidores/turma', { metodo: 'POST', corpo: turma });
    provar('criar a turma responde 201', criada.status === 201, [criada.status, criada.corpo && criada.corpo.erro]);
    const idTurma = criada.corpo && criada.corpo.id;

    /* O ID DA TURMA É O SLUG DO NOME, E POR ISSO MUDA AO RENOMEAR (medido a 14/11/2026, nesta
     * bancada). O apagar tem de usar o id que a edição DEVOLVEU — o antigo responde 404, e a
     * primeira versão desta bateria ficou a apontar para ele. Não é defeito do sistema: o
     * `turma-editar` reescreve a chave dos vínculos turma↔termo justamente porque o id mudou, e
     * diz o id novo na resposta (`id`, e o antigo em `eraId`). */
    const editada = await chamar('batata', '/api/bastidores/turma-editar', {
      metodo: 'POST', corpo: Object.assign({ id: idTurma }, turma, { nome: 'Prova do Shard (movida)' }),
    });
    provar('editar a turma responde 200', editada.status === 200, [editada.status, editada.corpo && editada.corpo.erro]);
    const idEditada = (editada.corpo && editada.corpo.id) || idTurma;
    provar('…e a resposta diz o id NOVO, e o antigo em `eraId`',
      editada.corpo && editada.corpo.id === 'prova-do-shard-movida' && editada.corpo.eraId === idTurma,
      editada.corpo && { id: editada.corpo.id, eraId: editada.corpo.eraId });
    const listaBatata = await chamar('batata', '/api/bastidores/turmas');
    provar('…e o nome novo está na lista', /Prova do Shard \(movida\)/.test(JSON.stringify(listaBatata.corpo)), null);
    provar('…e o nome antigo não ficou como segunda turma',
      (listaBatata.corpo.turmas || []).filter((t) => /Prova do Shard/.test(String(t.nome))).length === 1,
      (listaBatata.corpo.turmas || []).map((t) => t.nome));

    const apagada = await chamar('batata', '/api/bastidores/turma', { metodo: 'DELETE', corpo: { id: idEditada } });
    provar('apagar a turma responde 200', apagada.status === 200, [apagada.status, apagada.corpo && apagada.corpo.erro]);
    const depoisBatata = await chamar('batata', '/api/bastidores/turmas');
    provar('…e a escola volta a não ter turmas de prova',
      !(depoisBatata.corpo.turmas || []).some((t) => /Prova do Shard/.test(String(t.nome))), null);

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
    const producaoBreu = await chamar('breu', '/bastidores/producao');
    provar('…mas a lista da escola continua a mostrá-lo, com o selo `desligado`',
      /Prova Do Shard/i.test(producaoBreu.texto) && /desligado/.test(producaoBreu.texto), null);

    /* ── OS GESTOS QUE PRECISAM DO MODELO ─────────────────────────────────────────────────── */
    pendente('4. anamnese — criar, editar, apagar', 'passa por POST /api/elicitar (gasta tokens e não é determinístico)');
    pendente('5. plano de ensino — criar, derivar', 'idem');
    pendente('6. PO — criar, concluir, gerar', 'idem');
    pendente('7. linha de base — enviar, alterar elenco', 'depende da anamnese, que é o gesto 4');
  }

  /* ── O ISOLAMENTO · o gesto numa escola não toca nas outras ─────────────────────────────── */
  console.log('\nISOLAMENTO — a impressão de quem não devia mudar');
  const depois = {};
  for (const e of ESCOLAS) depois[e.slug] = await digital(e.slug);

  /* DUAS AFIRMAÇÕES DIFERENTES, e a distinção é o ponto.
   *
   *   · as escolas ONDE NADA FOI FEITO têm de fechar com a impressão digital idêntica — é a
   *     asserção de isolamento, e é a que o shard pode quebrar (um Worker a servir N escolas é
   *     exactamente onde uma escola pode começar a escrever na outra);
   *   · a escola ONDE O GESTO CORREU não fecha igual, e não é falha: o professor desligado FICA,
   *     por decisão (proveniência). Exigir-lhe o mesmo hash seria exigir que a bancada apagasse o
   *     que o sistema, coerentemente, guarda. */
  const INTOCADAS = SO_LEITURA ? ESCOLAS.map((e) => e.slug) : ['calango'];
  for (const slug of INTOCADAS) {
    const mudou = Object.keys(antes[slug]).filter((k) => antes[slug][k] !== depois[slug][k]);
    provar('`' + slug + '`, onde NENHUM gesto correu, fecha com a MESMA impressão digital',
      mudou.length === 0, { mudou, antes: antes[slug], depois: depois[slug] });
  }
  if (!SO_LEITURA) {
    const turmasDe = async (slug) => (await chamar(slug, '/api/bastidores/turmas')).corpo.turmas || [];
    provar('o gesto da `batata` (turma) deixou a `batata` sem turma de prova — o que se cria, apaga-se',
      !(await turmasDe('batata')).some((t) => /Prova do Shard/.test(String(t.nome))), null);
    provar('…e a `breu` (professor) ficou com o registo do desligado, como proveniência',
      /Prova Do Shard/i.test((await chamar('breu', '/bastidores/producao')).texto), null);
  }

  const total = ok + ko;
  console.log('\n' + (ko === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + ok + '/' + total +
    ' asserção(ões)' + (ko ? ', ' + ko + ' falha(s)' : '') +
    (pendentes ? ' · ' + pendentes + ' gesto(s) pendente(s), com motivo' : '') + '.');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => { console.error('erro na bateria: ' + (erro && erro.stack || erro)); process.exit(2); });
