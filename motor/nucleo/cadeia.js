'use strict';

/**
 * cadeia.js — O ÍNDICE DAS ETAPAS DA CADEIA AUTOMÁTICA (09/11/2026).
 *
 * PORQUE ISTO EXISTE. Até aqui, uma troca de aluna, uma saída ou uma troca de direção de turma
 * deixavam o professor a percorrer a cadeia à mão — «reveja a turma, depois o plano de ensino,
 * depois o plano de observação» —, e a frase do `proximo` era a via crucis: cada etapa num
 * formulário, cada passo na ordem. A pesquisadora pediu que o sistema faça a travessia.
 *
 * O QUE ESTE MÓDULO É, E O QUE ELE NÃO É. Ele é o ÍNDICE: a lista ordenada das etapas, a regra
 * que diz o ESTADO de cada uma e o resumo que a tela mostra. Ele não executa nada — não lê o
 * armazenamento, não deriva documento, não dispara geração. A execução é
 * `motor/servidor/cadeia.js`, que recebe as ações por parâmetro. A fronteira é a do núcleo:
 * isto decide o quê e em que ordem; quem escreve é quem tem infraestrutura.
 *
 * A ORDEM É DE DEPENDÊNCIA, e não de arrumação de ecrã: a Turma declara quem está na sala; o
 * plano de ensino fixa o que se ensina a esses corpos; o plano de observação mede o que o plano
 * fixou; e o pacote é o documento que lê os dois. Trocar a ordem produziria um PO a observar um
 * plano que já não vale — o defeito que a cadeia existe para não repetir.
 *
 * ETAPAS COM ESTADO PRÓPRIO, E NÃO UM CAMPO «cadeia: ok». Um sinal que se esquece de limpar é
 * um sinal que mente (a mesma regra de `revalidacaoPendente`): o estado é derivado do que existe
 * — a Turma, o plano, o PO, o carimbo da geração —, e cai sozinho quando a etapa é feita.
 *
 * A REGRA DO FLUXO COMPLETO (decisão de 09/11/2026). A cadeia automática inteira só corre em
 * registos que já têm o fluxo completo — elenco, Turma, plano e PO. Num registo incompleto,
 * avança-se até onde é possível (os vínculos) e diz-se o que falta, com o sítio onde se faz.
 * Inventar o plano ou o PO que a escola nunca fez seria decidir pedagogia por conta própria.
 */

/**
 * AS ETAPAS, NA ORDEM DA DEPENDÊNCIA. `onde` é uma CHAVE de destino, e não um endereço: quem
 * monta o link é o servidor, que conhece o professor, o ciclo e a escola do contexto — escrever
 * o caminho aqui daria um link para outra escola no dia em que o contexto mudasse.
 */
const ETAPAS = [
  { chave: 'vinculos', rotulo: 'Vínculos e etiquetas', onde: 'producao-turmas' },
  { chave: 'plano-de-ensino', rotulo: 'Plano de ensino', onde: 'porta-plano' },
  { chave: 'plano-de-observacao', rotulo: 'Plano de observação', onde: 'porta-po' },
  { chave: 'pacote', rotulo: 'Documentos gerados (HTML e PDF)', onde: 'geracao' },
];

/** Uma cópia das etapas — quem consome não as altera por acidente. */
function etapas() {
  return ETAPAS.map((e) => ({ chave: e.chave, rotulo: e.rotulo, onde: e.onde }));
}

/** Os nomes, sem acentos nem maiúsculas, para comparar listas de apelidos. */
function nomeLimpo(v) {
  return String(v == null ? '' : v).trim();
}

/**
 * DUAS LISTAS DE ALUNAS SÃO A MESMA? Compara-se o conjunto, e não a ordem: o elenco é uma
 * lista de corpos, não uma fila — a mesma turma com as mesmas seis alunas está em dia mesmo que
 * a ordem mude. O apelido é o identificador estável (P-12), e é ele que a comparação usa.
 */
function mesmasAlunas(a, b) {
  const la = (Array.isArray(a) ? a : []).map(nomeLimpo).filter(Boolean);
  const lb = (Array.isArray(b) ? b : []).map(nomeLimpo).filter(Boolean);
  if (la.length !== lb.length) return false;
  const sa = new Set(la);
  return lb.every((x) => sa.has(x));
}

