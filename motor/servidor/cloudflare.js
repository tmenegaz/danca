'use strict';

/**
 * cloudflare.js — a PONTE Cloudflare (Worker) para o servidor agnóstico.
 *
 * O `fetch` do Worker: monta os adaptadores a partir de `env` (ASSETS para o
 * conteúdo e para os estáticos, PADD_KV para os envelopes) e despacha no MESMO
 * roteador de rotas.js que o Node usa. As rotas são as mesmas; o que muda é só
 * o armazenamento, o transporte e o serviço de estáticos.
 *
 * O repositório é CommonJS (sem `"type": "module"`), então este módulo exporta
 * `fetch` por `module.exports`. O ENTRY do Worker é um shim de três linhas:
 *
 *   import { fetch } from './servidor/cloudflare.js';
 *   export default { fetch };
 *
 * O esbuild do wrangler empacota o `require` dos módulos CommonJS — é a mesma
 * ponte que o Node usa, sem reescrever nenhuma rota.
 */

const { criarRotas } = require('./rotas.js');
const { criarCloudflare } = require('../adaptadores/cloudflare.js');
const { criarDisparador } = require('./disparar.js');
const { criarEscritorDePO } = require('./escrever-po.js');
const { criarEscritorDePlano } = require('./escrever-plano.js');
const { criarEscritorDeCiclo } = require('./escrever-ciclo.js');
const { criarLeitorDeDados } = require('./ler-dados.js');
const { cifrarTexto } = require('./cifrar-envelope.js');
const { senhaDaEscolaOk } = require('./bastidores.js');
const { derivarPO } = require('../nucleo/derivar-po.js');
const fichaHtml = require('../nucleo/ficha-html.js');

/*
 * O FUSO PADRÃO do carimbo. O Worker roda em **UTC**: sem isto, a data que a estante mostra
 * vem 3 h à frente do relógio de quem preencheu a ficha (medido em 16/10/2026: 12h43 na
 * escola, 15h43 no carimbo). O padrão é declarado AQUI, e não no núcleo, porque o núcleo é
 * agnóstico — ele recebe o fuso; quem sabe onde a escola fica é a ponte de produção.
 *
 * Uma escola noutro fuso declara o seu: `"FUSO": "America/Manaus"` nas `vars` do
 * `wrangler.<escola>.jsonc`. O `tools/criar-escola.sh` ainda NÃO emite essa var (é de
 * `tools/`, congelado) — por isso o padrão existe: sem ele, a escola nova nasceria em UTC.
 */
const FUSO_PADRAO = 'America/Sao_Paulo';

async function carregarEstatico(env, chave, prefixo) {
  if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    const alvo = (prefixo || '') + chave;
    const res = await env.ASSETS.fetch(new URL(alvo, 'https://assets.local'));
    if (res.ok) return await res.text();
  }
  return null;
}

/** O serviço de estáticos: o ASSETS do Worker (index.html e os assets).
 *
 *  Sai `no-store`: o formulário da porta é servido do ASSETS, mas o seu CONTEÚDO
 *  (o `plano.json`/`anamnese.json`/esquema) muda com o deploy e o professor não
 *  pode continuar a ver a página de ontem. Sem cabeçalho de cache, o navegador
 *  aplica cache "heurístico" e reusa o documento velho em silêncio — foi o que
 *  fez uma correção publicada não aparecer para quem estava com a aba aberta.
 */
const SEM_CACHE = { 'Cache-Control': 'no-store, max-age=0' };

async function servirEstatico(env, caminho, prefixo) {
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
  const rel = caminho === '/' ? 'index.html' : caminho.replace(/^\/+/, '');
  const res = await env.ASSETS.fetch(new URL((prefixo || '') + rel, 'https://assets.local'));
  if (!res.ok) return null;
  const tipo = res.headers.get('Content-Type') || 'application/octet-stream';
  const corpo = await res.arrayBuffer();
  return { status: res.status, tipo, corpo, cabecalhos: SEM_CACHE };
}

