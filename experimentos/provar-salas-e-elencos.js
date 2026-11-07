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
 *    O QUE FICA: o RITMO em que a aula ocorre e a RÉGUA com que se mede. E o cartão passa a ter
 *    a forma de DOIS — `trio trio-duo` —, porque a `.trio` é de três (é a forma de todas as
 *    listas do acervo: de quem é, quem fez, quando) e deixá-la em três daria um terço VAZIO à
 *    direita, que se lê como dado em falta.
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

  conferir('o cartão usa a forma de DOIS (`trio trio-duo`)',
    /class="trio trio-duo"/.test(trecho), trecho.slice(0, 200));
  conferir('…e continua a dizer o RITMO', /data-balao="ritmo"/.test(trecho), null);
  conferir('…e a RÉGUA', /data-balao="regua"/.test(trecho), null);
  conferir('…e NÃO diz «Conteúdos»', !/data-balao="conteudos"/.test(trecho),
    (trecho.match(/data-balao="[a-z]+"/g) || []));
  conferir('…nem emite o painel de conteúdos', !/data-painel="conteudos"/.test(trecho), null);
  conferir('…e o painel dos conteúdos não existe em lugar nenhum da página',
    html.indexOf('data-painel="conteudos"') === -1, null);

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
   * O PASSO 2 SEM RETRATO: DIZ O QUE FALTA, E LEVA LÁ (07/11/2026).
   *
   * O PEDIDO. «Ao tentar avançar para o Step 2 […] caso as alunas ainda não possuam anamnese
   * preenchida, a interface fica vazia ou bloqueada sem orientar o professor.» O que havia era
   * um travessão — «— nenhuma aluna com anamnese.» — e o passo, além disso, NÃO ABRIA: a
   * explicação existia num sítio a que ninguém chegava.
   *
   * O que se mede aqui é o que o cliente SERVIDO faz, e não o que se pretendeu:
   *   · há um estado vazio próprio, que NOMEIA a falta e diz que a anamnese é obrigatória;
   *   · ele traz uma LIGAÇÃO para a Área do Professor — e o endereço vem do servidor, com a
   *     escola e o professor na query (`urlDaPorta`), e não escrito à mão no cliente;
   *   · o passo 2 abre MESMO sem anamnese (`podeVerPasso`), e o 3 e o 4 continuam fechados;
   *   · a volta é automática: a janela que reganha o foco relê a lista (`haRetratoNovo`);
   *   · a razão de o «Seguir» estar apagado está à vista, não só no `title`. */
  const estadoVazio = (() => {
    const i = script.indexOf('function estadoVazioDeAlunas()');
    if (i === -1) return '';
    const j = script.indexOf('function pintarAlunas(', i);
    return j === -1 ? script.slice(i, i + 2000) : script.slice(i, j);
  })();
  conferir('o passo 2 tem um estado vazio próprio (deixou de ser um travessão)',
    Boolean(estadoVazio) && !/— nenhuma aluna com anamnese/.test(script), estadoVazio.slice(0, 120));
  conferir('…que NOMEIA a falta', /Nenhuma aluna com anamnese/.test(estadoVazio), null);
  conferir('…que diz que a anamnese é OBRIGATÓRIA', /obrigat[óo]ria/i.test(estadoVazio), null);
  conferir('…que diz a REGRA DE AVANÇO (uma aluna basta para abrir o passo)',
    /UMA aluna|uma aluna/.test(estadoVazio), null);
  conferir('…e que traz a LIGAÇÃO para a anamnese, como peça da casa',
    /a\.acao|class=\\?"acao/.test(estadoVazio) && /ANAMNESE_DO_ALUNO/.test(estadoVazio), null);
  conferir('o endereço da anamnese vem do SERVIDOR, com a escola e o professor',
    /var ANAMNESE_DO_ALUNO = "\/anamnese\/\?/.test(script) && /escola=/.test(
      (script.match(/var ANAMNESE_DO_ALUNO = "([^"]*)"/) || [])[1] || ''), null);
  conferir('o estado vazio é o que se desenha quando não há retrato (e não o travessão)',
    /alvo\.innerHTML = estadoVazioDeAlunas\(\)/.test(script), null);
  const corpoDoVer = (() => {
    const i = script.indexOf('function podeVerPasso(');
    if (i === -1) return '';
    const j = script.indexOf('\n', script.indexOf('}', i));
    return script.slice(i, j === -1 ? i + 200 : j);
  })();
  conferir('VER não é AVANÇAR: o passo 2 abre sem anamnese, o 3 e o 4 não',
    /passo === 2 && !haAnamnese\(\)/.test(corpoDoVer) && /return podeIrPara\(passo\)/.test(corpoDoVer),
    corpoDoVer.slice(0, 200));
  conferir('…e a tira usa a regra de VER (senão a explicação nunca aparecia)',
    /!podeVerPasso\(n\)/.test(script), null);
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
  conferir('a lista da Audição passou a «Audições»', /<h3>Audições<\/h3>/.test(html), null);
  conferir('…e o estado vazio dela acompanha («nenhuma audição ainda»)',
    /nenhuma audição ainda/.test(html), null);
  /* A LISTA DO ESTILO FICA COM «Exercícios com verbete»: «verbete» é a ficha da notação, não o
   * nome da secção — a decisão de 07/11/2026 foi explícita nisso. */
  conferir('a lista do Estilo continuou «Exercícios com verbete»',
    /<h3>Exercícios com verbete<\/h3>/.test(html), null);
  conferir('a Turma passou a dizer «Conteúdo do Estilo»',
    /class="campo-rotulo">Conteúdo do Estilo</.test(html), null);
  conferir('…e não diz mais «Conteúdo da aula»', !/Conteúdo da aula/.test(html), null);
  conferir('os `id` das secções NÃO mudaram (são âncoras de link e de prova)',
    /id="sec-corpo"/.test(html) && /id="sec-verbetes"/.test(html) && /id="sec-curadorias"/.test(html), null);

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

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: o cartão da sala diz dois (ritmo e régua) e não'
    + ' emite conteúdos em lugar nenhum; o elenco cria-se sem anamnese e sem turma, e o cliente'
    + ' deixou de desligar o nome; o passo 2 do elenco abre para explicar a falta e leva à'
    + ' anamnese; a sala sem ritmo não recebe turma e a com ritmo recebe — e a Tabela de'
    + ' atividades segue como plano, não como código. E a nomenclatura: Audição e Estilo no menu'
    + ' e nos títulos, elenco nos campos, Conteúdo do Estilo na Turma.');
})().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
