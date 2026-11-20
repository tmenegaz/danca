/**
 * provar-o-que-mudou.js — O BOTÃO «ATUALIZAR O CICLO» SÓ ACENDE QUANDO MUDOU ALGUMA COISA.
 *
 * O PEDIDO, na letra dela (20/11/2026): «Esse botão de atualizar ciclo precisa de uma validação, a
 * gente não vai gastar recurso à toa. Cada vez que é modificado um desses itens que estão
 * envolvidos direto com o atualizar ciclo, tem que validar. Você olha lá no plano de ensino […]
 * e vê se está diferente. […] E o botão atualizar ciclo, para a gente não gastar recurso, tem que
 * ficar desabilitado. Só vai habilitar e colocar esse ponto de exclamação se realmente passou na
 * validação e é uma mudança legítima.»
 *
 * O QUE SE MEDE AQUI, e porque cada coisa:
 *
 *   A. O NÚCLEO — as três comparações e as regras que não são óbvias (a régua é uma escala e a
 *      ordem mede; o conteúdo é um conjunto; o vazio nunca acusa). É onde vive a decisão, e é onde
 *      um erro custa um ciclo inteiro.
 *   B. O DESENHO DO BOTÃO — os três estados: sem comparação (apagado), igual (apagado, e diz
 *      porquê), mudou (ligado, com «!» e a frase do que mudou). E o texto antigo — «Levar ao ciclo
 *      o que esta Turma declara hoje…» — NÃO pode voltar: foi ela que o mandou tirar.
 *   C. O CANCELAR DAS HABILITAÇÕES — o botão existe, está na tabela dos cancelares, e o gesto
 *      devolve o que está declarado antes de fechar.
 *
 * O QUE NÃO SE MEDE AQUI: a travessia inteira (o `derivarPlano` a reler a régua e a tradição) tem
 * secção própria em `provar-cadeia-automatica.js` (L), porque precisa do acervo e das fontes. Aqui
 * mede-se o que DECIDE e o que se VÊ.
 */

const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const oQueMudouNucleo = require(path.join(RAIZ, 'motor/nucleo/o-que-mudou.js'));
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

