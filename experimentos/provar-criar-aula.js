#!/usr/bin/env node
'use strict';

/**
 * provar-criar-aula.js — o botão do calendário, e o que ele faz de facto.
 *
 * O PEDIDO DELA (21/11/2026): «a gente vai acrescentar aqui uma quinta coluna, que é a coluna do
 * criar aula». O calendário dizia QUANDO cada aula acontece; não dizia o que fazer com isso. E a
 * pergunta que veio com ele é a que esta prova tem de responder, e não uma versão bonita dela:
 * **clicar no botão faz a aula existir?**
 *
 * «Existir» tem três metades, e as três se medem:
 *
 *   1. o DOCUMENTO — `-aula-02.md` escrito no repositório (o derivador, com o número dela);
 *   2. a LISTA — `aula-02` no `DOCS` do manifesto, sem a qual o gerador não publica nada;
 *   3. a PÁGINA — «Aula 02» na tabela dos objetivos deixa de ser «(a criar)» e passa a ligação.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A COLUNA: botão para a aula que não tem documento, ligação para a que tem, e nenhuma
 *      coluna quando o gerador não a pede (o modo que as provas antigas usam).
 *   B. A PÁGINA DO PLANO: o diálogo existe, e o dado que ele precisa — os marcos, o repertório, os
 *      blocos, o carimbo do plano — está lá. Um botão sem dados abre uma caixa vazia.
 *   C. A REGRA: a aula existe quando o plano declara a sequência dela — e uma sequência VAZIA não
 *      a declara (um campo que a pessoa limpou não pode criar uma aula).
 *   D. O ESCRITOR: com o plano a declarar `aula-2-sequencia`, o ciclo ganha `aula-02` e
 *      `captura-aula-02` no `DOCS` e o `-aula-02.md` no repositório — e a Aula 01 continua lá.
 *   E. A TABELA: «Aula 02» vira ligação quando o documento existe, e diz «(a criar)» quando não.
 *
 *   node experimentos/provar-criar-aula.js
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const { derivarPlano } = require(path.join(RAIZ, 'motor/nucleo/derivar-plano-ciclo.js'));
const { aulasDeclaradasPeloPlano, numeroDaAula, lerChaveDaAula } =
  require(path.join(RAIZ, 'motor/nucleo/aulas-do-ciclo.js'));
const nucleo = require(path.join(RAIZ, 'motor/nucleo/elicitar.js'));
const tabelaObjetivos = require(path.join(RAIZ, 'tools/tabela-objetivos.js'));
const { criarEscritorDeCiclo } = require(path.join(RAIZ, 'motor/servidor/escrever-ciclo.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

/* ---------------------------------------------------------------------------------------- */
/* O PLANO — construído aqui, sem ler escola nenhuma. Uma prova presa a uma escola morre no dia
 * em que a escola é expurgada; esta mede o MECANISMO. */
/* ---------------------------------------------------------------------------------------- */
const resp = (v) => ({ valor: v });
const MARCO_1 = 'reconhecer o apoio e alinhar o eixo vertical';

function planoDe(extras) {
  return {
    id: 'plano-20261121-0900',
    ciclo: '01', escola: 'x',
    contexto: { professor: 'p', ciclo: '01', escola: 'x', turma: 'sala rosa' },
    respostas: Object.assign({
      'contexto-turma': resp('sala rosa'),
      'objetivo-geral': resp('o ciclo'),
      'marcos-por-aula': resp([MARCO_1]),
      'estrutura-de-cada-aula': resp([{ marco: 1, marcados: ['Barra'] }]),
      'distribuicao-de-volume': resp([{ Bloco: 'Barra', 'Proporção': '100%' }]),
      'condicoes-preliminares': resp(['sala com barra']),
      'repertorio': resp(['Plié', 'Relevé', 'Battement tendu']),
      'referencias': resp('RAD (2015)'),
      'aula-1-parametro': resp([{ marco: 1, marcados: ['Plié'] }]),
      'aula-1-sequencia': resp([{ Bloco: 'Barra', 'Objetivo específico': '1 — ' + MARCO_1,
        'Conteúdo do nível': 'Plié', Tempos: '8', Compasso: '2/4' }]),
    }, extras || {}),
  };
}

