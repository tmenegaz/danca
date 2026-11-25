/**
 * cobrancas.js — O PIX QUE A ESCOLA RECEBE, POR MÊS (25/11/2026).
 *
 * O QUE ELA DESCREVEU, e é o ciclo inteiro deste módulo: «Eu uso o Nubank e na área Pix do Nubank
 * tem uma função que se chama receber. E ali eu digo o valor que eu vou receber e posso escrever em
 * opções o nome da escola e o que é que ela está pagando. […] E aí eu colo o conteúdo que essa área
 * Pix cobrança do meu banco me entrega.»
 *
 * O QUE ESTE MÓDULO É: a forma da cobrança e as regras de a guardar. **Puro** — não fala com o KV,
 * não compõe HTML, não sabe o que é um ecrã. É o que se pode medir sem bancada.
 *
 * PORQUE POR MÊS, E NÃO POR ESCOLA. A ferramenta do banco gera uma cobrança para UM valor — e é o
 * valor daquele mês, com a multa e os juros do dia quando os há. Uma cobrança por escola obrigaria
 * a refazê-la a cada mês e a apagar a anterior, e o que se quer é o contrário: o registo mensal do
 * que foi entregue à escola para pagar.
 *
 * O TEXTO NÃO SE NORMALIZA ALÉM DO ESSENCIAL. «Quando eu colo no chat do WhatsApp, ele preserva a
 * estrutura toda que essa ferramenta me entrega. Então eu quero algo assim.» O Pix copia-e-cola é um
 * documento de texto: quebras de linha, espaços e agrupamentos fazem parte dele, e reformatá-lo
 * seria estragar exactamente o que se vai colar na aplicação do banco. Aqui só se troca o `\r\n` do
 * Windows por `\n` — porque a página desenha em `<textarea>`, que conta uma linha por `\n` — e
 * apara-se o que vem antes e depois do documento.
 */

const fuso = require('./fuso.js');

/** O teto do que se guarda. Um Pix copia-e-cola tem algumas centenas de caracteres; 8 000 é folga
 *  para um bloco com os dados de conciliação escritos à mão, e é pequeno o bastante para o valor do
 *  KV continuar a ser um documento e não um arquivo. Acima disto a gravação é RECUSADA — cortar o
 *  texto em silêncio deixaria uma cobrança que já não se cola no banco. */
const LIMITE_DO_TEXTO = 8000;

/** A competência no formato do livro (`AAAA-MM`). O mesmo do `mensalidades` — uma segunda forma de
 *  dizer «que mês» seria uma segunda resposta a «que mês é este?». */
function competenciaDe(mes) {
  const valor = String(mes == null ? '' : mes).trim();
  return /^[0-9]{4}-(0[1-9]|1[0-2])$/.test(valor) ? valor : null;
}

/**
 * A COBRANÇA PODE SER UM LINK, E NÃO SÓ UM DOCUMENTO (25/11/2026).
 *
 * «Para me transferir R$ 0,01 pela conta do Nubank ou de outros bancos pelo Pix, entre em
 * https://nubank.com.br/cobrar/sjlvj/6b06b7b4-… O banco gera desse jeito, percebe que tem um link,
 * então eu preciso que esse link fique habilitado, porque daí o usuário, o cliente, ele vai clicar no
 * link e vai fazer o pagamento.»
 *
 * SÃO DOIS FORMATOS, e a diferença é de quem faz o trabalho: o **documento** copia-e-cola é para o
 * cliente colar no aplicativo do banco dele; o **link** já resolve o pagamento — o cliente carrega e
 * o banco dele abre com os dados preenchidos. O sistema não escolhe: guarda o que ela colou e, se o
 * que ela colou tiver um link, mostra-o clicável ao lado.
 *
 * O PADRÃO É UM SÓ, E É ESTA CONSTANTE. O `painel-html.js` emite-a para o cliente no próprio script
 * (`new RegExp(<isto>)`) em vez de escrever uma segunda regex — duas regexes seriam duas respostas a
 * «isto é um link?», e a que sobrasse seria a que ninguém leu. O `painel-html.js` também a usa do
 * lado do servidor, pela função abaixo.
 *
 * A VALIDAÇÃO NÃO É A REGEX, É O `URL` — que existe no Node e no navegador, e é o mesmo parser. A
 * regex só recorta o candidato; quem diz «isto é um endereço válido» é o `URL`. E só `http`/`https`
 * passam: um `javascript:` colado por engano não pode virar um botão. */
