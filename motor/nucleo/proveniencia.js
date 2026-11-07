'use strict';

/**
 * proveniencia.js — A PROVENIÊNCIA EXISTE, E ESTÁ BEM REGISTADA? (07/11/2026)
 *
 * O QUE ELE RESPONDE, E POR QUE ANTES DO EXPURGO. O expurgo é irreversível: leva consigo as
 * âncoras (`.fipp`), as fontes do ciclo, os envelopes e o `wrangler.<escola>.jsonc`. Se alguma
 * coisa estiver por ancorar no momento em que ele corre, o que se perde não é «um arquivo» — é
 * a prova de que aquilo existiu, e sem ela não há como reconstruir a cadeia nem distinguir
 * «nunca foi ancorado» de «foi ancorado e apagado». Por isso a pergunta é feita ANTES: se a
 * proveniência falta ou está quebrada, o expurgo para e a correcção vem primeiro.
 *
 * O QUE É «ESTAR BEM REGISTADA». Quatro coisas, e nenhuma delas é opinião:
 *
 *   1. o ELO, `escola/<slug>/indice.json` — é a memória de que a escola existiu. Sem ele o
 *      expurgo fica sem onde escrever o que vai apagar;
 *   2. a CRIAÇÃO declarada (`recriacao[]`) — um elo que só tem expurgos descreve uma escola que
 *      nunca nasceu, e o responsável de hoje sai desse elo (`responsavelDoInventario`);
 *   3. a ÂNCORA de cada variante com fontes — `ciclo-NN-<escola>[-<variante>].fipp`;
 *   4. a COBERTURA — cada fonte da escola (`.conf` e `.md` do ciclo) aparece na `cobertura` de
 *      alguma âncora, e tudo o que a cobertura cita existe. Uma âncora que cobre menos do que
 *      existe é uma âncora velha: certifica um passado que já não é o presente.
 *
 * A recíproca também vale, e é a metade que engana: uma cobertura que cita um arquivo que já não
 * existe não é «cobertura larga» — é uma cadeia partida, e o `--check` do `hash-ciclo.sh` também
 * a recusa («a lista de fontes cobertas mudou»).
 *
 * ESTE MÓDULO É PURO, como o `indices.js`: não lê ficheiro, não fala com o GitHub, não olha o
 * relógio. Recebe os caminhos da árvore, o inventário já analisado e as âncoras JÁ LIDAS (quem
 * as lê é o `lerAncora` do `servidor/indice-acervo.js` — o mesmo que o índice usa, para não
 * haver duas gramáticas do `.fipp`). É o que permite a mesma auditoria correr no disco
 * (`tools/auditar-proveniencia.js`, `escola/expurgar.js`) e sobre a árvore do GitHub
 * (`servidor/repo-escola.js`), sem que as duas possam divergir.
 *
 * O QUE ELE **NÃO** FAZ: recalcular o hash. A fórmula tem um dono (`tools/hash-ciclo.sh`), e uma
 * segunda implementação é a que divergiria — o mesmo argumento do «o índice copia a âncora; não
 * a calcula». Quem quiser o hash conferido contra as fontes vivas corre o `--check` do script,
 * e a auditoria local corre-o por variante.
 */

const { cicloDoCaminho, escolaDoSufixo } = require('./indices.js');

/** O nome de um arquivo DIRECTAMENTE dentro de `professores/<p>/ciclos/` — e só esses são
 * fontes. O que está dentro de `ciclo-NN-<escola>/` é pacote: saída gerada, e a âncora não a
 * cobre de propósito (P-04). */
const RE_DIRETO_NO_CICLOS = /^professores\/([^/]+)\/ciclos\/([^/]+)$/;

/** `ciclo-01-breu.conf` → `{numero:'01', resto:'breu', ext:'conf'}`; `ciclo-01.conf` → resto nulo. */
const RE_NOME_DO_CICLO = /^ciclo-([0-9]{2})(?:-(.+?))?\.([a-z0-9.]+)$/;

