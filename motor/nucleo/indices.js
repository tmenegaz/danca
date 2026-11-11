'use strict';

/**
 * indices.js — O ÍNDICE DO ACERVO: derivado, determinístico e reconstruível.
 *
 * O QUE ELE RESOLVE (20/10/2026, a fase 4). Até aqui cada pergunta sobre o acervo era uma
 * VARREDURA: a lista de escolas, a de professores, a de ciclos e a de documentos custavam, cada
 * uma, uma leitura da árvore do repositório — e cada filtro novo repetia a varredura inteira. As
 * perguntas da escola («que documentos deste professor existem?», «que ciclos têm âncora?»,
 * «quantas aulas já foram dadas?») eram respondidas por quem soubesse percorrer caminhos.
 *
 * O índice responde isso uma vez. Ele é o que o `PLANO-INDICES.md` §2 declara: **derivado**
 * (nasce dos arquivos e das âncoras, não é fonte), **determinístico** (a mesma árvore dá o mesmo
 * JSON, byte a byte) e **reconstruível** (apagar e refazer dá o mesmo resultado — não há nada
 * aqui que só exista aqui).
 *
 * ESTE MÓDULO É PURO. Não lê ficheiro, não fala com o GitHub, não olha o relógio: recebe o que
 * já foi lido (`construir`) e devolve o índice. Quem lê é o `servidor/indice-acervo.js`. Essa
 * separação é o que permite provar o determinismo sem rede — e é o que faz o índice poder ser
 * construído tanto no Worker quanto num script.
 *
 * O QUE ELE NÃO GUARDA, E POR QUÊ.
 *
 *   · o CORPO dos documentos — o índice descreve, não copia. Guardar o texto seria uma segunda
 *     cópia a divergir da primeira;
 *   · o APELIDO da aluna no índice do ACERVO — é dado de menor, e o acervo é transversal (a
 *     raiz lê-o atrás de senha, mas o índice não é o lugar). O índice da ESCOLA, servido pelo
 *     Worker da própria escola, pode trazê-lo: é o mesmo dado que a estante dela já mostra;
 *   · as MARCAS e a PRESENÇA — elas vivem no lançamento da aula, que é cifrado no cofre, e não
 *     há leitor dele ainda. Em vez de inventar um campo vazio (que pareceria «zero marcas»), o
 *     índice DECLARA a ausência em `nao_indexado`, com o motivo. Uma lacuna com nome não mente.
 */

// A VERSÃO DO ÍNDICE. Sobe quando um campo ENTRA ou MUDA de forma — e não quando um valor
// muda. É a chave que invalida o cache do Worker (`indice-acervo.js` compara esta constante com
// o `versao` guardado no KV): sem o incremento, um cache antigo seria servido como válido e o
// campo novo chegaria vazio à tela, sem erro nenhum.
//
//   2 (22/10/2026) — `expurgada_em` e `expurgos` na escola: a data da saída, para o painel.
//   3 (22/10/2026) — `escola.professores` passa a incluir os professores que o ELO prova: numa
//       escola expurgada, os ciclos já não existem e só o professor do inventário sobrava.
//   4 (22/10/2026) — `professores[]` passa a incluir a PASTA (`professores/<slug>/`) e o vínculo
//       que a escola declara no inventário (`professores[]`). Um professor cadastrado e ainda sem
//       ciclo não aparecia em lista nenhuma — e um professor cadastrado DENTRO de uma escola não
//       dizia em qual. As duas coisas passam a estar no índice.
//   5 (22/10/2026) — `professor.nome` deixa de ser «o da primeira escola que o mencionou» e passa a
//       ser «o primeiro nome que alguma escola REGISTA». O `sapo-bailarino` saía sem nome porque a
//       `batata` (que o menciona num ciclo) vem antes da `breu` e da `calango` (que guardam o
//       nome): a primeira escola vencia mesmo quando não sabia nada.
//   6 (22/10/2026) — `escola.professor` passa a ser o responsável de HOJE: o elo de recriação
//       (`recriacao[].professor`) vence o `professor` do topo, que é o da PRIMEIRA criação. Numa
//       escola viva, `escola.professores` deixa de incluir quem só criou uma encarnação anterior
//       (o elo do expurgo só prova professores de escola APAGADA). Sem o incremento, o cache do
//       Worker serve o índice antigo e o painel continua a mostrar a pessoa errada.
const VERSAO = 6;

// AS FAMÍLIAS QUE O ÍNDICE CONHECE. É o vocabulário mínimo que o acervo tem HOJE; um tipo novo
// entra aqui quando existir um arquivo que lhe corresponda — não antes (a regra do §4.1: não
// inventar tipos).
const TIPOS = {
  anamnese: { rotulo: 'Anamnese', familia: 'registro' },
  plano: { rotulo: 'Plano de ensino', familia: 'registro' },
  po: { rotulo: 'Plano de observação', familia: 'registro' },
  aula: { rotulo: 'Aula', familia: 'documento' },
  ciclo: { rotulo: 'Ciclo', familia: 'documento' },
  ancora: { rotulo: 'Âncora de proveniência', familia: 'proveniencia' },
};

// O QUE FICA DE FORA, DITO COM O MOTIVO. Isto não é comentário: viaja no JSON, e a prova exige
// que cada família ausente esteja declarada. Um índice que cala o que não tem faz o leitor supor
// que o zero é um facto.
const NAO_INDEXADO = [
  { familia: 'conteudo', motivo: 'o índice guarda metadados; o corpo dos documentos não se copia' },
  { familia: 'marcas', motivo: 'vivem no lançamento da aula, que é cifrado no cofre — ainda sem leitor' },
  { familia: 'presenca', motivo: 'idem: o lançamento não tem leitor, e um zero aqui seria mentira' },
  { familia: 'alunas-no-acervo', motivo: 'dado de menor: o apelido só aparece no índice da própria escola' },
  { familia: 'senhas', motivo: 'nunca — nem hash, nem sal' },
];

// ------------------------------------------------------------------ utilitários

const porTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function ordenar(itens, chave) {
  const lista = itens.slice();
  lista.sort((a, b) => porTexto(String(a[chave]), String(b[chave])));
  return lista;
}

/** As chaves de um objeto em ordem — é o que torna dois índices iguais comparáveis byte a byte. */
function comChavesOrdenadas(valor) {
  if (Array.isArray(valor)) return valor.map(comChavesOrdenadas);
  if (valor && typeof valor === 'object') {
    const saida = {};
    for (const chave of Object.keys(valor).sort(porTexto)) saida[chave] = comChavesOrdenadas(valor[chave]);
    return saida;
  }
  return valor;
}

/** O texto canónico de um índice — a forma com que `--check` compara dois. */
function canonico(indice) {
  return JSON.stringify(comChavesOrdenadas(indice));
}

/**
 * O ÍNDICE SEM OS CAMPOS VOLÁTEIS. `gerado_em` e `fonte.commit` mudam a cada geração e não
 * descrevem o acervo: incluí-los faria o `--check` reprovar sempre. A lista é curta e explícita
 * — um campo novo que seja volátil tem de ser declarado aqui, e é isso que o obriga a ser uma
 * decisão e não um esquecimento.
 */
function semVolateis(indice) {
  const copia = JSON.parse(JSON.stringify(indice));
  delete copia.gerado_em;
  if (copia.fonte) delete copia.fonte.commit;
  if (copia.fonte) delete copia.fonte.arvore;
  return copia;
}

/** `verdadeiro` para dois índices iguais fora os voláteis. */
function iguais(a, b) {
  return canonico(semVolateis(a)) === canonico(semVolateis(b));
}

// ------------------------------------------------------------------ as entidades

/**
 * O ID ESTÁVEL de cada entidade (§4.7 do plano). É o mesmo formato em todo o lado — o índice, a
 * consulta e a resposta —, porque um id que muda de forma entre camadas não serve para juntar.
 */
