#!/usr/bin/env node
'use strict';

/*
 * provar-o-que-vem-do-dado.js — cada secção da aula: vem do DADO, ou está escrita no CÓDIGO?
 *
 *   node experimentos/provar-o-que-vem-do-dado.js [--detalhe]
 *
 * PORQUE EXISTE (01/11/2026). A pesquisadora leu a Aula 01 do ciclo da `batata` e fez a pergunta
 * certa sobre cada bloco do documento: «isso vem do lugar certo?» «é código duro, escrito direto
 * dentro do gerador?». E há uma diferença que não se lê no documento: um texto que NUNCA muda
 * parece um dado enquanto nada muda à volta dele. Ler o código responde por intenção; não responde
 * por comportamento.
 *
 * O MÉTODO É O DE MUTAÇÃO, e não o de leitura. Para cada secção, muda-se UMA resposta do envelope
 * — um valor que a pessoa escreveu, com uma marca inconfundível — e vê-se se o documento muda.
 *
 *   · a secção MUDA → o valor vem do dado (chave → valor), e a secção é do professor;
 *   · a secção NÃO muda → o texto está no código, e o documento afirma o que ninguém escreveu.
 *
 * É a única resposta que não depende de eu ter lido o ficheiro certo. E é o que fica registado:
 * uma secção que o gerador escreve à mão é uma afirmação do SISTEMA sobre a aula de alguém.
 *
 * A fixture é a REAL (`escola/batata/envelopes/`), porque o defeito apareceu num ciclo real e um
 * fixture inventado mediria a minha imaginação. Se a escola for expurgada, a prova DIZ que não
 * corre — em vez de passar por não ter medido nada.
 *
 * Sem rede, sem `git`, sem gerar pacote: a derivação é a de produção, chamada em processo.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const { derivarAula01, dimensoesEItens } = require(path.join(RAIZ, 'motor/nucleo/derivar-ciclo.js'));

const DETALHE = process.argv.includes('--detalhe');

let falhas = 0;
function provar(nome, condicao, extra) {
  if (!condicao) falhas += 1;
  console.log((condicao ? 'ok     ' : 'FALHA  ') + nome +
    (extra !== undefined && (DETALHE || !condicao) ? ' → ' + JSON.stringify(extra) : ''));
}

// ---------------------------------------------------------------------------
// A fixture: o envelope REAL do ciclo da batata
// ---------------------------------------------------------------------------
const ESCOLA = 'batata';
const PASTA = path.join(RAIZ, 'escola', ESCOLA, 'envelopes');

function maisRecente(prefixo) {
  if (!fs.existsSync(PASTA)) return null;
  const nomes = fs.readdirSync(PASTA).filter((n) => n.startsWith(prefixo + '-') && n.endsWith('.json')).sort();
  return nomes.length ? path.join(PASTA, nomes[nomes.length - 1]) : null;
}

const caminhoPlano = maisRecente('plano');
const caminhoPo = maisRecente('po');
if (!caminhoPlano || !caminhoPo) {
  console.error('provar-o-que-vem-do-dado: a escola «' + ESCOLA + '» não tem envelopes de plano e PO ' +
    '(expurgada?) — conferência NÃO FEITA.');
  process.exit(1);
}

const lerEnvelope = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const PLANO = lerEnvelope(caminhoPlano);
const PO = lerEnvelope(caminhoPo);

// O `.conf` da variante: duração e faixa de volume (a calibração da Regra 9).
const CONF = (() => {
  const pasta = path.join(RAIZ, 'professores');
  for (const prof of fs.readdirSync(pasta)) {
    const ciclos = path.join(pasta, prof, 'ciclos');
    if (!fs.existsSync(ciclos)) continue;
    for (const n of fs.readdirSync(ciclos)) {
      if (/^ciclo-01-batata-.*\.conf$/.test(n)) return fs.readFileSync(path.join(ciclos, n), 'utf8');
    }
  }
  return '';
})();
const pegarDoConf = (chave) => {
  const m = new RegExp('^' + chave + '="([^"]*)"', 'm').exec(CONF || '');
  return m ? m[1] : '';
};
const CALIBRACAO = {
  duracaoMinutos: parseInt(pegarDoConf('DURACOES'), 10) || 0,
  volumeMin: parseInt(pegarDoConf('VOLUME_MIN'), 10) || 0,
  volumeMax: parseInt(pegarDoConf('VOLUME_MAX'), 10) || 0,
};
const CONTEXTO = { escola: ESCOLA, professor: PLANO.contexto.professor, ciclo: '01' };

/**
 * Deriva a aula a partir de dois envelopes — os de origem, ou uma cópia com UMA resposta trocada.
 * O envelope é fundo, e a resposta é `{valor, origem, respondente, nota}`: a troca é no `valor`,
 * que é o que a pessoa escreveu.
 */
