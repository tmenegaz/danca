# Implementação da identidade visual — plano e estado

> **Regra deste arquivo.** Ele é o **acompanhamento** da execução do
> `DIAGNOSTICO-IDENTIDADE.md`. Cada item é verificável por comando. Ao concluir um item,
> marque a caixa **e** atualize a coluna “estado” com a data e a evidência (o comando que
> passou). Item não concluído fica `[ ]`; item que mudou de escopo ganha nota datada —
> nunca é apagado.
>
> **O congelamento não é contornado.** Os itens marcados `[congelado]` tocam `tools/` ou
> `tools/templates/` e exigem, além do código: motivo declarado no commit, entrada no
> `REGISTRO.md` e commit próprio (`CONGELAMENTO.md`).

> **Leitura de fechamento — 18/10/2026.** O plano é conferido contra o que existe: as Fases 0 a
> 7 estão fechadas, e a conferência visual (**3.4**) foi feita. Duas coisas **foram além** do que
> este documento propunha, e viraram trabalho: a **Fase 8**, que trata da forma partilhada (a
> etiqueta, os componentes, o que está no ar × o motor), e a **dobra do índice no celular**, que
> o plano não previa. Onde um número deste arquivo envelheceu, ele fica com **nota datada** —
> nunca é apagado.
>
> **A decisão que faltava foi tomada.** O **2.8** — o catálogo das doze paletas — era o único item
> aberto, e estava à espera da **C15**. Em **18/10/2026** o dono do produto decidiu: **a
> preferência de aparência é da escola**. O item **não fecha** com isso, e é importante dizer por
> quê: a decisão foi sobre **quem escolhe**, não sobre **quais são** — os hex das doze combinações
> **continuam a não existir** no repositório, e não se inventam. O que a decisão destrava está no
> §L13 do `PLANEJAMENTO-LASTRO.md` (V0 fechada; V1 é o próximo passo, e é de **desenho+medição**).

> **O que é a C15 — e a resposta (glossário, para não obrigar a saltar para o planeamento).** As
> decisões do produto estão numeradas em `PLANEJAMENTO-LASTRO.md` (`C1`, `C2`, `C11`, `C13`,
> `C15`, `C17`, `C18`…), e cada uma bloqueia um pedaço. A **C15** perguntava **de quem é a
> preferência de aparência** — da **escola**, do **usuário** ou do **navegador** —, e a medição
> mostrou que **não havia usuário** onde pendurá-la: a senha da Produção é **uma por escola** (a
> da direção *ou a de qualquer professor cadastrado*), e depois do portão a página guarda **a
> senha, não quem entrou**. O sistema autentica **um segredo**, não **uma pessoa** — a mesma
> lacuna que a **C11** (não há lado público na porta) e a **C13** (não há escola na raiz).
>
> **RESPONDIDA em 18/10/2026: a preferência é DA ESCOLA.** As três consequências, para quem for
> implementar:
>
> | Consequência | O que muda |
> | --- | --- |
> | o **mecanismo** | passa a ser o **servidor**. Uma escolha que vale para todos não pode viver no navegador de cada um |
> | o **lugar do valor** | o **dado da escola**, sob o `ESCOLA_SLUG` que a instalação já tem — nenhum campo novo de «usuário» |
> | quem pode mudar | **qualquer pessoa com a senha da escola**, porque `senhaDaEscolaOk` aceita a da direção *ou a de qualquer professor*. Distinguir a direção é a **C17**, que continua aberta |
>
> O que a decisão **não** resolve: **os hex das doze paletas continuam não especificados** (foi uma
> decisão sobre *quem escolhe*, não sobre *quais são*), e o ***quando*** — na contratação (*B*) ou
> no primeiro uso (*A*) — decide **onde o valor mora**, e passou a ser pergunta da **V5**. Até a
> implementação, o tema funciona com a escolha **no navegador**, declarada como **provisória**.

## Princípios que valem em todas as fases

1. **Uma folha de tokens, sem build.** O HTML sai por quatro caminhos (Pandoc, Worker,
   função pura da ficha, SPA da porta); a verdade da forma tem de estar nas classes e nos
   tokens, não num componente que só um caminho enxerga.
2. **Nenhum hex fora da fonte.** Valor novo se declara em `tools/templates/ciclo.css`.
3. **Nenhum fallback de token.** `var(--x, #hex)` esconde a renomeação; falha alto.
4. **Nada de `style="…"` para o que é recorrente.**
5. **Contraste medido, não estimado.** Par novo entra em `PARES`.
6. **Impressão sempre clara.** `@media print` fixa os papéis da variante clara.

---

## Fase 0 — fechar o circuito

Objetivo: eliminar a divergência **silenciosa** e as contradições. Nenhuma mudança de
layout pretendida; o resultado visual deve ser o mesmo (ou mais coerente), e o validador
deve passar.

| # | Item | Arquivo | Estado |
|---|---|---|---|
| 0.1 | Remover fallbacks e hex da porta (`var(--tinta, #3a2b1f)`, `#c9a24b`, `#e0d3ae`, `#2f6b3a`, `#8a5a12`, `#8f3f3f`) | `porta/index.html` | `[x]` 16/10 — 0 hex, 0 fallback |
| 0.2 | Resolver a contradição `.opcao.travada` (duas regras, a segunda vence) | `porta/index.html` | `[x]` 16/10 — regra única (`opacity: 1`) |
| 0.3 | Trocar `style="margin:…"` por uma classe (8 ocorrências) | `porta/index.html` | `[x]` 16/10 — `.linha-acao` / `.folgada` |
| 0.4 | Corrigir a grade da raiz quando não há `.rail` | `raiz/index.html` | `[x]` 16/10 — coluna única a 900px |
| 0.5 | Raiz: hex → tokens (`#eef7ee`, `#fdeaea`, `rgba`) | `raiz/index.html` | `[x]` 16/10 — 0 hex; `rgba` de véu/sombra fica para 2.3 |
| 0.6 | Bastidores: escopar `button`, desfazer a colisão `.ficha`, hex → tokens | `motor/servidor/bastidores.js` | `[x]` 16/10 — `.corpo button`, `.escolhido` |
| 0.7 | Ficha: consumir os tokens canônicos (fim da segunda identidade) | `motor/nucleo/ficha-html.js` | `[x]` 16/10 — 12 tokens declarados e conferidos |
| 0.8 | Páginas de estado com a identidade do sistema (uma função só) | `motor/servidor/{producao,cloudflare,provisionar-escola}.js` + `estado-html.js` | `[x]` 16/10 — folha única |
| 0.9 | `[congelado]` `gerar-raiz.sh` copia a folha; validador cobre `raiz/` | `tools/gerar-raiz.sh`, `tools/check-identidade.js` | `[x]` 16/10 — motivo no `REGISTRO.md` |
| 0.10 | `[congelado]` Validador: varrer `porta/`, `motor/`, `ficha`; aceitar `#fff`; sinalizar múltiplos `:root` | `tools/check-identidade.js` | `[x]` 16/10 — 6 verificações ok |

> **Nota de 16/10/2026 — a Fita não foi regenerada pelo gerador.** `tools/gerar-ciclo.sh`
> recusa o ciclo porque `DATA_INICIO` é `[Preencher: …]` (Pré-requisito 5, corretamente). Foram
> propagadas só as duas cópias determinísticas: `assets/style.css` e o `<style>` de
> `plano-observacao/index.html`. O diff contra `porta/index.html` continua sendo **apenas a
> navegação injetada**. Quando a data existir, rodar o gerador completo.
>
> **`check-pacote.js` reprova a Fita** por ausência de `plano.html`, PDF, aulas e
> `-dados.json` — estado de **pacote zero**, anterior a esta mudança. Não é regressão.

