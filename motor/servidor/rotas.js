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
const nucleo = require('../nucleo/elicitar.js');
const ia = require('../nucleo/ia.js');
const ficha = require('../nucleo/ficha.js');
const porta = require('../nucleo/porta.js');
const cofre = require('../nucleo/cofre.js');
const lancamento = require('../nucleo/lancamento.js');

const REGISTRO_DE_CUSTO = 'ia-registro/registro.jsonl';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function resposta(status, tipo, texto) {
  return new Response(texto, { status, headers: { 'Content-Type': tipo } });
}

function recusar(mensagem, status) {
  return resposta(status || 400, MIME['.json'], JSON.stringify({ ok: false, erro: mensagem }, null, 2) + '\n');
}

/** O rótulo de exibição do conteúdo na ficha — o núcleo o trata como texto. */
const ROTULO_ANAMNESE = 'conteudo/anamnese.json';

function criarRotas({ armazenamento, conteudo, esquema, conteudoPO, conteudoPlano, fichaHtml, prompt, identidade, servirEstatico, agora, disparar, escreverPO, escreverPlano, escreverCiclo }) {
  const roteador = criarRoteador();
  // O relógio é injetável: as provas fixam-no para serem repetíveis; em
  // produção cai no carimbo real do núcleo.
  const carimbar = agora || nucleo.carimbarAgora;
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

  // 2. /api/mapa — o mapa dos nós; `?fonte=po` entrega o do PO, `?fonte=plano` o do plano.
  roteador.rota('GET', '/api/mapa', ({ url }) => {
    const fonte = url.searchParams.get('fonte');
    return porta.mapa(fonte === 'po' ? conteudoPO : fonte === 'plano' ? conteudoPlano : conteudo);
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

  // 6. /api/anamneses — a seleção de sujeitos (um por apelido, o vigente).
  roteador.rota('GET', '/api/anamneses', async () => ({
    ok: true,
    opcoes: await porta.anamneses(armazenamento),
  }));

  // 6.1 /api/planos — a estante de planos de ensino (um por carimbo, com o
  //     objetivo como resumo). Serve o nó `plano-de-ensino` do PO.
  roteador.rota('GET', '/api/planos', async () => ({
    ok: true,
    opcoes: await porta.planos(armazenamento),
  }));

  // 7. /api/anamnese-estados — a lista de gestão (todas, inclusive sem sujeito).
  roteador.rota('GET', '/api/anamnese-estados', async () => ({
    ok: true,
    estados: await porta.estadosDasAnamneses(armazenamento),
  }));

  // 7.1 /api/plano-estados — a gestão dos planos (solta / legado / vinculada).
  roteador.rota('GET', '/api/plano-estados', async () => ({
    ok: true,
    estados: await porta.estadosDosPlanos(armazenamento),
  }));

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
      contexto: anterior.contexto || {},
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
    await porta.gravarEnvelope(armazenamento, documento, relatorio);
    return {
      ok: true, ajuste: novoId, de: params.id, motivo: opcoes.ajuste.motivo,
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

    const opcoes = {
      id: params.id,
      geradoEm: anterior.gerado_em,
      endereco: porta.ENDERECOS.anamnese,
      contexto: corpo.contexto || anterior.contexto || {},
      esquema,
    };
    const { documento, relatorio } = nucleo.elicitar(conteudo, corpo.respostas || {}, opcoes);
    if (relatorio.errosDoDocumento.length) {
      return recusar('a edição não passou na validação: ' +
        relatorio.errosDoDocumento.map((e) => e.caminho + ' — ' + e.mensagem).join('; '), 422);
    }
    await porta.gravarEnvelope(armazenamento, documento, relatorio);
    return { ok: true, editada: params.id, linhas: porta.linhasDoRelatorio(relatorio) };
  });

  // 11.1 POST /api/anamnese — o cofre: a anamnese cifrada no navegador entra no
  //     armazenamento (KV no Worker, disco no Node) sob a chave montada do
  //     contexto. O cofre não tem a senha: grava o invólucro `_cifrado` como
  //     veio. É o destino CIFRADO da anamnese (o PO não vai ao cofre).
  roteador.rota('POST', '/api/anamnese', async ({ request }) => {
    let corpo = {};
    try { corpo = await request.json(); } catch { return recusar('corpo nao e JSON'); }
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      return recusar('o corpo precisa ser um objeto com `contexto` e `_cifrado`');
    }
    const cifrado = corpo._cifrado || corpo.cifrado;
    try {
      return await cofre.guardarAnamnese(armazenamento, corpo.contexto || {}, cifrado);
    } catch (erro) {
      const duplicata = /^ja existe uma anamnese/.test(erro.message);
      return recusar(erro.message, duplicata ? 409 : 400);
    }
  });

  // 11.2 GET /api/anamnese — a lista da família (os carimbos, sem extensão).
  roteador.rota('GET', '/api/anamnese', async ({ url }) => {
    const lista = await cofre.listarAnamneses(
      armazenamento,
      url.searchParams.get('escola'),
      url.searchParams.get('professor'),
      url.searchParams.get('ciclo'),
    );
    if (!lista) return recusar('a lista precisa de ?escola=&professor=&ciclo=');
    return { ok: true, ...lista };
  });

  // 11.3 GET /api/anamnese/:carimbo — a leitura verbatim do `_cifrado` (cifra,
  //      nunca resposta de aluna); o contexto vem da query, como no POST.
  roteador.rota('GET', '/api/anamnese/:carimbo', async ({ url, params }) => {
    const carimbo = cofre.semEscape(params.carimbo);
    if (!carimbo || !cofre.CARIMBO.test(carimbo)) return recusar('carimbo invalido: ' + params.carimbo);
    const texto = await cofre.lerAnamnese(armazenamento, carimbo, {
      escola: url.searchParams.get('escola'),
      professor: url.searchParams.get('professor'),
      ciclo: url.searchParams.get('ciclo'),
    });
    if (texto === null) {
      const contexto = {
        escola: url.searchParams.get('escola'),
        professor: url.searchParams.get('professor'),
        ciclo: url.searchParams.get('ciclo'),
      };
      if (!cofre.chaveDaAnamnese({ ...contexto, carimbo })) {
        return recusar('a leitura precisa de ?escola=&professor=&ciclo=');
      }
      return recusar('anamnese nao encontrada: ' + carimbo, 404);
    }
    return resposta(200, MIME['.json'], texto);
  });

  // 11.4 /api/receber — o lançamento da aula. Contrato do formulário
  //      (`tools/templates/lancamento.html`): o cliente lê `dados.erro` em
  //      `ok:false` e troca a mensagem útil por "HTTP 500" num 5xx — por isso a
  //      recusa de negócio devolve HTTP 200 + { ok:false, erro } (nunca 5xx).
  roteador.rota('GET', '/api/receber', () => ({ ok: true, receber: 'pronto' }));
  roteador.rota('POST', '/api/receber', async ({ request }) => {
    let corpo;
    try { corpo = await request.json(); } catch { return { ok: false, erro: 'corpo nao e JSON' }; }
    try {
      return await lancamento.lancar(armazenamento, corpo);
    } catch (erro) {
      // HTTP 200 de propósito — o contrato do lançamento não aceita 5xx.
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
    if (texto === null) return recusar('envelope não encontrado: ' + params.id, 404);
    return resposta(200, MIME['.json'], texto);
  });

  // 14. POST /api/elicitar — a elicitação inteira.
  roteador.rota('POST', '/api/elicitar', async ({ request }) => {
    let corpo = {};
    try { corpo = await request.json(); } catch { corpo = {}; }
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      return recusar('o corpo precisa ser um objeto com a chave `respostas`');
    }
    try {
      const resultado = await porta.elicitar(armazenamento, corpo, { conteudo, conteudoPO, conteudoPlano, esquema, agora: carimbar });

      // A PONTE envelope → fonte: quando o PLANO é concluído E GRAVADO, o Worker
      // escreve o `ciclo-XX-<escola>-plano.md`; quando o PO é concluído E
      // GRAVADO, escreve o `-po.md` E dispara a geração. É best-effort — o
      // envelope já está persistido, e uma falha aqui não o desfaz.
      if (resultado.gravado && (corpo.fonte === 'plano' || corpo.fonte === 'po')) {
        const envelope = resultado.documento;

        if (corpo.fonte === 'plano' && escreverPlano) {
          try {
            resultado.fonte = await escreverPlano(envelope, 'feat(plano): o plano elicitado vira a fonte do ciclo');
          } catch (erro) {
            resultado.fonte = { ok: false, erro: erro.message };
          }
        }

        // O PLANO DE ENSINO referenciado (nó `plano-de-ensino` do PO) é resolvido UMA vez,
        // antes de escrever o PO e o ciclo: o PO o lê para compor o campo empírico e o
        // contexto (não duplica a dose/calendário/volume/registro), e o ciclo o lê para
        // derivar aula/captura/harmonização. Sem referência, cai no plano mais recente do
        // mesmo contexto — retrocompatibilidade. Falha na resolução degrada (o PO sai com
        // lacuna declarada), nunca 500: o envelope já foi gravado.
        let plano = null;
        const contexto = (envelope && envelope.contexto) || corpo.contexto || {};
        if (corpo.fonte === 'po') {
          try {
            const ref = envelope && envelope.respostas && envelope.respostas['plano-de-ensino'];
            const planoId = ref && ref.valor !== undefined ? ref.valor : ref;
            plano = planoId ? await porta.lerEnvelope(armazenamento, String(planoId)) : null;
            if (!plano) {
              const nomes = await porta.nomesDeEnvelopes(armazenamento, /^plano-.*\.json$/);
              for (let i = nomes.length - 1; i >= 0 && !plano; i--) {
                const env = await porta.lerArquivo(armazenamento, nomes[i]);
                const c = env && env.contexto;
                if (c && c.escola === contexto.escola && c.professor === contexto.professor &&
                    String(c.ciclo) === String(contexto.ciclo)) plano = env;
              }
            }
          } catch (erro) {
            resultado.plano = { ok: false, erro: erro.message };
          }
        }

        if (corpo.fonte === 'po' && escreverPO) {
          try {
            resultado.fonte = await escreverPO(envelope, 'feat(po): o PO elicitado vira a fonte do ciclo', plano);
          } catch (erro) {
            resultado.fonte = { ok: false, erro: erro.message };
          }
        }

        if (corpo.fonte === 'po' && escreverCiclo) {
          try {
            resultado.ciclo = await escreverCiclo({ plano, po: envelope, contexto });
          } catch (erro) {
            resultado.ciclo = { ok: false, erro: erro.message };
          }
        }

        if (corpo.fonte === 'po' && disparar) {
          try {
            resultado.disparo = await disparar(contexto);
          } catch (erro) {
            resultado.disparo = { ok: false, erro: erro.message };
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

  // 16. O fallback ESTÁTICO (index.html e os assets) — GET/HEAD, em último.
  roteador.rota('GET', '*', async ({ url }) => {
    const caminho = url.pathname;
    if (servirEstatico) {
      const estatico = await servirEstatico(caminho);
      if (estatico) return resposta(estatico.status, estatico.tipo, estatico.corpo);
    }
    return recusar('não encontrado: ' + caminho, 404);
  });
  roteador.rota('HEAD', '*', async ({ url }) => {
    const caminho = url.pathname;
    if (servirEstatico) {
      const estatico = await servirEstatico(caminho);
      if (estatico) return new Response('', { status: estatico.status, headers: { 'Content-Type': estatico.tipo } });
    }
    return new Response('', { status: 404, headers: { 'Content-Type': 'application/json;charset=utf-8' } });
  });

  return roteador;
}

module.exports = { criarRotas };