const EXTENSOES_DE_FONTE = new Set(['conf', 'md']);
const HEX64 = /^[0-9a-f]{64}$/;

/** Lê o nome de um arquivo do `ciclos/` na forma que a auditoria usa. */
function nomeDoCiclo(nome) {
  const m = RE_NOME_DO_CICLO.exec(String(nome || ''));
  if (!m) return null;
  return { numero: m[1], resto: m[2] || null, ext: m[3] };
}

/** A ÂNCORA de uma aula? `…-aula-03.fipp` — a que não encadeia com a anterior (ARQUITETURA-AULA
 * §5.2). A do ciclo é a que não tem `-aula-NN`. */
function numeroDaAula(resto) {
  const m = /-aula-([0-9]{2})$/.exec(String(resto || ''));
  return m ? m[1] : null;
}

/**
 * OS ARTEFACTOS DA ESCOLA — o que o expurgo levaria consigo, classificado.
 *
 * A ESCOLA de um arquivo sai da MESMA regra que o resto do sistema usa (`escolaDoSufixo`, do
 * `indices.js`): o sufixo do nome começa pela escola, e a escola é a lista que o chamador
 * conhece. Uma segunda regex aqui descreveria uma escola que o expurgo não reconhece — e a
 * auditoria diria «está tudo ancorado» sobre arquivos que ninguém ia apagar.
 */
function artefatosDaEscola(slug, caminhos) {
  const fontes = [];
  const ancoras = [];
  for (const caminho of caminhos) {
    const dir = RE_DIRETO_NO_CICLOS.exec(caminho);
    if (!dir) continue;
    const partes = nomeDoCiclo(dir[2]);
    if (!partes || !partes.resto) continue;
    if (escolaDoSufixo(partes.resto, [slug]) !== slug) continue;
    if (partes.ext === 'fipp') {
      ancoras.push({ caminho, professor: dir[1], numero: partes.numero, resto: partes.resto, aula: numeroDaAula(partes.resto) });
    } else if (EXTENSOES_DE_FONTE.has(partes.ext)) {
      fontes.push({ caminho, professor: dir[1], numero: partes.numero, resto: partes.resto, ext: partes.ext });
    }
  }
  const porCaminho = (a, b) => (a.caminho < b.caminho ? -1 : a.caminho > b.caminho ? 1 : 0);
  fontes.sort(porCaminho);
  ancoras.sort(porCaminho);
  return { fontes, ancoras };
}

/**
 * OS PACOTES da escola — as pastas `ciclo-NN-<variante>/`.
 *
 * É a MESMA descoberta do `gerar-relacoes.js` (`ciclosNoDisco`): o pacote é um DIRETÓRIO cujo
 * nome é `ciclo-NN-<variante>`. Aqui ela existe porque o mapa de relações nasce do pacote e não
 * das fontes — sem esta lista, a auditoria exigiria um mapa a quem nunca poderia tê-lo.
 */
function pacotesDaEscola(slug, caminhos) {
  const vistos = new Map();
  for (const caminho of caminhos) {
    const m = /^professores\/([^/]+)\/ciclos\/ciclo-([0-9]{2})-([^/]+)\//.exec(caminho);
    if (!m) continue;
    // A variante pode ser composta: é a ESCOLA que a resolve, e o mais longo ganha. A pasta do
    // pacote nunca é mais curta do que a escola, e o sufixo seguinte é `-`.
    if (escolaDoSufixo(m[3], [slug]) !== slug) continue;
    vistos.set(m[1] + '/' + m[2] + '/' + m[3], { professor: m[1], numero: m[2], variante: m[3] });
  }
  return [...vistos.values()].sort((a, b) => (a.professor + a.numero + a.variante < b.professor + b.numero + b.variante ? -1 : 1));
}