### Critério de saída da Fase 0 — conferido em 16/10/2026

```bash
node tools/check-identidade.js
# ok: Contraste: 25 pares medidos, todos em AA ou acima
# ok: Cópia única: nenhum dos 26 hex da paleta fora de tools/templates/ciclo.css
# ok: Declarante: os 12 tokens de motor/nucleo/ficha-html.js batem com a fonte
# ok: Declarante: os 8 tokens de motor/servidor/estado-html.js batem com a fonte
# ok: Deck: os 7 tokens declarados batem com tools/templates/ciclo.css
# ok: Circuito: assets/style.css e assets/nav.js de cada pacote batem com a fonte

node motor/ficha-html-cli.js --autoteste     # 42 de 42 passaram
node tools/check-apresentacao.js             # 2 páginas fiéis à fonte
node experimentos/provar-producao.js          # 109 de 109
node experimentos/provar-derivacao-da-turma.js # 118 de 118
tools/gerar-raiz.sh                          # corpo idêntico (diff vazio); folha copiada
```

Pendente de conferência **no navegador**: raiz, porta, bastidores/produção e as páginas de
estado. A análise garante que os valores mudaram para os tokens canônicos; ela não substitui o
olho.

### Correção de leitura — 16/10/2026

O diagnóstico (F8) dizia que o campo da raiz em `--cream` sobre o cartão branco era divergência.
**Não é**: é o mesmo padrão dos Bastidores (campo sobre superfície elevada). O item foi corrigido
no `DIAGNOSTICO-IDENTIDADE.md` com nota datada; a divergência real é a dos **rótulos**, que fica
para a Fase 1.

---

## Fase 1 — camada de componentes

Objetivo: os componentes deixam de ser reescritos por página.

| # | Item | Estado |
|---|---|---|
| 1.1 | Declarar no `ciclo.css` os componentes: botão (principal/secundário/perigo/pequeno), campo, rótulo, foco, selo, cartão, modal, `.res`, aviso | `[x]` 16/10 — seção "COMPONENTES" |
| 1.2 | Declarar a escala: espaço `4/8/12/16/24/32`, raio `4/6/8/999` | `[x]` 16/10 — `--esp-1..6`, `--raio-1..3`, `--raio-pilula`. **Nota 17–18/10:** os raios passaram a **8/12/20/999** (a pele E, HarmonyOS), e a ficha e as páginas de estado passaram a **declarar** a escala em vez de escrever `4px` e `6px` à mão |
| 1.3 | Migrar a raiz para as classes de componente | `[x]` 16/10 — 300 → **162** linhas de CSS local |
| 1.4 | Migrar a porta | `[x]` 16/10 — 386 → **349** linhas |
| 1.5 | Migrar o lançamento | `[x]` 16/10 — 86 → **71** linhas |
| 1.6 | Migrar os bastidores | `[x]` 16/10 — 159 → **68** regras |
| 1.7 | Escopar o CSS de página e/ou `@layer` | `[x]` 16/10 — `:where()` (especificidade zero) + `data-tela`; ver nota |
| 1.8 | Unificar a navbar (um gerador de markup, dois consumidores) | `[x]` 16/10 — `tools/templates/nav-html.js` |
| 1.9 | Atualizar `experimentos/` ou marcá-los como congelados no tempo | `[x]` 16/10 — nota datada no `experimentos/README.md` |

### Por que `:where()` em vez de `@layer` (item 1.7)

Há **uma** folha global e **um** `<style>` por página, que vem depois dela. O problema de cascata
não era de ordem entre arquivos: era de **especificidade** — o desenho base de `button` e de
`input` vencia as regras de página e obrigava cada página a reescrever o componente (foi assim que
o `.hamburger` ganhou `margin-top` e as abas perdiam o hover).

`@layer` resolveria a ordem, mas não a especificidade dentro da camada. `:where()` zera a
especificidade do piso: qualquer regra de página vence sem `!important`, e o componente global
continua valendo onde a página não diz nada. Um `<body data-tela="…">` marca a superfície para
regras futuras que precisem ser condicionais — o nome `data-pagina` já era dos botões de navegação
da porta.

Não se adotou `@layer` agora porque ele exigiria reordenar todo o `ciclo.css` (base, layout,
componentes) para ganho zero neste desenho; fica como opção quando houver mais de uma folha de
tema.

### Critério de saída da Fase 1 — conferido em 16/10/2026

- **Nenhum `<style>` de página define** botão, campo, rótulo, selo, cartão, modal ou `.res`.
  Conferido por `grep` nos quatro arquivos e pelo audit de classes.
- **O CSS local caiu de 931 para 650 linhas** (raiz 300→162 · porta 386→349 · lançamento
  86→71 · bastidores 159→68 regras), e a folha compartilhada subiu de 286 para 520 — o
  desenho que antes existia quatro vezes agora existe uma.
- **O piso tem especificidade zero** (`:where()`), então a navbar, as abas e os botões-ícone
  não precisam mais reescrever o componente para não herdar preenchimento.
- `node tools/check-identidade.js` → 6 verificações ok. **Nota 18/10:** são **9** hoje (as
  checagens 7 «Forma» e a de circuito por pacote entraram depois; ver a Fase 8).
- `node experimentos/provar-producao.js` → 109/109 · `provar-derivacao-da-turma.js` → 123/123.

**Não conferido no navegador.** A migração preserva as medidas declaradas e foi validada por
prova de markup e de comportamento; o olho humano no resultado é o passo seguinte.

**Observação (não corrigida, fora do escopo):** em `raiz/index.html`, o texto «apagando … não
feche esta janela» é escrito num `.res` **sem** classe de estado (`className = "res"`), e por
isso o elemento continua `display:none`. É anterior a esta mudança e não tem relação com a
camada de componentes.

---

## Fase 2 — papéis semânticos, temas e layouts

| # | Item | Estado |
|---|---|---|
| 2.1 | Camada de papéis (`--fundo`, `--superficie`, `--texto`, `--texto-suave`, `--borda`, `--borda-campo`, `--marca`, `--marca-texto`, `--acao-*`, `--foco`…) | `[x]` 17/10 |
| 2.2 | Consumidores passam a falar por papel (primitivos só na fonte) | `[x]` 17/10 — guard no validador |
| 2.3 | Tokens de estado e de superfície: `--ok-fundo`, `--alerta-fundo`, `--falha-fundo`, `--derivada(-fundo)`, `--veu`, `--sombra`, `--campo-fundo` | `[x]` 17/10 |
| 2.4 | `[data-modo="noturna"]` + `color-scheme`; **a escolha é da escola, aplicada no servidor** | `[x]` 17/10 (tema) · `[x]` **18/10 — deixou de ser provisório**. O modo vive em `bastidores/<escola>/aparencia`, é servido no `<html>` com `data-modo-fonte="escola"`, e o controlo está na secção **Aparência** da Produção (portão `senhaDaDirecaoOk`). O botão `◐` saiu da barra das escolas e ficou **só na raiz**. Prova: `provar-tema` (36) + `provar-aparencia` (35) |
| 2.5 | `@media print` força os papéis claros | `[x]` 17/10 — `!important`, explícito |
| 2.6 | Validador mede **todos** os temas e o uso de papel | `[x]` 17/10 — 31 pares × 2 temas; guard de primitivo |
| 2.7 | Layouts: `data-layout="documento" \| "painel"` | `[x]` 17/10 |
| 2.8 | Seletor de aparência — **catálogo** das 12 paletas | `[ ]` **C15 decidida em 18/10/2026 — a preferência é da escola** (ver a glosa no topo). **O (b) e o (c) estão feitos** desde 18/10: o servidor aplica a aparência da escola e o controlo existe em Produção — com **dois** modos, não doze. O que falta **não é decisão, é trabalho**: (a) **especificar e medir** os hex das doze combinações — nenhum existe, e nenhum se inventa (V1 do §L13); (b) ~~o servidor aplicando a paleta da escola~~ — **feito, com a paleta vigente**; (c) ~~o campo na configuração~~ — **feito**: a secção **Aparência** (motivo declarado no `REGISTRO.md`); (d) o validador medindo as doze |

