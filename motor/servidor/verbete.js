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

// A REGRA DO BALDE VAZIO VIVE NO NÚCLEO (02/11/2026) — `semBaldesVazios`, em
// `motor/nucleo/notacao.js`. Escrevi-a aqui primeiro, e seria a segunda cópia da mesma regra no
// mesmo dia em que a conta dos tempos pagou caro por estar em quatro sítios: a fronteira do núcleo
// proíbe o motor de depender do servidor, mas não o contrário — o servidor pode e deve ler o
// núcleo. Uma regra, um sítio.
const nucleo = require('../nucleo/notacao.js');
const { semBaldesVazios } = nucleo;
/* O DONO DO VERBETE (03/11/2026). As quatro funções que compõem a chave de um registo, leem o seu
 * dono e dão a vista de uma escola vêm do NÚCLEO — e não se reescrevem aqui. A regra de precedência
 * (a escola vence o catálogo) é a mesma que a composição do documento usa, e uma segunda cópia
 * dela divergiria à primeira correcção.
 *
 * «O dono do alfabeto é a escola», nas palavras dela — e o mecanismo é o do vocabulário: o registo
 * do catálogo fica com a chave da música (`8|4/4`), o de uma escola leva o dono ao lado
 * (`8|4/4@breu`). O `@` é a única forma de dois donos declararem a mesma música num objecto
 * indexado por ela; no vocabulário, que é uma lista, o dono é só um campo. */
const { chaveDoVerbete, escolaDoRegisto, musicaDaChave, registosDaEscola } = nucleo;

