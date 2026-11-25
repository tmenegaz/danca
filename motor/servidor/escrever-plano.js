'use strict';

/**
 * escrever-plano.js — a metade da ponte do PLANO: o Worker escreve a FONTE do
 * plano (`ciclo-XX-<variante>-plano.md`) no repositório e, junto dela, o MANIFESTO
 * da variante (`.conf`) — que desde 19/10/2026 é DERIVADO do cadastro da turma,
 * e não mais escrito à mão (`compor-conf.js`).
 *
 * É o irmão do `escrever-po.js`: a derivação (`nucleo/derivar-plano-ciclo.js`)
 * vira o Markdown da fonte, e a escrita é a MESMA chamada do Contents API
 * (`escreverPO`), reutilizada. Sem token devolve `null` (a elicitação continua
 * intacta).
 *
 * **Duas metades, e a segunda é a que faltava.** Quando a turma está no contexto e
 * o cadastro a conhece, o manifesto é COMPOSTO (criado, se não existir) a partir
 * de três fontes — a turma, o plano e o `.conf` da escola. Quando não está (o
 * modelo anterior, ou o servidor local sem cadastro), o manifesto é apenas
 * ATUALIZADO nas linhas que o plano responde, como desde 18/10/2026.
 */

const { escreverPO, ACEITE, API_VERSAO, varianteDoContexto } = require('./escrever-po.js');
const { derivarPlano } = require('../nucleo/derivar-plano-ciclo.js');
const { comporConf, acharTurma, variaveisDoConf } = require('./compor-conf.js');

