'use strict';

/**
 * indice-do-recorte.js — O ÍNDICE DO PASSO 4 (o recorte), e do passo 3 que o informa.
 *
 * PORQUE ELE EXISTE. Os cinco passos da linha de base produzem **um** registo por trabalho
 * («Nível 1 — mobilidade e pés»), e cada um escolhe entre os 45 aspectos que a anamnese mede. Até
 * aqui, cada escolha vivia sozinha no seu registo: para saber **o que os professores olham no corpo
 * de uma bailarina**, era preciso abrir as linhas uma a uma e contá-las à mão. A pesquisadora,
 * 05/11/2026: «é para a gente poder fazer um filtro rápido […] identificar quais são os aspectos do
 * recorte mais usados e os menos usados, os que nunca foram usados, os que são usados parcialmente
 * […] e assim a gente vai saber o que o professor está preocupado no corpo de uma bailarina ou de
 * uma turma».
 *
 * QUE FAMÍLIA DE ÍNDICE É ESTE. É o **VIVO** (`PLANO-INDICES.md` §3 e §4.5): o recorte mora no KV
 * da escola (`bastidores/<escola>/linhas-de-base`), é escrito pela Produção e não existe em Git
 * nenhum. Por isso ele **não** entra em `indices/` — essa pasta é o índice de ACERVO, derivado do
 * repositório no momento da construção, determinístico e servido como ficheiro. Pôr aqui um dado
 * de KV seria pedir ao gerador que lesse o que ele não alcança, e o §2.1 recusa a segunda fonte.
 *
 * O QUE ELE CONTA, e são três perguntas diferentes:
 *
 *   · `aspectos` — o RANQUE. Por aspecto da anamnese: em quantos recortes foi escolhido, em
 *     quantos desses chegou a uma turma, quando apareceu pela primeira e pela última vez. É o
 *     «mais usados / menos usados». **`primeira_em`/`ultima_em` são das linhas VIGENTES** — a
 *     `atualizada_em` de cada uma —, e NÃO uma série: um aspecto que se olhava em Setembro e hoje
 *     em nenhuma linha aparece aqui com uma data só. A SÉRIE verdadeira (um elo por acto) está no
 *     índice de ACERVO, `indices/escolas/<escola>.json` (§4.13 do PLANO-INDICES), e existe desde
 *     05/11/2026, quando o acto da linha de base passou a ser ficheiro append-only. Dizer as duas
 *     coisas como se fossem uma seria o pior dos dois mundos: a data pareceria história.
 *   · `nunca` — os aspectos que a anamnese oferece e **nenhum** recorte escolheu. É a resposta
 *     mais útil das três, porque é a única que aponta trabalho: um aspecto que ninguém escolhe é
 *     ou irrelevante (e aí a anamnese pode encolher) ou um ponto cego do olhar do professor.
 *   · `cegos` — o cruzamento com o passo 3: aspectos que a LEITURA marcou como ponto de atenção
 *     **e** que nenhum recorte escolheu. O corpo mostrou, e o recorte não olhou. É o que ela
 *     descreveu como «identificar problemas que ocorrem por não olhar alguns dos aspectos».
 *
 * O QUE ELE **NÃO** GUARDA. Nenhum apelido de aluna, nenhum texto, nenhuma resposta: só ids,
 * nomes de aspecto e contagens (§4.8). O nome do aspecto não é dado de pessoa — é o vocabulário da
 * anamnese, que é norma e está em `porta/conteudo/anamnese.json`.
 *
 * ELE É PURO. Sem `fs`, sem rede, sem relógio próprio: recebe o universo e as linhas já lidas e
 * devolve o índice. É o que permite prová-lo sem KV — e é a mesma fronteira de `indices.js`, que
 * separa «construir» de «ler».
 */

/**
 * A VERSÃO sobe quando um campo ENTRA ou muda de forma — e não quando um valor muda. Quem
 * cacheia o índice compara este número, como faz o `indice-acervo.js`.
 */
const VERSAO = 1;

/** A data de um registo, em `AAAA-MM-DD`, para a série do panorama. `null` quando não há. */
function dia(texto) {
  const s = String(texto == null ? '' : texto).trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
}

/** A ordem dos aspectos: o ranque primeiro (mais escolhido), e depois o nome, como a anamnese. */
function porUso(a, b) {
  if (a.recortes !== b.recortes) return b.recortes - a.recortes;
  if (a.atencao_em !== b.atencao_em) return b.atencao_em - a.atencao_em;
  return String(a.nome).localeCompare(String(b.nome), 'pt');
}

