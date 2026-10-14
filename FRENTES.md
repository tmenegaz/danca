# Frentes em aberto — Projeto Ciclo

> **Data:** 13/10/2026 · **Natureza:** panorama consolidado das frentes (não é implementação).
> **Origem:** transcrição do laudo do Bloco 1 (Produção, curadoria e integração dos três
> formulários) e do panorama de três trilhos. Este arquivo é a **fonte versionada** do estado de
> hoje; ele não reescreve decisões anteriores — acrescenta o estado atual, como elo novo.

---

## 1. O que foi concluído recentemente (e estava disperso)

| Item | Estado | Onde |
|:--|:--|:--|
| Barra criada de ponta a ponta | ✅ | `tools/criar-escola.sh` → Worker `barra` (professor Letícia), aluna Vavá |
| Bloco 2 (anamnese) — «não foi medido» transversal | ✅ | `porta/index.html` + `porta/conteudo/anamnese.json` + `motor/nucleo/ficha.js` |
| Nó 50 (`matriz-metodologica-de-origem`) | ✅ decidido: **não semeia** o plano | sujeito aluna ≠ sujeito professor |
| Categoria etária re-derivada da idade + memória por escola/professor/ciclo | ✅ | `porta/index.html` |
| Senha por professor (não da escola) | ✅ | `motor/servidor/bastidores.js` |
| Bloco 3 (plano) — cadastro de turmas + vocabulário + relação turma↔termo | ✅ (sob revisão — ver B3) | `motor/servidor/bastidores.js` + `catalogo-seed.js` |
| Correções da Produção — menu lateral + secções, sessão persistente, labels | ✅ | `motor/servidor/bastidores.js` |
| Laudo do Bloco 1 (Produção/curadoria/integração, 7 achados) | ✅ | transcrito na §2 abaixo |

---

## 2. O laudo do Bloco 1 — os 7 achados medidos

> O pedido «Produção, curadoria e integração dos formulários» manda o Bloco 1 ser **investigação
> primeiro** — medir e reportar, antes de tocar em código. Cada achado traz o que foi medido, o
> caminho no código e a conversão em item de trabalho.

### L1 — Estrutura actual da Produção

- Uma única página HTML em `/bastidores/producao`, montada por `paginaProducao()` em
  `motor/servidor/bastidores.js`. Tudo numa rota, a rolar.
- Rotas HTTP: `/bastidores`, `/bastidores/estudio`, `/bastidores/producao` (páginas) + as
  `/api/bastidores/*` (alunas, professores, dono, validar-senha/producao, turmas, termos,
  turma-conteudos, semear-catalogo…).
- A ponte (`motor/servidor/producao.js`) decide o prefixo da porta (`/anamnese`, `/plano-ensino`,
  `/plano-observacao`) e entrega os Bastidores ANTES da porta.

**→ Tarefa:** menu lateral + secções próprias. **Feito** (`8a6e8d6`, hash por seção). Rotas de
servidor `/producao/*` ficam como **opcional** posterior.

### L2 — A senha é pedida a cada operação (causa real)

- O código pede UMA vez (`SENHA_DIRECAO` em variável JS) e reenvia a senha em cada corpo.
- **Mas** toda operação bem-sucedida faz `location.reload()`, que zera a variável e re-mostra o
  portão — daí a senha parecer pedida a cada operação. Não usa `sessionStorage`.

**→ Tarefa:** sessão persistente (`sessionStorage`, login vale enquanto a aba fica aberta).
**Feito** (`a2f6a1d`).

### L3 — A direção do fluxo (confirmado contra o código)

**A crença da pesquisadora está certa:**

- **A anamnese NÃO alimenta o plano.** `motor/nucleo/derivar-plano-ciclo.js` lê **só** o envelope
  do plano (`tabelaDeContexto` lê `contexto-*`); nenhuma referência à anamnese.
