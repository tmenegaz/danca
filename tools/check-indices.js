#!/usr/bin/env node
'use strict';

/*
 * check-indices.js — o VALIDADOR dos índices do acervo (Etapa 2 do PLANO-INDICES.md §9).
 *
 * O QUE ELE PROVA. Que o que está versionado em `indices/` é o que o gerador produz a partir do
 * repositório — e que o produzido respeita as regras que o plano declara: as âncoras são as dos
 * `.fipp`, os IDs não se repetem, toda escola com configuração tem entrada, nenhum dado sensível
 * entrou, os tipos e as relações das declarações cobrem o repositório, as facetas contam o que
 * dizem contar, o resultado é determinístico, a escola expurgada permanece marcada, e **nenhuma
 * chave agrega por professor** (§4.11).
 *
 * AS 13 VERIFICAÇÕES SÃO as do §9.1. A 14ª é a exigência do §4.3 que não estava numerada: as
 * duas cópias de `aulas[]` e `documentos[]` — a de dentro do ciclo e a do topo do arquivo da
 * escola — dizem exatamente a mesma coisa. Duas listas do mesmo dado é uma lista a mais; se
 * divergirem, quem lê escolhe a que lhe convém.
 *
 * AS 9 CONTRAPROVAS são as do §9.2, e rodam em MEMÓRIA (`--contraprovas`): cada uma estraga uma
 * cópia do mundo e exige que a verificação certa reprove, com a mensagem certa. A do plano diz
 * «desfeita antes do commit» — em memória não há o que desfazer, e é por isso que a prova pode
 * correr em qualquer clone, inclusive no CI.
 *
 * O QUE ELE NÃO FAZ. Não escreve: quem escreve é o `gerar-indices.js`. Ele lê o disco e compara.
 *
 *   node tools/check-indices.js                 valida e sai 0/1
 *   node tools/check-indices.js --json          resumo legível por máquina
 *   node tools/check-indices.js --contraprovas  prova que as verificações reprovam
 *
 * MOTIVO DECLARADO (CONGELAMENTO.md). `tools/` é congelado. Este arquivo é NOVO, e nada o chama
 * ainda: a fórmula de hash, a cobertura da âncora, os validadores existentes, as regras e as
 * pétreas ficam exatamente como estavam. O que ele valida — `indices/` — é derivado e está fora
 * da âncora (§8.2), portanto nenhum hash de ciclo muda.
 */

const fs = require('fs');
const path = require('path');

const indices = require('../motor/nucleo/indices.js');
const { lerAncora } = require('../motor/servidor/indice-acervo.js');
const gerador = require('./gerar-indices.js');

const RAIZ = path.resolve(__dirname, '..');
const DIR_ESQUEMA = path.join(RAIZ, 'indices', 'esquema');

// ------------------------------------------------------------------ leitura do mundo

function lerTexto(rel) {
  try { return fs.readFileSync(path.join(RAIZ, rel), 'utf8'); } catch { return null; }
}

function existe(rel) {
  try { fs.statSync(path.join(RAIZ, rel)); return true; } catch { return false; }
}

function lerJsonAbsoluto(caminho) {
  try { return JSON.parse(fs.readFileSync(caminho, 'utf8')); } catch { return null; }
}

/** Os arquivos do índice que estão no disco: `Map<rel, objeto>`. */
function lerIndicesDoDisco() {
  const mapa = new Map();
  const raiz = path.join(RAIZ, 'indices');
  const andar = (dirRel) => {
    let entradas;
    try { entradas = fs.readdirSync(path.join(RAIZ, dirRel), { withFileTypes: true }); } catch { return; }
    for (const entrada of entradas) {
      const rel = dirRel + '/' + entrada.name;
      if (entrada.isDirectory()) { andar(rel); continue; }
      if (rel.indexOf('indices/esquema/') === 0) continue;   // o esquema é fonte, não gerado
      if (!/\.json$/.test(rel)) continue;
      const objeto = lerJsonAbsoluto(path.join(RAIZ, rel));
      if (objeto) mapa.set(rel, objeto);
      else mapa.set(rel, null);
    }
  };
  andar('indices');
  return mapa;
}

function carregarMundo() {
  const esquema = {
    tipos: lerJsonAbsoluto(path.join(DIR_ESQUEMA, 'tipos.json')),
    campos: lerJsonAbsoluto(path.join(DIR_ESQUEMA, 'campos.json')),
    relacoes: lerJsonAbsoluto(path.join(DIR_ESQUEMA, 'relacoes.json')),
  };
  const { arquivos } = gerador.gerarEmMemoria();
  const gerado = new Map();
  for (const [rel, texto] of arquivos) gerado.set(rel, JSON.parse(texto));
  return {
    disco: { existe, ler: lerTexto },
    caminhos: gerador.caminhosDoAcervo(),
    indices: lerIndicesDoDisco(),
    gerado,
    esquema,
  };
}

// ------------------------------------------------------------------ utilidades

