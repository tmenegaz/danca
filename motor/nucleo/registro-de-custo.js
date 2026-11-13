'use strict';

/**
 * registro-de-custo.js — ONDE CAI A LINHA DE CUSTO DA IA, e por que ela tem mês no nome.
 *
 * O QUE MUDOU (13/11/2026). O registo era **uma chave só** — `ia-registro/registro.jsonl` —, e
 * uma chave só é um ficheiro que cresce para sempre. Com o KV isso não é um pormenor:
 *
 *   · **o `anexar` do KV é ler-modificar-escrever** (o KV não tem append; ver
 *     `motor/adaptadores/cloudflare.js`). Cada linha nova lê o ficheiro INTEIRO e reescreve-o
 *     inteiro — o custo da escrita cresce com o histórico, e o valor tem um tecto de 25 MiB
 *     por chave, que não avisa: um dia o `put` recusa;
 *   · **uma chave de 25 MiB é uma leitura de 25 MiB** para qualquer leitor futuro (o catálogo
 *     GE06/GE10, o painel de custo) que queira uma linha do mês passado.
 *
 * O que se parte é o ficheiro, não a linha: a linha continua a ter exatamente os mesmos campos
 * que o `ARQUITETURA-AGENTE.md` desenha. Um mês, um ficheiro — quem pergunta «quanto gastámos em
 * outubro?» pede `ia-registro/2026-10.jsonl` e não precisa de ler novembro nem dezembro.
 *
 * A CHAVE NÃO É SÓ DO STUB. O `POST /api/ia` (legado) escreve por aqui, e o agente do Lastro
 * escreve pela mesma função — o passo 4 do fluxo dele é «uma linha em `ia-registro/…`». Duas
 * derivações da mesma chave divergiriam ao primeiro mês, e o sintoma seria um log partido em dois
 * sítios que ninguém notaria até precisar dele.
 *
 * O CARIMBO VEM DE FORA, e não de um `new Date()` daqui: a casa carimba no fuso da ESCOLA
 * (`America/Sao_Paulo`), e uma chave derivada em UTC poria as linhas das 22h de 31 de outubro no
 * ficheiro de novembro.
 */

/** O prefixo lógico. O adaptador do Worker põe-lhe a escola à frente (`<escola>/ia-registro/…`),
 *  e é por isso que este módulo NÃO sabe de escolas: a chave que ele devolve é a lógica. */
const PREFIXO = 'ia-registro/';

const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * O mês de um carimbo (`AAAA-MM-DDTHH:MM`) — ou de um `Date`, ou de um `AAAA-MM`.
 *
 * Lança com o que não dá para interpretar. Um registo de custo que caísse numa chave inventada
 * (ou em `ia-registro/undefined.jsonl`) seria pior do que uma exceção: o auditor de custo do mês
 * seguinte encontraria um ficheiro com nome de bug e nenhuma linha dele.
 */
function mesDoCarimbo(carimbo) {
  if (carimbo instanceof Date) {
    if (Number.isNaN(carimbo.getTime())) throw new Error('carimbo de custo: data inválida');
    const mes = String(carimbo.getUTCMonth() + 1).padStart(2, '0');
    return carimbo.getUTCFullYear() + '-' + mes;
  }
  const texto = String(carimbo || '').trim();
  if (MES_VALIDO.test(texto)) return texto;
  const mes = texto.slice(0, 7);
  if (MES_VALIDO.test(mes)) return mes;
  throw new Error('carimbo de custo sem mês legível: ' + JSON.stringify(carimbo));
}

/** A chave do mês de um carimbo. É ESTA a função que escreve e que lê. */
function chaveDoMes(carimbo) {
  return PREFIXO + mesDoCarimbo(carimbo) + '.jsonl';
}

/** Todas as chaves entre dois meses, inclusive — para um leitor de período não varrer o prefixo. */
function chavesDoPeriodo(de, ate) {
  const inicio = mesDoCarimbo(de);
  const fim = mesDoCarimbo(ate);
  const chaves = [];
  let [ano, mes] = inicio.split('-').map(Number);
  for (;;) {
    const m = ano + '-' + String(mes).padStart(2, '0');
    chaves.push(PREFIXO + m + '.jsonl');
    if (m === fim) break;
    mes += 1;
    if (mes > 12) { mes = 1; ano += 1; }
    /* A TRAVA DO DESESPERO. Um período invertido (ou um ano com typo) faria este laço correr até
     * à memória acabar — dentro de um Worker, que tem 128 MB e devolve 1102 sem dizer por quê. */
    if (chaves.length > 1200) throw new Error('período de custo absurdo: ' + inicio + ' a ' + fim);
  }
  return chaves;
}

module.exports = { PREFIXO, mesDoCarimbo, chaveDoMes, chavesDoPeriodo };
