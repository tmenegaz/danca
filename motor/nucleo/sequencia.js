/**
 * sequencia.js — A LINHA DA AULA QUE PERDEU O SUJEITO (03/11/2026).
 *
 * O DEFEITO, dito pela pesquisadora: «na tabela de Sequência de Exercícios por Bloco o sistema
 * continua exibindo referências a itens que foram eliminados (ex.: rótulos como "Barra com
 * objetivo específico 2" e "Centro com objetivo específico 3")» — e ela fez a pergunta certa:
 * «a sequência é dinâmica ou está presa a dados de mock/teste estáticos?»
 *
 * A RESPOSTA É: É DINÂMICA, e não havia mock nenhum. Os blocos estão certos (a barra sumiu quando
 * ela desmarcou o solo, a musicalidade não entra porque a musicalidade tem o bloco dela). O que
 * ficou preso foi o OUTRO lado do par: o **objetivo específico**. Medido no envelope verdadeiro,
 * `plano-20261103-1644.json`: a lista dos objetivos tinha UM item, e a sequência guardava OITO
 * linhas — duas delas a nomear «2 — transferir o peso entre os pés…» e «3 — sustentar a
 * transferência…», objetivos que já não existem.
 *
 * POR QUE ELAS SOBREVIVIAM. A derivação junta duas coisas: as linhas que ela monta a partir das
 * decisões de agora, e as linhas já gravadas que não foram consumidas por nenhuma dessas — a regra
 * «o que o professor escreveu não se sobrescreve». Só que essas duas linhas NÃO foram escritas pelo
 * professor: a coluna «Objetivo específico» é `somenteLeitura`, ele não a pode digitar. Elas são a
 * semente que o SISTEMA escreveu numa sessão em que havia três objetivos — e a autoria da semente
 * vivia num `Map` de memória (`SEMENTE_ANTERIOR`), que morre com a página. Depois do primeiro
 * recarregamento, a semente do sistema torna-se indistinguível da escrita da pessoa.
 *
 * A CHAVE TAMBÉM ESTAVA ERRADA, e o segundo defeito é o mesmo por outra porta. A linha era
 * reconhecida pelo rótulo INTEIRO («1 — reconhecer o apoio…»). Corrigir o texto de um objetivo
 * mudava o rótulo, a linha gravada deixava de casar com a semente, e a tabela passava a mostrar
 * DUAS linhas para o mesmo objetivo — a segunda com o texto velho e o «Conteúdo do nível» a pedir
 * escolha outra vez. Medido: era exactamente o «campo aberto/vazio» que ela viu.
 *
 * A REGRA, e é uma só: **a linha de um objetivo que não existe não é memória — é semente órfã.**
 * Memória é o que alguém decidiu; a referência a um objetivo apagado não pode ter sido decidida
 * por ninguém, porque quem a escreve é o sistema. Sai da derivação (e da tabela), e a próxima
 * gravação a deixa de escrever no envelope — sem que se reescreva o que está gravado, porque o
 * que está gravado é justamente o que a regra manda não publicar.
 *
 * E O QUE NÃO SE FAZ AQUI. Linha sem objetivo (a que ela acrescentou à mão), linha em prosa (plano
 * antigo) e o plano cujos objetivos ainda estão vazios passam como vieram: sem uma lista contra a
 * qual medir, não há órfão a declarar — e apagar o que não se pode julgar seria a limpeza a
 * destruir o dado.
 */

/** O nome da coluna onde a sequência guarda o objetivo, na ordem em que os nomes apareceram. As
 *  variantes são de planos antigos, e nenhuma delas se escreve hoje. */
const COLUNAS_DO_OBJETIVO = ['Objetivo específico', 'Objetivo', 'Marco'];

/**
 * O NÚMERO DE UM OBJETIVO ESPECÍFICO, lido do rótulo que a linha guarda.
 *
 * O rótulo é «3 — sustentar a transferência com musicalidade…» (`rotuloDoMarco`, na porta), e o
 * número é o do marco — é ele que a coluna «Objetivos» do plano cita. Devolve `NaN` quando o
 * valor não começa por um número: prosa de plano antigo, célula vazia, e o «Barra» que nunca é
 * um objetivo.
 */
