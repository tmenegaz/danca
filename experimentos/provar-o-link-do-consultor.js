#!/usr/bin/env node
'use strict';

/**
 * provar-o-link-do-consultor.js — O ENDEREÇO DELE, E O LINK DE CADA VISITA (25/11/2026 — F2).
 *
 * O QUE ELA DISSE QUE O TOKEN CARREGA: «ele vai dizer quem é o consultor, qual é a escola que ele
 * tá atendendo, vai dizer também qual é a praça desse consultor e vai dizer também que ele é acesso
 * único, só pode ser feito uma vez.» E o que o link serve: «o consultor vai gerar esse link para N
 * escolas que ele consultar e fizer a implementação.»
 *
 * O QUE ESTA PROVA FIXA, e cada secção existe porque sem ela o defeito só se descobre com um
 * consultor a trabalhar:
 *
 *   §A o token é aleatório, guardado só como HASH, e o âmbito separa as três espécies — um token de
 *      convite nunca confere como acesso;
 *   §B o endereço nasce do «Activar» e só existe uma vez: o KV não o guarda, e um segundo pedido de
 *      leitura não o devolve;
 *   §C trocar o endereço mata o anterior — a fechadura troca-se, não se duplica;
 *   §D a área dele: 404 para um token que não é de ninguém, a página de suspenso para um inactivo,
 *      e a área com o formulário para um activo;
 *   §E a visita: o link nasce com 30 dias, o estado é CALCULADO (expira sem cron), e o `tokenHash`
 *      NUNCA sai numa resposta;
 *   §F a reemissão: um link novo para a mesma visita, com a mesma validade, e nunca para uma visita
 *      cuja escola já nasceu;
 *   §G CONTROLO NEGATIVO: um consultor inactivo não gera visita nem pela rota — a página sem botão
 *      não é a barreira, e é esta que conta;
 *   §H o livro cheio RECUSA, em vez de deixar cair o mais antigo: uma visita é uma linha de dinheiro;
 *   §I o `link` que a rota devolve é o endereço público, e não o do painel.
 *
 *   node experimentos/provar-o-link-do-consultor.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const consultores = require(path.join(RAIZ, 'motor/nucleo/consultores.js'));
const segredo = require(path.join(RAIZ, 'motor/nucleo/segredo.js'));
const daCasa = require(path.join(RAIZ, 'motor/servidor/consultores-da-casa.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

function kvDeMentira(inicial) {
  const mem = new Map(Object.entries(inicial || {}));
  return {
    mem,
    async get(k) { return mem.has(k) ? mem.get(k) : null; },
    async put(k, v) { mem.set(k, String(v)); },
    async delete(k) { mem.delete(k); },
    async list() { return { keys: [...mem.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

function kvQueFalha() {
  return { async get() { throw new Error('o KV não respondeu'); }, async put() { throw new Error('o KV não respondeu'); } };
}

const CADASTRO = {
  nome: 'Maria Silva',
  praca: 'Santa Maria',
  cpf: '123.456.789-01',
  email: 'maria@exemplo.com',
  telefone: '(55) 99999-0000',
  equipamento: { carro: true, habilitacao: true, notebook: true },
};

/* A BANCADA: um consultor criado e activado, com o token do acesso em mãos. */
async function bancada() {
  const kv = kvDeMentira();
  const env = { PADD_KV: kv };
  const criado = await daCasa.criar(env, CADASTRO);
  const activado = await daCasa.mudarEstado(env, { id: criado.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  return { kv, env, consultor: activado.registo, acesso: activado.token };
}

(async () => {
  /* ── §A o token, e o âmbito que o separa ─────────────────────────────────────────────────── */

  console.log('\n§A o token é aleatório, guardado como hash, e o âmbito separa as espécies');

  const um = segredo.novoToken();
  const dois = segredo.novoToken();
  provar('o token tem 32 caracteres hex', /^[0-9a-f]{32}$/.test(um), um);
  provar('dois tokens nunca são iguais', um !== dois, [um, dois]);
  /* O `Math.random` daria uma sequência previsível; o CSPRNG, não. Não há como provar aleatoriedade
   * numa asserção — o que se prova é que o gerador é o do runtime, e não o `Math.random`. */
  provar('o gerador é o do runtime, e não o `Math.random`',
    segredo.novoToken.toString().indexOf('getRandomValues') !== -1, null);

  const hashAcesso = await segredo.hashDoToken('acesso', um);
  provar('o hash do acesso não é o token', hashAcesso !== um, null);
  provar('o hash é estável', (await segredo.hashDoToken('acesso', um)) === hashAcesso, null);
  provar('o MESMO token noutro âmbito dá outro hash',
    (await segredo.hashDoToken('visita', um)) !== hashAcesso, null);
  provar('um token de convite não vale como acesso',
    (await segredo.hashDoToken('convite', um)) !== hashAcesso, null);
  let estourou = false;
  try { await segredo.hashDoToken('inventado', um); } catch (erro) { estourou = true; }
  provar('um âmbito inventado é recusado, e não cai num por omissão', estourou, null);

  /* ── §B o endereço nasce do «Activar», e só existe uma vez ───────────────────────────────── */

  console.log('\n§B o endereço nasce do «Activar» e o KV guarda o hash, não o endereço');

  const b = await bancada();
  provar('activar devolve um token', typeof b.acesso === 'string' && b.acesso.length === 32, b.acesso);
  const guardado = JSON.parse(b.kv.mem.get(consultores.CHAVE))[0];
  provar('o KV guarda um hash, e não o token', guardado.acessoHash && guardado.acessoHash !== b.acesso,
    String(guardado.acessoHash).slice(0, 10) + '…');
  provar('…e o token não aparece em sítio nenhum do registo',
    JSON.stringify(guardado).indexOf(b.acesso) === -1, null);
  provar('o histórico diz que o acesso foi emitido',
    guardado.historico.some((e) => e.o === 'acesso-emitido'), guardado.historico);
  const pelaLista = await daCasa.porToken(b.env, b.acesso);
  provar('o token abre o consultor certo', pelaLista.consultor && pelaLista.consultor.id === b.consultor.id, null);
  const comTokenErrado = await daCasa.porToken(b.env, 'nao-e-um-token');
  provar('um token que não é de ninguém não abre nada', comTokenErrado.consultor === null, null);
  const vazio = await daCasa.porToken(b.env, '');
  provar('um token vazio não abre nada', vazio.consultor === null, null);

  /* A SEGUNDA ACTIVAÇÃO NÃO DÁ ENDEREÇO. `mudou: false` significa «já estava assim» — e um endereço
   * que aparecesse outra vez aqui seria um endereço que a dona do sistema não decidiu emitir. */
  const outraVez = await daCasa.mudarEstado(b.env, { id: b.consultor.id, ativo: true }, '2026-11-25T13:00:00.000Z');
  provar('activar outra vez não emite endereço nenhum', outraVez.mudou === false && !outraVez.token, outraVez.token);

  /* ── §C trocar mata o anterior ──────────────────────────────────────────────────────────── */

  console.log('\n§C trocar o endereço mata o anterior — a fechadura troca-se, não se duplica');

  const trocado = await daCasa.novoAcesso(b.env, { id: b.consultor.id }, '2026-11-25T14:00:00.000Z');
  provar('o «Novo endereço» devolve um token novo', trocado.ok && trocado.token && trocado.token !== b.acesso, null);
  const velhoAgora = await daCasa.porToken(b.env, b.acesso);
  provar('…e o endereço anterior deixa de abrir', velhoAgora.consultor === null, null);
  const novoAgora = await daCasa.porToken(b.env, trocado.token);
  provar('…e o novo abre', novoAgora.consultor && novoAgora.consultor.id === b.consultor.id, null);

  /* UM CONSULTOR INACTIVO NÃO RECEBE ENDEREÇO — o acesso nasce do «Activar», e um endereço emitido
   * por outra via seria uma porta aberta por uma rota que ninguém olhou. */
  const desactivado = await daCasa.mudarEstado(b.env, { id: b.consultor.id, ativo: false }, '2026-11-25T15:00:00.000Z');
  provar('desactivar não emite endereço', desactivado.ok && !desactivado.token, desactivado.token);
  const semEndereco = await daCasa.novoAcesso(b.env, { id: b.consultor.id });
  provar('…e um consultor inactivo não recebe endereço novo pela rota', semEndereco.ok === false && semEndereco.status === 409,
    semEndereco.erro);
  const aindaAbre = await daCasa.porToken(b.env, trocado.token);
  provar('…o token antigo continua a identificar quem ele é (é a página que decide o estado)',
    aindaAbre.consultor && aindaAbre.consultor.id === b.consultor.id, null);

  /* ── §D a área dele ────────────────────────────────────────────────────────────────────── */

  console.log('\n§D a área dele: 404, suspenso, e a área com o formulário');

  const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
  const handler = raiz.default || raiz;
  const kv = kvDeMentira();
  const env = { PADD_KV: kv, SENHA_RAIZ: 'a-senha-da-bancada', HOST_DONO: 'danca.padd.com.br', HOST_PUBLICO: 'lastro.padd.com.br' };
  const noPublico = (caminho, opcoes) => handler.fetch(new Request('https://lastro.padd.com.br' + caminho,
    Object.assign({ headers: {} }, opcoes || {})), env);

  const criadoD = await daCasa.criar(env, CADASTRO);
  const activadoD = await daCasa.mudarEstado(env, { id: criadoD.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  const tokenD = activadoD.token;

  const semNada = await noPublico('/consultor/nao-e-um-token');
  provar('um token que não é de ninguém responde 404', semNada.status === 404, semNada.status);
  const textoDo404 = await semNada.text();
  provar('…e não explica nada («não encontrado», e não «token inválido»)', /não encontrado/.test(textoDo404), textoDo404);

  const area = await noPublico('/consultor/' + tokenD);
  const html = await area.text();
  provar('o endereço válido abre a área', area.status === 200, area.status);
  provar('…e diz de quem é', html.indexOf('Maria Silva') !== -1, null);
  provar('…com o formulário da visita nova', html.indexOf('consultor-gerar') !== -1, null);
  provar('…e a caixa do link, escondida até haver um', /id="consultor-link-caixa" hidden/.test(html), null);
  provar('…e o «Copiar» do link é o da casa', html.indexOf('__copiarLigado') !== -1, null);
  provar('…e o token entra no endereço do pedido', html.indexOf('/api/consultor/' + tokenD + '/visita') !== -1, null);
  provar('a área não mostra o painel (sem o menu do dono)', html.indexOf('Escolas vivas') === -1, null);
  provar('…e não é indexável', /name="robots" content="noindex"/.test(html), null);

  /* A PÁGINA DO SUSPENSO: ele tem o token certo, e o que se fecha é o acesso. */
  await daCasa.mudarEstado(env, { id: criadoD.registo.id, ativo: false }, '2026-11-25T13:00:00.000Z');
  const suspensa = await noPublico('/consultor/' + tokenD);
  const htmlSuspenso = await suspensa.text();
  provar('um consultor inactivo vê a página do acesso suspenso', suspensa.status === 200, suspensa.status);
  provar('…e a frase diz a quem falar', /acesso está suspenso/.test(htmlSuspenso) && /administração/.test(htmlSuspenso), null);
  provar('…e NÃO tem o formulário de gerar', htmlSuspenso.indexOf('consultor-gerar') === -1, null);
  provar('…nem a lista das visitas', htmlSuspenso.indexOf('consultor-resumo') === -1, null);

  /* UM KV QUE NÃO RESPONDE NÃO É «ESTE CONSULTOR NÃO EXISTE». */
  const envMudo = Object.assign({}, env, { PADD_KV: kvQueFalha() });
  const muda = await handler.fetch(new Request('https://lastro.padd.com.br/consultor/' + tokenD), envMudo);
  const htmlMudo = await muda.text();
  provar('com o KV mudo, a área responde 503', muda.status === 503, muda.status);
  provar('…e diz que não conseguiu ler, em vez de dizer que o consultor não existe',
    /não foi possível ler/.test(htmlMudo), null);

  /* ── §E a visita ──────────────────────────────────────────────────────────────────────── */

  console.log('\n§E a visita: o link nasce com prazo, o estado é calculado, e o hash não sai');

  const envV = { PADD_KV: kvDeMentira() };
  const criadoV = await daCasa.criar(envV, CADASTRO);
  await daCasa.mudarEstado(envV, { id: criadoV.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  const visita = await daCasa.criarVisita(envV, criadoV.registo.id,
    { escolaNome: 'Studio Aurora', cidade: 'Santa Maria', previstaPara: '2026-12-02' }, '2026-11-25T12:00:00.000Z');
  provar('a visita nasce', visita.ok === true && Boolean(visita.visita.id), visita.erro);
  provar('…e devolve um token de link', typeof visita.token === 'string' && visita.token.length === 32, visita.token);
  provar('…com trinta dias de validade', visita.visita.expiraEm === '2026-12-25T12:00:00.000Z', visita.visita.expiraEm);
  provar('…e o ID não é o token', visita.visita.id !== visita.token, null);
  const guardada = JSON.parse(envV.PADD_KV.mem.get(consultores.chaveDasVisitas(criadoV.registo.id)))[0];
  provar('o livro guarda o hash, e não o token', guardada.tokenHash && guardada.tokenHash !== visita.token, null);
  provar('…e o token não aparece no que ficou guardado', JSON.stringify(guardada).indexOf(visita.token) === -1, null);
  provar('…e o link nasce aberto', consultores.estadoDaVisita(guardada, '2026-11-26T00:00:00.000Z') === 'aberta', null);
  provar('…e expira sozinho, sem cron (o estado é calculado)',
    consultores.estadoDaVisita(guardada, '2026-12-26T00:00:00.000Z') === 'expirada', null);
  provar('um link sem prazo legível conta como expirado, e não como eterno',
    consultores.estadoDaVisita({ id: 'v-1', escolaNome: 'x', expiraEm: null }, '2026-11-26T00:00:00.000Z') === 'expirada', null);

  const visao = consultores.visaoDaVisita(guardada, '2026-11-26T00:00:00.000Z');
  provar('a visão pública NÃO leva o hash', !('tokenHash' in visao), Object.keys(visao));
  provar('…e leva o estado calculado', visao.estado === 'aberta', visao.estado);

  /* O CONSULTOR D FOI DESACTIVADO NO §D, e o token dele não volta a valer: reactivar emite outro.
   * É essa a sequência que a prova segue — e é ela que mostra que o endereço antigo morreu. */
  const reactivado = await daCasa.mudarEstado(env, { id: criadoD.registo.id, ativo: true }, '2026-11-25T16:10:00.000Z');
  provar('reactivar um consultor desactivado emite um endereço novo',
    reactivado.ok === true && Boolean(reactivado.token), reactivado.erro);
  const tokenBom = reactivado.token;
  const velhoDepois = await daCasa.porToken(env, tokenD);
  provar('…e o endereço de antes do desactivar NÃO volta a abrir', velhoDepois.consultor === null, null);
  const criada = await noPublico('/api/consultor/' + tokenBom + '/visita', {
    method: 'POST', body: JSON.stringify({ escolaNome: 'Studio Aurora', cidade: 'Santa Maria' }),
  });
  const corpoCriada = await criada.json();
  provar('a rota cria a visita e responde 201', criada.status === 201 && corpoCriada.ok === true, criada.status);
  provar('…e devolve o link com o endereço PÚBLICO, e não o do painel',
    String(corpoCriada.link || '').startsWith('https://lastro.padd.com.br/visita/'), corpoCriada.link);
  provar('…e diz que o link aparece uma vez', corpoCriada.umaVez === true, corpoCriada.umaVez);
  provar('…e o tokenHash NÃO vai no corpo', !('tokenHash' in (corpoCriada.visita || {})) &&
    JSON.stringify(corpoCriada).indexOf('tokenHash') === -1, Object.keys(corpoCriada.visita || {}));
  const tokenDoLink = String(corpoCriada.link || '').split('/').pop();
  provar('…e o token do link confere com o que ficou guardado',
    guardadaHash(env, criadoD.registo.id, tokenDoLink), null);

  /* ── §F a reemissão ───────────────────────────────────────────────────────────────────── */

  console.log('\n§F a reemissão: um link novo para a mesma visita, e nenhum para uma escola já criada');

  const antes = (await daCasa.lerVisitas(env, criadoD.registo.id)).visitas;
  const alvo = antes[0];
  const reem = await noPublico('/api/consultor/' + tokenBom + '/visita/' + alvo.id + '/link', {
    method: 'POST', body: '{}',
  });
  const corpoReem = await reem.json();
  provar('reemitir responde ok e devolve outro link', reem.status === 200 && corpoReem.ok === true, corpoReem.erro);
  provar('…e é outro token', corpoReem.link !== corpoCriada.link, null);
  provar('…e a visita é a MESMA (não nasce uma segunda)',
    corpoReem.visita && corpoReem.visita.id === alvo.id, corpoReem.visita && corpoReem.visita.id);
  provar('…e o prazo conta de novo', corpoReem.visita.expiraEm !== alvo.expiraEm, [alvo.expiraEm, corpoReem.visita.expiraEm]);
  /* O HISTÓRICO LÊ-SE DO QUE FICOU GUARDADO, e não da resposta: a visão pública de uma visita não
   * leva o histórico — um cliente que não o mostra não precisa dele. */
  const depois = (await daCasa.lerVisitas(env, criadoD.registo.id)).visitas.find((v) => v.id === alvo.id);
  provar('…e a reemissão fica no histórico',
    (depois.historico || []).some((e) => e.o === 'link-reemitido'), depois.historico);

  /* UMA VISITA CUJA ESCOLA JÁ NASCEU NÃO SE REEMITE. O `usadaEm` é o que a F3 escreve. */
  const comEscola = consultores.reemitirLink(
    [{ id: 'v-x', escolaNome: 'x', tokenHash: 'h', usadaEm: '2026-11-26T10:00:00.000Z', expiraEm: '2026-12-25T12:00:00.000Z' }],
    'v-x', 'outro-hash', '2026-11-27T10:00:00.000Z');
  provar('uma visita que já deu escola não se reemite', comEscola.ok === false && comEscola.gasto === true, comEscola.erro);

  /* ── §G o controlo negativo do activo ─────────────────────────────────────────────────── */

  console.log('\n§G um consultor inactivo não gera visita nem pela rota');

  const envG = { PADD_KV: kvDeMentira() };
  const criadoG = await daCasa.criar(envG, CADASTRO);
  const nuncaActivado = await daCasa.criarVisita(envG, criadoG.registo.id, { escolaNome: 'Studio Aurora' });
  provar('um consultor que nunca foi activado não gera visita', nuncaActivado.ok === false && nuncaActivado.status === 403,
    nuncaActivado.erro);
  provar('…e o livro dele continua vazio',
    (await daCasa.lerVisitas(envG, criadoG.registo.id)).visitas.length === 0, null);

  /* E A ROTA É A BARREIRA QUE CONTA — o formulário ausente não impede um pedido escrito à mão. */
  const activoG = await daCasa.mudarEstado(envG, { id: criadoG.registo.id, ativo: true }, '2026-11-25T12:00:00.000Z');
  const envG2 = { PADD_KV: envG.PADD_KV, SENHA_RAIZ: 'x', HOST_DONO: 'danca.padd.com.br', HOST_PUBLICO: 'lastro.padd.com.br' };
  const pelaRota = await handler.fetch(new Request('https://lastro.padd.com.br/api/consultor/' + activoG.token + '/visita', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escolaNome: 'Studio Aurora' }),
  }), envG2);
  provar('activo, a mesma rota cria', pelaRota.status === 201, pelaRota.status);
  await daCasa.mudarEstado(envG, { id: criadoG.registo.id, ativo: false }, '2026-11-25T13:00:00.000Z');
  const desactivadoG = await handler.fetch(new Request('https://lastro.padd.com.br/api/consultor/' + activoG.token + '/visita', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escolaNome: 'Outra Escola' }),
  }), envG2);
  const corpoG = await desactivadoG.json();
  provar('depois de desactivado, a rota RECUSA (403) — a página sem botão não é a barreira',
    desactivadoG.status === 403, desactivadoG.status);
  provar('…e a frase diz o que aconteceu', /inactivo|inativo/.test(String(corpoG.erro || '')), corpoG.erro);
  provar('…e nada foi acrescentado ao livro',
    (await daCasa.lerVisitas(envG, criadoG.registo.id)).visitas.length === 1, null);

  /* ── §H o livro cheio recusa ──────────────────────────────────────────────────────────── */

  console.log('\n§H o livro cheio RECUSA, em vez de deixar cair o mais antigo');

  const cheio = Array.from({ length: consultores.MAXIMO_DE_VISITAS }, (_, i) =>
    ({ id: 'v-' + i, escolaNome: 'Escola ' + i, tokenHash: 'h', expiraEm: '2026-12-25T12:00:00.000Z', historico: [] }));
  const recusado = consultores.acrescentarVisita(cheio, { escolaNome: 'A mais nova' }, 'h2', '2026-11-25T12:00:00.000Z');
  provar('ao chegar ao tecto, recusa', recusado.ok === false && recusado.cheio === true, recusado.erro);
  provar('…e diz porquê, com o número', String(recusado.erro).indexOf(String(consultores.MAXIMO_DE_VISITAS)) !== -1, recusado.erro);
  provar('…e a lista fica intacta (nada foi apagado em silêncio)', cheio.length === consultores.MAXIMO_DE_VISITAS, null);
  /* O CONTRASTE COM A LISTA DE CONSULTORES, medido: lá é um directório e a mais antiga sai; aqui é
   * um livro de dinheiro e a resposta é «não». As duas políticas existem, e a diferença é declarada. */
  const consultoresCheios = Array.from({ length: consultores.MAXIMO_NA_LISTA }, (_, i) =>
    ({ id: 'c-' + i, nome: 'Consultor ' + i }));
  const entrouNoDirectorio = consultores.acrescentar(consultoresCheios,
    { nome: 'Consultor 200', praca: 'SM', cpf: '11144477735', email: 'a@b.com', telefone: '5551999990000' },
    '2026-11-25T12:00:00.000Z');
  provar('um consultor a mais no directorio entra, e diz que um saiu (a política oposta)',
    entrouNoDirectorio.ok === true && entrouNoDirectorio.retirados === 1, entrouNoDirectorio.retirados);

  /* ── §I a área não sai no painel, e o painel não sai na área ──────────────────────────── */

  console.log('\n§I as duas paredes: o painel não serve a área, e a área não serve o painel');

  const credencial = 'Basic ' + Buffer.from('tmenegaz:a-senha-da-bancada').toString('base64');
  const painelConsultores = await handler.fetch(new Request('https://danca.padd.com.br/consultores', {
    headers: { Authorization: credencial },
  }), env);
  provar('o painel serve /consultores com a senha', painelConsultores.status === 200, painelConsultores.status);
  const htmlPainel = await painelConsultores.text();
  provar('…com a caixa do endereço, escondida até haver um', /id="consultores-acesso" hidden/.test(htmlPainel), null);
  provar('…e o «Copiar» dessa caixa é o da casa', htmlPainel.indexOf('__copiarLigado') !== -1, null);
  provar('…e o botão «Novo endereço» só existe para quem está activo',
    /data-novo-acesso=/.test(htmlPainel) === (await daCasa.ler(env)).lista.some((c) => c.ativo), null);

  const areaNoPainel = await handler.fetch(new Request('https://danca.padd.com.br/consultor/' + tokenBom, {
    headers: { Authorization: credencial },
  }), env);
  /* NO ENDEREÇO DO PAINEL a área não existe — ela é do endereço público, e um segundo caminho para
   * a mesma área seria um segundo sítio onde a parede do token podia ser esquecida. O que responde é
   * o painel autenticado, e ele não conhece este caminho. */
  const corpoNoPainel = await areaNoPainel.text();
  provar('no endereço do painel, /consultor/<token> não abre a área',
    areaNoPainel.status === 404 || corpoNoPainel.indexOf('consultor-gerar') === -1, areaNoPainel.status);

  console.log('\n' + provas + ' asserções, ' + (provas - falhas) + ' ok, ' + falhas + ' falha(s)');
  process.exit(falhas === 0 ? 0 : 1);
})();

/** O token do link confere com o hash guardado? A pergunta faz-se com a função que o servidor usa. */
function guardadaHash(env, id, token) {
  const bruto = env.PADD_KV.mem.get(consultores.chaveDasVisitas(id));
  if (!bruto) return false;
  const lista = JSON.parse(bruto);
  const hash = require('crypto').createHash('sha256')
    .update('lastro/visita/' + token, 'utf8').digest('hex');
  return lista.some((v) => v.tokenHash === hash);
}
