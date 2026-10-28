'use strict';

/*
 * provar-verbete.js — o CRUD do verbete na Produção, e o que ele se recusa a fazer.
 *
 * O DEFEITO QUE ELE COMBATE é o silêncio: um CRUD que gravasse o alfabeto no KV do Cloudflare
 * daria uma tela que mostra o verbete novo e um documento que continua a sair com o velho — o
 * gerador lê o alfabeto do DISCO, e a geração corre no Actions. Nada falharia. Por isso a prova
 * mede a ESCRITA NO REPOSITÓRIO, e não o aspecto da tela.
 *
 * O QUE ESTA PROVA FIXA:
 *   A. A VALIDAÇÃO é a do servidor, e é a mesma régua do motor — um verbete que a geração
 *      recusaria não entra pelo CRUD.
 *   B. A ESCRITA vai para o repositório, com o `sha` do arquivo que existe (sem ele o PUT é uma
 *      criação e o GitHub recusa por cima de um arquivo que já lá está).
 *   C. A PROVENIÊNCIA: não há DELETE. Descontinua-se, e o passado fica.
 *   D. A VERSÃO sobe a cada gravação — é ela que o selo da âncora regista no `.fipp`.
 *
 *   node experimentos/provar-verbete.js
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const verbete = require(path.join(RAIZ, 'motor', 'servidor', 'verbete.js'));

let falhas = 0;
function checar(descricao, condicao, detalhe) {
  if (condicao) { console.log('  ✓ ' + descricao); return; }
  falhas += 1;
  console.log('  ✗ ' + descricao + (detalhe === undefined ? '' : '  → ' + JSON.stringify(detalhe)));
}

const ALFABETO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', 'notacao.json'), 'utf8'));
const VOCABULARIO = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', 'vocabulario.json'), 'utf8'));

function verbeteBom(extra) {
  return Object.assign({
    cobre: 4,
    posicao: { membro: 'pes', termo: 'premiere-position' },
    direcoes: ['devant'],
    celulas: {
      devant: [
        { contagem: '1–2', bloco: '[Pé: 1ª → +]', descricao: 'extensão à frente a partir da 1ª posição' },
        { contagem: '3–4', bloco: '[Pé: + ● 1ª]', descricao: 'retorno à 1ª posição' },
      ],
    },
  }, extra || {});
}

// ------------------------------------------------------------------ A. a validação
function aValidacao() {
  console.log('\nA. A VALIDAÇÃO — a mesma régua do motor, aplicada antes de gravar');

  const bom = verbete.validarVerbete(verbeteBom(), ALFABETO, VOCABULARIO);
  checar('um verbete bem formado é aceito', bom.ok, bom.erros);

  const cobreErrado = verbete.validarVerbete(verbeteBom({ cobre: 6 }), ALFABETO, VOCABULARIO);
  checar('e um `cobre` que não soma é recusado', !cobreErrado.ok && /somam/.test(cobreErrado.erros.join(' ')),
    cobreErrado.erros);

  const semCelula = verbeteBom({ direcoes: ['devant', 'derriere'] });
  const r1 = verbete.validarVerbete(semCelula, ALFABETO, VOCABULARIO);
  checar('uma direção declarada sem célula é recusada', !r1.ok && /derriere/.test(r1.erros.join(' ')), r1.erros);

  const orfa = verbeteBom();
  orfa.celulas.derriere = [{ contagem: '1–2', bloco: '[Pé: 1ª → ×]', descricao: 'x' }];
  const r2 = verbete.validarVerbete(orfa, ALFABETO, VOCABULARIO);
  checar('e uma célula fora das direções declaradas também', !r2.ok, r2.erros);

  const sinal = verbeteBom();
  sinal.celulas.devant[0].bloco = '[Pé: 1ª → §]';
  const r3 = verbete.validarVerbete(sinal, ALFABETO, VOCABULARIO);
  checar('um sinal que o alfabeto não declara é recusado', !r3.ok && /§/.test(r3.erros.join(' ')), r3.erros);

  const semDescricao = verbeteBom();
  semDescricao.celulas.devant[1].descricao = '   ';
  const r4 = verbete.validarVerbete(semDescricao, ALFABETO, VOCABULARIO);
  checar('uma célula sem descrição é recusada — é ela que a prosa mostra',
    !r4.ok && /descri/i.test(r4.erros.join(' ')), r4.erros);

  const posicaoFantasma = verbeteBom({ posicao: { membro: 'pes', termo: 'nao-existe' } });
  const r5 = verbete.validarVerbete(posicaoFantasma, ALFABETO, VOCABULARIO);
  checar('uma posição fora do vocabulário é recusada', !r5.ok && /vocabulário/.test(r5.erros.join(' ')), r5.erros);

  const membroErrado = verbeteBom({ posicao: { membro: 'bracos', termo: 'premiere-position' } });
  const r6 = verbete.validarVerbete(membroErrado, ALFABETO, VOCABULARIO);
  checar('e uma posição de pés declarada como de braços também', !r6.ok, r6.erros);

  const direcaoFantasma = verbeteBom({ direcoes: ['sur-la-tete'] });
  const r7 = verbete.validarVerbete(direcaoFantasma, ALFABETO, VOCABULARIO);
  checar('uma direção fora da gramática é recusada', !r7.ok && /gramática/.test(r7.erros.join(' ')), r7.erros);
}

// ----------------------------------------------------- B/C/D. a escrita no repositório
/** Um GitHub de mentira: guarda o arquivo, honra o `sha` e recusa por cima do que existe. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial));
  const pedidos = [];
  const f = async (url, opcoes) => {
    const caminho = url.split('/contents/')[1];
    pedidos.push({ metodo: (opcoes && opcoes.method) || 'GET', caminho });
    if ((opcoes && opcoes.method) === 'PUT') {
      const corpo = JSON.parse(opcoes.body);
      const atual = arquivos.get(caminho);
      // O GitHub recusa um PUT sobre um arquivo existente quando o `sha` não vem.
      if (atual && !corpo.sha) {
        return new Response(JSON.stringify({ message: 'sha missing' }), { status: 409 });
      }
      if (atual && corpo.sha && corpo.sha !== atual.sha) {
        return new Response(JSON.stringify({ message: 'sha mismatch' }), { status: 409 });
      }
      const texto = Buffer.from(corpo.content, 'base64').toString('utf8');
      const novo = { sha: 'sha-' + (arquivos.size + 1), conteudo: texto, mensagem: corpo.message };
      arquivos.set(caminho, novo);
      return new Response(JSON.stringify({ commit: { sha: 'commit-' + arquivos.size } }), { status: 200 });
    }
    const atual = arquivos.get(caminho);
    if (!atual) return new Response('{}', { status: 404 });
    return new Response(JSON.stringify({
      sha: atual.sha,
      content: Buffer.from(atual.conteudo, 'utf8').toString('base64'),
    }), { status: 200 });
  };
  return { f, arquivos, pedidos };
}

async function aEscrita() {
  console.log('\nB. A ESCRITA — no repositório, com o `sha` do arquivo que existe');

  const CAlfabeto = verbete.caminhoDoAlfabeto('bale-classico');
  const CVocabulario = verbete.caminhoDoVocabulario('bale-classico');
  const repo = githubFalso({
    [CAlfabeto]: { sha: 'sha-inicial', conteudo: JSON.stringify(ALFABETO, null, 2) + '\n' },
    [CVocabulario]: { sha: 'sha-voc', conteudo: JSON.stringify(VOCABULARIO, null, 2) + '\n' },
  });

  const base = {
    f: repo.f, token: 'token-de-prova', dono: 'dono', repo: 'repo', ref: 'main',
    modalidade: 'bale-classico',
  };

  const criado = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteBom(), acao: 'criar',
  }));
  checar('um verbete novo é criado', criado.ok, criado);
  checar('e a versão do alfabeto sobe', criado.versao === Number(ALFABETO.versao) + 1, criado.versao);
  checar('a gravação vai para o caminho do alfabeto da modalidade',
    repo.arquivos.has(CAlfabeto) && repo.pedidos.some((p) => p.metodo === 'PUT' && p.caminho === CAlfabeto));

  const gravado = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo);
  checar('o verbete está lá, na forma nova',
    Boolean(gravado.verbetes['Battement fondu'] && gravado.verbetes['Battement fondu']['8|4/4'].celulas));
  checar('e o commit leva mensagem do projeto', /^feat\(notacao\): declarar/.test(
    String(repo.arquivos.get(CAlfabeto).mensagem || '').split('\n')[0]), repo.arquivos.get(CAlfabeto).mensagem);

  const deNovo = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '4|4/4', verbete: verbeteBom(), acao: 'criar',
  }));
  checar('criar o que já existe é recusado com 409', !deNovo.ok && deNovo.status === 409, deNovo);

  const editar = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteBom({ cobre: 4 }), acao: 'atualizar',
  }));
  checar('e editar o que existe é aceito', editar.ok, editar);

  const semToken = await verbete.gravarVerbete(Object.assign({}, base, {
    token: '', nome: 'X', musica: '4|4/4', verbete: verbeteBom(), acao: 'criar',
  }));
  checar('sem token do repositório não se grava nada', !semToken.ok && semToken.status === 401, semToken);

  console.log('\nC. A PROVENIÊNCIA — não há DELETE; há descontinuação');

  const descontinuado = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', acao: 'descontinuar',
  }));
  checar('descontinuar é aceito', descontinuado.ok, descontinuado);
  const depois = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo);
  checar('e o verbete FICA, marcado — não desaparece',
    Boolean(depois.verbetes['Battement fondu'] && depois.verbetes['Battement fondu']['8|4/4'].descontinuado));
  checar('a mensagem diz o que aconteceu', /^chore\(notacao\): descontinuar/.test(
    String(repo.arquivos.get(CAlfabeto).mensagem || '').split('\n')[0]), repo.arquivos.get(CAlfabeto).mensagem);

  const retomado = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', acao: 'retomar',
  }));
  checar('e retomar desfaz a marca', retomado.ok
    && !JSON.parse(repo.arquivos.get(CAlfabeto).conteudo).verbetes['Battement fondu']['8|4/4'].descontinuado);

  const lista = verbete.listarVerbetes(depois);
  checar('a lista não conta o `_comentario` como exercício',
    lista.every((x) => !x.nome.startsWith('_')), lista.map((x) => x.nome));
  checar('e traz as músicas de cada exercício', lista.length >= 4
    && lista.find((x) => x.nome === 'Battement tendu').musicas.length === 3,
    lista.map((x) => x.nome + ':' + x.musicas.length));
}

/** A rota da Produção: a guarda da direção e a recusa do DELETE, medidas pelo `fetch` do Worker. */
async function aRota() {
  console.log('\nD. A ROTA — a guarda da direção, e o DELETE que existe para dizer não');

  const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  const env = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'senha-da-direcao', GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
  };

  const BASE = 'https://exemplo.workers.dev';
  const resposta = await bastidores.fetch(new Request(BASE + '/api/bastidores/verbete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }), env);
  checar('o DELETE sem a senha da direção é recusado com 401', resposta.status === 401, resposta.status);

  const comSenha = await bastidores.fetch(new Request(BASE + '/api/bastidores/verbete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaDirecao: 'senha-da-direcao' }),
  }), env);
  const corpo = await comSenha.json();
  checar('e com a senha ele responde 409, não 200 — apagar não é uma operação', comSenha.status === 409, comSenha.status);
  checar('a recusa explica a regra e diz o caminho', /P-03\/P-04/.test(corpo.erro || '')
    && corpo.como === 'PUT com { acao: "descontinuar" }', corpo);
}

aValidacao();
aEscrita().then(aRota).then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — o CRUD do verbete valida, grava no repositório e recusa apagar.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