const idDeEscola = (slug) => 'escola:' + slug;
const idDeProfessor = (slug) => 'professor:' + slug;
const idDeCiclo = (professor, numero, escola) => 'ciclo:' + professor + '/' + numero + '/' + escola;
const idDeEnvelope = (resumo) => String(resumo.fonte || 'documento') + ':' + String(resumo.id || '');

/** O ano de um carimbo (`anamnese-20261019-1842` → `2026`); null quando não há carimbo. */
function anoDoCarimbo(id) {
  const m = /(\d{4})\d{2}\d{2}-\d{4}/.exec(String(id || ''));
  return m ? m[1] : null;
}

/** A data (ISO) de um carimbo — é ela que ordena a estante e responde «quando». */
function dataDoCarimbo(id) {
  const m = /(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(String(id || ''));
  if (!m) return null;
  return m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5];
}

/**
 * O ciclo a partir do caminho de um arquivo do pacote:
 * `professores/<professor>/ciclos/ciclo-01-<escola>-po.md` → `{professor, numero:'01', escola}`.
 *
 * O nome do arquivo é a autoridade — não o diretório —, e é a MESMA regra do expurgo
 * (`ehArquivoDaEscola`): se as duas divergirem, o índice descreveria um ciclo que o expurgo não
 * reconhece.
 */
const RE_DO_CICLO = /^professores\/([^/]+)\/ciclos\/ciclo-([0-9]{2})(?:-([a-z0-9-]+?))?(?=$|[/.-])/;
const SUFIXOS_DO_CICLO = new Set([
  'schema', 'po-schema', 'plano-schema', 'aula-schema', 'captura-schema',
  'po', 'plano', 'dados', 'dados.cifrado', 'ciclos', 'indice', 'manifesto',
]);

/**
 * QUEM RESPONDE PELA ESCOLA HOJE — e por que «hoje» importa (22/10/2026).
 *
 * O inventário (`escola/<slug>/indice.json`) guardava `professor` como se fosse um fato
 * imutável: o professor da CRIAÇÃO. Mas o índice sobrevive ao expurgo, e uma escola recriada
 * com o mesmo nome reaproveita o mesmo arquivo — então `professor` continuava a dizer quem a
 * criou da primeira vez, para sempre. Medido na `calango`: recriada com o `oculos-redondo`, o
 * painel mostrava «Sapo Bailarino» como professor principal, e o expurgo local procurava os
 * arquivos na pasta do `sapo-bailarino` (onde já não havia nada).
 *
 * A RECRIAÇÃO É UM ELO, e o elo passa a declarar quem recriou (`recriacao[].professor`,
 * gravado por `tools/registrar-recriacao.py`). A regra é a mesma da proveniência: o elo NOVO
 * vale, o antigo fica como memória. Quando o elo é anterior a esta correção e não declara
 * ninguém, cai-se no `professor` — o comportamento de antes, sem inventar.
 */
function responsavelDoInventario(inv) {
  if (!inv) return { slug: null, nome: null, ciclo: null };
  const recriacoes = Array.isArray(inv.recriacao) ? inv.recriacao : [];
  for (let i = recriacoes.length - 1; i >= 0; i -= 1) {
    const e = recriacoes[i];
    const p = e && e.professor;
    const slug = p && typeof p === 'object' ? p.slug : (typeof p === 'string' ? p : null);
    if (!slug) continue;
    return {
      slug: String(slug),
      nome: (p && typeof p === 'object' && p.nome) ? String(p.nome) : (e.responsavel ? String(e.responsavel) : null),
      ciclo: e.ciclo ? String(e.ciclo) : (inv.ciclo ? String(inv.ciclo) : null),
    };
  }
  const professor = inv.professor || null;
  return {
    slug: (professor && professor.slug) ? String(professor.slug) : null,
    nome: (professor && professor.nome) ? String(professor.nome) : null,
    ciclo: inv.ciclo ? String(inv.ciclo) : null,
  };
}

/**
 * QUANDO A ENCARNAÇÃO ATUAL COMEÇOU — a última recriação, ou a criação original.
 *
 * O elo `recriacao[]` é append-only: cada recriação acrescenta a sua data, e a última é a que
 * descreve a escola que existe agora. Devolve a data em texto, como o `criado_em` a guarda —
 * o índice não converte formatos, e quem lê já sabe lidar com as duas formas.
 */
function quandoDaEncarnacao(inv) {
  if (!inv) return null;
  const recriacoes = Array.isArray(inv.recriacao) ? inv.recriacao : [];
  for (let i = recriacoes.length - 1; i >= 0; i -= 1) {
    const em = recriacoes[i] && recriacoes[i].em;
    if (em) return String(em);
  }
  return inv.criado_em || null;
}

/**
 * O NOME DE UM PROFESSOR, no inventário da escola — do vínculo declarado (`professores[]`) ou,
 * como antes, do responsável (`professor`). Uma função só porque as duas formas descrevem a
 * mesma pessoa e o painel precisa do mesmo rótulo para as duas.
 */
function nomeDoProfessorNoInventario(inv, slug) {
  if (!inv || !slug) return null;
  for (const p of (Array.isArray(inv.professores) ? inv.professores : [])) {
    if (p && p.slug === slug && p.nome) return String(p.nome);
  }
  // O ELO DE RECRIAÇÃO TAMBÉM DIZ O NOME (22/10/2026). É a única fonte para quem entrou na
  // escola recriando-a: o diretório guarda o slug, e o `professores[]` só existe quando a
  // Produção cadastrou a pessoa.
  for (const e of (Array.isArray(inv.recriacao) ? inv.recriacao : [])) {
    const p = e && e.professor;
    if (p && typeof p === 'object' && p.slug === slug && p.nome) return String(p.nome);
    if (p === slug && e.responsavel) return String(e.responsavel);
  }
  if (inv.professor && inv.professor.slug === slug && inv.professor.nome) return String(inv.professor.nome);
  return null;
}

function cicloDoCaminho(caminho) {
  const m = RE_DO_CICLO.exec(String(caminho || ''));
  if (!m) return null;
  return { professor: m[1], numero: m[2], resto: m[3] || null, caminho };
}

/**
 * A ESCOLA de um arquivo do pacote. A variante é o sufixo do nome; mas ela pode ser composta
 * (`calango-bale-nivel-1-teste-1`), e o que separa a variante da escola é a ESCOLA — que não se
 * adivinha pelo caminho. Quem sabe a lista de escolas é o `construir`, e é ele que resolve:
 * aqui devolve-se o sufixo cru, e o casamento é feito por prefixo contra os slugs conhecidos
 * (o mais longo ganha, para `x-teste-1` não perder para `x`).
 */
function escolaDoSufixo(sufixo, slugs) {
  const s = String(sufixo || '');
  let achado = null;
  for (const slug of slugs) {
    if (s !== slug && s.indexOf(slug + '-') !== 0) continue;
    if (!achado || slug.length > achado.length) achado = slug;
  }
  return achado;
}

/**
 * O VOCABULÁRIO DE TIPOS DE **DOCUMENTO** — o que o `tipoDoDocumento` devolve.
 *
 * Não confundir com o `TIPOS` acima: aquele é o vocabulário dos **registros** (o que o envelope
 * guarda e o que a faceta `filtros.tipos` rotula); este é o dos **arquivos** do pacote. Eram duas
 * listas implícitas nas ramificações do `tipoDoDocumento`, e a declaração `indices/esquema/tipos.json`
 * (Etapa 1 do PLANO-INDICES.md) tornou a diferença visível: uma prova que comparasse as duas
 * acusaria divergência em todos os tipos. Nomear a lista é o que permite a prova comparar o
 * declarado com o motor sem adivinhar.
 */
