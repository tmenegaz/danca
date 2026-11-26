---
projeto: Formação em Balé Clássico
frente: Plano
ciclo: "01"
escola: breu
professor: demi-plie
title: "Plano do Ciclo 01 — breu"
subtitle: "Turma: Piano"
referencias: "RAD (2015) e material de teste do Projeto Ciclo."
---

## Contexto

**Escola e espaço**

| Item | Valor |
|:------------------------|:--------------------------------------------------------|
| **Frequência semanal** | 3x semanal — seg e qua e sex |
| **Duração por aula** | 1 hora |
| **Calendário** | 2027-01-04 → 2027-02-26 |
| **Número total de aulas** | 24 |

**Professor, turma e método**

| Item | Valor |
|:------------------------|:--------------------------------------------------------|
| **Professor responsável** | demi-plie |
| **Turma observada** | Piano |
| **Volume de trabalho** | 3–6 séries |
| **Condição de registro** | Na sala: professor, alunas da turma · observa: o próprio professor. |
| **Metodologia de referência** | RAD |
| **Notação de dança** | Código de dança |

## Objetivo geral

Objetivo de teste 3: consolidar o alinhamento e a transferência de peso na turma Balé Nível 1 — Teste 3, com musicalidade e controle do movimento.

## Objetivos específicos

| N | Objetivo específico | Blocos onde é trabalhado |
|:--|:--|:--|
| **01** | transferir o peso entre os pés sem perder o alinhamento | Solo · Barra · Centro · Musicalidade · Expressão |
| **02** | Teste criar a aula 2 | [a decidir] |

## Marcos parciais por aula

| Aula | Objetivos | Marco |
|:--|:--|:--|
| **01** | 01 | transferir o peso entre os pés sem perder o alinhamento |
| **02** | 02 | Teste criar a aula 2 |

<!-- CALENDARIO -->

## Blocos da aula e distribuição do volume

| Bloco | Proporção alvo | Justificativa |
|:--|:--|:--|
| **Solo** | **20%** | **Aquecimento e consciência corporal.** |
| **Barra** | **30%** | **Apoio e alinhamento.** |
| **Centro** | **30%** | **Transferência e sequência.** |
| **Musicalidade** | **10%** | **Pulso e frase.** |
| **Expressão** | **10%** | **Levesa e fluição** |

> **Unidade: percentual.** A proporção alvo é a fatia da aula — a soma fecha em 100%.

> **A estrutura da aula — e o padrão do ciclo.** Estes são os blocos que a AULA tem e a
> fatia de cada um. O plano declara o padrão de onde cada aula parte; a aula que tiver
> outra estrutura declara a sua no próprio documento (`aula-NN.md`), e não aqui. O que a
> aula persegue, e em que bloco, está em «Objetivos específicos» e «Marcos parciais por
> aula» — o objetivo não diz que a aula tem só o bloco em que ele é trabalhado.

## Objetivos por bloco e por aula

<!-- OBJETIVOS -->

## Condições preliminares

- Sala com barra, espelho e aparelho de som; piso adequado.

## Régua da rubrica

- Domina
- Satisfatório
- Não domina
- Não medido

> **A régua da turma — e só ela.** Os níveis, como a escola os escreve, na ordem da escala
> — o primeiro é o mais baixo. É com ela que o LANÇAMENTO da aula mede cada critério: o
> professor diz o critério da aula e o nível alcançado. Quem declara a régua são os
> bastidores (Turmas) e quem a adota é o professor, no plano do ciclo. **O critério de cada
> aula não se escreve aqui**: ele nasce no lançamento da aula dada, e é por isso que esta
> página não tem uma tabela de critérios.

## Horizonte do ciclo

Estender o ciclo em duas aulas se o último marco não for alcançado.

> **O horizonte, e não um critério de nota.** Este campo declara **até onde os marcos
> estão decididos** e o que faz o ciclo estender — é o limite do planeamento, não uma
> régua de avaliação (essa é a «Régua da rubrica», acima). O **+4 aulas** que aparece no
> Calendário é conta do gerador a partir das datas e da frequência; se o horizonte
> declarado aqui for outro, é este que vale.

