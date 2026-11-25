/**
 * contador-da-escola.js — A CONTAGEM DE AULAS DE UMA ESCOLA, NO SERVIDOR (25/11/2026).
 *
 * O QUE ELE RESOLVE, e é o problema que a leitura do plano deixou em aberto:
 *
 * O `ciclos.json` de cada turma, que é onde o facto e a data vivem juntos, está no ASSETS do Worker
 * da ESCOLA (`publicacao/`). O Worker da RAIZ — o do `danca.padd.com.br/financeiro`, que mostra a
 * franquia de todas as escolas — serve `raiz/` como ASSETS e **não vê** a publicação de escola
 * nenhuma. Sem uma ponte, o consumo do mês ficaria para sempre `null` no ecrã de quem cobra.
 *
 * A PONTE É UM CONJUNTO DE FACTOS NO KV, e não um total. Isto é a parte que importa:
 *
 *   · guarda-se `{ meses: { '2026-11': { 'piano/01': '2026-11-04', … } } }` — **quais** aulas foram
 *     processadas e **em que dia**, e não «3». Um total guardado é um número que pode divergir da
 *     fonte que o justifica, e o dia em que divergir ninguém sabe qual dos dois vale. Um conjunto é
 *     idempotente: a mesma aula registada duas vezes continua a ser uma, e o número é derivado;
 *   · a escrita é feita pelo Worker da ESCOLA, que é quem lê o ASSETS;
 *   · a leitura pela raiz é **uma** chave por escola (`bastidores/<escola>/aulas-processadas`), e é
 *     uma leitura só para as duas páginas — a mesma disciplina das cobranças e do livro.
 *
 * A RECONCILIAÇÃO É MONÓTONA, e de propósito: o que está no KV nunca sai. Uma aula lançada é um
 * facto do passado; se o ciclo dela deixar de estar à vista — porque a Turma foi substituída, ou
 * porque o pacote ainda não foi regerado —, apagá-la da contagem seria dizer que ela não aconteceu.
 * O que a reconciliação faz é FUNDIR o que os ciclos publicados dizem, com `fundirNaContagem`, que é
 * a operação idempotente que já sabe mover uma aula de mês quando a data é corrigida.
 *
 * E ela NÃO GASTA UMA ESCRITA quando nada mudou: a contagem guarda a assinatura do próprio conteúdo
 * (`fonte`), e a reconciliação compara antes de escrever. Uma página vista cinquenta vezes num dia em
 * que ninguém lançou nada custa cinquenta leituras e ZERO escritas.
 */

const contador = require('../nucleo/contador-de-aulas.js');
const { prefixoDaArvore } = require('../nucleo/arvore-de-assets.js');

/** A chave do KV, ao lado das outras da escola. Uma por escola, como o livro das mensalidades é um
 *  por plataforma — mas aqui é mesmo por escola, porque a contagem é dela. */
function chaveDaContagem(escola) {
  const slug = String(escola == null ? '' : escola).trim();
  if (!slug || /[\/\\]/.test(slug)) return null;
  return 'bastidores/' + slug + '/aulas-processadas';
}

/**
 * A PASTA DE UMA TURMA NO PACOTE — o mesmo cálculo que o painel do estúdio usa (`pastaDaTurma`).
 *
 * Ela existe nos dois sítios, e o risco de duas cópias é o de sempre. O que o impede de divergir
 * aqui é a fonte ser a mesma: o id da Turma é `<escola>-<variante>` (opcionalmente com a data do
 * elo), e a variante é o id sem o prefixo da escola e sem o carimbo. Quando as duas cópias
 * divergirem, a prova `provar-o-contador` reprova — ela mede o caminho pelo pacote publicado, e não
 * a função.
 */
function pastaDaTurma(idDaTurma, escola) {
  const base = String(idDaTurma || '').trim().replace(/-\d{4}-\d{2}-\d{2}(-\d{1,2})?$/, '');
  const slug = String(escola || '').trim();
  return slug && base.indexOf(slug + '-') === 0 ? base.slice(slug.length + 1) : base;
}

/**
 * O LEITOR DAS AULAS DE UMA ESCOLA.
 *
 * `curadorias` são as turmas vigentes (a lista do KV, que o chamador já leu — não se lê duas vezes a
 * mesma chave). Cada turma dá a sua variante, e cada variante dá o seu `ciclos.json` no ASSETS.
 *
 * Devolve `ciclos: [{ variante, aulas }]` para o núcleo somar. Uma turma cujo pacote não está
 * montado entra com `aulas: []` e é DITA em `semPacote` — «não li o pacote desta turma» é uma
 * resposta, e é diferente de «esta turma não tem aulas».
 */
