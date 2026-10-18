# Diagnóstico da identidade visual — 16/10/2026

> **O que este documento é.** A leitura do estado **de fato** da identidade visual do
> Sistema Lastro: onde a folha única é respeitada, onde ela é contornada, e o que impede
> que trocar de paleta ou de layout seja uma operação segura. Ele **não** substitui
> `IDENTIDADE-VISUAL.md` — aquele é o **contrato** (tokens, papéis, piso de contraste);
> este é a **medição** do que o sistema faz com o contrato.
>
> **O que este documento não é.** Não é planejamento de framework. A análise é de CSS e de
> arquitetura de folha de estilo. O stack de renderização — `pandoc` + `ciclo.html`, o
> Worker que monta HTML, o renderizador puro da ficha e o LaTeX — **não está em questão
> aqui** e não é alterado por nenhuma das fases propostas.

## Como foi medido

Tudo o que este documento afirma foi lido do repositório em 16/10/2026, com contagens
repetíveis: `grep` de hex, de `style="`, de `var(--…)`, de `@media`, comparação por
`md5sum` das cópias de folha, e cálculo de contraste WCAG 2.1 sobre os valores que o
validador atual não alcança. Onde o número é uma contagem, ele pode ser refeito; onde é
uma leitura de intenção (um comentário que diz uma coisa e uma regra que faz outra), o
trecho é citado.

---

## Veredito

A base conceitual é boa: há fonte de verdade declarada, contraste medido e circuito de
cópia para os pacotes de escola. O que falta é a camada que faz a identidade valer para
**todo** o sistema — porque hoje o contrato vale para `tools/templates/ciclo.css`, e cada
superfície voltou a escrever a sua própria camada de componentes.

| Métrica | Hoje |
|---|---:|
| CSS compartilhado (`ciclo.css`) | **286 linhas** |
| CSS local em `<style>` das páginas e do motor | **~1.090 linhas** |
| Tratamentos distintos de botão | **4** |
| Tratamentos distintos de selo/pastilha | **3** |
| Superfícies de campo (`--cream` × `--branco`) | **2** |
| Cores fora da fonte (fora comentários) | **~40** |
| `style="…"` inline no código-fonte | **10** |
| Pilhas tipográficas | **4–5** |
| Breakpoints numéricos | **5** (1200, 1140, 1024, 768, 760) |

Em uma frase: **há um design system declarado, mas não há uma camada de componentes
compartilhada; cada página implementa a sua.**

---

## O que já está certo

1. **Fonte única real.** `tools/templates/ciclo.css` declara a paleta em `:root`; o corpo
   tem **zero hex** e **66 usos de `var(--…)`** em 19 tokens.
2. **Ponte para quem não é CSS.** `tools/lib-tokens.js` leva os tokens ao LaTeX, à animação
   e ao slide.
3. **Contraste medido.** `tools/check-identidade.js` mede 21 pares WCAG AA.
4. **Circuito dos pacotes de escola funciona** — `assets/style.css` e `assets/nav.js` são
   comparados byte a byte com a fonte.
5. **O template canônico é limpo.** `tools/templates/ciclo.html` não tem `style=""`.
6. **A porta é o melhor exemplo de consumo** — cria aliases locais sobre os tokens
   (`--papel`, `--borda`, `--suave`, `--acento`), não uma paleta nova.
7. **Navegação e comportamento compartilhados** (`assets/nav.js`).
8. **Preocupações corretas já presentes:** foco, hover, `disabled`, contraste, `print`,
   `prefers-reduced-motion`.

---

## O mapa real: quem consome o quê

