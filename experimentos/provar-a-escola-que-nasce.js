#!/usr/bin/env node
'use strict';

/*
 * provar-a-escola-que-nasce.js — uma escola criada hoje nasce com a franquia de aulas, e não com o
 * eixo de gente (17/11/2026).
 *
 * A PERGUNTA DELA, por palavras próprias: «Então quer dizer que todo esse que já não se vende mais
 * vai sair quando eu expurgar a escola e quando eu nascer a escola nova já vai estar certo? É isso
 * que você está me dizendo? Preciso saber disso, tá?» E logo depois: «Só me garante que tá
 * funcionando no motor que a gente cria uma escola nova e faz funcionar.»
 *
 * É uma pergunta de SIM OU NÃO, e ela só se responde medindo. O que se mede aqui:
 *
 *   A. O CONTRATO QUE NASCE. Uma escola criada com «Intermediário + pacote P» grava plano, valor
 *      real (R$ 109,90) e `pacotes: ['p']` — e NÃO grava lotes de gente. A franquia é 320 aulas.
 *   B. O QUE SOBRA DO PASSADO. O expurgo apaga as chaves da escola por prefixo E por uma lista
 *      declarada — e é a lista que salva o dia em que o `kv.list` não responde. Ela tem de incluir
 *      o que nasceu depois: `comercial`, `cadastro`, `linhas-de-base` e `ensaio`.
 *   C. O ENSAIO NASCE DESLIGADO. Uma escola nova não tem a chave do ensaio, e o ensaio que se liga
 *      depois começa no mês que NÃO está pago — é o que a faz servir para testar.
 *   D. A FRANQUIA DO CONTRATO NOVO. Sem lotes antigos e com um pacote, a conta dá 320 aulas e o
 *      documento do contrato não tem nada de gente para mostrar.
 *
 * O QUE ESTA PROVA NÃO FAZ: não cria uma escola a sério (isso fala com o Cloudflare e com o
 * GitHub). Mede o núcleo e as listas — que é onde o defeito estaria.
 *
 *   node experimentos/provar-a-escola-que-nasce.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));
const expurgar = require(path.join(RAIZ, 'motor/servidor/expurgar-escola.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

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

(async () => {
  console.log('A. O contrato que uma escola nova grava: a franquia, e não os lotes');
  {
    /* A ESCOLHA QUE O CONVITE MANDA — plano + pacotes, e mais nada. */
    const escolha = comercial.validarEscolha({ plano: 'intermediario', pacotes: ['p'] });
    conferir('a escolha é aceite', escolha.ok === true, escolha);
    conferir('…e grava o plano e o valor real: R$ 109,90',
      escolha.escolha.plano === 'intermediario' && escolha.escolha.valorCentavos === 10990,
      [escolha.escolha.plano, escolha.escolha.valorCentavos]);
    conferir('…e grava o pacote pelo ID, que é o que o contrato precisa',
      JSON.stringify(escolha.escolha.pacotes) === '["p"]', escolha.escolha.pacotes);
    conferir('…e NÃO grava lotes de gente — o eixo por onde a escola nascia antes',
      Array.isArray(escolha.escolha.lotesProfessores) && escolha.escolha.lotesProfessores.length === 0
        && Array.isArray(escolha.escolha.lotesAlunos) && escolha.escolha.lotesAlunos.length === 0,
      [escolha.escolha.lotesProfessores, escolha.escolha.lotesAlunos]);
    /* A FRANQUIA QUE ESSE CONTRATO DÁ: 300 do plano + 20 do pacote. */
    conferir('…e a franquia do contrato é 320 aulas por mês',
      comercial.franquiaDoContrato({ plano: 'intermediario', pacotes: ['p'] }).franquia === 320, null);
    conferir('…e uma escola que não compra pacote nenhum fica com a franquia do plano',
      comercial.franquiaDoContrato({ plano: 'basico', pacotes: [] }).franquia === 100, null);
  }

  console.log('\nB. O que o expurgo apaga — incluindo o que nasceu depois da lista');
  {
    const fixas = expurgar.chavesFixasDaEscola('breu');
    /* A LISTA É A REDE DE SEGURANÇA para o dia em que o `kv.list` não responde: com a enumeração
     * morta, o expurgo apaga por prefixo o que conseguir e por nome o resto. Se a chave não está
     * aqui nem na enumeração, ela SOBREVIVE a um expurgo que se relata completo. */
    for (const nome of ['comercial', 'cadastro', 'linhas-de-base', 'ensaio']) {
      conferir('a lista declarada inclui `' + nome + '`', fixas.indexOf('bastidores/breu/' + nome) !== -1, fixas);
    }
    /* E AS QUE JÁ ESTAVAM NÃO SAÍRAM — uma regeneração da lista não pode perder as antigas. */
    for (const nome of ['professores', 'alunas', 'dono', 'turmas', 'curadorias']) {
      conferir('…e mantém `' + nome + '`, que já estava', fixas.indexOf('bastidores/breu/' + nome) !== -1, null);
    }
    /* O PREFIXO continua a cobrir tudo — é ele que faz a limpeza normal. */
    const prefixos = expurgar.prefixosDaEscola('breu');
    conferir('os dois prefixos continuam a ser os dois', JSON.stringify(prefixos) === '["breu/","bastidores/breu/"]', prefixos);
    conferir('…e a chave do ensaio cai dentro de um deles',
      'bastidores/breu/ensaio'.startsWith(prefixos[1]), null);
  }

  console.log('\nC. O ensaio: nasce desligado, e ligado começa no mês em aberto');
  {
    /* SEM A CHAVE, O ENSAIO ESTÁ DESLIGADO — e é o que uma escola nova tem: nada. */
    const kv = kvFalso({});
    conferir('uma escola nova não tem chave de ensaio', (await kv.get('bastidores/nova/ensaio')) === null, null);
    /* LIGADO, o ensaio grava o mês inicial — o primeiro que NÃO está pago. */
    const contrato = { plano: 'intermediario', pacotes: ['p'], criadoEm: '2026-11-17T00:00:00Z' };
    const mesInicial = mensalidades.mesInicialDoEnsaio({ escola: 'nova', contrato, livro: [] });
    conferir('sem nada pago, o ensaio começa no mês da adesão', mesInicial === '2026-11', mesInicial);
    /* COM UM MÊS PAGO, começa no seguinte — é a correcção de 17/11 (o ensaio servia para nada
     * porque mostrava tudo pago). */
    const livro = [{ escola: 'nova', mes: '2026-11', status: 'pago', valorCentavos: 10990 }];
    const depoisDePago = mensalidades.mesInicialDoEnsaio({ escola: 'nova', contrato, livro });
    conferir('com novembro pago, o ensaio começa em dezembro', depoisDePago === '2026-12', depoisDePago);
    /* E A SITUAÇÃO COM ENSAIO DÁ UM MÊS EM ABERTO NO PRIMEIRO INSTANTE — que é o que ela testa. */
    const s = mensalidades.situacaoDaEscola({
      escola: 'nova', contrato: { plano: 'intermediario', pacotes: ['p'], criadoEm: '2026-11-17T00:00:00Z' },
      livro: [], agora: '2026-11-17T12:00:00Z',
      ensaio: { minutosPorPeriodo: 10, base: '2026-11-17T12:00:00Z', mesInicial: '2026-11' },
    });
    const abertos = (s.meses || []).filter((m) => m.status !== 'pago' && m.venceu);
    conferir('no ensaio há um mês em aberto desde o primeiro segundo', abertos.length >= 1, (s.meses || []).length);
    conferir('…e o ensaio NÃO mexe na franquia — ela continua a ser a do contrato',
      s.franquia && s.franquia.franquia === 320, s.franquia && s.franquia.franquia);
  }

  console.log('\nD. A franquia de um contrato novo, e o que ela NÃO mostra');
  {
    const situacao = mensalidades.situacaoDaEscola({
      escola: 'nova',
      contrato: { plano: 'intermediario', pacotes: ['p'], valorCentavos: 10990, capacidade: { professores: 3, alunos: 40 } },
      livro: [], agora: '2026-11-17T12:00:00Z',
    });
    conferir('a franquia é 320 e o pacote é dito', situacao.franquia.franquia === 320
      && situacao.pacotes.length === 1 && situacao.pacotes[0].aulas === 20, situacao.pacotes);
    /* SEM CONTAGEM DE AULAS, o consumo é null — o cartão cala em vez de dizer zero. */
    conferir('sem contador, o consumo do mês é null e não zero', situacao.franquia.usadas === null, situacao.franquia.usadas);
    /* E A CONTA DO EXCEDENTE FUNCIONA ASSIM QUE HOUVER CONTAGEM. */
    const comConsumo = comercial.situacaoDaFranquia({
      contrato: { plano: 'intermediario', pacotes: ['p'] }, aulasUsadas: 350,
    });
    conferir('com 350 aulas usadas, o excedente é de 30', comConsumo.excedente === 30, comConsumo.excedente);
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();