### O que a Fase 2 fez, e o que ela **não** fez

**Fez:** a camada de papéis (o componente deixa de conhecer `--cream`/`--burgundy`); a variante
noturna da identidade vigente, com todos os pares medidos; o botão de tema, explícito; a impressão
sempre clara; o `data-layout`; e dois guards novos no validador — **tema não medido não passa**, e
**primitivo em consumidor não passa**.

**E, em 18/10/2026, o que a C15 mandou fazer — que era do 2.4 e do 2.8:** a escolha saiu do
navegador e passou a ser **da escola**, guardada no dado dela (`bastidores/<escola>/aparencia`,
com o **nome** do modo), aplicada **no servidor** em tudo o que a escola serve — as vistas dos
Bastidores e, pela ponte de produção, o pacote do ciclo e a porta —, com o controlo na secção
**Aparência** da Produção. O botão `◐` saiu da barra das escolas (fica só na raiz, que não é
escola); o anti-flash ficou como rede de quem abre o `.html` do disco, agora **guardado** por
`data-modo-fonte`, para não desfazer nas páginas servidas o que a escola decidiu.

**Não fez:** o **catálogo** das seis famílias (as doze combinações), o item de menu «Identidade
visual» e a escolha por escola/usuário. Nada disso foi inventado: os valores das outras famílias
continuam **não especificados**. A gravação no navegador é provisória e está declarada como tal no
`IDENTIDADE-VISUAL.md`. **Nota 18/10/2026:** a **C15 foi decidida — a preferência é da escola** —
e o que era «escolha por escola/usuário» passa a ser só «por escola», com o **servidor** a aplicar.

### Como conferir o tema

```bash
node tools/check-identidade.js     # 8 verificações (31 pares × 2 temas)
```

No navegador: abrir a raiz, a porta, o lançamento e a Produção, clicar no `◐` e conferir que
**nenhuma** superfície ficou clara no meio do escuro. A prova automática cobre o contraste e o uso
de papel; o olho cobre o que a aritmética não vê.

---

## Fase 3 — verificação e fechamento

Objetivo: o que a aritmética não vê. Medir comportamento, alinhar a documentação e deixar o
estado explícito para a próxima sessão.

| # | Item | Estado |
|---|---|---|
| 3.1 | Prova do tema (comportamento + CSS + superfícies) | `[x]` 17/10 — `experimentos/provar-tema.js`, 29/29 |
| 3.2 | Documentação: `README.md`, `motor/servidor/README.md` | `[x]` 17/10 |
| 3.3 | Regenerar o `HANDOFF.md` (gerado) | `[x]` 17/10 |
| 3.4 | Conferência **visual** no navegador (clara e noturna) | `[x]` 18/10 — **feita pelo dono do produto nos dois ambientes de teste** (fita e valse), depois da rodada da forma partilhada e da dobra do índice. É a única conferência que não se automatiza: a aritmética mede contraste e a prova mede geometria; o gosto é de quem usa |
| 3.5 | Commit próprio das mudanças em `tools/` (congelados) | `[x]` 18/10 — dois commits próprios com motivo declarado: `f9b416b` (a forma partilhada e os dois validadores) e `ce874b9` (a dobra do índice) |

### O que a prova do tema encontrou

A primeira versão do esqueleto da navbar emitia o botão `◐` **dentro** do `.nav-links` — o painel
que colapsa no celular. Com o menu fechado, o botão ficaria **inalcançável**, e nenhuma das
verificações anteriores notava: o contraste estava certo, o HTML estava «válido», e o botão
existia. A prova passou a medir a **faixa** do `.nav-links` (com profundidade de `<div>`) e a
exigir o botão **fora** dela — nas páginas geradas também, não só no esqueleto.

É o tipo de defeito que só aparece no aparelho de quem usa: no desktop o painel está sempre
aberto, e o botão parece certo.

### O que a Fase 3 **não** fecha

- **O catálogo das doze paletas (2.8)** continua em aberto — mas **mudou de natureza** com a
  decisão da **C15** (18/10/2026, a preferência é da escola): o que falta são os **valores
  especificados e medidos** e a aplicação pelo **servidor**, não uma decisão de produto.
- **A conferência visual** é do dono do produto; a prova cobre contraste, papel e comportamento,
  não o gosto. **Feita em 18/10/2026** nos dois ambientes de teste — o item 3.4 está fechado.
- **O commit** é uma decisão à parte: `tools/` é congelado e exige commit próprio com o motivo
  declarado, já escrito no `REGISTRO.md`.

## Fase 8 — a forma partilhada, e o que está no ar (18/10/2026)

Objetivo: fechar o que a Fase 1 **disse ter fechado** e não fechou. A Fase 1 declarou «nenhum
`<style>` de página define botão, campo, rótulo, selo, cartão, modal ou `.res`» e conferiu por
`grep` do seletor **nu** — `.selo {`. Essa busca não vê `.selo.vinculada`, e foi por ali que a
porta redeclarou **quatro estados** do selo.

**O sintoma, dito pelo dono do produto:** «a etiqueta *livre* está de um jeito nos Bastidores e de
outro na anamnese — isso não é identidade visual». **A pergunta que veio com ele:** «não tem
sentido eu testar se estou a testar uma coisa e no motor é outra».

| # | Item | Estado |
|---|---|---|
| 8.1 | A página não **redeclara** componente: saem os quatro `.selo` da porta | `[x]` 18/10 — `porta/index.html` |
| 8.2 | Um nome de estado, um desenho: `.solta` é alias de `.livre` na fonte | `[x]` 18/10 — `ciclo.css` (a declaração já o dizia; o CSS é que não cumpria) |
| 8.3 | Estado que só uma página conhece deixa de existir (`.selo.sem-uso`) | `[x]` 18/10 — `bastidores.js` |
| 8.4 | Nenhum alias toma o nome de um papel (`--borda: var(--borda-campo)`) | `[x]` 18/10 — 7 usos passam a `--borda-campo` |
| 8.5 | `.aviso` e `.caixa.falta` da porta: um tom, não dois; nenhuma cópia | `[x]` 18/10 |
| 8.6 | `footer.rodape` do lançamento passa a `barra-de-controle` | `[x]` 18/10 — eram dois desenhos para a mesma classe |
| 8.7 | Quem é servido sem a folha copia os **números**: raio no cartão e no botão | `[x]` 18/10 — ficha `4px → --raio-3`; estado `6px/8px → --raio-2/--raio-3` |
| 8.8 | `[congelado]` Checagem **«Forma»** no validador: redeclaração e estado inexistente | `[x]` 18/10 — `check-identidade.js`, 7ª checagem; lista **derivada** da fonte |
| 8.9 | Prova do que se **vê**: forma medida nas quatro superfícies, nos dois temas | `[x]` 18/10 — `provar-selo.js`, 14 asserções; controle negativo na porta de `HEAD` |
| 8.10 | Prova do que se **serve**: o que está no ar é o motor | `[x]` 18/10 — `provar-ambiente.js`, 8 verificações × 2 escolas |
| 8.11 | A **dobra do índice** no celular — o plano não previa | `[x]` 18/10 — `provar-dobra-do-indice.js`, 16/16 |

