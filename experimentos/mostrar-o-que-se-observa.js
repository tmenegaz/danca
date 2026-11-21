#!/usr/bin/env node
'use strict';

/**
 * mostrar-o-que-se-observa.js — O QUE SE ESPERA ENCONTRAR, por aspecto, para a turma de hoje.
 *
 * ELA PEDIU, a 21/11/2026: «mostra para mim lá no experimento o que é que você espera encontrar da
 * anamnese para cada um desses tópicos que são mostrados nas dimensões observadas». E disse o que
 * espera do produto, que muda o sítio de cada coisa: «Eu não espero que os resultados estejam aqui
 * no plano de observação. O plano de observação é exatamente o que está aqui [as dimensões]. […]
 * Eu espero é que lá nos resultados da aula, na coluna o que se observa, é que tenha o resultado
 * da primeira posição de pés, primeira posição de braços, que são obtidos lá na anamnese.»
 *
 * O QUE ESTE FICHEIRO FAZ. Lê o acervo AO VIVO — o recorte do elenco que a Turma lê (para saber
 * QUAIS aspectos), as anamneses das alunas dessa turma (para saber O QUE foi registado), e o
 * conteúdo da anamnese (para saber as OPÇÕES e o melhor nível de cada aspecto). Depois corre a
 * leitura do projeto (`classificar`) e imprime, aspecto a aspecto:
 *
 *   · o que cada aluna registou — o nível E o apoio, que são as duas etapas;
 *   · a frase que a AULA vai imprimir na coluna «o que se observa»;
 *   · e o que falta, quando falta.
 *
 * NÃO ESCREVE NADA EM SÍTIO NENHUM: só `GET`. Não grava resposta nenhuma no repositório — os
 * valores aparecem na consola e não ficam em ficheiro (os apelidos são estáveis, mas uma saída
 * versionada com o retrato do corpo de uma turma é outra coisa, e não é o que se quer).
 *
 *   node experimentos/mostrar-o-que-se-observa.js [--escola=breu] [--turma=Rosa] [--professor=demi-plie]
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

const argumento = (nome, omissao) => {
  const achado = process.argv.find((a) => a.indexOf('--' + nome + '=') === 0);
  return achado ? achado.split('=').slice(1).join('=') : omissao;
};
const ESCOLA = argumento('escola', 'breu');
const TURMA = argumento('turma', 'Rosa');
const PROFESSOR = argumento('professor', 'demi-plie');
const BASE = argumento('base', 'https://' + ESCOLA + '.padd.com.br');

const lb = require(path.join(RAIZ, 'motor/nucleo/linha-de-base.js'));
const CONTEUDO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'porta/conteudo/anamnese.json'), 'utf8'));
const CAMPOS = lb.camposDisponiveis(CONTEUDO);

/* ONDE A ROTA MORA. Os dois mundos do Worker não estão montados no mesmo sítio, e isto não é
 * detalhe de gosto: as rotas dos BASTIDORES respondem na raiz (`/api/bastidores/…`), e as da PORTA
 * — que são as que a página serve a partir do pacote — respondem debaixo de um prefixo de pacote
 * (`/plano-observacao/api/…`). Medido com `curl` em 21/11/2026: `/api/mapa` → 404,
 * `/plano-observacao/api/mapa` → 200. Um 404 na raiz, aqui, faria este experimento dizer «não há
 * anamnese» sobre um acervo cheio — a mesma mentira que ele existe para desfazer. */
const PREFIXOS = ['', '/plano-observacao'];
const pegar = async (caminho) => {
  const tentados = [];
  for (const prefixo of PREFIXOS) {
    const r = await fetch(BASE + prefixo + caminho);
    if (r.ok) return r.json();
    tentados.push(prefixo + caminho + ' → ' + r.status);
    if (r.status !== 404) throw new Error('GET ' + prefixo + caminho + ' → ' + r.status);
  }
  throw new Error('GET ' + caminho + ' — ' + tentados.join(' · '));
};

