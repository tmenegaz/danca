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

// A FIXTURE DA ESCRITA NÃO DEPENDE DO DADO REAL (31/10/2026). Esta prova cria o «Battement
// fondu» do zero — e deixou de o poder fazer no dia em que ele passou a existir no alfabeto a
// sério: o CRUD respondeu, e com razão, 409. Uma prova do CRUD que se estraga porque se criou um
// exercício em Produção é uma prova que mede o dado, não o mecanismo. Por isso a escrita tem uma
// fixture própria, com o nome de fora.
/* E A LEITURA TAMBÉM NÃO DEPENDE DO DADO REAL (02/11/2026) — a mesma lição, na outra metade.
 *
 * A pesquisadora apagou os 11 verbetes do alfabeto em 02/11/2026 (versão 30, só o `_comentario`
 * ficou), e três asserções desta prova caíram: elas liam o `notacao.json` de verdade e esperavam
 * lá encontrar o `Battement tendu` com três músicas. Não estavam a medir o mecanismo — estavam a
 * medir o conteúdo editorial, que é dela e muda.
 *
 * O QUE SE PLANTA AQUI é o mínimo para as três perguntas: um exercício com três músicas (a
 * listagem), outro ao lado (para «os outros ficam onde estavam») e nada mais. O alfabeto REAL
 * continua por baixo — gramática, sinais, direções, categorias —, e é isso que o resto da prova
 * precisa.
 */
const celulasDeQuatro = (marca) => ({
  devant: [
    { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: marca + ' (ida)' },
    { contagem: '3–4', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: marca + ' (volta)' },
  ],
});
const registroDe = (tempos, marca) => ({
  cobre: tempos,
  posicao: { membro: 'pes', termo: 'premiere-position' },
  celulas: celulasDeQuatro(marca),
});
ALFABETO.verbetes = Object.assign({}, ALFABETO.verbetes, {
  'Battement tendu': {
    '4|4/4': registroDe(4, 'tendu 4'),
    '8|4/4': registroDe(4, 'tendu 8'),
    '12|4/4': registroDe(4, 'tendu 12'),
  },
  'Plié': { '8|4/4': registroDe(4, 'plié') },
  'Rond de jambe': { '8|4/4': registroDe(4, 'rond') },
});

const ALFABETO_DA_ESCRITA = JSON.parse(JSON.stringify(ALFABETO));
delete (ALFABETO_DA_ESCRITA.verbetes || {})['Battement fondu'];

function verbeteBom(extra) {
  return Object.assign({
    cobre: 4,
    posicao: { membro: 'pes', termo: 'premiere-position' },
    direcoes: ['devant'],
    // A FORMA NOVA DA CÉLULA (28/10/2026): `categoria` + `sinais`, e não o texto do bloco. A
    // notação é derivada — uma representação só.
    celulas: {
      devant: [
        { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'extensão à frente a partir da 1ª posição' },
        { contagem: '3–4', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: 'retorno à 1ª posição' },
      ],
    },
  }, extra || {});
}

/* O VERBETE DE OITO TEMPOS — a mesma forma, com as células que a música «8|4/4» pede.
 *
 * ELE EXISTE PORQUE A MÚSICA PASSOU A SER CONFERIDA (02/11/2026). O `verbeteBom` cobre 4 tempos,
 * e era gravado em «8|4/4» — uma inconsistência que passava porque nada comparava a chave com as
 * células, e que é exactamente o defeito que a pesquisadora encontrou no alfabeto publicado (o
 * `Battement fondu` em «2|4/4» com 6 tempos, o `Plié` em «8|4/4» com 12). A fixture passa a ser
 * coerente: 8 tempos de células para a música de 8. */
function verbeteDeOitoTempos(extra) {
  return verbeteBom(Object.assign({
    cobre: 8,
    celulas: {
      devant: [
        { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'extensão à frente a partir da 1ª posição' },
        { contagem: '3–4', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: 'retorno à 1ª posição' },
        { contagem: '5–6', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'segunda extensão, no compasso seguinte' },
        { contagem: '7–8', categoria: 'Pé', sinais: ['+', '●', '1ª'], descricao: 'e o retorno' },
      ],
    },
  }, extra || {}));
}

