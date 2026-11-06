'use strict';

/**
 * lancamento.js — o lançamento da aula (`POST /api/receber`), portado de
 * `workers/receber.js` para o núcleo agnóstico.
 *
 * O contrato vem do formulário (`tools/templates/lancamento.html`): UM POST com
 * `{ ciclo, senha, arquivos: [{ nome, texto, tipo }] }` — os dados do ciclo primeiro, o
 * índice (`ciclos.json`) por último. O TEXTO DOS DADOS É JSON EM CLARO: o cliente recebe o
 * conteúdo do Worker já decifrado e envia o resultado, não o `_cifrado`.
 *
 * DUAS COISAS QUE ELE NÃO FAZ, E POR QUÊ (15/10/2026). Ele não CONFERE a senha e não CIFRA o
 * que grava — as duas foram INJETADAS (`opcoes.autorizar`, `opcoes.cifrar`), porque este módulo
 * é PURO (sem `env`, sem chave, sem rede) e quem tem o segredo é a ponte. Antes disto ele
 * gravava o lançamento em TEXTO PURO no KV sem conferir senha nenhuma: o mesmo dado de aluna
 * que o pacote cifra com cuidado, e uma porta de escrita aberta para quem soubesse o endereço
 * da escola. Sem `autorizar`, o lançamento é RECUSADO — um endpoint de escrita que aceita tudo
 * em silêncio é pior que um endpoint que não existe.
 *
 * A chave monta-se do contexto DERIVADO do índice (professor, escola, ciclo) e
 * do carimbo que o cliente já escreveu no NOME do arquivo — o lançamento não
 * inventa nome nem carimbo (inventar quebraria a monotonicidade que o cliente
 * garante):
 *
 *   <escola>/<professor>/<ciclo>-<carimbo>/<nome-do-arquivo>
 *
 * As funções de chave (`prefixoDaEscola`, `raizDaChave`, `segmento`,
 * `cicloDaChave`) vivem em `./chaves.js` — uma escola, uma família de chaves, um
 * lugar só. O módulo é PURO (sem `fs`/`path`/`http`/`env`): recebe o adaptador
 * de armazenamento e o corpo, devolve o que produz. Erros de negócio LANÇAM
 * (`Error` com mensagem), para a rota decidir a recusa — o cliente do lançamento
 * espera `{ ok:false, erro }` com HTTP 200 (nunca 5xx).
 *
 * Uso:
 *   const { lancar } = require('./lancamento.js');
 *   const r = await lancar(armazenamento, { ciclo, senha, arquivos }, { autorizar, cifrar });
 */

const { prefixoDaEscola, raizDaChave, segmento, cicloDaChave } = require('./chaves.js');

const basename = (nome) => String(nome).split(/[\\/]/).pop();

// O NOME DO ARQUIVO DE DADOS TEM DUAS FORMAS, e as duas chegam aqui:
//   ciclo-01-duo-dados.json                   — o pacote recém-gerado, ainda sem lançamento
//   ciclo-01-duo-dados-2026-10-07T1900.json   — o lançamento, com o carimbo do cliente
// O carimbo (`AAAA-MM-DDTHHMM`, hora local, sem segundos) fica ENTRE `dados` e `.json`.
// Ancorar o `.json` no fim (`/-dados\.json$/`) casa a primeira forma e RECUSA a segunda —
// que é a única que o formulário envia.
const RE_DADOS = /-dados(-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4})?\.json$/;

/** `ciclo-01-<variante>-dados-<carimbo>.json` → a variante. `null` quando não é um arquivo de dados. */
function varianteDoNomeDeDados(nome) {
  const m = /^ciclo-\d{2}-(.+)-dados(?:-\d{4}-\d{2}-\d{2}T\d{4})?\.json$/.exec(String(nome || ''));
  return m ? m[1] : null;
}

/**
 * O NOME DE UM ARQUIVO DE DADOS DO CICLO — a definição, num lugar só.
 *
 * A VARIANTE PODE TER HIFENS (06/11/2026). Ela é `<escola>-<turma>`
 * (`calango-bale-nivel-1-teste-1`), e a primeira versão desta regra aceitava UM segmento
 * (`(?:-[a-z0-9]+)?`): o Worker recusava o nome verdadeiro do ficheiro com «arquivo de dados
 * inválido», e o «Abrir» do formulário nunca abria o ciclo — nem com a senha certa. O sintoma
 * era mudo: a tela dizia «a senha foi recusada», e a senha não tinha culpa nenhuma.
 *
 * O nome é também o que PROTEGE a leitura de asset no Worker (a rota `/api/dados` recebe o nome
 * do cliente): sem `/`, sem `..` e sem nada fora do alfabeto de slug, ele não alcança outro
 * arquivo. Por isso a conferência é aqui — junto de quem COMPÕE o nome —, e não reescrita em
 * cada chamador.
 */