### O que a Fase 8 encontrou, e o que ela acrescenta ao plano

1. **A verificação da Fase 1 media o seletor errado.** «Nenhum `<style>` de página define selo»
   era verdade para `.selo {` e falso para `.selo.vinculada`. A lição não é sobre o selo: é que
   **um critério de saída escrito como `grep` de uma string** não sustenta uma afirmação sobre
   composição. A 8.8 substitui o `grep` por uma regra que lê o **alvo** de cada regra e a lista de
   componentes **derivada da própria fonte** — um componente novo entra coberto sem ninguém
   lembrar.
2. **Redeclarar um componente não o deixa «um pouco diferente»: deixa-o metade de cada lugar.**
   O `<style>` da página vem depois da folha, então vence — mas só nas propriedades que escreve.
   O fundo continua o da folha, a borda e o texto passam a ser da página, e ninguém vê a
   divergência porque cada metade vem de um sítio.
3. **Alias de página pode sequestrar um papel.** `--borda: var(--borda-campo)` fazia todo
   componente que a folha veste com `--borda` (o selo, o `pre`, o `hr`) sair com outro filete
   **só naquela tela**. Não é uma questão de cor: é o mesmo mecanismo do item 2, um nível abaixo.
4. **O diagnóstico nunca olhou para o DEPLOY.** Ele compara fonte, cópia e artefato no
   repositório; nada nele pergunta se o Worker serve o que o repositório tem. O `provar-ambiente`
   respondeu que **não** — o `style.css`, a porta e o `<style>` da Produção estavam atrás do
   repositório nas duas escolas. O que o dono do produto estava a testar não era o motor.
5. **A navegação no celular não estava no plano.** A Fase 5 mediu largura na vista de trabalho; o
   índice da página — uma coluna congelada que, abaixo de 1200px, é um bloco no topo com 15, 20,
   30 linhas — ficou de fora. A 8.11 dobra-o: 66px recolhido contra 562px aberto, com o controle
   só onde a coluna não existe.

### Critério de saída da Fase 8 — conferido em 18/10/2026

```bash
node tools/check-identidade.js          # 9 verificações ok (a 7.ª é a «Forma»)
node experimentos/provar-selo.js        # TUDO CERTO — 14 asserções
node experimentos/provar-selo.js --controle-negativo   # 5 reprovações na porta de HEAD
node experimentos/provar-ambiente.js    # TUDO CERTO — 16/16 nas duas escolas
node experimentos/provar-dobra-do-indice.js            # TUDO CERTO — 16/16
node experimentos/provar-celular.js     # 15/15
```

**Contraprova.** A «Forma» reprova se `.selo.vinculada` voltar à porta (conferido), e o
`provar-selo` serve a porta de `HEAD` e **reproduz as duas etiquetas divergentes** que o dono do
produto viu. Sem a contraprova, uma checagem nova é uma opinião.

**O que a Fase 8 não fecha.** A **raiz** (`danca`) não foi reimplantada — `raiz/assets/` está
atualizado no repositório e o Worker serve a cópia anterior. O `provar-ambiente` cobre fita e
valse; a raiz entra nele no dia em que for implantada.

## Registro de execução

| Data | Item | Evidência |
|---|---|---|
| 16/10/2026 | Diagnóstico e plano criados | `DIAGNOSTICO-IDENTIDADE.md`, `IMPLEMENTACAO-IDENTIDADE.md` |
| 16/10/2026 | Tokens de estado na fonte | `ciclo.css`: `--ok-fundo`, `--alerta-fundo`, `--falha-fundo`, `--derivada(-fundo)` |
| 16/10/2026 | 0.1–0.3 porta | 0 hex, 0 fallback, regra única de `.opcao.travada`, `.linha-acao` |
| 16/10/2026 | 0.4–0.5 raiz | coluna única a 900px; 0 hex; `rgba` de véu/sombra anotado para 2.3 |
| 16/10/2026 | 0.6 bastidores | `.corpo button`, `.escolhido`/`.escolhidos`, 0 hex (fora comentário) |
| 16/10/2026 | 0.7 ficha | 12 tokens canônicos; autoteste 42/42 |
| 16/10/2026 | 0.8 páginas de estado | `estado-html.js`; 4 páginas numa folha |
| 16/10/2026 | 0.9–0.10 congelados | `gerar-raiz.sh`, `check-identidade.js`, `pre-commit`; motivo no `REGISTRO.md` |
| 16/10/2026 | Cópias da Fita | `assets/style.css` + `<style>` da porta; gerador bloqueado por `DATA_INICIO` |
| 16/10/2026 | 1.1–1.2 componentes e escala | `ciclo.css` 286 → 520 linhas; `:where()` no piso |
| 16/10/2026 | 1.3 raiz | 300 → 162 linhas; `.topo-botoes` mantido; `cartao` com quebra |
| 16/10/2026 | 1.4 porta | 386 → 349; `.principal` → `.acao`; selos/`caixa`/controles globais |
| 16/10/2026 | 1.5 lançamento | 86 → 71; rótulos `em-linha`; `.vazio` preservado |
| 16/10/2026 | 1.6 bastidores | 159 → 68 regras; botões com `.acao`; rótulos `campo-rotulo` |
| 16/10/2026 | 1.7 marcadores | `data-tela` em raiz/porta/lançamento/bastidores/estado/ficha |
| 16/10/2026 | 1.8 navbar | `nav-html.js`; saída byte-idêntica à do pacote Fita |
| 16/10/2026 | 1.9 experimentos | nota datada no `experimentos/README.md` |
| 17/10/2026 | 2.1–2.3 papéis | `ciclo.css`: papéis + valores por tema; 0 primitivo nos consumidores |
| 17/10/2026 | 2.4 tema noturno | `[data-modo="noturna"]`; botão `◐`; `nav.js` + anti-flash |
| 17/10/2026 | 2.5 impressão | `@media print` repõe os papéis claros |
| 17/10/2026 | 2.6 validador | 31 pares × 2 temas; guard de primitivo nas superfícies |
| 17/10/2026 | 2.7 layouts | `data-layout="documento"\|"painel"` em todas as superfícies |
| 17/10/2026 | 2.8 catálogo | **não feito** — depende de C15 |
| 18/10/2026 | 2.8 destravado | **C15 decidida: a preferência é da escola**; mecanismo = servidor. Falta o trabalho (V1: especificar e medir as doze) |
| 17/10/2026 | 3.1 prova do tema | `provar-tema.js` 29/29; botão fora do `.nav-links` (defeito encontrado) |
| 17/10/2026 | 3.2 documentação | `README.md` (seção e atalhos) e `motor/servidor/README.md` |
| 17/10/2026 | 3.3 handoff | `tools/gerar-handoff.sh` |
| 17/10/2026 | 4.1 barra da escola nova | `criar-escola.sh` → `nav-html.js`; `valse` regenerada |
| 17/10/2026 | 4.3 porta no validador | checagem 6: corpo byte a byte + botão na barra |
| 17/10/2026 | 4.4 porta da Fita | 44 primitivos → 0; barra com o nome atual |
| 17/10/2026 | 4.5 prova do tema | 29 → 30; sem filtro vazio |

---

## Fase 4 — os artefatos gerados (17/10/2026)

Objetivo: a identidade que vale na **fonte** tinha de valer nos arquivos que o sistema
**serve**. A revisão foi feita sobre a escola criada naquele dia (`valse`), e encontrou o
padrão de falha que o diagnóstico descrevia: a fonte certa, a cópia errada, e o validador
sem olhar para ela.