// ------------------------------------------------------------------ A. a validação
function aValidacao() {
  console.log('\nA. A VALIDAÇÃO — a mesma régua do motor, aplicada antes de gravar');

  const bom = verbete.validarVerbete(verbeteBom(), ALFABETO, VOCABULARIO);
  checar('um verbete bem formado é aceito', bom.ok, bom.erros);

  const cobreErrado = verbete.validarVerbete(verbeteBom({ cobre: 6 }), ALFABETO, VOCABULARIO);
  // A MENSAGEM MUDOU DE RÉGUA (02/11/2026): já não diz «as células somam», diz «a maior pista tem».
  // A soma em linha e a maior pista são a mesma coisa quando há uma pista só — e é o caso desta
  // fixture, toda em `Pé`. O que se mede é que a recusa continua a nomear a conta.
  checar('e um `cobre` que não é o das células é recusado',
    !cobreErrado.ok && /maior pista tem 4/.test(cobreErrado.erros.join(' ')),
    cobreErrado.erros);

  /* AS PISTAS (02/11/2026) — a régua que substituiu a soma em linha.
   *
   * O CASO É O `Plié` REAL: as pernas fazem dois compassos de 4/4 (8 tempos) e os braços fazem um
   * (4), AO MESMO TEMPO. Somado em linha dava 12 numa música de 8, e a gravação recusava o
   * verbete — o dado estava certo e a conta é que não. Estas três asserções guardam a leitura
   * nova, e a terceira é o controle negativo: sem pistas diferentes, a conta antiga tem de dar o
   * mesmo que a nova. */
  const paralelo = verbete.validarVerbete(verbeteBom({
    cobre: 8,
    celulas: {
      devant: [
        { contagem: '1–4', categoria: 'Perna', sinais: ['1ª', '↓'], descricao: 'os apoios cedem' },
        { contagem: '1–4', categoria: 'Perna', sinais: ['1ª', '↑'], descricao: 'os apoios sobem' },
        { contagem: '1–2', categoria: 'Braço', sinais: ['↓', '⌒'], descricao: 'os braços descem' },
        { contagem: '3–4', categoria: 'Braço', sinais: ['→', '⌒'], descricao: 'e conduzem' },
      ],
    },
  }), ALFABETO, VOCABULARIO);
  checar('duas pistas em paralelo fecham quando a MAIOR fecha, e não a soma',
    paralelo.ok, paralelo.erros);

  const paraleloErrado = verbete.validarVerbete(verbeteBom({
    cobre: 12,
    celulas: {
      devant: [
        { contagem: '1–4', categoria: 'Perna', sinais: ['1ª', '↓'], descricao: 'os apoios cedem' },
        { contagem: '1–4', categoria: 'Perna', sinais: ['1ª', '↑'], descricao: 'os apoios sobem' },
        { contagem: '1–2', categoria: 'Braço', sinais: ['↓', '⌒'], descricao: 'os braços descem' },
        { contagem: '3–4', categoria: 'Braço', sinais: ['→', '⌒'], descricao: 'e conduzem' },
      ],
    },
  }), ALFABETO, VOCABULARIO);
  checar('…e o `cobre` que soma as pistas é recusado, com as duas contas na mensagem',
    !paraleloErrado.ok && /maior pista tem 8/.test(paraleloErrado.erros.join(' '))
      && /soma em linha daria 12/.test(paraleloErrado.erros.join(' ')),
    paraleloErrado.erros);

  /* A REPETIÇÃO É DA CÉLULA (02/11/2026). «O plié desce e sobe duas vezes» era escrito duplicando
   * a linha; passa a ser um número na célula, e o que ela ocupa na música é o produto. */
  const comRepeticao = verbete.validarVerbete(verbeteBom({
    cobre: 8,
    celulas: {
      devant: [
        { contagem: '1–4', categoria: 'Pé', sinais: ['1ª', '→'], descricao: 'extensão', repeticoes: 2 },
      ],
    },
  }), ALFABETO, VOCABULARIO);
  checar('a repetição multiplica o que a célula ocupa (1–4, 2× = 8 tempos)',
    comRepeticao.ok, comRepeticao.erros);

  const repeticaoInvalida = verbete.validarVerbete(verbeteBom({
    celulas: {
      devant: [
        { contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→'], descricao: 'extensão', repeticoes: 0 },
      ],
    },
  }), ALFABETO, VOCABULARIO);
  checar('…e uma repetição que não é um inteiro ≥ 1 é recusada',
    !repeticaoInvalida.ok && /repetição inválida/.test(repeticaoInvalida.erros.join(' ')),
    repeticaoInvalida.erros);

  // O MÉTODO é uma SOBREPOSIÇÃO ao do plano, e o nome não tem comprimento de frase.
  const metodoLongo = verbete.validarVerbete(verbeteBom({ metodo: 'x'.repeat(41) }), ALFABETO, VOCABULARIO);
  checar('…e um método declarado como frase, e não como nome, é recusado',
    !metodoLongo.ok && /método declarado/.test(metodoLongo.erros.join(' ')), metodoLongo.erros);

  // A DIREÇÃO É A CHAVE DA CÉLULA (28/10/2026). Estas duas asserções guardavam a comparação entre
  // o campo `direcoes` e as chaves de `celulas` — e o campo deixou de existir. O que resta a poder
  // estar mal é a célula vazia, e é isso que passa a ser medido.
  /* O BALDE VAZIO DEIXOU DE SER RECUSADO (02/11/2026). Foi ele que produziu o 400 real — «a
   * direção «devant» não tem célula» — sobre um balde que o editor deixou e que a tabela nunca
   * mostra: a pesquisadora nunca escolheu «devant». Uma chave com zero células diz o mesmo que a
   * chave não existir, e o que se grava é o corpo NORMALIZADO — o balde não entra no ficheiro. */
  const comBalde = verbeteBom();
  comBalde.celulas.derriere = [];
  const r1 = verbete.validarVerbete(comBalde, ALFABETO, VOCABULARIO);
  checar('um balde vazio é aceite — é ruído do editor, não uma declaração', r1.ok, r1.erros);

  const chaveTorta = verbeteBom();
  chaveTorta.celulas.derriere = 'não é uma lista';
  const rTorta = verbete.validarVerbete(chaveTorta, ALFABETO, VOCABULARIO);
  checar('…mas uma direção que não é uma lista continua a ser recusada',
    !rTorta.ok && /derriere/.test(rTorta.erros.join(' ')), rTorta.erros);

  checar('…e a normalização tira o balde sem tocar no que tem células',
    !('derriere' in verbete.semBaldesVazios(comBalde).celulas)
      && 'devant' in verbete.semBaldesVazios(comBalde).celulas,
    Object.keys(verbete.semBaldesVazios(comBalde).celulas));

  const semNada = verbeteBom({ celulas: {} });
  const r2 = verbete.validarVerbete(semNada, ALFABETO, VOCABULARIO);
  checar('e um verbete sem célula nenhuma também', !r2.ok && /ao menos um trecho/.test(r2.erros.join(' ')), r2.erros);

  /* O TRECHO SEM DIREÇÃO (01/11/2026). A direção deixou de ser obrigatória: o `relevé` sobe e
   * desce em primeira posição, en face, nos pés — não vai à frente, nem ao lado, nem atrás. Antes,
   * a única saída era enfiar as células debaixo de uma direção que não era a delas (é o que o
   * `Plié` do alfabeto faz: está todo em `devant`), e o verbete do relevé não se podia escrever.
   * A chave VAZIA é a ausência declarada — e não uma direção a conferir contra a gramática. */
  const semDirecao = verbeteBom({ celulas: { '': [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '↑'], descricao: 'sobe às meias-pontas e desce' }] } });
  semDirecao.cobre = 2;
  const rSemDir = verbete.validarVerbete(semDirecao, ALFABETO, VOCABULARIO);
  checar('um trecho SEM direção é aceite — é o relevé, que não vai a lado nenhum',
    rSemDir.ok, rSemDir.erros);
  const direcaoInventada = verbeteBom({ celulas: { 'sur-la-tete': [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª'], descricao: 'x' }] } });
  direcaoInventada.cobre = 2;
  const rInv = verbete.validarVerbete(direcaoInventada, ALFABETO, VOCABULARIO);
  checar('…mas uma direção que a gramática não tem continua a ser recusada',
    !rInv.ok && /não existe na gramática/.test(rInv.erros.join(' ')), rInv.erros);
  const celulaMuda = verbeteBom({ celulas: { '': [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª'], descricao: '' }] } });
  celulaMuda.cobre = 2;
  const rMuda = verbete.validarVerbete(celulaMuda, ALFABETO, VOCABULARIO);
  checar('e a recusa de um trecho sem direção diz «no trecho sem direção», não «em «»»',
    !rMuda.ok && /no trecho sem direção/.test(rMuda.erros.join(' ')), rMuda.erros);

  // O CAMPO `direcoes` NÃO VOLTA A ENTRAR. Se um pedido antigo o enviar, ele é ignorado — e o
  // verbete que daí sai é válido, porque o que manda são as células.
  const comCampoVelho = verbeteBom({ direcoes: ['devant', 'sur-la-tete'] });
  const r2b = verbete.validarVerbete(comCampoVelho, ALFABETO, VOCABULARIO);
  checar('o campo `direcoes`, se vier de uma página antiga, é ignorado e não invalida',
    r2b.ok, r2b.erros);

  const sinal = verbeteBom();
  sinal.celulas.devant[0].sinais = ['1ª', '→', '§'];
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
  direcaoFantasma.celulas['sur-la-tete'] = [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '→', '+'], descricao: 'x' }];
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
    [CAlfabeto]: { sha: 'sha-inicial', conteudo: JSON.stringify(ALFABETO_DA_ESCRITA, null, 2) + '\n' },
    [CVocabulario]: { sha: 'sha-voc', conteudo: JSON.stringify(VOCABULARIO, null, 2) + '\n' },
  });

  const base = {
    f: repo.f, token: 'token-de-prova', dono: 'dono', repo: 'repo', ref: 'main',
    modalidade: 'bale-classico',
  };

  const criado = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'criar',
  }));
  checar('um verbete novo é criado', criado.ok, criado);
  checar('e a versão do alfabeto sobe', criado.versao === Number(ALFABETO_DA_ESCRITA.versao) + 1, criado.versao);
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

  /* CRIAR RECUSA O QUE JÁ EXISTE — DO MESMO DONO E DA MESMA MÚSICA (03/11/2026). Era por
   * exercício, e isso impedia o que a decisão do dono quer: a escola declarar o seu verbete de um
   * exercício que o catálogo já decompõe, e o exercício ganhar uma segunda música. O que não pode
   * repetir-se é a IDENTIDADE — (dono, exercício, música). */
  const deNovo = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'criar',
  }));
  checar('criar o que já existe é recusado com 409', !deNovo.ok && deNovo.status === 409, deNovo);
  const outraMusica = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '16|4/4', verbete: verbeteDeOitoTempos(), acao: 'criar',
  }));
  checar('…mas o MESMO exercício com OUTRA música entra — são dois registos',
    outraMusica.ok === true, outraMusica.erros || outraMusica.erro);

  const editar = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'atualizar',
  }));
  checar('e editar o que existe é aceito', editar.ok, editar);

  /* EDITAR E MUDAR OS TEMPOS SUBSTITUI — não acrescenta ao lado (02/11/2026).
   *
   * O DEFEITO QUE ISTO GUARDA, relatado por ela: «o sistema criou um novo registro (o Plié de 16
   * tempos) e manteve o registro antigo (o Plié de 8 tempos)». Não era INSERT: a CHAVE do registo
   * é «<tempos>|<compasso>», e mudar os tempos muda a chave. O registo antigo ficava ao lado.
   *
   * A regra: numa EDIÇÃO, a música de onde se veio sai — a menos que a tela peça explicitamente
   * para ficar com as duas (`musicaAnterior` vazio). As três asserções medem os três casos. */
  // A SEGUNDA MÚSICA NASCE COM `atualizar`: uma música nova de um exercício que já existe não é
  // «criar» — `criar` é o exercício, e ele já está lá.
  const segunda = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '4|4/4', verbete: verbeteBom(), acao: 'atualizar',
  }));
  const antesDaTroca = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo).verbetes['Battement fondu'];
  checar('o cenário tem as duas músicas antes da troca',
    segunda.ok && Boolean(antesDaTroca['8|4/4']) && Boolean(antesDaTroca['4|4/4']),
    Object.keys(antesDaTroca));

  const trocou = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', musicaAnterior: '4|4/4',
    verbete: verbeteDeOitoTempos(), acao: 'atualizar',
  }));
  const depoisDaTroca = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo).verbetes['Battement fondu'];
  checar('editar com `musicaAnterior` TIRA a música de onde se veio',
    trocou.ok && !('4|4/4' in depoisDaTroca) && Boolean(depoisDaTroca['8|4/4']),
    Object.keys(depoisDaTroca));
  checar('…e a mensagem diz que substituiu',
    /substitui a música 4\|4\/4/.test(String(repo.arquivos.get(CAlfabeto).mensagem || '')),
    repo.arquivos.get(CAlfabeto).mensagem);

  // SEM `musicaAnterior`, ficam as duas — é a escolha explícita da tela («guardar como música nova»).
  const comoNova = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '4|4/4', verbete: verbeteBom(), acao: 'atualizar',
  }));
  const depoisComoNova = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo).verbetes['Battement fondu'];
  checar('sem `musicaAnterior`, as duas músicas ficam — é o «guardar como música nova»',
    comoNova.ok && Boolean(depoisComoNova['4|4/4']) && Boolean(depoisComoNova['8|4/4']),
    Object.keys(depoisComoNova));

  // E A GUARDA QUE MAIS IMPORTA: `musicaAnterior` IGUAL à nova não apaga o que se acabou de gravar.
  const mesmo = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', musicaAnterior: '8|4/4',
    verbete: verbeteDeOitoTempos(), acao: 'atualizar',
  }));
  const depoisMesmo = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo).verbetes['Battement fondu'];
  checar('`musicaAnterior` igual à nova não apaga o trabalho — o verbete fica com ela',
    mesmo.ok && Boolean(depoisMesmo['8|4/4']) && Object.keys(depoisMesmo).filter((k) => /^\d+\|/.test(k)).length >= 1,
    Object.keys(depoisMesmo));

  const semToken = await verbete.gravarVerbete(Object.assign({}, base, {
    token: '', nome: 'X', musica: '4|4/4', verbete: verbeteBom(), acao: 'criar',
  }));
  checar('sem token do repositório não se grava nada', !semToken.ok && semToken.status === 401, semToken);

  // O TÍTULO MUDOU (02/11/2026). Ele dizia «não há DELETE» — e passou a haver. O que continua a
  // não haver é APAGAR O EXERCÍCIO: descontinuar marca e conserva o registo, e é isso que esta
  // secção mede. O apagar do verbete tem secção própria (C-2), com a consequência escrita.
  console.log('\nC. DESCONTINUAR — a marca que conserva o registo');

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

  /* C-2. APAGAR O VERBETE (02/11/2026) — «faltou fazer o verbo deletar o verbete».
   *
   * A REGRA ANTIGA RECUSAVA com 409, e o argumento era o P-03/P-04: um verbete que já compôs um
   * documento publicado é parte do passado desse documento. O argumento continua verdadeiro para
   * o HISTÓRICO — e é por isso que a consequência fica escrita na tela, no `confirm`, antes do
   * gesto. Mas um verbete escrito ontem numa música que não serve não é história: é lixo no
   * dicionário, e quem o escreveu tem de o poder tirar.
   *
   * O QUE SAI e o que fica: sai a DECOMPOSIÇÃO daquele exercício; fica o EXERCÍCIO no
   * vocabulário. Apagar a notação não apaga a palavra.
   */
  console.log('\nC-2. APAGAR O VERBETE — o verbo que faltava, e o que ele NÃO apaga');

  const semTokenApagar = await verbete.apagarVerbete(Object.assign({}, base, {
    token: '', nome: 'Battement fondu',
  }));
  checar('apagar sem token do repositório é recusado com 401',
    !semTokenApagar.ok && semTokenApagar.status === 401, semTokenApagar);

  const semNomeApagar = await verbete.apagarVerbete(Object.assign({}, base, { nome: '  ' }));
  checar('apagar sem dizer QUAL é recusado com 400 — não se apaga «o que estiver lá»',
    !semNomeApagar.ok && semNomeApagar.status === 400, semNomeApagar);

  const naoExiste = await verbete.apagarVerbete(Object.assign({}, base, { nome: 'Pas assemblé' }));
  checar('apagar o que não existe responde 404, e di-lo pelo nome',
    !naoExiste.ok && naoExiste.status === 404 && /Pas assemblé/.test(naoExiste.erro || ''), naoExiste);

  /* CADA DONO APAGA O QUE É SEU (03/11/2026). O alfabeto passou a guardar o verbete de cada
   * escola ao lado do catálogo (`8|4/4@breu`), e o `DELETE` deixou de poder apagar o exercício
   * inteiro: apagar o do catálogo pela tela de uma escola tirá-lo-ia a todas. A prova mede as
   * duas metades — a escola não toca no catálogo, e apaga o que é dela. */
  const doCatalogo = await verbete.apagarVerbete(Object.assign({}, base,
    { nome: 'Battement fondu', escola: 'batata' }));
  checar('a escola NÃO apaga o verbete do catálogo — e a recusa di-lo',
    !doCatalogo.ok && doCatalogo.status === 409 && /catálogo/.test(doCatalogo.erro || ''), doCatalogo);

  const propria = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'criar',
    escola: 'batata',
  }));
  checar('a escola grava a sua versão do exercício', propria.ok === true, propria.erros || propria.erro);

  const versaoAntesDeApagar = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo).versao;
  const apagado = await verbete.apagarVerbete(Object.assign({}, base,
    { nome: 'Battement fondu', escola: 'batata' }));
  checar('apagar um verbete que existe é aceito', apagado.ok, apagado);
  checar('…e a versão do alfabeto sobe — apagar também é um elo da cadeia',
    apagado.versao === Number(versaoAntesDeApagar) + 1, { antes: versaoAntesDeApagar, depois: apagado.versao });

  const semOVerbete = JSON.parse(repo.arquivos.get(CAlfabeto).conteudo);
  checar('a versão da escola sai, com todas as músicas dela',
    !Object.keys(semOVerbete.verbetes['Battement fondu'] || {}).some((k) => /@batata$/.test(k)),
    Object.keys(semOVerbete.verbetes['Battement fondu'] || {}));
  checar('…e a do catálogo fica, porque não era dela',
    Boolean(semOVerbete.verbetes['Battement fondu']['8|4/4']),
    Object.keys(semOVerbete.verbetes['Battement fondu'] || {}));
  checar('…e os OUTROS verbetes ficam onde estavam',
    Boolean(semOVerbete.verbetes['Battement tendu']), Object.keys(semOVerbete.verbetes));
  checar('a mensagem do commit diz o que foi apagado e onde',
    /^chore\(notacao\): apagar o verbete «Battement fondu» no alfabeto bale-classico/.test(
      String(repo.arquivos.get(CAlfabeto).mensagem || '').split('\n')[0]),
    repo.arquivos.get(CAlfabeto).mensagem);
  checar('e a lista da escola deixa de mostrar a versão dela',
    (verbete.listarVerbetes(semOVerbete, 'batata').find((x) => x.nome === 'Battement fondu') || { porMusica: [] })
      .porMusica.every((m) => m.escola !== 'batata'),
    verbete.listarVerbetes(semOVerbete, 'batata').map((x) => x.nome));
  // O QUE NÃO SE TOCA: o ficheiro do VOCABULÁRIO. Uma notação apagada não é uma palavra apagada.
  checar('o vocabulário não é escrito nem apagado por este verbo',
    !repo.pedidos.some((p) => p.metodo === 'DELETE')
      && JSON.parse(repo.arquivos.get(CVocabulario).conteudo).length === VOCABULARIO.length,
    repo.pedidos.map((p) => p.metodo + ' ' + p.caminho));
}

