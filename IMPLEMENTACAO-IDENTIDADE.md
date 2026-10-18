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
| 1.2 | Declarar a escala: espaço `4/8/12/16/24/32`, raio `4/6/8/999` | `[x]` 16/10 — `--esp-1..6`, `--raio-1..3`, `--raio-pilula` |
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
- `node tools/check-identidade.js` → 6 verificações ok.
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
| 2.4 | `[data-modo="noturna"]` + `color-scheme` + botão `◐` com `localStorage` | `[x]` 17/10 — decisão C15 continua aberta (provisório) |
| 2.5 | `@media print` força os papéis claros | `[x]` 17/10 — `!important`, explícito |
| 2.6 | Validador mede **todos** os temas e o uso de papel | `[x]` 17/10 — 31 pares × 2 temas; guard de primitivo |
| 2.7 | Layouts: `data-layout="documento" \| "painel"` | `[x]` 17/10 |
| 2.8 | Seletor de aparência — **catálogo** das 12 paletas | `[ ]` depende de **C15** (a preferência é de quem) |

### O que a Fase 2 fez, e o que ela **não** fez

**Fez:** a camada de papéis (o componente deixa de conhecer `--cream`/`--burgundy`); a variante
noturna da identidade vigente, com todos os pares medidos; o botão de tema, explícito, com a
escolha no navegador; a impressão sempre clara; o `data-layout`; e dois guards novos no validador —
**tema não medido não passa**, e **primitivo em consumidor não passa**.

**Não fez:** o **catálogo** das seis famílias (as doze combinações), o item de menu «Identidade
visual» e a escolha por escola/usuário. Nada disso foi inventado: os valores das outras famílias
continuam **não especificados**, e a decisão **C15** continua aberta. A gravação no navegador é
provisória e está declarada como tal no `IDENTIDADE-VISUAL.md`.

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
| 3.4 | Conferência **visual** no navegador (clara e noturna) | `[ ]` — exige olho humano |
| 3.5 | Commit próprio das mudanças em `tools/` (congelados) | `[ ]` — só com pedido explícito |

### O que a prova do tema encontrou

A primeira versão do esqueleto da navbar emitia o botão `◐` **dentro** do `.nav-links` — o painel
que colapsa no celular. Com o menu fechado, o botão ficaria **inalcançável**, e nenhuma das
verificações anteriores notava: o contraste estava certo, o HTML estava «válido», e o botão
existia. A prova passou a medir a **faixa** do `.nav-links` (com profundidade de `<div>`) e a
exigir o botão **fora** dela — nas páginas geradas também, não só no esqueleto.

É o tipo de defeito que só aparece no aparelho de quem usa: no desktop o painel está sempre
aberto, e o botão parece certo.

### O que a Fase 3 **não** fecha

- **O catálogo das doze paletas (2.8)** continua em aberto — depende da decisão **C15**.
- **A conferência visual** é do dono do produto; a prova cobre contraste, papel e comportamento,
  não o gosto.
- **O commit** é uma decisão à parte: `tools/` é congelado e exige commit próprio com o motivo
  declarado, já escrito no `REGISTRO.md`.

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
  surpresa.
- **A escala (F14) continua sem adoção.** `--esp-1..6` aparece 14 vezes, todas na fonte.

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
| 5.6 | Prova de geometria em seis larguras | `[x]` 17/10 — `provar-celular.js`, 9/9 |

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
  está aqui para não se perder.
- **Não há prova de geometria para as larguras intermediárias** (1025–1199px, 1150–1200px). São
  as faixas onde o índice lateral entra e sai; hoje o `provar-celular.js` mede 1024 e para.
- **O `provar-celular.js` não está no `pre-commit`**, de propósito: um commit não pode depender de
  haver navegador na máquina. Ele é atalho do README, não trava.
| 17/10/2026 | 4.5 prova do tema | 29 → 30; sem filtro vazio |
| 17/10/2026 | 5.1–5.2 linha da turma | `flex-wrap` + `14rem`; `par-associar`; `.lista > li > .nome` |
| 17/10/2026 | 5.3–5.4 celular | corte 760 → 768; menu de secções em faixa (248 → 80px) |
| 17/10/2026 | 5.5–5.6 doc e prova | escala de tela no `IDENTIDADE-VISUAL.md`; `provar-celular.js` 9/9 |

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
