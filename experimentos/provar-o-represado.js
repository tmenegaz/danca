/**
 * provar-o-represado.js — O AJUSTE DO DICIONÁRIO FICA PRESO NA TURMA, E NÃO GASTA UM CICLO.
 *
 * A DECISÃO, na letra dela (20/11/2026), e ela substitui a de 19/11:
 *
 *   «Mas essa decisão que eu tomei […] tem um motivo, que era a contenção de custos. Não é para
 *   gerar ciclo, aumentar o custo no workflow para algo que não tem impacto no ciclo, não tem
 *   impacto no que já está acontecendo. Só vai ter impacto no próximo […]. Então ela fica presa,
 *   fica represada na turma. […] E aí qualquer um que dispare através da turma, não só por meio do
 *   botão, mas qualquer outra ação que seja disparada por meio da turma vai atualizar. […] Mas se
 *   não for nada e o professor decidir que é melhor então ele atualizar naquele momento, ele vai lá
 *   em turma e atualiza ali por meio do botão.»
 *
 * O QUE SE MEDE, e porque cada coisa:
 *
 *   A. OS CINCO GESTOS DO DICIONÁRIO NÃO DISPARAM NADA. Gravar, editar e apagar um verbete, e
 *      editar e apagar um termo, passam todos por `comAGeracaoDoTermo`. Nenhum pode chamar o
 *      disparador — e é isso que a secção mede, no texto do código e no comportamento.
 *   B. O QUE ELES DEVOLVEM É UM REGISTO, e não um disparo: as Turmas que usam o exercício, e a
 *      frase que diz onde é que se gera agora.
 *   C. SEM TURMA QUE USE O EXERCÍCIO, o ajuste é só do dicionário — e nada fica à espera.
 *   D. A FRASE DO CANTO diz as três coisas: ficou registado, não foi gerado nada, e o botão é a
 *      porta para o fazer agora. Um aviso que só dissesse «registado» deixaria a pessoa à espera de
 *      documentos que não vêm.
 */