const PADRAO_DA_URL = '\\bhttps?:\\/\\/[^\\s<>"\']+';

/** O primeiro endereço `http(s)` do texto, já normalizado, ou `null`. */
function urlDaCobranca(texto) {
  const bruto = String(texto == null ? '' : texto);
  let achado = null;
  try {
    achado = bruto.match(new RegExp(PADRAO_DA_URL, 'i'));
  } catch (erro) {
    achado = null;
  }
  if (!achado) return null;
  try {
    const u = new URL(achado[0]);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return u.href;
  } catch (erro) {
    return null;
  }
}

/** O documento como se guarda: `\r\n` → `\n`, e sem espaço a mais nas pontas. */
function normalizarTexto(texto) {
  return String(texto == null ? '' : texto).replace(/\r\n?/g, '\n').trim();
}

/**
 * QUANTO É QUE ESTE CÓDIGO PEDE — o valor que está DENTRO do documento Pix (25/11/2026).
 *
 * A PERGUNTA QUE ISTO RESPONDE, e é a dela: «eu ainda não sei uma solução para isso, para impedir
 * que a pessoa pague o valor menor. Ela vai ter que pagar o valor maior.»
 *
 * O Pix copia-e-cola é um texto EMV®QRCPS-MPM: pares `ID (2 dígitos) + comprimento (2 dígitos) +
 * valor`. O campo **54** é o valor da transação, em reais com ponto decimal. Quando ele existe, o
 * valor é FIXO — quem paga não o muda no aplicativo do banco. Quando não existe, o código é de
 * valor ABERTO, e quem paga escolhe quanto transfere.
 *
 * É ESSA A DIFERENÇA QUE O ECRÃ PRECISA DE SABER, e é por isso que este leitor existe:
 *
 *   · valor conhecido e abaixo do devido → a cobrança é a ANTIGA (sem a mora), e ela não serve;
 *   · valor conhecido e igual ou acima do devido → é a cobrança nova, e serve;
 *   · valor desconhecido → um código sem valor fixo não garante nada, e o ecrã diz isso em vez de
 *     fingir que garante.
 *
 * O QUE ELE NÃO FAZ: não impede ninguém de pagar um código que já recebeu. Isso não é uma
 * propriedade do sistema — é uma propriedade do Pix, e está dito em `motivo` quando o código não
 * serve. O que o sistema pode fazer é não OFERECER o código que cobra menos.
 *
 * Devolve **cêntimos**, como todo o dinheiro deste repositório, ou `null` quando o texto não é um
 * documento legível ou não traz valor.
 */
function valorDaCobranca(texto) {
  /* O documento do banco vem com quebras de linha quando se copia da tela dele, e essas quebras
   * fazem parte do texto guardado (é o que se cola no aplicativo). Aqui elas não contam: o
   * percurso dos campos é sobre a sequência, e um `\n` no meio de um campo não é um carácter do
   * EMV. Removem-se todos os espaços, que é o que um «copiar» de telemóvel acrescenta. */
  const bruto = String(texto == null ? '' : texto).replace(/\s+/g, '');
  if (!bruto) return null;
  let i = 0;
  while (i + 4 <= bruto.length) {
    const id = bruto.slice(i, i + 2);
    const comprimento = bruto.slice(i + 2, i + 4);
    if (!/^[0-9]{2}$/.test(id) || !/^[0-9]{2}$/.test(comprimento)) return null;
    const fim = i + 4 + Number(comprimento);
    /* Um comprimento que passa do fim é um documento TRUNCADO — e um documento truncado não se
     * cola no banco. Devolver `null` é a resposta certa: «não sei o valor», e não um palpite. */
    if (fim > bruto.length) return null;
    if (id === '54') {
      const numero = Number(bruto.slice(i + 4, fim));
      if (!Number.isFinite(numero) || numero <= 0) return null;
      return Math.round(numero * 100);
    }
    i = fim;
  }
  return null;
}

