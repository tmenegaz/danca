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

  // A DIREÇÃO É A CHAVE DA CÉLULA (28/10/2026). Estas duas asserções guardavam a comparação entre
  // o campo `direcoes` e as chaves de `celulas` — e o campo deixou de existir. O que resta a poder
  // estar mal é a célula vazia, e é isso que passa a ser medido.
  const semCelula = verbeteBom();
  semCelula.celulas.derriere = [];
  const r1 = verbete.validarVerbete(semCelula, ALFABETO, VOCABULARIO);
  checar('uma direção sem célula é recusada', !r1.ok && /derriere/.test(r1.erros.join(' ')), r1.erros);

  const semNada = verbeteBom({ celulas: {} });
  const r2 = verbete.validarVerbete(semNada, ALFABETO, VOCABULARIO);
  checar('e um verbete sem célula nenhuma também', !r2.ok && /ao menos uma direção/.test(r2.erros.join(' ')), r2.erros);

  // O CAMPO `direcoes` NÃO VOLTA A ENTRAR. Se um pedido antigo o enviar, ele é ignorado — e o
  // verbete que daí sai é válido, porque o que manda são as células.
  const comCampoVelho = verbeteBom({ direcoes: ['devant', 'sur-la-tete'] });
  const r2b = verbete.validarVerbete(comCampoVelho, ALFABETO, VOCABULARIO);
  checar('o campo `direcoes`, se vier de uma página antiga, é ignorado e não invalida',
    r2b.ok, r2b.erros);

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

  const direcaoFantasma = verbeteBom();
  direcaoFantasma.celulas['sur-la-tete'] = [{ contagem: '1–2', bloco: '[Pé: 1ª → +]', descricao: 'x' }];
  const r7 = verbete.validarVerbete(direcaoFantasma, ALFABETO, VOCABULARIO);
  checar('uma direção fora da gramática é recusada', !r7.ok && /gramática/.test(r7.erros.join(' ')), r7.erros);
}

