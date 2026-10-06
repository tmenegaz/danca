// Worker HTTP. Porte de netlify/functions/receber.js (apagado nesta migracao) para Cloudflare
// Workers + KV. Dois contratos vivem aqui, e eles NAO tratam o texto do mesmo modo:
//
// (1) POST /api/receber — o lancamento da aula. Contrato no formulario
// (tools/templates/lancamento.html): UM POST com { ciclo, arquivos: [{ nome, texto, tipo }] } —
// os dados do ciclo primeiro, o indice (ciclos.json) por ultimo.
// O TEXTO DOS DADOS E JSON EM CLARO: o cliente decifra o envelope com a senha da escola
// (lerDadosDoCiclo) e envia o resultado, nao o `_cifrado`. O Worker trata o texto como OPACO
// e grava verbatim — nao cifra, nao decifra e nao tem a senha. Quem cifra e o
// tools/gerar-ciclo.sh (tools/cifrar-dados.js) na proxima geracao do pacote: o store e o cofre,
// o pacote e a vitrine.
//
// (2) /api/anamnese — o envelope da anamnese, `POST` para gravar e `GET` para ler. Aqui e o
// CLIENTE que cifra, antes de subir: o corpo traz o involucro `_cifrado` {algoritmo, iteracoes,
// endereco} e o `contexto` (escola, professor, ciclo, carimbo) EM CLARO. O Worker grava os dois
// como vieram. O `contexto` fica em claro de proposito — nao e segredo e e ele que monta a chave
// do cofre; as respostas da aluna sao TODAS clinicas e vivem dentro do `_cifrado`. O carimbo
// viaja FORA do `_cifrado` porque nasce no relogio do motor e este Worker nao tem a senha para
// o ler. Por isso, e so aqui, o cofre TEM leitura por GET: o que sai e cifra, nunca resposta.
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

// A leitura da anamnese devolve o texto GUARDADO, byte a byte. O cliente decifra-o e compara-o
// com o envelope que gravou; reserializar mudaria o que se compara.
const responderTexto = (codigo, texto) => new Response(texto, { status: codigo, headers: CABECALHOS });

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

// As duas familias de chave comecam igual e divergem depois do ciclo:
//   lancamento  <prefixoDaEscola>/<professor>/<ciclo>-<carimbo>/<nome>
//   anamnese    <prefixoDaEscola>/<professor>/<ciclo>/anamnese/<carimbo>
// O prefixo da escola vem primeiro para que o cofre de UMA escola se leia com `list({prefix})`
// sem varrer as chaves das outras; o literal `anamnese` e o que separa as duas no mesmo namespace.
const raizDaChave = (escola, professor) => prefixoDaEscola(escola) + '/' + professor;

// O segmento da chave nao pode ser vazio, `.`/`..` nem conter barra. Na anamnese, `escola`,
// `professor` e `ciclo` chegam do seletor do cliente — de fora do Worker — e a chave e montada
// por concatenacao: sem esta checagem, um `professor` com `../..` escreveria fora da familia da
// escola. (`prefixoDaEscola()` ja garante isso para o primeiro segmento.)
const segmento = (valor) => {
  const s = String(valor == null ? '' : valor).trim();
  return !s || s === '.' || s === '..' || /[\\/]/.test(s) ? null : s;
};

// O ciclo entra na chave com dois digitos, como o formulario de lancamento ja o escreve.
const cicloDaChave = (valor) => { const s = segmento(valor); return s && s.padStart(2, '0'); };

// A guarda de binding das duas rotas. No Netlify, `getStore()` falhava quando o ambiente de
// Blobs nao estava configurado. No Workers o binding chega pronto (ou nao chega) em `env`; a
// checagem recria a mesma falha para que a mensagem de recusa continue identica.
const cofre = (env) => {
  const store = env && env.PADD_KV;
  if (!store || typeof store.put !== 'function' || typeof store.get !== 'function') {
    const err = new Error('binding PADD_KV ausente');
    err.name = 'MissingBinding';
    throw err;
  }
  return store;
};

// As rotas da anamnese. O envelope e montado no MOTOR (`POST /api/elicitar`) e CIFRADO NO
// NAVEGADOR, com a senha da escola: o que chega aqui e o involucro `_cifrado`
// ({ algoritmo, iteracoes, endereco } — a mesma forma que o `tools/cifrar-dados.js` publica).
// O Worker NAO tem a senha: grava o involucro como veio e devolve-o como veio. E o que torna a
// anamnese legivel por GET — o que sai do cofre e cifra, nunca resposta de aluna.
//
// O carimbo viaja FORA do `_cifrado`, no `contexto`: ele nasce no relogio do motor e vive dentro
// do texto cifrado, entao o Worker nao o pode ler sem a senha. A chave e montada do `contexto`.
const CARIMBO = /^[a-z0-9][a-z0-9-]*$/; // o mesmo formato do `id` das rotas de leitura do motor

