#!/usr/bin/env node
'use strict';

/*
 * lib-pacote.js — encontra um pacote de ciclo GERADO, sem nomear escola nenhuma.
 *
 * POR QUE EXISTE (21/10/2026). As provas escritas nesta semana apontavam para
 * `professores/sapo-bailarino/ciclos/ciclo-01-batata-bale-nivel-1-teste-2`. As escolas deste
 * protótipo são DESCARTÁVEIS por desenho — nascem para provar o modelo e são expurgadas
 * quando cumpriram o papel. Uma prova que escreve o nome de uma delas morre no dia do
 * expurgo, e morre por um motivo que não tem nada a ver com o que mede: o título que encolhe,
 * o menu que cabia, o front-matter que abria.
 *
 * É a MESMA lição do alfabeto de notação (`39e24c5`): o alfabeto não nomeia escola nenhuma,
 * nem viva nem expurgada, porque o que ele declara é uma escrita e não um ciclo. Aqui o que
 * se procura é uma FORMA — um pacote gerado —, e qualquer uma serve: as provas medem o
 * documento, não a escola.
 *
 * O QUE CONTA COMO PACOTE. Um diretório `professores/<professor>/ciclos/ciclo-NN-<escola>/`
 * com PELO MENOS UMA PÁGINA de documento dentro — `plano.html`, `aula-NN.html`, `notacao.html`,
 * `referencias.html`… O `index.html` NÃO serve de critério: ele também existe no ESQUELETO do
 * ciclo-zero (a pasta que a escola tem antes de haver documentos, com `assets/` e a
 * apresentação), e uma prova que o apanhasse mediria uma pasta sem nada para medir. Foi o que
 * aconteceu à primeira versão deste módulo: ela escolheu o esqueleto `ciclo-01-batata` e não
 * achou nem `aula-01.html` nem `captura-aula-01.html`.
 *
 * E O ESQUELETO TEM OUTRA ARMADILHA: o nome dele é PREFIXO do nome da variante que vive ao
 * lado (`ciclo-01-batata` e `ciclo-01-batata-bale-nivel-1-teste-2`), de modo que «todos os
 * ficheiros que começam por `<pacote>-`» apanha as fontes da OUTRA variante. Por isso as
 * fontes são filtradas pela família de documento — a MESMA lista que o índice usa
 * (`motor/nucleo/indices.js`), e não uma segunda opinião escrita aqui.
 *
 * A ESCOLHA É DETERMINÍSTICA — ordem alfabética do caminho —, e não «a primeira que aparecer»:
 * o sistema de ficheiros não promete ordem, e uma prova que mede um pacote diferente a cada
 * execução não é reproduzível.
 */

const fs = require('fs');
const path = require('path');
const { tipoDoDocumento, escolaDoSufixo } = require('../motor/nucleo/indices.js');
/* A REGRA DO EXPURGO É UMA SÓ, e é a do `expurgar.js`: a mesma que o `post-merge` usa para não
 * apagar uma escola recriada. Importá-la é o que impede esta camada de ter uma segunda opinião
 * sobre «esta escola existe» — a que apaga é a que importa, e as duas têm de concordar. */
const { foiRecriada } = require('../escola/expurgar.js');

const RAIZ = path.join(__dirname, '..');
const CICLOS = path.join(RAIZ, 'professores');

/* ------------------------------------------------------------------ o registro do expurgo
 *
 * O EXPURGO NÃO É UMA AUSÊNCIA ANÓNIMA (27/10/2026). As escolas deste protótipo nascem e são
 * expurgadas em ciclo — a `batata` foi expurgada CINCO vezes e recriada quatro, a `breu` duas e
 * duas. Quem pergunta «existe pacote?» e recebe «não» não sabe se o ciclo nunca foi gerado, se
 * a escola foi expurgada, ou se alguém apagou ficheiros sem registo. As três respostas levam a
 * acções diferentes, e o sistema JÁ SABE distingui-las: o elo do expurgo fica em
 * `escola/<slug>/indice.json` (`expurgo[]`/`recriacao[]`), e a regra que diz qual dos dois é o
 * presente é uma só — `foiRecriada` do `escola/expurgar.js`. Era a única coisa que faltava:
 * alguém que a LÊSSE. O `expurgar.js` escrevia, a prova da recriação verificava, e nenhum
 * consumidor perguntava.
 *
 * O QUE ISTO MUDA. Um pacote cuja escola está registada como expurgada é DESCONSIDERADO — não
 * escolhido, não medido, não publicado. O que resta em disco de uma escola expurgada é resto,
 * e resto não é fixture.
 *
 * O QUE ISTO NÃO FAZ. Não inventa estado para escola que o registro não conhece: sem
 * `escola/<slug>/indice.json` a escola é tratada como VIVA (o lado permissivo — o pacote está
 * em disco, e é isso que se procurou). Não consulta `indices/escolas/<slug>.json`: esses são
 * DERIVADOS por um workflow que corre em paralelo com o deploy, e ler deles introduziria uma
 * corrida. O registro do expurgo é a fonte; o índice é a cópia.
 */
