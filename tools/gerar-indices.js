#!/usr/bin/env node
'use strict';

/*
 * gerar-indices.js — o GERADOR dos índices do acervo (Etapa 2 do PLANO-INDICES.md).
 *
 * O QUE ELE É, E O QUE ELE NÃO É. A derivação já existe e é pura: `motor/nucleo/indices.js`
 * recebe caminhos, inventários, resumos e âncoras, e devolve o índice — sem `fs`, sem `fetch`,
 * sem relógio. Este script é a outra metade: LÊ o repositório, chama a derivação e ESCREVE os
 * arquivos. Ele não decide o que é um ciclo nem como se conta uma faceta; isso é do motor, e uma
 * segunda opinião aqui seria a divergência que o `--check` depois teria de apanhar.
 *
 * POR QUE EXISTE, se o Worker já serve o índice. O índice do Worker nasce da API do GitHub, a
 * cada leitura fria — e por isso não pode entrar num commit, nem ser conferido por quem revisa o
 * repositório. O arquivo versionado é o que o CI consegue comparar (`--check`) e o que a Tabela
 * de atividades serve sem rede. Os dois são o MESMO índice: um é construído do `git tree`, o
 * outro do disco, e a verificação 1 do `check-indices.js` prova que não divergem.
 *
 * DETERMINISMO. Chaves de objeto ordenadas, listas ordenadas, e nenhuma leitura de relógio que
 * entre no conteúdo comparável: `gerado_em` é o único campo volátil e o `--check` o ignora (com
 * `fonte.commit` e `fonte.arvore`, pela mesma razão). Duas execuções seguidas dão o mesmo texto,
 * fora esses três campos — e é isso que a verificação 11 mede.
 *
 * O QUE ELE LÊ. `wrangler.*.jsonc` (a lista de escolas), `escola/<slug>/indice.json` (o
 * inventário), `escola/<slug>/envelopes/.indice.json` (os resumos que o acervo já escreve),
 * `professores/**` (os documentos) e `**`*.fipp` (as âncoras). Nada de KV, nada de rede, nada do
 * conteúdo dos `.md`.
 *
 *   node tools/gerar-indices.js              regenera tudo
 *   node tools/gerar-indices.js --check      não escreve; falha se houver divergência
 *   node tools/gerar-indices.js --escola fita
 *   node tools/gerar-indices.js --json       resumo legível por máquina (para o CI)
 *   node tools/gerar-indices.js --listar     só diz o que escreveria (sem escrever)
 *
 * MOTIVO DECLARADO (CONGELAMENTO.md). `tools/` é congelado. Este arquivo é NOVO e não é chamado
 * por nenhum script existente: a fórmula de hash, a cobertura da âncora, os validadores, as
 * regras e as pétreas ficam exatamente como estavam. A integração nos scripts de criação e
 * geração de ciclo é a Etapa 3 — e, por mudar comportamento, terá entrada e commit próprios.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const indices = require('../motor/nucleo/indices.js');
/* A REGRA «ESTE SCRIPT É UMA ESCOLA?», num sítio só — a mesma que o `indice-acervo.js` usa no
 * caminho do servidor (24/11/2026). Duas leituras do mesmo marcador divergem no dia em que uma
 * muda, e foi essa divergência que deixou o shard na lista das escolas vivas. */
const shardsDoRepo = require('../motor/nucleo/shards.js');
const { lerAncora } = require('../motor/servidor/indice-acervo.js');

const RAIZ = path.resolve(__dirname, '..');
const DIR_INDICES = path.join(RAIZ, 'indices');

// O que não é acervo. `.wrangler` é cache local do wrangler; `out` é saída da apresentação;
// `experimentos` é área de teste e não entra no índice (PLANO-INDICES.md §4.8).
const DIRETORIOS_IGNORADOS = new Set(['.git', 'node_modules', '.wrangler', '.vscode', 'out', 'experimentos']);

