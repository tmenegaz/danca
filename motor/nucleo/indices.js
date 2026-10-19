'use strict';

/**
 * indices.js — O ÍNDICE DO ACERVO: derivado, determinístico e reconstruível.
 *
 * O QUE ELE RESOLVE (20/10/2026, a fase 4). Até aqui cada pergunta sobre o acervo era uma
 * VARREDURA: a lista de escolas, a de professores, a de ciclos e a de documentos custavam, cada
 * uma, uma leitura da árvore do repositório — e cada filtro novo repetia a varredura inteira. As
 * perguntas da escola («que documentos deste professor existem?», «que ciclos têm âncora?»,
 * «quantas aulas já foram dadas?») eram respondidas por quem soubesse percorrer caminhos.
 *
 * O índice responde isso uma vez. Ele é o que o `PLANO-INDICES.md` §2 declara: **derivado**
 * (nasce dos arquivos e das âncoras, não é fonte), **determinístico** (a mesma árvore dá o mesmo
 * JSON, byte a byte) e **reconstruível** (apagar e refazer dá o mesmo resultado — não há nada
 * aqui que só exista aqui).
 *
 * ESTE MÓDULO É PURO. Não lê ficheiro, não fala com o GitHub, não olha o relógio: recebe o que
 * já foi lido (`construir`) e devolve o índice. Quem lê é o `servidor/indice-acervo.js`. Essa
 * separação é o que permite provar o determinismo sem rede — e é o que faz o índice poder ser
 * construído tanto no Worker quanto num script.
 *
 * O QUE ELE NÃO GUARDA, E POR QUÊ.
 *
 *   · o CORPO dos documentos — o índice descreve, não copia. Guardar o texto seria uma segunda
 *     cópia a divergir da primeira;
 *   · o APELIDO da aluna no índice do ACERVO — é dado de menor, e o acervo é transversal (a
 *     raiz lê-o atrás de senha, mas o índice não é o lugar). O índice da ESCOLA, servido pelo
 *     Worker da própria escola, pode trazê-lo: é o mesmo dado que a estante dela já mostra;
 *   · as MARCAS e a PRESENÇA — elas vivem no lançamento da aula, que é cifrado no cofre, e não
 *     há leitor dele ainda. Em vez de inventar um campo vazio (que pareceria «zero marcas»), o
 *     índice DECLARA a ausência em `nao_indexado`, com o motivo. Uma lacuna com nome não mente.
 */

const VERSAO = 1;

// AS FAMÍLIAS QUE O ÍNDICE CONHECE. É o vocabulário mínimo que o acervo tem HOJE; um tipo novo
// entra aqui quando existir um arquivo que lhe corresponda — não antes (a regra do §4.1: não
// inventar tipos).
const TIPOS = {
  anamnese: { rotulo: 'Anamnese', familia: 'registro' },
  plano: { rotulo: 'Plano de ensino', familia: 'registro' },
  po: { rotulo: 'Plano de observação', familia: 'registro' },
  aula: { rotulo: 'Aula', familia: 'documento' },
  ciclo: { rotulo: 'Ciclo', familia: 'documento' },
  ancora: { rotulo: 'Âncora de proveniência', familia: 'proveniencia' },
};

// O QUE FICA DE FORA, DITO COM O MOTIVO. Isto não é comentário: viaja no JSON, e a prova exige
// que cada família ausente esteja declarada. Um índice que cala o que não tem faz o leitor supor
// que o zero é um facto.
const NAO_INDEXADO = [
  { familia: 'conteudo', motivo: 'o índice guarda metadados; o corpo dos documentos não se copia' },
  { familia: 'marcas', motivo: 'vivem no lançamento da aula, que é cifrado no cofre — ainda sem leitor' },
  { familia: 'presenca', motivo: 'idem: o lançamento não tem leitor, e um zero aqui seria mentira' },
  { familia: 'alunas-no-acervo', motivo: 'dado de menor: o apelido só aparece no índice da própria escola' },
  { familia: 'senhas', motivo: 'nunca — nem hash, nem sal' },
];

// ------------------------------------------------------------------ utilitários

const porTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function ordenar(itens, chave) {
  const lista = itens.slice();
  lista.sort((a, b) => porTexto(String(a[chave]), String(b[chave])));
  return lista;
}

