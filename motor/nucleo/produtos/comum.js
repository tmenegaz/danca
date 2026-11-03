'use strict';

/**
 * comum.js — o que os produtos partilham: a composição do catálogo, a ordenação e a lacuna.
 *
 * PORQUE EXISTE. Três produtos (dicionário, syllabus, aula pronta) leem o MESMO catálogo e têm
 * de o compor da MESMA maneira. Escrito três vezes, o primeiro termo novo entraria num produto e
 * não nos outros — e a diferença não daria erro: daria dois documentos a discordar sobre o que o
 * catálogo tem.
 *
 * A FRONTEIRA. Como todo o `motor/nucleo/`, este ficheiro não importa `fs`, `path`, `http` nem
 * `process`, e não olha o relógio: recebe o que já foi lido e devolve texto. É o que torna os
 * produtos determinísticos e o que permite medi-los sem rede.
 *
 * A COMPOSIÇÃO É A DA FASE 1 (C22, item 2 · L14, lacuna 0). `compor` recebe o catálogo e as
 * adições da escola e devolve um só array — e é a única função que decide a precedência. O
 * catálogo vence no que declara; a escola acrescenta. Um termo com o mesmo `id` nos dois não é
 * ambiguidade a resolver em silêncio: a escola ganha, porque é ela que está a usar, e o resultado
 * diz `origem: "escola"` para quem precisar de o excluir de uma edição paga.
 */

/**
 * QUEM É O DONO DE CADA TERMO — a separação catálogo × escola, por CAMPO e não por ficheiro
 * (decisão de 02/11/2026, proposta por ela).
 *
 * O problema que isto resolve, dito por ela: «o termo é inscrito no ficheiro do catálogo, e o
 * catálogo que se vende cresce com o conteúdo de uma escola; com duas escolas, o termo de A
 * aparece no dicionário de B». O caminho do ficheiro era um só, e um termo criado na Produção da
 * escola A ia para o catálogo de todos.
 *
 * PORQUE UM CAMPO E NÃO UM FICHEIRO POR ESCOLA. O Worker lê o vocabulário do BUNDLE — `require` de
 * um JSON que o esbuild embute no build (`catalogo-seed.js`). Um ficheiro de caminho VARIÁVEL
 * (`biblioteca/escolas/<escola>/vocabulario.json`) não pode ser embutido: o esbuild resolve o
 * `require` em tempo de build, e a escola só se sabe em tempo de execução. As três saídas seriam
 * (a) gerar um índice de todas as escolas no build — mexer em `tools/`, que é congelado; (b) ler a
 * API do GitHub a cada carga da página — a cota que a 18/10/2026 acabou; (c) um campo no termo. A
 * (c) é a única que não custa nem um nem outro, e é a que ela propôs.
 *
 * O QUE ISTO **NÃO** É. Não é a fase 1 completa, e o critério 5 do plano («criar um termo numa
 * escola não muda o ficheiro do catálogo») continua a **não passar** ao pé da letra: o ficheiro é
 * um só. O que passa é o que ela pediu — **o termo de A não aparece no dicionário de B** —, e é
 * isso que torna o catálogo vendável a uma escola sem lhe entregar as edições das outras.
 *
 * `escola` vazio (ou ausente) é **do catálogo**: o que se vende. `escola: '<slug>'` é daquela
 * escola. Sem `escola` pedida, as adições de todas as escolas ficam em `deOutras` — e não se
 * perdem em silêncio: quem gera o produto do catálogo vê-as contadas no manifesto.
 */
function separarPorEscola(termos, escola) {
  const lista = Array.isArray(termos) ? termos : [];
  const alvo = String(escola || '').trim();
  const catalogo = [];
  const adicoes = [];
  const deOutras = [];
  for (const t of lista) {
    if (!t) continue;
    const dono = String(t.escola || '').trim();
    if (!dono) catalogo.push(t);
    else if (alvo && dono === alvo) adicoes.push(t);
    else deOutras.push(t);
  }
  return { catalogo, adicoes, deOutras };
}

/** Os termos de um objecto indexado por nome, sem as chaves de comentário (`_`). */
function semComentario(objeto) {
  const saida = {};
  const original = objeto || {};
  for (const chave of Object.keys(original)) {
    if (chave.charAt(0) === '_') continue;
    saida[chave] = original[chave];
  }
  return saida;
}

/** A ordem dos textos é a do português, e não a dos bytes: «Ária» antes de «Bourrée». */
function comparar(a, b) {
  return String(a == null ? '' : a).localeCompare(String(b == null ? '' : b), 'pt-BR');
}

