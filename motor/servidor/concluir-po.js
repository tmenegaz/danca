'use strict';

/**
 * concluir-po.js — O PO CONCLUÍDO VIRA FONTE, GERA O CICLO E DISPARA (09/11/2026).
 *
 * PORQUE ESTE MÓDULO EXISTE. Este bloco nasceu dentro do «Guardar» do PO
 * (`motor/servidor/rotas.js`), e a 04/11/2026 foi extraído para uma função à parte para o
 * ajuste do plano de ensino o poder chamar — era isso que fazia a correção do plano chegar ao
 * PO. Agora há um terceiro consumidor: a **cadeia automática** (a troca de aluna, a saída e a
 * troca de direção de turma), que precisa exatamente do mesmo caminho para fechar a travessia.
 *
 * A ALTERNATIVA ERA COPIAR. Uma segunda cópia de «escrever o `-po.md`, derivar o ciclo e
 * disparar» envelheceria na primeira correção — e é a mesma razão pela qual a barra deixou de
 * ser escrita em quatro sítios e a listagem passou a ter uma função só. O que se move é a
 * função, com os comentários que explicam as suas guardas; nada de lógica nova.
 *
 * O QUE ELE GARANTE, e que quem chama pode assumir:
 *   · o plano referenciado é resolvido ANTES de escrever (com a retrocompatibilidade de cair no
 *     plano mais recente do mesmo contexto);
 *   · o orçamento de subpedidos é perguntado antes da primeira escrita da cadeia, para o
 *     `-po.md` e as fontes do ciclo entrarem juntos ou não entrarem nenhum;
 *   · o disparo só parte com as fontes prontas, e o motivo da não-partida vai na resposta;
 *   · o registo da geração é best-effort: sem KV, o documento continua válido.
 *
 * Devolve `{plano, fonte, ciclo, disparo, geracao}`. O chamador decide onde os campos ficam
 * (`resultado.*` para o PO do formulário, `resultado.cadeia` para o elo que o ajuste do plano
 * criou, `passos.*` para a cadeia automática).
 */

const { rotulosDoChecklist, derivadosDoChecklist, obrigatoriosDoPO } = require('../nucleo/derivar-po.js');

/**
 * A FÁBRRICA. Recebe tudo o que o bloco usava do fecho da rota, para o corpo ficar igual ao que
 * era — mesma ordem de leitura, mesmas guardas, mesmas frases.
 */
