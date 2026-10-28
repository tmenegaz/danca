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
 * vai, «en face» é como o corpo está. «Croisé devant» precisa das duas.
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

/** O maior número de uma contagem — para conferir que ela cabe no numerador do compasso. */
function maiorContagem(contagem) {
  const nums = String(contagem == null ? '' : contagem).match(/\d+/g);
  return nums ? Math.max.apply(null, nums.map(Number)) : 0;
}

/**
 * A ESCOLHA DO VERBETE para uma música. Preferência pela música exacta; na falta dela, pelo
 * verbete da MESMA métrica que cobre menos tempos — o que se compõe é o que ele explica, e o
 * resto fica declarado. Nunca se estica um verbete para caber.
 */
function verbetePara(alfabeto, exercicio, musica) {
  const doExercicio = (alfabeto && alfabeto.verbetes && alfabeto.verbetes[exercicio]) || null;
  if (!doExercicio) return { estado: 'sem-verbete' };
  const chave = musica.tempos + '|' + musica.compasso;
  if (doExercicio[chave]) return { estado: 'exacto', musica: chave, verbete: doExercicio[chave] };

  // O mesmo compasso, com menos tempos: compõe-se o que ele cobre e declara-se o resto.
  const candidatos = Object.keys(doExercicio)
    .map((k) => {
      const [tempos, compasso] = k.split('|');
      return { chave: k, tempos: Number(tempos), compasso, verbete: doExercicio[k] };
    })
    .filter((c) => c.compasso === musica.compasso && c.tempos < musica.tempos)
    .sort((a, b) => b.tempos - a.tempos);
  if (candidatos.length) {
    return { estado: 'parcial', musica: candidatos[0].chave, verbete: candidatos[0].verbete };
  }
  const cobertas = Object.keys(doExercicio)
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
    const ordem = Array.isArray(verbete.direcoes) && verbete.direcoes.length
      ? verbete.direcoes
      : Object.keys(verbete.celulas);
    const saida = [];
    let corridos = 0;
    for (const direcao of ordem) {
      const celulas = Array.isArray(verbete.celulas[direcao]) ? verbete.celulas[direcao] : [];
      for (const c of celulas) {
        saida.push(Object.assign({}, c, {
          direcao: direcao,
          // O compasso começa em 1 e cada `numerador` tempos vira a página.
          compasso: Math.floor(corridos / numerador) + 1,
        }));
        corridos += temposDaContagem(c.contagem);
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
function compor(linha, alfabeto) {
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

  const escolhido = verbetePara(alfabeto, exercicio, musica);
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

  // A DIREÇÃO DECLARADA E A DIREÇÃO ESCRITA TÊM DE SER A MESMA COISA. Um verbete que declara três
  // direções e só tem célula para duas é um verbete pela metade: a grade sairia com dois terços do
  // exercício e nada o diria. É recusado, e não completado — a regra é a mesma de sempre: o motor
  // nunca estica um verbete para caber.
  {
    const dirs = Array.isArray(escolhido.verbete.direcoes) ? escolhido.verbete.direcoes : null;
    const celulas = escolhido.verbete.celulas;
    if (dirs && celulas && typeof celulas === 'object') {
      const semCelula = dirs.filter((d) => !Array.isArray(celulas[d]) || !celulas[d].length);
      const orfas = Object.keys(celulas).filter((d) => dirs.indexOf(d) === -1);
      if (semCelula.length || orfas.length) {
        const partes = [];
        if (semCelula.length) partes.push('declara ' + semCelula.join(', ') + ' sem célula');
        if (orfas.length) partes.push('tem célula de ' + orfas.join(', ') + ' fora das direções declaradas');
        return Object.assign(base, { estado: 'lacuna', motivo: 'verbete-incompleto', segmentos: [], restoTempos: 0,
          detalhe: 'o verbete de «' + exercicio + '» (' + escolhido.musica + ') ' + partes.join(' e ') });
      }
    }
  }

  const soma = segmentos.reduce((t, s) => t + temposDaContagem(s.contagem), 0);
  const declarado = escolhido.verbete.cobre == null ? soma : Number(escolhido.verbete.cobre);
  if (declarado !== soma) {
    return Object.assign(base, { estado: 'lacuna', motivo: 'verbete-inconsistente', segmentos: [], restoTempos: 0,
      detalhe: 'o verbete de «' + exercicio + '» (' + escolhido.musica + ') declara cobrir '
        + plural(declarado, 'tempo') + ', mas os segmentos somam ' + soma });
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
    posicao: escolhido.verbete.posicao || null,
    direcoes: Array.isArray(escolhido.verbete.direcoes) ? escolhido.verbete.direcoes.slice() : [],
    lados: Array.isArray(escolhido.verbete.lado) ? escolhido.verbete.lado.slice() : [],
    detalhe,
  });
}

/** A composição de todas as linhas da sequência, na ordem do plano. */
function comporTodas(linhas, alfabeto) {
  const lista = Array.isArray(linhas) ? linhas.filter((l) => l && typeof l === 'object') : [];
  return lista.map((linha) => compor(linha, alfabeto));
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
  normalizarMetodo,
  lerMusica,
  lerBloco,
  temposDaContagem,
  maiorContagem,
  verbetePara,
  compor,
  comporTodas,
  sinaisUsados,
  resumo,
  declaracao,
};
