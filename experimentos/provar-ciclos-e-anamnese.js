#!/usr/bin/env node
'use strict';

/**
 * provar-ciclos-e-anamnese.js — a sequência dos ciclos, a guarda da exclusão, e a anamnese
 * atemporal (04/11/2026).
 *
 * O QUE ELE MEDE, e cada ponto é uma regra de negócio que a pesquisadora enunciou:
 *
 *   1. **A sequência é estrita.** O próximo ciclo é `01` numa escola nova, e o seguinte ao maior
 *      quando a sequência está inteira. Com um BURACO (01 e 03 sem o 02) não há «próximo» — e o
 *      sistema diz isso em vez de inventar o número que taparia a lacuna.
 *   2. **Um ciclo existe porque tem documento.** A lista vem do índice dos envelopes, e uma
 *      anamnese NÃO cria ciclo (ela é do sujeito, e o envelope dela deixa de declarar um).
 *   3. **A exclusão guarda o último.** Apagar um ciclo que tem posteriores é RECUSADO com o nome
 *      do que impede: o `parentHash` do seguinte aponta para a âncora deste, e apagá-lo partiria
 *      a cadeia sem remédio (P-03). O último apaga-se.
 *   4. **A exclusão leva o gerado e deixa a origem.** O pacote, as fontes derivadas, o `.conf` e
 *      as âncoras saem; a anamnese e o plano de ensino ficam — e o plano fica LIVRE sem se lhe
 *      tocar, porque o vínculo PO ↔ PE é derivado.
 *   5. **O padrão do ciclo não come outra variante.** A variante `breu` NÃO pode casar os
 *      ficheiros de `breu-bale-nivel-1-teste-3`: um padrão frouxo apagaria o ciclo do vizinho.
 *
 * O QUE ELE NÃO FAZ: não vai ao GitHub. A árvore e o commit são um GitHub falso, com as três
 * respostas que a rotina usa (`trees`, `commits`, `refs`) — as mesmas que
 * `provar-corrida-da-escrita` já exercita.
 *
 *   node experimentos/provar-ciclos-e-anamnese.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const porta = require(path.join(RAIZ, 'motor/nucleo/porta.js'));
const { criarMemoria } = require(path.join(RAIZ, 'motor/nucleo/armazenamento.js'));
const repo = require(path.join(RAIZ, 'motor/servidor/repo-escola.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}
function bloco(titulo) { console.log('\n' + titulo); }

/* ------------------------------------------------------------------ o GitHub falso
 *
 * A rotina de exclusão faz quatro pedidos: a árvore (para saber o que existe), a base do git
 * (commit + tree), o `POST trees`, o `POST commits` e o `PATCH refs`. O falso responde a esses e
 * registra o que lhe pediram — é do REGISTO que saem as asserções sobre o que foi apagado.
 */