| # | Item | Estado |
|---|---|---|
| 4.1 | `criar-escola.sh` deixa de ter cópia própria do esqueleto da barra | `[x]` 17/10 — `gerar_nav_zero` consome `nav-html.js --abertura/--fechamento` |
| 4.2 | A escola criada do zero passa a ter o botão `◐` | `[x]` 17/10 — `valse`, índice e porta |
| 4.3 | A porta de cada pacote é **conferida** contra `porta/` | `[x]` 17/10 — checagem 6 do validador |
| 4.4 | A porta da Fita volta a ser a de `porta/` (papéis, tema) | `[x]` 17/10 — 44 primitivos → **0** |
| 4.5 | A prova do tema deixa de pular página sem o botão | `[x]` 17/10 — `provar-tema.js` 29 → **30** |

### O que a revisão encontrou

**A barra tinha uma terceira cópia.** O `gerar-ciclo.sh` e o `bastidores.js` passaram a
consumir `nav-html.js`; o `criar-escola.sh` não. Uma escola criada em 17/10 nascia com a
folha nova, os papéis novos, o `data-layout` — e **nenhum jeito de escurecer**. Nenhuma
verificação notou: o `.tema` existia no CSS, o contraste estava medido, o `localStorage`
funcionava.

**A porta da Fita não escurecia.** `plano-observacao/index.html` é cópia de `porta/`, mas a
da Fita era de antes da Fase 2: `--papel: var(--cream)`, `--acento: var(--burgundy)`, 44
usos de primitivo e nenhum de papel. Como a variante noturna remapeia **só os papéis**,
aquela página ficava clara no meio do escuro. E a barra dela ainda dizia «Nós, Por Exemplo»
— o nome retirado da página de entrada em 16/10/2026.

**A prova do tema era vácua num caso.** A coleta das páginas geradas era
`if (html.includes('class="tema"')) geradas.push(...)`: uma página **sem** o botão não era
provada, em vez de reprovar. Passou a coletar todas e a exigir o botão em cada uma — são
30 asserções, e são elas que agora pegam uma escola nova sem a aparência.

### O que a Fase 4 **não** fecha

- **A barra da Fita continua mais velha que o gerador.** O ciclo dela tem `DOCS="plano"`,
  e o `gerar_nav` de hoje emitiria um grupo «Ciclos» que o pacote não tem. Regerar exige
  `DATA_INICIO`, que é lacuna declarada (`[Preencher: …]`) — o valor é do plano elicitado,
  não se inventa. O corpo da porta foi atualizado; a barra será refeita pelo gerador.
- **A `data-tela` é escrita e não lida.** Cinco superfícies a declaram; nenhuma regra de
  CSS a consome. É marcador para regras futuras — está registrado aqui para não virar
  surpresa. **Confirmado em 18/10:** as sete declarações existem (porta, raiz, lançamento,
  bastidores ×2, estado, ficha) e `grep` no `ciclo.css` e nas folhas de página não encontra
  nenhum seletor que a leia. Continua a ser promessa, não dívida.
- **A escala (F14) continua sem adoção.** `--esp-1..6` aparece 14 vezes, todas na fonte.
  **Nota 18/10:** deixou de ser verdade a meio. Medido hoje: **63 usos na fonte** e **32 nos
  consumidores** (porta 18, bastidores 14) — a porta e a Produção migraram com o trabalho dos
  componentes; **raiz, lançamento, ficha e páginas de estado continuam a escrever `rem`/`px` à
  mão**. O que falta é mecânico, e é nestas quatro que se mede.

---

## Fase 5 — a tela de celular (17/10/2026)

Objetivo: medir a **geometria**. O `check-identidade.js` mede cor; a `provar-tema.js`, o
comportamento; nenhuma das duas vê largura. E um sistema que se lê no telefone — a
professora abrindo a lista de turmas no meio da aula — precisa que a largura seja
critério, não sobra.

| # | Item | Estado |
|---|---|---|
| 5.1 | O nome da turma deixa de disputar espaço com os botões | `[x]` 17/10 — `flex-wrap` + `flex-basis: 14rem` |
| 5.2 | O seletor de termo e o botão «Associar» andam juntos | `[x]` 17/10 — `par-associar` |
| 5.3 | O corte de celular do painel é o mesmo do menu (768) | `[x]` 17/10 — era 760 |
| 5.4 | O menu de secções vira faixa no celular | `[x]` 17/10 — 248px → ~80px de altura |
| 5.5 | A escala de tela documentada, um valor por conceito | `[x]` 17/10 — `IDENTIDADE-VISUAL.md` |
| 5.6 | Prova de geometria em seis larguras | `[x]` 17/10 — `provar-celular.js`, 9/9. **Nota 18/10:** **15/15** — entraram a varredura das sete páginas servidas, o desenho de todo campo e a regra dos quatro lados do botão |

### O que a medida encontrou

| Largura | Antes | Depois |
|---:|---|---|
| 320px | nome **116px** × 130px de altura, botões 126px fixos na mesma linha | nome **255px** (linha inteira), botões descem |
| 360px | nome 156px × 130px | nome 295px |
| 390px | nome 186px × 86px | nome **325px** × 58px |
| 560px | nome 356px × 58px, botões na mesma linha | nome 360px, uma linha de texto |
| celular | menu de secções **248px** de altura antes do conteúdo | **80px**, em faixa |
| 761–768px | menu colapsado **e** painel de duas colunas | uma coluna |

O defeito tinha **duas** causas, e a segunda só apareceu ao medir:

1. `.acoes` é `flex: 0 0 auto` com botões `white-space: nowrap` — não encolhe. O nome, com
   `flex: 1 1 auto`, absorvia toda a compressão.
2. **A correção não pegava.** `.lista li .nome` (0,0,3) vencia `.linha-turma .nome` (0,0,2), e o
   `flex: 1 1 14rem` era ignorado em silêncio — o `flexBasis` medido continuava `auto`. O
   seletor descendente vazava para dentro da turma, onde o mesmo `.nome` é outro papel: ali ele
   precisa de largura para não quebrar em quatro linhas, e nas linhas simples encolhe até o
   reticências. Passou a `.lista > li > .nome`.

### Como foi provado — e o controle negativo

`provar-celular.js` extrai o `<style>` do próprio `motor/servidor/bastidores.js` (sem cópia) e
monta a página de prova com as formas de linha reais. Mede em 320, 360, 390, 414, 768 e 1024px.

**Controle negativo, feito com o CSS antigo em stash:** **4 das 8** provas falham — a altura do
menu, a coluna única em 768, o nome espremido e o botão separado do seletor. Com a correção,
9/9. Uma prova que passa nos dois estados não prova nada.

### O que a Fase 5 **não** fecha

- **A escala de espaço (F14) continua sem adoção.** `--esp-*` tem 14 usos, todos na fonte. Migrar
  os `padding` das quatro superfícies é trabalho mecânico e sem risco, mas ainda não foi feito —
  está aqui para não se perder. **Nota 18/10:** ver a correção na Fase 4; hoje são 32 usos fora
  da fonte, e a dívida está concentrada em **raiz, lançamento, ficha e páginas de estado**.
- **Não há prova de geometria para as larguras intermediárias** (1025–1199px, 1150–1200px). São
  as faixas onde o índice lateral entra e sai; hoje o `provar-celular.js` mede 1024 e para.
- **O `provar-celular.js` não está no `pre-commit`**, de propósito: um commit não pode depender de
  haver navegador na máquina. Ele é atalho do README, não trava.
