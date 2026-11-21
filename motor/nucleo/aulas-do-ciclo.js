'use strict';

/**
 * aulas-do-ciclo.js — QUE AULAS UMA REGENERAÇÃO PODE ESCREVER (21/11/2026).
 *
 * A REGRA, na letra da pesquisadora: «regenerar o ciclo afecta só a aula que ainda não foi dada;
 * as outras ficam e não se apagam.»
 *
 * PORQUE ELA EXISTE, e o que ela impede. As fontes de um ciclo têm duas metades, e o
 * `ARQUITETURA-AULA.md` §1.1 diz qual é qual: **enquanto a aula está `planejada` o plano dela é
 * INTENÇÃO — o professor muda como quiser; depois que a aula acontece, a mesma fonte é FACTO.**
 * O `-aula-NN.md` e o `-captura-aula-NN.md` são o plano e a folha de observação DAQUELA aula.
 * Um derivado que os reescreve depois de a aula ter acontecido faz o que nenhum caminho do
 * sistema pode fazer: reescreve a intenção por baixo do facto. E não é um caso de escola: o
 * «Guardar» do PO é justamente o gesto da cascata do elenco, e ele regera o ciclo inteiro.
 *
 * O QUE É «JÁ ACONTECEU», AQUI. **O registro do lançamento** — `aulas[NN]` no `-dados.json`.
 * Não há campo «aula dada» em lugar nenhum (é a §1 do `ARQUITETURA-AULA.md`), e o juízo
 * `planejada`/`dada`/`lancada`/`nao_dada` depende de um relógio: quem o faz é o formulário, com
 * o próprio `agora` (`estadoDaAula()`). Um derivador não tem relógio, e não deve ter — o que ele
 * lê é o FACTO, e é o mesmo critério que o índice já usa (`aulas[].lancada`, «o facto, não o
 * juízo»: §4.2).
 *
 * A JANELA QUE ISSO DEIXA ABERTA, declarada em vez de escondida: uma aula que já aconteceu e
 * ainda não foi lançada (dentro do prazo) tem `aulas[NN]` ausente, e portanto ainda é regenerável.
 * É a mesma janela em que o professor ainda pode ajustar o plano dela — os dois relógios fecham
 * no lançamento (§1.2) —, e por isso não é uma contradição: enquanto o plano é ajustável, ele
 * continua a ser intenção. Quem a fecha é o lançamento, e o lançamento é o registo.
 *
 * O QUE SE FAZ COM UMA AULA JÁ LANÇADA, e são três coisas:
 *   · **não se reescreve** — o ficheiro que está é o facto, e a derivação não é fonte dele;
 *   · **não se arquiva elo** — não há substituição, logo não há `historico/` a encher com uma
 *     versão que ninguém substituiu;
 *   · **não se apaga** — nenhum caminho deste sistema apaga a aula de alguém, e a lista de
 *     documentos do ciclo só cresce (`docs_derivado` em `tools/lib-fontes.sh` expande por ficheiro
 *     existente, nunca por lista nominal).
 *
 * E a excepção, que é uma reparação e não uma licença: se a fonte da aula lançada NÃO EXISTE, não
 * há facto a preservar — o que falta reconstrói-se, e o chamador diz que o fez. Um buraco no
 * pacote não é prova de nada.
 */

/** `01`, `1`, `aula-01` → `01`. Vazio quando não é número de aula. */
function numeroDaAula(nn) {
  const m = /^(?:aula-?)?\s*0*(\d+)$/i.exec(String(nn == null ? '' : nn).trim());
  if (!m) return '';
  const n = Number(m[1]);
  return n > 0 ? String(n).padStart(2, '0') : '';
}

/**
 * AS AULAS COM REGISTRO — as chaves de `aulas` no `-dados.json`, normalizadas.
 *
 * Aceita o envelope cifrado (`lancamentos: 1`, sem `aulas`) e devolve vazio: a cópia pública do
 * pacote não tem as chaves, e quem lê o facto é a fonte, não a cópia. Também aceita `null` (o
 * `-dados.json` que ainda não existe), e devolve vazio — um ciclo que nasce não tem aula dada.
 */
function aulasLancadas(dados) {
  const aulas = dados && typeof dados === 'object' ? dados.aulas : null;
  const saida = new Set();
  if (!aulas || typeof aulas !== 'object') return saida;
  for (const [nn, aula] of Object.entries(aulas)) {
    // Uma entrada sem objecto não é um lançamento: é lixo de uma escrita interrompida.
    if (!aula || typeof aula !== 'object') continue;
    const numero = numeroDaAula(nn);
    if (numero) saida.add(numero);
  }
  return saida;
}

