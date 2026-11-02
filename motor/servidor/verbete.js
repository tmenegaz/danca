'use strict';

/**
 * verbete.js — O VERBETE ADMINISTRÁVEL NA PRODUÇÃO (Fase 1.5, 28/10/2026).
 *
 * PORQUE A ESCRITA É NO REPOSITÓRIO, E NÃO NO KV. O alfabeto é lido do DISCO na geração
 * (`motor/nucleo/notacao.js` faz `require` do JSON), e a geração corre no GitHub Actions, não no
 * Worker. Um CRUD que gravasse no KV criaria uma SEGUNDA fonte que o gerador nunca lê: a tela
 * mostrava o verbete novo, o documento continuava a sair com o velho, e nada falhava. O KV é
 * rascunho; a verdade é o commit — e o Git passa a ser o histórico, sem se construir um segundo.
 *
 * PORQUE NÃO HÁ «APAGAR». A proveniência acrescenta, não edita (P-03/P-04): um verbete que já
 * compôs um documento publicado é parte do passado daquele documento. Apagá-lo faria o registro
 * publicado deixar de se poder ler de volta. O que há é **descontinuar** — o verbete fica, e o
 * motor passa a recusá-lo para exercícios novos.
 *
 * O QUE É VALIDADO AQUI, e não na tela. A tela é uma conveniência; a guarda é o servidor. As
 * regras são as do motor de composição (`verbete-incompleto`, `verbete-inconsistente`,
 * `sinal-desconhecido`), aplicadas ANTES de gravar — para que o alfabeto publicado nunca fique
 * num estado que obrigue o documento a cair em lacuna.
 */

const ACEITE = 'application/vnd.github+json';
const API_VERSAO = '2022-11-28';

/** A pasta de uma modalidade no repositório. O alfabeto e o vocabulário vivem juntos. */
function pastaDaModalidade(modalidade) {
  return 'biblioteca/modalidades/' + String(modalidade || '').trim();
}

function caminhoDoAlfabeto(modalidade) {
  return pastaDaModalidade(modalidade) + '/notacao.json';
}

function caminhoDoVocabulario(modalidade) {
  return pastaDaModalidade(modalidade) + '/vocabulario.json';
}