function derivarAula({ plano = PLANO, po = PO, calibracao = CALIBRACAO } = {}) {
  return derivarAula01({ plano, po, contexto: CONTEXTO, calibracao });
}

/** Uma cópia do envelope com a resposta `chave` trocada por `valor`. */
function comResposta(envelope, chave, valor) {
  const copia = JSON.parse(JSON.stringify(envelope));
  const antes = copia.respostas && copia.respostas[chave];
  copia.respostas = copia.respostas || {};
  // Preserva a FORMA da resposta: se era objeto `{valor}`, continua a ser.
  copia.respostas[chave] = (antes && typeof antes === 'object' && !Array.isArray(antes))
    ? Object.assign({}, antes, { valor })
    : valor;
  return copia;
}

/** O corpo de uma secção `## N. …` — do cabeçalho até ao seguinte, exclusivo. */
function secao(md, numero) {
  const linhas = String(md).split('\n');
  const inicio = linhas.findIndex((l) => new RegExp('^##\\s+' + numero + '\\.\\s').test(l));
  if (inicio === -1) return '';
  let fim = linhas.length;
  for (let i = inicio + 1; i < linhas.length; i += 1) {
    if (/^##\s+/.test(linhas[i])) { fim = i; break; }
  }
  return linhas.slice(inicio, fim).join('\n');
}

/** O texto de abertura (a frase «O que esta aula deixa de fora»), antes da §1. */
function abertura(md) {
  const s = String(md);
  const corte = s.indexOf('\n## ');
  return corte === -1 ? s : s.slice(0, corte);
}

const BASE = derivarAula();

// ---------------------------------------------------------------------------
// 1. Cada secção, uma a uma: o dado muda, o documento muda?
// ---------------------------------------------------------------------------
console.log('\n1. O QUE MUDA QUANDO O DADO MUDA');
console.log('   (a marca MUDADO tem de aparecer na secção; se não aparecer, o texto é do código)\n');

// Cada caso: [nome, número da secção (ou null = abertura), envelope, chave, valor novo, o que se
// espera]. `espera: 'dado'` = a secção tem de mudar; `espera: 'codigo'` = NÃO pode mudar.
const CASOS = [
  {
    nome: 'a abertura «O que esta aula deixa de fora»', numero: null, envelope: 'po',
    chave: 'o-que-fica-de-fora', valor: 'MUDADO-escopo-da-aula', espera: 'dado',
  },
  {
    nome: '§1 «Parâmetro de medição»', numero: 1, envelope: 'plano',
    chave: 'aula-1-parametro', valor: [{ marco: 1, marcados: ['MUDADO-exercicio'] }], espera: 'dado',
  },
  {
    nome: '§1 «Objetivo específico» (o marco da aula)', numero: 1, envelope: 'plano',
    chave: 'marcos-por-aula', valor: ['MUDADO-marco-da-aula'], espera: 'dado',
  },
  {
    nome: '§1 «Duração» (do .conf)', numero: 1, calibracao: { duracaoMinutos: 75 }, espera: 'dado',
  },
  {
    nome: '§2 «Condições preliminares» — o CONTEÚDO', numero: 2, envelope: 'plano',
    chave: 'condicoes-preliminares', valor: 'MUDADO-condicao', espera: 'dado',
  },
  {
    // O MESMO DADO, MEDIDO À PARTE NO TÍTULO. O conteúdo é do professor; o título não. Uma
    // secção pode ter as duas naturezas ao mesmo tempo, e é isso que a leitura do documento
    // esconde: a frase que a pessoa escreveu vem do formulário, e o rótulo que a enquadra vem do
    // código — e o rótulo afirma tanto quanto o conteúdo.
    nome: '§2 «Condições preliminares» — o TÍTULO',
    tituloDe: 2, envelope: 'plano', chave: 'condicoes-preliminares', valor: 'MUDADO-condicao',
    esperaTitulo: 'codigo',
  },
  {
    nome: '§3 «Distribuição do tempo» (a tabela)', numero: 3, envelope: 'plano',
    chave: 'distribuicao-de-volume',
    valor: { unidade: 'percentual', linhas: [{ Bloco: 'Barra', 'Proporção alvo': '100%' }] },
    espera: 'dado',
  },
  {
    // A §4 TINHA UM «PULSO» FIXO, E NÃO MUDOU (a primeira redação desta prova mediu-o com
    // `espera: 'codigo'` — o registo de que o defeito existia). Corrigida em 01/11/2026: a fatia
    // do bloco vem da distribuição do volume do plano, como o `tools/lib-vistas.js` já fazia.
    nome: '§4 «Bloco de musicalidade» — a fatia que o plano lhe dá', numero: 4, envelope: 'plano',
    chave: 'distribuicao-de-volume',
    valor: { unidade: 'percentual', linhas: [{ Bloco: 'Musicalidade', 'Proporção alvo': '100%' }] },
    espera: 'dado',
  },
  {
    nome: '§5 «Guia de observação» (as linhas)', numero: 5, envelope: 'po',
    chave: 'itens-por-dimensao',
    valor: [{ sujeito: 'Técnica — Barra', itens: 'MUDADO-criterio' }], espera: 'dado',
  },
  {
    // A §6 dizia «Ciclo **simulado**» a todos os ciclos, sem nomear um único elo. Agora nomeia os
    // dois envelopes: trocar o `id` do PO tem de mudar a secção, ou não é proveniência — é frase.
    // (só o `id` muda: a resposta do PO fica quieta, senão medir-se-ia a resposta e não o `id`)
    nome: '§6 «Proveniência consolidada» — o `id` do PO', numero: 6, envelope: null,
    espera: 'dado', idDoPo: 'po-19000101-0000',
  },
  {
    nome: '§7 «Registo de auditoria» (o volume auditado)', numero: 7,
    calibracao: { volumeMin: 10, volumeMax: 20 }, espera: 'dado',
  },
  {
    // O «próximo passo» era um `[Preencher]` mudo. O documento de arquitectura
    // (`PLANO-AULA-E-OBSERVACAO.md`) sempre disse o que era: o MARCO da aula seguinte, proposto.
    // Agora sai de `marcos-por-aula`, e por isso muda quando o plano muda.
    nome: '§8 «Próximo passo» — o marco seguinte do plano', numero: 8, envelope: 'plano',
    chave: 'marcos-por-aula', valor: ['MUDADO-marco-1', 'MUDADO-marco-2'], espera: 'dado',
  },
];

for (const caso of CASOS) {
  const opcoes = {};
  if (caso.envelope) opcoes[caso.envelope] = comResposta(caso.envelope === 'po' ? PO : PLANO, caso.chave, caso.valor);
  // O `id` do envelope: a §6 nomeia-o, e trocá-lo é a forma de medir se ele é mesmo lido.
  if (caso.idDoPo) opcoes.po = Object.assign({}, opcoes.po || PO, { id: caso.idDoPo });
  if (caso.calibracao) opcoes.calibracao = Object.assign({}, CALIBRACAO, caso.calibracao);
  const md = derivarAula(opcoes);

  // O TÍTULO, QUANDO É ELE QUE SE MEDE: só a primeira linha da secção.
  if (caso.esperaTitulo) {
    const doTitulo = (texto) => (secao(texto, caso.tituloDe).split('\n')[0] || '');
    provar(caso.nome + ' — está escrito no CÓDIGO (o título não muda com o dado)',
      doTitulo(md) === doTitulo(BASE), { comODado: doTitulo(md), sem: doTitulo(BASE) });
    continue;
  }

  const trecho = caso.numero === null ? abertura(md) : secao(md, caso.numero);
  const mudou = trecho !== (caso.numero === null ? abertura(BASE) : secao(BASE, caso.numero));

  if (caso.espera === 'dado') {
    provar(caso.nome + ' — VEM DO DADO (muda quando a resposta muda)', mudou,
      mudou ? undefined : trecho.slice(0, 160));
  } else {
    provar(caso.nome + ' — NÃO vem do dado (o texto é do código)'.replace('NÃO vem do dado',
      'está escrito no CÓDIGO'), !mudou, mudou ? trecho.slice(0, 200) : undefined);
  }

}

// ---------------------------------------------------------------------------
// 2. As secções que o gerador escrevia à mão: o que ficou no lugar
// ---------------------------------------------------------------------------
//
// ESTA SECÇÃO JÁ FOI O REGISTO DO DEFEITO. Na primeira redação (01/11/2026) as quatro provas
// abaixo afirmavam o contrário do que afirmam agora: que a §4 saía com um «Pulso» fixo, que a §6
// dizia «Ciclo **simulado**» a toda a gente, que a §8 era uma lacuna sem dizer o que «próximo
// passo» queria dizer, e que a §2 se anunciava «força e flexibilidade» com o conteúdo da sala.
// As quatro passaram a verde — e o que elas guardam agora é que **não voltem**.
console.log('\n2. O QUE ESTAVA ESCRITO NO CÓDIGO, E O QUE FICOU NO LUGAR');

const bloco2 = secao(BASE, 2);
provar('§2 — o título já diz o que o corpo é (o espaço e o material), e não «força e flexibilidade»',
  /^## 2\..*\(o espaço e o material\)/m.test(bloco2) && !/força e flexibilidade/i.test(bloco2),
  bloco2.split('\n')[0]);

const bloco4 = secao(BASE, 4);
provar('§4 — o rótulo fixo «Pulso» saiu',
  !/\*\*Pulso\*\*/i.test(bloco4), bloco4.trim().split('\n').slice(0, 5));
provar('§4 — o número da aula não está escrito à mão dentro da lacuna',
  !/Aula 01/.test(bloco4), (bloco4.match(/\[Preencher:[^\]]*\]/) || [''])[0]);
