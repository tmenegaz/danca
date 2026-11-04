'use strict';

/*
 * provar-fusao-da-edicao.js — duas edições do MESMO documento não se apagam (decisão 84).
 *
 * O QUE A REGRA DIZ. Quando duas pessoas (ou duas abas) gravam o mesmo plano/PO, o que acontece
 * não pode ser «a última vence» sem mais:
 *
 *   1. mexeram em CAMPOS DIFERENTES → as duas edições ficam; nada se perde;
 *   2. mexeram no MESMO campo, com valores diferentes → vence a mais recente, comparada ao
 *      MILISSEGUNDO (`escrito_em`); no empate, vence a que está a ser gravada;
 *   3. sem base não há fusão — não se adivinha.
 *
 * POR QUE ESTA PROVA PASSA PELO `combinar`. Ele é o armazenamento que o Worker monta
 * (`criarArmazenamento`), e ele lista os verbos à mão. Em 04/11/2026 o `criar` nasceu no acervo
 * e ficou de fora do `combinar`: a blindagem existia no adaptador e nunca chegava ao motor, e as
 * bancadas não o viram porque montavam o acervo direto. A lição ficou na prova — as secções que
 * tocam a escrita vão pelo armazenamento COMPOSTO, e a primeira asserção mede exatamente isso.
 *
 *   node experimentos/provar-fusao-da-edicao.js
 */

const porta = require('../motor/nucleo/porta.js');
const fusao = require('../motor/nucleo/fusao.js');
const acervo = require('../motor/servidor/acervo-envelopes.js');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  ✓ ' + rotulo);
  } else {
    falhas += 1;
    console.log('  ✗ ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
  }
}

const ESCOLA = 'calango';
const SENHA = 'senha-de-teste';
const CHAVE = 'envelope/plano-20261104-1900.json';

/** Um GitHub em memória com o `sha` do contents — o suficiente para a corrida e para a fusão. */
function githubFalso() {
  const arquivos = new Map();
  const estado = { puts: 0, conflitosRestantes: 0 };
  const shaDe = (texto) => 'sha-' + Buffer.from(texto).toString('base64').slice(0, 12);
  const json = (corpo, status) => new Response(JSON.stringify(corpo), {
    status: status || 200, headers: { 'content-type': 'application/json' },
  });

  estado.fetch = async (url, opcoes) => {
    const u = new URL(url);
    const metodo = (opcoes && opcoes.method) || 'GET';
    if (u.pathname.indexOf('/git/trees/') !== -1) {
      return json({ sha: 'arvore', tree: [...arquivos.keys()].map((p) => ({ path: p, type: 'blob', sha: shaDe(arquivos.get(p)) })) });
    }
    const m = /\/contents\/(.+)$/.exec(u.pathname);
    if (!m) return json({}, 404);
    const caminho = decodeURIComponent(m[1]);
    if (metodo === 'GET') {
      if (!arquivos.has(caminho)) return new Response('not found', { status: 404 });
      return json({ sha: shaDe(arquivos.get(caminho)), content: Buffer.from(arquivos.get(caminho), 'utf8').toString('base64') });
    }
    if (metodo === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      estado.puts += 1;
      if (estado.conflitosRestantes > 0) {
        estado.conflitosRestantes -= 1;
        return json({ message: 'sha does not match' }, 409);
      }
      if (arquivos.has(caminho) && corpo.sha !== shaDe(arquivos.get(caminho))) {
        return json({ message: 'sha does not match' }, 409);
      }
      arquivos.set(caminho, Buffer.from(corpo.content, 'base64').toString('utf8'));
      return json({ commit: { sha: 'commit-' + estado.puts } }, 201);
    }
    return json({}, 405);
  };
  estado.arquivos = arquivos;
  return estado;
}

/** O armazenamento COMPOSTO — o de produção. É por aqui que a prova tem de passar. */
function armazenamentoDe(gh, extra) {
  const kv = Object.assign({
    ler: async () => null,
    guardar: async () => {},
    existe: async () => false,
    apagar: async () => false,
    listar: async () => [],
    anexar: async () => {},
  }, extra || {});
  return acervo.combinar(acervo.criarAcervoDeEnvelopes({
    token: 'token-de-teste', dono: 'tmenegaz', repo: 'danca', ref: 'main',
    escola: ESCOLA, senhaCripto: SENHA, fetchImpl: gh.fetch,
  }), kv);
}

