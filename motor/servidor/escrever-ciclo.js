'use strict';

/**
 * escrever-ciclo.js — a ponte do ciclo INTEIRO: no «Guardar» do PO, além do `-po.md`, o Worker
 * deriva e escreve as outras seis fontes que o gerador exige, liga o `DOCS` do manifesto e
 * declara a variante no schema de captura.
 *
 * É o que fecha o ciclo «do zero»: o envelope do PO (que referencia a anamnese e o plano) é
 * tudo o que o gerador precisa — desde que as fontes derivadas existam no repositório.
 *
 * POLÍTICA DE SEGURANÇA (proveniência acrescenta, não edita): cada fonte só é ESCRITA se ainda
 * não existir. Um arquivo que já existe (o ciclo Diaghilev original tem fontes escritas à mão)
 * NUNCA é sobrescrito pelo derivador — o que o derivador gera é o esqueleto do ciclo que nasce
 * do zero, não uma reescrita do que já foi lançado. O `DOCS` e o schema também só são tocados
 * quando o ciclo ainda está incompleto.
 *
 * É infraestrutura (HTTP de saída), não lógica: vive em `servidor/`. Só usa `fetch` (Web
 * Standard). O token chega por parâmetro (injeção).
 */

const { escreverPO, ACEITE, API_VERSAO, varianteDoContexto, dicaDeAuth } = require('./escrever-po.js');
const { codificarBase64, decodificarBase64, caminhoDoConf } = require('./escrever-plano.js');
const { orcamentoDe } = require('./subpedidos.js');
const { cifrarEnvelopeDeDados } = require('./cifrar-envelope.js');
const { respostaDo } = require('../nucleo/derivar-po.js');
/* A faixa de volume resolve-se num sítio só (20/11/2026). */
const volume = require('../nucleo/volume.js');
const {
  slugDe,
  derivarAula01,
  derivarDados,
  derivarReferencias,
  derivarNotacao,
  derivarGlossario,
  derivarCaptura,
  declaracaoDeCaptura,
  mesclarDeclaracao,
  precisaGravar,
  derivarHarmonizacao,
  notacaoEscolhida,
} = require('../nucleo/derivar-ciclo.js');

// O caminho de uma fonte derivada, a partir do contexto — a MESMA regra dos `-po.md`/`-plano.md`.
// A variante é o `<escola>-<turma>` desde 16/10/2026 (o ciclo passou a ser DA TURMA): a
// definição é UMA só, em `escrever-po.js`, e é ela que os três escritores usam.
function caminhoDaFonte(contexto, sufixo) {
  const professor = String(contexto.professor || '').trim();
  const ciclo = String(contexto.ciclo || '').trim().padStart(2, '0');
  const variante = varianteDoContexto(contexto);
  if (!professor || !ciclo || !variante) {
    throw new Error('contexto incompleto para a fonte do ciclo: precisa de professor, ciclo e escola');
  }
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + variante + sufixo;
}

/** O caminho do schema de captura — POR PROFESSOR/CICLO, com um `porVariante` por escola. */
function caminhoDoSchemaDeCaptura(contexto) {
  const professor = String(contexto.professor || '').trim();
  const ciclo = String(contexto.ciclo || '').trim().padStart(2, '0');
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-captura-schema.json';
}

/**
 * O CAMINHO DA DECLARAÇÃO DA CAPTURA — por VARIANTE, ao lado das fontes dela (07/11/2026).
 *
 * PORQUE SAIU DO SCHEMA. A declaração (`{ escola, blocos }` — o par rótulo ↔ chave e o tipo de
 * cada coluna) nasceu dentro do `ciclo-NN-captura-schema.json`, que é uma CÓPIA do molde e que o
 * expurgo PRESERVA de propósito: «os schemas não se apagam, são o modelo de que nasce escola
 * nova». O resultado era dado de ESCOLA a viver num ficheiro que sobrevive à escola — e o preço
 * foi medido a 20/10/2026, quando a entrada de uma ronda antiga sobreviveu ao expurgo da `batata`
 * e contradisse o PO novo (a geração parou em «coluna da folha não declarada no schema»). O
 * remédio de então foi um merge; o remédio certo é a casa.
 *
 * A CASA É A DAS FONTES DA VARIANTE. `professores/<prof>/ciclos/ciclo-NN-<variante>-*` é o
 * endereço que o expurgo já reconhece (`ehArquivoDaEscola`), e por isso a declaração passa a sair
 * com a escola, sem exceção nenhuma a lembrar. O schema volta a ser cópia exata do molde, e o
 * `check-schemas.js` compara-o como compara os outros quatro.
 */
function caminhoDaDeclaracaoDeCaptura(contexto) {
  const professor = String(contexto.professor || '').trim();
  const ciclo = String(contexto.ciclo || '').trim().padStart(2, '0');
  const variante = varianteDoContexto(contexto);
  if (!professor || !ciclo || !variante) {
    throw new Error('contexto incompleto para a declaração da captura: precisa de professor,'
      + ' ciclo e escola');
  }
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + variante
    + '-captura-declaracao.json';
}

/** Lê um arquivo remoto (GET). Devolve `{ existe, sha, texto }`; `existe:false` em 404. */
async function lerArquivoRemoto({ token, dono, repo, ref, caminho, fetchImpl }) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'User-Agent': 'danca-worker',
  };
  const res = await f(url, { method: 'GET', headers: cabecalhos });
  if (res.status === 404) return { existe: false, sha: null, texto: null };
  if (res.status !== 200) {
    let corpo = '';
    try { corpo = await res.text(); } catch { corpo = ''; }
    return { existe: false, sha: null, texto: null, erro: 'HTTP ' + res.status + ' — ' + corpo.slice(0, 200) + dicaDeAuth(res.status) };
  }
  const dados = await res.json();
  return { existe: true, sha: dados.sha || null, texto: decodificarBase64(dados.content || '') };
}

/**
 * OS NOMES QUE JÁ EXISTEM NUMA PASTA REMOTA — UMA leitura para o que eram N (08/11/2026).
 *
 * O `caminhoDoElo` perguntava `existe?` POR ARQUIVO: cada fonte que mudava custava um `GET` a
 * mais para saber se o nome do elo (carimbado com o id do PO) já estava ocupado. Com sete fontes
 * derivadas eram sete subpedidos — e o nome só colide quando o MESMO PO é gravado duas vezes
 * seguidas, caso em que a primeira pergunta já responde.
 *
 * A LISTAGEM DA PASTA responde por todos de uma vez. `404` é pasta que ainda não existe — nenhum
 * nome ocupado, e é a resposta certa (não um erro).
 */
async function nomesDaPastaRemota({ token, dono, repo, ref, pasta, fetchImpl }) {
  const f = fetchImpl || fetch;
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + pasta;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'User-Agent': 'danca-worker',
  };
  const res = await f(url, { method: 'GET', headers: cabecalhos });
  if (res.status === 404) return { existe: false, nomes: new Set() };
  if (res.status !== 200) return { existe: false, nomes: new Set(), erro: 'HTTP ' + res.status };
  let dados = null;
  try { dados = await res.json(); } catch { dados = null; }
  const nomes = new Set((Array.isArray(dados) ? dados : [])
    .map((e) => String((e && e.name) || '')).filter(Boolean));
  return { existe: true, nomes };
}