/* ========================================================================================== */
console.log('\nA · A COLUNA «CRIAR A AULA» — botão, ligação, e nada quando não é pedida');
/* ========================================================================================== */
{
  const calendario = (...args) => execFileSync('python3', [
    path.join(RAIZ, 'tools/calendario.py'),
    '--escola', 'X', '--frequencia', '1x/semana', '--dias', '1@10:30',
    '--inicio', '14/12/2026', '--total', '3',
    '--duracao-curta', '120', '--volume-curto', '175', ...args,
  ], { encoding: 'utf8' });

  const comColuna = calendario('--criar-aula', '--aulas-prontas', '01');
  /* A COLUNA CHAMA-SE «AÇÃO» (21/11/2026). Palavras dela: «a coluna que a gente tem que
     chamamos de criar aula, vamos chamar essa coluna de ação». E o «Abrir» deixou de ser um
     link cru para ser botão, com a MESMA estética do «Criar aula» ao lado — ela pediu os dois:
     «Coloca como botão esse abrir para a gente manter a mesma estética». */
  provar('a coluna existe, e chama-se «Ação», quando o gerador a pede',
    /\| Aula \| Data \| Dia \| Duração \| Ação \|/.test(comColuna),
    comColuna.split('\n').filter((l) => /\| Aula \|/.test(l)));
  provar('a aula que JÁ tem documento ganha o botão «Abrir», e não o botão de criar',
    /\| 01 \|.*<a class="acao secundario pequena" href="aula-01\.html">Abrir<\/a> \|/.test(comColuna)
    && !/\| 01 \|.*data-criar-aula/.test(comColuna),
    comColuna.split('\n').filter((l) => /^\| 01 /.test(l)));
  provar('a aula que NÃO tem ganha o botão, com o número DELA',
    /data-criar-aula="02">Criar aula<\/button>/.test(comColuna),
    comColuna.split('\n').filter((l) => /^\| 02 /.test(l)));
  provar('…e o mesmo para a 03', /data-criar-aula="03"/.test(comColuna),
    comColuna.split('\n').filter((l) => /^\| 03 /.test(l)));
  provar('o número sai com DOIS dígitos («02», e não «2»)',
    !/data-criar-aula="2"/.test(comColuna) && !/data-criar-aula="3"/.test(comColuna), comColuna);

  const semColuna = calendario();
  provar('sem `--criar-aula` a tabela fica como era — quatro colunas e nenhum botão',
    /\| Aula \| Data \| Dia \| Duração \|/.test(semColuna)
    && !/data-criar-aula/.test(semColuna), semColuna.split('\n').filter((l) => /\| Aula \|/.test(l)));

  const todas = calendario('--criar-aula', '--aulas-prontas', '01 02 03');
  provar('um ciclo com todas as aulas criadas não tem botão nenhum',
    !/data-criar-aula/.test(todas), todas.split('\n').filter((l) => /data-criar-aula/.test(l)));
}