/** As chaves de um objeto em ordem — é o que torna dois índices iguais comparáveis byte a byte. */
function comChavesOrdenadas(valor) {
  if (Array.isArray(valor)) return valor.map(comChavesOrdenadas);
  if (valor && typeof valor === 'object') {
    const saida = {};
    for (const chave of Object.keys(valor).sort(porTexto)) saida[chave] = comChavesOrdenadas(valor[chave]);
    return saida;
  }
  return valor;
}

/** O texto canónico de um índice — a forma com que `--check` compara dois. */
function canonico(indice) {
  return JSON.stringify(comChavesOrdenadas(indice));
}

/**
 * O ÍNDICE SEM OS CAMPOS VOLÁTEIS. `gerado_em` e `fonte.commit` mudam a cada geração e não
 * descrevem o acervo: incluí-los faria o `--check` reprovar sempre. A lista é curta e explícita
 * — um campo novo que seja volátil tem de ser declarado aqui, e é isso que o obriga a ser uma
 * decisão e não um esquecimento.
 */
function semVolateis(indice) {
  const copia = JSON.parse(JSON.stringify(indice));
  delete copia.gerado_em;
  if (copia.fonte) delete copia.fonte.commit;
  if (copia.fonte) delete copia.fonte.arvore;
  return copia;
}

/** `verdadeiro` para dois índices iguais fora os voláteis. */
function iguais(a, b) {
  return canonico(semVolateis(a)) === canonico(semVolateis(b));
}

// ------------------------------------------------------------------ as entidades

/**
 * O ID ESTÁVEL de cada entidade (§4.7 do plano). É o mesmo formato em todo o lado — o índice, a
 * consulta e a resposta —, porque um id que muda de forma entre camadas não serve para juntar.
 */
const idDeEscola = (slug) => 'escola:' + slug;
const idDeProfessor = (slug) => 'professor:' + slug;
const idDeCiclo = (professor, numero, escola) => 'ciclo:' + professor + '/' + numero + '/' + escola;
const idDeEnvelope = (resumo) => String(resumo.fonte || 'documento') + ':' + String(resumo.id || '');

/** O ano de um carimbo (`anamnese-20261019-1842` → `2026`); null quando não há carimbo. */
function anoDoCarimbo(id) {
  const m = /(\d{4})\d{2}\d{2}-\d{4}/.exec(String(id || ''));
  return m ? m[1] : null;
}

/** A data (ISO) de um carimbo — é ela que ordena a estante e responde «quando». */
function dataDoCarimbo(id) {
  const m = /(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(String(id || ''));
  if (!m) return null;
  return m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5];
}

/**
 * O ciclo a partir do caminho de um arquivo do pacote:
 * `professores/<professor>/ciclos/ciclo-01-<escola>-po.md` → `{professor, numero:'01', escola}`.
 *
 * O nome do arquivo é a autoridade — não o diretório —, e é a MESMA regra do expurgo
 * (`ehArquivoDaEscola`): se as duas divergirem, o índice descreveria um ciclo que o expurgo não
 * reconhece.
 */
const RE_DO_CICLO = /^professores\/([^/]+)\/ciclos\/ciclo-([0-9]{2})(?:-([a-z0-9-]+?))?(?=$|[/.-])/;
const SUFIXOS_DO_CICLO = new Set([
  'schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema',
  'po', 'plano', 'dados', 'dados.cifrado', 'ciclos', 'indice', 'manifesto',
]);

function cicloDoCaminho(caminho) {
  const m = RE_DO_CICLO.exec(String(caminho || ''));
  if (!m) return null;
  return { professor: m[1], numero: m[2], resto: m[3] || null, caminho };
}

/**
 * A ESCOLA de um arquivo do pacote. A variante é o sufixo do nome; mas ela pode ser composta
 * (`calango-bale-nivel-1-teste-1`), e o que separa a variante da escola é a ESCOLA — que não se
 * adivinha pelo caminho. Quem sabe a lista de escolas é o `construir`, e é ele que resolve:
 * aqui devolve-se o sufixo cru, e o casamento é feito por prefixo contra os slugs conhecidos
 * (o mais longo ganha, para `x-teste-1` não perder para `x`).
 */
