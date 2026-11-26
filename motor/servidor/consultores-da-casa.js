'use strict';

/**
 * consultores-da-casa.js — O REGISTO DE CONSULTORES, LIDO E ESCRITO NO KV (25/11/2026).
 *
 * O QUE ELE É, E O QUE ELE NÃO É. A regra — validar, acrescentar, mudar de estado — está em
 * `motor/nucleo/consultores.js`, que é puro. Aqui está só o que precisa do KV: ler a lista,
 * gravar a lista, e dizer quando não há KV. É a mesma divisão do `contato-do-site.js`, e pela
 * mesma razão: uma regra em dois sítios responde duas coisas.
 *
 * PORQUE É UM MÓDULO E NÃO QUATRO LINHAS DENTRO DA ROTA. As três rotas do painel (a lista, a
 * criação e o estado) leem e escrevem a MESMA chave, e a leitura tem uma regra que não pode ser
 * copiada: **um KV que não responde não é uma lista vazia**. Se a leitura falhar e a rota disser
 * «não há consultores», ela mente — e o gesto seguinte (criar) grava por cima de uma lista que
 * existia. É a mesma família do `lerLista(kv, chave, estrito)` que o `bastidores.js` já usa para as
 * câmaras e as turmas.
 *
 * O QUE ELE **NÃO** FAZ: não manda e-mail, não gera token, não fala com o GitHub. Um consultor
 * registado não tem acesso a nada — o acesso dele nasce em F2, e é outro ficheiro.
 */

const consultores = require('../nucleo/consultores.js');
const segredo = require('../nucleo/segredo.js');

const SEM_KV = {
  ok: false,
  erro: 'esta instalação não tem KV — o registo de consultores não pode ser lido nem gravado',
};

/** O KV existe e sabe gravar? A pergunta é feita uma vez, e a resposta é a mesma em todas as rotas. */
function temKv(env) {
  const kv = env && env.PADD_KV;
  return Boolean(kv && typeof kv.get === 'function' && typeof kv.put === 'function');
}

/**
 * LÊ A LISTA. Devolve `{ ok, lista, erro }`.
 *
 * `ok: false` quando o KV não existe ou quando a leitura estourou — e **nunca** com uma lista
 * vazia a fingir de resposta: a diferença entre «não há consultores» e «não consegui ler» é a
 * diferença entre uma decisão e um acidente, e quem escreve a seguir precisa de a saber.
 *
 * A chave que não existe (KV vazio) é `ok: true, lista: []` — isso não é uma falha, é o começo.
 */
async function ler(env) {
  if (!temKv(env)) return Object.assign({}, SEM_KV, { lista: [] });
  let bruto;
  try {
    bruto = await env.PADD_KV.get(consultores.CHAVE);
  } catch (erro) {
    return {
      ok: false,
      lista: [],
      erro: 'não foi possível ler o registo de consultores: ' + ((erro && erro.message) || String(erro)),
    };
  }
  return { ok: true, lista: consultores.lerLista(bruto), vazio: !bruto };
}

/** Grava a lista inteira. Devolve `{ ok, erro }` — e não engole a falha. */
async function gravar(env, lista) {
  if (!temKv(env)) return SEM_KV;
  try {
    await env.PADD_KV.put(consultores.CHAVE, JSON.stringify(Array.isArray(lista) ? lista : []));
    return { ok: true };
  } catch (erro) {
    return {
      ok: false,
      erro: 'não foi possível gravar o registo de consultores: ' + ((erro && erro.message) || String(erro)),
    };
  }
}

/**
 * CRIA UM CONSULTOR — valida, confere o documento repetido, e grava.
 *
 * A ORDEM É A DA CASA: valida primeiro (nada se grava sobre um corpo inválido), confere o
 * documento contra a lista LIDA (e não contra uma lista de memória), e só então escreve. Se a
 * gravação falhar, a resposta diz que não foi gravado — o registo devolvido não deve ser mostrado
 * como existente.
 */