/** Nomes relativos, ordenados — a ordem é parte do determinismo. */
function listarDiretorio(dirRel, acc) {
  const absoluto = path.join(RAIZ, dirRel);
  let entradas;
  try { entradas = fs.readdirSync(absoluto, { withFileTypes: true }); } catch { return acc; }
  for (const entrada of entradas.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    if (DIRETORIOS_IGNORADOS.has(entrada.name)) continue;
    const rel = dirRel ? dirRel + '/' + entrada.name : entrada.name;
    if (entrada.isDirectory()) listarDiretorio(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

/** Os caminhos que a derivação olha: os wrangler da raiz, `escola/` e `professores/`. */
function caminhosDoAcervo() {
  const caminhos = [];
  for (const nome of fs.readdirSync(RAIZ).sort()) {
    if (/^wrangler\.[a-z0-9-]+\.jsonc$/.test(nome)) caminhos.push(nome);
  }
  listarDiretorio('escola', caminhos);
  listarDiretorio('professores', caminhos);
  return caminhos.sort();
}

function lerTexto(rel) {
  try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return null; }
}

function lerJson(rel) {
  const texto = lerTexto(rel);
  if (!texto) return null;
  try { return JSON.parse(texto); } catch { return null; }
}

/** O commit, só para o `fonte` — informativo, e fora da comparação do `--check`. */
function commitAtual() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null;
  } catch {
    return null;
  }
}

/**
 * O MUNDO que a derivação precisa — lido do disco. A forma é a MESMA que o
 * `motor/servidor/indice-acervo.js` monta a partir do GitHub; é a coincidência que permite a
 * verificação 1 comparar os dois caminhos.
 */
function lerDoDisco() {
  const caminhos = caminhosDoAcervo();

  const inventarios = {};
  const envelopes = {};
  for (const caminho of caminhos) {
    const doInventario = /^escola\/([a-z0-9-]+)\/indice\.json$/.exec(caminho);
    if (doInventario) {
      const lido = lerJson(caminho);
      if (lido) inventarios[doInventario[1]] = lido;
    }
    const doIndice = /^escola\/([a-z0-9-]+)\/envelopes\/\.indice\.json$/.exec(caminho);
    if (doIndice) {
      const lido = lerJson(caminho);
      const resumos = (lido && lido.resumos) || {};
      envelopes[doIndice[1]] = (Array.isArray(lido && lido.nomes) ? lido.nomes : [])
        .map((nome) => ({ nome, resumo: resumos[nome] || null }))
        .filter((x) => x.resumo);
    }
  }

  // AS ÂNCORAS. O índice COPIA o `.fipp`; não recalcula hash. Recalcular seria uma segunda
  // implementação da fórmula — e a segunda é a que divergiria.
  const ancoras = {};
  for (const caminho of caminhos) {
    if (!/\.fipp$/.test(caminho)) continue;
    const texto = lerTexto(caminho);
    if (texto === null) continue;
    ancoras[caminho] = lerAncora(texto);
  }

  /* OS SHARDS — os scripts que servem N escolas (15/11/2026; regra unificada a 24/11/2026).
   *
   * A marca é a mesma que o `publicar.yml` procura para não os tratar como escola (a var
   * `PACOTE_PARTILHADO`), e a decisão passou a morar em `motor/nucleo/shards.js` — porque o
   * caminho do SERVIDOR (`indice-acervo.js`) não a fazia, e por isso o `indices/` daqui saía certo
   * enquanto a página ao vivo listava o `lastro-teste` como escola viva, com botão de apagar.
   *
   * Duas leituras do mesmo marcador divergem no dia em que uma muda; agora é uma só, e o
   * `indice-acervo.js` chama a mesma. */
  const shards = shardsDoRepo.scriptsDeShardSync({
    caminhos,
    lerTexto: (caminho) => {
      const m = /^wrangler\.([a-z0-9-]+)\.jsonc$/.exec(caminho);
      if (!m) return null;
      const texto = fs.readFileSync(path.join(RAIZ, caminho), 'utf8');
      return texto;
    },
  });

  return { caminhos, inventarios, envelopes, ancoras, shards, recortes: lerRecortes(caminhos) };
}

