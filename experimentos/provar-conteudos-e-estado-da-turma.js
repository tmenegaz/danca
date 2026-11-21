#!/usr/bin/env node
'use strict';

/**
 * provar-conteudos-e-estado-da-turma.js — O CONTEÚDO VAI PARA A CURADORIA, E A TURMA PASSA A TER
 * TRÊS ESTADOS (03/11/2026).
 *
 * DUAS DECISÕES DELA, na mesma entrega, e as duas mexem na MESMA coisa: o que prende uma turma.
 *
 * 1. **O conteúdo não é da turma.** «O conteúdo prático/técnico a ser ensinado (ex.: plié,
 *    battement tendu) não deve pertencer ao cadastro estático da turma, pois isso é um ato
 *    pedagógico […] mover a atribuição e associação de conteúdo inteiramente para o formulário de
 *    Curadoria.» O que ele viu na tela foi o resíduo do contrário: o passo 3 da turma tinha os
 *    chips e o «Associar termo», e a curadoria não tinha nada.
 *
 * 2. **A turma presa a uma curadoria não se edita no lugar.** «Ao editar a turma "Balé Nível 1"
 *    mesmo após a curadoria já estar criada e vinculada, o sistema permite edições livres
 *    (indicando no perfil do professor que ele está vinculado, mas mantendo a turma classificada
 *    como "livre").»
 *
 * O QUE LIGA AS DUAS: a assimetria era o defeito, e não a mensagem. O PROFESSOR já tinha três
 * estados (livre → curado → vinculado); a TURMA tinha dois (livre / vinculada-ao-plano). Uma
 * turma que já compunha uma curadoria continuava editável — e a curadoria guarda o NOME da turma,
 * portanto renomeá-la partia a ligação **sem erro nenhum**: `curadoriaDaTurma` passava a devolver
 * `null`, o enquadramento desaparecia da listagem, e o plano daquele professor deixava de encontrar
 * a turma. É a mesma família do `undefined` numa comparação e da marca de `descontinuada` que
 * deixava de acender — o pior modo de falha deste sistema.
 *
 * O QUE SE MEDE, e em que camada:
 *
 *   §A o núcleo da composição — o mapa antigo somado às curadorias, sem duplicar e sem perder.
 *   §B o núcleo do estado — livre / curada / vinculada, com o motivo da recusa de cada um.
 *   §C a rota — a turma CURADA recusa editar (e diz como resolver); a LIVRE edita.
 *   §D a tela — o passo 3 da turma perdeu os conteúdos, e a curadoria ganhou-os.
 *   §E a nota da turma saiu do cadastro, e o que estava escrito não se apaga.
 *   §F a proveniência — um termo ensinado numa curadoria de turma com plano não se apaga.
 *
 *   node experimentos/provar-conteudos-e-estado-da-turma.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const conteudos = require(path.join(RAIZ, 'motor/nucleo/conteudos.js'));
const estado = require(path.join(RAIZ, 'motor/nucleo/estado-da-turma.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));

let total = 0;
let falhas = 0;
function checar(descricao, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

function criarKv(inicial) {
  const mapa = new Map(Object.entries(inicial || {}));
  return {
    mapa,
    async get(k) { return mapa.has(k) ? mapa.get(k) : null; },
    async put(k, v) { mapa.set(k, String(v)); },
    async delete(k) { mapa.delete(k); },
    async list() { return { keys: [...mapa.keys()].map((name) => ({ name })) }; },
  };
}

const TURMA = {
  id: 'bale-nivel-1', nome: 'Balé Nível 1', ordem: 1,
  dias: ['ter', 'qui'], horarios: { ter: '19:00', qui: '19:00' }, frequencia: 2,
  duracaoMin: 60, periodoInicio: '2027-02-01', periodoFim: '2027-04-30', ativo: true,
};

function ambiente(extra) {
  const kv = criarKv(Object.assign({
    'bastidores/breu/turmas': JSON.stringify([TURMA]),
    'bastidores/breu/professores': JSON.stringify([{ nome: 'Coqui de Redinha', modalidade: 'bale-classico' }]),
    'bastidores/breu/alunas': JSON.stringify(['Vavá']),
  }, extra || {}));
  const env = {
    // SEM `GITHUB_TOKEN`, e a omissão é a da casa (ver `provar-producao`): sem token o acervo é
    // o KV, e um KV sem envelopes devolve `[]` — «nenhum plano». Com token, a leitura iria à rede,
    // falharia, e `null` conta como VINCULADA: a bancada mediria sempre o mesmo estado, e todos os
    // casos de «livre» ficariam verdes por acidente.
    ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', PADD_KV: kv,
  };
  return { kv, env };
}

const pedir = (env, caminho, corpo) => bastidores.fetch(new Request(
  'https://breu.tmenegaz77.workers.dev' + caminho,
  corpo == null ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ senhaDirecao: 'x' }, corpo)),
  }), env);

// =====================================================================================
// A. O NÚCLEO — de quem é o conteúdo
// =====================================================================================
function oNucleoDosConteudos() {
  console.log('\nA. O NÚCLEO — o mapa antigo somado ao que as curadorias declaram');

  const turmas = [
    { id: 'bale-nivel-1', nome: 'Balé Nível 1' },
    { id: 'jazz-1', nome: 'Jazz 1' },
  ];
  // O QUE FICOU GRAVADO ANTES DA MUDANÇA: dois termos, em ids (era assim que o mapa antigo
  // gravava).
  const legado = { 'bale-nivel-1': ['plie', 'battement-tendu'] };
  // E O QUE AS CURADORIAS DECLARAM AGORA: um que já estava (com acento e maiúsculas, porque é o
  // NOME que o professor lê no chip) e um novo.
  const curs = [
    { id: 'c1', professor: 'coqui', modalidade: 'bale-classico', turmas: ['Balé Nível 1'],
      repertorio: ['Battement tendu', 'Sauté'] },
    { id: 'c2', professor: 'outro', modalidade: 'jazz', turmas: ['Jazz 1'], repertorio: [] },
  ];

  const daBale = conteudos.conteudosDaTurma(turmas[0], { legado, curadorias: curs });
  /* A REGRA MUDOU A 07/11/2026 — e a asserção que estava aqui media a regra ANTERIOR («o conteúdo
   * é a UNIÃO — o antigo e o da curadoria»). A união tinha uma razão boa (nenhuma escola perdia,
   * por uma decisão de Novembro, o que associou em Outubro) e um custo que ela viu na tela: na
   * `batata`, o plano de ensino ofereceu QUATRO parâmetros sobre dois declarados, e os dois a
   * mais eram o mapa antigo de uma rodada de testes anterior. «O professor olha no estilo que tem
   * exercício A e B, vai para o plano de ensino e encontra A, B, C e D. Não pode ser assim.»
   *
   * A PARTIR DE AGORA: a curadoria vigente diz o que a turma aprende; o mapa antigo é memória e
   * só fala quando não há quem declare. A prova inteira da regra — com as duas contraprovas — é
   * `experimentos/provar-escopo-do-plano.js`; aqui fica o caso deste fixture. */
  checar('a turma que DECLAROU aprende o que declarou (a memória não fala por cima)',
    daBale.ids.join('|') === 'battement-tendu|saute', daBale.ids);
  checar('…e a origem de cada lado é dita, não inferida',
    daBale.doLegado.join('|') === 'plie|battement-tendu' && daBale.daCuradoria.join('|') === 'battement-tendu|saute',
    daBale);
  checar('…e `declarada` diz que houve quem declarasse', daBale.declarada === true, daBale.declarada);
  /* «Battement tendu» (nome) e `battement-tendu` (id) são o mesmo termo; ele está nos dois sítios
   * e conta uma vez — a normalização continua a ser o que impede uma lista de crescer com
   * duplicados que o professor não vê. */
  checar('o mesmo termo nos dois sítios conta UMA vez (nome e id são a mesma coisa)',
    daBale.ids.filter((x) => x === 'battement-tendu').length === 1, daBale.ids);
  /* A CONTRAPROVA, no lugar: sem curadoria para esta turma, o mapa antigo volta a valer. É o que
   * mantém vivas — sem migração nenhuma — as escolas que associavam conteúdos antes de 03/11. */
  const semDeclaracao = conteudos.conteudosDaTurma(turmas[0], { legado, curadorias: [] });
  checar('contraprova: sem curadoria, o mapa antigo volta a ser a lista',
    semDeclaracao.ids.join('|') === 'plie|battement-tendu' && semDeclaracao.declarada === false,
    semDeclaracao);
  const daJazz = conteudos.conteudosDaTurma(turmas[1], { legado, curadorias: curs });
  checar('uma turma sem mapa antigo e com curadoria vazia não inventa conteúdos',
    daJazz.ids.length === 0, daJazz.ids);

  /* A CURADORIA SUBSTITUÍDA NÃO SOMA. A versão nova herdou-lhe o repertório, e se o reduziu foi
   * uma decisão declarada — somar as duas faria o termo que o professor tirou voltar pela porta
   * do elo antigo, e a lista apareceria maior do que ele a deixou. */
  const comSubstituida = [
    { id: 'velha', turmas: ['Balé Nível 1'], repertorio: ['Plie', 'Fantasma'], substituidaPor: 'nova' },
    { id: 'nova', turmas: ['Balé Nível 1'], repertorio: ['Plie'] },
  ];
  const semFantasma = conteudos.conteudosDaTurma(turmas[0], { legado: null, curadorias: comSubstituida });
  checar('a curadoria substituída não devolve o termo que a nova tirou',
    semFantasma.ids.join('|') === 'plie', semFantasma.ids);

  // O MAPA INTEIRO, na forma do antigo — é o que os leitores já sabem ler.
  const mapa = conteudos.mapaDeConteudos({ legado, curadorias: curs, turmas });
  checar('o mapa composto tem uma chave por turma que aprende alguma coisa',
    Object.keys(mapa).sort().join('|') === 'bale-nivel-1', Object.keys(mapa));
  checar('…e o mapa antigo NÃO é somado a quem declarou (a declaração vence)',
    mapa['bale-nivel-1'].join('|') === 'battement-tendu|saute', mapa['bale-nivel-1']);
  const mapaSemCuradoria = conteudos.mapaDeConteudos({ legado, curadorias: [], turmas });
  checar('…e continua a ser somado — isto é, sozinho — quando ninguém declarou',
    mapaSemCuradoria['bale-nivel-1'].join('|') === 'plie|battement-tendu', mapaSemCuradoria['bale-nivel-1']);

  // A LIGAÇÃO POR NOME, e o id como recurso — a curadoria guarda o NOME da turma.
  checar('a curadoria encontra a turma pelo NOME',
    conteudos.curadoriasQueEnsinam(curs, turmas[0]).length === 1);
  checar('…e também pelo ID (uma curadoria antiga pode guardá-lo)',
    conteudos.curadoriasQueEnsinam([{ turmas: ['bale-nivel-1'] }], turmas[0]).length === 1);
  checar('…mas não encontra a turma errada',
    conteudos.curadoriasQueEnsinam(curs, turmas[1]).length === 1
      && conteudos.curadoriasQueEnsinam(curs, turmas[1])[0].id === 'c2');
}