async function lerCiclosDaEscola({ env, escola, curadorias } = {}) {
  const slug = String(escola == null ? '' : escola).trim();
  const ciclos = [];
  const semPacote = [];
  if (!slug) return { ciclos, semPacote };
  const lerAsset = async (caminho) => {
    if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') return null;
    try {
      const r = await env.ASSETS.fetch('https://assets.local' + caminho);
      if (!r || !r.ok) return null;
      return await r.text();
    } catch (erro) { return null; }
  };
  const prefixo = prefixoDaArvore(env);
  const vistas = new Set();
  for (const t of Array.isArray(curadorias) ? curadorias : []) {
    if (!t || t.substituidaPor) continue;
    const variante = pastaDaTurma(t.id, slug);
    if (!variante || vistas.has(variante)) continue;
    vistas.add(variante);
    const texto = await lerAsset(prefixo + '/' + encodeURIComponent(variante) + '/ciclos.json');
    if (!texto) { semPacote.push(variante); continue; }
    try {
      const d = JSON.parse(texto);
      const c = d && Array.isArray(d.ciclos) ? d.ciclos[0] : null;
      if (!c || !Array.isArray(c.aulas)) { semPacote.push(variante); continue; }
      ciclos.push({ variante, aulas: c.aulas });
    } catch (erro) { semPacote.push(variante); }
  }
  return { ciclos, semPacote };
}

/**
 * O CONTADOR DA ESCOLA — lê, funde, grava quando muda, e devolve o que o ecrã precisa.
 *
 * O `kv` é opcional de propósito: sem ele (a bancada do servidor de desenvolvimento), a função
 * devolve a contagem calculada e NÃO grava. É o mesmo contrato dos outros leitores deste Worker —
 * a ausência de armazenamento não inventa estado, e também não impede a leitura.
 */
function criarContadorDaEscola({ env, kv, escola } = {}) {
  const slug = String(escola == null ? '' : escola).trim();
  const chave = chaveDaContagem(slug);

  /** O que está guardado. `null` quando não há KV ou quando a chave não existe — «não li». */
  async function ler() {
    if (!kv || typeof kv.get !== 'function' || !chave) return null;
    try {
      const bruto = await kv.get(chave);
      return bruto ? contador.lerContagem(bruto) : null;
    } catch (erro) {
      return null;
    }
  }

  /**
   * FUNDE o que os ciclos publicados dizem na contagem guardada, e grava só se mudou.
   *
   * Devolve `{ contagem, escreveu, ciclos, semPacote }`. Falhar a escrita não derruba a leitura: a
   * contagem calculada é devolvida na mesma, e o que se perde é a cópia para a raiz — que volta a
   * ser tentada na vista seguinte.
   */
  async function reconciliar({ curadorias, quando } = {}) {
    const { ciclos, semPacote } = await lerCiclosDaEscola({ env, escola: slug, curadorias });
    const guardada = await ler();
    let nova = guardada || contador.contagemVazia();
    /* A FUSÃO AULA A AULA, e não a substituição do conjunto: ver o cabeçalho. A ordem não importa
     * (cada aula escreve a sua chave), e o resultado é o mesmo para qualquer ordem — é o que faz
     * duas reconciliações concorrentes darem o mesmo mapa. */
    for (const c of ciclos) {
      for (const a of c.aulas) {
        if (!a || a.lancada !== true) continue;
        nova = contador.fundirNaContagem(nova, { variante: c.variante, numero: a.n, data: a.data });
      }
    }
    const assinatura = contador.assinaturaDosMeses(nova.meses);
    /* NADA A REGISTAR, NADA ESCRITO. Uma escola que nunca lançou uma aula — ou cujo pacote ainda
     * não está montado — não ganha uma chave vazia no KV. «Não há facto» é a ausência da chave, e é
     * a mesma disciplina do `cobrancas`: uma escola sem cobrança não tem entrada no mapa.
     *
     * Sem isto, a primeira visita a cada uma das quatro escolas escrevia quatro chaves para dizer
     * «nenhuma aula», e uma leitura de página passava a gastar escritas — que é exactamente o que a
     * reconciliação promete não fazer. */
    const temAlgo = Object.keys(nova.meses || {}).length > 0;
    const mudou = temAlgo && (!guardada || guardada.fonte !== assinatura);
    let escreveu = false;
    if (mudou && kv && typeof kv.put === 'function' && chave) {
      const registo = {
        atualizadoEm: quando || new Date().toISOString(),
        fonte: assinatura,
        meses: nova.meses,
      };
      try {
        await kv.put(chave, JSON.stringify(registo));
        escreveu = true;
        nova = contador.lerContagem(registo);
      } catch (erro) { escreveu = false; }
    }
    nova = Object.assign({}, nova, { fonte: assinatura });
    return { contagem: nova, escreveu, ciclos, semPacote };
  }

  /**
   * O RESUMO DE UM MÊS, para o ecrã — com as previstas quando os ciclos estão à mão.
   *
   * `ciclos` é opcional: quando o chamador já reconciliou, passa os que leu e evita uma segunda
   * leitura do ASSETS. Sem eles, o resumo sai com `previstas: null` e o alerta não se faz — melhor
   * calar do que inventar uma previsão.
   */
  async function resumoDoMes({ competencia, franquia, ciclos } = {}) {
    const contagem = await ler();
    return contador.resumo({ contagem, ciclos, competencia, franquia });
  }

  return { chave, ler, reconciliar, resumoDoMes };
}

module.exports = {
  chaveDaContagem,
  pastaDaTurma,
  lerCiclosDaEscola,
  criarContadorDaEscola,
};