const ESCOLA = path.join(RAIZ, 'escola');

/** O instante mais recente de uma lista de elos (`expurgo[]`, `recriacao[]`), em ms. */
function eloMaisRecente(lista) {
  return (Array.isArray(lista) ? lista : [])
    .map((e) => Date.parse((e && e.em) || ''))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a)[0];
}

/**
 * O ESTADO DE CADA ESCOLA, lido do registro. `Map` slug → `{slug, viva, expurgos, ultimo_expurgo}`.
 *
 * `viva` usa a regra ÚNICA do projeto (`foiRecriada`): uma escola expurgada e depois recriada
 * está viva, porque a recriação é posterior ao expurgo. Duas definições disso seriam duas
 * respostas, e a que apaga é a que importa.
 */
function estadoDasEscolas() {
  const mapa = new Map();
  let slugs = [];
  try {
    slugs = fs.readdirSync(ESCOLA, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return mapa;
  }
  for (const slug of slugs) {
    let indice = null;
    try {
      indice = JSON.parse(fs.readFileSync(path.join(ESCOLA, slug, 'indice.json'), 'utf8'));
    } catch {
      continue;                                   // pasta de escola sem indice.json: não é registro
    }
    if (!indice || typeof indice !== 'object') continue;
    const expurgos = Array.isArray(indice.expurgo) ? indice.expurgo : [];
    const quando = eloMaisRecente(expurgos);
    mapa.set(slug, {
      slug,
      viva: expurgos.length === 0 || foiRecriada(indice),
      expurgos: expurgos.length,
      ultimo_expurgo: quando === undefined ? null : new Date(quando).toISOString().slice(0, 10),
    });
  }
  return mapa;
}

/**
 * A ESCOLA a que um pacote pertence. A pasta é `ciclo-NN-<variante>`, e a variante começa pelo
 * slug da escola (`batata`, `batata-bale-nivel-2-teste-2`). O casamento é do `escolaDoSufixo` do
 * ÍNDICE — a mesma função que o acervo usa —, e não de uma segunda opinião escrita aqui: é o
 * mesmo `escolaDoSufixo` que já sabe que `x-teste-1` há-de casar com `x`, e não perder para `x`.
 */
function escolaDoPacote(pacote, slugs) {
  const sufixo = path.basename(pacote).replace(/^ciclo-\d{2}-/, '');
  const lista = slugs || [...estadoDasEscolas().keys()];
  return escolaDoSufixo(sufixo, lista);
}

/**
 * ESTE PACOTE PODE SER USADO? Devolve o veredicto E o motivo, porque o motivo é o que se diz a
 * quem fica sem pacote. Sem veredicto escrito, a ausência volta a ser anónima.
 */
function pacoteElegivel(pacote, registro) {
  const mapa = registro || estadoDasEscolas();
  const escola = escolaDoPacote(pacote, [...mapa.keys()]);
  if (!escola) return { elegivel: true, escola: null, motivo: 'escola fora do registro' };
  const estado = mapa.get(escola);
  if (!estado) return { elegivel: true, escola, motivo: 'escola fora do registro' };
  return estado.viva
    ? { elegivel: true, escola, motivo: 'viva' }
    : {
      elegivel: false,
      escola,
      motivo: 'expurgada em ' + (estado.ultimo_expurgo || 'data não registada')
        + (estado.expurgos > 1 ? ' (' + estado.expurgos + ' expurgos)' : ''),
    };
}

/** As pastas com FORMA de pacote, em ordem alfabética e como caminho relativo. Sem filtro. */
function pastasComPagina() {
  const achados = [];
  let professores = [];
  try {
    professores = fs.readdirSync(CICLOS, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return achados;
  }
  for (const professor of professores) {
    const dir = path.join(CICLOS, professor, 'ciclos');
    let entradas = [];
    try {
      entradas = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entradas) {
      if (!e.isDirectory()) continue;
      if (!/^ciclo-\d{2}-.+/.test(e.name)) continue;
      let paginasDoPacote = [];
      try {
        paginasDoPacote = fs.readdirSync(path.join(dir, e.name))
          .filter((n) => n.endsWith('.html') && n !== 'index.html');
      } catch {
        continue;
      }
      if (!paginasDoPacote.length) continue;     // esqueleto do ciclo-zero, não pacote
      achados.push(path.posix.join('professores', professor, 'ciclos', e.name));
    }
  }
  return achados.sort();
}

/**
 * OS PACOTES USÁVEIS — as pastas com forma de pacote cuja escola o registro diz estar VIVA.
 *
 * O que resta em disco de uma escola expurgada é resto, e resto não é fixture. A pasta pode
 * sobreviver a um expurgo parcial, a um `git stash`, a um checkout a meio: o registro é que
 * decide, e o que ele diz é «esta escola já não existe». Daí o filtro, e não a confiança na
 * ausência de ficheiros.
 */
function pacotes() {
  const registro = estadoDasEscolas();
  return pastasComPagina().filter((p) => pacoteElegivel(p, registro).elegivel);
}

/**
 * PORQUE NÃO HÁ PACOTE — a ausência EXPLICADA, para quem tem de continuar sem ele.
 *
 * Devolve `{ usados, pulados, escolas }`. `pulados` são as pastas que existem em disco e foram
 * desconsideradas, com o motivo; `escolas` é o estado de cada uma, lido do registro. É o que
 * transforma «não há pacote» (que se lê como avaria) em «a `batata` foi expurgada em 27/10 e a
 * `breu` ainda não tem ciclo gerado» (que se lê como estado).
 */
function relatorioDePacotes() {
  const registro = estadoDasEscolas();
  const emDisco = pastasComPagina();
  const usados = [];
  const pulados = [];
  for (const pacote of emDisco) {
    const veredicto = pacoteElegivel(pacote, registro);
    if (veredicto.elegivel) usados.push(pacote);
    else pulados.push({ pacote, escola: veredicto.escola, motivo: veredicto.motivo });
  }
  return { usados, pulados, escolas: [...registro.values()] };
}

/**
 * Um pacote gerado. Falha ALTO e com o remédio escrito quando não há nenhum — uma prova que
 * devolvesse `null` e medisse o vazio passaria sem provar nada, que é o pior desfecho possível
 * para uma prova.
 *
 * O `throw` FICA, e a distinção importa (27/10/2026): uma PROVA mede um documento real, e sem
 * documento não há o que medir — falhar é a resposta honesta. Quem não pode falhar é o DEPLOY,
 * porque uma página de bancada não é razão para deixar uma escola sem publicar; esse caminho é
 * o `relatorioDePacotes`, e é o `construir.js` que o usa.
 */
function umPacote() {
  const lista = pacotes();
  if (lista.length) return lista[0];
  /* A MENSAGEM DIZ O ESTADO, NÃO A MINHA SUPOSIÇÃO. «Nenhum pacote no repositório» era verdade
     e não informava: quem a lia não sabia se faltava gerar, se a escola tinha sido expurgada, ou
     se alguém apagou ficheiros. As três pedem coisas diferentes de quem está a ler. */
  const { pulados, escolas } = relatorioDePacotes();
  const vivas = escolas.filter((e) => e.viva).map((e) => e.slug);
  const linhas = [
    'lib-pacote: nenhum pacote de ciclo gerado que se possa medir.',
    '  — as provas que usam este módulo medem um documento REAL; sem ele não há o que medir.',
    '  escolas vivas: ' + (vivas.length ? vivas.join(', ') : '(nenhuma)'),
  ];
  for (const p of pulados) {
    linhas.push('  desconsiderado: ' + p.pacote + ' — ' + p.escola + ' ' + p.motivo);
  }
  const expurgadas = escolas.filter((e) => !e.viva);
  if (expurgadas.length) {
    linhas.push('  expurgadas: ' + expurgadas.map((e) => e.slug + ' (' + (e.ultimo_expurgo || '?') + ')').join(', '));
  }
  linhas.push('  remédio: gere um ciclo com tools/gerar-ciclo.sh.');
  throw new Error(linhas.join('\n'));
}

/** As páginas HTML do pacote, ordenadas. */
function paginas(pacote) {
  const dir = path.join(RAIZ, pacote);
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith('.html'))
    .sort();
}

/** O primeiro nome de página do pacote que casa com o padrão (ou `null`). */
function umaPagina(pacote, padrao) {
  return paginas(pacote).find((n) => padrao.test(n)) || null;
}

/**
 * As FONTES variantes do ciclo a que o pacote pertence — `ciclo-01-<escola>*.md`, sem o `.conf`
 * e sem os arquivos que não viram página (`-dados*`, `-po`, `-plano`).
 *
 * O `pacote` termina no nome da variante: `…/ciclos/ciclo-01-<escola>`, e as fontes vivem em
 * `…/ciclos/ciclo-01-<escola>-<documento>.md`, ao lado da pasta.
 */
function fontesDoPacote(pacote) {
  const dir = path.join(RAIZ, path.dirname(pacote));
  const variante = path.basename(pacote);
  return fs.readdirSync(dir)
    .filter((n) => n.startsWith(variante + '-') && /\.md$/.test(n))
    // A família vem do índice, não de uma lista paralela: aqui só interessam os documentos que
    // viram PÁGINA. O `-po`, o `-plano` e o `-dados` também são fontes, mas têm validadores
    // próprios e vêm de outros envelopes — quem os confere não é uma prova de documento.
    .filter((n) => {
      const tipo = tipoDoDocumento(n, variante.replace(/^ciclo-\d{2}-/, ''));
      return tipo === 'aula' || tipo === 'captura' || tipo === 'harmonizacao'
        || tipo === 'notacao' || tipo === 'glossario' || tipo === 'referencias';
    })
    .sort();
}

/**
 * UM CAMINHO COM A FORMA DE PACOTE — para as provas que exercitam REGRAS DE NOME e não leem
 * ficheiro nenhum.
 *
 * `provar-indices` compõe caminhos como `…/ciclo-01-<escola>/plano.html` só para os passar às
 * regras do `indices/esquema/tipos.json`, que são expressões regulares. Exigir dela um pacote
 * REAL seria pedir-lhe uma dependência que ela não tem — e, no intervalo entre um expurgo e a
 * geração seguinte, deixá-la-ia sem correr. Devolve o pacote real quando existe (é o que se
 * quer: um caminho verdadeiro exercita as regras com o que o gerador escreve) e, quando não
 * existe nenhum, um caminho sintético com a mesma forma.
 */
function caminhoDeExemplo() {
  const lista = pacotes();
  return lista.length ? lista[0] : 'professores/exemplo/ciclos/ciclo-01-exemplo';
}

/**
 * O `.conf` de uma VARIANTE (escola/turma) que exista em disco, ou `null`.
 *
 * Pelo mesmo motivo de `umPacote()`: uma prova que nomeia `ciclo-01-valse.conf` morre no dia em
 * que a `valse` é expurgada — e a prova não media a `valse`, media a REGRA (o Pré-requisito 5
 * recusa a lacuna `[Preencher: …]` em `DATA_INICIO`). Quem chama deve ter um plano B sintético
 * quando isto devolver `null`; o que não pode é o plano B ser o silêncio.
 */
function umConfDeVariante() {
  let encontrados = [];
  try {
    encontrados = fs.readdirSync(CICLOS, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .flatMap((e) => {
        const dir = path.join(CICLOS, e.name, 'ciclos');
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir)
          .filter((n) => /^ciclo-\d{2}-[a-z0-9-]+\.conf$/.test(n))
          .map((n) => path.join(dir, n));
      });
  } catch {
    return null;
  }
  encontrados.sort();
  return encontrados.length ? encontrados[0] : null;
}

module.exports = {
  RAIZ, pacotes, umPacote, caminhoDeExemplo, paginas, umaPagina, fontesDoPacote,
  umConfDeVariante,
  estadoDasEscolas, escolaDoPacote, pacoteElegivel, relatorioDePacotes, pastasComPagina,
};