// =====================================================================================
// B. O NÚCLEO — os três estados da turma
// =====================================================================================
function oNucleoDoEstado() {
  console.log('\nB. O NÚCLEO — livre, curada, vinculada (e o motivo de cada recusa)');

  const curs = [
    { id: 'c1', turmas: ['Balé Nível 1'] },
    { id: 'c2', turmas: ['Jazz 1'], substituidaPor: 'c2-nova' },
  ];
  const semPlano = new Set();
  checar('turma sem plano e sem curadoria é LIVRE',
    estado.estadoDaTurma({ nome: 'Contemporâneo' }, { turmasComPlano: semPlano, curadorias: curs }) === 'livre');
  checar('turma que compõe uma Turma activa é CURADA',
    estado.estadoDaTurma({ nome: 'Balé Nível 1' }, { turmasComPlano: semPlano, curadorias: curs }) === 'curada');
  checar('turma com plano é VINCULADA',
    estado.estadoDaTurma({ nome: 'Contemporâneo' },
      { turmasComPlano: new Set(['Contemporâneo']), curadorias: curs }) === 'vinculada');
  /* A CURADORIA SUBSTITUÍDA NÃO PRENDE: ela desceu para o histórico. Se prendesse, uma turma
   * ficaria travada para sempre por causa de uma curadoria que já ninguém usa. */
  checar('a curadoria SUBSTITUÍDA não prende a turma',
    estado.estadoDaTurma({ nome: 'Jazz 1' }, { turmasComPlano: semPlano, curadorias: curs }) === 'livre');
  /* O LADO SEGURO: quando a leitura falha, conta como presa. Derivar o que está livre é um elo a
   * mais; editar o que está vinculado partiria o passado. É a mesma regra do `turmaVinculadaA`. */
  checar('`null` (não deu para ler os planos) conta como VINCULADA',
    estado.estadoDaTurma({ nome: 'X' }, { turmasComPlano: null, curadorias: curs }) === 'vinculada');
  checar('`null` nas curadorias também conta como VINCULADA',
    estado.estadoDaTurma({ nome: 'X' }, { turmasComPlano: semPlano, curadorias: null }) === 'vinculada');

  checar('só a LIVRE se edita no lugar',
    estado.podeEditarNoLugar('livre') === true
      && estado.podeEditarNoLugar('curada') === false
      && estado.podeEditarNoLugar('vinculada') === false);
  /* OS DOIS MOTIVOS DIZEM COISAS DIFERENTES, e a diferença importa: `vinculada` é definitivo («o
   * plano já cita»); `curada` é reversível («enquanto não houver plano, a curadoria pode ser
   * removida»). A mesma frase nos dois casos mandaria a escola procurar um plano que não existe. */
  const motivoCurada = estado.motivoDaRecusa('curada', 'Balé Nível 1');
  const motivoVinculada = estado.motivoDaRecusa('vinculada', 'Balé Nível 1');
  /* O MOTIVO NOMEIA A TURMA, E NÃO «A CURADORIA» (20/11/2026). O estado continua a chamar-se
   * `curada` no núcleo — é o que `podeEditarNoLugar` recebe —, mas a frase é lida pela escola, e
   * no vocabulário do produto o que existe é a TURMA. A asserção guarda o que sempre guardou: o
   * motivo diz QUAL das duas coisas trava, e diz como resolver. */
  checar('o motivo da CURADA nomeia a turma e diz como resolver',
    /compõe uma turma|numa turma activa/i.test(motivoCurada)
    && /remova\s+primeiro a turma/i.test(motivoCurada), motivoCurada);
  checar('o motivo da VINCULADA nomeia o plano de ensino',
    /plano de ensino/.test(motivoVinculada) && !/compõe uma turma|numa turma activa/i.test(motivoVinculada),
    motivoVinculada);
  checar('…e os dois mandam DERIVAR (é a saída, e é a mesma)',
    /derive/i.test(motivoCurada) && /derive/i.test(motivoVinculada));
}

