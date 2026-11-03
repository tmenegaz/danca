'use strict';

/**
 * notacao.js — O MOTOR DO REGISTRO DE NOTAÇÃO.
 *
 * O QUE ELE RESOLVE. A `-notacao.md` saía com `[Preencher: notação do exercício]` em todas as
 * linhas, e o glossário saía com três convenções (`[`, `]`, `:`) e um pedido para preencher os
 * verbetes à mão. O que faltava não era um gerador de texto: era o ALFABETO — sem alfabeto não há
 * sinal, e sem sinal a linha não se escreve.
 *
 * O alfabeto passou a ser DADO (`biblioteca/notacao/*.json`), e este módulo é o que o lê e compõe.
 * A separação não é decorativa: um sinal novo é uma linha de dados que o professor pode ler e
 * corrigir; se fosse código, cada exercício novo seria uma alteração de programa.
 *
 * O QUE ELE RECUSA. Este módulo não inventa. Cada linha do plano cai num de quatro estados, e
 * três deles são lacuna DECLARADA, com o motivo escrito:
 *
 *   · `composto`  — a música está declarada e o alfabeto tem verbete para ela;
 *   · `parcial`   — o verbete cobre parte da música, e o resto fica declarado (16 tempos em 3/4
 *                   têm 12 cobertos e 4 por explicar);
 *   · `lacuna`    — não há música, ou não há verbete, ou o verbete usa um sinal desconhecido, ou
 *                   o verbete está internamente inconsistente.
 *
 * A conta é verificada, e não aproximada: uma linha de 16 tempos em 3/4 NÃO fecha em compassos
 * inteiros, e o documento diz isso em vez de arredondar. Aritmética é onde um documento não pode
 * ser plausível — tem de estar certo.
 *
 * O QUE ELE NÃO É. Não é o sistema Benesh: é um código do ciclo, baseado em conceitos do sistema,
 * e o documento declara-o de si mesmo (P-15). E não é determinístico por acidente: sem relógio,
 * sem aleatoriedade, sem rede — o mesmo plano e o mesmo alfabeto dão sempre o mesmo documento, que
 * é o que a âncora de proveniência exige para poder ser reproduzida.
 */

// Os alfabetos, por MODALIDADE. O `require` é LITERAL — este módulo é empacotado para o Worker,
// e o empacotador não segue um caminho montado em tempo de execução. Uma modalidade nova é uma
// linha aqui e um arquivo em `biblioteca/modalidades/<modalidade>/notacao.json` (28/10/2026: o
// alfabeto saiu de `biblioteca/notacao/`, que era o endereço errado — ele é da modalidade, e a
// notação é só o sistema em que ele se escreve).
const ALFABETOS = {
  'bale-classico': require('../../biblioteca/modalidades/bale-classico/notacao.json'),
};

// O VOCABULÁRIO da modalidade, por modalidade. O alfabeto diz que um SINAL existe; o vocabulário
// diz o NOME dele em palavras, e é do vocabulário que o alfabeto tira os `id` que referencia
// (`premiere-position`, `devant`). Duas cópias dos nomes divergiriam ao primeiro termo novo.
const VOCABULARIOS = {
  'bale-classico': require('../../biblioteca/modalidades/bale-classico/vocabulario.json'),
};

/** A modalidade quando o chamador não a declara. Só há uma publicada — e é declarada, não suposta. */
const MODALIDADE_PADRAO = 'bale-classico';

function slug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Todos os alfabetos publicados, por modalidade — para a Produção listar o que existe. */
function alfabetos() {
  return Object.keys(ALFABETOS).map((modalidade) => ({
    modalidade: modalidade,
    alfabeto: ALFABETOS[modalidade],
  }));
}

/**
 * O alfabeto da NOTAÇÃO DECLARADA pelo plano (P-15/P-16), dentro de uma MODALIDADE.
 *
 * `null` quando não há alfabeto publicado para esse par — e então o derivador escreve o documento
 * como antes, com as convenções e a lacuna. Degradar é melhor do que inventar um código que
 * ninguém declarou.
 *
 * PORQUE A MODALIDADE ENTRA (28/10/2026): o mesmo sinal não significa o mesmo em balé clássico e
 * em dança contemporânea. Enquanto só houver uma modalidade, omiti-la resolve para a padrão — e
 * isso está DECLARADO aqui, não é acidente. No dia em que houver duas, omitir deixa de resolver:
 * um par ambíguo devolve `null`, nunca «a primeira que aparecer».
 */
function paraNotacao(declarada, modalidade) {
  const alvo = slug(declarada);
  if (!alvo) return null;
  const candidatas = modalidade
    ? [slug(modalidade)]
    : Object.keys(ALFABETOS);

  const casam = [];
  for (const m of candidatas) {
    const alfabeto = ALFABETOS[m];
    if (!alfabeto) continue;
    const aceita = (alfabeto.aplicaseA || []).map(slug);
    if (aceita.indexOf(alvo) !== -1) casam.push(alfabeto);
  }
  // Ambíguo não se resolve por sorteio: uma notação que casa com dois alfabetos e chega sem
  // modalidade é uma pergunta sem resposta, e a resposta certa é dizer isso.
  return casam.length === 1 ? casam[0] : null;
}

/**
 * O TERMO DO VOCABULÁRIO, por id, dentro de uma modalidade. `null` quando não existe — e quem
 * chama decide o que fazer com a ausência, em vez de receber um nome inventado.
 */
function termoPorId(alfabeto, id, modalidade) {
  const m = (alfabeto && alfabeto.modalidade) || modalidade || MODALIDADE_PADRAO;
  const vocabulario = VOCABULARIOS[m];
  if (!vocabulario || !id) return null;
  return vocabulario.find((t) => t && t.id === id) || null;
}