/**
 * UM arquivo, um commit — pela API de `contents`.
 *
 * NÃO É O CAMINHO DO «GUARDAR» (22/10/2026): escrever um ciclo são oito arquivos de uma vez, e um
 * commit por arquivo guarda sete estados intermédios de um ciclo incompleto (e acorda três
 * workflows de cada vez — ver `gravarArquivosNumCommit`). Esta continua a ser a peça certa para
 * um único arquivo, e é a que outros módulos usam.
 */
async function gravarArquivoRemoto({ token, dono, repo, ref, caminho, conteudo, mensagem, sha }) {
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    'User-Agent': 'danca-worker',
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: cabecalhos,
    body: JSON.stringify({
      message: mensagem,
      content: codificarBase64(conteudo),
      ...(ref ? { branch: ref } : {}),
      ...(sha ? { sha } : {}),
    }),
  });
  const ok = res.status >= 200 && res.status < 300;
  return { caminho, ok, status: res.status };
}

/**
 * GRAVAR N ARQUIVOS NUM COMMIT SÓ — e por que isto não é optimização (22/10/2026).
 *
 * MEDIDO. O «Guardar» do PO escrevia **um commit por arquivo**: as sete fontes derivadas, a
 * cópia cifrada, o `.conf` e o schema de captura. Foram **onze commits em vinte e dois segundos**
 * — `474af6f`, `83116dc`, `c29a227`… —, e cada um acorda três workflows (`Reancorar`,
 * `Regerar os índices`, `Gerar o ciclo`). Trinta execuções para um clique, quase todas a perder
 * a corrida umas para as outras: foi esse enxame que produziu os dois vermelhos de hoje
 * (39788794107 e 39788790994) com treze arquivos de índice «em conflito».
 *
 * A CAUSA NÃO ERA O CI: era a forma da escrita. Um commit por arquivo é o que a API de
 * `contents` oferece — e ela é a ferramenta errada para escrever um conjunto. A API de DADOS do
 * Git escreve o conjunto: blobs, uma árvore sobre a `base_tree`, um commit, uma referência.
 *
 * E HÁ UMA SEGUNDA RAZÃO, que não é de tempo: com N commits, o repositório guarda N estados
 * intermédios em que o ciclo está INCOMPLETO — um deles é «o `-dados.json` existe e o `.conf`
 * ainda não o declara». Quem olhar o histórico (ou um workflow que corra a meio) vê um ciclo
 * que nunca existiu. Um commit por gravação é a única forma de o estado intermédio não existir.
 *
 * A ORDEM É A DO `apagarEscolaDoRepo`: base → árvore → commit → referência, e a referência é o
 * último passo — o único que publica. Se ele perder a corrida (`422 not a fast forward`), refaz-se
 * tudo com base nova; o que já foi escrito não se desfaz (os blobs são endereçados por conteúdo e
 * não ficam pendurados em nada).
 */
async function gravarArquivosNumCommit({ token, dono, repo, ref, arquivos, mensagem, fetchImpl }) {
  const f = fetchImpl || fetch;
  const lista = (arquivos || []).filter((a) => a && a.caminho && typeof a.conteudo === 'string');
  if (!lista.length) return { ok: true, commit: null, escritos: [], nada: true };

  const raiz = 'https://api.github.com/repos/' + dono + '/' + repo;
  const cab = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    // O GitHub recusa (403) sem `User-Agent`, e o Worker não o põe sozinho (22/10/2026).
    'User-Agent': 'danca-worker',
  };
  const pedir = async (url, init) => {
    const r = await f(url, Object.assign({ headers: cab }, init || {}));
    let corpo = null;
    try { corpo = await r.json(); } catch { corpo = null; }
    return { ok: r.ok, status: r.status, corpo };
  };

  let ultimo = null;
  for (let intento = 1; intento <= 3; intento += 1) {
    const base = await pedir(raiz + '/git/ref/heads/' + ref);
    if (!base.ok) {
      return { ok: false, status: base.status, erro: 'não li a referência ' + ref + ': HTTP ' + base.status, escritos: [] };
    }
    const commitSha = base.corpo && base.corpo.object && base.corpo.object.sha;
    const doCommit = await pedir(raiz + '/git/commits/' + commitSha);
    const treeSha = doCommit.corpo && doCommit.corpo.tree && doCommit.corpo.tree.sha;
    if (!commitSha || !treeSha) {
      return { ok: false, erro: 'a referência ' + ref + ' não devolveu commit/árvore', escritos: [] };
    }

    /* O CONTEÚDO VAI DENTRO DA ÁRVORE, E NÃO UM BLOB POR ARQUIVO (08/11/2026).
     *
     * MEDIDO, e é o que estourou o orçamento do Worker. O `POST /git/blobs` aceita UM arquivo por
     * chamada, e cada chamada é um SUBPEDIDO: um «Guardar» de ciclo com oito arquivos gastava oito
     * subpedidos só a criar blobs. Somados às leituras (fontes, elos, `.conf`, schema, declaração,
     * `-dados.json`, cópia cifrada), o caminho do «Guardar» chegou a 26 subpedidos SÓ NESTE
     * escritor — e o plano gratuito do Cloudflare corta em 50 por invocação, contando o que a rota
     * já gastou antes de cá chegar. Foi assim que o «Guardar» do PO de 08/11/2026 gravou o
     * envelope e o `-po.md` e NÃO gravou as fontes do ciclo: a última escrita do pedido morreu a
     * meio, e o pacote ficou com dois POs a discordar.
     *
     * A ÁRVORE JÁ SABE CRIAR O BLOB: uma entrada do tipo `blob` com `content` (texto ou base64)
     * dispensa o `POST /git/blobs` e é criada na mesma chamada que monta a árvore. Oito
     * subpedidos passam a ZERO, e o commit continua a ser um só — a razão de ser desta função
     * (22/10/2026) fica intacta.
     */
    const entradas = lista.map((a) => ({
      path: a.caminho, mode: '100644', type: 'blob', content: a.conteudo,
    }));

    const arvore = await pedir(raiz + '/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: treeSha, tree: entradas }),
    });
    if (!arvore.ok) {
      // 409 aqui é a `base_tree` que deixou de valer: alguém escreveu no `main` no meio. Recomeça.
      ultimo = 'árvore: HTTP ' + arvore.status;
      if (arvore.status === 409 || arvore.status === 422) continue;
      return { ok: false, status: arvore.status, erro: 'não montei a árvore: ' + ultimo, escritos: [] };
    }

    const novo = await pedir(raiz + '/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: mensagem, tree: arvore.corpo.sha, parents: [commitSha] }),
    });
    if (!novo.ok) {
      ultimo = 'commit: HTTP ' + novo.status;
      if (novo.status === 409 || novo.status === 422) continue;
      return { ok: false, status: novo.status, erro: 'não criei o commit: ' + ultimo, escritos: [] };
    }

    // A REFERÊNCIA É O ÚLTIMO PASSO — o único que publica. Antes dela, nada existe.
    const avanco = await pedir(raiz + '/git/refs/heads/' + ref, {
      method: 'PATCH',
      body: JSON.stringify({ sha: novo.corpo.sha, force: false }),
    });
    if (avanco.ok) {
      return { ok: true, commit: novo.corpo.sha, escritos: lista.map((a) => a.caminho), nada: false };
    }
    ultimo = 'referência: HTTP ' + avanco.status;
    if (avanco.status !== 422 && avanco.status !== 409) break;
    await new Promise((s) => setTimeout(s, intento * 300));
  }
  return { ok: false, erro: 'não avancei ' + ref + ' depois de 3 tentativas — ' + ultimo, escritos: [] };
}

