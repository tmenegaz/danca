'use strict';

/**
 * rotas.js — as rotas da porta, declaradas UMA vez.
 *
 * Recebe o que o runtime já carregou (o conteúdo, o esquema, o PO, o prompt, a
 * identidade visual e o renderizador HTML da ficha) e o armazenamento
 * (adaptador), e devolve um roteador Web-Standards pronto. O MESMO código serve
 * o Node (ponte em node.js) e o Worker (ponte em cloudflare.js): quem muda é só
 * o armazenamento, o transporte e o serviço de estáticos — nunca estas rotas.
 *
 * As 15 rotas da porta original estão aqui: mapa, prompt, ia, ficha (em branco
 * e preenchida), anamneses, estados, estado, apagar/ajustar/editar, envelopes,
 * envelope, elicitar e o fallback estático.
 */

const { criarRoteador } = require('./roteador.js');
// O CATÁLOGO DE PERGUNTAS DO ÍNDICE (fase 4). O núcleo deriva e responde; a rota só entrega.
const indices = require('../nucleo/indices.js');
// AS ESCOLAS DE TESTE: o mesmo fixture que a produção serve, para a bancada local.
const { numeroDoTeste, fixtureDaEscola } = require('./teste-fixtures.js');
// A GERAÇÃO acontece fora daqui (GitHub Actions). Este módulo só sabe se pode começar e
// o que dizer à tela enquanto ela corre.
const { fontesDoCicloProntas } = require('./geracao.js');
const nucleo = require('../nucleo/elicitar.js');
const ia = require('../nucleo/ia.js');
const ficha = require('../nucleo/ficha.js');
const porta = require('../nucleo/porta.js');
// A variante de um contexto (`escola-turma`) — a MESMA que o gerador usa no nome do pacote.
const { varianteDoContexto } = require('./escrever-po.js');
const lancamento = require('../nucleo/lancamento.js');
// Os rótulos do checklist do PO — a fonte é o CONTEÚDO, não a derivação.
const { rotulosDoChecklist, derivadosDoChecklist, derivarPO } = require('../nucleo/derivar-po.js');
// O PLANO inteiro em Markdown, para a folha que o professor lê e imprime. É a MESMA
// derivação que escreve a fonte do ciclo (`servidor/escrever-plano.js`): uma definição só,
// para o documento impresso e o documento publicado não poderem divergir.
const fichaDoPlano = require('../nucleo/ficha-do-plano.js');

const REGISTRO_DE_CUSTO = 'ia-registro/registro.jsonl';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
};

/**
 * A resposta da PORTA. Tudo aqui é do ato presente — o mapa do formulário, o conteúdo,
 * a ficha, os estados — e o que o professor vê tem de ser o de hoje: `no-store` em toda
 * resposta. Sem ele, o `/api/mapa` (que entrega o CONTEÚDO do formulário) era cacheado
 * pelo navegador, e uma correção publicada não aparecia — o servidor mandava o conteúdo
 * novo e a página desenhava o velho.
 */
function resposta(status, tipo, texto, cabecalhos) {
  return new Response(texto, {
    status,
    headers: Object.assign({ 'Content-Type': tipo, 'Cache-Control': 'no-store, max-age=0' }, cabecalhos || {}),
  });
}

function recusar(mensagem, status) {
  return resposta(status || 400, MIME['.json'], JSON.stringify({ ok: false, erro: mensagem }, null, 2) + '\n');
}

/** O rótulo de exibição do conteúdo na ficha — o núcleo o trata como texto. */
const ROTULO_ANAMNESE = 'conteudo/anamnese.json';

