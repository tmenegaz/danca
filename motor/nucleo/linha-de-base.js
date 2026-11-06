'use strict';

/**
 * A LINHA DE BASE — o recorte que o PROFESSOR escolhe (05/11/2026).
 *
 * O QUE ELA SUBSTITUI, E PORQUÊ. A anamnese recolhe o corpo inteiro: **30** campos, em oito
 * blocos (estrutura óssea, flexibilidade, complexo escapulo-umeral, pés e tornozelos, aptidões
 * cognitivo-musicais, força activa, equilíbrio e sustentação, sistema vestibular). O que o plano
 * lia deles eram **quinze**, escolhidos a 02/11/2026 e escritos à mão
 * dentro do conteúdo (`lidoDasAnamneses`, em `plano/conteudo/plano.json`) — a mesma lista para
 * todos os professores, todas as turmas e todos os ciclos. A pesquisadora, 05/11/2026:
 *
 *   «o sistema tratava os aspectos do corpo de forma estática, arbitrando rigidamente 15
 *    elementos fixos. […] a definição do que compõe a Linha de Base do Corpo para um determinado
 *    trabalho passa a ser uma escolha ativa e customizada do professor.»
 *
 * Ela tem razão, e o preço do recorte fixo mede-se: ficavam de fora «Formato anatômico dos
 * joelhos», «Arquitetura do arco plantar», «Impulsão e absorção (allegro)», «Mobilidade e
 * estabilidade da escápula» — que em balé clássico não são acessórios.
 *
 * O QUE **NÃO** É UMA ESCOLHA, e continua a não ser: quais campos EXISTEM. Eles são os da
 * anamnese, e a anamnese é norma (`ARQUITETURA-ANAMNESE.md`). A linha de base escolhe **entre**
 * eles; não inventa nenhum, e um id que não exista é recusado na gravação (ver `normalizar`).
 *
 * O RECORTE É SOBRE **TODA** A ANAMNESE — e a primeira versão disto cortava a musicalidade. Foi um
 * erro meu, e vale registá-lo porque o raciocínio era plausível e estava errado: eu li «o aspecto
 * técnico e a poiesis já são tratados nos verbetes; o novo eixo é o corpo» e concluí que a
 * musicalidade não pertencia ao recorte. Ela corrigiu: «a musicalidade não nasce por geração
 * espontânea, ela é trabalhada, nem tampouco acontece por osmose». O verbete é onde a musicalidade
 * se ENSINA; a anamnese é onde ela se MEDE — complementares, não alternativas. Cortar a segunda por
 * causa do primeiro é tirar do professor a informação de que ele precisa para decidir o que ensinar.
 *
 * Hoje entram os **trinta** campos dos blocos 2 a 9 — nove de `tecnica`, quinze de `funcional` e seis
 * de `musicalidade` — **e os quinze da observação inicial** (05/11/2026). A dimensão viaja com cada
 * um (é ela que diz em que eixo do que se observa o aspecto cai), mas **não filtra**.
 *
 * A OBSERVAÇÃO INICIAL FICOU DE FORA, E ERA O SÍTIO ONDE ELA MEDIA (05/11/2026). A anamnese tem 49
 * nós respondíveis: os 4 da identificação, os 15 da observação inicial (5 elementos e os 10 em que
 * «as cinco posições» se desmembra) e os 30 dos blocos 2 a 9. Este módulo lia os últimos trinta, e
 * só — e a observação inicial é a **porta de entrada**: «a versão rápida do que os nove blocos
 * investigam em detalhe. Não é ensino — verifica o que já existe. Dá o Norte.»
 *
 * O efeito foi medido na tela, e não era cosmético: a pesquisadora marcou «2ª posição — pés» como
 * excelente nas duas alunas, voltou ao passo 3 e a leitura não mudou — porque `cinco-posicoes-2a-pes`
 * vive em `observacaoInicial`, e a linha de base nunca o lia. Um campo que a anamnese pergunta e a
 * linha de base ignora é a pior das duas coisas: o professor responde, o sistema não lê, e nada falha.
 *
 * O QUE CONTINUA DE FORA, e é deliberado: os quatro campos da identificação (`idade`,
 * `conhecimentoPrevio`, `categoria-etaria`, `historico-de-praticas-corporais`). Eles não são aspectos
 * do corpo que se observa — são o contexto do sujeito, e já chegam ao documento pelo envelope. O
 * recorte é sobre o que se MEDE, e uma data de nascimento não se mede em quatro níveis.
 *
 * A SELEÇÃO É GRAVADA COM O NOME, e não só com o id. É deliberado: a linha de base é um registo
 * do que o professor escolheu **naquele momento**, e o passado não se reescreve (P-03). Se a
 * anamnese mudar o nome de um campo, a linha de base mantém o nome com que ele foi escolhido — e
 * os documentos que dela derivaram continuam a dizer a verdade sobre o que se decidiu.
 *
 * Fronteira: puro. Sem `fs`, `path`, `http` nem `process`. O conteúdo da anamnese entra por
 * argumento — quem o lê do disco é o servidor.
 */

/**
 * AS DIMENSÕES DA ANAMNESE — e são TODAS. O nome antigo desta constante era `DIMENSOES_DO_CORPO`,
 * e ela excluía a `musicalidade`. Foi um corte meu, e estava errado (05/11/2026, segunda passagem).
 *
 * O RACIOCÍNIO QUE EU FIZ, E PORQUE NÃO SE SUSTENTA. Eu li a divisão de 05/11 — «o aspecto técnico
 * e a poiesis já são tratados nos verbetes da notação; o novo eixo é o corpo» — e concluí que a
 * musicalidade não pertencia ao recorte. Ela corrigiu, e o argumento é pedagógico:
 *
 *   «se eu tenho uma aluna que vai entrar numa determinada turma e eu vejo na anamnese que ela não
 *    tem musicalidade, eu preciso trabalhar a musicalidade. A musicalidade não nasce por geração
 *    espontânea, ela é trabalhada, nem tampouco acontece por osmose. […] O cuidado que eu vou ter
 *    na hora de elaborar a parte musical, que é lá no verbete, é parte a partir do meu olhar sobre
 *    a aluna na anamnese.»
 *
 * Ou seja: o verbete é onde a musicalidade SE ENSINA; a anamnese é onde ela se MEDE. As duas coisas
 * são complementares, não alternativas — e cortar a segunda por causa da primeira é tirar do
 * professor a informação de que ele precisa para decidir o que ensinar. Uma lacuna musical é
 * exactamente o tipo de coisa que a linha de base tem de poder registrar.
 *
 * O QUE FICA DE PÉ: a anamnese é a norma dos campos que existem (nenhum se inventa), e a linha de
 * base continua a ser um RECORTE — o professor escolhe entre os trinta, e não é obrigado a querer
 * todos. O que não se faz é cortar antes dele escolher.
 */