/** Um campo que o dado pode trazer como texto ou como lista — sempre lista de textos limpos. */
function comoLista(valor) {
  if (valor == null) return [];
  const itens = Array.isArray(valor) ? valor : [valor];
  return itens.map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
}

/** Uma célula de tabela: o `|` do dado não pode partir a coluna, e o `\n` não pode partir a linha. */
function celula(valor) {
  return String(valor == null ? '' : valor)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

/** A lacuna, sempre com o mesmo nome — é ela que a prova conta, e não um texto solto. */
function lacuna(tipo, onde, falta) {
  return { tipo: String(tipo), onde: String(onde || ''), falta: String(falta || '') };
}

/**
 * A FOTOGRAFIA DATADA DO CATÁLOGO — `catalogo@AAAA-MM-DD`.
 *
 * A cláusula 1 da licença (ARQUITETURA-GERAL §10.2) exige que a licença nomeie o catálogo **como ele
 * está numa data**, e não «o catálogo». A data vem de fora, por parâmetro: este ficheiro é do núcleo
 * e não olha para o `git` nem para o relógio — quem a calcula é o CLI, do último commit que tocou o
 * catálogo, que é a MESMA técnica que tornou o PDF reprodutível (`SOURCE_DATE_EPOCH`).
 *
 * É DERIVADA, E ISSO NÃO É O CONTRATO. Ela diz «esta é a versão do catálogo nesta data»; não diz
 * «esta é a versão que ESTA escola comprou» — isso é um acto do contrato (C8), e enquanto ele não
 * existe o produto cita a derivada. A diferença fica escrita no `REGISTRO.md`, e não escondida.
 *
 * Sem data, devolve vazio — e quem chama declara a lacuna. Inventar uma data seria pior do que não
 * a ter: uma licença com data inventada parece mais forte do que é.
 */
function rotuloDaFotografia(fotografia) {
  const f = fotografia || {};
  const data = String(f.data || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return '';
  const commit = String(f.commit || '').trim();
  return 'catalogo@' + data + (commit ? ' (' + commit + ')' : '');
}

/**
 * A LICENÇA COMO ELA ENTRA NO PRODUTO: o título, a fotografia e o caminho.
 *
 * Uma linha só, e ela é a que o contrato vai citar. Fica aqui, e não em cada produto, porque os
 * três têm de citar a MESMA string — três cópias divergem ao primeiro ajuste de texto.
 */
function licencaCitavel(licenca, fotografia) {
  const titulo = String(licenca || '').trim();
  const foto = rotuloDaFotografia(fotografia);
  if (!titulo) return '';
  return foto ? titulo + ' · ' + foto : titulo;
}

/**
 * A COMPOSIÇÃO catálogo × escola — a função única (ver o cabeçalho).
 *
 * `adicoes` é opcional e o valor por omissão é o catálogo sozinho. Isso é de propósito: um produto
 * que se VENDE não leva as edições de uma escola, e quem quiser as duas passa-as explicitamente.
 */
function compor(catalogo, adicoes) {
  const doCatalogo = Array.isArray(catalogo) ? catalogo : [];
  const daEscola = Array.isArray(adicoes) ? adicoes : [];
  const porId = new Map();
  const ordem = [];

  const chaveDe = (t, i) => {
    const id = String((t && t.id) || '').trim();
    return id || '#sem-id-' + i;
  };

  doCatalogo.forEach((t, i) => {
    if (!t) return;
    const chave = chaveDe(t, i);
    if (porId.has(chave)) return; // o catálogo não se repete: o primeiro é o declarado
    porId.set(chave, Object.assign({}, t, { origem: 'catalogo' }));
    ordem.push(chave);
  });

  daEscola.forEach((t, i) => {
    if (!t) return;
    const chave = chaveDe(t, i);
    // A ESCOLA GANHA, e o registo diz que ganhou — mas a posição na lista é a do catálogo quando
    // ele já a tinha, para a ordem dos produtos não mudar por causa de uma edição de escola.
    porId.set(chave, Object.assign({}, t, { origem: 'escola' }));
    if (ordem.indexOf(chave) === -1) ordem.push(chave);
  });

  return ordem.map((k) => porId.get(k));
}

/**
 * AS CATEGORIAS DO VOCABULÁRIO, na ordem em que se ensina — e não por acaso.
 *
 * A ordem vem de `ordem` quando o chamador a passa; sem ela, vale a ordem de aparição no ficheiro,
 * que é a do cadastro. O que NÃO se faz é ordenar alfabeticamente por categoria: «giro» antes de
 * «passo» seria uma ordem de dicionário, não de aula.
 */
function categoriasEmOrdem(termos, ordem) {
  const declarada = comoLista(ordem);
  const vistas = [];
  for (const t of termos || []) {
    if (!t) continue;
    const c = String(t.categoria || '').trim();
    if (c && vistas.indexOf(c) === -1) vistas.push(c);
  }
  const posicao = (c) => {
    const i = declarada.indexOf(c);
    return i === -1 ? declarada.length + vistas.indexOf(c) : i;
  };
  return vistas.slice().sort((a, b) => posicao(a) - posicao(b) || comparar(a, b));
}

/** O título de uma secção a partir da chave da categoria, quando não há rótulo declarado. */
function rotuloDaCategoria(chave, rotulos) {
  const c = String(chave == null ? '' : chave).trim();
  if (!c) return '(sem categoria)';
  const mapa = rotulos || {};
  return String(mapa[c] || c);
}

/**
 * A INTEGRIDADE DE UM VERBETE — a pergunta que separa «publicar» de «publicar torto».
 *
 * Mede duas coisas que a gravação já exige: o `cobre` declarado é o dos tempos da música, e a
 * contagem das células (por PISTA, a maior) dá o mesmo. Um verbete que não fecha não é publicado
 * com tempos em nenhum produto: o dicionário mostra `[conferir]`, e o syllabus marca a unidade.
 * O número torto é o que estraga a aritmética da aula pronta, e publicá-lo seria ensinar o erro.
 */
function integridadeDoVerbete(celulas, cobre, temposDaMusica, coberturaDe) {
  const cobertura = typeof coberturaDe === 'function' ? coberturaDe(celulas) : null;
  const declarado = Number(cobre);
  const tempos = Number(temposDaMusica);
  const motivos = [];
  if (Number.isFinite(declarado) && Number.isFinite(tempos) && declarado !== tempos) {
    motivos.push('o `cobre` diz ' + declarado + ' tempos e a música declara ' + tempos);
  }
  if (cobertura != null && Number.isFinite(tempos) && cobertura !== tempos) {
    motivos.push('as células cobrem ' + cobertura + ' tempos e a música declara ' + tempos);
  }
  return { ok: motivos.length === 0, cobertura, declarado, tempos, motivos };
}

/** A chave de uma música é `tempos|compasso` — a mesma do alfabeto, escrita uma vez. */
function chaveDaMusica(chave) {
  // O DONO NA CHAVE NÃO É MÚSICA (03/11/2026). Um verbete de escola é gravado em `8|4/4@breu`;
  // sem esta limpeza o compasso sairia «4/4@breu» e a música deixaria de casar com a do plano.
  const partes = String(chave == null ? '' : chave).split('@')[0].split('|');
  if (partes.length !== 2) return null;
  const tempos = partes[0].trim();
  const compasso = partes[1].trim();
  if (!tempos || !compasso) return null;
  return { tempos, compasso, chave: tempos + '|' + compasso };
}

/** O bloco de notação de uma célula, como o documento o escreve: `[Pé: 1ª → +]`. */
function blocoDaCelula(c) {
  const categoria = String((c && c.categoria) || '').trim();
  const sinais = comoLista(c && c.sinais);
  return '[' + categoria + ': ' + sinais.join(' ') + ']';
}

/**
 * O COMPASSO DE CADA TRECHO — um relógio por PISTA, e não um só para o exercício.
 *
 * A conta é a do editor (e a do motor): `Perna` e `Braço` correm em paralelo, e o compasso de um
 * trecho é quantas vezes a sua pista já passou do fim. Com um relógio só, os braços do `Plié` —
 * que começam no tempo 1 — apareciam no compasso 3, e o documento contradizia a tela.
 *
 * Devolve um mapa `"<direção>:<índice>" → compasso`, que é a chave que quem desenha a tabela já
 * tem à mão.
 */
function compassosDasCelulas(celulas, temposDaCelula, numerador) {
  const n = Number(numerador) || 4;
  const mapa = new Map();
  const relogios = new Map();
  for (const d of Object.keys(celulas || {})) {
    (celulas[d] || []).forEach((c, k) => {
      const pista = String((c && c.categoria) || '').trim() || '(sem categoria)';
      const corridos = relogios.get(pista) || 0;
      mapa.set(d + ':' + k, Math.floor(corridos / n) + 1);
      relogios.set(pista, corridos + (typeof temposDaCelula === 'function' ? temposDaCelula(c) : 0));
    });
  }
  return mapa;
}

module.exports = {
  separarPorEscola,
  rotuloDaFotografia,
  licencaCitavel,
  compassosDasCelulas,
  semComentario,
  comparar,
  comoLista,
  celula,
  lacuna,
  compor,
  categoriasEmOrdem,
  rotuloDaCategoria,
  integridadeDoVerbete,
  chaveDaMusica,
  blocoDaCelula,
};