/** A rota da Produção: a guarda da direção e a recusa do DELETE, medidas pelo `fetch` do Worker. */
async function aRota() {
  console.log('\nD. A ROTA — a guarda da direção e o DELETE que agora apaga');

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
  // SEM NOME, A ROTA NÃO APAGA NADA (02/11/2026). Era 409 com o sermão da P-03/P-04; agora é 400
  // — o verbo existe, e a guarda é o NOME. Um `DELETE` sem corpo apagaria «o que estivesse lá», e
  // é a única coisa que não pode acontecer por engano. O caminho que apaga a sério (com o
  // repositório de mentira) está medido em C-2; aqui mede-se a guarda, que não toca na rede.
  checar('e com a senha, mas sem dizer qual, ele responde 400 — não apaga «o que estiver lá»',
    comSenha.status === 400, comSenha.status);
  checar('a recusa diz o que falta', /nome/i.test(corpo.erro || ''), corpo);
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

  // AS CATEGORIAS NÃO SE REPETEM DENTRO DOS SINAIS (28/10/2026). O grupo «Categorias» do
  // alfabeto também tem `itens`, e o código recolhia as chaves de todos: a legenda dizia «pé,
  // peso, plié, braço» duas vezes. A pesquisadora viu-o na tela e o código não via.
  checar('a rota não mete as categorias dentro dos sinais',
    Boolean(corpo && Array.isArray(corpo.sinais)
      && !corpo.sinais.some((x) => ['Pé', 'Peso', 'Plié', 'Braço'].indexOf(x.sinal) !== -1)),
    corpo && (corpo.sinais || []).map((x) => x.sinal));
  checar('e cada sinal leva o nome e o grupo, para a tela poder dizer «→ conduz a»',
    Boolean(corpo && corpo.sinais && corpo.sinais.every((x) => x.nome && x.grupo)),
    corpo && (corpo.sinais || []).slice(0, 2));

  // O DICIONÁRIO DO QUE ACONTECE chega pela mesma rota. A frase que a aula mostra vem dele; o
  // que fica gravado é a frase da célula, porque a proveniência acrescenta e não edita.
  checar('a rota serve o dicionário do que acontece',
    Boolean(corpo && corpo.descricoes && corpo.descricoes['[Pé: 1ª → +]']),
    corpo && Object.keys(corpo.descricoes || {}).length);

  // A DEFINIÇÃO DO EXERCÍCIO TAMBÉM (31/10/2026). É ela que pré-enche a FRASE DO VERBETE (passo 2)
  // — o que o exercício É, escrito uma vez. Sem ela na rota, o campo volta a ficar vazio e volta
  // a receber o nome do exercício, que foi o defeito do primeiro verbete escrito a sério.
  checar('e a lista de exercícios leva a definição e a sua fonte',
    Boolean(corpo && Array.isArray(corpo.exerciciosDoVocabulario)
      && corpo.exerciciosDoVocabulario.every((t) => 'descricao' in t && 'fonte' in t)),
    corpo && (corpo.exerciciosDoVocabulario || [])[0]);
  const comDefinicao = ((corpo && corpo.exerciciosDoVocabulario) || [])
    .filter((t) => t.descricao);
  checar('e há exercícios com definição — o vocabulário é a fonte única dela',
    comDefinicao.length > 0, comDefinicao.length);

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

  checar('o termo criado sem escola NÃO declara dono — é do catálogo',
    criado.ok && !depois.find((t) => t.id === 'sissonne-ouverte').escola,
    depois.find((t) => t.id === 'sissonne-ouverte'));

  const duplicado = await termoRepo.criarTermo(Object.assign({}, base, {
    corpo: { termo: 'Sissonne ouverte', categoria: 'salto' }, tradicoes: TRADICOES,
  }));
  checar('criar o que já existe é recusado com 409', !duplicado.ok && duplicado.status === 409, duplicado);

  // O DONO DO TERMO (02/11/2026). O termo criado na Produção de uma escola é DELA — e a colisão
  // passa a ser por (dono, id), e não só por id: sem isso, a escola B ficaria bloqueada por um
  // termo da escola A que ela nem vê, que é a contaminação disfarçada de «já existe».
  const daEscola = await termoRepo.criarTermo(Object.assign({}, base, {
    corpo: { termo: 'Sissonne fermée', categoria: 'salto', tradicao: 'compartilhada' },
    tradicoes: TRADICOES, escola: 'breu',
  }));
  checar('o termo criado numa escola declara o dono no próprio termo',
    daEscola.ok && daEscola.termo.escola === 'breu', daEscola.termo);
  checar('…e a mensagem do commit diz de que escola é',
    /escola «breu»/.test(String(repo.arquivos.get(Caminho).mensagem || '')), repo.arquivos.get(Caminho).mensagem);
  const mesmaNoutra = await termoRepo.criarTermo(Object.assign({}, base, {
    corpo: { termo: 'Sissonne fermée', categoria: 'salto', tradicao: 'compartilhada' },
    tradicoes: TRADICOES, escola: 'outra',
  }));
  checar('…e o mesmo nome noutra escola é aceito — a colisão é por (dono, id)',
    mesmaNoutra.ok, mesmaNoutra);
  const mesmaNaMesma = await termoRepo.criarTermo(Object.assign({}, base, {
    corpo: { termo: 'Sissonne fermée', categoria: 'salto', tradicao: 'compartilhada' },
    tradicoes: TRADICOES, escola: 'breu',
  }));
  checar('…e repetido na MESMA escola continua a ser 409',
    !mesmaNaMesma.ok && mesmaNaMesma.status === 409
      && /desta escola/.test(String(mesmaNaMesma.erro || '')), mesmaNaMesma);

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
  /* O BUNDLE TEM TAMBÉM O QUE CADA ESCOLA CRIOU (03/11/2026). O ficheiro passou a guardar o
   * termo da escola marcado com `escola`, e a rota compõe o que AQUELA escola vê: o catálogo
   * mais as dela. Comparar com o comprimento cru do bundle passaria a exigir que a `batata`
   * visse os termos da `breu` — o contrário do que a separação existe para garantir. O que se
   * mede continua a ser o mesmo: o KV está vazio e o vocabulário aparece, logo veio do bundle. */
  const comum = require(path.join(RAIZ, 'motor', 'nucleo', 'produtos', 'comum.js'));
  const separado = comum.separarPorEscola(doBundle, 'batata');
  const esperado = comum.compor(separado.catalogo, separado.adicoes);
  checar('o vocabulário é servido do bundle, com o KV vazio', servido.status === 200
    && lista.termos.length === esperado.length, [servido.status, lista.termos && lista.termos.length]);

  const pagina = await bastidores.fetch(new Request('https://e.workers.dev/bastidores/producao'), env);
  const html = await pagina.text();
  /* O EXERCÍCIO NOVO É O PASSO 1, E NÃO UM «+» (02/11/2026).
   *
   * A pesquisadora: «somente esses campos — exercício novo, categoria, tradição e carregar as
   * turmas iniciais — vão ser o step 1 (…) e esse botão de mais (…) deixa de existir.» Estas
   * asserções medem a AUSÊNCIA, que é o que distingue o pedido dela do que eu tinha feito: nada
   * de «+», nada de «Gravar exercício», nada de «Cancelar». */
  const painel1 = (html.match(/<div class="passo-painel" data-passo="1">([\s\S]*?)<div id="vb-modo-verbete">/) || [])[1] || '';
  checar('o passo 1 tem os quatro controlos, e só eles',
    ['vnnome', 'vncategoria', 'vntradicao', 'semear']
      .every((id) => new RegExp('id="' + id + '"').test(painel1))
    && painel1.length > 0, painel1.length);
  checar('e NÃO tem o «+» — criar o exercício deixou de ser um botão que abre um cadastro',
    !/vb-novo-exercicio/.test(html), /vb-novo-exercicio/.test(html));
  checar('nem «Gravar exercício» nem «Cancelar»: quem grava é o «Seguir →»',
    !/Gravar exercício/.test(html) && !/vb-cancelar-exercicio/.test(html),
    [/Gravar exercício/.test(html), /vb-cancelar-exercicio/.test(html)]);
  /* A FRASE SUBIU PARA O PASSO 1, E A POSIÇÃO SAIU DO FORMULÁRIO (02/11/2026).
   *
   * O que ela pediu: «esse campo representa a definição/significado do exercício (…) deve ser
   * removido do Step 2 e posicionado obrigatoriamente no Step 1» e «o campo "Posição em que o
   * exercício acontece" do Step 2 deve ser removido/extinto». A posição continua no DADO — o que
   * sai é o pedido, porque ela passa a escrever-se nos sinais do trecho. */
  checar('a FRASE está no passo 1, ao lado do nome — o exercício define-se quando se nomeia',
    (() => {
      const p1 = (html.match(/<div class="passo-painel" data-passo="1">([\s\S]*?)<div class="passo-painel" data-passo="2"/) || [])[1] || '';
      return /id="vb-frase"/.test(p1);
    })());
  checar('o seletor do exercício está no passo 2 — e o passo 2 já não pede a posição',
    (() => {
      const p2 = (html.match(/<div class="passo-painel" data-passo="2" hidden>([\s\S]*?)<div class="passo-painel" data-passo="3"/) || [])[1] || '';
      return /id="vbnome"/.test(p2) && !/id="vbposicao"/.test(html);
    })());
  checar('e a tira anuncia SEIS passos, com o exercício novo em primeiro',
    /data-passo="6"/.test(html) && /<span class="passo-t">O exercício novo<\/span>/.test(html));
  checar('e o botão de semear deixou de prometer o vocabulário',
    /Carregar as turmas iniciais/.test(html) && !/turmas \+ vocabulário/.test(html));

  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]).sort((a, b) => b.length - a.length)[0] || '';
  checar('o «Seguir →» do passo 1 grava o termo e avança',
    /PASSO === 1/.test(script) && /criarExercicioDoPasso1/.test(script)
    && /fetch\("\/api\/bastidores\/termo"/.test(script));

  // ---- O EDITOR DE CÉLULA E OS DOIS MODOS (28/10/2026) -----------------------------
  // O gargalo que o editor destapa: o formulário lia as células do que já existia e, quando não
  // havia nenhuma, recusava — criar um verbete era impossível, para 55 exercícios possíveis e 4
  // verbetes. Estas asserções medem a MARCAÇÃO e o SCRIPT: a prova de comportamento é a bancada
  // no navegador (`experimentos/provar-celula.js`), que não vai ao ar.
  // A FRASE SAIU DAQUI E FOI PARA O PASSO 2 (31/10/2026). Havia um campo de texto por trecho
  // («o que acontece neste trecho»), e ele obrigava a reescrever a mesma definição a cada
  // acrescento. O que se mede agora é o campo do VERBETE e a prévia do que fica escrito.
  checar('o editor do trecho existe, com as pílulas e o gesto de acrescentar',
    /id="vb-dir"/.test(html) && /id="vb-orient"/.test(html) && /id="vb-contagem"/.test(html)
    && /id="vb-sinais"/.test(html) && /id="vb-frase"/.test(html)
    && /id="vb-cel-acrescentar"/.test(html) && /id="vb-tabela"/.test(html)
    && /id="vb-fica"/.test(html));
  // E O CAMPO POR TRECHO NÃO VOLTA. Ele é a redundância que a pesquisadora descreveu: «toda vez
  // que eu vou acrescentar um trecho, eu preciso digitar novamente o que acontece».
  checar('e não há nenhum campo de frase por trecho',
    !/id="vb-cel-desc"/.test(html) && !/id="vb-desc-nota"/.test(html));
  // OS DOIS EIXOS NA MARCAÇÃO (versão 5, 28/10/2026): a direção do membro e a orientação do
  // corpo são campos distintos porque são coisas distintas.
  checar('a direção do membro e a orientação do corpo são dois campos, e não um',
    /Direção do membro/.test(html) && /Orientação do corpo/.test(html));
  // A ROTA também tem de as separar — e ela não está no HTML, está no módulo. Uma asserção que
  // olhasse para o HTML passaria sem medir nada.
  const fonte = fs.readFileSync(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'), 'utf8');
  checar('e a rota serve as duas listas separadas, e não oito numa só',
    /orientacoes: Object\.entries/.test(fonte) && /direcoes: Object\.entries/.test(fonte)
    && !/direcoesDoMembro \|\| \{\}\)\s*\.concat/.test(fonte));

  // «BLOCO» QUERIA DIZER DUAS COISAS (28/10/2026). No plano, `Bloco` é Solo · Barra · Centro; na
  // célula, era a notação. A pesquisadora leu «bloco» e entendeu — com razão — o sentido do
  // plano. O campo passou a chamar-se Sinais Benesh, e a palavra «bloco» não pode voltar ao
  // formulário com o outro sentido.
  checar('o campo da notação chama-se «Sinais Benesh», e não «bloco»',
    /Sinais Benesh/.test(html) && !/for="vb-cel-bloco"/.test(html)
    && !/bloco, ex\.:/.test(html));

  // A CONTAGEM E OS SINAIS COMPÕEM-SE, NÃO SE ESCREVEM. Não há campo de texto livre para a
  // notação, e a contagem é uma lista de pílulas que o script preenche com o que cabe no
  // compasso. O `<select>` dos sinais saiu (28/10/2026) porque escolha única não escreve
  // sequência: escolher o segundo sinal apagava o primeiro.
  checar('a contagem é uma lista de pílulas — não um campo de escrita nem uma lista suspensa',
    /id="vb-contagem"/.test(html) && !/<input id="vb-cel-contagem"/.test(html)
    && !/<select id="vb-cel-contagem"/.test(html));
  checar('e não ficou nenhuma lista suspensa no editor do trecho',
    !/<select id="vb-(cel-)?(dir|contagem|sinal|sinais)"/.test(html));
  // A ASSINATURA MUDOU (02/11/2026): a contagem é por PISTA (a categoria), e o passo da grade
  // passou a depender da métrica — os compostos agrupam de três em três.
  checar('e a lista da contagem é calculada por pista, não fixa',
    /function opcoesDeContagem\(cat\)/.test(script) && /function pintarContagens\(\)/.test(script)
    && /numeradorDoCompasso/.test(script));
  checar('…e o passo da grade distingue os compassos compostos',
    /function passoDaGrade\(\)/.test(script) && /d === 8 && n % 3 === 0/.test(script));

  /* AS POSIÇÕES DOS PÉS E BRAÇOS (02/11/2026). O bloco era «Posições dos pés», com cinco sinais;
   * a preparatória e as posições de braços estavam no alfabeto e NÃO chegavam a nenhuma tela —
   * `posicoesDeBracosDoMetodo` era exportada e ninguém a chamava. Estas asserções guardam a
   * unificação e o rótulo duplo que resolve a divergência francesa/RAD. */
  const grupos = ALFABETO.grupos || [];
  const blocoPosicoes = grupos.filter((g) => /Posi/.test(String(g.titulo || '')))[0] || { itens: {} };
  checar('o bloco de posições é UM só, e chama-se «Posições dos pés e braços»',
    /Posições dos pés e braços/.test(String(blocoPosicoes.titulo || '')), blocoPosicoes.titulo);
  checar('…e tem a preparatória, os cinco números, e o rótulo duplo da terceira',
    Boolean(blocoPosicoes.itens && blocoPosicoes.itens.prep)
      && ['1ª', '2ª', '3ª', '4ª', '5ª'].every((k) => blocoPosicoes.itens[k])
      && /quinta/.test(String((blocoPosicoes.itens['3ª'] || {}).nome || '')),
    Object.keys(blocoPosicoes.itens || {}));
  // A TABELA VIAJA NA ROTA, e é por isso que ela se procura no SERVIDOR e não no script: o
  // `posicoesDeBracos` entra na resposta do `GET /api/bastidores/verbete`, e o que a página faz
  // com ela é pintar a nota do método.
  const fonteBastidores = fs.readFileSync(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'), 'utf8');
  checar('…e a rota passa a servir as posições de braços por método',
    /posicoesDeBracos:/.test(fonteBastidores) && /function pintarNotaDoMetodo\(\)/.test(script));
  checar('…e o método é uma herança com sobreposição, não uma segunda declaração',
    /herda a «Metodologia de referência» do plano/.test(script));

  // OS SINAIS VÊM AGRUPADOS E COM NOME, e as CATEGORIAS não estão na lista deles. Era o defeito
  // que a pesquisadora viu: «pé, peso, plié, braço» aparecia duas vezes, porque o grupo
  // «Categorias» do alfabeto também tem `itens` e o código recolhia as chaves de todos.
  checar('a lista dos sinais leva o nome e o grupo, e não as categorias',
    /x\.grupo/.test(script) && /x\.sinal/.test(script) && /x\.nome/.test(script));
  // UMA TABELA, E NÃO DUAS. «Direções que cobre» e «Células» diziam a mesma coisa — e sem
  // células, as duas diziam «não há nada».
  checar('a decomposição é uma tabela só', !/id="vb-direcoes"/.test(html) && !/id="vb-celulas"/.test(html));

  // A FRASE VEM DO DICIONÁRIO. O ficheiro existe, é chave-valor por NOTAÇÃO (e não por nome de
  // exercício: o Plié tem duas coisas, desce e sobe), e a rota serve-o.
  const dicionario = require(path.join(RAIZ, 'motor', 'servidor', 'catalogo-seed.js')).DESCRICOES;
  checar('o dicionário do que acontece existe e tem entradas', Object.keys(dicionario).length >= 10,
    Object.keys(dicionario).length);
  checar('e é indexado pela notação, não pelo nome do exercício',
    Boolean(dicionario['[Pé: 1ª → +]']) && !dicionario['Plié'], Object.keys(dicionario).slice(0, 2));


  /* AS REGRAS DO PASSO 1, medidas no texto do script — e a regra mudou outra vez (02/11/2026).
   *
   * JÁ FOI: o «modo B» escondia o «modo A», bloqueava o `select` e o «+», e o `submit` do verbete
   * não passava enquanto ele estava aberto.
   * DEPOIS: o cadastro abria dentro do passo 1, com «Gravar exercício» e «Cancelar» próprios.
   * AGORA: não há cadastro nenhum — o passo 1 SÃO os campos do exercício, e quem o grava é o
   * «Seguir →», que já existia. Sem «+», sem segundo botão, sem segundo caminho. */
  checar('o «Seguir →» grava o exercício quando está no passo 1, e só então',
    /if \(PASSO === 1\) \{ criarExercicioDoPasso1/.test(script));
  checar('e o «+», o «Gravar exercício» e o «Cancelar» já não existem no script',
    !/vb-novo-exercicio/.test(script) && !/vb-criar-exercicio/.test(script)
    && !/vb-cancelar-exercicio/.test(script) && !/modoExercicio/.test(script));
  checar('e o Enter no nome cria o exercício, em vez de submeter o formulário',
    /ev\.key !== "Enter"/.test(script)
    && /criarExercicioDoPasso1\(function\(\)\{ irParaPasso\(2\); \}\)/.test(script));
  checar('e o exercício criado fica escolhido no campo do passo 2',
    /nomes\.value = d\.termo/.test(script)
    && /já está na lista do passo 2/.test(script));
  /* A GRAVAÇÃO RECUSA UM VERBETE QUE NÃO FECHA A MÚSICA (02/11/2026) — a regra vive nos dois
   * lados, e é de propósito: a tela diz ONDE se corrige, e o servidor garante que ninguém a
   * contorna com uma página antiga em cache. */
  checar('a tela compara a soma das células com os tempos da música, antes de enviar',
    /soma !== temposDaMusica/.test(script) && /passoPorRotulo\("a música"\)/.test(script));
  checar('…e o servidor também, com a música como chave',
    /validarVerbete\(verbete, dados, lido\.vocabulario, chaveMusica\)/.test(
      fs.readFileSync(path.join(RAIZ, 'motor', 'servidor', 'verbete.js'), 'utf8')));
}


/**
 * G. A GUARDA DE PROVENIÊNCIA DO VERBETE (02/11/2026).
 *
 * O QUE ELA PEDIU, e é a regra que o projeto já aplica ao termo, à turma, ao professor e à
 * curadoria: «antes de executar DELETE ou UPDATE em um verbete, verifique se ele possui vínculos
 * com Turmas, Curadorias, Planos de Ensino ou Planos de Observação. Se houver vínculo, bloqueie a
 * exclusão e force a criação de um ajuste/nova versão para preservar o histórico».
 *
 * O MECANISMO NÃO É NOVO — `usosDosPlanos` + `termoVinculadoA` são as duas funções que decidem se
 * um TERMO pode ser apagado, e o verbete é a NOTAÇÃO do mesmo termo. O que esta secção prova é que
 * a rota as usa, e que a recusa diz o caminho.
 *
 * O ÍNDICE É O QUE MANDA, e ele é lido uma vez: os resumos dos planos já trazem o repertório
 * (20/10/2026). Aqui substitui-se o `fetch` que vai ao GitHub por um índice de mentira — a
 * bancada não toca na rede, e a regra mede-se na mesma.
 */
async function aGuardaDeProveniencia() {
  console.log('\nG. A GUARDA DE PROVENIÊNCIA — o verbete que já compõe um plano não se apaga');

  const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  const env = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'senha-da-direcao', GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
  };

  /* O ÍNDICE NÃO SE ESCREVE À MÃO (02/11/2026) — ele é feito pelo ENVELOPE, com o `resumoDoEnvelope`
   * e a `VERSAO_DO_RESUMO` do próprio módulo. Um índice escrito à mão carimba a versão de hoje em
   * resumos de ontem: o `decodificarIndice` detecta a forma que falta, descarta o resumo e volta a
   * enumerar — e a prova mediria a enumeração vazia em vez da guarda. É a mesma família do `devant`
   * do fixture: um fixture a afirmar a forma de um dado que evolui. */
  const porta = require(path.join(RAIZ, 'motor', 'nucleo', 'porta.js'));
  const envelopeDoPlano = {
    id: 'plano-2026-01-abc',
    contexto: { escola: 'batata', professor: 'perna-boa', ciclo: '01' },
    gerado_em: '2026-01-01',
    respostas: {
      objetivo: { valor: 'a aula do 8A' },
      'contexto-turma': { valor: '8A' },
      'contexto-professor': { valor: 'Perna Boa' },
      repertorio: { valor: ['Battement tendu', 'Plié'] },
    },
  };
  const nomeDoPlano = 'plano-2026-01-abc.json';
  const indice = {
    versao: porta.VERSAO_DO_RESUMO,
    nomes: [nomeDoPlano],
    resumos: { [nomeDoPlano]: porta.resumoDoEnvelope(envelopeDoPlano, nomeDoPlano) },
  };
  checar('o fixture do índice tem a forma que o leitor aceita (senão mede-se a enumeração vazia)',
    porta.resumoDoEnvelope(envelopeDoPlano, nomeDoPlano).repertorio.indexOf('Battement tendu') !== -1,
    porta.resumoDoEnvelope(envelopeDoPlano, nomeDoPlano));
  const respostaDoIndice = {
    sha: 'sha-indice',
    content: Buffer.from(JSON.stringify(indice), 'utf8').toString('base64'),
  };
  const original = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url, opcoes) => {
    const u = String(url);
    chamadas.push(u);
    if (u.indexOf('api.github.com') === -1) throw new TypeError('a rota não devia pedir «' + u + '»');
    // UMA LEITURA DO ÍNDICE DO ACERVO — e não uma por plano. É a asserção de arquitetura.
    if (u.indexOf('.indice.json') !== -1) {
      return new Response(JSON.stringify(respostaDoIndice), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    }
    // A ÁRVORE, para a enumeração — vazia: o índice já diz tudo.
    if (u.indexOf('/git/trees/') !== -1) {
      return new Response(JSON.stringify({ tree: [] }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };

  let preso;
  let corpoPreso;
  try {
    preso = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/verbete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'senha-da-direcao', nome: 'Battement tendu', modalidade: 'bale-classico' }),
    }), env);
    corpoPreso = await preso.json();
  } finally {
    globalThis.fetch = original;
  }

  checar('um verbete que compõe um plano de ensino NÃO é apagado — 409, e não 200',
    preso.status === 409, preso.status);
  checar('a recusa diz QUAL é a consequência: a aula publicada ficaria em lacuna',
    /plano de ensino/.test(corpoPreso.erro || '') && /lacuna/.test(corpoPreso.erro || ''), corpoPreso);
  checar('…e diz o caminho que preserva a proveniência: descontinuar',
    corpoPreso.vinculado === true && /descontinuar/i.test(corpoPreso.erro || '')
      && corpoPreso.como === 'PUT com { acao: "descontinuar" }', corpoPreso);
  checar('o índice do acervo é lido UMA vez — não um envelope por plano',
    chamadas.filter((u) => u.indexOf('.indice.json') !== -1).length === 1,
    chamadas.length);

  // E O CONTRÁRIO: um exercício que NENHUM plano declara passa. Sem esta metade, a guarda poderia
  // estar a recusar tudo, e a prova acima passaria à mesma.
  const original2 = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.indexOf('api.github.com') === -1) throw new TypeError('a rota não devia pedir «' + u + '»');
    if (u.indexOf('.indice.json') !== -1) {
      return new Response(JSON.stringify(respostaDoIndice), { status: 200 });
    }
    if (u.indexOf('/git/trees/') !== -1) return new Response(JSON.stringify({ tree: [] }), { status: 200 });
    // O alfabeto, para o `apagarVerbete` poder ler e gravar.
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
    if (u.indexOf('/contents/') !== -1) {
      return new Response(JSON.stringify({ commit: { sha: 'novo' } }), { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
  let livre;
  let corpoLivre;
  try {
    livre = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/verbete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'senha-da-direcao', nome: 'Rond de jambe', modalidade: 'bale-classico' }),
    }), env);
    corpoLivre = await livre.json();
  } finally {
    globalThis.fetch = original2;
  }
  checar('o verbete do CATÁLOGO não se apaga pela tela de uma escola (409)',
    livre.status === 409 && /catálogo/.test(corpoLivre.erro || ''), corpoLivre);

  /* A CURADORIA É A OUTRA PORTA (02/11/2026) — §3.A.2 do pedido dela. O repertório da curadoria
   * deixou de se pedir em 19/10/2026, mas o que está gravado FICA (P-03/P-04), e uma referência
   * antiga é uma referência a sério: é a curadoria que autoriza o professor a dar aquela turma. */
  const envComCuradoria = Object.assign({}, env, {
    PADD_KV: {
      async get(chave) {
        if (String(chave).indexOf('/curadorias') !== -1) {
          return JSON.stringify([{
            id: 'perna-boa-bale-classico', professor: 'perna-boa', modalidade: 'bale-classico',
            tradicao: 'francesa', turmas: ['8A'], alunas: ['Ana'],
            repertorio: ['Battement tendu'],
          }]);
        }
        return null;
      },
      async put() {}, async delete() {},
      async list() { return { keys: [], list_complete: true }; },
    },
  });
  const original3 = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.indexOf('api.github.com') === -1) throw new TypeError('a rota não devia pedir «' + u + '»');
    /* SEM PLANOS — mas com índice LEGÍVEL. Um índice a 404 devolve `null`, e `null` conta como
     * VINCULADO («na dúvida não se apaga»): a recusa viria pela porta do plano, e a curadoria nunca
     * seria consultada. O que se quer medir é a SEGUNDA porta, e para isso a primeira tem de estar
     * aberta e vazia. */
    if (u.indexOf('.indice.json') !== -1) {
      const vazio = { versao: porta.VERSAO_DO_RESUMO, nomes: [], resumos: {} };
      return new Response(JSON.stringify({
        sha: 'sha-indice', content: Buffer.from(JSON.stringify(vazio), 'utf8').toString('base64'),
      }), { status: 200 });
    }
    if (u.indexOf('/git/trees/') !== -1) return new Response(JSON.stringify({ tree: [] }), { status: 200 });
    return new Response('{}', { status: 404 });
  };
  let porCuradoria;
  let corpoCuradoria;
  try {
    porCuradoria = await bastidores.fetch(new Request('https://e.workers.dev/api/bastidores/verbete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaDirecao: 'senha-da-direcao', nome: 'Battement tendu', modalidade: 'bale-classico' }),
    }), envComCuradoria);
    corpoCuradoria = await porCuradoria.json();
  } finally {
    globalThis.fetch = original3;
  }
  checar('um exercício no repertório de uma CURADORIA também não se apaga — 409',
    porCuradoria.status === 409 && corpoCuradoria.motivo === 'curadoria', corpoCuradoria);
  checar('…e a recusa nomeia o professor e o caminho (tirar do repertório)',
    /curadoria de perna-boa/.test(corpoCuradoria.erro || '')
      && /repert[óo]rio/.test(corpoCuradoria.como || ''), corpoCuradoria);
}


