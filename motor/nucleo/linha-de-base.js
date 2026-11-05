'use strict';

/**
 * A LINHA DE BASE DO CORPO — o recorte que o PROFESSOR escolhe (05/11/2026).
 *
 * O QUE ELA SUBSTITUI, E PORQUÊ. A anamnese sempre recolheu o corpo inteiro: 24 campos, em seis
 * blocos (estrutura óssea, flexibilidade, complexo escapulo-umeral, pés e tornozelos, força,
 * equilíbrio). O que o plano lia deles eram **quinze**, escolhidos a 02/11/2026 e escritos à mão
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
 * O CORPO É UM RECORTE DA ANAMNESE, E O RECORTE TEM CRITÉRIO: entram os campos de dimensão
 * `tecnica` ou `funcional`; ficam fora os de `musicalidade` — pulsação, coordenação
 * cognitivo-musical, memória de sequências, lateralidade, orientação espacial. Esses já são
 * tratados nos **verbetes da notação** (é a divisão que a pesquisadora declarou em 05/11/2026:
 * «aspecto técnico e poiesis já são tratados nos verbetes; o novo eixo é o corpo»). Duas listas
 * do mesmo campo divergiriam; esta não é uma segunda lista, é um FILTRO sobre a única que há.
 *
 * A SELEÇÃO É GRAVADA COM O NOME, e não só com o id. É deliberado: a linha de base é um registo
 * do que o professor escolheu **naquele momento**, e o passado não se reescreve (P-03). Se a
 * anamnese mudar o nome de um campo, a linha de base mantém o nome com que ele foi escolhido — e
 * os documentos que dela derivaram continuam a dizer a verdade sobre o que se decidiu.
 *
 * Fronteira: puro. Sem `fs`, `path`, `http` nem `process`. O conteúdo da anamnese entra por
 * argumento — quem o lê do disco é o servidor.
 */

/** As dimensões que o eixo do CORPO cobre. `musicalidade` está fora, e a razão está no cabeçalho. */
const DIMENSOES_DO_CORPO = ['tecnica', 'funcional'];

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
      const dimensao = String(campo.dimensao || bloco.dimensao || '');
      if (DIMENSOES_DO_CORPO.indexOf(dimensao) === -1) continue;
      const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes
        : Array.isArray(campo.valores) ? campo.valores : [];
      saida.push({
        id: String(campo.id),
        nome: String(campo.campo || campo.id),
        bloco: bloco.bloco == null ? null : bloco.bloco,
        grupo: String(bloco.titulo || ''),
        dimensao: dimensao,
        opcoes: opcoes.map(String),
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
 *     carregaria o botão para não ver nada. O vazio é o estado de quem ainda não criou; não é um
 *     estado que se possa gravar;
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
  if (!campos.length) erros.push('escolha pelo menos um aspecto do corpo');

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
    const melhor = opcoes.length ? String(opcoes[0]).trim() : null;

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

module.exports = {
  DIMENSOES_DO_CORPO,
  idDe,
  semAcento,
  camposDisponiveis,
  normalizar,
  agregar,
  envelheceu,
};
