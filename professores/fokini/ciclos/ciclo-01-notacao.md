---
projeto: Formação em Balé Clássico
frente: Documento de apoio
ciclo: "01"
title: "Notação em Benesh"
subtitle: "Registro dos exercícios de barra e de braços da Aula 05 para repetição sem depender da memória"
referencias: "Mirzabekiantz (2000); Parker (1990)"
---

## Aviso de proveniência (leia antes de usar)

Este documento **não é uma transcrição do sistema Benesh**. É um **código do ciclo**: um conjunto
pequeno de sinais, **baseado em conceitos do sistema**, com o qual os exercícios deste ciclo podem
ser lidos de volta sem depender da memória de quem deu a aula.

O que está registrado aqui é o que **foi dado** — os exercícios de barra do syllabus RAD
(tendu, jeté e fondu) e os braços básicos —, não o que o syllabus recomenda. Onde a memória não
alcança, a lacuna fica declarada.

> **Fontes declaradas (Regra 8):**
> - MIRZABEKIANTZ, Éliane. *Grammaire de la notation Benesh: manuel élémentaire*. Paris: Centre
>   national de la danse, 2000.
> - PARKER, Monica. *Benesh Movement Notation: Elementary Solo Syllabus — Ballet Application*.
>   Londres: Benesh Institute of Choreology, 1990.
>
> As referências completas estão em [Referências bibliográficas](referencias.html#notacao-em-benesh).

> **Nota (P-15).** Um ciclo que registra exercícios em notação declara o código usado. Este código
> é do ciclo — os sinais valem para os exercícios registrados aqui, e um sinal novo exige uma linha
> nova no [Glossário do código Benesh](glossario-benesh.html).

## Como ler o registro

| Coluna | O que diz |
|:--|:--|
| **Compasso** | o compasso da frase, contado de 1 |
| **Contagem** | as contagens do exercício dentro daquele compasso |
| **Notação** | o bloco de notação, sempre entre colchetes |
| **Descrição** | o que o corpo faz, na palavra de quem deu a aula |

Todo bloco de notação tem a forma `[Categoria: conteúdo]`. A **categoria** diz de que se está
falando — o pé, o peso, o plié ou o braço. O **conteúdo** diz o estado de partida, o movimento e o
estado de chegada, nessa ordem. O bloco inteiro é lido da esquerda para a direita, no tempo da
música.

> **Sobre os símbolos:** os sinais usados aqui foram escolhidos para serem digitáveis e legíveis
> numa folha impressa. Nenhum deles substitui a escrita completa do sistema — eles **apontam** para
> a frase, e a frase é que é a aula.

<!-- CALENDARIO -->

## Legenda completa (código do ciclo)

Todos os sinais estão no [Glossário do código Benesh](glossario-benesh.html), verbete por verbete,
com o significado, a origem e onde cada um aparece.

```{=html}
<div class="filtro-notacao" id="filtro-notacao" role="group" aria-label="Filtrar o registro em notação">
<p class="fn-titulo">Filtrar o registro</p>
<div class="fn-campos">
<label class="fn-campo">Ciclo<select id="fn-ciclo"><option value="">Todos</option></select></label>
<label class="fn-campo">Aula<select id="fn-aula"><option value="">Todas</option></select></label>
<label class="fn-campo">Exercício<select id="fn-exercicio" disabled><option value="">Todos</option></select></label>
<label class="fn-campo">Data<select id="fn-data"><option value="">Todas</option></select></label>
<button type="button" class="fn-botao" id="fn-filtrar">Filtrar</button>
</div>
<p class="fn-nota">Nenhum campo é obrigatório. O campo <b>Exercício</b> só fica disponível quando um ciclo ou uma aula está escolhido. A legenda de cada aula mostra os sinais que a notação dos exercícios exibidos usa.</p>
<p class="fn-status" id="fn-status" role="status" aria-live="polite"></p>
</div>
<style>
.filtro-notacao{border:1px solid var(--gold-borda,#a08a58);background:var(--creme-1,#fdfaf5);border-radius:6px;padding:.9rem 1rem 1rem;margin:1.2rem 0 1.6rem;font-family:var(--ui,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif)}
.filtro-notacao .fn-titulo{margin:0 0 .7rem;font-size:.78rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--gold-texto,#7a5c31)}
.fn-campos{display:flex;flex-wrap:wrap;gap:.6rem 1.1rem;align-items:flex-end}
.fn-campo{display:flex;flex-direction:column;gap:.22rem;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--soft,#5a5348)}
.fn-campo select{min-width:10rem;padding:.32rem .4rem;border:1px solid var(--gold-borda,#a08a58);border-radius:4px;background:var(--branco,#fff);color:var(--tinta,#1f1c1a);font:inherit;font-size:.84rem;font-weight:400;letter-spacing:0;text-transform:none}
.fn-campo select:disabled{background:var(--creme-5,#f1eae0);color:var(--soft,#5a5348);cursor:not-allowed}
.fn-botao{padding:.42rem 1.1rem;border:1px solid var(--burgundy,#6b1f2e);border-radius:4px;background:var(--burgundy,#6b1f2e);color:var(--branco,#fff);font:inherit;font-size:.84rem;font-weight:700;letter-spacing:.04em;cursor:pointer}
.fn-botao:hover{background:var(--burgundy-claro,#8a2a3d)}
.fn-nota{margin:.7rem 0 0;font-size:.78rem;color:var(--soft,#5a5348)}
.fn-status{margin:.5rem 0 0;font-size:.84rem;font-weight:700;color:var(--alerta,#8f5a12);min-height:1.2em}
.fn-grupo{margin:1.4rem 0 0}
.fn-grupo-titulo{margin:0 0 .5rem;padding-bottom:.25rem;border-bottom:1px solid var(--gold-claro,#c9a878);font-size:.8rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--gold-texto,#7a5c31)}
.fn-legenda-titulo{margin:.7rem 0 .3rem;font-weight:700;color:var(--soft,#5a5348)}
.fn-legenda{margin:0 0 .4rem}
.fn-oculto{display:none!important}
</style>
<script>
function iniciarFiltroNotacao() {
  'use strict';
  var painel = document.getElementById('filtro-notacao');
  if (!painel) return;
  var selCiclo = document.getElementById('fn-ciclo');
  var selAula = document.getElementById('fn-aula');
  var selEx = document.getElementById('fn-exercicio');
  var selData = document.getElementById('fn-data');
  var botao = document.getElementById('fn-filtrar');
  var status = document.getElementById('fn-status');
  var h2 = document.getElementById('legenda-completa-codigo-do-ciclo');
  if (!selCiclo || !selAula || !selEx || !selData || !botao || !status || !h2) { painel.parentNode.removeChild(painel); return; }

  var blocos = [].slice.call(document.querySelectorAll('.exercicio[data-exercicio]'));
  if (!blocos.length) { painel.parentNode.removeChild(painel); return; }

  function temClasse(el, nome) { return !!(el && el.classList && el.classList.contains(nome)); }
  function texto(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function alternar(el, oculto) { if (!el) return; if (oculto) { el.classList.add('fn-oculto'); el.hidden = true; } else { el.classList.remove('fn-oculto'); el.hidden = false; } }
  function dataISO(data) {
    var m = String(data).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : String(data);
  }
  function dataBR(data) {
    var s = String(data);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    var p = s.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : s;
  }
  function chave(it) { return it.ciclo + '/' + it.aula + '/' + it.numero; }
  function listar(valores) { var unicos = []; valores.forEach(function (v) { if (v && unicos.indexOf(v) === -1) unicos.push(v); }); return unicos.sort(); }

  // A data de cada aula não é escrita à mão na fonte: ela vem do calendário do ciclo, que
  // entra no documento na geração (Regra 10, camada 2). O calendário é a fonte da verdade
  // das datas; os exercícios dizem apenas de que aula são.
  function datasDoCalendario() {
    var mapa = {};
    var cabeca = document.getElementById('calendario-do-ciclo');
    if (!cabeca) return mapa;
    var tabela = null;
    for (var irmao = cabeca.nextElementSibling; irmao; irmao = irmao.nextElementSibling) {
      if (irmao.tagName === 'TABLE') { tabela = irmao; break; }
      if (/^H[1-6]$/.test(irmao.tagName)) break;
    }
    if (!tabela) return mapa;
    var linhas = tabela.querySelectorAll('tbody tr');
    for (var i = 0; i < linhas.length; i++) {
      var celulas = linhas[i].querySelectorAll('td');
      if (celulas.length < 2) continue;
      var aula = (celulas[0].textContent || '').match(/\d{1,2}/);
      var data = (celulas[1].textContent || '').replace(/\s+/g, '');
      if (aula && data) { mapa[(aula[0].length === 1 ? '0' : '') + aula[0]] = dataISO(data); }
    }
    return mapa;
  }

  var mapaCalendario = datasDoCalendario();

  var grupos = [];
  for (var irmao = h2.nextElementSibling; irmao && !temClasse(irmao, 'exercicio'); irmao = irmao.nextElementSibling) {
    var proximo = irmao.nextElementSibling;
    if (irmao.tagName === 'P' && proximo && proximo.tagName === 'UL') { grupos.push({ titulo: irmao, lista: proximo }); }
  }

  function simbolosDaNotacao(bloco) {
    var achados = [];
    var celulas = bloco.querySelectorAll('table code');
    for (var i = 0; i < celulas.length; i++) {
      var tokens = celulas[i].textContent.match(/\[|\]|:|[^\s[\]:]+/g) || [];
      for (var j = 0; j < tokens.length; j++) { if (achados.indexOf(tokens[j]) === -1) { achados.push(tokens[j]); } }
    }
    return achados;
  }

  var indice = blocos.map(function (bloco) {
    var titulo = bloco.querySelector('h2, h3, h4');
    return {
      el: bloco,
      ciclo: (bloco.getAttribute('data-ciclo') || '').trim(),
      aula: (bloco.getAttribute('data-aula') || '').trim(),
      data: mapaCalendario[(bloco.getAttribute('data-aula') || '').trim()] || '',
      numero: (bloco.getAttribute('data-exercicio') || '').trim(),
      titulo: titulo ? texto(titulo) : (bloco.getAttribute('data-exercicio') || '').trim(),
      simbolos: simbolosDaNotacao(bloco)
    };
  });

  function simboloDoItem(item) { var c = item.querySelector('code'); return c ? c.textContent.trim() : ''; }

  function preencher(select, opcoes) {
    var anterior = select.value;
    while (select.options.length > 1) { select.remove(select.options.length - 1); }
    opcoes.forEach(function (o) {
      var opcao = document.createElement('option');
      opcao.value = o.v;
      opcao.textContent = o.t;
      select.appendChild(opcao);
    });
    select.value = '';
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === anterior) { select.value = anterior; break; }
    }
  }

  function refazerEscopos() {
    var base = indice.filter(function (it) { return !selCiclo.value || it.ciclo === selCiclo.value; });
    preencher(selAula, listar(base.map(function (it) { return it.aula; })).map(function (a) { return { v: a, t: 'Aula ' + a }; }));

    var habilitado = !!(selCiclo.value || selAula.value);
    selEx.disabled = !habilitado;
    if (!habilitado) { preencher(selEx, []); return; }

    var escopo = base.filter(function (it) { return !selAula.value || it.aula === selAula.value; });
    var vistos = {}, opcoes = [];
    escopo.forEach(function (it) {
      var k = chave(it);
      if (vistos[k]) return;
      vistos[k] = true;
      opcoes.push({ v: k, t: it.titulo });
    });
    preencher(selEx, opcoes);
  }

  function datasDoPlanejamento(dados) {
    var datas = [];
    ((dados && dados.ciclos) || []).forEach(function (c) {
      ((c && c.aulas) || []).forEach(function (a) {
        if (a && a.data && datas.indexOf(a.data) === -1) { datas.push(a.data); }
      });
    });
    return datas;
  }

  function desenharDatas(datas) {
    var lista = (datas || []).map(dataISO);
    if (!lista.length) { lista = Object.keys(mapaCalendario).map(function (a) { return mapaCalendario[a]; }); }
    if (!lista.length) { lista = indice.map(function (it) { return it.data; }); }
    preencher(selData, listar(lista).map(function (d) { return { v: dataISO(d), t: dataBR(d) }; }));
  }

  function limparGrupos() {
    var antigos = document.querySelectorAll('.fn-grupo');
    for (var i = 0; i < antigos.length; i++) { antigos[i].parentNode.removeChild(antigos[i]); }
  }

  function sincronizarToc() {
    var ocultos = {};
    blocos.forEach(function (b) {
      if (!temClasse(b, 'fn-oculto')) return;
      var alvo = b.id || (b.querySelector('[id]') || {}).id;
      if (alvo) { ocultos[alvo] = true; }
    });
    var links = document.querySelectorAll('.toc-local a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      var item = links[i].closest ? links[i].closest('li') : null;
      if (!item) continue;
      alternar(item, !!ocultos[links[i].getAttribute('href').slice(1)]);
    }
  }

  function legenda(ocultar) {
    grupos.forEach(function (g) { alternar(g.titulo, ocultar); alternar(g.lista, ocultar); });
  }

  function informar(mensagem) { status.textContent = mensagem || ''; }

  function mostrarTudo() {
    limparGrupos();
    blocos.forEach(function (b) { alternar(b, false); });
    legenda(false);
    sincronizarToc();
  }

  function ocultarTudo() {
    blocos.forEach(function (b) { alternar(b, true); });
    legenda(true);
    sincronizarToc();
  }

  function montarGrupos(achados) {
    var ordem = [], porAula = {};
    achados.forEach(function (it) {
      var k = it.ciclo + '|' + it.aula + '|' + it.data;
      if (!porAula[k]) { porAula[k] = { aula: it.aula, data: it.data, itens: [] }; ordem.push(porAula[k]); }
      porAula[k].itens.push(it);
    });

    ordem.forEach(function (g) {
      var usados = [];
      g.itens.forEach(function (it) { it.simbolos.forEach(function (s) { if (usados.indexOf(s) === -1) { usados.push(s); } }); });

      var caixa = document.createElement('div');
      caixa.className = 'fn-grupo';
      var cabeca = document.createElement('p');
      cabeca.className = 'fn-grupo-titulo';
      cabeca.textContent = 'Aula ' + g.aula + (g.data ? ' · ' + dataBR(g.data) : '');
      caixa.appendChild(cabeca);

      grupos.forEach(function (gr) {
        var itens = [].slice.call(gr.lista.children).filter(function (li) { return usados.indexOf(simboloDoItem(li)) !== -1; });
        if (!itens.length) return;
        var titulo = document.createElement('p');
        titulo.className = 'fn-legenda-titulo';
        titulo.textContent = texto(gr.titulo);
        var lista = document.createElement('ul');
        lista.className = 'fn-legenda';
        itens.forEach(function (li) { lista.appendChild(li.cloneNode(true)); });
        caixa.appendChild(titulo);
        caixa.appendChild(lista);
      });

      g.itens[0].el.parentNode.insertBefore(caixa, g.itens[0].el);
    });

    blocos.forEach(function (b) {
      alternar(b, !achados.some(function (it) { return it.el === b; }));
    });
    sincronizarToc();
  }

  function aplicar() {
    limparGrupos();
    var fc = selCiclo.value, fa = selAula.value, fd = selData.value;
    var fe = (fc || fa) ? selEx.value : '';

    if (!fc && !fa && !fd) {
      mostrarTudo();
      informar('Nenhum filtro foi aplicado');
      return;
    }

    var achados = indice.filter(function (it) {
      if (fc && it.ciclo !== fc) return false;
      if (fa && it.aula !== fa) return false;
      if (fe && chave(it) !== fe) return false;
      if (fd && it.data !== fd) return false;
      return true;
    });

    if (!achados.length) {
      ocultarTudo();
      informar(fd
        ? 'Não existe(m) registro(s) de exercício(s) para essa data'
        : 'Nenhum exercício corresponde ao filtro aplicado.');
      return;
    }

    legenda(true);
    montarGrupos(achados);
    var aulas = listar(achados.map(function (it) { return it.aula; }));
    informar('Registro filtrado: ' + achados.length + (achados.length === 1 ? ' exercício em ' : ' exercícios em ') + aulas.length + (aulas.length === 1 ? ' aula.' : ' aulas.'));
  }

  selCiclo.addEventListener('change', refazerEscopos);
  selAula.addEventListener('change', refazerEscopos);
  botao.addEventListener('click', aplicar);

  preencher(selCiclo, listar(indice.map(function (it) { return it.ciclo; })).map(function (c) { return { v: c, t: 'Ciclo ' + c }; }));
  desenharDatas([]);
  refazerEscopos();

  // O campo Data sai do calendário do ciclo impresso nesta própria página. Só quando não há
  // calendário no documento é que as datas são buscadas no planejamento (ciclos.json, gerado
  // a partir do mesmo calendário): assim uma aula planejada que ainda não tem exercício pode
  // ser escolhida e a mensagem de "sem registro para essa data" continua alcançável.
  if (!Object.keys(mapaCalendario).length) {
    fetch('ciclos.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (dados) { var datas = datasDoPlanejamento(dados); if (datas.length) desenharDatas(datas); })
      .catch(function () { /* mantém as datas do índice */ });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarFiltroNotacao);
} else {
  iniciarFiltroNotacao();
}
</script>
```

Blocos e categorias:

- [abre bloco](glossario-benesh.html#abre-bloco) `[` — início de um bloco de notação
- [fecha bloco](glossario-benesh.html#fecha-bloco) `]` — fim de um bloco de notação
- [dois-pontos](glossario-benesh.html#dois-pontos) `:` — separa a categoria do conteúdo
- [categoria pé](glossario-benesh.html#categoria-pe) `Pé` — o bloco fala do pé
- [categoria peso](glossario-benesh.html#categoria-peso) `Peso` — o bloco fala da distribuição do peso
- [categoria plié](glossario-benesh.html#categoria-plie) `Plié` — o bloco fala do apoio que cede
- [categoria braço](glossario-benesh.html#categoria-braco) `Braço` — o bloco fala dos braços

Direções e movimento:

- [conduz a](glossario-benesh.html#conduz-a) `→` — o estado de chegada do movimento
- [fecha](glossario-benesh.html#fecha) `●` — retorno à posição fechada ou ao apoio
- [à frente](glossario-benesh.html#a-frente) `+` — o pé viaja à frente (devant)
- [ao lado](glossario-benesh.html#ao-lado) `-` — o pé viaja ao lado (à la seconde)
- [atrás](glossario-benesh.html#atras) `×` — o pé viaja atrás (derrière)
- [arco](glossario-benesh.html#arco) `⌒` — o braço viaja em arco
- [rotação para fora](glossario-benesh.html#rotacao-para-fora) `↺` — o braço roda para fora (en dehors)

Posições e lados:

- [primeira posição](glossario-benesh.html#posicao-1) `1ª` — a posição de partida e de retorno
- [segunda posição](glossario-benesh.html#posicao-2) `2ª` — a posição aberta ao lado
- [terceira posição](glossario-benesh.html#posicao-3) `3ª` — a posição de fechamento dos braços
- [quinta posição](glossario-benesh.html#posicao-5) `5ª` — a posição de apoio do fondu
- [lado direito](glossario-benesh.html#lado-d) `D` — o lado direito do corpo
- [lado esquerdo](glossario-benesh.html#lado-e) `E` — o lado esquerdo do corpo

<div class="exercicio" data-ciclo="01" data-aula="05" data-exercicio="1.1">

## Exercício 1.1: tendu (barra, 8 tempos, 4/4) {#exercicio-11-tendu-barra-8-tempos-44}

| Compasso | Contagem | Notação | Descrição |
|:---:|:---:|:---|:---|
| 1 | 1–2 | `[Pé: 1ª → 2ª]` | o pé D estende da 1ª para a 2ª posição, a ponta no chão |
| 1 | 3–4 | `[Pé: 2ª ● 1ª]` | retorno à 1ª posição |
| 2 | 1–2 | `[Peso: 2ª → 1ª]` | o peso volta a distribuir-se nos dois pés |
| 2 | 3–4 | `[Braço: 1ª → 2ª]` | o braço D abre até a 2ª posição |

> **O que olhar no registro:** o primeiro bloco diz **para onde** o pé vai, e o segundo diz que ele
> **volta a fechar**. A ordem dos dois é o exercício: extensão primeiro, retorno depois.

</div>

<div class="exercicio" data-ciclo="01" data-aula="05" data-exercicio="1.2">

## Exercício 1.2: tendu devant e derrière (barra, 4 tempos, 4/4) {#exercicio-12-tendu-devant-e-derriere-barra-4-tempos-44}

| Compasso | Contagem | Notação | Descrição |
|:---:|:---:|:---|:---|
| 1 | 1–2 | `[Pé: 1ª → +]` | extensão à frente, a ponta no chão |
| 1 | 3–4 | `[Pé: + ● 1ª]` | retorno à 1ª posição |
| 2 | 1–2 | `[Pé: 1ª → ×]` | extensão atrás, a ponta no chão |
| 2 | 3–4 | `[Pé: × ● 1ª]` | retorno à 1ª posição |

> **Correção registrada:** na primeira passagem o `+` e o `×` saíram trocados na fala. O bloco
> registra o que foi **dado**, não a ordem em que o professor anunciou.

</div>

<div class="exercicio" data-ciclo="01" data-aula="05" data-exercicio="2.1">

## Exercício 2.1: jeté (barra, 6 tempos, 4/4) {#exercicio-21-jete-barra-6-tempos-44}

| Compasso | Contagem | Notação | Descrição |
|:---:|:---:|:---|:---|
| 1 | 1–2 | `[Pé: 1ª → -]` | saída para o lado, pé estendido no ar |
| 1 | 3–4 | `[Pé: - ● 1ª]` | reentrada na 1ª posição |
| 2 | 1–2 | `[Peso: D → E]` | a condução passa do pé D para o pé E |
| 2 | 3–4 | `[Peso: E → D]` | e volta, para repetir do outro lado |

</div>

<div class="exercicio" data-ciclo="01" data-aula="05" data-exercicio="3.1">

## Exercício 3.1: fondu (barra, 8 tempos, 4/4) {#exercicio-31-fondu-barra-8-tempos-44}

| Compasso | Contagem | Notação | Descrição |
|:---:|:---:|:---|:---|
| 1 | 1–2 | `[Peso: 1ª → D]` | o peso passa ao pé D |
| 1 | 3–4 | `[Plié: D → 5ª]` | o apoio D cede até a 5ª posição |
| 2 | 1–2 | `[Pé: 5ª → +]` | a perna E estende à frente |
| 2 | 3–4 | `[Plié: 5ª ● D]` | o apoio sobe e o eixo retorna |

> **Correção registrada:** o fondu foi dado mais lento que o tendu e o jeté — a descida controlada
> não cabe na mesma contagem. O registro mantém a contagem do que se fez.

</div>

<div class="exercicio" data-ciclo="01" data-aula="05" data-exercicio="4.1">

## Exercício 4.1: braços básicos (centro, 6 tempos, 4/4) {#exercicio-41-bracos-basicos-centro-6-tempos-44}

| Compasso | Contagem | Notação | Descrição |
|:---:|:---:|:---|:---|
| 1 | 1–2 | `[Braço: 1ª → 2ª ⌒]` | os braços abrem em arco até a 2ª posição |
| 1 | 3–4 | `[Braço: 2ª → 3ª ⌒]` | fecham em arco até a 3ª posição |
| 2 | 1–2 | `[Braço: 3ª ↺ 1ª]` | rodam para fora e voltam à 1ª posição |
| 2 | 3–4 | `[Braço: D → E]` | a condução passa do braço D para o braço E |

</div>

## Como usar em aula

1. Leia o bloco **antes** de dar o exercício: ele diz de onde o pé sai e para onde volta.
2. Marque as correções no [Glossário do código Benesh](glossario-benesh.html) quando um sinal
   mudar de significado — o código e o registro têm de andar juntos.
3. Use a coluna **Descrição** para ensinar e a coluna **Notação** para conferir: se as duas
   divergirem, o registro está errado.
4. Ao repetir o exercício num encontro seguinte, registre o que mudou como **elo novo** — não
   sobrescreva o bloco anterior.

## Limites do registro

- **Não é a escrita completa do sistema.** Cobre os exercícios de barra e de braços deste ciclo, e
  nada além.
- **Não descreve a qualidade.** O código diz o que o corpo faz, não como ficou.
- **Não substitui a folha de captura.** As marcas de aula continuam na folha; este documento é o
  que se leva para o encontro seguinte.
- **Não é definitivo.** Cada exercício registrado aqui pode receber um elo novo quando for dado de
  outra forma.