// =====================================================================================
// C. A ROTA — a turma curada recusa, a livre edita
// =====================================================================================
async function aRota() {
  console.log('\nC. A ROTA — o que a tela mostra é comodidade; a regra é a linha do servidor');

  // 1) Com uma Turma activa: editar é RECUSADO, e a recusa diz porquê.
  {
    const { kv, env } = ambiente({
      'bastidores/breu/curadorias': JSON.stringify([
        { id: 'c-coqui-bale-nivel-1', professor: 'coqui-de-redinha', modalidade: 'bale-classico',
          tradicao: 'RAD', turmas: ['Balé Nível 1'], alunas: ['Vavá'], repertorio: ['Plié'] },
      ]),
    });
    const r = await pedir(env, '/api/bastidores/turma-editar', Object.assign({}, TURMA, {
      id: 'bale-nivel-1', nome: 'Balé Nível Dois',
    }));
    const d = await r.json();
    checar('renomear uma turma CURADA é recusado', r.status === 409, { status: r.status, d });
    checar('…e a recusa diz que é por causa da turma, não de um plano',
      /compõe uma turma|numa turma activa/i.test(String(d.erro)) && /plano/.test(String(d.erro)), d.erro);
    checar('…e o estado vem no corpo (a tela não tem de o adivinhar)', d.estado === 'curada', d.estado);
    const lista = JSON.parse(kv.mapa.get('bastidores/breu/turmas'));
    checar('…e a turma NÃO foi tocada — o nome é o mesmo',
      lista[0].nome === 'Balé Nível 1', lista[0].nome);
    /* O CONTROLO NEGATIVO, e é o que dá sentido ao resto: sem a guarda, a ligação PARTIA-SE. O
     * nome mudava e a curadoria ficava a apontar para o vazio — sem erro nenhum. É a asserção que
     * mede o defeito relatado, e não a correcção. */
    const curs = JSON.parse(kv.mapa.get('bastidores/breu/curadorias'));
    checar('…e a curadoria continua a encontrar a turma (a ligação não se partiu)',
      conteudos.curadoriasQueEnsinam(curs, lista[0]).length === 1);
    /* O DEFEITO, MEDIDO. Não basta olhar para o nome: a curadoria guarda o NOME da turma, mas o
     * registo também tem um id — e o id da turma é o slug do nome (`turma-editar` re-chaveia-o
     * quando o nome muda). O que se mede é o registo como ele FICARIA: nome novo E id novo. Com
     * os dois, a curadoria deixa de a encontrar. */
    const comoFicaria = { id: 'bale-nivel-dois', nome: 'Balé Nível Dois' };
    checar('o defeito, medido: com o nome (e o id) novo, a curadoria deixaria de a encontrar',
      conteudos.curadoriasQueEnsinam(JSON.parse(JSON.stringify(curs)), comoFicaria).length === 0);
  }

  // 2) Sem curadoria e sem plano: editar é ACEITE (é o que torna a correcção possível).
  {
    const { kv, env } = ambiente();
    const r = await pedir(env, '/api/bastidores/turma-editar', Object.assign({}, TURMA, {
      id: 'bale-nivel-1', nome: 'Balé Nível Dois',
    }));
    checar('renomear uma turma LIVRE é aceite', r.status === 200, r.status);
    const lista = JSON.parse(kv.mapa.get('bastidores/breu/turmas'));
    checar('…e o nome mudou de facto', lista[0].nome === 'Balé Nível Dois', lista[0].nome);
  }

  // 3) Apagar segue a mesma regra — apagar é a mesma coisa que renomear: o nome desaparece.
  {
    const { env } = ambiente({
      'bastidores/breu/curadorias': JSON.stringify([
        { id: 'c1', professor: 'coqui', modalidade: 'bale-classico', turmas: ['Balé Nível 1'], alunas: [] },
      ]),
    });
    const r = await bastidores.fetch(new Request(
      'https://breu.tmeneguz77.workers.dev/api/bastidores/turma', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaDirecao: 'x', id: 'bale-nivel-1' }),
      }), env);
    const d = await r.json();
    checar('apagar uma turma CURADA é recusado', r.status === 409, { status: r.status, d });
    checar('…e a recusa manda remover a curadoria primeiro',
      /curadoria/.test(String(d.erro)), d.erro);
  }

  // 4) A DERIVAÇÃO continua a funcionar, e é a saída para a turma curada — o nome fica.
  {
    const { kv, env } = ambiente({
      'bastidores/breu/curadorias': JSON.stringify([
        { id: 'c1', professor: 'coqui', modalidade: 'bale-classico', turmas: ['Balé Nível 1'], alunas: [] },
      ]),
    });
    const r = await pedir(env, '/api/bastidores/turma-derivar', Object.assign({}, TURMA, {
      derivarDe: 'bale-nivel-1', vigencia: '2026-09-01', duracaoMin: 90,
    }));
    checar('derivar uma turma CURADA é aceite (é a saída que a recusa indica)', r.status === 201, r.status);
    const lista = JSON.parse(kv.mapa.get('bastidores/breu/turmas'));
    const nova = lista.find((t) => t && !t.substituidaPor);
    checar('…e o elo novo tem o MESMO nome — é isso que preserva a ligação',
      nova && nova.nome === 'Balé Nível 1', nova && nova.nome);
    checar('…e o ritmo novo é o que a escola pediu', nova && nova.duracaoMin === 90, nova && nova.duracaoMin);
    checar('…e a curadoria continua a encontrar a turma',
      conteudos.curadoriasQueEnsinam(
        JSON.parse(kv.mapa.get('bastidores/breu/curadorias')), nova).length === 1);
  }
}