| Superfície | Como é servida | De onde vem o CSS | Estado |
|---|---|---|---|
| Documentos do ciclo (`index.html`, aulas, guias) | Pandoc + `ciclo.html` | `assets/style.css` (cópia gerada) | ✅ canônico |
| Área do Professor — anamnese, plano, PO | `porta/index.html` | `/assets/style.css` + **390 linhas locais** | ⚠️ token-aware, com hardcodes |
| Lançamento de aula | `tools/templates/lancamento.html` | `/assets/style.css` + **88 linhas locais** | ⚠️ duplica componentes |
| Bastidores — Estúdio e Produção | `motor/servidor/bastidores.js` | `/assets/style.css` + **159 linhas em string JS** | ❌ quarta paleta, colisões |
| Ficha e plano impressos | `motor/nucleo/ficha-html.js` | `<style>` próprio, **8 tokens próprios** | ❌ segunda identidade |
| Raiz (`raiz/index.html`) | worker `danca` | `raiz/assets/style.css` + **350 linhas locais** | ⚠️ cópia manual sem guarda |
| Estados (desabilitada, erro, deploy) | `producao.js`, `cloudflare.js`, `provisionar-escola.js` | `<style>` inline | ❌ paleta castanha legada |
| PDF do ciclo | LaTeX | tokens injetados via `lib-tokens.js` | ✅ canônico |
| Deck Marp | `apresentacao-ballet.md` | declara 7 tokens; o validador confere | ✅ canônico |
| Experimentos | `experimentos/**` | cópias antigas | ⚪ fora de escopo, mas enganam |

---

## Achados

### 🔴 Críticos — bloqueiam trocar layout ou tema com segurança

**F1. Não existe camada de componentes.**
O `ciclo.css` define barra, cabeçalho, grade, tabela, citação, índice e rodapé. **Não
define botão, campo, selo, cartão, modal nem mensagem de resultado.** Os quatro
tratamentos de botão vivem nas páginas:

- `.acao` (raiz): fundo bordô, texto ouro — `raiz/index.html:370`;
- `button` (porta e lançamento): fundo branco, texto bordô, inverte no hover —
  `porta/index.html:161` e `tools/templates/lancamento.html:74`;
- `button` (bastidores): fundo bordô, texto branco —
  `motor/servidor/bastidores.js:1040`.

Trocar a paleta re-veste os documentos; **não re-veste o sistema.**

**F2. `raiz/assets/style.css` é cópia manual, sem gerador e sem validador.**
`tools/gerar-raiz.sh` regenera **só o corpo** entre `<div class="conteudo">` e o primeiro
`<style>`; o casco, o CSS e o JS “não são tocados”. Nenhum `cp` copia `ciclo.css` para
`raiz/assets/style.css`. E `check-identidade.js` compara cópias apenas em
`professores/<p>/ciclos/…`. Hoje os `md5` coincidem; amanhã, ao mudar a paleta, ninguém é
avisado. É o modo de falha que o contrato diz ter eliminado.

**F3. A ficha tem segunda identidade.**
`motor/nucleo/ficha-html.js:18` declara:

| Token local | Valor | Valor canônico |
|---|---|---|
| `--tinta` | `#1c1a17` | `#1f1c1a` |
| `--papel` | `#faf7f2` | `#fbf8f3` |
| `--acento` | `#7a4b2a` | **não existe na identidade** |
| `--ok` | `#2f6b4f` | `#1d6b2f` |
| `--alerta` | `#9a5b1e` | `#8f5a12` |
| `--erro` | `#a33a2c` | `#9b1c1c` |

Além disso, `#5a5348` — que **é** o `--soft` canônico — está hardcoded nas linhas 70 e 74.
E o teste `motor/ficha-html-cli.js:133` **trava** a divergência ao exigir
`--papel: #faf7f2;`.

**F4. Quarta paleta nas páginas de estado.**
`producao.js:87`, `:112`, `:148`, `provisionar-escola.js:54` e `cloudflare.js:171`
repetem o mesmo bloco:

```css
color:#3a2b1f; background:#faf6ee; p{color:#6b5b4a;} a{color:#6b2f2f;}
```