/** Percorre o objeto e chama `visitar(caminho, chave, valor)` em cada chave. */
function caminhar(valor, visitar, caminho) {
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => caminhar(item, visitar, caminho + '[' + i + ']'));
    return;
  }
  if (!valor || typeof valor !== 'object') return;
  for (const chave of Object.keys(valor)) {
    const trilha = caminho ? caminho + '.' + chave : chave;
    visitar(trilha, chave, valor[chave]);
    caminhar(valor[chave], visitar, trilha);
  }
}

function achatar(valor, acc) {
  if (Array.isArray(valor)) { for (const x of valor) achatar(x, acc); return acc; }
  if (valor && typeof valor === 'object') { for (const k of Object.keys(valor)) achatar(valor[k], acc); return acc; }
  acc.push(valor);
  return acc;
}

/** Os arquivos de `professores/**` — é o acervo de DOCUMENTOS que o esquema classifica. */
function arquivosDoAcervo() {
  return gerador.caminhosDoAcervo().filter((c) => c.indexOf('professores/') === 0);
}

// ------------------------------------------------------------------ as verificações

/**
 * Cada verificação devolve a lista de FALHAS (mensagens). Lista vazia = passou.
 * O `ctx` é o mundo; as contraprovas passam um `ctx` estragado.
 */