const TIPOS_DE_DOCUMENTO = [
  'ancora', 'schema', 'manifesto', 'plano', 'po', 'aula', 'dados', 'declaracao', 'captura',
  'indice', 'harmonizacao', 'notacao', 'glossario', 'referencias',
];

/** Um documento do ciclo, classificado pelo NOME (não pelo conteúdo). */
function tipoDoDocumento(caminho, escola) {
  const base = String(caminho || '').split('/').pop() || '';
  if (/\.fipp$/.test(base)) return 'ancora';
  if (/_schema\.json$/.test(base) || /-schema\.json$/.test(base)) return 'schema';
  if (/-po\.md$/.test(base)) return 'po';
  if (/-plano\.md$/.test(base)) return 'plano';
  if (/-aula-[0-9]{2}\.md$/.test(base)) return 'aula';
  if (/-dados\.cifrado\.json$/.test(base) || /-dados\.json$/.test(base)) return 'dados';
  /* A DECLARAÇÃO DA CAPTURA É UM DOCUMENTO PRÓPRIO (07/11/2026). Ela nasceu a 07/11 e diz que
   * colunas da captura são marcas — mora ao lado das fontes, com o nome da variante, e o expurgo
   * a leva com a escola. Não casava `-captura.json` (o nome tem `-declaracao` no meio), e o
   * efeito era o mesmo dos derivados do PO a 20/10/2026: o ficheiro ficava «sem tipo declarado»,
   * a verificação 8 do `check-indices` reprovava, e a reprovação **travava o workflow que
   * commita o índice** — o derivado deixava de fechar. O padrão vem ANTES do da captura, porque
   * `-captura-declaracao.json` também termina em `.json` e a ordem é «o primeiro que casar vence». */
  if (/-captura-declaracao\.json$/.test(base)) return 'declaracao';
  if (/-captura\.md$/.test(base) || /-captura\.json$/.test(base)) return 'captura';
  // OS DERIVADOS DO PO (20/10/2026). O «Guardar» do PO passou a escrever quatro documentos ao
  // lado das fontes — harmonização das normas, notação do ciclo, glossário da notação e
  // referências —, e o índice não os conhecia: ficavam de fora do acervo («sem tipo declarado»,
  // verificação 8), e o documento publicado era invisível para a proveniência.
  if (/-harmonizacao\.md$/.test(base)) return 'harmonizacao';
  if (/-notacao\.md$/.test(base)) return 'notacao';
  if (/-glossario(?:-[a-z]+)?\.md$/.test(base)) return 'glossario';
  if (/-referencias\.md$/.test(base)) return 'referencias';
  if (/^ciclos\.json$/.test(base)) return 'indice';
  if (new RegExp('(^|-)' + escola + '(\\.|-)').test(base) && /\.conf$/.test(base)) return 'manifesto';
  if (/^ciclo-[0-9]{2}\.conf$/.test(base)) return 'manifesto';
  return null;
}

// ------------------------------------------------------------------ a construção

/**
 * O ÍNDICE, a partir do que já foi lido.
 *
 * `entrada` é:
 *   {
 *     fonte: {commit, arvore},                     // voláteis
 *     agora: 'AAAA-MM-DDTHH:MM',                    // o instante da geração (volátil)
 *     arvores: [caminho...],                        // a árvore inteira do repositório
 *     inventarios: {'fita': {objeto do indice.json}},
 *     envelopes: {'fita': [{nome, resumo}]},        // o resumo que o `envelope/.indice.json` guarda
 *     ancoras: {'professores/tiago/ciclos/ciclo-01-fita.fipp': {campos}},
 *     comApelido: false,                            // o índice da escola pode trazê-lo
 *   }
 *
 * Devolve `{acervo, escolas: {slug: indice}}` — o mestre (transversal, sem apelido) e o detalhe
 * por escola (com o que a escola pode ver).
 */
/**
 * O RECORTE DO CORPO — AS VERSÕES DE CADA LINHA DE BASE (05/11/2026).
 *
 * A LINHA DE BASE PASSOU A SER FICHEIRO a 05/11/2026 (`escola/<escola>/linhas-de-base/<id>--<carimbo>.json`),
 * e é isso que torna este índice possível: enquanto viveu só no KV, o gerador não a alcançava, e a
 * entidade `recorte` ficou declarada `prevista` — a marca que diz «o vocabulário existe, o dado
 * ainda não é alcançável». Agora é.
 *
 * O QUE SE GUARDA, e o §4.8 manda: `aspectos` (o vocabulário da anamnese, que é norma), a contagem
 * `alunas`, a `turma`, o `professor` e as datas. NENHUM apelido, nenhuma resposta, nenhum texto.
 * O nome do aspecto não é dado de pessoa: é o que a anamnese mede em qualquer aluna.
 *
 * A SÉRIE É A RAZÃO DE ISTO EXISTIR. A pesquisadora: «a gente tem que encontrar uma solução para
 * isso. Essa é uma característica que vai valer muito dinheiro.» Cada versão é um acto datado, e a
 * cadeia diz o que se olhava em cada momento — não só o que se olha hoje. O índice guarda as
 * versões inteiras (não um resumo): uma série resumida perde exactamente o que a torna útil.
 *
 * A LÁPIDE NÃO APAGA A LINHA DO ÍNDICE. Uma linha de base apagada continua aqui, com
 * `apagada: true` e a data — é o registo de que existiu, e um índice que a omitisse reescreveria o
 * passado, que é o que este sistema inteiro existe para não fazer. O que ela deixa de fazer é
 * contar no ranque dos vigentes.
 */
function recortesDaEscola(versoes) {
  const porLinha = new Map();
  for (const v of (Array.isArray(versoes) ? versoes : [])) {
    if (!v || typeof v !== 'object') continue;
    const id = String(v.id || '').trim();
    if (!id) continue;
    if (!porLinha.has(id)) porLinha.set(id, []);
    porLinha.get(id).push(v);
  }
  const saida = [];
  for (const [id, lista] of porLinha) {
    /* A MAIS RECENTE PRIMEIRO. O carimbo é do NOME do ficheiro, e não de uma data lá dentro: um
     * relógio atrasado numa máquina não reordena o passado. */
    const ordenadas = lista.slice()
      .sort((a, b) => porTexto(String(b.carimbo || ''), String(a.carimbo || '')));
    const recente = ordenadas[0];
    const apagada = Boolean(recente.apagada_em);
    const versoesLimpa = ordenadas.map((v) => ({
      versao: String(v.carimbo || ''),
      arquivo: String(v.arquivo || ''),
      enviada_em: v.enviada_em || null,
      aspectos: Array.isArray(v.aspectos) ? v.aspectos.map(String) : [],
      alunas: Number.isFinite(Number(v.alunas)) ? Number(v.alunas) : 0,
      ...(v.apagada_em ? { apagada_em: v.apagada_em } : {}),
    }));
    saida.push({
      id: 'recorte:' + id,
      linha: id,
      nome: recente.nome ? String(recente.nome) : id,
      professor: recente.professor ? String(recente.professor) : null,
      turma: recente.turma ? String(recente.turma) : null,
      atualizada_em: recente.atualizada_em || null,
      enviada_em: recente.enviada_em || null,
      aspectos: Array.isArray(recente.aspectos) ? recente.aspectos.map(String).sort(porTexto) : [],
      alunas: Number.isFinite(Number(recente.alunas)) ? Number(recente.alunas) : 0,
      vigente: !apagada,
      ...(apagada ? { apagada: true, apagada_em: recente.apagada_em } : {}),
      // A SÉRIE, da mais recente para a mais antiga. `versoes.length` é quantos actos a linha teve.
      versoes: versoesLimpa,
    });
  }
  return ordenar(saida, 'id');
}

