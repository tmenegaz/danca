'use strict';

/**
 * raiz.js — o Worker RAIZ do sistema (`danca.padd.com.br`; o `danca.tmenegaz77.workers.dev`
 * continua a responder, mas é endereço técnico e não se mostra a ninguém).
 *
 * É a porta de entrada do sistema, NÃO uma escola: serve a apresentação «Sistema Lastro» + o
 * botão «Criar nova escola», e NADA mais. Todo acesso é atrás de senha — a `SENHA_RAIZ`
 * (secret do Worker, vinda de `tools/.senhas-locais` na hora do deploy), porque criar uma
 * escola é privilégio da pesquisadora. Aqui não há «Área do Professor»: isso é do pacote
 * de cada escola, não da raiz.
 *
 * O «Criar nova escola» chama `provisionar-escola.js`, que cria o Worker e o subdomínio
 * da escola no Cloudflare e devolve o URL. A raiz só decide; não cria conteúdo pedagógico.
 */

const { criarEscola, dispararCriacao, slugificar, desfazerPlaceholder, lerRegistoDoDono } =
  require('./provisionar-escola.js');
/* O CADASTRO DA ESCOLA E DO PROFESSOR PRINCIPAL (25/11/2026) — as regras, e as chaves do KV em que
 * os dados pessoais ficam. Fora do índice versionado, por decisão declarada: a verificação 7 do
 * `check-indices` proíbe `email` e `telefone` nos índices do acervo, e o CPF e o CNPJ não têm
 * melhor sorte — o repositório é público para quem tem o token.
 *
 * A METADE DO SERVIDOR (gravar/ler) está aqui em baixo, no `gravarCadastro`: ela precisa do KV, e
 * o núcleo não sabe o que é um KV. */
const cadastroDaEscola = require('../nucleo/cadastro-da-escola.js');
const correio = require('./correio.js');
/* A COMPOSIÇÃO COMERCIAL (25/11/2026) — os planos, a capacidade e a conta, de uma fonte só
 * (`biblioteca/comercial/planos.json`). Nenhum preço se escreve em código. */
const comercial = require('../nucleo/comercial.js');
/* O diagnóstico do endereço próprio (`/api/dominio`) — o mesmo módulo que o provisionamento usa
 * para criar o registo e a rota. É de propósito: o diagnóstico não pode ter uma segunda opinião
 * sobre o que é «ter endereço». */
const dominioDaEscola = require('./dominio-da-escola.js');
const { excluirEscola, apagarChavesDeEscola, prefixosDaEscola } = require('./expurgar-escola.js');
const {
  listarEscolas, listarEscolasPeloIndice, listarProfessores, listarProfessoresPeloIndice,
  apagarEscolaDoRepo, lerArquivo, auditarProvenienciaDaEscola,
  pendenciaDoKv, comResolucaoDoKv, atualizarIndiceDaEscola,
} = require('./repo-escola.js');
const painel = require('./painel-html.js');
/* O RELÓGIO DA CASA — o mesmo que desenha as tabelas do painel (16/11/2026). */
const fuso = require('../nucleo/fuso.js');
/* O CONVITE DE RECRIAÇÃO (16/11/2026) — o token, o hash e o prazo. O núcleo é puro: quem guarda
 * no KV e quem envia o e-mail são as funções abaixo, e é de propósito — o mesmo token tem de
 * poder ser medido sem um Worker à frente. */
const convite = require('../nucleo/convite.js');
/* QUEM RESPONDE PELA ESCOLA — a leitura do elo é UMA, e é a que o painel e as duas metades do
 * expurgo já usam (16/11/2026). A recriação precisa dela para saber de quem são os arquivos que
 * vai criar: uma segunda leitura do mesmo elo seria uma segunda opinião sobre o mesmo professor. */
const { responsavelDoInventario } = require('../nucleo/indices.js');

const ACCOUNT_ID = '2628f36f9f72bd539b417dcb173d1f12';
const DONO = 'tmenegaz';
const REPO = 'danca';
const REF = 'main';

/* O PRAZO DE EXPURGO MUDOU DE CASA E DE FONTE (16/11/2026).
 *
 * Ele era uma constante de três minutos (`PRAZO_EXPURGO_MS`), e lia-se a par de um `desde` escrito À MÃO num ficheiro
 * versionado (`raiz/escolas-habilitadas.json`). Duas coisas erradas de uma vez: a data que decide
 * o apagamento de uma escola era digitada por alguém, e o ficheiro já não tinha nenhuma escola
 * dentro — a varredura passava de cinco em cinco minutos a não fazer nada, em silêncio.
 *
 * Agora o prazo vem de `carenciaAte` (três meses, contados do `desabilitadaEm` que o PRÓPRIO
 * sistema grava ao desabilitar), e o regime de teste é um só interruptor — ver
 * `CARENCIA_DE_TESTE_MINUTOS`, junto de `MESES_DE_CARENCIA`. */

/**
 * OS SCRIPTS DE CONFRANÇA — de quem pode ser uma rota que a casa criou (15/11/2026).
 *
 * O `env.SHARD_SCRIPT` é a declaração de que este sistema serve escolas por um shard. Vazio (o
 * regime de um Worker por escola), a lista fica só com o script da própria escola — como era.
 *
 * A lista é DECLARADA no `env` e nunca vem do pedido: é a diferença entre «esta rota é desta casa»
 * e «apaga a rota que o visitante disser». É a mesma disciplina da marca do registo DNS.
 */
function scriptsDeConfianca(env) {
  const shard = String((env && env.SHARD_SCRIPT) || '').trim();
  return shard ? [shard] : [];
}

/**
 * A COMPARAÇÃO DE DOIS SEGREDOS, sem devolver o tempo ao atacante (15/11/2026).
 *
 * Um `a === b` sai no primeiro byte diferente, e a diferença de tempo — nanossegundos, mas real —
 * diz a quem mede quantos caracteres já acertou. Aqui percorre-se sempre o comprimento todo, e o
 * resultado acumula-se sem curto-circuito.
 *
 * O comprimento diferente responde `false` DEPOIS de percorrer o mais curto: o tempo já não
 * distingue onde a diferença está, e só diz que os comprimentos não batem (que é informação que um
 * atacante tem de qualquer forma, ao tentar).
 */
function mesmoSegredo(a, b) {
  const x = String(a == null ? '' : a);
  const y = String(b == null ? '' : b);
  const n = Math.max(x.length, y.length);
  let diferente = x.length === y.length ? 0 : 1;
  for (let i = 0; i < n; i += 1) {
    diferente |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  }
  return diferente === 0;
}

/** O freio da raiz: sem a senha, nada se vê (nem a página, nem a rota de criar). */
function autorizado(request, env) {
  const senha = env && env.SENHA_RAIZ;
  if (!senha) return false;
  const esperado = 'Basic ' + btoa('tmenegaz:' + senha);
  return request.headers.get('Authorization') === esperado;
}

/* O ANDAIME `escolas-habilitadas.json` SAIU (16/11/2026), e não foi substituído por outro
 * ficheiro: foi substituído por uma pergunta ao SISTEMA.
 *
 * O QUE ELE ERA: um `{ escola: { habilitada, desde, pagante, worker, kv } }` versionado, que a
 * pesquisadora editava à mão e reimplantava para testar o expurgo. A decisão declarada no
 * `IDEIA-PAINEL-ESCOLA.md` §17.5 era clara — «quando a Produção nascer, este arquivo SAI e a flag
 * passa a viver no ESCOLA.conf» —, e a Produção nasceu. A `habilitada` virou o estado comercial
 * (`ativa`/`suspensa`, com `habilitadaEm`/`desabilitadaEm`), que se muda por um botão e não por
 * um commit; e o `desde` escrito à mão virou o instante em que o sistema suspendeu a escola.
 *
 * O que ele dava de bom, e não se perde: a lista de escolas e a morada de cada uma no Cloudflare.
 * A lista agora vem do `escolasConhecidas` (o mapa do KV mais o índice do acervo), e a morada do
 * `moradaDaEscola`, que já era ela que a resolvia quando o andaime dizia outra coisa.
 */

/** Resposta JSON curta — a raiz responde em JSON a tudo que é rota. */
function responderJson(objeto, status) {
  return new Response(JSON.stringify(objeto), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
}

/**
 * AS ESCOLAS DO SISTEMA — lidas do ÍNDICE VERSIONADO, numa requisição.
 *
 * O acervo inteiro (`lerComCache`) custa uma árvore + um `contents/` por escola: doze requisições
 * para desenhar uma lista. Medido nesta página, era isso que a fazia «demorar a carregar».
 *
 * `indices/acervo.json` é DERIVADO e versionado, e o `regerar-indices.yml` refaz e commita a cada
 * push que toque as fontes (expurgo, cadastro de professor, plano, PO, âncora). Ele já traz, por
 * escola, `criada_em`, `expurgada` e `expurgada_em`. Uma requisição, e o dado é o mesmo que a
 * derivação produz — não uma segunda opinião.
 */
async function acervoDoIndice({ token }) {
  const texto = await lerArquivo({
    token, dono: DONO, repo: REPO, ref: REF, caminho: 'indices/acervo.json',
  });
  if (!texto) throw new Error('indices/acervo.json não existe no repositório');
  let acervo;
  try { acervo = JSON.parse(texto); } catch { throw new Error('indices/acervo.json não é JSON válido'); }
  if (!acervo || !Array.isArray(acervo.escolas)) {
    throw new Error('o índice do acervo não trouxe a lista de escolas');
  }
  return acervo;
}

/** As escolas, já normalizadas para a tela — o recorte do acervo que as listas usam. */
async function escolasDoIndice({ token }) {
  const acervo = await acervoDoIndice({ token });
  const escolas = acervo.escolas.map((e) => ({
    slug: e.slug,
    nome: e.nome || e.slug,
    professor: e.professor || null,
    // TODOS os professores que o elo do expurgo prova — não só o que ficou gravado no
    // inventário. Numa escola apagada, os ciclos já não existem: é o elo que testemunha.
    professores: Array.isArray(e.professores) ? e.professores : [],
    criada_em: e.criada_em || null,
    expurgada_em: e.expurgada_em || null,
    expurgada: e.expurgada === true,
    expurgos: e.expurgos || 0,
  }));
  // A LISTA E OS NOMES SAEM DA MESMA LEITURA. Quem chama usa as duas coisas: a tabela mostra a
  // PESSOA (nome) e ordena por ela; o slug continua a ser a identidade.
  return [escolas, acervo.professores || []];
}

/**
 * A LISTA DE ESCOLAS **COM** O ESTADO COMERCIAL (25/11/2026).
 *
 * A tabela das vivas passou a ter uma coluna que não vem do índice: o estado comercial vive no KV,
 * por escola (`bastidores/<escola>/comercial`). Ler os dois numa função só evita o defeito clássico
 * desta casa — duas leituras, duas opiniões sobre o mesmo instante — e mantém a lista com UMA
 * chamada ao repositório, como antes.
 *
 * A LEITURA DO KV É POR ESCOLA, e são poucas: um `get` por linha da tabela. Não se enumera o
 * namespace (ao contrário da criação, onde a varredura é precisa), porque a lista já sabe os slugs
 * e enumerar traria as chaves de todas as escolas para responder sobre as que estão à vista.
 */
/**
 * A ESCOLA JÁ FOI RECRIADA, E O ÍNDICE AINDA NÃO SABE — «a reconstruir» (16/11/2026).
 *
 * O CASO, e é o passo seguinte do expurgo: ela apaga a `duo`, e dias depois — o professor pagou
 * outra vez — clica «Recriar» na lista das apagadas. A raiz cria a identidade no Cloudflare e
 * dispara o motor; o elo só ganha `recriacao[]` quando o CI corre o `criar-escola.sh`, que é
 * quem vê o índice e o regista. Entre o clique e o commit há a MESMA janela que a criação já
 * conhece, com a agravante de a escola continuar na lista das APAGADAS enquanto já existe.
 *
 * A REGRA É TEMPORAL, e é a de `escola/expurgar.js` (`foiRecriada`), lida ao contrário: o elo diz
 * «apagada em T1»; o registo comercial, que é escrito pela recriação, diz «escrito em T2». Se
 * T2 > T1, o expurgo é passado e a encarnação de agora é nova. **O registo comercial antigo não
 * engana**: ele foi escrito antes do expurgo, e é exactamente isso que T2 > T1 exclui.
 *
 * UMA FUNÇÃO, DOIS CHAMADORES: a lista das apagadas (que esconde a linha) e a das vivas (que a
 * mostra «a nascer»). Duas opiniões sobre o mesmo instante dariam a escola nas duas listas, ou em
 * nenhuma.
 */
function reconstruindo({ comercial, expurgada_em }) {
  if (!comercial || !expurgada_em) return false;
  const escrito = Date.parse(comercial.atualizadoEm || '');
  const apagada = Date.parse(expurgada_em || '');
  if (!Number.isFinite(escrito) || !Number.isFinite(apagada)) return false;
  return escrito > apagada;
}

/**
 * AS ESCOLAS QUE JÁ EXISTEM E O ÍNDICE AINDA NÃO SABE — «a nascer» (16/11/2026).
 *
 * O DEFEITO, medido hoje: ela criou a escola «Abreu», a criação respondeu 201, e `Escolas vivas`
 * não mostrava nada. E não era um caso dela — eu criei uma escola para diagnosticar e ela também
 * não apareceu, vinte minutos depois.
 *
 * A CAUSA É UMA JANELA, e a janela é o desenho: a raiz cria o Worker e escreve o KV, mas a lista
 * sai de `indices/acervo.json` — DERIVADO, e regerado por um workflow que só corre depois de o
 * `criar-escola` commitar o scaffold. Entre o 201 e o fim do CI, a escola existe no Cloudflare e
 * não existe no índice. Para quem acabou de a criar, «não aparece na lista» lê-se como «não foi
 * criada» — e a nossa mensagem dizia «Escola criada», que é verdade e não serve de nada.
 *
 * O QUE SE ACRESCENTA À LISTA SÃO FACTOS QUE JÁ EXISTEM, e são dois, nesta ordem:
 *
 *   · o MAPA (`escolas/por-host`, KV) — escrito pelo provisionamento quando a escola nasce, e
 *     apagado pelo expurgo. Diz «este sistema serve esta escola»;
 *   · o registo COMERCIAL (`bastidores/<escola>/comercial`) — escrito DEPOIS de o disparo correr
 *     bem, e nunca por um ensaio que falhou a meio. É o que separa «a escola nasceu» de «a criação
 *     foi tentada e desfeita»: o rollback remove o Worker e deixa o mapa para trás.
 *
 * OS DOIS JUNTOS, e não um só, é o que torna a linha honesta: sem o segundo, uma criação abortada
 * apareceria como escola; sem o primeiro, seria preciso enumerar o KV para descobrir candidatos —
 * e a enumeração é a operação que estourou a cota em 18/10/2026.
 *
 * O CUSTO É UMA LEITURA DO MAPA, e uma por candidato. O mapa é uma chave só, e os candidatos são
 * zero em regime normal.
 */
async function escolasANascer({ kv, conhecidas }) {
  if (!kv || typeof kv.get !== 'function') return [];
  let mapa = null;
  try {
    const texto = await kv.get('escolas/por-host');
    mapa = texto ? JSON.parse(texto) : null;
  } catch { return []; }
  if (!mapa || typeof mapa !== 'object') return [];
  /* QUEM O ÍNDICE JÁ CONHECE — E O QUE ISSO QUER DIZER AGORA (16/11/2026).
   *
   * «Conhecida» era o mesmo que «não está a nascer». Deixou de ser: uma escola APAGADA é conhecida
   * do índice (é o elo que guarda a memória de que existiu) e pode estar a ser RECRIADA — a
   * recriação escreve o registo comercial e o elo só ganha `recriacao[]` quando o CI corre. Nessa
   * janela, a escola já existe, e a lista das vivas tem de a mostrar; sem isto, ela ficaria a
   * apagada e invisível ao mesmo tempo, e o clique em «Recriar» pareceria não ter feito nada.
   *
   * O que se guarda é a DATA do último expurgo de cada slug conhecido: é ela que a regra temporal
   * compara com a escrita do registo comercial (`reconstruindo`). */
  const conhecidasPorSlug = new Map((conhecidas || []).map((e) => [e.slug, e]));
  const vistas = new Set();
  const pendentes = [];
  for (const slug of Object.values(mapa)) {
    const limpo = String(slug || '').trim();
    if (!limpo || vistas.has(limpo)) continue;
    vistas.add(limpo);
    const conhecida = conhecidasPorSlug.get(limpo);
    const comercial = await lerComercial(kv, limpo);
    // Sem registo comercial NÃO é uma escola: é o resto de uma criação que falhou. `lerComercial`
    // devolve `ativa` por omissão, e é o `criadoEm` que diz se alguém o escreveu alguma vez.
    if (!comercial || !comercial.criadoEm) continue;
    if (conhecida) {
      /* CONHECIDA E VIVA: a lista do índice já a mostra, e esta função não tem nada a acrescentar.
       * CONHECIDA E APAGADA: só entra se o registo comercial for POSTERIOR ao expurgo — é a
       * recriação a caminho, e é esta a condição que impede o registo da vida anterior de
       * ressuscitar uma escola que continua apagada. */
      if (!conhecida.expurgada) continue;
      if (!reconstruindo({ comercial, expurgada_em: conhecida.expurgada_em })) continue;
    }
    const cadastro = await lerCadastroDaEscola({ PADD_KV: kv }, limpo);
    pendentes.push({
      slug: limpo,
      /* O RUN DO DISPARO, quando ele foi lido de volta no momento da criação. É ele que a linha
       * «a nascer» usa para dar à pessoa um sítio onde olhar quando a fila do Actions não anda —
       * e é a diferença entre «travou» e «está na fila, e é aqui que se vê». */
      disparoRun: comercial.disparoRun || null,
      nome: (cadastro && cadastro.escolaNome) || limpo,
      /* O PROFESSOR NÃO VEM DO CADASTRO: ele é o do elo (`bastidores/<escola>/professores`), e o
       * registo comercial guarda-o quando a escola é criada. Cair no cadastro seria ler um campo
       * que ali não existe — e um nome de professor a menos numa linha é melhor do que um nome
       * errado. */
      professor: comercial.professor || null,
      professores: [],
      criada_em: comercial.criadoEm || comercial.atualizadoEm || null,
      expurgada_em: null,
      expurgada: false,
      expurgos: 0,
      aNascer: true,
    });
  }
  return pendentes;
}

/**
 * O QUE A LISTA DAS VIVAS RECEBE DE CADA ESCOLA — com o veredicto do expurgo já resolvido
 * (16/11/2026).
 *
 * O DEFEITO QUE ISTO CORRIGE, ao pé da letra: «Eu desabilitei a escola Duo, deixei o tempo correr e
 * ela ficou apta para ser apagada. Só que eu fui lá e habilitei a escola novamente e ela continua
 * com a etiqueta dizendo que pode apagar.»
 *
 * A ETIQUETA NÃO MENTIA POR CAUSA DA DATA — MENTIA PORQUE TINHA OPINIÃO PRÓPRIA. O `desabilitadaEm`
 * é um FACTO histórico e não se apaga quando a escola volta a ser habilitada (é a resposta a «já
 * esteve suspensa?»); a página, ao ver a data e o prazo vencido, escrevia «pode apagar» sem
 * perguntar ao estado de agora. Duas regras sobre a mesma pergunta: a que apaga (e que recusava) e
 * a que mostra (e que oferecia). Quem manda é a regra — `estadoDoExpurgo`, a mesma da lista de
 * apagar, da rota e da varredura —, e a página passa a ler apenas o veredicto dela.
 *
 * `expurgavel` e `restanteMs` vêm no estado comercial porque é ali que a página os procura; o
 * `carenciaAte` é o mesmo que sai do veredicto, para a etiqueta de carência não ter uma segunda
 * conta.
 */
function comercialDaLista(comercial, opcoes) {
  const c = comercial || {};
  const veredicto = estadoDoExpurgo(c, opcoes);
  return {
    estado: c.estado,
    plano: c.plano || null,
    planoNome: c.planoNome || null,
    valor: c.valor || null,
    atualizadoEm: c.atualizadoEm || null,
    /* AS DUAS DATAS QUE A LISTA MOSTRA (25/11/2026), e a carência que sai delas. A conta é feita
     * AQUI, uma vez, e não na página: o HTML não sabe que meses têm 28 dias, e uma segunda regra
     * de contagem dentro do desenho divergiria da primeira. */
    habilitadaEm: c.habilitadaEm || null,
    desabilitadaEm: c.desabilitadaEm || null,
    carenciaAte: veredicto.carenciaAte,
    expurgavel: veredicto.pode,
    restanteMs: veredicto.restanteMs,
    desconto: (opcoes && opcoes.desconto) || null,
  };
}

async function escolasDoIndiceComComercial({ token, kv }) {
  const [escolas, professores] = await escolasDoIndice({ token });
  /* A JANELA DO CI FECHA-SE AQUI: o que existe no Cloudflare e ainda não está no índice entra na
   * lista, marcado — ver `escolasANascer`. */
  const aNascer = await escolasANascer({ kv, conhecidas: escolas });
  for (const e of aNascer) escolas.push(e);
  /* OS DESCONTOS SÃO LIDOS UMA VEZ, e não uma por escola (25/11/2026). Estão numa chave só
   * (`financeiro/descontos`), precisamente para isto: a lista das vivas abre muitas vezes, e uma
   * leitura por linha seria uma leitura por escola em cada abertura — a mesma família de erro que
   * esgotou a cota diária do KV em 18/10/2026. */
  const descontos = await lerDescontos(kv);
  const porEscola = new Map();
  for (const d of descontos) porEscola.set(d.escola, d);
  /* A RÉGUA DE TESTE, uma leitura só para a página inteira. Sem ela, o veredicto da linha e o da
   * lista de apagar mediriam com prazos diferentes no mesmo minuto. */
  const regimeDesde = await regimeDeTeste(kv);
  const comEstado = [];
  for (const e of escolas) {
    const comercial = await lerComercial(kv, e.slug);
    comEstado.push(Object.assign({}, e, {
      comercial: comercialDaLista(comercial, { regimeDesde, desconto: porEscola.get(e.slug) || null }),
    }));
  }
  return [comEstado, professores];
}

/**
 * O ELO DE UMA ESCOLA — uma leitura, e só quando alguém abre o registo.
 *
 * O slug é validado ANTES de virar caminho: ele entra numa URL e num `contents/` do GitHub, e um
 * slug com `/` ou `..` leria outro arquivo. A forma vem da mesma regra dos slugs de escola em
 * todo o repositório (`[a-z0-9-]`), e o roteador já a aplica — esta é a segunda barreira.
 */
async function eloDaEscola({ token, slug }) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(slug || ''))) return null;
  const texto = await lerArquivo({
    token, dono: DONO, repo: REPO, ref: REF, caminho: 'escola/' + slug + '/indice.json',
  });
  if (!texto) return null;
  try { return JSON.parse(texto); } catch { return null; }
}

/** A página de recusa quando falta o `GITHUB_TOKEN` — dita, não disfarçada de lista vazia. */
function paginaSemToken() {
  return painel.pagina({
    titulo: 'Painel',
    subtitulo: 'A gestão do sistema.',
    atual: 'painel',
    corpo: '<div class="caixa falta">' +
      '<h2>O painel não consegue ler o repositório</h2>' +
      '<p>Falta o <code>GITHUB_TOKEN</code> no Worker da raiz. Sem ele não há índice do acervo — ' +
      'e uma lista vazia aqui diria «nenhuma escola apagada», que seria falso.</p>' +
      '</div>',
  });
}

/**
 * O QUE UM PEDIDO DE «CRIAR ESCOLA» PRECISA TER — e por que isto é uma FUNÇÃO.
 *
 * Aqui havia uma linha só:
 *
 *     if (!nome || !senhaAdmin || !professorNome || !senhaProfessor) → 400
 *
 * Ela estava ERRADA, e a dona do produto levou o erro em 15/10/2026. O formulário oferece DOIS
 * caminhos para o professor — criar um NOVO (nome + sobrenome) ou REUTILIZAR um que já tem
 * pasta —, e a linha exigia o nome nos DOIS. Escolher o professor que já existe e deixar o nome
 * em branco (como o próprio formulário manda, e como ele desabilita o campo) devolvia:
 *
 *     informe o nome da escola, a senha do administrador, o nome e a senha do professor
 *
 * …uma mensagem que **contradizia o formulário** e não dizia QUAL campo faltava: ela recitava os
 * quatro, e quem tinha preenchido três não sabia qual era o quarto. Agora a validação é POR
 * CAMINHO e nomeia o campo que falta, um por vez.
 *
 * A UNICIDADE DO SLUG NÃO MORA AQUI: ela precisa do repositório (`listarProfessores`) para saber
 * o que já existe. Esta função é só a FORMA do pedido — sem I/O, e por isso provável sozinha.
 */