São páginas que o usuário **vê** — “Escola desabilitada”, “Configuração incorreta”,
“implantação em andamento” — e que parecem de outro produto. O `#6b2f2f` é um
“quase-bordô” que não é o `--burgundy`.

### 🟠 Altos — divergência silenciosa e conflitos reais

**F5. Hardcodes e fallbacks velhos na porta.**
Em `porta/index.html`:

| Linha | Escrito | A fonte diz |
|---|---|---|
| 334 | `border: 1px solid #c9a24b` | `--gold-borda` é `#a08a58` |
| 335, 340, 365, 374 | `var(--tinta, #3a2b1f)` | `--tinta` é `#1f1c1a` |
| 339 | `#e0d3ae` / `#fffdf7` | não existem na identidade |
| 360 | `var(--gold-escuro, #c9a24b)` | `--gold-escuro` é `#8a6a3b` |
| 366 | `#2f6b3a` | `--ok` é `#1d6b2f` |
| 367 | `#8a5a12` | `--alerta` é `#8f5a12` |
| 368 | `#8f3f3f` | `--falha` é `#9b1c1c` |

O **fallback** é pior que o hardcode: se o token for renomeado, a página usa um valor
antigo **sem avisar**.

**F6. Contradição literal na mesma classe.**
`.opcao.travada` aparece duas vezes em `porta/index.html`:

- linha 145: `opacity: 1; color: var(--suave);` — o comentário diz “bloqueada, mas
  **LEGÍVEL** — o cinza é do texto, não da linha inteira”;
- linha 380: `opacity: .45; cursor: default;` — **e a segunda vence**.

**F7. Bastidores: quarta paleta, colisão e vazamento.**
- ~20 cores hardcoded (`#eef7ee`, `#4f8a4f`, `#2f5d2f`, `#fdeaea`, `#b25555`, `#7a2f2f`,
  `#fdf3d8`, `#7a5a12`, `#e0c98a`, `#eef3ec`, `#3d5a3d`, `#b8ccb6`, `#efe9f2`,
  `#5a3f66`, `#c9b8d2`, `#7d2b2b`, `#4b7a4b`, `#f4f8f2`…).
- `system-ui,sans-serif` escrito 15+ vezes em vez de `var(--ui)`.
- `.ficha` local (linha 1102) **colide** com `.ficha` global (pastilha do cabeçalho,
  `ciclo.css:154`); o global define `margin: 10px 0 0`, e o local não sobrescreve.
- `button { margin-top: .9rem; … }` (linha 1040) é seletor de elemento **sem escopo** e
  atinge o `<button class="hamburger">` da navbar.
- O arquivo tem 2.748 linhas misturando servidor, HTML, CSS e JS de cliente.

**F8. Raiz: repetição e bug de grade.**
- ~~`.form input` usa `background: var(--cream)`…~~ **Correção de 16/10/2026:** o campo em
  `--cream` dentro do cartão branco (`--branco`) é o **mesmo** padrão dos Bastidores — campo
  sobre superfície elevada. Não é divergência; a leitura anterior comparou-o com o campo sobre
  o papel, que é outro contexto. A identidade descreve `--branco` como superfície de campo
  porque o caso mais comum é o campo sobre o papel; dentro de um cartão, a relação se inverte.
- Três tratamentos de rótulo de campo: `--gold-texto` (raiz), `--burgundy` (bastidores),
  padrão (porta) — **este sim** é divergência, e fica para a Fase 1 (componente de campo).
- `#eef7ee` / `#fdeaea` hardcoded (linhas 516, 527, 547); `rgba()` sem token.
- **Bug de grade:** a raiz reusa `main` global, que a partir de 1200px vira grade
  `1fr 17rem`; como não há `.rail`, sobra uma coluna vazia de 17rem. Pior: o cabeçalho
  local usa `max-width: 1180px`, o texto fica em 900px e o rodapé volta a 900px — três
  alinhamentos na mesma página.