const path = require('path');
const fs = require('fs');
const RAIZ = path.resolve(__dirname, '..');
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let provas = 0;
let falhas = 0;
function conferir(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('ok    ' + titulo); return; }
  falhas += 1;
  console.log('FALHA ' + titulo
    + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/** Um KV de mentira, com o que o `turmasQueUsamOTermo` lê: as salas e as curadorias — que é a
 *  camada NOVA do mapa de conteúdos (a antiga, `turma-conteudos`, já foi migrada a 19/11). */
function kvDe(curadorias, turmas) {
  const mapa = new Map();
  mapa.set('bastidores/breu/turmas', JSON.stringify(turmas));
  mapa.set('bastidores/breu/curadorias', JSON.stringify(curadorias));
  return {
    async get(chave) {
      const bruto = mapa.get(String(chave));
      return bruto === undefined ? null : bruto;
    },
  };
}

/** A curadoria vigente da Turma «Rosa», que declara o «Plié» no repertório. */
const CURADORIA_ROSA = [{
  id: 'demi-plie-bale-classico-rosa', professor: 'demi-plie', modalidade: 'Balé clássico',
  turmas: ['Rosa'], repertorio: ['Plié'], alunas: ['A'], linhaDeBase: 'e',
}];

(async () => {
  const FONTE = fs.readFileSync(path.join(RAIZ, 'motor/servidor/bastidores.js'), 'utf8');

  // ==========================================================================
  console.log('\nA. OS GESTOS DO DICIONÁRIO NÃO DISPARAM A GERAÇÃO');

  {
    /* O CORPO de `comAGeracaoDoTermo` — do `async function` até ao fecho da função. Medir o corpo
     * e não o ficheiro inteiro é o que torna a asserção sobre o GESTO, e não sobre o módulo: o
     * `gerarOsCiclosDoTermo` continua a existir e o elenco continua a gerar. */
    const inicio = FONTE.indexOf('async function comAGeracaoDoTermo(');
    const fim = FONTE.indexOf('\n}\n', inicio);
    const corpo = inicio === -1 ? '' : FONTE.slice(inicio, fim + 3);
    conferir('a função que os cinco gestos chamam já não gera — não chama o gerador',
      Boolean(corpo) && !/gerarOsCiclosDoTermo\s*\(/.test(corpo), corpo.slice(0, 300));
    conferir('…e chama o REGISTO, que é o que a decisão pede',
      /termoFicaRepresado\s*\(/.test(corpo), corpo.slice(0, 300));

    /* E os SEIS sítios continuam a passar por ela — a troca não deixou nenhum órfão a gerar. São
     * seis chamadas (gravar, editar e apagar verbete; editar duas vezes e apagar o termo) mais a
     * declaração. O número está aqui para o dia em que alguém acrescentar um gesto novo: ou passa
     * por esta função, ou este número muda e obriga a olhar. */
    const chamadas = (FONTE.match(/comAGeracaoDoTermo\(/g) || []).length;
    conferir('os seis gestos do dicionário passam todos pela mesma função',
      chamadas === 7, { chamadas });
    conferir('e nenhuma rota chama o gerador directamente',
      (FONTE.match(/gerarOsCiclosDoTermo\(/g) || []).length === 1, null);
  }

  // ==========================================================================
  console.log('\nB. O QUE O GESTO DEVOLVE É UM REGISTO, COM AS TURMAS À ESPERA');

  {
    const turmas = [{ id: 'rosa', nome: 'Rosa', ativo: true, modalidade: 'Balé clássico' }];
    const env = { PADD_KV: kvDe(CURADORIA_ROSA, turmas), GITHUB_TOKEN: null };

    const r = await bastidores.termoFicaRepresado(env, 'breu', 'Plié');
    conferir('devolve as Turmas que usam o exercício, como `represado`',
      JSON.stringify(r.represado) === JSON.stringify(['Rosa']), r);
    conferir('…e um `turmas` igual, para quem já lia esse campo não ficar cego',
      JSON.stringify(r.turmas) === JSON.stringify(['Rosa']), r.turmas);
    conferir('…e NENHUM disparo — nada foi gerado',
      r.disparos === undefined, r.disparos);
    conferir('…e a frase diz que fica registado e onde se gera agora',
      /registado na Turma «Rosa»/.test(r.aviso || '') && /Atualizar o ciclo/.test(r.aviso || ''),
      r.aviso);
  }

  // ==========================================================================
  console.log('\nC. SEM TURMA QUE USE O EXERCÍCIO, NÃO HÁ NADA À ESPERA');

  {
    const env = { PADD_KV: kvDe([], [{ id: 'rosa', nome: 'Rosa', ativo: true }]), GITHUB_TOKEN: null };
    const r = await bastidores.termoFicaRepresado(env, 'breu', 'Exercício Que Ninguém Usa');
    conferir('a lista das Turmas à espera vem vazia', (r.represado || []).length === 0, r);
    conferir('…e o motivo diz que nenhuma Turma o usa (e não uma falha)',
      r.motivo === 'sem-turma', r.motivo);
    conferir('…e a frase diz que nenhum documento precisa de ser refeito',
      /nenhum documento precisa de ser refeito/.test(r.aviso || ''), r.aviso);
  }

  // ==========================================================================
  console.log('\nD. A FRASE DO CANTO — registado, não gerado, e a porta para o fazer agora');

  {
    /* A frase vive dentro do `<script>` da página da Produção, e é medida no texto que o servidor
     * serve — é assim que esta casa prova o que a tela diz sem levantar um navegador. */
    const html = bastidores.paginaProducao('breu', {},
      [{ nome: 'Demi Plié', slug: 'demi-plie' }], [], 'Demi', 'demi-plie',
      [{ nome: 'Rosa', modalidade: 'bale-classico', professor: 'demi-plie' }],
      [{ id: 'plie', termo: 'Plié', categoria: 'passo' }], { 'sala-n': ['plie'] },
      [{ id: 'cu-n', professor: 'demi-plie', modalidade: 'bale-classico', turmas: ['Rosa'],
        alunas: ['A'], repertorio: ['Plié'], linhaDeBase: 'e' }],
      [{ id: 'padrao', nome: 'Padrão', professor: 'demi-plie', niveis: ['Ótimo'] }],
      [{ professor: 'demi-plie', turma: 'Rosa', ciclo: '01' }],
      { professores: new Set(['demi-plie']), turmas: new Set(['Rosa']),
        termos: new Set(['plie']), planos: 1 },
      null, 'sala-n', [], new Set(), { ok: true, contrato: null });

    conferir('a página sabe dizer o caso represado', /g\.represado/.test(html), null);
    conferir('…que o ajuste passa ao ciclo na PRÓXIMA geração',
      /Passa ao ciclo na próxima geração/.test(html), null);
    conferir('…e que o «Atualizar o ciclo» é a porta para o fazer agora',
      /use «Atualizar o ciclo» no cartão da Turma/.test(html), null);
    conferir('…e o aviso é do tipo «ok» — é um registo, e não um problema',
      /avisar\("ok", "ajuste registado em "/.test(html), null);
    conferir('o caso «nenhuma Turma usa» também é dito, em vez de silêncio',
      /nenhuma Turma usa este exercício/.test(html), null);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: gravar um verbete ou um termo não dispara geração '
      + 'nenhuma (o motivo é o custo), o ajuste fica registado com as Turmas que o usam, o contador '
      + 'do «Atualizar o ciclo» é quem mostra o que está à espera, e a frase do canto diz as três '
      + 'coisas — ficou registado, não foi gerado, e o botão é a porta para o fazer agora.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('a prova estourou:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
