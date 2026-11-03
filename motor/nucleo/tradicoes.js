/**
 * tradicoes.js — DE QUE TRADIÇÃO É UMA MODALIDADE (03/11/2026).
 *
 * O PEDIDO DELA, e ele tem duas metades: «As tradições técnicas devem aparecer de forma dinâmica
 * de acordo com a modalidade escolhida: Ballet Clássico mantém as tradições atuais (RAD, Francesa,
 * Vaganova, Cubana, Cecchetti); outras modalidades (dança moderna, contemporâneo, jazz, circo)
 * têm as suas próprias referências técnicas/tradições específicas (ex.: Martha Graham, Doris
 * Humphrey, Release, Dança-Teatro).»
 *
 * A PRECEDÊNCIA É A DO REPOSITÓRIO INTEIRO, e não uma regra nova: **o específico vence o
 * compartilhado**. É o que `tools/lib-fontes.sh` já faz com as fontes de ciclo (a fonte com o
 * sufixo da escola prevalece sobre a compartilhada), e é o que faz a mesma pergunta — «de que
 * lista se serve esta modalidade?» — ter uma resposta só, em qualquer camada.
 *
 * E É O QUE PERMITE O ESTADO DE HOJE SEM O PARTIR: `tradicoes.json` existe dentro de
 * `biblioteca/modalidades/bale-classico/`, e mais nada. Sem o recurso, uma modalidade sem lista
 * própria ficaria com a lista VAZIA — e a curadoria deixaria de se poder atribuir em jazz, em
 * circo, em contemporâneo. Uma funcionalidade nova que tranca o que já funcionava não é uma
 * funcionalidade: é uma regressão com boa intenção. Com a precedência, o clássico passa a ter a
 * lista dele, e as outras continuam com a compartilhada **até haver conteúdo** — que é dela
 * (P-16), e não se inventa.
 *
 * O `de` QUE A FUNÇÃO DEVOLVE NÃO É ORNAMENTO. Ele diz se a lista veio da modalidade ou da
 * compartilhada, e é o que a tela precisa de saber para não afirmar «as tradições do jazz» quando
 * está a mostrar as do catálogo clássico. Uma lista errada com o rótulo certo é um erro que se
 * encontra; uma lista errada com o rótulo errado é um erro que se acredita.
 */

/** A lista sem repetições, sem vazios e sem a `compartilhada` — que não é uma tradição a escolher,
 *  é o nome do que não tem tradição. Ela nunca entra numa lista de opções. */
function limpar(lista) {
  const vistos = new Set();
  const saida = [];
  for (const x of (Array.isArray(lista) ? lista : [])) {
    const v = String(x == null ? '' : x).trim();
    if (!v || v === 'compartilhada' || vistos.has(v)) continue;
    vistos.add(v);
    saida.push(v);
  }
  return saida;
}

/**
 * AS TRADIÇÕES DE UMA MODALIDADE.
 *
 * `porModalidade` é o mapa `{ '<id-da-modalidade>': ['RAD', …] }`; `compartilhadas` é a lista que
 * serve quem não tem a sua. A modalidade pode vir por **id** (`bale-classico`) ou por **nome**
 * (`Balé clássico`) — o `<select>` da curadoria guarda o nome e o perfil guarda o id, e ter duas
 * derivações para a mesma pergunta é como se perde uma delas.
 */
function tradicoesDaModalidade(modalidade, { porModalidade, compartilhadas } = {}) {
  const chave = String(modalidade == null ? '' : modalidade).trim();
  const mapa = porModalidade && typeof porModalidade === 'object' ? porModalidade : {};
  const norm = (s) => String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const alvo = norm(chave);
  const entrada = Object.keys(mapa).find((k) => norm(k) === alvo);
  if (entrada) {
    const daModalidade = limpar(mapa[entrada]);
    // Uma lista própria VAZIA não é uma lista: é um ficheiro que ainda não foi preenchido. Cair na
    // compartilhada é o que evita que «existe um ficheiro» se leia como «não há tradições».
    if (daModalidade.length) return { lista: daModalidade, de: 'modalidade' };
  }
  return { lista: limpar(compartilhadas), de: 'compartilhada' };
}

/**
 * O MAPA INTEIRO, para a tela poder filtrar sem ir ao servidor a cada mudança de modalidade.
 *
 * Devolve `{ modalidade: {lista, de} }` — uma entrada por modalidade do catálogo, mais a chave
 * `''` com a compartilhada (é o que o formulário mostra antes de haver modalidade escolhida).
 */
function mapaDeTradicoes(modalidades, { porModalidade, compartilhadas } = {}) {
  const saida = { '': { lista: limpar(compartilhadas), de: 'compartilhada' } };
  for (const m of (Array.isArray(modalidades) ? modalidades : [])) {
    const nome = String((m && (m.nome || m.id)) || '').trim();
    const id = String((m && m.id) || nome).trim();
    if (!nome) continue;
    const r = tradicoesDaModalidade(id, { porModalidade, compartilhadas });
    saida[nome] = r;
    if (id !== nome) saida[id] = r;
  }
  return saida;
}

module.exports = { limpar, tradicoesDaModalidade, mapaDeTradicoes };
