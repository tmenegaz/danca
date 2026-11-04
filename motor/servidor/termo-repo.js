'use strict';

/**
 * termo-repo.js — O CADASTRO DE TERMO, ESCRITO NO REPOSITÓRIO (28/10/2026).
 *
 * PORQUE. O vocabulário técnico passou a ter UMA verdade: o ficheiro
 * `biblioteca/modalidades/bale-classico/vocabulario.json`, de onde saem ao mesmo tempo o
 * «conteúdo do nível» do plano, a lista de exercícios do verbete e as posições da notação. Uma
 * cópia por escola no KV divergia dessa ao primeiro termo novo — e divergia em silêncio: um
 * verbete que existe e não casa com exercício nenhum.
 *
 * O KV DEIXA DE GUARDAR VOCABULÁRIO. Fica lá o que é mesmo da escola: professores, alunas,
 * turmas, a relação turma↔conteúdo e os envelopes. É menos KV e uma verdade só.
 *
 * A CONSEQUÊNCIA, dita por inteiro: o Worker lê o vocabulário do BUNDLE (o esbuild embute o JSON;
 * o Worker não tem `fs`). Um termo cadastrado agora fica no repositório imediatamente e chega a
 * todos os Workers no deploy que esse commit dispara. Até lá, a resposta do POST devolve o termo
 * criado, e a tela acrescenta-o à lista sem esperar — o utilizador não fica a olhar para uma
 * lista onde o que acabou de criar não está.
 */

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

/* O CAMINHO DERIVA DA MODALIDADE PRINCIPAL (04/11/2026), e não de um literal. O ficheiro é um
 * só — a razão está em `comum.js` → `separarPorEscola`, e é o `require` do bundle —, mas QUAL é
 * esse ficheiro é decisão do catálogo: no dia em que a modalidade principal mudar, este caminho
 * acompanha em vez de apontar para um vocabulário que já não é o principal. */
const CAMINHO = 'biblioteca/modalidades/' + require('../nucleo/perfil-do-professor.js').MODALIDADE_PADRAO
  + '/vocabulario.json';

/**
 * DE QUEM É O TERMO, GRAVADO NO TERMO (02/11/2026).
 *
 * O ficheiro continua a ser um só — e a razão está escrita em `comum.js` → `separarPorEscola`: o
 * Worker lê este vocabulário do BUNDLE (`require` de JSON, embutido pelo esbuild), e um ficheiro
 * de caminho variável (`biblioteca/escolas/<escola>/…`) não pode ser embutido. O que passa a
 * existir é o **dono declarado em cada termo**, que é o mínimo para o termo da escola A não
 * aparecer no dicionário da B.
 *
 * `escola` ausente = termo do CATÁLOGO (o que se vende). Um slug = termo daquela escola.
 */
const ESCOLA_DO_CATALOGO = '';

function cabecalhos(token) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    'User-Agent': 'danca-vocabulario',
  };
}