| 17/10/2026 | 4.5 prova do tema | 29 → 30; sem filtro vazio |
| 17/10/2026 | 5.1–5.2 linha da turma | `flex-wrap` + `14rem`; `par-associar`; `.lista > li > .nome` |
| 17/10/2026 | 5.3–5.4 celular | corte 760 → 768; menu de secções em faixa (248 → 80px) |
| 17/10/2026 | 5.5–5.6 doc e prova | escala de tela no `IDENTIDADE-VISUAL.md`; `provar-celular.js` 9/9 |
| 18/10/2026 | 3.5 e 7.19 fechados | commits `f9b416b` e `ce874b9`; S5 provada (28/28) |
| 18/10/2026 | 8.1–8.7 a forma partilhada | `.solta` ≡ `.livre`; 0 redeclaração nas 4 superfícies com folha |
| 18/10/2026 | 8.8 checagem «Forma» | `check-identidade.js` → 9 verificações; reprova a porta de `HEAD` |
| 18/10/2026 | 8.9–8.10 provas | `provar-selo.js` 14 asserções; `provar-ambiente.js` 16/16 |
| 18/10/2026 | 8.11 dobra do índice | `provar-dobra-do-indice.js` 16/16; 66px × 562px |

## Fase 6 — o cabeçalho do ato: o que é campo e o que é inscrição (18/10/2026)

Objetivo: separar **natureza** de **desenho**. O relato do dono do produto foi de aparência
(«tá feio pra danar»), mas o diagnóstico mostrou outra coisa por baixo: a escola era um campo, e
não devia ser — ela não é escolha de ninguém.

| # | Item | Estado |
|---|---|---|
| 6.1 | A escola deixa de ser campo e passa a inscrição, nas três fontes | `[x]` 18/10 — `porta/index.html` |
| 6.2 | O valor da escola vem do **servidor** (`ESCOLA_SLUG`), não da URL | `[x]` 18/10 — `fixarEscola` + `dadosDosBastidores` |
| 6.3 | O valor é **reafirmado** contra a URL e contra envelope antigo | `[x]` 18/10 — `ESCOLA_CANONICA` |
| 6.4 | Prova em navegador, nas três fontes, com controle negativo | `[x]` 18/10 — `provar-escola-fixa.js`, 30/30; 0/30 em `HEAD` |
| 6.5 | O contrato «campo × inscrição» documentado | `[x]` 18/10 — `IDENTIDADE-VISUAL.md` |
| 6.6 | Quatro arranjos de cabeçalho para escolha | `[x]` 18/10 — **H2, cartão de identidade**, escolhido pelo dono do produto |
| 6.7 | O nome da escola no JSON é o do Worker (não o do cliente) | `[x]` 18/10 — `rotas.js` · `lancamento.js` · `cloudflare.js` |
| 6.8 | O ARRANJO do cabeçalho é o mesmo nos três documentos | `[x]` 18/10 — a turma deixa de ocupar a linha inteira |
| 6.9 | O cartão tem a mesma largura do texto da página | `[x]` 18/10 — `.faixa`, a caixa de `main` |
| 6.10 | Os textos que explicam a ferramenta saem do cabeçalho | `[x]` 18/10 — três frases, e uma lista na prova |
| 6.11 | Prova do arranjo, nos três documentos e em duas larguras | `[x]` 18/10 — `provar-cabecalho-do-ato.js`, 40/40 |
| 6.12 | A navegação da Produção no celular — quatro opções | `[x]` 18/10 — **N2, folha inferior**, escolhida pelo dono do produto |
| 6.13 | A folha inferior implementada e provada | `[x]` 18/10 — `provar-menu-da-producao.js`, 22/22 |

### O que a Fase 6 mediu

| Fonte | Campos do cabeçalho | A escola |
|---|---|---|
| anamnese | professor · ciclo · aluna · senha | inscrição |
| plano de ensino | professor · ciclo · turma observada · senha | inscrição |
| plano de observação | professor · ciclo · senha | inscrição |

**O defeito que motivou a fase, medido.** Com `?escola=OUTRA-ESCOLA` na URL, a página anterior
mostrava `OUTRA-ESCOLA` no campo e gravava a escola do Worker — a tela concordava com o que o
professor escreveu, e o dado ia para outra chave. Depois da correção, com a **mesma** URL, a
inscrição mostra `valse` e o envelope leva `valse`.

### O arranjo escolhido — H2, cartão de identidade

A escola ganhou **coluna própria**, sobre creme e separada por filete; o resto do contexto fica à
direita, com os controles **empilhados sob o rótulo**. O que se lê primeiro é de quem é o
documento; depois, o que se preenche. A escola também **saiu do acordeão** — a identidade da
página não se recolhe; o que se recolhe é o resto do contexto.

| Largura | Arranjo | Altura da barra |
|---:|---|---:|
| 1280px | cartão, coluna de 192px, quatro campos numa linha | 147px |
| 900px | idem | 147px |
| 768px | uma coluna: escola em faixa no topo | 191px |
| 390px | uma coluna, campos em 2×2, alvo de dedo inteiro | 279px |
| recolhido | só a escola e a linha do «Contexto do ato» | 79px |

### O arranjo tem de ser o MESMO nos três — e essa é a lição

O dono do produto abriu os três documentos e viu três coisas diferentes: na anamnese os campos
numa linha, no plano de ensino empilhados, no plano de observação empilhados e com texto a mais.
Uma única declaração explicava tudo:

```css
.ctx-turma { flex: 1 1 100%; }   /* a turma ocupa a linha inteira */
```

Só os dois documentos que **têm** turma quebravam a linha. O CSS fazia o que lhe mandaram;
ninguém tinha dito que os três deviam ficar iguais — e o desenho do estudo H2 foi aprovado com
a anamnese na mão.

| Documento | Antes | Depois |
|---|---|---|
| anamnese | 4 colunas, 1 linha | 4 colunas, 1 linha |
| plano de ensino | 3 colunas, **2 linhas** | 4 colunas, 1 linha |
| plano de observação | 3 colunas, **2 linhas** + 2 frases | 3 colunas, 1 linha, sem frases |

E a largura: o cartão tinha 1180px onde o texto tinha 1132 — 48px a mais, o bastante para o
olho estranhar. Agora o cartão herda a caixa da página (`.faixa`, com os mesmos 900/1180 e os
mesmos 24px de padding de `header.doc, main`).

**A prova.** `experimentos/provar-cabecalho-do-ato.js` — **40/40**, e **26/40** no controle
negativo contra a porta de `HEAD`. Ela mede o arranjo, não o retrato: a caixa do cartão contra a
do texto, o topo dos campos (todos na mesma linha, ±4px), os rótulos na ordem de cada documento,
o tipo de cada controle (campo × inscrição), e uma lista de frases que não podem voltar.

> **A lição, escrita para não se repetir.** Um valor que descreve o sistema em *dois* lugares é
> a mesma armadilha do `--gold-borda` em dois fundos e do corte 760 × 768: a diferença só
> aparece quando alguém olha os dois lado a lado. Quando a regra é «os três são iguais», ela
> precisa de uma prova que abra os três.

### O que a Fase 6 encontrou no servidor — e corrigiu

O dono do produto levantou a pergunta certa: *«nos arquivos de chave-valor eu preciso ter qual é a
escola; não posso inferir isso do diretório»*. Investigando, o nome **estava** no JSON — mas vinha
do **cliente**. Com `?escola=outra`:

| O que dependia do `contexto.escola` | Antes | Depois |
|---|---|---|
| `contexto.escola` no envelope | `outra` | `ESCOLA_SLUG` |
| chave do cofre | `outra/<prof>/…` | `ESCOLA_SLUG/<prof>/…` |
| caminho da fonte no repo | `ciclo-01-outra-po.md` | `ciclo-01-<slug>-po.md` |
| chave do lançamento | `outra/<prof>/…` | `ESCOLA_SLUG/<prof>/…` |

