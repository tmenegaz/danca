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

const { escreverPO, ACEITE, API_VERSAO } = require('./escrever-po.js');
const { codificarBase64, decodificarBase64, caminhoDoConf } = require('./escrever-plano.js');
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
function caminhoDaFonte(contexto, sufixo) {
  const professor = String(contexto.professor || '').trim();
  const ciclo = String(contexto.ciclo || '').trim().padStart(2, '0');
  const escola = String(contexto.escola || '').trim();
  if (!professor || !ciclo || !escola) {
    throw new Error('contexto incompleto para a fonte do ciclo: precisa de professor, ciclo e escola');
  }
  return 'professores/' + professor + '/ciclos/ciclo-' + ciclo + '-' + escola + sufixo;
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
function criarEscritorDeCiclo({ token, dono, repo, ref }) {
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

    // 4. Liga o `DOCS` quando o ciclo ainda não tem aulas (não reescreve um ciclo completo).
    const atuais = docsAtuais(conf.texto);
    if (!atuais.includes('aula-01')) {
      const novoDocs = docsGerados({ plano });
      const texto = conf.texto.replace(/^DOCS="[^"]*"$/m, 'DOCS="' + novoDocs.join(' ') + '"');
      if (texto !== conf.texto) {
        const resultado = await gravarArquivoRemoto({
          token, dono, repo, ref, caminho: confPath,
          conteudo: texto,
          mensagem: 'feat(ciclo): o ciclo «do zero» ganha os DOCS derivados',
          sha: conf.sha,
        });
        relatorio.docs = { ok: resultado.ok, docs: novoDocs };
      }
    } else {
      relatorio.docs = { ok: true, nota: 'DOCS já completo (aula-01 presente)' };
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
  lerArquivoRemoto,
  gravarArquivoRemoto,
};
