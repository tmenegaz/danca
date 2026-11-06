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
const { cifrarEnvelopeDeDados } = require('./cifrar-envelope.js');
const { respostaDo } = require('../nucleo/derivar-po.js');
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

/** Escreve (cria ou atualiza) um arquivo remoto, devolvendo o resultado. */
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

    // Um blob por arquivo. O conteúdo vai em base64 — a mesma codificação que o `contents` usa.
    const entradas = [];
    for (const a of lista) {
      const blob = await pedir(raiz + '/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: codificarBase64(a.conteudo), encoding: 'base64' }),
      });
      if (!blob.ok) {
        return { ok: false, status: blob.status, erro: 'não criei o blob de ' + a.caminho + ': HTTP ' + blob.status, escritos: [] };
      }
      entradas.push({ path: a.caminho, mode: '100644', type: 'blob', sha: blob.corpo && blob.corpo.sha });
    }

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
function calibracaoDoConf(texto) {
  const pegar = (chave) => {
    const m = new RegExp('^' + chave + '="([^"]*)"', 'm').exec(texto || '');
    return m ? m[1] : '';
  };
  const duracao = parseInt(pegar('DURACOES'), 10);
  const volumeMin = parseInt(pegar('VOLUME_MIN'), 10);
  const volumeMax = parseInt(pegar('VOLUME_MAX'), 10);
  const escola = pegar('ESCOLA');
  const variante = pegar('VARIANTE');
  return {
    duracaoMinutos: Number.isFinite(duracao) ? duracao : 0,
    volumeMin: Number.isFinite(volumeMin) ? volumeMin : 0,
    volumeMax: Number.isFinite(volumeMax) ? volumeMax : 0,
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

/** A duração elicitada (pares hora+minuto) em minutos, ou `null`. */
/**
 * As durações da aula, no formato do `.conf` (`DURACOES="60"` ou `"60,120"`).
 *
 * Duas correções em 18/10/2026, e a primeira explica o CI vermelho de `fita`:
 *
 * 1. **O valor chega como OBJETO** (`{numero, unidade}`), não como lista — é o que
 *    `respostaDo` devolve e o que `comporMedida` (nucleo/derivar-po.js) já sabia ler. A versão
 *    anterior exigia `Array.isArray` e devolvia `null` para o caso normal, de modo que
 *    `DURACOES` e `DURACAO_POR_DIA` **nunca** eram escritos pelo ato: o `.conf` ficava com o
 *    que `criar-escola.sh` tinha posto. Foi por isso que um plano de 55 min conviveu com um
 *    manifesto de 60.
 * 2. **Duas durações são uma LISTA, não uma soma.** O `.conf` lê `DURACOES` como «curta e
 *    longa» (`DUR_CURTA=${DURACOES%%,*}`, `DUR_LONGA=${DURACOES##*,}`). Somar 60 + 120 daria
 *    180 e o gerador aplicaria a faixa de 180 min — uma duração que não existe.
 */
function minutosDaDuracao(duracao) {
  if (!duracao) return null;
  const partes = Array.isArray(duracao) ? duracao : [duracao];
  const minutos = [];
  for (const p of partes) {
    if (!p || typeof p !== 'object') continue;
    const n = Number(p.numero) || 0;
    const u = String(p.unidade || '').toLowerCase();
    const valor = (u === 'hora' || u === 'horas') ? n * 60 : (u === 'minuto' || u === 'minutos') ? n : 0;
    if (valor > 0 && minutos.indexOf(valor) === -1) minutos.push(valor);
  }
  if (!minutos.length) return null;
  minutos.sort((a, b) => a - b);
  return minutos.join(',');
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
  return async ({ plano, po, contexto }) => {
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

    const fontes = [
      { sufixo: '-aula-01.md',
        md: derivarAula01({ plano, po, contexto: Object.assign({}, ctx, { aulas: aulasDoCiclo }), calibracao: cal }) },
      { sufixo: '-referencias.md', md: derivarReferencias({ plano, contexto: ctx }) },
      { sufixo: '-captura-aula-01.md', md: derivarCaptura({ po, contexto: ctx }) },
      { sufixo: '-harmonizacao.md', md: derivarHarmonizacao({ plano, po, contexto: ctx }) },
      { sufixo: '-dados.json', md: derivarDados({ po, contexto: ctx }) },
    ];
    const notacao = notacaoEscolhida(plano);
    if (notacao) {
      fontes.push({ sufixo: '-notacao.md', md: derivarNotacao({ plano, contexto: ctx }) });
      fontes.push({ sufixo: '-glossario-' + slugDe(notacao) + '.md', md: derivarGlossario({ plano, contexto: ctx }) });
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
      let n = 0;
      let alvo = dir + base + '.antes-de-' + carimboDoPO + ext;
      // O mesmo carimbo a substituir duas vezes não pode colidir consigo próprio.
      while (ocupados.has(alvo) || (await lerArquivoRemoto({ token, dono, repo, ref, caminho: alvo, fetchImpl })).existe) {
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
      const atual = await lerArquivoRemoto({ token, dono, repo, ref, caminho, fetchImpl });
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
      const atualCifrado = await lerArquivoRemoto({ token, dono, repo, ref, caminho: caminhoCifrado, fetchImpl });
      if (atualCifrado.erro) {
        relatorio.cifrado = { ok: false, caminho: caminhoCifrado, erro: atualCifrado.erro };
      } else if (atualCifrado.existe && !dadosMudou) {
        relatorio.puladas.push(caminhoCifrado);
        relatorio.cifrado = { ok: true, caminho: caminhoCifrado, nota: 'a cópia já existia' };
      } else {
        try {
          const envelope = await cifrarEnvelopeDeDados(derivarDados({ po, contexto: ctx }), senhaCripto);
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

    // 5. Declara a variante no schema de captura, se ainda não declarada.
    const schemaPath = caminhoDoSchemaDeCaptura(ctx);
    const schema = await lerArquivoRemoto({ token, dono, repo, ref, caminho: schemaPath, fetchImpl });
    if (!schema.existe) {
      relatorio.schema = { ok: false, erro: 'schema de captura não encontrado em ' + schemaPath };
    } else {
      let dados = null;
      try { dados = JSON.parse(schema.texto); } catch { dados = null; }
      if (!dados || !dados._declaracao) {
        relatorio.schema = { ok: false, erro: 'schema de captura sem `_declaracao`' };
      } else {
        const porVariante = dados._declaracao.porVariante || (dados._declaracao.porVariante = {});
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
         *
         * As chaves antigas (as escolas de uma turma só: `maria`, `diaghilev`) continuam
         * válidas — nelas `varianteDoContexto` devolve a própria escola. Nada a migrar.
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
        const jaDeclarada = Boolean(porVariante[slug]);
        const nova = mesclarDeclaracao(porVariante[slug], derivada);
        if (!precisaGravar(porVariante[slug], nova)) {
          relatorio.schema = {
            ok: true,
            nota: jaDeclarada ? 'variante ' + slug + ' já declarada, e em dia' : 'sem declaração',
          };
        } else {
          porVariante[slug] = nova;
          // A DECLARAÇÃO DO SCHEMA entra no MESMO commit das fontes. Ela é o último passo que
          // valida o pacote, e separá-la era a mesma coisa que escrever o ciclo em duas metades.
          juntar(schemaPath, JSON.stringify(dados, null, 2) + '\n', (ok) => {
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
}

module.exports = {
  gravarArquivosNumCommit,
  criarEscritorDeCiclo,
  caminhoDaFonte,
  caminhoDoSchemaDeCaptura,
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
