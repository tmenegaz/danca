#!/usr/bin/env node
'use strict';

/**
 * provar-pagina-publica.js — a página pública, o cadastro e o e-mail (25/11/2026).
 *
 * O QUE ELA DECIDIU, e o que cada secção mede:
 *
 *   «A página danca.padd.com.br ela é só minha, só do proprietário do sistema […] A página pública
 *    […] vai se chamar lastro.padd.com.br. E e aí ele acessa, ele tem essa mesma página de
 *    apresentação […] só que o único botão que existe para ela é o de criar nova escola.»
 *                                                          → secções A, B e C
 *
 *   «No cadastro da escola a gente vai ter o nome da escola, o CNPJ, o e-mail e o telefone. […]
 *    Do professor, o nome completo, o CPF, o e-mail e o telefone. E ele já vai cadastrar aqui qual
 *    é a habilidade que ele tem.»                        → secções D e E
 *
 *   «Sempre que for criado uma escola, tem que disparar um e-mail para o professor e para o e-mail
 *    da escola. Mesmo que seja o mesmo e-mail cadastrado, aí dispara um só […] Qual é o conteúdo?
 *    É esse resultado que a gente mostra atualmente quando cria uma escola.»  → secção F
 *
 *   «Independente de por onde for criada a escola, os meus botões aqui […] têm que continuar
 *   funcionando.»                                        → secção G
 *
 * SEM REDE, SEM TOKEN E SEM CRIAR ESCOLA. As chamadas de criação que se medem aqui param na
 * VALIDAÇÃO — antes de qualquer pedido ao Cloudflare ou ao GitHub —, e as de correio usam um
 * `fetch` de bolso. Uma prova que cria uma escola de verdade gasta a cota de quem a corre e deixa
 * lixo no sistema.
 *
 *   node experimentos/provar-pagina-publica.js
 *   node experimentos/provar-pagina-publica.js --controle-negativo
 *
 * O CONTROLE NEGATIVO corre as mesmas asserções contra `062b5442` — o commit imediatamente antes
 * deste trabalho, onde a página pública e o cadastro não existiam. A âncora é fixa, e não `HEAD`:
 * um controle ancorado em `HEAD` passa a comparar a prova com ela mesma no dia em que o trabalho é
 * cometido. É a quarta vez que esta casa tropeça nisso; está escrito no REGISTRO.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const NEGATIVO = process.argv.includes('--controle-negativo');
const REFERENCIA_DO_CONTROLE = '062b5442';

function raizDoCodigo() {
  if (!NEGATIVO) return { raiz: RAIZ, referencia: null };
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'publica-antes-'));
  try {
    execSync('git archive ' + REFERENCIA_DO_CONTROLE + ' motor biblioteca tools modelo raiz | tar -x -C ' + destino,
      { cwd: RAIZ, stdio: 'pipe' });
  } catch (erro) {
    console.error('não consegui extrair ' + REFERENCIA_DO_CONTROLE + ' — sem o controle negativo.');
    process.exit(3);
  }
  return { raiz: destino, referencia: REFERENCIA_DO_CONTROLE };
}

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

const { raiz, referencia } = raizDoCodigo();
if (referencia) console.log('CONTROLE NEGATIVO — o código de ' + referencia + ', antes da página pública\n');

const carregar = (rel) => {
  try { return require(path.join(raiz, rel)); } catch (erro) {
    if (NEGATIVO) return null;
    throw erro;
  }
};

const raizJs = carregar('motor/servidor/raiz.js');
const cadastroNucleo = carregar('motor/nucleo/cadastro-da-escola.js');
const correio = carregar('motor/servidor/correio.js');

/** Um `env` mínimo: o portão da senha, e um token falso — que basta para chegar à validação. */
const ENV_DONO = { SENHA_RAIZ: 'segredo', CLOUDFLARE_API_TOKEN: 'token-falso', GITHUB_TOKEN: 'gh-falso' };
const ENV_PUBLICO = Object.assign({}, ENV_DONO);
const AUTORIZACAO = { Authorization: 'Basic ' + Buffer.from('tmenegaz:segredo').toString('base64') };