/**
 * A POSIÇÃO EM PALAVRAS. `{membro, termo}` → «1ª posição de pés», «3ª posição de braços».
 *
 * EXISTE PORQUE A PROSA NÃO SABIA DIZER A POSIÇÃO (28/10/2026). A página sem notação mostrava
 * «extensão à frente, a ponta no chão» e não dizia em que posição — que é a primeira coisa que se
 * pergunta. O número vem do alfabeto (o glifo), o nome vem do vocabulário, e o membro desempata:
 * «1ª posição» de pés e «1ª posição» de braços não são a mesma coisa.
 */
const MEMBRO_EM_PALAVRAS = { pes: 'pés', pernas: 'pernas', bracos: 'braços' };
// Como o nome de um termo pode já dizer de que membro fala. Inclui o francês porque é nele que os
// termos do balé clássico estão escritos: «bras» é braço, «pied» é pé, «jambe» é perna.
const ALUSOES_AO_MEMBRO = {
  pes: '\\b(p[eé]s?|pieds?|feet)\\b',
  pernas: '\\b(pernas?|jambes?|legs?)\\b',
  bracos: '\\b(bra[cç]os?|bras|arms?)\\b',
};
function posicaoEmPalavras(alfabeto, posicao) {
  if (!posicao || !posicao.termo) return null;
  const termo = termoPorId(alfabeto, posicao.termo);
  if (!termo) return null;
  // O nome do vocabulário já traz o ordinal («Première position»); o membro acrescenta o resto.
  const chave = posicao.membro || termo.membro;
  const membro = MEMBRO_EM_PALAVRAS[chave] || null;
  // O nome já pode dizer o membro («Troisième position (bras)»); repeti-lo ao lado daria
  // «Troisième position (bras) (braços)». Quando já diz — em português ou no francês do termo —,
  // não se acrescenta.
  const limpo = String(termo.termo).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const jaDiz = Boolean(ALUSOES_AO_MEMBRO[chave]
    && new RegExp(ALUSOES_AO_MEMBRO[chave], 'i').test(limpo));
  return {
    nome: termo.termo,
    membro: membro,
    emPalavras: membro && !jaDiz ? termo.termo + ' (' + membro + ')' : termo.termo,
    tradicao: termo.tradicao || null,
  };
}

/**
 * A DIREÇÃO EM PALAVRAS, pelo id do termo. As direções do membro e as orientações do corpo vivem
 * em blocos diferentes da gramática porque são coisas diferentes: «devant» é para onde o membro
 * vai, «de frente» é como o corpo está. «À frente, pernas cruzadas» precisa das duas.
 */
function direcaoEmPalavras(alfabeto, id) {
  const g = (alfabeto && alfabeto.gramatica) || {};
  for (const grupo of ['direcoesDoMembro', 'orientacoesDoCorpo']) {
    for (const item of Object.values(g[grupo] || {})) {
      if (item && item.termo === id) return { nome: item.nome, significado: item.significado || null };
    }
  }
  return null;
}

/**
 * AS POSIÇÕES QUE O MÉTODO DECLARADO USA, e como se chamam nos outros.
 *
 * É esta a tabela que responde à pergunta que originou o bloco: «os dois braços acima da cabeça são
 * a 3ª ou a 5ª?». A resposta é «depende do método» — e agora o método é um dado do plano, e os
 * outros números aparecem ao lado em vez de serem calados.
 */
function posicoesDeBracosDoMetodo(alfabeto, metodo) {
  const tabela = ((alfabeto && alfabeto.gramatica) || {}).posicoesDeBracos;
  if (!tabela || !Array.isArray(tabela.posicoes)) return [];
  const alvo = normalizarMetodo(metodo);
  return tabela.posicoes.map((p) => ({
    conceito: p.conceito,
    estado: p.estado || 'documentado',
    noMetodo: p[alvo] || null,
    porMetodo: {
      francesa: p.francesa, RAD: p.RAD, Vaganova: p.Vaganova,
    },
  }));
}

/** O nome do método como as chaves da gramática o escrevem. Desconhecido → «compartilhada». */
function normalizarMetodo(metodo) {
  const t = String(metodo == null ? '' : metodo).trim().toLowerCase();
  if (!t) return 'compartilhada';
  if (/^rad/.test(t) || /royal/.test(t)) return 'RAD';
  if (/vaganova|rus/.test(t)) return 'Vaganova';
  if (/franc|cecchetti/.test(t)) return 'francesa';
  return 'compartilhada';
}

/** Todos os sinais de um alfabeto, num mapa sinal → verbete (para validar e para glossariar). */
function sinaisDo(alfabeto) {
  const mapa = new Map();
  for (const grupo of (alfabeto && alfabeto.grupos) || []) {
    for (const [sinal, item] of Object.entries(grupo.itens || {})) {
      mapa.set(sinal, Object.assign({ grupo: grupo.titulo }, item));
    }
  }
  return mapa;
}

/** O que o plano escreve quando ainda não decidiu. Não é dado: é a ausência dele. */
const PLACEHOLDER = /^\s*(\[\s*a decidir\s*\]|\[preencher[^\]]*\]|a decidir|—|-|\?)?\s*$/i;

/** A música de uma linha: `{tempos, compasso, numerador}`, ou `null` quando não está declarada. */
function lerMusica(tempos, compasso) {
  const t = String(tempos == null ? '' : tempos).trim();
  const c = String(compasso == null ? '' : compasso).trim();
  if (PLACEHOLDER.test(t) || PLACEHOLDER.test(c)) return null;
  const nTempos = Number(t.replace(/[^0-9]/g, ''));
  const m = /(\d+)\s*\/\s*(\d+)/.exec(c);
  if (!nTempos || !m) return null;
  return { tempos: nTempos, compasso: m[1] + '/' + m[2], numerador: Number(m[1]) };
}

