#!/usr/bin/env node
'use strict';

/*
 * provar-a-cobranca-pix.js — a coluna onde ela cola o Pix do banco, e onde ele reaparece.
 *
 * O QUE ELA PEDIU (25/11/2026), e é um caminho só do princípio ao fim:
 *
 *   «Eu preciso de uma outra coluna, que é onde eu vou colar o QR code ou a chave Pix. […] eu colo o
 *   conteúdo que essa área Pix cobrança do meu banco me entrega. Então é basicamente um campo texto.
 *   Não sei se é exatamente um campo texto, porque assim, quando eu colo no chat do WhatsApp, ele
 *   preserva a estrutura toda que essa ferramenta me entrega. Então eu quero algo assim.»
 *
 *   «E aí essa coluna ela vai reverberar lá em bastidores. Em bastidores estúdio a escola […] um
 *   nicho […] que se chama pagar Pix. Quando eu expando aparece a chave Pix cadastrada […] e tem que
 *   aparecer também abaixo esse conteúdo que eu colei. Se não tiver nada colado lá no financeiro,
 *   aparece somente a chave Pix mesmo.»
 *
 *   «Quando entrar em ver mês a mês […] também precisa ter essa coluna pix, tá? […] A gente vai tirar
 *   essa coluna pagar daqui e vai deixar só essa que é a do pix. E a pessoa copia e cola e faz o
 *   pagamento.»
 *
 * O QUE SE MEDE, secção a secção:
 *
 *   A. o NÚCLEO — a forma, a normalização e o que é recusado, sem KV e sem HTML;
 *   B. a ROTA — gravar, ler de volta, apagar com texto vazio, e recusar o que não é um mês;
 *   C. o FINANCEIRO — a coluna existe, com um campo que guarda as quebras de linha;
 *   D. a PÁGINA DA ESCOLA — o conteúdo por baixo da chave, e nada quando não há nada;
 *   E. o MÊS A MÊS — a coluna «Pagar» passou a ser a do Pix;
 *   F. os controlos negativos;
 *   G. o LINK DO BANCO — reconhecido, mostrado no «Pagar» da escola e no mês a mês, e escondido
 *      quando o que está guardado é um documento copia-e-cola. No FINANCEIRO não há link, por
 *      decisão dela;
 *   (O botão «Copiar» tem prova própria: `provar-o-copiar.js`. Ele é um assunto — a rotina é uma
 *   só e serve três páginas —, e um defeito dele não deve aparecer como um defeito da cobrança.)
 *
 *   node experimentos/provar-a-cobranca-pix.js
 */

const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const cobrancas = require(path.join(RAIZ, 'motor/nucleo/cobrancas.js'));
const raiz = require(path.join(RAIZ, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ, 'motor/servidor/painel-html.js'));
const bastidores = require(path.join(RAIZ, 'motor/servidor/bastidores.js'));
const comercial = require(path.join(RAIZ, 'motor/nucleo/comercial.js'));
const mensalidades = require(path.join(RAIZ, 'motor/nucleo/mensalidades.js'));

let provas = 0;
let falhas = 0;
function provar(titulo, condicao, detalhe) {
  provas += 1;
  if (condicao) { console.log('  ok    ' + titulo); return; }
  falhas += 1;
  console.log('  FALHOU ' + titulo + (detalhe === undefined ? '' : ' → ' + JSON.stringify(detalhe)));
}

function kvDeBolso(inicial) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(k) { return dados.has(k) ? dados.get(k) : null; },
    async put(k, v) { dados.set(k, String(v)); },
    async delete(k) { dados.delete(k); },
    chaves() { return [...dados.keys()].sort(); },
  };
}

/* O DOCUMENTO DELA, à letra: um Pix copia-e-cola tem uma linha comprida e, por baixo, o que a
 * ferramenta do banco escreve. As quebras de linha são o que tem de sobreviver. */
/* O LINK QUE O BANCO DELA GERA (25/11/2026) — o formato real, copiado do pedido. */
const URL_DO_BANCO = 'https://nubank.com.br/cobrar/sjlvj/6b06b7b4-7f6d-4311-9141-efced0b17233';
/* A MENSAGEM DO BANCO, à letra: o endereço vem DENTRO de uma frase. É o que ela cola. */
const MENSAGEM = 'Para me transferir R$ 0,01 pela conta do Nubank ou de outros bancos pelo Pix, '
  + 'entre em\n\n' + URL_DO_BANCO;
const PAYLOAD = '00020126580014BR.GOV.BCB.PIX0136chave-do-nubank\n'
  + '5204000053039865802BR5920SISTEMA LASTRO6009PASSO FUNDO\n'
  + '62070503***6304ABCD';
const MES = '2026-11';
/* A DATA EM QUE A COBRANÇA FOI COLADA. `gravarNoMapa` grava-a sempre, e ela é o que separa a
 * cobrança emitida NO PRAZO da emitida JÁ NO ATRASO — ver `situacaoDaCobranca`. Nos casos destas
 * páginas o mês já venceu (a adesão é a 1.º), e o que serve é a que foi emitida depois. */