function decodificarBase64(texto) {
  const limpo = String(texto || '').replace(/\s+/g, '');
  if (!limpo) return '';
  const binario = atob(limpo);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function codificarBase64(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  return btoa(binario);
}

/** Lê o ficheiro do repositório: `{ok, sha, termos}` ou `{ok:false, status, erro}`. */
async function ler({ f, token, dono, repo, ref }) {
  if (!token) return { ok: false, status: 401, erro: 'sem token do repositório' };
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + CAMINHO
    + (ref ? '?ref=' + encodeURIComponent(ref) : '');
  let resposta;
  try {
    resposta = await f(url, { method: 'GET', headers: cabecalhos(token) });
  } catch (erro) {
    return { ok: false, status: 502, erro: 'não foi possível ler o vocabulário: ' + (erro && erro.message) };
  }
  if (resposta.status !== 200) {
    let corpo = '';
    try { corpo = await resposta.text(); } catch { corpo = ''; }
    return { ok: false, status: resposta.status, erro: 'o repositório recusou a leitura do vocabulário (HTTP '
      + resposta.status + '): ' + corpo.slice(0, 200) };
  }
  const dados = await resposta.json();
  let termos;
  try {
    termos = JSON.parse(decodificarBase64(dados.content || ''));
  } catch (erro) {
    return { ok: false, status: 502, erro: 'o vocabulário do repositório não é JSON válido' };
  }
  if (!Array.isArray(termos)) return { ok: false, status: 502, erro: 'o vocabulário do repositório não é uma lista' };
  return { ok: true, sha: dados.sha || null, termos };
}

async function escrever({ f, token, dono, repo, ref, termos, sha, mensagem }) {
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + CAMINHO;
  const resposta = await f(url, {
    method: 'PUT',
    headers: cabecalhos(token),
    body: JSON.stringify({
      message: mensagem,
      content: codificarBase64(JSON.stringify(termos, null, 2) + '\n'),
      ...(ref ? { branch: ref } : {}),
      ...(sha ? { sha } : {}),
    }),
  });
  let corpo = {};
  try { corpo = await resposta.json(); } catch { corpo = {}; }
  return {
    ok: resposta.status >= 200 && resposta.status < 300,
    status: resposta.status,
    commit: (corpo.commit && corpo.commit.sha) || null,
  };
}

const CATEGORIAS = ['passo', 'posicao', 'direcao', 'ligacao', 'salto', 'giro'];
const MEMBROS = ['pes', 'pernas', 'bracos'];

/** O `id` de um termo — a mesma derivação que a notação e o plano usam. */
function idDe(nome) {
  return String(nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/**
 * UM TERMO, VALIDADO. A régua é a mesma do resto: categoria e tradição vêm de listas, e uma
 * posição tem de dizer de que membro é — sem isso «première position» não se distingue da
 * homónima de braços, e o verbete passa a apontar para a posição errada.
 */
function validarTermo(corpo, tradicoes) {
  const erros = [];
  const termo = String((corpo && corpo.termo) || '').trim();
  if (!termo) erros.push('informe o nome do termo');
  const categoria = String((corpo && corpo.categoria) || '').trim();
  if (CATEGORIAS.indexOf(categoria) === -1) {
    erros.push('escolha a categoria: ' + CATEGORIAS.join(' · '));
  }
  const tradicao = String((corpo && corpo.tradicao) || 'compartilhada').trim();
  if (Array.isArray(tradicoes) && tradicoes.length && tradicoes.indexOf(tradicao) === -1) {
    erros.push('escolha a tradição: ' + tradicoes.join(' · '));
  }
  let membro = String((corpo && corpo.membro) || '').trim();
  if (categoria === 'posicao') {
    if (MEMBROS.indexOf(membro) === -1) erros.push('uma posição tem de dizer de que membro é: ' + MEMBROS.join(' · '));
  } else if (membro && MEMBROS.indexOf(membro) === -1) {
    erros.push('membro desconhecido: ' + membro);
  }
  return {
    ok: erros.length === 0,
    erros,
    termo: {
      id: idDe(termo),
      termo: termo,
      categoria: categoria,
      ...(membro ? { membro: membro } : {}),
      tradicao: tradicao,
      alternativos: Array.isArray(corpo && corpo.alternativos)
        ? corpo.alternativos.map((a) => String(a).trim()).filter(Boolean) : [],
      descricao: String((corpo && corpo.descricao) || '').trim(),
      fonte: String((corpo && corpo.fonte) || '').trim(),
      observacoes: String((corpo && corpo.observacoes) || '').trim(),
      estado: 'documentado',
    },
  };
}

/** Cria um termo. Recusa quando ele já existe — o `id` é derivado do nome, e o nome é a chave. */
async function criarTermo({ f, token, dono, repo, ref, corpo, tradicoes, escola }) {
  const conferido = validarTermo(corpo, tradicoes);
  if (!conferido.ok) return { ok: false, status: 400, erro: 'termo inválido', erros: conferido.erros };
  // O DONO VAI NO TERMO. Um termo criado na Produção de uma escola é DELA — a licença, §4 —, e o
  // produto do catálogo passa a conseguir excluí-lo. Sem isto, criar um termo na escola A mudava o
  // dicionário de B.
  const donoDoTermo = String(escola || '').trim();
  if (donoDoTermo) conferido.termo.escola = donoDoTermo;

  const lido = await ler({ f, token, dono, repo, ref });
  if (!lido.ok) return lido;
  // A COLISÃO É POR (DONO, id), E NÃO SÓ POR id (02/11/2026). Com o dono gravado no termo, duas
  // escolas podem declarar o MESMO nome — e têm de poder: uma escola que quer o seu «Battement
  // tendu» com a sua definição não pode ficar bloqueada por um termo de outra escola que ela nem
  // vê. Ficar bloqueada seria a contaminação outra vez, disfarçada de «já existe».
  //
  // E a mesma regra serve para a sobreposição do catálogo: a escola pode declarar a sua versão de
  // um termo do catálogo, e a composição (`compor`) faz a dela vencer.
  const existente = lido.termos.find((t) => t && t.id === conferido.termo.id
    && String(t.escola || '').trim() === donoDoTermo);
  if (existente) {
    return { ok: false, status: 409, erro: '«' + existente.termo + '» já está no vocabulário'
      + (donoDoTermo ? ' desta escola' : ''), termo: existente };
  }
  lido.termos.push(conferido.termo);
  const escrito = await escrever({
    f, token, dono, repo, ref, termos: lido.termos, sha: lido.sha,
    mensagem: 'feat(biblioteca): acrescentar «' + conferido.termo.termo + '» ao vocabulário do balé clássico\n\n'
      + 'Cadastrado pela Produção (Sistema Lastro)'
      + (donoDoTermo ? ', para a escola «' + donoDoTermo + '».\n' : '.\n'),
  });
  if (!escrito.ok) {
    return { ok: false, status: escrito.status, erro: 'o repositório recusou a gravação (HTTP ' + escrito.status + ')' };
  }
  return { ok: true, status: 201, termo: conferido.termo, commit: escrito.commit };
}

/**
 * EDITA o nome de um termo — e com ele o `id`, porque o `id` é derivado do nome.
 *
 * O que muda de nome muda de `id`, e um `id` antigo pode estar referido num verbete, numa posição
 * ou numa relação turma↔conteúdo. Por isso a edição é RECUSADA quando o termo antigo é usado: quem
 * edita tem de saber que está a mexer numa referência, e não só numa etiqueta.
 */
async function editarNomeDoTermo({ f, token, dono, repo, ref, idAntigo, novoNome }) {
  const lido = await ler({ f, token, dono, repo, ref });
  if (!lido.ok) return lido;
  const idx = lido.termos.findIndex((t) => t && t.id === idAntigo);
  if (idx === -1) return { ok: false, status: 404, erro: 'termo não encontrado' };
  const novoId = idDe(novoNome);
  if (!novoId) return { ok: false, status: 400, erro: 'informe o novo nome' };
  if (lido.termos.some((t) => t && t.id === novoId && t.id !== idAntigo)) {
    return { ok: false, status: 409, erro: 'já existe um termo com esse nome' };
  }
  const antes = lido.termos[idx].termo;
  lido.termos[idx] = Object.assign({}, lido.termos[idx], { id: novoId, termo: String(novoNome).trim() });
  const escrito = await escrever({
    f, token, dono, repo, ref, termos: lido.termos, sha: lido.sha,
    mensagem: 'docs(biblioteca): «' + antes + '» passa a «' + String(novoNome).trim() + '»\n\n'
      + 'Cadastrado pela Produção (Sistema Lastro).\n',
  });
  if (!escrito.ok) {
    return { ok: false, status: escrito.status, erro: 'o repositório recusou a gravação (HTTP ' + escrito.status + ')' };
  }
  return { ok: true, status: 200, de: idAntigo, para: novoId, termo: lido.termos[idx], commit: escrito.commit };
}

module.exports = {
  CAMINHO,
  ESCOLA_DO_CATALOGO,
  ler,
  escrever,
  criarTermo,
  editarNomeDoTermo,
  validarTermo,
  idDe,
  CATEGORIAS,
  MEMBROS,
};