/* ========================================================================================== */
console.log('\nB · A PÁGINA DO PLANO — o diálogo, e o dado que ele precisa');
/* ========================================================================================== */
{
  const plano = planoDe();
  const { markdown } = derivarPlano(plano, {});
  /* AS PEÇAS SÃO AS DA FOLHA (21/11/2026). Palavras dela: «só abre o modal centralizado e
     alinhado ao que a gente já usa nos outros modais. A gente já tem isso na identidade visual,
     você precisa usar.» O diálogo era um `<dialog>` próprio, com `<style>` inventado dentro da
     página; passou a ser o `.modal` / `.modal-fundo` / `.modal-caixa` / `.modal-acoes` que a
     folha já desenha — medido em `check-identidade`. */
  provar('a página do plano traz a janela, com as peças da folha',
    /<div class="modal" id="criar-aula"/.test(markdown)
    && /class="modal-fundo"/.test(markdown) && /class="modal-caixa/.test(markdown)
    && /class="modal-acoes"/.test(markdown) && /class="modal-x"/.test(markdown),
    (/<div class="modal[^>]*>/.exec(markdown) || [])[0]);
  provar('…e nenhuma peça inventada (nada de `<style>` nem de classe fora da folha)',
    !/<style/.test(markdown) && !/class="fraco"/.test(markdown));
  provar('…com o «Cancelar» à DIREITA do botão de criar (a ordem do padrão)',
    markdown.indexOf('criar-aula-guardar') < markdown.indexOf('criar-aula-cancelar'));
  /* «CRIAR», E SÓ (21/11/2026) — «Confuso esses dois nomes para um usuário comum que não é de
     tecnologia. Então coloca apenas criar aula, o botão se chama criar, só isso.» */
  provar('o botão diz «Criar», e não «Criar e gerar»',
    /id="criar-aula-guardar">Criar</.test(markdown) && !/Criar e gerar/.test(markdown),
    (/id="criar-aula-guardar">([^<]*)/.exec(markdown) || [])[1]);
  provar('…e o campo do objetivo', /id="criar-aula-marco"/.test(markdown));

  /* O VÉU E O «FECHAR» (21/11/2026). «E aí eu senti falta do véu. Aí no véu você pode colocar
     criar aula, gerar aula, enfim, o texto do processo que está acontecendo.» E: «não dá para ser
     cancelar porque parece que vai cancelar o processo. Então muda para fechar.» O véu é o da
     casa (`LastroDaOperacao`, montado pelo `nav.js` em todas as páginas), e não um segundo. */
  provar('o guionista acende o véu da casa enquanto grava',
    /LastroDaOperacao/.test(markdown) && /op\.ocupar\(/.test(markdown));
  provar('…e diz o processo no véu, e não só «a gravar…»',
    /A criar a aula " \+ alvo/.test(markdown));
  provar('…o «Cancelar» vira «Fechar» quando o pedido parte',
    /btnCancelar\.textContent = sim \? "Fechar" : "Cancelar"/.test(markdown));
  /* A GUARDA QUE FALTAVA: a página lê o que o servidor relatou como descartado. Sem esta leitura,
     o «gravado» de 21/11/2026 voltava a ser dito sobre uma aula que não nasceu. */
  provar('…e a página CONFERE o que o servidor descartou antes de dizer «criada»',
    /idsDesconhecidos/.test(markdown) && /perdidas\.length/.test(markdown));

  const m = /<script type="application\/json" id="dados-criar-aula">([\s\S]*?)<\/script>/.exec(markdown);
  let dados = null;
  try { dados = JSON.parse(m[1]); } catch { dados = null; }
  provar('o dado do diálogo está na página e é JSON válido', Boolean(dados), m && m[1].slice(0, 80));
  provar('…com o carimbo do plano (sem ele não há elo a criar)', Boolean(dados && dados.id), dados && dados.id);
  provar('…com o repertório da turma', Boolean(dados && (dados.repertorio || []).length === 3), dados && dados.repertorio);
  provar('…com os marcos que o plano já declara',
    Boolean(dados && (dados.marcos || []).length >= 1), dados && dados.marcos);
  provar('…com os blocos da aula', Boolean(dados && (dados.blocos || [])[0] === 'Barra'), dados && dados.blocos);
  provar('…e o contexto que a gravação precisa (professor, ciclo, escola, turma)',
    Boolean(dados && dados.professor === 'p' && dados.ciclo === '01'
      && dados.escola === 'x' && dados.turma === 'sala rosa'), dados);

  const semRepertorio = planoDe({ 'repertorio': resp([]) });
  const semDados = JSON.parse(/<script type="application\/json" id="dados-criar-aula">([\s\S]*?)<\/script>/
    .exec(derivarPlano(semRepertorio, {}).markdown)[1]);
  provar('um ciclo sem repertório DIZ isso ao diálogo (e não mostra uma lista vazia)',
    semDados.temRepertorio === false, semDados.temRepertorio);
}

/* ========================================================================================== */
console.log('\nB2 · A AULA ATRAVESSA A GRAVAÇÃO — o defeito de 21/11/2026, medido');
/* ========================================================================================== */
/* O QUE ACONTECEU, e é o pior modo de falhar deste sistema: ela clicou em «Criar e gerar»,
 * apareceu «gravado. A aula 02 está a ser gerada», e a aula 02 NUNCA EXISTIU.
 *
 * A CAUSA, medida no envelope `plano-20261121-0933`: a elicitação guarda as respostas cujo `id` o
 * CONTEÚDO declara (`prepararRespostas`), e o conteúdo do plano declara UMA aula — o bloco «A
 * Aula 1», com `aula-1-parametro` e `aula-1-sequencia`. `aula-2-parametro` e `aula-2-sequencia`
 * chegavam, não estavam na lista, e eram DESCARTADAS em silêncio. O envelope ficou com
 * `aula-de-cada-objetivo` a apontar o objetivo 2 e sem a sequência da aula — e sem
 * `aula-2-sequencia` a regra diz que a aula não existe, o `DOCS` não cresce, o gerador não a
 * escreve e a lista de Aulas não a mostra.
 *
 * ESTA SECÇÃO É A QUE FALTAVA: as outras provavam a coluna, a regra e o escritor, cada uma com as
 * respostas já no envelope. Nenhuma atravessava a GRAVAÇÃO — que é onde a resposta se perdia. */
{
  const CONTEUDO = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'porta/plano/conteudo/plano.json'), 'utf8'));
  const ESQUEMA = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'porta/envelope/elicitacao-schema.json'), 'utf8'));
  const comAula2 = (extras) => planoDe(Object.assign({
    'contexto-total-aulas': resp('15'),
    'aula-2-parametro': resp([{ marco: 2, marcados: ['Plié'] }]),
    'aula-2-sequencia': resp([{ Bloco: 'Barra', 'Objetivo específico': '2 — o marco',
      'Conteúdo do nível': 'Plié', Tempos: '', Compasso: '' }]),
  }, extras || {}));
  const gravar = (plano) => nucleo.elicitar(CONTEUDO, plano.respostas,
    { id: plano.id, geradoEm: '2026-11-21T09:00', esquema: ESQUEMA });

  const saida = gravar(comAula2());
  provar('a resposta da aula 02 ATRAVESSA a elicitação (era aqui que ela morria)',
    Boolean(saida.documento.respostas['aula-2-sequencia'])
    && Boolean(saida.documento.respostas['aula-2-parametro']),
    Object.keys(saida.documento.respostas).filter((k) => /^aula-/.test(k)));
  provar('…e nada é relatado como desconhecido',
    saida.relatorio.idsDesconhecidos.length === 0, saida.relatorio.idsDesconhecidos);
  provar('…e o plano gravado declara as duas aulas',
    aulasDeclaradasPeloPlano(saida.documento).join(',') === '01,02',
    aulasDeclaradasPeloPlano(saida.documento));

  /* A FAMÍLIA É DECLARADA, O NÚMERO É DADO — e a leitura de volta prova-o nas três formas. */
  provar('a família é lida de volta: `aula-2-sequencia` → 2/sequencia',
    JSON.stringify(lerChaveDaAula('aula-2-sequencia')) === JSON.stringify({ numero: 2, campo: 'sequencia' }));
  provar('…a forma com zero à frente também', Boolean(lerChaveDaAula('aula-02-parametro')));
  provar('…e o que NÃO é da família continua de fora',
    lerChaveDaAula('marcos-por-aula') === null && lerChaveDaAula('aula-2-inventado') === null
    && lerChaveDaAula('aula-x-sequencia') === null);

  /* O TECTO: a família não é um passe livre. Uma aula que o ciclo não declara continua a ser um
   * id desconhecido — e continua a ser RELATADA, que é o que impede o silêncio de voltar. */
  const foraDoCiclo = gravar(comAula2({ 'aula-99-sequencia': resp([{ Bloco: 'Barra' }]) }));
  provar('uma aula ACIMA do total do ciclo não entra, e é relatada',
    !foraDoCiclo.documento.respostas['aula-99-sequencia']
    && foraDoCiclo.relatorio.idsDesconhecidos.indexOf('aula-99-sequencia') !== -1,
    foraDoCiclo.relatorio.idsDesconhecidos);

  /* A MUTAÇÃO — o estado de ontem: sem a família, a resposta é descartada e a aula não existe. É
   * esta a queda que se exige, e é ela que diz que a prova mede o defeito e não a si mesma. */
  const conteudoFechado = Object.assign({}, CONTEUDO, { documento: 'outro' });
  const deOntem = nucleo.elicitar(conteudoFechado, comAula2().respostas,
    { id: 'plano-de-ontem', geradoEm: '2026-11-21T09:00', esquema: ESQUEMA });
  provar('MUTAÇÃO: sem a família da aula, a resposta cai e a aula 02 deixa de existir',
    !deOntem.documento.respostas['aula-2-sequencia']
    && aulasDeclaradasPeloPlano(deOntem.documento).join(',') === '01'
    && deOntem.relatorio.idsDesconhecidos.indexOf('aula-2-sequencia') !== -1,
    deOntem.relatorio.idsDesconhecidos);
}

