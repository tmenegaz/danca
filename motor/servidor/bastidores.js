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
      pares.push({ professor, turma });
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
function faltaNoRitmoDaTurma(t) {
  const falta = [];
  if (!t) return ['o cadastro da turma'];
  // Cada item vem COM o seu artigo — «os dias da semana», não «dias da semana». É o que faz
  // a frase da mensagem sair direita: quem junta não tem de adivinhar o género.
  if (!(Number(t.frequencia) > 0)) falta.push('a frequência semanal');
  if (!Array.isArray(t.dias) || !t.dias.length) falta.push('os dias da semana');
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
    frequencia: inteiro(corpo.frequencia),
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
function pilula(nome, valor, rotuloHtml) {
  return '<label class="escolha"><input type="checkbox" name="' + esc(nome) + '" value="' + esc(valor) + '">' +
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
function topnav(contexto, onde) {
  return navSistema({
    atual: onde,
    anamnese: urlDaPorta('/anamnese/', contexto),
    plano: urlDaPorta('/plano-ensino/', contexto, 'fonte=plano'),
    po: urlDaPorta('/plano-observacao/', contexto, 'fonte=po'),
  });
}

/** O cabeçalho comum das vistas dos Bastidores: a folha do ciclo (a MESMA do pacote,
 *  servida por este Worker) e, DEPOIS dela, o `<style>` da vista — que manda. */
function cabecalhoDaVista(titulo) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + '</title>' +
    '<link rel="stylesheet" href="/assets/style.css">' +
    '<script>try{if(localStorage.getItem("ciclo-modo")==="noturna")document.documentElement.setAttribute("data-modo","noturna");}catch(e){}</script>';
}

/** O fim comum: o script da navegação, que mede a barra e abre o hamburger. */
function fimDaVista() {
  return '<script src="/assets/nav.js"></script></body></html>';
}

function paginaEstudio(escola, contexto) {
  return cabecalhoDaVista('Bastidores · Estúdio de Dança · ' + escola) +
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

function paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs, pares) {
  // O professor criado pela página `danca` vive como SEGREDO (PROFESSOR_NOME, com o nome
  // ajustável no KV) e é o «dono» da escola; os professores ADICIONAIS cadastrados aqui
  // vivem no KV. O dono entra primeiro e recebe «Editar» (não «Excluir»): ele é o contato
  // da escola, e o segredo do Worker é outra fronteira. A lista não duplica.
  const donoNome = String(dono || '').trim();
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
      '<span class="nome"><b>' + esc(donoNome) + '</b>' +
      '<span class="dono">principal</span></span>' +
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
    linhasProfs.push('<li><span class="nome"><b>' + esc(p.nome) + '</b></span>' +
      '<span class="acoes"><button class="apagar acao perigo pequena" data-tipo="professor" data-alvo="' + esc(p.nome) + '" title="Excluir professor">Excluir</button></span></li>');
  }
  const itensProfs = linhasProfs.length
    ? linhasProfs.join('')
    : '<li class="vazia">(nenhum professor cadastrado)</li>';
  const itensAlunas = aluns.length
    ? aluns.map((a) => '<li><span class="nome"><b>' + esc(a) + '</b></span>'
        + '<span class="acoes"><button class="apagar acao perigo pequena" data-tipo="aluna" data-alvo="' + esc(a) + '" title="Excluir aluna">Excluir</button></span></li>').join('')
    : '<li class="vazia">(nenhuma aluna cadastrada)</li>';

  // --- TURMAS e VOCABULÁRIO (Bloco 3 do plano de ensino) --------------------
  // Os CARTÕES e as opções de curadoria são as turmas VIGENTES (16/10/2026). As substituídas
  // saem da operação e entram num histórico fechado no fim do cartão — a escola precisa de as
  // ver para saber que o ajuste foi feito, mas não pode voltar a escolhê-las.
  const todasAsTurmas = (trms || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const listaTurmas = turmasVigentes(todasAsTurmas);
  const turmasSubstituidas = todasAsTurmas.filter((t) => t && t.substituidaPor);
  const listaRubricas = (rbs || []).slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  const listaTermos = (trmos || []).slice().sort((a, b) => String(a.termo).localeCompare(String(b.termo)));
  const termoPorId = new Map(listaTermos.map((t) => [t.id, t]));
  const relObj = rel || {};

  // As opções do <select> de associação (uma por termo).
  const opcoesTermo = listaTermos.map((t) =>
    '<option value="' + esc(t.termo) + '">' + esc(t.termo) +
    (t.categoria ? ' — ' + esc(t.categoria) : '') + '</option>').join('');

  // A régua de cada turma, para o editor da régua pré-carregar a que está declarada
  // (o JS da página recebe o mapa; o `JSON.stringify` é do `id` → níveis).
  // A régua de cada turma, JÁ RESOLVIDA (vínculo → própria → padrão). O JS da página recebe
  // este mapa para não ter de resolver nada: ele desenha o que o servidor decidiu.
  const reguaPorTurma = {};
  for (const t of listaTurmas) if (t && t.id) reguaPorTurma[t.id] = rubricaDaTurma(t, listaRubricas);
  // AS RUBRICAS — a lista da aba «Criar rubrica» e as opções da aba «Vincular».
  const rubricaPorId = new Map(listaRubricas.map((r) => [r.id, r]));
  const turmasDaRubrica = {};
  for (const t of listaTurmas) {
    const lig = t && String(t.rubricaId || '');
    if (lig) turmasDaRubrica[lig] = (turmasDaRubrica[lig] || 0) + 1;
  }

  // --- AS TRÊS ABAS DA SECÇÃO TURMAS -----------------------------------------
  // A régua da rubrica estava DENTRO do cadastro da turma: quem cadastrava uma turma tinha de
  // decidir, ali, com que níveis o resultado seria medido — e a régua não é da turma, é da
  // escola. Pior: havia um SEGUNDO formulário, abaixo, que mudava a régua de uma turma que já
  // existia, e os dois se sobrepunham. Agora são três atos separados, em três abas:
  //   1. Turma            — quem, quando, quantas vezes (o cadastro).
  //   2. Criar rubrica    — a régua, uma vez, com nome.
  //   3. Vincular         — qual turma usa qual rubrica.
  const itensRubricas = listaRubricas.length
    ? listaRubricas.map((r) => {
        const emUso = turmasDaRubrica[r.id] || 0;
        return '<li><span class="nome"><b>' + esc(r.nome) + '</b> ' +
          '<span class="dono">' + esc(niveisLimpos(r.niveis).join(' · ')) + '</span> ' +
          (emUso
            ? '<span class="dono">— ' + emUso + ' turma' + (emUso > 1 ? 's' : '') + ' usam esta rubrica</span>'
            : '<span class="dono">— nenhuma turma usa ainda</span>') + '</span>' +
          '<span class="acoes">' +
          '<button class="editar-rubrica acao pequena" data-rubrica="' + esc(r.id) + '" title="Abrir esta rubrica no formulário">Editar</button>' +
          '<button class="apagar acao perigo pequena" data-tipo="rubrica" data-alvo="' + esc(r.id) + '" title="Excluir rubrica">Excluir</button>' +
          '</span></li>';
      }).join('')
    : '<li class="vazia">(nenhuma rubrica criada ainda)</li>';

  // A LISTA DOS VÍNCULOS: cada turma e a régua com que ela está sendo medida — o efeito do
  // vínculo, e não o vínculo em si. É o que a direção precisa conferir.
  const itensVinculos = listaTurmas.length
    ? listaTurmas.map((t) => {
        const lig = String(t.rubricaId || '');
        const alvo = lig ? rubricaPorId.get(lig) : null;
        const origem = alvo
          ? '<b>' + esc(alvo.nome) + '</b>'
          : (niveisLimpos(t.rubrica).length
            ? '<span class="dono">régua própria desta turma</span>'
            : '<span class="dono">régua padrão (nenhuma rubrica ligada)</span>');
        return '<li><span class="nome">' + esc(t.nome) + '</span>' +
          '<span class="acoes"><span class="dono">' + esc(reguaPorTurma[t.id].join(' · ')) + '</span></span>' +
          '<span class="nome fixo">→ ' + origem + '</span></li>';
      }).join('')
    : '<li class="vazia">(nenhuma turma cadastrada)</li>';

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
          t.frequencia ? t.frequencia + 'x/semana' : '',
          diasTexto,
          t.duracaoMin ? t.duracaoMin + ' min' : '',
          (t.periodoInicio || t.periodoFim)
            ? 'termo ' + (t.periodoInicio || '?') + '–' + (t.periodoFim || '?')
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
        const regua = rubricaDaTurma(t);
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
                v.frequencia ? v.frequencia + 'x/semana' : '',
                (v.dias && v.dias.length)
                  ? v.dias.map((d) => (v.horarios && v.horarios[d]) ? d + ' ' + v.horarios[d] : d).join(', ')
                  : '',
                v.duracaoMin ? v.duracaoMin + ' min' : '',
                (v.periodoInicio || v.periodoFim) ? (v.periodoInicio || '?') + '–' + (v.periodoFim || '?') : '',
              ].filter(Boolean).join(' · ');
              return '<li><span class="dono">até ' + esc(v.substituidaEm || '?') + '</span> ' +
                esc(r || '(sem ritmo)') + '</li>';
            }).join('') + '</ul></details>'
          : '';
        const seloVigencia = t.vigenteDe
          ? '<span class="selo vigencia" title="esta versão da turma vale a partir desta data">ajustada em ' +
            esc(t.vigenteDe) + '</span>'
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
          t.frequencia ? t.frequencia + 'x' : '',
          t.duracaoMin ? t.duracaoMin + ' min' : '',
        ].filter(Boolean).join(' · ');
        const camposDoRitmo = [
          ['Frequência', t.frequencia ? t.frequencia + 'x por semana' : ''],
          ['Dias e horário', diasTexto],
          ['Duração da aula', t.duracaoMin ? t.duracaoMin + ' min' : ''],
          ['Período', (t.periodoInicio || t.periodoFim)
            ? (t.periodoInicio || '?') + ' a ' + (t.periodoFim || '?')
            : ''],
        ];
        const painelRitmo = falta.length
          ? '<div class="frase">Esta turma ainda não tem ritmo — e é o ritmo que o plano lê. ' +
            '<b>Sem ele, a turma não pode ser atribuída na curadoria.</b></div>' +
            '<ul class="lista-falta">' + falta.map((f) => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
            '<p class="nota">Assim que o ritmo estiver completo, a turma passa a poder ser atribuída.</p>'
          : '<div class="grade">' + camposDoRitmo.map(([k, v]) =>
              '<div><span class="k">' + esc(k) + '</span><span class="v">' + esc(v || '—') + '</span></div>').join('') + '</div>';
        const painelRegua = '<div class="escala">' + regua.map((n, i) =>
          '<span class="' + classeDoNivel(n, i, regua.length) + '">' + esc(n) + '</span>').join('') + '</div>';
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
          '<button class="apagar acao perigo pequena" data-tipo="turma" data-alvo="' + esc(t.id) + '" data-nome="' + esc(t.nome) + '" title="Excluir turma">Excluir</button></span></div>' +
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
  const itensTermos = listaTermos.length
    ? listaTermos.map((t) => {
        const complemento = [t.categoria, t.tradicao].filter(Boolean).join(' · ');
        return '<li><span class="nome"><b>' + esc(t.termo) + '</b>' +
          (complemento ? '<span class="dono">' + esc(complemento) + '</span>' : '') + '</span>' +
          '<span class="acoes"><button class="apagar acao perigo pequena" data-tipo="termo" data-alvo="' + esc(t.termo) + '" title="Excluir termo">Excluir</button></span></li>';
      }).join('')
    : '<li class="vazia">(nenhum termo cadastrado)</li>';

  // --- CURADORIA (Bloco 2 do pedido) ----------------------------------------
  // A LISTA da operação são as VIGENTES (16/10/2026): uma curadoria substituída por uma
  // derivação continua guardada e aparece no histórico da que a substituiu, mas não se oferece.
  const listaCuradorias = curadoriasVigentes(curs);
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
        return '<li><span class="nome"><b>' + esc(rotuloProfessor) + '</b>' +
          seloEstado + (seloVigencia ? seloVigencia : '') +
          (complemento ? '<span class="dono">' + esc(complemento) + '</span>' : '') + '</span>' +
          '<span class="acoes">' + botaoAjuste +
          '<button class="apagar acao perigo pequena" data-tipo="curadoria" data-alvo="' + esc(c.id) + '" title="Remover curadoria">Excluir</button></span>' +
          historico + '</li>';
      }).join('')
    : '<li class="vazia">(nenhuma curadoria atribuída)</li>';

  return cabecalhoDaVista('Bastidores · Produção · ' + escola) +
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
    '.abas{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.15rem;border-bottom:1px solid var(--borda-campo);margin:.1rem 0 .2rem;}' +
    '.aba{background:transparent;border:none;border-bottom:3px solid transparent;border-radius:0;margin:0;padding:.5rem .9rem;color:var(--marca-texto);font:600 .95rem/1.3 var(--ui);cursor:pointer;}' +
    '.aba:hover{background:var(--fundo-hover);}' +
    '.aba.ativo{color:var(--marca);border-bottom-color:var(--marca);}' +
    '.aba:focus-visible{outline:2px solid var(--foco);outline-offset:-2px;}' +
    '.aba-painel{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
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
    '.lista > li > .nome:not(.fixo){display:flex;flex-wrap:wrap;align-items:baseline;' +
      'gap:.1rem .4rem;flex:1 1 auto;min-width:0;overflow:hidden;}' +
    '.lista > li > .nome:not(.fixo) > b{flex:1 1 auto;min-width:0;white-space:nowrap;' +
      'overflow:hidden;text-overflow:ellipsis;}' +
    '.lista > li > .nome:not(.fixo) > .selo{flex:0 0 auto;}' +
    // `100%` é o que FORÇA a segunda linha: o complemento não divide espaço com o nome, e
    // `nowrap` + reticências é o que impede a terceira — ele nunca quebra, ele encurta.
    '.lista > li > .nome:not(.fixo) > .dono{flex:0 0 100%;white-space:nowrap;' +
      'overflow:hidden;text-overflow:ellipsis;}' +
    // O «→ origem» da turma não encolhe: ele diz de onde a régua veio, e não é o nome
    // que se pode truncar. A medida mora aqui, não no atributo `style` do HTML.
    '.lista > li > .nome.fixo{flex:0 0 auto;font-size:.85rem;}' +
    '.lista li .acoes{flex:0 0 auto;display:flex;align-items:center;gap:.35rem;}' +
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
    '.conteudos-form{display:grid;gap:.5rem;margin:.2rem 0 1rem;}' +
    '.conteudos-form .chips{display:flex;flex-wrap:wrap;align-items:center;gap:.3rem;min-height:1.7rem;}' +
    '.conteudos-form .par-associar{display:flex;align-items:center;gap:.35rem;min-width:0;}' +
    '.conteudos-form .par-associar select{flex:1 1 auto;min-width:0;max-width:none;}' +
    '.conteudos-form .par-associar button{flex:0 0 auto;}' +
    '.conteudos-form[data-travado="sim"]{opacity:.72;}' +
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
    // AS ESCOLHAS EM LINHA (os dias da semana): o professor clica no que quer. Nada de caixa
    // marcável dentro de uma caixa com rolagem. Vale para lista CURTA e FIXA — para as
    // longas, o escolhedor abaixo.
    '.escolhas{display:flex;flex-wrap:wrap;gap:.55rem .35rem;margin:.3rem 0 .9rem;}' +
    '.dia-hora{display:inline-flex;flex-direction:column;align-items:center;gap:.18rem;}' +
    '.hora-do-dia{width:5.4rem;font-size:.8rem;padding:.12rem .25rem;}' +
    // A HORA SÓ EXISTE PARA O DIA ESCOLHIDO (16/10/2026). Desabilitada, o campo não se
    // preenche por engano — e um horário de um dia que a turma não tem seria descartado na
    // gravação de qualquer forma, mas depois de o ter escrito.
    '.hora-do-dia:disabled{opacity:.4;background:var(--fundo-faixa);cursor:not-allowed;}' +
    '.escolha{display:inline-flex;align-items:center;margin:0;cursor:pointer;}' +
    '.escolha input{position:absolute;width:1px;height:1px;opacity:0;}' +
    '.escolha span{display:inline-block;padding:.28rem .7rem;border:1px solid var(--borda-campo);border-radius:var(--raio-pilula);background:var(--superficie);font-size:.87rem;color:var(--marca-texto);line-height:1.35;}' +
    '.escolha input:checked+span{background:var(--marca-fundo);border-color:var(--marca-fundo);color:var(--texto-destaque-marca);font-weight:600;}' +
    '.escolha input:focus-visible+span{outline:2px solid var(--foco);outline-offset:1px;}' +
    // O ESCOLHEDOR: escolhe no menu, «Adicionar», e o escolhido vira ficha com o «×».
    '.escolhedor{margin:.3rem 0 .8rem;}' +
    '.escolhedor .escolhidos{display:flex;flex-wrap:wrap;gap:.35rem;min-height:1.9rem;margin:0 0 .35rem;}' +
    '.escolhedor .escolhidos .vazio{color:var(--texto-suave);font-size:.85rem;line-height:1.9rem;}' +
    '.escolhido{display:inline-flex;align-items:center;gap:.15rem;padding:.15rem .2rem .15rem .65rem;border:1px solid var(--marca);background:var(--fundo-faixa);border-radius:var(--raio-pilula);font-size:.86rem;color:var(--texto);line-height:1.5;}' +
    '.escolhido button{margin:0;padding:0 .35rem;background:transparent;border:none;color:var(--marca);font:700 .95rem/1 var(--ui);cursor:pointer;}' +
    '.escolhedor .entrada{display:flex;gap:.4rem;align-items:center;}' +
    '.escolhedor .entrada select{flex:1 1 auto;width:auto;min-width:0;}' +
    '.escolhedor .entrada button{margin:0;padding:.45rem .85rem;font-size:.86rem;white-space:nowrap;}' +
    '#rubr-limpar{margin:.9rem 0 0 .4rem;}' +
    '#vinc-desvincular{margin:.9rem 0 0 .4rem;}' +
    '.linha-regua{display:flex;gap:.4rem;align-items:center;margin:.25rem 0;}' +
    '.linha-regua input{flex:1 1 auto;min-width:0;}' +
    '.linha-regua button{margin:0;flex:0 0 auto;padding:.2rem .5rem;background:transparent;color:var(--falha);border:1px solid var(--borda-campo);border-radius:var(--raio-1);cursor:pointer;}' +
    '[hidden]{display:none!important;}' +
    '#gate{border:1px solid var(--borda-campo);background:var(--superficie);border-radius:var(--raio-3);padding:1rem 1.1rem;max-width:24rem;}' +
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
    // O `.aba-painel` tem grade PRÓPRIA (é ele que alinha formulário e lista dentro de uma
    // aba), e por isso tinha de ser desfeito junto com a `.secao`. Não era: abaixo de
    // 1140px a `.secao` virava uma coluna e o `.aba-painel` continuava com duas — a lista
    // de turmas ficava ao lado do formulário numa tela de telefone, e as duas colunas se
    // sobrepunham. Era o único grupo com abas, e por isso o único com o defeito.
    '@media (max-width:1140px){.secao,.aba-painel{grid-template-columns:minmax(0,1fr);}.col-lista{position:static;max-height:none;}}' +
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
    '@media (max-width:768px){' +
      '.corpo{grid-template-columns:minmax(0,1fr);padding:var(--esp-4) var(--esp-4) var(--esp-6);}' +
      '.lateral{position:static;border-right:none;padding:0 0 var(--esp-3);}' +
      '.lateral-barra{display:flex;align-items:center;gap:var(--esp-3);}' +
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
    '}' +
    '</style></head><body data-layout="painel" data-tela="bastidores">' +
    topnav(contexto, 'producao') +
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
    '<h1>Produção</h1>' +
    '<p>O gabinete da direção — só a direção entra.</p>' +
    '<div id="gate">' +
    '<form id="form-senha">' +
    '<label class="campo-rotulo" for="dsenha">Senha da direção</label>' +
    '<input id="dsenha" type="password" autocomplete="current-password" autofocus>' +
    '<button type="submit" class="acao grande">Entrar</button>' +
    '</form>' +
    '<div class="res" id="res-gate"></div>' +
    '</div>' +
    '<div id="conteudo" hidden>' +
    '<div class="res" id="res"></div>' +
    // Só o Painel inicial nasce visível: as demais secções já vêm com `hidden` do
    // servidor — mesmo que o script da página falhe, a Produção nunca volta a ser
    // uma página só com tudo empilhado (o sintoma quando o script morria).
    '<section class="secao" id="sec-painel">' +
    '<h2>Painel inicial</h2>' +
    '<p>Aqui aparece o que mudou desde a última vez. Use o menu ao lado para gerir pessoas e pedagogia.</p>' +
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
    '<div class="abas" role="tablist" aria-label="Turmas, rubricas e vínculos">' +
    '<button type="button" class="aba ativo" data-aba="turma" role="tab" aria-selected="true">Turma</button>' +
    '<button type="button" class="aba" data-aba="rubrica" role="tab" aria-selected="false">Criar rubrica</button>' +
    '<button type="button" class="aba" data-aba="vincular" role="tab" aria-selected="false">Vincular turma à rubrica</button>' +
    '</div>' +
    // ABA 1 — A TURMA. Só o que é da turma: quem, quando, com que frequência e por quanto
    // tempo. A régua SAIU daqui: ela é da escola, e mora na aba seguinte.
    '<div class="aba-painel" id="aba-turma">' +
    '<div class="col-form">' +
    '<form id="form-turma">' +
    // O «EDITAR» DA TURMA É UMA DERIVAÇÃO (16/10/2026). A escola pensa que edita; o que fica
    // gravado é um elo novo com data de vigência, e o anterior desce para o histórico. Por
    // isso o formulário ganha um modo: o campo oculto diz de onde se deriva, e a data diz a
    // partir de quando o ajuste vale. Sem o modo, o mesmo formulário cadastra.
    '<input type="hidden" id="tderivar">' +
    '<input type="hidden" id="tmodo">' +
    '<div class="aviso-derivar" id="t-aviso" hidden>' +
    '<p><span id="t-aviso-texto"></span> <button type="button" class="acao secundario pequena" id="t-cancelar">Cancelar</button></p>' +
    '<div id="t-vigencia-campo">' +
    '<label class="campo-rotulo" for="tvigencia">Vale a partir de</label>' +
    '<input id="tvigencia" type="date" autocomplete="off">' +
    '</div>' +
    '</div>' +
    '<label class="campo-rotulo" for="tnome">Nome da turma</label>' +
    '<input id="tnome" name="nome" autocomplete="off" placeholder="ex.: Balé Nível 1">' +
    '<label class="campo-rotulo" for="tordem">Posição na lista (1 = primeiro; vazio vai para o fim)</label>' +
    '<input id="tordem" name="ordem" autocomplete="off" placeholder="ex.: 1">' +
    '<label class="campo-rotulo" for="tprograma">Programa de referência (sugerido, não oficial)</label>' +
    '<input id="tprograma" name="programaReferencia" autocomplete="off" placeholder="ex.: RAD (referência sugerida)">' +
    // O NÍVEL é ESCOLHEDOR: escolhe no menu, «Adicionar», e o nível fica em ficha com o «×».
    // A lista são os níveis do catálogo MAIS os que alguma turma já declara — um nível que a
    // escola já usa não desaparece do formulário por não estar no catálogo. O que sai daqui
    // continua a ser UM texto («Grade 3, Grade 4»): o contrato do servidor e o do plano não
    // mudam.
    '<label>Equivalência pedagógica</label>' +
    escolhedor('esc-niveis', niveisOferecidos.map((n) => ({ valor: n }))) +
    '<label class="campo-rotulo" for="tdescricao">Notas sobre esta turma (opcional)</label>' +
    '<input id="tdescricao" name="descricao" autocomplete="off">' +
    '<label class="campo-rotulo" for="tfrequencia">Frequência semanal (aulas por semana)</label>' +
    '<input id="tfrequencia" name="frequencia" type="number" min="1" step="1" autocomplete="off" placeholder="ex.: 2">' +
    // OS DIAS DA SEMANA: sete pílulas numa linha. Era uma caixa com rolagem e sete
    // caixinhas dentro; não há motivo para uma escolha de sete itens morar atrás de uma
    // barra de rolagem dentro de um formulário.
    '<label>Dias da semana e a hora de início de cada um</label>' +
    '<div class="escolhas" id="tdias">' + DIAS_DA_SEMANA.map((d) =>
      '<span class="dia-hora">' + pilula('dia', d, esc(d)) +
      '<input type="time" class="hora-do-dia" data-dia="' + esc(d) + '" ' +
      'aria-label="hora de início — ' + esc(d) + '" autocomplete="off"></span>').join('') + '</div>' +
    '<label class="campo-rotulo" for="tduracao">Duração de cada aula (minutos)</label>' +
    '<input id="tduracao" name="duracaoMin" type="number" min="5" step="5" autocomplete="off" placeholder="ex.: 60">' +
    // OS CONTEÚDOS, AQUI E NÃO NA LISTAGEM (18/10/2026). Depois de decidir a duração, a
    // direção decide o que a turma vai usar — e é isso que este bloco faz. Na listagem o
    // painel dos conteúdos passou a MOSTRAR apenas; compor é do formulário.
    //
    // O bloco só sabe a que turma se refere quando há uma turma no formulário: em
    // «cadastrar» ainda não existe id (e a associação precisa de um), e em «derivar» o id
    // que está à mão é o da turma ANTIGA — mas a derivação já COPIA os conteúdos para a
    // nova (ver `/api/bastidores/turma-derivar`), e mexer aqui estaria a mexer no passado.
    // Nos dois casos o bloco aparece, desligado, a dizer por quê.
    '<label>Conteúdos da turma</label>' +
    '<div class="conteudos-form" id="t-conteudos">' +
    '<div class="chips" id="t-conteudos-lista"><span class="dono">(nenhum conteúdo associado)</span></div>' +
    '<span class="par-associar"><select class="sel-termo" id="t-sel-termo" aria-label="termo a associar">' +
    '<option value="">— associar termo —</option>' + opcoesTermo + '</select>' +
    '<button type="button" class="associar acao pequena" id="t-associar">Associar</button></span>' +
    '<p class="nota" id="t-conteudos-aviso" hidden></p>' +
    '</div>' +
    '<label class="campo-rotulo" for="tinicio">Início do período (termo)</label>' +
    '<input id="tinicio" name="periodoInicio" type="date" autocomplete="off">' +
    '<label class="campo-rotulo" for="tfim">Fim do período (termo)</label>' +
    '<input id="tfim" name="periodoFim" type="date" autocomplete="off">' +
    '<button type="submit" class="acao grande" id="t-enviar">Cadastrar turma</button>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Turmas cadastradas</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensTurmas + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    // Os conteúdos de cada turma, com o «×», prontos a clonar (ver `ajustarTurma`).
    blocosDeConteudos.join('') +
    '</div>' +
    // ABA 2 — CRIAR RUBRICA. A régua ganha NOME: é o que a torna vinculável a mais de uma
    // turma, e o que impede que a mesma decisão seja redigitada em cada cadastro.
    '<div class="aba-painel" id="aba-rubrica" hidden>' +
    '<div class="col-form">' +
    '<form id="form-rubrica">' +
    '<input type="hidden" id="rubr-id">' +
    '<label class="campo-rotulo" for="rubr-nome">Nome da rubrica</label>' +
    '<input id="rubr-nome" autocomplete="off" placeholder="ex.: Régua do Nível 1">' +
    '<label>Níveis</label>' +
    '<div id="rubr-niveis">' + NIVEIS_DA_RUBRICA.map((n) => linhaDaRegua(n)).join('') + '</div>' +
    '<p><button type="button" class="acao secundario pequena" id="rubr-add">Acrescentar nível</button></p>' +
    '<button type="submit" class="acao grande">Salvar rubrica</button>' +
    '<button type="button" class="acao secundario" id="rubr-limpar">Limpar formulário</button>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Rubricas criadas</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensRubricas + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</div>' +
    // ABA 3 — VINCULAR. Qual turma é medida por qual rubrica. A lista mostra o EFEITO (com
    // que níveis cada turma está sendo medida), que é o que a direção precisa conferir.
    '<div class="aba-painel" id="aba-vincular" hidden>' +
    '<div class="col-form">' +
    '<form id="form-vincular">' +
    '<label class="campo-rotulo" for="vinc-turma">Turma</label>' +
    '<select id="vinc-turma">' +
    (listaTurmas.length
      ? listaTurmas.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.nome) + '</option>').join('')
      : '<option value="">— nenhuma turma cadastrada —</option>') +
    '</select>' +
    '<label class="campo-rotulo" for="vinc-rubrica">Rubrica</label>' +
    '<select id="vinc-rubrica">' +
    (listaRubricas.length
      ? listaRubricas.map((r) => '<option value="' + esc(r.id) + '">' + esc(r.nome) + '</option>').join('')
      : '<option value="">— nenhuma rubrica criada —</option>') +
    '</select>' +
    '<button type="submit" class="acao grande">Vincular</button>' +
    '<button type="button" class="acao secundario" id="vinc-desvincular">Desvincular (volta à régua padrão)</button>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Com que régua cada turma é medida</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensVinculos + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</div>' +
    '</section>' +
    '<section class="secao" id="sec-vocabulario" hidden>' +
    '<h2>Vocabulário Técnico do Balé</h2>' +
    '<div class="col-form">' +
    '<form id="form-termo">' +
    '<label class="campo-rotulo" for="vtermo">Termo principal (grafia francesa, com acentos)</label>' +
    '<input id="vtermo" name="termo" autocomplete="off" placeholder="ex.: Plié">' +
    '<label class="campo-rotulo" for="vcategoria">Categoria</label>' +
    '<input id="vcategoria" name="categoria" autocomplete="off" placeholder="passo · posicao · direcao · ligacao · salto · giro">' +
    '<label class="campo-rotulo" for="vtradicao">Tradição de referência</label>' +
    '<input id="vtradicao" name="tradicao" autocomplete="off" placeholder="compartilhada · RAD · francesa · Vaganova">' +
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
    // turma, e o mesmo desenho de aviso e data (16/10/2026).
    '<input type="hidden" id="cuderivar">' +
    '<input type="hidden" id="cumodo">' +
    '<div class="aviso-derivar" id="cu-aviso" hidden>' +
    '<p><span id="cu-aviso-texto"></span> <button type="button" id="cu-cancelar">Cancelar</button></p>' +
    '<div id="cu-vigencia-campo">' +
    '<label class="campo-rotulo" for="cuvigencia">Vale a partir de</label>' +
    '<input id="cuvigencia" type="date" autocomplete="off">' +
    '</div>' +
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
    '<button type="submit" id="cu-enviar">Atribuir curadoria</button>' +
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
    'var SENHA_DIRECAO = "";' +
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
    '    var itens = Array.prototype.slice.call(ul.children);' +
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
    // AS ABAS da secção Turmas: mostra o painel da aba clicada e marca a aba. O estado NÃO
    // vai para a URL de propósito — a URL já é do menu lateral (`#turmas`), e um segundo
    // nível de hash tornaria os dois difíceis de usar. Recarregar volta à primeira aba.
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("button.aba") : null;' +
    '  if (!b) return;' +
    '  var abas = b.closest(".abas");' +
    '  if (!abas) return;' +
    '  var secao = abas.parentElement;' +
    '  var alvo = b.getAttribute("data-aba");' +
    '  var irmas = abas.querySelectorAll("button.aba");' +
    '  for (var i = 0; i < irmas.length; i++) {' +
    '    var ativa = irmas[i] === b;' +
    '    irmas[i].className = ativa ? "aba ativo" : "aba";' +
    '    irmas[i].setAttribute("aria-selected", ativa ? "true" : "false");' +
    '  }' +
    '  var paineis = secao.querySelectorAll(".aba-painel");' +
    '  for (var j = 0; j < paineis.length; j++) {' +
    '    paineis[j].hidden = paineis[j].id !== "aba-" + alvo;' +
    '  }' +
    '});' +
    'function entrar(senha) {' +
    '  var g = document.getElementById("res-gate");' +
    '  g.className = "res"; g.textContent = "verificando...";' +
    '  fetch("/api/bastidores/validar-producao", {' +
    '    method: "POST", headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify({senha: senha})' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) {' +
    '      SENHA_DIRECAO = senha;' +
    '      try { sessionStorage.setItem("producao:senha", senha); } catch (err) { /* sem sessão */ }' +
    '      document.getElementById("gate").hidden = true;' +
    '      document.getElementById("conteudo").hidden = false;' +
    '    } else { g.className = "res erro"; g.textContent = "Senha não reconhecida."; }' +
    '  }).catch(function(err){ g.className = "res erro"; g.textContent = "Erro: " + err.message; });' +
    '}' +
    'document.getElementById("form-senha").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  entrar(document.getElementById("dsenha").value);' +
    '});' +
    // A sessão persiste enquanto a ABA fica aberta (sessionStorage): depois do primeiro
    // login, o recarregar da página (após cadastrar/excluir) re-entra SOZINHO, sem pedir
    // a senha de novo. Fechar a aba esquece; manter aberta não volta a pedir.
    '(function(){' +
    '  var guardada = null;' +
    '  try { guardada = sessionStorage.getItem("producao:senha"); } catch (err) {}' +
    '  if (guardada) entrar(guardada);' +
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
    // O `Escape` é o gesto que se espera de uma folha modal, e no teclado não há véu para
    // clicar. Fecha também quando a janela cresce: em tela larga a folha não existe, e o
    // `overflow:hidden` do `body` ficaria a travar a página sem nada aberto.
    '  document.addEventListener("keydown", function(e){ if (e.key === "Escape") fecharMenu(); });' +
    '  window.addEventListener("resize", function(){ if (window.innerWidth > 768) fecharMenu(); });' +
    '})();' +
    'function postar(id, corpo) {' +
    '  corpo.senhaDirecao = SENHA_DIRECAO;' +
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
    'function marcados(nome) {' +
    '  return Array.prototype.slice.call(document.querySelectorAll("input[name=\\"" + nome + "\\"]:checked")).map(function(x){ return x.value; });' +
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
    'function enviar(ep, corpo, mensagem, recarregar) {' +
    '  corpo.senhaDirecao = SENHA_DIRECAO;' +
    '  var res = document.getElementById("res");' +
    '  res.className = "res"; res.textContent = mensagem;' +
    '  return fetch(ep, {' +
    '    method: "POST",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { if (recarregar) { location.reload(); } else { res.className = "res ok"; res.textContent = "ok (" + (d.turmasNovas != null ? d.turmasNovas + " turmas, " + d.termosNovos + " termos, " + d.associacoes + " associações" : "feito") + ")"; } }' +
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
    '    ordem: document.getElementById("tordem").value,' +
    '    programaReferencia: document.getElementById("tprograma").value,' +
    '    nivelReferencia: fichasDe("esc-niveis").join(", "),' +
    '    descricao: document.getElementById("tdescricao").value,' +
    '    frequencia: document.getElementById("tfrequencia").value,' +
    '    dias: marcados("dia"),' +
    '    horarios: horariosDoDia(),' +
    '    duracaoMin: document.getElementById("tduracao").value,' +
    '    periodoInicio: document.getElementById("tinicio").value,' +
    '    periodoFim: document.getElementById("tfim").value' +
    // A régua SAIU daqui: a turma nasce sem ela, e a régua entra pelo vínculo (aba
    // «Vincular turma à rubrica»). Sem rubrica ligada, a leitura aplica a padrão.
    '  };' +
    '  if (!derivando) {' +
    '    enviar("/api/bastidores/turma", campos, "cadastrando turma...", true); return;' +
    '  }' +
    // DOIS CAMINHOS, e a diferença não é cosmética (16/10/2026): a turma LIVRE edita-se (o
    // registo é substituído no lugar, e o nome pode mudar); a VINCULADA a um plano de ensino
    // deriva (nasce um elo novo, com data, e o nome NÃO muda — é ele que o plano referencia).
    '  var modo = (document.getElementById("tmodo") || {}).value || "derivar";' +
    '  if (modo === "editar") {' +
    '    campos.id = derivando;' +
    '    enviar("/api/bastidores/turma-editar", campos, "gravando turma...", true); return;' +
    '  }' +
    '  var vig = document.getElementById("tvigencia").value;' +
    '  if (!vig) { alert("Informe a data a partir da qual a turma ajustada vale."); return; }' +
    '  campos.derivarDe = derivando;' +
    '  campos.vigencia = vig;' +
    '  enviar("/api/bastidores/turma-derivar", campos, "ajustando turma...", true);' +
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
    '  document.getElementById("tderivar").value = t.id;' +
    '  document.getElementById("tmodo").value = derivar ? "derivar" : "editar";' +
    '  document.getElementById("t-aviso").hidden = false;' +
    '  document.getElementById("t-vigencia-campo").hidden = !derivar;' +
    '  document.getElementById("t-aviso-texto").innerHTML = derivar' +
    '    ? "Derivando <b>" + t.nome + "</b>: o que gravar vale <b>a partir da data</b> abaixo, e " +' +
    '      "o ritmo anterior sai do cadastro e fica no histórico da turma."' +
    '    : "Editando <b>" + t.nome + "</b>: esta turma ainda não tem plano de ensino, por isso " +' +
    '      "o registo é corrigido no lugar. O nome também pode mudar.";' +
    '  document.getElementById("t-enviar").textContent = derivar ? "Gravar ajuste" : "Gravar turma";' +
    '  var nome = document.getElementById("tnome");' +
    '  nome.value = t.nome || ""; nome.readOnly = derivar;' +
    '  document.getElementById("tordem").value = (t.ordem == null ? "" : t.ordem);' +
    '  document.getElementById("tprograma").value = t.programaReferencia || "";' +
    '  document.getElementById("tdescricao").value = t.descricao || "";' +
    '  document.getElementById("tfrequencia").value = (t.frequencia == null ? "" : t.frequencia);' +
    '  document.getElementById("tduracao").value = (t.duracaoMin == null ? "" : t.duracaoMin);' +
    '  document.getElementById("tinicio").value = t.periodoInicio || "";' +
    '  document.getElementById("tfim").value = t.periodoFim || "";' +
    // OS CONTEÚDOS DA TURMA QUE ESTÁ NO FORMULÁRIO. O bloco é UM só; o que muda é de que
    // turma ele fala. Os chips vêm de um bloco oculto por turma (escrito pelo servidor), e
    // não de uma segunda versão do markup aqui no JavaScript.
    '  var caixaC = document.getElementById("t-conteudos");' +
    '  var listaC = document.getElementById("t-conteudos-lista");' +
    '  var selC = document.getElementById("t-sel-termo");' +
    '  var btnC = document.getElementById("t-associar");' +
    '  var avisoC = document.getElementById("t-conteudos-aviso");' +
    '  var fonte = null;' +
    '  Array.prototype.slice.call(document.querySelectorAll(".conteudos-da-turma")).forEach(function(d){' +
    '    if (d.getAttribute("data-de") === t.id) fonte = d;' +
    '  });' +
    '  var vazioC = "<span class=\\"dono\\">(nenhum conteúdo associado)</span>";' +
    '  listaC.innerHTML = (fonte && fonte.innerHTML.trim()) ? fonte.innerHTML : vazioC;' +
    // DERIVAR: a turma nova herda os conteúdos (o servidor copia-os), e o id que está na mão
    // é o da turma ANTIGA — mexer aqui seria mexer no passado. O bloco aparece desligado.
    '  if (derivar) {' +
    '    Array.prototype.slice.call(listaC.querySelectorAll("button.desassociar")).forEach(function(b){ b.parentElement.removeChild(b); });' +
    '    selC.disabled = true; btnC.disabled = true; btnC.removeAttribute("data-turma");' +
    '    caixaC.setAttribute("data-travado", "sim");' +
    '    avisoC.hidden = false;' +
    '    avisoC.textContent = "A turma derivada herda estes conteúdos. Para os mudar, edite-a depois de gravar.";' +
    '  } else {' +
    '    selC.disabled = false; btnC.disabled = false; btnC.setAttribute("data-turma", t.id);' +
    '    caixaC.removeAttribute("data-travado");' +
    '    avisoC.hidden = true; avisoC.textContent = "";' +
    '  }' +
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
    // A data de vigência nasce com hoje: é o caso normal (a escola descobre o erro e corrige
    // agora). A escola muda se o ajuste for retroativo.
    '  var hoje = new Date();' +
    '  var iso = hoje.getFullYear() + "-" + ("0" + (hoje.getMonth() + 1)).slice(-2) + "-" + ("0" + hoje.getDate()).slice(-2);' +
    '  document.getElementById("tvigencia").value = iso;' +
    '  document.getElementById("t-aviso").scrollIntoView({block: "center"});' +
    '  (derivar ? document.getElementById("tvigencia") : nome).focus();' +
    '}' +
    // O ESTADO DE ENTRADA do bloco de conteúdos é o de CADASTRAR: ainda não há turma, logo
    // não há a que associar. Sem isto o bloco nasce ligado e a primeira associação iria para
    // uma turma que não existe — ou para nenhuma.
    'function travarConteudos(motivo){' +
    '  var sel = document.getElementById("t-sel-termo");' +
    '  var btn = document.getElementById("t-associar");' +
    '  var aviso = document.getElementById("t-conteudos-aviso");' +
    '  var caixa = document.getElementById("t-conteudos");' +
    '  var lista = document.getElementById("t-conteudos-lista");' +
    '  if (sel) sel.disabled = true;' +
    '  if (btn) { btn.disabled = true; btn.removeAttribute("data-turma"); }' +
    '  if (caixa) caixa.setAttribute("data-travado", "sim");' +
    '  if (lista) {' +
    '    Array.prototype.slice.call(lista.querySelectorAll("button.desassociar")).forEach(function(b){ b.parentElement.removeChild(b); });' +
    '    if (!lista.textContent.trim()) lista.innerHTML = "<span class=\\"dono\\">(nenhum conteúdo associado)</span>";' +
    '  }' +
    '  if (aviso) { aviso.hidden = false; aviso.textContent = motivo; }' +
    '}' +
    'travarConteudos("Grave a turma para poder associar conteúdos.");' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("[data-turma-ajustar]") : null;' +
    '  if (b) { ajustarTurma(b.getAttribute("data-turma-ajustar"), b.getAttribute("data-modo")); return; }' +
    '  if (e.target.closest && e.target.closest("#t-cancelar")) {' +
    '    document.getElementById("tderivar").value = "";' +
    '    document.getElementById("tmodo").value = "";' +
    '    document.getElementById("t-aviso").hidden = true;' +
    '    document.getElementById("t-enviar").textContent = "Cadastrar turma";' +
    '    document.getElementById("tnome").readOnly = false;' +
    '    document.getElementById("form-turma").reset();' +
    '    var listaC0 = document.getElementById("t-conteudos-lista");' +
    '    if (listaC0) listaC0.innerHTML = "<span class=\\"dono\\">(nenhum conteúdo associado)</span>";' +
    '    var btnC0 = document.getElementById("t-associar");' +
    '    if (btnC0) { btnC0.removeAttribute("data-turma"); btnC0.disabled = true; }' +
    '    var selC0 = document.getElementById("t-sel-termo"); if (selC0) selC0.disabled = true;' +
    '    var caixaC0 = document.getElementById("t-conteudos"); if (caixaC0) caixaC0.setAttribute("data-travado", "sim");' +
    '    var avisoC0 = document.getElementById("t-conteudos-aviso");' +
    '    if (avisoC0) { avisoC0.hidden = false; avisoC0.textContent = "Grave a turma para poder associar conteúdos."; }' +
    '    var esc = document.getElementById("esc-niveis");' +
    '    if (esc) {' +
    '      Array.prototype.slice.call(esc.querySelectorAll(".escolhido")).forEach(function(f){ f.parentElement.removeChild(f); });' +
    '      mostrarVazio(esc);' +
    '    }' +
    '    Array.prototype.slice.call(document.querySelectorAll(".hora-do-dia")).forEach(function(x){ x.value = ""; });' +
    '    sincronizarHoras();' +
    '  }' +
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
    '  document.getElementById("cu-aviso").hidden = false;' +
    '  document.getElementById("cu-vigencia-campo").hidden = !derivar;' +
    '  var quem = c.professor + " · " + c.modalidade;' +
    '  document.getElementById("cu-aviso-texto").innerHTML = derivar' +
    '    ? "Derivando <b>" + quem + "</b>: o que gravar vale <b>a partir da data</b> abaixo, e a " +' +
    '      "curadoria anterior fica no histórico."' +
    '    : "Editando <b>" + quem + "</b>: ainda não nasceu o plano de ensino desta curadoria, " +' +
    '      "por isso o registo é corrigido no lugar.";' +
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
    '  document.getElementById("cu-aviso").scrollIntoView({block: "center"});' +
    '  (derivar ? document.getElementById("cuvigencia") : document.getElementById("cu-enviar")).focus();' +
    '}' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("[data-curadoria-ajustar]") : null;' +
    '  if (b) { ajustarCuradoria(b.getAttribute("data-curadoria-ajustar"), b.getAttribute("data-modo")); return; }' +
    '  if (e.target.closest && e.target.closest("#cu-cancelar")) {' +
    '    document.getElementById("cuderivar").value = "";' +
    '    document.getElementById("cumodo").value = "";' +
    '    document.getElementById("cu-aviso").hidden = true;' +
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
    '});' +
    'document.getElementById("rubr-limpar").addEventListener("click", function(){' +
    '  document.getElementById("rubr-id").value = "";' +
    '  document.getElementById("rubr-nome").value = "";' +
    '  pintarEditorDaRubrica(NIVEIS_PADRAO.slice());' +
    '});' +
    // «Editar» de uma rubrica: abre-a NO FORMULÁRIO (com o id), para salvar por cima. O id vai
    // junto de propósito — renomear com o id derivado do nome criaria outra rubrica e deixaria
    // as turmas apontando para a que sumiu.
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("button.editar-rubrica") : null;' +
    '  if (!b) return;' +
    '  var id = b.getAttribute("data-rubrica");' +
    '  var alvo = null;' +
    '  for (var i = 0; i < RUBRICAS.length; i++) { if (RUBRICAS[i].id === id) alvo = RUBRICAS[i]; }' +
    '  if (!alvo) return;' +
    '  document.getElementById("rubr-id").value = alvo.id;' +
    '  document.getElementById("rubr-nome").value = alvo.nome;' +
    '  pintarEditorDaRubrica(alvo.niveis || []);' +
    '  document.getElementById("rubr-nome").focus();' +
    '});' +
    'document.getElementById("form-rubrica").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  var niveis = reguaDoEditor("rubr-niveis");' +
    '  if (!niveis.length) { alert("Declare pelo menos um nível — a régua vazia mediria contra nada."); return; }' +
    '  enviar("/api/bastidores/rubrica", {' +
    '    id: document.getElementById("rubr-id").value,' +
    '    nome: document.getElementById("rubr-nome").value,' +
    '    niveis: niveis' +
    '  }, "salvando a rubrica...", true);' +
    '});' +
    'document.getElementById("form-vincular").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  var turma = document.getElementById("vinc-turma").value;' +
    '  var rubricaId = document.getElementById("vinc-rubrica").value;' +
    '  if (!turma) { alert("Cadastre uma turma primeiro."); return; }' +
    '  if (!rubricaId) { alert("Crie uma rubrica primeiro, na aba «Criar rubrica»."); return; }' +
    '  enviar("/api/bastidores/turma-rubrica", {turma: turma, rubricaId: rubricaId}, "vinculando...", true);' +
    '});' +
    'document.getElementById("vinc-desvincular").addEventListener("click", function(){' +
    '  var turma = document.getElementById("vinc-turma").value;' +
    '  if (!turma) { alert("Escolha a turma."); return; }' +
    '  if (!confirm("Desvincular esta turma? Ela volta a ser medida pela régua padrão.")) return;' +
    '  enviar("/api/bastidores/turma-rubrica", {turma: turma}, "desvinculando...", true);' +
    '});' +
    'document.addEventListener("click", function(e){' +
    '  var b = e.target.closest ? e.target.closest("button.tirar-regua") : null;' +
    '  if (!b) return;' +
    '  var linha = b.parentElement;' +
    '  if (linha && linha.className === "linha-regua") linha.parentElement.removeChild(linha);' +
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
    '    var corpo = {turma: tId, termo: tTermo, senhaDirecao: SENHA_DIRECAO};' +
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
    '      body: JSON.stringify({nome: nome.trim(), senhaDirecao: SENHA_DIRECAO})' +
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
    '  corpo.senhaDirecao = SENHA_DIRECAO;' +
    '  fetch("/api/bastidores/" + tipo, {' +
    '    method: "DELETE",' +
    '    headers: {"Content-Type": "application/json"},' +
    '    body: JSON.stringify(corpo)' +
    '  }).then(function(r){ return r.json(); }).then(function(d){' +
    '    if (d.ok) { location.reload(); }' +
    '    else { alert("Erro: " + (d.erro || "desconhecido")); }' +
    '  }).catch(function(err){ alert("Erro: " + err.message); });' +
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
    return html(paginaEstudio(escola, contexto));
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
    return html(paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs, pares));
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const apelido = String(corpo.apelido || '').trim();
    if (!apelido) return json(400, { ok: false, erro: 'informe o apelido da aluna' });
    const lista = await alunas(kv, escola);
    const idx = lista.indexOf(apelido);
    if (idx === -1) return json(404, { ok: false, erro: 'aluna não encontrada' });
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
  if (path === '/api/bastidores/validar-producao' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String(corpo.senha || '');
    if (!senha) return json(400, { ok: false, erro: 'informe a senha da direção' });
    // O professor criado na página é SEMPRE o dono (a marcação saiu): a senha da direção é
    // a do administrador OU a do professor dono.
    const okDirecao = senhaDaDirecaoOk(env, senha);
    return json(200, okDirecao
      ? { ok: true, direcao: true }
      : { ok: false, erro: 'senha da direção não reconhecida' });
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    lista.push(nova);
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    return json(201, { ok: true, turma: nova.nome });
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    const CAMPOS_DO_FORMULARIO = ['nome', 'ordem', 'programaReferencia', 'nivelReferencia',
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
    return json(200, { ok: true, turma: novoId, nome: lista[indice].nome, eraId: idAntigo });
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    const CAMPOS_DO_FORMULARIO = ['nome', 'ordem', 'programaReferencia', 'nivelReferencia',
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

    return json(201, { ok: true, turma: nova.nome, id: nova.id, substitui: anterior.id, vigenteDe: vigencia });
  }

  // DELETE /api/bastidores/turma — excluir turma (e limpar a relação).
  if (path === '/api/bastidores/turma' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const novo = normalizarTermo(corpo);
    if (!novo.termo) return json(400, { ok: false, erro: 'informe o termo' });
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = idDe(String(corpo.termo || corpo.nome || corpo.id || '').trim());
    if (!id) return json(400, { ok: false, erro: 'informe o termo' });
    const lista = await termos(kv, escola);
    const idx = lista.findIndex((t) => t && t.id === id);
    if (idx === -1) return json(404, { ok: false, erro: 'termo não encontrado' });
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
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
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = String(corpo.id || '').trim();
    if (!id) return json(400, { ok: false, erro: 'informe a curadoria' });
    const lista = await curadorias(kv, escola);
    const idx = lista.findIndex((c) => c && c.id === id);
    if (idx === -1) return json(404, { ok: false, erro: 'curadoria não encontrada' });
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
};