/**
 * A calibração da aula a partir do `.conf`: duração (min) e faixa de volume (tempos). O
 * `DURACOES="60"` é a duração em minutos; `VOLUME_MIN/MAX` são a faixa de tempos (Regra 9).
 */
/**
 * A CALIBRAÇÃO DO MANIFESTO — e a faixa de volume tem de ser a DA DURAÇÃO (20/11/2026).
 *
 * O DEFEITO, medido na Sala `Rosa` a 20/11/2026. A turma passou de 60 para 90 minutos. O
 * `.conf` da variante passou a declarar `DURACOES="90"` e `VOLUME_MIN_90="120"`/
 * `VOLUME_MAX_90="150"` — e esta função continuava a ler `VOLUME_MIN`/`VOLUME_MAX`, as chaves
 * da faixa de 60, que o `comporConf` **já não escreve** num manifesto de 90. Resultado:
 * `volumeMin = 0`, `volumeMax = 0`, `volumeTotal = 0`, e a Aula 01 saía com
 * «[Preencher: volume em tempos]» — o que a `gerar-ciclo.sh` recusa com
 *
 *   erro: aula-01 não declara 'volume-total-90:' para o dia de 90 min (Regra 9).
 *
 * A cadeia inteira corria, o site ficava no pacote antigo, e ninguém sabia porquê.
 *
 * A REGRA É A DO GERADOR, e é copiada de propósito: `tools/gerar-ciclo.sh` resolve o par por
 * `VOLUME_MIN_<dur>` acima dos 60 minutos desde 18/10/2026 — quando uma aula de 75 min era
 * medida com a régua da de 120. Duas leituras diferentes do mesmo manifesto foi exactamente o
 * que produziu este defeito: a do gerador estava certa, a do Worker ficou para trás.
 *
 * O `_60` explícito também vale, e o par genérico continua a ser a reserva até 60 minutos — é a
 * forma que as escolas de antes desta data declaram.
 */
function calibracaoDoConf(texto) {
  const pegar = (chave) => {
    const m = new RegExp('^' + chave + '="([^"]*)"', 'm').exec(texto || '');
    return m ? m[1] : '';
  };
  const duracao = parseInt(pegar('DURACOES'), 10);
  const minutos = Number.isFinite(duracao) ? duracao : 0;
  /* A FAIXA VEM DO NÚCLEO, e não de uma escada local (20/11/2026).
   *
   * Havia cinco cópias desta escada — aqui, no `compor-conf`, na `derivar-ciclo`, no
   * `gerar-ciclo.sh` e no `criar-escola.sh` — e a primeira duração nova mostrou que elas não
   * andavam juntas. Uma cópia a menos é uma divergência a menos: `motor/nucleo/volume.js`
   * resolve a faixa pela ordem declarada → proporção da escola → proporção padrão.
   *
   * O manifesto da variante já traz o par resolvido (`comporConf` escreve-o), portanto na
   * prática este `identidade` lê a chave `'declarada'` e o número é o mesmo de antes. */
  const identidade = {
    VOLUME_MIN: pegar('VOLUME_MIN'),
    VOLUME_MAX: pegar('VOLUME_MAX'),
    ['VOLUME_MIN_' + minutos]: pegar('VOLUME_MIN_' + minutos),
    ['VOLUME_MAX_' + minutos]: pegar('VOLUME_MAX_' + minutos),
    VOLUME_POR_MINUTO_MIN: pegar('VOLUME_POR_MINUTO_MIN'),
    VOLUME_POR_MINUTO_MAX: pegar('VOLUME_POR_MINUTO_MAX'),
  };
  const faixa = volume.faixaDoVolume(minutos, identidade);
  const volumeMin = faixa.min;
  const volumeMax = faixa.max;
  const escola = pegar('ESCOLA');
  const variante = pegar('VARIANTE');
  return {
    duracaoMinutos: minutos,
    volumeMin: Number.isFinite(volumeMin) ? volumeMin : 0,
    volumeMax: Number.isFinite(volumeMax) ? volumeMax : 0,
    volumeOrigem: faixa.origem,
    escolaNome: escola || variante,
  };
}

// ---------------------------------------------------------------------------
// O contexto institucional elicitado (o ATO preenche o manifesto, não o mock)
// ---------------------------------------------------------------------------
// O formulário do plano coleta o contexto institucional como VALOR ESTRUTURADO
// (`contexto-frequencia` = periodicidade, `contexto-duracao` = medida, etc.). O
// `.conf`, porém, é o que o gerador lê — e nasce com valores MOCK (escolas
// simuladas). Aqui o «Guardar» do PO traduz o elicitado de volta para as linhas
// do `.conf`, substituindo o mock pelo que o professor de fato preencheu.

// A lista ÚNICA dos dias — exportada porque o `compor-conf.js` conta os mesmos dias ao derivar
// o manifesto da variante. `sábado` por extenso entrou em 19/10/2026: o cadastro da turma grava
// a abreviação (`sáb`), mas um envelope antigo ou uma derivação à mão pode trazê-la inteira, e
// recusá-la faria a turma parecer sem dias.
const DIA_ISO = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, 'sáb': 6, 'sábado': 6, sabado: 6, dom: 7 };
const UNIDADE_FREQUENCIA = { semanal: 'semana', 'diária': 'dia' };

/**
 * AS DURAÇÕES DO PLANO, EM MINUTOS — e a forma é COMPOSTA, não uma lista (20/11/2026).
 *
 * O DEFEITO MEDIDO. Ela derivou a Sala `Rosa` com **70 minutos** (1 h 10). O plano novo saiu
 * certo — `contexto-duracao: [{1, hora}, {10, minuto}]` —, mas o `.conf` foi composto com
 * `DURACAO_POR_DIA="10,60 min por encontro"` e a geração morreu: «aula-01 não declara
 * 'volume-total:' para o dia de 10 min (Regra 9)». A cadeia inteira correu; o documento não saiu.
 *
 * A CAUSA, E ELA É DE DOIS CAMPOS DIFERENTES COM O MESMO NOME.
 *
 *   · `DURACOES`, no `.conf`, é uma lista — «curta e longa». O gerador lê-a em duas partes
 *     (`DUR_CURTA=${DURACOES%%,*}`, `DUR_LONGA=${DURACOES##*,}`), e somar 60 + 120 daria 180,
 *     uma duração que não existe. Essa parte da correção de 18/10/2026 continua verdadeira.
 *   · `contexto-duracao`, no PLANO, não é isso. É UMA duração escrita em duas parcelas, e a
 *     autoridade é o conteúdo (`porta/plano/conteudo/plano.json`):
 *
 *         "campo": "Duração por aula",          ← uma, e «por aula»
 *         "medida": { "pares": 2, "fixas": ["hora", "minuto"] }
 *
 *     Duas posições FIXAS — a hora e o minuto. Somam-se.
 *
 * O QUE SE PERDEU AO TRATAR OS DOIS COMO UM. Com 45 min (`[{45, minuto}]`) e com 60
 * (`[{1, hora}]`) há uma só parcela, e o erro não aparecia: o valor saía certo por acidente. Com
 * 1 h 10 há duas, e a vírgula do `.conf` transformou `70` em `10,60` — um dia de 10 minutos, que
 * a Regra 9 não perdoa.
 *
 * Somar por POSIÇÃO (e não acumular tudo) mantém o caso de um valor repetido a valer uma vez:
 * `[{60,minutos},{60,minutos}]` continua a ser 60, porque não há duas parcelas de horas a somar.
 */
