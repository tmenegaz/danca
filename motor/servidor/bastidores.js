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

/** O id estável de uma turma/termo: o slug do nome (não há edição — o nome não muda). */
function idDe(nome) {
  return slugificar(nome);
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
    '<button type="button" class="tirar-regua" title="Remover este nível">✕</button></span>';
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
    '<div class="fichas"><span class="vazio">(nada escolhido ainda)</span></div>' +
    '<div class="entrada">' +
    '<select class="opcoes"><option value="">— escolher —</option>' +
    lista.map((o) => '<option value="' + esc(o.valor) + '">' + esc(o.rotulo) + '</option>').join('') +
    '</select>' +
    '<button type="button" class="adicionar">Adicionar</button>' +
    '</div>' +
    '</div>';
}

/** O rodapé de uma lista paginada. O servidor NÃO escolhe a página: quem pagina é o
 *  navegador (a lista já veio inteira). Sem JavaScript, o rodapé não aparece e a lista
 *  mostra tudo — degradar para «mostra tudo» é melhor do que esconder itens sem como
 *  alcançá-los. */
function rodapePaginacao() {
  return '<div class="paginacao" hidden>' +
    '<button type="button" class="pag-ant" aria-label="Página anterior">‹</button>' +
    '<span class="pag-info"></span>' +
    '<button type="button" class="pag-prox" aria-label="Página seguinte">›</button>' +
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

/** O id estável de uma curadoria: o slug de `professor + modalidade` (sem edição — estável). */
function idCuradoria(professor, modalidade) {
  return slugificar(String(professor || '') + ' ' + String(modalidade || ''));
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
 * O MESMO menu do pacote do ciclo. O markup é o do `gerar_nav` (`tools/criar-escola.sh` e
 * `tools/gerar-ciclo.sh`): a marca, o hamburger, o grupo «Área do Professor» e o grupo
 * «Bastidores». A identidade visual vem da MESMA folha (`/assets/style.css`) e o
 * comportamento, do MESMO arquivo (`/assets/nav.js`) — os Bastidores deixam de ter uma
 * segunda navegação, que era o que sumia ao entrar por aqui.
 */
function topnav(contexto, onde) {
  const classe = (nome) => (nome === onde ? ' class="ativo"' : '');
  return '<nav class="topnav" aria-label="Navegação do ciclo">' +
    '<span class="marca" aria-hidden="true"></span>' +
    '<button class="hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">' +
    '<span></span><span></span><span></span>' +
    '</button>' +
    '<div class="nav-links" id="nav-links">' +
    '<a href="/index.html">Sistema Lastro</a>' +
    '<details class="menu">' +
    '<summary>Área do Professor</summary>' +
    '<div class="submenu">' +
    '<a href="' + urlDaPorta('/anamnese/', contexto) + '">Anamnese do aluno</a>' +
    '<a href="' + urlDaPorta('/plano-ensino/', contexto, 'fonte=plano') + '">Plano de ensino</a>' +
    '<a href="' + urlDaPorta('/plano-observacao/', contexto, 'fonte=po') + '">Plano de Observação</a>' +
    '</div>' +
    '</details>' +
    '<details class="menu">' +
    '<summary>Bastidores</summary>' +
    '<div class="submenu">' +
    '<a' + classe('estudio') + ' href="/bastidores/estudio">Estúdio de Dança</a>' +
    '<a' + classe('producao') + ' href="/bastidores/producao">Produção</a>' +
    '</div>' +
    '</details>' +
    '</div>' +
    '</nav>';
}

/** O cabeçalho comum das vistas dos Bastidores: a folha do ciclo (a MESMA do pacote,
 *  servida por este Worker) e, DEPOIS dela, o `<style>` da vista — que manda. */
function cabecalhoDaVista(titulo) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(titulo) + '</title>' +
    '<link rel="stylesheet" href="/assets/style.css">';
}

/** O fim comum: o script da navegação, que mede a barra e abre o hamburger. */
function fimDaVista() {
  return '<script src="/assets/nav.js"></script></body></html>';
}

function paginaEstudio(escola, contexto) {
  return cabecalhoDaVista('Bastidores · Estúdio de Dança · ' + escola) +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:var(--tinta);background:var(--cream);margin:0;}' +
    '.vista{max-width:44rem;margin:0 auto;padding:1.6rem 1.25rem;}' +
    '.vista h1{color:var(--burgundy);}' +
    '.vista p{color:var(--soft);}' +
    '.vista a{color:var(--burgundy);font-weight:700;}' +
    '</style></head><body>' +
    topnav(contexto, 'estudio') +
    '<div class="vista">' +
    '<h1>Estúdio de Dança</h1>' +
    '<p>Esta é a cena — a vista que a direção e o professor partilham. O que a cena produz sobe para cá.</p>' +
    '<p><a href="' + urlDaPorta('/anamnese/', contexto) + '">Abrir a Área do Professor</a> (anamnese, plano de ensino e plano de observação).</p>' +
    '</div>' +
    fimDaVista();
}

function paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs) {
  // O professor criado pela página `danca` vive como SEGREDO (PROFESSOR_NOME, com o nome
  // ajustável no KV) e é o «dono» da escola; os professores ADICIONAIS cadastrados aqui
  // vivem no KV. O dono entra primeiro e recebe «Editar» (não «Excluir»): ele é o contato
  // da escola, e o segredo do Worker é outra fronteira. A lista não duplica.
  const donoNome = String(dono || '').trim();
  const linhasProfs = [];
  if (donoNome) {
    // A linha do DONO é a única que mostra o slug: ele é o identificador que a página
    // `danca` gravou no segredo e que o dono não pode perder de vista. Nas linhas dos
    // outros professores o slug é ruído — quem identifica a pasta é o sistema, não a
    // direção lendo uma lista (era o que a lista mostrava, e não precisava).
    linhasProfs.push('<li>' +
      '<span class="nome">' + esc(donoNome) + ' <span class="dono">(dono — criado na página)</span></span>' +
      ' <code class="slug">' + esc(donoSlug) + '</code>' +
      ' <span class="acoes"><button class="editar" data-tipo="dono" data-alvo="' + esc(donoNome) + '" title="Editar o nome do dono">Editar</button></span>' +
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
    // Só o nome e o botão (o slug saiu da lista: ver a linha do dono, acima).
    linhasProfs.push('<li><span class="nome">' + esc(p.nome) + '</span>' +
      ' <span class="acoes"><button class="apagar" data-tipo="professor" data-alvo="' + esc(p.nome) + '" title="Excluir professor">Excluir</button></span></li>');
  }
  const itensProfs = linhasProfs.length
    ? linhasProfs.join('')
    : '<li class="vazia">(nenhum professor cadastrado)</li>';
  const itensAlunas = aluns.length
    ? aluns.map((a) => '<li><span class="nome">' + esc(a) + '</span>'
        + ' <span class="acoes"><button class="apagar" data-tipo="aluna" data-alvo="' + esc(a) + '" title="Excluir aluna">Excluir</button></span></li>').join('')
    : '<li class="vazia">(nenhuma aluna cadastrada)</li>';

  // --- TURMAS e VOCABULÁRIO (Bloco 3 do plano de ensino) --------------------
  const listaTurmas = (trms || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
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
          '<button class="editar-rubrica" data-rubrica="' + esc(r.id) + '" title="Abrir esta rubrica no formulário">Editar</button>' +
          '<button class="apagar" data-tipo="rubrica" data-alvo="' + esc(r.id) + '" title="Excluir rubrica">Excluir</button>' +
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
          '<span class="nome" style="flex:0 0 auto;font-size:.85rem">→ ' + origem + '</span></li>';
      }).join('')
    : '<li class="vazia">(nenhuma turma cadastrada)</li>';

  const itensTurmas = listaTurmas.length
    ? listaTurmas.map((t) => {
        const associados = Array.isArray(relObj[t.id]) ? relObj[t.id] : [];
        const chips = associados.map((tid) => {
          const o = termoPorId.get(tid);
          const nome = o ? o.termo : tid;
          return '<span class="chip">' + esc(nome) +
            ' <button class="desassociar" data-turma="' + esc(t.id) + '" data-termo="' + esc(nome) +
            '" title="Remover associação">×</button></span>';
        }).join(' ');
        // O ritmo declarado pela direção (frequência, dias, duração e período do termo):
        // é o que desce para o plano de ensino — por isso aparece no cadastro.
        const ritmo = [
          t.frequencia ? t.frequencia + 'x/semana' : '',
          (t.dias && t.dias.length) ? t.dias.join(', ') : '',
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
        const avisoDeRitmo = falta.length
          ? '<span class="selo falta-ritmo" title="sem isto a turma não pode ser atribuída na curadoria">falta ' +
            esc(fraseDaFalta(falta)) + '</span>'
          : '';
        const regua = rubricaDaTurma(t);
        return '<li class="turma" data-turma="' + esc(t.id) + '">' +
          '<div class="linha-turma"><span class="nome"><b>' + esc(t.nome) + '</b>' +
          (detalhe ? ' <span class="dono">' + esc(detalhe) + '</span>' : '') +
          (avisoDeRitmo ? ' ' + avisoDeRitmo : '') + '</span>' +
          '<span class="acoes"><button class="apagar" data-tipo="turma" data-alvo="' + esc(t.nome) + '" title="Excluir turma">Excluir</button></span></div>' +
          '<div class="dono">Régua da rubrica: ' + esc(regua.join(' · ')) + '</div>' +
          '<div class="assoc"><span class="dono">Conteúdos:</span> ' +
          (chips || '<span class="dono">(nenhum)</span>') +
          ' <select class="sel-termo"><option value="">— associar termo —</option>' + opcoesTermo + '</select>' +
          ' <button class="associar" data-turma="' + esc(t.id) + '">Associar</button></div>' +
          '</li>';
      }).join('')
    : '<li class="vazia">(nenhuma turma cadastrada)</li>';

  const itensTermos = listaTermos.length
    ? listaTermos.map((t) => '<li><span class="nome"><b>' + esc(t.termo) + '</b>' +
        (t.categoria ? ' <span class="dono">' + esc(t.categoria) + '</span>' : '') +
        (t.tradicao ? ' <span class="dono">' + esc(t.tradicao) + '</span>' : '') + '</span>' +
        '<span class="acoes"><button class="apagar" data-tipo="termo" data-alvo="' + esc(t.termo) + '" title="Excluir termo">Excluir</button></span></li>').join('')
    : '<li class="vazia">(nenhum termo cadastrado)</li>';

  // --- CURADORIA (Bloco 2 do pedido) ----------------------------------------
  const listaCuradorias = (curs || []).slice();
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
  // Os três grupos da curadoria — os três pelo MESMO componente. O repertório tem a lista
  // longa (84 termos), mas isso é problema do menu, não do desenho: a janela de um lookup do
  // navegador não se estiliza, e saía escura e apertada ao lado destes. Um componente só.
  const escolarTurmasCuradoria = escolhedor('esc-turmas', listaTurmas.map((t) => {
    // A turma sem ritmo não se atribui: o plano dela nasceria sem dose nem calendário. Ela
    // continua na lista — a direção precisa de a ver para saber o que corrigir —, mas
    // ANUNCIADA, com o que falta (16/10/2026).
    const falta = faltaNoRitmoDaTurma(t);
    return {
      valor: t.nome,
      rotulo: falta.length ? t.nome + ' — falta ' + fraseDaFalta(falta) + ' (não pode ser atribuída)' : t.nome,
    };
  }));
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

  const itensCuradorias = listaCuradorias.length
    ? listaCuradorias.map((c) => {
        const rotuloProfessor = (profsParaCuradoria.find((p) => p.valor === c.professor) || {}).rotulo || c.professor;
        const resumo = [
          c.tradicao,
          (c.turmas || []).length ? (c.turmas.length + ' turma(s)') : '',
          (c.repertorio || []).length ? (c.repertorio.length + ' passo(s)') : '',
          (c.alunas || []).length ? (c.alunas.length + ' aluna(s)') : '',
        ].filter(Boolean).join(' · ');
        return '<li><span class="nome"><b>' + esc(rotuloProfessor) + '</b> <span class="dono">· ' + esc(c.modalidade) + '</span>' +
          (resumo ? ' <span class="dono">— ' + esc(resumo) + '</span>' : '') + '</span>' +
          '<span class="acoes"><button class="apagar" data-tipo="curadoria" data-alvo="' + esc(c.id) + '" title="Remover curadoria">Excluir</button></span></li>';
      }).join('')
    : '<li class="vazia">(nenhuma curadoria atribuída)</li>';

  return cabecalhoDaVista('Bastidores · Produção · ' + escola) +
    '<style>' +
    // A IDENTIDADE É A MESMA DA RAIZ («criar nova escola») e do pacote do ciclo: as
    // variáveis vêm de `/assets/style.css` (a folha do ciclo, carregada acima), e o que
    // se escreve aqui só as usa. O amarelo próprio (`#fdf6e3`) que existia só neste
    // formulário SAI: era um terceiro tom, e não o fundo dos formulários do sistema.
    '.lateral{position:sticky;top:calc(var(--header-height) + 8px);border-right:1px solid var(--gold-borda);padding-right:.9rem;}' +
    '.lateral h2{font-size:.8rem;letter-spacing:.05em;text-transform:uppercase;color:var(--gold-texto);margin:1rem 0 .2rem;}' +
    '.lateral h2:first-child{margin-top:0;}' +
    '.lateral a{display:block;color:var(--burgundy);text-decoration:none;padding:.25rem .5rem;border-radius:4px;font-size:.95rem;}' +
    '.lateral a:hover{background:var(--creme-3);}' +
    '.lateral a.ativo{background:var(--creme-2);font-weight:700;}' +
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
    '.corpo{display:grid;grid-template-columns:11rem minmax(0,1fr);gap:1.4rem;align-items:start;padding:1.4rem 14px 2.6rem;}' +
    '.secao{display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
    '.secao>h2{grid-column:1/-1;margin:0;}' +
    // AS ABAS da secção Turmas. O painel de cada aba repete a grade do formulário + lista, e
    // por isso ocupa a linha inteira do `.secao` — a lista continua presa e paginada.
    '.abas{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.15rem;border-bottom:1px solid var(--gold-borda);margin:.1rem 0 .2rem;}' +
    '.aba{background:transparent;border:none;border-bottom:3px solid transparent;border-radius:0;margin:0;padding:.5rem .9rem;color:var(--gold-texto);font:600 .95rem/1.3 system-ui,sans-serif;cursor:pointer;}' +
    '.aba:hover{background:var(--creme-3);}' +
    '.aba.ativo{color:var(--burgundy);border-bottom-color:var(--burgundy);}' +
    '.aba:focus-visible{outline:2px solid var(--gold);outline-offset:-2px;}' +
    '.aba-painel{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,34rem) minmax(24rem,1fr);gap:1.8rem;align-items:start;}' +
    // A COLUNA DA LISTA: começa no topo e vai até o fim do que se vê, sem rolar a página.
    // Quem rola é a lista, por dentro, e a paginação existe para que nem isso precise.
    '.col-lista{display:flex;flex-direction:column;position:sticky;top:calc(var(--header-height) + 8px);' +
    'max-height:calc(100vh - var(--header-height) - 2.2rem);border:1px solid var(--gold-borda);' +
    'background:var(--branco);border-radius:8px;padding:.9rem 1rem .6rem;}' +
    '.col-lista h3{margin:0 0 .5rem;}' +
    '.col-lista .rolagem{overflow-y:auto;min-height:0;flex:1 1 auto;}' +
    '.lista{list-style:none;margin:0;padding:0;}' +
    '.lista li{display:flex;align-items:center;gap:.5rem;padding:.35rem .1rem;margin:0;border-bottom:1px dotted var(--gold-borda);color:var(--tinta);}' +
    '.lista li .nome{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;}' +
    '.lista li .acoes{flex:0 0 auto;display:flex;align-items:center;gap:.35rem;}' +
    '.lista li.vazia{color:var(--soft);font-size:.9rem;}' +
    '.paginacao{display:flex;align-items:center;justify-content:flex-end;gap:.5rem;padding:.5rem 0 .1rem;font-size:.85rem;color:var(--soft);}' +
    '.paginacao button{margin:0;padding:.15rem .6rem;background:var(--branco);color:var(--burgundy);border:1px solid var(--gold-borda);border-radius:4px;font:600 .9rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    '.paginacao button:disabled{opacity:.35;cursor:not-allowed;}' +
    // O FORMULÁRIO: o mesmo papel branco do «criar nova escola», e os campos no creme.
    'form{border:1px solid var(--gold-borda);background:var(--branco);border-radius:8px;padding:1rem 1.1rem;margin:0 0 1rem;}' +
    'form label{display:block;margin:.7rem 0 .2rem;font-size:.9rem;color:var(--burgundy);}' +
    'form input,form select{width:100%;box-sizing:border-box;padding:.45rem .6rem;font:1rem/1.4 system-ui,sans-serif;color:var(--tinta);background:var(--cream);border:1px solid var(--gold-borda);border-radius:5px;}' +
    'form input:focus,form select:focus{outline:2px solid var(--gold);outline-offset:1px;border-color:var(--gold-escuro);}' +
    'button{display:inline-block;margin-top:.9rem;padding:.6rem 1.1rem;background:var(--burgundy);color:var(--branco);border:none;border-radius:6px;font:600 .95rem/1.2 system-ui,sans-serif;cursor:pointer;}' +
    '.res{margin-top:1rem;padding:.7rem .9rem;border-radius:6px;display:none;}' +
    '.res.ok{display:block;background:#eef7ee;border:1px solid #4f8a4f;color:#2f5d2f;}' +
    '.res.erro{display:block;background:#fdeaea;border:1px solid #b25555;color:#7a2f2f;}' +
    '.dono{color:var(--soft);font-size:.85rem;}' +
    'ul li .slug{color:var(--soft);font-size:.8rem;background:var(--creme-2);border-radius:4px;padding:0 .3em;}' +
    'label .dica{color:var(--soft);font-weight:400;font-size:.85rem;}' +
    '.sub{color:var(--soft);font-size:.88rem;line-height:1.45;margin:.1rem 0 .6rem;}' +
    'form .nota{color:var(--soft);font-size:.88rem;line-height:1.45;margin:.6rem 0 0;}' +
    'button.apagar{margin:0;padding:.15rem .55rem;background:#b25555;color:var(--branco);' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    'button.apagar:hover{background:#8f3f3f;}' +
    'button.editar{margin:0;padding:.15rem .55rem;background:var(--burgundy);color:var(--branco);' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    'li.turma{display:block;margin-bottom:.6rem;}' +
    '.linha-turma{display:flex;align-items:center;gap:.5rem;}' +
    '.linha-turma .nome{flex:1 1 auto;min-width:0;}' +
    '.assoc{margin:.3rem 0 .1rem;font-size:.9rem;color:var(--soft);}' +
    '.chip{display:inline-block;margin:.1rem .3rem .1rem 0;padding:.1rem .4rem;background:var(--creme-2);border-radius:4px;font-size:.82rem;color:var(--tinta);}' +
    // O AVISO DO RITMO EM FALTA: a turma que ainda não pode receber um plano. É um selo
    // âmbar, não um erro — é uma pendência da direção, não um defeito do sistema.
    '.selo{display:inline-block;padding:.05rem .45rem;border-radius:999px;font-size:.78rem;border:1px solid var(--gold-borda,#d9c98f);}' +
    '.falta-ritmo{background:#fdf3d8;color:#7a5a12;border-color:#e0c98a;}' +
    '.chip button{display:inline-block;margin:0 0 0 .3rem;padding:0 .3rem;background:transparent;color:#8f3f3f;border:none;font-weight:700;cursor:pointer;}' +
    'select.sel-termo{max-width:16rem;padding:.25rem .4rem;font:0.9rem/1.4 system-ui,sans-serif;border:1px solid var(--gold-borda);border-radius:4px;background:var(--cream);}' +
    'button.associar{margin:0;padding:.2rem .55rem;background:var(--burgundy);color:var(--branco);border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    // AS ESCOLHAS EM LINHA (os dias da semana): o professor clica no que quer. Nada de caixa
    // marcável dentro de uma caixa com rolagem. Vale para lista CURTA e FIXA — para as
    // longas, o escolhedor abaixo.
    '.escolhas{display:flex;flex-wrap:wrap;gap:.35rem;margin:.3rem 0 .7rem;}' +
    '.escolha{display:inline-flex;align-items:center;margin:0;cursor:pointer;}' +
    '.escolha input{position:absolute;width:1px;height:1px;opacity:0;}' +
    '.escolha span{display:inline-block;padding:.28rem .7rem;border:1px solid var(--gold-borda);border-radius:999px;background:var(--branco);font-size:.87rem;color:var(--gold-texto);line-height:1.35;}' +
    '.escolha input:checked+span{background:var(--burgundy);border-color:var(--burgundy);color:var(--gold-claro);font-weight:600;}' +
    '.escolha input:focus-visible+span{outline:2px solid var(--gold);outline-offset:1px;}' +
    // O ESCOLHEDOR: escolhe no menu, «Adicionar», e o escolhido vira ficha com o «×».
    '.escolhedor{margin:.3rem 0 .8rem;}' +
    '.escolhedor .fichas{display:flex;flex-wrap:wrap;gap:.35rem;min-height:1.9rem;margin:0 0 .35rem;}' +
    '.escolhedor .fichas .vazio{color:var(--soft);font-size:.85rem;line-height:1.9rem;}' +
    '.ficha{display:inline-flex;align-items:center;gap:.15rem;padding:.15rem .2rem .15rem .65rem;border:1px solid var(--burgundy);background:var(--creme-2);border-radius:999px;font-size:.86rem;color:var(--tinta);line-height:1.5;}' +
    '.ficha button{margin:0;padding:0 .35rem;background:transparent;border:none;color:var(--burgundy);font:700 .95rem/1 system-ui,sans-serif;cursor:pointer;}' +
    '.escolhedor .entrada{display:flex;gap:.4rem;align-items:center;}' +
    '.escolhedor .entrada select{flex:1 1 auto;width:auto;min-width:0;}' +
    '.escolhedor .entrada button{margin:0;padding:.45rem .85rem;font-size:.86rem;white-space:nowrap;}' +
    'button.editar-rubrica{margin:0;padding:.15rem .55rem;background:var(--burgundy);color:var(--branco);' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    '#rubr-limpar{margin:.9rem 0 0 .4rem;background:transparent;color:var(--burgundy);border:1px solid var(--gold-borda);border-radius:6px;}' +
    '#vinc-desvincular{margin:.9rem 0 0 .4rem;background:transparent;color:var(--burgundy);border:1px solid var(--gold-borda);border-radius:6px;}' +
    '.linha-regua{display:flex;gap:.4rem;align-items:center;margin:.25rem 0;}' +
    '.linha-regua input{flex:1 1 auto;min-width:0;}' +
    '.linha-regua button{margin:0;flex:0 0 auto;padding:.2rem .5rem;background:transparent;color:#8f3f3f;border:1px solid var(--gold-borda);border-radius:4px;cursor:pointer;}' +
    '[hidden]{display:none!important;}' +
    '#gate{border:1px solid var(--gold-borda);background:var(--branco);border-radius:8px;padding:1rem 1.1rem;max-width:24rem;}' +
    // Abaixo disto, a lista desce para o segundo lugar da grade (não some, e não encolhe
    // até ficar ilegível); abaixo do segundo corte, tudo numa coluna. O primeiro corte era
    // 1080px, e entre 1081 e ~1140 as duas colunas ficavam apertadas demais para o
    // formulário de 34rem — o corte subiu para onde as duas cabem de facto.
    '@media (max-width:1140px){.secao{grid-template-columns:minmax(0,1fr);}.col-lista{position:static;max-height:none;}}' +
    '@media (max-width:760px){.corpo{grid-template-columns:1fr;padding:1.2rem 16px 2rem;}.lateral{position:static;border-right:none;padding-right:0;border-bottom:1px solid var(--gold-borda);padding-bottom:.6rem;}}' +
    '</style></head><body>' +
    topnav(contexto, 'producao') +
    '<div class="corpo">' +
    '<nav class="lateral" aria-label="Seções da Produção">' +
    '<h2>Produção</h2>' +
    '<a href="#painel" data-secao="painel">Painel inicial</a>' +
    '<h2>Pessoas</h2>' +
    '<a href="#professores" data-secao="professores">Professores</a>' +
    '<a href="#alunas" data-secao="alunas">Alunas</a>' +
    '<h2>Pedagogia</h2>' +
    '<a href="#turmas" data-secao="turmas">Turmas</a>' +
    '<a href="#vocabulario" data-secao="vocabulario">Vocabulário técnico</a>' +
    '<a href="#curadorias" data-secao="curadorias">Curadorias</a>' +
    '</nav>' +
    '<div class="principal">' +
    '<h1>Produção</h1>' +
    '<p>O gabinete da direção — só a direção entra.</p>' +
    '<div id="gate">' +
    '<form id="form-senha">' +
    '<label for="dsenha">Senha da direção</label>' +
    '<input id="dsenha" type="password" autocomplete="current-password" autofocus>' +
    '<button type="submit">Entrar</button>' +
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
    '<label for="pnome">Nome do professor</label>' +
    '<input id="pnome" name="nome" autocomplete="off" placeholder="ex.: Tiago">' +
    '<label for="psobrenome">Sobrenome ou apelido <span class="dica">(só quando o nome já existe)</span></label>' +
    '<input id="psobrenome" name="sobrenome" autocomplete="off" placeholder="ex.: Menegaz">' +
    '<label for="psenha">Senha do professor</label>' +
    '<input id="psenha" name="senha" type="password" autocomplete="new-password">' +
    '<p class="nota">O nome do professor vira a <b>pasta</b> dele no sistema — é ela que identifica' +
    ' o PO, o plano e os cadernos das aulas. Se já existe um professor com este nome, informe o' +
    ' sobrenome ou um apelido: duas pessoas não podem dividir a mesma pasta.</p>' +
    '<button type="submit">Cadastrar professor</button>' +
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
    '<label for="anome">Apelido da aluna (estável, P-12)</label>' +
    '<input id="anome" name="apelido" autocomplete="off" placeholder="ex.: Vavá">' +
    '<button type="submit">Cadastrar aluna</button>' +
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
    '<label for="tnome">Nome da turma</label>' +
    '<input id="tnome" name="nome" autocomplete="off" placeholder="ex.: Balé Nível 1">' +
    '<label for="tordem">Posição na lista (1 = primeiro; vazio vai para o fim)</label>' +
    '<input id="tordem" name="ordem" autocomplete="off" placeholder="ex.: 1">' +
    '<label for="tprograma">Programa de referência (sugerido, não oficial)</label>' +
    '<input id="tprograma" name="programaReferencia" autocomplete="off" placeholder="ex.: RAD (referência sugerida)">' +
    // O NÍVEL é ESCOLHEDOR: escolhe no menu, «Adicionar», e o nível fica em ficha com o «×».
    // A lista são os níveis do catálogo MAIS os que alguma turma já declara — um nível que a
    // escola já usa não desaparece do formulário por não estar no catálogo. O que sai daqui
    // continua a ser UM texto («Grade 3, Grade 4»): o contrato do servidor e o do plano não
    // mudam.
    '<label>Equivalência pedagógica <span class="dica">(um ou mais níveis)</span></label>' +
    '<p class="sub">Uma turma mista pode ter dois níveis — escolha um, clique em «Adicionar», e repita.</p>' +
    escolhedor('esc-niveis', niveisOferecidos.map((n) => ({ valor: n }))) +
    '<label for="tdescricao">Notas sobre esta turma (opcional)</label>' +
    '<input id="tdescricao" name="descricao" autocomplete="off">' +
    '<label for="tfrequencia">Frequência semanal (aulas por semana)</label>' +
    '<input id="tfrequencia" name="frequencia" type="number" min="1" step="1" autocomplete="off" placeholder="ex.: 2">' +
    // OS DIAS DA SEMANA: sete pílulas numa linha. Era uma caixa com rolagem e sete
    // caixinhas dentro; não há motivo para uma escolha de sete itens morar atrás de uma
    // barra de rolagem dentro de um formulário.
    '<label>Dias da semana</label>' +
    '<div class="escolhas" id="tdias">' + DIAS_DA_SEMANA.map((d) => pilula('dia', d, esc(d))).join('') + '</div>' +
    '<label for="tduracao">Duração de cada aula (minutos)</label>' +
    '<input id="tduracao" name="duracaoMin" type="number" min="5" step="5" autocomplete="off" placeholder="ex.: 60">' +
    '<label for="tinicio">Início do período (termo)</label>' +
    '<input id="tinicio" name="periodoInicio" type="date" autocomplete="off">' +
    '<label for="tfim">Fim do período (termo)</label>' +
    '<input id="tfim" name="periodoFim" type="date" autocomplete="off">' +
    '<p class="nota">A <b>régua da rubrica</b> não se declara aqui: ela é da escola, e vive nas abas <b>Criar rubrica</b> e <b>Vincular turma à rubrica</b>. Uma turma sem rubrica ligada é medida pela régua padrão.</p>' +
    '<button type="submit">Cadastrar turma</button>' +
    '</form>' +
    '</div>' +
    '<div class="col-lista" data-paginar data-por-pagina="7">' +
    '<h3>Turmas cadastradas</h3>' +
    '<div class="rolagem"><ul class="lista">' + itensTurmas + '</ul></div>' +
    rodapePaginacao() +
    '</div>' +
    '</div>' +
    // ABA 2 — CRIAR RUBRICA. A régua ganha NOME: é o que a torna vinculável a mais de uma
    // turma, e o que impede que a mesma decisão seja redigitada em cada cadastro.
    '<div class="aba-painel" id="aba-rubrica" hidden>' +
    '<div class="col-form">' +
    '<form id="form-rubrica">' +
    '<input type="hidden" id="rubr-id">' +
    '<label for="rubr-nome">Nome da rubrica</label>' +
    '<input id="rubr-nome" autocomplete="off" placeholder="ex.: Régua do Nível 1">' +
    '<label>Níveis <span class="dica">(a ordem é a das colunas da tabela)</span></label>' +
    '<p class="sub">Já vem com os quatro níveis padrão. Renomeie, acrescente ou remova — a régua é da escola, e vale para todas as turmas que a usarem.</p>' +
    '<div id="rubr-niveis">' + NIVEIS_DA_RUBRICA.map((n) => linhaDaRegua(n)).join('') + '</div>' +
    '<p><button type="button" id="rubr-add">Acrescentar nível</button></p>' +
    '<button type="submit">Salvar rubrica</button>' +
    '<button type="button" id="rubr-limpar">Limpar formulário</button>' +
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
    '<label for="vinc-turma">Turma</label>' +
    '<select id="vinc-turma">' +
    (listaTurmas.length
      ? listaTurmas.map((t) => '<option value="' + esc(t.id) + '">' + esc(t.nome) + '</option>').join('')
      : '<option value="">— nenhuma turma cadastrada —</option>') +
    '</select>' +
    '<label for="vinc-rubrica">Rubrica</label>' +
    '<select id="vinc-rubrica">' +
    (listaRubricas.length
      ? listaRubricas.map((r) => '<option value="' + esc(r.id) + '">' + esc(r.nome) + '</option>').join('')
      : '<option value="">— nenhuma rubrica criada —</option>') +
    '</select>' +
    '<p class="sub">Uma rubrica pode valer para várias turmas: mudar os níveis dela muda as ' +
    'turmas que a usam, no mesmo ato — é uma régua só, não uma cópia por turma.</p>' +
    '<button type="submit">Vincular</button>' +
    '<button type="button" id="vinc-desvincular">Desvincular (volta à régua padrão)</button>' +
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
    '<label for="vtermo">Termo principal (grafia francesa, com acentos)</label>' +
    '<input id="vtermo" name="termo" autocomplete="off" placeholder="ex.: Plié">' +
    '<label for="vcategoria">Categoria</label>' +
    '<input id="vcategoria" name="categoria" autocomplete="off" placeholder="passo · posicao · direcao · ligacao · salto · giro">' +
    '<label for="vtradicao">Tradição de referência</label>' +
    '<input id="vtradicao" name="tradicao" autocomplete="off" placeholder="compartilhada · RAD · francesa · Vaganova">' +
    '<button type="submit">Cadastrar termo</button>' +
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
    '<p class="sub">O que a escola atribui a cada professor — a modalidade, a tradição, a turma, o repertório e as alunas. É isto que pré-carrega a anamnese, o plano e o PO.</p>' +
    '<form id="form-curadoria">' +
    '<label for="cuprofessor">Professor</label>' +
    '<select id="cuprofessor">' + opcoesProfessorCuradoria + '</select>' +
    '<label for="cumodalidade">Modalidade</label>' +
    '<select id="cumodalidade">' + opcoesModalidadeCuradoria + '</select>' +
    '<label for="cutradicao">Tradição</label>' +
    '<select id="cutradicao"><option value="">— nenhuma —</option>' + opcoesTradicaoCuradoria + '</select>' +
    '<label>Turmas</label>' +
    escolarTurmasCuradoria +
    '<label>Alunas</label>' +
    escolarAlunasCuradoria +
    // O REPERTÓRIO é o grupo grande (o vocabulário tem 84 termos). Era um tapete de 84
    // pílulas — o formulário ficava poluído. Agora é o MESMO escolhedor das turmas e das
    // alunas: o menu tem as 84 entradas com a categoria no rótulo, e escrever salta para o
    // termo (busca por digitação do próprio navegador).
    '<label>Repertório (passos da turma)</label>' +
    escolarRepertorioCuradoria +
    '<button type="submit">Atribuir curadoria</button>' +
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
    '  var passos = b.className === "pag-prox" ? 1 : -1;' +
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
    '    links[j].className = (links[j].getAttribute("data-secao") === visivel) ? "ativo" : "";' +
    '  }' +
    '}' +
    'window.addEventListener("hashchange", mostrarSecao);' +
    'mostrarSecao();' +
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
    // AS FICHAS de um escolhedor — o que foi escolhido, na ordem em que se escolheu.
    'function fichasDe(id) {' +
    '  var el = document.getElementById(id);' +
    '  if (!el || !el.querySelectorAll) return [];' +
    '  return Array.prototype.slice.call(el.querySelectorAll(".ficha")).map(function(f){ return f.getAttribute("data-valor"); });' +
    '}' +
    'function mostrarVazio(el) {' +
    '  var vazio = el.querySelector(".fichas .vazio");' +
    '  if (!vazio) return;' +
    '  vazio.hidden = !!el.querySelector(".ficha");' +
    '}' +
    'function adicionarFicha(el, valor) {' +
    '  valor = String(valor || "").trim();' +
    '  if (!valor) return false;' +
    '  if (fichasDe(el.id).indexOf(valor) !== -1) return false;' +
    '  var f = document.createElement("span");' +
    '  f.className = "ficha";' +
    '  f.setAttribute("data-valor", valor);' +
    '  f.textContent = valor;' +
    '  var b = document.createElement("button");' +
    '  b.type = "button"; b.className = "tirar"; b.title = "Tirar " + valor; b.textContent = "×";' +
    '  f.appendChild(b);' +
    '  el.querySelector(".fichas").appendChild(f);' +
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
    '    var ficha = t.closest(".ficha");' +
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
    '  enviar("/api/bastidores/turma", {' +
    '    nome: document.getElementById("tnome").value,' +
    '    ordem: document.getElementById("tordem").value,' +
    '    programaReferencia: document.getElementById("tprograma").value,' +
    '    nivelReferencia: fichasDe("esc-niveis").join(", "),' +
    '    descricao: document.getElementById("tdescricao").value,' +
    '    frequencia: document.getElementById("tfrequencia").value,' +
    '    dias: marcados("dia"),' +
    '    duracaoMin: document.getElementById("tduracao").value,' +
    '    periodoInicio: document.getElementById("tinicio").value,' +
    '    periodoFim: document.getElementById("tfim").value' +
    // A régua SAIU daqui: a turma nasce sem ela, e a régua entra pelo vínculo (aba
    // «Vincular turma à rubrica»). Sem rubrica ligada, a leitura aplica a padrão.
    '  }, "cadastrando turma...", true);' +
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
    'var NIVEIS_PADRAO = ' + JSON.stringify(NIVEIS_DA_RUBRICA) + ';' +
    'function linhaDaReguaNoDom(valor) {' +
    '  var s = document.createElement("span");' +
    '  s.className = "linha-regua";' +
    '  var i = document.createElement("input");' +
    '  i.name = "rubrica"; i.autocomplete = "off"; i.placeholder = "ex.: Satisfatório";' +
    '  i.value = valor == null ? "" : String(valor);' +
    '  var b = document.createElement("button");' +
    '  b.type = "button"; b.className = "tirar-regua"; b.title = "Remover este nível";' +
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
    '  enviar("/api/bastidores/curadoria", {' +
    '    professor: document.getElementById("cuprofessor").value,' +
    '    modalidade: document.getElementById("cumodalidade").value,' +
    '    tradicao: document.getElementById("cutradicao").value,' +
    '    turmas: fichasDe("esc-turmas"),' +
    '    repertorio: fichasDe("esc-repertorio"),' +
    '    alunas: fichasDe("esc-alunas")' +
    '  }, "atribuindo curadoria...", true);' +
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
    '  if (!confirm("Excluir " + alvo + "?")) return;' +
    '  var corpo = tipo === "aluna" ? {apelido: alvo}' +
    '    : ((tipo === "curadoria" || tipo === "rubrica") ? {id: alvo} : {nome: alvo});' +
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
    return html(paginaProducao(escola, contexto, profs, aluns, dono, donoSlug, trms, trmos, rel, curs, rbs));
  }

  // GET /api/bastidores/alunas — a lista para o seletor da anamnese.
  if (path === '/api/bastidores/alunas') {
    return json(200, { ok: true, escola, alunas: await alunas(kv, escola) });
  }

  // GET /api/bastidores/professores — o seletor dos formulários. Devolve `{nome, slug}`:
  // o NOME de exibição (o rótulo) e o SLUG (o valor que entra no cofre/path). O dono vem
  // primeiro; o slug dele é derivado do SECRET (não da sobreposição editável), para o
  // caminho `professores/<slug>/…` continuar apontando para a pasta — ajustar o nome do
  // dono não muda a pasta. A senha nunca sai.
  if (path === '/api/bastidores/professores') {
    const profs = await professores(kv, escola);
    const dono = await nomeDoDono(env, kv, escola);
    const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
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
  if (path === '/api/bastidores/turmas') {
    const lista = await turmas(kv, escola);
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
    if (lista.some((t) => t && t.id === nova.id)) return json(409, { ok: false, erro: 'já existe uma turma com este nome' });
    lista.push(nova);
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    return json(201, { ok: true, turma: nova.nome });
  }

  // DELETE /api/bastidores/turma — excluir turma (e limpar a relação).
  if (path === '/api/bastidores/turma' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const id = idDe(String(corpo.nome || corpo.id || '').trim());
    if (!id) return json(400, { ok: false, erro: 'informe a turma' });
    const lista = await turmas(kv, escola);
    const idx = lista.findIndex((t) => t && t.id === id);
    if (idx === -1) return json(404, { ok: false, erro: 'turma não encontrada' });
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/turmas', JSON.stringify(lista));
    const rel = await relacoes(kv, escola);
    if (rel[id]) { delete rel[id]; await kv.put(RAIZ + '/' + escola + '/turma-conteudos', JSON.stringify(rel)); }
    return json(200, { ok: true, turma: id, removida: true });
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
    const id = idDe(String(corpo.turma || corpo.id || '').trim());
    if (!id) return json(400, { ok: false, erro: 'informe a turma' });
    const lista = await turmas(kv, escola);
    const turma = lista.find((t) => t && t.id === id);
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
    return json(200, { ok: true, escola, curadorias: await curadorias(kv, escola) });
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
    const todas = await curadorias(kv, escola);
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
    const turmasPedidas = Array.isArray(corpo.turmas) ? corpo.turmas.map((x) => String(x).trim()).filter(Boolean) : [];
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
    const id = idCuradoria(professor, modalidade);
    const nova = {
      id,
      professor: slugificar(professor),
      modalidade,
      tradicao: String(corpo.tradicao || '').trim(),
      turmas: turmasPedidas,
      repertorio: Array.isArray(corpo.repertorio) ? corpo.repertorio.map((x) => String(x).trim()).filter(Boolean) : [],
      alunas: Array.isArray(corpo.alunas) ? corpo.alunas.map((x) => String(x).trim()).filter(Boolean) : [],
    };
    const lista = await curadorias(kv, escola);
    const idx = lista.findIndex((c) => c && c.id === id);
    if (idx === -1) lista.push(nova);
    else lista[idx] = nova;
    await kv.put(RAIZ + '/' + escola + '/curadorias', JSON.stringify(lista));
    return json(201, { ok: true, curadoria: nova });
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
  // As duas peças do RITMO da turma, exportadas para a prova: o que falta numa turma para
  // ela poder receber um plano, e a frase que diz isso em português (16/10/2026).
  faltaNoRitmoDaTurma,
  fraseDaFalta,
};