/**
 * Monta a PORTA (o roteador pronto) a partir do que já foi carregado. É o
 * coração partilhado: a ponte Node e a ponte Cloudflare carregam o conteúdo de
 * meios diferentes (disco, ASSETS, bundle), mas o roteador é SEMPRE este.
 */
function montarPorta({ armazenamento, conteudoTexto, esquemaTexto, poTexto, planoTexto, prompt, identidade, servirEstatico, disparar, escreverPO, escreverPlano, escreverCiclo, lerDados, lancamentoSeguro, fuso }) {
  if (!conteudoTexto || !esquemaTexto) {
    return () => new Response(JSON.stringify({ ok: false, erro: 'conteúdo ou esquema ausentes no ASSETS' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }
  const roteador = criarRotas({
    armazenamento,
    conteudo: JSON.parse(conteudoTexto),
    esquema: JSON.parse(esquemaTexto),
    conteudoPO: poTexto ? JSON.parse(poTexto) : undefined,
    conteudoPlano: planoTexto ? JSON.parse(planoTexto) : undefined,
    fichaHtml,
    prompt,
    identidade,
    servirEstatico,
    disparar,
    escreverPO,
    escreverPlano,
    escreverCiclo,
    lerDados,
    lancamentoSeguro,
    fuso,
  });
  return (request) => roteador.responder(request);
}

/**
 * O leitor dos dados cifrados do pacote. `null` sem a chave (`SENHA_CRIPTO`) — e aí a rota
 * declara a indisponibilidade em vez de falhar de um jeito obscuro. A chave NUNCA sai daqui:
 * quem pede recebe o TEXTO EM CLARO, sob autenticação.
 */
function senhaDaEscola(env) {
  return (senha) => senhaDaEscolaOk(env, criarCloudflare(env), (env && env.ESCOLA_SLUG) || '', senha);
}

function criarLeitor(env, prefixo) {
  return criarLeitorDeDados({
    senhaCripto: (env && env.SENHA_CRIPTO) || null,
    lerAsset: (caminho) => servirEstatico(env, caminho, prefixo),
    senhaOk: senhaDaEscola(env),
  });
}

/**
 * O LANÇAMENTO DA AULA (`/api/receber`): a MESMA conferência de senha da leitura — a da escola,
 * não a por-professor — e a cifra no repouso, com a chave do Worker. `cifrar: null` quando a
 * escola não tem `SENHA_CRIPTO` (as legadas): a rota então grava em claro, e a RESPOSTA diz isso
 * (`cifrado: false`), em vez de deixar o dado desprotegido em silêncio.
 */
function criarLancamento(env) {
  const senhaCripto = (env && env.SENHA_CRIPTO) || null;
  return {
    autorizar: senhaDaEscola(env),
    // O TEXTO QUE VAI AO KV É STRING: `cifrarTexto` devolve o envelope montado (objeto), e o KV
    // coage objeto para `[object Object]`. Serializar aqui é o contrato de `cifrar`.
    cifrar: senhaCripto
      ? (texto) => cifrarTexto(texto, senhaCripto).then((e) => JSON.stringify(e, null, 2) + '\n')
      : null,
  };
}

/** Os passos de geração, a partir do token (null = não existe). */
function passosDeGeracao(env) {
  const token = (env && env.GITHUB_TOKEN) || null;
  const disparar = criarDisparador({ token, dono: 'tmenegaz', repo: 'danca', workflow: 'gerar-ciclo.yml' });
  const escreverPO = criarEscritorDePO({ token, dono: 'tmenegaz', repo: 'danca', ref: 'main', derivarPO });
  const escreverPlano = criarEscritorDePlano({ token, dono: 'tmenegaz', repo: 'danca', ref: 'main' });
  const escreverCiclo = criarEscritorDeCiclo({
    token,
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
    senhaCripto: (env && env.SENHA_CRIPTO) || null,
  });
  return { disparar, escreverPO, escreverPlano, escreverCiclo };
}

/**
 * O freio da escola: só `"nao"` DESLIGA a escola — qualquer caminho devolve a
 * página «Escola desabilitada». A ausência da flag (o Worker raiz `danca`, que
 * não é escola) NÃO desliga. É o mesmo freio de `producao.js`, vivido aqui na
 * ponte AGNÓSTICA (o `diaghilev-ia-stub` serve `cloudflare.js` direto, sem passar
 * pela ponte de produção). A flag é uma `vars` do wrangler (não segredo).
 */
function freioDaEscola(env) {
  if (env && env.ESCOLA_HABILITADA !== 'nao') return null;
  return new Response(
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Escola desabilitada</title>' +
    '<style>body{font:16px/1.6 Georgia, serif;color:#3a2b1f;background:#faf6ee;' +
    'max-width:34rem;margin:4rem auto;padding:0 1.25rem;}h1{font-size:1.5rem;}' +
    'p{color:#6b5b4a;}</style></head><body>' +
    '<h1>Escola desabilitada</h1>' +
    '<p>Esta escola está desabilitada para resolver problemas diversos.</p>' +
    '</body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
  );
}

async function fetch(request, env, opcoes) {
  const prefixo = (opcoes && opcoes.prefixo) || '';

  // 0. O freio da escola, ANTES do bootstrap — não há conteúdo, esquema nem rota
  //    quando a escola está desligada. Vale para o diaghilev-ia-stub (que usa esta
  //    ponte diretamente); a produção já freia em producao.js antes de chegar aqui.
  const freio = freioDaEscola(env);
  if (freio) return freio;

  // O bootstrap: o conteúdo, o esquema, o PO e o prompt vêm do ASSETS (estático)
  // sob o PREFIXO da porta; a identidade (o CSS) é a MESMA do pacote, na RAIZ —
  // `assets/style.css` — para a porta nunca envelhecer uma cópia própria quando a
  // fonte `tools/templates/ciclo.css` muda. Se faltarem, o roteador devolve erro
  // de forma declarada.
  const [conteudoTexto, esquemaTexto, poTexto, planoTexto, prompt, identidade] = await Promise.all([
    carregarEstatico(env, 'conteudo/anamnese.json', prefixo),
    carregarEstatico(env, 'envelope/elicitacao-schema.json', prefixo),
    carregarEstatico(env, 'po/conteudo/po.json', prefixo),
    carregarEstatico(env, 'plano/conteudo/plano.json', prefixo),
    carregarEstatico(env, 'prompts/elicitar-ciclo.md', prefixo),
    carregarEstatico(env, 'assets/style.css', ''),
  ]);

  const { disparar, escreverPO, escreverPlano, escreverCiclo } = passosDeGeracao(env);
  // O PREFIXO DO LEITOR É VAZIO, e não o da porta: o `-dados.json` do ciclo mora na RAIZ do
  // pacote (é lá que o formulário de lançamento o busca, ao lado do `ciclos.json`), enquanto o
  // CONTEÚDO da porta vive sob o `prefixo` (`plano-observacao/`). Trocar os dois faz o leitor
  // procurar `plano-observacao/ciclo-01-barra-dados.json` e responder «o pacote não tem …».
  const lerDados = criarLeitor(env, '');
  const lancamentoSeguro = criarLancamento(env);
  const responder = montarPorta({
    armazenamento: criarCloudflare(env),
    conteudoTexto,
    esquemaTexto,
    poTexto,
    planoTexto,
    prompt,
    identidade,
    servirEstatico: (caminho) => servirEstatico(env, caminho, prefixo),
    disparar,
    escreverPO,
    escreverPlano,
    escreverCiclo,
    lerDados,
    lancamentoSeguro,
    fuso: (env && env.FUSO) || FUSO_PADRAO,
  });

  return responder(request);
}

module.exports = { fetch, montarPorta, passosDeGeracao, carregarEstatico, servirEstatico };