// =====================================================================================
// D. A TELA — o conteúdo mudou de formulário
// =====================================================================================
async function aTela() {
  console.log('\nD. A TELA — o passo 3 da turma perdeu os conteúdos, e a curadoria ganhou-os');

  const { env } = ambiente();
  const html = await (await pedir(env, '/bastidores/producao')).text();

  checar('o passo 3 da turma já não tem o bloco de conteúdos', html.includes('id="vinc-conteudos"') === false);
  checar('…nem o menu de termos da turma', html.includes('id="vinc-termo"') === false);
  checar('…nem o botão «Associar» de termo da turma', html.includes('id="vinc-associar-termo"') === false);
  checar('…nem os blocos ocultos que o formulário clonava',
    html.includes('conteudos-da-turma') === false);
  checar('o formulário da curadoria tem o escolhedor de conteúdos', html.includes('id="esc-conteudos"'), true);
  /* A LISTA DO MENU É A DOS EXERCÍCIOS QUE TÊM NOTAÇÃO (03/11/2026) — e esta asserção media o
   * contrário, com razão no dia em que foi escrita: o menu oferecia o vocabulário inteiro.
   *
   * O PEDIDO DELA: «a lista de conteúdos disponíveis na curadoria não deve ser estática ou
   * excessiva; ela deve crescer e refletir dinamicamente apenas os passos/verbetes que de fato
   * possuem notação/conteúdo cadastrado». A expectativa passa a ser DERIVADA do alfabeto — um
   * verbete conta quando tem uma música com pelo menos um trecho —, e não o número de termos: uma
   * asserção que fixasse «2» mediria o dia em que foi escrita, não a regra.
   */
  checar('…com uma opção por exercício que TEM notação, mais o «— escolher —»',
    (() => {
      const bloco = (html.match(/id="esc-conteudos"[\s\S]*?<\/select>/) || [''])[0];
      const n = (bloco.match(/<option /g) || []).length;
      /* A CONTAGEM É A DA PÁGINA, e a página filtra POR ESCOLA (`registosDaEscola`). Esta
       * expectativa contava o alfabeto inteiro e passou a divergir a 07/11/2026, quando o
       * «Battement jeté» ganhou trechos marcados com a escola `batata`: o exercício existe no
       * alfabeto, mas não é desta escola. O filtro não é um detalhe do fixture — é a regra que a
       * lista do «Conteúdo do Estilo» segue, e o fixture tem de a seguir também. */
      const alfabeto = require(path.join(RAIZ, 'biblioteca/modalidades/bale-classico/notacao.json'));
      const notacao = require(path.join(RAIZ, 'motor/nucleo/notacao.js'));
      const ESCOLA_DA_TELA = 'breu';
      const comNotacao = Object.keys(alfabeto.verbetes || {}).filter((nome) => {
        if (nome.startsWith('_')) return false;
        const musicas = notacao.registosDaEscola(alfabeto.verbetes[nome] || {}, ESCOLA_DA_TELA);
        return Object.keys(musicas).some((k) => {
          const celulas = (musicas[k] && musicas[k].celulas) || {};
          return Object.keys(celulas).some((d) => (celulas[d] || []).length > 0);
        });
      });
      return n === comNotacao.length + 1;
    })());
  checar('…e o vocabulário continua INTEIRO fora da curadoria (a lista não o apaga)',
    (() => {
      const bloco = (html.match(/id="esc-conteudos"[\s\S]*?<\/select>/) || [''])[0];
      const termos = require(path.join(RAIZ, 'motor/servidor/catalogo-seed.js')).TERMOS;
      return (bloco.match(/<option /g) || []).length < termos.length + 1;
    })());
  // A REGRA DA CASA: nenhum formulário traz parágrafo explicativo. O bloco novo podia tê-lo
  // trazido — e uma nota a explicar a lista é o começo de um formulário que se lê como um manual.
  checar('…e o bloco novo não traz parágrafo explicativo',
    !/<p class="nota">O que esta turma aprende/.test(html));

  const script = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).join('\n');
  checar('o conteúdo vai no corpo do submit da curadoria (não numa rota à parte)',
    /repertorio: fichasDe\("esc-conteudos"\)/.test(script));
  checar('…e é preenchido ao abrir uma curadoria para editar',
    /\["esc-conteudos", c\.repertorio \|\| \[\]\]/.test(script));
  checar('…e limpo ao cancelar (as fichas não são campos de formulário)',
    /\[\["esc-alunas"\], \["esc-conteudos"\]\]/.test(script));
  checar('os handlers antigos da associação por turma saíram do script',
    !/vinc-associar-termo/.test(script) && !/button\.desassociar/.test(script));
}

