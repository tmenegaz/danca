// Worker HTTP. Porte de netlify/functions/receber.js (apagado nesta migracao) para Cloudflare
// Workers + KV. O contrato e o mesmo, e ele esta no formulario (tools/templates/lancamento.html):
// UM POST para /api/receber com { ciclo, arquivos: [{ nome, texto, tipo }] } — os dados do
// ciclo primeiro, o indice (ciclos.json) por ultimo.
//
// O TEXTO DOS DADOS E JSON EM CLARO: o cliente decifra o envelope com a senha da escola
// (lerDadosDoCiclo) e envia o resultado, nao o `_cifrado`. O Worker trata o texto como OPACO
// e grava verbatim — nao cifra, nao decifra e nao tem a senha. Quem cifra e o
// tools/gerar-ciclo.sh (tools/cifrar-dados.js) na proxima geracao do pacote: o store e o cofre,
// o pacote e a vitrine.
//
// O NOME DE CADA ARQUIVO VEM DO CLIENTE e e gravado como veio: o carimbo do cliente e
// `2026-09-20T1430` (hora local, sem segundos) e `nomeNovo()` ja garante que o nome cresca e
// ordene na ordem da gravacao, minuto a minuto, sem sobrescrever. O Worker NAO inventa
// nome nem carimbo — se inventasse, quebraria a monotonicidade que o cliente garante.
//
// Resposta: o cliente exige corpo JSON com `ok` truthy e, na falha, le `dados.erro` e MANTEM
// os campos na tela. Por isso falha de negocio responde HTTP 200 + { ok:false, erro } —
// nunca 5xx (o cliente trocaria a mensagem util por "HTTP 500").

// Uma rota atende o POST. O caminho antigo (`/.netlify/functions/receber`) NAO e mantido como
// alias: nenhum pacote chegou a ser publicado no Netlify, entao nao ha formulario no ar apontando
// para la — o que existia especificamente para o Netlify saiu nesta migracao.
const ROTAS_API = ['/api/receber'];

const CABECALHOS = { 'Content-Type': 'application/json;charset=utf-8' };

const responder = (codigo, corpo) => new Response(JSON.stringify(corpo), { status: codigo, headers: CABECALHOS });
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

// ONDE MUDOU (1 de 2) — o prefixo da escola na chave.
// No Netlify, cada escola era um site com o seu proprio store `lancamentos`: o escopo por
// escola era implicito. Agora ha UM namespace KV (`ciclos-escolas`, binding PADD_KV) para
// todas as escolas, e sem o prefixo o `ciclo-01` de uma escola sobrescreveria o de outra.
// O escopo passa a ser explicito como primeiro segmento da chave.
const prefixoDaEscola = (escola) => String(escola)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'escola';

export default {
  async fetch(request, env) {
    const rota = new URL(request.url).pathname;
    if (!ROTAS_API.includes(rota)) {
      // O roteador de assets do Cloudflare serve o pacote estatico ANTES de chamar o Worker
      // (o default e asset-first), entao um asset existente nunca chega aqui. Este ramo cobre
      // o caso de a rota ser invertida (`assets.run_worker_first`) e devolve o mesmo 404.
      if (env.ASSETS && typeof env.ASSETS.fetch === 'function') return env.ASSETS.fetch(request);
      return responder(404, { ok: false, erro: 'nao encontrado' });
    }

    if (request.method === 'GET') return responder(200, { ok: true, receber: 'pronto' });
    if (request.method !== 'POST') return recusar('esperado POST');

    let corpo;
    try {
      corpo = JSON.parse(await request.text());
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
    const chave = prefixoDaEscola(escola) + '/' + professor + '/' + ciclo + '-' + (carimbo ? carimbo[1] : basename(dadosDe.nome).replace(/\.json$/, ''));

    let store;
    try {
      store = env && env.PADD_KV;
      // No Netlify, `getStore()` falhava quando o ambiente de Blobs nao estava configurado.
      // No Workers o binding chega pronto (ou nao chega) em `env`; a checagem recria a mesma
      // falha para que a mensagem de recusa continue identica.
      if (!store || typeof store.put !== 'function' || typeof store.get !== 'function') {
        const err = new Error('binding PADD_KV ausente');
        err.name = 'MissingBinding';
        throw err;
      }
    } catch (err) { return recusar('o lancamento nao pode ser guardado agora' + (err && err.name ? ' (' + err.name + ')' : '')); }

    const escritos = [];
    for (const a of [dadosDe, indiceDe]) {
      const alvo = chave + '/' + basename(a.nome);
      try {
        // ONDE MUDOU (2 de 2) — o `onlyIfNew` do Blobs e a consistencia forte.
        // O KV nao tem `onlyIfNew`, entao a existencia e conferida antes de gravar. A garantia
        // e a mesma no caso comum, mas NAO e atomica: o KV nao tem transacao, e dois POSTs
        // simultaneos com o MESMO carimbo ainda poderiam gravar os dois — a janela e a de um
        // duplo clique. Se virar problema, o caminho e prefixar a chave com o carimbo, nao
        // tentar um lock.
        // O KV tambem nao tem `{ consistency: 'strong' }`: reler imediatamente apos gravar pode
        // devolver a versao anterior por ate ~60s. Nada aqui depende disso (a checagem acima
        // PROIBE sobrescrever em vez de atualizar), mas a consolidacao futura dos lancamentos de
        // volta para o repositorio precisa contar com essa demora.
        if ((await store.get(alvo)) !== null) return recusar('ja existe um lancamento com este carimbo: ' + a.nome);
        await store.put(alvo, a.texto);
        escritos.push(a.nome);
      } catch (err) {
        return responder(200, { ok: false, erro: 'falhou ao guardar ' + a.nome + (err && err.message ? ': ' + err.message : ''), escritos });
      }
    }
    return responder(200, { ok: true, professor, escola, ciclo, escritos });
  },
};

// O cofre NAO e servido por GET: o texto guardado esta em CLARO. Ler o que foi lancado e pela
// rota do cofre no painel do Cloudflare ou por `npx wrangler kv key get --binding PADD_KV <chave>`.