/**
 * A COBRANÇA DE UM MÊS SERVE, OU NÃO — e porquê (25/11/2026).
 *
 * É a regra que decide se a página mostra o botão que leva ao banco, o «Copiar», e o texto — ou se
 * o mostra em leitura, com a razão escrita. UM SÍTIO, porque as duas páginas que desenham cobrança
 * (o mês a mês e o financeiro) têm de dar a mesma resposta à mesma pergunta: duas respostas
 * divergiriam no dia em que uma fosse corrigida.
 *
 * O QUE ESTÁ EM JOGO, e é a pergunta dela: «para impedir que a pessoa pague o valor menor. Ela vai
 * ter que pagar o valor maior.» Um mês que venceu continua a aceitar o código antigo em qualquer
 * aplicativo de banco — isso é do Pix, e não há software que o mude. O que se pode fazer, e é o que
 * esta função faz, é NÃO OFERECER o código que cobra menos: a página desabilita-o e diz o valor
 * certo a gerar.
 *
 * AS DUAS PROVAS, e é preciso as duas. Uma cobrança salva ANTES de o mês vencer é, por construção, a
 * do valor cheio — quem a gerou não tinha mora para incluir. E um código cujo valor é legível diz
 * por si: se pede mais do que a mensalidade, leva a mora; se pede a mensalidade ou menos, é o
 * antigo. Uma prova só não chega:
 *
 *   · só pela DATA, uma cobrança regerada depois do vencimento passaria mesmo que ela tivesse colado
 *     a antiga outra vez;
 *   · só pelo VALOR, todo o código sem valor fixo (um link, ou um documento sem o campo) ficaria
 *     bloqueado para sempre — e bloqueado sem saída, porque não há como gerar um que seja legível.
 *
 * OS SEIS ESTADOS:
 *
 *   · `sem-cobranca` — não há nada colado. Não serve, mas também não há o que dizer.
 *   · `pago`         — o mês está pago. O documento fica à vista como registo, e não há o que pagar.
 *   · `a-vencer`     — mês em aberto e ainda no prazo. Serve: é a cobrança que se entrega.
 *   · `com-mora`     — mês vencido, e a cobrança foi emitida já com o atraso (ou pede mais do que a
 *                      mensalidade). Serve; se ficou aquém do devido de hoje, a diferença vai dita.
 *   · `sem-mora`     — mês vencido e o código pede a mensalidade ou menos: é o ANTIGO. Não serve.
 *   · `sem-valor`    — mês vencido, sem valor legível, e emitida antes do vencimento. Não se pode
 *                      provar que leva a mora. Não serve — e o ecrã diz o valor a gerar.
 *
 * `valorBaseCentavos` é a mensalidade do mês; `devidoCentavos` é o que se cobra hoje com a mora
 * (`m.encargos.totalCentavos`). A comparação com a BASE — e não com o devido — é a decisão que evita
 * um ecrã a piscar: os juros são pro rata die, e uma cobrança emitida hoje com a mora de hoje fica
 * «um dia curta» amanhã. Comparada com a base, ela continua a servir; o que falta acerta-se na
 * conciliação, e o número do que falta vai dito.
 */