function validarCriacaoEscola(corpo, opcoes) {
  /* `permiteReuso` ENTRA AQUI PORQUE A FRASE DEPENDE DELE (16/11/2026). No público o professor é
   * sempre novo, e uma recusa que diz «ou escolha um professor que já existe» manda a pessoa
   * procurar na tela um caminho que a tela já não tem. A mensagem é parte da regra. */
  const permiteReuso = !opcoes || opcoes.permiteReuso !== false;
  const p = corpo || {};
  const campos = {
    nome: String(p.nome || '').trim(),
    senhaAdmin: String(p.senhaAdmin || p['senha-admin'] || ''),
    professorNome: String(p.professorNome || p['professor-nome'] || '').trim(),
    professorSobrenome: String(p.professorSobrenome || p['professor-sobrenome'] || '').trim(),
    professorExistente: String(p.professorExistente || p['professor-existente'] || '').trim(),
    senhaProfessor: String(p.senhaProfessor || p['senha-professor'] || ''),
  };

  // O que vale nos DOIS caminhos.
  if (!campos.nome) return { ok: false, status: 400, erro: 'informe o nome da escola' };
  if (!campos.senhaAdmin) {
    return { ok: false, status: 400, erro: 'informe a senha do administrador (a direção da escola)' };
  }
  if (!campos.senhaProfessor) return { ok: false, status: 400, erro: 'informe a senha do professor' };

  // O REÚSO TEM PRECEDÊNCIA: se veio um professor escolhido da lista, é ele. O nome em branco
  // é o certo aqui, não um campo esquecido — e exigir o nome deste lado era o defeito.
  if (campos.professorExistente) return { ok: true, modo: 'existente', campos };
  if (!campos.professorNome) {
    return {
      ok: false,
      status: 400,
      erro: permiteReuso
        ? 'informe o nome do professor — ou escolha um professor que já existe'
        : 'informe o nome do professor principal',
    };
  }
  return { ok: true, modo: 'novo', campos };
}

/**
 * `tiago-menegaz` → `Tiago Menegaz`. O nome de exibição quando o sistema NÃO tem o nome dele.
 *
 * `listarProfessores` colhe o nome do `indice.json` das escolas do professor — e um professor
 * que ainda não tem escola nenhuma (o diretório-modelo `tiago`) não tem índice: vem `nome: null`.
 * No reúso, cair para `''` era GRAVE, por dois motivos que só aparecem quando acontecem:
 *
 *   1. `criarEscola` só grava o secret `PROFESSOR_NOME` **quando o nome vem preenchido**. Sem
 *      esse secret, o slug do dono é `slugificar('')` = `''` — a escola nasce **sem dono capaz
 *      de entrar**, e o portão da Produção não reconhece ninguém;
 *   2. o workflow `criar-escola.yml` declara `professor-nome` e `responsavel` como
 *      `required: true` — vazios, o disparo volta 422 e o motor completo não sobe.
 *
 * O nome que volta do slug é o mesmo que o gerou (o slug SAI do nome), e para `tiago` dá
 * exatamente `Tiago`. Não é invenção: é a volta de uma ida.
 */
function tituloDoSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Lê JSON COM COMENTÁRIOS — os `wrangler.<escola>.jsonc` são jsonc, e `JSON.parse` recusa
 * `//`. O corte respeita as strings: `"https://…"` continua inteiro. Devolve `null` se,
 * mesmo limpo, o texto não for JSON — quem chama trata como «não sei ler» e não inventa.
 */
function lerJsonc(texto) {
  let saida = '';
  let dentroDeString = false;
  let escapado = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (dentroDeString) {
      saida += c;
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') dentroDeString = false;
      continue;
    }
    if (c === '"') { dentroDeString = true; saida += c; continue; }
    if (c === '/' && texto[i + 1] === '/') {
      while (i < texto.length && texto[i] !== '\n') i += 1;
      saida += '\n';
      continue;
    }
    if (c === '/' && texto[i + 1] === '*') {
      i += 2;
      while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) i += 1;
      i += 1;
      continue;
    }
    saida += c;
  }
  try { return JSON.parse(saida); } catch { return null; }
}

/**
 * O nome do script/subdomínio e o KV desta escola, lidos do PRÓPRIO `wrangler.<slug>.jsonc`.
 * É por isso que a raiz não precisa de uma tabela à parte: o arquivo que identifica a escola
 * diz também onde ela vive no Cloudflare e qual namespace limpar. Sem o arquivo (ou ilegível),
 * devolve `null` — e o expurgo cai no slug e não limpa KV nenhum, em vez de chutar um namespace
 * compartilhado (o KV é de todas as escolas; apagar o errado apaga o alheio).
 */
/**
 * O DESFECHO DO KV QUE VAI PARA O ELO — e o ramo que faltava (01/11/2026).
 *
 * O DEFEITO, medido no expurgo da `batata` a 01/11/2026. O elo 6 de
 * `escola/batata/indice.json` ficou **sem** o bloco `kv`, enquanto os elos 2 a 5 o têm
 * (`ok:true, restantes:0`). A rota lia o desfecho por
 * `relatorio.cloudflare.kv` — e quando `excluirEscola` LANÇA (é o que acontece quando a
 * enumeração do KV estoura a cota diária), o `catch` grava `{ erro, morada }` e o `kv`
 * nunca existe. `kvDoExpurgo` ficava `undefined`, o elo recebia `kv: null`, e
 * `pendenciaDoKv` — que só reconhece `kv.pendente === true` — respondia «nada pendente».
 *
 * O efeito é o pior dos mundos: a escola sai do ar e do repositório, as chaves podem ter
 * ficado, e **a retomada (`POST /api/expurgar-kv`) fica cega** — porque é do elo que ela lê
 * o namespace. O comentário que está no passo 4 dizia exactamente isto, e o `?:` de uma
 * linha anulava-o em silêncio.
 *
 * A REGRA: quando a escola DECLARA namespace (`morada.kvNamespaceId`), o elo regista o
 * desfecho do KV **sempre** — mesmo que a metade Cloudflare tenha explodido antes de o
 * saber. Quando não declara, não há o que limpar, e não se inventa pendência.
 *
 * Devolve `null` (escola sem KV declarado) ou o bloco `kv` do elo. `ok:false` faz
 * `comElo` marcar `pendente: true` e a retomada a encontrar.
 */
function desfechoDoKvParaOElo({ cloudflare, morada, slug }) {
  const namespaceId = (morada && morada.kvNamespaceId) || null;
  const prefixos = prefixosDaEscola(slug);
  const kv = cloudflare && cloudflare.kv;
  if (kv) {
    const bloco = {
      ok: kv.ok === true,
      apagadas: kv.apagadas,
      restantes: kv.restantes,
      namespaceId,
      prefixos,
    };
    // O PORQUÊ viaja com o elo. Sem ele, a pendência diz «não deu» e deixa a próxima sessão
    // a adivinhar se foi cota, permissão ou rede.
    if (kv.erro) bloco.erro = String(kv.erro);
    return bloco;
  }
  if (!namespaceId) return null;
  const doExpurgo = cloudflare && cloudflare.erro;
  return {
    ok: false,
    apagadas: null,
    restantes: null,
    namespaceId,
    prefixos,
    erro: doExpurgo
      ? 'a metade Cloudflare falhou antes de dizer o das chaves: ' + doExpurgo
      : 'a limpeza do KV não devolveu desfecho — não se sabe o que ficou nas chaves',
  };
}

async function moradaDaEscola({ token, slug, fetchImpl }) {
  const caminho = 'wrangler.' + slug + '.jsonc';
  const texto = await lerArquivo({ token, dono: DONO, repo: REPO, ref: REF, caminho, fetchImpl });
  /* A ESCOLA DE UM SHARD NÃO TEM CONFIG PRÓPRIA (15/11/2026) — e é o ÍNDICE que diz isso.
   *
   * Num shard, `wrangler.<escola>.jsonc` não existe: seria ela que faria o `deploy-escolas` subir
   * mais um Worker. A morada da escola passa a estar em `escola/<slug>/indice.json`, no campo
   * `shard` que o `criar-escola.sh --shard` grava.
   *
   * Porque é que isto importa ao EXPURGO: a rota de uma escola de shard aponta ao script do shard.
   * Sem esta leitura, o expurgo procuraria um script com o nome da escola, não encontraria — e
   * deixaria a rota no ar, com a escola a responder num endereço que já devia estar morto.
   *
   * O `worker` devolvido é o do SHARD, e é de propósito: o `excluirEscola` trata um `worker`
   * diferente do `slug` como «não apagues este script, ele não é uma escola». */
  if (!texto) {
    const doIndice = await lerArquivo({
      token, dono: DONO, repo: REPO, ref: REF, caminho: 'escola/' + slug + '/indice.json', fetchImpl,
    });
    let shard = '';
    try { shard = String((JSON.parse(doIndice) || {}).shard || '').trim(); } catch (erro) { shard = ''; }
    if (!shard) return null;
    return { worker: shard, shard, kvNamespaceId: null, arquivo: 'escola/' + slug + '/indice.json', legivel: true };
  }
  const cfg = lerJsonc(texto);
  if (!cfg) return { worker: slug, kvNamespaceId: null, arquivo: caminho, legivel: false };
  const kv = (cfg.kv_namespaces && cfg.kv_namespaces[0]) || null;
  return {
    worker: cfg.name || slug,
    kvNamespaceId: kv && kv.id ? kv.id : null,
    arquivo: caminho,
    legivel: true,
  };
}

/**
 * QUAIS ESCOLAS EXISTEM — a lista que o expurgo percorre (16/11/2026).
 *
 * DUAS FONTES, e a razão de serem duas: cada uma sabe uma metade.
 *
 *   · o MAPA do KV (`escolas/por-host`) é a lista das escolas criadas desde o shard — uma leitura
 *     só, e é ela que inclui a escola que nasceu há cinco minutos e ainda não está no índice;
 *   · o ÍNDICE do acervo (`indices/acervo.json`) é a lista das escolas que têm pasta no
 *     repositório — as de antes do shard, que o mapa não conhece.
 *
 * SEM O `GITHUB_TOKEN` a lista fica só com o mapa, e o relatório diz isso: uma lista mais curta é
 * uma escola que espera mais um ciclo, não uma escola apagada por engano. É a mesma assimetria
 * que governa o resto deste ficheiro — o que falta adia, o que se inventa destrói.
 *
 * NÃO SE ENUMERA O KV. `list()` com o prefixo `bastidores/` traria todas as chaves de todas as
 * escolas (alunas, actos, curadorias) para responder «quais são as escolas?» — e a enumeração é a
 * operação que estouro a cota diária em 18/10/2026, como está escrito no `AGENTS.md`.
 */
async function escolasConhecidas(env) {
  const slugs = new Set();
  let mapa = false;
  const kv = env && env.PADD_KV;
  if (kv && typeof kv.get === 'function') {
    try {
      const texto = await kv.get('escolas/por-host');
      const lido = texto ? JSON.parse(texto) : null;
      if (lido && typeof lido === 'object') {
        mapa = true;
        for (const slug of Object.values(lido)) {
          const limpo = String(slug || '').trim();
          if (limpo) slugs.add(limpo);
        }
      }
    } catch (erro) { mapa = false; }
  }
  let indice = false;
  if (env && env.GITHUB_TOKEN) {
    try {
      const acervo = await acervoDoIndice({ token: env.GITHUB_TOKEN });
      for (const e of acervo.escolas || []) {
        const slug = String((e && e.slug) || '').trim();
        /* A ESCOLA EXPURGADA FICA NO ÍNDICE, E NÃO É UMA ESCOLA (16/11/2026).
         *
         * O índice é MEMÓRIA: o elo do expurgo diz que aquela escola existiu, e é isso que a lista
         * das apagadas mostra. Mas esta função responde «quem existe hoje», e memória não é
         * existência. Sem este `continue`, a varredura ia buscar o registo comercial da escola
         * apagada — que continua no KV, porque num shard o cofre é partilhado — e voltava a
         * «expurgá-la» em cada passagem, para sempre. Medido minutos depois de a `breu` ser
         * apagada: o relatório dizia «expurgadas: 1», com todos os passos a zero.
         *
         * Um expurgo que se repete não é ruído: é a diferença entre «esta escola existe» e «esta
         * escola existiu» a ser apagada, num sítio onde ela decide. */
        if (e && e.expurgada === true) continue;
        if (slug) slugs.add(slug);
      }
      indice = true;
    } catch (erro) { indice = false; }
  }
  return { slugs: [...slugs].sort(), mapa, indice };
}

/**
 * O EXPURGO — a varredura que o Cron Trigger corre (reescrito a 16/11/2026).
 *
 * A PERGUNTA MUDOU DE SÍTIO. Antes: «este ficheiro versionado diz que a escola está desabilitada
 * desde <data escrita à mão>?». Agora: «o SISTEMA diz que ela está suspensa desde <o instante em
 * que a suspensão aconteceu>, e já passou a carência?». A primeira dependia de alguém se lembrar
 * de editar um ficheiro; a segunda é a mesma conta que a lista das vivas mostra na coluna da
 * carência — e é por isso que agora não há duas opiniões sobre a data.
 *
 * A ORDEM DAS VERIFICAÇÕES, e cada uma só DESCARTA:
 *   1. existe na lista? (o resto do sistema diz que sim)
 *   2. está `suspensa`? — só quem foi desligado conta; `ativa` e `aguardando` nunca se apagam;
 *   3. há `desabilitadaEm`? sem ele não há prazo a contar, e não se apaga por omissão;
 *   4. a carência venceu?
 *   5. a proveniência da escola ainda confere?
 * Só depois destas cinco se apaga. Todas as paradas vão no relatório com o motivo — a varredura
 * que não diz por que não apagou é indistinguível de uma varredura que não correu.
 *
 * A PROVENIÊNCIA ENTRA AQUI (16/11/2026), e é a mesma guarda do botão «Apagar escola». O expurgo
 * automático não pode ser mais permissivo do que o manual: ele leva as âncoras (`.fipp`), e uma
 * âncora que já não conferia com as fontes não se recupera depois de apagada. O manual pára e
 * pede correção; o automático pára e diz o mesmo no relatório — e tenta outra vez daqui a cinco
 * minutos, que é o que uma varredura sabe fazer. `forcar` não existe aqui, e de propósito: uma
 * varredura agendada não tem quem declare um motivo.
 *
 * O `pagante` do andaime também sai: quem paga é `ativa`, e quem não paga é `suspensa`. O estado
 * comercial JÁ É a resposta, e uma segunda bandeira para a mesma pergunta divergiria dela.
 */
async function expurgar(env, deps) {
  const token = env && env.CLOUDFLARE_API_TOKEN;
  const ghToken = env && env.GITHUB_TOKEN;
  /* AS DUAS METADES QUE FALAM COM O MUNDO ENTRAM POR PARÂMETRO (16/11/2026).
   *
   * `excluirEscola` fala com a API do Cloudflare e `auditarProvenienciaDaEscola` com a do GitHub.
   * A bancada não fala com nenhuma das duas — e uma prova que só corre com rede é uma prova que
   * corre em produção. Com elas injectáveis, o que se mede aqui é a REGRA: qual escola é
   * apagada, qual é poupada, e porquê. O que cada metade faz depois é medido nas provas dela
   * (`provar-expurgo-raiz`, `provar-proveniencia-do-expurgo`), com os falsos que já existem.
   *
   * O valor por omissão é o verdadeiro: um chamador que não passe nada — o Cron — não muda. */
  const auditar = (deps && deps.auditar) || auditarProvenienciaDaEscola;
  const excluir = (deps && deps.excluir) || excluirEscola;
  const agora = Date.now();
  const conhecidas = await escolasConhecidas(env);
  const relatorio = {
    agora: new Date(agora).toISOString(),
    fontes: { mapa: conhecidas.mapa, indice: conhecidas.indice },
    carencia: descricaoDaCarencia(),
    expurgadas: [],
    puladas: [],
    semToken: !token,
  };
  if (!token) return relatorio;
  if (!conhecidas.slugs.length) {
    relatorio.puladas.push({ slug: null, motivo: 'nenhuma escola conhecida — sem mapa e sem índice' });
    return relatorio;
  }

  const kv = env && env.PADD_KV;
  /* O REGIME DE TESTE, lido uma vez para a varredura inteira — e gravado na primeira leitura. */
  const regimeDesde = await regimeDeTeste(kv, agora);
  if (regimeDesde) relatorio.regimeDeTesteDesde = regimeDesde;

  for (const slug of conhecidas.slugs) {
    const comercial = await lerComercial(kv, slug);
    /* A DECISÃO É DA REGRA, e não deste laço (16/11/2026) — ver `estadoDoExpurgo`. O que fica aqui
     * é o que a varredura sabe e a regra não: a proveniência e as duas metades que falam com o
     * mundo. Uma verificação a mais neste `for` seria uma segunda opinião sobre a carência. */
    const veredicto = estadoDoExpurgo(comercial, { agora, regimeDesde });
    if (!veredicto.pode) {
      /* UMA ESCOLA ATIVA NÃO ENTRA NO RELATÓRIO, e é de propósito: a varredura passa de cinco em
       * cinco minutos, e listar todas as escolas que pagam seria um relatório a crescer sozinho
       * para dizer «está tudo bem». Só o que está PERTO de ser apagado se explica. */
      if (veredicto.estado === 'suspensa') {
        relatorio.puladas.push({
          slug, motivo: veredicto.motivo, estado: veredicto.estado,
          desabilitadaEm: veredicto.desabilitadaEm,
          carenciaAte: veredicto.carenciaAte,
          restanteMs: veredicto.restanteMs,
        });
      }
      continue;
    }
    /* A PROVENIÊNCIA ANTES DE APAGAR — e sem `forcar`. Falha de rede também pára: o custo de
     * parar é mais cinco minutos; o de avançar é irreversível. */
    if (!ghToken) {
      relatorio.puladas.push({ slug, motivo: 'sem GITHUB_TOKEN — não se apaga o que não se auditou' });
      continue;
    }
    try {
      const auditoria = await auditar({
        token: ghToken, dono: DONO, repo: REPO, ref: REF, slug,
        shards: scriptsDeConfianca(env),
      });
      if (!auditoria.ok) {
        relatorio.puladas.push({
          slug, motivo: 'a proveniência não confere — corrigir primeiro',
          problemas: auditoria.problemas,
        });
        continue;
      }
    } catch (erro) {
      relatorio.puladas.push({
        slug, motivo: 'não foi possível auditar a proveniência',
        erro: (erro && erro.message) || String(erro),
      });
      continue;
    }
    /* A MORADA VEM DO REPOSITÓRIO, e não do andaime: num shard, `wrangler.<escola>.jsonc` não
     * existe e a morada está em `escola/<slug>/indice.json` (campo `shard`). Sem ela, a rota
     * ficaria no ar a apontar ao shard, e a escola continuaria a responder num endereço que devia
     * estar morto. */
    let morada = null;
    try { morada = await moradaDaEscola({ token: ghToken, slug }); } catch (erro) { morada = null; }
    const worker = (morada && morada.worker) || undefined;
    const kvDaEscola = morada && morada.kvNamespaceId
      ? { namespaceId: morada.kvNamespaceId, prefixos: prefixosDaEscola(slug) }
      : undefined;
    try {
      relatorio.expurgadas.push(await excluir({
        token, accountId: ACCOUNT_ID, slug, worker, kv: kvDaEscola,
        scripts: scriptsDeConfianca(env), mapaKv: env && env.PADD_KV,
      }));
    } catch (erro) {
      relatorio.puladas.push({
        slug, motivo: 'o expurgo falhou a meio', erro: (erro && erro.message) || String(erro),
      });
    }
  }
  return relatorio;
}

/** O handler do Cron Trigger: apaga sem ninguém clicar, e loga o relatório. */
async function scheduled(event, env, ctx) {
  const relatorio = await expurgar(env);
  console.log('[expurgo] ' + JSON.stringify(relatorio));
}

/**
 * A CRIAÇÃO DA ESCOLA — UMA VEZ, PARA AS DUAS PORTAS (25/11/2026).
 *
 * O bloco estava dentro do `fetch`, atrás do portão da `SENHA_RAIZ`. Com a página pública
 * (`lastro.padd.com.br`) a criar a MESMA escola, ele passou a ter dois chamadores — e duas cópias
 * de um percurso de duzentas linhas que cria Worker, escreve no KV, dispara o workflow e desfaz
 * tudo quando o disparo falha divergiriam na primeira correcção. Uma função, duas portas.
 *
 * O QUE MUDA ENTRE AS PORTAS VAI EM `opcoes`, e nada mais:
 *   · `origem` — `'painel'` (a página do proprietário) ou `'publico'` (a página aberta). Vai para
 *     o registo da escola: quem criou é um facto que a proveniência guarda, e um dia se pergunta.
 *   · `exigirCadastro` — a página pública RECOLHE o CNPJ, o e-mail e o telefone da escola; a do
 *     proprietário continua a criar escolas de teste sem eles. O que é obrigatório numa porta não
 *     é obrigatório na outra, e isso é declarado aqui, num sítio só.
 */