function validarVerbete(verbete, alfabeto, vocabulario, musicaDeclarada) {
  const erros = [];
  /* O DESACORDO ENTRE A MÚSICA E A DECOMPOSIÇÃO NÃO RECUSA — AVISA (03/11/2026).
   *
   * Era `erros.push`, e o efeito era o oposto do pedido: ela mudou a música de um verbete que já
   * tinha trechos e a gravação recusou com «sobram 8 tempos» — o trabalho da decomposição ficava
   * preso entre uma música que já não é a dela e uma gravação que não passa. A regra nova, nas
   * palavras dela: a música edita-se sempre; se divergir da decomposição, **o sistema não apaga
   * o trabalho** — mostra um alerta e deixa a decisão a quem ensina.
   *
   * O que continua a RECUSAR é o que é do verbete consigo mesmo: a célula sem sinais, o `cobre`
   * que não bate com a soma das pistas, a direção que não existe na gramática. Isso é erro de
   * dado; a divergência com a música é uma decisão pedagógica em aberto.
   */
  const avisos = [];
  if (!verbete || typeof verbete !== 'object') return { ok: false, erros: ['o verbete não é um objeto'], avisos: [] };
  // O BALDE VAZIO SAI ANTES DE SE CONTAR SEJA O QUE FOR. Ver `semBaldesVazios`.
  verbete = semBaldesVazios(verbete);

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
      // UM BALDE VAZIO JÁ NÃO CHEGA AQUI — `semBaldesVazios` tira-o à entrada (02/11/2026). O que
      // resta a acusar é a chave que não é uma lista, e é ela que esta guarda serve agora.
      if (!Array.isArray(celulas[d])) {
        erros.push((d ? 'a direção «' + d + '»' : 'o trecho sem direção') + ' não tem célula');
      }
    }
    const conhecidos = sinaisDo(alfabeto);
    const categorias = (alfabeto && alfabeto.categorias) || [];
    for (const d of dirs) {
      for (const c of (Array.isArray(celulas[d]) ? celulas[d] : [])) {
        if (!c || typeof c !== 'object') { erros.push('célula inválida ' + ondeEsta(d)); continue; }
        if (!CONTAGEM.test(String(c.contagem || '').trim())) {
          erros.push(ondeEsta(d) + ': contagem inválida «' + (c.contagem || '') + '» (use «1–2» ou «3»)');
        }
        // A REPETIÇÃO É DA CÉLULA, e é um inteiro positivo ou não existe (02/11/2026). Um `0` ou
        // um `2.5` gravado aqui desaparecia da conta em silêncio — e a conta é o que fecha a
        // música, logo o silêncio saía como um verbete que não fecha sem ninguém saber porquê.
        if (c.repeticoes != null && c.repeticoes !== '') {
          const r = Number(c.repeticoes);
          if (!Number.isInteger(r) || r < 1) {
            erros.push(ondeEsta(d) + ': repetição inválida «' + c.repeticoes + '» (use um inteiro ≥ 1)');
          }
        }
        /* A ORDEM DO TRECHO, quando existe, é um inteiro positivo (10/11/2026). É ela que diz a
         * sequência da decomposição — e a leitura trata o que não serve como «sem ordem», que é a
         * posição antiga. Sem esta guarda, um `ordem: 2.5` ou `ordem: "três"` gravado por um
         * pedido forjado ficava no ficheiro a parecer uma declaração: a tela ordenava-o como se
         * não estivesse lá, e ninguém sabia porquê. O válido é o que a leitura entende. */
        if (c.ordem != null && c.ordem !== '') {
          const o = Number(c.ordem);
          if (!Number.isInteger(o) || o < 1) {
            erros.push(ondeEsta(d) + ': ordem do trecho inválida «' + c.ordem + '» (use um inteiro ≥ 1)');
          }
        }
        // A NOTAÇÃO VEM DE DOIS CAMPOS (28/10/2026): `categoria` e `sinais`. O `bloco` de texto
        // deixou de existir no dado — «bloco» já queria dizer Solo · Barra · Centro, e pedir a
        // notação escrita à mão era pedir o código de cabeça. A validação compõe-na e confere-a
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
    // O QUE O VERBETE OCUPA É A MAIOR PISTA (02/11/2026). A mensagem mostra as duas contas quando
    // elas divergem — sem isso, quem lesse «a maior pista tem 8» e visse 12 células somadas
    // pensaria que a conta está errada, e a conta certa é a das pistas.
    // UMA CHAVE QUE NÃO É LISTA NÃO SE SOMA — e o erro dela já está registado acima. Aqui a conta
    // salta-a, em vez de rebentar: o `reduce` sobre uma string lança, e a validação é a última
    // coisa que pode falhar de forma opaca, porque é ela que diz o que está mal.
    const soma = coberturaDe(celulas);
    const somaLinear = dirs
      .filter((d) => Array.isArray(celulas[d]))
      .reduce((t, d) => t + celulas[d].reduce((u, c) => u + temposDaCelula(c), 0), 0);
    if (verbete.cobre == null) erros.push('o verbete tem de declarar `cobre` (quantos tempos ocupa)');
    else if (Number(verbete.cobre) !== soma) {
      erros.push('`cobre` diz ' + verbete.cobre + ' tempos e a maior pista tem ' + soma
        + (somaLinear !== soma ? ' (a soma em linha daria ' + somaLinear + ')' : ''));
    }

    /* AS CÉLULAS TÊM DE FECHAR A MÚSICA — E DESDE 03/11/2026 ISSO É UM AVISO, NÃO UMA RECUSA.
     *
     * DEFEITO MEDIDO (02/11/2026), e é ele que a pesquisadora viu na Aula 01: o `Battement fondu`
     * está gravado em «2|4/4» com células que somam 6 tempos, e o `Plié` em «8|4/4» com células
     * que somam 12. Os dois passaram a gravação porque a única igualdade que se conferia era
     * `cobre` contra a soma das células — uma conta que o formulário faz de si para si. A MÚSICA,
     * que é a chave do verbete, não era comparada com nada.
     *
     * A CORRECÇÃO DE 02/11 FOI RECUSAR, E ERA DEMAIS (03/11/2026). Ela pediu para mudar a música
     * de um verbete que já tinha trechos, e a gravação recusou: o trabalho da decomposição ficava
     * preso entre uma música que já não é a dele e uma gravação que não passa. A regra nova é a
     * dela: a música edita-se sempre; quando diverge, o sistema **não apaga nada** e mostra um
     * alerta — quem decide como resolver é quem ensina.
     *
     * O aviso NOMEIA as duas hipóteses, porque são as duas que existem: ou a música declarada é
     * outra, ou falta (ou sobra) um trecho. Não escolhe por quem grava — e não diz «passo 2» nem
     * «passo 3»: os números dos passos são da TELA, e este módulo não os conhece.
     *
     * `musicaDeclarada` é opcional: as provas chamam `validarVerbete` sem ela, e o que já está
     * gravado continua a ler-se. */
    if (musicaDeclarada) {
      const tempos = Number(String(musicaDeclarada).split('|')[0]);
      if (Number.isFinite(tempos) && tempos > 0 && soma !== tempos) {
        avisos.push('as células somam ' + soma + ' tempos e a música «' + musicaDeclarada
          + '» declara ' + tempos + ' — '
          + (soma < tempos ? 'faltam ' + (tempos - soma) : 'sobram ' + (soma - tempos))
          + '. Ou a música está errada, ou falta um trecho.');
      }
    }
  }

  // O MÉTODO DECLARADO NO VERBETE (02/11/2026) é uma SOBREPOSIÇÃO, não uma segunda verdade: o
  // plano já declara «Metodologia de referência» (obrigatório), e é de lá que o ciclo inteiro
  // herda. O verbete só o repete quando este exercício foge ao método do ciclo — e a chave
  // vazia quer dizer «herda». Um método novo é uma linha de texto, como no plano: não há lista
  // fechada a recusar a escola que trabalha de outra maneira.
  if (verbete.metodo != null && String(verbete.metodo).trim() && String(verbete.metodo).length > 40) {
    erros.push('o método declarado no verbete tem mais de 40 caracteres — é um nome, não uma frase');
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

  // O `soma` QUE SE DEVOLVE É O DA RÉGUA (02/11/2026). Havia aqui uma QUARTA soma em linha —
  // `somaTempos` —, que não decidia nada mas informava quem lia a resposta: o `Plié` de pernas 8 e
  // braços 4 respondia «soma: 12» e era aceite com 8. É a mesma família do número em quatro
  // sítios; a diferença é que este não bloqueava, só mentia. Saiu.
  return { ok: erros.length === 0, erros, avisos, soma: coberturaDe((verbete && verbete.celulas) || {}) };
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

/**
 * QUANTAS VEZES A CÉLULA ACONTECE (02/11/2026). O `repeticoes` é da célula, e a `contagem` é a de
 * UMA execução: o que a célula ocupa é o produto. A conta é a mesma do motor — se divergissem, o
 * CRUD deixaria entrar um verbete que a geração recusa, que é o defeito que a validação existe
 * para não ter.
 */
function repeticoesDaCelula(celula) {
  const n = Number((celula && celula.repeticoes) || 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function temposDaCelula(celula) {
  return temposDaContagem(celula && celula.contagem) * repeticoesDaCelula(celula);
}

/**
 * AS PISTAS, POR CATEGORIA (02/11/2026). É a régua que substituiu a soma em linha: `Perna` e
 * `Braço` correm em paralelo, `à frente` e `atrás` somam-se. O que o verbete ocupa da música é a
 * pista MAIS LONGA. Sem isto, o `Plié` (pernas 8, braços 4) fechava em 12 numa música de 8 e era
 * recusado — o dado estava certo, a conta é que não.
 */
function pistasDe(celulas) {
  const pistas = new Map();
  for (const d of Object.keys(celulas || {})) {
    for (const c of (celulas[d] || [])) {
      const chave = String((c && c.categoria) || '').trim() || '(sem categoria)';
      pistas.set(chave, (pistas.get(chave) || 0) + temposDaCelula(c));
    }
  }
  return pistas;
}

function coberturaDe(celulas) {
  let maior = 0;
  for (const t of pistasDe(celulas).values()) if (t > maior) maior = t;
  return maior;
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

/**
 * A PROGRESSÃO — a ORDEM dos níveis e a relação nível↔termo (02/11/2026).
 *
 * Ela já existia no repositório desde o início (`progressao.json`), mas nenhuma rota a lia: o
 * plano recebia o «conteúdo do nível» do KV, semeado por `catalogo-seed`, e o syllabus não tinha
 * por onde saber a ordem. O produto «syllabus» precisa das duas coisas — a ordem e a relação —, e
 * é isso que esta leitura serve.
 *
 * O CAMINHO É O DA MODALIDADE, ao lado do alfabeto e do vocabulário: um catálogo é uma pasta, e
 * quem acrescentar uma modalidade nova não tem de editar uma lista de caminhos.
 */
async function lerProgressao({ f, token, dono, repo, ref, modalidade }) {
  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/';
  const url = raiz + pastaDaModalidade(modalidade) + '/progressao.json'
    + (ref ? '?ref=' + encodeURIComponent(ref) : '');
  try {
    const lido = await lerDoRepo({ f, url, h: cabecalhos(token) });
    if (!lido.existe) {
      return { ok: false, status: 404, erro: 'a progressão da modalidade «' + modalidade + '» não existe' };
    }
    return { ok: true, sha: lido.sha, dados: JSON.parse(lido.texto) };
  } catch (erro) {
    return { ok: false, status: erro.status || 502, erro: erro.message };
  }
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
function listarVerbetes(dados, escola) {
  const verbetes = (dados && dados.verbetes) || {};
  return Object.keys(verbetes)
    .filter((nome) => !nome.startsWith('_'))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((nome) => ({
      nome: nome,
      musicas: Object.keys(verbetes[nome] || {}),
      // A MARCA DE DESCONTINUADO VIVE EM CADA MÚSICA (31/10/2026). Ela era lida no topo do
      // verbete, onde nunca está — e por isso um verbete descontinuado nunca aparecia como tal.
      descontinuado: Object.values(registosDaEscola(verbetes[nome], escola))
        .some((v) => Boolean(v && v.descontinuado)),
      posicao: primeiraPosicao(verbetes[nome], escola),
      trechos: contarTrechos(verbetes[nome], escola),
      direcoes: direcoesDoVerbete(verbetes[nome], escola),
      compassos: compassosDoVerbete(verbetes[nome], escola),
      porMusica: detalhePorMusica(nome, verbetes[nome], escola, dados),
      /* QUANDO ESTE VERBETE FOI AJUSTADO PELA ÚLTIMA VEZ (18/11/2026).
       *
       * «Essa etiqueta de ajustado em […] tem que existir […] também na de professores, na de salas,
       * na de audição, na de estilo e na de turma.» No estilo, o ajuste tem nome e lugar próprios: é
       * a gravação de um verbete que já compõe o repertório de uma turma, e o que ela deixa é o
       * estado anterior em `versoes[]`, com a data em que deixou de valer (`ate`). Essa data É a data
       * do ajuste — não há uma segunda a manter em sincronia.
       *
       * O MAIOR `ate` de todos os registos do verbete: um exercício tem N músicas, cada uma com o
       * seu histórico, e a etiqueta da linha fala do exercício. Sem histórico nenhum não se escreve
       * a etiqueta — um verbete corrigido no lugar nunca foi ajustado, e dizer que sim seria a
       * mesma mentira que a lista das alunas contava antes de hoje. */
      ajustadaEm: (() => {
        let quando = '';
        for (const registo of Object.values(registosDaEscola(verbetes[nome], escola))) {
          for (const v of (Array.isArray(registo && registo.versoes) ? registo.versoes : [])) {
            const dia = String((v && v.ate) || '').slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(dia) && dia > quando) quando = dia;
          }
        }
        return quando || null;
      })(),
    }))
    /* UM EXERCÍCIO SEM MÚSICA VISÍVEL NÃO ENTRA NA LISTA (03/11/2026). Desde que o alfabeto guarda
     * o verbete de cada escola, há exercícios que existem só do outro lado: o verbete da `breu` não
     * está na vista da `maria`. Sem este filtro a `maria` veria «Battement tendu» sem música
     * nenhuma, e a lista que se chama «exercícios com verbete» mostraria um sem verbete. */
    .filter((x) => x.porMusica.length > 0);
}

/**
 * CADA MÚSICA É UM VERBETE, E TEM DE PODER ABRIR-SE (02/11/2026).
 *
 * O sintoma que isto corrige é o do dia em que a duplicação foi usada a sério: ela duplicou o
 * `Plié` de 8 para 16 tempos, gravou — e a versão 17 do alfabeto ficou com as duas músicas —, mas
 * a listagem dizia só «2 músicas» e o «editar» abria sempre `Object.keys(musicas)[0]`, isto é,
 * **sempre a primeira**. A música nova existia no ficheiro, era contada na etiqueta, e **não tinha
 * porta**: nenhum sítio da tela a mostrava. Gravar e não conseguir voltar a ver é a mesma coisa que
 * não ter gravado.
 *
 * O que sai daqui é o que a listagem precisa para fazer **uma linha por música** — a chave, os
 * tempos, o compasso, os trechos, as direções e as categorias. Tudo derivado: não há um segundo
 * dado a manter ao lado do alfabeto.
 */
function detalhePorMusica(nome, musicas, escola, alfabeto) {
  const vistos = registosDaEscola(musicas, escola);
  return musicasDoVerbete(musicas, escola).map((chave) => {
    const m = vistos[chave] || {};
    const celulas = m.celulas || {};
    const direcoes = [];
    const orientacoes = [];
    const categorias = [];
    let trechos = 0;
    for (const dir of Object.keys(celulas)) {
      if (!Array.isArray(celulas[dir])) continue;
      trechos += celulas[dir].length;
      // A ORIENTAÇÃO É O OUTRO EIXO (02/11/2026) — «de frente», «pernas cruzadas». Ela não muda a
      // direção e não se deduz dela; a etiqueta diz as duas porque são as duas perguntas que se
      // faz a um trecho. A omissão quer dizer «de frente», e é omitida como no documento.
      for (const c of celulas[dir]) {
        const o = String((c && c.orientacao) || '').trim();
        if (o && orientacoes.indexOf(o) === -1) orientacoes.push(o);
      }
      // A DIREÇÃO VAZIA NÃO SE ESCREVE: a célula sem direção é o trecho que ainda não foi
      // arrumado num dos três lados, e escrever «» na etiqueta deixaria um separador solto.
      if (dir && celulas[dir].length && direcoes.indexOf(dir) === -1) direcoes.push(dir);
      for (const c of celulas[dir]) {
        const cat = String((c && c.categoria) || '').trim();
        if (cat && categorias.indexOf(cat) === -1) categorias.push(cat);
      }
    }
    const [tempos, compasso] = String(chave).split('|');
    // A LEITURA É UMA SÓ, e é dela que saem as linhas e o motivo (03/11/2026).
    const leitura = lerLinhas(nome, chave, m, alfabeto, escola);
    return {
      chave: chave,
      // DE QUEM É ESTA VERSÃO: vazio = catálogo, um slug = a escola. A tela mostra-o para ninguém
      // confundir a edição da escola com o catálogo que se vende.
      // …e a chave de ARMAZENAMENTO, com o dono: é ela que a edição e o apagar têm de usar para
      // não tocar na versão do catálogo quando a da escola é que está à vista.
      chaveGravada: musicas[chaveDoVerbete(chave, escola)] ? chaveDoVerbete(chave, escola) : chave,
      escola: (musicas[chaveDoVerbete(chave, escola)] ? escola : '') || null,
      tempos: Number(tempos) || 0,
      compasso: compasso || '',
      cobre: Number(m.cobre) || 0,
      trechos: trechos,
      direcoes: direcoes,
      orientacoes: orientacoes,
      categorias: categorias,
      // A LEITURA USA O ALFABETO QUE VEIO DO REPOSITÓRIO, e a vista da escola (03/11/2026).
      linhas: leitura.linhas,
      // E QUANDO A COMPOSIÇÃO NÃO FECHA, DIZ-SE PORQUÊ E MOSTRAM-SE OS TRECHOS ASSIM MESMO —
      // «não pôde ser lida» sem motivo mandava a pessoa procurar um defeito que pode ser só uma
      // música mal declarada, e escondia um trabalho que está gravado e é legível.
      motivo: leitura.motivo,
    };
  });
}

/**
 * A DECOMPOSIÇÃO EM LEITURA — as mesmas linhas da tabela do passo 6.
 *
 * A listagem mostra o cartão com três caixinhas, e a da notação abre o exercício trecho a trecho.
 * Essas linhas NÃO se calculam aqui: quem as calcula é o motor (`compor`), e é a mesma função que
 * a página e o documento usam. Uma segunda conta do compasso divergiria à primeira repetição —
 * este projeto já pagou esse preço quatro vezes num só dia.
 *
 * O que o motor precisa é uma LINHA DE PLANO, e a listagem não tem plano nenhum: ela tem o nome do
 * exercício e a música dele. A linha é sintética e só diz isso — nenhum objetivo inventado, e é
 * por isso que o `Objetivo específico` não vai.
 *
 * TRÊS DEFEITOS CORRIGIDOS A 03/11/2026, e o terceiro é o que ela viu na tela:
 *
 *  1. **O alfabeto era o do BUNDLE, e não o que veio do repositório.** A função fazia
 *     `require('../nucleo/notacao.js').ALFABETOS[...]` — o JSON embutido no Worker no build. Quem
 *     acabou de gravar um verbete via na listagem a versão ANTERIOR (ou nada, se o verbete é novo e
 *     o bundle ainda não o tem). Agora recebe o alfabeto que `lerModalidade` acabou de ler.
 *  2. **A escola não ia na composição.** Desde 03/11 o verbete de uma escola vive em
 *     `8|2/4@breu`; compor sem a escola procurava a do catálogo, não a encontrava e devolvia
 *     `musica-nao-coberta`. Era o «A decomposição deste exercício não pôde ser lida» com dois
 *     trechos gravados na tabela.
 *  3. **Uma leitura que falhasse apagava o dado à vista.** Agora, quando o motor não compõe, a
 *     listagem cai para os TRECHOS GRAVADOS — que existem e são legíveis — e leva o motivo junto.
 *     Um trabalho gravado não desaparece da tela por causa de uma conta que não fecha.
 *
 * O QUE NÃO SE FAZ NO RECURSO: inventar compasso. Quando a leitura vem dos trechos gravados, o
 * compasso é o DERIVADO da acumulação (a mesma régua do `segmentosDe`, por pista), e não o número
 * que a pessoa escreveu na contagem — mas a CONTAGEM que ela escreveu vai na linha, ao lado. É a
 * diferença entre «não sei onde cai» e «sei o que está escrito».
 */
function lerLinhas(nome, chave, registo, alfabeto, escola) {
  const vazio = { linhas: [], motivo: '' };
  if (!nome) return vazio;
  const { compor, segmentosDe } = require('../nucleo/notacao.js');
  const [tempos, compasso] = String(chave).split('|');
  let composto = null;
  try {
    composto = compor({
      'Bloco': 'Solo',
      'Conteúdo do nível': nome,
      'Tempos': tempos,
      'Compasso': compasso,
    }, alfabeto, '', escola);
  } catch (e) {
    composto = null;
  }
  /* A LINHA DA LISTAGEM — uma forma só, para o motor e para o recurso (03/11/2026).
   *
   * A FRASE DO TRECHO É A PRIMEIRA LINHA DA DESCRIÇÃO — o que acontece. A segunda é o «lê-se»,
   * que já está escrito nos sinais ao lado; repeti-lo ocuparia o dobro sem dizer nada de novo.
   *
   * E A REPETIÇÃO PASSA A IR NA LINHA. Ela existe na célula (`repeticoes`, «este trecho acontece
   * 2×») desde 02/11, mas ficava de fora desta vista — a listagem mostrava «1–2» e escondia que
   * são duas vezes. A tabela passou a ter uma coluna de contagem, e uma contagem que omite a
   * frequência não é a contagem: é metade dela. */
  const linhaDe = (seg) => ({
    compasso: seg.compasso,
    contagem: seg.contagem,
    repeticoes: Number(seg.repeticoes) || 1,
    categoria: seg.categoria,
    sinais: (seg.sinais || []).join(' '),
    descricao: String(seg.descricao || '').split('\n')[0],
  });
  const doMotor = ((composto && composto.segmentos) || []).map(linhaDe);
  if (doMotor.length) {
    /* A COMPOSIÇÃO FECHOU PARCIALMENTE, E ISSO DIZ-SE (03/11/2026). Um verbete que cobre 4 dos 8
     * tempos compõe as linhas que tem e declara o resto — e é isso que a listagem passa a dizer,
     * em vez de mostrar a tabela como se estivesse tudo lá. Não é erro: é a lacuna, nomeada. */
    const resto = Number(composto && composto.restoTempos) || 0;
    const motivo = resto > 0 ? String((composto && composto.detalhe) || 'os trechos não cobrem a música toda') : '';
    return { linhas: doMotor, motivo: motivo };
  }

  /* O RECURSO: os trechos GRAVADOS, lidos como estão. A ordem é a das pistas — o mesmo relógio do
   * `segmentosDe` —, e o compasso sai da acumulação dentro de cada pista. O numerador vem do
   * compasso da música; sem ele, 4. */
  const numerador = Number(String(compasso || '4/4').split('/')[0]) || 4;
  const segmentos = segmentosDe(registo, numerador);
  const linhas = segmentos.map(linhaDe);
  const motivo = linhas.length
    ? 'Os trechos estão gravados, mas o motor não compõe esta música'
      + (composto && composto.detalhe ? ': ' + composto.detalhe : '') + '.'
    : 'Não há trecho nenhum gravado nesta música.';
  return { linhas: linhas, motivo: motivo };
}


/**
 * AS MÚSICAS QUE UMA ESCOLA VÊ — uma por música, já sem o dono (03/11/2026).
 *
 * Era `Object.keys(musicas).filter(/^\d+\|/)`, e com o dono na chave passaria a devolver duas
 * entradas para a mesma música (`8|4/4` e `8|4/4@breu`). A vista é a de `registosDaEscola`: o
 * catálogo mais o que é da escola, com o dela a vencer — é o que a listagem mostra e o que a conta
 * dos trechos soma.
 */
function musicasDoVerbete(musicas, escola) {
  return Object.keys(registosDaEscola(musicas, escola)).sort((a, b) => {
    const [ta, ca] = a.split('|');
    const [tb, cb] = b.split('|');
    if (ca !== cb) return String(ca).localeCompare(String(cb));
    return Number(ta) - Number(tb);
  });
}

function contarTrechos(musicas, escola) {
  let total = 0;
  const vistos = registosDaEscola(musicas, escola);
  for (const chave of musicasDoVerbete(musicas, escola)) {
    const celulas = (vistos[chave] && vistos[chave].celulas) || {};
    for (const dir of Object.keys(celulas)) {
      if (Array.isArray(celulas[dir])) total += celulas[dir].length;
    }
  }
  return total;
}

function direcoesDoVerbete(musicas, escola) {
  const ordem = [];
  const vistos = registosDaEscola(musicas, escola);
  for (const chave of musicasDoVerbete(musicas, escola)) {
    const celulas = (vistos[chave] && vistos[chave].celulas) || {};
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

function compassosDoVerbete(musicas, escola) {
  const vistos = [];
  for (const chave of musicasDoVerbete(musicas, escola)) {
    const compasso = String(chave).split('|')[1] || '';
    if (compasso && vistos.indexOf(compasso) === -1) vistos.push(compasso);
  }
  return vistos;
}

function primeiraPosicao(musicas, escola) {
  const vistos = registosDaEscola(musicas, escola);
  for (const chave of Object.keys(vistos)) {
    const v = vistos[chave];
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
async function gravarVerbete({ f, token, dono, repo, ref, modalidade, nome, musica, musicaAnterior,
  verbete, acao, vinculado, vigenteDe, motivo, escola }) {
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

  /* CRIAR RECUSA O QUE JÁ EXISTE — DO MESMO DONO (03/11/2026). Era por EXERCÍCIO, e com o alfabeto
   * a guardar a versão de cada escola isso impedia o que a decisão quer: a escola declarar o seu
   * verbete de um exercício que o catálogo já decompõe — que é o caso normal, porque o vocabulário
   * é o do catálogo. A guarda passa a ser (dono, música), e é feita lá em baixo, onde a chave já
   * se conhece. */
  if (acaoLimpa !== 'criar' && !existe) {
    return { ok: false, status: 404, erro: '«' + nomeLimpo + '» não existe' };
  }

  let mensagem = '';
  // O AJUSTE NASCE AQUI, E NÃO DENTRO DO `else` (02/11/2026). Declarado lá dentro, ele morria com
  // o bloco e a resposta não o podia dizer — um `let` de bloco não dá erro de sintaxe, dá
  // `ReferenceError` em execução, e só na resposta.
  let ajustou = null;
  // OS AVISOS DA VALIDAÇÃO (03/11/2026) — o que não impede a gravação mas tem de chegar à tela.
  // Declarado ao lado de `ajustou` e pela mesma razão: um `let` de bloco morre com o bloco, e a
  // resposta é construída fora dele.
  let avisosGravacao = [];
  if (acaoLimpa === 'descontinuar' || acaoLimpa === 'retomar') {
    const marcar = acaoLimpa === 'descontinuar';
    // A MARCA VALE PARA O EXERCÍCIO INTEIRO, em todas as músicas que ele declara: o exercício é
    // um só, e o que se descontinua é ele, não uma das suas durações.
    //
    // MAS SÓ NOS REGISTOS DO MESMO DONO (03/11/2026). Com o alfabeto a guardar o verbete de cada
    // escola, marcar todas as chaves descontinuaria também a versão do catálogo — e o catálogo que
    // se vende passaria a dizer que um exercício acabou por causa de uma escola.
    const meuDono = String(escola || '').trim();
    for (const chave of Object.keys(dados.verbetes[nomeLimpo] || {})) {
      if (escolaDoRegisto(chave) !== meuDono) continue;
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
    avisosGravacao = conferido.avisos || [];

    // O QUE SE GRAVA NÃO LEVA `direcoes` (28/10/2026). Se um pedido antigo — ou uma página em
    // cache — o enviar, ele não entra no ficheiro: o campo deixou de existir no dado, e o que o
    // alimentava era a mesma lista das chaves de `celulas`. Uma gravação não pode ressuscitá-lo,
    // senão a segunda lista volta pela porta de trás.
    // E O BALDE VAZIO TAMBÉM NÃO (02/11/2026). A validação já o ignora, mas o que se ESCREVE é o
    // corpo que chegou — e gravar `devant: []` era deixar no ficheiro um balde invisível que o
    // próximo editor carregava de volta e o motor recusava como `verbete-incompleto`. Uma coisa é
    // aceitar o pedido, outra é guardar o lixo dele.
    const limpo = Object.assign({}, semBaldesVazios(verbete));
    delete limpo.direcoes;
    // O HISTÓRICO NÃO VEM DO PEDIDO (02/11/2026) — quem o escreve é este módulo, a partir do que
    // está gravado. Aceitá-lo do corpo deixaria uma página antiga (ou um pedido forjado) apagar o
    // passado substituindo `versoes` pelo que lhe apetecesse, que é o contrário do que ele existe
    // para guardar.
    delete limpo.versoes;
    dados.verbetes[nomeLimpo] = dados.verbetes[nomeLimpo] || {};
    /* A CHAVE LEVA O DONO (03/11/2026). `escola` vazia grava na chave do catálogo (`8|4/4`); um
     * slug grava ao lado (`8|4/4@breu`). É o que impede a edição de uma escola de sobrescrever o
     * catálogo — e o que faz a `compor` da escola preferir a dela. O campo `escola` vai também
     * DENTRO do registo, como no vocabulário: a chave é a identidade, o campo é a leitura. */
    const minhaEscola = String(escola || '').trim();
    const chaveGravada = chaveDoVerbete(chaveMusica, minhaEscola);
    if (acaoLimpa === 'criar' && Object.prototype.hasOwnProperty.call(dados.verbetes[nomeLimpo], chaveGravada)) {
      return { ok: false, status: 409,
        erro: '«' + nomeLimpo + '» (' + chaveMusica + ') já está no alfabeto'
          + (minhaEscola ? ' desta escola' : ' do catálogo') + ' — edite o verbete existente' };
    }
    if (minhaEscola) limpo.escola = minhaEscola; else delete limpo.escola;

    /* A MÚSICA DE ONDE SE VEIO SAI — E É ISSO QUE FAZ DO «GRAVAR» UMA SUBSTITUIÇÃO (02/11/2026).
     *
     * O DEFEITO MEDIDO: ela duplicou o `Plié` de 8 para 16 tempos e gravou; o alfabeto ficou com
     * `8|4/4` e `16|4/4`. Não era `INSERT` — a chave do registo é `<tempos>|<compasso>`, e mudar
     * os tempos muda a chave. O registo antigo ficava ao lado, e ela leu-o como duplicação.
     *
     * A regra fica: numa EDIÇÃO, a música de onde se veio sai. Quem quer as duas manda
     * `musicaAnterior` vazio, e é uma escolha explícita da tela («guardar como música nova»).
     *
     * AS GUARDAS, e todas importam:
     *  · só numa edição (`acaoLimpa !== 'criar'`) — criar não tem de onde vir;
     *  · só se a chave for válida e DIFERENTE da nova — apagar a chave que se acabou de escrever
     *    seria perder o trabalho todo;
     *  · só se ela existir — uma segunda gravação da mesma sessão manda a antiga outra vez, e um
     *    `delete` de uma chave inexistente é inofensivo, mas não deve entrar na mensagem;
     *  · e só se ela estiver VAZIA de outra coisa: o que sai é uma música, não o verbete. Se for
     *    a última, o exercício fica sem nenhuma — e isso é o mesmo que apagá-lo, que esta casa
     *    recusa (não há `DELETE`). Nesse caso a substituição faz-se, mas o verbete fica com a
     *    música nova; nunca fica com zero.
     */
    let substituiu = '';
    const anterior = String(musicaAnterior || '').trim();
    const anteriorGravada = chaveDoVerbete(anterior, minhaEscola);
    if (acaoLimpa !== 'criar' && anterior && anterior !== chaveMusica && MUSICA.test(anterior)
      && dados.verbetes[nomeLimpo]
      && Object.prototype.hasOwnProperty.call(dados.verbetes[nomeLimpo], anteriorGravada)) {
      delete dados.verbetes[nomeLimpo][anteriorGravada];
      substituiu = anterior;
    }

    /* O AJUSTE: UM VERBETE EM USO NÃO SE REESCREVE POR BAIXO DO DOCUMENTO (02/11/2026).
     *
     * O QUE ELA PEDIU: «antes de executar UPDATE em um verbete, verifique se ele possui vínculos
     * (…) Se houver vínculo, bloqueie a exclusão e force a criação de um ajuste/nova versão para
     * preservar o histórico», e «não altera a versão congelada em uso nos planos/turmas».
     *
     * O QUE ISTO FAZ, e o que NÃO faz. O estado anterior NÃO se perde: ele passa para
     * `versoes[]`, com a data em que deixou de valer (`ate`) e o motivo. O estado corrente
     * continua no topo, e é o que o editor e a listagem mostram — um verbete sem histórico não
     * tem `versoes` nenhum, e por isso os que já existem continuam a ler-se como antes.
     *
     * E O DOCUMENTO DEIXA DE MUDAR: `compor` passou a receber a data do envelope, e escolhe o
     * estado que valia NAQUELE dia (`estadoDoVerbete`). Um plano de ontem continua a sair com o
     * texto de ontem; um plano novo sai com o de hoje.
     *
     * `vinculado` vem de FORA, e de propósito: quem sabe se o exercício compõe um plano é o
     * `bastidores.js`, que já faz essa leitura para a guarda do `DELETE`. O `verbete.js` não fala
     * com o acervo, e não passa a falar.
     */
    const anteriorRegisto = dados.verbetes[nomeLimpo] && dados.verbetes[nomeLimpo][chaveGravada];
    if (vinculado && anteriorRegisto && typeof anteriorRegisto === 'object'
      && anteriorRegisto.celulas && Object.keys(anteriorRegisto.celulas).length) {
      const quando = String(vigenteDe || '').trim() || new Date().toISOString().slice(0, 10);
      const historico = (Array.isArray(anteriorRegisto.versoes) ? anteriorRegisto.versoes : []).slice();
      // O QUE SE GUARDA É O ESTADO, NÃO A LISTA DELA. `versoes` dentro de `versoes` seria o
      // histórico do histórico, e o `estadoDoVerbete` só precisa de um nível.
      historico.push({
        ate: quando,
        cobre: anteriorRegisto.cobre,
        posicao: anteriorRegisto.posicao || null,
        metodo: anteriorRegisto.metodo || undefined,
        celulas: anteriorRegisto.celulas,
        motivo: String(motivo || 'ajuste do verbete').trim(),
      });
      limpo.versoes = historico;
      ajustou = quando;
    }

    dados.verbetes[nomeLimpo][chaveGravada] = limpo;
    mensagem = (acaoLimpa === 'criar' ? 'feat(notacao): declarar «' : 'docs(notacao): editar «')
      + nomeLimpo + '» (' + chaveMusica + ') no alfabeto ' + modalidade;
    if (substituiu) mensagem += ' — substitui a música ' + substituiu;
    if (ajustou) mensagem += ' — ajuste: a versão anterior (até ' + ajustou + ') fica no histórico';
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
  return { ok: true, status: 200, versao: dados.versao, commit: escrita.commit, mensagem: mensagem,
    /* O AJUSTE VAI NA RESPOSTA (02/11/2026). A tela tem de o DIZER: quem corrigiu um verbete que
     * já compõe um plano precisa de saber que a correcção não reescreveu o passado — se não, ou
     * pensa que o documento antigo mudou, ou pensa que a correcção não pegou. */
    ajustou: ajustou || null,
    /* E OS AVISOS TAMBÉM (03/11/2026). O desacordo entre a música e a decomposição grava-se, mas
     * não se cala: a tela mostra o alerta e a listagem passa a marcar o verbete. Uma gravação que
     * aceita em silêncio o que depois recusa no documento é a pior das duas. */
    avisos: (typeof avisosGravacao !== 'undefined' ? avisosGravacao : []) };
}

/**
 * APAGAR UM VERBETE (02/11/2026) — a pedido dela: «faltou fazer o verbo deletar o verbete».
 *
 * A REGRA QUE CAI, E O QUE ELA CUSTAVA. Até hoje não havia `DELETE`: um verbete descontinuava-se,
 * e o passado que o citou continuava a poder ler-se de volta (P-03/P-04). A regra estava certa
 * como princípio e errada como produto — sem apagar, um exercício escrito por engano fica no
 * alfabeto para sempre, aparece em todas as listas e nunca se pode corrigir. Ela decidiu; o
 * `REGISTRO.md` guarda o motivo e a consequência.
 *
 * A CONSEQUÊNCIA, e é declarada na tela antes de acontecer: uma aula PUBLICADA que citava este
 * exercício passa a sair em lacuna («o exercício não tem verbete»), porque a notação dela já não
 * existe. Não se apaga o documento — apaga-se a leitura dele. Quem apaga escolhe isso.
 *
 * O QUE **NÃO** SE APAGA: o termo do vocabulário. O verbete é a DECOMPOSIÇÃO de um exercício; o
 * exercício é um termo do dicionário, com a sua definição e a sua fonte, e apagá-lo é outra
 * operação (a rota do vocabulário) com outras guardas. Aqui sai a notação; a palavra fica.
 */
async function apagarVerbete({ f, token, dono, repo, ref, modalidade, nome, escola }) {
  if (!token) return { ok: false, status: 401, erro: 'sem token do repositório' };
  const nomeLimpo = String(nome || '').trim();
  if (!nomeLimpo) return { ok: false, status: 400, erro: 'informe o nome do exercício' };
  if (nomeLimpo.startsWith('_')) return { ok: false, status: 400, erro: 'o nome não pode começar por «_»' };

  const lido = await lerModalidade({ f, token, dono, repo, ref, modalidade });
  if (!lido.ok) return { ok: false, status: 404, erro: lido.erro };

  const dados = lido.dados;
  const verbetes = dados.verbetes || {};
  if (!Object.prototype.hasOwnProperty.call(verbetes, nomeLimpo)) {
    return { ok: false, status: 404, erro: '«' + nomeLimpo + '» não tem verbete' };
  }
  /* APAGA-SE O QUE É DE QUEM APAGA (03/11/2026). O `DELETE` apaga o EXERCÍCIO — todas as músicas
   * dele —, e com o alfabeto a guardar a versão de cada escola isso deixaria de ser verdade: um
   * clique na Produção de uma escola apagaria também o verbete do catálogo, que é o que se vende.
   * A regra é a do dono: a escola apaga os registos dela; o catálogo, os do catálogo. Se depois
   * de apagar sobrar alguma música — de outro dono —, o exercício CONTINUA, e a resposta di-lo.
   */
  const meuDono = String(escola || '').trim();
  const minhas = Object.keys(verbetes[nomeLimpo] || {}).filter((k) => escolaDoRegisto(k) === meuDono);
  if (!minhas.length) {
    return { ok: false, status: 409,
      erro: '«' + nomeLimpo + '» não tem verbete deste lado — o que existe é '
        + (meuDono ? 'do catálogo, e não se apaga pela escola' : 'de uma escola, e não se apaga pelo catálogo') };
  }
  for (const chave of minhas) delete verbetes[nomeLimpo][chave];
  const sobraram = Object.keys(verbetes[nomeLimpo] || {}).length;
  if (!sobraram) delete verbetes[nomeLimpo];
  dados.versao = Number(dados.versao || 1) + 1;

  const mensagem = 'chore(notacao): apagar o verbete «' + nomeLimpo + '» no alfabeto ' + modalidade
    + (meuDono ? ' — edição da escola «' + meuDono + '»' : '');
  const h = cabecalhos(token);
  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/';
  const escrita = await gravarNoRepo({
    f, h, url: raiz + caminhoDoAlfabeto(modalidade),
    texto: JSON.stringify(dados, null, 2) + '\n',
    sha: lido.sha, ref: ref,
    mensagem: mensagem + '\n\nApagado pela Produção (Sistema Lastro).\n',
  });
  if (!escrita.ok) {
    return { ok: false, status: escrita.status, erro: 'o repositório recusou a gravação (HTTP ' + escrita.status + ')' };
  }
  return { ok: true, status: 200, versao: dados.versao, commit: escrita.commit, mensagem: mensagem,
    // O QUE FICOU: zero = o exercício saiu; mais = ainda há música de outro dono, e a tela diz de
    // quem. Sem isto, a escola apagava a sua versão e continuava a ver o exercício — a pensar que
    // o apagar não pegou.
    sobraram: sobraram };
}

module.exports = {
  pastaDaModalidade,
  caminhoDoAlfabeto,
  caminhoDoVocabulario,
  lerModalidade,
  lerProgressao,
  listarVerbetes,
  validarVerbete,
  semBaldesVazios,
  gravarVerbete,
  apagarVerbete,
  direcoesConhecidas,
  sinaisDo,
  temposDaContagem,
};