// Base64 em UTF-8 SEM `Buffer` (ausente no Workers runtime): o par de ponte
// TextEncoder/TextDecoder, nos dois sentidos.
function codificarBase64(texto) {
  const bytes = new TextEncoder().encode(String(texto));
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario);
}
function decodificarBase64(b64) {
  const binario = atob(String(b64).replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * O NÚMERO DO CICLO, COM DOIS DÍGITOS — E VAZIO QUANDO NÃO HÁ CICLO (24/11/2026).
 *
 * PORQUE ISTO EXISTE, e o defeito era a guarda a fingir que protegia. O caminho de toda fonte
 * derivada fazia `String(ctx.ciclo || '').trim().padStart(2, '0')` e depois perguntava
 * `if (!ciclo) throw`. Só que `''.padStart(2, '0')` é `'00'`, e `'00'` é verdadeiro: a guarda
 * NUNCA disparava, e um contexto sem ciclo escrevia em `ciclo-00-…` — um ciclo zero que ninguém
 * pediu. Medido em 24/11/2026 na prova `provar-ciclos-independentes` («um contexto SEM ciclo é
 * recusado»), e o `motor/servidor/rotas.js` já tinha um `/^0+$/.test(ciclo)` à mão no apagar do
 * ciclo — a cicatriz de uma vez anterior em que isto mordeu.
 *
 * Devolve `''` (e quem chama recusa, com a mensagem que já tinha) em vez de inventar `00`.
 */
function numeroDoCiclo(contexto) {
  const bruto = String((contexto && contexto.ciclo) || '').trim();
  if (!bruto) return '';
  const numero = bruto.padStart(2, '0');
  // `0`, `00`, `000` — um ciclo não é zero. É a mesma recusa do `rotas.js`, no sítio onde nasce.
  return /^0+$/.test(numero) ? '' : numero;
}

/**
 * O caminho da fonte a partir do contexto — a MESMA regra do `-po.md`
 * (`caminhoDoPO`), trocando o sufixo por `-plano.md`. O `professor` é o SLUG da
 * pasta; sem escola/professor/ciclo, o caminho não pode ser composto e o
 * escritor devolve erro — nunca grava num lugar adivinhado.
 *
 * A VARIANTE é o `<escola>-<turma>` desde 16/10/2026 (ver `varianteDoContexto`): o plano
 * é de UMA turma, e sem a turma no nome dois planos de duas turmas da mesma escola
 * escreviam no MESMO arquivo — o segundo apagava o primeiro. Sem a turma no contexto, a
 * variante volta a ser a escola, como antes.
 */
function caminhoDoPlano(contexto) {
  const ctx = contexto || {};
  const professor = String(ctx.professor || '').trim();
  const ciclo = numeroDoCiclo(ctx);
  const variante = varianteDoContexto(ctx);
  if (!professor || !ciclo || !variante) {
    throw new Error('contexto incompleto para a fonte do plano: precisa de professor, ciclo e escola');
  }
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + variante + '-plano.md';
}

/** O caminho do manifesto da variante — o `.conf` que o gerador lê. */
function caminhoDoConf(contexto) {
  const ctx = contexto || {};
  const professor = String(ctx.professor || '').trim();
  const ciclo = numeroDoCiclo(ctx);
  const variante = varianteDoContexto(ctx);
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + variante + '.conf';
}

/** Um GET no Contents API. Devolve `{ existe, sha, texto }`; o 404 é um estado, não um erro. */
async function lerDoRepo({ f, url, cabecalhos }) {
  const resposta = await f(url, { method: 'GET', headers: cabecalhos });
  if (resposta.status === 404) return { existe: false, sha: null, texto: '' };
  if (resposta.status !== 200) {
    let corpo = '';
    try { corpo = await resposta.text(); } catch { corpo = ''; }
    const erro = new Error('HTTP ' + resposta.status + ' — ' + corpo.slice(0, 300));
    erro.status = resposta.status;
    throw erro;
  }
  const dados = await resposta.json();
  return { existe: true, sha: dados.sha || null, texto: decodificarBase64(dados.content || '') };
}

/** A listagem de um diretório no Contents API (`[{name, type}]`); `[]` quando não há o que listar. */
async function listarNoRepo({ f, url, cabecalhos }) {
  const resposta = await f(url, { method: 'GET', headers: cabecalhos });
  if (resposta.status !== 200) return [];
  let dados;
  try { dados = await resposta.json(); } catch { return []; }
  return Array.isArray(dados) ? dados : [];
}

/**
 * O `.conf` da ESCOLA — procurado ONDE ELE ESTIVER, e não só na pasta do plano.
 *
 * A pasta do professor do plano é a primeira a ser tentada, e é o caso normal. Mas o `.conf` da
 * escola não é do professor: ele nasce em `tools/criar-escola.sh`, sob quem CRIA a escola, e uma
 * turma pode estar na curadoria de OUTRO professor. Medido em 22/10/2026: a turma
 * `calango-bale-nivel-1-teste-1` está na curadoria de `murisoca-baiana`, e o `.conf` da escola
 * está em `professores/tiago-menegaz/ciclos/`. Tentar só a pasta do plano deixava `RESPONSAVEL` e
 * `PROFESSOR` VAZIOS no manifesto da variante e a faixa de volume da Regra 9 sem origem — e o
 * gerador, sem a faixa de 60 min, usava o padrão 80–100 como se a escola o tivesse declarado.
 *
 * A ordem é: a pasta do plano; depois `professores/<cada>/ciclos/`. Duas escolas nunca partilham
 * o nome do `.conf` (o nome leva o slug da escola), por isso a primeira resposta é A resposta.
 */
async function confDaEscolaPara({ f, url, cabecalhos, professor, nome }) {
  const direto = await lerDoRepo({ f, url, cabecalhos });
  if (direto.existe) return Object.assign({ de: professor }, direto);

  const corte = url.lastIndexOf('/contents/');
  if (corte === -1) return { de: null, existe: false, sha: null, texto: '' };
  const raiz = url.slice(0, corte);

  const pastas = await listarNoRepo({ f, url: raiz + '/contents/professores', cabecalhos });
  for (const pasta of pastas) {
    const outro = String((pasta && pasta.name) || '');
    if (!outro || outro === professor || (pasta && pasta.type && pasta.type !== 'dir')) continue;
    const alvo = raiz + '/contents/professores/' + encodeURIComponent(outro) + '/ciclos/' + encodeURIComponent(nome);
    const achado = await lerDoRepo({ f, url: alvo, cabecalhos });
    if (achado.existe) return Object.assign({ de: outro }, achado);
  }
  return { de: null, existe: false, sha: null, texto: '' };
}

/** Um PUT no Contents API: cria quando não há `sha`, atualiza quando há. */
async function gravarNoRepo({ f, url, cabecalhos, texto, sha, ref, mensagem }) {
  const resposta = await f(url, {
    method: 'PUT',
    headers: cabecalhos,
    body: JSON.stringify({
      message: mensagem,
      content: codificarBase64(texto),
      ...(ref ? { branch: ref } : {}),
      ...(sha ? { sha } : {}),
    }),
  });
  return { ok: resposta.status >= 200 && resposta.status < 300, status: resposta.status };
}

/** O `DOCS` declarado num manifesto (vazio quando ausente ou `DOCS=""`). */
function docsDoConf(texto) {
  const m = /^DOCS="([^"]*)"/m.exec(String(texto || ''));
  return m ? m[1].trim() : '';
}

