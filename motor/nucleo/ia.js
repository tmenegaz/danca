'use strict';

/**
 * ia.js — o NÚCLEO da conversa de IA (o stub, hoje; o DeepSeek, amanhã).
 *
 * A lógica da conversa é PURA: recebe a lista de nós respondíveis (que o
 * conteúdo declara, via `nosRespondiveis`) e o histórico de mensagens, e devolve
 * o CONTRATO do turno — `{compilado, turnos, respostas}` ou `{compilado:false,
 * turno, id, pergunta, …}`. Não sabe onde corre, não lê nem escreve em lugar
 * nenhum, não fala com rede.
 *
 * É o recipiente da conversa. Trocar o stub pelo DeepSeek é trocar a função
 * `respostaDaIA` — o contrato de turno e o FREIO (limite de turnos) continuam.
 *
 * Regras de CONDUÇÃO que valem desde já (e que o DeepSeek herda):
 *   1. O que é MARCÁVEL vira OPÇÃO NUMERADA («1 para RAD, 2 para Vaganova…»).
 *      Só CAMPO ABERTO é escrito/falado livremente.
 *   2. O professor pode PERGUNTAR — mas só sobre o PO. A pergunta NÃO consome
 *      turno: devolve a explicação do nó e espera a resposta.
 *   3. O professor pode VOLTAR («voltar», «retornar»), AVANÇAR sem responder
 *      («seguir», «continuar», «pular») e AJUSTAR um campo — pelo número
 *      («ajustar 2») ou pelo nome («ajustar professor», «voltar ao campo norma»).
 *
 * Tudo é decidido pelo TEXTO da fala — não por uma flag do cliente —, para a voz
 * e o teclado valerem exatamente o mesmo.
 */

const { nosRespondiveis } = require('./elicitar.js');

/** O teto de turnos por sessão (freio-custo.md §2). O freio REAL é o orçamento
 * mensal de tokens (§4); este é só a trava da sessão. */
const limiteTurnos = 30;

/** O que encerra a conversa e manda compilar — decidido pelo texto, não por flag. */
const sentinela = /^(compilar|pronto|finalizar|encerrar|ok|fim)$/i;