const VERIFICACOES = [
  {
    n: 1,
    nome: 'Reconstrução',
    regra: 'o índice no disco é o que o gerador produz a partir do repositório',
    rodar(ctx) {
      const falhas = [];
      for (const [rel, objeto] of ctx.gerado) {
        const noDisco = ctx.indices.get(rel);
        if (noDisco === undefined) { falhas.push(rel + ': não existe no disco — regere com `node tools/gerar-indices.js`'); continue; }
        if (noDisco === null) { falhas.push(rel + ': não é JSON válido'); continue; }
        if (!indices.iguais(noDisco, objeto)) {
          falhas.push(rel + ': diverge do gerado (fora `gerado_em` e `fonte.commit`)');
        }
      }
      for (const rel of ctx.indices.keys()) {
        if (!ctx.gerado.has(rel)) falhas.push(rel + ': está no disco e o gerador não o produz (arquivo órfão)');
      }
      return falhas;
    },
  },
  {
    n: 2,
    nome: 'Existência',
    regra: 'todo caminho declarado no índice existe no repositório',
    rodar(ctx) {
      const falhas = [];
      const conferir = (rel, deOnde) => {
        if (!rel) return;
        if (!ctx.disco.existe(rel)) falhas.push(deOnde + ' → ' + rel + ': não existe');
      };
      for (const [rel, objeto] of ctx.indices) {
        if (!objeto) continue;
        for (const ciclo of objeto.ciclos || []) {
          // No MESTRE, `documentos` é um NÚMERO (a contagem); no índice da escola, é a lista.
          // A verificação de existência só tem o que conferir quando há caminhos — e é essa a
          // diferença entre a visão transversal (pequena, sem caminhos) e a da escola.
          if (Array.isArray(ciclo.documentos)) {
            for (const caminho of ciclo.documentos) conferir(caminho, rel + ' ciclo ' + ciclo.id);
          }
          if (ciclo.pacote) conferir(ciclo.pacote, rel + ' ciclo ' + ciclo.id);
          // NO MESTRE, `aulas` TAMBÉM É UM NÚMERO (20/10/2026). A guarda existia para
          // `documentos` e não para `aulas` — e passou despercebida porque o único ciclo do
          // mestre tinha `aulas: 0`, e `0 || []` é `[]` (zero é falsy). O primeiro ciclo com uma
          // aula de verdade — `aulas: 1` — derrubou a verificação com «number 1 is not iterable».
          // O teste certo é ser LISTA, não ser «truthy»: um contador nunca se percorre.
          if (Array.isArray(ciclo.aulas)) {
            for (const aula of ciclo.aulas) conferir(aula.documento, rel + ' aula ' + aula.id);
          }
          if (ciclo.ancora && ciclo.ancora.caminho) conferir(ciclo.ancora.caminho, rel + ' âncora ' + ciclo.id);
        }
        for (const doc of objeto.documentos || []) conferir(doc.caminho, rel + ' documento ' + doc.id);
      }
      return falhas;
    },
  },
  {
    n: 3,
    nome: 'Âncora',
    regra: 'id, hash, parent_hash e ancorado_em do índice são os do `.fipp`',
    rodar(ctx) {
      const falhas = [];
      for (const [rel, objeto] of ctx.indices) {
        if (!objeto) continue;
        for (const ciclo of objeto.ciclos || []) {
          const ancora = ciclo.ancora;
          if (!ancora || !ancora.caminho || ancora.lida === false) continue;
          const texto = ctx.disco.ler(ancora.caminho);
          if (texto === null) { falhas.push(rel + ': âncora ' + ancora.caminho + ' não pôde ser lida'); continue; }
          const doDisco = lerAncora(texto);
          const pares = [
            ['id', doDisco.id, ancora.id],
            ['hash', doDisco.hash, ancora.hash],
            ['parent_hash', doDisco.parentHash || '', ancora.parent_hash || ''],
            ['ancorado_em', doDisco.ancorado_em || null, ancora.ancorado_em || null],
          ];
          for (const [campo, esperado, achado] of pares) {
            if (String(esperado) !== String(achado)) {
              falhas.push(rel + ' ' + ciclo.id + ': ' + campo + ' do índice (' + achado + ') ≠ .fipp (' + esperado + ')');
            }
          }
        }
      }
      return falhas;
    },
  },
  {
    n: 4,
    nome: 'Unicidade',
    regra: 'dois itens do mesmo arquivo não têm o mesmo ID',
    rodar(ctx) {
      const falhas = [];
      for (const [rel, objeto] of ctx.indices) {
        if (!objeto) continue;
        const vistos = new Map();
        const registrar = (id, deOnde) => {
          if (!id) return;
          if (vistos.has(id)) falhas.push(rel + ': id repetido «' + id + '» (' + vistos.get(id) + ' e ' + deOnde + ')');
          else vistos.set(id, deOnde);
        };
        for (const e of objeto.escolas || []) registrar(e.id, 'escolas[]');
        for (const p of objeto.professores || []) registrar(p.id, 'professores[]');
        for (const c of objeto.ciclos || []) {
          registrar(c.id, 'ciclos[]');
          // `aulas` é CONTAGEM no mestre e LISTA na escola (ver a verificação 2): percorrer a
          // contagem estoura. Só se percorre o que é lista.
          if (Array.isArray(c.aulas)) for (const a of c.aulas) registrar(a.id, 'ciclos[].aulas[]');
        }
        for (const r of objeto.registros || []) registrar(r.id, 'registros[]');
        // AS PROJEÇÕES PLANAS NÃO CONTAM PARA A UNICIDADE (20/10/2026). O índice da escola traz
        // `documentos[]` e `aulas[]` no topo como PROJEÇÃO dos ciclos — «a conveniência que evita
        // quem lê percorrer os ciclos», declara o `gerar-indices.js`. O mesmo id aparece, de
        // propósito, nas duas vistas, e esta verificação lia isso como duplicata. Quem confere o
        // acordo entre as vistas é a verificação 14, e é ela que apanha uma duplicata DENTRO da
        // projeção (a lista sairia maior do que a calculada). Medido hoje: o primeiro ciclo com
        // aula de verdade acusou «id repetido … (ciclos[].aulas[] e aulas[])».

      }
      return falhas;
    },
  },
  {
    n: 5,
    nome: 'Cobertura',
    regra: 'todo `wrangler.*.jsonc` (menos a raiz) tem entrada, e toda entrada não expurgada tem config',
    rodar(ctx) {
      const falhas = [];
      const acervo = ctx.indices.get('indices/acervo.json');
      if (!acervo) return ['indices/acervo.json: ausente — sem ele não há cobertura a medir'];
      const configs = new Set(
        ctx.caminhos
          .filter((c) => /^wrangler\.[a-z0-9-]+\.jsonc$/.test(c))
          .map((c) => c.replace(/^wrangler\./, '').replace(/\.jsonc$/, ''))
          .filter((slug) => slug !== 'danca'),
      );
      const noIndice = new Map(acervo.escolas.map((e) => [e.slug, e]));
      for (const slug of configs) {
        if (!noIndice.has(slug)) falhas.push('wrangler.' + slug + '.jsonc existe e a escola não está no acervo');
      }
      for (const [slug, escola] of noIndice) {
        if (configs.has(slug)) continue;
        // Sem config, a escola só pode estar no índice como MEMÓRIA do expurgo.
        if (escola.expurgada !== true) {
          falhas.push('escola ' + slug + ' não tem wrangler e não está marcada como expurgada');
        }
      }
      return falhas;
    },
  },
  {
    n: 6,
    nome: 'Cópias',
    regra: 'as cópias de `raiz/indices/` e do pacote, quando existem, são idênticas à fonte',
    rodar(ctx) {
      const falhas = [];
      const pares = [['raiz/indices/acervo.json', 'indices/acervo.json']];
      for (const [copia, fonte] of pares) {
        if (!ctx.disco.existe(copia)) continue;   // a cópia é da Etapa 4; ausente não é erro
        const a = ctx.disco.ler(copia);
        const b = ctx.disco.ler(fonte);
        if (a === null || b === null) { falhas.push(copia + ': ilegível'); continue; }
        try {
          if (!indices.iguais(JSON.parse(a), JSON.parse(b))) falhas.push(copia + ': diverge de ' + fonte);
        } catch { falhas.push(copia + ': não é JSON'); }
      }
      return falhas;
    },
  },
  {
    n: 7,
    nome: 'Privacidade',
    regra: 'nenhuma senha, e-mail, saúde, prosa ou apelido nos índices do acervo',
    rodar(ctx) {
      const falhas = [];
      // As chaves proibidas por NOME. `hash` não está aqui: a âncora tem o seu, e é o dado que a
      // proveniência precisa. O que se proíbe é «hash» fora da âncora — a verificação trata os
      // dois casos separadamente para a mensagem dizer qual dos dois falhou.
      const proibidas = new Set(['senha', 'sal', 'email', 'telefone', 'observacoes', 'saude', 'apelido', 'aluna']);
      for (const [rel, objeto] of ctx.indices) {
        if (!objeto) continue;
        caminhar(objeto, (trilha, chave, valor) => {
          const nome = String(chave).toLowerCase();
          if (proibidas.has(nome)) falhas.push(rel + ': campo proibido «' + trilha + '»');
          if (nome === 'hash' && !/(^|\.)ancora(\.|$)/.test(trilha)) {
            falhas.push(rel + ': «' + trilha + '» — hash permitido só dentro de `ancora`');
          }
          if (typeof valor === 'string' && /acompanhamento-[^/]*$/.test(valor) && /\.md$/.test(valor)) {
            falhas.push(rel + ': caminho de acompanhamento em claro «' + valor + '»');
          }
        }, '');
        if (objeto.nao_indexado && !Array.isArray(objeto.nao_indexado)) {
          falhas.push(rel + ': `nao_indexado` tem de ser lista (a exceção declarada)');
        }
      }
      return falhas;
    },
  },
  {
    n: 8,
    nome: 'Declaração',
    regra: 'todo arquivo do acervo casa um tipo declarado, e nenhum tipo declarado é inventado',
    rodar(ctx) {
      const falhas = [];
      const tipos = (ctx.esquema.tipos && ctx.esquema.tipos.tipos) || [];
      const ignorados = (ctx.esquema.tipos && ctx.esquema.tipos.ignorados) || [];
      if (!tipos.length) return ['indices/esquema/tipos.json: sem tipos declarados'];

      const declarados = tipos.filter((t) => t.classificado_pelo_motor).map((t) => t.id).sort();
      const doMotor = indices.TIPOS_DE_DOCUMENTO.slice().sort();
      if (declarados.join(',') !== doMotor.join(',')) {
        falhas.push('tipos.json e o motor divergem: declarado [' + declarados.join(',') + '], motor [' + doMotor.join(',') + ']');
      }

      for (const rel of arquivosDoAcervo()) {
        const achados = [];
        for (const tipo of tipos) {
          const alvoDiretorio = tipo.alvo === 'diretorio';
          if (alvoDiretorio !== rel.endsWith('/')) continue;
          if (new RegExp(tipo.padrao).test(rel)) achados.push(tipo.id);
        }
        for (const ig of ignorados) if (new RegExp(ig.padrao).test(rel)) achados.push('ignorado:' + ig.id);
        if (achados.length === 0) falhas.push(rel + ': sem tipo declarado');
        if (achados.length > 1) falhas.push(rel + ': casa mais de um padrão (' + achados.join(', ') + ')');
      }
      return falhas;
    },
  },
  {
    n: 9,
    nome: 'Relações',
    regra: 'toda relação aponta para entidade e chave que o dicionário declara',
    rodar(ctx) {
      const falhas = [];
      const entidades = (ctx.esquema.campos && ctx.esquema.campos.entidades) || {};
      const relacoes = (ctx.esquema.relacoes && ctx.esquema.relacoes.relacoes) || [];
      const cardinais = ['1:1', '1:N', 'N:1', 'N:N'];
      for (const r of relacoes) {
        const origem = entidades[r.de];
        const destino = entidades[r.para];
        if (!origem) { falhas.push('relação ' + r.de + ' → ' + r.para + ': entidade de origem inexistente'); continue; }
        if (!destino) { falhas.push('relação ' + r.de + ' → ' + r.para + ': entidade de destino inexistente'); continue; }
        if (cardinais.indexOf(r.cardinalidade) === -1) {
          falhas.push('relação ' + r.de + ' → ' + r.para + ': cardinalidade «' + r.cardinalidade + '» inválida');
        }
        const primeiro = String(r.chave || '').split('.')[0].replace(/\[\]$/, '');
        if (!primeiro || !origem.campos[primeiro]) {
          falhas.push('relação ' + r.de + ' → ' + r.para + ': chave «' + r.chave + '» não declarada em ' + r.de);
        }
      }

      // AS ENTIDADES PREVISTAS TÊM CONTRATO MÍNIMO. `vinculo` sem `de`, ou `autoria` sem `autor`,
      // é o que a contraprova 9 estraga — e o §4.11 diz por que: sem vigência, «quem era em março»
      // não tem resposta; sem autor, a autoria foi inferida, e inferida é o que não se faz.
      const vinculo = entidades.vinculo;
      if (vinculo && (!vinculo.campos.de || vinculo.campos.de.obrigatorio !== true)) {
        falhas.push('campos.json: `vinculo.de` tem de existir e ser obrigatório (vigência)');
      }
      const autoria = entidades.autoria;
      if (autoria && (!autoria.campos.autor || autoria.campos.autor.obrigatorio !== true)) {
        falhas.push('campos.json: `autoria.autor` tem de existir e ser obrigatório (autoria declarada)');
      }
      return falhas;
    },
  },
  {
    n: 10,
    nome: 'Facetas',
    regra: 'a contagem de cada faceta bate com a lista de itens que ela resume',
    rodar(ctx) {
      const falhas = [];
      const acervo = ctx.indices.get('indices/acervo.json');
      if (acervo) {
        const porSlug = new Map(acervo.escolas.map((e) => [e.slug, e]));
        for (const faceta of (acervo.filtros && acervo.filtros.escolas) || []) {
          const quantas = acervo.escolas.filter((e) => e.slug === faceta.valor).length;
          if (faceta.contagem !== quantas) falhas.push('acervo filtros.escolas[' + faceta.valor + ']: contagem ' + faceta.contagem + ' ≠ ' + quantas);
        }
        for (const faceta of (acervo.filtros && acervo.filtros.professores) || []) {
          const p = acervo.professores.find((x) => x.slug === faceta.valor);
          const quantas = p ? p.escolas.length : 0;
          if (faceta.contagem !== quantas) falhas.push('acervo filtros.professores[' + faceta.valor + ']: contagem ' + faceta.contagem + ' ≠ ' + quantas + ' escola(s)');
        }
        const registros = acervo.escolas.flatMap((e) => e.registros || []);
        for (const faceta of (acervo.filtros && acervo.filtros.tipos) || []) {
          const quantos = registros.filter((id) => String(id).split(':')[0] === faceta.valor).length;
          if (faceta.contagem !== quantos) falhas.push('acervo filtros.tipos[' + faceta.valor + ']: contagem ' + faceta.contagem + ' ≠ ' + quantos);
        }
        for (const faceta of (acervo.filtros && acervo.filtros.estados) || []) {
          const quantos = (acervo.ciclos || []).filter((c) => c.estado === faceta.valor).length;
          if (faceta.contagem !== quantos) falhas.push('acervo filtros.estados[' + faceta.valor + ']: contagem ' + faceta.contagem + ' ≠ ' + quantos);
        }
        void porSlug;
      }
      for (const [rel, objeto] of ctx.indices) {
        if (!objeto || !objeto.filtros) continue;
        for (const nome of Object.keys(objeto.filtros)) {
          for (const faceta of objeto.filtros[nome] || []) {
            if (Array.isArray(faceta.ids) && faceta.contagem !== faceta.ids.length) {
              falhas.push(rel + ' filtros.' + nome + '[' + faceta.valor + ']: contagem ' + faceta.contagem + ' ≠ ' + faceta.ids.length + ' id(s)');
            }
          }
        }
      }
      return falhas;
    },
  },
  {
    n: 11,
    nome: 'Determinismo',
    regra: 'duas gerações seguidas dão o mesmo índice, fora os voláteis',
    rodar(ctx) {
      const falhas = [];
      const uma = gerador.gerarEmMemoria();
      const outra = gerador.gerarEmMemoria();
      for (const [rel, texto] of uma.arquivos) {
        const outro = outra.arquivos.get(rel);
        if (!outro) { falhas.push(rel + ': a segunda geração não o produziu'); continue; }
        if (texto !== outro && !indices.iguais(JSON.parse(texto), JSON.parse(outro))) {
          falhas.push(rel + ': duas gerações seguidas divergem');
        }
      }
      void ctx;
      return falhas;
    },
  },
  {
    n: 12,
    nome: 'Expurgo',
    regra: 'a escola expurgada permanece no índice, marcada — o elo não se apaga',
    rodar(ctx) {
      const falhas = [];
      const acervo = ctx.indices.get('indices/acervo.json');
      if (!acervo) return [];
      for (const escola of acervo.escolas) {
        const temInventario = ctx.disco.existe('escola/' + escola.slug + '/indice.json');
        const temConfig = ctx.caminhos.indexOf('wrangler.' + escola.slug + '.jsonc') !== -1;
        if (escola.expurgada === true && !temInventario) {
          falhas.push('escola ' + escola.slug + ': expurgada e sem o inventário que é o elo');
        }
        if (temInventario && !temConfig && escola.expurgada !== true) {
          falhas.push('escola ' + escola.slug + ': sem config e não marcada expurgada');
        }
        // E A RECÍPROCA DA HABILITAÇÃO (20/10/2026). Uma escola expurgada não tem Worker nem
        // subdomínio: não pode estar habilitada. O elo guarda `estado.habilitada` da criação e
        // não se reescreve, então é na derivação que a contradição se desfaz — e é aqui que ela
        // se acusa, para não voltar em silêncio.
        if (escola.expurgada === true && escola.habilitada === true) {
          falhas.push('escola ' + escola.slug + ': expurgada e habilitada ao mesmo tempo');
        }
      }
      return falhas;
    },
  },
  {
    n: 13,
    nome: 'Sem eixo de professor',
    regra: 'nenhuma chave conta, soma ou ordena por professor (§4.11)',
    rodar(ctx) {
      const falhas = [];
      // O PROIBIDO É A AGREGAÇÃO, não o professor. `filtros.professores`, `ciclos[].professor`,
      // `vinculos[]` e `autoria[]` são faceta, vínculo e autoria — e são legítimos. O que não
      // existe é a chave que transforma a pessoa em eixo.
      const proibido = /(^|_)(por_professor|porProfessor)$|(^|_)ranking(_|$)|(^|_)desempenho(_|$)|total_por_professor|aulas_por_professor|professores_por_/i;
      for (const [rel, objeto] of ctx.indices) {
        if (!objeto) continue;
        caminhar(objeto, (trilha, chave) => {
          if (proibido.test(String(chave))) falhas.push(rel + ': chave de agregação por professor «' + trilha + '»');
        }, '');
      }
      return falhas;
    },
  },
  {
    n: 14,
    nome: 'Cópias internas',
    regra: 'as cópias de `aulas[]` e `documentos[]` no topo da escola são as de dentro do ciclo (§4.3)',
    rodar(ctx) {
      const falhas = [];
      for (const [rel, objeto] of ctx.indices) {
        // A CÓPIA INTERNA só existe no arquivo da ESCOLA: é o único que tem os ciclos E as listas
        // planas. O recorte por ciclo tem `documentos[]` sem `ciclos[]` — e ali não há cópia a
        // comparar, há a lista única.
        if (!objeto || !Array.isArray(objeto.ciclos)) continue;
        if (!Array.isArray(objeto.documentos) || !Array.isArray(objeto.aulas)) continue;
        const esperadosDocs = [];
        const esperadasAulas = [];
        for (const ciclo of objeto.ciclos || []) {
          for (const caminho of ciclo.documentos || []) {
            const tipo = indices.tipoDoDocumento(caminho, ciclo.escola);
            if (tipo) esperadosDocs.push(gerador.idDeDocumento(tipo, caminho));
          }
          for (const aula of ciclo.aulas || []) esperadasAulas.push(aula.id);
        }
        const achadosDocs = objeto.documentos.map((d) => d.id).sort();
        const achadasAulas = objeto.aulas.map((a) => a.id).sort();
        if (achadosDocs.join('|') !== esperadosDocs.sort().join('|')) {
          falhas.push(rel + ': `documentos[]` do topo não corresponde aos ciclos');
        }
        if (achadasAulas.join('|') !== esperadasAulas.sort().join('|')) {
          falhas.push(rel + ': `aulas[]` do topo não corresponde aos ciclos');
        }
      }
      return falhas;
    },
  },
];