**F9. Os tokens são literais, não papéis.**
`--cream`, `--burgundy`, `--gold-claro` descrevem **valores**. Os componentes usam esses
nomes diretamente. Para 12 paletas, isso obriga a mentir: uma família “Verde de Ensaio”
não tem `--burgundy`; uma noturna não tem `--cream`. A porta já ensaia a solução
(`--papel`, `--borda`, `--suave`, `--acento`), mas **localmente**.

**F10. O validador tem pontos cegos — e a mensagem é mais ampla que a cobertura.**
`check-identidade.js` imprime “nenhum dos 21 hex da paleta fora de
`tools/templates/ciclo.css`”. Mas:

- a lista `CONSUMIDORES` não varre `porta/`, `raiz/`, `motor/` nem `ficha-html.js`;
- `#5a5348` (o `--soft` canônico) está em `ficha-html.js:70,74` e não é detectado;
- `compararPacotes()` não compara `raiz/assets/style.css`;
- o regex exige 6 dígitos, então `#fff` escapa;
- `lerTokens()` lê só o **primeiro** `:root`;
- mede pares declarados, não o **uso real**.

**F11. Contraste fora da paleta canônica.**

| Onde | Par | Razão | Piso |
|---|---|---|---:|
| Ficha — texto secundário | `#7d7365` / `#faf7f2` | **4,36:1** | 4,5 |
| Porta — borda de `textarea` | `#c9a24b` / `#ffffff` | **2,40:1** | 3,0 |
| Bastidores — `.aviso-derivar button` | `--gold-borda` / `--creme-2` | **2,85:1** | 3,0 |
| Porta — `.marco-linha` | `#e0d3ae` / `#fffdf7` | 1,46:1 | 3,0 |

O contrato já avisa que `--gold-borda` reprova sobre `--creme-2` (2,85:1); o uso em
`.aviso-derivar button` é exatamente esse caso.

### 🟡 Médios — manutenção, escala e processo

**F12. CSS inline:** 9 ocorrências em `porta/index.html` (oito `style="margin:.6rem 0 0"`
repetidos e um `grid-template-columns` dinâmico, este legítimo) e 1 em `bastidores.js`.

**F13. Cascata sem camadas.** O `ciclo.css` é carregado primeiro; o `<style>` da página
vem depois. Como as páginas usam seletores de elemento (`button`, `input`, `form`,
`table`, `body`), elas vencem por ordem e vazam para o que não deveriam.

**F14. Sem escala.** São **66** declarações de `padding` distintas, **8** raios
(3, 4, 5, 6, 8, 10, 999, 0) e **44** declarações de `font`/`font-size`.

**F15. Dívida de processo.**
- A navbar existe em dois lugares: `gerar_nav` (`tools/gerar-ciclo.sh:749`) e `topnav()`
  (`motor/servidor/bastidores.js:653`) — o segundo é um subconjunto fixo.
- `experimentos/receptor-local/bancada/assets/style.css` e
  `experimentos/pe/_assets-test/tools/templates/ciclo.css` são cópias antigas.
- Não há stylelint nem checagem de seletor duplicado / `style=""`.
- O `--gold-borda` tem falha documentada em `--creme-2`/`--creme-6`, mas não há guarda de
  **uso**: o par passa no validador e o componente reprova na tela.

---

## A escola Fita, em concreto

É a parte mais bem preservada do sistema:

- `professores/tiago-menegaz/ciclos/ciclo-01-fita/assets/style.css` — idêntico ao
  `ciclo.css`;
- `.../assets/nav.js` — idêntico a `tools/templates/nav.js`;
- `.../index.html` — gerado pelo Pandoc, **sem `style=""` e sem hex**;
- `.../plano-observacao/index.html` — idêntico a `porta/index.html`, exceto pela navbar
  injetada.

**O problema não está na Fita**; está nas fontes que vão gerar a próxima escola. Se você
regenerar a Fita hoje, ela herda o que está bom; se criar uma escola nova e o usuário cair
numa página de erro, ele vê a paleta castanha.

