// Funcao HTTP. O formulario (tools/templates/lancamento.html) faz UM POST para
// /.netlify/functions/receber com { ciclo, arquivos: [{ nome, texto, tipo }] } — os dados do
// ciclo primeiro, o indice (ciclos.json) por ultimo.
//
// O TEXTO DOS DADOS E JSON EM CLARO: o cliente decifra o envelope com a senha da escola
// (lerDadosDoCiclo) e envia o resultado, nao o `_cifrado`. A Function trata o texto como OPACO
// e grava verbatim — nao cifra, nao decifra e nao tem a senha. Quem cifra e o
// tools/gerar-ciclo.sh (tools/cifrar-dados.js) na proxima geracao do pacote: o store e o cofre,
// o pacote e a vitrine.
//
// O NOME DE CADA ARQUIVO VEM DO CLIENTE e e gravado como veio: o carimbo do cliente e
// `2026-09-20T1430` (hora local, sem segundos) e `nomeNovo()` ja garante que o nome cresca e
// ordene na ordem da gravacao, minuto a minuto, sem sobrescrever. A Function NAO inventa
// nome nem carimbo — se inventasse, quebraria a monotonicidade que o cliente garante.
//
// Resposta: o cliente exige corpo JSON com `ok` truthy e, na falha, le `dados.erro` e MANTEM
// os campos na tela. Por isso falha de negocio responde HTTP 200 + { ok:false, erro } —
// nunca 5xx (o cliente trocaria a mensagem util por "HTTP 500").

const { getStore } = require('@netlify/blobs');

const STORE = 'lancamentos';
const CABECALHOS = { 'Content-Type': 'application/json;charset=utf-8' };

const responder = (codigo, corpo) => ({ statusCode: codigo, headers: CABECALHOS, body: JSON.stringify(corpo) });
const recusar = (erro) => responder(200, { ok: false, erro }); // erro de negocio

const basename = (nome) => String(nome).split(/[\\/]/).pop();

// O NOME DO ARQUIVO DE DADOS TEM DUAS FORMAS, e as duas chegam aqui:
//   ciclo-01-duo-dados.json                   — o pacote recem-gerado, ainda sem lancamento
//   ciclo-01-duo-dados-2026-10-07T1900.json   — o lancamento, com o carimbo do cliente
// O carimbo de `carimboArquivo()` e `AAAA-MM-DDTHHMM` (hora local, sem segundos), e ele fica
// ENTRE `dados` e `.json`. Ancorar o `.json` no fim (`/-dados\.json$/`) casa a primeira forma
// e RECUSA a segunda — que e a unica que o formulario envia.
const RE_DADOS = /-dados(-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4})?\.json$/;

const slugDe = (indice, dados) => {
  const c = (indice && indice.ciclos && indice.ciclos[0]) || {};
  if (c.professor) return String(c.professor);
  if (dados && dados.professor) return String(dados.professor);
  const m = /^ciclo-\d+-([a-z0-9]+)-dados/.exec(basename(c.arquivo || (dados && dados.escola) || ''));
  return (m && m[1]) || null;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') return responder(200, { ok: true, receber: 'pronto' });
  if (event.httpMethod !== 'POST') return recusar('esperado POST');

  let corpo;
  try {
    const cru = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
    corpo = JSON.parse(cru);
  } catch { return recusar('corpo nao e JSON'); }

  const arquivos = Array.isArray(corpo.arquivos) ? corpo.arquivos : null;
  if (!arquivos || !arquivos.length) return recusar('nenhum arquivo no pedido');
  for (const a of arquivos) {
    if (!a || typeof a.texto !== 'string' || !a.nome) return recusar('arquivo sem nome ou sem texto');
    try { JSON.parse(a.texto); } catch { return recusar('o texto de ' + basename(a.nome) + ' nao e JSON'); }
  }
  const dadosDe = arquivos.find((a) => RE_DADOS.test(basename(a.nome)));
  const indiceDe = arquivos.find((a) => basename(a.nome) === 'ciclos.json');
  if (!dadosDe || !indiceDe) return recusar('faltou o arquivo de dados ou o ciclos.json');

  let dados, indice;
  try { dados = JSON.parse(dadosDe.texto); indice = JSON.parse(indiceDe.texto); } catch { return recusar('nao consegui ler o JSON'); }

  const professor = slugDe(indice, dados);
  const escola = (indice.ciclos[0] || {}).escola || dados.escola || 'escola';
  const ciclo = String(corpo.ciclo || (indice.ciclos[0] || {}).id || '01').padStart(2, '0');
  const carimbo = /(\d{4}-\d{2}-\d{2}T\d{4})/.exec(basename(dadosDe.nome)); // do NOME do cliente
  const chave = professor + '/' + ciclo + '-' + (carimbo ? carimbo[1] : basename(dadosDe.nome).replace(/\.json$/, ''));

  let store;
  try { store = getStore(STORE, { consistency: 'strong' }); }
  catch (err) { return recusar('o lancamento nao pode ser guardado agora' + (err && err.name ? ' (' + err.name + ')' : '')); }

  const escritos = [];
  for (const a of [dadosDe, indiceDe]) {
    try {
      const r = await store.set(chave + '/' + basename(a.nome), a.texto, { onlyIfNew: true });
      if (!r || r.modified === false) return recusar('ja existe um lancamento com este carimbo: ' + a.nome);
      escritos.push(a.nome);
    } catch (err) {
      return responder(200, { ok: false, erro: 'falhou ao guardar ' + a.nome + (err && err.message ? ': ' + err.message : ''), escritos });
    }
  }
  return responder(200, { ok: true, professor, escola, ciclo, escritos });
};