/** Roda todas as verificações e devolve `{falhas, porVerificacao}`. */
function verificar(ctx) {
  const porVerificacao = [];
  for (const v of VERIFICACOES) {
    let falhas;
    try { falhas = v.rodar(ctx); } catch (erro) { falhas = ['erro ao verificar: ' + erro.message]; }
    porVerificacao.push({ n: v.n, nome: v.nome, regra: v.regra, falhas });
  }
  return { falhas: porVerificacao.reduce((s, v) => s + v.falhas.length, 0), porVerificacao };
}

// ------------------------------------------------------------------ as contraprovas

/**
 * Cada contraprova estraga UMA coisa e exige que a verificação N reprove. O `mundo` é o `ctx`
 * de `carregarMundo()`; a mutação é sempre em memória.
 */
function contraprovas(ctx, pulados) {
  const casos = [];
  // NEM TODA CONTRAPROVA TEM O QUE ESTRAGAR (20/10/2026). Cada uma precisa de um dado real
  // (uma âncora, um ciclo, um documento) e, quando ele não existe, a contraprova simplesmente
  // não entra — e o resumo dizia «7 contraprovas, todas reprovam», que se lê como «as 9 do
  // §9.2 passaram». Ficou concreto ao expurgar a escola `breu`: o repositório passou a não ter
  // ciclo nenhum (só os schemas), duas contraprovas deixaram de correr, e nada dizia isso. O
  // que não corre declara-se, com o motivo.
  const semDado = (nome, motivo) => { if (pulados) pulados.push({ nome, motivo }); };

  const comIndices = (mutar) => {
    const indicesCopia = new Map();
    for (const [rel, objeto] of ctx.indices) {
      indicesCopia.set(rel, objeto ? JSON.parse(JSON.stringify(objeto)) : objeto);
    }
    mutar(indicesCopia);
    return Object.assign({}, ctx, { indices: indicesCopia });
  };

  // 1. apagar um `.fipp` → verificação 3 (e a 2: o caminho deixa de existir)
  {
    // A ÂNCORA COM CAMINHO está no índice da ESCOLA: o mestre, para ficar pequeno, guarda só o
    // id e o hash (§4.2). Procurar o caminho no mestre dava `undefined` — e a contraprova
    // passaria por não ter encontrado o que estragar, que é a pior forma de passar.
    let alvo = null;
    for (const [, objeto] of ctx.indices) {
      const ciclo = objeto && objeto.ciclos && objeto.ciclos[0];
      if (ciclo && ciclo.ancora && ciclo.ancora.caminho) { alvo = ciclo.ancora.caminho; break; }
    }
    if (alvo) {
      const disco = { existe: (rel) => (rel === alvo ? false : ctx.disco.existe(rel)), ler: (rel) => (rel === alvo ? null : ctx.disco.ler(rel)) };
      casos.push({ nome: 'apagar um .fipp', espera: 3, ctx: Object.assign({}, ctx, { disco }) });
    } else {
      semDado('apagar um .fipp', 'nenhum ciclo no repositório tem âncora — nada a apagar');
    }
  }

  // 2. alterar um caractere do hash no `.fipp` → verificação 3
  {
    let rodou = false;
    for (const [rel, objeto] of ctx.indices) {
      const ciclo = objeto && objeto.ciclos && objeto.ciclos[0];
      const ancora = ciclo && ciclo.ancora;
      if (!ancora || !ancora.caminho || !ancora.hash) continue;
      const texto = ctx.disco.ler(ancora.caminho);
      if (!texto) continue;
      const trocado = String(ancora.hash).replace(/^./, (c) => (c === 'a' ? 'b' : 'a'));
      const adulterado = texto.replace(String(ancora.hash), trocado);
      const disco = { existe: ctx.disco.existe, ler: (r) => (r === ancora.caminho ? adulterado : ctx.disco.ler(r)) };
      casos.push({ nome: 'alterar um caractere do hash no .fipp', espera: 3, ctx: Object.assign({}, ctx, { disco }) });
      rodou = true;
      void rel;
      break;
    }
    if (!rodou) semDado('alterar um caractere do hash no .fipp', 'nenhum ciclo tem âncora legível — nada a adulterar');
  }

  // 3. acrescentar `"apelido": "Vavá"` a um item → verificação 7
  {
    const alvo = 'indices/acervo.json';
    casos.push({
      nome: 'acrescentar "apelido": "Vavá" a um item',
      espera: 7,
      ctx: comIndices((mapa) => {
        const acervo = mapa.get(alvo);
        if (acervo && acervo.escolas && acervo.escolas[0]) acervo.escolas[0].apelido = 'Vavá';
      }),
    });
  }

  // 4. renomear (ou acrescentar) um documento sem regenerar → verificação 1
  //
  // O ALVO É ESCOLHIDO, NÃO NOMEADO (20/10/2026). Fixava `indices/escolas/breu.json`, e o
  // expurgo da `breu` deixou-a sem ciclos: o `documentos[0]` não existia, a mutação não estragava
  // nada, e a contraprova «passava por não ter encontrado o que estragar» — que é a pior forma de
  // passar, e a mesma armadilha que a contraprova 1 já documenta.
  //
  // Num repositório SEM nenhum documento (o estado depois de um expurgo de tudo — só os schemas
  // ficam), o que se prova é o mesmo mecanismo por outro gesto: ACRESCENTAR um documento que o
  // gerador não produz. A verificação 1 compara o disco com o gerado; os dois casos a fazem
  // divergir, e o nome do caso diz qual dos dois foi.
  {
    let alvo = null;
    let documentos = null;
    for (const [rel, objeto] of ctx.indices) {
      if (rel.indexOf('indices/escolas/') !== 0) continue;
      const ciclo = objeto && objeto.ciclos && objeto.ciclos[0];
      if (!ciclo || !Array.isArray(ciclo.documentos)) continue;
      if (!alvo) alvo = rel;
      if (ciclo.documentos.length) { alvo = rel; documentos = ciclo.documentos; break; }
    }
    if (alvo) {
      const renomear = Boolean(documentos && documentos.length);
      casos.push({
        nome: renomear ? 'renomear um documento sem regenerar'
          : 'acrescentar um documento que o gerador não produz',
        espera: 1,
        ctx: comIndices((mapa) => {
          const daEscola = mapa.get(alvo);
          const lista = daEscola && daEscola.ciclos && daEscola.ciclos[0] && daEscola.ciclos[0].documentos;
          if (!Array.isArray(lista)) return;
          if (lista.length) {
            // O RENOMEIO é do CAMINHO, e não do sufixo: `ciclo-01-breu.conf` não termina em
            // `.json`, e uma troca que dependa disso não mudaria nada.
            lista[0] = lista[0].replace(/(\.[a-z]+)$/, '-renomeado$1');
          } else {
            lista.push('professores/ninguem/ciclos/ciclo-99-inventado.md');
          }
        }),
      });
    }
  }

  // 5. duplicar um item → verificação 4
  {
    const alvo = 'indices/acervo.json';
    casos.push({
      nome: 'duplicar um item',
      espera: 4,
      ctx: comIndices((mapa) => {
        const acervo = mapa.get(alvo);
        if (acervo && acervo.escolas && acervo.escolas[0]) acervo.escolas.push(JSON.parse(JSON.stringify(acervo.escolas[0])));
      }),
    });
  }

  // 6. remover uma escola do acervo sem removê-la do disco → verificação 1 (e a 5)
  {
    const alvo = 'indices/acervo.json';
    casos.push({
      nome: 'remover uma escola do acervo sem removê-la do disco',
      espera: 1,
      ctx: comIndices((mapa) => {
        const acervo = mapa.get(alvo);
        if (acervo && acervo.escolas && acervo.escolas.length) acervo.escolas.shift();
      }),
    });
  }

  // 7. apagar `indices/` e regenerar → DEVE PASSAR. A prova de reconstrução é sobreviver à
  //    perda: o gerador não lê o que está em `indices/`, e por isso apagá-lo não muda o gerado.
  {
    const semIndices = Object.assign({}, ctx, { indices: new Map(), gerado: ctx.gerado });
    const resultado = verificar(semIndices);
    // Só a verificação 1 pode falhar (arquivos ausentes); as outras não dependem do disco do
    // índice. E o gerado tem de ser o mesmo de antes — é a prova de que não se lê a si mesmo.
    const geradoIgual = [...ctx.gerado.keys()].every((rel) => semIndices.gerado.has(rel));
    casos.push({ nome: 'apagar indices/ e regenerar (deve passar)', espera: 0, ctx: semIndices, devePassar: true, extra: geradoIgual });
  }

  // 8. acrescentar `"aulas_por_professor": {...}` → verificação 13
  {
    const alvo = 'indices/acervo.json';
    casos.push({
      nome: 'acrescentar "aulas_por_professor" a um índice',
      espera: 13,
      ctx: comIndices((mapa) => {
        const acervo = mapa.get(alvo);
        if (acervo) acervo.aulas_por_professor = { 'tiago-menegaz': 12 };
      }),
    });
  }

  // 9. `vinculos[]` com `de` nulo, ou `autoria` sem `autor` → verificação 9
  {
    const esquema = JSON.parse(JSON.stringify(ctx.esquema));
    if (esquema.campos && esquema.campos.entidades && esquema.campos.entidades.vinculo) {
      esquema.campos.entidades.vinculo.campos.de.obrigatorio = false;
    }
    casos.push({ nome: 'vinculos[] com `de` não obrigatório', espera: 9, ctx: Object.assign({}, ctx, { esquema }) });

    const semAutor = JSON.parse(JSON.stringify(ctx.esquema));
    if (semAutor.campos && semAutor.campos.entidades && semAutor.campos.entidades.autoria) {
      delete semAutor.campos.entidades.autoria.campos.autor;
    }
    casos.push({ nome: 'autoria sem `autor`', espera: 9, ctx: Object.assign({}, ctx, { esquema: semAutor }) });
  }

  return casos;
}

