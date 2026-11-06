#!/usr/bin/env node
'use strict';

/*
 * gerar-relacoes.js — o MAPA DE RELAÇÕES MATERIALIZADO, por ciclo.
 *
 * PORQUE EXISTE. O `indices/esquema/relacoes.json` DECLARA que relações existem (entidade →
 * entidade, chave, cardinalidade). Este gerador escreve as relações que **de facto existem** num
 * ciclo concreto: os nós e as arestas, com os identificadores reais. Um é o contrato, o outro é o
 * mapa. Sem o segundo, a pergunta «por que caminho se chega do recorte do passo 4 à marca da aula
 * 07?» não tem onde ser respondida — e é exactamente a pergunta que a pesquisadora fez quando
 * propôs grafos (06/11/2026).
 *
 * O QUE ELE **NÃO** É. Não é um banco de grafo, não é um motor de travessia, e não substitui
 * índice nenhum: é JSON derivado, versionado, com o mesmo regime dos índices (`--check`,
 * determinismo, nunca fonte). A decisão está na §7.4 do ARQUITETURA-GERAL.md.
 *
 * A REGRA QUE GOVERNA TUDO, e é a mesma dos índices: **só chave, tipo, data e vínculo.** Nenhum
 * conteúdo pedagógico entra aqui. Isto é verificável neste ciclo por um motivo forte — as respostas
 * das anamneses vão CIFRADAS —, mas a regra não depende disso: os rótulos que saem vêm do
 * `contexto` (o nome da aluna, o nome do campo), nunca de uma resposta.
 *
 * AS ARESTAS SÃO DERIVADAS, NUNCA ESCRITAS À MÃO. Uma aresta errada é pior do que uma aresta
 * ausente: a ausente faz falhar a travessia, a errada leva a outro sítio e mente. Por isso cada
 * aresta sai de um campo que já existe no disco, e o `--check` compara o mapa com a árvore.
 *
 * A PONTE ENTRE OS DOIS VOCABULÁRIOS, e é o achado que justifica o mapa. O mesmo aspecto tem dois
 * identificadores: o **campo** (`cinco-posicoes-1a-bracos`), que é o id do universo da anamnese, e
 * o **aspecto** (`1_posicao_bracos`), que é a chave calculada pelo lançamento (`chaveDoItem`). A
 * aresta `mesmo_aspecto` liga-os, e liga-os **pelo nome** — porque é o nome que os dois lados
 * partilham. É a costura mais frágil do encadeamento, e o mapa existe para que ela seja visível em
 * vez de latente: se um nome mudar de um lado, a aresta desaparece, e o `--check`/a prova vêem.
 *
 *   node tools/gerar-relacoes.js                       todos os ciclos com pacote
 *   node tools/gerar-relacoes.js rabo-gramde 01 calango-bale-nivel-1-teste-1
 *   node tools/gerar-relacoes.js --check               não escreve; falha se divergir
 *   node tools/gerar-relacoes.js --json                resumo legível por máquina
 *
 * MOTIVO DECLARADO (CONGELAMENTO.md). `tools/` é congelado. Este ficheiro é NOVO e nenhum script
 * existente o chama: o gerador de índices, os validadores, a âncora, as regras e as pétreas ficam
 * exactamente como estavam. A integração (chamá-lo no `regerar-indices.yml` e no `gerar-ciclo.yml`)
 * é um passo separado, com commit próprio.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { chaveDoItem } = require('./lib-vistas.js').helpers;
const indices = require('../motor/nucleo/indices.js');

const RAIZ = path.resolve(__dirname, '..');
const DIR = path.join(RAIZ, 'indices', 'relacoes');

const lerTexto = (abs) => { try { return fs.readFileSync(abs, 'utf8'); } catch { return null; } };
const lerJson = (abs) => { const t = lerTexto(abs); if (t === null) return null; try { return JSON.parse(t); } catch { return null; } };
const existe = (abs) => fs.existsSync(abs);

/** O slug de um nome, para um id de nó: minúsculas, sem acento, `-` entre palavras. */
const slug = (texto) => String(texto == null ? '' : texto)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Os ciclos que têm pacote no disco — descobertos, nunca nomeados à mão. */
function ciclosNoDisco() {
  const saida = [];
  const pastasDosProfessores = path.join(RAIZ, 'professores');
  if (!existe(pastasDosProfessores)) return saida;
  for (const prof of fs.readdirSync(pastasDosProfessores)) {
    const ciclos = path.join(pastasDosProfessores, prof, 'ciclos');
    if (!existe(ciclos) || !fs.statSync(ciclos).isDirectory()) continue;
    for (const nome of fs.readdirSync(ciclos)) {
      // O pacote é `<ciclo>-<NN>-<variante>/`; o `-aula-NN.fipp` e o `.md` são irmãos dele.
      const m = /^ciclo-(\d{2})-([a-z0-9-]+)$/.exec(nome);
      if (!m) continue;
      const pasta = path.join(ciclos, nome);
      if (!fs.statSync(pasta).isDirectory()) continue;
      saida.push({ professor: prof, ciclo: m[1], variante: m[2], pasta });
    }
  }
  return saida.sort((a, b) => (a.professor + a.ciclo + a.variante).localeCompare(b.professor + b.ciclo + b.variante));
}