/**
 * O SHA-256 DO CONJUNTO — pela Web Crypto, e não pelo `require('crypto')` (07/11/2026).
 *
 * O DEFEITO, medido no deploy: `require('crypto')` é um módulo DO NODE, e o runtime dos Workers
 * não o tem — o build morria com «Could not resolve "crypto"» e as duas publicações ficavam
 * vermelhas. `globalThis.crypto.subtle` existe nos dois lados (é o que o `bastidores.js` já usa
 * para o hash da senha), e é essa a razão de a impressão ser ASSÍNCRONA: o `subtle.digest`
 * devolve uma promessa.
 *
 * A ASSINCRONIA FICA AQUI, e não espalhada: `auditar` passa a ser `async`, e os três chamadores
 * já eram (a metade do repositório e o `escola/expurgar.js` são assíncronos de qualquer forma; o
 * `tools/auditar-proveniencia.js` é um script, e um `await` no topo não custa nada).
 */
async function impressao(ancoras) {
  const linhas = ancoras
    .map((a) => String(a.id || a.caminho) + ':' + String(a.hash || ''))
    .sort();
  const bytes = new TextEncoder().encode(linhas.join('\n'));
  const digesto = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  let hex = '';
  for (const b of new Uint8Array(digesto)) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/**
 * A IMPRESSÃO da proveniência — o que existia, num só hash.
 *
 * Não substitui as âncoras: depois do expurgo elas já não estão, e o que fica no elo é isto. É
 * um resumo verificável do conjunto (id + hash de cada âncora, em ordem): quem tiver o mesmo
 * conjunto chega ao mesmo valor, e quem tiver outro vê que não bate.
 *
 * (A implementação está acima, junto da nota do porquê de ser assíncrona.)
 */

/**
 * A AUDITORIA. Devolve `{ok, problemas, ancoras, fontes, impressao, resumo}` — nunca rejeita por
 * um dado em falta: a falta É o resultado.
 *
 *   slug ...... a escola que se quer expurgar
 *   caminhos .. todos os caminhos da árvore do repositório (só os que existem)
 *   indice .... o `escola/<slug>/indice.json` já analisado, ou null
 *   ancoras ... `{ [caminho]: campos }` — o que o `lerAncora` devolveu de cada `.fipp`
 */
async function auditar({ slug, caminhos, indice, ancoras }) {
  const arvore = Array.isArray(caminhos) ? caminhos : [];
  const lidas = ancoras || {};
  const existe = new Set(arvore);
  const problemas = [];
  const bloqueia = (codigo, mensagem) => problemas.push({ codigo, mensagem });

  const { fontes, ancoras: doCiclo } = artefatosDaEscola(slug, arvore);

  // 1. O ELO. Sem ele não há onde escrever o que se apaga, nem memória de que a escola existiu.
  if (!existe.has('escola/' + slug + '/indice.json')) {
    bloqueia('sem-elo', 'a escola não tem elo em `escola/' + slug + '/indice.json` — '
      + 'não há onde registar o expurgo, nem memória de que esta escola existiu');
  } else if (!indice || typeof indice !== 'object') {
    bloqueia('elo-ilegivel', 'o elo `escola/' + slug + '/indice.json` existe mas não é um JSON legível');
  } else if (!Array.isArray(indice.recriacao) || !indice.recriacao.length) {
    // 2. A CRIAÇÃO. Um elo com expurgos e sem recriação descreve uma escola que nunca nasceu — e
    // é do elo mais recente de `recriacao[]` que sai o responsável de hoje.
    bloqueia('sem-recriacao', 'o elo não declara nenhuma criação (`recriacao[]`): '
      + 'não se sabe quando nem por quem esta encarnação nasceu');
  }

  // 3. A ÂNCORA DE CADA VARIANTE COM FONTES. É o que a cadeia certifica.
  const ancorasPorVariante = new Map();
  for (const a of doCiclo) {
    if (a.aula) continue;
    ancorasPorVariante.set(a.professor + '/ciclo-' + a.numero + '-' + a.resto, a);
  }
  const variantes = new Map();
  for (const f of fontes) {
    if (f.ext !== 'conf') continue;
    const chave = f.professor + '/ciclo-' + f.numero + '-' + f.resto;
    variantes.set(chave, f);
  }
  for (const [chave, fonte] of variantes) {
    if (ancorasPorVariante.has(chave)) continue;
    bloqueia('sem-ancora', 'a variante `' + fonte.caminho.replace(/\.conf$/, '')
      + '` tem fontes e não tem âncora (`.fipp`): a proveniência desta variante não existe');
  }

  // 4. AS ÂNCORAS QUE EXISTEM: bem formadas, e a citar o que existe.
  const cobertos = new Set();
  for (const a of doCiclo) {
    const campos = lidas[a.caminho];
    const base = a.caminho.replace(/\.fipp$/, '');
    if (!campos) {
      bloqueia('ancora-ilegivel', '`' + a.caminho + '` está no caminho mas não foi possível ler');
      continue;
    }
    const esperado = base.split('/').pop();
    if (String(campos.id || '') !== esperado) {
      bloqueia('ancora-id', '`' + a.caminho + '`: o `id` da âncora («' + String(campos.id || '')
        + '») não é o nome do arquivo («' + esperado + '»)');
    }
    if (!HEX64.test(String(campos.hash || ''))) {
      bloqueia('ancora-hash', '`' + a.caminho + '`: o `hash` não é SHA-256 em hexadecimal');
    }
    if (!HEX64.test(String(campos.hash_conteudo || ''))) {
      bloqueia('ancora-hash-conteudo', '`' + a.caminho + '`: o `hash_conteudo` não é SHA-256 em hexadecimal');
    }
    if (String(campos.algoritmo || '').toUpperCase().replace('-', '') !== 'SHA256') {
      bloqueia('ancora-algoritmo', '`' + a.caminho + '`: o `algoritmo` declarado («'
        + String(campos.algoritmo || '') + '») não é SHA-256');
    }
    const lista = Array.isArray(campos.cobertura) ? campos.cobertura : [];
    if (!lista.length) {
      bloqueia('ancora-sem-cobertura', '`' + a.caminho + '`: a âncora não declara cobertura nenhuma — '
        + 'não se sabe o que ela certifica');
    }
    for (const citado of lista) {
      cobertos.add(citado);
      // 5. A COBERTURA NÃO PODE CITAR O QUE JÁ NÃO EXISTE.
      if (!existe.has(citado)) {
        bloqueia('cobertura-quebrada', '`' + a.caminho + '` cita `' + citado
          + '`, que já não existe na árvore — a cadeia está partida');
      }
    }
    /* 6. A ÂNCORA ÓRFÃ: certifica uma variante que já não está lá.
     *
     * A ÂNCORA DE UMA AULA NÃO TEM MANIFESTO PRÓPRIO (07/11/2026), e a regra não sabia disso. Ela
     * exigia `base + '.conf'` de TODA a âncora, e para uma `…-aula-01.fipp` isso é
     * `…-aula-01.conf` — um ficheiro que não existe nem pode existir: o manifesto é o da VARIANTE
     * (`…-sala-rosa.conf`), e a âncora da aula é ADITIVA a ele, com `parentHash` vazio e cobertura
     * restrita às fontes daquela aula (ver o `hash-ciclo.sh`, §5.2/§5c).
     *
     * O EFEITO, medido no expurgo da `breu`: a auditoria reprovava por `ancora-orfa` uma cadeia
     * que estava íntegra — o `hash-ciclo --check` da mesma variante passava, todas as coberturas
     * existiam —, e o expurgo foi RECUSADO com «corrija primeiro». A instrução era impossível de
     * cumprir: reancorar não muda o nome do manifesto, porque o manifesto errado era o que a
     * regra procurava. Um falso bloqueio no passo que antecede a operação mais destrutiva do
     * sistema custa caro dos dois lados: impede o expurgo legítimo, e ensina a usar o `--forcar`.
     *
     * O que se procura para uma âncora de aula é o manifesto DA VARIANTE — o mesmo `-aula-NN`
     * removido do caminho. Para a do ciclo nada muda: `base + '.conf'` já é o manifesto. */
    const manifesto = a.aula
      ? a.caminho.replace(new RegExp('-aula-' + a.aula + '\\.fipp$'), '.conf')
      : base + '.conf';
    if (!existe.has(manifesto)) {
      bloqueia('ancora-orfa', '`' + a.caminho + '` não tem o manifesto `'
        + manifesto.split('/').pop()
        + '`: a âncora certifica uma variante que já não existe');
    }
  }

  // 7. TODA FONTE COBERTA. Uma fonte fora de qualquer cobertura é trabalho que a cadeia não viu —
  // e o expurgo apagá-la-ia sem deixar rasto de que existiu.
  for (const f of fontes) {
    if (cobertos.has(f.caminho)) continue;
    bloqueia('fonte-sem-cobertura', '`' + f.caminho + '` existe e nenhuma âncora o cobre — '
      + 'o ciclo mudou depois da última ancoragem');
  }

  /* 8. A DERIVAÇÃO PENDENTE. `indices/` é derivado, e o expurgo é também a ocasião de conferir
   * que ele está em dia: uma escola com fontes e sem índice de ciclo quer dizer que o derivado
   * ficou para trás, e expurgar agora gravaria o expurgo sobre um índice que já mentia.
   *
   * SÃO TRÊS DERIVADOS, E CADA UM TEM A SUA CONDIÇÃO — não é gosto, é o que cada gerador produz:
   *   · `indices/escolas/<escola>.json` — há sempre que a escola tenha pegada (o índice nasce do
   *     elo, e o elo sobrevive: uma escola expurgada continua a ter o seu, com `expurgada: true`);
   *   · `indices/ciclos/<prof>/<NN>-<escola>.json` — nasce das FONTES do ciclo;
   *   · `indices/relacoes/<prof>/<NN>-<variante>.json` — nasce do PACOTE (`gerar-relacoes` só
   *     conhece ciclos com pacote no disco), e por isso não se exige a quem não tem pacote. */
  const pacotes = pacotesDaEscola(slug, arvore);
  if (fontes.length || pacotes.length) {
    if (!existe.has('indices/escolas/' + slug + '.json')) {
      bloqueia('indexacao-pendente', '`indices/escolas/' + slug + '.json` não existe — '
        + 'a derivação do índice está pendente');
    }
  }
  const vistos = new Set();
  for (const f of fontes) {
    const chave = f.professor + '/ciclo-' + f.numero;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    const alvo = 'indices/ciclos/' + f.professor + '/' + f.numero + '-' + slug + '.json';
    if (!existe.has(alvo)) {
      bloqueia('indexacao-pendente', '`' + alvo + '` não existe — a derivação está pendente');
    }
  }
  for (const p of pacotes) {
    const alvo = 'indices/relacoes/' + p.professor + '/' + p.numero + '-' + p.variante + '.json';
    if (!existe.has(alvo)) {
      bloqueia('indexacao-pendente', '`' + alvo + '` não existe — a derivação das relações está pendente');
    }
  }

  const resumoDasAncoras = doCiclo.map((a) => {
    const campos = lidas[a.caminho] || {};
    return {
      caminho: a.caminho,
      id: campos.id || null,
      hash: campos.hash || null,
      tipo: numeroDaAula(a.resto) ? 'Aula' : 'Ciclo',
      aula: numeroDaAula(a.resto),
      cobertura: Array.isArray(campos.cobertura) ? campos.cobertura.slice().sort() : [],
    };
  });

  return {
    escola: slug,
    ok: problemas.length === 0,
    problemas,
    ancoras: resumoDasAncoras,
    fontes: fontes.map((f) => f.caminho),
    impressao: resumoDasAncoras.length ? await impressao(resumoDasAncoras) : null,
    resumo: {
      ancoras: resumoDasAncoras.length,
      fontes: fontes.length,
      variantes: variantes.size,
      cobertos: cobertos.size,
    },
  };
}

module.exports = {
  auditar,
  artefatosDaEscola,
  pacotesDaEscola,
  impressao,
  nomeDoCiclo,
  numeroDaAula,
};
