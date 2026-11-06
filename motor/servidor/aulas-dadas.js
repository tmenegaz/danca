'use strict';

/**
 * aulas-dadas.js — A LISTA DAS AULAS QUE JÁ ACONTECERAM, e o que impede o formulário de voltar.
 *
 * O RELATO (06/11/2026). «Esse formulário para essa aula não tem que estar mais disponível, porque
 * eu já fiz isso. Mas ao mesmo tempo eu preciso de um lugar similar ao que eu tenho com aulas —
 * a página aulas, aonde eu listo as aulas dadas e posso abrir e ver como é que foi preenchido. E
 * tem um bocado de regras que já estão alinhadas […] que diz quando eu posso editar, quando eu
 * posso apagar, como é que tá a regra de proveniência, quem tem autoridade, tem que ter o nome de
 * quem vai mandar gerar um dos entregáveis, tem a parte da senha.»
 *
 * DUAS COISAS, E ELAS SÃO A MESMA LEITURA:
 *
 *   1. a PÁGINA que lista as aulas dadas, no padrão das outras oito listas (`lista-html.js`);
 *   2. o ÍNDICE que a página usa — e que o formulário de lançamento consulta para não oferecer o
 *      formulário de uma aula que já foi lançada.
 *
 * PORQUE O ÍNDICE NÃO É O PACOTE. O pacote publicado (`-dados.json` cifrado) só muda quando a
 * geração corre — dois a três minutos depois do lançamento. Nessa janela, quem recarregava a página
 * via a aula desaparecer e o formulário dela voltar, como se nada tivesse sido gravado. É
 * exactamente o que ela viu, duas vezes. A FONTE (`professores/<prof>/ciclos/<variante>-dados.json`)
 * é escrita no acto do lançamento, em claro; ela é que manda, e é ela que se lê aqui.
 *
 * O QUE ESTA PÁGINA **NÃO** FAZ. Não decifra nada, e por isso não mostra o CONTEÚDO de nenhuma
 * aula: o que se lista é o REGISTRO (qual aula, que dia, quando foi lançada, até quando se ajusta).
 * O que foi preenchido abre-se no formulário, que pede a senha da escola — é lá que a leitura
 * acontece, com a mesma chave de sempre. Uma listagem pública de números e datas não revela o que
 * se observou em nenhuma aula, e o que ela mostra já está declarado no `ciclos.json` do pacote.
 *
 * E NÃO MOSTRA O NOME DE QUEM AJUSTOU. O autor está na fonte (`ajustado_por`), e o registro é
 * dele — mas a lista é servida sem senha, e um nome de pessoa não se publica para dizer que houve
 * um ajuste. O que se diz é QUE houve, e quando; QUEM se lê no documento, com a senha. É a mesma
 * regra do apelido estável (P-12): o que é público é o que não expõe ninguém.
 */

const listas = require('../nucleo/lista-html.js');
const nav = require('../nucleo/nav.js');
const { lerArquivoRemoto } = require('./escrever-ciclo.js');

const DONO_PADRAO = 'tmenegaz';
const REPO_PADRAO = 'danca';
const REF_PADRAO = 'main';

const dois = (n) => String(n == null ? '' : n).padStart(2, '0');

/* A FRASE DA LISTA VAZIA É DELA, e é uma constante porque aparece em dois sítios: na página e na
 * amostra que a checagem de identidade mede (`check-identidade`). Duas cópias divergiriam, e a que
 * ficasse para trás seria a que se lê na tela. */
const VAZIO = 'Nenhuma aula foi realizada até o momento';

/** `2026-11-05` → `05/11/2026`. A data que se lê numa lista é o DIA. */
function dia(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}

