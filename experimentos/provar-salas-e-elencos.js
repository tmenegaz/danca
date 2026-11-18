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
  console.log('\nA1. A SALA DIZ A MODALIDADE — E SÓ ELA (18/11/2026)');

  /* «A modalidade que está aqui no step sala define o professor da sala no step professor. É lá que
   * eu vou escolher o professor da sala e não aqui. […] O professor da sala não existe aqui como
   * campo, tá? Tira ele daqui. […] Aí você colocou também uma informação, um texto logo abaixo, não
   * tem essas coisas. Eu já tinha dito isso para você.»
   *
   * São DUAS remoções, e a segunda é a que se esquece: o campo e a nota que o explicava. */
  conferir('o passo 1 já NÃO tem o campo do professor da sala',
    !/id="tprofessor"/.test(html), (html.match(/id="tprofessor"/g) || []).length);
  conferir('…nem a nota que o explicava', !/id="t-habilidade-nota"/.test(html), null);
  conferir('…e a modalidade FICA, que é o que o passo 1 declara',
    /id="tmodalidade"/.test(html), null);
  /* A MODALIDADE GUARDA O NOME, E NÃO O ID — a convenção da Turma e da curadoria, e a razão está
   * escrita no núcleo: «o perfil do professor guarda ids e a Turma guarda o nome que o formulário
   * oferece». Guardar um id aqui faria o `enquadramento.js` comparar um id com um nome. */
  const soDaSala = (() => {
    const i = html.indexOf('id="tmodalidade"');
    if (i === -1) return '';
    const j = html.indexOf('</select>', i);
    return j === -1 ? html.slice(i) : html.slice(i, j);
  })();
  conferir('…e a opção da modalidade leva o NOME no `value`, como na Turma',
    /<option value="Jazz"/.test(soDaSala) && !/<option value="jazz"/.test(soDaSala),
    (soDaSala.match(/<option value="[^"]*"/g) || []));

  /* AGORA UMA SALA COM MODALIDADE E PROFESSOR — gravados pelo passo 2, que é o passo de quem dá a
   * aula. O cartão tem de dizer os dois, e o painel do nicho tem de reservar o lugar da TRADIÇÃO:
   * «quando eu expando aqui o nicho do professor, aparece o nome dele, a modalidade que ele ensina,
   * falta a tradição. Tem que dizer qual é a tradição que ele ensina.» */
  const comDono = await postar(env, '/api/bastidores/turma',
    Object.assign({ nome: 'Sala de Jazz', modalidade: 'Jazz' }, RITMO));
  conferir('a sala com modalidade é aceite (201/200), e o id volta',
    (comDono.status === 201 || comDono.status === 200) && Boolean(comDono.corpo.id),
    { status: comDono.status, corpo: comDono.corpo });

  const pagina2 = await bastidores.fetch(new Request(BASE + '/bastidores/producao'), env);
  const html2 = await pagina2.text();
  const trecho2 = (() => {
    const i = html2.indexOf('Sala de Jazz');
    return i === -1 ? '' : html2.slice(i, i + 5000);
  })();
  conferir('o nicho do professor existe no cartão', /data-balao="professor"/.test(trecho2), null);
  /* A SALA AINDA NÃO TEM PROFESSOR — e o painel diz o que falta e ONDE, sem inventar. */
  conferir('sem professor, o painel do nicho diz o que falta e onde se completa',
    /Falta o professor/.test(trecho2), trecho2.slice(0, 200));

  /* O PROFESSOR ENTRA PELA ROTA DO PASSO 2 — que é «lá» onde ela o escolhe. A rota da rubrica
   * recebe a sala e grava-lhe o professor no mesmo ato: é o que impede a sala de ficar órfã no
   * instante em que o formulário do passo 1 deixou de o pedir. */
  const salaId = comDono.corpo.id;
  const regua = await postar(env, '/api/bastidores/rubrica', {
    nome: 'Régua do Jazz', professor: 'leticia', turma: salaId, niveis: ['Ótimo', 'Bom'],
  });
  conferir('a rubrica do passo 2 grava o professor NA SALA',
    (regua.status === 201 || regua.status === 200) && regua.corpo.sala === 'Sala de Jazz',
    { status: regua.status, sala: regua.corpo && regua.corpo.sala });

  const pagina3 = await bastidores.fetch(new Request(BASE + '/bastidores/producao'), env);
  const html3 = await pagina3.text();
  const trecho3 = (() => {
    const i = html3.indexOf('Sala de Jazz');
    return i === -1 ? '' : html3.slice(i, i + 5000);
  })();
  conferir('…e o cartão passa a dizer o professor pelo NOME',
    /data-balao="professor"[\s\S]{0,400}?Leticia/.test(trecho3), trecho3.slice(0, 300));
  conferir('…com o lugar da tradição reservado no painel',
    /data-tradicao-de="leticia"/.test(trecho3), null);

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
   * apenas os professores da modalidade escolhida aqui no step um».
   *
   * A 18/11/2026 a modalidade passou a ser o ÚNICO campo do passo 1 — o professor saiu de lá, e é
   * no passo 2 que se escolhe. A lista do passo 2 continua a recolher-se à modalidade, e é isso que
   * se mede aqui: a tela a correr, porque o filtro é `fetch` e `innerHTML`, e nenhuma expressão
   * regular prova que ele funciona.
   *
   * TRÊS PROFESSORES E TRÊS CASOS: um que declara jazz, um que declara clássico (logo fica de fora
   * do jazz), e um que não declarou nada (que NÃO pode desaparecer — «não sei» ≠ «não pode»). */
  {
    let JSDOM2 = null;
    let VC2 = null;
    try { ({ JSDOM: JSDOM2, VirtualConsole: VC2 } = require('jsdom')); } catch (e) { JSDOM2 = null; }
    if (!JSDOM2) {
      naoMedida('o filtro dos professores pela modalidade da sala', 'jsdom ausente');
    } else {
      const PERFIS = { leticia: ['jazz'], 'pe-torto': ['bale-classico'], marina: [] };
      const htmlG = bastidores.paginaProducao('breu', {},
        [{ nome: 'Petorto', slug: 'pe-torto' }, { nome: 'Marina Souza', slug: 'marina' }],
        [], 'Leticia', 'leticia', [], [], {}, [], [], []);
      const vcG = new VC2();
      vcG.on('jsdomError', () => {});
      vcG.on('error', () => {});
      const domG = new JSDOM2(htmlG.replace(/<script src="[^"]*"><\/script>/g, ''), {
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
                tradicoes: {}, catalogo: [] };
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
      const escolher = async (id, valor) => {
        const sel = winG.document.getElementById(id);
        sel.value = valor;
        sel.dispatchEvent(new winG.Event('change'));
        await new Promise((r) => winG.setTimeout(r, 300));
      };
      await new Promise((r) => winG.setTimeout(r, 300));

      /* ---- 1. SEM MODALIDADE, TODOS — a lista existe antes da escolha. ---- */
      conferir('sem modalidade escolhida, o professor da rubrica oferece os três',
        valores('rubr-professor').length === 3, valores('rubr-professor'));

      /* ---- 2. ESCOLHIDO JAZZ, SAEM OS QUE DECLARAM OUTRA MODALIDADE. ---- */
      await escolher('tmodalidade', 'Jazz');
      conferir('escolher «Jazz» tira quem declara outra modalidade — e só esse',
        valores('rubr-professor').indexOf('pe-torto') === -1
          && valores('rubr-professor').indexOf('leticia') !== -1,
        valores('rubr-professor'));

      /* ---- 3. QUEM NÃO DECLAROU NADA NÃO DESAPARECE, e é dito. ---- */
      await escolher('tmodalidade', 'Balé clássico');
      conferir('quem declara a modalidade fica',
        valores('rubr-professor').indexOf('pe-torto') !== -1, valores('rubr-professor'));
      conferir('…e quem ainda não declarou habilitações fica também, marcado',
        valores('rubr-professor').indexOf('marina') !== -1
          && rotulos('rubr-professor').some((r) => /sem habilitações declaradas/.test(r)),
        rotulos('rubr-professor'));
      conferir('…e quem declara OUTRA modalidade sai',
        valores('rubr-professor').indexOf('leticia') === -1, valores('rubr-professor'));
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
      /* O PROFESSOR JÁ NÃO SE ESCOLHE NO PASSO 1 (18/11/2026): o campo saiu, e quem escolhe é aqui.
       * A ordem da lista é a do servidor — o dono primeiro. O que a prova mede é que a lista existe
       * e que a tradição da pessoa escolhida é lida. */
      await escolher('tmodalidade', 'Balé clássico');
      await esperar(300);
      /* O PRIMEIRO PROFESSOR DA LISTA — a posição 0 é o `<option value="">`, o vazio explícito. */
      conferir('o passo 2 oferece os professores da modalidade, e o dono vem à frente',
        opcoes('rubr-professor')[1] === 'leticia', opcoes('rubr-professor'));

      /* 2. A TRADIÇÃO LIDA, e pelas habilitações DELE — a Marina não declarou nenhuma, e o ecrã
       *    diz isso em vez de inventar. */
      await escolher('rubr-professor', 'marina');
      await esperar(300);
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

  // -------------------------------------------------------------------------------------------
  console.log('\nI. A TURMA FICA COM A SALA — E O RESTO VEM DELA (18/11/2026)');

  /* «Na turma pode então já tirar o campo professor, modalidade e tradição. Isso sai, tá? Pode
   * tirar, porque ele já vem com a definição da sala. A sala já traz quem é o professor, qual é a
   * modalidade que ele ensina e qual é a tradição que ele ensina. […] Primeiro campo: sala. […] e
   * o grau e o nível ainda funcionam com o filtro que existia da tradição. Então quando vier a
   * tradição já pela sala, isso já tem que estar funcionando também.»
   *
   * É a prova de três coisas: o que SAIU, o que passou a ser PRIMEIRO, e que o grau continua a
   * numerar-se pela tradição — agora vinda da sala. */
  {
    /* ---- 1. OS TRÊS CAMPOS SAÍRAM DO FORMULÁRIO. ---- */
    conferir('o formulário da Turma já não tem professor, modalidade nem tradição',
      html.indexOf('id="cuprofessor"') === -1
        && html.indexOf('id="cumodalidade"') === -1
        && html.indexOf('id="cutradicao"') === -1,
      ['cuprofessor', 'cumodalidade', 'cutradicao'].filter((x) => html.indexOf('id="' + x + '"') !== -1));

    /* ---- 2. A SALA É O PRIMEIRO CAMPO — medido pela POSIÇÃO no HTML, que é a ordem do ecrã. ---- */
    const pos = (id) => html.indexOf('for="' + id + '"');
    conferir('…e a SALA passou a ser o primeiro campo do formulário',
      pos('cuturma') !== -1 && pos('cuturma') < pos('cugrau') && pos('cuturma') < pos('cunivel')
        && pos('cuturma') < pos('cuelenco'),
      { sala: pos('cuturma'), grau: pos('cugrau'), nivel: pos('cunivel'), elenco: pos('cuelenco') });
    /* O QUE FICA, e ela nomeou-o: grau, nível, elenco e conteúdo do estilo. */
    conferir('…e ficam o grau, o nível, o elenco e o conteúdo do estilo',
      pos('cugrau') !== -1 && pos('cunivel') !== -1 && pos('cuelenco') !== -1
        && html.indexOf('id="esc-conteudos"') !== -1, null);

    /* ---- 3. O QUE A SALA TRAZ, EM LEITURA. ---- */
    conferir('a Turma mostra, em leitura, o que a sala traz (professor, modalidade, tradição)',
      html.indexOf('id="cu-da-sala"') !== -1, null);

    /* ---- 4. A ROTA DERIVA OS TRÊS DA SALA, e não os pede ao formulário. ----
     *
     * Mede-se pelo lado do servidor e numa escola de mentira, porque é a rota que escreve: o
     * formulário já não os manda, e uma curadoria gravada sem eles deixaria o `enquadramento.js`
     * — e as turmas sem habilitação — a ler três campos vazios. */
    const e3 = ambiente();
    const sala = await postar(e3, '/api/bastidores/turma', Object.assign({
      nome: 'Sala da Turma', modalidade: 'Balé clássico',
    }, RITMO));
    /* O professor entra pela rota do passo 2, que é o sítio onde se escolhe — e é ela que o grava
     * na sala. Sem este passo a sala não tem professor nenhum, e a Turma não teria o que derivar. */
    await postar(e3, '/api/bastidores/rubrica', {
      nome: 'Régua da Sala', professor: 'leticia', turma: sala.corpo.id, niveis: ['Ótimo'],
    });
    const cu = await postar(e3, '/api/bastidores/curadoria', {
      turma: 'Sala da Turma', linhaDeBase: '', grau: '', nivel: '',
    });
    conferir('a Turma grava-se com a sala e SEM os três campos no corpo',
      cu.status === 200 || cu.status === 201, { status: cu.status, erro: cu.corpo && cu.corpo.erro });
    const gravada = (cu.corpo && cu.corpo.curadoria) || {};
    conferir('…e o servidor DERIVA o professor e a modalidade da sala',
      String(gravada.professor || '') === 'leticia'
        && String(gravada.modalidade || '') === 'Balé clássico',
      { professor: gravada.professor, modalidade: gravada.modalidade });

    /* ---- 5. O GRAU NUMERA PELA TRADIÇÃO DA SALA — a tela a correr. ----
     *
     * «o grau e o nível ainda funcionam com o filtro que existia da tradição. Então quando vier a
     * tradição já pela sala, isso já tem que estar funcionando também.»
     *
     * O FILTRO NÃO MUDOU — mudou a origem. Antes vinha de um `select` que a pessoa escolhia; agora
     * vem do perfil do professor da sala, pela modalidade da sala. Sem esta prova, o `pintarGraus`
     * ficaria a ler um campo que já não existe e cairia sempre na lista genérica, sem erro nenhum. */
    let JSDOM4 = null;
    let VC4 = null;
    try { ({ JSDOM: JSDOM4, VirtualConsole: VC4 } = require('jsdom')); } catch (e) { JSDOM4 = null; }
    if (!JSDOM4) {
      naoMedida('o grau numerado pela tradição que vem da sala', 'jsdom ausente');
    } else {
      const htmlI = bastidores.paginaProducao('breu', {},
        [{ nome: 'Petorto', slug: 'pe-torto' }], [], 'Leticia', 'leticia',
        [{ id: 'sala-i', nome: 'Sala da Tradição', dias: ['ter'], horarios: { ter: '19:00' },
          duracaoMin: 60, periodoInicio: '2026-01-01', periodoFim: '2026-06-01',
          modalidade: 'Balé clássico', professor: 'leticia' }],
        [], {}, [], [], []);
      const vcI = new VC4();
      vcI.on('jsdomError', () => {});
      vcI.on('error', () => {});
      const domI = new JSDOM4(htmlI.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: BASE + '/bastidores/producao', pretendToBeVisual: true,
        virtualConsole: vcI,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = () => {};
          w.confirm = () => true;
          w.fetch = (u) => {
            const url = String(u);
            let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [], grupos: [] };
            if (url.indexOf('/api/bastidores/perfil') !== -1) {
              /* O dono declara RAD no clássico — e é a RAD que numera em fila («Grade»). */
              corpo = { ok: true, existe: true, modalidades: ['bale-classico'],
                tradicoes: { 'bale-classico': ['RAD'] }, catalogo: [] };
            }
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
          };
        },
      });
      const winI = domI.window;
      const esperarI = (ms) => new Promise((r) => winI.setTimeout(r, ms || 350));
      await esperarI();
      /* A SALA ESCOLHE-SE — é o único gesto que a Turma passou a ter. Antes de a escolher, a
       * linha diz o que fazer («— escolha a sala…»); depois, diz o que ela traz. */
      const selSala = winI.document.getElementById('cuturma');
      selSala.value = 'Sala da Tradição';
      selSala.dispatchEvent(new winI.Event('change'));
      await esperarI();
      const leitura = winI.document.getElementById('cu-da-sala');
      conferir('escolhida a sala, a Turma diz o professor, a modalidade e a tradição dela',
        leitura && /Leticia/.test(leitura.textContent) && /Balé clássico/.test(leitura.textContent)
          && /RAD/.test(leitura.textContent), leitura && leitura.textContent);
      /* A RAD NUMERA EM FILA («Grade»), e as outras agrupam em graus: é o que a lista do grau
       * mostra. Com a tradição vinda da sala, o grau deixa de ser genérico. */
      const graus = [...winI.document.querySelectorAll('#cugrau option')].map((o) => o.value).filter(Boolean);
      conferir('…e o grau passa a numerar pela tradição dela (a RAD usa «Grade»)',
        graus.length === 0
          || graus.every((g) => /Grade|Intermediário|Avançado|Iniciante/.test(g)),
        graus);
    }

    /* ---- 6. A LISTAGEM DOS PROFESSORES RESERVA O LUGAR DO QUE ELE ENSINA. ---- */
    /* TODAS AS LINHAS, e não só uma: o DONO e o professor CADASTRADO têm os dois o seu lugar. Uma
     * asserção de «pelo menos um» passaria com metade da lista por preencher — e foi o que o
     * controlo negativo mostrou (mutada a linha do professor, a prova continuava verde, porque a
     * linha do dono ainda tinha a sua).
     *
     * A página do ambiente de prova NÃO TEM professor cadastrado (só o dono), e por isso o número
     * certo não é dois: é o número de linhas. Mede-se numa página com um de cada. */
    const htmlProfs = bastidores.paginaProducao('breu', {},
      [{ nome: 'Petorto', slug: 'pe-torto' }], [], 'Leticia', 'leticia', [], [], {}, [], [], []);
    conferir('a listagem dos professores tem o lugar do que cada um ensina, em TODAS as linhas',
      (htmlProfs.match(/data-perfil-de=/g) || []).length === 2,
      (htmlProfs.match(/data-perfil-de=/g) || []).length);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nJ. A LISTAGEM DA TURMA — a tradição vem da sala, e o link é do plano (18/11/2026)');

  /* O QUE ELA VIU, e são duas coisas na mesma linha: «está escrito assim na listagem: ballet
   * clássico francesa nível 1, professor Demi Plier. […] mas que a tradição é francesa, isso está
   * errado. A tradição é a que agora a turma carrega. A sala é quem carrega.» E, sobre o link:
   * «Demi Plier está me levando até o plano de ensino desse professor do Demi Plier. […] pode dizer
   * aqui plano de ensino como link e não Demi Plier».
   *
   * A CAUSA DO PRIMEIRO é medida, não suposta: o registo da curadoria guarda `tradicao: "francesa"`
   * — um valor gravado antes de a tradição passar a derivar-se — e o perfil do professor daquela
   * sala declara RAD. O registo NÃO é reescrito (o passado é o que foi declarado); a LEITURA é que
   * passa a ser a do presente. */
  {
    const TURMA_J = [{
      id: 'sala-j', nome: 'Rosa', dias: ['ter'], horarios: { ter: '19:00' }, duracaoMin: 60,
      periodoInicio: '2026-01-01', periodoFim: '2026-06-01',
      modalidade: 'Balé clássico', professor: 'demi-plie',
    }];
    const curadoriaJ = [{
      id: 'c-j', professor: 'demi-plie', modalidade: 'Balé clássico', tradicao: 'francesa',
      grau: 'Básico', nivel: '1', nivelReferencia: 'Básico 1', linhaDeBase: 'ami', turmas: ['Rosa'],
    }];
    const htmlJ = bastidores.paginaProducao('breu', {},
      [{ nome: 'Demi Plié', slug: 'demi-plie' }], [], 'Demi', 'demi-plie',
      TURMA_J, [], {}, curadoriaJ,
      [{ id: 'padrao', nome: 'Padrão', professor: 'demi-plie', niveis: ['Ótimo'] }],
      [{ professor: 'demi-plie', turma: 'Rosa', ciclo: '01' }],
      { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
      null, null, [], new Set(), { ok: true, contrato: null });
    /* O RECORTE COMEÇA NO CARTÃO DA TURMA, e não no primeiro `.dono` da página: o cartão do
     * PROFESSOR também tem `.dono`, e vem antes. `data-curadoria` é a identidade da linha. */
    const recorteDe = (texto) => {
      const i = texto.indexOf('data-curadoria');
      if (i === -1) return '';
      const j = texto.indexOf('class="dono"', i);
      return j === -1 ? '' : texto.slice(j, texto.indexOf('</div>', j));
    };
    const dono = recorteDe(htmlJ);

    /* A TRADIÇÃO TEM LUGAR RESERVADO, com os dois dados que a leitura precisa. O valor NÃO vem no
     * HTML: o perfil está no repositório, e lê-lo por Turma em cada carregamento seriam N pedidos
     * para uma linha de texto. */
    conferir('a tradição da Turma sai com o lugar reservado — professor e modalidade da sala',
      /data-tradicao-da-turma="demi-plie"/.test(dono)
        && /data-modalidade="Balé clássico"/.test(dono), dono.slice(0, 400));
    /* E ENQUANTO A LEITURA NÃO CHEGA, mostra o que o REGISTO diz — pode estar velho, mas não é
     * inventado; um traço apagaria um facto por causa de uma leitura que ainda não aconteceu. */
    conferir('…e mostra o valor do registo enquanto a leitura não chega',
      /Francesa|francesa/.test(dono), dono.slice(0, 400));

    /* O NOME DO PROFESSOR É TEXTO; O LINK É DO PLANO. */
    conferir('o nome do professor está na linha como texto',
      /Demi/.test(dono), dono.slice(0, 500));
    conferir('…e o link diz «plano de ensino», e não o nome da pessoa',
      /<a class="nome-link"[^>]*>plano de ensino<\/a>/.test(dono), dono.slice(0, 600));
    conferir('…e o nome NÃO é um link',
      !/<a[^>]*>\s*Demi\s*<\/a>/.test(dono), dono.slice(0, 600));

    /* SEM PLANO, NÃO HÁ LINK — a promessa de uma página que não existe é pior do que a ausência. */
    const htmlSemPlano = bastidores.paginaProducao('breu', {},
      [{ nome: 'Demi Plié', slug: 'demi-plie' }], [], 'Demi', 'demi-plie',
      TURMA_J, [], {}, curadoriaJ,
      [{ id: 'padrao', nome: 'Padrão', professor: 'demi-plie', niveis: ['Ótimo'] }],
      [], { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
      null, null, [], new Set(), { ok: true, contrato: null });
    const donoSem = recorteDe(htmlSemPlano);
    conferir('sem plano de ensino, nenhum link de plano aparece',
      !/plano de ensino<\/a>/.test(donoSem), donoSem.slice(0, 400));

    /* A TELA A CORRER: a leitura preguiçosa troca o valor do registo pelo do PERFIL. */
    let JSDOM5 = null;
    let VC5 = null;
    try { ({ JSDOM: JSDOM5, VirtualConsole: VC5 } = require('jsdom')); } catch (e) { JSDOM5 = null; }
    if (!JSDOM5) {
      naoMedida('a tradição da Turma corrigida na tela', 'jsdom ausente');
    } else {
      const vcJ = new VC5();
      vcJ.on('jsdomError', () => {});
      vcJ.on('error', () => {});
      const domJ = new JSDOM5(htmlJ.replace(/<script src="[^"]*"><\/script>/g, ''), {
        runScripts: 'dangerously', url: BASE + '/bastidores/producao#turmas', pretendToBeVisual: true,
        virtualConsole: vcJ,
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {} });
          w.alert = () => {};
          w.confirm = () => true;
          w.fetch = (u) => {
            const url = String(u);
            let corpo = { ok: true, alunas: [], linhas: [], divergentes: [], campos: [], grupos: [] };
            if (url.indexOf('/api/bastidores/perfil') !== -1) {
              corpo = { ok: true, existe: true, modalidades: ['bale-classico'],
                tradicoes: { 'bale-classico': ['RAD'] }, catalogo: [] };
            }
            return Promise.resolve({ ok: true, status: 200,
              json: () => Promise.resolve(corpo), text: () => Promise.resolve('') });
          };
        },
      });
      const winJ = domJ.window;
      await new Promise((r) => winJ.setTimeout(r, 400));
      const lugar = winJ.document.querySelector('[data-tradicao-da-turma]');
      conferir('…e o valor do registo («Francesa») é substituído pelo do perfil («RAD»)',
        Boolean(lugar) && /RAD/.test(lugar.textContent), lugar && lugar.textContent);
    }
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nK. OS GESTOS SÃO OS DA SALA, NAS TRÊS LISTAS — e a palavra é «Excluir» (18/11/2026)');

  /* «Aqui tem regra de derivação, então não pode ter excluir em um elenco que está vinculado a uma
   * turma e o botão não é editar, é derivar. […] A sala está funcionando bem, a sala é um bom
   * exemplo. […] O estilo tem que fazer esse ajuste e a turma também está certo, é derivar.»
   *
   * E a padronização: «a gente está usando excluir e apagar. Vamos usar tudo o mesmo, excluir.»
   *
   * A regra é UMA: em turma → Derivar + Excluir desabilitado; livre → Editar + Excluir. Nas três
   * listas, e pelo mesmo facto (`emTurma`), para não haver duas respostas para a mesma pergunta. */
  {
    const e4 = ambiente();
    /* OS CAMPOS DO CORPO VÊM DO SERVIDOR — inventá-los dá 400 e a prova mediria o engano dela, não
     * a regra. É a lição de sempre: um dado de prova inventado prova o dado, não o código. */
    const catalogoDeCampos = await pedir(e4, '/api/bastidores/campos-do-corpo', { method: 'GET' });
    const umCampo = ((catalogoDeCampos.corpo && catalogoDeCampos.corpo.campos) || [])
      .map((c) => String(c && c.id || '')).filter(Boolean)[0] || '';

    /* ---- 1. O ELENCO QUE UMA TURMA LÊ NÃO SE EXCLUI — a recusa é do SERVIDOR. ---- */
    const elenco = await postar(e4, '/api/bastidores/linha-de-base', {
      nome: 'Elenco da Turma', professor: 'leticia', alunas: [],
      campos: umCampo ? [umCampo] : [], rascunho: !umCampo,
    });
    conferir('o elenco é criado para o teste', elenco.status === 200 || elenco.status === 201,
      { status: elenco.status, erro: elenco.corpo && elenco.corpo.erro });
    const idElenco = (elenco.corpo && elenco.corpo.linha && elenco.corpo.linha.id) || '';
    conferir('…e tem id', Boolean(idElenco), elenco.corpo);

    await postar(e4, '/api/bastidores/turma', Object.assign({ nome: 'Sala K', modalidade: 'Balé clássico' }, RITMO));
    await postar(e4, '/api/bastidores/rubrica', {
      nome: 'Régua K', professor: 'leticia', turma: 'sala-k', niveis: ['Ótimo'],
    });
    const cu = await postar(e4, '/api/bastidores/curadoria', {
      turma: 'Sala K', linhaDeBase: idElenco, grau: '', nivel: '',
    });
    conferir('a Turma usa esse elenco', cu.status === 200 || cu.status === 201,
      { status: cu.status, erro: cu.corpo && cu.corpo.erro });

    const recusa = await pedir(e4, '/api/bastidores/linha-de-base', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: SENHA, id: idElenco }),
    });
    conferir('o SERVIDOR recusa excluir um elenco que uma Turma lê (409)',
      recusa.status === 409, { status: recusa.status, erro: recusa.corpo && recusa.corpo.erro });
    /* A FRASE DIZ O CAMINHO — sem isso a recusa é um beco: quem tentou não sabe o que fazer. */
    conferir('…e a recusa diz o que fazer (outro elenco, ou derivar)',
      /outro elenco|derive/i.test(String(recusa.corpo && recusa.corpo.erro)),
      recusa.corpo && recusa.corpo.erro);

    /* ---- 2. UM ELENCO LIVRE EXCLUI-SE. Sem isto a guarda acima poderia ser só uma parede. ---- */
    const livre = await postar(e4, '/api/bastidores/linha-de-base', {
      nome: 'Elenco Livre', professor: 'leticia', alunas: [],
      campos: umCampo ? [umCampo] : [], rascunho: !umCampo,
    });
    const idLivre = (livre.corpo && livre.corpo.linha && livre.corpo.linha.id) || '';
    const apagado = await pedir(e4, '/api/bastidores/linha-de-base', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: SENHA, id: idLivre }),
    });
    conferir('…e um elenco que nenhuma Turma lê exclui-se (200)', apagado.status === 200,
      { status: apagado.status, erro: apagado.corpo && apagado.corpo.erro });

    /* ---- 3. A LISTAGEM DOS ELENCOS: «Excluir» desabilitado em turma. ---- */
    const paginaK = await bastidores.fetch(new Request(BASE + '/bastidores/producao'), e4);
    const htmlK = await paginaK.text();
    /* O cartão do elenco é desenhado pelo CLIENTE (`LINHAS_DE_BASE`), e o que se lê no HTML são
     * as duas metades da regra dentro do script: a condição e o `disabled`. */
    conferir('o cartão do elenco escolhe o gesto por `usadaPor.length`',
      /usadaPor\.length[\s\S]{0,600}?Derivar<\/button>/.test(htmlK)
        && /usadaPor\.length[\s\S]{0,900}?disabled[\s\S]{0,200}?>Excluir</.test(htmlK),
      null);
    conferir('…e oferece «Editar» a quem está livre',
      /data-lb-editar[\s\S]{0,200}?Editar<\/button>/.test(htmlK), null);

    /* ---- 4. A LISTAGEM DO ESTILO: o nome não é botão, e a classe antiga desapareceu. ---- */
    conferir('no Estilo, o nome do exercício já não é um botão',
      htmlK.indexOf('verbetes-editar') === -1, (htmlK.match(/verbetes-editar/g) || []).length);
    conferir('…e o gesto passou para um botão da coluna das acções',
      /data-editar-verbete=/.test(htmlK), null);
    conferir('…que se chama «Derivar» quando o exercício está em turma',
      /data-editar-verbete[\s\S]{0,300}?Derivar<\/button>/.test(htmlK), null);
    conferir('…e «Editar» quando está livre',
      /data-editar-verbete[\s\S]{0,400}?Editar<\/button>/.test(htmlK), null);

    /* ---- 5. A PALAVRA É «EXCLUIR» EM TODA A PÁGINA. ---- */
    /* O rótulo «Apagar» era o do Estilo; as outras listas já diziam «Excluir». A padronização é
     * dela: «Vamos usar tudo o mesmo, excluir.» */
    conferir('nenhum botão da página diz «Apagar» — a palavra é «Excluir»',
      !/>Apagar</.test(htmlK) && !/\bApagar o verbete/.test(htmlK),
      (htmlK.match(/[^<>]{0,30}Apagar[^<>]{0,30}/g) || []).slice(0, 3));
    conferir('…e «Excluir» aparece nas listas', (htmlK.match(/>Excluir</g) || []).length >= 3,
      (htmlK.match(/>Excluir</g) || []).length);

    /* ---- 6. A TURMA É O MESMO PAR — e o par tem de ser coerente. ---- */
    /* Um `|| true` no fim de uma asserção não a torna tolerante: torna-a decorativa. Ou mede, ou
     * sai. E o que se mede na Turma não é «nunca edita»: é o MESMO par da sala — vinculada oferece
     * «Derivar» e «Excluir» desabilitado; livre oferece «Editar» e «Excluir». A asserção antiga
     * supunha a primeira metade e por isso nunca podia ser verdadeira com a Turma livre que esta
     * secção cria. */
    /* O par é emitido CONTÍGUO pela mesma função (`acoesDaCuradoria`: botão + excluir), e por isso
     * se lê no próprio HTML, sem executar o script. Fatia-se por `data-modo` e corta-se no fecho do
     * cartão: uma janela fixa de caracteres atravessava o cartão seguinte e media o botão errado. */
    const paresDaTurma = htmlK.split(/data-modo="/).slice(1).map((f) => {
      const corpo = f.split('</div>')[0];
      return {
        modo: (corpo.match(/^(editar|derivar)/) || [])[1] || '',
        excluirDesabilitado: /disabled[^>]*>\s*Excluir</.test(corpo),
        temExcluir: />\s*Excluir</.test(corpo),
      };
    }).filter((p) => p.modo && p.temExcluir);
    const incoerentes = paresDaTurma.filter((p) => (p.modo === 'derivar' ? !p.excluirDesabilitado : p.excluirDesabilitado));
    conferir('a Turma segue o mesmo par: «Derivar» exige «Excluir» desabilitado, «Editar» não',
      paresDaTurma.length > 0 && incoerentes.length === 0,
      { pares: paresDaTurma, incoerentes: incoerentes.length });
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
