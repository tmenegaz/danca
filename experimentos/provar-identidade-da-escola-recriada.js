#!/usr/bin/env node
'use strict';

/**
 * provar-identidade-da-escola-recriada.js — QUEM E QUANDO, DEPOIS DA RECRIAÇÃO (27/10/2026).
 *
 * O QUE ACONTECEU. A pesquisadora criou a escola `calango` às 11:35 de 27/10, com o professor
 * `murisoca-baiana`. O portal mostrou:
 *
 *   · Escolas → «Criada»: 19/10/2026 — a PRIMEIRA encarnação da escola, oito dias antes;
 *   · Professores → «Perna Boa → calango» — um professor de uma encarnação ANTERIOR, que não
 *     tinha nada na escola (a pasta dele só tem os schemas compartilhados).
 *
 * A causa é uma só, e é a família que esta sessão vem perseguindo: a MEMÓRIA a ser lida como
 * PRESENTE. O elo da recriação (`recriacao[]`) foi acrescentado em 22/10 exactamente para isto —
 * «o índice continuava a dizer que o responsável era o professor da PRIMEIRA criação, para
 * sempre». Mas só metade foi corrigida:
 *
 *   · o RESPONSÁVEL passou a ser lido do elo (`responsavelDoInventario`) — e por isso o portal
 *     já dizia «Murisoca Baiana» na coluna do professor;
 *   · a DATA ficou no `criado_em` do topo (`criada_em: inv.criado_em`) — e a coluna mentia;
 *   · a LISTA `professores[]` era lida tal e qual, e é append-only — e o fantasma ficava.
 *
 * O QUE ESTA PROVA TRAVA:
 *
 *   1. `quandoDaEncarnacao` — a data é a da encarnação que existe: a última recriação; sem
 *      recriação, o `criado_em` de sempre. Os casos de fronteira ficam declarados (recriação sem
 *      `em`, inventário nulo, lista vazia).
 *   2. O REGISTRADOR corrige o presente e guarda o passado — corrido a sério, sobre um índice de
 *      bancada com a forma do caso real. O professor anterior NÃO desaparece: vai para o elo.
 *      E `criado_em` não se toca, porque a criação original é história.
 *   3. O RESPONSÁVEL NÃO SE REPETE NA LISTA — a regra do `repo-escola.js`, que é quem escreve
 *      `professores[]` no dia a dia. Pôr o novo na lista seria a mesma pessoa em dois sítios.
 *   4. OS DADOS REAIS: o índice da `calango`, como está no repositório, já não tem o fantasma, e
 *      a data que o painel mostra é a da última recriação.
 *
 * CONTROLE NEGATIVO (`--controle-negativo`): as mesmas asserções contra o registrador de `HEAD`
 * (`git show HEAD:tools/registrar-recriacao.py`), num diretório temporário. Se o controle
 * passasse, a prova não estaria a provar nada.
 *
 *   node experimentos/provar-identidade-da-escola-recriada.js [--controle-negativo]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const { quandoDaEncarnacao } = require(path.join(RAIZ, 'motor/nucleo/indices.js'));

let total = 0;
let falhas = 0;
const provar = (nome, ok, detalhe) => {
  total += 1;
  console.log('  ' + (ok ? 'ok    ' : 'FALHOU') + ' ' + nome
    + (ok ? '' : '  → ' + JSON.stringify(detalhe)));
  if (!ok) falhas += 1;
};

const negativo = process.argv.includes('--controle-negativo');

if (negativo) {
  /* O CONTROLE ISOLA UMA METADE, E DIZ QUAL. Ele troca o REGISTRADOR pelo de `HEAD`; a seção 1
     (`quandoDaEncarnacao`) e a seção 4 medem o código de hoje e os dados de hoje, e reprovar
     nelas seria medir o passado com a régua do passado. O que se espera é que as asserções do
     REGISTRADOR reprovem — «o presente é corrigido» e «o passado fica no elo». As outras passam,
     e é isso que se lê em baixo. */
  console.log('CONTROLE NEGATIVO: o registrador é o de ANTES da correção (o ref derivado, impresso'
    + '\n  em baixo). A seção 1 e a 4 medem o código e os dados de HOJE de propósito — o controle'
    + ' é do registrador, e só dele.');
}