function escolaDoSufixo(sufixo, slugs) {
  const s = String(sufixo || '');
  let achado = null;
  for (const slug of slugs) {
    if (s !== slug && s.indexOf(slug + '-') !== 0) continue;
    if (!achado || slug.length > achado.length) achado = slug;
  }
  return achado;
}

/** Um documento do ciclo, classificado pelo NOME (não pelo conteúdo). */
function tipoDoDocumento(caminho, escola) {
  const base = String(caminho || '').split('/').pop() || '';
  if (/\.fipp$/.test(base)) return 'ancora';
  if (/_schema\.json$/.test(base) || /-schema\.json$/.test(base)) return 'schema';
  if (/-po\.md$/.test(base)) return 'po';
  if (/-plano\.md$/.test(base)) return 'plano';
  if (/-aula-[0-9]{2}\.md$/.test(base)) return 'aula';
  if (/-dados\.cifrado\.json$/.test(base) || /-dados\.json$/.test(base)) return 'dados';
  if (/-captura\.md$/.test(base) || /-captura\.json$/.test(base)) return 'captura';
  if (/^ciclos\.json$/.test(base)) return 'indice';
  if (new RegExp('(^|-)' + escola + '(\\.|-)').test(base) && /\.conf$/.test(base)) return 'manifesto';
  if (/^ciclo-[0-9]{2}\.conf$/.test(base)) return 'manifesto';
  return null;
}

// ------------------------------------------------------------------ a construção

/**
 * O ÍNDICE, a partir do que já foi lido.
 *
 * `entrada` é:
 *   {
 *     fonte: {commit, arvore},                     // voláteis
 *     agora: 'AAAA-MM-DDTHH:MM',                    // o instante da geração (volátil)
 *     arvores: [caminho...],                        // a árvore inteira do repositório
 *     inventarios: {'fita': {objeto do indice.json}},
 *     envelopes: {'fita': [{nome, resumo}]},        // o resumo que o `envelope/.indice.json` guarda
 *     ancoras: {'professores/tiago/ciclos/ciclo-01-fita.fipp': {campos}},
 *     comApelido: false,                            // o índice da escola pode trazê-lo
 *   }
 *
 * Devolve `{acervo, escolas: {slug: indice}}` — o mestre (transversal, sem apelido) e o detalhe
 * por escola (com o que a escola pode ver).
 */
