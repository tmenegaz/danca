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

function json(status, corpo) {
  return new Response(JSON.stringify(corpo, null, 2) + '\n', {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

function html(corpo) {
  return new Response(corpo, { status: 200, headers: { 'Content-Type': 'text/html;charset=utf-8' } });
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

/** Monta o objeto-turma canónico a partir do que a Produção envia. */
function normalizarTurma(corpo) {
  const nome = String(corpo.nome || '').trim();
  const ordem = Number.isFinite(Number(corpo.ordem)) ? Number(corpo.ordem) : null;
  return {
    id: idDe(nome),
    nome: nome,
    ordem: ordem,
    programaReferencia: String(corpo.programaReferencia || '').trim(),
    nivelReferencia: String(corpo.nivelReferencia || '').trim(),
    descricao: String(corpo.descricao || '').trim(),
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

function paginaHub(escola) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · ' + esc(escola) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:44rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo h1{color:#6b2f2f;}' +
    '.corpo p{color:#6b5b4a;}' +
    '.itens{display:flex;flex-direction:column;gap:1rem;margin-top:1.4rem;}' +
    '.item{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem 1.1rem;text-decoration:none;}' +
    '.item h2{margin:0 0 .3rem;color:#6b2f2f;font-size:1.15rem;}' +
    '.item p{margin:0;color:#6b5b4a;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/">← Nós, Por Exemplo</a><span>Bastidores</span></div>' +
    '<div class="corpo">' +
    '<h1>Bastidores</h1>' +
    '<p>O ambiente da direção da escola: a cena e o gabinete, separados.</p>' +
    '<div class="itens">' +
    '<a class="item" href="/bastidores/estudio"><h2>Estúdio de Dança</h2>' +
    '<p>A cena — o que o professor e a direção partilham.</p></a>' +
    '<a class="item" href="/bastidores/producao"><h2>Produção</h2>' +
    '<p>O gabinete — só da direção, com senha própria.</p></a>' +
    '</div></div></body></html>';
}

function paginaEstudio(escola) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · Estúdio de Dança · ' + esc(escola) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:44rem;margin:0 auto;padding:1.5rem 1.25rem;}' +
    '.corpo h1{color:#6b2f2f;}' +
    '.corpo p{color:#6b5b4a;}' +
    '.corpo a{color:#6b2f2f;font-weight:700;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/bastidores">← Bastidores</a><span>Estúdio de Dança</span></div>' +
    '<div class="corpo">' +
    '<h1>Estúdio de Dança</h1>' +
    '<p>Esta é a cena — a vista que a direção e o professor partilham. O que a cena produz sobe para cá.</p>' +
    '<p><a href="/anamnese/">Abrir a Área do Professor</a> (anamnese, plano de ensino e plano de observação).</p>' +
    '</div></body></html>';
}

function paginaProducao(escola, profs, aluns, dono, trms, trmos, rel, curs) {
  // O professor criado pela página `danca` vive como SEGREDO (PROFESSOR_NOME, com o nome
  // ajustável no KV) e é o «dono» da escola; os professores ADICIONAIS cadastrados aqui
  // vivem no KV. O dono entra primeiro e recebe «Editar» (não «Excluir»): ele é o contato
  // da escola, e o segredo do Worker é outra fronteira. A lista não duplica.
  const donoNome = String(dono || '').trim();
  const linhasProfs = [];
  if (donoNome) {
    linhasProfs.push('<li>' + esc(donoNome) + ' <span class="dono">(dono — criado na página)</span>'
      + ' <button class="editar" data-tipo="dono" data-alvo="' + esc(donoNome) + '" title="Editar o nome do dono">Editar</button></li>');
  }
  for (const p of profs) {
    if (!p || !p.nome) continue;
    if (p.nome === donoNome) continue; // o dono já entrou, sem duplicar
    linhasProfs.push('<li>' + esc(p.nome)
      + ' <button class="apagar" data-tipo="professor" data-alvo="' + esc(p.nome) + '" title="Excluir professor">Excluir</button></li>');
  }
  const itensProfs = linhasProfs.length
    ? linhasProfs.join('')
    : '<li>(nenhum professor cadastrado)</li>';
  const itensAlunas = aluns.length
    ? aluns.map((a) => '<li>' + esc(a)
        + ' <button class="apagar" data-tipo="aluna" data-alvo="' + esc(a) + '" title="Excluir aluna">Excluir</button></li>').join('')
    : '<li>(nenhuma aluna cadastrada)</li>';

  // --- TURMAS e VOCABULÁRIO (Bloco 3 do plano de ensino) --------------------
  const listaTurmas = (trms || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const listaTermos = (trmos || []).slice().sort((a, b) => String(a.termo).localeCompare(String(b.termo)));
  const termoPorId = new Map(listaTermos.map((t) => [t.id, t]));
  const relObj = rel || {};

  // As opções do <select> de associação (uma por termo).
  const opcoesTermo = listaTermos.map((t) =>
    '<option value="' + esc(t.termo) + '">' + esc(t.termo) +
    (t.categoria ? ' — ' + esc(t.categoria) : '') + '</option>').join('');

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
        const detalhe = (t.nivelReferencia ? t.nivelReferencia : '') +
          (t.programaReferencia ? (t.nivelReferencia ? ' · ' : '') + t.programaReferencia : '');
        return '<li class="turma" data-turma="' + esc(t.id) + '">' +
          '<div><b>' + esc(t.nome) + '</b>' +
          (detalhe ? ' <span class="dono">' + esc(detalhe) + '</span>' : '') +
          ' <button class="apagar" data-tipo="turma" data-alvo="' + esc(t.nome) + '" title="Excluir turma">Excluir</button></div>' +
          '<div class="assoc"><span class="dono">Conteúdos:</span> ' +
          (chips || '<span class="dono">(nenhum)</span>') +
          ' <select class="sel-termo"><option value="">— associar termo —</option>' + opcoesTermo + '</select>' +
          ' <button class="associar" data-turma="' + esc(t.id) + '">Associar</button></div>' +
          '</li>';
      }).join('')
    : '<li>(nenhuma turma cadastrada)</li>';

  const itensTermos = listaTermos.length
    ? listaTermos.map((t) => '<li><b>' + esc(t.termo) + '</b>' +
        (t.categoria ? ' <span class="dono">' + esc(t.categoria) + '</span>' : '') +
        (t.tradicao ? ' <span class="dono">' + esc(t.tradicao) + '</span>' : '') +
        ' <button class="apagar" data-tipo="termo" data-alvo="' + esc(t.termo) + '" title="Excluir termo">Excluir</button></li>').join('')
    : '<li>(nenhum termo cadastrado)</li>';

  // --- CURADORIA (Bloco 2 do pedido) ----------------------------------------
  const listaCuradorias = (curs || []).slice();
  const donoSlug = slugificar(String((env && env.PROFESSOR_NOME) || ''));
  const profsParaCuradoria = [];
  if (donoNome) profsParaCuradoria.push({ valor: donoSlug, rotulo: donoNome });
  for (const p of profs) {
    if (!p || !p.nome || p.nome === donoNome) continue;
    profsParaCuradoria.push({ valor: slugificar(p.nome), rotulo: p.nome });
  }
  const opcoesProfessorCuradoria = profsParaCuradoria.length
    ? profsParaCuradoria.map((p) => '<option value="' + esc(p.valor) + '">' + esc(p.rotulo) + '</option>').join('')
    : '<option value="">— nenhum professor —</option>';
  const opcoesModalidadeCuradoria = (MODALIDADES.modalidades || []).map((m) =>
    '<option value="' + esc(m.nome) + '">' + esc(m.nome) +
    (m.temConteudo ? '' : ' (sem conteúdo ainda)') + '</option>').join('');
  const opcoesTradicaoCuradoria = tradicoesAdotaveis().map((t) =>
    '<option value="' + esc(t) + '">' + esc(t) + '</option>').join('');
  const caixasTurmasCuradoria = listaTurmas.map((t) =>
    '<label class="cb"><input type="checkbox" name="curadoria-turma" value="' + esc(t.nome) + '"> ' + esc(t.nome) + '</label>').join('');
  const caixasAlunasCuradoria = aluns.map((a) =>
    '<label class="cb"><input type="checkbox" name="curadoria-aluna" value="' + esc(a) + '"> ' + esc(a) + '</label>').join('');
  const caixasRepertorioCuradoria = listaTermos.map((t) =>
    '<label class="cb"><input type="checkbox" name="curadoria-repertorio" value="' + esc(t.termo) + '"> ' + esc(t.termo) +
    ' <span class="dono">' + esc(t.categoria || '') + '</span></label>').join('');

  const itensCuradorias = listaCuradorias.length
    ? listaCuradorias.map((c) => {
        const rotuloProfessor = (profsParaCuradoria.find((p) => p.valor === c.professor) || {}).rotulo || c.professor;
        const resumo = [
          c.tradicao,
          (c.turmas || []).length ? (c.turmas.length + ' turma(s)') : '',
          (c.repertorio || []).length ? (c.repertorio.length + ' passo(s)') : '',
          (c.alunas || []).length ? (c.alunas.length + ' aluna(s)') : '',
        ].filter(Boolean).join(' · ');
        return '<li><b>' + esc(rotuloProfessor) + '</b> <span class="dono">· ' + esc(c.modalidade) + '</span>' +
          (resumo ? ' <span class="dono">— ' + esc(resumo) + '</span>' : '') +
          ' <button class="apagar" data-tipo="curadoria" data-alvo="' + esc(c.id) + '" title="Remover curadoria">Excluir</button></li>';
      }).join('')
    : '<li>(nenhuma curadoria atribuída)</li>';

  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>Bastidores · Produção · ' + esc(escola) + '</title>' +
    '<style>' +
    'body{font:16px/1.6 Georgia,serif;color:#3a2b1f;background:#faf6ee;margin:0;}' +
    '.topo{border-bottom:1px solid #c9a24b;padding:.9rem 1.25rem;background:#fdfaf2;}' +
    '.topo a{color:#6b2f2f;font-weight:700;text-decoration:none;margin-right:1.2rem;}' +
    '.corpo{max-width:64rem;margin:0 auto;padding:1.5rem 1.25rem;display:grid;grid-template-columns:13rem 1fr;gap:1.5rem;align-items:start;}' +
    '.corpo h1{color:#6b2f2f;margin-top:0;}' +
    '.corpo h2{color:#6b2f2f;margin-top:1.6rem;}' +
    '.corpo p{color:#6b5b4a;}' +
    '.lateral{position:sticky;top:1rem;border-right:1px solid #c9a24b;padding-right:1rem;}' +
    '.lateral h2{font-size:.82rem;letter-spacing:.05em;text-transform:uppercase;color:#8a7a5a;margin:1rem 0 .2rem;}' +
    '.lateral h2:first-child{margin-top:0;}' +
    '.lateral a{display:block;color:#6b2f2f;text-decoration:none;padding:.25rem .4rem;border-radius:4px;font-size:.95rem;}' +
    '.lateral a:hover{background:#fdf6e3;}' +
    '.lateral a.ativo{background:#efe4c8;font-weight:700;}' +
    '.principal{min-width:0;}' +
    '@media (max-width:760px){.corpo{grid-template-columns:1fr;}.lateral{position:static;border-right:none;padding-right:0;}}' +
    'form{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem;margin:1rem 0;}' +
    'form label{display:block;margin:.5rem 0 .2rem;font-size:.9rem;color:#6b2f2f;}' +
    'form input{width:100%;box-sizing:border-box;padding:.45rem .6rem;font:1rem/1.4 system-ui,sans-serif;border:1px solid #c9a24b;border-radius:4px;}' +
    'button{display:inline-block;margin-top:.9rem;padding:.6rem 1.1rem;background:#6b2f2f;color:#fff;border:none;border-radius:6px;font:600 .95rem/1.2 system-ui,sans-serif;cursor:pointer;}' +
    '.res{margin-top:1rem;padding:.7rem .9rem;border-radius:6px;display:none;}' +
    '.res.ok{display:block;background:#eef7ee;border:1px solid #4f8a4f;color:#2f5d2f;}' +
    '.res.erro{display:block;background:#fdeaea;border:1px solid #b25555;color:#7a2f2f;}' +
    'ul{list-style:none;padding:0;}' +
    'ul li{padding:.3rem 0;border-bottom:1px dotted #c9a24b;color:#3a2b1f;}' +
    'ul li .dono{color:#8a7a5a;font-size:.85rem;}' +
    'button.apagar{margin-left:.7rem;padding:.15rem .55rem;background:#b25555;color:#fff;' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    'button.apagar:hover{background:#8f3f3f;}' +
    'button.editar{margin-left:.7rem;padding:.15rem .55rem;background:#6b2f2f;color:#fff;' +
    'border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    'li.turma{margin-bottom:.6rem;}' +
    '.assoc{margin:.3rem 0 .1rem;font-size:.9rem;color:#6b5b4a;}' +
    '.chip{display:inline-block;margin:.1rem .3rem .1rem 0;padding:.1rem .4rem;background:#efe4c8;border-radius:4px;font-size:.82rem;color:#3a2b1f;}' +
    '.chip button{display:inline-block;margin:0 0 0 .3rem;padding:0 .3rem;background:transparent;color:#8f3f3f;border:none;font-weight:700;cursor:pointer;}' +
    'select.sel-termo{max-width:16rem;padding:.25rem .4rem;font:0.9rem/1.4 system-ui,sans-serif;border:1px solid #c9a24b;border-radius:4px;}' +
    'button.associar{margin-left:.4rem;padding:.2rem .55rem;background:#6b2f2f;color:#fff;border:none;border-radius:4px;font:600 .75rem/1.4 system-ui,sans-serif;cursor:pointer;}' +
    '.cb-grupo{max-height:14rem;overflow:auto;border:1px solid #c9a24b;border-radius:4px;padding:.5rem .6rem;margin:.3rem 0 .6rem;background:#fff;}' +
    '.cb{display:block;font-size:.9rem;color:#3a2b1f;padding:.1rem 0;}' +
    '.cb input{margin-right:.4rem;}' +
    'form select{width:100%;box-sizing:border-box;padding:.45rem .6rem;font:1rem/1.4 system-ui,sans-serif;border:1px solid #c9a24b;border-radius:4px;background:#fff;}' +
    '[hidden]{display:none!important;}' +
    '#gate{border:1px solid #c9a24b;background:#fdf6e3;border-radius:6px;padding:1rem;margin:1rem 0;}' +
    '</style></head><body>' +
    '<div class="topo"><a href="/bastidores">← Bastidores</a><span>Bastidores · Produção</span></div>' +
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
    '<section class="secao" id="sec-painel">' +
    '<h2>Painel inicial</h2>' +
    '<p>Aqui aparece o que mudou desde a última vez. Use o menu ao lado para gerir pessoas e pedagogia.</p>' +
    '</section>' +
    '<section class="secao" id="sec-professores">' +
    '<h2>Professores</h2>' +
    '<form id="form-prof">' +
    '<label for="pnome">Nome do professor</label>' +
    '<input id="pnome" name="nome" autocomplete="off" placeholder="ex.: Tiago">' +
    '<label for="psenha">Senha do professor</label>' +
    '<input id="psenha" name="senha" type="password" autocomplete="new-password">' +
    '<button type="submit">Cadastrar professor</button>' +
    '</form>' +
    '<h3>Professores cadastrados</h3><ul>' + itensProfs + '</ul>' +
    '</section>' +
    '<section class="secao" id="sec-alunas">' +
    '<h2>Alunas</h2>' +
    '<form id="form-aluna">' +
    '<label for="anome">Apelido da aluna (estável, P-12)</label>' +
    '<input id="anome" name="apelido" autocomplete="off" placeholder="ex.: Vavá">' +
    '<button type="submit">Cadastrar aluna</button>' +
    '</form>' +
    '<h3>Alunas cadastradas</h3><ul>' + itensAlunas + '</ul>' +
    '</section>' +
    '<section class="secao" id="sec-turmas">' +
    '<h2>Turmas</h2>' +
    '<form id="form-turma">' +
    '<label for="tnome">Nome da turma</label>' +
    '<input id="tnome" name="nome" autocomplete="off" placeholder="ex.: Balé Nível 1">' +
    '<label for="tordem">Posição na lista (1 = primeiro; vazio vai para o fim)</label>' +
    '<input id="tordem" name="ordem" autocomplete="off" placeholder="ex.: 1">' +
    '<label for="tprograma">Programa de referência (sugerido, não oficial)</label>' +
    '<input id="tprograma" name="programaReferencia" autocomplete="off" placeholder="ex.: RAD (referência sugerida)">' +
    '<label for="tnivel">Equivalência pedagógica (referência)</label>' +
    '<input id="tnivel" name="nivelReferencia" autocomplete="off" placeholder="ex.: Grade 1">' +
    '<label for="tdescricao">Notas sobre esta turma (opcional)</label>' +
    '<input id="tdescricao" name="descricao" autocomplete="off">' +
    '<button type="submit">Cadastrar turma</button>' +
    '</form>' +
    '<ul>' + itensTurmas + '</ul>' +
    '</section>' +
    '<section class="secao" id="sec-vocabulario">' +
    '<h2>Vocabulário Técnico do Balé</h2>' +
    '<form id="form-termo">' +
    '<label for="vtermo">Termo principal (grafia francesa, com acentos)</label>' +
    '<input id="vtermo" name="termo" autocomplete="off" placeholder="ex.: Plié">' +
    '<label for="vcategoria">Categoria</label>' +
    '<input id="vcategoria" name="categoria" autocomplete="off" placeholder="passo · posicao · direcao · ligacao · salto · giro">' +
    '<label for="vtradicao">Tradição de referência</label>' +
    '<input id="vtradicao" name="tradicao" autocomplete="off" placeholder="compartilhada · RAD · francesa · Vaganova">' +
    '<button type="submit">Cadastrar termo</button>' +
    '</form>' +
    '<ul>' + itensTermos + '</ul>' +
    '<p><button id="semear" type="button">Carregar catálogo inicial (turmas + vocabulário)</button></p>' +
    '</section>' +
    '<section class="secao" id="sec-curadorias">' +
    '<h2>Curadorias</h2>' +
    '<p class="sub">O que a escola atribui a cada professor — a modalidade, a tradição, a turma, o repertório e as alunas. É isto que pré-carrega a anamnese, o plano e o PO.</p>' +
    '<form id="form-curadoria">' +
    '<label for="cuprofessor">Professor</label>' +
    '<select id="cuprofessor">' + opcoesProfessorCuradoria + '</select>' +
    '<label for="cumodalidade">Modalidade</label>' +
    '<select id="cumodalidade">' + opcoesModalidadeCuradoria + '</select>' +
    '<label for="cutradicao">Tradição</label>' +
    '<select id="cutradicao"><option value="">— nenhuma —</option>' + opcoesTradicaoCuradoria + '</select>' +
    '<label>Turmas</label>' +
    '<div class="cb-grupo">' + (caixasTurmasCuradoria || '<span class="dono">(nenhuma turma)</span>') + '</div>' +
    '<label>Alunas</label>' +
    '<div class="cb-grupo">' + (caixasAlunasCuradoria || '<span class="dono">(nenhuma aluna)</span>') + '</div>' +
    '<label>Repertório (passos da turma)</label>' +
    '<div class="cb-grupo">' + (caixasRepertorioCuradoria || '<span class="dono">(nenhum termo)</span>') + '</div>' +
    '<button type="submit">Atribuir curadoria</button>' +
    '</form>' +
    '<h3>Curadorias atribuídas</h3><ul>' + itensCuradorias + '</ul>' +
    '</section>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<script>' +
    'var SENHA_DIRECAO = "";' +
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
    '// A sessão persiste enquanto a ABA fica aberta (sessionStorage): depois do primeiro login,' +
    '// o recarregar da página (após cadastrar/excluir) re-entra SOZINHO, sem pedir a senha de novo.' +
    '// Fechar a aba esquece; manter aberta não volta a pedir.' +
    '(function(){' +
    '  var guardada = null;' +
    '  try { guardada = sessionStorage.getItem("producao:senha"); } catch (err) {}' +
    '  if (guardada) entrar(guardada);' +
    '})();' +
    '// O menu lateral: cada secção é uma <section class="secao">; o hash da URL escolhe qual fica' +
    '// visível. As secções continuam no DOM (os formulários existem todos), só muda o que se mostra.' +
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
    '  postar("form-prof", {nome: document.getElementById("pnome").value, senha: document.getElementById("psenha").value});' +
    '});' +
    'document.getElementById("form-aluna").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  postar("form-aluna", {apelido: document.getElementById("anome").value});' +
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
    '    nivelReferencia: document.getElementById("tnivel").value,' +
    '    descricao: document.getElementById("tdescricao").value' +
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
    'document.getElementById("semear").addEventListener("click", function(e){' +
    '  if (!confirm("Carregar o catálogo inicial (turmas + vocabulário)? Registros já existentes não são duplicados.")) return;' +
    '  enviar("/api/bastidores/semear-catalogo", {}, "carregando catálogo inicial...", false);' +
    '});' +
    'document.getElementById("form-curadoria").addEventListener("submit", function(e){' +
    '  e.preventDefault();' +
    '  function marcados(nome) {' +
    '    return Array.prototype.slice.call(document.querySelectorAll("input[name=\\"" + nome + "\\"]:checked")).map(function(x){ return x.value; });' +
    '  }' +
    '  enviar("/api/bastidores/curadoria", {' +
    '    professor: document.getElementById("cuprofessor").value,' +
    '    modalidade: document.getElementById("cumodalidade").value,' +
    '    tradicao: document.getElementById("cutradicao").value,' +
    '    turmas: marcados("curadoria-turma"),' +
    '    repertorio: marcados("curadoria-repertorio"),' +
    '    alunas: marcados("curadoria-aluna")' +
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
    '  var corpo = tipo === "aluna" ? {apelido: alvo} : (tipo === "curadoria" ? {id: alvo} : {nome: alvo});' +
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
    '</body></html>';
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
  if (path === '/bastidores') {
    return html(paginaHub(escola));
  }
  if (path === '/bastidores/estudio') {
    return html(paginaEstudio(escola));
  }
  if (path === '/bastidores/producao') {
    const [profs, aluns, trms, trmos] = await Promise.all([
      professores(kv, escola), alunas(kv, escola), turmas(kv, escola), termos(kv, escola),
    ]);
    const dono = await nomeDoDono(env, kv, escola);
    const rel = await relacoes(kv, escola);
    const curs = await curadorias(kv, escola);
    return html(paginaProducao(escola, profs, aluns, dono, trms, trmos, rel, curs));
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
      if (p.nome === dono) continue;
      lista.push({ nome: p.nome, slug: slugificar(p.nome) });
    }
    return json(200, { ok: true, escola, professores: lista });
  }

  // POST /api/bastidores/professor — cadastrar professor (nome + senha).
  if (path === '/api/bastidores/professor' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!senhaDaDirecaoOk(env, String(corpo.senhaDirecao || ''))) {
      return json(401, { ok: false, erro: 'senha da direção inválida' });
    }
    const nome = String(corpo.nome || '').trim();
    const senha = String(corpo.senha || '');
    if (!nome || !senha) return json(400, { ok: false, erro: 'informe o nome e a senha do professor' });
    const lista = await professores(kv, escola);
    if (lista.some((p) => p.nome === nome)) return json(409, { ok: false, erro: 'já existe um professor com este nome' });
    const sal = gerarSal();
    const hash = await hashSenha(senha, sal);
    lista.push({ nome, sal, hash });
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(201, { ok: true, professor: nome });
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
    // O dono pode ter o nome ajustado no KV — protege-se pelo nome RESOLVIDO, não só o secret.
    const donoNome = await nomeDoDono(env, kv, escola);
    if (donoNome && nome === donoNome) {
      return json(409, {
        ok: false,
        erro: 'este é o professor dono da escola (criado na página) — ajuste o nome, não o exclua',
      });
    }
    const lista = await professores(kv, escola);
    const idx = lista.findIndex((p) => p && p.nome === nome);
    if (idx === -1) return json(404, { ok: false, erro: 'professor não encontrado' });
    lista.splice(idx, 1);
    await kv.put(RAIZ + '/' + escola + '/professores', JSON.stringify(lista));
    return json(200, { ok: true, professor: nome, removido: true });
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
    const alvo = profs.find((p) => p && slugificar(p.nome) === professor);
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
    return json(200, { ok: true, escola, turmas: lista, opcoes: opcoesDeTurmas(lista) });
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
    const id = idCuradoria(professor, modalidade);
    const nova = {
      id,
      professor: slugificar(professor),
      modalidade,
      tradicao: String(corpo.tradicao || '').trim(),
      turmas: Array.isArray(corpo.turmas) ? corpo.turmas.map((x) => String(x).trim()).filter(Boolean) : [],
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

module.exports = { fetch, temProfessor };