/**
 * SE A AULA `nn` AINDA PODE SER REESCRITA POR UMA DERIVAÇÃO. `false` = já foi dada, e o ficheiro
 * que lá está é facto. É a regra inteira, num predicado, para os dois caminhos a usarem.
 */
function podeRegenerar(nn, lancadas) {
  const numero = numeroDaAula(nn);
  if (!numero) return true;        // «não sei que aula é» não tranca nada
  if (!lancadas) return true;
  return !(lancadas.has ? lancadas.has(numero) : false);
}

/**
 * A CHAVE DE UMA RESPOSTA DA AULA NO ENVELOPE DO PLANO (21/11/2026).
 *
 * As respostas que são DE UMA AULA vivem no plano com o número no nome: `aula-1-sequencia`,
 * `aula-1-parametro`. O número vai **sem zero à frente** — é a forma que o envelope tem, e a
 * primeira aula foi elicitada assim quando ela era a única. Mudá-la agora renomearia a resposta
 * de todos os planos gravados; a chave fica, e o que se generaliza é a leitura.
 *
 * `chaveDaAula('01', 'sequencia')` → `aula-1-sequencia` (a chave que já existe), e
 * `chaveDaAula('2', 'parametro')` → `aula-2-parametro`.
 */
function chaveDaAula(nn, campo) {
  const numero = numeroDaAula(nn);
  if (!numero) return '';
  return 'aula-' + Number(numero) + '-' + String(campo || '').trim();
}

/**
 * A FAMÍLIA DA CHAVE DA AULA, LIDA DE VOLTA (21/11/2026).
 *
 * `aula-2-sequencia` → `{ numero: 2, campo: 'sequencia' }`; qualquer outra coisa → `null`.
 *
 * PORQUE ISTO EXISTE, e a história é o defeito: a elicitação guarda as respostas cujo `id` o
 * CONTEÚDO declara (`prepararRespostas`, em `motor/nucleo/elicitar.js`), e o conteúdo do plano
 * declara **uma** aula — o bloco «A Aula 1», com `aula-1-parametro` e `aula-1-sequencia`. As
 * respostas da Aula 02 chegavam, não estavam na lista, e eram DESCARTADAS em silêncio: o
 * envelope era gravado, a tela dizia «gravado — a aula 02 está a ser gerada», e a aula 02 nunca
 * existia. Medido em 21/11/2026 no envelope `plano-20261121-0933`: `aula-de-cada-objetivo` com o
 * objetivo 2, e nem `aula-2-parametro` nem `aula-2-sequencia`.
 *
 * A FAMÍLIA é declarada — é a mesma das outras funções deste ficheiro; o NÚMERO é dado. É essa a
 * distinção que faltava: o conteúdo declara a família, não cada instância.
 */
const CAMPOS_DA_AULA = ['parametro', 'sequencia', 'objetivo'];
function lerChaveDaAula(id) {
  const m = /^aula-0*(\d+)-([a-z]+)$/.exec(String(id == null ? '' : id).trim());
  if (!m) return null;
  const campo = m[2];
  if (CAMPOS_DA_AULA.indexOf(campo) === -1) return null;
  const numero = numeroDaAula(m[1]);
  return numero ? { numero: Number(numero), campo } : null;
}

/** A aula SEGUINTE, com dois dígitos. É a que a §8 de cada aula nomeia. */
function aulaSeguinte(nn) {
  const numero = numeroDaAula(nn);
  return numero ? String(Number(numero) + 1).padStart(2, '0') : '';
}

/**
 * AS AULAS QUE O PLANO DECLARA — as que têm sequência escrita no envelope (21/11/2026).
 *
 * É esta a regra que faz a aula existir no ciclo: `aula-1-sequencia` sempre existiu, e por isso a
 * Aula 01 é de todos os ciclos; a partir do dia em que o plano declara `aula-2-sequencia`, o ciclo
 * TEM a Aula 02 — e o `DOCS` do manifesto tem de a declarar, ou o gerador não a publica e o
 * derivador não a escreve. A regra é DERIVADA do dado, e não pedida a ninguém: um clique que
 * criasse a aula e esquecesse a lista deixaria o documento por publicar sem erro nenhum.
 *
 * A chave leva o número sem zero à frente — é a forma que os envelopes gravados têm. A reserva
 * aceita a forma com zero (`aula-02-sequencia`), para não perder uma resposta que alguém grave
 * assim: a leitura é generosa, a escrita é que tem uma forma só.
 */