console.log('\n1. A data da encarnação que existe');
/* OS CASOS DE FRONTEIRA FICAM DECLARADOS. Uma recriação sem `em` não pode virar data vazia na
   tela — cai para a anterior, e na falta de todas para o `criado_em`. */
provar('sem recriação: a data é a criação original',
  quandoDaEncarnacao({ criado_em: '2026-10-19T00:00:00Z' }) === '2026-10-19T00:00:00Z');
provar('com recriação: a data é a da ÚLTIMA recriação',
  quandoDaEncarnacao({
    criado_em: '2026-10-19T00:00:00Z',
    recriacao: [{ em: '2026-10-22T00:00:00Z' }, { em: '2026-10-27T11:35:27Z' }],
  }) === '2026-10-27T11:35:27Z');
provar('recriação sem `em` não apaga a data: cai para a anterior',
  quandoDaEncarnacao({
    criado_em: '2026-10-19T00:00:00Z',
    recriacao: [{ em: '2026-10-22T00:00:00Z' }, { motivo: 'sem data' }],
  }) === '2026-10-22T00:00:00Z');
provar('recriação vazia: cai para o `criado_em`',
  quandoDaEncarnacao({ criado_em: '2026-10-19T00:00:00Z', recriacao: [] })
  === '2026-10-19T00:00:00Z');
provar('inventário nulo devolve nulo (não inventa data)', quandoDaEncarnacao(null) === null);

console.log('\n2. O registrador: o presente é corrigido, o passado fica no elo');
/* O FIXTURE TEM A FORMA DO CASO REAL, e não é o caso real: a `calango` não se toca. */
const CASO = {
  escola: 'escola-de-bancada',
  criado_em: '2026-10-19T18:18:57.289485+00:00',
  professor: { slug: 'antigo', nome: 'Antigo' },
  responsavel: 'Antigo',
  professores: [{ slug: 'perna-boa', nome: 'Perna Boa', desde: '2026-10-22T20:15:54.754Z' }],
  estado: { habilitada: true },
  expurgo: [{ em: '2026-10-23T00:00:00Z', motivo: 'expurgada pela página', apagado: [] }],
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prova-recriacao-'));
const arq = path.join(dir, 'indice.json');
const escreverCaso = () => fs.writeFileSync(arq, JSON.stringify(CASO, null, 2) + '\n', 'utf8');
const lerCaso = () => JSON.parse(fs.readFileSync(arq, 'utf8'));

/** O registrador a exercer. No controle negativo, o de ANTES da correção.
 *
 *  O REF NÃO SE FIXA EM `HEAD` (27/10/2026) — e esta prova cometeu o mesmo erro que o
 *  `provar-objetivos-por-aula` já tinha documentado em 26/10. A primeira redação dizia
 *  `git show HEAD:tools/registrar-recriacao.py`, e funcionava enquanto a mudança estava por
 *  commitar. Depois do commit, `HEAD` passou a ser o estado NOVO, o controle deixou de reprovar
 *  nada, e o output passou a dizer «TUDO CERTO — 20 asserções, 0 falha(s)»: um controle negativo
 *  que passa é pior do que não ter controle, porque parece que se mediu.
 *
 *  O ref passa a ser DERIVADO, pela mesma receita do 26/10: o commit que introduziu a marca
 *  (`professores_anteriores`) neste ficheiro, menos um. É o último estado em que o defeito
 *  existia, e continua certo em qualquer clone. `REF_NEGATIVO` sobrepõe-se, para quem quiser
 *  medir outro ponto do histórico. */
const MARCA = 'professores_anteriores';
const registrador = (() => {
  if (!negativo) return path.join(RAIZ, 'tools/registrar-recriacao.py');
  const em = (ref) => {
    try {
      return execFileSync('git', ['show', ref + ':tools/registrar-recriacao.py'],
        { cwd: RAIZ, encoding: 'utf8' });
    } catch (e) { return null; }
  };
  let ref = process.env.REF_NEGATIVO || '';
  if (!ref) {
    // 1. a mudança ainda está por commitar: HEAD é o estado de antes.
    if (em('HEAD') !== null && em('HEAD').indexOf(MARCA) === -1) {
      ref = 'HEAD';
    } else {
      // 2. já está no histórico: o commit que a introduziu, menos um.
      let sha = '';
      try {
        sha = execFileSync('git', ['log', '-1', '--format=%H', '-S' + MARCA,
          '--', 'tools/registrar-recriacao.py'], { cwd: RAIZ, encoding: 'utf8' }).trim();
      } catch (e) { sha = ''; }
      ref = sha ? sha + '~1' : 'HEAD';
    }
  }
  const texto = em(ref);
  if (texto === null) {
    /* SEM REF, O CONTROLE NÃO SE FAZ — e diz-se. Correr o registrador de hoje a fingir de
       controle é o que produzia um verde falso. */
    console.error('provar-identidade-da-escola-recriada: controle negativo sem referência'
      + ' (' + ref + ') — o registrador de antes não está no histórico. NÃO FEITO.');
    process.exit(2);
  }
  console.log('  (controle sobre ' + ref + ')');
  const antigo = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'registrador-')), 'antigo.py');
  fs.writeFileSync(antigo, texto, 'utf8');
  return antigo;
})();

