#!/usr/bin/env node
'use strict';

/*
 * provar-restaurar-retrato.js — o último retrato de uma escola volta, e o que não cabe fica de fora
 * (16/11/2026).
 *
 * A REGRA É DELA, ao pé da letra: «Avisa que dados serão perdidos e pergunta se quer mesmo esse: sim
 * então restaura com a capacidade do que está sendo contratado; não, então a pessoa escolhe outro
 * plano. A escolha do que fica é sequencial em ordem decrescente. Ou seja recupera os mais
 * recentes.»
 *
 * O QUE ESTA PROVA MEDE, e por que cada parte dela é preciso:
 *
 *   A. QUEM UM DOCUMENTO DESCREVE. `aluna` (a anamnese) e `sujeitos` (o PO) são a mesma pergunta
 *      com dois nomes — uma leitura que só conhecesse um perderia metade do acervo.
 *   B. A ORDEM É O TEMPO. Quem aparece no documento mais recente fica; a data do documento PRÓPRIO
 *      desempata, porque um PO que cobre cinco alunas dá às cinco a mesma data, e sem desempate a
 *      vaga decidia-se pelo nome — alfabético, e portanto arbitrário.
 *   C. AS TRÊS GUARDAS DO CORTE. Um documento de alunas segue as alunas (basta UMA ficar); um
 *      documento do professor segue o professor; um documento sem dono nenhum FICA — a dúvida não
 *      destrói. E a cadeia dos ajustes não pode ficar pendurada: sai o ajuste, não a base.
 *   D. O CLI A CORRER, num repositório de verdade: `git init`, os envelopes, um commit de expurgo
 *      que os apaga, o elo a apontar para o commit anterior. Os ficheiros voltam, o índice volta
 *      filtrado — e uma segunda passagem não estraga o que a primeira fez.
 *
 *   node experimentos/provar-restaurar-retrato.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const retrato = require(path.join(RAIZ, 'motor/nucleo/retrato.js'));

let ok = 0;
let ko = 0;
function conferir(titulo, condicao, dado) {
  if (condicao) { ok += 1; console.log('  ok    ' + titulo); return; }
  ko += 1;
  console.log('  FALHA ' + titulo + (dado === undefined ? '' : '  → ' + JSON.stringify(dado)));
}

/** Um índice do acervo, na forma que o `indice-acervo.js` escreve (versão 4, `nomes` + `resumos`). */
function indiceDe(documentos) {
  const nomes = [];
  const resumos = {};
  for (const d of documentos) {
    const nome = d.nome + '.json';
    nomes.push(nome);
    resumos[nome] = Object.assign({ id: d.nome, escola: 'teste' }, d.resumo);
  }
  return { versao: 4, nomes, resumos };
}

