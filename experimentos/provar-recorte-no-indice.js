#!/usr/bin/env node
'use strict';

/**
 * provar-recorte-no-indice.js — o recorte do corpo entra no índice GERADO, com a série.
 *
 * O QUE ELA PEDIU (05/11/2026). «Esse índice é para a gente poder fazer um filtro rápido em algum
 * momento para identificar quais são os aspectos do recorte mais usados e os menos usados, os que
 * nunca foram usados, os que são usados parcialmente» — e, sobre o que faltava: «não há série
 * temporal. A gente tem que encontrar uma solução para isso. Essa é uma característica que vai
 * valer muito dinheiro.» A linha de base passou a ser ficheiro (append-only, um por acto), e é
 * isso que torna a série derivável: enquanto viveu no KV, o gerador não a alcançava e a entidade
 * `recorte` ficou declarada `prevista` — a marca honesta de «o vocabulário existe, o dado não».
 *
 * O QUE ESTA PROVA MEDE, e a alternativa a cada asserção:
 *
 *   A. A LEITURA DOS FICHEIROS. `escola/<escola>/linhas-de-base/<id>--<carimbo>.json` — o `id`
 *      separa-se do carimbo pelo ÚLTIMO `--`, e um id que já tenha `-` no nome não se parte.
 *      E o apelido da aluna NÃO entra: `alunas` é um número (o §4.8 é explícito).
 *   B. A SÉRIE. Cada linha traz `versoes[]` da mais recente para a mais antiga — o passado
 *      inteiro, não só a vigente. É o que responde «o que se olhava em Outubro».
 *   C. O RANQUE E A JANELA. `aspectos[]` separa TRÊS contas que é fácil confundir: em quantos
 *      recortes vigentes o aspecto está hoje (`contagem`), em quantos actos alguma vez esteve
 *      (`versoes`), e desde/té quando (`primeira`/`ultima`). Um aspecto que se olhava antes e já
 *      não se olha tem `contagem: 0` e `versoes > 0` — o caso que a série existe para mostrar.
 *   D. A LÁPIDE. Uma linha de base apagada continua no índice com `apagada: true` e deixa de
 *      contar no ranque: o passado não se apaga (P-03), mas o presente não a mostra como viva.
 *   E. O ACESSO. `recortes` e `aspectos` só existem no índice da ESCOLA; o transversal leva a
 *      contagem e nada mais. É a regra do §4.8, e a verificação 15 do `check-indices` é a que a
 *      faz cumprir em produção — aqui prova-se que o gerador a respeita.
 *   F. O DETERMINISMO. Duas construções com a mesma entrada dão o mesmo JSON: sem isso o
 *      `check-indices` reprovaria a cada geração e a série não seria conferível.
 *
 * SEM REDE E SEM KV: as versões entram como objetos, que é exactamente o que o gerador lê do
 * disco. A leitura dos ficheiros tem a sua própria secção, com caminhos de mentira.
 *
 *   node experimentos/provar-recorte-no-indice.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const indices = require(path.join(RAIZ, 'motor/nucleo/indices.js'));
const gerador = require(path.join(RAIZ, 'tools/gerar-indices.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/**
 * O MUNDO MÍNIMO para `construir`: um wrangler (a escola existe), um inventário vazio e as
 * versões do recorte. O resto da derivação não precisa de nada — e é bom que assim seja, porque
 * esta prova mede o recorte e não a indexação dos ciclos.
 */
function mundo(versoesPorEscola) {
  return {
    fonte: { commit: null, arvore: null },
    agora: '2026-11-05T22:00',
    arvores: [
      'wrangler.calango.jsonc',
      'escola/calango/indices.json',
      'escola/calango/indice.json',
    ],
    inventarios: { calango: { escola: 'calango', professor: 'rabo-gramde', professores: ['rabo-gramde'] } },
    envelopes: {},
    ancoras: {},
    recortes: versoesPorEscola || {},
    comApelido: false,
  };
}