function cabecalhos(token, autor) {
  return {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    'User-Agent': 'danca-verbete',
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

/** Um GET no Contents API. 404 é um estado (`existe: false`), não um erro. */
async function lerDoRepo({ f, url, h }) {
  const resposta = await f(url, { method: 'GET', headers: h });
  // 404 É UM ESTADO; O RESTO É UMA FALHA, E DIZ-SE. «Não existe» e «não me deixaram ver» levam a
  // correções diferentes — e durante um dia inteiro de trabalho a segunda apareceu escrita como a
  // primeira, porque o token não passava e o GitHub respondia 403.
  if (resposta.status === 404) return { existe: false, sha: null, texto: '' };
  if (resposta.status !== 200) {
    let corpo = '';
    try { corpo = await resposta.text(); } catch { corpo = ''; }
    const erro = new Error('o repositório recusou a leitura (HTTP ' + resposta.status + '): ' + corpo.slice(0, 200));
    erro.status = resposta.status;
    throw erro;
  }
  const dados = await resposta.json();
  return { existe: true, sha: dados.sha || null, texto: decodificarBase64(dados.content || '') };
}

/** Um PUT no Contents API: cria quando não há `sha`, atualiza quando há. */
async function gravarNoRepo({ f, url, h, texto, sha, ref, mensagem }) {
  const resposta = await f(url, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({
      message: mensagem,
      content: codificarBase64(texto),
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

// ------------------------------------------------------------------ a validação

const MUSICA = /^(\d+)\|(\d+\/\d+)$/;
const CONTAGEM = /^\d+(\s*[–-]\s*\d+)?$/;

/**
 * UM VERBETE, VALIDADO CONTRA O PRÓPRIO ALFABETO. Devolve `{ok}`, ou `{ok: false, erros: [...]}`.
 *
 * É a MESMA régua do motor — se ela fosse mais frouxa aqui, o CRUD deixaria entrar um verbete que
 * a geração recusaria, e o erro só apareceria no documento, longe de quem o escreveu.
 */
/**
 * COMO SE NOMEIA O TRECHO NA RECUSA (01/11/2026). A direção deixou de ser obrigatória, e a
 * chave vazia é «sem direção» — sem isto, a mensagem de erro de um trecho sem direção dizia
 * «em «»: a célula não tem descrição», que não se lê.
 */
function ondeEsta(direcao) {
  return direcao ? 'em «' + direcao + '»' : 'no trecho sem direção';
}

function validarVerbete(verbete, alfabeto, vocabulario, musicaDeclarada) {
  const erros = [];
  if (!verbete || typeof verbete !== 'object') return { ok: false, erros: ['o verbete não é um objeto'] };

  // A DIREÇÃO É A CHAVE DA CÉLULA (28/10/2026). Havia um campo `direcoes` ao lado de `celulas`, e
  // nas seis entradas do alfabeto ele era exactamente a lista das chaves — duas listas da mesma
  // coisa, que divergem ao primeiro caso que só uma conhece. A validação deixou de perguntar se
  // as duas concordam (não há duas) e passa a perguntar o que só a célula pode responder: uma
  // célula vazia é um verbete pela metade, e é recusado.
  const celulas = verbete.celulas;
  if (!celulas || typeof celulas !== 'object') {
    erros.push('o verbete tem de ter `celulas`');
  } else {
    const dirs = Object.keys(celulas);
    if (!dirs.length) erros.push('o verbete tem de ter ao menos um trecho (uma célula)');
    for (const d of dirs) {
      if (!Array.isArray(celulas[d]) || !celulas[d].length) erros.push((d ? 'a direção «' + d + '»' : 'o trecho sem direção') + ' não tem célula');
    }
    const conhecidos = sinaisDo(alfabeto);
    const categorias = (alfabeto && alfabeto.categorias) || [];
    let soma = 0;
    for (const d of dirs) {
      for (const c of (celulas[d] || [])) {
        if (!c || typeof c !== 'object') { erros.push('célula inválida ' + ondeEsta(d)); continue; }
        if (!CONTAGEM.test(String(c.contagem || '').trim())) {
          erros.push(ondeEsta(d) + ': contagem inválida «' + (c.contagem || '') + '» (use «1–2» ou «3»)');
        } else {
          soma += temposDaContagem(c.contagem);
        }
        // A NOTAÇÃO VEM DE DOIS CAMPOS (28/10/2026): `categoria` e `sinais`. O `bloco` de texto
        // deixou de existir no dado — «bloco» já queria dizer Solo · Barra · Centro, e pedir a
        // notação escrita à mão era pedir Benesh de cabeça. A validação compõe-na e confere-a
        // como antes; o que muda é que agora se pode compor na tela.
        const categoria = String(c.categoria || '').trim();
        const sinais = Array.isArray(c.sinais) ? c.sinais.map((x) => String(x).trim()).filter(Boolean) : [];
        if (!categoria) erros.push(ondeEsta(d) + ': a célula não diz a categoria («'
          + (categorias || []).join(' · ') + '»)');
        if (!sinais.length) erros.push(ondeEsta(d) + ': a célula não tem sinais');
        const bloco = '[' + categoria + ': ' + sinais.join(' ') + ']';
        const lido = lerBloco(bloco, conhecidos, categorias);
        if (!lido.ok) {
          erros.push(ondeEsta(d) + ': ' + lido.detalhe);
        }
        if (!String(c.descricao || '').trim()) {
          erros.push(ondeEsta(d) + ': a célula não tem descrição — é ela que a página em prosa mostra');
        }
      }
    }
    if (verbete.cobre == null) erros.push('o verbete tem de declarar `cobre` (quantos tempos explica)');
    else if (Number(verbete.cobre) !== soma) {
      erros.push('`cobre` diz ' + verbete.cobre + ' tempos e as células somam ' + soma);
    }

    /* AS CÉLULAS TÊM DE FECHAR A MÚSICA (02/11/2026).
     *
     * DEFEITO MEDIDO, e é ele que a pesquisadora viu na Aula 01: o `Battement fondu` está gravado
     * em «2|4/4» com células que somam 6 tempos, e o `Plié` em «8|4/4» com células que somam 12.
     * Os dois passaram a gravação porque a única igualdade que se conferia era `cobre` contra a
     * soma das células — uma conta que o formulário faz de si para si. A MÚSICA, que é a chave do
     * verbete, não era comparada com nada; e a notação do exercício seguia sem fechar em compasso
     * nenhum, com a §4 da aula a dizer `conferir` sem nomear o que estava torto.
     *
     * A recusa NOMEIA as duas hipóteses, porque são as duas que existem: ou a música declarada é
     * outra, ou falta (ou sobra) um trecho. Não escolhe por quem grava — e não diz «passo 2» nem
     * «passo 3»: os números dos passos são da TELA, e este módulo não os conhece. Quem os diz é a
     * página, que os lê de `PASSOS_DO_VERBETE`.
     *
     * `musicaDeclarada` é opcional: as provas chamam `validarVerbete` sem ela, e o que já está
     * gravado continua a ler-se. É a GRAVAÇÃO que passa a exigir. */
    if (musicaDeclarada) {
      const tempos = Number(String(musicaDeclarada).split('|')[0]);
      if (Number.isFinite(tempos) && tempos > 0 && soma !== tempos) {
        erros.push('as células somam ' + soma + ' tempos e a música «' + musicaDeclarada
          + '» declara ' + tempos + ' — '
          + (soma < tempos ? 'faltam ' + (tempos - soma) : 'sobram ' + (soma - tempos))
          + '. Ou a música está errada, ou falta um trecho.');
      }
    }
  }

  if (verbete.posicao) {
    if (!verbete.posicao.termo) erros.push('a posição não declara o termo');
    else {
      const termo = (vocabulario || []).find((t) => t && t.id === verbete.posicao.termo);
      if (!termo) erros.push('a posição «' + verbete.posicao.termo + '» não existe no vocabulário da modalidade');
      else if (verbete.posicao.membro && termo.membro && verbete.posicao.membro !== termo.membro) {
        erros.push('a posição «' + termo.termo + '» é de ' + termo.membro + ' e o verbete diz ' + verbete.posicao.membro);
      }
    }
  }

  // As direções ESCRITAS têm de existir na gramática — senão o documento não as sabe dizer.
  //
  // EXCETO A AUSÊNCIA DELA (01/11/2026). A direção passou a ser OPCIONAL no trecho: o `relevé`
  // não vai à frente, nem ao lado, nem atrás — sobe e desce, em primeira posição, en face, nos
  // pés. Antes, a única saída era enfiar as células debaixo de uma direção que não é a delas (o
  // `Plié` do alfabeto está todo em `devant`, e é um plié), e o verbete do relevé não se podia
  // escrever. A chave VAZIA é o «sem direção» — e não é uma direção a validar, é a ausência
  // dela. As que existem continuam a ser conferidas contra a gramática, uma por uma.
  const conhecidas = direcoesConhecidas(alfabeto);
  for (const d of Object.keys((celulas && typeof celulas === 'object') ? celulas : {})) {
    if (d === '') continue;
    if (!conhecidas.has(d)) erros.push('a direção «' + d + '» não existe na gramática da modalidade');
  }

  // A ORIENTAÇÃO DO CORPO É OUTRO EIXO (28/10/2026). A direção diz para onde a perna vai; a
  // orientação diz como o corpo está voltado — «à frente en croisé» é UM trecho, não dois. Ela é
  // opcional (a omissão é `en-face`), mas quando vem tem de existir na gramática.
  const orientacoes = new Set(Object.values(
    ((alfabeto && alfabeto.gramatica) || {}).orientacoesDoCorpo || {})
    .map((o) => o && o.termo).filter(Boolean));
  for (const d of Object.keys(celulas || {})) {
    for (const c of (celulas[d] || [])) {
      const o = String((c && c.orientacao) || '').trim();
      if (o && !orientacoes.has(o)) {
        erros.push(ondeEsta(d) + ': a orientação «' + o + '» não está na gramática ('
          + [...orientacoes].join(' · ') + ')');
      }
    }
  }

  return { ok: erros.length === 0, erros, soma: somaTempos(verbete) };
}

function somaTempos(verbete) {
  let soma = 0;
  const celulas = (verbete && verbete.celulas) || {};
  for (const d of Object.keys(celulas)) {
    for (const c of (celulas[d] || [])) soma += temposDaContagem(c && c.contagem);
  }
  return soma;
}

/** Os sinais do alfabeto, num `Set` — a mesma leitura que `motor/nucleo/notacao.js` faz. */
function sinaisDo(alfabeto) {
  const mapa = new Set();
  for (const grupo of (alfabeto && alfabeto.grupos) || []) {
    for (const sinal of Object.keys(grupo.itens || {})) mapa.add(sinal);
  }
  return mapa;
}

/** Todas as direções e orientações que a gramática declara, por `termo`. */
function direcoesConhecidas(alfabeto) {
  const g = (alfabeto && alfabeto.gramatica) || {};
  const conjunto = new Set();
  for (const grupo of ['direcoesDoMembro', 'orientacoesDoCorpo']) {
    for (const item of Object.values(g[grupo] || {})) if (item && item.termo) conjunto.add(item.termo);
  }
  return conjunto;
}

/** `1–4` → 4; `3` → 1. A mesma conta do motor, e escrita uma vez só de cada lado. */
function temposDaContagem(contagem) {
  const nums = String(contagem == null ? '' : contagem).match(/\d+/g);
  if (!nums || !nums.length) return 0;
  if (nums.length === 1) return 1;
  const de = Number(nums[0]);
  const ate = Number(nums[nums.length - 1]);
  return ate >= de ? ate - de + 1 : 0;
}

/** A forma do bloco, e os símbolos que ele usa, contra o alfabeto. */
function lerBloco(bloco, conhecidos, categorias) {
  const texto = String(bloco == null ? '' : bloco).trim();
  const m = /^\[([^:\]]+):([\s\S]*)\]$/.exec(texto);
  if (!m) return { ok: false, detalhe: 'o bloco «' + texto + '» não tem a forma [Categoria: conteúdo]' };
  const categoria = m[1].trim();
  if (categorias.indexOf(categoria) === -1) {
    return { ok: false, detalhe: 'a categoria «' + categoria + '» não está no alfabeto' };
  }
  for (const token of m[2].trim().split(/\s+/).filter(Boolean)) {
    if (!conhecidos.has(token)) return { ok: false, detalhe: 'o sinal «' + token + '» não está no alfabeto' };
  }
  return { ok: true };
}

// ------------------------------------------------------------------ as operações

/**
 * LÊ o alfabeto e o vocabulário do repositório. Devolve também o `sha`, que a gravação precisa —
 * sem ele o PUT é uma criação e o GitHub recusa por cima de um arquivo que existe.
 */
async function lerModalidade({ f, token, dono, repo, ref, modalidade }) {
  const h = cabecalhos(token);
  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/';
  let alfabeto;
  let vocabulario;
  try {
    alfabeto = await lerDoRepo({ f, url: raiz + caminhoDoAlfabeto(modalidade), h });
    vocabulario = await lerDoRepo({ f, url: raiz + caminhoDoVocabulario(modalidade), h });
  } catch (erro) {
    return { ok: false, status: erro.status || 502, erro: erro.message };
  }
  if (!alfabeto.existe) {
    return { ok: false, status: 404, erro: 'o alfabeto da modalidade «' + modalidade + '» não existe em '
      + caminhoDoAlfabeto(modalidade) };
  }

  let dados = null;
  let voc = [];
  try { dados = JSON.parse(alfabeto.texto); } catch { return { ok: false, erro: 'o alfabeto não é JSON válido' }; }
  try { voc = vocabulario.existe ? JSON.parse(vocabulario.texto) : []; } catch { voc = []; }
  return { ok: true, sha: alfabeto.sha, dados, vocabulario: voc, ref };
}

/** A lista dos verbetes, sem o `_comentario` — que é a explicação do dado, não um exercício.
 *
 *  A LISTAGEM PASSOU A DIZER O QUE O VERBETE É (31/10/2026). Antes trazia só o nome e as
 *  músicas («4 | 4/4 · 8 | 4/4 · 12 | 4/4»), e a pesquisadora leu-a como ilegível: o `|` da
 *  chave vazava para a tela, e nada dizia a posição, as direções nem quantos trechos o exercício
 *  tem. Os quatro campos novos são DERIVADOS do alfabeto — não há um segundo dado a manter:
 *  `trechos` conta as células, `direcoes` diz por onde o exercício passa, e `compassos` resume as
 *  músicas num só «4/4». É o que responde, de relance, «do que se trata».
 */
function listarVerbetes(dados) {
  const verbetes = (dados && dados.verbetes) || {};
  return Object.keys(verbetes)
    .filter((nome) => !nome.startsWith('_'))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((nome) => ({
      nome: nome,
      musicas: Object.keys(verbetes[nome] || {}),
      // A MARCA DE DESCONTINUADO VIVE EM CADA MÚSICA (31/10/2026). Ela era lida no topo do
      // verbete, onde nunca está — e por isso um verbete descontinuado nunca aparecia como tal.
      descontinuado: musicasDoVerbete(verbetes[nome])
        .some((k) => Boolean(verbetes[nome] && verbetes[nome][k] && verbetes[nome][k].descontinuado)),
      posicao: primeiraPosicao(verbetes[nome]),
      trechos: contarTrechos(verbetes[nome]),
      direcoes: direcoesDoVerbete(verbetes[nome]),
      compassos: compassosDoVerbete(verbetes[nome]),
    }));
}

/** As chaves de música de um verbete — o que tem a forma «<tempos>|<compasso>». */
function musicasDoVerbete(musicas) {
  return Object.keys(musicas || {}).filter((k) => /^\d+\|/.test(k));
}

function contarTrechos(musicas) {
  let total = 0;
  for (const chave of musicasDoVerbete(musicas)) {
    const celulas = (musicas[chave] && musicas[chave].celulas) || {};
    for (const dir of Object.keys(celulas)) {
      if (Array.isArray(celulas[dir])) total += celulas[dir].length;
    }
  }
  return total;
}

function direcoesDoVerbete(musicas) {
  const ordem = [];
  for (const chave of musicasDoVerbete(musicas)) {
    const celulas = (musicas[chave] && musicas[chave].celulas) || {};
    for (const dir of Object.keys(celulas)) {
      // O TRECHO SEM DIREÇÃO NÃO ENTRA NA LISTA DE DIREÇÕES (01/11/2026): a lista é o que a
      // etiqueta da listagem escreve («à frente · ao lado»), e uma direção vazia escreveria
      // um separador solto. Os trechos dele contam em `contarTrechos`, que é sobre trechos.
      if (dir === '') continue;
      if (Array.isArray(celulas[dir]) && celulas[dir].length && ordem.indexOf(dir) === -1) ordem.push(dir);
    }
  }
  return ordem;
}

function compassosDoVerbete(musicas) {
  const vistos = [];
  for (const chave of musicasDoVerbete(musicas)) {
    const compasso = String(chave).split('|')[1] || '';
    if (compasso && vistos.indexOf(compasso) === -1) vistos.push(compasso);
  }
  return vistos;
}

function primeiraPosicao(musicas) {
  for (const chave of Object.keys(musicas || {})) {
    const v = musicas[chave];
    if (v && v.posicao) return v.posicao;
  }
  return null;
}

/**
 * GRAVA um verbete. `acao` é `criar` (recusa se já existe), `atualizar` (recusa se não existe),
 * `descontinuar` (marca, não apaga) ou `retomar` (desfaz a descontinuação).
 *
 * A `versao` do alfabeto sobe a cada gravação que muda o conteúdo — é ela que o selo da âncora
 * (`tools/hash-ciclo.sh`) regista no `.fipp`, e é assim que se sabe com que código um documento
 * publicado foi escrito.
 */
async function gravarVerbete({ f, token, dono, repo, ref, modalidade, nome, musica, verbete, acao }) {
  if (!token) return { ok: false, status: 401, erro: 'sem token do repositório' };
  const nomeLimpo = String(nome || '').trim();
  if (!nomeLimpo) return { ok: false, status: 400, erro: 'informe o nome do exercício' };
  if (nomeLimpo.startsWith('_')) return { ok: false, status: 400, erro: 'o nome não pode começar por «_»' };
  const acaoLimpa = String(acao || 'criar').trim();

  const lido = await lerModalidade({ f, token, dono, repo, ref, modalidade });
  if (!lido.ok) return { ok: false, status: 404, erro: lido.erro };

  const dados = lido.dados;
  dados.verbetes = dados.verbetes || {};
  const existe = Object.prototype.hasOwnProperty.call(dados.verbetes, nomeLimpo);

  if (acaoLimpa === 'criar' && existe) {
    return { ok: false, status: 409, erro: '«' + nomeLimpo + '» já existe — edite o verbete existente' };
  }
  if (acaoLimpa !== 'criar' && !existe) {
    return { ok: false, status: 404, erro: '«' + nomeLimpo + '» não existe' };
  }

  let mensagem = '';
  if (acaoLimpa === 'descontinuar' || acaoLimpa === 'retomar') {
    const marcar = acaoLimpa === 'descontinuar';
    // A MARCA VALE PARA O EXERCÍCIO INTEIRO, em todas as músicas que ele declara: o exercício é
    // um só, e o que se descontinua é ele, não uma das suas durações.
    for (const chave of Object.keys(dados.verbetes[nomeLimpo] || {})) {
      const v = dados.verbetes[nomeLimpo][chave];
      if (v && typeof v === 'object') v.descontinuado = marcar;
    }
    mensagem = (marcar ? 'chore(notacao): descontinuar «' : 'docs(notacao): retomar «')
      + nomeLimpo + '» no alfabeto ' + modalidade;
  } else {
    const chaveMusica = String(musica || '').trim();
    if (!MUSICA.test(chaveMusica)) {
      return { ok: false, status: 400, erro: 'a música tem de ser «<tempos>|<compasso>», por exemplo «8|4/4»' };
    }
    const conferido = validarVerbete(verbete, dados, lido.vocabulario, chaveMusica);
    if (!conferido.ok) return { ok: false, status: 400, erro: 'verbete inválido', erros: conferido.erros };

    // O QUE SE GRAVA NÃO LEVA `direcoes` (28/10/2026). Se um pedido antigo — ou uma página em
    // cache — o enviar, ele não entra no ficheiro: o campo deixou de existir no dado, e o que o
    // alimentava era a mesma lista das chaves de `celulas`. Uma gravação não pode ressuscitá-lo,
    // senão a segunda lista volta pela porta de trás.
    const limpo = Object.assign({}, verbete);
    delete limpo.direcoes;
    dados.verbetes[nomeLimpo] = dados.verbetes[nomeLimpo] || {};
    dados.verbetes[nomeLimpo][chaveMusica] = limpo;
    mensagem = (acaoLimpa === 'criar' ? 'feat(notacao): declarar «' : 'docs(notacao): editar «')
      + nomeLimpo + '» (' + chaveMusica + ') no alfabeto ' + modalidade;
  }

  // A VERSÃO SOBE, e sobe no alfabeto — não no verbete: o selo da âncora mede o ficheiro inteiro.
  dados.versao = Number(dados.versao || 1) + 1;

  const h = cabecalhos(token);
  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/';
  const escrita = await gravarNoRepo({
    f, h, url: raiz + caminhoDoAlfabeto(modalidade),
    texto: JSON.stringify(dados, null, 2) + '\n',
    sha: lido.sha, ref: ref,
    mensagem: mensagem + '\n\nGravado pela Produção (Sistema Lastro).\n',
  });
  if (!escrita.ok) {
    return { ok: false, status: escrita.status, erro: 'o repositório recusou a gravação (HTTP ' + escrita.status + ')' };
  }
  return { ok: true, status: 200, versao: dados.versao, commit: escrita.commit, mensagem: mensagem };
}

module.exports = {
  pastaDaModalidade,
  caminhoDoAlfabeto,
  caminhoDoVocabulario,
  lerModalidade,
  listarVerbetes,
  validarVerbete,
  gravarVerbete,
  direcoesConhecidas,
  sinaisDo,
  temposDaContagem,
};