A correção **não remove o campo** — era o risco de «resolver» isto tirando o nome do documento. Ela
subordina o valor ao Worker, que já era a autoridade em `escolaDe()`. Prova:
`experimentos/provar-escola-do-documento.js` — **10/10** com a correção, **4/10** contra o
`motor/` de `HEAD` (o controle negativo extrai o código antigo com `git archive`, não uma cópia
editada à mão).

### A navegação da Produção no celular — N2, folha inferior

Quatro protótipos clicáveis foram medidos no estudo; a escolha foi a folha inferior.

| Opção | Altura em repouso | Por que não |
|---|---:|---|
| N1 abas de grupo + lista | 98–174px | a lista fica sempre à vista, e o grupo maior ocupa mais que a fita de hoje |
| **N2 folha inferior** | **53px** | **escolhida** |
| N3 faixa rolável (iFood) | 64px | não economiza altura; o que está fora da tela não se anuncia |
| N4 seletor + passos | 51px | o destino deixa de estar à vista |

**O que mudou no `bastidores.js`.** A `.lateral-lista` deixou de ser uma coluna no celular e
passou a ser a própria folha (`position: fixed`, `translateY(101%)`), com um véu atrás. A barra
mostra o **grupo e a página** — «PEDAGOGIA · Curadorias», porque «Curadorias» sozinho não diz de
onde é. O grupo é lido do próprio HTML (o `<h2>` que precede o link), não de uma segunda lista
no JavaScript: uma cópia divergiria no dia em que um grupo mudasse.

**Três detalhes que só apareceram ao medir:**

1. a barra nasceu em **duas linhas** (grupo em cima, página embaixo), e o `align-items: center`
   punha o botão «Seções» entre as duas — lia-se como três coisas soltas. Uma linha resolveu;
2. o `body` fica com `overflow: hidden` enquanto a folha está aberta — e o `resize` para tela
   larga tem de o **devolver**, senão a página fica travada sem nada aberto;
3. `document.querySelector` **faltava nos dois DOM de mentira** de `provar-producao.js`. O script
   só passou a usá-lo agora, e os dois shims quebraram — um DOM falso que não tem o método que o
   script chama não está a testar o script.

**O que ainda não está fechado.**

- **O índice de escolas para o cruzamento da proveniência** é o próximo pedido declarado pelo dono
  do produto, e não foi feito: hoje a lista de escolas sai da árvore do repositório
  (`repo-escola.js`, `wrangler.<slug>.jsonc`), não de um índice gravado por escola. O
  `escola/<slug>/indice.json` já existe — é dele que sai o nome de exibição do professor — e é o
  ponto de partida natural.
- **A contagem de contadores não foi tocada** — eles continuam na linha do topo do cartão.

---

## Fase 7 — as listas e o cartão da turma (18/10/2026)

Objetivo: dar **uma regra de composição** às listas do Produção, em vez de remendar caso a caso.
O relato do dono do produto veio em três pedidos separados — o vocabulário oscilava de altura, a
curadoria devia seguir o mesmo, e em professores o «dono — criado na página» vinha com o `slug` ao
lado — mas eram o mesmo defeito: **o complemento morava ao lado do nome**, e era o comprimento do
nome que decidia onde ele caía.

| # | Item | Estado |
|---|---|---|
| 7.1 | A regra das duas linhas: nome (com selos) em cima, complemento embaixo, sem terceira linha | `[x]` 18/10 — `.lista > li > .nome` em `flex` |
| 7.2 | O vocabulário tem um complemento só (`categoria · tradição`), não dois | `[x]` 18/10 — medido: 5 linhas, todas 63px |
| 7.3 | A curadoria segue a mesma regra; a modalidade desce para a segunda linha | `[x]` 18/10 — medido: 2 linhas, 67px |
| 7.4 | «dono — criado na página» passa a «principal», e o `slug` sai da lista | `[x]` 18/10 — `bastidores.js` |
| 7.5 | As demais listas falam a mesma língua (nomes em `<b>`, como o principal) | `[x]` 18/10 — professor e aluna |
| 7.6 | O **cartão da turma** — três propostas (gaveta, escala, três números) e o **híbrido** | `[x]` 18/10 — **T4, híbrido**, escolhido pelo dono do produto |
| 7.7 | O híbrido implementado em produção | `[x]` 18/10 — `bastidores.js`, três métricas e três painéis |
| 7.8 | Prova do cartão, em seis larguras e com controle negativo | `[x]` 18/10 — `provar-cartao-da-turma.js`, 52/52; 27 falhas em `HEAD` |
| 7.9 | A associação sai do cartão e desce para o **formulário**, abaixo da duração | `[x]` 18/10 — o painel passou a MOSTRAR; compor é do formulário |
| 7.10 | O bloco do formulário: chips com «×», seletor e «Associar» | `[x]` 18/10 — travado em «cadastrar» e em «derivar», ligado em «editar» |
| 7.11 | Prova da mudança de lugar, nos dois sentidos | `[x]` 18/10 — `provar-cartao-da-turma.js`, 65/65; 17 falhas em `HEAD` |
| 7.12 | A associação sai do CADASTRO: a turma passa a ser três **passos** | `[x]` 18/10 — `<ol aria-current="step">`: Turma → Rubricas → Associar |
| 7.13 | O passo e a turma escolhida são lembrados (`sessionStorage`) | `[x]` 18/10 — associar recarrega, e sem memória voltava-se ao passo 1 |
| 7.14 | Desassociar a **rubrica** com o mesmo nome do outro lado | `[x]` 18/10 — «Associar rubrica» / «Desassociar rubrica» |
| 7.15 | Listas de rubricas e de vínculos na regra das duas linhas | `[x]` 18/10 — e o vínculo mostra a contagem de conteúdos |
| 7.16 | Os «!» de etapa no cartão da turma, âmbar, com atalho | `[x]` 18/10 — um por passo, `title` a dizer o que ali se edita |
| 7.17 | O selo da curadoria ao lado do nome, não na margem direita | `[x]` 18/10 — `flex: 0 1 auto` no nome |
| 7.18 | A regra das duas linhas, provada em cinco larguras | `[x]` 18/10 — `provar-linhas-da-lista.js`, 115; 24 falhas em `HEAD` |
| 7.19 | Onde fica a barra de sessão quando a página rola — cinco propostas | `[x]` 18/10 — **S5**, escolhida pelo dono do produto: o caminho sobe para a barra do sistema e o `☰` não anda. Provada em `provar-sessao-na-barra.js` (28/28), e o `nav-html.js` ganhou `extras` para isso — sem `extras`, a saída é byte a byte a de antes |

### A associação mudou de lugar (18/10/2026)

Depois de ver o híbrido funcionando, o dono do produto decidiu que **associar e desassociar não
pertencem ao cartão**: o painel dos conteúdos passou a **mostrar** quais são, e compor desceu para
o **formulário da turma, logo abaixo da duração da aula** — «depois que eu determinar a duração de
cada aula, eu vou poder associar qual é o conteúdo da aula que eu pretendo usar».

O bloco tem três estados, e os três são decididos por **o que a turma é**, não por uma bandeira à
parte:

| Modo | Estado | Por quê |
|---|---|---|
| cadastrar | travado — «grave a turma para poder associar» | a associação precisa de um `id`, e a turma ainda não tem |
| editar | ligado, apontado à turma aberta | a turma existe, e é o cadastro dela que se está a corrigir |
| derivar | travado — «a derivada herda estes conteúdos» | o `id` à mão é o da turma ANTIGA; e a derivação já **copia** os conteúdos (o servidor faz isso desde 16/10) |

