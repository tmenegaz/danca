#!/usr/bin/env node
'use strict';

/*
 * provar-salas-e-elencos.js — o que a SALA mostra, e o que o ELENCO precisa para existir.
 *
 * Duas coisas medidas aqui, e as duas nasceram da mesma leitura do modelo: SALA, ELENCO e TURMA
 * são entidades INDEPENDENTES.
 *
 * A. A COLUNA «CONTEÚDOS» SAIU DO CARTÃO DA SALA (07/11/2026).
 *
 *    O cartão da sala mostrava três números: Ritmo, Régua e Conteúdos. O terceiro já não é da
 *    sala — o conteúdo da aula passou a ser da TURMA (antiga curadoria), no `repertorio` dela, a
 *    03/11/2026. Uma caixa «Conteúdos: N» numa entidade que não tem conteúdos é uma afirmação
 *    falsa sobre o que a sala é, e o painel por trás dela desenhava chips de um mapa que já não
 *    lhe pertence.
 *
 *    O QUE FICOU: o RITMO em que a aula ocorre e a RÉGUA com que se mede — e o cartão passou a ter
 *    a forma de DOIS (`trio trio-duo`), porque a `.trio` é de três e deixá-la em três daria um
 *    terço VAZIO à direita, que se lê como dado em falta.
 *
 *    A 18/11/2026 O TERCEIRO NÚMERO VOLTOU, E É OUTRO — ver a secção A1. O terço deixou de estar
 *    vazio: a sala ganhou o PROFESSOR e a MODALIDADE que aí se ensina. A `.trio` volta a ser a
 *    forma certa, e o `trio-duo` sai sem deixar rasto.
 *
 * B. O ELENCO PODE SER CRIADO SEM ANAMNESE (07/11/2026) — e nunca precisou de SALA.
 *
 *    O DEFEITO QUE ELA VIU: numa escola recém-criada, o campo «Nome do elenco» nascia MORTO e
 *    nenhum passo abria. A causa estava em duas linhas de cliente: `travarTudo()` desligava
 *    `lb-nome`/`lb-professor`, e `faltasDoPassoLb()` devolvia «a anamnese de pelo menos uma
 *    aluna» para TODOS os passos — inclusive o primeiro, onde não se lê retrato nenhum.
 *
 *    Não havia trava por SALA em lugar nenhum: o passo 5 («Turma de destino») foi o portador
 *    dessa dependência, e saiu a 07/11/2026 com a atribuição movida para a Turma. O que ficou
 *    era a da anamnese, e é ela que esta prova mede — nos dois lados:
 *
 *      1. o SERVIDOR aceita o elenco nomeado, sem campos e sem anamnese (`rascunho: true`), e
 *         devolve-o na lista: é a criação do elenco como ato independente;
 *      2. o CLIENTE servido deixou de desligar o nome, e o passo 1 deixou de exigir retrato.
 *
 *    O QUE CONTINUA FECHADO, e é factual: os passos 2 a 4. O corpo que se recorta É o das alunas,
 *    e sem anamnese não há aluna para escolher — a trava move-se para onde a falta existe, e diz
 *    por quê.
 *
 * C. O QUE UMA SALA DESOBSTRUI — medido, não suposto.
 *
 *    A cadeia é: a SALA precisa de RITMO para poder ser atribuída; a TURMA exige a SALA; o PLANO
 *    de ensino é da TURMA. Esta secção mede os dois primeiros elos pelo servidor, e declara o
 *    terceiro como o que ele é.
 *
 *    E O QUE NÃO EXISTE: a «Tabela de atividades». `PLANO-TABELA-DE-ATIVIDADES.md` diz, na
 *    primeira linha do estado, «Nada foi implementado» — e a árvore confirma: não há
 *    `tabela-de-atividades`, nem `espacos`, nem `eventos` em `motor/`. Não há plano a «ativar»
 *    por criação de sala nenhuma; o que existe é o documento que o desenha.
 *
 *   node experimentos/provar-salas-e-elencos.js
 */

const fs = require('fs');
const path = require('path');
const bastidores = require('../motor/servidor/bastidores.js');

const RAIZ = path.join(__dirname, '..');
const BASE = 'https://escola-de-prova.tmenegaz77.workers.dev';
const SENHA = 'senha-da-direcao';