// ----------------------------------------------------- B/C/D. a escrita no repositório
/** Um GitHub de mentira: guarda o arquivo, honra o `sha` e recusa por cima do que existe. */
function githubFalso(inicial) {
  const arquivos = new Map(Object.entries(inicial));
  const pedidos = [];
  const f = async (url, opcoes) => {
    // O `?ref=` FAZ PARTE DA CONSULTA, e não do caminho: um GitHub de mentira que o deixasse
    // colado ao nome do ficheiro responderia 404 a tudo o que pedisse por ramo — e o 404 dele
    // seria lido como «o ficheiro não existe», que é exactamente a confusão que a secção E
    // existe para travar.
    const caminho = String(url).split('/contents/')[1].split('?')[0];
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

  // O QUE SE GRAVA NÃO LEVA `direcoes` (28/10/2026). O campo deixou de existir no dado — era,
  // nas seis entradas, exactamente a lista das chaves de `celulas`. Uma página antiga em cache
  // ainda o pode enviar; ele não pode ressuscitar no ficheiro, senão a segunda lista volta pela
  // porta de trás e a tela volta a poder declarar uma direção que não sabe descrever.
  checar('o verbete gravado NÃO tem o campo `direcoes`',
    !('direcoes' in gravado.verbetes['Battement fondu']['8|4/4']),
    Object.keys(gravado.verbetes['Battement fondu']['8|4/4']));

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

/**
 * E. A PÁGINA SERVIDA — os defeitos que o primeiro deploy mostrou (28/10/2026).
 *
 * Três, e os três eram invisíveis nas provas anteriores porque nenhuma delas exercitava o
 * caminho real:
 *
 *   1. `fetch` DENTRO DO MÓDULO é o HANDLER dos Bastidores. A rota do verbete chamava
 *      `fetch(u, o)` para ir ao GitHub — e chamava-se a si mesma, com uma string. Resultado:
 *      500 ao vivo.
 *   2. `lerDoRepo` desestruturava `cabecalhos` e as chamadas passavam `h` — os cabeçalhos
 *      chegavam `undefined`, sem `User-Agent`, e o GitHub respondia 403. O código dizia «não
 *      existe no repositório», que é a resposta errada para uma credencial recusada.
 *   3. A tela chamava `.json()` sobre a página de erro do 500 e mostrava «Unexpected token <».
 */
async function aPagina() {
  console.log('\nE. A PÁGINA SERVIDA — o 500 do primeiro deploy, e o que o causou');

  const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  const env = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'senha-da-direcao',
    GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
  };

  // O `fetch` GLOBAL é substituído por um GitHub de mentira. Se a rota se chamar a si mesma,
  // este nunca é usado — e a chamada rebenta, como rebentou ao vivo.
  const original = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url, opcoes) => {
    const u = String(url);
    chamadas.push(u);
    if (!u.startsWith('https://api.github.com/')) {
      throw new TypeError('a rota não devia pedir «' + u + '» — chamou-se a si mesma?');
    }
    const h = (opcoes && opcoes.headers) || {};
    if (!h['User-Agent']) {
      // É o que o GitHub faz: 403 sem User-Agent. O projeto já o tinha medido em 22/10/2026.
      return new Response('{"message":"User agent required"}', { status: 403 });
    }
    if (u.indexOf('notacao.json') !== -1) {
      return new Response(JSON.stringify({
        sha: 'sha-alfa',
        content: Buffer.from(JSON.stringify(ALFABETO, null, 2), 'utf8').toString('base64'),
      }), { status: 200 });
    }
    if (u.indexOf('vocabulario.json') !== -1) {
      return new Response(JSON.stringify({
        sha: 'sha-voc',
        content: Buffer.from(JSON.stringify(VOCABULARIO, null, 2), 'utf8').toString('base64'),
      }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };

  let resposta;
  let corpo = null;
  try {
    resposta = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/verbete'), env);
    corpo = await resposta.json();
  } finally {
    globalThis.fetch = original;
  }

  checar('o GET do verbete responde 200 (era 500: a rota chamava-se a si mesma)',
    resposta.status === 200, resposta.status);
  checar('e pede ao GitHub com User-Agent (sem ele o GitHub responde 403)',
    chamadas.length > 0 && chamadas.every((u) => u.startsWith('https://api.github.com/')), chamadas);
  checar('a lista de exercícios vem do alfabeto', Boolean(corpo && corpo.ok
    && corpo.exercicios.some((x) => x.nome === 'Battement tendu')), corpo && corpo.exercicios);
  checar('e o vocabulário de exercícios vem sem as posições nem as direções',
    Boolean(corpo && corpo.exerciciosDoVocabulario
      && corpo.exerciciosDoVocabulario.every((t) => ['passo', 'salto', 'ligacao', 'giro'].indexOf(t.categoria) !== -1)
      && !corpo.exerciciosDoVocabulario.some((t) => /position|devant|croise/.test(t.id))),
    corpo && (corpo.exerciciosDoVocabulario || []).length);

  // UMA CREDENCIAL RECUSADA NÃO É UM FICHEIRO AUSENTE.
  const v = require(path.join(RAIZ, 'motor', 'servidor', 'verbete.js'));
  const recusado = await v.lerModalidade({
    f: async () => new Response('{"message":"Bad credentials"}', { status: 401 }),
    token: 'errado', dono: 'd', repo: 'r', ref: 'main', modalidade: 'bale-classico',
  });
  checar('uma credencial recusada diz que foi recusada, e não que o ficheiro não existe',
    !recusado.ok && /recusou a leitura/.test(recusado.erro) && !/não existe/.test(recusado.erro), recusado.erro);

  // A PÁGINA: a nota técnica saiu, o exercício é escolha, e a música tem dois rótulos.
  const pagina = await bastidores.fetch(new Request('https://e.workers.dev/bastidores/producao'), env);
  const html = await pagina.text();
  checar('a nota técnica sobre commit e proveniência saiu da tela',
    !/vai para o repositório, num commit/.test(html));
  checar('o exercício é um `select`, não um campo de escrita',
    /<select id="vbnome"/.test(html) && !/<input id="vbnome"/.test(html));
  checar('e os tempos e o compasso têm um rótulo cada (não ficam colados)',
    (html.match(/for="vbtempos"/g) || []).length === 1 && (html.match(/for="vbcompasso"/g) || []).length === 1);

  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).sort((a, b) => b.length - a.length)[0] || '';
  let erroDeSintaxe = null;
  try { new Function(script); } catch (e) { erroDeSintaxe = e.message; }
  checar('o script da página compila', erroDeSintaxe === null, erroDeSintaxe);
  checar('e não lê a resposta como JSON sem a testar (a lição do «Unexpected token»',
    /function lerResposta/.test(script));
}

/**
 * F. O VOCABULÁRIO NUMA VERDADE SÓ (28/10/2026) — e o «+» que cria o exercício.
 *
 * Até esta data havia DUAS listas de termos: o ficheiro da modalidade no repositório e uma cópia
 * por escola no KV, semeada pelo botão «Carregar catálogo inicial». Duas listas divergem ao
 * primeiro termo novo, e o sintoma é silencioso — um exercício que existe na tela e não no
 * gerador, ou o contrário. A decisão foi: o vocabulário vive no REPOSITÓRIO, e só lá; a tela lê
 * o bundle que o deploy traz, e o cadastro grava no repositório.
 *
 * O que esta secção trava:
 *   - `termos()` devolve o vocabulário da modalidade MESMO com o KV vazio (não há cópia);
 *   - o cadastro de termo grava no ficheiro do vocabulário, e recusa o nome que já existe;
 *   - editar o nome muda o `id` (o `id` deriva do nome);
 *   - a posição sem `membro` é recusada — «première position» de pés não é a de braços;
 *   - a tela tem o «+» ao lado do exercício, e a caixa nasce fechada.
 */
async function aOrigemDoVocabulario() {
  console.log('\nF. O VOCABULÁRIO NUMA VERDADE SÓ — e o «+» do exercício');

  const termoRepo = require(path.join(RAIZ, 'motor', 'servidor', 'termo-repo.js'));
  const Caminho = termoRepo.CAMINHO;
  const repo = githubFalso({
    [Caminho]: { sha: 'sha-voc', conteudo: JSON.stringify(VOCABULARIO, null, 2) + '\n' },
  });
  const base = { f: repo.f, token: 'token-de-prova', dono: 'dono', repo: 'repo', ref: 'main' };
  const TRADICOES = ['compartilhada', 'RAD', 'francesa', 'Vaganova'];

  const criado = await termoRepo.criarTermo(Object.assign({}, base, {
    // Um nome que NÃO existe no vocabulário de verdade — a prova cria sobre o ficheiro real, e
    // «Battement fondu» já lá está (a primeira versão desta asserção bateu nisso).
    corpo: { termo: 'Sissonne ouverte', categoria: 'salto', tradicao: 'compartilhada' },
    tradicoes: TRADICOES,
  }));
  checar('o termo novo é criado', criado.ok, criado);
  checar('e a gravação vai para o vocabulário da modalidade',
    repo.pedidos.some((p) => p.metodo === 'PUT' && p.caminho === Caminho), repo.pedidos);
  checar('com mensagem do projeto', /^feat\(biblioteca\): acrescentar/.test(
    String(repo.arquivos.get(Caminho).mensagem || '').split('\n')[0]), repo.arquivos.get(Caminho).mensagem);
  // O FICHEIRO É UM ARRAY DE TERMOS, e não um objecto com a chave `termos` — o `catalogo-seed.js`
  // é que o embrulha para o Worker. Ler `.termos` aqui dava `undefined`, e um `.some` sobre
  // `undefined` rebenta em vez de reprovar: a asserção parecia medir e não media nada.
  const depois = JSON.parse(repo.arquivos.get(Caminho).conteudo);
  checar('e o ficheiro gravado continua a ser um array de termos', Array.isArray(depois), typeof depois);
  checar('e o termo está lá, com o `id` derivado do nome',
    depois.some((t) => t.id === 'sissonne-ouverte'), depois.map((t) => t.id).slice(-2));

  const duplicado = await termoRepo.criarTermo(Object.assign({}, base, {
    corpo: { termo: 'Sissonne ouverte', categoria: 'salto' }, tradicoes: TRADICOES,
  }));
  checar('criar o que já existe é recusado com 409', !duplicado.ok && duplicado.status === 409, duplicado);

  const editado = await termoRepo.editarNomeDoTermo(Object.assign({}, base, {
    idAntigo: 'sissonne-ouverte', novoNome: 'Sissonne ouverte simple',
  }));
  checar('editar o nome é aceito', editado.ok, editado);
  checar('e o `id` acompanha o nome (o `id` deriva dele)',
    editado.ok && editado.de === 'sissonne-ouverte' && editado.para === 'sissonne-ouverte-simple', editado);

  const semMembro = termoRepo.validarTermo({ termo: 'Première position', categoria: 'posicao' }, TRADICOES);
  checar('uma posição sem `membro` é recusada — pés e braços não partilham o nome',
    !semMembro.ok && /membro/.test(semMembro.erros.join(' ')), semMembro.erros);

  // A ORIGEM: o KV está vazio, e o vocabulário aparece assim mesmo. É o que prova que a cópia
  // por escola deixou de existir — e que o botão de semear já não tem o que semear.
  const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  const env = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim', SENHA_ADMIN: 'senha-da-direcao',
    GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
  };
  const servido = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/termos'), env);
  const lista = await servido.json();
  const doBundle = require(path.join(RAIZ, 'motor', 'servidor', 'catalogo-seed.js')).TERMOS;
  checar('o vocabulário é servido do bundle, com o KV vazio', servido.status === 200
    && lista.termos.length === doBundle.length, [servido.status, lista.termos && lista.termos.length]);

  const pagina = await bastidores.fetch(new Request('https://e.workers.dev/bastidores/producao'), env);
  const html = await pagina.text();
  checar('o «+» fica ao lado do exercício, e não noutra secção',
    /<span class="par-associar"><select id="vbnome"/.test(html), /par-associar/.test(html));
  // O MODO DO EXERCÍCIO NASCE FECHADO, e o do verbete aberto (28/10/2026). A caixa antiga
  // (`#vb-novo`) era uma caixa a meio do formulário; agora é um modo, com os seus campos, o seu
  // botão e o seu recado — e o modo do verbete não está no documento enquanto ele está aberto.
  checar('o modo do exercício nasce fechado, e o do verbete aberto',
    /<div id="vb-modo-verbete">/.test(html) && /<div id="vb-modo-exercicio" hidden>/.test(html),
    /vb-modo-exercicio/.test(html));

  // OS DOIS BOTÕES PRIMÁRIOS NÃO COEXISTEM. «Gravar verbete» e «Gravar exercício» têm de viver
  // em blocos diferentes, senão a tela volta a ter dois botões com o mesmo peso à vista.
  const blocoA = (html.match(/<div id="vb-modo-verbete">([\s\S]*?)<\/div>\s*<div id="vb-modo-exercicio"/) || [])[1] || '';
  const blocoB = (html.match(/<div id="vb-modo-exercicio" hidden>([\s\S]*?)<\/form>/) || [])[1] || '';
  checar('«Gravar verbete» está só no modo do verbete',
    /Gravar verbete/.test(blocoA) && !/Gravar verbete/.test(blocoB), [blocoA.length, blocoB.length]);
  checar('e «Gravar exercício» só no modo do exercício',
    /Gravar exercício/.test(blocoB) && !/Gravar exercício/.test(blocoA), null);
  checar('e os campos do verbete não estão no modo do exercício',
    !/id="vbtempos"/.test(blocoB) && !/id="vbposicao"/.test(blocoB), null);
  checar('e o botão de semear deixou de prometer o vocabulário',
    /Carregar as turmas iniciais/.test(html) && !/turmas \+ vocabulário/.test(html));

  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).sort((a, b) => b.length - a.length)[0] || '';
  checar('e o «+» grava pelo cadastro que já existe (o mesmo, não um segundo)',
    /fetch\("\/api\/bastidores\/termo"/.test(script) && /vb-criar-exercicio/.test(script));

  // ---- O EDITOR DE CÉLULA E OS DOIS MODOS (28/10/2026) -----------------------------
  // O gargalo que o editor destapa: o formulário lia as células do que já existia e, quando não
  // havia nenhuma, recusava — criar um verbete era impossível, para 55 exercícios possíveis e 4
  // verbetes. Estas asserções medem a MARCAÇÃO e o SCRIPT: a prova de comportamento é a bancada
  // no navegador (`experimentos/provar-celula.js`), que não vai ao ar.
  checar('o editor de célula existe, com os quatro campos e o gesto de acrescentar',
    /id="vb-cel-dir"/.test(html) && /id="vb-cel-contagem"/.test(html)
    && /id="vb-cel-bloco"/.test(html) && /id="vb-cel-desc"/.test(html)
    && /id="vb-cel-acrescentar"/.test(html) && /id="vb-celulas"/.test(html));
  checar('a legenda dos sinais vem do alfabeto, e não escrita na tela',
    /categoriasDeBloco/.test(script) && /d\.sinais/.test(script)
    && !/1ª 2ª 3ª 4ª 5ª/.test(html));

  // AS REGRAS DO PAR, medidas no texto do script: o modo B esconde o A, bloqueia o `select` e o
  // «+», e o `submit` do verbete não passa enquanto o modo do exercício está aberto.
  checar('o modo do exercício esconde os campos do verbete e bloqueia o par do exercício',
    /caixaVerbete\.hidden = Boolean\(aberto\)/.test(script)
    && /caixaExercicio\.hidden = !aberto/.test(script)
    && /nomes\.disabled = Boolean\(aberto\)/.test(script)
    && /mais\.disabled = Boolean\(aberto\)/.test(script));
  checar('e o Enter no modo do exercício não grava um verbete',
    /if \(caixaExercicio && !caixaExercicio\.hidden\) return;/.test(script));
  checar('e ao gravar o exercício, o modo volta com ele escolhido',
    /modoExercicio\(false\);/.test(script) && /agora o verbete dele/.test(script));
}

aValidacao();
aEscrita().then(aRota).then(aPagina).then(aOrigemDoVocabulario).then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — o CRUD do verbete valida, grava no repositório e recusa apagar;'
    + ' e o vocabulário vive numa verdade só.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
