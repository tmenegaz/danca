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
// A CASCATA DO CICLO — a mesma rotina da Produção (05/11/2026).
const repoEscola = require('./repo-escola.js');
const acervo = require('./acervo-envelopes.js');
// O ÍNDICE DO ACERVO (20/10/2026, fase 4): a camada de I/O de `nucleo/indices.js`.
const { criarIndice } = require('./indice-acervo.js');
// O ESTADO DA GERAÇÃO — o que a tela pergunta enquanto o Actions trabalha.
const { criarGeracao } = require('./geracao.js');
const { criarLeitorDeDados } = require('./ler-dados.js');
const { cifrarTexto } = require('./cifrar-envelope.js');
const { senhaDaEscolaOk } = require('./bastidores.js');
const { derivarPO } = require('../nucleo/derivar-po.js');
const fichaHtml = require('../nucleo/ficha-html.js');
const { respostaEstado } = require('./estado-html.js');

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
function montarPorta({ armazenamento, conteudoTexto, esquemaTexto, poTexto, planoTexto, prompt, identidade, servirEstatico, disparar, escreverPO, escreverPlano, escreverCiclo, apagarCiclo, lerDados, lancamentoSeguro, fuso, escolaDoWorker, lerCuradorias, lerTurmas, lerLinhasDeBase, geracao, indice }) {
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
    // A CASCATA DO CICLO (05/11/2026). Apagar um PO leva o produto gerado — e só o dele.
    apagarCiclo,
    lerDados,
    lancamentoSeguro,
    geracao,
    indice,
    fuso,
    // A ESCOLA DO DOCUMENTO É A DO WORKER — ver o bloco em `rotas.js`. Chega por parâmetro
    // porque esta função monta o roteador e não vê o `env`; quem o vê é a ponte, abaixo.
    escolaDoWorker,
    // A CURADORIA — o recorte dos sujeitos por turma (20/10/2026). Chega do mesmo jeito, e
    // FALTAVA AQUI: a ponte de cima já a passava, e esta montagem deitava-a fora. O efeito era o
    // pior possível — a rota respondia «turma X» e a lista vinha vazia, porque sem leitura de
    // curadoria a regra conclui, correctamente, que ninguém está atribuído.
    lerCuradorias,
    // AS TURMAS DO CADASTRO (27/10/2026). O plano de ensino preenchido mostra, no contexto, a
    // frequência, a duração, o calendário e o número de aulas — que não são respostas do
    // envelope, são o cadastro da turma. Sem esta leitura o documento declará-los-ia em lacuna
    // sobre um dado que a escola declarou.
    lerTurmas,
    lerLinhasDeBase,
  });
  return (request) => roteador.responder(request);
}

/**
 * AS CURADORIAS DA ESCOLA, lidas do KV — a fonte de «quem está em qual turma» (20/10/2026).
 * Ausente o binding, devolve lista vazia: quem chama trata a ausência como «sem atribuição»,
 * que é o lado seguro. A leitura tolera texto inválido do mesmo jeito que o `bastidores.js`.
 */