const EMITIDA_NO_ATRASO = '2026-11-20T12:00:00.000Z';
/* UM DOCUMENTO EMV VÁLIDO, COM O VALOR DENTRO — é assim que o banco entrega uma cobrança de valor
 * fixo (campo 54). O `PAYLOAD` acima é o documento que ela colou, com os comprimentos escritos à
 * mão; este é construído a sério, para poder medir o leitor do valor. */
const tlv = (id, valor) => id + String(String(valor).length).padStart(2, '0') + valor;
const pixComValor = (reais) => '000201'
  + tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', 'chave-do-nubank'))
  + tlv('52', '0000') + tlv('53', '986')
  + (reais ? tlv('54', Number(reais).toFixed(2)) : '')
  + tlv('58', 'BR') + tlv('59', 'SISTEMA LASTRO') + tlv('60', 'PASSO FUNDO')
  + tlv('62', tlv('05', '***')) + '6304ABCD';

/** O extrato de uma escola com um mês em aberto. */
function situacaoComMesAberto(extra) {
  return mensalidades.situacaoDaEscola({
    escola: 'breu',
    contrato: Object.assign({
      plano: 'avancado', planoNome: 'Avançado', valorCentavos: 13990,
      criadoEm: '2026-11-01T12:00:00.000Z', estado: 'ativa',
    }, extra || {}),
    livro: [], agora: new Date('2026-11-25T12:00:00.000Z'),
  });
}