/** Um KV de bolso: guarda o que lhe pedem e conta as escritas. */
function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  const escritas = [];
  return {
    dados,
    escritas,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { escritas.push(k); dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    async list() { return { keys: [...dados.keys()].map((name) => ({ name })), list_complete: true }; },
  };
}

async function principal() {
/* ============================================================================ A. a regra do host */

console.log('\nA. Quem vê o quê — o endereço decide, e não uma lista escrita no código');
if (typeof raizJs.ehPaginaPublica !== 'function') {
  conferir('existe `ehPaginaPublica` — a regra que separa os dois endereços', false, 'não existe');
} else {
  const publico = (host) => raizJs.ehPaginaPublica(new Request('https://' + host + '/'), ENV_DONO);
  conferir('danca.padd.com.br é o PAINEL', publico('danca.padd.com.br') === false, null);
  conferir('lastro.padd.com.br é a página PÚBLICA', publico('lastro.padd.com.br') === true, null);
  conferir('o endereço técnico do Worker (workers.dev) é o PAINEL — a senha continua a ser pedida',
    publico('danca.tmenegaz77.workers.dev') === false, null);
  /* A DIREÇÃO CONSERVADORA: um host desconhecido apontado a este Worker recebe a página pública.
   * Trocar os lados custaria a lista de escolas e o botão de apagar — e um host a mais não custa
   * nada, porque a página pública não tem dado nenhum dentro. */
  conferir('um host desconhecido cai no lado PÚBLICO (o erro barato é esse)',
    publico('outra-coisa.example') === true, null);
  const comVar = Object.assign({}, ENV_DONO, { HOST_DONO: 'painel.exemplo.com' });
  conferir('a `var` HOST_DONO muda o critério sem mudar o código',
    raizJs.ehPaginaPublica(new Request('https://painel.exemplo.com/'), comVar) === false &&
    raizJs.ehPaginaPublica(new Request('https://danca.padd.com.br/'), comVar) === true, null);
}

/* ================================================================= B. o que a página pública serve */

/** O ASSETS de bolso: devolve o `raiz/index.html` de verdade, com o tipo certo. */
function assetsFalso() {
  const arq = path.join(raiz, 'raiz/index.html');
  const html = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8') : '';
  return {
    async fetch() {
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    },
  };
}

async function pedir(host, caminho, opcoes) {
  /* NO CONTROLE NEGATIVO O MÓDULO DE ANTES NÃO TEM ESTAS FUNÇÕES (ou nem carrega). Uma prova que
   * rebenta não mede nada e esconde o resto — a FALHA é o que se quer ver ali. */
  if (!raizJs || typeof raizJs.fetch !== 'function') return { status: 0, texto: '', corpo: null };
  const req = new Request('https://' + host + caminho, opcoes || {});
  const res = await raizJs.fetch(req, Object.assign({}, ENV_PUBLICO, { ASSETS: assetsFalso() }));
  let corpo = null;
  /* O CÓDIGO DE ANTES PODE DEVOLVER UMA RESPOSTA JÁ CONSUMIDA (o `return respostaDoAsset` depois de
   * ler o corpo para procurar o marcador). No controle isso é uma FALHA a medir, e não um rebentar
   * da prova: o que se quer ver ali é «não serviu a página», não um `TypeError`. */
  let texto = '';
  try { texto = await res.text(); } catch (erro) { texto = ''; }
  try { corpo = JSON.parse(texto); } catch (erro) { corpo = null; }
  return { status: res.status, texto, corpo, cabecalhos: res.headers };
}

console.log('\nB. A página pública: a MESMA apresentação, sem senha, e só o botão de criar');
const capa = await pedir('lastro.padd.com.br', '/');
conferir('/ responde 200 SEM pedir senha', capa.status === 200, capa.status);
conferir('…e diz que é a página pública (`data-pagina="publica"`)',
  /data-pagina="publica"/.test(capa.texto), capa.texto.slice(0, 200));
conferir('…e NÃO traz a lista de escolas do painel',
  !/escolas-do-sistema">[\s\S]{40,}/.test(capa.texto) && !/Escolas do sistema<\/h2>/.test(capa.texto), null);
conferir('…e mantém a apresentação, a marca e o botão de criar',
  /Sistema Lastro/.test(capa.texto) && /id="btn-criar"/.test(capa.texto), null);
/* A PEÇA DO PAINEL SAI DO HTML, E NÃO SÓ SE ESCONDE (25/11/2026). Era esta a asserção de antes —
 * «vai marcada com `data-dono`» —, e a marcação mudou de propósito: ela pediu «remova», e a
 * remoção não depende de a folha chegar. A folha guarda a regra como segunda barreira, e é isso
 * que se mede a seguir no `provar-cadastro-em-etapas`, secção C.
 *
 * `opcao-existente` SAIU DESTA LISTA (25/11/2026, o mesmo dia). Ela esteve aqui por uma decisão
 * minha — «o público cria a pessoa; reaproveitar uma pasta é decisão de quem conhece o histórico»
 * — e foi essa decisão que ela veio desfazer: «só tem uma opção aqui […] Você tirou. Tem que
 * colocar aqui de volta.» O que sai do HTML público é o que só o dono pode fazer; reaproveitar um
 * professor não é uma delas. */
conferir('…e as peças SÓ DO DONO nem vêm no HTML público',
  capa.texto.indexOf('id="btn-apagar"') === -1 &&
  capa.texto.indexOf('href="/professores"') === -1, null);
conferir('…mas a opção «um professor que já existe» VEM — ela pediu-a de volta no público',
  capa.texto.indexOf('id="opcao-existente"') !== -1, null);

const capaDono = await pedir('danca.padd.com.br', '/', { headers: AUTORIZACAO });
conferir('no painel, a mesma página diz que é o painel',
  capaDono.status === 200 && /data-pagina="painel"/.test(capaDono.texto), capaDono.status);
const capaSemSenha = await pedir('danca.padd.com.br', '/');
conferir('no painel, SEM senha, continua a haver portão (401)',
  capaSemSenha.status === 401, capaSemSenha.status);

/* ============================================================ C. o que o público NÃO alcança */

console.log('\nC. O público não alcança o painel — e a recusa não diz que a porta existe');
for (const [caminho, metodo] of [
  ['/api/escolas', 'GET'],
  ['/api/professores', 'GET'],
  ['/api/cofre', 'POST'],
  ['/api/apagar-escola', 'POST'],
  ['/professores', 'GET'],
  ['/escolas-vivas', 'GET'],
  ['/escolas-apagadas', 'GET'],
]) {
  const r = await pedir('lastro.padd.com.br', caminho, { method: metodo });
  conferir('PUBLICO ' + metodo + ' ' + caminho + ' → 404 (e não 401: não se anuncia a porta)',
    r.status === 404, r.status);
}
const maisSaude = await pedir('lastro.padd.com.br', '/api/saude');
conferir('a saúde continua a responder no público — é ela que confirma que o Worker é a raiz',
  maisSaude.status === 200 && maisSaude.corpo && maisSaude.corpo.tipo === 'raiz', maisSaude.corpo);

/* ================================================= D. o cadastro — a forma, e as duas portas */

console.log('\nD. O cadastro: os campos que ela pediu, e o que é obrigatório em cada porta');
if (!cadastroNucleo || typeof cadastroNucleo.validarCadastro !== 'function') {
  conferir('existe `validarCadastro` — as regras do cadastro', false, 'não existe');
} else {
  const CATALOGO = ['bale-classico', 'danca-moderna', 'jazz'];
  const completo = {
    nome: 'Escola Azul', cnpj: '12.345.678/0001-90',
    escolaEmail: 'escola@azul.com.br', escolaTelefone: '(51) 3333-4444',
    professorNomeCompleto: 'Ana Paula Souza', cpf: '123.456.789-01',
    professorEmail: 'ana@azul.com.br', professorTelefone: '(51) 99999-0000',
    modalidade: 'bale-classico',
  };
  const bom = cadastroNucleo.validarCadastro(completo,
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: true });
  conferir('um cadastro completo passa, e os números ficam só com dígitos',
    bom.ok && bom.cadastro.cnpj === '12345678000190' && bom.cadastro.cpf === '12345678901',
    bom.cadastro || bom.erro);
  conferir('…e a habilidade fica registada como ela a declarou',
    bom.ok && bom.cadastro.modalidade === 'bale-classico', bom.cadastro && bom.cadastro.modalidade);

  /* A MESMA FORMA, E A OBRIGAÇÃO QUE MUDA: na página pública o CNPJ, o e-mail e o telefone da
   * escola são exigidos; no painel, não. Foi a decisão dela para a página do proprietário («a
   * gente está testando e criando») e o que a página pública precisa de recolher. */
  const soAbertura = { nome: 'Escola Teste' };
  const semCadastroNoPublico = cadastroNucleo.validarCadastro(soAbertura,
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: true });
  conferir('no PÚBLICO, o CNPJ da escola é exigido — e o erro nomeia o campo',
    !semCadastroNoPublico.ok && /CNPJ/.test(semCadastroNoPublico.erro), semCadastroNoPublico.erro);
  const semCadastroNoPainel = cadastroNucleo.validarCadastro(
    { nome: 'Escola Teste', professorNome: 'Ana', cpf: '12345678901', professorEmail: 'a@b.com',
      professorTelefone: '5199999000', modalidade: 'jazz' },
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: false });
  conferir('no PAINEL, a mesma escola passa sem CNPJ — o teste dela continua a poder criar',
    semCadastroNoPainel.ok, semCadastroNoPainel.erro);

  const cnpjCurto = cadastroNucleo.validarCadastro(Object.assign({}, completo, { cnpj: '123' }),
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: true });
  conferir('um CNPJ com o número de dígitos errado é recusado, e diz quantos vieram',
    !cnpjCurto.ok && /14 dígitos/.test(cnpjCurto.erro), cnpjCurto.erro);
  const cpfRepetido = cadastroNucleo.validarCadastro(Object.assign({}, completo, { cpf: '11111111111' }),
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: true });
  conferir('um CPF de dígitos repetidos é recusado', !cpfRepetido.ok, cpfRepetido.erro);
  const emailMau = cadastroNucleo.validarCadastro(Object.assign({}, completo, { professorEmail: 'ana.azul' }),
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: true });
  conferir('um e-mail sem domínio é recusado', !emailMau.ok && /@/.test(emailMau.erro), emailMau.erro);
  const foraDoCatalogo = cadastroNucleo.validarCadastro(Object.assign({}, completo, { modalidade: 'sapateado' }),
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: true });
  conferir('uma habilidade fora do catálogo é recusada — o perfil não nasce ilegível',
    !foraDoCatalogo.ok && /catálogo/.test(foraDoCatalogo.erro), foraDoCatalogo.erro);
  const reuso = cadastroNucleo.validarCadastro({ nome: 'Escola', professorExistente: 'ana-paula' },
    { modalidadesValidas: CATALOGO, exigirDadosDaEscola: false });
  conferir('um professor que JÁ EXISTE não é obrigado a repetir CPF, e-mail e telefone',
    reuso.ok && reuso.modo === 'existente', reuso.erro);
}