function lerCuradoriasDoEnv(env) {
  return async (escola) => {
    const kv = env && env.PADD_KV;
    const slug = String(escola || (env && env.ESCOLA_SLUG) || '').trim();
    if (!kv || !slug) return [];
    try {
      const bruto = await kv.get('bastidores/' + slug + '/curadorias');
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  };
}

/**
 * O leitor dos dados cifrados do pacote. `null` sem a chave (`SENHA_CRIPTO`) — e aí a rota
 * declara a indisponibilidade em vez de falhar de um jeito obscuro. A chave NUNCA sai daqui:
 * quem pede recebe o TEXTO EM CLARO, sob autenticação.
 */
function senhaDaEscola(env) {
  return (senha) => senhaDaEscolaOk(env, criarCloudflare(env), (env && env.ESCOLA_SLUG) || '', senha);
}

/**
 * O ARMAZENAMENTO DA ESCOLA — e a fronteira da fase 3 (20/10/2026).
 *
 * A família `envelope/` (as anamneses, os planos de ensino, os PO) vai para o ACERVO, no
 * repositório. Todo o resto — o cofre cifrado do lançamento, os cadastros dos Bastidores, o
 * cartão da geração, o registo de chaves — fica no KV, que continua a ser o sítio certo para
 * estado pequeno e efémero.
 *
 * POR QUE AQUI, E NÃO NO `porta.js`: a escolha de onde o dado vive é da PONTE (o Worker sabe
 * que tem um token e um slug); o núcleo só conhece o contrato. Assim o `porta.js` — a
 * derivação, o índice, os estados, os vínculos — não muda uma linha para atravessar a
 * mudança.
 *
 * O ACERVO É CRIADO POR PEDIDO (esta função é chamada dentro do `fetch`), e é isso que lhe dá
 * o cache: as três rotas que consultam o índice numa só página pagam UMA ida ao GitHub. O KV
 * entra como `legado` — só para LEITURA, e só do que ainda não migrou.
 */
function criarArmazenamento(env) {
  const kv = criarCloudflare(env);
  return acervo.combinar(acervo.doAmbiente(env, { legado: kv }), kv);
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
/**
 * AS TURMAS DO CADASTRO DA ESCOLA, lidas do KV (19/10/2026; única desde 27/10/2026).
 *
 * A chave é a mesma do `bastidores.js` — `bastidores/<escola>/turmas` —, e a tolerância é a
 * mesma da curadoria: sem o binding, ou com texto inválido, devolve lista vazia, e quem chama
 * declara a lacuna em vez de inventar a turma. Duas leituras da mesma chave seriam duas
 * respostas à espera de divergir.
 */
function lerTurmasDoEnv(env) {
  return async (escola) => {
    const kv = env && env.PADD_KV;
    const slug = String(escola || (env && env.ESCOLA_SLUG) || '').trim();
    if (!kv || !slug) return [];
    try {
      const bruto = await kv.get('bastidores/' + slug + '/turmas');
      const lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  };
}

/**
 * AS LINHAS DE BASE DA ESCOLA — para a porta do professor (05/11/2026).
 *
 * A MESMA CHAVE QUE A PRODUÇÃO ESCREVE (`bastidores/<escola>/linhas-de-base`), lida pela mesma
 * forma que as turmas: uma segunda leitura da mesma chave divergiria no dia em que uma das duas
 * mudasse, e o sintoma seria a tela do plano a oferecer uma linha de base que a Produção já não
 * tem — sem falhar.
 *
 * Devolve a lista inteira, com os campos e a leitura que a Produção gravou. O recorte por
 * professor é do CLIENTE, e de propósito: a decisão dela é que «quem assume lê o que estava
 * antes» — esconder no servidor o que a regra manda mostrar seria decidir por ela.
 */
function lerLinhasDeBaseDoEnv(env) {
  const repo = require('./linhas-de-base-repo.js');
  return async (escola) => {
    const kv = env && env.PADD_KV;
    const slug = String(escola || (env && env.ESCOLA_SLUG) || '').trim();
    if (!kv || !slug) return [];
    /* O ACTO VEM DO REPOSITÓRIO (05/11/2026) — a MESMA fonte que a Produção usa, e não uma
     * segunda leitura da chave do KV. Aqui é mais do que disciplina: é esta lista que resolve o
     * `linha-de-base-alvo` de um plano e o elenco que o PO observa, e um dado que só existe no KV
     * de uma escola não é alcançável pela geração nem por um índice (as duas correm fora do
     * Worker). O KV fica como reserva para o registo antigo, que migra na primeira vez que for
     * concluído outra vez. */
    let doRepo = [];
    try {
      doRepo = await repo.doAmbiente(env, slug).vigentes();
    } catch (erro) {
      doRepo = [];
    }
    let doKv = [];
    try {
      const bruto = await kv.get('bastidores/' + slug + '/linhas-de-base');
      const lista = bruto ? JSON.parse(bruto) : [];
      doKv = Array.isArray(lista) ? lista.filter((l) => l && l.id && Array.isArray(l.campos)) : [];
    } catch (erro) {
      doKv = [];
    }
    const porId = new Map();
    for (const l of doRepo) porId.set(l.id, l);
    /* SÓ OS ACTOS DO KV ENTRAM POR BAIXO: um rascunho não declara elenco nem resolve um plano. */
    for (const l of doKv) if (!porId.has(l.id) && l.turma) porId.set(l.id, l);
    return [...porId.values()];
  };
}

function passosDeGeracao(env) {
  const token = (env && env.GITHUB_TOKEN) || null;
  const disparar = criarDisparador({ token, dono: 'tmenegaz', repo: 'danca', workflow: 'gerar-ciclo.yml' });
  const escreverPO = criarEscritorDePO({ token, dono: 'tmenegaz', repo: 'danca', ref: 'main', derivarPO });
  const escreverPlano = criarEscritorDePlano({
    token,
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
    // O CADASTRO DA TURMA — sem ele o manifesto da variante não pode ser derivado
    // (19/10/2026). Lê-se pela MESMA função que a rota do plano preenchido usa: uma segunda
    // leitura da mesma chave divergiria no dia em que uma das duas mudasse, e o sintoma seria
    // uma turma que a Produção mostra e o documento não vê.
    lerTurmas: lerTurmasDoEnv(env),
    lerLinhasDeBase: lerLinhasDeBaseDoEnv(env),
  });
  const escreverCiclo = criarEscritorDeCiclo({
    token,
    dono: 'tmenegaz',
    repo: 'danca',
    ref: 'main',
    senhaCripto: (env && env.SENHA_CRIPTO) || null,
  });
  // O ESTADO DA GERAÇÃO vive no KV da escola, ao lado do cadastro de turmas — e é o
  // mesmo `PADD_KV`, porque é o mesmo armazenamento da mesma escola. Sem o binding, o
  // serviço volta inerte e a rota responde «indisponível»: melhor que inventar estado.
  const geracao = criarGeracao({
    kv: (env && env.PADD_KV) || null,
    escola: (env && env.ESCOLA_SLUG) || '',
    token,
    dono: 'tmenegaz',
    repo: 'danca',
  });
  /* A CASCATA DO CICLO — a MESMA rotina da Produção, em modo «só o produto» (05/11/2026).
   *
   * A pesquisadora: «quando eu apagar o plano de observação, ele tem que levar consigo os ciclos do
   * menu com tudo que está dentro dele… as aulas, o lançar aula, o captura para impressão da aula e
   * o PDF da aula.» A rotina já existia e já fazia isso, com a guarda do último ciclo; o que
   * faltava era estar ligada ao gesto da listagem.
   *
   * `soOProduto` porque os ENVELOPES saem pelo acervo (`porta.apagarEnvelope`), que é quem mantém o
   * `.indice.json`. Duas cópias da mesma escrita divergiriam.
   *
   * Sem token não há cascata — e não há promessa: a rota diz que o ciclo não foi apagado, e o
   * envelope sai na mesma. */
  const apagarCiclo = token
    ? ({ escola, professor, ciclo, variante }) => repoEscola.apagarCicloDoRepo({
      token, dono: 'tmenegaz', repo: 'danca', ref: 'main',
      escola, professor, variante, ciclo, soOProduto: true,
    })
    : null;
  return { disparar, escreverPO, escreverPlano, escreverCiclo, apagarCiclo, geracao };
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
  return respostaEstado('Escola desabilitada',
    '<p>Esta escola está desabilitada para resolver problemas diversos.</p>', 503);
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

  const { disparar, escreverPO, escreverPlano, escreverCiclo, apagarCiclo, geracao } = passosDeGeracao(env);
  // O PREFIXO DO LEITOR É VAZIO, e não o da porta: o `-dados.json` do ciclo mora na RAIZ do
  // pacote (é lá que o formulário de lançamento o busca, ao lado do `ciclos.json`), enquanto o
  // CONTEÚDO da porta vive sob o `prefixo` (`plano-observacao/`). Trocar os dois faz o leitor
  // procurar `plano-observacao/ciclo-01-barra-dados.json` e responder «o pacote não tem …».
  const lerDados = criarLeitor(env, '');
  const lancamentoSeguro = criarLancamento(env);
  const responder = montarPorta({
    armazenamento: criarArmazenamento(env),
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
    apagarCiclo,
    lerDados,
    lancamentoSeguro,
    geracao,
    fuso: (env && env.FUSO) || FUSO_PADRAO,
    // A MESMA var que `escolaDe` já usava; o que faltava era aplicá-la ao contexto das rotas.
    escolaDoWorker: (env && env.ESCOLA_SLUG) || '',
    // A CURADORIA — o recorte de quem a professora observa em cada turma (20/10/2026). A rota
    // `/api/anamneses` precisa dela para não oferecer, no PO de uma turma, as alunas das outras.
    // Mesma chave do `bastidores.js` (`bastidores/<escola>/curadorias`): uma segunda chave para
    // a mesma lista divergiria no dia em que uma das duas mudasse, e o sintoma seria uma aluna
    // que a Produção atribui e o PO não mostra — ou o contrário, que é o vazamento de hoje.
    lerCuradorias: lerCuradoriasDoEnv(env),
    lerTurmas: lerTurmasDoEnv(env),
    lerLinhasDeBase: lerLinhasDeBaseDoEnv(env),
    // O ÍNDICE (fase 4). O cache vive no KV da escola — é derivado, e a perda dele não perde
    // dado nenhum. `comApelido` é verdadeiro aqui porque quem serve é o Worker da ESCOLA.
    indice: criarIndice(env, { kv: criarCloudflare(env), escola: (env && env.ESCOLA_SLUG) || '' }),
  });

  return responder(request);
}

/* O ARMAZENAMENTO, exportado (24/10/2026). A listagem da anamnese, do plano de ensino e do PO
 * lê os envelopes do acervo — e tem de os ler pelo MESMO caminho que a porta: estático primeiro,
 * KV depois, e a combinação que o `acervo` monta. Uma segunda forma de ler o mesmo acervo
 * divergiria no dia em que uma das duas mudasse, e o sintoma seria uma lista a mostrar registos
 * que a porta já não encontra. */
module.exports = { fetch, montarPorta, passosDeGeracao, carregarEstatico, servirEstatico, criarArmazenamento };
