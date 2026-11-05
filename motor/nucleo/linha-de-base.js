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
 * Hoje entram os **trinta** campos dos blocos 2 a 9: nove de `tecnica`, quinze de `funcional` e seis
 * de `musicalidade`. A dimensão viaja com cada um (é ela que diz em que eixo do que se observa o
 * aspecto cai), mas **não filtra**.
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
 * OS CAMPOS DO CORPO QUE A ANAMNESE OFERECE — a lista de onde o professor escolhe.
 *
 * A ordem é a da anamnese (bloco a bloco), e não alfabética: é a ordem em que o professor
 * percorre o formulário, e uma lista que muda de ordem entre a anamnese e a produção obriga a
 * procurar duas vezes o mesmo campo.
 *
 * `opcoes` vem junto porque é a RÉGUA: a primeira opção é o melhor estado que a anamnese
 * conhece, e é por ela que a agregação distingue «ponto de atenção» de «excelência». Sem as
 * opções, o mesmo dado não se lê.
 */
function camposDisponiveis(conteudo) {
  const blocos = (conteudo && Array.isArray(conteudo.blocos)) ? conteudo.blocos : [];
  const saida = [];
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
      });
    }
  }
  return saida;
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
    for (const aluno of alunos) {
      const registo = aluno.respostas[escolhido.id];
      const valor = (registo && typeof registo === 'object' && !Array.isArray(registo) && 'valor' in registo)
        ? registo.valor : registo;
      const texto = Array.isArray(valor) ? valor.join(' · ') : valor;
      if (texto === undefined || texto === null || String(texto).trim() === '') continue;
      const chave = String(texto).trim();
      niveis.set(chave, (niveis.get(chave) || 0) + 1);
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
      // A ORDEM DAS ENTRADAS é a das opções (melhor primeiro), e não a da contagem: a leitura é
      // «3 em Alta · 1 em Média», que se lê de cima para baixo como a régua.
      niveis: [...niveis.entries()].sort((a, b) => {
        const ia = opcoes.indexOf(a[0]);
        const ib = opcoes.indexOf(b[0]);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }).map(([nivel, n]) => ({ nivel, quantas: n })),
      texto: [...niveis.entries()]
        .sort((a, b) => {
          const ia = opcoes.indexOf(a[0]);
          const ib = opcoes.indexOf(b[0]);
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        })
        .map(([nivel, n]) => n + ' de ' + quantas + ' em «' + nivel + '»')
        .join(' · '),
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
 *   · `excelencia` — «o que já é bom». Aspectos em que TODAS as que responderam estão no melhor
 *     nível. A pesquisadora deu ao professor autonomia para os incluir na observação («quero
 *     vigiar para que todos mantenham a excelência neste ponto»), e por isso eles não são
 *     escondidos: são uma lista própria.
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
    for (const aluno of alunos) {
      const registo = aluno.respostas[campo.id];
      const valor = (registo && typeof registo === 'object' && !Array.isArray(registo) && 'valor' in registo)
        ? registo.valor : registo;
      const texto = Array.isArray(valor) ? valor.join(' · ') : valor;
      if (texto === undefined || texto === null || String(texto).trim() === '') continue;
      const chave = String(texto).trim();
      niveis.set(chave, (niveis.get(chave) || 0) + 1);
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
      // O TEXTO diz quantas em cada nível. Sem ele, «ponto de atenção» numa turma de trinta e numa
      // de uma seriam a mesma frase — e não são a mesma coisa.
      texto: ordenados.map(([nivel, n]) => n + ' de ' + quantas + ' em «' + nivel + '»').join(' · '),
      unanimidade: niveis.size === 1,
      nivelUnico: niveis.size === 1 ? ordenados[0][0] : null,
      noMelhorNivel: melhor !== null && [...niveis.keys()].every((n) => n === melhor),
      temAbaixoDoMelhor: melhor !== null && [...niveis.keys()].some((n) => n !== melhor),
    };

    // Um campo pode estar em MAIS de um eixo, e isso é de propósito: «todos com o arco do pé igual»
    // é um traço comum E, se o arco for o melhor nível, é excelência. As quatro listas são quatro
    // PERGUNTAS ao mesmo dado, não quatro gavetas que se excluem.
    if (item.temAbaixoDoMelhor) atencao.push(item);
    if (item.noMelhorNivel) excelencia.push(item);
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
  elencoDiferente,
};