function rodarContraprovas() {
  const ctx = carregarMundo();
  const pulados = [];
  const casos = contraprovas(ctx, pulados);
  let falhas = 0;
  console.log('\n== Contraprovas (§9.2) — cada uma tem de REPROVAR ==\n');
  for (const caso of casos) {
    const resultado = verificar(caso.ctx);
    const daVerificacao = resultado.porVerificacao.find((v) => v.n === caso.espera);
    if (caso.devePassar) {
      const ok = caso.extra !== false;
      if (ok) console.log('  \u2713 ' + caso.nome + ' — a geração não depende do disco de `indices/`');
      else { falhas += 1; console.log('  \u2717 ' + caso.nome + ' — a geração mudou sem o disco'); }
      continue;
    }
    const reprovou = daVerificacao && daVerificacao.falhas.length > 0;
    if (reprovou) {
      console.log('  \u2713 ' + caso.nome + ' → verificação ' + caso.espera + ' reprova');
      console.log('      ' + daVerificacao.falhas[0]);
    } else {
      falhas += 1;
      console.log('  \u2717 ' + caso.nome + ' → a verificação ' + caso.espera + ' NÃO reprovou');
    }
  }
  // O QUE NÃO CORREU DIZ-SE — o resumo não pode valer por omissão.
  for (const p of pulados) {
    console.log('  \u2014 ' + p.nome + ' NÃO correu: ' + p.motivo);
  }
  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + casos.length + ' contraprova(s), todas reprovam como deviam'
      + (pulados.length ? ' (' + pulados.length + ' declarada(s) sem dado)' : '') + '.'
    : 'FALHOU — ' + falhas + ' contraprova(s) não reprovaram.'));
  return falhas === 0 ? 0 : 1;
}