/** A frase dos vínculos: quantas de cada lado, e quem entrou/saiu quando se sabe. */
function fraseDosVinculos(curadoriaAlunas, elencoAlunas, turma, elenco) {
  const daTurma = (Array.isArray(curadoriaAlunas) ? curadoriaAlunas : []).map(nomeLimpo).filter(Boolean);
  const doElenco = (Array.isArray(elencoAlunas) ? elencoAlunas : []).map(nomeLimpo).filter(Boolean);
  const setTurma = new Set(daTurma);
  const setElenco = new Set(doElenco);
  const saiu = daTurma.filter((a) => !setElenco.has(a));
  const entrou = doElenco.filter((a) => !setTurma.has(a));
  const partes = [];
  if (saiu.length) partes.push('saiu ' + saiu.join(', '));
  if (entrou.length) partes.push('entrou ' + entrou.join(', '));
  const alt = partes.length ? ' (' + partes.join('; ') + ')' : '';
  return 'A Turma «' + (turma || 'sem nome') + '» declara ' + daTurma.length
    + (daTurma.length === 1 ? ' aluna' : ' alunas') + ', e o elenco «' + (elenco || 'sem nome')
    + '» tem ' + doElenco.length + alt + '.';
}

/**
 * O ÍNDICE DE UM REGISTO. Recebe o que existe e devolve as quatro etapas classificadas.
 *
 * `estado` de cada etapa:
 *   · `feita`    — a etapa está em dia (a Turma concorda com o elenco; o documento é posterior
 *                  à mudança; a geração saiu depois dele);
 *   · `pendente` — há o que fazer, e a cadeia automática sabe fazê-lo;
 *   · `bloqueada`— falta uma peça que a cadeia NÃO inventa (o plano, o PO), ou não há Turma que
 *                  receba a mudança. Não é erro: é o registo que ainda não chegou ali.
 *
 * `completa` é a porta do fluxo inteiro: só com elenco, Turma, plano e PO é que a travessia
 * automática dos quatro passos faz sentido. Sem eles, o que se pode fazer faz-se, e o resto é
 * dito.
 */
