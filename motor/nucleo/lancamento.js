'use strict';

/**
 * lancamento.js — o lançamento da aula (`POST /api/receber`), portado de
 * `workers/receber.js` para o núcleo agnóstico.
 *
 * O contrato vem do formulário (`tools/templates/lancamento.html`): UM POST com
 * `{ ciclo, senha, arquivos: [{ nome, texto, tipo }] }` — os dados do ciclo primeiro, o
 * índice (`ciclos.json`) por último. O TEXTO DOS DADOS É JSON EM CLARO: o cliente recebe o
 * conteúdo do Worker já decifrado e envia o resultado, não o `_cifrado`.
 *
 * DUAS COISAS QUE ELE NÃO FAZ, E POR QUÊ (15/10/2026). Ele não CONFERE a senha e não CIFRA o
 * que grava — as duas foram INJETADAS (`opcoes.autorizar`, `opcoes.cifrar`), porque este módulo
 * é PURO (sem `env`, sem chave, sem rede) e quem tem o segredo é a ponte. Antes disto ele
 * gravava o lançamento em TEXTO PURO no KV sem conferir senha nenhuma: o mesmo dado de aluna
 * que o pacote cifra com cuidado, e uma porta de escrita aberta para quem soubesse o endereço
 * da escola. Sem `autorizar`, o lançamento é RECUSADO — um endpoint de escrita que aceita tudo
 * em silêncio é pior que um endpoint que não existe.
 *
 * A chave monta-se do contexto DERIVADO do índice (professor, escola, ciclo) e
 * do carimbo que o cliente já escreveu no NOME do arquivo — o lançamento não
 * inventa nome nem carimbo (inventar quebraria a monotonicidade que o cliente
 * garante):
 *
 *   <escola>/<professor>/<ciclo>-<carimbo>/<nome-do-arquivo>
 *
 * As funções de chave (`prefixoDaEscola`, `raizDaChave`, `segmento`,
 * `cicloDaChave`) são as MESMAS do cofre — uma escola, uma família de chaves, um
 * lugar só. O módulo é PURO (sem `fs`/`path`/`http`/`env`): recebe o adaptador
 * de armazenamento e o corpo, devolve o que produz. Erros de negócio LANÇAM
 * (`Error` com mensagem), para a rota decidir a recusa — o cliente do lançamento
 * espera `{ ok:false, erro }` com HTTP 200 (nunca 5xx).
 *
 * Uso:
 *   const { lancar } = require('./lancamento.js');
 *   const r = await lancar(armazenamento, { ciclo, senha, arquivos }, { autorizar, cifrar });
 */

const { prefixoDaEscola, raizDaChave, segmento, cicloDaChave } = require('./cofre.js');

const basename = (nome) => String(nome).split(/[\\/]/).pop();

// O NOME DO ARQUIVO DE DADOS TEM DUAS FORMAS, e as duas chegam aqui:
//   ciclo-01-duo-dados.json                   — o pacote recém-gerado, ainda sem lançamento
//   ciclo-01-duo-dados-2026-10-07T1900.json   — o lançamento, com o carimbo do cliente
// O carimbo (`AAAA-MM-DDTHHMM`, hora local, sem segundos) fica ENTRE `dados` e `.json`.
// Ancorar o `.json` no fim (`/-dados\.json$/`) casa a primeira forma e RECUSA a segunda —
// que é a única que o formulário envia.
const RE_DADOS = /-dados(-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4})?\.json$/;

const slugDe = (indice, dados) => {
  const c = (indice && indice.ciclos && indice.ciclos[0]) || {};
  if (c.professor) return String(c.professor);
  if (dados && dados.professor) return String(dados.professor);
  const m = /^ciclo-\d+-([a-z0-9]+)-dados/.exec(basename(c.arquivo || (dados && dados.escola) || ''));
  return (m && m[1]) || null;
};

/**
 * O lançamento inteiro: valida o corpo, deriva a chave e grava os dois arquivos
 * (dados + índice). Devolve `{ ok:true, professor, escola, ciclo, escritos }` ou
 * LANÇA `Error` (mensagem para a recusa).
 */