function construir(entrada) {
  const e = entrada || {};
  const caminhos = Array.isArray(e.arvores) ? e.arvores.slice() : [];
  const inventarios = e.inventarios || {};
  const envelopes = e.envelopes || {};
  const ancoras = e.ancoras || {};
  const comApelido = e.comApelido === true;

  // 1. AS ESCOLAS — o `wrangler.<slug>.jsonc`, que é a definição que sobrevive ao expurgo.
  const slugs = [];
  for (const caminho of caminhos) {
    const m = /^wrangler\.([a-z0-9-]+)\.jsonc$/.exec(caminho);
    if (!m) continue;
    if (m[1] === 'danca') continue;   // a raiz não é escola
    if (slugs.indexOf(m[1]) === -1) slugs.push(m[1]);
  }
  // Uma escola EXPURGADA já não tem wrangler, mas o inventário dela ficou como elo. Ela entra no
  // índice — com `expurgada: true` —, porque «esta escola existiu» é precisamente o que o elo
  // guarda, e uma lista que a omite apagaria a memória que o expurgo quis preservar.
  for (const caminho of caminhos) {
    const m = /^escola\/([a-z0-9-]+)\/indice\.json$/.exec(caminho);
    if (m && slugs.indexOf(m[1]) === -1) slugs.push(m[1]);
  }
  slugs.sort(porTexto);

  // 2. OS CICLOS — dos caminhos de `professores/**`.
  const porCiclo = new Map();   // id → {professor, numero, escola, documentos:[], variantes:Set}
  for (const caminho of caminhos) {
    if (caminho.indexOf('professores/') !== 0) continue;
    const c = cicloDoCaminho(caminho);
    if (!c || !c.resto) continue;                     // `ciclo-01.conf`: o manifesto base, sem escola
    const escola = escolaDoSufixo(c.resto, slugs);
    if (!escola) continue;                            // variante de escola que já não existe
    const tipo = tipoDoDocumento(caminho, escola);
    if (!tipo) continue;
    const id = idDeCiclo(c.professor, c.numero, escola);
    if (!porCiclo.has(id)) {
      porCiclo.set(id, {
        id,
        professor: c.professor,
        numero: c.numero,
        escola,
        documentos: [],
        tipos: new Set(),
      });
    }
    const ciclo = porCiclo.get(id);
    ciclo.documentos.push(caminho);
    ciclo.tipos.add(tipo);
  }

  // 3. AS ÂNCORAS. O índice COPIA a âncora; não a calcula (§8.1). O que ele lê do arquivo são os
  // campos que o `hash-ciclo.sh` escreveu — e ele não os valida: quem valida é o `--check`.
  const ancoraDoCaminho = (caminho) => {
    const bruto = ancoras[caminho];
    if (!bruto) {
      return {
        caminho,
        lida: false,
        // A AUSÊNCIA TEM NOME. Uma âncora no caminho e não lida não é «sem âncora»: é «não se
        // abriu o arquivo». Colapsar as duas faria a consulta de proveniência mentir.
        motivo: 'a âncora está no caminho, mas não foi aberta nesta geração',
      };
    }
    return {
      caminho,
      lida: true,
      id: bruto.id || null,
      hash: bruto.hash || null,
      hash_conteudo: bruto.hash_conteudo || null,
      parent_hash: bruto.parentHash || '',
      ancorado_em: bruto.ancorado_em || null,
      algoritmo: bruto.algoritmo || null,
      cobertura: Array.isArray(bruto.cobertura) ? bruto.cobertura.slice().sort(porTexto) : [],
    };
  };

  const ciclos = [];
  for (const ciclo of [...porCiclo.values()]) {
    const docs = ciclo.documentos.sort(porTexto);
    // A âncora do ciclo é a que NÃO tem `-aula-NN`; as de aula são as que têm.
    const doCiclo = docs.filter((c) => tipoDoDocumento(c, ciclo.escola) === 'ancora'
      && !/-aula-[0-9]{2}\.fipp$/.test(c));
    const daAula = docs.filter((c) => tipoDoDocumento(c, ciclo.escola) === 'ancora'
      && /-aula-[0-9]{2}\.fipp$/.test(c));
    const aulas = daAula.map((c) => {
      const m = /-aula-([0-9]{2})\.fipp$/.exec(c);
      return {
        id: ciclo.id + '/aula-' + m[1],
        numero: m[1],
        ancora: ancoraDoCaminho(c),
        documento: docs.find((d) => new RegExp('-aula-' + m[1] + '\\.md$').test(d)) || null,
      };
    });
    ciclos.push({
      id: ciclo.id,
      professor: ciclo.professor,
      numero: ciclo.numero,
      escola: ciclo.escola,
      tipos: [...ciclo.tipos].sort(porTexto),
      documentos: docs,
      pacote: docs.filter((d) => /\.html$/.test(d)).length ? docs.find((d) => /\/index\.html$/.test(d)) || null : null,
      // A âncora do ciclo: a primeira (uma variante, uma âncora). Sem ela, `ancora: null` — e o
      // `sem_ancora: true` é o que a consulta de proveniência lê para declarar a lacuna.
      ancora: doCiclo.length ? ancoraDoCaminho(doCiclo[0]) : null,
      sem_ancora: doCiclo.length === 0,
      aulas: ordenar(aulas, 'numero'),
    });
  }
  ciclos.sort((a, b) => porTexto(a.id, b.id));

  // 4. OS REGISTROS (os envelopes). Só METADADO — e o apelido só quando `comApelido`.
  const registrosPorEscola = {};
  for (const slug of slugs) {
    const lista = Array.isArray(envelopes[slug]) ? envelopes[slug] : [];
    registrosPorEscola[slug] = lista.map(({ nome, resumo }) => {
      const r = resumo || {};
      const item = {
        id: idDeEnvelope(r),
        carimbo: r.id || String(nome || '').replace(/\.json$/, ''),
        tipo: r.fonte || 'documento',
        data: dataDoCarimbo(r.id || nome),
        ano: anoDoCarimbo(r.id || nome),
        professor: r.professor || null,
        ciclo: r.ciclo || null,
        ajuste_de: r.ajuste_de || null,
      };
      // O QUE IDENTIFICA O REGISTRO, e não o que ele RESPONDE. O objetivo do plano e a turma são
      // metadado (aparecem no rótulo da estante); o APELIDO é dado de menor e só entra no índice
      // da própria escola.
      if (r.turma) item.turma = r.turma;
      if (r.objetivo) item.objetivo = r.objetivo;
      if (comApelido && r.aluna) item.aluna = r.aluna;
      return item;
    }).sort((a, b) => porTexto(a.carimbo, b.carimbo));
  }

  // 5. AS FACETAS. Contagem pronta, e a lista de ids para a interseção. As duas saem daqui para
  // que a interface não recalcule nada — e para que dois consumidores não contem diferente.
  const facetas = (lista, chave) => {
    const mapa = new Map();
    for (const item of lista) {
      const valor = item[chave];
      if (valor === null || valor === undefined || valor === '') continue;
      if (!mapa.has(valor)) mapa.set(valor, []);
      mapa.get(valor).push(item.id);
    }
    return [...mapa.entries()]
      .map(([valor, ids]) => ({ valor, rotulo: String(valor), contagem: ids.length, ids: ids.sort(porTexto) }))
      .sort((a, b) => porTexto(a.valor, b.valor));
  };

  // 6. O MESTRE — transversal, sem documentos e SEM apelido.
  const escolas = [];
  const professores = new Map();
  for (const slug of slugs) {
    const inv = inventarios[slug] || null;
    const minhaCiclos = ciclos.filter((c) => c.escola === slug);
    const meusRegistros = registrosPorEscola[slug] || [];
    const expurgada = !caminhos.some((c) => c === 'wrangler.' + slug + '.jsonc');
    const professorDoInventario = (inv && inv.professor && inv.professor.slug) || null;
    const professoresDaEscola = [...new Set(minhaCiclos.map((c) => c.professor)
      .concat(professorDoInventario ? [professorDoInventario] : []))].sort(porTexto);

    const comAncora = minhaCiclos.filter((c) => !c.sem_ancora).length;
    escolas.push({
      id: idDeEscola(slug),
      slug,
      nome: (inv && (inv.escola || (inv.professor && inv.professor.nome))) || slug,
      professor: professorDoInventario,
      professores: professoresDaEscola,
      habilitada: !(inv && inv.estado && inv.estado.habilitada === false),
      expurgada,
      criada_em: (inv && inv.criado_em) || null,
      ciclos: minhaCiclos.map((c) => c.id),
      registros: meusRegistros.map((r) => r.id),
      contagens: {
        ciclos: minhaCiclos.length,
        ciclos_com_ancora: comAncora,
        aulas: minhaCiclos.reduce((s, c) => s + c.aulas.length, 0),
        registros: meusRegistros.length,
        anamneses: meusRegistros.filter((r) => r.tipo === 'anamnese').length,
        planos: meusRegistros.filter((r) => r.tipo === 'plano').length,
        pos: meusRegistros.filter((r) => r.tipo === 'po').length,
      },
    });

    for (const p of professoresDaEscola) {
      const id = idDeProfessor(p);
      if (!professores.has(id)) {
        professores.set(id, {
          id,
          slug: p,
          // O NOME legível não está no diretório (que guarda o slug): está no inventário da
          // escola, e é de lá que ele sai — a mesma fonte da lista de professores da raiz.
          nome: (inv && inv.professor && inv.professor.slug === p && inv.professor.nome) || null,
          escolas: [],
          ciclos: [],
        });
      }
      const reg = professores.get(id);
      if (reg.escolas.indexOf(slug) === -1) reg.escolas.push(slug);
      for (const c of minhaCiclos) if (c.professor === p) reg.ciclos.push(c.id);
    }
  }

  const acervo = {
    versao: VERSAO,
    gerado_em: e.agora || null,
    fonte: { commit: (e.fonte && e.fonte.commit) || null, arvore: (e.fonte && e.fonte.arvore) || null },
    escolas,
    professores: [...professores.values()].map((p) => Object.assign({}, p, {
      escolas: p.escolas.sort(porTexto),
      ciclos: p.ciclos.sort(porTexto),
    })).sort((a, b) => porTexto(a.id, b.id)),
    ciclos: ciclos.map((c) => ({
      id: c.id,
      professor: c.professor,
      numero: c.numero,
      escola: c.escola,
      estado: c.sem_ancora ? 'sem-ancora' : 'ancorado',
      // A AUSÊNCIA TEM NOME TAMBÉM AQUI. O mestre não traz a cobertura nem os caminhos (é a
      // regra de o manter pequeno), mas traz `sem_ancora` e `lida` — sem os dois, `ancora: {}`
      // leria-se como «tem âncora e não se sabe nada dela», que é o contrário do que se passa.
      sem_ancora: c.sem_ancora,
      documentos: c.documentos.length,
      aulas: c.aulas.length,
      ancora: c.ancora ? {
        id: c.ancora.id || null,
        hash: c.ancora.hash || null,
        parent_hash: c.ancora.parent_hash || '',
        lida: c.ancora.lida !== false,
        ...(c.ancora.lida === false ? { motivo: c.ancora.motivo || null } : {}),
      } : null,
    })),
    filtros: {
      escolas: facetas(escolas, 'slug').map(({ valor, contagem }) => ({ valor, rotulo: valor, contagem })),
      professores: [...professores.values()].map((p) => ({
        valor: p.slug, rotulo: p.nome || p.slug, contagem: p.escolas.length,
      })).sort((a, b) => porTexto(a.valor, b.valor)),
      tipos: [...new Set(escolas.flatMap((x) => x.registros.map((r) => String(r).split(':')[0])))]
        .sort(porTexto)
        .map((valor) => ({
          valor,
          rotulo: (TIPOS[valor] && TIPOS[valor].rotulo) || valor,
          contagem: registrosPorEscola
            ? slugs.reduce((s, slug) => s + (registrosPorEscola[slug] || []).filter((r) => r.tipo === valor).length, 0)
            : 0,
        })),
      anos: [...new Set(slugs.flatMap((slug) => (registrosPorEscola[slug] || []).map((r) => r.ano).filter(Boolean)))]
        .sort(porTexto)
        .map((valor) => ({
          valor,
          rotulo: valor,
          contagem: slugs.reduce((s, slug) => s + (registrosPorEscola[slug] || []).filter((r) => r.ano === valor).length, 0),
        })),
      estados: [
        { valor: 'ancorado', rotulo: 'Com âncora', contagem: ciclos.filter((c) => !c.sem_ancora).length },
        { valor: 'sem-ancora', rotulo: 'Sem âncora', contagem: ciclos.filter((c) => c.sem_ancora).length },
      ].filter((x) => x.contagem > 0),
    },
    nao_indexado: NAO_INDEXADO.map((x) => Object.assign({}, x)),
  };

  // 7. O DETALHE POR ESCOLA — o mesmo, com as listas longas e as facetas invertidas.
  const porEscola = {};
  for (const slug of slugs) {
    const mestre = escolas.find((x) => x.slug === slug);
    const meusCiclos = ciclos.filter((c) => c.escola === slug);
    const meusRegistros = registrosPorEscola[slug] || [];
    const todos = meusRegistros.concat(meusCiclos.map((c) => ({
      id: c.id,
      tipo: 'ciclo',
      carimbo: c.id,
      ano: null,
      professor: c.professor,
    })));
    porEscola[slug] = {
      versao: VERSAO,
      gerado_em: acervo.gerado_em,
      fonte: acervo.fonte,
      escola: mestre,
      registros: meusRegistros,
      ciclos: meusCiclos,
      filtros: {
        tipos: facetas(todos, 'tipo').map((f) => Object.assign({}, f, {
          rotulo: (TIPOS[f.valor] && TIPOS[f.valor].rotulo) || f.valor,
        })),
        professores: facetas(todos.filter((x) => x.professor), 'professor'),
        anos: facetas(meusRegistros.filter((r) => r.ano), 'ano'),
       // O ESTADO VEM DO QUE EXISTE, não de uma lista fixa: uma faceta com zero valores é uma
        // promessa que a interface não pode cumprir.
        estados: [
          { valor: 'ancorado', rotulo: 'Com âncora', contagem: meusCiclos.filter((c) => !c.sem_ancora).length,
            ids: meusCiclos.filter((c) => !c.sem_ancora).map((c) => c.id) },
          { valor: 'sem-ancora', rotulo: 'Sem âncora', contagem: meusCiclos.filter((c) => c.sem_ancora).length,
            ids: meusCiclos.filter((c) => c.sem_ancora).map((c) => c.id) },
        ].filter((x) => x.contagem > 0),
      },
      nao_indexado: NAO_INDEXADO.map((x) => Object.assign({}, x)),
    };
  }

  return { acervo, escolas: porEscola };
}