/** Um pedido de criação que PARA na validação — nada é criado, nada é pedido à rede. */
async function criar(host, corpo, comSenha) {
  if (!raizJs || typeof raizJs.fetch !== 'function') return { status: 0, corpo: null };
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (comSenha) Object.assign(cabecalhos, AUTORIZACAO);
  const req = new Request('https://' + host + '/api/criar-escola', {
    method: 'POST', headers: cabecalhos, body: JSON.stringify(corpo),
  });
  const res = await raizJs.fetch(req, Object.assign({}, ENV_PUBLICO, { ASSETS: assetsFalso() }));
  const texto = await res.text();
  let json = null;
  try { json = JSON.parse(texto); } catch (erro) { json = null; }
  return { status: res.status, corpo: json };
}

console.log('\nE. A criação pela página pública — recusa antes de criar, quando falta o cadastro');
const pubSemCadastro = await criar('lastro.padd.com.br', { nome: 'Escola X', senhaAdmin: 'a', professorNome: 'Ana', senhaProfessor: 'b' });
conferir('sem o cadastro da escola, a página pública RECUSA (400) — e nada é criado',
  pubSemCadastro.status === 400 && /CNPJ/.test(pubSemCadastro.corpo.erro || ''), pubSemCadastro);
const painelSemCadastro = await criar('danca.padd.com.br', { nome: 'Escola X' }, true);
conferir('no painel, o MESMO pedido não é recusado por falta de CNPJ — a recusa é outra',
  painelSemCadastro.status === 400 && !/CNPJ/.test(painelSemCadastro.corpo.erro || ''),
  painelSemCadastro.corpo && painelSemCadastro.corpo.erro);