/** O `.conf` que nomeia a escola e a turma desta variante (a variante vence a base). */
/** As declarações de um `.conf` — recebe o NOME do ficheiro, e não o ciclo: a variante manda. */
function lerConf(ciclosDir, arquivo) {
  const t = lerTexto(path.join(ciclosDir, arquivo));
  if (!t) return {};
  const out = {};
  for (const l of t.split('\n')) {
    const m = /^([A-Z_]+)="?([^"]*)"?\s*$/.exec(l.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

/**
 * O MAPA DE UM CICLO.
 *
 * Cada aresta sai de um campo que já existe. O `chave` de uma aresta diz **qual campo a produziu**,
 * e é isso que permite a quem lê o mapa ir verificar a origem em vez de acreditar nele.
 */
function mapaDoCiclo({ professor, ciclo, variante, pasta }) {
  const ciclosDir = path.dirname(pasta);
  // A leitura continua a ser base → variante (a variante vence), como no `lib-fontes.sh`.
  const base = lerConf(ciclosDir, `ciclo-${ciclo}.conf`);
  const conf = lerConf(ciclosDir, `ciclo-${ciclo}-${variante}.conf`);
  const escolaNome = conf.ESCOLA || base.ESCOLA || '';
  const escolaSlug = slug(escolaNome);
  const idDoCiclo = `${professor}/${ciclo}/${variante}`;

  const nos = new Map();
  const arestas = [];
  const lacunas = [];

  const no = (id, tipo, rotulo, extra) => {
    if (!nos.has(id)) nos.set(id, Object.assign({ id, tipo, rotulo: rotulo || '' }, extra || {}));
    return id;
  };
  const aresta = (de, para, tipo, chave) => {
    if (!de || !para || de === para) return;
    arestas.push({ de, para, tipo, chave: chave || '' });
  };

  /* ------------------------------------------------------------------ o plano de ensino (o PE)
   * É dele que vêm a turma e os marcos. Sem ele não há ciclo no sentido pedagógico — só um
   * esqueleto —, e a lacuna fica declarada em vez de o mapa inventar uma turma. */
  const planoJson = lerJson(path.join(pasta, `plano-${ciclo}.json`));
  const poJson = lerJson(path.join(pasta, `po-${ciclo}.json`));
  const indiceJson = lerJson(path.join(pasta, 'ciclos.json'));

  /* A TURMA TEM DUAS FORMAS NO DISCO, e as duas são legítimas: o `plano-XX.json` do PACOTE é o
   * DERIVADO (`contexto.turmaObservada`), e o envelope cru do plano traz a resposta
   * `contexto-turma`. Ler uma só foi o que fez o primeiro mapa sair sem turma nenhuma — o mesmo
   * erro de assumir a forma que já custou caro noutros sítios. As duas são tentadas, e a lacuna só
   * é declarada quando NENHUMA responde. */
  const daResposta = (planoJson && planoJson.respostas && planoJson.respostas['contexto-turma']);
  const nomeDaTurma = String(
    (planoJson && planoJson.contexto && planoJson.contexto.turmaObservada)
    || (daResposta && (daResposta.valor !== undefined ? daResposta.valor : daResposta))
    || conf.TURMA || '').trim();
  if (!nomeDaTurma) {
    lacunas.push('a turma: o plano de ensino não declara `contexto-turma` — sem ela, as arestas do'
      + ' elenco e do recorte não têm origem');
  }

  // ---- os nós de cima
  no(`professor:${professor}`, 'professor', conf.PROFESSOR || professor);
  if (escolaSlug) no(`escola:${escolaSlug}`, 'escola', escolaNome);
  no(`ciclo:${idDoCiclo}`, 'ciclo', conf.NOME || `Ciclo ${ciclo}`);
  aresta(`ciclo:${idDoCiclo}`, `professor:${professor}`, 'dado_por', 'ciclo.professor');
  if (escolaSlug) aresta(`ciclo:${idDoCiclo}`, `escola:${escolaSlug}`, 'acontece_em', 'escola');

  const idDaTurma = nomeDaTurma ? `turma:${slug(escolaSlug)}/${slug(nomeDaTurma)}` : null;
  if (idDaTurma) {
    no(idDaTurma, 'turma', nomeDaTurma);
    aresta(idDaTurma, `ciclo:${idDoCiclo}`, 'cursa', 'plano.contexto-turma');
  }

  /* ------------------------------------------------------- a linha de base da turma (o passo 2-4)
   * Ela vive em `escola/<slug>/linhas-de-base/`, uma por acto de gravação, e o VIGENTE é o carimbo
   * mais recente da turma — a mesma regra do Worker (`linhaDeBaseDaTurma`). Lida do disco. */
  const pastaBase = path.join(RAIZ, 'escola', escolaSlug, 'linhas-de-base');
  let vigente = null;
  if (existe(pastaBase)) {
    const candidatas = [];
    for (const nome of fs.readdirSync(pastaBase)) {
      if (!nome.endsWith('.json') || nome.startsWith('.')) continue;
      const d = lerJson(path.join(pastaBase, nome));
      if (!d) continue;
      /* SEM TURMA NÃO SE ESCOLHE LINHA DE BASE. A regra é a do `linhaDeBaseDaTurma(linhas, nome)`:
       * casa-se PELO NOME. Sem nome, pegar «a mais recente da escola» seria adivinhar de que turma
       * é — e um mapa que adivinha mente com aparência de dado. */
      if (!nomeDaTurma || String(d.turma || '').trim() !== nomeDaTurma) continue;
      candidatas.push(d);
    }
    candidatas.sort((a, b) => String(b.carimbo || '').localeCompare(String(a.carimbo || '')));
    vigente = candidatas[0] || null;
  }
  if (!vigente) {
    lacunas.push('a linha de base da turma: não há acto gravado em `escola/'
      + escolaSlug + '/linhas-de-base/` para «' + (nomeDaTurma || '?') + '» — sem ele, o recorte'
      + ' e as leituras das anamneses não têm origem');
  }

  const idDaBase = vigente ? `linha-de-base:${slug(vigente.id)}/${vigente.carimbo}` : null;
  if (idDaBase) {
    no(idDaBase, 'linha-de-base', vigente.nome || vigente.id);
    if (idDaTurma) aresta(idDaBase, idDaTurma, 'descreve', 'linha-de-base.turma');

    /* ---- AS ANAMNESES LIDAS: `lida` mapeia aluna → carimbo do envelope
     *
     * E O ELENCO **NÃO** ENTRA NO MAPA (05/11/2026). Isto foi a verificação 7 do
     * `check-indices.js` a morder, e ela tem razão: `indices/` é servido pelo Worker, e a regra
     * da casa é que nenhum índice do acervo nomeia aluna — nem pelo apelido. A primeira versão
     * deste gerador criava nós `aluna` com o nome no rótulo e reprovou («campo proibido
     * «aluna»»). A correcção não foi esconder o campo: foi perceber que o elenco **não é uma
     * relação**, é conteúdo da linha de base — e que a pessoa entra na cadeia pela ANAMNESE,
     * cujo carimbo (`anamnese-20261105-2301`) já é livre de nome.
     *
     * A pessoa é a PORTA, não um nó do meio: ela escolhe a aluna pelo nome no ecrã, e o ecrã
     * resolve o nome para o carimbo da anamnese. Daí para dentro, o mapa anda sem nomes — e por
     * isso pode ser publicado sem expor o elenco. */
    for (const [, carimbo] of Object.entries(vigente.lida || {})) {
      const idDaAnamnese = `anamnese:${carimbo}`;
      no(idDaAnamnese, 'anamnese', carimbo);
      aresta(idDaBase, idDaAnamnese, 'le', 'linha-de-base.lida[]');
    }

    // ---- o RECORTE do passo 4: os campos que a turma escolheu olhar
    for (const campo of (vigente.campos || [])) {
      const idDoCampo = `campo:${campo.id}`;
      no(idDoCampo, 'campo', campo.nome || campo.id, { grupo: campo.grupo || '' });
      aresta(idDaBase, idDoCampo, 'recorta', 'linha-de-base.campos[]');
    }
  }

  /* ------------------------------------------------------------------ os ASPECTOS do PO
   * O vocabulário do lançamento: cada item de «Itens de cada dimensão», com a chave que o
   * formulário grava (`chaveDoItem`). Derivado do PO, e não do lançamento — assim o mapa existe
   * ANTES de a primeira aula ser lançada, que é o ponto de o fazer agora. */
  const aspectosDoPo = [];
  if (poJson && Array.isArray(poJson.itensPorDimensao)) {
    for (const d of poJson.itensPorDimensao) {
      for (const bruto of String(d.itens || '').split(';')) {
        const item = bruto.trim();
        if (!item) continue;
        // «sem restrições declaradas» é declaração de AUSÊNCIA, e não aspecto observável — a
        // mesma exclusão que o formulário faz, pela mesma razão.
        if (/^sem\s+(restri|nenhum|altera)/i.test(item)) continue;
        const chave = chaveDoItem(item);
        if (aspectosDoPo.some((x) => x.chave === chave)) continue;
        aspectosDoPo.push({ chave, item, eixo: d.eixo || '' });
      }
    }
  } else {
    lacunas.push('os aspectos: o PO não está no pacote (`po-' + ciclo + '.json`) — sem ele não há'
      + ' vocabulário de observação para ligar ao recorte');
  }
  for (const a of aspectosDoPo) {
    no(`aspecto:${a.chave}`, 'aspecto', a.item, { eixo: a.eixo });
  }

  /* ------------------------------------------------- A PONTE ENTRE OS DOIS VOCABULÁRIOS
   * `campo` (o id do universo da anamnese) e `aspecto` (a chave do lançamento) são o MESMO aspecto.
   * Liga-os o NOME — é o que os dois lados partilham. A aresta é marcada com `por: nome` para que
   * ninguém a leia como uma igualdade de identificadores: ela é uma correspondência, e é a costura
   * mais frágil do encadeamento. */
  const ponte = [];
  const camposDoRecorte = (vigente && vigente.campos) || [];
  for (const campo of camposDoRecorte) {
    const chave = chaveDoItem(campo.nome || '');
    const aspecto = aspectosDoPo.find((a) => a.chave === chave);
    if (aspecto) {
      aresta(`campo:${campo.id}`, `aspecto:${chave}`, 'mesmo_aspecto', 'nome');
      ponte.push({ campo: campo.id, aspecto: chave, nome: campo.nome });
    } else {
      // O recorte escolheu um aspecto que o PO não declara: o mapa DIZ, em vez de inventar a aresta.
      lacunas.push(`o aspecto «${campo.nome}» está no recorte mas não no PO — sem correspondência`
        + ' pelo nome, a marca dessa aluna não encadeia');
    }
  }

  /* ---------------------------------------------------------------------------- os DOCUMENTOS
   * Os do `DOCS` do `.conf` (que é a ordem do pacote), mais o PO e o plano, que são entradas. */
  const docs = String(conf.DOCS || base.DOCS || '').split(/\s+/).filter(Boolean);
  for (const tipo of ['plano', 'po', ...docs]) {
    const idDoc = `documento:${idDoCiclo}/${tipo}`;
    no(idDoc, 'documento', tipo, { tipoDocumento: tipo });
    aresta(idDoc, `ciclo:${idDoCiclo}`, 'pertence_a', 'documento.ciclo_id');
  }

  // ---- as ÂNCORAS: uma do ciclo, e uma por aula
  const ancoraDoCiclo = `ciclo-${ciclo}-${variante}.fipp`;
  const idAncora = `ancora:${idDoCiclo}`;
  if (existe(path.join(ciclosDir, ancoraDoCiclo))) {
    no(idAncora, 'ancora', ancoraDoCiclo);
    aresta(idAncora, `ciclo:${idDoCiclo}`, 'ancora', 'ancora.ciclo_id');
    // Cada documento DERIVADO é ancorado pela âncora do ciclo (o `.fipp` cobre o `DOCS`).
    for (const tipo of docs) aresta(`documento:${idDoCiclo}/${tipo}`, idAncora, 'ancorado_por', 'documento.ancora_id');
  } else {
    lacunas.push('a âncora do ciclo: `' + ancoraDoCiclo + '` não está no disco — sem ela não há'
      + ' cadeia de custódia a ligar aos documentos');
  }

  /* ------------------------------------------------------------------------------- as AULAS
   * O índice do ciclo declara cada aula (número, data, marco, config). É a fonte — não se conta
   * até `total_aulas`. */
  const aulas = (indiceJson && Array.isArray(indiceJson.ciclos)
    ? (indiceJson.ciclos.find((c) => String(c.id) === String(ciclo)) || {}).aulas : null) || [];
  const marcosDoPlano = (planoJson && planoJson.marcosPorAula) || [];
  for (const a of aulas) {
    const nn = String(a.n);
    const idAula = `aula:${idDoCiclo}/${nn}`;
    no(idAula, 'aula', `Aula ${nn}`, { data: a.data || '', estado: a.estado || '' });
    aresta(idAula, `ciclo:${idDoCiclo}`, 'pertence_a', 'aula.ciclo_id');

    const ancoraDaAula = `ciclo-${ciclo}-${variante}-aula-${nn}.fipp`;
    if (existe(path.join(ciclosDir, ancoraDaAula))) {
      const idAncoraAula = `ancora:${idDoCiclo}/aula-${nn}`;
      no(idAncoraAula, 'ancora', ancoraDaAula);
      aresta(idAncoraAula, idAula, 'ancora', 'ancora.aula_id');
      aresta(idAula, idAncoraAula, 'ancorada_por', 'aula.ancora_id');
    }

    // O MARCO: o que a aula existe para deixar pronto, declarado pelo plano do ciclo.
    const marco = marcosDoPlano.find((x) => String(x.n) === nn);
    if (marco) {
      const idMarco = `marco:${idDoCiclo}/${nn}`;
      no(idMarco, 'marco', String(marco.marco || '').slice(0, 80));
      aresta(idAula, idMarco, 'persegue', 'aula.marco');
      aresta(idMarco, `documento:${idDoCiclo}/plano`, 'esta_em', 'plano.marcosPorAula[]');
    }

    // O CONFIG DA AULA: o que ela observa, declarado por `captura-aula-NN.json`.
    if (a.config) {
      const idCfg = `captura:${idDoCiclo}/${nn}`;
      no(idCfg, 'captura', a.config, { tipoDocumento: 'captura' });
      aresta(idCfg, idAula, 'declara_o_que_se_observa', 'indice.aulas[].config');
    }
  }

  /* A MARCA LIGA-SE À ANAMNESE, NÃO A UM NOME. O lançamento grava a marca sob o nome da aluna
   * (é o que a folha de presença mostra); o mapa traduz esse nome para o carimbo da anamnese que a
   * linha de base leu. Se a base não leu anamnese dessa pessoa, a marca não tem onde encadear — e
   * isso é uma lacuna DECLARADA, não uma aresta inventada. */
  const carimboDaPessoa = (nome) => {
    const c = vigente && vigente.lida ? vigente.lida[nome] : undefined;
    if (!c) {
      const chave = 'a marca de «' + nome + '» não encadeia';
      if (!lacunas.includes(chave)) {
        lacunas.push('a marca de «' + nome + '»: a linha de base não leu anamnese desta pessoa —'
          + ' a marca fica ligada só à aula, e o caminho até o recorte fica partido nesse ponto');
      }
      return '';
    }
    return String(c);
  };
  const ligarMarca = (idMarca, carimbo) => {
    if (!carimbo || !nos.has(`anamnese:${carimbo}`)) return;
    aresta(idMarca, `anamnese:${carimbo}`, 'observada_em', 'linha-de-base.lida[]');
  };

  /* ------------------------------------------------------------- as MARCAS LANÇADAS (se houver)
   * Sem lançamento, não há aresta — e não se inventa uma. É a parte do mapa que cresce com o uso:
   * cada marca é um nó, e é ela que responde «em quantas aulas». */
  const dados = lerJson(path.join(ciclosDir, `${variante}-dados.json`));
  let marcas = 0;
  if (dados && dados.aulas) {
    for (const [nn, aula] of Object.entries(dados.aulas)) {
      const idAula = `aula:${idDoCiclo}/${nn}`;
      for (const [bloco, valor] of Object.entries(aula)) {
        if (!valor || typeof valor !== 'object' || Array.isArray(valor)) continue;
        if (['condicoes_contorno', 'relatorio'].includes(bloco)) continue;
        for (const [aluna, daPessoa] of Object.entries(valor)) {
          // Bloco de itens: `[{chave, item, marca}]` — a linha de base revisitada.
          if (Array.isArray(daPessoa)) {
            for (const x of daPessoa) {
              if (!x || typeof x.marca !== 'string' || x.marca === '') continue;
              const chave = x.chave || chaveDoItem(x.item);
              const idMarca = `marca:${idDoCiclo}/${nn}/${carimboDaPessoa(aluna)}/${chave}`;
              no(idMarca, 'marca', x.marca, { aula: nn, aspecto: chave, marca: x.marca });
              aresta(idMarca, idAula, 'aconteceu_em', 'dados.aulas[].observado');
              ligarMarca(idMarca, carimboDaPessoa(aluna), nn, chave);
              if (nos.has(`aspecto:${chave}`)) aresta(idMarca, `aspecto:${chave}`, 'observa', 'item.chave');
              marcas += 1;
            }
            continue;
          }
          if (!daPessoa || typeof daPessoa !== 'object') continue;
          for (const [coluna, v] of Object.entries(daPessoa)) {
            if (typeof v !== 'string' || v === '') continue;
            const idMarca = `marca:${idDoCiclo}/${nn}/${carimboDaPessoa(aluna)}/${bloco}.${coluna}`;
            no(idMarca, 'marca', v, { aula: nn, aspecto: `${bloco}.${coluna}`, marca: v });
            aresta(idMarca, idAula, 'aconteceu_em', 'dados.aulas[]');
            ligarMarca(idMarca, carimboDaPessoa(aluna), nn, `${bloco}.${coluna}`);
            marcas += 1;
          }
        }
      }
    }
  }

  /* --------------------------------------------------------------------------------- a SAÍDA
   * Ordenada por id, e as arestas por (de, tipo, para): duas corridas dão o mesmo texto. */
  const listaNos = [...nos.values()].sort((a, b) => a.id.localeCompare(b.id));
  const listaArestas = arestas
    .filter((x, i, t) => t.findIndex((y) => y.de === x.de && y.para === x.para && y.tipo === x.tipo) === i)
    .sort((a, b) => (a.de + '|' + a.tipo + '|' + a.para).localeCompare(b.de + '|' + b.tipo + '|' + b.para));

  return {
    versao: 1,
    escopo: 'ciclo',
    ciclo: idDoCiclo,
    escola: escolaSlug,
    turma: nomeDaTurma || null,
    _nota: 'MAPA DE RELAÇÕES materializado (ARQUITETURA-GERAL.md §7.4). Derivado, nunca fonte. Cada'
      + ' aresta nomeia em `chave` o campo que a produziu. Guarda chave, tipo, data e vínculo —'
      + ' nunca conteúdo: os rótulos vêm do contexto, e nas anamneses as respostas vão cifradas.',
    _ponte: {
      _nota: 'Os dois vocabulários do mesmo aspecto. `campo` é o id do universo da anamnese;'
        + ' `aspecto` é a chave calculada pelo lançamento (Vistas.helpers.chaveDoItem). Ligam-se'
        + ' PELO NOME — é a correspondência, não uma igualdade de identificadores, e é a costura'
        + ' mais frágil do encadeamento.',
      pares: ponte.sort((a, b) => a.campo.localeCompare(b.campo)),
      semCorrespondencia: camposDoRecorte
        .filter((c) => !ponte.some((p) => p.campo === c.id))
        .map((c) => ({ campo: c.id, nome: c.nome || '' }))
        .sort((a, b) => a.campo.localeCompare(b.campo)),
    },
    contagens: {
      nos: listaNos.length, arestas: listaArestas.length, marcas,
      porTipo: listaNos.reduce((acc, n) => { acc[n.tipo] = (acc[n.tipo] || 0) + 1; return acc; }, {}),
    },
    nos: listaNos,
    arestas: listaArestas,
    lacunas: lacunas.slice().sort(),
  };
}

