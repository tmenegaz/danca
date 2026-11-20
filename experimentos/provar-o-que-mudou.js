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
 *   B. O DESENHO DO BOTÃO — os três estados: sem comparação (escondido), igual (escondido, e diz
 *      porquê), mudou (visível, com o CONTADOR do que falta e a lista do que mudou). E o texto
 *      antigo — «Levar ao ciclo o que esta Turma declara hoje…» — NÃO pode voltar: foi ela que o
 *      mandou tirar. E o «!» não volta: virou contador a 20/11/2026.
 *   C. O CANCELAR DAS HABILITAÇÕES — o botão existe, está na tabela dos cancelares, e o gesto
 *      devolve o que está declarado antes de fechar.
 *   D. O DICIONÁRIO — o quarto item, e a razão de ele ter ficado de fora na primeira versão (não
 *      havia fotografia). Mede-se o verbete, o vocabulário, as duas frases no «title», e os dois
 *      silêncios: um `.fipp` sem o selo novo e um lado que não mediu.
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
    conferir('os três primeiros itens, cada um com a frase inteira que vai no `title`',
      osTres.mudou.every((m) => /^[AO] /.test(m.rotulo) && m.rotulo.length > 12),
      osTres.mudou.map((m) => m.rotulo));
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

    /* O ESTADO DO DESENHO: ESCONDIDO, porque ainda não se comparou nada (20/11/2026). */
    conferir('sem comparação, o botão nasce ESCONDIDO e apagado',
      /data-ciclo-atualizar/.test(semComparacao) && / hidden/.test(semComparacao)
        && / disabled/.test(semComparacao) && /A verificar/.test(semComparacao),
      semComparacao.slice(0, 200));
    conferir('…e sem contador — não há prova nenhuma ainda',
      !/selo alerta/.test(semComparacao), semComparacao.slice(0, 200));

    /* A VALIDAÇÃO A DIZER «É IGUAL»: ESCONDIDO — «ele vai ficar escondido. Ele só vai aparecer
     * caso tenha realmente algo a ser atualizado». */
    conferir('quando a validação diz «é igual», o botão fica ESCONDIDO',
      / hidden/.test(igual) && / disabled/.test(igual), igual.slice(0, 200));
    conferir('…e o `title` diz por que não há nada a fazer',
      /Nada mudou desde o último ciclo/.test(igual), igual.slice(0, 240));
    conferir('…sem contador e sem inventar itens',
      !/selo alerta/.test(igual) && !/modificada/.test(igual), igual.slice(0, 240));

    /* A VALIDAÇÃO A DIZER «MUDOU»: VISÍVEL, ligado, com CONTADOR (20/11/2026 — «um contador ao
     * invés do ponto de exclamação»). */
    conferir('quando mudou, o botão APARECE e fica ligado',
      !/ hidden/.test(mudouRegua) && !/ disabled/.test(mudouRegua), mudouRegua.slice(0, 200));
    conferir('…e o «!» deu lugar ao CONTADOR — o número do que vai ser atualizado',
      /<span class="selo alerta contador"[^>]*>1<\/span>/.test(mudouRegua), mudouRegua.slice(0, 300));
    conferir('…e o `title` está em LISTA — «Foi modificado:» e um item por linha',
      /title="Foi modificado:\n· a régua"/.test(mudouRegua), mudouRegua.slice(0, 400));

    /* DUAS COISAS MUDADAS: o contador diz 2, e a lista tem duas linhas na ordem do cartão. */
    const duas = htmlDe({ mudou: [
      { chave: 'habilidade', rotulo: 'A habilidade do professor foi modificada' },
      { chave: 'dicionario', rotulo: 'O dicionário foi modificado' },
    ], podeAtualizar: true, leu: true });
    conferir('duas mudanças: o contador diz 2',
      />2<\/span>/.test(duas), duas.slice(0, 400));
    conferir('…e a lista tem as duas, uma por linha',
      /Foi modificado:\n· a habilidade do professor\n· o dicionário/.test(duas),
      duas.slice(0, 500));
    conferir('…e o `title` do botão é a mesma lista (o contador repete-a no `aria-label`)',
      (duas.match(/Foi modificado:/g) || []).length === 3, duas.slice(0, 600));

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

    /* O CONTADOR É A PEÇA DA CASA — o mesmo `selo alerta` da revisão da Turma, com `role`/`aria`
     * (um número sozinho não se lê em voz alta). */
    conferir('o contador usa a peça da casa (`selo alerta`) e diz o que conta no leitor de ecrã',
      /role="img"/.test(mudouRegua) && /aria-label="Foi modificado:\n· a régua"/.test(mudouRegua),
      mudouRegua.slice(0, 500));

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
    /* À DIREITA DO «GRAVAR» (20/11/2026) — «Ele é à direita do gravar e não à esquerda do gravar.
     * Tem que seguir o padrão.» O padrão dos quatro outros formulários com `par-botoes`: a acção
     * principal primeiro, o recuo depois. */
    conferir('…e fica à DIREITA do «Gravar», como nos outros quatro formulários',
      html.indexOf('id="hab-enviar"') < html.indexOf('id="hab-cancelar"'), null);
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

  // ==========================================================================
  console.log('\nD. O DICIONÁRIO — o quarto item, e o que ele acrescenta');

  {
    /* O CASO DELA, ao vivo: alterou a categoria do verbo «Plié» e o botão só dizia «a habilidade
     * do professor foi modificada». O dicionário não estava na comparação porque não havia contra
     * o que comparar — o plano carrega o NOME do exercício, não o verbete. A fotografia passou a
     * existir: o `.fipp` regista o selo do alfabeto e do vocabulário (o sha do conteúdo, medido), e
     * a rota mede o dicionário de agora. */
    const base = { rubrica: ['Ótimo'], repertorio: ['Plié'], metodologia: 'RAD' };
    const selo = { notacaoSha: 'a'.repeat(64), vocabularioSha: 'b'.repeat(64) };

    const verbeteMudou = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, base, { dicionario: Object.assign({}, selo, { notacaoSha: 'c'.repeat(64) }) }),
      documento: Object.assign({}, base, { dicionario: selo }),
    });
    conferir('o verbete alterado acende o «!» como «O dicionário foi modificado»',
      verbeteMudou.igual === false
        && verbeteMudou.mudou.length === 1
        && verbeteMudou.mudou[0].chave === 'dicionario'
        && verbeteMudou.mudou[0].rotulo === 'O dicionário foi modificado', verbeteMudou);

    /* O NOME E A TRADIÇÃO vivem no vocabulário, não no alfabeto. Comparar só o alfabeto deixaria
     * passar metade dos casos que ela nomeou («inclusive o nome do exercício»). */
    const vocabularioMudou = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, base, { dicionario: Object.assign({}, selo, { vocabularioSha: 'd'.repeat(64) }) }),
      documento: Object.assign({}, base, { dicionario: selo }),
    });
    conferir('…e a alteração do VOCABULÁRIO (nome, tradição, classificação) também',
      vocabularioMudou.igual === false && vocabularioMudou.mudou[0].chave === 'dicionario',
      vocabularioMudou);

    /* O BOTÃO DIZ TUDO O QUE MUDOU — ela viu só a habilidade e estranhou: «o dicionário não
     * aparece de jeito nenhum aqui». */
    const dois = oQueMudouNucleo.oQueMudou({
      hoje: Object.assign({}, base, { metodologia: 'Vaganova', dicionario: Object.assign({}, selo, { notacaoSha: 'c'.repeat(64) }) }),
      documento: Object.assign({}, base, { dicionario: selo }),
    });
    conferir('duas mudanças dão DUAS frases no «title», na ordem do cartão',
      oQueMudouNucleo.fraseDoQueMudou(dois.mudou)
        === 'A habilidade do professor foi modificada · O dicionário foi modificado',
      oQueMudouNucleo.fraseDoQueMudou(dois.mudou));

    /* O VAZIO NÃO ACUSA — a doutrina de sempre. Um ciclo anterior ao selo do vocabulário declara
     * só o alfabeto; um Worker que não conseguiu medir não declara nada. Nenhum dos dois é «mudou». */
    conferir('um `.fipp` sem selo do vocabulário NÃO acusa (não declarado ≠ diferente)',
      oQueMudouNucleo.oQueMudou({
        hoje: Object.assign({}, base, { dicionario: Object.assign({}, selo, { vocabularioSha: 'd'.repeat(64) }) }),
        documento: Object.assign({}, base, { dicionario: { notacaoSha: selo.notacaoSha } }),
      }).igual === true, null);
    conferir('e um lado que não mediu (null) cala a comparação',
      oQueMudouNucleo.oQueMudou({
        hoje: Object.assign({}, base, { dicionario: selo }),
        documento: Object.assign({}, base, { dicionario: null }),
      }).igual === true, null);

    /* A FOTOGRAFIA É LIDA DA ÂNCORA, e é a âncora que diz com que dicionário o documento foi
     * escrito. O leitor é do servidor e devolve `null` — não um retrato vazio — quando não há
     * âncora: um ciclo de antes do selo não pode acender o botão para sempre. */
    const semAncora = await bastidores.dicionarioDoCiclo({}, { professor: '', ciclo: '01', variante: 'x' });
    conferir('sem professor (ou sem token) o leitor da âncora devolve `null`',
      semAncora === null, semAncora);

    /* A LISTA DOS ITENS, e ela é a do cartão: a régua, o conteúdo, a habilidade e o dicionário. */
    conferir('o dicionário é o quarto item, e vem depois da habilidade',
      JSON.stringify(oQueMudouNucleo.ORDEM)
        === JSON.stringify(['regua', 'estilo', 'habilidade', 'dicionario']),
      oQueMudouNucleo.ORDEM);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: o botão «Atualizar o ciclo» nasce escondido, só '
      + 'quando a comparação prova que a régua, o conteúdo, a habilidade do professor ou o '
      + 'dicionário (o verbete e o vocabulário) mudaram, '
      + 'aparece com o CONTADOR do que falta e a lista do que mudou no `title`, e não gasta um '
      + 'ciclo quando os documentos já dizem o mesmo. E o «Cancelar» das habilitações devolve o que '
      + 'está declarado, fecha o formulário e fica à direita do «Gravar».'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('\nA PROVA REBENTOU:', erro && erro.stack ? erro.stack : erro);
  process.exit(1);
});