provar('§4 — a fatia vem da distribuição do volume do PLANO (Regra 9, etapa 2)',
  /\*\*Fatia do plano\*\*/.test(bloco4) && /%/.test(bloco4), bloco4.trim().split('\n').slice(2, 5));

const bloco6 = secao(BASE, 6);
provar('§6 — não chama «simulado» a um ciclo real',
  !/simulado/i.test(bloco6), (bloco6.match(/simulado/i) || [''])[0]);
provar('§6 — nomeia o `id` dos dois envelopes (vai-se verificar a quem?)',
  bloco6.includes('`' + (PO.id || '?') + '`') && bloco6.includes('`' + (PLANO.id || '?') + '`'),
  bloco6.trim().split('\n').slice(0, 6));

const bloco8 = secao(BASE, 8);
provar('§8 — diz o que é «próximo passo» (o marco da aula seguinte, proposto)',
  /marco da aula seguinte/.test(bloco8) && /\*\*proposto\*\*/.test(bloco8)
  && /Marco da Aula 0?2/.test(bloco8),
  bloco8.trim().split('\n').slice(0, 5));

// 3. DE ONDE VIERAM OS VALORES CONCRETOS DESTE CICLO
// ---------------------------------------------------------------------------
//
// A pergunta da pesquisadora foi: «eu não me lembro de ter escrito esses valores». A resposta
// tem duas metades, e as duas se medem:
//
//   a. a resposta está GRAVADA no envelope, com `origem` e `respondente` — não foi o gerador que
//      a inventou;
//   b. ela veio do AUTO-PREENCHIMENTO da fixture de teste (`teste/<escola>.json`, o que a palavra
//      «batata» no nome da escola carrega) — e em dois casos a pesquisadora MUDOU-A depois, no
//      formulário: é a diferença entre o que a fixture escreveu e o que o envelope guarda.
//
// A alínea (b) não é um defeito: a fixture é o que permite ensaiar o sistema sem dado real, e o
// formulário é onde a pessoa corrige. O que interessa é que se saiba qual das duas coisas se está
// a ler num documento publicado — um texto que ninguém escreveu parece igual ao que alguém escreveu.
console.log('\n3. DE ONDE VIERAM OS VALORES CONCRETOS DESTE CICLO');

