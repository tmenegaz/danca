'use strict';

/**
 * github-api.js — OS CABEÇALHOS DO GITHUB, NUM SÍTIO SÓ (05/11/2026).
 *
 * PORQUE ESTE MÓDULO EXISTE, e a história é de três sessões.
 *
 * O GitHub **recusa com 403** toda a requisição feita à API sem cabeçalho `User-Agent`
 * («Request forbidden by administrative rules. Please make sure your request has a User-Agent
 * header»). O `fetch` do runtime dos Workers **não o preenche sozinho** — o `undici` do Node
 * preenche, e é por isso que o defeito nunca aparece numa prova local. Medido a 05/11/2026:
 *
 *     GET /repos/tmenegaz/danca/git/trees/main?recursive=1    com User-Agent → 200
 *     GET /repos/tmenegaz/danca/git/trees/main?recursive=1    sem User-Agent → 403
 *
 * Aconteceu três vezes. Em 22/10/2026 em `repo-escola.js` («cabeçalhos montados à mão, sem o
 * `User-Agent`», e o comentário ficou lá a avisar); em 05/11/2026 outra vez, no mesmo ficheiro,
 * no caminho da escrita; e em 05/11/2026 uma terceira, em `linhas-de-base-repo.js` — o módulo
 * novo da linha de base, escrito POR MIM no mesmo dia, com `Accept` e `X-GitHub-Api-Version` e
 * sem o `User-Agent`. O sintoma foi lido ao contrário: durante uma tarde inteira se concluiu que
 * «a árvore do repositório é que é recusada, o `/contents/` funciona» — quando o token nunca
 * esteve em causa e ambas as chamadas falhavam pela mesma razão.
 *
 * A LIÇÃO NÃO É «ACRESCENTAR O CABEÇALHO» — é que havia **doze cópias** da lista de cabeçalhos
 * espalhadas por `motor/servidor/`, e cada módulo novo é uma oportunidade de nascer sem ele. Este
 * ficheiro é a lista única; `tools/check-github-headers.js` reprova quem voltar a montá-la à mão.
 *
 * O QUE ELE NÃO FAZ: não conhece repositório, ramo, escola nem família de arquivos. Só fala com
 * a API — endereço base, cabeçalhos, base64 e o motivo de uma recusa.
 */

const API_VERSAO = '2022-11-28';
const ACEITE = 'application/vnd.github+json';
const RAIZ = 'https://api.github.com';

/**
 * O AGENTE. `danca-worker` é o mesmo que os outros módulos usam; o nome não é contrato com
 * ninguém, mas é o que aparece nos registos do GitHub quando algo falha, e por isso vale ser
 * constante em vez de inventado por chamada.
 */
const AGENTE = 'danca-worker';

/**
 * Cabecalhos da API. `token` vazio NÃO é erro aqui — um leitor sem token ainda pode tentar (e
 * recebe 401 do GitHub, que é a resposta certa). Quem exige token é quem escreve.
 *
 * `agente` permite o nome próprio de cada módulo (`danca-verbete`, `danca-vocabulario`), porque
 * esses já existiam e distinguem-se nos registos.
 */
function cabecalhosDe(token, { agente, conteudo } = {}) {
  const h = {
    'Accept': ACEITE,
    'X-GitHub-Api-Version': API_VERSAO,
    // O CABEÇALHO QUE FALTAVA. Sem ele não há leitura, não há escrita e não há árvore — só 403.
    'User-Agent': agente || AGENTE,
  };
  if (token) h.Authorization = 'Bearer ' + token;
  if (conteudo) h['Content-Type'] = 'application/json';
  return h;
}