function indice(estado) {
  const e = estado || {};
  const quando = String(e.quando || '');
  const novo = (quandoDe) => Boolean(quandoDe) && String(quandoDe) >= quando;
  const passos = [];

  // 1. OS VÍNCULOS — a Turma tem de declarar o corpo que o elenco declara.
  if (!e.elenco) {
    passos.push({
      chave: 'vinculos', estado: 'bloqueada',
      falta: 'O elenco que esta Turma declara já não existe (ou nunca existiu) — não há corpo '
        + 'para sincronizar. Escolha um elenco na Turma.',
    });
  } else if (!e.curadoria) {
    passos.push({
      chave: 'vinculos', estado: 'bloqueada',
      falta: 'Nenhuma Turma escolheu o elenco «' + (e.elenco.nome || e.elenco.id) + '» — o corpo '
        + 'mudou, mas não há sala que o receba. Escolha o elenco na Turma.',
    });
  } else if (mesmasAlunas(e.elenco.alunas, e.curadoria.alunas)) {
    passos.push({ chave: 'vinculos', estado: 'feita' });
  } else {
    passos.push({
      chave: 'vinculos', estado: 'pendente',
      falta: fraseDosVinculos(e.curadoria.alunas, e.elenco.alunas,
        e.turma || (e.curadoria.turmas || [])[0], e.elenco.nome || e.elenco.id),
    });
  }

  // 2. O PLANO DE ENSINO — derivado depois da mudança.
  if (!e.plano) {
    passos.push({
      chave: 'plano-de-ensino', estado: 'bloqueada',
      falta: 'A Turma «' + (e.turma || 'sem nome') + '» ainda não tem plano de ensino. O '
        + 'primeiro nasce na porta, e a cadeia não o inventa: o plano fixa decisões pedagógicas '
        + 'que são do professor.',
    });
  } else if (novo(e.plano.gerado_em || e.plano.id)) {
    passos.push({ chave: 'plano-de-ensino', estado: 'feita', id: e.plano.id || null });
  } else {
    passos.push({
      chave: 'plano-de-ensino', estado: 'pendente', id: e.plano.id || null,
      falta: 'O plano de ensino «' + (e.plano.id || '—') + ' é anterior à mudança — a cadeia '
        + 'deriva um elo novo, com o mesmo conteúdo e o vínculo corrigido.',
    });
  }

  // 3. O PLANO DE OBSERVAÇÃO — derivado depois do plano de ensino.
  if (!e.plano) {
    passos.push({
      chave: 'plano-de-observacao', estado: 'bloqueada',
      falta: 'Sem plano de ensino não há o que observar — o PO nasce do plano.',
    });
  } else if (!e.po) {
    passos.push({
      chave: 'plano-de-observacao', estado: 'bloqueada',
      falta: 'A Turma ainda não tem plano de observação. Ele nasce do plano de ensino, na porta, '
        + 'e a cadeia não o inventa: a linha de base dos sujeitos é uma decisão do professor.',
    });
  } else if (novo(e.po.gerado_em || e.po.id)) {
    passos.push({ chave: 'plano-de-observacao', estado: 'feita', id: e.po.id || null });
  } else {
    passos.push({
      chave: 'plano-de-observacao', estado: 'pendente', id: e.po.id || null,
      falta: 'O plano de observação «' + (e.po.id || '—') + '» é anterior à mudança — a cadeia '
        + 'deriva um elo novo, que observa o plano de ensino vigente.',
    });
  }

  // 4. O PACOTE — a geração que lê os dois documentos.
  if (e.pacoteEmDia) {
    passos.push({ chave: 'pacote', estado: 'feita' });
  } else if (!e.po) {
    passos.push({
      chave: 'pacote', estado: 'bloqueada',
      falta: 'O pacote lê o plano de ensino e o plano de observação; sem o PO não há o que gerar.',
    });
  } else {
    passos.push({
      chave: 'pacote', estado: 'pendente',
      falta: 'Os documentos gerados (HTML e PDF) ainda são os de antes da mudança — a geração '
        + 'corre depois de os dois planos estarem em dia.',
    });
  }

  const completa = Boolean(e.elenco && e.curadoria && e.plano && e.po);
  return { completa, etapas: passos };
}

/**
 * O RESUMO PARA QUEM MOSTRA. `ok` só é verdadeiro quando TODAS as etapas estão feitas; o
 * `proxima` é a primeira que falta, na ordem da dependência — é ela que a tela põe à frente, e
 * é o link que o professor clica primeiro.
 */
function resumo(passos) {
  const lista = Array.isArray(passos) ? passos : [];
  const faltam = lista.filter((p) => p && p.estado !== 'feita');
  return {
    ok: lista.length > 0 && faltam.length === 0,
    feitas: lista.filter((p) => p && p.estado === 'feita').map((p) => p.chave),
    faltam,
    proxima: faltam.length ? faltam[0] : null,
  };
}

/**
 * A ETAPA SEGUINTE À ÚLTIMA FEITA — a que a cadeia tenta agora. Devolve `null` quando não há
 * nada a fazer, e o passo `bloqueada` quando é ele que trava a travessia: a cadeia pára ali e
 * reporta, e NUNCA salta por cima de uma peça que não existe.
 */
function proximaEtapa(passos) {
  const lista = Array.isArray(passos) ? passos : [];
  const falta = lista.find((p) => p && p.estado !== 'feita');
  return falta || null;
}

/** O rótulo de um gatilho, para o log e para a tela. */
const ROTULOS_DO_GATILHO = {
  'troca-de-aluna': 'troca de aluna entre elencos',
  'saida-de-aluna': 'saída de aluna do elenco',
  'troca-de-direcao': 'troca de professor ou modalidade da turma',
  'mudanca-de-sala': 'mudança de sala (o ritmo da Turma)',
};

function rotuloDoGatilho(gatilho) {
  return ROTULOS_DO_GATILHO[gatilho] || String(gatilho || 'mudança');
}

module.exports = {
  ETAPAS,
  ROTULOS_DO_GATILHO,
  etapas,
  mesmasAlunas,
  fraseDosVinculos,
  indice,
  resumo,
  proximaEtapa,
  rotuloDoGatilho,
};
