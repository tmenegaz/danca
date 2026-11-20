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

  /* AS QUE CUSTARAM UM DEFEITO AO VIVO, cada uma com o estado correcto. */
  provar('a rota do botão está na lista (ela PERCORRE a cadeia)',
    lista.indexOf('/api/bastidores/atualizar-o-ciclo') !== -1, lista);
  provar('a do fecho do pacote está na lista',
    lista.indexOf('/api/bastidores/cadeia-pacote') !== -1, lista);
  /* E A DA JANELA NÃO ESTÁ — e a ausência é uma decisão, não um esquecimento: ela só LÊ o plano, e
   * ler não depende de montar escritores. Foi a confusão entre as duas coisas que produziu o
   * defeito; agora ela não está na lista, e lê por si (ver a secção C). */
  provar('…e a janela do exercício NÃO está: ela lê o plano sozinha',
    lista.indexOf('/api/bastidores/impacto-da-inclusao') === -1, lista);

  // ── B. A PONTE LÊ DA LISTA ────────────────────────────────────────────────
  console.log('\nB. A ponte lê a lista; não tem uma segunda cópia dela');
  provar('`producao.js` usa `ROTAS_QUE_PRECISAM_DA_CADEIA`',
    /ROTAS_QUE_PRECISAM_DA_CADEIA/.test(textoProducao), null);
  /* A CÓPIA ANTIGA NÃO PODE TER VOLTADO. O `const gestos = [` era a segunda lista; se ele reaparecer
   * com caminhos dentro, a divergência volta na primeira rota nova. */
  provar('…e não voltou a montar uma lista própria de caminhos',
    !/const gestos = \[\s*\n\s*'\/api\/bastidores/.test(textoProducao), null);

  // ── C. A JANELA NÃO DEPENDE DA MONTAGEM ───────────────────────────────────
  console.log('\nC. A janela LÊ o plano — não pede a leitura à cadeia');
  const fonteDaRota = (() => {
    const i = textoBastidores.indexOf("if (path === '/api/bastidores/impacto-da-inclusao'");
    return i === -1 ? '' : textoBastidores.slice(i, i + 8000);
  })();
  /* A REGRA QUE FICOU (20/11/2026): quem só lê, lê. A rota pedia o plano à cadeia, e a cadeia só
   * existe quando a ponte a monta — uma leitura que dependia de uma escrita. Uma asserção sobre o
   * TEXTO é o que impede o regresso: se alguém voltar a chamar `cadeia.planoDaTurma` aqui, o
   * defeito volta com ele, e a bancada não o veria (ela injeta a cadeia). */
  provar('a rota NÃO pede o plano à cadeia', !/cadeia\.planoDaTurma/.test(fonteDaRota), null);
  provar('…e lê-o pelo leitor directo', /planoDaTurmaNaSala\(/.test(fonteDaRota), null);
  provar('…e o leitor existe no ficheiro, com a nota de porque é directo',
    /async function planoDaTurmaNaSala\(/.test(textoBastidores)
      && /quem só lê, lê/.test(textoBastidores), null);

  // ── D. O LEITOR DO PLANO ──────────────────────────────────────────────────
  console.log('\nD. O leitor acha o plano da Turma, pela ordem de autoridade');

  (async () => {
    const criarKv = () => {
      const dados = new Map();
      return {
        async get(c) { return dados.has(c) ? dados.get(c) : null; },
        async put(c, v) { dados.set(c, String(v)); },
        async delete(c) { dados.delete(c); },
        async list({ prefix = '' } = {}) {
          return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix))
            .map((name) => ({ name })), list_complete: true };
        },
      };
    };
    const r = (v) => ({ valor: v, origem: 'perguntado', respondente: 'professor', nota: null });
    const envelope = (id, professor) => JSON.stringify({
      id, gerado_em: '2026-11-01T10:00',
      contexto: { escola: 'breu', professor, ciclo: '01', turma: 'Rosa' },
      respostas: {
        'contexto-turma': r('Rosa'),
        'marcos-por-aula': r(['a', 'b']),
        'aula-1-parametro': r([{ marco: 1, marcados: ['Plié'] }]),
        repertorio: r(['Plié']),
      },
    });
    const kv = criarKv();
    /* DOIS PLANOS NA MESMA SALA, de professores diferentes — é o caso em que a ORDEM decide, e é
     * o caso real da `breu` numa troca de direção. */
    await kv.put('breu/envelope/plano-20261101-1000.json', envelope('plano-20261101-1000', 'antigo'));
    await kv.put('breu/envelope/plano-20261110-1000.json', envelope('plano-20261110-1000', 'demi-plie'));
    /* O ÍNDICE, como o acervo o guarda — sem ele a leitura depende de uma enumeração, e a bancada
     * mediria um caminho que a produção não usa. */
    await kv.put('breu/envelope/.indice.json', JSON.stringify({
      nomes: ['plano-20261101-1000.json', 'plano-20261110-1000.json'],
      resumos: {},
    }));
    const env = { ESCOLA_SLUG: 'breu', PADD_KV: kv };

    const doProfessorDaSala = await bastidores.planoDaTurmaNaSala(env, 'breu', 'Rosa', ['demi-plie', 'antigo']);
    provar('acha o plano do professor da SALA, e não o primeiro da lista',
      doProfessorDaSala.plano && String(doProfessorDaSala.plano.id) === 'plano-20261110-1000',
      doProfessorDaSala.plano && doProfessorDaSala.plano.id);

    const semNinguem = await bastidores.planoDaTurmaNaSala(env, 'breu', 'Rosa', ['ninguem']);
    provar('…e não devolve o plano de outro professor quando o pedido é de um terceiro',
      semNinguem.plano === null && semNinguem.houve === true, semNinguem);

    const outraSala = await bastidores.planoDaTurmaNaSala(env, 'breu', 'Outra', ['demi-plie']);
    provar('…e diz que NÃO HÁ plano quando a sala não tem nenhum',
      outraSala.plano === null && outraSala.houve === false && outraSala.leu === true, outraSala);

    console.log('\n' + (falhas === 0 ? 'TUDO CERTO' : 'FALHOU') + ' — ' + n + ' asserções: a lista '
    + 'que faz a ponte montar a cadeia confere com as rotas que a usam e é uma só; e a janela do '
      + 'exercício não depende dessa montagem — ela só lê, e quem só lê, lê.');
    process.exit(falhas === 0 ? 0 : 1);
  })();
})();
