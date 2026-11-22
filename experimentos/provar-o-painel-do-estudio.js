#!/usr/bin/env node
'use strict';

/**
 * provar-o-painel-do-estudio.js — o painel inicial mostra os números da escola, e cada um tem fonte.
 *
 * O QUE ELA PEDIU (22/11/2026): «Sempre que entrar no [estúdio] a gente vai para o painel inicial.
 * […] vários dashboards, que mostram para a gente em blocos quantos alunos existem na escola, qual
 * é o nome da escola, quem é o responsável pela escola, quantos professores tem na escola, quais
 * são as salas que essa escola possui, qual é a taxa de ocupação das salas, quantos elencos tem,
 * esses elencos são compostos de quantas pessoas, quais modalidades a escola ensina.» Depois de ver
 * o modelo: «Quero a opção B» — o número grande.
 *
 * O QUE SE MEDE, e por que cada asserção existe:
 *
 *   A. A CONTA É DA ROTA, e ela conta o que interessa. Alunas sem `desligadaEm` (e não os
 *      registos), professores com o principal (que não vive na lista), salas VIGENTES (e não as 23
 *      encarnações), elencos pela versão mais recente de cada, modalidades pelas matrículas não
 *      substituídas. Cada um destes é um número que pode ser contado de duas maneiras — e a
 *      errada é sempre a que soma tudo o que encontra.
 *
 *   B. A PÁGINA NÃO CALCULA. Os números chegam prontos; sem eles, a página declara a lacuna em vez
 *      de mostrar zero. É a diferença entre «esta escola não tem salas» e «não li as salas».
 *
 *   C. A OCUPAÇÃO É A DA AGENDA, com a barra `.cota` da folha — e o período que ainda não começou
 *      é DITO, porque «0 de 15» lido sem essa frase parece uma falha.
 *
 *   D. A PEÇA É A DA FOLHA. `.numero`/`.numeros` nasceram em `tools/templates/ciclo.css` (opção B
 *      do modelo), com o comentário que diz de onde vieram; nenhuma classe é inventada na página.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` extrai `motor/` e `tools/` de outro commit; lá o painel ainda
 * é o parágrafo «Aqui aparece o que mudou desde a última vez» e não há `.numero` em sítio nenhum.
 *
 *   node experimentos/provar-o-painel-do-estudio.js
 *   node experimentos/provar-o-painel-do-estudio.js --contra=d85c42c1
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 260)));
}

/** O motor a medir: o deste worktree, ou o de outro commit (o controle negativo). */
function motorEm(sha) {
  if (!sha) return RAIZ;
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-' + sha.slice(0, 7) + '-'));
  execSync('git archive ' + sha + ' motor tools biblioteca modelo porta | tar -x -C ' + destino, { cwd: RAIZ });
  return destino;
}

/** Os registos reais da escola viva, com as duas armadilhas que a conta tem de evitar. */
const ALUNAS = [
  { id: 'aluna-a', apelido: 'Aluna A', desligadaEm: '2026-11-18T19:08:19.198Z' },
  { id: 'aluna-a-3', apelido: 'Aluna A' },
  { id: 'aluna-b', apelido: 'Aluna B', desligadaEm: '2026-11-19T10:00:00.000Z' },
  { id: 'aluna-b-2', apelido: 'Aluna B' },
  { id: 'aluna-c', apelido: 'Aluna C', desligadaEm: '2026-11-20T10:00:00.000Z' },
];
const PROFESSORES = [{ nome: 'Bom Bom', slug: 'bom-bom' }];
const TURMAS = [
  // a vigente, e duas encarnações substituídas — as três com o mesmo nome
  { id: 'rosa', nome: 'Rosa', dias: ['seg'], horarios: { seg: '16:30' }, duracaoMin: 45, substituidaPor: 'rosa-2026-11-18' },
  { id: 'rosa-2026-11-18', nome: 'Rosa', substituidaPor: 'rosa-2026-11-20' },
  { id: 'rosa-2026-11-20', nome: 'Rosa', modalidade: 'Balé clássico', dias: ['seg', 'qua', 'sex'],
    horarios: { seg: '16:30', qua: '16:30', sex: '16:30' }, duracaoMin: 120,
    periodoInicio: '2026-12-14', periodoFim: '2027-01-15' },
];
const LINHAS = [
  { id: 'tami', nome: 'Tami', professor: 'demi-plie', alunas: ['Aluna A'], atualizada_em: '2026-11-18T10:00:00.000Z' },
  { id: 'tami', nome: 'Tami', professor: 'demi-plie', alunas: ['Aluna A', 'Aluna B'], atualizada_em: '2026-11-22T11:49:02.524Z' },
  { id: 'ami', nome: 'Ami', professor: 'demi-plie', alunas: ['Aluna B'], atualizada_em: '2026-11-18T17:10:23.529Z' },
];
const MATRICULAS = [
  { aluna: 'Aluna A', modalidade: 'Balé clássico', professor: 'demi-plie' },
  { aluna: 'Aluna A', modalidade: 'Balé clássico', professor: 'demi-plie', substituidaPor: 'x' },
  { aluna: 'Aluna B', modalidade: 'Dança moderna', professor: 'bom-bom' },
];