/** `2026-11-06T16:42` → `06/11/2026 · 16h42`. O carimbo de um lançamento, legível. */
function dataHora(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]} · ${m[4]}h${m[5]}` : '';
}

/**
 * O CAMINHO DA FONTE, do índice da escola — e não de uma convenção inventada aqui.
 *
 * `indices/escolas/<escola>.json` é DERIVADO e versionado (`tools/gerar-indices.js`), e o
 * `regerar-indices.yml` o refaz a cada push que toque as fontes. Ele traz, por ciclo, o
 * `professor`, o `numero` e a âncora — cujo `id` é o NOME da variante
 * (`ciclo-01-calango-bale-nivel-1-teste-1`), que é também o nome do pacote. É a mesma leitura que
 * a raiz já faz para listar as escolas (`motor/servidor/raiz.js`): uma requisição, e o dado é o
 * que a derivação produz, não uma segunda opinião.
 */
function caminhoDaFonteDoCiclo(ciclo) {
  const id = ciclo && ciclo.ancora && ciclo.ancora.id
    ? String(ciclo.ancora.id)
    : String((ciclo && ciclo.pacote) || '');
  const professor = String((ciclo && ciclo.professor) || '').trim();
  if (!id || !professor) return null;
  if (professor === '.' || professor === '..' || /[\/\\]/.test(professor)) return null;
  if (/[\/\\]/.test(id)) return null;
  return 'professores/' + professor + '/ciclos/' + id + '-dados.json';
}

/** A variante (`calango-bale-nivel-1-teste-1`) a partir do nome do pacote/ciclo. */
const varianteDoId = (id) => {
  const m = /^ciclo-\d{2}-(.+)$/.exec(String(id || ''));
  return m ? m[1] : '';
};

/**
 * O ÍNDICE. Duas leituras por ciclo: a FONTE no repositório (é ela que diz o que foi lançado, e é
 * sempre a do último commit) e o `ciclos.json` do pacote (é ele que DECLARA o prazo de cada aula —
 * §3.1 do ARQUITETURA-AULA — e a página não recalcula o que já vem declarado).
 */
function criarIndiceDeAulas({ token, dono, repo, ref, fetchImpl, lerAsset } = {}) {
  const donoFinal = dono || DONO_PADRAO;
  const repoFinal = repo || REPO_PADRAO;
  const ramo = ref || REF_PADRAO;

  async function lerRepo(caminho) {
    /* SEM TOKEN NÃO SE PEDE NADA. A leitura do repositório é autenticada; sem a token, a chamada
     * voltaria 401 (ou pior, sairia para a rede sem credencial). O `null` é a resposta honesta —
     * «não consegui ler» —, e quem trata distingue-a de «não há nada». */
    if (!token) return null;
    const r = await lerArquivoRemoto({
      token, dono: donoFinal, repo: repoFinal, ref: ramo, caminho, fetchImpl,
    });
    return r && r.existe ? r.texto : null;
  }

  /** O `ciclos.json` publicado de um pacote, ou `null`. Lido do ASSETS: não é rede. */
  async function lerIndiceDoPacote(variante) {
    if (typeof lerAsset !== 'function') return null;
    try {
      const texto = await lerAsset(variante + '/ciclos.json');
      if (!texto) return null;
      const d = JSON.parse(texto);
      const c = d && Array.isArray(d.ciclos) ? d.ciclos[0] : null;
      return c && typeof c === 'object' ? c : null;
    } catch (erro) {
      return null;
    }
  }

  /**
   * AS AULAS DADAS DE UM CICLO — o índice propriamente dito.
   *
   * `lancada_em` é o `ultimo_lancamento` gravado no próprio acto: é o registro, e não uma
   * derivação. Sem ele a aula ainda conta como dada (está em `aulas`), mas a data sai vazia em vez
   * de inventada — um carimbo que não existe não se estima.
   */
  async function porCiclo(cicloDoIndice) {
    /* A PASTA DO SITE NÃO É A VARIANTE INTEIRA (06/11/2026). A variante é `<escola>-<turma>`
     * (`calango-bale-nivel-1-teste-1`) e a pasta que a publicação dá à turma é o que vem DEPOIS
     * do nome da escola (`bale-nivel-1-teste-1`) — é a regra de `turmasDaEscola`, em
     * `tools/montar-publicacao.js`, e a razão de o `ciclo-01-calango` (o pacote-zero) não entrar
     * como turma. Medido ao vivo: um endereço com a variante inteira dá 404, e o «Abrir o
     * lançamento» levava a lugar nenhum. */
    const escolaDoCiclo = String(cicloDoIndice && cicloDoIndice.escola || '').trim();
    const caminho = caminhoDaFonteDoCiclo(cicloDoIndice);
    if (!caminho) return [];
    const id = String((cicloDoIndice.ancora && cicloDoIndice.ancora.id) || cicloDoIndice.pacote || '');
    const variante = varianteDoId(id);
    const texto = await lerRepo(caminho);
    if (!texto) return [];
    let dados;
    try { dados = JSON.parse(texto); } catch (erro) { return []; }
    const aulas = (dados && dados.aulas) || {};
    if (!Object.keys(aulas).length) return [];

    const publicado = await lerIndiceDoPacote(variante);
    const declaradas = new Map();
    ((publicado && publicado.aulas) || []).forEach((a) => {
      if (a && a.n) declaradas.set(dois(a.n), a);
    });

    return Object.keys(aulas).sort().map((nn) => {
      const a = aulas[nn] || {};
      const declarada = declaradas.get(nn) || null;
      return {
        ciclo: String((cicloDoIndice && cicloDoIndice.numero) || dados.ciclo || ''),
        variante,
        professor: String((cicloDoIndice && cicloDoIndice.professor) || dados.professor || ''),
        escola: String(dados.escola || ''),
        pacote: id,
        // A PASTA que o site serve para esta turma — a variante sem o prefixo da escola.
        pasta: escolaDoCiclo && variante.indexOf(escolaDoCiclo + '-') === 0
          ? variante.slice(escolaDoCiclo.length + 1)
          : variante,
        numero: dois(nn),
        data: String(a.data || (declarada && declarada.data) || ''),
        duracao: a.duracao_min != null ? Number(a.duracao_min) : null,
        marco: (declarada && declarada.marco) || null,
        prazo: (declarada && declarada.prazo) || null,
        presentes: Array.isArray(a.presentes) ? a.presentes.length : 0,
        ausentes: Array.isArray(a.ausentes) ? a.ausentes.length : 0,
        lancada_em: String(a.ultimo_lancamento || ''),
        // O AJUSTE É DO CICLO E VEM NA RAIZ (`ajustes`, `ajustado_em`): «o que mudou» é gravado no
        // acto do ajuste, e é ele que diz que esta aula foi corrigida depois de lançada.
        ajustada_em: String((dados && dados.ajustado_em) || ''),
      };
    });
  }

  /** Todas as aulas dadas da escola — uma linha da lista por aula, em todos os ciclos. */
  async function porEscola(escola) {
    const texto = await lerRepo('indices/escolas/' + String(escola || '').trim() + '.json');
    if (!texto) return [];
    let indice;
    try { indice = JSON.parse(texto); } catch (erro) { return []; }
    const ciclos = (indice && Array.isArray(indice.ciclos)) ? indice.ciclos : [];
    const saida = [];
    for (const c of ciclos) {
      if (!c || (c.escola && String(c.escola) !== String(escola))) continue;
      const aulas = await porCiclo(c);
      for (const a of aulas) saida.push(a);
    }
    // A ordem da leitura é a do trabalho: a aula mais recente primeiro.
    return saida.sort((a, b) => String(b.data + b.numero).localeCompare(String(a.data + a.numero)));
  }

  /**
   * O QUE JÁ FOI LANÇADO — a pergunta que o formulário faz, e que a lista também.
   *
   * Devolve, por número de aula, o carimbo. É o mínimo que responde «esta aula já foi dada?» sem
   * entregar conteúdo nenhum. `null` significa «não consegui ler» — e quem pergunta trata `null`
   * como «não sei», nunca como «não há nada»: o lado seguro é o formulário continuar a existir.
   */
  async function lancadas(escola, { ciclo, variante } = {}) {
    const texto = await lerRepo('indices/escolas/' + String(escola || '').trim() + '.json');
    if (!texto) return null;
    let indice;
    try { indice = JSON.parse(texto); } catch (erro) { return null; }
    const ciclos = (indice && Array.isArray(indice.ciclos)) ? indice.ciclos : [];
    const mapa = {};
    for (const c of ciclos) {
      if (!c) continue;
      const id = String((c.ancora && c.ancora.id) || c.pacote || '');
      const daVez = varianteDoId(id);
      if (variante && daVez !== variante) continue;
      if (!variante && ciclo && dois(c.numero) !== dois(ciclo)) continue;
      for (const a of await porCiclo(c)) {
        mapa[ciclo ? a.numero : (dois(a.ciclo) + '/' + a.numero)] = a.lancada_em || 'lançada';
      }
    }
    return mapa;
  }

  return { porEscola, porCiclo, lancadas, varianteDoId };
}

/* ==========================================================================================
 * A PÁGINA
 * ======================================================================================== */

/**
 * O CARTÃO DE UMA AULA DADA. As três caixas são as da casa, na ordem fixa: de quem é, quem fez,
 * quando (`lista-html.caixasDoCartao`). O que muda é o rótulo — «Aula», «Lançada em», «Ajuste».
 */
function itemDaAulaDada(a, agora) {
  const agoraMs = (agora || new Date()).getTime();
  const prazoMs = a.prazo ? Date.parse(a.prazo) : NaN;
  const dentroDoPrazo = Number.isFinite(prazoMs) ? agoraMs <= prazoMs : null;

  /* A SITUAÇÃO É DERIVADA, E O CARTÃO DIZ A REGRA — em vez de deixar descobrir ao clicar.
   *
   * «Tem um bocado de regras que já estão alinhadas […] que diz quando eu posso editar, quando eu
   * posso apagar, como é que tá a regra de proveniência.» A regra do ajuste é a do prazo DA AULA
   * (§3.1 do ARQUITETURA-AULA), declarado pelo índice do ciclo: dentro dele, o lançamento é memória
   * fresca e pode ser corrigido; fora, o registro é definitivo. E o que não existe não se promete:
   * o lançamento de uma aula NÃO se apaga — o que se apaga é o ciclo inteiro, na Produção. */
  const situacao = dentroDoPrazo === null
    ? 'sem prazo declarado no índice'
    : dentroDoPrazo
      ? 'ajustável até ' + dataHora(a.prazo)
      : 'prazo encerrado em ' + dataHora(a.prazo) + ' — registro definitivo';

  const painel = listas.painelDoCartao([
    ['Aula', a.numero + (a.marco ? ' — ' + a.marco : '')],
    ['Turma', a.variante],
    ['Dia', dia(a.data) || '—'],
    ['Duração executada', a.duracao != null ? a.duracao + ' min' : '—'],
    ['Presentes', String(a.presentes)],
    ['Ausentes', String(a.ausentes)],
    ['Lançada em', dataHora(a.lancada_em) || '—'],
    ['Ajuste', a.ajustada_em ? 'ajustada em ' + dataHora(a.ajustada_em) : 'sem ajuste'],
    ['Situação', situacao],
  ], 'O registro não se reescreve: um ajuste é um elo novo, com data e autor. '
    + 'Fora do prazo da aula, o registro é definitivo. O lançamento de uma aula não se apaga '
    + '— apaga-se o ciclo inteiro, nos Bastidores → Produção. '
    + 'Para ler o que foi preenchido, abra o lançamento: o conteúdo pede a senha da escola. '
    + 'Quem manda gerar um entregável assina-o no campo «Gerado por» — o documento sai com o '
    + 'nome e a hora de quem o mandou gerar.');

  const alvo = '/' + (a.pasta || a.variante) + '/lancamento.html'
    + '?ciclo=' + encodeURIComponent(a.ciclo) + '&aula=' + encodeURIComponent(a.numero);

  return {
    nome: 'Aula ' + a.numero + (a.data ? ' — ' + dia(a.data) : ''),
    selo: a.ajustada_em ? 'ajustada' : '',
    seloClasse: 'discreto',
    turma: a.variante,
    professor: a.professor,
    contexto: 'Ciclo ' + a.ciclo + ' · ' + a.variante
      + (a.duracao != null ? ' · ' + a.duracao + ' min' : '')
      + ' · ' + a.presentes + ' presente(s)'
      + (a.ausentes ? ', ' + a.ausentes + ' ausente(s)' : ''),
    caixas: [
      { rotulo: 'Aula', valor: a.numero },
      { rotulo: 'Lançada em', valor: dataHora(a.lancada_em) || '—' },
      { rotulo: 'Situação', valor: dentroDoPrazo === null ? '—'
        : dentroDoPrazo ? 'ajustável' : 'encerrado', painel },
    ],
    acoes: [
      ['Abrir o lançamento', alvo, 'secundario',
        'lê o que foi preenchido e gera os entregáveis — o conteúdo pede a senha da escola'],
    ],
  };
}

/** A PÁGINA, no padrão das outras oito listas. */
async function pagina({ escola, menu, pedido, indice, agora }) {
  const aulas = await indice.porEscola(escola);
  const itens = aulas.map((a) => itemDaAulaDada(a, agora));
  const titulo = 'Aulas dadas';
  /* O AVISO EXPLICA AS LINHAS — e por isso só aparece quando há linhas. Numa lista vazia ele
   * seria uma explicação de uma coisa que não está lá, ao lado da frase que diz que não está. */
  const aviso = aulas.length
    ? 'Cada linha é uma aula que já aconteceu. O que foi preenchido abre no lançamento, com a '
      + 'senha da escola; gerar um entregável pede, além da senha, o nome de quem o manda gerar.'
    : '';
  return {
    titulo,
    html: listas.paginaDeLista({
      titulo,
      subtitulo: aulas.length
        ? escola + ' · ' + (aulas.length === 1 ? '1 aula lançada' : aulas.length + ' aulas lançadas')
        : escola,
      nav: nav.desenhar(menu, pedido, { titulo }) || '',
      itens,
      /* AS MENSAGENS VAZIAS SÃO AS DELA, com as palavras dela (06/11/2026): «será mostrada a
       * mensagem: "Nenhuma aula foi realizada até o momento"». Não se reescreve uma frase que a
       * pesquisadora declarou. */
      vazio: VAZIO,
      aviso,
      campos: ['busca', 'turma'],
      singular: 'aula', plural: 'aulas',
      porPagina: 25,
      dica: 'pelo número, pelo dia ou pela turma',
    }),
  };
}

module.exports = {
  criarIndiceDeAulas, pagina, itemDaAulaDada, caminhoDaFonteDoCiclo, varianteDoId, dia, dataHora,
  VAZIO,
};