// =====================================================================================
// E. A NOTA DA TURMA
// =====================================================================================
async function aNota() {
  console.log('\nE. A NOTA — saiu do cadastro, e o que estava escrito fica onde está');

  const { kv, env } = ambiente({
    'bastidores/breu/turmas': JSON.stringify([
      Object.assign({}, TURMA, { descricao: 'Turma da tarde, sala 2' }),
    ]),
  });
  const html = await (await pedir(env, '/bastidores/producao')).text();
  checar('o campo da nota saiu do formulário', html.includes('id="tdescricao"') === false);

  // Editar a turma NÃO apaga a nota antiga: ela deixa de ser copiada, e o que não se copia fica.
  const r = await pedir(env, '/api/bastidores/turma-editar', Object.assign({}, TURMA, { id: 'bale-nivel-1' }));
  checar('a turma livre aceita a edição', r.status === 200, r.status);
  const depois = JSON.parse(kv.mapa.get('bastidores/breu/turmas'))[0];
  checar('…e a nota antiga continua gravada (não se reescreve o que já lá está)',
    depois.descricao === 'Turma da tarde, sala 2', depois.descricao);
  checar('…e o corpo NÃO a reescreve quando a manda (deixou de ser campo)',
    (await (async () => {
      const k2 = criarKv({ 'bastidores/breu/turmas': JSON.stringify([Object.assign({}, TURMA, { descricao: 'antiga' })]) });
      const e2 = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', PADD_KV: k2 };
      await pedir(e2, '/api/bastidores/turma-editar',
        Object.assign({}, TURMA, { id: 'bale-nivel-1', descricao: 'inventada agora' }));
      return JSON.parse(k2.mapa.get('bastidores/breu/turmas'))[0].descricao;
    })()) === 'antiga');
}