async function lancar(armazenamento, corpo, opcoes) {
  const { autorizar, cifrar } = opcoes || {};

  // A PORTA FECHADA POR PADRÃO: sem conferência de senha injetada, o lançamento NÃO acontece.
  // A alternativa (aceitar quando ninguém injetou nada) faria de um esquecimento da ponte uma
  // porta de escrita aberta — e um esquecimento silencioso é o defeito que já custou caro aqui.
  if (typeof autorizar !== 'function') {
    throw new Error('o lançamento exige a conferência de senha, e ela não está disponível neste ambiente');
  }
  const senha = String((corpo && corpo.senha) || '');
  if (!senha) throw new Error('informe a sua senha para gravar o lançamento');
  if (!(await autorizar(senha))) throw new Error('senha não reconhecida — o lançamento não foi gravado');

  const arquivos = corpo && Array.isArray(corpo.arquivos) ? corpo.arquivos : null;
  if (!arquivos || !arquivos.length) throw new Error('nenhum arquivo no pedido');

  for (const a of arquivos) {
    if (!a || typeof a.texto !== 'string' || !a.nome) throw new Error('arquivo sem nome ou sem texto');
    try { JSON.parse(a.texto); } catch { throw new Error('o texto de ' + basename(a.nome) + ' nao e JSON'); }
  }

  const dadosDe = arquivos.find((a) => RE_DADOS.test(basename(a.nome)));
  const indiceDe = arquivos.find((a) => basename(a.nome) === 'ciclos.json');
  if (!dadosDe || !indiceDe) throw new Error('faltou o arquivo de dados ou o ciclos.json');

  let dados, indice;
  try {
    dados = JSON.parse(dadosDe.texto);
    indice = JSON.parse(indiceDe.texto);
  } catch { throw new Error('nao consegui ler o JSON'); }

  const professor = slugDe(indice, dados);
  // A ESCOLA DA CHAVE É A DO WORKER, quando ele a declara (18/10/2026). O payload traz a
  // escola do `ciclos.json` do pacote — e o pacote é dado, não autoridade: com o KV
  // COMPARTILHADO entre escolas, uma escola forjada aqui gravava dentro do prefixo de
  // outra. Sem `escola` injetada (o servidor Node de desenvolvimento), vale o payload.
  const escola = String((opcoes && opcoes.escola) || '').trim()
    || (indice.ciclos[0] || {}).escola || dados.escola || 'escola';
  const ciclo = String(corpo.ciclo || (indice.ciclos[0] || {}).id || '01').padStart(2, '0');
  const carimbo = /(\d{4}-\d{2}-\d{2}T\d{4})/.exec(basename(dadosDe.nome));
  const chave = raizDaChave(escola, professor) + '/' + cicloDaChave(ciclo) + '-' +
    (carimbo ? carimbo[1] : basename(dadosDe.nome).replace(/\.json$/, ''));

  // O KV não tem `onlyIfNew` nem transação: a existência é conferida antes de
  // gravar (a janela é a de um duplo clique). `guardar` grava verbatim.
  // CIFRADO NO REPOUSO. Os DOIS arquivos vão cifrados (o lançamento é uma unidade): o de dados
  // traz nome, presença e observação de aluna, e o índice traz a data de cada aula. Sem `cifrar`
  // — escola sem a chave no Worker — o texto vai como veio, e a resposta DIZ isso (`cifrado:
  // false`), porque guardar em claro por falta de chave não pode ser silencioso.
  const comCifra = typeof cifrar === 'function';
  const escritos = [];
  for (const a of [dadosDe, indiceDe]) {
    const alvo = chave + '/' + basename(a.nome);
    if (await armazenamento.existe(alvo)) {
      throw new Error('ja existe um lancamento com este carimbo: ' + a.nome);
    }
    let valor = a.texto;
    if (comCifra) {
      valor = await cifrar(a.texto);
      // A CIFRA DEVOLVE TEXTO, e isto é conferido, não suposto. O KV guarda o que se lhe dá e
      // COAGE o resto: um objeto vira a string `[object Object]` sem erro nenhum — o lançamento
      // sumiria e a gravação diria «ok». Um contrato violado tem de doer agora, não virar
      // registro perdido. (Pego pelo teste em bancada, antes de ir ao ar.)
      if (typeof valor !== 'string') {
        throw new Error('a cifra devolveu ' + (valor === null ? 'null' : typeof valor)
          + ' em vez de texto — o lançamento não foi gravado');
      }
    }
    await armazenamento.guardar(alvo, valor);
    escritos.push(a.nome);
  }

  return { ok: true, professor, escola, ciclo, escritos, cifrado: comCifra };
}

module.exports = { lancar, basename, RE_DADOS, slugDe };