/**
 * A orientação do corpo em palavras — «pernas cruzadas», e não `croise`.
 *
 * O NOME É O UNIVERSAL (01/11/2026), e o da tradição fica em `tradicao` no alfabeto. Era o
 * contrário — «croisé» —, e isso fazia o documento publicado falar a gramática de uma tradição
 * a quem pode não a conhecer. É a mesma escolha que `direcaoEmPalavras` já faz para o membro:
 * «à frente», e não «devant».
 *
 * Vazia quando o corpo está de frente (a omissão): o documento não escreve o que não foi dito.
 */
function orientacaoEmPalavras(alfabeto, orientacao) {
  const termo = String(orientacao || '').trim();
  if (!termo || termo === 'en-face') return '';
  const g = (alfabeto && alfabeto.gramatica) || {};
  const achado = Object.values(g.orientacoesDoCorpo || {})
    .find((o) => o && (o.termo === termo || o.nome === termo));
  return achado ? achado.nome : termo;
}

/**
 * A NOTAÇÃO DE UMA CÉLULA, composta dos dois campos que a declaram (28/10/2026).
 *
 * O dado guardava o bloco como TEXTO — `"[Pé: 1ª → +]"` —, e a tela pedia que se escrevesse.
 * Mas «bloco» já queria dizer Solo · Barra · Centro na linha do plano, e pedir a notação de
 * cabeça a quem administra o verbete é pedir que se escreva Benesh em texto livre. A célula
 * passou a declarar `categoria` e `sinais` — as duas coisas que a tela sabe oferecer — e a
 * notação é DERIVADA aqui. Uma representação só, e é a que se lê no documento.
 */
function blocoDe(celula) {
  if (!celula) return '';
  const categoria = String(celula.categoria || '').trim();
  const sinais = Array.isArray(celula.sinais) ? celula.sinais.map((x) => String(x).trim()).filter(Boolean) : [];
  if (!categoria && !sinais.length) return '';
  return '[' + categoria + ': ' + sinais.join(' ') + ']';
}

/**
 * A VALIDAÇÃO DE UM BLOCO contra o alfabeto. Devolve os sinais que o bloco usa e o alfabeto não
 * conhece. É a regra da P-16 ao contrário: um símbolo só existe no registro se tiver verbete.
 */
function lerBloco(bloco, alfabeto) {
  const texto = String(bloco == null ? '' : bloco).trim();
  const m = /^\[([^:\]]+):([\s\S]*)\]$/.exec(texto);
  if (!m) return { ok: false, categoria: null, tokens: [], desconhecidos: [texto], forma: false };
  const categoria = m[1].trim();
  const tokens = m[2].trim().split(/\s+/).filter(Boolean);
  const conhecidos = sinaisDo(alfabeto);
  const desconhecidos = [];
  const categorias = (alfabeto && alfabeto.categorias) || [];
  if (categorias.indexOf(categoria) === -1) desconhecidos.push(categoria);
  for (const token of tokens) {
    if (!conhecidos.has(token)) desconhecidos.push(token);
  }
  return { ok: desconhecidos.length === 0, categoria, tokens, desconhecidos, forma: true };
}

/** «1 compasso» / «2 compassos» — a frase do documento é lida por gente, e não por um log. */
function plural(n, singular, plurais) {
  return n === 1 ? '1 ' + singular : n + ' ' + (plurais || singular + 's');
}

/** Quantos tempos uma contagem cobre: `1–4` → 4, `1` → 1, `3` → 1. */
function temposDaContagem(contagem) {
  const nums = String(contagem == null ? '' : contagem).match(/\d+/g);
  if (!nums || !nums.length) return 0;
  if (nums.length === 1) return 1;
  const de = Number(nums[0]);
  const ate = Number(nums[nums.length - 1]);
  return ate >= de ? ate - de + 1 : 0;
}

/**
 * QUANTAS VEZES A CÉLULA ACONTECE, e quanto ela ocupa por isso (02/11/2026).
 *
 * O `repeticoes` é da CÉLULA — «este trecho acontece 2×» —, e a `contagem` continua a ser a de
 * UMA execução. A conta é a multiplicação, e é ela que entra em toda a aritmética: se a repetição
 * ficasse de fora, o `cobre` e a grade de compassos divergiam no primeiro `2x` — exactamente o
 * defeito que a soma por pista veio corrigir.
 */