const relatorioDe = (id) => ({
  id,
  estado: 'Input_PO_Aguardando',
  contagem: { respondidos: 1, obrigatorios: 1 },
  elos: [],
  paradas: [],
  idsDesconhecidos: [],
  validacao: { resultado: 'ok', contrato: 'x' },
  errosDoDocumento: [],
  avisos: [],
});

const envelope = (id, respostas, escritoEm) => Object.assign(
  { id, documento: 'plano', envelope: '1.3.0', gerado_em: '2026-11-04T19:00', respostas },
  escritoEm ? { escrito_em: escritoEm } : {},
);

async function main() {
  // =========================================================== A
  console.log('\nA. O armazenamento de produção encaminha os verbos novos');
  {
    const composto = armazenamentoDe(githubFalso());
    checar('o `combinar` encaminha o `criar` (a escrita condicional chega ao motor)',
      typeof composto.criar === 'function', typeof composto.criar);
    checar('e encaminha o `gravarComFusao`', typeof composto.gravarComFusao === 'function',
      typeof composto.gravarComFusao);
    /* O `anexar` também faltava, e era um defeito VIVO: o registro de custo da IA é acrescentado
     * em `rotas.js` e não é envelope, logo vai para o `resto` — e o `combinar` não o encaminhava.
     * A regra que o comentário do `combinar` declara só é verdadeira se for medida. */
    checar('e encaminha o `anexar` (o registro de custo da IA é acrescentado por ele)',
      typeof composto.anexar === 'function', typeof composto.anexar);
    let anexado = null;
    const armComAnexo = armazenamentoDe(githubFalso(), {
      anexar: async (chave, linha) => { anexado = chave + '|' + linha; },
    });
    await armComAnexo.anexar('ia-registro/registro.jsonl', '{"a":1}\n');
    checar('e o que é anexado chega ao armazenamento antigo, com a chave certa',
      anexado === 'ia-registro/registro.jsonl|{"a":1}\n', anexado);
  }

  // =========================================================== B
  console.log('\nB. Campos DIFERENTES: as duas edições ficam');
  {
    const gh = githubFalso();
    const arm = armazenamentoDe(gh);

    const original = envelope('plano-20261104-1900', {
      'objetivo-geral': { valor: 'Sustentar o equilíbrio' },
      'contexto-turma': { valor: 'Balé Nível 1' },
      repertorio: { valor: ['Cambré'] },
    }, '2026-11-04T22:00:00.000Z');
    await porta.gravarEnvelope(arm, original, relatorioDe(original.id), { substituir: false });

    // EU leio (a base é o que está), e mexo no objetivo.
    const base = JSON.parse(await arm.ler(CHAVE));
    const minha = envelope(base.id, Object.assign({}, base.respostas, {
      'objetivo-geral': { valor: 'Sustentar o equilíbrio E a respiração' },
    }), '2026-11-04T22:00:10.500Z');

    // A OUTRA PESSOA mexeu no repertório, e gravou primeiro.
    const dela = envelope(base.id, Object.assign({}, base.respostas, {
      repertorio: { valor: ['Cambré', 'Battement tendu'] },
    }), '2026-11-04T22:00:05.000Z');
    await porta.gravarEnvelope(arm, dela, relatorioDe(dela.id), { substituir: true, base });

    // Agora eu gravo, com a base que li (que já não é a do acervo).
    const r = await porta.gravarEnvelope(arm, minha, relatorioDe(minha.id), { substituir: true, base });
    checar('a minha gravação entrou', r.ok === true, r.erro);
    checar('e ela declara que HOUVE fusão', r.fundido === true, r.fundido);

    const final = JSON.parse(await arm.ler(CHAVE));
    checar('o objetivo é o MEU (eu mexi nele, ela não)', final.respostas['objetivo-geral'].valor === 'Sustentar o equilíbrio E a respiração',
      final.respostas['objetivo-geral']);
    checar('o repertório é o DELA (ela mexeu nele, eu não) — nada se perdeu',
      JSON.stringify(final.respostas.repertorio.valor) === JSON.stringify(['Cambré', 'Battement tendu']),
      final.respostas.repertorio);
    checar('e a turma, que ninguém tocou, continua', final.respostas['contexto-turma'].valor === 'Balé Nível 1');
    checar('o relato nomeia o campo unificado', Boolean(r.relatoDaFusao) &&
      r.relatoDaFusao.unidos.indexOf('repertorio') !== -1, r.relatoDaFusao);
    checar('e não houve conflito nenhum', Boolean(r.relatoDaFusao) && r.relatoDaFusao.conflitos.length === 0,
      r.relatoDaFusao && r.relatoDaFusao.conflitos);
    checar('o `escrito_em` gravado é o da MINHA escrita', final.escrito_em === '2026-11-04T22:00:10.500Z', final.escrito_em);
  }

  // =========================================================== C
  console.log('\nC. O MESMO campo: vence a edição mais recente, ao milissegundo');
  {
    const gh = githubFalso();
    const arm = armazenamentoDe(gh);
    const original = envelope('plano-20261104-1901', { 'objetivo-geral': { valor: 'A' } }, '2026-11-04T22:00:00.000Z');
    await porta.gravarEnvelope(arm, original, relatorioDe(original.id), { substituir: false });
    const base = JSON.parse(await arm.ler('envelope/plano-20261104-1901.json'));

    // A DELA é MAIS RECENTE (10.900) e chega primeiro ao acervo.
    const dela = envelope(base.id, { 'objetivo-geral': { valor: 'DELA' } }, '2026-11-04T22:00:10.900Z');
    await porta.gravarEnvelope(arm, dela, relatorioDe(dela.id), { substituir: true, base });

    // A MINHA é mais ANTIGA (10.100) — vence a dela, e a minha gravação não a atropela.
    const minha = envelope(base.id, { 'objetivo-geral': { valor: 'MINHA' } }, '2026-11-04T22:00:10.100Z');
    const r = await porta.gravarEnvelope(arm, minha, relatorioDe(minha.id), { substituir: true, base });

    const final = JSON.parse(await arm.ler('envelope/plano-20261104-1901.json'));
    checar('venceu a MAIS RECENTE (a dela, 900 ms depois)', final.respostas['objetivo-geral'].valor === 'DELA',
      final.respostas['objetivo-geral']);
    checar('e o desacordo é DECLARADO, com quem venceu', Boolean(r.relatoDaFusao) &&
      r.relatoDaFusao.conflitos.length === 1 && r.relatoDaFusao.conflitos[0].venceu === 'atual',
      r.relatoDaFusao && r.relatoDaFusao.conflitos);
  }

  // =========================================================== D
  console.log('\nD. A minha é a mais recente — e então vence a minha');
  {
    const gh = githubFalso();
    const arm = armazenamentoDe(gh);
    const original = envelope('plano-20261104-1902', { 'objetivo-geral': { valor: 'A' } }, '2026-11-04T22:00:00.000Z');
    await porta.gravarEnvelope(arm, original, relatorioDe(original.id), { substituir: false });
    const base = JSON.parse(await arm.ler('envelope/plano-20261104-1902.json'));

    const dela = envelope(base.id, { 'objetivo-geral': { valor: 'DELA' } }, '2026-11-04T22:00:10.100Z');
    await porta.gravarEnvelope(arm, dela, relatorioDe(dela.id), { substituir: true, base });
    const minha = envelope(base.id, { 'objetivo-geral': { valor: 'MINHA' } }, '2026-11-04T22:00:10.900Z');
    const r = await porta.gravarEnvelope(arm, minha, relatorioDe(minha.id), { substituir: true, base });

    const final = JSON.parse(await arm.ler('envelope/plano-20261104-1902.json'));
    checar('vence a minha (900 ms depois da dela)', final.respostas['objetivo-geral'].valor === 'MINHA',
      final.respostas['objetivo-geral']);
    checar('e o conflito diz que venceu a minha', Boolean(r.relatoDaFusao) && r.relatoDaFusao.conflitos[0].venceu === 'minha',
      r.relatoDaFusao && r.relatoDaFusao.conflitos);
  }

  // =========================================================== E
  console.log('\nE. O EMPATE vai para quem está a gravar — e é determinístico');
  {
    const base = { respostas: { x: { valor: 'A' } } };
    const minha = { respostas: { x: { valor: 'MINHA' } }, escrito_em: '2026-11-04T22:00:10.500Z' };
    const atual = { respostas: { x: { valor: 'DELA' } }, escrito_em: '2026-11-04T22:00:10.500Z' };
    const r = fusao.fundirEnvelopes({ base, minha, atual, quandoMinha: minha.escrito_em });
    checar('no empate ao milissegundo vence a gravação que corre agora', r.documento.respostas.x.valor === 'MINHA',
      r.documento.respostas.x);
    const outra = fusao.fundirEnvelopes({ base, minha, atual, quandoMinha: minha.escrito_em });
    checar('e correr duas vezes dá o mesmo resultado', outra.documento.respostas.x.valor === 'MINHA');
  }

  // =========================================================== F
  console.log('\nF. Sem base não se adivinha');
  {
    const semBase = null;
    const minhaSemBase = { respostas: { x: { valor: 'MINHA' } } };
    const atualSemBase = { respostas: { y: { valor: 'DELA' } } };
    checar('`podeFundir` recusa sem as três versões', fusao.podeFundir(semBase, minhaSemBase, atualSemBase, 'x') === false);
    checar('e recusa sem o instante da minha escrita', fusao.podeFundir({}, minhaSemBase, atualSemBase, null) === false);

    // O caminho real: sem base, a gravação faz o de sempre (substitui) — e não funde nada.
    const gh = githubFalso();
    const arm = armazenamentoDe(gh);
    const original = envelope('plano-20261104-1903', { x: { valor: 'A' } }, '2026-11-04T22:00:00.000Z');
    await porta.gravarEnvelope(arm, original, relatorioDe(original.id), { substituir: false });
    const minha = envelope('plano-20261104-1903', { x: { valor: 'MINHA' } }, '2026-11-04T22:00:10.000Z');
    const r = await porta.gravarEnvelope(arm, minha, relatorioDe(minha.id), { substituir: true });
    checar('sem base a edição grava como sempre (substituindo)', r.ok === true && !r.fundido, { ok: r.ok, fundido: r.fundido });
  }

  // =========================================================== G
  console.log('\nG. A corrida dentro da fusão: o 409 repete, e o resultado é o fundido');
  {
    const gh = githubFalso();
    const arm = armazenamentoDe(gh);
    const original = envelope('plano-20261104-1904', { a: { valor: 'A' }, b: { valor: 'B' } }, '2026-11-04T22:00:00.000Z');
    await porta.gravarEnvelope(arm, original, relatorioDe(original.id), { substituir: false });
    const base = JSON.parse(await arm.ler('envelope/plano-20261104-1904.json'));

    const dela = envelope(base.id, { a: { valor: 'A' }, b: { valor: 'DELA' } }, '2026-11-04T22:00:05.000Z');
    await porta.gravarEnvelope(arm, dela, relatorioDe(dela.id), { substituir: true, base });

    const antes = gh.puts;
    gh.conflitosRestantes = 1;   // o primeiro PUT perde a corrida
    const minha = envelope(base.id, { a: { valor: 'MINHA' }, b: { valor: 'B' } }, '2026-11-04T22:00:10.000Z');
    const r = await porta.gravarEnvelope(arm, minha, relatorioDe(minha.id), { substituir: true, base });
    checar('a gravação sobrevive a um 409', r.ok === true, r.erro);
    checar('e fez mais do que um PUT (a recusada e a que entrou)', gh.puts - antes >= 2, gh.puts - antes);
    const final = JSON.parse(await arm.ler('envelope/plano-20261104-1904.json'));
    checar('o `a` é meu e o `b` é dela — a fusão sobreviveu à corrida',
      final.respostas.a.valor === 'MINHA' && final.respostas.b.valor === 'DELA', final.respostas);
  }

  // =========================================================== H
  console.log('\nH. A leitura: o carimbo da escrita é lido antes do `gerado_em`');
  {
    checar('`quandoDoEnvelope` prefere o `escrito_em`', fusao.quandoDoEnvelope({
      escrito_em: '2026-11-04T22:00:10.500Z', gerado_em: '2026-11-04T19:00',
    }) === '2026-11-04T22:00:10.500Z');
    checar('e cai no `gerado_em` num envelope antigo (não inventa um instante)',
      fusao.quandoDoEnvelope({ gerado_em: '2026-11-04T19:00' }) === '2026-11-04T19:00');
    checar('um carimbo de minuto é comparável (o `instante` não devolve nulo)',
      fusao.instante('2026-11-04T19:00') !== null);
    checar('e um carimbo com milissegundos também',
      fusao.instante('2026-11-04T22:00:10.500Z') !== null);
    checar('o gerador do instante produz ISO com milissegundos',
      /\.\d{3}Z$/.test(fusao.carimbarInstante(new Date(0))), fusao.carimbarInstante(new Date(0)));
  }

  console.log('');
  if (falhas) {
    console.log('FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + n + ' asserções: duas edições do mesmo documento ficam as duas quando mexem ' +
    'em campos diferentes, o mesmo campo decide pela recência ao milissegundo (com o empate em quem grava), ' +
    'sem base não se adivinha, e o 409 é repetido — tudo pelo armazenamento COMPOSTO que o Worker monta.');
}

main().catch((erro) => {
  console.error('a prova quebrou: ' + (erro && erro.stack ? erro.stack : erro));
  process.exit(1);
});