// =====================================================================================
// F. A PROVENIÊNCIA — o termo que uma curadoria ensina
// =====================================================================================
async function aProveniencia() {
  console.log('\nF. A PROVENIÊNCIA — o termo ensinado numa curadoria de turma com plano não se apaga');

  /* O DEFEITO QUE ESTA SECÇÃO MEDE, e é o que quase passou: a guarda de proveniência do termo lia
   * `turma-conteudos` — o mapa ANTIGO. Quando a associação passa a escrever no `repertorio` da
   * curadoria, uma guarda que só lê o mapa antigo responde «livre» a um termo que já está num
   * plano. A resposta errada não dá erro: deixa apagar. */
  const { kv, env } = ambiente({
    'bastidores/breu/curadorias': JSON.stringify([
      { id: 'c1', professor: 'coqui', modalidade: 'bale-classico', turmas: ['Balé Nível 1'],
        alunas: ['Vavá'], repertorio: ['Plié'] },
    ]),
  });

  // O mapa composto que a página usa já é o que a guarda consulta — e a composição é a do núcleo.
  const composto = conteudos.mapaDeConteudos({
    legado: {},
    curadorias: JSON.parse(kv.mapa.get('bastidores/breu/curadorias')),
    turmas: JSON.parse(kv.mapa.get('bastidores/breu/turmas')),
  });
  checar('o mapa composto conhece a turma e o termo que a curadoria declara',
    (composto['bale-nivel-1'] || []).indexOf('plie') !== -1, composto);
  /* O CONTROLO NEGATIVO, feito a sério: com o mapa antigo VAZIO, o que a composição sabe vem
   * todo da curadoria. Se este caso devolvesse vazio, a guarda estaria a ler o sítio errado — e
   * responder «livre» a um termo que já está num plano é o que deixa apagar. */
  const semMapaAntigo = conteudos.conteudosDaTurma(
    JSON.parse(kv.mapa.get('bastidores/breu/turmas'))[0],
    { legado: {}, curadorias: JSON.parse(kv.mapa.get('bastidores/breu/curadorias')) });
  checar('com o mapa antigo vazio, quem sabe do termo é a CURADORIA',
    semMapaAntigo.doLegado.length === 0 && semMapaAntigo.ids.join('|') === 'plie',
    semMapaAntigo);

  // E a composição sobrevive à rota: `GET /turma-conteudos` passou a devolver o composto.
  const api = await pedir(env, '/api/bastidores/turma-conteudos');
  const corpo = await api.json();
  checar('a rota do mapa devolve o COMPOSTO (e não só o antigo)',
    (corpo.relacoes['bale-nivel-1'] || []).indexOf('plie') !== -1, corpo.relacoes);

  // O REPERTÓRIO GRAVA-SE PELA ROTA DA CURADORIA, e a resposta diz que ficou lá.
  {
    const k = criarKv({
      'bastidores/breu/turmas': JSON.stringify([TURMA]),
      'bastidores/breu/alunas': JSON.stringify(['Vavá']),
      'bastidores/breu/professores': JSON.stringify([{ nome: 'Coqui de Redinha' }]),
    });
    const e = { ESCOLA_SLUG: 'breu', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'x', PADD_KV: k };
    const r = await pedir(e, '/api/bastidores/curadoria', {
      professor: 'Coqui de Redinha', modalidade: 'bale-classico', tradicao: 'RAD',
      turmas: ['Balé Nível 1'], alunas: ['Vavá'], repertorio: ['Plié', 'Battement tendu'],
    });
    checar('a curadoria grava o repertório que veio no corpo', r.status === 201, r.status);
    const g = JSON.parse(k.mapa.get('bastidores/breu/curadorias'))[0];
    checar('…e os dois termos ficam na curadoria, na ordem em que se escolheram',
      (g.repertorio || []).join('|') === 'Plié|Battement tendu', g.repertorio);

    // E O QUE NÃO VEIO NÃO SE APAGA (é a regra da proveniência, a mesma do derivar).
    const semRepertorio = await pedir(e, '/api/bastidores/curadoria', {
      professor: 'Coqui de Redinha', modalidade: 'bale-classico', tradicao: 'RAD',
      turmas: ['Balé Nível 1'], alunas: ['Vavá'],
    });
    const g2 = JSON.parse(k.mapa.get('bastidores/breu/curadorias'))[0];
    checar('editar a curadoria sem mandar o repertório NÃO o apaga',
      semRepertorio.status === 201 && (g2.repertorio || []).length === 2, g2.repertorio);
    checar('…mas mandá-lo VAZIO apaga (limpar é uma declaração, não uma omissão)',
      (await (async () => {
        await pedir(e, '/api/bastidores/curadoria', {
          professor: 'Coqui de Redinha', modalidade: 'bale-classico', tradicao: 'RAD',
          turmas: ['Balé Nível 1'], alunas: ['Vavá'], repertorio: [],
        });
        const g3 = JSON.parse(k.mapa.get('bastidores/breu/curadorias'))[0];
        return (g3.repertorio || []).length;
      })()) === 0);
  }
}

