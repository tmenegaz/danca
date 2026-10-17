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

const { escreverPO, ACEITE, API_VERSAO, varianteDoContexto } = require('./escrever-po.js');
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
    return { existe: false, sha: null, texto: null, erro: 'HTTP ' + res.status + ' — ' + corpo.slice(0, 200) };
  }
  const dados = await res.json();
  return { existe: true, sha: dados.sha || null, texto: decodificarBase64(dados.content || '') };
}

/** Escreve (cria ou atualiza) um arquivo remoto, devolvendo o resultado. */
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

const DIA_ISO = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, 'sáb': 6, dom: 7 };
const UNIDADE_FREQUENCIA = { semanal: 'semana', 'diária': 'dia' };

/** A duração elicitada (pares hora+minuto) em minutos, ou `null`. */
function minutosDaDuracao(duracao) {
  if (!Array.isArray(duracao)) return null;
  let total = 0;
  for (const p of duracao) {
    const n = Number(p && p.numero) || 0;
    const u = String((p && p.unidade) || '').toLowerCase();
    if (u === 'hora' || u === 'horas') total += n * 60;
    else if (u === 'minuto' || u === 'minutos') total += n;
  }
  return total > 0 ? total : null;
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
  const m = /^DIAS="([^"]*)"$/m.exec(confTexto || '');
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
  const m = /^DOCS="([^"]*)"$/m.exec(texto || '');
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
function criarEscritorDeCiclo({ token, dono, repo, ref, senhaCripto }) {
  if (!token) return null;
  return async ({ plano, po, contexto }) => {
    const ctx = contexto || {};
    const escolaNome = ctx.escolaNome || ctx.escola;
    const relatorio = { conf: null, escritas: [], puladas: [], docs: null, schema: null };

    // 1. O manifesto da variante — calibração + escola + DOCS atual.
    const confPath = caminhoDoConf(ctx);
    const conf = await lerArquivoRemoto({ token, dono, repo, ref, caminho: confPath });
    if (!conf.existe) {
      return Object.assign(relatorio, { conf: { ok: false, erro: '.conf não encontrado em ' + confPath } });
    }
    const cal = calibracaoDoConf(conf.texto);
    ctx.escolaNome = cal.escolaNome || escolaNome;
    relatorio.conf = { ok: true, cal };

    // 2. As fontes derivadas, cada uma com o seu caminho. O `-dados.json` é a
    // FONTE (não entra em DOCS): é o que o cifrador lê para publicar a cópia no
    // pacote — sem ela o `check-pacote.js` acusa o pacote incompleto.
    const fontes = [
      { sufixo: '-aula-01.md', md: derivarAula01({ plano, po, contexto: ctx, calibracao: cal }) },
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

    // 3. Escreve só o que ainda não existe — proveniência acrescenta, não edita.
    for (const fonte of fontes) {
      const caminho = caminhoDaFonte(ctx, fonte.sufixo);
      const atual = await lerArquivoRemoto({ token, dono, repo, ref, caminho });
      if (atual.existe) {
        relatorio.puladas.push(caminho);
        continue;
      }
      if (atual.erro) {
        relatorio.escritas.push({ caminho, ok: false, erro: atual.erro });
        continue;
      }
      const resultado = await gravarArquivoRemoto({
        token, dono, repo, ref, caminho,
        conteudo: fonte.md,
        mensagem: 'feat(ciclo): o «Guardar» do PO deriva ' + caminho.split('/').pop(),
      });
      relatorio.escritas.push(resultado);
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
    if (!senhaCripto) {
      relatorio.cifrado = { ok: false, caminho: caminhoCifrado, erro: 'sem SENHA_CRIPTO no Worker' };
    } else {
      const atualCifrado = await lerArquivoRemoto({ token, dono, repo, ref, caminho: caminhoCifrado });
      if (atualCifrado.erro) {
        relatorio.cifrado = { ok: false, caminho: caminhoCifrado, erro: atualCifrado.erro };
      } else if (atualCifrado.existe) {
        relatorio.puladas.push(caminhoCifrado);
        relatorio.cifrado = { ok: true, caminho: caminhoCifrado, nota: 'a cópia já existia' };
      } else {
        try {
          const envelope = await cifrarEnvelopeDeDados(derivarDados({ po, contexto: ctx }), senhaCripto);
          const resultado = await gravarArquivoRemoto({
            token, dono, repo, ref, caminho: caminhoCifrado,
            conteudo: JSON.stringify(envelope, null, 2) + '\n',
            mensagem: 'feat(ciclo): o «Guardar» do PO cifra ' + caminhoCifrado.split('/').pop(),
          });
          relatorio.escritas.push(resultado);
          relatorio.cifrado = resultado.ok
            ? { ok: true, caminho: caminhoCifrado }
            : { ok: false, caminho: caminhoCifrado, erro: 'HTTP ' + resultado.status };
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
      confTexto = confTexto.replace(/^DOCS="[^"]*"$/m, 'DOCS="' + novoDocs.join(' ') + '"');
      relatorio.docs = { ok: true, docs: novoDocs };
    } else {
      relatorio.docs = { ok: true, nota: 'DOCS já completo (aula-01 presente)' };
    }

    if (confTexto !== conf.texto) {
      const resultado = await gravarArquivoRemoto({
        token, dono, repo, ref, caminho: confPath,
        conteudo: confTexto,
        mensagem: 'feat(ciclo): o contexto elicitado preenche o manifesto e liga o DOCS',
        sha: conf.sha,
      });
      relatorio.docs.ok = resultado.ok;
      if (relatorio.contexto) relatorio.contexto.gravado = resultado.ok;
    }

    // 5. Declara a variante no schema de captura, se ainda não declarada.
    const schemaPath = caminhoDoSchemaDeCaptura(ctx);
    const schema = await lerArquivoRemoto({ token, dono, repo, ref, caminho: schemaPath });
    if (!schema.existe) {
      relatorio.schema = { ok: false, erro: 'schema de captura não encontrado em ' + schemaPath };
    } else {
      let dados = null;
      try { dados = JSON.parse(schema.texto); } catch { dados = null; }
      if (!dados || !dados._declaracao) {
        relatorio.schema = { ok: false, erro: 'schema de captura sem `_declaracao`' };
      } else {
        const porVariante = dados._declaracao.porVariante || (dados._declaracao.porVariante = {});
        const slug = String(ctx.escola || '').trim();
        if (porVariante[slug]) {
          relatorio.schema = { ok: true, nota: 'variante ' + slug + ' já declarada' };
        } else {
          porVariante[slug] = declaracaoDeCaptura({ po, escola: ctx.escolaNome || escolaNome });
          const resultado = await gravarArquivoRemoto({
            token, dono, repo, ref, caminho: schemaPath,
            conteudo: JSON.stringify(dados, null, 2) + '\n',
            mensagem: 'feat(captura): declara a variante ' + slug + ' no schema de captura',
            sha: schema.sha,
          });
          relatorio.schema = { ok: resultado.ok };
        }
      }
    }

    return relatorio;
  };
}

module.exports = {
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
  lerArquivoRemoto,
  gravarArquivoRemoto,
};