function minutosDaDuracao(duracao) {
  if (!duracao) return null;
  const partes = Array.isArray(duracao) ? duracao : [duracao];
  let horas = 0;
  let minutos = 0;
  let viu = false;
  for (const p of partes) {
    if (!p || typeof p !== 'object') continue;
    const n = Number(p.numero);
    if (!Number.isFinite(n) || n <= 0) continue;
    const u = String(p.unidade || '').toLowerCase();
    if (u === 'hora' || u === 'horas') { horas = n; viu = true; }
    else if (u === 'minuto' || u === 'minutos') { minutos = n; viu = true; }
  }
  if (!viu) return null;
  const total = horas * 60 + minutos;
  return total > 0 ? String(total) : null;
}

/** `2026-10-20` → `20/10/2026` (o `.conf` usa dd/mm/aaaa). */
function dataBrasil(valor) {
  const t = String(valor || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : (t || null);
}

/** A frequência descritiva do `.conf`: `2x/semana`. */
function frequenciaDoContexto(periodicidade) {
  if (!periodicidade || typeof periodicidade !== 'object') return null;
  const vezes = periodicidade.vezes;
  const por = UNIDADE_FREQUENCIA[periodicidade.por] || periodicidade.por;
  if (vezes === null || vezes === undefined || !por) return null;
  return String(vezes) + 'x/' + por;
}

/** A hora do `DIAS` atual (a institucional, preservada) — `null` se não houver. */
function horaDosDias(confTexto) {
  // Sem âncora no fim: o `.conf` da escola de 15/10 tem COMENTÁRIO na mesma linha
  // (`DIAS="2@19:00,4@19:00"   # HORA FICTÍCIA…`), e o `$` fazia a leitura devolver `null` —
  // com isso o `DIAS` do plano NUNCA era aplicado, e um manifesto dizia `FREQUENCIA="3x/semana"`
  // com dois dias na lista. Medido em 19/10/2026, no `.conf` da escola `fita`.
  const m = /^DIAS="([^"]*)"/m.exec(confTexto || '');
  if (!m) return null;
  const h = /@(\d{2}:\d{2})/.exec(m[1]);
  return h ? h[1] : null;
}

/**
 * As linhas do `.conf` que o ATO preenche. Devolve `[{chave, valor}]` — só os
 * campos elicitados; o que não foi preenchido fica como está (o mock vira a
 * exceção, não a regra, e a lacuna continua declarada pelo `.conf`).
 */
function linhasDeContexto(plano, confTexto) {
  const saida = [];

  const periodicidade = respostaDo(plano, 'contexto-frequencia');
  const freq = frequenciaDoContexto(periodicidade);
  if (freq) saida.push({ chave: 'FREQUENCIA', valor: freq });

  const duracao = minutosDaDuracao(respostaDo(plano, 'contexto-duracao'));
  if (duracao) {
    saida.push({ chave: 'DURACOES', valor: String(duracao) });
    saida.push({ chave: 'DURACAO_POR_DIA', valor: duracao + ' min por encontro' });
  }

  const total = respostaDo(plano, 'contexto-total-aulas');
  if (total !== null && total !== undefined && String(total).trim() !== '') {
    saida.push({ chave: 'TOTAL_AULAS', valor: String(total).trim() });
  }

  const calendario = respostaDo(plano, 'contexto-calendario');
  const inicio = dataBrasil(calendario && calendario.inicio);
  if (inicio) saida.push({ chave: 'DATA_INICIO', valor: inicio });

  // O dia da semana vem do ato; a HORA é institucional (o horário da escola) e
  // não é elicitada — preserva-se a do `.conf` atual, quando existe.
  const dias = (periodicidade && Array.isArray(periodicidade.dias) && periodicidade.dias) || [];
  const numeros = dias.map((d) => DIA_ISO[String(d).toLowerCase()]).filter((n) => n);
  const hora = horaDosDias(confTexto);
  if (numeros.length && hora) {
    saida.push({ chave: 'DIAS', valor: numeros.map((n) => n + '@' + hora).join(',') });
  }

  return saida;
}

/** Aplica as linhas no texto do `.conf` (`CHAVE="..."` → `CHAVE="novo"`). */
function aplicarLinhas(texto, linhas) {
  let saida = texto;
  for (const l of linhas) {
    const re = new RegExp('^' + l.chave + '="[^"]*"', 'm');
    if (re.test(saida)) saida = saida.replace(re, l.chave + '="' + l.valor + '"');
  }
  return saida;
}

/** O `DOCS` atual do manifesto, como lista (vazia quando `DOCS=""`). */
function docsAtuais(texto) {
  // Pelo mesmo motivo do `DIAS`: comentário na mesma linha não pode esconder o valor.
  const m = /^DOCS="([^"]*)"/m.exec(texto || '');
  if (!m) return [];
  return m[1].trim().split(/\s+/).filter(Boolean);
}

/**
 * A lista completa de `DOCS` do ciclo «do zero»: o que o derivador gera, na ordem do manifesto
 * de referência (plano, harmonização, aulas, captura, notação+glossário, referências).
 */
function docsGerados({ plano }) {
  const notacao = notacaoEscolhida(plano);
  const docs = ['plano', 'harmonizacao', 'aula-01', 'captura-aula-01'];
  if (notacao) docs.push('notacao', 'glossario-' + slugDe(notacao));
  docs.push('referencias');
  return docs;
}

/**
 * Monta o escritor do ciclo. Sem token devolve `null`. Devolve
 * `({ plano, po, contexto }) => Promise` — deriva as seis fontes, escreve só as que faltam,
 * liga o `DOCS` e declara a variante no schema de captura.
 */
/**
 * O ESCRITOR DO CICLO. `fetchImpl` existe para as provas poderem interceptar a rede, como em
 * todo o resto do motor (`lerArquivoRemoto` e `gravarArquivosNumCommit` já o aceitavam) — sem
 * ele, a única forma de exercitar este caminho era falar com o GitHub a sério.
 */
