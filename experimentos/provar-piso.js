#!/usr/bin/env node
'use strict';

/*
 * provar-piso.js — O CADASTRO NÃO É TRAVADO PELO PLANO; A FRANQUIA DE AULAS É QUE MEDE
 * (16/11/2026, revisto a 17/11/2026 depois de a decisão ser revogada).
 *
 * A HISTÓRIA, porque esta prova mudou de sentido e o registo tem de o dizer.
 *
 *   · **16/11/2026 — a decisão que esta prova nasceu a medir.** «Capacidade dá ideia de teto […] O
 *     nosso não é capacidade, o nosso é a partir de» e «Coloca no motor, sem dúvida». O piso
 *     contratado (1 professor e 10 alunas no Básico) passou a ser uma TRAVA: acima dele o cadastro
 *     era RECUSADO com 409, e a frase nomeava as duas saídas — comprar um lote ou subir de plano.
 *
 *   · **17/11/2026 — a decisão que a revogou, e é dela.** O ADITIVO COMERCIAL mudou a unidade de
 *     contratação para a AULA PROCESSADA e disse, com todas as letras: «Não exibir limites
 *     comerciais de professores e alunos na oferta. Não usar essas quantidades para calcular a
 *     mensalidade nem para BLOQUEAR a escola por ter mais pessoas cadastradas.» (¶2)
 *
 * PORQUE É QUE A REVOGAÇÃO É CORRECTA, e não um capricho: uma escola com 30 professoras e 800
 * alunas que processe 40 aulas por mês está DENTRO do que contratou. Travá-la por causa das fichas
 * seria cobrar-lhe um eixo que já não existe — e o eixo que existe, a franquia, não bloqueia: ele
 * devolve um EXCEDENTE que se paga («se ela der mais aulas do que o que ela contratou, tem um
 * excedente. Aí ela tem que pagar pelo excedente»).
 *
 * O QUE FICA DA DECISÃO ANTIGA, e continua a valer: a CONTAGEM. «Não é correto afirmar que fichas
 * de alunos ou registros de professores não custam nada» — o cadastro consome KV, índice e
 * workflow, e a controladoria precisa do número para decidir migração. O que muda é o USO do
 * número: informa, não recusa.
 *
 * O QUE ESTA PROVA MEDE AGORA:
 *
 *   A. A DECISÃO, pura: `cabe` é SEMPRE `true` — inclusive acima da referência, no eixo das
 *      alunas e no último degrau. E a referência continua a ser calculada, com aviso quando passa.
 *   B. AS ROTAS: cadastrar um professor no Básico cheio é 201, e não 409. A escrita ACONTECE.
 *   C. AS ROTAS, eixo das alunas: 201 também — o eixo morreu nos dois lados.
 *   D. A FRANQUIA, que é o eixo que ficou: folga, perto, limite e passou; o excedente é o número
 *      que se cobra, e os pacotes somam-se à franquia do plano.
 *   E. A PÁGINA: não apresenta professores nem alunas como limite, e diz a franquia de aulas.
 *
 *   node experimentos/provar-piso.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
/* A SITUAÇÃO DA ESCOLA — a mesma função que a rota usa para montar o `dadosDaEscola` que o cartão
 * de «A escola» desenha. Sem ela, a prova do cartão mediria a bancada. */
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

/* ------------------------------- A BANCADA ------------------------------- */

function kvFalso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
    bruto: dados,
  };
}

/**
 * O GITHUB DE MENTIRA — o mínimo que o cadastro de um professor pede: a árvore (para saber que
 * planos existem), o inventário da escola (`escola/<escola>/indice.json`, sem o qual o vínculo não
 * tem onde ser escrito) e o perfil do principal. O `ok` vai explícito nas respostas porque o
 * `repo-escola` o lê, e uma resposta sem `ok` é uma resposta que ele — com razão — trata como
 * falha: foi assim que a primeira versão desta bancada devolveu 502 a um cadastro que devia passar.
 */