const correr = (...args) => {
  try {
    execFileSync('python3', [registrador, arq, ...args], { cwd: RAIZ, encoding: 'utf8', stdio: 'pipe' });
    return null;
  } catch (e) {
    return String((e.stderr || '') + (e.stdout || '') + e.message);
  }
};

escreverCaso();
const erro = correr('--professor', 'murisoca-baiana', '--professor-nome', 'Murisoca Baiana',
  '--responsavel', 'Murisoca Baiana', '--ciclo', '01');
provar('o registrador corre sem erro', erro === null, erro && erro.slice(0, 300));

const depois = lerCaso();
provar('o RESPONSÁVEL passa a ser quem recriou',
  depois.professor && depois.professor.slug === 'murisoca-baiana', depois.professor);
provar('o `responsavel` (texto) acompanha',
  depois.responsavel === 'Murisoca Baiana', depois.responsavel);
provar('o RESPONSÁVEL não se repete na lista `professores[]`',
  Array.isArray(depois.professores) && depois.professores.length === 0, depois.professores);
provar('o `criado_em` NÃO se toca (a criação original é história)',
  depois.criado_em === CASO.criado_em, depois.criado_em);
provar('o `expurgo[]` NÃO se toca', JSON.stringify(depois.expurgo) === JSON.stringify(CASO.expurgo));

const elo = (depois.recriacao || [])[depois.recriacao.length - 1] || {};
provar('o elo guarda o professor ANTERIOR (o fantasma não desaparece)',
  elo.professor_anterior && elo.professor_anterior.slug === 'antigo', elo.professor_anterior);
provar('…e os vínculos anteriores, com o `desde` que tinham',
  Array.isArray(elo.professores_anteriores) && elo.professores_anteriores.length === 1
  && elo.professores_anteriores[0].slug === 'perna-boa'
  && elo.professores_anteriores[0].desde === '2026-10-22T20:15:54.754Z',
  elo.professores_anteriores);
provar('o elo diz QUEM recriou', elo.professor && elo.professor.slug === 'murisoca-baiana', elo.professor);

console.log('\n3. Sem `--professor`, não se inventa identidade');
escreverCaso();
const semProfessor = correr('--motivo', 'só o elo');
const aposSem = lerCaso();
provar('corre sem erro', semProfessor === null, semProfessor && semProfessor.slice(0, 200));
provar('o responsável fica como estava',
  aposSem.professor && aposSem.professor.slug === 'antigo', aposSem.professor);
provar('e a lista `professores[]` também',
  Array.isArray(aposSem.professores) && aposSem.professores.length === 1, aposSem.professores);

console.log('\n4. Os dados REAIS: a escola que a pesquisadora criou');
const inventario = JSON.parse(fs.readFileSync(path.join(RAIZ, 'escola/calango/indice.json'), 'utf8'));
const ultimoElo = (inventario.recriacao || [])[inventario.recriacao.length - 1] || {};
provar('o responsável da `calango` é quem a recriou',
  inventario.professor && ultimoElo.professor
  && inventario.professor.slug === ultimoElo.professor.slug,
  { topo: inventario.professor, elo: ultimoElo.professor });