// ------------------------------------------------------------------ as consultas

/**
 * FILTRAR sobre o índice — interseção de listas, nunca varredura de documentos.
 *
 * Os filtros aceitos são os de §7.1, e cada um é uma faceta já calculada. Um valor que não
 * existe devolve a lista vazia com `filtro: true` — e a resposta DIZ isso, em vez de deixar o
 * leitor supor que o acervo não tem nada.
 */
function filtrar(escola, filtros) {
  const f = filtros || {};
  let ids = null;
  const aplicados = {};
  const facetaDe = (nome) => (escola.filtros && escola.filtros[nome]) || [];
  const cruzar = (lista) => {
    if (ids === null) { ids = lista.slice(); return; }
    const conjunto = new Set(lista);
    ids = ids.filter((id) => conjunto.has(id));
  };

  for (const [nome, valor] of Object.entries(f)) {
    if (valor === null || valor === undefined || valor === '') continue;
    const faceta = facetaDe(nome);
    if (!faceta.length) continue;   // faceta que esta escola não tem: o filtro não a alcança
    const achado = faceta.find((x) => String(x.valor) === String(valor));
    cruzar(achado ? achado.ids || [] : []);
    aplicados[nome] = String(valor);
  }

  if (ids === null) {
    ids = escola.registros.map((r) => r.id).concat(escola.ciclos.map((c) => c.id));
  }
  const conjunto = new Set(ids);
  return {
    ids: ids.sort(porTexto),
    registros: escola.registros.filter((r) => conjunto.has(r.id)),
    ciclos: escola.ciclos.filter((c) => conjunto.has(c.id)),
    filtros: aplicados,
  };
}