/**
 * COMPÕE o manifesto da variante a partir das três fontes (§3.1 de `PLANO-CICLO-DA-TURMA.md`).
 * Devolve `null` quando não há o que compor (sem turma no contexto, ou sem leitor do cadastro)
 * — e aí vale a metade de baixo, que só ATUALIZA linhas.
 *
 * A ordem das leituras é a das dependências, e não é arbitrária: a identidade vem do `.conf` da
 * ESCOLA (é ele que declara a norma), o ritmo vem do cadastro da turma, e o `DOCS` vem do
 * manifesto da VARIANTE, quando ele já existe — re-eliciar o plano depois de o ciclo ter aulas
 * não pode apagar as fontes que o gerador já escreveu.
 */
async function comporManifestoDaTurma({ f, cabecalhos, url, caminho, contexto, plano, lerTurmas, lerCuradorias, ref }) {
  const escola = String(contexto.escola || '').trim();
  const referencia = String(contexto.turma || '').trim();
  if (!referencia || typeof lerTurmas !== 'function') return null;

  const lista = await lerTurmas(escola);
  const turma = acharTurma(lista, referencia);
  /* A FAIXA DESTA TURMA (25/11/2026) — resolvida pela CURADORIA, que é quem a declara.
   *
   * O `.conf` é o que o gerador lê: `DURACOES`, `FREQUENCIA`, a faixa de volume e o total de
   * aulas. A raiz da Sala é o espelho da faixa 1, e uma Turma que ocupa a faixa 2 gerava um plano
   * com a duração e os dias da OUTRA aula daquela sala. Aqui procura-se a curadoria viva do mesmo
   * professor naquela sala e lê-se a faixa dela. Sem `lerCuradorias` — uma bancada, um adaptador
   * antigo — fica o comportamento de sempre (a raiz), e é isso que mantém todas as salas de uma
   * faixa a funcionar sem saber que as faixas existem. */
  let faixaDaTurma = null;
  if (turma && typeof lerCuradorias === 'function') {
    try {
      const curadorias = await lerCuradorias(escola);
      const professor = String(contexto.professor || '').trim();
      const minha = (Array.isArray(curadorias) ? curadorias : []).find((c) => c
        && !c.substituidaPor && !c.encerrada_em
        && String((c.turmas || [])[0] || c.turma || '').trim() === referencia
        && (!professor || String(c.professor || '').trim() === professor));
      if (minha && minha.faixa) faixaDaTurma = String(minha.faixa);
    } catch (erro) {
      faixaDaTurma = null;
    }
  }
  if (!turma) {
    return {
      ok: false,
      caminho,
      turmaAusente: true,
      erro: 'a turma «' + referencia + '» não está no cadastro de ' + escola +
        ' — o manifesto da variante não foi composto. Cadastre a turma na Produção (com os dias, ' +
        'a hora de cada dia, a duração e o período) e elicie o plano outra vez.',
    };
  }

  /* O `.conf` BASE DA ESCOLA — e a variante declarada sai do contexto (25/11/2026). Desde que o
   * contexto passou a poder declarar a `variante` (a modalidade entra quando a sala tem mais de uma
   * faixa), deixar `turma: ''` chegava para voltar à escola, mas não bastava: `varianteDoContexto`
   * devolve a DECLARADA primeiro e ignoraria a turma vazia. O `.conf` base é o da ESCOLA, e é isso
   * que se pede aqui — explicitamente. */
  const caminhoDaEscola = caminhoDoConf(Object.assign({}, contexto, { turma: '', variante: '' }));
  const urlDaEscola = url.replace(/\/[^/]+$/, '/' + caminhoDaEscola.split('/').pop());
  const base = await confDaEscolaPara({
    f, url: urlDaEscola, cabecalhos, professor: String(contexto.professor || '').trim(),
    nome: caminhoDaEscola.split('/').pop(),
  });
  const identidade = base.existe ? variaveisDoConf(base.texto) : { ESCOLA: escola };

  // O `.conf` da ESCOLA ausente é uma anomalia, e não um detalhe: é dele que vêm o responsável, a
  // habilitação e a faixa de volume. O manifesto ainda se compõe (o slug dá o nome da escola), mas
  // o que ficou por preencher é DITO — em vez de o valor padrão passar por declarado.
  const semEscola = base.existe ? [] : [
    'o .conf da escola (' + caminhoDaEscola.split('/').pop() + ') não existe em nenhuma pasta de ' +
    'professor: RESPONSAVEL e ESCOLA_HABILITADA ficaram por preencher, e a faixa de volume da ' +
    'Regra 9 não tem de onde sair',
  ];

  const atual = await lerDoRepo({ f, url, cabecalhos });  const composto = comporConf({
    turma,
    faixa: faixaDaTurma,
    plano,
    identidade,
    escola,
    ciclo: numeroDoCiclo(contexto),
    docs: atual.existe ? docsDoConf(atual.texto) : undefined,
  });

  const saida = {
    ok: true,
    caminho,
    derivado: true,
    criado: !atual.existe,
    turma: turma.id,
    derivados: composto.derivados,
    conflitos: composto.conflitos,
    pendencias: semEscola.concat(composto.pendencias),
  };

  if (atual.existe && atual.texto === composto.texto) {
    return Object.assign(saida, { atualizado: false, nota: 'manifesto já estava composto e igual' });
  }

  const gravacao = await gravarNoRepo({
    f, url, cabecalhos,
    texto: composto.texto,
    sha: atual.sha,
    ref,
    mensagem: 'feat(ciclo): o manifesto da variante passa a derivar do cadastro da turma',
  });
  return Object.assign(saida, { ok: gravacao.ok, atualizado: gravacao.ok, status: gravacao.status });
}