/**
 * A derivação, a partir do disco. `agora` é a única leitura de relógio do script, e o campo que
 * ele alimenta (`gerado_em`) é ignorado na comparação — por isso duas execuções são «iguais».
 */
function construir({ agora } = {}) {
  const mundo = lerDoDisco();
  const resultado = indices.construir({
    fonte: { commit: commitAtual(), arvore: null },
    agora: agora || new Date().toISOString().slice(0, 16),
    arvores: mundo.caminhos,
    /* O shard não é escola — ver o bloco de `lerDoDisco`. */
    shards: mundo.shards,
    inventarios: mundo.inventarios,
    envelopes: mundo.envelopes,
    ancoras: mundo.ancoras,
    recortes: mundo.recortes,
    // NUNCA com apelido: estes são os índices do ACERVO, e o apelido da aluna é dado de menor
    // que só pode aparecer no índice VIVO da escola (PLANO-INDICES.md §9.1, verificação 7).
    comApelido: false,
  });
  return { ...resultado, mundo };
}

/** O `id` de um documento, na forma estável (§4.7): `documento:<tipo>:<caminho>`. */
function idDeDocumento(tipo, caminho) {
  return 'documento:' + tipo + ':' + caminho;
}

/**
 * A ESCOLA, na forma do ARQUIVO (§4.3). É a derivação mais a projeção plana de `documentos[]` e
 * `aulas[]` — a conveniência que evita quem lê percorrer os ciclos. A projeção é DECLARADA e
 * conferida: a verificação 14 exige que as duas cópias digam exatamente a mesma coisa, porque
 * duas listas do mesmo dado é uma lista a mais.
 */
function apresentarEscola(indiceDaEscola) {
  const documentos = [];
  const aulas = [];
  for (const ciclo of indiceDaEscola.ciclos || []) {
    for (const caminho of ciclo.documentos || []) {
      const tipo = indices.tipoDoDocumento(caminho, ciclo.escola);
      if (!tipo) continue;
      documentos.push({
        id: idDeDocumento(tipo, caminho),
        tipo,
        caminho,
        ciclo_id: ciclo.id,
        escola: ciclo.escola,
        professor: ciclo.professor,
        // A âncora do documento é a do ciclo: o `.fipp` é da variante, não de cada arquivo.
        ancora_id: ciclo.ancora && ciclo.ancora.id ? ciclo.ancora.id : null,
      });
    }
    for (const aula of ciclo.aulas || []) {
      aulas.push(Object.assign({}, aula, { ciclo_id: ciclo.id }));
    }
  }
  documentos.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  aulas.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return Object.assign({}, indiceDaEscola, { documentos, aulas });
}

/**
 * AS VERSÕES DO RECORTE, lidas dos ficheiros (05/11/2026).
 *
 * `escola/<escola>/linhas-de-base/<id>--<carimbo>.json`, um por ACTO — é o formato que o
 * `motor/servidor/linhas-de-base-repo.js` grava, e a correspondência é uma soma de prefixo, sem
 * tabela e sem índice de caminhos: a mesma disciplina do acervo dos envelopes.
 *
 * A LINHA É LIDA INTEIRA, e o que sai dela é só o que o §4.8 permite: os `aspectos` (vocabulário
 * da anamnese, que é norma), a contagem `alunas`, a `turma`, o `professor` e as datas. Nenhum
 * apelido e nenhuma resposta — `alunas` é um NÚMERO, e é por isso que ele pode entrar aqui.
 *
 * UM FICHEIRO ILEGÍVEL NÃO DERRUBA A DERIVAÇÃO. Ele fica de fora, e a derivação não inventa o que
 * não conseguiu ler — o mesmo critério do `lerTexto` acima, que devolve `null` em vez de estourar.
 */