/**
 * AS PERGUNTAS QUE O ÍNDICE RESPONDE HOJE — e só essas.
 *
 * Cada uma devolve **medida + caminho + elo**, que é a forma da resposta de proveniência
 * (§1 do PLANO-PERGUNTAS): um número, onde está o original, e o hash que prova que é o mesmo
 * documento. Uma pergunta sem esses três é uma listagem, e a resposta diz qual é o caso.
 *
 * Perguntas com nome (as que têm dados hoje):
 *   GE01  contagens por escola
 *   CT01  ciclos da escola, com âncora e nº de aulas
 *   PV01  as âncoras e a sua cadeia (quem é pai de quem)
 *   AL01  registros por aluna (só no índice da escola, onde o apelido existe)
 *   TR01  turmas que já têm plano
 *   OB01  as colunas do PO não são indexadas — a resposta RECUSA com o motivo
 */
function responder(escola, pergunta, argumento) {
  const p = String(pergunta || '').toUpperCase();
  const arg = argumento === undefined ? null : argumento;

  // O MESTRE NÃO É UMA ESCOLA. Ele tem as listas de IDs, não os registos — e uma pergunta que
  // precisa de linha (a aluna, a turma) não se responde com um mestre. Recusar com o motivo é
  // melhor que estourar: quem chamou fica a saber que a pergunta é do índice da escola.
  if (!Array.isArray(escola && escola.registros) || !Array.isArray(escola && escola.ciclos)) {
    return {
      pergunta: p || null,
      recusa: 'esta pergunta é do índice de UMA escola — o índice do acervo só traz contagens '
        + 'e caminhos. Peça-a ao Worker da escola (GET /api/indice/<pergunta>).',
      medida: null,
      caminho: null,
      elo: null,
    };
  }

  if (p === 'GE01') {
    return {
      pergunta: 'GE01',
      medida: escola.escola.contagens,
      caminho: 'GET /api/indice',
      elo: escola.ciclos.map((c) => c.ancora && c.ancora.hash).filter(Boolean),
    };
  }

  if (p === 'CT01') {
    return {
      pergunta: 'CT01',
      medida: escola.ciclos.map((c) => ({
        ciclo: c.id,
        aulas: c.aulas.length,
        estado: c.sem_ancora ? 'sem-ancora' : 'ancorado',
      })),
      caminho: escola.ciclos.map((c) => c.pacote).filter(Boolean),
      elo: escola.ciclos.map((c) => (c.ancora ? c.ancora.hash : null)),
    };
  }

  if (p === 'PV01') {
    return {
      pergunta: 'PV01',
      medida: escola.ciclos.map((c) => ({
        ciclo: c.id,
        ancora: c.ancora ? c.ancora.id : null,
        hash: c.ancora ? c.ancora.hash : null,
        parent: c.ancora ? c.ancora.parent_hash : null,
        cobertura: c.ancora ? c.ancora.cobertura.length : 0,
        lida: c.ancora ? c.ancora.lida !== false : false,
      })).concat(escola.ciclos.flatMap((c) => c.aulas.map((a) => ({
        ciclo: c.id,
        aula: a.numero,
        ancora: a.ancora ? a.ancora.id : null,
        hash: a.ancora ? a.ancora.hash : null,
        parent: a.ancora ? a.ancora.parent_hash : null,
        cobertura: a.ancora ? a.ancora.cobertura.length : 0,
        lida: a.ancora ? a.ancora.lida !== false : false,
      })))),
      caminho: escola.ciclos.map((c) => (c.ancora ? c.ancora.caminho : null)).filter(Boolean),
      elo: escola.ciclos.map((c) => (c.ancora ? c.ancora.hash : null)).filter(Boolean),
    };
  }

  if (p === 'AL01') {
    const alvo = arg ? String(arg) : null;
    const minhas = escola.registros.filter((r) => r.tipo === 'anamnese' && (!alvo || r.aluna === alvo));
    // O APELIDO NÃO EXISTE EM TODO O LADO. No índice da ESCOLA ele está lá (é o mesmo dado que a
    // estante dela mostra, atrás da mesma senha); no do ACERVO, não. E o que se diz é diferente:
    // «não há anamnese» é um facto, «o apelido não está aqui» é uma fronteira. Confundir as duas
    // faria a escola ler uma recusa de arquitectura como se não tivesse alunas.
    const semApelido = escola.registros.some((r) => r.tipo === 'anamnese' && r.aluna === undefined);
    if (semApelido) {
      return {
        pergunta: 'AL01',
        recusa: 'o apelido não entra no índice do acervo; esta pergunta é do índice da escola (autenticado)',
        medida: null,
        caminho: null,
        elo: null,
      };
    }
    return {
      pergunta: 'AL01',
      medida: minhas.map((r) => ({ aluna: r.aluna, carimbo: r.carimbo, data: r.data })),
      caminho: minhas.map((r) => 'envelope/' + r.carimbo),
      elo: null,
      ...(minhas.length ? {} : {
        nota: alvo
          ? 'não há anamnese registada para «' + alvo + '» neste acervo'
          : 'não há anamnese registada nesta escola',
      }),
    };
  }

  if (p === 'TR01') {
    return {
      pergunta: 'TR01',
      medida: escola.registros.filter((r) => r.tipo === 'plano' && r.turma).map((r) => ({
        turma: r.turma, plano: r.carimbo, objetivo: r.objetivo || null,
      })),
      caminho: escola.registros.filter((r) => r.tipo === 'plano').map((r) => 'envelope/' + r.carimbo),
      elo: null,
    };
  }

  if (p === 'OB01') {
    const declarado = (escola.nao_indexado || []).find((x) => x.familia === 'marcas');
    return {
      pergunta: 'OB01',
      recusa: declarado ? declarado.motivo : 'as marcas não são indexadas',
      medida: null,
      caminho: null,
      elo: null,
    };
  }

  return {
    pergunta: p || null,
    recusa: 'esta pergunta ainda não é respondida pelo índice — o catálogo está em '
      + 'PLANO-PERGUNTAS-DA-PROVENIENCIA.md e a implementação é a camada L6',
    medida: null,
    caminho: null,
    elo: null,
  };
}

module.exports = {
  VERSAO,
  TIPOS,
  NAO_INDEXADO,
  idDeEscola,
  idDeProfessor,
  idDeCiclo,
  idDeEnvelope,
  anoDoCarimbo,
  dataDoCarimbo,
  cicloDoCaminho,
  escolaDoSufixo,
  tipoDoDocumento,
  construir,
  canonico,
  semVolateis,
  iguais,
  filtrar,
  responder,
};