async function criar(env, pedido, quando) {
  const validado = consultores.validarCadastro(pedido);
  if (!validado.ok) return { ok: false, erro: validado.erro, erros: validado.erros, status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const acrescentado = consultores.acrescentar(lido.lista, validado.cadastro, quando);
  if (!acrescentado.ok) return { ok: false, erro: acrescentado.erro, status: 409 };
  const gravado = await gravar(env, acrescentado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return {
    ok: true,
    registo: acrescentado.registo,
    /* O QUE SAI DA LISTA DIZ-SE. Um tecto que apaga em silêncio é uma mentira por omissão — e o
     * painel tem de o poder dizer a quem acabou de cadastrar o duzentos e um. */
    retirados: acrescentado.retirados,
    lista: acrescentado.lista,
  };
}

/** Activa ou desactiva. Devolve `{ ok, mudou, registo, lista }`. */
async function mudarEstado(env, { id, ativo, motivo } = {}, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const mudado = consultores.mudarEstado(lido.lista, alvo, ativo, quando, motivo);
  if (!mudado.ok) return { ok: false, erro: mudado.erro, status: 404 };
  /* MUDAR PARA O MESMO ESTADO NÃO GRAVA: um clique duplo não deve encher o histórico de elos que
   * não mudaram nada. E não gravar é a resposta certa, não uma falha. */
  if (!mudado.mudou) return { ok: true, mudou: false, registo: mudado.registo, lista: lido.lista };

  /* ACTIVAR EMITE UM ENDEREÇO NOVO (25/11/2026 — F2). É o gesto que abre a porta, e a porta é uma
   * só: o endereço que ele tinha antes de ser desactivado deixa de valer, porque a fechadura é
   * trocada. Reabrir com a mesma chave seria reabrir a porta que se fechou, com uma chave que pode
   * estar num WhatsApp antigo que ninguém apagou.
   *
   * O TOKEN SÓ EXISTE AQUI, nesta resposta: o KV guarda o hash. É a única vez em que é possível
   * mostrá-lo — e é por isso que a página do painel o mostra num bloco que diz «aparece uma vez só»
   * e tem um «Copiar». */
  let lista = mudado.lista;
  let token = null;
  let registo = mudado.registo;
  if (registo.ativo) {
    token = segredo.novoToken();
    const hash = await segredo.hashDoToken(consultores.AMBITO_DO_ACESSO, token);
    const dado = consultores.darAcesso(lista, alvo, hash, quando);
    if (!dado.ok) return { ok: false, erro: dado.erro, status: dado.status || 400 };
    lista = dado.lista;
    registo = dado.registo;
  }

  const gravado = await gravar(env, lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, mudou: true, registo, lista, token };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * F2 — O ENDEREÇO DELE, E AS VISITAS (25/11/2026)
 *
 * A REGRA ESTÁ NO NÚCLEO. Aqui está o que precisa do KV e do `crypto`: gerar o token, derivar o
 * hash, ler e gravar o livro de visitas. Nenhuma decisão sobre «pode ou não pode» é tomada aqui —
 * `consultores.darAcesso` e `consultores.reemitirLink` é que a tomam, e esta camada limita-se a
 * dizer o que aconteceu ao KV.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * O CONSULTOR QUE ESTE TOKEN DE ACESSO ABRE. Devolve `{ ok, consultor }` — e `consultor: null`
 * quando o token não é de ninguém.
 *
 * A LEITURA É A MESMA LISTA. Não há índice `hash → id`: seriam uma segunda chave e uma segunda
 * escrita por cada emissão, e a lista é uma leitura só — duzentos registos, que é o tecto dela.
 */
async function porToken(env, token) {
  const bruto = String(token || '').trim();
  if (!bruto) return { ok: true, consultor: null };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, consultor: null };
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_ACESSO, bruto);
  return { ok: true, consultor: consultores.porAcesso(lido.lista, hash), lista: lido.lista };
}

/**
 * EMITE UM ENDEREÇO NOVO PARA UM CONSULTOR ACTIVO — o «Novo endereço» do painel.
 *
 * Não é o mesmo gesto do «Activar»: aquele abre a porta e este troca a fechadura. Os dois emitem, e
 * por isso os dois passam por `darAcesso` e pelo mesmo elo no histórico — mas este exige que ele já
 * esteja activo, e recusa quando não está.
 */
async function novoAcesso(env, { id } = {}, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const token = segredo.novoToken();
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_ACESSO, token);
  const dado = consultores.darAcesso(lido.lista, alvo, hash, quando);
  if (!dado.ok) return { ok: false, erro: dado.erro, status: dado.inativo ? 409 : (dado.status || 400) };
  const gravado = await gravar(env, dado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  return { ok: true, token, registo: dado.registo, lista: dado.lista };
}

/** LÊ O LIVRO DE VISITAS de um consultor. `ok: false` quando o KV não responde — nunca `[]` a fingir. */
async function lerVisitas(env, id) {
  if (!temKv(env)) return Object.assign({}, SEM_KV, { visitas: [] });
  const chave = consultores.chaveDasVisitas(id);
  if (!chave) return { ok: false, erro: 'falta o id do consultor', visitas: [] };
  let bruto;
  try {
    bruto = await env.PADD_KV.get(chave);
  } catch (erro) {
    return {
      ok: false,
      visitas: [],
      erro: 'não foi possível ler as visitas deste consultor: ' + ((erro && erro.message) || String(erro)),
    };
  }
  return { ok: true, visitas: consultores.lerVisitas(bruto), vazio: !bruto };
}

async function gravarVisitas(env, id, visitas) {
  if (!temKv(env)) return SEM_KV;
  const chave = consultores.chaveDasVisitas(id);
  if (!chave) return { ok: false, erro: 'falta o id do consultor' };
  try {
    await env.PADD_KV.put(chave, JSON.stringify(Array.isArray(visitas) ? visitas : []));
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: 'não foi possível gravar as visitas: ' + ((erro && erro.message) || String(erro)) };
  }
}