- **O PO recebe AS DUAS.**
  - **Do plano:** `derivar-po.js` → `comporCampoEmpirico` (escola/turma/frequência/duração) e
    `comporContexto` (calendário/volume/condição de registro) leem `respostaDo(plano, 'contexto-*')`.
    Vínculo = `vinculosDePlano()` em `porta.js` (o PO referencia o plano pelo nó
    `plano-de-ensino`, `opcoesDe: api/planos`).
  - **Da anamnese:** o nó `sujeitos` do PO usa `opcoesDe: api/anamneses`; `linha-de-base` usa
    `repetirPor: sujeitos` (o «o que traz» / «o que precisa desenvolver» de cada aluna vem do
    envelope da anamnese).

**Direção medida:** anamnese → (nada a jusante) · plano → PO · PO consome as duas. Unidireccional.
**→ Tarefa:** nenhuma mudança de fluxo — é **seguir** essa direção na integração (Bloco 8), não
inventar a reversa.

### L4 — Inventário de campos/nós

| Formulário | Nós respondíveis | Obrigatórios | Fonte |
|:--|:--|:--|:--|
| Anamnese | 53 | 49 | `porta/conteudo/anamnese.json` |
| Plano de ensino | 26 | 16 | `porta/plano/conteudo/plano.json` |
| PO | ~35 respondíveis (40 ids) | 26 | `porta/po/conteudo/po.json` |

### L5 — Duplicações campo a campo

**Os três campos que a pesquisadora apontou para REMOVER do PO já não existem nele** — a
deduplicação já foi feita; o PO compõe `campo empírico` e `contexto` a partir do plano
referenciado:

| Campo | Onde vive | Duplicado? | O que fazer |
|:--|:--|:--|:--|
| frequência semanal | plano `contexto-frequencia` | não | nada (PO lê do plano) |
| duração por aula | plano `contexto-duracao` | não | nada |
| condição de registro | plano `contexto-registro` | não | nada |
| turma observada | plano `contexto-turma` | não | nada |
| metodologia de referência | plano `contexto-metodologia` | **não duplica, mas NÃO chega ao PO** | ✅ **ligado** (Bloco 8.2 · commit `3410db9`) |
| quem escolhe | plano `contexto-metodologia-origem` | idem | ✅ **ligado** |
| notação | plano `contexto-notacao` | idem | ✅ **ligado** |

**→ Tarefa:** ~~ligar~~ — **feito**: o PO agora lê `metodologia`/`quem-escolhe`/`notação` do
plano referenciado numa seção própria `## Metodologia e notação` (nunca deduzidas, P-16; a
«Norma estabelecida» continua elicitada). Fica em aberto: o PO tem `escola` (cabeçalho) **e**
`campo-escola` (observação inicial) — quase sempre o mesmo valor, candidato a **confirmar** com
a pesquisadora.

### L6 — O bug do `[Preencher]` na `distribuicao-de-volume` (medido, não fechado)

- Caminho coerente para string: `tabelaDeLista()` → `emLista()` (string→split por `\n`; array→map).
- `distribuicao-de-volume` é **texto livre** (sem `forma`/`opcoes`).
- **O sintoma não casa:** se fosse string, viraria tabela; se array de objectos, viraria
  `[object Object]` — não `[Preencher]`.
- **Conclusão:** o defeito está no **mapeamento do valor vivo** (o envelope guarda forma
  diferente da que o derivador lê). **Preciso do JSON do envelope real** (Maria em produção ou
  export do KV) para fechar.

**→ Tarefa (🔒 bloqueada):** obter o envelope vivo e re-mediar. Ver frente **B5**.

### L7 — A modalidade (comum × específico)

- A anamnese é hoje **100% balé clássico** no vocabulário, mesmo nos blocos "comuns"
  (força/flexibilidade falam em `plié`, `allegro`, `adágio`, `port de bras`).
- Separar comum × específico exige **reescrever o vocabulário dos blocos comuns em linguagem
  neutra** — trabalho de **conteúdo** (P-16), não de código.

**→ Tarefa (⏸ deferida):** ver frente **B6**. O pedido manda medir, não implementar.

### As 3 confirmações bloqueantes (Bloco 10) — estado

1. **Rubrica** — ✅ `satisfatório · razoável · em desenvolvimento · não se aplica`.
2. **Faixa etária** — ✅ **corte em 14** (infantil ≤13, juvenil 14–17, adulto ≥18) — o código já
   faz exatamente isso (`>=18 ? Adulto : >=14 ? Juvenil : Infantil`); **nada a mudar**.
