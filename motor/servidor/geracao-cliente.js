'use strict';

/**
 * geracao-cliente.js — O QUE A TELA DIZ ENQUANTO O GITHUB TRABALHA.
 *
 * O problema (19/10/2026, medido pela pesquisadora): concluído o Plano de
 * Observação, o Worker grava as fontes, commita, e DISPARA o `gerar-ciclo.yml`.
 * A geração leva minutos — pandoc, TeX, PDF, reancoragem, commit e deploy — e a
 * tela ficava muda. Nada dizia se tinha começado, se estava a correr, se falhou.
 * Recarregar não mudava nada, porque nada era guardado no cliente; quem estava à
 * frente do ecrã só descobria o desfecho indo ao GitHub Actions. «Isso deixa a
 * pessoa insegura.»
 *
 * O que este script faz: um cartão fixo, discreto, que responde a três perguntas —
 * o que está a ser gerado (a turma e os documentos do ciclo), em que passo vai, e
 * como terminou. Ele lê `GET api/geracao`, que devolve o registro guardado no KV
 * da escola e a execução correspondente no GitHub. Por isso a resposta sobrevive a
 * recarregar a página: o estado não vive no navegador, vive no servidor.
 *
 * POR QUE INJETADO, E NÃO NO `porta/index.html` (19/10/2026): a porta é COPIADA
 * para dentro do pacote de cada escola (`plano-observacao/`) e só se refaz numa
 * geração. Escrito lá dentro, este aviso só chegaria às escolas depois da próxima
 * geração de cada uma — justamente a operação que ele existe para acompanhar. A
 * ponte de produção (`producao.js`) já injeta os scripts da porta ao servir; é o
 * mesmo caminho do preenchidor das escolas de teste, e vale para todas de uma vez.
 *
 * REGRAS DE CONVIVÊNCIA (a porta é de quem usa, e nada aqui pode estragá-la):
 *   · nunca lança — todo o corpo vai dentro de `try`, e uma falha delega a página
 *     ao comportamento que ela já tinha;
 *   · não reescreve `#gravacao` nem o `#fecho` — o cartão é um elemento NOVO,
 *     fora do fluxo, e o que o motor da porta escreve continua a ser dele;
 *   · desiste em silêncio: sem `professor`/`ciclo` no endereço, sem rede, ou
 *     quando a instância não guarda o estado (`fase: indisponivel`), nada aparece.
 */