const publicoSemSenha = await pedir('lastro.padd.com.br', '/api/criar-escola', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
});
conferir('a criação no público NÃO exige a senha da raiz (é a página que ela abriu a quem se regista)',
  publicoSemSenha.status !== 401, publicoSemSenha.status);

/* ================================================ F. o registo no KV e o e-mail de boas-vindas */

console.log('\nF. Onde o cadastro fica, e a mensagem que sai (ou que fica guardada)');
if (typeof raizJs.gravarCadastro !== 'function') {
  conferir('existe `gravarCadastro` — os dados pessoais fora do índice versionado', false, 'não existe');
} else {
  const kv = kvDeBolso();
  const escrito = await raizJs.gravarCadastro({
    env: { PADD_KV: kv },
    escola: 'azul',
    professor: 'ana-paula',
    origem: 'publico',
    cadastro: {
      escolaNome: 'Escola Azul', cnpj: '12345678000190', escolaEmail: 'escola@azul.com.br',
      escolaTelefone: '(51) 3333-4444', professorNomeCompleto: 'Ana Paula', cpf: '12345678901',
      professorEmail: 'ana@azul.com.br', professorTelefone: '(51) 99999-0000',
    },
  });
  conferir('o cadastro da escola vai para o cofre do TENANT (sai com o expurgo)',
    escrito.escola === 'bastidores/azul/cadastro', escrito.escola);
  conferir('…e o contato do professor para a chave da PESSOA (sobrevive ao expurgo da escola)',
    escrito.professor === 'professores/ana-paula/contato', escrito.professor);
  const guardado = JSON.parse(kv.dados.get('professores/ana-paula/contato') || '{}');
  conferir('…com o CPF, e não com uma senha nem um hash',
    guardado.cpf === '12345678901' && !('senha' in guardado) && !('hash' in guardado), guardado);
  const daEscola = JSON.parse(kv.dados.get('bastidores/azul/cadastro') || '{}');
  conferir('…e a origem (quem criou) fica registada', daEscola.origem === 'publico', daEscola.origem);

  /* NÃO SE SOBRESCREVE O QUE A PESSOA JÁ TINHA. Uma segunda escola do mesmo professor não pode
   * apagar-lhe o CPF com um campo que a segunda criação não trouxe. */
  await raizJs.gravarCadastro({
    env: { PADD_KV: kv }, escola: 'verde', professor: 'ana-paula', origem: 'painel',
    cadastro: { escolaNome: 'Escola Verde', professorEmail: 'ana@azul.com.br' },
  });
  const depois = JSON.parse(kv.dados.get('professores/ana-paula/contato') || '{}');
  conferir('a segunda escola NÃO apaga o CPF que o professor já tinha',
    depois.cpf === '12345678901', depois);

  const semKv = await raizJs.gravarCadastro({ env: {}, escola: 'x', professor: 'y', cadastro: { professorEmail: 'a@b.com' } });
  conferir('sem KV, o desfecho DIZ que não guardou (não finge)',
    semKv.erros.length > 0 && /KV/.test(semKv.erros[0]), semKv.erros);
}