function githubFalso({ caminhos, falharNoPatch } = {}) {
  const registo = { commits: [], arvores: [], patch: [] };
  const fetchImpl = async (url, init) => {
    const u = String(url);
    const corpo = init && init.body ? JSON.parse(init.body) : null;
    const metodo = (init && init.method) || 'GET';
    if (/\/git\/trees\/[^/]+$/.test(u) && metodo === 'GET') {
      /* `type: 'blob'` — `arvoreDeCaminhos` filtra por ele (as árvores do Git têm `tree` e
       * `blob`, e só o segundo é ficheiro). Sem o campo, a lista saía vazia e a exclusão
       * respondia «o ciclo não existe» a um ciclo que estava à frente. */
      return {
        ok: true,
        status: 200,
        json: async () => ({ tree: caminhos.map((p) => ({ path: p, type: 'blob' })) }),
      };
    }
    /* A REFERÊNCIA (`/git/ref/heads/main`, singular) — é dela que sai o commit de base. O
     * padrão `/git/commits/…` de baixo não a apanha, e a rotina respondia «a referência não
     * devolveu commit». */
    if (/\/git\/ref\/heads\//.test(u) && metodo === 'GET') {
      return { ok: true, status: 200, json: async () => ({ object: { sha: 'base-commit' } }) };
    }
    if (/\/git\/commits\/[^/]+$/.test(u) && metodo === 'GET') {
      return { ok: true, status: 200, json: async () => ({ sha: 'base-commit', tree: { sha: 'base-tree' } }) };
    }
    if (/\/git\/trees$/.test(u) && metodo === 'POST') {
      registo.arvores.push(corpo);
      return { ok: true, status: 201, json: async () => ({ sha: 'nova-tree' }) };
    }
    if (/\/git\/commits$/.test(u) && metodo === 'POST') {
      registo.commits.push(corpo);
      return { ok: true, status: 201, json: async () => ({ sha: 'novo-commit' }) };
    }
    if (/\/git\/refs\/heads\//.test(u) && metodo === 'PATCH') {
      registo.patch.push(corpo);
      if (falharNoPatch) return { ok: false, status: 422, json: async () => ({ message: 'not a fast forward' }) };
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    // Qualquer outro GET (o conteúdo de um ficheiro) devolve null: não há índice a ler.
    return { ok: true, status: 404, json: async () => null, text: async () => '' };
  };
  return { fetchImpl, registo };
}

async function main() {
  // ------------------------------------------------------------------ 1. a sequência
  bloco('1. A SEQUÊNCIA É ESTRITA — E O BURACO NÃO SE TAPA');
  {
    provar('escola nova: o próximo ciclo é 01', porta.proximoCiclo([]) === '01', porta.proximoCiclo([]));
    provar('com 01: o próximo é 02', porta.proximoCiclo(['01']) === '02');
    provar('com 01 e 02: o próximo é 03',
      porta.proximoCiclo([{ ciclo: '01' }, { ciclo: '02' }]) === '03');
    /* A ORDEM É NUMÉRICA, e a prova fá-lo com dez ciclos: em texto, `'10'` ordena antes de `'2'`
     * e o «próximo» sairia 03. É o mesmo defeito de contar texto que já apareceu nas aulas. */
    const dez = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    provar('com dez ciclos, o próximo é 11', porta.proximoCiclo(dez) === '11', porta.proximoCiclo(dez));
    provar('CONTROLE NEGATIVO: com um buraco (01, 03) NÃO há próximo honesto',
      porta.proximoCiclo(['01', '03']) === null, porta.proximoCiclo(['01', '03']));
    provar('…e o mesmo com 01, 02 e 10 (faltam o 3 ao 9)',
      porta.proximoCiclo(['01', '02', '10']) === null);
  }

  // ------------------------------------------------------- 2. os ciclos vêm do documento
  bloco('2. UM CICLO EXISTE PORQUE TEM DOCUMENTO — E A ANAMNESE NÃO CRIA CICLO');
  {
    const mem = criarMemoria();
    const base = { escola: 'breu', professor: 'coqui-de-redinha' };
    /* O ÍNDICE É AUTORITATIVO, e a escrita directa não o refaz. Em produção quem o mantém é o
     * `gravarEnvelope` (uma porta só); aqui, escrever ficheiros à mão obriga a apagá-lo — senão
     * a segunda leitura devolve o índice antigo e a asserção mede um estado que já não existe.
     * É a mesma armadilha que a `provar-listas-do-acervo` documenta. */
    const escrever = async (id, ctx) => {
      await mem.apagar(porta.INDICE_DOS_ENVELOPES);
      return mem.guardar('envelope/' + id + '.json', JSON.stringify({ id, contexto: ctx, respostas: {} }));
    };
    await escrever('plano-20261103-2200', Object.assign({}, base, { ciclo: '01' }));
    await escrever('po-20261103-2242', Object.assign({}, base, { ciclo: '01' }));
    await escrever('plano-20261104-1000', Object.assign({}, base, { ciclo: '02' }));
    /* A ANAMNESE SEM CICLO — é o que a decisão de 04/11/2026 produz: o envelope dela deixa de
     * declarar um ciclo, porque ela é do sujeito. Se ela criasse um ciclo, a lista passaria a
     * oferecer ciclos que não têm plano nenhum. */
    await escrever('anamnese-20261103-1626', Object.assign({}, base, { aluna: 'Aluna A' }));

    const ciclos = await porta.ciclosDaEscola(mem, { escola: 'breu', professor: 'coqui-de-redinha' });
    provar('lê os dois ciclos, e só eles', ciclos.map((c) => c.ciclo).join(',') === '01,02',
      ciclos.map((c) => c.ciclo));
    provar('a anamnese sem ciclo NÃO inventa um', ciclos.length === 2, ciclos);
    provar('conta os planos e os POs de cada ciclo',
      ciclos[0].planos === 1 && ciclos[0].pos === 1, ciclos[0]);
    provar('…e diz quais têm plano de ensino (é o que o PO pode observar)',
      ciclos[0].temPlano === true && ciclos[1].temPlano === true);
    provar('o próximo ciclo, depois de 01 e 02, é 03', porta.proximoCiclo(ciclos) === '03');

    /* O CICLO SEM PLANO: um PO não pode existir sem PE, mas um ciclo com um PO «solto» também
     * não se oferece ao seletor do PO. */
    await escrever('po-20261104-1100', Object.assign({}, base, { ciclo: '03' }));
    const comTerceiro = await porta.ciclosDaEscola(mem, { escola: 'breu', professor: 'coqui-de-redinha' });
    provar('um ciclo só com PO fica marcado sem plano',
      comTerceiro.find((c) => c.ciclo === '03').temPlano === false, comTerceiro);
  }

  // ------------------------------------------------------------- 3. a guarda da exclusão
  bloco('3. A EXCLUSÃO GUARDA O ÚLTIMO — E DIZ PORQUÊ QUANDO RECUSA');
  {
    const variante = 'breu-bale-nivel-1-teste-3';
    const caminhos = [
      'professores/coqui-de-redinha/ciclos/ciclo-01-' + variante + '.md',
      'professores/coqui-de-redinha/ciclos/ciclo-01-' + variante + '.fipp',
      'professores/coqui-de-redinha/ciclos/ciclo-01-' + variante + '/aula-01.html',
      'professores/coqui-de-redinha/ciclos/ciclo-01-' + variante + '-aula-01.fipp',
      'professores/coqui-de-redinha/ciclos/ciclo-02-' + variante + '.md',
      'professores/coqui-de-redinha/ciclos/ciclo-02-' + variante + '.fipp',
    ];
    const { fetchImpl, registo } = githubFalso({ caminhos });
    const comum = { token: 't', dono: 'd', repo: 'r', ref: 'main', escola: 'breu',
      professor: 'coqui-de-redinha', variante, fetchImpl };

    const intermedio = await repo.apagarCicloDoRepo(Object.assign({}, comum, { ciclo: '01' }));
    provar('apagar o ciclo 01 (com o 02 vivo) é RECUSADO', intermedio.ok === false, intermedio.ok);
    provar('…e a recusa tem guarda própria', intermedio.guarda === 'ultimo', intermedio.guarda);
    provar('…e nomeia o que impede', (intermedio.posteriores || []).join(',') === '02',
      intermedio.posteriores);
    provar('…e diz o que fazer (apagar de trás para a frente)',
      /de trás para a frente/.test(String(intermedio.erro)), intermedio.erro);
    provar('NADA foi escrito no GitHub quando a guarda recusa',
      registo.commits.length === 0 && registo.arvores.length === 0,
      { commits: registo.commits.length, arvores: registo.arvores.length });

    const ultimo = await repo.apagarCicloDoRepo(Object.assign({}, comum, { ciclo: '02' }));
    provar('apagar o ÚLTIMO (02) entra', ultimo.ok === true, ultimo);
    provar('…e o commit apaga os ficheiros do ciclo 02',
      registo.commits.length === 1 && ultimo.apagados.every((p) => /ciclo-02-/.test(p)),
      ultimo.apagados);
    provar('…e NÃO toca em nada do ciclo 01',
      !ultimo.apagados.some((p) => /ciclo-01-/.test(p)), ultimo.apagados);
    provar('…e o commit declara a guarda e a preservação das fontes',
      /parentHash/.test(registo.commits[0].message)
      && /anamnese é do SUJEITO/.test(registo.commits[0].message),
      registo.commits[0].message.split('\n')[0]);
  }

  // ------------------------------------------------- 4. a corrida e o padrão apertado
  bloco('4. A EXCLUSÃO PERDE A CORRIDA COMO AS OUTRAS — E O PADRÃO NÃO COME O VIZINHO');
  {
    const variante = 'breu-bale-nivel-1-teste-3';
    const caminhos = ['professores/p/ciclos/ciclo-01-' + variante + '.md',
      'professores/p/ciclos/ciclo-01-' + variante + '.fipp'];
    let patch = 0;
    const { fetchImpl } = githubFalso({ caminhos, falharNoPatch: false });
    const falso = async (url, init) => {
      const u = String(url);
      if (/\/git\/refs\/heads\//.test(u) && (init && init.method) === 'PATCH') {
        patch += 1;
        if (patch === 1) return { ok: false, status: 422, json: async () => ({}) };
      }
      return fetchImpl(url, init);
    };
    const r = await repo.apagarCicloDoRepo({ token: 't', dono: 'd', repo: 'r', ref: 'main', escola: 'breu',
      professor: 'p', variante, ciclo: '01', fetchImpl: falso });
    provar('um 422 no avanço da referência refaz o caminho e entra', r.ok === true, r);
    provar('…e diz em que tentativa entrou', r.intentos === 2, r.intentos);

    /* O PADRÃO. `ciclosDaVariante` é a régua que decide o que é «deste ciclo e desta variante».
     * Um padrão frouxo (aceitar qualquer traço) faria a variante `breu` casar os ficheiros de
     * `breu-bale-nivel-1-teste-3` — e a exclusão apagaria o ciclo de outra escola. */
    const mestre = [
      'professores/p/ciclos/ciclo-01-breu-bale-nivel-1-teste-3.md',
      'professores/p/ciclos/ciclo-01-breu-bale-nivel-1-teste-3-aula-01.fipp',
      'professores/p/ciclos/ciclo-01-breu.md',
      'professores/p/ciclos/ciclo-01-breu.conf',
    ];
    provar('a variante «breu» lê só o ciclo 01 dela',
      repo.ciclosDaVariante(mestre, 'p', 'breu').join(',') === '01',
      repo.ciclosDaVariante(mestre, 'p', 'breu'));
    provar('…e NÃO come os ficheiros de «breu-bale-nivel-1-teste-3»',
      repo.ciclosDaVariante(mestre.filter((c) => !/-breu\.(md|conf)$/.test(c)), 'p', 'breu').length === 0,
      repo.ciclosDaVariante(mestre.filter((c) => !/-breu\.(md|conf)$/.test(c)), 'p', 'breu'));
    provar('a variante longa lê o seu',
      repo.ciclosDaVariante(mestre, 'p', 'breu-bale-nivel-1-teste-3').join(',') === '01');
  }

  // --------------------------------------------------------- 5. a anamnese é atemporal
  bloco('5. A ANAMNESE É DO SUJEITO — NÃO DO CICLO');
  {
    /* A REGRA JÁ ERA VERDADEIRA NA CHAVE DA ESTANTE: duas anamneses da mesma aluna em ciclos
     * diferentes são a MESMA linha, e a mais recente é a vigente. Esta asserção existe para que
     * uma mudança futura não a desfaça sem se dar por isso — é a decisão escrita em código. */
    const resumos = [
      { id: 'anamnese-20260101-1000', fonte: 'anamnese', escola: 'breu', aluna: 'Aluna A',
        ciclo: '01', gerado_em: '2026-01-01T10:00' },
      { id: 'anamnese-20260601-1000', fonte: 'anamnese', escola: 'breu', aluna: 'Aluna A',
        ciclo: '07', gerado_em: '2026-06-01T10:00' },
    ];
    const { vigentes, historico } = porta.vigentesDaFamilia
      ? porta.vigentesDaFamilia(resumos, 'anamnese')
      : { vigentes: [], historico: {} };
    provar('a chave da anamnese NÃO tem ciclo: duas datas, um sujeito, uma linha vigente',
      vigentes.length === 1, vigentes.map((v) => v.id));
    provar('…e é a mais recente que vigora',
      vigentes[0] && vigentes[0].id === 'anamnese-20260601-1000',
      vigentes.map((v) => v.id));
    /* O HISTÓRICO É UM `Map` (id do vigente → ids que ele escondeu), e não um objecto: um
     * `historico[id]` devolveria `undefined` e a asserção passaria a medir nada. */
    const anteriores = historico instanceof Map ? historico.get(vigentes[0].id) : null;
    provar('…com a anterior declarada no histórico, e não apagada',
      Array.isArray(anteriores) && anteriores.indexOf('anamnese-20260101-1000') !== -1,
      anteriores);
  }

  // -------------------------------------------------- 6. o «Novo registo» não substitui
  bloco('6. «NOVO REGISTO» GRAVA UM REGISTO NOVO — NÃO UM ELO QUE SUBSTITUI');
  {
    const listas = require(path.join(RAIZ, 'motor/servidor/listas-do-acervo.js'));
    const acoes = listas.acoesDaLinha
      ? listas.acoesDaLinha('anamnese', { id: 'anamnese-20260101-1000', professor: 'p', aluna: 'Aluna A',
        ciclo: '01' }, { vinculada: true, estado: 'vinculada' })
      : [];
    const rotulos = acoes.map((a) => (Array.isArray(a) ? a[0] : a && a.rotulo)).filter(Boolean);
    provar('a anamnese vinculada oferece «Novo registo»', rotulos.indexOf('Novo registo') !== -1,
      rotulos);
    provar('…e NÃO oferece «Ajustar» (a edição retroativa saiu)', rotulos.indexOf('Ajustar') === -1,
      rotulos);
    const novo = acoes.find((a) => Array.isArray(a) && a[0] === 'Novo registo');
    provar('…e o endereço leva o carimbo anterior, para o formulário abrir preenchido',
      Boolean(novo) && /novo=anamnese-20260101-1000/.test(novo[1]), novo && novo[1]);
    provar('…e NÃO leva ciclo (a anamnese não tem ciclo)',
      Boolean(novo) && !/[?&]ciclo=/.test(novo[1]), novo && novo[1]);
    provar('…e diz que o registo anterior não é tocado',
      Boolean(novo) && /não é tocado/.test(String(novo[3])), novo && novo[3]);
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + total + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: a sequência é estrita e o buraco não se tapa, os '
    + 'ciclos vêm do documento (e a anamnese não cria ciclo), a exclusão guarda o último e leva só o '
    + 'gerado, a corrida refaz o caminho, o padrão não come o vizinho, a anamnese é do sujeito, e o '
    + '«Novo registo» grava um registo novo.');
}

main().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
