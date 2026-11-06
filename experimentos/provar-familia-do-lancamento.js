#!/usr/bin/env node
'use strict';

/*
 * provar-familia-do-lancamento.js — o lançamento da aula grava na FONTE, e a fonte é o que se lê.
 *
 * O DEFEITO (06/11/2026, no celular da pesquisadora). Ela preencheu o lançamento da aula, a tela
 * disse «aula lançada» — e ao recarregar não havia aula nenhuma, nem caderno. O dado não se
 * perdeu: estava no KV, com o carimbo certo. O que faltava era QUEM O LESSE.
 *
 * A causa, e ela é de uma linha: o armazenamento composto (`motor/servidor/acervo-envelopes.js`,
 * `combinar`) roteia a escrita pela FAMÍLIA da chave. `envelope/` foi para o repositório em
 * 20/10/2026; a chave do lançamento não tinha família, caiu no «resto» (o KV) — e o KV não é lido
 * por nada neste sistema. Tudo o que se mostra deriva do repositório: o pacote, o índice de aulas,
 * o caderno, o relatório. A aula existia num sítio que ninguém consulta.
 *
 * O QUE ESTA PROVA FIXA — e as três partes que a tornam uma prova, e não uma leitura de código:
 *
 *   A. A CHAVE TEM FAMÍLIA. `raizDaChave()` devolve `lancamento/…`, e o composto entrega essa
 *      família ao adaptador do repositório — não ao KV. Mede-se pela composição real
 *      (`combinar`), com um KV de mentira que REGISTA o que lhe tentam escrever.
 *   B. O DESTINO É O `-dados.json` CANÓNICO — o arquivo que `fonte_dados()` de
 *      `tools/lib-fontes.sh` resolve, e que `ler_lancadas()` do `gerar-ciclo.sh` lê para derivar
 *      o estado da aula. Não um envelope por carimbo, não uma chave de KV: a fonte.
 *   C. A FUSÃO PRESERVA AS OUTRAS AULAS. O cliente envia o ficheiro INTEIRO montado a partir do
 *      que leu; sem fusão, um separador aberto há dias apagaria as aulas lançadas desde então.
 *   D. O CONTROL NEGATIVO. A chave SEM a família (a de antes) é entregue ao KV — é o defeito, a
 *      correr. Sem isto, a prova passaria a aprovar qualquer coisa.
 *   E. O `depois` NÃO DERRUBA O LANÇAMENTO, e o que ele faz é DISPARAR a geração: a fonte certa
 *      com o site a mostrar a versão anterior é o mesmo sintoma, uma camada abaixo.
 *   F. O MESMO CARIMBO DUAS VEZES é o mesmo acto — não se escreve de novo.
 *   G. O DISPARO LEVA A VARIANTE, não a escola: o contexto do lançamento não tem `turma`, e a
 *      variante vem inteira no nome do ficheiro. É o rótulo da execução que a tela procura.
 *
 *   node experimentos/provar-familia-do-lancamento.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const lanc = require(path.join(RAIZ, 'motor/servidor/acervo-lancamentos.js'));
const acervo = require(path.join(RAIZ, 'motor/servidor/acervo-envelopes.js'));
const chaves = require(path.join(RAIZ, 'motor/nucleo/chaves.js'));
const { lancar } = require(path.join(RAIZ, 'motor/nucleo/lancamento.js'));

let passou = 0;
const falhas = [];
function provar(rotulo, condicao, detalhe) {
  if (condicao) { console.log('  ok    ' + rotulo); passou += 1; return; }
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  falhas.push(rotulo);
}

/** Um GitHub de mentira: guarda os ficheiros por caminho e serve o `sha` como a API serve. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial || {}));
  const pedidos = [];
  const fetchImpl = async (url, opcoes) => {
    const metodo = (opcoes && opcoes.method) || 'GET';
    const caminho = url.replace('https://api.github.com/repos/tmenegaz/danca/contents/', '')
      .replace(/\?ref=.*$/, '');
    pedidos.push({ metodo, caminho, corpo: opcoes && opcoes.body });
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return { status: 404, ok: false, json: async () => null, text: async () => 'não encontrado' };
      const texto = arquivos.get(caminho);
      return {
        status: 200, ok: true,
        json: async () => ({ content: Buffer.from(texto, 'utf8').toString('base64'), sha: 'sha-' + caminho }),
        text: async () => texto,
      };
    }
    const corpo = JSON.parse(opcoes.body);
    arquivos.set(caminho, Buffer.from(corpo.content, 'base64').toString('utf8'));
    return {
      status: 201, ok: true,
      json: async () => ({ commit: { sha: 'commit-' + arquivos.size } }),
      text: async () => '',
    };
  };
  return { arquivos, pedidos, fetchImpl };
}

/** Um KV de mentira que REGISTA o que lhe tentam escrever — é assim que se vê o desvio. */
function kvFalso() {
  const escritas = [];
  return {
    escritas,
    async get() { return null; },
    async put(chave, valor) { escritas.push({ chave, valor }); },
    async delete() {},
    async listar() { return []; },
    async existe() { return false; },
    async guardar(chave, valor) { escritas.push({ chave, valor }); return { ok: true }; },
  };
}