function situacaoDaCobranca({ texto, valorBaseCentavos, devidoCentavos, pago, venceu,
  salvoEm, emissaoDia, vencimento, atrasoEm } = {}) {
  const valorNoCodigo = valorDaCobranca(texto);
  const base = Math.max(0, Math.round(Number(valorBaseCentavos) || 0));
  const devido = Math.max(0, Math.round(Number(devidoCentavos) || 0)) || base;
  /* `faltaCentavos` NÃO entra aqui: ele é a diferença que só existe no estado `com-mora`, e um
   * `Object.assign` com ele em `comum` apagava-o — foi assim que a primeira versão dizia «falta
   * R$ 0,00» sobre uma cobrança de R$ 72,00 num mês que devia R$ 72,70. */
  const comum = {
    valorCentavos: valorNoCodigo, baseCentavos: base, devidoCentavos: devido,
  };
  if (!String(texto == null ? '' : texto).trim()) {
    return Object.assign({ estado: 'sem-cobranca', serve: false, motivo: null }, comum);
  }
  if (pago) {
    return Object.assign({
      estado: 'pago', serve: false,
      motivo: 'Mês pago — a cobrança fica à vista como registo do que foi entregue.',
    }, comum);
  }
  if (!venceu) {
    return Object.assign({ estado: 'a-vencer', serve: true, motivo: null }, comum);
  }
  /* 1. O VALOR QUE PROVA QUE FALTA A MORA. Comparado com a BASE, e não com o devido: um código de
   *    exactamente a mensalidade, num mês vencido, é o antigo. Esta prova vence as outras — uma
   *    cobrança colada depois do vencimento mas com o valor cheio é um engano, e não uma correcção. */
  if (valorNoCodigo !== null && valorNoCodigo <= base) {
    return Object.assign({
      estado: 'sem-mora', serve: false,
      motivo: 'Mês vencido e esta cobrança é de R$ ' + reaisDe(valorNoCodigo) + ', sem a mora. '
        + 'Ela cobra menos do que o devido hoje (R$ ' + reaisDe(devido) + '): gere uma nova com '
        + 'a multa e os juros.',
    }, comum);
  }
  /* 2. A DATA DA EMISSÃO. Emitida depois de o mês passar a ser vencido, a cobrança nasceu com o
   *    atraso à frente — é a nova, e é a que se oferece.
   *
   *    ── UM SÓ CALENDÁRIO (25/11/2026) ─────────────────────────────────────────────────────
   *    O defeito que isto corrige, e ela viu-o: com o relógio de ensaio ligado, o vencimento da
   *    escola aparecia em 23/06/2027 (o mês comprimido) e a cobrança que ela acabara de colar dizia
   *    «emitida antes do vencimento». As duas datas eram verdadeiras — em CALENDÁRIOS diferentes.
   *    A emissão é um instante REAL (`em`, gravado no clique) e o vencimento é um dia do calendário
   *    EFETIVO, que o ensaio adianta. Comparar um com o outro não mede nada.
   *
   *    A CORRECÇÃO É A COMPARAÇÃO, e ela faz-se com dois dias do MESMO calendário:
   *      · `emissaoDia` — o dia da emissão, já traduzido para o calendário em que o vencimento se
   *        lê. Quem produz a linha do mês é que sabe traduzir (é lá que o ensaio vive), e por isso
   *        ela chega pronta; sem ela, a reserva é `salvoEm`, que é o caso sem ensaio;
   *      · `atrasoEm` — o PRIMEIRO dia em que o mês conta como vencido, que também é do produtor.
   *        Esta é a parte subtil, e é a razão de ser um dia e não o vencimento: fora do ensaio o
   *        próprio dia do vencimento ainda está no prazo (quem gera no dia, gera a tempo), e por
   *        isso o atraso começa no dia SEGUINTE; no ensaio, o mês está vencido no próprio dia do
   *        vencimento — é a regra do relógio comprimido, que faz «passado o tempo, já paga de
   *        novo». A reserva, sem `atrasoEm`, é `vencimento + 1` — o caso sem ensaio.
   *
   *    E porque é um dia e não um instante: a hora não está em jogo em nenhum dos dois lados, e
   *    comparar instantes obrigaria a decidir de que fuso é o «fim do dia» — que é exactamente a
   *    pergunta que ninguém quer ter de responder num ecrã de dinheiro. */
  const diaDaEmissao = String(emissaoDia || salvoEm || '').slice(0, 10);
  const diaDoAtraso = String(atrasoEm
    || fuso.diaSeguinte(String(vencimento || '').slice(0, 10)) || '').slice(0, 10);
  const emitidaNoAtraso = Boolean(diaDaEmissao && diaDoAtraso && diaDaEmissao >= diaDoAtraso);
  /* 3. O VALOR QUE PROVA QUE LEVA A MORA (mais do que a mensalidade). */
  const valorComMora = valorNoCodigo !== null && valorNoCodigo > base;
  if (emitidaNoAtraso || valorComMora) {
    const falta = valorNoCodigo === null ? 0 : Math.max(0, devido - valorNoCodigo);
    return Object.assign({}, comum, {
      estado: 'com-mora', serve: true, faltaCentavos: falta, motivo: null,
    });
  }
  return Object.assign({
    estado: 'sem-valor', serve: false,
    motivo: 'Mês vencido e a cobrança foi emitida antes do vencimento, sem valor fixo legível (é '
      + 'um link, ou um código sem o campo do valor). Não dá para garantir que leva a mora: gere '
      + 'uma nova, de R$ ' + reaisDe(devido) + '.',
  }, comum);
}

/** `6990` → `69,90`. A formatação é a do painel (`emReais`), e há uma só para não haver duas. */
function reaisDe(emCentavos) {
  const c = Math.max(0, Math.round(Number(emCentavos) || 0));
  return (c / 100).toFixed(2).replace('.', ',');
}

/**
 * O MAPA VAZIO. Uma leitura de um KV que nunca teve cobranças devolve isto, e é o que a página
 * recebe: `{}`. Não se inventa uma estrutura por escola — uma escola sem cobrança não tem entrada,
 * e a ausência é a resposta certa («nunca se colou nada»).
 */
function mapaVazio() {
  return {};
}