function aulasDeclaradasPeloPlano(plano) {
  const respostas = (plano && plano.respostas) || {};
  const temValor = (chave) => {
    const cru = respostas[chave];
    const valor = cru && typeof cru === 'object' && !Array.isArray(cru) ? cru.valor : cru;
    if (Array.isArray(valor)) return valor.length > 0;
    return String(valor == null ? '' : valor).trim() !== '';
  };
  const aulas = new Set(['01']);
  for (const chave of Object.keys(respostas)) {
    const m = /^aula-0*(\d+)-sequencia$/.exec(chave);
    if (!m) continue;
    const numero = numeroDaAula(m[1]);
    if (numero && temValor(chave)) aulas.add(numero);
  }
  return [...aulas].sort((a, b) => Number(a) - Number(b));
}

/**
 * O `DOCS` DO MANIFESTO, CRESCIDO PELAS AULAS QUE O PLANO DECLARA (21/11/2026).
 *
 * O DEFEITO, medido duas vezes no mesmo dia — e a segunda é a que interessa: a lista de
 * documentos crescia num caminho de escrita (`atualizarManifesto`) e **não** no outro
 * (`comporManifestoDaTurma`, que é o caminho normal de uma escola com a turma cadastrada). Com a
 * turma no contexto, o manifesto era COMPOSTO e o `DOCS` era **preservado** como estava — de modo
 * que a Aula 02, criada pelo calendário, entrava no envelope e não entrava no pacote. Ela viu
 * exactamente isso: «a aula dois ainda está com o botão criar aula, ele não se transformou em
 * abrir. E lá em aulas também eu não tenho como acessar a aula dois.»
 *
 * A REGRA É DERIVADA, e não pedida a ninguém: a aula existe quando o plano declara a sequência
 * dela. Quem cria a aula (o diálogo do calendário) não tem de se lembrar de mexer numa lista — e
 * é bom que não tenha, porque uma lista à mão diverge em silêncio.
 *
 * A LISTA SÓ CRESCE. O que o manifesto já declara fica onde está; a aula nova entra na posição da
 * família — depois da última aula, antes da captura dela. Nenhuma aula sai por esta via, e sem
 * `plano` a lista volta como veio.
 */
function docsComAsAulas(docs, plano) {
  const atuais = String(docs == null ? '' : docs).trim().split(/\s+/).filter(Boolean);
  const lista = atuais.length ? atuais.slice() : ['plano'];
  if (!plano) return lista;
  const declaradas = aulasDeclaradasPeloPlano(plano);
  const faltam = [];
  for (const nn of declaradas) {
    if (lista.indexOf('aula-' + nn) === -1) faltam.push('aula-' + nn);
    if (lista.indexOf('captura-aula-' + nn) === -1) faltam.push('captura-aula-' + nn);
  }
  if (!faltam.length) return lista;
  /* A FAMÍLIA É REESCOLhIDA, e não remendada. Inserir a aula nova antes da primeira captura que
     já exista dá `aula-01 aula-02 captura-aula-02 captura-aula-01` — funcional, e com a captura da
     Aula 01 a fechar a família da 02. A ordem do gerador é plano · harmonização · (aula, captura)
     por aula · notação · glossário · referências, e é essa que sai daqui: a família inteira é
     removida e reposta em ordem numérica, no lugar da primeira aula. */
  const ehDaFamilia = (d) => /^(captura-)?aula-\d+$/.test(d);
  const fora = lista.filter((d) => !ehDaFamilia(d));
  const aulas = new Set(declaradas);
  for (const d of lista) {
    const m = /^(captura-)?aula-(\d+)$/.exec(d);
    if (m) { const nn = numeroDaAula(m[2]); if (nn) aulas.add(nn); }
  }
  const familia = [];
  for (const nn of [...aulas].sort((a, b) => Number(a) - Number(b))) {
    familia.push('aula-' + nn, 'captura-aula-' + nn);
  }
  const ancora = lista.findIndex((d) => /^aula-\d+$/.test(d));
  const onde = ancora === -1
    ? fora.findIndex((d) => /^captura-aula-\d+$/.test(d))
    : fora.filter((d) => lista.indexOf(d) < ancora).length;
  const ondeCerto = onde === -1 ? fora.length : onde;
  return fora.slice(0, ondeCerto).concat(familia, fora.slice(ondeCerto));
}

/** As que podem — na ordem em que foram declaradas, sem repetir. */
function aulasRegeneraveis(declaradas, lancadas) {
  const vistas = new Set();
  const saida = [];
  for (const nn of (Array.isArray(declaradas) ? declaradas : [])) {
    const numero = numeroDaAula(nn);
    if (!numero || vistas.has(numero)) continue;
    vistas.add(numero);
    if (podeRegenerar(numero, lancadas)) saida.push(numero);
  }
  return saida;
}

module.exports = {
  numeroDaAula, aulasLancadas, podeRegenerar, aulasRegeneraveis,
  chaveDaAula, aulaSeguinte, aulasDeclaradasPeloPlano,
  lerChaveDaAula, CAMPOS_DA_AULA, docsComAsAulas,
};
