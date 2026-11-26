'use strict';

/**
 * geracao-cliente.js — O QUE A TELA DIZ ENQUANTO O GITHUB TRABALHA.
 *
 * O problema (19/10/2026, medido pela pesquisadora): concluído o Plano de
 * Observação, o Worker grava as fontes, commita, e DISPARA o `gerar-ciclo.yml`.
 * A geração leva minutos — pandoc, reancoragem, commit e deploy — e a
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
    // O REDIRECIMENTO DEPOIS DO ÊXITO (20/10/2026) — ver abrirAEscola.
    var correuAqui = false;   // esta página VIU a geração a correr (não a encontrou já pronta)
    var jaRedirecionou = false;

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
      // «VIU-A A CORRER» — qualquer fase que não seja um desfecho. Lido ANTES do desenho, porque
      // é o desenho que decide se o desfecho conta para o redirecionamento.
      if (!final) correuAqui = true;

      if (fase === 'concluida') {
        fim.className = 'geracao-fim ok';
        // A FRASE DIZ O QUE PASSOU A SER VERDADE (20/10/2026). Antes ela se continha — «os
        // documentos foram gerados», sem prometer que o site os mostrava —, porque o Worker da
        // escola publicava o pacote-zero e o pacote gerado ficava só no repositório. A publicação
        // montada (publicacao/<escola>/) passou a servir o pacote da turma, e por isso a frase
        // pode dizer o que é: os documentos estão no site, e o link abaixo é o da execução.
        fim.textContent = 'Pronto — os documentos do ciclo foram gerados e já estão no site. ' +
          (registro && registro.variante
            ? 'A turma é «' + registro.variante + '».'
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
        if (fase === 'concluida') abrirAEscola(registro, fim);
      }
    }

    /*
     * CONCLUÍDO, A PÁGINA DA ESCOLA ABRE-SE (20/10/2026).
     *
     * O problema: concluído o PO, o Worker grava, commita, dispara a geração — e a geração
     * PUBLICA. Os documentos passam a existir, e a tela onde o professor está é o formulário do
     * PO, que já não tem nada para dizer. A página que diz «o que foi criado» é a raiz da escola,
     * e ninguém sabia ir lá: era preciso clicar na logo.
     *
     * POR QUE NÃO REDIRECIONA SEMPRE. O cartão mostra o desfecho de uma geração recente por até
     * duas horas — é HISTÓRICO, e é útil («o que aconteceu aqui de manhã»). Quem abre a porta
     * depois disso para fazer o PRÓXIMO plano seria expulso da própria ferramenta. A condição é
     * portanto a única que descreve o caso certo: esta página VIU a geração a correr e viu-a
     * terminar. Quem chega depois encontra o desfecho escrito e fica onde está.
     *
     * E É UMA VEZ POR SESSÃO. Sem esta guarda, voltar à porta (para fazer outro plano, ou por o
     * cartão ainda estar fresco) expulsaria outra vez — um vaivém sem saída.
     *
     * A PAUSA é de 4 segundos: o desfecho está escrito no cartão, e leva-se um instante a lê-lo.
     * Ir a correr seria esconder a única frase que diz que tudo correu bem.
     */
    function abrirAEscola(registro, elemento) {
      if (jaRedirecionou || !correuAqui) return;
      var chave = 'geracao-abriu:' + (registro && registro.variante ? registro.variante : CICLO);
      try { if (sessionStorage.getItem(chave)) return; } catch (e) { /* sem sessão: segue */ }
      jaRedirecionou = true;
      try { sessionStorage.setItem(chave, '1'); } catch (e) { /* idem */ }
      // O fim do cartão é local de desenhar; recebê-lo por parâmetro evita uma variável
      // global acidental — que é o que um if (fim) aqui seria — e estouraria depois de o
      // cartão já estar desenhado.
      if (elemento) elemento.textContent += ' A abrir a página da escola…';
      setTimeout(function () {
        // assign e não replace: a porta continua no histórico, e o botão «voltar» do
        // navegador tem de trazer o professor de volta ao formulário, não saltá-lo.
        window.location.assign('/');
      }, 4000);
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
     * O ÚLTIMO PASSO PEDE A SUA PRÓPRIA INVOCAÇÃO (20/11/2026).
     *
     * O QUE FOI MEDIDO. «Tentei gerar o plano de observação, deu status pending.» O registo da
     * geração dizia, com todas as letras: falhou-no-disparo, escritas: 0, e o erro do
     * runtime — «Too many subrequests by single Worker invocation». O «Guardar» do PO gasta o
     * teto de 50 subpedidos a conferir a cadeia e a gravar o elo; o que sobra não chega para
     * escrever as fontes do ciclo e disparar. Do lado de fora, o sintoma é o pior de todos: a
     * tela gira, e o pacote publicado continua a ser o de ontem — o ciclo e a aula servem o
     * conteúdo velho, e quem os abre conclui que o sítio quebrou.
     *
     * O CAMINHO JÁ EXISTIA. Em 10/11/2026 o mesmo teto foi resolvido para os gestos das Turmas
     * com uma segunda invocação — POST /api/bastidores/cadeia-pacote, que corre só o passo 4 e
     * por isso tem os 50 subpedidos inteiros. A porta era o único chamador que ainda tentava
     * fazer tudo dentro do próprio pedido.
     *
     * QUEM DECIDE É O SERVIDOR. Esta função não julga se cabe ou não: ela pede o fecho quando a
     * resposta o declarou (fecharPacote). Sem esse campo, nada acontece — e o comportamento
     * antigo fica exactamente como estava.
     */
    /* UMA SEGUNDA PASSAGEM POR PÁGINA, E NÃO UMA POR RESPOSTA (26/11/2026).
     *
     * Enquanto a escuta do campo estava presa ao api/elicitar, uma resposta só podia declará-lo
     * uma vez. Agora qualquer resposta pode — e a segunda invocação responde por uma rota que, se
     * também não couber, volta a declarar. Sem esta trava, a página pediria o fecho em ciclo: cada
     * pedido seria uma invocação nova, todas a falhar, e o cartão giraria para sempre. Uma vez
     * pedido, o desfecho diz-se com o que veio. */
    var jaPediuOFecho = false;
    function fecharEmOutraInvocacao(pedido) {
      if (jaPediuOFecho) return;
      jaPediuOFecho = true;
      try {
        montar();
        if (painel) painel.hidden = false;
        visto = true;
        inicio = inicio || Date.now();
        if (titulo) titulo.textContent = 'Fechando o pacote…';
        if (sub) sub.textContent = 'Ciclo ' + CICLO;
        if (passo) passo.textContent = 'A gravação passou; a geração pede uma segunda passagem.';
        if (docs) docs.textContent = '';
        if (giro) giro.hidden = false;
        comRelogio(true);
        desenharTempo();
        fetchOriginal('/api/bastidores/cadeia-pacote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedido),
          cache: 'no-store',
        }).then(function () {
          setTimeout(perguntar, 1500);
        }, function () { agendar(ESPERA_CURTA); });
      } catch (e) { /* o aviso nunca derruba a página */ }
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
        /* A SEGUNDA PASSAGEM, DECLARADA PELO SERVIDOR — ver fecharEmOutraInvocacao. O corpo é
         * lido num clone: a porta continua a ler a resposta original, inteira e intocada.
         *
         * O CAMPO fecharPacote VALE EM QUALQUER RESPOSTA, E NÃO SÓ NO «GUARDAR» DO PO
         * (26/11/2026).
         *
         * Aqui a escuta estava presa ao api/elicitar, porque foi o primeiro sítio onde o teto
         * mordeu (10/11/2026). O teto não é do «Guardar»: a 26/11/2026 mordeu na criação do ciclo
         * 2 da breu, cuja resposta saiu por outra rota — o servidor declarou o fecho e a tela,
         * que só olhava para um endereço, não perguntou nada. O ciclo nunca foi gerado, e do lado
         * de fora o sintoma foi «mandei fazer a aula 2 e não gerou».
         *
         * Quem decide continua a ser o servidor: sem o campo, nada acontece. Ler o corpo de toda
         * resposta custa um clone e um json — e o que se perde ao não ler é a única pista de que
         * o trabalho parou a meio. */
        promessa = promessa.then(function (r) {
          try {
            /* SEM clone, NÃO SE LÊ. O corpo de uma Response só se consome uma vez: ler o corpo
             * ORIGINAL aqui deixaria a página sem o dele — a porta receberia uma resposta já
             * gasta. O clone existe em todos os navegadores e no runtime do Worker; a guarda não
             * é para o caso normal, é para que a leitura decorativa nunca coma a leitura real. */
            if (!r || typeof r.clone !== 'function') return r;
            Promise.resolve(r.clone().json()).then(function (dados) {
              if (dados && dados.fecharPacote) fecharEmOutraInvocacao(dados.fecharPacote);
            }, function () {});
          } catch (e) { /* uma resposta que não é JSON não muda nada */ }
          return r;
        });
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