/**
 * Escreve o manifesto da variante — em DUAS metades, e a segunda é a que faltava.
 *
 * **1. Com a turma no contexto e o cadastro ao alcance, o manifesto é COMPOSTO** — criado se
 * não existir — por `comporConf`: o ritmo vem do cadastro da turma (dias, hora de cada dia,
 * duração, período), o conteúdo do plano, a norma do `.conf` da escola. É o que faz a geração
 * de uma turma poder acontecer: até 19/10/2026 o `.conf` da turma nunca existia, e o gerador
 * lia o da ESCOLA — escrito à mão, com `DATA_INICIO="[Preencher: …]"`. Era o CI vermelho.
 *
 * **2. Sem turma, o manifesto é ATUALIZADO nas linhas que o plano responde.** É o modelo
 * anterior (escolas sem cadastro, servidor local), preservado inteiro:
 *
 *   a. **O CONTEXTO INSTITUCIONAL** que o plano já respondeu — `DATA_INICIO`, `DIAS`,
 *      `FREQUENCIA`, `DURACOES`, `TOTAL_AULAS`. Até 18/10/2026 só o **PO** fazia isto
 *      (`escrever-ciclo.js`, passo 4): um ciclo com plano e sem PO ficava com
 *      `DATA_INICIO="[Preencher: …]"`, e o Pré-requisito 5 recusa a lacuna.
 *   b. **O `DOCS`** — `DOCS=""` vira `DOCS="plano"`, a primeira fonte do ciclo.
 *
 * **O plano é a fonte, e por isso prevalece** na metade de baixo: um `DATA_INICIO` escrito à mão
 * é substituído pelo que o plano declara. A exceção é a HORA do `DIAS`: ela é institucional, não
 * elicitada, e `linhasDeContexto` a preserva do próprio manifesto. O `DOCS` só é ligado quando
 * está vazio.
 */