/* ========================================================================================== */
console.log('\nC · A REGRA — a aula existe quando o plano declara a sequência dela');
/* ========================================================================================== */
{
  provar('o plano de uma aula só declara a 01',
    aulasDeclaradasPeloPlano(planoDe()).join(',') === '01', aulasDeclaradasPeloPlano(planoDe()));

  const comAula2 = planoDe({
    'aula-2-sequencia': resp([{ Bloco: 'Barra', 'Conteúdo do nível': 'Relevé' }]),
  });
  provar('com `aula-2-sequencia`, o plano declara a 01 e a 02',
    aulasDeclaradasPeloPlano(comAula2).join(',') === '01,02', aulasDeclaradasPeloPlano(comAula2));

  const vazia = planoDe({ 'aula-2-sequencia': resp([]) });
  provar('uma sequência VAZIA não cria aula (um campo limpo não é uma aula)',
    aulasDeclaradasPeloPlano(vazia).join(',') === '01', aulasDeclaradasPeloPlano(vazia));

  const comZero = planoDe({ 'aula-02-sequencia': resp([{ Bloco: 'Barra' }]) });
  provar('a forma com zero à frente é lida (a leitura é generosa, a escrita é que tem uma forma)',
    aulasDeclaradasPeloPlano(comZero).join(',') === '01,02', aulasDeclaradasPeloPlano(comZero));

  provar('o número sai em dois dígitos de `numeroDaAula`', numeroDaAula('2') === '02');
}