const valorDe = (envelope, chave) => {
  const r = envelope.respostas && envelope.respostas[chave];
  return r && typeof r === 'object' && 'valor' in r ? r.valor : r;
};

const FIXTURE = path.join(RAIZ, 'teste', ESCOLA + '.json');
let fixture = null;
if (fs.existsSync(FIXTURE)) {
  try { fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')); } catch { fixture = null; }
}

// Todos os valores da fixture, por chave.
const daFixture = new Map();
if (fixture) {
  const varrer = (o) => {
    if (Array.isArray(o)) { o.forEach(varrer); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'respostas' && v && typeof v === 'object') {
        for (const [chave, valor] of Object.entries(v)) {
          if (!daFixture.has(chave)) daFixture.set(chave, []);
          daFixture.get(chave).push(valor);
        }
      }
      varrer(v);
    }
  };
  varrer(fixture);
}
const naFixture = (envelope, chave) => {
  const valor = valorDe(envelope, chave);
  if (valor === undefined) return false;
  return (daFixture.get(chave) || []).some((v) => JSON.stringify(v) === JSON.stringify(valor));
};

const CASOS_DE_ORIGEM = [
  ['«O que esta aula deixa de fora»', PO, 'o-que-fica-de-fora'],
  ['«Condições preliminares»', PLANO, 'condicoes-preliminares'],
  ['«Itens de cada dimensão» (o guia)', PO, 'itens-por-dimensao'],
  ['«Parâmetro de medição»', PLANO, 'aula-1-parametro'],
  ['«Dimensões observadas»', PO, 'dimensoes-de-observacao'],
];