let n = 0;
let falhas = 0;
function conferir(rotulo, ok, detalhe) {
  n += 1;
  if (ok) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* SEM FERRAMENTA, A MEDIDA É DECLARADA — NUNCA APROVADA (a lição das provas com navegador:
 * uma prova que passa por ausência de ferramenta é a pior das provas). */
const naoMedidas = [];
function naoMedida(rotulo, motivo) {
  naoMedidas.push(rotulo);
  console.log('  —     ' + rotulo + ': NÃO MEDIDA (' + motivo + ')');
}

function criarKv() {
  const dados = new Map();
  return {
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) { dados.set(c, String(v)); },
    async delete(c) { dados.delete(c); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

function ambiente() {
  return {
    ESCOLA_SLUG: 'escola-de-prova',
    ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: SENHA,
    SENHA_PROFESSOR: 'senha-do-professor',
    PROFESSOR_NOME: 'Leticia',
    PADD_KV: criarKv(),
  };
}

async function pedir(env, caminho, init) {
  const r = await bastidores.fetch(new Request(BASE + caminho, init), env);
  if (!r) throw new Error('os Bastidores não trataram ' + caminho);
  let corpo = null;
  try { corpo = await r.json(); } catch { corpo = null; }
  return { status: r.status, corpo, texto: r.headers.get('content-type') || '' };
}

const postar = (env, caminho, corpo) => pedir(env, caminho, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(Object.assign({ senhaDirecao: SENHA }, corpo)),
});

/** O RITMO mínimo que faz uma sala atribuível — é o que `faltaNoRitmoDaTurma` exige. */
const RITMO = {
  dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' },
  duracaoMin: 60, periodoInicio: '2026-11-10', periodoFim: '2026-12-20',
};

(async () => {
  const env = ambiente();

  // -------------------------------------------------------------------------------------------
  console.log('\nA. O cartão da SALA: dois números, e nenhum painel de conteúdos');

  /* UMA SALA COM RITMO E RÉGUA — o suficiente para o cartão desenhar as caixas. A régua é da
   * escola, e é a padrão quando não se cria nenhuma: o cartão nunca sai sem uma. */
  const criada = await postar(env, '/api/bastidores/turma',
    Object.assign({ nome: 'Sala de Prova' }, RITMO));
  conferir('a sala é criada (é o ato que desobstrui a atribuição)', criada.status === 201 || criada.status === 200,
    { status: criada.status, corpo: criada.corpo && criada.corpo.erro });

  const pagina = await bastidores.fetch(new Request(BASE + '/bastidores/producao'), env);
  const html = await pagina.text();
  conferir('a página da Produção abre', pagina.status === 200, pagina.status);

  const trecho = (() => {
    const i = html.indexOf('Sala de Prova');
    return i === -1 ? '' : html.slice(i, i + 4000);
  })();
  conferir('o cartão da sala está na página', trecho.length > 0);

  conferir('o cartão usa a forma de TRÊS (`trio`), e já não a de dois',
    /class="trio"/.test(trecho) && !/class="trio trio-duo"/.test(trecho), trecho.slice(0, 200));
  conferir('…e continua a dizer o RITMO', /data-balao="ritmo"/.test(trecho), null);
  conferir('…e a RÉGUA', /data-balao="regua"/.test(trecho), null);
  conferir('…e NÃO diz «Conteúdos»', !/data-balao="conteudos"/.test(trecho),
    (trecho.match(/data-balao="[a-z]+"/g) || []));
  conferir('…nem emite o painel de conteúdos', !/data-painel="conteudos"/.test(trecho), null);
  conferir('…e o painel dos conteúdos não existe em lugar nenhum da página',
    html.indexOf('data-painel="conteudos"') === -1, null);

  // -------------------------------------------------------------------------------------------
  console.log('\nA1. A SALA DIZ A MODALIDADE E O PROFESSOR (18/11/2026)');

  /* O QUE ELA PEDIU, por palavras próprias: «a sala ela atende a uma modalidade nesses dias, com
   * essa duração, no período inicial até o período final»; e «a gente vai acrescentar mais um
   * [nicho] aqui, que é o professor […] quando abrir o nicho do professor, vai dizer ali qual é a
   * modalidade que ele atende».
   *
   * A SALA ACIMA NÃO TEM NENHUM DOS DOIS — foi criada só com o ritmo, como as salas de antes desta
   * regra. É de propósito: ela é o caso em que o painel tem de DIZER O QUE FALTA em vez de
   * desaparecer. E é a primeira coisa que se mede aqui. */
  conferir('a sala sem professor nem modalidade continua a valer (o passado não é reescrito)',
    trecho.indexOf('Sala de Prova') !== -1, null);
  conferir('…e o cartão dela diz que ainda não se sabe quem a dá',
    /ainda não diz quem a dá nem a modalidade/.test(trecho), null);
  conferir('…e o terceiro nicho existe de qualquer maneira', /data-balao="professor"/.test(trecho), null);
  conferir('…com o painel dele', /data-painel="professor"/.test(trecho), null);

  /* AGORA UMA SALA COM OS DOIS, e o cartão tem de os dizer pelo NOME — um slug na tela é
   * `leticia`, e o que uma pessoa lê é «Leticia». */
  const comDono = await postar(env, '/api/bastidores/turma',
    Object.assign({ nome: 'Sala de Jazz', professor: 'leticia', modalidade: 'Jazz' }, RITMO));
  /* A ROTA DEVOLVE O NOME DA SALA, e não o registo — é o contrato dela desde 16/10/2026
   * (`{ ok, turma: nova.nome, nome, id, modo }`). Quem prova que os dois campos ficaram gravados é
   * a LEITURA seguinte: a página é desenhada a partir do que está no armazenamento, e o cartão só
   * pode dizer «Leticia» e «Jazz» se os dois lá estiverem. É por isso que a asserção seguinte
   * existe, e é ela a prova — esta confirma que a gravação não foi recusada. */
  conferir('a sala com professor e modalidade é aceite (201/200), e o id volta',
    (comDono.status === 201 || comDono.status === 200) && Boolean(comDono.corpo.id),
    { status: comDono.status, corpo: comDono.corpo });

  const pagina2 = await bastidores.fetch(new Request(BASE + '/bastidores/producao'), env);
  const html2 = await pagina2.text();
  const trecho2 = (() => {
    const i = html2.indexOf('Sala de Jazz');
    return i === -1 ? '' : html2.slice(i, i + 4000);
  })();
  conferir('o nicho do professor mostra o NOME, e não o slug',
    /data-balao="professor"[\s\S]{0,400}?Leticia/.test(trecho2), trecho2.slice(0, 300));
  conferir('…e o painel dele diz a modalidade que ali se ensina',
    /data-painel="professor"[\s\S]{0,900}?Jazz/.test(trecho2), null);

  /* O FORMULÁRIO — o passo 1 passou a pedir os dois. */
  conferir('o passo 1 tem o select do professor da sala', /id="tprofessor"/.test(html2), null);
  conferir('…e o da modalidade da sala', /id="tmodalidade"/.test(html2), null);
  /* A MODALIDADE DA SALA GUARDA O NOME, E NÃO O ID — a convenção da Turma, e a razão está escrita
   * no núcleo: «o perfil do professor guarda ids (`bale-classico`) e a Turma guarda o nome que o
   * formulário oferece (`Balé clássico`)». Guardar um id aqui faria o `enquadramento.js` — que já
   * lê `turma.modalidade` — comparar um id com um nome, e o «sem quem a ensine» acenderia em salas
   * que o professor dá todos os dias.
   *
   * A OUTRA CONVENÇÃO NÃO É UM DEFEITO, e a prova não a pode confundir: o select da HABILIDADE do
   * professor (`pmodalidade`) leva o ID, porque é para o perfil que ele escreve. As duas coexistem,
   * e o `idDaModalidade` do núcleo é a ponte. Por isso o recorte é o `tmodalidade`, e não a página. */
  const soDaSala = (() => {
    const i = html2.indexOf('id="tmodalidade"');
    if (i === -1) return '';
    const j = html2.indexOf('</select>', i);
    return j === -1 ? html2.slice(i) : html2.slice(i, j);
  })();
  conferir('…e a opção da modalidade da SALA leva o NOME no `value`, como na Turma',
    /<option value="Jazz"/.test(soDaSala) && !/<option value="jazz"/.test(soDaSala),
    (soDaSala.match(/<option value="[^"]*"/g) || []));

  // -------------------------------------------------------------------------------------------
  console.log('\nB. O ELENCO sem anamnese — o nome grava, e o servidor aceita-o');

  /* O CORAÇÃO DA PROVA: é este pedido que o formulário faz quando o passo 1 é gravado antes de
   * existir retrato nenhum. Sem campos (`rascunho: true`) e sem turma nenhuma. */
  const rascunho = await postar(env, '/api/bastidores/linha-de-base', {
    nome: 'Nível 1 — mobilidade e pés', professor: 'leticia', alunas: [], campos: [], rascunho: true,
  });
  conferir('o elenco é criado sem campos, sem turma e sem anamnese',
    rascunho.status === 201 && rascunho.corpo && rascunho.corpo.ok === true,
    { status: rascunho.status, corpo: rascunho.corpo && (rascunho.corpo.erro || rascunho.corpo.erros) });
  conferir('…e nasce com o nome que o professor escreveu',
    Boolean(rascunho.corpo && rascunho.corpo.linha && rascunho.corpo.linha.nome === 'Nível 1 — mobilidade e pés'),
    rascunho.corpo && rascunho.corpo.linha && rascunho.corpo.linha.nome);

  const lista = await pedir(env, '/api/bastidores/linhas-de-base');
  const achado = (lista.corpo && lista.corpo.linhas || []).filter((l) => l && l.nome === 'Nível 1 — mobilidade e pés');
  conferir('…e aparece na lista dos elencos da escola', achado.length === 1, lista.corpo && Object.keys(lista.corpo));
  conferir('…sem estar em turma nenhuma (é independente)',
    achado.length === 1 && !achado[0].turma, achado[0] && achado[0].turma);

  // O CLIENTE SERVIDO — o que a tela faz, e o que ela deixou de fazer.
  const script = html;
  conferir('o formulário do elenco tem o campo «Nome do elenco»', /id="lb-nome"/.test(script), null);
  conferir('…e o cliente NÃO o desliga quando falta anamnese',
    !/\["lb-nome", "lb-professor"\]\.forEach/.test(script),
    (script.match(/lb-nome[^;]{0,80}/g) || []).slice(0, 3));
  /* O QUE CADA PASSO EXIGE, lido do corpo servido da função — e não do texto todo: a pergunta é
   * «o passo 1 pede retrato?», e a resposta tem de sair do ramo DELE. */
  const corpoDasFaltas = (() => {
    const i = script.indexOf('function faltasDoPassoLb(');
    if (i === -1) return '';
    const j = script.indexOf('if (n === 4)', i);
    return j === -1 ? script.slice(i, i + 900) : script.slice(i, j);
  })();
  const ramoDe = (passo) => {
    const i = corpoDasFaltas.indexOf('if (n === ' + passo + ')');
    if (i === -1) return '';
    const j = corpoDasFaltas.indexOf('} else if', i);
    return j === -1 ? corpoDasFaltas.slice(i) : corpoDasFaltas.slice(i, j);
  };
  conferir('…e o passo 1 NÃO exige a anamnese',
    Boolean(ramoDe(1)) && !/haAnamnese/.test(ramoDe(1)), ramoDe(1).trim().slice(0, 200));
  conferir('…e é o passo 2 que a exige (é lá que se escolhem os corpos)',
    /haAnamnese/.test(ramoDe(2)), ramoDe(2).trim().slice(0, 200));
  conferir('…e o aviso sem anamnese diz que o elenco PODE ser nomeado',
    /Pode nomear o elenco|Pode nomear o elenco e/.test(script)
      || /nomear o elenco/.test(script), null);

  /* -------------------------------------------------------------------------------------------
   * O PASSO 2 SEM RETRATO: A TIRA OBEDECE AO «SEGUIR», E O ESPAÇO FICA VAZIO (15/11/2026).
   *
   * AQUI ESTEVE A PROVA DA DECISÃO ANTERIOR (07/11/2026): havia um estado vazio próprio, que
   * nomeava a falta e levava à lista da anamnese, e o passo 2 abria mesmo sem retrato — «aberto
   * para ler» — porque era ele que carregava essa explicação.
   *
   * A DECISÃO MUDOU, e é dela, ao vivo:
   *
   *   «o botão de seguir na escolha do elenco está bloqueado, mas eu consigo navegar pelos steps.
   *    Eu consigo ir para o step dois, mesmo sem ter definido um nome para o elenco, e não pode
   *    ser assim […] Não dá para avançar para alunas a escolher pelo step, né, em cima, tem que
   *    seguir a regra do botão de seguir.»
   *
   *   «se não tiver aluno nesse step dois, fica completamente vazio se não tiver anamnese, mesmo
   *    que exista aluno ou se não tiver aluno. Esse espaço dedicado a alunos deste recorte fica
   *    completamente vazio, não tem nada ali.»
   *
   * E o que ela leu no ecrã — «o espaço para alunos deste recorte escrito undefined» — tinha
   * causa de programador, não de texto: a caixa era montada numa variável e nunca devolvida, e
   * `innerHTML = undefined` escreve a palavra. Um `grep` via a função, o `innerHTML` e o texto
   * certo; por isso, além do fonte, esta prova CORRE a página (secção B2). */
  const corpoDoVer = (() => {
    const i = script.indexOf('function podeVerPasso(');
    if (i === -1) return '';
    const j = script.indexOf('\n', script.indexOf('}', i));
    return script.slice(i, j === -1 ? i + 200 : j);
  })();
  conferir('a tira não tem excepção: `podeVerPasso` é a regra do «Seguir»',
    /return podeIrParaLb\(passo\)/.test(corpoDoVer) && !/passo === 2/.test(corpoDoVer),
    corpoDoVer.slice(0, 220));
  conferir('…e quem fecha é ela (`!podeVerPasso(n)`) — não há segundo juízo',
    /var fechado = \(n > LB_PASSO\) && !podeVerPasso\(n\)/.test(script), null);
  conferir('…e não sobrou o estado «aberto para ler, fechado para avançar»',
    !/soLeitura/.test(script), null);
  conferir('…nem um caminho que abra um passo só para explicar',
    !/podeVerPasso\(alvo\)/.test(script), null);
  conferir('o espaço das alunas fica VAZIO quando não há retrato (não é uma caixa)',
    /if \(!ALUNAS_COM_ANAMNESE\.length\) \{[\s\S]{0,120}alvo\.innerHTML = ""/.test(script), null);
  conferir('…e a caixa que escrevia «undefined» deixou de existir (função sem `return`)',
    !/estadoVazioDeAlunas/.test(script.replace(/\/\*[\s\S]*?\*\//g, '')), null);
  conferir('a explicação continua à vista, no alto da aba, e distingue as duas faltas',
    /id="lb-sem-anamnese"/.test(script)
      && /Ainda n\u00e3o h\u00e1 nenhuma aluna cadastrada/.test(script)
      && /Ainda n\u00e3o h\u00e1 nenhuma anamnese registada/.test(script),
    null);
  conferir('a volta da anamnese relê a lista sozinha (foco da janela)',
    /visibilitychange/.test(script) && /function haRetratoNovo/.test(script)
      && /addEventListener\("focus", haRetratoNovo\)/.test(script), null);
  conferir('…sem gastar pedido quando já há retrato',
    /if \(ALUNAS_COM_ANAMNESE\.length\) return;/.test(script), null);
  conferir('a razão de não avançar está À VISTA, e não só no `title`',
    /id="lb-seguir-nota"/.test(script) && /notaSeguir\.textContent/.test(script), null);
  conferir('…e uma falta não é contada duas vezes na mesma frase',
    /function faltasAntesDeLb/.test(script) && /todas\.indexOf\(f\) === -1/.test(script), null);


  // -------------------------------------------------------------------------------------------
  /* -------------------------------------------------------------------------------------------
   * D. A NOMENCLATURA DOS RÓTULOS — «Audição» e «Estilo» (07/11/2026).
   *
   * O PEDIDO. «Elenco: no menu e títulos principais, passa a se chamar Audiação» (a seleção e a
   * configuração do elenco); «Verbetes da Notação: no menu e títulos internos, passa a se chamar
   * Estilo»; e, na Turma, «o antigo conteúdo da aula passa a Conteúdo do Estilo».
   *
   * O QUE ESTA PROVA PROTEGE, e é a parte que envelhece mal se ninguém a medir: a ENTIDADE
   * continua a chamar-se ELENCO. O campo do formulário é «Nome do elenco», o da Turma é «Elenco»,
   * e a lista dentro da Audição passou a «Audições». Se uma próxima passagem de nomenclatura
   * levar o rótulo até aos dados, a frase dela — «cada sala recebe um elenco, formando assim uma
   * turma em funcionamento» — deixa de fazer sentido, e é isso que se mede aqui. */
  console.log('\nD. A nomenclatura: Audição e Estilo no menu e nos títulos, elenco nos campos');
  const menu = (() => {
    const i = html.indexOf('data-grupo="pedagogia"');
    return i === -1 ? '' : html.slice(i, i + 900);
  })();
  conferir('o menu de Pedagogia existe', menu.length > 0, null);
  conferir('…e diz «Audição» (e não «Elenco»)', />Audição</.test(menu), (menu.match(/>[A-ZÁÉÍÓÚÂÊÔÃÕ][^<]*</g) || []));
  conferir('…e diz «Estilo» (e não «Verbetes da notação»)', />Estilo</.test(menu), null);
  conferir('…e as outras duas ficam como estavam (Salas e Turmas)',
    />Salas</.test(menu) && />Turmas</.test(menu), null);
  conferir('o menu NÃO diz «Verbetes da notação» em lugar nenhum',
    !/Verbetes da nota/i.test(html), null);
  const tituloDa = (id) => {
    const i = html.indexOf('id="' + id + '"');
    if (i === -1) return '';
    const j = html.indexOf('</h2>', i);
    return j === -1 ? html.slice(i, i + 400) : html.slice(i, j);
  };
  conferir('o título da secção do corpo é «Audição»', />Audição</.test(tituloDa('sec-corpo')),
    tituloDa('sec-corpo').replace(/<[^>]*>/g, ' ').trim().slice(0, 120));
  conferir('o título da secção dos verbetes é «Estilo»', />Estilo</.test(tituloDa('sec-verbetes')),
    tituloDa('sec-verbetes').replace(/<[^>]*>/g, ' ').trim().slice(0, 120));
  // A ENTIDADE NÃO SE RENOMEOU — e é o que não pode escorregar.
  conferir('o campo do formulário continua «Nome do elenco»',
    /for="lb-nome">Nome do elenco</.test(html), null);
  conferir('…e o campo da Turma continua «Elenco»', /for="cuelenco">Elenco</.test(html), null);
  conferir('…e o professor responsável continua com o seu rótulo',
    /for="lb-professor">Professor responsável</.test(html), null);
  /* «O NOME DA LISTAGEM DEVE SER ELENCOS E NÃO AUDIÇÕES» (07/11/2026) — a correção dela, na
   * mesma sessão em que o rótulo da secção virou Audição. A AUDIÇÃO É O ATO; a lista é dos ELENCOS
   * que saíram dele. A distinção do §2 vale também aqui, e é por isso que ela voltou atrás na
   * primeira passagem: uma lista de «Audições» promete o ato, e o que está lá dentro são os
   * elencos já constituídos. */
  conferir('a listagem chama-se «Elencos» (e não «Audições»)',
    /<h3>Elencos<\/h3>/.test(html) && !/<h3>Audições<\/h3>/.test(html), null);
  conferir('…e o estado vazio dela diz «nenhum elenco ainda»',
    /nenhum elenco ainda/.test(html), null);
  /* A LISTA DO ESTILO FICA COM «Exercícios com verbete»: «verbete» é a ficha da notação, não o
   * nome da secção — a decisão de 07/11/2026 foi explícita nisso. */
  conferir('a lista do Estilo continuou «Exercícios com verbete»',
    /<h3>Exercícios com verbete<\/h3>/.test(html), null);
  conferir('a Turma passou a dizer «Conteúdo do Estilo»',
    /class="campo-rotulo">Conteúdo do Estilo</.test(html), null);
  conferir('…e não diz mais «Conteúdo da aula»', !/Conteúdo da aula/.test(html), null);
  conferir('os `id` das secções NÃO mudaram (são âncoras de link e de prova)',
    /id="sec-corpo"/.test(html) && /id="sec-verbetes"/.test(html) && /id="sec-curadorias"/.test(html), null);

  /* -------------------------------------------------------------------------------------------
   * E. O PASSO 4 — OS BASILARES SÃO UM BLOCO, E O CARTÃO TEM TRÊS COLUNAS (07/11/2026).
   *
   * O QUE ELA VIU, no passo 4: «en dehors (rotação externa) (1)», «o tendu (1)», «o passé (1)»,
   * «a meia ponta (1)», «a musicalidade (1)» — cinco blocos para cinco caixas, cada um com o
   * título repetido no rótulo da única caixa que tinha dentro. A anamnese não os apresenta assim:
   * lá os seis elementos da observação inicial são UMA secção, e o único que se desmembra («as
   * cinco posições») é que ganha um bloco com os seus subitens.
   *
   * A regra passou a ser a do documento, e vive no NÚCLEO (`camposDaObservacaoInicial`) — não é
   * cosmética de tela: o `grupo` viaja para a leitura, para o recorte gravado e para o documento
   * derivado, que imprime «os mesmos grupos que a folha do passo 4 mostra». */
  console.log('\nE. O passo 4 — os basilares num bloco, e o cartão do elenco com duas caixas');
  const lbNucleo = require('../motor/nucleo/linha-de-base.js');
  const ANAMNESE = require('../porta/conteudo/anamnese.json');
  const universo = lbNucleo.camposDisponiveis(ANAMNESE);
  const grupos = [...new Set(universo.map((c) => c.grupo))];
  conferir('a anamnese continua a medir 45 aspectos (o agrupamento não perde nenhum)',
    universo.length === 45, universo.length);
  conferir('«Os elementos basilares» é UM grupo, e não cinco',
    grupos.filter((g) => g === 'Os elementos basilares').length === 1, grupos);
  const basilares = universo.filter((c) => c.grupo === 'Os elementos basilares');
  const idsBasilares = basilares.map((c) => c.id).sort();
  conferir('…e é nele que estão en dehors, tendu, passé, meia ponta e musicalidade',
    ['en-dehors', 'meia-ponta', 'musicalidade', 'passe', 'tendu'].every((id) => idsBasilares.includes(id))
      && idsBasilares.length === 5, idsBasilares);
  /* «AS CINCO POSIÇÕES» NÃO ENTRA NO BLOCO DOS BASILARES: ela é a que se desmembra, e o bloco dela
   * é o dele — com os dez subitens dentro, como sempre esteve. */
  const cinco = universo.filter((c) => /cinco posições/i.test(c.grupo || ''));
  conferir('«as cinco posições» mantém o seu bloco, com os dez subitens',
    cinco.length === 10, cinco.length);
  conferir('o rótulo é o mesmo que a porta já usa para eles («Os elementos basilares»)',
    /Os elementos basilares/.test(
      fs.readFileSync(path.join(RAIZ, 'porta', 'index.html'), 'utf8')), null);
  // E a ORDEM é a do documento: a observação inicial abre a lista.
  conferir('…e são os primeiros da lista, como no documento',
    grupos[0] === 'as cinco posições: uma visão geral' && grupos[1] === 'Os elementos basilares',
    grupos.slice(0, 3));

  /* O CARTÃO DO ELENCO vive no CLIENTE (`pintarLinhas`) — não está no HTML servido, e por isso
   * não se mede aqui: a prova que o desenha de verdade é a `provar-linha-de-base.js`, em jsdom,
   * que lê as três caixas e as abre. Aqui mede-se o que é do NÚCLEO e da marcação estática. */
  /* DUAS CAIXAS NO CARTÃO, E SÓ DUAS (07/11/2026). A «Turmas» saiu primeiro, e o que ela dizia
   * foi para uma caixa «Elenco»; esta sessão removeu também essa — o NOME do elenco já está no
   * topo do cartão, e uma caixa a repeti-lo é a mesma palavra duas vezes na mesma linha de
   * leitura. As caixas ficam com o que só elas podem abrir: as alunas e o recorte. */
  conferir('o cartão do elenco é desenhado pelo cliente com as DUAS caixas',
    /caixa\("Alunas", String\(m\)/.test(html) && /caixa\("Recorte", String\(n\)/.test(html), null);
  conferir('…e a caixa «Elenco» NÃO é desenhada (o nome já está no topo)',
    !/caixa\("Elenco"/.test(html), null);
  conferir('…nem a caixa «Turmas»',
    !/caixa\("Turmas"/.test(html), null);
  conferir('…e a grelha dessas duas é a de DOIS, e não a de três',
    /"<div class=\\"trio trio-duo\\">" \+/.test(html), null);
  /* O FACTO QUE A CAIXA DIZIA NÃO SE PERDEU: «em N turmas» desce para a linha dos factos, que é
   * «o que se lê sem abrir». */
  conferir('…e «em N turmas» passa a ser um facto da linha que se lê sem abrir',
    /var onde = usadaPor\.length/.test(html) && /em " \+ usadaPor\.length \+ " turmas/.test(html), null);

  /* O PASSO 4 A CORRER, em jsdom, com os 45 campos de verdade. Uma prova que lesse o núcleo e
   * ficasse por aí diria que o agrupamento está certo e não que a TELA o desenha — e o defeito
   * que ela viu era de tela. O que se mede: dez blocos (e não catorze), e o dos basilares com as
   * cinco caixas dentro, com o título dito UMA vez. */
  {
    let JSDOM, VirtualConsole;
    try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { throw new Error('jsdom ausente: ' + e.message); }
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {});
    vc.on('error', () => {});
    const dom = new JSDOM(html.replace(/<script src="[^"]*"><\/script>/g, ''), {
      runScripts: 'dangerously', url: BASE + '/bastidores/producao',
      pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.confirm = () => true;
        w.alert = () => {};
        w.fetch = (u) => {
          const url = String(u);
          const corpo = url.indexOf('campos-do-corpo') !== -1
            ? { ok: true, campos: universo, grupos: grupos }
            : { ok: true, alunas: [], linhas: [], divergentes: [] };
          return Promise.resolve({ ok: true, status: 200,
            json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    await new Promise((r) => win.setTimeout(r, 300));
    const blocos = [...win.document.querySelectorAll('#lb-campos details')];
    conferir('o passo 4 desenha UM bloco por grupo — dez, e não catorze',
      blocos.length === 10, blocos.length);
    const doBasilares = blocos.find((b) => /Os elementos basilares/.test(b.textContent || ''));
    conferir('há um bloco «Os elementos basilares»', Boolean(doBasilares), null);
    conferir('…e dentro dele estão as cinco caixas, e não uma',
      Boolean(doBasilares) && doBasilares.querySelectorAll('input[name="lb-campo"]').length === 5,
      doBasilares && doBasilares.querySelectorAll('input[name="lb-campo"]').length);
    conferir('…e o título aparece UMA vez, no cabeçalho do bloco, e não repetido em cada caixa',
      Boolean(doBasilares) && (String(doBasilares.textContent).match(/Os elementos basilares/g) || []).length === 1,
      doBasilares && String(doBasilares.textContent).replace(/\s+/g, ' ').trim().slice(0, 200));
    win.close();
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nB2. O passo 2, A CORRER — o espaço vazio e a trava da tira (jsdom)');

  /* A PÁGINA CORRE, e não só se lê. Foi o `grep` que deixou passar o «undefined»: no fonte estava
   * tudo — a função existia, o `innerHTML` existia, os textos existiam —, e o que faltava era o
   * `return`, que nenhuma expressão regular vê. O jsdom executa o script servido e mede o que o
   * professor leria. */
  let JSDOM = null;
  let VirtualConsole = null;
  try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) { JSDOM = null; }
  if (!JSDOM) {
    naoMedida('o passo 2 a correr (espaço vazio e trava da tira)', 'jsdom ausente');
  } else {
    const vc = new VirtualConsole();
    vc.on('jsdomError', () => {});
    vc.on('error', () => {});
    const dom = new JSDOM(html.replace(/<script src="[^"]*"><\/script>/g, ''), {
      runScripts: 'dangerously', url: BASE + '/bastidores/producao', pretendToBeVisual: true,
      virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {} });
        w.alert = () => {};
        w.confirm = () => true;
        w.fetch = (u) => {
          const url = String(u);
          /* DUAS ALUNAS CADASTRADAS, NENHUMA COM ANAMNESE — a escola dela, e o caso em que o
           * «undefined» aparecia. `registradas` vem do servidor, e é ele que distingue as duas
           * faltas no aviso do alto da aba. */
          const corpo = url.indexOf('alunas-com-anamnese') !== -1
            ? { ok: true, escola: 'escola-de-prova', alunas: [], registradas: 2 }
            : url.indexOf('linhas-de-base') !== -1 ? { ok: true, linhas: [], elencos: [] }
              : { ok: true };
          return Promise.resolve({ ok: true, status: 200,
            json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
        };
      },
    });
    const win = dom.window;
    const doc = win.document;
    await new Promise((r) => win.setTimeout(r, 400));
    const caixa = doc.getElementById('lb-alunas');
    const nota = doc.getElementById('lb-alunas-nota');
    const passo2 = doc.querySelector('#lb-tira button[data-passo="2"]');
    const painel2 = doc.querySelector('#corpo-miolo .passo-painel[data-passo="2"]');
    const seguir = doc.getElementById('lb-seguir');
    const soltas = [...doc.querySelectorAll('*')]
      .filter((e) => e.children.length === 0 && e.textContent.trim() === 'undefined');
    conferir('sem anamnese, a caixa das alunas fica VAZIA — e escondida, que é o que «nada ali» diz',
      Boolean(caixa) && caixa.hidden === true && caixa.textContent.trim() === ''
        && caixa.innerHTML === '',
      { hidden: caixa && caixa.hidden, html: caixa && caixa.innerHTML });
    conferir('…e a nota dela também — nada de travessão a fingir de dado',
      Boolean(nota) && nota.textContent.trim() === '', nota && nota.textContent);
    conferir('…e a palavra «undefined» não aparece em lado nenhum do ecrã',
      soltas.length === 0, soltas.map((e) => e.id || e.className));
    conferir('sem nome, o passo 2 da tira está FECHADO — a mesma regra do «Seguir»',
      Boolean(passo2) && passo2.disabled === true && Boolean(seguir) && seguir.disabled === true,
      { passo2: passo2 && passo2.disabled, seguir: seguir && seguir.disabled });
    if (passo2) passo2.click();
    if (typeof win.irParaPassoLb === 'function') win.irParaPassoLb(2);
    await new Promise((r) => win.setTimeout(r, 60));
    conferir('…e nenhum caminho o abre: o painel 2 continua escondido',
      Boolean(painel2) && painel2.hidden === true, painel2 && painel2.hidden);
    doc.getElementById('lb-nome').value = 'Elenco de prova';
    doc.getElementById('lb-nome').dispatchEvent(new win.Event('input', { bubbles: true }));
    const sel = doc.getElementById('lb-professor');
    const opcao = [...sel.options].find((o) => o.value);
    if (opcao) sel.value = opcao.value;
    sel.dispatchEvent(new win.Event('change', { bubbles: true }));
    await new Promise((r) => win.setTimeout(r, 60));
    conferir('com nome e professor, a tira acende E o «Seguir» também (uma regra só)',
      Boolean(passo2) && passo2.disabled === false && Boolean(seguir) && seguir.disabled === false,
      { passo2: passo2 && passo2.disabled, seguir: seguir && seguir.disabled });
    win.close();
  }

  console.log('\nC. O que uma SALA desobstrui — e o que não existe para desobstruir');

  /* A SALA SEM RITMO NÃO SE ATRIBUI: é o elo que a criação da sala desobstrui. */
  await postar(env, '/api/bastidores/turma', { nome: 'Sala sem ritmo' });
  const semRitmo = await postar(env, '/api/bastidores/curadoria', {
    professor: 'leticia', modalidade: 'Balé clássico', tradicao: 'RAD', turma: 'Sala sem ritmo',
  });
  conferir('a TURMA não se atribui a uma sala sem ritmo',
    semRitmo.status === 400 || semRitmo.status === 409,
    { status: semRitmo.status, corpo: semRitmo.corpo && semRitmo.corpo.erro });

  const comRitmo = await postar(env, '/api/bastidores/curadoria', {
    professor: 'leticia', modalidade: 'Balé clássico', tradicao: 'RAD', turma: 'Sala de Prova',
  });
  conferir('…e atribui-se à sala COM ritmo — é o que a criação desobstrui',
    comRitmo.status === 201 || comRitmo.status === 200,
    { status: comRitmo.status, corpo: comRitmo.corpo && comRitmo.corpo.erro });

  /* O MÓDULO QUE NÃO EXISTE. Esta asserção é a MEDIDA de uma ausência declarada — ela não pede
   * que o módulo continue ausente, pede que, se alguém o implementar, este texto seja revisto em
   * vez de o registo continuar a dizer o contrário. */
  const modulo = path.join(RAIZ, 'motor', 'servidor');
  const arquivos = fs.readdirSync(modulo);
  const daTabela = arquivos.filter((f) => /tabela|atividades|espacos|eventos/.test(f));
  conferir('a «Tabela de atividades» não está implementada (PLANO: «nada foi implementado»)',
    daTabela.length === 0, daTabela);

  console.log('\nF. A RUBRICA É DE UM PROFESSOR, e o passo 3 tem UM gesto (18/11/2026)');
  {
    /* O QUE ELA VIU, e são duas coisas na mesma frase: «essa rubrica aqui, ela precisa também estar
     * vinculada a um professor […] é o professor que vai aplicar esse tipo de rubrica na aula. […]
     * Outro professor pode adotar outra rubrica.» E, sobre o passo 3: «não tem sentido ter esse
     * botão de associar rubrica ou desassociar rubrica […] E ele também não faz nada.»
     *
     * A SEGUNDA METADE ERA VERDADE LITERAL: o «Associar rubrica» e o «Gravar sala» chamavam a
     * MESMA rota com o MESMO corpo, e a única diferença era o `concluir: true` do segundo. Dois
     * botões para um ato, e o da esquerda não concluía nada. */
    const e2 = ambiente();
    /* O DONO da escola de prova chama-se «Leticia» e não declara `PROFESSOR_SLUG`: o slug vem do
     * nome (`slugDoDono`), e é `leticia`. É ele que a rubrica guarda. */
    const DONO = 'leticia';
    const umaPagina = () => bastidores.paginaProducao(
      e2.ESCOLA_SLUG, {}, [], [], e2.PROFESSOR_NOME, DONO, [], [], {}, [],
      [{ id: 'padrao', nome: 'Padrão', professor: DONO, niveis: ['Ótimo', 'Bom'] }],
      [], { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
      null, null, [], new Set(), { ok: true, contrato: null },
    );

    /* 1. O SERVIDOR GRAVA O PROFESSOR, e o devolve na rubrica criada. */
    const comDono = await postar(e2, '/api/bastidores/rubrica', {
      nome: 'Régua da Brise', professor: DONO, niveis: ['Ótimo', 'Bom'],
    });
    conferir('a rubrica grava o professor que a aplica',
      (comDono.status === 201 || comDono.status === 200)
        && comDono.corpo.rubrica && comDono.corpo.rubrica.professor === DONO,
      { status: comDono.status, professor: comDono.corpo.rubrica && comDono.corpo.rubrica.professor });

    /* 2. UM PROFESSOR QUE NÃO É DA ESCOLA É RECUSADO, e a frase nomeia o slug. */
    const fantasma = await postar(e2, '/api/bastidores/rubrica', {
      nome: 'Régua Fantasma', professor: 'ninguem-desta-escola', niveis: ['X'],
    });
    conferir('um professor que não é desta escola é recusado (400), e a frase nomeia o slug',
      fantasma.status === 400 && /ninguem-desta-escola/.test(String(fantasma.corpo.erro || '')),
      { status: fantasma.status, erro: fantasma.corpo.erro });

    /* 3. SEM PROFESSOR É LEGÍTIMO — e grava-se `null`, e não `""`. Uma rubrica anterior a este
     *    campo não tem dono, e inventar-lhe um seria escrever história. */
    const semDono = await postar(e2, '/api/bastidores/rubrica', {
      nome: 'Régua Antiga', niveis: ['X'],
    });
    conferir('uma rubrica sem professor grava `null` — e não uma string vazia',
      semDono.corpo.rubrica && semDono.corpo.rubrica.professor === null,
      semDono.corpo.rubrica && semDono.corpo.rubrica.professor);

    /* 4. O SELECT ESTÁ NO PASSO 2, com os professores da escola. */
    const pagina = umaPagina();
    conferir('o passo 2 tem o select do professor da rubrica', /id="rubr-professor"/.test(pagina), null);
    conferir('…com o vazio explícito, que é a rubrica sem dono',
      /<option value="">— sem professor —<\/option>/.test(pagina), null);
    conferir('…e com o professor da escola como opção', new RegExp('<option value="' + DONO + '"').test(pagina), null);

    /* 5. OS DOIS BOTÕES DO PASSO 3 SAÍRAM — e a página continua com o gesto que grava. */
    conferir('o «Associar rubrica» saiu do passo 3', !/id="vinc-associar"/.test(pagina), null);
    conferir('…e o «Desassociar rubrica» também', !/id="vinc-desassociar"/.test(pagina), null);
    conferir('…e o «Gravar sala» ficou — é ele o gesto que conclui',
      /id="vinc-gravar"/.test(pagina), null);
    /* O FORM TEM DE TRATAR O `submit`: sem botão de submeter, a tecla Enter faria o form nativo
     * recarregar a página por GET e perder a escolha. */
    conferir('…e o `submit` do formulário está tratado, para o Enter não recarregar a página',
      /getElementById\("form-vincular"\)\.addEventListener\("submit"/.test(pagina), null);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nG. A MODALIDADE MANDA, E OS PROFESSORES RECOLHEM-SE A ELA (18/11/2026)');

  /* «ao escolher a modalidade aqui no step um, o step dois que tem a rubrica […] deve carregar
   * apenas os professores da modalidade escolhida aqui no step um». E o modelo, por palavras dela:
   * «a sala de aula, ela é preparada para atender uma modalidade e tem professores que dão aquela
   * modalidade. […] nessa sala, nesses dias, ocorre essa modalidade de ensino com esse professor».
   *
   * A DIREÇÃO É ESTA E NÃO A CONTRÁRIA. A véspera tinha o contrário — a modalidade recolhia-se ao
   * professor —, e o contrário responde à pergunta da curadoria («quem é o professor e o que ele
   * sabe ensinar»), não à da sala («que modalidade acontece aqui, e quem a pode dar»).
   *
   * O QUE SE MEDE É A TELA A CORRER, e não a presença de um `id`: o filtro é feito de `fetch` e de
   * `innerHTML`, e nenhuma expressão regular prova que ele funciona. O `fetch` do jsdom é o único
   * ponto substituído — se a página não chamar a rota do perfil, a lista fica com todos e a prova
   * reprova.
   *
   * TRÊS PROFESSORES E TRÊS CASOS, de propósito: um que declara jazz, um que declara clássico (logo
   * fica de fora do jazz), e um que não declarou nada (que NÃO pode desaparecer — «não sei» ≠ «não
   * pode»). Com um professor só, nenhuma destas três coisas se distingue. */
  {
    let JSDOM2 = null;
    let VC2 = null;
    try { ({ JSDOM: JSDOM2, VirtualConsole: VC2 } = require('jsdom')); } catch (e) { JSDOM2 = null; }
    if (!JSDOM2) {
      naoMedida('o filtro dos professores pela modalidade da sala', 'jsdom ausente');
    } else {
      const DONO_G = 'Leticia';
      const DONO_SLUG_G = 'leticia';
      const PROFESSORES_G = [
        { nome: 'Petorto', slug: 'pe-torto' },
        { nome: 'Marina Souza', slug: 'marina' },
      ];
      /* O QUE CADA PERFIL DECLARA — o `null` é «não consegui ler», o `[]` é «não declarou nada», e
       * a página trata os dois como permissivos e marcados. */
      const PERFIS = { leticia: ['jazz'], 'pe-torto': ['bale-classico'], marina: [] };
      const htmlG = bastidores.paginaProducao('breu', {}, PROFESSORES_G, [], DONO_G, DONO_SLUG_G,
        [], [], {}, [], [], []);
      const vcG = new VC2();
      vcG.on('jsdomError', () => {});
      vcG.on('error', () => {});
      const domG = new JSDOM(htmlG.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: BASE + '/bastidores/producao', pretendToBeVisual: true,
        virtualConsole: vcG,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = () => {};
          w.confirm = () => true;
          w.fetch = (u) => {
            const url = String(u);
            let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [], grupos: [] };
            const m = /professor=([^&]+)/.exec(url);
            if (url.indexOf('/api/bastidores/perfil') !== -1 && m) {
              const slug = decodeURIComponent(m[1]);
              const ids = PERFIS[slug];
              corpo = { ok: true, existe: true, modalidades: ids === null ? null : (ids || []),
                catalogo: [] };
            }
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
          };
        },
      });
      const winG = domG.window;
      const valores = (id) => [...winG.document.querySelectorAll('#' + id + ' option')]
        .map((o) => o.value).filter(Boolean);
      const rotulos = (id) => [...winG.document.querySelectorAll('#' + id + ' option')]
        .map((o) => o.textContent);
      const nota = () => winG.document.getElementById('t-habilidade-nota');
      const escolher = async (id, valor) => {
        const sel = winG.document.getElementById(id);
        sel.value = valor;
        sel.dispatchEvent(new winG.Event('change'));
        await new Promise((r) => winG.setTimeout(r, 300));
      };
      await new Promise((r) => winG.setTimeout(r, 300));

      /* ---- 1. A ORDEM NO FORMULÁRIO: a modalidade vem antes do professor. ---- */
      const ordem = [...winG.document.querySelectorAll('#form-turma select')]
        .map((s) => s.id).filter((x) => x === 'tmodalidade' || x === 'tprofessor');
      conferir('no passo 1, a modalidade vem ANTES do professor',
        ordem[0] === 'tmodalidade' && ordem[1] === 'tprofessor', ordem);

      /* ---- 2. SEM MODALIDADE, TODOS — a lista existe antes da escolha. ---- */
      conferir('sem modalidade escolhida, o professor da sala oferece os três',
        valores('tprofessor').length === 3, valores('tprofessor'));
      conferir('…e o professor da rubrica também',
        valores('rubr-professor').length === 3, valores('rubr-professor'));

      /* ---- 3. ESCOLHIDO JAZZ, SAEM OS QUE DECLARAM OUTRA MODALIDADE — nos DOIS sítios. ----
       *
       * Ficam DOIS e não um: a Leticia porque declara jazz, e a Marina porque não declarou nada —
       * e essa é a regra escrita no núcleo do perfil, «não sei» ≠ «não pode». Quem sai é o Petorto,
       * que declarou clássico e por isso se sabe que não dá jazz. */
      await escolher('tmodalidade', 'Jazz');
      conferir('escolher «Jazz» tira da SALA quem declara outra modalidade — e só esse',
        valores('tprofessor').indexOf('pe-torto') === -1
          && valores('tprofessor').indexOf('leticia') !== -1,
        valores('tprofessor'));
      conferir('…e o professor da RUBRICA (passo 2) fica com a MESMA lista',
        JSON.stringify(valores('rubr-professor')) === JSON.stringify(valores('tprofessor')),
        { rubrica: valores('rubr-professor'), sala: valores('tprofessor') });
      conferir('…e a nota diz por que a lista é mais curta',
        nota().hidden === false && /declararam Jazz/.test(nota().textContent), nota().textContent);

      /* ---- 4. QUEM NÃO DECLAROU NADA NÃO DESAPARECE, e é dito. ---- */
      await escolher('tmodalidade', 'Balé clássico');
      /* Petorto declara clássico; Marina não declarou nada. As duas ficam — a segunda marcada, com
       * «sem habilitações declaradas». Esconder Marina seria trancar a escola por um dado que ela
       * não tem como saber que falta. */
      conferir('quem declara a modalidade fica',
        valores('tprofessor').indexOf('pe-torto') !== -1, valores('tprofessor'));
      conferir('…e quem ainda não declarou habilitações fica também, marcado',
        valores('tprofessor').indexOf('marina') !== -1
          && rotulos('tprofessor').some((r) => /sem habilitações declaradas/.test(r)),
        rotulos('tprofessor'));
      conferir('…e quem declara OUTRA modalidade sai',
        valores('tprofessor').indexOf('leticia') === -1, valores('tprofessor'));

      /* ---- 5. UM PROFESSOR JÁ ESCOLHIDO NÃO É APAGADO EM SILÊNCIO. ---- */
      /* Trocar a modalidade de uma sala que já tinha professor: o valor gravado continua legível,
       * marcado como fora da modalidade. Uma opção que desaparece do `<select>` é um valor que se
       * perde no «Avançar» seguinte, sem uma frase a explicar porquê. */
      winG.document.getElementById('tprofessor').value = 'pe-torto';
      await escolher('tmodalidade', 'Jazz');
      conferir('o professor já escolhido fica na lista, marcado «fora desta modalidade»',
        valores('tprofessor').indexOf('pe-torto') !== -1
          && rotulos('tprofessor').some((r) => /fora desta modalidade/.test(r)),
        rotulos('tprofessor'));

      /* ---- 6. O PASSO 2 DEPOIS DE A SALA ESTAR GRAVADA. ---- */
      /* Aqui o formulário já pode estar limpo e a sala em foco é que sabe a modalidade — é o
       * `modalidadeQueManda`. Sem esta metade, o filtro funcionaria a preencher e esqueceria
       * exactamente quando a lista do passo 2 passa a importar. */
      try {
        winG.sessionStorage.setItem('producao:vinc-turma', 'sala-de-jazz');
      } catch (err) {}
      winG.eval('TURMAS.push({id: "sala-de-jazz", nome: "Sala de Jazz", modalidade: "Jazz"});');
      winG.document.getElementById('tmodalidade').value = '';
      await escolher('tmodalidade', '');
      conferir('gravada a sala, o passo 2 ainda sabe a modalidade dela (o formulário já está limpo)',
        valores('rubr-professor').indexOf('leticia') !== -1
          && valores('rubr-professor').indexOf('pe-torto') === -1,
        { rubrica: valores('rubr-professor'), modalidadeNoFormulario: winG.document.getElementById('tmodalidade').value });
    }
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nH. O PASSO 2 («PROFESSOR») E A TRADIÇÃO QUE ELE ENSINA (18/11/2026)');

  /* «O step 2, que é a rubrica, ele vai mudar de nome agora. Ele vai passar a se chamar professor.
   * […] Eu tenho também o professor que já foi filtrado no step 1 […]. Ele tem que ser o primeiro a
   * aparecer. […] e também que balé que ele ensina, qual é a tradição que ele ensina.»
   *
   * E a tradição vem das habilitações dele, filtrada pela modalidade DA SALA: um professor de
   * clássico e jazz tem tradições diferentes em cada um, e a pergunta aqui é sobre esta sala. */
  {
    let JSDOM3 = null;
    let VC3 = null;
    try { ({ JSDOM: JSDOM3, VirtualConsole: VC3 } = require('jsdom')); } catch (e) { JSDOM3 = null; }
    if (!JSDOM3) {
      naoMedida('o passo 2 com o professor da sala à frente e a tradição lida', 'jsdom ausente');
    } else {
      /* AS RUBRICAS VÊM DO SERVIDOR, e não empurradas por `eval` depois: o `<select>` do passo 3 é
       * desenhado no HTML, e uma opção que não existe no DOM não pode ser escolhida — `sel.value`
       * com um id desconhecido dá `""`. A primeira versão desta prova caía nisso. */
      const RUBRICAS_H = [
        { id: 'regua-da-leticia', nome: 'Régua da Leticia', professor: 'leticia', niveis: ['Ótimo', 'Bom'] },
        { id: 'regua-orfa', nome: 'Régua Órfã', professor: '', niveis: ['X'] },
      ];
      const html3 = bastidores.paginaProducao('breu', {},
        [{ nome: 'Petorto', slug: 'pe-torto' }, { nome: 'Marina Souza', slug: 'marina' }], [],
        'Leticia', 'leticia', [], [], {}, [], RUBRICAS_H, []);
      const vc3 = new VC3();
      vc3.on('jsdomError', () => {});
      vc3.on('error', () => {});
      /* O PERFIL DE CADA UM, com tradições a sério: o dono declara RAD e Vaganova no clássico e
       * nada no jazz; a Marina não declarou tradição nenhuma (perfil vazio). */
      const PERFIS3 = {
        leticia: { modalidades: ['bale-classico', 'jazz'],
          tradicoes: { 'bale-classico': ['RAD', 'Vaganova'], jazz: [] } },
        'pe-torto': { modalidades: ['bale-classico'], tradicoes: { 'bale-classico': ['cubana'] } },
        marina: { modalidades: ['bale-classico'], tradicoes: {} },
      };
      const dom3 = new JSDOM3(html3.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: BASE + '/bastidores/producao', pretendToBeVisual: true,
        virtualConsole: vc3,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = () => {};
          w.confirm = () => true;
          w.fetch = (u) => {
            const url = String(u);
            let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [], grupos: [] };
            const m = /professor=([^&]+)/.exec(url);
            if (url.indexOf('/api/bastidores/perfil') !== -1 && m) {
              const p = PERFIS3[decodeURIComponent(m[1])];
              corpo = p
                ? { ok: true, existe: true, modalidades: p.modalidades, tradicoes: p.tradicoes,
                    catalogo: [] }
                : { ok: true, existe: false, modalidades: [], tradicoes: {}, catalogo: [] };
            }
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
          };
        },
      });
      const win3 = dom3.window;
      const esperar = (ms) => new Promise((r) => win3.setTimeout(r, ms || 300));
      const escolher = async (id, valor) => {
        const sel = win3.document.getElementById(id);
        sel.value = valor;
        sel.dispatchEvent(new win3.Event('change'));
        await esperar(300);
      };
      const tradicao = () => win3.document.getElementById('rubr-tradicao').textContent;
      const opcoes = (id) => [...win3.document.querySelectorAll('#' + id + ' option')].map((o) => o.value);
      await esperar();

      /* 1. O PROFESSOR DA SALA VEM PRIMEIRO NO PASSO 2 — e escolhido, quando a rubrica não tem dono.
       *    O dono da escola (`leticia`) já é o primeiro da lista do servidor; a prova escolhe a
       *    Marina na sala para que o primeiro deixe de ser o dono por acidente. */
      await escolher('tmodalidade', 'Balé clássico');
      await escolher('tprofessor', 'marina');
      await esperar(300);
      /* O PRIMEIRO PROFESSOR DA LISTA — a posição 0 é o `<option value="">`, o vazio explícito. */
      conferir('o professor da sala é o PRIMEIRO do passo 2, e já vem escolhido',
        opcoes('rubr-professor')[1] === 'marina'
          && win3.document.getElementById('rubr-professor').value === 'marina',
        opcoes('rubr-professor'));

      /* 2. A TRADIÇÃO LIDA, e pelas habilitações DELE — a Marina não declarou nenhuma, e o ecrã
       *    diz isso em vez de inventar. */
      conferir('…e a tradição dele é lida das habilitações, dizendo que ele não declarou',
        /ainda não declarou a tradição/.test(tradicao()), tradicao());

      /* 3. TROCAR PARA QUEM DECLARA, na mesma modalidade: aparecem as dele. */
      await escolher('rubr-professor', 'leticia');
      await esperar(300);
      conferir('…e quem declarou mostra as suas, na modalidade da sala',
        /RAD/.test(tradicao()) && /Vaganova/.test(tradicao()), tradicao());

      /* 4. A MESMA PESSOA, OUTRA MODALIDADE DA SALA: as tradições são as DAQUELA modalidade. É a
       *    prova de que o mapa é por modalidade, e não uma lista achatada. */
      await escolher('tmodalidade', 'Jazz');
      await esperar(300);
      conferir('…e trocando a modalidade da sala, as tradições mudam com ela',
        /não ensina tradição em Jazz/.test(tradicao()), tradicao());

      /* 5. O PASSO 3: escolher a rubrica diz de quem ela é, com a modalidade da sala. */
      try { win3.sessionStorage.setItem('producao:vinc-turma', 'sala-de-prova-h'); } catch (err) {}
      win3.eval('TURMAS.push({id: "sala-de-prova-h", nome: "Sala H", modalidade: "Jazz", '
        + 'professor: "leticia"});');
      await escolher('vinc-rubrica', 'regua-da-leticia');
      await esperar(300);
      const linha = win3.document.getElementById('vinc-professor');
      conferir('o passo 3 diz de quem é a rubrica escolhida, com a modalidade da sala',
        linha && linha.hidden === false && /Leticia/.test(linha.textContent)
          && /Jazz/.test(linha.textContent), linha && linha.textContent);

      /* 6. UMA RUBRICA SEM DONO DIZ QUE NÃO TEM — calar faria parecer que tem. */
      await escolher('vinc-rubrica', 'regua-orfa');
      await esperar(300);
      conferir('…e uma rubrica sem professor di-lo, em vez de o omitir',
        /não tem professor/.test(win3.document.getElementById('vinc-professor').textContent),
        win3.document.getElementById('vinc-professor').textContent);
    }
  }

  console.log('');
  if (naoMedidas.length) {
    console.log('NÃO MEDIDAS: ' + naoMedidas.length + ' — ' + naoMedidas.join('; '));
  }
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: o cartão da sala diz três — ritmo, régua e o professor com a modalidade que ali ensina — e não'
    + ' emite conteúdos em lugar nenhum; o elenco cria-se sem anamnese e sem turma, e o cliente'
    + ' deixou de desligar o nome; o passo 2 obedece ao «Seguir» e o espaço das alunas'
    + ' fica vazio sem anamnese; a sala sem ritmo não recebe turma e a com ritmo recebe — e a Tabela de'
    + ' atividades segue como plano, não como código; os basilares são um bloco no passo 4; e a'
    + ' nomenclatura: Audição e Estilo no menu e nos títulos, elenco nos campos, Elencos na'
    + ' listagem, Conteúdo do Estilo na Turma.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