/**
 * A COBRANÇA DE UM MÊS, ou `null`. Devolve o objecto guardado (`{ texto, em }`).
 *
 * `null` cobre os três casos que a página trata da mesma maneira — não há mapa, não há escola, não há
 * aquele mês —, e é de propósito: quem desenha não tem três desfechos a decidir, tem um.
 */
function cobrancaDe(mapa, escola, mes) {
  const slug = String(escola == null ? '' : escola).trim();
  const competencia = competenciaDe(mes);
  if (!slug || !competencia) return null;
  const daEscola = mapa && typeof mapa === 'object' ? mapa[slug] : null;
  if (!daEscola || typeof daEscola !== 'object') return null;
  const achada = daEscola[competencia];
  if (!achada || typeof achada !== 'object') return null;
  const texto = normalizarTexto(achada.texto);
  if (!texto) return null;
  /* O `url` é DERIVADO, nunca guardado (25/11/2026). Guardá-lo seria guardar a mesma coisa duas
   * vezes, e no dia em que a regra de reconhecimento mudasse o campo antigo diria outra coisa que o
   * texto. Derivado, ele vale sempre o que o texto vale agora. */
  return { texto, em: achada.em || null, por: achada.por || null, url: urlDaCobranca(texto) };
}

/** Todas as cobranças de uma escola, como `{ '2026-11': {texto, em} }`. Vazio quando não há. */
function cobrancasDaEscola(mapa, escola) {
  const slug = String(escola == null ? '' : escola).trim();
  const daEscola = mapa && typeof mapa === 'object' ? mapa[slug] : null;
  const saida = {};
  if (!slug || !daEscola || typeof daEscola !== 'object') return saida;
  for (const mes of Object.keys(daEscola)) {
    const c = cobrancaDe(mapa, slug, mes);
    if (c) saida[mes] = c;
  }
  return saida;
}

/**
 * GRAVAR OU LIMPAR — devolve um MAPA NOVO, sem tocar no que recebeu.
 *
 * A cópia é o que permite ao chamador decidir: ele grava o resultado e, se a gravação falhar, o mapa
 * antigo continua a ser o antigo. Um `delete` sobre o objecto recebido deixaria o estado meio
 * aplicado numa falha de rede, e a página passaria a mostrar uma cobrança apagada que o KV ainda
 * tem.
 *
 * TEXTO VAZIO É APAGAR — e é uma resposta, não uma ausência: ela colou, viu que estava errado, e
 * limpou o campo. Recusar a limpeza obrigaria a ir ao KV.
 *
 * A ESCOLA FICA NO MAPA MESMO QUANDO O ÚLTIMO MÊS SAI. Limpar a última cobrança de uma escola
 * deixaria `{ "breu": {} }`; podar a chave vazia é arrumação, e faz-se aqui para o mapa não crescer
 * com fantasmas. O que NÃO se poda é a chave de uma escola com meses — nem os meses pagos, que são
 * o registo do que foi entregue.
 */
function gravarNoMapa(mapa, { escola, mes, texto, agora, por } = {}) {
  const slug = String(escola == null ? '' : escola).trim();
  const competencia = competenciaDe(mes);
  if (!slug) return { ok: false, erro: 'informe a escola da cobrança' };
  if (!competencia) {
    return { ok: false, erro: 'o mês da cobrança tem de vir no formato AAAA-MM (ex.: 2026-11)' };
  }
  const limpo = normalizarTexto(texto);
  if (limpo.length > LIMITE_DO_TEXTO) {
    return {
      ok: false,
      erro: 'o texto da cobrança tem ' + limpo.length + ' caracteres e o limite é '
        + LIMITE_DO_TEXTO + ' — nada foi gravado',
    };
  }
  const novo = mapaEstruturado(mapa);
  if (!limpo) {
    const daEscola = novo[slug];
    if (daEscola) {
      delete daEscola[competencia];
      if (!Object.keys(daEscola).length) delete novo[slug];
    }
    return { ok: true, mapa: novo, apagada: true, mes: competencia, escola: slug };
  }
  novo[slug] = novo[slug] || {};
  novo[slug][competencia] = { texto: limpo, em: agora || new Date().toISOString(), por: por || null };
  return { ok: true, mapa: novo, apagada: false, mes: competencia, escola: slug };
}

/**
 * UMA CÓPIA PROFUNDA DO NÍVEL QUE ESTE MAPA TEM (escola → mês → dado).
 *
 * Escrita à mão e não com `JSON.parse(JSON.stringify(...))` pela mesma razão que se lê à mão em
 * outros sítios deste repositório: o `stringify` transforma `undefined` em ausência e rebenta em
 * ciclos, e aqui o que entra vem de um `JSON.parse` de KV. Duas linhas de laço são mais previsíveis
 * do que uma ida ao texto e volta.
 */
