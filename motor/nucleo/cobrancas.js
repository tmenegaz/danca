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
  const saida = [];
  const mapa = daEscola && typeof daEscola === 'object' ? daEscola : {};
  for (const m of Array.isArray(meses) ? meses : []) {
    if (!m || m.status === 'pago' || !m.venceu) continue;
    const c = cobrancaDe({ escola: 'x', x: mapa }, 'x', m.mes);
    if (!c) continue;
    saida.push({ mes: String(m.mes), nome: m.nome || String(m.mes), texto: c.texto, em: c.em,
      url: c.url });
  }
  return saida;
}

module.exports = {
  LIMITE_DO_TEXTO,
  PADRAO_DA_URL,
  urlDaCobranca,
  competenciaDe,
  normalizarTexto,
  mapaVazio,
  mapaEstruturado,
  cobrancaDe,
  cobrancasDaEscola,
  emAberto,
  gravarNoMapa,
};
