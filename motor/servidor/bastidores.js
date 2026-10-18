'use strict';

/**
 * bastidores.js — os Bastidores da escola, como GRUPO de menu com DOIS itens
 * (IDEIA-PAINEL-ESCOLA.md §2): o «Estúdio de Dança» (a cena, partilhada entre a direção e o
 * professor) e a «Produção» (o gabinete, SÓ da direção — senha própria). O Estúdio primeiro,
 * a Produção depois.
 *
 * A «Área do Professor» (anamnese, plano de ensino e PO) abre depois que um PROFESSOR existe —
 * criado pela página `danca` (secret `PROFESSOR_NOME`/`SENHA_PROFESSOR`) ou cadastrado na
 * Produção. A senha do professor é validada pela anamnese; as ALUNAS (apelidos estáveis, P-12)
 * alimentam o seletor da anamnese.
 *
 * O dado vive no KV da própria escola, isolado por namespace sob chaves prefixadas pelo slug
 * da escola — a MESMA política do cofre, para uma escola nunca ler o dado da outra. A senha do
 * professor NUNCA fica em claro no KV: guarda-se só o sal e o HASH (SHA-256 com sal). O secret
 * `SENHA_PROFESSOR` (o professor criado pela página) é comparado direto, como os demais segredos
 * do Worker.
 *
 * Chaves:
 *   bastidores/<escola>/professores  → [ { nome, sal, hash } ]
 *   bastidores/<escola>/alunas       → [ "apelido", ... ]
 */

const RAIZ = 'bastidores';

// O catálogo INICIAL de turmas e vocabulário técnico (conteúdo, não código). Carregado
// sob demanda pela Produção (`POST /api/bastidores/semear-catalogo`), idempotente.
const CATALOGO = require('./catalogo-seed.js');

/**
 * AS CATEGORIAS E AS TRADIÇÕES DO VOCABULÁRIO (18/10/2026). O formulário do termo deixou de
 * aceitar texto livre nestes dois campos: a direção ESCOLHE numa lista, e o único campo
 * escrito é o nome do termo. As duas listas são as do CATÁLOGO — não uma cópia escrita aqui:
 * é ele que declara as categorias (`tradicoes.json`) e as tradições, e uma segunda lista
 * divergiria dele no primeiro termo novo.
 *
 * O VALOR GRAVADO é a chave sem acento (`posicao`, `direcao`), porque é a que os 84 termos
 * já usam; o RÓTULO é o que a tela mostra (`posição`, `direção`). Passar a gravar o rótulo
 * renomearia o passado — e o passado não se reescreve.
 */
const CATEGORIAS_DO_VOCABULARIO = Object.keys(CATALOGO.CATEGORIAS || {});
const TRADICOES_DO_VOCABULARIO = (CATALOGO.TRADICOES || []).slice();
const ROTULOS_DE_CATEGORIA = {
  passo: 'passo', posicao: 'posição', direcao: 'direção', ligacao: 'ligação',
  salto: 'salto', giro: 'giro',
};
function rotuloDaCategoria(categoria) {
  const chave = String(categoria == null ? '' : categoria).trim();
  return ROTULOS_DE_CATEGORIA[chave] || chave;
}
// A RÉGUA DA RUBRICA — o padrão DECLARADO (Regra 10, camada 1: «plano do ciclo piloto»), e
// a MESMA constante que a derivação do plano usa como reserva. A régua é da TURMA (a escola
// a edita aqui); esta é a lista que nasce com uma turma nova e o que vale quando nenhuma foi
// declarada. Uma fonte só — a decisão é declarada, não inventada.
const { NIVEIS_DA_RUBRICA } = require('../nucleo/derivar-plano-ciclo.js');
// A TURMA DE UM ENVELOPE (a resposta a `contexto-turma`) — uma definição só, a da porta. O
// cadastro precisa dela para saber se uma turma já está presa a um plano de ensino, e daí
// decidir se ela se EDITA (livre) ou se DERIVA (vinculada) — 16/10/2026.
const { turmaDoEnvelope } = require('../nucleo/porta.js');
// A FORMA da barra de navegação e os destinos do SISTEMA — o mesmo módulo que o
// `tools/gerar-ciclo.sh` consome. Uma definição, dois consumidores.
const { navSistema } = require('../../tools/templates/nav-html.js');

/** O dado destas rotas é DINÂMICO (vem do KV) e o documento é gerado a cada pedido:
 *  `no-store` impede o navegador de reusar uma página ou uma listagem velha — sem
 *  ele, uma Produção de antes do deploy continua aparecendo (e o menu só mexe no hash). */
function semCache(headers) {
  return Object.assign({ 'Cache-Control': 'no-store, max-age=0' }, headers);
}

function json(status, corpo) {
  return new Response(JSON.stringify(corpo, null, 2) + '\n', {
    status,
    headers: semCache({ 'Content-Type': 'application/json;charset=utf-8' }),
  });
}

function html(corpo) {
  return new Response(corpo, {
    status: 200,
    headers: semCache({ 'Content-Type': 'text/html;charset=utf-8' }),
  });
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** O slug de um nome (a MESMA derivação de provisionar-escola.js): minúsculo, sem acento,
 *  espaços/símbolos viram hífen. É o identificador que entra na chave do cofre e no caminho
 *  `professores/<slug>/…` — o NOME de exibição nunca vira chave (P-17). */
function slugificar(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * O SLUG de um professor CADASTRADO — a identidade dele, e a pasta.
 *
 * A partir de 15/10/2026 o slug é **gravado** na entrada (`{nome, slug, sal, hash}`), em vez
 * de derivado do nome a cada uso. O motivo é o mesmo que fez o dono da escola ter o slug vindo
 * do SECRET: derivar do nome significa que **ajustar o nome de exibição move a pasta** — e a
 * pasta é onde o PO, o plano e os cadernos das aulas ficam. O nome exibido passa a poder mudar
 * sem que o material mude de lugar.
 *
 * Entradas antigas (sem `slug`) continuam funcionando: o slug é derivado do nome, como antes.
 * A leitura aceita as duas formas; a escrita grava sempre a nova.
 */
function slugDoProfessor(p) {
  if (!p) return '';
  return String(p.slug || '').trim() || slugificar(String(p.nome || ''));
}

/** O slug da escola, vindo do Worker (uma escola por Worker). */
function escolaDe(env, url) {
  const doEnv = env && String(env.ESCOLA_SLUG || '').trim();
  if (doEnv) return doEnv;
  return String((url && url.searchParams.get('escola')) || '').trim();
}

/** Um sal aleatório (16 bytes) em hex — para nunca guardar a senha em claro. */
function gerarSal() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** HASH da senha com o sal — SHA-256(sal + senha), em hex. */
async function hashSenha(senha, sal) {
  const bytes = new TextEncoder().encode(String(sal || '') + senha);
  const digesto = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  let s = '';
  for (const b of new Uint8Array(digesto)) s += b.toString(16).padStart(2, '0');
  return s;
}

/**
 * Existe ao menos um professor? É o que habilita a Área do Professor. A fonte é dupla:
 * o secret `PROFESSOR_NOME` (o professor criado pela página `danca`, que persiste no deploy
 * do motor) OU a lista no KV (professores adicionais cadastrados nos Bastidores).
 */
async function temProfessor(env) {
  if (env && String(env.PROFESSOR_NOME || '').trim()) return true;
  const kv = env && env.PADD_KV;
  if (!kv) return false;
  const escola = escolaDe(env, null);
  if (!escola) return false;
  const profs = await professores(kv, escola);
  return profs.length > 0;
}

async function lerLista(kv, chave) {
  try {
    const t = await kv.get(chave);
    const v = t ? JSON.parse(t) : [];
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

/**
 * A APARÊNCIA DA ESCOLA (18/10/2026) — a preferência é da ESCOLA (decisão C15).
 *
 * O tema nasceu como escolha do NAVEGADOR (`localStorage`), e era provisório por declaração: a
 * C15 perguntava «de quem é a preferência?» e a medição mostrou que não havia *usuário* onde
 * pendurá-la (o portão autentica um segredo por escola). Decidido: **é da escola**.
 *
 * Guarda-se UM valor, sob a chave da instalação — nada de campo novo de pessoa. O modo aplica-se
 * no SERVIDOR (o atributo vai no `<html>` de cada página servida), porque uma escolha que vale
 * para todos não pode viver no navegador de cada um.
 *
 * O valor guardado é o NOME do modo (`clara`/`noturna`) e o NOME da família — nunca um hex nem
 * um índice. É essa escolha que faz o campo sobreviver ao catálogo: quando as doze paletas
 * existirem, o valor continua a ser uma palavra, e o dia em que um hex mudar não obriga a
 * migrar dado nenhum.
 *
 * A FAMÍLIA ENTROU EM 18/10/2026, e entrou como **segundo eixo**, não como segundo valor do
 * mesmo eixo: um modo e uma paleta são independentes (a Cortina tem as duas variantes, como a
 * Bordô), e guardá-los num só campo obrigaria a enumerar o produto cartesiano à mão — quatro
 * nomes hoje, vinte e quatro quando o catálogo fechar.
 */
const MODOS_DE_APARENCIA = ['clara', 'noturna'];

/** As famílias que EXISTEM — isto é, as que têm hex medidos em `tools/templates/ciclo.css`.
 *  O catálogo FECHOU em três (18/10/2026): as outras quatro que chegaram a ser medidas foram
 *  abandonadas por decisão de produto. A regra mantém-se: oferecer no seletor uma família que
 *  a folha não desenha daria uma escola pintada de nada — e é o `check-identidade` que confere
 *  que esta lista e a folha dizem o mesmo (a checagem «Famílias»). */
const PALETAS = [
  { id: 'bordo', nome: 'Bordô de Cena' },
  { id: 'cortina', nome: 'Cortina Turquesa' },
  { id: 'verde', nome: 'Verde de Ensaio' },
];
const IDS_DAS_PALETAS = PALETAS.map((p) => p.id);
const PALETA_PADRAO = 'bordo';

function chaveDaAparencia(escola) {
  return RAIZ + '/' + escola + '/aparencia';
}

/**
 * A aparência da escola: `{ modo, paleta }`. Ausência, valor inválido ou KV ilegível caem no
 * PADRÃO — o padrão não depende de haver dado, que é a mesma defesa do `rubricaDaTurma` e do
 * freio da escola.
 *
 * Devolve SEMPRE o par completo, e é isso que faz o resto do código não ter de repetir o
 * `|| 'clara'`: um valor em falta produziria `undefined` no atributo, e um atributo vazio é
 * uma página sem família.
 */
async function aparenciaDaEscola(kv, escola) {
  let o = null;
  try {
    const t = await kv.get(chaveDaAparencia(escola));
    o = t ? JSON.parse(t) : null;
  } catch (e) {
    o = null;
  }
  const modo = String((o && o.modo) || '');
  const paleta = String((o && o.paleta) || '');
  return {
    modo: MODOS_DE_APARENCIA.indexOf(modo) === -1 ? 'clara' : modo,
    paleta: IDS_DAS_PALETAS.indexOf(paleta) === -1 ? PALETA_PADRAO : paleta,
  };
}

/**
 * Grava a aparência — MESCLANDO com o que já lá está, em vez de substituir.
 *
 * A mesclagem existe porque os dois eixos são independentes e chegam em pedidos separados: quem
 * muda a paleta não está a dizer nada sobre o modo, e sobrescrever punha a escola em `clara` sem
 * ninguém ter pedido. Cada chave só entra se for válida; uma inválida é RECUSADA (`false`), e não
 * ignorada em silêncio — quem chamou tem de saber que o pedido não passou.
 */
async function gravarAparencia(kv, escola, mudanca, por) {
  // SEM LEITURA PRÉVIA QUANDO O PAR VEM INTEIRO. O «ler-modificar-gravar» só é necessário
  // para um pedido parcial; e ele carrega a janela de consistência do KV (ver a nota no
  // cliente). Quando os dois eixos vêm, grava-se o que veio — uma leitura a menos e nenhuma
  // janela.
  const osDois = mudanca && mudanca.modo !== undefined && mudanca.paleta !== undefined;
  const atual = osDois ? null : await aparenciaDaEscola(kv, escola);
  const novo = osDois ? {} : { modo: atual.modo, paleta: atual.paleta };
  if (mudanca && mudanca.modo !== undefined) {
    const m = String(mudanca.modo || '');
    if (MODOS_DE_APARENCIA.indexOf(m) === -1) return false;
    novo.modo = m;
  }
  if (mudanca && mudanca.paleta !== undefined) {
    const p = String(mudanca.paleta || '');
    if (IDS_DAS_PALETAS.indexOf(p) === -1) return false;
    novo.paleta = p;
  }
  await kv.put(chaveDaAparencia(escola), JSON.stringify({
    modo: novo.modo,
    paleta: novo.paleta,
    por: String(por || 'direcao'),
    em: new Date().toISOString(),
  }));
  return true;
}

async function professores(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/professores');
}
async function alunas(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/alunas');
}
async function turmas(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/turmas');
}

/**
 * A RÉGUA DA RUBRICA de uma turma: os níveis com que o resultado é medido no fim do ciclo.
 * É decisão da ESCOLA — a coordenação e os professores podem mudar os nomes, acrescentar ou
 * remover um nível.
 *
 * ATÉ 15/10/2026 ela vivia DENTRO da turma, e o formulário do cadastro da turma pedia os
 * níveis junto com o nome e os dias — o que misturava duas coisas: a turma (quem, quando,
 * quantas vezes) e a régua de avaliação (com que níveis se mede). Quem pedia uma turma nova
 * tinha de decidir a régua antes de saber se a turma precisava de uma própria.
 *
 * Agora a régua é uma COISA COM NOME («Régua do Nível 1»), criada uma vez e LIGADA às turmas
 * que a usam — duas, cinco ou nenhuma. A ordem de leitura, e o motivo de cada degrau:
 *
 *   1. O VÍNCULO — `turma.rubricaId` aponta para uma rubrica criada na Produção. Um vínculo
 *      que aponta para uma rubrica já apagada NÃO quebra a turma: cai no degrau seguinte.
 *   2. A RÉGUA PRÓPRIA da turma — `turma.rubrica`, o que existia antes. Nenhuma turma
 *      precisa de migração: as que já tinham a sua continuam a valer.
 *   3. O PADRÃO — uma turma nunca fica sem régua, porque uma régua vazia mediria contra nada.
 */
function niveisLimpos(cru) {
  return (Array.isArray(cru) ? cru : [])
    .map((n) => String(n || '').trim())
    .filter(Boolean)
    .filter((n, i, arr) => arr.indexOf(n) === i);
}

function rubricaDaTurma(turma, listaDeRubricas) {
  const ligada = String((turma && turma.rubricaId) || '').trim();
  if (ligada && Array.isArray(listaDeRubricas)) {
    const alvo = listaDeRubricas.find((r) => r && r.id === ligada);
    const niveis = alvo ? niveisLimpos(alvo.niveis) : [];
    if (niveis.length) return niveis;
  }
  const proprios = niveisLimpos(turma && turma.rubrica);
  if (proprios.length) return proprios;
  return NIVEIS_DA_RUBRICA.slice();
}

/** As RUBRICAS da escola: uma LISTA de `{id, nome, niveis}`. */
async function rubricas(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/rubricas');
}

/** Monta a rubrica canónica a partir do que a Produção envia. O `id` é o slug do NOME; se
 *  vem um `id`, é ele que manda — é o que permite RENOMEAR uma rubrica sem perder os
 *  vínculos (renomear com o id derivado do nome criaria outra rubrica e deixaria as turmas
 *  órfãs, apontando para a que sumiu). */
function normalizarRubrica(corpo) {
  const nome = String(corpo.nome || '').trim();
  const id = String(corpo.id || '').trim() || idDe(nome);
  return { id: id, nome: nome, niveis: niveisLimpos(corpo.niveis) };
}
async function termos(kv, escola) {
  return lerLista(kv, RAIZ + '/' + escola + '/vocabulario');
}

/** A relação turma↔termo: um MAPA `{ turmaId: [termoId, ...] }`. Um termo pode estar em
 *  várias turmas; uma turma tem vários termos. `lerLista` não serve aqui (não é array). */
async function relacoes(kv, escola) {
  try {
    const t = await kv.get(RAIZ + '/' + escola + '/turma-conteudos');
    const v = t ? JSON.parse(t) : {};
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch (e) {
    return {};
  }
}

/**
 * OS PLANOS DE ENSINO, como PARES (professor, turma) (16/10/2026).
 *
 * É o que separa o que se **edita** do que se **deriva** — na turma e na curadoria. Cada
 * plano de ensino declara, no envelope, o professor (`contexto.professor`, o slug) e a turma
 * (`contexto-turma`, o nome). Um par destes é uma linha de base: alguém já falou dela.
 *
 * A chave física dos envelopes é NAMESPACED pela escola (`<escola>/envelope/plano-….json` —
 * ver `motor/adaptadores/cloudflare.js`): sem o prefixo da escola, a leitura devolveria os
 * planos de OUTRA escola, e daqui sairia «vinculada» para quem não tem plano nenhum.
 *
 * Se a leitura falhar, a resposta é `null` — e quem lê trata `null` como VINCULADO, que é o
 * lado seguro: derivar o que está livre é um elo a mais; editar o que está vinculado partiria
 * o plano.
 */
async function paresComPlano(kv, escola) {
  const pares = [];
  const prefixo = String(escola || '').trim() ? escola + '/envelope/' : 'envelope/';
  try {
    const listagem = await kv.list({ prefix: prefixo });
    const chaves = (listagem && listagem.keys ? listagem.keys : [])
      .map((k) => k.name)
      .filter((n) => /(^|\/)envelope\/plano-.*\.json$/.test(n));
    for (const chave of chaves) {
      const texto = await kv.get(chave);
      if (!texto) continue;
      let envelope = null;
      try { envelope = JSON.parse(texto); } catch { continue; }
      const turma = turmaDoEnvelope(envelope);
      if (!turma) continue;
      const professor = String((envelope && envelope.contexto && envelope.contexto.professor) || '').trim();
      // O CICLO VAI JUNTO (18/10/2026). Ele não entra na regra de proveniência — o par é
      // (professor, turma) —, mas é o que a PORTA precisa para abrir o plano de ensino
      // daquele professor (`/plano-ensino/?professor=…&escola=…&ciclo=…`). Sem ele, o link
      // cairia na porta a pedir o ciclo, e a curadoria deixaria de ser o atalho que é.
      const ciclo = String((envelope && envelope.contexto && envelope.contexto.ciclo) || '').trim();
      pares.push({ professor, turma, ciclo });
    }
  } catch (e) {
    return null;
  }
  return pares;
}

/** As TURMAS que já têm plano — o conjunto que o cartão da turma consulta. */
async function turmasComPlano(kv, escola) {
  const pares = await paresComPlano(kv, escola);
  if (!pares) return null;
  return new Set(pares.map((p) => p.turma));
}

/** A turma está presa a um plano? `null` (não deu para ler) conta como presa. */
function turmaVinculadaA(planoDeTurmas, nome) {
  if (!planoDeTurmas) return true;
  return planoDeTurmas.has(String(nome == null ? '' : nome).trim());
}

/**
 * O QUE OS PLANOS DE ENSINO JÁ USARAM (18/10/2026) — a MESMA regra de proveniência da
 * curadoria, aplicada a tudo o que a escola cadastra.
 *
 * A regra, dita uma vez: **o que já entrou num plano de ensino não se apaga.** Apagar um
 * professor, uma aluna, uma turma ou um termo que um plano referencia deixaria o plano a
 * apontar para o vazio — e o rastro é o que este sistema entrega. O que está livre corrige-se;
 * o que está vinculado deriva ou fica.
 *
 * Uma passagem só pelos envelopes, porque cada leitura é uma ida ao KV:
 *
 *   - `professores` — o `contexto.professor` do envelope (o slug) e a resposta
 *     `contexto-professor` (o nome que o formulário gravou);
 *   - `turmas` — o `contexto-turma`, pelo `turmaDoEnvelope` (já usado pelo `paresComPlano`);
 *   - `termos` — a resposta `repertorio`, que é a lista de passos do plano, por NOME e por
 *     slug (as duas formas aparecem em planos de épocas diferentes).
 *
 * `null` quando a leitura falha — e quem lê trata `null` como «tudo vinculado», que é o lado
 * seguro: apagar por engano rompe a proveniência, e isso não se desfaz.
 */
function valorDoEnvelope(envelope, id) {
  const r = envelope && envelope.respostas ? envelope.respostas[id] : null;
  if (r === undefined || r === null) return null;
  const v = (typeof r === 'object' && !Array.isArray(r) && 'valor' in r) ? r.valor : r;
  if (Array.isArray(v)) return v.map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
  const s = String(v == null ? '' : v).trim();
  return s || null;
}

async function usosDosPlanos(kv, escola) {
  const usos = { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 };
  const prefixo = String(escola || '').trim() ? escola + '/envelope/' : 'envelope/';
  try {
    const listagem = await kv.list({ prefix: prefixo });
    const chaves = (listagem && listagem.keys ? listagem.keys : [])
      .map((k) => k.name)
      .filter((n) => /(^|\/)envelope\/plano-.*\.json$/.test(n));
    for (const chave of chaves) {
      const texto = await kv.get(chave);
      if (!texto) continue;
      let envelope = null;
      try { envelope = JSON.parse(texto); } catch { continue; }
      usos.planos += 1;
      const contexto = (envelope && envelope.contexto) || {};
      const prof = String(contexto.professor || '').trim();
      const profDaResposta = valorDoEnvelope(envelope, 'contexto-professor');
      for (const p of [prof].concat(Array.isArray(profDaResposta) ? profDaResposta : [profDaResposta])) {
        const s = String(p == null ? '' : p).trim();
        if (s) { usos.professores.add(s); usos.professores.add(slugificar(s)); }
      }
      const turma = turmaDoEnvelope(envelope);
      if (turma) usos.turmas.add(turma);
      const rep = valorDoEnvelope(envelope, 'repertorio');
      for (const t of (Array.isArray(rep) ? rep : [rep])) {
        const s = String(t == null ? '' : t).trim();
        if (s) { usos.termos.add(s); usos.termos.add(idDe(s)); }
      }
    }
  } catch (e) {
    return null;
  }
  return usos;
}

/** O professor já está num plano? `null` (não deu para ler) conta como vinculado. */
function professorVinculadoA(usos, p) {
  if (!usos) return true;
  const nome = String((p && p.nome) || '').trim();
  const slug = slugDoProfessor(p) || slugificar(nome);
  return usos.professores.has(nome) || usos.professores.has(slug);
}

/** As turmas de uma curadoria, lidas dos DOIS formatos: o novo (`turma`, um nome) e o antigo
 *  (`turmas`, uma lista — que os registos já gravados têm). */
function turmasDaCuradoria(c) {
  if (!c) return [];
  if (Array.isArray(c.turmas) && c.turmas.length) return c.turmas.map((x) => String(x).trim()).filter(Boolean);
  const uma = String(c.turma || '').trim();
  return uma ? [uma] : [];
}

/**
 * A curadoria está presa a um plano de ensino? É o par (professor, turma): o plano declara
 * AMBOS, e é isso que diz de que curadoria ele nasceu. Um plano do professor A sobre a turma X
 * não torna vinculada a curadoria do professor B — nem a do A noutra turma.
 */
function curadoriaVinculadaA(pares, c) {
  if (!pares) return true;
  const professor = String((c && c.professor) || '').trim();
  const turmas = turmasDaCuradoria(c);
  return pares.some((p) => p.professor === professor && turmas.indexOf(p.turma) !== -1);
}

/**
 * A ALUNA está presa a um plano? Ela não aparece no plano de ensino (o plano é da TURMA,
 * não da pessoa), mas aparece na CURADORIA — e é a curadoria que declara quem está na turma.
 * Logo: a aluna está vinculada quando alguma curadoria que a inclui já tem plano de ensino.
 * É a mesma pergunta da curadoria, feita um nível abaixo.
 */
function alunaVinculadaA(pares, listaCuradorias, apelido) {
  if (!pares) return true;
  const alvo = String(apelido == null ? '' : apelido).trim();
  if (!alvo) return false;
  return (Array.isArray(listaCuradorias) ? listaCuradorias : []).some((c) =>
    c && !c.substituidaPor
    && Array.isArray(c.alunas) && c.alunas.indexOf(alvo) !== -1
    && curadoriaVinculadaA(pares, c));
}

/**
 * O TERMO está preso a um plano? Duas portas, e as duas contam:
 *
 *   1. o plano o declara no REPERTÓRIO (é o caminho direto);
 *   2. ele está associado a uma turma que já tem plano (o conteúdo ensinado naquela turma).
 *
 * `usos === null` (a leitura dos envelopes falhou) conta como vinculado — o lado seguro.
 */
function termoVinculadoA(usos, relObj, turmasVinculadas, termo) {
  if (!usos) return true;
  const nome = String((termo && termo.termo) || '').trim();
  const id = String((termo && termo.id) || '').trim() || idDe(nome);
  if (usos.termos.has(nome) || usos.termos.has(id)) return true;
  if (!turmasVinculadas) return true;
  for (const [turmaId, ids] of Object.entries(relObj || {})) {
    if (!Array.isArray(ids) || ids.indexOf(id) === -1) continue;
    const t = (turmasVinculadas instanceof Map)
      ? turmasVinculadas.get(turmaId)
      : (turmasVinculadas.has ? turmasVinculadas.has(turmaId) : false);
    if (t) return true;
  }
  return false;
}

/** As curadorias VIGENTES — as substituídas por uma derivação saem da operação e ficam no
 *  histórico, como as turmas. */
function curadoriasVigentes(lista) {
  return (Array.isArray(lista) ? lista : []).filter((c) => c && !c.substituidaPor);
}

/**
 * O ID de uma curadoria DERIVADA — o mesmo esquema do `idDerivado` da turma: base do id
 * original mais a vigência, com sufixo se colidir. O id da curadoria é o slug de
 * `professor + modalidade`; um registo novo com o mesmo par colidiria com o anterior.
 */
function idCuradoriaDerivado(id, vigencia, lista) {
  const base = String(id || '').trim() + '-' + String(vigencia || '').trim();
  const usados = new Set((Array.isArray(lista) ? lista : []).map((c) => c && c.id));
  if (!usados.has(base)) return base;
  let n = 2;
  while (usados.has(base + '-' + n)) n += 1;
  return base + '-' + n;
}

/** O id estável de uma turma/termo: o slug do nome (não há edição — o nome não muda). */
function idDe(nome) {
  return slugificar(nome);
}

/**
 * AS TURMAS VIGENTES — as que valem HOJE (16/10/2026).
 *
 * A turma não se edita: **deriva**. Quando a escola precisa de mudar a hora, a duração ou os
 * dias de uma turma, o que acontece é um registo NOVO com o mesmo nome e uma data de vigência,
 * e o anterior fica na lista com `substituidaPor` — como o elo do ajuste do plano e da
 * anamnese. Assim a pergunta «que ritmo valia em Março» tem resposta, e o passado não é
 * reescrito.
 *
 * Quem lê «as turmas» para trabalhar — a curadoria, o plano, a validação do ritmo — usa ESTA
 * lista. Quem lê para auditar (o histórico, o cadastro) usa a lista inteira.
 */
function turmasVigentes(lista) {
  return (Array.isArray(lista) ? lista : []).filter((t) => t && !t.substituidaPor);
}

/** A turma vigente com um NOME — é o nome que a curadoria e o plano referenciam. */
function turmaVigentePorNome(lista, nome) {
  return turmasVigentes(lista).find((t) => t && String(t.nome) === String(nome)) || null;
}

/**
 * O ID de uma turma DERIVADA. O id de uma turma é o slug do nome — e é ele que a relação
 * turma↔termo usa. Um registo novo com o mesmo nome colidiria com o anterior, e por isso o id
 * derivado leva a data de vigência: `teste-2026-10-16`. Duas derivações no mesmo dia ganham
 * sufixo (`-2`), para o id nunca colidir.
 *
 * O NOME não muda: é ele que a curadoria guarda e que o plano referencia. Mudar o nome do
 * registo novo partiria as duas ligações antigas — e o professor veria o plano dele perder a
 * turma sem saber por quê.
 */
function idDerivado(nome, vigencia, lista) {
  const base = slugificar(nome) + '-' + String(vigencia || '').trim();
  const usados = new Set((Array.isArray(lista) ? lista : []).map((t) => t && t.id));
  if (!usados.has(base)) return base;
  let n = 2;
  while (usados.has(base + '-' + n)) n += 1;
  return base + '-' + n;
}

/** Os dias da semana, PADRONIZADOS — a Produção só deixa marcar, nunca escrever.
 *  É o que evita «sexta», «seis» e «sexta-feira» conviverem como se fossem o mesmo dia. */
const DIAS_DA_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

/** Aceita o que já existe (texto livre, de antes do seletor) e devolve o canónico.
 *  O que não é reconhecido é descartado — melhor um dia a menos do que um dia errado. */
const APELIDOS_DE_DIA = {
  seg: 'seg', segunda: 'seg', 'segunda-feira': 'seg', '2': 'seg',
  ter: 'ter', terca: 'ter', 'terça': 'ter', 'terca-feira': 'ter', 'terça-feira': 'ter', '3': 'ter',
  qua: 'qua', quarta: 'qua', 'quarta-feira': 'qua', '4': 'qua',
  qui: 'qui', quinta: 'qui', 'quinta-feira': 'qui', '5': 'qui',
  sex: 'sex', sexta: 'sex', 'sexta-feira': 'sex', seis: 'sex', '6': 'sex',
  sab: 'sáb', 'sáb': 'sáb', sabado: 'sáb', 'sábado': 'sáb', 'sabado': 'sáb', 'sábado ': 'sáb', '7': 'sáb',
  dom: 'dom', domingo: 'dom', '1': 'dom',
};

function normalizarDia(valor) {
  const chave = String(valor || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (!chave) return null;
  const semAcento = chave.replace(/^sab/, 'sab');
  return APELIDOS_DE_DIA[chave] || APELIDOS_DE_DIA[semAcento] || null;
}

/**
 * A DATA COMO A DIREÇÃO A LÊ (18/10/2026). O campo `<input type="date">` grava
 * `AAAA-MM-DD` — que é o formato do contrato e o da máquina —, e a listagem o mostrava
 * cru: «2026-10-16 a 2026-10-30». Na tela, isso não é uma data: é um identificador.
 *
 * A conversão é AQUI, na LEITURA, e não na gravação: o KV continua com o ISO (é ele que o
 * `<input>` devolve ao formulário, que o calendário do plano ordena e que os validadores
 * comparam). Formatar na escrita obrigaria a desformatar em cada um desses consumidores.
 *
 * O que não for uma data ISO volta COMO VEIO — um `?`, um texto antigo, um `AAAA-MM`
 * parcial. Nada de `NaN/NaN/NaN` inventado.
 */
function dataBr(iso) {
  const texto = String(iso == null ? '' : iso).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : texto;
}

/**
 * UMA LINHA DO EDITOR DA RÉGUA (o cadastro da turma e o formulário da régua): um nome de
 * nível e o botão de tirar. A régua é uma LISTA EDITÁVEL — em comitê a escola pode
 * renomear, acrescentar ou remover um nível, e é isto que a deixa mudar sem tocar no código.
 */
function linhaDaRegua(valor) {
  return '<span class="linha-regua"><input name="rubrica" autocomplete="off" value="' +
    esc(valor == null ? '' : String(valor)) + '" placeholder="ex.: Satisfatório">' +
    '<button type="button" class="tirar-regua icone" title="Remover este nível">✕</button></span>';
}

/** O que FALTA numa turma para ela poder receber um plano de ensino. Devolve a lista dos
 *  campos em falta, na linguagem da tela — vazia quando a turma está completa.
 *
 *  O RITMO DO CICLO é decisão da ESCOLA (IDEIA-PAINEL-ESCOLA §8.3): frequência, dias,
 *  duração e o período do termo. Sem ele não há dose, não há calendário e não há número
 *  total de aulas — e o plano sairia com quatro campos vazios para o professor adivinhar.
 *  Por isso a turma não nasce pela metade (16/10/2026) e não se atribui uma turma
 *  incompleta na curadoria.
 */
/**
 * A FREQUÊNCIA É CALCULADA PELOS DIAS (18/10/2026).
 *
 * O campo `frequencia` continua no JSON — o plano, a curadoria e a listagem o leem —, mas
 * deixa de ser perguntado: quem declara a frequência são os DIAS marcados. Um dia, uma vez
 * por semana; segunda e quarta, duas; quatro dias, quatro. Pedir as duas coisas era pedir
 * ao professor que contasse por nós, e abria a porta a um registo incoerente (3x/semana em
 * dois dias).
 *
 * A regra vive numa função porque há DOIS lados: o `normalizarTurma` grava o valor, e a
 * leitura (listagem, painel, histórico, validação) o apresenta. Para as turmas gravadas
 * antes desta data, `dias` pode estar vazio — e aí o valor declarado continua a valer:
 * proveniência não reescreve o que já foi dito.
 */
function frequenciaDaTurma(t) {
  const dias = Array.isArray(t && t.dias) ? t.dias.filter(Boolean) : [];
  if (dias.length) return dias.length;
  const n = Number(t && t.frequencia);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function faltaNoRitmoDaTurma(t) {
  const falta = [];
  if (!t) return ['o cadastro da turma'];
  // Cada item vem COM o seu artigo — «os dias da semana», não «dias da semana». É o que faz
  // a frase da mensagem sair direita: quem junta não tem de adivinhar o género.
  // Uma entrada só: a frequência SAI dos dias, e sem dias não há frequência. Antes eram
  // duas verificações, e a frase dizia «os dias da semana» duas vezes.
  if (!Array.isArray(t.dias) || !t.dias.length) falta.push('os dias da semana (é deles que sai a frequência)');
  if (!(Number(t.duracaoMin) > 0)) falta.push('a duração de cada aula');
  if (!String(t.periodoInicio || '').trim()) falta.push('o início do período');
  if (!String(t.periodoFim || '').trim()) falta.push('o fim do período');
  return falta;
}

/** A frase da falta — os itens já trazem o artigo, e aqui só se juntam. */
function fraseDaFalta(falta) {
  if (!falta.length) return '';
  if (falta.length === 1) return falta[0];
  return falta.slice(0, -1).join(', ') + ' e ' + falta[falta.length - 1];
}

/**
 * A PRIMEIRA LINHA de uma lista simples: o nome e os selos, num grupo que NÃO QUEBRA.
 *
 * Por que um grupo explícito (18/10/2026). A regra das duas linhas era `flex` + `wrap` com
 * o complemento em `flex: 0 0 100%`. Funcionou até o nome e um selo não caberem juntos: com
 * `wrap`, o selo DESCE para uma linha própria em vez de o nome encolher — num contentor
 * flex que quebra, os itens são distribuídos por linhas ANTES de qualquer encolhimento, e um
 * item sozinho na sua linha nunca encolhe. Medido a 390px: «Balé nível 1, Grade 1» + «Régua
 * do Nível 1» davam TRÊS linhas em vez de duas, e a altura voltava a oscilar.
 *
 * Com o grupo em `nowrap`, quem cede é o NOME (reticências) e o selo fica sempre ao lado
 * dele. Duas linhas, sempre — do telefone à tela cheia.
 */
function linhaDoNome(nome, selos, href) {
  // `href` É OPCIONAL (18/10/2026): a curadoria liga o nome do professor ao plano de
  // ensino dele quando ele já existe. O nome continua a ser ESCAPADO — o link é o
  // invólucro, não uma porta para markup.
  const dentro = href
    ? '<a class="nome-link" href="' + esc(href) + '" title="Abrir o plano de ensino deste professor">' +
      esc(nome) + '</a>'
    : esc(nome);
  return '<span class="linha1"><b>' + dentro + '</b>' + (selos ? ' ' + selos : '') + '</span>';
}

/** A COR DE CADA DEGRAU DA RÉGUA (18/10/2026). A régua é uma escala, e uma escala sem
 *  cor obriga a ler as quatro palavras para saber onde a turma está. O mapeamento é por
 *  NOME, e não por posição, porque a escola pode criar uma rubrica própria com outros
 *  nomes e reordená-la — e aí a posição mentiria. Quando o nome não é nenhum dos
 *  canónicos, cai numa rampa pela posição, e o último degrau é sempre o neutro: é o que
 *  «não se aplica» significa em qualquer rubrica. */
function classeDoNivel(nome, indice, total) {
  const n = String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (/satisf/.test(n)) return 'nivel-ok';
  if (/raz(o|ó)avel/.test(n)) return 'nivel-razoavel';
  if (/desenvolv/.test(n)) return 'nivel-alerta';
  if (/nao se aplica|n\/a|neutro/.test(n)) return 'nivel-neutro';
  if (indice === total - 1) return 'nivel-neutro';
  if (indice === 0) return 'nivel-ok';
  if (indice === 1) return 'nivel-razoavel';
  return 'nivel-alerta';
}

/** Monta o objeto-turma canónico a partir do que a Produção envia. */
function normalizarTurma(corpo) {
  const nome = String(corpo.nome || '').trim();
  const ordem = Number.isFinite(Number(corpo.ordem)) ? Number(corpo.ordem) : null;
  const inteiro = (v) =>
    v === undefined || v === null || String(v).trim() === '' || !Number.isFinite(Number(v))
      ? null
      : Number(v);
  const dias = (Array.isArray(corpo.dias) ? corpo.dias : String(corpo.dias || '').split(','))
    .map(normalizarDia)
    .filter(Boolean)
    .filter((d, i, arr) => arr.indexOf(d) === i);
  // A HORA DE INÍCIO DE CADA DIA (16/10/2026). É a hora que a aula COMEÇA naquele dia da
  // semana — e é do DIA, não da turma: a direção pode ter a turma às 9h na terça e às 11h na
  // quarta, e essa flexibilidade é dela. A hora final não se declara: sai da hora de início
  // mais a duração, e é dela que o CALENDÁRIO conta o fim do bloco (o prazo de lançamento
  // conta do fim da aula — ARQUITETURA-AULA §3.1).
  //
  // Só entra a hora de um dia que existe na turma, e só no formato HH:MM. O que não casar é
  // DESCARTADO, como o `normalizarDia` faz com o dia: melhor uma hora a menos — que a
  // validação do ritmo anuncia — do que uma hora errada a produzir um calendário errado.
  const crus = (corpo.horarios && typeof corpo.horarios === 'object' && !Array.isArray(corpo.horarios))
    ? corpo.horarios : {};
  const horarios = {};
  for (const d of dias) {
    const h = String(crus[d] == null ? '' : crus[d]).trim();
    if (/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(h)) horarios[d] = h;
  }
  return {
    id: idDe(nome),
    nome: nome,
    ordem: ordem,
    programaReferencia: String(corpo.programaReferencia || '').trim(),
    nivelReferencia: String(corpo.nivelReferencia || '').trim(),
    descricao: String(corpo.descricao || '').trim(),
    // O RITMO DA TURMA — decisão da DIREÇÃO, não da cena (IDEIA-PAINEL-ESCOLA §8.3: «não
    // tem frequência semanal — vem do contrato»). É o que desce para o plano de ensino:
    // frequência, dias, duração e o período do termo. O plano LÊ; não reescreve.
    // CALCULADA, e não perguntada: é o número de dias marcados. O valor que vier no corpo
    // só vale quando não há dias — é o caso de um registo antigo ou de um pedido que ainda
    // mande o campo à mão.
    frequencia: dias.length || inteiro(corpo.frequencia),
    dias: dias,
    // A hora de início de cada dia da semana — ver o bloco acima. Aditivo: uma turma sem ela
    // continua a ler-se, e é o que permite os dois modelos conviverem.
    horarios: horarios,
    duracaoMin: inteiro(corpo.duracaoMin),
    periodoInicio: String(corpo.periodoInicio || '').trim(),
    periodoFim: String(corpo.periodoFim || '').trim(),
    // A RÉGUA PRÓPRIA da turma. Depois de 15/10/2026 quem manda é `rubricaId` (a rubrica
    // criada na Produção e ligada à turma) — este campo é o que existia antes e continua a
    // valer para quem já o tinha. O cadastro NÃO o preenche mais: nasce vazio, e o padrão é
    // aplicado na LEITURA (`rubricaDaTurma`), para uma turma nova não carregar uma cópia do
    // padrão que a impede de distinguir «não escolhi» de «escolhi o padrão».
    rubrica: niveisLimpos(corpo.rubrica),
    rubricaId: String(corpo.rubricaId || '').trim(),
    ativo: corpo.ativo !== false,
  };
}

/** Monta o objeto-termo canónico a partir do que a Produção envia. */
function normalizarTermo(corpo) {
  const termo = String(corpo.termo || '').trim();
  const altos = Array.isArray(corpo.alternativos)
    ? corpo.alternativos.map((a) => String(a).trim()).filter(Boolean)
    : [];
  return {
    id: idDe(termo),
    termo: termo,
    categoria: String(corpo.categoria || '').trim(),
    tradicao: String(corpo.tradicao || 'compartilhada').trim(),
    alternativos: altos,
    descricao: String(corpo.descricao || '').trim(),
    fonte: String(corpo.fonte || '').trim(),
    observacoes: String(corpo.observacoes || '').trim(),
  };
}

/**
 * A lista de opções do formulário do plano: `{valor, rotulo}` (o contrato de `opcoesDe`).
 * O `valor` é o NOME de exibição (não o `id`): o derivador do plano/PO imprime o valor
 * direto como «Turma», e o nome é o que a ficha deve mostrar. O `id` (slug) continua a
 * viver no cadastro e nas relações — mas a referência do plano é de LEITURA humana.
 */
function opcoesDeTurmas(lista) {
  return lista
    .filter((t) => t && t.ativo !== false)
    .slice()
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((t) => ({ valor: t.nome, rotulo: t.nome }));
}

/** As modalidades declaradas (biblioteca/modalidades/modalidades.json), como opções. */
const MODALIDADES = require('../../biblioteca/modalidades/modalidades.json');

/** A lista de tradições adotáveis na curadoria — as de `tradicoes.json`, SEM «compartilhada»
 *  (que descreve um termo, não a tradição que a escola adota). */
function tradicoesAdotaveis() {
  return (CATALOGO.TRADICOES || []).filter((t) => t !== 'compartilhada');
}

/** OS NÍVEIS que o formulário da turma oferece: os `nivelReferencia` do catálogo. Não é uma
 *  lista inventada — é a que o próprio catálogo usa (`progressao.json`), e é ela que a escola
 *  pode ampliar cadastrando turmas com outros. */
function niveisDoCatalogo() {
  const vistos = [];
  for (const t of (CATALOGO.TURMAS || [])) {
    const n = String((t && t.nivelReferencia) || '').trim();
    if (n && vistos.indexOf(n) === -1) vistos.push(n);
  }
  return vistos;
}

/**
 * UMA ESCOLHA CLICÁVEL EM LINHA. O `<input>` continua a ser o MESMO (mesma `name`, mesmo
 * `value`): o que muda é a pele — quem se vê e quem se clica é o rótulo em pílula, e não uma
 * caixinha marcável dentro de uma caixa com rolagem dentro do formulário. O contrato do
 * servidor não muda em nada por causa disto.
 *
 * A PÍLULA SERVE PARA POUCA COISA, E É ISSO QUE A DEFINE. Sete dias da semana, curtos e
 * fixos, cabem todos à vista e a escolha é um clique — aí ela é a melhor forma. As 13 turmas,
 * as alunas e os 84 termos do vocabulário NÃO cabem: viram um tapete de pílulas e o
 * formulário fica poluído (foi o que aconteceu, e o dono do produto recusou). Para esses, o
 * `escolhedor` abaixo.
 */
function pilula(nome, valor, rotuloHtml, tipo, marcado) {
  // O `tipo` existe desde 18/10/2026, e não é enfeite: a escolha de UM entre poucos é um
  // `radio`, e a de VÁRIOS é um `checkbox`. As duas usam a MESMA peça da folha — o desenho
  // vem do `:checked`, não do tipo —, mas quem lê a tela com leitor de ecrã precisa da
  // diferença, e quem envia o formulário também.
  // O `checked` é escrito pelo SERVIDOR: a opção em vigor é o que está guardado, e não o que
  // um script deduziu depois de a página pintar.
  const t = tipo === 'radio' ? 'radio' : 'checkbox';
  return '<label class="escolha"><input type="' + t + '" name="' + esc(nome) + '" value="' + esc(valor) + '"' +
    (marcado ? ' checked' : '') + '>' +
    '<span>' + rotuloHtml + '</span></label>';
}

/**
 * O ESCOLHEDOR — a lista longa, em dois tempos: escolhe no menu, clica em «Adicionar», e o
 * escolhido aparece em FICHA, com o botão de tirar. Nada de `<select multiple>` (que exige
 * Ctrl+clique e não mostra o que está escolhido) e nada de um tapete de pílulas.
 *
 * O critério, dito uma vez: **pílula** para escolha curta, fechada e fixa; **escolhedor**
 * para lista longa ou variável.
 *
 * JÁ TENTEI UM LOOKUP, E NÃO SERVIU. Para os 84 termos do vocabulário usei um `<datalist>`
 * (campo de procura com sugestões) — a ideia era não percorrer 84 linhas de menu. O que
 * aparece ao clicar NÃO é nosso: é a janela do próprio navegador, que não aceita estilo e
 * saiu com fundo escuro, estreita e apertada, ao lado de menus claros e largos. Como o
 * `<select>` nativo já faz busca por digitação (escrever «ara» salta para «Arabesque»), o
 * que o lookup acrescentava era pouco e o que custava era o desenho. Ficou UM componente só
 * — o mesmo para as turmas, as alunas, o repertório e os níveis.
 *
 * E isso tirou um defeito de uma vez: o `<select>` só oferece o que existe, então não há
 * como o formulário entregar um termo inventado (a associação turma↔termo é POR NOME).
 *
 * O que o formulário envia não muda: cada ficha volta como um dos valores de antes.
 */
function escolhedor(id, opcoes) {
  const lista = (opcoes || []).map((o) => ({
    valor: String(o && o.valor != null ? o.valor : ''),
    rotulo: String((o && (o.rotulo || o.valor)) || ''),
  })).filter((o) => o.valor);
  return '<div class="escolhedor" id="' + esc(id) + '">' +
    '<div class="escolhidos"><span class="vazio">(nada escolhido ainda)</span></div>' +
    '<div class="entrada">' +
    '<select class="opcoes"><option value="">— escolher —</option>' +
    lista.map((o) => '<option value="' + esc(o.valor) + '">' + esc(o.rotulo) + '</option>').join('') +
    '</select>' +
    '<button type="button" class="adicionar acao pequena">Adicionar</button>' +
    '</div>' +
    '</div>';
}

/** O rodapé de uma lista paginada. O servidor NÃO escolhe a página: quem pagina é o
 *  navegador (a lista já veio inteira). Sem JavaScript, o rodapé não aparece e a lista
 *  mostra tudo — degradar para «mostra tudo» é melhor do que esconder itens sem como
 *  alcançá-los. */
function rodapePaginacao() {
  return '<div class="paginacao" hidden>' +
    '<button type="button" class="pag-ant acao secundario pequena" aria-label="Página anterior">‹</button>' +
    '<span class="pag-info"></span>' +
    '<button type="button" class="pag-prox acao secundario pequena" aria-label="Página seguinte">›</button>' +
    '</div>';
}

/** As curadorias da escola: uma LISTA de `{id, professor, modalidade, tradicao, turmas,
 *  repertorio, alunas}` — um professor pode ter mais de uma (a regra é da escola). */
async function curadorias(kv, escola) {
  try {
    const t = await kv.get(RAIZ + '/' + escola + '/curadorias');
    const v = t ? JSON.parse(t) : [];
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

/**
 * O id estável de uma curadoria: o slug de `professor + modalidade + turma` (16/10/2026).
 *
 * A TURMA ENTRA NO ID. Sem ela, o id era `professor + modalidade` — e atribuir o MESMO
 * professor na MESMA modalidade a uma segunda turma caía no mesmo id: o `upsert` substituía
 * a curadoria anterior, e a primeira turma desaparecia da atribuição, em silêncio. Não era
 * um erro de gravação: era a identidade a dizer que a segunda turma ERA a primeira.
 *
 * A turma é obrigatória aqui — uma curadoria sem turma não autoriza plano nenhum, e o id
 * sem ela traria de volta a colisão que se está a corrigir.
 */
function idCuradoria(professor, modalidade, turma) {
  const base = slugificar(String(professor || '') + ' ' + String(modalidade || ''));
  const t = slugificar(String(turma || '').trim());
  return t ? base + '-' + t : base;
}

/**
 * ACHA a curadoria que corresponde a `(professor, modalidade, turma)` — para editar em vez de
 * duplicar, e para o id antigo não ficar órfão ao lado do novo.
 *
 * Há dois formatos em campo, e os dois têm de resolver:
 *
 *   - **com turma no id** (`tiago-menegaz-bale-classico-teste`) — o formato desde 16/10/2026;
 *   - **sem turma no id** (`tiago-menegaz-bale-classico`) — tudo o que foi gravado antes. Ele
 *     resolve quando a turma que declara é a que se está a pedir: é a MESMA curadoria, e o
 *     registo é editado onde está, sem migração de chave.
 *
 * Sem esta segunda linha, o primeiro `Salvar` depois do deploy criaria um registo novo ao lado
 * do antigo, e a lista passaria a mostrar a mesma atribuição duas vezes.
 */
function acharCuradoria(lista, professor, modalidade, turma) {
  const alvo = String(turma || '').trim();
  const vigentes = (Array.isArray(lista) ? lista : []).filter((c) => c && !c.substituidaPor);
  return vigentes.find((c) => c.id === idCuradoria(professor, modalidade, alvo))
    || vigentes.find((c) => c.id === idCuradoria(professor, modalidade)
      && String(c.modalidade || '') === String(modalidade || '')
      && turmasDaCuradoria(c).indexOf(alvo) !== -1)
    || null;
}

/**
 * AS ALUNAS QUE JÁ ESTÃO COMPROMETIDAS NA MESMA MODALIDADE (16/10/2026).
 *
 * Uma aluna pertence a UMA turma por modalidade — é a mesma razão que fez a turma virar
 * «uma por curadoria»: se ela aparecesse em duas, o plano de uma diria as alunas da outra.
 * A regra vale por MODALIDADE: a mesma pessoa pode estar no balé da turma A e no jazz da
 * turma B, porque são aulas diferentes.
 *
 * Devolve `{ aluna: 'Turma onde ela já está' }` — com a turma, para a recusa poder dizer
 * ONDE a aluna está, e não só que está ocupada. A curadoria que se está a editar fica de
 * fora (`idQueEdita`): as alunas dela não competem consigo mesmas.
 */
function alunasComprometidas(lista, modalidade, idQueEdita) {
  const onde = {};
  for (const c of (Array.isArray(lista) ? lista : [])) {
    if (!c || c.substituidaPor) continue;
    if (idQueEdita && c.id === idQueEdita) continue;
    if (String(c.modalidade || '') !== String(modalidade || '')) continue;
    const turma = turmasDaCuradoria(c)[0] || '(sem turma)';
    for (const a of (Array.isArray(c.alunas) ? c.alunas : [])) {
      if (a && !onde[a]) onde[a] = turma;
    }
  }
  return onde;
}


/** O nome do professor DONO, com a sobreposição editável no KV. O dono vive como SECRET
 *  (PROFESSOR_NOME) e o nome ajustado nos Bastidores fica no KV — o KV vence, para o nome
 *  poder ser corrigido sem tocar no segredo do Worker (a senha continua a do segredo). */
async function nomeDoDono(env, kv, escola) {
  try {
    const t = await kv.get(RAIZ + '/' + escola + '/dono');
    if (t) {
      const o = JSON.parse(t);
      const n = String((o && o.nome) || '').trim();
      if (n) return n;
    }
  } catch (e) { /* sem sobreposição — usa o secret */ }
  return String((env && env.PROFESSOR_NOME) || '').trim();
}

/** A senha da DIREÇÃO (Produção) é a senha do administrador OU a do professor dono. */
function senhaDaDirecaoOk(env, senha) {
  if (!senha) return false;
  if (env && env.SENHA_ADMIN && senha === env.SENHA_ADMIN) return true;
  if (env && env.SENHA_PROFESSOR && senha === env.SENHA_PROFESSOR) return true;
  return false;
}

/**
 * O TOKEN DA DIREÇÃO — a senha deixa de ser guardada no NAVEGADOR (18/10/2026).
 *
 * O problema, dito a usar: depois do login, a página guardava a própria senha em
 * `sessionStorage` para reautenticar cada chamada. Ela ficava LEGÍVEL no navegador — quem
 * abrisse as ferramentas de desenvolvimento lia a senha da direção em claro, e é a mesma
 * senha que abre outros lugares.
 *
 * A solução é um TOKEN ASSINADO, sem estado no servidor: no login, o Worker emite
 * `payload.assinatura`, onde `payload` diz até quando vale e a assinatura é um HMAC-SHA256
 * com uma chave derivada dos segredos que já existem (não há segredo novo para configurar).
 * O navegador guarda o TOKEN, nunca a senha. O servidor valida recomputando o HMAC — não
 * precisa de guardar sessão no KV.
 *
 * O QUE ISTO **NÃO** RESOLVE, e é honesto dizê-lo: um token guardado no navegador continua
 * a ser uma credencial de portador — quem o copiar entra enquanto ele valer (12 horas), e
 * uma falha de XSS na página poderia lê-lo. A diferença é que o token vale só para a
 * Produção, expira, e não é a senha que abre as outras portas.
 */
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function b64url(bytes) {
  const a = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < a.length; i += 1) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlBytes(texto) {
  let s = String(texto == null ? '' : texto).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** A chave do HMAC sai dos segredos que já existem — não há configuração nova. Usa os DOIS,
 *  para o token valer igual independentemente de quem entrou (admin ou professor dono). */
function chaveDoToken(env) {
  const admin = String((env && env.SENHA_ADMIN) || '');
  const prof = String((env && env.SENHA_PROFESSOR) || '');
  return admin + '\u0000' + prof;
}

async function assinarToken(env, corpo) {
  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey(
    'raw', enc.encode(chaveDoToken(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = await crypto.subtle.sign('HMAC', chave, enc.encode(corpo));
  return b64url(assinatura);
}

/** Emite o token: `corpo.assinatura` que diz até quando vale. */
async function tokenDaDirecao(env) {
  const corpo = b64url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })));
  return corpo + '.' + (await assinarToken(env, corpo));
}

/** O token é válido? Assinatura confere e ainda não expirou. */
async function tokenDaDirecaoValido(env, token) {
  const texto = String(token == null ? '' : token);
  const partes = texto.split('.');
  if (partes.length !== 2) return false;
  const esperado = await assinarToken(env, partes[0]);
  if (esperado !== partes[1]) return false;
  try {
    const corpo = JSON.parse(new TextDecoder().decode(b64urlBytes(partes[0])));
    return Number(corpo && corpo.exp) > Date.now();
  } catch (e) {
    return false;
  }
}

/**
 * A PORTA DAS ROTAS DA PRODUÇÃO. Aceita o TOKEN (o caminho normal) ou a senha (o antigo,
 * para não quebrar uma aba aberta de antes do deploy). Toda rota que exigia
 * `senhaDaDirecaoOk(env, corpo.senhaDirecao)` passa a usar esta.
 */
async function autorizacaoDirecaoOk(env, corpo) {
  if (corpo && corpo.token) return tokenDaDirecaoValido(env, corpo.token);
  return senhaDaDirecaoOk(env, String((corpo && corpo.senhaDirecao) || ''));
}

/**
 * A senha da ESCOLA, para ABRIR os dados cifrados do ciclo: a da direção (o administrador ou o
 * professor dono) OU a de qualquer professor cadastrado na escola.
 *
 * É a política mais LARGA que a do `validar-senha`, e de propósito: aquele valida o login DE UMA
 * PESSOA (e por isso é estrito — a senha de um professor nunca vale para outro). Este abre o DADO
 * DA ESCOLA, que não pertence a um professor: quem lança aula pode ser qualquer um da casa, e a
 * coordenação também precisa ler. O dono vem do SECRET; os demais, do KV (hash + sal).
 */
async function senhaDaEscolaOk(env, kv, escola, senha) {
  if (!senha) return false;
  if (senhaDaDirecaoOk(env, senha)) return true;
  const lista = await professores(kv, escola);
  for (const p of lista) {
    if (!p) continue;
    const confere = p.hash
      ? ((await hashSenha(senha, p.sal)) === p.hash)
      : (p.senha === senha); // legado (pré-hash), como no `validar-senha`.
    if (confere) return true;
  }
  return false;
}

/**
 * O CONTEXTO DA PORTA que os Bastidores conhecem.
 *
 * O que a escola SABE: o slug (var `ESCOLA_SLUG`) e o nome do dono (secret `PROFESSOR_NOME`).
 * O que ela NÃO sabe: o CICLO. Esta escola tem um Worker por ciclo, mas o ciclo não é uma
 * `var` do Worker (as vars são `ESCOLA_SLUG` e `ESCOLA_HABILITADA` — medido) e o KV não guarda
 * chave nenhuma dele (as chaves são todas `bastidores/<escola>/…` — medido). Por isso o ciclo
 * é lido da query quando ela vem, e, sem ela, o link da Área do Professor sai sem o ciclo: a
 * página pede o campo, em vez de inventar um número.
 */
function contextoDaPorta(env, escola, url) {
  const professor = slugificar(String((env && env.PROFESSOR_NOME) || ''));
  const ciclo = String((url && url.searchParams.get('ciclo')) || '').trim();
  const partes = [];
  if (professor) partes.push('professor=' + encodeURIComponent(professor));
  if (escola) partes.push('escola=' + encodeURIComponent(escola));
  if (ciclo) partes.push('ciclo=' + encodeURIComponent(ciclo));
  return { professor: professor, ciclo: ciclo, query: partes.join('&') };
}

/** A URL de uma página da porta com o contexto que se tem — e mais nada. */
function urlDaPorta(base, contexto, extra) {
  const partes = contexto && contexto.query ? [contexto.query] : [];
  if (extra) partes.push(extra);
  return base + (partes.length ? '?' + partes.join('&') : '');
}

/**
 * O MESMO menu do pacote do ciclo — e o MESMO markup. A forma da barra (marca vazia,
 * hamburger, `.nav-links`) e os destinos do SISTEMA vivem em `tools/templates/nav-html.js`,
 * que o `gerar_ciclo.sh` também usa. Antes, este bloco era uma segunda cópia do HTML:
 * um `<span>` novo no hamburger tinha de ser lembrado nos dois arquivos.
 *
 * O que muda aqui é só o que é desta página: o contexto (escola/professor/ciclo) entra
 * na query de cada destino, e a página atual ganha `ativo`.
 */
function topnav(contexto, onde, extras) {
  return navSistema({
    atual: onde,
    anamnese: urlDaPorta('/anamnese/', contexto),
    plano: urlDaPorta('/plano-ensino/', contexto, 'fonte=plano'),
    po: urlDaPorta('/plano-observacao/', contexto, 'fonte=po'),
    extras: extras || '',
  });
}

/**
 * A SESSÃO NA BARRA DO SISTEMA — a S5 «sobe e encaixa, com o hambúrguer» (18/10/2026).
 *
 * O problema: no celular, a Produção diz onde se está numa barra própria («PRODUÇÃO ·
 * Painel inicial» e o botão «Seções») que fica no TOPO DO CONTEÚDO. As páginas são
 * longas; a meio da listagem, trocar de secção obriga a voltar ao topo.
 *
 * A resposta escolhida no estudo de opções visuais: quando a página desce, a barra da
 * página SAI (é ela que rola, não é copiada) e o que ela dizia entra na barra do
 * sistema — `PEDAGOGIA · Turmas [Seções] ☰`. Ao voltar ao topo, desfaz-se. Em repouso
 * não custa um pixel de altura, porque as duas peças nascem `display:none`.
 *
 * O QUE NÃO ACONTECE, e é a diferença em relação à S1: o ☰ NÃO anda. Ele tem
 * `margin-left:auto` na barra, e tudo o que entra ANTES dele ocupa o vão que o `auto`
 * estava a preencher — a posição não muda em nenhum dos dois estados. Na S1 a barra
 * recuava inteira e levava o ☰ junto, e quem estava a meio de uma lista tinha de rolar
 * de volta ao topo para sair — o problema que a proposta existia para resolver.
 *
 * A marca («Sistema Lastro») sai ao rolar: é a palavra que dá lugar ao caminho. A logo
 * (o `span.marca`, o lugar que ela vai ocupar) fica nos dois estados.
 */
function sessaoNaBarra() {
  return '<span class="s5-sessao" id="s5-sessao">' +
    '<small id="s5-grupo">Produção</small>' +
    '<span class="nome" id="s5-nome">Painel inicial</span></span>' +
    '<button type="button" class="s5-secoes" id="s5-secoes" aria-expanded="false" ' +
    'aria-controls="lateral-lista">Seções<span class="seta" aria-hidden="true">▾</span></button>';
}

/** O cabeçalho comum das vistas dos Bastidores: a folha do ciclo (a MESMA do pacote,
 *  servida por este Worker) e, DEPOIS dela, o `<style>` da vista — que manda. */
function cabecalhoDaVista(titulo, aparencia) {
  // A APARÊNCIA VEM DO SERVIDOR (18/10/2026), nos DOIS eixos. Ela entra no `<html>` antes de a
  // página sair, e o `data-modo-fonte="escola"` diz de QUEM é a decisão: é esse atributo que
  // faz o `assets/nav.js` não aplicar por cima a escolha antiga do navegador. O «anti-flash»
  // que aqui estava — um script a ler `localStorage` antes de pintar — sai: já não há nada
  // para evitar, porque o atributo chega pronto.
  //
  // `data-paleta` ACOMPANHA `data-modo` em vez de o substituir: são eixos independentes
  // (família × modo), e a folha cruza-os por seletor. Ausente, o atributo significaria «a
  // família padrão» por acidente; escrito, a página DECLARA de que família é — e é isso que a
  // prova confere.
  const ap = aparenciaDaVez(aparencia);
  const modo = ap.modo;
  return '<!doctype html><html lang="pt-BR" data-modo="' + modo + '" data-paleta="' +
    esc(ap.paleta) + '" data-modo-fonte="escola">' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + '</title>' +
    '<link rel="stylesheet" href="/assets/style.css">';
}

/** Normaliza a aparência que chega às vistas: aceita o par, e nunca devolve `undefined`.
 *  Uma vista chamada sem aparência (as provas e o servidor de desenvolvimento fazem isso) cai
 *  no padrão — não em atributo vazio. */
function aparenciaDaVez(aparencia) {
  const a = aparencia || {};
  return {
    modo: a.modo === 'noturna' ? 'noturna' : 'clara',
    paleta: IDS_DAS_PALETAS.indexOf(a.paleta) === -1 ? PALETA_PADRAO : a.paleta,
  };
}

/** O fim comum: o script da navegação, que mede a barra e abre o hamburger. */
function fimDaVista() {
  return '<script src="/assets/nav.js"></script></body></html>';
}

function paginaEstudio(escola, contexto, aparencia) {
  return cabecalhoDaVista('Bastidores · Estúdio de Dança · ' + escola, aparencia) +
    '<style>' +
    'body{font:17px/1.65 var(--serif);color:var(--texto);background:var(--fundo);margin:0;}' +
    '.vista{max-width:44rem;margin:0 auto;padding:1.6rem 1.25rem;}' +
    '.vista h1{color:var(--marca);}' +
    '.vista p{color:var(--texto-suave);}' +
    '.vista a{color:var(--marca);font-weight:700;}' +
    '</style></head><body data-layout="painel" data-tela="bastidores">' +
    topnav(contexto, 'estudio') +
    '<div class="vista">' +
    '<h1>Estúdio de Dança</h1>' +
    '<p>Esta é a cena — a vista que a direção e o professor partilham. O que a cena produz sobe para cá.</p>' +
    '<p><a href="' + urlDaPorta('/anamnese/', contexto) + '">Abrir a Área do Professor</a> (anamnese, plano de ensino e plano de observação).</p>' +
    '</div>' +
    fimDaVista();
}

function paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs, pares, usosDosEnvelopes, aparencia) {
  // A APARÊNCIA DA ESCOLA (18/10/2026). Vem do KV e é aplicada no SERVIDOR: os dois atributos
  // entram no `<html>` da página, e o `data-modo-fonte` diz de quem é a decisão — é ele que faz
  // o `assets/nav.js` **não** tentar aplicar a escolha antiga do navegador por cima.
  const ap = aparenciaDaVez(aparencia);
  const modo = ap.modo;
  const paleta = ap.paleta;
  // O professor criado pela página `danca` vive como SEGREDO (PROFESSOR_NOME, com o nome
  // ajustável no KV) e é o «dono» da escola; os professores ADICIONAIS cadastrados aqui
  // vivem no KV. O dono entra primeiro e recebe «Editar» (não «Excluir»): ele é o contato
  // da escola, e o segredo do Worker é outra fronteira. A lista não duplica.
  const donoNome = String(dono || '').trim();

  // AS REGRAS DE PROVENIÊNCIA, CALCULADAS UMA VEZ (18/10/2026). É a mesma pergunta que a
  // curadoria já fazia — «isto já entrou num plano de ensino?» —, feita para cada coisa que
  // a escola cadastra. O padrão é o da curadoria: selo `livre`/`vinculada`, e o que está
  // vinculado não se exclui.
  const usos = usosDosEnvelopes || (() => {
    const u = { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 };
    for (const p of (pares || [])) {
      if (p && p.professor) u.professores.add(p.professor);
      if (p && p.turma) u.turmas.add(p.turma);
    }
    return u;
  })();
  // A turma VINCULADA é a que os envelopes declaram — é o mesmo conjunto que o cartão usa.
  // Guarda os NOMES; os IDs são resolvidos mais abaixo, quando `listaTurmas` já existe (a
  // relação turma↔conteúdo é chaveada por ID, e comparar ID com NOME nunca casaria).
  const nomesDeTurmasVinculadas = new Set((pares || []).map((p) => p && p.turma).filter(Boolean));

  // --- TURMAS e VOCABULÁRIO (Bloco 3 do plano de ensino) --------------------
  // Os CARTÕES e as opções de curadoria são as turmas VIGENTES (16/10/2026). As substituídas
  // saem da operação e entram num histórico fechado no fim do cartão — a escola precisa de as
  // ver para saber que o ajuste foi feito, mas não pode voltar a escolhê-las.
  //
  // ESTE BLOCO SUBIU PARA ANTES DAS LISTAS (18/10/2026): as linhas de Professor, Aluna e
  // Termo passaram a dizer a que turmas cada um pertence, e para isso precisam do mapa de
  // turmas vigentes — antes ele era calculado depois delas.
  const todasAsTurmas = (trms || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const listaTurmas = turmasVigentes(todasAsTurmas);
  const turmasSubstituidas = todasAsTurmas.filter((t) => t && t.substituidaPor);
  const listaRubricas = (rbs || []).slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  const listaTermos = (trmos || []).slice().sort((a, b) => String(a.termo).localeCompare(String(b.termo)));
  const termoPorId = new Map(listaTermos.map((t) => [t.id, t]));
  const relObj = rel || {};

  // O PROGRAMA DE REFERÊNCIA DA TURMA É UMA TRADIÇÃO (18/10/2026) — a MESMA lista que a
  // curadoria já usa (`tradicoesAdotaveis`: RAD · francesa · Vaganova). «Compartilhada» fica
  // de fora pela mesma razão de lá: ela é o que sobra quando não há tradição declarada, não
  // uma tradição que se escolhe. Um valor antigo que não esteja nesta lista é acrescentado
  // como opção na hora de abrir o formulário — o passado não se reescreve.
  const opcoesProgramaDaTurma = tradicoesAdotaveis().map((t) =>
    '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('');

  // AS TURMAS DE CADA NOME (18/10/2026). A listagem passa a ter uma coluna que diz a que
  // turmas a pessoa/o termo pertence, e o «turmas» dela é um FILTRO: clicado, abre a secção
  // Turmas com a listagem reduzida àquelas turmas. As fontes são as que já existem — não há
  // cadastro novo:
  //   · a ALUNA está numa turma quando a CURADORIA a declara (`c.alunas`);
  //   · o PROFESSOR está numa turma pela curadoria (`c.professor`, o slug) e pelo plano de
  //     ensino (`pares`, que traz `{professor, turma}`);
  //   · o TERMO é usado pela turma quando a relação turma↔conteúdo (`rel`) o aponta — é a
  //     mesma relação que o passo «Associar» grava.
  // Só contam as VIGENTES: a turma substituída continua no histórico, mas já não é a turma
  // de ninguém hoje.
  const cursVigentes = curadoriasVigentes(curs);
  const turmaPorNome = new Map(listaTurmas.map((t) => [String(t.nome), t]));
  const acrescentarTurma = (mapa, chave, nomeDaTurma) => {
    const k = String(chave == null ? '' : chave).trim();
    const t = turmaPorNome.get(String(nomeDaTurma == null ? '' : nomeDaTurma).trim());
    if (!k || !t) return;
    if (!mapa.has(k)) mapa.set(k, []);
    const lista = mapa.get(k);
    if (!lista.some((x) => x.id === t.id)) lista.push(t);
  };
  const turmasDaAluna = new Map();
  const turmasDoProfessor = new Map();
  const turmasDoTermo = new Map();
  for (const c of cursVigentes) {
    for (const nome of turmasDaCuradoria(c)) {
      for (const a of (Array.isArray(c.alunas) ? c.alunas : [])) acrescentarTurma(turmasDaAluna, a, nome);
      acrescentarTurma(turmasDoProfessor, c.professor, nome);
    }
  }
  for (const p of (pares || [])) {
    if (p && p.professor) acrescentarTurma(turmasDoProfessor, p.professor, p.turma);
  }
  for (const t of listaTurmas) {
    for (const idDoTermo of (Array.isArray(relObj[t.id]) ? relObj[t.id] : [])) {
      acrescentarTurma(turmasDoTermo, idDoTermo, t.nome);
    }
  }
  // A COLUNA. Sem turma, não há coluna: a linha continua a dizer «livre» e nada mais — um
  // «turmas · —» seria um botão que não filtra nada. Com turma, o texto NOMEIA as turmas,
  // para se saber a que ela pertence sem clicar; o clique é o filtro.
  // `tipo` é o que a frase do filtro precisa de saber: uma PESSOA tem turmas («as turmas de
  // Vavá»), um TERMO é usado por turmas («as turmas que usam Battement tendu»). Sem ele, a
  // mesma frase serviria às duas coisas e estaria errada numa delas.
  const colunaDeTurmas = (turmas, quem, tipo) => {
    if (!turmas || !turmas.length) return '';
    const ids = turmas.map((t) => t.id).join(',');
    const nomes = turmas.map((t) => t.nome).join(', ');
    return '<span class="turmas-do-nome">' +
      '<button type="button" class="filtrar-turmas acao secundario pequena" data-turmas="' + esc(ids) + '" ' +
      'data-quem="' + esc(quem) + '" data-tipo="' + esc(tipo || 'pessoa') + '" ' +
      'title="Filtrar a listagem de Turmas: ' + esc(nomes) + '">' +
      'turmas · ' + esc(nomes) + '</button></span>';
  };
  const linhasProfs = [];
  if (donoNome) {
    // A LINHA DO DONO PERDEU O SLUG (18/10/2026). Ele era mostrado «para o dono não
    // perder de vista o identificador que a página gravou» — só que o slug é um termo
    // TÉCNICO: ele é a pasta (`professores/<slug>/`), e quem a resolve é o sistema. A
    // direção lia `tiago-menegaz` no meio de uma lista de nomes e não tinha o que fazer
    // com aquilo; se um dia precisar do caminho, o lugar é o diagnóstico, não a lista.
    //
    // E O RÓTULO MUDOU: «dono — criado na página» descrevia COMO o registro nasceu, que
    // é história do sistema, não papel na escola. «Principal» diz o que a pessoa é —
    // e é a única que não se exclui, porque é ela que responde pela escola.
    linhasProfs.push('<li>' +
      '<span class="nome">' + linhaDoNome(donoNome) +
      '<span class="dono">principal</span></span>' +
      colunaDeTurmas(turmasDoProfessor.get(String(donoSlug || '').trim()), donoNome, 'pessoa') +
      '<span class="acoes"><button class="editar acao pequena" data-tipo="dono" data-alvo="' + esc(donoNome) + '" title="Editar o nome do professor principal">Editar</button></span>' +
      '</li>');
  }
  for (const p of profs) {
    if (!p || !p.nome) continue;
    const slug = slugDoProfessor(p);
    // O DONO VEM DO PARÂMETRO, não de `env`. Esta linha já calculou o slug do dono em `env`
    // — e `env` NÃO É PARÂMETRO desta função: o laço só roda quando a lista de professores
    // tem itens, e era aí que a página da Produção quebrava com `ReferenceError: env is
    // not defined` (Error 1101 do Cloudflare, em 15/10/2026). O efeito era o pior possível:
    // o cadastro GRAVAVA o professor (201) e a página morria ao recarregar — «não cadastrou»,
    // para quem estava olhando. O valor já estava aqui, como o 5º parâmetro `donoSlug`.
    if (!slug || slug === donoSlug) continue; // o dono já entrou
    // Só o nome e o botão. O `<b>` é o mesmo da linha do dono: sem ele, o principal
    // parecia de outra natureza — e os dois são professores, um com papel e outro sem.
    // A REGRA DE PROVENIÊNCIA, IGUAL À DA CURADORIA (18/10/2026): enquanto o professor não
    // estiver em nenhum plano de ensino ele é LIVRE (e pode ser excluído); depois, ele é
    // VINCULADO — apagá-lo deixaria o plano a apontar para quem já não existe.
    const profPreso = professorVinculadoA(usos, p);
    const seloProf = profPreso
      ? '<span class="selo vinculada" title="este professor já está num plano de ensino; apagá-lo romperia a proveniência">vinculado</span>'
      : '<span class="selo livre" title="este professor ainda não está em nenhum plano de ensino">livre</span>';
    // AS TURMAS DO PROFESSOR: pelo slug do cadastro e, como o plano pode ter gravado o nome
    // em vez do slug, também pelo slug do nome. As duas chaves descrevem a mesma pessoa.
    const turmasDele = turmasDoProfessor.get(slug) || turmasDoProfessor.get(slugificar(p.nome)) || [];
    linhasProfs.push('<li><span class="nome">' + linhaDoNome(p.nome, seloProf) + '</span>' +
      colunaDeTurmas(turmasDele, p.nome, 'pessoa') +
      '<span class="acoes">' + (profPreso
        ? '<button class="acao secundario pequena" disabled title="Vinculado a um plano de ensino: não se apaga">Excluir</button>'
        : '<button class="apagar acao perigo pequena" data-tipo="professor" data-alvo="' + esc(p.nome) + '" title="Excluir professor">Excluir</button>') +
      '</span></li>');
  }
  const itensProfs = linhasProfs.length
    ? linhasProfs.join('')
    : '<li class="vazia">(nenhum professor cadastrado)</li>';
  // AS ALUNAS seguem a MESMA regra (18/10/2026). O plano de ensino é da turma, mas a
  // CURADORIA declara quem está nela — e é a curadoria que tem plano. Então a aluna fica
  // vinculada quando alguma curadoria que a inclui já virou plano de ensino.
  const itensAlunas = aluns.length
    ? aluns.map((a) => {
        const presa = alunaVinculadaA(pares, curs, a);
        const selo = presa
          ? '<span class="selo vinculada" title="esta aluna está numa curadoria que já tem plano de ensino; apagá-la romperia a proveniência">vinculada</span>'
          : '<span class="selo livre" title="esta aluna ainda não está em nenhuma curadoria com plano de ensino">livre</span>';
        return '<li><span class="nome">' + linhaDoNome(a, selo) + '</span>'
          + colunaDeTurmas(turmasDaAluna.get(String(a).trim()), a, 'pessoa')
          + '<span class="acoes">' + (presa
            ? '<button class="acao secundario pequena" disabled title="Vinculada a um plano de ensino: não se apaga">Excluir</button>'
            : '<button class="apagar acao perigo pequena" data-tipo="aluna" data-alvo="' + esc(a) + '" title="Excluir aluna">Excluir</button>')
          + '</span></li>';
      }).join('')
    : '<li class="vazia">(nenhuma aluna cadastrada)</li>';

  // As opções do <select> de associação (uma por termo). A categoria aparece com o rótulo
  // acentuado — o valor gravado continua a ser a chave sem acento (`posicao`), que é a que
  // os 84 termos do catálogo já usam.
  const opcoesTermo = listaTermos.map((t) =>
    '<option value="' + esc(t.termo) + '">' + esc(t.termo) +
    (t.categoria ? ' — ' + esc(rotuloDaCategoria(t.categoria)) : '') + '</option>').join('');

  // A RÉGUA DE CADA TURMA, JÁ RESOLVIDA (vínculo → própria → padrão). O cartão da turma
  // recebe este mapa para desenhar a escala sem resolver nada: ele mostra o que o servidor
  // decidiu. E as rubricas, por id, para o painel dizer com que rubrica a turma é medida.
  const reguaPorTurma = {};
  for (const t of listaTurmas) if (t && t.id) reguaPorTurma[t.id] = rubricaDaTurma(t, listaRubricas);
  const rubricaPorId = new Map(listaRubricas.map((r) => [r.id, r]));

  // --- OS TRÊS PASSOS DA SECÇÃO TURMAS ---------------------------------------
  // A régua da rubrica estava DENTRO do cadastro da turma: quem cadastrava uma turma tinha de
  // decidir, ali, com que níveis o resultado seria medido — e a régua não é da turma, é da
  // escola. Agora são três atos em sequência, e cada um tem o seu formulário:
  //   1. Turma     — quem, quando, quantas vezes (o cadastro).
  //   2. Rubricas  — a régua, uma vez, com nome.
  //   3. Associar  — qual turma usa qual rubrica, e quais conteúdos ela usa.
  //
  // UMA LISTAGEM SÓ, A MESMA NOS TRÊS (18/10/2026). Antes cada passo tinha a sua — turmas,
  // rubricas, vínculos —, e eram três listas diferentes para a mesma pergunta («o que existe
  // nesta escola?»). A direção pediu uma só: «Turmas cadastradas», sempre. É ela que liga os
  // três passos, e é nela que se vê o que já foi cadastrado enquanto se preenche o resto.

  // Os blocos ocultos de conteúdos, um por turma, para o formulário clonar o da turma que
  // estiver aberto. Ficam FORA da lista (abaixo), e não dentro do `<li>`: um `<div>` com
  // `hidden` dentro de um item de lista flex ainda ocupa um lugar no flex.
  const blocosDeConteudos = [];
  const itensTurmas = listaTurmas.length
    ? listaTurmas.map((t) => {
        const associados = Array.isArray(relObj[t.id]) ? relObj[t.id] : [];
        const nomesAssociados = associados.map((tid) => {
          const o = termoPorId.get(tid);
          return o ? o.termo : tid;
        });
        // A ASSOCIAÇÃO SAIU DA LISTAGEM (18/10/2026). Ela vivia no cartão da turma, ao lado
        // dos chips — e o cartão passou a ser um cartão de LEITURA: quem abre o «?» dos
        // conteúdos vê QUAIS são, e mais nada. Associar e desassociar desceram para o
        // formulário, abaixo da duração da aula, que é o lugar onde a direção decide o que
        // a turma vai usar. O painel mostra; o formulário compõe.
        const chips = nomesAssociados.map((n) => '<span class="chip">' + esc(n) + '</span>').join(' ');
        // A cópia do formulário: os mesmos chips, com o «×» que remove. Fica num bloco
        // oculto por turma, e o `ajustarTurma` clona o da turma que estiver no formulário —
        // assim o markup do chip é escrito UMA vez só (aqui), e não outra vez no JavaScript.
        const chipsAjuste = nomesAssociados.map((n) => '<span class="chip">' + esc(n) +
          ' <button type="button" class="desassociar acao secundario pequena" data-turma="' + esc(t.id) +
          '" data-termo="' + esc(n) + '" title="Remover associação">×</button></span>').join(' ');
        blocosDeConteudos.push('<div class="conteudos-da-turma" data-de="' + esc(t.id) + '" hidden>' + chipsAjuste + '</div>');
        // O ritmo declarado pela direção (frequência, dias, duração e período do termo):
        // é o que desce para o plano de ensino — por isso aparece no cadastro.
        const diasTexto = (t.dias && t.dias.length)
          ? t.dias.map((d) => (t.horarios && t.horarios[d]) ? d + ' ' + t.horarios[d] : d).join(', ')
          : '';
        const ritmo = [
          frequenciaDaTurma(t) ? frequenciaDaTurma(t) + 'x/semana' : '',
          diasTexto,
          t.duracaoMin ? t.duracaoMin + ' min' : '',
          (t.periodoInicio || t.periodoFim)
            ? 'termo ' + dataBr(t.periodoInicio || '?') + '–' + dataBr(t.periodoFim || '?')
            : '',
        ].filter(Boolean).join(' · ');
        const detalhe = [t.nivelReferencia, t.programaReferencia, ritmo].filter(Boolean).join(' · ');
        // A TURMA INCOMPLETA SE ANUNCIA. O ritmo é o que o plano lê — e uma turma sem ele
        // não pode ser atribuída na curadoria. Dizer isto no cadastro é o que faz a direção
        // saber o que falta antes de tentar atribuir (16/10/2026).
        const falta = faltaNoRitmoDaTurma(t);
        // A NOTA da falta, e não mais um selo (18/10/2026): na primeira linha ele competia
        // com o nome; aqui ele se lê depois do nome, e a frase inteira cabe porque o texto
        // encurta em vez de empurrar.
        const avisoDeRitmo = falta.length
          ? '<div class="nota-falta" title="sem isto a turma não pode ser atribuída na curadoria">' +
            '<b>falta</b> <span>' + esc(fraseDaFalta(falta)) + '</span></div>'
          : '';
        // A ESCALA DO CARTÃO USA A RÉGUA RESOLVIDA (18/10/2026). Antes chamava
        // `rubricaDaTurma(t)` SEM a lista, e por isso uma turma ligada a uma rubrica com
        // nome mostrava a escala PADRÃO: a resolução precisa da lista para seguir o
        // `rubricaId`. O mapa `reguaPorTurma` já a tem resolvida, e é dele que sai.
        const regua = reguaPorTurma[t.id] || rubricaDaTurma(t, listaRubricas);
        // O HISTÓRICO do ajuste (16/10/2026): a escola precisa de ver que já mexeu nesta turma
        // e o que valia antes — e fechado, para não competir com a turma vigente. Sobe a
        // cadeia por `substitui`, do mais recente para o mais antigo.
        const porId = new Map(todasAsTurmas.map((x) => [x && x.id, x]));
        const passado = [];
        let cursor = t.substitui ? porId.get(t.substitui) : null;
        while (cursor && passado.length < 20) {
          passado.push(cursor);
          cursor = cursor.substitui ? porId.get(cursor.substitui) : null;
        }
        const historico = passado.length
          ? '<details class="historico"><summary>' +
            passado.length + ' versão(ões) anterior(es)</summary><ul>' +
            passado.map((v) => {
              const r = [
                frequenciaDaTurma(v) ? frequenciaDaTurma(v) + 'x/semana' : '',
                (v.dias && v.dias.length)
                  ? v.dias.map((d) => (v.horarios && v.horarios[d]) ? d + ' ' + v.horarios[d] : d).join(', ')
                  : '',
                v.duracaoMin ? v.duracaoMin + ' min' : '',
                (v.periodoInicio || v.periodoFim)
                  ? dataBr(v.periodoInicio || '?') + '–' + dataBr(v.periodoFim || '?')
                  : '',
              ].filter(Boolean).join(' · ');
              return '<li><span class="dono">até ' + esc(dataBr(v.substituidaEm || '?')) + '</span> ' +
                esc(r || '(sem ritmo)') + '</li>';
            }).join('') + '</ul></details>'
          : '';
        const seloVigencia = t.vigenteDe
          ? '<span class="selo vigencia" title="esta versão da turma vale a partir desta data">ajustada em ' +
            esc(dataBr(t.vigenteDe)) + '</span>'
          : '';
        // LIVRE ou VINCULADA (16/10/2026). É a mesma regra do plano de ensino: uma turma sem
        // plano é cadastro e edita-se; uma turma com plano é linha de base e deriva-se. A
        // escola não precisa de saber a diferença — vê a bandeirinha e o botão certo.
        const vinculada = turmaVinculadaA(
          pares ? new Set(pares.map((p) => p.turma)) : null, t.nome);
        const seloEstado = vinculada
          ? '<span class="selo vinculada" title="esta turma já tem plano de ensino; mexer-lhe muda o passado">vinculada</span>'
          : '<span class="selo livre" title="esta turma ainda não tem plano de ensino; pode ser corrigida">livre</span>';
        const botaoAjuste = vinculada
          ? '<button class="ajustar acao pequena" data-turma-ajustar="' + esc(t.id) + '" data-modo="derivar" ' +
            'title="Derivar: passa a valer a partir de uma data, e a anterior fica no histórico">Derivar</button>'
          : '<button class="ajustar acao pequena" data-turma-ajustar="' + esc(t.id) + '" data-modo="editar" ' +
            'title="Editar a turma (ela ainda não tem plano de ensino)">Editar</button>';
        // O CARTÃO DA TURMA PASSA A SER O HÍBRIDO (18/10/2026). Ele trazia NOVE faixas de
        // informação todas abertas ao mesmo tempo — nome, nível, programa, ritmo, estado,
        // vigência, o aviso de «falta …», a régua em prosa, os conteúdos em chips, o
        // seletor de associação e o histórico — em CADA turma. Numa escola com cinco
        // turmas eram quarenta e cinco faixas.
        //
        // Agora: nome e estado em cima; o ritmo em três NÚMEROS; e cada número abre o seu
        // painel num toque. O painel não é prosa — é a peça: a régua abre com a sua ESCALA
        // de cores, os conteúdos abrem em chips, o ritmo abre em pares rótulo/valor. E
        // quando falta, não é uma frase seca: é a lista do que falta.
        //
        // O aviso de «falta …» também mudou de lugar: era um SELO na primeira linha, onde
        // ele empurrava o nome; agora é uma NOTA abaixo, que se lê ou se ignora.
        const valorRitmo = [
          frequenciaDaTurma(t) ? frequenciaDaTurma(t) + 'x' : '',
          t.duracaoMin ? t.duracaoMin + ' min' : '',
        ].filter(Boolean).join(' · ');
        const camposDoRitmo = [
          ['Frequência', frequenciaDaTurma(t)
            ? frequenciaDaTurma(t) + 'x por semana' + (Array.isArray(t.dias) && t.dias.length
              ? ' (' + t.dias.join(', ') + ')' : '')
            : ''],
          ['Dias e horário', diasTexto],
          ['Duração da aula', t.duracaoMin ? t.duracaoMin + ' min' : ''],
          ['Período', (t.periodoInicio || t.periodoFim)
            ? dataBr(t.periodoInicio || '?') + ' a ' + dataBr(t.periodoFim || '?')
            : ''],
        ];
        const painelRitmo = falta.length
          ? '<div class="frase">Esta turma ainda não tem ritmo — e é o ritmo que o plano lê. ' +
            '<b>Sem ele, a turma não pode ser atribuída na curadoria.</b></div>' +
            '<ul class="lista-falta">' + falta.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
            '<p class="nota">Assim que o ritmo estiver completo, a turma passa a poder ser atribuída.</p>'
          : '<div class="grade">' + camposDoRitmo.map(([k, v]) =>
              '<div><span class="k">' + esc(k) + '</span><span class="v">' + esc(v || '—') + '</span></div>').join('') + '</div>';
        // O PAINEL DA RÉGUA É DE LEITURA (18/10/2026). Ele mostra por que rubrica a turma é
        // medida e a escala dela; não edita. A edição da rubrica é uma das três coisas que o
        // «Editar» do cartão da turma abre, no passo 2 — um segundo botão aqui era a
        // duplicação que o dono do produto mandou remover.
        const rubricaLigada = String(t.rubricaId || '');
        const nomeDaRubrica = rubricaLigada && rubricaPorId.get(rubricaLigada)
          ? rubricaPorId.get(rubricaLigada).nome : '';
        const painelRegua = (nomeDaRubrica
          ? '<p class="nota">Medida por <b>' + esc(nomeDaRubrica) + '</b>.</p>' : '') +
          '<div class="escala">' + regua.map((n, i) =>
            '<span class="' + classeDoNivel(n, i, regua.length) + '">' + esc(n) + '</span>').join('') + '</div>';
        // O «EDITAR RUBRICA» QUE VIVIA AQUI SAIU (18/10/2026). A régua continua a abrir e a
        // mostrar a escala — o painel é LEITURA. A edição da rubrica passou a ser uma das
        // três coisas que o «Editar» do cartão da turma abre, e um segundo botão de edição
        // era exatamente a duplicação que o dono do produto mandou remover.
        const painelConteudos = '<div class="chips">' +
          (chips || '<span class="dono">(nenhum conteúdo associado)</span>') + '</div>';
        const metrica = (rotulo, valor, qual, dica) =>
          '<div class="metrica"><span class="k">' + esc(rotulo) + '</span>' +
          '<span class="v">' + esc(valor) + '</span>' +
          '<button class="q" data-balao="' + qual + '" aria-expanded="false" aria-label="' + esc(dica) + '">?</button></div>';
        return '<li class="turma" data-turma="' + esc(t.id) + '">' +
          '<div class="linha-turma"><span class="nome"><b>' + esc(t.nome) + '</b>' +
          ' ' + seloEstado + (seloVigencia ? ' ' + seloVigencia : '') + '</span>' +
          '<span class="acoes">' +
          botaoAjuste +
          // A TURMA COM PLANO NÃO SE APAGA (18/10/2026) — o selo já existia; o botão não
          // respeitava. O servidor também recusa (é a mesma regra, não uma comodidade).
          (vinculada
            ? '<button class="acao secundario pequena" disabled title="Vinculada a um plano de ensino: não se apaga">Excluir</button>'
            : '<button class="apagar acao perigo pequena" data-tipo="turma" data-alvo="' + esc(t.id) + '" data-nome="' + esc(t.nome) + '" title="Excluir turma">Excluir</button>') +
          '</span></div>' +
          (detalhe ? '<div class="dono">' + esc(detalhe) + '</div>' : '') +
          (avisoDeRitmo || '') +
          '<div class="metricas">' +
          metrica('Ritmo', valorRitmo || '—', 'ritmo', 'ver o ritmo desta turma') +
          metrica('Régua', regua.length === 1 ? '1 nível' : regua.length + ' níveis', 'regua', 'ver a régua desta turma') +
          metrica('Conteúdos', String(associados.length), 'conteudos', 'ver os conteúdos desta turma') +
          '</div>' +
          '<div class="painel" data-painel="ritmo" hidden>' + painelRitmo + '</div>' +
          '<div class="painel" data-painel="regua" hidden>' + painelRegua + '</div>' +
          '<div class="painel" data-painel="conteudos" hidden>' + painelConteudos + '</div>' +
          historico +
          '</li>';
      }).join('')
    : '<li class="vazia">(nenhuma turma cadastrada)</li>';

  // O COMPLEMENTO É UM SÓ, e desce para a segunda linha (18/10/2026). Eram dois `<span
  // class="dono">` separados — categoria e tradição —, e separados eles quebravam onde
  // coubessem: «posição» ficava ao lado do nome e «compartilhada» descia. Agora é um
  // complemento só, com o `·` entre as partes, e ele nunca quebra (a regra das duas
  // linhas, no CSS).
  // O VOCABULÁRIO segue a MESMA regra (18/10/2026), e é o caso em que ela mais pesa: o
  // termo é o que o plano ENSINA. Apagá-lo tira o conteúdo de um plano já feito — e o
  // repertório que o cita passa a apontar para nada. Vinculado quando o plano o declara no
  // repertório, ou quando ele está associado a uma turma que já tem plano de ensino.
  const itensTermos = listaTermos.length
    ? listaTermos.map((t) => {
        const complemento = [rotuloDaCategoria(t.categoria), t.tradicao].filter(Boolean).join(' · ');
        const preso = termoVinculadoA(usos, relObj,
          new Set(listaTurmas.filter((x) => nomesDeTurmasVinculadas.has(x.nome)).map((x) => x.id)), t);
        const selo = preso
          ? '<span class="selo vinculada" title="este termo já é ensinado numa turma com plano, ou consta do repertório de um plano">em uso</span>'
          : '<span class="selo livre" title="este termo ainda não está em nenhum plano de ensino">livre</span>';
        return '<li><span class="nome">' + linhaDoNome(t.termo, selo) +
          (complemento ? '<span class="dono">' + esc(complemento) + '</span>' : '') + '</span>' +
          colunaDeTurmas(turmasDoTermo.get(String(t.id || '').trim()), t.termo, 'termo') +
          '<span class="acoes">' + (preso
            ? '<button class="acao secundario pequena" disabled title="Em uso num plano de ensino: não se apaga">Excluir</button>'
            : '<button class="apagar acao perigo pequena" data-tipo="termo" data-alvo="' + esc(t.termo) + '" title="Excluir termo">Excluir</button>') +
          '</span></li>';
      }).join('')
    : '<li class="vazia">(nenhum termo cadastrado)</li>';

  // --- CURADORIA (Bloco 2 do pedido) ----------------------------------------
  // A LISTA da operação são as VIGENTES (16/10/2026): uma curadoria substituída por uma
  // derivação continua guardada e aparece no histórico da que a substituiu, mas não se oferece.
  // As VIGENTES já foram calculadas acima (`cursVigentes`), para as turmas de cada aluna.
  const listaCuradorias = cursVigentes;
  const profsParaCuradoria = [];
  if (donoNome) profsParaCuradoria.push({ valor: donoSlug, rotulo: donoNome });
  for (const p of profs) {
    if (!p || !p.nome) continue;
    const slug = slugDoProfessor(p);
    if (!slug || slug === donoSlug) continue;
    profsParaCuradoria.push({ valor: slug, rotulo: p.nome });
  }
  const opcoesProfessorCuradoria = profsParaCuradoria.length
    ? profsParaCuradoria.map((p) => '<option value="' + esc(p.valor) + '">' + esc(p.rotulo) + '</option>').join('')
    : '<option value="">— nenhum professor —</option>';
  const opcoesModalidadeCuradoria = (MODALIDADES.modalidades || []).map((m) =>
    '<option value="' + esc(m.nome) + '">' + esc(m.nome) +
    (m.temConteudo ? '' : ' (sem conteúdo ainda)') + '</option>').join('');
  const opcoesTradicaoCuradoria = tradicoesAdotaveis().map((t) =>
    '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('');
  // A TURMA É UM `select` — UMA POR VEZ (16/10/2026), no mesmo formato da modalidade e da
  // tradição. Era um escolhedor de múltiplas, e a lista MENTIA: quem marcava duas turmas
  // estava a dizer que as alunas de uma pertencem à outra, e não pertencem. Quem tem mais
  // turmas faz mais curadorias (uma por modalidade × turma).
  //
  // A turma sem ritmo não se atribui — o plano dela nasceria sem dose nem calendário —, e
  // por isso sai ANUNCIADA no rótulo, com o que falta. Ela continua na lista: a direção
  // precisa de a ver para saber o que corrigir.
  const opcoesTurmaCuradoria = listaTurmas.map((t) => {
    const falta = faltaNoRitmoDaTurma(t);
    return '<option value="' + esc(t.nome) + '">' + esc(t.nome) +
      (falta.length ? ' — falta ' + esc(fraseDaFalta(falta)) + ' (não pode ser atribuída)' : '') +
      '</option>';
  }).join('');
  const escolarAlunasCuradoria = escolhedor('esc-alunas', aluns.map((a) => ({ valor: a })));
  const escolarRepertorioCuradoria = escolhedor(
    'esc-repertorio',
    listaTermos.map((t) => ({ valor: t.termo, rotulo: t.categoria ? t.termo + ' — ' + t.categoria : t.termo }))
  );

  // OS NÍVEIS que o seletor da turma oferece: os do catálogo MAIS os que alguma turma já
  // declara — um nível que a escola já usa não desaparece do formulário por não estar no
  // catálogo (é o caso de quem já cadastrou «Vaganova 3», por exemplo).
  const niveisOferecidos = niveisDoCatalogo();
  for (const t of listaTurmas) {
    for (const parte of String((t && t.nivelReferencia) || '').split(',')) {
      const limpo = parte.trim();
      if (limpo && niveisOferecidos.indexOf(limpo) === -1) niveisOferecidos.push(limpo);
    }
  }

  // TODAS as curadorias, para o histórico; as VIGENTES são as que se listam e se operam.
  const todasAsCuradorias = (curs || []).slice();
  const itensCuradorias = listaCuradorias.length
    ? listaCuradorias.map((c) => {
        const rotuloProfessor = (profsParaCuradoria.find((p) => p.valor === c.professor) || {}).rotulo || c.professor;
        const turmas = turmasDaCuradoria(c);
        const resumo = [
          c.tradicao,
          turmas.length ? turmas.join(' · ') : '',
          (c.repertorio || []).length ? (c.repertorio.length + ' passo(s)') : '',
          (c.alunas || []).length ? (c.alunas.length + ' aluna(s)') : '',
        ].filter(Boolean).join(' · ');
        // LIVRE × VINCULADA — a mesma regra e o mesmo padrão da turma (16/10/2026): enquanto
        // nenhum plano de ensino nasceu desta curadoria, o registo edita-se; depois, deriva.
        const vinculada = curadoriaVinculadaA(pares, c);
        const seloEstado = vinculada
          ? '<span class="selo vinculada" title="já nasceu o plano de ensino desta curadoria; mexer-lhe mudaria o passado">vinculada</span>'
          : '<span class="selo livre" title="ainda não nasceu o plano de ensino desta curadoria; pode ser corrigida">livre</span>';
        // O NOME DO PROFESSOR VIRA O ATALHO PARA O PLANO (18/10/2026). Com plano, o nome é
        // um link para `/plano-ensino/` com o contexto do envelope (professor, escola e
        // ciclo); sem plano, o nome fica exatamente como estava — sem link, sem sublinhado,
        // sem promessa de uma página que ainda não existe.
        //
        // A CONDIÇÃO É O PROFESSOR TER PLANO, e não o par desta curadoria: é o que o pedido
        // diz («ele tiver um plano de ensino»), e é o que o nome dele significa — a página
        // que se abre é a dele. Na escolha do elo, prefere-se o da TURMA desta curadoria; se
        // nenhum casar (o plano pode ter sido gravado com o nome antigo da turma), cai no
        // primeiro plano do professor.
        const urlDoPlanoDaCuradoria = (() => {
          if (!pares) return '';
          const doProfessor = pares.filter((p) => p && p.professor === c.professor);
          if (!doProfessor.length) return '';
          const turmasDa = turmasDaCuradoria(c);
          const par = doProfessor.find((p) => turmasDa.indexOf(p.turma) !== -1) || doProfessor[0];
          const partes = ['professor=' + encodeURIComponent(c.professor)];
          if (escola) partes.push('escola=' + encodeURIComponent(escola));
          if (par.ciclo) partes.push('ciclo=' + encodeURIComponent(par.ciclo));
          return '/plano-ensino/?' + partes.join('&');
        })();
        const seloVigencia = c.vigenteDe
          ? '<span class="selo vigencia" title="esta versão da curadoria vale a partir desta data">ajustada em ' +
            esc(c.vigenteDe) + '</span>'
          : '';
        const botaoAjuste = vinculada
          ? '<button class="ajustar acao pequena" data-curadoria-ajustar="' + esc(c.id) + '" data-modo="derivar" ' +
            'title="Derivar: passa a valer a partir de uma data, e a anterior fica no histórico">Derivar</button>'
          : '<button class="ajustar acao pequena" data-curadoria-ajustar="' + esc(c.id) + '" data-modo="editar" ' +
            'title="Editar a curadoria (ainda não nasceu o plano de ensino dela)">Editar</button>';
        // O HISTÓRICO do ajuste, fechado — sobe a cadeia por `substitui`.
        const porId = new Map(todasAsCuradorias.map((x) => [x && x.id, x]));
        const passado = [];
        let cursor = c.substitui ? porId.get(c.substitui) : null;
        while (cursor && passado.length < 20) {
          passado.push(cursor);
          cursor = cursor.substitui ? porId.get(cursor.substitui) : null;
        }
        const historico = passado.length
          ? '<details class="historico"><summary>' + passado.length +
            ' versão(ões) anterior(es)</summary><ul>' +
            passado.map((v) => '<li><span class="dono">até ' + esc(v.substituidaEm || '?') + '</span> ' +
              esc(turmasDaCuradoria(v).join(' · ') || '(sem turma)') + '</li>').join('') +
            '</ul></details>'
          : '';
        // DUAS LINHAS, como as demais listas: o professor e os selos em cima; modalidade,
        // tradição, turmas, passos e alunas embaixo, num complemento só. A modalidade
        // subiu para a segunda linha porque na primeira ela competia com o nome — e era
        // ela que fazia a linha oscilar de altura entre uma curadoria e outra.
        const complemento = [c.modalidade].concat(resumo ? [resumo] : []).filter(Boolean).join(' · ');
        return '<li><span class="nome">' + linhaDoNome(rotuloProfessor, seloEstado + (seloVigencia ? seloVigencia : ''), urlDoPlanoDaCuradoria) +
          (complemento ? '<span class="dono">' + esc(complemento) + '</span>' : '') + '</span>' +
          '<span class="acoes">' + botaoAjuste +
          (vinculada
            ? '<button class="acao secundario pequena" disabled title="Vinculada a um plano de ensino: não se apaga">Excluir</button>'
            : '<button class="apagar acao perigo pequena" data-tipo="curadoria" data-alvo="' + esc(c.id) + '" title="Remover curadoria">Excluir</button>') +
          '</span>' +
          historico + '</li>';
      }).join('')
    : '<li class="vazia">(nenhuma curadoria atribuída)</li>';

  return cabecalhoDaVista('Bastidores · Produção · ' + escola, { modo: modo, paleta: paleta }) +
    '<style>' +
    // A IDENTIDADE É A MESMA DA RAIZ («criar nova escola») e do pacote do ciclo: as
    // variáveis vêm de `/assets/style.css` (a folha do ciclo, carregada acima), e o que
    // se escreve aqui só as usa. O amarelo próprio (`#fdf6e3`) que existia só neste
    // formulário SAI: era um terceiro tom, e não o fundo dos formulários do sistema.
    '.lateral{position:sticky;top:calc(var(--header-height) + 8px);border-right:1px solid var(--borda-campo);padding-right:.9rem;}' +
    '.lateral h2{font-size:.8rem;letter-spacing:.05em;text-transform:uppercase;color:var(--marca-texto);margin:1rem 0 .2rem;}' +
    '.lateral h2:first-child{margin-top:0;}' +
    '.lateral a{display:block;color:var(--marca);text-decoration:none;padding:.25rem .5rem;border-radius:var(--raio-1);font-size:.95rem;}' +
    '.lateral a:hover{background:var(--fundo-hover);}' +
    '.lateral a.ativo{background:var(--fundo-faixa);font-weight:700;}' +
    // A BARRA E A FOLHA DO CELULAR existem no HTML e ficam OCULTAS na tela larga: o menu
    // em coluna continua a ser o de sempre, e nada disto aparece. São o MESMO elemento que
    // vira folha no celular (`.lateral-lista`) — não há uma segunda lista para envelhecer.
    '.lateral-barra,.lateral-puxador,.lateral-veu{display:none;}' +
    // A GRADE DA VISTA: o menu à esquerda (o mais à esquerda que o conteúdo permite), o
    // formulário no meio, a LISTA à direita. Antes a lista ficava EMBaixo do formulário, e
    // a vista ficava uma coluna comprida: quem cadastra olhava para baixo para conferir.
    // A PÁGINA ALINHA COM A BARRA DO TOPO, E A LISTA FICA COM O RESTO.
    //
    // A barra do topo é `position:fixed` de ponta a ponta, com `padding: 6px 14px` — o
    // «Sistema Lastro» começa a 14px da borda. Era essa a referência que faltava: o painel
    // tinha `max-width:1280px; margin:0 auto; padding-left:22px`, então o menu de secções
    // começava a 22px + a margem do auto, e não ficava embaixo do menu do sistema. Agora o
    // painel usa os MESMOS 14px e não tem teto de largura: o menu alinha com a barra, e a
    // listagem fica com toda a largura que sobra (era o pedido: «pode dobrar o tamanho»).
    // O formulário continua com o teto dele (34rem) — quem cresce é a coluna da lista.
    '.corpo{display:grid;grid-template-columns:11rem minmax(0,1fr);gap:var(--esp-5);align-items:start;padding:var(--esp-5) var(--esp-4) var(--esp-6);}' +
    '.secao{display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
    '.secao>h2{grid-column:1/-1;margin:0;}' +
    // AS ABAS da secção Turmas. O painel de cada aba repete a grade do formulário + lista, e
    // por isso ocupa a linha inteira do `.secao` — a lista continua presa e paginada.
    '.passos{grid-column:1/-1;list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .4rem;margin:.2rem 0 .4rem;padding:0;}' +
    '.passos>li{display:flex;align-items:center;gap:.4rem;}' +
    // O CONECTOR entre os passos é do desenho, não do conteúdo: um traço que só existe
    // entre um passo e o seguinte, e nunca antes do primeiro.
    '.passos>li+li::before{content:"";width:1.1rem;height:1px;background:var(--borda-campo);}' +
    '.passo{display:inline-flex;align-items:center;gap:.5rem;background:transparent;border:1px solid transparent;' +
    'border-radius:999px;margin:0;padding:.32rem .8rem .32rem .38rem;color:var(--texto-suave);' +
    'font:600 .92rem/1.3 var(--ui);cursor:pointer;}' +
    '.passo:hover{background:var(--fundo-hover);color:var(--marca-texto);}' +
    // O NÚMERO é o que diz que isto é uma sequência. Redondo, e não um traço ao lado do
    // texto — um traço lê-se como decoração; um número lê-se como ordem.
    '.passo .passo-n{display:grid;place-items:center;width:1.4rem;height:1.4rem;border-radius:999px;' +
    'background:var(--fundo-faixa);border:1px solid var(--borda-campo);color:var(--marca-texto);font:700 .74rem/1 var(--ui);}' +
    '.passo.ativo{background:var(--superficie);border-color:var(--borda-campo);color:var(--marca);' +
    'box-shadow:var(--sombra-controle, none);}' +
    '.passo.ativo .passo-n{background:var(--marca-fundo);border-color:var(--marca-fundo);color:var(--sobre-marca);}' +
    '.passo:focus-visible{outline:2px solid var(--foco);outline-offset:2px;}' +
    // O CORPO DA SECÇÃO TURMAS: formulário do passo à esquerda, listagem à direita. A
    // listagem vive FORA dos `.passo-painel`, e é isso que a mantém a mesma nos três passos.
    '.turmas-corpo{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
    '.turmas-form{min-width:0;}' +
    // A FAIXA E A SETA (18/10/2026). A faixa É o cabeçalho do acordeão: os três passos
    // continuam à vista (é o que diz onde se está) e a seta é o único controle novo. Sem
    // texto de «recolher»/«abrir» — a seta diz o estado, e o `aria-label` diz o mesmo a quem
    // não a vê. Recolhido, o miolo sai e a listagem sobe.
    '.turmas-faixa{display:flex;align-items:center;gap:.1rem;min-width:0;}' +
    // UMA LINHA, SEMPRE (18/10/2026). A lista quebrava em duas assim que não cabia — e no
    // telefone a seta ao lado bastava para a empurrar. Agora ela NÃO quebra: quem cede é o
    // rótulo de cada passo (reticências), e a seta fica no fim, à direita, logo depois de
    // «Associar». A seta não encolhe (`flex:0 0 auto`) nem a lista a empurra para fora.
    '.turmas-faixa .passos{flex:1 1 auto;grid-column:auto;min-width:0;margin:.2rem 0 .4rem;' +
    'flex-wrap:nowrap;overflow:hidden;}' +
    '.turmas-faixa .passos>li{flex:0 1 auto;min-width:0;}' +
    '.turmas-faixa .passo{min-width:0;}' +
    '.passo-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.alternar-form{flex:0 0 auto;display:grid;place-items:center;width:2rem;height:2rem;margin:0;padding:0;' +
    'border:1px solid var(--borda-campo);border-radius:999px;background:var(--superficie);' +
    'color:var(--texto-suave);font:700 .9rem/1 var(--ui);cursor:pointer;}' +
    '.alternar-form:hover{background:var(--fundo-hover);color:var(--marca-texto);}' +
    '.alternar-form:focus-visible{outline:2px solid var(--foco);outline-offset:2px;}' +
    // RECOLHIDO, A LISTAGEM OCUPA A LARGURA TODA (18/10/2026). A coluna do formulário deixa
    // de existir como coluna: a faixa passa a ser o cabeçalho do acordeão, na linha inteira,
    // e a lista fica sozinha abaixo. É a diferença entre «encolher» e «sair da frente» — e é
    // o que faz o filtro valer a pena no telefone e na tela grande.
    '.turmas-corpo[data-recolhido="sim"]{grid-template-columns:minmax(0,1fr);}' +
    '.turmas-corpo[data-recolhido="sim"] .turmas-faixa{padding:0 0 .2rem;' +
    'border-bottom:1px solid var(--borda-campo);}' +
    '.turmas-corpo[data-recolhido="sim"] .passos{margin:.2rem 0 .45rem;}' +
    // NO TELEFONE, O CONECTOR SAI (18/10/2026). O traço entre os passos custa 1.1rem cada e
    // é ornamento: com ele, três passos e a seta não cabem em 320px de jeito nenhum. Sem ele,
    // o espaçamento entre os passos passa a fazer o mesmo trabalho — e mais nada muda.
    '@media (max-width:560px){' +
      '.turmas-faixa .passos{gap:.12rem;}' +
      '.turmas-faixa .passos>li+li::before{display:none;}' +
      '.turmas-faixa .passos>li{gap:0;}' +
      '.turmas-faixa .passo{position:relative;padding:.26rem .34rem .26rem .26rem;gap:.32rem;font-size:.84rem;}' +
      // O «!» VIRA SELO DE CANTO (18/10/2026). Solto no meio do botão custava 16px em cada
      // passo — 48px nos três — e em 320px é exactamente a diferença entre «Rubricas» e
      // «Rubic…». Ancorado no canto não ocupa largura nenhuma, e continua a dizer o mesmo:
      // está-se a editar.
      '.turmas-faixa .passo .passo-alerta{position:absolute;top:-.16rem;right:-.06rem;' +
      'width:.68rem;height:.68rem;font-size:.5rem;}' +
      '.turmas-faixa .passo .passo-n{width:1.2rem;height:1.2rem;font-size:.7rem;}' +
      '.turmas-faixa .alternar-form{width:1.85rem;height:1.85rem;}' +
    '}' +
    // EM 320px NÃO SOBRA NADA (18/10/2026): com o tipo de .84rem os três rótulos ficavam a
    // 2–3px de caber e as reticências comiam a última letra. Um degrau a menos no tipo — e não
    // um passo a menos na frase — resolve; a sequência continua a ler-se por inteiro.
    '@media (max-width:380px){' +
      '.turmas-faixa .passos{gap:.1rem;}' +
      '.turmas-faixa .passo{padding:.26rem .3rem .26rem .24rem;font-size:.8rem;}' +
      '.turmas-faixa .passo .passo-n{width:1.15rem;height:1.15rem;font-size:.66rem;}' +
      // A SETA TAMBÉM CEDE UM POUCO (18/10/2026). Em 320px os passos ocupavam a largura
      // toda por 1px; sem folga, qualquer diferença de métrica de tipo punha as reticências
      // a comer a última letra. Dois décimos de rem na seta devolvem a folga.
      '.turmas-faixa .alternar-form{width:1.7rem;height:1.7rem;}' +
    '}' +
    // O PAINEL DO PASSO já não tem grade própria: quem alinha formulário e lista é o
    // `.turmas-corpo`. Ele agora só existe/desaparece — o conteúdo é o formulário do passo.
    '.passo-painel{grid-column:1/-1;min-width:0;}' +
    // A COLUNA DA LISTA: começa no topo e vai até o fim do que se vê, sem rolar a página.
    // Quem rola é a lista, por dentro, e a paginação existe para que nem isso precise.
    '.col-lista{display:flex;flex-direction:column;position:sticky;top:calc(var(--header-height) + 8px);' +
    'max-height:calc(100vh - var(--header-height) - 2.2rem);border:1px solid var(--borda-campo);' +
    'background:var(--superficie);border-radius:var(--raio-3);padding:.9rem 1rem .6rem;}' +
    '.col-lista h3{margin:0 0 .5rem;}' +
    '.col-lista .rolagem{overflow-y:auto;min-height:0;flex:1 1 auto;}' +
    '.lista{list-style:none;margin:0;padding:0;}' +
    '.lista li{display:flex;align-items:center;gap:.5rem;padding:.35rem .1rem;margin:0;border-bottom:1px dotted var(--borda-campo);color:var(--texto);}' +
    // O NOME DAS LINHAS SIMPLES, e só delas: `> li > .nome`. Era `.lista li .nome`, um
    // seletor descendente que VAZAVA para dentro da turma (`li.turma > .linha-turma >
    // .nome`) — e ali `flex:1 1 auto` vencia o `flex:1 1 14rem` da linha da turma por
    // especificidade (0,0,3 contra 0,0,2), sem aviso. O mesmo `.nome` era, ao mesmo
    // tempo, o nome que encolhe até o reticências e o nome que precisa de largura para
    // não quebrar em quatro linhas. São dois papéis, e agora são duas regras.
    // A REGRA DAS DUAS LINHAS (18/10/2026). Nas listas simples — vocabulário, curadoria,
    // professores, alunas — a primeira linha é o NOME (com os selos, que são o estado
    // daquela linha) e a segunda é o COMPLEMENTO, e só ele.
    //
    // ANTES o complemento vinha ao lado do nome, e o nome curto o deixava na mesma linha
    // enquanto o longo o empurrava para a segunda: «arabesque · posição compartilhada»
    // ocupava uma linha e «fouetté entre-nan · giro compartilhado» ocupava duas — a altura
    // do bloco OSCILAVA de item para item, e quem troca de página no vocabulário via a
    // lista pular.
    //
    // É `flex`, e não `block`: o `b` e os selos têm de caber JUNTOS na primeira linha, e
    // com `block` o selo descia sozinho (a curadoria ficava com três linhas: nome, selo,
    // complemento). Com o nome em `flex:1 1 auto` e os selos em `0 0 auto`, quem cede
    // espaço é o NOME — ele encurta com reticências, e os dois versos ficam nos seus
    // lugares em qualquer largura, do telefone à tela cheia.
    // DUAS LINHAS, GARANTIDAS (18/10/2026). A primeira é um GRUPO — o nome e os selos —
    // que não quebra: dentro dele quem cede é o nome, com reticências. A segunda é o
    // complemento, e só ele.
    //
    // O grupo existe porque `flex` + `wrap` não bastava: num contentor que quebra, os itens
    // são distribuídos por linhas ANTES de encolherem, e um item sozinho na sua linha nunca
    // encolhe. Quando o nome e o selo não cabiam juntos, o selo DESCLIA para uma linha
    // própria em vez de o nome encurtar — medido a 390px, três linhas em vez de duas.
    '.lista > li > .nome:not(.fixo){display:block;flex:1 1 auto;min-width:0;overflow:hidden;}' +
    '.lista > li > .nome:not(.fixo) > .linha1{display:flex;align-items:baseline;gap:.4rem;' +
      'min-width:0;overflow:hidden;}' +
    // `0 1 auto`, E NÃO `1 1 auto`: com `flex-grow: 1` o nome absorvia todo o espaço livre e
    // empurrava o selo para a margem direita — e na curadoria o «livre» aparecia alinhado
    // com o «Editar»/«Excluir» logo abaixo, com o mesmo desenho de pílula: parecia um botão
    // quebrado. Com `0 1 auto` o selo fica ao lado do nome, onde se lê como o que é — uma
    // etiqueta do nome, não um botão da linha.
    '.lista > li > .nome:not(.fixo) > .linha1 > b{flex:0 1 auto;min-width:0;white-space:nowrap;' +
      'overflow:hidden;text-overflow:ellipsis;}' +
    '.lista > li > .nome:not(.fixo) > .linha1 > .selo{flex:0 0 auto;}' +
    // O NOME DO PROFESSOR CUJA CURADORIA JÁ TEM PLANO (18/10/2026) é um link — e um link
    // que é NOME, não um botão: herda o peso e a cor do `<b>`, e só o sublinhado discreto
    // diz que se pode tocar. Sem sublinhado não se descobre; com cor de link, competiria
    // com os botões da linha.
    '.lista > li > .nome > .linha1 > b > .nome-link{color:inherit;text-decoration:underline;' +
      'text-decoration-color:var(--borda-campo);text-underline-offset:.15em;}' +
    '.lista > li > .nome > .linha1 > b > .nome-link:hover{color:var(--marca);' +
      'text-decoration-color:currentColor;}' +
    '.lista > li > .nome > .linha1 > b > .nome-link:focus-visible{outline:2px solid var(--foco);' +
      'outline-offset:2px;border-radius:2px;}' +
    // `nowrap` + reticências é o que impede a terceira linha: o complemento nunca quebra,
    // ele encurta.
    '.lista > li > .nome:not(.fixo) > .dono{display:block;white-space:nowrap;' +
      'overflow:hidden;text-overflow:ellipsis;}' +
    // O «→ origem» da turma não encolhe: ele diz de onde a régua veio, e não é o nome
    // que se pode truncar. A medida mora aqui, não no atributo `style` do HTML.
    '.lista > li > .nome.fixo{flex:0 0 auto;font-size:.85rem;}' +
    '.lista li .acoes{flex:0 0 auto;display:flex;align-items:center;gap:.35rem;}' +
    // A COLUNA «TURMAS» (18/10/2026). Fica entre o nome e as ações, e NOMEIA as turmas da
    // linha: o texto é o que responde «a que turmas ela pertence?»; o clique é o filtro.
    // Ela cede espaço antes do nome (max-width) e encurta com reticências: numa lista de 84
    // termos, uma turma de nome comprido não pode empurrar o «Excluir» para fora.
    '.lista li .turmas-do-nome{flex:0 1 auto;min-width:0;max-width:15rem;display:flex;justify-content:flex-end;}' +
    '.lista li .turmas-do-nome .filtrar-turmas{display:block;max-width:100%;margin:0;overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap;}' +
    // O AVISO DO FILTRO, no topo da listagem de Turmas: diz de quem são as turmas que
    // sobraram e oferece o caminho de volta sem pedir nada ao servidor.
    '.filtro-turmas{margin:0 0 .55rem;padding:.45rem .6rem;border:1px solid var(--borda-campo);' +
      'border-left:3px solid var(--marca);border-radius:var(--raio-1);background:var(--fundo-faixa);' +
      'font-size:.85rem;line-height:1.5;color:var(--texto);}' +
    '.filtro-turmas .limpar-filtro{margin:0 0 0 .35rem;}' +
    '.lista li.vazia{color:var(--texto-suave);font-size:.9rem;}' +
    '.paginacao{display:flex;align-items:center;justify-content:flex-end;gap:.5rem;padding:.5rem 0 .1rem;font-size:.85rem;color:var(--texto-suave);}' +
    // O FORMULÁRIO: o mesmo papel branco do «criar nova escola», e os campos no creme.
    'form{border:1px solid var(--borda-campo);background:var(--superficie);border-radius:var(--raio-3);padding:1rem 1.1rem;margin:0 0 1rem;}' +
    '.dono{color:var(--texto-suave);font-size:.85rem;}' +

    'label .dica{color:var(--texto-suave);font-weight:400;font-size:.85rem;}' +
    '.sub{color:var(--texto-suave);font-size:.88rem;line-height:1.45;margin:.1rem 0 .6rem;}' +
    'form .nota{color:var(--texto-suave);font-size:.88rem;line-height:1.45;margin:.6rem 0 0;}' +
    'li.turma{display:block;margin-bottom:.6rem;}' +
    '.linha-turma{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;}' +
    // O NOME NUNCA DISPUTA ESPAÇO COM OS BOTÕES. Era `flex:1 1 auto`: numa tela de
    // 360px o nome ficava com 156px e os dois botões com 126px fixos — o nome quebrava
    // em quatro linhas ao lado deles, e a turma parecia acavalada. Com `flex-basis` de
    // 14rem o nome pede 224px; se a linha não couber 224 + 126 + o vão, `.acoes` desce
    // inteira para a linha de baixo (o `flex-wrap`), em vez de espremer o texto.
    // Não é um breakpoint novo: quem decide é o espaço que existe.
    '.linha-turma .nome{flex:1 1 14rem;min-width:0;}' +
    '.linha-turma .acoes{margin-left:auto;}' +
    // O CARTÃO DA TURMA — O HÍBRIDO (18/10/2026). Três NÚMEROS à vista e um painel por
    // número. Tudo em PAPÉIS do sistema (`--fundo-suave`, `--superficie`, `--texto-suave`,
    // `--raio-2`), e não em valores: é o que faz a variante noturna disto funcionar sem uma
    // linha de CSS a mais. A escala da régua usa os três papéis semânticos que já existem
    // — `--ok`, `--alerta`, `--fundo-faixa` —, e não cores novas: uma quarta família de
    // verdes seria uma quarta coisa para manter.
    '.turma .metricas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;margin:.6rem 0 0;}' +
    // EM 320px TRÊS COLUNAS NÃO CABEM: cada uma fica com 78px, e «CONTEÚDOS» a .66rem com
    // `letter-spacing` precisa de mais do que isso — medido, transbordava 7px. Abaixo de
    // 360 a fila passa a uma coluna e a métrica fica larga; é o único ponto em que o desenho
    // cede à largura em vez de truncar a palavra.
    '@media (max-width:360px){' +
      '.turma .metricas{grid-template-columns:minmax(0,1fr);}' +
    '}' +
    '.turma .metrica{position:relative;background:var(--fundo-suave);border:1px solid var(--borda-campo);' +
    'border-radius:var(--raio-2);padding:.45rem 1.9rem .45rem .6rem;min-width:0;}' +
    '.turma .metrica .k{display:block;font:700 .66rem/1.2 var(--ui);letter-spacing:.08em;text-transform:uppercase;' +
    'color:var(--texto-suave);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.turma .metrica .v{display:block;font:700 .95rem/1.25 var(--ui);color:var(--texto);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    // A célula DIZ que está aberta. Sem isto o painel aparece abaixo da fila e não se sabe
    // de onde veio — e com três células iguais, é a única pista.
    '.turma .metrica[data-aberto="sim"]{background:var(--fundo-citacao);border-color:var(--borda-forte);}' +
    '.turma .metrica .q{position:absolute;top:.28rem;right:.28rem;width:1.25rem;height:1.25rem;padding:0;' +
    'border-radius:var(--raio-pilula);border:1px solid var(--borda-campo);background:var(--superficie);' +
    'color:var(--texto-suave);font:700 .72rem/1 var(--ui);display:grid;place-items:center;cursor:pointer;}' +
    // O ALVO DE TOQUE É MAIOR QUE O DESENHO: 28px de área para um círculo de 20px. Um «?» de
    // 20px num telefone pede pontaria, e o dedo tapa o que se quer ler.
    '.turma .metrica .q::before{content:"";position:absolute;inset:-.25rem;}' +
    '.turma .metrica .q[aria-expanded="true"]{background:var(--marca-fundo);color:var(--sobre-marca);border-color:var(--marca-fundo);}' +
    '.turma .painel{margin:.55rem 0 0;padding:.7rem .8rem;background:var(--fundo-citacao);' +
    'border:1px solid var(--borda-campo);border-radius:var(--raio-2);}' +
    '.turma .painel[hidden]{display:none;}' +
    '.turma .painel .grade{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem .9rem;}' +
    '.turma .painel .grade .k{display:block;font:700 .66rem/1.2 var(--ui);letter-spacing:.08em;text-transform:uppercase;color:var(--texto-suave);}' +
    '.turma .painel .grade .v{display:block;font:700 .88rem/1.35 var(--ui);color:var(--texto);}' +
    '.turma .painel .frase{margin:0 0 .6rem;font-size:.88rem;line-height:1.45;color:var(--texto);}' +
    '.turma .painel .lista-falta{list-style:none;margin:0;padding:0;display:grid;gap:.28rem;}' +
    '.turma .painel .lista-falta li{display:flex;align-items:baseline;gap:.45rem;font-size:.88rem;color:var(--texto);}' +
    '.turma .painel .lista-falta li::before{content:"○";font-weight:700;color:var(--alerta);}' +
    '.turma .painel .nota{margin:.6rem 0 0;font-size:.8rem;line-height:1.4;color:var(--texto-suave);}' +
    '.turma .painel .chips{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;}' +
    '.turma .painel .par-associar{display:flex;align-items:center;gap:.35rem;margin-top:.6rem;min-width:0;}' +
    '.turma .painel .sel-termo{flex:1 1 auto;min-width:0;max-width:none;}' +
    '.turma .painel .associar{flex:0 0 auto;}' +
    // O BLOCO DE CONTEÚDOS DO FORMULÁRIO (18/10/2026): os chips da turma com o «×», e o
    // seletor com o botão que associa. O chip e o par são os MESMOS do painel — mudam de
    // sítio e de papel (aqui compõem), não de desenho.
    // OS DOIS BLOCOS DO PASSO 3. `<fieldset>` porque são dois GRUPOS de controles com um
    // título cada — e o `<legend>` é o que um leitor de ecrã anuncia antes de cada um. O
    // desenho do fieldset é zerado e refeito, senão vinha o do navegador.
    '.bloco-assoc{border:1px solid var(--borda-campo);border-radius:var(--raio-2);' +
    'padding:.7rem .8rem .8rem;margin:0 0 1rem;min-width:0;}' +
    '.bloco-assoc>legend{padding:0 .4rem;font:700 .82rem/1.3 var(--ui);color:var(--marca-texto);}' +
    '.bloco-assoc .chips{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;min-height:1.7rem;margin:.1rem 0 .55rem;}' +
    '.bloco-assoc .par-associar{display:flex;align-items:center;gap:.35rem;min-width:0;}' +
    '.bloco-assoc .par-associar select{flex:1 1 auto;min-width:0;max-width:none;}' +
    '.bloco-assoc .par-associar button{flex:0 0 auto;}' +
    '.par-botoes{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:.55rem 0 0;}' +
    // O QUE FALTA, DITO: uma nota âmbar discreta, ao lado do botão que está travado.
    '.nota-pendencia{margin:.5rem 0 0;padding:.4rem .6rem;border-radius:var(--raio-1);' +
    'background:var(--alerta-fundo);border:1px solid var(--borda-campo);' +
    'font:400 .84rem/1.4 var(--ui);color:var(--texto);}' +
    // O PASSO TRAVADO NÃO PARECE MORTO: fica esbatido, e o `title` diz o que falta.
    '.passo:disabled{opacity:.45;cursor:not-allowed;}' +
    '.passo:disabled:hover{background:transparent;color:var(--texto-suave);}' +
    'button:disabled.acao{cursor:not-allowed;}' +
    '.par-botoes button{margin:0;}' +
    '.bloco-assoc .nota{margin:.5rem 0 0;}' +
    // O SELO «sem uso» SAIU (18/10/2026). Ele existia aqui e em nenhum outro lugar: nem no
    // markup desta página, nem na fonte. Um estado de componente que só uma página conhece é
    // exactamente a «segunda identidade» que a Fase 1 fechou — e o neutro que ele desenhava
    // (`--fundo-faixa` + filete de campo) já é o `.selo.discreto` da fonte. Quem precisar de
    // um estado novo declara-o em `tools/templates/ciclo.css`.
    // O «!» DE EDIÇÃO NOS PASSOS (18/10/2026). Aparece SÓ quando se está a editar — é o que
    // anuncia que aqueles passos estão carregados com uma turma/rubrica. Âmbar, redondo e
    // discreto; não é alarme de erro, é sinal de «há o que ajustar aqui». Some no fim da
    // edição, porque fora dela não há nada a chamar a atenção.
    '.passo .passo-alerta{display:none;place-items:center;width:1rem;height:1rem;border-radius:999px;' +
    'background:var(--alerta);color:var(--superficie);font:700 .68rem/1 var(--ui);}' +
    '.passos[data-editando="sim"] .passo .passo-alerta{display:grid;}' +
    // A ESCALA DA RÉGUA. Os quatro degraus com a cor de cada um: uma escala sem cor obriga a
    // ler as quatro palavras para saber onde a turma está.
    '.turma .escala{display:flex;min-width:0;border:1px solid var(--borda-campo);border-radius:var(--raio-2);overflow:hidden;}' +
    '.turma .escala span{flex:1 1 0;min-width:0;text-align:center;padding:.3rem .2rem;' +
    'font:700 .78rem/1.25 var(--ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    // `--superficie` como texto sobre `--ok` e `--alerta` INVIRTE-SE sozinho na noturna: no
    // tema claro o papel é branco e o papel semântico é escuro; na noturna, ao contrário.
    '.turma .escala .nivel-ok{background:var(--ok);color:var(--superficie);}' +
    '.turma .escala .nivel-razoavel{background:var(--ok-fundo);color:var(--ok);box-shadow:inset 0 0 0 1px var(--ok);}' +
    '.turma .escala .nivel-alerta{background:var(--alerta);color:var(--superficie);}' +
    '.turma .escala .nivel-neutro{background:var(--fundo-faixa);color:var(--texto-suave);}' +
    // A NOTA DA FALTA: era um selo na primeira linha, onde competia com o nome; aqui ela vem
    // DEPOIS do nome e a frase inteira cabe, porque o texto encurta em vez de empurrar.
    '.turma .nota-falta{display:flex;align-items:baseline;gap:.4rem;margin:.45rem 0 0;padding:.3rem .55rem;' +
    'background:var(--alerta-fundo);border:1px solid var(--borda-campo);border-radius:var(--raio-1);' +
    'font-size:.8rem;line-height:1.35;color:var(--texto);min-width:0;}' +
    // O ESPAÇO entre `<b>falta</b>` e a frase não é decoração: os dois são itens flex, e o
    // espaço em branco entre eles não é desenhado — mas SEM ele o texto que o leitor de ecrã
    // lê é «faltaa frequência semanal…». O vão visual é do `gap`; o espaço é da leitura.
    '.turma .nota-falta b{flex:0 0 auto;}' +
    '.turma .nota-falta span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.chip{display:inline-block;margin:0;padding:.1rem .45rem;background:var(--fundo-faixa);border:1px solid var(--borda-campo);border-radius:var(--raio-pilula);font-size:.82rem;color:var(--texto);}' +
    // O AVISO DO RITMO EM FALTA: a turma que ainda não pode receber um plano. É um selo
    // âmbar, não um erro — é uma pendência da direção, não um defeito do sistema.
    // O SELO DA VIGÊNCIA e o HISTÓRICO do ajuste da turma (16/10/2026). O selo diz que esta
    // versão da turma nasceu de um ajuste; o histórico, fechado, diz o que valia antes — a
    // escola precisa de saber que mexeu, e não pode confundir o passado com o presente.
    // LIVRE × VINCULADA (16/10/2026): a mesma pergunta do plano de ensino, feita no cadastro.
    // Âmbar é «ainda podes mexer»; o lilás é «isto é linha de base, deriva».
    'details.historico{margin:.35rem 0 0;font-size:.85rem;color:var(--texto-suave);}' +
    'details.historico summary{cursor:pointer;}' +
    'details.historico ul{margin:.25rem 0 0 1rem;padding:0;}' +
    'details.historico li{margin:.1rem 0;}' +
    '.aviso-derivar{margin:0 0 .8rem;padding:.7rem .9rem;border:1px solid var(--ok);border-left:4px solid var(--ok);border-radius:var(--raio-1);background:var(--ok-fundo);}' +
    '.aviso-derivar p{margin:0 0 .5rem;font-size:.88rem;color:var(--texto);line-height:1.45;}' +
    '.aviso-derivar button{margin:0 0 0 .4rem;padding:.15rem .55rem;background:var(--fundo-faixa);color:var(--texto);border:1px solid var(--borda-campo);border-radius:var(--raio-1);font:600 .75rem/1.4 var(--ui);cursor:pointer;}' +
    '.chip button{display:inline-block;margin:0 0 0 .3rem;padding:0 .3rem;background:transparent;color:var(--falha);border:none;font-weight:700;cursor:pointer;}' +
    'select.sel-termo{max-width:16rem;padding:.25rem .4rem;font:0.9rem/1.4 var(--ui);border:1px solid var(--borda-campo);border-radius:var(--raio-1);background:var(--fundo);}' +
    // AS PÍLULAS NÃO SE DECLARAM AQUI (18/10/2026). `.escolhas`/`.escolha` eram desenho de
    // página — e um componente que só existe numa página é um componente que a próxima
    // superfície tem de reinventar. Subiram para `tools/templates/ciclo.css`, ao lado do
    // campo e do selo, e agora vêm com a folha. O QUE FICA AQUI é o composto desta tela: o
    // dia da semana com a sua hora, que não é peça de sistema nenhuma.
    '.dia-hora{display:inline-flex;flex-direction:column;align-items:center;gap:.18rem;}' +
    '.hora-do-dia{width:5.4rem;font-size:.8rem;padding:.12rem .25rem;}' +
    // A HORA SÓ EXISTE PARA O DIA ESCOLHIDO (16/10/2026). Desabilitada, o campo não se
    // preenche por engano — e um horário de um dia que a turma não tem seria descartado na
    // gravação de qualquer forma, mas depois de o ter escrito.
    '.hora-do-dia:disabled{opacity:.4;background:var(--fundo-faixa);cursor:not-allowed;}' +
    // O ESCOLHEDOR: escolhe no menu, «Adicionar», e o escolhido vira ficha com o «×».
    '.escolhedor{margin:.3rem 0 .8rem;}' +
    '.escolhedor .escolhidos{display:flex;flex-wrap:wrap;gap:.35rem;min-height:1.9rem;margin:0 0 .35rem;}' +
    '.escolhedor .escolhidos .vazio{color:var(--texto-suave);font-size:.85rem;line-height:1.9rem;}' +
    '.escolhido{display:inline-flex;align-items:center;gap:.15rem;padding:.15rem .2rem .15rem .65rem;border:1px solid var(--marca);background:var(--fundo-faixa);border-radius:var(--raio-pilula);font-size:.86rem;color:var(--texto);line-height:1.5;}' +
    '.escolhido button{margin:0;padding:0 .35rem;background:transparent;border:none;color:var(--marca);font:700 .95rem/1 var(--ui);cursor:pointer;}' +
    '.escolhedor .entrada{display:flex;gap:.4rem;align-items:center;}' +
    '.escolhedor .entrada select{flex:1 1 auto;width:auto;min-width:0;}' +
    '.escolhedor .entrada button{margin:0;padding:.45rem .85rem;font-size:.86rem;white-space:nowrap;}' +
    // O NOME DA TURMA EM FOCO, no topo dos passos 2 e 3 (18/10/2026). A turma deixou de ser
    // um `select` no passo 3 — ela é a que se acabou de gravar ou a que se mandou editar. O
    // formulário diz qual é, para não haver dúvida sobre a quem a rubrica e os conteúdos vão.
    '.turma-em-foco{margin:0 0 .8rem;padding:.5rem .7rem;border:1px solid var(--borda-campo);' +
      'border-left:4px solid var(--marca);border-radius:var(--raio-1);background:var(--fundo-faixa);' +
      'font:600 .9rem/1.35 var(--ui);color:var(--texto);}' +
    '#vinc-desvincular{margin:.9rem 0 0 .4rem;}' +
    '.linha-regua{display:flex;gap:.4rem;align-items:center;margin:.25rem 0;}' +
    '.linha-regua input{flex:1 1 auto;min-width:0;}' +
    '.linha-regua button{margin:0;flex:0 0 auto;padding:.2rem .5rem;background:transparent;color:var(--falha);border:1px solid var(--borda-campo);border-radius:var(--raio-1);cursor:pointer;}' +
    '[hidden]{display:none!important;}' +
    '#gate{border:1px solid var(--borda-campo);background:var(--superficie);border-radius:var(--raio-3);padding:1rem 1.1rem;max-width:24rem;}' +
    // O título e a apresentação vivem no PORTÃO, não na página: quem já entrou não os vê, e
    // a secção começa pelo seu próprio `<h2>`. Dentro do cartão eles são um cabeçalho, não
    // o `h1` de 31px da folha.
    '#gate h1{font-size:1.35rem;line-height:1.2;margin:0 0 .2rem;}' +
    '#gate p{margin:0 0 .9rem;color:var(--texto-suave);font-size:.9rem;line-height:1.45;}' +
    // O TÍTULO SÓ PARA LEITORES DE ECRÃ: existe na árvore, não no desenho. O pedido é que a
    // página comece no `<h2>` da secção; sem `h1` a estrutura salta um nível, e é isto que
    // mantém a estrutura certa sem pôr texto nenhum à vista.
    '.so-leitor{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;' +
    'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;}' +
    // Abaixo disto, a lista desce para o segundo lugar da grade (não some, e não encolhe
    // até ficar ilegível); abaixo do segundo corte, tudo numa coluna. O primeiro corte era
    // 1080px, e entre 1081 e ~1140 as duas colunas ficavam apertadas demais para o
    // formulário de 34rem — o corte subiu para onde as duas cabem de facto.
    // O CORTE DE CELULAR É **768**, o mesmo do `ciclo.css` que colapsa a barra no
    // hamburger. Antes era 760: entre 761 e 768 o menu do topo já estava colapsado e o
    // painel ainda tinha DUAS colunas — navegação em dobro e 535px para o conteúdo.
    // Um número por conceito: 768 é «celular» em toda a folha.
    //
    // No celular o menu de secções deixa de ser uma coluna de 248px de altura (que
    // empurrava a lista para fora da primeira tela) e vira uma FAIXA horizontal que
    // quebra sozinha. Os `<h2>` continuam no documento — são eles que dão os grupos.
    // O `.turmas-corpo` é a grade que alinha formulário e listagem, e tem de ser desfeita
    // junto com a `.secao`: abaixo de 1140px a `.secao` vira uma coluna e, se o corpo
    // continuasse com duas, a lista de turmas ficaria ao lado do formulário numa tela de
    // telefone, e as duas colunas se sobrepunham.
    '@media (max-width:1140px){.secao,.turmas-corpo{grid-template-columns:minmax(0,1fr);}.col-lista{position:static;max-height:none;}}' +
    // O MENU DA PRODUÇÃO NO CELULAR — A FOLHA INFERIOR (18/10/2026).
    //
    // Como era: os três títulos de grupo e os sete destinos numa fita de 80px que quebrava
    // sozinha, com o título do grupo e o link no MESMO peso visual — «não consigo entender
    // direito o que é título do menu», nas palavras de quem usa.
    //
    // Como é: uma linha com o GRUPO e a PÁGINA em que se está, e um botão «Seções». A lista
    // sobe de baixo — a mesma `.lateral-lista`, com os grupos e os destinos — e desce ao
    // escolher. Fechada, a navegação ocupa 44px; aberta, tapa o conteúdo de propósito, e o
    // véu diz que ali atrás não se clica.
    //
    // O `position: fixed` da folha funciona mesmo dentro da grade do `.corpo` porque nada
    // ali cria contexto de contenção (nem `transform`, nem `filter`) — se um dia criar, a
    // folha passa a ser medida pelo `.corpo` e não pela tela, e este comentário é o aviso.
    //
    // A S5 É DO CELULAR, E SÓ DELE. As duas peças que sobem para a barra do sistema
    // nascem OCULTAS fora de qualquer media query: em tela larga a navegação da página é
    // a coluna da esquerda, e não há sessão a subir. Sem esta regra, o `<span>` e o
    // `<button>` ficariam visíveis na barra em 1280px — visíveis e sem CSS que os
    // desenhasse, porque todo o resto da S5 mora dentro do `max-width:768px`.
    '.topnav .s5-sessao,.topnav .s5-secoes{display:none;}' +
    '@media (max-width:768px){' +
      '.corpo{grid-template-columns:minmax(0,1fr);padding:var(--esp-4) var(--esp-4) var(--esp-6);}' +
      '.lateral{position:static;border-right:none;padding:0 0 var(--esp-3);}' +
      '.lateral-barra{display:flex;align-items:center;gap:var(--esp-3);}' +
      // A BARRA DA PÁGINA SAI DE QUADRO AO ROLAR (18/10/2026). Ela está no fluxo, logo
      // abaixo do menu fixo: sem isto, ela descia por baixo do menu e ficava MEIO visível —
      // e nesse instante havia dois «Seções» e dois «Pedagogia · Turmas» na tela. A S5
      // promete que ela «sobe e sai»; sair é sumir, não ficar espiando por baixo.
      'body[data-descido="sim"] .lateral-barra{display:none;}' +
      // UMA LINHA, e não duas: «PRODUÇÃO» em cima de «Painel inicial» fazia o botão
      // «Seções» assentar entre as duas (o `align-items:center` de um bloco de 33px), e a
      // barra lia-se como três coisas soltas. Em uma linha — grupo miúdo, página, botão —
      // lê-se como um caminho, que é o que ela é. Medido: 77px e 78px viravam 78 e 78.
      '.lateral-atual{min-width:0;display:flex;align-items:baseline;gap:6px;' +
        'font:700 15px/1.25 var(--ui);color:var(--texto);}' +
      '.lateral-atual small{font:700 10px/1.3 var(--ui);letter-spacing:.09em;' +
        'text-transform:uppercase;color:var(--texto-suave);}' +
      // O SEPARADOR é do desenho, não do conteúdo: sem ele o `textContent` dos dois versos
      // corre junto («ProduçãoPainel inicial») e a leitura de ecrã não tem onde respirar.
      '.lateral-atual small::after{content:"·";margin-left:5px;}' +
      '.lateral-abrir{margin-left:auto;flex:0 0 auto;cursor:pointer;' +
        'border:1px solid var(--borda-campo);border-radius:999px;background:var(--superficie);' +
        'padding:.5rem .85rem;font:600 .82rem/1 var(--ui);color:var(--marca);}' +
      '.lateral-abrir:focus-visible{outline:2px solid var(--foco);outline-offset:2px;}' +
      '.lateral-lista{position:fixed;left:0;right:0;bottom:0;z-index:60;' +
        'background:var(--superficie);border-radius:20px 20px 0 0;' +
        'box-shadow:0 -12px 34px rgba(31,28,26,.20);' +
        'padding:0 0 calc(var(--esp-4) + env(safe-area-inset-bottom,0px));' +
        'max-height:78vh;overflow-y:auto;' +
        'transform:translateY(101%);transition:transform .22s ease;}' +
      '.lateral[data-aberta="sim"] .lateral-lista{transform:translateY(0);}' +
      '.lateral-puxador{display:block;width:36px;height:4px;border-radius:2px;' +
        'background:var(--borda-campo);margin:10px auto 2px;}' +
      '.lateral-lista h2{margin:0;padding:var(--esp-3) var(--esp-5) var(--esp-1);' +
        'font:700 10.5px/1 var(--ui);letter-spacing:.1em;color:var(--texto-suave);}' +
      '.lateral-lista a{display:flex;align-items:center;gap:.6rem;' +
        'padding:.8rem var(--esp-5);font-size:1rem;border-radius:0;}' +
      '.lateral-lista a.ativo::after{content:"✓";margin-left:auto;}' +
      '.lateral-veu{display:block;position:fixed;inset:0;z-index:55;' +
        'background:rgba(31,28,26,.36);opacity:0;pointer-events:none;' +
        'transition:opacity .2s ease;}' +
      '.lateral[data-aberta="sim"] .lateral-veu{opacity:1;pointer-events:auto;}' +
      // ===== S5 · A SESSÃO SOBE PARA A BARRA DO SISTEMA (18/10/2026) ==================
      //
      // Em repouso nada disto aparece: as duas peças nascem `display:none` e a barra é
      // exactamente a de hoje (marca, ☰, tema). Ao rolar, a `.lateral-barra` do conteúdo
      // sai de quadro sozinha — é ela que «sobe», não uma cópia — e o caminho entra aqui.
      //
      // A REGRA QUE FAZ A ☰ NÃO ANDAR: ela tem `margin-left:auto`, e o que entra antes
      // dela é o vão que o `auto` preenchia. Nada é inserido DEPOIS da ☰ (o tema já lá
      // estava), e por isso a posição dela é a mesma nos dois estados.
      '.topnav .s5-sessao{display:none;align-items:baseline;gap:6px;min-width:0;' +
        'font:700 12.5px/1.2 var(--ui);color:var(--sobre-marca);}' +
      '.topnav .s5-sessao small{font:700 8.5px/1.2 var(--ui);letter-spacing:.09em;' +
        'text-transform:uppercase;color:var(--ornamento-forte);flex:0 0 auto;}' +
      // O separador é do desenho: sem ele o `textContent` dos dois versos corre junto
      // («PedagogiaTurmas») e a leitura de ecrã não tem onde respirar.
      '.topnav .s5-sessao small::after{content:"·";margin-left:4px;}' +
      '.topnav .s5-sessao .nome{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
      // O «SEÇÕES» É UM BOTÃO, E PARECE UM (18/10/2026). Antes era texto com uma borda
      // fina — e no telefone dava a impressão de que era preciso um dedo muito delicado
      // para acertar. Agora é PREENCHIDO (o par ouro/sobre-ouro que o próprio sistema já
      // usa no link ativo, e que `check-identidade` mede), com altura de alvo de toque e
      // a seta que diz que ele abre alguma coisa. A área de toque tem 40px de altura: o
      // mínimo confortável é 44, e 40 é o que cabe sem crescer a barra (o ☰ tem 42).
      '.topnav .s5-secoes{display:none;flex:0 0 auto;align-items:center;justify-content:center;gap:5px;' +
        'cursor:pointer;touch-action:manipulation;min-height:2.5rem;padding:.45rem .9rem;' +
        'border:1px solid var(--ativo-fundo);border-radius:999px;' +
        'background:var(--ativo-fundo);color:var(--ativo-texto);' +
        'font:700 12.5px/1 var(--ui);box-shadow:0 1px 2px rgba(0,0,0,.20);}' +
      '.topnav .s5-secoes .seta{font-size:10px;line-height:1;opacity:.85;}' +
      '.topnav .s5-secoes:hover{filter:brightness(1.06);}' +
      '.topnav .s5-secoes:active{transform:translateY(1px);}' +
      '.topnav .s5-secoes:focus-visible{outline:2px solid var(--foco);outline-offset:2px;}' +
      // O `flex:1 1 0` NÃO É ESTÉTICA — É O QUE FAZ O NOME ENCOLHER EM VEZ DE EMPURRAR.
      // O `.topnav` tem `flex-wrap: wrap` (o menu aberto precisa dele), e um contentor que
      // quebra distribui os itens por linhas ANTES de qualquer encolhimento: com
      // `flex-basis:auto`, «Vocabulário técnico» a 320px não encolhia — quebrava a barra em
      // duas linhas e levava o ☰ para o lado e para baixo. Com base 0 a largura hipotética
      // é zero, a linha não quebra, e quem cede é o nome (reticências). O ☰ fica parado,
      // que é a condição da S5.
      '.topnav[data-descido="sim"] .s5-sessao{display:flex;flex:1 1 0;overflow:hidden;}' +
      '.topnav[data-descido="sim"] .s5-secoes{display:inline-flex;}' +
      // A MARCA SAI AO ROLAR. No celular ela é o lugar reservado da logo (o `span.marca`
      // vazio); escondê-la devolve ao caminho a largura que ele precisa, e a logo — que é
      // o que fica — não se perde.
      '.topnav[data-descido="sim"]>.marca{display:none;}' +
    '}' +
    '</style></head><body data-layout="painel" data-tela="bastidores">' +
    topnav(contexto, 'producao', sessaoNaBarra()) +
    '<div class="corpo">' +
    // `data-aberta` é o estado da FOLHA do celular. No HTML ele nasce «nao»: a folha está
    // fechada, e na tela larga o atributo não tem efeito nenhum (o CSS que o lê só existe
    // dentro da media query do celular).
    '<nav class="lateral" aria-label="Seções da Produção" data-aberta="nao">' +
    // A barra do celular: o grupo e a página em que se está, e o botão que abre a folha.
    // Em tela larga ela não aparece — quem navega é a coluna abaixo.
    '<div class="lateral-barra">' +
    '<span class="lateral-atual"><small id="lateral-grupo">Produção</small>' +
    '<span id="lateral-nome">Painel inicial</span></span>' +
    '<button type="button" class="lateral-abrir" id="lateral-abrir" ' +
    'aria-expanded="false" aria-controls="lateral-lista">Seções ▾</button>' +
    '</div>' +
    '<div class="lateral-lista" id="lateral-lista">' +
    '<span class="lateral-puxador" aria-hidden="true"></span>' +
    '<h2>Produção</h2>' +
    '<a href="#painel" data-secao="painel">Painel inicial</a>' +
    // A APARÊNCIA ENTRA EM PRODUÇÃO (18/10/2026): a preferência é da escola (C15), e é aqui
    // que só a escola e o professor principal chegam. O grupo é «Configuração» porque não é
    // pedagogia nem pessoa — é a forma da casa.
    '<h2>Configuração</h2>' +
    '<a href="#aparencia" data-secao="aparencia">Aparência</a>' +
    '<h2>Pessoas</h2>' +
    '<a href="#professores" data-secao="professores">Professores</a>' +
    '<a href="#alunas" data-secao="alunas">Alunas</a>' +
    '<h2>Pedagogia</h2>' +
    '<a href="#turmas" data-secao="turmas">Turmas</a>' +
    '<a href="#vocabulario" data-secao="vocabulario">Vocabulário técnico</a>' +
    '<a href="#curadorias" data-secao="curadorias">Curadorias</a>' +
    '</div>' +
    '<div class="lateral-veu" id="lateral-veu"></div>' +
    '</nav>' +
    '<div class="principal">' +
    // O TÍTULO «PRODUÇÃO» NÃO É O TÍTULO DE TODA PÁGINA (18/10/2026). Ele estava AQUI, acima
    // de tudo, e por isso TODA secção começava com «Produção · O gabinete da direção — só a
    // direção entra» antes do que a pessoa foi ver. Quem escolhe «Alunas» quer que a página
    // comece em «Alunas»; o `<h2>` de cada secção já é o título dela.
    //
    // Ele desceu para DENTRO do portão: quem ainda não entrou vê do que é a página antes de
    // escrever a senha; quem já entrou não o vê, porque o portão inteiro se esconde.
    '<div id="gate">' +
    '<h1>Produção</h1>' +
    '<p>O gabinete da direção — só a direção entra.</p>' +
    '<form id="form-senha">' +
    '<label class="campo-rotulo" for="dsenha">Senha da direção</label>' +
    '<input id="dsenha" type="password" autocomplete="current-password" autofocus>' +
    '<button type="submit" class="acao grande">Entrar</button>' +
    '</form>' +
    '<div class="res" id="res-gate"></div>' +
    '</div>' +
    '<div id="conteudo" hidden>' +
    // O `h1` DA PÁGINA FICA PARA QUEM LÊ COM LEITOR DE ECRÃ. Visualmente a página começa no
    // `<h2>` da secção (é o pedido), mas sem um `h1` a estrutura fica com um salto de nível —
    // e um leitor anuncia `h2` sem dizer de que página é. Esta linha é INVISÍVEL: não ocupa
    // espaço, não desloca nada, e não é lida em voz alta para quem vê.
    '<h1 class="so-leitor">Produção</h1>' +
    '<div class="res" id="res"></div>' +
    // Só o Painel inicial nasce visível: as demais secções já vêm com `hidden` do
    // servidor — mesmo que o script da página falhe, a Produção nunca volta a ser
    // uma página só com tudo empilhado (o sintoma quando o script morria).
    '<section class="secao" id="sec-painel">' +
    '<h2>Painel inicial</h2>' +
    '<p>Aqui aparece o que mudou desde a última vez. Use o menu ao lado para gerir pessoas e pedagogia.</p>' +
    '</section>' +
    // A APARÊNCIA DA ESCOLA (18/10/2026). Dois modos, UM valor para a escola inteira.
    //
    // A PEÇA É A PÍLULA, e a primeira versão desta secção errou nisso: usou dois `.acao`
    // dentro de um `<div class="fileira">` — uma classe que NÃO EXISTE na folha, inventada
    // aqui e usada só aqui. Sem desenho, os dois botões encostaram um no outro. O defeito não
    // foi de gosto: foi de vocabulário. Uma AÇÃO é uma ordem que se dá; uma opção em vigor é
    // um ESTADO, e o estado tem peça própria — a pílula, que serve a lista curta, fechada e
    // fixa, e que o formulário da turma já usava nos sete dias da semana.
    //
    // É `radio` e não `checkbox` porque a escolha é UMA. E o `checked` sai do SERVIDOR: a
    // opção em vigor é o que está guardado, não o que um script deduziu depois.
    '<section class="secao" id="sec-aparencia" hidden>' +
    '<h2>Aparência</h2>' +
    '<div class="col-form">' +
    // DOIS EIXOS, DUAS ESCOLHAS, A MESMA PEÇA (18/10/2026). A família e o modo são
    // independentes — a Cortina tem as duas variantes, como a Bordô — e por isso são dois
    // grupos, cada um com a sua legenda. Os nomes das famílias vêm da LISTA DO SERVIDOR
    // (`PALETAS`) e não de uma lista escrita aqui: uma família nova entra num lugar só.
    '<fieldset class="escolhas">' +
    '<legend class="campo-rotulo">Família de cores</legend>' +
    PALETAS.map((p) => pilula('paleta', p.id, esc(p.nome), 'radio', paleta === p.id)).join('') +
    '</fieldset>' +
    '<fieldset class="escolhas">' +
    '<legend class="campo-rotulo">Variante</legend>' +
    pilula('aparencia', 'clara', 'Clara', 'radio', modo !== 'noturna') +
    pilula('aparencia', 'noturna', 'Noturna', 'radio', modo === 'noturna') +
    '</fieldset>' +
    // A LINHA DE APOIO é `.sub`, e não `.nota`: a `.nota` só tem desenho DENTRO de um
    // `<form>` (`form .nota`), e esta secção não é um formulário — o parágrafo saía com o
    // corpo do texto, 17px, ao lado de controles de 14. Era o segundo defeito da mesma
    // família: uma peça usada FORA do contexto em que está declarada.
    '<p class="sub">Vale para a <b>escola inteira</b>: quem abrir esta escola vê o que aqui ' +
    'se escolher. Não é uma preferência de cada um.</p>' +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-professores" hidden>' +
    '<h2>Professores</h2>' +
    '<div class="col-form">' +
    '<form id="form-prof">' +
    '<label class="campo-rotulo" for="pnome">Nome do professor</label>' +
    '<input id="pnome" name="nome" autocomplete="off" placeholder="ex.: Tiago">' +
    '<label class="campo-rotulo" for="psobrenome">Sobrenome ou apelido</label>' +
    '<input id="psobrenome" name="sobrenome" autocomplete="off" placeholder="ex.: Menegaz">' +
    '<label class="campo-rotulo" for="psenha">Senha do professor</label>' +
    '<input id="psenha" name="senha" type="password" autocomplete="new-password">' +
    '<button type="submit" class="acao grande">Cadastrar professor</button>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Professores cadastrados</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensProfs + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-alunas" hidden>' +
    '<h2>Alunas</h2>' +
    '<div class="col-form">' +
    '<form id="form-aluna">' +
    '<label class="campo-rotulo" for="anome">Apelido da aluna (estável, P-12)</label>' +
    '<input id="anome" name="apelido" autocomplete="off" placeholder="ex.: Vavá">' +
    '<button type="submit" class="acao grande">Cadastrar aluna</button>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Alunas cadastradas</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensAlunas + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-turmas" hidden>' +
    '<h2>Turmas</h2>' +
    // O CORPO DA SECÇÃO VEM PRIMEIRO, e a barra dos passos ENTRA NELE (18/10/2026): é ela que
    // passa a ser o cabeçalho do acordeão. Antes ela vivia fora, ocupando a linha inteira da
    // grelha da secção — e um cabeçalho que recolhe tem de estar DENTRO do que recolhe.
    '<div class="turmas-corpo">' +
    '<div class="turmas-form" id="turmas-form" data-recolhido="nao">' +
    '<div class="turmas-faixa">' +
    '<ol class="passos" aria-label="Etapas da turma" data-editando="nao">' +
    // O RÓTULO VAI DENTRO DE UM `<span>` (18/10/2026): é ele que pode encurtar com
    // reticências quando a faixa não couber — um texto solto dentro do botão não encolhe, e
    // era isso que empurrava «Associar» para a segunda linha no telefone.
    '<li><button type="button" class="passo ativo" data-passo="turma" aria-current="step">' +
    '<span class="passo-n">1</span> <span class="passo-t">Turma</span> <span class="passo-alerta" aria-hidden="true">!</span></button></li>' +
    '<li><button type="button" class="passo" data-passo="rubrica">' +
    '<span class="passo-n">2</span> <span class="passo-t">Rubricas</span> <span class="passo-alerta" aria-hidden="true">!</span></button></li>' +
    // «VINCULAR TURMA À RUBRICA» VIROU «ASSOCIAR» (18/10/2026). O passo deixou de ser só o
    // vínculo com a rubrica: é ali que a turma recebe a régua E os conteúdos, e as duas
    // coisas são o mesmo ato — dizer com o que a turma vai ser medida e o que vai ser
    // ensinado nela. «Vincular» é o termo do vínculo com a rubrica; «associar» cobre os
    // dois, e é a palavra que o resto do sistema já usa (`turma-conteudo`, «Associar»).
    '<li><button type="button" class="passo" data-passo="vincular">' +
    '<span class="passo-n">3</span> <span class="passo-t">Associar</span> <span class="passo-alerta" aria-hidden="true">!</span></button></li>' +
    '</ol>' +
    // A SETA DO ACORDEÃO (18/10/2026) — e SÓ ela: sem «Recolher formulário»/«Abrir
    // formulário» escritos. A barra ao lado já diz que estes são os três passos; a seta diz
    // se o miolo está aberto, e o `aria-label` diz o mesmo a quem não a vê.
    '<button type="button" class="alternar-form" id="alternar-form" aria-expanded="true" ' +
    'aria-controls="turmas-paineis" aria-label="Recolher o formulário" title="Recolher o formulário">▾</button>' +
    '</div>' +
    // O MIOLO — os três painéis. É ele que recolhe; a faixa fica.
    '<div id="turmas-paineis">' +
    // O CORPO DA SECÇÃO: à esquerda o FORMULÁRIO DO PASSO (um de cada vez), à direita a
    // LISTAGEM. A listagem é a MESMA nos três passos — «Turmas cadastradas» — e por isso ela
    // vive FORA dos painéis: trocar de passo troca o formulário, nunca a lista.
    // PASSO 1 — A TURMA. Só o que é da turma: quem, quando, com que frequência e por quanto
    // tempo. A régua SAIU daqui: ela é da escola, e mora no passo seguinte.
    '<div class="passo-painel" id="passo-turma">' +
    '<div class="col-form">' +
    '<form id="form-turma">' +
    // O «EDITAR» DA TURMA É UMA DERIVAÇÃO (16/10/2026). A escola pensa que edita; o que fica
    // gravado é um elo novo com data de vigência, e o anterior desce para o histórico. Por
    // isso o formulário ganha um modo: o campo oculto diz de onde se deriva, e a data diz a
    // partir de quando o ajuste vale. Sem o modo, o mesmo formulário cadastra.
    '<input type="hidden" id="tderivar">' +
    '<input type="hidden" id="tmodo">' +
    // O AVISO EXPLICATIVO SAIU (18/10/2026). Quem entra em «Editar» vê o que muda no próprio
    // formulário e tem o «Cancelar» ao lado do «Avançar». Fica só a DATA, quando ela existe:
    // é o único campo que o modo de derivação acrescenta.
    '<div class="aviso-derivar" id="t-vigencia-campo" hidden>' +
    '<label class="campo-rotulo" for="tvigencia">Vale a partir de</label>' +
    '<input id="tvigencia" type="date" autocomplete="off">' +
    '</div>' +
    '<label class="campo-rotulo" for="tnome">Nome da turma</label>' +
    '<input id="tnome" name="nome" autocomplete="off" placeholder="ex.: Balé Nível 1">' +
    // «POSIÇÃO NA LISTA» SAIU (18/10/2026). Era um número que a direção tinha de inventar para
    // dizer o que já sabia: a turma nova é a que acabou de ser criada. O servidor põe cada
    // turma nova no TOPO, e a ordem das antigas não se mexe.
    // O PROGRAMA PASSOU A SER LISTA (18/10/2026), como a tradição da curadoria: a referência
    // é uma tradição, não um texto. O rótulo diz isso mesmo — «(tradição)».
    '<label class="campo-rotulo" for="tprograma">Programa de referência (tradição)</label>' +
    '<select id="tprograma">' +
    '<option value="">— nenhum —</option>' +
    opcoesProgramaDaTurma +
    '</select>' +
    // O NÍVEL é ESCOLHEDOR: escolhe no menu, «Adicionar», e o nível fica em ficha com o «×».
    // A lista são os níveis do catálogo MAIS os que alguma turma já declara — um nível que a
    // escola já usa não desaparece do formulário por não estar no catálogo. O que sai daqui
    // continua a ser UM texto («Grade 3, Grade 4»): o contrato do servidor e o do plano não
    // mudam.
    '<label>Equivalência pedagógica</label>' +
    escolhedor('esc-niveis', niveisOferecidos.map((n) => ({ valor: n }))) +
    '<label class="campo-rotulo" for="tdescricao">Notas sobre esta turma (opcional)</label>' +
    '<input id="tdescricao" name="descricao" autocomplete="off">' +
    // OS DIAS VÊM ANTES DA FREQUÊNCIA, e a ordem é a da causa (18/10/2026): é dos dias que
    // a frequência sai. Era o contrário — perguntava-se «quantas vezes por semana?» e
    // depois os dias, e as duas respostas podiam discordar (3x/semana com dois dias).
    // Agora a frequência não se digita: ela é a CONTAGEM dos dias marcados, mostrada aqui
    // como leitura. O campo continua no JSON (`frequencia`), porque o plano e a listagem o
    // leem — o que saiu foi a pergunta, não o dado.
    '<label>Dias da semana e a hora de início de cada um</label>' +
    '<div class="escolhas" id="tdias">' + DIAS_DA_SEMANA.map((d) =>
      '<span class="dia-hora">' + pilula('dia', d, esc(d)) +
      '<input type="time" class="hora-do-dia" data-dia="' + esc(d) + '" ' +
      'aria-label="hora de início — ' + esc(d) + '" autocomplete="off"></span>').join('') + '</div>' +
    // A LINHA DA FREQUÊNCIA SAIU DO FORMULÁRIO (18/10/2026). Ela ainda era um campo à vista —
    // e um campo à vista pede um número, mesmo quando o número já está decidido pelos dias.
    // A frequência continua a existir no JSON e a aparecer na listagem e no plano; o que saiu
    // foi a pergunta. Quem quiser saber o valor lê no cartão da turma.
    '<label class="campo-rotulo" for="tduracao">Duração de cada aula (minutos)</label>' +
    '<input id="tduracao" name="duracaoMin" type="number" min="5" step="5" autocomplete="off" placeholder="ex.: 60">' +
    // OS CONTEÚDOS SAÍRAM DAQUI (18/10/2026). Estavam neste formulário, abaixo da duração, e
    // o lugar estava errado por uma razão de facto: só se associa conteúdo a uma turma que
    // JÁ EXISTE. Aqui a turma ainda está a nascer — em «cadastrar» não há id, e em «derivar»
    // o id à mão é o da turma antiga. Foram para o passo 3, «Associar», que é o passo em que
    // a turma já existe e recebe a régua e os conteúdos.
    '<label class="campo-rotulo" for="tinicio">Início do período (termo)</label>' +
    '<input id="tinicio" name="periodoInicio" type="date" autocomplete="off">' +
    '<label class="campo-rotulo" for="tfim">Fim do período (termo)</label>' +
    '<input id="tfim" name="periodoFim" type="date" autocomplete="off">' +
    // «AVANÇAR», E NÃO «CADASTRAR TURMA» (18/10/2026). A turma é o primeiro de três passos, e
    // o botão diz o que vai acontecer: o registo é gravado E passa-se ao passo seguinte. O
    // «cadastrar» descrevia o ato isolado — e era o que fazia esta secção parecer três coisas
    // soltas em vez de uma sequência.
    // O QUE FALTA, DITO ONDE SE VÊ (18/10/2026). O botão desabilitado sem explicação é o
    // pior dos mundos: a pessoa olha para um controle apagado e não sabe o que fazer. Aqui
    // a frase nomeia o que falta, e desaparece quando a turma fica completa.
    '<p class="nota-pendencia" id="t-pendencia" hidden></p>' +
    // O CANCELAR É SÓ DO MODO EDIÇÃO e fica ao lado do «Avançar» (18/10/2026): sem texto, sem
    // explicação — um botão. `aplicarEditando` mostra-o quando há algo para cancelar.
    '<span class="par-botoes">' +
    '<button type="submit" class="acao grande" id="t-enviar" disabled>Avançar</button>' +
    '<button type="button" class="acao secundario cancelar-edicao" id="t-cancelar" hidden>Cancelar</button>' +
    '</span>' +
    '</form>' +
    '</div>' +
    '</div>' +
    // PASSO 2 — RUBRICAS. A régua ganha NOME: é o que a torna vinculável a mais de uma
    // turma, e o que impede que a mesma decisão seja redigitada em cada cadastro.
    '<div class="passo-painel" id="passo-rubrica" hidden>' +
    '<div class="col-form">' +
    '<form id="form-rubrica">' +
    '<p class="turma-em-foco" id="rubr-turma" hidden></p>' +
    '<input type="hidden" id="rubr-id">' +
    '<label class="campo-rotulo" for="rubr-nome">Nome da rubrica</label>' +
    '<input id="rubr-nome" autocomplete="off" placeholder="ex.: Padrão">' +
    '<label>Níveis</label>' +
    // OS NÍVEIS NASCEM VAZIOS (18/10/2026). Antes o editor vinha com os quatro níveis padrão
    // («Satisfatório · Razoável · Em desenvolvimento · Não se aplica») já escritos — e isso
    // tinha dois efeitos, os dois indesejados:
    //
    //   1. criar uma rubrica parecia ser aceitar a de fábrica, e não compor a sua;
    //   2. e ABRIR UMA RUBRICA PARA EDITAR não mostrava nada: se ela tivesse exactamente
    //      esses quatro níveis, o ecrã ficava igual e só o nome mudava. Parecia que o
    //      «Editar» só trazia o nome. Não trazia — estava tudo lá, e era invisível porque já
    //      lá estava antes.
    //
    // Agora o editor nasce vazio, e quem quiser a régua de quatro níveis escreve-a (ou usa a
    // rubrica «Padrão», que é uma linha da lista como qualquer outra).
    '<div id="rubr-niveis"></div>' +
    '<p><button type="button" class="acao secundario pequena" id="rubr-add">Acrescentar nível</button></p>' +
    // OS BOTÕES DO PASSO. «Avançar» faz duas coisas consoante o que houver no formulário: com
    // nome, grava a rubrica e segue; sem nada, segue sem criar nenhuma — o passo é
    // OBRIGATÓRIO DE PASSAR e OPCIONAL DE PREENCHER. O «Limpar formulário» saiu (18/10/2026):
    // limpar não é uma operação do fluxo, e o «Cancelar» — só no modo edição — é o que repõe.
    '<span class="par-botoes">' +
    '<button type="button" class="acao secundario" id="rubr-voltar">Voltar</button>' +
    '<button type="submit" class="acao grande" id="rubr-avancar">Avançar</button>' +
    '<button type="button" class="acao secundario cancelar-edicao" id="rubr-cancelar" hidden>Cancelar</button>' +
    '</span>' +
    '</form>' +
    '</div>' +
    '</div>' +
    // PASSO 3 — ASSOCIAR. A turma já existe; aqui ela recebe o que vai precisar. São dois
    // atos e os dois são «associar»: a RÉGUA com que é medida (uma rubrica) e os CONTEÚDOS
    // que vai usar. Estavam separados — a régua num passo e os conteúdos no cadastro — e a
    // associação de conteúdo não tinha lugar: só se associa conteúdo a uma turma que já
    // existe, e o cadastro é o sítio onde ela ainda está a nascer.
    '<div class="passo-painel" id="passo-vincular" hidden>' +
    '<div class="col-form">' +
    '<form id="form-vincular">' +
    // A TURMA NÃO SE ESCOLHE AQUI (18/10/2026). Ela é a que se acabou de gravar no passo 1 ou
    // a que se mandou editar na listagem — o `select` repetia uma decisão já tomada e abria a
    // porta a associar a turma errada. O nome dela sobe para o topo, e os dois blocos abaixo
    // são sempre DELA.
    '<p class="turma-em-foco" id="vinc-turma-nome" hidden></p>' +
    '<fieldset class="bloco-assoc">' +
    '<legend>Com que régua esta turma é medida</legend>' +
    '<label class="campo-rotulo" for="vinc-rubrica">Rubrica</label>' +
    '<select id="vinc-rubrica">' +
    // O VAZIO É O PADRÃO (18/10/2026): sem escolha explícita, «Gravar turma» não habilita.
    // Antes a primeira rubrica da lista já vinha selecionada, e o botão parecia pronto sem
    // que ninguém tivesse decidido nada.
    '<option value="">' + (listaRubricas.length ? '— escolha uma rubrica —' : '— nenhuma rubrica criada —') + '</option>' +
    listaRubricas.map((r) => '<option value="' + esc(r.id) + '">' + esc(r.nome) + '</option>').join('') +
    '</select>' +
    '<span class="par-botoes">' +
    '<button type="submit" class="acao" id="vinc-associar" disabled>Associar rubrica</button>' +
    // DESASSOCIAR A RUBRICA existia como «Desvincular (volta à régua padrão)» — nome de
    // sistema, e escondido no fim do formulário. É o mesmo ato ao contrário, e agora tem o
    // mesmo nome do outro lado: associar / desassociar.
    '<button type="button" class="acao secundario" id="vinc-desassociar" disabled>Desassociar rubrica</button>' +
    '</span>' +
    '<p class="nota" id="vinc-estado"></p>' +
    '</fieldset>' +
    '<fieldset class="bloco-assoc">' +
    '<legend>Conteúdos desta turma</legend>' +
    '<div class="chips" id="vinc-conteudos"><span class="dono">(nenhum conteúdo associado)</span></div>' +
    '<span class="par-associar"><select class="sel-termo" id="vinc-termo" aria-label="termo a associar">' +
    '<option value="">— associar termo —</option>' + opcoesTermo + '</select>' +
    '<button type="button" class="associar acao pequena" id="vinc-associar-termo"' + (listaTermos.length ? '' : ' disabled') + '>Associar</button></span>' +
    '</fieldset>' +
    // O FIM DA SEQUÊNCIA (18/10/2026). «Gravar turma» conclui: grava a régua escolhida (se
    // mudou) e volta ao início, com a lista à vista. A turma já foi gravada no passo 1 — é o
    // que permite associar aqui —, e o botão diz o que a direção sente: «terminei esta turma».
    '<span class="par-botoes">' +
    '<button type="button" class="acao secundario" id="vinc-voltar">Voltar</button>' +
    '<button type="button" class="acao grande" id="vinc-gravar" disabled>Gravar turma</button>' +
    '<button type="button" class="acao secundario cancelar-edicao" id="vinc-cancelar" hidden>Cancelar</button>' +
    '</span>' +
    '<p class="nota-pendencia" id="vinc-pendencia" hidden></p>' +
    '</form>' +
    '</div>' +
    '</div>' +
    '</div>' +   // /#turmas-paineis
    '</div>' +   // /.turmas-form
    // A LISTAGEM ÚNICA — a mesma nos três passos. Ela mora FORA dos painéis de propósito:
    // trocar de passo troca o formulário, e a lista continua ali, sem piscar.
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Turmas cadastradas</h3>' +
    // O AVISO DO FILTRO (18/10/2026). Ele só existe quando a lista chegou filtrada pelo
    // «turmas» de um professor, de uma aluna ou de um termo — e diz de quem são, para não
    // parecer que a escola perdeu as outras turmas.
    '<p class="filtro-turmas" id="filtro-turmas" hidden></p>' +
    '<div class="rolagem"><ul class="lista">' + itensTurmas + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</div>' +   // /.turmas-corpo
    // Os conteúdos de cada turma, com o «×», prontos a clonar (ver `ajustarTurma`).
    blocosDeConteudos.join('') +
    '</section>' +
    '<section class="secao" id="sec-vocabulario" hidden>' +
    '<h2>Vocabulário Técnico do Balé</h2>' +
    '<div class="col-form">' +
    '<form id="form-termo">' +
    // SÓ O NOME SE ESCREVE (18/10/2026). Categoria e tradição são LISTAS: o professor não
    // decide a taxonomia enquanto cadastra, e uma categoria escrita à mão («passos»,
    // «posições») partiria o vocabulário em duas famílias que ninguém consegue agrupar.
    '<label class="campo-rotulo" for="vtermo">Termo principal (grafia francesa, com acentos)</label>' +
    '<input id="vtermo" name="termo" autocomplete="off" placeholder="ex.: Plié">' +
    '<label class="campo-rotulo" for="vcategoria">Categoria</label>' +
    '<select id="vcategoria">' +
    CATEGORIAS_DO_VOCABULARIO.map((c) =>
      '<option value="' + esc(c) + '">' + esc(rotuloDaCategoria(c)) + '</option>').join('') +
    '</select>' +
    '<label class="campo-rotulo" for="vtradicao">Tradição de referência</label>' +
    '<select id="vtradicao">' +
    TRADICOES_DO_VOCABULARIO.map((t) =>
      '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('') +
    '</select>' +
    '<button type="submit" class="acao grande">Cadastrar termo</button>' +
    '</form>' +
    '<p><button id="semear" type="button">Carregar catálogo inicial (turmas + vocabulário)</button></p>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Termos cadastrados</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensTermos + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-curadorias" hidden>' +
    '<h2>Curadorias</h2>' +
    '<div class="col-form">' +
    '<form id="form-curadoria">' +
    // O MODO: criar, editar (só a curadoria livre) ou derivar (a vinculada) — a mesma regra da
    // turma, e o mesmo desenho de data (16/10/2026).
    '<input type="hidden" id="cuderivar">' +
    '<input type="hidden" id="cumodo">' +
    // O TEXTO EXPLICATIVO SAIU (18/10/2026), pela mesma razão do formulário da turma: quem
    // entra em «Editar» vê o modo no próprio formulário e cancela ao lado do botão. Fica só a
    // DATA, que é o único campo que a derivação acrescenta.
    '<div class="aviso-derivar" id="cu-vigencia-campo" hidden>' +
    '<label class="campo-rotulo" for="cuvigencia">Vale a partir de</label>' +
    '<input id="cuvigencia" type="date" autocomplete="off">' +
    '</div>' +
    '<label class="campo-rotulo" for="cuprofessor">Professor</label>' +
    '<select id="cuprofessor">' + opcoesProfessorCuradoria + '</select>' +
    '<label class="campo-rotulo" for="cumodalidade">Modalidade</label>' +
    '<select id="cumodalidade">' + opcoesModalidadeCuradoria + '</select>' +
    '<label class="campo-rotulo" for="cutradicao">Tradição</label>' +
    '<select id="cutradicao"><option value="">— nenhuma —</option>' + opcoesTradicaoCuradoria + '</select>' +
    '<label class="campo-rotulo" for="cuturma">Turma</label>' +
    '<select id="cuturma">' + opcoesTurmaCuradoria + '</select>' +
    '<label>Alunas</label>' +
    escolarAlunasCuradoria +
    // O REPERTÓRIO é o grupo grande (o vocabulário tem 84 termos). Era um tapete de 84
    // pílulas — o formulário ficava poluído. Agora é o MESMO escolhedor das turmas e das
    // alunas: o menu tem as 84 entradas com a categoria no rótulo, e escrever salta para o
    // termo (busca por digitação do próprio navegador).
    '<label>Repertório (passos da turma)</label>' +
    escolarRepertorioCuradoria +
    // O «CANCELAR» AO LADO DO BOTÃO, E SÓ NA EDIÇÃO (18/10/2026) — a mesma regra dos três
    // passos da turma. Ele não tem texto de aviso, e nasce escondido: sem edição em curso não
    // há nada para cancelar.
    '<span class="par-botoes">' +
    '<button type="submit" id="cu-enviar">Atribuir curadoria</button>' +
    '<button type="button" class="acao secundario" id="cu-cancelar" hidden>Cancelar</button>' +
    '</span>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Curadorias atribuídas</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensCuradorias + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<script>' +
    'var TOKEN = "";' +
    // A PAGINAÇÃO DA LISTA. A lista já veio inteira do servidor (é curta: uma escola tem
    // dezenas de professores, não milhares), e quem escolhe a página é o navegador — não há
    // rota nova, nem estado no servidor. O que se ganha é a vista: o formulário à esquerda,
    // a lista à direita, e nenhuma página comprida para rolar. Sem JavaScript, o rodapé nem
    // aparece e a lista mostra tudo.
    'function paginar() {' +
    '  var paineis = document.querySelectorAll("[data-paginar]");' +
    '  for (var p = 0; p < paineis.length; p++) {' +
    '    var painel = paineis[p];' +
    '    var ul = painel.querySelector("ul");' +
    '    var rodape = painel.querySelector(".paginacao");' +
    '    if (!ul || !rodape) continue;' +
    '    var porPagina = parseInt(painel.getAttribute("data-por-pagina") || "10", 10);' +
    // OS ITENS FORA DO FILTRO NÃO CONTAM PARA A PAGINAÇÃO (18/10/2026). Eles continuam no
    // DOM (o filtro é uma vista, não uma exclusão), mas não podem ocupar uma página: sem
    // isto, filtrar para duas turmas mostraria «1 / 3» e duas páginas vazias.
    '    var todos = Array.prototype.slice.call(ul.children);' +
    '    var itens = todos.filter(function(x){ return x.getAttribute("data-fora") !== "sim"; });' +
    '    for (var f = 0; f < todos.length; f++) {' +
    '      if (todos[f].getAttribute("data-fora") === "sim") todos[f].hidden = true;' +
    '    }' +
    '    var paginas = Math.max(1, Math.ceil(itens.length / porPagina));' +
    '    var atual = Math.min(Math.max(1, parseInt(painel.getAttribute("data-pagina") || "1", 10)), paginas);' +
    '    painel.setAttribute("data-pagina", atual);' +
    '    for (var i = 0; i < itens.length; i++) {' +
    '      itens[i].hidden = (Math.floor(i / porPagina) + 1) !== atual;' +
    '    }' +
    '    var info = rodape.querySelector(".pag-info");' +
    '    if (info) info.textContent = atual + " / " + paginas;' +
    '    var ant = rodape.querySelector(".pag-ant");' +
    '    var prox = rodape.querySelector(".pag-prox");' +
    '    if (ant) ant.disabled = atual <= 1;' +
    '    if (prox) prox.disabled = atual >= paginas;' +
    '    rodape.hidden = paginas <= 1;' +
    '  }' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest(".paginacao button") : null;' +
    '  if (!b) return;' +
    '  var painel = b.closest("[data-paginar]");' +
    '  if (!painel) return;' +
    // QUAL dos dois botões — por CLASSE, não pela string inteira do atributo.
    //
    // Aqui estava `b.className === "pag-prox"`, e o `className` de um elemento é o atributo
    // `class` INTEIRO: `"pag-prox acao secundario pequena"`. A comparação era sempre falsa,
    // os dois botões valiam -1, e como o `paginar()` trava a página em `[1, N]` o resultado
    // era a página 1 para sempre — o rodapé dizia «1 / 3» e nenhum clique o mudava. Era o
    // defeito que o dono do produto viu nas Turmas e no Vocabulário, e que estava nas SETE
    // listas ao mesmo tempo (é uma implementação só).
    //
    // `classList.contains` sobrevive a uma classe a mais no botão — que é exactamente o que
    // a versão anterior não fazia, e o motivo de ter passado despercebido: o botão nasceu
    // com as classes de estilo e a comparação nasceu a exigir que ele tivesse UMA.
    '  var passos = b.classList && b.classList.contains("pag-prox") ? 1 : -1;' +
    '  painel.setAttribute("data-pagina", parseInt(painel.getAttribute("data-pagina") || "1", 10) + passos);' +
    '  paginar();' +
    '});' +
    'paginar();' +
    // ================= O FILTRO «TURMAS» DAS LISTAS (18/10/2026) =================
    // O «turmas · …» da linha de um professor, de uma aluna ou de um termo NÃO é um ornamento:
    // clicado, ele leva à secção Turmas e reduz a listagem às turmas daquela linha. A fonte
    // dos ids já veio do servidor (`data-turmas`); aqui só se guarda o filtro e se aplica.
    //
    // O filtro vive em `sessionStorage` porque a página RECARREGA a cada operação
    // (associar, gravar turma…). Sem memória, o primeiro clique numa operação devolveria a
    // lista inteira e a pessoa perderia o fio. E ele é uma VISTA, não uma exclusão: as
    // linhas continuam no DOM, marcadas com `data-fora`, e o «Mostrar todas» as devolve sem
    // pedir nada ao servidor.
    // O ESTADO DO ACORDEÃO. Ele é lembrado como o filtro — a página recarrega a cada operação,
    // e um formulário que se reabre sozinho depois de cada associação desfaria o recolhimento
    // que a pessoa acabou de pedir. `sessionStorage`, não a URL: a URL já é do menu.
    'var CHAVE_RECOLHIDO = "producao:form-recolhido";' +
    'function formularioRecolhido() {' +
    '  try { return sessionStorage.getItem(CHAVE_RECOLHIDO) === "sim"; } catch (err) { return false; }' +
    '}' +
    'function definirFormularioRecolhido(sim) {' +
    '  try {' +
    '    if (sim) sessionStorage.setItem(CHAVE_RECOLHIDO, "sim");' +
    '    else sessionStorage.removeItem(CHAVE_RECOLHIDO);' +
    '  } catch (err) {}' +
    '  var corpo = document.getElementById("turmas-form");' +
    '  var miolo = document.getElementById("turmas-paineis");' +
    '  var seta = document.getElementById("alternar-form");' +
    // O RECOLHIDO MUDA A GRELHA (18/10/2026): a faixa sobe para a linha inteira e a listagem
    // fica sozinha, com a largura toda. O estado vai também no `.turmas-corpo` porque é ELE
    // que tem a grade — e uma grade não se muda a partir do filho.
    '  var grade = document.querySelector(".turmas-corpo");' +
    '  if (grade) grade.setAttribute("data-recolhido", sim ? "sim" : "nao");' +
    // A SETA É O ÚNICO TEXTO DO CONTROLE, e é um glifo: nada de «recolher»/«abrir» escrito.
    // O `aria-label` e o `title` dizem o mesmo a quem não vê a seta.
    '  if (corpo) corpo.setAttribute("data-recolhido", sim ? "sim" : "nao");' +
    '  if (miolo) miolo.hidden = !!sim;' +
    '  if (seta) {' +
    '    seta.setAttribute("aria-expanded", sim ? "false" : "true");' +
    '    seta.setAttribute("aria-label", sim ? "Abrir o formulário" : "Recolher o formulário");' +
    '    seta.setAttribute("title", sim ? "Abrir o formulário" : "Recolher o formulário");' +
    '    seta.textContent = sim ? "▸" : "▾";' +
    '  }' +
    '}' +
    'var CHAVE_FILTRO = "producao:filtro-turmas";' +
    'function lerFiltroDeTurmas() {' +
    '  try { var t = sessionStorage.getItem(CHAVE_FILTRO); return t ? JSON.parse(t) : null; }' +
    '  catch (err) { return null; }' +
    '}' +
    'function gravarFiltroDeTurmas(f) {' +
    '  try {' +
    '    if (f && f.ids && f.ids.length) sessionStorage.setItem(CHAVE_FILTRO, JSON.stringify(f));' +
    '    else sessionStorage.removeItem(CHAVE_FILTRO);' +
    '  } catch (err) {}' +
    '}' +
    'function aplicarFiltroDeTurmas() {' +
    '  var f = lerFiltroDeTurmas();' +
    '  var ids = f && Array.isArray(f.ids) ? f.ids : [];' +
    // QUEM CHEGA PELO FILTRO VEIO VER A LISTA (18/10/2026): o formulário recolhe para a faixa
    // e a listagem sobe. Ele não desaparece — a faixa e a seta ficam, e um toque o devolve.
    '  if (ids.length) definirFormularioRecolhido(true);' +
    '  var itens = document.querySelectorAll("li.turma");' +
    '  for (var i = 0; i < itens.length; i++) {' +
    '    var dentro = !ids.length || ids.indexOf(itens[i].getAttribute("data-turma")) !== -1;' +
    '    itens[i].setAttribute("data-fora", dentro ? "nao" : "sim");' +
    '    if (!dentro) itens[i].hidden = true;' +
    '  }' +
    // O `paginar` VEM ANTES DO AVISO, e não depois: é ele que devolve as linhas escondidas
    // quando o filtro é limpo. Deixá-lo no fim fazia o «Mostrar todas» apagar o filtro e
    // deixar a lista reduzida — o pior dos dois mundos.
    '  paginar();' +
    '  var aviso = document.getElementById("filtro-turmas");' +
    '  if (!aviso) return;' +
    '  aviso.hidden = !ids.length;' +
    // Atribuir `textContent` APAGA os filhos que lá estavam (o «Mostrar todas» da aplicação
    // anterior) — é o que o navegador faz, e evita um segundo botão a cada filtro.
    '  aviso.textContent = "";' +
    '  if (!ids.length) return;' +
    '  var quem = f && f.quem ? f.quem : "";' +
    // `textContent` ANTES do botão: `createTextNode` não existe no DOM mínimo das provas, e
    // um texto que se escreve por atribuição é o mesmo texto.
    // A FRASE MUDA COM O TIPO: uma PESSOA tem turmas; um TERMO é usado por turmas.
    '  var ehTermo = f && f.tipo === "termo";' +
    '  var frase = "Listagem filtrada: " + ids.length + (ids.length === 1 ? " turma" : " turmas") +' +
    '    (quem ? (ehTermo ? " que usam " : " de ") + quem : "") + ". ";' +
    '  aviso.textContent = frase;' +
    '  var b = document.createElement("button");' +
    '  b.type = "button"; b.className = "limpar-filtro acao secundario pequena";' +
    '  b.textContent = "Mostrar todas";' +
    '  aviso.appendChild(b);' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var alvo = e.target.closest ? e.target.closest("button.filtrar-turmas") : null;' +
    '  if (alvo) {' +
    '    var ids = String(alvo.getAttribute("data-turmas") || "").split(",")' +
    '      .map(function(x){ return x.trim(); }).filter(Boolean);' +
    '    gravarFiltroDeTurmas({ids: ids, quem: alvo.getAttribute("data-quem") || "",' +
    '      tipo: alvo.getAttribute("data-tipo") || "pessoa"});' +
    // O PASSO VOLTA AO 1: quem chega para ver as turmas de uma pessoa não quer editar a
    // última turma em que estava. `mostrarPasso` é chamado antes de o hash mudar — a secção
    // Turmas ainda está oculta, e o painel do passo 1 é o que se mostra quando ela abrir.
    '    mostrarPasso("turma");' +
    '    if (location.hash === "#turmas") aplicarFiltroDeTurmas();' +
    '    else location.hash = "#turmas";' +
    '    return;' +
    '  }' +
    '  if (e.target.closest && e.target.closest("button.limpar-filtro")) {' +
    '    gravarFiltroDeTurmas(null);' +
    '    aplicarFiltroDeTurmas();' +
    // «MOSTRAR TODAS» DEVOLVE A LISTA E O FORMULÁRIO (18/10/2026). O filtro tinha recolhido o
    // formulário; limpar o filtro sem o reabrir deixaria a pessoa sem os campos e sem saber
    // por quê — a causa do recolhimento desapareceu, e o efeito vai atrás.
    '    definirFormularioRecolhido(false);' +
    '    return;' +
    '  }' +
    // A SETA. Ela alterna o estado; o filtro e o «Mostrar todas» também o mudam.
    '  if (e.target.closest && e.target.closest("button.alternar-form")) {' +
    '    definirFormularioRecolhido(!formularioRecolhido());' +
    '  }' +
    '});' +
    // AO ABRIR A SECÇÃO TURMAS, O FILTRO GUARDADO É APLICADO. `hashchange` cobre a chegada
    // pelo link; o arranque cobre a página que já abriu em `#turmas` ou que recarregou.
    'window.addEventListener("hashchange", function(){' +
    '  if ((location.hash || "").replace("#", "") === "turmas") aplicarFiltroDeTurmas();' +
    '});' +
    'if ((location.hash || "").replace("#", "") === "turmas") aplicarFiltroDeTurmas();' +
    // O ACORDEÃO VOLTA COMO FICOU. Sem isto, cada recarregar (e cada operação recarrega)
    // devolveria o formulário aberto — e o recolhimento que a pessoa pediu duraria um clique.
    'definirFormularioRecolhido(formularioRecolhido());' +
    // OS PASSOS da secção Turmas. Três coisas mudaram em relação às abas (18/10/2026):
    //
    //  1. NÃO É MAIS UM MENU, É UMA SEQUÊNCIA — o que se mostra é o passo, e o resto continua
    //     no DOM. A diferença está no `<ol>` e no `aria-current="step"`, que é o que um
    //     leitor de ecrã anuncia.
    //  2. O PASSO É LEMBRADO. Isto não existia com as abas porque não era preciso: as abas
    //     não recarregavam a página. Os passos recarregam — associar um conteúdo chama a API
    //     e recarrega —, e sem memória o professor voltaria SEMPRE ao passo 1 depois de cada
    //     associação. `sessionStorage`, não a URL: a URL já é do menu lateral (`#turmas`), e
    //     um segundo nível de hash tornaria os dois difíceis de usar.
    // ================= AS TRAVAS DOS PASSOS (18/10/2026) ========================
    // A SEQUÊNCIA É OBRIGATÓRIA, E A DIREÇÃO NÃO PODE PULAR NADA. Antes, os passos de cima
    // eram três botões livres: dava para abrir «Associar» com o formulário da turma vazio e
    // premir «Gravar turma» — que, sem dados, ou gravava nada ou falhava com uma mensagem
    // de servidor. As regras, ditas uma vez:
    //
    //   · «Rubricas» e «Associar» só abrem quando a TURMA está completa (o que o servidor
    //     exige: nome, dias, duração e o período). A rubrica em si é OPCIONAL — criar uma é
    //     um ato à parte, e passar sem criar é legítimo;
    //   · «Gravar turma» só habilita quando a TURMA está completa E há uma RUBRICA escolhida
    //     E a turma tem CONTEÚDO associado. É o pedido, com todas as letras;
    //   · «Voltar» nunca trava. Voltar é sempre possível — é o que deixa corrigir.
    //
    // O `disabled` é a trava da TELA; o servidor já recusa o que falta (as rotas têm as suas
    // validações). Uma coisa não substitui a outra: a tela evita o erro, o servidor garante.
    'function faltaDaTurma() {' +
    '  var falta = [];' +
    '  var nome = document.getElementById("tnome");' +
    '  var dur = document.getElementById("tduracao");' +
    '  var ini = document.getElementById("tinicio");' +
    '  var fim = document.getElementById("tfim");' +
    '  if (!nome || !String(nome.value || "").trim()) falta.push("o nome da turma");' +
    '  if (!marcados("dia").length) falta.push("os dias da semana");' +
    '  if (!dur || !(Number(dur.value) > 0)) falta.push("a duração de cada aula");' +
    '  if (!ini || !String(ini.value || "").trim()) falta.push("o início do período");' +
    '  if (!fim || !String(fim.value || "").trim()) falta.push("o fim do período");' +
    '  return falta;' +
    '}' +
    'function faltaDaAssociacao() {' +
    '  var falta = [];' +
    '  var selR = document.getElementById("vinc-rubrica");' +
    // A TURMA JÁ NÃO TEM `select` no passo 3: ela é a que está em foco (a que se acabou de
    // gravar ou a que se mandou editar). Sem foco não há a quem associar.
    '  if (!turmaEmFoco()) falta.push("escolher a turma");' +
    '  if (!selR || !String(selR.value || "").trim()) falta.push("escolher a rubrica");' +
    '  var chips = document.querySelectorAll("#vinc-conteudos .chip").length;' +
    '  if (!chips) falta.push("associar pelo menos um conteúdo");' +
    '  return falta;' +
    '}' +
    'function fraseDaFaltaNoCliente(falta) {' +
    '  if (!falta.length) return "";' +
    '  if (falta.length === 1) return falta[0];' +
    '  return falta.slice(0, -1).join(", ") + " e " + falta[falta.length - 1];' +
    '}' +
    'function aplicarTravas() {' +
    '  var faltaTurma = faltaDaTurma();' +
    '  var turmaOk = faltaTurma.length === 0;' +
    // Os passos 2 e 3 dependem só da turma. A rubrica é opcional por decisão — ela só se
    // torna obrigatória no «Gravar turma».
    '  Array.prototype.slice.call(document.querySelectorAll("button.passo")).forEach(function(b){' +
    '    var q = b.getAttribute("data-passo");' +
    '    if (q === "turma") { b.disabled = false; b.removeAttribute("title"); return; }' +
    '    b.disabled = !turmaOk;' +
    '    if (!turmaOk) b.setAttribute("title", "Complete a turma antes: falta " + fraseDaFaltaNoCliente(faltaTurma) + ".");' +
    '    else b.removeAttribute("title");' +
    '  });' +
    '  var avancar = document.getElementById("t-enviar");' +
    '  if (avancar) {' +
    '    avancar.disabled = !turmaOk;' +
    '    avancar.setAttribute("title", turmaOk ? "" : "Falta " + fraseDaFaltaNoCliente(faltaTurma) + ".");' +
    '  }' +
    '  var avisoT = document.getElementById("t-pendencia");' +
    '  if (avisoT) {' +
    '    avisoT.hidden = turmaOk;' +
    '    avisoT.textContent = turmaOk ? "" : "Para avançar, falta " + fraseDaFaltaNoCliente(faltaTurma) + ".";' +
    '  }' +
    // AS AÇÕES INTERMÉDIAS DO PASSO 3 também são trancadas pelo que lhes falta: associar uma
    // rubrica sem a ter escolhido era um clique que não fazia nada; desassociar sem turma, idem.
    '  var selR = document.getElementById("vinc-rubrica");' +
    '  var temTurma = !!turmaEmFoco();' +
    '  var associar = document.getElementById("vinc-associar");' +
    '  if (associar) associar.disabled = !temTurma || !(selR && String(selR.value || "").trim());' +
    '  var desassociar = document.getElementById("vinc-desassociar");' +
    '  if (desassociar) desassociar.disabled = !temTurma;' +
    // Associar um CONTEÚDO também exige a turma — e um termo que exista (o menu tem sempre
    // o vazio «— associar termo —» na primeira posição).
    '  var associarTermo = document.getElementById("vinc-associar-termo");' +
    '  var selTermo = document.getElementById("vinc-termo");' +
    '  if (associarTermo) associarTermo.disabled = !temTurma || !selTermo || !selTermo.options || selTermo.options.length <= 1;' +
    '  var faltaAssoc = faltaDaAssociacao();' +
    '  var gravar = document.getElementById("vinc-gravar");' +
    '  var tudoOk = turmaOk && faltaAssoc.length === 0;' +
    '  if (gravar) {' +
    '    gravar.disabled = !tudoOk;' +
    '    gravar.setAttribute("title", tudoOk ? "" : "Falta " + fraseDaFaltaNoCliente(faltaTurma.concat(faltaAssoc)) + ".");' +
    '  }' +
    '  var avisoV = document.getElementById("vinc-pendencia");' +
    '  if (avisoV) {' +
    '    avisoV.hidden = tudoOk;' +
    '    var todas = faltaTurma.concat(faltaAssoc);' +
    '    avisoV.textContent = tudoOk ? "" : "Para gravar a turma, falta " + fraseDaFaltaNoCliente(todas) + ".";' +
    '  }' +
    '}' +
    'function mostrarPasso(qual){' +
    // A TRAVA VALE PARA TODOS OS CAMINHOS — os botões de cima, o `irParaPasso` do «Avançar»
    // e o passo lembrado ao reabrir. Quem tenta chegar a um passo adiante sem a turma
    // completa fica no passo 1: é lá que está o que falta.
    '  var faltaTurma = faltaDaTurma();' +
    '  if (qual !== "turma" && faltaTurma.length) qual = "turma";' +
    '  var todos = document.querySelectorAll("button.passo");' +
    '  for (var i = 0; i < todos.length; i++) {' +
    '    var ativo = todos[i].getAttribute("data-passo") === qual;' +
    '    todos[i].className = ativo ? "passo ativo" : "passo";' +
    '    if (ativo) { todos[i].setAttribute("aria-current", "step"); }' +
    '    else { todos[i].removeAttribute("aria-current"); }' +
    '  }' +
    '  var paineis = document.querySelectorAll(".passo-painel");' +
    '  for (var j = 0; j < paineis.length; j++) {' +
    '    paineis[j].hidden = paineis[j].id !== "passo-" + qual;' +
    '  }' +
    '  try { sessionStorage.setItem("producao:passo", qual); } catch (err) {}' +
    // O passo 3 tem um bloco de conteúdos que depende de qual turma está escolhida: quem
    // manda desenhar é `sincronizarAssociacao`, e ela é chamada AQUI porque é aqui que o
    // painel deixa de estar oculto — e uma medida dentro de um `hidden` dá zero.
    '  if (qual === "vincular" && typeof sincronizarAssociacao === "function") sincronizarAssociacao();' +
    // O NOME DA TURMA EM FOCO sobe para o topo dos passos 2 e 3 (18/10/2026). É ele que diz a
    // quem a rubrica e os conteúdos vão — e é a única indicação da turma no passo 3, agora
    // que o `select` saiu.
    '  if (typeof atualizarTurmaEmFoco === "function") atualizarTurmaEmFoco();' +
    '  aplicarTravas();' +
    '}' +
    'function passoGuardado(){' +
    '  try { return sessionStorage.getItem("producao:passo") || "turma"; } catch (err) { return "turma"; }' +
    '}' +
    // ================= O ESTADO DO FORMULÁRIO ENTRE PASSOS =====================
    // TROCAR DE PASSO NÃO PODE APAGAR O QUE FOI DIGITADO (18/10/2026). Antes, cada troca de
    // passo RECARREGAVA a página, e o formulário voltava vazio: quem estava a preencher a
    // turma perdia tudo ao espiar a rubrica e voltar. A regra vale para os TRÊS caminhos —
    // «Avançar», «Voltar» e o clique direto nas etapas de cima —, porque todos passam por
    // `irParaPasso`.
    //
    // São duas metades: (a) trocar de passo NÃO recarrega (o DOM fica); e (b) o conteúdo
    // dos três formulários é gravado no `sessionStorage` a cada alteração, para sobreviver
    // ao recarregar que as OPERAÇÕES fazem (associar, gravar turma…).
    'var CHAVE_ESTADO = "producao:form";' +
    'function lerEstado() {' +
    '  try { var t = sessionStorage.getItem(CHAVE_ESTADO); return t ? (JSON.parse(t) || {}) : {}; }' +
    '  catch (err) { return {}; }' +
    '}' +
    'function gravarEstadoObjeto(e) {' +
    '  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(e)); } catch (err) {}' +
    '}' +
    'function estadoDoFormulario() {' +
    '  var e = lerEstado();' +
    '  var f = document.getElementById("form-turma");' +
    '  if (f) {' +
    '    var t = {};' +
    '    Array.prototype.slice.call(f.querySelectorAll("[name]")).forEach(function(x){' +
    '      if (x.type === "checkbox") { if (x.checked) t["dia:" + x.value] = true; }' +
    '      else if (x.name) t[x.name] = x.value;' +
    '    });' +
    '    t.__niveis = fichasDe("esc-niveis");' +
    // O programa é um `<select>` sem `name` (a posição também saiu), e por isso não entra na
    // captura por `[name]` — vai à mão, como os níveis e os horários.
    '    t.__programa = (document.getElementById("tprograma") || {}).value || "";' +
    '    t.__horarios = {};' +
    '    Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){' +
    '      var d = x.getAttribute("data-dia"); if (d) t.__horarios[d] = x.value;' +
    '    });' +
    '    t.__derivar = (document.getElementById("tderivar") || {}).value || "";' +
    '    t.__modo = (document.getElementById("tmodo") || {}).value || "";' +
    '    t.__vigencia = (document.getElementById("tvigencia") || {}).value || "";' +
    '    e.turma = t;' +
    '  }' +
    '  var rid = document.getElementById("rubr-id");' +
    '  if (rid) {' +
    '    e.rubrica = {id: rid.value, nome: document.getElementById("rubr-nome").value,' +
    '      niveis: reguaDoEditor("rubr-niveis")};' +
    '  }' +
    '  var selR = document.getElementById("vinc-rubrica");' +
    '  if (selR) {' +
    '    e.vincular = {turma: turmaEmFoco(), rubrica: selR.value || ""};' +
    '  }' +
    '  return e;' +
    '}' +
    'function gravarEstado() { gravarEstadoObjeto(estadoDoFormulario()); }' +
    'function aplicarEstadoDoFormulario() {' +
    '  var e = lerEstado();' +
    '  var t = e.turma;' +
    '  if (t) {' +
    '    Object.keys(t).forEach(function(k){' +
    '      if (k.indexOf("__") === 0 || k.indexOf("dia:") === 0) return;' +
    '      var el = document.querySelector("#form-turma [name=\\"" + k + "\\"]");' +
    '      if (el) el.value = t[k];' +
    '    });' +
    '    Array.prototype.slice.call(document.querySelectorAll("input[name=\\\"dia\\\"]")).forEach(function(p){' +
    '      p.checked = !!t["dia:" + p.value];' +
    '    });' +
    '    var esc = document.getElementById("esc-niveis");' +
    '    if (esc) {' +
    '      Array.prototype.slice.call(esc.querySelectorAll(".escolhido")).forEach(function(f){ f.parentElement.removeChild(f); });' +
    '      (t.__niveis || []).forEach(function(n){ adicionarFicha(esc, n); });' +
    '      mostrarVazio(esc);' +
    '    }' +
    '    document.getElementById("tderivar").value = t.__derivar || "";' +
    '    document.getElementById("tmodo").value = t.__modo || "";' +
    '    document.getElementById("tvigencia").value = t.__vigencia || "";' +
    // A DATA SÓ APARECE NA DERIVAÇÃO: a turma vinculada ganha um elo novo com vigência; a
    // livre é corrigida no lugar, e perguntar-lhe «a partir de quando» seria uma pergunta
    // sem resposta. O modo é o que decide, e ele está no estado.
    '    var vigCampo = document.getElementById("t-vigencia-campo");' +
    '    if (vigCampo) vigCampo.hidden = !(t.__derivar && String(t.__modo || "") === "derivar");' +
    '    var nome = document.getElementById("tnome");' +
    '    if (nome) nome.readOnly = String(t.__modo || "") === "derivar";' +
    '    var botao = document.getElementById("t-enviar");' +
    '    if (botao) botao.textContent = "Avançar";' +
    '    if (typeof t.__programa === "string") selecionarPrograma(t.__programa);' +
    '    sincronizarHoras();' +
    // `sincronizarHoras` limpa a hora de um dia não marcado — e é por isso que as horas são
    // repostas DEPOIS dele, só nas que ficaram habilitadas.
    '    Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){' +
    '      var d = x.getAttribute("data-dia");' +
    '      if (!x.disabled && t.__horarios && t.__horarios[d]) x.value = t.__horarios[d];' +
    '    });' +
    '  }' +
    '  var r = e.rubrica;' +
    '  if (r && document.getElementById("rubr-id")) {' +
    '    document.getElementById("rubr-id").value = r.id || "";' +
    '    document.getElementById("rubr-nome").value = r.nome || "";' +
    '    pintarEditorDaRubrica(r.niveis || []);' +
    '  }' +
    '  var v = e.vincular;' +
    '  if (v) {' +
    // A TURMA EM FOCO é restaurada pela chave própria (`producao:vinc-turma`), que é a que
    // `ajustarTurma` e `avancarParaRubricas` escrevem. O estado guarda-a como cópia, para o
    // caso de a chave se perder.
    '    if (v.turma) { try { sessionStorage.setItem("producao:vinc-turma", v.turma); } catch (err) {} }' +
    '    var selR = document.getElementById("vinc-rubrica");' +
    '    if (selR && v.rubrica) {' +
    '      for (var j = 0; j < selR.options.length; j++) {' +
    '        if (selR.options[j].value === v.rubrica) { selR.value = v.rubrica; break; }' +
    '      }' +
    '    }' +
    '  }' +
    '}' +
    // Trocar de passo é SÓ trocar de painel. Antes recarregava, e é isso que apagava o que
    // estava escrito — a correção não é «guardar antes de recarregar», é NÃO recarregar.
    'function irParaPasso(qual){' +
    '  gravarEstado();' +
    '  mostrarPasso(qual);' +
    '  try { location.hash = "#turmas"; } catch (err) {}' +
    '}' +
    // A MEMÓRIA DAS ALTERAÇÕES. `input` cobre texto/número/data/hora; `change` cobre o
    // `select` e as caixas; e os cliques que mudam fichas e linhas da régua são gravados
    // pelos próprios handlers (é mais determinístico do que adivinhar pelo alvo do clique).
    // AS TRAVAS SÃO REAVALIADAS A CADA ALTERAÇÃO (18/10/2026). Antes só `gravarEstado` era
    // chamado, e o `disabled` do «Avançar»/«Gravar turma» ficava no estado do último
    // `mostrarPasso`: quem preenchia o nome via o botão continuar apagado, e quem apagava um
    // campo via-o continuar aceso. O erro era do aviso, não do servidor — mas era visível.
    'document.addEventListener("input", function(){ gravarEstado(); aplicarTravas(); });' +
    'document.addEventListener("change", function(){ gravarEstado(); aplicarTravas(); });' +
    // Depois de uma OPERAÇÃO bem-sucedida a página recarrega — e o passo e o estado já estão
    // gravados. O `aoOk` também passa a apontar o formulário para a turma que acabou de ser
    // gravada: voltar atrás não cria uma segunda, EDITA a que existe.
    'function avancarParaRubricas(d){' +
    '  try {' +
    '    var e = estadoDoFormulario();' +
    '    if (d && d.id) {' +
    '      sessionStorage.setItem("producao:vinc-turma", d.id);' +
    '      e.turma = e.turma || {};' +
    '      e.turma.__derivar = d.id;' +
    '      e.turma.__modo = d.modo === "derivar" ? "derivar" : "editar";' +
    '      sessionStorage.setItem("producao:editando", "turma");' +
    '    }' +
    '    gravarEstadoObjeto(e);' +
    '    sessionStorage.setItem("producao:passo", "rubrica");' +
    '  } catch (err) {}' +
    '}' +
    'function avancarParaAssociar(){' +
    '  try { gravarEstado(); sessionStorage.setItem("producao:passo", "vincular"); } catch (err) {}' +
    '}' +
    // «GRAVAR TURMA» CONCLUI: o formulário fecha e a memória do preenchimento é limpa —
    // senão a próxima turma começaria com os dados da anterior.
    'function concluirTurma(){' +
    '  try {' +
    '    sessionStorage.removeItem("producao:form");' +
    '    sessionStorage.removeItem("producao:editando");' +
    '    sessionStorage.removeItem("producao:vinc-turma");' +
    '    sessionStorage.setItem("producao:passo", "turma");' +
    '  } catch (err) {}' +
    // CONCLUÍDA A TURMA, A FAIXA ABRE (18/10/2026): quem termina uma turma vai começar a
    // próxima, e a próxima começa no formulário do passo 1 — não numa faixa recolhida.
    '  definirFormularioRecolhido(false);' +
    '}' +
    'function modoEditando(){' +
    '  try { return sessionStorage.getItem("producao:editando") || ""; } catch (err) { return ""; }' +
    '}' +
    'function aplicarEditando(){' +
    '  var editando = !!modoEditando();' +
    // O «Cancelar» existe nos TRÊS passos e é o mesmo ato em qualquer um deles: sair da
    // edição e voltar a um formulário vazio. Ele só aparece quando há edição para cancelar.
    '  Array.prototype.slice.call(document.querySelectorAll("button.cancelar-edicao")).forEach(function(b){' +
    '    b.hidden = !editando;' +
    '  });' +
    '  var ol = document.querySelector("ol.passos");' +
    '  if (ol) ol.setAttribute("data-editando", editando ? "sim" : "nao");' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("button.passo") : null;' +
    '  if (!b) return;' +
    // TOCAR NUM PASSO ABRE O FORMULÁRIO (18/10/2026): quem toca em «Rubricas» quer o
    // formulário daquele passo, não a lista. A faixa recolhida deixa de ser um beco.
    '  definirFormularioRecolhido(false);' +
    '  mostrarPasso(b.getAttribute("data-passo"));' +
    '});' +
    // A PORTA. O navegador guarda o TOKEN, nunca a senha (18/10/2026): antes, a senha ia
    // para o `sessionStorage` e ficava legível nas ferramentas de desenvolvimento — e é a
    // mesma senha que abre outros lugares. Agora o servidor devolve um token assinado, que
    // só vale para a Produção e expira em 12 horas.
    'function entrar(senha) {' +
    '  var g = document.getElementById("res-gate");' +
    '  g.className = "res"; g.textContent = "verificando...";' +
    '  fetch("/api/bastidores/validar-producao", {' +
    '    method: "POST", headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({senha: senha})' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { abrirSessao(d.token); }' +
    '    else { g.className = "res erro"; g.textContent = "Senha não reconhecida."; }' +
    '  }).catch(function(err){ g.className = "res erro"; g.textContent = "Erro: " + err.message; });' +
    '}' +
    // A SESSÃO JÁ ABERTA. O token é conferido no servidor a cada recarregar (a página
    // recarrega depois de quase toda a operação); se expirou, volta o portão.
    'function retomarSessao(token) {' +
    '  fetch("/api/bastidores/validar-producao", {' +
    '    method: "POST", headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({token: token})' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { abrirSessao(token); } else { esquecerSessao(); mostrarPortao(); }' +
    '  }).catch(function(){ esquecerSessao(); mostrarPortao(); });' +
    '}' +
    'function abrirSessao(token) {' +
    '  TOKEN = String(token || "");' +
    '  try { sessionStorage.setItem("producao:token", TOKEN); sessionStorage.removeItem("producao:senha"); } catch (err) {}' +
    '  document.getElementById("gate").hidden = true;' +
    '  document.getElementById("conteudo").hidden = false;' +
    '  if (typeof aplicarEstadoDoFormulario === "function") aplicarEstadoDoFormulario();' +
    '  if (typeof mostrarPasso === "function") mostrarPasso(passoGuardado());' +
    '  if (typeof aplicarEditando === "function") aplicarEditando();' +
    '}' +
    'function esquecerSessao() {' +
    '  TOKEN = "";' +
    '  try { sessionStorage.removeItem("producao:token"); sessionStorage.removeItem("producao:senha"); } catch (err) {}' +
    '}' +
    'function mostrarPortao() {' +
    '  document.getElementById("gate").hidden = false;' +
    '  document.getElementById("conteudo").hidden = true;' +
    '}' +
    'document.getElementById("form-senha").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  entrar(document.getElementById("dsenha").value);' +
    '});' +
    // A sessão persiste enquanto a ABA fica aberta (sessionStorage): depois do primeiro
    // login, o recarregar da página (após cadastrar/excluir) re-entra SOZINHO, sem pedir
    // a senha de novo. Fechar a aba esquece; manter aberta não volta a pedir.
    '(function(){' +
    '  var guardado = null;' +
    '  try {' +
    '    guardado = sessionStorage.getItem("producao:token");' +
    // Migração silenciosa: quem tinha a senha guardada por uma aba antiga perde-a agora.
    '    if (sessionStorage.getItem("producao:senha")) sessionStorage.removeItem("producao:senha");' +
    '  } catch (err) {}' +
    '  if (guardado) retomarSessao(guardado);' +
    '})();' +
    // O menu lateral: cada secção é uma <section class="secao">; o hash da URL escolhe
    // qual fica visível — clicar no item do menu só muda o hash. As secções continuam
    // no DOM (os formulários existem todos) e o que muda é só o que se mostra.
    // A FOLHA DO CELULAR. `mostrarSecao` fecha-a em toda navegação — o destino foi
    // escolhido, e deixá-la aberta taparia justamente a secção que se acabou de pedir.
    // `fecharMenu` e `abrirMenu` são declarações de função (não `var`), e por isso já
    // existem quando `mostrarSecao()` roda na linha seguinte — a ordem do texto não é a
    // ordem de execução.
    'function abrirMenu() {' +
    '  var lat = document.querySelector(".lateral");' +
    '  var b = document.getElementById("lateral-abrir");' +
    '  if (!lat || !b) return;' +
    '  lat.setAttribute("data-aberta", "sim");' +
    '  b.setAttribute("aria-expanded", "true");' +
    // A S5: o botão que mora na barra do sistema abre a MESMA folha — não há uma segunda
    // navegação para o celular. O `aria-expanded` vai nos dois, porque os dois são o mesmo
    // controle em dois lugares.
    '  var b5 = document.getElementById("s5-secoes");' +
    '  if (b5) b5.setAttribute("aria-expanded", "true");' +
    // Travar a rolagem do fundo: com a folha aberta, rolar a página POR BAIXO dela é o
    // gesto que faz o usuário perder a folha de vista sem a ter fechado.
    '  document.body.style.overflow = "hidden";' +
    '}' +
    'function fecharMenu() {' +
    '  var lat = document.querySelector(".lateral");' +
    '  var b = document.getElementById("lateral-abrir");' +
    '  if (!lat) return;' +
    '  if (lat.getAttribute("data-aberta") !== "sim") return;' +
    '  lat.setAttribute("data-aberta", "nao");' +
    '  if (b) b.setAttribute("aria-expanded", "false");' +
    '  var b5 = document.getElementById("s5-secoes");' +
    '  if (b5) b5.setAttribute("aria-expanded", "false");' +
    '  document.body.style.overflow = "";' +
    '}' +
    // O GRUPO de um destino: o `<h2>` que vem antes dele. Lido do próprio documento, e
    // não de uma segunda lista no JavaScript — a lista dos grupos já está no HTML, e uma
    // cópia aqui divergiria dela no dia em que um grupo mudasse.
    'function grupoDoLink(a) {' +
    '  var n = a.previousElementSibling;' +
    '  while (n) { if (n.tagName === "H2") return n.textContent; n = n.previousElementSibling; }' +
    '  return "";' +
    '}' +
    'function mostrarSecao() {' +
    '  var alvo = (location.hash || "#painel").replace("#", "");' +
    '  var secoes = document.querySelectorAll(".secao");' +
    '  var visivel = "painel";' +
    '  for (var i = 0; i < secoes.length; i++) {' +
    '    var s = secoes[i];' +
    '    var id = s.id.replace("sec-", "");' +
    '    if (id === alvo) { s.hidden = false; visivel = id; } else { s.hidden = true; }' +
    '  }' +
    '  var links = document.querySelectorAll(".lateral a");' +
    '  for (var j = 0; j < links.length; j++) {' +
    '    if (links[j].getAttribute("data-secao") === visivel) {' +
    '      links[j].className = "ativo";' +
    // `aria-current` é o que diz ao leitor de ecrã qual é a secção ATUAL — a classe só
    // muda a cor. Sem isto, a folha anunciava sete destinos iguais.
    '      links[j].setAttribute("aria-current", "page");' +
    // A barra do celular diz onde se está — GRUPO e página, porque só o nome da página
    // deixa o professor sem saber a que grupo ela pertence («Curadorias» é de Pedagogia,
    // e isso não se adivinha).
    '      var g = document.getElementById("lateral-grupo");' +
    '      var n = document.getElementById("lateral-nome");' +
    '      if (g) g.textContent = grupoDoLink(links[j]);' +
    '      if (n) n.textContent = links[j].textContent;' +
    // A S5 diz O MESMO caminho na barra do sistema. São duas cópias do MESMO texto, e por
    // isso a escrita é aqui e não num segundo lugar: uma segunda fonte do nome da página
    // divergiria dele no dia em que o menu mudasse.
    '      var g5 = document.getElementById("s5-grupo");' +
    '      var n5 = document.getElementById("s5-nome");' +
    '      if (g5) g5.textContent = grupoDoLink(links[j]);' +
    '      if (n5) n5.textContent = links[j].textContent;' +
    '    } else { links[j].className = ""; links[j].removeAttribute("aria-current"); }' +
    '  }' +
    '  fecharMenu();' +
    '}' +
    'window.addEventListener("hashchange", mostrarSecao);' +
    'mostrarSecao();' +
    '(function(){' +
    '  var b = document.getElementById("lateral-abrir");' +
    '  var veu = document.getElementById("lateral-veu");' +
    '  if (b) b.addEventListener("click", abrirMenu);' +
    '  if (veu) veu.addEventListener("click", fecharMenu);' +
    // S5 — O BOTÃO «SEÇÕES» DA BARRA DO SISTEMA abre a mesma folha. Ele existe só no
    // celular (o CSS o esconde fora), e é o caminho para trocar de secção quando a barra
    // da página já saiu de quadro.
    '  var b5 = document.getElementById("s5-secoes");' +
    '  if (b5) b5.addEventListener("click", abrirMenu);' +
    // O `Escape` é o gesto que se espera de uma folha modal, e no teclado não há véu para
    // clicar. Fecha também quando a janela cresce: em tela larga a folha não existe, e o
    // `overflow:hidden` do `body` ficaria a travar a página sem nada aberto.
    '  document.addEventListener("keydown", function(e){ if (e.key === "Escape") fecharMenu(); });' +
    '  window.addEventListener("resize", function(){ if (window.innerWidth > 768) fecharMenu(); });' +
    // S5 — «DESCIDO» É UMA DECISÃO, NÃO UM NÚMERO CONTÍNUO. O limiar de 24px evita a
    // barra piscar a cada pixel, e é o mesmo do estudo de opções visuais. O evento é
    // `passive` porque o ouvinte só LÊ a posição: dizer isso ao navegador evita que ele
    // espere pelo nosso retorno antes de pintar a rolagem.
    // O ESPAÇO FANTASMA DO HAMBÚRGUER (18/10/2026). O `nav.js` mede a barra e publica a
    // altura em `--header-height`, e o `body` usa-a como `padding-top`. Quando o painel do
    // menu abre, a barra cresce e a medida acompanha; mas fechar o painel por um clique
    // FORA da barra (o «Seções» da página, por exemplo) não remedava — e a altura do menu
    // aberto ficava no `body`, como um vão vazio acima do conteúdo. Aqui a medida é
    // refeita sempre que a barra muda de estado, e não só quando o `nav.js` se lembra.
    'function ajustarAlturaDaBarra(){' +
    // As duas guardas não são zelo: a página também é executada num DOM de prova (o
    // `provar-producao`), onde `documentElement`/`style` podem não existir. Sem elas, o
    // script morria no arranque e as provas seguintes mediam uma página que já parou.
    '  var n = document.querySelector(".topnav");' +
    '  var raiz = document.documentElement;' +
    '  if (n && raiz && raiz.style && n.offsetHeight) raiz.style.setProperty("--header-height", n.offsetHeight + "px");' +
    '}' +
    '(function(){' +
    '  var n = document.querySelector(".topnav");' +
    '  if (!n) return;' +
    '  if (window.MutationObserver) {' +
    '    new MutationObserver(ajustarAlturaDaBarra).observe(n, {attributes: true, attributeFilter: ["class", "data-descido"]});' +
    '  }' +
    '  window.addEventListener("resize", ajustarAlturaDaBarra);' +
    '  document.addEventListener("click", function(){ setTimeout(ajustarAlturaDaBarra, 0); });' +
    '  ajustarAlturaDaBarra();' +
    '})();' +
    '  var barraDoTopo = document.querySelector(".topnav");' +
    '  function marcarDescido(){' +
    '    if (!barraDoTopo) return;' +
    '    var descido = (window.pageYOffset || window.scrollY || 0) > 24 ? "sim" : "nao";' +
    '    barraDoTopo.setAttribute("data-descido", descido);' +
    // O `body` também sabe: é ele que manda SUMIR a barra da página. Sem isto, a barra do
    // conteúdo descia por baixo do menu fixo e ficava meio visível — e durante essa fração
    // de rolagem havia DOIS «Seções» e dois «Pedagogia · Turmas» na tela.
    '    document.body.setAttribute("data-descido", descido);' +
    '  }' +
    '  window.addEventListener("scroll", marcarDescido, { passive: true });' +
    '  marcarDescido();' +
    '})();' +
    'function postar(id, corpo) {' +
    '  corpo.token = TOKEN;' +
    '  var res = document.getElementById("res");' +
    '  res.className = "res"; res.textContent = "cadastrando...";' +
    '  return fetch(id === "form-prof" ? "/api/bastidores/professor" : "/api/bastidores/aluna", {' +
    '    method: "POST",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { res.className = "res erro"; res.textContent = "Erro: " + (d.erro || "desconhecido"); }' +
    '  }).catch(function(err){ res.className = "res erro"; res.textContent = "Erro: " + err.message; });' +
    '}' +
    'document.getElementById("form-prof").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  postar("form-prof", {nome: document.getElementById("pnome").value,' +
    '    sobrenome: document.getElementById("psobrenome").value,' +
    '    senha: document.getElementById("psenha").value});' +
    '});' +
    'document.getElementById("form-aluna").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  postar("form-aluna", {apelido: document.getElementById("anome").value});' +
    '});' +
    // As caixas marcadas de um grupo — usado pelos dias da semana (as pílulas curtas).
    // A leitura é por `input` + `name`, e não pelo seletor `input[name="…"]:checked`: assim
    // a função não depende de um motor de seletores completo, e a prova que a executa num
    // DOM mínimo consegue exercitá-la (o DOM de mentira conhece `input` e as propriedades,
    // não a gramática dos atributos).
    'function marcados(nome) {' +
    '  return Array.prototype.slice.call(document.querySelectorAll("input"))' +
    '    .filter(function(x){ return x.name === nome && x.checked; })' +
    '    .map(function(x){ return x.value; });' +
    '}' +
    // AS HORAS DE INÍCIO, por dia — o mapa que o servidor grava em `horarios`. Lê os campos
    // pelo `data-dia`, e não pela lista dos dias: assim o formulário não precisa de repetir
    // no JavaScript o rol que já declara no servidor. Um campo DESABILITADO (dia não
    // escolhido) não entra: a hora não existe para um dia que a turma não tem.
    'function horariosDoDia() {' +
    '  var o = {};' +
    '  Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){' +
    '    var d = x.getAttribute("data-dia");' +
    '    if (d && x.value && !x.disabled) o[d] = x.value;' +
    '  });' +
    '  return o;' +
    '}' +
    // A HORA SÓ SE HABILITA PARA O DIA ESCOLHIDO (16/10/2026), e desescolher LIMPA o campo.
    // Sem isto, o horário de um dia fica escrito ao lado de uma pílula apagada — poluído, e
    // a sugerir uma aula que não existe.
    'function diaEstaMarcado(d) {' +
    '  if (!document.querySelector) return true;' +
    '  var p = document.querySelector("input[name=\\"dia\\"][value=\\"" + d + "\\"]");' +
    '  return !!(p && p.checked);' +
    '}' +
    'function sincronizarHoras() {' +
    '  Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){' +
    '    var d = x.getAttribute("data-dia");' +
    '    var marcado = diaEstaMarcado(d);' +
    '    x.disabled = !marcado;' +
    '    if (!marcado) x.value = "";' +
    '  });' +
    '}' +
    // A FREQUÊNCIA NÃO TEM LINHA NA TELA (18/10/2026). Ela é a CONTAGEM dos dias marcados —
    // o servidor a calcula e a listagem e o plano a mostram. Enquanto havia uma linha
    // «Frequência semanal», ela parecia um campo e pedia um número mesmo quando o número já
    // estava decidido; sem ela, os dias são a única declaração possível.
    // O PROGRAMA DE REFERÊNCIA É UMA LISTA. Um valor antigo (texto livre) entra como opção
    // própria, porque o que a turma já declara não se perde ao reabri-la.
    'function selecionarPrograma(valor) {' +
    '  var sel = document.getElementById("tprograma");' +
    '  if (!sel) return;' +
    '  var v = String(valor == null ? "" : valor);' +
    '  var existe = false;' +
    '  for (var i = 0; i < sel.options.length; i++) {' +
    '    if (sel.options[i].value === v) { existe = true; break; }' +
    '  }' +
    '  if (v && !existe) {' +
    '    var o = document.createElement("option");' +
    '    o.value = v; o.textContent = v;' +
    '    sel.appendChild(o);' +
    '  }' +
    '  sel.value = v;' +
    '}' +
    'document.addEventListener("change", function(e){' +
    '  var alvo = e.target;' +
    '  if (alvo && alvo.name === "dia") sincronizarHoras();' +
    '});' +
    // No arranque, o formulário nasce com as sete horas desabilitadas — nenhum dia escolhido.
    'sincronizarHoras();' +
    // AS FICHAS de um escolhedor — o que foi escolhido, na ordem em que se escolheu.
    'function fichasDe(id) {' +
    '  var el = document.getElementById(id);' +
    '  if (!el || !el.querySelectorAll) return [];' +
    '  return Array.prototype.slice.call(el.querySelectorAll(".escolhido")).map(function(f){ return f.getAttribute("data-valor"); });' +
    '}' +
    'function mostrarVazio(el) {' +
    '  var vazio = el.querySelector(".escolhidos .vazio");' +
    '  if (!vazio) return;' +
    '  vazio.hidden = !!el.querySelector(".escolhido");' +
    '}' +
    'function adicionarFicha(el, valor) {' +
    '  valor = String(valor || "").trim();' +
    '  if (!valor) return false;' +
    '  if (fichasDe(el.id).indexOf(valor) !== -1) return false;' +
    '  var f = document.createElement("span");' +
    '  f.className = "escolhido";' +
    '  f.setAttribute("data-valor", valor);' +
    '  f.textContent = valor;' +
    '  var b = document.createElement("button");' +
    '  b.type = "button"; b.className = "tirar icone"; b.title = "Tirar " + valor; b.textContent = "×";' +
    '  f.appendChild(b);' +
    '  el.querySelector(".escolhidos").appendChild(f);' +
    '  mostrarVazio(el);' +
    '  return true;' +
    '}' +
    // O «Adicionar» do escolhedor: pega o item do menu, vira ficha. A validação de valor
    // inventado que existia aqui SAIU com o lookup — o `<select>` só oferece o que existe.
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest(".escolhedor .adicionar") : null;' +
    '  if (b) {' +
    '    var el = b.closest(".escolhedor");' +
    '    var fonte = el.querySelector("select.opcoes");' +
    '    var valor = fonte ? fonte.value : "";' +
    '    if (!valor) { alert("Escolha um item antes de adicionar."); return; }' +
    '    if (adicionarFicha(el, valor)) fonte.value = "";' +
    '    return;' +
    '  }' +
    '  var t = e.target.closest ? e.target.closest(".escolhedor .tirar") : null;' +
    '  if (t) {' +
    '    var ficha = t.closest(".escolhido");' +
    '    var dono = t.closest(".escolhedor");' +
    '    if (ficha && dono) { ficha.parentElement.removeChild(ficha); mostrarVazio(dono); }' +
    '  }' +
    '});' +
    // O `aoOk` É O QUE FAZ A PASSAGEM ENTRE PASSOS (18/10/2026). Ele roda quando o servidor
    // respondeu `ok` e ANTES do recarregar — e é onde se diz para que passo ir. Sem ele, cada
    // «Avançar» gravava e recarregava para o passo onde já se estava, porque a memória do passo
    // só é escrita por `mostrarPasso` — e ninguém a escrevia antes do recarregamento.
    //
    // E ele só roda em caso de SUCESSO: um «Avançar» que falhou não pode levar ninguém a
    // avançar. É a diferença entre um botão e uma promessa.
    'function enviar(ep, corpo, mensagem, recarregar, aoOk) {' +
    '  corpo.token = TOKEN;' +
    '  var res = document.getElementById("res");' +
    '  res.className = "res"; res.textContent = mensagem;' +
    '  return fetch(ep, {' +
    '    method: "POST",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) {' +
    '      if (typeof aoOk === "function") aoOk(d);' +
    '      if (recarregar) { location.reload(); }' +
    '      else { res.className = "res ok"; res.textContent = "ok (" + (d.turmasNovas != null ? d.turmasNovas + " turmas, " + d.termosNovos + " termos, " + d.associacoes + " associações" : "feito") + ")"; }' +
    '    }' +
    '    else { res.className = "res erro"; res.textContent = "Erro: " + (d.erro || "desconhecido"); }' +
    '  }).catch(function(err){ res.className = "res erro"; res.textContent = "Erro: " + err.message; });' +
    '}' +
    'document.getElementById("form-turma").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    // DOIS MODOS no mesmo formulário (16/10/2026): cadastrar (sem `tderivar`) e AJUSTAR
    // (com `tderivar`). O ajuste é uma derivação — não sobrescreve a turma.
    '  var derivando = (document.getElementById("tderivar") || {}).value || "";' +
    '  var campos = {' +
    '    nome: document.getElementById("tnome").value,' +
    // A POSIÇÃO NÃO SE ENVIA (18/10/2026): quem a decide é o servidor, pondo a turma nova no
    // topo. Enviar o campo vazio obrigaria o servidor a distinguir «não quis dizer nada» de
    // «quer no fim» — e o fim nunca é o que a direção quer ao criar uma turma.
    '    programaReferencia: document.getElementById("tprograma").value,' +
    '    nivelReferencia: fichasDe("esc-niveis").join(", "),' +
    '    descricao: document.getElementById("tdescricao").value,' +
    // A frequência NÃO se envia mais do formulário: o servidor a calcula a partir dos
    // dias. O campo continua a existir no JSON — só deixou de vir de um `<input>`.
    '    dias: marcados("dia"),' +
    '    horarios: horariosDoDia(),' +
    '    duracaoMin: document.getElementById("tduracao").value,' +
    '    periodoInicio: document.getElementById("tinicio").value,' +
    '    periodoFim: document.getElementById("tfim").value' +
    // A régua SAIU daqui: a turma nasce sem ela, e a régua entra pelo vínculo (aba
    // «Vincular turma à rubrica»). Sem rubrica ligada, a leitura aplica a padrão.
    '  };' +
    '  if (!derivando) {' +
    '    enviar("/api/bastidores/turma", campos, "gravando a turma...", true, avancarParaRubricas); return;' +
    '  }' +
    // DOIS CAMINHOS, e a diferença não é cosmética (16/10/2026): a turma LIVRE edita-se (o
    // registo é substituído no lugar, e o nome pode mudar); a VINCULADA a um plano de ensino
    // deriva (nasce um elo novo, com data, e o nome NÃO muda — é ele que o plano referencia).
    '  var modo = (document.getElementById("tmodo") || {}).value || "derivar";' +
    '  if (modo === "editar") {' +
    '    campos.id = derivando;' +
    '    enviar("/api/bastidores/turma-editar", campos, "gravando a turma...", true, avancarParaRubricas); return;' +
    '  }' +
    '  var vig = document.getElementById("tvigencia").value;' +
    '  if (!vig) { alert("Informe a data a partir da qual a turma ajustada vale."); return; }' +
    '  campos.derivarDe = derivando;' +
    '  campos.vigencia = vig;' +
    '  enviar("/api/bastidores/turma-derivar", campos, "ajustando a turma...", true, avancarParaRubricas);' +
    '});' +
    'document.getElementById("form-termo").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  enviar("/api/bastidores/termo", {' +
    '    termo: document.getElementById("vtermo").value,' +
    '    categoria: document.getElementById("vcategoria").value,' +
    '    tradicao: document.getElementById("vtradicao").value' +
    '  }, "cadastrando termo...", true);' +
    '});' +
    // A RÉGUA DA RUBRICA — a lista editável de níveis (uma por turma).
    // AS RUBRICAS, para o botão «Editar» da lista abrir a rubrica no formulário sem pedir ao
    // servidor: o mapa já veio com a página.
    'var RUBRICAS = ' + JSON.stringify(listaRubricas) + ';' +
    // AS TURMAS VIGENTES, para o «Ajustar» abrir o formulário com o que vale hoje sem pedir ao
    // servidor: o mapa já veio com a página (16/10/2026). Só as vigentes — uma substituída não
    // é ponto de partida de um ajuste novo.
    'var TURMAS = ' + JSON.stringify(listaTurmas) + ';' +
    // O BOTÃO DE UM CARTÃO — «Editar» numa turma LIVRE, «Derivar» numa VINCULADA (16/10/2026).
    // Enche o formulário com a turma de hoje e põe o modo. A diferença que a escola sente:
    // no «Derivar» o nome fica travado (é ele que a curadoria e o plano referenciam) e há uma
    // data a declarar; no «Editar» o nome é corrigível e não há data — o registo é substituído.
    'function ajustarTurma(id, modo) {' +
    '  var t = null;' +
    '  for (var i = 0; i < TURMAS.length; i++) { if (TURMAS[i] && TURMAS[i].id === id) { t = TURMAS[i]; break; } }' +
    '  if (!t) { alert("Turma não encontrada na lista."); return; }' +
    '  var derivar = modo !== "editar";' +
    // «EDITAR» ABRE O FORMULÁRIO (18/10/2026). O cartão está na listagem, e a listagem é o
    // que se vê quando a faixa está recolhida — clicar em «Editar» e não acontecer nada
    // visível seria o pior desfecho do recolhimento.
    '  definirFormularioRecolhido(false);' +
    // ENTRAR NO MODO EDIÇÃO (18/10/2026): é o clique em «Editar»/«Derivar» que liga os «!» dos
    // passos, e é aqui que a turma é lembrada para o passo Associar a mostrar — não a primeira
    // da lista, mas a que se está a editar.
    '  try { sessionStorage.setItem("producao:editando", "turma"); sessionStorage.setItem("producao:vinc-turma", t.id); } catch (err) {}' +
    '  aplicarEditando();' +
    '  document.getElementById("tderivar").value = t.id;' +
    '  document.getElementById("tmodo").value = derivar ? "derivar" : "editar";' +
    '  document.getElementById("t-vigencia-campo").hidden = !derivar;' +
    // O BOTÃO DO PASSO 1 continua a ser «Avançar» — editar não muda a direção da sequência.
    '  document.getElementById("t-enviar").textContent = "Avançar";' +
    '  var nome = document.getElementById("tnome");' +
    '  nome.value = t.nome || ""; nome.readOnly = derivar;' +
    // O PROGRAMA É UMA LISTA: se o valor gravado for de uma época anterior (texto livre), ele
    // entra como opção própria — abrir a turma não pode perder a referência que ela declara.
    '  selecionarPrograma(t.programaReferencia || "");' +
    '  document.getElementById("tdescricao").value = t.descricao || "";' +
    '  document.getElementById("tduracao").value = (t.duracaoMin == null ? "" : t.duracaoMin);' +
    '  document.getElementById("tinicio").value = t.periodoInicio || "";' +
    '  document.getElementById("tfim").value = t.periodoFim || "";' +
    // OS CONTEÚDOS NÃO ESTÃO MAIS AQUI (18/10/2026): eles vivem no passo 3, «Associar», e
    // são preenchidos por `sincronizarAssociacao()` a partir do `select` de turma. Este
    // formulário ficou com o que é da turma — e nada mais.
    // OS NÍVEIS e OS DIAS são fichas e pílulas: limpam e voltam a marcar, para o ajuste não
    // herdar o que se escolheu para outra turma.
    '  var esc = document.getElementById("esc-niveis");' +
    '  if (esc) {' +
    '    Array.prototype.slice.call(esc.querySelectorAll(".escolhido")).forEach(function(f){ f.parentElement.removeChild(f); });' +
    '    mostrarVazio(esc);' +
    '    String(t.nivelReferencia || "").split(",").forEach(function(n){ n = n.trim(); if (n) adicionarFicha(esc, n); });' +
    '  }' +
    '  Array.prototype.slice.call(document.querySelectorAll("input[name=\\"dia\\"]")).forEach(function(p){ p.checked = false; });' +
    '  (t.dias || []).forEach(function(d){' +
    '    var p = document.querySelector("input[name=\\"dia\\"][value=\\"" + d + "\\"]");' +
    '    if (p) p.checked = true;' +
    '  });' +
    '  Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){' +
    '    var d = x.getAttribute("data-dia");' +
    '    x.value = (t.horarios && t.horarios[d]) ? t.horarios[d] : "";' +
    '  });' +
    // As horas seguem os dias: as de um dia não escolhido não se habilitam, e as escolhidas
    // ficam com o valor da turma (o `sincronizarHoras` limpa as outras).
    '  sincronizarHoras();' +
    '  Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){' +
    '    var d = x.getAttribute("data-dia");' +
    '    if (!x.disabled && t.horarios && t.horarios[d]) x.value = t.horarios[d];' +
    '  });' +
    // «EDITAR» EDITA OS TRÊS PASSOS, E NÃO SÓ O PRIMEIRO (18/10/2026). A rubrica da turma entra
    // no passo 2 pronta a corrigir; a rubrica escolhida e os conteúdos da turma entram no passo
    // 3. É a possibilidade que o dono do produto pediu com todas as letras: um único botão,
    // «Editar», e tudo o que é daquela turma fica editável.
    '  var r = rubricaDaTurma(t);' +
    '  var rid = (r && RUBRICAS.some(function(x){ return x.id === r.id; })) ? r.id : "";' +
    '  document.getElementById("rubr-id").value = rid;' +
    '  document.getElementById("rubr-nome").value = rid ? r.nome : "";' +
    '  pintarEditorDaRubrica(rid ? (r.niveis || []) : []);' +
    // A RÉGUA DO PASSO 3 É A DESTA TURMA — explícita, e não a sugestão de `sincronizarAssociacao`
    // (que só preenche um `select` vazio). Entrar em «Editar» é dizer «é esta turma»; a escolha
    // anterior, de outra turma, não pode sobreviver.
    '  var selR = document.getElementById("vinc-rubrica");' +
    '  if (selR) selR.value = rid;' +
    '  atualizarTurmaEmFoco();' +
    '  sincronizarAssociacao();' +
    // A data de vigência nasce com hoje: é o caso normal (a escola descobre o erro e corrige
    // agora). A escola muda se o ajuste for retroativo.
    '  var hoje = new Date();' +
    '  var iso = hoje.getFullYear() + "-" + ("0" + (hoje.getMonth() + 1)).slice(-2) + "-" + ("0" + hoje.getDate()).slice(-2);' +
    '  document.getElementById("tvigencia").value = iso;' +
    '  mostrarPasso("turma");' +
    '  if (derivar) document.getElementById("t-vigencia-campo").scrollIntoView({block: "center"});' +
    '  (derivar ? document.getElementById("tvigencia") : nome).focus();' +
    '  gravarEstado();' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("[data-turma-ajustar]") : null;' +
    '  if (b) { ajustarTurma(b.getAttribute("data-turma-ajustar"), b.getAttribute("data-modo")); return; }' +
    // O CANCELAR É O MESMO NOS TRÊS PASSOS (18/10/2026): sai da edição inteira e devolve um
    // formulário vazio, no passo 1. Não é «limpar este campo» nem «voltar um passo» — é
    // desistir da edição, e por isso a memória do preenchimento também se apaga.
    '  if (e.target.closest && e.target.closest("button.cancelar-edicao")) { cancelarEdicao(); }' +
    '});' +
    // AS CURADORIAS VIGENTES, para o «Editar»/«Derivar» as abrir no formulário sem pedir ao
    // servidor (16/10/2026): o mapa já veio com a página.
    'var CURADORIAS = ' + JSON.stringify(listaCuradorias) + ';' +
    // AS ALUNAS DA ESCOLA, e o mapa de quem já está comprometida numa modalidade (16/10/2026).
    // A lista de alunas do formulário é FILTRADA pela modalidade e pela turma escolhidas: uma
    // aluna pertence a UMA turma por modalidade, e oferecê-la outra vez era deixar a escola
    // criar o conflito que o servidor depois recusa.
    'var ALUNAS_TODAS = ' + JSON.stringify(aluns) + ';' +
    'function turmasDeUma(c) {' +
    '  if (!c) return [];' +
    '  if (c.turmas && c.turmas.length) return c.turmas;' +
    '  return c.turma ? [c.turma] : [];' +
    '}' +
    // Quem já está noutra turma DESTA modalidade, e em qual. A curadoria que se está a abrir
    // fica de fora — as alunas dela não competem consigo mesmas.
    'function alunasOcupadas(modalidade, idQueEdita) {' +
    '  var onde = {};' +
    '  for (var i = 0; i < CURADORIAS.length; i++) {' +
    '    var c = CURADORIAS[i];' +
    '    if (!c || c.id === idQueEdita) continue;' +
    '    if (String(c.modalidade || "") !== String(modalidade || "")) continue;' +
    '    var turma = turmasDeUma(c)[0] || "(sem turma)";' +
    '    var as = c.alunas || [];' +
    '    for (var j = 0; j < as.length; j++) if (as[j] && !onde[as[j]]) onde[as[j]] = turma;' +
    '  }' +
    '  return onde;' +
    '}' +
    // O REFILTRO: reconstrói o menu das alunas com o que está livre, e TIRA as fichas que
    // passaram a estar ocupadas (trocar a modalidade depois de escolher é o caso que as cria).
    'function refiltrarAlunas() {' +
    '  var el = document.getElementById("esc-alunas");' +
    '  if (!el || !el.querySelector || !el.querySelectorAll) return;' +
    '  var modalidade = document.getElementById("cumodalidade").value;' +
    '  var idAtual = (document.getElementById("cuderivar") || {}).value || "";' +
    '  var ocupadas = alunasOcupadas(modalidade, idAtual);' +
    '  var saiu = [];' +
    '  Array.prototype.slice.call(el.querySelectorAll(".escolhido")).forEach(function(f){' +
    '    var v = f.getAttribute("data-valor");' +
    '    if (ocupadas[v]) {' +
    '      saiu.push(v + " (em " + ocupadas[v] + ")");' +
    '      f.parentElement.removeChild(f);' +
    '    }' +
    '  });' +
    '  mostrarVazio(el);' +
    '  var sel = el.querySelector("select.opcoes");' +
    '  if (sel && sel.options) {' +
    '    while (sel.options.length > 1) sel.remove(1);' +
    '    for (var i = 0; i < ALUNAS_TODAS.length; i++) {' +
    '      var a = ALUNAS_TODAS[i];' +
    '      if (!a || ocupadas[a]) continue;' +
    '      var o = document.createElement("option");' +
    '      o.value = a; o.textContent = a;' +
    '      sel.appendChild(o);' +
    '    }' +
    '  }' +
    '  var res = document.getElementById("res");' +
    '  if (res && saiu.length) {' +
    '    res.className = "res erro";' +
    '    res.textContent = "Já estão noutra turma desta modalidade: " + saiu.join("; ") + ".";' +
    '  }' +
    '}' +
    // Trocar a modalidade ou a turma refiltra — e limpar o par também repõe a lista toda.
    'document.addEventListener("change", function(e){' +
    '  var alvo = e.target;' +
    '  if (alvo && (alvo.id === "cumodalidade" || alvo.id === "cuturma")) refiltrarAlunas();' +
    '});' +
    'refiltrarAlunas();' +
    // O BOTÃO DE UMA CURADORIA — a MESMA regra e o MESMO desenho da turma: «Editar» quando
    // ainda não nasceu o plano de ensino dela (o registo é substituído no lugar), «Derivar»
    // quando já nasceu (elo novo, com data, e a anterior no histórico).
    //
    // O PAR (professor, modalidade) NÃO se edita em nenhum dos modos: é ele que identifica a
    // curadoria — o id nasce dele —, tal como o nome da turma. No «Editar» os dois ficam
    // travados; no «Derivar» também, e acresce a data.
    'function ajustarCuradoria(id, modo) {' +
    '  var c = null;' +
    '  for (var i = 0; i < CURADORIAS.length; i++) { if (CURADORIAS[i] && CURADORIAS[i].id === id) { c = CURADORIAS[i]; break; } }' +
    '  if (!c) { alert("Curadoria não encontrada na lista."); return; }' +
    '  var derivar = modo !== "editar";' +
    '  document.getElementById("cuderivar").value = c.id;' +
    '  document.getElementById("cumodo").value = derivar ? "derivar" : "editar";' +
    // A DATA SÓ NA DERIVAÇÃO, e o «Cancelar» aparece por haver edição em curso.
    '  document.getElementById("cu-vigencia-campo").hidden = !derivar;' +
    '  document.getElementById("cu-cancelar").hidden = false;' +
    '  document.getElementById("cu-enviar").textContent = derivar ? "Gravar ajuste" : "Gravar curadoria";' +
    // Os três `select` ficam travados: o par identifica a curadoria, e a turma é o que ela
    // declara hoje — mudar de turma é derivar, não editar por baixo.
    '  document.getElementById("cuprofessor").value = c.professor;' +
    '  document.getElementById("cuprofessor").disabled = true;' +
    '  document.getElementById("cumodalidade").value = c.modalidade;' +
    '  document.getElementById("cumodalidade").disabled = true;' +
    '  document.getElementById("cutradicao").value = c.tradicao || "";' +
    '  var turmas = turmasDeUma(c);' +
    '  document.getElementById("cuturma").value = turmas.length ? turmas[0] : "";' +
    // PRIMEIRO o refiltro, DEPOIS as fichas: a lista de alunas oferecidas depende do par
    // (modalidade, turma) que acabou de ser posto, e as alunas DESTA curadoria não estão
    // ocupadas (o `cuderivar` já está preenchido, e `alunasOcupadas` exclui-a).
    '  refiltrarAlunas();' +
    // As ALUNAS e o REPERTÓRIO são fichas: limpam e voltam a marcar.
    '  [["esc-alunas", c.alunas || []], ["esc-repertorio", c.repertorio || []]].forEach(function(par){' +
    '    var el = document.getElementById(par[0]);' +
    '    if (!el) return;' +
    '    Array.prototype.slice.call(el.querySelectorAll(".escolhido")).forEach(function(f){ f.parentElement.removeChild(f); });' +
    '    mostrarVazio(el);' +
    '    par[1].forEach(function(v){ adicionarFicha(el, v); });' +
    '  });' +
    '  var hoje = new Date();' +
    '  var iso = hoje.getFullYear() + "-" + ("0" + (hoje.getMonth() + 1)).slice(-2) + "-" + ("0" + hoje.getDate()).slice(-2);' +
    '  document.getElementById("cuvigencia").value = iso;' +
    '  document.getElementById("form-curadoria").scrollIntoView({block: "start"});' +
    '  (derivar ? document.getElementById("cuvigencia") : document.getElementById("cu-enviar")).focus();' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("[data-curadoria-ajustar]") : null;' +
    '  if (b) { ajustarCuradoria(b.getAttribute("data-curadoria-ajustar"), b.getAttribute("data-modo")); return; }' +
    '  if (e.target.closest && e.target.closest("#cu-cancelar")) {' +
    '    document.getElementById("cuderivar").value = "";' +
    '    document.getElementById("cumodo").value = "";' +
    '    document.getElementById("cu-vigencia-campo").hidden = true;' +
    '    document.getElementById("cu-cancelar").hidden = true;' +
    '    document.getElementById("cu-enviar").textContent = "Atribuir curadoria";' +
    '    document.getElementById("cuprofessor").disabled = false;' +
    '    document.getElementById("cumodalidade").disabled = false;' +
    '    document.getElementById("form-curadoria").reset();' +
    '    [["esc-alunas"], ["esc-repertorio"]].forEach(function(par){' +
    '      var el = document.getElementById(par[0]);' +
    '      if (!el) return;' +
    '      Array.prototype.slice.call(el.querySelectorAll(".escolhido")).forEach(function(f){ f.parentElement.removeChild(f); });' +
    '      mostrarVazio(el);' +
    '    });' +
    // As alunas voltam todas a poder ser escolhidas: a modalidade foi reposta.
    '    refiltrarAlunas();' +
    '  }' +
    '});' +
    'var NIVEIS_PADRAO = ' + JSON.stringify(NIVEIS_DA_RUBRICA) + ';' +
    'function linhaDaReguaNoDom(valor) {' +
    '  var s = document.createElement("span");' +
    '  s.className = "linha-regua";' +
    '  var i = document.createElement("input");' +
    '  i.name = "rubrica"; i.autocomplete = "off"; i.placeholder = "ex.: Satisfatório";' +
    '  i.value = valor == null ? "" : String(valor);' +
    '  var b = document.createElement("button");' +
    '  b.type = "button"; b.className = "tirar-regua icone"; b.title = "Remover este nível";' +
    '  b.textContent = "✕";' +
    '  s.appendChild(i); s.appendChild(b);' +
    '  return s;' +
    '}' +
    'function reguaDoEditor(id) {' +
    '  var dono = document.getElementById(id);' +
    '  if (!dono) return [];' +
    '  return Array.prototype.slice.call(dono.querySelectorAll("input[name=\\"" + "rubrica" + "\\"]"))' +
    '    .map(function(x){ return x.value.trim(); })' +
    '    .filter(function(v){ return v; });' +
    '}' +
    'function pintarEditorDaRubrica(niveis) {' +
    '  var dono = document.getElementById("rubr-niveis");' +
    '  while (dono.firstChild) dono.removeChild(dono.firstChild);' +
    '  for (var i = 0; i < niveis.length; i++) dono.appendChild(linhaDaReguaNoDom(niveis[i]));' +
    '}' +
    'document.getElementById("rubr-add").addEventListener("click", function(){' +
    '  document.getElementById("rubr-niveis").appendChild(linhaDaReguaNoDom(""));' +
    '  gravarEstado();' +
    '});' +
    'document.getElementById("rubr-voltar").addEventListener("click", function(){ irParaPasso("turma"); });' +
    // O «EDITAR RUBRICA» SAIU DA LISTAGEM (18/10/2026). Ele era um segundo botão de edição,
    // dentro do painel da régua, e o dono do produto foi explícito: o único botão que aciona
    // edição é o «Editar» do cartão da turma — e ele abre os três passos, rubrica incluída.
    // Sem entrada própria, a rubrica edita-se pelo passo 2, já preenchida por `ajustarTurma`.
    'document.getElementById("form-rubrica").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  var nome = document.getElementById("rubr-nome").value.trim();' +
    '  var niveis = reguaDoEditor("rubr-niveis");' +
    // O PASSO É OBRIGATÓRIO DE PASSAR, OPCIONAL DE PREENCHER: com nome, grava e segue; sem nada,
    // segue sem criar. Nome sem níveis (ou níveis sem nome) é preenchimento pela metade.
    '  if (!nome && !niveis.length) { irParaPasso("vincular"); return; }' +
    '  if (!nome) { alert("Dê um nome à rubrica antes de avançar — ou remova os níveis para passar sem criar."); return; }' +
    '  if (!niveis.length) { alert("Declare pelo menos um nível — a régua vazia mediria contra nada."); return; }' +
    '  enviar("/api/bastidores/rubrica", {' +
    '    id: document.getElementById("rubr-id").value,' +
    '    nome: nome,' +
    '    niveis: niveis' +
    '  }, "salvando a rubrica...", true, avancarParaAssociar);' +
    '});' +
    // ================= O PASSO 3 — ASSOCIAR ==================================
    // Dois blocos, uma turma. A turma NÃO se escolhe aqui (18/10/2026): ela é a que está em
    // foco — a que se acabou de gravar no passo 1 ou a que se mandou editar na listagem. A
    // memória em `sessionStorage` continua a existir, mas agora guarda ESSA turma: associar
    // chama a API e RECARREGA, e sem memória o passo 3 perderia a quem estava a associar.
    'function turmaEmFoco(){' +
    '  var id = "";' +
    '  try { id = sessionStorage.getItem("producao:vinc-turma") || ""; } catch (err) {}' +
    '  if (!id) {' +
    '    var e = lerEstado();' +
    '    id = (e.vincular && e.vincular.turma) || (e.turma && e.turma.__derivar) || "";' +
    '  }' +
    '  return String(id || "");' +
    '}' +
    'function turmaDoFoco(){ return turmaPorId(turmaEmFoco()); }' +
    // O NOME DA TURMA NO TOPO DOS PASSOS 2 E 3. É texto, não um controle: a turma já foi
    // decidida. `textContent` (e não `innerHTML`) porque o nome é dado da escola, e um nome
    // com «<» não pode virar markup.
    'function atualizarTurmaEmFoco(){' +
    '  var t = turmaDoFoco();' +
    '  var nome = t ? t.nome : "";' +
    '  var alvos = [["rubr-turma", "Rubrica da turma: "], ["vinc-turma-nome", "Associação da turma: "]];' +
    '  for (var i = 0; i < alvos.length; i++) {' +
    '    var el = document.getElementById(alvos[i][0]);' +
    '    if (!el) continue;' +
    '    el.hidden = !nome;' +
    '    el.textContent = nome ? alvos[i][1] + nome : "";' +
    '  }' +
    '}' +
    // CANCELAR A EDIÇÃO é o mesmo ato nos três passos: apaga a memória do preenchimento e do
    // modo, e recarrega no passo 1 com os formulários vazios (é o servidor que os serve
    // vazios). Sem `reload`, sobrariam campos e fichas de uma edição que já não existe.
    'function cancelarEdicao(){' +
    '  try {' +
    '    sessionStorage.removeItem("producao:form");' +
    '    sessionStorage.removeItem("producao:editando");' +
    '    sessionStorage.removeItem("producao:vinc-turma");' +
    '    sessionStorage.setItem("producao:passo", "turma");' +
    '  } catch (err) {}' +
    '  if (location && typeof location.reload === "function") location.reload();' +
    '}' +
    'function rubricaDaTurma(t){' +
    '  if (!t) return null;' +
    '  var id = String(t.rubricaId || "");' +
    '  if (!id) return null;' +
    '  for (var i = 0; i < RUBRICAS.length; i++) { if (RUBRICAS[i].id === id) return RUBRICAS[i]; }' +
    '  return {id: id, nome: "(rubrica que já não existe)", niveis: []};' +
    '}' +
    'function turmaPorId(id){' +
    '  for (var i = 0; i < TURMAS.length; i++) { if (TURMAS[i] && TURMAS[i].id === id) return TURMAS[i]; }' +
    '  return null;' +
    '}' +
    'function sincronizarAssociacao(){' +
    '  var id = turmaEmFoco();' +
    '  var t = turmaDoFoco();' +
    '  atualizarTurmaEmFoco();' +
    // --- o bloco dos CONTEÚDOS: os chips vêm do bloco oculto daquela turma -----------
    '  var lista = document.getElementById("vinc-conteudos");' +
    '  if (lista) {' +
    '    var fonte = null;' +
    '    Array.prototype.slice.call(document.querySelectorAll(".conteudos-da-turma")).forEach(function(d){' +
    '      if (d.getAttribute("data-de") === id) fonte = d;' +
    '    });' +
    '    lista.innerHTML = (fonte && fonte.innerHTML.trim())' +
    '      ? fonte.innerHTML' +
    '      : "<span class=\\"dono\\">(nenhum conteúdo associado)</span>";' +
    '  }' +
    // --- o bloco da RÉGUA: diz com que rubrica a turma está hoje ---------------------
    '  var r = rubricaDaTurma(t);' +
    '  var selR = document.getElementById("vinc-rubrica");' +
    // A RÉGUA DA TURMA É SUGERIDA, NÃO IMPOSTA: preenche o `select` só quando ele ainda está
    // vazio. Sobrescrever a escolha da direção a cada troca de passo seria o mesmo defeito do
    // `<select>` da turma — decidir por quem está a preencher.
    '  if (selR && !selR.value && r && RUBRICAS.some(function(x){ return x.id === r.id; })) selR.value = r.id;' +
    '  var estado = document.getElementById("vinc-estado");' +
    '  if (estado) {' +
    '    if (!t) { estado.textContent = ""; }' +
    '    else if (r) {' +
    '      estado.textContent = "Hoje: " + t.nome + " é medida por «" + r.nome + "» — " +' +
    '        (r.niveis || []).join(" · ") + ".";' +
    '    } else if ((t.rubrica || []).length) {' +
    '      estado.textContent = "Hoje: " + t.nome + " tem régua própria — " + t.rubrica.join(" · ") + ".";' +
    '    } else {' +
    '      estado.textContent = "Hoje: " + t.nome + " é medida pela régua padrão da escola.";' +
    '    }' +
    '  }' +
    '  try { if (id) sessionStorage.setItem("producao:vinc-turma", id); } catch (err) {}' +
    // A escolha da turma no passo 3 entra no MESMO estado dos outros formulários, e as
    // travas são reavaliadas: mudar de turma troca os chips, e são eles que decidem se
    // «Gravar turma» pode ser premido.
    '  if (typeof gravarEstado === "function") gravarEstado();' +
    '  if (typeof aplicarTravas === "function") aplicarTravas();' +
    '}' +
    // --- associar / desassociar a RUBRICA --------------------------------------------
    'document.getElementById("form-vincular").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  var turma = turmaEmFoco();' +
    '  var rubricaId = document.getElementById("vinc-rubrica").value;' +
    '  if (!turma) { alert("Grave a turma primeiro, no passo «Turma»."); return; }' +
    '  if (!rubricaId) { alert("Escolha uma rubrica — ou crie uma no passo «Rubricas»."); return; }' +
    '  enviar("/api/bastidores/turma-rubrica", {turma: turma, rubricaId: rubricaId}, "associando a rubrica...", true);' +
    '});' +
    'document.getElementById("vinc-desassociar").addEventListener("click", function(){' +
    '  var turma = turmaEmFoco();' +
    '  if (!turma) { alert("Grave a turma primeiro, no passo «Turma»."); return; }' +
    '  if (!confirm("Desassociar a rubrica desta turma? Ela volta a ser medida pela régua padrão.")) return;' +
    '  enviar("/api/bastidores/turma-rubrica", {turma: turma}, "desassociando a rubrica...", true);' +
    '});' +
    'document.getElementById("vinc-voltar").addEventListener("click", function(){ irParaPasso("rubrica"); });' +
    // «GRAVAR TURMA» É O FIM DA SEQUÊNCIA (18/10/2026). Grava a régua escolhida (se alguma) e
    // conclui: limpa o modo edição e volta ao passo 1. A turma em si já foi gravada no passo 1.
    'document.getElementById("vinc-gravar").addEventListener("click", function(){' +
    '  var turma = turmaEmFoco();' +
    // A VALIDAÇÃO MÁXIMA, AQUI TAMBÉM (18/10/2026). O botão já nasce desabilitado e só acende
    // com tudo preenchido; esta guarda é a segunda barreira, para o caso de o `disabled` ser
    // retirado por fora (ferramentas do navegador, uma página antiga em cache).
    '  var falta = faltaDaTurma().concat(faltaDaAssociacao());' +
    '  if (!turma || falta.length) {' +
    '    alert("Para gravar a turma, falta " + fraseDaFaltaNoCliente(falta) + "."); return;' +
    '  }' +
    '  var rubricaId = document.getElementById("vinc-rubrica").value;' +
    '  enviar("/api/bastidores/turma-rubrica", {turma: turma, rubricaId: rubricaId, concluir: true},' +
    '    "gravando a turma...", true, concluirTurma);' +
    '});' +
    // --- associar o CONTEÚDO à turma escolhida ---------------------------------------
    // O MESMO endpoint e o mesmo botão de antes; o que mudou é de ONDE vem a turma: era um
    // `data-turma` no próprio botão (o cartão da listagem), agora é a turma em foco.
    'document.getElementById("vinc-associar-termo").addEventListener("click", function(){' +
    '  var turma = turmaEmFoco();' +
    '  var sel = document.getElementById("vinc-termo");' +
    '  var termo = sel ? sel.value : "";' +
    '  if (!turma) { alert("Grave a turma primeiro, no passo «Turma»."); return; }' +
    '  if (!termo) { alert("Escolha um termo para associar."); return; }' +
    '  enviar("/api/bastidores/turma-conteudo", {turma: turma, termo: termo}, "associando...", true);' +
    '});' +
    // O «×» de cada chip: o markup vem do servidor (`.conteudos-da-turma`), e o handler
    // continua a ler o `data-turma` e o `data-termo` que lá estão.
    'document.getElementById("vinc-conteudos").addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("button.desassociar") : null;' +
    '  if (!b) return;' +
    '  var tId = b.getAttribute("data-turma");' +
    '  var tTermo = b.getAttribute("data-termo");' +
    '  if (!confirm("Desassociar «" + tTermo + "» desta turma?")) return;' +
    '  var corpo = {turma: tId, termo: tTermo, token: TOKEN};' +
    '  fetch("/api/bastidores/turma-conteudo", {method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify(corpo)})' +
    '    .then(function(r){ return r.json(); }).then(function(d){' +
    '      if (d.ok) { location.reload(); } else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '    }).catch(function(err){ alert("Erro: " + err.message); });' +
    '});' +
    // ================= A MEMÓRIA DO PASSO 3 ==================================
    // A TURMA EM FOCO e o passo em que se estava são lembrados enquanto a aba estiver aberta.
    // Sem isto, cada associação — que chama a API e RECARREGA — devolvia a direção ao passo 1,
    // e associar quatro conteúdos eram quatro vezes a mesma viagem.
    '(function(){' +
    '  var guardada = null;' +
    '  try { guardada = sessionStorage.getItem("producao:vinc-turma"); } catch (err) {}' +
    // A TURMA EM FOCO TEM PRIORIDADE SOBRE O ESTADO. `producao:vinc-turma` é escrita quando
    // uma turma acaba de ser gravada ou quando se entra em edição; o estado é escrito a cada
    // alteração. Se as duas discordarem, ganha a primeira — é a decisão mais explícita.
    '  if (guardada) {' +
    '    var e0 = lerEstado(); e0.vincular = e0.vincular || {}; e0.vincular.turma = guardada;' +
    '    gravarEstadoObjeto(e0);' +
    '  }' +
    // O FORMULÁRIO VOLTA PREENCHIDO. A ordem importa: o estado primeiro (é o que repõe os
    // campos), e só depois o passo e os «!» — que dependem do que o estado restaurou.
    '  if (typeof aplicarEstadoDoFormulario === "function") aplicarEstadoDoFormulario();' +
    '  mostrarPasso(passoGuardado());' +
    // Os «!» dos passos seguem a memória do modo edição — depois de cada recarregar, a página
    // reaplica-os (ou os esconde) sem perguntar.
    '  aplicarEditando();' +
    '})();' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("button.tirar-regua") : null;' +
    '  if (!b) return;' +
    '  var linha = b.parentElement;' +
    '  if (linha && linha.className === "linha-regua") linha.parentElement.removeChild(linha);' +
    '  gravarEstado();' +
    '});' +
    'document.getElementById("semear").addEventListener("click", function(e){' +
    '  if (!confirm("Carregar o catálogo inicial (turmas + vocabulário)? Registros já existentes não são duplicados.")) return;' +
    '  enviar("/api/bastidores/semear-catalogo", {}, "carregando catálogo inicial...", false);' +
    '});' +
    'document.getElementById("form-curadoria").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    // A TURMA é UMA (um `select`, como a modalidade): vai como lista de um, que é o formato
    // que o plano já lê. As ALUNAS e o REPERTÓRIO continuam múltiplos.
    '  var umaTurma = document.getElementById("cuturma").value;' +
    '  var campos = {' +
    '    professor: document.getElementById("cuprofessor").value,' +
    '    modalidade: document.getElementById("cumodalidade").value,' +
    '    tradicao: document.getElementById("cutradicao").value,' +
    '    turmas: umaTurma ? [umaTurma] : [],' +
    '    repertorio: fichasDe("esc-repertorio"),' +
    '    alunas: fichasDe("esc-alunas")' +
    '  };' +
    // CRIAR, EDITAR ou DERIVAR — a mesma bifurcação da turma (16/10/2026). Criar e editar vão
    // para a mesma rota (o id é o par professor+modalidade); o que os separa é a regra no
    // servidor, que recusa a edição de uma curadoria vinculada e manda derivar.
    '  var alvo = (document.getElementById("cuderivar") || {}).value || "";' +
    '  var modo = (document.getElementById("cumodo") || {}).value || "";' +
    '  if (!alvo) {' +
    '    enviar("/api/bastidores/curadoria", campos, "atribuindo curadoria...", true); return;' +
    '  }' +
    '  if (modo === "editar") {' +
    // A origem vai declarada: com a turma editável, o trio novo pode já não casar com o
    // registo de onde se partiu, e o servidor criaria uma curadoria ao lado da antiga.
    '    campos.idAntigo = alvo;' +
    '    enviar("/api/bastidores/curadoria", campos, "gravando curadoria...", true); return;' +
    '  }' +
    '  var vig = document.getElementById("cuvigencia").value;' +
    '  if (!vig) { alert("Informe a data a partir da qual a curadoria ajustada vale."); return; }' +
    '  campos.derivarDe = alvo;' +
    '  campos.vigencia = vig;' +
    '  enviar("/api/bastidores/curadoria-derivar", campos, "ajustando curadoria...", true);' +
    '});' +
    'document.addEventListener("click", function(e){' +
    '  var as = e.target.closest("button.associar");' +
    '  if (as) {' +
    '    var turmaId = as.getAttribute("data-turma");' +
    '    var sel = as.parentElement.querySelector("select.sel-termo");' +
    '    var termo = sel ? sel.value : "";' +
    '    if (!termo) { alert("Escolha um termo para associar."); return; }' +
    '    enviar("/api/bastidores/turma-conteudo", {turma: turmaId, termo: termo}, "associando...", true);' +
    '    return;' +
    '  }' +
    '  var ds = e.target.closest("button.desassociar");' +
    '  if (ds) {' +
    '    var tId = ds.getAttribute("data-turma");' +
    '    var tTermo = ds.getAttribute("data-termo");' +
    '    if (!confirm("Remover a associação com " + tTermo + "?")) return;' +
    '    var corpo = {turma: tId, termo: tTermo, token: TOKEN};' +
    '    fetch("/api/bastidores/turma-conteudo", {method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify(corpo)})' +
    '      .then(function(r){ return r.json(); }).then(function(d){' +
    '        if (d.ok) { location.reload(); } else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '      }).catch(function(err){ alert("Erro: " + err.message); });' +
    '    return;' +
    '  }' +
    '});' +
    // OS TRÊS NÚMEROS DO CARTÃO DA TURMA (18/10/2026). Cada «?» abre o painel DAQUELE
    // número, um só por vez, e a célula acende. Fecha com o mesmo toque, com Escape e com
    // um toque fora — no telefone não há hover, e um painel que só fecha recarregando a
    // página não é um painel.
    'function fecharPaineis(exceto){' +
    '  var bs = document.querySelectorAll(".turma .metrica .q");' +
    '  for (var i = 0; i < bs.length; i++) {' +
    '    var b = bs[i];' +
    '    if (b === exceto) continue;' +
    '    if (b.getAttribute("aria-expanded") !== "true") continue;' +
    '    b.setAttribute("aria-expanded", "false");' +
    '    var c = b.closest(".metrica"); if (c) c.removeAttribute("data-aberto");' +
    '    var alvo = b.getAttribute("data-balao");' +
    '    var ps = b.closest("li.turma").querySelectorAll(".painel");' +
    '    for (var j = 0; j < ps.length; j++) {' +
    '      if (ps[j].getAttribute("data-painel") === alvo) ps[j].hidden = true;' +
    '    }' +
    '  }' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var q = e.target.closest(".turma .metrica .q");' +
    '  if (!q) { if (!e.target.closest(".turma .painel")) fecharPaineis(null); return; }' +
    '  var alvo = q.getAttribute("data-balao");' +
    '  var abertoAgora = q.getAttribute("aria-expanded") === "true";' +
    '  fecharPaineis(q);' +
    '  var li = q.closest("li.turma");' +
    '  var ps = li ? li.querySelectorAll(".painel") : [];' +
    '  for (var i = 0; i < ps.length; i++) {' +
    '    if (ps[i].getAttribute("data-painel") !== alvo) continue;' +
    '    ps[i].hidden = abertoAgora;' +
    '  }' +
    '  q.setAttribute("aria-expanded", abertoAgora ? "false" : "true");' +
    '  var c = q.closest(".metrica");' +
    '  if (c) { if (abertoAgora) { c.removeAttribute("data-aberto"); } else { c.setAttribute("data-aberto", "sim"); } }' +
    '});' +
    'document.addEventListener("keydown", function(e){ if (e.key === "Escape") fecharPaineis(null); });' +
    'document.addEventListener("click", function(e){' +
    '  var ed = e.target.closest("button.editar");' +
    '  if (ed) {' +
    '    var atual = ed.getAttribute("data-alvo");' +
    '    var nome = prompt("Novo nome do dono da escola:", atual);' +
    '    if (!nome || !nome.trim() || nome.trim() === atual) return;' +
    '    fetch("/api/bastidores/dono", {' +
    '      method: "POST", headers: {"Content-Type": "application/json"},' +
    '      body: JSON.stringify({nome: nome.trim(), token: TOKEN})' +
    '    }).then(function(r){ return r.json(); }).then(function(d){' +
    '      if (d.ok) { location.reload(); } else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '    }).catch(function(err){ alert("Erro: " + err.message); });' +
    '    return;' +
    '  }' +
    '  var b = e.target.closest("button.apagar"); if (!b) return;' +
    '  var alvo = b.getAttribute("data-alvo");' +
    '  var tipo = b.getAttribute("data-tipo");' +
    '  var rotulo = b.getAttribute("data-nome") || alvo;' +
    '  if (!confirm("Excluir " + rotulo + "?")) return;' +
    '  var corpo = tipo === "aluna" ? {apelido: alvo}' +
    '    : ((tipo === "curadoria" || tipo === "rubrica" || tipo === "turma") ? {id: alvo} : {nome: alvo});' +
    '  corpo.token = TOKEN;' +
    '  fetch("/api/bastidores/" + tipo, {' +
    '    method: "DELETE",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '  }).catch(function(err){ alert("Erro: " + err.message); });' +
    '});' +
    // A APARÊNCIA — uma pílula marcada, um valor da escola.
    //
    // PINTA NO LUGAR, e não recarrega. A folha inteira é dirigida pelo atributo `data-modo`
    // do `<html>`; trocá-lo repinta a página toda sem um recarregamento — que aqui custaria
    // uma ida ao servidor para redesenhar o que já está na memória. A escolha é gravada
    // primeiro, e só depois a tela muda: o que se vê é o que ficou guardado.
    //
    // SE A GRAVAÇÃO FALHAR (o token expira em 12h), a pílula volta para a opção EM VIGOR. Sem
    // isso a tela mostraria uma escolha que não existe — e a pessoa sairia a acreditar nela.
    // DOIS EIXOS, UM COMPORTAMENTO. `data-modo` e `data-paleta` são atributos do `<html>` e a
    // folha cruza-os por seletor; repintar é trocar o atributo certo, e o mesmo código serve
    // aos dois grupos. Uma função para cada eixo seria a mesma linha escrita duas vezes — e a
    // segunda envelheceria primeiro.
    'var EIXOS = [' +
    '  {grupo: "aparencia", attr: "data-modo", chave: "modo", padrao: "clara", pintar: function(v){' +
    '    if (v === "clara") { document.documentElement.removeAttribute("data-modo"); }' +
    '    else { document.documentElement.setAttribute("data-modo", v); }' +
    '  }},' +
    '  {grupo: "paleta", attr: "data-paleta", chave: "paleta", padrao: "bordo", pintar: function(v){' +
    '    document.documentElement.setAttribute("data-paleta", v);' +
    '  }}' +
    '];' +
    'function emVigor(eixo) {' +
    '  return document.documentElement.getAttribute(eixo.attr) || eixo.padrao;' +
    '}' +
    'function marcar(eixo, valor) {' +
    '  var ps = document.querySelectorAll("input[name=" + eixo.grupo + "]");' +
    '  for (var i = 0; i < ps.length; i++) { ps[i].checked = (ps[i].value === valor); }' +
    '}' +
    // O PEDIDO LEVA O PAR INTEIRO, E NÃO SÓ O EIXO QUE MUDOU. Parece redundante — o servidor
    // sabe ler o outro eixo — e não é: o KV é eventualmente consistente, e um
    // «ler-modificar-gravar» deixa uma janela em que duas mudanças próximas se perdem. Foi
    // medido no ar, em 18/10/2026: um pedido de família chegou enquanto o modo ainda
    // propagava, e o modo voltou ao valor anterior sem ninguém ter pedido. O cliente TEM os
    // dois valores (estão no `<html>` que ele acabou de pintar), e mandá-los fecha a janela.
    'EIXOS.forEach(function(eixo){' +
    '  var pilulas = document.querySelectorAll("input[name=" + eixo.grupo + "]");' +
    '  for (var i = 0; i < pilulas.length; i++) {' +
    '    pilulas[i].addEventListener("change", function(){' +
    '      var escolhido = this.value;' +
    '      var corpo = {modo: emVigor(EIXOS[0]), paleta: emVigor(EIXOS[1])};' +
    '      corpo[eixo.chave] = escolhido;' +
    '      enviar("/api/bastidores/aparencia", corpo, "gravando a aparência da escola...",' +
    '        false, function(){ eixo.pintar(escolhido); })' +
    '        .then(function(){' +
    '          var agora = emVigor(eixo);' +
    '          if (agora !== escolhido) { marcar(eixo, agora); }' +
    '        });' +
    '    });' +
    '  }' +
    '});' +
    '</script>' +
    fimDaVista();
}

/**
 * O handler dos Bastidores. Devolve `null` quando o caminho não é dos
 * Bastidores (a ponte de produção segue para o resto).
 */
async function fetch(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ehBastidores = path === '/bastidores'
    || path === '/bastidores/estudio'
    || path === '/bastidores/producao'
    || path.startsWith('/api/bastidores');
  if (!ehBastidores) return null;

  const escola = escolaDe(env, url);
  if (!escola) return json(400, { ok: false, erro: 'escola ausente (ESCOLA_SLUG ou ?escola=)' });

  const kv = env && env.PADD_KV;
  if (!kv) return json(500, { ok: false, erro: 'PADD_KV ausente nos Bastidores' });

  // O grupo «Bastidores» — os DOIS itens: Estúdio (a cena) e Produção (o gabinete).
  //
  // A PÁGINA INTERMEDIÁRIA SAIU (15/10/2026). Ela existia em `/bastidores` e só repetia os
  // dois links que o próprio grupo do menu já mostra: quem clicava em «Produção» dava um
  // passo a mais, e o passo a mais não levava a nada. O caminho continua respondendo — quem
  // o digitar, ou seguir um link antigo, cai na Produção, e não num 404.
  if (path === '/bastidores') {
    return new Response(null, {
      status: 302,
      headers: semCache({ Location: '/bastidores/producao' + (url.search || '') }),
    });
  }
  const contexto = contextoDaPorta(env, escola, url);
  if (path === '/bastidores/estudio') {
    return html(paginaEstudio(escola, contexto, await aparenciaDaEscola(kv, escola)));
  }
  if (path === '/bastidores/producao') {
    const [profs, aluns, trms, trmos, rbs] = await Promise.all([
      professores(kv, escola), alunas(kv, escola), turmas(kv, escola), termos(kv, escola),
      rubricas(kv, escola),
    ]);
    const dono = await nomeDoDono(env, kv, escola);
    const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
    const rel = await relacoes(kv, escola);
    const curs = await curadorias(kv, escola);
    // Que (professor, turma) já têm plano de ensino: é o que decide, na turma e na curadoria,
    // entre «Editar» e «Derivar» (16/10/2026).
    const pares = await paresComPlano(kv, escola);
    // O QUE OS PLANOS JÁ USARAM — a regra de proveniência que a curadoria já aplicava,
    // estendida a professores, alunas, turmas e vocabulário (18/10/2026).
    const usos = await usosDosPlanos(kv, escola);
    return html(paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs, pares, usos,
      await aparenciaDaEscola(kv, escola)));
  }

  // GET /api/bastidores/alunas — a lista para o seletor da anamnese.
  if (path === '/api/bastidores/alunas') {
    return json(200, { ok: true, escola, alunas: await alunas(kv, escola) });
  }

  // GET /api/bastidores/professores — o seletor dos formulários. Devolve `{nome, slug}`:
  // o NOME de exibição (o rótulo) e o SLUG (o valor que entra no cofre/path). O dono vem
  // primeiro; o slug dele é o da PASTA (não da sobreposição editável), para o caminho
  // `professores/<slug>/…` continuar apontando para a pasta — ajustar o nome do dono não
  // muda a pasta. A senha nunca sai.
  //
  // O SLUG É DECLARADO, E SÓ NA FALTA É DERIVADO (17/10/2026). `PROFESSOR_SLUG` é o slug da
  // pasta, gravado por quem a cria (o workflow, via `provisionar-escola.js`). Derivá-lo do NOME
  // de exibição atava duas coisas distintas: a etiqueta e a pasta. Com «Tiago» no nome e a
  // pasta `tiago-menegaz`, o slug saía `tiago` — e o PO era escrito em `professores/tiago/`,
  // uma pasta fantasma que a âncora do ciclo nunca via. Um Worker ANTIGO, sem o secret,
  // continua a derivar do nome: as escolas já criadas não precisam de migração.
  if (path === '/api/bastidores/professores') {
    const profs = await professores(kv, escola);
    const dono = await nomeDoDono(env, kv, escola);
    const donoSlug = String((env && env.PROFESSOR_SLUG) || '').trim()
      || slugificar(String((env && env.PROFESSOR_NOME) || ''));
    const lista = [];
    if (dono) lista.push({ nome: dono, slug: donoSlug });
    for (const p of profs) {
      if (!p || !p.nome) continue;
      const slug = slugDoProfessor(p);
      // O pulo é pelo SLUG, não pelo nome: dois professores com o mesmo slug seriam duas
      // opções idênticas no seletor, e o formulário não saberia qual escolheu.
      if (!slug || slug === donoSlug) continue;
      lista.push({ nome: p.nome, slug });
    }
    return json(200, { ok: true, escola, professores: lista });
  }

  // POST /api/bastidores/professor — cadastrar professor (nome + senha).
  //
  // A TRAVA É PELO **SLUG**, e não pelo nome. O slug é o que vira pasta (`professores/<slug>/`)
  // e o que identifica o professor no PO, no plano e no cofre — o nome é só o rótulo. Conferir
  // pelo nome deixava passar exatamente os pares que colidem: «José» e «Jose», «Ana Maria» e
  // «Ana-Maria», «Tiago» e «tiago» — nomes diferentes, MESMO slug, e as duas pessoas na mesma
  // pasta (a segunda nunca conseguiria entrar: a busca da senha acha a primeira).
  //
  // E confere também contra o DONO, que não está nesta lista: ele vive no secret
  // `PROFESSOR_NOME`. Sem isso, cadastrar um professor com o nome do dono era aceito (201) e
  // ficava invisível no seletor, inutilizável na senha e impossível de excluir — o DELETE
  // protege o dono pelo nome.
  if (path === '/api/bastidores/professor' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    const sobrenome = String(corpo.sobrenome || '').trim();
    const senha = String(corpo.senha || '');
    if (!nome || !senha) return json(400, { ok: false, erro: 'informe o nome e a senha do professor' });

    const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
    const lista = await professores(kv, escola);
    const slug = slugificar(nome + (sobrenome ? ' ' + sobrenome : ''));
    // O NOME EXIBIDO leva o sobrenome junto: no seletor, dois «Tiago» com pastas diferentes
    // seriam duas opções idênticas — e a pessoa não saberia qual escolheu. O exibido é o nome
    // completo; o que identifica é o slug.
    const nomeExibido = sobrenome ? nome + ' ' + sobrenome : nome;

    if (!slug) return json(400, { ok: false, erro: 'o nome do professor não produz um identificador válido' });
    if (slug === donoSlug) {
      return json(409, {
        ok: false,
        erro: 'o professor dono desta escola já usa este identificador (`' + slug + '`). Se esta pessoa é OUTRA, cadastre com sobrenome ou apelido — o identificador é a pasta do professor e não pode repetir.',
      });
    }
    const colisao = lista.find((p) => slugDoProfessor(p) === slug);
    if (colisao) {
      return json(409, {
        ok: false,
        erro: 'já existe o professor «' + colisao.nome + '» com o identificador `' + slug + '`. Se for OUTRA pessoa, cadastre com sobrenome ou apelido.',
      });
    }

    const sal = gerarSal();
    const hash = await hashSenha(senha, sal);
    // O `slug` é GRAVADO: é ele que fica, mesmo que o nome de exibição mude depois.
    lista.push({ nome: nomeExibido, slug, sal, hash });
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(201, { ok: true, professor: nomeExibido, slug });
  }

  // POST /api/bastidores/aluna — cadastrar aluna (apelido estável).
  if (path === '/api/bastidores/aluna' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const apelido = String(corpo.apelido || '').trim();
    if (!apelido) return json(400, { ok: false, erro: 'informe o apelido da aluna' });
    const lista = await alunas(kv, escola);
    if (lista.indexOf(apelido) !== -1) return json(409, { ok: false, erro: 'já existe uma aluna com este apelido' });
    lista.push(apelido);
    await kv.put(RAIZ + '/' + escola + '/alunas', JSON.stringify(lista));
    return json(201, { ok: true, aluna: apelido });
  }

  // DELETE /api/bastidores/aluna — excluir aluna (apelido estável).
  if (path === '/api/bastidores/aluna' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const apelido = String(corpo.apelido || '').trim();
    if (!apelido) return json(400, { ok: false, erro: 'informe o apelido da aluna' });
    const lista = await alunas(kv, escola);
    const idx = lista.indexOf(apelido);
    if (idx === -1) return json(404, { ok: false, erro: 'aluna não encontrada' });
    // PROVENIÊNCIA (18/10/2026): a aluna está numa curadoria? E a curadoria já tem plano?
    {
      const pares = await paresComPlano(kv, escola);
      const curs = await curadorias(kv, escola);
      if (alunaVinculadaA(pares, curs, apelido)) {
        return json(409, {
          ok: false,
          erro: 'a aluna «' + apelido + '» está numa curadoria que já tem plano de ensino — ' +
            'apagá-la romperia a proveniência. Retire-a da curadoria primeiro, se for o caso.',
          vinculado: true,
        });
      }
    }
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/alunas', JSON.stringify(lista));
    return json(200, { ok: true, aluna: apelido, removida: true });
  }

  // DELETE /api/bastidores/professor — excluir professor cadastrado no KV.
  // O professor DONO (criado pela página `danca`) vive no SECRET PROFESSOR_NOME, não no
  // KV — este endpoint só remove os professores ADICIONAIS do KV. O dono não é tocado por
  // aqui (o segredo do Worker é outra fronteira, gerida pela página/Cloudflare).
  if (path === '/api/bastidores/professor' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    if (!nome) return json(400, { ok: false, erro: 'informe o nome do professor' });
    // O dono pode ter o nome ajustado no KV — protege-se pelo NOME RESOLVIDO, não só o secret.
    const donoNome = await nomeDoDono(env, kv, escola);
    const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
    if (nome === donoNome) {
      return json(409, {
        ok: false,
        erro: 'este é o professor dono da escola (criado na página) — ajuste o nome, não o exclua',
      });
    }
    const lista = await professores(kv, escola);
    // Acha pelo NOME ou pelo SLUG: a tela manda o nome, mas o identificador é o slug — e
    // aceitar os dois evita que um professor fique impossível de excluir depois de um ajuste
    // de nome.
    const idx = lista.findIndex((p) => p && (p.nome === nome || slugDoProfessor(p) === nome));
    if (idx === -1) return json(404, { ok: false, erro: 'professor não encontrado' });
    if (slugDoProfessor(lista[idx]) === donoSlug) {
      return json(409, {
        ok: false,
        erro: 'este é o professor dono da escola (criado na página) — ajuste o nome, não o exclua',
      });
    }
    // PROVENIÊNCIA (18/10/2026): a guarda é AQUI, e não só no botão. A tela esconde o
    // «Excluir» de quem está vinculado; esta linha é a regra para um pedido forjado.
    const usos = await usosDosPlanos(kv, escola);
    if (professorVinculadoA(usos, lista[idx])) {
      return json(409, {
        ok: false,
        erro: 'o professor «' + lista[idx].nome + '» já está num plano de ensino — apagá-lo ' +
          'romperia a proveniência. O registro fica; se o nome estiver errado, ajuste-o.',
        vinculado: true,
      });
    }
    const removido = lista[idx];
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(200, { ok: true, professor: removido.nome, removido: true });
  }

  // POST /api/bastidores/dono — ajustar o NOME do professor dono (o criado na página).
  // O dono vive como SECRET (PROFESSOR_NOME/SENHA_PROFESSOR); o nome ajustado fica no KV
  // como SOBREPOSIÇÃO de exibição (`bastidores/<escola>/dono`). A SENHA do dono NÃO muda
  // por aqui (continua a do secret) — só o nome, que pode ter sido provisório.
  if (path === '/api/bastidores/dono' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    if (!nome) return json(400, { ok: false, erro: 'informe o nome do dono da escola' });
    if (!String((env && env.PROFESSOR_NOME) || '').trim()) {
      return json(409, { ok: false, erro: 'não há professor dono (criado na página) para ajustar' });
    }
    await kv.put(RAIZ + '/' + escola + '/dono', JSON.stringify({ nome }));
    return json(200, { ok: true, dono: nome });
  }

  // ---------------------------------------------------------------------------
  // A APARÊNCIA DA ESCOLA (18/10/2026) — a preferência é da escola (decisão C15).
  //
  // O GET é PÚBLICO e não revela nada: o modo já vai no `<html>` de toda página servida, e
  // quem quiser vê-lo basta abrir a página. Serve ao próprio painel (para marcar a opção em
  // vigor) e a quem auditar a instalação por `curl`.
  //
  // O POST é da DIREÇÃO — `autorizacaoDirecaoOk`, isto é, a senha da ESCOLA ou a do
  // PROFESSOR PRINCIPAL, e mais nenhuma. É o mesmo portão da Produção, e é por isso que o
  // controlo mora aqui: quem lá entra é quem pode decidir a aparência de todos.
  // ---------------------------------------------------------------------------
  if (path === '/api/bastidores/aparencia') {
    if (request.method === 'GET') {
      const atual = await aparenciaDaEscola(kv, escola);
      // A RESPOSTA DIZ O QUE EXISTE, e não o que o catálogo sonha: `paletas` são as famílias
      // com hex medidos na folha. O catálogo do contrato tem sete nomes e duas implementadas,
      // e oferecer as cinco em estudo daria uma escola pintada de nada — a lista é do
      // servidor, não do documento.
      return json(200, {
        ok: true,
        modo: atual.modo,
        paleta: atual.paleta,
        modos: MODOS_DE_APARENCIA,
        paletas: PALETAS,
      });
    }
    if (request.method === 'POST') {
      let corpo = {};
      try { corpo = await request.json(); } catch { corpo = {}; }
      if (!(await autorizacaoDirecaoOk(env, corpo))) {
        return json(401, { ok: false, erro: 'senha da direção inválida' });
      }
      // A VALIDAÇÃO É POR EIXO, e recusa o inválido em vez de o ignorar: um pedido com
      // `{paleta:'verde'}` respondido com `ok:true` faria a tela mostrar uma escolha que não
      // ficou guardada. Cada chave só é considerada se vier.
      const mudanca = {};
      if (corpo.modo !== undefined) {
        const modo = String(corpo.modo || '').trim();
        if (MODOS_DE_APARENCIA.indexOf(modo) === -1) {
          return json(400, { ok: false, erro: 'modo inválido — use ' + MODOS_DE_APARENCIA.join(' ou ') });
        }
        mudanca.modo = modo;
      }
      if (corpo.paleta !== undefined) {
        const paleta = String(corpo.paleta || '').trim();
        if (IDS_DAS_PALETAS.indexOf(paleta) === -1) {
          return json(400, { ok: false, erro: 'paleta inválida — use ' + IDS_DAS_PALETAS.join(' ou ') });
        }
        mudanca.paleta = paleta;
      }
      if (!mudanca.modo && !mudanca.paleta) {
        return json(400, { ok: false, erro: 'nada a mudar — envie «modo» e/ou «paleta»' });
      }
      const ok = await gravarAparencia(kv, escola, mudanca, 'direcao');
      if (!ok) return json(400, { ok: false, erro: 'valor recusado' });
      const agora = await aparenciaDaEscola(kv, escola);
      return json(200, { ok: true, modo: agora.modo, paleta: agora.paleta });
    }
  }

  // POST /api/bastidores/validar-senha — a anamnese valida a senha DO PROFESSOR.
  // A senha é PER-PROFESSOR: o `professor` (slug) selecionado no formulário diz a QUEM a
  // senha pertence. O dono vive no secret `SENHA_PROFESSOR`; os adicionais, no KV (hash).
  // Uma senha de um professor NUNCA vale para outro — era esse o vazamento: a fonte dupla
  // aceitava a senha do dono (ou de qualquer professor do KV) para qualquer professor.
  if (path === '/api/bastidores/validar-senha' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String(corpo.senha || '');
    const professor = String(corpo.professor || '').trim();
    if (!senha) return json(400, { ok: false, erro: 'informe a senha' });
    if (!professor) return json(400, { ok: false, erro: 'escolha o professor' });

    // O professor criado pela página vive no secret SENHA_PROFESSOR. O SLUG dele é derivado
    // do SECRET (não da sobreposição editável do nome), para a pasta ficar estável — e o
    // seletor envia exatamente esse slug.
    const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
    if (professor === donoSlug) {
      if (env && env.SENHA_PROFESSOR && senha === env.SENHA_PROFESSOR) {
        const nome = await nomeDoDono(env, kv, escola);
        return json(200, { ok: true, professor: (nome || 'professor') });
      }
      return json(200, { ok: false, erro: 'senha do professor não reconhecida' });
    }

    const profs = await professores(kv, escola);
    const alvo = profs.find((p) => slugDoProfessor(p) === professor);
    if (!alvo) return json(200, { ok: false, erro: 'professor não reconhecido' });
    const confere = alvo.hash
      ? ((await hashSenha(senha, alvo.sal)) === alvo.hash)
      : (alvo.senha === senha); // legado (pré-hash): aceita, sem quebrar escolas antigas.
    return json(200, confere
      ? { ok: true, professor: alvo.nome }
      : { ok: false, erro: 'senha do professor não reconhecida' });
  }

  // POST /api/bastidores/validar-producao — a porta da Produção (só a direção).
  //
  // Responde com o TOKEN (18/10/2026): o navegador guarda o token, nunca a senha. Chamada
  // com `{token}` ela também serve para RETOMAR a sessão de uma aba que recarregou.
  if (path === '/api/bastidores/validar-producao' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (corpo.token) {
      const vale = await tokenDaDirecaoValido(env, String(corpo.token));
      return json(200, vale
        ? { ok: true, direcao: true, token: String(corpo.token) }
        : { ok: false, erro: 'sessão expirada ou inválida' });
    }
    const senha = String(corpo.senha || '');
    if (!senha) return json(400, { ok: false, erro: 'informe a senha da direção' });
    // O professor criado na página é SEMPRE o dono (a marcação saiu): a senha da direção é
    // a do administrador OU a do professor dono.
    const okDirecao = senhaDaDirecaoOk(env, senha);
    if (!okDirecao) return json(200, { ok: false, erro: 'senha da direção não reconhecida' });
    return json(200, { ok: true, direcao: true, token: await tokenDaDirecao(env) });
  }

  // ---------------------------------------------------------------------------
  // TURMAS e VOCABULÁRIO TÉCNICO — o cadastro administrativo (Bloco 3 do plano).
  // Mesma política dos professores/alunas: dado no KV da própria escola, operações
  // atrás da senha da direção. Inclusão/exclusão apenas (sem edição, §7 do pedido).
  // ---------------------------------------------------------------------------

  // GET /api/bastidores/turmas — a lista (Produção) e as opções do plano (`opcoesDe`).
  //
  // Devolve as turmas VIGENTES (16/10/2026). É esta lista que alimenta o select do cabeçalho do
  // plano: uma turma substituída não pode aparecer como escolha, ou o professor faria um plano
  // novo contra um ritmo que já não vale.
  if (path === '/api/bastidores/turmas') {
    const lista = turmasVigentes(await turmas(kv, escola));
    const todasAsRubricas = await rubricas(kv, escola);
    // A régua sai SEMPRE preenchida (o cadastro antigo não a tinha): sem isto o plano
    // receberia uma régua vazia e mediria contra nada. E sai RESOLVIDA — quem lê não sabe se
    // ela veio de uma rubrica ligada, da régua própria da turma ou do padrão. É o que faz o
    // plano (`{daTurma: "rubrica"}`) continuar a funcionar sem tocar numa linha.
    const comRegua = lista.map((t) =>
      (t ? Object.assign({}, t, { rubrica: rubricaDaTurma(t, todasAsRubricas) }) : t));
    return json(200, { ok: true, escola, turmas: comRegua, opcoes: opcoesDeTurmas(lista) });
  }

  // GET /api/bastidores/termos — o vocabulário técnico (Produção).
  if (path === '/api/bastidores/termos') {
    const lista = await termos(kv, escola);
    const opcoes = lista.map((t) => ({ valor: t.id, rotulo: t.termo }));
    return json(200, { ok: true, escola, termos: lista, opcoes: opcoes });
  }

  // GET /api/bastidores/turma-conteudos — a relação turma↔termo (mapa inteiro).
  if (path === '/api/bastidores/turma-conteudos') {
    const rel = await relacoes(kv, escola);
    return json(200, { ok: true, escola, relacoes: rel });
  }

  // POST /api/bastidores/turma — incluir turma.
  if (path === '/api/bastidores/turma' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nova = normalizarTurma(corpo);
    if (!nova.nome) return json(400, { ok: false, erro: 'informe o nome da turma' });
    // O RITMO é obrigatório: a turma completa é a que pode receber um plano. Sem isto, o
    // plano sairia com quatro campos vazios — e o professor não tem como saber a dose que a
    // escola decidiu (16/10/2026).
    const falta = faltaNoRitmoDaTurma(nova);
    if (falta.length) {
      return json(400, {
        ok: false,
        erro: 'a turma precisa de ' + fraseDaFalta(falta) + ' — é o ritmo do ciclo, e é a escola ' +
          'que o declara: é dele que saem o calendário e o número total de aulas do plano.',
        falta,
      });
    }
    const lista = await turmas(kv, escola);
    // O NOME só colide com uma turma VIGENTE (16/10/2026). Uma turma substituída mantém o
    // nome — é assim que a curadoria e o plano continuam a encontrá-la —, e recusar por causa
    // dela impediria a própria derivação.
    if (turmaVigentePorNome(lista, nova.nome)) {
      return json(409, { ok: false, erro: 'já existe uma turma com este nome' });
    }
    // A TURMA NOVA VAI PARA O TOPO (18/10/2026). Antes a direção escrevia a posição à mão
    // (ou deixava vazio, e a turma ia para o fim). A lista é ordenada por `ordem` crescente:
    // a nova recebe um número ABAIXO do menor que existe. Se um cliente antigo ainda mandar
    // `ordem`, ele manda — é a compatibilidade com o que já está gravado.
    if (nova.ordem === null) nova.ordem = (lista.reduce((menor, t) =>
      (t && Number.isFinite(Number(t.ordem)) ? Math.min(menor, Number(t.ordem)) : menor), 0)) - 1;
    lista.push(nova);
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    return json(201, { ok: true, turma: nova.nome, nome: nova.nome, id: nova.id, modo: 'criar' });
  }

  // POST /api/bastidores/turma-editar — EDITAR uma turma LIVRE (16/10/2026).
  //
  // A regra é a do plano de ensino, aplicada ao cadastro: uma turma que ainda não tem plano
  // é cadastro puro — nada a referencia —, e corrigir-lhe o nome, a hora ou a duração não
  // reescreve história nenhuma. Uma turma que já tem plano é linha de base, e essa DERIVA
  // (`/turma-derivar`): o professor já a escolheu no cabeçalho, e mexer-lhe por baixo faria o
  // plano impresso dizer uma coisa e o cadastro outra.
  //
  // A guarda é AQUI, e não só na tela: o botão que a escola vê é uma comodidade; a regra é
  // esta linha. Sem ela, um pedido forjado — ou uma página aberta de antes de a turma ganhar
  // plano — passaria por cima da proveniência.
  if (path === '/api/bastidores/turma-editar' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const pedido = String(corpo.id || corpo.derivarDe || '').trim();
    if (!pedido) return json(400, { ok: false, erro: 'informe a turma' });
    const lista = await turmas(kv, escola);
    const alvo = lista.find((t) => t && t.id === pedido);
    if (!alvo) return json(404, { ok: false, erro: 'turma não encontrada: ' + pedido });
    const comPlano = await turmasComPlano(kv, escola);
    if (turmaVinculadaA(comPlano, alvo.nome)) {
      return json(409, {
        ok: false,
        erro: 'a turma «' + alvo.nome + '» já tem um plano de ensino — ela não se edita: ' +
          'derive uma versão nova, que passa a valer a partir de uma data e deixa a anterior ' +
          'como referência do passado.',
        vinculada: true,
      });
    }
    const declarado = normalizarTurma(Object.assign({}, corpo, { nome: corpo.nome || alvo.nome }));
    if (!declarado.nome) return json(400, { ok: false, erro: 'informe o nome da turma' });
    const falta = faltaNoRitmoDaTurma(declarado);
    if (falta.length) {
      return json(400, {
        ok: false,
        erro: 'a turma precisa de ' + fraseDaFalta(falta) + '.',
        falta,
      });
    }
    // O NOME PODE MUDAR numa turma livre — é o que a torna editável. O id vai atrás (é o slug
    // do nome), e por isso os vínculos turma↔termo têm de MUDAR DE CHAVE: são guardados pelo
    // id, e ficariam órfãos no id antigo.
    const novoId = declarado.id;
    const idAntigo = alvo.id;
    if (novoId !== idAntigo && lista.some((t) => t && t.id === novoId)) {
      return json(409, { ok: false, erro: 'já existe uma turma com este nome' });
    }
    // Só os campos do formulário mudam; a régua (`rubricaId`) fica com quem a ligou.
    // «ORDEM» SAIU DA LISTA (18/10/2026): a posição não é mais um campo do formulário, e
    // mandá-la em branco aqui apagaria a que a turma já tinha. A que existir fica.
    const CAMPOS_DO_FORMULARIO = ['nome', 'programaReferencia', 'nivelReferencia',
      'descricao', 'frequencia', 'dias', 'horarios', 'duracaoMin', 'periodoInicio', 'periodoFim'];
    const ajustado = {};
    for (const k of CAMPOS_DO_FORMULARIO) if (k in declarado) ajustado[k] = declarado[k];
    const indice = lista.findIndex((t) => t && t.id === idAntigo);
    lista[indice] = Object.assign({}, alvo, ajustado, { id: novoId });
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    if (novoId !== idAntigo) {
      try {
        const rel = await relacoes(kv, escola);
        if (Array.isArray(rel[idAntigo])) {
          rel[novoId] = rel[idAntigo].slice();
          delete rel[idAntigo];
          await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel));
        }
      } catch (e) { /* best-effort: a turma já está gravada */ }
    }
    return json(200, { ok: true, turma: novoId, nome: lista[indice].nome, id: novoId, modo: 'editar', eraId: idAntigo });
  }

  // POST /api/bastidores/turma-derivar — o «EDITAR» DA TURMA VINCULADA (16/10/2026).
  //
  // A escola pensa que está a editar; o que acontece é um ELO NOVO. A turma anterior fica na
  // lista, marcada com `substituidaPor`/`substituidaEm`, e a nova nasce com o MESMO NOME e uma
  // data de vigência (`vigenteDe`). É o mesmo invariante do plano vinculado a um PO: o passado
  // não se reescreve, e a pergunta «que ritmo valia em Março» tem resposta.
  //
  // O nome não muda de propósito: a curadoria guarda o NOME e o plano referencia o NOME. Um
  // registo novo com outro nome partiria as duas ligações — e o professor veria o plano dele
  // perder a turma sem saber por quê.
  if (path === '/api/bastidores/turma-derivar' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const lista = await turmas(kv, escola);
    // A turma de origem: pelo id (o que o botão carrega) ou pelo nome (o id pode ter mudado
    // entre a página aberta e o clique). Só se deriva uma VIGENTE — derivar uma já substituída
    // deixaria dois elos a apontar para o mesmo passado.
    const alvoId = String(corpo.derivarDe || corpo.id || '').trim();
    const anterior = turmasVigentes(lista).find((t) => t && (t.id === alvoId || t.nome === alvoId));
    if (!anterior) {
      return json(404, { ok: false, erro: 'turma não encontrada (ou já substituída): ' + (alvoId || '(vazio)') });
    }
    const vigencia = String(corpo.vigencia || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vigencia)) {
      return json(400, { ok: false, erro: 'informe a data a partir da qual a turma ajustada vale (AAAA-MM-DD)' });
    }
    // O registo novo: o MESMO nome, o id com a vigência, e os campos que a escola declarou.
    // Ele NASCE DO ANTERIOR (`Object.assign({}, anterior, …)`), e não do zero: o que a escola
    // não está a ajustar tem de sobreviver.
    //
    // SÓ OS CAMPOS DO FORMULÁRIO MANDAM. O `normalizarTurma` devolve o registo INTEIRO, com a
    // ligação à régua (`rubricaId`, `rubrica`) e o estado de atividade VAZIOS — porque eles não
    // se declaram no cadastro da turma, vêm do vínculo próprio. Sobrepor isso ao anterior
    // apagaria a régua da escola por ter corrigido uma hora, e ninguém daria por isso até o
    // plano medir contra a régua padrão.
    const declarado = normalizarTurma(Object.assign({}, corpo, { nome: anterior.nome }));
    // A POSIÇÃO NÃO SE DECLARA (18/10/2026): o elo novo herda a ordem do anterior — uma
    // derivação troca o ritmo da turma, não o lugar dela na lista.
    const CAMPOS_DO_FORMULARIO = ['nome', 'programaReferencia', 'nivelReferencia',
      'descricao', 'frequencia', 'dias', 'horarios', 'duracaoMin', 'periodoInicio', 'periodoFim'];
    const ajustado = {};
    for (const k of CAMPOS_DO_FORMULARIO) if (k in declarado) ajustado[k] = declarado[k];
    const nova = Object.assign({}, anterior, ajustado);
    nova.id = idDerivado(anterior.nome, vigencia, lista);
    nova.nome = anterior.nome;
    nova.vigenteDe = vigencia;
    nova.substitui = anterior.id;
    delete nova.substituidaPor;
    delete nova.substituidaEm;
    const falta = faltaNoRitmoDaTurma(nova);
    if (falta.length) {
      return json(400, {
        ok: false,
        erro: 'a turma ajustada precisa de ' + fraseDaFalta(falta) + '.',
        falta,
      });
    }
    // A ANTERIOR fica, e diz quem a substituiu e quando — o elo, não o apagamento.
    const indice = lista.findIndex((t) => t && t.id === anterior.id);
    lista[indice] = Object.assign({}, anterior, {
      substituidaPor: nova.id,
      substituidaEm: vigencia,
    });
    lista.push(nova);
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));

    // OS VÍNCULOS TURMA↔TERMO VÃO COM ELA. A relação é chaveada pelo ID, e o id novo é outro:
    // sem esta passagem, a turma ajustada apareceria sem os conteúdos que a escola já tinha
    // ligado a ela — e a escola perderia trabalho por ter corrigido uma hora. O que a turma
    // ENSINA não é o que se está a ajustar.
    try {
      const rel = await relacoes(kv, escola);
      if (Array.isArray(rel[anterior.id]) && rel[anterior.id].length) {
        rel[nova.id] = rel[anterior.id].slice();
        await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel));
      }
    } catch (e) { /* best-effort: a turma já está gravada, e o vínculo reata-se à mão */ }

    return json(201, { ok: true, turma: nova.nome, nome: nova.nome, id: nova.id, modo: 'derivar',
      substitui: anterior.id, vigenteDe: vigencia });
  }

  // DELETE /api/bastidores/turma — excluir turma (e limpar a relação).
  if (path === '/api/bastidores/turma' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = String(corpo.id || '').trim() || idDe(String(corpo.nome || '').trim());
    if (!id) return json(400, { ok: false, erro: 'informe a turma' });
    const lista = await turmas(kv, escola);
    // POR ID, e não pelo nome (16/10/2026). Depois da derivação, duas turmas partilham o NOME
    // — a vigente e a que ela substituiu —, e procurar pelo nome apagaria a do passado em vez
    // da que a escola quer tirar. O nome fica como recurso para o cadastro antigo.
    let idx = lista.findIndex((t) => t && t.id === id);
    if (idx === -1) idx = lista.findIndex((t) => t && t.id === idDe(String(corpo.nome || '').trim()));
    if (idx === -1) return json(404, { ok: false, erro: 'turma não encontrada' });
    // PROVENIÊNCIA (18/10/2026): a turma com plano é linha de base. Ela já tinha o selo na
    // tela, mas o «Excluir» continuava a aparecer — e apagá-la deixaria o plano órfão.
    {
      const pares = await paresComPlano(kv, escola);
      if (turmaVinculadaA(pares ? new Set(pares.map((p) => p.turma)) : null, lista[idx].nome)) {
        return json(409, {
          ok: false,
          erro: 'a turma «' + lista[idx].nome + '» já tem plano de ensino — apagá-la romperia a ' +
            'proveniência. Se o ritmo mudou, derive uma versão nova.',
          vinculado: true,
        });
      }
    }
    const removida = lista[idx].id;
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    const rel = await relacoes(kv, escola);
    if (rel[removida]) { delete rel[removida]; await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel)); }
    return json(200, { ok: true, turma: removida, removida: true });
  }

  // POST /api/bastidores/turma-rubrica — LIGAR (ou desligar) uma turma da rubrica criada na
  // aba «Criar rubrica». É o ato da coordenação, e não edição de turma: o cadastro só inclui
  // e exclui, e a régua é um VÍNCULO — mudá-la não mexe em mais nada da turma.
  //
  // Sem `rubricaId` (ou com ele vazio) a turma é DESVINCULADA: volta à régua própria, se a
  // tinha, ou à padrão. O modo antigo (`rubrica: [...]`) continua aceito e grava a régua
  // PRÓPRIA da turma, limpando o vínculo — é o que a prova usava, e é o caminho de quem
  // chegou antes das rubricas com nome.
  if (path === '/api/bastidores/turma-rubrica' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const pedido = String(corpo.turma || corpo.id || '').trim();
    const id = idDe(pedido);
    if (!id) return json(400, { ok: false, erro: 'informe a turma' });
    const lista = await turmas(kv, escola);
    // O ID MANDA (16/10/2026). Depois da derivação, `idDe(nome)` devolve o id da turma ANTIGA
    // — a que foi substituída —, e a régua acabaria ligada ao passado em vez de ao presente.
    // Por isso: id exato primeiro, e o nome só como recurso, resolvido para a VIGENTE.
    const turma = lista.find((t) => t && t.id === pedido)
      || lista.find((t) => t && t.id === id)
      || turmaVigentePorNome(lista, pedido);
    if (!turma) return json(404, { ok: false, erro: 'turma não encontrada' });
    const existentes = await rubricas(kv, escola);
    const rubricaId = String(corpo.rubricaId || '').trim();
    // «GRAVAR TURMA» TEM A VALIDAÇÃO MÁXIMA TAMBÉM NO SERVIDOR (18/10/2026). O botão da tela
    // só acende com a turma completa, uma rubrica escolhida e pelo menos um conteúdo; mas uma
    // tela antiga (ou um pedido forjado) não pode concluir uma turma pela metade. `concluir`
    // distingue o fim da sequência do ato intermédio «Associar rubrica», que continua a poder
    // gravar só o vínculo.
    if (corpo.concluir === true || corpo.concluir === 'sim') {
      if (!rubricaId) {
        return json(400, { ok: false, erro: 'para gravar a turma, escolha a rubrica', falta: ['a rubrica'] });
      }
      const rel = await relacoes(kv, escola);
      const conteudos = Array.isArray(rel[turma.id]) ? rel[turma.id] : [];
      if (!conteudos.length) {
        return json(400, {
          ok: false,
          erro: 'para gravar a turma, associe pelo menos um conteúdo',
          falta: ['pelo menos um conteúdo'],
        });
      }
    }
    if (Array.isArray(corpo.rubrica)) {
      const niveis = niveisLimpos(corpo.rubrica);
      if (!niveis.length) return json(400, { ok: false, erro: 'declarar a régua: pelo menos um nível' });
      turma.rubrica = niveis;
      delete turma.rubricaId;
    } else if (rubricaId) {
      if (!existentes.some((r) => r && r.id === rubricaId)) {
        return json(404, { ok: false, erro: 'rubrica não encontrada: ' + rubricaId });
      }
      turma.rubricaId = rubricaId;
    } else {
      delete turma.rubricaId;
    }
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    return json(200, {
      ok: true,
      turma: turma.nome,
      rubricaId: turma.rubricaId || '',
      rubrica: rubricaDaTurma(turma, existentes),
    });
  }

  // GET /api/bastidores/rubricas — as réguas da escola (a lista da aba «Criar rubrica» e os
  // vínculos da aba «Vincular»).
  if (path === '/api/bastidores/rubricas') {
    const lista = await rubricas(kv, escola);
    return json(200, { ok: true, escola, rubricas: lista });
  }

  // POST /api/bastidores/rubrica — criar (ou salvar) uma RUBRICA. Com `id`, salva aquela
  // (renomear não perde vínculo); sem `id`, o identificador é o slug do nome, e um nome que
  // já existe ATUALIZA — cadastrar duas vezes «Régua do Nível 1» não cria duas.
  if (path === '/api/bastidores/rubrica' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nova = normalizarRubrica(corpo);
    if (!nova.nome) return json(400, { ok: false, erro: 'informe o nome da rubrica' });
    if (!nova.id) return json(400, { ok: false, erro: 'o nome da rubrica não produz um identificador válido' });
    if (!nova.niveis.length) return json(400, { ok: false, erro: 'declare pelo menos um nível — a régua vazia mediria contra nada' });
    const lista = await rubricas(kv, escola);
    const idx = lista.findIndex((r) => r && r.id === nova.id);
    if (idx === -1) lista.push(nova); else lista[idx] = nova;
    await kv.put(RAIZ + '/' + escola + '/rubricas', JSON.stringify(lista));
    return json(idx === -1 ? 201 : 200, { ok: true, rubrica: nova, criada: idx === -1 });
  }

  // DELETE /api/bastidores/rubrica — apagar uma rubrica. As turmas que a usavam são
  // DESVINCULADAS no mesmo ato (não ficam apontando para uma rubrica que sumiu): cada uma
  // volta à régua própria ou à padrão. O número sai na resposta, para não ser surpresa.
  if (path === '/api/bastidores/rubrica' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = String(corpo.id || idDe(String(corpo.nome || '')) || '').trim();
    if (!id) return json(400, { ok: false, erro: 'informe a rubrica' });
    const lista = await rubricas(kv, escola);
    const idx = lista.findIndex((r) => r && r.id === id);
    if (idx === -1) return json(404, { ok: false, erro: 'rubrica não encontrada: ' + id });
    const [removida] = lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/rubricas', JSON.stringify(lista));
    const listaTurmas = await turmas(kv, escola);
    let desvinculadas = 0;
    for (const t of listaTurmas) {
      if (t && String(t.rubricaId || '') === id) { delete t.rubricaId; desvinculadas += 1; }
    }
    if (desvinculadas) await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(listaTurmas));
    return json(200, { ok: true, rubrica: removida.nome, turmasDesvinculadas: desvinculadas });
  }

  // POST /api/bastidores/termo — incluir termo do vocabulário.
  if (path === '/api/bastidores/termo' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const novo = normalizarTermo(corpo);
    if (!novo.termo) return json(400, { ok: false, erro: 'informe o termo' });
    // A TELA JÁ NÃO DEIXA ESCREVER CATEGORIA NEM TRADIÇÃO (18/10/2026); o servidor garante o
    // mesmo, porque um pedido forjado — ou uma página antiga em cache — não é a tela. Sem
    // isto, uma categoria escrita à mão entraria no vocabulário e não apareceria em nenhuma
    // das listas da interface.
    if (CATEGORIAS_DO_VOCABULARIO.indexOf(novo.categoria) === -1) {
      return json(400, {
        ok: false,
        erro: 'escolha a categoria: ' + CATEGORIAS_DO_VOCABULARIO.map(rotuloDaCategoria).join(' · '),
      });
    }
    if (TRADICOES_DO_VOCABULARIO.indexOf(novo.tradicao) === -1) {
      return json(400, {
        ok: false,
        erro: 'escolha a tradição: ' + TRADICOES_DO_VOCABULARIO.join(' · '),
      });
    }
    const lista = await termos(kv, escola);
    if (lista.some((t) => t && t.id === novo.id)) return json(409, { ok: false, erro: 'este termo já existe — selecione o registro existente' });
    lista.push(novo);
    await kv.put(RAIZ + '/' + escola + '/vocabulario', JSON.stringify(lista));
    return json(201, { ok: true, termo: novo.termo });
  }

  // DELETE /api/bastidores/termo — excluir termo (e limpar a relação).
  if (path === '/api/bastidores/termo' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = idDe(String(corpo.termo || corpo.nome || corpo.id || '').trim());
    if (!id) return json(400, { ok: false, erro: 'informe o termo' });
    const lista = await termos(kv, escola);
    const idx = lista.findIndex((t) => t && t.id === id);
    if (idx === -1) return json(404, { ok: false, erro: 'termo não encontrado' });
    // PROVENIÊNCIA (18/10/2026): o termo é o CONTEÚDO do plano. Se algum plano o declara
    // no repertório, ou se ele está associado a uma turma com plano, ele fica.
    {
      const usos = await usosDosPlanos(kv, escola);
      const pares = await paresComPlano(kv, escola);
      // A relação é chaveada por ID — o conjunto tem de ser de IDs, não de nomes.
      const nomesPresos = new Set((pares || []).map((p) => p && p.turma));
      const turmasPresas = new Set((await turmas(kv, escola))
        .filter((t) => t && nomesPresos.has(t.nome)).map((t) => t.id));
      if (termoVinculadoA(usos, await relacoes(kv, escola), turmasPresas, lista[idx])) {
        return json(409, {
          ok: false,
          erro: 'o termo «' + lista[idx].termo + '» já está num plano de ensino (repertório) ou ' +
            'numa turma com plano — apagá-lo romperia a proveniência.',
          vinculado: true,
        });
      }
    }
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/vocabulario', JSON.stringify(lista));
    const rel = await relacoes(kv, escola);
    let mudou = false;
    for (const k of Object.keys(rel)) {
      if (Array.isArray(rel[k]) && rel[k].indexOf(id) !== -1) {
        rel[k] = rel[k].filter((x) => x !== id);
        mudou = true;
      }
    }
    if (mudou) await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel));
    return json(200, { ok: true, termo: id, removido: true });
  }

  // POST /api/bastidores/turma-conteudo — associar um termo a uma turma (sem duplicar).
  if (path === '/api/bastidores/turma-conteudo' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const turmaId = idDe(String(corpo.turma || '').trim());
    const termoId = idDe(String(corpo.termo || '').trim());
    if (!turmaId || !termoId) return json(400, { ok: false, erro: 'informe a turma e o termo' });
    const listaTurmas = await turmas(kv, escola);
    const listaTermos = await termos(kv, escola);
    if (!listaTurmas.some((t) => t && t.id === turmaId)) return json(404, { ok: false, erro: 'turma não encontrada' });
    if (!listaTermos.some((t) => t && t.id === termoId)) return json(404, { ok: false, erro: 'termo não encontrado' });
    const rel = await relacoes(kv, escola);
    const atuais = Array.isArray(rel[turmaId]) ? rel[turmaId] : [];
    if (atuais.indexOf(termoId) !== -1) return json(409, { ok: false, erro: 'associação já existe' });
    atuais.push(termoId);
    rel[turmaId] = atuais;
    await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel));
    return json(201, { ok: true, turma: turmaId, termo: termoId, associado: true });
  }

  // DELETE /api/bastidores/turma-conteudo — remover a associação (não exclui o termo).
  if (path === '/api/bastidores/turma-conteudo' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const turmaId = idDe(String(corpo.turma || '').trim());
    const termoId = idDe(String(corpo.termo || '').trim());
    if (!turmaId || !termoId) return json(400, { ok: false, erro: 'informe a turma e o termo' });
    const rel = await relacoes(kv, escola);
    const atuais = Array.isArray(rel[turmaId]) ? rel[turmaId] : [];
    const idx = atuais.indexOf(termoId);
    if (idx === -1) return json(404, { ok: false, erro: 'associação não encontrada' });
    atuais.splice(idx, 1);
    rel[turmaId] = atuais;
    await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel));
    return json(200, { ok: true, turma: turmaId, termo: termoId, removido: true });
  }

  // POST /api/bastidores/semear-catalogo — carrega o catálogo INICIAL (idempotente: só
  // entram registros cujo id ainda não existe; a relação só acrescenta pares novos).
  if (path === '/api/bastidores/semear-catalogo' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const listaTurmas = await turmas(kv, escola);
    const listaTermos = await termos(kv, escola);
    const temTurma = (id) => listaTurmas.some((t) => t && t.id === id);
    const temTermo = (id) => listaTermos.some((t) => t && t.id === id);

    let turmasNovas = 0;
    for (const s of CATALOGO.TURMAS) {
      const nova = normalizarTurma(s);
      if (!nova.nome || temTurma(nova.id)) continue;
      listaTurmas.push(nova);
      turmasNovas += 1;
    }

    let termosNovos = 0;
    for (const s of CATALOGO.TERMOS) {
      const novo = normalizarTermo(s);
      if (!novo.termo || temTermo(novo.id)) continue;
      listaTermos.push(novo);
      termosNovos += 1;
    }

    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(listaTurmas));
    await kv.put(RAIZ + '/' + escola + '/vocabulario', JSON.stringify(listaTermos));

    // A relação inicial: só pares em que a turma e o termo existem (após a carga).
    const rel = await relacoes(kv, escola);
    let associacoes = 0;
    for (const r of CATALOGO.RELACOES) {
      const turmaId = idDe(String(r.turma || ''));
      const termoId = idDe(String(r.termo || ''));
      if (!turmaId || !termoId) continue;
      if (!temTurma(turmaId) && !listaTurmas.some((t) => t && t.id === turmaId)) continue;
      if (!temTermo(termoId) && !listaTermos.some((t) => t && t.id === termoId)) continue;
      const atuais = Array.isArray(rel[turmaId]) ? rel[turmaId] : [];
      if (atuais.indexOf(termoId) !== -1) continue;
      atuais.push(termoId);
      rel[turmaId] = atuais;
      associacoes += 1;
    }
    await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel));

    return json(200, { ok: true, turmasNovas, termosNovos, associacoes });
  }

  // ---------------------------------------------------------------------------
  // CURADORIA — a peça central: o que a escola ATRIBUI a cada professor, e que
  // pré-carrega os três formulários (Bloco 2 do pedido). Uma curadoria por
  // (professor + modalidade); o professor pode ter mais de uma (a regra é da escola).
  // ---------------------------------------------------------------------------

  // GET /api/bastidores/curadorias — a lista completa.
  if (path === '/api/bastidores/curadorias') {
    return json(200, { ok: true, escola, curadorias: curadoriasVigentes(await curadorias(kv, escola)) });
  }

  // GET /api/bastidores/curadoria-meta — tudo o que o formulário precisa de uma vez
  // (lazy, Frente 5): modalidades, tradições, professores, turmas, termos, alunas.
  if (path === '/api/bastidores/curadoria-meta') {
    const profs = await professores(kv, escola);
    const dono = await nomeDoDono(env, kv, escola);
    const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
    const professoresOpcoes = [];
    if (dono) professoresOpcoes.push({ valor: donoSlug, rotulo: dono });
    for (const p of profs) {
      if (!p || !p.nome || p.nome === dono) continue;
      professoresOpcoes.push({ valor: slugificar(p.nome), rotulo: p.nome });
    }
    return json(200, {
      ok: true,
      escola,
      modalidades: MODALIDADES.modalidades || [],
      tradicoes: tradicoesAdotaveis(),
      professores: professoresOpcoes,
      turmas: opcoesDeTurmas(await turmas(kv, escola)),
      termos: (await termos(kv, escola)).map((t) => ({ valor: t.id, rotulo: t.termo, categoria: t.categoria })),
      alunas: (await alunas(kv, escola)).map((a) => ({ valor: a, rotulo: a })),
    });
  }

  // GET /api/bastidores/curadoria-professor — a curadoria do professor (o que a tela
  // consome para travar/filtrar os formulários). Sem `?professor=` → 400; sem curadoria
  // → `curadorias: []` (a tela trava até a direção curar — a memória da aula dada pertence
  // à escola, não ao professor). Um professor pode ter mais de uma (uma por modalidade).
  if (path === '/api/bastidores/curadoria-professor') {
    const slug = String(url.searchParams.get('professor') || '').trim();
    if (!slug) return json(400, { ok: false, erro: 'informe o professor' });
    // SÓ AS VIGENTES (16/10/2026): uma curadoria substituída por uma derivação continua
    // guardada, mas não autoriza nada — quem a lê para trabalhar são as vigentes.
    const todas = curadoriasVigentes(await curadorias(kv, escola));
    const dele = todas.filter((c) => c && c.professor === slug);
    return json(200, { ok: true, escola, professor: slug, curadorias: dele });
  }

  // POST /api/bastidores/curadoria — gravar (upsert) a curadoria de um professor.
  if (path === '/api/bastidores/curadoria' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const professor = String(corpo.professor || '').trim();
    const modalidade = String(corpo.modalidade || '').trim();
    if (!professor || !modalidade) return json(400, { ok: false, erro: 'escolha o professor e a modalidade' });
    // A TURMA É UMA SÓ (16/10/2026). Era uma lista, e a lista mentia: quem escolhia duas
    // turmas estava a dizer que as alunas de uma pertencem à outra — e não pertencem. O
    // registo continua a guardar `turmas` (lista de UM) para o plano, que já a lê assim, não
    // ter de mudar; o que a escola vê é um `select`, um por vez.
    const turmasPedidas = Array.isArray(corpo.turmas)
      ? corpo.turmas.map((x) => String(x).trim()).filter(Boolean)
      : [String(corpo.turma || '').trim()].filter(Boolean);
    if (turmasPedidas.length > 1) {
      return json(400, {
        ok: false,
        erro: 'a curadoria é de UMA turma por vez: as alunas de uma turma não são as da outra, ' +
          'e a lista faria o plano de uma dizer as alunas da outra. Atribua a segunda turma numa ' +
          'curadoria própria.',
        turmas: turmasPedidas,
      });
    }
    // NÃO SE LIBERA UM PLANO PARA UMA TURMA SEM RITMO (16/10/2026). A curadoria é o que
    // autoriza o professor a fazer o plano daquela turma; se a turma não tem frequência,
    // dias, duração e período, o plano nasceria com quatro campos vazios e ninguém saberia
    // a dose. A recusa diz QUAL turma e o que falta — e o caminho é o cadastro da turma.
    if (turmasPedidas.length) {
      const todas = await turmas(kv, escola);
      const porNome = new Map(todas.map((t) => [t.nome, t]));
      const faltando = [];
      for (const nome of turmasPedidas) {
        const t = porNome.get(nome);
        const falta = t ? faltaNoRitmoDaTurma(t) : ['o cadastro (esta turma não existe na escola)'];
        if (falta.length) faltando.push(nome + ' — falta ' + fraseDaFalta(falta));
      }
      if (faltando.length) {
        return json(400, {
          ok: false,
          erro: 'não se atribui uma turma sem o ritmo declarado: ' + faltando.join('; ') +
            '. Declare a frequência, os dias, a duração e o período no cadastro da turma (aba Turmas), ' +
            'e atribua depois.',
          turmas: faltando,
        });
      }
    }
    const lista = await curadorias(kv, escola);
    const turmaPedida = turmasPedidas[0] || '';
    // A MESMA PROFESSORA, A MESMA MODALIDADE, OUTRA TURMA (16/10/2026). O id passou a levar a
    // turma, e a procura é pelo trio — antes havia um só registo por professor × modalidade,
    // e a segunda turma substituía a primeira. Atribuir N turmas é agora N curadorias, que é
    // o que sempre foi: cada uma autoriza um plano.
    // A ORIGEM vem declarada quando se está a editar (16/10/2026): com a turma editável, o
    // trio novo pode já não casar com o registo de onde se partiu, e a procura por (professor,
    // modalidade, turma) criaria uma curadoria ao lado da antiga em vez de a corrigir.
    const idAntigo = String(corpo.idAntigo || '').trim();
    const atual = (idAntigo
      ? lista.find((c) => c && !c.substituidaPor && c.id === idAntigo)
      : null) || acharCuradoria(lista, professor, modalidade, turmaPedida);
    const idDoTrio = idCuradoria(professor, modalidade, turmaPedida);
    // O ID SÓ MUDA QUANDO A TURMA MUDA. Se o trio é o mesmo, o registo mantém o id que já tem
    // — inclusive um id antigo (sem a turma), que não se renomeia por baixo de quem já o
    // referencia. Mudando a turma, o id acompanha o trio, e o registo muda de chave com ele:
    // sem isso ficava um órfão no id antigo e a lista mostrava a curadoria duas vezes.
    const turmaAntiga = atual ? (turmasDaCuradoria(atual)[0] || '') : '';
    const turmaMudou = !!atual && turmaAntiga !== turmaPedida;
    const id = atual ? (turmaMudou ? idDoTrio : atual.id) : idDoTrio;

    // EDITAR UMA CURADORIA QUE JÁ EXISTE — a mesma regra da turma. Livre (nenhum plano de
    // ensino nasceu dela) edita-se: o registo é substituído no lugar. Vinculada (o professor
    // já fez o plano desta turma) NÃO se edita — deriva-se, senão o plano que está no ar
    // passaria a falar de uma curadoria que já não é a dele.
    if (atual) {
      const pares = await paresComPlano(kv, escola);
      if (curadoriaVinculadaA(pares, atual)) {
        return json(409, {
          ok: false,
          erro: 'a curadoria do professor «' + atual.professor + '» em «' + atual.modalidade +
            '» (' + turmasDaCuradoria(atual).join(', ') + ') já tem plano de ensino — ela não se ' +
            'edita: derive uma versão nova, que passa a valer a partir de uma data e deixa a ' +
            'anterior como referência do passado.',
          vinculada: true,
        });
      }
    }

    const alunasPedidas = Array.isArray(corpo.alunas)
      ? corpo.alunas.map((x) => String(x).trim()).filter(Boolean) : [];
    // A ALUNA NÃO SE REPETE NA MESMA MODALIDADE (16/10/2026). Se ela já está noutra turma desta
    // modalidade, pô-la aqui faria os dois planos dizerem as mesmas alunas — e só uma turma é a
    // dela. A recusa diz ONDE ela está; o caminho é tirá-la de lá (ou não a pôr aqui).
    const ocupadas = alunasComprometidas(lista, modalidade, atual ? atual.id : null);
    const repetidas = alunasPedidas.filter((a) => ocupadas[a]);
    if (repetidas.length) {
      return json(409, {
        ok: false,
        erro: 'estas alunas já estão noutra turma de «' + modalidade + '»: ' +
          repetidas.map((a) => a + ' (em ' + ocupadas[a] + ')').join('; ') +
          '. Uma aluna pertence a UMA turma por modalidade — é o que faz o plano de cada uma ' +
          'dizer as alunas certas. Tire-a da outra curadoria, ou não a ponha nesta.',
        alunas: repetidas.map((a) => ({ aluna: a, turma: ocupadas[a] })),
      });
    }

    const nova = {
      // O id é o do registo que já existe, quando existe — e quando a turma NÃO mudou: um id
      // antigo (sem a turma) não se renomeia por baixo de quem já o referencia. Mudando a
      // turma, o id acompanha (é o trio que identifica a curadoria).
      id,
      professor: slugificar(professor),
      modalidade,
      tradicao: String(corpo.tradicao || '').trim(),
      turmas: turmasPedidas,
      repertorio: Array.isArray(corpo.repertorio) ? corpo.repertorio.map((x) => String(x).trim()).filter(Boolean) : [],
      alunas: alunasPedidas,
    };
    const idx = atual ? lista.findIndex((c) => c && c.id === atual.id) : -1;
    if (idx === -1) lista.push(nova);
    else lista[idx] = Object.assign({}, atual, nova);
    await kv.put(RAIZ + '/' + escola + '/curadorias', JSON.stringify(lista));
    return json(201, { ok: true, curadoria: nova, criada: !atual });
  }

  // POST /api/bastidores/curadoria-derivar — o «EDITAR» da curadoria VINCULADA (16/10/2026).
  //
  // Mesmo invariante da turma: a escola pensa que corrige, e o que fica gravado é um ELO NOVO
  // — a curadoria anterior desce para o histórico com `substituidaPor`/`substituidaEm`, e a
  // nova nasce com a data a partir da qual vale (`vigenteDe`) e com um id que a distingue.
  // O par (professor, modalidade) NÃO muda: é ele que identifica a curadoria — tal como o nome
  // da turma. Mudá-lo seria criar outra curadoria, não corrigir esta.
  //
  // O que se ajusta é o que não nasceu do plano: a turma, a tradição, o repertório e as
  // alunas. A proveniência do professor e da modalidade fica.
  if (path === '/api/bastidores/curadoria-derivar' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const alvo = String(corpo.derivarDe || corpo.id || '').trim();
    if (!alvo) return json(400, { ok: false, erro: 'informe a curadoria' });
    const lista = await curadorias(kv, escola);
    const anterior = curadoriasVigentes(lista).find((c) => c && c.id === alvo);
    if (!anterior) {
      return json(404, { ok: false, erro: 'curadoria não encontrada (ou já substituída): ' + alvo });
    }
    const vigencia = String(corpo.vigencia || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vigencia)) {
      return json(400, { ok: false, erro: 'informe a data a partir da qual a curadoria ajustada vale (AAAA-MM-DD)' });
    }
    const turmasPedidas = Array.isArray(corpo.turmas)
      ? corpo.turmas.map((x) => String(x).trim()).filter(Boolean)
      : [String(corpo.turma || '').trim()].filter(Boolean);
    if (turmasPedidas.length > 1) {
      return json(400, {
        ok: false,
        erro: 'a curadoria é de UMA turma por vez: as alunas de uma turma não são as da outra.',
        turmas: turmasPedidas,
      });
    }
    if (turmasPedidas.length) {
      const todas = await turmas(kv, escola);
      const porNome = new Map(todas.map((t) => [t.nome, t]));
      const faltando = [];
      for (const nome of turmasPedidas) {
        const t = porNome.get(nome);
        const falta = t ? faltaNoRitmoDaTurma(t) : ['o cadastro (esta turma não existe na escola)'];
        if (falta.length) faltando.push(nome + ' — falta ' + fraseDaFalta(falta));
      }
      if (faltando.length) {
        return json(400, {
          ok: false,
          erro: 'não se atribui uma turma sem o ritmo declarado: ' + faltando.join('; ') + '.',
          turmas: faltando,
        });
      }
    }
    const turmaFinal = turmasPedidas.length ? turmasPedidas[0] : (turmasDaCuradoria(anterior)[0] || '');
    const alunasFinais = Array.isArray(corpo.alunas)
      ? corpo.alunas.map((x) => String(x).trim()).filter(Boolean)
      : (anterior.alunas || []);
    // A ALUNA NÃO SE REPETE NA MESMA MODALIDADE — também ao derivar. A curadoria que se está
    // a derivar não conta (é a de origem, `anterior.id`): as alunas dela não competem consigo.
    const ocupadasDeriv = alunasComprometidas(lista, String(anterior.modalidade || ''), anterior.id);
    const repetidasDeriv = alunasFinais.filter((a) => ocupadasDeriv[a]);
    if (repetidasDeriv.length) {
      return json(409, {
        ok: false,
        erro: 'estas alunas já estão noutra turma de «' + String(anterior.modalidade || '') + '»: ' +
          repetidasDeriv.map((a) => a + ' (em ' + ocupadasDeriv[a] + ')').join('; ') +
          '. Uma aluna pertence a UMA turma por modalidade.',
        alunas: repetidasDeriv.map((a) => ({ aluna: a, turma: ocupadasDeriv[a] })),
      });
    }
    const nova = Object.assign({}, anterior, {
      // O id do derivado parte do id do par (professor, modalidade, turma) — não do id antigo,
      // que pode não ter a turma. Assim a versão nova nasce já com a identidade completa.
      id: idCuradoriaDerivado(
        idCuradoria(anterior.professor, String(anterior.modalidade || ''), turmaFinal) || anterior.id,
        vigencia, lista),
      tradicao: corpo.tradicao === undefined ? anterior.tradicao : String(corpo.tradicao || '').trim(),
      turmas: turmaFinal ? [turmaFinal] : [],
      repertorio: Array.isArray(corpo.repertorio)
        ? corpo.repertorio.map((x) => String(x).trim()).filter(Boolean)
        : (anterior.repertorio || []),
      alunas: alunasFinais,
      vigenteDe: vigencia,
      substitui: anterior.id,
    });
    delete nova.substituidaPor;
    delete nova.substituidaEm;
    const indice = lista.findIndex((c) => c && c.id === anterior.id);
    lista[indice] = Object.assign({}, anterior, {
      substituidaPor: nova.id,
      substituidaEm: vigencia,
    });
    lista.push(nova);
    await kv.put(RAIZ + '/' + escola + '/curadorias', JSON.stringify(lista));
    return json(201, { ok: true, curadoria: nova, substitui: anterior.id, vigenteDe: vigencia });
  }

  // DELETE /api/bastidores/curadoria — remover a curadoria de um professor.
  if (path === '/api/bastidores/curadoria' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = String(corpo.id || '').trim();
    if (!id) return json(400, { ok: false, erro: 'informe a curadoria' });
    const lista = await curadorias(kv, escola);
    const idx = lista.findIndex((c) => c && c.id === id);
    if (idx === -1) return json(404, { ok: false, erro: 'curadoria não encontrada' });
    // PROVENIÊNCIA (18/10/2026): a curadoria vinculada é linha de base. O botão já se
    // escondia; a regra vive aqui, para um pedido forjado não a contornar.
    {
      const pares = await paresComPlano(kv, escola);
      if (curadoriaVinculadaA(pares, lista[idx])) {
        return json(409, {
          ok: false,
          erro: 'a curadoria já tem plano de ensino — apagá-la romperia a proveniência. ' +
            'Se algo mudou, derive uma versão nova.',
          vinculado: true,
        });
      }
    }
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/curadorias', JSON.stringify(lista));
    return json(200, { ok: true, curadoria: id, removida: true });
  }

  return json(404, { ok: false, erro: 'não encontrado' });
}

module.exports = {
  fetch,
  temProfessor,
  senhaDaEscolaOk,
  // A PÁGINA da Produção, exportada para a prova poder abri-la num navegador de verdade
  // (18/10/2026). O menu do celular é uma folha que abre e fecha, e isso não se mede no
  // texto do HTML: mede-se a posição do elemento — antes e depois do clique.
  paginaProducao,
  // As duas peças do RITMO da turma, exportadas para a prova: o que falta numa turma para
  // ela poder receber um plano, e a frase que diz isso em português (16/10/2026).
  faltaNoRitmoDaTurma,
  fraseDaFalta,
  // A APARÊNCIA DA ESCOLA (18/10/2026) — a decisão C15. Exportada porque quem serve o PACOTE e
  // a PORTA não é este módulo: é a ponte de produção, e ela precisa de ler o MESMO valor. Uma
  // segunda leitura do KV, com a sua própria chave e o seu próprio padrão, divergiria no dia em
  // que um dos dois mudasse — e o sintoma seria uma escola com duas peles.
  aparenciaDaEscola,
  gravarAparencia,
  MODOS_DE_APARENCIA,
};