/**
 * H. A TRADIÇÃO DE REFERÊNCIA: UMA LISTA, UM RÓTULO, E A CUBANA (02/11/2026).
 *
 * A REGRA MUDOU DUAS VEZES NO MESMO DIA, e a segunda é a que vale. Primeiro ela pediu os valores
 * em CAIXA ALTA; à tarde corrigiu: «Padronizar todas as opções para Title Case, alinhando com a
 * grafia de Escola livre e Cecchetti, mantendo apenas siglas em caixa alta» — `RAD` fica,
 * `Francesa`, `Vaganova`, `Cubana` e `Compartilhada` levam inicial maiúscula.
 *
 * O QUE NÃO MUDOU, e é o que esta secção guarda:
 *
 *   1. `tradicoes.json` continua a ser a FONTE — as tradições E os rótulos (`rotulos`);
 *   2. os quatro selectores da página saem dela, sem lista escrita à mão ao lado;
 *   3. o dado NÃO é migrado: `vocabulario.json` grava `francesa`, e
 *      `diferencasDeNomenclatura` tem uma coluna por chave. Subir o rótulo ao dado deixaria
 *      essas colunas sem ninguém, em silêncio.
 *
 * E O DEFEITO QUE ELA VIU — «a opção Compartilhada duplicada, no meio e no final da lista» — era
 * o `sugerirMetodo`, que acrescentava uma opção nova sempre que o valor sugerido não era o que já
 * estava escolhido, mesmo quando já existia uma com esse valor. Mede-se por CONTAGEM: nenhum
 * `value` aparece duas vezes.
 */