(async () => {
  /* ── A. O NÚCLEO ─────────────────────────────────────────────────────────────────────── */
  console.log('\nA. O NÚCLEO — a forma da cobrança, sem KV e sem HTML');

  {
    const r = cobrancas.gravarNoMapa({}, { escola: 'breu', mes: MES, texto: PAYLOAD, agora: '2026-11-25T10:00:00.000Z' });
    provar('gravar devolve `ok` e um mapa novo', r.ok === true && !!r.mapa, r.ok);
    provar('…o mapa NÃO é o objecto recebido — uma falha de rede não deixa o estado meio aplicado',
      (() => { const base = {}; const x = cobrancas.gravarNoMapa(base, { escola: 'breu', mes: MES, texto: 'a' }); return x.mapa !== base && Object.keys(base).length === 0; })());
    provar('…o texto é guardado com as quebras de linha', r.mapa.breu[MES].texto === PAYLOAD,
      r.mapa.breu[MES].texto);
    /* `\r\n` do Windows: a página desenha em `<textarea>`, que conta uma linha por `\n`. Sem esta
     * troca, um documento colado de um Windows aparece com linhas a mais — e o que se copia de volta
     * para o banco vai com `\r` no meio. */
    const crlf = cobrancas.gravarNoMapa({}, { escola: 'breu', mes: MES, texto: 'a\r\nb\rc' });
    provar('o `\\r\\n` do Windows passa a `\\n`', crlf.mapa.breu[MES].texto === 'a\nb\nc',
      crlf.mapa.breu[MES].texto);
    provar('o espaço a mais nas pontas não se guarda', (() => {
      const x = cobrancas.gravarNoMapa({}, { escola: 'breu', mes: MES, texto: '\n  abc  \n' });
      return x.mapa.breu[MES].texto === 'abc';
    })());
    provar('a data da gravação fica guardada ao lado do texto',
      r.mapa.breu[MES].em === '2026-11-25T10:00:00.000Z', r.mapa.breu[MES].em);

    /* O QUE É RECUSADO. Um mês que não é um mês é o erro que se comete ao colar na linha errada, e
     * um mês mal formado gravaria uma cobrança que nenhuma página volta a encontrar. */
    provar('um mês fora do formato AAAA-MM é RECUSADO, e diz o formato',
      cobrancas.gravarNoMapa({}, { escola: 'breu', mes: '11/2026', texto: 'a' }).ok === false
      && /AAAA-MM/.test(cobrancas.gravarNoMapa({}, { escola: 'breu', mes: '11/2026', texto: 'a' }).erro));
    provar('…e o mesmo para o mês 13', cobrancas.gravarNoMapa({}, { escola: 'breu', mes: '2026-13', texto: 'a' }).ok === false);
    provar('…e para um mês vazio', cobrancas.gravarNoMapa({}, { escola: 'breu', mes: '', texto: 'a' }).ok === false);
    provar('sem escola, não se grava', cobrancas.gravarNoMapa({}, { mes: MES, texto: 'a' }).ok === false);

    /* O TETO. Cortar o texto em silêncio deixaria uma cobrança que já não se cola no banco. */
    const grande = 'x'.repeat(cobrancas.LIMITE_DO_TEXTO + 1);
    const recusado = cobrancas.gravarNoMapa({}, { escola: 'breu', mes: MES, texto: grande });
    provar('um texto acima do limite é RECUSADO, e diz quantos caracteres tem',
      recusado.ok === false && /8001/.test(recusado.erro), recusado.erro);

    /* APAGAR é uma resposta, não uma ausência: ela colou, viu que estava errado, limpou o campo. */
    const apagada = cobrancas.gravarNoMapa(r.mapa, { escola: 'breu', mes: MES, texto: '   ' });
    provar('texto vazio APAGA a cobrança do mês', apagada.ok === true && apagada.apagada === true);
    provar('…e a escola sai do mapa quando o último mês dela sai',
      JSON.stringify(apagada.mapa) === '{}', apagada.mapa);

    /* A LEITURA degrada: um mapa partido não pode impedir a página de abrir. */
    provar('`cobrancaDe` devolve `null` para um mapa que não é um mapa',
      cobrancas.cobrancaDe(null, 'breu', MES) === null
      && cobrancas.cobrancaDe({ breu: 'lixo' }, 'breu', MES) === null);
    provar('…e para uma cobrança sem texto', cobrancas.cobrancaDe({ breu: { [MES]: { em: 'x' } } }, 'breu', MES) === null);
  }

  /* ── B. A ROTA ───────────────────────────────────────────────────────────────────────── */
  console.log('\nB. A ROTA — gravar, ler de volta, apagar');

  {
    const kv = kvDeBolso({
      'bastidores/breu/comercial': JSON.stringify({
        estado: 'ativa', plano: 'avancado', planoNome: 'Avançado',
        valorCentavos: 13990, valor: '139,90', criadoEm: '2026-11-01T12:00:00.000Z',
      }),
    });
    const env = { PADD_KV: kv, HOST_DONO: 'danca.padd.com.br', SENHA_RAIZ: 'x' };
    const autorizacao = 'Basic ' + Buffer.from('tmenegaz:x').toString('base64');
    const pedir = async (corpo) => {
      const r = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/cobranca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: autorizacao },
        body: JSON.stringify(corpo),
      }), env);
      let json = null;
      try { json = await r.json(); } catch (e) { json = null; }
      return { status: r.status, json };
    };

    const primeira = await pedir({ escola: 'breu', mes: MES, texto: PAYLOAD });
    provar('gravar responde `ok` e `mudou: true`',
      primeira.status === 200 && primeira.json.ok === true && primeira.json.mudou === true,
      { status: primeira.status, json: primeira.json });
    provar('…e devolve a cobrança como ficou, com o texto inteiro',
      primeira.json.cobranca && primeira.json.cobranca.texto === PAYLOAD,
      primeira.json.cobranca);

    const guardado = JSON.parse(kv.dados.get('financeiro/cobrancas'));
    provar('…e ela está no KV, na chave global, sob a escola e o mês',
      guardado.breu && guardado.breu[MES] && guardado.breu[MES].texto === PAYLOAD, guardado);

    /* GRAVAR DE NOVO O MESMO TEXTO NÃO ESCREVE: é a mesma regra da data do contrato — uma escrita
     * que não muda o que está guardado só gasta uma escrita e move o carimbo. */
    let escritas = 0;
    const putOriginal = kv.put.bind(kv);
    kv.put = async (k, v) => { escritas += 1; return putOriginal(k, v); };
    const igual = await pedir({ escola: 'breu', mes: MES, texto: PAYLOAD });
    provar('gravar o mesmo texto não muda nada (`mudou: false`)',
      igual.json && igual.json.mudou === false, igual.json && igual.json.mudou);
    provar('…e NÃO escreve no KV', escritas === 0, escritas);

    const segundo = await pedir({ escola: 'breu', mes: '2026-12', texto: 'outro documento' });
    const mapa = JSON.parse(kv.dados.get('financeiro/cobrancas'));
    provar('gravar outro mês NÃO apaga o primeiro',
      segundo.json.ok === true && mapa.breu[MES].texto === PAYLOAD
      && mapa.breu['2026-12'].texto === 'outro documento', Object.keys(mapa.breu));

    const limpa = await pedir({ escola: 'breu', mes: MES, texto: '' });
    const depois = JSON.parse(kv.dados.get('financeiro/cobrancas'));
    provar('texto vazio apaga, e a resposta diz que apagou',
      limpa.json.ok === true && limpa.json.apagada === true, limpa.json);
    provar('…e o mês desaparece do KV, sem levar o outro', !depois.breu[MES] && !!depois.breu['2026-12'],
      Object.keys(depois.breu));

    /* A ESCOLA TEM DE EXISTIR: uma cobrança num slug desconhecido ficaria à espera no KV e
     * apareceria no dia em que alguém criasse essa escola. */
    const fantasma = await pedir({ escola: 'nao-existe', mes: MES, texto: 'x' });
    provar('uma escola sem contrato é RECUSADA', fantasma.status === 400, fantasma.status);
    const mesRuim = await pedir({ escola: 'breu', mes: 'novembro', texto: 'x' });
    provar('um mês mal formado é RECUSADO pela rota', mesRuim.status === 400, mesRuim.status);

    /* E O PEDIDO SEM A SENHA DA DIREÇÃO não chega à rota — a chave da plataforma não se publica. */
    const semSenha = await raiz.fetch(new Request('https://danca.padd.com.br/api/financeiro/cobranca', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ escola: 'breu', mes: MES, texto: 'x' }),
    }), env);
    provar('sem a senha da direção a rota responde 401', semSenha.status === 401, semSenha.status);
  }

  /* ── C. O FINANCEIRO ─────────────────────────────────────────────────────────────────── */
  console.log('\nC. O FINANCEIRO — a coluna onde ela cola');

  {
    const s = situacaoComMesAberto();
    const conta = Object.assign({}, s, {
      escola: 'breu', nome: 'Breu', frase: 'x',
      cobrancas: { [MES]: { texto: PAYLOAD, em: '2026-11-25T10:00:00.000Z' } },
    });
    const html = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [], extrato: [conta], catalogo: comercial.catalogoDaPagina(),
    });
    provar('a tabela do extrato ganhou a coluna «Cobrança (Pix)»', /Cobrança \(Pix\)/.test(html));
    provar('…e ela vem DEPOIS de «Pago / ação» — são dois gestos diferentes',
      html.indexOf('<th>Cobrança (Pix)</th>') > html.indexOf('Pago / ação'));
    provar('o campo do mês existe, com o id que a linha conhece',
      /id="cob-breu-2026-11"/.test(html));
    provar('…e vem preenchido com o que está guardado',
      html.indexOf('00020126580014BR.GOV.BCB.PIX') !== -1);
    /* O BOTÃO NASCE DESLIGADO, e leva a assinatura do que a linha abriu — é o que faz uma gravação
     * sem alteração não gastar uma escrita de KV. Mede-se na ETIQUETA do botão, e não por uma
     * expressão sobre a página inteira: o `disabled` de outro botão não é este `disabled`. */
    const etiquetaDoBotao = (html.match(/<button[^>]*data-cobranca-gravar="breu"[^>]*>/) || [''])[0];
    provar('o botão de gravar nasce DESLIGADO',
      /\sdisabled(\s|>)/.test(etiquetaDoBotao), etiquetaDoBotao);
    provar('…e leva a assinatura do que a linha abriu, para não gastar uma escrita sem mudança',
      /data-cobranca-assinatura="00020126580014BR/.test(etiquetaDoBotao), etiquetaDoBotao);
    provar('com cobrança guardada há um botão para a copiar', /data-copiar="cob-breu-2026-11"/.test(html));

    /* SEM COBRANÇA, o campo está vazio e o botão de copiar não existe: um botão que copia o vazio
     * é pior do que nenhum. */
    const vazia = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [],
      extrato: [Object.assign({}, s, { escola: 'breu', nome: 'Breu', frase: 'x', cobrancas: {} })],
      catalogo: comercial.catalogoDaPagina(),
    });
    provar('sem cobrança, o campo existe mas está vazio',
      /id="cob-breu-2026-11"/.test(vazia) && vazia.indexOf('00020126580014BR') === -1);
    provar('…e não há botão de copiar para uma cobrança que não existe',
      !/data-copiar="cob-breu-2026-11"/.test(vazia));

    /* A ESCOLA EXPURGADA NÃO TEM A COLUNA NEM O CAMPO: o registo comercial dela já não existe, e a
     * rota recusa gravar. Mostrar o campo seria oferecer um gesto que falha. */
    const expurgada = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [],
      extrato: [Object.assign({}, s, { escola: 'breu', nome: 'Breu', frase: 'x', expurgada: true, cobrancas: {} })],
      catalogo: comercial.catalogoDaPagina(),
    });
    provar('a escola expurgada não tem a coluna da cobrança', !/Cobrança \(Pix\)/.test(expurgada));
  }

  /* ── D. A PÁGINA DA ESCOLA ───────────────────────────────────────────────────────────── */
  console.log('\nD. A PÁGINA DA ESCOLA — o conteúdo por baixo da chave');

  {
    const s = situacaoComMesAberto();
    const comCobranca = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' }, situacao: s,
      pix: { chave: '02150062917', titular: 'Tiago' },
      cobrancas: cobrancas.cobrancasDaEscola({ breu: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } } }, 'breu'),
    });
    provar('o nicho «Pagar» mostra a chave Pix', /escola-pix-chave/.test(comCobranca));
    provar('…e, ABAIXO, o conteúdo que ela colou',
      comCobranca.indexOf('00020126580014BR') > comCobranca.indexOf('escola-pix-chave'));
    provar('…num campo que guarda as quebras de linha, e não num parágrafo corrido',
      /<textarea[^>]*escola-cobranca-1[^>]*>[^<]*\n[^<]*<\/textarea>/.test(comCobranca),
      (comCobranca.match(/<textarea[^>]*escola-cobranca[^>]*>[\s\S]{0,80}/) || [''])[0]);
    provar('…com o mês no rótulo, para saber que documento paga o quê',
      /Cobrança de novembro de 2026/.test(comCobranca));
    provar('…e um botão para copiar', /data-copiar="escola-cobranca-1"/.test(comCobranca));

    /* «SE NÃO TIVER NADA COLADO, APARECE SOMENTE A CHAVE PIX MESMO» — sem rótulo de cobrança
     * nenhum, e sem um campo vazio a pedir para ser preenchido por quem não o pode preencher. */
    const semCobranca = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' }, situacao: s,
      pix: { chave: '02150062917', titular: 'Tiago' }, cobrancas: {},
    });
    provar('sem nada colado, aparece só a chave', /escola-pix-chave/.test(semCobranca)
      && !/escola-cobranca/.test(semCobranca));

    /* UMA COBRANÇA DE UM MÊS JÁ PAGO NÃO SE MOSTRA AQUI. Esta caixa existe para pagar AGORA; o
     * documento de um mês pago ao lado do que está a valer faria pagar duas vezes. */
    const soPago = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' },
      situacao: { situacao: 'em-dia', meses: [{ mes: MES, nome: 'novembro de 2026', status: 'pago', venceu: false }] },
      pix: { chave: '0215' },
      cobrancas: cobrancas.cobrancasDaEscola({ breu: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } } }, 'breu'),
    });
    provar('a cobrança de um mês PAGO não aparece na caixa de pagar', !/escola-cobranca/.test(soPago));

    /* E O DOCUMENTO NÃO DEPENDE DA CHAVE DA PLATAFORMA ESTAR CONFIGURADA: o Pix do banco traz a
     * chave dentro dele. Esconder o documento porque a chave do sistema está em branco seria
     * esconder o pagamento que ela acabou de entregar. */
    const semChave = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' }, situacao: s, pix: null,
      cobrancas: cobrancas.cobrancasDaEscola({ breu: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } } }, 'breu'),
    });
    provar('sem chave configurada, o documento colado aparece na mesma',
      /escola-cobranca-1/.test(semChave) && /00020126580014BR/.test(semChave));
  }

  /* ── E. O MÊS A MÊS DA ESCOLA ────────────────────────────────────────────────────────── */
  console.log('\nE. O MÊS A MÊS — a coluna «Pagar» passou a ser a do Pix');

  {
    const s = situacaoComMesAberto();
    const html = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: s, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } },
    });
    provar('o cabeçalho diz «Cobrança (Pix)»', /Cobrança \(Pix\)/.test(html));
    provar('…e já não há uma coluna chamada «Pagar»',
      !/<th scope="col">Pagar<\/th>/.test(html));
    provar('o mês com cobrança mostra o documento, num campo que se copia',
      /id="mes-pix-2026-11"/.test(html) && /data-copiar="mes-pix-2026-11"/.test(html));
    provar('…com as quebras de linha do documento', /00020126580014BR\.GOV\.BCB\.PIX0136chave-do-nubank\n/.test(html));

    /* SEM COBRANÇA, O MÊS EM ABERTO CONTINUA A TER PARA ONDE IR: o caminho para a caixa que tem a
     * chave. O «Pagar» não desapareceu do sistema — deixou de ser uma coluna, e passou a ser a
     * resposta de quem ainda não tem documento. */
    const semCobranca = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: s, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' }, cobrancas: {},
    });
    provar('sem cobrança, o mês em aberto tem o caminho para a caixa do Pix',
      /abrir=pagar/.test(semCobranca), null);
  }

  /* ── F. OS CONTROLOS NEGATIVOS ───────────────────────────────────────────────────────── */
  console.log('\nF. OS CONTROLOS NEGATIVOS');

  {
    /* Sem a coluna no extrato, a página não teria onde colar — o controlo é a própria asserção
     * acima, e aqui mede-se o contrário: um extrato SEM `cobrancas` não rebenta. A página degrada
     * para o campo vazio, que é a verdade de uma escola que nunca teve cobrança guardada. */
    const s = situacaoComMesAberto();
    let rebentou = false;
    let html = '';
    try {
      html = painel.paginaFinanceira({
        pix: {}, descontos: [], escolas: [],
        extrato: [Object.assign({}, s, { escola: 'breu', nome: 'Breu', frase: 'x' })],
        catalogo: comercial.catalogoDaPagina(),
      });
    } catch (e) { rebentou = true; }
    provar('CONTROLO: um extrato sem o campo `cobrancas` não rebenta a página', !rebentou);
    provar('…e desenha o campo vazio', /id="cob-breu-2026-11"/.test(html));

    /* E um mapa partido no KV — lixo que alguém escreveu à mão — não impede a rota de abrir. */
    const kv = kvDeBolso({ 'financeiro/cobrancas': 'isto não é JSON' });
    const lido = await raiz.lerCobrancas ? await raiz.lerCobrancas(kv) : null;
    provar('CONTROLO: um KV com lixo devolve o mapa vazio, e não uma excepção',
      lido !== null && typeof lido === 'object' && Object.keys(lido).length === 0, lido);

    /* O mapa vindo de fora com uma escola que não é um objecto também não rebenta nada. */
    provar('CONTROLO: `cobrancasDaEscola` com uma escola que não é um mapa devolve vazio',
      JSON.stringify(cobrancas.cobrancasDaEscola({ breu: 42 }, 'breu')) === '{}');
    provar('CONTROLO: `emAberto` com meses que não são uma lista devolve vazio',
      cobrancas.emAberto({ [MES]: { texto: 'a' } }, null).length === 0);
  }

  /* ── G. O LINK DO BANCO ──────────────────────────────────────────────────────────────── */
  console.log('\nG. O LINK DO BANCO — «eu preciso que esse link fique habilitado»');

  {
    provar('o link do banco é reconhecido dentro da mensagem do banco',
      cobrancas.urlDaCobranca(MENSAGEM) === URL_DO_BANCO, cobrancas.urlDaCobranca(MENSAGEM));
    provar('…e sozinho, sem texto em volta', cobrancas.urlDaCobranca(URL_DO_BANCO) === URL_DO_BANCO);
    /* O CONTROL O QUE IMPORTA: um documento copia-e-cola NÃO é um link. Se o reconhecedor aceitasse
     * qualquer texto, cada cobrança deste sistema virava um botão que não leva a lado nenhum. */
    provar('um Pix copia-e-cola NÃO vira link', cobrancas.urlDaCobranca(PAYLOAD) === null);
    provar('CONTROLO: um `javascript:` não vira link', cobrancas.urlDaCobranca('javascript:alert(1)') === null);
    provar('CONTROLO: um `data:` também não', cobrancas.urlDaCobranca('data:text/html,<b>x') === null);
    provar('CONTROLO: um esquema sem endereço não conta', cobrancas.urlDaCobranca('https://') === null);
    provar('…e sem `http(s)` não há link nenhum', cobrancas.urlDaCobranca('www.nubank.com.br/cobrar') === null);

    /* O PADRÃO É UM SÓ. O cliente recebe o do servidor, emitido no script — e é isto que impede duas
     * respostas a «isto é um link?». */
    const htmlDoFinanceiro = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [],
      extrato: [Object.assign({}, situacaoComMesAberto(), {
        escola: 'breu', nome: 'Breu', frase: 'x', cobrancas: {},
      })],
      catalogo: comercial.catalogoDaPagina(),
    });
    /* O FINANCEIRO JÁ NÃO TEM O LINK, E É DECISÃO DELA (25/11/2026)
     *
     * «Não precisa do botão pagar no banco na tabela que você mostra no danca.padd.com.br financeiro
     * na coluna cobrança. Não precisa disso.»
     *
     * Estas três asserções mediam o contrário até hoje — que o link aparecia aqui, que abria numa
     * janela nova e que levava `noopener noreferrer`. Foram REESCRITAS, e não apagadas: o que se
     * passa a afirmar é a ausência, e ela precisa de guarda porque o link continua a existir nas
     * outras duas páginas e é fácil voltar a pô-lo aqui por simetria. */
    provar('o financeiro NÃO mostra o botão «Pagar no banco» na coluna da cobrança',
      htmlDoFinanceiro.indexOf('data-cobranca-link') === -1
      && htmlDoFinanceiro.indexOf('Pagar no banco') === -1);
    provar('…e o script do cliente deixou de trazer o reconhecedor do link, que ali não serve',
      htmlDoFinanceiro.indexOf('padraoDaUrl') === -1
      && htmlDoFinanceiro.indexOf('new RegExp(' + JSON.stringify(cobrancas.PADRAO_DA_URL)) === -1);
    provar('…mas o campo da cobrança e o botão de copiar continuam lá',
      /id="cob-breu-2026-11"/.test(htmlDoFinanceiro));
  }

  {
    /* O «PAGAR» DA ESCOLA — «lá no financeiro da escola é que vai aparecer como link». */
    const s = situacaoComMesAberto();
    const comLink = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' }, situacao: s, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: MENSAGEM, em: EMITIDA_NO_ATRASO } },
    });
    provar('o «Pagar» da escola mostra o link do banco',
      /<a[^>]*href="https:\/\/nubank\.com\.br\/cobrar\/[^"]*"[^>]*>Pagar no banco<\/a>/.test(comLink));
    /* A COMPARAÇÃO É COM A CAIXA, e não com o `id` solto: o `id` aparece primeiro no `for=` do
     * rótulo, e medir contra ele diria que o link está depois de si mesmo. */
    provar('…e ele vem ACIMA da caixa do documento — o link resolve o pagamento num toque',
      comLink.indexOf('Pagar no banco') < comLink.indexOf('<textarea id="escola-cobranca-1"'),
      { link: comLink.indexOf('Pagar no banco'), caixa: comLink.indexOf('<textarea id="escola-cobranca-1"') });
    provar('…com o mesmo `noopener noreferrer`',
      /rel="noopener noreferrer"[^>]*>Pagar no banco</.test(comLink));

    const semLink = bastidores.cartaoDaEscola({
      escola: 'breu', cadastro: { escolaNome: 'Breu' }, situacao: s, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } },
    });
    provar('com um documento copia-e-cola, a escola NÃO vê botão nenhum — vê a caixa e o Copiar',
      !/Pagar no banco/.test(semLink) && /escola-cobranca-1/.test(semLink));
  }

  {
    /* O MÊS A MÊS — «é só quando eu entro mesmo no ver o mês a mês que precisa de ajuste para ser
     * como link». */
    const s = situacaoComMesAberto();
    const comLink = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: s, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: URL_DO_BANCO, em: EMITIDA_NO_ATRASO } },
    });
    provar('o mês a mês mostra o link do banco',
      /<a[^>]*href="https:\/\/nubank\.com\.br\/cobrar\/[^"]*"[^>]*>Pagar no banco<\/a>/.test(comLink));
    provar('…e mantém a caixa do texto, para quem paga pelo aplicativo do próprio banco',
      /mes-pix-2026-11/.test(comLink));
    provar('…com o link ACIMA da caixa', comLink.indexOf('Pagar no banco') < comLink.indexOf('mes-pix-2026-11'));

    const semLink = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: s, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } },
    });
    provar('com um documento copia-e-cola, o mês a mês não inventa um botão',
      !/Pagar no banco/.test(semLink) && /mes-pix-2026-11/.test(semLink));
  }

  console.log('\nH. O MÊS PAGO E O ATRASADO — a cobrança que não serve não se oferece');

  {
    /* O QUE ELA PEDIU: «quando eu clicar em pagar, está pago […] a coluna da cobrança pix […] fica
     * desabilitado»; e, para o mês vencido, «vai indicar que está atrasado […] eu vou ter que passar
     * o valor novo com multa e juros». E a pergunta que ela deixou aberta: «impedir que a pessoa
     * pague o valor menor». */

    /* A. O LEITOR DO VALOR — o campo 54 do documento Pix. */
    provar('o valor é lido do documento (campo 54), em cêntimos',
      cobrancas.valorDaCobranca(pixComValor(69.9)) === 6990,
      cobrancas.valorDaCobranca(pixComValor(69.9)));
    provar('…e sobrevive às quebras de linha de um «copiar» do telemóvel',
      cobrancas.valorDaCobranca(pixComValor(69.9).slice(0, 50) + '\n' + pixComValor(69.9).slice(50)) === 6990);
    provar('um código SEM valor devolve `null` — é de valor aberto', cobrancas.valorDaCobranca(pixComValor(null)) === null);
    provar('…e um link do banco também', cobrancas.valorDaCobranca(URL_DO_BANCO) === null);
    /* O TRUNCAMENTO QUE INTERESSA é o do CAMPO, e não o do fim do documento: cortar o `6304…` (o
     * CRC) não afecta um valor que já foi lido antes dele. Aqui o campo 54 declara 6 caracteres e
     * traz 4 — o comprimento passa do fim, e a resposta tem de ser «não sei», não um palpite. */
    provar('CONTROLO: um campo 54 truncado não dá um valor por engano',
      cobrancas.valorDaCobranca('000201' + tlv('52', '0000') + '5406' + '69.9') === null,
      cobrancas.valorDaCobranca('000201' + tlv('52', '0000') + '5406' + '69.9'));

    /* B. OS ESTADOS. */
    const estado = (o) => cobrancas.situacaoDaCobranca(o);
    provar('mês PAGO: não serve, e diz porquê',
      (() => { const e = estado({ texto: pixComValor(69.9), valorBaseCentavos: 6990, pago: true });
        return e.estado === 'pago' && e.serve === false && /pago/i.test(e.motivo); })());
    provar('mês A VENCER: serve',
      (() => { const e = estado({ texto: pixComValor(69.9), valorBaseCentavos: 6990, venceu: false });
        return e.estado === 'a-vencer' && e.serve === true; })());
    provar('mês VENCIDO com a cobrança antiga (sem a mora): NÃO serve, e diz o valor a gerar',
      (() => { const e = estado({ texto: pixComValor(69.9), valorBaseCentavos: 6990, venceu: true, devidoCentavos: 7270 });
        return e.estado === 'sem-mora' && e.serve === false && /72,70/.test(e.motivo); })());
    provar('mês VENCIDO com a cobrança NOVA (com a mora): serve',
      (() => { const e = estado({ texto: pixComValor(72.7), valorBaseCentavos: 6990, venceu: true, devidoCentavos: 7270 });
        return e.estado === 'com-mora' && e.serve === true && e.faltaCentavos === 0; })());
    /* A COBRANÇA EMITIDA JÁ NO ATRASO serve MESMO SEM VALOR LEGÍVEL — e é esta a válvula que impede
     * um mês atrasado de ficar sem saída para quem cola um link (ou um código sem o campo 54). */
    provar('mês VENCIDO com a cobrança emitida JÁ NO ATRASO: serve, mesmo sem valor legível',
      (() => { const e = estado({ texto: URL_DO_BANCO, valorBaseCentavos: 6990, venceu: true,
        devidoCentavos: 7270, salvoEm: EMITIDA_NO_ATRASO, vencimento: '2026-11-01' });
        return e.estado === 'com-mora' && e.serve === true; })());
    provar('…e uma cobrança emitida ANTES do vencimento, sem valor, NÃO serve',
      (() => { const e = estado({ texto: URL_DO_BANCO, valorBaseCentavos: 6990, venceu: true,
        devidoCentavos: 7270, salvoEm: '2026-10-25T12:00:00Z', vencimento: '2026-11-01' });
        return e.estado === 'sem-valor' && e.serve === false; })());
    provar('…e o valor que PROVA a falta da mora vence a data (colou a antiga depois do vencimento)',
      (() => { const e = estado({ texto: pixComValor(69.9), valorBaseCentavos: 6990, venceu: true,
        devidoCentavos: 7270, salvoEm: EMITIDA_NO_ATRASO, vencimento: '2026-11-01' });
        return e.estado === 'sem-mora' && e.serve === false; })());
    provar('a cobrança que fica aquém do devido diz quanto falta',
      (() => { const e = estado({ texto: pixComValor(72), valorBaseCentavos: 6990, venceu: true, devidoCentavos: 7270 });
        return e.serve === true && e.faltaCentavos === 70; })());

    /* C. AS TRÊS PÁGINAS USAM A MESMA REGRA. */
    const s = situacaoComMesAberto();
    const pago = Object.assign({}, s, { meses: s.meses.map((m) => Object.assign({}, m, {
      status: 'pago', venceu: false, valorPagoCentavos: m.valorCentavos, emTexto: '20/11/2026 às 10:00',
    })) });
    const mesAMesPago = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: pago, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } },
    });
    provar('no mês a mês, o mês PAGO não tem «Pagar no banco»', !/Pagar no banco/.test(mesAMesPago));
    provar('…nem «Copiar» — a cobrança fica em leitura', !/data-copiar=/.test(mesAMesPago));
    provar('…e o documento continua à vista, como registo', /mes-pix-2026-11/.test(mesAMesPago));
    provar('…e o selo diz «pago»', /selo ok[^>]*>pago/.test(mesAMesPago));

    /* A COBRANÇA ANTIGA COM VALOR LEGÍVEL — o caso que se pode PROVAR que falta a mora. É este o
     * que tem de dizer o valor a gerar; o sem valor legível diz a mesma coisa por outra frase (ver
     * o estado `sem-valor`). */
    const atrasadoSemMora = bastidores.paginaFinanceiro('breu', {}, {}, {
      situacao: s, cadastro: { escolaNome: 'Breu' }, pix: { chave: '0215' },
      cobrancas: { [MES]: { texto: pixComValor(139.9), em: '2026-10-25T12:00:00Z' } },
    });
    provar('no mês a mês, o ATRASADO com a cobrança antiga não tem «Copiar»',
      !/data-copiar=/.test(atrasadoSemMora));
    provar('…e diz o valor que a cobrança nova tem de pedir',
      /uma nova com a multa e os juros/i.test(atrasadoSemMora),
      (atrasadoSemMora.match(/Mês vencido[^<]*/) || [])[0]);

    /* A CAIXA «PAGAR» DA ESCOLA — o caminho mais fácil para pagar o valor menor. */
    const caixaDaEscola = (livro, texto, em, venceu) => {
      const situacao = situacaoComMesAberto();
      const situacaoAtrasada = Object.assign({}, situacao, {
        meses: situacao.meses.map((m) => Object.assign({}, m, { venceu: Boolean(venceu) })),
      });
      return bastidores.paginaProducao('breu', { professor: 'demi-plie', ciclo: '01', query: '' },
        [{ nome: 'Demi' }], [], 'Demi Plié', 'demi-plie', [], [], [], [], [], [],
        { professores: new Set(), turmas: new Set(), termos: new Set(), planos: 0 },
        { modo: 'clara', paleta: 'bordo' }, '', [], new Set(),
        { cadastro: { escolaNome: 'Breu' }, situacao: situacaoAtrasada, pix: { chave: '0215' },
          cobrancas: { [MES]: { texto, em } } },
        [], null, [], undefined, null);
    };
    const antiga = caixaDaEscola([], PAYLOAD, '2026-10-25T12:00:00Z', true);
    provar('a caixa «Pagar» da escola NÃO oferece a cobrança antiga de um mês atrasado',
      !/escola-cobranca-1/.test(antiga));
    provar('…e continua a dar a chave Pix, que é o que sobra para pagar', /escola-pix-chave/.test(antiga));
    const nova = caixaDaEscola([], PAYLOAD, EMITIDA_NO_ATRASO, true);
    provar('…e oferece a cobrança emitida já com a mora', /escola-cobranca-1/.test(nova));

    /* D. O FINANCEIRO — o mês pago em leitura, e o valor conferido onde ela cola. */
    const financeiroPago = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [],
      extrato: [Object.assign({}, pago, { escola: 'breu', nome: 'Breu', frase: 'x',
        cobrancas: { [MES]: { texto: PAYLOAD, em: EMITIDA_NO_ATRASO } } })],
      catalogo: comercial.catalogoDaPagina(),
    });
    provar('no financeiro, o mês pago não tem botão «Gravar» da cobrança',
      !/data-cobranca-gravar="breu"/.test(financeiroPago));
    provar('…nem «Copiar»', !/data-copiar=/.test(financeiroPago));
    provar('…e o campo está em leitura, com o documento à vista',
      /id="cob-breu-2026-11"[^>]*readonly/.test(financeiroPago));
    provar('…e diz que é registo', /Mês pago — a cobrança fica como registo/.test(financeiroPago));

    const financeiroAtrasado = painel.paginaFinanceira({
      pix: {}, descontos: [], escolas: [],
      extrato: [Object.assign({}, s, { escola: 'breu', nome: 'Breu', frase: 'x',
        cobrancas: { [MES]: { texto: pixComValor(69.9), em: '2026-11-02T12:00:00Z' } } })],
      catalogo: comercial.catalogoDaPagina(),
    });
    provar('no financeiro, o mês atrasado diz o que o código pede e o que é devido',
      /O código colado pede R\$ 69,90; o devido hoje é R\$/.test(financeiroAtrasado),
      (financeiroAtrasado.match(/O código colado[^<]*/) || [])[0]);
  }

  console.log('\n' + (falhas === 0
    ? 'TUDO CERTO — ' + provas + ' asserções: ela cola o Pix do banco na coluna do mês, a cobrança '
      + 'reaparece por baixo da chave no «Pagar» da escola e na coluna do mês a mês, com as quebras '
      + 'de linha intactas — e um mês sem cobrança continua a ter o caminho para a chave. O LINK do '
      + 'banco é reconhecido e mostrado onde a escola paga, e um Pix copia-e-cola não vira botão.'
    : 'FALHARAM ' + falhas + ' de ' + provas + ' asserções.'));
  process.exit(falhas === 0 ? 0 : 1);
})();