/** Base64 em UTF-8 SEM `Buffer` (ausente no runtime dos Workers). */
function base64De(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function textoDeBase64(base64) {
  const bin = atob(String(base64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * O MOTIVO DE UMA RECUSA, dito por quem a deu.
 *
 * **ESTE É O SEGUNDO DEFEITO QUE ESTE MÓDULO CORRIGE.** Os módulos escreviam
 * `'HTTP ' + r.status` — e `Response` não tem a propriedade `.texto`; tem o método `.text()`, que
 * ninguém chamava. O resultado era uma mensagem que dizia o número e escondia a frase: «leitura do
 * sha: HTTP 403» em vez de «…: Request forbidden by administrative rules. Please make sure your
 * request has a User-Agent header». Um número sem frase custou uma tarde de diagnóstico errado.
 *
 * Aceita as duas formas que circulam no repositório: uma `Response` (com `text()`) e os stubs das
 * provas (com `texto`). Trunca, porque um corpo de erro do GitHub pode ser longo e o que interessa
 * está no princípio.
 */
async function detalheDe(resposta, limite = 240) {
  if (!resposta) return 'sem resposta';
  const numero = resposta.status ? 'HTTP ' + resposta.status : 'sem resposta do GitHub';
  let corpo = '';
  try {
    if (typeof resposta.texto === 'string') corpo = resposta.texto;
    else if (typeof resposta.text === 'function') corpo = await resposta.text();
    else if (typeof resposta.json === 'function') {
      const dados = await resposta.json();
      corpo = dados && dados.message ? String(dados.message) : (dados ? JSON.stringify(dados) : '');
    }
  } catch (erro) { corpo = ''; }
  /* O corpo pode ser JSON: extrai-se a `message`, que é a frase útil. */
  if (corpo && corpo.trim().startsWith('{')) {
    try {
      const dados = JSON.parse(corpo);
      if (dados && dados.message) corpo = String(dados.message);
    } catch (erro) { /* fica o corpo como veio */ }
  }
  const frase = String(corpo || '').replace(/\s+/g, ' ').trim().slice(0, limite);
  return frase ? numero + ' — ' + frase : numero;
}

/**
 * AS SONDAS. Uma leitura por sítio que já falhou, para o operador saber **onde** está o defeito
 * sem tocar na página: credencial, caminho, ou cabeçalho.
 *
 * Isto existe porque o diagnóstico de 05/11/2026 foi feito por dedução («o `/contents/` funciona,
 * a árvore não») e a dedução estava errada. Uma sonda que devolve o status e a FRASE de cada
 * chamada não se engana.
 */
async function sondar({ token, dono, repo, ref, escola, caminhos, fetchImpl } = {}) {
  const f = fetchImpl || fetch;
  const base = RAIZ + '/repos/' + dono + '/' + repo;
  const cabecalhos = cabecalhosDe(token);
  const ramo = ref || 'main';
  const provas = [];

  async function provar(nome, url, opcoes) {
    const r = await f(url, opcoes);
    provas.push({
      nome,
      metodo: (opcoes && opcoes.method) || 'GET',
      url: url.replace(RAIZ, ''),
      status: r.status,
      ok: Boolean(r.ok),
      detalhe: await detalheDe(r),
      // O QUE SOBRA DA COTA — a outra causa de 403 que se confunde com esta.
      restante: (r.headers && r.headers.get && r.headers.get('x-ratelimit-remaining')) || null,
      recomecar: (r.headers && r.headers.get && r.headers.get('retry-after')) || null,
    });
    return provas[provas.length - 1];
  }

  await provar('repositório', base, { method: 'GET', headers: cabecalhos });
  await provar('árvore', base + '/git/trees/' + encodeURIComponent(ramo) + '?recursive=1',
    { method: 'GET', headers: cabecalhos });
  for (const caminho of (caminhos || [])) {
    await provar('conteúdo: ' + caminho,
      base + '/contents/' + String(caminho).replace(/^\/+/, '')
        + '?ref=' + encodeURIComponent(ramo),
      { method: 'GET', headers: cabecalhos });
  }
  return {
    dono, repo, ramo, escola: escola || null,
    // A leitura do diagnóstico é ela mesma um sinal: com o cabeçalho certo, `conteúdo` 404 quer
    // dizer «o arquivo não existe» e 200 «existe». Sem o cabeçalho, ambos são 403.
    provas,
  };
}

module.exports = {
  API_VERSAO,
  ACEITE,
  RAIZ,
  AGENTE,
  cabecalhosDe,
  base64De,
  textoDeBase64,
  detalheDe,
  sondar,
};