if (!correio) {
  conferir('existe o módulo do correio', false, 'não existe');
} else {
  const mensagem = correio.comporMensagem({
    cadastro: { escolaNome: 'Escola Azul', professorEmail: 'Ana@Azul.com.br', escolaEmail: 'escola@azul.com.br' },
    url: 'https://azul.padd.com.br',
  });
  conferir('a mensagem vai para o professor E para a escola',
    mensagem.para.join(',') === 'ana@azul.com.br,escola@azul.com.br', mensagem.para);
  conferir('…com o ENDEREÇO da escola — o mesmo que a tela mostra — no texto e no HTML',
    mensagem.texto.includes('https://azul.padd.com.br') && mensagem.html.includes('https://azul.padd.com.br'),
    null);
  conferir('…e sem a senha: ela não viaja por e-mail',
    !/senha\s*[:=]\s*\S/i.test(mensagem.texto) && /não a repetimos/.test(mensagem.texto), null);

  const mesmoEmail = correio.comporMensagem({
    cadastro: { escolaNome: 'X', professorEmail: 'igual@x.com', escolaEmail: 'IGUAL@x.com' },
    url: 'https://x.padd.com.br',
  });
  conferir('o mesmo e-mail nos dois campos dispara UM só (era o pedido dela)',
    mesmoEmail.para.length === 1 && mesmoEmail.para[0] === 'igual@x.com', mesmoEmail.para);

  const semEndereco = correio.comporMensagem({
    cadastro: { escolaNome: 'X', professorEmail: 'a@b.com' }, dominio: { ok: false, erro: 'dns' },
  });
  conferir('sem endereço próprio, a mensagem não inventa um link morto',
    semEndereco.endereco === '' && !/https?:\/\/[a-z0-9.-]+\.padd/.test(semEndereco.texto), semEndereco.endereco);

  /* O ENVIO, com um Resend de bolso: mede o pedido, a deduplicação e os dois desfechos. */
  const pedidos = [];
  const fetchFalso = async (url, opcoes) => {
    pedidos.push({ url: String(url), corpo: JSON.parse((opcoes && opcoes.body) || '{}'),
      autorizacao: (opcoes && opcoes.headers && opcoes.headers.Authorization) || null });
    return new Response(JSON.stringify({ id: 'msg-1' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const enviado = await correio.enviar({ mensagem, chave: 're_teste', de: 'Lastro <l@padd.com.br>', fetchImpl: fetchFalso });
  conferir('com chave, o envio vai ao provedor certo, com o token e os destinatários',
    enviado.enviado === true && pedidos.length === 1 &&
    /api\.resend\.com\/emails$/.test(pedidos[0].url) &&
    pedidos[0].autorizacao === 'Bearer re_teste' &&
    pedidos[0].corpo.to.length === 2, pedidos[0] || enviado);

  const semChave = await correio.enviar({ mensagem, chave: '', fetchImpl: fetchFalso });
  conferir('sem chave, NÃO finge que enviou — diz o motivo e o que fazer',
    semChave.enviado === false && /RESEND_API_KEY/.test(semChave.motivo) && /wrangler secret/.test(semChave.dica || ''),
    semChave);

  const recusado = await correio.enviar({
    mensagem, chave: 're_teste',
    fetchImpl: async () => new Response(JSON.stringify({ message: 'domain not verified' }), { status: 403 }),
  });
  conferir('um provedor que recusa não vira excepção: o motivo viaja no desfecho',
    recusado.enviado === false && /403/.test(recusado.motivo) && /domain not verified/.test(recusado.detalhe || ''),
    recusado);

  const kvCaixa = kvDeBolso();
  const desfecho = await raizJs.mandarBoasVindas({
    env: { PADD_KV: kvCaixa },
    escola: 'azul',
    cadastro: { escolaNome: 'Escola Azul', professorEmail: 'ana@azul.com.br' },
    url: 'https://azul.padd.com.br',
  });
  const chaveDaCaixa = [...kvCaixa.dados.keys()].find((k) => /^bastidores\/azul\/correio\//.test(k));
  conferir('sem provedor, a mensagem fica na CAIXA DE SAÍDA do tenant (e não noutro prefixo)',
    desfecho.enviado === false && Boolean(chaveDaCaixa) && desfecho.caixa && desfecho.caixa.guardada === true,
    { desfecho, chaves: [...kvCaixa.dados.keys()] });
}

/* ==================================================== G. a página e o resto do sistema */

console.log('\nG. A página, a folha e o encaixe com o que já existia');
const htmlDaPagina = (() => { const a = path.join(raiz, 'raiz/index.html'); return fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : ''; })();
for (const campo of ['escola-cnpj', 'escola-email', 'escola-telefone', 'professor-nome',
  'professor-sobrenome', 'professor-cpf', 'professor-email', 'professor-telefone',
  'professor-modalidade']) {
  conferir('a página tem o campo «' + campo + '»', htmlDaPagina.includes('id="' + campo + '"'), null);
}
conferir('a página pede a lista de habilidades ao Worker (uma fonte, não uma cópia)',
  /fetch\("api\/pagina"\)/.test(htmlDaPagina), null);
conferir('…e o pedido de criação leva o cadastro', /cnpj: v\("escola-cnpj"\)/.test(htmlDaPagina) &&
  /modalidade: doZero \? v\("professor-modalidade"\)/.test(htmlDaPagina), null);

const folha = (() => { const a = path.join(raiz, 'tools/templates/ciclo.css'); return fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : ''; })();
conferir('a folha esconde as peças do painel na página pública',
  /\[data-pagina="publica"\]\s*\[data-dono\]\s*\{\s*display:\s*none/.test(folha), null);
const copiaDaRaiz = (() => { const a = path.join(raiz, 'raiz/assets/style.css'); return fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : ''; })();
conferir('…e a cópia da raiz é a mesma folha (byte a byte)',
  copiaDaRaiz === folha, null);

/* O ENCAIXE COM O QUE JÁ EXISTIA — e é o que ela pediu com todas as letras: «independente de por
 * onde for criada a escola, os meus botões aqui […] têm que continuar funcionando». A escola criada
 * pelo público nasce no MESMO registo que o painel lê: o KV e o `indice.json` do repositório. */
conferir('as rotas do painel continuam declaradas no Worker',
  fs.readFileSync(path.join(raiz, 'motor/servidor/raiz.js'), 'utf8').includes("url.pathname === '/api/escolas'"),
  null);
const fluxo = (() => { const a = path.join(raiz, '.github/workflows/criar-escola.yml'); return fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : ''; })();
conferir('o workflow aceita a habilidade declarada e a passa ao scaffolder',
  /^\s+modalidade:/m.test(fluxo) && /--modalidade/.test(fluxo), null);
const scaffolder = (() => { const a = path.join(raiz, 'tools/criar-escola.sh'); return fs.existsSync(a) ? fs.readFileSync(a, 'utf8') : ''; })();
conferir('…e o scaffolder já sabia recebê-la (a criação não muda de forma)',
  /--modalidade\)/.test(scaffolder), null);

/* ===================================================== H. a página pública abre SEM lançar */

/* A LIÇÃO DE 25/11/2026, e ela custou uma tarde: o servidor retira a caixa do expurgo do HTML
 * público, mas o SCRIPT é o mesmo das duas páginas — e `document.getElementById("btn-apagar")`
 * sobre `null` lança. Um throw no TOPO do script mata tudo o que vem depois dele, e o que vinha
 * depois era invisível: nenhum botão desaparecia, nenhuma cor mudava, a página só ficava calada.
 *
 * A asserção «o HTML não tem `data-dono`» passava — o HTML estava certo. O que não se media era o
 * que a página FAZ ao abrir. Uma prova que lê o HTML sem executá-lo não vê este defeito. */
console.log('\nH. A página pública abre sem lançar');
{
  const { JSDOM, VirtualConsole } = require('jsdom');
  const servidor = carregar('motor/servidor/raiz.js');
  const remover = servidor && servidor.removerDoPainel;
  const marcar = servidor && servidor.marcarPagina;
  conferir('o servidor sabe retirar as peças do painel do que serve',
    typeof remover === 'function', null);
  conferir('…e sabe marcar qual das duas páginas está a servir',
    typeof marcar === 'function', null);
  /* A PÁGINA SERVIDA COMO O SERVIDOR A SERVE: marca primeiro, remoção depois — a ordem do
   * `servirAPagina`. Sem a marca, `jsdom` corria o script do PAINEL e a asserção seguinte media
   * outra página. */
  const publico = typeof remover === 'function' && typeof marcar === 'function'
    ? remover(marcar(htmlDaPagina, true))
    : htmlDaPagina;
  conferir('…e o HTML público fica sem nenhum ELEMENTO com `data-dono`',
    !/<[a-zA-Z][^>]*\sdata-dono\b[^>]*>/.test(publico), null);
  conferir('…e a marca da página viaja no `<html>`',
    /<html[^>]*\sdata-pagina="publica"/i.test(publico), null);

  const erros = [];
  const paciente = new VirtualConsole();
  paciente.on('jsdomError', (e) => erros.push(String((e && e.message) || e)));
  paciente.on('error', (m) => erros.push(String(m)));
  const dom = new JSDOM(publico, {
    runScripts: 'dangerously',
    url: 'https://lastro.padd.com.br/',
    virtualConsole: paciente,
    beforeParse(win) {
      win.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, planos: [], habilidades: [] }) });
    },
  });
  conferir('a página pública NÃO lança ao abrir — um throw no topo mataria o resto do script',
    erros.length === 0, erros);

  /* O PROFESSOR QUE JÁ EXISTE, NA PÁGINA PÚBLICA (25/11/2026). Ela apontou a falta com todas as
   * letras: «só tem uma opção aqui, um professor novo […] não tem a outra opção aqui. Você tirou.»
   * A opção volta — e sem lista, porque a lista de professores é o cadastro de clientes e não se
   * publica num endereço aberto. Quem sabe que o professor existe é quem preenche. */
  await new Promise((r) => setTimeout(r, 150));
  const d = dom.window.document;
  const opcao = d.getElementById('opcao-existente');
  const radio = d.getElementById('modo-existente');
  conferir('a opção «um professor que já existe» EXISTE na página pública', Boolean(opcao), null);
  conferir('…e está habilitada sem lista nenhuma — não espera por um `<select>` que não vem',
    Boolean(radio) && radio.disabled === false, radio ? radio.disabled : null);
  conferir('…o campo é o ESCRITO: o `<select>` do painel não viaja, o input viaja',
    !d.getElementById('professor-existente') && Boolean(d.getElementById('professor-existente-nome')), null);
  conferir('…e o campo escrito está à vista (não nasce escondido no público)',
    Boolean(d.getElementById('campo-existente-nome')) && d.getElementById('campo-existente-nome').hidden === false, null);
}

/* ==================================================================== o veredicto */

console.log('');
if (referencia) {
  console.log('CONTROLE NEGATIVO: ' + ok + ' passaram, ' + ko + ' falharam — o código de '
    + referencia + ' tem de reprovar as asserções desta funcionalidade.');
  console.log(ko > 0 ? 'CONTROLE CERTO — o código de antes reprova.' : 'A PROVA NÃO PROVA NADA.');
  process.exit(ko > 0 ? 0 : 1);
}
console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
  : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
process.exit(ko === 0 ? 0 : 1);

}

principal().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
