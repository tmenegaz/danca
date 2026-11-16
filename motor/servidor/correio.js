'use strict';

/**
 * correio.js — A MENSAGEM QUE DIZ «A SUA ESCOLA EXISTE» (25/11/2026).
 *
 * A DECISÃO DELA: «sempre que for criado uma escola, tem que disparar um e-mail para o professor e
 * para o e-mail da escola. Mesmo que seja o mesmo e-mail cadastrado, aí dispara um só, mas tem que
 * disparar. […] E o que tem que ter nesse e-mail? Qual é o conteúdo desse e-mail? É esse resultado
 * que a gente mostra atualmente quando cria uma escola, quando tem sucesso. A gente mostra ali
 * qual é o endereço da escola para acessar.»
 *
 * O CONTEÚDO, então, NÃO SE INVENTA: é o mesmo que a tela mostra — o endereço da escola, o que
 * ele é, e o que fazer com ele. O que se escreve a mais é o que uma pessoa precisa saber ao
 * receber a mensagem e não ter quem lhe responda na hora: a morada, que ela é da escola, e que a
 * senha do professor é a que foi escolhida por quem criou (e não a mostramos — não há por que
 * mandar uma senha por e-mail, e mandá-la seria pior).
 *
 * DUAS COISAS QUE ESTE MÓDULO NÃO FAZ, e são de propósito:
 *
 *   · NÃO ENVIA POR SMTP. Um Worker não abre socket. O envio é HTTP (Resend), e o token é um
 *     secret (`RESEND_API_KEY`).
 *   · NÃO FINGE QUE ENVIOU. Sem token, a mensagem é COMPOSTA e GUARDADA, e o resultado diz
 *     `enviado: false` com o motivo. É a mesma disciplina do `SENHA_CRIPTO` que falta: um sistema
 *     que diz «enviado» sem ter enviado gasta a confiança no dia em que alguém procura a mensagem
 *     na caixa e não a encontra.
 */

const { destinatarios } = require('../nucleo/cadastro-da-escola.js');

const REMETENTE_PADRAO = 'Sistema Lastro <lastro@padd.com.br>';
const API_DO_CORREIO = 'https://api.resend.com/emails';

/** O assunto: o nome da escola, e não uma frase de marketing. É o que se procura na caixa. */
function assuntoDe(cadastro) {
  const escola = String((cadastro && cadastro.escolaNome) || '').trim() || 'a sua escola';
  return 'A escola «' + escola + '» está criada no Sistema Lastro';
}

/**
 * O ENDEREÇO QUE A PESSOA VAI USAR. Vem do provisionamento (`d.url`, o endereço próprio da
 * escola). Quando ele ficou PENDENTE — o registo DNS não entrou —, a mensagem não inventa um
 * endereço que não responde: diz que a escola está criada e que o endereço está a ser ligado.
 * Mandar um link morto por e-mail é pior do que não mandar link nenhum.
 */