**O markup do chip é escrito uma vez.** Os chips com «×» de cada turma ficam em blocos ocultos
(`.conteudos-da-turma`) ao pé da lista, e o formulário **clona** o da turma aberta. A alternativa —
gerar os chips outra vez em JavaScript — seria a segunda versão do mesmo desenho, e a primeira a
divergir.

### A regra das duas linhas quebrou duas vezes, e a segunda ensinou o mecanismo

**A primeira vez** foi `display: block` no complemento: resolveu o vocabulário e criou uma terceira
linha na curadoria, porque o selo descia sozinho (93px contra 63px).

**A segunda vez** foi `flex` + `wrap`. Parecia resolvido, e a 390px voltou a oscilar: com o nome e o
selo a não caberem juntos, o selo DESCE para uma linha própria em vez de o nome encolher — num
contentor flex que quebra, os itens são distribuídos por linhas **antes** de qualquer encolhimento,
e um item sozinho na sua linha nunca encolhe. Medido: **96px** («Balé nível 1, Grade 1» + «Régua do
Nível 1») contra os **65px** dos outros.

A regra passou a ter três peças, e a primeira é a que faz as outras duas valerem:

```css
.lista > li > .nome:not(.fixo)          { display: block; }
.lista > li > .nome:not(.fixo) > .linha1{ display: flex; gap: .4rem; overflow: hidden; }
.lista > li > .nome:not(.fixo) > .linha1 > b     { flex: 0 1 auto; min-width: 0;
                                                   white-space: nowrap; text-overflow: ellipsis; }
.lista > li > .nome:not(.fixo) > .linha1 > .selo { flex: 0 0 auto; }
.lista > li > .nome:not(.fixo) > .dono  { display: block; white-space: nowrap; text-overflow: ellipsis; }
```

O grupo `.linha1` **não quebra**: quem cede é o nome. Duas linhas, sempre — do telefone à tela cheia.
E `flex: 0 1 auto` no nome, em vez de `flex-grow: 1`, é o que impede o selo de ser empurrado para a
margem direita, onde parecia um botão quebrado.

> **A lição.** A prova nova mede o **mecanismo** (o grupo existe?), e não só o resultado (as alturas
> são iguais?). Uma lista sem o grupo pode passar com os dados de hoje e falhar com os de amanhã —
> e foi assim, duas vezes, que esta regra voltou.

### A regra, e por que ela é `flex` e não `block`

A primeira tentativa foi `display: block` no complemento. Resolveu o vocabulário e **criou uma
terceira linha** na curadoria: o selo (`LIVRE`) descia sozinho entre o nome e o complemento —
**93px** contra os **63px** das outras listas. O que faltava era o nome e os selos caberem
**juntos** na primeira linha:

```css
.lista > li > .nome:not(.fixo){display:flex;flex-wrap:wrap;align-items:baseline;gap:.1rem .4rem;}
.lista > li > .nome:not(.fixo) > b{flex:1 1 auto;min-width:0;white-space:nowrap;text-overflow:ellipsis;}
.lista > li > .nome:not(.fixo) > .selo{flex:0 0 auto;}
.lista > li > .nome:not(.fixo) > .dono{flex:0 0 100%;white-space:nowrap;text-overflow:ellipsis;}
```

Quem cede espaço é o **nome** (reticências), os selos não cedem, e o `100%` é o que **força** a
segunda linha. Nada quebra: encurta. Duas linhas é o teto em qualquer largura.

| Lista | Antes | Depois |
|---|---|---|
| vocabulário | 63px e 41px alternados, conforme o nome | 63px em todas, a 1440px e a 390px |
| curadoria | 93px (três linhas: nome · selo · complemento) | 67px, duas linhas |
| professores | nome + «(dono — criado na página)» + `slug` | nome em cima, «principal» embaixo |

> **A armadilha, que custou duas medições.** `:not(.fixo)` não é decoração: o `.nome` de uma linha
> é ao mesmo tempo «o nome que encolhe até as reticências» e «o nome que precisa de largura para
> não quebrar». São dois papéis, e continuam a ser duas regras. E `.lista li .nome` (0,0,3) vence
> `.linha-turma .nome` (0,0,2) sem aviso — a especificidade não perdoa.

### O cartão da turma — três propostas, uma decisão em aberto

Uma turma carrega **nove faixas** de informação, todas abertas ao mesmo tempo, em cada turma. As
três propostas aceitam o mesmo conteúdo e diferem numa decisão só: **o que fica à vista sem um
toque**. Estão em `experimentos/opcoes-visuais/index.html`, cada uma na largura da tela e dentro
do telefone, na pele já adotada (E, HarmonyOS).

| Opção | À vista sem tocar | Toques | O que custa |
|---|---|---|---|
| **T1 · Gaveta** | nome, estado, três contagens | 1 + 1 | esconde a régua e os conteúdos (`<details>` nativo) |
| **T2 · Escala** | **tudo**; a régua vira uma barra de 4 degraus | 1 | mais alta por turma; a barra colore muito |
| **T3 · Três números** | nome, estado, três números | 1 + 1 | depende de um balão, que não existe no resto do sistema |
| **T4 · Híbrido** | nome, estado, três números | 1 + 1 | o painel da T3 com a riqueza da T2 — e **reaproveita** a escala e os chips dela |

**Sobre o balão da T3, e é o que decide.** O dono do produto sugeriu os «izinhos» com tooltip e
levantou o problema certo sozinho: *«no celular o dedo atrapalha»*. Não existe hover no telefone.
Um balão que abre ao toque precisa de (a) alvo maior que o desenho, (b) abrir **ancorado sob o
ícone** e não debaixo do dedo, (c) fechar com o mesmo toque, e (d) um só aberto por vez. O
protótipo faz as quatro — e continua a ser a proposta mais arriscada das três, porque introduz um
componente que o sistema não tem.

**Conferido depois da mudança.** `provar-producao` 109/109 · `provar-menu-da-producao` 22/22 ·
`provar-celular` 15/15 · `provar-tema` 30/30 · `check-identidade` 8/8.

### O híbrido, implementado (18/10/2026)

O dono do produto escolheu o T4 e apontou uma falta no protótipo: no telefone, o painel dos
conteúdos trazia os chips mas **não** o seletor de associação — «eu não tenho como associar».
Faltava no exemplo, e passou a faltar em produção se eu o tivesse copiado: **associar e
desassociar têm de estar nos dois tamanhos**, e é por isso que o seletor, o botão «Associar» e o
«×» de cada chip vivem no mesmo painel, em qualquer largura. A prova mede isso em 390px.

| # | O que o painel mostra |
|---|---|
| Ritmo | quatro pares rótulo/valor (frequência, dias e horário, duração, período) — ou, quando falta, a frase e a lista do que falta |
| Régua | a escala com a cor de cada degrau, mapeada pelo NOME do nível |
| Conteúdos | os chips com «×», e o seletor com o botão «Associar» |

**O híbrido (T4), e o que ele obrigou a mudar.** O dono do produto gostou da riqueza da T2 (a
escala com cores, os chips) e da economia da T3, mas recusou o painel da T3: «abre um texto duro».
A T4 é a T3 com o painel da T2 lá dentro — e para isso a **escala** e o **chip** deixaram de ser
peças da T2 e passaram a ser **componentes partilhados** (`[data-card] .escala` / `.chip`). Se o
híbrido trouxesse a sua própria cópia, a mesma régua teria duas cores no dia em que uma fosse
corrigida. Foi o mesmo raciocínio que fez o `<details>` da T1 ser nativo: um componente a mais é
uma coisa a mais para manter em dois lugares.

E a célula passou a dizer que está aberta (`data-aberto="sim"`): sem isso o painel aparece abaixo
da fila de números e não se sabe de onde veio.