/**
 * CRIA UMA VISITA E DEVOLVE O TOKEN EM CLARO — a única vez que ele existe.
 *
 * A ORDEM É A DA CASA: valida, confere o estado do consultor, gera, guarda, e só então devolve. Se a
 * gravação falhar, o token não é devolvido — um link que abre uma visita que não existe é pior do
 * que um erro, porque ele manda-o à escola.
 */
async function criarVisita(env, id, pedido, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const validado = consultores.validarVisita(pedido);
  if (!validado.ok) return { ok: false, erro: validado.erro, erros: validado.erros, status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const quem = consultores.porId(lido.lista, alvo);
  if (!quem) return { ok: false, erro: 'não há consultor com este id', status: 404 };
  /* A SEGUNDA BARREIRA. A primeira é a página não desenhar o formulário; esta é a que vale, porque
   * quem escrever o pedido à mão não passa pela página. */
  if (!consultores.estaAtivo(quem)) {
    return { ok: false, inativo: true, erro: 'o seu acesso está inactivo — fale com a administração do Sistema Lastro', status: 403 };
  }
  const visitas = await lerVisitas(env, alvo);
  if (!visitas.ok) return { ok: false, erro: visitas.erro, status: 503 };
  const token = segredo.novoToken();
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_LINK, token);
  const acrescentado = consultores.acrescentarVisita(visitas.visitas, validado.visita, hash, quando);
  if (!acrescentado.ok) return { ok: false, erro: acrescentado.erro, cheio: acrescentado.cheio, status: 409 };
  const gravado = await gravarVisitas(env, alvo, acrescentado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  /* O ÍNDICE DO LINK (25/11/2026). Sem esta escrita o link nasce e não abre: a página da escola
   * pergunta «de quem é este link?» a esta chave, e é a única resposta que existe. Se ela falhar, a
   * resposta diz que o link não abre — e não devolve um endereço que já se sabe estar morto. */
  const indexado = await gravarOLink(env, hash, {
    consultorId: alvo,
    consultorNome: quem.nome || '',
    praca: quem.praca || '',
    visitaId: acrescentado.visita.id,
    escolaNome: acrescentado.visita.escolaNome || '',
    em: acrescentado.visita.criadaEm,
  });
  if (!indexado.ok) return { ok: false, erro: indexado.erro, status: 503 };
  return { ok: true, token, visita: acrescentado.visita, lista: acrescentado.lista };
}

/** REEMITE O LINK DE UMA VISITA — o token novo, em claro, uma vez. */
async function reemitirLink(env, id, visitaId, quando) {
  const alvo = String(id || '').trim();
  if (!alvo) return { ok: false, erro: 'falta o id do consultor', status: 400 };
  const lido = await ler(env);
  if (!lido.ok) return { ok: false, erro: lido.erro, status: 503 };
  const quem = consultores.porId(lido.lista, alvo);
  if (!quem) return { ok: false, erro: 'não há consultor com este id', status: 404 };
  if (!consultores.estaAtivo(quem)) {
    return { ok: false, inativo: true, erro: 'o seu acesso está inactivo — fale com a administração do Sistema Lastro', status: 403 };
  }
  const visitas = await lerVisitas(env, alvo);
  if (!visitas.ok) return { ok: false, erro: visitas.erro, status: 503 };
  /* O HASH ANTIGO, GUARDADO ANTES DE SER SUBSTITUÍDO — é ele que o índice tem de esquecer. Deixá-lo
   * ficaria com dois endereços a apontar para a mesma visita, e o antigo seria uma porta que ninguém
   * fechou (a visita recusava-o pelo `tokenHash`, mas com a frase errada). */
  const antes = consultores.porVisita(visitas.visitas, visitaId);
  const hashAntigo = antes && antes.tokenHash;
  const token = segredo.novoToken();
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_LINK, token);
  const reemitido = consultores.reemitirLink(visitas.visitas, visitaId, hash, quando);
  if (!reemitido.ok) return { ok: false, erro: reemitido.erro, gasto: reemitido.gasto, status: reemitido.gasto ? 409 : 404 };
  const gravado = await gravarVisitas(env, alvo, reemitido.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro, status: 503 };
  const indexado = await gravarOLink(env, hash, {
    consultorId: alvo,
    consultorNome: quem.nome || '',
    praca: quem.praca || '',
    visitaId: reemitido.visita.id,
    escolaNome: reemitido.visita.escolaNome || '',
    em: reemitido.visita.criadaEm,
    reemitidoEm: quando ? String(quando) : new Date().toISOString(),
  });
  if (!indexado.ok) return { ok: false, erro: indexado.erro, status: 503 };
  if (hashAntigo && hashAntigo !== hash) await apagarOLink(env, hashAntigo);
  return { ok: true, token, visita: reemitido.visita, lista: reemitido.lista };
}