function criarRotas({ armazenamento, conteudo, esquema, conteudoPO, conteudoPlano, fichaHtml, prompt, identidade, servirEstatico, agora, fuso, disparar, escreverPO, escreverPlano, escreverCiclo, apagarCiclo, lerDados, lancamentoSeguro, escolaDoWorker, lerCuradorias, lerTurmas, lerLinhasDeBase, geracao, indice }) {
  const roteador = criarRoteador();

  /*
   * A ESCOLA DO DOCUMENTO É A DO WORKER (18/10/2026).
   *
   * Cada escola é um Worker, e o slug dele (`ESCOLA_SLUG`, uma `vars` do wrangler) é a
   * autoridade — o `escolaDe()` do motor já era assim. Mas as ROTAS recebiam a escola do
   * `contexto` que o cliente manda, e três coisas dependiam dela:
   *
   *   1. o DOCUMENTO (`envelope/<id>.json`) declara `contexto.escola` — é o campo que a
   *      proveniência vai ler para cruzar resultados entre escolas, e ele não pode ser o
   *      que o cliente escreveu;
   *   2. o ACERVO e o COFRE do lançamento montam o CAMINHO/CHAVE com ela
   *      (`escola/<escola>/envelopes/…`, `<escola>/<professor>/<ciclo>/…`); uma escola forjada
   *      gravava dentro do prefixo de OUTRA escola;
   *   3. a FONTE do PO e a do plano viram caminho no repositório a partir dela
   *      (`ciclo-01-<escola>-po.md`) — o arquivo cairia no pacote de outra escola.
   *
   * O nome NÃO sai do JSON: ele continua lá, e esse é o ponto — o diretório não serve de
   * prova (o mesmo professor dá aula em mais de uma escola, e um dia haverá cruzamento).
   * O que muda é que ele passa a ser o VERDADEIRO.
   *
   * Sem `escolaDoWorker` (o servidor Node de desenvolvimento, que não é escola), nada
   * muda: o contexto vale como veio. É o mesmo critério do `escolaDe`, na ordem inversa.
   */
  const escolaCanonica = String(escolaDoWorker || '').trim();
  const comAEscolaDoWorker = (contexto) => {
    const c = Object.assign({}, contexto || {});
    if (escolaCanonica) c.escola = escolaCanonica;
    return c;
  };
  // O relógio é injetável: as provas fixam-no para serem repetíveis. Sem injeção, o carimbo
  // é o do núcleo NO FUSO DECLARADO da escola — o Worker roda em UTC, e a data da ficha tem
  // de ser a hora da parede de quem a preencheu.
  const carimbar = agora || (() => nucleo.carimbarAgora(fuso));
  // O gatilho da GERAÇÃO e a ESCRITA DA FONTE são injetados pela ponte: quando
  // o PO é concluído, o Worker (1) escreve o `ciclo-XX-<escola>-po.md` no
  // repositório e (2) pede ao GitHub Actions que gere o pacote. Best-effort —
  // nada disso desfaz a gravação do envelope, e sem token (dev) cada passo
  // simplesmente não existe (`null`).

  // 1. /assets/style.css — a identidade visual da produção (o FONTE).
  roteador.rota('GET', '/assets/style.css', () => {
    if (!identidade) return recusar('identidade visual não encontrada: tools/templates/ciclo.css', 500);
    return resposta(200, MIME['.css'], identidade);
  });

  // 1.1 /api/teste — o fixture da escola de teste, na bancada local. É LEITURA PURA:
  //     o preenchidor do navegador o busca e preenche campos; nada é enviado. Na
  //     produção do Worker, quem responde é `producao.js` (a rota é a mesma).
  roteador.rota('GET', '/api/teste', ({ url }) => {
    const escola = String(escolaDoWorker || url.searchParams.get('escola') || '').trim();
    const fixture = fixtureDaEscola(escola);
    if (!fixture) return recusar('esta escola não é de teste', 404);
    return resposta(200, MIME['.json'],
      JSON.stringify({ ok: true, teste: numeroDoTeste(escola), escola: escola, fixture: fixture }, null, 2) + '\n');
  });

  // 1.2 /api/geracao — «o que está a acontecer?». Leitura pura do último disparo da
  //     variante (professor × ciclo × escola × turma) e da execução correspondente no
  //     GitHub. É o que permite à tela mostrar o giro, o passo actual e o desfecho sem
  //     que ninguém recarregue a página às cegas.
  roteador.rota('GET', '/api/geracao', async ({ url }) => {
    if (!geracao) return recusar('o estado da geração não está disponível nesta instância', 404);
    const contexto = comAEscolaDoWorker({
      professor: String(url.searchParams.get('professor') || '').trim(),
      ciclo: String(url.searchParams.get('ciclo') || '').trim(),
      turma: String(url.searchParams.get('turma') || '').trim(),
    });
    if (!contexto.professor || !contexto.ciclo) {
      return recusar('faltam o professor e o ciclo', 400);
    }
    try {
      const estado = await geracao.estado(contexto);
      return resposta(200, MIME['.json'], JSON.stringify(estado, null, 2) + '\n');
    } catch (erro) {
      // A tela pergunta de novo em segundos: um tropeço do GitHub não pode virar 500
      // na cara de quem está à espera — vira «sem-consulta», que a tela já sabe mostrar.
      return resposta(200, MIME['.json'],
        JSON.stringify({ ok: false, fase: 'sem-consulta', erro: erro.message }, null, 2) + '\n');
    }
  });

  // 2. /api/mapa — o mapa dos nós; `?fonte=po` entrega o do PO, `?fonte=plano` o do plano.
  roteador.rota('GET', '/api/mapa', ({ url }) => {
    const fonte = url.searchParams.get('fonte');
    return porta.mapa(fonte === 'po' ? conteudoPO : fonte === 'plano' ? conteudoPlano : conteudo);
  });

  /*
   * 2.1 /api/indice — O ÍNDICE DO ACERVO (20/10/2026, fase 4).
   *
   * O que antes era uma varredura por pergunta (a árvore do repositório, uma vez cada) passa a
   * ser UM arquivo derivado: contagens, facetas, ciclos com as âncoras e os registros com os
   * seus metadados. Ele é reconstruível e determinístico — o cache no KV é do KV, e perdê-lo
   * custa uma reconstrução, não um dado.
   *
   * A ESCOLA PODE VER O APELIDO e a RAIZ NÃO: é o mesmo dado que a estante dela já mostra, atrás
   * da mesma senha; e é o que mantém o dado de menor fora do índice transversal.
   *
   * Sem `indice` na ponte (o servidor Node de desenvolvimento, uma bancada), a rota DIZ isso em
   * vez de responder uma lista vazia — que se leria como «o acervo não tem nada».
   */
  roteador.rota('GET', '/api/indice', async ({ url }) => {
    if (!indice) return recusar('o índice não está montado nesta instância', 503);
    const reconstruir = url.searchParams.get('reconstruir') === '1'
      || url.searchParams.get('reconstruir') === 'true';
    try {
      const r = await indice.ler({ reconstruir, agora: carimbar() });
      if (!r.ok) return recusar(r.erro || 'não foi possível construir o índice', 503);
      return {
        ok: true,
        indice: r.indice,
        // O CUSTO VAI NA RESPOSTA. Um índice que não diz quanto custou não se pode auditar — e
        // é essa a diferença entre «mais rápido» e «parece mais rápido».
        custo: r.custo,
        doCache: r.doCache,
      };
    } catch (erro) {
      return recusar('não foi possível construir o índice: ' + erro.message, 503);
    }
  });

  /*
   * 2.2 /api/indice/:pergunta — uma pergunta do catálogo, respondida pelo índice.
   *
   * A forma da resposta é a de §1 do PLANO-PERGUNTAS: **medida + caminho + elo**. Quando a
   * pergunta não é respondível com o que o índice tem, ela volta com `recusa` e o motivo — e não
   * com um zero, que se leria como um facto.
   */
  roteador.rota('GET', '/api/indice/:pergunta', async ({ url, params }) => {
    if (!indice) return recusar('o índice não está montado nesta instância', 503);
    try {
      const r = await indice.ler({ agora: carimbar() });
      if (!r.ok) return recusar(r.erro || 'não foi possível construir o índice', 503);
      // As perguntas são do NÚCLEO (`nucleo/indices.js`): a rota não sabe o que é CT01 nem PV01
      // — só sabe que há um catálogo, e que uma pergunta desconhecida volta com a recusa dele.
      const resposta = indices.responder(r.indice, params.pergunta, url.searchParams.get('aluna'));
      return Object.assign({ ok: true, doCache: r.doCache }, resposta);
    } catch (erro) {
      return recusar('não foi possível consultar o índice: ' + erro.message, 503);
    }
  });

  // 3. /api/prompt — a entrada por prosa (o conteúdo `prompts/elicitar-ciclo.md`).
  roteador.rota('GET', '/api/prompt', () => {
    if (!prompt) return recusar('prompt não encontrado: prompts/elicitar-ciclo.md', 500);
    return resposta(200, MIME['.md'], prompt);
  });

  // 4. /api/ia — a conversa de IA (stub), com o freio e o registro de custo.
  roteador.rota('POST', '/api/ia', async ({ request }) => {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    const mensagens = Array.isArray(corpo.mensagens) ? corpo.mensagens : [];
    const alvo = conteudoPO || conteudo;
    const saida = ia.conversar(alvo, mensagens);
    const turnos = saida.turnos;

    // O REGISTRO é do servidor (a tela não decide o que é guardado): uma linha
    // por sessão, acrescentada quando a conversa compila.
    if (saida.compilado) {
      const linha = {
        contexto: corpo.contexto || {},
        turnos,
        tokens_in: 0,
        tokens_out: 0,
        custo_estimado: '0 (stub)',
        carimbo: carimbar(),
      };
      await armazenamento.anexar(REGISTRO_DE_CUSTO, JSON.stringify(linha) + '\n');
    }

    return { ok: true, freio: { limiteTurnos: ia.limiteTurnos, turnos }, ...saida };
  });

  // 5. /api/ficha (JSON) e /api/ficha.md (markdown) — a ficha em branco.
  roteador.rota('GET', '/api/ficha', ({ url }) => {
    const { markdown, relatorio } = ficha.renderizar(conteudo, { conteudo: ROTULO_ANAMNESE });
    if (url.searchParams.get('formato') === 'html') {
      return resposta(200, MIME['.html'], fichaHtml.paginaDaFichaEmBranco(markdown));
    }
    return {
      ok: true,
      cobertura: relatorio.cobertura,
      bytes: relatorio.bytes,
      linhas: relatorio.linhas,
      lacunas: relatorio.lacunas,
      ausentes: relatorio.ausentes,
      markdown,
    };
  });
  roteador.rota('GET', '/api/ficha.md', () => {
    const { markdown } = ficha.renderizar(conteudo, { conteudo: ROTULO_ANAMNESE });
    return resposta(200, MIME['.md'], markdown);
  });

  // AS QUATRO LISTAS NÃO DERRUBAM A TELA (19/10/2026). Todas elas começam por ENUMERAR as
  // chaves do armazenamento (`listar` → `kv.list`), e o `kv.list` tem cota diária própria no
  // plano gratuito do Cloudflare: estourada a cota, ele LANÇA. A excepção subia até ao
  // runtime e a tela recebia o «error code: 1101» do Cloudflare — uma página que não diz nada
  // a quem está a usar a ferramenta, e que parece defeito do Sistema Lastro quando o defeito
  // é de cota.
  //
  // A distinção importa: uma RECUSA DE NEGÓCIO é HTTP 200 + `{ok:false}` (a convenção desta
  // casa, em `/api/receber`). Uma FALHA DE INFRAESTRUTURA não é recusa: é 503 com o motivo no
  // corpo. E não pode ser 200 com `estados: {}` — uma lista vazia por falha de leitura é
  // indistinguível de «não há nada gravado», que é exactamente a leitura errada que o
  // professor já fez uma vez («as fichas foram perdidas»).
  const falhaDaLista = (erro) => resposta(503, MIME['.json'], JSON.stringify({
    ok: false,
    erro: 'não foi possível ler a lista agora: ' + ((erro && erro.message) || 'falha do armazenamento'),
    motivo: 'armazenamento',
  }, null, 2) + '\n');

  // 6. /api/anamneses — a seleção de sujeitos (um por apelido, o vigente).
  //
  // O RECORTE DA TURMA (20/10/2026). A rota devolvia TODAS as anamneses da escola, e o nó
  // `sujeitos` do PO é alimentado por ela: com três turmas, o Plano de Observação da turma 1
  // oferecia as alunas das outras duas. A tela filtrava por `daCuradoria('alunas')`, que é a
  // UNIÃO das curadorias do professor — com três turmas, a união é sempre «todas». O vazamento
  // não estava no filtro que faltava; estava no filtro que existia e não recortava nada.
  //
  // Agora a rota aceita o recorte, e resolve-o aqui — não no cliente:
  //   · `?plano=<carimbo>` — a turma vem do PLANO escolhido (`contexto-turma` do envelope).
  //     É o que a tela manda, porque é o único dado que ela já tem.
  //   · `?turma=<nome>` — a turma directa (a bancada local, e as provas).
  //   · `?professor=<slug>` — recorta a PESSOA: com turma, é o par (professor, turma) da
  //     curadoria; sem turma, é a união das curadorias dele — o `sujeitos` pode ser aberto
  //     antes do plano, e nesse caso a lista não pode ser a da escola inteira. Sem este
  //     parâmetro valem as curadorias de qualquer professor, como antes.
  // Sem nenhum destes parâmetros, a rota responde o que respondia — a lista inteira —, e é
  // essa a diferença entre «não pediram recorte» e «pediram um recorte vazio».
  roteador.rota('GET', '/api/anamneses', async ({ url }) => {
    /*
     * A ROTA JÁ NÃO SABE ONDE O DADO VIVE (20/10/2026), e é esse o ponto da fase 3.
     *
     * Ela tinha três caminhos — repositório, KV, e a união dos dois — com o campo `fonte` a
     * contar ao professor de onde vinha a lista. A união passou a ser do ARMAZENAMENTO: o
     * acervo do repositório lê primeiro e recorre ao KV quando um nome não está lá. A rota
     * volta a ser uma linha, e o `fonte` fica com um valor só — a lista é, agora, sempre a
     * mesma lista, e não há duas metades a explicar a quem está em sala de aula.
     */
    try {
      const pedido = url && url.searchParams;
      const professor = (pedido && pedido.get('professor')) || '';
      const escola = String(escolaDoWorker || (pedido && pedido.get('escola')) || '').trim();
      let turma = (pedido && pedido.get('turma')) || '';
      const planoId = (pedido && pedido.get('plano')) || '';
      // A TURMA DO PLANO ESCOLHIDO. `turmaDoEnvelope` lê `contexto-turma` e tolera o campo
      // múltiplo dos envelopes antigos — a mesma leitura que a estante e o escritor já usam.
      if (!turma && planoId) {
        const plano = await porta.lerEnvelope(armazenamento, planoId);
        turma = porta.turmaDoEnvelope(plano) || '';
      }
      let recorte = null;
      if (turma || professor) {
        const curadorias = typeof lerCuradorias === 'function'
          ? await lerCuradorias(escola)
          : [];
        /* O ELENCO VEM DA LINHA DE BASE (05/11/2026) — ver `alunasDaTurma`. A leitura é a MESMA
         * da Produção (`lerLinhasDeBase`), e não uma segunda: o `get` da chave
         * `bastidores/<escola>/linhas-de-base` é o único caminho para o facto «estas alunas foram
         * para esta turma». Sem o leitor (o adaptador Node não o tem), `linhas` fica `undefined` e
         * as funções caem na curadoria, como antes. */
        const linhas = typeof lerLinhasDeBase === 'function'
          ? await lerLinhasDeBase(escola)
          : undefined;
        recorte = turma
          ? { alunas: porta.alunasDaTurma(curadorias, { professor, turma }, linhas) || [] }
          : { alunas: porta.alunasDoProfessor(curadorias, professor, linhas) || [] };
      }
      return {
        ok: true,
        opcoes: await porta.anamneses(armazenamento, recorte),
        fonte: 'acervo',
        ...(turma ? { turma } : {}),
        ...(recorte ? { recorte: recorte.alunas } : {}),
      };
    } catch (erro) { return falhaDaLista(erro); }
  });

  // 6.1 /api/planos — a estante de planos de ensino (um por carimbo, com o
  //     objetivo como resumo). Serve o nó `plano-de-ensino` do PO.
  //
  // O `?professor=<slug>` RECORTA a estante (22/10/2026). Sem ele a lista é a da escola,
  // e o PO de um professor oferecia os planos dos outros. O recorte é resolvido aqui, e
  // não na tela: quem lê o acervo é o servidor, e a lista de sujeitos a jusante deriva da
  // turma do plano — um plano alheio arrastava a turma alheia e, com ela, as alunas.
  roteador.rota('GET', '/api/planos', async ({ url }) => {
    try {
      const professor = (url && url.searchParams && url.searchParams.get('professor')) || '';
      return { ok: true, opcoes: await porta.planos(armazenamento, { professor }) };
    } catch (erro) { return falhaDaLista(erro); }
  });

  /*
   * 6.2 GET /api/ciclos — os ciclos desta escola, e o PRÓXIMO ciclo válido (04/11/2026).
   *
   * A REGRA QUE ELE SERVE: «os ciclos devem ser estritamente sequenciais (1, 2, 3, … N)», e o
   * campo do ciclo não pode ser texto livre. Para travar o campo no próximo número é preciso
   * saber quais existem — e a resposta vem dos DOCUMENTOS (o índice dos envelopes), não de um
   * cadastro. Um ciclo existe porque tem plano ou PO dentro; um número escrito num campo não é
   * um ciclo.
   *
   * `proximo` a `null` NÃO É ERRO: é um buraco na sequência (01 e 03 sem o 02), e nesse caso não
   * há próximo honesto a sugerir. Quem mostra diz a lacuna em vez de inventar o número que a
   * taparia.
   *
   * `comPlano` é a lista que o Plano de Observação consome: não se observa um ciclo sem plano de
   * ensino, e é o servidor que o diz — uma segunda cópia da regra na tela divergiria dela.
   */
  roteador.rota('GET', '/api/ciclos', async ({ url }) => {
    try {
      const params = (url && url.searchParams) || new URLSearchParams();
      const professor = params.get('professor') || '';
      const escola = String(escolaDoWorker || params.get('escola') || '').trim();
      const ciclos = await porta.ciclosDaEscola(armazenamento, { escola, professor });
      return {
        ok: true,
        escola,
        professor,
        ciclos,
        proximo: porta.proximoCiclo(ciclos),
        comPlano: ciclos.filter((c) => c.temPlano).map((c) => c.ciclo),
      };
    } catch (erro) { return falhaDaLista(erro); }
  });

  /*
   * 6.2 GET /api/linhas-de-base — as linhas de base do corpo, para o plano de ensino ESCOLHER
   * (05/11/2026).
   *
   * O QUE MUDOU, E PORQUÊ. O plano lia sempre os MESMOS quinze aspectos do corpo, escritos à mão
   * no conteúdo (`lidoDasAnamneses`). A pesquisadora, 05/11: «a definição do que compõe a Linha
   * de Base do Corpo para um determinado trabalho passa a ser uma escolha ativa e customizada do
   * professor». A escolha faz-se em Bastidores → Corpo, e esta rota é o que a traz para aqui.
   *
   * A LEITURA É ABERTA, e é decisão dela: «quando um outro professor assume, é bom que ele possa
   * olhar essa anamnese e ter uma percepção de como era o corpo daquela pessoa no passado». Quem
   * chega vê o que estava; a linha que ele GRAVA é dele (a rota de escrita é a da Produção, e
   * exige a senha da direção).
   *
   * A LISTA VAI INTEIRA, com os campos de cada uma. Sem os campos, a tela do plano não saberia o
   * que pedir às anamneses — e pedir-lhos numa segunda chamada por linha de base seria uma
   * leitura a mais por abertura de página.
   */
  roteador.rota('GET', '/api/linhas-de-base', async ({ url }) => {
    try {
      const params = (url && url.searchParams) || new URLSearchParams();
      const escola = String(escolaDoWorker || params.get('escola') || '').trim();
      const lista = typeof lerLinhasDeBase === 'function' ? await lerLinhasDeBase(escola) : [];
      const linhas = Array.isArray(lista) ? lista : [];
      /* `opcoes` É O QUE A TELA LÊ (05/11/2026). O mecanismo de `opcoesDe` do formulário pede
       * sempre `{valor, rotulo}` — é o que alimenta um `<select>` sem a tela saber o que há
       * atrás. Devolver só `linhas` obrigaria o cliente a conhecer um segundo formato para este
       * campo, e um formato a mais é uma divergência à espera de acontecer. `linhas` vai também
       * porque é dela que o cliente tira os CAMPOS de cada uma — e esses não cabem num rótulo. */
      return {
        ok: true,
        escola,
        linhas,
        opcoes: linhas.map((l) => ({
          valor: l.id,
          rotulo: l.nome,
          detalhe: (l.campos || []).length + ((l.campos || []).length === 1 ? ' aspecto' : ' aspectos')
            + (l.professor ? ' · ' + l.professor : ''),
        })),
      };
    } catch (erro) { return falhaDaLista(erro); }
  });

  /*
   * 6.3 GET /api/revalidacao — o que precisa de revisão depois de um retrato físico novo.
   *
   * A regra é do núcleo (`revalidacaoPendente`) e é DERIVADA: «a anamnese de algum sujeito é mais
   * recente do que este documento?». Não há campo a limpar, e o sinal cai sozinho quando o
   * documento é gravado de novo.
   *
   * A resposta traz `ordem` — `['linha-de-base','plano-de-ensino','plano-de-observacao']` quando a
   * escola tem linhas de base — porque a ordem é a regra e não uma arrumação de ecrã: o PO
   * observa o que o PE fixou, o PE fixa um recorte do corpo, e revalidar o PO sobre um recorte
   * decidido com retratos que já não valem é consolidar uma linha de base sobre o que não se
   * mediu (05/11/2026).
   */
  roteador.rota('GET', '/api/revalidacao', async () => {
    try {
      const escolaDaRevalidacao = String(escolaDoWorker || '').trim();
      const linhasDaEscola = typeof lerLinhasDeBase === 'function' && escolaDaRevalidacao
        ? await lerLinhasDeBase(escolaDaRevalidacao) : [];
      /* AS CURADORIAS ENTRAM NA CASCATA (05/11/2026). O elenco de uma turma é derivado das linhas
       * de base enviadas para ela, e é contra o que a CURADORIA declara que ele se compara: tirar
       * uma aluna do recorte muda o elenco da turma, e a curadoria passa a declarar um corpo que já
       * não existe. Sem esta leitura, a cascata começava no plano de ensino — e o professor era
       * mandado ao segundo passo sem nunca lhe ter sido dito que o primeiro estava por fazer. */
      const curadoriasDaEscola = typeof lerCuradorias === 'function' && escolaDaRevalidacao
        ? await lerCuradorias(escolaDaRevalidacao) : [];
      const r = await porta.revalidacaoPendente(armazenamento, null, linhasDaEscola, curadoriasDaEscola);
      return {
        ok: true,
        ordem: r.ordem,
        anamneses: r.anamneses,
        pendentes: [...r.pendentes.entries()].map(([id, v]) => Object.assign({ id }, v)),
      };
    } catch (erro) { return falhaDaLista(erro); }
  });

  // 7. /api/anamnese-estados — a lista de gestão (todas, inclusive sem sujeito).
  roteador.rota('GET', '/api/anamnese-estados', async () => {
    try {
      return { ok: true, estados: await porta.estadosDasAnamneses(armazenamento) };
    } catch (erro) { return falhaDaLista(erro); }
  });

  // 7.1 /api/plano-estados — a gestão dos planos (solta / legado / vinculada).
  roteador.rota('GET', '/api/plano-estados', async () => {
    try {
      return { ok: true, estados: await porta.estadosDosPlanos(armazenamento) };
    } catch (erro) { return falhaDaLista(erro); }
  });

  /**
   * O CICLO INTEIRO QUE UM DOCUMENTO PRODUZIU — e o dono de cada escrita (05/11/2026).
   *
   * O DEFEITO QUE ISTO FECHA, medido na tela e no repositório: apagar o Plano de Observação
   * apagava o REGISTO e mais nada. O pacote do ciclo — o `index.html` que o menu lista, o
   * `plano.html`, o `aula-01.html`, o `lancamento.html`, a `captura-aula-01.html`, os PDF, as
   * referências, a notação — ficava inteiro, e o menu (que a montagem deriva dos pacotes) também.
   * A pesquisadora: «Ele não sumiu. Posso acessá-lo. E os documentos que ele gerou também estão
   * aqui… quando eu apagar o plano de observação, ele tem que levar consigo os ciclos do menu com
   * tudo que está dentro dele.»
   *
   * TRÊS COISAS, nesta ordem, e a ordem é a garantia:
   *
   *   1. a cascata do PRODUTO (`apagarCiclo`, a mesma rotina da Produção) — o pacote, o `.conf` da
   *      variante e as âncoras `.fipp`. A GUARDA do último ciclo é dela: apagar o ciclo 01 com o
   *      02 vivo partiria a cadeia (o `parentHash` do 02 aponta para a âncora do 01), e a recusa
   *      diz o caminho;
   *   2. os ENVELOPES dos POs daquele ciclo, pelo ACERVO — que é quem mantém o `.indice.json`. A
   *      cadeia inteira sai: apagar só o vigente fazia o elo de trás voltar a aparecer na lista, e
   *      o gesto lia-se como «não funcionou»;
   *   3. o envelope pedido, idempotente (`apagarEnvelope` devolve `false` se já não existe).
   *
   * A GUARDA VEM ANTES DE TUDO. Se a cascata recusa, NADA é apagado — nem o envelope, que hoje
   * desaparecia e deixava o ciclo de pé sem o registo que o justificava. Se ela falha (rede,
   * commit), também nada; a rota responde 502 e o estado fica o de antes.
   *
   * SEM ACESSO AO REPOSITÓRIO a cascata não acontece, e a rota DIZ isso (`ciclo.apagado: false`
   * com o motivo) em vez de prometer o que não fez. O envelope sai na mesma — é o gesto que ela
   * pediu, e a parte dele que não depende da rede.
   */
  async function apagarOCicloDoDocumento({ envelope }) {
    const vazio = { apagado: false, arquivos: 0, envelopes: [], motivo: null };
    const ctx = (envelope && envelope.contexto) || {};
    const escola = String(escolaDoWorker || ctx.escola || '').trim();
    const professor = String(ctx.professor || '').trim();
    const ciclo = String(ctx.ciclo || '').trim().padStart(2, '0');
    if (/^0+$/.test(ciclo)) return Object.assign(vazio, { motivo: 'o documento não declara ciclo' });
    const variante = varianteDoContexto(Object.assign({}, ctx, { escola }));
    if (!escola || !professor || !variante) {
      return Object.assign(vazio, { motivo: 'o documento não declara escola, professor e ciclo' });
    }

    let produto = null;
    if (typeof apagarCiclo === 'function') {
      try {
        produto = await apagarCiclo({ escola, professor, ciclo, variante });
      } catch (erro) {
        return Object.assign(vazio, { falha: true,
          motivo: 'o ciclo ' + ciclo + ' não foi apagado: ' + ((erro && erro.message) || String(erro)) });
      }
      if (produto && produto.guarda) {
        return Object.assign(vazio, { recusa: true, guarda: produto.guarda,
          posteriores: produto.posteriores || [], motivo: produto.erro });
      }
      if (produto && produto.ok === false && !produto.jaNaoExistia) {
        return Object.assign(vazio, { falha: true,
          motivo: produto.erro || 'o ciclo ' + ciclo + ' não foi apagado' });
      }
    }

    /* OS POs DO CICLO, pelo acervo — e SÓ DEPOIS DE A CASCATA TER PASSADO.
     *
     * A ordem não é zelo: a cadeia dos POs é do ciclo, e o ciclo só pode ir embora se for o ÚLTIMO
     * da sequência (o `parentHash` do seguinte aponta para a âncora deste). Quem sabe isso é a
     * cascata. Levar os envelopes antes de ela responder — ou quando ela nem existe, por não haver
     * acesso ao repositório — seria apagar o registo de um ciclo que continua de pé, e deixar a
     * lista sem o documento que o justificava. Sem cascata, sai só o envelope pedido. */
    const envelopes = [];
    if (produto && produto.ok) {
      try {
        const resumos = await porta.resumosDeEnvelopes(armazenamento, /^po-.*\.json$/);
        for (const { nome, resumo } of resumos) {
          const r = resumo || {};
          if (String(r.ciclo || '').padStart(2, '0') !== ciclo) continue;
          if (String(r.professor || '') !== professor) continue;
          if (escola && String(r.escola || '') !== escola) continue;
          const id = String(r.id || nome.replace(/\.json$/, ''));
          if (await porta.apagarEnvelope(armazenamento, id)) envelopes.push(id);
        }
      } catch (erro) { /* sem lista, o envelope pedido sai na mesma: ver o fim da função */ }
    }

    return {
      apagado: Boolean(produto && produto.ok),
      arquivos: (produto && produto.apagados ? produto.apagados.length : 0),
      envelopes,
      variante,
      ciclo,
      commit: (produto && produto.commit) || null,
      motivo: !produto
        ? 'esta instância não tem acesso ao repositório: o registo saiu, o ciclo gerado não'
        : (produto.jaNaoExistia ? 'o ciclo ' + ciclo + ' não tem produto gerado' : null),
    };
  }

  // 7.2 DELETE /api/plano-vinculo/:id — apagar, SÓ o plano LIVRE (solta).
  // Espelha o 9 da anamnese: a proveniência não apaga o que está ligado nem o que já foi
  // derivado. O plano vinculado a um Plano de Observação é a linha de base da observação, e
  // o derivado tem um sucessor que o referencia — mudar qualquer dos dois é criar um elo
  // novo (`derivar`), não apagar.
  roteador.rota('DELETE', '/api/plano-vinculo/:id', async ({ params }) => {
    const envelope = await porta.lerEnvelope(armazenamento, params.id);
    if (!envelope) return recusar('plano não encontrado: ' + params.id, 404);
    const estados = await porta.estadosDosPlanos(armazenamento);
    const estado = estados[params.id] || {};
    if (estado.vinculada || estado.estado === 'legado') {
      return recusar(
        'o plano ' + (estado.vinculada
          ? 'está VINCULADO (Plano de Observação: ' + (estado.por || []).join(', ') + ')'
          : 'já foi DERIVADO') +
        ' e a proveniência não o apaga — derive uma versão nova.', 409);
    }
    /* O PLANO TAMBÉM LEVA O PRODUTO DO CICLO (05/11/2026). Um plano LIVRE pode ter deixado um
     * pacote gerado para trás — o caso real: apagado o PO, o plano fica livre e o ciclo gerado
     * continua no repositório sem nada que o justifique. Apagar o plano é o último gesto possível
     * sobre aquele ciclo, e é ele que fecha a conta. A guarda do último ciclo vale igual: apagar o
     * plano do ciclo 01 com o 02 vivo partiria a cadeia, e a recusa diz o caminho. */
    const ciclo = await apagarOCicloDoDocumento({ envelope });
    if (ciclo.recusa) return recusar(ciclo.motivo, 409);
    if (ciclo.falha) return recusar(ciclo.motivo, 502);
    await porta.apagarEnvelope(armazenamento, params.id);
    return { ok: true, apagado: params.id, ciclo,
      anteriorVigente: String(envelope.ajuste_de || '') || null };
  });

  // 8. /api/anamnese-estado/:id — o estado de UMA anamnese.
  roteador.rota('GET', '/api/anamnese-estado/:id', async ({ params }) => {
    const envelope = await porta.lerEnvelope(armazenamento, params.id);
    if (!envelope) return recusar('anamnese não encontrada: ' + params.id, 404);
    return { ok: true, estado: await porta.estadoDaAnamnese(armazenamento, envelope) };
  });

  // 9. DELETE /api/anamnese-vinculo/:id — apagar, SÓ a solta.
  roteador.rota('DELETE', '/api/anamnese-vinculo/:id', async ({ params }) => {
    const envelope = await porta.lerEnvelope(armazenamento, params.id);
    if (!envelope) return recusar('anamnese não encontrada: ' + params.id, 404);
    const estado = await porta.estadoDaAnamnese(armazenamento, envelope);
    if (estado.vinculada) {
      return recusar(
        'a anamnese está VINCULADA (PO: ' + estado.por.join(', ') + ') e a proveniência não a apaga — ' +
        'ajuste-a, que acrescenta um elo.', 409);
    }
    await porta.apagarEnvelope(armazenamento, params.id);
    return { ok: true, apagada: params.id };
  });

  /* 9.1 DELETE /api/po-vinculo/:id — apagar, SÓ o PO que não foi derivado (04/11/2026).
   *
   * O PO ERA O ÚNICO DOS TRÊS REGISTOS SEM GESTO DE APAGAR, e a pesquisadora deu por isso: «o
   * botão ou a opção de deletar o plano de observação não está aparecendo». A regra é a mesma das
   * outras duas famílias — solto, apaga-se; derivado, não —, e a recusa diz o que impede.
   *
   * O QUE ELE **NÃO** TRAVA, e é a diferença para o plano: nada referencia um PO. O ciclo gerado
   * guarda a sua própria cópia (`po-01.json`, `-po.md`), e é dela que a aula e a âncora vivem —
   * apagar o envelope do acervo não toca no que já foi gerado. A prova disso é a bancada
   * (`provar-apagar-da-listagem`), que apaga um PO e continua a ler o ciclo.
   */
  roteador.rota('DELETE', '/api/po-vinculo/:id', async ({ params }) => {
    const envelope = await porta.lerEnvelope(armazenamento, params.id);
    if (!envelope) return recusar('plano de observação não encontrado: ' + params.id, 404);
    const estado = await porta.estadoDoPo(armazenamento, envelope);
    if (estado.derivado) {
      return recusar('o plano de observação já foi DERIVADO (' + estado.substituido_por.join(', ')
        + ') e a proveniência não o apaga — ajuste-o, que acrescenta um elo.', 409);
    }
    /* O GESTO PASSOU A SER «APAGAR O CICLO», e não «esquecer o registo» (05/11/2026).
     *
     * O comentário acima dizia o contrário — «o ciclo gerado guarda a sua própria cópia, e apagar
     * o envelope não toca no que já foi gerado» —, e era essa a leitura que produzia o defeito:
     * um PO apagado, o pacote do ciclo vivo, o menu a listar um ciclo que já não tem observação,
     * e a cadeia a devolver o elo anterior na linha seguinte. Medido na tela pela pesquisadora.
     *
     * Agora o PO leva o produto do ciclo e a CADEIA do ciclo. A anamnese não é tocada (é do
     * sujeito) e o plano de ensino também não: ele é a declaração que deu origem ao ciclo, e
     * fica LIVRE — apagados os POs, não há quem declare o vínculo. */
    const ciclo = await apagarOCicloDoDocumento({ envelope });
    if (ciclo.recusa) return recusar(ciclo.motivo, 409);
    if (ciclo.falha) return recusar(ciclo.motivo, 502);
    await porta.apagarEnvelope(armazenamento, params.id);
    return { ok: true, apagado: params.id, ciclo,
      anteriorVigente: String(envelope.ajuste_de || '') || null };
  });

  // 10. POST /api/anamnese-ajuste/:id — ACRESCENTAR um elo (sempre permitido).
  roteador.rota('POST', '/api/anamnese-ajuste/:id', async ({ request, params }) => {
    const anterior = await porta.lerEnvelope(armazenamento, params.id);
    if (!anterior) return recusar('anamnese não encontrada: ' + params.id, 404);

    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }

    // As respostas do ajuste: as novas, quando vêm; senão, as da anterior.
    const respostas = Object.keys(corpo.respostas || {}).length
      ? corpo.respostas
      : (anterior.respostas || {});

    const carimbo = carimbar();
    const { id: novoId } = await porta.identificarComCarimbo(armazenamento, 'anamnese', carimbo);

    const opcoes = {
      id: novoId,
      geradoEm: carimbo,
      endereco: porta.ENDERECOS.anamnese,
      contexto: comAEscolaDoWorker(anterior.contexto),
      ajuste: {
        de: params.id,
        em: carimbo,
        motivo: corpo.motivo == null ? null : String(corpo.motivo),
      },
      esquema,
    };
    const { documento, relatorio } = nucleo.elicitar(conteudo, respostas, opcoes);
    if (relatorio.errosDoDocumento.length) {
      return recusar('o ajuste não passou na validação: ' +
        relatorio.errosDoDocumento.map((e) => e.caminho + ' — ' + e.mensagem).join('; '), 422);
    }
    // O ID QUE FICOU. Normalmente é o que se pediu; quando o minuto é disputado por outro
    // pedido, `gravarEnvelope` grava no sufixo seguinte — e quem responde diz o nome que existe
    // (04/11/2026: a corrida do carimbo perdia um ajuste em silêncio).
    const gravacao = await porta.gravarEnvelope(armazenamento, documento, relatorio, { substituir: false });
    if (!gravacao.ok) return recusar(gravacao.erro || 'o ajuste não foi gravado', 500);
    return {
      ok: true, ajuste: gravacao.id || novoId, de: params.id, motivo: opcoes.ajuste.motivo,
      linhas: porta.linhasDoRelatorio(relatorio),
    };
  });

  // 11. PUT /api/anamnese-editar/:id — editar em sítio, SÓ a solta.
  roteador.rota('PUT', '/api/anamnese-editar/:id', async ({ request, params }) => {
    const anterior = await porta.lerEnvelope(armazenamento, params.id);
    if (!anterior) return recusar('anamnese não encontrada: ' + params.id, 404);
    const estado = await porta.estadoDaAnamnese(armazenamento, anterior);
    if (estado.vinculada) {
      return recusar(
        'a anamnese está VINCULADA (PO: ' + estado.por.join(', ') + ') e não se edita em sítio — ' +
        'use o ajuste, que cria um elo novo.', 409);
    }

    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }

    // O CARIMBO diz quando ESTE registro foi escrito — e é a data que a estante mostra.
    // Por isso ele não é herdado do anterior (16/10/2026): numa anamnese ainda SOLTA, editar
    // com mudança de fato é reescrever o mesmo registro — o carimbo se refaz, e o anterior
    // NÃO fica. Sem mudança de fato não há o que recarimbar: abrir e mandar gravar é o mesmo
    // documento, e a data não se mexe por nada.
    const nome = (conteudo && conteudo.documento) || 'anamnese';
    const agora = await porta.identificar(armazenamento, nome, carimbar);
    // O carimbo tem resolução de MINUTO. Editar dentro do mesmo minuto não é recarimbar: a
    // identidade é a mesma, e o registro se sobrescreve em sítio (sem órfão `-2` na estante).
    const recarimba = agora.geradoEm !== anterior.gerado_em;
    const { documento, relatorio } = nucleo.elicitar(conteudo, corpo.respostas || {}, {
      id: recarimba ? agora.id : params.id,
      geradoEm: recarimba ? agora.geradoEm : anterior.gerado_em,
      endereco: porta.ENDERECOS.anamnese,
      contexto: comAEscolaDoWorker(corpo.contexto || anterior.contexto),
      esquema,
    });
    if (relatorio.errosDoDocumento.length) {
      return recusar('a edição não passou na validação: ' +
        relatorio.errosDoDocumento.map((e) => e.caminho + ' — ' + e.mensagem).join('; '), 422);
    }
    if (!porta.mudouDeFato(anterior, documento)) {
      return { ok: true, editada: params.id, mudou: false, linhas: porta.linhasDoRelatorio(relatorio) };
    }
    // A BASE É O QUE O PROFESSOR LEU — o `anterior`, que esta rota já carregou. É com ele que a
    // fusão sabe o que ELE mudou (decisão 84).
    const baseDaFusao = (!recarimba && corpo.base && typeof corpo.base === 'object')
      ? corpo.base
      : (recarimba ? null : anterior);
    const gravacao = await porta.gravarEnvelope(armazenamento, documento, relatorio, {
      substituir: !recarimba,
      base: baseDaFusao,
    });
    if (!gravacao.ok) return recusar(gravacao.erro || 'a edição não foi gravada', 500);
    const editada = gravacao.id || documento.id;
    // O anterior só cai DEPOIS de o novo estar gravado: a ordem importa — se a escrita
    // falhasse, o registro antigo continua de pé em vez de virar ausência.
    if (editada !== params.id) await porta.apagarEnvelope(armazenamento, params.id);
    return {
      ok: true,
      editada,
      mudou: true,
      anterior: params.id,
      recarimbada: recarimba,
      linhas: porta.linhasDoRelatorio(relatorio),
    };
  });

  /*
   * AS ROTAS DO COFRE SAÍRAM (20/10/2026).
   *
   * Havia três (`POST /api/anamnese`, `GET /api/anamnese`, `GET /api/anamnese/:carimbo`): a
   * anamnese ia para o acervo da escola em `api/elicitar` e uma SEGUNDA cópia cifrada ia para
   * o cofre do KV logo depois. O mesmo documento em dois sítios, com dois resultados a
   * conciliar na tela e duas contas de cota a pagar — e o pior dos dois mundos quando só uma
   * das gravações passava. O acervo é o registo: `escola/<escola>/envelopes/<carimbo>.json`,
   * cifrado pelo SERVIDOR ao gravar (`acervo-envelopes.js`), e é de lá que se lê e se lista.
   *
   * Nada se perdeu: a leitura de um `_cifrado` continua a ser possível pelo acervo (o
   * ficheiro é cifrado com `SENHA_CRIPTO`, o mesmo `tools/lib-cifra.js` do pacote), e o que
   * aqui saiu era a SEGUNDA estrada para o mesmo dado. O que ficar no KV de escolas já criadas
   * é apagado pelo expurgo, que enumera os prefixos da escola.
   */

  // 11.4 /api/receber — o lançamento da aula. Contrato do formulário
  //      (`tools/templates/lancamento.html`): o cliente lê `dados.erro` em
  //      `ok:false` e troca a mensagem útil por "HTTP 500" num 5xx — por isso a
  //      recusa de negócio devolve HTTP 200 + { ok:false, erro } (nunca 5xx).
  roteador.rota('GET', '/api/receber', () => ({ ok: true, receber: 'pronto' }));
  roteador.rota('POST', '/api/receber', async ({ request }) => {
    let corpo;
    try { corpo = await request.json(); } catch { return { ok: false, erro: 'corpo nao e JSON' }; }
    try {
      // O LANÇAMENTO também: a chave do KV é `<escola>/<professor>/…`, e o payload traz a
      // escola do `ciclos.json` do pacote. A do Worker vence — pelo mesmo motivo das outras.
      const opcoes = Object.assign({}, lancamentoSeguro, { escola: escolaCanonica });
      return await lancamento.lancar(armazenamento, corpo, opcoes);
    } catch (erro) {
      // HTTP 200 de propósito — o contrato do lançamento não aceita 5xx.
      return { ok: false, erro: erro.message };
    }
  });

  // 11.5 /api/dados — o `-dados.json` do pacote, EM CLARO, para quem se autentica.
  //      O navegador NÃO conhece a chave de cifra: ele manda a senha da pessoa (a que ela já
  //      sabe) e recebe o texto. É o que tira a chave da mão de gente — ver `ler-dados.js`.
  //      Sem cifra no arquivo, devolve o próprio texto, como o navegador já fazia.
  roteador.rota('POST', '/api/dados', async ({ request }) => {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!lerDados) return { ok: false, erro: 'a leitura dos dados cifrados não está disponível' };
    try {
      return await lerDados({ arquivo: corpo.arquivo, senha: String(corpo.senha || '') });
    } catch (erro) {
      // 200 de propósito, como nos outros contratos: o cliente troca o erro por "HTTP 500".
      return { ok: false, erro: erro.message };
    }
  });

  // 12. /api/envelopes — a lista de envelopes persistidos.
  roteador.rota('GET', '/api/envelopes', async () => ({
    ok: true,
    envelopes: await porta.nomesDeEnvelopes(armazenamento, /\.json$/),
  }));

  // 13. /api/envelope/:id — a leitura crua de UM envelope.
  roteador.rota('GET', '/api/envelope/:id', async ({ params }) => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(params.id)) return recusar('id inválido: ' + params.id);
    const texto = await porta.lerEnvelopeCru(armazenamento, params.id);
    if (texto !== null) return resposta(200, MIME['.json'], texto);

    // O detalhe — cru, como sempre foi. O ARMAZENAMENTO é que decide de onde ele vem (o
    // repositório, e o KV como reserva) e que decifra a anamnese antes de a entregar. A rota
    // não tem mais um segundo caminho para uma família só.
    return recusar('envelope não encontrado: ' + params.id, 404);
  });