const DIMENSOES_DA_ANAMNESE = ['tecnica', 'funcional', 'musicalidade'];

/** O rótulo do eixo, para a tela poder agrupar. Vem de `eixos.js` — uma taxonomia só no projecto,
 *  e o corpo/técnica/poiesis é a mesma dos documentos. Repetida aqui em forma mínima porque o
 *  núcleo não deve depender do módulo dos eixos para uma etiqueta. */
const ROTULO_DA_DIMENSAO = {
  tecnica: 'Técnica',
  funcional: 'Funcional',
  musicalidade: 'Musicalidade',
};

/** O id a partir do nome — a mesma regra do `slugificar`/`idDe`, repetida porque o núcleo não
 *  conhece o servidor (e uma dependência invertida partiria essa fronteira). */
function idDe(nome) {
  return String(nome == null ? '' : nome)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const semAcento = (t) => String(t == null ? '' : t)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/**
 * AS OPÇÕES QUE A ANAMNESE DECLARA NUMA FRASE — `forma: "Bom · razoável · precisa desenvolver"`.
 *
 * A observação inicial não tem `opcoes`: ela declara a RÉGUA como texto, e é a mesma régua para
 * todos os elementos. Ler a frase em vez de a repetir num segundo sítio é o que impede as duas
 * listas de divergirem quando o conteúdo mudar — a mesma regra do `referencia` do bloco 3.
 */
function opcoesDaForma(forma) {
  return String(forma == null ? '' : forma)
    .split('·')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * OS CAMPOS DA OBSERVAÇÃO INICIAL — a «porta de entrada» da anamnese, e ela é MEDÍVEL.
 *
 * Um elemento que DESMEMBRA («as cinco posições agrupa e desmembra, e por isso não responde por si»,
 * §3.1 do `ARQUITETURA-ANAMNESE.md`) não entra: entram os dez subitens dele. Os outros cinco entram
 * por si. São quinze, e é a conta da norma (`5 + 10`).
 *
 * A dimensão vem da própria anamnese quando ela a declara; onde não declara, é da musicalidade o
 * elemento que a anamnese chama «a musicalidade», e o resto é técnica — o corpo e a sua mecânica,
 * que é o que esta porta mede. A `forma` é a régua; a primeira opção é o melhor estado, como nos
 * blocos.
 */
function camposDaObservacaoInicial(conteudo) {
  const observacao = conteudo && conteudo.observacaoInicial;
  const elementos = (observacao && Array.isArray(observacao.elementos)) ? observacao.elementos : [];
  /* OS APOIOS SÃO DA OBSERVAÇÃO INICIAL, E NÃO DE CADA ELEMENTO. A anamnese declara-os uma vez
   * (`desdobramentos`: «com toque», «com a barra como apoio», «por consciência própria»), e um
   * elemento pode recusá-los (`semDesdobramentos` — «a musicalidade»). Sem esta lista, a leitura
   * não sabe distinguir a ESCALA do APOIO dentro da resposta, e junta os dois num só nível —
   * ver `nivelDaResposta`. */
  const apoios = (observacao && Array.isArray(observacao.desdobramentos))
    ? observacao.desdobramentos.filter((d) => d && d.id)
      .map((d) => ({ id: String(d.id), rotulo: String(d.forma || d.id) }))
    : [];
  const saida = [];
  const vistos = new Set();
  for (const elemento of elementos) {
    if (!elemento || !elemento.id) continue;
    const opcoes = opcoesDaForma(elemento.forma);
    // Um elemento sem régua declarada não se mede, e medi-lo seria inventar-lhe níveis.
    if (!opcoes.length) continue;
    const dimensao = String(elemento.dimensao || (elemento.id === 'musicalidade' ? 'musicalidade' : 'tecnica'));
    const grupo = String(elemento.elemento || elemento.id);
    const subitens = Array.isArray(elemento.subitens) ? elemento.subitens : [];
    const itens = subitens.length ? subitens : [elemento];
    for (const item of itens) {
      if (!item || !item.id || vistos.has(String(item.id))) continue;
      vistos.add(String(item.id));
      saida.push({
        id: String(item.id),
        nome: String(item.elemento || item.campo || item.id),
        // A observação inicial não é um bloco: é a porta que os nove blocos aprofundam.
        bloco: null,
        grupo: grupo,
        dimensao: dimensao,
        eixo: ROTULO_DA_DIMENSAO[dimensao] || '',
        opcoes: opcoes.map(String),
        referencia: opcoes[0],
        apoios: elemento.semDesdobramentos ? [] : apoios,
      });
    }
  }
  return saida;
}

/**
 * OS CAMPOS DO CORPO QUE A ANAMNESE OFERECE — a lista de onde o professor escolhe.
 *
 * A ORDEM É A DA ANAMNESE, e não alfabética: a observação inicial primeiro (é a porta de entrada),
 * depois os blocos 2 a 9 na ordem em que o professor os percorre. Uma lista que muda de ordem entre
 * a anamnese e a produção obriga a procurar duas vezes o mesmo campo.
 *
 * `opcoes` vem junto porque é a RÉGUA: a primeira opção é o melhor estado que a anamnese
 * conhece, e é por ela que a agregação distingue «ponto de atenção» de «excelência». Sem as
 * opções, o mesmo dado não se lê.
 */
function camposDisponiveis(conteudo) {
  const blocos = (conteudo && Array.isArray(conteudo.blocos)) ? conteudo.blocos : [];
  const saida = camposDaObservacaoInicial(conteudo);
  for (const bloco of blocos) {
    if (!bloco || !Array.isArray(bloco.campos)) continue;
    for (const campo of bloco.campos) {
      if (!campo || !campo.id) continue;
      // A dimensão é DO CAMPO quando ele a declara (o bloco 9 mistura funcional e musicalidade) e
      // do bloco quando não. Ler só a do bloco poria «Estabilidade vestibular» fora do corpo e
      // «Espiral / rotação de tronco» dentro — os dois errados, e os dois em silêncio.
      // A DIMENSÃO É DO CAMPO QUANDO ELE A DECLARA (o bloco 9 mistura `funcional` e `musicalidade`)
      // e do bloco quando não. Ler só a do bloco poria «Estabilidade vestibular» fora do corpo e
      // «Espiral / rotação de tronco» dentro — os dois errados, e os dois em silêncio.
      const dimensao = String(campo.dimensao || bloco.dimensao || '');
      const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes
        : Array.isArray(campo.valores) ? campo.valores : [];
      saida.push({
        id: String(campo.id),
        nome: String(campo.campo || campo.id),
        bloco: bloco.bloco == null ? null : bloco.bloco,
        grupo: String(bloco.titulo || ''),
        // A DIMENSÃO VAI JUNTO, e não é etiqueta decorativa: é ela que diz ao professor em que eixo
        // do que se observa cada aspecto cai — o corpo, a técnica ou a poiesis. A tela agrupa por
        // ela, e o documento do plano imprime-a. O que ela NÃO faz é excluir.
        dimensao: dimensao,
        eixo: ROTULO_DA_DIMENSAO[dimensao] || '',
        opcoes: opcoes.map(String),
        // A REFERÊNCIA é o BOM ESTADO declarado — e NÃO se deduz da posição (05/11/2026).
        //
        // O código supunha que a primeira opção era sempre o melhor nível, e supunha-o por
        // escrito: «a primeira é o melhor estado, e quem não está nela é o que se vai olhar».
        // É verdade em 29 dos 30 campos — e é FALSO em «Mobilidade da coluna cervical e cabeça»,
        // cuja lista começa por «Rotação/flexão/extensão lateral limitada». Com a suposição, uma
        // aluna com a coluna PERFEITA era contada como ponto de atenção. Não se adivinha: o
        // conteúdo declara `referencia` onde a ordem não é bom→mau, e a ausência dela quer dizer
        // «é a primeira».
        referencia: campo.referencia ? String(campo.referencia) : (opcoes.length ? String(opcoes[0]) : null),
        // Os campos dos blocos não têm desdobramento: a resposta deles é o valor, e só.
        apoios: [],
      });
    }
  }
  return saida;
}

/** O SENTINEL da terceira via da escala, escrito pela porta: «não foi medido». */
const NAO_MEDIDO = 'não foi medido';

/**
 * O NÍVEL DE UMA RESPOSTA — a ESCALA, e não a resposta inteira (05/11/2026).
 *
 * O DEFEITO QUE ISTO FECHA, medido nos dados dela. A observação inicial grava a resposta como uma
 * LISTA: `[escala]` ou `[escala, apoio]` — «Bom» e «com a barra como apoio» são duas perguntas
 * diferentes da mesma resposta (a `porta/index.html` grava as duas no mesmo `valor`, e a `ficha.js`
 * já as separa pelo pool de desdobramentos). A leitura da linha de base juntava as duas com
 * `join(' · ')` e tratava o resultado como NÍVEL. Assim, «Bom · com-barra» nunca é igual ao melhor
 * nível («Bom»), e um aspecto em que TODAS estavam no melhor nível entrava como ponto de atenção.
 *
 * Medido no `calango`, 05/11/2026, com as duas alunas:
 *
 *   cinco-posicoes-2a-pes   → «2 de 2 em «Bom · consciencia-propria»»   (as duas no melhor nível!)
 *   cinco-posicoes-2a-bracos→ «1 de 2 em «Bom · consciencia-propria» · 1 de 2 em «Bom · com-toque»»
 *
 * Os dois iam para «o que precisa de ser trabalhado», e «o que já é bom» ficava vazio. Não era a
 * definição de excelência a falhar — era o nível a estar poluído.
 *
 * A REGRA É A MESMA DA `ficha.js` (`valoresRespondidos`), e não uma segunda: a escala é o primeiro
 * elemento que NÃO pertence ao pool de apoios. Duas leituras da mesma resposta divergem no primeiro
 * apoio novo, e a que fica a mentir é a que se lê no ecrã.
 *
 * `não foi medido` NÃO É UM NÍVEL. É a declaração de que aquele aspecto não se mediu, e contá-lo
 * como «abaixo do melhor» transformava uma abstenção declarada num ponto de atenção — o professor
 * diz «não medi» e o sistema responde «precisa de ser trabalhado». Vai contado à parte, e o texto
 * diz quantos não foram medidos.
 */
function nivelDaResposta(registo, campo) {
  const cru = (registo && typeof registo === 'object' && !Array.isArray(registo) && 'valor' in registo)
    ? registo.valor : registo;
  if (cru === undefined || cru === null) return { nivel: null, apoios: [], naoMedido: false };
  const lista = Array.isArray(cru) ? cru : [cru];
  const textos = lista
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter(Boolean);
  if (!textos.length) return { nivel: null, apoios: [], naoMedido: false };
  if (textos.indexOf(NAO_MEDIDO) !== -1) return { nivel: null, apoios: [], naoMedido: true };

  const pool = new Map(((campo && campo.apoios) || []).map((a) => [String(a.id), String(a.rotulo)]));
  const apoios = textos.filter((t) => pool.has(t));
  // A escala é o que NÃO é apoio. Um registo sem escala (só apoio, ou texto livre) não tem nível:
  // quem o lê não pode classificá-lo, e inventar «o primeiro que aparecer» seria adivinhar.
  const nivel = textos.find((t) => !pool.has(t)) || null;
  return { nivel, apoios, naoMedido: false };
}

/** O rótulo de um apoio, para a tela não mostrar o slug (`com-barra` → «com a barra como apoio»). */
function rotuloDoApoio(campo, id) {
  const achado = ((campo && campo.apoios) || []).find((a) => String(a.id) === String(id));
  return achado ? String(achado.rotulo) : String(id);
}

/**
 * NORMALIZAR E VALIDAR UMA LINHA DE BASE.
 *
 * Devolve `{ ok, linha, erros }` — nunca lança. A validação é do SERVIDOR e isto é o servidor a
 * decidir: a tela é conveniência, e um cliente que mande um id inventado tem de receber a recusa
 * com o nome do campo, não um documento a apontar para nada.
 *
 * O QUE É RECUSADO, e porquê:
 *   · sem nome — a linha de base é referida por nome no plano de ensino («importe a linha de
 *     base X»), e uma sem nome não se pode importar;
 *   · sem campos — uma linha de base vazia produz um aspecto físico vazio, e o professor
 *     carregaria o botão para não ver nada. **Excepto em RASCUNHO** (05/11/2026): o passo 1 da
 *     tela grava a identificação antes de o recorte existir (o recorte é o passo 4), e a leitura
 *     do passo 3 precisa de um registo onde ficar. O rascunho é o estado declarado de quem ainda
 *     não escolheu — e não se confunde com a linha pronta: `enviar` recusa-o;
 *   · campo desconhecido — a anamnese é a norma, e um id que não está nela é um erro de quem
 *     montou o pedido (ou uma anamnese que mudou por baixo). Recusa-se com a lista dos que não
 *     casaram.
 */
function normalizar(entrada, disponiveis, quando) {
  const corpo = entrada && typeof entrada === 'object' ? entrada : {};
  const lista = Array.isArray(disponiveis) ? disponiveis : [];
  const porId = new Map(lista.map((c) => [String(c.id), c]));

  const nome = String(corpo.nome == null ? '' : corpo.nome).trim();
  const erros = [];
  if (!nome) erros.push('informe o nome da linha de base');

  // OS CAMPOS CHEGAM COMO IDS. Um pedido antigo pode trazer `{id, nome}` — o nome é ignorado de
  // propósito: ele é lido da anamnese, e aceitá-lo do cliente deixaria a linha de base dizer um
  // nome que a anamnese não diz.
  const pedidos = (Array.isArray(corpo.campos) ? corpo.campos : [])
    .map((c) => (c && typeof c === 'object' ? c.id : c))
    .map((c) => String(c == null ? '' : c).trim())
    .filter(Boolean);

  const vistos = new Set();
  const campos = [];
  const desconhecidos = [];
  for (const id of pedidos) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    const achado = porId.get(id);
    if (!achado) { desconhecidos.push(id); continue; }
    campos.push({ id: achado.id, nome: achado.nome, grupo: achado.grupo });
  }
  if (desconhecidos.length) {
    erros.push('campo(s) que a anamnese não tem: ' + desconhecidos.join(', '));
  }
  /* O RASCUNHO É DECLARADO, E NÃO DEDUZIDO DO VAZIO (05/11/2026). Um pedido sem campos e sem
   * `rascunho: true` continua a ser recusado: a ausência do recorte pode ser um cliente que se
   * enganou, e aceitá-la em silêncio daria uma linha de base que parece pronta. Quem grava o passo
   * 1 diz que está a gravar um rascunho; quem grava o passo 4 não o diz, e aí o recorte é exigido.
   *
   * A RECUSA MUDA DE TEXTO CONFORME A ORIGEM, e a distinção é factual: em EDIÇÃO o pedido traz
   * `id` (a linha de base já existe), e em CRIAÇÃO não traz. Uma criação sem campos e sem o selo é
   * a assinatura de uma ABA ANTIGA — a página carregada antes de uma actualização do sistema manda
   * o corpo de ontem, e o professor vê «escolha pelo menos um aspecto do corpo» num passo que não
   * tem aspectos para escolher. Dizer-lhe «recarregue» custa uma linha e poupa a caça ao defeito
   * que não existe (medido a 05/11/2026, minutos depois do deploy). */
  const rascunho = corpo.rascunho === true;
  const pedidoTrazId = String(corpo.id == null ? '' : corpo.id).trim() !== '';
  if (!campos.length && !rascunho) {
    erros.push(pedidoTrazId
      ? 'escolha pelo menos um aspecto do corpo'
      : 'esta página é anterior a uma actualização do sistema: recarregue-a (Ctrl+Shift+R) e grave '
        + 'outra vez — o primeiro passo grava um rascunho, e este pedido não o declara');
  }

  const id = String(corpo.id == null ? '' : corpo.id).trim() || idDe(nome);
  if (!id) erros.push('o nome da linha de base não produz um identificador válido');

  // A ORDEM DOS CAMPOS É A DA ANAMNESE, não a do clique. Duas linhas de base com os mesmos
  // campos e ordens diferentes dariam duas tabelas diferentes para o mesmo recorte — e o
  // professor veria a mesma coisa em duas ordens, sem saber porquê.
  campos.sort((a, b) => {
    const ia = lista.findIndex((c) => c.id === a.id);
    const ib = lista.findIndex((c) => c.id === b.id);
    return ia - ib;
  });

  if (erros.length) return { ok: false, erros, linha: null };

  const professor = String(corpo.professor == null ? '' : corpo.professor).trim();
  /* AS ALUNAS, E NÃO A TURMA (05/11/2026) — a correcção de desenho que a pesquisadora fez.
   *
   * «Quando eu vou olhar o corpo da linha de base, eu tenho que saber de quais ALUNAS eu estou
   * olhando esse corpo. E não da turma. Porque a turma não nasce com alunas: a turma só vai ter
   * alunas quando eu fizer isso na curadoria.»
   *
   * Ela está certa, e o argumento é de tempo, não de gosto: uma aluna NOVA chega na quinta aula de
   * um ciclo já em curso, e precisa de entrar no recorte antes de a curadoria a atribuir a uma
   * turma. Se a linha de base apontasse para a turma, essa aluna não teria onde caber — e o
   * professor ficaria sem poder dizer «o corpo que eu vou observar inclui esta».
   *
   * A lista é de APELIDOS, e é ela que decide QUAIS anamneses a agregação lê. A turma entra depois,
   * na curadoria. */
  const alunas = (Array.isArray(corpo.alunas) ? corpo.alunas : [])
    .map((a) => String(a == null ? '' : a).trim()).filter(Boolean);
  const semRepetir = [];
  for (const a of alunas) if (semRepetir.indexOf(a) === -1) semRepetir.push(a);

  const linha = {
    id,
    nome,
    professor: professor || null,
    alunas: semRepetir,
    campos,
    atualizada_em: String(quando == null ? '' : quando) || null,
  };
  /* O SELO SÓ EXISTE ENQUANTO FALTA O RECORTE. Uma linha que já tem campos é uma linha pronta, e
   * arrastar o selo antigo faria a tela dizer «rascunho» sobre um recorte que já se decidiu. */
  if (rascunho && !campos.length) linha.rascunho = true;
  return { ok: true, erros: [], linha };
}

/**
 * A FRASE QUE DIZ COMO O GRUPO ESTÁ NUM ASPECTO — «2 de 3 em «Bom»», e mais nada inventado.
 *
 * O APOIO ENTRA QUANDO É UM SÓ, e é a diferença entre «Bom» e «Bom com a barra como apoio»: as
 * duas observações têm o mesmo nível e não são a mesma coisa. Ele entra como PARÊNTESE porque não
 * é um nível — é o modo como se observou, e por isso não fragmenta a contagem (é o defeito que a
 * 05/11/2026 corrigiu: `com-barra` juntava-se ao nível com `join(' · ')` e o slug ia para o ecrã).
 * Quando os apoios diferem dentro do mesmo nível, não se escolhe um: mostra-se o nível, e a
 * diferença não é do grupo.
 *
 * «NÃO MEDIDO» FECHA A FRASE, e não é um nível: é a abstenção declarada, contada à parte.
 */
function textoDosNiveis(niveis, opcoes, quantas, campo, naoMedidos) {
  const partes = [...niveis.entries()]
    .sort((a, b) => {
      const ia = opcoes.indexOf(a[0]);
      const ib = opcoes.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(([nivel, d]) => {
      const apoios = [...d.apoios];
      let apoio = '';
      if (apoios.length === 1) {
        const rotulo = rotuloDoApoio(campo, apoios[0]);
        const minusculo = rotulo.charAt(0).toLowerCase() + rotulo.slice(1);
        apoio = ' (' + minusculo + ')';
      }
      return d.quantas + ' de ' + quantas + ' em «' + nivel + '»' + apoio;
    });
  if (naoMedidos) partes.push(naoMedidos + (naoMedidos === 1 ? ' não medido' : ' não medidos'));
  return partes.join(' · ');
}

/**
 * A LEITURA DO QUE A TURMA MOSTRA EM CADA CAMPO ESCOLHIDO — a agregação que a Produção exibe.
 *
 * `anamneses` é uma lista de `{ aluna, respostas }`, onde `respostas` é o mapa id → valor do
 * envelope da anamnese. Nada aqui interpreta o nível: a RÉGUA é a ordem das opções que a
 * própria anamnese declara, e o «ponto de atenção» é o que **não** está na primeira.
 *
 * PORQUE É PRECISO AGREGAR, E NÃO LISTAR POR ALUNA. É a mesma razão de 04/11/2026, quando a
 * listagem por aluna saiu da aula: trinta alunas × vinte e quatro campos seriam setecentas e
 * vinte linhas para ler antes da primeira marca. O que o plano precisa de saber é o que a TURMA
 * mostra — e o que é de cada uma vive no Plano de Observação, que é onde se declara.
 *
 * `semRegisto` NÃO É UM ERRO: é um facto a dizer. Um campo que ninguém preencheu não se julga, e
 * escondê-lo faria a linha de base parecer mais completa do que é.
 */
function agregar(linha, disponiveis, anamneses) {
  const lista = Array.isArray(disponiveis) ? disponiveis : [];
  const porId = new Map(lista.map((c) => [String(c.id), c]));
  const alunos = (Array.isArray(anamneses) ? anamneses : [])
    .filter((a) => a && a.respostas && typeof a.respostas === 'object');

  const linhas = [];
  const semRegisto = [];
  for (const escolhido of (linha && Array.isArray(linha.campos) ? linha.campos : [])) {
    const campo = porId.get(String(escolhido.id)) || null;
    const nome = String((campo && campo.nome) || escolhido.nome || escolhido.id);
    const opcoes = campo ? campo.opcoes : [];
    // A MESMA REGRA da `classificar`: o bom estado é o declarado, e só na falta dele o primeiro.
    const melhor = campo
      ? (campo.referencia ? String(campo.referencia).trim()
        : (opcoes.length ? String(opcoes[0]).trim() : null))
      : null;

    const niveis = new Map();
    let quantas = 0;
    let naoMedidos = 0;
    for (const aluno of alunos) {
      const lido = nivelDaResposta(aluno.respostas[escolhido.id], campo);
      if (lido.naoMedido) { naoMedidos += 1; continue; }
      // SEM NÍVEL NÃO SE CLASSIFICA: um registo sem escala não é «abaixo do melhor» nem «no
      // melhor» — é um dado que não diz o que se procura.
      if (lido.nivel === null) continue;
      const atual = niveis.get(lido.nivel) || { quantas: 0, apoios: new Set() };
      atual.quantas += 1;
      for (const a of lido.apoios) atual.apoios.add(a);
      niveis.set(lido.nivel, atual);
      quantas += 1;
    }
    if (!quantas) { semRegisto.push(nome); continue; }

    const excelente = melhor !== null && [...niveis.keys()].some((n) => n === melhor);
    const atencao = melhor !== null && [...niveis.keys()].some((n) => n !== melhor);

    linhas.push({
      id: escolhido.id,
      nome,
      grupo: String((campo && campo.grupo) || escolhido.grupo || ''),
      // O EIXO vai junto porque é ele que dá sentido ao número: «2 de 3 em «Precisa desenvolver»»
      // diz coisas diferentes conforme o aspecto seja do corpo, da técnica ou da poiesis.
      eixo: String((campo && campo.eixo) || escolhido.eixo || ''),
      quantas,
      naoMedidos,
      // A ORDEM DAS ENTRADAS é a das opções (melhor primeiro), e não a da contagem: a leitura é
      // «3 em Alta · 1 em Média», que se lê de cima para baixo como a régua.
      niveis: [...niveis.entries()].sort((a, b) => {
        const ia = opcoes.indexOf(a[0]);
        const ib = opcoes.indexOf(b[0]);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }).map(([nivel, d]) => ({ nivel, quantas: d.quantas, apoios: [...d.apoios] })),
      texto: textoDosNiveis(niveis, opcoes, quantas, campo, naoMedidos),
      excelente,
      atencao,
    });
  }

  // OS PONTOS DE ATENÇÃO PRIMEIRO: é o que o professor precisa de ver para decidir o recorte.
  // O `sort` é estável, e dentro de cada metade a ordem é a da anamnese.
  const ordenadas = linhas.slice().sort((a, b) => (b.atencao ? 1 : 0) - (a.atencao ? 1 : 0));
  return {
    linhas: ordenadas,
    semRegisto,
    alunos: alunos.length,
    atencao: linhas.filter((l) => l.atencao).length,
    // A EXCELÊNCIA PURA, e o nome diz o que é: há campos em que a turma está toda no melhor nível
    // E há campos em que uma aluna está lá e outra não. Só os primeiros são «todos bem» — e são
    // esses que o professor pode querer vigiar, na autonomia que a pesquisa de 05/11/2026 deu.
    soExcelente: linhas.filter((l) => l.excelente && !l.atencao).length,
  };
}

/**
 * QUANDO É QUE A LINHA DE BASE FICOU VELHA — o passo 1 da cascata de revalidação.
 *
 * A REGRA É A MESMA DO PO, e a mesma forma: nada se marca com um campo, tudo se pergunta de
 * novo. «A anamnese de alguma aluna da turma é mais recente do que esta linha de base?» — se for,
 * o recorte foi decidido sobre um retrato que já não é o retrato, e a Produção pede a reavaliação
 * antes de o plano voltar a ser revalidado.
 *
 * A ORDEM É A DA PESQUISA: Produção (o recorte) → Plano de Ensino → Plano de Observação. O PO
 * observa o que o PE fixou; o PE fixa um recorte do corpo. Revalidar o PO sobre um recorte velho
 * é consolidar uma linha de base sobre um retrato que já não vale.
 *
 * `carimbos` é a lista das datas das anamneses que contam (as das alunas da turma). Devolve o
 * carimbo mais recente que a linha de base ainda não viu, ou `null`.
 */
function envelheceu(linha, carimbos) {
  if (!linha) return null;
  const decidida = String(linha.atualizada_em || '').trim();
  const datas = (Array.isArray(carimbos) ? carimbos : [])
    .map((c) => String(c == null ? '' : c).trim()).filter(Boolean).sort();
  if (!datas.length) return null;
  const maisRecente = datas[datas.length - 1];
  // Sem data de decisão não se afirma que está velha: afirmá-lo marcaria toda a linha de base
  // antiga para sempre, e um aviso que nunca cai deixa de se ler.
  if (!decidida) return null;
  return maisRecente > decidida ? maisRecente : null;
}

/**
 * A CLASSIFICAÇÃO DO QUE O GRUPO MOSTRA — os quatro eixos do passo 3 (05/11/2026).
 *
 * PORQUE É UMA FUNÇÃO NOVA E NÃO `agregar`. `agregar` lê o RECORTE já escolhido (os campos da
 * linha de base). Isto lê **todos** os campos que as anamneses têm resposta — e tem de ser assim
 * porque vem ANTES da escolha: o professor lê o panorama, e só depois decide o recorte. Uma função
 * que lesse o recorte aqui daria uma tabela vazia na primeira vez, que é exactamente quando ela é
 * necessária.
 *
 * OS QUATRO EIXOS, e cada um responde a uma pergunta diferente:
 *
 *   · `atencao` — «o que precisa de ser trabalhado». Aspectos em que ALGUMA aluna não está no
 *     melhor nível que a anamnese conhece. É o que ela descreveu como «o que precisa melhorar e o
 *     que está ruim»: um só corpo fora do melhor nível já é motivo para olhar.
 *   · `excelencia` — «o que já é bom». Aspectos em que **ALGUMA** aluna está no melhor nível que a
 *     anamnese conhece — o que cada uma já tem de bom, e não o que a turma inteira acertou.
 *     (05/11/2026, decisão dela: «esse aqui é para colocar o que é individual de cada uma […] é o
 *     que já é bom de cada aluna». A definição anterior era «todas», e numa turma em que as duas
 *     diferem em quase tudo o bloco ficava vazio — a aluna com o tendu bom não aparecia em sítio
 *     nenhum com esse mérito. Quem quer a leitura «todos bem» lê `noMelhorNivel`, que o item
 *     continua a declarar.)
 *   · `musicalidade` — o panorama completo dos campos do eixo da poiesis. Separado porque ela o
 *     pediu separado («e sobre o ponto de vista da musicalidade também»), e porque a decisão
 *     pedagógica que ele informa é outra: uma lacuna musical não se corrige com a mesma aula que
 *     uma lacuna de força.
 *   · `comuns` — os traços PARTILHADOS: aspectos em que todas as que responderam deram a MESMA
 *     resposta, seja ela boa ou má. É o «todos têm o arco do pé semelhante». Não é um juízo: é o
 *     que o grupo tem em comum, e serve para o professor reconhecer a turma que vai ter à frente.
 *
 * O QUE NÃO ENTRA EM NENHUM: os campos que ninguém respondeu. Vão para `semRegisto`, com o nome,
 * porque um aspecto que a anamnese não preencheu não é um aspecto que está bem.
 */
function classificar(disponiveis, anamneses) {
  const lista = Array.isArray(disponiveis) ? disponiveis : [];
  const alunos = (Array.isArray(anamneses) ? anamneses : [])
    .filter((a) => a && a.respostas && typeof a.respostas === 'object');

  const atencao = [];
  const excelencia = [];
  const musicalidade = [];
  const comuns = [];
  const semRegisto = [];

  for (const campo of lista) {
    const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes : [];
    /* O MELHOR NÍVEL É O DECLARADO, e só na falta dele é o primeiro. Ver `camposDisponiveis`: há
     * um campo cuja lista começa pela limitação, e deduzi-lo da posição classificava uma aluna
     * saudável como ponto de atenção. */
    const melhor = campo.referencia ? String(campo.referencia).trim()
      : (opcoes.length ? String(opcoes[0]).trim() : null);
    const niveis = new Map();
    let quantas = 0;
    let naoMedidos = 0;
    for (const aluno of alunos) {
      const lido = nivelDaResposta(aluno.respostas[campo.id], campo);
      if (lido.naoMedido) { naoMedidos += 1; continue; }
      if (lido.nivel === null) continue;
      const atual = niveis.get(lido.nivel) || { quantas: 0, apoios: new Set() };
      atual.quantas += 1;
      for (const a of lido.apoios) atual.apoios.add(a);
      niveis.set(lido.nivel, atual);
      quantas += 1;
    }
    if (!quantas) { semRegisto.push({ id: campo.id, nome: campo.nome }); continue; }

    // A ORDEM DAS ENTRADAS É A DAS OPÇÕES (melhor primeiro), e não a da contagem: a leitura corre
    // de cima para baixo como a régua.
    const ordenados = [...niveis.entries()].sort((a, b) => {
      const ia = opcoes.indexOf(a[0]);
      const ib = opcoes.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const item = {
      id: campo.id,
      nome: campo.nome,
      eixo: campo.eixo || '',
      grupo: campo.grupo || '',
      dimensao: campo.dimensao || '',
      quantas,
      naoMedidos,
      // O TEXTO diz quantas em cada nível. Sem ele, «ponto de atenção» numa turma de trinta e numa
      // de uma seriam a mesma frase — e não são a mesma coisa.
      texto: textoDosNiveis(niveis, opcoes, quantas, campo, naoMedidos),
      unanimidade: niveis.size === 1,
      nivelUnico: niveis.size === 1 ? ordenados[0][0] : null,
      // O MESMO NÍVEL EM TODAS, e é isto que «em comum» quer dizer: a ESTADO, não o modo de
      // observação. «Bom com a barra» e «Bom por consciência própria» são o mesmo nível, e uma
      // turma em que as duas estão «Bom» está bem nas duas — o apoio diz como se viu, não quanto.
      noMelhorNivel: melhor !== null && [...niveis.keys()].every((n) => n === melhor),
      temAbaixoDoMelhor: melhor !== null && [...niveis.keys()].some((n) => n !== melhor),
      // «JÁ É BOM» QUER DIZER **ALGUMA** NO MELHOR NÍVEL (05/11/2026, decisão dela).
      //
      // A definição era «todas», e o efeito medido foi o contrário do que ela esperava: numa turma
      // em que as duas diferem em quase tudo, o bloco ficava vazio — e a aluna que tinha o tendu
      // bom «por consciência própria» não aparecia em sítio nenhum com esse mérito. Ela, ao ler a
      // tela: «esse aqui é para colocar o que é individual de cada uma. […] é o que já é bom de
      // cada aluna. Eu vou listar o aspecto, o eixo e como está o grupo».
      //
      // O bloco passa a responder «onde há algo bom para preservar», e não «onde o grupo está
      // inteiro bem». As duas leituras continuam a existir: `noMelhorNivel` guarda a segunda, e
      // `noMelhor` diz QUEM — a tela mostra a primeira sem nomear ninguém.
      algumNoMelhor: melhor !== null && [...niveis.keys()].some((n) => n === melhor),
      noMelhorNivel: melhor !== null && [...niveis.keys()].every((n) => n === melhor),
      // QUEM ESTÁ NO MELHOR NÍVEL, NOMEADO — a leitura individual que a lista do grupo não dava.
      // Vive dentro de cada aspecto porque é aí que ela se lê: «a Ana está bem aqui» sem sair da
      // linha que diz que a turma tem um ponto de atenção neste aspecto.
      noMelhor: alunos
        .filter((al) => nivelDaResposta(al.respostas[campo.id], campo).nivel === melhor)
        .map((al) => String(al.aluna || '')),
    };

    // Um campo pode estar em MAIS de um eixo, e isso é de propósito: «todos com o arco do pé igual»
    // é um traço comum E, se o arco for o melhor nível, é excelência. As quatro listas são quatro
    // PERGUNTAS ao mesmo dado, não quatro gavetas que se excluem.
    if (item.temAbaixoDoMelhor) atencao.push(item);
    if (item.algumNoMelhor) excelencia.push(item);
    if (item.dimensao === 'musicalidade') musicalidade.push(item);
    if (item.unanimidade) comuns.push(item);
  }

  // OS PONTOS DE ATENÇÃO PRIMEIRO DENTRO DE CADA LISTA — é o que se lê para decidir.
  const porAtencao = (a, b) => (b.temAbaixoDoMelhor ? 1 : 0) - (a.temAbaixoDoMelhor ? 1 : 0);
  atencao.sort(porAtencao);

  return { atencao, excelencia, musicalidade, comuns, semRegisto, alunos: alunos.length };
}

/**
 * A ETIQUETA «NOVO» — e ela é de PROVENIÊNCIA, não de estado (05/11/2026).
 *
 * A REGRA, nas palavras dela: a etiqueta aparece quando há uma anamnese que ainda não foi lida por
 * nenhuma linha de base; sai quando a aluna é incluída numa linha de base gravada; e volta a
 * aparecer quando chega uma anamnese nova.
 *
 * É a MESMA FORMA da revalidação (`revalidacaoPendente`): nada se marca com um campo, tudo se
 * pergunta de novo. «A anamnese vigente desta aluna é mais recente do que o carimbo que a linha de
 * base registou?» — se for, é nova. Um campo `novo: true` seria uma segunda declaração do mesmo
 * facto, e o primeiro gesto que o esquecesse de limpar fazia a etiqueta mentir para sempre.
 *
 * O CARIMBO LIDO VIVE NO TOPO DA LINHA DE BASE (`lida`), e não dentro da leitura. A leitura é
 * descartada quando o recorte muda (descreveria outro recorte); o que se LEU é um facto do acto, e
 * esse não se perde — senão corrigir um nome numa linha de base voltava a marcar todas as alunas
 * como novas.
 *
 * `alunasComAnamnese` é `[{ aluna, carimbo }]` — o carimbo da anamnese VIGENTE de cada uma.
 * Devolve o mesmo array com `novo: true|false` e o `lidaEm` (o carimbo que a linha de base leu, se
 * alguma leu), para a tela poder dizer «lida em …» a quem não tem a etiqueta.
 */
function marcarNovas(linhasDeBase, alunasComAnamnese) {
  const linhas = Array.isArray(linhasDeBase) ? linhasDeBase : [];
  const alunas = Array.isArray(alunasComAnamnese) ? alunasComAnamnese : [];
  return alunas.map((a) => {
    const nome = String((a && a.aluna) || '').trim();
    const carimbo = String((a && a.carimbo) || '').trim();
    let lidaEm = null;
    for (const l of linhas) {
      if (!l || !l.lida || typeof l.lida !== 'object') continue;
      if (!Object.prototype.hasOwnProperty.call(l.lida, nome)) continue;
      const lido = String(l.lida[nome] || '');
      // O MAIOR carimbo entre as linhas de base que a incluíram: uma leitura antiga não apaga o
      // facto de uma leitura nova.
      if (lido && (!lidaEm || lido > lidaEm)) lidaEm = lido;
    }
    return { aluna: nome, carimbo, lidaEm, novo: !lidaEm || carimbo > lidaEm };
  });
}

/**
 * O ELENCO DE UMA TURMA — derivado das linhas de base que a ela foram enviadas (05/11/2026).
 *
 * PORQUE É DERIVADO, E NÃO GUARDADO. A turma é o RITMO e não guarda alunos — decisão de
 * 03/11/2026, e não se reverte. O que declara «estas alunas estão nesta turma» são as linhas de
 * base enviadas para ela (passo 5), cada uma com a sua data. Duas listas do mesmo facto divergem
 * na primeira correcção, e a que fica para trás é a que o plano lê.
 *
 * A UNIÃO, E NÃO A ÚLTIMA. Duas linhas de base podem ir para a mesma turma ao longo do ano («Nível
 * 1 — mobilidade e pés», depois «Nível 1 — allegro»): a segunda não apaga as alunas da primeira, e
 * é isso que faz uma aluna que chegou na quinta aula continuar na turma. Quem sai não sai por uma
 * linha de base nova aparecer — sai por ser retirado da linha de base que a declarava, e é essa a
 * diferença que a cascata mede.
 */
/**
 * A LINHA DE BASE DA TURMA — o ACTO, com o elenco e o RECORTE (06/11/2026).
 *
 * PORQUE ESTA FUNÇÃO EXISTE. Três leitores passaram a depender do mesmo facto: o cabeçalho do PO
 * (que diz qual é a linha de base da turma), o painel do corpo (que mostra os aspectos escolhidos)
 * e o documento derivado (que imprime o recorte como «Linha de base» e «Critérios de inclusão»).
 * Se cada um escolhesse a «vigente» à sua maneira, a mesma turma teria três linhas de base no
 * mesmo dia, e a que ficasse para trás seria a que o documento assina.
 *
 * A ESCOLHA É A DO ACTO: entre as linhas enviadas para a turma, a de `enviada_em` maior; uma
 * lápide (`apagada_em`) não conta — apagar é um acto, e a linha sai da lista. Empate resolve-se
 * pelo `carimbo` do nome, que é a mesma regra do resto do sistema: o relógio de uma máquina não
 * reordena o passado.
 *
 * O QUE VOLTA: `{ id, nome, em, turma, alunas, recorte }`, com `recorte` = `[{id, nome, grupo}]`
 * — os campos do passo 4, na ordem em que o professor os escolheu. `null` quando a turma não tem
 * nenhuma linha de base enviada: e aí a lacuna DIZ-SE, em vez de se desenhar uma tabela vazia.
 */
function linhaDeBaseDaTurma(linhas, turma) {
  const alvo = String(turma == null ? '' : turma).trim();
  if (!alvo) return null;
  const candidatas = (Array.isArray(linhas) ? linhas : []).filter((l) => l
    && String(l.turma == null ? '' : l.turma).trim() === alvo
    && !l.apagada_em
    && String(l.enviada_em || '').trim());
  if (!candidatas.length) return null;
  const maisRecente = candidatas.slice().sort((a, b) => {
    const ea = String(a.enviada_em || '');
    const eb = String(b.enviada_em || '');
    if (ea !== eb) return ea < eb ? 1 : -1;
    return String(b.carimbo || '') < String(a.carimbo || '') ? 1 : -1;
  })[0];
  const campos = Array.isArray(maisRecente.campos) ? maisRecente.campos : [];
  return {
    id: maisRecente.id || null,
    nome: maisRecente.nome || maisRecente.id || null,
    em: maisRecente.enviada_em || null,
    turma: alvo,
    alunas: (Array.isArray(maisRecente.alunas) ? maisRecente.alunas : [])
      .map((a) => String(a == null ? '' : a).trim()).filter(Boolean),
    recorte: campos
      .filter((c) => c && typeof c === 'object')
      .map((c) => ({
        id: String(c.id || ''),
        nome: String(c.nome || c.id || ''),
        grupo: String(c.grupo || ''),
      }))
      .filter((c) => c.id || c.nome),
  };
}

function elencoDaTurma(linhas, turma) {
  const alvo = String(turma == null ? '' : turma).trim();
  const vistas = [];
  if (!alvo) return vistas;
  for (const l of (Array.isArray(linhas) ? linhas : [])) {
    if (!l || String(l.turma == null ? '' : l.turma).trim() !== alvo) continue;
    for (const a of (Array.isArray(l.alunas) ? l.alunas : [])) {
      const nome = String(a == null ? '' : a).trim();
      if (nome && vistas.indexOf(nome) === -1) vistas.push(nome);
    }
  }
  return vistas;
}

/**
 * A QUE LINHA DE BASE PERTENCE CADA ALUNA — e a que turma ela foi enviada (05/11/2026).
 *
 * PORQUE ISTO EXISTE. A etiqueta da listagem da anamnese dizia «nova» e «sem turma» para a Aluna
 * A e a Aluna B, que já tinham linha de base feita e já tinham sido enviadas para uma turma. Não
 * era mentira da tela: era LEITURA DA FONTE ERRADA. A listagem perguntava a turma à CURADORIA, e
 * a curadoria deixou de declarar o elenco quando o passo 5 da linha de base passou a ser o acto
 * que o declara («estas alunas, com este recorte, foram para esta turma neste dia»). Numa escola
 * sem curadorias — que é o estado real da produção a 05/11/2026 — a resposta era sempre «sem
 * turma», e com ela o selo «nova» que dela se deriva.
 *
 * O QUE SE DEVOLVE, E PORQUE NESTA FORMA. Um `Map<apelido, filiação>`, e não uma lista de linhas
 * de base: quem lê a listagem tem uma aluna na mão e precisa da resposta dela, não de uma varredura
 * a cada linha. A filiação diz as TRÊS coisas que a tela mostra em sítios diferentes:
 *
 *   · `nome`  — a linha de base mais recente que inclui a aluna (a etiqueta «pertence a esta»);
 *   · `turma` — a da linha mais recente já ENVIADA (o elenco só existe depois do passo 5);
 *   · `linhas`— todas, da mais recente para a mais antiga (o painel do cartão diz o percurso).
 *
 * UMA LINHA DE BASE EM RASCUNHO CONTA PARA «TEM LINHA DE BASE», E NÃO DÁ TURMA. É a distinção que
 * a pesquisadora fez ao descrever o processo: a aluna deixa de ser «nova» porque a linha de base
 * dela já existe — mesmo antes de o passo 5 a mandar para uma turma. O que o rascunho não faz é
 * dizer «esta aluna está naquela turma»: isso é o envio, e o envio é datado.
 */
function filiacaoDasAlunas(linhas) {
  const por = new Map();
  const lista = (Array.isArray(linhas) ? linhas : [])
    .filter((l) => l && l.id)
    .slice()
    .sort((a, b) => String(b.enviada_em || b.atualizada_em || '')
      .localeCompare(String(a.enviada_em || a.atualizada_em || '')));
  for (const l of lista) {
    const nome = String(l.nome == null ? '' : l.nome).trim();
    const turma = String(l.turma == null ? '' : l.turma).trim();
    const em = String(l.enviada_em || '').trim();
    for (const a of (Array.isArray(l.alunas) ? l.alunas : [])) {
      const apelido = String(a == null ? '' : a).trim();
      if (!apelido) continue;
      if (!por.has(apelido)) {
        por.set(apelido, {
          aluno: apelido, linhas: [], nome: '', turma: '', em: '',
        });
      }
      const f = por.get(apelido);
      f.linhas.push({ id: String(l.id), nome, turma, em });
      // O NOME É O DA MAIS RECENTE — é a linha de base a que ela pertence hoje.
      if (!f.nome) f.nome = nome;
      // A TURMA É A DA MAIS RECENTE JÁ ENVIADA — o rascunho não declara elenco.
      if (!f.turma && turma) {
        f.turma = turma;
        f.em = em;
        f.nomeDaTurma = nome;
      }
    }
  }
  return por;
}

/** Os apelidos que já têm linha de base — a regra do Plano de Observação (05/11/2026). */
function alunasComLinhaDeBase(linhas) {
  return [...filiacaoDasAlunas(linhas).keys()];
}

/**
 * O QUE MUDOU ENTRE O ELENCO QUE UM DOCUMENTO DECLARA E O QUE A TURMA HOJE TEM (05/11/2026).
 *
 * É a MESMA FORMA da revalidação e da etiqueta «novo»: nada se marca com um campo, tudo se
 * pergunta de novo. O professor retira uma aluna da linha de base — porque ela já não pode naquele
 * horário, porque mudou de nível, porque saiu —, e a partir daí o que a curadoria declara e o que a
 * turma tem deixam de coincidir. É essa diferença, e não um sinal a limpar à mão, que obriga a
 * passar outra vez pela curadoria, pelo plano de ensino e pelo plano de observação.
 *
 * PORQUE É PRECISO OBRIGAR. A pesquisadora, 05/11/2026: «se eu trocar a menina, ela vai com outras
 * características para a turma. Então eu preciso refazer a anamnese dela para ver se ela realmente
 * vai para aquela turma ou para qual turma ela vai». O elenco não é uma lista de presença: é a
 * composição de corpos que a turma vai observar, e mexer nele muda o que o PE fixa e o que o PO
 * mede.
 *
 * `saiu` e `entrou` são nomes, e não contagens, porque o motivo escrito na tela tem de dizer QUEM —
 * «o elenco mudou» não dá ao professor o que ele precisa de decidir.
 */
function elencoDiferente(declarado, derivado) {
  const lista = (v) => (Array.isArray(v) ? v : [])
    .map((a) => String(a == null ? '' : a).trim()).filter(Boolean);
  const de = lista(declarado);
  const para = lista(derivado);
  const saiu = de.filter((a) => para.indexOf(a) === -1);
  const entrou = para.filter((a) => de.indexOf(a) === -1);
  return { saiu, entrou, mudou: saiu.length > 0 || entrou.length > 0 };
}

module.exports = {
  DIMENSOES_DA_ANAMNESE,
  ROTULO_DA_DIMENSAO,
  idDe,
  semAcento,
  camposDisponiveis,
  normalizar,
  agregar,
  classificar,
  marcarNovas,
  envelheceu,
  elencoDaTurma,
  linhaDeBaseDaTurma,
  elencoDiferente,
  filiacaoDasAlunas,
  alunasComLinhaDeBase,
};