const SCRIPT = String.raw`(function () {
  'use strict';

  try {
    if (window.__geracaoDaPorta) return;
    window.__geracaoDaPorta = true;

    var p = new URLSearchParams(location.search);
    var PROFESSOR = (p.get('professor') || '').trim();
    var CICLO = (p.get('ciclo') || '').trim();
    var FONTE = (p.get('fonte') || '').trim();
    if (!PROFESSOR || !CICLO) return;

    // O endereço das execuções: o cartão oferece-o SEMPRE, inclusive quando esta
    // instância não consegue consultar o estado. É a saída de emergência de quem
    // quer ver com os próprios olhos.
    var ACOES = 'https://github.com/tmenegaz/danca/actions/workflows/gerar-ciclo.yml';

    var ESPERA_MS = 5000;      // entre perguntas, com a geração a correr
    var ESPERA_CURTA = 2000;   // logo depois do «Guardar»: o registro ainda vai nascer
    var LIMITE_MS = 30 * 60 * 1000;

    var FASE = {
      'indisponivel': '',
      'sem-registro': '',
      'enfileirada': 'Na fila do GitHub Actions…',
      'em-andamento': 'Gerando os documentos…',
      'concluida': 'Documentos gerados.',
      'falhou': 'A geração falhou.',
      'falhou-no-disparo': 'O pedido de geração não saiu.',
      'sem-consulta': 'Geração pedida.'
    };

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function estilo() {
      if (document.getElementById('geracao-estilo')) return;
      var css = document.createElement('style');
      css.id = 'geracao-estilo';
      css.textContent = [
        '@keyframes geracao-giro { to { transform: rotate(360deg); } }',
        // O GIRO NO «gravando…» que a própria porta escreve. O seletor depende do
        // «aria-busy» que este script põe no «#fecho» — não do texto, que muda.
        '#fecho[aria-busy="true"] #gravacao p:first-child::before {',
        '  content: ""; display: inline-block; width: .62em; height: .62em;',
        '  margin-right: .5em; vertical-align: -.02em; border-radius: 50%;',
        '  border: 2px solid currentColor; border-right-color: transparent;',
        '  animation: geracao-giro .8s linear infinite;',
        '}',
        '#geracao-painel {',
        '  position: fixed; right: 1rem; bottom: 1rem; z-index: 60;',
        '  width: min(24rem, calc(100vw - 2rem)); box-sizing: border-box;',
        '  background: var(--fundo, #fbf8f3); color: var(--texto, #1f1c1a);',
        '  border: 1px solid var(--borda, #8a6a3b); border-radius: var(--raio-3, 20px);',
        '  padding: var(--esp-4, 16px) var(--esp-5, 24px);',
        '  box-shadow: var(--sombra, 0 18px 50px rgba(31,28,26,.35));',
        '  font-family: var(--ui, system-ui, sans-serif); font-size: .92rem;',
        '  line-height: 1.45;',
        '}',
        '#geracao-painel[hidden] { display: none; }',
        '#geracao-painel .geracao-topo { display: flex; align-items: baseline; gap: .55em; }',
        '#geracao-painel .geracao-giro {',
        '  flex: 0 0 auto; width: .85em; height: .85em; border-radius: 50%;',
        '  border: 2px solid currentColor; border-right-color: transparent;',
        '  animation: geracao-giro .8s linear infinite;',
        '}',
        '#geracao-painel .geracao-giro[hidden] { display: none; }',
        '#geracao-painel .geracao-titulo { font-family: var(--serif, Georgia, serif); }',
        '#geracao-painel p { margin: .4em 0 0; }',
        '#geracao-painel .geracao-sub, #geracao-painel .geracao-passo,',
        '#geracao-painel .geracao-tempo { color: var(--texto-suave, #5a5348); }',
        '#geracao-painel .geracao-docs { font-size: .88em; }',
        '#geracao-painel .geracao-fim { font-weight: 600; }',
        '#geracao-painel .ok { color: var(--ok, #1d6b2f); }',
        '#geracao-painel .falha { color: var(--falha, #9b1c1c); }',
        '#geracao-painel .geracao-link { font-size: .85em; }',
        '#geracao-painel .geracao-link a { color: var(--gold-texto, #7a5c31); }'
      ].join('\n');
      document.head.appendChild(css);
    }

    var painel = null;
    var titulo, sub, docs, passo, tempo, link, giro;
    var relogio = null;
    var timer = null;
    var inicio = 0;
    var ultimo = null;
    var visto = false;
    var tentativas = 0;

    function montar() {
      if (painel) return painel;
      if (!document.body) return null;
      estilo();
      painel = document.createElement('div');
      painel.id = 'geracao-painel';
      painel.setAttribute('role', 'status');
      painel.setAttribute('aria-live', 'polite');
      painel.hidden = true;
      painel.innerHTML =
        '<div class="geracao-topo">' +
          '<span class="geracao-giro" aria-hidden="true"></span>' +
          '<strong class="geracao-titulo"></strong>' +
        '</div>' +
        '<p class="geracao-sub"></p>' +
        '<p class="geracao-docs"></p>' +
        '<p class="geracao-passo"></p>' +
        '<p class="geracao-fim"></p>' +
        '<p class="geracao-tempo"></p>' +
        '<p class="geracao-link"></p>';
      document.body.appendChild(painel);
      titulo = painel.querySelector('.geracao-titulo');
      sub = painel.querySelector('.geracao-sub');
      docs = painel.querySelector('.geracao-docs');
      passo = painel.querySelector('.geracao-passo');
      tempo = painel.querySelector('.geracao-tempo');
      link = painel.querySelector('.geracao-link');
      giro = painel.querySelector('.geracao-giro');
      return painel;
    }

    function comRelogio(ligar) {
      if (ligar && !relogio) {
        relogio = setInterval(desenharTempo, 1000);
      } else if (!ligar && relogio) {
        clearInterval(relogio);
        relogio = null;
      }
    }

    function decorrido() {
      if (!inicio) return '';
      var s = Math.max(0, Math.round((Date.now() - inicio) / 1000));
      if (s < 60) return s + ' s';
      var m = Math.floor(s / 60);
      return m + ' min ' + String(s % 60).padStart(2, '0') + ' s';
    }

    function desenharTempo() {
      if (!tempo) return;
      var d = decorrido();
      var final = ultimo && (ultimo.fase === 'concluida' || ultimo.fase === 'falhou' ||
        ultimo.fase === 'falhou-no-disparo');
      tempo.textContent = d ? (final ? 'Levou ' + d + '.' : 'Há ' + d + '.') : '';
    }

    function parar() {
      if (timer) { clearTimeout(timer); timer = null; }
      comRelogio(false);
    }

    function desenhar(dados) {
      if (!dados) return;
      ultimo = dados;
      var fase = dados.fase || '';
      var registro = dados.registro || null;

      // O QUE ESTA INSTÂNCIA NÃO SABE, ELA NÃO INVENTA. «indisponivel» é a ponte
      // local (sem KV); «sem-registro», a escola sem nenhuma geração registada.
      // Depois do «Guardar», «sem-registro» é ESPERA — o registro nasce do lado do
      // servidor logo depois de as fontes serem escritas. Fora disso, nada aparece.
      if (fase === 'indisponivel' || fase === 'sem-registro') {
        if (visto) {
          tentativas += 1;
          if (fase === 'indisponivel' || tentativas > 20) {
            // Desistir em silêncio é melhor que girar para sempre: meia hora de
            // giro sem informação é o mesmo que a tela muda de antes.
            parar();
            if (painel) painel.hidden = true;
            return;
          }
          agendar(ESPERA_CURTA);
          return;
        }
        if (painel) painel.hidden = true;
        parar();
        return;
      }

      if (!montar()) return;
      painel.hidden = false;
      if (registro && registro.em && !inicio) inicio = Date.parse(registro.em) || 0;

      var final = fase === 'concluida' || fase === 'falhou' || fase === 'falhou-no-disparo';

      // UM DESFECHO ANTIGO NÃO FICA NO ECRÃ. O registro é do último disparo da
      // variante, e pode ter dias: mostrar «falhou» de anteontem a quem abre a
      // porta hoje seria ruído, não informação. Duas horas é o que cobre a sessão
      // de quem gerou — e depois disso só o link das ações fica.
      if (final && registro && registro.em) {
        var idade = Date.now() - (Date.parse(registro.em) || 0);
        if (idade > 2 * 60 * 60 * 1000) { painel.hidden = true; parar(); return; }
      }

      titulo.textContent = FASE[fase] || 'Geração';
      giro.hidden = final;

      var turma = registro && registro.turma ? registro.turma : '';
      var variante = registro && registro.variante ? registro.variante : '';
      sub.textContent = turma
        ? 'Ciclo ' + CICLO + ' · turma ' + turma
        : (variante ? 'Ciclo ' + CICLO + ' · ' + variante : 'Ciclo ' + CICLO);

      var lista = (registro && registro.documentos) || [];
      docs.textContent = lista.length
        ? 'Documentos: ' + lista.map(function (d) { return d.nome || d.id; }).join(' · ')
        : '';

      if (fase === 'em-andamento') {
        passo.textContent = dados.etapaAtual ? 'Passo: ' + dados.etapaAtual : 'A preparar os passos…';
      } else if (fase === 'enfileirada') {
        passo.textContent = 'O pedido está na fila; começa em instantes.';
      } else if (fase === 'sem-consulta') {
        passo.textContent = 'O pedido saiu. Esta instância não consegue ler o estado' +
          (dados.erro ? ' (' + dados.erro + ')' : '') + ' — o link abaixo mostra a execução.';
      } else if (fase === 'falhou-no-disparo') {
        passo.textContent = dados.erro ? 'Motivo: ' + dados.erro : '';
      } else if (fase === 'falhou') {
        passo.textContent = dados.etapaQueFalhou
          ? 'Falhou no passo «' + dados.etapaQueFalhou + '».'
          : 'A execução terminou com falha.';
      } else {
        passo.textContent = '';
      }

      var fim = painel.querySelector('.geracao-fim');
      if (fase === 'concluida') {
        fim.className = 'geracao-fim ok';
        // A FRASE NÃO PROMETE O QUE AINDA NÃO ACONTECE. O pacote gerado é o da VARIANTE
        // (ciclo-01-<escola>-<turma>) e o Worker da escola publica o da ESCOLA
        // (ciclo-01-<escola>) — enquanto a decisão D-T4 não for tomada, os documentos
        // existem no repositório e o site da escola não os mostra. Dizer «recarregue e veja»
        // seria a mesma mentira que o silêncio de antes, com outra cara. O que se afirma é
        // o que é verdade: os documentos foram gerados, e o link mostra a execução.
        fim.textContent = 'Pronto — os documentos do ciclo foram gerados. ' +
          (registro && registro.variante
            ? 'O pacote é o de «' + registro.variante + '».'
            : '');
      } else if (fase === 'falhou' || fase === 'falhou-no-disparo') {
        fim.className = 'geracao-fim falha';
        fim.textContent = 'Os documentos não foram gerados. O plano que você gravou está salvo.';
      } else {
        fim.className = 'geracao-fim';
        fim.textContent = '';
      }

      desenharTempo();

      var alvo = (dados.run && dados.run.html_url) || ACOES;
      link.innerHTML = '<a href="' + esc(alvo) + '" target="_blank" rel="noopener">' +
        (dados.run ? 'Ver a execução no GitHub' : 'Ver o workflow no GitHub') + '</a>';

      if (!final) {
        comRelogio(true);
        agendar(ESPERA_MS);
      } else {
        parar();
      }
    }

    function agendar(ms) {
      if (timer) clearTimeout(timer);
      if (inicio && Date.now() - inicio > LIMITE_MS) {
        parar();
        if (passo) passo.textContent = 'A consulta parou depois de 30 minutos. O link mostra o estado real.';
        return;
      }
      timer = setTimeout(perguntar, ms);
    }

    function perguntar() {
      var url = 'api/geracao?professor=' + encodeURIComponent(PROFESSOR) +
        '&ciclo=' + encodeURIComponent(CICLO);
      fetch(url, { headers: { 'Accept': 'application/json' }, cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (dados) {
          if (!dados) { agendar(visto ? ESPERA_MS : ESPERA_CURTA); return; }
          desenhar(dados);
        });
    }

    /*
     * O «GUARDAR» PASSA A TER UM SINAL DE VIDA. O giro que a porta escreve
     * («gravando…») já existia; o que faltava era ele ser reconhecível como
     * ESPERA — e não o texto de alguém que travou. O «aria-busy» também diz isso a
     * quem lê com leitor de ecrã. Para o PO, o cartão entra em cena já no clique:
     * as fontes são escritas antes de o disparo existir, e esse intervalo também
     * era mudo.
     */
    var fetchOriginal = window.fetch;
    if (typeof fetchOriginal === 'function') {
      window.fetch = function (recurso, opcoes) {
        var url = '';
        try {
          url = typeof recurso === 'string' ? recurso : (recurso && recurso.url) || '';
        } catch (e) { url = ''; }
        var elicitar = url.indexOf('api/elicitar') !== -1;
        var fecho = elicitar ? document.getElementById('fecho') : null;
        if (fecho) fecho.setAttribute('aria-busy', 'true');
        var promessa = fetchOriginal.apply(this, arguments);
        if (!fecho) return promessa;
        var limpar = function () { fecho.removeAttribute('aria-busy'); };
        return promessa.then(function (r) { limpar(); return r; },
          function (e) { limpar(); throw e; });
      };
    }

    if (FONTE === 'po') {
      document.addEventListener('click', function (evento) {
        var alvo = evento.target;
        while (alvo && alvo.id !== 'gravar') alvo = alvo.parentNode;
        if (!alvo) return;
        // O clique entra em cena antes de a porta tratar dele: o cartão aparece
        // com o que se sabe («a escrever as fontes»), e a primeira pergunta vem
        // dois segundos depois — tempo de o registro nascer do lado do servidor.
        montar();
        if (!painel) return;
        painel.hidden = false;
        visto = true;
        inicio = inicio || Date.now();
        if (titulo) titulo.textContent = 'Escrevendo as fontes do ciclo…';
        if (sub) sub.textContent = 'Ciclo ' + CICLO;
        if (docs) docs.textContent = '';
        if (passo) passo.textContent = 'O plano está gravado; os documentos começam em seguida.';
        if (giro) giro.hidden = false;
        comRelogio(true);
        desenharTempo();
        agendar(ESPERA_CURTA);
      }, true);
    }

    // AO ABRIR A PÁGINA, o que interessa é o que ficou a correr desde a última vez.
    // «visto» fica falso: enquanto não houver registro, nada aparece — e a porta
    // abre limpa, como sempre abriu.
    function iniciar() {
      montar();
      perguntar();
      // Uma segunda leitura, mais lenta: a execução pode levar alguns segundos a
      // aparecer na API do GitHub depois do dispatch.
      setTimeout(function () { if (!visto) perguntar(); }, 8000);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', iniciar);
    } else {
      iniciar();
    }
  } catch (erro) {
    // A PORTA NUNCA CAI POR CAUSA DO AVISO. Um erro aqui é do aviso, não da página:
    // fica no console de quem depura e a elicitação segue exatamente como estava.
    try { console.warn('aviso da geração indisponível:', erro); } catch (e) {}
  }
})();
`;

module.exports = { SCRIPT };
