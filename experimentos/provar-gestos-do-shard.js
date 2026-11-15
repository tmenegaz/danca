#!/usr/bin/env node
'use strict';

/**
 * provar-gestos-do-shard.js — os gestos 4 a 7 do `PLANO-SHARD.md` §4, sem rede e sem modelo.
 *
 * O QUE ESTES QUATRO GESTOS ERAM, E PORQUE FICARAM PENDENTES. A bateria do shard
 * (`provar-bateria-do-shard.js`) mede dez gestos; quatro deles — anamnese, plano de ensino, PO e
 * linha de base — ficaram ditos como PENDENTES, com o motivo «passa por `POST /api/elicitar`
 * (gasta tokens e não é determinístico)».
 *
 * **Esse motivo estava errado, e é a razão de este ficheiro existir.** `POST /api/elicitar` com um
 * mapa de `respostas` NÃO chama o modelo: quem chama é `POST /api/ia`, que serve a condução (que
 * pergunta fazer a seguir). A gravação é `porta.elicitar` → `motor.elicitar`, que o próprio nó diz
 * ser «o runtime mínimo do PE» — puro, determinístico, sem `require` de nada que fale com a rede.
 * A bancada de comandos já o usava assim (`elicitar.js --respostas <caminho>`), e a cadeia
 * automática do servidor (`cadeia.js`) também: `porta.elicitar` com respostas é o caminho normal.
 *
 * MEDIDO, e não lido: a asserção 0 desta prova mede que, durante os quatro gestos inteiros,
 * nenhum pedido sai para `/api/ia` — o espião que substitui a rede falha se alguém o chamar.
 *
 * O QUE ESTE FICHEIRO NÃO SUBSTITUI. A bateria ao ar continua a ser a conferência final: ela mede
 * o roteamento por host e a árvore publicada, que só existem no ar. O que se mede aqui é o que o
 * shard põe em risco e não se vê de fora: que os quatro gestos, feitos numa escola, não toquem em
 * outra quando UM isolate serve as duas.
 *
 * AS DUAS ESCOLAS PARTILHAM A MESMA LOJA. É a condição do shard: um KV para todas. A camada de
 * armazenamento namespaça `envelope/` e `ia-registro/` com o slug (é o que
 * `motor/adaptadores/cloudflare.js` faz), e é isso que a prova usa — não uma regra inventada aqui.
 *
 *   node experimentos/provar-gestos-do-shard.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const { criarRotas } = require(path.join(RAIZ, 'motor/servidor/rotas.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

const lerConteudo = (p) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta', p), 'utf8'));

let ok = 0;
let ko = 0;
const provar = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/* ------------------------------------------------------------------ as duas escolas do shard */

const ESCOLAS = [
  { slug: 'calango', professor: 'pe-torto', turma: 'Sala Rosa', aluna: 'Aluna A' },
  { slug: 'batata', professor: 'coqui-de-redinha', turma: 'Sala Azul', aluna: 'Aluna B' },
];

/**
 * A LOJA PARTILHADA — um mapa só, e uma vista por escola que namespaça como o adaptador de
 * produção. Duas vistas sobre o mesmo backing: é literalmente o que um isolate do shard tem.
 */
function lojaDoShard() {
  const mapa = new Map();
  const vistas = {};
  const escolar = (escola, chave) => (chave.startsWith('envelope/') || chave.startsWith('ia-registro/')
    ? escola + '/' + chave : chave);
  const desescolar = (escola, chave) => (chave.startsWith(escola + '/envelope/')
    ? chave.slice(escola.length + 1)
    : (chave.startsWith(escola + '/ia-registro/') ? chave.slice(escola.length + 1) : chave));
  const vista = (escola) => {
    if (vistas[escola]) return vistas[escola];
    const fis = (chave) => escolar(escola, chave);
    vistas[escola] = {
      async ler(chave) { return mapa.has(fis(chave)) ? mapa.get(fis(chave)) : null; },
      async guardar(chave, valor) { mapa.set(fis(chave), String(valor)); },
      async criar(chave, valor) {
        if (mapa.has(fis(chave))) return { criado: false, jaExiste: true };
        mapa.set(fis(chave), String(valor));
        return { criado: true };
      },
      async anexar(chave, linha) {
        const antes = mapa.has(fis(chave)) ? mapa.get(fis(chave)) : '';
        mapa.set(fis(chave), antes + String(linha));
      },
      async listar(prefixo) {
        const p = fis(prefixo);
        return [...mapa.keys()].filter((k) => k.startsWith(p)).map((k) => desescolar(escola, k));
      },
      async existe(chave) { return mapa.has(fis(chave)); },
      async apagar(chave) {
        const tinha = mapa.has(fis(chave));
        mapa.delete(fis(chave));
        return tinha;
      },
    };
    return vistas[escola];
  };
  return { mapa, vista };
}