/* ========================================================================================== */
console.log('\nD · O ESCRITOR — o ciclo ganha a aula, e a 01 não se perde');
/* ========================================================================================== */

const CONF = [
  'CICLO="01"', 'ESCOLA="x"', 'NOME="Ciclo"', 'DURACOES="60"',
  'VOLUME_MIN="30"', 'VOLUME_MAX="50"',
  'DOCS="plano harmonizacao aula-01 captura-aula-01 referencias"',
  'DIAS="segunda 18:00"',
].join('\n') + '\n';
const SCHEMA = JSON.stringify({ _declaracao: { porVariante: {} } }, null, 2);

function githubFalso(inicial) {
  const arquivos = Object.assign({}, inicial || {});
  const f = async (url, init) => {
    const metodo = (init && init.method) || 'GET';
    const u = String(url);
    const corpo = init && init.body ? JSON.parse(init.body) : null;
    if (metodo === 'GET' && /\/contents\//.test(u)) {
      const caminho = decodeURIComponent(u.split('/contents/')[1].split('?')[0]);
      if (/\.conf$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's1', content: Buffer.from(CONF).toString('base64') }) };
      }
      if (/captura-schema\.json$/.test(caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 's2', content: Buffer.from(SCHEMA).toString('base64') }) };
      }
      if (Object.prototype.hasOwnProperty.call(arquivos, caminho)) {
        return { status: 200, ok: true, json: async () => ({ sha: 'x' + caminho, content: Buffer.from(arquivos[caminho]).toString('base64') }) };
      }
      return { status: 404, ok: false, json: async () => ({}) };
    }
    if (metodo === 'GET' && /\/git\/ref\/heads\//.test(u)) return { status: 200, ok: true, json: async () => ({ object: { sha: 'c0' } }) };
    if (metodo === 'GET' && /\/git\/commits\//.test(u)) return { status: 200, ok: true, json: async () => ({ tree: { sha: 't0' } }) };
    if (metodo === 'POST' && /\/git\/trees$/.test(u)) {
      arquivos.__tree = {};
      for (const t of corpo.tree || []) arquivos.__tree[t.path] = t.content !== undefined ? String(t.content) : null;
      return { status: 201, ok: true, json: async () => ({ sha: 't1' }) };
    }
    if (metodo === 'POST' && /\/git\/commits$/.test(u)) return { status: 201, ok: true, json: async () => ({ sha: 'c1' }) };
    if (metodo === 'PATCH' && /\/git\/refs\/heads\//.test(u)) {
      Object.assign(arquivos, arquivos.__tree || {}); delete arquivos.__tree;
      return { status: 200, ok: true, json: async () => ({}) };
    }
    return { status: 200, ok: true, json: async () => ({}) };
  };
  return { fetch: f, arquivos };
}