const NUMEROS_POR_EXTENSO = {
  um: 1, dois: 2, duas: 2, tres: 3, 'três': 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

const MARCA_DE_PERGUNTA =
  /(\?$)|^(o que|oque|qual|quais|como|por ?qu[eê]|porque|por que|explica|explique|explicar|me explica|n[aã]o entendi|n[aã]o compreendi|ajuda|d[uú]vida)\b/i;

function numeroDaFala(cru) {
  const n = Number(cru);
  if (Number.isInteger(n)) return n;
  // A voz transcreve «1» como «um», «2» como «dois» — aceita os dois.
  const semAcentos = cru.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const porExtenso = NUMEROS_POR_EXTENSO[String(cru).toLowerCase()];
  if (porExtenso !== undefined) return porExtenso;
  const num = String(cru).toLowerCase().replace(/^n[uú]mero\s+/, '');
  if (NUMEROS_POR_EXTENSO[num] !== undefined) return NUMEROS_POR_EXTENSO[num];
  return null;
}

function interpretarResposta(no, texto) {
  const cru = String(texto == null ? '' : texto).trim();
  if (!cru) return undefined;
  const opcoes = opcoesDoNo(no);
  if (opcoes.length) {
    const numero = numeroDaFala(cru);
    if (numero !== null && numero >= 1 && numero <= opcoes.length) {
      return opcoes[numero - 1];
    }
    // O professor também pode dizer o próprio rótulo («sim», «RAD»…):
    const porRotulo = opcoes.find((o) => String(o).toLowerCase() === cru.toLowerCase());
    if (porRotulo !== undefined) return porRotulo;
    // Campo aberto junto da lista: o que não é número nem rótulo vale como
    // «outro», se o nó permitir.
    if (no.aberto) return cru;
    return undefined;
  }
  return cru;
}

function opcoesDoNo(no) {
  if (no && Array.isArray(no.valores) && no.valores.length) return no.valores;
  if (no && Array.isArray(no.opcoes) && no.opcoes.length) return no.opcoes;
  return [];
}

function seloDoNo(no) {
  return no.obrigatorio === true ? '(obrigatório) ' : '(opcional) ';
}

/*
 * A pergunta do nó, pronta para a tela: o selo (obrigatório/opcional) na frente;
 * quando é marcável, traz a lista numerada e, se houver campo aberto, o convite
 * a escrever «outro».
 */
function perguntaDoNo(no) {
  const opcoes = opcoesDoNo(no);
  if (!opcoes.length) return seloDoNo(no) + no.campo;
  const lista = opcoes.map((o, i) => (i + 1) + ') ' + o).join('\n');
  const aberto = no.aberto ? '\n(ou escreva outra coisa)' : '';
  return seloDoNo(no) + no.campo + ' — diga o número:\n' + lista + aberto;
}

function explicacaoDoNo(no) {
  const e = no.explicacao;
  if (!e) return null;
  return [e.oQueE, e.preencher, e.porQue].filter(Boolean).join('\n');
}

// ---------------------------------------------------------------------------
// Os comandos de condução — decididos pelo TEXTO, antes de qualquer resposta.
// ---------------------------------------------------------------------------

function normalizar(texto) {
  return String(texto == null ? '' : texto)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
}

/**
 * Resolve «ajustar <nome>» para o índice (0-based) em `respondidos`, casando por
 * `campo` ou `id` (normalizados). Devolve `null` se o nome não bater em nenhum
 * nó já consumido.
 */
function indiceDoAlvo(nos, respondidos, nome) {
  const alvo = normalizar(nome);
  if (!alvo) return null;
  for (let i = 0; i < respondidos.length; i++) {
    const no = nos.find((n) => n.id === respondidos[i]);
    if (!no) continue;
    const campo = normalizar(no.campo);
    const id = normalizar(no.id);
    if (campo === alvo || id === alvo || campo.includes(alvo) || alvo.includes(campo)) {
      return i;
    }
  }
  return null;
}

/**
 * Classifica uma fala como comando de condução — ou `null` se for resposta.
 *
 *   undo      — desfaz o último campo («voltar», «retornar», «anterior»…)
 *   seguir    — avança SEM responder («seguir», «continuar», «pular»…)
 *   ajustar   — volta a um campo, por número ou por nome
 */
function comandoDaFala(cru) {
  if (/^(voltar|volta|anterior|retroceder|retornar)$/i.test(cru)) return { tipo: 'undo' };
  if (/^(seguir|continuar|proximo|próximo|pular|pular campo|pular pergunta|avancar|avançar)$/i.test(cru)) {
    return { tipo: 'seguir' };
  }
  const numero = cru.match(/^(?:ajustar|corrigir|editar|refazer|mudar|alterar|campo)\s+(\d+)$/i);
  if (numero) return { tipo: 'ajustar', numero: Number(numero[1]) };
  const nome = cru.match(
    /^(?:ajustar|corrigir|editar|refazer|mudar|alterar|voltar\s+ao\s+campo|voltar\s+para\s+o\s+campo|voltar\s+para|ir\s+para\s+o\s+campo|ir\s+para|campo)\s+(.+)$/i
  );
  if (nome) return { tipo: 'ajustar', nome: nome[1].trim() };
  return null;
}

/**
 * O stub da IA: o recipiente da conversa. Dado o histórico de mensagens, devolve
 * a PRÓXIMA pergunta (um nó do PO, na ordem do mapa) ou a COMPILAÇÃO (um esboço
 * de respostas). Não tem inteligência: tem o contrato que o DeepSeek vai cumprir
 * depois.
 *
 * `nos` é a lista de nós respondíveis — a MESMA que `nosRespondiveis(conteudo)`
 * devolve, na ordem em que o conteúdo os declara. É ela que sustenta o
 * «voltar» e o «ajustar N»: voltar tira o último, ajustar descarta do alvo em
 * diante.
 */
function respostaDaIA(nos, mensagens) {
  const falas = Array.isArray(mensagens) ? mensagens.filter((m) => m && m.papel) : [];
  // REPLAZA o histórico. `respondidos` é a lista ORDENADA de ids já CONSUMIDOS
  // (respondidos ou pulados); `puladas` separa os que foram avançados sem
  // resposta. `turnos` conta só as respostas VÁLIDAS — pular não conta.
  const respostas = {};
  const respondidos = [];
  const puladas = new Set();
  let ultima = null;
  let querCompilar = false;

  for (const m of falas) {
    if (m.papel !== 'professor') continue;
    ultima = m;
    const cru = String(m.texto || '').trim();
    if (!cru) continue;
    if (sentinela.test(cru)) { querCompilar = true; continue; }
    if (MARCA_DE_PERGUNTA.test(cru)) continue; // pergunta — não avança

    const comando = comandoDaFala(cru);
    if (comando) {
      if (comando.tipo === 'undo') {
        const id = respondidos.pop();
        if (id) { delete respostas[id]; puladas.delete(id); }
      } else if (comando.tipo === 'seguir') {
        const no = nos[respondidos.length];
        if (no) {
          puladas.add(no.id);
          // Pular um campo OBRIGATÓRIO não o faz sumir: vira lacuna explícita
          // (`[a decidir]`), como o prompt declara. O opcional fica em branco.
          if (no.obrigatorio === true) respostas[no.id] = '[a decidir]';
          respondidos.push(no.id);
        }
      } else if (comando.tipo === 'ajustar') {
        const alvo = comando.numero !== undefined
          ? comando.numero - 1
          : indiceDoAlvo(nos, respondidos, comando.nome);
        if (alvo !== null && alvo >= 0 && alvo < respondidos.length) {
          for (const id of respondidos.splice(alvo)) {
            delete respostas[id];
            puladas.delete(id);
          }
        }
      }
      continue;
    }

    const no = nos[respondidos.length];
    if (!no) break;
    const valor = interpretarResposta(no, cru);
    if (valor === undefined) continue; // resposta inválida — não avança
    respostas[no.id] = valor;
    respondidos.push(no.id);
  }

  const turnos = respondidos.filter((id) => !puladas.has(id)).length;
  const atingiu = turnos >= limiteTurnos;

  if (querCompilar || atingiu || respondidos.length >= nos.length) {
    return {
      compilado: true,
      turnos,
      esgotado: (atingiu || respondidos.length >= nos.length) && !querCompilar,
      respostas,
    };
  }

  const no = nos[respondidos.length];

  // O professor fez uma PERGUNTA: responde com a explicação do nó corrente.
  if (ultima && MARCA_DE_PERGUNTA.test(String(ultima.texto || '').trim())) {
    return {
      compilado: false,
      resposta: true,
      turno: turnos + 1,
      id: no.id,
      pergunta: seloDoNo(no) + no.campo,
      texto: explicacaoDoNo(no) || 'Sem explicação para este campo.',
    };
  }

  return {
    compilado: false,
    turno: turnos + 1,
    id: no.id,
    pergunta: perguntaDoNo(no),
    ajuda: no.explicacao && no.explicacao.oQueE ? no.explicacao.oQueE : null,
    obrigatorio: no.obrigatorio === true,
    opcoes: opcoesDoNo(no),
    aberto: no.aberto === true,
  };
}

/**
 * A conversa inteira, a partir do CONTEÚDO (não do mapa): deriva os nós e
 * responde o turno. É a entrada que o servidor usa.
 */
function conversar(conteudo, mensagens) {
  return respostaDaIA(nosRespondiveis(conteudo), mensagens);
}

module.exports = {
  limiteTurnos,
  sentinela,
  NUMEROS_POR_EXTENSO,
  MARCA_DE_PERGUNTA,
  numeroDaFala,
  interpretarResposta,
  opcoesDoNo,
  seloDoNo,
  perguntaDoNo,
  explicacaoDoNo,
  normalizar,
  indiceDoAlvo,
  comandoDaFala,
  respostaDaIA,
  conversar,
};