---

## Dark mode e múltiplos layouts: o que falta

Hoje **não há dark mode**: zero `prefers-color-scheme`, zero `[data-tema]`, zero
`color-scheme`. O `IDENTIDADE-VISUAL.md` registra a intenção (12 paletas, escolha
explícita), mas a estrutura atual não está pronta para recebê-la.

O que bloqueia:

1. **Tokens literais, não papéis.** Sem a camada semântica, a noturna teria de redefinir
   `--cream` para uma cor escura — o nome passa a mentir.
2. **~40 cores fora da fonte.** A noturna mudaria os documentos e a porta, mas a ficha, os
   bastidores, a raiz e as páginas de erro ficariam pela metade.
3. **Sem `color-scheme`.** Os controles nativos continuariam claros no tema escuro.
4. **Sem tokens de véu/sombra/fundo de estado.** Os `rgba()` da raiz e os
   `#eef7ee`/`#fdeaea` não acompanham.
5. **Impressão.** O `@media print` faz `background: var(--branco)` e
   `a { color: var(--tinta) }`; se esses tokens forem remapeados para a noturna, o papel
   imprime claro sobre claro. É preciso **forçar a paleta clara no print**.
6. **O validador mede só o primeiro `:root`.** Qualquer bloco `[data-paleta][data-modo]`
   futuro nasce sem medição.

O desenho recomendado, em camadas e sem framework:

```css
@layer tokens, base, layout, componentes, paginas, utilitarios;

:root { color-scheme: light; --fundo: …; --superficie: …; --texto: …; }
[data-modo="noturna"] { color-scheme: dark; … }
@media print { /* força os papéis claros, sempre */ }
```

Para layout: `data-layout="documento" | "painel"` no `<html>`, com regras por atributo.

**Consequência do stack atual.** Como o HTML é produzido por **quatro** caminhos
diferentes — Pandoc, concatenação de strings no Worker, `<style>` dentro de uma função
pura e um SPA de 6 mil linhas —, a camada de componentes **tem de ser CSS puro + um
contrato de classes**, sem build step. Um helper de markup pode existir, mas a verdade tem
de estar nas classes; senão um dos quatro caminhos fica de fora, que é exatamente o que
aconteceu.

---

## Estado após as Fases 0, 1 e 2 (16–17/10/2026)

A Fase 0 fechou o circuito. Onde havia cópia manual, agora há gerador e comparação; onde havia
paleta própria, agora há token declarado e conferido. A Fase 1 criou a camada de componentes: o
desenho de botão, campo, rótulo, selo, cartão, modal e mensagem de resultado existe **uma vez**,
no `ciclo.css`.

| Superfície | Antes | Depois |
|---|---|---|
| `porta/index.html` | 12 hex, 5 fallbacks, 9 `style=""` | **0 hex, 0 fallback, 1** (grade dinâmica) |
| `raiz/index.html` | 2 hex + 2 `rgba` de estado | **0 hex**; véu/sombra ficam para a Fase 2 |
| `raiz/assets/style.css` | cópia manual, sem validador | **cópia gerada e comparada** |
| `bastidores.js` | ~20 hex, `.ficha` em colisão, `button` sem escopo | **0 hex**, `.escolhido`, `.corpo button` |
| `ficha-html.js` | 8 tokens próprios, 12 hex | **12 tokens canônicos**, conferidos |
| páginas de estado | 3 paletas castanhas | **uma folha** (`estado-html.js`) |
| validador | não via `porta/`, `raiz/`, `motor/`, ficha | **vê**; `#fff` normalizado; avisa múltiplos `:root` |

### Correção de leitura — os artefatos servidos (17/10/2026)

A tabela acima mede a **fonte**. Uma revisão sobre a escola criada naquele dia (`valse`)
mostrou que os **arquivos gerados** ainda podiam divergir dela, e o validador não olhava
para eles:

| Artefato | Estado encontrado | Depois |
|---|---|---|
| `valse/index.html` e `valse/plano-observacao/` | folha e papéis novos, **sem** o botão `◐` | botão na barra |
| `fita/plano-observacao/index.html` | **44 primitivos, 0 papéis** — não escurecia; barra com o nome retirado («Nós, Por Exemplo») | corpo de `porta/`; 0 primitivos |
| `provar-tema.js` | `if (html.includes('class="tema"'))` — página sem botão **não era provada** | todas provadas; 29 → 30 |
| `check-identidade.js` (Circuito) | comparava só `assets/` | compara também a **porta** de cada pacote |

A causa da primeira linha: o `criar-escola.sh` tinha a **sua própria** cópia do esqueleto da
barra, e foi a única dos três emissores que não passou a consumir `nav-html.js`. É o mesmo
modo de falha que o F15 descreve — e ele reapareceu no script que o diagnóstico não listou.

### O que a Fase 1 mudou

| Superfície | CSS local antes | depois |
|---|---:|---:|
| `raiz/index.html` | 300 linhas | **162** |
| `porta/index.html` | 386 | **349** |
| `tools/templates/lancamento.html` | 86 | **71** |
| `motor/servidor/bastidores.js` | 159 regras | **68** |
| **total local** | **931** | **650** |
| `tools/templates/ciclo.css` (compartilhado) | 286 | **520** |

Um botão, um campo, um rótulo, um selo, um cartão, um modal e uma mensagem de resultado deixaram
de ser reescritos por página. O piso do componente usa `:where()` — especificidade zero —, então a
navbar, as abas e os botões-ícone não precisam de regras próprias para não herdar o preenchimento.
A barra de navegação passou a ter um único esqueleto (`tools/templates/nav-html.js`), consumido
pelo gerador dos pacotes e pelos Bastidores.

### O que a Fase 2 mudou

- **Papéis, além dos valores.** `--fundo`, `--superficie`, `--texto`, `--texto-suave`, `--borda`,
  `--borda-campo`, `--marca`, `--marca-texto`, `--marca-fundo`, `--sobre-marca`, `--campo-fundo`,
  `--foco`, `--veu`, `--sombra`. Nenhuma superfície de interface usa primitivo — e o validador
  reprova se voltar a usar.
- **Variante noturna** da identidade vigente (`[data-modo="noturna"]`), com **31 pares medidos em
  cada tema**, `color-scheme` e o botão `◐` na barra/raiz. A escolha fica no navegador — caminho
  **provisório**, porque C15 (de quem é a preferência) continua aberta.
- **Impressão sempre clara**, por `@media print`.
- **Layout por atributo**: `data-layout="documento"` × `"painel"`.

O que **não** mudou: o **catálogo** das seis famílias (doze combinações) e o seletor no painel
administrativo — dependem de C15 e de valores que ainda não foram especificados.

## A rodada de 18/10/2026 — a etiqueta, e o que ela revelou

**O que motivou.** O dono do produto apontou a mesma palavra em duas telas: «a etiqueta
*livre* está de um jeito nos Bastidores e de outro na anamnese». E fez a pergunta que
importa: *«não tem sentido eu testar se estou a testar uma coisa e no motor é outra»*.

**As duas perguntas eram a mesma.** O que se vê numa tela é o resultado de **três** origens:
a folha (`tools/templates/ciclo.css`), o `<style>` da página e os dados. Se qualquer uma
delas diverge, a tela diverge — e a divergência não avisa.

### O mapa: quem serve o quê, e onde a forma pode divergir