function numeroDoObjetivo(valor) {
  if (valor === null || valor === undefined) return NaN;
  if (typeof valor === 'number') return Number.isInteger(valor) && valor > 0 ? valor : NaN;
  const texto = String(valor).trim();
  if (!texto) return NaN;
  const achado = /^(\d{1,3})\b/.exec(texto);
  if (!achado) return NaN;
  const n = Number(achado[1]);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

/** O valor que a linha traz na coluna do objetivo — qualquer um dos nomes que ela já teve. */
function objetivoDaLinha(linha) {
  if (!linha || typeof linha !== 'object' || Array.isArray(linha)) return '';
  for (const coluna of COLUNAS_DO_OBJETIVO) {
    const v = linha[coluna];
    if (v !== null && v !== undefined && String(v).trim()) return v;
  }
  return '';
}

/**
 * A LINHA CUJO OBJETIVO NÃO EXISTE MAIS — a que sai.
 *
 * `objetivos` é a lista VIVA (o que a pessoa tem escrito agora, já sem as linhas em branco, que é
 * a mesma conta da tela e do documento). Uma linha é órfã quando nomeia um número fora de
 * `1..objetivos.length`. Não é órfã quando:
 *
 *   · o objetivo dela ainda existe — mesmo que o TEXTO tenha mudado, porque quem a reconhece é o
 *     número, e é isso que impede a duplicação;
 *   · não nomeia objetivo nenhum — a linha que ela acrescentou, ou a prosa de um plano antigo.
 */
function linhaOrfa(linha, objetivos) {
  const total = Array.isArray(objetivos) ? objetivos.length : 0;
  if (!total) return false; // sem objetivos não há contra o que medir
  const n = numeroDoObjetivo(objetivoDaLinha(linha));
  if (!Number.isFinite(n)) return false;
  return n > total;
}

/** As linhas que continuam a ter sujeito — a sequência que a tela desenha e o documento publica. */
function linhasVivas(sequencia, objetivos) {
  const lista = Array.isArray(sequencia) ? sequencia : [];
  const vivas = [];
  for (const linha of lista) {
    if (linhaOrfa(linha, objetivos)) continue;
    vivas.push(linha);
  }
  return vivas;
}

/**
 * O CONTEÚDO QUE A CURADORIA NÃO ACORDOU (03/11/2026) — a segunda porta do mesmo defeito.
 *
 * A pesquisadora: «a curadoria ativa deste teste possui estritamente apenas dois verbetes
 * cadastrados (Battement Tendu e Plié). No entanto, o sistema injetou automaticamente um conteúdo
 * chamado Port de Bras vinculado ao Objetivo 2» — e suspeitou, com razão, de dados de teste. Não
 * havia mock: havia uma medida marcada fora do repertório. A matriz do «Parâmetro de medição»
 * aceita qualquer termo, porque MEDIR NÃO É CURAR; o que se mede num exercício pode ser uma
 * qualidade que a curadoria não previu como exercício. Mas o conteúdo da aula é o repertório
 * curado, e só ele — o resto é a medida de um exercício que já existe.
 *
 * `repertorio` é a lista ACORDADA (a do envelope, ou a da curadoria); vazia, não se julga nada —
 * apagar o que não se pode conferir seria a limpeza a destruir o dado.
 */
const COLUNAS_DO_CONTEUDO = ['Conteúdo do nível', 'Conteúdo', 'Exercício'];

/** O valor que a linha traz na coluna do conteúdo — qualquer um dos nomes que ela já teve. */
function conteudoDaLinha(linha) {
  if (!linha || typeof linha !== 'object' || Array.isArray(linha)) return '';
  for (const coluna of COLUNAS_DO_CONTEUDO) {
    const v = linha[coluna];
    if (v !== null && v !== undefined && String(v).trim()) return String(v).trim();
  }
  return '';
}

/** A lista ACORDADA — o repertório do envelope, na forma `[{termo}]` ou `['termo']`. */
function termosAcordados(repertorio) {
  return (Array.isArray(repertorio) ? repertorio : [])
    .map((t) => String((t && t.termo) || t || '').trim())
    .filter(Boolean);
}

/**
 * O TERMO fora do repertório — a régua sobre um nome SOLTO, e não sobre uma linha de tabela.
 *
 * A mesma regra serve a duas formas de dado, e é por isso que ela mora aqui e não em quem a lê:
 * a linha da sequência traz o exercício numa COLUNA (`conteudoDaLinha`), e a matriz do «Parâmetro
 * de medição» traz os termos numa LISTA (`marcados`). Duas cópias da comparação divergiriam ao
 * primeiro caso — e já divergiram: a sequência ficou blindada em 03/11/2026 e o parâmetro não,
 * de modo que o «Port de bras» saiu do exercício e continuou a aparecer no §1 da MESMA aula.
 */
function termoForaDoRepertorio(termo, repertorio) {
  const acordado = termosAcordados(repertorio);
  if (!acordado.length) return false;       // sem repertório não há contra o que medir
  const nome = String(termo == null ? '' : termo).trim();
  if (!nome) return false;                  // a lacuna não é violação
  return acordado.indexOf(nome) === -1;
}

/** Os termos que a curadoria acordou — o que a aula pode publicar. */
function termosDoRepertorio(termos, repertorio) {
  const lista = Array.isArray(termos) ? termos : [];
  return lista.filter((t) => !termoForaDoRepertorio(t, repertorio));
}

/** A linha cujo exercício está FORA do repertório acordado — a que não se publica. */
function linhaForaDoRepertorio(linha, repertorio) {
  const conteudo = conteudoDaLinha(linha);
  if (!conteudo) return false;              // a lacuna não é violação
  return termoForaDoRepertorio(conteudo, repertorio);
}

/** As linhas cujo exercício a curadoria acordou — o que a `aula-01.md` compõe. */
function linhasDoRepertorio(sequencia, repertorio) {
  const lista = Array.isArray(sequencia) ? sequencia : [];
  return lista.filter((linha) => !linhaForaDoRepertorio(linha, repertorio));
}

module.exports = { COLUNAS_DO_OBJETIVO, COLUNAS_DO_CONTEUDO, numeroDoObjetivo, objetivoDaLinha,
  conteudoDaLinha, linhaOrfa, termosAcordados, termoForaDoRepertorio, termosDoRepertorio,
  linhaForaDoRepertorio, linhasVivas, linhasDoRepertorio };