## Música e vídeo de referência

- Faixa de teste em 4/4 e 3/4; vídeo de referência de teste.

> **A música de cada exercício não está aqui** — ela lê-se na aula, no «Bloco de
> musicalidade» (§4), onde é consolidada por compasso e com a contagem do verbete.
> Esta secção guarda só o que a professora escreveu: a faixa ou o vídeo de referência.

## Repertório

- Battement jeté
- Battement tendu
- Plié
- Relevé

## Registro de proveniência

Plano derivado da metodologia RAD, adaptado ao âmbito da turma; Plano derivado de literatura de apoio sobre corpo e aula

```{=html}
<div class="modal" id="criar-aula" role="dialog" aria-modal="true" aria-labelledby="criar-aula-titulo" hidden>
<div class="modal-fundo" data-criar-fechar></div>
<div class="modal-caixa modal-largo">
<div class="modal-cab">
<h2 id="criar-aula-titulo">Criar a aula</h2>
<button type="button" class="modal-x" data-criar-fechar aria-label="Fechar">×</button>
</div>
<p id="criar-aula-quando"></p>
<label class="campo-rotulo" for="criar-aula-marco">Objetivo específico (o marco desta aula)</label>
<textarea id="criar-aula-marco" name="marco" rows="2" required></textarea>
<fieldset class="escolhas" id="criar-aula-exercicios"><legend>Exercícios que trabalham este objetivo</legend></fieldset>
<fieldset class="escolhas" id="criar-aula-blocos"><legend>Blocos onde ele é trabalhado</legend></fieldset>
<div id="criar-aula-musica" hidden>
<p class="campo-rotulo" id="criar-aula-musica-rotulo">Tempos e compasso de cada exercício</p>
<table id="criar-aula-musica-tabela"><thead><tr><th>Exercício</th><th>Tempos</th><th>Compasso</th><th>Ações</th></tr></thead><tbody id="criar-aula-musica-corpo"></tbody></table>
<p id="criar-aula-musica-nota"></p>
</div>
<p id="criar-aula-aviso" role="status"></p>
<div class="modal-acoes">
<button type="button" class="acao" id="criar-aula-guardar">Criar</button>
<button type="button" class="acao secundario" id="criar-aula-cancelar">Cancelar</button>
</div>
</div>
</div>
<script type="application/json" id="dados-criar-aula">{"id":"plano-20261126-1547","ciclo":"01","professor":"demi-plie","escola":"breu","turma":"Piano","marcos":["transferir o peso entre os pés sem perder o alinhamento","Teste criar a aula 2"],"repertorio":["Battement jeté","Battement tendu","Plié","Relevé"],"blocos":["Solo","Barra","Centro","Musicalidade","Expressão"],"temRepertorio":true,"musicas":{"Battement jeté":["8|2/4"],"Battement tendu":["8|2/4"],"Plié":["4|2/4"],"Relevé":["8|2/4"]}}</script>
<script>
  var PORTA = "/plano-ensino/";
  function pedir(caminho, init) {
    return fetch(caminho, init).then(function (r) {
      return r.text().then(function (texto) {
        var corpo = null;
        try { corpo = texto ? JSON.parse(texto) : null; } catch (e) { corpo = null; }
        if (!r.ok) {
          throw new Error((corpo && (corpo.erro || corpo.message)) ||
            ("o servidor respondeu " + r.status + " em " + caminho));
        }
        if (corpo === null) {
          throw new Error("a resposta de " + caminho + " não é JSON — o servidor respondeu " + r.status);
        }
        return corpo;
      });
    }, function (erro) {
      throw new Error("não consegui falar com " + caminho + ": " + (erro && erro.message || erro));
    });
  }
(function () {
  var fonte = document.getElementById("dados-criar-aula");
  if (!fonte) return;
  var dados = JSON.parse(fonte.textContent);
  var caixa = document.getElementById("criar-aula");
  if (!caixa) return;
  var campoMarco = document.getElementById("criar-aula-marco");
  var exercicios = document.getElementById("criar-aula-exercicios");
  var blocos = document.getElementById("criar-aula-blocos");
  var caixaMusica = document.getElementById("criar-aula-musica");
  var corpoMusica = document.getElementById("criar-aula-musica-corpo");
  var notaMusica = document.getElementById("criar-aula-musica-nota");
  var aviso = document.getElementById("criar-aula-aviso");
  var quando = document.getElementById("criar-aula-quando");
  var titulo = document.getElementById("criar-aula-titulo");
  var btnGuardar = document.getElementById("criar-aula-guardar");
  var btnCancelar = document.getElementById("criar-aula-cancelar");
  var alvo = "";
  function comVeu(frase, rotulo) {
    var op = window.LastroDaOperacao;
    if (op && op.ocupar) op.ocupar(frase, rotulo);
  }
  function noVeu(frase) {
    var op = window.LastroDaOperacao;
    if (op && op.dizer) op.dizer(frase);
  }
  function liberarVeu() {
    var op = window.LastroDaOperacao;
    if (op && op.liberar) op.liberar();
  }
  function dizer(t) { if (aviso) aviso.textContent = t || ""; }
  function listar(conjunto, valores, legenda) {
    while (conjunto.firstChild) conjunto.removeChild(conjunto.firstChild);
    var lg = document.createElement("legend");
    lg.textContent = legenda;
    conjunto.appendChild(lg);
    for (var i = 0; i < valores.length; i++) {
      var id = conjunto.id + "-" + i;
      var lab = document.createElement("label");
      lab.className = "escolha";
      lab.setAttribute("for", id);
      var cx = document.createElement("input");
      cx.type = "checkbox"; cx.id = id; cx.value = valores[i];
      var vista = document.createElement("span");
      vista.textContent = valores[i];
      lab.appendChild(cx);
      lab.appendChild(vista);
      conjunto.appendChild(lab);
    }
  }
  function paresDe(nome) {
    var l = (dados.musicas || {})[nome] || [], fora = [];
    for (var i = 0; i < l.length; i++) {
      var p = String(l[i]).split("|");
      if (p.length === 2 && p[0] && p[1]) fora.push({ tempos: p[0], compasso: p[1] });
    }
    return fora;
  }
  function celula(qual, pares) {
    var td = document.createElement("td");
    var valor = pares.length ? String(pares[0][qual] || "") : "";
    td.textContent = valor || "—";
    if (pares.length === 1) {
      td.title = "declarado no verbete: " + pares[0].tempos + " em " + pares[0].compasso;
    } else if (pares.length > 1) {
      var lista = [];
      for (var i = 0; i < pares.length; i++) lista.push(pares[i].tempos + " em " + pares[i].compasso);
      td.title = "o verbete declara " + lista.join(" · ");
    } else {
      td.title = "o verbete não declara música para este exercício";
    }
    return td;
  }
  function acoesDoExercicio(nome, pares) {
    var td = document.createElement("td");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "acao pequena";
    b.textContent = "Derivar";
    b.setAttribute("data-derivar", nome);
    if (pares.length) b.setAttribute("data-musica", pares[0].tempos + "|" + pares[0].compasso);
    b.title = pares.length > 1
      ? "abrir o Estilo neste exercício, para escolher qual das músicas declaradas vale"
      : (pares.length ? "abrir o Estilo neste exercício, para ajustar a música dele"
        : "abrir o Estilo neste exercício, que ainda não declara música");
    td.appendChild(b);
    return td;
  }
  function derivar(nome, chave) {
    var alvo = "/bastidores/estudio?derivar=" + encodeURIComponent(nome)
      + (chave ? "&musica=" + encodeURIComponent(chave) : "") + "#estilo";
    fechar();
    window.location.href = alvo;
  }
  function pintarMusica() {
    var ex = escolhidos(exercicios);
    while (corpoMusica.firstChild) corpoMusica.removeChild(corpoMusica.firstChild);
    if (!ex.length) { caixaMusica.hidden = true; return; }
    caixaMusica.hidden = false;
    var semMusica = [];
    var muitas = [];
    for (var j = 0; j < ex.length; j++) {
      var pares = paresDe(ex[j]);
      if (!pares.length) semMusica.push(ex[j]);
      if (pares.length > 1) muitas.push(ex[j]);
      var tr = document.createElement("tr");
      var nome = document.createElement("td");
      nome.textContent = ex[j];
      tr.appendChild(nome);
      tr.appendChild(celula("tempos", pares));
      tr.appendChild(celula("compasso", pares));
      tr.appendChild(acoesDoExercicio(ex[j], pares));
      corpoMusica.appendChild(tr);
    }
    var base = "O que está aqui é a música que o verbete declara — ela não se escreve por cima: a contagem do compasso sai dos trechos da decomposição, no Estilo. Para trabalhar outro tempo neste exercício, derive e ajuste lá; esta aula nasce depois, com o que ficar gravado.";
    if (muitas.length) {
      base += " O verbete declara mais de uma música em: " + muitas.join(", ")
NaN
    }
    if (semMusica.length) {
      base += " Sem música declarada no verbete: " + semMusica.join(", ")
NaN
    }
    notaMusica.textContent = base;
  }
  function musicaDaVez(nome) {
    var pares = paresDe(nome);
    return pares.length === 1 ? { tempos: String(pares[0].tempos), compasso: String(pares[0].compasso) }
      : { tempos: "", compasso: "" };
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button[data-derivar]") : null;
    if (!b) return;
    e.preventDefault();
    derivar(b.getAttribute("data-derivar"), b.getAttribute("data-musica") || "");
  });
  exercicios.addEventListener("change", pintarMusica);
  function fechar() {
    caixa.hidden = true;
    document.removeEventListener("keydown", aoTeclar);
  }
  function mandado(sim) {
    btnGuardar.disabled = sim || !dados.temRepertorio;
    btnCancelar.textContent = sim ? "Fechar" : "Cancelar";
  }
  function aoTeclar(e) { if (e.key === "Escape") fechar(); }
  function abrir(nn, linha) {
    alvo = nn;
    titulo.textContent = "Criar a aula " + nn;
    var d = linha ? linha.querySelectorAll("td") : [];
    var quandoTexto = [];
    for (var k = 0; k < d.length && k < 4; k++) quandoTexto.push(String(d[k].textContent || "").trim());
    quando.textContent = "Data, dia e duração vêm do calendário: " +
      (quandoTexto.length ? quandoTexto.join(" · ") : "veja a linha da aula na tabela") +
      ". O que falta decidir é o que esta aula persegue — e com o quê.";
    var marco = dados.marcos[Number(nn) - 1] || "";
    campoMarco.textContent = marco;
    campoMarco.value = marco;
    listar(exercicios, dados.repertorio, "Exercícios que trabalham este objetivo");
    listar(blocos, dados.blocos, "Blocos onde ele é trabalhado");
    pintarMusica();
    dizer(dados.temRepertorio ? "" : "O repertório da turma está vazio: declare-o no plano antes de criar a aula.");
    mandado(false);
    caixa.hidden = false;
    document.addEventListener("keydown", aoTeclar);
  }
  function escolhidos(conjunto) {
    var saida = [], itens = conjunto.querySelectorAll("input[type=checkbox]");
    for (var i = 0; i < itens.length; i++) if (itens[i].checked) saida.push(itens[i].value);
    return saida;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-criar-aula]") : null;
    if (b) { e.preventDefault(); abrir(b.getAttribute("data-criar-aula"), b.closest("tr")); return; }
    if (e.target.closest && e.target.closest("[data-criar-fechar]")) fechar();
  });
  document.getElementById("criar-aula-cancelar").addEventListener("click", fechar);
  try {
    var pedida = new URLSearchParams(window.location.search).get("criar-aula");
    if (pedida) {
      var nn = String(Number(pedida));
      if (nn.length === 1) nn = "0" + nn;
      var botao = document.querySelector("[data-criar-aula=\"" + nn + "\"]");
      abrir(nn, botao ? botao.closest("tr") : null);
    }
  } catch (e) { /* endereço sem `URLSearchParams`: fica o clique */ }
  btnGuardar.addEventListener("click", function () {
    var marco = String(campoMarco.value || "").trim();
    var ex = escolhidos(exercicios), bl = escolhidos(blocos);
    if (!marco) { dizer("O objetivo específico desta aula é o que a torna observável — escreva-o."); return; }
    if (!ex.length) { dizer("Marque ao menos um exercício: é ele que dá o que observar."); return; }
    if (!bl.length) { dizer("Marque ao menos um bloco: é onde o objetivo acontece."); return; }
    if (!dados.id) { dizer("Este plano ainda não tem carimbo: grave-o primeiro, e a aula nasce dele."); return; }
    mandado(true); dizer("");
    comVeu("A criar a aula " + alvo + ": o objetivo, os exercícios e a sequência vão para o plano, e o ciclo é gerado a seguir. Não feche esta aba.", "Criar a aula");
    pedir(PORTA + "api/envelope/" + encodeURIComponent(dados.id))
      .then(function (env) { return gravar(env, marco, ex, bl); })
      .catch(function (erro) {
        liberarVeu(); mandado(false);
        dizer("não deu: " + (erro && erro.message || erro));
      });
  });
  function gravar(env, marco, ex, bl) {
    var r = Object.assign({}, (env && env.respostas) || {});
    var n = Number(alvo);
    var marcos = (r["marcos-por-aula"] && r["marcos-por-aula"].valor) || [];
    if (Array.isArray(marcos)) { while (marcos.length < n) marcos.push(""); marcos[n - 1] = marco; }
    var mapa = (r["aula-de-cada-objetivo"] && r["aula-de-cada-objetivo"].valor) || [];
    if (Array.isArray(mapa) && !mapa.some(function (m) { return Number(m.objetivo) === n; })) {
      mapa.push({ objetivo: n, aulas: [alvo] });
      r["aula-de-cada-objetivo"] = { valor: mapa, origem: "perguntado", respondente: "professor", nota: null };
    }
    r["aula-" + n + "-parametro"] = { valor: [{ marco: n, marcados: ex }], origem: "perguntado", respondente: "professor", nota: null };
    var alvoObj = n + " — " + marco;
    var seq = [];
    for (var i = 0; i < bl.length; i++) {
      for (var j = 0; j < ex.length; j++) {
        var mus = musicaDaVez(ex[j]);
        seq.push({ "Bloco": bl[i], "Objetivo específico": alvoObj, "Conteúdo do nível": ex[j], "Tempos": mus.tempos, "Compasso": mus.compasso });
      }
    }
    r["aula-" + n + "-sequencia"] = { valor: seq, origem: "perguntado", respondente: "professor", nota: null };
    return pedir(PORTA + "api/elicitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respostas: r, contexto: env.contexto, fonte: "plano",
        ajuste_de: dados.id, base: env,
        motivo: "a aula " + alvo + " foi criada a partir do calendário do plano" }),
    }).then(function (x) {
      var n = Number(alvo);
      var fora = (x && x.idsDesconhecidos) || [];
      var chaves = ["aula-" + n + "-sequencia", "aula-" + n + "-parametro"];
      var perdidas = [];
      for (var q = 0; q < chaves.length; q++) if (fora.indexOf(chaves[q]) !== -1) perdidas.push(chaves[q]);
      if (perdidas.length) {
        liberarVeu(); mandado(false);
        dizer("O plano foi gravado, mas a aula " + alvo + " NÃO foi criada: o plano recusou a resposta dela (" + perdidas.join(", ") + "). Nada foi gerado — e clicar outra vez daria o mesmo. O defeito é do sistema, não seu.");
        return;
      }
      noVeu("Aula " + alvo + " criada. O ciclo está a ser gerado — ela aparece em Aulas quando a geração fechar, e esta página fica em dia sozinha.");
      fechar();
      setTimeout(liberarVeu, 5000);
      if (x && x.disparo && x.disparo.ok === false) {
        noVeu("Aula " + alvo + " criada e gravada, mas o gerador não partiu: " + (x.disparo.erro || "motivo não informado") + ". O documento não vai sair sozinho.");
        setTimeout(liberarVeu, 9000);
      }
    })
    .catch(function (erro) {
      liberarVeu(); mandado(false);
      dizer("não deu: " + (erro && erro.message || erro));
    });
  }
})();
</script>
```