/**
 * O RANQUE DOS ASPECTOS, COM A JANELA DO TEMPO (05/11/2026).
 *
 * Duas contas DIFERENTES, e confundi-las é o erro fácil: `contagem` é «em quantos recortes VIGENTES
 * este aspecto é olhado hoje» (o ranque do presente, o mesmo que o índice VIVO responde), e
 * `versoes` é «em quantos ACTOS alguma vez foi escolhido» (a série). Um aspecto que se olhava em
 * cinco recortes de Outubro e hoje em nenhum tem `contagem: 0` e `versoes: 5` — e é exactamente
 * essa diferença que se quer poder ver.
 *
 * `primeira`/`ultima` são carimbos, não opiniões: dizem desde quando e até quando aquele aspecto
 * esteve no recorte de alguém desta escola. Sem eles, «olhar para o passado» seria abrir os
 * ficheiros um a um.
 */
function aspectosDoRecorte(recortes) {
  const por = new Map();
  const anotar = (aspecto, carimbo, vale) => {
    if (!por.has(aspecto)) {
      por.set(aspecto, { aspecto, contagem: 0, versoes: 0, ids: [], primeira: null, ultima: null });
    }
    const a = por.get(aspecto);
    a.versoes += 1;
    if (!a.primeira || String(carimbo) < String(a.primeira)) a.primeira = String(carimbo);
    if (!a.ultima || String(carimbo) > String(a.ultima)) a.ultima = String(carimbo);
    if (vale) {
      a.contagem += 1;
      a.ids.push(vale);
    }
  };
  for (const r of (Array.isArray(recortes) ? recortes : [])) {
    for (const v of (r.versoes || [])) {
      for (const aspecto of (v.aspectos || [])) {
        anotar(String(aspecto), v.versao, r.vigente && v.versao === (r.versoes[0] || {}).versao ? r.id : null);
      }
    }
  }
  return [...por.values()]
    .map((a) => Object.assign({}, a, { ids: a.ids.sort(porTexto) }))
    .sort((a, b) => (b.contagem - a.contagem) || (b.versoes - a.versoes) || porTexto(a.aspecto, b.aspecto));
}

