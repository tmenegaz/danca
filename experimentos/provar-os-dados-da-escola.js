#!/usr/bin/env node
'use strict';

/**
 * provar-os-dados-da-escola.js — a identidade fiscal sobrevive ao expurgo, e a escola nova com o
 * mesmo nome é a MESMA escola (23/11/2026).
 *
 * O QUE ELA PEDIU, em duas metades que se cruzam:
 *
 *   «eu preciso de uma lista dos nomes da escola, do professor da escola, uma tabela que mostra o
 *   nome da escola, o professor da escola, o telefone da escola, enfim, os dados que a gente tem da
 *   escola. E ali eu consigo então entrar em contato com a escola, saber qual é o CNPJ dela e me
 *   mexer atrás dela.»
 *
 *   «eu vou criar a escola chamada Breu e eu espero poder usar o formulário que a gente já tem […]
 *   e vai ser uma escola Breu nova. […] antes de eu criar, você precisa verificar.»
 *
 * O DEFEITO QUE A PRIMEIRA METADE EXPÔS, e é o mesmo do livro das mensalidades. O expurgo limpa o
 * KV de dois prefixos — `<slug>/` e `bastidores/<slug>/` —, e o CADASTRO da escola está no segundo:
 * **expurgar apagava o CNPJ, o e-mail e o telefone**, exactamente os dados que se precisam para
 * cobrar quem deve. Ela descobriu-o pelo lado pior: quis o CNPJ da `breu` que acabara de expurgar, e
 * ele já não existia em sítio nenhum — nem no KV, nem no repositório, nem no histórico do Git (o
 * cadastro nunca esteve lá).
 *
 * A CORRECÇÃO: o expurgo guarda a identidade fiscal numa chave FORA dos dois prefixos
 * (`cadastros/<slug>`), antes de limpar o resto. Guarda o registo fiscal e de contacto — nome,
 * CNPJ, e-mail e telefone da escola e do professor. Não guarda o que SERVE a escola (alunas,
 * documentos, endereço, Worker): isso é o expurgo, e continua a ser irreversível.
 *
 * O QUE SE MEDE:
 *
 *   A. A CHAVE SOBREVIVE — `cadastros/<slug>` não é alcançada por `prefixosDaEscola`, e o registo
 *      é escrito com o CNPJ e os contactos que existiam. Sem KV, ou com o KV a falhar, a resposta é
 *      `ok:false` e não um silêncio que parece sucesso.
 *   B. ELA ACRESCENTA — um segundo expurgo da mesma escola deixa dois elos, e o primeiro fica
 *      intacto: o cadastro de ontem é o que se procura quando a dívida é de ontem.
 *   C. A LISTA — o cadastro VIVO manda; o guardado no expurgo responde quando já não há vivo; sem
 *      nenhum dos dois a célula é `null` e a página escreve um traço. Nunca se deduz um CNPJ.
 *   D. A PÁGINA — as quatro abas com «Os dados da escola» no fim, o CNPJ à vista, o `mailto:` e o
 *      `wa.me` (as duas formas da página dos Contactos), o selo «sem cadastro» e o aviso que diz
 *      porquê.
 *   E. A CRIAÇÃO — a resposta à pergunta dela, medida: o `Breu` novo é o MESMO slug (mesma pasta,
 *      mesmo prefixo de KV, mesmo endereço, o mesmo elo), e o fixture de teste vem do NOME e não do
 *      CNPJ, portanto um «Breu Dois» também carrega os valores de teste.
 *
 * CONTROLE NEGATIVO: `--contra=<sha>` carrega o `motor/` daquele commit. Lá `guardarCadastroDoExpurgo`
 * não existe, a aba não existe, e o cadastro da escola morre com o expurgo.
 *
 *   node experimentos/provar-os-dados-da-escola.js
 *   node experimentos/provar-os-dados-da-escola.js --contra=f0186400
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..');
const CONTRA = (process.argv.find((x) => x.indexOf('--contra=') === 0) || '').split('=')[1] || '';
let RAIZ_DO_MOTOR = RAIZ;
let TEMPORARIO = null;
if (CONTRA) {
  TEMPORARIO = fs.mkdtempSync(path.join(os.tmpdir(), 'dados-'));
  execSync('git archive ' + CONTRA + ' motor modelo biblioteca tools porta teste | tar -x -C ' + TEMPORARIO,
    { cwd: RAIZ, stdio: 'pipe' });
  RAIZ_DO_MOTOR = TEMPORARIO;
}
const raiz = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/raiz.js'));
const painel = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/painel-html.js'));
const expurgar = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/expurgar-escola.js'));
const fixtures = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/teste-fixtures.js'));

let total = 0;
let falhas = 0;
function provar(rotulo, condicao, detalhe) {
  total += 1;
  if (condicao) { console.log('  ok    ' + rotulo); return; }
  falhas += 1;
  console.log('  FALHA ' + rotulo
    + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe).slice(0, 330)));
}

/** O KV de bolso. `quebrar` faz o `put` explodir, para o caso do KV que não deixa gravar. */
function kvDeBolso(inicial, quebrar) {
  const dados = new Map(Object.entries(inicial || {}));
  return {
    dados,
    async get(c) { return dados.has(c) ? dados.get(c) : null; },
    async put(c, v) {
      if (quebrar) throw new Error('cota do KV');
      dados.set(c, String(v));
    },
    async delete(c) { dados.delete(c); },
    async list({ prefix = '' } = {}) {
      return { keys: [...dados.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
    },
  };
}

const CADASTRO = {
  escolaNome: 'Escola Breu', cnpj: '12.345.678/0001-90',
  email: 'direcao@breu.exemplo', telefone: '54 3333-4444',
  origem: 'publico', criadoEm: '2026-11-17T00:41:45.598Z', atualizadoEm: '2026-11-17T00:41:45.598Z',
};
const CONTATO = {
  nomeCompleto: 'Demi Plié', cpf: '22694953069',
  email: 'professora@breu.exemplo', telefone: '54 99175-2662',
  criadoEm: '2026-11-17T00:41:45.598Z', atualizadoEm: '2026-11-17T00:41:45.598Z',
};
const ELO = {
  escola: 'breu', ciclo: '01', shard: 'lastro-teste',
  professor: { slug: 'demi-plie', nome: 'Demi Plié' },
  professores: [{ slug: 'demi-plie', nome: 'Demi Plié' }],
  expurgo: [], recriacao: [],
};

(async () => {
  console.log('A. A CHAVE QUE SOBREVIVE À LIMPEZA');
  const prefixos = expurgar.prefixosDaEscola('breu');
  /* A CHAVE É LIDA COM CUIDADO NO CONTROLE: no código de antes ela não existe, e o controle tem de
   * medir isso como FALHA e não morrer numa excepção. */
  const chave = typeof raiz.chaveDoCadastroHistorico === 'function'
    ? raiz.chaveDoCadastroHistorico('breu') : null;
  provar('A0. a chave do cadastro histórico existe e é função', typeof raiz.chaveDoCadastroHistorico === 'function');
  provar('A0. …e é `cadastros/breu`', chave === 'cadastros/breu', chave);
  /* A ASSERÇÃO QUE É A RAZÃO DE A CHAVE FUNCIONAR: o expurgo apaga por prefixo, e esta chave não
   * está debaixo de nenhum dos dois. */
  provar('A1. `cadastros/breu` NÃO é alcançada pelo prefixo da escola',
    Boolean(chave) && prefixos.every((p) => chave.indexOf(p) !== 0), prefixos);
  provar('A1. …e os prefixos são os dois que o expurgo limpa',
    JSON.stringify(prefixos) === JSON.stringify(['breu/', 'bastidores/breu/']), prefixos);

  if (typeof raiz.guardarCadastroDoExpurgo === 'function') {
    // A2. O registo, escrito com o que existia.
    {
      const kv = kvDeBolso({
        'bastidores/breu/cadastro': JSON.stringify(CADASTRO),
        'professores/demi-plie/contato': JSON.stringify(CONTATO),
      });
      const r = await raiz.guardarCadastroDoExpurgo({
        env: { PADD_KV: kv }, slug: 'breu', elo: ELO, motivo: 'expurgada pela página',
        quando: '2026-11-23T01:00:53.940Z',
      });
      const guardado = JSON.parse(kv.dados.get('cadastros/breu') || '{}');
      const elo0 = (guardado.expurgos || [])[0] || {};
      provar('A2. o expurgo guarda a identidade fiscal antes de apagar o cadastro',
        r.ok === true && r.cnpj === true, r);
      provar('A2. …com o CNPJ, o e-mail e o telefone da ESCOLA',
        elo0.cnpj === CADASTRO.cnpj && elo0.email === CADASTRO.email && elo0.telefone === CADASTRO.telefone,
        elo0);
      provar('A2. …e com o nome, o CPF, o e-mail e o telefone do PROFESSOR',
        elo0.professor && elo0.professor.cpf === CONTATO.cpf
        && elo0.professor.email === CONTATO.email && elo0.professor.telefone === CONTATO.telefone,
        elo0.professor);
      provar('A2. …e o motivo e o instante do expurgo, para se saber de quando é o registo',
        elo0.motivo === 'expurgada pela página' && elo0.em === '2026-11-23T01:00:53.940Z', elo0);
      provar('A2. …e NÃO guarda o que serve a escola (não há alunas nem documentos aqui)',
        !('alunas' in elo0) && !('documentos' in elo0) && !('turmas' in elo0), Object.keys(elo0));
    }
    // A3. O KV que não deixa gravar: `ok:false`, e não uma excepção que mata o expurgo.
    {
      const kv = kvDeBolso({}, true);
      let explodiu = false;
      const r = await raiz.guardarCadastroDoExpurgo({ env: { PADD_KV: kv }, slug: 'breu', elo: ELO })
        .catch(() => { explodiu = true; return null; });
      provar('A3. o KV que falha devolve ok:false e não derruba o expurgo',
        !explodiu && r && r.ok === false && Boolean(r.erro), r);
      const semKv = await raiz.guardarCadastroDoExpurgo({ env: {}, slug: 'breu', elo: ELO });
      provar('A3. sem KV a resposta diz que não guardou', semKv.ok === false && Boolean(semKv.erro), semKv);
    }
    // A4. Sem cadastro nem contacto na escola: guarda o que sabe, com os campos a `null`.
    {
      const kv = kvDeBolso({});
      const r = await raiz.guardarCadastroDoExpurgo({
        env: { PADD_KV: kv }, slug: 'duo', elo: { ...ELO, escola: 'duo' },
      });
      const elo0 = JSON.parse(kv.dados.get('cadastros/duo')).expurgos[0];
      provar('A4. uma escola sem cadastro guarda um elo com o CNPJ a `null` — nunca inventado',
        r.ok === true && r.cnpj === false && elo0.cnpj === null, elo0);
      provar('A4. …e o nome do professor vem do elo, que é quem sabe quem deu aula',
        elo0.professor && elo0.professor.nome === 'Demi Plié', elo0.professor);
    }
  }

  console.log('');
  console.log('B. O REGISTO ACRESCENTA — um segundo expurgo não apaga o primeiro');
  if (typeof raiz.guardarCadastroDoExpurgo === 'function') {
    const kv = kvDeBolso({
      'bastidores/breu/cadastro': JSON.stringify(CADASTRO),
      'professores/demi-plie/contato': JSON.stringify(CONTATO),
    });
    await raiz.guardarCadastroDoExpurgo({ env: { PADD_KV: kv }, slug: 'breu', elo: ELO,
      motivo: 'primeiro', quando: '2026-11-23T01:00:53.940Z' });
    /* A escola volta, com outro CNPJ, e é expurgada outra vez. */
    const outro = { ...CADASTRO, cnpj: '98.765.432/0001-10', email: 'novo@breu.exemplo' };
    kv.dados.set('bastidores/breu/cadastro', JSON.stringify(outro));
    await raiz.guardarCadastroDoExpurgo({ env: { PADD_KV: kv }, slug: 'breu', elo: ELO,
      motivo: 'segundo', quando: '2026-12-01T10:00:00.000Z' });
    const registo = JSON.parse(kv.dados.get('cadastros/breu'));
    provar('B1. dois expurgos → dois elos, o mais antigo primeiro',
      registo.expurgos.length === 2 && registo.expurgos[0].em < registo.expurgos[1].em,
      registo.expurgos.map((e) => e.em));
    provar('B1. …e o CNPJ de cada elo é o da encarnação daquele momento',
      registo.expurgos[0].cnpj === CADASTRO.cnpj && registo.expurgos[1].cnpj === outro.cnpj,
      registo.expurgos.map((e) => e.cnpj));
    const lido = await raiz.lerCadastroHistorico({ PADD_KV: kv }, 'breu');
    provar('B2. o leitor devolve o ÚLTIMO — é o cadastro da encarnação que saiu agora',
      lido && lido.cnpj === outro.cnpj, lido);
    const nenhum = await raiz.lerCadastroHistorico({ PADD_KV: kv }, 'nunca-existiu');
    provar('B2. uma escola sem registo devolve `null` — e não um esboço', nenhum === null, nenhum);
    const quebrado = kvDeBolso({ 'cadastros/breu': 'não é json' });
    provar('B2. um registo ilegível devolve `null` em vez de lançar',
      (await raiz.lerCadastroHistorico({ PADD_KV: quebrado }, 'breu')) === null);
  }

  console.log('');
  console.log('C. A LISTA — de onde vem o que está escrito');
  const dados = raiz.dadosDasEscolas;
  provar('C0. `dadosDasEscolas` existe', typeof dados === 'function');
  if (typeof dados === 'function') {
    const kv = kvDeBolso({
      'bastidores/calango/cadastro': JSON.stringify({ escolaNome: 'Escola Calango', cnpj: '11.111.111/0001-11', email: 'c@x.exemplo', telefone: '54 1111-2222' }),
      'professores/demi-plie/contato': JSON.stringify(CONTATO),
      'cadastros/breu': JSON.stringify({ escola: 'breu', expurgos: [{
        em: '2026-11-23T01:00:53.940Z', motivo: 'expurgada pela página',
        escolaNome: 'Escola Breu', cnpj: '12.345.678/0001-90', email: 'direcao@breu.exemplo',
        telefone: '54 3333-4444',
        professor: { slug: 'demi-plie', nome: 'Demi Plié', cpf: CONTATO.cpf, email: CONTATO.email, telefone: CONTATO.telefone },
      }] }),
    });
    const lista = await dados({
      env: { PADD_KV: kv },
      escolas: [
        { slug: 'calango', nome: 'Calango', professor: 'demi-plie', expurgada: false, criada_em: '2026-11-20T00:00:00.000Z' },
        { slug: 'breu', nome: 'Breu', professor: 'demi-plie', expurgada: true, expurgada_em: '2026-11-23T01:00:53.940Z' },
        { slug: 'duo', nome: 'Duo', professor: 'fernando-franciose', expurgada: true, expurgada_em: '2026-11-16T13:56:53.000Z' },
      ],
    });
    const viva = lista.find((e) => e.escola === 'calango');
    const apagada = lista.find((e) => e.escola === 'breu');
    const semNada = lista.find((e) => e.escola === 'duo');
    provar('C1. a viva traz o cadastro DELA', viva && viva.cnpj === '11.111.111/0001-11'
      && viva.email === 'c@x.exemplo' && viva.fonte === 'vivo', viva);
    provar('C2. a expurgada traz o CNPJ guardado no expurgo — o caso inteiro desta prova',
      apagada && apagada.cnpj === '12.345.678/0001-90' && apagada.fonte === 'expurgo', apagada);
    provar('C2. …e a marca e a data do expurgo, para se saber que ela já não existe',
      apagada && apagada.expurgada === true && apagada.expurgadaEm === '2026-11-23T01:00:53.940Z',
      apagada && [apagada.expurgada, apagada.expurgadaEm]);
    provar('C3. a expurgada sem registo nenhum traz `null` — nunca um CNPJ deduzido',
      semNada && semNada.cnpj === null && semNada.email === null && semNada.fonte === 'nenhum', semNada);
    provar('C4. o contacto do professor vem da chave da PESSOA, que o expurgo não apaga',
      apagada && apagada.professorNome === 'Demi Plié' && apagada.professorCpf === CONTATO.cpf,
      apagada && [apagada.professorNome, apagada.professorCpf]);

    /* O CADASTRO VIVO MANDA SOBRE O HISTÓRICO: uma escola RECRIADA tem os dois, e o que vale é o
     * de agora — o histórico é o que se lê quando já não há vivo. */
    const kv2 = kvDeBolso({
      'bastidores/breu/cadastro': JSON.stringify({ escolaNome: 'Breu Nova', cnpj: '22.222.222/0001-22' }),
      'cadastros/breu': JSON.stringify({ escola: 'breu', expurgos: [{ cnpj: '12.345.678/0001-90', em: '2026-11-23T01:00:53.940Z' }] }),
    });
    const recriada = (await dados({ env: { PADD_KV: kv2 }, escolas: [{ slug: 'breu', nome: 'Breu', expurgada: false }] }))[0];
    provar('C5. a escola RECRIADA mostra o cadastro de agora, e não o do expurgo',
      recriada.cnpj === '22.222.222/0001-22' && recriada.fonte === 'vivo', recriada);
  }

  console.log('');
  console.log('D. A PÁGINA — a aba, o CNPJ e as duas formas de falar');
  const fichas = [
    { escola: 'breu', nome: 'Escola Breu', professor: 'demi-plie', professorNome: 'Demi Plié',
      professorCpf: CONTATO.cpf, cnpj: '12.345.678/0001-90', email: 'direcao@breu.exemplo',
      telefone: '54 3333-4444', professorEmail: CONTATO.email, professorTelefone: CONTATO.telefone,
      expurgada: true, expurgadaEm: '2026-11-23T01:00:53.940Z', fonte: 'expurgo' },
    { escola: 'duo', nome: 'Duo', professor: 'fernando-franciose', professorNome: null,
      professorCpf: null, cnpj: null, email: null, telefone: null, professorEmail: null,
      professorTelefone: null, expurgada: true, expurgadaEm: '2026-11-16T13:56:53.000Z', fonte: 'nenhum' },
  ];
  const html = painel.paginaFinanceira({
    pix: { chave: 'x' }, descontos: [], escolas: [], extrato: [], dados: fichas, catalogo: null,
  });
  provar('D1. a aba «Os dados da escola» existe', /data-aba="dados"/.test(html), null);
  provar('D1. …e é a ÚLTIMA — o trabalho do dia não muda de lugar',
    /data-aba="dados"[^]*?<\/nav>/.test(html)
    && html.indexOf('data-aba="dados"') > html.indexOf('data-aba="descontos"'), null);
  provar('D1. …com o seu painel', /id="fi-painel-dados"/.test(html), null);
  const bloco = (() => {
    const i = html.indexOf('id="fi-painel-dados"');
    if (i === -1) return '';
    const j = html.indexOf('</div></section>', i);
    return j === -1 ? html.slice(i) : html.slice(i, j);
  })();
  provar('D2. o CNPJ da escola está à vista', /12\.345\.678\/0001-90/.test(html), null);
  provar('D2. …e o telefone e o e-mail são clicáveis, como na página dos Contactos',
    /mailto:direcao@breu\.exemplo/.test(html) && /wa\.me\/555433334444/.test(html), null);
  provar('D2. …e o contacto do professor também', /mailto:professora@breu\.exemplo/.test(html), null);
  provar('D3. a escola sem registo leva o selo «sem cadastro»', /sem cadastro/.test(bloco), null);
  provar('D3. …e o aviso diz que os expurgos anteriores a 23/11 perderam os dados, e porquê',
    /expurgos anteriores a 23\/11\/2026/.test(bloco), null);
  provar('D4. a tabela é paginada pela peça da casa', /data-paginar/.test(html), null);
  const vazia = painel.paginaFinanceira({ pix: { chave: 'x' }, descontos: [], escolas: [], extrato: [], dados: [], catalogo: null });
  provar('D5. sem escola nenhuma, a aba diz «nenhuma» em vez de uma tabela de zero linhas',
    /Nenhuma escola cadastrada/.test(vazia), null);

  console.log('');
  console.log('E. A CRIAÇÃO — a pergunta dela, medida');
  /* A RESPOSTA, e ela tem duas metades que não se confundem: o CNPJ é o registo COMERCIAL (um CNPJ
   * é uma escola), e o SLUG é a identidade da máquina (a pasta, o prefixo do KV, o endereço). */
  const provisionar = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/provisionar-escola.js'));
  provar('E1. «Breu» produz o slug `breu` — a MESMA identidade da que foi expurgada',
    provisionar.slugificar('Breu') === 'breu', provisionar.slugificar('Breu'));
  provar('E1. …e «Breu Dois» produz `breu-dois`, uma escola nova',
    provisionar.slugificar('Breu Dois') === 'breu-dois', provisionar.slugificar('Breu Dois'));
  /* O FIXTURE É DO NOME, e não do CNPJ: é isto que ela quer, e é o que a faz poder testar. */
  provar('E2. o fixture de teste vem da PALAVRA no nome — «Breu» carrega o teste 3',
    fixtures.numeroDoTeste('breu') === 3, fixtures.numeroDoTeste('breu'));
  provar('E2. …e «Breu Dois» também, porque a palavra está lá',
    fixtures.numeroDoTeste('breu-dois') === 3, fixtures.numeroDoTeste('breu-dois'));
  provar('E2. …e uma escola sem as três palavras não carrega nenhum (a `duo` é a prova)',
    fixtures.numeroDoTeste('duo') === 0, fixtures.numeroDoTeste('duo'));
  /* A UNICIDADE É DO NÚMERO: um CNPJ novo não colide; o mesmo CNPJ colide. */
  {
    const kv = kvDeBolso({ 'bastidores/calango/cadastro': JSON.stringify({ cnpj: '11.111.111/0001-11' }) });
    const unicidade = require(path.join(RAIZ_DO_MOTOR, 'motor/servidor/unicidade.js'));
    provar('E3. um CNPJ NOVO não é de ninguém — a escola nova nasce',
      (await unicidade.cnpjJaUsado({ PADD_KV: kv }, '33.333.333/0001-33')) === null);
    provar('E3. …e o CNPJ que já é de uma escola devolve o slug dela',
      (await unicidade.cnpjJaUsado({ PADD_KV: kv }, '11111111000111')) === 'calango');
  }

  if (TEMPORARIO) fs.rmSync(TEMPORARIO, { recursive: true, force: true });
  console.log('');
  if (CONTRA) {
    console.log((falhas ? 'CONTROLE CONFORME — ' : 'CONTROLE SUSPEITO — ') + falhas + ' de ' + total
      + ' asserções falham com o `motor/` de ' + CONTRA + '.');
    process.exit(falhas ? 0 : 1);
  }
  if (falhas) { console.log('FALHARAM ' + falhas + ' de ' + total + ' asserções.'); process.exit(1); }
  console.log('TUDO CERTO — ' + total + ' asserções: a identidade fiscal da escola é guardada FORA dos '
    + 'prefixos do expurgo e sobrevive à limpeza, o registo acrescenta em vez de editar, a lista mostra '
    + 'o CNPJ da expurgada sem nunca o deduzir, a aba nova diz de onde vem cada dado — e está medido '
    + 'que o fixture de teste vem do NOME e que «Breu» é o mesmo slug de antes.');
})();