/**
 * CONSTRÓI O ÍNDICE.
 *
 * `universo` é a lista de `camposDisponiveis(anamnese)` — os 45 aspectos que a anamnese mede. Ele
 * entra por argumento porque é o que dá sentido a «nunca usado»: sem o universo, um aspecto com
 * zero escolhas é indistinguível de um aspecto que não existe.
 *
 * `linhas` é o array guardado em `bastidores/<escola>/linhas-de-base`. Cada linha tem `id`,
 * `nome`, `professor`, `alunas`, `campos` (os escolhidos), `turma`/`enviada_em` (o passo 5, se já
 * correu), `atualizada_em` e — quando o passo 3 foi lido — `leitura.classificacao`.
 *
 * `agora` fixa o instante (as provas passam-no); sem ele, o `gerado_em` sai `null` e o índice não
 * mente sobre a hora em que foi feito.
 */
function construir({ universo, linhas, agora } = {}) {
  const aspectos = Array.isArray(universo) ? universo.filter((c) => c && c.id) : [];
  const registos = Array.isArray(linhas) ? linhas.filter((l) => l && typeof l === 'object') : [];

  const recortes = registos.filter((l) => Array.isArray(l.campos) && l.campos.length);
  const rascunhos = registos.filter((l) => !Array.isArray(l.campos) || !l.campos.length);

  /* O MAPA POR ASPECTO, semeado pelo UNIVERSO. Uma escolha que aponte para um id que a anamnese
   * já não tem não pode ser descartada em silêncio: ela prova que o recorte foi decidido sobre uma
   * anamnese anterior, e o passado não se reescreve (P-03). Vai para `desconhecidos`, com o nome
   * com que foi escolhida — que é o que o registo guardou de propósito. */
  const porId = new Map();
  for (const c of aspectos) {
    porId.set(String(c.id), {
      id: String(c.id),
      nome: String(c.nome || c.id),
      grupo: String(c.grupo || ''),
      eixo: String(c.eixo || ''),
      dimensao: String(c.dimensao || ''),
      recortes: 0,
      aplicados: 0,
      linhas: [],
      primeira_em: null,
      ultima_em: null,
      leituras: 0,
      atencao_em: 0,
      excelencia_em: 0,
      comum_em: 0,
      nao_medidos: 0,
    });
  }
  const desconhecidos = new Map();

  for (const linha of recortes) {
    const id = String(linha.id || linha.nome || '');
    const quando = dia(linha.atualizada_em || linha.enviada_em || linha.criada_em);
    const enviada = Boolean(String(linha.turma || '').trim());
    for (const escolhido of linha.campos) {
      const campoId = String((escolhido && typeof escolhido === 'object' ? escolhido.id : escolhido) || '').trim();
      if (!campoId) continue;
      const alvo = porId.get(campoId);
      if (!alvo) {
        const atual = desconhecidos.get(campoId) || {
          id: campoId,
          nome: String((escolhido && escolhido.nome) || campoId),
          recortes: 0,
          linhas: [],
        };
        atual.recortes += 1;
        if (atual.linhas.indexOf(id) === -1) atual.linhas.push(id);
        desconhecidos.set(campoId, atual);
        continue;
      }
      alvo.recortes += 1;
      if (enviada) alvo.aplicados += 1;
      if (alvo.linhas.indexOf(id) === -1) alvo.linhas.push(id);
      if (quando) {
        if (!alvo.primeira_em || quando < alvo.primeira_em) alvo.primeira_em = quando;
        if (!alvo.ultima_em || quando > alvo.ultima_em) alvo.ultima_em = quando;
      }
    }
  }

  /* A LEITURA (o passo 3) — de onde sai o cruzamento. Ela é por aspecto e por lista; o que se
   * conta é em QUANTAS leituras o aspecto apareceu em cada uma. Uma leitura sem `classificacao`
   * (registo antigo, ou o passo 3 ainda não lido) não conta — e é o `leituras` que diz quantas
   * linhas têm leitura guardada, para o panorama não fingir que nenhuma foi feita. */
  let linhasComLeitura = 0;
  for (const linha of registos) {
    const c = linha.leitura && linha.leitura.classificacao;
    if (!c) continue;
    linhasComLeitura += 1;
    /* O ITEM É UM SÓ, partilhado pelas listas: um aspecto em atenção E comum é o MESMO objecto nas
     * duas. Por isso se junta o «não medido» num mapa por id — somá-lo em cada lista contaria duas
     * vezes a mesma abstenção. Vale o primeiro que aparecer: é o mesmo valor. */
    const naoMedidosDaLeitura = new Map();
    const marcar = (lista, chave) => {
      for (const item of (Array.isArray(lista) ? lista : [])) {
        const alvo = item && item.id ? porId.get(String(item.id)) : null;
        if (!alvo) continue;
        alvo[chave] += 1;
        if (!naoMedidosDaLeitura.has(alvo.id)) {
          naoMedidosDaLeitura.set(alvo.id, Number(item.naoMedidos) || 0);
        }
      }
    };
    marcar(c.atencao, 'atencao_em');
    marcar(c.excelencia, 'excelencia_em');
    marcar(c.comuns, 'comum_em');
    // `leituras` conta cada aspecto COM registo naquela leitura — é o denominador do cruzamento.
    const comRegisto = [];
    for (const chave of ['atencao', 'excelencia', 'comuns']) {
      for (const item of (Array.isArray(c[chave]) ? c[chave] : [])) {
        if (item && item.id && comRegisto.indexOf(String(item.id)) === -1) comRegisto.push(String(item.id));
      }
    }
    for (const id of comRegisto) {
      const alvo = porId.get(id);
      if (alvo) alvo.leituras += 1;
    }
    for (const [id, quantos] of naoMedidosDaLeitura) {
      const alvo = porId.get(id);
      if (alvo && quantos) alvo.nao_medidos += quantos;
    }
    // O que a anamnese não preencheu também é informação: conta para o aspecto, e não o promove.
    for (const item of (Array.isArray(c.semRegisto) ? c.semRegisto : [])) {
      const alvo = item && item.id ? porId.get(String(item.id)) : null;
      if (alvo) alvo.nao_medidos += 1;
    }
  }

  const total = recortes.length;
  const lista = [...porId.values()].map((a) => Object.assign(a, {
    // A COBERTURA, e é ela que responde «usados parcialmente»: o aspecto está em todos os
    // recortes, em alguns, ou em nenhum. «Todos» com um só recorte é uma verdade fraca, e é por
    // isso que o `recortes` (o número) viaja ao lado do rótulo.
    cobertura: a.recortes === 0 ? 'nenhum' : (a.recortes >= total ? 'todos' : 'alguns'),
    // O PONTO CEGO: a leitura viu atenção e o recorte nunca olhou.
    cego: a.atencao_em > 0 && a.recortes === 0,
  })).sort(porUso);

  /* O PANORAMA POR EIXO E POR GRUPO — as mesmas contagens, agrupadas como o passo 4 desenha a
   * escolha (por grupo da anamnese) e como o documento a imprime (por eixo). Não é uma segunda
   * conta: é a soma da mesma lista. */
  const somarPor = (chave) => {
    const mapa = new Map();
    for (const a of lista) {
      const valor = String(a[chave] || '');
      if (!valor) continue;
      const atual = mapa.get(valor) || { valor, aspectos: 0, recortes: 0, atencao_em: 0, cegos: 0 };
      atual.aspectos += 1;
      atual.recortes += a.recortes;
      atual.atencao_em += a.atencao_em;
      if (a.cego) atual.cegos += 1;
      mapa.set(valor, atual);
    }
    return [...mapa.values()].sort((x, y) => y.recortes - x.recortes || String(x.valor).localeCompare(String(y.valor), 'pt'));
  };

  return {
    versao: VERSAO,
    gerado_em: agora ? String(agora) : null,
    panorama: {
      linhas: registos.length,
      com_recorte: recortes.length,
      rascunhos: rascunhos.length,
      enviadas: recortes.filter((l) => String(l.turma || '').trim()).length,
      // A soma das escolhas, e não o número de recortes: é o que diz o TAMANHO médio do recorte,
      // que é a outra metade da pergunta «o que o professor olha».
      escolhas: recortes.reduce((n, l) => n + l.campos.length, 0),
      aspectos_oferecidos: lista.length,
      aspectos_usados: lista.filter((a) => a.recortes > 0).length,
      aspectos_nunca: lista.filter((a) => a.recortes === 0).length,
      linhas_com_leitura: linhasComLeitura,
    },
    aspectos: lista,
    // OS NUNCA ESCOLHIDOS vêm pela ATENÇÃO que a leitura lhes viu: um aspecto que aparece como
    // problema em três leituras e nunca foi escolhido pesa mais do que um que ninguém mediu.
    nunca: lista.filter((a) => a.recortes === 0)
      .sort((a, b) => b.atencao_em - a.atencao_em || String(a.nome).localeCompare(String(b.nome), 'pt')),
    cegos: lista.filter((a) => a.cego)
      .sort((a, b) => b.atencao_em - a.atencao_em || String(a.nome).localeCompare(String(b.nome), 'pt')),
    por_eixo: somarPor('eixo'),
    por_grupo: somarPor('grupo'),
    // A escolha que aponta para um aspecto que a anamnese já não declara. Não se apaga: diz-se.
    desconhecidos: [...desconhecidos.values()].sort((a, b) => b.recortes - a.recortes),
  };
}

module.exports = { VERSAO, construir };
