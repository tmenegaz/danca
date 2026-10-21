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

// O `require` é LITERAL: este módulo é empacotado para o Worker, e o empacotador não segue um
// caminho montado em tempo de execução.
const BALLET_CLASSICO = require('../../biblioteca/notacao/ballet-classico.json');

/** Os alfabetos conhecidos, por id. Um alfabeto novo é uma entrada nova aqui. */
const ALFABETOS = { 'ballet-classico': BALLET_CLASSICO };

function slug(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * O alfabeto da notação DECLARADA pelo plano (P-15/P-16). `null` quando a notação declarada não
 * tem alfabeto publicado — e então o derivador escreve o documento como antes, com as convenções
 * e a lacuna. Degradar é melhor do que inventar um código que ninguém declarou.
 */
function paraNotacao(declarada) {
  const alvo = slug(declarada);
  if (!alvo) return null;
  for (const alfabeto of Object.values(ALFABETOS)) {
    const aceita = (alfabeto.aplicaseA || []).map(slug);
    if (aceita.indexOf(alvo) !== -1) return alfabeto;
  }
  return null;
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

  const segmentos = (escolhido.verbete.segmentos || []).map((s) => Object.assign({}, s));
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
    verbetes: Object.keys(alfabeto.verbetes || {}).length,
  };
}

module.exports = {
  ALFABETOS,
  paraNotacao,
  sinaisDo,
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
