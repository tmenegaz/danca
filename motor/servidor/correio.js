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
  const base = 'bastidores/' + escola + '/correio/' + carimbo;
  try {
    /* DUAS CARTAS NO MESMO MILISSEGUNDO NÃO SE SOBRESCREVEM (16/11/2026).
     *
     * O carimbo tem resolução de milissegundo, e há um gesto que escreve DUAS cartas de uma vez: o
     * expurgo, que manda a despedida à escola e o relatório à administração. No mesmo isolate, as
     * duas caem no mesmo milissegundo com frequência — e a segunda apagava a primeira, em silêncio.
     * O sintoma seria a pior espécie: a caixa de saída com uma carta a menos, e ninguém a saber que
     * faltava.
     *
     * A regra é simples e local: se a chave já existe, tenta-se `-2`, `-3`… até haver lugar. Não se
     * muda o formato do carimbo (as chaves antigas continuam legíveis, e a lista ordena-se pelo
     * nome), e não se perde nada.
     */
    let chave = base;
    for (let n = 2; n <= 20; n += 1) {
      const existente = await kv.get(chave);
      if (!existente) break;
      chave = base + '-' + n;
    }
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

/**
 * O CONVITE DE RECRIAÇÃO — a mensagem que leva o LINK (16/11/2026).
 *
 * O QUE ELA DIZ, e o que NÃO diz. Diz que a escola foi apagada, que é possível voltar a tê-la, que
 * o link serve para ESCOLHER O PLANO e CRIAR AS SENHAS, e que o pagamento é por Pix — com a
 * instrução que faz a conciliação possível: **escrever o nome da escola na descrição do Pix**. Não
 * diz a senha antiga (não a conhece), não diz o valor (o plano ainda não foi escolhido), e não
 * promete acesso imediato (a conciliação é manual, e é de até 24 horas).
 *
 * O LINK É O SEGREDO. Ele não vai para mais sítio nenhum — nem para o índice, nem para a tela do
 * painel. Quem tiver o e-mail tem o convite, e é assim que tem de ser: é a caixa de quem pagou.
 */
function comporConvite({ escola, nome, url, expiraEm, dias } = {}) {
  const nomeDaEscola = String(nome || escola || '').trim();
  const endereco = String(url || '').trim();
  const linhas = [];
  linhas.push('Olá.');
  linhas.push('');
  linhas.push('A escola «' + nomeDaEscola + '» foi apagada do Sistema Lastro, e pode voltar a');
  linhas.push('existir. Os dados de identificação dela ficaram guardados — falta o cadastro do');
  linhas.push('acesso e o pagamento.');
  linhas.push('');
  linhas.push('Neste endereço você:');
  linhas.push('');
  linhas.push('    1. escolhe o plano e vê o valor da primeira mensalidade;');
  linhas.push('    2. cria a senha da escola e a do professor (são senhas NOVAS — a antiga não é');
  linhas.push('       necessária, e não é pedida);');
  linhas.push('    3. copia a chave Pix e faz o pagamento.');
  linhas.push('');
  linhas.push('    ' + endereco);
  linhas.push('');
  linhas.push('AO FAZER O PIX, ESCREVA O NOME DA ESCOLA na descrição (ou no campo de mensagem)');
  linhas.push('da transferência. A conciliação é feita à mão, e é por esse nome que o pagamento é');
  linhas.push('ligado à escola certa.');
  linhas.push('');
  linhas.push('A conciliação é feita em até 24 horas; depois dela o acesso é liberado, e a escola');
  linhas.push('volta a aparecer para o professor no mesmo endereço de sempre.');
  if (dias) {
    linhas.push('');
    linhas.push('Este link vale ' + dias + ' dias, e uma vez só. Se ele expirar, peça outro à');
    linhas.push('administração do Sistema Lastro.');
  }
  linhas.push('');
  linhas.push('O Sistema Lastro registra e organiza evidências para apoiar a reflexão pedagógica.');
  linhas.push('Ele não avalia a aluna e não substitui o professor.');
  linhas.push('');
  linhas.push('— Sistema Lastro');
  const texto = linhas.join('\n');

  const escapar = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = [
    '<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.55;max-width:34rem">',
    '<p style="margin:0 0 16px">Olá.</p>',
    '<p style="margin:0 0 16px">A escola <strong>«' + escapar(nomeDaEscola) + '»</strong> foi '
      + 'apagada do Sistema Lastro, e pode voltar a existir. Os dados de identificação dela ficaram '
      + 'guardados — falta o cadastro do acesso e o pagamento.</p>',
    '<p style="margin:0 0 8px">Neste endereço você:</p>',
    '<ol style="margin:0 0 16px;padding-left:20px">',
    '<li>escolhe o plano e vê o valor da primeira mensalidade;</li>',
    '<li>cria a senha da escola e a do professor (são senhas <strong>novas</strong> — a antiga não é '
      + 'necessária, e não é pedida);</li>',
    '<li>copia a chave Pix e faz o pagamento.</li>',
    '</ol>',
    '<p style="margin:0 0 16px"><a href="' + escapar(endereco) + '" '
      + 'style="color:#7a2e2e;font-weight:600">' + escapar(endereco) + '</a></p>',
    '<p style="margin:0 0 16px;padding:12px 16px;border:1px solid #8a6a3b;border-radius:8px">'
      + '<strong>Ao fazer o Pix, escreva o nome da escola</strong> na descrição (ou no campo de '
      + 'mensagem) da transferência. A conciliação é feita à mão, e é por esse nome que o pagamento '
      + 'é ligado à escola certa.</p>',
    '<p style="margin:0 0 16px">A conciliação é feita em até 24 horas; depois dela o acesso é '
      + 'liberado, e a escola volta a aparecer para o professor no mesmo endereço de sempre.</p>',
    dias ? '<p style="margin:0 0 16px;color:#5a5a5a">Este link vale ' + escapar(dias) + ' dias, e '
      + 'uma vez só. Se ele expirar, peça outro à administração do Sistema Lastro.</p>' : '',
    '<p style="margin:0 0 16px;color:#5a5a5a">O Sistema Lastro registra e organiza evidências para '
      + 'apoiar a reflexão pedagógica. Ele não avalia a aluna e não substitui o professor.</p>',
    '<p style="margin:0;color:#5a5a5a">— Sistema Lastro</p>',
    '</div>',
  ].filter(Boolean).join('');

  return {
    para: [],
    assunto: 'A escola «' + nomeDaEscola + '» pode voltar ao Sistema Lastro',
    texto,
    html,
    endereco,
    expiraEm: expiraEm || null,
  };
}

/**
 * O AVISO A QUEM CONCILIA — «A escola X contratou o serviço da Lastro» (16/11/2026).
 *
 * O QUE ELA PEDIU, e é uma exigência de operação, não de cortesia: «tem que chegar um e-mail
 * lastro para mim […] dizendo que a escola fez o cadastro ou recriou o cadastro […] E aí eu vou
 * olhar a conciliação […] Aí você tem que me dar o horário que foi feito o clique, né, e o nome da
 * escola, porque por proximidade na conciliação é que eu vou saber se entrou dinheiro ou não.»
 *
 * O ASSUNTO É SEMPRE O MESMO, com o nome da escola dentro: é o que permite filtrar a pasta por
 * «contratou o serviço» e ver a fila inteira. **O HORÁRIO É O DO CLIQUE** — o instante em que a
 * escola submeteu o cadastro —, e vai no fuso de quem lê; é ele que se compara com o extrato.
 */
const TEXTO_DA_CAPACIDADE = (capacidade) => {
  if (!capacidade) return '';
  const p = Number(capacidade.professores) || 0;
  const a = Number(capacidade.alunos) || 0;
  const partes = [];
  if (p) partes.push(p + (p === 1 ? ' professor' : ' professores'));
  if (a) partes.push(a + (a === 1 ? ' aluna' : ' alunas'));
  return partes.join(' e ');
};

/**
 * O AVISO A QUEM CONCILIA — «A escola «X» contratou o serviço da Lastro» (16/11/2026).
 *
 * O QUE O CORPO TEM DE TER, e é o que ela descreveu: o **horário do clique** (não o do pagamento,
 * que não se sabe), o nome da escola, o plano e o **valor** — que é o que se procura no extrato. A
 * `capacidade` acrescenta o que explica o valor quando ele não é o da assinatura: «3 professores e
 * 40 alunas» é o que faz reconhecer o Pix de R$ 149,90 como sendo desta escola.
 */
function comporAvisoAoProprietario({ escola, nome, plano, valor, capacidade, quando, quandoTexto,
  professor, contactos, recriada } = {}) {
  const nomeDaEscola = String(nome || escola || '').trim();
  const linhas = [];
  linhas.push('A escola «' + nomeDaEscola + '» ' + (recriada ? 'recriou o cadastro' : 'fez o cadastro')
    + ' no Sistema Lastro, e aguarda a conciliação do pagamento.');
  linhas.push('');
  linhas.push('  Escola:     ' + nomeDaEscola + ' (' + String(escola || '') + ')');
  linhas.push('  Horário:    ' + String(quandoTexto || quando || '—'));
  linhas.push('  Plano:      ' + String(plano || '—'));
  linhas.push('  Valor:      ' + String(valor || '—'));
  if (TEXTO_DA_CAPACIDADE(capacidade)) {
    linhas.push('  Capacidade: ' + TEXTO_DA_CAPACIDADE(capacidade));
  }
  if (professor) linhas.push('  Professor:  ' + String(professor));
  if (contactos && contactos.length) linhas.push('  Contactos:  ' + contactos.join(', '));
  linhas.push('');
  linhas.push('Para conciliar, procure no extrato o Pix com esse valor e o nome da escola na');
  linhas.push('descrição. Confirmado o pagamento, habilite a escola em «Escolas vivas».');
  linhas.push('');
  linhas.push('— Sistema Lastro');
  const texto = linhas.join('\n');

  const escapar = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const linhaHtml = (rotulo, dado) => (dado
    ? '<tr><td style="padding:4px 12px 4px 0;color:#5a5a5a">' + escapar(rotulo)
      + '</td><td style="padding:4px 0">' + escapar(dado) + '</td></tr>'
    : '');
  const html = [
    '<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.55;max-width:34rem">',
    '<p style="margin:0 0 16px">A escola <strong>«' + escapar(nomeDaEscola) + '»</strong> '
      + (recriada ? 'recriou o cadastro' : 'fez o cadastro') + ' no Sistema Lastro, e aguarda a '
      + 'conciliação do pagamento.</p>',
    '<table style="border-collapse:collapse;margin:0 0 16px;font-size:15px">',
    linhaHtml('Escola', nomeDaEscola + ' (' + String(escola || '') + ')'),
    linhaHtml('Horário', quandoTexto || quando),
    linhaHtml('Plano', plano),
    linhaHtml('Valor', valor),
    linhaHtml('Capacidade', TEXTO_DA_CAPACIDADE(capacidade)),
    linhaHtml('Professor', professor),
    linhaHtml('Contactos', (contactos || []).join(', ')),
    '</table>',
    '<p style="margin:0 0 16px">Para conciliar, procure no extrato o Pix com esse valor e o nome da '
      + 'escola na descrição. Confirmado o pagamento, habilite a escola em «Escolas vivas».</p>',
    '<p style="margin:0;color:#5a5a5a">— Sistema Lastro</p>',
    '</div>',
  ].join('');

  return {
    para: [],
    assunto: 'A escola «' + nomeDaEscola + '» contratou o serviço da Lastro',
    texto,
    html,
    escola: String(escola || ''),
    quando: quando || null,
  };
}

/**
 * A DESPEDIDA — o e-mail para a ESCOLA e o PROFESSOR quando a escola é expurgada (16/11/2026).
 *
 * O QUE ELA PEDIU: «tem que disparar um e-mail […] para o professor e para a escola, que são os
 * e-mails cadastrados […] avisando que a escola foi removida completamente do sistema, que ela foi
 * expurgada. E que […] reforce o convite de que ele é bem-vindo para retornar ao uso do sistema
 * quando quiser, e seja gentil.»
 *
 * O TOM É O PEDIDO, e o conteúdo é o facto: a escola saiu, o que sai com ela, e a porta continua
 * aberta. **NÃO DIZ «os seus dados foram apagados»** sem mais — seria assustador e não é o que
 * acontece: o que fica é a memória de que a escola existiu (a proveniência), e ela é o que torna a
 * volta possível. Também não promete prazo nenhum para voltar, porque não há prazo: a volta é
 * quando quiserem.
 *
 * NÃO LEVA LINK, e é de propósito. Um link de recriação é um segredo que vale uma vez (ver
 * `comporConvite`); mandá-lo para uma caixa que talvez já não seja de quem decide seria oferecer a
 * escola a quem abrisse o e-mail. Quem quiser voltar pede — e a administração manda o convite.
 */
function comporDespedidaDaEscola({ escola, nome, quandoTexto, professor, apagados } = {}) {
  const nomeDaEscola = String(nome || escola || '').trim();
  const linhas = [];
  linhas.push('Olá.');
  linhas.push('');
  linhas.push('A escola «' + nomeDaEscola + '» foi removida do Sistema Lastro'
    + (quandoTexto ? ', em ' + String(quandoTexto) : '') + '.');
  linhas.push('');
  linhas.push('A remoção é completa: o endereço da escola não abre mais, e os documentos que ela');
  linhas.push('tinha deixaram de estar disponíveis no sistema.');
  if (Number(apagados) > 0) {
    linhas.push('');
    linhas.push('Foram removidos ' + Number(apagados) + ' arquivos: o pacote do ciclo, os');
    linhas.push('planos, as anamneses e o acervo dos envelopes.');
  }
  linhas.push('');
  linhas.push('O Sistema Lastro guarda a memória de que a escola existiu: o registro da');
  linhas.push('proveniência fica, e é ele que permite que a escola volte a nascer com o mesmo');
  linhas.push('nome e a mesma história.');
  linhas.push('');
  linhas.push('E é isso que queremos dizer: A PORTA CONTINUA ABERTA. Se em algum momento você');
  linhas.push('quiser voltar a usar o sistema — com esta escola ou com outra —, escreva para');
  linhas.push('lastro@padd.com.br. A volta é feita por convite, com uma página própria para');
  linhas.push('escolher o plano e criar a senha, e não precisa de lembrar de nenhuma senha antiga.');
  linhas.push('');
  linhas.push('Foi um prazer ter a escola «' + nomeDaEscola + '» por aqui. Obrigado pelo tempo em');
  linhas.push('que caminhámos juntos.');
  linhas.push('');
  linhas.push('O Sistema Lastro registra e organiza evidências para apoiar a reflexão pedagógica.');
  linhas.push('Ele não avalia a aluna e não substitui o professor.');
  linhas.push('');
  linhas.push('— Sistema Lastro');
  const texto = linhas.join('\n');

  const escapar = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = [
    '<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.55;max-width:34rem">',
    '<p style="margin:0 0 16px">Olá.</p>',
    '<p style="margin:0 0 16px">A escola <strong>«' + escapar(nomeDaEscola) + '»</strong> foi '
      + 'removida do Sistema Lastro' + (quandoTexto ? ', em ' + escapar(quandoTexto) : '') + '.</p>',
    '<p style="margin:0 0 16px">A remoção é completa: o endereço da escola não abre mais, e os '
      + 'documentos que ela tinha deixaram de estar disponíveis no sistema.</p>',
    Number(apagados) > 0
      ? '<p style="margin:0 0 16px">Foram removidos ' + Number(apagados) + ' arquivos — o pacote do '
        + 'ciclo, os planos, as anamneses e o acervo dos envelopes.</p>'
      : '',
    '<p style="margin:0 0 16px">O Sistema Lastro guarda a memória de que a escola existiu: o registro '
      + 'da proveniência fica, e é ele que permite que a escola volte a nascer com o mesmo nome e a '
      + 'mesma história.</p>',
    '<p style="margin:0 0 16px;padding:12px 16px;border:1px solid #8a6a3b;border-radius:8px">'
      + '<strong>A porta continua aberta.</strong> Se em algum momento você quiser voltar a usar o '
      + 'sistema — com esta escola ou com outra —, escreva para '
      + '<a href="mailto:lastro@padd.com.br" style="color:#7a2e2e">lastro@padd.com.br</a>. A volta é '
      + 'feita por convite, com uma página própria para escolher o plano e criar a senha, e não '
      + 'precisa de lembrar de nenhuma senha antiga.</p>',
    '<p style="margin:0 0 16px">Foi um prazer ter a escola «' + escapar(nomeDaEscola) + '» por aqui. '
      + 'Obrigado pelo tempo em que caminhámos juntos.</p>',
    '<p style="margin:0 0 16px;color:#5a5a5a">O Sistema Lastro registra e organiza evidências para '
      + 'apoiar a reflexão pedagógica. Ele não avalia a aluna e não substitui o professor.</p>',
    '<p style="margin:0;color:#5a5a5a">— Sistema Lastro</p>',
    '</div>',
  ].filter(Boolean).join('');

  return {
    para: [],
    assunto: 'A escola «' + nomeDaEscola + '» foi removida do Sistema Lastro',
    texto,
    html,
    escola: String(escola || ''),
    professor: professor || null,
  };
}

/**
 * O AVISO A QUEM ADMINISTRA, quando uma escola é expurgada (16/11/2026).
 *
 * É o par do de cima: um vai para quem perdeu a escola, este para quem a apagou. O que ele tem de
 * ter é o que se procura depois — **o quê, quando, e o que ficou por apagar**. As duas metades do
 * expurgo (Cloudflare e repositório) podem separar-se, e é por isso que o desfecho do KV também
 * aparece: um expurgo que deixou o dado no KV e disse «feito» é o defeito que o `kvFalhou` existe
 * para não deixar passar.
 */
function comporAvisoDeExpurgoAoProprietario({ escola, nome, quando, quandoTexto, professor,
  contactos, apagados, kv, proveniencia, motivo } = {}) {
  const nomeDaEscola = String(nome || escola || '').trim();
  const linhas = [];
  linhas.push('A escola «' + nomeDaEscola + '» foi expurgada do Sistema Lastro.');
  linhas.push('');
  linhas.push('  Escola:      ' + nomeDaEscola + ' (' + String(escola || '') + ')');
  linhas.push('  Quando:      ' + String(quandoTexto || quando || '—'));
  if (professor) linhas.push('  Professor:   ' + String(professor));
  if (contactos && contactos.length) linhas.push('  Contactos:   ' + contactos.join(', '));
  if (Number(apagados) > 0) linhas.push('  Arquivos:    ' + Number(apagados) + ' removidos do repositório');
  if (motivo) linhas.push('  Motivo:      ' + String(motivo));
  if (kv) linhas.push('  KV:          ' + (kv.ok === false ? 'FALHOU — há chaves por apagar' : 'limpo'));
  if (proveniencia && proveniencia.impressao) {
    linhas.push('  Proveniência: ' + String(proveniencia.impressao).slice(0, 16) + '…');
  }
  linhas.push('');
  linhas.push('A memória da escola fica: o elo da proveniência sobrevive ao expurgo, e é dele');
  linhas.push('que a recriação tira o professor, o ciclo e o shard. Para a trazer de volta, use');
  linhas.push('«Recriar» na lista das escolas apagadas.');
  linhas.push('');
  linhas.push('— Sistema Lastro');
  const texto = linhas.join('\n');

  const escapar = (t) => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const linhaHtml = (rotulo, dado) => (dado
    ? '<tr><td style="padding:4px 12px 4px 0;color:#5a5a5a">' + escapar(rotulo)
      + '</td><td style="padding:4px 0">' + escapar(dado) + '</td></tr>'
    : '');
  const html = [
    '<div style="font-family:Georgia,serif;color:#2b2b2b;line-height:1.55;max-width:34rem">',
    '<p style="margin:0 0 16px">A escola <strong>«' + escapar(nomeDaEscola) + '»</strong> foi '
      + 'expurgada do Sistema Lastro.</p>',
    '<table style="border-collapse:collapse;margin:0 0 16px;font-size:15px">',
    linhaHtml('Escola', nomeDaEscola + ' (' + String(escola || '') + ')'),
    linhaHtml('Quando', quandoTexto || quando),
    linhaHtml('Professor', professor),
    linhaHtml('Contactos', (contactos || []).join(', ')),
    linhaHtml('Arquivos', Number(apagados) > 0 ? Number(apagados) + ' removidos do repositório' : ''),
    linhaHtml('Motivo', motivo),
    linhaHtml('KV', kv ? (kv.ok === false ? 'FALHOU — há chaves por apagar' : 'limpo') : ''),
    linhaHtml('Proveniência', proveniencia && proveniencia.impressao
      ? String(proveniencia.impressao).slice(0, 16) + '…' : ''),
    '</table>',
    '<p style="margin:0 0 16px">A memória da escola fica: o elo da proveniência sobrevive ao '
      + 'expurgo, e é dele que a recriação tira o professor, o ciclo e o shard. Para a trazer de '
      + 'volta, use «Recriar» na lista das escolas apagadas.</p>',
    '<p style="margin:0;color:#5a5a5a">— Sistema Lastro</p>',
    '</div>',
  ].join('');

  return {
    para: [],
    assunto: 'A escola «' + nomeDaEscola + '» foi expurgada do Sistema Lastro',
    texto,
    html,
    escola: String(escola || ''),
    quando: quando || null,
  };
}

module.exports = {
  REMETENTE_PADRAO,
  API_DO_CORREIO,
  assuntoDe,
  enderecoDe,
  comporMensagem,
  comporConvite,
  comporAvisoAoProprietario,
  comporDespedidaDaEscola,
  comporAvisoDeExpurgoAoProprietario,
  enviar,
  guardarNaCaixaDeSaida,
};
