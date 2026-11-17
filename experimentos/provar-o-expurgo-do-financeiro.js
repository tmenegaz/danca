#!/usr/bin/env node
'use strict';

/*
 * provar-o-expurgo-do-financeiro.js — expurgar uma escola leva as mensalidades dela com ela
 * (17/11/2026).
 *
 * O PEDIDO, por palavras da proprietária: «quando você expurgar [a escola] dessa vez, essa parte
 * toda de pagamento e financeiro […] tem que deixar de existir.»
 *
 * O DEFEITO QUE ISTO MEDE, e ele é de desenho. Tudo o que é de uma escola vive sob dois prefixos —
 * `<slug>/` (o envelope e a anamnese) e `bastidores/<slug>/` (alunas, turmas, curadorias) —, e o
 * `expurgar-escola.js` apaga por prefixo, com uma lista de chaves fixas ao lado. O LIVRO DO
 * FINANCEIRO NÃO ESTÁ EM NENHUM DOS DOIS: ele vive em `financeiro/mensalidades`, **uma chave só
 * para todas as escolas**, com a lista dentro. Um prefixo nunca o alcança, por construção.
 *
 * O SINTOMA, se nada fosse feito: expurgar a `breu` deixava as mensalidades dela na lista. O
 * Financeiro passava a mostrar a conta de uma escola que já não existe, a receita do parque
 * contava-a, e o `extratoDasEscolas` procurava um contrato ausente. É a mesma família do expurgo
 * que deixava as alunas vivas no KV (`batata`, 19/10/2026): a limpeza relatava sucesso sobre o que
 * não tinha alcançado.
 *
 * O QUE ESTA PROVA MEDE:
 *
 *   A. A LIMPEZA, pura: as linhas da escola saem, as das outras ficam, e o resto do livro não se
 *      toca.
 *   B. `null` E VAZIO NÃO SÃO «correu bem»: sem KV ou sem escola, a função recusa em vez de
 *      devolver sucesso sobre nada — uma limpeza que mente é pior do que uma que falha.
 *   C. O RELATÓRIO: a função devolve QUANTAS linhas saiu, porque uma limpeza que não conta o que
 *      limpou não se distingue de uma que não correu.
 *   D. A ROTA: o expurgo do KV chama esta limpeza e leva o resultado no relatório.
 *
 *   node experimentos/provar-o-expurgo-do-financeiro.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
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

const livro = (...linhas) => JSON.stringify({ lista: linhas, atualizadoEm: '2026-11-01T00:00:00Z' });
const mes = (escola, m, valor) => ({ escola, mes: m, status: 'pago', valorCentavos: valor, em: '2026-11-01T10:00:00Z' });

(async () => {
  console.log('A. A limpeza: a escola sai, as outras ficam');
  {
    const kv = kvFalso({
      'financeiro/mensalidades': livro(
        mes('breu', '2026-11', 19990),
        mes('breu', '2026-10', 19990),
        mes('calango', '2026-11', 6990),
        mes('batata', '2026-11', 13990),
      ),
    });
    const r = await mensalidades.apagarEscolaDoLivro(kv, 'breu');
    conferir('a limpeza corre e devolve ok', r.ok === true, r);
    conferir('…e diz quantas linhas saíram: 2', r.removidas === 2, r.removidas);

    const restam = JSON.parse(await kv.get('financeiro/mensalidades')).lista;
    conferir('…e as duas da Breu já não estão lá', restam.filter((l) => l.escola === 'breu').length === 0, restam);
    conferir('…e as das OUTRAS escolas ficam — a limpeza não é um apagão',
      restam.length === 2 && restam.some((l) => l.escola === 'calango') && restam.some((l) => l.escola === 'batata'),
      restam.map((l) => l.escola));
    /* O CARIMBO DO LIVRO FICA: a limpeza é uma escrita do livro, e `atualizadoEm` é o carimbo dela. */
    conferir('…e o livro continua com o seu carimbo de actualização',
      Boolean(JSON.parse(await kv.get('financeiro/mensalidades')).atualizadoEm), null);
  }

  console.log('\nB. Uma escola que não tem linhas, e o que NÃO se considera sucesso');
  {
    const kv = kvFalso({ 'financeiro/mensalidades': livro(mes('calango', '2026-11', 6990)) });
    const r = await mensalidades.apagarEscolaDoLivro(kv, 'breu');
    conferir('uma escola sem linhas não é erro — é 0 removidas', r.ok === true && r.removidas === 0, r);
    /* E NÃO ESCREVE: sem nada a remover, o livro não se toca. Uma escrita por nada é uma alteração
     * que ninguém fez — a mesma regra do índice que não leva carimbo. */
    conferir('…e nesse caso o livro nem é reescrito',
      (await kv.get('financeiro/mensalidades')) === livro(mes('calango', '2026-11', 6990)), null);

    /* SEM KV e SEM ESCOLA: recusa, e não «ok com 0». */
    conferir('sem KV, recusa em vez de fingir que limpou',
      (await mensalidades.apagarEscolaDoLivro(null, 'breu')).ok === false, null);
    conferir('…e sem escola também — o prefixo vazio apagaria o livro inteiro',
      (await mensalidades.apagarEscolaDoLivro(kvFalso({}), '')).ok === false, null);
    conferir('…e um livro vazio ou ilegível não rebenta',
      (await mensalidades.apagarEscolaDoLivro(kvFalso({ 'financeiro/mensalidades': 'não é json' }), 'breu')).ok === true,
      null);
  }

  console.log('\nC. A limpeza não confunde escolas com nomes parecidos');
  {
    /* O `breu` e o `breu-rosa` são escolas DIFERENTES, e um prefixo mal cortado apagaria as duas. A
     * comparação é por igualdade do slug inteiro, e não por `startsWith`. */
    const kv = kvFalso({
      'financeiro/mensalidades': livro(
        mes('breu', '2026-11', 19990),
        mes('breu-rosa', '2026-11', 6990),
        mes('breu2', '2026-11', 6990),
      ),
    });
    const r = await mensalidades.apagarEscolaDoLivro(kv, 'breu');
    const restam = JSON.parse(await kv.get('financeiro/mensalidades')).lista;
    conferir('apagar `breu` remove UMA linha, e não as de `breu-rosa` nem `breu2`',
      r.removidas === 1 && restam.length === 2
        && restam.some((l) => l.escola === 'breu-rosa') && restam.some((l) => l.escola === 'breu2'),
      restam.map((l) => l.escola));
  }

  console.log('\nD. A rota do expurgo chama a limpeza e leva o resultado');
  {
    /* LIDA NO FONTE, e não executada: a rota fala com a API do Cloudflare, e uma bancada que a
     * fingisse mediria a bancada. O que se mede aqui é a LIGAÇÃO — que o expurgo chama a limpeza
     * e que o resultado entra no relatório. Sem esta asserção, a função podia existir e nunca ser
     * chamada, que é o modo de falha mais silencioso que há. */
    const fonte = require('fs').readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('o expurgo do KV chama `apagarEscolaDoLivro`', /mensalidades\.apagarEscolaDoLivro\(/.test(fonte), null);
    conferir('…e o resultado entra no relatório da limpeza, em `kv.livro`', /kv\.livro\s*=/.test(fonte), null);
    /* Uma falha na limpeza do livro NÃO pode passar por sucesso — a pendência tem de ficar. */
    conferir('…e uma falha nela marca a limpeza como incompleta', /kv\.ok\s*=\s*false/.test(fonte.slice(fonte.indexOf('apagarEscolaDoLivro('), fonte.indexOf('apagarEscolaDoLivro(') + 700)), null);
    /* E A LIMPEZA VIVE DEPOIS DO `apagarChavesDeEscola`, porque é o resultado dele que ela
     * complementa. */
    const iChaves = fonte.indexOf('apagarChavesDeEscola({');
    const iLivro = fonte.indexOf('mensalidades.apagarEscolaDoLivro(');
    conferir('…e corre depois da limpeza por prefixo, que é o que ela complementa',
      iChaves > 0 && iLivro > iChaves, { chaves: iChaves, livro: iLivro });
  }

  console.log('');
  if (ko) {
    console.log('FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + ok + ' asserção(ões).');
})();