/* ------------------------------------------------------------------ as respostas declaradas
 *
 * Um mapa de respostas é tudo o que `POST /api/elicitar` precisa. Não é fixture de mentira: é o
 * que a bancada de comandos usa (`--respostas`), e é o que a tela envia depois de o professor ter
 * respondido. O que muda entre a tela e isto é quem escreveu o texto.
 */
const r = (valor) => ({ valor, origem: 'perguntado', respondente: 'professor', nota: null });

function respostasDaAnamnese() {
  return {
    idade: r('12/03/2015'),
    'categoria-etaria': r('Infantil'),
    conhecimentoPrevio: r('balé, um ano'),
    'historico-de-praticas-corporais': r('duas aulas por semana'),
    'cinco-posicoes-1a-pes': r('Bom'),
    'cinco-posicoes-1a-bracos': r('Bom'),
    musicalidade: r('mantém o pulso'),
    tendu: r('reconhece o apoio'),
  };
}

function respostasDoPlano(escola, turma) {
  return {
    'objetivo-geral': r('consolidar o alinhamento e a transferência de peso'),
    'contexto-escola': r(escola.slug),
    'contexto-professor': r(escola.professor),
    'contexto-turma': r(turma),
    'contexto-frequencia': r('2x/semana'),
    'contexto-duracao': r([{ numero: 60, unidade: 'minuto' }]),
    'contexto-calendario': r({ inicio: '2026-11-11', fim: '2026-12-20' }),
    'contexto-volume': r('21 aulas'),
    'contexto-registro': r('captura escrita'),
    'marcos-por-aula': r(['reconhecer o apoio', 'transferir o peso']),
    'aula-1-parametro': r([{ marco: 1, marcados: ['Battement tendu'] }]),
    'aula-1-sequencia': r([{ Bloco: 'Barra', 'Objetivo específico': '1 — reconhecer o apoio',
      'Conteúdo do nível': 'Battement tendu', Tempos: '8', Compasso: '4/4' }]),
    'criterio-de-extensao': r('estender em duas aulas'),
    proveniencia: r(['plano declarado na bancada do shard']),
  };
}

function respostasDoPO(escola, planoId) {
  return {
    professor: r(escola.professor),
    escola: r(escola.slug),
    'campo-escola': r(escola.slug),
    'plano-de-ensino': r(planoId),
    question: r('o que se observa, aula a aula?'),
    fenomeno: r(['a rotação externa visível na 1ª posição']),
    sujeitos: r([escola.aluna]),
    'dimensoes-de-observacao': r(['Técnica — Barra']),
    'itens-por-dimensao': r([{ sujeito: 'Técnica — Barra', itens: 'saída do calcanhar no tendu' }]),
    'condicoes-de-contorno': r('sala com barra e espelho'),
    'referencia-ao-problema': r('o en dehors que sai do joelho'),
    'explicacao-do-recorte': r('a técnica nos cinco blocos'),
    'o-que-fica-de-fora': r('allegro e ponta'),
    'base-teorica': r('RAD (2015)'),
    limitacoes: r('depende do espelho'),
  };
}

/* ------------------------------------------------------------------ as rotas, uma por escola */

function rotasDaEscola({ armazenamento, escola, espiado }) {
  return criarRotas({
    armazenamento,
    conteudo: lerConteudo('conteudo/anamnese.json'),
    esquema: lerConteudo('envelope/elicitacao-schema.json'),
    conteudoPO: lerConteudo('po/conteudo/po.json'),
    conteudoPlano: lerConteudo('plano/conteudo/plano.json'),
    fuso: 'America/Sao_Paulo',
    escolaDoWorker: escola.slug,
    agora: () => '2026-11-15T14:00',
    escreverPlano: async (e) => { espiado.plano.push(e.id); return { ok: true }; },
    escreverPO: async (e) => { espiado.po.push(e.id); return { ok: true }; },
    escreverCiclo: async ({ po }) => {
      espiado.ciclo.push(po && po.id);
      return { ok: true, documentos: [{}] };
    },
    disparar: async (c) => { espiado.disparo.push(c); return { ok: true }; },
    lerCuradorias: async () => [{ professor: escola.professor, modalidade: 'bale-classico',
      tradicao: 'RAD', turmas: [escola.turma], alunas: [escola.aluna] }],
    lerTurmas: async () => [{ nome: escola.turma, dias: ['2', '4'], duracaoMin: 60,
      periodoSemana: null, periodoInicio: '2026-11-11', periodoFim: '2026-12-20' }],
    lerLinhasDeBase: async () => [{
      id: 'elenco-' + escola.slug, turma: escola.turma, alunas: [escola.aluna],
      enviada_em: '2026-11-10T10:00:00.000Z',
      campos: [{ id: 'cinco-posicoes-1a-pes', aspecto: 'cinco-posicoes-1a-pes' }],
    }],
  });
}

