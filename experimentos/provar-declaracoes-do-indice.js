'use strict';

/*
 * provar-declaracoes-do-indice.js — a Etapa 1 do PLANO-INDICES.md, medida.
 *
 * O QUE ESTA PROVA FIXA. O plano manda escrever `indices/esquema/{campos,tipos,relacoes}.json`
 * "a partir dos nomes de arquivo que JÁ EXISTEM no repositório (não inventar tipos)", e a
 * validação da etapa é uma só: percorrer `professores/**` e classificar cada arquivo; o que não
 * casar nenhum padrão aparece numa lista para decisão — e nenhum tipo «desconhecido» pode ficar
 * sem decisão.
 *
 * A prova faz três coisas que o plano exige e uma que ele não escreveu mas a implementação
 * tornou necessária:
 *
 *   1. COBERTURA — todo arquivo de `professores/**` casa um tipo declarado ou um `ignorados[]`
 *      COM MOTIVO. Arquivo sem classificação reprova; arquivo que casa dois padrões também,
 *      porque a ambiguidade é uma decisão que ninguém tomou.
 *   2. ACORDO COM O MOTOR — o `motor/nucleo/indices.js` já classifica documentos pelo nome
 *      (`tipoDoDocumento`). A declaração e o motor têm de dizer a MESMA coisa para o mesmo
 *      caminho: duas gramáticas para o mesmo dado é a receita para divergirem (foi o defeito que
 *      a fase 4 corrigiu no `estado` do ciclo).
 *   3. VOCABULÁRIO — o conjunto de tipos que o motor classifica é exatamente o conjunto de
 *      tipos declarados com `classificado_pelo_motor: true`. Um tipo novo no motor sem
 *      declaração reprova; um tipo declarado que o motor não conhece também.
 *   4. DICIONÁRIO E RELAÇÕES — toda relação aponta para entidade e chave que `campos.json`
 *      declara (§4.1, critério iii; §9, verificação 9); nenhum campo proibido aparece; a aluna
 *      só é visível no índice da própria escola.
 *
 * O QUE ELA NÃO FAZ. Não gera índice, não lê âncora e não fala com a rede: é a etapa das
 * DECLARAÇÕES. O gerador é a Etapa 2 (`tools/gerar-indices.js`) e o índice servido já existe
 * no Worker (fase 4) — esta prova não o toca.
 *
 *   node experimentos/provar-declaracoes-do-indice.js
 */

const fs = require('fs');
const path = require('path');

const { TIPOS_DE_DOCUMENTO, tipoDoDocumento, cicloDoCaminho } = require('../motor/nucleo/indices.js');

const RAIZ = path.join(__dirname, '..');
const ESQUEMA = path.join(RAIZ, 'indices', 'esquema');

let n = 0;
let falhas = 0;

function checar(rotulo, ok, detalhe) {
  n += 1;
  if (ok) {
    console.log('  \u2713 ' + rotulo);
  } else {
    falhas += 1;
    console.log('  \u2717 ' + rotulo + (detalhe === undefined ? '' : ' — ' + detalhe));
  }
}

function lerJson(nome) {
  return JSON.parse(fs.readFileSync(path.join(ESQUEMA, nome), 'utf8'));
}

/** Todos os caminhos (arquivos e diretórios) sob `professores/`, relativos à raiz. */
function percorrer(dir, acc) {
  for (const entrada of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
    const rel = dir + '/' + entrada.name;
    if (entrada.isDirectory()) {
      acc.push({ caminho: rel + '/', diretorio: true });
      percorrer(rel, acc);
    } else {
      acc.push({ caminho: rel, diretorio: false });
    }
  }
  return acc;
}