async function atualizarManifesto({ token, dono, repo, ref, contexto, plano, fetchImpl, lerTurmas, lerCuradorias }) {
  if (!token) return { ok: false, erro: 'sem token' };
  const f = fetchImpl || fetch;
  const caminho = caminhoDoConf(contexto);
  const url = 'https://api.github.com/repos/' + dono + '/' + repo + '/contents/' + caminho;
  const cabecalhos = {
    'Accept': ACEITE,
    'Authorization': 'Bearer ' + token,
    'X-GitHub-Api-Version': API_VERSAO,
    'Content-Type': 'application/json',
    // O GitHub exige um User-Agent; o `fetch` do Worker não o envia por padrão.
    'User-Agent': 'danca-worker',
  };

  // ── 1. A turma manda no ritmo: o manifesto é COMPOSTO ──────────────────────
  const ctx = contexto || {};
  if (String(ctx.turma || '').trim() && typeof lerTurmas === 'function') {
    try {
      return await comporManifestoDaTurma({ f, cabecalhos, url, caminho, contexto: ctx, plano, lerTurmas, lerCuradorias, ref });
    } catch (erro) {
      // O cadastro ilegível ou o token recusado não podem ser engolidos: quem eliciou precisa de
      // saber que o manifesto NÃO foi escrito, e por quê. A fonte do plano já está no repositório.
      return { ok: false, caminho, erro: 'manifesto da turma: ' + (erro && erro.message ? erro.message : String(erro)) };
    }
  }

  // ── 2. Sem turma: atualiza as linhas que o plano responde ─────────────────
  const atual = await lerDoRepo({ f, url, cabecalhos });
  if (!atual.existe) {
    return {
      ok: false, caminho,
      erro: 'o manifesto ' + caminho + ' não existe. Ele nasce com a escola (tools/criar-escola.sh) ' +
        'ou com o plano de uma turma cadastrada — sem ele o gerador não tem contexto institucional.',
    };
  }
  const texto = atual.texto;

  // O `require` é TARDIO de propósito: `escrever-ciclo.js` já requer este arquivo, e um
  // require no topo fecharia o ciclo de módulos com um dos dois lados vazio.
  const { linhasDeContexto, aplicarLinhas } = require('./escrever-ciclo.js');

  const linhas = plano ? linhasDeContexto(plano, texto) : [];
  const comContexto = aplicarLinhas(texto, linhas);
  let novo = comContexto.replace(/^DOCS=""[ \t]*$/m, 'DOCS="plano"');

  /* O `DOCS` CRESCE COM AS AULAS QUE O PLANO DECLARA (21/11/2026).
   *
   * O DEFEITO, medido: o `DOCS` só era ligado quando estava VAZIO. Criada a Aula 02 — o plano
   * passa a declarar `aula-2-sequencia`, o envelope é gravado —, a lista de documentos do ciclo
   * continuava a dizer `aula-01`, e o gerador publicava o ciclo de uma aula só. O documento da
   * Aula 02 existia no acervo, e nada o levava ao pacote.
   *
   * A REGRA É DERIVADA, e não pedida: a aula existe quando o plano declara a sequência dela. Quem
   * a cria (o diálogo do calendário) não tem de se lembrar de mexer no manifesto — e é bom que não
   * tenha, porque uma lista à mão diverge em silêncio.
   *
   * A LISTA SÓ CRESCE: o que o manifesto já declara fica onde está, e a aula nova entra na posição
   * da família (depois da última aula, antes da captura dela). Nenhuma aula sai por esta via.
   */
  if (plano) {
    /* A REGRA É UMA SÓ, e vive no módulo das aulas (`docsComAsAulas`) — os DOIS caminhos de
     * escrita do manifesto a chamam. Duas cópias da mesma lista é o defeito que já se pagou aqui:
     * este caminho crescia e o outro (o composto, que é o normal de uma escola com turma
     * cadastrada) preservava o `DOCS` como estava, e a Aula 02 ficava fora do pacote. */
    const { docsComAsAulas } = require('../nucleo/aulas-do-ciclo.js');
    const atuais = (/^DOCS="([^"]*)"/m.exec(novo) || [, ''])[1].trim();
    const lista = docsComAsAulas(atuais, plano);
    if (lista.length && lista.join(' ') !== atuais.trim()) {
      novo = novo.replace(/^DOCS="[^"]*"/m, 'DOCS="' + lista.join(' ') + '"');
    }
  }

  if (novo === texto) {
    return { ok: true, caminho, atualizado: false, nota: 'manifesto já estava completo' };
  }

  const gravacao = await gravarNoRepo({
    f, url, cabecalhos,
    texto: novo,
    sha: atual.sha,
    ref,
    mensagem: 'feat(plano): o plano elicitado passa a ser o primeiro DOCS do ciclo',
  });
  return { ok: gravacao.ok, caminho, atualizado: gravacao.ok, status: gravacao.status };
}