function githubFalso() {
  const mapa = new Map(Object.entries({
    'escola/breu/indice.json': JSON.stringify({
      escola: 'breu', professor: { slug: 'demi-plie', nome: 'Demi Plié' }, ciclo: '01',
      estado: { habilitada: true }, arquivos: [],
    }),
    'professores/brise-volet/perfil.json': JSON.stringify({
      slug: 'brise-volet', nome: 'Brise Volet', modalidades: ['bale-classico'], criado: '2026-11-16',
    }),
  }));
  const resposta = (status, corpo) => ({
    status, ok: status >= 200 && status < 300,
    json: async () => corpo, text: async () => JSON.stringify(corpo),
  });
  const fetch = async (url, opcoes) => {
    const u = String(url);
    if (u.indexOf('/git/trees/') !== -1) return resposta(200, { tree: [], sha: 'arvore' });
    const metodo = (opcoes && opcoes.method) || 'GET';
    const caminho = decodeURIComponent(u
      .replace(/^https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\//, '').split('?')[0]);
    if (metodo === 'GET') {
      if (!mapa.has(caminho)) return resposta(404, { message: 'Not Found' });
      return resposta(200, {
        content: Buffer.from(mapa.get(caminho), 'utf8').toString('base64'), sha: 'sha-' + caminho,
      });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse((opcoes && opcoes.body) || '{}');
      mapa.set(caminho, Buffer.from(String(corpo.content || ''), 'base64').toString('utf8'));
      return resposta(200, { commit: { sha: 'novo' }, content: { sha: 'novo' } });
    }
    return resposta(405, {});
  };
  return { fetch, mapa };
}

function envCom(kv) {
  const gh = githubFalso();
  globalThis.fetch = gh.fetch;
  return {
    ESCOLA_SLUG: 'breu',
    PADD_KV: kv,
    GITHUB_TOKEN: 'gh-de-mentira',
    SENHA_ADMIN: '123',
    PROFESSOR_SLUG: 'brise-volet',
    PROFESSOR_NOME: 'Brise Volet',
    ASSETS: { fetch: async () => new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }) },
  };
}

async function pedir(env, caminho, metodo, corpo) {
  const req = new Request('https://breu.padd.com.br' + caminho, {
    method: metodo || 'GET',
    ...(corpo ? { body: JSON.stringify(corpo), headers: { 'Content-Type': 'application/json' } } : {}),
  });
  const r = await bastidores.fetchSemRede(req, env);
  const d = await r.json().catch(() => ({}));
  return { status: r.status, dados: d };
}

const comSenha = (corpo) => Object.assign({ senhaDirecao: '123' }, corpo || {});
const CONTRATO = (plano, professores, alunos) => JSON.stringify({
  plano, estado: 'ativa', capacidade: { professores, alunos },
  criadoEm: '2026-11-16T12:00:00Z',
});