/**
 * AS RELAÇÕES DO CICLO — e a regra é do SERVIDOR, não do menu suspenso (05/11/2026).
 *
 * A especificação: «o Plano de Ensino (PE) é o documento base/macro gerado a partir do ciclo; o
 * Plano de Observação (PO) só pode ser criado se houver estritamente um Plano de Ensino
 * pré-existente e válido para aquele mesmo ciclo… impedindo qualquer órfão ou inconsistência
 * relacional.»
 *
 * O QUE ESTAVA FEITO, e era metade. O campo do ciclo no PO passou a ser uma LISTA com os ciclos
 * que têm plano (`GET /api/ciclos` → `comPlano`). Mas um dropdown é CONVENIÊNCIA: quem manda um
 * `POST` à mão — ou quem tem a página aberta de ontem — escreve o que quiser, e o servidor
 * aceitava. Medido, antes desta função:
 *
 *   POST /api/elicitar { fonte:'po', ciclo:'07', plano-de-ensino:'plano-20990101-0000' } → 200
 *   POST /api/elicitar { fonte:'plano', ciclo:'07' }   (sem 01..06)                   → 200
 *
 * As duas escreveram documento. A primeira é o ÓRFÃO: um PO que observa um plano que não existe,
 * num ciclo que não tem plano nenhum. A segunda é a SEQUÊNCIA QUEBRADA: o ciclo 07 nasce sem
 * 01..06, e a cadeia de proveniência não tem a que encadear — o `parentHash` do ciclo N aponta
 * para a âncora do N-1, e um ciclo que aparece do nada não tem N-1.
 *
 * TRÊS CONFERÊNCIAS, e cada uma nomeia o que impede:
 *
 *   1. o plano declarado pelo PO tem de EXISTIR no acervo;
 *   2. o ciclo do PO tem de ser o ciclo DO PLANO (um PO de outro ciclo é a inconsistência
 *      relacional — o documento diria «ciclo 02» e observaria o plano do 01);
 *   3. sem plano declarado, o ciclo tem de ter plano — senão o PO nasce órfão por construção.
 *
 * E a SEQUÊNCIA ESTRITA do plano: um plano novo só pode ser do PRÓXIMO ciclo, ou de um ciclo que
 * já existe (o ajuste e o elo novo continuam a valer — eles não criam ciclo, continuam um).
 *
 * DEGRADA, NÃO REBENTA — a mesma disciplina da curadoria (ver o bloco da turma, abaixo). Sem
 * `armazenamento` legível (uma bancada, um adaptador sem índice) não há como conferir, e a rota
 * segue como sempre foi. O que não se faz é RECUSAR por falta de leitor: isso transformaria uma
 * limitação de bancada numa proibição de gravar. E a SIMULAÇÃO também passa: ela não escreve, e
 * uma prévia não é um documento.
 */