/* A largura das colunas acompanha o conteúdo? Não: a tabela tem de caber numa consola de 100
 * colunas, e um `1 de 2 em «precisa desenvolver» (por consciência própria)` não cabe numa célula.
 * A frase vai INTEIRA numa linha própria, dentro do bloco do aspecto — que é como se lê. */
const RISCO = '─';

async function principal() {
  console.log('\nO QUE SE ESPERA ENCONTRAR — ' + ESCOLA + ' · turma «' + TURMA + '»');
  console.log('Lido ao vivo de ' + BASE + ', sem escrever nada.\n');

  /* 1. O RECORTE — quais aspectos esta turma observa. É o que o PO mostra nas «dimensões». */
  const daTurma = await pegar('/api/bastidores/alunas-da-turma?turma=' + encodeURIComponent(TURMA));
  const recorte = Array.isArray(daTurma.recorte) ? daTurma.recorte : [];
  const elenco = daTurma.linhaDeBase || null;
  if (!recorte.length) {
    console.log('Esta turma não tem recorte — sem ele não há dimensões a observar.');
    return;
  }
  console.log('O elenco da turma é «' + ((elenco && (elenco.nome || elenco.id)) || '(nenhum)') + '», com '
    + recorte.length + (recorte.length === 1 ? ' aspecto' : ' aspectos') + ' no recorte.');
  /* A LISTA DE ALUNAS DA LEITURA PODE VIR REPETIDA — um envelope antigo, sem `alunaId`, conta como
   * outra pessoa (ver o defeito no `bastidores.js`). Aqui mostra-se sem repetições, e diz-se que a
   * lista veio repetida: é o sintoma que faz o «Gravar» deitar a leitura fora. */
  const nomesDaLeitura = daTurma.leitura && Array.isArray(daTurma.leitura.alunas)
    ? daTurma.leitura.alunas : [];
  const unicos = [...new Set(nomesDaLeitura)];
  console.log('A leitura das anamneses está ' + (daTurma.leitura ? 'FEITA' : 'POR FAZER')
    + (unicos.length ? ' (de ' + unicos.join(', ') + ')' : '')
    + (nomesDaLeitura.length > unicos.length
      ? '  ← a lista veio com ' + nomesDaLeitura.length + ' nomes para ' + unicos.length
        + ' pessoas: é este o defeito que faz o «Gravar» descartar a leitura'
      : '') + '.\n');

  /* 2. AS ANAMNESES — quais são, e de quem. O Worker devolve-as ABERTAS pela mesma chave que usa
   * para gerar os documentos; aqui não se decifra nada por conta própria. */
  const lista = await pegar('/api/anamneses?professor=' + encodeURIComponent(PROFESSOR)
    + '&escola=' + encodeURIComponent(ESCOLA) + '&ciclo=01');
  const opcoes = Array.isArray(lista.opcoes) ? lista.opcoes : [];
  const porAluna = new Map();
  for (const o of opcoes) {
    /* A OPÇÃO CHAMA-SE `valor` NESTA ROTA — é o `<option>` do `<select>` da anamnese, e o apelido
     * viaja como valor dele. Lido de lá em 21/11/2026; um `o.aluna` que não existe faria a lista
     * sair vazia sem erro nenhum. */
    const aluna = o && (o.aluna || o.valor);
    if (!aluna || !o.carimbo) continue;
    const atual = porAluna.get(aluna);
    if (!atual || String(o.carimbo) > String(atual.carimbo)) porAluna.set(aluna, o);
  }
  if (!porAluna.size) {
    console.log('Não há anamnese registada para este professor — é dela que saem os valores.');
    return;
  }
  const respostas = new Map();
  for (const [aluna, o] of porAluna) {
    const envelope = await pegar('/api/envelope/' + encodeURIComponent(o.carimbo));
    respostas.set(aluna, (envelope && envelope.respostas) || {});
  }
  const alunas = [...respostas.keys()];
  console.log('As anamneses, a mais recente de cada apelido: ' + alunas.map((a) => a + ' ('
    + String(porAluna.get(a).carimbo).replace(/^anamnese-/, '') + ')').join(' · ') + '\n');

  /* 3. A LEITURA, com a função do projeto — não com uma segunda regra escrita aqui. */
  const classificacao = lb.classificar(CAMPOS, alunas.map((a) => ({ aluna: a, respostas: respostas.get(a) })));
  const achado = new Map();
  for (const chave of ['atencao', 'excelencia', 'comuns', 'musicalidade']) {
    for (const item of classificacao[chave] || []) {
      if (!achado.has(item.id)) achado.set(item.id, { lista: chave, item });
    }
  }

  /* 4. A TABELA — aspecto, o que cada aluna registou, e a frase que a aula vai imprimir. */
  console.log(RISCO.repeat(100));
  for (const campo of recorte) {
    const id = String(campo.id || '');
    const nome = String(campo.nome || id);
    const grupo = String(campo.grupo || '');
    console.log('\n' + nome + (grupo ? '   · ' + grupo : ''));
    for (const aluna of alunas) {
      const cru = respostas.get(aluna)[id];
      const lido = nivelDaAnamnese(cru);
      console.log('   ' + aluna.padEnd(10) + (lido === null
        ? '(sem resposta neste aspecto)'
        : (lido.nivel ? lido.nivel + (lido.apoio ? '  ·  ' + lido.apoio : '') : '(só nota)')
          + (lido.nota ? '  ·  nota: «' + lido.nota + '»' : '')));
    }
    const e = achado.get(id);
    console.log('   → a aula diz: ' + (e ? '«' + e.item.texto + '»' : 'nada — este aspecto não entrou na leitura'));
  }
  console.log('\n' + RISCO.repeat(100));
  console.log('Resumo da leitura: ' + (classificacao.atencao || []).length + ' aspecto(s) com o que precisa de '
    + 'ser trabalhado, ' + (classificacao.excelencia || []).length + ' com o que já é bom, '
    + (classificacao.musicalidade || []).length + ' no eixo da musicalidade, '
    + (classificacao.comuns || []).length + ' em comum nas duas, e '
    + (classificacao.semRegisto || []).length + ' sem registo.');
  console.log('(Um aspecto pode estar em mais de uma lista — «em comum» e «já é bom» não se excluem.)\n');
}