/* ══════════════════════════════════════════════════════════════════════════════════════════════
 * F3 — O ÍNDICE DE LINKS, E A RESERVA DE UMA VISITA (25/11/2026)
 *
 * O ÍNDICE EXISTE PARA UMA PERGUNTA SÓ: «de quem é este link?». As visitas vivem em
 * `consultores/visitas/<id>`, uma chave por consultor — e daí não se chega ao dono de um token sem
 * varrer todos os consultores. Varrer seria uma ENUMERAÇÃO (`list`), que é a operação do KV
 * limitada por dia e que já apagou uma lista uma vez (18/10/2026).
 *
 * Então o link tem o seu próprio registo: `consultores/link/<hash>` → quem o emitiu e a que visita
 * pertence. Um `get` por abertura, e nenhuma enumeração em sítio nenhum.
 *
 * NÃO É UMA CHAVE POR VISITA: é uma chave por LINK. A diferença importa quando um link é reemitido —
 * o antigo é APAGADO, e o hash novo ganha a sua. Deixá-lo ficaria com dois endereços a apontar para
 * a mesma visita, e o segundo seria uma porta que ninguém fechou.
 * ══════════════════════════════════════════════════════════════════════════════════════════════ */

/** Grava o índice de um link. Não faz falhar a emissão: sem ele o link não abre, e isso é dito. */
async function gravarOLink(env, hash, dados) {
  if (!temKv(env)) return SEM_KV;
  const chave = consultores.chaveDoLink(hash);
  if (!chave) return { ok: false, erro: 'falta o hash do link' };
  try {
    await env.PADD_KV.put(chave, JSON.stringify(dados || {}));
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: 'não foi possível indexar o link: ' + ((erro && erro.message) || String(erro)) };
  }
}

async function apagarOLink(env, hash) {
  if (!temKv(env) || !hash) return { ok: true };
  try {
    await env.PADD_KV.delete(consultores.chaveDoLink(hash));
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: 'não foi possível apagar o link antigo: ' + ((erro && erro.message) || String(erro)) };
  }
}

/**
 * DE QUEM É ESTE LINK — a pergunta que a página da escola faz ao abrir.
 *
 * Devolve `{ ok, dono }`, e `dono: null` quando o token não é de link nenhum. Um KV que não responde
 * é `ok: false` — nunca `dono: null`, que diria «este link não existe» sobre um link que existe.
 */