const USOS = { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 };

/** Um `ASSETS` de bolso: só o `ciclos.json` de uma variante, e o resto 404. */
function assetsCom(aulas) {
  return {
    async fetch(url) {
      const caminho = String(url instanceof URL ? url.pathname : url);
      if (!/\/rosa\/ciclos\.json$/.test(caminho) || !aulas) {
        return new Response('nao encontrado', { status: 404 });
      }
      return new Response(JSON.stringify({ ciclos: [{ aulas }] }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}

const AULAS = [
  { n: '01', lancada: true }, { n: '02', lancada: true }, { n: '03', lancada: false },
];

function paginaDe(b, painel) {
  return b.paginaProducao('breu', { professor: 'demi-plie', ciclo: '01', query: '' }, PROFESSORES, ALUNAS,
    'Demi Plié', 'demi-plie', TURMAS, [], [], [], [], [], USOS, { modo: 'clara', paleta: 'bordo' },
    '', LINHAS, new Set(), { cadastro: { escolaNome: 'Breu' } }, MATRICULAS, null, [],
    undefined, painel);
}

const secaoDoPainel = (html) => (/<section class="secao" id="sec-painel">[\s\S]*?<\/section>/.exec(html) || [''])[0];

/** O texto de um número — o valor e a nota, pelo rótulo. */
function numero(html, rotulo) {
  const bloco = new RegExp('<div class="painel-numero">\\s*<span class="painel-numero-v">([^<]*)</span>\\s*'
    + '<span class="painel-numero-k">' + rotulo + '</span>(?:\\s*<span class="painel-numero-nota">([^<]*)</span>)?').exec(html);
  return bloco ? { valor: bloco[1].trim(), nota: (bloco[2] || '').trim() } : null;
}

(async () => {
  const contra = (process.argv.find((a) => a.indexOf('--contra=') === 0) || '').split('=')[1] || '';
  const base = motorEm(contra);
  const bastidores = require(path.join(base, 'motor/servidor/bastidores.js'));

  /* No controle negativo a conta não existe: é isso que se está a provar que mudou. Nesse caso
   * salta-se para a asserção que mede o ANTIGO — o parágrafo no lugar dos números. */
  const temConta = typeof bastidores.painelDoEstudio === 'function';

  if (!temConta) {
    console.log('\nA–C. (o commit ' + contra.slice(0, 7) + ' não tem a conta do painel — é o esperado)');
    const antiga = secaoDoPainel(paginaDe(bastidores, null));
    provar('no controle, o painel ainda é o parágrafo «Aqui aparece o que mudou desde a última vez»',
      /Aqui aparece o que mudou desde a última vez/.test(antiga), antiga.slice(0, 200));
    provar('no controle, os números da opção B não existem em sítio nenhum',
      !/class="painel-numero-v"/.test(paginaDe(bastidores, null)), null);
    fs.rmSync(base, { recursive: true, force: true });
    console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + total + ' asserções.' : 'CONTROLE CONFORME — '
      + total + ' asserções: em ' + contra.slice(0, 7) + ' o painel é o parágrafo, e nenhum número.'));
    process.exit(falhas ? 1 : 0);
  }

  /* ───────────────────────────────────────────────────────────── A. A CONTA, E O QUE ELA CONTA */
  console.log('\nA. A conta é da rota — e conta o que interessa');
  const painel = await bastidores.painelDoEstudio({
    env: { ASSETS: assetsCom(AULAS) }, escola: 'breu', aluns: ALUNAS, profs: PROFESSORES,
    dono: 'Demi Plié', trms: TURMAS, linhas: LINHAS, matriculasDaEscola: MATRICULAS,
    dadosDaEscola: { cadastro: { escolaNome: 'Breu' } },
  });
  provar('o painel existe como dado, separado do desenho', !!painel && typeof painel === 'object', typeof painel);
  provar('as ALUNAS são as ativas: 2, e não os 5 registos',
    painel.alunas === 2 && painel.alunasRegistos === 5, [painel.alunas, painel.alunasRegistos]);
  provar('os PROFESSORES contam o principal, que não vive na lista',
    painel.professores === 2 && painel.professoresRegistados === 1,
    [painel.professores, painel.professoresRegistados]);
  provar('as SALAS são as vigentes: 1, e não as 3 encarnações',
    painel.salas.length === 1 && painel.salasRegistos === 3,
    [painel.salas.length, painel.salasRegistos]);
  provar('os ELENCOS são a versão mais recente de cada: 2 (Tami e Ami), e o Tami com 2 pessoas',
    painel.elencos.length === 2
      && painel.elencos.find((e) => e.nome === 'Tami').pessoas === 2,
    painel.elencos);
  provar('as MODALIDADES vêm das matrículas vigentes: 2, e a repetida não conta duas vezes',
    painel.modalidades.length === 2
      && painel.modalidades.find((m) => m.nome === 'Balé clássico').vinculos === 1,
    painel.modalidades);
  provar('o NOME é o do cadastro, e não o slug', painel.nome === 'Breu', painel.nome);
  provar('o RESPONSÁVEL é o dono da escola', painel.responsavel === 'Demi Plié', painel.responsavel);

  /* ───────────────────────────────────────────────────────────── B. A OCUPAÇÃO, E A LEITURA */
  console.log('\nB. A ocupação é a da agenda — e sem leitura não se inventa');
  const sala = painel.salas[0];
  provar('a sala traz as previstas e as dadas, do `ciclos.json` do pacote',
    sala.previstas === 3 && sala.dadas === 2, [sala.previstas, sala.dadas]);

  const semAssets = await bastidores.painelDoEstudio({
    env: {}, escola: 'breu', aluns: ALUNAS, profs: PROFESSORES, dono: 'Demi Plié',
    trms: TURMAS, linhas: LINHAS, matriculasDaEscola: MATRICULAS, dadosDaEscola: null,
  });
  provar('sem ASSETS, «dadas» é `null` — «não li», e não zero',
    semAssets.salas[0].dadas === null, semAssets.salas[0]);

  /* ──────────────────────────────────────────────────────────────── C. A PÁGINA DESENHA */
  console.log('\nC. A página desenha — com as peças da folha');
  const html = paginaDe(bastidores, painel);
  const secao = secaoDoPainel(html);
  provar('a secção do Painel inicial existe', secao.length > 0);
  provar('o nome e o responsável estão à vista',
    /<strong>Breu<\/strong>/.test(secao) && /responsável: Demi Plié/.test(secao), null);

  for (const [rotulo, valor] of [['Alunas', '2'], ['Professores', '2'], ['Salas', '1'],
    ['Elencos', '2'], ['Modalidades', '2']]) {
    const n = numero(secao, rotulo);
    provar('o número «' + rotulo + '» mostra ' + valor + ', e diz de onde vem',
      !!n && n.valor === valor && !!n.nota, n);
  }

  provar('a ocupação usa a barra `.cota` da folha, em milésimos',
    /<progress class="cota" data-nivel="[a-z]+" value="6\d\d" max="1000">/.test(secao),
    (/<progress[^>]*>/.exec(secao) || [])[0]);
  provar('…e o rótulo diz «2 de 3 aulas dadas»', /Ocupação — 2 de 3 aulas dadas/.test(secao), null);
  provar('…e o período que ainda não começou é DITO, com a data em dd/mm/aaaa',
    /ainda não começou \(14\/12\/2026\)/.test(secao), (/ainda não começou[^<]*/.exec(secao) || [])[0]);
  provar('o ritmo da sala sai em dias, hora e duração, com a data legível',
    /seg, qua, sex às 16:30 · 120 min · 14\/12\/2026 → 15\/01\/2027/.test(secao),
    (/<p class="sub">[^<]*16:30[^<]*/.exec(secao) || [])[0]);

  /* SEM NÚMEROS NÃO SE INVENTA — e a lacuna diz onde se resolve. */
  const vazio = paginaDe(bastidores, { escola: 'breu' });
  const secaoVazia = secaoDoPainel(vazio);
  provar('sem números, o painel mostra a lacuna em vez de zeros',
    /\[Preencher: esta escola ainda não tem nenhuma sala/.test(secaoVazia)
      && !/value="0" max="1000"/.test(secaoVazia),
    (/\[Preencher[^\]]*\]/.exec(secaoVazia) || [])[0]);
  provar('…e a lacuna diz ONDE se resolve (Pedagogia › Salas)',
    /Pedagogia › Salas/.test(secaoVazia), null);

  console.log('\nD. O antigo parágrafo não voltou');
  provar('a frase «Aqui aparece o que mudou desde a última vez» saiu',
    !/Aqui aparece o que mudou desde a última vez/.test(html), null);

  console.log('\nE. As peças nasceram na FOLHA, e não na página');
  const folha = fs.readFileSync(path.join(RAIZ, 'tools/templates/ciclo.css'), 'utf8');
  for (const peca of ['.painel-numeros', '.painel-numero-v', '.painel-numero-k', '.painel-numero-nota',
    '.painel-rotulo', '.identidade-do-painel', '.sala-do-painel']) {
    provar('a folha declara ' + peca, folha.indexOf(peca + ' ') !== -1 || folha.indexOf(peca + '{') !== -1
      || folha.indexOf(peca + ',') !== -1, null);
  }
  provar('a folha diz DE ONDE a peça veio (a bancada da opção B)',
    /proposta-painel-do-estudio\.html/.test(folha), null);

  if (base !== RAIZ) {
    fs.rmSync(base, { recursive: true, force: true });
    console.log('\n(' + contra + ' extraído e apagado)');
  }

  console.log('');
  if (falhas) {
    console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.');
    process.exit(1);
  }
  console.log('TUDO CERTO — ' + total + ' asserções: o painel conta o que interessa (ativas, vigentes, '
    + 'a versão de hoje de cada elenco), mede a ocupação pela agenda, diz quando não leu, e desenha '
    + 'com as peças da folha.');
})();