for (const [rotulo, envelope, chave] of CASOS_DE_ORIGEM) {
  const resposta = envelope.respostas && envelope.respostas[chave];
  const origem = resposta && typeof resposta === 'object' ? resposta.origem : null;
  provar(rotulo + ': a resposta está GRAVADA no envelope, com origem declarada — não a inventou o gerador',
    Boolean(origem), { origem, respondente: resposta && resposta.respondente });
}

// As duas que a pesquisadora mudou no formulário: o envelope NÃO é a fixture.
const editadas = [
  ['«Parâmetro de medição»', PLANO, 'aula-1-parametro'],
  ['«Itens de cada dimensão»', PO, 'itens-por-dimensao'],
];
for (const [rotulo, envelope, chave] of editadas) {
  provar(rotulo + ': o valor gravado DIFERE do da fixture — a pesquisadora editou-o no formulário',
    naFixture(envelope, chave) === false, {
      gravado: valorDe(envelope, chave),
      daFixture: (daFixture.get(chave) || [])[0],
    });
}

// As que continuam iguais à fixture: dizer QUAIS são é o que impede a surpresa.
const iguais = CASOS_DE_ORIGEM.filter(([, env, chave]) => naFixture(env, chave)).map(([r]) => r);
provar('e estas continuam literais da fixture de teste — é delas que vem «eu não me lembro de ter escrito»',
  iguais.length > 0, iguais);

// ...e o que NÃO tem pergunta em formulário nenhum: a §4 e a §8 não têm de onde vir.
const temPergunta = (arquivo, id) => {
  const p = path.join(RAIZ, 'porta', arquivo);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8').includes('"' + id + '"');
};
provar('não existe campo «musicalidade» no formulário do PLANO (a §4 não tem de onde vir)',
  temPergunta(path.join('plano', 'conteudo', 'plano.json'), 'musicalidade') === false);
provar('…e no PO a musicalidade existe como DIMENSÃO, não como o bloco da §4',
  temPergunta(path.join('po', 'conteudo', 'po.json'), 'musicalidade') === true
  && dimensoesEItens(PO).some((d) => /musicalidade/i.test(d.dimensao)),
  dimensoesEItens(PO).map((d) => d.dimensao));
provar('…e nenhuma pergunta do formulário se chama «proximo-passo» ou «proximoPasso»',
  temPergunta(path.join('plano', 'conteudo', 'plano.json'), 'proximo-passo') === false
  && temPergunta(path.join('po', 'conteudo', 'po.json'), 'proximo-passo') === false);

// ---------------------------------------------------------------------------
console.log('\nprovar-o-que-vem-do-dado: ' + (falhas === 0
  ? 'TUDO CERTO — o que muda com o dado está identificado, e o que o gerador escreve à mão também.'
  : falhas + ' FALHA(S)'));
if (DETALHE) {
  console.log('\n-- a aula derivada da fixture real --');
  console.log(BASE.split('\n').slice(0, 4).join('\n'));
}
process.exit(falhas ? 1 : 0);