function criarConcluirPO({
  armazenamento, porta, escreverPO, escreverCiclo, disparar, geracao,
  fontesDoCicloProntas, linhaDeBaseDaTurma, anamnesesDaTurma, conteudoPO,
}) {
  return async function concluirPO(envelope, contexto) {
    const saida = { plano: null };

    // O PLANO DE ENSINO referenciado (nó `plano-de-ensino` do PO) é resolvido UMA vez,
    // antes de escrever o PO e o ciclo: o PO o lê para compor o campo empírico e o
    // contexto (não duplica a dose/calendário/volume/registro), e o ciclo o lê para
    // derivar aula/captura/harmonização. Sem referência, cai no plano mais recente do
    // mesmo contexto — retrocompatibilidade. Falha na resolução degrada (o PO sai com
    // lacuna declarada), nunca 500: o envelope já foi gravado.
    try {
      const ref = envelope && envelope.respostas && envelope.respostas['plano-de-ensino'];
      const planoId = ref && ref.valor !== undefined ? ref.valor : ref;
      saida.plano = planoId ? await porta.lerEnvelope(armazenamento, String(planoId)) : null;
      if (!saida.plano) {
        const nomes = await porta.nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
        for (let i = nomes.length - 1; i >= 0 && !saida.plano; i--) {
          const env = await porta.lerArquivo(armazenamento, nomes[i]);
          const c = env && env.contexto;
          if (c && c.escola === contexto.escola && c.professor === contexto.professor &&
              String(c.ciclo) === String(contexto.ciclo)) saida.plano = env;
        }
      }
    } catch (erro) {
      saida.planoErro = erro.message;
    }

    /* O ORÇAMENTO DE SUBPEDIDOS É CONSULTADO ANTES DA PRIMEIRA ESCRITA DA CADEIA (08/11/2026).
     *
     * O `escreverPO` grava o `-po.md` e o `escreverCiclo` grava as fontes do ciclo — dois
     * passos, dois commits, o mesmo pedido. Quando o segundo estourava o teto do Worker, o
     * primeiro já tinha entrado: o `-po.md` passava a apontar para um PO que as fontes não
     * descreviam, o `check-pacote` recusava o pacote, e a geração não publicava nada. Foi o
     * estado medido em 08/11/2026 (`-po.md` de `po-…-0956`, `-dados.json` de `po-…-2211`).
     *
     * Perguntar antes torna o par ATÓMICO na prática: ou entram os dois, ou não entra nenhum
     * — e a resposta diz qual dos dois foi, em vez de deixar o ciclo meio escrito. */
    const previsao = (escreverCiclo && typeof escreverCiclo.previsao === 'function')
      ? escreverCiclo.previsao() : 0;
    // O `-po.md` custa 2 subpedidos (o `sha` e o `PUT`); os schemas do ciclo, mais 2 ou 3.
    const CUSTO_DO_PO = 4;
    const orcamento = (escreverCiclo && typeof escreverCiclo.orcamento === 'function')
      ? escreverCiclo.orcamento() : null;
    const naoCabe = Boolean(orcamento && previsao && !orcamento.coube(previsao + CUSTO_DO_PO));
    if (naoCabe) {
      saida.fonte = { ok: false, motivo: 'orcamento', erro: orcamento.motivo(previsao + CUSTO_DO_PO) };
      saida.ciclo = { ok: false, motivo: 'orcamento', erro: orcamento.motivo(previsao + CUSTO_DO_PO) };
    } else if (escreverPO) {
      try {
        // OS RÓTULOS vêm do CONTEÚDO (o mesmo `conteudoPO` que a rota serve ao formulário):
        // o nome de cada folha do checklist é dado, não código — e é o nome que o professor
        // leu ao marcar. Sem esta passagem, o documento já assinou «Fronteiras claras» onde
        // o formulário diz «Fronteiras do escopo claras».
        saida.fonte = await escreverPO(envelope, 'feat(po): o PO elicitado vira a fonte do ciclo',
          saida.plano, {
            rotulos: rotulosDoChecklist(conteudoPO),
            derivados: derivadosDoChecklist(conteudoPO),
            // O `state:` da fonte sai das perguntas OBRIGATÓRIAS do conteúdo — as mesmas que a
            // barra do formulário conta. O checklist é opcional e não decide o estado.
            obrigatorios: obrigatoriosDoPO(conteudoPO),
            // A fonte gravada no repositório tem de trazer o MESMO recorte que a prévia:
            // duas leituras do mesmo acto no mesmo pedido seriam duas chances de divergir.
            linhaDeBase: await linhaDeBaseDaTurma(
              porta.turmaDoEnvelope(saida.plano) || contexto.turma),
          });
      } catch (erro) {
        saida.fonte = { ok: false, erro: erro.message };
      }
    }

    if (escreverCiclo) {
      try {
        /* E A MESMA LINHA DE BASE VAI AO CICLO (06/11/2026): o eixo do Corpo da Aula 01
         * imprime o que a turma mostra em cada aspecto, e essa é a leitura do passo 3. Uma
         * leitura só, dois documentos — senão o guia e o plano podiam arrumar o mesmo dado
         * de duas maneiras. */
        saida.ciclo = await escreverCiclo({
          plano: saida.plano, po: envelope, contexto,
          linhaDeBase: await linhaDeBaseDaTurma(porta.turmaDoEnvelope(saida.plano) || contexto.turma),
          anamneses: await anamnesesDaTurma(),
        });
      } catch (erro) {
        saida.ciclo = { ok: false, erro: erro.message };
      }
    }

    /*
     * O DISPARO SÓ ACONTECE COM AS FONTES PRONTAS (19/10/2026).
     *
     * O `escrever-ciclo.js` grava as fontes uma a uma e COMPÕE o `.conf` da turma —
     * é dele que o gerador lê os `DOCS`. Quando uma escrita falhava (uma fonte que
     * não casou, a rede), o disparo partia assim mesmo: o workflow arrancava,
     * não achava fonte nenhuma e morria com «DOCS está vazio». Pior que o erro era o
     * silêncio — a tela dizia «gravado», e o professor só descobria no GitHub.
     *
     * Agora o disparo é CONDICIONADO. Não disparar é um resultado explícito, que a
     * tela mostra com o motivo; e o envelope continua gravado, porque a gravação
     * nunca dependeu disto.
     */
    if (disparar) {
      const prontas = fontesDoCicloProntas(saida.ciclo);
      if (!prontas) {
        /* O MOTIVO VAI JUNTO (08/11/2026). «As fontes do ciclo não ficaram prontas» é
         * verdadeiro e não diz nada a quem está a olhar para a tela. O escritor sabe PORQUÊ
         * — não caberia no orçamento de subpedidos, o `.conf` não existe —, e essa é a
         * frase que se mostra. */
        saida.disparo = {
          ok: false,
          naoDisparado: true,
          motivo: 'as fontes do ciclo não ficaram prontas',
          erro: (saida.ciclo && saida.ciclo.erro) || null,
        };
      } else {
        try {
          saida.disparo = await disparar(contexto);
        } catch (erro) {
          saida.disparo = { ok: false, erro: erro.message };
        }
      }
    }

    /*
     * O REGISTRO do que foi pedido — e a primeira leitura do estado. É por ele que a
     * tela sabe o que está a ser gerado depois de recarregar: o contexto e os
     * documentos derivados ficam no KV da escola, não na memória do navegador.
     * Best-effort absoluto: sem KV, a gravação continua válida.
     */
    if (geracao) {
      try {
        const registro = await geracao.registrar(contexto, {
          disparo: saida.disparo,
          ciclo: saida.ciclo,
        });
        saida.geracao = registro.ok
          ? { ok: true, chave: registro.chave, registro: registro.registro }
          : { ok: false, erro: registro.erro, ignorado: registro.ignorado === true };
      } catch (erro) {
        saida.geracao = { ok: false, erro: erro.message };
      }
    }
    return saida;
  };
}

module.exports = { criarConcluirPO };
