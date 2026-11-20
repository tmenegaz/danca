#!/usr/bin/env node
'use strict';

/*
 * provar-as-rotas-da-cadeia.js — A LISTA QUE MONTA A CADEIA COBRE QUEM A USA (20/11/2026).
 *
 * PORQUE ESTA PROVA EXISTE, e não é cobertura. A ponte (`motor/servidor/producao.js`) monta a
 * cadeia automática só para as rotas de uma lista; em qualquer outra ela é `null`. Duas rotas
 * ficaram fora dessa lista e falharam AO VIVO, as duas com o mesmo sintoma e o mesmo custo:
 *
 *   1. `turma-professor` (19/11/2026) — respondia «a cadeia não está montada neste Worker» sobre
 *      uma troca de professor que a ponte nunca ia montar.
 *   2. `impacto-da-inclusao` (20/11/2026) — respondia «não consegui ler o plano de ensino» sobre
 *      uma Turma que o tinha. A frase mandou a pesquisadora procurar o problema no acervo; o
 *      problema era a lista. Ela gravou, e o exercício entrou sem objetivo.
 *
 * E NENHUMA BANCADA VIA ISTO, porque as provas INJETAM a cadeia (`montar({ cadeia })`). A montagem
 * é a única coisa que só existe no Worker — e é exactamente por isso que ela precisa de uma prova
 * que não injete nada: uma prova estática, sobre o encadeamento entre os dois ficheiros.
 *
 * O QUE SE MEDE, e cada alínea é um defeito possível:
 *
 *   A. A LISTA CONFERE COM O USO. Toda rota de `bastidores.js` cujo corpo toca `cadeia` ou
 *      `rodarCadeia` está em `ROTAS_QUE_PRECISAM_DA_CADEIA` — e nenhuma outra está.
 *   B. A PONTE LÊ DA LISTA. `producao.js` não tem uma segunda cópia; ele importa a constante.
 *   C. A ROTA RESPONDE HONESTO. Sem cadeia, `impacto-da-inclusao` diz `sem-cadeia` — e não
 *      «não consegui ler o plano», que aponta para o sítio errado.
 *
 *   node experimentos/provar-as-rotas-da-cadeia.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const FICHEIRO_BASTIDORES = path.join(RAIZ, 'motor/servidor/bastidores.js');
const FICHEIRO_PRODUCAO = path.join(RAIZ, 'motor/servidor/producao.js');
const bastidores = require(FICHEIRO_BASTIDORES);

let n = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  n += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + rotulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

/**
 * AS ROTAS QUE USAM A CADEIA, lidas do CÓDIGO e não da lista.
 *
 * O CORPO de uma rota vai do seu `if (path === …)` até ao `if (path === …)` seguinte — é a forma
 * que este ficheiro usa desde sempre, e é o que torna a leitura possível sem um parser. Procurar
 * `cadeia` no ficheiro inteiro daria tudo: a variável é citada em comentários e no mapa do véu.
 */
function rotasQueUsamACadeia(texto) {
  const linhas = texto.split('\n');
  const marcas = [];
  for (let i = 0; i < linhas.length; i++) {
    const m = /^  if \(path === '(\/api\/bastidores\/[^']+)'/.exec(linhas[i]);
    if (m) marcas.push({ linha: i, rota: m[1] });
  }
  const achadas = [];
  for (let k = 0; k < marcas.length; k++) {
    const inicio = marcas[k].linha;
    const fim = k + 1 < marcas.length ? marcas[k + 1].linha : linhas.length;
    const corpo = linhas.slice(inicio, fim).join('\n');
    /* `rodarCadeia(` é o gesto; `cadeia.planoDaTurma` é a leitura que a janela faz; `cadeia.executar`
     * é o botão. `cadeia` sozinho apanharia `nucleoCadeia` — e é por isso que se procura o uso, e
     * não a palavra. */
    if (/\brodarCadeia\(|\bcadeia\.(planoDaTurma|executar|fecharPacotes)\b/.test(corpo)) {
      if (achadas.indexOf(marcas[k].rota) === -1) achadas.push(marcas[k].rota);
    }
  }
  return achadas;
}

