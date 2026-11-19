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

/**
 * A COMPLEXIDADE DO EXERCÍCIO (19/11/2026) — «simples» ou «complexo».
 *
 * É uma classificação do EXERCÍCIO, feita pelo professor, e não uma medida do sistema: o mesmo
 * «battement tendu» é simples para quem já o tem e complexo para quem o está a aprender. Por isso
 * é um campo de quem ensina, e por isso não tem regra derivada — não há nada no dado de onde a
 * inferir sem inventar.
 *
 * É OPCIONAL, e a razão é o dado que já existe: o vocabulário tem 98 verbetes anteriores a este
 * campo, e exigi-lo passaria a recusar a edição de todos eles até alguém os classificar. Um campo
 * em branco diz «ainda não classificado», que é a verdade; um campo obrigatório diria «erro» sobre
 * uma escola que não errou.
 */
const COMPLEXIDADES = ['simples', 'complexo'];

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
  /* A COMPLEXIDADE É VALIDADA SÓ QUANDO VEM (19/11/2026). Vazia não é erro: é «ainda não
   * classificado», e é o estado de todos os verbetes que já existem. */
  const complexidade = String((corpo && corpo.complexidade) || '').trim();
  if (complexidade && COMPLEXIDADES.indexOf(complexidade) === -1) {
    erros.push('escolha a complexidade: ' + COMPLEXIDADES.join(' · '));
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
      ...(complexidade ? { complexidade: complexidade } : {}),
      alternativos: Array.isArray(corpo && corpo.alternativos)
        ? corpo.alternativos.map((a) => String(a).trim()).filter(Boolean) : [],
      descricao: String((corpo && corpo.descricao) || '').trim(),
      fonte: String((corpo && corpo.fonte) || '').trim(),
      observacoes: String((corpo && corpo.observacoes) || '').trim(),
      estado: 'documentado',
    },
  };
}

/**
 * Cria um termo — ou APROVEITA o que já existe, quando quem chama o pede.
 *
 * O `id` é derivado do nome, e o nome é a chave: criar duas vezes o mesmo nome nunca foi escrever
 * dois termos, foi escrever o mesmo duas vezes. Por omissão a função RECUSA (`409`), e é o
 * contrato certo para quem escreve em lote e precisa de saber que colidiu.
 *
 * `reutilizar: true` muda a resposta, e não a regra (07/11/2026). Quando o termo já existe para o
 * MESMO dono, devolve-o com `ok: true` e `jaExistia: true`, sem escrever nada no repositório. É o
 * que o formulário precisa: o professor escreve um exercício que já está no vocabulário, e a
 * resposta certa não é «erro» — é o termo, para o passo seguinte o poder escolher.
 *
 * PORQUE O PADRÃO CONTINUA A SER RECUSAR. A recusa é a única coisa que impede um cliente de
 * acreditar que gravou quando não gravou. Quem quer find-or-create diz que quer; quem não diz
 * recebe o facto. Uma inversão do padrão teria apagado a diferença entre «criei» e «já estava»
 * em todos os chamadores, incluindo os que escrevem às cegas.
 */
async function criarTermo({ f, token, dono, repo, ref, corpo, tradicoes, escola, reutilizar }) {
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
    if (reutilizar === true) {
      /* `commit: null` DIZ QUE NADA FOI ESCRITO. Quem mostra a resposta ao professor usa-o para
       * não anunciar uma gravação que não houve — e o `jaExistia` é o mesmo facto, dito a quem só
       * quer saber se pode avançar. */
      return { ok: true, status: 200, jaExistia: true, termo: existente, commit: null };
    }
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
 * EDITA o termo inteiro — o que o Dicionário da Produção faz (19/11/2026).
 *
 * O QUE ELE RESOLVE, e é o que a `editarNomeDoTermo` não fazia: a categoria, a tradição, a
 * complexidade e a definição de um verbete não tinham por onde se corrigir. Quem as escrevia mal
 * ficava com o erro no dicionário para sempre, ou apagava o termo e criava outro — e apagar um
 * termo é apagar a referência que um verbete, um plano ou uma associação de turma apontam.
 *
 * O QUE ELE NÃO TOCA, e é deliberado: o DONO (`escola`) e os campos que este formulário não
 * pergunta (`alternativos`, `fonte`, `observacoes`). Uma edição de tela não muda de quem é o
 * termo, e apagar o que não se mostrou é a maneira mais silenciosa de perder dado.
 *
 * O NOME CONTINUA A SER A CHAVE. Mudá-lo muda o `id`, e um `id` pode estar referido — por isso a
 * colisão é recusada com o nome de quem já o tem. O que o `id` antigo referencia (o verbete, que é
 * chaveado pelo NOME do exercício) não é migrado aqui: quem muda o nome de um exercício em uso
 * tem de saber que está a mudar uma referência, e a tela di-lo antes de gravar.
 */
async function editarTermo({ f, token, dono, repo, ref, idAntigo, corpo, tradicoes }) {
  const lido = await ler({ f, token, dono, repo, ref });
  if (!lido.ok) return lido;
  const idx = lido.termos.findIndex((t) => t && t.id === idAntigo);
  if (idx === -1) return { ok: false, status: 404, erro: 'termo não encontrado' };
  const conferido = validarTermo(corpo, tradicoes);
  if (!conferido.ok) return { ok: false, status: 400, erro: 'termo inválido', erros: conferido.erros };

  const antes = lido.termos[idx];
  const donoDoTermo = String(antes.escola || '').trim();
  const novo = Object.assign({}, antes, conferido.termo, {
    escola: antes.escola,
    alternativos: antes.alternativos || [],
    fonte: antes.fonte || '',
    observacoes: antes.observacoes || '',
  });
  if (antes.estado) novo.estado = antes.estado;

  if (novo.id !== idAntigo) {
    const colide = lido.termos.some((t, i) => i !== idx && t && t.id === novo.id
      && String(t.escola || '').trim() === donoDoTermo);
    if (colide) {
      return { ok: false, status: 409, erro: 'já existe «' + novo.termo + '» no dicionário'
        + (donoDoTermo ? ' desta escola' : '') };
    }
  }

  const mudouNome = novo.termo !== antes.termo;
  lido.termos[idx] = novo;
  const escrito = await escrever({
    f, token, dono, repo, ref, termos: lido.termos, sha: lido.sha,
    mensagem: 'docs(biblioteca): ajustar «' + novo.termo + '» no vocabulário do balé clássico'
      + (mudouNome ? ' (era «' + antes.termo + '»)' : '') + '\n\n'
      + 'Editado pela Produção (Sistema Lastro).\n',
  });
  if (!escrito.ok) {
    return { ok: false, status: escrito.status, erro: 'o repositório recusou a gravação (HTTP ' + escrito.status + ')' };
  }
  return { ok: true, status: 200, de: idAntigo, para: novo.id, termo: novo, commit: escrito.commit };
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
  editarTermo,
  editarNomeDoTermo,
  validarTermo,
  idDe,
  CATEGORIAS,
  MEMBROS,
  COMPLEXIDADES,
};