const CTX = { escola: 'x', professor: 'p', ciclo: '01', turma: 'sala-rosa', variante: 'x-sala-rosa' };
const BASE = 'professores/p/ciclos';
const PO = {
  id: 'po-1', ciclo: '01', escola: 'x',
  contexto: CTX,
  respostas: { question: resp('q'), 'o-que-fica-de-fora': resp('o allegro'),
    sujeitos: resp(['Aluna A']), 'itens-por-dimensao': resp({ Barra: ['o apoio'] }) },
};

(async () => {
  {
    const plano = planoDe({
      'aula-2-sequencia': resp([{ Bloco: 'Barra', 'Objetivo específico': '2 — transferir o peso',
        'Conteúdo do nível': 'Relevé', Tempos: '8', Compasso: '2/4' }]),
      'aula-2-parametro': resp([{ marco: 2, marcados: ['Relevé'] }]),
      'marcos-por-aula': resp([MARCO_1, 'transferir o peso entre os pés']),
    });
    const gh = githubFalso();
    const escrever = criarEscritorDeCiclo({
      token: 'gh', dono: 'tmenegaz', repo: 'danca', ref: 'main', senhaCripto: 'segredo', fetchImpl: gh.fetch,
    });
    const r = await escrever({ plano, po: PO, contexto: CTX,
      calibracao: { duracaoMinutos: 60, volumeMin: 30, volumeMax: 50 } });

    const conf = gh.arquivos[BASE + '/ciclo-01-x-sala-rosa.conf'] || '';
    const docs = (/^DOCS="([^"]*)"/m.exec(conf) || [, ''])[1].split(/\s+/).filter(Boolean);
    provar('o `DOCS` ganhou `aula-02`', docs.indexOf('aula-02') !== -1, docs);
    provar('…e a folha dela, `captura-aula-02`', docs.indexOf('captura-aula-02') !== -1, docs);
    provar('…e a Aula 01 continua declarada (a lista só cresce)',
      docs.indexOf('aula-01') !== -1 && docs.indexOf('captura-aula-01') !== -1, docs);
    provar('o `-aula-02.md` foi escrito', (r.escritas || []).some((e) => /-aula-02\.md$/.test(e.caminho)),
      (r.escritas || []).map((e) => e.caminho));
    const aula2 = gh.arquivos[BASE + '/ciclo-01-x-sala-rosa-aula-02.md'] || '';
    provar('…e é a Aula 02, com o marco dela', /^aula: "02"$/m.test(aula2)
      && /transferir o peso/.test(aula2), aula2.slice(0, 200));
    provar('…e a `-captura-aula-02.md` também', (r.escritas || []).some((e) => /-captura-aula-02\.md$/.test(e.caminho)),
      (r.escritas || []).map((e) => e.caminho));
    provar('a Aula 01 também foi escrita (o ciclo continua inteiro)',
      (r.escritas || []).some((e) => /-aula-01\.md$/.test(e.caminho)),
      (r.escritas || []).map((e) => e.caminho));
  }

  /* ======================================================================================== */
  console.log('\nE · A TABELA DOS OBJETIVOS — «Aula 02» vira ligação quando o documento existe');
  /* ======================================================================================== */
  {
    const planoExtraido = {
      marcosPorAula: [
        { n: '01', objetivos: '01', marco: MARCO_1 },
        { n: '02', objetivos: '02', marco: 'transferir o peso entre os pés' },
      ],
      objetivosEspecificos: [
        { n: '01', objetivo: MARCO_1, blocos: 'Barra' },
        { n: '02', objetivo: 'transferir o peso entre os pés', blocos: 'Barra' },
      ],
    };
    const semAula2 = tabelaObjetivos.tabela(planoExtraido, ['aula-01']).join('\n');
    const semIndice = tabelaObjetivos.tabela(planoExtraido, ['aula-01', 'aula-02']).join('\n');
    /* O EXERCÍCIO DA AULA 02 — o que faz a célula nomear algo e ligar a ele. */
    const indice2 = new Map([['02', [{ bloco: 'Barra', exercicio: 'Plié', objetivo: 2,
      id: 'barra-plie-ob2' }]]]);
    const comAula2 = tabelaObjetivos.tabela(planoExtraido, ['aula-01', 'aula-02'], indice2).join('\n');

    provar('sem o documento, a Aula 02 diz «a criar na Aula 02»',
      /a criar na Aula 02/.test(semAula2), semAula2);
    provar('com o documento e o exercício em mãos, a célula nomeia o exercício e liga a ele',
      /\[Plié\]\(aula-02\.html#barra-plie-ob2\)/.test(comAula2),
      comAula2.split('\n').filter((l) => /\*\*02\*\*/.test(l)));
    provar('…e o documento sozinho não inventa exercício: sem índice, a célula diz «—»',
      /\| — \|$/.test(semIndice.split('\n').filter((l) => /\*\*02\*\*/.test(l))[0] || ''),
      semIndice.split('\n').filter((l) => /\*\*02\*\*/.test(l)));
  }

  /* ======================================================================================== */
  console.log('\nF · NUM CHROME — o botão abre a caixa, com o marco e a data da linha');
  /* ======================================================================================== */
  {
    const CHROME = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
      .find((c) => fs.existsSync(c));
    if (!CHROME) {
      console.log('  (sem Chrome nesta máquina — esta secção não corre, e não se declara passada)');
    } else {
      /* A PÁGINA É SERVIDA POR UM PROCESSO À PARTE, e não pelo `http.createServer` desta prova:
       * `execFileSync` bloqueia o ciclo de eventos, e um servidor no mesmo processo nunca
       * responde — a prova ficaria pendurada à espera de si mesma. Foi assim que se descobriu. */
      const PASTA = path.join(RAIZ, 'professores/demi-plie/ciclos/ciclo-01-breu-rosa');
      const porta = 8793;
      const servidor = require('node:child_process').spawn('python3',
        ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'], { cwd: PASTA, stdio: 'ignore' });
      try {
        require('node:child_process').execFileSync('sleep', ['2']);
        /* A AULA DA PROVA É A PRIMEIRA QUE AINDA NÃO EXISTE (21/11/2026). Estava presa à `02`, e
         * a `02` passou a existir de facto — o pacote publica `aula-02.html` e a coluna «Ação»
         * oferece-lhe «Abrir», não «Criar». Uma prova presa a um número mede o dia em que foi
         * escrita, não o mecanismo: o número passa a ser LIDO da página, e o que se exige é o que
         * a linha da tabela declara para ele. */
        const pagina = path.join(PASTA, 'plano.html');
        const html = fs.readFileSync(pagina, 'utf8');
        const alvo = (/data-criar-aula="(\d+)"/.exec(html) || [])[1];
        provar('a página tem ao menos uma aula por criar (senão esta secção não mede nada)',
          Boolean(alvo), alvo);
        const dom = execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
          '--no-first-run', '--disable-dev-shm-usage', '--virtual-time-budget=3000', '--dump-dom',
          'http://127.0.0.1:' + porta + '/plano.html?criar-aula=' + alvo],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000 });

        /* ABERTO É `hidden` FORA: a janela é um `.modal` que nasce escondido (`hidden`) e o
           script o tira. Procurar `open` era a marca do `<dialog>` que já não existe. */
        const janela = /<div class="modal" id="criar-aula"[^>]*>/.exec(dom);
        provar('a janela ABRE com `?criar-aula=' + alvo + '` (o botão não é uma promessa)',
          Boolean(janela) && !/\shidden(\s|>)/.test(janela[0]), janela && janela[0]);
        provar('…e o título diz a aula que se está a criar',
          new RegExp('<h2 id="criar-aula-titulo">Criar a aula ' + alvo + '</h2>').test(dom),
          (/id="criar-aula-titulo">([^<]*)/.exec(dom) || [])[1]);
        provar('…com o marco da aula já preenchido (o plano já o declara)',
          /transferir o peso entre os pés sem perder o alinhamento/.test(dom)
          || /sustentar a transferência com musicalidade/.test(dom));
        /* A DATA NÃO É COPIADA PARA O BOTÃO — é LIDA da linha. Esta asserção compara o que a
         * caixa diz com o que a PRÓPRIA linha da tabela declara, em vez de fixar um dia: um
         * `16/12/2026` escrito à mão passaria a medir o calendário do dia em que foi escrito. */
        const linhaDoAlvo = new RegExp('<tr[^>]*>\\s*<td[^>]*>' + alvo + '[\\s\\S]{0,900}?</tr>')
          .exec(html);
        const celulas = linhaDoAlvo
          ? [...linhaDoAlvo[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
            .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
          : [];
        const naCaixa = (/id="criar-aula-quando">([^<]*)/.exec(dom) || [])[1] || '';
        provar('…e a data, o dia e a duração da LINHA do calendário, na caixa',
          celulas.length >= 4 && celulas.slice(1, 4).every((c) => naCaixa.indexOf(c) !== -1
            || (/\d{2}\/\d{2}\/\d{4}/.test(c) && new RegExp(c).test(naCaixa))),
          { linha: celulas.slice(0, 4), naCaixa });
        provar('…e os exercícios do repertório e os blocos da aula, para marcar',
          (dom.match(/id="criar-aula-exercicios-\d+"/g) || []).length === 4
          && (dom.match(/id="criar-aula-blocos-\d+"/g) || []).length === 4,
          [(dom.match(/id="criar-aula-exercicios-\d+"/g) || []).length,
            (dom.match(/id="criar-aula-blocos-\d+"/g) || []).length]);
        provar('…e o botão de guardar começa habilitado (há repertório)',
          !/id="criar-aula-guardar"[^>]*disabled/.test(dom));
      } finally {
        try { servidor.kill('SIGKILL'); } catch { /* já morreu */ }
      }
    }
  }

  console.log('\n' + (total - falhas) + '/' + total + ' asserções'
    + (falhas ? ' — ' + falhas + ' FALHA(S)' : ' — verde'));
  process.exit(falhas ? 1 : 0);
})();