/** Uma versão como o gerador a lê do ficheiro. */
function versao(extra) {
  return Object.assign({
    id: 'teste',
    carimbo: '20261105-2155',
    arquivo: 'escola/calango/linhas-de-base/teste--20261105-2155.json',
    nome: 'teste',
    professor: 'tiago-menegaz',
    turma: 'Balé Nível 1 — Teste 1',
    atualizada_em: '2026-11-05T21:55:00.000Z',
    enviada_em: '2026-11-05T21:55:43.186Z',
    aspectos: ['formato-anatomico-dos-joelhos', 'arquitetura-do-arco-plantar'],
    alunas: 2,
  }, extra || {});
}

const versoesDoCaso = () => [
  /* A LINHA «teste» TEM TRÊS ACTOS. O primeiro olhava dois aspectos; o segundo largou um e
   * ganhou outro; o terceiro voltou ao primeiro recorte. É esta curva que a série tem de contar. */
  versao({ carimbo: '20261101-1000', arquivo: 'escola/calango/linhas-de-base/teste--20261101-1000.json',
    enviada_em: '2026-11-01T10:00:00.000Z', aspectos: ['formato-anatomico-dos-joelhos'] }),
  versao({ carimbo: '20261103-1000', arquivo: 'escola/calango/linhas-de-base/teste--20261103-1000.json',
    enviada_em: '2026-11-03T10:00:00.000Z',
    aspectos: ['formato-anatomico-dos-joelhos', 'equilibrio-unipodal'] }),
  versao({ carimbo: '20261105-2155', arquivo: 'escola/calango/linhas-de-base/teste--20261105-2155.json',
    enviada_em: '2026-11-05T21:55:43.186Z',
    aspectos: ['formato-anatomico-dos-joelhos', 'arquitetura-do-arco-plantar'] }),
  /* UMA SEGUNDA LINHA, com um aspecto que a primeira abandonou — é o caso «já não se olha aqui,
   * mas olha-se ali», e é o que impede o ranque de ser uma simples inversão. */
  versao({ id: 'outra', carimbo: '20261104-0900', arquivo: 'escola/calango/linhas-de-base/outra--20261104-0900.json',
    nome: 'outra', turma: 'Balé Nível 2 — Teste 1', enviada_em: '2026-11-04T09:00:00.000Z',
    aspectos: ['equilibrio-unipodal'] }),
  /* E UMA APAGADA, para a lápide ter o que provar. */
  versao({ id: 'apagada', carimbo: '20261102-0800',
    arquivo: 'escola/calango/linhas-de-base/apagada--20261102-0800.json',
    nome: 'apagada', turma: 'Balé Nível 2 — Teste 1', enviada_em: '2026-11-02T08:00:00.000Z',
    aspectos: ['mobilidade-de-quadril-en-dehors-de-origem'] }),
  versao({ id: 'apagada', carimbo: '20261105-1200',
    arquivo: 'escola/calango/linhas-de-base/apagada--20261105-1200.json',
    nome: 'apagada', turma: 'Balé Nível 2 — Teste 1', apagada_em: '2026-11-05T12:00:00.000Z',
    aspectos: ['mobilidade-de-quadril-en-dehors-de-origem'] }),
];