(async () => {
  // ==========================================================================
  console.log('\nA. O NÚCLEO — o que mudou entre o que se declara hoje e o que o papel diz');

  {
    const REGUA_A = ['Satisfatório', 'Razoável', 'Em desenvolvimento', 'Não se aplica'];
    const REGUA_B = ['Em desenvolvimento', 'Razoável', 'Satisfatório', 'Não se aplica'];
    const igual = { rubrica: REGUA_A, repertorio: ['Plié', 'Tendu'], metodologia: 'RAD' };

    conferir('nada mudou: o veredito é `igual` e a lista vem vazia',
      oQueMudouNucleo.oQueMudou({ hoje: igual, documento: igual }).igual === true,
      oQueMudouNucleo.oQueMudou({ hoje: igual, documento: igual }));

    /* A RÉGUA É UMA ESCALA: a ordem é o que ela mede. */
    const reguaTrocada = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { rubrica: REGUA_B }), documento: igual });
    conferir('a régua com a MESMA lista noutra ordem É uma mudança (a escala é a ordem)',
      reguaTrocada.igual === false && reguaTrocada.mudou[0].chave === 'regua', reguaTrocada);

    /* O CONTEÚDO É UM CONJUNTO, e nos dois sentidos. */
    const entrou = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { repertorio: ['Plié', 'Tendu', 'Relevé'] }), documento: igual });
    conferir('um exercício que a Turma passou a declarar acusa `estilo`',
      entrou.mudou.length === 1 && entrou.mudou[0].chave === 'estilo', entrou);
    const saiu = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { repertorio: ['Plié'] }), documento: igual });
    conferir('…e um que o plano ainda imprime e a Turma já não ensina também',
      saiu.mudou.length === 1 && saiu.mudou[0].chave === 'estilo', saiu);
    const outraOrdem = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { repertorio: ['Tendu', 'Plié'] }), documento: igual });
    conferir('…mas a ORDEM do conteúdo não é uma mudança (é um conjunto)',
      outraOrdem.igual === true, outraOrdem);

    /* A HABILIDADE — a tradição, como conjunto. */
    const tradicaoNova = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { metodologia: 'Francesa' }), documento: igual });
    conferir('outra tradição acusa `habilidade`',
      tradicaoNova.mudou.length === 1 && tradicaoNova.mudou[0].chave === 'habilidade', tradicaoNova);
    const duasTradicoes = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { metodologia: ['RAD', 'Vaganova'] }), documento: igual });
    conferir('…e ensinar uma segunda tradição também',
      duasTradicoes.mudou.some((m) => m.chave === 'habilidade'), duasTradicoes);
    const caixaDiferente = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { metodologia: 'rad' }), documento: igual });
    conferir('…e a CAIXA não é uma mudança («rad» e «RAD» são a mesma tradição)',
      caixaDiferente.igual === true, caixaDiferente);

    /* O VAZIO NÃO ACUSA — a convenção da casa, e a razão de ela existir. */
    const semRegua = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { rubrica: [] }), documento: igual });
    conferir('CONTROLE: sem régua declarada hoje, nada se acusa',
      semRegua.igual === true, semRegua);
    const semNoPapel = oQueMudouNucleo.oQueMudou({
      hoje: igual, documento: { rubrica: [], repertorio: [], metodologia: '' } });
    conferir('CONTROLE: um documento antigo que não declara os campos não é «diferente»',
      semNoPapel.igual === true, semNoPapel);
    /* O PROFESSOR GENERALISTA NÃO ACENDE O BOTÃO PARA SEMPRE — é o caso da `breu`, onde o perfil
     * declara `[]` (não ensina nenhuma tradição) e o plano diz RAD. Acusar aqui acenderia o «!» em
     * todas as Turmas dele, para sempre, e um aviso sempre aceso não se lê. */
    const generalista = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, igual, { metodologia: [] }), documento: igual });
    conferir('CONTROLE: «não ensina nenhuma tradição» não acusa (o vazio não conta)',
      generalista.igual === true, generalista);

    /* OS TRÊS AO MESMO TEMPO, na ordem da leitura. */
    const osTres = oQueMudouNucleo.oQueMudou({
      hoje: { rubrica: REGUA_B, repertorio: ['Plié'], metodologia: 'Francesa' }, documento: igual });
    conferir('com os três diferentes, a lista vem na ordem régua → estilo → habilidade',
      osTres.mudou.map((m) => m.chave).join(',') === 'regua,estilo,habilidade',
      osTres.mudou.map((m) => m.chave));
    conferir('…e cada um traz a frase inteira, que é a que vai no `title`',
      osTres.mudou.every((m) => /^[AO] /.test(m.rotulo) && m.rotulo.length > 12),
      osTres.mudou.map((m) => m.rotulo));

    /* O DICIONÁRIO NÃO ESTÁ AQUI, e a ausência é uma decisão declarada: o corpo de um verbete não
     * viaja no plano, portanto não há contra o que comparar. Quem o leva ao papel é a geração. */
    conferir('o núcleo NÃO inventa um item para o dicionário (não há contra o que comparar)',
      oQueMudouNucleo.ORDEM.join(',') === 'regua,estilo,habilidade'
        && !('dicionario' in oQueMudouNucleo.ROTULOS), oQueMudouNucleo.ORDEM);
  }

  // ==========================================================================
  console.log('\nB. O DESENHO DO BOTÃO — os três estados, e o texto que não pode voltar');

  {
    const CU = {
      id: 'demi-plie-bale-classico-rosa', professor: 'demi-plie',
      modalidade: 'bale-classico', turmas: ['Rosa'],
    };
    /* O BOTÃO RECORTA-SE DO RESTO DAS ACÇÕES — o «Excluir» da Turma vinculada também traz
     * `disabled`, e medir a string inteira diria «o Excluir está apagado» quando a pergunta é
     * sobre o «Atualizar o ciclo». Foi este detalhe que fez a primeira versão desta prova falhar
     * — e é a mesma armadilha de sempre: medir o conjunto quando a pergunta é sobre uma peça. */
    const htmlDe = (estado) => {
      const todas = bastidores.acoesDaCuradoria(CU, true, estado);
      const i = todas.indexOf('<button class="atualizar-ciclo');
      if (i === -1) return '';
      const fim = todas.indexOf('</button>', i);
      return fim === -1 ? todas.slice(i) : todas.slice(i, fim + 9);
    };
    const semComparacao = htmlDe(null);
    const igual = htmlDe({ mudou: [], podeAtualizar: false, leu: true });
    const mudouRegua = htmlDe({
      mudou: [{ chave: 'regua', rotulo: 'A régua foi modificada' }], podeAtualizar: true, leu: true });
    const naoLeu = htmlDe({ mudou: [], podeAtualizar: true, leu: false,
      motivo: 'Não consegui ler o plano de ensino agora — atualizar deriva-o na mesma.' });

    /* O ESTADO DO DESENHO: apagado, porque ainda não se comparou nada. */
    conferir('sem comparação, o botão nasce APAGADO',
      /data-ciclo-atualizar/.test(semComparacao) && / disabled/.test(semComparacao)
        && /A verificar/.test(semComparacao), semComparacao.slice(0, 200));
    conferir('…e sem o «!» — não há prova nenhuma ainda',
      !/class="selo alerta"/.test(semComparacao), semComparacao.slice(0, 200));

    /* A VALIDAÇÃO A DIZER «É IGUAL»: apagado, e com a razão. */
    conferir('quando a validação diz «é igual», o botão fica APAGADO',
      / disabled/.test(igual), igual.slice(0, 200));
    conferir('…e o `title` diz por que não há nada a fazer',
      /Nada mudou desde o último ciclo/.test(igual), igual.slice(0, 240));
    conferir('…sem «!» e sem inventar itens',
      !/selo alerta/.test(igual) && !/modificada/.test(igual), igual.slice(0, 240));

    /* A VALIDAÇÃO A DIZER «MUDOU»: ligado, com «!», e a frase certa. */
    conferir('quando mudou, o botão fica LIGADO',
      !/ disabled/.test(mudouRegua), mudouRegua.slice(0, 200));
    conferir('…e ganha o ponto de exclamação',
      /<span class="selo alerta"[^>]*>!<\/span>/.test(mudouRegua), mudouRegua.slice(0, 300));
    conferir('…e o `title` diz SÓ o que mudou',
      /title="A régua foi modificada"/.test(mudouRegua), mudouRegua.slice(0, 300));

    /* O TEXTO ANTIGO SAIU, e ela foi explícita. */
    const todos = semComparacao + igual + mudouRegua + naoLeu;
    conferir('o texto antigo — «Levar ao ciclo o que esta Turma declara hoje» — NÃO volta',
      !/Levar ao ciclo/.test(todos), /Levar ao ciclo/.exec(todos));
    conferir('…nem a lista antiga («a régua, o conteúdo, o dicionário»)',
      !/a régua, o conteúdo/.test(todos), null);

    /* NÃO SABER NÃO É «NADA MUDOU» — a doutrina do `leu`. */
    conferir('quando não se pôde comparar, o botão fica LIGADO (sem prova de igualdade)',
      !/ disabled/.test(naoLeu), naoLeu.slice(0, 200));
    conferir('…e diz o motivo, em vez de ficar sem explicação',
      /Não consegui ler o plano/.test(naoLeu), naoLeu.slice(0, 240));

    /* O «!» É A PEÇA DA CASA — o mesmo `selo alerta` da revisão da Turma, com `role`/`aria`. */
    conferir('o «!» usa a peça que a casa já tem (`selo alerta`), com nome para o leitor de ecrã',
      /role="img"/.test(mudouRegua) && /aria-label="A régua foi modificada"/.test(mudouRegua),
      mudouRegua.slice(0, 400));

    /* E O BOTÃO NÃO EXISTE SEM PLANO — a regra de sempre. */
    const semPlano = bastidores.acoesDaCuradoria(CU, false, null);
    conferir('na Turma sem plano o botão não existe',
      !/data-ciclo-atualizar/.test(semPlano), semPlano.slice(0, 200));
  }

  // ==========================================================================
  console.log('\nC. O «CANCELAR» DAS HABILITAÇÕES — o que faltava, e o que ele faz');

  {
    const sala = { nome: 'Rosa', modalidade: 'bale-classico', professor: 'demi-plie' };
    const cu = { id: 'cu-n', professor: 'demi-plie', modalidade: 'bale-classico',
      turmas: ['Rosa'], alunas: ['A'], repertorio: ['Plié'], linhaDeBase: 'e' };
    const html = bastidores.paginaProducao('breu', {},
      [{ nome: 'Demi Plié', slug: 'demi-plie' }], [], 'Demi', 'demi-plie',
      [sala], [{ id: 'plie', termo: 'Plié', categoria: 'passo' }], { 'sala-n': ['plie'] },
      [cu], [{ id: 'padrao', nome: 'Padrão', professor: 'demi-plie', niveis: ['Ótimo'] }],
      [{ professor: 'demi-plie', turma: 'Rosa', ciclo: '01' }],
      { professores: new Set(['demi-plie']), turmas: new Set(['Rosa']),
        termos: new Set(['plie']), planos: 1 },
      null, 'sala-n', [], new Set(), { ok: true, contrato: null });

    conferir('o «Cancelar» existe na aba das habilitações',
      /id="hab-cancelar"/.test(html), null);
    conferir('…e nasce OCULTO — quem o mostra é `pintarCancelares`, com a secção aberta',
      /id="hab-cancelar" hidden/.test(html), null);
    conferir('…e está ao lado do «Gravar», e não depois dele',
      html.indexOf('id="hab-cancelar"') < html.indexOf('id="hab-enviar"'), null);
    conferir('o gesto existe e faz as duas metades — DEVOLVER e FECHAR',
      /function cancelarAsHabilitacoes\(\)/.test(html)
        && /carregarHabilitacoes\(\)/.test(html.slice(html.indexOf('function cancelarAsHabilitacoes')))
        && /cancelarOFormularioDe\("sec-professores"\)/.test(
          html.slice(html.indexOf('function cancelarAsHabilitacoes'))), null);
    conferir('…e está na tabela dos cancelares, com os outros dois do mesmo formulário',
      /\["sec-professores", \["prof-cancelar", "rubr-cancelar", "hab-cancelar"\]\]/.test(html), null);
    conferir('…e o clique está ligado ao botão',
      /habCancelar\.addEventListener\("click", cancelarAsHabilitacoes\)/.test(html), null);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o botão «Atualizar o ciclo» nasce apagado, só acende '
      + 'quando a comparação prova que a régua, o conteúdo ou a habilidade do professor mudaram, '
      + 'diz no «!» o que mudou, e não gasta um ciclo quando os documentos já dizem o mesmo. '
      + 'E o «Cancelar» das habilitações devolve o que está declarado e fecha o formulário.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nA PROVA REBENTOU:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