(function principal() {
  const textoBastidores = fs.readFileSync(FICHEIRO_BASTIDORES, 'utf8');
  const textoProducao = fs.readFileSync(FICHEIRO_PRODUCAO, 'utf8');
  const lista = bastidores.ROTAS_QUE_PRECISAM_DA_CADEIA;
  const usam = rotasQueUsamACadeia(textoBastidores);

  // ── A. A LISTA CONFERE COM O USO ──────────────────────────────────────────
  console.log('\nA. Toda rota que usa a cadeia está na lista — e a lista não tem sobras');
  provar('a lista é uma lista de caminhos', Array.isArray(lista) && lista.length > 0,
    typeof lista);

  const foraDaLista = usam.filter((r) => lista.indexOf(r) === -1);
  provar('nenhuma rota que usa a cadeia ficou fora da lista', foraDaLista.length === 0, foraDaLista);

  /* AS SOBRAS TAMBÉM CONTAM. Uma rota na lista que já não usa a cadeia paga a montagem por nada —
   * e, pior, esconde que o uso desapareceu. A lista é uma afirmação sobre o presente. */
  const vazias = lista.filter((r) => usam.indexOf(r) === -1);
  provar('…e nenhuma rota da lista deixou de a usar', vazias.length === 0, vazias);

  /* AS TRÊS QUE CUSTARAM UM DEFEITO AO VIVO. Nomeadas uma a uma para que a regressão tenha nome:
   * a da janela (a que a pesquisadora viu falhar), o botão novo, e o fecho do pacote. */
  for (const rota of ['/api/bastidores/impacto-da-inclusao',
    '/api/bastidores/atualizar-o-ciclo',
    '/api/bastidores/cadeia-pacote']) {
    provar('a rota ' + rota + ' está na lista', lista.indexOf(rota) !== -1, lista);
  }

  // ── B. A PONTE LÊ DA LISTA ────────────────────────────────────────────────
  console.log('\nB. A ponte lê a lista; não tem uma segunda cópia dela');
  provar('`producao.js` usa `ROTAS_QUE_PRECISAM_DA_CADEIA`',
    /ROTAS_QUE_PRECISAM_DA_CADEIA/.test(textoProducao), null);
  /* A CÓPIA ANTIGA NÃO PODE TER VOLTADO. O `const gestos = [` era a segunda lista; se ele reaparecer
   * com caminhos dentro, a divergência volta na primeira rota nova. */
  provar('…e não voltou a montar uma lista própria de caminhos',
    !/const gestos = \[\s*\n\s*'\/api\/bastidores/.test(textoProducao), null);

  // ── C. A ROTA RESPONDE HONESTO ────────────────────────────────────────────
  console.log('\nC. Sem cadeia, a janela diz «sem-cadeia» — e não acusa o acervo');
  const fonteDaRota = (() => {
    const i = textoBastidores.indexOf("if (path === '/api/bastidores/impacto-da-inclusao'");
    return i === -1 ? '' : textoBastidores.slice(i, i + 6000);
  })();
  provar('a rota nomeia o motivo `sem-cadeia`', /motivo: 'sem-cadeia'/.test(fonteDaRota), null);
  provar('…e a frase diz que é a montagem, e não o plano',
    /a cadeia automática não está montada neste pedido/.test(fonteDaRota), null);

  console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + n + ' asserções: a lista '
    + 'que faz a ponte montar a cadeia confere com as rotas que a usam, é uma só, e a rota da '
    + 'janela nomeia a montagem quando ela falta — em vez de acusar o acervo.');
  process.exit(falhas === 0 ? 0 : 1);
})();