async function porLink(env, token) {
  const bruto = String(token || '').trim();
  if (!bruto) return { ok: true, dono: null };
  if (!temKv(env)) return { ok: false, erro: SEM_KV.erro, dono: null };
  const hash = await segredo.hashDoToken(consultores.AMBITO_DO_LINK, bruto);
  let guardado = null;
  try {
    guardado = await env.PADD_KV.get(consultores.chaveDoLink(hash));
  } catch (erro) {
    return { ok: false, erro: 'não foi possível ler o link: ' + ((erro && erro.message) || String(erro)), dono: null };
  }
  if (!guardado) return await porLinkLegado(env, hash);
  let dados;
  try { dados = JSON.parse(guardado); } catch (erro) { return { ok: true, dono: null }; }
  if (!dados || !dados.consultorId || !dados.visitaId) return { ok: true, dono: null };
  return { ok: true, dono: Object.assign({}, dados, { hash }) };
}

/**
 * OS LINKS QUE NASCERAM ANTES DO ÍNDICE — e porquê um caminho de excepção em vez de uma migração.
 *
 * O índice (`consultores/link/<hash>`) é desta fase. Os links emitidos pela F2 escreveram a visita
 * em `consultores/visitas/<id>` e **não** o índice — e um deles é o que ela gerou para testar. Sem
 * isto, todos os links anteriores a hoje ficavam órfãos: existiam, apontavam para uma visita
 * verdadeira, e a página dizia «não abre nenhuma escola».
 *
 * PORQUE NÃO UMA MIGRAÇÃO. Uma migração é um script que corre uma vez e que ninguém volta a correr
 * quando aparecer outro caso; e o KV não tem uma data de corte fiável para «links anteriores a
 * hoje». Este caminho é o contrário: **cura-se a si mesmo** — quando encontra a visita, escreve o
 * índice, e a segunda abertura já é um `get` só.
 *
 * O CUSTO É LIMITADO, e é o que o torna aceitável: N leituras, onde N é o número de CONSULTORES (não
 * de visitas) — as visitas de cada um são UMA chave, um array. Com um consultor são duas leituras; o
 * tecto da lista de consultores é duzentos. E só acontece na FALHA do índice: um token inválido paga
 * isto uma vez e mais nada, porque a resposta não é guardada.
 *
 * SE A LISTA ESTIVER VAZIA, não há legado nenhum a procurar — e é o caso de uma instalação nova.
 */
async function porLinkLegado(env, hash) {
  const lista = await ler(env);
  if (!lista.ok || !lista.lista.length) return { ok: true, dono: null };
  for (const quem of lista.lista) {
    /* eslint-disable no-await-in-loop */
    const lidas = await lerVisitas(env, quem.id);
    if (!lidas.ok) continue;
    const achada = lidas.visitas.find((v) => v && String(v.tokenHash || '') === hash);
    if (!achada) continue;
    /* CURADO. A escrita é best-effort: se falhar, o link abre na mesma e a próxima abertura volta a
     * procurar — o que se perde é uma leitura, não o link. */
    await gravarOLink(env, hash, {
      consultorId: quem.id,
      consultorNome: quem.nome || '',
      praca: quem.praca || '',
      visitaId: achada.id,
      escolaNome: achada.escolaNome || '',
      em: achada.criadaEm || null,
      curadoEm: new Date().toISOString(),
    }).catch(() => ({ ok: false }));
    return {
      ok: true,
      dono: { consultorId: quem.id, consultorNome: quem.nome || '', praca: quem.praca || '',
        visitaId: achada.id, escolaNome: achada.escolaNome || '', hash, legado: true },
    };
    /* eslint-enable no-await-in-loop */
  }
  return { ok: true, dono: null };
}

/**
 * O QUE A ESCOLA PODE SABER ANTES DE ESCREVER SEJA O QUE FOR — a resposta inteira, numa função.
 *
 * A ORDEM É A ORDEM EM QUE A PORTA SE FECHA, e cada caso tem a sua frase: o link não existe; o
 * consultor deixou de estar activo; a visita está gasta, reservada ou expirada. **Só quando todos os
 * anteriores passam é que há formulário.**
 *
 * O CONSULTOR INACTIVO FECHA O LINK, e é o que a F2 prometeu por palavras («desactivar fecha a área
 * dele e os links que ele já espalhou — sem ter de os correr atrás»). A frase é diferente da do link
 * inválido: aqui a escola tem um link verdadeiro, e o que a suspende é uma decisão administrativa —
 * ela precisa de saber que o problema não é o endereço que colou.
 */