/**
 * O que UMA resposta diz, lido nas três partes que a anamnese guarda: o `valor` — que pode ser
 * `[nível, apoio]`, só um dos dois, ou um texto — e a `nota` que o professor escreveu.
 *
 * A leitura do projeto faz isto em `nivelDaResposta`; aqui repete-se o MÍNIMO para a tabela poder
 * mostrar o nível e o apoio SEPARADOS (a frase da aula junta-os, e é isso que se quer lá). Não é
 * uma segunda regra de classificação: é a mesma matéria, apresentada a duas colunas.
 */
function nivelDaAnamnese(cru) {
  if (cru === undefined || cru === null) return null;
  const valor = cru && typeof cru === 'object' && !Array.isArray(cru) ? cru.valor : cru;
  const nota = cru && typeof cru === 'object' && !Array.isArray(cru) ? cru.nota : null;
  if (valor === null || valor === undefined) return { nivel: null, apoio: null, nota: nota || null };
  const partes = Array.isArray(valor) ? valor.map(String) : [String(valor)];
  const nivel = partes.find((p) => /bom|razo|precisa|domina|moderad|duro|clar|restrit|parcial|total|rigidez|colapso|sustenta|perde|caminha|var|recurv/i.test(p)) || partes[0];
  const apoio = partes.find((p) => p !== nivel) || null;
  return { nivel: nivel || null, apoio, nota: nota || null };
}

principal().catch((erro) => {
  console.error('FALHOU — ' + (erro && erro.message ? erro.message : erro));
  process.exit(1);
});
