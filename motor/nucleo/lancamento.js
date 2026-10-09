'use strict';

/**
 * lancamento.js — o lançamento da aula (`POST /api/receber`), portado de
 * `workers/receber.js` para o núcleo agnóstico.
 *
 * O contrato vem do formulário (`tools/templates/lancamento.html`): UM POST com
 * `{ ciclo, arquivos: [{ nome, texto, tipo }] }` — os dados do ciclo primeiro, o
 * índice (`ciclos.json`) por último. O TEXTO DOS DADOS É JSON EM CLARO: o
 * cliente decifra o envelope com a senha da escola e envia o resultado, não o
 * `_cifrado`. O lançamento trata o texto como OPACO e grava verbatim — não
 * cifra, não decifra e não tem a senha.
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
 *   const r = await lancar(armazenamento, { ciclo, arquivos }); // { ok:true, … }
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
async function lancar(armazenamento, corpo) {
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
  const escola = (indice.ciclos[0] || {}).escola || dados.escola || 'escola';
  const ciclo = String(corpo.ciclo || (indice.ciclos[0] || {}).id || '01').padStart(2, '0');
  const carimbo = /(\d{4}-\d{2}-\d{2}T\d{4})/.exec(basename(dadosDe.nome));
  const chave = raizDaChave(escola, professor) + '/' + cicloDaChave(ciclo) + '-' +
    (carimbo ? carimbo[1] : basename(dadosDe.nome).replace(/\.json$/, ''));

  // O KV não tem `onlyIfNew` nem transação: a existência é conferida antes de
  // gravar (a janela é a de um duplo clique). `guardar` grava verbatim.
  const escritos = [];
  for (const a of [dadosDe, indiceDe]) {
    const alvo = chave + '/' + basename(a.nome);
    if (await armazenamento.existe(alvo)) {
      throw new Error('ja existe um lancamento com este carimbo: ' + a.nome);
    }
    await armazenamento.guardar(alvo, a.texto);
    escritos.push(a.nome);
  }

  return { ok: true, professor, escola, ciclo, escritos };
}

module.exports = { lancar, basename, RE_DADOS, slugDe };