const RE_NOME_DE_DADOS = /^ciclo-\d{2}(?:-[a-z0-9][a-z0-9-]*)?-dados(?:-\d{4}-\d{2}-\d{2}T\d{4})?\.json$/;
const nomeDeDadosValido = (nome) => RE_NOME_DE_DADOS.test(String(nome || ''));

/**
 * O CAMINHO DO ARQUIVO DENTRO DO SITE — `<pacote>/<nome>`, ou só o nome (06/11/2026).
 *
 * O NOME NÃO BASTA. O ficheiro de dados vive DENTRO do pacote da turma
 * (`bale-nivel-1-teste-1/ciclo-01-calango-bale-nivel-1-teste-1-dados.json`), e o Worker
 * procurava-o na raiz do site — desde 20/10/2026, quando o `assets.directory` passou a ser a
 * `publicacao/<escola>/`, montada com um subdirectório por pacote. Ele respondia «o pacote não
 * tem …» para um ficheiro que estava publicado, e a página dizia que era a senha.
 *
 * A PASTA É CONFERIDA COMO O NOME: um segmento, alfabeto de slug, sem `.` nem `/`. É a pasta
 * que a publicação dá à turma (`publicacao/<escola>/<variante sem a escola>/`), e nada além
 * dela é alcançável — `../x/<nome>` e `a/b/<nome>` são recusados aqui.
 *
 * Duas formas, e a segunda existe para o pacote servido na RAIZ (o modelo antigo de um Worker
 * por pacote, e as provas que montam a página em `/`): aí o nome sozinho é o caminho.
 */
const RE_PASTA = /^[a-z0-9][a-z0-9-]*$/;
function partesDoCaminhoDeDados(caminho) {
  const cru = String(caminho || '').trim().replace(/^\/+/, '');
  const partes = cru.split('/');
  if (partes.length === 1) {
    return nomeDeDadosValido(partes[0]) ? { pasta: '', nome: partes[0] } : null;
  }
  if (partes.length !== 2) return null;
  const [pasta, nome] = partes;
  if (!RE_PASTA.test(pasta) || !nomeDeDadosValido(nome)) return null;
  return { pasta, nome };
}

const slugDe = (indice, dados) => {
  const c = (indice && indice.ciclos && indice.ciclos[0]) || {};
  if (c.professor) return String(c.professor);
  if (dados && dados.professor) return String(dados.professor);
  const m = /^ciclo-\d+-([a-z0-9]+)-dados/.exec(basename(c.arquivo || (dados && dados.escola) || ''));
  return (m && m[1]) || null;
};

/**
 * O lançamento inteiro: valida o corpo, deriva a chave e grava os dois arquivos
 * (dados + índice). Devolve `{ ok:true, professor, escola, ciclo, escritos }` ou
 * LANÇA `Error` (mensagem para a recusa).
 */