function enderecoDe(dados) {
  const url = String((dados && dados.url) || '').trim();
  if (/^https?:\/\//i.test(url)) return { url, pendente: false };
  const dominio = dados && dados.dominio;
  if (dominio && dominio.ok && dominio.host) {
    return { url: 'https://' + String(dominio.host).trim(), pendente: false };
  }
  return { url: '', pendente: true };
}

/**
 * O TEXTO — em duas formas, e as duas dizem o MESMO. Uma mensagem que diz uma coisa em HTML e
 * outra em texto puro é duas mensagens, e a que chega depende do cliente de quem a recebe.
 */
function comporMensagem({ cadastro, escola, url, dominio } = {}) {
  const dados = { url, dominio };
  const alvo = enderecoDe(dados);
  const nomeDaEscola = String((cadastro && cadastro.escolaNome) || '').trim() || String(escola || '');

  const linhas = [];
  linhas.push('Olá.');
  linhas.push('');
  linhas.push('A escola «' + nomeDaEscola + '» foi criada no Sistema Lastro.');
  linhas.push('');
  if (alvo.url) {
    linhas.push('O endereço da escola é:');
    linhas.push('');
    linhas.push('    ' + alvo.url);
    linhas.push('');
    linhas.push('É por ele que a direção e o professor entram. A senha do professor é a que foi');
    linhas.push('escolhida no momento da criação — não a repetimos por e-mail.');
    linhas.push('');
    linhas.push('Os primeiros passos, no mesmo endereço:');
    linhas.push('  1. Bastidores → Produção: cadastrar as turmas e as alunas da escola;');
    linhas.push('  2. Área do Professor: abrir o ciclo e lançar o plano de ensino;');
    linhas.push('  3. A partir do plano, o plano de observação e a anamnese de cada aluna.');
  } else {
    linhas.push('A escola está criada e o endereço próprio dela ainda está a ser ligado.');
    linhas.push('Assim que ficar pronto, ele responde no mesmo lugar — não é preciso criar nada');
    linhas.push('de novo.');
  }
  linhas.push('');
  linhas.push('O Sistema Lastro registra e organiza evidências para apoiar a reflexão pedagógica.');
  linhas.push('Ele não avalia a aluna e não substitui o professor.');
  linhas.push('');
  linhas.push('— Sistema Lastro');

  const texto = linhas.join('\n');

  /* O HTML USA AS PEÇAS DA CASA (as cores e a tipografia vêm do sistema de identidade), mas não
   * é a folha da página: um cliente de e-mail descarta folhas externas, e um e-mail que depende
   * de CSS remoto chega sem forma. Os estilos vão embutidos e são poucos de propósito. */
  const escapar = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const link = alvo.url
    ? '<p style="margin:0 0 16px"><a href="' + escapar(alvo.url) + '" '
      + 'style="color:#7a2e2e;font-weight:600">' + escapar(alvo.url) + '</a></p>'
    : '<p style="margin:0 0 16px">A escola está criada e o endereço próprio dela ainda está a ser '
      + 'ligado. Assim que ficar pronto, ele responde no mesmo lugar.</p>';
  const passos = alvo.url
    ? '<ol style="margin:0 0 16px;padding-left:20px">'
      + '<li>Bastidores → Produção: cadastrar as turmas e as alunas da escola;</li>'
      + '<li>Área do Professor: abrir o ciclo e lançar o plano de ensino;</li>'
      + '<li>A partir do plano, o plano de observação e a anamnese de cada aluna.</li>'
      + '</ol>'
    : '';
  const html = [
    '<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.55;max-width:34rem">',
    '<p style="margin:0 0 16px">Olá.</p>',
    '<p style="margin:0 0 16px">A escola <strong>«' + escapar(nomeDaEscola) + '»</strong> foi '
      + 'criada no Sistema Lastro.</p>',
    alvo.url ? '<p style="margin:0 0 4px">O endereço da escola é:</p>' : '',
    link,
    alvo.url
      ? '<p style="margin:0 0 16px">A senha do professor é a que foi escolhida no momento da '
        + 'criação — não a repetimos por e-mail.</p>'
      : '',
    alvo.url ? '<p style="margin:0 0 4px">Os primeiros passos, no mesmo endereço:</p>' : '',
    passos,
    '<p style="margin:0 0 16px;color:#5a5a5a">O Sistema Lastro registra e organiza evidências para '
      + 'apoiar a reflexão pedagógica. Ele não avalia a aluna e não substitui o professor.</p>',
    '<p style="margin:0;color:#5a5a5a">— Sistema Lastro</p>',
    '</div>',
  ].filter(Boolean).join('');

  return {
    para: destinatarios(cadastro),
    assunto: assuntoDe(cadastro),
    texto,
    html,
    endereco: alvo.url,
    enderecoPendente: alvo.pendente,
  };
}

/** O `fetch` que a prova pode substituir; no Worker é o global. */
function buscador(fetchImpl) {
  return fetchImpl || ((...args) => globalThis.fetch(...args));
}

/**
 * ENVIA — e devolve sempre um desfecho, nunca lança.
 *
 * Não lançar é a regra porque a escola JÁ ESTÁ CRIADA quando isto corre: uma excepção aqui faria a
 * página responder «não foi possível criar» sobre uma escola que existe e está no ar. O que falhou
 * viaja no resultado, e a tela di-lo ao lado do sucesso.
 */
async function enviar({ mensagem, chave, de, fetchImpl, timeoutMs = 10000 } = {}) {
  const destinatariosFinais = (mensagem && mensagem.para) || [];
  if (!destinatariosFinais.length) {
    return { enviado: false, motivo: 'não há e-mail a quem enviar' };
  }
  const token = String(chave || '').trim();
  if (!token) {
    return {
      enviado: false,
      motivo: 'sem RESEND_API_KEY',
      dica: 'Crie uma chave em resend.com e guarde-a como secret do Worker: '
        + '`npx wrangler secret put RESEND_API_KEY --config wrangler.danca.jsonc`. '
        + 'A mensagem fica guardada e pronta.',
      para: destinatariosFinais,
    };
  }
  const corpo = {
    from: String(de || REMETENTE_PADRAO).trim(),
    to: destinatariosFinais,
    subject: mensagem.assunto,
    html: mensagem.html,
    text: mensagem.texto,
  };
  const f = buscador(fetchImpl);
  try {
    const controlo = typeof AbortController === 'function' ? new AbortController() : null;
    const relogio = controlo ? setTimeout(() => controlo.abort(), timeoutMs) : null;
    let r;
    try {
      r = await f(API_DO_CORREIO, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corpo),
        ...(controlo ? { signal: controlo.signal } : {}),
      });
    } finally {
      if (relogio) clearTimeout(relogio);
    }
    let dados = null;
    try { dados = await r.json(); } catch (erro) { dados = null; }
    if (r.ok) {
      return {
        enviado: true,
        para: destinatariosFinais,
        id: (dados && dados.id) || null,
      };
    }
    return {
      enviado: false,
      motivo: 'o provedor recusou (HTTP ' + r.status + ')',
      detalhe: (dados && (dados.message || dados.error)) || null,
      para: destinatariosFinais,
    };
  } catch (erro) {
    const abortado = erro && (erro.name === 'AbortError' || /abort/i.test(String(erro.message || '')));
    return {
      enviado: false,
      motivo: abortado ? 'o provedor não respondeu a tempo' : 'não consegui falar com o provedor',
      detalhe: (erro && erro.message) || String(erro),
      para: destinatariosFinais,
    };
  }
}