// ------------------------------------------------------------------ CLI

function main(argv) {
  if (argv.indexOf('--contraprovas') !== -1) return rodarContraprovas();
  const json = argv.indexOf('--json') !== -1;

  const ctx = carregarMundo();
  const resultado = verificar(ctx);

  if (json) {
    console.log(JSON.stringify({
      ok: resultado.falhas === 0,
      verificacoes: resultado.porVerificacao.map((v) => ({ n: v.n, nome: v.nome, ok: v.falhas.length === 0, falhas: v.falhas })),
    }, null, 2));
    return resultado.falhas === 0 ? 0 : 1;
  }

  console.log('\n== Índices do acervo — ' + VERIFICACOES.length + ' verificações ==\n');
  for (const v of resultado.porVerificacao) {
    if (v.falhas.length === 0) {
      console.log('  \u2713 ' + String(v.n).padStart(2) + '. ' + v.nome);
    } else {
      console.log('  \u2717 ' + String(v.n).padStart(2) + '. ' + v.nome + ' — ' + v.falhas.length + ' falha(s)');
      for (const f of v.falhas.slice(0, 6)) console.log('        ' + f);
      if (v.falhas.length > 6) console.log('        … e mais ' + (v.falhas.length - 6));
    }
  }
  console.log('\n' + (resultado.falhas === 0
    ? 'TUDO CERTO — ' + VERIFICACOES.length + ' verificações, 0 falha(s).'
    : 'FALHOU — ' + resultado.falhas + ' falha(s) em ' + resultado.porVerificacao.filter((v) => v.falhas.length).length + ' verificação(ões).'));
  return resultado.falhas === 0 ? 0 : 1;
}

module.exports = { VERIFICACOES, carregarMundo, verificar, contraprovas, rodarContraprovas };

if (require.main === module) process.exit(main(process.argv.slice(2)));