function mapaEstruturado(mapa) {
  const saida = {};
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return saida;
  for (const escola of Object.keys(mapa)) {
    const daEscola = mapa[escola];
    if (!daEscola || typeof daEscola !== 'object' || Array.isArray(daEscola)) continue;
    const meses = {};
    for (const mes of Object.keys(daEscola)) {
      const c = daEscola[mes];
      if (!c || typeof c !== 'object') continue;
      meses[mes] = Object.assign({}, c);
    }
    saida[escola] = meses;
  }
  return saida;
}

/**
 * O QUE A ESCOLA VÊ NO «PAGAR» — as cobranças dos meses EM ABERTO, na ordem do extrato.
 *
 * `daEscola` é o mapa JÁ RECORTADO por escola (`{ 'AAAA-MM': {texto, em} }`), e não o mapa global:
 * quem chama já o leu por escola (`cobrancasDaEscola`), e pedir-lhe outra vez o slug seria pedir
 * duas vezes a mesma coisa com uma oportunidade de as duas respostas divergirem.
 *
 * SÓ OS ABERTOS, e é a decisão que faz a caixa valer: uma cobrança de um mês já pago é um documento
 * que já cumpriu o que tinha de cumprir, e mostrá-lo ao lado da que está a valer faria a escola
 * pagar duas vezes. Sem cobrança em nenhum mês aberto, a lista sai vazia e a caixa mostra só a
 * chave — «se não tiver nada colado lá no financeiro, aparece somente a chave Pix mesmo».
 *
 * A ORDEM É A DO EXTRATO (`meses` vem do mais recente para o mais antigo), e não uma segunda
 * ordenação por string: `2026-11` ordena bem alfabeticamente, mas o dia em que a competência mudar
 * de forma a ordenação silenciosa muda com ela.
 */
function emAberto(daEscola, meses) {
  /* A DECISÃO JÁ VEM TOMADA NA LINHA DO MÊS (25/11/2026). Aqui só se lê.
   *
  * Até hoje esta função chamava `situacaoDaCobranca` com as primitivas que tinha à mão — e essa
  * era a terceira vez que a mesma regra era montada à mão, uma por página. Foi assim que o
  * relógio de ensaio entrou num sítio e não no outro: o vencimento de um lado, a data real do
  * outro. Agora a linha do mês traz `cobranca`, calculada UMA vez por quem tem o relógio
  * (`mensalidades.situacaoDaEscola`), e as três páginas limitam-se a mostrar o que ela decidiu.
  *
  * A REGRA QUE FICA, e não muda: se a cobrança de um mês vencido é a ANTIGA — a que não leva a
  * mora —, a caixa «Pagar» da escola NÃO a mostra. Deixá-la aqui seria a forma mais fácil de a
  * escola pagar o valor menor: bastava abrir o sítio dela, onde a cobrança aparece por baixo da
  * chave. A caixa continua a abrir com a CHAVE Pix, e o mês continua nomeado em «Em aberto»; o
  * que ela deixa de ter é o documento que cobra menos.
  *
  * `daEscola` fica na assinatura porque é a forma como os chamadores sempre a chamaram, e
  * porque uma lista de meses pode vir sem as cobranças (uma linha construída à mão, numa prova):
  * nesse caso não há estado, e não se oferece nada — que é a resposta conservadora certa. */
  const saida = [];
  const mapa = daEscola && typeof daEscola === 'object' ? daEscola : null;
  for (const m of Array.isArray(meses) ? meses : []) {
    if (!m || !m.cobranca || !m.cobranca.serve) continue;
    const c = m.cobranca;
    if (mapa && !cobrancaDe({ escola: 'x', x: mapa }, 'x', m.mes)) continue;
    saida.push({ mes: String(m.mes), nome: m.nome || String(m.mes), texto: c.texto, em: c.em,
      url: c.url || urlDaCobranca(c.texto) });
  }
  return saida;
}

module.exports = {
  LIMITE_DO_TEXTO,
  PADRAO_DA_URL,
  urlDaCobranca,
  valorDaCobranca,
  situacaoDaCobranca,
  reaisDe,
  competenciaDe,
  normalizarTexto,
  mapaVazio,
  mapaEstruturado,
  cobrancaDe,
  cobrancasDaEscola,
  emAberto,
  gravarNoMapa,
};