async function aTradicaoDeReferencia() {
  console.log('\nH. A TRADIÇÃO — uma lista, um rótulo, e a CUBANA');

  const catalogo = require(path.join(RAIZ, 'motor', 'servidor', 'catalogo-seed.js'));
  const doDisco = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', 'tradicoes.json'), 'utf8'));

  checar('a lista servida é a do ficheiro — uma fonte, e não uma cópia',
    JSON.stringify(catalogo.TRADICOES) === JSON.stringify(doDisco.tradicoes),
    { servida: catalogo.TRADICOES, ficheiro: doDisco.tradicoes });
  checar('a CUBANA entrou', doDisco.tradicoes.indexOf('cubana') !== -1, doDisco.tradicoes);
  checar('e as cinco estão lá, na ordem que ela escreveu — «compartilhada» no fim',
    JSON.stringify(doDisco.tradicoes)
      === JSON.stringify(['RAD', 'francesa', 'Vaganova', 'cubana', 'compartilhada']),
    doDisco.tradicoes);

  checar('o rótulo é o do ficheiro — Title Case, e a sigla em caixa alta',
    catalogo.rotuloDaTradicao('francesa') === 'Francesa'
      && catalogo.rotuloDaTradicao('Vaganova') === 'Vaganova'
      && catalogo.rotuloDaTradicao('cubana') === 'Cubana'
      && catalogo.rotuloDaTradicao('compartilhada') === 'Compartilhada'
      && catalogo.rotuloDaTradicao('RAD') === 'RAD',
    ['francesa', 'Vaganova', 'cubana', 'compartilhada', 'RAD']
      .map((t) => t + '→' + catalogo.rotuloDaTradicao(t)));
  // O MAPA É DO DADO, e não uma regra de maiúsculas no código: é ele que sabe que `RAD` é sigla
  // (e não `Rad`) e que `Vaganova` é nome próprio (e não `Vaganova` em caixa alta).
  checar('e o mapa de rótulos está no ficheiro, uma entrada por tradição',
    doDisco.rotulos && doDisco.tradicoes.every((t) => typeof doDisco.rotulos[t] === 'string'),
    doDisco.rotulos);
  checar('sem tradição, o rótulo é vazio e não «UNDEFINED»',
    catalogo.rotuloDaTradicao(null) === '' && catalogo.rotuloDaTradicao(undefined) === ''
      && catalogo.rotuloDaTradicao('  ') === '');

  // ---- a página servida ------------------------------------------------------------
  const bastidores = require(path.join(RAIZ, 'motor', 'servidor', 'bastidores.js'));
  const env = {
    ESCOLA_SLUG: 'batata', ESCOLA_HABILITADA: 'sim',
    SENHA_ADMIN: 'senha-da-direcao', GITHUB_TOKEN: 'token-de-prova',
    PADD_KV: { async get() { return null; }, async put() {}, async delete() {}, async list() { return { keys: [], list_complete: true }; } },
  };
  const html = await (await bastidores.fetch(
    new Request('https://e.workers.dev/bastidores/producao'), env)).text();

  /** As opções de um `<select>` por id, como `{valor, texto}`. */
  const opcoesDe = (id) => {
    const bloco = (html.match(new RegExp('<select id="' + id + '">([\\s\\S]*?)</select>')) || [])[1] || '';
    return [...bloco.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)]
      .map((m) => ({ valor: m[1], texto: m[2] }));
  };

  const doVerbete = opcoesDe('vntradicao');
  checar('o selector da tradição do verbete mostra as cinco, na ordem dela',
    doVerbete.filter((o) => o.valor).map((o) => o.texto).join(',')
      === 'RAD,Francesa,Vaganova,Cubana,Compartilhada',
    doVerbete);
  checar('…e o valor de cada uma continua a ser a CHAVE que o dado grava',
    doVerbete.filter((o) => o.valor).map((o) => o.valor).join(',')
      === 'RAD,francesa,Vaganova,cubana,compartilhada',
    doVerbete);

  // A MESMA COISA NA CURADORIA E NO PROGRAMA DA TURMA — a «reverberação» que ela pediu. As duas
  // listas excluem «compartilhada» (é o que sobra quando não há tradição declarada, não uma
  // tradição que a escola adota), e isso é uma regra antiga, não um esquecimento.
  const daCuradoria = opcoesDe('cutradicao');
  checar('a curadoria mostra as mesmas, sem «compartilhada» — e agora com Cubana',
    daCuradoria.map((o) => o.texto).join(',') === 'RAD,Francesa,Vaganova,Cubana', daCuradoria);

  const doMetodo = opcoesDe('vbmetodo');
  checar('o «Método deste exercício» lê a MESMA lista, e o valor é a chave',
    doMetodo.filter((o) => o.valor).map((o) => o.valor).join(',')
      === 'RAD,francesa,Vaganova,cubana,compartilhada,Cecchetti,Escola livre',
    doMetodo);
  /* O DEFEITO QUE ELA VIU — «a opção Compartilhada duplicada, no meio e no final da lista».
   *
   * A LISTA SERVIDA já não tem a repetição (a fonte é única e deduplicada). E o `sugerirMetodo`,
   * que a acrescentava ao escolher um exercício de tradição `compartilhada` com o campo vazio,
   * passou a perguntar se a opção JÁ EXISTE antes de criar outra. As duas metades medem-se: aqui
   * a contagem na marcação; mais abaixo, no script, o `sugerirMetodo` corrido duas vezes. */
  const valoresDoMetodo = doMetodo.map((o) => o.valor).filter(Boolean);
  checar('…e nenhuma opção aparece duas vezes — a «Compartilhada» duplicada saiu',
    new Set(valoresDoMetodo).size === valoresDoMetodo.length, valoresDoMetodo);
  checar('o texto do método é o rótulo: «Francesa», «Cubana», «Compartilhada» — e RAD em sigla',
    doMetodo.filter((o) => o.valor).map((o) => o.texto).join(',')
      === 'RAD,Francesa,Vaganova,Cubana,Compartilhada,Cecchetti,Escola livre',
    doMetodo);
  /* O DEFEITO QUE ESTAVA AQUI, e que se mede por ausência: a opção dizia `Francesa` (com maiúscula
   * e sem ser a chave), e `pintarNotaDoMetodo` procura `linha["Francesa"]` na tabela de diferenças,
   * cuja coluna é `francesa`. O resultado era a nota dizer SEMPRE «O alfabeto não declara esta
   * posição em Francesa» — a negar um dado que existe. Com a chave no valor, a coluna é encontrada. */
  checar('e «Francesa» com maiúscula deixou de existir — era ela que fazia a nota negar o dado',
    !/<option value="Francesa"/.test(html), /<option value="Francesa"/.test(html));

  // OS DOIS RÓTULOS SÃO DO MESMO SÍTIO: nenhuma opção de tradição tem texto diferente da chave
  // em caixa alta. É esta a asserção que impede alguém de escrever a lista à mão outra vez.
  const todasAsOpcoesDeTradicao = ['vntradicao', 'cutradicao', 'vbmetodo']
    .flatMap((id) => opcoesDe(id))
    .filter((o) => doDisco.tradicoes.indexOf(o.valor) !== -1);
  checar('em todos os selectores, o texto de uma tradição é o rótulo do ficheiro',
    todasAsOpcoesDeTradicao.length >= 14
      && todasAsOpcoesDeTradicao.every((o) => o.texto === catalogo.rotuloDaTradicao(o.valor)),
    todasAsOpcoesDeTradicao.map((o) => o.valor + '→' + o.texto));

  // O DADO NÃO FOI MIGRADO. Se alguém «resolver» a caixa alta subindo-a ao vocabulário, esta
  // asserção cai — e é para cair: 4 termos gravam `francesa`, e a tabela de diferenças depende
  // disso.
  const vocabulario = JSON.parse(fs.readFileSync(
    path.join(RAIZ, 'biblioteca', 'modalidades', 'bale-classico', 'vocabulario.json'), 'utf8'));
  const tradicoesGravadas = [...new Set(vocabulario.map((t) => t.tradicao).filter(Boolean))];
  checar('o vocabulário continua a gravar as CHAVES, não os rótulos',
    tradicoesGravadas.every((t) => t === t.toLowerCase() || t === 'RAD' || t === 'Vaganova'),
    tradicoesGravadas);
  checar('e as colunas da tabela de diferenças continuam a casar com uma tradição da lista',
    Object.keys(doDisco.diferencasDeNomenclatura[0])
      .filter((k) => k !== 'conceito')
      .every((k) => doDisco.tradicoes.indexOf(k) !== -1),
    Object.keys(doDisco.diferencasDeNomenclatura[0]));
}