async function recusaDaRelacaoDoCiclo({ armazenamento, corpo, escola }) {
  const fonte = corpo && corpo.fonte;
  if (fonte !== 'po' && fonte !== 'plano') return null;
  if (corpo && corpo.simular) return null;
  const contexto = (corpo && corpo.contexto) || {};
  const respostas = corpo && corpo.respostas && typeof corpo.respostas === 'object'
    ? corpo.respostas : {};
  const valorDe = (id) => {
    const r = respostas[id];
    const v = r && typeof r === 'object' && r.valor !== undefined ? r.valor : r;
    return String(v == null ? '' : v).trim();
  };
  const ciclo = String(contexto.ciclo || '').trim();
  const professor = String(contexto.professor || '').trim();
  const daEscola = String(escola || contexto.escola || '').trim();

  let ciclos = null;
  try {
    ciclos = await porta.ciclosDaEscola(armazenamento, { escola: daEscola, professor });
  } catch (erro) { ciclos = null; }

  if (fonte === 'po') {
    const planoId = valorDe('plano-de-ensino');
    let ids = null;
    try {
      const resumos = await porta.resumosDeEnvelopes(armazenamento, /^plano-.*\.json$/);
      ids = resumos.map(({ nome, resumo }) => (resumo && resumo.id) || nome.replace(/\.json$/, ''));
    } catch (erro) { ids = null; }

    if (planoId && ids) {
      if (ids.indexOf(planoId) === -1) {
        return { status: 409, motivo: 'o plano de ensino «' + planoId + '» não existe neste '
          + 'acervo: o Plano de Observação observa um plano que existe, e um carimbo inventado '
          + 'não é um plano. Plano de Observação sem plano de ensino é um documento órfão — '
          + 'crie o plano primeiro (é ele que fixa o objetivo e os marcos do ciclo) e volte aqui.' };
      }
      let cicloDoPlano = '';
      try {
        const envelope = await porta.lerEnvelope(armazenamento, planoId);
        cicloDoPlano = String((envelope && envelope.contexto && envelope.contexto.ciclo) || '').trim();
      } catch (erro) { cicloDoPlano = ''; }
      if (ciclo && cicloDoPlano && ciclo !== cicloDoPlano) {
        return { status: 409, motivo: 'o plano «' + planoId + '» é do ciclo ' + cicloDoPlano
          + ', e este Plano de Observação está no ciclo ' + ciclo + ': um PO observa o plano do '
          + 'SEU ciclo. O ciclo do documento e o ciclo do plano têm de ser o mesmo — escolha o '
          + 'plano deste ciclo, ou mude o ciclo.' };
      }
    }

    if (!planoId && ciclos && ciclo) {
      const alvo = ciclos.find((c) => String(c.ciclo) === ciclo);
      if (!alvo || !alvo.temPlano) {
        const comPlano = ciclos.filter((c) => c.temPlano).map((c) => String(c.ciclo));
        return { status: 409, motivo: 'o ciclo ' + ciclo + ' não tem plano de ensino: o Plano de '
          + 'Observação observa uma aula que TEM plano, e é o plano que fixa o objetivo e os '
          + 'marcos do ciclo. ' + (comPlano.length
            ? 'Nesta escola há plano nos ciclos ' + comPlano.join(', ') + '.'
            : 'Nenhum ciclo desta escola tem plano ainda — ele é o primeiro documento do ciclo.') };
      }
    }
  }

  if (fonte === 'plano' && ciclos && ciclo) {
    const existentes = ciclos.map((c) => String(c.ciclo));
    const proximo = String(porta.proximoCiclo(ciclos) || '');
    /* A EDIÇÃO E O ELO NOVO NÃO CRIAM CICLO: um documento que já existe mantém a posição dele na
     * cadeia (mudar o ciclo de um documento é mudar de cadeia, e isso é um documento novo).
     *
     * O `id` SÓ CONTA SE O DOCUMENTO EXISTE — e a precisão não é zelo: `elicitar` grava sob o id
     * que recebe, e um id inventado num ciclo inexistente seria a porta de serviço da regra. */
    let continua = Boolean(corpo && corpo.ajuste_de);
    if (!continua && corpo && corpo.id) {
      try {
        continua = Boolean(await porta.lerEnvelope(armazenamento, String(corpo.id)));
      } catch (erro) { continua = false; }
    }
    if (!continua && existentes.indexOf(ciclo) === -1 && ciclo !== proximo) {
      return { status: 409, motivo: 'os ciclos são ESTRITAMENTE sequenciais (1, 2, 3 … N): '
        + 'o ciclo ' + ciclo + ' não existe e o próximo é ' + (proximo || '—') + '. '
        + (existentes.length
          ? 'Esta escola tem ' + existentes.join(', ') + '.'
          : 'Esta escola ainda não tem ciclo nenhum: o primeiro é o 01.') };
    }
  }

  return null;
}

  // 14. POST /api/elicitar — a elicitação inteira.
  roteador.rota('POST', '/api/elicitar', async ({ request }) => {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      return recusar('o corpo precisa ser um objeto com a chave `respostas`');
    }
    // A escola do contexto é a do Worker ANTES de o documento nascer — é daqui que saem o
    // `contexto.escola` gravado e o caminho da fonte no repositório. O `if` preserva o caso
    // (patológico) de um pedido SEM contexto: ele continua sem contexto, e não ganha um
    // `{escola}` sozinho — meia identidade é pior que identidade nenhuma.
    if (corpo.contexto) corpo.contexto = comAEscolaDoWorker(corpo.contexto);

    /* A TURMA DO PLANO TEM DE SER A DO PROFESSOR — E A REGRA É AQUI (27/10/2026).
     *
     * O QUE ACONTECEU. A tela filtrava as turmas pela curadoria, e a pesquisadora viu que dava
     * para misturar: escolher um professor e a turma de outro. O filtro do cliente tinha uma
     * porta aberta (a ausência de curadoria devolvia a lista inteira — corrigido em
     * `porta/index.html`), mas o problema de fundo é outro e maior: **um filtro de tela não é uma
     * regra**. Quem manda um `POST` à mão escreve o plano da turma que quiser, e o servidor
     * aceitava.
     *
     * A AUTORIZAÇÃO É A CURADORIA, e ela é declarada, não deduzida (P-16). A direção atribui a
     * turma ao professor; sem essa atribuição não há plano de ensino daquela turma. É a MESMA
     * regra que já trava o formulário quando o professor não tem curadoria nenhuma
     * (`podePreencher`), aplicada ao caso que faltava: curadoria existente, mas de OUTRA turma.
     *
     * NÃO SE APLICA AO PO. O Plano de Observação observa o plano; a turma dele vem do plano, e a
     * autorização já foi dada quando o plano foi aceite. A anamnese também não: a dela é a aluna,
     * e é outra regra (a curadoria filtra as alunas, `alunasDaAnamnese`).
     *
     * DEGRADA, NÃO REBENTA: sem `lerCuradorias` (uma bancada, um adaptador sem KV) não há como
     * conferir, e a rota segue como sempre foi. O que não se faz é RECUSAR por falta de leitor —
     * isso transformaria uma limitação de bancada numa proibição de gravar.
     */
    if (corpo.fonte === 'plano' && typeof lerCuradorias === 'function') {
      const respostas = corpo.respostas && typeof corpo.respostas === 'object' ? corpo.respostas : {};
      const cru = respostas['contexto-turma'];
      const turmaPedida = String(
        cru && typeof cru === 'object' && cru.valor !== undefined ? cru.valor : (cru || '')).trim();
      const professor = String((corpo.contexto && corpo.contexto.professor) || '').trim();
      if (turmaPedida && professor) {
        try {
          const curadorias = await lerCuradorias(escolaDoWorker || identidade.escola);
          const doProfessor = (Array.isArray(curadorias) ? curadorias : [])
            .filter((c) => c && !c.substituidaPor && String(c.professor || '').trim() === professor);
          const autorizadas = new Set();
          for (const c of doProfessor) {
            for (const t of (Array.isArray(c.turmas) ? c.turmas : [])) {
              const nome = String(t == null ? '' : t).trim();
              if (nome) autorizadas.add(nome);
            }
          }
          if (!autorizadas.has(turmaPedida)) {
            return recusar('a turma «' + turmaPedida + '» não está atribuída a este professor: o '
              + 'plano de ensino de uma turma é de quem a direção curou para ela. '
              + (autorizadas.size
                ? 'As turmas deste professor são: ' + [...autorizadas].join(', ') + '.'
                : 'Este professor não tem turma atribuída — é a curadoria que autoriza o plano.'),
              403);
          }
        } catch (erro) { /* sem leitor de curadorias, a rota segue: ver o comentário acima */ }
      }
    }

    /* A REGRA PE → PO E A SEQUÊNCIA ESTRITA — antes de qualquer gravação, e com o acervo à mão. */
    const recusaDeRelacao = await recusaDaRelacaoDoCiclo({
      armazenamento, corpo, escola: escolaDoWorker || (corpo.contexto && corpo.contexto.escola),
    });
    if (recusaDeRelacao) return recusar(recusaDeRelacao.motivo, recusaDeRelacao.status);

    try {
      const resultado = await porta.elicitar(armazenamento, corpo, { conteudo, conteudoPO, conteudoPlano, esquema, agora: carimbar });

      // A RECUSA DO NÚCLEO VIRA UM «NÃO» COM STATUS. O PO tem um só (a linha de base dos
      // sujeitos é única), e o segundo é recusado antes de qualquer gravação — nada foi
      // escrito quando se chega aqui. O envelope anterior continua a ser o que a escola lê.
      if (resultado && resultado.recusa) {
        return recusar(resultado.recusa.motivo, resultado.recusa.status || 409);
      }

      /*
       * O DESTINO DO REGISTRO, DITO AO PROFESSOR (20/10/2026).
       *
       * Antes, a gravação do envelope ia para o KV e um bloco à parte copiava a anamnese para
       * o repositório — duas gravações, dois resultados a conciliar, e a possibilidade de uma
       * delas falhar sozinha. Agora a gravação do envelope JÁ É a gravação no acervo (cifrada,
       * no caso da anamnese), e `resultado.git` passa a relatar ESSA gravação: o mesmo campo
       * que a tela já lê para decidir se limpa a memória do navegador.
       */
      resultado.git = resultado.gravado
        ? {
          ok: true,
          fonte: resultado.noArmazenamentoAntigo ? 'armazenamento antigo' : 'acervo da escola',
          // O CAMINHO VAI PARA A TELA. A mensagem mostrava o carimbo, e o professor não tinha
          // onde procurar no GitHub; o caminho do cofre, que a tela também mostrava, é de uma
          // chave do KV — procurá-lo no repositório não acha nada, e não é erro de quem procura.
          caminho: resultado.caminhoNoAcervo || null,
        }
        : { ok: false, erro: resultado.erroDaGravacao || 'o registro não foi gravado' };

      /*
       * GRAVAR INVALIDA O ÍNDICE (20/10/2026). O índice é derivado do acervo, e o acervo acabou
       * de mudar: deixá-lo como está faria a estante mostrar o acervo de antes do registo que o
       * professor acabou de fazer — «gravei e não apareceu», que é a pior frase desta tela.
       * Apagar o cache custa duas escritas e nenhuma leitura; a próxima consulta reconstrói.
       */
      if (resultado.gravado && indice && typeof indice.invalidar === 'function') {
        try {
          resultado.indice = await indice.invalidar();
        } catch (erro) {
          resultado.indice = { ok: false, erro: erro.message };
        }
      }

      // A PONTE envelope → fonte: quando o PLANO é concluído E GRAVADO, o Worker
      // escreve o `ciclo-XX-<escola>-plano.md`; quando o PO é concluído E
      // GRAVADO, escreve o `-po.md` E dispara a geração. É best-effort — o
      // envelope já está persistido, e uma falha aqui não o desfaz.
      if (resultado.gravado && (corpo.fonte === 'plano' || corpo.fonte === 'po' || corpo.fonte === 'anamnese')) {
        const envelope = resultado.documento;

        if (corpo.fonte === 'plano' && escreverPlano) {
          try {
            resultado.fonte = await escreverPlano(envelope, 'feat(plano): o plano elicitado vira a fonte do ciclo');
          } catch (erro) {
            resultado.fonte = { ok: false, erro: erro.message };
          }
        }

        /*
         * O PO CONCLUÍDO VIRA FONTE, GERA O CICLO E DISPARA — a MESMA função para os dois
         * caminhos (04/11/2026).
         *
         * Ela existia dentro de um `if (corpo.fonte === 'po')`, e por isso o ajuste do plano de
         * ensino não a alcançava: o plano ajustado era gravado, e o PO que o observa ficava como
         * estava. Com a função à parte, o ajuste em cadeia (§ abaixo) usa exactamente o mesmo
         * caminho — escrever o `-po.md`, derivar o ciclo e disparar a geração —, em vez de uma
         * segunda cópia que envelheceria à primeira correção.
         *
         * Devolve `{plano, fonte, ciclo, disparo, geracao}`; o chamador decide onde os campos
         * ficam (`resultado.*` para o PO do formulário, `resultado.cadeia` para o elo que o
         * ajuste do plano criou).
         */
        const concluirPO = async (envelope, contexto) => {
          const saida = { plano: null };

          // O PLANO DE ENSINO referenciado (nó `plano-de-ensino` do PO) é resolvido UMA vez,
          // antes de escrever o PO e o ciclo: o PO o lê para compor o campo empírico e o
          // contexto (não duplica a dose/calendário/volume/registro), e o ciclo o lê para
          // derivar aula/captura/harmonização. Sem referência, cai no plano mais recente do
          // mesmo contexto — retrocompatibilidade. Falha na resolução degrada (o PO sai com
          // lacuna declarada), nunca 500: o envelope já foi gravado.
          try {
            const ref = envelope && envelope.respostas && envelope.respostas['plano-de-ensino'];
            const planoId = ref && ref.valor !== undefined ? ref.valor : ref;
            saida.plano = planoId ? await porta.lerEnvelope(armazenamento, String(planoId)) : null;
            if (!saida.plano) {
              const nomes = await porta.nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
              for (let i = nomes.length - 1; i >= 0 && !saida.plano; i--) {
                const env = await porta.lerArquivo(armazenamento, nomes[i]);
                const c = env && env.contexto;
                if (c && c.escola === contexto.escola && c.professor === contexto.professor &&
                    String(c.ciclo) === String(contexto.ciclo)) saida.plano = env;
              }
            }
          } catch (erro) {
            saida.planoErro = erro.message;
          }

          if (escreverPO) {
            try {
              // OS RÓTULOS vêm do CONTEÚDO (o mesmo `conteudoPO` que a rota serve ao formulário):
              // o nome de cada folha do checklist é dado, não código — e é o nome que o professor
              // leu ao marcar. Sem esta passagem, o documento já assinou «Fronteiras claras» onde
              // o formulário diz «Fronteiras do escopo claras».
              saida.fonte = await escreverPO(envelope, 'feat(po): o PO elicitado vira a fonte do ciclo',
                saida.plano, {
                  rotulos: rotulosDoChecklist(conteudoPO),
                  derivados: derivadosDoChecklist(conteudoPO),
                });
            } catch (erro) {
              saida.fonte = { ok: false, erro: erro.message };
            }
          }

          if (escreverCiclo) {
            try {
              saida.ciclo = await escreverCiclo({ plano: saida.plano, po: envelope, contexto });
            } catch (erro) {
              saida.ciclo = { ok: false, erro: erro.message };
            }
          }

          /*
           * O DISPARO SÓ ACONTECE COM AS FONTES PRONTAS (19/10/2026).
           *
           * O `escrever-ciclo.js` grava as fontes uma a uma e COMPÕE o `.conf` da turma —
           * é dele que o gerador lê os `DOCS`. Quando uma escrita falhava (uma fonte que
           * não casou, a rede), o disparo partia assim mesmo: o workflow arrancava,
           * não achava fonte nenhuma e morria com «DOCS está vazio». Pior que o erro era o
           * silêncio — a tela dizia «gravado», e o professor só descobria no GitHub.
           *
           * Agora o disparo é CONDICIONADO. Não disparar é um resultado explícito, que a
           * tela mostra com o motivo; e o envelope continua gravado, porque a gravação
           * nunca dependeu disto.
           */
          if (disparar) {
            const prontas = fontesDoCicloProntas(saida.ciclo);
            if (!prontas) {
              saida.disparo = {
                ok: false,
                naoDisparado: true,
                motivo: 'as fontes do ciclo não ficaram prontas',
              };
            } else {
              try {
                saida.disparo = await disparar(contexto);
              } catch (erro) {
                saida.disparo = { ok: false, erro: erro.message };
              }
            }
          }

          /*
           * O REGISTRO do que foi pedido — e a primeira leitura do estado. É por ele que a
           * tela sabe o que está a ser gerado depois de recarregar: o contexto e os
           * documentos derivados ficam no KV da escola, não na memória do navegador.
           * Best-effort absoluto: sem KV, a gravação continua válida.
           */
          if (geracao) {
            try {
              const registro = await geracao.registrar(contexto, {
                disparo: saida.disparo,
                ciclo: saida.ciclo,
              });
              saida.geracao = registro.ok
                ? { ok: true, chave: registro.chave, registro: registro.registro }
                : { ok: false, erro: registro.erro, ignorado: registro.ignorado === true };
            } catch (erro) {
              saida.geracao = { ok: false, erro: erro.message };
            }
          }
          return saida;
        };

        const contexto = (envelope && envelope.contexto) || corpo.contexto || {};

        if (corpo.fonte === 'po') {
          Object.assign(resultado, await concluirPO(envelope, contexto));
        }

        /*
         * O AJUSTE DO PLANO ARRASTA O PO — e é isto que faltava (04/11/2026).
         *
         * A pesquisadora corrigiu a proporção do bloco Expressão no plano de ensino. O
         * «Guardar» fez o que a proveniência manda — um elo novo, porque o plano está
         * vinculado a um PO —, e o resultado, do lado dela, foi um plano «livre» na estante e
         * um PO a observar o plano de antes: duas cadeias paralelas, sem nada entre elas. A
         * frase dela: «ele está apenas editando o plano que já possui, e a alteração deve
         * reverberar de forma natural e integrada».
         *
         * O que se faz: quando um plano é AJUSTADO (`ajuste_de` — o mesmo caminho do «Guardar»
         * num plano vinculado), procura-se o PO que observa qualquer elo daquela cadeia e
         * deriva-se um **elo novo do PO** com `ajuste_de` a apontar o anterior e a referência
         * já corrigida para o plano vigente. Nada é reescrito: o PO anterior fica de pé, com a
         * sua linha de base, e o novo diz o mesmo sobre o plano novo. Depois corre o caminho
         * normal — `-po.md`, ciclo e disparo —, que é o que faz a aula ler a proporção nova.
         *
         * SEM PO, NADA ACONTECE — e é o correcto: um plano sem observação é um plano livre, e
         * criar-lhe um PO seria inventar uma linha de base que ninguém declarou.
         */
        if (corpo.fonte === 'plano') {
          const anterior = envelope && envelope.ajuste_de;
          const novoId = envelope && envelope.id;
          if (anterior && novoId && anterior !== novoId) {
            try {
              const poId = await porta.poDoPlano(armazenamento, String(anterior));
              if (poId) {
                const poAnterior = await porta.lerEnvelope(armazenamento, poId);
                if (poAnterior) {
                  const respostasDoPo = Object.assign({}, poAnterior.respostas, {
                    'plano-de-ensino': {
                      valor: novoId, origem: 'perguntado', respondente: 'professor', nota: null,
                    },
                  });
                  const elo = await porta.elicitar(armazenamento, {
                    respostas: respostasDoPo,
                    contexto: (poAnterior.contexto || contexto),
                    fonte: 'po',
                    ajuste_de: poId,
                    motivo: 'o plano de ensino ' + anterior + ' foi ajustado para ' + novoId,
                  }, { conteudo, conteudoPO, conteudoPlano, esquema, agora: carimbar });

                  if (elo && elo.gravado) {
                    /* O `plano` do `concluirPO` é o ENVELOPE que o PO observa — e aqui o nome
                     * colidiria com o descritor do elo. Ele sai do resultado da cadeia: quem lê
                     * `cadeia.plano.de` quer saber DE que plano se veio, não o objeto inteiro. */
                    const saida = await concluirPO(
                      elo.documento, (elo.documento && elo.documento.contexto) || contexto);
                    delete saida.plano;
                    delete saida.planoErro;
                    resultado.cadeia = Object.assign({
                      plano: { de: String(anterior), para: String(novoId) },
                      po: { de: poId, para: elo.id },
                    }, saida);
                  } else {
                    resultado.cadeia = {
                      plano: { de: String(anterior), para: String(novoId) },
                      po: { de: poId, para: elo && elo.id ? elo.id : null },
                      erro: (elo && (elo.erroDaGravacao || (elo.recusa && elo.recusa.motivo)))
                        || 'o elo do PO não foi gravado',
                    };
                  }
                }
              }
            } catch (erro) {
              // O PLANO JÁ ESTÁ GRAVADO. A cadeia é o passo seguinte, e uma falha aqui não o
              // desfaz — mas também não se cala: a tela diz que o PO não acompanhou.
              resultado.cadeia = {
                plano: { de: String(anterior), para: String(novoId) },
                erro: erro.message,
              };
            }
          }
        }
      }

      return resultado;
    } catch (erro) {
      return recusar(erro.message, 500);
    }
  });

  // 15. /api/ficha-preenchida[.<id>] — a ficha marcada com as respostas do
  //     envelope. O id vem como sufixo com ponto (a URL da tela); sem sufixo,
  //     o envelope mais recente.
  const fichaPreenchida = async ({ url, params }) => {
    const sufixo = (params && params.resto) || '';
    const id = decodeURIComponent(sufixo.replace(/^\./, ''));
    if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) return recusar('id inválido: ' + id);
    const idAlvo = id || await porta.ultimoEnvelope(armazenamento);
    const envelope = await porta.lerEnvelope(armazenamento, idAlvo);
    if (!envelope) return recusar('envelope não encontrado: ' + (idAlvo || '(nenhum gravado)'), 404);

    const idDoEnvelope = envelope.id || idAlvo;
    const { markdown, relatorio } = ficha.renderizar(conteudo, {
      conteudo: ROTULO_ANAMNESE,
      respostas: envelope.respostas || {},
      preenchida: true,
    });

    if (url.searchParams.get('formato') === 'html') {
      return resposta(200, MIME['.html'], fichaHtml.paginaDaFicha(markdown, idDoEnvelope));
    }
    if (url.searchParams.get('formato') === 'json') {
      return {
        ok: true,
        id: idDoEnvelope,
        cobertura: relatorio.cobertura,
        bytes: relatorio.bytes,
        linhas: relatorio.linhas,
        lacunas: relatorio.lacunas,
        ausentes: relatorio.ausentes,
        respostas: relatorio.respostas,
        markdown,
      };
    }
    return resposta(200, MIME['.md'], markdown);
  };
  roteador.rota('GET', '/api/ficha-preenchida', fichaPreenchida);
  roteador.rota('GET', '/api/ficha-preenchida.*', fichaPreenchida);

  // 15.1 /api/plano-preenchido[.<id>] — o PLANO inteiro, na folha que o professor lê e
  //      imprime. A estante da anamnese abre a ficha preenchida; a do plano abria o
  //      envelope CRU — JSON não é documento. Aqui ele abre o mesmo que a anamnese abre:
  //      um documento, uma folha. O texto é o da fonte do ciclo (a MESMA `derivarPlano`
  //      do `escrever-plano.js`): imprimir tem de dar o plano que a aula segue.
  const planoPreenchido = async ({ url, params }) => {
    const sufixo = (params && params.resto) || '';
    const id = decodeURIComponent(sufixo.replace(/^\./, ''));
    if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) return recusar('id inválido: ' + id);
    // Sem id, o plano mais recente — e SÓ entre os planos: `ultimoEnvelope` devolveria a
    // anamnese mais nova, que não é plano nenhum.
    let idAlvo = id;
    if (!idAlvo) {
      const nomes = await porta.nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
      idAlvo = nomes.length ? nomes[nomes.length - 1].replace(/\.json$/, '') : '';
    }
    const envelope = idAlvo ? await porta.lerEnvelope(armazenamento, idAlvo) : null;
    if (!envelope) return recusar('plano não encontrado: ' + (idAlvo || '(nenhum gravado)'), 404);
    // A trava de FAMÍLIA: um id de anamnese aqui derivaria um «plano» sem contexto. A
    // família de um envelope é o NOME dele — a mesma regra de `estadosDosPlanos` e do
    // `vinculosDePlano`, e a mesma que a estante usa para separar as duas listas.
    if (!/^plano-/.test(idAlvo)) {
      return recusar('não é um plano de ensino: ' + idAlvo);
    }

    /* O DOCUMENTO É O FORMULÁRIO PREENCHIDO, E NÃO A FONTE DO CICLO (27/10/2026).
     *
     * O QUE ESTAVA ERRADO, e a pesquisadora viu-o em produção: «ele vem com vários campos
     * preenchidos, mas o objetivo por bloco por aula tá vazio». Estava — e não era um campo em
     * falta. O documento era o Markdown de `derivar-plano-ciclo.js`, que é a FONTE do ciclo: ele
     * deixa dois marcadores (`<!-- CALENDARIO -->`, `<!-- OBJETIVOS -->`) para o gerador do
     * ciclo resolver, e aqui eles eram APAGADOS. A secção ficava com o título e nada debaixo.
     * E o título dizia «Plano do Ciclo 01 — batata», que é o nome do documento do CICLO — esse só
     * nasce depois do Plano de Observação, como ela disse —, não o do plano de ensino que ela
     * acabou de preencher.
     *
     * O PEDIDO: «é só o que tá preenchido, o nome dos campos, todos eles listados, com seus
     * títulos, tudo certinho, bonitinho, mas marcado ali o que foi escolhido». É o que a ficha
     * da anamnese já faz — o conteúdo manda na ordem e nos títulos, o envelope nos valores —, e
     * é o que `ficha-do-plano.js` passa a fazer aqui.
     *
     * O QUE NÃO SE PERDE: a fonte do ciclo continua a ser derivada por `escrever-plano.js`, no
     * caminho da geração. Este endereço é o documento para LER e IMPRIMIR, e é outro. */
    /* SEM O CONTEÚDO NÃO HÁ FORMULÁRIO — e é isso que se diz. Uma bancada (ou um adaptador)
     * que não passe o `plano/conteudo/plano.json` recebia antes uma derivação; hoje receberia
     * uma excepção. A recusa é declarada, com o motivo, e não um 500 mudo. */
    if (!conteudoPlano || !Array.isArray(conteudoPlano.blocos)) {
      return recusar('o conteúdo do plano não chegou a esta instância — o formulário preenchido '
        + 'precisa dele', 500);
    }
    let turmas = [];
    if (typeof lerTurmas === 'function') {
      try { turmas = await lerTurmas(escolaDoWorker || identidade.escola); } catch (erro) { turmas = []; }
    }
    const { markdown: corpo, relatorio } = fichaDoPlano.renderizar(conteudoPlano,
      Object.assign({}, envelope, { _turmas: turmas }));

    if (url.searchParams.get('formato') === 'html') {
      return resposta(200, MIME['.html'], fichaHtml.paginaDoPlano(corpo, idAlvo,
        { lacunas: relatorio.lacunas, respondidos: relatorio.respondidos }));
    }
    return resposta(200, MIME['.md'], corpo);
  };
  roteador.rota('GET', '/api/plano-preenchido', planoPreenchido);
  roteador.rota('GET', '/api/plano-preenchido.*', planoPreenchido);

  /* 15.2 /api/po-preenchido[.<id>] — o PLANO DE OBSERVAÇÃO inteiro, na folha que se lê e se
   *      imprime (27/10/2026).
   *
   * O DEFEITO. O PO não tinha folha nenhuma: na estante abria o ENVELOPE CRU (`/api/envelope/<id>`,
   * JSON), e a listagem da Área do Professor não abria nada — só oferecia «Ajustar». A
   * pesquisadora pediu os três documentos: «ler e, se quiser, até imprimir». O PO é o que se lê
   * ANTES de entrar em sala: é onde está o que se decidiu observar, com que régua e em que
   * condições. Deixá-lo em JSON era deixá-lo fora do alcance de quem dá a aula.
   *
   * O TEXTO É O MESMO QUE VIRA A FONTE DO CICLO (`escrever-po.js` chama a mesma `derivarPO`), e
   * com os MESMOS rótulos do conteúdo: o documento não é uma segunda versão do que está na tela,
   * é o que ficou gravado.
   *
   * O PLANO REFERENCIADO é resolvido aqui como é resolvido no `elicitar` — pelo nó
   * `plano-de-ensino`, e na falta dele pelo plano mais recente do mesmo contexto. Sem ele, a
   * tabela da linha de base sai com lacuna declarada (o PO não duplica a dose, o calendário nem o
   * volume: ele os lê do plano), e uma lacuna que o documento podia preencher é uma lacuna a
   * mentir.
   */
  const planoDoPO = async (envelope) => {
    try {
      const ref = envelope && envelope.respostas && envelope.respostas['plano-de-ensino'];
      const planoId = ref && ref.valor !== undefined ? ref.valor : ref;
      if (planoId) {
        const achado = await porta.lerEnvelope(armazenamento, String(planoId));
        if (achado) return achado;
      }
      const contexto = (envelope && envelope.contexto) || {};
      const nomes = await porta.nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
      for (let i = nomes.length - 1; i >= 0; i -= 1) {
        const env = await porta.lerArquivo(armazenamento, nomes[i]);
        const c = env && env.contexto;
        if (c && c.escola === contexto.escola && c.professor === contexto.professor
            && String(c.ciclo) === String(contexto.ciclo)) return env;
      }
    } catch (erro) { /* sem plano: o documento sai com a lacuna declarada, e é o honesto */ }
    return null;
  };

  const poPreenchido = async ({ url, params }) => {
    const sufixo = (params && params.resto) || '';
    const id = decodeURIComponent(sufixo.replace(/^\./, ''));
    if (id && !/^[a-z0-9][a-z0-9-]*$/.test(id)) return recusar('id inválido: ' + id);
    // Sem id, o PO mais recente — e SÓ entre os POs (o `ultimoEnvelope` devolveria a anamnese
    // mais nova, que não é PO nenhum). A mesma disciplina do `plano-preenchido`.
    let idAlvo = id;
    if (!idAlvo) {
      const nomes = await porta.nomesDeEnvelopes(armazenamento, /^po-.*\.json$/);
      idAlvo = nomes.length ? nomes[nomes.length - 1].replace(/\.json$/, '') : '';
    }
    const envelope = idAlvo ? await porta.lerEnvelope(armazenamento, idAlvo) : null;
    if (!envelope) return recusar('Plano de Observação não encontrado: ' + (idAlvo || '(nenhum gravado)'), 404);
    // A trava de FAMÍLIA: um id de anamnese ou de plano aqui derivaria um «PO» que não existe.
    if (!/^po-/.test(idAlvo)) {
      return recusar('não é um Plano de Observação: ' + idAlvo);
    }

    const plano = await planoDoPO(envelope);
    const { markdown, meta } = derivarPO(envelope, plano, {
      rotulos: rotulosDoChecklist(conteudoPO),
      derivados: derivadosDoChecklist(conteudoPO),
    });

    if (url.searchParams.get('formato') === 'html') {
      return resposta(200, MIME['.html'], fichaHtml.paginaDoPO(markdown, idAlvo, meta));
    }
    return resposta(200, MIME['.md'], markdown);
  };
  roteador.rota('GET', '/api/po-preenchido', poPreenchido);
  roteador.rota('GET', '/api/po-preenchido.*', poPreenchido);

  // 16. O fallback ESTÁTICO (index.html e os assets) — GET/HEAD, em último.
  roteador.rota('GET', '*', async ({ url }) => {
    const caminho = url.pathname;
    if (servirEstatico) {
      const estatico = await servirEstatico(caminho);
      if (estatico) return resposta(estatico.status, estatico.tipo, estatico.corpo, estatico.cabecalhos);
    }
    return recusar('não encontrado: ' + caminho, 404);
  });
  roteador.rota('HEAD', '*', async ({ url }) => {
    const caminho = url.pathname;
    if (servirEstatico) {
      const estatico = await servirEstatico(caminho);
      if (estatico) {
        return new Response('', {
          status: estatico.status,
          headers: Object.assign({ 'Content-Type': estatico.tipo }, estatico.cabecalhos || {}),
        });
      }
    }
    return new Response('', { status: 404, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
  });

  return roteador;
}

module.exports = { criarRotas };
