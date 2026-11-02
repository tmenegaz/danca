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

  const deNovo = await verbete.gravarVerbete(Object.assign({}, base, {
    nome: 'Battement fondu', musica: '4|4/4', verbete: verbeteBom(), acao: 'criar',
  }));
  checar('criar o que já existe é recusado com 409', !deNovo.ok && deNovo.status === 409, deNovo);

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
  checar('o seletor do exercício está no passo 2, com a frase e a posição',
    (() => {
      const p2 = (html.match(/data-passo="2" hidden>([\s\S]*?)data-passo="3"/) || [])[1] || '';
      return ['vbnome', 'vb-frase', 'vbposicao'].every((id) => new RegExp('id="' + id + '"').test(p2));
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