(async () => {
  console.log('\nA. A leitura dos ficheiros: o id separa-se do carimbo pelo ÚLTIMO `--`');
  {
    /* O leitor do gerador é interno; o que se prova é a REGRA pela função exportada do núcleo —
     * o `id` que ele recebe é o que a leitura produz. Um id com `-` (o caso real: «balé-nivel-1»)
     * não pode partir-se ao meio. */
    provar('um id com hífenes não se confunde com o separador do carimbo',
      indices.recortesDaEscola([versao({ id: 'bale-nivel-1', carimbo: '20261105-2155', arquivo: 'x' })])[0].linha === 'bale-nivel-1');
    /* A LEITURA DO GERADOR, exercida com um leitor de mentira — a regra em vez do acervo de hoje.
     * O ficheiro traz `campos: [{id}]` (a forma que o servidor grava) e `alunas: [nomes]`; o que
     * sai tem de ser `aspectos: [ids]` e `alunas: <número>`. */
    const ficheiros = {
      'escola/calango/linhas-de-base/bale-nivel-1--20261105-2155.json': {
        id: 'bale-nivel-1', nome: 'Balé Nível 1', professor: 'tiago-menegaz',
        turma: 'Balé Nível 1 — Teste 1', enviada_em: '2026-11-05T21:55:43.186Z',
        campos: [{ id: 'formato-anatomico-dos-joelhos', nome: 'Formato' }, { id: 'equilibrio-unipodal' }],
        alunas: ['Aluna A', 'Aluna B'],
      },
      'escola/calango/envelopes/anamnese-x.json': { id: 'anamnese-x', aluna: 'Aluna A' },
    };
    const lido = gerador.lerRecortes(Object.keys(ficheiros), (rel) => ficheiros[rel] || null);
    const daLinha = (lido.calango || [])[0] || {};
    provar('o id com hífenes não se parte no separador do carimbo',
      daLinha.id === 'bale-nivel-1' && daLinha.carimbo === '20261105-2155', daLinha);
    provar('os `campos` do ficheiro viram `aspectos` (ids)',
      daLinha.aspectos.join('|') === 'formato-anatomico-dos-joelhos|equilibrio-unipodal', daLinha.aspectos);
    provar('os apelidos viram uma CONTAGEM, e os nomes não passam',
      daLinha.alunas === 2 && JSON.stringify(daLinha).indexOf('Aluna A') === -1, daLinha.alunas);
    provar('um envelope no caminho NÃO entra na família',
      (lido.calango || []).length === 1, (lido.calango || []).map((l) => l.arquivo));
    provar('um ficheiro ilegível não derruba a leitura — fica de fora',
      gerador.lerRecortes(Object.keys(ficheiros), (rel) => (rel.indexOf('linhas-de-base') !== -1 ? null : ficheiros[rel])).calango === undefined);

    /* O `.indice.json` DA PASTA NÃO É UM ACTO (06/11/2026), e caiu aqui na PRIMEIRA execução a
     * sério: o índice gerado em produção trazia `recorte:.indice` — com `vigente: true` e zero
     * alunas — ao lado do recorte verdadeiro. É o somatório das versões, mora na mesma pasta, e
     * tem a mesma forma de nome. Um ficheiro da casa não é dado do professor. */
    const comIndice = Object.assign({}, ficheiros, {
      'escola/calango/linhas-de-base/.indice.json': {
        versao: 1, escola: 'calango',
        versoes: { 'bale-nivel-1--20261105-2155.json': { id: 'bale-nivel-1', carimbo: '20261105-2155' } },
      },
    });
    const comOIndice = gerador.lerRecortes(Object.keys(comIndice), (rel) => comIndice[rel] || null);
    provar('o `.indice.json` da pasta NÃO entra como recorte',
      (comOIndice.calango || []).length === 1, (comOIndice.calango || []).map((l) => l.id));
    /* E a mesma regra pela outra ponta: um ficheiro SEM `<id>--<carimbo>` não é uma versão — não
     * tem carimbo, e sem carimbo não há série. Controle positivo: com o separador, entra. */
    const semCarimbo = Object.assign({}, ficheiros, {
      'escola/calango/linhas-de-base/sobras.json': { id: 'sobras', campos: [] },
    });
    provar('um ficheiro sem `<id>--<carimbo>` também não entra',
      (gerador.lerRecortes(Object.keys(semCarimbo), (rel) => semCarimbo[rel] || null).calango || []).length === 1);

    const construido = indices.construir(mundo({ calango: versoesDoCaso() }));
    const escola = construido.escolas.calango;
    const teste = escola.recortes.find((r) => r.linha === 'teste');
    provar('a versão vigente é a de CARIMBO maior, e traz os seus aspectos',
      teste && teste.aspectos.join('|') === 'arquitetura-do-arco-plantar|formato-anatomico-dos-joelhos',
      teste && teste.aspectos);
    provar('o apelido da aluna NÃO entra — `alunas` é um número (§4.8)',
      teste && typeof teste.alunas === 'number' && teste.alunas === 2, teste && teste.alunas);
    provar('…e nenhuma chave da entidade é `aluna` ou `apelido`',
      JSON.stringify(escola.recortes).indexOf('"aluna"') === -1
        && JSON.stringify(escola.recortes).indexOf('apelido') === -1);
  }

  console.log('\nB. A série: cada linha traz o passado inteiro, da mais recente para a mais antiga');
  {
    const escola = indices.construir(mundo({ calango: versoesDoCaso() })).escolas.calango;
    const teste = escola.recortes.find((r) => r.linha === 'teste');
    provar('a linha «teste» tem três elos', teste.versoes.length === 3, teste.versoes.length);
    provar('…ordenados do mais recente para o mais antigo',
      teste.versoes.map((v) => v.versao).join('|') === '20261105-2155|20261103-1000|20261101-1000',
      teste.versoes.map((v) => v.versao));
    provar('…cada elo diz o seu arquivo, a data e os aspectos DAQUELE momento',
      teste.versoes[2].arquivo === 'escola/calango/linhas-de-base/teste--20261101-1000.json'
        && teste.versoes[2].aspectos.join('|') === 'formato-anatomico-dos-joelhos'
        && teste.versoes[2].enviada_em === '2026-11-01T10:00:00.000Z', teste.versoes[2]);
    provar('CONTROLE NEGATIVO: a versão vigente não é a primeira do ficheiro, é a de carimbo maior',
      teste.versoes[0].versao === '20261105-2155');
  }

  console.log('\nC. O ranque e a janela: três contas que é fácil confundir');
  {
    const escola = indices.construir(mundo({ calango: versoesDoCaso() })).escolas.calango;
    const por = new Map(escola.aspectos.map((a) => [a.aspecto, a]));
    const joelhos = por.get('formato-anatomico-dos-joelhos');
    const arco = por.get('arquitetura-do-arco-plantar');
    const equilibrio = por.get('equilibrio-unipodal');

    provar('o aspecto mais escolhido está no topo do ranque',
      escola.aspectos[0].aspecto === 'formato-anatomico-dos-joelhos', escola.aspectos.map((a) => a.aspecto));
    provar('…com `contagem` = recortes VIGENTES que o olham hoje', joelhos.contagem === 1, joelhos.contagem);
    provar('…e `versoes` = actos que alguma vez o escolheram — a conta que separa a série do ranque',
      joelhos.versoes === 3, joelhos.versoes);
    provar('a janela do joelho começa no primeiro acto e acaba no último',
      joelhos.primeira === '20261101-1000' && joelhos.ultima === '20261105-2155', [joelhos.primeira, joelhos.ultima]);

    /* O CASO QUE A SÉRIE EXISTE PARA MOSTRAR: um aspecto que se olhava e já não se olha. */
    provar('o `equilibrio-unipodal` já foi olhado (2 actos) e hoje só numa linha',
      equilibrio.versoes === 2 && equilibrio.contagem === 1, [equilibrio.versoes, equilibrio.contagem]);
    provar('…e a sua janela atravessa o abandono na linha «teste»',
      equilibrio.primeira === '20261103-1000' && equilibrio.ultima === '20261104-0900',
      [equilibrio.primeira, equilibrio.ultima]);
    provar('o arco plantar entrou no último acto — a janela dele começa lá',
      arco.primeira === '20261105-2155' && arco.ultima === '20261105-2155', [arco.primeira, arco.ultima]);

    provar('a lápide NÃO conta no ranque: o aspecto da linha apagada fica com `contagem: 0`',
      por.get('mobilidade-de-quadril-en-dehors-de-origem').contagem === 0,
      por.get('mobilidade-de-quadril-en-dehors-de-origem'));

    /* A FACETA, que é a mesma lista vista pela forma das outras (verificação 10 confere a
     * contagem contra os ids, e ela tem de bater). */
    const faceta = escola.filtros.aspectos.find((f) => f.valor === 'formato-anatomico-dos-joelhos');
    provar('a faceta `aspectos` existe, com o id do recorte que o olha',
      faceta && faceta.contagem === 1 && faceta.ids.join('|') === 'recorte:teste', faceta);
    provar('…e a contagem da faceta é o número de ids, como toda a faceta (§7.1)',
      escola.filtros.aspectos.every((f) => f.contagem === f.ids.length));
  }

  console.log('\nD. A lápide: o passado fica, o presente não a mostra viva');
  {
    const escola = indices.construir(mundo({ calango: versoesDoCaso() })).escolas.calango;
    const apagada = escola.recortes.find((r) => r.linha === 'apagada');
    provar('a linha apagada continua no índice', Boolean(apagada));
    provar('…marcada, com a data do apagar',
      apagada.apagada === true && apagada.apagada_em === '2026-11-05T12:00:00.000Z', apagada);
    provar('…e não é vigente', apagada.vigente === false);
    provar('…mas os seus dois actos continuam na série', apagada.versoes.length === 2, apagada.versoes.length);
    provar('o mestre conta só as VIGENTES', escola.escola.contagens.recortes === 2,
      escola.escola.contagens.recortes);
  }

  console.log('\nE. O acesso: `recortes` e `aspectos` não atravessam para o acervo transversal');
  {
    const construido = indices.construir(mundo({ calango: versoesDoCaso() }));
    const acervo = construido.acervo;
    provar('o acervo transversal NÃO tem `recortes`', acervo.recortes === undefined);
    provar('…NEM `aspectos`', acervo.aspectos === undefined);
    provar('…NEM a faceta', !(acervo.filtros && acervo.filtros.aspectos));
    provar('mas leva a CONTAGEM — um número não é o dado',
      acervo.escolas[0].contagens.recortes === 2, acervo.escolas[0].contagens);
    provar('e o índice da escola tem os dois, como listas',
      Array.isArray(construido.escolas.calango.recortes) && Array.isArray(construido.escolas.calango.aspectos));
  }

  console.log('\nF. O determinismo: duas construções com a mesma entrada dão o mesmo JSON');
  {
    const uma = indices.construir(mundo({ calango: versoesDoCaso() }));
    const outra = indices.construir(mundo({ calango: versoesDoCaso() }));
    provar('a escola inteira é igual', indices.iguais(uma.escolas.calango, outra.escolas.calango));
    provar('…e o acervo também', indices.iguais(uma.acervo, outra.acervo));
    /* CONTROLE POSITIVO: a ordem de ENTRADA não muda nada — o agrupamento ordena por carimbo. */
    const trocadas = versoesDoCaso().reverse();
    const deTraz = indices.construir(mundo({ calango: trocadas }));
    provar('CONTROLE: a ordem em que os ficheiros chegam não muda o índice',
      indices.iguais(uma.escolas.calango, deTraz.escolas.calango));
  }

  console.log('\nG. O DESENHO REAL: o gerador de hoje emite a lista (vazia, e é a verdade)');
  {
    /* O REPOSITÓRIO AINDA NÃO TEM NENHUM FICHEIRO DE LINHA DE BASE — o primeiro nasce quando o
     * professor concluir e enviar. O índice diz ZERO, e dizê-lo é o correcto: um índice que
     * inventasse linhas seria pior do que um vazio. O que esta secção prova é que a chave existe
     * na forma certa, e não que há dados. */
    const emMemoria = gerador.gerarEmMemoria();
    const calango = JSON.parse(emMemoria.arquivos.get('indices/escolas/calango.json'));
    const acervo = JSON.parse(emMemoria.arquivos.get('indices/acervo.json'));
    provar('o índice da escola tem `recortes` e `aspectos` como listas',
      Array.isArray(calango.recortes) && Array.isArray(calango.aspectos));
    provar('…e a faceta também', Array.isArray(calango.filtros.aspectos));
    provar('o acervo transversal não os tem, e traz a contagem',
      acervo.recortes === undefined && acervo.aspectos === undefined
        && typeof acervo.escolas[0].contagens.recortes === 'number');
    const disco = JSON.parse(fs.readFileSync(path.join(RAIZ, 'indices/escolas/calango.json'), 'utf8'));
    provar('e o índice no disco é o que o gerador produz (sem regeneração pendente)',
      indices.iguais(disco, calango));
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o recorte entra no índice gerado com a série, sem apelido, e o que é de escola não atravessa.'
    : 'FALHOU — ' + falhas + ' de ' + provas + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nERRO na prova:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