async function situacaoDoLink(env, token, agora) {
  const achado = await porLink(env, token);
  if (!achado.ok) return { ok: false, lido: false, motivo: achado.erro };
  if (!achado.dono) return { ok: false, lido: true, motivo: consultores.MOTIVO_DO_LINK_INVALIDO };

  const listaConsultores = await ler(env);
  if (!listaConsultores.ok) return { ok: false, lido: false, motivo: listaConsultores.erro };
  const quem = consultores.porId(listaConsultores.lista, achado.dono.consultorId);
  if (!quem) return { ok: false, lido: true, motivo: consultores.MOTIVO_DO_LINK_INVALIDO };
  if (!consultores.estaAtivo(quem)) {
    return {
      ok: false,
      lido: true,
      suspenso: true,
      consultor: quem,
      motivo: 'a demonstração com consultoria está suspensa. Escreva para a administração do '
        + 'Sistema Lastro (lastro@padd.com.br) e ela resolve — o link que você tem está correcto.',
    };
  }

  const lidas = await lerVisitas(env, quem.id);
  if (!lidas.ok) return { ok: false, lido: false, motivo: lidas.erro };
  const visita = consultores.porVisita(lidas.visitas, achado.dono.visitaId);
  const estado = consultores.estadoDoLink(visita, agora);
  if (!estado.ok) {
    return { ok: false, lido: true, estado: estado.estado, consultor: quem, visita, motivo: estado.motivo };
  }
  return {
    ok: true,
    lido: true,
    estado: 'aberta',
    consultor: quem,
    visita,
    /* O NOME QUE O CONSULTOR ESCREVEU. É o que a página põe no campo da escola — editável, porque
     * ele o escreveu de memória e quem sabe o nome é a escola. Mas prefilled, porque um campo vazio
     * obriga a escola a descobrir o que ali vai. */
    escolaNome: visita.escolaNome || '',
    expiraEm: visita.expiraEm,
  };
}

/**
 * RESERVA A VISITA PARA ESTA CRIAÇÃO — o gesto que impede duas escolas de um link só.
 *
 * Devolve `{ ok, visita, lista }` ou a recusa com a frase. Quem chama tem de LARGAR a reserva se a
 * criação falhar, e é por isso que esta função não é usada sozinha em sítio nenhum.
 */
async function reservar(env, consultorId, visitaId, agora) {
  const lidas = await lerVisitas(env, consultorId);
  if (!lidas.ok) return { ok: false, erro: lidas.erro };
  const reservado = consultores.reservarVisita(lidas.visitas, visitaId, agora);
  if (!reservado.ok) return { ok: false, erro: reservado.erro, estado: reservado.estado };
  const gravado = await gravarVisitas(env, consultorId, reservado.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro };
  return { ok: true, visita: reservado.visita, lista: reservado.lista };
}

/** GASTA A VISITA — depois de a escola existir. Devolve `{ ok }`; a falha viaja na resposta. */
async function gastar(env, consultorId, visitaId, escolaSlug, agora) {
  const lidas = await lerVisitas(env, consultorId);
  if (!lidas.ok) return { ok: false, erro: lidas.erro };
  const usada = consultores.marcarVisitaUsada(lidas.visitas, visitaId, escolaSlug, agora);
  if (!usada.ok) return { ok: false, erro: usada.erro };
  const gravado = await gravarVisitas(env, consultorId, usada.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro };
  return { ok: true, visita: usada.visita };
}

/** LARGA A RESERVA — a criação falhou, e o link volta a servir para quem o tentar outra vez. */
async function libertar(env, consultorId, visitaId, agora) {
  const lidas = await lerVisitas(env, consultorId);
  if (!lidas.ok) return { ok: false, erro: lidas.erro };
  const largada = consultores.largarReserva(lidas.visitas, visitaId, agora);
  if (!largada.ok) return { ok: false, erro: largada.erro };
  const gravado = await gravarVisitas(env, consultorId, largada.lista);
  if (!gravado.ok) return { ok: false, erro: gravado.erro };
  return { ok: true, visita: largada.visita };
}

module.exports = {
  temKv,
  ler,
  gravar,
  criar,
  mudarEstado,
  /* F2 — o endereço dele e as visitas */
  porToken,
  novoAcesso,
  lerVisitas,
  gravarVisitas,
  criarVisita,
  reemitirLink,
  /* F3 — o link que abre uma escola */
  gravarOLink,
  apagarOLink,
  porLink,
  porLinkLegado,
  situacaoDoLink,
  reservar,
  gastar,
  libertar,
};