const pedirRotas = async (rotas, caminho, corpo, metodo) => {
  const verbo = metodo || (corpo === undefined ? 'GET' : 'POST');
  const init = corpo === undefined
    ? { method: verbo }
    : { method: verbo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) };
  const res = await rotas.responder(new Request('https://' + 'local' + caminho, init));
  const texto = await res.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (erro) { /* pode ser HTML */ }
  return { status: res.status, corpo: json, texto };
};

/* ------------------------------------------------------------------ a loja dos Bastidores */

function kvDeMentira(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return {
        keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })),
        list_complete: true,
      };
    },
  };
}

(async () => {
  const loja = lojaDoShard();
  const espiado = { po: [], plano: [], ciclo: [], disparo: [] };
  const rotas = {};
  for (const e of ESCOLAS) {
    rotas[e.slug] = rotasDaEscola({ armazenamento: loja.vista(e.slug), escola: e, espiado });
  }
  const A = ESCOLAS[0];
  const B = ESCOLAS[1];

  /* O QUE É A ESCOLA B, ANTES DE QUALQUER GESTO — para, no fim, se poder dizer «não mudou». */
  const retratoDeB = () => [...loja.mapa.entries()]
    .filter(([k]) => k.startsWith(B.slug + '/'))
    .map(([k, v]) => k + '=' + v.length).sort().join('|');

  /* ── 0. O ESPIÃO DA REDE ────────────────────────────────────────────────────────────────── */
  /* Instalado ANTES do primeiro gesto e conferido no fim: se algum destes quatro caminhos passar a
   * chamar o modelo (ou qualquer outra coisa), a bancada reprova em vez de gastar a chave. É a
   * asserção que desfaz o motivo pelo qual estes gestos estavam pendentes. */
  const fetchOriginal = globalThis.fetch;
  let pedidosQueSaíram = 0;
  globalThis.fetch = async (url) => {
    pedidosQueSaíram += 1;
    throw new Error('a bancada não fala com a rede: ' + String(url && url.url ? url.url : url));
  };

  /* ── 4. ANAMNESE — criar, editar, apagar ────────────────────────────────────────────────── */
  console.log('\n4. anamnese — criar · editar · apagar');
  let idAnamnese = null;
  {
    const criada = await pedirRotas(rotas[A.slug], '/api/elicitar', {
      fonte: 'anamnese', respostas: respostasDaAnamnese(),
      contexto: { escola: A.slug, professor: A.professor, aluna: A.aluna },
    });
    idAnamnese = (criada.corpo && criada.corpo.documento && criada.corpo.documento.id) || null;
    provar('criar a anamnese responde 200', criada.status === 200, [criada.status, criada.corpo && criada.corpo.erro]);
    provar('…e devolve o envelope gravado, com id', Boolean(idAnamnese), criada.corpo && criada.corpo.documento);
    provar('…e o envelope foi para a subárvore da escola dele',
      await loja.vista(A.slug).existe('envelope/' + idAnamnese + '.json'), idAnamnese);

    const lista = await pedirRotas(rotas[A.slug], '/api/anamneses');
    const sujeitos = (lista.corpo && lista.corpo.sujeitos) || lista.corpo || [];
    provar('a aluna aparece na estante', JSON.stringify(sujeitos).indexOf(A.aluna) !== -1,
      Array.isArray(sujeitos) ? sujeitos.length : sujeitos);

    const editada = await pedirRotas(rotas[A.slug], '/api/anamnese-editar/' + idAnamnese, {
      respostas: Object.assign(respostasDaAnamnese(), { musicalidade: r('antecipa o pulso') }),
      contexto: { escola: A.slug, professor: A.professor, aluna: A.aluna },
    }, 'PUT');
    provar('editar a anamnese LIVRE responde 200 e muda de facto',
      editada.status === 200 && editada.corpo && editada.corpo.mudou === true, editada.corpo);
    /* O ID DA EDIÇÃO É O QUE A ROTA DEVOLVE, e não o que se pediu: uma anamnese LIVRE que muda de
     * facto é REESCRITA com o carimbo da hora da mudança (`recarimbada: true`), e quem sabe qual é
     * o registo que passou a valer é a resposta. Apontar para o id de entrada depois de um
     * recarimbo foi o defeito da primeira versão desta bancada — e o mesmo que a bateria ao ar
     * encontrou no `turma-editar` (o id muda ao renomear). */
    const idEditada = (editada.corpo && editada.corpo.editada) || idAnamnese;
    provar('…e a resposta diz QUAL é o registo que passou a valer', Boolean(idEditada), editada.corpo && editada.corpo.editada);
    const lida = await porta.lerEnvelope(loja.vista(A.slug), idEditada);
    provar('…e o texto novo está no registo',
      JSON.stringify(lida && lida.respostas && lida.respostas.musicalidade).indexOf('antecipa') !== -1,
      lida && lida.respostas && lida.respostas.musicalidade);
    if (idEditada !== idAnamnese) {
      provar('…e o registo anterior NÃO ficou como órfão (o carimbo refez-se, não há dois)',
        !(await loja.vista(A.slug).existe('envelope/' + idAnamnese + '.json')), idAnamnese);
    }

    const apagada = await pedirRotas(rotas[A.slug], '/api/anamnese-vinculo/' + idEditada, {}, 'DELETE');
    provar('apagar a anamnese ainda SOLTA responde 200', apagada.status === 200,
      [apagada.status, apagada.corpo && apagada.corpo.erro]);
    provar('…e o envelope sai do acervo',
      !(await loja.vista(A.slug).existe('envelope/' + idEditada + '.json')), idEditada);
  }

  /* ── 5. PLANO DE ENSINO — criar, derivar ────────────────────────────────────────────────── */
  console.log('\n5. plano de ensino — criar · derivar');
  let idPlano = null;
  let idPlanoDerivado = null;
  {
    const criado = await pedirRotas(rotas[A.slug], '/api/elicitar', {
      fonte: 'plano', respostas: respostasDoPlano(A, A.turma),
      contexto: { escola: A.slug, professor: A.professor, ciclo: '01', turma: A.turma },
    });
    idPlano = (criado.corpo && criado.corpo.documento && criado.corpo.documento.id) || null;
    provar('criar o plano de ensino responde 200', criado.status === 200, [criado.status, criado.corpo && criado.corpo.erro]);
    provar('…e a fonte do plano foi escrita (o pacote precisa dela)', espiado.plano.indexOf(idPlano) !== -1,
      espiado.plano);

    const derivado = await pedirRotas(rotas[A.slug], '/api/elicitar', {
      fonte: 'plano', ajuste_de: idPlano,
      motivo: 'a bancada do shard: derivar para ver o elo',
      respostas: Object.assign(respostasDoPlano(A, A.turma),
        { 'criterio-de-extensao': r('estender em três aulas') }),
      contexto: { escola: A.slug, professor: A.professor, ciclo: '01', turma: A.turma },
    });
    idPlanoDerivado = (derivado.corpo && derivado.corpo.documento && derivado.corpo.documento.id) || null;
    provar('derivar o plano responde 200 e dá um id NOVO',
      derivado.status === 200 && idPlanoDerivado && idPlanoDerivado !== idPlano,
      { status: derivado.status, idPlano, idPlanoDerivado });
    const elo = await porta.lerEnvelope(loja.vista(A.slug), idPlanoDerivado);
    provar('…e o elo novo aponta o anterior (`ajuste_de`) — a proveniência acrescenta',
      elo && elo.ajuste_de === idPlano, elo && elo.ajuste_de);
  }

  /* ── 6. PO — criar, concluir, gerar ────────────────────────────────────────────────────── */
  console.log('\n6. Plano de Observação — criar · concluir · gerar');
  let idPO = null;
  {
    const criado = await pedirRotas(rotas[A.slug], '/api/elicitar', {
      fonte: 'po', respostas: respostasDoPO(A, idPlanoDerivado || idPlano),
      contexto: { escola: A.slug, professor: A.professor, ciclo: '01', turma: A.turma },
    });
    idPO = (criado.corpo && criado.corpo.documento && criado.corpo.documento.id) || null;
    provar('criar o PO responde 200', criado.status === 200, [criado.status, criado.corpo && criado.corpo.erro]);
    provar('…e o PO observa o plano VIGENTE (o derivado, não o primeiro)',
      criado.corpo && criado.corpo.documento
      && String((criado.corpo.documento.respostas['plano-de-ensino'] || {}).valor) === idPlanoDerivado,
      criado.corpo && criado.corpo.documento
      && criado.corpo.documento.respostas['plano-de-ensino']);
    provar('…a fonte do PO foi escrita', espiado.po.indexOf(idPO) !== -1, espiado.po);
    provar('…o ciclo foi derivado', espiado.ciclo.indexOf(idPO) !== -1, espiado.ciclo);
    provar('…e a geração foi DISPARADA, com o contexto do ato',
      espiado.disparo.length === 1 && espiado.disparo[0] && espiado.disparo[0].escola === A.slug,
      espiado.disparo);

    const segundo = await pedirRotas(rotas[A.slug], '/api/elicitar', {
      fonte: 'po', respostas: respostasDoPO(A, idPlanoDerivado || idPlano),
      contexto: { escola: A.slug, professor: A.professor, ciclo: '01', turma: A.turma },
    });
    provar('um SEGUNDO PO para o mesmo plano é recusado (409) — o PO é um só',
      segundo.status === 409, [segundo.status, segundo.corpo && segundo.corpo.erro]);
  }

  /* ── 7. LINHA DE BASE — enviar, alterar elenco ─────────────────────────────────────────── */
  console.log('\n7. linha de base — enviar · alterar o elenco');
  {
    const senha = 'senha-de-prova';
    const kv = kvDeMentira({
      ['bastidores/' + A.slug + '/professores']: JSON.stringify([{ nome: 'Pe Torto', slug: 'pe-torto' }]),
      ['bastidores/' + A.slug + '/alunas']: JSON.stringify([A.aluna, 'Aluna C']),
      ['bastidores/' + A.slug + '/turmas']: JSON.stringify([{ nome: A.turma, dias: ['2', '4'],
        duracaoMin: 60, periodoInicio: '2026-11-11', periodoFim: '2026-12-20' }]),
      ['bastidores/' + A.slug + '/linhas-de-base']: JSON.stringify([{
        id: 'elenco-a', nome: 'Nível 1 — teste', professor: A.professor,
        alunas: [A.aluna], campos: [{ id: 'cinco-posicoes-1a-pes', aspecto: 'cinco-posicoes-1a-pes' }],
      }]),
    });
    const env = {
      ESCOLA_SLUG: A.slug, ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: senha, SENHA_PROFESSOR: 'x',
      PROFESSOR_NOME: 'Pe Torto', PROFESSOR_SLUG: A.professor, PADD_KV: kv,
    };
    const pedirBastidores = async (caminho, corpo) => {
      const res = await bastidores.fetch(new Request('https://' + A.slug + '.local' + caminho, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ senhaDirecao: senha }, corpo)),
      }), env);
      const texto = await res.text();
      let json = null;
      try { json = JSON.parse(texto); } catch (erro) { /* não-JSON */ }
      return { status: res.status, corpo: json, texto };
    };

    /* ALTERAR O ELENCO É UM ACTO INTEIRO, e não um remendo: a rota grava a linha de base como ela
     * fica (o `normalizar` exige nome e recorte — é a mesma regra do passo 1 e do passo 4). O que
     * muda nesta chamada é a lista de alunas, que é o gesto que o §4 pede. */
    const alterado = await pedirBastidores('/api/bastidores/linha-de-base', {
      id: 'elenco-a', nome: 'Nível 1 — teste (elenco alterado)',
      alunas: [A.aluna, 'Aluna C'], campos: ['cinco-posicoes-1a-pes'],
    });
    provar('alterar o elenco do rascunho responde 200', alterado.status === 200,
      [alterado.status, alterado.corpo && alterado.corpo.erro]);
    const rascunho = JSON.parse(await kv.get('bastidores/' + A.slug + '/linhas-de-base'));
    provar('…e o rascunho passa a ter as duas alunas',
      rascunho[0] && rascunho[0].alunas && rascunho[0].alunas.length === 2, rascunho[0] && rascunho[0].alunas);

    const enviada = await pedirBastidores('/api/bastidores/linha-de-base/enviar', {
      id: 'elenco-a', turma: A.turma,
    });
    provar('enviar a linha de base para a turma responde 200', enviada.status === 200,
      [enviada.status, enviada.corpo && enviada.corpo.erro]);
    /* SEM REPOSITÓRIO (o caso desta bancada, e o das escolas legadas), o acto fica no KV e a
     * resposta DIZ isso — `gravado: 'kv'`. É a metade honesta: não se anuncia «concluído» sobre
     * um arquivo que não existe. */
    provar('…e diz ONDE gravou, em vez de fingir um repositório',
      enviada.corpo && enviada.corpo.gravado === 'kv', enviada.corpo && enviada.corpo.gravado);
    const linha = (enviada.corpo && enviada.corpo.linha) || {};
    provar('…e as duas alunas do elenco seguem para a turma',
      Array.isArray(linha.alunas) && linha.alunas.length === 2, linha.alunas);
    provar('…com o carimbo do ENVIO, que é o instante do facto',
      typeof linha.enviada_em === 'string' && linha.enviada_em.length >= 10, linha.enviada_em);
  }

  /* ── E. O OUTRO LADO DO SHARD ───────────────────────────────────────────────────────────── */
  console.log('\nE. o shard — os gestos de uma escola não tocam na outra');
  {
    provar('a `' + B.slug + '` não ganhou um único byte com os gestos da `' + A.slug + '`',
      retratoDeB() === '', { retrato: retratoDeB().slice(0, 200) });
    /* A CONTRAPROVA, e é ela que dá sentido à linha acima: a loja TEM conteúdo, e o conteúdo está
     * do lado da escola A. Um `retratoDeB` medido sobre uma loja vazia diria «isolado» sem que
     * nada tivesse sido escrito — é o modo de falha mais provável desta asserção. */
    const chavesA = [...loja.mapa.keys()].filter((k) => k.startsWith(A.slug + '/'));
    const familias = new Set(chavesA.map((k) => (/(plano|po|anamnese)-/.exec(k) || [])[1]).filter(Boolean));
    provar('contraprova: a loja tem as chaves da `' + A.slug + '`, das três famílias, e é nelas '
      + 'que o retrato se apoia',
      chavesA.length >= 3 && familias.has('plano') && familias.has('po'),
      { chaves: chavesA, familias: [...familias] });
    /* E a mesma bateria de gestos na escola B, na mesma loja, para o isolamento não ser «porque só
     * uma escreveu». A anamnese da B é criada; a da A já não existe (foi apagada no gesto 4). */
    const anamneseB = await pedirRotas(rotas[B.slug], '/api/elicitar', {
      fonte: 'anamnese', respostas: respostasDaAnamnese(),
      contexto: { escola: B.slug, professor: B.professor, aluna: B.aluna },
    });
    provar('a `' + B.slug + '` cria a dela, na mesma loja, sem tocar na `' + A.slug + '`',
      anamneseB.status === 200, [anamneseB.status, anamneseB.corpo && anamneseB.corpo.erro]);
    const daB = (await loja.vista(B.slug).listar('envelope/')).filter((n) => /anamnese/.test(n));
    const daA = (await loja.vista(A.slug).listar('envelope/')).filter((n) => /anamnese/.test(n));
    provar('…e cada uma lê só a sua: a B tem a anamnese dela, a A não tem a da B',
      daB.length === 1 && !daA.some((n) => daB.indexOf(n) !== -1), { a: daA, b: daB });
  }

  /* ── F. O QUE NÃO ACONTECEU ────────────────────────────────────────────────────────────── */
  console.log('\nF. o que não aconteceu em nenhum dos quatro gestos');
  provar('nenhum pedido saiu para a rede — e portanto o modelo não foi chamado uma vez',
    pedidosQueSaíram === 0, pedidosQueSaíram);
  /* O CONTROLE NEGATIVO DO ESPIÃO, e é ele que impede o falso verde mais provável desta secção:
   * um contador que nunca sobe aprovaria «nada saiu» mesmo com a rede a ser usada. */
  let contou = false;
  try { await fetch('https://exemplo.invalido/x'); } catch (erro) { contou = pedidosQueSaíram === 1; }
  globalThis.fetch = fetchOriginal;
  provar('CONTROLE NEGATIVO do espião: ele CONTA quando alguém pede (senão media o vazio)',
    contou, pedidosQueSaíram);

  console.log('\n' + (ko === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + ok + '/' + (ok + ko)
    + ' asserção(ões)' + (ko ? ', ' + ko + ' falha(s)' : '') + '.');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova rebentou: ' + (erro && erro.stack || erro));
  process.exit(2);
});
