'use strict';

/*
 * provar-escola-a-nascer.js — o professor é sempre novo no público, e a escola aparece na lista
 * antes de o CI acabar (16/11/2026).
 *
 * DUAS COISAS QUE ELA APONTOU NO MESMO RECADO, e que têm a mesma raiz: a diferença entre o que o
 * SISTEMA sabe e o que a TELA mostra.
 *
 *   1. «Eu criei uma escola, a Escola Abreu, e aí eu acessei aqui Escolas Vivas e não tem nenhuma.
 *      [...] independente se eu tiver no danca.pdd.com.br e criar a escola ou criar pelo
 *      lastro.pdd.com.br, tem que aparecer nas Escolas Vivas.»
 *
 *      A lista saía de `indices/acervo.json` — DERIVADO, regerado por um workflow que só corre
 *      depois de o `criar-escola` commitar o scaffold. Entre o 201 e o fim do CI, a escola existe
 *      no Cloudflare e não existe no índice. Não era o caso dela: eu criei uma escola para
 *      diagnosticar e ela também não apareceu, vinte minutos depois.
 *
 *   2. «Para quem tá no sistema pela página que é pública [...] não precisa ter aquela seleção ali
 *      de professor se é novo ou não. Já é sempre novo de cara.»
 *
 *      E, com isso, a regra do conflito: se o professor já existe, quem resolve é a administração —
 *      não é quem preenche, que não tem lista nem histórico para decidir.
 *
 * O QUE SE MEDE, e por que cada um é preciso:
 *   · o MESMO instante (mapa + registo comercial) tem de entrar na lista; o RESTO de uma criação
 *     que falhou (o mapa sem comercial) não pode entrar — senão a lista inventa escolas;
 *   · a escola que o índice já conhece não entra duas vezes;
 *   · a porta pública descarta o professor escolhido, e a do painel não;
 *   · a recusa por conflito diz coisas diferentes nas duas portas, e a do público diz para onde
 *     escrever.
 *
 *   node experimentos/provar-escola-a-nascer.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));

let ok = 0;
let ko = 0;
const conferir = (rotulo, condicao, detalhe) => {
  if (condicao) { ok += 1; console.log('  ok    ' + rotulo); return; }
  ko += 1;
  console.log('  FALHA ' + rotulo + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
};

function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
  };
}

(async () => {
  console.log('A. A escola que existe e o índice ainda não sabe');
  {
    /* O MAPA DIZ QUE O SISTEMA A SERVE; O REGISTO COMERCIAL DIZ QUE A CRIAÇÃO CHEGOU AO FIM. Os
     * dois são precisos, e cada um sem o outro mente numa direcção. */
    const kv = kvDeBolso({
      'escolas/por-host': JSON.stringify({
        'abreu.padd.com.br': 'abreu',
        'velha.padd.com.br': 'velha',
        'falhou.padd.com.br': 'falhou',
      }),
      // a que nasceu: mapa + comercial
      'bastidores/abreu/comercial': JSON.stringify({
        estado: 'aguardando', criadoEm: '2026-11-16T10:00:00.000Z', professor: 'ana-souza',
      }),
      'bastidores/abreu/cadastro': JSON.stringify({ escolaNome: 'Escola Abreu' }),
      // a que já é do índice: não pode entrar outra vez
      'bastidores/velha/comercial': JSON.stringify({ estado: 'ativa', criadoEm: '2026-01-01T00:00:00.000Z' }),
      // a criação que falhou: o rollback tirou o Worker e deixou o mapa
      // (`babados/falhou/comercial` não existe, e é isso que a distingue)
    });
    const r = await raiz.escolasANascer({ kv, conhecidas: [{ slug: 'velha' }] });
    conferir('a escola que nasceu entra na lista, marcada «a nascer»',
      r.length === 1 && r[0].slug === 'abreu' && r[0].aNascer === true, r.map((e) => e.slug));
    conferir('…com o NOME do cadastro, e não o slug', r[0].nome === 'Escola Abreu', r[0].nome);
    conferir('…e com o professor que a criação registou', r[0].professor === 'ana-souza', r[0].professor);
    conferir('…e com a data em que nasceu (é o que a coluna «Criada» mostra)',
      r[0].criada_em === '2026-11-16T10:00:00.000Z', r[0].criada_em);

    conferir('a que o índice já conhece NÃO entra duas vezes',
      r.filter((e) => e.slug === 'velha').length === 0, r.map((e) => e.slug));
    conferir('o resto de uma criação que falhou NÃO entra — sem registo comercial não há escola',
      r.filter((e) => e.slug === 'falhou').length === 0, r.map((e) => e.slug));
    conferir('…e uma escola recém-nascida não é «suspensa» nem «apagada»',
      r[0].expurgada === false && r[0].expurgada_em === null, null);

    const vazio = await raiz.escolasANascer({ kv: kvDeBolso(), conhecidas: [] });
    conferir('sem mapa, a lista não inventa nada', Array.isArray(vazio) && vazio.length === 0, vazio);
    const semKv = await raiz.escolasANascer({ kv: null, conhecidas: [] });
    conferir('sem KV, também não (e não lança)', Array.isArray(semKv) && semKv.length === 0, semKv);
  }

  console.log('\nB. A lista das vivas mostra-a, e diz o que ela é');
  {
    const html = painel.paginaDasVivas({
      escolas: [{
        slug: 'abreu', nome: 'Escola Abreu', professor: 'ana-souza',
        criada_em: '2026-11-16T10:00:00.000Z', aNascer: true,
        comercial: { estado: 'aguardando', criadoEm: '2026-11-16T10:00:00.000Z' },
      }],
      professores: [],
    });
    conferir('a escola aparece na lista das vivas', /Escola Abreu/.test(html), null);
    conferir('…com o selo «a nascer»', /a nascer/.test(html), null);
    /* E NÃO COM O SELO DA CONCILIAÇÃO: são dois assuntos diferentes, e confundi-los faria a pessoa
     * procurar um pagamento que ainda não há — ou pior, concluir que já houve um. */
    conferir('…e não com «a aguardar conciliação», que é outro estado',
      !/a aguardar conciliação/.test(html), null);
  }

  console.log('\nC. O professor: sempre novo no público, escolhido no painel');
  {
    /* A PORTA, e não a página: um pedido escrito à mão também passa por aqui. */
    const corpo = {
      nome: 'Escola Abreu',
      senhaAdmin: 'x', senhaProfessor: 'y',
      professorNome: 'Ana', professorSobrenome: 'Souza',
      professorExistente: 'alguem-que-existe',
      plano: 'basico',
    };
    const semCadastro = (o) => {
      const c = JSON.parse(JSON.stringify(corpo));
      delete c.professorNome; delete c.professorSobrenome;
      return Object.assign(c, o || {});
    };
    /* A página pública manda isto. O `professorExistente` é DESCARTADO — e a prova de que foi é a
     * resposta: sem ele, o nome do professor passa a ser obrigatório, e a recusa que volta é a do
     * nome. Se o campo tivesse sobrevivido, a validação passaria ao caminho do reúso. */
    /* O TOKEN DO CLOUDFLARE É FALSO, e o pedido nunca chega a usá-lo: a conferência da FORMA do
     * pedido (`validarCriacaoEscola`) corre antes de qualquer leitura de repositório ou de
     * Cloudflare. O que se mede aqui é qual caminho a validação tomou — e ela é pura. */
    const env = {
      HOST_PUBLICO: 'lastro.padd.com.br', HOST_DONO: 'danca.padd.com.br', SENHA_RAIZ: 'x',
      CORREIO_DE: 'Sistema Lastro <lastro@padd.com.br>',
      CLOUDFLARE_API_TOKEN: 'falso-para-a-prova',
    };
    const AUTH = 'Basic ' + Buffer.from('tmenegaz:x').toString('base64');
    const pedir = (host, caminho, corpoPedido) => raiz.fetch(new Request('https://' + host + caminho, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: AUTH },
      body: JSON.stringify(corpoPedido),
    }), env);
    const semNome = await pedir('lastro.padd.com.br', '/api/criar-escola', semCadastro());
    const json = await semNome.json();
    conferir('no PÚBLICO, o professor escolhido é descartado: sem nome dele, a criação não passa',
      semNome.status === 400 && /informe o nome do professor/i.test(String(json.erro || '')), json.erro);
    conferir('…e a mensagem não oferece «escolher um professor que já existe» (não há lista lá)',
      !/professor que já existe/i.test(String(json.erro || '')), json.erro);

    /* E o mesmo pedido no PAINEL continua a usar o caminho do reúso — a porta do proprietário não
     * mudou. O sinal é a recusa seguinte: sem cadastro completo no painel, o reúso segue para a
     * conferência do professor, e não para «informe o nome». */
    const noPainel = await pedir('danca.padd.com.br', '/api/criar-escola', semCadastro());
    const jsonPainel = await noPainel.json();
    conferir('no PAINEL, o mesmo corpo NÃO é recusado por falta de nome do professor',
      !/informe o nome do professor/i.test(String(jsonPainel.erro || '')), jsonPainel.erro);
  }

  console.log('\nD. O conflito diz coisas diferentes nas duas portas');
  {
    conferir('o endereço da administração sai do remetente do sistema',
      raiz.enderecoDaAdministracao({ CORREIO_DE: 'Sistema Lastro <lastro@padd.com.br>' }) === 'lastro@padd.com.br',
      raiz.enderecoDaAdministracao({ CORREIO_DE: 'Sistema Lastro <lastro@padd.com.br>' }));
    conferir('…e sem remetente não há endereço inventado', raiz.enderecoDaAdministracao({}) === null, null);

    /* As mensagens vivem dentro do `responderCriacao`, e medi-las de fora exigiria um Cloudflare
     * inteiro. O que se pode medir — e é o que interessa — é que AS DUAS EXISTEM e dizem coisas
     * diferentes: a do público manda procurar a administração; a do painel manda usar a lista. */
    const fonte = require('fs').readFileSync(path.join(RAIZ, 'motor/servidor/raiz.js'), 'utf8');
    conferir('a recusa por CPF repetido tem uma mensagem para o público',
      /administração do Sistema Lastro/.test(fonte), null);
    conferir('…e essa mensagem manda ESCREVER, com o endereço de quem administra',
      /contacto \? ' \(' \+ contacto \+ '\)'/.test(fonte), null);
    conferir('…e a do painel continua a mandar escolher na lista',
      /Escolha «um professor que já existe» na/.test(fonte), null);
    conferir('a recusa por nome repetido também se divide',
      (fonte.match(/origem === 'publico'/g) || []).length >= 3,
      (fonte.match(/origem === 'publico'/g) || []).length);
    conferir('…e o público não é mandado para uma etapa que não resolve nada',
      /if \(d\.colisao && !PUBLICO\)/.test(
        require('fs').readFileSync(path.join(RAIZ, 'raiz/index.html'), 'utf8')), null);
  }

  console.log('');
  console.log(ko === 0 ? 'TUDO CERTO — ' + ok + ' asserção(ões).'
    : 'FALHOU — ' + ok + '/' + (ok + ko) + ' asserção(ões).');
  process.exit(ko === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('EXPLODIU: ' + ((erro && erro.stack) || erro));
  process.exit(1);
});