(async () => {
  console.log('A. A decisão, no núcleo: `cabe` é sempre verdadeiro — e a referência continua medida');
  {
    const noPiso = (contrato, eixo, n) => comercial.travaDoPiso({ contrato, eixo, cadastrados: n });
    const basico = { plano: 'basico', capacidade: { professores: 1, alunos: 10 } };

    conferir('abaixo da referência, o cadastro passa',
      noPiso(basico, 'professores', 0).cabe === true && noPiso(basico, 'alunos', 9).cabe === true,
      noPiso(basico, 'professores', 0));
    /* O CORAÇÃO DA REVOGAÇÃO: no piso, ACIMA do piso e muito acima, a resposta é a mesma — passa. */
    conferir('NA referência, acima dela e muito acima, o cadastro passa sempre',
      [1, 2, 10, 100].every((n) => noPiso(basico, 'professores', n).cabe === true),
      [1, 2, 10, 100].map((n) => noPiso(basico, 'professores', n).cabe));
    conferir('…e o eixo das alunas responde o mesmo que o dos professores',
      [10, 11, 500].every((n) => noPiso(basico, 'alunos', n).cabe === true),
      [10, 11, 500].map((n) => noPiso(basico, 'alunos', n).cabe));

    /* A CONTAGEM NÃO SE PERDEU: «não é correto afirmar que fichas não custam nada». */
    const dentro = noPiso(basico, 'alunos', 8);
    const fora = noPiso(basico, 'alunos', 50);
    conferir('a referência do plano continua a ser calculada e devolvida',
      dentro.referencia === 10 && fora.referencia === 10, { dentro: dentro.referencia, fora: fora.referencia });
    conferir('…e passar da referência produz um AVISO, e não uma recusa',
      fora.cabe === true && fora.acimaDaReferencia === true && Boolean(fora.aviso)
        && dentro.acimaDaReferencia === false && dentro.aviso === null,
      { dentro: dentro.aviso, fora: fora.aviso && fora.aviso.slice(0, 60) });
    /* O AVISO NOMEIA A FRANQUIA — senão a escola procuraria um limite de gente que já não existe. */
    conferir('o aviso diz que não há bloqueio e que o que se cobra é a AULA',
      /não há bloqueio/i.test(fora.aviso || '') && /AULAS/i.test(fora.aviso || ''), fora.aviso);
    conferir('…e não traz a palavra «capacidade» nem a frase proibida',
      !/capacidade/i.test(fora.aviso || '') && !/não permite/i.test(fora.aviso || ''), fora.aviso);

    /* NO ÚLTIMO DEGRAU não há degrau acima — e isso já não muda nada, porque nada bloqueia. */
    const avancado = { plano: 'avancado', capacidade: { professores: 9, alunos: 120 } };
    conferir('no último degrau, acima da referência também passa',
      noPiso(avancado, 'professores', 40).cabe === true, noPiso(avancado, 'professores', 40));

    /* SEM CONTRATO e EIXO DESCONHECIDO continuam a passar, e sem aviso — não se inventa um número. */
    conferir('sem contrato, nada é recusado nem avisado',
      noPiso(null, 'professores', 99).cabe === true && noPiso(null, 'professores', 99).aviso === null, null);
    conferir('…e um eixo desconhecido não é uma pergunta que se faça',
      noPiso(basico, 'salas', 99).cabe === true, noPiso(basico, 'salas', 99));
  }

  console.log('\nB. As rotas: um professor a mais NÃO é recusado, e a escrita acontece');
  {
    /* O CONTRATO DO BÁSICO É DE 1 PROFESSOR, e o principal é um. Até 16/11 isto era 409; a partir
     * de 17/11 é 201, e a lista do KV cresce — que é o que se mede. */
    const kv = kvFalso({ 'bastidores/breu/comercial': CONTRATO('basico', 1, 10) });
    const env = envCom(kv);

    const primeiro = await pedir(env, '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Ana', sobrenome: 'Diag', senha: 'x1' }));
    conferir('no Básico com o principal, cadastrar um professor passa (201)',
      primeiro.status === 201, primeiro);
    const lista = JSON.parse((await kv.get('bastidores/breu/professores')) || '[]');
    conferir('…E a escrita aconteceu — não é um 201 vazio', lista.length === 1 && lista[0].slug === 'ana-diag', lista);

    /* O SEGUNDO TAMBÉM, e o terceiro: o limite de gente deixou de existir nos dois sentidos. */
    const segundo = await pedir(env, '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Bia', sobrenome: 'Nova', senha: 'x2' }));
    conferir('…e o segundo também, com o mesmo contrato de um',
      segundo.status === 201, segundo.status);
    const tres = JSON.parse((await kv.get('bastidores/breu/professores')) || '[]');
    conferir('…e os dois estão na lista', tres.length === 2, tres.map((p) => p.slug));

    /* O DESLIGADO continua a contar em tudo o que contava, e o que ele já não faz é bloquear —
     * mas a reactivação do mesmo nome continua a passar, que era a outra metade da regra. */
    const kv2 = kvFalso({
      'bastidores/breu/comercial': CONTRATO('basico', 1, 10),
      'bastidores/breu/professores': JSON.stringify([
        { nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h', desligado_em: '2026-11-01' },
      ]),
    });
    const volta = await pedir(envCom(kv2), '/api/bastidores/professor', 'POST',
      comSenha({ nome: 'Ana', sobrenome: 'Diag', senha: 'x3' }));
    conferir('…e o desligado pode voltar — a reactivação não colide consigo',
      volta.status === 201 || volta.status === 200, volta.status);
  }

  console.log('\nC. As rotas, eixo das alunas: o limite morreu nos dois lados');
  {
    const dez = Array.from({ length: 10 }, (_, i) => 'aluna' + i);
    const kv = kvFalso({
      'bastidores/breu/comercial': CONTRATO('basico', 1, 10),
      'bastidores/breu/alunas': JSON.stringify(dez),
    });
    const env = envCom(kv);
    /* O CPF PASSOU A SER OBRIGATÓRIO NO CADASTRO DA ALUNA (18/11/2026) — o corpo leva um sintético,
     * e a asserção não muda: o que se mede aqui é o LUGAR, e não o CPF. */
    const maisUma = await pedir(env, '/api/bastidores/aluna', 'POST',
      comSenha({ apelido: 'nova', cpf: '11144477735' }));
    conferir('com o cadastro de alunas no limite antigo, mais uma entra (201)',
      maisUma.status === 201, maisUma);
    const lista = JSON.parse((await kv.get('bastidores/breu/alunas')) || '[]');
    conferir('…e está na lista — a décima primeira aluna existe',
      lista.length === 11 && lista.some((a) => (a && a.apelido) === 'nova' || a === 'nova'),
      lista.length);
    /* A REPETIÇÃO CONTINUA A RESPONDER POR SI: ela é um erro de dado, e não uma questão de plano. */
    const repetida = await pedir(env, '/api/bastidores/aluna', 'POST', comSenha({ apelido: 'aluna3' }));
    conferir('a aluna que já existe responde pela repetição — esse erro não mudou',
      repetida.status === 409 && /já existe uma aluna com este apelido/.test(repetida.dados.erro || ''),
      repetida.dados.erro);
  }

  console.log('\nD. A franquia de aulas — o eixo que ficou, e o excedente que se cobra');
  {
    /* O BÁSICO SÃO 100 AULAS. Os quatro estados têm fronteiras declaradas: 80% é «perto». */
    const contrato = { plano: 'basico' };
    const situacao = (n) => comercial.situacaoDaFranquia({ contrato, aulasUsadas: n });
    conferir('a franquia do Básico é 100 aulas, e vem do catálogo',
      situacao(0).franquia === 100 && comercial.franquiaDoPlano('basico') === 100, situacao(0).franquia);
    conferir('aos 79 o estado é «folga» e aos 80 é «perto» — o corte é declarado',
      situacao(79).estado === 'folga' && situacao(80).estado === 'perto',
      [situacao(79).estado, situacao(80).estado]);
    conferir('aos 100 o estado é «limite», e o excedente ainda é 0',
      situacao(100).estado === 'limite' && situacao(100).excedente === 0, situacao(100));
    /* O EXCEDENTE É O NÚMERO QUE SE COBRA — «se ela der mais aulas… tem um excedente… tem que pagar». */
    const passou = situacao(140);
    conferir('aos 140 o estado é «passou», e o excedente é 40',
      passou.estado === 'passou' && passou.excedente === 40 && passou.restantes === 0, passou);
    conferir('…e a frase diz que as excedentes são cobradas além da mensalidade',
      /cobradas além da mensalidade/i.test(passou.frase || ''), passou.frase);
    /* DENTRO DA FRANQUIA NÃO SE DEVE NADA — e a frase diz quantas restam, que é o que a escola quer. */
    conferir('dentro da franquia o excedente é 0 e a frase diz quantas restam',
      situacao(40).excedente === 0 && /60 aula\(s\) ainda disponíveis/.test(situacao(40).frase || ''),
      situacao(40).frase);

    /* OS PACOTES SOMAM-SE À FRANQUIA — e o preço é o da tabela, não um cálculo à mão. */
    const comPacote = comercial.situacaoDaFranquia({ contrato: { plano: 'basico', pacotes: ['p'] }, aulasUsadas: 110 });
    conferir('um pacote de +20 leva a franquia do Básico a 120',
      comPacote.franquia === 120 && comPacote.aulasExtras === 20, comPacote.franquia);
    conferir('…e aos 110 a escola está em «perto», não em excedente',
      comPacote.estado === 'perto' && comPacote.excedente === 0, comPacote.estado);
    conferir('…e aos 130 o excedente é 10, contando já o pacote',
      comercial.situacaoDaFranquia({ contrato: { plano: 'basico', pacotes: ['p'] }, aulasUsadas: 130 }).excedente === 10,
      null);

    /* A CONTA DO PREÇO: os pacotes a R$ 0,50/aula, e a regra que os fixou. */
    const pacotes = comercial.pacotesDeAulas();
    conferir('os três pacotes são +20/+50/+100 e custam R$ 10 / R$ 25 / R$ 50',
      pacotes.map((x) => x.aulas).join(',') === '20,50,100'
        && pacotes.map((x) => x.preco).join(',') === '10,25,50', pacotes);
    const porAula = pacotes.map((x) => x.preco / x.aulas);
    conferir('…e todos custam R$ 0,50 por aula — um preço, não três',
      porAula.every((v) => Math.abs(v - 0.5) < 1e-9), porAula);
    /* A REGRA DELA, medida: a aula da extensão é mais caro do que a do plano de CIMA. */
    const porAulaDoPlano = (id) => comercial.assinaturaPorId(id).preco / comercial.franquiaDoPlano(id);
    conferir('a aula da extensão (R$ 0,50) é mais cara do que a do Intermediário (R$ 0,333)',
      0.5 > porAulaDoPlano('intermediario'), porAulaDoPlano('intermediario'));
    conferir('…e mais do que a do Avançado (R$ 0,175)',
      0.5 > porAulaDoPlano('avancado'), porAulaDoPlano('avancado'));
    /* O CONTRATO É QUE MANDA NA CONTA: um pacote com o preço da tabela, somado à mensalidade. */
    const calculo = comercial.calcular({ assinatura: 'basico', pacotes: ['p'] });
    conferir('Básico + 1 pacote = R$ 79,90 e 120 aulas',
      calculo.total === 'R$ 79,90' && calculo.capacidadeTotal.aulas === 120, calculo.total);
    conferir('…e um pacote que não existe é RECUSADO, não arredondado',
      comercial.calcular({ assinatura: 'basico', pacotes: ['zzz'] }).ok === false, null);
  }

  console.log('\nE. A página: a franquia é o que se mostra, e o cadastro não traz limite');
  {
    /* O `dadosDaEscola` É O QUE A ROTA MONTA: cadastro, contrato, pix e a SITUAÇÃO já derivada
     * (`situacaoDaEscola`), que é o que o cartão de «A escola» desenha. Passar só o contrato
     * deixaria o cartão vazio — e a prova diria «o piso não está lá» quando o que faltava era a
     * bancada. */
    const pagina = (contrato) => {
      const situacao = contrato ? mensalidades.situacaoDaEscola({
        escola: 'breu', contrato, livro: [], agora: '2026-11-17T12:00:00Z',
      }) : null;
      return bastidores.paginaProducao(
        'breu', {}, [{ nome: 'Ana Diag', slug: 'ana-diag', sal: 's', hash: 'h' }], ['abreu', 'vava'],
        'Brise Volet', 'brise-volet', [], [], {}, [], [], [],
        { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 }, null, null, [],
        new Set(), contrato
          ? { ok: true, contrato, situacao: Object.assign({}, situacao, { frase: 'Em dia.' }) }
          : { ok: true, contrato: null },
      );
    };
    const comContrato = pagina({ plano: 'avancado', capacidade: { professores: 9, alunos: 120 } });

    /* O QUE NÃO PODE ESTAR: a contagem de gente como limite, e as frases de «faltam N lugares».
     * A decisão de limpeza de 17/11/2026 continua a valer, e agora com mais razão: o número nem
     * limite é. */
    conferir('o formulário do professor NÃO traz contagem nem lugares',
      !/prof-piso/.test(comContrato) && !/data-piso-selo/.test(comContrato)
        && !/data-piso-recusa/.test(comContrato), null);
    conferir('…nem o formulário das alunas', !/aluna-piso/.test(comContrato), null);
    conferir('…e nenhuma frase de «faltam N lugares» sobrevive na página',
      !/\d+ lugares?\b/.test(comContrato) && !/de \d+<\/strong>/.test(comContrato), null);
    /* O CARTÃO DE «A ESCOLA» continua a dizer o que a escola contratou — é lá que o número vive. */
    /* O ID DA SECÇÃO MUDOU desde que esta asserção nasceu: é `sec-a-escola` (o cartão de «A
     * escola»), e não `a-escola`. A asserção procurava o id antigo e reprovava sobre uma página
     * certa — o defeito estava na prova, e não no ecrã. */
    const iEscola = comContrato.indexOf('id="sec-a-escola"');
    const iProfs = comContrato.indexOf('id="sec-professores"');
    /* OS NÚMEROS DE GENTE SAÍRAM DO CARTÃO, E É A DECISÃO — revista duas vezes no mesmo dia.
     *
     * Ao princípio eram «Piso contratado» e «Teto do plano»; a 17/11/2026 passaram a «Tamanho de
     * referência», porque o §ADITIVO §2 proíbe apresentá-los como limite. Ela foi mais longe e
     * fechou a questão: «também não tem que ter mais o tamanho de referência […] Isso não existe
     * mais.» Um número de gente ao lado de um preço lê-se como se fizesse parte dele, e não faz.
     *
     * O QUE FICA NO CARTÃO: o plano, a mensalidade real, a franquia de aulas, o que foi contratado
     * além dela, o consumo do mês e o vencimento. */
    const cartao = comContrato.slice(iEscola, iProfs);
    conferir('o cartão de «A escola» já não diz referência nenhuma de professores e alunas',
      iEscola > 0 && iProfs > iEscola
        && !/Tamanho de referência/.test(cartao) && !/Referência do topo/.test(cartao)
        && !/Além da referência/.test(cartao), null);
    conferir('…nem os nomes antigos, «piso contratado» e «teto do plano»',
      !/Piso contratado/.test(cartao) && !/Teto do plano/.test(cartao), null);
    /* A FRANQUIA É O PRIMEIRO PAR — a unidade comercial de hoje. */
    conferir('o cartão abre com a FRANQUIA DE AULAS, e ela vem do catálogo',
      /Franquia de aulas/.test(cartao) && /aulas por mês/.test(cartao), null);
    /* SEM CONTAGEM, o cartão cala o consumo em vez de dizer «0 de 100». */
    conferir('sem contagem de aulas, o cartão não afirma um consumo que não mediu',
      !/Consumo do mês/.test(cartao), cartao.slice(0, 200));
    /* SEM CONTRATO, a página não inventa nada. */
    const semContrato = pagina(null);
    conferir('sem contrato, a página não diz limite nenhum nos formulários',
      !/data-piso/.test(semContrato) && !/lugares?\b/.test(semContrato), null);
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();
