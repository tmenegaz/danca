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

// A ESCOLA DE TESTE — o número sai do slug e o preenchidor é o MESMO script da porta.
// Aqui ele só é injetado na página de Produção, depois do script grande; a rota que o
// serve vive em `producao.js`, que é quem conhece a URL pública do asset.
const { numeroDoTeste } = require('./teste-fixtures.js');

// O catálogo INICIAL de turmas e vocabulário técnico (conteúdo, não código). Carregado
// sob demanda pela Produção (`POST /api/bastidores/semear-catalogo`), idempotente.
const CATALOGO = require('./catalogo-seed.js');
// A COMPOSIÇÃO catálogo × escola é a dos produtos, e é a única (02/11/2026).
const COMUM = require('../nucleo/produtos/comum.js');
// E a do ALFABETO é a do núcleo (03/11/2026): `registosDaEscola` decide o que uma escola vê de
// cada exercício — a mesma precedência que a composição do documento usa. Uma segunda cópia da
// regra aqui divergiria da primeira à primeira correcção.
const { registosDaEscola } = require('../nucleo/notacao.js');

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
/* O RÓTULO É DERIVAÇÃO, E VIVE NO DADO (02/11/2026). O dado guarda a chave (`francesa`); o ecrã
 * mostra o rótulo que `tradicoes.json` declara (`Francesa`). Uma função só, chamada por quem
 * desenha — e um mapa só, no mesmo ficheiro que declara as tradições. */
const rotuloDaTradicao = CATALOGO.rotuloDaTradicao;
/* OS MÉTODOS QUE NÃO SÃO TRADIÇÕES DO CATÁLOGO (02/11/2026). `Cecchetti` e `Escola livre` não
 * têm coluna em `diferencasDeNomenclatura`, e a nota do método di-lo — o que é o correcto: a
 * lacuna fica escrita em vez de se inventar uma equivalência. Eles existem porque um verbete
 * pode declarar um método que o catálogo não adopta.
 *
 * A LISTA É ÚNICA, e é usada pelo `<select>` do método. Ela e `TRADICOES_DO_VOCABULARIO` somam-se
 * uma vez, aqui — foi a soma repetida em dois sítios que pôs uma `Compartilhada` a mais na tela. */
const METODOS_LIVRES = ['Cecchetti', 'Escola livre'];
const METODOS_DO_VERBETE = (() => {
  const vistos = new Set();
  const lista = [];
  for (const chave of TRADICOES_DO_VOCABULARIO.concat(METODOS_LIVRES)) {
    const rotulo = rotuloDaTradicao(chave);
    // A chave de comparação é o RÓTULO: é ele que o ecrã mostra, e duas opções com o mesmo texto
    // são a mesma opção para quem lê — mesmo que uma tenha vindo como chave e a outra como
    // método livre.
    const assinatura = String(rotulo || chave).toLowerCase();
    if (vistos.has(assinatura)) continue;
    vistos.add(assinatura);
    lista.push({ valor: chave, rotulo });
  }
  return lista;
})();
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
// O ACERVO DOS ENVELOPES (20/10/2026). A regra de proveniência lia os planos no KV, um por um;
// agora lê o índice do acervo, que é uma leitura só e traz o que a regra compara.
const acervo = require('./acervo-envelopes.js');
const porta = require('../nucleo/porta.js');
const paginacao = require('../nucleo/paginacao.js');
const { criarCloudflare } = require('../adaptadores/cloudflare.js');
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
/**
 * O VOCABULÁRIO TÉCNICO (28/10/2026) — e ele JÁ NÃO VIVE NO KV.
 *
 * Antes esta função lia `<escola>/vocabulario` do KV, semeado pelo botão «Carregar catálogo
 * inicial». Isso dava DUAS listas de termos: a cópia por escola, e o ficheiro da modalidade no
 * repositório — que é o que o gerador lê do disco e o que a tela do verbete consulta. Duas listas
 * de termos divergem ao primeiro termo novo, e o sintoma é silencioso: um verbete que existe e não
 * casa com exercício nenhum.
 *
 * Agora há uma só. `CATALOGO.TERMOS` é o ficheiro `biblioteca/modalidades/bale-classico/vocabulario.json`
 * **embutido no bundle do Worker** pelo esbuild (o Worker não tem `fs`): é o mesmo ficheiro, com o
 * mesmo conteúdo, e é atualizado no deploy que o commit do cadastro dispara. Zero KV, e zero
 * chamada à API por request.
 *
 * A assinatura fica `(kv, escola)` — sem uso nos dois argumentos, e de propósito: há oito
 * chamadores, e mudá-la obrigaria a tocar em todos para não mudar nada. Quem lê esta função sabe
 * onde o dado está pelo comentário; um comentário a mentir é pior do que um argumento a sobrar.
 */
async function termos(kv, escola) {
  // O TERMO DA ESCOLA APARECE NA ESCOLA, E SÓ NELA (02/11/2026). O vocabulário é um ficheiro só,
  // e cada termo declara o seu dono (`escola`); ausente = do catálogo. Antes desta linha, criar um
  // termo na escola A punha-o no dicionário de B — que é a razão pela qual o produto que se vende
  // não podia ser vendido sem entregar as edições das outras.
  //
  // O FILTRO É AQUI E NÃO NO DADO: `CATALOGO.TERMOS` é o bundle inteiro, e é esta função que
  // responde «o que é que esta escola vê». Uma leitura filtrada no build obrigaria o build a saber
  // de que escola é o Worker — e o Worker é o mesmo código para todas.
  const alvo = String(escola || '').trim();
  const { catalogo, adicoes } = COMUM.separarPorEscola(CATALOGO.TERMOS, alvo);
  // A COMPOSIÇÃO É A MESMA DOS PRODUTOS, e não uma segunda: `compor` é a única função que decide
  // a precedência (a escola vence, o catálogo preenche). Uma lista própria aqui divergiria do
  // dicionário ao primeiro termo — e divergiria em silêncio, que é o pior modo.
  return COMUM.compor(catalogo, adicoes).map((t) => Object.assign({}, t));
}

/**
 * AS MÚSICAS QUE O VERBETE DECLARA, por EXERCÍCIO — `Map(nome → ['2|4/4', …])`.
 *
 * O verbete é chaveado pelo NOME do exercício e, dentro, pela música `<tempos>|<compasso>`: é a
 * mesma chave que `motor/nucleo/notacao.js` usa para compor. Esta função só a lê, e não decide
 * nada — quem decide é a tela do plano (as duas colunas) e, quando há música, o motor.
 *
 * O alfabeto vem por `require` (empacotado no Worker): não há KV nem chamada à API do GitHub, e
 * é por isso que esta leitura pode ser feita a cada carga da página sem custo de cota.
 */
/**
 * AS CATEGORIAS DO TRECHO — «que parte do corpo se move».
 *
 * A LISTA É A DO ALFABETO, e não uma cópia escrita nesta página (01/11/2026). Ela era
 * `['Pé', 'Peso', 'Plié', 'Braço']` — quatro strings escritas à mão aqui —, e o `Plié` no meio
 * delas é o defeito que a pesquisadora viu: «na categoria nós temos pé, peso, plié e braço,
 * quando na verdade seria pé, peso, perna e braço, plié não». Plié não é parte do corpo: é um
 * exercício, e a categoria do trecho diz que parte se move. Duas listas do mesmo vocabulário
 * divergem ao primeiro item novo — a do alfabeto é a que o VALIDADOR usa (`verbete.js` recusa
 * uma célula cuja categoria não esteja aqui, e o `lerBloco` recusa o bloco inteiro), então é
 * ela que a tela tem de ler.
 *
 * A ordem é a do alfabeto, e a primeira nasce marcada — é a convenção do formulário.
 */
function categoriasDoTrecho() {
  const { ALFABETOS, MODALIDADE_PADRAO } = require('../nucleo/notacao.js');
  const alfabeto = ALFABETOS[MODALIDADE_PADRAO] || {};
  const lista = Array.isArray(alfabeto.categorias) ? alfabeto.categorias : [];
  // Sem alfabeto publicado não há categorias a oferecer, e inventar quatro seria pior do que
  // não oferecer nenhuma: a célula seria recusada pelo servidor com a mesma lista.
  return lista;
}

function musicasDosExercicios() {
  const { alfabetos } = require('../nucleo/notacao.js');
  const mapa = new Map();
  for (const { alfabeto } of alfabetos()) {
    const verbetes = (alfabeto && alfabeto.verbetes) || {};
    for (const nome of Object.keys(verbetes)) {
      if (nome.startsWith('_')) continue;
      const musicas = Object.keys(verbetes[nome] || {}).filter((k) => /^\d+\|/.test(k));
      if (musicas.length) mapa.set(nome, musicas);
    }
  }
  return mapa;
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
async function paresComPlano(env, escola, jaLido) {
  // O `jaLido` É O MESMO IDIOMA DO `resumosDeEnvelopes` (02/11/2026): quem precisa das duas
  // respostas — os pares e os usos — lê o índice UMA vez e passa-o. Sem isto, a guarda de
  // proveniência do verbete lia o índice duas vezes no mesmo pedido, que é exactamente o defeito
  // que a fase 2 corrigiu em 20/10/2026 (ver o comentário acima de `resumosDosPlanos`).
  const planos = jaLido || await resumosDosPlanos(env, escola);
  if (!planos) return null;
  const pares = [];
  for (const r of planos) {
    const turma = r.turma || null;
    if (!turma) continue;
    const professor = String(r.professor || '').trim();
    // O CICLO VAI JUNTO (18/10/2026). Ele não entra na regra de proveniência — o par é
    // (professor, turma) —, mas é o que a PORTA precisa para abrir o plano de ensino
    // daquele professor (`/plano-ensino/?professor=…&escola=…&ciclo=…`). Sem ele, o link
    // cairia na porta a pedir o ciclo, e a curadoria deixaria de ser o atalho que é.
    const ciclo = String(r.ciclo || '').trim();
    pares.push({ professor, turma, ciclo });
  }
  return pares;
}

/**
 * OS PLANOS COMO O ÍNDICE OS RESUME — UMA leitura (20/10/2026).
 *
 * `paresComPlano` e `usosDosPlanos` liam TODOS os envelopes de plano no KV: uma enumeração (a
 * operação de cota diária) e uma leitura por plano, e as duas funções na mesma requisição. O
 * índice do acervo já traz, por plano, o professor, a turma, o ciclo, o nome do professor e o
 * repertório — é a mesma decisão da fase 2, aplicada a quem lia por fora do `porta.js`.
 *
 * Devolve `null` quando não deu para ler, e quem chama trata `null` como «tudo vinculado», que
 * é o lado seguro: apagar por engano rompe a proveniência, e isso não se desfaz. Sem token ou
 * sem escola não há acervo — e aí também não há enrolar: `null`.
 */
async function resumosDosPlanos(env, escola) {
  // O MESMO ARMAZENAMENTO DA PORTA: o acervo do repositório com o KV como reserva de leitura.
  // Usar a mesma composição (e não um leitor à parte) é o que garante que a regra de
  // proveniência vê os planos ANTIGOS — os que ainda só estão no KV —, e não só os que já
  // migraram. Sem isso, um plano antigo deixaria de proteger a turma que referencia.
  const legado = criarCloudflare(env);
  const armazenamento = acervo.combinar(acervo.doAmbiente(env, { legado, escola }), legado);
  let lista = null;
  try {
    lista = await porta.resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/);
  } catch (e) {
    return null;
  }
  return lista.map((x) => x.resumo);
}

/**
 * AS ALUNAS QUE JÁ TÊM ANAMNESE (26/10/2026) — o conjunto que apaga a marca «nova».
 *
 * O que a marca dizia e o que passou a dizer. Ela nasceu para avisar «esta aluna ainda não tem
 * professor nem turma» (não está em curadoria nenhuma, a porta de entrada da escola). A
 * pesquisadora leu-a como «esta aluna ainda não foi entrevistada» e pediu que ela saísse quando
 * a anamnese ficasse feita — a lista NÃO encolhe (a aluna continua alcançável, e voltar a mexer
 * no que já foi respondido não pode depender de outro ecrã), mas o aviso desaparece.
 *
 * O CRITÉRIO É «TEM ANAMNESE REGISTADA», e não «está completa», por uma razão medida: o resumo
 * do envelope no índice não guarda a contagem de obrigatórios nem o estado derivado — saber se
 * está «completa» exige LER cada envelope, e a regra desta estante é que uma lista se faz com
 * metadado, numa leitura só. Um envelope só nasce quando o professor grava, e gravar é o gesto
 * de quem já entrevistou.
 *
 * FALHA DE LEITURA NÃO DERRUBA O SELETOR: sem o conjunto, a marca fica como estava (o
 * comportamento de antes desta regra). Perder o aviso é melhor do que perder a lista.
 */
async function alunasComAnamnese(env, escola) {
  const legado = criarCloudflare(env);
  const armazenamento = acervo.combinar(acervo.doAmbiente(env, { legado, escola }), legado);
  try {
    const estados = await porta.estadosDasAnamneses(armazenamento);
    const nomes = new Set();
    for (const e of Object.values(estados)) {
      const apelido = String((e && e.apelido) || '').trim();
      if (apelido) nomes.add(apelido);
    }
    return nomes;
  } catch (e) {
    return new Set();
  }
}

/** As TURMAS que já têm plano — o conjunto que o cartão da turma consulta. */
async function turmasComPlano(env, escola) {
  const pares = await paresComPlano(env, escola);
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
 * UMA LEITURA, E NÃO UMA POR PLANO (20/10/2026). Antes esta função enumerava o KV e abria cada
 * envelope de plano para colher três coisas. Elas passaram a viajar no RESUMO do índice do
 * acervo, escrito pela mesma função que o reconstrói:
 *
 *   - `professores` — o `contexto.professor` do envelope (o slug) e a resposta
 *     `contexto-professor` (o nome que o formulário gravou);
 *   - `turmas` — o `contexto-turma` (o resumo do índice já o traz resolvido);
 *   - `termos` — a resposta `repertorio`, que é a lista de passos do plano, por NOME e por
 *     slug (as duas formas aparecem em planos de épocas diferentes).
 *
 * `null` quando a leitura falha — e quem lê trata `null` como «tudo vinculado», que é o lado
 * seguro: apagar por engano rompe a proveniência, e isso não se desfaz.
 */
async function usosDosPlanos(env, escola, jaLido) {
  const usos = { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 };
  const planos = jaLido || await resumosDosPlanos(env, escola);
  if (!planos) return null;
  for (const r of planos) {
    usos.planos += 1;
    const prof = String(r.professor || '').trim();
    for (const p of [prof, String(r.professorNome || '').trim()]) {
      const s = String(p == null ? '' : p).trim();
      if (s) { usos.professores.add(s); usos.professores.add(slugificar(s)); }
    }
    if (r.turma) usos.turmas.add(r.turma);
    for (const t of (Array.isArray(r.repertorio) ? r.repertorio : [])) {
      const s = String(t == null ? '' : t).trim();
      if (s) { usos.termos.add(s); usos.termos.add(idDe(s)); }
    }
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

/**
 * O PROFESSOR ESTÁ CURADO? (22/10/2026) — a outra metade da regra do «livre».
 *
 * A dona do produto descreveu o estado assim: «eu tenho um professor criado, não tenho curadoria —
 * ele é livre. Eu tenho um professor criado, ele está na curadoria — não posso mexer naquele
 * professor. Eu removo a curadoria, aí eu posso mexer. Eu tenho curadoria e plano de ensino — não
 * posso mais mexer na curadoria e não posso mais mexer no professor.»
 *
 * Ou seja: ser curado já trava o PROFESSOR (nome e exclusão), mesmo sem plano. E é reversível, ao
 * contrário do plano: enquanto a curadoria não gerou plano de ensino, a própria curadoria pode ser
 * removida (`curadoriaVinculadaA`) — e com ela sai o travamento. Depois do plano, as duas coisas
 * ficam presas, que é a regra de proveniência de sempre.
 *
 * O par (professor, turma) NÃO importa aqui: a pergunta é sobre a PESSOA. Um professor curado para
 * uma turma é um professor com trabalho atribuído, e o nome dele já vai nos documentos dessa
 * curadoria.
 *
 * `null` (não deu para ler a lista) conta como curado, pela mesma razão do plano: na dúvida, não
 * se mexe.
 */
function professorCurado(curs, p) {
  if (!Array.isArray(curs)) return true;
  const nome = String((p && p.nome) || '').trim();
  const slug = slugDoProfessor(p) || slugificar(nome);
  return curs.some((c) => {
    if (!c) return false;
    const de = String(c.professor || '').trim();
    return de !== '' && (de === nome || de === slug || slugificar(de) === slug);
  });
}

/** O professor está PRESO: curado, ou já num plano de ensino. É o que impede mexer nele. */
function professorPreso(curs, usos, p) {
  return professorCurado(curs, p) || professorVinculadoA(usos, p);
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
  // Os nomes são `trio-*` porque a escala passou a ser uma peça da folha, e `.nivel-*` já tem
  // dono no lançamento de aula — a checagem «Forma» dá cada nome de classe a um dono só.
  if (/satisf/.test(n)) return 'trio-ok';
  if (/raz(o|ó)avel/.test(n)) return 'trio-razoavel';
  if (/desenvolv/.test(n)) return 'trio-alerta';
  if (/nao se aplica|n\/a|neutro/.test(n)) return 'trio-neutro';
  if (indice === total - 1) return 'trio-neutro';
  if (indice === 0) return 'trio-ok';
  if (indice === 1) return 'trio-razoavel';
  return 'trio-alerta';
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
/**
 * O TÍTULO DA SECÇÃO COM A SETA DO ACORDEÃO (18/10/2026).
 *
 * Turmas ganhou o acordeão primeiro, e por uma razão que vale para todas: o formulário ocupa
 * uma coluna que a listagem precisa. Nas secções de uma coisa só (professores, alunas,
 * vocabulário, curadorias) o formulário não tem barra de passos — não há nada a preservar
 * quando ele recolhe —, e por isso o cabeçalho do acordeão é o TÍTULO da secção, que já está
 * ali. Recolhido, fica uma linha: o título e a seta. A listagem sobe e ocupa a largura toda.
 *
 * A SETA É O ÚNICO TEXTO DO CONTROLE, e é um glifo: nada de «Recolher formulário» escrito. O
 * `aria-label` e o `title` dizem o mesmo a quem não vê a seta, e o `aria-expanded` diz em que
 * estado está. O `data-acordeao` é o gancho que o script procura.
 *
 * TURMAS ENTROU NESTE DESENHO A 01/11/2026, e é a razão de haver um quarto parâmetro. A seta
 * dela vivia no fim da FAIXA DOS PASSOS, e a pesquisadora pediu-a onde estão as outras: «os
 * steps de Turma têm o botão de colapsar ou expandir na mesma linha dos steps […] nos demais o
 * botão está no título. Então aqui na Turma vamos fazer esse ajuste, deixar igual aos demais».
 *
 * A SETA DA TURMA É A ÚNICA QUE NÃO PASSA POR `data-acordeao`, e não é excepção gratuita: o
 * que ela recolhe é o MIOLO DOS PASSOS (`#turmas-paineis`), e não o corpo da secção — a faixa
 * dos passos fica, porque é ela que diz onde se está. O `idDoBotao` existe para isso: a seta
 * leva um `id` em vez do gancho, e o handler antigo continua a ser o dela.
 */
function tituloComAcordeao(idDaSecao, titulo, idDoMiolo, idDoBotao) {
  return '<h2 class="secao-titulo"><span class="secao-nome">' + titulo + '</span>' +
    '<button type="button" class="alternar-form" ' +
    (idDoBotao ? 'id="' + idDoBotao + '" ' : 'data-acordeao="' + idDaSecao + '" ') +
    'aria-expanded="true" aria-controls="' + idDoMiolo + '" ' +
    'aria-label="Recolher o formulário" title="Recolher o formulário">▾</button></h2>';
}

/* O RODAPÉ DE PÁGINAS MUDOU-SE PARA O NÚCLEO (23/10/2026). Ele era uma função daqui, e a
   lista de aulas da publicação passou a precisar do mesmo comportamento. Duas cópias divergem na
   primeira correcção; uma só, em `motor/nucleo/paginacao.js`, serve as duas superfícies. A
   Produção continua a chamar pelo mesmo nome — o que mudou foi o sítio onde ele mora. */
function rodapePaginacao() {
  return paginacao.marcacao();
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
 * O QUE FALTA PARA A CURADORIA ESTAR COMPLETA (23/10/2026).
 *
 * A curadoria não é um apontamento: é o que **autoriza** o professor a fazer o plano de uma
 * turma, e é ela que declara **quem** está nessa turma. Um registo a que falte a tradição diz
 * que o professor ensina sem dizer em que linha; sem turma não autoriza plano nenhum (e o id
 * cai no formato antigo, `professor+modalidade`, que é a colisão que a turma veio corrigir);
 * sem alunas, o PO de uma turma não tem a quem observar — e a lista de sujeitos sai vazia sem
 * que nada no ecrã explique porquê.
 *
 * AS CINCO COISAS SÃO OBRIGATÓRIAS, e a regra é UMA só: esta função. Ela é chamada pelas duas
 * rotas que escrevem curadoria (atribuir e derivar) e pelo formulário, para a recusa chegar
 * antes de a pessoa carregar no botão. Três sítios, uma regra — a alternativa era três listas
 * a divergir, e a que ficasse para trás seria sempre a do servidor, que é a que guarda.
 *
 * A MENSAGEM DIZ O QUE FALTA E ONDE SE RESOLVE. «Faltam campos» não serve: a pessoa fica a
 * olhar para o formulário sem saber qual. Quando o que falta é uma ALUNA ou uma TURMA, o
 * caminho é outro sítio da Produção, e a frase diz qual.
 */
function faltaNaCuradoria({ professor, modalidade, tradicao, turmas, alunas }) {
  const falta = [];
  if (!String(professor || '').trim()) falta.push(['professor', 'o professor']);
  if (!String(modalidade || '').trim()) falta.push(['modalidade', 'a modalidade']);
  if (!String(tradicao || '').trim()) falta.push(['tradicao', 'a tradição']);
  const t = (Array.isArray(turmas) ? turmas : [turmas]).map((x) => String(x || '').trim()).filter(Boolean);
  if (!t.length) falta.push(['turma', 'a turma']);
  const a = (Array.isArray(alunas) ? alunas : [alunas]).map((x) => String(x || '').trim()).filter(Boolean);
  if (!a.length) falta.push(['aluna', 'pelo menos uma aluna']);
  return falta;
}

/** A FRASE DA RECUSA — a mesma nas duas rotas e no formulário, para não haver três redações. */
function fraseDaCuradoriaIncompleta(falta) {
  const nomes = falta.map(([, nome]) => nome);
  const onde = [];
  if (falta.some(([campo]) => campo === 'professor')) onde.push('no Professor');
  if (falta.some(([campo]) => campo === 'modalidade')) onde.push('na Modalidade');
  if (falta.some(([campo]) => campo === 'tradicao')) onde.push('na Tradição');
  if (falta.some(([campo]) => campo === 'turma')) onde.push('em Turma (aba Turmas)');
  if (falta.some(([campo]) => campo === 'aluna')) onde.push('nas Alunas (secção Alunas, ou a curadoria anterior)');
  return 'a curadoria não se atribui incompleta — falta ' + nomes.join(', ') + '. ' +
    'A curadoria é o que autoriza o plano de uma turma e declara quem está nela, e por isso ' +
    'os cinco campos são obrigatórios. Preencha ' + onde.join(', ') + ', e atribua depois.';
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
/**
 * O SLUG DO DONO — a PASTA dele. É `PROFESSOR_SLUG` (declarado por quem cria a escola) e só na
 * falta se deriva do nome (17/10/2026).
 *
 * PORQUE É UMA FUNÇÃO (22/10/2026). Este cálculo estava escrito à mão em seis lugares, e cinco
 * deles derivavam do NOME. Enquanto o nome do principal não podia mudar, os seis concordavam por
 * acidente. Quando o «Editar» passou a mudar o nome pelo formulário, a página da Produção — que
 * usava `slugificar(PROFESSOR_NOME)` — passou a procurar as turmas do principal numa pasta que
 * não existe: o nome mudava, e as turmas dele desapareciam da lista. O slug é a pasta; o nome é
 * rótulo. Uma definição, e todos os lugares a usam.
 */
function slugDoDono(env) {
  return String((env && env.PROFESSOR_SLUG) || '').trim()
    || slugificar(String((env && env.PROFESSOR_NOME) || ''));
}

/**
 * A SENHA DE UM PROFESSOR — a regra, num lugar só (25/10/2026).
 *
 * O professor criado pela página vive no secret `SENHA_PROFESSOR`. O SLUG dele é derivado do
 * SECRET (não da sobreposição editável do nome), para a pasta ficar estável — e o seletor envia
 * exactamente esse slug. Os adicionais vivem no KV, com hash e sal; o texto em claro é legado
 * (pré-hash) e aceita-se para não quebrar escolas antigas.
 *
 * UMA SENHA DE UM PROFESSOR NUNCA VALE PARA OUTRO — era esse o vazamento, e é a razão de a
 * função receber o slug: a resposta não é «esta senha existe», é «esta senha é DESTE».
 *
 * A rota `validar-senha` e o bilhete do ato (`/api/bastidores/ato`) perguntam os dois aqui. Duas
 * cópias da regra divergiriam no dia em que uma delas mudasse — e o sintoma seria o pior: uma
 * porta que aceita quem a lista recusou.
 */
async function senhaDoProfessorOk(env, kv, escola, professor, senha) {
  if (!senha) return { ok: false, erro: 'informe a senha' };
  if (!professor) return { ok: false, erro: 'escolha o professor' };

  if (professor === slugDoDono(env)) {
    if (env && env.SENHA_PROFESSOR && senha === env.SENHA_PROFESSOR) {
      const nome = await nomeDoDono(env, kv, escola);
      return { ok: true, nome: (nome || 'professor') };
    }
    return { ok: false, erro: 'senha do professor não reconhecida' };
  }

  const profs = await professores(kv, escola);
  const alvo = profs.find((p) => slugDoProfessor(p) === professor);
  if (!alvo) return { ok: false, erro: 'professor não reconhecido' };
  const confere = alvo.hash
    ? ((await hashSenha(senha, alvo.sal)) === alvo.hash)
    : (alvo.senha === senha);
  return confere
    ? { ok: true, nome: alvo.nome }
    : { ok: false, erro: 'senha do professor não reconhecida' };
}

/* O BILHETE DO ATO — a chave, o alfabeto e a validade. O prefixo é o dos Bastidores porque o KV
 * da escola é um só, e uma chave sem raiz ficaria ao lado das curadorias sem se distinguir. */
const PREFIXO_DO_BILHETE = RAIZ + '/ato/';
const VALIDADE_DO_BILHETE = 10 * 60 * 1000;

/** 32 hex de entropia do `crypto` da plataforma; sem ele, não se emite bilhete nenhum. */
function bilheteAleatorio() {
  const c = (typeof globalThis !== 'undefined' && globalThis.crypto) || null;
  if (!c || typeof c.getRandomValues !== 'function') return null;
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  let t = '';
  for (let i = 0; i < b.length; i += 1) t += b[i].toString(16).padStart(2, '0');
  return t;
}

async function emitirBilheteDoAto(kv, escola, ato) {
  if (!kv || !escola) return null;
  const bilhete = bilheteAleatorio();
  if (!bilhete) return null;
  const registo = {
    fonte: ato.fonte, professor: ato.professor, ciclo: ato.ciclo,
    aluna: ato.aluna, plano: ato.plano,
    expira: Date.now() + VALIDADE_DO_BILHETE,
  };
  try {
    await kv.put(PREFIXO_DO_BILHETE + escola + '/' + bilhete, JSON.stringify(registo),
      { expirationTtl: Math.ceil(VALIDADE_DO_BILHETE / 1000) + 60 });
    return bilhete;
  } catch (erro) { return null; }
}

/**
 * CONSOME — e apaga antes de responder. A ORDEM É DELIBERADA: se o `delete` falhar, o bilhete
 * não é dado por gasto. O contrário entregaria autorização sobre um bilhete que continua válido,
 * e um erro de rede transformaria «uso único» em «uso quantas vezes conseguir».
 */
async function consumirBilheteDoAto(kv, escola, bilhete) {
  if (!kv || !escola || !bilhete || !/^[0-9a-f]{32}$/.test(bilhete)) return null;
  const chave = PREFIXO_DO_BILHETE + escola + '/' + bilhete;
  let bruto = null;
  try { bruto = await kv.get(chave); } catch (erro) { return null; }
  if (!bruto) return null;
  let registo = null;
  try { registo = JSON.parse(bruto); } catch (erro) { registo = null; }
  const expirado = !registo || !registo.expira || Number(registo.expira) < Date.now();
  if (expirado) {
    try { await kv.delete(chave); } catch (erro) { /* já não serve a ninguém */ }
    return null;
  }
  try { await kv.delete(chave); } catch (erro) { return null; }
  return registo;
}

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

/* OS SEIS PASSOS DO VERBETE (31/10/2026 — cinco desde 01/11/2026, seis desde 02/11/2026).
 *
 * A lista vive AQUI, e não dentro do `map` que desenha a tira, porque três coisas dependem
 * dela e não podem discordar: os painéis (`data-passo`), a contagem que `pintarPassos` esconde,
 * e o texto do aviso de edição — que diz em que passo a correcção começa e em que passo
 * continua. Escrito à mão em três lugares, o primeiro a mudar deixaria os outros dois a mentir.
 *
 * PASSARAM A SEIS (02/11/2026). O exercício NOVO — nome, categoria, tradição — deixou de ser um
 * «+» que abria um cadastro por cima do formulário e passou a ser o primeiro passo; tudo o que
 * estava depois desceu um número. A razão é a da pesquisadora: criar o exercício é a primeira
 * coisa que se faz num verbete, e um formulário que não diz isso obriga a descobrir o «+».
 *
 * ERAM SETE, E A PESQUISADORA FUNDIU TRÊS NUM SÓ (01/11/2026). O passo 1 juntou o exercício, a
 * frase e a posição: são as três coisas que se decidem ANTES de haver trecho, e estavam
 * separadas por uma razão que não se sustentou a usar — a frase vem do dicionário quando o
 * exercício é escolhido, e a posição é a mesma lista curta que acompanha esse exercício. Quem
 * começa um verbete responde às três de seguida ou não responde a nenhuma.
 *
 * O que fica de fora do passo 1 é o que muda de trecho para trecho: a MÚSICA (2), o PARA ONDE
 * (3), os SINAIS (4) e a DECOMPOSIÇÃO (5) — que é a leitura do que se escreveu.
 *
 * A FRASE CONTINUA A SER DO EXERCÍCIO, E ESCRITA UMA VEZ (31/10/2026). «O que acontece» era
 * pedido a cada trecho, e quem acrescentava três trechos escrevia três vezes a mesma definição;
 * o texto escreve-se uma vez e cada trecho acrescenta-lhe, abaixo, o «lê-se» da sua notação.
 */
const PASSOS_DO_VERBETE = [
  ['1', 'O exercício novo'],
  ['2', 'O exercício'],
  ['3', 'A música'],
  ['4', 'Para onde'],
  ['5', 'Os sinais'],
  ['6', 'A decomposição'],
];

/* OS DOIS PASSOS POR ONDE A CORRECÇÃO DE UM TRECHO PASSA. É neles que o «!» de edição acende —
 * e são eles, e não outros, porque um trecho se corrige na direção, na contagem, na orientação e
 * nos sinais. A fusão de 01/11/2026 puxou-os de 5 e 6 para 3 e 4: os números são estes, e não os
 * de antes, e é por isso que o aviso de edição e a prova os leem daqui em vez de os escreverem. */
const PASSOS_DO_TRECHO = [4, 5];

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
  // O SLUG É A PASTA — a mesma regra do resto da página. Aqui ele viaja no `?professor=` da
  // porta, que é o valor que o PO e o plano gravam: derivá-lo do nome mandaria o registo para
  // uma pasta que não existe (medido em 17/10/2026, com o dono `tiago` e a pasta `tiago-menegaz`).
  const professor = slugDoDono(env);
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
 * UM GRUPO DO MENU DOS BASTIDORES — a MESMA peça da coluna do sistema (26/10/2026).
 *
 * O menu da Produção era uma lista plana: `<h2>` e `<a>`, tudo à vista. O da Área do Professor
 * é uma coluna com grupos que abrem no `:hover` e empurram os de baixo. A pesquisadora pediu que
 * fossem o mesmo — «ele precisa ter o mesmo comportamento da página principal, não pode ser
 * diferente» —, e a diferença não era de gosto: eram duas peças com dois desenhos.
 *
 * Aqui só se embrulha o dado na marcação que a folha já desenha (`coluna-grupo`, `coluna-titulo`,
 * `coluna-itens`, `coluna-seta`). Quem abre e fecha é o `nav.js` do cliente, que é o mesmo das
 * outras páginas; quem pinta é `tools/templates/ciclo.css`. Nenhum desenho mora nesta função.
 *
 * `data-secao` continua em cada `<a>` — é o que o script das secções lê para marcar a página
 * atual e para dizer, na barra do celular, em que grupo ela está.
 */
function grupoDoMenu(rotulo, itens) {
  const chave = String(rotulo).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return '<div class="coluna-grupo" data-grupo="' + chave + '">' +
    '<button type="button" class="coluna-titulo" aria-expanded="false" ' +
    'aria-controls="g-' + chave + '"><span>' + rotulo + '</span>' +
    '<span class="coluna-seta" aria-hidden="true">\u203a</span></button>' +
    '<div class="coluna-itens" id="g-' + chave + '">' +
    itens.map(([href, secao, nome]) =>
      '<a href="' + href + '" data-secao="' + secao + '">' + nome + '</a>').join('') +
    '</div></div>';
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
function cabecalhoDaVista(titulo, aparencia, teste) {
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
    esc(ap.paleta) + '" data-modo-fonte="escola"' +
    (teste ? ' data-escola-teste="' + Number(teste) + '"' : '') + '>' +
    '<head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + '</title>' +
    // O ÍCONE DA ABA (18/10/2026). Caminho ABSOLUTO porque as vistas dos Bastidores são
    // servidas em rotas com prefixo (`/bastidores/producao`); o arquivo mora em
    // `assets/favicon.svg` do pacote, ao lado da folha, e o roteador de assets do Worker
    // o entrega sem uma rota nova.
    '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">' +
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

function paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs, pares, usosDosEnvelopes, aparencia, turmaEmFoco) {
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
  // A ESCOLA DE TESTE (19/10/2026): o número sai do slug. A página de Produção recebe
  // o atributo e o preenchidor; a de Estúdio não tem formulário e não recebe nada.
  const teste = numeroDoTeste(escola);
  // O ATALHO DA PORTA chega com o NOME da turma (o plano de ensino só conhece o nome). A
  // listagem filtra por ID: a conversão é aqui, com a lista vigente já na mão. Um nome que
  // não casa não vira filtro — uma lista vazia seria pior do que a lista inteira.
  const turmaDoLink = turmaEmFoco ? turmaVigentePorNome(trms, turmaEmFoco) : null;
  const idDaTurmaDoLink = turmaDoLink && turmaDoLink.id ? String(turmaDoLink.id) : '';

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
  // O VALOR É A CHAVE (o que o dado guarda); o TEXTO é o rótulo (o que se lê). Uma tradição que
  // já esteja gravada em maiúsculas — de antes desta regra — casa pela chave e mostra-se pela
  // etiqueta: o `<select>` recebe o valor e o navegador encontra a opção.
  const opcoesProgramaDaTurma = tradicoesAdotaveis().map((t) =>
    '<option value="' + esc(t) + '">' + esc(rotuloDaTradicao(t)) + '</option>').join('');

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
  for (const c of cursVigentes) {
    for (const nome of turmasDaCuradoria(c)) {
      for (const a of (Array.isArray(c.alunas) ? c.alunas : [])) acrescentarTurma(turmasDaAluna, a, nome);
      acrescentarTurma(turmasDoProfessor, c.professor, nome);
    }
  }
  for (const p of (pares || [])) {
    if (p && p.professor) acrescentarTurma(turmasDoProfessor, p.professor, p.turma);
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
  /*
   * O PRINCIPAL TAMBÉM FICA PRESO (22/10/2026). A regra vale para ele como para qualquer um:
   * enquanto é livre, o nome corrige-se; curado ou com plano, não. O botão não desaparece —
   * fica desabilitado com o motivo no `title`, que é o padrão que o «Excluir» já usa nesta
   * lista: um controle apagado sem explicação é o pior dos mundos.
   */
  const oDonoComoProfessor = { nome: donoNome || '', slug: donoSlug };
  const donoCurado = professorCurado(curs, oDonoComoProfessor);
  const presoPorProveniencia = donoCurado || professorVinculadoA(usos, oDonoComoProfessor);
  const motivoDoPreso = professorVinculadoA(usos, oDonoComoProfessor) ? 'plano de ensino' : 'curadoria';
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
      '<span class="acoes">' + (presoPorProveniencia
        ? '<button class="acao secundario pequena" disabled title="' + esc(
          'O nome não se muda: ele já vai nos documentos (' + motivoDoPreso + '). Enquanto a ' +
          'curadoria não gerar plano de ensino, é ela que se remove — e aí o nome volta a poder ' +
          'ser corrigido.') + '">Editar</button>'
        : '<button class="editar acao pequena" data-tipo="dono" data-alvo="' + esc(donoNome) + '" title="Editar o nome do professor principal">Editar</button>') +
      '</span>' +
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
    // O SELO DIZ O ESTADO INTEIRO (22/10/2026). Antes ele só conhecia o plano de ensino, e um
    // professor CURADO aparecia como «livre» — com o «Excluir» à vista, que o servidor recusaria.
    // Um selo que promete o que a guarda não cumpre é pior do que nenhum.
    const curado = professorCurado(curs, p);
    const noPlano = professorVinculadoA(usos, p);
    const profPreso = curado || noPlano;
    const seloProf = noPlano
      ? '<span class="selo vinculada" title="este professor já está num plano de ensino; apagá-lo romperia a proveniência">vinculado</span>'
      : curado
        ? '<span class="selo vinculada" title="este professor já está numa curadoria; enquanto a curadoria não gerar plano de ensino, remova a curadoria para poder mexer nele">curado</span>'
        : '<span class="selo livre" title="este professor ainda está livre: não está em curadoria nem em plano de ensino">livre</span>';
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
          ? '<div class="trio-frase">Esta turma ainda não tem ritmo — e é o ritmo que o plano lê. ' +
            '<b>Sem ele, a turma não pode ser atribuída na curadoria.</b></div>' +
            '<ul class="trio-falta">' + falta.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
            '<p class="trio-nota">Assim que o ritmo estiver completo, a turma passa a poder ser atribuída.</p>'
          : '<div class="trio-grade">' + camposDoRitmo.map(([k, v]) =>
              '<div><span class="trio-k">' + esc(k) + '</span><span class="trio-v">' + esc(v || '—') + '</span></div>').join('') + '</div>';
        // O PAINEL DA RÉGUA É DE LEITURA (18/10/2026). Ele mostra por que rubrica a turma é
        // medida e a escala dela; não edita. A edição da rubrica é uma das três coisas que o
        // «Editar» do cartão da turma abre, no passo 2 — um segundo botão aqui era a
        // duplicação que o dono do produto mandou remover.
        const rubricaLigada = String(t.rubricaId || '');
        const nomeDaRubrica = rubricaLigada && rubricaPorId.get(rubricaLigada)
          ? rubricaPorId.get(rubricaLigada).nome : '';
        const painelRegua = (nomeDaRubrica
          ? '<p class="trio-nota">Medida por <b>' + esc(nomeDaRubrica) + '</b>.</p>' : '') +
          '<div class="trio-escala">' + regua.map((n, i) =>
            '<span class="' + classeDoNivel(n, i, regua.length) + '">' + esc(n) + '</span>').join('') + '</div>';
        // O «EDITAR RUBRICA» QUE VIVIA AQUI SAIU (18/10/2026). A régua continua a abrir e a
        // mostrar a escala — o painel é LEITURA. A edição da rubrica passou a ser uma das
        // três coisas que o «Editar» do cartão da turma abre, e um segundo botão de edição
        // era exatamente a duplicação que o dono do produto mandou remover.
        // Os chips do painel NÃO levam a classe `.chip`: quem os desenha é `.trio-chips span`,
        // na folha. O `.chip` continua a ser da folha de formulário (o bloco `bloco-assoc`), e
        // assim há uma regra para cada contexto em vez de duas a competir pelo mesmo `<span>`.
        const painelConteudos = '<div class="trio-chips">' +
          (chips || '<span class="dono">(nenhum conteúdo associado)</span>') + '</div>';
        // A CAIXA INTEIRA É O CONTROLE (23/10/2026). Era um `<div>` com um `<button class="q">`
        // de 20px dentro: o alvo de toque era o do «?», não o da caixa, e num telefone um alvo de
        // 20px pede pontaria. Agora a caixa É o botão — medido, 48 × 221 px —, e o «?» fica como
        // DESENHO (`aria-hidden`): diz que há mais dentro, e não é ele que se acerta. De caminho
        // sai um botão dentro de outro, que o leitor de ecrã anunciava duas vezes.
        const metrica = (rotulo, valor, qual, dica) =>
          '<button type="button" class="trio-item" data-balao="' + qual + '" aria-expanded="false"' +
          ' aria-label="' + esc(dica) + '">' +
          '<span class="trio-k">' + esc(rotulo) + '</span>' +
          '<span class="trio-v">' + esc(valor) + '</span>' +
          '<span class="trio-q" aria-hidden="true">?</span></button>';
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
          '<div class="trio">' +
          metrica('Ritmo', valorRitmo || '—', 'ritmo', 'ver o ritmo desta turma') +
          metrica('Régua', regua.length === 1 ? '1 nível' : regua.length + ' níveis', 'regua', 'ver a régua desta turma') +
          metrica('Conteúdos', String(associados.length), 'conteudos', 'ver os conteúdos desta turma') +
          '</div>' +
          '<div class="trio-painel" data-painel="ritmo" hidden>' + painelRitmo + '</div>' +
          '<div class="trio-painel" data-painel="regua" hidden>' + painelRegua + '</div>' +
          '<div class="trio-painel" data-painel="conteudos" hidden>' + painelConteudos + '</div>' +
          historico +
          '</li>';
      }).join('')
    : '<li class="vazia">(nenhuma turma cadastrada)</li>';

  // O COMPLEMENTO É UM SÓ, e desce para a segunda linha (18/10/2026). Eram dois `<span
  // class="dono">` separados — categoria e tradição —, e separados eles quebravam onde
  // coubessem: «posição» ficava ao lado do nome e «compartilhada» descia. Agora é um
  // complemento só, com o `·` entre as partes, e ele nunca quebra (a regra das duas
  // linhas, no CSS).
  /* `itensTermos` SAIU COM A LISTA DO VOCABULÁRIO (01/11/2026). Ela desenhava os `<li>` dos
   * termos com os selos «em uso» / «livre» e a coluna das turmas que os usam — a lista que a
   * secção mostrava. Sem a secção não há onde a pôr, e uma variável que se calcula para ninguém
   * é a mentira mais barata que uma página conta a si mesma.
   *
   * O que ela lia continua a existir e a ser usado — `relObj`, `usos`, `termoVinculadoA` (a
   * curadoria e as turmas leem-nos). O `turmasDoTermo` saiu com ela: era o mapa «que turmas usam
   * este termo», e só a lista o lia. A regra «o que já entrou num plano não se apaga» continua
   * aplicada no SERVIDOR (o `DELETE` recusa), que é onde ela vale. */

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
  // A MESMA DERIVAÇÃO DA TURMA E DO VERBETE (02/11/2026): chave no valor, rótulo no texto. A
  // lista é a de `tradicoes.json` — acrescentar CUBANA lá pôs-na aqui, sem tocar nesta linha.
  const opcoesTradicaoCuradoria = tradicoesAdotaveis().map((t) =>
    '<option value="' + esc(t) + '">' + esc(rotuloDaTradicao(t)) + '</option>').join('');
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
          // O RÓTULO, e não a chave crua (02/11/2026). Antes lia-se «francesa · 8A · 12 aluna(s)»;
          // agora lê-se «FRANCESA · 8A · 12 aluna(s)», que é a mesma padronização dos selectores.
          rotuloDaTradicao(c.tradicao),
          turmas.length ? turmas.join(' · ') : '',
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

  return cabecalhoDaVista('Bastidores · Produção · ' + escola, { modo: modo, paleta: paleta }, teste) +
    '<style>' +
    // A IDENTIDADE É A MESMA DA RAIZ («criar nova escola») e do pacote do ciclo: as
    // variáveis vêm de `/assets/style.css` (a folha do ciclo, carregada acima), e o que
    // se escreve aqui só as usa. O amarelo próprio (`#fdf6e3`) que existia só neste
    // formulário SAI: era um terceiro tom, e não o fundo dos formulários do sistema.
    // A MESMA COLUNA DO SISTEMA (26/10/2026). Aqui estavam cinco regras próprias — `h2` em
    // versalete, links em bordô sobre o papel, hover cinza —, e o resultado era um menu que
    // não se parecia com o do resto do produto. Saíram. O que fica é o que é do LUGAR (a
    // posição, a largura, a altura), e o desenho vem de `.coluna-grupo`/`.coluna-titulo`/
    // `.coluna-itens`, desenhados uma vez em `tools/templates/ciclo.css`.
    //
    // A ALTURA É A DA JANELA porque a coluna do sistema também o é: um painel que acaba a meio
    // da página lê-se como um cartão, e não como o menu da casa.
    //
    // E O MENU FICA CONGELADO, A PÁGINA ANDA (26/10/2026, refeito no mesmo dia).
    //
    // A PRIMEIRA TENTATIVA FOI `sticky`, E NÃO PODIA FUNCIONAR — e a razão é de facto: um
    // elemento `sticky` só se desloca DENTRO da caixa do seu contentor. Aqui o contentor é a
    // área da grade (`.corpo`), e a altura dessa área é a do conteúdo. Medido na página real do
    // «Painel inicial», que é paginada: `.corpo` = 700px, a `lateral` = 700px. Zero de percurso.
    // O `sticky` ficava parado em relação ao documento, e rolava com ele — que é exactamente o
    // que se via. Na página de Turmas acontece o mesmo por outra via: a listagem rola DENTRO de
    // si (`.col-lista .rolagem`), a página quase não cresce, e a área da grade também não.
    //
    // A COLUNA DO SISTEMA ACERTA PORQUE É `fixed` — e é isso que se copia aqui. `fixed` não
    // depende de altura nenhuma: encosta na janela e fica. O preço é que a `lateral` deixa de
    // ocupar a célula da grade, e a coluna que ela ocupava passa a ser reservada no `padding` do
    // `.corpo` — mesma geometria, outro mecanismo.
    '.lateral{position:fixed;left:0;top:var(--header-height);bottom:0;width:11rem;z-index:15;' +
    'padding:var(--esp-4) var(--esp-3) var(--esp-5);' +
    'background:var(--marca-fundo);color:var(--sobre-marca);border-right:3px solid var(--ornamento-forte);' +
    'overflow-y:auto;}' +
    '.lateral .lateral-voltar{margin:0 0 var(--esp-3);}' +
    // A BARRA E A FOLHA DO CELULAR existem no HTML e ficam OCULTAS na tela larga: o menu
    // em coluna continua a ser o de sempre, e nada disto aparece. São o MESMO elemento que
    // vira folha no celular (`.lateral-lista`) — não há uma segunda lista para envelhecer.
    '.lateral-barra,.lateral-veu{display:none;}' +
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
    // A COLUNA DO MENU PASSA A SER RESERVADA AQUI (26/10/2026). Como a `lateral` é `fixed`, ela
    // já não ocupa a célula da grade — a grade fica com UMA coluna, e a faixa do menu é paga no
    // `padding-left`: 11rem (a largura do menu) + os dois espaçamentos que separavam as colunas
    // (o `esp-4` de padding e o `esp-5` do `gap`). É a MESMA geometria de antes, medida: o
    // conteúdo começava a 216px, e continua a começar (medido na página real, antes e depois).
    '.corpo{display:grid;grid-template-columns:minmax(0,1fr);align-items:start;' +
    'padding:var(--esp-5) var(--esp-4) var(--esp-6) calc(11rem + var(--esp-4) + var(--esp-5));}' +
    // A PÁGINA QUE CABE NA TELA NÃO ROLA (26/10/2026). «Eu não sei o que que está gerando o scroll
    // vertical, porque eu estou numa página que não tem elemento suficiente para ter um scroll.»
    // Era isto: o `body` da folha reserva 40px de padding em baixo, para o texto de um documento
    // não encostar na borda. Numa página de trabalho, que já tem o seu próprio respiro (o
    // `esp-6` do `.corpo`), esses 40px sobram e viram uma barra de rolagem de 40px numa página
    // que cabe inteira — e um menu `sticky` andava esses 40px com ela.
    'body:has(.corpo){padding-bottom:0;}' +
    '.secao{display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
    // O ACORDEÃO DAS SECÇÕES DE UMA COISA SÓ (18/10/2026). O título é o cabeçalho — não há
    // barra de passos para preservar, e inventar um segundo título seria duplicar o que já
    // está escrito. A seta fica AO LADO do nome, e não na outra ponta da linha: é dele que
    // ela é, e a 968px de distância parecia pertencer à página.
    '.secao-titulo{grid-column:1/-1;display:flex;align-items:flex-start;gap:.55rem;margin:0;min-width:0;}' +
    '.secao-nome{min-width:0;}' +
    // A SETA ALINHA COM A PRIMEIRA LINHA (18/10/2026). Centrada no bloco (`align-items:center`)
    // ela caía ENTRE as duas linhas quando o título quebrava — «Vocabulário Técnico do Balé»
    // em 360px — e não se sabia de que linha ela era. Ancorada no topo com o degrau que a
    // centra numa linha só (42px de caixa, 32 de seta: 5px em cima e 5px em baixo), ela lê-se
    // igual com uma linha e com duas.
    '.secao-titulo>.alternar-form{margin-top:.3rem;}' +
    // RECOLHIDO, A LISTAGEM OCUPA A LARGURA TODA. A coluna do formulário deixa de existir
    // como coluna — é a diferença entre «encolher» e «sair da frente», a mesma regra das
    // turmas. O estado vive na `.secao` porque é ELA que tem a grade, e uma grade não se
    // muda a partir do filho.
    '.secao[data-recolhido="sim"]{grid-template-columns:minmax(0,1fr);}' +
    '.secao[data-recolhido="sim"]>.col-form{display:none;}' +
    '.secao[data-recolhido="sim"]>.secao-titulo{border-bottom:1px solid var(--borda-campo);' +
    'padding:0 0 .35rem;}' +
    '.secao>h2{grid-column:1/-1;margin:0;}' +
    // AS ABAS da secção Turmas. O painel de cada aba repete a grade do formulário + lista, e
    // por isso ocupa a linha inteira do `.secao` — a lista continua presa e paginada.
    '.passos{grid-column:1/-1;list-style:none;display:flex;flex-wrap:wrap;align-items:center;gap:.25rem .4rem;margin:.2rem 0 .4rem;padding:0;}' +
    // O `hidden` PRECISA DE UMA REGRA PRÓPRIA AQUI (01/11/2026). O `[hidden]` do navegador é
    // `display:none` — mas a regra de autor vence SEMPRE a do navegador, independentemente da
    // especificidade, e `.passos{display:flex}` deixava visível uma tira que o script mandava
    // esconder. A tira do verbete passou a sair no modo do exercício (ver `pintarPassos`), e sem
    // esta linha ela ficava a navegar um formulário que já não está lá.
    '.passos[hidden]{display:none;}' +
    '.passos>li{display:flex;align-items:center;gap:.4rem;}' +
    // O CONECTOR entre os passos é do desenho, não do conteúdo: um traço que só existe
    // entre um passo e o seguinte, e nunca antes do primeiro.
    '.passos>li+li::before{content:"";width:1.1rem;height:1px;background:var(--borda-campo);}' +
    '.passo{display:inline-flex;align-items:center;gap:.5rem;background:transparent;border:1px solid transparent;' +
    'border-radius:999px;margin:0;padding:.32rem .8rem .32rem .38rem;color:var(--texto-suave);' +
    'font:600 .92rem/1.3 var(--ui);cursor:pointer;}' +
    '.passo:hover:not(:disabled){background:var(--fundo-hover);color:var(--marca-texto);}' +
    // O PASSO QUE AINDA NÃO SE ABRE (02/11/2026). O `disabled` é do atributo, e a folha diz o
    // que ele quer dizer: esbatido, e sem o `cursor` de quem pode clicar. Sem esta regra o passo
    // fechado parecia igual aos outros, porque `.passo` não é um `button` do tema.
    '.passo:disabled{opacity:.45;cursor:not-allowed;}' +
    // O NÚMERO é o que diz que isto é uma sequência. Redondo, e não um traço ao lado do
    // texto — um traço lê-se como decoração; um número lê-se como ordem.
    '.passo .passo-n{display:grid;place-items:center;width:1.4rem;height:1.4rem;border-radius:999px;' +
    'background:var(--fundo-faixa);border:1px solid var(--borda-campo);color:var(--marca-texto);font:700 .74rem/1 var(--ui);}' +
    '.passo.ativo{background:var(--superficie);border-color:var(--borda-campo);color:var(--marca);' +
    'box-shadow:var(--sombra-controle, none);}' +
    '.passo.ativo .passo-n{background:var(--marca-fundo);border-color:var(--marca-fundo);color:var(--sobre-marca);}' +
    '.passo:focus-visible{outline:2px solid var(--foco);outline-offset:2px;}' +
    // O CORPO DA SECÇÃO TURMAS: a faixa dos passos na linha de cima, e o formulário do passo
    // à esquerda com a listagem à direita na linha de baixo. A listagem vive FORA dos
    // `.passo-painel`, e é isso que a mantém a mesma nos três passos.
    '.turmas-corpo{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
    '.turmas-form{min-width:0;}' +
    // A FAIXA É A PRIMEIRA LINHA DO CORPO (01/11/2026). Os três passos deixaram de viver na
    // coluna do formulário — «os steps não vão ser posicionados apenas sobre o formulário […] vão
    // ficar num bloco acima, abaixo do título, mas acima do formulário e dos exercícios». A
    // largura toda é esta linha: o corpo é a grelha, e a faixa atravessa-a de ponta a ponta.
    '.turmas-faixa{grid-column:1/-1;display:flex;align-items:center;gap:.1rem;min-width:0;}' +
    // UMA LINHA, SEMPRE (18/10/2026). A lista quebrava em duas assim que não cabia. Agora ela
    // NÃO quebra: quem cede é o rótulo de cada passo (reticências). A seta já não está aqui —
    // subiu ao título (01/11/2026) —, e com ela foram as duas regras que a encolhiam no
    // telefone.
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
    // de existir como coluna, e a lista fica sozinha abaixo da faixa. É a diferença entre
    // «encolher» e «sair da frente» — e é o que faz o filtro valer a pena no telefone e na
    // tela grande.
    //
    // O FILETE PASSOU PARA O TÍTULO (01/11/2026). Ele estava debaixo da faixa porque a faixa
    // era o cabeçalho do acordeão; agora o cabeçalho é o título, e é ele que leva o filete
    // pela mesma regra das outras quatro secções (`.secao[data-recolhido="sim"]>.secao-titulo`).
    '.turmas-corpo[data-recolhido="sim"]{grid-template-columns:minmax(0,1fr);}' +
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
    '}' +
    // EM 320px NÃO SOBRA NADA (18/10/2026): com o tipo de .84rem os três rótulos ficavam a
    // 2–3px de caber e as reticências comiam a última letra. Um degrau a menos no tipo — e não
    // um passo a menos na frase — resolve; a sequência continua a ler-se por inteiro.
    '@media (max-width:380px){' +
      '.turmas-faixa .passos{gap:.1rem;}' +
      '.turmas-faixa .passo{padding:.26rem .3rem .26rem .24rem;font-size:.8rem;}' +
      '.turmas-faixa .passo .passo-n{width:1.15rem;height:1.15rem;font-size:.66rem;}' +
    '}' +
    // O PAINEL DO PASSO já não tem grade própria: quem alinha formulário e lista é o
    // `.turmas-corpo`. Ele agora só existe/desaparece — o conteúdo é o formulário do passo.
    '.passo-painel{grid-column:1/-1;min-width:0;}' +
    // A TIRA DO VERBETE CABE EM 320px (31/10/2026, revista a 01/11/2026). Cada passo diz o
    // rótulo E o valor — o dobro do que a faixa da turma carrega. As travas são as MESMAS que a
    // faixa da turma já usa (`min-width:0` em cada elo da cadeia, e reticências no rótulo): sem
    // elas o botão não encolhe, e a tira empurra a página para lá do ecrã. Desde a fusão são
    // cinco passos em vez de sete.
    '#vb-tira{min-width:0;}' +
    '#vb-tira>li{flex:0 1 auto;min-width:0;max-width:100%;}' +
    '#vb-tira .passo{min-width:0;max-width:100%;}' +
    '#vb-tira .passo-t{max-width:7.5rem;}' +
    '#vb-tira .passo-alerta{flex:0 0 auto;}' +
    // O VALOR É DO PASSO EM QUE SE ESTÁ (01/11/2026). A tira passou a atravessar a secção
    // inteira — já não vive na coluna de 34rem —, e os cinco passos, cada um com rótulo E
    // valor, mediam 1262px de conteúdo para 1048px de secção. Uma linha só não cabia, e
    // cortar os valores com reticências cortava também o que eles dizem.
    //
    // O que se mostra é o valor do passo ACTIVO. O rótulo de cada passo é a navegação e está
    // sempre inteiro («A música», «Para onde»); o valor é o resumo do que já está decidido, e
    // lê-se inteiro no passo em que se está — que é precisamente o passo cuja decisão se está
    // a tomar. É o mesmo princípio que fez a tira nascer: ela diz ONDE SE ESTÁ.
    //
    // E ASSIM ELA CABE NUMA LINHA: cinco rótulos curtos em vez de cinco pares. Na tela larga
    // não quebra (`nowrap`); abaixo de 1141px — onde a própria página deixa de ter duas
    // colunas — volta a quebrar, porque aí nem os rótulos cabem numa linha só.
    '#vb-tira .passo-t[id^="vb-v"]{display:none;}' +
    '#vb-tira .passo.ativo .passo-t[id^="vb-v"]{display:inline;}' +
    // O RÓTULO NÃO CEDE; QUEM CEDE É O VALOR. O nome do passo é a navegação — cortado, deixa
    // de se saber onde se está —, e o valor é o resumo, que se lê no passo aberto.
    '#vb-tira .passo-t{flex:0 0 auto;}' +
    // O VÃO ENTRE O NÚMERO, O RÓTULO E O VALOR É MENOR AQUI (01/11/2026). São três peças por
    // passo, e o vão de meio rem de cada uma custava 16px nos cinco — exactamente a folga que
    // faltava para o valor do passo activo caber inteiro a 1141px. Quatro décimos continuam a
    // separar as três coisas, e a tira fica com a folga de volta.
    '#vb-tira .passo{gap:.4rem;}' +
    // E O VALOR DO PASSO ACTIVO NÃO TEM O TECTO DE 7.5rem DOS OUTROS: ele é o único à vista,
    // e é o que a pessoa está a decidir. O tecto continua a valer para o rótulo, que é curto.
    '#vb-tira .passo.ativo .passo-t[id^="vb-v"]{flex:0 1 auto;min-width:0;max-width:none;}' +
    // Uma linha só na tela larga. O corte é o da folha: 1140px é onde a página deixa de ter
    // duas colunas.
    '@media (min-width:1141px){' +
      '#vb-tira{flex-wrap:nowrap;}' +
    '}' +
    // A SECÇÃO DOS VERBETES VOLTOU AO PADRÃO (01/11/2026). A 31/10/2026 ela passou a uma coluna
    // porque a tira tinha sete passos e precisava da largura toda: aqui a coluna de 34rem partia
    // a tira em três linhas. A fusão resolveu a causa — cinco passos, e cada um diz menos —, e a
    // secção volta a ser o que é em todas as outras: formulário à esquerda, listagem à direita,
    // presa, que é o que a pesquisadora pediu («o formulário vai voltar a ser o padrão… da mesma
    // forma que a gente já faz com a turma»). Sem regra nenhuma, porque o padrão é a `.secao`.
    // E OS BOTÕES DA NAVEGAÇÃO NÃO FICAM ÓRFÃOS: eles são o rodapé do formulário, e é no
    // formulário que continuam.
    // AS ETIQUETAS DA LISTAGEM PODEM OCUPAR DUAS LINHAS. A regra das duas linhas trava o
    // complemento numa só, com reticências (`nowrap`), porque nas outras listas ele é uma
    // palavra ou duas. Aqui ele é a POSIÇÃO, as DIREÇÕES, o COMPASSO e a contagem de trechos —
    // e truncá-lo esconderia exactamente o que ela pediu para ver.
    '#lista-verbetes .nome .dono{white-space:normal;overflow:visible;}' +
    // O NOME DA LISTAGEM É UM BOTÃO, E VESTE-SE DE NOME (31/10/2026). Ele abre o verbete no
    // formulário — é uma ação, e por isso é `<button>` e não link. Sem desenho, saía com a
    // pastilha cinzenta do navegador, ao lado de selos de 12px: parecia um controle de formulário
    // perdido numa lista. O desenho é o do `.nome-link` (o nome sublinhado, a cor do texto, o
    // sublinhado da marca ao passar) — a mesma peça, aplicada ao botão.
    '#lista-verbetes .nome .linha1 > button{flex:0 1 auto;min-width:0;margin:0;padding:0;' +
    'background:none;border:0;font:inherit;color:inherit;text-align:left;cursor:pointer;' +
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:underline;' +
    'text-decoration-color:var(--borda-campo);text-underline-offset:.15em;}' +
    '#lista-verbetes .nome .linha1 > button:hover{color:var(--marca);' +
    'text-decoration-color:currentColor;}' +
    '#lista-verbetes .nome .linha1 > button:focus-visible{outline:2px solid var(--foco);' +
    'outline-offset:2px;border-radius:2px;}' +
    // A COLUNA DA LISTA: começa no topo e vai até o fim do que se vê, sem rolar a página.
    // Quem rola é a lista, por dentro, e a paginação existe para que nem isso precise.
    '.col-lista{display:flex;flex-direction:column;position:sticky;top:calc(var(--header-height) + 8px);' +
    'max-height:calc(100vh - var(--header-height) - 2.2rem);border:1px solid var(--borda-campo);' +
    'background:var(--superficie);border-radius:var(--raio-3);padding:.9rem 1rem .6rem;}' +
    '.col-lista h3{margin:0 0 .5rem;}' +
    '.col-lista .rolagem{overflow-y:auto;min-height:0;flex:1 1 auto;}' +
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
    // ---- A LINHA DA LISTA NO TELEFONE: DUAS LINHAS, O ESTADO EMBAIXO (18/10/2026) ------
    //
    // Na tela larga a linha é uma fita: nome e selo à esquerda, as turmas ao centro, o botão
    // à direita — e lê-se bem, porque há largura para os três. A 360px a mesma fita parte-se
    // ao meio SEM regra: medido, o nome ficava com 182px, o botão das turmas descia para a
    // direita do nome e o «Excluir» caía sozinho numa terceira linha, à esquerda, por baixo
    // do nome — sem alinhamento nenhum com nada.
    //
    // Agora são DUAS linhas ordenadas: o NOME em cima, sozinho, e por baixo o ESTADO (o selo
    // «livre»/«vinculada»), a COLUNA das turmas e o BOTÃO. É a leitura do que a linha diz: a
    // quem pertence, em que estado está, a que turmas vai, e o que se pode fazer com ela.
    //
    // A PEÇA É A MESMA DAS DUAS LISTAS — alunas e termos cadastrados partilham esta marcação
    // (nome + selo + turmas + ações), e por isso a regra é uma só. Uma lista com duas linhas e
    // a outra com três seria a mesma linha contada de duas maneiras.
    //
    // O `display:contents` é o que faz isto sem tocar na marcação: `.nome` e `.linha1` são
    // INVÓLUCROS (existem para o `flex` da tela larga), e dissolvidos no telefone os seus
    // filhos passam a ser itens da grelha da LINHA — é assim que o selo sai de dentro do
    // `.linha1` e desce para a segunda linha sem um `<div>` novo e sem duplicar marcação. Em
    // CSS, um neto não se coloca numa faixa da grelha do avô; dissolver o pai, sim.
    //
    // A TERCEIRA FAIXA É OPCIONAL (`dono`): os termos e as curadorias trazem um complemento
    // («posição · francesa», «atribuída em 16/10») e as alunas não. Sem item, a faixa tem zero
    // de altura e sobra só o vão — que é o respiro entre o nome e o resto, e não um buraco.
    '@media (max-width:560px){' +
      '.lista>li:not(.turma):not(.vazia){display:grid;' +
        'grid-template-columns:auto minmax(0,1fr) auto;' +
        'grid-template-areas:"nome nome nome" "dono dono dono" "estado turmas acoes";' +
        'align-items:center;gap:.2rem .5rem;padding:.45rem .1rem;}' +
      '.lista>li:not(.turma)>.nome,.lista>li:not(.turma)>.nome>.linha1{display:contents;}' +
      // O nome ocupa a faixa inteira e, se for comprido, encurta com reticências — nunca
      // empurra o estado nem o botão, que estão na faixa de baixo.
      '.lista>li:not(.turma)>.nome>.linha1>b{grid-area:nome;min-width:0;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      // O selo alinha à ESQUERDA da sua faixa: é o primeiro item da segunda linha, e é ele
      // que dá o «x» da coluna ao que vem depois.
      '.lista>li:not(.turma)>.nome>.linha1>.selo{grid-area:estado;justify-self:start;}' +
      '.lista>li:not(.turma)>.nome>.dono{grid-area:dono;min-width:0;}' +
      '.lista>li:not(.turma)>.turmas-do-nome{grid-area:turmas;max-width:none;justify-content:flex-start;}' +
      '.lista>li:not(.turma)>.acoes{grid-area:acoes;justify-self:end;}' +
    '}' +
    // O AVISO DO FILTRO, no topo da listagem de Turmas: diz de quem são as turmas que
    // sobraram e oferece o caminho de volta sem pedir nada ao servidor.
    '.filtro-turmas{margin:0 0 .55rem;padding:.45rem .6rem;border:1px solid var(--borda-campo);' +
      'border-left:3px solid var(--marca);border-radius:var(--raio-1);background:var(--fundo-faixa);' +
      'font-size:.85rem;line-height:1.5;color:var(--texto);}' +
    '.filtro-turmas .limpar-filtro{margin:0 0 0 .35rem;}' +
    '.lista li.vazia{color:var(--texto-suave);font-size:.9rem;}' +
    // O FORMULÁRIO: o mesmo papel branco do «criar nova escola», e os campos no creme.
    'form{border:1px solid var(--borda-campo);background:var(--superficie);border-radius:var(--raio-3);padding:1rem 1.1rem;margin:0 0 1rem;}' +

    'label .dica{color:var(--texto-suave);font-weight:400;font-size:.85rem;}' +
    '.sub{color:var(--texto-suave);font-size:.88rem;line-height:1.45;margin:.1rem 0 .6rem;}' +
    // O «CARREGAR CATÁLOGO INICIAL» NÃO CABIA NO TELEFONE (18/10/2026). O botão base da folha
    // é `white-space:nowrap` — decisão certa para «Avançar» e «Cancelar», e errada para um
    // rótulo de 47 caracteres: em 320px ele media 367px dentro de uma coluna de 288, e a
    // PÁGINA inteira passava a rolar de lado (63px de estouro). O botão passa a poder quebrar
    // e a caber na coluna; a altura cresce em vez da largura, que é o que se quer num rótulo.
    '#semear{max-width:100%;white-space:normal;overflow-wrap:break-word;}' +
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
    // O TRIO SAIU DAQUI (23/10/2026). As regras de `.metricas`, `.metrica`, `.painel` e `.escala`
    // viviam nesta página, inline — e enquanto vivessem aqui, usá-las noutra lista seria copiá-las.
    // Passaram a `tools/templates/ciclo.css` como uma peça só, com nomes `trio-*`: a lista de
    // turmas (aqui) e a lista de planos do ciclo (a montagem do site) usam a MESMA peça.
    // O que fica nesta camada é o que é da PÁGINA — a grade das secções, o passo, a faixa.
    // O BLOCO DE CONTEÚDOS DO FORMULÁRIO (18/10/2026): os chips da turma com o «×», e o
    // seletor com o botão que associa. O chip e o par são os MESMOS do painel — mudam de
    // sítio e de papel (aqui compõem), não de desenho.
    // OS DOIS BLOCOS DO PASSO 3. `<fieldset>` porque são dois GRUPOS de controles com um
    // título cada — e o `<legend>` é o que um leitor de ecrã anuncia antes de cada um. O
    // desenho do fieldset é zerado e refeito, senão vinha o do navegador.
    '.bloco-assoc{border:1px solid var(--borda-campo);border-radius:var(--raio-2);' +
    'padding:.7rem .8rem .8rem;margin:0 0 1rem;min-width:0;}' +
    '.bloco-assoc>legend{padding:0 .4rem;font:700 .82rem/1.3 var(--ui);color:var(--marca-texto);}' +
    // O CHIP DO FORMULÁRIO. Ele é desta camada porque só aqui existe: os chips do painel do
    // cartão passaram a `.trio-chips span` (na folha), e uma regra só para cada contexto é
    // melhor do que duas a competir pelo mesmo `<span>`.
    '.chip{display:inline-block;margin:0;padding:.1rem .45rem;background:var(--fundo-faixa);' +
    'border:1px solid var(--borda-campo);border-radius:var(--raio-pilula);font-size:.82rem;color:var(--texto);}' +
    // O SINAL MARCADO PARA TROCA (02/11/2026). Ele é o alvo do próximo clique na paleta, e tem de
    // se ver qual é: sem marca, trocar o sinal número 3 de doze é escolher às cegas. Usa as cores
    // de estado que a folha já tem — `--alerta-fundo` é o âmbar de «falta aqui», e é isso que a
    // ficha diz enquanto espera.
    '.chip[data-trocar]{cursor:pointer;}' +
    '.chip.em-troca{background:var(--alerta-fundo);border-color:var(--marca-texto);' +
    'outline:2px solid var(--marca-texto);outline-offset:1px;}' +
    '.bloco-assoc .chips{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;min-height:1.7rem;margin:.1rem 0 .55rem;}' +
    // A PEÇA É UMA SÓ (28/10/2026). Ela estava escopada a `.bloco-assoc`, e por isso o «+» do
    // exercício — que precisa do mesmo arranjo, seletor largo e botão colado — teria de
    // inventar uma segunda. `par-associar` já é o nome dela na folha (o `> button` com
    // `margin-top: 0` está lá desde 18/10/2026); o que faltava aqui era a colocação, e agora
    // é a mesma para os dois sítios.
    '.par-associar{display:flex;align-items:center;gap:.35rem;min-width:0;}' +
    '.par-associar select{flex:1 1 auto;min-width:0;max-width:none;}' +
    '.par-associar button{flex:0 0 auto;}' +
    '.par-botoes{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:.55rem 0 0;}' +
    // O QUE FALTA, DITO: uma nota âmbar discreta, ao lado do botão que está travado.
    '.nota-pendencia{margin:.5rem 0 0;padding:.4rem .6rem;border-radius:var(--raio-1);' +
    'background:var(--alerta-fundo);border:1px solid var(--borda-campo);' +
    'font:400 .84rem/1.4 var(--ui);color:var(--texto);}' +
    // O PASSO TRAVADO NÃO PARECE MORTO: fica esbatido, e o `title` diz o que falta.
    // O BOTÃO DE ASSOCIAR É DESTA PÁGINA, e não da peça do trio: acompanha o seletor de termos.
    // A PAGINAÇÃO SAIU DAQUI (23/10/2026): virou peça da folha, porque a lista de aulas da
    // publicação também pagina — e a checagem «Forma» recusaria a segunda declaração.
    '.associar{flex:0 0 auto;}' +
    // A VOLTA AO SISTEMA. Ela é o primeiro item da lista de secções, e não um botão à parte: é
    // navegação, e o desenho é o dos pares dela — o que muda é a cor, mais baça, porque não é
    // uma secção desta página.
    // A COR PASSOU A SER A DA COLUNA (26/10/2026): ouro-claro sobre o bordô, como a marca do
    // sistema no alto da `.coluna`. O `--texto-suave` era legível no papel e desaparecia aqui.
    '.lateral-voltar{display:block;padding:6px 10px 10px;margin:0;' +
    'border-bottom:1px solid var(--ornamento);font:700 12px/1.2 var(--ui);letter-spacing:.06em;' +
    'text-transform:uppercase;color:var(--ornamento-forte);text-decoration:none;}' +
    '.lateral-voltar:hover,.lateral-voltar:focus-visible{color:var(--sobre-marca);}' +
    '.passo:disabled{opacity:.45;cursor:not-allowed;}' +
    '.passo:disabled:hover{background:transparent;color:var(--texto-suave);}' +
    'button:disabled.acao{cursor:not-allowed;}' +
    '.par-botoes button{margin:0;}' +
    // O `hidden` DO ATRIBUTO NÃO BASTA NUMA COLUNA DE FORMULÁRIO. `#prof-senha` embrulha dois
    // elementos que a folha desenha (`label.campo-rotulo` é `display:block`, e o `input` tem
    // regra própria) — e uma regra de autor vence o `display:none` que o atributo traz. Sem
    // esta linha, a senha continuaria à vista no modo de edição.
    '#prof-senha[hidden]{display:none;}' +
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
    // A ESCALA DA RÉGUA também subiu para a folha (`.trio-escala`).
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
      // NO CELULAR A COLUNA VIRA A BARRA + A FOLHA (não a coluna escura): a barra diz onde se
      // está e o «Seções» abre a folha. Sem fundo e sem filete — o fundo escuro é da coluna.
      // `width: auto` e `z-index: auto` desfazem o que a tela larga impôs (26/10/2026): sem eles
      // a barra do celular continuaria com os 11rem do menu lateral, e um `z-index` a competir
      // com a folha que sobe de baixo.
      '.lateral{position:static;width:auto;height:auto;min-height:0;margin:0;z-index:auto;' +
        'border-right:none;background:none;color:inherit;overflow:visible;padding:0 0 var(--esp-3);}' +
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
      // O BOTÃO É A PÍLULA DA FOLHA, e não uma segunda pílula igual a ela (26/10/2026): o
      // desenho mora em `.pilula-do-menu`, em `tools/templates/ciclo.css`. Aqui fica só o
      // lugar — à direita, na barra.
      '.lateral-abrir{margin-left:auto;flex:0 0 auto;}' +
      // A FOLHA: lugar e transição. A identidade (fundo bordô, canto, sombra, pegador) é a de
      // `.folha-do-menu`/`.folha-puxador` — a mesma da navegação do ☰ e do menu «Ações».
      // As regras dos grupos e dos itens que aqui estavam (h2, a, ✓) saíram: são as
      // `.coluna-titulo`/`.coluna-itens` da folha, que é o que faz os três menus serem um.
      '.lateral-lista{position:fixed;left:0;right:0;bottom:0;z-index:60;overflow-y:auto;' +
        'transform:translateY(101%);transition:transform .22s ease;}' +
      '.lateral[data-aberta="sim"] .lateral-lista{transform:translateY(0);}' +
      '.lateral-veu{display:block;position:fixed;inset:0;z-index:55;' +
        'background:var(--veu);opacity:0;pointer-events:none;' +
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
    /* O MENU DOS BASTIDORES É O MESMO DO SISTEMA (26/10/2026).
     *
     * «Quando eu vou em bastidores, em produção, o menu lateral tem uma outra identidade visual e
     * um outro comportamento. Ele precisa ter o mesmo comportamento da página principal, não pode
     * ser diferente.»
     *
     * E era outro, em tudo: a lista era plana (`<h2>` + `<a>`, sete destinos à vista), clara sobre
     * o papel, sem grupos, sem seta, sem acordeão. A coluna do sistema — `.coluna`, em
     * `motor/nucleo/nav.js` — é bordô, com grupos que abrem no `:hover` e empurram os de baixo.
     *
     * A ESTRUTURA PASSA A SER A MESMA, e as classes também: `coluna-grupo` / `coluna-titulo` /
     * `coluna-itens` / `coluna-seta`. É o que faz a identidade ser uma só, e não duas parecidas —
     * a folha (`tools/templates/ciclo.css`) desenha os dois com as mesmas regras.
     *
     * O `lateral` guarda o que continua a ser dele: a barra do celular (grupo · página · botão
     * «Seções») e a folha onde a lista sobe. As funcionalidades não mudaram: os mesmos grupos, os
     * mesmos destinos, e cada `<a>` continua a levar `data-secao`, que é o que o script lê.
     */
    '<nav class="lateral" aria-label="Seções da Produção" data-aberta="nao">' +
    // A barra do celular: o grupo e a página em que se está, e o botão que abre a folha.
    // Em tela larga ela não aparece — quem navega é a coluna abaixo.
    '<div class="lateral-barra">' +
    '<span class="lateral-atual"><small id="lateral-grupo">Produção</small>' +
    '<span id="lateral-nome">Painel inicial</span></span>' +
    '<button type="button" class="lateral-abrir pilula-do-menu" id="lateral-abrir" ' +
    'aria-expanded="false" aria-controls="lateral-lista">Seções<span class="seta-do-ato" ' +
    'aria-hidden="true">\u25be</span></button>' +
    '</div>' +
    '<div class="lateral-lista folha-do-menu" id="lateral-lista">' +
    '<span class="folha-puxador" aria-hidden="true"></span>' +
    /* A VOLTA AO SISTEMA (23/10/2026). Os Bastidores deixaram de desenhar a coluna do sistema:
       eles têm ESTA, e duas colunas lado a lado diziam duas coisas diferentes sobre onde se
       está. O preço é não haver menu do sistema nesta página — e o preço paga-se aqui, com um
       caminho de volta explícito no alto da lista, e não com a marca da barra (que também
       leva a `/`, mas ninguém a lê como «voltar»). */
    '<a class="lateral-voltar" href="/">&larr; Sistema Lastro</a>' +
    grupoDoMenu('Produção', [['#painel', 'painel', 'Painel inicial']]) +
    // A APARÊNCIA ENTRA EM PRODUÇÃO (18/10/2026): a preferência é da escola (C15), e é aqui
    // que só a escola e o professor principal chegam. O grupo é «Configuração» porque não é
    // pedagogia nem pessoa — é a forma da casa.
    grupoDoMenu('Configuração', [['#aparencia', 'aparencia', 'Aparência']]) +
    grupoDoMenu('Pessoas', [['#professores', 'professores', 'Professores'],
      ['#alunas', 'alunas', 'Alunas']]) +
    grupoDoMenu('Pedagogia', [['#turmas', 'turmas', 'Turmas'],
      ['#verbetes', 'verbetes', 'Verbetes da notação'],
      ['#curadorias', 'curadorias', 'Curadorias']]) +
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
    tituloComAcordeao('sec-professores', 'Professores', 'professores-miolo') +
    '<div class="col-form" id="professores-miolo">' +
    // UM FORMULÁRIO, DOIS ATOS (22/10/2026). O «Editar» do professor principal abria um
    // `prompt()` do navegador — a janelinha que parece um alert, com o nome num campo de uma
    // linha e sem nada em volta. O ato é o mesmo dos outros: muda-se um nome num formulário e
    // grava-se. Então o próprio formulário do cadastro serve à edição: o «Editar» preenche os
    // campos, o botão passa a dizer o que vai fazer, e o «Cancelar» volta ao cadastro. A senha
    // sai de cena — o nome do principal não se muda por senha nova (`/api/bastidores/dono` só
    // grava a sobreposição de exibição; a senha dele é do secret).
    '<form id="form-prof">' +
    // O MODO É DECLARADO NO FORMULÁRIO, e não numa variável solta: o estado que a tela mostra
    // está na tela. Vazio = cadastrar; `dono` = editar o nome do professor principal.
    '<input type="hidden" id="prof-modo" value="">' +
    '<p class="sub" id="prof-nota" hidden>Editando o nome do <b>professor principal</b>. A senha ' +
    'dele não muda por aqui, e a pasta dele continua a mesma — só o nome que aparece.</p>' +
    '<label class="campo-rotulo" for="pnome">Nome do professor</label>' +
    '<input id="pnome" name="nome" autocomplete="off" placeholder="ex.: Tiago">' +
    '<label class="campo-rotulo" for="psobrenome">Sobrenome ou apelido</label>' +
    '<input id="psobrenome" name="sobrenome" autocomplete="off" placeholder="ex.: Menegaz">' +
    '<div id="prof-senha">' +
    '<label class="campo-rotulo" for="psenha">Senha do professor</label>' +
    '<input id="psenha" name="senha" type="password" autocomplete="new-password">' +
    '</div>' +
    '<div class="res" data-res="professores"></div>' +
    '<span class="par-botoes">' +
    '<button type="submit" class="acao grande" id="prof-enviar">Cadastrar professor</button>' +
    '<button type="button" class="acao secundario" id="prof-cancelar" hidden>Cancelar</button>' +
    '</span>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Professores cadastrados</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensProfs + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-alunas" hidden>' +
    tituloComAcordeao('sec-alunas', 'Alunas', 'alunas-miolo') +
    '<div class="col-form" id="alunas-miolo">' +
    '<form id="form-aluna">' +
    '<label class="campo-rotulo" for="anome">Apelido da aluna (estável)</label>' +
    '<input id="anome" name="apelido" autocomplete="off" placeholder="ex.: Vavá">' +
    '<div class="res" data-res="alunas"></div>' +
    // A FILEIRA DO BOTÃO É A DO PROFESSOR (26/10/2026). O `.acao` sozinho depois do `.res`
    // encostava no campo: a folha só dá vão ao botão que vem LOGO depois de um controle
    // (`input + button.acao`), e o `.res` — que é `display:none` até haver resposta — quebra
    // essa vizinhança. O `.par-botoes` é a peça que o professor e a turma já usam, e é ela
    // que dá o vão. Não se inventou contentor novo.
    '<span class="par-botoes">' +
    '<button type="submit" class="acao grande">Cadastrar aluna</button>' +
    '</span>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Alunas cadastradas</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensAlunas + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-turmas" hidden>' +
    // A SETA SUBIU PARA O TÍTULO (01/11/2026). Ela vivia no FIM da faixa dos passos, e a
    // pesquisadora viu a diferença entre esta secção e as outras quatro: «os steps de Turma
    // têm o botão de colapsar ou expandir na mesma linha dos steps […] nos demais, o botão
    // está no título». Agora é a MESMA peça em todas — e o que a seta daqui recolhe continua
    // a ser o miolo dos passos, não o corpo: a faixa fica, e é ela que diz onde se está.
    tituloComAcordeao('sec-turmas', 'Turmas', 'turmas-paineis', 'alternar-form') +
    // A FAIXA DOS PASSOS SAIU DE DENTRO DO FORMULÁRIO (01/11/2026), e é a segunda metade do
    // mesmo pedido: «os steps não vão ser posicionados apenas sobre o formulário […] vão ficar
    // num bloco acima, abaixo do título, mas acima do formulário e dos exercícios». Aqui ela é
    // a PRIMEIRA linha do corpo — `grid-column:1/-1` —, e o formulário e a listagem descem
    // para a linha de baixo, nas duas colunas de sempre.
    //
    // A SETA NÃO VEM COM ELA: o acordeão é do miolo dos passos, e o que recolhe é
    // `#turmas-paineis`. Um cabeçalho que recolhe não pode viver dentro do que recolhe — era
    // a razão de a faixa ter entrado para dentro do formulário em 18/10/2026, e a razão
    // deixou de existir quando a seta subiu ao título.
    '<div class="turmas-corpo">' +
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
    '</div>' +
    // O FORMULÁRIO DO PASSO — a coluna da esquerda. Ele deixou de envolver a faixa: a faixa é
    // a linha de cima, e este div é a célula da esquerda da linha de baixo.
    '<div class="turmas-form" id="turmas-form" data-recolhido="nao">' +
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
    '<div class="res" data-res="turmas"></div>' +
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
    /* A PÁGINA DO VOCABULÁRIO SAIU (01/11/2026) — e é o verbete que a substitui.
     *
     * A pesquisadora, depois de escrever o verbete do `relevé` em produção: «o vocabulário
     * técnico e o verbete, em certa medida, são redundantes […] não vejo mais sentido existir o
     * vocabulário técnico, porque no verbete nós já podemos criar o exercício, a categoria e a
     * tradição que ele usa».
     *
     * E é literalmente o mesmo ato. O «Cadastrar termo» daqui e o «Gravar exercício» do `+` do
     * verbete chamam a MESMA rota (`POST /api/bastidores/termo`), que grava no MESMO sítio
     * (`termo-repo.js` → `biblioteca/modalidades/<modalidade>/vocabulario.json`). Eram duas
     * portas para a mesma sala, e a daqui não sabia nada do que a outra sabe: o `+` do verbete
     * acrescenta o exercício à lista do próprio formulário para se escrever o verbete a seguir;
     * a daqui criava o termo e deixava a pessoa a olhar para uma lista.
     *
     * O que estava aqui — o formulário (`form-termo`), a lista de termos com os selos de «em
     * uso», e o botão «Carregar as turmas iniciais» — sai com a secção. O botão NÃO se perde:
     * passa para o passo 1 do verbete, que é onde a pesquisadora o quer, e leva uma nota do que
     * a carga NÃO traz — ver `semearTurmasNoExercicio`.
     *
     * A LISTA NÃO SE PERDE NEM UM POUCO: o vocabulário nunca viveu no KV, vive no repositório,
     * e continua a ser lido por `termos()` de lá. O que sai é a TELA que o mostrava em lista,
     * não o dado. Quem quiser ver os termos vê-os no `select` do exercício, no plano e na
     * curadoria, que são os sítios onde eles são usados.
     */
    // ---------------------------------------------------------------------------
    // OS VERBETES DA NOTAÇÃO (28/10/2026). A secção é da MODALIDADE, não da escola — o alfabeto
    // não pertence a nenhuma —, e grava no REPOSITÓRIO, porque é de lá que o gerador o lê. A tela
    // é conveniência; a guarda é o servidor (`motor/servidor/verbete.js`).
    // ---------------------------------------------------------------------------
    '<section class="secao" id="sec-verbetes" hidden>' +
    tituloComAcordeao('sec-verbetes', 'Verbetes da Notação', 'verbetes-miolo') +
    // A TIRA DOS PASSOS É A PRIMEIRA LINHA DA SECÇÃO (01/11/2026). Ela nasceu fora do
    // formulário — «os steps vão ficar fora do formulário, igual o modelo que a gente tem na
    // turma» —, mas ficou na COLUNA do formulário: a pesquisadora viu o resultado e disse o
    // resto: «os steps ficam amontoados em cima do formulário e a listagem fica à direita
    // também dos steps. O que a gente precisa é mover os steps para um bloco acima, para que
    // ele fique abaixo do título, mas acima do formulário e dos exercícios […] ocupando uma
    // linha só, do começo ao fim da página».
    //
    // UMA LINHA, DO COMEÇO AO FIM, é a regra que a `.secao` já sabe dar: a grade da secção tem
    // duas colunas, e `.passos` atravessa-as (`grid-column:1/-1`). Aqui a tira é FILHA DIRECTA
    // da secção, e o formulário e a listagem descem para a linha de baixo.
    //
    // A RAZÃO DE ESTAR FORA DO FORMULÁRIO CONTINUA VÁLIDA, e agora vale ainda mais: a tira diz
    // ONDE SE ESTÁ e o que já está decidido — é navegação, e uma navegação que vive dentro do
    // formulário desaparece quando o formulário desaparece (é o caso do modo do exercício, ver
    // `pintarPassos`) e apaga-se com ele quando a secção recolhe.
    //
    // OS SETE PASSOS VIRARAM CINCO (01/11/2026). A tira é a navegação E o resumo do que já está
    // decidido; cada passo leva o rótulo e o valor. Com a fusão do exercício, da frase e da
    // posição num só passo, são cinco elos em vez de sete, e cada um diz menos.
    //
    // A PEÇA NÃO É NOVA. `.passos`, `.passo`, `.passo-n`, `.passo-t` e `.passo-alerta` já são o
    // desenho da faixa do formulário da turma, nesta mesma página — e o `!` de edição já existe
    // para dizer «está-se a editar». Reusam-se, em vez de inventar uma segunda tira que diria o
    // mesmo com outro nome. O que muda é o alcance: aqui o `!` só aparece nos passos do trecho,
    // porque é por eles que a correcção de um trecho passa.
    '<ol class="passos" id="vb-tira" data-editando="nao" aria-label="Passos do verbete">' +
    PASSOS_DO_VERBETE.map(([n, t]) =>
      '<li><button type="button" class="passo" data-passo="' + n + '">' +
        '<span class="passo-n">' + n + '</span> ' +
        '<span class="passo-t">' + t + '</span>' +
        // O VALOR VAI NUM SEGUNDO `.passo-t`, e não numa classe nova: o que se quer dele é o
        // mesmo que a folha já dá ao rótulo — encurtar com reticências quando a tira não cabe.
        ' <span class="passo-t" id="vb-v' + n + '">—</span>' +
        (PASSOS_DO_TRECHO.indexOf(Number(n)) !== -1
          ? ' <span class="passo-alerta" aria-hidden="true">!</span>' : '') +
        '</button></li>').join('') +
    '</ol>' +
    '<div class="col-form" id="verbetes-miolo">' +
    '<form id="form-verbete">' +
    '<input type="hidden" id="vbacao" value="criar">' +
    // O EXERCÍCIO É ESCOLHIDO, NÃO ESCRITO (28/10/2026). A lista vem do vocabulário técnico da
    // modalidade — a mesma de onde sai o «conteúdo do nível» do plano. Escrever à mão daria
    // verbetes que quase casam com o exercício, e «quase» aqui quer dizer uma página em lacuna.
    // DOIS MODOS, UM DE CADA VEZ (28/10/2026). A regra é da pesquisadora: ou se escolhe um
    // exercício que existe, ou se cria um — nunca as duas. Antes, o «+» abria uma caixa a MEIO do
    // formulário do verbete e o que vinha depois continuava a ser do verbete: dois botões
    // primários à vista, os campos do verbete ABAIXO do botão que grava o exercício, e «informe o
    // nome do exercício» com um exercício já escolhido.
    //
    // O que fica FORA dos dois blocos é o par do exercício — o `select` e o «+» —, porque é ele
    // que o modo B bloqueia. Bloqueado, o `select` é a memória do que estava escolhido; o «+»
    // fica bloqueado porque o modo já está aberto. Os dois continuam à vista: um campo que
    // desaparece não se distingue de um campo que nunca existiu.
    //
    // O «+» colado ao campo que ele alimenta é a opção A, decidida pela pesquisadora. Ele abre um
    // cadastro CURTO — nome, categoria, tradição —, que é o que um termo exige e nada mais. Não é
    // um segundo cadastro de termos: é o mesmo, numa forma breve, e grava no mesmo sítio (o
    // vocabulário do repositório). O que se cria é um EXERCÍCIO (um termo), não um verbete: um
    // verbete sem exercício seria a decomposição de nada, e a ordem é a inversa.
    /* O PASSO 1 É O EXERCÍCIO NOVO — E NÃO UM «+» QUE ABRE UM CADASTRO (02/11/2026).
     *
     * ELE ERA DUAS COISAS, E NENHUMA DELAS SERVE. Primeiro um «+» colado ao campo do exercício,
     * que abria um cadastro breve por cima do formulário. Depois, ainda por cima, um «modo» que
     * escondia o formulário e a tira dos passos e cujo único caminho de saída se chamava
     * «Cancelar». A pesquisadora: «somente esses campos — exercício novo, categoria, tradição e
     * carregar as turmas iniciais — vão ser o step 1. O step 2 passa a ser o que antes era o
     * step 1, e assim por diante, então agora eu vou ter seis steps ao todo. E esse botão de
     * mais (…) deixa de existir.»
     *
     * O QUE MUDA, e é uma coisa só: criar o exercício passa a ser um PASSO, o primeiro. Não há
     * «+», não há modo, não há «Gravar exercício» nem «Cancelar» — o «Seguir →» que já existia é
     * que grava o termo e avança. Quem está no passo 1 vê a tira, e a tira diz que há seis.
     *
     * O QUE NÃO SE PERDE. O exercício criado entra na lista do passo 2, no grupo da categoria, já
     * escolhido — e continua a não gastar KV: o `POST /api/bastidores/termo` grava no vocabulário
     * do repositório (`termo-repo.js`) e a lista que a rota serve lê o MESMO ficheiro. A tela
     * acrescenta-o localmente enquanto não há outra leitura.
     */
    '<div class="passo-painel" data-passo="1">' +
    '<label class="campo-rotulo" for="vnnome">Exercício novo (grafia francesa, com acentos)</label>' +
    '<input id="vnnome" autocomplete="off" placeholder="ex.: Battement fondu">' +
    '<label class="campo-rotulo" for="vncategoria">Categoria</label>' +
    // A CATEGORIA E A TRADIÇÃO COMEÇAM VAZIAS (02/11/2026). Os dois `<select>` nasciam com a
    // primeira opção JÁ ESCOLHIDA, e por isso os dois campos que ela mandou tornar obrigatórios
    // nunca podiam faltar: a tela perguntava «qual é a categoria?» mostrando «passo» como se
    // fosse a resposta. Com o vazio à frente, a pergunta é uma pergunta — e o «Seguir →» recusa
    // enquanto não houver resposta.
    '<select id="vncategoria">' +
    '<option value="">— escolha a categoria —</option>' +
    ['passo', 'salto', 'ligacao', 'giro']
      .map((c) => '<option value="' + c + '">' + esc(rotuloDaCategoria(c)) + '</option>').join('') +
    '</select>' +
    '<label class="campo-rotulo" for="vntradicao">Tradição de referência</label>' +
    '<select id="vntradicao">' +
    '<option value="">— escolha a tradição —</option>' +
    // A LISTA É A DE `tradicoes.json`, e o texto é o rótulo (02/11/2026). «Compartilhada» entra
    // aqui, ao contrário do que acontece na curadoria e no programa da turma, porque a tradição
    // de um TERMO pode muito bem ser a que não é de ninguém.
    TRADICOES_DO_VOCABULARIO.map((t) =>
      '<option value="' + esc(t) + '">' + esc(rotuloDaTradicao(t)) + '</option>').join('') +
    '</select>' +
    /* «O QUE ACONTECE» É DO PASSO 1 (02/11/2026) — e a razão é a dela: «esse campo representa a
     * definição/significado do exercício, atuando como o valor descritivo no dicionário técnico».
     * Se é a definição do EXERCÍCIO, nasce onde o exercício nasce.
     *
     * O QUE ISSO RESOLVE, e não é só arrumação: a frase deixa de ser uma coisa que o passo 2 pede
     * a quem já escolheu o exercício — passa a ser o que o termo GUARDA. Ela vai no corpo do
     * `POST /api/bastidores/termo` como `descricao`, e é a mesma que o dicionário mostra depois.
     * Uma definição escrita uma vez, num sítio, e lida nos três (formulário, aula, glossário).
     *
     * ELA CONTINUA A SER A FRASE DOS TRECHOS: cada célula guarda a sua `descricao`, composta da
     * frase + o «lê-se» — e o que está escrito não se reescreve (P-03/P-04). Escrevê-la aqui é
     * escrever a frase com que os trechos que se seguem vão nascer.
     */
    '<label class="campo-rotulo" for="vb-frase">O que acontece — a definição do exercício</label>' +
    '<textarea id="vb-frase" rows="4" placeholder="a definição do exercício; cada trecho acrescenta, abaixo, o «lê-se» da sua notação"></textarea>' +
    '<p class="nota" id="vb-frase-nota"></p>' +
    /* OS QUATRO CAMPOS DO PASSO 1 SÃO UM BLOCO, E O NOME É A CHAVE (02/11/2026).
     *
     * O pedido dela, e a segunda vez que o fez: «os campos Categoria, Tradição de Referência e O
     * que acontece só entram em vigor (e passam a ser obrigatórios para o avanço) se o campo Nome
     * do Exercício Novo estiver devidamente preenchido. Se o utilizador não digitar um nome (…)
     * permanecem desativados/desconsiderados, permitindo navegar livremente».
     *
     * A REGRA JÁ ERA VERDADE NO SERVIDOR (a recusa só olha para os três quando há nome); o que
     * faltava era a tela dizê-lo antes do clique. Um campo habilitado que não vale nada é pior do
     * que um campo apagado: parece pedir uma resposta que ninguém vai ler.
     */
    '<p class="nota" id="vb-vigor-nota"></p>' +
    '<div class="res" data-res="vb-novo"></div>' +
    /* O BOTÃO DAS TURMAS INICIAIS FICA AQUI (01/11/2026 — e é do passo 1 desde 02/11/2026).
     *
     * Ele vivia na página do vocabulário, que saiu. A pesquisadora quer-o neste passo — «ele tem
     * que ir pra dentro do verbete, nesse espaço» — e com uma dúvida declarada: «tenho dúvidas se
     * isso ainda vai existir». Fica, temporariamente, porque funciona.
     *
     * O QUE ELE FAZ: carrega as turmas iniciais do catálogo (`progressao.json`) para o cadastro da
     * escola, sem duplicar as que já existem, e a relação turma↔conteúdo.
     *
     * O QUE ELE NÃO FAZ — MEDIDO, e é o que o `confirm` passa a dizer. As turmas do catálogo
     * trazem nome, ordem, programa e nível de referência; NÃO trazem o RITMO (dias, hora de cada
     * dia, duração e período). E o ritmo é o que a geração exige: `comporConf` LANÇA «a turma não
     * tem o que a geração exige: os dias da semana da turma; a duração de cada aula; o início do
     * período; o fim do período». Uma turma semeada assim serve para a curadoria e para o
     * repertório, e NÃO serve para gerar ciclo — nasce pela metade.
     *
     * O AVISO VAI NO `confirm`, E NÃO EM PROSA NA PÁGINA. A regra da casa é que o formulário não
     * explica — só rótulo, campo e placeholder (é o que `provar-producao` mede). E há uma razão
     * melhor do que a regra: o aviso vale no INSTANTE da ação, que é quando alguém decide se quer
     * aquilo. Em prosa fixa, quem não carrega turmas nunca precisa dele e quem carrega já não o lê.
     *
     * Quando o catálogo passar a trazer o ritmo (ou quando a carga o perguntar a quem clica), o
     * aviso encurta com a mesma naturalidade.
     */
    '<p><button id="semear" type="button">Carregar as turmas iniciais</button></p>' +
    '</div>' +

    // ---- MODO A: o verbete ---------------------------------------------------------------
    '<div id="vb-modo-verbete">' +
    // ================= OS PASSOS, UM DE CADA VEZ (31/10/2026 — seis desde 02/11/2026) ======
    // Decidido pela pesquisadora depois de ver as duas bancadas: «o Step, apesar de ter mais
    // cliques, ele é mais fácil de entender». O formulário era uma coluna comprida em que a maior
    // parte dos campos não se podia preencher a maior parte do tempo — a posição depende do
    // exercício, a contagem depende da direção, a frase depende da música. Passa a passos, um de
    // cada vez: a TIRA (lá em cima, fora do formulário) diz o que já está decidido E é a
    // navegação; o que este bloco contém são os PAINÉIS.
    //
    // O PASSO 1 JUNTOU TRÊS (01/11/2026). O exercício, a frase e a posição — que eram os passos
    // 1, 2 e 4 — são as três coisas que se decidem ANTES de haver trecho: qual é o exercício,
    // como se escreve a frase dele, e onde acontece. A frase vem do dicionário assim que o
    // exercício é escolhido, e a posição é a mesma lista curta que o acompanha.
    //
    // O QUE FICA DE FORA é o que muda de trecho para trecho: a MÚSICA (2), o PARA ONDE (3) e os
    // SINAIS (4) — e a DECOMPOSIÇÃO (5), que é a leitura do que se escreveu.
    //
    // OS DOIS PASSOS DO TRECHO separam o que ele É (3: para onde e quando) de como ele SE ESCREVE
    // (4: os sinais) — e o último passo é o que a decomposição MOSTRA. Era o emaranhado do quarto
    // passo que estava confuso — e a tabela, que aparecia ao lado das escolhas que a alimentam,
    // respondia antes de haver pergunta.
    // O AVISO DE EDIÇÃO. Um trecho acrescentado pode ser corrigido, e a correcção atravessa os
    // dois passos do trecho — o aviso diz onde ela começa, e o `!` nos dois números impede que se
    // perca o rasto a meio. É `.nota` com um botão: nenhuma peça nova. Os números vêm da lista
    // dos passos, para o texto não envelhecer sozinho numa renumeração.
    '<p class="nota" id="vb-edicao" hidden>' +
    '<strong>Em edição</strong> — trecho <span id="vb-edicao-n">1</span>. ' +
    'A edição começa no <strong>passo ' + PASSOS_DO_TRECHO[0] + '</strong> e continua no ' +
    PASSOS_DO_TRECHO[1] + '. ' +
    '<button type="button" class="acao secundario pequena" id="vb-cancelar-edicao">Cancelar a edição</button>' +
    '</p>' +
    // ---- PASSO 2: O EXERCÍCIO, A FRASE E A POSIÇÃO (02/11/2026) --------------------------
    // ELE ERA O PASSO 1, e desceu um número quando o exercício novo passou a ser o passo 1. O
    // seletor do exercício veio para dentro dele: era um painel à parte, por cima, porque o
    // «modo» do exercício novo o bloqueava em vez de o esconder — e sem modo, um painel à parte
    // seria um passo sem número.
    //
    // A FRASE É DO EXERCÍCIO, E ESCREVE-SE UMA VEZ. Era o campo do último passo, e o defeito só
    // apareceu a usar: quem acrescentava três trechos escrevia três vezes a mesma definição —
    // a redundância que ela mandou tirar da tabela continuava viva no preenchimento. Aqui o
    // texto é escrito uma vez e vale para todos os trechos; o que muda por trecho («lê-se: pé,
    // quinta posição, à frente…») é derivado da notação e nasce no ÚLTIMO passo.
    //
    // A DEFINIÇÃO DO DICIONÁRIO PRÉ-ENCHE O CAMPO, e não o substitui: o que a professora ajusta
    // é o que fica gravado nas células (P-03/P-04). Quando o exercício já tem verbete, o texto
    // que volta é o que está GRAVADO, não o do dicionário — o dicionário pode melhorar sem
    // reescrever o passado.
    //
    // ELA VIVE AQUI, E NÃO NUM PAINEL PRÓPRIO, desde a fusão de 01/11/2026: a frase nasce da
    // escolha do exercício (o dicionário responde à escolha), e a posição é a lista curta que
    // acompanha o mesmo exercício. Desde 02/11/2026 as três são o passo 2 — o exercício novo é
    // o passo 1, e é o «Seguir →» dele que grava o termo antes de se chegar aqui.
    '<div class="passo-painel" data-passo="2" hidden>' +
    '<label class="campo-rotulo" for="vbnome">Exercício</label>' +
    '<select id="vbnome"><option value="">— escolha o exercício —</option></select>' +
    /* A POSIÇÃO SAIU DAQUI (02/11/2026), a pedido dela: «essa mesma configuração já é tratada de
     * forma muito mais granular, robusta e organizada no Step 4 (Para Onde) e no Step 5 (Sinais)».
     *
     * O QUE ELA DIZIA, e não era mentira: a posição era um selo guardado no verbete
     * (`posicao: {membro, termo}`), lido pela listagem e pelo documento. O que era verdade é que
     * ela não dizia NADA que os sinais das células já não dissessem — e dizia-o pior, porque era
     * uma segunda declaração do mesmo facto, escrita à parte e nunca conferida contra eles.
     *
     * O CAMPO DO DADO NÃO SAI. Os verbetes que já o têm continuam a mostrá-lo na listagem e no
     * documento, e o validador continua a conferi-lo quando existe. O que sai é a TELA que pedia
     * uma segunda resposta para uma pergunta que os sinais já respondem.
     */
    '<p class="nota">A posição de cada trecho escreve-se nos sinais dele — passo 4, para onde, e passo 5, os sinais.</p>' +
    // O MÉTODO DESTE VERBETE (02/11/2026) — e ele HERDA, não duplica.
    //
    // O plano já declara «Metodologia de referência» e é obrigatório: o ciclo inteiro tem um
    // padrão, e é de lá que sai. Este campo existe para o exercício que foge ao padrão — «neste
    // sou RAD, nos outros sou francês» —, e a primeira opção diz exactamente isso. Duas
    // declarações do mesmo facto divergiriam ao primeiro caso; uma herança com sobreposição
    // não: quem não escolhe nada herda, e o que herda vê-se escrito.
    //
    // A razão de ele existir é a 3ª posição: os dois braços acima da cabeça são a 3ª na escola
    // francesa e a 5ª na RAD. O rótulo do sinal já diz as duas («3ª · quinta (braços)»); o
    // método decide QUAL delas vem primeiro, e é isso que o documento publica.
    '<label class="campo-rotulo" for="vbmetodo">Método deste exercício</label>' +
    '<select id="vbmetodo">' +
    '<option value="">— herda a metodologia do plano —</option>' +
    /* AS TRADIÇÕES SÃO AS DA LISTA ÚNICA, E O VALOR É A CHAVE (02/11/2026).
     *
     * DEFEITO QUE ESTAVA AQUI, medido: a opção dizia `Francesa` e a tabela
     * `diferencasDeNomenclatura` tem a coluna `francesa`. `linha["Francesa"]` é `undefined`, e a
     * nota do método dizia sempre «O alfabeto não declara esta posição em Francesa» — a negar um
     * dado que existe. A causa é a de sempre: a lista escrita à mão ao lado da lista do dado.
     *
     * AGORA O VALOR É A CHAVE E O TEXTO É O RÓTULO, e os dois vêm de `METODOS_DO_VERBETE`: as
     * tradições do `tradicoes.json` e os métodos livres (`Cecchetti`, `Escola livre`), somados
     * UMA vez e sem repetir. A repetição que ela viu — «a opção Compartilhada duplicada, no meio
     * e no final da lista» — não vinha daqui: vinha do `sugerirMetodo`, que acrescentava uma
     * opção nova sempre que o valor sugerido não era o que já estava escolhido, mesmo quando ele
     * já existia na lista. Está corrigido lá, e a lista aqui passa a ser a fonte.
     */
    METODOS_DO_VERBETE.map((m) =>
      '<option value="' + esc(m.valor) + '">' + esc(m.rotulo) + '</option>').join('') +
    '</select>' +
    '<p class="nota" id="vb-metodo-nota"></p>' +
    '</div>' +
    '<div class="passo-painel" data-passo="3" hidden>' +
    '<label class="campo-rotulo" for="vbtempos">Música — quantos tempos</label>' +
    '<input id="vbtempos" type="number" min="1" max="256" step="1" placeholder="ex.: 8">' +
    '<label class="campo-rotulo" for="vbcompasso">Em que compasso</label>' +
    '<select id="vbcompasso">' +
    ['2/4', '2/2', '3/4', '3/8', '4/4', '6/8', '9/8', '12/8']
      .map((c) => '<option value="' + c + '">' + c + '</option>').join('') +
    '</select>' +
    '<p class="nota" id="vb-musica-nota"></p>' +
    /* O DESACORDO ENTRE A MÚSICA E A DECOMPOSIÇÃO (03/11/2026). A música edita-se sempre; o que
       não pode acontecer é o trabalho da decomposição desaparecer por causa disso. Quando os
       tempos declarados deixam de bater com o que os trechos ocupam, este selo aparece — e é um
       ESTADO do dado, não um erro de preenchimento: quem decide como resolver é quem ensina.
       A peça é o `.selo` da folha, no estado `alerta` que já existe (IDENTIDADE-VISUAL §«um
       estado ou atributo do dado»). */
    '<p class="nota" id="vb-musica-desacordo" hidden>' +
    '<span class="selo alerta">Os tempos da música estão em desacordo com a decomposição</span>' +
    '</p>' +
    '</div>' +

    // ---- O FORMULÁRIO DE UM TRECHO -------------------------------------------------------
    // Três coisas dizem o mesmo trecho em três línguas: a CONTAGEM (a do compasso), os SINAIS
    // BENESH (a da notação) e O QUE ACONTECE (a do português). As duas primeiras compõem-se; a
    // terceira escreve-se — e vem sugerida do dicionário da modalidade.
    // TUDO EM PÍLULAS (28/10/2026). O `<select>` dos sinais tinha um defeito que só se vê a
    // usar: escolher um sinal SUBSTITUÍA o anterior em vez de o acrescentar à sequência — e uma
    // sequência de vários não se escreve com uma escolha única. O `+` ao lado piorava-o, porque
    // obrigava a mirar num botão depois de já ter escolhido. Com pílulas, o clique ACRESCENTA ao
    // fim e o segundo clique TIRA: não há estado escondido, e o que está escrito vê-se.
    // ---- PASSO 3: PARA ONDE O TRECHO VAI, E QUANDO (31/10/2026 — passo 3 desde 01/11/2026) -
    // Quatro escolhas que respondem à mesma pergunta: a direção do membro, a orientação do
    // corpo, a categoria e a contagem. Estavam misturadas com os sinais e com a tabela, e era
    // esse emaranhado que a pesquisadora achou confuso.
    '<div class="passo-painel" data-passo="4" hidden>' +
    '<fieldset class="escolhas" id="vb-dir">' +
    // A DIREÇÃO É OPCIONAL (01/11/2026) — e a legenda diz que é, no mesmo desenho da orientação,
    // que já era. Sem isto, a ausência de escolha lia-se como campo por preencher.
    '<legend class="campo-rotulo">Direção do membro <span class="nota">— opcional; sem escolha, o trecho não tem direção</span></legend>' +
    '</fieldset>' +
    // A ORIENTAÇÃO É O OUTRO EIXO, e é opcional: sem escolha, o corpo está DE FRENTE. Ela
    // existe porque «battement tendu à frente» não diz se o corpo está de frente ou em relação
    // cruzada — e são dois trechos diferentes, não um.
    //
    // A LEGENDA JÁ NÃO DIZ «en face» (01/11/2026). As orientações deixaram de se chamar
    // exclusivamente pelos nomes do ballet clássico — «en face», «croisé», «effacé» são a
    // gramática de uma tradição, e o Lastro quer poder acolher outras. O nome que a tela
    // mostra é a leitura em português (`de frente`, `pernas cruzadas`), e o nome de sempre vai
    // no `title` da pílula: quem ensina ballet continua a reconhecê-lo, e quem não ensina
    // ballet percebe o que se está a dizer. Ver `orientacoesDoCorpo` no alfabeto.
    '<fieldset class="escolhas" id="vb-orient">' +
    '<legend class="campo-rotulo">Orientação do corpo <span class="nota">— opcional; sem escolha, de frente</span></legend>' +
    '</fieldset>' +
    '<fieldset class="escolhas" id="vb-categoria">' +
    '<legend class="campo-rotulo">Categoria — que parte do corpo se move</legend>' +
    // A LISTA VEM DO ALFABETO (01/11/2026) — ver `categoriasDoTrecho`. Era escrita à mão aqui,
    // e trazia o `Plié` como se fosse parte do corpo.
    categoriasDoTrecho().map((c, i) =>
      '<label class="escolha"><input type="radio" name="vb-cat" value="' + esc(c) + '"' +
      (i === 0 ? ' checked' : '') + '><span>' + esc(c) + '</span></label>').join('') +
    '</fieldset>' +
    // AS CONTAGENS SÃO CALCULADAS. A contagem não se escreve: ela vai de 1 até o numerador do
    // compasso e recomeça no seguinte, e o trecho começa onde o anterior da MESMA direção
    // acabou. O que se oferece é o que cabe — e por isso o compasso nunca fica com buraco.
    '<fieldset class="escolhas" id="vb-contagem">' +
    '<legend class="campo-rotulo">Contagem — em que tempos do compasso</legend>' +
    '</fieldset>' +
    // A REPETIÇÃO É DO TRECHO (02/11/2026). O mesmo trecho acontece mais de uma vez — «o plié
    // desce e sobe, duas vezes» —, e antes isso só se escrevia duplicando a linha. Aqui diz-se
    // uma vez, e o tempo que ele ocupa na música é o produto: dois tempos × 2 = quatro.
    //
    // Fica no PASSO DO «QUANDO», e não na decomposição: repetir é dizer quantas vezes o trecho
    // ocupa o compasso, e é a contagem que isso muda. A decomposição mostra o resultado; quem o
    // decide está aqui, ao lado do tempo.
    '<label class="campo-rotulo" for="vb-repeticoes">Quantas vezes este trecho acontece</label>' +
    '<select id="vb-repeticoes">' +
    [1, 2, 3, 4].map((n) => '<option value="' + n + '">' + n + '×' +
      (n === 1 ? ' — uma vez' : '') + '</option>').join('') +
    '</select>' +
    '</div>' +
    // ---- PASSO 4: COMO O TRECHO SE ESCREVE (31/10/2026 — passo 4 desde 01/11/2026) -----
    '<div class="passo-painel" data-passo="5" hidden>' +
    '<fieldset class="escolhas" id="vb-sinais">' +
    '<legend class="campo-rotulo">Sinais, pela ordem em que acontecem <span class="nota">— clique para acrescentar ao fim; clique outra vez para tirar</span></legend>' +
    '</fieldset>' +
    '<p class="campo-rotulo">Sinais Benesh deste trecho</p>' +
    '<p id="vb-chips" class="par-associar"><span class="nota">Escolha a categoria e os sinais.</span></p>' +
    '</div>' +
    // ---- PASSO 5: A DECOMPOSIÇÃO (31/10/2026 — passo 5 desde 01/11/2026) ---------------
    // A tabela deixou de estar ao lado das escolhas que a alimentam — ela respondia «não vai à
    // frente» antes de haver trecho nenhum. Aqui mostra o que foi acrescentado.
    //
    // E NÃO TEM CAMPO DE TEXTO (31/10/2026). Havia um — «o que acontece neste trecho» —, e o
    // defeito era o pior dos dois mundos: a coluna da tabela tinha saído por ser redundante, mas
    // o campo continuava a pedir a MESMA frase a cada trecho. A frase é do exercício e passou
    // para o passo 1; o que este passo mostra é o que fica ESCRITO em cada trecho, já composto
    // (frase + «lê-se»), sem nada para reescrever.
    '<div class="passo-painel" data-passo="6" hidden>' +
    // Havia DUAS tabelas — «direções que este verbete cobre» e «células deste verbete» —, e elas
    // diziam a mesma coisa: a primeira era a segunda agrupada. Sem células, as duas diziam «não
    // há nada». É o mesmo defeito das duas listas de direções no dado, repetido na tela; a
    // pesquisadora viu-o de imediato («não entendi por quê que tem isso daqui»).
    //
    // Agora é uma tabela: um bloco por direção do corpo, as células dentro, e a linha de
    // acrescentar no fim de cada bloco. A direção que não é coberta continua a aparecer — é ela
    // que responde ao «o fouetté não vai às três» —, com a diferença entre «não vai» e «falta
    // escrever».
    //
    // A COLUNA DO COMPASSO NÃO SE ESCREVE: é calculada somando os tempos na ordem. Era a
    // confusão antiga do «1, 2, 3 e o compasso» — a contagem reinicia em cada compasso, e o
    // número do compasso é conta do sistema.
    '<label class="campo-rotulo">A decomposição — o que acontece em cada trecho</label>' +
    '<div id="vb-tabela"></div>' +
    '<p class="nota" id="vb-cobertura"></p>' +
    // O QUE FICA ESCRITO — derivado, não escrito (31/10/2026). Cada trecho grava DUAS linhas: a
    // frase do exercício (passo 1) e o «lê-se» da sua notação. Aqui elas aparecem compostas, do
    // lado da tabela que mostra a notação que as gera: é a última leitura antes de gravar, e é
    // onde se vê que os trechos partilham a mesma frase e diferem no «lê-se».
    '<p class="campo-rotulo">O que fica escrito em cada trecho</p>' +
    '<div id="vb-fica"></div>' +
    // DOIS BOTÕES, E NÃO UM QUE MUDA DE NOME (02/11/2026). Era um só, e o rótulo alternava entre
    // «Acrescentar trecho» e «Guardar a alteração». A pesquisadora pediu para **esconder** o
    // «Acrescentar» durante a correcção — e um rótulo que muda não esconde nada: quem está a
    // corrigir vê o mesmo botão no mesmo sítio, e tem de ler para saber o que ele faz agora.
    // Com dois botões, o que se pode fazer vê-se: em correcção, o «Acrescentar» não está lá.
    '<span class="par-botoes">' +
    '<button type="button" class="acao secundario" id="vb-cel-acrescentar">Acrescentar trecho</button>' +
    // DUPLICAR O EXERCÍCIO (02/11/2026). A barra repete a mesma estrutura rítmica e os mesmos
    // braços mudando só a posição das pernas — 1ª, 2ª, 4ª, 5ª. Escrever os dois compassos vezes
    // e vezes é trabalho repetido, e o que varia é uma coisa só.
    //
    // ELE DUPLICA TAL E QUAL, sem tocar em sinal nenhum: no `Plié` o `1ª` está nas duas pistas
    // (a perna é `ED 1ª ↓ ↑`, o braço é `⌒ 2ª → 1ª → 2ª`), e uma troca de posição feita por
    // conta própria escreveria `⌒ 2ª → 2ª → 2ª`. A posição da cópia muda-se a seguir, com o
    // «Editar» do trecho — que é onde se vê o que se está a mudar.
    '<button type="button" class="acao secundario" id="vb-cel-duplicar" hidden>Duplicar o exercício</button>' +
    '<button type="button" class="acao secundario" id="vb-cel-guardar" hidden>Guardar a alteração</button>' +
    '<button type="button" class="acao secundario" id="vb-cancelar-edicao-2" hidden>Cancelar a edição</button>' +
    /* O «APAGAR» SAIU DO PASSO 6 (02/11/2026, segunda correcção do mesmo dia).
     *
     * ELE ESTEVE AQUI E ERA UM ERRO DE SÍTIO. Na manhã de 02/11/2026 a pesquisadora pediu-o «na
     * listagem e na tela de decomposição»; à tarde ela reviu a decisão, e com razão: o passo 6 é
     * a tela onde se está a ESCREVER a decomposição, e um botão que apaga o verbete inteiro — com
     * todas as músicas — ao lado do «Acrescentar trecho» é um alvo a um clique de distância do
     * gesto mais frequente. Um engano não se desfaz: o verbete sai do alfabeto.
     *
     * O VERBO NÃO DESAPARECE. Ele continua na LISTAGEM de verbetes (`data-apagar-verbete`, com a
     * pergunta que diz o que se perde e que avisa da recusa por proveniência). O que muda é o
     * lugar: apagar é um acto sobre um registo, e os actos sobre registos fazem-se na lista deles.
     *
     * A CONSEQUÊNCIA FICA DITA: quem acaba de escrever os trechos e percebe que o exercício não é
     * o que queria tem de voltar à lista para o tirar — e é isso mesmo que se quer. O custo de um
     * clique a mais é menor do que o de um verbete apagado por engano.
     */
    '</span>' +
    '<div class="res" data-res="verbetes"></div>' +
    '</div>' +
    // A NAVEGAÇÃO. «Voltar» e «Seguir» são os mesmos em todos os passos; o «Gravar» aparece só
    // no último — o formulário passa a ter um fim, em vez de um botão que se pode carregar a
    // qualquer momento e que só o servidor sabe recusar.
    '<span class="par-botoes" id="vb-nav">' +
    '<button type="button" id="vb-voltar">← Voltar</button>' +
    '<button type="button" class="acao" id="vb-seguir">Seguir →</button>' +
    '<button type="submit" class="acao grande" id="vb-gravar" hidden>Gravar verbete</button>' +
    // GUARDAR COMO MÚSICA NOVA (02/11/2026). O «Gravar» de uma edição SUBSTITUI — se os tempos
    // mudaram, a música de onde se veio sai e o verbete fica com uma só. Esta caixa é a outra
    // intenção, e é explícita: «quero as duas», a de 8 e a de 16, o mesmo exercício em duas
    // durações. Ela só aparece quando há o que decidir — isto é, quando a música em foco já não é
    // a que se abriu. Uma opção que aparece sempre obriga a lê-la sempre.
    '<label class="escolha" id="vb-como-nova-caixa" hidden>' +
    '<input type="checkbox" id="vb-como-nova">' +
    '<span>guardar como música nova, e manter a de <b id="vb-como-nova-antiga"></b></span></label>' +
    '<button type="button" id="vbnovo" hidden>Limpar</button>' +
    '</span>' +
    '<p class="nota" id="vb-gravar-nota"></p>' +
    '</div>' +

    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Exercícios com verbete</h3>' +
    '<div class="rolagem"><ul class="lista" id="lista-verbetes"></ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-curadorias" hidden>' +
    tituloComAcordeao('sec-curadorias', 'Curadorias', 'curadorias-miolo') +
    '<div class="col-form" id="curadorias-miolo">' +
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
    // A TRADIÇÃO É OBRIGATÓRIA (23/10/2026). Havia aqui um «— nenhuma —», e era o único
    // campo da curadoria que se podia deixar em branco sem que nada reclamasse: a curadoria
    // autorizava o plano de uma turma sem dizer em que linha o professor ensina. A opção saiu;
    // quem editar um registo antigo sem tradição escolhe uma (P-03: a proveniência acrescenta,
    // e a versão nova fica completa).
    '<select id="cutradicao">' + opcoesTradicaoCuradoria + '</select>' +
    '<label class="campo-rotulo" for="cuturma">Turma</label>' +
    '<select id="cuturma">' + opcoesTurmaCuradoria + '</select>' +
    '<label>Alunas</label>' +
    escolarAlunasCuradoria +
    // O «REPERTÓRIO» NÃO MORA AQUI (19/10/2026). Ele era um segundo lugar para digitar os
    // mesmos 84 termos do vocabulário que a TURMA já declara no passo «Associar»
    // (`turma-conteudos`) — e **ninguém o lia**: o plano, o PO e a captura derivam da turma,
    // e nenhum nó do conteúdo declara `daCuradoria: "repertorio"`. Duas listas da mesma coisa
    // é uma lista a mais, e a que sobra só pode divergir. O de cá não foi apagado do que já
    // está gravado (P-03/P-04): ele apenas deixou de se pedir.
    // O «CANCELAR» AO LADO DO BOTÃO, E SÓ NA EDIÇÃO (18/10/2026) — a mesma regra dos três
    // passos da turma. Ele não tem texto de aviso, e nasce escondido: sem edição em curso não
    // há nada para cancelar.
    '<div class="res" data-res="curadorias"></div>' +
    '<span class="par-botoes">' +
    // A AÇÃO PRINCIPAL É `.acao` (26/10/2026). O botão estava sem classe: caía no botão
    // PADRÃO da folha — filete na marca, fundo de papel — e por isso tinha outra cor e outra
    // altura que o «Cadastrar professor» ao lado, na mesma página. A ação que grava é a
    // principal das três, e é a peça `.acao` que a desenha.
    '<button type="submit" class="acao grande" id="cu-enviar">Atribuir curadoria</button>' +
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
    // O FILTRO QUE CHEGA PELO ATALHO (22/10/2026): o PO linka «ver a turma» com o nome
    // dela. A listagem é reduzida ANTES de a secção abrir, e o «Mostrar todas» continua a
    // devolver o resto — é uma vista, não uma exclusão. A aplicação fica no ARRANQUE, e não
    // aqui: a chave do filtro (`CHAVE_FILTRO`) só está inicializada no bloco do filtro.
    'var TURMA_DO_LINK = ' + JSON.stringify(idDaTurmaDoLink) + ';' +
    // A PAGINAÇÃO DA LISTA. A lista já veio inteira do servidor (é curta: uma escola tem
    // dezenas de professores, não milhares), e quem escolhe a página é o navegador — não há
    // rota nova, nem estado no servidor. O que se ganha é a vista: o formulário à esquerda,
    // a lista à direita, e nenhuma página comprida para rolar. Sem JavaScript, o rodapé nem
    // aparece e a lista mostra tudo.
    //
    // O COMPORTAMENTO MUDOU-SE PARA O NÚCLEO (23/10/2026), com o rodapé que ele faz andar: a
    // lista de aulas da publicação passou a precisar do mesmo, e duas cópias divergem na
    // primeira correcção. A peça mora em `motor/nucleo/paginacao.js`.
    paginacao.script +
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
    // O RECOLHIDO MUDA A GRELHA (18/10/2026): o formulário sai e a listagem fica sozinha, com
    // a largura toda. O estado vai também no `.turmas-corpo` porque é ELE que tem a grade — e
    // uma grade não se muda a partir do filho.
    //
    // E VAI NA SECÇÃO DESDE 01/11/2026, pela razão que as outras quatro já tinham: é a
    // `.secao[data-recolhido="sim"]` que dá o filete ao título. Ele estava debaixo da faixa
    // quando a faixa era o cabeçalho; agora o cabeçalho é o título, e o filete vai atrás dele.
    '  var grade = document.querySelector(".turmas-corpo");' +
    '  if (grade) grade.setAttribute("data-recolhido", sim ? "sim" : "nao");' +
    '  var secao = document.getElementById("sec-turmas");' +
    '  if (secao) secao.setAttribute("data-recolhido", sim ? "sim" : "nao");' +
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
    // DUAS SETAS, DOIS DONOS (18/10/2026). A das turmas recolhe a faixa dos passos; as das
    // outras quatro secções recolhem o título. O `data-acordeao` diz de quem é a seta — sem
    // ele, clicar na seta do vocabulário recolhia as TURMAS, que é o defeito que se evita
    // aqui com uma linha em vez de uma classe a mais.
    '    var alvoDaSeta = e.target.closest("button.alternar-form").getAttribute("data-acordeao");' +
    '    if (alvoDaSeta) definirSecaoRecolhida(alvoDaSeta, !secaoRecolhida(alvoDaSeta));' +
    '    else definirFormularioRecolhido(!formularioRecolhido());' +
    '  }' +
    '});' +
    // AO ABRIR A SECÇÃO TURMAS, O FILTRO GUARDADO É APLICADO. `hashchange` cobre a chegada
    // pelo link; o arranque cobre a página que já abriu em `#turmas` ou que recarregou.
    // O atalho do PO grava o filtro AQUI — depois de `CHAVE_FILTRO` existir.
    'if (TURMA_DO_LINK) gravarFiltroDeTurmas({ ids: [TURMA_DO_LINK], quem: "", tipo: "pessoa" });' +
    'window.addEventListener("hashchange", function(){' +
    '  if ((location.hash || "").replace("#", "") === "turmas") aplicarFiltroDeTurmas();' +
    '});' +
    'if ((location.hash || "").replace("#", "") === "turmas") aplicarFiltroDeTurmas();' +
    // O ACORDEÃO VOLTA COMO FICOU. Sem isto, cada recarregar (e cada operação recarrega)
    // devolveria o formulário aberto — e o recolhimento que a pessoa pediu duraria um clique.
    'definirFormularioRecolhido(formularioRecolhido());' +
    // ================= O ACORDEÃO DAS SECÇÕES DE UMA COISA SÓ (18/10/2026) =================
    // Turmas recolhe a faixa dos passos; Professores, Alunas, Vocabulário e Curadorias
    // recolhem o TÍTULO, que é o cabeçalho que elas têm. Recolhido, o formulário sai da
    // frente e a LISTAGEM ocupa a largura toda — é o mesmo pedido, e o mesmo desenho.
    //
    // O ESTADO É LEMBRADO POR SECÇÃO, e não numa chave só. Quem recolhe o vocabulário para
    // ler os termos não pediu para recolher as alunas, e uma chave partilhada faria disso uma
    // decisão da página inteira. `sessionStorage` pela razão de sempre: a página recarrega a
    // cada operação, e um formulário que se reabre sozinho desfaria o que a pessoa acabou de
    // pedir — sem ser preferência para amanhã.
    'var SECOES_COM_ACORDEAO = ["sec-professores","sec-alunas","sec-verbetes","sec-curadorias"];' +
    'function chaveDaSecao(id){ return "producao:recolhido:" + id; }' +
    'function secaoRecolhida(id){' +
    '  try { return sessionStorage.getItem(chaveDaSecao(id)) === "sim"; } catch (err) { return false; }' +
    '}' +
    'function definirSecaoRecolhida(id, sim){' +
    '  try {' +
    '    if (sim) sessionStorage.setItem(chaveDaSecao(id), "sim");' +
    '    else sessionStorage.removeItem(chaveDaSecao(id));' +
    '  } catch (err) {}' +
    '  var secao = document.getElementById(id);' +
    '  if (!secao) return;' +
    '  var miolo = secao.querySelector(".col-form");' +
    '  var seta = secao.querySelector(".alternar-form[data-acordeao]");' +
    // O ESTADO VAI NA SECÇÃO porque é ELA que tem a grade — e uma grade não se muda a partir
    // do filho. É a mesma regra do `.turmas-corpo`.
    '  secao.setAttribute("data-recolhido", sim ? "sim" : "nao");' +
    '  if (miolo) miolo.hidden = !!sim;' +
    '  if (seta) {' +
    '    var rotulo = sim ? "Abrir o formulário" : "Recolher o formulário";' +
    '    seta.setAttribute("aria-expanded", sim ? "false" : "true");' +
    '    seta.setAttribute("aria-label", rotulo);' +
    '    seta.setAttribute("title", rotulo);' +
    '    seta.textContent = sim ? "\\u25B8" : "\\u25BE";' +
    '  }' +
    '}' +
    'for (var sec = 0; sec < SECOES_COM_ACORDEAO.length; sec++) {' +
    '  definirSecaoRecolhida(SECOES_COM_ACORDEAO[sec], secaoRecolhida(SECOES_COM_ACORDEAO[sec]));' +
    '}' +
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
    // SÓ A FAIXA DA TURMA (31/10/2026). Era `document.querySelectorAll("button.passo")` — a
    // página inteira —, e a partir de hoje há DUAS tiras de passos: esta e a do verbete. Sem
    // o âmbito, completar a turma ligava e desligava os passos do verbete, e vice-versa.
    //
    // O ÂMBITO PASSOU A SER A SECÇÃO (01/11/2026), e não `#turmas-form`: a faixa dos passos
    // saiu de dentro do formulário — ela é a linha de cima do corpo, e o formulário é a célula
    // da esquerda da linha de baixo. Manter `#turmas-form` aqui deixava a faixa de fora, e os
    // passos 2 e 3 ficavam habilitados com a turma por completar.
    '  Array.prototype.slice.call(document.querySelectorAll("#sec-turmas button.passo")).forEach(function(b){' +
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
    '  var todos = document.querySelectorAll("#sec-turmas button.passo");' +
    '  for (var i = 0; i < todos.length; i++) {' +
    '    var ativo = todos[i].getAttribute("data-passo") === qual;' +
    '    todos[i].className = ativo ? "passo ativo" : "passo";' +
    '    if (ativo) { todos[i].setAttribute("aria-current", "step"); }' +
    '    else { todos[i].removeAttribute("aria-current"); }' +
    '  }' +
    // OS PAINÉIS DO VERBETE NÃO SÃO DESTA FUNÇÃO (31/10/2026). O seletor era a página toda, e
    // ela escondia tudo o que não fosse «passo-<qual>» — o que, com a tira do verbete no
    // documento, apagava os seis passos dele a cada clique na turma.
    '  var paineis = document.querySelectorAll("#turmas-paineis .passo-painel");' +
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
    // FORA DA EDIÇÃO, O FORMULÁRIO É NOVO (19/10/2026). O `sessionStorage` guardava o
    // último preenchimento para sobreviver aos recarregamentos das operações — e isso
    // fazia a rubrica e a associação de uma turma anterior reaparecerem sem ninguém ter
    // clicado em «Editar». O dono do produto foi explícito: o que não está em edição
    // nasce vazio. A memória só volta a valer quando o modo edição está ligado.
    '  if (!modoEditando()) {' +
    '    try { sessionStorage.removeItem(CHAVE_ESTADO); } catch (err) {}' +
    '    return;' +
    '  }' +
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
    // gravados. O `aoOk` aponta o formulário para a turma gravada. No caminho de EDIÇÃO,
    // voltar atrás edita a que existe; no de CRIAÇÃO, os passos 2 e 3 começam vazios — é o
    // que o dono do produto pediu: sem «Editar» clicado, nada vem preenchido.
    'function avancarParaRubricas(d){' +
    '  try {' +
    '    var e = estadoDoFormulario();' +
    '    if (d && d.id) {' +
    '      sessionStorage.setItem("producao:vinc-turma", d.id);' +
    '      e.turma = e.turma || {};' +
    '      e.turma.__derivar = d.id;' +
    // O MODO VEM DA RESPOSTA, e o «criar» NÃO LIGA A EDIÇÃO (19/10/2026). Antes este
    // caminho gravava `producao:editando` mesmo quando a turma acabara de NASCER — e era
    // isso que fazia a rubrica e a associação de uma turma anterior reaparecerem no
    // processo de criar. Só «editar» e «derivar» ligam o modo; «criar» segue vazio.
    '      e.turma.__modo = d.modo === "derivar" ? "derivar" : d.modo === "editar" ? "editar" : "criar";' +
    '      if (d.modo === "editar" || d.modo === "derivar") sessionStorage.setItem("producao:editando", "turma");' +
    '      else sessionStorage.removeItem("producao:editando");' +
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
    '  var ol = document.querySelector("#sec-turmas ol.passos");' +
    '  if (ol) ol.setAttribute("data-editando", editando ? "sim" : "nao");' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("#sec-turmas button.passo") : null;' +
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
    // O GRUPO de um destino: o título do `coluna-grupo` que o contém (26/10/2026). Antes era o
    // `<h2>` anterior — e o menu passou a ter grupos da MESMA peça da coluna do sistema, com o
    // nome dentro de um `<span>` do botão. Lido do próprio documento, e não de uma segunda
    // lista no JavaScript: a lista dos grupos já está no HTML.
    'function grupoDoLink(a) {' +
    '  var g = a.closest && a.closest(".coluna-grupo");' +
    '  var t = g && g.querySelector(".coluna-titulo");' +
    '  var s = t && t.querySelector("span");' +
    '  return s ? s.textContent : "";' +
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
    // SÓ OS DESTINOS DE SECÇÃO, e SEM LHER A CLASSE (26/10/2026). A leitura era
    // `querySelectorAll(".lateral a")` e escrevia `className = "ativo"` / `className = ""` em
    // TODOS os links do menu — o que apagava a classe do «← Sistema Lastro» (que é um `<a>`
    // sem `data-secao`) e o deixava sem desenho. O `classList` mexe só na marca de atual.
    '  var links = document.querySelectorAll(".lateral a[data-secao]");' +
    '  for (var j = 0; j < links.length; j++) {' +
    '    if (links[j].getAttribute("data-secao") === visivel) {' +
    '      links[j].classList.add("ativo");' +
    // `aria-current` é o que diz ao leitor de ecrã qual é a secção ATUAL — a classe só
    // muda a cor. Sem isto, a folha anunciava sete destinos iguais.
    '      links[j].setAttribute("aria-current", "page");' +
    // A barra do celular diz onde se está — GRUPO e página, porque só o nome da página
    // deixa o professor sem saber a que grupo ela pertence («Curadorias» é de Pedagogia,
    // e isso não se adivinha).
    // O GRUPO DA PAGINA ACTUAL ACENDE-SE, como na coluna do sistema (26/10/2026): la e o
    // `data-atual` que poe o filete de ouro e a cor no titulo do grupo. Sem isto, o menu dos
    // Bastidores era o mesmo desenho mas nunca dizia «estas neste grupo».
    '      var todos = document.querySelectorAll(".lateral .coluna-grupo");' +
    '      var dono = links[j].closest(".coluna-grupo");' +
    '      for (var k = 0; k < todos.length; k++) {' +
    '        if (todos[k] === dono) todos[k].setAttribute("data-atual", "sim");' +
    '        else todos[k].removeAttribute("data-atual");' +
    '      }' +
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
    '    } else { links[j].classList.remove("ativo"); links[j].removeAttribute("aria-current"); }' +
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
    /*
 * ONDE O RECADO APARECE (22/10/2026). No TOPO do conteúdo ele fica fora do ecrã assim que a
 * pessoa está numa secção — e as secções são a página inteira. Medido no Chrome, com o
 * formulário dos professores à vista: o `#res` estava a `top: -19` e a altura da janela era
 * 493. Ou seja: «cadastrando…» (5 a 15 s, porque o cadastro escreve no repositório) e
 * «Erro: …» eram escritos onde ninguém os lia — o botão parecia morto.
 *
 * A regra passa a ser: o recado nasce no `.res` da secção VISÍVEL; o `#res` do topo fica para
 * o que não tem secção (a aparência, o portão). Uma função, e as duas que escrevem usam-na.
 */
'function alvoDoRecado() {' +
    '  var secao = document.querySelector("#conteudo .secao:not([hidden])");' +
    /* O RECADO DA SECÇÃO NÃO É O DO PASSO 1 (02/11/2026).
     *
     * O passo 1 (o exercício novo) tem um `.res` próprio, e é o PRIMEIRO da secção. O recado
     * geral — «falta a frase», «gravado — versão 7», a recusa da música — pertence ao verbete e
     * ao seu `[data-res=verbetes]`; entregá-lo ao primeiro `.res` punha-o dentro do passo 1, a
     * dizer coisas do exercício a quem estava a gravar a decomposição.
     *
     * O `[data-res=verbetes]` é o alvo por NOME, e o resto fica como estava: o primeiro `.res`
     * da secção serve as outras secções, que não têm widget nenhum lá dentro. Foi `provar-celula`
     * que apanhou o defeito — a recusa deixou de ser lida no sítio onde é escrita. */
    '  if (secao) {' +
    '    var doVerbete = secao.querySelector(".res[data-res=verbetes]");' +
    '    if (doVerbete) return doVerbete;' +
    '  }' +
    '  var proprio = secao ? secao.querySelector(".res") : null;' +
    '  return proprio || document.getElementById("res");' +
    '}' +
    // O mesmo elemento, e o recado anterior da OUTRA secção não fica a mentir: ao escolher um
    // alvo, os outros `.res` das secções são limpos.
    'function limparRecados() {' +
    '  var todos = document.querySelectorAll(".res[data-res]");' +
    '  for (var i = 0; i < todos.length; i++) { todos[i].className = "res"; todos[i].textContent = ""; }' +
    '}' +
    'function recado(estado, texto) {' +
    '  limparRecados();' +
    '  var res = alvoDoRecado();' +
    '  if (!res) return;' +
    '  res.className = "res" + (estado ? " " + estado : ""); res.textContent = texto;' +
    // O RECADO TRAZ-SE À VISTA — o mínimo necessário. `nearest` não mexe na página quando o
    // recado já está visível, e encosta-o à borda quando não está: medido, o cadastro com a
    // janela curta punha a mensagem a `top: 596` numa janela de 493. A folha tem
    // `scroll-behavior: smooth`, e é por isso que o movimento é animado — quem mede tem de
    // esperar por ele (as provas esperam; a pessoa vê-o acontecer).
    '  if (res.scrollIntoView) {' +
    '    try { res.scrollIntoView({block: "nearest"}); } catch (err) { res.scrollIntoView(); }' +
    '  }' +
    '}' +
    /*
 * O BOTÃO É O PRIMEIRO RECADO (22/10/2026). O `.res` ao lado do formulário é o segundo — mas o
 * que a pessoa tem debaixo do dedo é o botão, e é ele que muda: fica desabilitado e passa a
 * dizer «cadastrando…». Sem isto, o cadastro de professor (5 a 15 s, porque escreve no
 * repositório) não dava sinal nenhum, e um segundo clique criava um pedido concorrente. O
 * rótulo anterior é guardado e devolvido no erro; no sucesso a página recarrega e o botão vem
 * novo do servidor.
 */
// O BOTÃO OCUPADO — uma função, dois usos (o cadastro e a edição do nome). Guarda o rótulo
// de antes e devolve-o: no erro o botão volta a ser o que era, e a pessoa pode tentar de novo.
'function ocuparBotao(form, rotulo) {' +
    '  if (!form) return null;' +
    '  var botao = form.querySelector("button[type=submit]");' +
    '  if (!botao) return null;' +
    '  var antes = {botao: botao, rotulo: botao.textContent};' +
    '  botao.disabled = true; botao.textContent = rotulo;' +
    '  return antes;' +
    '}' +
    'function liberarBotao(antes) {' +
    '  if (antes && antes.botao) { antes.botao.disabled = false; antes.botao.textContent = antes.rotulo; }' +
    '}' +
    'function postar(id, corpo) {' +
    '  corpo.token = TOKEN;' +
    '  var form = document.getElementById(id);' +
    '  var antes = ocuparBotao(form, "cadastrando...");' +
    '  function devolverRotulo() { liberarBotao(antes); }' +
    '  recado("", "cadastrando...");' +
    '  return fetch(id === "form-prof" ? "/api/bastidores/professor" : "/api/bastidores/aluna", {' +
    '    method: "POST",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { devolverRotulo(); recado("erro", "Erro: " + (d.erro || "desconhecido")); }' +
    '  }).catch(function(err){ devolverRotulo(); recado("erro", "Erro: " + err.message); });' +
    '}' +
    /*
     * O «EDITAR» DO PROFESSOR PRINCIPAL ENTRA NO FORMULÁRIO (22/10/2026).
     *
     * Antes, ele abria um `prompt()` do navegador — a janelinha que parece um alert, com uma
     * linha e sem contexto. O ato, porém, é o mesmo do cadastro: muda-se um nome num formulário
     * e grava-se. Então o formulário passa a ter DOIS modos, e o modo é declarado nele mesmo
     * (o campo oculto `prof-modo`), não numa variável solta: o estado que a tela mostra está
     * na tela.
     *
     * O QUE MUDA NO MODO DE EDIÇÃO: os dois campos vêm preenchidos, a SENHA sai de cena (o nome
     * do principal não se muda por senha nova) e o botão diz o que vai fazer. O «Cancelar» volta
     * ao cadastro — vazio, com a senha de volta e o botão com o rótulo de antes.
     *
     * E QUEM PODE: só o principal. O botão «Editar» nasce apenas na linha dele (as outras têm
     * «Excluir», e o principal não tem — quem responde pela escola não se apaga). Isto é a
     * tela; o servidor tem a sua própria guarda em `/api/bastidores/professor` (DELETE) e em
     * `/api/bastidores/dono`.
     */
    'function modoDoProfessor() {' +
    '  return document.getElementById("prof-modo") ? document.getElementById("prof-modo").value : "";' +
    '}' +
    'function editarProfessor(nome) {' +
    '  var f = document.getElementById("form-prof");' +
    '  if (!f) return;' +
    '  var inteiro = String(nome || "").replace(/\s+/g, " ").trim();' +
    '  if (!inteiro) return;' +
    // A divisão é a MESMA do cadastro, ao contrário: a primeira palavra é o nome e o resto é o
    // sobrenome/apelido. O que se grava é a junção das duas — o mesmo nome que estava na lista,
    // se ninguém mexer.
    '  var corte = inteiro.indexOf(" ");' +
    '  document.getElementById("pnome").value = corte === -1 ? inteiro : inteiro.slice(0, corte);' +
    '  document.getElementById("psobrenome").value = corte === -1 ? "" : inteiro.slice(corte + 1);' +
    '  var oculto = document.getElementById("prof-modo");' +
    '  if (oculto) oculto.value = "dono";' +
    '  var senha = document.getElementById("prof-senha");' +
    '  if (senha) senha.hidden = true;' +
    '  var nota = document.getElementById("prof-nota");' +
    '  if (nota) nota.hidden = false;' +
    '  var b = document.getElementById("prof-enviar");' +
    '  if (b) b.textContent = "Gravar o novo nome";' +
    '  var c = document.getElementById("prof-cancelar");' +
    '  if (c) c.hidden = false;' +
    '  recado("", "");' +
    // O foco vai para o campo que se vai mudar: quem clicou em «Editar» quer escrever ali.
    '  var alvo = document.getElementById("pnome");' +
    '  if (alvo && alvo.focus) { alvo.focus(); if (alvo.select) alvo.select(); }' +
    '  if (alvo && alvo.scrollIntoView) { try { alvo.scrollIntoView({block: "nearest"}); } catch (err) {} }' +
    '}' +
    'function sairDaEdicaoDoProfessor() {' +
    '  var oculto = document.getElementById("prof-modo");' +
    '  if (oculto) oculto.value = "";' +
    '  ["pnome", "psobrenome", "psenha"].forEach(function (id) {' +
    '    var el = document.getElementById(id);' +
    '    if (el) el.value = "";' +
    '  });' +
    '  var senha = document.getElementById("prof-senha");' +
    '  if (senha) senha.hidden = false;' +
    '  var nota = document.getElementById("prof-nota");' +
    '  if (nota) nota.hidden = true;' +
    '  var b = document.getElementById("prof-enviar");' +
    '  if (b) b.textContent = "Cadastrar professor";' +
    '  var c = document.getElementById("prof-cancelar");' +
    '  if (c) c.hidden = true;' +
    '  recado("", "");' +
    '}' +
    'document.getElementById("form-prof").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  var nome = document.getElementById("pnome").value.trim();' +
    '  var sobrenome = document.getElementById("psobrenome").value.trim();' +
    '  if (modoDoProfessor() === "dono") {' +
    '    var inteiro = (nome + (sobrenome ? " " + sobrenome : "")).replace(/\s+/g, " ").trim();' +
    '    if (!inteiro) { recado("erro", "Erro: informe o nome do professor."); return; }' +
    '    var form = document.getElementById("form-prof");' +
    '    var antes = ocuparBotao(form, "gravando...");' +
    '    enviar("/api/bastidores/dono", {nome: inteiro}, "gravando o novo nome...", true)' +
    '      .then(function () { liberarBotao(antes); }, function () { liberarBotao(antes); });' +
    '    return;' +
    '  }' +
    '  postar("form-prof", {nome: nome, sobrenome: sobrenome,' +
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
    '  recado("", mensagem);' +
    '  var res = alvoDoRecado();' +
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
    '    else { recado("erro", "Erro: " + (d.erro || "desconhecido")); }' +
    '  }).catch(function(err){ recado("erro", "Erro: " + err.message); });' +
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
    /* O `form-termo` SAIU COM A SECÇÃO DO VOCABULÁRIO (01/11/2026). O cadastro de exercício
     * vive agora num sítio só — o passo 1 do verbete —, e quem o grava é o handler do «Seguir →»
     * (`criarExercicioDoPasso1`). Dois handlers a POSTar na mesma rota era a redundância que esta
     * alteração veio eliminar; deixar o `getElementById` aqui rebentaria o script da página
     * inteira no primeiro carregamento (`null.addEventListener`). */
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
    '  if (saiu.length) {' +
    '    recado("erro", "Já estão noutra turma desta modalidade: " + saiu.join("; ") + ".");' +
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
    // As ALUNAS são fichas: limpam e voltam a marcar.
    '  [["esc-alunas", c.alunas || []]].forEach(function(par){' +
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
    '    [["esc-alunas"]].forEach(function(par){' +
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
    // FORA DA EDIÇÃO, O BLOCO NASCE VAZIO (19/10/2026). Os chips da turma que estava em
    // foco sobreviviam ao passo 3 e pareciam associação já feita. Em edição, os chips
    // são os dela; em criação, o bloco espera o primeiro «Associar».
    '  var lista = document.getElementById("vinc-conteudos");' +
    '  if (lista) {' +
    '    var editando = modoEditando();' +
    '    var fonte = null;' +
    '    if (editando) {' +
    '      Array.prototype.slice.call(document.querySelectorAll(".conteudos-da-turma")).forEach(function(d){' +
    '        if (d.getAttribute("data-de") === id) fonte = d;' +
    '      });' +
    '    }' +
    '    lista.innerHTML = (fonte && fonte.innerHTML.trim())' +
    '      ? fonte.innerHTML' +
    '      : "<span class=\\"dono\\">(nenhum conteúdo associado)</span>";' +
    '  }' +
    // --- o bloco da RÉGUA: diz com que rubrica a turma está hoje ---------------------
    '  var r = rubricaDaTurma(t);' +
    '  var selR = document.getElementById("vinc-rubrica");' +
    // A RÉGUA DA TURMA NÃO SE SUGERE FORA DA EDIÇÃO (19/10/2026). Antes o `select` era
    // preenchido quando estava vazio — e quem abria o passo 3 para criar uma turma via a
    // rubrica de outra já escolhida. O dono do produto pediu o contrário: sem «Editar»,
    // nada vem escolhido. Em edição, `ajustarTurma` já põe a régua desta turma.
    '  if (selR && modoEditando() && !selR.value && r && RUBRICAS.some(function(x){ return x.id === r.id; })) selR.value = r.id;' +
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
    // ================= OS VERBETES DA NOTAÇÃO (28/10/2026) ==================
    // A tela CARREGA o alfabeto do servidor (que o lê do repositório) e monta as listas de
    // exercícios, posições e direções a partir dele — não de cópias escritas aqui, que
    // divergiriam do dado no primeiro termo novo.
    'var VERBETES = null;' +
    // O RÓTULO DA CATEGORIA PASSOU A SER DO SCRIPT (28/10/2026). Ele era uma `var` local dentro
    // de `carregarVerbetes`, e o «+» precisa dele para nomear o grupo do exercício que acabou de
    // criar — antes de o deploy trazer a lista do repositório. Um mapa só, dois leitores.
    'var ROTULO_DE_CATEGORIA = {passo: "Passos", salto: "Saltos", ligacao: "Ligações", giro: "Giros"};' +
    // A RESPOSTA NEM SEMPRE É JSON. Quando a rota falha, chega uma página de erro — e o
    // `.json()` rebenta com «Unexpected token <», que não diz nada a quem está a usar a tela.
    // Aqui lê-se o TEXTO primeiro e só depois se tenta o JSON, para o recado poder ser o certo.
    'function lerResposta(r){' +
    '  return r.text().then(function(t){' +
    '    try { return JSON.parse(t); }' +
    '    catch (e) { return {ok: false, erro: "a resposta não veio em condições (HTTP " + r.status + ")"}; }' +
    '  });' +
    '}' +
    // ================= O TRECHO, O COMPASSO E A NOTAÇÃO (28/10/2026) ================
    // Três coisas dizem o mesmo trecho em três línguas: a CONTAGEM (a do compasso), os SINAIS
    // BENESH (a da notação) e O QUE ACONTECE (a do português). As duas primeiras compõem-se; a
    // terceira escreve-se, e vem sugerida do dicionário da modalidade.
    //
    // O que esta secção resolve, e a pesquisadora viu na tela:
    //   · a contagem era um campo de escrita livre — e não pode ser: ela vai de 1 até o
    //     numerador do compasso e recomeça no seguinte, e a célula começa onde a anterior da
    //     mesma direção acabou. As opções são calculadas, e por isso o compasso não fica com
    //     buraco;
    //   · o «bloco» era texto a escrever — e «bloco» JÁ queria dizer Solo · Barra · Centro no
    //     plano. O campo passa a chamar-se Sinais Benesh e compõe-se: categoria, e os sinais
    //     pela ordem, cada um com o nome;
    //   · havia duas tabelas a dizer a mesma coisa. Passa a haver uma.
    'var CELULAS = {};' +
    'var SINAIS = [];' +
    // O SINAL EM TROCA (02/11/2026). Um arranjo de barra tem dez, quinze, vinte sinais, e corrigir
    // o terceiro obrigava a apagar do terceiro para a frente e a reescrever tudo — ela descreveu-o
    // como «inviável e frustrante», e é. Com o índice guardado aqui, a sequência passa a poder
    // corrigir-se **no lugar**: clica-se na ficha que se quer trocar, clica-se no sinal novo na
    // paleta, e o resto da ordem fica onde estava.
    'var SINAL_EM_TROCA = null;' +
    // O TRECHO EM COMPOSIÇÃO TEM ESTADO PRÓPRIO (28/10/2026). A direção e a orientação ficam
    // depois de acrescentar — é o que permite emendar o en croix sem reescolher a direção a cada
    // trecho —, e só os sinais, a contagem e a frase se limpam.
    'var DIRECAO = "";' +
    'var ORIENTACAO = "";' +
    'var CONTAGEM = "";' +
    // Quantas vezes o trecho em composição acontece. Limpa-se como a contagem, no fim de cada
    // trecho — é do trecho, e não do verbete.
    'var REPETICOES = 1;' +
    // O método do verbete: vazio quer dizer «herda o do plano» (02/11/2026).
    'var METODO = "";' +
    'var MUSICA_EM_FOCO = "";' +
    /* A MÚSICA QUE FOI ABERTA PARA EDITAR (02/11/2026).
     *
     * O RELATO DELA, e o mecanismo por trás: «ao tentar realizar a evolução de um exercício
     * existente (transformando um Plié de 8 tempos em um novo Plié expandido de 16 tempos (…)), o
     * sistema criou um novo registro e manteve o registro antigo». Não havia INSERT nem UPDATE: a
     * CHAVE do registo É «tempos|compasso», e mudar os tempos muda a chave. Editar um verbete e
     * esticar a música gravava ao lado, e o de 8 tempos ficava lá.
     *
     * Com esta chave guardada, gravar passa a SUBSTITUIR: a música de onde se veio sai, e o
     * verbete fica com uma só. Quem quiser as duas — a de 8 e a de 16 — tem o «Guardar como música
     * nova», que é explícito; não é o que acontece por omissão numa edição.
     */
    'var MUSICA_ABERTA = "";' +
    'var EXERCICIO_EM_FOCO = "";' +
    // A FRASE DO VERBETE (31/10/2026). É uma só por exercício, e não uma por trecho: era o campo
    // que obrigava a reescrever a definição a cada trecho. `FRASE_ANTERIOR` guarda o que o
    // sistema escreveu no campo, para a sugestão não voltar por cima do que a professora ajustou.
    'var FRASE = "";' +
    'var FRASE_ANTERIOR = "";' +
    // OS SEIS PASSOS, E A EDIÇÃO (31/10/2026 — seis desde 02/11/2026). `PASSO` diz
    // onde se está; `EM_EDICAO` é `null` quando se está a compor um trecho NOVO e o número do
    // trecho quando se está a corrigir um que já lá está. A edição atravessa os DOIS passos do
    // trecho — é por isso que ela é um estado, e não um botão. `ULTIMO_PASSO` vem da lista do
    // servidor, para o limite não ser um número escrito à mão num sítio onde ele já não vale.
    'var PASSOS = ' + JSON.stringify(PASSOS_DO_VERBETE.map(([n]) => Number(n))) + ';' +
    // OS RÓTULOS VÃO JUNTOS (02/11/2026). A recusa da gravação tem de dizer em que passo se
    // corrige — e escrever «passo 2» à mão num sítio onde a lista já numera é a receita para o
    // dia em que se acrescentar um passo e a mensagem passar a apontar para outro.
    'var PASSOS_TITULOS = ' + JSON.stringify(PASSOS_DO_VERBETE) + ';' +
    'function passoPorRotulo(trecho){' +
    '  var alvo = String(trecho || "").toLowerCase();' +
    '  for (var i = 0; i < PASSOS_TITULOS.length; i++) {' +
    '    if (String(PASSOS_TITULOS[i][1]).toLowerCase().indexOf(alvo) === 0) return PASSOS_TITULOS[i][0];' +
    '  }' +
    '  return "";' +
    '}' +
    'function rotuloDoPasso(n){' +
    '  for (var i = 0; i < PASSOS_TITULOS.length; i++) {' +
    '    if (String(PASSOS_TITULOS[i][0]) === String(n)) return PASSOS_TITULOS[i][1];' +
    '  }' +
    '  return "";' +
    '}' +
    // OS PASSOS DO TRECHO TAMBÉM VÊM DO SERVIDOR: a edição de um trecho leva ao primeiro deles, e
    // uma lista escrita à mão no script divergiria da que desenha a tira.
    'var PASSOS_DO_TRECHO = ' + JSON.stringify(PASSOS_DO_TRECHO) + ';' +
    'var ULTIMO_PASSO = PASSOS[PASSOS.length - 1];' +
    'var PASSO = 1;' +
    'var EM_EDICAO = null;' +
    'function direcoesDaGramatica(){ return (VERBETES && VERBETES.direcoes) || []; }' +
    'function orientacoesDaGramatica(){ return (VERBETES && VERBETES.orientacoes) || []; }' +
    'function nomeDaDirecao(termo){' +
    '  var achado = null;' +
    '  direcoesDaGramatica().forEach(function(x){ if (x.termo === termo) achado = x; });' +
    '  return achado ? achado.nome : termo;' +
    '}' +
    // O NOME DA ORIENTAÇÃO, PELA MESMA REGRA (02/11/2026). Ela vem em francês no dado — `en-face`,
    // `croise` — e a listagem tem de dizer «de frente». É a segunda lista da gramática, e a função
    // é a mesma com a outra lista: quem escrever uma terceira regra de nomes vai divergir das duas.
    'function nomeDaOrientacao(termo){' +
    '  var achado = null;' +
    '  orientacoesDaGramatica().forEach(function(x){ if (x.termo === termo) achado = x; });' +
    '  return achado ? achado.nome : termo;' +
    '}' +
    // O NUMERADOR do compasso — 4 em «4/4», 2 em «2/4». É ele que diz quantos tempos cabem
    // num compasso, e é a única coisa da música que a contagem precisa de saber.
    'function numeradorDoCompasso(){' +
    '  var v = (document.getElementById("vbcompasso") || {}).value || "4/4";' +
    '  return Number(String(v).split("/")[0]) || 4;' +
    '}' +
    'function temposTotais(){ return Number((document.getElementById("vbtempos") || {}).value) || 0; }' +
    'function temposDaContagem(c){' +
    '  var p = String(c || "").split("–");' +
    '  return p.length === 2 ? Number(p[1]) - Number(p[0]) + 1 : 1;' +
    '}' +
    // A REPETIÇÃO É DA CÉLULA (02/11/2026). A `contagem` é a de UMA execução; o `repeticoes` diz
    // quantas vezes ela acontece, e o que a célula ocupa é o produto. Ficou fora da conta no dia
    // em que foi inventada? Não pode — é a mesma conta que fecha a música.
    'function repeticoesDaCelula(c){' +
    '  var n = Number((c && c.repeticoes) || 1);' +
    '  return (isFinite(n) && n >= 1) ? Math.floor(n) : 1;' +
    '}' +
    'function temposDaCelula(c){ return temposDaContagem(c && c.contagem) * repeticoesDaCelula(c); }' +
    // AS PISTAS POR CATEGORIA (02/11/2026). `Perna` e `Braço` correm EM PARALELO; `à frente` e
    // `atrás` somam-se, porque são o mesmo corpo em tempos diferentes. O que o exercício ocupa da
    // música é a pista MAIS LONGA — e era a soma em linha que fazia o `Plié` fechar em 12 numa
    // música de 8.
    'function pistasDe(celulas){' +
    '  var pistas = {}, ordem = [];' +
    '  Object.keys(celulas || {}).forEach(function(d){' +
    '    (celulas[d] || []).forEach(function(c){' +
    '      var k = String((c && c.categoria) || "").trim() || "(sem categoria)";' +
    '      if (ordem.indexOf(k) === -1) ordem.push(k);' +
    '      pistas[k] = (pistas[k] || 0) + temposDaCelula(c);' +
    '    });' +
    '  });' +
    '  return {pistas: pistas, ordem: ordem};' +
    '}' +
    'function coberturaDe(celulas){' +
    '  var p = pistasDe(celulas).pistas, maior = 0;' +
    '  Object.keys(p).forEach(function(k){ if (p[k] > maior) maior = p[k]; });' +
    '  return maior;' +
    '}' +
    // AS OPÇÕES DE CONTAGEM QUE CABEM. A primeira célula de uma direção começa em 1; as
    // seguintes continuam de onde a anterior acabou, ou recomeçam em 1 quando o compasso fechou.
    // É a convenção que os quatro verbetes já seguem — verificada, não inventada: o Plié grava
    // «1–4, 1–4» (um compasso cada) e o Port de bras «1–3» quatro vezes (quatro compassos de 3/4).
    // A CONTAGEM CONTINUA ONDE O COMPASSO ESTÁ, E NÃO ONDE A DIREÇÃO ESTÁ (29/10/2026). Esta
    // função contava só as células da PRÓPRIA direção e recomeçava em 1 quando ela não tinha
    // nenhuma — mas o compasso é corrido, soma-se por todas as direções. Com um battement frappé
    // de 16 tempos em 2/4, «à frente» e «ao lado» ficavam AMBOS com «compasso 1, contagem 1»:
    // dois trechos no mesmo tempo, e a página da aula a dizer duas coisas diferentes para o mesmo
    // instante. A conta certa soma, na ordem da gramática, tudo o que vem antes — as direções
    // anteriores inteiras e as células que esta direção já tem, porque a nova entra no fim dela.
    // Assim o início da contagem e a coluna do compasso saem da MESMA soma, e não podem divergir.
    // A ORDEM É A DO REGISTO, E NÃO A DA GRAMÁTICA (01/11/2026). Iterava-se a lista das três
    // direções do alfabeto — e uma célula SEM direção não era visitada, o que fazia o «antes»
    // somar o verbete inteiro. Com a chave vazia como balde legítimo, a conta passa a correr
    // sobre as chaves que existem, na ordem em que foram escritas. A semântica é a de antes:
    // soma-se o balde e só depois se pára — é o que faz o compasso cair no tempo certo.
    // A PISTA MANDA, NÃO A DIREÇÃO (02/11/2026). Era aqui que `à frente` e `ao lado` se empurravam:
    // a versão anterior somava TUDO o que vinha antes, de todas as categorias, para achar onde o
    // novo trecho começa. Com as pistas, a conta corre só sobre a categoria do trecho — é o que
    // permite ao braço recomeçar em 1 enquanto a perna continua no 2º compasso.
    'function temposAntesDaPista(cat){' +
    '  var t = 0;' +
    '  var chaves = Object.keys(CELULAS);' +
    '  for (var i = 0; i < chaves.length; i++) {' +
    '    (CELULAS[chaves[i]] || []).forEach(function(c){' +
    '      if (String((c && c.categoria) || "").trim() === cat) t += temposDaCelula(c);' +
    '    });' +
    '  }' +
    '  return t;' +
    '}' +
    // O PASSO DA GRADE DA MÉTRICA (02/11/2026). O compasso diz duas coisas: quantos tempos cabem
    // (o numerador) e COMO se agrupam. Nos simples (2/4, 3/4, 4/4, 2/2) cada tempo é um pulso, e
    // qualquer fim de trecho cai numa fronteira. Nos COMPOSTOS (6/8, 9/8, 12/8) o pulso vale TRÊS
    // tempos: 6/8 são dois pulsos de três, 9/8 são três, 12/8 são quatro. Fechar um trecho em
    // «1–4» de 6/8 é fechar a meio de um pulso — e era o que a lista antiga oferecia, porque só
    // lia o numerador.
    //
    // O QUE NÃO SE PROÍBE: um trecho de «1–2» num compasso composto é uma síncope, e existe. O
    // que muda é a OFERTA — os fins que fecham pulso vêm primeiro, e a lista pára no fim do
    // compasso. O professor escolhe; não lhe escondemos a música.
    'function passoDaGrade(){' +
    '  var v = (document.getElementById("vbcompasso") || {}).value || "4/4";' +
    '  var p = String(v).split("/");' +
    '  var n = Number(p[0]) || 4, d = Number(p[1]) || 4;' +
    '  return (d === 8 && n % 3 === 0) ? 3 : 1;' +
    '}' +
    // COMO SE LÊ O COMPASSO EM PORTUGUÊS. A nota do passo 3 dizia só «N tempos em X» — e «6
    // tempos em 6/8» não diz a ninguém que são DOIS pulsos de três. Passa a dizer.
    'function leituraDoCompasso(){' +
    '  var v = (document.getElementById("vbcompasso") || {}).value || "4/4";' +
    '  var p = String(v).split("/");' +
    '  var n = Number(p[0]) || 4, d = Number(p[1]) || 4;' +
    '  if (d === 8 && n % 3 === 0) {' +
    '    var pulsos = n / 3;' +
    '    return v + " — " + (pulsos === 1 ? "um pulso" : pulsos + " pulsos") + " de três";' +
    '  }' +
    '  var quantos = n === 2 ? "dois" : n === 3 ? "três" : n === 4 ? "quatro" : String(n);' +
    '  return v + " — " + (n === 1 ? "um pulso" : quantos + " pulsos") + " de dois";' +
    '}' +
    'function opcoesDeContagem(cat){' +
    '  var n = numeradorDoCompasso();' +
    '  var passo = passoDaGrade();' +
    // A CÉLULA QUE SE ESTÁ A CORRIGIR NÃO CONTA (31/10/2026). A conta soma a pista, e a célula em
    // edição JÁ está na lista — contá-la empurrava a contagem para o tempo seguinte e o trecho
    // mudava de sítio só por se abrir a edição.
    '  var antes = temposAntesDaPista(cat);' +
    '  if (EM_EDICAO) {' +
    '    var emCorrecao = (CELULAS[EM_EDICAO.dir] || [])[EM_EDICAO.k];' +
    '    if (emCorrecao && String((emCorrecao.categoria) || "").trim() === cat) antes -= temposDaCelula(emCorrecao);' +
    '  }' +
    '  var inicio = (antes % n) + 1;' +
    // OS QUE FECHAM PULSO VÊM PRIMEIRO, E OS OUTROS NÃO DESAPARECEM. Um trecho de «1–2» dentro de
    // um 6/8 é uma síncope, e existe — proibi-la seria proibir a música. O que a lista faz é
    // ORDENAR: à frente os fins que caem em fronteira de pulso, no fim os que caem a meio. Assim
    // quem quer o compasso inteiro vê «1–6» sem contar tempos, e quem quer a síncope continua a
    // tê-la.
    '  var alinhados = [], outros = [];' +
    '  for (var f = inicio + 1; f <= n; f++) {' +
    '    var alvo = inicio + "–" + f;' +
    '    if (passo === 1 || f % passo === 0 || f === n) alinhados.push(alvo); else outros.push(alvo);' +
    '  }' +
    '  return [String(inicio)].concat(alinhados, outros);' +
    '}' +
    // O COMPASSO DE CADA TRECHO, calculado. A conta corre na ordem em que o motor compõe — uma
    // direção de cada vez —, e é por isso que a coluna não se escreve: somam-se os tempos e o
    // compasso cai por si.
    // O COMPASSO CORRE POR TODOS OS TRECHOS, na ordem em que foram escritos (01/11/2026). Aqui
    // iterava-se `direcoesDaGramatica()` — as três do alfabeto —, e um trecho SEM direção não
    // entrava na conta: ficava com o compasso errado e não descontava os tempos dos seguintes.
    'function compassosDosTrechos(){' +
    '  var n = numeradorDoCompasso(), mapa = {};' +
    '  var relogios = {};' +
    '  Object.keys(CELULAS).forEach(function(d){' +
    '    (CELULAS[d] || []).forEach(function(c, k){' +
    // UM RELÓGIO POR PISTA (02/11/2026) — a mesma conta do motor. Com um relógio só, os braços do
    // `Plié`, que começam em 1, apareciam no compasso 3; e a tela contradizia o documento.
    '      var pista = String((c && c.categoria) || "").trim() || "(sem categoria)";' +
    '      var corridos = relogios[pista] || 0;' +
    '      mapa[d + ":" + k] = Math.floor(corridos / n) + 1;' +
    '      relogios[pista] = corridos + temposDaCelula(c);' +
    '    });' +
    '  });' +
    '  return mapa;' +
    '}' +
    // O QUE O VERBETE COBRE É A MAIOR PISTA (02/11/2026), e não a soma em linha. É a mesma régua
    // do motor e do validador; se as três divergissem, a tela diria «falta escrever» sobre um
    // verbete que a gravação aceita.
    'function cobertura(){ return coberturaDe(CELULAS); }' +
    /* UM BALDE VAZIO NÃO É UM DADO, E NÃO SE GUARDA (02/11/2026).
     *
     * DEFEITO MEDIDO, e ela viu-o como um 400: «a direção «devant» não tem célula». O editor
     * deixava ficar `CELULAS["devant"] = []` depois de o último trecho daquela direção sair —
     * pelo «×» ou por uma correção que mudou a direção. E um balde vazio é INVISÍVEL: a tabela
     * percorre as células, e zero células não desenham linha nenhuma. Ela nunca escolheu «devant»;
     * o balde é que lá ficou.
     *
     * A validação do servidor está certa ao recusar — um verbete que declara uma direção e não diz
     * o que nela acontece é um verbete pela metade. O que estava errado era o editor MANDÁ-LO. */
    'function limparBaldesVazios(){' +
    '  Object.keys(CELULAS).forEach(function(d){' +
    '    if (!CELULAS[d] || !CELULAS[d].length) delete CELULAS[d];' +
    '  });' +
    '}' +
    // A TABELA ÚNICA. Uma linha por direção (o cabeçalho do bloco), as células dentro, e a
    // linha de acrescentar no fim. A direção que não é coberta aparece — é ela que responde ao
    // «o fouetté não vai às três» —, e a tela distingue «não vai» de «falta escrever».
    // A DECOMPOSIÇÃO É UMA LISTA, E NÃO TRÊS BLOCOS (01/11/2026). Havia um `<table>` por direção
    // do alfabeto — e um exercício que não vai a nenhuma das três (o `relevé`, que sobe e desce em
    // primeira posição) via TRÊS tabelas a dizer «este exercício não vai à frente / ao lado /
    // atrás». A pesquisadora leu isso como erro, e era: a tela afirmava três ausências para um
    // exercício que não tem eixo horizontal nenhum.
    //
    // A direção passou a ser um ATRIBUTO do trecho, e opcional: a lista mostra os trechos na ordem
    // em que foram escritos, e a coluna diz a direção quando ela existe. Sem direção, a coluna diz
    // «sem direção» — a ausência declarada, e não um vazio que se lê como esquecimento.
    'function pintarTabela(){' +
    '  var alvo = document.getElementById("vb-tabela");' +
    '  if (!alvo) return;' +
    '  var nomes = document.getElementById("vbnome");' +
    '  var nome = nomes ? nomes.value : "";' +
    '  if (!nome) {' +
    '    alvo.innerHTML = "<p class=\\"nota\\">Escolha o exercício para ver e escrever a decomposição dele.</p>";' +
    '    document.getElementById("vb-cobertura").textContent = "";' +
    '    pintarFica();' +
    '    return;' +
    '  }' +
    '  var mapa = compassosDosTrechos();' +
    '  var linhas = [];' +
    '  Object.keys(CELULAS).forEach(function(d){' +
    '    (CELULAS[d] || []).forEach(function(c, k){ linhas.push({dir: d, k: k, c: c}); });' +
    '  });' +
    '  if (!linhas.length) {' +
    // SEM TRECHOS, NÃO HÁ DECOMPOSIÇÃO A MOSTRAR. É o estado de um exercício que ainda não foi
    // decomposto — e é o que a pesquisadora pediu: a decomposição «nem aparece». Uma linha diz
    // porquê; três tabelas a dizer «não vai» era a tela a inventar três factos.
    '    alvo.innerHTML = "<p class=\\"nota\\">Ainda sem trechos. Escreva o primeiro no botão abaixo — ' +
    '      a direção, no passo 3, é opcional.</p>";' +
    '    pintarCobertura();' +
    '    pintarFica();' +
    '    return;' +
    '  }' +
    '  var html = "<table><thead><tr>" +' +
    '    "<th scope=\\"col\\">compasso</th><th scope=\\"col\\">contagem</th>" +' +
    '    "<th scope=\\"col\\">direção</th><th scope=\\"col\\">orientação</th>" +' +
    '    "<th scope=\\"col\\">notação</th><th scope=\\"col\\"></th>" +' +
    '    "</tr></thead><tbody>";' +
    '  linhas.forEach(function(t){' +
    '    var c = t.c;' +
    '    var orient = "";' +
    '    orientacoesDaGramatica().forEach(function(o){' +
    '      if (o.termo === (c.orientacao || "")) orient = o.nome;' +
    '    });' +
    // O TRECHO EM EDIÇÃO FICA MARCADO, E OS BOTÕES DELE MUDAM (31/10/2026). Um trecho que se está
    // a corrigir não é «mais um»; e o «×» sai, porque apagar o que se está a corrigir é a única
    // coisa que não pode acontecer por engano.
    '    var emMim = Boolean(EM_EDICAO && EM_EDICAO.dir === t.dir && EM_EDICAO.k === t.k);' +
    '    var chave = t.dir + ":" + t.k;' +
    '    var acoes = emMim' +
    '      ? "<span class=\\"nota\\">em edição</span> <button type=\\"button\\" class=\\"acao secundario pequena\\" data-cancelar-edicao=\\"1\\">Cancelar</button>"' +
    '      : "<button type=\\"button\\" class=\\"acao secundario pequena\\" data-editar=\\"" + chave +' +
    '        "\\" title=\\"editar este trecho\\">Editar</button> <button type=\\"button\\" class=\\"acao secundario pequena\\" data-tirar=\\"" + chave +' +
    '        "\\" title=\\"tirar este trecho\\">×</button>";' +
    // A REPETIÇÃO APARECE AO LADO DA CONTAGEM (02/11/2026): «1–2 ×2» lê-se como «1–2 duas vezes», e
    // uma coluna só para o número gastaria largura numa coisa que existe em poucas linhas.
    '    var vezes = repeticoesDaCelula(c) > 1 ? " <span class=\\"nota\\">×" + repeticoesDaCelula(c) + "</span>" : "";' +
    /* O «LÊ-SE» FICA ATRÁS DE UM CLIQUE, E UMA VEZ SÓ (02/11/2026).
     *
     * O QUE ELA VIU, e são duas queixas numa: «o texto descritivo fica excessivamente longo,
     * poluindo visualmente a tela» e «está repetindo em todos os trechos a mesma frase descritiva
     * definida na etapa 2».
     *
     * A SEGUNDA ERA UM DEFEITO DE COMPOSIÇÃO, e não de gosto: a `descricao` de cada célula é
     * «frase do exercício» + «lê-se: …». Numa barra de oito trechos, a mesma frase oito vezes — e
     * ela é a mesma porque é do EXERCÍCIO, escrita uma vez. O que é do TRECHO é o «lê-se».
     *
     * A PRIMEIRA resolve-se com um `<details>`: fechado por omissão, abre a pedido. É a peça que a
     * casa já usa (o histórico da curadoria, o menu) — `<summary>` é o botão, e a folha desenha-o.
     */
    '    var dito = soOLeSe(c.descricao);' +
    '    var oQue = dito ? "<details class=\\"dito\\"><summary>lê-se</summary><p>" +' +
    '      String(dito).split("\\n").join("<br>") + "</p></details>" : "";' +
    '    html += "<tr" + (emMim ? " class=\\"em-edicao\\"" : "") + "><td><strong>" + mapa[chave] + "</strong></td><td>" +' +
    '      c.contagem + vezes + "</td><td>" + (t.dir ? nomeDaDirecao(t.dir) : "<span class=\\"nota\\">sem direção</span>") +' +
    // A OMISSÃO DIZ-SE EM PORTUGUÊS (01/11/2026). Era «en face» escrito à mão aqui — a única
    // orientação que aparecia em francês na tabela, agora que todas as outras se leem em
    // português («pernas cruzadas»). A célula sem orientação é a que está de frente, e é isso
    // que ela passa a dizer.
    '      "</td><td>" + (orient || "<span class=\\"nota\\">de frente</span>") +' +
    /* O QUE ACONTECE FICA ATRÁS DE UM «LÊ-SE», E UMA VEZ SÓ (02/11/2026).
     *
     * O QUE ELA VIU, e são duas queixas numa: «o texto descritivo fica excessivamente longo,
     * poluindo visualmente a tela» e «está repetindo em todos os trechos a mesma frase descritiva
     * definida na etapa 2».
     *
     * A SEGUNDA ERA UM DEFEITO DE COMPOSIÇÃO, e não de gosto: a `descricao` de cada célula é
     * «frase do exercício» + «lê-se: …». Numa barra de oito trechos, a mesma frase oito vezes — e
     * ela é a mesma porque é do EXERCÍCIO, escrita uma vez. O que é do TRECHO é o «lê-se».
     *
     * A PRIMEIRA resolve-se com um `<details>`: fechado por omissão, abre a pedido. É a peça que a
     * casa já usa (o histórico da curadoria, o menu) — `<summary>` é o botão, e a folha desenha-o.
     */
    '      "</td><td><code>[" + (c.categoria || "") + ": " + (c.sinais || []).join(" ") +' +
    '      "]</code>" + oQue + "</td><td>" + acoes + "</td></tr>";' +
    '  });' +
    '  html += "</tbody></table>";' +
    '  alvo.innerHTML = html;' +
    '  pintarDesacordo();' +
    '  pintarCobertura();' +
    '  pintarDuplicar();' +
    // A PRÉVIA DO QUE FICA ESCRITO ACOMPANHA A TABELA: as duas leem as mesmas células, e uma
    // tabela que muda sem a prévia mudar seria a tela a dizer duas coisas do mesmo trecho.
    '  pintarFica();' +
    '}' +
    // A COBERTURA é uma frase só, e vale a pena tê-la à parte: a tabela e a cobertura mudam
    // juntas, e a cobertura também se lê quando ainda não há trechos.
    /* A MÚSICA EDITA-SE SEMPRE, E A DECOMPOSIÇÃO NÃO SE APAGA POR CAUSA DISSO (03/11/2026).
     *
     * O DEFEITO, medido em 02/11: com as quatro células do `Plié`, mudar os tempos de 8 para 16
     * deixava `CELULAS` em **0** e a cobertura em **0**. Meio segundo, sem aviso. A causa é a
     * chave — a música É `<tempos>|<compasso>`, e o rascunho carregava-se dela; uma chave nova não
     * tem células, e as da tela não eram as dela.
     *
     * A SAÍDA DE 02/11 FOI BLOQUEAR O CAMPO, E ELA REVERTEU-A (03/11/2026): «Remover o bloqueio
     * da música. O usuário deve ter total liberdade para editar as informações da música a
     * qualquer momento.» A regra que fica é a dela, e é melhor do que a trava: **a música muda, os
     * trechos ficam**. Quem mudou a música vê o desacordo no selo ao lado, e decide — corrige a
     * música, corrige os sinais, ou acrescenta o trecho que falta.
     *
     * QUEM GARANTE QUE OS TRECHOS NÃO SOMEM É `musicaMudou`, e não este comentário: ele NÃO chama
     * `carregarRascunho` (que recomeça a decomposição a partir da chave), repinta o que depende da
     * música — a cobertura, a tabela, o selo, a nota de substituição — e deixa `CELULAS` como
     * está. Trocar de EXERCÍCIO continua a recomeçar, e é outra coisa: outro exercício é outra
     * decomposição.
     */
    /* O QUE É DO TRECHO, E SÓ ISSO (02/11/2026). A `descricao` guardada é
     * `frase do exercício` + `\n` + `lê-se: …`. A primeira metade é do EXERCÍCIO e repete-se em
     * todos os trechos; a segunda é a leitura daquela notação. Devolve só a segunda.
     *
     * Quando a célula não tem «lê-se» — uma célula antiga, escrita antes de a frase ser composta
     * assim —, devolve a `descricao` inteira: mostrar o que há é melhor do que não mostrar nada. */
    'function soOLeSe(descricao){' +
    '  var t = String(descricao || "");' +
    '  var i = t.indexOf("Lê-se:");' +
    '  if (i >= 0) return t.slice(i);' +
    '  var l = t.split("\\n");' +
    '  return l.length > 1 ? l.slice(1).join("\\n") : "";' +
    '}' +
    /* O SELO DO DESACORDO (03/11/2026) — a peça que ela pediu, e o único sítio que decide quando
     * ela aparece. As três condições, e todas importam:
     *  · há música declarada (sem ela não há conta a fazer);
     *  · há ao menos um trecho (sem decomposição não há desacordo — «ainda não escrevi» não é o
     *    mesmo que «escrevi a mais», e um selo que aparece no formulário em branco assusta sem
     *    dizer nada);
     *  · e os tempos não batem.
     * A conta é `cobertura()`, a MESMA da tabela e da gravação: uma conta, um sítio.
     */
    'function pintarDesacordo(){' +
    '  var alvo = document.getElementById("vb-musica-desacordo");' +
    '  if (!alvo) return;' +
    '  var t = temposTotais(), c = cobertura();' +
    '  var temTrecho = Object.keys(CELULAS).some(function(d){ return (CELULAS[d] || []).length > 0; });' +
    '  alvo.hidden = !(t > 0 && temTrecho && c !== t);' +
    '}' +
    /* A MÚSICA MUDOU — E OS TRECHOS FICAM (03/11/2026).
     *
     * É a alternativa a `carregarRascunho`, que é quem recomeça a decomposição a partir da chave
     * da música. Este NÃO lê o alfabeto: actualiza a chave em foco, repinta o que depende dela e
     * deixa `CELULAS` exactamente como estava. Quem quer recomeçar tem o «Limpar» e a troca de
     * exercício; quem está a corrigir a música tem este.
     *
     * `EM_EDICAO` NÃO SE CANCELA, ao contrário do que fazia a troca de compasso: as células são as
     * mesmas, e cancelar a correcção a meio faria o «Guardar» seguinte acrescentar em vez de
     * substituir — um trecho duplicado sem ninguém o pedir.
     */
    'function musicaMudou(){' +
    '  var tempos = (document.getElementById("vbtempos") || {}).value || "";' +
    '  var compasso = (document.getElementById("vbcompasso") || {}).value || "";' +
    '  var nome = (document.getElementById("vbnome") || {}).value || "";' +
    '  MUSICA_EM_FOCO = (nome && tempos && compasso) ? tempos + "|" + compasso : "";' +
    '  pintarTabela();' +
    '  pintarDesacordo();' +
    '  pintarContagens();' +
    '  pintarTira();' +
    '  pintarPassos();' +
    '  pintarComoNova();' +
    '}' +
    'function pintarCobertura(){' +
    '  var t = temposTotais(), c = cobertura();' +
    '  var alvo = document.getElementById("vb-cobertura");' +
    '  if (!alvo) return;' +
    '  alvo.textContent = !t' +
    '    ? "Diga quantos tempos tem a música."' +
    '    : (c === t' +
    '        ? "Cobre os " + t + " tempos, em " + Math.ceil(t / numeradorDoCompasso()) + " compasso(s) de " + numeradorDoCompasso() + "."' +
    '        : (c < t ? "Cobre " + c + " de " + t + " tempos — falta escrever " + (t - c) + "."' +
    '                 : "Cobre " + c + " de " + t + " tempos — passa " + (c - t) + "."));' +
    // O «GRAVAR» DEPENDE DO QUE ESTÁ ESCRITO (02/11/2026), e quem muda o que está escrito é o
    // trecho que entra ou sai — todos passam por aqui a repintar a cobertura.
    '  pintarGravar();' +
    '}' +
    // O «DUPLICAR» SÓ APARECE QUANDO HÁ O QUE DUPLICAR, e sai de cena durante a correcção de um
    // trecho — pelo mesmo motivo que o «Acrescentar»: em correcção, o que se pode fazer vê-se.
    /* A SUBSTITUIÇÃO, DITA ANTES DE ACONTECER (02/11/2026).
     *
     * Gravar uma edição cuja música mudou **apaga a música de onde se veio** — e uma coisa que
     * apaga dados tem de o dizer antes, não depois. Aqui a nota diz duas coisas: qual é a música
     * que vai sair, e qual entra. E a caixa ao lado é a saída para quem quer as duas.
     *
     * Quando a música NÃO mudou não há nada a decidir, e a caixa não aparece: uma opção sempre
     * presente obriga a lê-la sempre, e a maioria das gravações é «corrigi uma célula».
     */
    'function musicaEmFoco(){' +
    '  var t = (document.getElementById("vbtempos") || {}).value || "";' +
    '  var c = (document.getElementById("vbcompasso") || {}).value || "";' +
    '  return (t && c) ? t + "|" + c : "";' +
    '}' +
    'function substituiMusica(){' +
    '  return Boolean(MUSICA_ABERTA) && MUSICA_ABERTA !== musicaEmFoco();' +
    '}' +
    'function pintarComoNova(){' +
    '  var caixa = document.getElementById("vb-como-nova-caixa");' +
    '  var antiga = document.getElementById("vb-como-nova-antiga");' +
    '  var nota = document.getElementById("vb-gravar-nota");' +
    '  var troca = substituiMusica();' +
    '  if (caixa) caixa.hidden = !troca;' +
    '  if (antiga) antiga.textContent = String(MUSICA_ABERTA).replace("|", " tempos em ");' +
    '  if (nota) {' +
    '    nota.textContent = !troca ? "" :' +
    '      ("Gravar substitui a música de " + String(MUSICA_ABERTA).replace("|", " tempos em ") +' +
    '       " por esta — o exercício fica com uma só." +' +
    '       " Marque a caixa se quiser ficar com as duas.");' +
    '  }' +
    '}' +
    /* SEM DECOMPOSIÇÃO NÃO HÁ VERBETE — e o botão di-lo antes do clique (02/11/2026).
     *
     * O PEDIDO DELA: «o botão "Gravar Verbete" só deve ser habilitado ou processado se houver
     * pelo menos uma linha consolidada na Tabela de Decomposição (Step 6). Não existe verbete
     * válido sem decomposição.»
     *
     * A RECUSA JÁ EXISTIA no `submit` («Este verbete ainda não tem nenhuma célula») e no
     * servidor (`validarVerbete`: «o verbete tem de ter ao menos um trecho»). Faltava o botão
     * DIZÊ-LO: um botão vivo que recusa ao fim de quatro passos é uma armadilha, e o professor
     * descobre no último passo o que podia saber no penúltimo.
     *
     * O `disabled` é do BOTÃO e não uma guarda do `submit`: as duas ficam. A guarda é a que vale
     * quando o JavaScript falha; o `disabled` é o que se vê.
     */
    'function pintarGravar(){' +
    '  var b = document.getElementById("vb-gravar");' +
    '  if (!b) return;' +
    '  var trechos = Object.keys(CELULAS).reduce(function(n, d){' +
    '    return n + ((CELULAS[d] || []).length); }, 0);' +
    '  b.disabled = trechos === 0;' +
    '  b.setAttribute("aria-disabled", trechos === 0 ? "true" : "false");' +
    '  if (trechos === 0) {' +
    '    b.title = "Um verbete sem decomposição não existe: acrescente ao menos um trecho no passo 6.";' +
    '  } else {' +
    '    b.removeAttribute("title");' +
    '  }' +
    // A NOTA DO RODAPÉ JÁ DIZ OUTRA COISA (a substituição da música), e por isso o aviso de «sem
    // trechos» vai para a nota do passo 6, que é onde os trechos se escrevem.
    '  var alvo = document.getElementById("vb-gravar-nota");' +
    '  if (alvo && trechos === 0 && !substituiMusica()) {' +
    '    alvo.textContent = "Ainda não há nenhum trecho. Escreva ao menos um na decomposição — é ' +
    '      ele que a página da aula mostra.";' +
    '  } else if (alvo && trechos === 0) {' +
    '    alvo.textContent = "Ainda não há nenhum trecho — e sem ele o verbete não existe.";' +
    '  } else {' +
    '    pintarComoNova();' +
    '  }' +
    '}' +
    'function pintarDuplicar(){' +
    '  var b = document.getElementById("vb-cel-duplicar");' +
    '  if (!b) return;' +
    '  b.hidden = (EM_EDICAO !== null) || !cobertura();' +
    '}' +
    // AQUI VIVIA `ondeOExercicioTem` (01/11/2026). Ela respondia «o exercício vai à frente noutra
    // música, mas não nesta» — a frase que separava «não vai» de «falta escrever» nos três blocos
    // por direção. Com a decomposição em lista, os blocos deixaram de existir e não há onde a
    // frase caiba: o que a lista diz é o que está escrito, e o que não está escrito não se
    // afirma. Se a distinção voltar a fazer falta, ela é uma coluna, não uma função morta.
    // ================= AS PÍLULAS (28/10/2026) ======================================
    // Uma pílula é um `<label class="escolha">` com uma caixa dentro — a peça que a folha já
    // tem. Não fica nenhuma lista suspensa no trecho: o que se escolhe vê-se, e o que está
    // escolhido vê-se marcado. O `<select>` de antes tinha um defeito que só aparece a usar:
    // escolher o segundo sinal APAGAVA o primeiro, porque uma escolha única não escreve uma
    // sequência. Com pílulas, cada clique ACRESCENTA ao fim.
    //
    // ESCOLHA ÚNICA E ESCOLHA MÚLTIPLA SÃO COISAS DIFERENTES, E A CAIXA DIZ QUAL É (29/10/2026).
    // Todas nasceram `checkbox`, e a direção e a orientação não são listas: são uma escolha. Com
    // `checkbox` e sem repintura, o navegador marcava a nova e DEIXAVA a anterior marcada — e a
    // tela passava a mostrar «à frente» marcada enquanto o estado dizia «atrás», que era a última
    // clicada. Foi exactamente o que a pesquisadora viu: «fiz à frente e apareceu como se eu
    // tivesse feito atrás». `unico` usa `radio`: o próprio navegador desmarca os outros, e o que
    // a tela mostra e o que se grava não podem divergir.
    'function pilulas(alvo, itens, escolhido, aoClicar, textoVazio, unico){' +
    '  var caixa = document.getElementById(alvo);' +
    '  if (!caixa) return;' +
    '  var legenda = caixa.querySelector("legend");' +
    '  var tipo = unico ? "radio" : "checkbox";' +
    // O `name` é o do GRUPO, e é o `id` da caixa: é ele que faz o `radio` ser exclusivo sem uma
    // linha de script, e é ele que dá ao leitor de tela a noção de «um entre estes».
    '  var nome = alvo;' +
    '  var partes = itens.map(function(it){' +
    '    var v = it.valor;' +
    '    var dentro = Array.isArray(escolhido) ? escolhido.indexOf(v) !== -1' +
    '                                           : (escolhido || "") === v;' +
    // O `titulo` É OPCIONAL (01/11/2026). A pílula diz o nome universal («pernas cruzadas») e
    // o título diz como a tradição lhe chama («croisé»): uma leitura à vista, a outra a um
    // gesto de rato. Sem `titulo`, o `title` não é escrito — e o navegador não inventa um.
    '    var titulo = it.titulo ? " title=\\"" + String(it.titulo).replace(/"/g, "&quot;") + "\\"" : "";' +
    '    return "<label class=\\"escolha\\"" + titulo + "><input type=\\"" + tipo + "\\"" +' +
    '      (unico ? " name=\\"" + nome + "\\"" : "") + (dentro ? " checked" : "") +' +
    '      " data-valor=\\"" + String(v).replace(/"/g, "&quot;") + "\\"><span>" +' +
    '      (it.glifo ? "<strong>" + it.glifo + "</strong> " : "") + it.nome + "</span></label>";' +
    '  }).join("");' +
    '  if (!itens.length) partes = "<span class=\\"nota\\">" + (textoVazio || "nada a escolher") + "</span>";' +
    '  caixa.innerHTML = (legenda ? legenda.outerHTML : "") + partes;' +
    '  Array.prototype.slice.call(caixa.querySelectorAll("input")).forEach(function(x){' +
    '    x.addEventListener("change", function(){ aoClicar(x.getAttribute("data-valor")); });' +
    '  });' +
    '}' +
    // A DIREÇÃO DO MEMBRO — três, e não oito. As outras cinco que aqui apareciam são ORIENTAÇÃO
    // DO CORPO, e estavam misturadas por causa da lista única do alfabeto.
    //
    // ESCOLHA ÚNICA: um trecho vai PARA UM lado. O glifo não aparece aqui (`+` à frente é o que a
    // NOTAÇÃO escreve, e a notação compõe-se nos sinais) — aqui escreve-se em português.
    // E É OPCIONAL (01/11/2026). O `relevé` sobe e desce em primeira posição, en face, nos pés:
    // não vai à frente, nem ao lado, nem atrás. Obrigar a escolher uma das três obrigava a
    // mentir sobre o exercício — e foi o que o alfabeto faz hoje com o `Plié`, que está todo em
    // `devant` sem ir a lado nenhum.
    //
    // A pílula «sem direção» NÃO é uma quarta direção: é a AUSÊNCIA declarada, e entra primeiro,
    // como o `en face` na orientação — a omissão aparece marcada quando nenhuma outra o está, e
    // um clique nela volta ao estado de partida.
    'function pintarDirecao(){' +
    '  pilulas("vb-dir", [{ valor: "", nome: "sem direção" }].concat(direcoesDaGramatica().map(function(d){' +
    '    return { valor: d.termo, nome: d.nome };' +
    '  })), DIRECAO, function(v){' +
    '    DIRECAO = v;' +
    '    CONTAGEM = "";' +
    '    pintarDirecao();' +
    '    pintarContagens();' +
    '    pintarTabela();' +
    '    pintarTira();' +
    '  }, "A gramática da modalidade não declara direções.", true);' +
    '}' +
    // A ORIENTAÇÃO DO CORPO — cinco, e a escolha única também. Mas aqui há uma diferença que a
    // tela tem de dizer: `en face` é a OMSIÃO. O estado guarda `""` para ela, porque é isso que
    // se grava (o campo `orientacao` só existe quando não é en face) — e por isso a pílula de
    // `en face` **aparece marcada** quando nenhuma outra está. Antes ela era a única que não
    // marcava nunca, e a pesquisadora leu isso como «não habilita»: era um clique que não dizia
    // nada, num campo onde todos os outros diziam.
    // A NOTA DO MÉTODO (02/11/2026). Diz três coisas, e nenhuma é opinião: se herda ou sobrepõe,
    // como os dois braços acima da cabeça se chamam NESTE método, e — quando o alfabeto não tem o
    // método — que a lacuna é declarada.
    'function pintarNotaDoMetodo(){' +
    '  var alvo = document.getElementById("vb-metodo-nota");' +
    '  if (!alvo) return;' +
    '  var linha = null;' +
    '  var tabela = (VERBETES && VERBETES.posicoesDeBracos) || [];' +
    '  for (var i = 0; i < tabela.length; i++) {' +
    '    if (String(tabela[i].conceito || "").indexOf("acima da cabeça") !== -1) { linha = tabela[i]; break; }' +
    '  }' +
    '  var partes = [];' +
    '  partes.push(METODO ? ("sobrepõe a metodologia do plano: " + METODO + ".")' +
    '                      : "herda a «Metodologia de referência» do plano.");' +
    '  if (linha) {' +
    '    var noMetodo = METODO ? linha[METODO] : null;' +
    '    if (!METODO) {' +
    '      partes.push("Os dois braços acima da cabeça: 3ª na escola francesa, 5ª na RAD.");' +
    '    } else if (noMetodo) {' +
    '      partes.push("Os dois braços acima da cabeça são a " + noMetodo + " em " + METODO + ".");' +
    '    } else {' +
    '      partes.push("O alfabeto não declara esta posição em " + METODO + " — a lacuna fica escrita.");' +
    '    }' +
    '  }' +
    '  alvo.textContent = partes.join(" ");' +
    '}' +
    'function pintarOrientacao(){' +
    '  pilulas("vb-orient", orientacoesDaGramatica().map(function(o){' +
    // O NOME É O UNIVERSAL, E A TRADIÇÃO VAI NO TÍTULO (01/11/2026). A pílula diz «pernas
    // cruzadas»; ao passar o rato, «croisé». Um rótulo só, e as duas leituras disponíveis —
    // sem uma segunda linha de texto a competir com o rótulo.
    '    return { valor: o.termo, nome: o.nome, titulo: o.tradicao };' +
    '  }), ORIENTACAO || "en-face", function(v){' +
    '    ORIENTACAO = (v === "en-face") ? "" : v;' +
    '    pintarOrientacao();' +
    '  }, "A gramática da modalidade não declara orientações.", true);' +
    '}' +
    // A CONTAGEM EM OFERTA, recalculada quando a direção muda. Só as que cabem.
    // A CONTAGEM NÃO DEPENDE DA DIREÇÃO (01/11/2026). Aqui havia um `if (!DIRECAO)`: sem direção,
    // a contagem oferecia ZERO opções e dizia «escolha a direção primeiro». Era o segundo erro da
    // pesquisadora no `relevé` — ela tinha a contagem, e a tela dizia que faltava. O compasso é
    // corrido; a direção não é a régua dele. O trecho sem direção conta como qualquer outro.
    'function pintarContagens(){' +
    '  var cat = categoriaEscolhida();' +
    '  var possiveis = opcoesDeContagem(cat);' +
    '  if (possiveis.indexOf(CONTAGEM) === -1) CONTAGEM = possiveis[0] || "";' +
    // A LEGENDA DIZ A PISTA E O AGRUPAMENTO (02/11/2026). Era «em que tempos do compasso»; agora
    // diz em que pista a contagem corre e como o compasso se agrupa — sem isso, «1–3» num 6/8 não
    // se distingue de um erro.
    '  var caixa = document.getElementById("vb-contagem");' +
    '  var legenda = caixa ? caixa.querySelector("legend") : null;' +
    '  if (legenda) {' +
    '    legenda.innerHTML = "Contagem — a pista de " + cat +' +
    '      " <span class=\\\"nota\\\">— " + leituraDoCompasso() + ", e cada pista conta o seu tempo</span>";' +
    '  }' +
    '  pilulas("vb-contagem", possiveis.map(function(o){ return { valor: o, nome: o }; }), CONTAGEM,' +
    '    function(v){ CONTAGEM = v; pintarContagens(); },' +
    '    "a pista de " + cat + " já tem os tempos todos preenchidos", true);' +
    // A CONTAGEM É O OBRIGATÓRIO DO PASSO 4, e é ela que abre o 5 (02/11/2026).
    '  pintarNavegacao();' +
    '}' +
    // REPINTA O TRECHO INTEIRO. É uma função só porque há mais de um sítio a mexer nele — o
    // «editar» e o «limpar» —, e cada um tem de deixar a tela coerente com o estado.
    'function pintarTrecho(){' +
    '  pintarDirecao();' +
    '  pintarOrientacao();' +
    '  pintarContagens();' +
    '  pintarSinais();' +
    '  pintarChips();' +
    '}' +
    // A NOTAÇÃO EM COMPOSIÇÃO. A categoria vem das pílulas; os sinais, das pílulas agrupadas, e
    // cada um entra numa ficha com o «×». É o que evita escrever Benesh de cabeça.
    'function categoriaEscolhida(){' +
    '  var marcado = document.querySelector("input[name=vb-cat]:checked");' +
    '  return marcado ? marcado.value : "Pé";' +
    '}' +
    // OS SINAIS EM PÍLULAS, AGRUPADOS PELO GRUPO DO ALFABETO. Cada pílula diz o glifo e o nome
    // — «→ conduz a» e não um «→» sozinho —, porque quem está a compor não tem de saber Benesh
    // de cor. Um sinal pode repetir-se no mesmo bloco (`[Pé: 1ª → + ● 1ª]`), e é por isso que o
    // clique ACRESCENTA SEMPRE ao fim e a remoção é só pelos «×» das fichas.
    'function pintarSinais(){' +
    '  var caixa = document.getElementById("vb-sinais");' +
    '  if (!caixa) return;' +
    // UMA VEZ BASTA. Os sinais vêm do alfabeto, não mudam com a música nem com a direção — e
    // repintá-los a cada tecla dos tempos perdia o foco de quem estava a compor.
    '  if (caixa.querySelector("input[data-sinal]")) return;' +
    '  var legenda = caixa.querySelector("legend");' +
    '  var grupos = {}, ordem = [];' +
    '  (VERBETES && VERBETES.sinais || []).forEach(function(s){' +
    '    if (!grupos[s.grupo]) { grupos[s.grupo] = []; ordem.push(s.grupo); }' +
    '    grupos[s.grupo].push(s);' +
    '  });' +
    '  var html = ordem.map(function(g){' +
    '    return "<p class=\\"campo-rotulo\\">" + g + "</p>" + grupos[g].map(function(s){' +
    '      return "<label class=\\"escolha\\"><input type=\\"checkbox\\" data-sinal=\\"" +' +
    '        String(s.sinal).replace(/"/g, "&quot;") + "\\"><span><strong>" + s.sinal +' +
    '        "</strong> " + s.nome + "</span></label>";' +
    '    }).join("");' +
    '  }).join("");' +
    '  caixa.innerHTML = (legenda ? legenda.outerHTML : "") + html;' +
    '  Array.prototype.slice.call(caixa.querySelectorAll("input")).forEach(function(x){' +
    '    x.addEventListener("change", function(){' +
    // TROCAR NO LUGAR, E NÃO ACRESCENTAR AO FIM (02/11/2026). Com um sinal marcado para troca, o
    // clique na paleta substitui-o e a ordem fica intacta; sem ele, acrescenta ao fim, que é o
    // que sempre fez. A posição na sequência é a informação — ela é a ordem em que o gesto
    // acontece —, e mandar o sinal corrigido para o fim seria dizer que ele acontece no fim.
    '      var novo = x.getAttribute("data-sinal");' +
    '      if (SINAL_EM_TROCA !== null && SINAL_EM_TROCA < SINAIS.length) {' +
    '        SINAIS[SINAL_EM_TROCA] = novo;' +
    '        SINAL_EM_TROCA = null;' +
    '      } else {' +
    '        SINAIS.push(novo);' +
    '      }' +
    '      x.checked = false;' +
    '      pintarChips();' +
    '    });' +
    '  });' +
    '}' +
    // AS FICHAS NUMERADAS: a ordem em que os sinais acontecem é o que a notação diz, e um número
    // na frente é a única coisa que a torna legível de relance.
    'function pintarChips(){' +
    '  var alvo = document.getElementById("vb-chips");' +
    '  if (!alvo) return;' +
    '  if (!SINAIS.length) {' +
    '    alvo.innerHTML = "<span class=\\"nota\\">Escolha a categoria e os sinais.</span>";' +
    '  } else {' +
    // A FICHA INTEIRA É CLICÁVEL, E O «×» CONTINUA A SER O «×» (02/11/2026). Clicar na ficha
    // marca-a para troca; clicar no «×» tira-a. São duas acções no mesmo sítio, e a distinção é o
    // alvo do clique — por isso o «×» é um `button` dentro da ficha e não um glifo ao lado.
    '    alvo.innerHTML = SINAIS.map(function(s, i){' +
    '      var emTroca = (SINAL_EM_TROCA === i);' +
    '      return "<span class=\\"chip" + (emTroca ? " em-troca" : "") + "\\" data-trocar=\\"" + i +' +
    '        "\\" title=\\"corrigir este sinal no lugar\\">" + (i + 1) + ". " + s +' +
    '        "<button type=\\"button\\" data-sinal=\\"" + i + "\\" aria-label=\\"tirar " + s + "\\">×</button></span>";' +
    '    }).join(" ");' +
    // A INSTRUÇÃO SÓ APARECE QUANDO HÁ O QUE INSTRUIR. Uma frase permanente a explicar um gesto
    // que ainda não se pode fazer é ruído em cima de quem está a compor.
    '    if (SINAL_EM_TROCA !== null && SINAL_EM_TROCA < SINAIS.length) {' +
    '      alvo.innerHTML += "<p class=\\"nota\\">a corrigir o sinal " + (SINAL_EM_TROCA + 1) +' +
    '        " («" + SINAIS[SINAL_EM_TROCA] + "») — escolha o sinal novo na paleta, ou clique na ficha outra vez para desistir.</p>";' +
    '    }' +
    '  }' +
    // O QUE FICA ESCRITO É REFEITO A CADA SINAL (31/10/2026): o «lê-se» deriva dos sinais, e a
    // prévia do último passo tem de acompanhar. O campo da frase NÃO é tocado — ele é do
    // exercício, e os sinais não o mudam.
    '  pintarFica();' +
    '  pintarTira();' +
    // E A NAVEGAÇÃO, porque o número de sinais é o que abre (ou fecha) o passo 6 (02/11/2026).
    '  pintarNavegacao();' +
    '}' +
    // A FRASE VEM DO DICIONÁRIO — E NÃO POR CIMA DO QUE FOI ESCRITO. Só substitui quando o campo
    // está vazio ou ainda tem a sugestão anterior: quem ajustou a frase não a vê desaparecer ao
    // acrescentar mais um sinal.
    // A DEFINIÇÃO DO EXERCÍCIO, LIDA DO VOCABULÁRIO (31/10/2026). O vocabulário é a verdade única
    // dos termos — é de lá que sai a lista de exercícios que se escolhe —, e a definição de cada
    // um vive no mesmo sítio, com o campo `fonte` ao lado. Não há uma segunda lista de definições
    // a divergir: o que a pesquisadora der para um termo vale no formulário, na aula e no glossário.
    /* O MÉTODO HERDA A TRADIÇÃO DO EXERCÍCIO (02/11/2026).
     *
     * O QUE ELA PEDIU: «ao selecionar um exercício na listagem do Step 2, o campo "Método deste
     * Exercício" deve ser preenchido automaticamente com base no valor predefinido no campo
     * Tradição de Referência (pois são sinónimos no modelo de domínio)», e depois «permanece
     * editável (…) ou selecionar "Escolha Livre" / "Compartilhada"».
     *
     * SÃO SINÓNIMOS, e por isso é uma sugestão e não uma trava: o campo continua a poder dizer
     * outra coisa. O que a sugestão resolve é o caso comum — o exercício declarado FRANCESA no
     * dicionário não obrigar a escolher FRANCESA outra vez à mão.
     *
     * NÃO SOBRESCREVE O QUE JÁ ESTÁ ESCOLHIDO À MÃO. Se o professor pôs «Cecchetti» neste
     * verbete, mudar de exercício não lhe apaga a escolha: a sugestão só entra quando o campo
     * está vazio ou quando ainda tem a sugestão ANTERIOR (a que este código pôs lá). É o mesmo
     * critério da frase do exercício — o que foi escrito por alguém vence o que a máquina sugere.
     */
    'var METODO_SUGERIDO = null;' +
    'function tradicaoDoExercicio(){' +
    '  var nomes = document.getElementById("vbnome");' +
    '  var nome = nomes ? nomes.value : "";' +
    '  if (!nome) return null;' +
    '  var lista = (VERBETES && VERBETES.exerciciosDoVocabulario) || [];' +
    '  var achado = null;' +
    '  lista.forEach(function(t){ if (t && t.termo === nome && t.tradicao) achado = t; });' +
    '  return achado ? { chave: String(achado.tradicao), rotulo: String(achado.tradicaoRotulo || "") } : null;' +
    '}' +
    'function sugerirMetodo(){' +
    '  var sel = document.getElementById("vbmetodo");' +
    '  if (!sel) return;' +
    '  var t = tradicaoDoExercicio();' +
    '  var actual = String(sel.value || "");' +
    '  var podeTrocar = !actual || (METODO_SUGERIDO !== null && actual === METODO_SUGERIDO);' +
    '  if (!podeTrocar) return;' +
    '  METODO_SUGERIDO = t ? t.chave : "";' +
    /* A OPÇÃO SÓ SE ACRESCENTA QUANDO NÃO EXISTE (02/11/2026).
     *
     * ERA AQUI A «COMPARTILHADA» DUPLICADA que ela viu: a condição era `sel.value !==
     * METODO_SUGERIDO`, e isso é verdade sempre que o valor sugerido ainda não é o escolhido —
     * mesmo que ele JÁ esteja na lista. Escolher um exercício de tradição `compartilhada` com o
     * campo vazio acrescentava uma segunda opção «Compartilhada» ao fim. O `value` duplicado não
     * dá erro nenhum: dá duas linhas iguais, e a segunda a vencer no `sel.value`.
     *
     * A pergunta certa é «existe uma opção com este valor?». E, se existir, basta escolhê-la. */
    '  if (METODO_SUGERIDO) {' +
    '    var existente = null;' +
    '    for (var i = 0; i < sel.options.length; i++) {' +
    '      if (sel.options[i].value === METODO_SUGERIDO) { existente = sel.options[i]; break; }' +
    '    }' +
    '    if (!existente) {' +
    '      var o = document.createElement("option");' +
    '      o.value = METODO_SUGERIDO; o.textContent = t.rotulo || METODO_SUGERIDO;' +
    '      sel.appendChild(o);' +
    '    }' +
    '  }' +
    '  sel.value = METODO_SUGERIDO;' +
    '  METODO = METODO_SUGERIDO;' +
    '  pintarNotaDoMetodo();' +
    '}' +
    'function definicaoDoExercicio(){' +
    '  var nomes = document.getElementById("vbnome");' +
    '  var nome = nomes ? nomes.value : "";' +
    '  if (!nome) return null;' +
    '  var lista = (VERBETES && VERBETES.exerciciosDoVocabulario) || [];' +
    '  var achado = null;' +
    '  lista.forEach(function(t){' +
    '    if (t && t.termo === nome && String(t.descricao || "").trim()) achado = t;' +
    '  });' +
    '  return achado ? { texto: String(achado.descricao).trim(), fonte: achado.fonte || "" } : null;' +
    '}' +
    // A FRASE DO VERBETE: O QUE O EXERCÍCIO É, ESCRITO UMA VEZ.
    //
    // A ordem é a que a pesquisadora fixou: «o que acontece neste trecho é a definição dada pelo
    // dicionário ao nome que a gente escolheu no exercício». Essa definição é do EXERCÍCIO — não
    // do trecho —, e por isso passou a ser escrita uma vez, no passo 1, e partilhada por todos os
    // trechos. O que muda de trecho para trecho é o «lê-se», que é derivado da notação.
    // O «COMO SE LÊ» É A SEGUNDA LINHA DA CÉLULA (31/10/2026). O que a célula grava é o texto que
    // a página da aula mostra, e sem o «lê-se» dentro dele o documento gerado perde a única linha
    // que diz, em português, o que a notação escreve em sinais. A categoria vai por parâmetro
    // porque a célula já gravada tem a DELA — a tela mostra a escolhida no momento, a célula
    // mostra a que está escrita.
    'function comoSeLe(chips, categoria){' +
    '  if (!chips || !chips.length) return "";' +
    '  var nomes = chips.map(function(s){' +
    '    var d = (VERBETES && VERBETES.sinais || []).filter(function(x){ return x.sinal === s; })[0];' +
    '    return d ? d.nome : s;' +
    '  });' +
    '  return "Lê-se: " + [categoria || categoriaEscolhida()].concat(nomes).join(", ") + ".";' +
    '}' +
    // A FRASE COMPOSTA — o que fica GRAVADO na célula: a frase do verbete e, abaixo, o «lê-se».
    'function comporDescricao(){' +
    '  var cima = partirFrase((document.getElementById("vb-frase") || {}).value || "");' +
    '  return [cima, comoSeLe(SINAIS)].filter(Boolean).join("\\n");' +
    '}' +
    'function partirFrase(texto){' +
    '  var linhas = String(texto || "").split("\\n");' +
    '  var cima = [];' +
    '  linhas.forEach(function(l){ if (l.indexOf("Lê-se:") !== 0) cima.push(l); });' +
    '  return cima.join("\\n").trim();' +
    '}' +
    // A NOTA DO PASSO 2. Diz de onde veio a frase e para que serve — e o que fazer quando o
    // exercício ainda não tem definição. Nenhuma nota é escrita quando o campo está vazio e nada
    // foi escolhido: uma nota a explicar o vazio que se vê é ruído.
    'function pintarNotaDaFrase(){' +
    '  var nota = document.getElementById("vb-frase-nota");' +
    '  if (!nota) return;' +
    '  var exercicio = definicaoDoExercicio();' +
    '  var escrito = partirFrase((document.getElementById("vb-frase") || {}).value || "");' +
    '  if (!nomeDoExercicio()) {' +
    '    nota.textContent = "Escolha o exercício no passo 1: a frase dele vem do dicionário.";' +
    '  } else if (exercicio && escrito === exercicio.texto) {' +
    '    var fonte = exercicio.fonte ? " (" + exercicio.fonte + ")" : "";' +
    '    nota.textContent = "Definição do dicionário para «" + nomeDoExercicio() + "»" + fonte +' +
    '      ". Ela vale para todos os trechos deste verbete — cada trecho acrescenta, abaixo, o «lê-se» da sua notação. Ajuste à vontade: é a sua frase que fica gravada.";' +
    '  } else if (escrito) {' +
    '    nota.textContent = "A sua frase — vale para todos os trechos deste verbete, e cada trecho acrescenta, abaixo, o «lê-se» da sua notação.";' +
    '  } else {' +
    '    nota.textContent = "Este exercício ainda não tem definição no dicionário. Escreva a frase: é ela que a página da aula mostra, em todos os trechos.";' +
    '  }' +
    '}' +
    /* UM TRECHO, UMA DOBRA FECHADA (03/11/2026) — o pedido dela, na letra.
     *
     * «À medida que o professor adiciona múltiplos trechos, os textos descritivos expandem a tela
     * verticalmente de forma excessiva. Por padrão, os blocos devem iniciar colapsados.»
     *
     * O DEFEITO ERA AQUI, e não na tabela: na tabela o «lê-se» já vivia dentro de um `<details>`
     * fechado. Este bloco — «o que fica escrito em cada trecho» — é que despejava, para cada
     * trecho, um parágrafo de cabeçalho e outro com a leitura inteira, todos abertos. Com oito
     * trechos eram dezasseis parágrafos de texto corrido antes de o professor chegar ao «Gravar».
     *
     * A PEÇA É A QUE A CASA USA PARA DOBRAR (`<details>`/`<summary>`), a mesma do «lê-se» ao lado,
     * e nasce FECHADA: fechada, a lista mostra um rótulo por trecho e nada mais. Um clique abre o
     * que é daquele trecho — e o que se abre é só o que é DELE: a frase do exercício é uma, e fica
     * uma vez, no topo.
     *
     * O RESUMO DIZ ONDE O TRECHO CAI — direção, orientação, compasso e contagem. Fechado, é a
     * única identificação que sobra, e sem ela a lista seria uma pilha de «lê-se» iguais. */
    'function pintarFica(){' +
    '  var alvo = document.getElementById("vb-fica");' +
    '  if (!alvo) return;' +
    '  var frase = partirFrase((document.getElementById("vb-frase") || {}).value || "");' +
    '  var blocos = [];' +
    '  var mapa = compassosDosTrechos();' +
    // O QUE ESTAVA ABERTO CONTINUA ABERTO. Repintar acontece a cada gesto — acrescentar um trecho,
    // mudar a música —, e sem isto a dobra que se abriu fechava-se sozinha no gesto seguinte, o
    // que se lê como «não abre». Fechada por omissão; aberta quando quem lê a abriu.
    '  var abertos = {};' +
    '  Array.prototype.forEach.call(alvo.querySelectorAll("details[data-trecho]"), function(x){' +
    '    if (x.open) abertos[x.getAttribute("data-trecho")] = true;' +
    '  });' +
    // O TEXTO MOSTRADO É O DO TRECHO, NÃO O DA FRASE DO MOMENTO (31/10/2026). Cada célula guarda
    // o seu `descricao` — e é ele que vai para a página da aula. Compor aqui a partir da frase do
    // passo 1 faria a prévia mentir sobre os trechos já escritos, que conservam a frase com que
    // nasceram (P-03/P-04: o que está escrito não se reescreve). Quando a frase gravada é outra,
    // a linha di-lo — senão a diferença parece um defeito.
    // TODOS OS TRECHOS, COM OU SEM DIREÇÃO (01/11/2026). Iterava-se a lista da gramática, e um
    // trecho sem direção não chegava a esta prévia — ficava escrito no verbete e invisível na
    // última leitura antes de gravar.
    '  Object.keys(CELULAS).forEach(function(d){' +
    '    (CELULAS[d] || []).forEach(function(c, k){' +
    '      var orient = "";' +
    '      orientacoesDaGramatica().forEach(function(o){' +
    '        if (o.termo === (c.orientacao || "")) orient = o.nome;' +
    '      });' +
    // A FRASE DO EXERCÍCIO APARECE UMA VEZ, NÃO UMA VEZ POR TRECHO (02/11/2026).
    //
    // O QUE ELA VIU: «o texto descritivo está repetindo em todos os trechos a mesma frase». É
    // literal — a `descricao` de cada célula começa pela frase do exercício, e a prévia mostrava-a
    // inteira em cada linha. Numa barra de oito trechos, oito vezes a mesma frase.
    //
    // O QUE MUDA: a frase sobe para o topo do bloco, sozinha, e cada trecho mostra só o que é
    // dele — o «lê-se» daquela notação. É a mesma informação, sem a repetição.
    //
    // E O COMPASSO ESTAVA ERRADO AQUI. Era `d.termo` — e `d` é uma CHAVE (uma string), não a
    // direção: `d.termo` é `undefined`, a chave buscada era `"undefined:0"`, e o compasso saía
    // sempre «—». Um `undefined` numa chave não dá erro; dá silêncio, que é pior. Passa a `d`.
    '      var gravada = partirFrase(c.descricao);' +
    '      var lido = soOLeSe(c.descricao) || comoSeLe(c.sinais || [], c.categoria);' +
    '      var antiga = gravada && frase && gravada !== frase;' +
    '      var rotulo = d ? nomeDaDirecao(d) : "sem direção";' +
    '      var onde = rotulo + (orient ? " · " + orient : "");' +
    '      var vezes = repeticoesDaCelula(c) > 1 ? " ×" + repeticoesDaCelula(c) : "";' +
    '      blocos.push("<details class=\\"dito\\" data-trecho=\\"" + d + ":" + k + "\\"" +' +
    '        (abertos[d + ":" + k] ? " open" : "") + "><summary>" + onde + " · compasso " +' +
    '        (mapa[d + ":" + k] || "—") + " · contagem " + c.contagem + vezes + "</summary>" +' +
    '        "<p>" + (lido ? String(lido).split("\\n").join("<br>") :' +
    '          "<span class=\\"nota\\">(sem «lê-se» — sem sinais)</span>") +' +
    '        (antiga ? "<br><span class=\\"nota\\">guardado com a frase com que foi escrito</span>" : "") +' +
    '        "</p></details>");' +
    '    });' +
    '  });' +
    // A FRASE, UMA VEZ, À FRENTE DO QUE VARIA. Sem ela o bloco perdia a metade que é do exercício;
    // com ela em cada linha, era a repetição que ela mandou tirar.
    '  var topo = frase ? "<p class=\\"nota\\">" + frase + "</p>" : "";' +
    '  alvo.innerHTML = blocos.length ? (topo + blocos.join("")) : (topo ||' +
    '    "<p class=\\\"nota\\\">Ainda não há trechos. Escolha a direção e os sinais, e acrescente o primeiro.</p>");' +
    '}' +
    'function nomeDoExercicio(){' +
    '  var n = document.getElementById("vbnome");' +
    '  return n ? String(n.value || "") : "";' +
    '}' +
    // ================= OS DOIS MODOS (28/10/2026) ===================================
    // «Ou se escolhe um exercício que existe, ou se cria um — nunca as duas.» O modo B esconde
    // os campos do verbete e bloqueia o par do exercício; o modo A esconde os do exercício.
    // Um campo que desaparece por completo é diferente de um campo esbatido: o esbatido continua
    // a competir por atenção, e é isso que a tela de antes fazia.
    // ================= OS SEIS PASSOS (31/10/2026 — seis desde 02/11/2026) ===========
    // Um passo de cada vez, a sério: só o painel do passo actual fica no ecrã. A tira em cima é
    // a memória do que já está decidido E a navegação — voltar a um passo anterior não perde nada,
    // porque tudo vive no DOM e o rascunho (`CELULAS`) não é tocado ao andar.
    //
    // A TIRA SAI NO MODO DO EXERCÍCIO (01/11/2026). Ela passou a viver fora do formulário, e por
    // isso já não é escondida de borla quando `#vb-modo-verbete` sai: sem esta linha ficava a
    // navegar cinco passos de um formulário que não está no ecrã. A regra do `hidden` precisa de
    // `display` própria na folha (`.passos[hidden]`), porque a de autor vence a do navegador.
    //
    // O PAR DO EXERCÍCIO É O ÚNICO PAINEL QUE CONTINUA À VISTA NO MODO A, ELE NÃO É FILTRADO POR
    // `PASSO` COMO OS OUTROS — ele é o passo 1 e vive fora do bloco do verbo, porque é ele que o
    // modo B bloqueia em vez de esconder.
    'function pintarPassos(){' +
    // A TIRA E OS PAINÉIS NÃO DEPENDEM DO CADASTRO DO EXERCÍCIO (02/11/2026). Havia aqui um
    // `emModoExercicio` que escondia TODOS os painéis e a própria tira enquanto o cadastro breve
    // estava aberto — e era isso que fazia do «Cancelar» o único sinal de onde se estava e para
    // onde se ia. Agora o cadastro vive dentro do passo 1, e quem manda é o passo: nada mais o
    // esconde.
    /* UM PASSO, UM PAINEL — TAMBÉM A CORRIGIR (02/11/2026, corrigindo a decisão da manhã).
     *
     * A manhã abriu uma excepção: durante a correcção de um trecho, os painéis 4, 5 e 6 ficavam
     * todos à vista. Ela resolvia um defeito real — o «Editar» da tabela saltava para o passo 4 e
     * fazia perder de vista a linha que se estava a corrigir —, mas pagava-o caro, e foi ela que o
     * disse: «ao clicar em Editar (…) abre tudo em um formulário único (página única),
     * transformando os steps em meros indicadores visuais». Três painéis ao mesmo tempo não são
     * três passos: são uma página, com uma tira decorativa em cima.
     *
     * As duas coisas que ela pediu — **não saltar** e **andar por passos** — não competem. O
     * «Editar» continua a não mudar de passo (é a correcção da manhã, e fica), e o formulário
     * volta a mostrar **um painel de cada vez**: quem está no 6 fica no 6, e vai ao 4 e ao 5 pela
     * tira, como em qualquer outra altura. O «!» nos números continua a dizer que aquele passo
     * tem trabalho pendente — e agora é isso mesmo que ele é, uma marca num sítio para onde se
     * pode ir, e não a legenda de um painel que já está aberto.
     */
    '  Array.prototype.slice.call(document.querySelectorAll("#form-verbete .passo-painel")).forEach(function(p){' +
    '    var n = Number(p.getAttribute("data-passo")) || 0;' +
    '    p.hidden = !(n === PASSO);' +
    '  });' +
    '  Array.prototype.slice.call(document.querySelectorAll("#vb-tira button.passo")).forEach(function(b){' +
    '    var n = Number(b.getAttribute("data-passo")) || 0;' +
    '    var activo = (n === PASSO);' +
    '    b.className = activo ? "passo ativo" : "passo";' +
    '    if (activo) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");' +
    // O «!» DE EDIÇÃO é da peça que já existe: `data-editando` no `ol` faz aparecer os
    // `.passo-alerta`, e o markup só os tem nos passos do trecho — os dois por onde a correcção
    // de um trecho passa.
    '  });' +
    '  var tira = document.getElementById("vb-tira");' +
    '  if (tira) tira.setAttribute("data-editando", EM_EDICAO === null ? "nao" : "sim");' +
    // O AVISO, OS BOTÕES DE CANCELAR E O RÓTULO DO BOTÃO DO ÚLTIMO PASSO.
    '  var aviso = document.getElementById("vb-edicao");' +
    '  if (aviso) {' +
    '    aviso.hidden = EM_EDICAO === null;' +
    '    var qual = document.getElementById("vb-edicao-n");' +
    '    if (qual) qual.textContent = EM_EDICAO === null ? "" : (EM_EDICAO.k + 1);' +
    '  }' +
    '  var cancelar2 = document.getElementById("vb-cancelar-edicao-2");' +
    '  if (cancelar2) cancelar2.hidden = EM_EDICAO === null;' +
    // O «ACRESCENTAR» SAI DE CENA NA CORRECÇÃO, e o «GUARDAR» entra (02/11/2026). São dois botões
    // porque são duas acções: acrescentar é o que se faz quando não se está a corrigir nada.
    '  var bAcrescentar = document.getElementById("vb-cel-acrescentar");' +
    '  if (bAcrescentar) bAcrescentar.hidden = (EM_EDICAO !== null);' +
    '  pintarDuplicar();' +
    '  var bGuardar = document.getElementById("vb-cel-guardar");' +
    '  if (bGuardar) bGuardar.hidden = (EM_EDICAO === null);' +
    /* O «APAGAR» JÁ NÃO VIVE AQUI (02/11/2026, segunda correcção do mesmo dia). O bloco que
     * pintava o `#vb-cel-apagar` saiu com o botão: o verbo existe só na listagem, e um botão
     * escondido por script que já não está na marcação é código que ninguém executa. */
    '  var voltar = document.getElementById("vb-voltar");' +
    '  if (voltar) voltar.disabled = (PASSO === 1);' +
    '  var seguir = document.getElementById("vb-seguir");' +
    '  if (seguir) seguir.hidden = (PASSO === ULTIMO_PASSO);' +
    '  var bGravar = document.getElementById("vb-gravar");' +
    '  if (bGravar) bGravar.hidden = (PASSO !== ULTIMO_PASSO);' +
    '  pintarComoNova();' +
    '  var bLimpar = document.getElementById("vbnovo");' +
    '  if (bLimpar) bLimpar.hidden = (PASSO !== ULTIMO_PASSO);' +
    // O BLOCO DO PASSO 1 É REPINTADO COM OS PASSOS (02/11/2026): ele depende do que está escrito
    // no nome E do exercício escolhido, e o exercício escolhido é o `editarVerbete` que o põe —
    // sem esta chamada, abrir um verbete deixaria a frase apagada até ao primeiro clique.
    '  alternarPasso1();' +
    // E O «GRAVAR» DIZ SE HÁ O QUE GRAVAR (02/11/2026). Ver `pintarGravar`.
    '  pintarGravar();' +
    // E A NAVEGAÇÃO DIZ O QUE AINDA NÃO SE PODE FAZER (02/11/2026). Ver `pintarNavegacao`.
    '  pintarNavegacao();' +
    '}' +
    'function irParaPasso(n){' +
    // O `irParaPasso` É O COLOCADOR DO ESTADO, e não a guarda. Quem guarda é a INTERFACE: a tira
    // desactiva os passos que ainda não se abrem, e o «Seguir» desactiva-se quando falta algo no
    // passo actual (ver `pintarNavegacao`). A distinção é de propósito — há chamadas internas que
    // precisam de pôr o passo sem passar pelo caminho do utilizador (o «Editar» de um verbete vai
    // ao 1; o «Limpar» vai ao 2; e as provas colocam-se no passo que medem).
    '  PASSO = Math.max(1, Math.min(ULTIMO_PASSO, Number(n) || 1));' +
    '  pintarPassos();' +
    '}' +
    /* A NAVEGAÇÃO PROGRESSIVA (02/11/2026, segunda correcção do mesmo dia).
     *
     * O QUE ELA PEDIU: «enquanto o utilizador não preencher/selecionar os campos obrigatórios da
     * etapa actual, o step seguinte permanece desabilitado; o botão Seguir permanece bloqueado; o
     * botão Voltar permanece habilitado».
     *
     * A REGRA ANTERIOR ERA «A TIRA NÃO BLOQUEIA» — «é a diferença entre conduzir e impedir» —, e
     * ela reviu-a. A tira bloqueia daqui para a frente, e só isso: **para trás continua tudo
     * aberto**, porque voltar a um passo já visto não perde nada (o estado vive no DOM e o
     * rascunho não é tocado) e travar a volta seria impedir a correcção.
     *
     * O QUE É OBRIGATÓRIO EM CADA PASSO, e porquê:
     *
     *   1. o exercício novo — nome, e (só com nome) categoria, tradição e frase. Sem nome, o passo
     *      está cumprido: quem vai escolher um exercício existente não tem nada a criar aqui;
     *   2. o exercício escolhido — é a chave de tudo o que vem depois;
     *   3. a música — quantos tempos. O compasso nasce com um valor, e por isso não falta;
     *   4. a contagem — ela nasce escolhida (a primeira que cabe), e o passo diz se não houver;
     *   5. ao menos um sinal — sem sinais não há notação, e sem notação não há trecho.
     *
     * A FALTA DIZ-SE POR NOME, no `title` do botão: um botão apagado sem explicação lê-se como
     * avaria. E diz-se de TODAS as que faltam antes do passo pedido, não só da imediatamente
     * anterior — quem tenta o 5 e ficou no 2 precisa de saber as duas coisas.
     */
    'function faltasDoPasso(n){' +
    '  if (n === 1) return oQueFaltaNoPasso1();' +
    '  if (n === 2) return exercicioEscolhido() ? [] : ["o exercício (passo 2)"];' +
    '  if (n === 3) return temposTotais() > 0 ? [] : ["quantos tempos tem a música (passo 3)"];' +
    '  if (n === 4) return CONTAGEM ? [] : ["a contagem (passo 4)"];' +
    // O PASSO 5 É O DOS SINAIS — mas ele não fecha a leitura de um verbete que JÁ TEM trechos.
    // Sem esta segunda metade, abrir um verbete gravado e querer ver a decomposição obrigaria a
    // compor um trecho novo: os sinais do editor nascem vazios, e o passo 6 ficaria inalcançável
    // sobre um dado que já existe. Exigir sinais é exigir o que se vai ACRESCENTAR; o que já está
    // escrito é o que o passo 6 mostra.
    '  if (n === 5) return (SINAIS.length || Object.keys(CELULAS).length) ? [] : ["ao menos um sinal (passo 5)"];' +
    '  return [];' +
    '}' +
    'function faltasAntesDe(n){' +
    '  var faltas = [];' +
    '  for (var i = 1; i < n; i++) faltas = faltas.concat(faltasDoPasso(i));' +
    '  return faltas;' +
    '}' +
    'function podeIrPara(n){ return faltasAntesDe(Number(n) || 1).length === 0; }' +
    /* O «ACRESCENTAR TRECHO» TAMBÉM ESPERA (02/11/2026). O pedido: «o botão "Acrescentar Trecho"
     * só deve ser habilitado quando todos os campos obrigatórios dos steps anteriores (1 a 5)
     * estiverem devidamente preenchidos e válidos». O `submit` já recusava — e recusar ao fim de
     * cinco passos é a armadilha que o `disabled` evita: quem chega ao 6 vê, no botão, o que
     * ainda falta em vez de o descobrir depois do clique. */
    'function pintarAcrescentar(){' +
    '  var b = document.getElementById("vb-cel-acrescentar");' +
    '  if (!b) return;' +
    '  var faltas = faltasAntesDe(6);' +
    '  b.disabled = faltas.length > 0;' +
    '  b.setAttribute("aria-disabled", faltas.length ? "true" : "false");' +
    '  if (faltas.length) b.setAttribute("title", "Antes de acrescentar um trecho, falta " + faltas.join(", ") + ".");' +
    '  else b.removeAttribute("title");' +
    '}' +
    'function pintarNavegacao(){' +
    // A TIRA: os passos à frente fecham-se enquanto faltar algo antes deles. O passo actual e os
    // anteriores ficam sempre abertos.
    '  Array.prototype.slice.call(document.querySelectorAll("#vb-tira button.passo")).forEach(function(b){' +
    '    var n = Number(b.getAttribute("data-passo")) || 0;' +
    '    var fechado = (n > PASSO) && !podeIrPara(n);' +
    '    b.disabled = fechado;' +
    '    b.setAttribute("aria-disabled", fechado ? "true" : "false");' +
    '    if (fechado) b.setAttribute("title", "Falta " + faltasAntesDe(n).join(", ") + ".");' +
    '    else b.removeAttribute("title");' +
    '  });' +
    // O «SEGUIR»: bloqueado enquanto o passo actual tiver faltas.
    '  var seguir = document.getElementById("vb-seguir");' +
    '  if (seguir) {' +
    '    var faltas = faltasDoPasso(PASSO);' +
    '    seguir.disabled = faltas.length > 0;' +
    '    seguir.setAttribute("aria-disabled", faltas.length ? "true" : "false");' +
    '    if (faltas.length) seguir.setAttribute("title", "Falta " + faltas.join(", ") + ".");' +
    '    else seguir.removeAttribute("title");' +
    '  }' +
    '  pintarAcrescentar();' +
    '}' +
    'function exercicioEscolhido(){' +
    '  return String((document.getElementById("vbnome") || {}).value || "").trim();' +
    '}' +
    // O RESUMO DA TIRA. Cada passo diz o que já está decidido — sem isso, a tira só diria onde se
    // está, e quem está no último passo não saberia para onde o trecho vai.
    //
    // O PASSO 1 DIZ O EXERCÍCIO E A POSIÇÃO (01/11/2026). Ele juntou três coisas — exercício,
    // frase e posição — e a tira não tem largura para as três. Fica o NOME, que é a identidade, e
    // a posição, que é a segunda coisa que se escolhe e a que mais se esquece; a frase tem o
    // sinal dela onde se escreve (a nota do passo 1) e a recusa do «Gravar verbete» diz o que
    // falta. Encher a tira com «frase a escrever» empurrava o nome para as reticências.
    'function pintarTira(){' +
    '  var nome = (document.getElementById("vbnome") || {}).value || "";' +
    '  var tempos = (document.getElementById("vbtempos") || {}).value || "";' +
    '  var compasso = (document.getElementById("vbcompasso") || {}).value || "";' +
    // SEM A POSIÇÃO NO FORMULÁRIO, A TIRA NÃO A PROMETE (02/11/2026). O passo 2 dizia
    // «Battement tendu · Première position», e a segunda metade passou a ser uma pergunta que já
    // não se faz aqui — é nos sinais do trecho. A tira diz o exercício e mais nada.
    '  var posicao = "";' +
    '  var orient = "";' +
    '  orientacoesDaGramatica().forEach(function(o){ if (o.termo === ORIENTACAO) orient = o.nome; });' +
    '  var onde = [];' +
    // SEM DIREÇÃO ESCOLHIDA, A TIRA NÃO INVENTA UMA (01/11/2026): ela diz só o que existe — a
    // orientação, quando há, e o tempo. Antes, a direção era sempre a primeira coisa da frase.
    '  direcoesDaGramatica().forEach(function(d){ if (DIRECAO && d.termo === DIRECAO) onde.push(d.nome); });' +
    '  if (orient) onde.push(orient);' +
    '  if (CONTAGEM) onde.push("tempo " + CONTAGEM);' +
    '  var valores = {' +
    '    1: (document.getElementById("vnnome") || {}).value || "a criar",' +
    '    2: (nome || "a escolher") + (posicao ? " · " + posicao : ""),' +
    '    3: (tempos || "—") + " tempos · " + (compasso || "—"),' +
    '    4: onde.length ? onde.join(" · ") : "a escolher",' +
    '    5: SINAIS.length ? SINAIS.length + (SINAIS.length === 1 ? " sinal" : " sinais") : "a escolher",' +
    '    6: (function(){ var t = 0; Object.keys(CELULAS).forEach(function(d){ (CELULAS[d] || []).forEach(function(c){ t += 1; }); }); return t ? t + (t === 1 ? " trecho" : " trechos") : "nenhum trecho"; })()' +
    '  };' +
    '  Object.keys(valores).forEach(function(n){' +
    '    var el = document.getElementById("vb-v" + n);' +
    '    if (el) el.textContent = valores[n];' +
    '  });' +
    '  var notaM = document.getElementById("vb-musica-nota");' +
    '  if (notaM) {' +
    '    var t = Number(tempos) || 0;' +
    // A NOTA JÁ NÃO DIZ QUE O CAMPO ESTÁ TRAVADO (03/11/2026) — ele não está. O que ela diz é o
    // que muda com a música: quantos compassos ela tem, e — quando os trechos não batem — que o
    // desacordo é uma decisão a tomar, e não um erro que a tela vai recusar.
    '    var base = t ? (t + " tempos em " + compasso + " — " + Math.ceil(t / numeradorDoCompasso()) + " compasso(s) de " + numeradorDoCompasso() + ".") : "";' +
    '    var c = cobertura();' +
    '    var temTrecho = Object.keys(CELULAS).some(function(d){ return (CELULAS[d] || []).length > 0; });' +
    '    notaM.textContent = base + ((t > 0 && temTrecho && c !== t)' +
    '      ? " Os trechos ocupam " + c + " — ajuste a música ou os trechos, à sua escolha: gravar não recusa." : "");' +
    '  }' +
    '}' +
    // ================= O MODO DE EDIÇÃO (31/10/2026) ================================
    // Um trecho acrescentado pode ser corrigido. A correcção atravessa os dois passos do trecho
    // (`PASSOS_DO_TRECHO`) e termina no último — por isso é um ESTADO e não um botão: o aviso, o
    // «!» nos dois números, o rótulo do botão do último passo e a linha da tabela têm todos de
    // saber que se está a corrigir.
    'function editarTrecho(dir, k){' +
    '  var lista = CELULAS[dir] || [];' +
    '  var c = lista[Number(k)];' +
    '  if (!c) return;' +
    // A CORRECÇÃO NÃO MUDA DE PASSO (02/11/2026). Era `irParaPasso(PASSOS_DO_TRECHO[0])`, e o
    // efeito era o relatado: carregar em «Editar» na tabela atirava o utilizador para o passo 4 e
    // ele perdia de vista a linha que estava a corrigir. Agora o formulário vem ter com ele.
    '  EM_EDICAO = { dir: dir, k: Number(k) };' +
    '  DIRECAO = dir;' +
    '  ORIENTACAO = c.orientacao || "";' +
    '  CONTAGEM = c.contagem || "";' +
    '  REPETICOES = repeticoesDaCelula(c);' +
    '  var selRepE = document.getElementById("vb-repeticoes"); if (selRepE) selRepE.value = String(REPETICOES);' +
    '  SINAIS = (c.sinais || []).slice();' +
    // A FRASE NÃO SE TOCA AQUI (31/10/2026). Ela é do verbete, escrita uma vez no passo 1; o que
    // este trecho tem de próprio é o «lê-se», que se refaz dos sinais. Carregar a frase do trecho
    // para o campo faria com que corrigir o trecho 2 reescrevesse a frase dos outros dois.
    '  var radios = document.querySelectorAll("input[name=vb-cat]");' +
    '  Array.prototype.slice.call(radios).forEach(function(r){ r.checked = (r.value === (c.categoria || "Pé")); });' +
    '  var selRepC = document.getElementById("vb-repeticoes");' +
    '  if (selRepC) selRepC.value = String(REPETICOES);' +
    // O PASSO NÃO MUDA — e `pintarPassos` é que traz os painéis do trecho para aqui.
    '  pintarPassos();' +
    '  pintarTrecho();' +
    // A TABELA TAMBÉM, e não só o trecho: é ela que marca a linha em edição e troca os botões
    // dela. Sem esta chamada, entrar na edição mudava o aviso e o «!» e deixava a linha igual.
    '  pintarTabela();' +
    '}' +
    'function cancelarEdicao(){' +
    // CANCELAR SAI DA CORRECÇÃO E NÃO MEXE NO PASSO (02/11/2026) — é o comportamento que ela
    // marcou como CORRECTO e pediu para preservar. Antes ele saltava para o último passo, o que
    // dava o mesmo resultado por acidente (a edição começava nos passos do trecho); agora que ela
    // começa na tabela, «não mexer» é a regra explícita.
    '  EM_EDICAO = null;' +
    '  DIRECAO = ""; ORIENTACAO = ""; CONTAGEM = ""; SINAIS = []; SINAL_EM_TROCA = null; REPETICOES = 1;' +
    '  var selRepX = document.getElementById("vb-repeticoes"); if (selRepX) selRepX.value = "1";' +
    '  pintarPassos();' +
    '  pintarTrecho();' +
    '  pintarTabela();' +
    '}' +
    /* O PASSO 1 GRAVA O EXERCÍCIO QUANDO SE AVANÇA (02/11/2026).
     *
     * É A SUBSTITUIÇÃO DOS DOIS BOTÕES QUE HAVIA. O «Gravar exercício» e o «Cancelar» existiam
     * porque o cadastro era um widget com vida própria, aberto por um «+». Como passo, ele não
     * tem vida própria: o «Seguir →» que já existia é que o grava e avança — e quem não tem nada
     * a criar avança sem gravar nada.
     *
     * A ORDEM É A DO GESTO. Só se avança depois de o termo estar no repositório (`criarTermo`, no
     * servidor) e escolhido no `select` do passo 2. Um avanço que deixasse a gravação falhada em
     * segundo plano poria o professor a escrever a decomposição de um exercício que não existe.
     *
     * O QUE NÃO GASTA: nada. A rota grava no vocabulário do repositório e a lista é lida do mesmo
     * ficheiro; o termo entra na lista local para o passo 2 o mostrar sem esperar por um deploy.
     */
    /* O PASSO 1: SE HÁ NOME, TUDO O RESTO É OBRIGATÓRIO (02/11/2026) — pedido dela, e a
     * condicional é dele: «se o usuário escrever o nome do exercício, os seguintes campos
     * tornam-se estritamente obrigatórios para permitir o avanço: nome, campo descritivo,
     * categoria, tradição».
     *
     * A REGRA TEM DUAS METADES, e a segunda é a que se esquece: com o nome VAZIO não se pede nada
     * e a navegação é livre. Quem só quer ver o formulário, ou quem vai escolher um exercício que
     * já existe (passo 2), não pode ser travado por campos de um exercício que não está a criar.
     *
     * O QUE FALTA DIZ-SE POR NOME, e todos de uma vez: um `alert` que pede um campo, e depois
     * outro, e depois outro, é o mesmo pedido feito três vezes.
     */
    /* O BLOCO DO PASSO 1: EM VIGOR, FORA DELE, OU CONGELADO (02/11/2026).
     *
     * TRÊS ESTADOS, e não dois — o terceiro é a correcção da tarde:
     *
     *   1. **Sem exercício e sem nome** — os três estão DESACTIVADOS (e o `disabled` é a sério: um
     *      campo esbatido continua a competir por atenção e a receber foco) e a nota diz porquê.
     *   2. **Com nome de exercício novo** — os três ficam em vigor e são obrigatórios: é o passo 1
     *      a criar a definição que o dicionário passa a guardar.
     *   3. **Com um exercício ESCOLHIDO no passo 2 e sem nome novo** — os três ficam
     *      **CONGELADOS**: preenchidos a partir do dicionário e com `disabled`. O pedido dela:
     *      «o sistema deve carregar e preencher automaticamente no Step 1 os dados cadastrados:
     *      Categoria, Tradição de Referência e O que acontece (significado)» e «esses três campos
     *      devem ficar rigorosamente bloqueados para edição, pois pertencem à definição oficial
     *      congelada do exercício no dicionário».
     *
     * A DEFINIÇÃO CONGELADA NÃO SE REESCREVE POR AQUI, e é isso que o `disabled` diz sem precisar
     * de sermão: para a mudar, edita-se o TERMO (no vocabulário), e a mudança chega a todos os
     * verbetes que o usam. Deixar o campo aberto daria duas verdades para a mesma definição — a
     * do dicionário e a que alguém ajustou num verbete —, e a segunda a vencer sem que ninguém
     * saiba qual é a oficial.
     *
     * A FRASE GRAVADA VENCE A DO DICIONÁRIO (P-03/P-04), e por isso o campo é preenchido com o
     * que está gravado quando há verbete, e com a definição do dicionário quando não há. O que
     * fica congelado é aquilo que se vê — e a nota diz de onde veio.
     */
    'function alternarPasso1(){' +
    '  var novo = document.getElementById("vnnome");' +
    '  var escolhido = document.getElementById("vbnome");' +
    '  var temNome = Boolean(novo && String(novo.value || "").trim());' +
    '  var temExercicio = Boolean(escolhido && String(escolhido.value || "").trim());' +
    '  var congelado = temExercicio && !temNome;' +
    '  var emVigor = temNome || congelado;' +
    '  ["vncategoria", "vntradicao", "vb-frase"].forEach(function(id){' +
    '    var el = document.getElementById(id);' +
    '    if (!el) return;' +
    // CONGELADO É MAIS DO QUE «EM VIGOR»: o campo tem valor, conta como obrigatório — e é
    // `disabled` mesmo assim, porque o valor não se edita aqui (02/11/2026).
    '    el.disabled = congelado || !emVigor;' +
    '    el.setAttribute("aria-disabled", (congelado || !emVigor) ? "true" : "false");' +
    '    if (congelado) el.setAttribute("data-congelado", "sim");' +
    '    else el.removeAttribute("data-congelado");' +
    '  });' +
    '  var nota = document.getElementById("vb-vigor-nota");' +
    '  if (nota) {' +
    '    nota.textContent = congelado' +
    '      ? ("Estes três campos são a definição do exercício «" + String(escolhido.value || "") +' +
    '         "» no dicionário, e ficam bloqueados aqui — para os mudar, edite o termo no vocabulário.")' +
    '      : (emVigor ? "" :' +
    '        "A categoria, a tradição e o que acontece entram em vigor quando houver um exercício — ' +
    '        escreva o nome acima, ou escolha um no passo 2. Sem nome, pode avançar livremente.");' +
    '  }' +
    // O PASSO 1 É O OBRIGATÓRIO DA PRÓPRIA ETAPA: o «Seguir» e a tira repintam-se com ele.
    '  pintarNavegacao();' +
    '}' +
    /* O PASSO 1 LÊ O PASSO 2 (02/11/2026) — o pedido dela, na letra: «ao selecionar um exercício
     * na listagem do Step 2, preencha automaticamente a Categoria, Tradição e "O que acontece" no
     * Step 1».
     *
     * O QUE SE PREENCHE, e de onde: categoria e tradição vêm do TERMO (`exerciciosDoVocabulario`,
     * que já as trazia desde 02/11/2026); a frase vem do que está GRAVADO no verbete e, quando não
     * há nada gravado, da definição do dicionário. Essa ordem é a do projecto (P-03/P-04): o que
     * foi escrito vence o que a máquina sugere, e o dicionário pode melhorar sem reescrever o
     * passado.
     *
     * QUANDO NÃO SE PREENCHE: com um nome de exercício novo escrito, porque aí a definição é a que
     * se está a criar — e sobrescrevê-la com a de outro termo apagaria o trabalho a meio.
     */
    'function dadosDoExercicio(nome){' +
    '  var lista = (VERBETES && VERBETES.exerciciosDoVocabulario) || [];' +
    '  var achado = null;' +
    '  lista.forEach(function(t){ if (t && t.termo === nome) achado = t; });' +
    '  return achado;' +
    '}' +
    'function sincronizarPasso1ComExercicio(){' +
    '  var escolhido = document.getElementById("vbnome");' +
    '  var novo = document.getElementById("vnnome");' +
    '  var nome = escolhido ? String(escolhido.value || "").trim() : "";' +
    '  if (!nome || (novo && String(novo.value || "").trim())) { alternarPasso1(); return; }' +
    '  var dados = dadosDoExercicio(nome);' +
    '  var cat = document.getElementById("vncategoria");' +
    '  var tra = document.getElementById("vntradicao");' +
    '  var frase = document.getElementById("vb-frase");' +
    '  if (dados && cat && dados.categoria) cat.value = dados.categoria;' +
    '  if (dados && tra && dados.tradicao) tra.value = dados.tradicao;' +
    '  if (dados && frase) {' +
    '    var gravada = partirFrase(frase.value || "");' +
    '    var definicao = String(dados.descricao || "").trim();' +
    '    if (!gravada && definicao) {' +
    '      frase.value = definicao;' +
    '      FRASE = definicao;' +
    '      FRASE_ANTERIOR = definicao;' +
    '    }' +
    '  }' +
    '  pintarNotaDaFrase();' +
    '  alternarPasso1();' +
    '}' +
    'function oQueFaltaNoPasso1(){' +
    '  var campo = document.getElementById("vnnome");' +
    '  var nome = campo ? campo.value.trim() : "";' +
    '  if (!nome) return [];' +
    '  var falta = [];' +
    '  var frase = partirFrase((document.getElementById("vb-frase") || {}).value || "");' +
    '  if (!frase) falta.push("o que acontece (a definição do exercício)");' +
    '  if (!document.getElementById("vncategoria").value) falta.push("a categoria");' +
    '  if (!document.getElementById("vntradicao").value) falta.push("a tradição de referência");' +
    '  return falta;' +
    '}' +
    'function criarExercicioDoPasso1(depois){' +
    '  var campo = document.getElementById("vnnome");' +
    '  var nome = campo ? campo.value.trim() : "";' +
    '  if (!nome) { if (depois) depois(true); return; }' +
    '  var falta = oQueFaltaNoPasso1();' +
    '  if (falta.length) {' +
    '    recado("erro", "Para criar «" + nome + "», falta " + falta.join(", ") + ".");' +
    '    return;' +
    '  }' +
    '  var cat = document.getElementById("vncategoria").value;' +
    '  var tra = document.getElementById("vntradicao").value;' +
    // A FRASE VAI PARA O TERMO, e é ela que o dicionário passa a mostrar. Ela é guardada antes de
    // `carregarRascunho()` porque essa função a pode trocar (a frase recarrega quando o exercício
    // muda) — e perder aqui o que se acabou de escrever seria o mesmo defeito de sempre.
    '  var fraseDoTermo = partirFrase((document.getElementById("vb-frase") || {}).value || "");' +
    '  var res = document.querySelector("[data-res=vb-novo]");' +
    '  if (res) { res.className = "res"; res.textContent = "gravando..."; }' +
    '  fetch("/api/bastidores/termo", {' +
    '    method: "POST", headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({token: TOKEN, termo: nome, categoria: cat, tradicao: tra,' +
    '      descricao: fraseDoTermo})' +
    '  }).then(lerResposta).then(function(d){' +
    '    if (!d.ok) {' +
    '      if (res) { res.className = "res erro"; res.textContent = "Erro: " + (d.erro || "desconhecido"); }' +
    '      return;' +
    '    }' +
    '    var nomes = document.getElementById("vbnome");' +
    '    var grupo = nomes ? nomes.querySelector("optgroup[data-cat=\'" + cat + "\']") : null;' +
    // O TERMO QUE JÁ ESTÁ NA LISTA NÃO ENTRA DUAS VEZES: pode lá estar porque a página foi
    // recarregada depois do commit, e um `option` repetido é uma segunda verdade na mesma lista.
    '    var existente = null;' +
    '    if (nomes) {' +
    '      Array.prototype.slice.call(nomes.options).forEach(function(x){' +
    '        if (!existente && x.value === d.termo) existente = x;' +
    '      });' +
    '    }' +
    '    if (!existente && nomes) {' +
    '      var o = document.createElement("option");' +
    '      o.value = d.termo; o.textContent = d.termo;' +
    '      if (grupo) { grupo.appendChild(o); }' +
    '      else {' +
    '        var g = document.createElement("optgroup");' +
    '        g.setAttribute("data-cat", cat);' +
    '        g.label = ROTULO_DE_CATEGORIA[cat] || cat;' +
    '        g.appendChild(o);' +
    '        nomes.appendChild(g);' +
    '      }' +
    '    }' +
    '    if (nomes) nomes.value = d.termo;' +
    '    if (campo) campo.value = "";' +
    '    if (res) { res.className = "res"; res.textContent = ""; }' +
    '    recado("ok", "exercício gravado: " + d.termo + " — já está na lista do passo 2.");' +
    // A FRASE VOLTA PARA O CAMPO DEPOIS DE `carregarRascunho` (02/11/2026). A função recarrega a
    // frase quando o exercício muda — e acabou de mudar. Sem esta linha, a definição que a
    // professora escreveu no passo 1 era substituída pela do dicionário (ou por nada) no instante
    // em que o termo ficava criado: escrevia-se, gravava-se, e desaparecia do ecrã.
    '    carregarRascunho();' +
    '    if (fraseDoTermo) {' +
    '      FRASE = fraseDoTermo;' +
    '      FRASE_ANTERIOR = fraseDoTermo;' +
    '      var campoF = document.getElementById("vb-frase");' +
    '      if (campoF) campoF.value = fraseDoTermo;' +
    '      pintarNotaDaFrase();' +
    '    }' +
    '    pintarTira();' +
    '    if (depois) depois(true);' +
    '  }).catch(function(e){' +
    '    if (res) { res.className = "res erro"; res.textContent = "Erro: " + e.message; }' +
    '  });' +
    '}' +
    // O RASCUNHO. Nasce do que o alfabeto tem para a música em foco — cópia, não a referência:
    // o que se edita na tela não pode alterar o dado antes de a gravação ser aceite.
    'function carregarRascunho(){' +
    '  var nomes = document.getElementById("vbnome");' +
    '  var nome = nomes ? nomes.value : "";' +
    '  var tempos = (document.getElementById("vbtempos") || {}).value || "";' +
    '  var compasso = (document.getElementById("vbcompasso") || {}).value || "";' +
    '  MUSICA_EM_FOCO = (nome && tempos && compasso) ? tempos + "|" + compasso : "";' +
    '  var v = (VERBETES && VERBETES.verbetes && VERBETES.verbetes[nome]) || null;' +
    '  var base = (MUSICA_EM_FOCO && v && v[MUSICA_EM_FOCO] && v[MUSICA_EM_FOCO].celulas) || {};' +
    // TROCAR A MÚSICA RECOMECE A DECOMPOSIÇÃO, e é a decisão que fica (02/11/2026 — ver a nota da
    // `duplicarExercicio`, que é quem precisa do contrário e o resolve sem mexer aqui). Cheguei a
    // conservar as células quando a música ainda não existe, com o argumento de que elas são o
    // gesto; a suite disse o contrário, e com números: treze asserções passaram a medir o
    // exercício anterior. Uma mão que muda os tempos está a declarar OUTRA música, e outra música
    // é outra decomposição — não um rascunho que se arrasta.
    '  CELULAS = JSON.parse(JSON.stringify(base));' +
    '  SINAIS = [];' +
    // A DIREÇÃO, A ORIENTAÇÃO E A CONTAGEM SOBREVIVEM TROCA DE MÚSICA: quem mudou os tempos
    // continua a escrever o mesmo exercício, e apagar-lhe a direção seria recomeçar o gesto.
    // A FRASE DO VERBETE, CARREGADA UMA VEZ (31/10/2026). A ordem de preferência é a de sempre
    // neste projeto: o que está GRAVADO vence o dicionário (P-03/P-04 — o dicionário pode
    // melhorar sem reescrever o passado). Só quando a música em foco não tem células é que a
    // definição do vocabulário pré-enche o campo; e quando não há nem uma coisa nem outra, o
    // campo fica vazio e a nota pede a frase.
    '  var gravada = fraseGravada(base);' +
    '  var definicao = definicaoDoExercicio();' +
    '  var campoFrase = document.getElementById("vb-frase");' +
    '  var actual = partirFrase((campoFrase || {}).value || "");' +
    // TROCAR A MÚSICA DO MESMO EXERCÍCIO NÃO REESCREVE A FRASE. Ela é do exercício: quem mudou os
    // tempos continua a escrever o mesmo exercício, e devolver-lhe a definição do dicionário por
    // cima do que ele ajustou seria perder o trabalho. Só quando o EXERCÍCIO muda — ou quando o
    // campo está vazio, ou ainda tem exactamente a última sugestão — é que a frase é recarregada.
    '  var trocouExercicio = (nome !== EXERCICIO_EM_FOCO);' +
    '  EXERCICIO_EM_FOCO = nome;' +
    '  if (trocouExercicio || !actual || actual === partirFrase(FRASE_ANTERIOR)) {' +
    '    FRASE = gravada || (definicao ? definicao.texto : "");' +
    '  } else {' +
    '    FRASE = actual;' +
    '  }' +
    '  FRASE_ANTERIOR = FRASE;' +
    '  if (campoFrase) campoFrase.value = FRASE;' +
    '  pintarNotaDaFrase();' +
    '  pintarTrecho();' +
    '  pintarDesacordo();' +
    '  pintarTabela();' +
    '  pintarTira();' +
    '  pintarPassos();' +
    '}' +
    // A FRASE QUE JÁ ESTÁ GRAVADA NO ALFABETO. As células de uma música partilham a frase; quando
    // não partilham (verbete antigo, escrito quando a frase era por trecho), vale a do PRIMEIRO
    // trecho que tenha texto — e as outras continuam como estão, porque a proveniência acrescenta
    // e não edita: só o trecho que ela corrigir recebe a frase nova.
    'function fraseGravada(celulas){' +
    '  var chaves = Object.keys(celulas || {});' +
    '  for (var i = 0; i < chaves.length; i++) {' +
    '    var lista = celulas[chaves[i]] || [];' +
    '    for (var k = 0; k < lista.length; k++) {' +
    '      var cima = partirFrase(lista[k] && lista[k].descricao);' +
    '      if (cima) return cima;' +
    '    }' +
    '  }' +
    '  return "";' +
    '}' +
    'function carregarVerbetes(){' +
    '  var lista = document.getElementById("lista-verbetes");' +
    '  if (!lista) return;' +
    '  fetch("/api/bastidores/verbete").then(lerResposta).then(function(d){' +
    '    if (!d.ok) { lista.innerHTML = "<li>Erro: " + (d.erro || "desconhecido") + "</li>"; return; }' +
    '    VERBETES = d;' +
    // O EXERCÍCIO: um `select` agrupado por categoria. A ordem das categorias é a do dia de
    // aula — barra e centro saem do mesmo vocabulário, a categoria é que os separa.
    '    var nomes = document.getElementById("vbnome");' +
    '    if (nomes) {' +
    '      var antes = nomes.value;' +
    '      var grupos = {};' +
    '      (d.exerciciosDoVocabulario || []).forEach(function(t){' +
    '        grupos[t.categoria] = grupos[t.categoria] || [];' +
    '        grupos[t.categoria].push(t);' +
    '      });' +
    '      var ROTULO = ROTULO_DE_CATEGORIA;' +
    '      var html = "<option value=\'\'>— escolha o exercício —</option>";' +
    '      ["passo", "salto", "ligacao", "giro"].forEach(function(c){' +
    '        if (!grupos[c]) return;' +
    // O `data-cat` existe para o «+»: o termo recém-criado entra no grupo certo da lista, sem
    // esperar que o deploy o traga do repositório. Sem ele, o exercício novo apareceria só no
    // grupo do rótulo que se adivinhasse do texto.
    '        html += "<optgroup label=\'" + (ROTULO[c] || c) + "\' data-cat=\'" + c + "\'>";' +
    '        grupos[c].forEach(function(t){' +
    '          html += "<option value=\'" + t.termo + "\'>" + t.termo + "</option>";' +
    '        });' +
    '        html += "</optgroup>";' +
    '      });' +
    '      nomes.innerHTML = html;' +
    '      if (antes) nomes.value = antes;' +
    '    }' +
    /* O `<select>` DA POSIÇÃO SAIU COM O CAMPO (02/11/2026). Aqui construía-se a lista
     * «primeira posição (pés) · segunda posição (pés)…» para o `#vbposicao`. O campo deixou de
     * existir — a posição escreve-se nos sinais do trecho —, e um bloco que enche um elemento
     * ausente é código que ninguém executa e que faz o próximo leitor procurar o elemento. A
     * etiqueta localizada continua a ler-se onde importa: na LISTAGEM, sobre `p.nome || p.termo`. */
    // A TABELA DAS DIREÇÕES substitui as três caixas de marcar (28/10/2026). Ela não pergunta
    // nada: mostra, para cada direção da gramática, se ESTE verbete a cobre e o que nela acontece.
    // A regra que a governa é a do dado: uma direção existe num verbete se — e só se — esse
    // verbete tem células para ela. Um exercício que não a tem em música nenhuma diz «este
    // exercício não vai ao lado»; um que a tem noutra música diz o que falta escrever.
    // AS DIREÇÕES e OS SINAIS do editor. Os dois vêm do alfabeto — a tela não os escreve de
    // memória, senão envelheciam sozinhos no dia em que a gramática mudasse. E os sinais vêm
    // AGRUPADOS e COM NOME: «→ conduz a», e não um «→» sozinho — a legenda antiga era uma
    // lista de símbolos soltos que ninguém sabia ler.
    '    var selDir = document.getElementById("vb-cel-dir");' +
    '    if (selDir) {' +
    '      var opDir = ["<option value=\'\'>— direção —</option>"];' +
    '      (d.direcoes || []).forEach(function(x){' +
    '        opDir.push("<option value=\'" + x.termo + "\'>" + x.nome + "</option>");' +
    '      });' +
    '      selDir.innerHTML = opDir.join("");' +
    '    }' +
    '    var selSinal = document.getElementById("vb-sinal");' +
    '    if (selSinal) {' +
    '      var grupos = {};' +
    '      (d.sinais || []).forEach(function(x){' +
    '        grupos[x.grupo] = grupos[x.grupo] || [];' +
    '        grupos[x.grupo].push(x);' +
    '      });' +
    '      var opSinal = ["<option value=\'\'>— acrescentar um sinal —</option>"];' +
    '      Object.keys(grupos).forEach(function(g){' +
    '        opSinal.push("<optgroup label=\'" + g + "\'>");' +
    '        grupos[g].forEach(function(x){' +
    '          opSinal.push("<option value=\'" + x.sinal + "\' title=\'" +' +
    '            String(x.significado || "").replace(/\'/g, "") + "\'>" + x.sinal + " " + x.nome + "</option>");' +
    '        });' +
    '        opSinal.push("</optgroup>");' +
    '      });' +
    '      selSinal.innerHTML = opSinal.join("");' +
    '    }' +
    '    carregarRascunho();' +
    // A LISTAGEM DIZ DO QUE SE TRATA (31/10/2026). Era o nome e a chave crua da música —
    // «Battement tendu 4 | 4/4 · 8 | 4/4 · 12 | 4/4» —, e o `|` da chave vazava para a tela. Ela
    // pediu etiquetas que digam, de relance, o que o verbete é: a POSIÇÃO em que acontece (selo,
    // ao lado do nome, como nas outras listas), e por baixo as direções que cobre, o compasso, em
    // quantas músicas está escrito e quantos trechos tem. Tudo derivado do alfabeto.
    /* UMA LINHA POR MÚSICA — E É ASSIM QUE A MÚSICA NOVA TEM PORTA (02/11/2026).
     *
     * A etiqueta agregada («2 músicas») contava o que existia e não abria nada: o «editar» levava
     * sempre `Object.keys(musicas)[0]`, isto é, sempre a primeira. Ela duplicou o `Plié` de 8 para
     * 16 tempos, gravou, o alfabeto ficou com as duas — e a de 16 não apareceu em sítio nenhum.
     * Um dado que se grava e não se consegue voltar a ver é um dado perdido.
     *
     * O cartão segue o modelo das turmas: o nome e os selos na primeira linha, o complemento por
     * baixo. O complemento diz o que se quer saber de relance — os tempos e o compasso, quantos
     * trechos, por onde o exercício passa e que partes do corpo se movem.
     */
    /* AS TRÊS PEÇAS DO CARTÃO, escritas uma vez (02/11/2026).
     *
     * O cartão da turma desenha o `metrica`/`trio-painel` inline, no servidor, porque a lista de
     * turmas é montada lá. A lista de verbetes é montada AQUI, no `script` da página — e a peça
     * tem de ser a mesma, senão as duas listas divergem no primeiro ajuste. Estas três funções
     * são a peça, na linguagem de cá; quem as desenha é a folha (`.trio-item`, `.trio-painel`).
     */
    '    function metricaDoVerbete(rotulo, valor, qual, dica){' +
    '      return "<button type=\\"button\\" class=\\"trio-item\\" data-balao=\\"" + qual +' +
    '        "\\" aria-expanded=\\"false\\" aria-label=\\"" + dica + "\\">" +' +
    '        "<span class=\\"trio-k\\">" + rotulo + "</span>" +' +
    '        "<span class=\\"trio-v\\">" + valor + "</span>" +' +
    '        "<span class=\\"trio-q\\" aria-hidden=\\"true\\">?</span></button>";' +
    '    }' +
    '    function painelDoVerbete(qual, miolo){' +
    '      return "<div class=\\"trio-painel\\" data-painel=\\"" + qual + "\\" hidden>" + miolo + "</div>";' +
    '    }' +
    '    function painelDaMusica(ms){' +
    '      return "<div class=\\"trio-grade\\">" + ms.map(function(m){' +
    '        return "<div><span class=\\"trio-k\\">música</span><span class=\\"trio-v\\">" +' +
    '          (m.tempos || "—") + " tempos em " + (m.compasso || "—") + "</span></div>" +' +
    '          "<div><span class=\\"trio-k\\">compassos</span><span class=\\"trio-v\\">" +' +
    '          Math.ceil((Number(m.tempos) || 0) / (Number(String(m.compasso || "4/4").split("/")[0]) || 4)) +' +
    '          "</span></div>";' +
    '      }).join("") + "</div>";' +
    '    }' +
    '    function painelDaDirecao(m){' +
    '      var onde = (m.direcoes || []).map(nomeDaDirecao)' +
    '        .concat((m.orientacoes || []).map(nomeDaOrientacao));' +
    '      var chips = onde.length' +
    '        ? onde.map(function(x){ return "<span>" + x + "</span>"; }).join("")' +
    '        : "<span class=\\"dono\\">(sem direção — o trecho ainda não foi arrumado)</span>";' +
    '      return "<div class=\\"trio-chips\\">" + chips + "</div>" +' +
    '        "<p class=\\"trio-nota\\">As direções dizem para onde o membro vai; as orientações, como o corpo está voltado. Duas perguntas, e é por isso que são dois eixos.</p>";' +
    '    }' +
    /* A NOTAÇÃO EM TABELA, EM TRÊS COLUNAS (03/11/2026, a pedido dela).
     *
     * A PEÇA É O `table` DA FOLHA — a mesma do documento e do passo 6 —, e não uma lista com um
     * desenho novo: a tabela é o que se lê em coluna.
     *
     * O QUE ELA VIU, e são duas queixas numa: o «o que acontece» repetia-se exaustivamente em cada
     * linha — quatro linhas, quatro vezes a mesma definição —, e o compasso e a contagem dividiam
     * uma célula, com a frequência a faltar.
     *
     * Agora são três colunas com um trabalho cada: `compasso` (onde cai), `contagem` (o que dura,
     * e QUANTAS VEZES — «1–2 (duas vezes)») e `notação` (a forma, que é o que se lê de relance). E
     * a definição sobe para o topo do bloco, ESCRITA UMA VEZ: ela é do EXERCÍCIO, e repeti-la por
     * linha era dizer quatro vezes a mesma frase para no fim não dizer nada.
     *
     * Quando duas linhas têm frases DIFERENTES — um trecho antigo, guardado com a frase com que foi
     * escrito (P-03/P-04) —, aparecem as duas, cada uma uma vez. O que não se faz é escolher uma e
     * calar a outra: seria perder a diferença em nome da limpeza. */
    /* A NOTAÇÃO ABRE SEMPRE QUE HÁ TRECHO GRAVADO (03/11/2026).
     *
     * A frase era «A decomposição deste exercício não pôde ser lida — confira os sinais no
     * formulário», e ela apareceu com DOIS trechos na tabela. O defeito estava antes de aqui (ver
     * `lerLinhas`, em `verbete.js`: o alfabeto do bundle e a escola que não ia na composição), mas
     * a mensagem piorava-o — mandava conferir sinais que estavam certos e escondia o trabalho.
     *
     * Agora a listagem distingue três casos, e só o terceiro é «não há o que ler»:
     *  · há linhas e não há motivo — a decomposição compõe-se, mostra-se a tabela;
     *  · há linhas e há motivo — os trechos estão gravados mas o motor não fecha a conta: mostra-se
     *    a tabela E a razão, porque o dado existe e é legível;
     *  · não há linhas — aí sim não há decomposição, e a frase diz isso sem falar em erro. */
    /* «DUAS VEZES», E NÃO «×2» (03/11/2026). Ela pediu a frequência escrita na coluna da
     * contagem, com este exemplo à frente: «1 a 2 (duas vezes)». A tela da tabela do passo 6 usa
     * `×2` porque ali a largura é disputada por seis colunas; aqui são três, e o português cabe. */
    '    function vezesEmPalavras(n){' +
    '      var nomes = {2: "duas", 3: "três", 4: "quatro", 5: "cinco", 6: "seis", 7: "sete", 8: "oito"};' +
    '      return (nomes[n] || String(n)) + " vezes";' +
    '    }' +
    '    function painelDaNotacao(m){' +
    '      var ls = m.linhas || [];' +
    '      var motivo = String(m.motivo || "");' +
    '      if (!ls.length) {' +
    '        return "<p class=\\"trio-nota\\">" + (motivo ||' +
    '          "Ainda não há trechos gravados nesta música.") + "</p>";' +
    '      }' +
    // O QUE ACONTECE, UMA VEZ, ACIMA DA TABELA. A ordem é a das linhas; as repetidas caem.
    '      var ditas = [];' +
    '      ls.forEach(function(l){' +
    '        var t = String(l.descricao || "").trim();' +
    '        if (t && ditas.indexOf(t) === -1) ditas.push(t);' +
    '      });' +
    '      var topo = ditas.map(function(t){' +
    '        return "<p class=\\"trio-frase\\">" + t + "</p>";' +
    '      }).join("");' +
    '      var aviso = motivo ? "<p class=\\"trio-nota\\">" + motivo + "</p>" : "";' +
    '      return topo + "<table><thead><tr>" +' +
    '        "<th scope=\\"col\\">compasso</th>" +' +
    '        "<th scope=\\"col\\">contagem</th>" +' +
    '        "<th scope=\\"col\\">notação</th>" +' +
    '        "</tr></thead><tbody>" +' +
    '        ls.map(function(l){' +
    '          var n = Number(l.repeticoes) || 1;' +
    '          return "<tr><td><strong>" + l.compasso + "</strong></td>" +' +
    '            "<td>" + l.contagem + (n > 1 ? " (" + vezesEmPalavras(n) + ")" : "") + "</td>" +' +
    '            "<td><code>[" + (l.categoria || "") + ": " + (l.sinais || "") + "]</code></td></tr>";' +
    '        }).join("") + "</tbody></table>" + aviso;' +
    '    }' +
    '    var linhas = [];' +
    '    (d.exercicios || []).forEach(function(x){' +
    '      var posicao = "";' +
    '      (d.posicoes || []).forEach(function(p){' +
    // A ETIQUETA É A DO TERMO, EM PORTUGUÊS, QUANDO ELE A TEM (02/11/2026). O `termo` é o nome
    // na língua da modalidade — «Première position» —, e a listagem lia-o em cru. `nome` é a
    // etiqueta localizada, e é a mesma peça que a `gramatica` já usa para as direções («à
    // frente»). Sem `nome` — um termo que ainda não foi traduzido —, mostra-se o `termo`: uma
    // linha em francês é legível, uma linha vazia não é.
    '        if (x.posicao && p.id === x.posicao.termo) posicao = p.nome || p.termo;' +
    '      });' +
    '      var selos = posicao ? "<span class=\\"selo discreto\\">" + posicao + "</span>" : "";' +
    '      if (x.descontinuado) selos += " <span class=\\"selo alerta\\">descontinuado</span>";' +
    // `porMusica` é o que o servidor passou a mandar. Quando ele não vem — uma página antiga
    // contra um servidor novo, ou o contrário — a listagem cai na linha única de antes, em vez
    // de ficar em branco.
    '      var ms = x.porMusica && x.porMusica.length ? x.porMusica : null;' +
    '      if (!ms) {' +
    '        var t0 = Number(x.trechos) || 0;' +
    '        linhas.push("<li><span class=\\"nome\\"><span class=\\"linha1\\">" +' +
    '          "<button type=\\"button\\" class=\\"verbetes-editar\\" data-nome=\\"" + x.nome +' +
    '          "\\" title=\\"abrir este verbete no formulário\\">" + x.nome + "</button> " + selos +' +
    '          "</span><span class=\\"dono\\">" + (t0 + (t0 === 1 ? " trecho" : " trechos")) +' +
    '          "</span></span></li>");' +
    '        return;' +
    '      }' +
    /* O CARTÃO — as peças da lista de turmas (02/11/2026, escolha dela).
     *
     * A LINHA POR MÚSICA DIZIA TUDO NUMA FRASE e não abria nada; o cartão diz menos de relance e
     * abre o resto a um toque. As três caixinhas são as mesmas da turma: `Música` (a mais alta
     * das músicas que o exercício tem), `Direção` e `Notação`. A caixa INTEIRA é o alvo — o «?» é
     * desenho, e não o alvo de 20px que num telefone pede pontaria.
     *
     * E CONTINUA A SER UMA LINHA POR MÚSICA: a música vai no `data-musica` do botão do nome, e é
     * ela que abre a versão certa. Foi o defeito de hoje de manhã: duas músicas no alfabeto e o
     * «editar» a abrir sempre a primeira.
     */
    '      ms.forEach(function(m, i){' +
    '        var onde = (m.direcoes || []).map(nomeDaDirecao);' +
    '        if ((m.orientacoes || []).length) {' +
    '          onde = onde.concat((m.orientacoes || []).map(nomeDaOrientacao));' +
    '        }' +
    '        var detalhe = [];' +
    '        detalhe.push((m.tempos || "—") + " tempos");' +
    '        if (m.compasso) detalhe.push(m.compasso);' +
    '        detalhe.push(m.trechos + (m.trechos === 1 ? " trecho" : " trechos"));' +
    '        if ((m.categorias || []).length) detalhe.push(m.categorias.join(", "));' +
    '        var alvoDeMusica = "<button type=\\"button\\" class=\\"verbetes-editar\\" data-nome=\\"" +' +
    '          x.nome + "\\" data-musica=\\"" + m.chave +' +
    '          "\\" title=\\"abrir este verbete no formulário\\">" + x.nome + "</button>";' +
    /* A LISTAGEM MARCA O DESACORDO (03/11/2026), e é o que torna a regra utilizável: a tela aceita
     * gravar uma música que não fecha, portanto tem de haver onde se ver QUAIS ficaram por
     * resolver — senão o professor teria de abrir os verbetes um a um para descobrir. A conta é a
     * que a API já devolve (`cobre` e os `tempos` da chave), e o `> 0` protege os verbetes antigos,
     * que não declaravam `cobre`: nesses a ausência não é desacordo, é dado que falta. */
    '        var desacordo = (Number(m.cobre) > 0 && Number(m.tempos) > 0 && Number(m.cobre) !== Number(m.tempos))' +
    '          ? " <span class=\\"selo alerta\\" title=\\"os trechos ocupam " + m.cobre + " tempos e a música declara " + m.tempos + "\\">tempos em desacordo</span>"' +
    '          : "";' +
    /* DE QUEM É A VERSÃO QUE SE ESTÁ A VER (03/11/2026). O alfabeto guarda o verbete do catálogo e
     * o de cada escola; a listagem mostra um por música, e sem esta marca a escola não distinguiria
     * a sua edição do que veio do catálogo. É um selo discreto — atributo do dado, não alarme. */
    '        desacordo += m.escola' +
    '          ? " <span class=\\"selo discreto\\" title=\\"esta versão é da escola; o catálogo mantém a dele\\">edição da escola</span>"' +
    '          : " <span class=\\"selo dim\\" title=\\"esta versão é do catálogo — não se apaga pela escola\\">do catálogo</span>";' +
    '        linhas.push("<li class=\\"turma\\" data-verbete=\\"" + x.nome + "\\">" +' +
    '          "<div class=\\"linha-turma\\"><span class=\\"nome\\">" + alvoDeMusica +' +
    '          " " + selos + "</span>" +' +
    // O «APAGAR» É DO EXERCÍCIO, E ESTÁ UMA VEZ SÓ NA PRIMEIRA MÚSICA (02/11/2026). Repeti-lo em
    // cada linha daria dois botões para o mesmo gesto — e um deles pareceria apagar só aquela
    // música. Fica ao lado do nome, no sítio onde as outras listas põem as acções.
    //
    // E SÓ SE APAGA O QUE É DESTA ESCOLA (03/11/2026). O alfabeto guarda o verbete do catálogo e o
    // de cada escola; apagar o do catálogo pela tela de uma escola tirá-lo-ia a todas. A versão do
    // catálogo mostra o selo «do catálogo» e não tem botão — um botão que recusa é pior do que a
    // ausência dele, porque parece avaria.
    '          (i === 0 && m.escola ? "<span class=\\"acoes\\">" +' +
    '            "<button type=\\"button\\" class=\\"apagar acao perigo pequena\\" data-apagar-verbete=\\"" +' +
    '            x.nome + "\\" title=\\"apagar o verbete deste exercício\\">Apagar</button></span>" : "") +' +
    '          "</div>" +' +
    '          "<div class=\\"dono\\">" + detalhe.join(" · ") + desacordo + "</div>" +' +
    '          "<div class=\\"trio\\">" +' +
    '          metricaDoVerbete("Música", (m.tempos || "—") + " tempos", "musica",' +
    '            "ver a música deste exercício") +' +
    '          metricaDoVerbete("Direção", onde.length ? onde.join(" · ") : "—", "direcao",' +
    '            "ver as direções e as orientações deste exercício") +' +
    '          metricaDoVerbete("Notação", m.trechos + (m.trechos === 1 ? " trecho" : " trechos"),' +
    '            "notacao", "ver a notação deste exercício, trecho a trecho") +' +
    '          "</div>" +' +
    '          painelDoVerbete("musica", painelDaMusica(ms)) +' +
    '          painelDoVerbete("direcao", painelDaDirecao(m)) +' +
    '          painelDoVerbete("notacao", painelDaNotacao(m)) +' +
    '          "</li>");' +
    '      });' +
    '    });' +
    '    lista.innerHTML = linhas.join("") || "<li>Nenhum exercício com verbete.</li>";' +
    '  }).catch(function(e){ lista.innerHTML = "<li>Erro: " + e.message + "</li>"; });' +
    '}' +
    // O «editar» preenche o formulário a partir do que já está no alfabeto: quem edita não
    // reescreve o verbete todo à mão, e o que não mudou não se perde.
    // A MÚSICA VEM DITA, E NÃO ESCOLHIDA PELA ORDEM DAS CHAVES (02/11/2026). Era
    // `Object.keys(musicas)[0]` — sempre a primeira —, e por isso a segunda música de um verbete
    // era inalcançável: existia no alfabeto, era contada na etiqueta, e não havia como a abrir. A
    // listagem passa a dizer qual, e quando não diz (uma chamada antiga) a primeira continua a ser
    // a resposta — mas `Object.keys` também devolve chaves que não são música, e a primeira dessas
    // daria um formulário em branco sobre um verbete que existe.
    'function editarVerbete(nome, chavePedida){' +
    '  if (!VERBETES || !VERBETES.verbetes || !VERBETES.verbetes[nome]) return;' +
    '  var musicas = VERBETES.verbetes[nome];' +
    '  var deMusica = Object.keys(musicas).filter(function(k){ return /^\\d+\\|/.test(k); });' +
    '  var chave = (chavePedida && musicas[chavePedida]) ? chavePedida : deMusica[0];' +
    '  if (!chave) return;' +
    '  var v = musicas[chave];' +
    '  var nomes = document.getElementById("vbnome");' +
    '  if (nomes) {' +
    // Um exercício que já tem verbete mas não está no vocabulário (foi escrito à mão numa
    // versão anterior) entra na lista como opção própria: escondê-lo faria o formulário
    // abrir em branco sobre um verbete que existe.
    '    var existe = false;' +
    '    for (var i = 0; i < nomes.options.length; i++) if (nomes.options[i].value === nome) existe = true;' +
    '    if (!existe) {' +
    '      var o = document.createElement("option");' +
    '      o.value = nome; o.text = nome + " (fora do vocabulário)";' +
    '      nomes.add(o);' +
    '    }' +
    '    nomes.value = nome;' +
    '  }' +
    '  var partes = chave.split("|");' +
    '  document.getElementById("vbtempos").value = partes[0];' +
    '  document.getElementById("vbcompasso").value = partes[1];' +
    '  document.getElementById("vbacao").value = "atualizar";' +
    // `v.posicao` continua no DADO (o selo da listagem lê-o); o que já não há é um campo onde o
    // mostrar no formulário. Ver o bloco acima, em `pintarNomes`.
    '  METODO = v.metodo || "";' +
    '  var selMet = document.getElementById("vbmetodo");' +
    '  if (selMet) selMet.value = METODO;' +
    '  pintarNotaDoMetodo();' +
    '  carregarRascunho();' +
    // E O PASSO 1 É PREENCHIDO COM O EXERCÍCIO ABERTO (02/11/2026). O `carregarRascunho` decide a
    // FRASE (a gravada vence a do dicionário); o que ele não decide é a categoria e a tradição, que
    // são do TERMO. Sem esta chamada, abrir um verbete deixava os dois `<select>` no vazio e
    // congelados — um campo bloqueado sem resposta. */
    '  sincronizarPasso1ComExercicio();' +
    // EDITAR LEVA AO PASSO 1 (02/11/2026 — era o 2). O passo 2 tinha o seletor do exercício e a
    // FRASE; a frase subiu para o passo 1, e é ela que se vem editar quando se abre um verbete. Ir
    // para o 2 deixaria o comportamento certo (não encher campos fora do ecrã) com o sítio errado.
    // O seletor do exercício continua a um clique na tira.
    '  MUSICA_ABERTA = chave;' +
    '  irParaPasso(1);' +
    '  recado("", "a editar «" + nome + "» (" + chave + ")");' +
    '}' +
    'function temposDaContagem(c){' +
    '  var n = String(c || "").match(/\\d+/g);' +
    '  if (!n) return 0;' +
    '  if (n.length === 1) return 1;' +
    '  var a = Number(n[0]), b = Number(n[n.length - 1]);' +
    '  return b >= a ? b - a + 1 : 0;' +
    '}' +
    /* O VERBO APAGAR O VERBETE — UM SÓ, DOIS BOTÕES (02/11/2026).
     *
     * A CONFIRMAÇÃO DIZ O QUE SE PERDE ANTES — não depois. Um `confirm` que só perguntasse
     * «apagar?» seria uma pergunta sem consequência escrita, e aqui a consequência é grande: uma
     * aula publicada que citava o exercício passa a sair com a notação em lacuna.
     *
     * E DIZ TAMBÉM QUE PODE SER RECUSADO. O servidor guarda a proveniência: se o exercício já
     * compõe um plano de ensino (ou o conteúdo de uma turma com plano), o `DELETE` volta 409 com a
     * razão. A pergunta avisa disso antes do gesto — quem descobre a regra depois de confirmar
     * pensa que o botão falhou.
     */
    'function apagarOVerbete(qual){' +
    '  if (!qual) return;' +
    '  var certo = window.confirm("Apagar o verbete de «" + qual + "»? A decomposição dele sai do ' +
    '    alfabeto, e não há como a ler de volta. Uma aula já publicada que use este exercício ' +
    '    passa a sair com a notação em lacuna. O exercício continua no dicionário. " +' +
    '    "Se ele já compõe um plano de ensino, o sistema recusa — e diz porquê.");' +
    '  if (!certo) return;' +
    '  fetch("/api/bastidores/verbete", {' +
    '    method: "DELETE", headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({token: TOKEN, nome: qual, modalidade: "bale-classico"})' +
    '  }).then(lerResposta).then(function(d){' +
    '    if (!d.ok) { recado("erro", d.erro || "não foi possível apagar"); return; }' +
    '    recado("ok", "verbete de «" + qual + "» apagado — versão " + d.versao);' +
    // E O FORMULÁRIO SAI DE CIMA DELE: apagar o exercício que está aberto deixaria a tela a compor
    // trechos de um verbete que já não existe, e a gravação seguinte recriava-o sem ninguém pedir.
    '    var emFoco = (document.getElementById("vbnome") || {}).value || "";' +
    '    if (emFoco === qual) {' +
    '      EM_EDICAO = null; MUSICA_ABERTA = ""; CELULAS = {}; SINAIS = [];' +
    '      var f = document.getElementById("form-verbete"); if (f) f.reset();' +
    '      document.getElementById("vbacao").value = "criar";' +
    '      irParaPasso(1);' +
    '      carregarRascunho();' +
    '    }' +
    '    carregarVerbetes();' +
    '  }).catch(function(err){ recado("erro", "Erro: " + err.message); });' +
    '}' +
    'var listaVerbetes = document.getElementById("lista-verbetes");' +
    'if (listaVerbetes) {' +
    '  carregarVerbetes();' +
    '  listaVerbetes.addEventListener("click", function(e){' +
    /* O «?» DAS CAIXINHAS NÃO PRECISA DE HANDLER AQUI (02/11/2026) — e escrevi um, e estava
     * errado. A página já tem um ouvinte de `.trio-item` no `document`, o que serve o cartão da
     * turma: abre um, fecha os outros, fecha ao tocar outra vez, e `Escape` fecha. Ele dispara
     * DEPOIS deste, no mesmo clique — e o que ele encontrava era o painel que eu tinha acabado de
     * abrir, com `aria-expanded="true"`, e fechava-o. O sintoma era o pior de todos: o botão
     * respondia a tudo e não abria nada.
     *
     * A lição é a regra da casa, e eu tentei escrever uma segunda: **uma peça, um comportamento.**
     * Como o cartão do verbete usa a MESMA marcação (`li.turma`, `.trio-item`, `.trio-painel`), ele
     * é servido pelo ouvinte que já existe. O que este `li` guarda é só a porta do nome.
     */
    // O «APAGAR» DO CARTÃO, E O DO PASSO 6 (02/11/2026). Os dois chamam a MESMA função — o
    // verbo é um só, e ela pediu-o em dois sítios. Duas cópias divergiriam na primeira correcção.
    '    var ap = e.target.closest ? e.target.closest("button[data-apagar-verbete]") : null;' +
    '    if (ap) { apagarOVerbete(ap.getAttribute("data-apagar-verbete")); return; }' +
    '    var b = e.target.closest ? e.target.closest("button.verbetes-editar") : null;' +
    '    if (b) editarVerbete(b.getAttribute("data-nome"), b.getAttribute("data-musica"));' +
    '  });' +
    '}' +
    'var formVerbete = document.getElementById("form-verbete");' +
    'if (formVerbete) formVerbete.addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    // O `submit` PERTENCE AO VERBETE, E SÓ A ELE (02/11/2026). Havia aqui uma guarda para o
    // «modo do exercício» — submeter com os campos do verbete escondidos gravaria um verbete que
    // ninguém preencheu. Já não há modo: o passo 1 tem os seus campos e o `Enter` dele cria o
    // exercício (ver o handler do `vnnome`), e o `submit` só chega aqui vindo do passo 6.
    '  var nomes = document.getElementById("vbnome");' +
    '  var nome = nomes ? nomes.value.trim() : "";' +
    '  var tempos = document.getElementById("vbtempos").value.trim();' +
    '  var compasso = document.getElementById("vbcompasso").value;' +
    '  if (!nome) { alert("Escolha o exercício."); return; }' +
    '  if (!tempos) { alert("Informe os tempos."); return; }' +
    // AS CÉLULAS SÃO AS QUE JÁ EXISTEM, e não escritas em branco: quem edita um verbete não
    // reescreve as descrições, e o que está no alfabeto é o que foi conferido.
    //
    // E ELAS SÃO TODAS (28/10/2026). Havia aqui uma caixa de marcar por direção, e o que se
    // marcava era o que se gravava: dava para gravar um verbete a que faltava a direção que o
    // exercício faz. A direção agora é a chave da célula, e as células desta música são as que
    // o alfabeto tem — a tela não escolhe, mostra.
    // O QUE SE GRAVA É O RASCUNHO (28/10/2026) — com as células que o editor acrescentou e sem
    // as que ele tirou. Era aqui que o formulário só sabia repetir o que já existia.
    '  if (MUSICA_EM_FOCO !== tempos + "|" + compasso) carregarRascunho();' +
    // A ÚLTIMA DEFESA ANTES DE ENVIAR (02/11/2026). O balde vazio pode nascer em mais sítios do
    // que os dois que já o limpam — e um 400 no fim do trabalho é a pior altura para descobrir.
    // Aqui o que sai é o que existe: nenhum balde com zero células atravessa esta linha.
    '  limparBaldesVazios();' +
    '  var celulas = CELULAS;' +
    '  var dirs = Object.keys(celulas);' +
    '  if (!dirs.length) {' +
    '    recado("erro", "Este verbete ainda não tem nenhuma célula. Escreva ao menos uma em «A decomposição» — é a descrição dela que a página da aula mostra.");' +
    '    return;' +
    '  }' +
    // A FRASE VAZIA NÃO PASSA. Ela é o que o documento escreve; uma célula sem ela seria uma
    // linha muda na página da aula. A recusa nomeia o trecho, e não «faltam campos».
    '  var mudos = [];' +
    '  dirs.forEach(function(d){' +
    '    (celulas[d] || []).forEach(function(c, k){' +
    '      if (!String(c.descricao || "").trim()) mudos.push(d + " " + c.contagem);' +
    '    });' +
    '  });' +
    '  if (mudos.length) {' +
    '    recado("erro", "Falta o que acontece em: " + mudos.join(", ") + " — é a frase que a página da aula mostra.");' +
    '    return;' +
    '  }' +
    /* O DESACORDO ENTRE A MÚSICA E AS CÉLULAS NÃO RECUSA — GRAVA E AVISA (03/11/2026).
     *
     * ERA UMA RECUSA, e a recusa tinha o defeito de prender o trabalho: ela mudou a música de um
     * verbete que já tinha trechos (o caso do §1 do relatório dela) e a gravação parou com
     * «sobram N tempos» — a decomposição ficava entre uma música que já não é a dela e uma
     * gravação que não passa. A regra que fica é a dela, escrita na mesma mensagem: a música
     * edita-se sempre; se divergir, **não se apaga nada**, aparece um alerta, e quem decide como
     * resolver é quem ensina.
     *
     * O QUE A GRAVAÇÃO CONTINUA A RECUSAR é o que é do verbete consigo mesmo e o que impede o
     * documento de existir: trecho sem sinais, `cobre` que não bate com as pistas, célula sem
     * descrição, exercício sem música. Isso é dado inválido, não decisão em aberto.
     *
     * O AVISO DIZ ONDE SE CORRIGE — a música (passo 3) ou os trechos (passo 4) —, porque são as
     * duas únicas hipóteses: ou a música declarada é outra, ou falta (ou sobra) um trecho. E diz
     * que gravar não recusa, senão a mensagem lê-se como a recusa que deixou de existir.
     *
     * O NÚMERO DOS PASSOS NÃO SE ESCREVE À MÃO: sai de `PASSOS_TITULOS`, que é a mesma lista que
     * desenha a tira. Uma renumeração futura leva a mensagem consigo.
     */
    /* A CONTA É A DA MAIOR PISTA — E AQUI AINDA ERA A SOMA EM LINHA (02/11/2026).
     *
     * É O DEFEITO QUE ELA RELATOU, com o número exacto: «as células somam 12 tempos e a música
     * declara 8». Um Plié com a perna a fazer 8 e o braço a fazer 4, em paralelo, era contado como
     * 12 e RECUSADO NA TELA — antes de chegar ao servidor, que já o aceitava. A régua das pistas
     * foi aplicada no motor, no validador e na cobertura da tabela, e esta linha ficou para trás:
     * quatro sítios, três corrigidos. O sintoma é o pior dos dois mundos — o dado está certo e a
     * tela diz que não.
     *
     * Passa a chamar `cobertura()`, que é a MESMA função que a tabela usa: uma conta, um sítio.
     * `dirs` e `celulas` deixam de ser lidos aqui — quem soma é `pistasDe`, e é de lá que sai a
     * maior. */
    '  var soma = cobertura();' +
    '  var temposDaMusica = Number(tempos) || 0;' +
    '  var desacordo = "";' +
    '  if (temposDaMusica > 0 && soma !== temposDaMusica) {' +
    '    var nM = passoPorRotulo("a música"), nO = passoPorRotulo("para onde");' +
    // AS PISTAS VÃO NA MENSAGEM quando há mais do que uma: sem elas, «a maior pista tem 8» é um
    // número que o professor não tem como conferir a olho — e foi exactamente a incompreensão que
    // gerou o relatório («o motor está somando as linhas de forma sequencial/linear»).
    '    var pistasDaVez = pistasDe(CELULAS);' +
    '    var onde = pistasDaVez.ordem.length > 1' +
    '      ? " (pistas: " + pistasDaVez.ordem.map(function(k){ return k.toLowerCase() + " " + pistasDaVez.pistas[k]; }).join(" · ") + " — vale a maior, porque correm ao mesmo tempo)"' +
    '      : "";' +
    '    desacordo = "As células ocupam " + soma + " tempos e a música declara " + temposDaMusica + " — " +' +
    '      (soma < temposDaMusica ? "faltam " + (temposDaMusica - soma) : "sobram " + (soma - temposDaMusica)) + " tempos" + onde + ". " +' +
    '      "Gravar não recusa: corrija no passo " + nM + " («" + rotuloDoPasso(nM) + "») se a música é outra, ou no passo " + nO + " («" + rotuloDoPasso(nO) + "») se falta — ou sobra — um trecho.";' +
    '  }' +
    /* A POSIÇÃO NÃO VAI MAIS NO CORPO (02/11/2026): o campo saiu do formulário. `null` é a
     * resposta honesta — «este verbete não declara posição» —, e o validador só confere a posição
     * quando ela existe. Um verbete ANTIGO que já a tinha conserva-a no ficheiro? Não: gravar
     * substitui a música, e a posição vai com ela. É a consequência de a retirar, e é declarada:
     * quem quiser a posição de volta escreve-a nos sinais, que é onde ela passou a viver. */
    '  var sel = null;' +
    '  var opcao = null;' +
    '  var comoNova = document.getElementById("vb-como-nova");' +
    '  var manterAsDuas = Boolean(comoNova && comoNova.checked);' +
    '  var corpo = {' +
    '    acao: document.getElementById("vbacao").value,' +
    '    modalidade: "bale-classico",' +
    '    nome: nome,' +
    '    musica: tempos + "|" + compasso,' +
    // A MÚSICA DE ONDE SE VEIO VAI JUNTO, E É O QUE FAZ DO «GRAVAR» UMA SUBSTITUIÇÃO
    // (02/11/2026). Sem ela o servidor só sabe escrever a chave nova, e a antiga fica ao lado: foi
    // o «criou um novo registro e manteve o registro antigo» que ela relatou. Com a caixa marcada,
    // não vai — e aí ficam as duas, que é a intenção declarada.
    '    musicaAnterior: (!manterAsDuas && substituiMusica()) ? MUSICA_ABERTA : undefined,' +
    '    verbete: {' +
    '      cobre: soma,' +
    '      posicao: (sel && opcao && sel.value) ? {membro: opcao.getAttribute("data-membro"), termo: sel.value} : null,' +
    // O método só viaja quando é uma SOBREPOSIÇÃO; vazio quer dizer «herda», e gravar a chave
    // vazia seria escrever a ausência de uma decisão que ninguém tomou.
    '      metodo: METODO || undefined,' +
    '      celulas: celulas' +
    '    }' +
    '  };' +
    '  enviar("/api/bastidores/verbete", corpo, "gravando...", false, function(d){' +
    // DEPOIS DE GRAVAR, A MÚSICA ABERTA É A NOVA. Sem isto, a segunda gravação da mesma sessão
    // voltaria a mandar a chave antiga, e o servidor tentaria apagar uma música que já não existe.
    '    MUSICA_ABERTA = corpo.musica;' +
    '    var cn = document.getElementById("vb-como-nova"); if (cn) cn.checked = false;' +
    '    pintarComoNova();' +
    /* O AJUSTE DIZ-SE (02/11/2026). Se este verbete já compõe um plano de ensino, a gravação não
     * reescreveu o passado: o estado anterior ficou no histórico, com a data em que deixou de
     * valer. Quem corrigiu tem de o saber — senão, ou pensa que o documento antigo mudou, ou pensa
     * que a correcção não pegou. */
    '    recado("ok", d.ajustou' +
    '      ? ("gravado — versão " + d.versao + ". Este exercício já compõe um plano, por isso a " +' +
    '         "gravação é um AJUSTE: a versão anterior fica no histórico, com a data em que deixou " +' +
    '         "de valer (" + d.ajustou + "), e os documentos dessa data continuam a ler-se como " +' +
    '         "foram escritos.")' +
    '      : ("gravado — versão " + d.versao));' +
    /* O DESACORDO NÃO SE CALA DEPOIS DE GRAVAR (03/11/2026). O servidor aceitou — é a regra nova —
     * e devolve os avisos; a tela mostra-os em vez de dizer só «gravado». Uma gravação que aceita
     * em silêncio e depois sai em `conferir` no documento é a pior das duas: o professor pensa que
     * está resolvido. */
    '    if (d.avisos && d.avisos.length) {' +
    '      recado("erro", "gravado — versão " + d.versao + ", mas há um desacordo por resolver: " + d.avisos.join(" "));' +
    '    }' +
    '    pintarDesacordo();' +
    '    carregarVerbetes();' +
    '  });' +
    '});' +
    // ---------------------------------------------------------------------------
    // O PASSO 1 GRAVA O EXERCÍCIO — e é o «Seguir →» que o faz (02/11/2026).
    //
    // NÃO HÁ «+», NÃO HÁ «Gravar exercício», NÃO HÁ «Cancelar». O «+» existia para abrir um
    // cadastro que agora é um passo; os dois botões existiam porque o cadastro tinha vida
    // própria, e um passo não tem: avança-se com a navegação que já estava lá.
    //
    // O `Enter` no nome faz o mesmo que o «Seguir →»: cria e avança. Sem isto, o `Enter` dentro
    // do passo 1 submetia `#form-verbete` — um verbete sem exercício nenhum.
    // ---------------------------------------------------------------------------
    'var campoNovo = document.getElementById("vnnome");' +
    'if (campoNovo) {' +
    // O BLOCO DO PASSO 1 ACENDE E APAGA COM O NOME (02/11/2026). É `input` e não `change`: a
    // regra é sobre o que está escrito, e `change` só dispara ao sair do campo — durante o
    // preenchimento os três ficariam apagados e ninguém saberia porque.
    '  campoNovo.addEventListener("input", alternarPasso1);' +
    '  campoNovo.addEventListener("keydown", function(ev){' +
    '    if (ev.key !== "Enter") return;' +
    '    ev.preventDefault();' +
    '    criarExercicioDoPasso1(function(){ irParaPasso(2); });' +
    '  });' +
    '}' +
    'var novoVerbete = document.getElementById("vbnovo");' +
    'if (novoVerbete) novoVerbete.addEventListener("click", function(){' +
    '  var f = document.getElementById("form-verbete");' +
    '  if (f) f.reset();' +
    '  document.getElementById("vbacao").value = "criar";' +
    // «LIMPAR» TAMBÉM SAI DA EDIÇÃO (31/10/2026): quem limpa o formulário não quer voltar a um
    // trecho que já não está lá a ser corrigido.
    //
    // E VAI PARA O PASSO 2, e não para o 1 (02/11/2026). O passo 1 é o exercício NOVO: limpar o
    // formulário para escrever outro verbete de um exercício que já existe não deve pôr ninguém a
    // escrever outro nome — quem quer criar um exercício vai ao 1 de propósito.
    '  EM_EDICAO = null;' +
    '  MUSICA_ABERTA = "";' +
    '  irParaPasso(2);' +
    '  carregarRascunho();' +
    '});' +
    // A TABELA ACOMPANHA A ESCOLHA. Ela depende de três campos — exercício, tempos e compasso —,
    // e nenhum deles avisa quando muda por código (o «editar» põe os valores por `value =`). Por
    // isso é recarregada nos três eventos, e não só quando a lista chega.
    '["vbnome", "vbcompasso"].forEach(function(id){' +
    '  var el = document.getElementById(id);' +
    '  if (el) el.addEventListener("change", function(){' +
    // O COMPASSO NÃO RECOMECE A DECOMPOSIÇÃO (03/11/2026): a música edita-se e os trechos ficam.
    // Quem recomeça é `carregarRascunho`, e ele só corre quando o EXERCÍCIO muda. Por isso este
    // caso sai antes de tudo o resto — inclusive antes de limpar a correcção em curso, que
    // continua a ser a mesma célula.
    '    if (this && this.id === "vbcompasso") { musicaMudou(); return; }' +
    // TROCAR DE EXERCÍCIO CANCELA A EDIÇÃO (31/10/2026): as células são outras, e o trecho que se
    // estava a corrigir deixou de existir neste verbete.
    '    EM_EDICAO = null;' +
    // E TROCAR DE EXERCÍCIO ESQUECE A MÚSICA QUE SE TINHA ABERTO (02/11/2026). `MUSICA_ABERTA` é
    // «o registo que estou a editar»; mudar de exercício é deixar de o editar. Sem isto, quem
    // editasse o Plié e depois fosse criar outro exercício levava consigo a memória do Plié — e a
    // gravação seguinte apagava uma música que não tinha nada que ver com o que estava na tela.
    '    if (this && this.id === "vbnome") { MUSICA_ABERTA = ""; sugerirMetodo(); }' +
    '    carregarRascunho();' +
    // O PASSO 1 LÊ O EXERCÍCIO ESCOLHIDO (02/11/2026). Depois de carregar o rascunho — que é
    // quem decide a frase (a gravada vence a do dicionário) —, os três campos do passo 1 são
    // preenchidos e congelados. Ver `sincronizarPasso1ComExercicio`.
    '    if (this && this.id === "vbnome") sincronizarPasso1ComExercicio();' +
    '  });' +
    '});' +
    // A CATEGORIA E A TRADIÇÃO DO PASSO 1 SÃO OBRIGATÓRIAS, e mudam a validade da etapa
    // (02/11/2026). O `change` basta: são `<select>`, e não há escrita a meio.
    '["vncategoria", "vntradicao"].forEach(function(id){' +
    '  var el = document.getElementById(id);' +
    '  if (el) el.addEventListener("change", pintarNavegacao);' +
    '});' +
    // O `input` DOS TEMPOS NÃO RECOMECE A DECOMPOSIÇÃO (03/11/2026). Era `carregarRascunho`, e o
    // efeito era o relatado por ela: mudar os tempos apagava os trechos que estavam na tela. A
    // música edita-se; o que muda é o aviso — a cobertura, a nota e o selo do desacordo. Quem
    // recomeça a decomposição a partir do alfabeto é `carregarRascunho`, que só corre quando o
    // EXERCÍCIO muda ou quando um verbete é aberto para edição.
    '(function(){' +
    '  var t = document.getElementById("vbtempos");' +
    '  if (t) t.addEventListener("input", musicaMudou);' +
    '})();' +
    // A FRASE DO VERBETE (31/10/2026). O campo é do exercício e não do trecho: escrevê-lo não
    // repinta a decomposição que já está gravada (o que está escrito não se reescreve) — só a
    // tira e a prévia do último passo, que dizem o que VAI ser escrito a partir daqui.
    '(function(){' +
    '  var f = document.getElementById("vb-frase");' +
    '  if (!f) return;' +
    '  f.addEventListener("input", function(){' +
    '    FRASE = partirFrase(f.value);' +
    '    pintarNotaDaFrase();' +
    '    pintarTira();' +
    '    pintarFica();' +
    '  });' +
    '})();' +
    // O OUVINTE QUE REPINTAVA A TIRA AO MUDAR A POSIÇÃO SAIU (02/11/2026): não há campo de posição
    // para mudar. O que resta da ideia de 01/11/2026 — «a tira é o resumo do que já está decidido»
    // — continua no `pintarTira`, chamado por quem muda o nome e a música.
    // ---- o formulário de um trecho -----------------------------------------------------
    // AS PÍLULAS LIGAM-SE A SI MESMAS. A direção manda na contagem — quem escolhe a direção vê
    // as contagens que cabem naquela direção, e não uma lista fixa de «1–2, 3–4», que só serviria
    // para um 4/4 vazio. Os sinais compõem a sequência, e a categoria muda o nome do bloco.
    '(function(){' +
    '  var alvo = document.getElementById("vb-chips");' +
    '  if (alvo) alvo.addEventListener("click", function(e){' +
    '    var b = e.target.closest ? e.target.closest("button[data-sinal]") : null;' +
    '    if (b) {' +
    // O «×» TIRA — e tira o SINAL CERTO. A ficha que estava marcada para troca perde a marca
    // quando o índice que sai é ela ou um anterior: os índices andam para trás, e uma marca
    // deixada em cima do vizinho trocaria o sinal errado sem ninguém dar por isso.
    '      var i = Number(b.getAttribute("data-sinal"));' +
    '      SINAIS.splice(i, 1);' +
    '      if (SINAL_EM_TROCA !== null && SINAL_EM_TROCA >= i) SINAL_EM_TROCA = null;' +
    '      pintarChips();' +
    '      return;' +
    '    }' +
    '    var f = e.target.closest ? e.target.closest("[data-trocar]") : null;' +
    '    if (!f) return;' +
    '    var k = Number(f.getAttribute("data-trocar"));' +
    '    SINAL_EM_TROCA = (SINAL_EM_TROCA === k) ? null : k;' +
    '    pintarChips();' +
    '  });' +
    '  Array.prototype.slice.call(document.querySelectorAll("input[name=vb-cat]")).forEach(function(r){' +
    // A CATEGORIA MANDA NA CONTAGEM (02/11/2026). Ela é a pista, e a pista é o relógio: mudar de
    // `Perna` para `Braço` pode recomeçar a contagem em 1. Sem esta repintura, a lista continuava
    // a oferecer os tempos da pista anterior e o trecho nascia no sítio errado.
    '    r.addEventListener("change", function(){ pintarChips(); pintarContagens(); });' +
    '  });' +
    '})();' +
    // ---- a tira e a navegação (31/10/2026) -------------------------------------------
    /* A TIRA É A NAVEGAÇÃO, E AGORA ELA TAMBÉM FECHA (02/11/2026, segunda correcção do dia).
     *
     * ERA «NÃO BLOQUEIA — quem quer espiar o último passo antes de escrever os sinais pode, e a
     * tabela diz o que falta. É a diferença entre conduzir e impedir.» A pesquisadora reviu-a:
     * «o step seguinte permanece desabilitado; o Seguir permanece bloqueado; o Voltar permanece
     * habilitado». A regra está em `pintarNavegacao`, e é ela que põe o `disabled` em cada botão
     * — aqui só se liga o clique, que num botão desactivado nem chega a disparar.
     *
     * O QUE NÃO MUDA: o passo actual e os anteriores continuam abertos. Espiar o que já se
     * decidiu não perde nada; espiar o que ainda não se pode decidir era o que ela quis travar. */
    'Array.prototype.slice.call(document.querySelectorAll("#vb-tira button.passo")).forEach(function(b){' +
    '  b.addEventListener("click", function(){ irParaPasso(b.getAttribute("data-passo")); });' +
    '});' +
    'var bVoltar = document.getElementById("vb-voltar");' +
    'if (bVoltar) bVoltar.addEventListener("click", function(){ irParaPasso(PASSO - 1); });' +
    /* O «SEGUIR» GRAVA O EXERCÍCIO QUANDO ESTÁ NO PASSO 1 (02/11/2026). É o único ponto do
     * formulário em que avançar tem um efeito além de avançar — e tem de ter: o passo 2 escolhe
     * de uma lista que ainda não tem o exercício que se acabou de escrever. Nos outros passos
     * continua a ser só navegação. */
    'var bSeguir = document.getElementById("vb-seguir");' +
    'if (bSeguir) bSeguir.addEventListener("click", function(){' +
    '  if (PASSO === 1) { criarExercicioDoPasso1(function(){ irParaPasso(2); }); return; }' +
    '  irParaPasso(PASSO + 1);' +
    '});' +
    '["vb-cancelar-edicao", "vb-cancelar-edicao-2"].forEach(function(id){' +
    '  var b = document.getElementById(id);' +
    '  if (b) b.addEventListener("click", cancelarEdicao);' +
    '});' +
    // O «EDITAR» E O «×» DA TABELA. O «Editar» carrega o trecho nos passos do trecho e abre o modo de
    // edição; o «×» tira-o. Em edição, o «×» **não** aparece: apagar o trecho que se está a
    // corrigir é a única coisa que não pode acontecer por engano.
    'var bTabelaVerbetes = document.getElementById("vb-tabela");' +
    'if (bTabelaVerbetes) {' +
    '  bTabelaVerbetes.addEventListener("click", function(e){' +
    '    var ed = e.target.closest ? e.target.closest("button[data-editar]") : null;' +
    '    if (ed) {' +
    '      var p = ed.getAttribute("data-editar").split(":");' +
    '      editarTrecho(p[0], p[1]);' +
    '      return;' +
    '    }' +
    '    var can = e.target.closest ? e.target.closest("button[data-cancelar-edicao]") : null;' +
    '    if (can) { cancelarEdicao(); return; }' +
    '  });' +
    '}' +
    // ACRESCENTAR O TRECHO. A recusa diz O QUE FALTA, campo a campo — e nunca «faltam campos».
    // A DIREÇÃO E A ORIENTAÇÃO FICAM depois de acrescentar, e só os sinais, a contagem e a frase
    // se limpam: é o que permite emendar o en croix sem reescolher a direção a cada trecho.
        // O SELECT DA REPETIÇÃO ALIMENTA O ESTADO — sem isto seria decoração: mudar o número não
    // mudaria o que se grava, e a célula saía sempre com 1×.
    'var selMetodo = document.getElementById("vbmetodo");' +
    'if (selMetodo) {' +
    '  selMetodo.addEventListener("change", function(){ METODO = selMetodo.value; pintarNotaDoMetodo(); });' +
    '}' +
    'var selRepeticoes = document.getElementById("vb-repeticoes");' +
    'if (selRepeticoes) {' +
    '  selRepeticoes.addEventListener("change", function(){' +
    '    REPETICOES = Number(selRepeticoes.value) || 1;' +
    '    pintarContagens();' +
    '    pintarTira();' +
    '  });' +
    '}' +
// UMA FUNÇÃO, DOIS BOTÕES (02/11/2026). A acção é a mesma — acrescentar quando não se está a
    // corrigir, guardar quando se está —, e o que mudou foi ONDE ela mora: um botão para cada
    // coisa, e cada um só aparece quando se pode usar. Duplicar o corpo em dois sítios seria a
    // receita para os dois divergirem ao primeiro ajuste.
    'function acrescentarOuGuardar(){' +
    // A FRASE GRAVADA É COMPOSTA AQUI (31/10/2026): a frase do VERBETE (passo 1, escrita uma vez)
    // + o «lê-se» derivado dos sinais DESTE trecho. É a mesma composição para todos os trechos —
    // o que muda é o «lê-se» —, e é ela que a página da aula mostra.
    '    var escrito = partirFrase((document.getElementById("vb-frase") || {}).value || "");' +
    '    var desc = [escrito, comoSeLe(SINAIS)].filter(Boolean).join("\\n");' +
    '    var faltando = [];' +
    '    if (!MUSICA_EM_FOCO) faltando.push("o exercício, os tempos e o compasso");' +
    // A DIREÇÃO NÃO SE PEDE (01/11/2026). Era a primeira da lista de faltas — e não falta: um
    // trecho pode não ter direção, e é o caso do `relevé`. A recusa continua a dizer o que falta
    // DE VERDADE (o exercício, a contagem, os sinais e a frase).
    '    if (!CONTAGEM) faltando.push("a contagem");' +
    '    if (!SINAIS.length) faltando.push("ao menos um sinal");' +
    // A RECUSA OLHA PARA A FRASE DO VERBETE, e aponta o passo onde ela se escreve: sem ela, o
    // «lê-se» sozinho daria texto e a célula não diria em português o que o exercício é.
    '    if (!escrito) faltando.push("a frase do verbete (no passo 1)");' +
    '    if (faltando.length) { recado("erro", "Falta " + faltando.join(", ") + "."); return; }' +
    '    var celula = {contagem: CONTAGEM, categoria: categoriaEscolhida(),' +
    '      sinais: SINAIS.slice(), descricao: desc};' +
    // A REPETIÇÃO SÓ SE GRAVA QUANDO NÃO É 1: a omissão já quer dizer «uma vez», e escrevê-la em
    // todas as células seria ruído — a mesma regra da orientação, que só se grava quando não é
    // `en face`.
    '    if (REPETICOES > 1) celula.repeticoes = REPETICOES;' +
    // A ORIENTAÇÃO SÓ SE GRAVA QUANDO NÃO É `en face`: a omissão já quer dizer isso, e escrevê-la
    // em todas as células encheria o alfabeto de ruído que não diz nada de novo.
    '    if (ORIENTACAO) celula.orientacao = ORIENTACAO;' +
    // O MESMO BOTÃO FAZ AS DUAS COISAS (31/10/2026): acrescenta um trecho novo, ou GUARDA a
    // alteração. É a mesma validação e a mesma composição — muda o destino. E quando a direção
    // muda numa edição, o trecho MUDA DE BLOCO: a direção é a chave da célula, e deixá-lo no
    // bloco antigo seria gravar uma célula que diz uma coisa e está noutra.
    '    var eraEdicao = Boolean(EM_EDICAO);' +
    // A CORRECÇÃO SUBSTITUI NO LUGAR, E NÃO EMPURRA PARA O FIM (02/11/2026).
    //
    // ERA `splice` + `push`, e o efeito era o defeito relatado: corrigir o braço do compasso 1
    // movia-o para o fim da lista, e como o compasso de cada trecho sai da ORDEM (um relógio por
    // pista), o compasso 1 passava a 2 e a ordem da decomposição trocava. Corrigir um campo
    // reescrevia a posição temporal do trecho — que é o dado que a decomposição existe para
    // mostrar.
    //
    // Com a mesma direção, o índice é o mesmo: substitui-se a célula e nada mais se mexe. Quando a
    // direção muda, a célula muda de balde — e aí entra na MESMA posição ordinal, não no fim, para
    // o tempo se manter tanto quanto possível; e o balde que ficou vazio sai, porque um balde
    // vazio é recusado pela validação («a direção X não tem célula»).
    '    if (EM_EDICAO) {' +
    '      var kEdit = EM_EDICAO.k;' +
    '      if (EM_EDICAO.dir === DIRECAO) {' +
    '        CELULAS[DIRECAO][kEdit] = celula;' +
    '      } else {' +
    '        CELULAS[EM_EDICAO.dir].splice(kEdit, 1);' +
    '        if (!CELULAS[EM_EDICAO.dir].length) delete CELULAS[EM_EDICAO.dir];' +
    '        CELULAS[DIRECAO] = CELULAS[DIRECAO] || [];' +
    '        CELULAS[DIRECAO].splice(Math.min(kEdit, CELULAS[DIRECAO].length), 0, celula);' +
    '      }' +
    '      EM_EDICAO = null;' +
    '    } else {' +
    '      CELULAS[DIRECAO] = CELULAS[DIRECAO] || [];' +
    '      CELULAS[DIRECAO].push(celula);' +
    '    }' +
    '    SINAIS = [];' +
    '    SINAL_EM_TROCA = null;' +
    '    CONTAGEM = "";' +
    '    REPETICOES = 1;' +
    '    var selRep = document.getElementById("vb-repeticoes"); if (selRep) selRep.value = "1";' +
    // A FRASE NÃO SE LIMPA (31/10/2026): ela é do VERBETE, e é precisamente isso que impede a
    // professora de a reescrever a cada trecho. O que se limpa é o que é do trecho.
    '    pintarContagens();' +
    '    pintarChips();' +
    '    pintarTabela();' +
    '    pintarTira();' +
    // ACRESCENTAR OU GUARDAR NÃO MUDA DE PASSO (02/11/2026). Era `irParaPasso(PASSOS_DO_TRECHO[0])`,
    // e o efeito era o relatado: carregar em «Acrescentar trecho» dentro da decomposição atirava o
    // utilizador de volta para o passo 4 (ou para o 5, se fosse de lá que vinha), e ele tinha de
    // voltar ao 6 para ver o que tinha acabado de acrescentar. Fica-se onde se está: o que se
    // limpam são os campos do trecho, e a tabela — que é o que se está a olhar — já mostra a linha
    // nova.
    '    pintarPassos();' +
    '    recado("ok", (eraEdicao ? "trecho alterado" : "trecho acrescentado") + " — grave o verbete para o guardar.");' +
    '}' +
    /* DUPLICAR O EXERCÍCIO (02/11/2026).
     *
     * A barra repete a MESMA decomposição mudando a posição das pernas — `Plié` em 1ª, em 2ª,
     * em 4ª, em 5ª. O que varia é uma coisa; o resto é igual, e reescrevê-lo compasso a compasso
     * é trabalho repetido.
     *
     * DUPLICA TAL E QUAL, e isto é uma decisão e não uma omissão. No `Plié` o `1ª` está nas duas
     * pistas — a perna é `ED 1ª ↓ ↑`, o braço é `⌒ 2ª → 1ª → 2ª` — e uma troca de posição feita
     * pela máquina escreveria `⌒ 2ª → 2ª → 2ª`: a cópia ficaria silenciosamente errada, que é
     * pior do que ficar por ajustar. Quem sabe qual `1ª` é a perna é a professora, e ela muda-o
     * no «Editar» do trecho, onde vê o que está a mudar.
     *
     * A CÓPIA ENTRA NO FIM DE CADA DIREÇÃO, e é o que se quer: o compasso é derivado da ORDEM
     * dentro da pista, portanto as cópias caem nos compassos seguintes.
     *
     * OS TEMPOS NÃO SOBEM (03/11/2026) — E ERA O CONTRÁRIO ATÉ AQUI. O campo `vbtempos` era
     * escrito por esta função (`declarado + bloco`), com o argumento de que a gravação recusaria
     * «sobram 8 tempos» o resultado de uma acção que a própria tela ofereceu. O argumento partia
     * de uma premissa que ela reverteu: o desacordo **não** recusa. E a escrita tinha um defeito
     * próprio, medido: duplicar um bloco de 4 numa música de 8 dava 12, e a duplicação seguinte
     * somava outra vez — o tempo musical crescia por cada gesto, o que não é duplicar um trecho,
     * é reescrever a música sem ninguém pedir. A música é a base rítmica do exercício e define-se
     * no passo 3; o que a cópia muda é o que a decomposição OCUPA, e isso o selo declara.
     */
    'function duplicarExercicio(){' +
    '  limparBaldesVazios();' +
    '  var bloco = cobertura();' +
    '  if (!bloco) { recado("erro", "Ainda não há trechos para duplicar."); return; }' +
    '  var alvo = {};' +
    '  Object.keys(CELULAS).forEach(function(d){' +
    '    var lista = CELULAS[d] || [];' +
    '    alvo[d] = lista.concat(JSON.parse(JSON.stringify(lista)));' +
    '  });' +
    '  CELULAS = alvo;' +
    // A MÚSICA NÃO SE TOCA (03/11/2026). Era `novo = declarado + bloco` escrito no campo, e o
    // efeito é o que ela relatou: uma música de 8 tempos ia a 12 ao duplicar um bloco de 4, e a
    // cada duplicação somava outra vez. A música é a BASE RÍTMICA do exercício — quem a define é
    // o passo 3 —, e duplicar um trecho não a reescreve. O que a cópia faz é ocupar mais tempos,
    // e isso é um estado declarado (o selo do desacordo), não um número inventado.
    '  pintarTabela();' +
    '  pintarContagens();' +
    '  pintarTira();' +
    // A NOTA DA SUBSTITUIÇÃO continua a ser repintada, mas já não por esta acção mudar a música:
    // quem a mudou foi ela, no passo 3, e `musicaMudou` já a pôs à vista. Fica aqui porque a
    // tabela repinta o resto e esta nota faz parte do que se vê antes de gravar.
    '  pintarComoNova();' +
    '  var t = temposTotais(), c = cobertura();' +
    '  var aviso = (t > 0 && c !== t)' +
    '    ? ", e a música declara " + t + ". O desacordo está marcado — ajuste a música ou os trechos."' +
    '    : ".";' +
    '  recado("ok", "trechos duplicados — a decomposição passa a ocupar " + c + " tempos" + aviso +' +
    '    " Mude a posição na cópia com «Editar».");' +
    '}' +
    '["vb-cel-duplicar"].forEach(function(id){' +
    '  var b = document.getElementById(id);' +
    '  if (b) b.addEventListener("click", duplicarExercicio);' +
    '});' +
    '["vb-cel-acrescentar", "vb-cel-guardar"].forEach(function(id){' +
    '  var b = document.getElementById(id);' +
    '  if (b) b.addEventListener("click", acrescentarOuGuardar);' +
    '});' +
    // O «×» DE CADA TRECHO — e só ele (31/10/2026). Havia aqui um segundo handler, para o campo
    // da frase na própria linha; a coluna saiu (a frase passou para o campo único acima da
    // tabela), e o handler saiu com ela. Um handler que fica sem markup a que responder é pior do
    // que não existir: parece que a tela ainda tem um campo.
    'var bTabela = document.getElementById("vb-tabela");' +
    'if (bTabela) {' +
    '  bTabela.addEventListener("click", function(e){' +
    '    var b = e.target.closest ? e.target.closest("button[data-tirar]") : null;' +
    '    if (!b) return;' +
    '    var p = b.getAttribute("data-tirar").split(":");' +
    '    if (!CELULAS[p[0]]) return;' +
    '    CELULAS[p[0]].splice(Number(p[1]), 1);' +
    // TIRAR O ÚLTIMO TRECHO DE UMA DIREÇÃO TIRA A DIREÇÃO (02/11/2026). Deixá-la vazia dava um
    // balde invisível que o servidor recusava com «a direção X não tem célula» — um 400 que ela
    // não tinha como relacionar com nada do que fez.
    '    limparBaldesVazios();' +
    '    pintarTabela();' +
    '    pintarContagens();' +
    '  });' +
    '}' +
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
    // O DIÁLOGO DIZ O QUE VEM **E** O QUE NÃO VEM (01/11/2026). O texto anterior — «turmas já
    // existentes não são duplicadas» — dizia a única coisa que não faz falta a quem decide. O que
    // faz falta é saber que a turma carregada nasce SEM o ritmo e que, por isso, ainda não gera
    // ciclo: sem isso, o professor carrega, vai eliciar o plano, e o manifesto recusa a turma com
    // quatro faltas que ele não tem como adivinhar de onde vieram.
    'document.getElementById("semear").addEventListener("click", function(e){' +
    '  if (!confirm("Carregar as turmas iniciais?\\n\\n' +
    'Vem o nome e o nível de referência de cada turma — NÃO vem o ritmo (dias, hora, duração ' +
    'e período). Uma turma carregada assim serve para a curadoria, mas ainda não gera ciclo: ' +
    'complete o cadastro dela antes de eliciar o plano.\\n\\n' +
    'Turmas já existentes não são duplicadas.")) return;' +
    '  enviar("/api/bastidores/semear-catalogo", {}, "carregando catálogo inicial...", false);' +
    '});' +
    'document.getElementById("form-curadoria").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    // A TURMA é UMA (um `select`, como a modalidade): vai como lista de um, que é o formato
    // que o plano já lê. As ALUNAS e o REPERTÓRIO continuam múltiplos.
    '  var umaTurma = document.getElementById("cuturma").value;' +
    // OS CINCO CAMPOS SÃO OBRIGATÓRIOS, E O FORMULÁRIO DIZ QUAIS FALTAM (23/10/2026). A
    // mesma regra do servidor (`faltaNaCuradoria`), aqui para a recusa chegar antes de a
    // pessoa esperar por uma ida à rede. Um `alert` que diz «faltam campos» não serve: a
    // pessoa fica a olhar para o formulário sem saber qual.
    '  var faltando = [];' +
    '  if (!document.getElementById("cuprofessor").value) faltando.push("o professor");' +
    '  if (!document.getElementById("cumodalidade").value) faltando.push("a modalidade");' +
    '  if (!document.getElementById("cutradicao").value) faltando.push("a tradição");' +
    '  if (!umaTurma) faltando.push("a turma");' +
    '  if (!fichasDe("esc-alunas").length) faltando.push("pelo menos uma aluna");' +
    '  if (faltando.length) {' +
    '    alert("A curadoria não se atribui incompleta — falta " + faltando.join(", ") + ". " +' +
    '      "Ela é o que autoriza o plano de uma turma e declara quem está nela; os cinco " +' +
    '      "campos são obrigatórios.");' +
    '    return;' +
    '  }' +
    '  var campos = {' +
    '    professor: document.getElementById("cuprofessor").value,' +
    '    modalidade: document.getElementById("cumodalidade").value,' +
    '    tradicao: document.getElementById("cutradicao").value,' +
    '    turmas: umaTurma ? [umaTurma] : [],' +
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
    '  var bs = document.querySelectorAll(".trio-item");' +
    '  for (var i = 0; i < bs.length; i++) {' +
    '    var b = bs[i];' +
    '    if (b === exceto) continue;' +
    '    if (b.getAttribute("aria-expanded") !== "true") continue;' +
    '    b.setAttribute("aria-expanded", "false");' +
    '    var alvo = b.getAttribute("data-balao");' +
    '    var ps = b.closest("li.turma").querySelectorAll(".trio-painel");' +
    '    for (var j = 0; j < ps.length; j++) {' +
    '      if (ps[j].getAttribute("data-painel") === alvo) ps[j].hidden = true;' +
    '    }' +
    '  }' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var q = e.target.closest(".trio-item");' +
    '  if (!q) { if (!e.target.closest(".trio-painel")) fecharPaineis(null); return; }' +
    '  var alvo = q.getAttribute("data-balao");' +
    '  var abertoAgora = q.getAttribute("aria-expanded") === "true";' +
    '  fecharPaineis(q);' +
    '  var li = q.closest("li.turma");' +
    '  var ps = li ? li.querySelectorAll(".trio-painel") : [];' +
    '  for (var i = 0; i < ps.length; i++) {' +
    '    if (ps[i].getAttribute("data-painel") !== alvo) continue;' +
    '    ps[i].hidden = abertoAgora;' +
    '  }' +
    // O ESTADO FICA NO `aria-expanded` — e SÓ nele. A célula é o botão: um `data-aberto` a par
    // do `aria-expanded` seriam dois sítios para o mesmo estado, e um deles ficaria para trás.
    '  q.setAttribute("aria-expanded", abertoAgora ? "false" : "true");' +
    '});' +
    'document.addEventListener("keydown", function(e){ if (e.key === "Escape") fecharPaineis(null); });' +
    'document.addEventListener("click", function(e){' +
    '  var ed = e.target.closest("button.editar");' +
    '  if (ed) { editarProfessor(ed.getAttribute("data-alvo")); return; }' +
    '  if (e.target.closest("button#prof-cancelar")) { sairDaEdicaoDoProfessor(); return; }' +
    // O «APAGAR» GENÉRICO SÓ ACTUA EM QUEM DECLARA O TIPO (02/11/2026).
    //
    // O defeito, medido: o «Apagar» de um verbete nasceu com a classe `.apagar` — é a peça da
    // casa — e este ouvinte vive no `document`. Resultado: o clique chegava aqui com
    // `data-tipo` NULO, o corpo saía `{nome: null}` para `/api/bastidores/null`, e a página
    // RECARREGAVA por cima do recado que o outro ouvinte tinha acabado de escrever. A
    // confirmação do verbete — a que diz o que se perde — nem chegava a ser lida.
    //
    // A guarda é a declaração: quem apaga pelo caminho genérico diz o `data-tipo` (`aluna`,
    // `turma`, `curadoria`, `rubrica`). Um botão que traz o seu próprio contrato — o verbete
    // traz `data-apagar-verbete` e trata do pedido no ouvinte da lista — não é deste caminho.
    '  var b = e.target.closest("button.apagar"); if (!b) return;' +
    '  if (b.hasAttribute("data-apagar-verbete")) return;' +
    '  var alvo = b.getAttribute("data-alvo");' +
    '  var tipo = b.getAttribute("data-tipo");' +
    '  if (!tipo) return;' +
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
    // O PREENCHEDOR ENTRA DEPOIS DO SCRIPT GRANDE (19/10/2026): ele usa as funções e os
    // mapas que a página já declarou (`TURMAS`, `RUBRICAS`, `adicionarFicha`, …). Sem o
    // atributo `data-escola-teste`, o próprio script não faz nada.
    (teste ? '<script src="/assets/teste-preenchimento.js"></script>' : '') +
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
    const donoSlug = slugDoDono(env);
    const rel = await relacoes(kv, escola);
    const curs = await curadorias(kv, escola);
    // Que (professor, turma) já têm plano de ensino: é o que decide, na turma e na curadoria,
    // entre «Editar» e «Derivar» (16/10/2026).
    const pares = await paresComPlano(env, escola);
    // O QUE OS PLANOS JÁ USARAM — a regra de proveniência que a curadoria já aplicava,
    // estendida a professores, alunas, turmas e vocabulário (18/10/2026).
    const usos = await usosDosPlanos(env, escola);
    // O ATALHO «VER A TURMA» VEM COM O NOME DELA (22/10/2026). O plano de ensino da porta
    // conhece a turma pelo NOME; a Produção filtra a listagem por ID. A resolução é aqui,
    // onde a lista das turmas já está carregada — a tela não compõe o identificador.
    const turmaEmFoco = String(url.searchParams.get('turma') || '').trim();
    return html(paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs, pares, usos,
      await aparenciaDaEscola(kv, escola), turmaEmFoco));
  }

  // GET /api/bastidores/alunas — a lista para o seletor da anamnese.
  /* GET /api/bastidores/alunas — o cadastro de alunas da escola.
   *
   * O `?professor=<slug>` RECORTA pela regra mista da anamnese (23/10/2026): a aluna curada a
   * este professor, mais as alunas que ainda NÃO estão em curadoria nenhuma («novas», que
   * qualquer professor pode entrevistar — é a porta de entrada da escola). Sem o parâmetro, a
   * lista é a da escola inteira, e é o que a Produção precisa: é ali que a direção atribui as
   * alunas às curadorias, e um cadastro recortado seria um círculo.
   *
   * O RECORTE É DO SERVIDOR. Antes, a tela pedia a escola inteira e filtrava no browser, e a
   * autorização era só uma linha de JavaScript — contornável por qualquer valor que o campo já
   * tivesse. Quem lê o acervo é o servidor; a tela desenha o que ele devolve.
   *
   * E A MARCA «NOVA» TAMBÉM (26/10/2026): a aluna que já tem anamnese registada continua na
   * lista — voltar a mexer no que foi respondido não pode depender de outro ecrã —, mas deixa de
   * levar o aviso de quem ainda falta entrevistar.
   */
  if (path === '/api/bastidores/alunas') {
    const todas = await alunas(kv, escola);
    const professorDoRecorte = String(url.searchParams.get('professor') || '').trim();
    if (!professorDoRecorte) {
      /* SEM RECORTE — a lista da escola, e é o que a Produção pede. O `aluna` continua a ser
         atendido: antes de o professor estar escolhido, o atalho do PO ainda não tem a quem se
         recortar, e a aluna que ele traz não pode desaparecer do campo (a mesma razão de
         sempre: foi o sistema que a mandou). Sem professor não há autorização a invocar nem a
         negar, e é por isso que aqui não há recorte nenhum. */
      const pedida = String(url.searchParams.get('aluna') || '').trim();
      const lista = todas.slice();
      if (pedida && lista.indexOf(pedida) === -1) lista.push(pedida);
      return json(200, { ok: true, escola, alunas: lista });
    }
    const recorte = porta.alunasDaAnamnese(await curadorias(kv, escola), professorDoRecorte, todas,
      url.searchParams.get('aluna'), await alunasComAnamnese(env, escola));
    return json(200, {
      ok: true, escola, alunas: recorte.alunas, novas: recorte.novas,
      recorte: { professor: professorDoRecorte },
    });
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
    const donoSlug = slugDoDono(env);
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

    const donoSlug = slugDoDono(env);
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

    // A ESTRUTURA NASCE COM O PROFESSOR (22/10/2026). Um professor criado dentro da escola é um
    // professor que vai trabalhar nela — e, quando ele for trabalhar, o gerador exige
    // `ciclo-NN-po-schema.json` e `ciclo-NN-plano-schema.json` na pasta dele. Deixar para o
    // «Guardar» do plano era deixar para o dia em que a falta já custa uma geração vermelha:
    // foi assim que a primeira geração do professor secundário morreu em `ENOENT` (run
    // 39660657812), com a correção certa e INATIVA.
    //
    // A ORDEM É A DA GARANTIA. Provisiona-se ANTES de o professor existir no KV: se o
    // repositório não aceitar a estrutura, o cadastro não acontece e o operador lê o motivo.
    // Criar o professor e falhar a estrutura em silêncio daria um professor que existe na tela
    // e não existe no repositório — que é exactamente o estado que se está a eliminar.
    const { garantirEstruturaDoProfessor } = require('./schemas-do-ciclo.js');
    const estrutura = await garantirEstruturaDoProfessor({
      token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz',
      repo: 'danca',
      ref: 'main',
      professor: slug,
      escola,
    });
    if (!estrutura.ok) {
      return json(502, {
        ok: false,
        erro: 'o professor «' + nomeExibido + '» NÃO foi cadastrado: a estrutura dele não pôde ser '
          + 'criada no repositório (' + (estrutura.erros.join('; ') || 'motivo não relatado') + '). '
          + 'Sem ela, o plano de observação e a geração de documentos falhariam depois — é o que '
          + 'esta ordem evita. Corrija o acesso ao repositório e cadastre outra vez.',
        estrutura,
      });
    }

    // E A ESCOLA DECLARA O PROFESSOR (22/10/2026). A estrutura diz que a pasta existe; o
    // inventário diz que ESTA escola é onde ele trabalha. Sem esta linha, o cadastro gravaria o
    // vínculo só no KV, e o painel — que lê o repositório — não teria como saber em que escola
    // ativa o professor está: ele apareceria com «sem escola viva» no dia em que foi cadastrado.
    const { registrarProfessorNaEscola } = require('./repo-escola.js');
    let vinculo;
    try {
      vinculo = await registrarProfessorNaEscola({
        token: env && env.GITHUB_TOKEN,
        dono: 'tmenegaz',
        repo: 'danca',
        ref: 'main',
        slug: escola,
        professor: slug,
        nome: nomeExibido,
      });
    } catch (err) {
      return json(502, {
        ok: false,
        erro: 'o professor «' + nomeExibido + '» NÃO foi cadastrado: o vínculo dele com a escola '
          + 'não pôde ser gravado no repositório (' + ((err && err.message) || String(err)) + '). '
          + 'Sem ele, o painel não saberia dizer em que escola esta pessoa trabalha. Corrija o '
          + 'acesso ao repositório e cadastre outra vez.',
        estrutura,
      });
    }

    // O `slug` é GRAVADO: é ele que fica, mesmo que o nome de exibição mude depois.
    lista.push({ nome: nomeExibido, slug, sal, hash });
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(201, {
      ok: true,
      professor: nomeExibido,
      slug,
      // O que foi feito no repositório, e com que ciclo(s). A tela recarrega em caso de `ok`, e
      // por isso o relatório vive aqui: quem precisar dele tem-no; quem não, não é incomodado.
      estrutura: {
        ok: true,
        ciclos: estrutura.ciclos,
        criados: estrutura.criados.length,
        jaExistiam: estrutura.pulados.length,
        nota: estrutura.nota,
        // O vínculo com a escola: gravado agora, ou já declarado antes (idempotente).
        vinculo: { escola, jaExistia: vinculo.jaExistia === true },
      },
    });
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
      const pares = await paresComPlano(env, escola);
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
    const donoSlug = slugDoDono(env);
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
    /*
     * PROVENIÊNCIA: a guarda é AQUI, e não só no botão. A tela esconde o «Excluir» de quem está
     * preso; esta linha é a regra para um pedido forjado.
     *
     * E «PRESO» TEM DUAS PORTAS (22/10/2026): o PLANO DE ENSINO — que já era a regra desde
     * 18/10/2026 — e a CURADORIA. A dona do produto foi explícita: «se o professor tá curado, ele
     * não pode mais ser removido. Eu removo a curadoria, aí eu posso mexer naquele professor.»
     * Antes desta linha, um professor curado mas ainda sem plano podia ser apagado — e a curadoria
     * ficava a apontar para quem já não existia.
     */
    const usos = await usosDosPlanos(env, escola);
    const curs = await curadorias(kv, escola);
    if (professorPreso(curs, usos, lista[idx])) {
      const porCuradoria = professorCurado(curs, lista[idx]);
      return json(409, {
        ok: false,
        erro: 'o professor «' + lista[idx].nome + '» NÃO se exclui: ele '
          + (porCuradoria ? 'já está numa curadoria' : 'já está num plano de ensino')
          + ' — apagá-lo romperia a proveniência. Enquanto a curadoria não gerar plano de ensino, '
          + 'é ela que se remove; aí ele volta a poder ser excluído.',
        vinculado: true,
        motivo: porCuradoria ? 'curadoria' : 'plano',
      });
    }
    /*
     * O REPOSITÓRIO TAMBÉM APRENDE QUE ELE SAIU (22/10/2026).
     *
     * O cadastro cria a pasta, os cinco schemas e o vínculo no inventário. Apagar só no KV
     * deixava o esquema de um professor que já não existe: a pasta continuava a ser um
     * professor na lista do painel — que nasce da pasta, de propósito — e a escola declarava
     * no inventário uma pessoa que já não está lá.
     *
     * A ORDEM É A DO CADASTRO, INVERTIDA: sai do repositório ANTES de sair do KV. Se o
     * GitHub recusar, o professor continua inteiro — e não há estado em que ele exista na tela
     * e não exista no repositório (ou o contrário).
     *
     * E A GUARDA É DUPLA: o KV diz «não está em plano nenhum» (a regra acima); o repositório
     * confirma «não há trabalho na pasta». Um professor CURADO mas ainda sem plano de ensino
     * apaga-se — a curadoria dele pode ser removida enquanto não gerou plano
     * (`curadoriaVinculadaA`), então nada dele é linha de base. Um professor com PO, plano,
     * aula, pacote ou âncora, não: a proveniência acrescenta, não se apaga.
     */
    const removido = lista[idx];
    const { apagarProfessorDoRepo } = require('./repo-escola.js');
    let exclusao;
    try {
      exclusao = await apagarProfessorDoRepo({
        token: env && env.GITHUB_TOKEN,
        dono: 'tmenegaz',
        repo: 'danca',
        ref: 'main',
        escola,
        professor: slugDoProfessor(removido) || slugificar(removido.nome),
      });
    } catch (err) {
      return json(502, {
        ok: false,
        erro: 'o professor «' + removido.nome + '» NÃO foi excluído: a estrutura dele não pôde ser '
          + 'apagada do repositório (' + ((err && err.message) || String(err)) + '). Nada foi '
          + 'tocado — ele continua na escola e no repositório.',
      });
    }
    if (!exclusao.ok) {
      return json(409, {
        ok: false,
        erro: 'o professor «' + removido.nome + '» NÃO foi excluído: ' + exclusao.erro,
        vinculado: true,
        trabalho: exclusao.trabalho,
      });
    }

    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(200, {
      ok: true,
      professor: removido.nome,
      removido: true,
      // O que saiu do repositório, e com que commit — a tela recarrega, e quem quiser auditar
      // tem o número em vez de uma frase.
      repositorio: {
        apagados: exclusao.apagados.length,
        commit: exclusao.commit,
        jaNaoExistia: exclusao.jaNaoExistia === true,
      },
    });
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
    if (!String((env && env.PROFESSOR_NOME) || '').trim() && !String((env && env.PROFESSOR_SLUG) || '').trim()) {
      return json(409, { ok: false, erro: 'não há professor dono (criado na página) para ajustar' });
    }

    /*
     * O NOME SÓ SE MUDA ENQUANTO O PROFESSOR É LIVRE (22/10/2026).
     *
     * A regra, dita pela dona do produto: «professor criado, sem curadoria — é livre. Ele está na
     * curadoria — não posso mexer naquele professor. Removo a curadoria — posso mexer. Curadoria e
     * plano de ensino — não posso mexer em nenhum dos dois.» O motivo é o de sempre: o nome do
     * professor viaja nos documentos (PO, plano, pacotes), e trocá-lo depois de a memória existir
     * faria o mesmo ato aparecer com dois autores.
     *
     * O ESTADO É O MESMO QUE A TELA USA. `curs` (as curadorias) e `usos` (os planos) são as duas
     * leituras que a Produção já faz para decidir entre «livre» e «vinculado» — a guarda do
     * servidor não inventa uma terceira. `null` (leitura que falhou) conta como preso.
     */
    const curs = await curadorias(kv, escola);
    const usos = await usosDosPlanos(env, escola);
    const comoProfessor = { nome: await nomeDoDono(env, kv, escola), slug: slugDoDono(env) };
    if (professorPreso(curs, usos, comoProfessor)) {
      return json(409, {
        ok: false,
        erro: 'o nome do professor «' + (comoProfessor.nome || comoProfessor.slug) + '» não se muda: ele já '
          + (professorVinculadoA(usos, comoProfessor) ? 'está num plano de ensino' : 'está numa curadoria')
          + '. O nome dele já vai nos documentos, e trocá-lo agora faria o mesmo trabalho aparecer '
          + 'com dois autores. Enquanto a curadoria não gerar plano de ensino, é ela que se remove — '
          + 'e aí o nome volta a poder ser corrigido.',
        vinculado: true,
        motivo: professorVinculadoA(usos, comoProfessor) ? 'plano' : 'curadoria',
      });
    }

    /*
     * GRAVA-SE NOS DOIS LUGARES, e os dois têm papéis distintos. O KV é a sobreposição que ESTA
     * escola lê (a página da Produção, sem esperar pelo índice). O inventário é a fonte do acervo:
     * é dele que a lista de professores do painel tira o nome, e sem esta escrita o nome mudava na
     * página da escola e ficava o antigo na lista — medido.
     *
     * A ORDEM É A DO CADASTRO: o repositório primeiro. Se ele recusar, o nome não mudou em lugar
     * nenhum e a resposta diz por quê — não há estado em que a escola leia um nome e o acervo outro.
     */
    const { registrarNomeDoProfessor } = require('./repo-escola.js');
    const slug = slugDoDono(env);
    let noRepo;
    try {
      noRepo = await registrarNomeDoProfessor({
        token: env && env.GITHUB_TOKEN,
        dono: 'tmenegaz',
        repo: 'danca',
        ref: 'main',
        escola,
        professor: slug,
        nome,
      });
    } catch (err) {
      return json(502, {
        ok: false,
        erro: 'o nome do professor «' + (comoProfessor.nome || slug) + '» NÃO foi mudado: o repositório '
          + 'recusou a gravação (' + ((err && err.message) || String(err)) + '). Nada mudou — a escola '
          + 'continua a ler o nome antigo, e o painel também.',
      });
    }

    await kv.put(RAIZ + '/' + escola + '/dono', JSON.stringify({ nome }));
    return json(200, {
      ok: true,
      dono: nome,
      slug,
      repositorio: { commit: noRepo.commit, jaConstava: noRepo.jaExistia === true },
    });
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
    const veredicto = await senhaDoProfessorOk(env, kv, escola, professor, senha);
    return json(200, veredicto.ok
      ? { ok: true, professor: veredicto.nome }
      : { ok: false, erro: veredicto.erro });
  }

  /* POST /api/bastidores/ato — O BILHETE DO ATO, DE USO ÚNICO (25/10/2026).
   *
   * O PROBLEMA QUE ELE RESOLVE. A senha do professor autoriza o ATO, e a porta é explícita:
   * «sair não leva a senha; ela autoriza um ATO, não uma sessão». Correcto — mas a Área do
   * Professor passou a ter o contexto dentro da listagem, e a lista validava a senha para
   * habilitar o botão. Ao navegar para o formulário, a porta não sabia de nada: pedia a senha
   * outra vez, e o professor que acabou de a digitar via a página intermédia que se queria
   * eliminar. O salto directo ao formulário ficava impossível exactamente por causa da regra
   * que o torna seguro.
   *
   * O QUE ELE É: um bilhete opaco, aleatório, ligado a UM ato (fonte, professor, ciclo, aluna e
   * plano), com validade de dez minutos, guardado no KV da escola e APAGADO no primeiro uso. Não
   * transporta a senha, não autoriza outro ato, e não vale duas vezes. O que viaja no endereço é
   * um valor que, sozinho, não abre nada além daquele ato — e que expira.
   *
   * PORQUE NÃO UMA ASSINATURA (HMAC) SEM ESTADO: porque «de uso único» é o pedido, e sem estado
   * não há como gastar o bilhete. O custo é uma escrita no KV por ato criado — poucas por dia,
   * e o KV já guarda o resto dos Bastidores.
   */
  if (path === '/api/bastidores/ato' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String(corpo.senha || '');
    const professor = String(corpo.professor || '').trim();
    if (!senha) return json(400, { ok: false, erro: 'informe a senha' });
    if (!professor) return json(400, { ok: false, erro: 'escolha o professor' });
    const veredicto = await senhaDoProfessorOk(env, kv, escola, professor, senha);
    if (!veredicto.ok) return json(200, { ok: false, erro: veredicto.erro });

    const bilhete = await emitirBilheteDoAto(kv, escola, {
      fonte: String(corpo.fonte || '').trim(),
      professor,
      ciclo: String(corpo.ciclo || '').trim(),
      aluna: String(corpo.aluna || '').trim(),
      plano: String(corpo.plano || '').trim(),
    });
    if (!bilhete) return json(503, { ok: false, erro: 'o cofre da escola não está disponível' });
    return json(200, { ok: true, ato: bilhete, professor: veredicto.nome });
  }

  /* POST /api/bastidores/ato/consumir — a porta troca o bilhete por autorização.
   * O bilhete é APAGADO aqui: um segundo uso responde «não». */
  if (path === '/api/bastidores/ato/consumir' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const consumido = await consumirBilheteDoAto(kv, escola, String(corpo.ato || '').trim());
    if (!consumido) return json(200, { ok: false, erro: 'bilhete inválido ou já usado' });
    return json(200, { ok: true, ato: consumido });
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
    const musica = musicasDosExercicios();
    // AS MÚSICAS DO VERBETE VÃO JUNTO (31/10/2026). O plano de ensino pede os tempos e o
    // compasso de cada exercício, e o verbete JÁ OS DECLARA — é a chave dele, `<tempos>|<compasso>`.
    // Pedir outra vez era a redundância que a pesquisadora viu no nó «Sequência de exercícios»:
    // os campos vazios, e o documento a dizer «os tempos e o compasso ainda não estão declarados».
    // O alfabeto é `require`-ado no bundle do Worker (zero KV, zero ida ao GitHub); vai aqui
    // porque é esta a rota que a porta do plano já pede — uma rota nova seria uma leitura a mais.
    const comMusicas = lista.map((t) => Object.assign({}, t,
      { musicas: musica.get(String(t.termo || '')) || [] }));
    const opcoes = lista.map((t) => ({ valor: t.id, rotulo: t.termo }));
    return json(200, { ok: true, escola, termos: comMusicas, opcoes: opcoes });
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
    const comPlano = await turmasComPlano(env, escola);
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
      const pares = await paresComPlano(env, escola);
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

  // ---------------------------------------------------------------- o VERBETE (28/10/2026)
  //
  // O alfabeto da notação é da MODALIDADE, não da escola — e a escrita é no REPOSITÓRIO, não no
  // KV. A razão está escrita por inteiro em `verbete.js`: o gerador lê o alfabeto do DISCO, e um
  // CRUD em KV daria uma tela que mostra uma coisa e um documento que sai com outra, sem falhar.
  //
  // A guarda é a MESMA das outras rotas de administração (senha ou bilhete da direção), e a
  // validação é a do servidor — a tela é conveniência.
  if (path === '/api/bastidores/verbete' && request.method === 'GET') {
    const modalidade = String(url.searchParams.get('modalidade') || 'bale-classico');
    const { lerModalidade, listarVerbetes } = require('./verbete.js');
    const lido = await lerModalidade({
      f: (u, o) => globalThis.fetch(u, o), token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main', modalidade,
    });
    if (!lido.ok) return json(404, { ok: false, erro: lido.erro });
    // AS CATEGORIAS QUE PODEM SER EXERCÍCIO (28/10/2026). Um exercício de aula é um passo, um
    // salto, uma ligação ou um giro. Uma POSIÇÃO (`première position`) e uma DIREÇÃO (`croisé`)
    // não são exercícios — oferecê-las na mesma lista seria oferecer a resposta errada com a
    // mesma cara da certa.
    const CATEGORIAS_DE_EXERCICIO = ['passo', 'salto', 'ligacao', 'giro'];
    const vocabulario = lido.vocabulario || [];
    // A DEFINIÇÃO VAI JUNTO (31/10/2026). O formulário do trecho pré-enche «o que acontece» com
    // ela — foi o que faltou no primeiro verbete escrito a sério, em que o campo vazio recebeu o
    // nome do exercício. O `fonte` vai também, porque é ele que diz de onde a definição veio, e
    // uma definição sem procedência é o que este projecto não aceita (P-03).
    const podeSerExercicio = vocabulario
      .filter((t) => t && CATEGORIAS_DE_EXERCICIO.indexOf(t.categoria) !== -1)
      .map((t) => ({
        id: t.id,
        termo: t.termo,
        categoria: t.categoria,
        descricao: String(t.descricao || '').trim(),
        fonte: String(t.fonte || '').trim(),
        // A TRADIÇÃO VAI JUNTO (02/11/2026), em chave E em rótulo. Ela é a mesma coisa que o
        // «Método deste exercício» do passo 2, e é dela que o campo se pré-enche quando se
        // escolhe o exercício — o mestre não tem de escrever duas vezes a mesma informação.
        tradicao: String(t.tradicao || '').trim(),
        tradicaoRotulo: rotuloDaTradicao(t.tradicao),
      }));
    return json(200, {
      ok: true,
      modalidade,
      versao: lido.dados.versao,
      // O NOME DO EXERCÍCIO É ESCOLHIDO, NÃO ESCRITO. A lista vem do vocabulário da modalidade,
      // que é o mesmo de onde sai o «conteúdo do nível» do plano — e é isso que faz o verbete
      // casar com o exercício em vez de quase casar.
      exerciciosDoVocabulario: podeSerExercicio,
      // A VISTA É A DA ESCOLA (03/11/2026). O alfabeto guarda o verbete do catálogo e o de cada
      // escola (`8|4/4` e `8|4/4@breu`), e o que esta resposta serve é o que ESTA escola vê: o
      // catálogo mais o dela, com o dela a vencer. Sem isto, a Produção da `breu` abria com duas
      // músicas iguais e o `editar` de cada uma — duas linhas para o mesmo exercício.
      exercicios: listarVerbetes(lido.dados, escola),
      verbetes: (function () {
        const porExercicio = (lido.dados && lido.dados.verbetes) || {};
        const saida = {};
        for (const nome of Object.keys(porExercicio)) {
          if (nome.startsWith('_')) continue;
          const vistos = registosDaEscola(porExercicio[nome], escola);
          if (Object.keys(vistos).length) saida[nome] = vistos;
        }
        return saida;
      })(),
      posicoes: (lido.vocabulario || [])
        .filter((t) => t && t.categoria === 'posicao')
        // `nome` É A ETIQUETA LOCALIZADA (02/11/2026). O `termo` é o nome na língua da
        // modalidade — «Première position» — e é o que o dado guarda e o documento escreve. O
        // `nome` é o que a TELA mostra: o sistema atende hip hop, jazz e contemporâneo, e uma
        // listagem em francês obriga a traduzir de cabeça o que devia ler-se de relance. Vai
        // `null` quando o termo ainda não tem etiqueta, e aí a tela mostra o `termo` — que é
        // legível — em vez de um vazio.
        .map((t) => ({ id: t.id, termo: t.termo, nome: t.nome || null, membro: t.membro || null })),
      // DOIS EIXOS, DUAS LISTAS (versão 5 do alfabeto, 28/10/2026). Até aqui as duas listas iam
      // concatenadas num só campo, e era por isso que o formulário oferecia OITO blocos onde há
      // três mais cinco — «à frente», «ao lado», «atrás» são DIREÇÕES do membro; «en face»,
      // «croisé», «effacé», «écarté», «épaulement» são ORIENTAÇÕES do corpo. Misturadas, a tela
      // pedia ao professor que escolhesse entre coisas que não competem.
      // O glifo vai junto porque é ele que a pílula mostra: «+ à frente» diz mais do que «à
      // frente» sozinho, e é o mesmo sinal que o documento escreve.
      direcoes: Object.entries((lido.dados.gramatica || {}).direcoesDoMembro || {})
        .map(([glifo, d]) => Object.assign({}, d, { glifo })),
      orientacoes: Object.entries((lido.dados.gramatica || {}).orientacoesDoCorpo || {})
        .map(([glifo, d]) => Object.assign({}, d, { glifo })),
      // OS SINAIS DO ALFABETO, COM NOME E GRUPO (28/10/2026). Antes era uma lista de símbolos
      // soltos — e trazia dentro as PRÓPRIAS CATEGORIAS, porque o grupo «Categorias» também tem
      // `itens`. Era por isso que a legenda dizia «pé, peso, plié, braço» duas vezes, uma em
      // «Categorias» e outra em «Sinais»: um defeito que a pesquisadora viu na tela e o código
      // não via. As categorias saem daqui — elas têm o seu próprio campo —, e cada sinal leva o
      // nome e o grupo, para a tela poder oferecer «→ conduz a» em vez de um «→» sozinho.
      sinais: (function () {
        const lista = [];
        for (const g of (lido.dados.grupos || [])) {
          const titulo = String(g.titulo || '');
          if (titulo === 'Categorias') continue;
          for (const [sinal, dado] of Object.entries(g.itens || {})) {
            lista.push({
              sinal: sinal,
              nome: (dado && dado.nome) || sinal,
              significado: (dado && dado.significado) || '',
              grupo: titulo,
            });
          }
        }
        return lista;
      })(),
      categoriasDeBloco: Array.isArray(lido.dados.categorias) ? lido.dados.categorias : [],
      // AS POSIÇÕES DE BRAÇOS POR MÉTODO (02/11/2026). A tabela existia no alfabeto desde o
      // início e NÃO CHEGAVA A NENHUMA TELA — `posicoesDeBracosDoMetodo` estava exportada e
      // ninguém a chamava. É ela que responde à pergunta que originou o bloco («os dois braços
      // acima da cabeça são a 3ª ou a 5ª?»), e sem ela a nota do método não teria o que dizer.
      posicoesDeBracos: ((lido.dados.gramatica || {}).posicoesDeBracos || {}).posicoes || [],
      // O DICIONÁRIO DO QUE ACONTECE (28/10/2026): bloco de notação → frase em português. A tela
      // preenche a descrição com ele quando o professor compõe o bloco, e ele ajusta se não
      // servir. Não é a fonte do que está publicado — a frase fica gravada na célula, porque a
      // proveniência acrescenta e não edita (P-03/P-04). É a versão de partida.
      //
      // DESDE 31/10/2026 A TELA NÃO O USA PARA SUGERIR: a frase passou a ser do EXERCÍCIO, escrita
      // uma vez, e uma sugestão por trecho contradizia-a. O dicionário continua a ir na rota — é
      // dado da modalidade, não da tela —, mas quem o lê hoje é só quem consulta a rota; os
      // campos da célula nascem da frase do verbete, e é isso que se mede em `provar-celula.js`.
      descricoes: require('./catalogo-seed.js').DESCRICOES || {},
    });
  }

  if (path === '/api/bastidores/verbete' && (request.method === 'POST' || request.method === 'PUT')) {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    /* A PROVENIÊNCIA ANTES DA ESCRITA (02/11/2026) — e é a MESMA leitura da guarda do `DELETE`.
     *
     * Um verbete que já compõe um plano não se reescreve por baixo do documento: a gravação
     * passa a ser um AJUSTE, e o estado anterior fica no histórico com a data em que deixou de
     * valer. Quem decide isso é aqui, e não no `verbete.js`: ele não fala com o acervo, e não
     * passa a falar.
     *
     * A LEITURA É UMA SÓ, partilhada com o resto do pedido (`jaLido`), e o erro dela conta como
     * VINCULADO — na dúvida, guarda-se o histórico. Um histórico a mais é uma linha no ficheiro;
     * um histórico a menos é o passado reescrito.
     */
    const planos = await resumosDosPlanos(env, escola);
    const usos = await usosDosPlanos(env, escola, planos);
    const pares = await paresComPlano(env, escola, planos);
    const nomesPresos = new Set((pares || []).map((p) => p && p.turma));
    const turmasPresas = new Set((await turmas(kv, escola))
      .filter((t) => t && nomesPresos.has(t.nome)).map((t) => t.id));
    const nomeGravado = String(corpo.nome || '').trim();
    const vinculado = nomeGravado
      ? termoVinculadoA(usos, await relacoes(kv, escola), turmasPresas, { termo: nomeGravado })
      : false;
    const { gravarVerbete } = require('./verbete.js');
    const r = await gravarVerbete({
      f: (u, o) => globalThis.fetch(u, o), token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main',
      modalidade: String(corpo.modalidade || 'bale-classico'),
      nome: corpo.nome,
      musica: corpo.musica,
      // A MÚSICA QUE SAI, quando a edição mudou os tempos (02/11/2026). Vazia quer dizer «ficam as
      // duas» — é a escolha explícita da tela.
      musicaAnterior: corpo.musicaAnterior,
      verbete: corpo.verbete,
      acao: corpo.acao || (request.method === 'POST' ? 'criar' : 'atualizar'),
      // O AJUSTE (02/11/2026). `vinculado` decide se o estado anterior é guardado; a data vem do
      // corpo quando a tela a souber, e hoje não a manda — o servidor usa a do dia.
      vinculado: vinculado,
      vigenteDe: corpo.vigenteDe,
      motivo: corpo.motivo,
      // O DONO VAI NO VERBETE (03/11/2026): é o `ESCOLA_SLUG` do Worker, e não o parâmetro do
      // pedido — o dono de um verbete não se escolhe na tela. Sem isto, a escola de teste
      // escreveria no verbete do catálogo, que é o que se vende.
      escola: escola,
    });
    return json(r.ok ? 200 : (r.status || 400), r);
  }

  // O DELETE DO VERBETE APAGA (02/11/2026). Este comentário dizia «NÃO HÁ DELETE» — e era verdade
  // até esta data: a rota existia para responder 409 e explicar a P-03/P-04. O argumento continua
  // válido para o HISTÓRICO (uma aula publicada que citava o exercício passa a sair em lacuna), e
  // é por isso que a consequência vai escrita na pergunta que a tela faz antes do gesto, e não
  // escondida aqui. O que muda: a notação sai do alfabeto, o exercício fica no vocabulário.
  if (path === '/api/bastidores/verbete' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    /* O VERBETE PASSA A APAGAR-SE (02/11/2026) — a pedido dela: «faltou fazer o verbo deletar o
     * verbete». Era 409 com um sermão sobre a P-03/P-04.
     *
     * A REGRA ANTIGA NÃO ERA UM CAPRICHO, e a diferença fica dita: uma aula já publicada que
     * citava este exercício passa a sair em lacuna, porque a notação dela deixou de existir. O
     * documento não se apaga — apaga-se a leitura dele. É o preço, e a tela di-lo antes.
     *
     * A GUARDA QUE FICA: o verbo exige o NOME no corpo. Um `DELETE` sem corpo apagaria «o que
     * estivesse lá», e é a única coisa que não pode acontecer por engano.
     */
    const nome = String(corpo.nome || '').trim();
    if (!nome) return json(400, { ok: false, erro: 'informe o nome do exercício' });
    /* A GUARDA DE PROVENIÊNCIA (02/11/2026) — a regra que o projeto já aplica ao TERMO, à TURMA,
     * ao PROFESSOR e à CURADORIA, agora também ao VERBETE.
     *
     * A pergunta é uma só: **este exercício já entrou em algum documento?** Três portas, e as três
     * contam:
     *
     *   1. o plano de ensino declara-o no REPERTÓRIO (a porta directa);
     *   2. o exercício está associado a uma turma, e essa turma tem plano;
     *   3. o PO referencia um desses planos — o que os planos já cobrem, porque o PO deriva deles.
     *
     * O MECANISMO NÃO É NOVO, e isso é de propósito: `usosDosPlanos` + `termoVinculadoA` são
     * exactamente as duas funções que decidem se um TERMO pode ser apagado. O verbete é a NOTAÇÃO
     * do mesmo termo — apagá-lo apaga a leitura que o documento faz dele —, e por isso a pergunta
     * é a mesma com o mesmo nome.
     *
     * UMA LEITURA DO ÍNDICE, e não uma por plano: o `resumo` do envelope já traz o repertório
     * (20/10/2026), e é ele que se lê. `usos === null` — leitura falhada — conta como VINCULADO:
     * na dúvida não se apaga, porque apagar por engano não se desfaz.
     */
    // UMA LEITURA DO ÍNDICE, DUAS RESPOSTAS (02/11/2026). `usos` e `pares` saem do MESMO índice do
    // acervo: dois `await` sem o `jaLido` seriam duas idas ao GitHub neste pedido — e a regra
    // «uma carga, uma leitura» está escrita no `acervo-envelopes.js` desde 20/10/2026.
    const planos = await resumosDosPlanos(env, escola);
    const usos = await usosDosPlanos(env, escola, planos);
    const pares = await paresComPlano(env, escola, planos);
    const nomesPresos = new Set((pares || []).map((p) => p && p.turma));
    const turmasPresas = new Set((await turmas(kv, escola))
      .filter((t) => t && nomesPresos.has(t.nome)).map((t) => t.id));
    if (termoVinculadoA(usos, await relacoes(kv, escola), turmasPresas, { termo: nome })) {
      return json(409, {
        ok: false,
        vinculado: true,
        motivo: 'plano',
        erro: 'o verbete de «' + nome + '» não se apaga: o exercício já compõe um plano de ensino '
          + '(ou o conteúdo de uma turma com plano). Apagá-lo deixaria a aula publicada com a '
          + 'notação em lacuna. Para o tirar de circulação sem romper a proveniência, use '
          + '«Descontinuar» — a marca conserva o registo e o documento continua a poder ler-se.',
        como: 'PUT com { acao: "descontinuar" }',
      });
    }
    /* E A CURADORIA — a segunda porta que ela nomeou (02/11/2026).
     *
     * O repertório da curadoria DEIXOU DE SE PEDIR em 19/10/2026 (a turma é que declara os
     * conteúdos, e ninguém lia a segunda lista), mas o que já está gravado FICA — P-03/P-04. Uma
     * curadoria antiga pode portanto nomear um exercício, e é uma referência a sério: é ela que
     * autoriza o professor a dar aquela turma. A guarda consulta-a, e a leitura é a mesma que a
     * página já faz (`curadorias(kv, escola)`), não uma nova.
     */
    const curs = await curadorias(kv, escola);
    const curadoriaQueUsa = (curs || []).find((c) => c && Array.isArray(c.repertorio)
      && (c.repertorio.indexOf(nome) !== -1 || c.repertorio.indexOf(idDe(nome)) !== -1));
    if (curadoriaQueUsa) {
      return json(409, {
        ok: false,
        vinculado: true,
        motivo: 'curadoria',
        erro: 'o verbete de «' + nome + '» não se apaga: o exercício está no repertório da curadoria '
          + 'de ' + (curadoriaQueUsa.professor || 'um professor') + '. Tirá-lo do repertório é o '
          + 'caminho — a curadoria é que autoriza o trabalho, e o verbete que ela nomeia faz parte '
          + 'dele.',
        como: 'editar a curadoria e retirar o exercício do repertório',
      });
    }
    const { apagarVerbete } = require('./verbete.js');
    const r = await apagarVerbete({
      f: (u, o) => globalThis.fetch(u, o), token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main',
      modalidade: String(corpo.modalidade || 'bale-classico'),
      nome: nome,
      // APAGA-SE O QUE É DESTA ESCOLA (03/11/2026). O apagar do catálogo passa pelo mesmo caminho,
      // com `escola` vazia — e é a rota que não deixa uma escola apagar o que se vende.
      escola: escola,
    });
    return json(r.ok ? 200 : (r.status || 400), r);
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
    // A GRAVAÇÃO É NO REPOSITÓRIO (28/10/2026). O vocabulário passou a ter uma verdade só — o
    // ficheiro da modalidade —, e é dele que saem o plano, o verbete e a notação. Gravar no KV
    // criaria a segunda lista que esta alteração veio eliminar. Ver `termo-repo.js`.
    //
    // O `membro` entra: uma POSIÇÃO tem de dizer de que membro é, senão «première position» não
    // se distingue da homónima de braços — e o verbete passaria a apontar para a posição errada.
    const { criarTermo } = require('./termo-repo.js');
    const r = await criarTermo({
      f: (u, o) => globalThis.fetch(u, o),
      token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main',
      corpo: {
        termo: novo.termo, categoria: novo.categoria, tradicao: novo.tradicao,
        membro: String(corpo.membro || '').trim(),
        alternativos: novo.alternativos, descricao: novo.descricao,
        fonte: novo.fonte, observacoes: novo.observacoes,
      },
      tradicoes: TRADICOES_DO_VOCABULARIO,
      // O TERMO NASCE DA ESCOLA QUE O CRIOU (02/11/2026). É o `ESCOLA_SLUG` do Worker, e não o
      // parâmetro `escola` do pedido: o dono de um termo não se escolhe na tela.
      escola: (env && env.ESCOLA_SLUG) || escola || '',
    });
    if (!r.ok) {
      return json(r.status || 400, { ok: false, erro: r.erro, erros: r.erros, termo: r.termo });
    }
    return json(201, { ok: true, termo: r.termo.termo, id: r.termo.id, commit: r.commit });
  }

  // PUT /api/bastidores/termo — editar o NOME de um termo (28/10/2026).
  //
  // O nome é a chave do termo, e o `id` deriva dele. Editar o nome muda o `id` — e um `id` pode
  // estar referido num verbete, numa posição ou numa relação turma↔conteúdo. Por isso a edição é
  // recusada quando o termo está em uso: quem edita tem de saber que mexe numa referência.
  if (path === '/api/bastidores/termo' && request.method === 'PUT') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!(await autorizacaoDirecaoOk(env, corpo))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const idAntigo = idDe(String(corpo.id || corpo.termo || '').trim());
    const novoNome = String(corpo.novoNome || '').trim();
    if (!idAntigo) return json(400, { ok: false, erro: 'informe o termo a editar' });
    if (!novoNome) return json(400, { ok: false, erro: 'informe o novo nome' });
    const { editarNomeDoTermo } = require('./termo-repo.js');
    const r = await editarNomeDoTermo({
      f: (u, o) => globalThis.fetch(u, o),
      token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main',
      idAntigo, novoNome,
    });
    return json(r.ok ? 200 : (r.status || 400), r);
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
      const usos = await usosDosPlanos(env, escola);
      const pares = await paresComPlano(env, escola);
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
    // O TERMO É COMPARTILHADO, E APAGÁ-LO É APAGAR PARA TODAS AS ESCOLAS (28/10/2026). O
    // vocabulário deixou de ser uma cópia por escola, por isso esta rota deixou de ser «tirar da
    // minha lista» e passou a ser «tirar da lista de todos». A recusa por uso, acima, é a primeira
    // guarda; esta nota é a segunda: quem apaga tem de o saber antes de o fazer.
    const { ler: lerVocabulario, escrever: escreverVocabulario } = require('./termo-repo.js');
    const lido = await lerVocabulario({
      f: (u, o) => globalThis.fetch(u, o), token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main',
    });
    if (!lido.ok) return json(lido.status || 502, { ok: false, erro: lido.erro });
    const idxNoRepo = lido.termos.findIndex((t) => t && t.id === id);
    if (idxNoRepo === -1) return json(404, { ok: false, erro: 'termo não encontrado no vocabulário' });
    lido.termos.splice(idxNoRepo, 1);
    const escrito = await escreverVocabulario({
      f: (u, o) => globalThis.fetch(u, o), token: env && env.GITHUB_TOKEN,
      dono: 'tmenegaz', repo: 'danca', ref: 'main', termos: lido.termos, sha: lido.sha,
      mensagem: 'chore(biblioteca): remover «' + lista[idx].termo
        + '» do vocabulário do balé clássico\n\nRemovido pela Produção (Sistema Lastro).\n',
    });
    if (!escrito.ok) {
      return json(escrito.status || 400, { ok: false, erro: 'o repositório recusou a gravação (HTTP ' + escrito.status + ')' });
    }
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

    // O VOCABULÁRIO JÁ NÃO SE SEMEIA (28/10/2026). Ele vive no repositório, numa verdade só, e
    // `termos()` lê-o do bundle — copiá-lo para o KV seria recriar a segunda lista que esta
    // alteração eliminou. O botão passa a semear só o que é da ESCOLA: as turmas e a relação
    // inicial entre turma e conteúdo. O nome que ele mostra deixa de prometer as duas coisas.
    const termosNovos = 0;

    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(listaTurmas));

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
    const donoSlug = slugDoDono(env);
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
    // A TURMA É UMA SÓ (16/10/2026). Era uma lista, e a lista mentia: quem escolhia duas
    // turmas estava a dizer que as alunas de uma pertencem à outra — e não pertencem. O
    // registo continua a guardar `turmas` (lista de UM) para o plano, que já a lê assim, não
    // ter de mudar; o que a escola vê é um `select`, um por vez.
    const turmasPedidas = Array.isArray(corpo.turmas)
      ? corpo.turmas.map((x) => String(x).trim()).filter(Boolean)
      : [String(corpo.turma || '').trim()].filter(Boolean);
    const alunasDoCorpo = Array.isArray(corpo.alunas)
      ? corpo.alunas.map((x) => String(x).trim()).filter(Boolean) : [];
    /* OS CINCO CAMPOS SÃO OBRIGATÓRIOS, E A ROTA É QUEM OS GUARDA (23/10/2026). O formulário
       também os confere (para a recusa não esperar por uma ida ao servidor), mas uma regra que
       só existe no cliente não é uma regra: a rota é pública para quem tem a senha da direção,
       e é ela que escreve. A mensagem diz o que falta e onde se resolve. */
    const falta = faltaNaCuradoria({
      professor, modalidade, tradicao: corpo.tradicao, turmas: turmasPedidas, alunas: alunasDoCorpo,
    });
    if (falta.length) {
      return json(400, { ok: false, erro: fraseDaCuradoriaIncompleta(falta), falta: falta.map(([c]) => c) });
    }
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
      const pares = await paresComPlano(env, escola);
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

    // Já lidas acima, para a conferência dos cinco campos: uma leitura só.
    const alunasPedidas = alunasDoCorpo;
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
      // O REPERTÓRIO NÃO SE PEDE MAIS (19/10/2026) — e por isso não se escreve. Se o corpo
      // não o traz, a curadoria que está a ser editada FICA COM O QUE TINHA: a regra é a
      // mesma do derivar (abaixo), e a razão também — a proveniência acrescenta, não edita
      // (P-03/P-04). Escrever `[]` aqui apagava, ao editar a tradição, um dado que ninguém
      // tinha pedido para apagar.
      repertorio: Array.isArray(corpo.repertorio)
        ? corpo.repertorio.map((x) => String(x).trim()).filter(Boolean)
        : ((atual && atual.repertorio) || []),
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
    /* A VERSÃO NOVA TAMBÉM NASCE COMPLETA (23/10/2026). O que se confere é o que VAI FICAR
       escrito — `turmaFinal` e `alunasFinais` já resolvem o que não veio no corpo a partir da
       curadoria anterior. Conferir o corpo em vez do resultado deixaria passar uma derivada
       sem turma quando a anterior também não a tinha, que é exactamente a dívida que esta
       regra veio não deixar crescer. */
    const faltaDeriv = faltaNaCuradoria({
      professor: anterior.professor,
      modalidade: anterior.modalidade,
      tradicao: corpo.tradicao === undefined ? anterior.tradicao : corpo.tradicao,
      turmas: [turmaFinal],
      alunas: alunasFinais,
    });
    if (faltaDeriv.length) {
      return json(400, {
        ok: false, erro: fraseDaCuradoriaIncompleta(faltaDeriv), falta: faltaDeriv.map(([c]) => c),
      });
    }
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
      const pares = await paresComPlano(env, escola);
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
  // AS FAMÍLIAS, pela mesma razão do valor acima — e por uma mais dura (18/10/2026). A ponte
  // de produção tinha a lista escrita à mão (`['bordo', 'cortina']`), e quando a terceira
  // família entrou, `verde` caiu no PADRÃO em tudo o que a escola serve por ali: a Produção
  // pintava de verde e a anamnese, o plano e o pacote do ciclo ficavam bordô. Duas listas da
  // mesma coisa é uma lista a menos. Agora é esta, e ela é a mesma que o seletor oferece.
  PALETAS,
  IDS_DAS_PALETAS,
  PALETA_PADRAO,
  // AS CURADORIAS (24/10/2026) — a listagem da anamnese precisa de saber a turma de cada aluna,
  // e quem a declara é a curadoria. Exportada em vez de relida: uma segunda leitura da mesma
  // chave do KV, com a sua própria forma de a interpretar, divergiria no dia em que uma mudasse.
  curadorias,
};