// Devolve `null` quando falta segmento ou o formato esta errado: quem chama e que diz o que faltou.
const chaveDaAnamnese = (contexto) => {
  const c = contexto || {};
  const escola = segmento(c.escola);
  const professor = segmento(c.professor);
  const ciclo = cicloDaChave(c.ciclo);
  const carimbo = segmento(c.carimbo);
  if (!escola || !professor || !ciclo || !carimbo || !CARIMBO.test(carimbo)) return null;
  return raizDaChave(escola, professor) + '/' + ciclo + '/anamnese/' + carimbo;
};

// O segmento da rota chega escapado da URL: um `%` solto faria o `decodeURIComponent` lancar.
const semEscape = (texto) => { try { return decodeURIComponent(texto); } catch { return null; } };

const tratarAnamnese = async (request, env, url) => {
  const sufixo = url.pathname.slice('/api/anamnese'.length).replace(/^\//, '');

  if (request.method === 'POST') {
    if (sufixo) return recusar('POST /api/anamnese nao leva carimbo na rota');

    let corpo;
    try { corpo = JSON.parse(await request.text()); } catch { return recusar('corpo nao e JSON'); }
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return recusar('o corpo precisa ser um objeto com `contexto` e `_cifrado`');

    const chave = chaveDaAnamnese(corpo.contexto);
    if (!chave) return recusar('contexto incompleto: precisa de escola, professor, ciclo e carimbo (sem barra, `.` ou `..`)');

    const cifrado = corpo._cifrado || corpo.cifrado;
    if (!cifrado || typeof cifrado !== 'object'
      || typeof cifrado.algoritmo !== 'string' || !cifrado.algoritmo
      || typeof cifrado.endereco !== 'string' || !cifrado.endereco) {
      return recusar('faltou o involucro `_cifrado` (o que sai do Cifra.cifrarSync: algoritmo, iteracoes e endereco)');
    }

    let store;
    try { store = cofre(env); }
    catch (err) { return recusar('a anamnese nao pode ser guardada agora' + (err && err.name ? ' (' + err.name + ')' : '')); }

    // O contexto fica EM CLARO de proposito, como os `apelidos` do `tools/cifrar-dados.js`: nao
    // e segredo (o apelido ja e publicado no `po-01.json`) e e ele que discrime o registo dentro
    // do envelope. As respostas da aluna sao TODAS clinicas e vivem, essas, dentro do `_cifrado`.
    const guardado = {
      _cifrado: cifrado,
      contexto: corpo.contexto,
      _nota: 'O envelope da anamnese, CIFRADO no navegador com a senha da escola (tools/lib-cifra.js). O cofre guarda o involucro; quem decifra e o formulario, com a senha, no navegador.',
    };

    try {
      // Mesma garantia do lancamento, e a mesma ressalva: `get` antes do `put`, sem transacao —
      // a janela e a de um duplo clique, e o carimbo do motor ja e unico por minuto.
      if ((await store.get(chave)) !== null) return recusar('ja existe uma anamnese com este carimbo: ' + corpo.contexto.carimbo);
      await store.put(chave, JSON.stringify(guardado, null, 2) + '\n');
    } catch (err) {
      return responder(200, { ok: false, erro: 'falhou ao guardar a anamnese' + (err && err.message ? ': ' + err.message : '') });
    }
    return responder(200, { ok: true, chave, carimbo: corpo.contexto.carimbo });
  }

  if (request.method !== 'GET') return recusar('esperado POST ou GET');

  let store;
  try { store = cofre(env); }
  catch (err) { return recusar('a anamnese nao pode ser lida agora' + (err && err.name ? ' (' + err.name + ')' : '')); }

  // GET /api/anamnese/<carimbo>?escola=&professor=&ciclo= — a chave monta-se do contexto, como no
  // POST: sem `escola` e `professor` nao ha prefixo, e varrer o namespace traria a anamnese de
  // OUTRA escola (o prefixo da escola existe exatamente para isso).
  if (sufixo) {
    const carimbo = semEscape(sufixo);
    if (!carimbo || !CARIMBO.test(carimbo)) return recusar('carimbo invalido: ' + sufixo);

    const chave = chaveDaAnamnese({
      escola: url.searchParams.get('escola'),
      professor: url.searchParams.get('professor'),
      ciclo: url.searchParams.get('ciclo'),
      carimbo,
    });
    if (!chave) return recusar('a leitura precisa de ?escola=&professor=&ciclo=');

    let texto;
    try { texto = await store.get(chave); }
    catch (err) { return recusar('falhou ao ler a anamnese' + (err && err.message ? ': ' + err.message : '')); }
    if (texto === null || texto === undefined) return recusar('anamnese nao encontrada: ' + carimbo);
    return responderTexto(200, texto);
  }

  // GET /api/anamnese?escola=&professor=&ciclo= — a lista da familia, na forma das rotas de
  // leitura do motor (`/api/envelopes`): o prefixo em `pasta` e os nomes relativos a ele. A
  // diferenca e deliberada — os nomes sao carimbos, sem `.json`, porque a chave do KV nao tem
  // extensao. Nada aqui devolve o texto guardado.
  const escola = segmento(url.searchParams.get('escola'));
  const professor = segmento(url.searchParams.get('professor'));
  const ciclo = cicloDaChave(url.searchParams.get('ciclo'));
  if (!escola || !professor || !ciclo) return recusar('a lista precisa de ?escola=&professor=&ciclo=');
  const prefixo = raizDaChave(escola, professor) + '/' + ciclo + '/anamnese/';

  // Um binding sem `list` rende lista vazia COM aviso, em vez de estourar: a gravacao e a leitura
  // por carimbo nao dependem dele.
  if (typeof store.list !== 'function') return responder(200, { ok: true, pasta: prefixo, anamneses: [], aviso: 'o binding nao suporta list' });

  const anamneses = [];
  try {
    let cursor;
    for (let volta = 0; volta < 10; volta++) {
      const pagina = await store.list({ prefix: prefixo, cursor });
      for (const k of (pagina && pagina.keys) || []) anamneses.push(String(k.name).slice(prefixo.length));
      if (!pagina || pagina.list_complete || !pagina.cursor) break;
      cursor = pagina.cursor;
    }
  } catch (err) {
    return recusar('falhou ao listar as anamneses' + (err && err.message ? ': ' + err.message : ''));
  }
  anamneses.sort();
  return responder(200, { ok: true, pasta: prefixo, anamneses });
};

// Rotas que o Worker atende por conta propria (gravam no KV). As DEMAIS `/api/*` sao repassadas
// ao motor Node quando `MOTOR` existe.
const ehAnamnese = (rota) => rota === '/api/anamnese' || rota.startsWith('/api/anamnese/');
const ehRotaPropria = (rota) => ROTAS_API.includes(rota) || ehAnamnese(rota);

// O MOTOR NAO ENTRA NO WORKER. O `experimentos/pe/porta/servidor.js` usa `fs` e `path` e o
// esbuild recusa empacotar (medido: 4 erros em `elicitar.js` e `validar.js`). Em vez de copiar
// as rotas para ca — o que daria DUAS implementacoes do mesmo contrato — o Worker so REPASSA.
// Sem `MOTOR` no `env` (producao) nao ha repasse: o resto do arquivo e o de antes.
//
// `new Request(alvo, request)` reusa metodo, cabecalhos e corpo do pedido original: montar o
// pedido de saida a mao consumiria o stream do corpo e o `fetch` seguinte receberia corpo vazio.
const repassar = (request, env) => {
  const url = new URL(request.url);
  return fetch(new Request(new URL(url.pathname + url.search, env.MOTOR), request));
};

export default {
  async fetch(request, env) {
    const rota = new URL(request.url).pathname;

    // Ordem de despacho: (1) `/api/receber`; (2) `/api/anamnese`; (3) demais `/api/*` → motor;
    // (4) o resto → assets.
    if (env.MOTOR && rota.startsWith('/api/') && !ehRotaPropria(rota)) return repassar(request, env);

    // (2) a anamnese grava e le no MESMO cofre, sem depender do motor: em producao nao ha
    // `MOTOR`, e a anamnese continua a funcionar. So o `/api/elicitar` (montagem do envelope)
    // e que passa pelo motor.
    if (ehAnamnese(rota)) return tratarAnamnese(request, env, new URL(request.url));

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
    const chave = raizDaChave(escola, professor) + '/' + cicloDaChave(ciclo) + '-' + (carimbo ? carimbo[1] : basename(dadosDe.nome).replace(/\.json$/, ''));

    let store;
    try { store = cofre(env); }
    catch (err) { return recusar('o lancamento nao pode ser guardado agora' + (err && err.name ? ' (' + err.name + ')' : '')); }

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

// O LANCAMENTO NAO e servido por GET: o texto guardado esta em CLARO. Ler o que foi lancado e
// pela rota do cofre no painel do Cloudflare ou por
// `npx wrangler kv key get --binding PADD_KV <chave>`.
//
// A ANAMNESE e o contrario, e por desenho: o que o cofre guarda dela e o involucro `_cifrado`,
// nunca resposta de aluna em claro. Por isso ela TEM leitura por GET — `GET /api/anamnese` (a
// lista de carimbos da familia) e `GET /api/anamnese/<carimbo>?escola=&professor=&ciclo=` (o
// `_cifrado` verbatim). Quem decifra e o formulario, no navegador, com a senha da escola — que
// o Worker nunca ve.