(async () => {
  console.log('\nA. Quem um documento descreve');
  {
    const anamnese = { aluna: 'Ana', professor: 'p1' };
    const po = { sujeitos: ['Ana', 'Bia'], professor: 'p1' };
    const plano = { professor: 'p1' };
    conferir('a anamnese descreve a aluna', retrato.donosDoResumo(anamnese).alunos.join() === 'Ana', null);
    conferir('o PO descreve os `sujeitos` — e são vários',
      retrato.donosDoResumo(po).alunos.join() === 'Ana,Bia', retrato.donosDoResumo(po));
    conferir('o plano não descreve aluna nenhuma, só o professor',
      retrato.donosDoResumo(plano).alunos.length === 0 && retrato.donosDoResumo(plano).professor === 'p1', null);
    conferir('um `sujeitos` repetido conta uma vez',
      retrato.donosDoResumo({ sujeitos: ['Ana', 'Ana'] }).alunos.length === 1, null);
    /* A DATA VEM DO RESUMO, e o nome é a última reserva: um resumo antigo sem `gerado_em` tem o
     * carimbo dentro do próprio nome do ficheiro. */
    conferir('a data sai do resumo',
      retrato.dataDoResumo('x.json', { gerado_em: '2026-03-01T10:00' }) === '2026-03-01T10:00', null);
    conferir('…e, sem ela, do carimbo do nome',
      retrato.dataDoResumo('anamnese-20260215-1930.json', {}) === '2026-02-15T19:30',
      retrato.dataDoResumo('anamnese-20260215-1930.json', {}));
    conferir('…e sem nenhuma das duas, vazio (e o vazio ordena por último)',
      retrato.dataDoResumo('x.json', {}) === '', null);
  }

  console.log('\nB. A ordem é o tempo, e o que fica são os mais recentes');
  {
    const indice = indiceDe([
      { nome: 'anamnese-ana', resumo: { professor: 'p1', gerado_em: '2026-01-10T10:00', aluna: 'Ana' } },
      { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-02-10T10:00', aluna: 'Bia' } },
      { nome: 'anamnese-cida', resumo: { professor: 'p1', gerado_em: '2026-03-10T10:00', aluna: 'Cida' } },
    ]);
    const contagem = retrato.contar(indice);
    conferir('a contagem ordena do mais recente para o mais antigo',
      contagem.alunos.map((a) => a.nome).join() === 'Cida,Bia,Ana', contagem.alunos.map((a) => a.nome));

    const um = retrato.escolher(indice, { professores: 9, alunos: 1 });
    conferir('com uma vaga, fica a aluna do documento mais recente',
      um.alunos.mantidos.join() === 'Cida' && um.alunos.descartados.join() === 'Bia,Ana', um.alunos);
    conferir('…e só o documento dela volta', um.mantidos.join() === 'anamnese-cida.json', um.mantidos);
    conferir('…e a escolha diz que NÃO cabe', um.cabe === false, um.cabe);

    const todos = retrato.escolher(indice, { professores: 9, alunos: 9 });
    conferir('com vaga para todas, cabe — e nada é descartado',
      todos.cabe === true && todos.descartados.length === 0, todos.documentos);

    /* O DESEMPATE. Um PO de março cobre Ana e Bia; Cida tem a anamnese mais recente. As três têm a
     * mesma «última aparição»? Não: Ana e Bia estão no PO de 05/03, Cida na anamnese de 10/03. O
     * que se mede aqui é o desempate entre DUAS que aparecem no mesmo PO. */
    const comPo = indiceDe([
      { nome: 'anamnese-ana', resumo: { professor: 'p1', gerado_em: '2026-01-10T10:00', aluna: 'Ana' } },
      { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-02-10T10:00', aluna: 'Bia' } },
      { nome: 'po-turma', resumo: { professor: 'p1', gerado_em: '2026-03-05T10:00', sujeitos: ['Ana', 'Bia'] } },
    ]);
    const empate = retrato.escolher(comPo, { professores: 9, alunos: 1 });
    conferir('no empate (as duas no mesmo PO), fica a do documento PRÓPRIO mais recente',
      empate.alunos.mantidos.join() === 'Bia', empate.alunos.mantidos);
  }

  console.log('\nC. As três guardas do corte');
  {
    /* 1. UM PO PARTILHADO NÃO CAI COM UMA DAS SUAS ALUNAS. */
    const partilhado = indiceDe([
      { nome: 'anamnese-ana', resumo: { professor: 'p1', gerado_em: '2026-01-01T10:00', aluna: 'Ana' } },
      { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-03-01T10:00', aluna: 'Bia' } },
      { nome: 'po-turma', resumo: { professor: 'p1', gerado_em: '2026-03-05T10:00', sujeitos: ['Ana', 'Bia'] } },
    ]);
    const corta = retrato.escolher(partilhado, { professores: 9, alunos: 1 });
    conferir('o PO que também descreve quem ficou NÃO é descartado',
      corta.mantidos.indexOf('po-turma.json') !== -1, corta.mantidos);
    conferir('…mas a anamnese de quem saiu sai com ela',
      corta.descartados.join() === 'anamnese-ana.json', corta.descartados);

    /* 2. UM DOCUMENTO DO PROFESSOR SEGUE O PROFESSOR. */
    const doisProfs = indiceDe([
      { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-03-01T10:00', aluna: 'Bia' } },
      { nome: 'plano-p1', resumo: { professor: 'p1', gerado_em: '2026-02-01T10:00' } },
      { nome: 'plano-p2', resumo: { professor: 'p2', gerado_em: '2026-02-20T10:00' } },
    ]);
    const umProf = retrato.escolher(doisProfs, { professores: 1, alunos: 9 });
    /* O p1 tem a anamnese de MARÇO (é o documento mais recente da escola) e o p2 só o plano de
     * fevereiro: fica o p1 — a data que conta é a do documento, e não a da criação do professor. */
    conferir('com um professor, fica o do documento mais recente',
      umProf.professores.mantidos.join() === 'p1' && umProf.professores.descartados.join() === 'p2',
      umProf.professores);
    conferir('…e o plano do professor que saiu sai com ele',
      umProf.mantidos.indexOf('plano-p2.json') === -1
        && umProf.mantidos.indexOf('plano-p1.json') !== -1, umProf.mantidos);

    /* 3. O QUE NÃO SE CONSEGUE ATRIBUIR, FICA. */
    const semDono = indiceDe([
      { nome: 'orfao', resumo: { gerado_em: '2020-01-01T10:00' } },
      { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-03-01T10:00', aluna: 'Bia' } },
    ]);
    const guarda = retrato.escolher(semDono, { professores: 0, alunos: 0 });
    conferir('um documento sem dono nenhum é restaurado — a dúvida não destrói',
      guarda.mantidos.indexOf('orfao.json') !== -1, guarda.mantidos);

    /* 4. A CADEIA DOS AJUSTES NÃO PODE FICAR PENDURADA. */
    const ajuste = indiceDe([
      { nome: 'po-base', resumo: { professor: 'p1', gerado_em: '2026-01-01T10:00' } },
      { nome: 'po-ajuste', resumo: { professor: 'p1', gerado_em: '2026-02-01T10:00', ajuste_de: 'po-base' } },
    ]);
    const inteiro = retrato.escolher(ajuste, { professores: 1, alunos: 9 });
    conferir('com a base e o ajuste dentro da capacidade, ficam os dois',
      inteiro.mantidos.length === 2, inteiro.mantidos);
    /* Fora a base (por um professor diferente), o ajuste não pode ficar sozinho a apontar para o
     * vazio. O caso real: um PO de ajuste cujo professor saiu. */
    const orfaoDeAjuste = indiceDe([
      { nome: 'po-base', resumo: { professor: 'p2', gerado_em: '2026-01-01T10:00' } },
      { nome: 'po-ajuste', resumo: { professor: 'p1', gerado_em: '2026-02-01T10:00', ajuste_de: 'po-base' } },
    ]);
    const semBase = retrato.escolher(orfaoDeAjuste, { professores: 1, alunos: 9 });
    conferir('o ajuste cuja base saiu também sai — nada aponta para o vazio',
      semBase.mantidos.join() === 'po-ajuste.json' ? false : true, semBase.mantidos);
  }

  console.log('\nD. O índice do acervo volta FILTRADO');
  {
    const indice = indiceDe([
      { nome: 'anamnese-ana', resumo: { professor: 'p1', gerado_em: '2026-01-10T10:00', aluna: 'Ana' } },
      { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-03-10T10:00', aluna: 'Bia' } },
    ]);
    const escolha = retrato.escolher(indice, { professores: 1, alunos: 1 });
    const filtrado = JSON.parse(retrato.indiceFiltrado(indice, escolha));
    conferir('o índice filtrado só lista o que ficou', filtrado.nomes.join() === 'anamnese-bia.json', filtrado.nomes);
    conferir('…e só os resumos deles', Object.keys(filtrado.resumos).join() === 'anamnese-bia.json',
      Object.keys(filtrado.resumos));
    conferir('…e mantém a versão do formato, para não parecer um índice antigo', filtrado.versao === 4, filtrado.versao);
    /* Um índice antigo usava `envelopes` em vez de `nomes`; os dois voltam com a mesma lista. */
    const antigo = { versao: 3, envelopes: ['a.json'], resumos: {} };
    const f2 = JSON.parse(retrato.indiceFiltrado(antigo, { mantidos: [] }));
    conferir('num índice antigo, a chave `envelopes` também é filtrada',
      Array.isArray(f2.envelopes) && f2.envelopes.length === 0, f2.envelopes);
  }

  console.log('\nE. O CLI a correr, num repositório de verdade');
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retrato-'));
    const git = (args) => execFileSync('git', args, { cwd: tmp, encoding: 'utf8', stdio: 'pipe' }).trim();
    try {
      fs.mkdirSync(path.join(tmp, 'tools'), { recursive: true });
      fs.mkdirSync(path.join(tmp, 'motor/nucleo'), { recursive: true });
      fs.copyFileSync(path.join(RAIZ, 'tools/restaurar-retrato.js'), path.join(tmp, 'tools/restaurar-retrato.js'));
      fs.copyFileSync(path.join(RAIZ, 'motor/nucleo/retrato.js'), path.join(tmp, 'motor/nucleo/retrato.js'));
      git(['init', '-q']);
      git(['config', 'user.email', 'prova@exemplo.test']);
      git(['config', 'user.name', 'Prova']);
      git(['config', 'commit.gpgsign', 'false']);

      const escola = path.join(tmp, 'escola', 'teste');
      fs.mkdirSync(path.join(escola, 'envelopes'), { recursive: true });
      const docs = indiceDe([
        { nome: 'anamnese-ana', resumo: { professor: 'p1', gerado_em: '2026-01-10T10:00', aluna: 'Ana' } },
        { nome: 'anamnese-bia', resumo: { professor: 'p1', gerado_em: '2026-03-10T10:00', aluna: 'Bia' } },
        { nome: 'anamnese-cida', resumo: { professor: 'p1', gerado_em: '2026-04-10T10:00', aluna: 'Cida' } },
        { nome: 'plano-p1', resumo: { professor: 'p1', gerado_em: '2026-02-10T10:00' } },
      ]);
      fs.writeFileSync(path.join(escola, 'envelopes', '.indice.json'), JSON.stringify(docs, null, 2));
      for (const nome of docs.nomes) {
        fs.writeFileSync(path.join(escola, 'envelopes', nome), JSON.stringify({ id: nome.replace('.json', '') }));
      }
      fs.writeFileSync(path.join(escola, 'indice.json'), JSON.stringify({ escola: 'teste', professor: { slug: 'p1' } }));
      git(['add', '-A']);
      git(['commit', '-qm', 'a escola inteira']);
      const antes = git(['rev-parse', 'HEAD']);

      /* O EXPURGO: apaga o acervo e acrescenta o elo — como o `apagarEscolaDoRepo` faz. */
      fs.rmSync(path.join(escola, 'envelopes'), { recursive: true, force: true });
      const elo = JSON.parse(fs.readFileSync(path.join(escola, 'indice.json'), 'utf8'));
      elo.expurgo = [{ em: '2026-05-01T00:00:00.000Z', apagado: docs.nomes, commit_antes: antes }];
      fs.writeFileSync(path.join(escola, 'indice.json'), JSON.stringify(elo, null, 2));
      git(['add', '-A']);
      git(['commit', '-qm', 'expurgar a escola teste']);

      conferir('o cenário está montado: o acervo não existe na árvore, e o elo aponta o retrato',
        !fs.existsSync(path.join(escola, 'envelopes')), null);

      /* 1. A SECO NÃO ESCREVE NADA. */
      const seco = execFileSync(process.execPath, [path.join(tmp, 'tools/restaurar-retrato.js'),
        '--escola', 'teste', '--professores', '1', '--alunos', '2', '--seco'],
      { cwd: tmp, encoding: 'utf8' });
      /* Três alunas, capacidade para duas: fica uma de fora — e dos quatro documentos ficam três,
       * porque o plano é do professor, que fica. */
      conferir('a passagem a seco diz o que faria e não escreve',
        /documentos no retrato: 4 — ficam 3, saem 1/.test(seco)
          && /alunas: 3 → ficam 2/.test(seco)
          && !fs.existsSync(path.join(escola, 'envelopes')), seco.split('\n').slice(1, 5));

      /* 2. A SÉRIO, COM CAPACIDADE PARA DUAS ALUNAS. */
      const saida = execFileSync(process.execPath, [path.join(tmp, 'tools/restaurar-retrato.js'),
        '--escola', 'teste', '--professores', '1', '--alunos', '2'],
      { cwd: tmp, encoding: 'utf8' });
      const voltaram = fs.readdirSync(path.join(escola, 'envelopes')).sort();
      conferir('os documentos que cabem voltam para a árvore',
        voltaram.indexOf('anamnese-cida.json') !== -1 && voltaram.indexOf('anamnese-bia.json') !== -1,
        voltaram);
      conferir('…e o da aluna mais antiga NÃO volta',
        voltaram.indexOf('anamnese-ana.json') === -1, voltaram);
      conferir('…e o do professor volta, porque ele ficou',
        voltaram.indexOf('plano-p1.json') !== -1, voltaram);
      conferir('…e o índice do acervo volta filtrado',
        JSON.parse(fs.readFileSync(path.join(escola, 'envelopes', '.indice.json'), 'utf8'))
          .nomes.indexOf('anamnese-ana.json') === -1, voltaram);
      conferir('…e o relatório diz quem saiu, pelo nome', /Ana/.test(saida) && /AVISO/.test(saida), saida.split('\n').slice(0, 8));

      /* 3. A SEGUNDA PASSAGEM NÃO ESTRAGA O QUE A PRIMEIRA FEZ. */
      const outra = execFileSync(process.execPath, [path.join(tmp, 'tools/restaurar-retrato.js'),
        '--escola', 'teste', '--professores', '1', '--alunos', '2'],
      { cwd: tmp, encoding: 'utf8' });
      const depois = fs.readdirSync(path.join(escola, 'envelopes')).sort();
      conferir('a segunda passagem escreve o mesmo, e não duplica nada',
        JSON.stringify(depois) === JSON.stringify(voltaram), depois);
      conferir('…e diz o mesmo', /escritos 3 documento/.test(outra), outra.split('\n').slice(-2));

      /* 4. SEM RETRATO, NÃO INVENTA. */
      const sem = execFileSync(process.execPath, [path.join(tmp, 'tools/restaurar-retrato.js'),
        '--escola', 'outra', '--professores', '1', '--alunos', '1', '--seco'],
      { cwd: tmp, encoding: 'utf8' });
      conferir('uma escola sem retrato não inventa documentos',
        /não tem retrato conhecido/.test(sem) && !fs.existsSync(path.join(tmp, 'escola', 'outra', 'envelopes')), sem.trim());
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  console.log('');
  console.log(ko === 0
    ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
