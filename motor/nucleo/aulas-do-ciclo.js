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
};