function criarEscritorDeCiclo({ token, dono, repo, ref, senhaCripto, fetchImpl }) {
  if (!token) return null;

  /* QUANTO CUSTA ESTE TRABALHO, ANTES DE O COMEÇAR (08/11/2026).
   *
   * O teto de subpedidos do Cloudflare é POR INVOCAÇÃO (50 no plano gratuito), e o «Guardar» não
   * é o único a gastar dele: a rota já leu o plano, a linha de base, as curadorias e as anamneses
   * antes de cá chegar. Quando o teto estoura, a invocação é abortada A MEIO — e foi assim que o
   * `-po.md` ficou gravado com as fontes do ciclo por gravar.
   *
   * Esta conta é deliberadamente generosa (o pior caso): uma leitura por fonte derivada, mais o
   * `.conf`, o `-dados.json`, o schema, a declaração, a listagem de `historico/` (só quando alguma
   * fonte muda) e as cinco chamadas do commit único (referência, commit, árvore, commit, referência).
   * Por cima do real, e não por baixo: recusar a mais custa uma repetição; recusar a menos custa
   * um ciclo pela metade.
   */
  const fontesPrevistas = 7;   // aula, referências, captura, harmonização, dados, notação, glossário
  const custoPrevisto = 1 + 1 + fontesPrevistas + 1 + 1 + 1 + 1 + 5;
  const custoDasFontes = (n) => 1 + 1 + n + 1 + 1 + 1 + 1 + 5;

  const escrever = async ({ plano, po, contexto, linhaDeBase, anamneses }) => {
    const ctx = contexto || {};
    const escolaNome = ctx.escolaNome || ctx.escola;
    const relatorio = { conf: null, escritas: [], puladas: [], elos: [], docs: null, schema: null };
    /*
     * AS GRAVAÇÕES DESTE «GUARDAR» ACUMULAM AQUI E SAEM NUM COMMIT SÓ (22/10/2026).
     *
     * Antes, cada arquivo era um `PUT /contents` — logo, um commit, logo três workflows. O
     * «Guardar» do PO fazia onze commits em vinte e dois segundos e trinta execuções, e o
     * enxame perdia a corrida uns contra os outros: dois vermelhos com treze arquivos de índice
     * em conflito. Um commit por gravação também é a única forma de o repositório nunca guardar
     * um ciclo pela metade (o `-dados.json` sem o `.conf` a declará-lo, por exemplo).
     *
     * `lote` guarda o que escrever; `marcas` guarda a quem devolver o resultado — porque o
     * relatório continua a dizer arquivo por arquivo o que entrou.
     */
    /* A PRIMEIRA PERGUNTA, ANTES ATÉ DA LEITURA DO `.conf` (08/11/2026). Com o orçamento já no
     * limite, nem os dois `GET` de preparação devem sair: a recusa tem de custar ZERO. A conta
     * aqui é a do pior caso (sete fontes); a exata volta a ser feita quando o plano já disse
     * quantas são. */
    const orcamentoDeFora = orcamentoDe(fetchImpl);
    if (orcamentoDeFora && !orcamentoDeFora.coube(custoPrevisto)) {
      return Object.assign(relatorio, {
        ok: false,
        motivo: 'orcamento',
        erro: orcamentoDeFora.motivo(custoPrevisto),
        orcamento: { usados: orcamentoDeFora.usados, limite: orcamentoDeFora.limite },
      });
    }

    const lote = [];
    const marcas = [];
    const juntar = (caminho, conteudo, aoOk) => {
      lote.push({ caminho, conteudo });
      marcas.push({ caminho, aoOk });
    };

    // 1. O manifesto da variante — calibração + escola + DOCS atual.
    const confPath = caminhoDoConf(ctx);
    const conf = await lerArquivoRemoto({ token, dono, repo, ref, caminho: confPath, fetchImpl });
    if (!conf.existe) {
      return Object.assign(relatorio, { conf: { ok: false, erro: '.conf não encontrado em ' + confPath } });
    }
    const cal = calibracaoDoConf(conf.texto);
    ctx.escolaNome = cal.escolaNome || escolaNome;
    relatorio.conf = { ok: true, cal };

    // 2. As fontes derivadas, cada uma com o seu caminho. O `-dados.json` é a
    // FONTE (não entra em DOCS): é o que o cifrador lê para publicar a cópia no
    // pacote — sem ela o `check-pacote.js` acusa o pacote incompleto.
    /* QUE AULAS O CICLO JÁ TEM (02/11/2026). O §8 da aula escreve «a Aula 02 ainda não foi
     * elaborada» ou, quando ela existir, um link para ela — e para escolher entre os dois o
     * derivador tem de saber a resposta. Quem sabe é o `DOCS` do manifesto, que este mesmo
     * escritor liga mais abaixo. Sem esta passagem, o derivador só podia afirmar «não existe»,
     * que é o que deixa de ser verdade no dia em que a segunda aula nascer. */
    const aulasDoCiclo = docsAtuais(conf.texto)
      .map((d) => /^aula-(\d+)$/.exec(d))
      .filter(Boolean)
      .map((m) => m[1]);

    /* AS AULAS JÁ LANÇADAS SÃO LIDAS ANTES DE A FONTE SER DERIVADA (08/11/2026).
     *
     * O DEFEITO, medido: `derivarDados` escrevia `aulas: {}` sempre — e esta geração é disparada
     * pelo «Guardar» do PO, que é exactamente o gesto que a cascata do elenco exige. Tirar uma
     * aluna do elenco e regravar o PO deixava a fonte com `aulas: {}`: as aulas lançadas só
     * sobreviviam no elo de `historico/`, que ninguém lê, e o ciclo perdia o passado por causa de
     * uma correcção do presente. O `-dados.json` atual é, por isso, uma ENTRADA da derivação — e
     * não um arquivo a substituir às cegas. O texto derivado é guardado aqui porque o passo 3b
     * (a cópia cifrada) tem de cifrar ESTE texto, e não uma segunda derivação dele. */
    const caminhoDados = caminhoDaFonte(ctx, '-dados.json');
    /* A LEITURA É MEMOIZADA PARA ESTA GRAVAÇÃO. O ficheiro é lido aqui (para preservar as aulas) e
     * outra vez pelo passo 3 (para decidir se mudou); duas idas ao GitHub pelo mesmo ficheiro no
     * mesmo pedido são cota gasta sem informação nova. O mapa é local a esta chamada — nada
     * envelhece entre pedidos. */
    const lidos = new Map();
    const lerFonte = (caminho) => {
      if (!lidos.has(caminho)) {
        lidos.set(caminho, lerArquivoRemoto({ token, dono, repo, ref, caminho, fetchImpl }));
      }
      return lidos.get(caminho);
    };
    const dadosAtuais = await lerFonte(caminhoDados);
    if (dadosAtuais.erro) {
      return Object.assign(relatorio, { erro: 'não consegui ler ' + caminhoDados + ': ' + dadosAtuais.erro });
    }
    let dadosAnteriores = null;
    if (dadosAtuais.existe) {
      try { dadosAnteriores = JSON.parse(dadosAtuais.texto); } catch (e) { dadosAnteriores = null; }
    }
    const dadosDerivados = derivarDados({
      po, contexto: ctx, linhaDeBase, anteriores: dadosAnteriores, anamneses,
    });

    const fontes = [
      /* A LINHA DE BASE DA TURMA VAI AO GUIA (06/11/2026). O eixo do Corpo da Aula 01 é o
       * recorte do passo 4 e a leitura do passo 3, e este escritor não os passava: o guia só
       * sabia o que o campo `aspecto-fisico` do PLANO tivesse — e esse campo pede que se carregue
       * a sugestão à mão. Resultado medido no ciclo-01 da calango: quatro aspectos escolhidos na
       * linha de base, e a Aula 01 a imprimir «[Preencher: carregue a sugestão…]». Opcional, para
       * o adaptador local e as bancadas continuarem a derivar sem ela. */
      /* O CARIMBO VIGENTE DE CADA ALUNA VAI AO GUIA (06/11/2026) — a §6 «Proveniência
       * consolidada» passou a ter a anamnese de cada uma, com os dois links (editar e imprimir).
       * `anamneses` é `{aluna: carimbo}`, resolvido por quem chama (`rotas.js`), porque o
       * derivador é puro e não lê o acervo. Opcional: sem ele, a linha de cada aluna sai com o
       * único link que não precisa de carimbo — o de fazer a anamnese. */
      { sufixo: '-aula-01.md',
        md: derivarAula01({ plano, po, contexto: Object.assign({}, ctx, { aulas: aulasDoCiclo }),
          calibracao: cal, linhaDeBase, anamneses }) },
      { sufixo: '-referencias.md', md: derivarReferencias({ plano, contexto: ctx }) },
      /* O `plano` VAI (06/11/2026) — e faltava aqui. A declaração `porVariante` passou a recebê-lo
       * (é dela que saem as colunas do schema), e a FOLHA não o recebia: o schema declarava as
       * colunas dos objetivos e a folha não as tinha. O validador só acusa coluna da folha NÃO
       * declarada — o contrário passa em silêncio, e o pacote sairia com uma folha mais pobre do
       * que o próprio schema. Uma classe de defeito que só se vê comparando os dois lados. */
      /* A LINHA DE BASE VAI TAMBÉM À FOLHA E AO JSON DE DADOS (06/11/2026). Sem ela, os dois
       * liam o `sujeitos` do PO e a turma saía com uma aluna a mais — a que o PO herdou de um
       * envelope anterior à regra. Ver `elencoDoCiclo` em `derivar-ciclo.js`. */
      { sufixo: '-captura-aula-01.md',
        md: derivarCaptura({ po, plano, contexto: ctx, linhaDeBase, anamneses }) },
      { sufixo: '-harmonizacao.md', md: derivarHarmonizacao({ plano, po, contexto: ctx }) },
      { sufixo: '-dados.json', md: dadosDerivados },
    ];
    const notacao = notacaoEscolhida(plano);
    if (notacao) {
      fontes.push({ sufixo: '-notacao.md', md: derivarNotacao({ plano, contexto: ctx }) });
      fontes.push({ sufixo: '-glossario-' + slugDe(notacao) + '.md', md: derivarGlossario({ plano, contexto: ctx }) });
    }

    /* O ORÇAMENTO, ANTES DO PRIMEIRO SUBPEDIDO DE ESCRITA (08/11/2026).
     *
     * Se não couber, NADA é escrito — nem as fontes, nem a cópia cifrada, nem o `.conf`. É a
     * diferença entre «repita o Guardar» e «o ciclo ficou meio gravado»: a invocação que estoura
     * o teto é abortada a meio, e o repositório guarda o que já tinha entrado. */
    const orcamento = orcamentoDe(fetchImpl);
    if (orcamento && !orcamento.coube(custoDasFontes(fontes.length))) {
      return Object.assign(relatorio, {
        ok: false,
        motivo: 'orcamento',
        erro: orcamento.motivo(custoDasFontes(fontes.length)),
        orcamento: { usados: orcamento.usados, limite: orcamento.limite },
      });
    }

    /*
     * AS FONTES DERIVADAS MUDAM COM O PO — e a versão substituída fica como elo
     * (22/10/2026).
     *
     * Até aqui, este passo era `if (atual.existe) continue`, com a justificação certa e
     * aplicada ao alvo errado: «a proveniência acrescenta, não edita» vale para o MATERIAL
     * (a aula lançada, o relatório, a observação), e não para um DERIVADO, que é reconstruível
     * por definição. Tratar o derivado como material deixava o pacote meio a meio quando o PO
     * era eliciado duas vezes: o `-po.md` era sobrescrito (é a única fonte que se atualiza em
     * sítio), o `po-01.json` saía dele, e a `-aula-01.md`/`-harmonizacao.md` continuavam a
     * descrever o PO anterior — dois documentos do mesmo ciclo a dizer coisas diferentes, com
     * um `.fipp` a certificar o conjunto.
     *
     * A versão substituída não se apaga: ganha o carimbo de quem a substituiu no NOME e fica em
     * `historico/`, ao lado das fontes mas fora do alcance de quem as varre (ver `caminhoDoElo`).
     * É elo, e é proveniência — mas não é fonte: não entra na âncora nem no pacote.
     */
    const carimboDoPO = (po && (po.id || po.carimbo)) || 'po';
    const ocupados = new Set(lote.map((x) => x.caminho));
    /* A pasta `historico/` é lida UMA vez, à primeira fonte que muda (08/11/2026) — ver
     * `nomesDaPastaRemota`. Fica `null` enquanto nenhuma fonte mudou: um «Guardar» sem alteração
     * não paga nem esta leitura. */
    let daPasta = null;
    const caminhoDoElo = async (caminho) => {
      /*
       * OS ELOS VIVEM EM `historico/`, E NÃO AO LADO DAS FONTES — e isto não é arrumação.
       *
       * Dois scripts varrem a pasta do ciclo com glob e derivam NÚMERO do nome:
       *   · `familias_por_aula` (`tools/lib-fontes.sh`) — `ciclo-$CICLO-*aula-*.md`, e o número
       *     sai de `sed 's/.*-\([0-9][0-9]*\)\.md$/\1/'`;
       *   · `gerar-handoff.sh` — `find ... -maxdepth 1 -name "ciclo-$c-*-aula-*.md"`.
       * Um elo chamado `…-aula-01.antes-de-po-20261022-1108.md` casa nos dois, e o `sed` o lê
       * como a AULA 1108 — que entraria no `DOCS` e o gerador tentaria publicar. Medido em
       * 22/10/2026, antes de o elo existir: é o tipo de defeito que só aparece meses depois,
       * com um «aula-1108» no pacote.
       *
       * `historico/` fica fora dos dois: o `fontes_do_ciclo` lista as fontes por NOME (nunca
       * por glob recursivo), e os dois globs acima são de um nível só.
       */
      const partes = caminho.split('/');
      const arquivo = partes.pop();
      const dir = partes.join('/') + '/historico/';
      const m = /^(.*?)(\.[a-z0-9]+)$/i.exec(arquivo);
      const base = m ? m[1] : arquivo;
      const ext = m ? m[2] : '';
      /* A COLISÃO DO NOME PERGUNTA-SE À PASTA, E UMA VEZ SÓ (08/11/2026). Era um `GET` por
       * arquivo para saber se o nome já existia — sete subpedidos no caminho do «Guardar», que é
       * justamente o que estourava o orçamento do Worker. A listagem vem em cache local da
       * chamada: a segunda fonte que muda não paga nada por perguntar. */
      if (!daPasta) {
        daPasta = await nomesDaPastaRemota({
          token, dono, repo, ref, fetchImpl, pasta: dir.replace(/\/+$/, ''),
        });
      }
      const jaExiste = (nome) => ocupados.has(nome)
        || Boolean(daPasta && daPasta.nomes && daPasta.nomes.has(nome.split('/').pop()));
      let n = 0;
      let alvo = dir + base + '.antes-de-' + carimboDoPO + ext;
      // O mesmo carimbo a substituir duas vezes não pode colidir consigo próprio.
      while (jaExiste(alvo)) {
        n += 1;
        alvo = dir + base + '.antes-de-' + carimboDoPO + '-' + n + ext;
      }
      ocupados.add(alvo);
      return alvo;
    };

    // 3. As fontes derivadas: escreve a que muda, guarda a anterior como elo, e não toca na
    //    que já está igual (idempotente — «Guardar» duas vezes sem mudar nada não faz commit).
    for (const fonte of fontes) {
      const caminho = caminhoDaFonte(ctx, fonte.sufixo);
      const atual = await lerFonte(caminho);
      if (atual.erro) {
        relatorio.escritas.push({ caminho, ok: false, erro: atual.erro });
        continue;
      }
      if (atual.existe && atual.texto === fonte.md) {
        relatorio.puladas.push(caminho);
        continue;
      }
      if (atual.existe) {
        const elo = await caminhoDoElo(caminho);
        juntar(elo, atual.texto);
        relatorio.elos.push({ de: caminho, para: elo });
      }
      juntar(caminho, fonte.md);
      relatorio.escritas.push({ caminho });
    }

    // 3b. A CÓPIA cifrada do `-dados.json`, ao lado da fonte. Com a senha de criptografia no
    //     Worker (SENHA_CRIPTO), o Worker é quem cifra — o gerador só copia o resultado para o
    //     pacote (caminho (a): a senha nunca sai do Cloudflare). Sem senha, este passo é um
    //     aviso no relatório, não um erro: a fonte segue escrita, e a cópia nasce no gerador.
    //
    //     `relatorio.cifrado` é preenchido em TODOS os caminhos, inclusive nos que não escrevem
    //     nada. Não é zelo: por dois dias esta cópia não nasceu e NADA o disse — o `check-pacote`
    //     reprovava o pacote por falta do JSON de dados e o «Gerar» terminava em silêncio, com o
    //     motivo só no `relatorio` que ninguém lia (Barra, 15/10/2026). Falha aqui REPROVA o
    //     pacote; ela tem de ser dita.
    const caminhoCifrado = caminhoDaFonte(ctx, '-dados.cifrado.json');
    // A cópia cifrada é DERIVADA do `-dados.json`: quando a fonte muda, ela muda com ele. A
    // cifra não é determinística (o sal muda a cada cifragem), portanto não se compara byte a
    // byte — compara-se a PROCEDÊNCIA: o `-dados.json` foi regerado nesta gravação?
    const dadosMudou = relatorio.escritas.some((e) => /-dados\.json$/.test(e.caminho || ''));
    if (!senhaCripto) {
      relatorio.cifrado = { ok: false, caminho: caminhoCifrado, erro: 'sem SENHA_CRIPTO no Worker' };
    } else {
      /* A LEITURA DA CÓPIA SÓ SE FAZ QUANDO ELA DECIDE ALGUMA COISA (08/11/2026). Era um `GET`
       * a mais em TODOS os «Guardar»: quando o `-dados.json` foi regerado nesta gravação, a cópia
       * vai ser reescrita de qualquer maneira, e perguntar se ela existe não muda nada. Um
       * subpedido é barato sozinho e caro no fim do orçamento — e este era dos que não pagavam. */
      const atualCifrado = dadosMudou ? null
        : await lerArquivoRemoto({ token, dono, repo, ref, caminho: caminhoCifrado, fetchImpl });
      if (atualCifrado && atualCifrado.erro) {
        relatorio.cifrado = { ok: false, caminho: caminhoCifrado, erro: atualCifrado.erro };
      } else if (atualCifrado && atualCifrado.existe && !dadosMudou) {
        relatorio.puladas.push(caminhoCifrado);
        relatorio.cifrado = { ok: true, caminho: caminhoCifrado, nota: 'a cópia já existia' };
      } else {
        try {
          /* O MESMO TEXTO que a fonte acabou de receber — e não uma segunda derivação. Duas
           * derivações do mesmo dado é a porta para a cópia divergir da fonte, e o
           * `check-pacote.js` compara as duas (`lancamentos` e `apelidos`). */
          const envelope = await cifrarEnvelopeDeDados(dadosDerivados, senhaCripto);
          juntar(caminhoCifrado, JSON.stringify(envelope, null, 2) + '\n', (ok, erro) => {
            relatorio.cifrado = ok ? { ok: true, caminho: caminhoCifrado } : { ok: false, caminho: caminhoCifrado, erro };
          });
          relatorio.escritas.push({ caminho: caminhoCifrado });
        } catch (e) {
          relatorio.cifrado = { ok: false, caminho: caminhoCifrado, erro: (e && e.message) || String(e) };
        }
      }
    }

    // 4. O manifesto da variante: o contexto institucional elicitado no plano
    //    substitui o mock, e o `DOCS` é ligado ao ciclo «do zero». Um ÚNICO
    //    write (o `sha` é o do conf lido no passo 1 — duas escritas seguidas
    //    falhariam porque a primeira já mudaria o `sha`).
    let confTexto = conf.texto;
    const linhasCtx = linhasDeContexto(plano, confTexto);
    if (linhasCtx.length) {
      const comContexto = aplicarLinhas(confTexto, linhasCtx);
      if (comContexto !== confTexto) {
        confTexto = comContexto;
        relatorio.contexto = { ok: true, campos: linhasCtx.map((l) => l.chave) };
      }
    }

    const atuais = docsAtuais(confTexto);
    if (!atuais.includes('aula-01')) {
      const novoDocs = docsGerados({ plano });
      confTexto = confTexto.replace(/^DOCS="[^"]*"/m, 'DOCS="' + novoDocs.join(' ') + '"');
      relatorio.docs = { ok: true, docs: novoDocs };
    } else {
      relatorio.docs = { ok: true, nota: 'DOCS já completo (aula-01 presente)' };
    }

    if (confTexto !== conf.texto) {
      // O `sha` do `contents` não é preciso: a árvore é montada sobre a `base_tree` lida no
      // momento do commit, e é isso que impede a escrita de sobrescrever o que chegou no meio.
      juntar(confPath, confTexto, (ok) => {
        relatorio.docs.ok = ok;
        if (relatorio.contexto) relatorio.contexto.gravado = ok;
      });
    }
    // 5. Declara a variante na DECLARAÇÃO DA CAPTURA — o arquivo da variante, não o schema.
    const schemaPath = caminhoDoSchemaDeCaptura(ctx);
    const declaracaoPath = caminhoDaDeclaracaoDeCaptura(ctx);
    const schema = await lerArquivoRemoto({ token, dono, repo, ref, caminho: schemaPath, fetchImpl });
    if (!schema.existe) {
      relatorio.schema = { ok: false, erro: 'schema de captura não encontrado em ' + schemaPath };
    } else {
      let dados = null;
      try { dados = JSON.parse(schema.texto); } catch { dados = null; }
      if (!dados || !dados._declaracao) {
        relatorio.schema = { ok: false, erro: 'schema de captura sem `_declaracao`' };
      } else {
        /*
         * A CHAVE É A VARIANTE, NÃO A ESCOLA (19/10/2026).
         *
         * Era `ctx.escola`, e o gerador procura por `VARIANTE` do `.conf` — que, com turma no
         * contexto, é `<escola>-<turma>`. O efeito: a declaração era escrita debaixo de
         * `calando-teste-1`, e `gerar-ciclo.sh … calando-teste-1-bale-nivel-1-teste-1` não a
         * encontrava. A folha saía com os blocos e as colunas certos, todos com `chave: null`,
         * e o validador recusava: «bloco da folha não declarado no schema». É o mesmo engano
         * do disparo (`disparar.js`), que mandava a escola onde o gerador queria a variante —
         * e é por isso que os dois estão juntos: um sem o outro não gera nada.
         */
        const slug = varianteDoContexto(ctx) || String(ctx.escola || '').trim();
        /*
         * A DECLARAÇÃO SEGUE O PO, E NÃO A PRIMEIRA ESCRITA (20/10/2026).
         *
         * Era `if (porVariante[slug]) → «já declarada»`, e isso partiu a geração da `batata`:
         * a variante já tinha sido declarada noutra ronda de teste, o schema é PRESERVADO pelo
         * expurgo (é o modelo de que nasce escola nova), e a entrada antiga — com os rótulos
         * daquela ronda — sobreviveu para contradizer o PO novo. A folha saiu com os critérios
         * elicitados e a declaração com «Teste tec solo»; o validador recusou uma coluna por
         * bloco («coluna da folha não declarada no schema») e o pacote não foi gerado.
         *
         * O merge conserva `chave` e `tipo` do que já era declarado — renomear a chave
         * reescreveria o passado, e é ela que o lançamento usa para guardar a marca — e só
         * acrescenta o que é novo. Quando nada muda, não há commit: o «Guardar» do PO é um
         * clique que se repete.
         */
        const derivada = declaracaoDeCaptura({ po, plano,
          escola: ctx.escolaNome || escolaNome });
        /*
         * O ARQUIVO DA VARIANTE É A FONTE (07/11/2026), E O SCHEMA É LIMPO NO MESMO COMMIT.
         *
         * Ele é lido primeiro. A entrada antiga no schema serve de base ao merge enquanto houver
         * escolas anteriores a esta mudança, e é RETIRADA no mesmo commit — migração que não
         * deixa duas verdades. Um schema que ainda declare variantes de OUTRAS escolas é limpo
         * delas também: são fantasmas de escolas que o expurgo já levou, e é exatamente o lixo
         * que esta mudança existe para não voltar a acumular.
         */
        const anteriorNoSchema = (dados._declaracao.porVariante || {})[slug];
        const arquivoDaDeclaracao = await lerArquivoRemoto({
          token, dono, repo, ref, caminho: declaracaoPath, fetchImpl,
        });
        let anteriorNoArquivo = null;
        if (arquivoDaDeclaracao.existe) {
          try { anteriorNoArquivo = JSON.parse(arquivoDaDeclaracao.texto); } catch { anteriorNoArquivo = null; }
        }
        const anterior = anteriorNoArquivo || anteriorNoSchema || null;
        const jaDeclarada = Boolean(anterior);
        const nova = mesclarDeclaracao(anterior, derivada);

        if (dados._declaracao.porVariante) {
          delete dados._declaracao.porVariante;
          juntar(schemaPath, JSON.stringify(dados, null, 2) + '\n', () => {});
        }

        if (!precisaGravar(anterior, nova)) {
          relatorio.schema = {
            ok: true,
            nota: jaDeclarada ? 'variante ' + slug + ' já declarada, e em dia' : 'sem declaração',
          };
        } else {
          // A DECLARAÇÃO entra no MESMO commit das fontes. Ela é o último passo que valida o
          // pacote, e separá-la era a mesma coisa que escrever o ciclo em duas metades.
          juntar(declaracaoPath, JSON.stringify(nova, null, 2) + '\n', (ok) => {
            relatorio.schema = { ok, actualizada: jaDeclarada };
          });
          // Ainda NÃO está gravado: o `ok` é decidido no commit único, no fim. Dizer `true` aqui
          // seria prometer o que o repositório pode recusar.
          relatorio.schema = { ok: null, actualizada: jaDeclarada, pendente: true };
        }
      }
    }

    /*
     * O COMMIT ÚNICO — e o relatório só diz «ok» DEPOIS de o repositório aceitar. Se o commit
     * falhar, todas as marcas ficam com `false` e o motivo vai no relatório: uma gravação que
     * mente sobre ter entrado é pior do que uma que falha.
     */
    if (lote.length) {
      const mensagem = 'feat(ciclo): o «Guardar» do PO grava as fontes de '
        + (varianteDoContexto(ctx) || ctx.escola) + ' num commit só';
      const commit = await gravarArquivosNumCommit({
        token, dono, repo, ref, arquivos: lote, mensagem, fetchImpl,
      });
      relatorio.commit = { ok: commit.ok, sha: commit.commit || null, arquivos: lote.length,
        ...(commit.ok ? {} : { erro: commit.erro || ('HTTP ' + commit.status) }) };
      for (const marca of marcas) {
        if (typeof marca.aoOk === 'function') marca.aoOk(commit.ok === true, commit.erro || null);
      }
      for (const escrita of relatorio.escritas) {
        escrita.ok = commit.ok === true;
        if (!commit.ok) escrita.erro = commit.erro || ('HTTP ' + commit.status);
        else escrita.status = 201;
      }
      // Uma falha a escrever REPROVA o relatório: o pacote não pode ser gerado sobre um ciclo
      // que o repositório não tem.
      if (!commit.ok) relatorio.ok = false;
    }

    return relatorio;
  };

  /* A PREVISÃO VAI PENDURADA NO ESCRITOR, para quem chama perguntar ANTES de gastar o primeiro
   * subpedido. `custoDasFontes` é pública pela mesma razão que a conta existe: quem sabe quantas
   * fontes o plano gera consegue ser exato. */
  escrever.previsao = () => custoPrevisto;
  escrever.custoDasFontes = custoDasFontes;
  /* O ESTADO DO ORÇAMENTO, para quem chama perguntar o que sobra ANTES de gastar (a rota usa-o
   * para decidir se a cadeia inteira — `-po.md` e fontes — cabe, em vez de gravar metade). */
  escrever.orcamento = () => orcamentoDe(fetchImpl);
  return escrever;
}

module.exports = {
  gravarArquivosNumCommit,
  nomesDaPastaRemota,
  criarEscritorDeCiclo,
  caminhoDaFonte,
  caminhoDoSchemaDeCaptura,
  caminhoDaDeclaracaoDeCaptura,
  calibracaoDoConf,
  docsGerados,
  docsAtuais,
  linhasDeContexto,
  aplicarLinhas,
  minutosDaDuracao,
  dataBrasil,
  frequenciaDoContexto,
  DIA_ISO,
  lerArquivoRemoto,
  gravarArquivoRemoto,
};