| Superfície | Como é servida | De onde vem a forma | Pode redeclarar? |
| --- | --- | --- | --- |
| Documentos do ciclo | pacote + `assets/style.css` | **a folha** | não |
| Bastidores — Estúdio e Produção | `motor/servidor/bastidores.js` | a folha + `<style>` da página | ajustes de página, **nunca** componente |
| Anamnese · plano de ensino · plano de observação | `porta/index.html` (3 rotas) | a folha + `<style>` da página | idem |
| Lançamento de aula | `tools/templates/lancamento.html` | a folha + `<style>` da página | idem |
| Raiz | `raiz/index.html` | `raiz/assets/style.css` (cópia) + página | idem |
| Ficha e plano impressos | `motor/nucleo/ficha-html.js` | `<style>` **próprio**, sem `<link>` | sim — com os **valores** da folha |
| Páginas de estado | `motor/servidor/estado-html.js` | `<style>` **próprio**, sem `<link>` | sim — com os **valores** da folha |

### Os achados, e o que ficou feito

| # | Achado | Como aparecia | Correção |
| --- | --- | --- | --- |
| 1 | `porta/index.html` redeclarava **quatro estados** de `.selo` | «vinculada» roxo inteiro nos Bastidores e roxo-com-bordô na anamnese; «livre» âmbar numa e cinza tracejada na outra | as quatro linhas saíram; o desenho é o da folha |
| 2 | `.selo.solta` e `.selo.livre` eram desenhos **diferentes** | a mesma palavra («livre») em duas cores, conforme a página | `.solta` passou a ser **alias** de `.livre` na fonte — a declaração já dizia que era |
| 3 | `.selo.sem-uso` existia **só** nos Bastidores | um estado que a fonte desconhecia (e que nenhum markup usava) | removido; quem precisar declara na fonte |
| 4 | `porta` declarava `--borda: var(--borda-campo)` | `--borda` **é** um papel da folha (o filete, em ouro escuro); todo componente vestido por ele saía com o filete de campo naquela tela | o alias tomou o nome de um papel: os 7 usos passaram a `--borda-campo`, e o alias saiu |
| 5 | `.aviso` redesenhado em `porta` | nota âmbar na anamnese, nota cinza nos documentos — a mesma classe | a folha já tem `.aviso` e `.aviso.alerta`; a página não inventa o tom |
| 6 | `.caixa.falta` duplicado em `porta` | cópia literal de duas regras da folha | removido; cópia que concorda hoje é a que diverge amanhã |
| 7 | `footer.rodape` no lançamento **não era** um rodapé | a mesma classe com dois desenhos | a barra de controles passou a chamar-se `barra-de-controle` |
| 8 | a ficha desenhava o cartão com `4px` e o código a branco com filete | o documento impresso lia-se como um objeto à parte | `--raio-3` declarado e usado; código e `pre` com os valores da folha |
| 9 | a página de estado desenhava o botão com `6px` e a caixa com `8px` | os únicos cantos do sistema com aquelas medidas | `--raio-2`/`--raio-3` declarados e usados; botão e `code` com as medidas da folha |

### O que impede a volta

- **`tools/check-identidade.js`, checagem «Forma»** — quem carrega a folha não redeclara
  componente, e todo estado de `.selo` usado existe na fonte. A lista de componentes é
  derivada da própria fonte. Controle negativo: reintroduzir `.selo.vinculada` em `porta`
  **reprova** (conferido).
- **`experimentos/provar-selo.js`** — renderiza as quatro superfícies que carregam a folha,
  injeta os 19 estados de selo e compara a assinatura **computada** (fundo, borda, cor,
  raio, tipo, peso, caixa, espaçamento, padding) em cada tema. Compara também botão, ação,
  campo, select, cartão, mensagem e aviso. E mede as que **declaram** (ficha e estado)
  contra a folha renderizada ao lado. `--controle-negativo` serve a porta de HEAD e
  **reproduz as duas etiquetas divergentes** que o dono do produto viu.
- **`experimentos/provar-ambiente.js`** — o que está **no ar** é o motor. Compara, em cada
  escola, o `style.css` e o `nav.js` servidos com a fonte (byte a byte), o `<style>` da
  porta nos três caminhos, e o `<style>` e o `<script>` da Produção com o que o motor
  produz agora (os dados embutidos neutralizados, porque são da escola e não do motor).