async function responderCriacao(request, env, opcoes) {
  const origem = (opcoes && opcoes.origem) || 'painel';
  const exigirCadastro = Boolean(opcoes && opcoes.exigirCadastro);
  const responderJson = (objeto, status) => new Response(JSON.stringify(objeto), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  });
  const token = env && env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }
  try {
    const corpo = await request.json();
    // O professor criado na página é SEMPRE o dono da escola (a direção). A marcação
    // «é o dono?» saiu do formulário: quem cria é a pesquisadora, e o professor inicial
    // é a pessoa de contato da escola — o nome pode ser ajustado nos Bastidores.
    const professorEhDono = true;
    /* NA PORTA PÚBLICA O PROFESSOR É SEMPRE NOVO (16/11/2026).
     *
     * «Para quem tá no sistema pela página que é pública [...] não precisa ter aquela seleção ali
     * de professor se é novo ou não. Já é sempre novo de cara.» E o motivo é de fundo: reutilizar
     * uma pasta é uma decisão de quem conhece o histórico das escolas — e quem chega pelo endereço
     * aberto não conhece, nem tem por onde conhecer (a lista de professores não se publica).
     *
     * A RETIRADA É FEITA AQUI, e não na página. A página já não oferece a escolha; o que se fecha
     * aqui é a PORTA — um pedido escrito à mão com `professorExistente` não atravessa. E retira-se
     * em vez de recusar: uma página em cache que ainda mande o campo tem de conseguir criar a
     * escola, e o que ela pediu a mais é simplesmente ignorado. */
    if (origem === 'publico') {
      delete corpo.professorExistente;
      delete corpo['professor-existente'];
      delete corpo['professor-existente-nome'];
    }
    const valido = validarCriacaoEscola(corpo, { permiteReuso: origem !== 'publico' });
    if (!valido.ok) return responderJson({ ok: false, erro: valido.erro }, valido.status);
    const { nome, senhaAdmin, professorNome, professorSobrenome, professorExistente, senhaProfessor } = valido.campos;

    /* O CADASTRO — CNPJ, e-mails, telefones e a HABILIDADE (25/11/2026). A regra é uma
     * (`motor/nucleo/cadastro-da-escola.js`) e as portas são duas; o que muda é `exigirCadastro`.
     *
     * A LISTA DE MODALIDADES VEM DO CATÁLOGO, e não de uma cópia: `perfil-do-professor.js` lê
     * `biblioteca/modalidades/modalidades.json`, que é o mesmo ficheiro que a tela dos Bastidores
     * mostra. Um id que não esteja ali é recusado AGORA — um perfil com uma modalidade que o
     * catálogo não conhece só dá erro meses depois, na primeira turma que a pedir.
     *
     * OS DADOS PESSOAIS NÃO ENTRAM NO ÍNDICE VERSIONADO: a verificação 7 do `check-indices.js`
     * proíbe `email`, `telefone` e afins nos índices do acervo. Vão para o KV, e é o `gravarCadastro`
     * abaixo que o faz — numa chave do TENANT para a escola e numa chave da PESSOA para o professor. */
    const catalogo = require('../nucleo/perfil-do-professor.js');
    const cadastroValidado = cadastroDaEscola.validarCadastro(corpo, {
      modalidadesValidas: (catalogo.LISTA_DE_MODALIDADES || []).map((m) => m && m.id).filter(Boolean),
      exigirDadosDaEscola: exigirCadastro,
    });
    if (!cadastroValidado.ok) {
      return responderJson({ ok: false, erro: cadastroValidado.erro, erros: cadastroValidado.erros }, 400);
    }
    const cadastro = cadastroValidado.cadastro;

    /* O PLANO E A CAPACIDADE (25/11/2026) — validados contra o catálogo, e não confiados.
     *
     * É a mesma disciplina do cadastro: a página propõe, o servidor decide. Um plano fora do
     * catálogo é recusado AGORA — e o `dispensarPagamento` só vale na porta do proprietário
     * (`origem === 'painel'`), porque obrigá-la a pagar a si mesma em cada ensaio fecharia a porta
     * a quem mais usa o sistema. */
    const escolhaComercial = comercial.validarEscolha(corpo, { podeDispensar: origem === 'painel' });
    if (!escolhaComercial.ok) {
      return responderJson({ ok: false, erro: escolhaComercial.erro }, 400);
    }
    const escolha = escolhaComercial.escolha;

    /* A IDENTIDADE ÚNICA — o CNPJ é uma escola, o CPF é um professor (25/11/2026).
     *
     * A recusa vem ANTES de se criar qualquer coisa, e diz o caminho de saída: para o professor, a
     * saída é boa («use o professor que já existe»); para a escola, é o nome. Recusar depois de
     * criar deixaria um Worker no ar sobre uma escola que não devia existir. */
    if (cadastro.cnpj) {
      const jaTem = await cnpjJaUsado(env, cadastro.cnpj);
      if (jaTem) {
        return responderJson({
          ok: false,
          erro: 'o CNPJ ' + cadastro.cnpj + ' já é da escola «' + jaTem + '» — um CNPJ é uma '
            + 'escola. Se é um ensaio, use outro nome; se é a mesma escola, ela já existe.',
          escolaExistente: jaTem,
        }, 409);
      }
    }
    if (cadastro.cpf) {
      const jaTem = await cpfJaUsado(env, cadastro.cpf);
      if (jaTem) {
        /* A MESMA RECUSA, DUAS SAÍDAS — e a diferença é de quem é a decisão (16/11/2026).
         *
         * No PAINEL a saída é uma acção: a lista está à frente, e escolher o professor que existe é
         * um clique. No PÚBLICO não há lista nem deve haver — «ali vai ser sempre novo» —, e
         * portanto a saída não é dele: é de quem administra o sistema. Dizer «escolha um professor
         * que já existe» a quem não tem a opção seria um erro que sabe a saída e a aponta para o
         * lado errado. */
        const contacto = enderecoDaAdministracao(env);
        return responderJson({
          ok: false,
          erro: origem === 'publico'
            ? 'o CPF ' + cadastro.cpf + ' já está registado no Sistema Lastro, como professor '
              + '«' + jaTem + '». Cada CPF é um professor, e a pasta dele já existe — o cadastro '
              + 'não pode ser refeito por aqui. Escreva para a administração do Sistema Lastro'
              + (contacto ? ' (' + contacto + ')' : '')
              + ' e peça a criação da escola com este professor: a escola nova é criada ao lado '
              + 'da que ele já tem, sem tocar no que lá está.'
            : 'o CPF ' + cadastro.cpf + ' já é do professor «' + jaTem + '» — um CPF é um '
              + 'professor, e a pasta dele já existe. Escolha «um professor que já existe» na '
              + 'etapa do professor.',
          professorExistente: jaTem,
          procuraAAdministracao: origem === 'publico' ? true : undefined,
        }, 409);
      }
    }

    // O SLUG DO PROFESSOR É A PASTA `professores/<slug>/` — e essa pasta é do SISTEMA, não
    // da escola: guarda o pacote, os cadernos, os relatórios e as âncoras. Duas pessoas com
    // o mesmo slug viram UMA no registro (o PO de uma cairia na pasta da outra). Por isso a
    // unicidade é conferida contra os diretórios que existem, e o desempate é o SOBRENOME.
    //
    // Duas saídas, e só duas:
    //   1. REUTILIZAR um professor que já existe (`professorExistente`) — a pasta fica;
    //   2. CRIAR com nome + sobrenome — a pasta nasce como `nome-sobrenome`.
    /* A MESMA LISTA QUE O FORMULÁRIO MOSTRA (24/11/2026).
     *
     * Era a varredura (`listarProfessores`), e a varredura tira as `escolas` do CONFIG — num
     * shard, de nada. Consequência: reutilizar um professor que existe dava `nome: null` e o
     * `nomeDeExibicao` caía em `tituloDoSlug`, que perde o acento («Demi Plie» em vez de
     * «Demi Plié»). O nome errado ia para o elo, para o secret `PROFESSOR_NOME` e para o
     * `responsavel` da escola — e o elo é proveniência, não se corrige depois.
     *
     * Passa a ser a lista do ÍNDICE, a mesma que serve `/api/professores`: uma pergunta, uma
     * resposta. Quando o índice não responde, a varredura responde — e aí degrada-se para o
     * slug, como antes. */
    const existentes = await listarProfessoresPeloIndice({
      token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF,
      kv: env && env.PADD_KV,
    }).then((r) => r.professores).catch(() => listarProfessores({ token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF }));
    let professor = null;
    let nomeDeExibicao = professorNome;
    if (professorExistente) {
      /* SÓ SE REUTILIZA O QUE TEM PASTA. Um professor que sobrevive apenas na memória de uma
       * escola expurgada é oferecido pelo índice, mas não tem diretório nenhum onde a escola
       * nova possa nascer ao lado dele — e o servidor diria «não existe» a seguir. */
      const achado = existentes.find((p) => p.slug === professorExistente && p.pasta !== false);
      if (!achado) {
        return new Response(JSON.stringify({ ok: false, erro: 'o professor "' + professorExistente + '" não existe — recarregue a lista' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      professor = achado.slug;
      // O nome de um professor que JÁ EXISTE vem do sistema — e quando ele ainda não tem
      // escola nenhuma (o diretório-modelo `tiago`), o índice não existe e sobra o slug.
      // NUNCA vazio: é este nome que vira o secret `PROFESSOR_NOME` e o `responsavel`.
      nomeDeExibicao = achado.nome || tituloDoSlug(achado.slug);
    } else {
      // O sobrenome (ou apelido) é exigido: sem ele, dois homônimos produzem o mesmo slug.
      if (!professorSobrenome) {
        return new Response(JSON.stringify({
          ok: false,
          erro: origem === 'publico'
            ? 'informe o sobrenome (ou um apelido) do professor — é ele que separa dois professores do mesmo nome, porque o nome vira a pasta `professores/<nome>-<sobrenome>/` e não pode repetir.'
            : 'informe o sobrenome (ou um apelido) do professor — o nome vira a pasta `professores/<nome>/` e não pode repetir. Se for a mesma pessoa de um professor que já existe, use «usar este professor».',
          professoresExistentes: existentes.map((p) => p.slug),
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      professor = slugificar(professorNome + ' ' + professorSobrenome);
      if (!professor) {
        return new Response(JSON.stringify({ ok: false, erro: 'o nome do professor não produz um slug válido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      const colisao = existentes.find((p) => p.slug === professor);
      if (colisao) {
        /* O NOME QUE JÁ EXISTE — e o que se pede a quem o escreveu (16/11/2026).
         *
         * No painel: mudar o sobrenome, ou escolher o professor que já existe. No público: não há
         * escolha, e também não há como distinguir «é a mesma pessoa» de «é outra com o mesmo
         * nome» — a pasta é que sabe, e quem sabe ler a pasta é a administração. A mensagem diz
         * isso, e diz o que fazer. */
        const contacto = enderecoDaAdministracao(env);
        const quem = colisao.nome || colisao.slug;
        return new Response(JSON.stringify({
          ok: false,
          erro: origem === 'publico'
            ? 'já existe no Sistema Lastro um professor «' + quem + '», e o nome dele ocupa a '
              + 'pasta `professores/' + professor + '/` — que é do sistema, e não da escola. '
              + 'Se for OUTRA pessoa, acrescente um sobrenome ou um apelido que a distinga. Se for '
              + 'a mesma, o cadastro não se refaz por aqui: escreva para a administração do '
              + 'Sistema Lastro' + (contacto ? ' (' + contacto + ')' : '')
              + ' e peça a escola nova com este professor.'
            : 'já existe o professor "' + quem + '" na pasta `professores/' + professor + '/`. Se for OUTRA pessoa, informe um sobrenome ou apelido diferente; se for a mesma, use «usar este professor».',
          colisao: colisao.slug,
          procuraAAdministracao: origem === 'publico' ? true : undefined,
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
      nomeDeExibicao = professorNome + ' ' + professorSobrenome;
    }

    // O RESÍDUO DE UM EXPURGO ANTERIOR (19/10/2026). Uma escola que foi expurgada com a
    // metade do KV por terminar deixa chaves debaixo do MESMO slug. Criar a escola outra
    // vez com esse nome daria uma escola nova a ler o dado antigo — as anamneses e o plano
    // de ontem apareceriam na estante de hoje, e o teste mediria ficção. Nada aqui adivinha:
    // o elo do expurgo diz que ficou pendente, e a escola não nasce até isso se resolver.
    // A saída é a retomada (`POST /api/expurgar-kv`) — ou outro nome de escola.
    const slugPedido = slugificar(nome);
    if (slugPedido) {
      // Falha ao LER o índice não trava a criação: a trava é contra um resíduo CONHECIDO, e
      // um erro de rede no GitHub não pode impedir uma escola de nascer. A guarda é do
      // dado, não do acaso.
      let pendente = null;
      try {
        pendente = await pendenciaDoKv({
          token: env && env.GITHUB_TOKEN, dono: DONO, repo: REPO, ref: REF, slug: slugPedido,
        });
      } catch (err) { pendente = null; }
      if (pendente) {
        return new Response(JSON.stringify({
          ok: false,
          erro: 'a escola "' + slugPedido + '" já existiu, e o expurgo dela deixou chaves no KV ' +
            (pendente.em ? '(desde ' + pendente.em + ')' : '') + '. Criar outra com o mesmo ' +
            'nome faria a escola nova ler o dado antigo. Termine o expurgo' +
            ' (POST /api/expurgar-kv com a escola "' + slugPedido + '") — a limpeza volta a ' +
            'tentar quando a cota diária da enumeração do KV renovar — ou crie a escola com ' +
            'outro nome.',
          pendenciaKv: pendente,
          escola: slugPedido,
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
        });
      }
    }

    const escola = await criarEscola({
      nome,
      senhaAdmin,
      token,
      accountId: ACCOUNT_ID,
      githubToken: env && env.GITHUB_TOKEN,
      professorNome: nomeDeExibicao,
      // A PASTA vai declarada, não derivada do nome (17/10/2026): é ela que o motor usa em
      // `professores/<slug>/…`. Com o nome de exibição só, um «Tiago» curto produzia o slug
      // `tiago` e o PO ia para uma pasta fantasma.
      professorSlug: professor,
      senhaProfessor,
      professorEhDono,
      /* A ZONA DO ENDEREÇO PRÓPRIO (13/11/2026). Sem a `var`, o módulo usa o `padd.com.br`
       * desta casa — e a `var` existe para o dia em que houver mais do que uma zona. */
      zona: env && env.ZONA_ESCOLAS,
      /* O SHARD E O KV (15/11/2026). Com `SHARD_SCRIPT` no `env`, a escola nasce DENTRO do
       * shard — sem Worker próprio, com a identidade no KV dela e a rota a apontar ao script do
       * shard. Sem ele, o caminho é o de sempre (um Worker por escola), e nada muda para as
       * escolas que já existem. É a `vars` que decide, e ela é declarada no `wrangler.danca.jsonc`. */
      shardScript: String((env && env.SHARD_SCRIPT) || '').trim() || null,
      kv: env && env.PADD_KV,
    });
    // O motor completo nasce no workflow `criar-escola.yml` — a página só cria a escola
    // «zero» + segredos; o scaffold + o deploy do motor vêm do Actions. Sem GITHUB_TOKEN
    // na raiz, a escola nasce «zero» (sem o motor), e o campo `disparo` declara isso.
    const disparo = env && env.GITHUB_TOKEN
      ? await dispararCriacao({
          token: env.GITHUB_TOKEN,
          dono: 'tmenegaz',
          repo: 'danca',
          ref: 'main',
          inputs: {
            professor,
            // O NOME DE EXIBIÇÃO, não o primeiro nome. É ele que o scaffolder grava no
            // `indice.json` (`professor.nome`), e é DO ÍNDICE que a lista de professores da
            // página tira o nome que mostra. Com o primeiro nome só, dois homônimos
            // apareceriam os dois como «Tiago» — exatamente o que o sobrenome veio separar.
            'professor-nome': nomeDeExibicao,
            escola: escola.escola,
            'escola-nome': nome,
            responsavel: nomeDeExibicao,
            ciclo: '01',
            frequencia: '2x/semana',
            dias: '2@19:00,4@19:00',
            duracao: '60',
            'data-inicio': '',
            /* O SHARD VAI NO DISPARO. O workflow sobe o motor completo — e num shard o motor é
             * UM, o do shard. Sem este campo ele procuraria `wrangler.<escola>.jsonc` e subiria
             * mais um Worker, que é exactamente o que o shard existe para não haver. */
            shard: String((env && env.SHARD_SCRIPT) || '').trim(),
            /* A HABILIDADE QUE ELE DECLAROU NO CADASTRO (25/11/2026). Até aqui era um valor fixo
             * (`bale-classico`), porque quem criava era só a proprietária e ela é professora de
             * balé clássico. Com a página pública, quem declara é QUEM ENTRA — a decisão dela:
             * «agora ele é que vai determinar nesse cadastro». Vazio quando o professor já existe:
             * nesse caso o perfil dele já está escrito, e o scaffolder não lhe toca. */
            modalidade: cadastro.modalidade || '',
          },
        })
      : { ok: false, erro: 'GITHUB_TOKEN ausente na raiz' };

    // O DISPARO FALHOU ⇒ NÃO HÁ ESCOLA. Sem o workflow não há scaffold nem motor: o que
    // ficou no ar é o placeholder, a responder 200 no subdomínio de uma escola que não
    // existe. Antes disto, a resposta era 201 «escola criada» com um aviso em letra
    // pequena — e o órfão ficava. O rollback desfaz e a resposta passa a ser um ERRO,
    // porque não se criou nada.
    if (!disparo.ok) {
      const desfeito = await desfazerPlaceholder({
        token,
        accountId: ACCOUNT_ID,
        escola: escola.escola,
        nome,
      });
      return responderJson({
        ok: false,
        erro: 'o deploy do motor completo não foi disparado (' + (disparo.erro || ('HTTP ' + disparo.status)) + ') — nada foi criado',
        desfeito,
      }, 502);
    }

    /* O CADASTRO E A MENSAGEM, DEPOIS DE A ESCOLA EXISTIR (25/11/2026).
     *
     * A ORDEM É DELIBERADA: primeiro cria-se (e desfaz-se, se o disparo falhar), depois guarda-se o
     * cadastro, e só no fim se manda o correio. Invertida, um e-mail de boas-vindas poderia sair
     * para uma escola que o rollback desfez — e a pessoa procuraria um endereço que nunca existiu.
     *
     * NENHUMA DAS DUAS FAZ FALHAR A CRIAÇÃO. A escola está no ar; o que faltar viaja na resposta,
     * ao lado do sucesso, para a tela o poder dizer sem mentir sobre o que aconteceu. */
    const cadastroGravado = await gravarCadastro({
      env, escola: escola.escola, professor, cadastro, origem,
    });

    /* O ESTADO COMERCIAL, ESCRITO NO MESMO MOMENTO (25/11/2026).
     *
     * A escola nasce a `aguardando` — é o que a frase dela descreve: «Bateu na minha conta, eu
     * verifico e aí libero o acesso». A única excepção é o ensaio do proprietário, que já se
     * declara conciliado (`dispensarPagamento`) e nasce `ativa`: obrigá-la a habilitar à mão cada
     * escola de teste que ela cria seria transformar uma decisão comercial num obstáculo de
     * ensaio.
     *
     * NÃO FAZ FALHAR A CRIAÇÃO, e é a mesma regra do cadastro e do correio: a escola já está no
     * ar. O que faltar viaja na resposta, ao lado do sucesso. */
    const estadoComercial = escolha.pagamento === 'dispensado-pelo-proprietario' ? 'ativa' : 'aguardando';
    const comercialGravado = await gravarComercial(env && env.PADD_KV, escola.escola, {
      estado: estadoComercial,
      plano: escolha.plano,
      planoNome: escolha.planoNome,
      /* O PROFESSOR JUNTO (16/11/2026): é ele que a linha «a nascer» mostra enquanto o índice não
       * sabe da escola, e é o próprio facto que a criação já tem na mão. Guardá-lo aqui evita uma
       * leitura a mais no dia em que a lista precisa dele. */
      professor,
      valorCentavos: escolha.valorCentavos,
      valor: escolha.valor,
      periodicidade: escolha.periodicidade,
      capacidade: escolha.capacidade,
      extensoes: escolha.extensoes,
      pagamento: escolha.pagamento,
      origem,
      criadoEm: new Date().toISOString(),
      /* O RUN QUE VAI CONSTRUIR A ESCOLA (16/11/2026). Guardado no registo comercial porque é
       * ele que a lista das vivas lê para desenhar a linha «a nascer» — e é o que dá à pessoa um
       * endereço para onde olhar quando a fila do Actions não anda. `null` quando a leitura de
       * volta falhou, e a linha fica sem link em vez de com um link errado. */
      disparoRun: (disparo && disparo.run) ? disparo.run : null,
    }, origem);
    const correioEnviado = await mandarBoasVindas({
      env,
      escola: escola.escola,
      cadastro,
      url: escola.url,
      dominio: escola.dominio,
    });

    return responderJson(Object.assign({}, escola, {
      ok: true,
      disparo,
      cadastro: cadastroGravado,
      correio: correioEnviado,
      /* O ESTADO COMERCIAL VAI NA RESPOSTA, e com o valor: a tela que acabou de criar a escola
       * tem de dizer «aguardando conciliação, até 24 horas» — e não «escola criada» a seco, que
       * faria a pessoa tentar entrar num endereço que responde «a aguardar liberação». */
      comercial: comercialGravado.ok
        ? { estado: comercialGravado.comercial.estado, plano: escolha.plano,
            planoNome: escolha.planoNome, valor: escolha.valor }
        : { estado: null, erro: comercialGravado.erro },
      // A PORTA POR ONDE A ESCOLA NASCEU. É um facto da proveniência: um dia se pergunta «esta
      // escola entrou pelo consultor ou pela página dela?», e só o registo do momento o sabe.
      origem,
    }), 201);
  } catch (err) {
    const status = (err && err.etapa === 'existe') ? 409 : (err && err.etapa === 'slug') ? 400 : 500;

    // O ROLLBACK NÃO SE REPETE AQUI. `criarEscola` já desfez o que ela própria criou e
    // deixou o resultado em `err.desfeito` — chamar outra vez seria perguntar duas vezes a
    // mesma coisa e responder «não existia» sobre um Worker que ESTE pedido acabou de apagar
    // (a segunda leitura recebe 404). Um 409 e um 400 nunca chegam aqui com `desfeito`: no
    // primeiro o Worker é uma escola a sério; no segundo não há slug.
    const desfeito = (err && err.desfeito) || null;

    return new Response(JSON.stringify(Object.assign(
      { ok: false, erro: (err && err.etapa ? err.etapa + ': ' : '') + (err && err.message) },
      desfeito ? { desfeito } : {}
    )), {
      status,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }
}

/**
 * ONDE O CADASTRO FICA, E POR QUE NESTAS DUAS CHAVES (25/11/2026).
 *
 * A ESCOLA — `bastidores/<escola>/cadastro`. É o cofre do TENANT, e é de propósito: o expurgo
 * apaga `<escola>/` e `bastidores/<escola>/` (ver `prefixosDaEscola`), portanto o CNPJ, o e-mail e
 * o telefone da escola saem quando a escola sai. Um cadastro com dados pessoais que sobrevivesse
 * ao expurgo do cliente seria um resíduo — o pior tipo, porque ninguém o procura.
 *
 * O PROFESSOR — `professores/<slug>/contato`. É o contrário, e pela mesma razão que a habilitação
 * está em `professores/<slug>/perfil.json` (decisão de 03/11/2026): a pessoa é do SISTEMA, não do
 * tenant. Se o CPF e o telefone do professor morassem no cofre da escola, o fecho de uma escola
 * apagaria o contato da pessoa — e ela ficaria sem forma de ser encontrada para a próxima.
 *
 * NÃO SE SOBRESCREVE O QUE JÁ EXISTE PARA O PROFESSOR. Um professor que cria a SEGUNDA escola não
 * reescreve o próprio contato com o que veio digitado de novo (o reúso nem traz CPF); completar-se
 * o que falta é o que se faz, e nunca substituir o que lá está — a mesma regra do `perfil.json`.
 *
 * NADA AQUI FAZ FALHAR A CRIAÇÃO. A escola já existe quando isto corre; um erro de KV que subisse
 * faria a página responder «não foi possível criar» sobre uma escola que está no ar.
 */
async function gravarCadastro({ env, escola, professor, cadastro, origem }) {
  const kv = env && env.PADD_KV;
  const resultado = { escola: null, professor: null, erros: [] };
  if (!kv || typeof kv.put !== 'function') {
    resultado.erros.push('sem KV: o cadastro não foi guardado');
    return resultado;
  }
  const quando = new Date().toISOString();

  try {
    const chave = 'bastidores/' + escola + '/cadastro';
    const anterior = await kv.get(chave);
    let registo = {};
    try { registo = anterior ? JSON.parse(anterior) : {}; } catch (erro) { registo = {}; }
    const novo = Object.assign({}, registo, {
      escolaNome: cadastro.escolaNome || registo.escolaNome || null,
      cnpj: cadastro.cnpj || registo.cnpj || null,
      email: cadastro.escolaEmail || registo.email || null,
      telefone: cadastro.escolaTelefone || registo.telefone || null,
      origem: registo.origem || origem || null,
      criadoEm: registo.criadoEm || quando,
      atualizadoEm: quando,
    });
    await kv.put(chave, JSON.stringify(novo));
    resultado.escola = chave;
  } catch (erro) {
    resultado.erros.push('cadastro da escola: ' + ((erro && erro.message) || String(erro)));
  }

  /* O CONTATO DO PROFESSOR GRAVA-SE QUANDO HÁ QUALQUER COISA A GRAVAR (16/11/2026).
   *
   * A condição era `cadastro.professorEmail` — só o e-mail abria a porta. Nasceu quando o e-mail
   * era o que a mensagem de boas-vindas precisava; mas o `contato` passou a ser a ficha da PESSOA
   * (nome completo, CPF, telefone) e a ser lido pela Produção, para o cadastro do professor
   * mostrar o que a criação recolheu. Com um CPF e um telefone e sem e-mail, a ficha não existia
   * — e a tela não tinha o que mostrar, o que se lê como «o dado não foi guardado».
   *
   * O que continua a decidir o ENVIO da mensagem é o `destinatarios`, no núcleo, e não esta
   * linha: gravar a ficha e mandar correio são coisas diferentes. */
  if (professor && (cadastro.professorEmail || cadastro.cpf || cadastro.professorTelefone
    || cadastro.professorNomeCompleto)) {
    try {
      const chave = 'professores/' + professor + '/contato';
      const anterior = await kv.get(chave);
      let registo = {};
      try { registo = anterior ? JSON.parse(anterior) : {}; } catch (erro) { registo = {}; }
      const novo = Object.assign({}, registo, {
        nomeCompleto: cadastro.professorNomeCompleto || registo.nomeCompleto || null,
        cpf: cadastro.cpf || registo.cpf || null,
        email: cadastro.professorEmail || registo.email || null,
        telefone: cadastro.professorTelefone || registo.telefone || null,
        atualizadoEm: quando,
      });
      if (!novo.criadoEm) novo.criadoEm = quando;
      await kv.put(chave, JSON.stringify(novo));
      resultado.professor = chave;
    } catch (erro) {
      resultado.erros.push('contato do professor: ' + ((erro && erro.message) || String(erro)));
    }
  }
  return resultado;
}

/**
 * O ESTADO COMERCIAL DA ESCOLA — onde ele vive, e o que ele decide (25/11/2026).
 *
 * A DECISÃO DELA, e é a regra inteira: «a conciliação bancária é feita por mim, é feita
 * manualmente. […] Bateu na minha conta, eu verifico e aí libero o acesso. E o tempo para fazer
 * isso é de até 24 horas. Depois que eu libero, aí sim é que a pessoa vai ter acesso total […]
 * Se eu desabilitar, sai do ar a escola imediatamente e só tem acesso a ler as coisas que já
 * foram desenvolvidas […] mas fica impossível criar qualquer outro documento.»
 *
 * OS TRÊS ESTADOS, e o que cada um faz — a tradução exacta daquelas três frases:
 *
 *   `aguardando` — a escola nasceu e espera a conciliação. Ninguém entra: o endereço responde a
 *                  página de espera. É o estado de TODA escola criada por aqui, e é o que torna
 *                  «paguei» diferente de «liberaram».
 *   `ativa`      — liberada. Tudo funciona, como sempre funcionou.
 *   `suspensa`   — suspensa por falta de pagamento. As páginas abrem (o que já foi criado
 *                  continua a ler-se), e tudo o que ESCREVE é recusado.
 *
 * ONDE VIVE: `bastidores/<escola>/comercial`, no KV da casa. É o cofre do TENANT — o expurgo
 * apaga-o com o resto, e uma escola que já não existe não guarda estado comercial nenhum. A
 * alternativa (o andaime `escolas-habilitadas.json`) foi DESCARTADA: é um ficheiro versionado que
 * ela edita à mão, e um estado que muda por clique não se edita à mão sem se esquecer de o fazer.
 *
 * A AUSÊNCIA DE REGISTO É `ativa`. É a decisão conservadora, e a única que não parte o que existe:
 * as escolas de antes desta versão não têm registo, e tratá-las como «aguardando» fechava-as todas
 * no dia do deploy. Um estado novo não se impõe ao passado — acrescenta-se.
 */
const ESTADOS_COMERCIAL = ['aguardando', 'ativa', 'suspensa'];

/** Quantos meses uma escola desabilitada espera antes de poder ser apagada. */
const MESES_DE_CARENCIA = 3;

/**
 * O REGIME DE TESTE — 5 MINUTOS, POR DECISÃO DELA (16/11/2026).
 *
 * «para fim de teste coloca `desabilitadaEm` + 5 minutos. depois a gente muda para 3 meses quando
 * for produção de verdade, com escolas de verdade.»
 *
 * UM INTERRUPTOR, e não uma data condicional espalhada: enquanto ele tiver minutos, a carência é
 * essa (`carenciaAte`); quando for `null`, voltam os três meses. É o MESMO número que a lista das
 * vivas mostra na coluna da carência e que a varredura do expurgo usa — de propósito, porque dois
 * prazos para a mesma pergunta é a escola a ser apagada numa data que a tela não anunciou.
 *
 * O QUE ESTE REGIME CUSTA, e é bom que esteja escrito: uma escola suspensa por engano é apagada
 * cinco minutos depois. Com uma escola de verdade no sistema, `null` primeiro — a suspensão deixa
 * de ser reversível no instante em que o prazo é curto.
 */
const CARENCIA_DE_TESTE_MINUTOS = 5;

/**
 * O RELÓGIO DA RÉGUA DE TESTE — e a razão de ele existir (16/11/2026).
 *
 * UMA RÉGUA NOVA NÃO SE APLICA AO PASSADO. Quando esta versão for implantada, há escolas que já
 * estão `suspensa` — a `breu`, que ela desabilitou hoje a testar o acesso. Com cinco minutos de
 * carência, a primeira passagem do Cron apagava-as **cinco minutos depois de o código subir**, e
 * sem ela ter pedido isso a nenhuma delas: o pedido foi «para fim de teste coloca 5 minutos», e
 * não «apaga o que já estava desligado».
 *
 * A REGRA, e é a mesma que o ficheiro já usa para o estado comercial («um estado novo não se
 * impõe ao passado; acrescenta-se»): a carência de teste conta de `desabilitadaEm` **e** de o
 * regime existir. Quem foi suspenso antes do regime é poupado, com o motivo escrito, e passa a
 * contar quando for desabilitado outra vez — que é um gesto dela, e não um efeito de um deploy.
 *
 * SÓ VALE NO REGIME DE TESTE. Em produção a carência é de três meses, e uma escola desligada há
 * dois anos tem de poder ser apagada no primeiro dia do regime novo — aí o passado não é uma
 * armadilha, é história.
 */
const CHAVE_DO_REGIME = 'expurgo/regime-de-teste-desde';

/**
 * O que a carência vale AGORA, em milissegundos — ou `null` quando são meses.
 *
 * A RÉGUA É UM PARÂMETRO, e o valor por omissão é o do `env` desta casa. Foi assim que a regra de
 * produção continuou a poder ser AFIRMADA enquanto o regime é o de teste: uma prova que só sabe
 * medir o regime ligado não sabe dizer se o desligado está certo — e o desligado é o que vai
 * apagar escolas a sério.
 */
function carenciaEmMs(minutos) {
  const escolhido = minutos === undefined ? CARENCIA_DE_TESTE_MINUTOS : minutos;
  if (escolhido === null || escolhido === false) return null;
  const n = Number(escolhido);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 60 * 1000);
}

/** A carência em texto, para o relatório do expurgo dizer com que régua mediu. */
function descricaoDaCarencia(minutos) {
  const ms = carenciaEmMs(minutos);
  if (ms === null) return MESES_DE_CARENCIA + ' meses';
  return Math.round(ms / 60000) + ' minutos (regime de teste)';
}

/**
 * A CARÊNCIA CONTA DA DESABILITAÇÃO, e não da criação (25/11/2026).
 *
 * «O apagar aquela escola só vai poder contar se do tempo em que ela foi desabilitada […] a partir
 * dessa data conta três meses e ela vai estar disponível lá no botão de apagar escola.»
 *
 * O `desde` do andaime (§17.5) era escrito à mão; este é o mesmo prazo a contar de um facto que o
 * sistema registou sozinho — `desabilitadaEm`, gravado no instante em que ela é suspensa. A
 * diferença importa: uma data escrita à mão envelhece mal, e a pergunta «há quanto tempo esta
 * escola não paga?» passa a ter uma resposta que não depende de ninguém se lembrar.
 */
/**
 * Quando é que uma escola desabilitada passa a poder ser apagada — `null` se nunca foi.
 *
 * TRÊS MESES É UM MÊS DO CALENDÁRIO, e não 91 dias. A diferença aparece no exemplo dela: uma
 * escola desabilitada a 12/01/2027 tem de ficar apagável a 12/04/2027, e 91 dias dariam 13/04 —
 * um dia a mais, todos os anos, com um em cada quatro a errar por dois. `setUTCMonth` faz a conta
 * que se faz à mão, e o prazo passa a ser o que ela disse.
 *
 * O DIA 31 TEM UMA RESPOSTA SÓ, e o JavaScript já a dá: 31/01 + um mês é 03/03 (o dia que não
 * existe transborda para o mês seguinte). É o comportamento certo para um prazo — nunca encurta a
 * carência, que seria negar o prazo que se prometeu.
 */
function carenciaAte(desabilitadaEm, opcoes) {
  const inicio = new Date(String(desabilitadaEm || ''));
  if (!Number.isFinite(inicio.getTime())) return null;
  const emMinutos = carenciaEmMs(opcoes && opcoes.minutos !== undefined ? opcoes.minutos : undefined);
  /* O REGIME DE TESTE ATALHA AQUI, e não numa segunda função: a conta dos meses e a conta dos
   * minutos respondem à MESMA pergunta, e duas funções deixariam a tela a usar uma e o expurgo a
   * outra — que é o defeito que se está a corrigir, mudado de sítio. */
  if (emMinutos !== null) return new Date(inicio.getTime() + emMinutos).toISOString();
  const fim = new Date(inicio.getTime());
  fim.setUTCMonth(fim.getUTCMonth() + MESES_DE_CARENCIA);
  return fim.toISOString();
}

/**
 * O REGIME DE TESTE, EM HORAS — desde quando esta régua vale (16/11/2026).
 *
 * Lido por QUATRO chamadores: a varredura agendada, a lista do botão «Apagar escola», a rota que
 * apaga à mão e a tabela das vivas (a etiqueta «pode apagar»). Se cada um lesse a chave à sua
 * maneira, a lista diria «pode apagar» sobre uma escola que a rota recusa — que é exactamente a
 * divergência que se está a corrigir.
 *
 * A CHAVE É ESCRITA NA PRIMEIRA LEITURA. A varredura corre de cinco em cinco minutos e seria ela
 * a escrevê-la; mas entre o deploy e a primeira passagem há uma janela, e nela a rota manual
 * contaria a carência de uma escola suspensa ANTES do regime — apagando-a por um prazo que nunca
 * lhe foi prometido. Quem lê, grava: a janela fecha-se no primeiro pedido de qualquer um dos
 * chamadores.
 *
 * SÃO QUATRO, e o quarto entrou com a etiqueta da tabela das vivas (16/11/2026): a varredura
 * agendada, a lista do botão «Apagar escola», a rota que apaga à mão e a lista das vivas — que
 * mostra a mesma resposta no mesmo minuto, e por isso tem de medir com a mesma régua.
 */
async function regimeDeTeste(kv, agora) {
  if (carenciaEmMs() === null) return null;
  if (!kv || typeof kv.get !== 'function') return null;
  try {
    const guardado = await kv.get(CHAVE_DO_REGIME);
    if (guardado) return String(guardado);
    const marco = new Date(agora || Date.now()).toISOString();
    await kv.put(CHAVE_DO_REGIME, marco);
    return marco;
  } catch (erro) { return null; }
}

/**
 * A REGRA DO EXPURGO — UMA, E TRÊS CHAMADORES (16/11/2026).
 *
 * O QUE ELA VIU, e é o defeito inteiro: «Eu coloquei a escola em carência e aí ela ainda não tinha
 * vencido o prazo de 5 minutos […] E aí eu fui apagar e eu consegui expurgar a escola. Não é para
 * permitir expurgar a escola. […] Não pode existir uma regra e uma possibilidade de burlar a
 * regra.»
 *
 * A REGRA EXISTIA, E SÓ NUM DOS CAMINHOS. A varredura agendada (`expurgar`) cumpria a carência; a
 * rota manual (`/api/apagar-escola`) não perguntava nada — bastava escrever o slug na confirmação.
 * Duas opiniões sobre a mesma pergunta, e a que não perguntava era a que estava à mão dela. Pior:
 * o comentário da rota dizia, com todas as letras, «aqui não há prazo a esperar» — uma decisão
 * escrita que deixou de ser verdade no dia em que a carência nasceu, e ninguém a releu.
 *
 * A REGRA, agora, é esta função. E são QUATRO os chamadores, porque quatro é o número de sítios
 * onde se decide «esta escola pode ser apagada?»: a lista que se mostra (`/api/escolas`), a rota
 * que apaga, a varredura que apaga sozinha, e a tabela das vivas — que não apaga nada, mas escreve
 * a etiqueta «pode apagar» ao lado da data. Uma cópia a mais é uma cópia a divergir, e foi uma
 * delas que deixou a etiqueta na escola re-habilitada.
 *
 * O QUE SÓ SE APAGA: a escola `suspensa` cuja carência venceu.
 *
 *   · `ativa` — está a pagar. Apagá-la seria apagar o que está a ser usado, e ela disse-o: «a
 *     escola que tá habilitada também não pode nem aparecer na lista para expurgar».
 *   · `aguardando` — nunca teve o pagamento conciliado; não é «parou de pagar», é «ainda não
 *     começou». A carência é o prazo de quem trabalhou e deixou de pagar, e esta não trabalhou.
 *   · `suspensa` dentro da carência — é o caso dela, e o motivo de tudo isto. A carência é um
 *     prazo que se promete; prometê-lo e não o cumprir é a regra a poder ser burlada.
 *
 * `regimeDesde` é a terceira data: a carência de TESTE conta de `desabilitadaEm` **e** de o
 * regime existir, para uma régua nova não se aplicar ao passado (ver `CHAVE_DO_REGIME`).
 *
 * Devolve sempre a MESMA forma — a lista, a recusa e o relatório dizem a mesma coisa com ela:
 * `{ pode, estado, motivo, desabilitadaEm, carenciaAte, restanteMs }`.
 */
function estadoDoExpurgo(comercial, opcoes) {
  const agora = (opcoes && opcoes.agora) || Date.now();
  const regimeDesde = (opcoes && opcoes.regimeDesde) || null;
  const c = comercial || {};
  const estado = String(c.estado || ESTADOS_COMERCIAL[1] || 'ativa');
  const desabilitadaEm = c.desabilitadaEm || null;
  const base = {
    pode: false, estado, desabilitadaEm,
    carenciaAte: carenciaAte(desabilitadaEm), restanteMs: null,
    regimeDesde,
  };
  if (estado !== 'suspensa') {
    return Object.assign(base, {
      motivo: estado === 'aguardando'
        ? 'A escola aguarda conciliação do pagamento: ela nunca começou a pagar, e a carência é o '
          + 'prazo de quem parou de pagar.'
        : 'A escola está habilitada: apagá-la seria apagar o que está a ser usado.',
    });
  }
  if (!desabilitadaEm) {
    return Object.assign(base, {
      motivo: 'A escola está suspensa mas não tem data de desabilitação — não há prazo a contar.',
    });
  }
  if (regimeDesde && Date.parse(desabilitadaEm) < Date.parse(regimeDesde)) {
    return Object.assign(base, {
      motivo: 'A escola foi suspensa antes de este prazo existir — desabilite-a outra vez para a '
        + 'carência começar a contar.',
    });
  }
  const venceEm = base.carenciaAte ? Date.parse(base.carenciaAte) : NaN;
  if (!Number.isFinite(venceEm)) {
    return Object.assign(base, { motivo: 'A data de desabilitação está ilegível — não há prazo.' });
  }
  if (agora < venceEm) {
    return Object.assign(base, {
      carenciaAte: base.carenciaAte,
      restanteMs: venceEm - agora,
      motivo: 'A escola está em carência: o prazo vence ' + emDataHora(base.carenciaAte) + '.',
    });
  }
  return Object.assign(base, {
    pode: true,
    motivo: 'A carência venceu em ' + emDataHora(base.carenciaAte) + '.',
  });
}

/**
 * «16/11/2026 às 09:25» — a hora LOCAL, que é a de quem lê (16/11/2026).
 *
 * Aqui escrevia-se `… + ' UTC'` a partir dos getters de UTC. Era honesto e era ilegível: ela está
 * em Passo Fundo, leu «12:25» às 09:59 e concluiu que o relógio estava errado. A frase do prazo é
 * a única coisa que este texto tem de servir — «o prazo vence 16/11/2026 às 13:02» —, e uma frase
 * dessas tem de estar na hora de quem vai decidir se já pode apagar. A conversão mora em
 * `nucleo/fuso.js`; aqui só se pede.
 */
function emDataHora(iso) {
  return fuso.quandoLocal(iso);
}

/* =====================================================================================
 * O FINANCEIRO — a chave que recebe, e quem paga menos (25/11/2026).
 *
 * «Vamos criar aqui o botão da onde eu coloco a minha chave Pix […] é onde eu faço as minhas
 * configurações financeiras […] e também um lugar onde eu possa colocar desconto. […] para qual
 * escola eu tô concedendo desconto e quanto […] e também mostra quando eu concedi o desconto.»
 *
 * DUAS CHAVES, e o número delas é a decisão:
 *
 *   · `financeiro/pix` — UMA. Há um dono e uma conta. Guardar a chave por escola seria inventar
 *     dezenas de contas que não existem.
 *   · `financeiro/descontos` — UMA, com a lista dentro. O contrário (uma chave por desconto)
 *     obrigaria a enumerar o KV para desenhar a listagem, e a enumeração é o que estoura a cota
 *     diária — a lição de 18/10/2026, escrita no `AGENTS.md`. Uma leitura responde a «que
 *     descontos estão concedidos?», e nenhuma listagem acontece.
 *
 * A CHAVE DO PIX MUDOU DE CASA. Era só o segredo `PIX_CHAVE` do Worker; agora ela pede um ecrã
 * para a trocar, e um segredo não se muda por um ecrã. O segredo passa a ser o VALOR INICIAL: o
 * KV manda quando tem valor, o `env` responde quando o KV está vazio. Assim o que já está
 * configurado não se perde, e o ecrã não precisa de ser preenchido outra vez para a página
 * continuar a funcionar.
 * ===================================================================================== */

function chavePixNoKv() { return 'financeiro/pix'; }
function chaveDosDescontos() { return 'financeiro/descontos'; }

/** `[Preencher: …]` é lacuna, não valor — e uma lacuna nunca chega à tela como dado. */
function semLacuna(valor) {
  const t = String(valor == null ? '' : valor).trim();
  if (!t || /^\[Preencher/i.test(t)) return null;
  return t;
}

/** O PIX que a página mostra: o do KV quando existe, o do segredo quando ainda não há. */
async function lerPix(kv, env) {
  const doAmbiente = {
    chave: semLacuna(env && env.PIX_CHAVE),
    titular: semLacuna(env && env.PIX_TITULAR),
  };
  if (!kv || typeof kv.get !== 'function') return doAmbiente;
  try {
    const texto = await kv.get(chavePixNoKv());
    if (!texto) return doAmbiente;
    const guardado = JSON.parse(texto);
    /* O REGISTO DO KV É A VERDADE INTEIRA, e não campo a campo (25/11/2026).
     *
     * A primeira versão fazia `semLacuna(guardado.titular) || doAmbiente.titular` — e quem
     * apagasse o titular no ecrã via reaparecer o do segredo. Num ecrã de pagamento isso é uma
     * atribuição errada: uma chave NOVA com o nome de quem recebia a ANTIGA. Se há registo, é ele
     * que vale; um campo em branco no registo é uma resposta («não tem titular declarado»), não
     * uma ausência que se preenche com outra coisa. */
    return {
      chave: semLacuna(guardado.chave) || null,
      titular: semLacuna(guardado.titular) || null,
      atualizadoEm: guardado.atualizadoEm || null,
    };
  } catch {
    return doAmbiente;
  }
}

/** Grava a chave Pix. O que ela escreve passa a ser o que a página mostra. */
async function gravarPix(kv, { chave, titular }, quem) {
  if (!kv || typeof kv.put !== 'function') return { ok: false, erro: 'sem KV nesta ligação' };
  const limpa = semLacuna(chave);
  if (!limpa) return { ok: false, erro: 'informe a chave Pix que vai receber os pagamentos' };
  const registo = {
    chave: limpa,
    titular: semLacuna(titular),
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: quem || null,
  };
  try {
    await kv.put(chavePixNoKv(), JSON.stringify(registo));
    return { ok: true, pix: registo };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/**
 * Os descontos concedidos, do mais recente para o mais antigo.
 *
 * `escola` é o slug; `valorCentavos` é o desconto mensal. O registo guarda também `motivo`, porque
 * um valor sem razão é o que ninguém consegue rever seis meses depois — e a revisão é o ponto:
 * quem concede um desconto vai querer saber porquê.
 */
async function lerDescontos(kv) {
  if (!kv || typeof kv.get !== 'function') return [];
  try {
    const texto = await kv.get(chaveDosDescontos());
    if (!texto) return [];
    const guardado = JSON.parse(texto);
    const lista = Array.isArray(guardado.lista) ? guardado.lista : [];
    return lista.slice().sort((a, b) => String(b.em || '').localeCompare(String(a.em || '')));
  } catch {
    return [];
  }
}

/** Concede (ou substitui) o desconto de uma escola. */
async function concederDesconto(kv, { escola, valorCentavos, motivo }, quem) {
  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') {
    return { ok: false, erro: 'sem KV nesta ligação' };
  }
  const slug = String(escola || '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return { ok: false, erro: 'escolha a escola do desconto' };
  const centavos = Math.round(Number(valorCentavos));
  if (!Number.isFinite(centavos) || centavos <= 0) {
    return { ok: false, erro: 'o desconto tem de ser um valor maior do que zero' };
  }
  const lista = await lerDescontos(kv);
  /* UM DESCONTO POR ESCOLA, e o novo substitui o anterior. Dois descontos sobrepostos na mesma
   * escola não têm uma soma que signifique alguma coisa — e duas linhas na listagem para a mesma
   * escola obrigariam quem lê a decidir qual é a que vale. */
  const semEsta = lista.filter((d) => d.escola !== slug);
  const registo = {
    id: slug + '-' + Date.now(),
    escola: slug,
    valorCentavos: centavos,
    valor: comercial.reais(centavos),
    motivo: String(motivo || '').trim() || null,
    em: new Date().toISOString(),
    por: quem || null,
  };
  semEsta.unshift(registo);
  try {
    await kv.put(chaveDosDescontos(), JSON.stringify({ lista: semEsta.slice(0, 500) }));
    return { ok: true, desconto: registo, lista: semEsta };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/** Retira o desconto de uma escola. Apagar um benefício é um facto, e fica dito na listagem. */
async function retirarDesconto(kv, escola) {
  if (!kv || typeof kv.get !== 'function' || typeof kv.put !== 'function') {
    return { ok: false, erro: 'sem KV nesta ligação' };
  }
  const slug = String(escola || '').trim();
  const lista = await lerDescontos(kv);
  const ficam = lista.filter((d) => d.escola !== slug);
  if (ficam.length === lista.length) return { ok: false, erro: 'essa escola não tem desconto' };
  try {
    await kv.put(chaveDosDescontos(), JSON.stringify({ lista: ficam }));
    return { ok: true, lista: ficam };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}


function chaveComercial(escola) {
  return 'bastidores/' + String(escola || '').trim() + '/comercial';
}

/** Lê o estado comercial. Sem registo (ou ilegível) → `ativa`, e o motivo é dito no campo. */
async function lerComercial(kv, escola) {
  const vazio = { estado: 'ativa', motivo: 'sem registo comercial', plano: null, valor: null };
  if (!kv || typeof kv.get !== 'function' || !escola) return vazio;
  try {
    const texto = await kv.get(chaveComercial(escola));
    if (!texto) return vazio;
    const registo = JSON.parse(texto);
    const estado = ESTADOS_COMERCIAL.indexOf(String(registo.estado || '')) !== -1
      ? String(registo.estado) : 'ativa';
    return Object.assign({}, registo, { estado, motivo: null });
  } catch (erro) {
    return vazio;
  }
}

/**
 * Grava o estado comercial. O elo anterior NÃO se reescreve: os pagamentos acumulam.
 *
 * `opcoes.substituir` começa do ZERO, e existe por um caso só (16/11/2026): a RECRIAÇÃO de uma
 * escola apagada. O registo do KV é da encarnação ANTERIOR — tem o plano e o valor de então, a
 * `habilitadaEm` de outro tempo e a `desabilitadaEm` que levou ao expurgo. Herdá-lo faria a escola
 * recriada nascer com uma data de suspensão que já não é dela, e a coluna «Desabilitada» das vivas
 * passaria a mostrar o passado de uma escola que agora está a aguardar conciliação. A MEMÓRIA não
 * se perde: ela está no elo (`expurgo[]`, e a `recriacao[]` que o CI acrescenta), que é onde a
 * proveniência se guarda — o KV é estado, não história.
 */
async function gravarComercial(kv, escola, mudanca, quem, opcoes) {
  if (!kv || typeof kv.put !== 'function') return { ok: false, erro: 'sem KV' };
  const limpar = Boolean(opcoes && opcoes.substituir);
  const anterior = limpar
    ? { estado: ESTADOS_COMERCIAL[1] || 'ativa' }
    : await lerComercial(kv, escola);
  const agora = new Date().toISOString();
  const registo = Object.assign({}, anterior, mudanca, {
    estado: mudanca.estado || anterior.estado,
    atualizadoEm: agora,
    atualizadoPor: quem || null,
  });
  delete registo.motivo;
  /* A DATA DE CADA MUDANÇA DE ESTADO, guardada como facto próprio (25/11/2026).
   *
   * O histórico já tinha o «quando» de cada elo, mas ler a última transição de lá a cada linha de
   * uma tabela é varrer uma lista para responder a uma pergunta que tem uma resposta só. Dois
   * campos dizem-na diretamente:
   *
   *   · `habilitadaEm` — quando o acesso foi ABERTO pela última vez;
   *   · `desabilitadaEm` — quando foi FECHADO pela última vez. É daqui que conta a carência de
   *     três meses até a escola poder ser apagada.
   *
   * E eles NÃO se apagam um ao outro: uma escola que é suspensa hoje e habilitada amanhã tem as
   * duas datas verdadeiras, e a pergunta «já esteve suspensa?» continua a ter resposta. Só o campo
   * do estado que MUDOU é reescrito — carimbar os dois em cada mudança faria de cada um a data da
   * última coisa que aconteceu, que é o que o `atualizadoEm` já diz. */
  const estadoNovo = registo.estado;
  if (estadoNovo !== anterior.estado) {
    if (estadoNovo === 'ativa') registo.habilitadaEm = agora;
    if (estadoNovo === 'suspensa') registo.desabilitadaEm = agora;
  }
  // A PRIMEIRA VEZ numa escola nova: ela nasce `aguardando` e isso não é uma habilitação nem uma
  // suspensão. Só quando alguém ABRE o acesso é que existe uma data de abertura.
  if (estadoNovo === 'ativa' && !registo.habilitadaEm) registo.habilitadaEm = agora;
  /* O HISTÓRICO É A MEMÓRIA DO QUE ACONTECEU, e não o estado de agora. Cada mudança deixa um elo
   * — quem, quando, de que para quê, e por quanto. É a mesma disciplina da proveniência: um estado
   * que se sobrescreve não responde à pergunta «esta escola já esteve suspensa?». */
  const elo = {
    em: agora,
    para: registo.estado,
    por: quem || null,
    valor: mudanca.valorCentavos !== undefined ? mudanca.valorCentavos : null,
    nota: mudanca.nota || null,
  };
  const historico = Array.isArray(anterior.historico) ? anterior.historico.slice() : [];
  historico.push(elo);
  registo.historico = historico.slice(-60);
  if (!registo.criadoEm && mudanca.criadoEm) registo.criadoEm = mudanca.criadoEm;
  try {
    await kv.put(chaveComercial(escola), JSON.stringify(registo));
    return { ok: true, comercial: registo };
  } catch (erro) {
    return { ok: false, erro: (erro && erro.message) || String(erro) };
  }
}

/**
 * RECRIAR A ESCOLA A PARTIR DA PROVENIÊNCIA (16/11/2026).
 *
 * O QUE ELA DESCREVEU, e é o ciclo comercial inteiro: «a escola Duo agora está na lista de escolas
 * apagadas […] por causa da proveniência, temos todos os dados que a gente precisa para criar a
 * escola […] eu vou clicar então em recriar, e aí eu recrio a escola e vou mandar a chave Pix para
 * ele fazer o pagamento. Aí a escola vai estar lá nas escolas vivas, aguardando para ser
 * habilitada. Aí então, depois que eu fizer a conciliação bancária, eu vou lá e habilito a escola
 * e aí já está tudo certo.»
 *
 * O ELO TEM QUASE TUDO, e é de propósito que ele tenha: o slug, o professor (slug e nome), o
 * responsável, o ciclo e o `shard` sobrevivem ao expurgo porque são a memória de que a escola
 * existiu. O que ele **não** tem, e não pode ter, são as duas senhas: elas nunca estiveram no
 * repositório — só no Worker, como segredo, e nas chaves do KV como hash+sal.
 *
 * AS SENHAS, ENTÃO, TÊM DUAS ORIGENS, e a ordem é esta:
 *   1. as que vierem do pedido (a pessoa escolheu novas — é o caso de quem não se lembra);
 *   2. as que já estão no cofre (`bastidores/<escola>/dono`), quando o pedido vem sem senha. É o
 *      caso normal de uma escola de shard, onde o expurgo não apagou o KV: **o professor continua
 *      a entrar com a senha que já tinha**, e a recriação não inventa outra que ninguém sabe.
 *
 * Sem nenhuma das duas, a recriação RECUSA. Uma escola recriada sem senha é uma escola no ar que
 * não abre para ninguém — pior do que não ter sido recriada.
 *
 * O QUE NÃO SE FAZ AQUI: não se escreve no elo. A `recriacao[]` é escritura do `criar-escola.sh`
 * (que é quem vê o índice e regista «esta encarnação nasceu»), e escrevê-la daqui seria uma
 * segunda opinião sobre a mesma linha do tempo, a competir com o CI pelo mesmo commit.
 */
/**
 * O CONVITE — o clique «Recriar» passou a mandar um e-mail, e não a criar a escola (16/11/2026).
 *
 * O FLUXO QUE ELA DESENHOU, na letra: «quando eu clicar em recriar […] envia um e-mail para o
 * e-mail cadastrado da escola que a gente está recriando, tanto para o professor quanto para a
 * escola. Lá ele tem um link que acessa essa tela […] que ali ele escolhe o plano e ele cadastra a
 * senha. […] Aí ele envia […] Aí aguarda a conciliação.»
 *
 * PORQUE É QUE A ESCOLA CRIA A PRÓPRIA SENHA, e é a decisão que faz este desenho valer: a senha
 * antiga não serve (o expurgo levou-a, numa escola de Worker próprio), e a nova não deve passar
 * pela mão de ninguém. Quem a escreve é quem vai usá-la, no navegador de quem vai usá-la.
 *
 * O QUE ESTA FUNÇÃO NÃO FAZ, e é deliberado: não cria nada. Ela só emite o convite. A escola é
 * criada quando o professor submeter a página — e é isso que separa «eu convidei» de «a escola
 * existe», que eram a mesma coisa na versão anterior e não deviam ser.
 *
 * AS GUARDAS SÃO AS DA RECRIAÇÃO, e são as mesmas funções: sem elo não há o que convidar; sem
 * expurgo não há o que recriar; recriada depois do expurgo, a escola já está viva; e o convite
 * anterior ainda aberto não é um erro — é um segundo e-mail com um link novo, que substitui o
 * Velho (um convite por escola, e o último é o que vale).
 */
async function criarConvite({ env, escola, por }) {
  const slug = String(escola || '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return { ok: false, status: 400, erro: 'slug de escola inválido' };
  const ghToken = env && env.GITHUB_TOKEN;
  if (!ghToken) return { ok: false, status: 500, erro: 'GITHUB_TOKEN ausente no Worker' };

  const elo = await eloDaEscola({ token: ghToken, slug });
  if (!elo) {
    return {
      ok: false, status: 404,
      erro: 'a escola «' + slug + '» não tem elo (`escola/' + slug + '/indice.json`) — sem '
        + 'proveniência não há o que recriar. Para uma escola nova, use «Criar nova escola».',
    };
  }
  const expurgos = Array.isArray(elo.expurgo) ? elo.expurgo : [];
  if (!expurgos.length) {
    return {
      ok: false, status: 409,
      erro: 'a escola «' + slug + '» nunca foi apagada — não há convite a fazer. Ela está na '
        + 'lista das vivas.',
    };
  }
  const ultimoExpurgo = expurgos
    .map((e) => Date.parse((e && e.em) || ''))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => b - a)[0];
  const expurgadaEm = Number.isFinite(ultimoExpurgo) ? new Date(ultimoExpurgo).toISOString() : null;
  const comercialDaVez = await lerComercial(env && env.PADD_KV, slug);
  if (reconstruindo({ comercial: comercialDaVez, expurgada_em: expurgadaEm })) {
    return {
      ok: false, status: 409,
      erro: 'a recriação de «' + slug + '» já está em curso: o motor está a subir (leva dois ou '
        + 'três minutos) e a escola aparece nas vivas como «a nascer».',
    };
  }

  /* O NOME E OS DESTINATÁRIOS. O nome sai do cadastro quando ele reproduz o slug (é o mesmo
   * cuidado da recriação); sem cadastro, do slug. Os contactos saem do KV — e quando não há
   * nenhum, o convite NÃO falha: ele volta com o link, e ela manda-o por WhatsApp. */
  const cadastro = await lerCadastroDaEscola(env, slug);
  const nomeDoCadastro = String((cadastro && cadastro.escolaNome) || '').trim();
  const nome = (nomeDoCadastro && slugificar(nomeDoCadastro) === slug) ? nomeDoCadastro : tituloDoSlug(slug);
  const paraOMail = await cadastroParaOMail({ env, escola: slug, professor: (responsavelDoInventario(elo).slug || ''), nome, registo: cadastro });

  /* O TOKEN TEM DUAS PARTES, e cada uma resolve um problema: o SLUG à frente diz ao KV que chave
   * ler (sem enumerar o namespace); os 32 hex são o segredo, e só o hash deles fica guardado. */
  const segredo = convite.novoToken();
  const token = slug + '-' + segredo;
  const agora = new Date();
  const registo = {
    escola: slug,
    nome,
    hash: await convite.hashDoToken(segredo),
    criadoEm: agora.toISOString(),
    expiraEm: convite.validadeDe(agora),
    pedidoPor: por || null,
  };
  const kv = env && env.PADD_KV;
  if (!kv || typeof kv.put !== 'function') {
    return { ok: false, status: 500, erro: 'sem KV: o convite não pode ser guardado' };
  }
  try {
    await kv.put(chaveDoConvite(slug), JSON.stringify(registo));
  } catch (erro) {
    return { ok: false, status: 500, erro: 'não consegui guardar o convite: ' + ((erro && erro.message) || String(erro)) };
  }

  const link = urlDaPaginaPublica(env) + '/recriar/' + token;
  const mensagem = correio.comporConvite({
    escola: slug, nome, url: link, expiraEm: registo.expiraEm, dias: convite.DIAS_DE_VALIDADE,
  });
  mensagem.para = cadastroDaEscola.destinatarios(paraOMail);
  const desfecho = await correio.enviar({
    mensagem, chave: env && env.RESEND_API_KEY, de: env && env.CORREIO_DE,
  });
  if (!desfecho.enviado) {
    await correio.guardarNaCaixaDeSaida({ kv, escola: slug, mensagem, desfecho });
  }
  return {
    ok: true,
    escola: slug,
    nome,
    para: mensagem.para,
    /* O LINK SÓ VOLTA PORQUE A ROTA É DA PROPRIETÁRIA (atrás da senha da raiz). Quando o e-mail
     * não sai, é ele que ela manda à mão; quando sai, é a confirmação de para onde foi. */
    link,
    expiraEm: registo.expiraEm,
    expiraEmTexto: fuso.quandoLocal(registo.expiraEm),
    correio: { enviado: desfecho.enviado === true, motivo: desfecho.motivo || null, detalhe: desfecho.detalhe || null },
  };
}

/** A chave do convite no KV — do TENANT, para o expurgo da escola o levar com o resto. */
function chaveDoConvite(escola) {
  return 'bastidores/' + String(escola || '').trim() + '/convite';
}

/**
 * O CONVITE DE UM PEDIDO — lido do KV e conferido pelo núcleo.
 *
 * Devolve `{ ok, escola, registo }` ou `{ ok:false, motivo }`. Não distingue «não existe» de
 * «existe e não confere»: a frase é a mesma, e a diferença só ajudaria a quem está a adivinhar.
 */
async function lerConvite({ env, token }) {
  const kv = env && env.PADD_KV;
  if (!kv || typeof kv.get !== 'function') return { ok: false, motivo: 'sem KV neste Worker' };
  /* NÃO SE PROCURA POR TOKEN. O KV não sabe responder «qual é a escola deste hash» — e procurar
   * obrigaria a enumerar o namespace, que é a operação que estourou a cota em 18/10/2026. O token
   * leva o slug à frente: `<slug>-<32 hex>`. O slug não é segredo (está em tudo), o hash é — e o
   * que autentica continua a ser o hash. */
  const m = /^([a-z0-9][a-z0-9-]*)-([a-f0-9]{32})$/i.exec(String(token || ''));
  if (!m) {
    return { ok: false, motivo: 'O endereço do convite não está completo. Copie o link inteiro da mensagem.' };
  }
  const escola = m[1];
  const segredo = m[2];
  let registo = null;
  try {
    const texto = await kv.get(chaveDoConvite(escola));
    registo = texto ? JSON.parse(texto) : null;
  } catch (erro) { registo = null; }
  const estado = await convite.estadoDoConvite(registo, segredo);
  if (!estado.ok) return estado;
  return { ok: true, escola, registo, estado };
}

/**
 * O AVISO A QUEM CONCILIA — «A escola X contratou o serviço da Lastro» (16/11/2026).
 *
 * Vai para o endereço do proprietário (`CORREIO_DO_PROPRIETARIO`, com `lastro@padd.com.br` por
 * omissão), e leva o HORÁRIO DO CLIQUE e o nome da escola, que é o que permite achar o Pix no
 * extrato «por proximidade». Falhar aqui não desfaz o cadastro: a escola existe, e o desfecho é
 * dito na resposta.
 */
async function avisarOProprietario({ env, escola, nome, escolha, quando, professor, contactos, recriada }) {
  const para = String((env && env.CORREIO_DO_PROPRIETARIO) || 'lastro@padd.com.br').trim();
  const mensagem = correio.comporAvisoAoProprietario({
    escola,
    nome,
    plano: escolha.planoNome || escolha.plano,
    valor: escolha.valor,
    quando,
    quandoTexto: fuso.quandoLocal(quando),
    professor,
    contactos,
    recriada,
  });
  mensagem.para = [para];
  const desfecho = await correio.enviar({
    mensagem, chave: env && env.RESEND_API_KEY, de: env && env.CORREIO_DE,
  });
  if (!desfecho.enviado) {
    await correio.guardarNaCaixaDeSaida({
      kv: env && env.PADD_KV, escola: 'sistema', mensagem, desfecho,
    });
  }
  return Object.assign({ para }, desfecho);
}

/**
 * A PÁGINA DO CONVITE — `GET /recriar/<slug>-<segredo>` (16/11/2026).
 *
 * É pública, e é a coisa mais sensível que este Worker serve sem senha. O que a protege é o token:
 * `lerConvite` confere o hash, o prazo e o uso único antes de qualquer leitura de repositório — e
 * só com o convite válido é que se vê o nome da escola, os planos e a chave Pix.
 *
 * A PÁGINA NÃO DIZ QUANTAS SENHAS EXISTEM, nem quem é o professor, nem o valor pago antes: o que
 * ela mostra é o que o formulário precisa. Um convite que vazasse do e-mail dá a quem o tem o
 * direito de criar UMA senha nova e de pagar — não de ler o passado da escola.
 */
async function respostaDoConvite(request, env) {
  const token = decodeURIComponent(new URL(request.url).pathname.replace(/^\/recriar\//, '')).trim();
  const lido = await lerConvite({ env, token });
  if (!lido.ok) {
    return painel.resposta(painel.paginaDoConvite({
      escola: '', nome: '—', token: '', catalogo: null, pix: null, estado: lido,
    }), 404);
  }
  /* O NOME, do elo. Se o elo desaparecer entre o envio e a abertura, a página continua a abrir com
   * o nome que o convite guardou — o convite é do momento em que foi emitido, e não uma segunda
   * leitura de um dado que pode ter mudado. */
  const pix = await lerPix(env && env.PADD_KV, env);
  return painel.resposta(painel.paginaDoConvite({
    escola: lido.escola,
    nome: (lido.registo && lido.registo.nome) || lido.escola,
    token,
    catalogo: comercial.catalogoDaPagina(),
    pix,
    estado: { ok: true, expiraEm: lido.registo && lido.registo.expiraEm },
  }));
}

/**
 * O CADASTRO PELO CONVITE — `POST /api/recriar/<slug>-<segredo>` (16/11/2026).
 *
 * A ORDEM É DELIBERADA, e é a mesma da criação: cria-se, e só depois se avisa. O aviso ao
 * proprietário leva o HORÁRIO DO CLIQUE — o instante em que a escola submeteu —, porque é ele que
 * se compara com o extrato.
 *
 * O CONVITE É MARCADO COMO USADO DEPOIS DE A ESCOLA EXISTIR. Ao contrário (marcar primeiro) gastaria
 * o convite num erro de rede, e a escola ficaria sem link e sem escola. Se a marcação falhar depois
 * de a escola existir, o pior caso é um convite que ainda abre — e a segunda submissão é recusada
 * pela janela (`reconstruindo`), que já sabe que há uma recriação a caminho.
 *
 * O E-MAIL DE BOAS-VINDAS SAI DAQUI TAMBÉM, mas não o da recriação: quem manda o endereço é
 * `recriarEscola` (a mesma função da criação). Este acrescenta o aviso a quem concilia.
 */
async function receberOConvite(request, env) {
  const token = decodeURIComponent(new URL(request.url).pathname.replace(/^\/api\/recriar\//, '')).trim();
  const lido = await lerConvite({ env, token });
  if (!lido.ok) return responderJson({ ok: false, erro: lido.motivo }, 410);

  let corpo = {};
  try { corpo = await request.json(); } catch { corpo = {}; }
  const senhaAdmin = String((corpo && corpo.senhaAdmin) || '');
  const senhaProfessor = String((corpo && corpo.senhaProfessor) || '');
  if (!senhaAdmin.trim()) {
    return responderJson({ ok: false, erro: 'escreva a senha da escola — é ela que abre o acesso' }, 400);
  }
  const quando = new Date().toISOString();

  const feito = await recriarEscola({
    env,
    escola: lido.escola,
    plano: corpo && corpo.plano,
    extensoes: corpo && corpo.extensoes,
    senhaAdmin,
    senhaProfessor,
    origem: 'convite',
  });
  if (!feito.ok) {
    return responderJson({ ok: false, erro: feito.erro, semRecriar: true },
      feito.status || 500);
  }

  /* O CONVITE GASTOU-SE. A marcação é um facto do convite, e não da escola — por isso fica na
   * mesma chave, com o instante: é o que permite responder a «quando é que este link foi usado?». */
  const kv = env && env.PADD_KV;
  if (kv && typeof kv.put === 'function') {
    try {
      const novo = Object.assign({}, lido.registo, { usadoEm: quando, usadoPor: 'convite' });
      await kv.put(chaveDoConvite(lido.escola), JSON.stringify(novo));
    } catch (erro) { /* a escola já existe; o convite que fique aberto é o mal menor */ }
  }

  /* O AVISO A QUEM CONCILIA — «A escola X contratou o serviço da Lastro». Vai depois de a escola
   * existir, e não faz falhar nada: `avisarOProprietario` devolve o desfecho. */
  const paraOMail = await cadastroParaOMail({
    env, escola: feito.escola, professor: (feito.professor && feito.professor.slug) || '',
    nome: feito.nome, registo: null,
  });
  const aviso = await avisarOProprietario({
    env,
    escola: feito.escola,
    nome: feito.nome,
    escolha: feito.escolha,
    quando,
    professor: (feito.professor && feito.professor.nome) || null,
    contactos: cadastroDaEscola.destinatarios(paraOMail),
    recriada: true,
  });

  return responderJson(Object.assign({}, feito, {
    ok: true,
    quando,
    quandoTexto: fuso.quandoLocal(quando),
    aviso,
  }), 201);
}

async function recriarEscola({ env, escola, plano, extensoes, senhaAdmin, senhaProfessor, origem }) {
  const slug = String(escola || '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return { ok: false, status: 400, erro: 'slug de escola inválido' };
  const ghToken = env && env.GITHUB_TOKEN;
  const cfToken = env && env.CLOUDFLARE_API_TOKEN;
  if (!ghToken) return { ok: false, status: 500, erro: 'GITHUB_TOKEN ausente no Worker' };
  if (!cfToken) return { ok: false, status: 500, erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' };

  /* 1. O ELO. Sem ele não há proveniência, e «recriar» seria inventar uma escola com um nome que
   * já existiu — que é o oposto do que este botão faz. */
  const elo = await eloDaEscola({ token: ghToken, slug });
  if (!elo) {
    return {
      ok: false, status: 404,
      erro: 'a escola «' + slug + '» não tem elo (`escola/' + slug + '/indice.json`) — sem '
        + 'proveniência não há o que recriar. Para uma escola nova, use «Criar nova escola».',
    };
  }
  const expurgos = Array.isArray(elo.expurgo) ? elo.expurgo : [];
  if (!expurgos.length) {
    return {
      ok: false, status: 409,
      erro: 'a escola «' + slug + '» nunca foi apagada — não há nada a recriar. Ela está na '
        + 'lista das vivas.',
    };
  }
  const ultimoExpurgo = expurgos
    .map((e) => Date.parse((e && e.em) || ''))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a)[0];
  const ultimaRecriacao = (Array.isArray(elo.recriacao) ? elo.recriacao : [])
    .map((e) => Date.parse((e && e.em) || ''))
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => b - a)[0];
  if (Number.isFinite(ultimaRecriacao) && (!Number.isFinite(ultimoExpurgo) || ultimaRecriacao > ultimoExpurgo)) {
    return {
      ok: false, status: 409,
      erro: 'a escola «' + slug + '» já foi recriada depois do último expurgo: ela está viva, na '
        + 'lista das vivas. Recriar outra vez criaria uma segunda escola sobre a primeira.',
    };
  }
  /* A JANELA DA RECRIAÇÃO JÁ ABERTA — o clique repetido. O elo ainda diz «apagada» (o CI não
   * correu), mas o registo comercial já foi reescrito pela recriação anterior. Sem esta guarda,
   * dois cliques disparariam dois `criar-escola` sobre a mesma escola, e o segundo commit
   * encontraria o trabalho do primeiro pela metade. */
  const comercialDaVez = await lerComercial(env && env.PADD_KV, slug);
  const expurgadaEm = Number.isFinite(ultimoExpurgo) ? new Date(ultimoExpurgo).toISOString() : null;
  if (reconstruindo({ comercial: comercialDaVez, expurgada_em: expurgadaEm })) {
    return {
      ok: false, status: 409,
      erro: 'a recriação de «' + slug + '» já está em curso: o motor está a subir (leva dois ou '
        + 'três minutos) e a escola aparece nas vivas como «a nascer». Espere o índice do acervo '
        + 'ser regerado antes de tentar outra vez.',
    };
  }

  /* 2. QUEM, E COM QUE RÉGUA. O responsável sai do elo, pela função que o painel e as duas metades
   * do expurgo já usam — é a MESMA pessoa a quem o expurgo atribuiu os arquivos. */
  const quem = responsavelDoInventario(elo);
  if (!quem.slug) {
    return {
      ok: false, status: 409,
      erro: 'o elo de «' + slug + '» não diz de que professor é a escola — sem isso não se sabe '
        + 'em que pasta `professores/<slug>/` recriar. Corrija o elo primeiro.',
    };
  }
  const professorNome = quem.nome || tituloDoSlug(quem.slug);
  const ciclo = quem.ciclo || elo.ciclo || '01';
  const shard = String((elo.shard || '') || ((env && env.SHARD_SCRIPT) || '')).trim();

  /* 3. O NOME. O slug nasce do nome (`slugificar(nome)`), e o nome tem de o reproduzir — senão a
   * recriação criaria OUTRA escola, ao lado do elo. A ordem é: o nome que o cadastro guardou, se
   * ele reproduz o slug; senão, o título do próprio slug (é a volta de uma ida, como na criação). */
  const cadastro = await lerCadastroDaEscola(env, slug);
  const nomeDoCadastro = String((cadastro && cadastro.escolaNome) || '').trim();
  const nome = (nomeDoCadastro && slugificar(nomeDoCadastro) === slug)
    ? nomeDoCadastro
    : tituloDoSlug(slug);

  /* 4. O PLANO. O que a pessoa escolheu; na falta, o da encarnação anterior (é a mesma escola, e o
   * plano raramente muda com um expurgo no meio). Sem nenhum dos dois, RECUSA: a escola nasceria
   * sem valor, e a chave Pix que se manda a seguir não teria quantia. */
  const planoPedido = String(plano || '').trim() || String(comercialDaVez.plano || '').trim();
  /* AS EXTENSÕES VÊM DA PÁGINA DO CONVITE (16/11/2026): o plano diz quais existem, a escola diz
   * qual quer. Sem lista — a recriação pelo painel, ou o plano que só tem uma —, `validarEscolha`
   * aplica o que o plano inclui, que é o comportamento de antes. */
  const escolhaComercial = comercial.validarEscolha(
    { plano: planoPedido, extensoes }, { podeDispensar: false });
  if (!escolhaComercial.ok) {
    /* A MENSAGEM É A DO CATÁLOGO, e não uma segunda opinião escrita aqui: o plano que falta e a
     * extensão que o plano não inclui dizem-se com frases diferentes, e quem as sabe é quem tem a
     * tabela. O que se acrescenta é só o nome do plano que veio — o resto é do `comercial`. */
    const generica = 'escolha o plano da escola';
    const erro = String(escolhaComercial.erro || '').trim();
    return {
      ok: false, status: 400,
      erro: !planoPedido
        ? generica + ' — a recriação precisa dele para a chave Pix dizer o valor'
        : (erro && erro !== generica ? erro
          : 'o plano «' + planoPedido + '» não está no catálogo'),
    };
  }
  const escolha = escolhaComercial.escolha;

  /* 5. AS SENHAS. Ver o cabeçalho: as do pedido, ou as que já estão no cofre. */
  const senhaDaDirecao = String(senhaAdmin || '').trim();
  const senhaDoProfessor = String(senhaProfessor || '').trim();
  const cofre = await lerRegistoDoDono(env && env.PADD_KV, slug);
  const senhaNoCofre = Boolean(cofre && cofre.hash && cofre.sal);
  if (!senhaDaDirecao && !senhaNoCofre) {
    return {
      ok: false, status: 400,
      erro: 'informe a senha da direção: o cofre desta escola não tem nenhuma guardada (o expurgo '
        + 'levou o KV de um Worker próprio), e uma escola sem senha não abre para ninguém',
    };
  }
  /* A ESCOLA DE WORKER PRÓPRIO NÃO TEM ONDE GUARDAR «A SENHA ANTERIOR»: os segredos viviam no
   * Worker, e o Worker foi com o expurgo. Aí não há herança possível — pede-se, e diz-se por quê. */
  if (!shard && !senhaDaDirecao) {
    return {
      ok: false, status: 400,
      erro: 'esta escola não vive num shard: as senhas dela viviam no Worker, e o expurgo levou-as '
        + 'com ele. Informe a senha da direção (e a do professor) para a recriar.',
    };
  }

  /* 6. A ESCOLA. `criarEscola` recusa se já existir um Worker com o nome — é a segunda guarda
   * contra a recriação repetida, independente da janela acima. */
  let criada;
  try {
    criada = await criarEscola({
      nome,
      senhaAdmin: senhaDaDirecao || '',
      senhaProfessor: senhaDoProfessor || '',
      token: cfToken,
      accountId: ACCOUNT_ID,
      githubToken: ghToken,
      professorNome,
      professorSlug: quem.slug,
      professorEhDono: true,
      zona: env && env.ZONA_ESCOLAS,
      shardScript: shard || null,
      kv: env && env.PADD_KV,
    });
  } catch (err) {
    const status = (err && err.etapa === 'existe') ? 409 : 500;
    return {
      ok: false, status,
      erro: 'a recriação de «' + slug + '» não se completou: ' + ((err && err.message) || String(err)),
      desfeito: (err && err.desfeito) || null,
    };
  }

  /* 7. O MOTOR. Sem o disparo não há scaffold nem deploy — e a escola ficaria a responder num
   * endereço vazio. É a mesma regra da criação: falhando o disparo, desfaz-se e diz-se. */
  const disparo = await dispararCriacao({
    token: ghToken, dono: DONO, repo: REPO, ref: REF,
    inputs: {
      professor: quem.slug,
      'professor-nome': professorNome,
      escola: criada.escola,
      'escola-nome': nome,
      responsavel: professorNome,
      ciclo,
      /* OS PARÂMETROS DO CICLO RECRIADO SÃO OS DA CRIAÇÃO, e é declarado: o `.conf` da encarnação
       * anterior foi com o expurgo (era fonte, e a âncora o cobria), e a proveniência guarda o
       * facto de a escola ter existido — não os horários dela. O plano de ensino é reescrito pelo
       * professor, e é ele que fixa o que aqui são valores por omissão. */
      frequencia: '2x/semana',
      dias: '2@19:00,4@19:00',
      duracao: '60',
      'data-inicio': '',
      shard: shard || '',
      /* VAZIO: o professor JÁ EXISTE — a habilitação é da pessoa, e o perfil dela não foi apagado
       * com a escola (`professores/<slug>/perfil.json` sobrevive, por decisão de 03/11/2026). */
      modalidade: '',
    },
  });
  if (!disparo.ok) {
    const desfeito = await desfazerPlaceholder({
      token: cfToken, accountId: ACCOUNT_ID, escola: criada.escola, nome,
    });
    return {
      ok: false, status: 502,
      erro: 'o deploy do motor completo não foi disparado ('
        + (disparo.erro || ('HTTP ' + disparo.status)) + ') — a escola não foi recriada',
      desfeito,
    };
  }

  /* 8. O ESTADO COMERCIAL — `aguardando`, que é o que ela descreveu: a escola existe, e o acesso
   * abre quando o pagamento for conciliado. O registo começa do ZERO (`substituir`): o da
   * encarnação anterior é de outra escola, com outra data de suspensão. */
  const comercialGravado = await gravarComercial(env && env.PADD_KV, criada.escola, {
    estado: 'aguardando',
    plano: escolha.plano,
    planoNome: escolha.planoNome,
    valorCentavos: escolha.valorCentavos,
    valor: escolha.valor,
    periodicidade: escolha.periodicidade,
    capacidade: escolha.capacidade,
    extensoes: escolha.extensoes,
    pagamento: escolha.pagamento,
    /* O PROFESSOR VAI NO REGISTO, e é ele que a linha «a nascer» mostra enquanto o acervo não
     * reconhece a escola — a mesma razão da criação. */
    professor: quem.slug,
    origem: origem || 'recriacao',
    recriadaDe: ultimoExpurgo ? new Date(ultimoExpurgo).toISOString() : null,
    criadoEm: new Date().toISOString(),
    disparoRun: (disparo && disparo.run) ? disparo.run : null,
  }, 'recriacao', { substituir: true });

  /* 9. O CORREIO — a MESMA mensagem da criação, e pela mesma função (16/11/2026).
   *
   * «Sempre que for criado uma escola, tem que disparar um e-mail» — e uma escola recriada é uma
   * escola criada de novo: quem a recebe precisa do endereço, e não há outra altura em que o
   * receba. A mensagem não se altera: diz que a escola existe e onde se entra, e a senha é a que
   * foi escolhida (a herdada do cofre, ou a nova que ela deu). O que NÃO vai nela é a chave Pix —
   * essa é dela, e o valor vai na resposta para ela o escrever.
   *
   * O CADASTRO VOLTA A TOMAR A FORMA DA MENSAGEM. O que o KV guarda e o que a mensagem lê não têm
   * os mesmos nomes — `gravarCadastro` escreve `email` (da escola) e o contato do professor numa
   * chave à parte; `destinatarios` procura `escolaEmail` e `professorEmail`. Na criação isso não
   * aparecia porque a mensagem recebia o cadastro VALIDADO (que tem os dois nomes); aqui o que há
   * é o registo do KV. Sem esta costura, a recriação diria «não há e-mail a quem enviar» sobre uma
   * escola cujo e-mail está guardado a dois campos de distância — e ela testaria o envio e veria
   * silêncio.
   *
   * NÃO FAZ FALHAR A RECRIAÇÃO, e é a regra da criação: a escola já está no ar. O desfecho viaja
   * ao lado do sucesso — `enviado: false` com o motivo, e a mensagem guardada na caixa de saída
   * do tenant quando não saiu. Um sistema que diz «enviado» sem ter enviado gasta a confiança no
   * dia em que alguém procura a mensagem e não a encontra. */
  const correioEnviado = await mandarBoasVindas({
    env,
    escola: criada.escola,
    cadastro: await cadastroParaOMail({ env, escola: criada.escola, professor: quem.slug, nome, registo: cadastro }),
    url: criada.url,
    dominio: criada.dominio,
  });

  return {
    ok: true,
    escola: criada.escola,
    nome,
    url: criada.url,
    correio: correioEnviado,
    professor: { slug: quem.slug, nome: professorNome },
    ciclo,
    shard: shard || null,
    disparo,
    comercial: comercialGravado.ok
      ? { estado: comercialGravado.comercial.estado, plano: escolha.plano,
          planoNome: escolha.planoNome, valor: escolha.valor }
      : { estado: null, erro: comercialGravado.erro },
    /* O QUE ELA VAI FAZER A SEGUIR, e é o passo comercial que fechou o ciclo: mandar a chave Pix.
     * O valor vem daqui para ela não ter de o procurar noutra página. */
    aPagar: { valor: escolha.valor, valorCentavos: escolha.valorCentavos, plano: escolha.planoNome },
    /* O PLANO COMPLETO, PARA QUEM VAI AVISAR O PROPRIETÁRIO. A rota do convite compõe o aviso com
     * o nome do plano e o valor — e seria uma segunda conta recalculá-los lá. */
    escolha: { plano: escolha.plano, planoNome: escolha.planoNome, valor: escolha.valor,
      valorCentavos: escolha.valorCentavos },
    origem: origem || 'recriacao',
  };
}


/**
 * A IDENTIDADE ÚNICA DAS ENTIDADES — pelo CNPJ e pelo CPF (25/11/2026).
 *
 * «Agora que a gente tem mais informações a respeito […] a gente pode controlar melhor essa coisa
 * de n professores e n escolas e o relacionamento entre eles. Então, a gente tem CNPJ e a gente
 * tem CPF. Isso melhora muito a identidade e a criação da identificação única dessas entidades.»
 *
 * A REGRA É UMA, e o número é a chave: **um CNPJ é uma escola; um CPF é um professor.** Não é uma
 * proibição burocrática — é o que impede duas coisas que já aconteceram neste sistema: duas pastas
 * `professores/<slug>/` para a mesma pessoa (o CPF teria dito que era a mesma), e duas escolas com
 * o mesmo CNPJ, que no mundo real são a mesma escola com dois nomes.
 *
 * O QUE ACONTECE QUANDO BATE: RECUSA, com o caminho de saída dito. Para o professor, a saída é
 * BOA — «use o professor que já existe», que é o que o formulário já oferece. Para a escola, a
 * saída é o nome: duas escolas do mesmo CNPJ no protótipo são um ensaio, e o ensaio cria-se com
 * outro nome (é o que ela já faz com `calango`/`batata`/`breu`).
 *
 * A VARREDURA É DO ÍNDICE, e não de uma lista nova: `escolasDoIndice` já lê o acervo inteiro. O
 * CPF não está no índice (é dado pessoal, e a verificação 7 proíbe-o lá) — a conferência do CPF é
 * feita sobre o CONTATO no KV, e por isso ela só vê os professores desta casa.
 */
/* A VARREDURA DE NÚMEROS MUDOU DE CASA (16/11/2026). Ela vivia aqui, ao lado de quem a chamava,
 * e isso bastou enquanto só a criação de escola perguntava «este CNPJ já é de alguém?». Com o
 * cadastro do professor a poder corrigir um CPF na Produção, os dois sítios fazem a MESMA pergunta
 * — e passou a morar em `./unicidade.js`, que os dois alcançam. Ver o cabeçalho de lá. */
const { quemTemEsteNumero, cnpjJaUsado, cpfJaUsado } = require('./unicidade.js');

/**
 * O ENDEREÇO DE QUEM ADMINISTRA — para uma recusa ter para onde apontar (16/11/2026).
 *
 * Ele vem do `CORREIO_DE`, que já é o remetente declarado do sistema
 * (`Sistema Lastro <lastro@padd.com.br>`), e não de uma segunda `var`: dois endereços do mesmo
 * sistema divergiriam no dia em que um mudasse. Sem `CORREIO_DE`, devolve `null` e as mensagens
 * dizem «a administração do Sistema Lastro» sem inventar um endereço.
 */
function enderecoDaAdministracao(env) {
  const bruto = String((env && env.CORREIO_DE) || '');
  const dentro = /<([^>\s]+@[^>\s]+)>/.exec(bruto);
  if (dentro) return dentro[1];
  const solto = /[^\s<>,;]+@[^\s<>,;]+/.exec(bruto);
  return solto ? solto[0] : null;
}

/** O cadastro da escola, do KV. Devolve `null` quando não há (escola de antes desta versão). */
async function lerCadastroDaEscola(env, escola) {
  const kv = env && env.PADD_KV;
  if (!kv || typeof kv.get !== 'function' || !escola) return null;
  try {
    const texto = await kv.get('bastidores/' + escola + '/cadastro');
    return texto ? JSON.parse(texto) : null;
  } catch (erro) { return null; }
}

/**
 * O CADASTRO NA FORMA QUE A MENSAGEM LÊ (16/11/2026).
 *
 * OS DOIS NOMES DO MESMO DADO. `gravarCadastro` escreve no KV um registo com `email` (o da escola)
 * e guarda o contato do professor noutra chave, `professores/<slug>/contato`; `comporMensagem` lê
 * `escolaEmail` e `professorEmail`. Na CRIAÇÃO a diferença não se vê, porque a mensagem recebe o
 * cadastro VALIDADO — o objeto que o formulário produziu —, e é ele que tem os dois nomes. Uma
 * RECRIAÇÃO só tem o que está no KV, e sem esta costura os destinatários saíam vazios: «não há
 * e-mail a quem enviar» sobre uma escola cujo e-mail está guardado a dois campos de distância.
 *
 * A FUNÇÃO É UMA, e é de propósito — é a resposta a «quem recebe isto» quando a escola volta. Ela
 * não escreve nada e não inventa endereço: o que não existe fica `null`, e o `destinatarios` do
 * núcleo deduplica e descarta o vazio.
 */
async function cadastroParaOMail({ env, escola, professor, nome, registo }) {
  const daEscola = registo || (await lerCadastroDaEscola(env, escola)) || {};
  let contato = null;
  const kv = env && env.PADD_KV;
  if (professor && kv && typeof kv.get === 'function') {
    try {
      const texto = await kv.get('professores/' + professor + '/contato');
      contato = texto ? JSON.parse(texto) : null;
    } catch (erro) { contato = null; }
  }
  return {
    escolaNome: daEscola.escolaNome || nome || escola,
    escolaEmail: daEscola.email || daEscola.escolaEmail || null,
    professorEmail: (contato && contato.email) || daEscola.professorEmail || null,
  };
}

/**
 * A MENSAGEM DE BOAS-VINDAS, DEPOIS DE A ESCOLA EXISTIR (25/11/2026).
 *
 * «Sempre que for criado uma escola, tem que disparar um e-mail para o professor e para o e-mail
 * da escola. Mesmo que seja o mesmo e-mail cadastrado, aí dispara um só» — o `destinatarios` do
 * núcleo é quem deduplica, e é o mesmo que a composição usa.
 *
 * DEVOLVE O DESFECHO, e nunca lança: a escola está criada, e um erro de correio não pode
 * desfazer isso nem dizer que não foi criada. Sem `RESEND_API_KEY`, a mensagem é composta e
 * GUARDADA na caixa de saída do tenant, e o desfecho diz `enviado: false` com o motivo — para a
 * tela poder dizê-lo, e para não se perder o que se ia dizer a quem esperava a chave.
 */
async function mandarBoasVindas({ env, escola, cadastro, url, dominio }) {
  const mensagem = correio.comporMensagem({ cadastro, escola, url, dominio });
  if (!mensagem.para.length) {
    return { enviado: false, motivo: 'não há e-mail a quem enviar — o cadastro não trouxe nenhum' };
  }
  const desfecho = await correio.enviar({
    mensagem,
    chave: env && env.RESEND_API_KEY,
    de: env && env.CORREIO_DE,
  });
  /* A CAIXA DE SAÍDA GUARDA O QUE NÃO SAIU, e só isso. Guardar também o que saiu seria manter uma
   * segunda cópia do e-mail de quem recebeu — dado pessoal a mais — sem ninguém que a leia. */
  let caixa = null;
  if (!desfecho.enviado) {
    caixa = await correio.guardarNaCaixaDeSaida({ kv: env && env.PADD_KV, escola, mensagem, desfecho });
  }
  return Object.assign({ assunto: mensagem.assunto, endereco: mensagem.endereco }, desfecho,
    caixa ? { caixa } : {});
}

/**
 * COMO A PÁGINA SE APRESENTA — e a resposta é do ENDEREÇO por onde se entra (25/11/2026).
 *
 * A decisão dela: «a página danca.padd.com.br ela é só minha, só do proprietário do sistema […]
 * Essa página pública […] vai se chamar lastro.padd.com.br. E e aí ele acessa, ele tem essa mesma
 * página de apresentação […] só que o único botão que existe para ela é o de criar nova escola.»
 *
 * O QUE CONTA COMO O LADO DO PROPRIETÁRIO, e são dois endereços e não um:
 *
 *   · o `HOST_DONO` (por omissão `danca.padd.com.br`), que é a porta que ela usa;
 *   · qualquer `*.workers.dev` — o endereço TÉCNICO deste mesmo Worker. Ele responde no
 *     `danca.tmenegaz77.workers.dev` desde sempre e continuou a servi-la atrás da `SENHA_RAIZ`;
 *     passá-lo ao lado público seria fechá-la fora pela porta que ela usou até ontem. Não é uma
 *     porta a mais para ninguém: é a mesma, e a senha continua a ser pedida.
 *
 * TODO O RESTO É PÚBLICO — e é a direção conservadora certa. Um host desconhecido apontado a este
 * Worker recebe a apresentação e o formulário; não recebe o painel. O erro do outro lado (tratar
 * um endereço dela como público) custa-lhe um deploy; o erro deste lado (tratar um endereço
 * público como dela) custa a lista de escolas e o botão de apagar.
 *
 * A `var` `HOST_PUBLICO` NÃO ENTRA NESTA CONTA de propósito: ela é o endereço que se MOSTRA e
 * anuncia, não o critério. Um critério que dependesse de duas `var` errava em silêncio quando uma
 * delas fosse esquecida no deploy — e o silêncio, aqui, é o painel exposto.
 */
function hostDaRequisicao(request) {
  try {
    return String(new URL(request.url).hostname || '').trim().toLowerCase();
  } catch (erro) {
    return '';
  }
}

function hostDoProprietario(env) {
  const declarado = String((env && env.HOST_DONO) || '').trim().toLowerCase();
  return declarado || 'danca.padd.com.br';
}

function ehPaginaPublica(request, env) {
  const host = hostDaRequisicao(request);
  if (!host) return false;                    // sem host legível, não se inventa um modo
  if (host === hostDoProprietario(env)) return false;
  if (/\.workers\.dev$/.test(host)) return false;
  return true;
}

/** O nome de exibição do botão, para a página saber o que dizer sem perguntar duas vezes. */
function urlDaPaginaPublica(env) {
  const host = String((env && env.HOST_PUBLICO) || '').trim() || 'lastro.padd.com.br';
  return 'https://' + host;
}

/**
 * O QUE A PÁGINA PRECISA DE SABER — e o que ela NÃO precisa (25/11/2026).
 *
 * A LISTA DE HABILIDADES vem do catálogo, uma vez, para as duas portas. Sem ela a página teria uma
 * segunda cópia das modalidades — e a segunda cópia é a que fica velha quando o catálogo cresce.
 *
 * O QUE O MODO PÚBLICO **NÃO** DIZ: nada sobre escolas. Nem a lista, nem quantas são, nem os
 * nomes. A rota responde sem senha, e o que responde sem senha não pode conter o cadastro de
 * ninguém. É a mesma razão pela qual `/api/escolas` é recusada naquele endereço.
 */
async function respostaDaPagina(env, modo) {
  const habilidades = (require('../nucleo/perfil-do-professor.js').LISTA_DE_MODALIDADES || [])
    .map((m) => ({ id: m && m.id, nome: m && m.nome, temConteudo: Boolean(m && m.temConteudo) }))
    .filter((m) => m.id);
  /* A COMPOSIÇÃO COMERCIAL VAI NA MESMA RESPOSTA (25/11/2026), e pela mesma razão que as
   * habilidades: a página desenha os cartões, mas NENHUM preço está escrito nela. O exibido, o
   * calculado e o cobrado saem do mesmo JSON — é o que a frente L8 do planejamento pede, e é o que
   * impede um cartão a dizer R$ 69,90 sobre uma tabela que já diz outra coisa. */
  const catalogo = comercial.catalogoDaPagina();
  /* A CHAVE PIX VEM DE DOIS SÍTIOS, e a ordem entre eles é a regra (25/11/2026). Ela passou a ter
   * um ecrã onde é escrita — e um segredo do Worker não se muda por um ecrã. Então o ecrã grava no
   * KV, e o segredo passa a ser o VALOR INICIAL: o KV manda quando tem valor, o `env` responde
   * quando o KV está vazio. O que já está configurado não se perde, e o ecrã não precisa de ser
   * preenchido outra vez para a página continuar a cobrar.
   *
   * SEM CHAVE NENHUMA, A PÁGINA DIZ QUE NÃO ESTÁ CONFIGURADA em vez de mostrar uma de exemplo —
   * dinheiro enviado para o lado errado é o pior defeito possível num ecrã de pagamento. */
  const pix = await lerPix(env && env.PADD_KV, env);
  return new Response(JSON.stringify({
    ok: true,
    modo,
    publica: urlDaPaginaPublica(env),
    habilidades,
    planos: catalogo,
    pix: {
      chave: pix.chave || null,
      titular: pix.titular || null,
      conciliacao: 'manual',
      prazo: 'até 24 horas',
    },
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * TIRA DO HTML O QUE É SÓ DO PAINEL — e tira, não esconde (25/11/2026).
 *
 * A DECISÃO DELA, com a dúvida incluída: «na página lastro.padd.com.br remova o botão apagar
 * escola, […] ver só as apagadas não existe, ver só as vivas não existe e professores também não
 * existe. […] apenas oculta nesse domínio. Acho que já resolve. Não sei se dá para remover, não sei
 * de que maneira você fez.»
 *
 * DÁ PARA REMOVER, e passa a ser assim. A primeira versão escondia com
 * `[data-pagina="publica"] [data-dono] { display:none }` — o que funciona e é mais barato, mas
 * depende de a folha chegar, e uma folha em cache no navegador de quem já cá esteve mostra os
 * botões outra vez. Remover o elemento não depende de folha nenhuma: o que não vem no HTML não se
 * vê, e não se clica.
 *
 * A FOLHA GUARDA A REGRA ASSIM MESMO. Não é redundância inútil: é a segunda barreira, e é a que
 * vale enquanto o servidor antigo estiver no ar (o HTML já trazido e o CSS novo, ou o contrário).
 *
 * ISTO NÃO É PROTEÇÃO, e nunca foi: quem protege é a lista de caminhos do modo público, que
 * responde 404 a tudo o que não seja a apresentação e o criar. Um botão ausente é uma promessa que
 * não se faz, não uma porta que se fecha.
 *
 * O PARSER É MÍNIMO E ASSUME O QUE O FICHEIRO É: elementos com `data-dono` que NÃO estão uns dentro
 * dos outros (o marcador é do bloco, não da folha), e sem tags vazias do mesmo nome pelo meio. A
 * prova mede os dois lados — que saíram no público, e que ficaram no painel.
 */
const TAGS_VAZIAS = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);

function removerDoPainel(html) {
  const texto = String(html || '');
  let saida = '';
  let i = 0;
  const abertura = /<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\sdata-dono\b[^>]*>/g;
  while (i < texto.length) {
    abertura.lastIndex = i;
    const m = abertura.exec(texto);
    if (!m) { saida += texto.slice(i); break; }
    saida += texto.slice(i, m.index);
    const tag = m[1].toLowerCase();
    if (TAGS_VAZIAS.has(tag) || /\/>$/.test(m[0])) { i = m.index + m[0].length; continue; }
    // Procura o fecho desta tag, contando as aberturas e os fechos do MESMO nome.
    const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
    re.lastIndex = m.index + m[0].length;
    let profundidade = 1;
    let fim = texto.length;
    let achado;
    while ((achado = re.exec(texto)) !== null) {
      if (achado[1] === '/') {
        profundidade -= 1;
        if (profundidade === 0) { fim = achado.index + achado[0].length; break; }
      } else if (!/\/>$/.test(achado[0])) {
        profundidade += 1;
      }
    }
    i = fim;
  }
  return saida;
}

/**
 * SERVE A PÁGINA — a mesma nos dois endereços, com uma marca que diz qual é (25/11/2026).
 *
 * A APRESENTAÇÃO É UMA SÓ, e é isso que ela pediu: «ele tem essa mesma página de apresentação, o
 * que é o sistema Lastro, a logomarca, o título, a troca de cor, enfim, é exatamente como essa
 * daqui, só que o único botão que existe para ela é o de criar nova escola». Duas páginas seriam
 * duas apresentações do mesmo sistema, e a segunda ficaria para trás na primeira alteração.
 *
 * O QUE MUDA É A MARCA `<html data-pagina="…">` — E O NOME DELA NÃO É `data-modo`, e é de
 * propósito: `data-modo` já é a APARÊNCIA da casa (`clara`/`noturna`, com o `[data-modo="noturna"]`
 * da folha e o anti-flash que a escreve antes de pintar). Reusá-lo faria o botão do tema APAGAR a
 * marca da página ao primeiro clique, e a página pública passaria a mostrar o painel por causa de
 * uma troca de cor. Dois factos, dois atributos.
 *
 * A folha esconde, no modo público, as peças que só o painel tem (`[data-dono]`: «Apagar escola»,
 * «Professores», as listas, o reaproveitamento de professor). E o painel NÃO É INJETADO no modo
 * público — o bloco «Escolas do sistema» nem chega a ser composto, porque não há razão para o
 * compor e para o esconder a seguir.
 *
 * A MARCA É POSTA AQUI, e não no arquivo: o arquivo é regerado por `tools/gerar-raiz.sh` a partir
 * de `biblioteca/apresentacao.md`, e uma marca escrita lá dentro desapareceria na geração seguinte.
 */
/**
 * A MARCA DA PÁGINA, numa função — para a prova poder servir a página COMO O SERVIDOR A SERVE.
 *
 * Estava embutida no `servirAPagina`, e a prova que executava a página pública tinha de a repetir
 * de memória: escrevia o HTML do arquivo num `jsdom` sem a marca, e media o comportamento do
 * PAINEL a chamar-lhe «público». Uma prova que replica a transformação do servidor mede a
 * réplica — a marca passa a ser posta pela mesma linha que a põe em produção.
 */
function marcarPagina(html, publico) {
  return String(html || '').replace(/<html(\s[^>]*)?>/i, (achado, atributos) => {
    const limpos = String(atributos || '').replace(/\sdata-pagina="[^"]*"/i, '');
    return '<html' + limpos + ' data-pagina="' + (publico ? 'publica' : 'painel') + '">';
  });
}

async function servirAPagina(request, env, { modo }) {
  const publico = modo === 'publico';
  if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return new Response('não encontrado', { status: 404 });
  }
  const respostaDoAsset = await env.ASSETS.fetch(request);
  const tipo = respostaDoAsset.headers.get('Content-Type') || '';
  if (!respostaDoAsset.ok || !/text\/html/.test(tipo)) return respostaDoAsset;
  let html = await respostaDoAsset.text();

  html = marcarPagina(html, publico);

  /* NO MODO PÚBLICO O PAINEL NÃO É COMPOSTO. O bloco das escolas e o índice desta página são do
   * painel: compô-los para os esconder seria trabalho a fingir, e uma peça escondida é uma peça
   * que um dia alguém mostra sem querer. O marcador é o mesmo que o `gerar-raiz.sh` preserva. */
  if (!publico && html.indexOf(painel.MARCADOR) !== -1) {
    html = html.replace(painel.MARCADOR, painel.blocoDeEscolas());
    html = html.replace(painel.MARCADOR_INDICE, painel.indiceDaPagina(html));
  } else if (publico) {
    html = html.replace(painel.MARCADOR, '');
    html = html.replace(painel.MARCADOR_INDICE, '');
  }
  /* O QUE É DO PAINEL SAI DO HTML — ver `removerDoPainel`. Feito DEPOIS do painel, para o público
   * não compor blocos que ia deitar fora. */
  if (publico) html = removerDoPainel(html);

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

async function fetch(request, env) {
  const url = new URL(request.url);

  // A SAÚDE da raiz: identifica o Worker sem autenticação — o que revela é
  // público (o subdomínio já diz que é a raiz). Serve para conferir, com um
  // `curl`, que a ponte certa está no Worker `danca` depois de um deploy. Se a
  // ponte de escola (producao.js) tiver sido implantada na raiz por engano, é
  // o `/api/saude` DELA que responde — e a divergência aparece na hora.
  if (url.pathname === '/api/saude') {
    return new Response(JSON.stringify({ ok: true, tipo: 'raiz' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
    });
  }

  /* ── A PÁGINA PÚBLICA (25/11/2026) ──────────────────────────────────────────────────────────
   *
   * O MESMO Worker serve os dois endereços, e o que os separa é o HOST — ver `ehPaginaPublica`.
   * Aqui, no público, só passa o que é público: a apresentação, os assets, a criação de escola e a
   * saúde. TUDO O RESTO É RECUSADO, e a recusa é a mesma para todos os caminhos que não existem —
   * um 404 e não um 401 —, porque um 401 sobre `/api/apagar-escola` diria a quem tentasse que ali
   * há uma porta, e qual é.
   *
   * ISTO É A REGRA, E NÃO O ESCONDERIJO. A página pública não desenha os botões do painel (é o
   * `data-modo` que a folha esconde), mas esconder não é proteger: quem escrever o pedido à mão não
   * passa por aqui. As duas metades existem, e esta é a que vale.
   *
   * O QUE O PÚBLICO PODE FAZER A MAIS DO QUE VER: criar escola — e só com o cadastro completo, que
   * é o que a página dele recolhe (`exigirCadastro`). */
  if (ehPaginaPublica(request, env)) {
    /* O CONVITE DE RECRIAÇÃO PASSA AQUI, e é a ÚNICA porta pública que faz mais do que criar uma
     * escola (16/11/2026). Quem a abre é o professor, num link que chegou ao e-mail dele — não tem
     * a senha da raiz, e não deve ter. O que autentica é o token: 32 hex aleatórios, guardados
     * apenas como hash, com prazo e uso único (`nucleo/convite.js`). Sem token válido, a página
     * não tem formulário e o `POST` não cria nada. */
    const ehConvite = url.pathname.startsWith('/recriar/') && request.method === 'GET';
    const ehEnvioDoConvite = url.pathname.startsWith('/api/recriar/') && request.method === 'POST';
    const publicoPermitido = url.pathname === '/'
      || url.pathname === '/index.html'
      || url.pathname.startsWith('/assets/')
      || (url.pathname === '/api/criar-escola' && request.method === 'POST')
      || url.pathname === '/api/pagina'
      || ehConvite
      || ehEnvioDoConvite;
    if (!publicoPermitido) {
      return new Response('não encontrado', {
        status: 404,
        headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    if (url.pathname === '/api/pagina') {
      return await respostaDaPagina(env, 'publico');
    }
    if (url.pathname === '/api/criar-escola' && request.method === 'POST') {
      return responderCriacao(request, env, { origem: 'publico', exigirCadastro: true });
    }
    if (ehConvite) return await respostaDoConvite(request, env);
    if (ehEnvioDoConvite) return await receberOConvite(request, env);
    return servirAPagina(request, env, { modo: 'publico' });
  }

  if (!autorizado(request, env)) {
    return new Response('autenticação necessária', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="danca", charset="UTF-8"',
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });
  }

  // ── O PAINEL (22/10/2026) ─────────────────────────────────────────────────────────────────
  //
  // A raiz `danca` É o painel. Não há página-índice de secções e não há botão «Painel»: a
  // dona do produto contou os cliques — botão → índice de secções → «Abrir» → lista. A lista
  // vem na própria página `/`, abaixo dos dois botões que já existiam, e o menu tem a
  // logomarca.
  //
  // OS DADOS SÃO DO ÍNDICE VERSIONADO, numa requisição (`escolasDoIndice`). O registo é a
  // leitura do elo daquela escola — outro arquivo, outra requisição. Nada se gera por visita.
  //
  // AS ROTAS ANTIGAS CONTINUAM A RESPONDER (301). `/painel` esteve no ar por algumas horas e o
  // registo de uma escola é um endereço que se guarda e se cita — um link morto num documento
  // de proveniência é pior do que uma página a mais.
  const mApagadas = /^\/painel\/escolas-apagadas\/([a-z0-9-]+)$/.exec(url.pathname);
  if (mApagadas) {
    return new Response(null, {
      status: 301,
      headers: { Location: '/escolas-apagadas/' + mApagadas[1] },
    });
  }
  if (url.pathname === '/painel' || url.pathname === '/painel/escolas-apagadas') {
    return new Response(null, {
      status: 301,
      headers: { Location: url.pathname === '/painel' ? '/' : '/escolas-apagadas' },
    });
  }

  // A LISTA DOS PROFESSORES — a terceira, e a que atende «um professor, várias escolas».
  if (url.pathname === '/professores') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    try {
      // UMA leitura do acervo, e dele saem as duas partes: a lista de professores (que o índice
      // deriva das escolas e dos ciclos) e as escolas, para saber quais estão vivas.
      const acervo = await acervoDoIndice({ token });
      return painel.resposta(painel.paginaDosProfessores({
        professores: acervo.professores || [],
        escolas: acervo.escolas || [],
        // A ORDEM VEM DA URL, e a página valida-a contra a lista do que conhece. Um `?ordem=`
        // desconhecido cai na ordem padrão em vez de dar 400: a URL é um pedido de arrumação,
        // não um contrato.
        ordem: url.searchParams.get('ordem'),
      }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o índice: ' + ((err && err.message) || String(err))), 500);
    }
  }

  // AS DUAS LISTAS — «só as apagadas» e «só as vivas». A mesma leitura (uma requisição), o
  // mesmo recorte; quem filtra é a apresentação, porque o índice é a memória inteira e a lista é
  // escolha.
  /* O COFRE — a chave mestra, atrás da senha (15/11/2026).
   *
   * PORQUE É `POST`: a chave é a coisa mais sensível que este sistema tem — abre as anamneses de
   * todas as escolas. Um `GET /api/cofre?senha=…` deixaria a senha no histórico do navegador, nos
   * logs do Cloudflare e em qualquer `Referer`. No corpo, e com `Cache-Control: no-store`, a chave
   * existe uma vez, na resposta a um pedido que não se repete sozinho.
   *
   * A SENHA É A DA RAIZ (`SENHA_RAIZ`), e não um segredo novo: é a mesma pessoa que cria e expurga
   * escolas, e uma segunda senha para o mesmo privilégio seria mais uma coisa a perder.
   *
   * A COMPARAÇÃO É EM TEMPO CONSTANTE. Não porque um `===` de 20 caracteres seja atacável na
   * prática a 100.000 pedidos/dia, mas porque a diferença de custo é nenhuma e o hábito é o que
   * impede o próximo sítio de comparar segredos com `===` e achar que está bem.
   *
   * SEM MESTRA CONFIGURADA, DIZ-SE ISSO — e não se inventa uma chave. Um cofre que devolvesse uma
   * chave derivada do nada daria às escolas chaves que ninguém consegue reproduzir.
   */
  if (url.pathname === '/api/cofre' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const senha = String((corpo && corpo.senha) || '');
    const esperada = String((env && env.SENHA_RAIZ) || '');
    if (!esperada) {
      return new Response(JSON.stringify({ ok: false, erro: 'a raiz não tem senha configurada' }), {
        status: 500, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    if (!senha || !mesmoSegredo(senha, esperada)) {
      /* A MESMA RESPOSTA para senha errada e senha vazia: distinguir as duas diria a quem tenta que
       * existe uma senha que quase acertou. */
      return new Response(JSON.stringify({ ok: false, erro: 'senha da raiz não reconhecida' }), {
        status: 401, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    const mestra = String((env && env.SENHA_MESTRA) || '').trim();
    if (!mestra) {
      return new Response(JSON.stringify({
        ok: false,
        erro: 'este Worker não tem a chave mestra (SENHA_MESTRA) — configure-a antes de a querer ver',
      }), {
        status: 503, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    return new Response(JSON.stringify({
      ok: true, chave: mestra,
      /* A IMPRESSÃO DIGITAL vai junto: é o que se pode comparar num relatório sem mostrar a chave. */
      impressao: mestra.slice(0, 8),
      /* E O QUE ELA ABRE, dito na resposta — a tela não é o único consumidor desta rota. */
      abre: 'todas as escolas: a chave de cada uma é derivada desta',
    }), {
      status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  if (url.pathname === '/escolas-apagadas' || url.pathname === '/escolas-vivas') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    const apagadas = url.pathname === '/escolas-apagadas';
    try {
      // UMA leitura serve às duas coisas: a lista de escolas e o mapa slug→nome que ela usa para
      // mostrar a PESSOA em vez da pasta. `escolasDoIndice` já lê o acervo inteiro — pedir os
      // professores à parte seria uma segunda requisição para um dado que veio junto.
      /* AS VIVAS LEVAM O ESTADO COMERCIAL; AS APAGADAS LEVAM-NO SÓ PARA UMA COISA (16/11/2026).
       *
       * Uma escola expurgada não tem estado comercial — mas pode estar a ser RECRIADA, e nessa
       * janela o registo comercial é o único sítio que sabe disso (o elo só ganha `recriacao[]`
       * quando o CI corre). Uma leitura por linha apagada, para responder a UMA pergunta: «esta
       * linha já deixou de ser uma escola apagada?». É o preço da janela, e é o mesmo que a lista
       * das vivas já paga por linha.
       *
       * O CATÁLOGO VAI JUNTO: a coluna «Recriar» abre uma confirmação com o plano, e a lista de
       * planos é a do catálogo — a mesma que a página da criação mostra. Uma segunda lista de
       * preços seria uma segunda lista a divergir no dia em que o preço mudasse. */
      if (apagadas) {
        const [todas, professores] = await escolasDoIndice({ token });
        const escolas = [];
        for (const e of todas) {
          const c = await lerComercial(env && env.PADD_KV, e.slug);
          if (reconstruindo({ comercial: c, expurgada_em: e.expurgada_em })) continue;
          /* O PLANO ANTERIOR, e só ele: é o que a confirmação pré-selecciona, para a recriação
           * nascer com o mesmo plano — e o valor que a chave Pix vai pedir. O resto do registo
           * comercial (histórico, pagamentos, datas) não serve a esta lista e não viaja para o
           * HTML: a página de uma escola apagada não tem nada a habilitar. */
          escolas.push(Object.assign({}, e, {
            planoAnterior: (c && c.plano)
              ? { id: String(c.plano), nome: c.planoNome || null, valor: c.valor || null }
              : null,
          }));
        }
        const ordem = url.searchParams.get('ordem');
        return painel.resposta(painel.paginaDasApagadas({
          escolas, ordem, professores, catalogo: comercial.catalogoDaPagina(),
        }));
      }
      const [escolas, professores] = await escolasDoIndiceComComercial({ token, kv: env && env.PADD_KV });
      const ordem = url.searchParams.get('ordem');
      return painel.resposta(painel.paginaDasVivas({ escolas, ordem, professores }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o índice: ' + ((err && err.message) || String(err))), 500);
    }
  }

  const mRegistro = /^\/escolas-apagadas\/([a-z0-9-]+)$/.exec(url.pathname);
  if (mRegistro) {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return painel.resposta(painel.paginaSemToken(), 500);
    const slug = mRegistro[1];
    try {
      const indice = await eloDaEscola({ token, slug });
      // SEM ELO, SEM REGISTO. Uma página de «registo» para uma escola que nunca existiu é pior
      // do que um 404 — e o 404 custa UMA requisição, não a construção do acervo inteiro.
      if (!indice) return painel.resposta(painel.paginaDasApagadas({ escolas: [] }), 404);
      return painel.resposta(painel.paginaDoRegistro({ slug, indice }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível ler o registo de ' + slug + ': ' + ((err && err.message) || String(err))), 500);
    }
  }

  // O gatilho MANUAL do expurgo — a mesma função do Cron, mas chamável agora, atrás da
  // senha. Serve para testar sem esperar o Cron e para auditar: o que o Cron apagaria é
  // exatamente o que esta rota devolve.
  if (url.pathname === '/api/expurgar' && request.method === 'POST') {
    if (!env || !env.CLOUDFLARE_API_TOKEN) {
      return new Response(JSON.stringify({ ok: false, erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
    try {
      const relatorio = await expurgar(env);
      return new Response(JSON.stringify({ ok: true, ...relatorio }), {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, erro: (err && err.message) || String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
      });
    }
  }

  // OS PROFESSORES que já existem — o que impede duas pessoas de caírem na mesma pasta.
  // A lista sai do repositório (os diretórios `professores/<slug>/`), porque é lá que o nome
  // vira identidade: `professores/<slug>/` guarda o pacote, os cadernos e as âncoras, e é o
  // diretório que o PO e o plano usam. Duas pessoas com o mesmo slug — ou dois nomes que
  // produzem o mesmo slug — passam a ser uma só no registro.
  if (url.pathname === '/api/professores' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return responderJson({ ok: false, erro: 'GITHUB_TOKEN ausente no Worker' }, 500);
    try {
      // PELO ÍNDICE — a lista de professores era a varredura mais cara da raiz: a árvore inteira
      // mais uma leitura do inventário de cada escola do professor, a cada abertura da página.
      const r = await listarProfessoresPeloIndice({
        token, dono: DONO, repo: REPO, ref: REF,
        kv: env && env.PADD_KV,
        reconstruir: url.searchParams.get('reconstruir') === '1',
      });
      return responderJson({
        ok: true,
        fonte: r.doIndice ? (r.doCache ? 'indice-cache' : 'indice') : 'arvore',
        custo: r.custo,
        professores: r.professores,
      });
    } catch (err) {
      return responderJson({ ok: false, erro: (err && err.message) || String(err) }, 500);
    }
  }

  // A LISTA de escolas — what the «Apagar escola» button shows before anything is deleted.
  // Sai do repositório (os `wrangler.<slug>.jsonc`), que é o mesmo registro que o expurgo
  // edita: uma só definição de «escola», a que sobrevive ao expurgo como elo no índice.
  //
  // PELO ÍNDICE, E SÓ PELA ÁRVORE SE ELE NÃO HOUVER (20/10/2026). A página da raiz pede esta
  // lista a cada abertura; a varredura custava uma leitura da árvore do repositório por pedido.
  // O índice responde com uma leitura do KV — e é derivado, portanto perdê-lo custa uma
  // reconstrução, não um dado.
  // O DIAGNÓSTICO DO ENDEREÇO PRÓPRIO (14/11/2026) — «a próxima escola vai nascer com
  // `<escola>.padd.com.br`?», respondido ANTES de a criar. É leitura pura (dois pedidos à
  // Cloudflare, sem escrita), e existe porque o endereço falha em silêncio: o provisionamento não
  // lança por causa dele, e a resposta só diz «PENDENTE» depois de a escola existir. Sem isto,
  // descobrir que o token perdeu o `Zone → DNS → Edit` custa uma escola criada com o endereço
  // errado — foi o que aconteceu à `breu` em 13/11/2026.
  if (url.pathname === '/api/dominio' && request.method === 'GET') {
    try {
      const relatorio = await dominioDaEscola.diagnosticar({
        token: env && env.CLOUDFLARE_API_TOKEN,
        zona: env && env.ZONA_ESCOLAS,
      });
      return responderJson(relatorio, relatorio.ok ? 200 : 503);
    } catch (err) {
      return responderJson({ ok: false, erro: (err && err.message) || String(err) }, 500);
    }
  }

  /* A PÁGINA — o que ela precisa de saber para se desenhar, e nada mais (25/11/2026).
   *
   * Existe nos DOIS endereços, e de propósito: a mesma página corre nos dois, e a lista de
   * habilidades tem de lá estar nos dois. O que muda é o `modo` — e o modo do público vai na
   * resposta da rota pública (que responde sem senha, e por isso NÃO diz nada sobre escolas).
   * Aqui, do lado do painel, ela pode dizer tudo o que a página do painel usa. */
  /**
   * A HABILITAÇÃO, POR ESCOLA — o botão das «vivas» (25/11/2026).
   *
   * «Basta que eu acesse no meu ambiente […] o botão, a página das escolas vivas. E ali eu
   * habilito […] e também vai ter o botão de desabilitar.» É exactamente isso: uma rota, dois
   * sentidos, e a decisão sempre dela.
   *
   * A SENHA É A DA RAIZ, e não um segredo novo: quem chega aqui já passou pelo portão do Worker
   * `danca`, e este pedido vem da mesma sessão. É a mesma pessoa que cria e que expurga.
   *
   * O QUE GRAVA É UM ELO, e não uma sobrescrita (`gravarComercial`): o histórico diz quando a
   * escola esteve suspensa e por quanto foi habilitada. Uma escola desabilitada continua a
   * responder às leituras e recusa as escritas — a regra vive em `producao.js`, e o porquê está
   * lá escrito.
   */
  if (url.pathname === '/api/escola/comercial' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    /* SEM SEGUNDA SENHA, e é decisão: quem chega aqui já passou pelo portão da raiz — este
     * caminho não está na lista do público, e o `autorizado` correu no topo do `fetch`. O Cofre
     * pede a senha outra vez porque o que ele mostra é a chave de TODAS as escolas; habilitar uma
     * escola é uma decisão, não um segredo. Uma segunda pergunta por clique tornar-se-ia um
     * clique a mais que se aprende a dar sem ler. */
    const slug = String(corpo.escola || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return responderJson({ ok: false, erro: 'informe a escola' }, 400);
    }
    const estado = String(corpo.estado || '').trim();
    if (ESTADOS_COMERCIAL.indexOf(estado) === -1) {
      return responderJson({ ok: false, erro: 'estado inválido: use ' + ESTADOS_COMERCIAL.join(', ') }, 400);
    }
    if (!(env && env.PADD_KV)) {
      return responderJson({ ok: false, erro: 'PADD_KV ausente na raiz — sem ele não há estado comercial' }, 500);
    }
    const gravado = await gravarComercial(env.PADD_KV, slug, {
      estado,
      nota: String(corpo.nota || '').trim() || null,
      // O VALOR, quando ela o declara ao habilitar. É o que fica no elo: «habilitada em tal dia,
      // por R$ 99,90». Sem ele o elo diz que houve pagamento e não quanto — e a conta do mês
      // seguinte não se fecha.
      valorCentavos: Number.isFinite(Number(corpo.valorCentavos)) ? Number(corpo.valorCentavos) : undefined,
      valor: typeof corpo.valor === 'string' ? corpo.valor : undefined,
    }, 'proprietario');
    if (!gravado.ok) return responderJson({ ok: false, erro: gravado.erro }, 500);
    return new Response(JSON.stringify({
      ok: true,
      escola: slug,
      estado: gravado.comercial.estado,
      comercial: gravado.comercial,
    }), { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' } });
  }

  /* =====================================================================================
   * O FINANCEIRO — o ecrã onde ela põe a chave e concede descontos (25/11/2026).
   *
   * AS TRÊS ROTAS SÓ EXISTEM NO PAINEL. Elas não estão na lista do público, e a lista é uma
   * permissão: o que não está lá responde 404 em `lastro.padd.com.br`. Uma chave Pix publicada
   * numa página aberta é a conta dela à vista; um desconto publicado é a negociação de um cliente
   * à vista de outro.
   * ===================================================================================== */
  if (url.pathname === '/financeiro' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    try {
      // AS ESCOLAS VIVAS, pelas mesmas fontes que a lista das vivas usa (`escolasDoIndice` é lido
      // uma vez e serve à tabela e ao `<select>` do desconto) — é o que impede o formulário de
      // oferecer uma escola que já não existe.
      const [escolas, professores] = token
        ? await escolasDoIndice({ token })
        : [[], []];
      void professores;
      const pix = await lerPix(env && env.PADD_KV, env);
      const descontos = await lerDescontos(env && env.PADD_KV);
      const vivas = (escolas || []).filter((e) => !e.expurgada);
      return painel.resposta(painel.paginaFinanceira({ pix, descontos, escolas: vivas }));
    } catch (err) {
      return painel.resposta(painel.paginaSemToken(
        'não foi possível abrir o financeiro: ' + ((err && err.message) || String(err))), 500);
    }
  }

  if (url.pathname === '/api/financeiro/pix' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const gravado = await gravarPix(env && env.PADD_KV, {
      chave: corpo.chave,
      titular: corpo.titular,
    }, 'proprietario');
    if (!gravado.ok) return responderJson({ ok: false, erro: gravado.erro }, 400);
    return responderJson({ ok: true, pix: gravado.pix });
  }

  if (url.pathname === '/api/financeiro/desconto' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    /* O VALOR CHEGA EM REAIS (`69,90`) OU EM CÊNTIMOS. A página escreve reais porque é o que se
     * digita; o `centavos` do motor comercial é a única forma segura de somar. A conversão passa
     * pelo mesmo `centavos()` que a tabela de preços usa — duas conversões divergiriam no dia em
     * que uma delas arredondasse de outra maneira. */
    const valorCentavos = corpo.valorCentavos !== undefined
      ? Number(corpo.valorCentavos)
      : comercial.centavos(String(corpo.valor == null ? '' : corpo.valor).replace(',', '.'));
    const feito = await concederDesconto(env && env.PADD_KV, {
      escola: corpo.escola,
      valorCentavos,
      motivo: corpo.motivo,
    }, 'proprietario');
    if (!feito.ok) return responderJson({ ok: false, erro: feito.erro }, 400);
    return responderJson({ ok: true, desconto: feito.desconto, lista: feito.lista });
  }

  if (url.pathname === '/api/financeiro/desconto' && request.method === 'DELETE') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const feito = await retirarDesconto(env && env.PADD_KV, corpo.escola);
    if (!feito.ok) return responderJson({ ok: false, erro: feito.erro }, 400);
    return responderJson({ ok: true, lista: feito.lista });
  }

  if (url.pathname === '/api/pagina' && request.method === 'GET') {
    return await respostaDaPagina(env, 'painel');
  }

  if (url.pathname === '/api/escolas' && request.method === 'GET') {
    const token = env && env.GITHUB_TOKEN;
    if (!token) return responderJson({ ok: false, erro: 'GITHUB_TOKEN ausente no Worker' }, 500);
    try {
      const r = await listarEscolasPeloIndice({
        token, dono: DONO, repo: REPO, ref: REF,
        kv: env && env.PADD_KV,
        reconstruir: url.searchParams.get('reconstruir') === '1',
      });
      /* O ESTADO COMERCIAL VAI NESTA LISTA (25/11/2026), e não numa segunda chamada: o cartão do
       * «Apagar escola» passou a dizer se a escola pode ser apagada ou está em carência, e essa
       * resposta sai das mesmas duas datas que a lista das vivas mostra. Pedi-la à parte seria uma
       * segunda leitura do mesmo KV para desenhar a mesma linha.
       *
       * A LEITURA É POR ESCOLA, e é o preço de o estado morar no cofre de cada uma. Não é
       * enumeração: são as escolas do índice, e a lista já as tem na mão. */
      /* A JANELA DO CI, também aqui (16/11/2026): a lista do botão «Apagar escola» vem da mesma
       * fonte que a lista das vivas, e uma escola recém-criada tem de poder ser apagada sem se
       * esperar pelo workflow. Ver `escolasANascer`. */
      const aNascer = await escolasANascer({ kv: env && env.PADD_KV, conhecidas: r.escolas });
      const todas = r.escolas.concat(aNascer.map((e) => ({
        slug: e.slug, professor: e.professor, ciclo: null, total: 0,
      })));
      const escolasComComercial = [];
      for (const e of todas) {
        const c = await lerComercial(env && env.PADD_KV, e.slug);
        escolasComComercial.push({ e, c });
      }
      const nasceAgora = new Set(aNascer.map((e) => e.slug));
      /* O VEREDICTO DO EXPURGO VAI EM CADA LINHA (16/11/2026) — calculado pela MESMA função que a
       * rota de apagar usa. É esta a razão de o campo existir: a lista deixa de ter opinião
       * própria sobre quem pode ser apagado, e passa a mostrar o que o servidor faria. Quando os
       * dois eram separados, a lista oferecia a escola em carência e a rota a apagava. */
      const regimeDaLista = await regimeDeTeste(env && env.PADD_KV);
      return responderJson({
        ok: true,
        fonte: r.doIndice ? (r.doCache ? 'indice-cache' : 'indice') : 'arvore',
        custo: r.custo,
        carencia: descricaoDaCarencia(),
        /* QUE HORAS SÃO NA ESCOLA (16/11/2026). A página desenha a data da carência no fuso de quem
         * a abre, a menos que lhe digam qual é o da casa. Vai no corpo da resposta, e não numa
         * segunda chamada: é uma string, e a lista já está a ser servida. */
        fuso: { id: fuso.FUSO_PADRAO, rotulo: fuso.ROTULO_DO_FUSO, etiqueta: fuso.etiquetaDoFuso(new Date()) },
        escolas: escolasComComercial.map(({ e, c }) => {
          const veredicto = estadoDoExpurgo(c, { regimeDesde: regimeDaLista });
          return {
            slug: e.slug,
            professor: e.professor,
            ciclo: e.ciclo,
            total: e.total,
            estadoComercial: c.estado,
            aNascer: nasceAgora.has(e.slug) || undefined,
            desabilitadaEm: c.desabilitadaEm || null,
            carenciaAte: veredicto.carenciaAte,
            /* «PODE SER APAGADA?» — a resposta completa, e não só um booleano: o motivo fica no
             * corpo para quem diagnosticar (e é o que a rota repete se alguém insistir), mas a
             * caixa de apagar já não o mostra escola a escola — ver `raiz/index.html`. */
            expurgavel: veredicto.pode,
            motivoDoExpurgo: veredicto.motivo,
            restanteMs: veredicto.restanteMs,
          /* O ENDEREÇO É O PRÓPRIO, E NÃO O `workers.dev` (14/11/2026). O técnico era o que
           * aparecia no cartão de apagar e nos textos da página. Uma escola tem UM endereço —
           * o que o sistema criou para ela —, e é ele que se mostra. */
            url: 'https://' + dominioDaEscola.hostname(e.slug, env && env.ZONA_ESCOLAS) + '/',
          };
        }),
      });
    } catch (err) {
      return responderJson({ ok: false, erro: (err && err.message) || String(err) }, 500);
    }
  }

  /* O EXPURGO À MÃO — o que o botão «Apagar escola» chama.
   *
   * A CARÊNCIA CONTA AQUI COMO CONTA NA VARREDURA (16/11/2026). Aqui esteve escrito, com todas as
   * letras, «não há prazo a esperar» — e era verdade enquanto a carência não existia. Deixou de
   * ser no dia em que nasceu, e ninguém releu a frase: a rota apagava qualquer escola bastando
   * escrever o slug, e foi assim que ela apagou a `breu` em carência. «Não pode existir uma regra
   * e uma possibilidade de burlar a regra.»
   *
   * A DECISÃO É DA REGRA (`estadoDoExpurgo`), a mesma que a lista usa para esconder o cartão e que
   * a varredura usa para não tocar. Este `if` não é uma segunda opinião: é a MESMA função, e é
   * por isso que a lista não pode oferecer o que a rota recusa.
   *
   * O `forcar` do expurgo NÃO CONTORNA ISTO. Ele existe para uma proveniência quebrada — «o
   * registo perdeu-se e eu preciso de limpar» —, e não para saltar um prazo que se prometeu a quem
   * pagou. Um `forcar` que também saltasse a carência seria exactamente a burla que ela recusou,
   * com um nome técnico a mais.
   *
   * A ORDEM importa: o Cloudflare PRIMEIRO. Ao contrário, a escola ficaria no ar servindo um
   * pacote que o repositório já não tem. Depois o repositório, que é onde o expurgo deixa o
   * elo — a prova de que a escola existiu. As duas metades são independentes: a falha de uma
   * vai no relatório da sua etapa e não impede a outra. */
  /* O CONVITE DE RECRIAÇÃO — o clique «Recriar» manda um e-mail, e não cria a escola (16/11/2026).
   *
   * «Quando eu clicar em recriar […] envia um e-mail para o e-mail cadastrado da escola […] Lá ele
   * tem um link […] que ali ele escolhe o plano e ele cadastra a senha.» A rota é da proprietária
   * (está atrás da senha da raiz) e é ela que devolve o link — para o caso de o cadastro não ter
   * e-mail nenhum, ou de a mensagem não ter saído. */
  if (url.pathname === '/api/recriar-convite' && request.method === 'POST') {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const feito = await criarConvite({
      env, escola: corpo && corpo.escola, por: 'proprietario',
    });
    return responderJson(
      feito.ok ? feito : { ok: false, erro: feito.erro },
      feito.status || (feito.ok ? 200 : 500));
  }

  if (url.pathname === '/api/apagar-escola' && request.method === 'POST') {
    let corpo;
    try { corpo = await request.json(); } catch { corpo = null; }
    const slug = String((corpo && corpo.escola) || '').trim();
    const confirmacao = String((corpo && corpo.confirmacao) || '').trim();
    const motivo = String((corpo && corpo.motivo) || '').trim() || 'expurgada pela raiz';
    if (!slug) return responderJson({ ok: false, erro: 'informe a escola' }, 400);
    if (confirmacao !== slug) {
      return responderJson({ ok: false, erro: 'a confirmação não é o slug da escola — nada foi apagado' }, 400);
    }

    /* A CARÊNCIA ANTES DE TUDO — antes de olhar para tokens, antes de auditar, antes de tocar no
     * Cloudflare. Uma recusa tem de custar nada e não deixar rasto: se a escola não pode ser
     * apagada, nem se começa.
     *
     * O ESTADO VEM DO MESMO SÍTIO QUE A LISTA LÊ (`bastidores/<escola>/comercial`), e o regime de
     * teste da mesma função — três leituras do mesmo KV para a mesma pergunta seriam três
     * respostas à espera de divergir. */
    const comercialDaVez = await lerComercial(env && env.PADD_KV, slug);
    const regimeDaVez = await regimeDeTeste(env && env.PADD_KV);
    const veredicto = estadoDoExpurgo(comercialDaVez, { regimeDesde: regimeDaVez });
    if (!veredicto.pode) {
      return responderJson({
        ok: false,
        expurgavel: false,
        estadoComercial: veredicto.estado,
        carenciaAte: veredicto.carenciaAte,
        restanteMs: veredicto.restanteMs,
        erro: 'A escola «' + slug + '» não pode ser apagada agora. ' + veredicto.motivo
          + ' O expurgo acontece só sobre uma escola suspensa cuja carência venceu — e nenhum '
          + 'pedido o contorna: nem a confirmação escrita, nem o `forcar`.',
        noRepositorio: false,
        noCloudflare: false,
      }, 409);
    }

    const cfToken = env && env.CLOUDFLARE_API_TOKEN;
    const ghToken = env && env.GITHUB_TOKEN;
    // FORÇAR EXIGE DECLARAR. O mesmo contrato do `escola/expurgar.js`: quem manda apagar sobre
    // uma proveniência quebrada diz por quê, e a razão entra no elo. Não é um interruptor.
    const forcar = corpo && corpo.forcar === true;
    const motivoDoForcar = String((corpo && corpo.motivoDoForcar) || '').trim();
    const relatorio = { escola: slug, motivo, proveniencia: null, cloudflare: null, repositorio: null };

    // 1. SEM OS DOIS TOKENS NÃO SE COMEÇA. Meio expurgo é pior que nenhum: é a escola fora do
    // ar com o dado dela no sistema.
    const faltando = [];
    if (!cfToken) faltando.push('CLOUDFLARE_API_TOKEN');
    if (!ghToken) faltando.push('GITHUB_TOKEN');
    if (faltando.length) {
      relatorio.cloudflare = cfToken ? null : { erro: 'CLOUDFLARE_API_TOKEN ausente no Worker' };
      relatorio.repositorio = ghToken ? null : { erro: 'GITHUB_TOKEN ausente no Worker' };
      return responderJson(Object.assign(relatorio, { ok: false, faltando, noRepositorio: false, noCloudflare: false }), 500);
    }

    /* 0. A PROVENIÊNCIA, ANTES DE QUALQUER APAGAMENTO (07/11/2026).
     *
     * ESTA É A PRIMEIRA COISA QUE ACONTECE — antes do Cloudflare, antes do repositório. O
     * expurgo leva as âncoras (`.fipp`), e uma âncora que já não conferia com as fontes não se
     * recupera depois de apagada: perde-se a prova de que o ciclo existiu, e o registro passa a
     * dizer «expurgada» sobre uma cadeia que já estava partida. Falhando a auditoria, NADA é
     * apagado — nem o Worker. Corrigir vem primeiro.
     *
     * O `forcar` existe porque uma guarda que nunca se pode contrariar torna o expurgo
     * impossível no estado em que ele mais é preciso (o de uma escola cujo registro se perdeu).
     * Mas ele não é um interruptor: exige `motivoDoForcar`, e o motivo e os bloqueios vão para
     * o elo. O `escola/expurgar.js` local tem o mesmo contrato, com os mesmos nomes.
     */
    try {
      const auditoria = await auditarProvenienciaDaEscola({
        token: ghToken, dono: DONO, repo: REPO, ref: REF, slug,
        /* A LISTA DE SCRIPTS DE CONFIANÇA VAI JUNTO (15/11/2026): é ela que distingue «uma escola»
         * de «o shard que serve várias» — a mesma que o `excluirEscola` usa para não apagar o
         * script do shard. A pergunta é a mesma, e a resposta não pode sair de dois sítios. */
        shards: scriptsDeConfianca(env),
      });
      relatorio.proveniencia = {
        auditada: auditoria.ok,
        em: new Date().toISOString(),
        ancoras: auditoria.ancoras.map((a) => ({ caminho: a.caminho, id: a.id, hash: a.hash, tipo: a.tipo })),
        fontes: auditoria.fontes.length,
        impressao: auditoria.impressao,
        resumo: auditoria.resumo,
        fases: auditoria.fases,
      };
      if (!auditoria.ok) {
        relatorio.proveniencia.problemas = auditoria.problemas;
        if (!forcar) {
          return responderJson(Object.assign(relatorio, {
            ok: false,
            erro: 'a proveniência da escola «' + slug + '» não está em ordem — nada foi apagado. '
              + 'Corrige primeiro (reancorar, regerar os índices) e volta a tentar.',
            noRepositorio: false,
            noCloudflare: false,
          }), 409);
        }
        if (!motivoDoForcar) {
          return responderJson(Object.assign(relatorio, {
            ok: false,
            erro: 'forçar o expurgo exige declarar o motivo (`motivoDoForcar`) — nada foi apagado.',
            noRepositorio: false,
            noCloudflare: false,
          }), 400);
        }
        relatorio.proveniencia.forcada = motivoDoForcar;
      }
    } catch (err) {
      // NÃO SE APAGA O QUE NÃO SE CONSEGUIU AUDITAR. Uma falha de rede aqui é indistinguível de
      // «a proveniência está partida» do ponto de vista de quem vai apagar — e o custo de parar
      // é uma nova tentativa, enquanto o de avançar é irreversível.
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não consegui auditar a proveniência: ' + ((err && err.message) || String(err)) + ' — nada foi apagado',
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }

    // 2. ONDE A ESCOLA VIVE, antes de apagar qualquer coisa. O `wrangler.<slug>.jsonc` diz o
    // nome do script e o namespace do KV; sem ele não se limpa o KV — e apagar o Worker
    // deixando o dado é o pior dos mundos. Não se começa o que não se termina. (Se o config
    // não existir mesmo, a escola não está no registro e não há o que expurgar.)
    let morada = null;
    try {
      morada = await moradaDaEscola({ token: ghToken, slug });
    } catch (err) {
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não consegui ler wrangler.' + slug + '.jsonc: ' + ((err && err.message) || String(err)) + ' — nada foi apagado',
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }
    if (!morada) {
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não há wrangler.' + slug + '.jsonc no repositório — não sei onde esta escola vive: nada foi apagado',
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }
    if (!morada.legivel) {
      return responderJson(Object.assign(relatorio, {
        ok: false,
        erro: 'não consegui entender wrangler.' + slug + '.jsonc — não sei onde esta escola vive: nada foi apagado',
        morada,
        noRepositorio: false,
        noCloudflare: false,
      }), 500);
    }

    // 3. O CLOUDFLARE PRIMEIRO. Ao contrário, a escola ficaria no ar servindo um pacote que o
    // repositório já não tem. O KV é limpo pelos prefixos da ESCOLA (`<slug>/` e
    // `bastidores/<slug>/`) — a regra mora em `prefixosDaEscola`, para o Cron do andaime e
    // esta rota limparem a mesma coisa. `namespaceId: null` (config lido, sem bloco de KV) é
    // «não havia o que limpar»; ausência de namespace seria «não sei onde vive», e aí já não
    // se teria chegado aqui.
    try {
      relatorio.cloudflare = await excluirEscola({
        token: cfToken,
        accountId: ACCOUNT_ID,
        slug,
        worker: morada.worker || slug,
        kv: {
          namespaceId: morada.kvNamespaceId || null,
          prefixos: prefixosDaEscola(slug),
        },
        scripts: scriptsDeConfianca(env),
        mapaKv: env && env.PADD_KV,
      });
      relatorio.cloudflare.morada = morada;
    } catch (err) {
      relatorio.cloudflare = { erro: (err && err.message) || String(err), morada };
    }

    // 4. O REPOSITÓRIO. O desfecho do KV vai JUNTO: se a limpeza das chaves não se completou,
    // a pendência fica gravada no elo do expurgo — e é de lá que a retomada a lê, quando a
    // escola já não existe em lugar nenhum (`wrangler.<slug>.jsonc` sai neste mesmo commit).
    //
    // O DESFECHO SAI DE `desfechoDoKvParaOElo`, e não de um `?:` sobre `cloudflare.kv`
    // (01/11/2026): o `?:` devolvia `null` quando a metade Cloudflare LANÇAVA, e o elo ficava
    // sem bloco `kv` — indistinguível de «não havia o que limpar». Ver a função.
    const desfechoKv = desfechoDoKvParaOElo({ cloudflare: relatorio.cloudflare, morada, slug });
    try {
      relatorio.repositorio = await apagarEscolaDoRepo({
        token: ghToken, dono: DONO, repo: REPO, ref: REF, slug, confirmacao, motivo,
        kv: desfechoKv,
        // A PROVENIÊNCIA VAI PARA O ELO. É o que sobra das âncoras depois de apagadas: o que
        // existia, com que hashes, e a impressão do conjunto — ver `comElo`.
        proveniencia: relatorio.proveniencia,
      });
    } catch (err) {
      relatorio.repositorio = { erro: (err && err.message) || String(err) };
    }

    const noRepositorio = Boolean(relatorio.repositorio && relatorio.repositorio.ok);
    const noCloudflare = Boolean(
      relatorio.cloudflare && relatorio.cloudflare.script && relatorio.cloudflare.script.ok
    );
    // O KV entra na CONTA: uma escola que sai do ar e do registro, mas deixa o dado dela no
    // sistema, NÃO foi expurgada — e a manchete da página não pode dizer que foi. Sem isto,
    // o relatório dava verde e a linha do KV, em vermelho, logo abaixo: a contradição que o
    // dono do produto acabou de encontrar.
    //
    // E a conta passa a ser a do DESFECHO (01/11/2026), não a de `cloudflare.kv`: com a
    // metade Cloudflare lançada, `cloudflare.kv` é `undefined`, `kvFalhou` era `false` e a
    // rota respondia `ok: true` sobre chaves que ninguém tinha tocado.
    const kvFalhou = Boolean(desfechoKv && desfechoKv.ok === false);
    const ok = noRepositorio && !kvFalhou;
    return responderJson(
      Object.assign(relatorio, { ok, noRepositorio, noCloudflare, kvFalhou }),
      ok ? 200 : 500
    );
  }

  // ---------------------------------------------------------------------------
  // A RETOMADA DA LIMPEZA DO KV. O expurgo tem duas metades — o Cloudflare (subdomínio,
  // Worker, chaves) e o repositório — e elas podem separar-se: em 19/10/2026 a cota diária
  // do `kv.list` acabou a meio, e a escola `calango` saiu do ar e do registro deixando o
  // dado no KV. Sem esta rota, a pendência era irrecuperável: a escola já não existe em
  // lugar nenhum de onde se possa deduzir o namespace (o `wrangler.<slug>.jsonc` foi
  // apagado no mesmo commit). Com ela, a limpeza é retomada a partir do ELO — o índice da
  // escola, que o expurgo preserva de propósito, guarda o namespace, os prefixos e o
  // instante em que a metade do KV falhou.
  // ---------------------------------------------------------------------------
  if (url.pathname === '/api/expurgar-kv' && request.method === 'POST') {
    let corpo;
    try { corpo = await request.json(); } catch { corpo = null; }
    const slug = String((corpo && corpo.escola) || '').trim();
    const confirmacao = String((corpo && corpo.confirmacao) || '').trim();
    if (!slug) return responderJson({ ok: false, erro: 'informe a escola' }, 400);
    if (confirmacao !== slug) {
      return responderJson({ ok: false, erro: 'a confirmação não é o slug da escola — nada foi apagado' }, 400);
    }
    const cfToken = env && env.CLOUDFLARE_API_TOKEN;
    const ghToken = env && env.GITHUB_TOKEN;
    if (!cfToken || !ghToken) {
      return responderJson({ ok: false, erro: 'faltam tokens no Worker (CLOUDFLARE_API_TOKEN e GITHUB_TOKEN)' }, 500);
    }

    let pendencia = null;
    try {
      pendencia = await pendenciaDoKv({ token: ghToken, dono: DONO, repo: REPO, ref: REF, slug });
    } catch (err) {
      return responderJson({ ok: false, erro: 'não consegui ler o índice da escola: ' + ((err && err.message) || String(err)) }, 500);
    }
    if (!pendencia) {
      return responderJson({ ok: true, escola: slug, nadaPendente: true,
        nota: 'não há expurgo pendente no KV para esta escola' });
    }
    if (!pendencia.namespaceId) {
      return responderJson({ ok: false, escola: slug, erro: 'o elo do expurgo não guardou o namespace do KV — não sei onde limpar' }, 500);
    }

    let kv = null;
    try {
      kv = await apagarChavesDeEscola({
        token: cfToken,
        accountId: ACCOUNT_ID,
        namespaceId: pendencia.namespaceId,
        prefixos: pendencia.prefixos || prefixosDaEscola(slug),
        prefixo: null,
        slug,
      });
    } catch (err) {
      kv = { ok: false, erro: (err && err.message) || String(err) };
    }

    // Resolvido: o elo ganha a linha da retomada (o passado não se reescreve). Ainda não
    // resolvido: a pendência FICA, e a próxima tentativa parte do mesmo lugar.
    let registro = null;
    if (kv && kv.ok === true) {
      try {
        const indiceAtual = await lerArquivo({ token: ghToken, dono: DONO, repo: REPO, ref: REF, caminho: 'escola/' + slug + '/indice.json' });
        const novo = comResolucaoDoKv(indiceAtual, { resultado: kv });
        registro = await atualizarIndiceDaEscola({
          token: ghToken, dono: DONO, repo: REPO, ref: REF, slug, conteudo: novo,
        });
      } catch (err) {
        registro = { ok: false, erro: (err && err.message) || String(err) };
      }
    }

    const ok = Boolean(kv && kv.ok === true);
    return responderJson(Object.assign({ escola: slug, pendencia, kv, registro }, { ok }), ok ? 200 : 500);
  }

  if (url.pathname === '/api/criar-escola' && request.method === 'POST') {
    return responderCriacao(request, env, { origem: 'painel', exigirCadastro: false });
  }

  // O resto → o ASSETS (a apresentação «Sistema Lastro» em raiz/index.html e o assets/).
  // O `run_worker_first` fez o Worker rodar antes do estático; aqui ele devolve o
  // estático que existe — e só cai no 404 quando não há. O freio de senha já foi
  // aplicado no topo: nada do ASSETS é servido sem autorização.
  if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    // A PÁGINA `/` É O PAINEL (22/10/2026). Ela continua a ser a apresentação versionada — com
    // as ações na coluna da esquerda —, e o bloco «Escolas do sistema» entra por um marcador que
    // `tools/gerar-raiz.sh` preserva (ele regera só o corpo de `.conteudo`, e o marcador está
    // fora dele).
    //
    // O BLOCO É ESTÁTICO DESDE 22/10/2026, e por isso esta página DEIXOU DE LER O REPOSITÓRIO.
    // Ele explica o que cada lista mostra e leva a ela; as listas vivem nas suas páginas, e os
    // atalhos na coluna das ações. Duas consequências: `/` abre sempre — mesmo com o índice
    // ilegível ou sem `GITHUB_TOKEN`, que é o que a página que cria escolas precisa; e não há
    // espera de rede nenhuma para servir a entrada do sistema.
    //
    // O ÍNDICE entra depois do bloco porque lê os títulos do HTML já montado.
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // O MESMO `servirAPagina` DO MODO PÚBLICO, com a marca do painel — uma função, duas portas.
      return servirAPagina(request, env, { modo: 'dono' });
    }
    return env.ASSETS.fetch(request);
  }
  return new Response('não encontrado', { status: 404 });
}

// `moradaDaEscola` sai para fora porque é a pergunta «onde esta escola vive?» — a que o
// expurgo faz ANTES de apagar qualquer coisa, e a única que pode ser respondida sem apagar
// nada. Exportada, ela é provável no runtime real (o defeito que ela sofreu — `Buffer` num
// runtime que não o tem — passou por todos os testes em Node sem ser visto).
module.exports = {
  fetch, scheduled, expurgar, moradaDaEscola, validarCriacaoEscola, tituloDoSlug,
  desfechoDoKvParaOElo,
  // AS DUAS PORTAS E O QUE AS SEPARA (25/11/2026). Exportadas porque são a REGRA que a prova tem
  // de medir sem um Worker à frente: «este pedido é do público ou do proprietário?» decide o que
  // se serve e o que se recusa, e uma regra que só se testa em produção descobre-se em produção.
  responderCriacao, gravarCadastro, mandarBoasVindas, ehPaginaPublica, servirAPagina,
  removerDoPainel, marcarPagina, lerComercial, gravarComercial, chaveComercial, ESTADOS_COMERCIAL,
  hostDoProprietario, urlDaPaginaPublica,
  /* O FINANCEIRO E A CARÊNCIA (25/11/2026). Exportados pela mesma razão dos de cima: a conta dos
   * três meses e a regra «o KV manda, o segredo responde» são regras, e uma regra que só se mede
   * em produção descobre-se em produção — com o dinheiro de alguém no meio. */
  lerPix, gravarPix, lerDescontos, concederDesconto, retirarDesconto,
  carenciaAte, MESES_DE_CARENCIA,
  /* O REGIME DE TESTE É DECLARADO, E NÃO ADIVINHADO (16/11/2026). A prova tem de poder dizer com
   * que régua o expurgo mediu — e um número lido de uma variável local não se afirma de fora. */
  CARENCIA_DE_TESTE_MINUTOS, descricaoDaCarencia, escolasConhecidas,
  /* A REGRA DO EXPURGO É EXPORTADA PORQUE É UMA REGRA (16/11/2026). Três chamadores — a lista, a
   * rota que apaga e a varredura —, e a prova tem de poder afirmar os três sem subir o Worker. */
  estadoDoExpurgo, regimeDeTeste, CHAVE_DO_REGIME,
  /* O VEREDICTO DA LISTA DAS VIVAS (16/11/2026). Exportado porque a etiqueta «pode apagar» é a
   * ponta visível da mesma regra: a escola re-habilitada conserva o `desabilitadaEm` (facto) e não
   * pode conservar a etiqueta. A prova tem de poder medir a linha desenhada sem subir o Worker. */
  comercialDaLista,
  /* A JANELA ENTRE A ESCOLA E O ÍNDICE (16/11/2026). Exportada porque a regra «isto é uma escola a
   * nascer, e não o resto de uma criação que falhou» é exactamente o tipo de regra que se mede na
   * bancada e não em produção — onde o sintoma é a lista vazia de quem acabou de criar a escola. */
  escolasANascer, enderecoDaAdministracao,
  /* A RECRIAÇÃO E A SUA JANELA (16/11/2026). Exportadas porque são REGRA, não tela: a janela
   * («o registo comercial é posterior ao expurgo») decide o que as duas listas mostram, e a
   * recriação é o gesto que a abre. Uma prova que só a pudesse exercer em produção descobri-la-ia
   * em produção — com a escola de alguém no meio. */
  recriarEscola, reconstruindo,
  /* O CONVITE E AS SUAS DUAS PONTAS (16/11/2026). `criarConvite` é o clique da proprietária;
   * `lerConvite` é o que a página pública confere antes de mostrar um campo. Exportados porque
   * o token é a única autenticação de uma rota pública — e uma autenticação que só se mede em
   * produção descobre-se em produção. */
  criarConvite, lerConvite, chaveDoConvite,
};