function lerRecortes(caminhos, ler) {
  /* O LEITOR É PARÂMETRO, e não uma chamada fixa ao `lerJson` — pela mesma razão que o
   * `carregarMundo` recebe o disco nas outras provas: uma regra que só se pode exercer sobre o
   * repositório real mede o acervo de hoje, não a regra. Em produção ninguém o passa. */
  const abrir = typeof ler === 'function' ? ler : lerJson;
  const por = {};
  for (const caminho of caminhos) {
    const achado = /^escola\/([a-z0-9-]+)\/linhas-de-base\/([^/]+)\.json$/.exec(caminho);
    if (!achado) continue;
    const escola = achado[1];
    const chave = achado[2];
    /* O `.indice.json` NÃO É UM ACTO (06/11/2026). Ele mora na mesma pasta e é o somatório das
     * versões — e caiu aqui na primeira execução a sério: o índice gerado trazia
     * `recorte:.indice`, com `vigentes: true` e zero alunas, ao lado do recorte verdadeiro. Um
     * ficheiro que começa por `.` é da casa, não do professor. E um acto tem SEMPRE
     * `<id>--<carimbo>`: um ficheiro sem o separador não tem carimbo, logo não é uma versão. */
    if (chave.charAt(0) === '.' || chave.lastIndexOf('--') === -1) continue;
    const i = chave.lastIndexOf('--');
    const id = i === -1 ? chave : chave.slice(0, i);
    const carimbo = i === -1 ? '' : chave.slice(i + 2);
    const lido = abrir(caminho);
    if (!lido || typeof lido !== 'object') continue;
    if (!por[escola]) por[escola] = [];
    por[escola].push({
      id: lido.id || id,
      arquivo: caminho,
      carimbo,
      nome: lido.nome || null,
      professor: lido.professor || null,
      turma: lido.turma || null,
      atualizada_em: lido.atualizada_em || null,
      enviada_em: lido.enviada_em || null,
      aspectos: (Array.isArray(lido.campos) ? lido.campos : [])
        .map((c) => (c && typeof c === 'object' ? c.id : c))
        .map((c) => String(c == null ? '' : c).trim())
        .filter(Boolean),
      // A CONTAGEM, nunca os nomes: o apelido da aluna só existe no índice VIVO (§9.1).
      alunas: Array.isArray(lido.alunas) ? lido.alunas.length : 0,
      ...(lido.apagada_em ? { apagada_em: lido.apagada_em } : {}),
    });
  }
  return por;
}

/** O recorte por ciclo (§4.4) — para ser servido no domínio da escola, atrás de rota autenticada. */
function apresentarCiclo(ciclo, indiceDaEscola) {
  const tipos = {};
  for (const caminho of ciclo.documentos || []) {
    const tipo = indices.tipoDoDocumento(caminho, ciclo.escola);
    if (tipo) tipos[tipo] = (tipos[tipo] || 0) + 1;
  }
  return {
    versao: indiceDaEscola.versao,
    gerado_em: indiceDaEscola.gerado_em,
    fonte: indiceDaEscola.fonte,
    id: ciclo.id,
    escola: ciclo.escola,
    professor: ciclo.professor,
    ciclo: ciclo.numero,
    estado: ciclo.estado,
    ancora: ciclo.ancora,
    documentos: (ciclo.documentos || []).map((caminho) => {
      const tipo = indices.tipoDoDocumento(caminho, ciclo.escola);
      return tipo ? idDeDocumento(tipo, caminho) : null;
    }).filter(Boolean).sort(),
    aulas: (ciclo.aulas || []).map((a) => a.id).sort(),
    filtros: {
      tipos: Object.keys(tipos).sort().map((valor) => ({
        valor,
        rotulo: (indices.TIPOS_DE_DOCUMENTO.indexOf(valor) !== -1 ? valor : valor),
        contagem: tipos[valor],
      })),
    },
  };
}