/**
 * A CAIXA DE SAÍDA — a mensagem composta quando não houve envio.
 *
 * O prefixo é o do TENANT (`bastidores/<escola>/…`), e não um novo: o expurgo da escola leva o
 * cofre dela inteiro (`prefixosDaEscola`), e a caixa de saída é do mesmo dono que o resto. Uma
 * caixa de saída fora do prefixo sobreviveria ao expurgo com o e-mail e o telefone de quem já não
 * é cliente — e isso seria um resíduo com dados pessoais, que é o que menos se quer deixar.
 *
 * A escrita NÃO FAZ FALHAR a criação: se o KV recusar, o desfecho já tinha o motivo do não-envio,
 * e a mensagem perde-se — e diz-se, em vez de se fingir que ficou guardada.
 */
async function guardarNaCaixaDeSaida({ kv, escola, mensagem, desfecho, quando } = {}) {
  if (!kv || typeof kv.put !== 'function' || !escola) return { guardada: false, motivo: 'sem KV' };
  const carimbo = String(quando || new Date().toISOString()).replace(/[:.]/g, '-');
  const chave = 'bastidores/' + escola + '/correio/' + carimbo;
  try {
    await kv.put(chave, JSON.stringify({
      em: quando || new Date().toISOString(),
      para: mensagem.para,
      assunto: mensagem.assunto,
      texto: mensagem.texto,
      html: mensagem.html,
      endereco: mensagem.endereco,
      envio: desfecho,
    }));
    return { guardada: true, chave };
  } catch (erro) {
    return { guardada: false, motivo: (erro && erro.message) || String(erro) };
  }
}

module.exports = {
  REMETENTE_PADRAO,
  API_DO_CORREIO,
  assuntoDe,
  enderecoDe,
  comporMensagem,
  enviar,
  guardarNaCaixaDeSaida,
};