async function lancar(armazenamento, corpo, opcoes) {
  const { autorizar, cifrar, depois } = opcoes || {};

  // A PORTA FECHADA POR PADRÃO: sem conferência de senha injetada, o lançamento NÃO acontece.
  // A alternativa (aceitar quando ninguém injetou nada) faria de um esquecimento da ponte uma
  // porta de escrita aberta — e um esquecimento silencioso é o defeito que já custou caro aqui.
  if (typeof autorizar !== 'function') {
    throw new Error('o lançamento exige a conferência de senha, e ela não está disponível neste ambiente');
  }
  const senha = String((corpo && corpo.senha) || '');
  if (!senha) throw new Error('informe a sua senha para gravar o lançamento');
  if (!(await autorizar(senha))) throw new Error('senha não reconhecida — o lançamento não foi gravado');

  const arquivos = corpo && Array.isArray(corpo.arquivos) ? corpo.arquivos : null;
  if (!arquivos || !arquivos.length) throw new Error('nenhum arquivo no pedido');

  for (const a of arquivos) {
    if (!a || typeof a.texto !== 'string' || !a.nome) throw new Error('arquivo sem nome ou sem texto');
    try { JSON.parse(a.texto); } catch { throw new Error('o texto de ' + basename(a.nome) + ' nao e JSON'); }
  }

  const dadosDe = arquivos.find((a) => RE_DADOS.test(basename(a.nome)));
  const indiceDe = arquivos.find((a) => basename(a.nome) === 'ciclos.json');
  if (!dadosDe || !indiceDe) throw new Error('faltou o arquivo de dados ou o ciclos.json');

  let dados, indice;
  try {
    dados = JSON.parse(dadosDe.texto);
    indice = JSON.parse(indiceDe.texto);
  } catch { throw new Error('nao consegui ler o JSON'); }

  const professor = slugDe(indice, dados);
  // A ESCOLA DA CHAVE É A DO WORKER, quando ele a declara (18/10/2026). O payload traz a
  // escola do `ciclos.json` do pacote — e o pacote é dado, não autoridade: com o KV
  // COMPARTILHADO entre escolas, uma escola forjada aqui gravava dentro do prefixo de
  // outra. Sem `escola` injetada (o servidor Node de desenvolvimento), vale o payload.
  const escola = String((opcoes && opcoes.escola) || '').trim()
    || (indice.ciclos[0] || {}).escola || dados.escola || 'escola';
  const ciclo = String(corpo.ciclo || (indice.ciclos[0] || {}).id || '01').padStart(2, '0');
  const carimbo = /(\d{4}-\d{2}-\d{2}T\d{4})/.exec(basename(dadosDe.nome));
  const chave = raizDaChave(escola, professor) + '/' + cicloDaChave(ciclo) + '-' +
    (carimbo ? carimbo[1] : basename(dadosDe.nome).replace(/\.json$/, ''));

  // O KV não tem `onlyIfNew` nem transação: a existência é conferida antes de
  // gravar (a janela é a de um duplo clique). `guardar` grava verbatim.
  // CIFRADO NO REPOUSO. Os DOIS arquivos vão cifrados (o lançamento é uma unidade): o de dados
  // traz nome, presença e observação de aluna, e o índice traz a data de cada aula. Sem `cifrar`
  // — escola sem a chave no Worker — o texto vai como veio, e a resposta DIZ isso (`cifrado:
  // false`), porque guardar em claro por falta de chave não pode ser silencioso.
  const comCifra = typeof cifrar === 'function';
  const escritos = [];
  for (const a of [dadosDe, indiceDe]) {
    const alvo = chave + '/' + basename(a.nome);
    if (await armazenamento.existe(alvo)) {
      throw new Error('ja existe um lancamento com este carimbo: ' + a.nome);
    }
    let valor = a.texto;
    if (comCifra) {
      valor = await cifrar(a.texto);
      // A CIFRA DEVOLVE TEXTO, e isto é conferido, não suposto. O KV guarda o que se lhe dá e
      // COAGE o resto: um objeto vira a string `[object Object]` sem erro nenhum — o lançamento
      // sumiria e a gravação diria «ok». Um contrato violado tem de doer agora, não virar
      // registro perdido. (Pego pelo teste em bancada, antes de ir ao ar.)
      if (typeof valor !== 'string') {
        throw new Error('a cifra devolveu ' + (valor === null ? 'null' : typeof valor)
          + ' em vez de texto — o lançamento não foi gravado');
      }
    }
    await armazenamento.guardar(alvo, valor);
    escritos.push(a.nome);
  }

  const resultado = {
    ok: true, professor, escola, ciclo, escritos, cifrado: comCifra,
    // A VARIANTE é o que a geração precisa e o resto do corpo não tem: ela vive no NOME do
    // arquivo de dados (`ciclo-01-<variante>-dados-<carimbo>.json`), que é o único sítio onde
    // o formulário a declara. Sem ela, o disparo não sabe que pacote gerar.
    variante: varianteDoNomeDeDados(basename(dadosDe.nome)),
    carimbo: carimbo ? carimbo[1] : null,
  };
  /* O DEPOIS — e ele NÃO pode derrubar o lançamento. A gravação já aconteceu; o que falta é o
   * que precisa dela: disparar a geração que publica o pacote. Se o disparo falhar (token, cota
   * da API), a resposta diz isso e o lançamento continua gravado — o contrário faria o professor
   * reenviar uma aula que já está no repositório, e a segunda gravação não seria um acrescento. */
  if (typeof depois === 'function') {
    try {
      resultado.depois = await depois(resultado);
    } catch (erro) {
      resultado.depois = { ok: false, erro: erro.message };
    }
  }
  return resultado;
}

module.exports = {
  lancar, basename, RE_DADOS, slugDe, varianteDoNomeDeDados,
  RE_NOME_DE_DADOS, nomeDeDadosValido, partesDoCaminhoDeDados,
};