/** O objeto canónico, com as chaves ordenadas — o texto que vai para o arquivo. */
function serializar(objeto) {
  return JSON.stringify(JSON.parse(indices.canonico(objeto)), null, 2) + '\n';
}

/**
 * TUDO O QUE O GERADOR ESCREVE, em memória: `Map<caminho relativo, texto>`.
 * É a função que o `--check` e o `check-indices.js` usam — e é por isso que a comparação é
 * entre textos, e não entre objetos: o arquivo é o contrato, e um espaço a mais é divergência.
 */
function gerarEmMemoria({ agora } = {}) {
  const { acervo, escolas } = construir({ agora });
  const arquivos = new Map();
  arquivos.set('indices/acervo.json', serializar(acervo));
  for (const slug of Object.keys(escolas).sort()) {
    const daEscola = apresentarEscola(escolas[slug]);
    arquivos.set('indices/escolas/' + slug + '.json', serializar(daEscola));
    for (const ciclo of escolas[slug].ciclos || []) {
      const destino = 'indices/ciclos/' + ciclo.professor + '/' + ciclo.numero + '-' + ciclo.escola + '.json';
      // Uma variante pode repetir o destino (dois manifestos da mesma escola): o primeiro vence,
      // e a verificação 4 é quem tem de acusar o id duplicado, não o gerador em silêncio.
      if (!arquivos.has(destino)) arquivos.set(destino, serializar(apresentarCiclo(ciclo, escolas[slug])));
    }
  }
  return { arquivos, acervo, escolas };
}

/** Compara o que está no disco com o que o gerador produz. Ignora os voláteis. */
function compararComDisco(arquivos) {
  const divergentes = [];
  const ausentes = [];
  const inalterados = [];
  for (const [rel, texto] of arquivos) {
    const atual = lerTexto(rel);
    if (atual === null) { ausentes.push(rel); continue; }
    if (atual === texto) { inalterados.push(rel); continue; }
    // A comparação é TOLERANTE a `gerado_em` e a `fonte.commit`: são voláteis por desenho, e
    // reprovar por causa deles faria o `--check` falhar a cada minuto que passa.
    let igual = false;
    try {
      igual = indices.iguais(JSON.parse(atual), JSON.parse(texto));
    } catch { igual = false; }
    if (igual) inalterados.push(rel);
    else divergentes.push(rel);
  }
  return { divergentes, ausentes, inalterados };
}

/**
 * TUDO O QUE ESTÁ EM `indices/` E O GERADOR **NÃO** PRODUZ.
 *
 * O `indices/esquema/` é FONTE (escrito à mão), não saída: fica de fora por definição. O resto
 * é gerado, e o que está lá sem o gerador produzir é ÓRFÃO — o `check-indices.js` acusa-o na
 * verificação 1, e é o gerador quem tem de o remover. Sem isto, `node tools/gerar-indices.js`
 * escrevia o estado novo, deixava o fantasma no lugar e declarava «em dia» — enquanto o
 * verificador continuava a falhar. Medido em 20/10/2026, ao expurgar a escola `breu`: o
 * `indices/ciclos/sapo-bailarino/01-breu.json` descrevia um ciclo que já não existia, e as duas
 * ferramentas discordavam sobre o mesmo diretório.
 */