// =====================================================================================
// G. O FORMULÁRIO INTELIGENTE — a modalidade pelo professor, a tradição pela modalidade
// =====================================================================================
async function oFormularioInteligente() {
  console.log('\nG. O FORMULÁRIO INTELIGENTE — a modalidade vem do professor, a tradição vem da modalidade');

  const tradicoes = require(path.join(RAIZ, 'motor/nucleo/tradicoes.js'));
  const compartilhadas = ['RAD', 'francesa', 'Vaganova', 'cubana', 'compartilhada'];

  /* A PRECEDÊNCIA É A DO REPOSITÓRIO INTEIRO: o específico vence o compartilhado — a mesma regra
   * com que `tools/lib-fontes.sh` resolve as fontes de ciclo. */
  const doClassico = tradicoes.tradicoesDaModalidade('bale-classico',
    { porModalidade: { 'bale-classico': compartilhadas }, compartilhadas });
  checar('a modalidade com lista própria serve-se da lista dela',
    doClassico.de === 'modalidade' && doClassico.lista.length === 4, doClassico);
  checar('…e a `compartilhada` NUNCA entra na lista de opções (não é tradição a adotar)',
    doClassico.lista.indexOf('compartilhada') === -1, doClassico.lista);

  /* E A MODALIDADE SEM LISTA NÃO FICA SEM TRADIÇÕES. Uma modalidade sem lista ficaria vazia, e a
   * curadoria deixaria de se poder atribuir em jazz — uma regra nova que tranca o que já
   * funcionava. O `de` diz a verdade sobre o que se está a mostrar. */
  const doJazz = tradicoes.tradicoesDaModalidade('jazz',
    { porModalidade: { 'bale-classico': compartilhadas }, compartilhadas });
  checar('a modalidade sem lista própria cai na compartilhada', doJazz.de === 'compartilhada', doJazz);
  checar('…e não fica sem nenhuma tradição (a curadoria continua atribuível)',
    doJazz.lista.length === 4, doJazz.lista);
  checar('uma lista própria VAZIA não conta como lista — cai na compartilhada',
    tradicoes.tradicoesDaModalidade('jazz', { porModalidade: { jazz: [] }, compartilhadas }).de === 'compartilhada');

  // O NOME E O ID DÃO A MESMA RESPOSTA: o `<select>` guarda o nome, o perfil guarda o id.
  checar('a modalidade pode vir por NOME («Balé clássico») ou por ID (`bale-classico`)',
    tradicoes.tradicoesDaModalidade('Balé clássico',
      { porModalidade: { 'bale-classico': ['RAD'] }, compartilhadas }).lista.join('|') === 'RAD');

  // O MAPA QUE VAI PARA O CLIENTE
  const catalogo = require(path.join(RAIZ, 'biblioteca/modalidades/modalidades.json')).modalidades;
  const mapa = tradicoes.mapaDeTradicoes(catalogo,
    { porModalidade: { 'bale-classico': compartilhadas }, compartilhadas });
  checar('o mapa tem a chave vazia (nenhuma modalidade escolhida) e uma por modalidade',
    Object.prototype.hasOwnProperty.call(mapa, '')
      && Object.prototype.hasOwnProperty.call(mapa, 'Balé clássico')
      && Object.prototype.hasOwnProperty.call(mapa, 'Jazz'), Object.keys(mapa));

  // A PÁGINA SERVE O MAPA — e não uma segunda cópia das tradições.
  const { env } = ambiente();
  const html = await (await pedir(env, '/bastidores/producao')).text();
  checar('a página entrega o mapa das tradições por modalidade', html.includes('TRADICOES_DA_MODALIDADE'));
  checar('…e o rótulo de cada tradição (o `RAD` fica sigla)',
    /"francesa":"Francesa"/.test(html));
  checar('…e o catálogo das modalidades (id + nome + tem conteúdo)',
    /CATALOGO_DE_MODALIDADES = \[\{"id":"bale-classico","nome":"Balé clássico","temConteudo":true\}/.test(html));
  checar('a lista do clássico na página é a DA MODALIDADE, e não a compartilhada',
    /"Balé clássico":\{"lista":\[[^\]]*\],"de":"modalidade"\}/.test(html));
  checar('…e a de uma modalidade sem conteúdo declara-se compartilhada',
    /"Jazz":\{"lista":\[[^\]]*\],"de":"compartilhada"\}/.test(html));

  const script = (html.match(/<script>([\s\S]*?)<\/script>/g) || []).join('\n');
  checar('o filtro do professor pede o perfil à rota que existe', /\/api\/bastidores\/perfil\?professor=/.test(script));
  checar('…e lê o contrato dela: `existe`, `modalidades` e `catalogo`',
    /d\.existe/.test(script) && /d\.modalidades/.test(script) && /d\.catalogo/.test(script));
  checar('…sem declarar habilitações, a lista NÃO encolhe (procurar o catálogo inteiro)',
    /ainda não declarou as habilitações/.test(script));
  checar('…e uma falha de rede não tranca o formulário',
    /catch\(function\(\)\{/.test(script) && /aplicarHabilitacao\(slug\);/.test(script));
  /* DUAS ASSERÇÕES ENVELHECERAM, E O CONTRATO QUE ELAS GUARDAVAM MUDOU DE DONO (20/11/2026).
   *
   * `emEdicao` e `selModCu` eram variáveis do formulário da Turma. Quando o par (professor,
   * modalidade) saiu do formulário — 18/11/2026, «não há o que preencher, nem o que travar» —, as
   * duas desapareceram, e as asserções passaram a reprovar o script por não ter os nomes antigos.
   * Uma asserção que procura um identificador mede o identificador; o que se quer medir é o facto.
   *
   * O FACTO DE HOJE, e é mais forte do que era:
   *
   *   1. Não há «refiltrar por baixo» a temer, porque a curadoria que se está a abrir FICA DE FORA
   *      da comparação — `refiltrarAlunas` passa o id em edição como `idQueEdita`, e as alunas dela
   *      não competem consigo mesmas. Era isso que o `emEdicao` protegia, por outro caminho.
   *
   *   2. Quem manda na lista das tradições deixou de ser a modalidade escolhida à mão: é a SALA,
   *      que traz modalidade e tradição juntas (`pintarDaSala`). Mede-se o handler que existe. */
  checar('…e a curadoria em edição fica de fora da comparação (as alunas dela não competem consigo)',
    /alunasOcupadas\(modalidade, idAtual\)/.test(script) && /var idAtual = /.test(script));
  checar('a SALA manda na modalidade e na tradição (o handler existe)',
    /selTurmaCu\.addEventListener\("change", pintarDaSala\)/.test(script));
}

(async () => {
  oNucleoDosConteudos();
  oNucleoDoEstado();
  await aRota();
  await aTela();
  await aNota();
  await aProveniencia();
  await oFormularioInteligente();

  console.log('\n' + (falhas ? 'FALHARAM ' + falhas + ' de ' + total : 'TUDO CERTO') +
    ' — o conteúdo é da curadoria (e o mapa antigo continua a ler-se), a turma tem\n' +
    'três estados, e a ligação entre as duas já não se parte em silêncio.');
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('erro:', e.message); process.exit(1); });