/** O caminho relativo onde o mapa de um ciclo é escrito. */
const caminhoDoMapa = ({ professor, ciclo, variante }) =>
  path.join('indices', 'relacoes', professor, `${ciclo}-${variante}.json`);

function serializar(objeto) {
  // O `canonico` do motor garante a ordem das chaves — a mesma função dos índices do acervo.
  return JSON.stringify(JSON.parse(indices.canonico(objeto)), null, 2) + '\n';
}

/* A MESMA FORMA DO GERADOR IRMÃO: `{ arquivos }`. Não é cosmética — o `check-indices.js` corre os
 * dois geradores no mesmo laço, e um devolver um `Map` e o outro `{ arquivos }` faria o laço ter de
 * saber qual é qual. */
function gerarEmMemoria() {
  const arquivos = new Map();
  for (const c of ciclosNoDisco()) {
    arquivos.set(caminhoDoMapa(c), serializar(mapaDoCiclo(c)));
  }
  return { arquivos };
}

function main(argv) {
  const conferir = argv.includes('--check');
  const json = argv.includes('--json');
  const posicionais = argv.filter((a) => !a.startsWith('--'));
  const [prof, ciclo, variante] = posicionais;

  let alvos = ciclosNoDisco();
  if (prof) alvos = alvos.filter((c) => c.professor === prof);
  if (ciclo) alvos = alvos.filter((c) => c.ciclo === String(ciclo).padStart(2, '0'));
  if (variante) alvos = alvos.filter((c) => c.variante === variante);

  if (!alvos.length) {
    console.error('gerar-relacoes: nenhum ciclo com pacote' + (prof ? ` em ${prof}/${ciclo}/${variante}` : '')
      + ' — nada a fazer.');
    return 1;
  }

  const escritos = [];
  const divergentes = [];
  for (const c of alvos) {
    const rel = caminhoDoMapa(c);
    const texto = serializar(mapaDoCiclo(c));
    const abs = path.join(RAIZ, rel);
    if (conferir) {
      const atual = lerTexto(abs);
      if (atual === null) divergentes.push({ arquivo: rel, motivo: 'ausente' });
      else {
        let igual = false;
        try { igual = indices.iguais(JSON.parse(atual), JSON.parse(texto)); } catch { igual = false; }
        if (!igual) divergentes.push({ arquivo: rel, motivo: 'diverge' });
      }
      continue;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, texto);
    escritos.push(rel);
  }

  if (json) {
    process.stdout.write(JSON.stringify({ escritos, divergentes }, null, 2) + '\n');
  } else if (conferir) {
    if (divergentes.length) {
      for (const d of divergentes) console.error(`  ${d.motivo}: ${d.arquivo}`);
      console.error(`gerar-relacoes: ${divergentes.length} mapa(s) fora do estado —`
        + ' rode `node tools/gerar-relacoes.js`');
      return 1;
    }
    console.log(`gerar-relacoes: ${alvos.length} mapa(s) em dia.`);
  } else {
    for (const e of escritos) console.log(`  ${e}`);
    console.log(`gerar-relacoes: ${escritos.length} mapa(s) escrito(s).`);
  }
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { mapaDoCiclo, ciclosNoDisco, caminhoDoMapa, gerarEmMemoria, slug };