function orfaosNoDisco(arquivos) {
  const producao = new Set(arquivos.keys());
  const orfaos = [];
  const andar = (relativo) => {
    const absoluto = path.join(RAIZ, relativo);
    let entradas;
    try { entradas = fs.readdirSync(absoluto, { withFileTypes: true }); } catch { return; }
    for (const entrada of entradas) {
      const rel = relativo + '/' + entrada.name;
      if (entrada.isDirectory()) { andar(rel); continue; }
      if (rel.indexOf('indices/esquema/') === 0) continue;   // fonte, não saída
      /* `indices/relacoes/` É SAÍDA — DE OUTRO GERADOR (05/11/2026). O mapa de relações por ciclo
       * tem o seu próprio `tools/gerar-relacoes.js`, corre no mesmo commit e é ele quem o apaga e
       * o refaz. Sem esta linha, este gerador chamava «órfão» a cada mapa e o `--check` reprovava
       * para sempre — o que se aprende a ignorar, e um aviso ignorado é pior do que nenhum. */
      if (rel.indexOf('indices/relacoes/') === 0) continue;
      if (!/\.json$/.test(rel)) continue;
      if (!producao.has(rel)) orfaos.push(rel);
    }
  };
  andar('indices');
  return orfaos.sort();
}

/**
 * Escreve o que a geração produziu e APAGA o fantasma.
 *
 * `orfaos` é declarado por quem chama (o `main`), porque o conjunto de referência é sempre o
 * gerado INTEIRO e a remoção é o que o `--escola` limita. Escrever o novo sem apagar o velho
 * deixava as duas ferramentas a discordar sobre o mesmo diretório.
 */
function escrever(arquivos, orfaos) {
  const escritos = [];
  for (const [rel, texto] of arquivos) {
    const destino = path.join(RAIZ, rel);
    if (lerTexto(rel) === texto) continue;
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, texto, 'utf8');
    escritos.push(rel);
  }
  const removidos = [];
  const aSair = Array.isArray(orfaos) ? orfaos : orfaosNoDisco(arquivos);
  for (const rel of aSair) {
    try {
      fs.unlinkSync(path.join(RAIZ, rel));
      removidos.push(rel);
    } catch { /* não se apagou: o `--check` seguinte acusa */ }
  }
  return { escritos, removidos };
}

// ----------------------------------------------------------------------------- CLI

function uso() {
  console.log('uso: node tools/gerar-indices.js [--check | --listar] [--escola <slug>] [--json]');
  console.log('');
  console.log('  (sem opção)          regenera indices/acervo.json, indices/escolas/ e indices/ciclos/');
  console.log('  --check              não escreve; sai 1 se o disco divergir do gerado');
  console.log('  --listar             diz o que escreveria, sem escrever');
  console.log('  --escola <slug>      limita a escrita à escola indicada (o acervo é sempre escrito)');
  console.log('  --json               resumo legível por máquina');
}