provar('a lista `professores[]` não tem o responsável repetido',
  !(inventario.professores || []).some((p) => p && p.slug === inventario.professor.slug),
  inventario.professores);
/* O QUE SE PERDEU VAI PARA O ELO, EM UMA DE DUAS CHAVES — e a prova passou a exigir o FACTO, e
   não a chave (07/11/2026). O registrador grava duas coisas diferentes: `professores_anteriores`
   (a lista acumulada de vínculos, com o `desde`) e `professor_anterior` (o professor do topo,
   quando muda). Numa escola em que o topo mudou mas a lista `professores[]` não tinha ninguém —
   o caso real da `calango` —, só a SEGUNDA é escrita, e a informação está lá: o elo diz «meia
   ponta» e não a esconde. A redação anterior exigia a lista e reprovava sobre um elo correto,
   porque media onde o dado mora em vez de medir se ele existe. Vermelho de antes, medido no
   `58bc02f0`, e corrigido aqui por decisão dela. */
const perdidos = [
  ...(Array.isArray(ultimoElo.professores_anteriores) ? ultimoElo.professores_anteriores : []),
  ...(ultimoElo.professor_anterior ? [ultimoElo.professor_anterior] : []),
].filter((p) => p && p.slug);
provar('o elo da recriação diz o que se perdeu, em vez de o apagar em silêncio',
  perdidos.length > 0,
  { professores_anteriores: ultimoElo.professores_anteriores, professor_anterior: ultimoElo.professor_anterior });

if (!negativo) {
  const acervo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'indices/acervo.json'), 'utf8'));
  const calango = (acervo.escolas || []).find((e) => e.slug === 'calango');
  provar('o acervo põe a data da última recriação na `calango`',
    !!calango && calango.criada_em === quandoDaEncarnacao(inventario),
    calango && calango.criada_em);
  /* A REGRA VALE NUMA ESCOLA VIVA, E SÓ NELA (27/10/2026). A primeira redação exigia «nenhum
     professor de encarnação anterior ligado» sempre — e passou a reprovar no dia em que a
     pesquisadora expurgou a `calango`, porque numa escola APAGADA a lista inclui, de propósito,
     todos os que o elo prova: é a história de quem passou por ali (`indices.js`, regra de 22/10 —
     «o elo do expurgo só prova quem trabalha numa escola apagada»). O fantasma só é fantasma
     enquanto a escola está viva; depois de apagada, ele é memória, e a memória é para ficar. */
  /* A lista dos fantasmas sai das DUAS chaves, pela mesma razão da asserção de cima: com só a
     plural, o professor do topo ficava invisível a esta conferência — e era exactamente ele que
     a `calango` tinha para mostrar. */
  const fantasmas = new Set(perdidos.map((p) => p.slug));
  if (calango && calango.expurgada) {
    provar('apagada: a lista inclui quem o elo prova — história, não fantasma',
      (calango.professores || []).length > 1, calango.professores);
  } else {
    provar('viva: nenhum professor de encarnação anterior fica ligado a ela',
      !!calango && !(calango.professores || []).some((p) => fantasmas.has(p)),
      calango && calango.professores);
  }
  /* A REGRESSÃO QUE IMPORTA: o par (criada, apagada) de uma escola expurgada é da MESMA
     encarnação. Antes, a `breu` dizia «criada 19/10, apagada 27/10» — duas encarnações
     misturadas numa linha só. */
  const breu = (acervo.escolas || []).find((e) => e.slug === 'breu');
  if (breu && breu.expurgada) {
    provar('numa apagada, criada e apagada são da mesma encarnação',
      String(breu.criada_em) < String(breu.expurgada_em),
      { criada: breu.criada_em, apagada: breu.expurgada_em });
  }
}

fs.rmSync(dir, { recursive: true, force: true });

console.log('\n' + (falhas
  ? 'FALHOU — ' + falhas + ' de ' + total + ' asserções'
  : 'TUDO CERTO — ' + total + ' asserção(ões), 0 falha(s)') + '.');
process.exit(falhas ? 1 : 0);