function repeticoesDaCelula(celula) {
  const n = Number((celula && celula.repeticoes) || 1);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function temposDaCelula(celula) {
  return temposDaContagem(celula && celula.contagem) * repeticoesDaCelula(celula);
}

/**
 * UM BALDE VAZIO NÃO É UM DADO (02/11/2026).
 *
 * `celulas: { devant: [], "": [...] }` — uma chave com zero células diz o mesmo que a chave não
 * existir: «não há trecho nesta direção». Não há informação a perder em a tirar, e há um erro a
 * evitar em a manter: a guarda do `verbete-incompleto` recusava o verbete INTEIRO por causa de um
 * balde que ninguém vê, e a tabela do editor não desenha linha nenhuma para ele — foi assim que a
 * pesquisadora recebeu um 400 com «a direção «devant» não tem célula» sem nunca ter escolhido
 * `devant`.
 *
 * Vive no NÚCLEO porque os dois lados precisam dela e a fronteira proíbe que o servidor a defina
 * para o motor usar: o `verbete.js` valida e grava com ela, e o `compor` compõe com ela. Uma regra,
 * um sítio — a lição que a conta dos tempos pagou caro hoje.
 *
 * Devolve um objeto novo: não altera o que recebeu.
 */
function semBaldesVazios(verbete) {
  if (!verbete || typeof verbete !== 'object') return verbete;
  const celulas = verbete.celulas;
  if (!celulas || typeof celulas !== 'object' || Array.isArray(celulas)) return verbete;
  const limpas = {};
  for (const d of Object.keys(celulas)) {
    const v = celulas[d];
    // SAI SÓ O QUE NÃO DIZ NADA: uma lista com zero células. Tudo o resto FICA — inclusive o que
    // não é uma lista, porque isso é um ficheiro mal formado e não um artefacto, e quem o tem de
    // acusar é a guarda, não este filtro. Uma normalização que apaga o erro é pior do que não a
    // haver: o ficheiro torto passaria a compor como se estivesse certo.
    if (Array.isArray(v) && !v.length) continue;
    limpas[d] = v;
  }
  return Object.assign({}, verbete, { celulas: limpas });
}

/**
 * AS PISTAS — o eixo que faltava (02/11/2026).
 *
 * DEFEITO MEDIDO. As células eram somadas em LINHA, e o `Plié` fechava em 12 tempos numa música
 * de 8: as pernas fazem 8 (dois compassos de 4/4) e os braços fazem 4 — **em paralelo**, porque o
 * port de bras acontece enquanto o plié acontece. Somadas como sequência davam 12, e a gravação
 * passou a recusar o verbete por causa disso.
 *
 * A PISTA É A CATEGORIA (Pé · Peso · Perna · Braço), e não a direção: `à frente` e `atrás` são o
 * MESMO corpo em tempos diferentes, logo somam-se; `Perna` e `Braço` são corpos diferentes, logo
 * correm lado a lado. O que o exercício ocupa na música é a pista MAIS LONGA, não a soma.
 *
 * Isto não é invenção: é a leitura que os próprios verbetes já tinham — o `Plié` grava os braços
 * a recomeçar em 1, e o `Battement tendu` grava as três direções a continuar. As duas coisas
 * sempre conviveram no mesmo ficheiro porque ninguém as somava por pista.
 */
function pistasDe(celulas) {
  const pistas = new Map();
  for (const direcao of Object.keys(celulas || {})) {
    for (const c of (celulas[direcao] || [])) {
      const chave = String((c && c.categoria) || '').trim() || '(sem categoria)';
      pistas.set(chave, (pistas.get(chave) || 0) + temposDaCelula(c));
    }
  }
  return pistas;
}

/** O que o verbete OCUPA da música: a maior pista. É este número que se compara com os tempos. */
function coberturaDe(celulas) {
  let maior = 0;
  for (const t of pistasDe(celulas).values()) if (t > maior) maior = t;
  return maior;
}

/** O maior número de uma contagem — para conferir que ela cabe no numerador do compasso. */
function maiorContagem(contagem) {
  const nums = String(contagem == null ? '' : contagem).match(/\d+/g);
  return nums ? Math.max.apply(null, nums.map(Number)) : 0;
}

/**
 * O ESTADO DE UM VERBETE NUMA DATA — o coração do versionamento (02/11/2026).
 *
 * A REGRA, e a razão. Um verbete que já compõe um plano de ensino não se reescreve por baixo do
 * documento que o usa: a edição passa a ser um **ajuste**, e o estado anterior fica no
 * `versoes` do próprio registo, com a data em que deixou de valer (`ate`). Quem lê pede o estado
 * **daquela data** e recebe o que valia então.
 *
 * O QUE FICA NO TOPO E O QUE FICA NO HISTÓRICO. O estado CORRENTE continua a ser o do topo
 * (`cobre`, `celulas`, `posicao`) — é o que o editor mostra e o que a listagem lê, e um verbete
 * que nunca foi ajustado não tem `versoes` nenhum. Isso importa: os 12 verbetes que já existem
 * continuam a ler-se exactamente como antes, sem migração.
 *
 * A ESCOLHA, em três casos e sem relógio:
 *   1. sem data — ou com data posterior ao último `ate` —, vale o estado corrente;
 *   2. com data anterior a um `ate`, vale o `versoes` dessa entrada (a primeira, na ordem, cujo
 *      `ate` é posterior à data);
 *   3. com data anterior a TODOS os `ate`, vale a entrada mais antiga — que é o estado original,
 *      aquele de que não se guardou data porque sempre foi.
 *
 * `data` é uma string `AAAA-MM-DD` e compara-se como texto, que é o que ela é. Uma data inválida
 * ou ausente não inventa versão nenhuma: devolve o corrente.
 */
function estadoDoVerbete(registro, data) {
  const r = registro || {};
  const versoes = (Array.isArray(r.versoes) ? r.versoes : [])
    .filter((v) => v && typeof v === 'object')
    .slice()
    .sort((a, b) => String(a.ate || '').localeCompare(String(b.ate || '')));
  if (!versoes.length) return { estado: r, versao: null };
  const quando = String(data || '').trim();
  if (!quando) return { estado: r, versao: null };
  for (const v of versoes) {
    if (quando < String(v.ate || '')) return { estado: v, versao: String(v.ate || '') };
  }
  return { estado: r, versao: null };
}

/**
 * DE QUEM É UM REGISTO DO ALFABETO — o campo `escola`, como no vocabulário (03/11/2026).
 *
 * A DECISÃO DELA: «o dono do alfabeto é a escola, e deve ser dado o campo `escola` como no
 * vocabulário». A chave de um verbete continua a ser a música (`8|4/4`); o registo de uma escola
 * leva a mesma música **com o dono ao lado** — `8|4/4@breu` —, e o do catálogo fica `8|4/4`. É a
 * mesma forma do termo: a identidade é (conteúdo, dono), e não o conteúdo sozinho.
 *
 * PORQUÊ NA CHAVE E NÃO SÓ NUM CAMPO. No vocabulário o termo é um item de uma LISTA, e dois donos
 * podem declarar o mesmo `id` lado a lado. Aqui o verbete é o membro de um OBJETO indexado pela
 * música: dois registos da mesma música colidiriam no primeiro `set`. O dono entra na chave por
 * isso, e não por gosto — é o que permite à escola ter a sua versão do mesmo exercício sem apagar
 * a do catálogo.
 *
 * `escola` ausente ou vazia é o CATÁLOGO. Um ficheiro antigo — sem `@` em chave nenhuma — lê-se
 * exactamente como antes: tudo é do catálogo, e nenhuma escola perde o que tinha.
 */
const SEPARADOR_DO_DONO = '@';

/** A chave com que um registo é gravado: a música, e o dono quando não é o catálogo. */
function chaveDoVerbete(musica, escola) {
  const m = String(musica || '').trim();
  const e = String(escola || '').trim();
  return e ? m + SEPARADOR_DO_DONO + e : m;
}

/** O dono de um registo, lido da chave. Vazio = catálogo. */
function escolaDoRegisto(chave) {
  const k = String(chave || '');
  const i = k.indexOf(SEPARADOR_DO_DONO);
  return i === -1 ? '' : k.slice(i + 1).trim();
}

/** A música de um registo, sem o dono: `8|4/4@breu` → `8|4/4`. */
function musicaDaChave(chave) {
  const k = String(chave || '');
  const i = k.indexOf(SEPARADOR_DO_DONO);
  return i === -1 ? k : k.slice(0, i);
}

/**
 * OS REGISTOS QUE UMA ESCOLA VÊ — o catálogo mais os dela, com os dela a vencer.
 *
 * A precedência é a da `compor` do vocabulário, e pela mesma razão: o catálogo é o que se vende e
 * a escola é quem está a usar. Devolve `{ musica → registo }`, e o valor de cada música é o
 * registo escolhido — sem `@` no nome, que é detalhe de armazenamento.
 */
function registosDaEscola(musicas, escola) {
  const alvo = String(escola || '').trim();
  const mapa = {};
  const dono = {};
  for (const chave of Object.keys(musicas || {})) {
    if (!/^\d+\|/.test(chave)) continue;
    const musica = musicaDaChave(chave);
    const de = escolaDoRegisto(chave);
    // Um registo de OUTRA escola não entra: não é do catálogo nem desta escola.
    if (de && de !== alvo) continue;
    // A escola vence o catálogo; entre dois do mesmo dono, o primeiro é o declarado.
    if (dono[musica] && !(de && !dono[musica])) continue;
    mapa[musica] = musicas[chave];
    dono[musica] = de;
  }
  return mapa;
}

/**
 * A ESCOLHA DO VERBETE para uma música. Preferência pela música exacta; na falta dela, pelo
 * verbete da MESMA métrica que cobre menos tempos — o que se compõe é o que ele explica, e o
 * resto fica declarado. Nunca se estica um verbete para caber.
 *
 * O `data` é opcional e só serve para o versionamento: quando um verbete foi ajustado, é ele que
 * diz QUAL dos estados se compõe. Sem `data`, compõe-se o corrente — o comportamento de sempre.
 *
 * O `escola` também é opcional (03/11/2026), e a omissão é o catálogo: quem compõe um documento de
 * uma escola passa o slug, e a versão dela vence a do catálogo — a mesma regra do termo.
 */
function verbetePara(alfabeto, exercicio, musica, data, escola) {
  const doExercicio = (alfabeto && alfabeto.verbetes && alfabeto.verbetes[exercicio]) || null;
  if (!doExercicio) return { estado: 'sem-verbete' };
  // A vista já é a da escola: o catálogo mais o dela, com o dela a vencer. A chave que sai é a da
  // MÚSICA, e é ela que o documento escreve.
  const vistos = registosDaEscola(doExercicio, escola);
  const chave = musica.tempos + '|' + musica.compasso;
  if (vistos[chave]) {
    const lido = estadoDoVerbete(vistos[chave], data);
    return { estado: 'exacto', musica: chave, verbete: lido.estado, versao: lido.versao };
  }

  // O mesmo compasso, com menos tempos: compõe-se o que ele cobre e declara-se o resto.
  const candidatos = Object.keys(vistos)
    .map((k) => {
      const [tempos, compasso] = k.split('|');
      return { chave: k, tempos: Number(tempos), compasso, verbete: vistos[k] };
    })
    .filter((c) => c.compasso === musica.compasso && c.tempos < musica.tempos)
    .sort((a, b) => b.tempos - a.tempos);
  if (candidatos.length) {
    // A VERSÃO VALE TAMBÉM PARA O CANDIDATO (02/11/2026): quem compõe «o verbete da mesma métrica
    // que cobre menos tempos» está a compor aquele registo — e ele pode ter histórico. Sem isto, um
    // exercício de 8 tempos pedido numa música de 16 sairia com o texto de hoje mesmo num plano de
    // ontem, que é exactamente o que o ajuste existe para impedir.
    const lido = estadoDoVerbete(candidatos[0].verbete, data);
    return { estado: 'parcial', musica: candidatos[0].chave, verbete: lido.estado, versao: lido.versao };
  }
  const cobertas = Object.keys(vistos)
    .map((k) => k.replace('|', ' em '))
    .join(', ');
  return { estado: 'musica-nao-coberta', cobertas: cobertas || '(nenhuma)' };
}

/**
 * OS SEGMENTOS DE UM VERBETE, na forma nova (28/10/2026).
 *
 * A célula declara a CONTAGEM e o que acontece; o número do COMPASSO é CALCULADO, percorrendo as
 * direções na ordem declarada e somando os tempos. Antes ele era escrito à mão em cada segmento, e
 * podia contradizer a soma — que é o único número que a grade não pode ter errado.
 *
 * A forma antiga (`segmentos`) ainda é lida, e só por isso: uma modalidade nova que ainda não foi
 * migrada continua a compor em vez de desaparecer. Degradar é melhor do que inventar; e o
 * `provar-notacao` mede as duas.
 */
function segmentosDe(verbete, numerador) {
  if (!verbete) return [];
  if (verbete.celulas && typeof verbete.celulas === 'object') {
    // A ORDEM É A DAS CÉLULAS, e é a única lista que existe (28/10/2026). Havia um campo
    // `direcoes` ao lado, e nas seis entradas do alfabeto ele era — verificado, seis de seis —
    // exactamente a lista das chaves de `celulas`. Duas listas da mesma coisa divergem ao
    // primeiro caso que só uma conhece; aqui, o dia em que divergissem, o documento escreveria
    // uma direção para a qual não tem descrição. O `Object.keys` preserva a ordem de inserção,
    // que é a ordem em que as células foram escritas — a mesma que `direcoes` declarava.
    const ordem = Object.keys(verbete.celulas);
    const saida = [];
    // O COMPASSO CORRE POR PISTA (02/11/2026). Antes havia um `corridos` único, somando tudo na
    // ordem do ficheiro — e por isso os braços do `Plié`, que começam em 1, apareciam no compasso
    // 3 (o 12º tempo). Cada categoria tem o seu relógio: as pernas vão no 1º e no 2º compasso
    // enquanto os braços vão no 1º, e é isso que a página da aula tem de dizer.
    const corridosPorPista = new Map();
    for (const direcao of ordem) {
      const celulas = Array.isArray(verbete.celulas[direcao]) ? verbete.celulas[direcao] : [];
      for (const c of celulas) {
        const pista = String((c && c.categoria) || '').trim() || '(sem categoria)';
        const corridos = corridosPorPista.get(pista) || 0;
        saida.push(Object.assign({}, c, {
          // A NOTAÇÃO DERIVADA. Os leitores a jusante — a tabela do documento, o glossário, a
          // validação dos sinais — sempre leram `bloco`; ele continua a existir no SEGMENTO,
          // composto dos dois campos da célula. O que mudou foi onde a verdade mora.
          bloco: blocoDe(c),
          // A DIREÇÃO PODE NÃO EXISTIR (01/11/2026). O `relevé` não vai à frente, nem ao lado,
          // nem atrás — sobe e desce, em primeira posição. Antes, um trecho assim só se
          // escrevia enfiado debaixo de uma direção que não era a dele (o `Plié` do alfabeto
          // está todo em `devant`). A chave VAZIA passa a ser a ausência declarada, e o
          // segmento leva `null` — não `""`, para que quem lê pergunte «tem direção?» e não
          // «que direção é a string vazia?».
          direcao: direcao || null,
          // A ORIENTAÇÃO DO CORPO é outro eixo (28/10/2026): a direção diz para onde a perna vai,
          // a orientação diz como o corpo está voltado. Ficam separadas porque são coisas
          // diferentes — «à frente en croisé» é um trecho, não dois. Omitida, é `en-face`.
          orientacao: c.orientacao || 'en-face',
          // O compasso começa em 1 e cada `numerador` tempos vira a página.
          compasso: Math.floor(corridos / numerador) + 1,
          // A PISTA VAI NO SEGMENTO: é ela que diz a quem o compasso pertence, e sem ela quem lê
          // a grade não sabe que os dois «compasso 1» são simultâneos e não sucessivos.
          pista,
          repeticoes: repeticoesDaCelula(c),
        }));
        corridosPorPista.set(pista, corridos + temposDaCelula(c));
      }
    }
    return saida;
  }
  return (Array.isArray(verbete.segmentos) ? verbete.segmentos : []).map((s) => Object.assign({}, s));
}

/**
 * A COMPOSIÇÃO DE UMA LINHA DA SEQUÊNCIA.
 *
 * `linha` é um objeto do envelope (`{Bloco, «Objetivo específico», «Conteúdo do nível», Tempos,
 * Compasso}`), e o retorno diz o que o documento deve escrever — segmentos ou lacuna, nunca as
 * duas coisas ao mesmo tempo sem o dizer.
 */
function compor(linha, alfabeto, data, escola) {
  const campo = (...nomes) => {
    for (const n of nomes) {
      if (linha && linha[n] != null && String(linha[n]).trim()) return String(linha[n]).trim();
    }
    return '';
  };
  const exercicio = campo('Conteúdo do nível', 'Conteúdo', 'Conteúdos');
  const bruto = { tempos: campo('Tempos', 'Tempo'), compasso: campo('Compasso') };
  const base = { exercicio, bloco: campo('Bloco'), brutoTempos: bruto.tempos, brutoCompasso: bruto.compasso };

  if (!alfabeto) {
    return Object.assign(base, { estado: 'lacuna', motivo: 'sem-alfabeto', segmentos: [], restoTempos: 0,
      detalhe: 'a notação declarada não tem alfabeto publicado — o registro não pode ser composto' });
  }
  if (!exercicio) {
    return Object.assign(base, { estado: 'lacuna', motivo: 'sem-exercicio', segmentos: [], restoTempos: 0,
      detalhe: 'a linha não declara o exercício' });
  }

  const musica = lerMusica(bruto.tempos, bruto.compasso);
  if (!musica) {
    return Object.assign(base, { estado: 'lacuna', motivo: 'sem-musica', segmentos: [], restoTempos: 0,
      detalhe: 'os tempos e o compasso ainda não estão declarados no plano — sem eles não há grade' });
  }

  const escolhido = verbetePara(alfabeto, exercicio, musica, data, escola);
  if (escolhido.estado === 'sem-verbete') {
    return Object.assign(base, { estado: 'lacuna', motivo: 'sem-verbete', segmentos: [], restoTempos: 0,
      detalhe: 'o alfabeto não tem verbete para «' + exercicio + '» — um exercício entra no registro '
        + 'depois de o seu verbete existir (P-16)' });
  }
  if (escolhido.estado === 'musica-nao-coberta') {
    return Object.assign(base, { estado: 'lacuna', motivo: 'musica-nao-coberta', segmentos: [], restoTempos: 0,
      detalhe: 'o verbete de «' + exercicio + '» está declarado para ' + escolhido.cobertas
        + '; esta linha pede ' + plural(musica.tempos, 'tempo') + ' em ' + musica.compasso });
  }

  const segmentos = segmentosDe(escolhido.verbete, musica.numerador);

  // A DIREÇÃO DECLARADA E A DIREÇÃO ESCRITA NÃO SÃO DUAS COISAS (28/10/2026). Aqui havia uma
  // conferência entre `direcoes` e as chaves de `celulas` — e ela existia porque havia duas listas.
  // Deixou de haver: a direção é a chave da célula. O que ainda pode estar mal é uma chave que não
  // é uma lista, e isso continua a ser recusado: o motor nunca estica um verbete para caber. Uma
  // lista VAZIA deixou de ser recusada em 02/11/2026 — é ruído do editor, não uma declaração, e
  // ver `semBaldesVazios`.
  {
    const celulas = escolhido.verbete.celulas;
    if (celulas && typeof celulas === 'object') {
      // A GUARDA FICA PARA O QUE É MESMO UM ERRO: uma direção que não é uma lista. Uma lista
      // VAZIA é ruído, e o ruído sai — ver `semBaldesVazios`, que é o que os dois lados usam.
      const vazias = Object.keys(celulas).filter((d) => !Array.isArray(celulas[d]));
      if (vazias.length) {
        return Object.assign(base, { estado: 'lacuna', motivo: 'verbete-incompleto', segmentos: [], restoTempos: 0,
          detalhe: 'o verbete de «' + exercicio + '» (' + escolhido.musica + ') não tem célula em: '
            + vazias.join(', ') });
      }
    }
  }

  // A CONTA É A DA MAIOR PISTA (02/11/2026), e não a da soma em linha. O `Plié` soma 12 e ocupa
  // 8: as pernas fazem os dois compassos e os braços fazem um, ao mesmo tempo. Comparar a soma
  // com o `cobre` dava `verbete-inconsistente` a um verbete que está certo — era a régua que
  // estava errada, não o dado.
  const somaLinear = segmentos.reduce((t, s) => t + temposDaContagem(s.contagem) * repeticoesDaCelula(s), 0);
  const celulasDoVerbete = escolhido.verbete.celulas;
  const somaLida = (celulasDoVerbete && typeof celulasDoVerbete === 'object')
    ? coberturaDe(celulasDoVerbete) : somaLinear;
  const soma = somaLida;
  const declarado = escolhido.verbete.cobre == null ? soma : Number(escolhido.verbete.cobre);
  if (declarado !== soma) {
    return Object.assign(base, { estado: 'lacuna', motivo: 'verbete-inconsistente', segmentos: [], restoTempos: 0,
      detalhe: 'o verbete de «' + exercicio + '» (' + escolhido.musica + ') declara cobrir '
        + plural(declarado, 'tempo') + ', mas a maior pista tem ' + soma
        + (somaLinear !== soma ? ' (a soma em linha daria ' + somaLinear + ')' : '') });
  }

  // O SINAL DESCONHECIDO MANDA A LINHA INTEIRA PARA A LACUNA. Publicar um bloco com um símbolo que
  // o glossário não explica é publicar um documento que não se pode ler de volta.
  const problemas = [];
  for (const s of segmentos) {
    if (!s.bloco) continue;
    const lido = lerBloco(s.bloco, alfabeto);
    if (!lido.ok) problemas.push(s.bloco + ' (' + lido.desconhecidos.join(', ') + ')');
  }
  if (problemas.length) {
    return Object.assign(base, { estado: 'lacuna', motivo: 'sinal-desconhecido', segmentos: [], restoTempos: 0,
      detalhe: 'o verbete usa sinal sem verbete no alfabeto: ' + problemas.join('; ') });
  }

  const restoTempos = musica.tempos - soma;
  const fecha = restoTempos === 0 && soma % musica.numerador === 0;
  const compassosCobertos = soma / musica.numerador;
  const restoFecha = restoTempos > 0 && restoTempos % musica.numerador === 0;
  let detalhe = null;
  if (!fecha && restoTempos > 0) {
    detalhe = 'o verbete cobre ' + soma + ' dos ' + musica.tempos + ' tempos ('
      + plural(compassosCobertos, 'compasso') + ' de ' + musica.compasso + '); restam '
      + plural(restoTempos, 'tempo')
      + (restoFecha
        ? ' — ' + plural(restoTempos / musica.numerador, 'compasso') + ' sem verbete'
        : ', que não fecham em compasso inteiro');
  } else if (!fecha) {
    detalhe = 'os segmentos somam ' + soma + ' tempos, que não fecham em compasso ' + musica.compasso;
  }
  return Object.assign(base, {
    estado: fecha ? 'composto' : 'parcial',
    motivo: fecha ? null : (restoTempos > 0 ? 'resta-tempo' : 'verbete-inconsistente'),
    musica,
    segmentos,
    cobertura: soma,
    compassosCobertos,
    restoTempos: restoTempos > 0 ? restoTempos : 0,
    // O compasso em que a lacuna começa: é a linha que o documento escreve com `[conferir]`.
    compassoDoResto: restoTempos > 0 ? Math.floor(compassosCobertos) + 1 : null,
    // A POSIÇÃO e as DIREÇÕES vêm do verbete, e é o documento que as escreve em palavras. Sem
    // elas, a página em prosa não diz em que posição o exercício acontece — que é a primeira
    // coisa que se pergunta, e a única que a notação sabia e a prosa não.
    //
    // AS DIREÇÕES SÃO AS QUE TÊM CÉLULA (28/10/2026). O campo `direcoes` deixou de existir no
    // dado — ele era a mesma lista das chaves de `celulas`, e agora é derivado. O que sai daqui
    // é o que o documento escreve: cada direção que o exercício percorre, na ordem em que as
    // células foram escritas.
    posicao: escolhido.verbete.posicao || null,
    // SEM A AUSÊNCIA (01/11/2026): a chave vazia é «sem direção», e uma lista de direções que
    // a incluísse escreveria «o exercício vai a » — que não é uma frase.
    direcoes: Object.keys((escolhido.verbete.celulas && typeof escolhido.verbete.celulas === 'object')
      ? escolhido.verbete.celulas : {}).filter((d) => d !== ''),
    // AS ORIENTAÇÕES DO CORPO que este verbete usa, em palavras e sem repetir. `en face` sai:
    // é a omissão, e escrevê-la em cada linha seria dizer duas vezes a mesma coisa.
    orientacoes: [...new Set(Object.values(
      (escolhido.verbete.celulas && typeof escolhido.verbete.celulas === 'object')
        ? escolhido.verbete.celulas : {})
      .flat().map((c) => (c && c.orientacao) || '').filter((o) => o && o !== 'en-face'))]
      .map((o) => orientacaoEmPalavras(alfabeto, o)),
    lados: Array.isArray(escolhido.verbete.lado) ? escolhido.verbete.lado.slice() : [],
    /* A VERSÃO QUE SE COMPÔS (02/11/2026). É `null` quando o verbete não tem histórico, e é a
     * data em que a versão antiga deixou de valer quando tem. Vai no resultado para o documento
     * o poder declarar: quem lê a §4 de um ciclo sabe se aquela notação é a de hoje ou a que
     * valia quando a aula foi escrita. */
    versao: escolhido.versao || null,
    detalhe,
  });
}

/** A composição de todas as linhas da sequência, na ordem do plano. */
function comporTodas(linhas, alfabeto, data, escola) {
  const lista = Array.isArray(linhas) ? linhas.filter((l) => l && typeof l === 'object') : [];
  return lista.map((linha) => compor(linha, alfabeto, data, escola));
}

/**
 * OS SINAIS QUE O DOCUMENTO USA, e em que linha cada um aparece. É esta lista que o glossário
 * publica: um sinal que o registro não usa não entra — um glossário maior do que o registo é um
 * glossário a mais.
 */
function sinaisUsados(composicoes, alfabeto) {
  const usados = new Map();
  const anotar = (sinal, numero) => {
    if (!usados.has(sinal)) usados.set(sinal, []);
    const lista = usados.get(sinal);
    if (lista.indexOf(numero) === -1) lista.push(numero);
  };
  (composicoes || []).forEach((c, i) => {
    for (const s of c.segmentos || []) {
      if (!s.bloco) continue;
      const lido = lerBloco(s.bloco, alfabeto);
      if (!lido.forma) continue;
      if (lido.categoria) anotar(lido.categoria, i + 1);
      for (const token of lido.tokens) anotar(token, i + 1);
    }
  });
  return usados;
}

/** Os números das linhas que ficaram em lacuna, com o motivo — para o documento o poder dizer. */
function resumo(composicoes) {
  const contagem = { composto: 0, parcial: 0, lacuna: 0 };
  const porMotivo = {};
  for (const c of composicoes || []) {
    contagem[c.estado] = (contagem[c.estado] || 0) + 1;
    if (c.estado === 'lacuna') porMotivo[c.motivo] = (porMotivo[c.motivo] || 0) + 1;
  }
  return { contagem, porMotivo };
}

/** A declaração do código (P-15/P-16), em números, para o preâmbulo dos documentos. */
function declaracao(alfabeto) {
  if (!alfabeto) return null;
  const sinais = sinaisDo(alfabeto);
  return {
    id: alfabeto.id,
    nome: alfabeto.nome,
    versao: alfabeto.versao,
    categorias: (alfabeto.categorias || []).length,
    sinais: sinais.size,
    // A chave `_comentario` é a explicação do dado, não um exercício: contá-la daria «5 verbetes»
    // num alfabeto com quatro.
    verbetes: Object.keys(alfabeto.verbetes || {}).filter((k) => !k.startsWith('_')).length,
  };
}

module.exports = {
  ALFABETOS,
  MODALIDADE_PADRAO,
  alfabetos,
  paraNotacao,
  sinaisDo,
  termoPorId,
  posicaoEmPalavras,
  direcaoEmPalavras,
  posicoesDeBracosDoMetodo,
  repeticoesDaCelula,
  temposDaCelula,
  semBaldesVazios,
  pistasDe,
  coberturaDe,
  normalizarMetodo,
  lerMusica,
  blocoDe,
  orientacaoEmPalavras,
  lerBloco,
  temposDaContagem,
  maiorContagem,
  verbetePara,
  estadoDoVerbete,
  // O DONO DO ALFABETO (03/11/2026) — as três funções que compõem a chave de um registo e leem o
  // seu dono. O servidor e as provas usam-nas; nenhuma regra de dono se escreve fora daqui.
  chaveDoVerbete,
  escolaDoRegisto,
  musicaDaChave,
  registosDaEscola,
  compor,
  comporTodas,
  sinaisUsados,
  resumo,
  declaracao,
};
