/**
 * shards.js — QUAIS DESTES SCRIPTS SÃO SHARDS, e não escolas (24/11/2026).
 *
 * A pergunta existia em três sítios e cada um respondia à sua maneira: o `gerar-indices.js` lia o
 * marcador do disco, o `deploy-escolas.yml` procurava-o no config com `grep`, e o caminho do
 * SERVIDOR (`indice-acervo.js`) não a fazia de todo. O descompasso é o defeito: o `indices/` do
 * repositório saía certo — sem o `lastro-teste` — e a página ao vivo listava-o como escola viva,
 * pronta a apagar. Uma lista que mostra o que não é escola é uma armadilha com botão.
 *
 * A MARCA é a mesma de sempre, e é do config: a var `PACOTE_PARTILHADO`. Não se inventa um
 * segundo sinal (um ficheiro, uma lista à mão, um campo no índice) porque a pergunta «este script
 * serve uma escola ou N escolas?» já tem uma resposta declarada em cada config, e duas respostas
 * para a mesma pergunta divergem no dia em que uma muda.
 *
 * O QUE ISTO ACRESCENTA, E É O QUE O TORNA BARATO. Ler o config de todas as escolas custa uma
 * leitura por escola, em cada construção do acervo (o caminho do servidor monta-o a partir da
 * árvore do GitHub — cada leitura é um subpedido). O ELO RESPONDE SEM LER: `escola/<slug>/
 * indice.json` existe para toda a escola que alguma vez nasceu — é ele que o expurgo preserva
 * como memória —, e nunca existe para um shard (foi por isso que o expurgo do `lastro-teste`
 * recusou, com a razão certa: `sem-elo`). Então só se abre o config de quem NÃO tem elo, que é o
 * shard e a raiz. O custo passa a ser o número de shards, e não o número de escolas.
 *
 * A DEGRADAÇÃO É SEGURA nos dois sentidos: se uma escola antiga não tiver elo, o config dela é
 * lido, não se encontra o marcador, e ela continua a ser escola — o pior que acontece é uma
 * leitura a mais.
 *
 * DOIS DRIVERS, UMA REGRA. O disco lê em síncrono (`lerDoDisco`, chamado pelo `check-indices` a
 * partir de código síncrono) e o servidor lê em assíncrono (a API do GitHub). O que NÃO se duplica
 * é a decisão — quais configs abrir (`configsSemElo`) e o que faz um shard (`ehMarcado`); os dois
 * laços abaixo são o mesmo laço, um com `await` e o outro sem.
 */

/** O nome do script que o `wrangler.<slug>.jsonc` declara — ou `null` se não for um. */
function slugDoConfig(caminho) {
  const m = /^wrangler\.([a-z0-9-]+)\.jsonc$/.exec(caminho);
  return m ? m[1] : null;
}

/** As escolas que já nasceram alguma vez — as que têm elo em `escola/<slug>/indice.json`. */
function slugsComElo(caminhos) {
  const comElo = new Set();
  for (const caminho of caminhos || []) {
    const m = /^escola\/([a-z0-9-]+)\/indice\.json$/.exec(caminho);
    if (m) comElo.add(m[1]);
  }
  return comElo;
}

/**
 * Os configs que é preciso ABRIR para responder — os de quem não tem elo, menos a raiz.
 *
 * A raiz sai sem leitura: ela tem `wrangler.danca.jsonc` e serve a porta de entrada, que é a mesma
 * exclusão que `NAO_ESCOLAS` faz no resto do motor — não uma regra nova.
 */
function configsSemElo(caminhos, raiz = 'danca') {
  const comElo = slugsComElo(caminhos);
  const saida = [];
  for (const caminho of caminhos || []) {
    const slug = slugDoConfig(caminho);
    if (!slug || slug === raiz) continue;
    // O ELO VALE COMO PROVA, E CUSTA ZERO. Quem tem elo é escola — viva ou expurgada —, e o
    // expurgo não o apaga de propósito. Não se abre o config para confirmar o que o elo já diz.
    if (comElo.has(slug)) continue;
    saida.push({ caminho, slug });
  }
  return saida;
}

/** A marca, num sítio só: a var `PACOTE_PARTILHADO` declarada no config do Worker. */
function ehMarcado(texto) {
  return Boolean(texto) && /"PACOTE_PARTILHADO"/.test(texto);
}

/** A versão do servidor: o leitor devolve promessas (a API do GitHub). */
async function scriptsDeShard({ caminhos, lerTexto, raiz = 'danca' } = {}) {
  const shards = [];
  for (const { caminho, slug } of configsSemElo(caminhos, raiz)) {
    let texto = null;
    try { texto = await lerTexto(caminho); } catch (erro) { texto = null; }
    if (ehMarcado(texto)) shards.push(slug);
  }
  return shards.sort();
}

/** A versão do disco: o leitor é síncrono (`fs.readFileSync`). */
function scriptsDeShardSync({ caminhos, lerTexto, raiz = 'danca' } = {}) {
  const shards = [];
  for (const { caminho, slug } of configsSemElo(caminhos, raiz)) {
    let texto = null;
    try { texto = lerTexto(caminho); } catch (erro) { texto = null; }
    if (ehMarcado(texto)) shards.push(slug);
  }
  return shards.sort();
}

module.exports = {
  slugDoConfig, slugsComElo, configsSemElo, ehMarcado, scriptsDeShard, scriptsDeShardSync,
};