### O veredicto da pergunta «testei o motor?»

**Sim, depois desta rodada — e agora há prova, não confiança.** Antes do deploy, a mesma
prova acusou **10 divergências** nas duas escolas: o `style.css` no ar era o de antes, a
porta era a de antes, e o `<style>` da Produção era o de antes — ou seja, o que o dono do
produto estava a testar **não** era o motor. Depois do deploy das duas, as 16 verificações
passam nas duas escolas. Não era o ambiente que estava «descompensado»: era o **deploy**
que estava atrasado em relação ao repositório, e nada avisava.

### O que ficou ALÉM do que este diagnóstico propunha

O diagnóstico listou seis checagens e três fases. O que se fez depois foi mais longe em cinco
pontos, e vale registá-los como tal — não para inflacionar o resultado, mas porque cada um deles
nasceu de um defeito que **este documento não via**:

| # | O que o diagnóstico não previa | Por que foi preciso |
| --- | --- | --- |
| 1 | **Medir composição, não a existência de um seletor** | o critério de saída da Fase 1 era «nenhum `<style>` de página define selo», conferido por `grep` de `.selo {` — verdadeiro, e falso para `.selo.vinculada`, que era o defeito real. A 7.ª checagem lê o **alvo** de cada regra, e a lista de componentes é derivada da fonte |
| 2 | **Alias de página não pode tomar o nome de um papel** | `--borda: var(--borda-campo)` na porta sequestrava `--borda`, que **é** um papel da folha: todo componente vestido por ele saía com outro filete só naquela tela. Não é cor, é composição |
| 3 | **Um nome de estado, um desenho** | `.livre` e `.solta` são a mesma coisa (a entidade não entrou num plano / o envelope não foi ligado a um PO) e tinham dois desenhos. A fonte já os declarava «aliases do MESMO desenho»; o CSS é que não cumpria |
| 4 | **Provar o que está NO AR** | o diagnóstico compara fonte, cópia e artefato no repositório; nada nele pergunta se o Worker serve o que o repositório tem. Medido: **não servia** — `style.css`, porta e `<style>` da Produção estavam atrás nas duas escolas |
| 5 | **A navegação do documento no celular** | a Fase 5 mediu largura na vista de trabalho; o índice «Nesta página» — coluna congelada que abaixo de 1200px é um bloco no topo com 15–30 linhas — ficou de fora. Foi dobrado: 66px recolhido, 562px aberto |

**O padrão, e é o mesmo nas cinco.** O diagnóstico olhou para **valores** (hex, contraste, tokens)
e para a **existência** das peças; o que escapava era a **composição** — quem vence quem na
cascata — e a **distância entre o repositório e o que se serve**. Nenhuma das duas se vê numa
tabela de tokens.

### O que continua fora

- O **catálogo** das seis famílias e o seletor de aparência (C15 continua aberta).
- A **raiz** (`danca`) não foi reimplantada nesta rodada: `raiz/assets/style.css` está
  atualizado no repositório, e a cópia no ar continua a de antes até o deploy dela.
- `experimentos/**` — as páginas de estudo têm cópias antigas de componente e **não** são
  fonte de verdade; ficam fora do contrato por declaração.

## Conclusão

O projeto **não está longe**: já tem o mais difícil — a fonte declarada, o contraste
medido e o circuito dos pacotes. Falta a parte que faz a identidade valer para **todo** o
sistema:

1. **uma camada de componentes** compartilhada;
2. **o fechamento do circuito** para a raiz, a ficha e as páginas de estado;
3. **papéis semânticos** em vez de nomes literais;
4. **um validador que enxergue o que o sistema realmente serve**.

O plano de execução está em `IMPLEMENTACAO-IDENTIDADE.md`.