function main(argv) {
  const opcoes = { check: false, listar: false, escola: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') opcoes.check = true;
    else if (arg === '--listar') opcoes.listar = true;
    else if (arg === '--json') opcoes.json = true;
    else if (arg === '--escola') { opcoes.escola = String(argv[i + 1] || ''); i += 1; }
    else if (arg === '--help' || arg === '-h') { uso(); return 0; }
    else { console.error('opção desconhecida: ' + arg); uso(); return 2; }
  }

  const { arquivos } = gerarEmMemoria();

  // O FILTRO POR ESCOLA. O acervo é transversal e sai sempre; o filtro limita o que é escrito
  // por escola — é o que a Etapa 5 usa quando só uma escola mudou.
  let alvo = arquivos;
  if (opcoes.escola) {
    alvo = new Map();
    for (const [rel, texto] of arquivos) {
      if (rel === 'indices/acervo.json') { alvo.set(rel, texto); continue; }
      if (rel === 'indices/escolas/' + opcoes.escola + '.json') { alvo.set(rel, texto); continue; }
      const m = /^indices\/ciclos\/[^/]+\/[0-9]{2}-([a-z0-9-]+)\.json$/.exec(rel);
      if (m && m[1] === opcoes.escola) alvo.set(rel, texto);
    }
    if (alvo.size === 1) {
      console.error('escola desconhecida no acervo: ' + opcoes.escola);
      return 2;
    }
  }

  const { divergentes, ausentes, inalterados } = compararComDisco(alvo);
  // OS ÓRFÃOS ENTRAM NO `--check` (20/10/2026). Sem eles, o verificador dizia «em dia» enquanto
  // o `check-indices.js` reprovava o mesmo diretório: as duas ferramentas mediam coisas
  // diferentes e a que conserta não via o que a outra acusava.
  //
  // A REFERÊNCIA É SEMPRE O CONJUNTO INTEIRO (`arquivos`), e o `--escola` limita só REMOÇÃO —
  // nunca o julgamento. Medido: comparando contra o alvo filtrado, os índices de todas as OUTRAS
  // escolas pareciam órfãos, e `--escola barra` apagaria oito escolas. O filtro diz o que se
  // escreve, não o que existe.
  const orfaosDoAlvo = (rel) => {
    if (!opcoes.escola) return true;
    if (rel === 'indices/acervo.json') return true;
    if (rel === 'indices/escolas/' + opcoes.escola + '.json') return true;
    const m = /^indices\/ciclos\/[^/]+\/[0-9]{2}-([a-z0-9-]+)\.json$/.exec(rel);
    return Boolean(m && m[1] === opcoes.escola);
  };
  const orfaos = orfaosNoDisco(arquivos).filter(orfaosDoAlvo);

  if (opcoes.check) {
    const falha = divergentes.length > 0 || ausentes.length > 0 || orfaos.length > 0;
    if (opcoes.json) {
      console.log(JSON.stringify({ ok: !falha, divergentes, ausentes, orfaos, inalterados }, null, 2));
    } else if (falha) {
      console.error('gerar-indices: o índice no disco não corresponde ao gerado.');
      for (const rel of ausentes) console.error('  falta: ' + rel);
      for (const rel of divergentes) console.error('  diverge: ' + rel);
      for (const rel of orfaos) console.error('  órfão (o gerador não o produz): ' + rel);
      console.error('  regere com: node tools/gerar-indices.js');
    } else {
      console.log('gerar-indices: ok — ' + inalterados.length + ' arquivo(s) em dia.');
    }
    return falha ? 1 : 0;
  }

  if (opcoes.listar) {
    const lista = [...alvo.keys()].sort();
    if (opcoes.json) console.log(JSON.stringify({ ok: true, arquivos: lista, orfaos }, null, 2));
    else {
      for (const rel of lista) console.log(rel);
      for (const rel of orfaos) console.log('(sai) ' + rel);
    }
    return 0;
  }

  const { escritos, removidos } = escrever(alvo, orfaos);
  if (opcoes.json) {
    console.log(JSON.stringify({ ok: true, escritos, removidos, inalterados: inalterados.length }, null, 2));
  } else {
    const partes = [];
    if (escritos.length) partes.push(escritos.length + ' arquivo(s) escrito(s):\n  ' + escritos.join('\n  '));
    if (removidos.length) partes.push(removidos.length + ' órfão(s) removido(s):\n  ' + removidos.join('\n  '));
    console.log('gerar-indices: ' + (partes.length
      ? partes.join('\n')
      : 'nada a escrever — ' + inalterados.length + ' arquivo(s) em dia.'));
  }
  return 0;
}

module.exports = {
  RAIZ,
  DIR_INDICES,
  caminhosDoAcervo,
  lerDoDisco,
  // A LEITURA DO RECORTE, exportada para a prova a poder exercer com caminhos de mentira — a
  // derivação inteira precisa do disco, e uma prova que só corresse sobre o repositório real
  // mediria o acervo de hoje, não a regra.
  lerRecortes,
  construir,
  apresentarEscola,
  apresentarCiclo,
  idDeDocumento,
  serializar,
  gerarEmMemoria,
  compararComDisco,
  escrever,
  orfaosNoDisco,
};

if (require.main === module) process.exit(main(process.argv.slice(2)));