/**
 * Monta o escritor do plano. Sem token devolve `null`. Devolve
 * `(envelope, mensagem) => Promise` — deriva o Markdown, grava, e compõe o manifesto.
 *
 * `lerTurmas(escola)` é a leitura do cadastro que só a ponte sabe fazer (KV no Worker, disco no
 * servidor local). Sem ela, o escritor continua a funcionar como antes, atualizando o manifesto
 * da variante que já existe.
 */
function criarEscritorDePlano({ token, dono, repo, ref, lerTurmas, lerCuradorias, fetchImpl }) {
  if (!token) return null;
  return async (envelope, mensagem, opcoes) => {
    const contexto = (envelope && envelope.contexto) || {};
    const caminho = caminhoDoPlano(contexto);

    // Os schemas do ciclo ANTES da fonte (22/10/2026). Este é o ato que CRIA a pasta do
    // professor que não criou a escola — o `criar-escola.sh` só passa pela pasta de quem cria.
    // Sem os schemas, o `hash-ciclo.sh` não valida o manifesto (0 chamadas ao validador) nem o
    // PO (aviso), e a âncora fecha igual. Ver `schemas-do-ciclo.js`.
    const { garantirSchemasDoCiclo } = require('./schemas-do-ciclo.js');
    const schemas = await garantirSchemasDoCiclo({
      token, dono, repo, ref, fetchImpl,
      professor: contexto.professor, ciclo: contexto.ciclo,
    });

    /* A LINHA DE BASE DA TURMA VAI AO PLANO (06/11/2026) — e é `opcoes` que a traz. A secção
     * «Aspecto físico» do plano é macro de propósito (o detalhe vive na Aula 01), e o macro são
     * os NOMES dos aspectos que o professor escolheu no passo 4. Sem esta passagem, o documento
     * declarava a lacuna sobre um dado que já existia, com uma frase de formulário («carregue a
     * sugestão…») que num documento impresso não diz nada. Opcional: sem ela o plano deriva na
     * mesma, com a lacuna declarada. */
    const { markdown } = derivarPlano(envelope, { linhaDeBase: opcoes && opcoes.linhaDeBase });
    const escrita = await escreverPO({ token, dono, repo, ref, caminho, conteudo: markdown, mensagem, fetchImpl });
    const manifesto = await atualizarManifesto({ token, dono, repo, ref, contexto, plano: envelope, lerTurmas, lerCuradorias, fetchImpl });
    return Object.assign({}, escrita, { docs: manifesto, schemas });
  };
}

module.exports = {
  numeroDoCiclo,
  caminhoDoPlano,
  caminhoDoConf,
  criarEscritorDePlano,
  atualizarManifesto,
  comporManifestoDaTurma,
  confDaEscolaPara,
  listarNoRepo,
  docsDoConf,
  lerDoRepo,
  gravarNoRepo,
  codificarBase64,
  decodificarBase64,
};
