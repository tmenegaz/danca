'use strict';

/**
 * armazenamento.js — o CONTRATO de armazenamento do núcleo.
 *
 * O núcleo (validar/derivar/elicitar) NÃO lê nem escreve em lugar nenhum: ele
 * recebe o que precisa e devolve o que produz. Quem lê o conteúdo/esquema e
 * persiste o envelope é o ADAPTADOR. Este contrato é o que os adaptadores
 * implementam — e o que torna a troca de provedor uma troca de adaptador, não
 * uma reescrita do motor.
 *
 * Os seis verbos (todos ASSÍNCRONOS — o KV é assíncrono; o fs é promisificado):
 *
 *   ler(chave)         → Promise<string|null>  `null` = chave inexistente
 *   guardar(chave, v)  → Promise<void>         grava o valor sob a chave
 *   anexar(chave, l)   → Promise<void>         acrescenta uma linha ao valor
 *   listar(prefixo)    → Promise<string[]>      nomes completos das chaves
 *   existe(chave)      → Promise<boolean>
 *   apagar(chave)      → Promise<boolean>       remove; `false` se não existia
 *
 * Contrato de erro: chave inexistente em `ler` devolve `null` (nunca lança);
 * falha de infraestrutura (permissão, timeout) LANÇA — o adaptador não esconde
 * a falha atrás de um `null`. `guardar` cria a chave se não existir; `anexar`
 * cria a chave se não existir e concatena a linha. `apagar` é idempotente:
 * apagar o que não existe devolve `false`, não lança.
 *
 * `anexar` existe para o REGISTRO (um log JSONL): o custo da IA é um registo
 * por sessão, acrescentado — nunca sobrescrito. No fs é um `append`; no KV é um
 * ler-modificar-escrever (a chave guarda o JSONL inteiro).
 *
 * A memória abaixo é a implementação de TESTE: determinística, em memória, para
 * as provas correrem sem disco nem rede.
 */

/**
 * Implementação em memória. `estado` é o dicionário inicial (vazio por padrão).
 */
function criarMemoria(estado) {
  const mapa = Object.assign(Object.create(null), estado || {});
  const tem = (chave) => Object.prototype.hasOwnProperty.call(mapa, chave);

  return {
    async ler(chave) {
      return tem(chave) ? mapa[chave] : null;
    },
    async guardar(chave, valor) {
      mapa[chave] = String(valor);
    },
    async anexar(chave, linha) {
      mapa[chave] = (tem(chave) ? mapa[chave] : '') + String(linha);
    },
    async listar(prefixo) {
      return Object.keys(mapa).filter((k) => k.startsWith(prefixo));
    },
    async existe(chave) {
      return tem(chave);
    },
    async apagar(chave) {
      if (!tem(chave)) return false;
      delete mapa[chave];
      return true;
    },
  };
}

module.exports = { criarMemoria };
