'use strict';

/**
 * schemas.js — OS CINCO SCHEMAS DO CICLO, num sítio só.
 *
 * **O defeito que isto fecha (01/11/2026).** O molde `modelo/ciclos/ciclo-01-*.json` era lido por
 * duas portas, e cada uma sabia dele à sua maneira: o `tools/criar-escola.sh` copiava cinco
 * ficheiros com `cp`, e o `motor/servidor/schemas-do-ciclo.js` ia buscá-los por HTTP ao Contents
 * API, um `GET` por schema, montando o caminho à mão. Duas maneiras de ler a mesma coisa são duas
 * coisas: quando o molde ficou atrás dos professores (26/10/2026 → 01/11/2026), nada avisou, e a
 * geração de um ciclo morreu em «campo ausente» — com o PO já validado.
 *
 * **O que mudou.** As duas portas passam a chamar ESTE módulo. O `criar-escola.sh` escreve a
 * partir de `texto()` (via `tools/gerar-schemas.js`), e o provisionador do Worker escreve a partir
 * do mesmo `texto()` — sem rede para ler o molde, e sem uma segunda cópia do caminho. O molde
 * continua a ser o ficheiro que se lê, se revê e se versiona; o que deixou de existir é a segunda
 * maneira de o ler.
 *
 * **O `require` É LITERAL, e tem de ser.** Este módulo é empacotado para o Worker, e o empacotador
 * não segue um caminho montado em tempo de execução — é a mesma regra (e o mesmo comentário) de
 * `notacao.js`, com os alfabetos das modalidades. Uma lista de cinco sufixos com um `require`
 * dentro de um ciclo funcionaria no Node e falharia no Worker, sem aviso em tempo de escrita.
 *
 * **O CONTEÚDO É O CONTRATO, NÃO O ESPAÇAMENTO.** `dados()` devolve o objeto, e é por ele que se
 * compara (é o que `tools/check-schemas.js` faz): um schema indentado de outra maneira diz
 * exactamente a mesma coisa, e recusá-lo seria recusar formatação. `texto()` devolve a forma
 * canónica — a que se ESCREVE num ficheiro novo, para que dois professores provisionados em
 * momentos diferentes nasçam iguais.
 *
 * **O MOLDE NÃO LEVA O NÚMERO DO CICLO.** O conteúdo é genérico (é o que o `criar-escola.sh`
 * sempre disse: «os schemas são do ciclo, genéricos»); o número entra só no NOME do destino, e é
 * por isso que `nomeDoArquivo()` o recebe e o molde não.
 */

/**
 * Os cinco schemas do domínio, na ordem em que `tools/criar-escola.sh` e o provisionador do
 * Worker os escrevem. A lista vivia em TRÊS sítios (o bash, o provisionador e a checagem) — e uma
 * lista em três sítios é uma lista que diverge: agora há esta.
 */
const SUFIXOS = ['schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema'];

/** O ciclo do MOLDE. Fixo: o conteúdo dos schemas não muda com o número do ciclo. */
const CICLO_BASE = '01';

// Os cinco, por `require` literal (ver o cabeçalho). A chave é o SUFIXO, e é ela que o resto do
// sistema usa — não o caminho do ficheiro.
const MOLDES = {
  'schema': require('../../modelo/ciclos/ciclo-01-schema.json'),
  'po-schema': require('../../modelo/ciclos/ciclo-01-po-schema.json'),
  'plano-schema': require('../../modelo/ciclos/ciclo-01-plano-schema.json'),
  'aula-schema': require('../../modelo/ciclos/ciclo-01-aula-schema.json'),
  'captura-schema': require('../../modelo/ciclos/ciclo-01-captura-schema.json'),
};

/** O schema, como objeto. Lança quando o sufixo não é um dos cinco — um nome errado é erro de
 *  quem chama, e devolver `undefined` transformaria o erro num ficheiro vazio. */
function dados(sufixo) {
  const chave = String(sufixo == null ? '' : sufixo).trim();
  if (!Object.prototype.hasOwnProperty.call(MOLDES, chave)) {
    throw new Error('schema desconhecido: «' + chave + '» — os cinco são ' + SUFIXOS.join(' · '));
  }
  return MOLDES[chave];
}

/**
 * O schema como TEXTO canónico — dois espaços, uma chave por linha, e o `\n` final.
 *
 * É esta a forma que se grava. Não é a única forma correcta de escrever o mesmo JSON, e é de
 * propósito que a comparação entre ficheiros NÃO seja feita por bytes (ver `check-schemas.js`):
 * o que tem de coincidir é o conteúdo. O texto existe para os dois escritores produzirem o mesmo
 * ficheiro, e não para definir o que é «igual».
 */
function texto(sufixo) {
  return JSON.stringify(dados(sufixo), null, 2) + '\n';
}

/** O nome do ficheiro de um schema num ciclo: `ciclo-<NN>-<sufixo>.json`. */
function nomeDoArquivo(sufixo, ciclo) {
  const nn = String(ciclo == null ? '' : ciclo).trim().padStart(2, '0');
  if (!nn || !/^\d+$/.test(nn)) throw new Error('ciclo inválido: «' + (ciclo == null ? '' : ciclo) + '»');
  return 'ciclo-' + nn + '-' + String(sufixo) + '.json';
}

module.exports = { SUFIXOS, CICLO_BASE, dados, texto, nomeDoArquivo };