function construir(entrada) {
  const e = entrada || {};
  const caminhos = Array.isArray(e.arvores) ? e.arvores.slice() : [];
  const inventarios = e.inventarios || {};
  const envelopes = e.envelopes || {};
  const ancoras = e.ancoras || {};
  const comApelido = e.comApelido === true;

  // 1. AS ESCOLAS — o `wrangler.<slug>.jsonc`, que é a definição que sobrevive ao expurgo.
  const slugs = [];
  for (const caminho of caminhos) {
    const m = /^wrangler\.([a-z0-9-]+)\.jsonc$/.exec(caminho);
    if (!m) continue;
    if (m[1] === 'danca') continue;   // a raiz não é escola
    if (slugs.indexOf(m[1]) === -1) slugs.push(m[1]);
  }
  // Uma escola EXPURGADA já não tem wrangler, mas o inventário dela ficou como elo. Ela entra no
  // índice — com `expurgada: true` —, porque «esta escola existiu» é precisamente o que o elo
  // guarda, e uma lista que a omite apagaria a memória que o expurgo quis preservar.
  for (const caminho of caminhos) {
    const m = /^escola\/([a-z0-9-]+)\/indice\.json$/.exec(caminho);
    if (m && slugs.indexOf(m[1]) === -1) slugs.push(m[1]);
  }
  slugs.sort(porTexto);

  /* 1b. OS RECORTES DO CORPO (05/11/2026) — a linha de base passou a ser ficheiro, e a série
   * temporal passou a ser derivável. O agrupamento é por escola e depois por linha; a conta é a
   * das duas funções puras acima, e não se repete aqui. */
  const versoesDoRecorte = e.recortes || {};
  const recortesPorEscola = {};
  for (const slug of slugs) {
    recortesPorEscola[slug] = recortesDaEscola(versoesDoRecorte[slug]);
  }

  // 2. OS CICLOS — dos caminhos de `professores/**`.
  const porCiclo = new Map();   // id → {professor, numero, escola, documentos:[], variantes:Set}
  for (const caminho of caminhos) {
    if (caminho.indexOf('professores/') !== 0) continue;
    const c = cicloDoCaminho(caminho);
    if (!c || !c.resto) continue;                     // `ciclo-01.conf`: o manifesto base, sem escola
    const escola = escolaDoSufixo(c.resto, slugs);
    if (!escola) continue;                            // variante de escola que já não existe
    const tipo = tipoDoDocumento(caminho, escola);
    if (!tipo) continue;
    const id = idDeCiclo(c.professor, c.numero, escola);
    if (!porCiclo.has(id)) {
      porCiclo.set(id, {
        id,
        professor: c.professor,
        numero: c.numero,
        escola,
        documentos: [],
        tipos: new Set(),
      });
    }
    const ciclo = porCiclo.get(id);
    ciclo.documentos.push(caminho);
    ciclo.tipos.add(tipo);
  }

  // 3. AS ÂNCORAS. O índice COPIA a âncora; não a calcula (§8.1). O que ele lê do arquivo são os
  // campos que o `hash-ciclo.sh` escreveu — e ele não os valida: quem valida é o `--check`.
  const ancoraDoCaminho = (caminho) => {
    const bruto = ancoras[caminho];
    if (!bruto) {
      return {
        caminho,
        lida: false,
        // A AUSÊNCIA TEM NOME. Uma âncora no caminho e não lida não é «sem âncora»: é «não se
        // abriu o arquivo». Colapsar as duas faria a consulta de proveniência mentir.
        motivo: 'a âncora está no caminho, mas não foi aberta nesta geração',
      };
    }
    return {
      caminho,
      lida: true,
      id: bruto.id || null,
      hash: bruto.hash || null,
      hash_conteudo: bruto.hash_conteudo || null,
      parent_hash: bruto.parentHash || '',
      ancorado_em: bruto.ancorado_em || null,
      algoritmo: bruto.algoritmo || null,
      cobertura: Array.isArray(bruto.cobertura) ? bruto.cobertura.slice().sort(porTexto) : [],
    };
  };

  const ciclos = [];
  for (const ciclo of [...porCiclo.values()]) {
    const docs = ciclo.documentos.sort(porTexto);
    // A âncora do ciclo é a que NÃO tem `-aula-NN`; as de aula são as que têm.
    const doCiclo = docs.filter((c) => tipoDoDocumento(c, ciclo.escola) === 'ancora'
      && !/-aula-[0-9]{2}\.fipp$/.test(c));
    const daAula = docs.filter((c) => tipoDoDocumento(c, ciclo.escola) === 'ancora'
      && /-aula-[0-9]{2}\.fipp$/.test(c));
    /* A AULA É DA VARIANTE, E O ID TEM DE O DIZER (11/11/2026).
     *
     * MEDIDO. Derivar a Turma para outra sala cria uma SEGUNDA variante do mesmo ciclo
     * (`calango-rosa` e `calango-piano`) na pasta do mesmo professor. O ciclo é um só (o id é
     * `professor/ciclo/escola`), e as duas variantes têm `-aula-01.fipp` — logo, dois registos
     * com o MESMO id `ciclo:<prof>/01/<escola>/aula-01`. A verificação 4 do `check-indices`
     * (Unicidade) reprovou, e com razão: duas coisas diferentes com o mesmo nome.
     *
     * A variante entra no id — e entra SEMPRE, e não só quando há duas, para o id da aula da
     * `rosa` não mudar no dia em que a `piano` aparecer. E o `documento` passa a ser procurado
     * na MESMA variante: antes, a primeira `-aula-NN.md` encontrada podia ser a da outra sala. */
    const varianteDaAncora = (caminho) => {
      const base = String(caminho).split('/').pop().replace(/\.fipp$/, '');
      const semAula = base.replace(/-aula-[0-9]{2}$/, '');
      const m = new RegExp('^ciclo-[0-9]{2}-' + String(ciclo.escola).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(.+)$').exec(semAula);
      return m ? m[1] : '';
    };
    const aulas = daAula.map((c) => {
      const m = /-aula-([0-9]{2})\.fipp$/.exec(c);
      const variante = varianteDaAncora(c);
      return {
        id: ciclo.id + '/' + (variante || '_') + '/aula-' + m[1],
        variante,
        numero: m[1],
        ancora: ancoraDoCaminho(c),
        documento: docs.find((d) => {
          if (!new RegExp('-aula-' + m[1] + '\\.md$').test(d)) return false;
          return !variante || varianteDaAncora(d) === variante;
        }) || null,
      };
    });
    ciclos.push({
      id: ciclo.id,
      professor: ciclo.professor,
      numero: ciclo.numero,
      escola: ciclo.escola,
      // O ESTADO, NOS DOIS NÍVEIS (20/10/2026). O mestre dizia `estado` e o da escola não —
      // e quem consumisse o da escola tinha de re-derivar a mesma coisa a partir de
      // `sem_ancora`. Duas gramáticas para o mesmo dado é a receita para divergirem.
      estado: doCiclo.length ? 'ancorado' : 'sem-ancora',
      tipos: [...ciclo.tipos].sort(porTexto),
      documentos: docs,
      pacote: docs.filter((d) => /\.html$/.test(d)).length ? docs.find((d) => /\/index\.html$/.test(d)) || null : null,
      // A âncora do ciclo: a primeira (uma variante, uma âncora). Sem ela, `ancora: null` — e o
      // `sem_ancora: true` é o que a consulta de proveniência lê para declarar a lacuna.
      ancora: doCiclo.length ? ancoraDoCaminho(doCiclo[0]) : null,
      sem_ancora: doCiclo.length === 0,
      aulas: ordenar(aulas, 'numero'),
    });
  }
  ciclos.sort((a, b) => porTexto(a.id, b.id));

  // 4. OS REGISTROS (os envelopes). Só METADADO — e o apelido só quando `comApelido`.
  const registrosPorEscola = {};
  for (const slug of slugs) {
    const lista = Array.isArray(envelopes[slug]) ? envelopes[slug] : [];
    registrosPorEscola[slug] = lista.map(({ nome, resumo }) => {
      const r = resumo || {};
      const item = {
        id: idDeEnvelope(r),
        carimbo: r.id || String(nome || '').replace(/\.json$/, ''),
        tipo: r.fonte || 'documento',
        data: dataDoCarimbo(r.id || nome),
        ano: anoDoCarimbo(r.id || nome),
        professor: r.professor || null,
        ciclo: r.ciclo || null,
        ajuste_de: r.ajuste_de || null,
      };
      // O QUE IDENTIFICA O REGISTRO, e não o que ele RESPONDE. O objetivo do plano e a turma são
      // metadado (aparecem no rótulo da estante); o APELIDO é dado de menor e só entra no índice
      // da própria escola.
      if (r.turma) item.turma = r.turma;
      if (r.objetivo) item.objetivo = r.objetivo;
      if (comApelido && r.aluna) item.aluna = r.aluna;
      return item;
    }).sort((a, b) => porTexto(a.carimbo, b.carimbo));
  }

  // 5. AS FACETAS. Contagem pronta, e a lista de ids para a interseção. As duas saem daqui para
  // que a interface não recalcule nada — e para que dois consumidores não contem diferente.
  const facetas = (lista, chave) => {
    const mapa = new Map();
    for (const item of lista) {
      const valor = item[chave];
      if (valor === null || valor === undefined || valor === '') continue;
      if (!mapa.has(valor)) mapa.set(valor, []);
      mapa.get(valor).push(item.id);
    }
    return [...mapa.entries()]
      .map(([valor, ids]) => ({ valor, rotulo: String(valor), contagem: ids.length, ids: ids.sort(porTexto) }))
      .sort((a, b) => porTexto(a.valor, b.valor));
  };

  // 6. O MESTRE — transversal, sem documentos e SEM apelido.
  const escolas = [];
  const professores = new Map();
  for (const slug of slugs) {
    const inv = inventarios[slug] || null;
    const minhaCiclos = ciclos.filter((c) => c.escola === slug);
    const meusRegistros = registrosPorEscola[slug] || [];
    const expurgada = !caminhos.some((c) => c === 'wrangler.' + slug + '.jsonc');
    // QUEM RESPONDE HOJE, não quem criou há três expurgos (22/10/2026). Ver
    // `responsavelDoInventario` — o elo de recriação vale sobre o `professor` original.
    const responsavel = responsavelDoInventario(inv);
    const professorDoInventario = responsavel.slug || null;

    /*
     * OS PROFESSORES QUE PASSARAM POR ESTA ESCOLA — e o elo sabe mais do que o inventário.
     *
     * O inventário guarda UM professor: o que a criação declarou (`escola/<slug>/indice.json` →
     * `professor`). Numa escola EXPURGADA os ciclos já não existem, e as fontes que diziam quem
     * mais dava aula ali foram apagadas — ficava só esse um. Medido na `calango`: o inventário
     * diz `sapo-bailarino`, e os arquivos que o expurgo apagou estavam todos em
     * `professores/oculos-redondo/` — quer dizer, quem trabalhava na escola era o
     * `oculos-redondo`, e a lista mostrava o outro.
     *
     * A EVIDÊNCIA ESTÁ NO PRÓPRIO ELO, e custa ZERO leitura a mais: `expurgo[].apagado[]` tem os
     * caminhos que saíram, e um caminho `professores/<slug>/…` é a prova de que aquele professor
     * tinha fontes desta escola. O inventário inteiro já está em memória quando esta função roda
     * — é a mesma razão pela qual `expurgada_em` custou zero esta manhã.
     *
     * SÓ O QUE É DA ESCOLA. O caminho é `professores/<slug>/ciclos/ciclo-NN-<escola>…`; o filtro
     * pelo sufixo da escola evita que uma escola herde o professor de outra que partilhe a pasta
     * (o mesmo professor pode ter ciclos de várias escolas na mesma pasta).
     */
    const doElo = new Set();
    for (const elo of (inv && Array.isArray(inv.expurgo) ? inv.expurgo : [])) {
      for (const caminho of (elo && Array.isArray(elo.apagado) ? elo.apagado : [])) {
        const m = /^professores\/([a-z0-9][a-z0-9-]*)\/ciclos\/ciclo-[0-9]{2,}-([a-z0-9][a-z0-9-]*)/.exec(caminho);
        // O segundo grupo é o nome do ciclo (`<escola>` ou `<escola>-<turma>`), e a escola é o
        // seu PREFIXO — o separador é o hífen e o sufixo da escola pode ele próprio tê-los.
        if (m && (m[2] === slug || m[2].startsWith(slug + '-'))) doElo.add(m[1]);
      }
    }

    /*
     * O VÍNCULO QUE A ESCOLA DECLARA (22/10/2026). O inventário guardava UM professor — o
     * responsável —, e era por isso que um professor cadastrado na Produção não aparecia ligado a
     * escola nenhuma: quem o cadastra grava o vínculo no KV, e o KV não é fonte do acervo. Agora a
     * criação do professor escreve `professores[]` no inventário da escola, e é daqui que o painel
     * sabe em que escolas ativas ele trabalha. `professor` (singular) continua a ser o responsável.
     */
    const doInventario = (inv && Array.isArray(inv.professores) ? inv.professores : [])
      .map((p) => (p && typeof p === 'object' ? p.slug : p))
      .filter((p) => typeof p === 'string' && p);

    const professoresDaEscola = [...new Set(minhaCiclos.map((c) => c.professor)
      .concat(professorDoInventario ? [professorDoInventario] : [])
      .concat(doInventario)
      // O ELO DO EXPURGO SÓ PROVA QUEM TRABALHA NUMA ESCOLA APAGADA (22/10/2026). Numa escola
      // VIVA os caminhos dizem quem tem ciclo ali, e o elo diz quem a criou nas encarnações
      // anteriores — incluir os dois fazia o `sapo-bailarino` aparecer «a trabalhar» na
      // `calango` recriada, onde quem dá aula é o `oculos-redondo`.
      .concat(expurgada ? [...doElo] : []))].sort(porTexto);

    const comAncora = minhaCiclos.filter((c) => !c.sem_ancora).length;
    escolas.push({
      id: idDeEscola(slug),
      slug,
      // O NOME DA ESCOLA: o que a criação declarou (`escola`), e só na falta dele o nome do
      // responsável. O `nome` que a criação recebe (`--escola-nome`) não era gravado no elo —
      // por isso a `calango` aparece como o slug, e a correção fica declarada no REGISTRO.
      nome: (inv && (inv.escola || responsavel.nome)) || slug,
      professor: professorDoInventario,
      professores: professoresDaEscola,
      // UMA ESCOLA EXPURGADA NÃO ESTÁ HABILITADA (20/10/2026). «Habilitada» sai do elo, que
      // guarda o que a criação declarou; «expurgada» sai do wrangler, que o expurgo apagou. Sem
      // esta conjunção, o índice da `breu` dizia as duas coisas ao mesmo tempo — `habilitada:
      // true` e `expurgada: true` — porque o elo não se reescreve (a proveniência acrescenta).
      // Não há escola habilitada sem Worker: a habilitação é a de um sítio que existe.
      habilitada: !expurgada && !(inv && inv.estado && inv.estado.habilitada === false),
      expurgada,
      /* A DATA DE CRIAÇÃO É A DA ENCARNAÇÃO QUE EXISTE (27/10/2026).
       *
       * O DEFEITO, medido no painel: a `calango` foi criada em 27/10 às 11:35 e a coluna
       * «Criada» dizia 19/10 — a primeira encarnação. O `criado_em` do inventário é o da
       * criação ORIGINAL e o elo da recriação não o reescreve (a proveniência acrescenta).
       * O `responsavelDoInventario` já lia o elo para o professor; a DATA não tinha o mesmo
       * tratamento, e a coluna mostrava o passado com o rótulo do presente.
       *
       * A REGRA É A MESMA, aplicada ao campo que faltava: o elo mais recente de `recriacao[]`
       * diz quando a escola voltou, e é isso que a escola é. A primeira criação continua no
       * elo — é lá que a história mora —, e `criado_em` do inventário não se toca.
       *
       * SEM RECRIAÇÃO, É O `criado_em` DE SEMPRE. Nada muda para as escolas que nunca foram
       * expurgadas, que são a maioria.
       */
      criada_em: quandoDaEncarnacao(inv),
      // QUANDO ELA SAIU (22/10/2026). `expurgada` era só um booleano, e o painel operacional
      // precisa da data — quem lê «esta escola existiu» quer saber de quando a quando. A data
      // está no ELO que o expurgo grava (`escola/<slug>/indice.json` → `expurgo[]`), e o
      // inventário JÁ está em memória nesta função: o campo custa zero leitura a mais. Ele entra
      // no índice, e não na tela, porque a tela não deve ir buscar por fora o que a derivação
      // já tem — duas leituras do mesmo dado divergem no dia em que uma mudar.
      //
      // O ÚLTIMO elo é o que vale: uma escola pode ter sido expurgada, recriada e expurgada
      // outra vez (o índice guarda `recriacao`), e o painel mostra a saída mais recente.
      expurgada_em: (inv && Array.isArray(inv.expurgo) && inv.expurgo.length
        ? (inv.expurgo[inv.expurgo.length - 1] || {}).em || null
        : null),
      expurgos: (inv && Array.isArray(inv.expurgo)) ? inv.expurgo.length : 0,
      ciclos: minhaCiclos.map((c) => c.id),
      registros: meusRegistros.map((r) => r.id),
      contagens: {
        ciclos: minhaCiclos.length,
        ciclos_com_ancora: comAncora,
        aulas: minhaCiclos.reduce((s, c) => s + c.aulas.length, 0),
        registros: meusRegistros.length,
        anamneses: meusRegistros.filter((r) => r.tipo === 'anamnese').length,
        planos: meusRegistros.filter((r) => r.tipo === 'plano').length,
        pos: meusRegistros.filter((r) => r.tipo === 'po').length,
        /* O RECORTE CONTA-SE NO MESTRE, e o CONTEÚDO fica no índice da escola (§4.8). A contagem
         * não é dado de pessoa — é «quantas linhas de base esta escola tem» —, e é a mesma
         * natureza das outras quatro. O que NUNCA sobe é o `aspectos[]` nem a série: esses são
         * `acesso: escola`. */
        recortes: recortesPorEscola[slug].filter((r) => r.vigente).length,
      },
    });

    for (const p of professoresDaEscola) {
      const id = idDeProfessor(p);
      if (!professores.has(id)) {
        professores.set(id, {
          id,
          slug: p,
          // O NOME legível não está no diretório (que guarda o slug): está no inventário da
          // escola, e é de lá que ele sai — a mesma fonte da lista de professores da raiz. O
          // vínculo declarado traz o nome de quem não é o responsável.
          nome: nomeDoProfessorNoInventario(inv, p),
          escolas: [],
          ciclos: [],
        });
      }
      const reg = professores.get(id);
      // O NOME QUE FALTA É PREENCHIDO POR QUEM O SAIBA (22/10/2026). A ordem das escolas é
      // alfabética, e a primeira que menciona um professor pode não registar o nome dele — a
      // `batata` menciona o `sapo-bailarino` num ciclo, e são a `breu` e a `calango` que guardam
      // «Sapo Bailarino» no inventário. Antes, o vazio da primeira vencia o nome das outras.
      if (!reg.nome) {
        const talvez = nomeDoProfessorNoInventario(inv, p);
        if (talvez) reg.nome = talvez;
      }
      if (reg.escolas.indexOf(slug) === -1) reg.escolas.push(slug);
      for (const c of minhaCiclos) if (c.professor === p) reg.ciclos.push(c.id);
    }
  }

  /*
   * A PASTA TAMBÉM É UM PROFESSOR (22/10/2026). Até aqui, um professor só entrava na lista se
   * tivesse ciclo em alguma escola (ou se um expurgo o provasse). Quando a Produção passou a
   * criar a estrutura no próprio ato do cadastro, nasceu um estado legítimo e invisível: a pasta
   * `professores/<slug>/` existe, com os cinco schemas — e o professor não aparecia em lista
   * nenhuma. Foi assim que o `teclado-abnt` «faltou» na lista, criado às 08:52 com a escola viva.
   *
   * A pasta é o fato: quem a cria é o cadastro. O que ela NÃO diz é em que escola a pessoa
   * trabalha — isso vem do vínculo no inventário ou do ciclo. Sem os dois, ele entra com
   * `escolas: []`, e a lista diz «sem escola viva» em vez de o omitir.
   */
  const pastas = [];
  for (const caminho of caminhos) {
    const m = /^professores\/([a-z0-9][a-z0-9-]*)\//.exec(caminho);
    if (m && pastas.indexOf(m[1]) === -1) pastas.push(m[1]);
  }
  for (const slug of pastas.sort(porTexto)) {
    const id = idDeProfessor(slug);
    if (professores.has(id)) continue;
    professores.set(id, { id, slug, nome: null, escolas: [], ciclos: [] });
  }

  const acervo = {
    versao: VERSAO,
    gerado_em: e.agora || null,
    fonte: { commit: (e.fonte && e.fonte.commit) || null, arvore: (e.fonte && e.fonte.arvore) || null },
    escolas,
    professores: [...professores.values()].map((p) => Object.assign({}, p, {
      escolas: p.escolas.sort(porTexto),
      ciclos: p.ciclos.sort(porTexto),
    })).sort((a, b) => porTexto(a.id, b.id)),
    ciclos: ciclos.map((c) => ({
      id: c.id,
      professor: c.professor,
      numero: c.numero,
      escola: c.escola,
      estado: c.sem_ancora ? 'sem-ancora' : 'ancorado',
      // A AUSÊNCIA TEM NOME TAMBÉM AQUI. O mestre não traz a cobertura nem os caminhos (é a
      // regra de o manter pequeno), mas traz `sem_ancora` e `lida` — sem os dois, `ancora: {}`
      // leria-se como «tem âncora e não se sabe nada dela», que é o contrário do que se passa.
      sem_ancora: c.sem_ancora,
      documentos: c.documentos.length,
      aulas: c.aulas.length,
      ancora: c.ancora ? {
        id: c.ancora.id || null,
        hash: c.ancora.hash || null,
        parent_hash: c.ancora.parent_hash || '',
        lida: c.ancora.lida !== false,
        ...(c.ancora.lida === false ? { motivo: c.ancora.motivo || null } : {}),
      } : null,
    })),
    filtros: {
      escolas: facetas(escolas, 'slug').map(({ valor, contagem }) => ({ valor, rotulo: valor, contagem })),
      professores: [...professores.values()].map((p) => ({
        valor: p.slug, rotulo: p.nome || p.slug, contagem: p.escolas.length,
      })).sort((a, b) => porTexto(a.valor, b.valor)),
      tipos: [...new Set(escolas.flatMap((x) => x.registros.map((r) => String(r).split(':')[0])))]
        .sort(porTexto)
        .map((valor) => ({
          valor,
          rotulo: (TIPOS[valor] && TIPOS[valor].rotulo) || valor,
          contagem: registrosPorEscola
            ? slugs.reduce((s, slug) => s + (registrosPorEscola[slug] || []).filter((r) => r.tipo === valor).length, 0)
            : 0,
        })),
      anos: [...new Set(slugs.flatMap((slug) => (registrosPorEscola[slug] || []).map((r) => r.ano).filter(Boolean)))]
        .sort(porTexto)
        .map((valor) => ({
          valor,
          rotulo: valor,
          contagem: slugs.reduce((s, slug) => s + (registrosPorEscola[slug] || []).filter((r) => r.ano === valor).length, 0),
        })),
      estados: [
        { valor: 'ancorado', rotulo: 'Com âncora', contagem: ciclos.filter((c) => !c.sem_ancora).length },
        { valor: 'sem-ancora', rotulo: 'Sem âncora', contagem: ciclos.filter((c) => c.sem_ancora).length },
      ].filter((x) => x.contagem > 0),
    },
    nao_indexado: NAO_INDEXADO.map((x) => Object.assign({}, x)),
  };

  // 7. O DETALHE POR ESCOLA — o mesmo, com as listas longas e as facetas invertidas.
  const porEscola = {};
  for (const slug of slugs) {
    const mestre = escolas.find((x) => x.slug === slug);
    const meusCiclos = ciclos.filter((c) => c.escola === slug);
    const meusRegistros = registrosPorEscola[slug] || [];
    const todos = meusRegistros.concat(meusCiclos.map((c) => ({
      id: c.id,
      tipo: 'ciclo',
      carimbo: c.id,
      ano: null,
      professor: c.professor,
    })));
    porEscola[slug] = {
      versao: VERSAO,
      gerado_em: acervo.gerado_em,
      fonte: acervo.fonte,
      escola: mestre,
      registros: meusRegistros,
      ciclos: meusCiclos,
      /* O RECORTE DO CORPO, COM A SÉRIE (05/11/2026). `acesso: escola` — este arquivo só é
       * servido no domínio da própria escola, atrás de autenticação (§9.1). O acervo transversal
       * leva apenas a CONTAGEM (no mestre, acima), e a verificação 15 exige-o. */
      recortes: recortesPorEscola[slug],
      /* A JANELA DO TEMPO POR ASPECTO, derivada das versões. `contagem` = recortes vigentes que o
       * olham hoje; `versoes` = actos (de qualquer data) que alguma vez o escolheram;
       * `primeira`/`ultima` = os carimbos das pontas. É o «a partir do presente olhar para o
       * passado», e sem esta lista seria abrir os ficheiros um a um. */
      aspectos: aspectosDoRecorte(recortesPorEscola[slug]),
      filtros: {
        tipos: facetas(todos, 'tipo').map((f) => Object.assign({}, f, {
          rotulo: (TIPOS[f.valor] && TIPOS[f.valor].rotulo) || f.valor,
        })),
        professores: facetas(todos.filter((x) => x.professor), 'professor'),
        anos: facetas(meusRegistros.filter((r) => r.ano), 'ano'),
        /* OS ASPECTOS DO RECORTE — o «filtro rápido» que ela pediu, pronto a ler (§7.2: a conta é
         * da derivação, não da interface). O `valor` é o id do aspecto; a `contagem` é em quantos
         * recortes VIGENTES ele está, e os `ids` são esses recortes — a forma de todas as facetas,
         * e é o que a verificação 10 confere. A SÉRIE (primeira/última vez) vai na lista
         * `aspectos` logo abaixo, e não aqui: uma faceta responde «quantos», a série responde
         * «desde quando». */
        aspectos: facetas(
          recortesPorEscola[slug].filter((r) => r.vigente).flatMap((r) => r.aspectos.map((a) => ({ aspecto: a, id: r.id }))),
          'aspecto',
        ).map((f) => Object.assign({}, f, { rotulo: f.valor })),
       // O ESTADO VEM DO QUE EXISTE, não de uma lista fixa: uma faceta com zero valores é uma
        // promessa que a interface não pode cumprir.
        estados: [
          { valor: 'ancorado', rotulo: 'Com âncora', contagem: meusCiclos.filter((c) => !c.sem_ancora).length,
            ids: meusCiclos.filter((c) => !c.sem_ancora).map((c) => c.id) },
          { valor: 'sem-ancora', rotulo: 'Sem âncora', contagem: meusCiclos.filter((c) => c.sem_ancora).length,
            ids: meusCiclos.filter((c) => c.sem_ancora).map((c) => c.id) },
        ].filter((x) => x.contagem > 0),
      },
      nao_indexado: NAO_INDEXADO.map((x) => Object.assign({}, x)),
    };
  }

  return { acervo, escolas: porEscola };
}

// ------------------------------------------------------------------ as consultas

/**
 * FILTRAR sobre o índice — interseção de listas, nunca varredura de documentos.
 *
 * Os filtros aceitos são os de §7.1, e cada um é uma faceta já calculada. Um valor que não
 * existe devolve a lista vazia com `filtro: true` — e a resposta DIZ isso, em vez de deixar o
 * leitor supor que o acervo não tem nada.
 */
function filtrar(escola, filtros) {
  const f = filtros || {};
  let ids = null;
  const aplicados = {};
  const facetaDe = (nome) => (escola.filtros && escola.filtros[nome]) || [];
  const cruzar = (lista) => {
    if (ids === null) { ids = lista.slice(); return; }
    const conjunto = new Set(lista);
    ids = ids.filter((id) => conjunto.has(id));
  };

  for (const [nome, valor] of Object.entries(f)) {
    if (valor === null || valor === undefined || valor === '') continue;
    const faceta = facetaDe(nome);
    if (!faceta.length) continue;   // faceta que esta escola não tem: o filtro não a alcança
    const achado = faceta.find((x) => String(x.valor) === String(valor));
    cruzar(achado ? achado.ids || [] : []);
    aplicados[nome] = String(valor);
  }

  if (ids === null) {
    ids = escola.registros.map((r) => r.id).concat(escola.ciclos.map((c) => c.id));
  }
  const conjunto = new Set(ids);
  return {
    ids: ids.sort(porTexto),
    registros: escola.registros.filter((r) => conjunto.has(r.id)),
    ciclos: escola.ciclos.filter((c) => conjunto.has(c.id)),
    filtros: aplicados,
  };
}

/**
 * AS PERGUNTAS QUE O ÍNDICE RESPONDE HOJE — e só essas.
 *
 * Cada uma devolve **medida + caminho + elo**, que é a forma da resposta de proveniência
 * (§1 do PLANO-PERGUNTAS): um número, onde está o original, e o hash que prova que é o mesmo
 * documento. Uma pergunta sem esses três é uma listagem, e a resposta diz qual é o caso.
 *
 * Perguntas com nome (as que têm dados hoje):
 *   GE01  contagens por escola
 *   CT01  ciclos da escola, com âncora e nº de aulas
 *   PV01  as âncoras e a sua cadeia (quem é pai de quem)
 *   AL01  registros por aluna (só no índice da escola, onde o apelido existe)
 *   TR01  turmas que já têm plano
 *   OB01  as colunas do PO não são indexadas — a resposta RECUSA com o motivo
 */
function responder(escola, pergunta, argumento) {
  const p = String(pergunta || '').toUpperCase();
  const arg = argumento === undefined ? null : argumento;

  // O MESTRE NÃO É UMA ESCOLA. Ele tem as listas de IDs, não os registos — e uma pergunta que
  // precisa de linha (a aluna, a turma) não se responde com um mestre. Recusar com o motivo é
  // melhor que estourar: quem chamou fica a saber que a pergunta é do índice da escola.
  if (!Array.isArray(escola && escola.registros) || !Array.isArray(escola && escola.ciclos)) {
    return {
      pergunta: p || null,
      recusa: 'esta pergunta é do índice de UMA escola — o índice do acervo só traz contagens '
        + 'e caminhos. Peça-a ao Worker da escola (GET /api/indice/<pergunta>).',
      medida: null,
      caminho: null,
      elo: null,
    };
  }

  if (p === 'GE01') {
    return {
      pergunta: 'GE01',
      medida: escola.escola.contagens,
      caminho: 'GET /api/indice',
      elo: escola.ciclos.map((c) => c.ancora && c.ancora.hash).filter(Boolean),
    };
  }

  if (p === 'CT01') {
    return {
      pergunta: 'CT01',
      medida: escola.ciclos.map((c) => ({
        ciclo: c.id,
        aulas: c.aulas.length,
        estado: c.sem_ancora ? 'sem-ancora' : 'ancorado',
      })),
      caminho: escola.ciclos.map((c) => c.pacote).filter(Boolean),
      elo: escola.ciclos.map((c) => (c.ancora ? c.ancora.hash : null)),
    };
  }

  if (p === 'PV01') {
    /*
     * TRÊS ESTADOS, NÃO DOIS (20/10/2026). A primeira versão punha `lida: false` quando não
     * havia âncora nenhuma — e isso CONFUNDE as duas ausências que esta casa aprendeu a
     * separar: «não há âncora» (o ciclo ainda não foi ancorado) e «há âncora e não se abriu o
     * arquivo». O campo `estado` diz qual dos três é, e `lida`/`hash`/`cobertura` só aparecem
     * quando há o que dizer — uma cobertura `0` numa âncora não lida diria «não cobre nada».
     */
    const linha = (c, a, extra) => {
      const base = Object.assign({ ciclo: c.id }, extra);
      if (!a) return Object.assign(base, { ancora: null, estado: 'sem-ancora' });
      if (a.lida === false) {
        return Object.assign(base, {
          ancora: a.id || null, estado: 'nao-lida',
          ...(a.motivo ? { motivo: a.motivo } : {}),
          caminho: a.caminho || null,
        });
      }
      return Object.assign(base, {
        ancora: a.id || null,
        estado: 'lida',
        hash: a.hash || null,
        parent: a.parent_hash || '',
        cobertura: Array.isArray(a.cobertura) ? a.cobertura.length : 0,
      });
    };
    return {
      pergunta: 'PV01',
      medida: escola.ciclos.map((c) => linha(c, c.ancora, {}))
        .concat(escola.ciclos.flatMap((c) => (c.aulas || []).map((a) => linha(c, a.ancora, { aula: a.numero })))),
      caminho: escola.ciclos.map((c) => (c.ancora ? c.ancora.caminho : null)).filter(Boolean),
      elo: escola.ciclos.map((c) => (c.ancora ? c.ancora.hash : null)).filter(Boolean),
    };
  }

  if (p === 'AL01') {
    const alvo = arg ? String(arg) : null;
    const minhas = escola.registros.filter((r) => r.tipo === 'anamnese' && (!alvo || r.aluna === alvo));
    // O APELIDO NÃO EXISTE EM TODO O LADO. No índice da ESCOLA ele está lá (é o mesmo dado que a
    // estante dela mostra, atrás da mesma senha); no do ACERVO, não. E o que se diz é diferente:
    // «não há anamnese» é um facto, «o apelido não está aqui» é uma fronteira. Confundir as duas
    // faria a escola ler uma recusa de arquitectura como se não tivesse alunas.
    const semApelido = escola.registros.some((r) => r.tipo === 'anamnese' && r.aluna === undefined);
    if (semApelido) {
      return {
        pergunta: 'AL01',
        recusa: 'o apelido não entra no índice do acervo; esta pergunta é do índice da escola (autenticado)',
        medida: null,
        caminho: null,
        elo: null,
      };
    }
    return {
      pergunta: 'AL01',
      medida: minhas.map((r) => ({ aluna: r.aluna, carimbo: r.carimbo, data: r.data })),
      caminho: minhas.map((r) => 'envelope/' + r.carimbo),
      elo: null,
      ...(minhas.length ? {} : {
        nota: alvo
          ? 'não há anamnese registada para «' + alvo + '» neste acervo'
          : 'não há anamnese registada nesta escola',
      }),
    };
  }

  if (p === 'TR01') {
    return {
      pergunta: 'TR01',
      medida: escola.registros.filter((r) => r.tipo === 'plano' && r.turma).map((r) => ({
        turma: r.turma, plano: r.carimbo, objetivo: r.objetivo || null,
      })),
      caminho: escola.registros.filter((r) => r.tipo === 'plano').map((r) => 'envelope/' + r.carimbo),
      elo: null,
    };
  }

  if (p === 'OB01') {
    const declarado = (escola.nao_indexado || []).find((x) => x.familia === 'marcas');
    return {
      pergunta: 'OB01',
      recusa: declarado ? declarado.motivo : 'as marcas não são indexadas',
      medida: null,
      caminho: null,
      elo: null,
    };
  }

  return {
    pergunta: p || null,
    recusa: 'esta pergunta ainda não é respondida pelo índice — o catálogo está em '
      + 'PLANO-PERGUNTAS-DA-PROVENIENCIA.md e a implementação é a camada L6',
    medida: null,
    caminho: null,
    elo: null,
  };
}

module.exports = {
  VERSAO,
  TIPOS,
  TIPOS_DE_DOCUMENTO,
  NAO_INDEXADO,
  idDeEscola,
  idDeProfessor,
  idDeCiclo,
  idDeEnvelope,
  anoDoCarimbo,
  dataDoCarimbo,
  cicloDoCaminho,
  escolaDoSufixo,
  tipoDoDocumento,
  construir,
  // A DERIVAÇÃO DO RECORTE, exportada para a prova a poder exercer sem construir um acervo
  // inteiro — e para o índice VIVO poder usar a MESMA conta quando quiser ler a série (hoje ele
  // só vê a linha vigente do KV, e diz isso).
  recortesDaEscola,
  aspectosDoRecorte,
  canonico,
  semVolateis,
  iguais,
  filtrar,
  responder,
  responsavelDoInventario,
  quandoDaEncarnacao,
  nomeDoProfessorNoInventario,
};