const DADOS_ANTES = {
  ciclo: '01', escola: 'calango', professor: 'rabo-gramde',
  po: 'po-20261106-1108',
  apelidos: { aluna_a: 'Aluna A', aluna_b: 'Aluna B' },
  aulas: { '03': { n: '03', presentes: ['aluna_a'], ultimo_lancamento: '2026-11-06T1000' } },
};
const AULA_NOVA = { n: '06', presentes: ['aluna_a', 'aluna_b'], ausentes: [], ultimo_lancamento: '2026-11-06T1537' };
const DADOS_DEPOIS = Object.assign({}, DADOS_ANTES, {
  aulas: Object.assign({}, DADOS_ANTES.aulas, { '06': AULA_NOVA }),
});

const NOME = 'ciclo-01-calango-bale-nivel-1-teste-1-dados-2026-11-06T1537.json';
const VALOR_DADOS = 'professores/rabo-gramde/ciclos/ciclo-01-calango-bale-nivel-1-teste-1-dados.json';

async function main() {
  // -------------------------------------------------------------------------------------------
  console.log('\nA. A chave do lançamento tem família — e a família decide o destino');
  {
    const raiz = chaves.raizDaChave('calango', 'rabo-gramde');
    provar('`raizDaChave` devolve a família `lancamento/`', raiz.startsWith('lancamento/'), raiz);

    const kv = kvFalso();
    const gh = githubFalso({ [VALOR_DADOS]: JSON.stringify(DADOS_ANTES) });
    const lancamentos = lanc.criarAcervoDeLancamentos({ token: 'x', fetchImpl: gh.fetchImpl });
    const composto = acervo.combinar({ guardar: async () => ({ ok: true }) }, kv, { 'lancamento/': lancamentos });

    const chave = raiz + '/01-2026-11-06T1537/' + NOME;
    await composto.guardar(chave, JSON.stringify(DADOS_DEPOIS, null, 2) + '\n');

    provar('…e o composto NÃO manda o lançamento para o KV',
      kv.escritas.length === 0, kv.escritas.map((e) => e.chave));
    provar('…e o escreve no repositório, no caminho da fonte',
      gh.arquivos.has(VALOR_DADOS) && gh.pedidos.some((p) => p.metodo === 'PUT'),
      [...gh.arquivos.keys()]);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nB. O destino é o `-dados.json` canónico — o que a geração lê');
  {
    const partes = lanc.partesDaChave('lancamento/calango/rabo-gramde/01-2026-11-06T1537/' + NOME);
    provar('as partes da chave saem da própria chave, sem tabela',
      partes && partes.professor === 'rabo-gramde' && partes.ciclo === '01', partes);
    const caminho = lanc.caminhoDoDados(partes);
    provar('…e o caminho é `professores/<prof>/ciclos/ciclo-NN-<variante>-dados.json`',
      caminho === VALOR_DADOS, caminho);
    /* A ASSERÇÃO QUE IMPORTA: o caminho gravado é o que `fonte_dados()` resolve. A convenção é
     * lida do próprio `lib-fontes.sh` — não repetida aqui à mão, que é como duas convenções
     * divergem sem ninguém dar por isso. */
    const lib = fs.readFileSync(path.join(RAIZ, 'tools/lib-fontes.sh'), 'utf8');
    provar('…e a convenção é a do `fonte_dados()`, lida do ficheiro',
      /ciclo-\$CICLO-\$\{VARIANTE:-\}-dados\.json/.test(lib), lib.match(/ciclo-\$CICLO[^\n]*/));
    provar('…e NÃO é um envelope, nem uma cópia por carimbo',
      !/-dados-2026-/.test(caminho) && !/envelopes/.test(caminho), caminho);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nC. A fusão preserva as outras aulas — o separador velho não apaga o que veio depois');
  {
    const fundido = lanc.fundirAulas(DADOS_ANTES, { aulas: { '06': AULA_NOVA } });
    provar('a aula que CHEGA entra', fundido.aulas['06'] && fundido.aulas['06'].n === '06');
    provar('…e a que já estava NÃO desaparece', Boolean(fundido.aulas['03']),
      Object.keys(fundido.aulas));
    provar('…e o resto da raiz vem da fonte que chega (o `po`, os apelidos)',
      fundido.po === DADOS_ANTES.po && fundido.apelidos.aluna_a === 'Aluna A', fundido.po);

    /* A contraprova da fusão: sem ela, o que se gravava era só o que o cliente mandou. */
    const semFusao = JSON.parse(JSON.stringify({ aulas: { '06': AULA_NOVA } }));
    provar('…e SEM a fusão a aula 03 perder-se-ia — é o defeito que ela evita',
      Object.keys(semFusao.aulas).length === 1 && !semFusao.aulas['03'],
      Object.keys(semFusao.aulas));
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nD. O controlo negativo: a chave SEM família é entregue ao KV — o defeito, a correr');
  {
    const kv = kvFalso();
    const gh = githubFalso({});
    const lancamentos = lanc.criarAcervoDeLancamentos({ token: 'x', fetchImpl: gh.fetchImpl });
    const composto = acervo.combinar({ guardar: async () => ({ ok: true }) }, kv, { 'lancamento/': lancamentos });
    const chaveAntiga = 'calango/rabo-gramde/01-2026-11-06T1537/' + NOME;
    await composto.guardar(chaveAntiga, '{}');
    provar('a chave de ANTES vai para o KV', kv.escritas.length === 1, kv.escritas.map((e) => e.chave));
    provar('…e o repositório não a recebe — é o defeito de 06/11/2026',
      gh.arquivos.size === 0, [...gh.arquivos.keys()]);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nE. O lançamento inteiro: grava na fonte e PEDE a geração — e a falha dela não o derruba');
  {
    const kv = kvFalso();
    const gh = githubFalso({ [VALOR_DADOS]: JSON.stringify(DADOS_ANTES) });
    const lancamentos = lanc.criarAcervoDeLancamentos({ token: 'x', fetchImpl: gh.fetchImpl });
    const composto = acervo.combinar({ guardar: async () => ({ ok: true }) }, kv, { 'lancamento/': lancamentos });

    let contextoDoDisparo = null;
    const corpo = {
      ciclo: '01',
      senha: 'a-senha',
      arquivos: [
        { nome: NOME, texto: JSON.stringify(DADOS_DEPOIS, null, 2) + '\n', tipo: 'application/json' },
        { nome: 'ciclos.json', texto: JSON.stringify({ ciclos: [{ id: '01', professor: 'rabo-gramde', escola: 'calango' }] }), tipo: 'application/json' },
      ],
    };
    const r = await lancar(composto, corpo, {
      autorizar: async (s) => s === 'a-senha',
      depois: async (feito) => { contextoDoDisparo = feito; return { disparo: { ok: true } }; },
    });

    provar('o lançamento devolve ok', r.ok === true, r);
    provar('…e a FONTE no repositório tem as duas aulas',
      JSON.parse(gh.arquivos.get(VALOR_DADOS)).aulas['03'] !== undefined
        && JSON.parse(gh.arquivos.get(VALOR_DADOS)).aulas['06'] !== undefined,
      Object.keys(JSON.parse(gh.arquivos.get(VALOR_DADOS)).aulas));
    provar('…e nada foi escrito no KV', kv.escritas.length === 0, kv.escritas.map((e) => e.chave));
    provar('o `depois` recebe a VARIANTE — sem ela o disparo não sabe que pacote gerar',
      contextoDoDisparo && contextoDoDisparo.variante === 'calango-bale-nivel-1-teste-1',
      contextoDoDisparo && contextoDoDisparo.variante);
    provar('…e o resultado diz que o disparo foi pedido',
      r.depois && r.depois.disparo && r.depois.disparo.ok === true, r.depois);

    /* A GRAVAÇÃO NÃO DEPENDE DO DISPARO. Se a geração falhar, o lançamento está gravado e a
     * resposta diz o que falta — o contrário faria o professor reenviar uma aula já gravada. */
    const gh2 = githubFalso({ [VALOR_DADOS]: JSON.stringify(DADOS_ANTES) });
    const composto2 = acervo.combinar({ guardar: async () => ({ ok: true }) }, kvFalso(),
      { 'lancamento/': lanc.criarAcervoDeLancamentos({ token: 'x', fetchImpl: gh2.fetchImpl }) });
    const r2 = await lancar(composto2, corpo, {
      autorizar: async () => true,
      depois: async () => { throw new Error('a API do GitHub recusou o disparo'); },
    });
    provar('…e um disparo que falha NÃO desfaz o lançamento', r2.ok === true
      && r2.depois && r2.depois.ok === false, r2.depois);
    provar('…e a fonte ficou gravada mesmo assim',
      JSON.parse(gh2.arquivos.get(VALOR_DADOS)).aulas['06'] !== undefined);

    // O ÍNDICE NÃO SE GRAVA: é gerado pelo `gerar-ciclo.sh`, e o do cliente viria de um pacote velho.
    provar('o `ciclos.json` do cliente NÃO vai para o repositório',
      ![...gh.arquivos.keys()].some((c) => c.endsWith('/ciclos.json')), [...gh.arquivos.keys()]);
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nF. O mesmo carimbo duas vezes é o mesmo acto — não se escreve de novo');
  {
    const gh = githubFalso({ [VALOR_DADOS]: JSON.stringify(DADOS_DEPOIS) });
    const lancamentos = lanc.criarAcervoDeLancamentos({ token: 'x', fetchImpl: gh.fetchImpl });
    const chave = 'lancamento/calango/rabo-gramde/01-2026-11-06T1537/' + NOME;
    const r = await lancamentos.guardar(chave, JSON.stringify(DADOS_DEPOIS, null, 2) + '\n');
    provar('a segunda gravação do mesmo carimbo não escreve', r.semMudanca === true, r);
    provar('…e nenhum PUT foi feito', !gh.pedidos.some((p) => p.metodo === 'PUT'),
      gh.pedidos.map((p) => p.metodo));
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nG. O disparo leva a VARIANTE — não a escola — e o rótulo da execução bate');
  {
    /* A SEGUNDA METADE DO DEFEITO. Gravar na fonte é metade; a outra é a GERAÇÃO saber que
     * pacote regenerar. O contexto do lançamento não tem `turma` (ela não viaja no corpo), e
     * `varianteDoContexto` compunha só com escola+turma — devolvia `calango`. O disparo pedia o
     * `.conf`-esqueleto da escola (`DOCS=""`), a geração morria, e o site continuava a mostrar a
     * aula por lançar. A variante vem inteira no NOME do arquivo: ela tem de vencer. */
    const { dispararGeracao } = require(path.join(RAIZ, 'motor/servidor/disparar.js'));
    const { varianteDoContexto } = require(path.join(RAIZ, 'motor/servidor/escrever-po.js'));
    const { rotuloDaGeracao } = require(path.join(RAIZ, 'motor/servidor/geracao.js'));

    const contexto = {
      professor: 'rabo-gramde', ciclo: '01', escola: 'calango',
      variante: 'calango-bale-nivel-1-teste-1',
    };
    provar('a variante DECLARADA vence a composição — o lançamento não traz turma',
      varianteDoContexto(contexto) === 'calango-bale-nivel-1-teste-1', varianteDoContexto(contexto));
    provar('…e sem variante nem turma, a composição volta a ser só a escola (o modelo antigo)',
      varianteDoContexto({ escola: 'calango' }) === 'calango', varianteDoContexto({ escola: 'calango' }));

    let corpoDoDisparo = null;
    const resposta = await dispararGeracao({
      token: 'x', dono: 'tmenegaz', repo: 'danca', workflow: 'gerar-ciclo.yml',
      professor: contexto.professor, ciclo: contexto.ciclo, escola: contexto.escola,
      variante: varianteDoContexto(contexto),
      fetchImpl: async (url, opcoes) => {
        corpoDoDisparo = JSON.parse(opcoes.body);
        return { status: 204, ok: true };
      },
    });
    provar('o disparo é aceite', resposta.ok === true && resposta.status === 204, resposta);
    provar('…e o input `escola` é o Worker (o que tem `wrangler.<escola>.jsonc`)',
      corpoDoDisparo && corpoDoDisparo.inputs.escola === 'calango',
      corpoDoDisparo && corpoDoDisparo.inputs);
    provar('…e o input `variante` é o `.conf`/pacote — o que a geração vai ler',
      corpoDoDisparo && corpoDoDisparo.inputs.variante === 'calango-bale-nivel-1-teste-1',
      corpoDoDisparo && corpoDoDisparo.inputs);
    /* O RÓTULO é a chave pelo qual a tela acha a execução: `geracao.estado()` e o `run-name`
     * do workflow têm de dizer o mesmo texto. Com a variante certa, dizem. */
    provar('…e o rótulo da execução é o que a tela procura',
      rotuloDaGeracao(contexto) === 'Gerar o ciclo · rabo-gramde/01/calango-bale-nivel-1-teste-1',
      rotuloDaGeracao(contexto));
  }

  // -------------------------------------------------------------------------------------------
  console.log('\nH. O resgate está LIGADO à porta — a rota chega ao acto, e não a «não disponível»');
  {
    /* PORQUE ESTA SECÇÃO EXISTE. O adaptador do resgate foi construído, a rota foi escrita — e o
     * `montarPorta` não recebia a função. A rota respondia «a consolidação não está disponível
     * neste ambiente», que é o mesmo que não existir, e o utilizador só descobriria isso ao
     * tentar resgatar o dado. Ligar um acto é parte do acto. */
    const { montarPorta } = require(path.join(RAIZ, 'motor/servidor/cloudflare.js'));
    const pedir = (responder) => responder(new Request(
      'https://calango.example/api/lancamentos/consolidar',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ senha: 'a-senha', professor: 'rabo-gramde' }),
      }));

    let pedido = null;
    const ligado = montarPorta({
      armazenamento: kvFalso(),
      conteudoTexto: '{}', esquemaTexto: '{}',
      lancamentoSeguro: { autorizar: async () => true },
      consolidarLancamentos: async (opcoes) => { pedido = opcoes; return { ok: true, total: 0, consolidados: [] }; },
      escolaDoWorker: 'calango',
    });
    const r = await pedir(ligado);
    const dados = await r.json();
    provar('a rota /api/lancamentos/consolidar chega ao acto',
      pedido && pedido.professor === 'rabo-gramde', pedido);
    provar('…e a resposta é a do acto, não «não está disponível»',
      dados && dados.ok === true && dados.total === 0, dados);

    /* A CONTRAPROVA: a MESMA porta sem o acto injetado. É o estado que estava no código, e ele
     * tem de se reconhecer pela mensagem — não pela ausência do problema. */
    const solto = montarPorta({
      armazenamento: kvFalso(),
      conteudoTexto: '{}', esquemaTexto: '{}',
      lancamentoSeguro: { autorizar: async () => true },
      escolaDoWorker: 'calango',
    });
    const r2 = await pedir(solto);
    const d2 = await r2.json();
    provar('…e sem o acto ligado a porta diz que não está disponível — o defeito, a correr',
      d2 && d2.ok === false && /não está disponível/.test(String(d2.erro)), d2);
  }

  console.log('');
  if (falhas.length) {
    console.log('FALHOU — ' + falhas.length + ' de ' + (passou + falhas.length) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + passou + ' asserções: a chave do lançamento tem família e o composto a'
    + ' entrega ao repositório, o destino é o `-dados.json` canónico que a geração lê, a fusão'
    + ' preserva as outras aulas, o `depois` pede a geração sem derrubar a gravação — com a'
    + ' VARIANTE certa no disparo, não a escola —, e a chave de antes, a do defeito, continua a'
    + ' cair no KV.');
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