3. **«não se aplica» da metodologia** — ✅ redundante com «Escola livre» do nó 50; **não criar**
   opção nova.

---

## 3. O panorama das frentes em aberto — três trilhos

### Trilho A — O experimento PO/PE

| # | Frente | Estado | Bloqueio |
|:--|:--|:--|:--|
| A1 | **Levantamento de tokens PO+PE** (empírico) | ✅ medido — `experimentos/pe/freio-custo.md` §4 (≈20 500 tokens/PO, teto 33 000, orçamento por plano) | nenhum — já medido |
| A2 | **Plano B — binding KV real** (provas B1–B4) | ✅ resolvido — B1 ✅ B3 ✅ (binding real); B2 ✅ (o motor Node saiu do caminho: a porta agnóstica `cloudflare.js`+`rotas.js` serve as 14 rotas no Worker, com conteúdo de `ASSETS`/`plano-observacao/` e KV); B4 ⚪ raciocinado | A4 depende dos secrets de write-back (`GITHUB_TOKEN`/`SENHA_CRIPTO`), não do motor Node |
| A3 | **Freio de custo** (instrução de escopo · limite 30 turnos · registro) | ✅ feito — spec `freio-custo.md` + teto de 30 turnos em `motor/nucleo/ia.js` | nenhum |
| A4 | **Migração experimento → produção** | ⬜ aberto | só depois de A2/A3 + teste de botões |
| A5 | **Negócio** (franquia/excedente, gamificação, parceiros) | ⏸ deferido | **depois** de A4 |

### Trilho B — A Barra + a integração inteligente dos três formulários

| # | Frente | Estado | Bloqueio |
|:--|:--|:--|:--|
| B1 | **Curadoria** — a peça central (atribuição por professor que pré-carrega os 3 formulários) | ✅ mecanismo pronto | `motor/servidor/bastidores.js` + `biblioteca/modalidades/modalidades.json` (commit `f8d367e`) |
| B2 | **Integração (Bloco 8)** — derivados, fluxo, campos que saem/vêm | ✅ fechada · metodologia/notação (`3410db9`) + consumo da curadoria (plano/PO travam sem curadoria, anamnese filtra alunas) | — |
| B3 | **Catálogo: base → biblioteca** — o CRUD de hoje vira `biblioteca/modalidades/` + `ESCOLA.conf`; a escola **declara** o que usa | ✅ base migrada | `biblioteca/modalidades/` (commit `14bfb2e`); falta o `ESCOLA.conf` |
| B4 | **Norma revisada** — Produção **pode criar/excluir** (caso a caso) | ✅ registrada | `REGISTRO.md` + `IDEIA-PAINEL-ESCOLA.md` §12 |
| B5 | **Bug do `[Preencher]`** na `distribuicao-de-volume` | ✅ resolvido — remedido: o `[Preencher]` era **literal** em `derivar-ciclo.js`, não um defeito de mapeamento. A grelha estrutura a proporção e a Aula 01 deriva Fatia/Tempos | o «envelope vivo» era **fantasma** — a KV não tem um único envelope |
| B6 | **Modalidade comum × específico** (anamnese 100% balé) | ⏸ deferido | reescrita de conteúdo (P-16) |
| B7 | **Bloco 4 (PO)** — rubrica clicável, turmas plural, checklist pré-preenchido | ✅ fechado — as turmas em plural, **5 das 6** folhas do checklist inferidas, e a **rubrica do plano** em grelha clicável (`grelhaDaTabela` na porta; o checklist do PO já era clicável) | — |

### Trilho C — «Nós, Por Exemplo» (a página de entrada do sistema)