/** As escolas conhecidas: os slugs de `escola/<slug>/`. */
function slugsConhecidos() {
  return fs.readdirSync(path.join(RAIZ, 'escola'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** A escola de um caminho do pacote — a mesma regra do `escolaDoSufixo` do motor. */
function escolaDoCaminho(caminho, slugs) {
  const c = cicloDoCaminho(caminho);
  if (!c || !c.resto) return null;
  let achado = null;
  for (const slug of slugs) {
    if (c.resto !== slug && c.resto.indexOf(slug + '-') !== 0) continue;
    if (!achado || slug.length > achado.length) achado = slug;
  }
  return achado;
}

/** A classificação DECLARADA de um caminho: `{tipo}` ou `{ignorado}` ou `null`. */
function classificar(caminho, tipos, ignorados) {
  const achados = [];
  for (const tipo of tipos) {
    const alvoDiretorio = tipo.alvo === 'diretorio';
    const alvo = caminho.endsWith('/');
    if (alvoDiretorio !== alvo) continue;
    if (new RegExp(tipo.padrao).test(caminho)) achados.push({ tipo: tipo.id });
  }
  for (const ig of ignorados) {
    if (new RegExp(ig.padrao).test(caminho)) achados.push({ ignorado: ig.id });
  }
  return achados;
}

function main() {
  const tiposJson = lerJson('tipos.json');
  const camposJson = lerJson('campos.json');
  const relacoesJson = lerJson('relacoes.json');
  const tipos = tiposJson.tipos || [];
  const ignorados = tiposJson.ignorados || [];
  const entidades = camposJson.entidades || {};
  const relacoes = relacoesJson.relacoes || [];

  console.log('\n== 1. Os três esquemas são fonte e declaram a versão ==');
  checar('tipos.json, campos.json e relacoes.json têm versao 1',
    tiposJson.versao === 1 && camposJson.versao === 1 && relacoesJson.versao === 1);
  checar('os três trazem o comentário de origem (são escritos à mão)',
    Boolean(tiposJson.$comentario && camposJson.$comentario && relacoesJson.$comentario));
  checar('tipos.json declara o alvo do padrão', tiposJson.alvo === 'caminho relativo à raiz do repositório');

  console.log('\n== 2. O vocabulário de tipos é coerente ==');
  const ids = tipos.map((t) => t.id);
  checar('nenhum id de tipo repetido', new Set(ids).size === ids.length,
    ids.filter((x, i) => ids.indexOf(x) !== i).join(', '));
  const padroesRuins = tipos.filter((t) => {
    try { new RegExp(t.padrao); return false; } catch (e) { return true; }
  });
  checar('todos os padrões compilam', padroesRuins.length === 0,
    padroesRuins.map((t) => t.id).join(', '));
  const incompletos = tipos.filter((t) => !t.rotulo || !t.familia || typeof t.publico !== 'boolean'
    || typeof t.classificado_pelo_motor !== 'boolean' || typeof t.latente !== 'boolean');
  checar('todo tipo declara rotulo, familia, publico, classificado_pelo_motor e latente',
    incompletos.length === 0, incompletos.map((t) => t.id).join(', '));

  console.log('\n== 3. O vocabulário declarado é o do motor ==');
  const doMotor = TIPOS_DE_DOCUMENTO.slice().sort();
  const declaradosDoMotor = tipos.filter((t) => t.classificado_pelo_motor).map((t) => t.id).sort();
  checar('os tipos de DOCUMENTO que o motor classifica são exatamente os declarados',
    doMotor.join(',') === declaradosDoMotor.join(','),
    'motor: ' + doMotor.join(',') + ' | declarados: ' + declaradosDoMotor.join(','));
  checar('o vocabulário de documento não se confunde com o de registro (TIPOS)',
    doMotor.indexOf('anamnese') === -1 && doMotor.indexOf('ciclo') === -1);

  console.log('\n== 4. Todo ARQUIVO do acervo tem decisão ==');
  const caminhos = percorrer('professores', []);
  const slugs = slugsConhecidos();
  const semDecisao = [];
  const ambiguos = [];
  const diretoriosSemPacote = [];
  const porTipo = new Map(ids.map((id) => [id, 0]));
  const porIgnorado = new Map(ignorados.map((i) => [i.id, 0]));
  const divergenciasDoMotor = [];
  const ignoradoQueOMotorClassifica = [];

  for (const item of caminhos) {
    const achados = classificar(item.caminho, tipos, ignorados);

    // A COBERTURA É DOS ARQUIVOS. Diretório não é documento: o que o plano manda classificar é
    // «cada arquivo» de professores/**. O diretório tem uma exigência só — o PACOTE, que é a
    // unidade entregue e o que a faceta `pacote` descreve.
    if (item.diretorio) {
      const parecePacote = /\/ciclos\/ciclo-[0-9]{2}-[a-z0-9-]+\/$/.test(item.caminho);
      if (parecePacote && (achados.length !== 1 || achados[0].tipo !== 'pacote')) {
        diretoriosSemPacote.push(item.caminho);
      }
      if (achados.length === 1 && achados[0].tipo === 'pacote') {
        porTipo.set('pacote', porTipo.get('pacote') + 1);
      }
      continue;
    }

    if (achados.length === 0) { semDecisao.push(item.caminho); continue; }
    if (achados.length > 1) { ambiguos.push(item.caminho + ' -> ' + achados.map((a) => a.tipo || a.ignorado).join('+')); continue; }
    const achado = achados[0];
    if (achado.tipo) porTipo.set(achado.tipo, porTipo.get(achado.tipo) + 1);
    else porIgnorado.set(achado.ignorado, porIgnorado.get(achado.ignorado) + 1);

    // O ACORDO COM O MOTOR, só para arquivos: o motor não classifica diretórios.
    const escola = escolaDoCaminho(item.caminho, slugs);
    const doMotorParaOArquivo = tipoDoDocumento(item.caminho, escola);
    if (achado.tipo && doMotorParaOArquivo && achado.tipo !== doMotorParaOArquivo) {
      divergenciasDoMotor.push(item.caminho + ': declarado ' + achado.tipo + ', motor ' + doMotorParaOArquivo);
    }
    if (achado.ignorado && doMotorParaOArquivo) {
      ignoradoQueOMotorClassifica.push(item.caminho + ': ignorado como ' + achado.ignorado
        + ', mas o motor classifica como ' + doMotorParaOArquivo);
    }
  }

  checar('nenhum ARQUIVO de professores/** ficou sem classificação',
    semDecisao.length === 0, semDecisao.slice(0, 5).join(' | '));
  checar('nenhum caminho casa dois padrões (a ambiguidade seria decisão não tomada)',
    ambiguos.length === 0, ambiguos.slice(0, 5).join(' | '));
  checar('todo diretório de pacote é classificado como `pacote`', diretoriosSemPacote.length === 0,
    diretoriosSemPacote.slice(0, 5).join(' | '));
  checar('a declaração e o motor dizem o mesmo tipo para o mesmo arquivo',
    divergenciasDoMotor.length === 0, divergenciasDoMotor.slice(0, 5).join(' | '));
  checar('nada declarado como ignorado é classificado pelo motor',
    ignoradoQueOMotorClassifica.length === 0, ignoradoQueOMotorClassifica.slice(0, 5).join(' | '));

  console.log('\n   ' + caminhos.length + ' caminho(s) sob professores/:');
  for (const t of tipos) {
    const q = porTipo.get(t.id);
    console.log('     ' + (t.publico ? 'público ' : 'interno ') + t.id.padEnd(12) + String(q).padStart(3)
      + (t.latente && q === 0 ? '  (latente: o gerador do ciclo ainda não o produziu)' : ''));
  }
  for (const ig of ignorados) {
    console.log('     ignorado' + ' '.repeat(4) + ig.id.padEnd(12) + String(porIgnorado.get(ig.id)).padStart(3));
  }

  console.log('\n== 5. O declarado como latente não mente ==');
  // SEM CICLO NÃO HÁ INSTÂNCIA PARA MEDIR (20/10/2026). A reposição do repositório depois do
  // expurgo de todas as escolas deixa `professores/` só com os schemas — o modelo de que nasce
  // escola nova, preservado de propósito. Aí não existe âncora, manifesto nem pacote para
  // contar, e a pergunta «o tipo declarado como existente tem instância?» fica sem resposta.
  // A prova DECLARA isso: ausência de dado não é prova de mentira na declaração.
  const ausentesDeclaradosPresentes = tipos.filter((t) => !t.latente && porTipo.get(t.id) === 0);
  // O QUE CONTA É HAVER CICLO, e não haver arquivo: os schemas ficam sempre (são o modelo), e
  // são eles que mantêm `professores/` povoado depois de um expurgo. O manifesto da variante
  // (`ciclo-NN-<escola>.conf`) é o que diz que um ciclo existe de facto.
  const temCiclo = caminhos.some((item) => !item.diretorio && /\/ciclos\/ciclo-[0-9]{2}-[a-z0-9-]+\.conf$/.test(item.caminho));
  if (!temCiclo) {
    console.log('   — nenhum documento de ciclo em `professores/`: o repositório está sem ciclo (só os schemas)');
    // O QUE FALTA SÃO OS TRÊS QUE SÓ UM CICLO PRODUZ, e o `schema` — que sobrevive porque é o
    // modelo — continua com instância. É isso que distingue «o repositório está vazio» de «a
    // declaração mente».
    const faltando = ausentesDeclaradosPresentes.map((t) => t.id).sort();
    checar('sem ciclo, faltam só os tipos que um ciclo produz (âncora, manifesto, pacote)',
      faltando.join(',') === 'ancora,manifesto,pacote', faltando.join(', '));
    checar('e o schema, que é o modelo, continua com instância', porTipo.get('schema') > 0,
      String(porTipo.get('schema')));
  } else {
    checar('todo tipo com latente:false tem ao menos uma instância real',
      ausentesDeclaradosPresentes.length === 0,
      ausentesDeclaradosPresentes.map((t) => t.id).join(', '));
  }
  const latentesPresentes = tipos.filter((t) => t.latente && porTipo.get(t.id) > 0);
  if (latentesPresentes.length) {
    console.log('   nota: já há instância de ' + latentesPresentes.map((t) => t.id).join(', ')
      + ' — a marca `latente` pode ser desligada no próximo ciclo.');
  }
  checar('todo ignorado declara motivo', ignorados.every((ig) => ig.motivo && ig.motivo.length > 10));

  console.log('\n== 6. O dicionário de campos ==');
  const nomesEntidades = Object.keys(entidades);
  const entidadesRuins = nomesEntidades.filter((nome) => {
    const e = entidades[nome];
    return !e.id || !e.campos || ['produzida', 'prevista'].indexOf(e.estado) === -1;
  });
  checar('toda entidade declara id, campos e estado (produzida|prevista)',
    entidadesRuins.length === 0, entidadesRuins.join(', '));

  const acessos = new Set(Object.keys(camposJson.acesso || {}));
  const camposRuins = [];
  for (const nome of nomesEntidades) {
    for (const [campo, def] of Object.entries(entidades[nome].campos)) {
      if (!def.tipo || !acessos.has(def.acesso) || typeof def.obrigatorio !== 'boolean') {
        camposRuins.push(nome + '.' + campo);
      }
    }
  }
  checar('todo campo declara tipo, acesso válido e obrigatoriedade', camposRuins.length === 0,
    camposRuins.slice(0, 5).join(', '));

  const proibidos = camposJson.proibidos || [];
  const camposProibidos = [];
  for (const nome of nomesEntidades) {
    for (const campo of Object.keys(entidades[nome].campos)) {
      if (proibidos.indexOf(campo) !== -1) camposProibidos.push(nome + '.' + campo);
    }
  }
  checar('nenhum campo proibido (senha, e-mail, saúde, prosa) está declarado',
    camposProibidos.length === 0, camposProibidos.join(', '));

  const aluna = entidades.registro && entidades.registro.campos.aluna;
  checar('o apelido da aluna é de acesso `escola` — nunca no acervo transversal',
    Boolean(aluna) && aluna.acesso === 'escola', aluna && aluna.acesso);

  console.log('\n== 7. As relações apontam para o que existe ==');
  const cardinais = ['1:1', '1:N', 'N:1', 'N:N'];
  const relacoesQuebradas = [];
  const relacoesDePrevista = [];
  for (const r of relacoes) {
    const origem = entidades[r.de];
    const destino = entidades[r.para];
    if (!origem || !destino) { relacoesQuebradas.push((r.de || '?') + ' -> ' + (r.para || '?')); continue; }
    const primeiro = String(r.chave || '').split('.')[0].replace(/\[\]$/, '');
    if (!primeiro || !origem.campos[primeiro]) {
      relacoesQuebradas.push(r.de + '.' + r.chave + ' (chave não declarada)');
    }
    if (cardinais.indexOf(r.cardinalidade) === -1) {
      relacoesQuebradas.push(r.de + ' -> ' + r.para + ' (cardinalidade ' + r.cardinalidade + ')');
    }
    if (r.estado === 'produzida' && (origem.estado !== 'produzida' || destino.estado !== 'produzida')) {
      relacoesDePrevista.push(r.de + ' -> ' + r.para);
    }
  }
  checar('toda relação aponta para entidade e chave declaradas', relacoesQuebradas.length === 0,
    relacoesQuebradas.slice(0, 5).join(' | '));
  checar('relação marcada produzida só liga entidades produzidas', relacoesDePrevista.length === 0,
    relacoesDePrevista.join(', '));

  const proibidas = relacoesJson.proibidas || [];
  const relacoesProibidas = relacoes.filter((r) => proibidas.some((p) => new RegExp(p.padrao).test(r.chave)));
  checar('nenhuma relação agrega por professor (o eixo proibido do §4.11)',
    relacoesProibidas.length === 0, relacoesProibidas.map((r) => r.chave).join(', '));

  checar('há relação declarada para cada entidade produzida que precisa de pai',
    ['ciclo', 'documento', 'aula', 'ancora', 'registro'].every((e) => relacoes.some((r) => r.de === e)));

  console.log('\n== 8. O que a Etapa 2 vai poder conferir ==');
  console.log('   tipos latentes (o gerador do ciclo os produzirá): '
    + (tipos.filter((t) => t.latente).map((t) => t.id).join(', ') || '(nenhum)'));
  console.log('   entidades previstas (o §4.11 as exige): '
    + (nomesEntidades.filter((e) => entidades[e].estado === 'prevista').join(', ') || '(nenhuma)'));

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + n + ' asserções, 0 falha(s).'
    : 'FALHOU — ' + falhas + ' de ' + n + ' asserção(ões).'));
  process.exit(falhas === 0 ? 0 : 1);
}

main();
