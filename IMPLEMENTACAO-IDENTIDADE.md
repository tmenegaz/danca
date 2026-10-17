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