/**
 * I. O VERSIONAMENTO DO VERBETE (02/11/2026) — «ajuste», e não reescrita.
 *
 * O QUE ELA ESCOLHEU, entre as três opções: **B — versões datadas**. Um verbete que já compõe um
 * plano não se reescreve por baixo do documento: a gravação passa a ser um ajuste, o estado
 * anterior fica no `versoes` do próprio registo com a data em que deixou de valer (`ate`), e a
 * composição escolhe o estado que valia NA DATA DO ENVELOPE.
 *
 * O QUE ESTA SECÇÃO MEDE, e por esta ordem — porque a segunda metade só vale se a primeira for
 * verdade:
 *   1. um verbete sem histórico lê-se exactamente como antes (nada de migração);
 *   2. o ajuste guarda o estado anterior e NÃO perde o corrente;
 *   3. a composição de uma data anterior dá o texto antigo, e a de hoje dá o novo;
 *   4. a versão vai no resultado, para o documento a poder declarar;
 *   5. o `versoes` que o PEDIDO traga é ignorado — o histórico não se escreve de fora.
 */
async function oVersionamento() {
  console.log('\nI. O AJUSTE — um verbete em uso não se reescreve por baixo do documento');

  const notacao = require(path.join(RAIZ, 'motor', 'nucleo', 'notacao.js'));
  const verbete = require(path.join(RAIZ, 'motor', 'servidor', 'verbete.js'));
  const { ALFABETOS, MODALIDADE_PADRAO } = notacao;
  const alfabetoReal = ALFABETOS[MODALIDADE_PADRAO];
  /* O ALFABETO DO MÓDULO PODE ESTAR VAZIO — ela apagou os 11 verbetes em 02/11/2026. A prova do
   * versionamento não pode depender de haver conteúdo editorial: planta o exercício de que
   * precisa e tira-o no fim. A §J faz o mesmo, e é a que o exercita fim a fim. */
  // A PLANTA É POR MÚSICA, NÃO POR EXERCÍCIO (03/11/2026). Desde que o alfabeto tem dono, o
  // `Battement tendu` existe no catálogo com a música da escola (`8|2/4@breu`) e o exercício
  // deixou de faltar — mas a música do catálogo (`8|4/4`), que é a que esta secção compõe,
  // continuou a faltar. Plantar «o exercício» dava por coberto o que não estava.
  const plantaDeLeitura = () => {
    alfabetoReal.verbetes = alfabetoReal.verbetes || {};
    const verbete = alfabetoReal.verbetes['Battement tendu'] || {};
    verbete['8|4/4'] = verbete['8|4/4'] || { cobre: 4, posicao: null, celulas: celulasDeQuatro('planta') };
    alfabetoReal.verbetes['Battement tendu'] = verbete;
  };
  const tinhaBattement = Boolean(
    alfabetoReal.verbetes && alfabetoReal.verbetes['Battement tendu']
      && alfabetoReal.verbetes['Battement tendu']['8|4/4']);
  plantaDeLeitura();

  // ---- 1. SEM HISTÓRICO, LÊ-SE COMO SEMPRE -----------------------------------
  const registo = { cobre: 8, celulas: { devant: [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª'], descricao: 'x' }] } };
  checar('um verbete sem `versoes` devolve o estado corrente em qualquer data',
    notacao.estadoDoVerbete(registo, '2020-01-01').estado === registo
      && notacao.estadoDoVerbete(registo, '').estado === registo
      && notacao.estadoDoVerbete(registo, '2030-01-01').estado === registo);

  // ---- 2. O AJUSTE GUARDA O ANTERIOR E MANTÉM O CORRENTE --------------------
  const antes = { cobre: 8, posicao: null, celulas: { devant: [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª'], descricao: 'antiga' }] } };
  const depois = { cobre: 8, posicao: null, celulas: { devant: [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª', '↓'], descricao: 'nova' }] } };
  const registoUsado = { cobre: 8, celulas: antes.celulas };
  const li = (data) => notacao.estadoDoVerbete(
    Object.assign({}, depois, { versoes: [{ ate: '2026-11-02', cobre: 8, celulas: antes.celulas, motivo: 'correção' }] }),
    data);

  checar('antes do ajuste, a data antiga lê o estado ANTIGO',
    li('2026-10-01').estado.celulas.devant[0].descricao === 'antiga', li('2026-10-01').estado.celulas);
  checar('no dia do ajuste — e depois dele — lê o estado NOVO',
    li('2026-11-02').estado.celulas.devant[0].descricao === 'nova'
      && li('2026-12-25').estado.celulas.devant[0].descricao === 'nova',
    { noDia: li('2026-11-02').estado.celulas, depois: li('2026-12-25').estado.celulas });
  checar('a data anterior a TODAS as versões lê a mais antiga — o estado original',
    li('2019-01-01').estado.celulas.devant[0].descricao === 'antiga');
  checar('e o `versao` do resultado diz QUAL se leu, para o documento o poder declarar',
    li('2026-10-01').versao === '2026-11-02' && li('2026-12-25').versao === null,
    { antigo: li('2026-10-01').versao, corrente: li('2026-12-25').versao });

  // DUAS VERSÕES, EM ORDEM TROCADA NO FICHEIRO: a escolha não pode depender da ordem gravada.
  const duas = Object.assign({}, depois, {
    versoes: [
      { ate: '2026-12-01', cobre: 8, celulas: { devant: [{ contagem: '1–2', categoria: 'Pé', sinais: ['1ª'], descricao: 'segunda' }] } },
      { ate: '2026-11-02', cobre: 8, celulas: antes.celulas },
    ],
  });
  checar('com duas versões gravadas fora de ordem, cada data lê a sua',
    notacao.estadoDoVerbete(duas, '2026-10-01').estado.celulas.devant[0].descricao === 'antiga'
      && notacao.estadoDoVerbete(duas, '2026-11-15').estado.celulas.devant[0].descricao === 'segunda'
      && notacao.estadoDoVerbete(duas, '2027-01-01').estado.celulas.devant[0].descricao === 'nova',
    ['2026-10-01', '2026-11-15', '2027-01-01']
      .map((d) => d + '→' + notacao.estadoDoVerbete(duas, d).estado.celulas.devant[0].descricao));

  // ---- 3. A COMPOSIÇÃO DO DOCUMENTO USA A DATA ------------------------------
  // O `Battement tendu` do alfabeto real serve: compõe-se a mesma linha em duas datas.
  const linha = { 'Bloco': 'Barra', 'Conteúdo do nível': 'Battement tendu', 'Tempos': '8', 'Compasso': '4/4' };
  const composicaoHoje = notacao.compor(linha, alfabetoReal);
  checar('a composição sem data continua a compor o estado corrente',
    composicaoHoje && composicaoHoje.estado !== 'lacuna', composicaoHoje && composicaoHoje.estado);
  // A PLANTA SAI NO FIM DESTA SECÇÃO, e só se ela a pôs.
  const desplantarLeitura = () => {
    if (!tinhaBattement && alfabetoReal.verbetes) delete alfabetoReal.verbetes['Battement tendu'];
  };
  // A prova de que a data CHEGA ao `verbetePara`: monta-se um alfabeto com histórico e mede-se.
  const alfabetoComHistorico = JSON.parse(JSON.stringify(alfabetoReal));
  const registoReal = alfabetoComHistorico.verbetes['Battement tendu']['8|4/4'];
  /* O ESTADO ANTIGO TEM DE TER A FORMA DO REAL — mesma cobertura, mesmas pistas, mesmos sinais.
   * Uma célula inventada de dois tempos com `cobre: 8` não é um verbete: é um verbete inválido, e
   * o compositor recusa-o com razão («declara cobrir 8 tempos, mas a maior pista tem 2»). O que se
   * quer medir é a ESCOLHA DA VERSÃO, e o resto tem de estar certo para ela ser a única variável. */
  // A PISTA NÃO SE CHAMA SEMPRE `devant` (03/11/2026). Esta prova lia `celulas.devant[0]` e
  // funcionava porque, sem verbete real, ela plantava um com essa pista. Desde que a Produção
  // gravou o `Battement tendu` no alfabeto, o verbete real existe — e a pista dele é
  // `a-la-seconde`. Fixar o nome da pista fazia a prova depender de um dado que ela não
  // controla; o que ela quer medir é a **escolha da versão**, e isso vale em qualquer pista.
  // Por isso: a primeira célula de CADA pista antiga muda, e a asserção procura a antiga no
  // primeiro segmento — com uma pista só, é a mesma coisa; com duas, continua a ser verdade.
  const celulasAntigas = JSON.parse(JSON.stringify(registoReal.celulas));
  for (const pista of Object.keys(celulasAntigas)) {
    if (Array.isArray(celulasAntigas[pista]) && celulasAntigas[pista][0]) {
      celulasAntigas[pista][0].descricao = 'a antiga';
    }
  }
  registoReal.versoes = [{
    ate: '2026-11-02', cobre: registoReal.cobre, posicao: registoReal.posicao, celulas: celulasAntigas,
  }];
  const antiga = notacao.compor(linha, alfabetoComHistorico, '2026-01-01');
  const nova = notacao.compor(linha, alfabetoComHistorico, '2026-12-01');
  checar('composta com a data de antes do ajuste, a linha sai com a descrição ANTIGA',
    Boolean(antiga) && antiga.estado !== 'lacuna'
      && /a antiga/.test(String((antiga.segmentos[0] || {}).descricao || '')),
    { estado: antiga && antiga.estado, detalhe: antiga && antiga.detalhe,
      seg: antiga && antiga.segmentos && antiga.segmentos.length });
  checar('…e composta com a data de depois, sai com a de hoje — o «lê-se» atual',
    Boolean(nova) && nova.estado !== 'lacuna' && !/a antiga/.test(JSON.stringify(nova.segmentos)),
    { estado: nova && nova.estado, seg: nova && nova.segmentos && nova.segmentos.length });
  checar('a versão usada vai no resultado da composição',
    antiga.versao === '2026-11-02' && nova.versao === null,
    { antiga: antiga.versao, nova: nova.versao });

  desplantarLeitura();

  // ---- 4. O MÓDULO NÃO ACEITA O HISTÓRICO DO PEDIDO -------------------------
  const repo = githubFalso({
    [verbete.caminhoDoAlfabeto('bale-classico')]: {
      sha: 'sha-alfa', conteudo: JSON.stringify(ALFABETO_DA_ESCRITA, null, 2) + '\n',
    },
    [verbete.caminhoDoVocabulario('bale-classico')]: {
      sha: 'sha-voc', conteudo: JSON.stringify(VOCABULARIO, null, 2) + '\n',
    },
  });
  const base = { f: repo.f, token: 'token-de-prova', dono: 'dono', repo: 'repo', ref: 'main' };

  const semVinculo = await verbete.gravarVerbete(Object.assign({}, base, {
    modalidade: 'bale-classico',
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'criar',
    vinculado: false,
  }));
  const gravadoSem = ((JSON.parse(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).conteudo)
    .verbetes['Battement fondu']) || {})['8|4/4'] || {};
  checar('sem vínculo, a gravação NÃO cria histórico — não há passado a guardar',
    semVinculo.ok && !gravadoSem.versoes && semVinculo.ajustou === null, {
      erro: semVinculo.erro, versoes: gravadoSem.versoes, ajustou: semVinculo.ajustou,
    });

  const comVinculo = await verbete.gravarVerbete(Object.assign({}, base, {
    modalidade: 'bale-classico',
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'atualizar',
    vinculado: true, vigenteDe: '2026-11-02', motivo: 'correção de braço',
  }));
  const gravadoCom = JSON.parse(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).conteudo)
    .verbetes['Battement fondu']['8|4/4'];
  checar('com vínculo, a gravação vira AJUSTE: o estado anterior vai para `versoes`',
    comVinculo.ok && comVinculo.ajustou === '2026-11-02'
      && Array.isArray(gravadoCom.versoes) && gravadoCom.versoes.length === 1,
    { ajustou: comVinculo.ajustou, versoes: gravadoCom.versoes && gravadoCom.versoes.length });
  checar('…com a data em que deixou de valer e o motivo',
    gravadoCom.versoes[0].ate === '2026-11-02' && gravadoCom.versoes[0].motivo === 'correção de braço',
    gravadoCom.versoes[0]);
  checar('…e o estado corrente continua no topo, inteiro — nada se perdeu',
    Boolean(gravadoCom.celulas) && Object.keys(gravadoCom.celulas).length > 0
      && Boolean(gravadoCom.versoes[0].celulas) && Object.keys(gravadoCom.versoes[0].celulas).length > 0,
    { corrente: Object.keys(gravadoCom.celulas || {}), antigo: Object.keys(gravadoCom.versoes[0].celulas || {}) });
  checar('a mensagem do commit diz que é um ajuste, e até quando valia a versão anterior',
    /ajuste: a versão anterior \(até 2026-11-02\)/.test(
      String(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).mensagem || '')),
    repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).mensagem);

  // UM SEGUNDO AJUSTE ACUMULA — e o histórico não se sobrepõe a si mesmo.
  const segundo = await verbete.gravarVerbete(Object.assign({}, base, {
    modalidade: 'bale-classico',
    nome: 'Battement fondu', musica: '8|4/4', verbete: verbeteDeOitoTempos(), acao: 'atualizar',
    vinculado: true, vigenteDe: '2026-11-20',
  }));
  const gravadoDois = JSON.parse(repo.arquivos.get(verbete.caminhoDoAlfabeto('bale-classico')).conteudo)
    .verbetes['Battement fondu']['8|4/4'];
  checar('um segundo ajuste acrescenta uma versão em vez de substituir o histórico',
    segundo.ok && gravadoDois.versoes.length === 2
      && gravadoDois.versoes[0].ate === '2026-11-02' && gravadoDois.versoes[1].ate === '2026-11-20',
    gravadoDois.versoes.map((v) => v.ate));
  checar('…e nenhuma versão carrega `versoes` dentro de si — o histórico tem um nível só',
    gravadoDois.versoes.every((v) => !v.versoes),
    gravadoDois.versoes.map((v) => Object.keys(v)));
}


/**
 * J. O DOCUMENTO ANTIGO NÃO MUDA QUANDO O VERBETE É AJUSTADO (02/11/2026) — fim a fim.
 *
 * A ESCOLHA DELA, entre as três: **versões datadas**. Um verbete que já compõe um plano não se
 * reescreve por baixo do documento: o estado anterior fica no histórico com a data em que deixou
 * de valer, e a composição escolhe o estado que valia NA DATA DO ENVELOPE.
 *
 * O QUE ESTA SECÇÃO PROVA, e é a única coisa que interessa: **o mesmo envelope, derivado com duas
 * datas, sai com dois textos**. Se isto não for verdade, o versionamento é uma palavra no
 * `REGISTRO` e nada mais. A §I mede as peças; esta mede o caminho inteiro, do envelope ao
 * Markdown.
 *
 * O ALFABETO É O DE VERDADE, mutado e RESTAURADO no fim: um fixture paralelo mediria outro
 * compositor, e a mutação esquecida é a pior espécie de defeito — silenciosa e noutra prova.
 */
async function oDocumentoAntigo() {
  console.log('\nJ. O MESMO ENVELOPE, DUAS DATAS — dois textos');

  const notacao = require(path.join(RAIZ, 'motor', 'nucleo', 'notacao.js'));
  const { derivarAula01 } = require(path.join(RAIZ, 'motor', 'nucleo', 'derivar-ciclo.js'));
  const alfabeto = notacao.ALFABETOS['bale-classico'];
  /* O MESMO CUIDADO DA §I: o alfabeto do módulo pode não ter verbete nenhum — ela apagou os 11
   * em 02/11/2026. A prova planta o que precisa e restaura o que estava, sem depender de haver
   * conteúdo editorial. */
  const tinha = Boolean(alfabeto.verbetes && alfabeto.verbetes['Battement tendu']);
  const planta = { '8|4/4': { cobre: 4, posicao: null, celulas: celulasDeQuatro('planta') } };
  if (!tinha) {
    alfabeto.verbetes = alfabeto.verbetes || {};
    alfabeto.verbetes['Battement tendu'] = JSON.parse(JSON.stringify(planta));
  }
  const registo = alfabeto.verbetes['Battement tendu']['8|4/4'];
  const original = JSON.parse(JSON.stringify(registo));

  /* O QUE MUDA É A NOTAÇÃO, e não a prosa: o documento publica o `[Pé: …]` de cada trecho e não a
   * descrição dele. Uma versão antiga que só mudasse o texto da descrição sairia igual — e a prova
   * passaria a medir a minha expectativa em vez do comportamento. A última célula passa a fechar em
   * «2ª», que é um sinal que existe e que nenhum documento de hoje tem. */
  const celulasAntigas = JSON.parse(JSON.stringify(registo.celulas));
  // A PISTA TAMBÉM AQUI NÃO SE CHAMA SEMPRE `devant` (03/11/2026) — o verbete real que a Produção
  // gravou tem `a-la-seconde`, e fixar o nome da pista fazia a prova depender do dado que ela
  // deveria só usar. A última célula de CADA pista passa a fechar em «2ª»: com uma pista é o mesmo
  // que antes; com duas, a asserção do documento continua a valer.
  for (const pista of Object.keys(celulasAntigas)) {
    const celulas = celulasAntigas[pista];
    if (Array.isArray(celulas) && celulas.length) celulas[celulas.length - 1].sinais = ['×', '●', '2ª'];
  }
  registo.versoes = [{
    ate: '2026-11-02', cobre: registo.cobre, posicao: registo.posicao, celulas: celulasAntigas,
    motivo: 'correção da descrição',
  }];

  const envelope = (data) => ({
    id: 'plano-de-prova',
    gerado_em: data,
    contexto: { ciclo: '01', escola: 'batata', professor: 'perna-boa' },
    respostas: {
      'contexto-notacao': { valor: 'benesh' },
      'aula-1-sequencia': {
        valor: [{ Bloco: 'Barra', 'Conteúdo do nível': 'Battement tendu', Tempos: 8, Compasso: '4/4' }],
      },
    },
  });

  let antigo = '';
  let actual = '';
  try {
    antigo = String(derivarAula01({ plano: envelope('2026-10-01'), contexto: { ciclo: '01' } }));
    actual = String(derivarAula01({ plano: envelope('2026-12-01'), contexto: { ciclo: '01' } }));
  } finally {
    delete registo.versoes;
    Object.assign(registo, JSON.parse(JSON.stringify(original)));
    if (!tinha) delete alfabeto.verbetes['Battement tendu'];
  }

  checar('o documento datado de ANTES do ajuste sai com a notação ANTIGA',
    antigo.indexOf('× ● 2ª') !== -1,
    antigo.split('\n').filter((l) => /Battement tendu/.test(l)).slice(0, 1).join(''));
  checar('e o de DEPOIS sai com a de hoje — o ajuste não reescreve o passado',
    actual.indexOf('× ● 2ª') === -1
      && actual.split('\n').filter((l) => /Battement tendu/.test(l)).length > 0,
    actual.split('\n').filter((l) => /Battement tendu/.test(l)).slice(0, 1).join(''));
  checar('o alfabeto fica como estava — a mutação não vaza para outra prova',
    (tinha || alfabeto.verbetes['Battement tendu'] === undefined)
      && JSON.stringify(registo.celulas) === JSON.stringify(original.celulas)
      && registo.versoes === undefined,
    { apagado: !tinha, pistas: Object.keys(registo.celulas || {}) });
}

aValidacao();
aEscrita().then(aRota).then(aPagina).then(aOrigemDoVocabulario).then(aGuardaDeProveniencia).then(aTradicaoDeReferencia).then(oVersionamento).then(oDocumentoAntigo).then(() => {
  console.log('');
  if (falhas) { console.log('FALHOU — ' + falhas + ' asserção(ões).'); process.exit(1); }
  console.log('TUDO CERTO — o CRUD do verbete valida, grava no repositório e APAGA o verbete'
    + ' sem tocar no vocabulário; e o vocabulário vive numa verdade só.');
}).catch((erro) => {
  console.error('erro na prova:', erro);
  process.exit(1);
});