| # | Frente | Estado |
|:--|:--|:--|
| C1 | Página `biblioteca/nos-por-exemplo.md` + `fundamentacao.md` + `videos.json` | 🔨 parcial — página ✅ (fonte única) · `videos.json` ✅ (não embutido) · `fundamentacao.md` ❌ |
| C2 | Migrar o menu (`gerar-ciclo.sh`): Início→Ciclos, nasce «Nós, Por Exemplo» | ✅ feito — «Nós, Por Exemplo» é a entrada + grupo «Ciclos»; `criar-escola.sh` (nav_zero) sem «Início», com «Bastidores» |
| C3 | Correção socrática (Frente 5) + modo desenvolvedor (Frente 6) | 🔨 parcial — F5 (correção socrática) ✅ no pacote; F6 (modo desenvolvedor) ⏸ fase 2 |

---

## 4. A decisão que B3 destrava — o catálogo é biblioteca, não CRUD

A pesquisadora reviu o cadastro de turmas/vocabulário que nasceu como CRUD no KV. A leitura
**corrigida**:

- **A base canónica** (RAD · Vaganova · francesa · Graham · Limón · Horton · Humphrey–Weidman) é
  **conteúdo da `biblioteca/modalidades/`**, versionado e compartilhado — como o
  `guia-do-professor`. Nenhuma escola duplica.
- **A escola declara** no `ESCOLA.conf` (formato chave=valor, já planeado no
  `IDEIA-PAINEL-ESCOLA.md` §10) **o que usa e como organiza** — modalidades, tradições, turmas.
- **O ciclo herda** modalidade/turma/tradição do `.conf` da variante, e o repertório vem da
  `progressao.json` da biblioteca, filtrado pela declaração da escola.
- **O professor pode acrescentar** passo fora do repertório, **com aviso** («não pertence à
  progressão declarada») — P-16, não se restringe nem se inventa equivalência.

**Consequência imediata:** o KV de hoje (`catalogo-seed.js` + rotas turma/termo/relação) é
**andaime temporário** — serve para a integração não parar, mas será **reconstruído** como
biblioteca + `ESCOLA.conf` em peça própria. O botão «Carregar catálogo inicial» **desaparece**
quando a base for para a biblioteca (a escola passa a escolher o que usa).

---

## 5. A norma revisada (o que muda no `IDEIA-PAINEL-ESCOLA.md` §12)

A regra antiga era *«O Bastidores **não cria dado nenhum**. Ele **relê** o que o lançamento do
professor já produz»*. **Revogada** — a pesquisadora decidiu **tratar cada caso**, porque escolas
e tradições variam e **não dá para exaurir tudo numa biblioteca compartilhada**.

A leitura nova, por entidade:

| Entidade | Onde vive | Por quê |
|:--|:--|:--|
| Alunas (P-12) | escola (KV) | o grupo é dela |
| Professores | escola (KV) | idem |
| Turmas | escola (KV) | o nome é dela, não da RAD |
| Vocabulário | biblioteca (base) **+** escola (o que a base não cobre) | a base é compartilhada; a escola acrescenta o que a tradição dela usa |
| Tradições/técnicas | biblioteca (base) **+** escola | idem |

**Regra geral de operação:** incluir e excluir, **não editar** (edição fica para peça própria, se
for preciso). A Produção **relê** o que o lançamento produz **e cria/declara** o que é próprio da
escola.

---

## 6. Ordem de trabalho recomendada

```
1. B4 — registrar a norma revisada (REGISTRO + IDEIA-PAINEL-ESCOLA)   ✅ feita
2. B3 — mover a base para biblioteca/modalidades (peça própria)       ✅ base migrada (falta ESCOLA.conf)
3. B1 — curadoria (a peça central)                                    ✅ mecanismo pronto (f8d367e)
4. B2 — integração dos 3 formulários (derivados, fluxo, saídas)       ✅ metodologia/notação (3410db9) · consumo da curadoria ✅
5. B7 — Bloco 4 do PO (rubrica clicável ✅ · turmas plural ✅ · checklist pré-preenchido ✅)   ✅ fechado
6. A4 — experimento: migrar para produção (A1/A2/A3 já feitos; falta só os secrets de write-back)
7. B5 — bug do [Preencher] na distribuição do volume                   ✅ resolvido (o bloqueio era fantasma)
8. C1 — «Nós, Por Exemplo»: `fundamentacao.md` + embutir `videos.json`  (C2 já feito) ← paralelo, independente
```
