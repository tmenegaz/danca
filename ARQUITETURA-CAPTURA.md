# Arquitetura — Formulário de captura em JSON

> **Resumo (para o HANDOFF):** arquitetura técnica do formulário dinâmico com
> JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em
> aberto. Não implementado.

> **Por que esta ideia existe.** O projeto não tem problema de **volume** (ver
> §6 — o limite físico de uma escola é ~230 MB em 10 anos). Tem problema de
> **navegação**: um menu com N capturas e N relatórios fica imenso na medida em
> que as aulas acontecem. Esta ideia resolve a navegação — não a escala.

> **Documento técnico.** Complementa o `IDEIA-CAPTURA.md` (conceito) com o
> desenho da arquitetura. Descreve o que **seria** implementado — não uma
> implementação atual. Os diagramas vêm em duas formas: **Mermaid** (renderiza no
> GitHub) e **ASCII** (para o PDF, onde o Mermaid não renderiza sem plugin).

## O que é entregável derivado — e um deles já existe hoje

**O guia de observação** (`guia-de-observacao-<NN>.md`) é **derivado de PO + Aula** ✓ — ele declara *"o que
observar durante a aula"* a partir do que o professor **declarou para aquela aula** (o PO) e do que ela
trabalha (o plano). **Ele é, portanto, um entregável**, não uma fonte primária: ninguém "digita" o guia — ele
se escreve do que já foi declarado. Desde 2026-09-20 ele **não é digitado em lugar nenhum**: o pacote do ciclo
o **gera** das duas entradas (peça 3 da migração — §8), e o Duo já é assim na prática.

**O que ele tem em comum com o relatório, o caderno e os acompanhamentos:** o **grão por aula** ✓ — e, com
ele, o mesmo problema que esta arquitetura resolve (**um item de menu por aula** ✗). Ele entra na mesma
categoria: **vista gerada sob demanda** ✓.

**O que mudou, e por que isto está escrito aqui:** até 2026-09-20 o guia se chamava `relatorio-aula-<NN>` —
a chave dizia *relatório* e o documento era *guia*, e o rótulo do menu era corrigido **no gerador** para
disfarçar ✗. A chave passou a se chamar o que o documento **é** (`guia-de-observacao-<NN>`), e o remendo saiu.
**Com a chave honesta, `relatorio-aula-<NN>` volta a significar só o relatório** — que é o que este documento
propõe gerar sob demanda.

## 1. Modelo de dados

### 1.1 Entidades

**Mermaid:**

```mermaid
flowchart LR
  PO["PO<br/><i>o que observar no ciclo</i>"] --> F["Formulário"]
  CI["Ciclo<br/><i>o período e o plano</i>"] --> F
  AU["Aula<br/><i>o que trabalhar hoje</i>"] --> F
  F --> JS[("JSON<br/>um por ciclo")]
  JS --> V["Vistas<br/><i>calculadas em memória</i>"]
  JS -.-> E["Entregáveis<br/><i>gerados sob demanda</i>"]
```

**ASCII (mesma estrutura, para o PDF):**

```
PO ─────┐
        │
Ciclo ──┼───> Formulário ───> JSON (um por ciclo)
        │                       │
Aula ───┘                       ├──> Vistas (calculadas em memória)
                                │
                                └──> Entregáveis (gerados sob demanda):
                                     caderno · relatório · acompanhamento
```

**Descrição:**

- **PO** — define o que observar no ciclo (alunas, fenômeno, linha de base)
- **Ciclo** — define o período, o intervalo e a duração de referência (o manifesto)
- **Aula** — define o que trabalhar hoje (tipo, exercícios, objetivo)
- **Formulário** — combina PO + ciclo + aula para montar os campos daquela aula
- **JSON** — armazena os valores lançados (um por ciclo, com todas as aulas)
- **Vistas** — recortes calculados em memória (por aula, por aluna): o que se lê na tela
- **Entregáveis** — caderno, relatório pós-aula e acompanhamento por aluna: gerados
  **sob demanda**, quando há um arquivo a entregar (§3.5)

### 1.2 Relações

| Entidade | Fornece | Consome |
|:--|:--|:--|
| **PO** | Apelidos, fenômeno, linha de base | — |
| **Aula** | Tipo, exercícios, objetivo | PO (para saber o que observar) |
| **Formulário** | Campos (montados dinamicamente) | PO + Aula |
| **JSON** | Valores + textos | Formulário (grava) |
| **Vistas** | Recortes | JSON (lê) |
| **Entregáveis** | Caderno, relatório pós-aula e acompanhamento — **sob demanda** | JSON (lê) |

## 2. Schema do JSON

### 2.1 Estrutura geral

```json
{
  "ciclo": "01",
  "escola": "duo",
  "professor": "tiago",
  "criado_em": "2026-09-19",
  "aulas": {
    "01": { },
    "02": { }
  }
}
```

### 2.2 Estrutura de uma aula

```json
{
  "data": "2026-09-19",
  "presentes": ["ceci", "ana", "mel", "sofi"],
  "ausentes": [],
  "duracao_min": 120,
  "condicoes_contorno": {
    "plano_seguido": "sim",
    "animo": 5,
    "interesse": 5,
    "harmonia": 5,
    "mudou": ""
  },
  "tecnica": {
    "ceci": {
      "metatarsos": "ok",
      "tempo": "ok",
      "transferencia": "ok",
      "braco_perna": "parcial"
    }
  },
  "funcional": {
    "ceci": {
      "duracao_min": 120,
      "tonus": "parcial",
      "fadiga_antes": false
    }
  },
  "musicalidade": { },
  "linha_de_base": { },
  "relatorio": {
    "texto": "...",
    "surpresas": "...",
    "ajustes": "..."
  },
  "materiais": [],
  "ultimo_lancamento": "2026-09-20T14:30"
}
```

**Nota:** o schema é **por aula** dentro do JSON. As vistas não ficam
armazenadas — são calculadas pelo formulário. O `ultimo_lancamento` é o carimbo
de gravação **daquela aula**: é o que ancora o prazo do ajuste (§5.1).

E `plano_seguido` e `mudou` são **um par**, com regra declarada: se o plano **não**
foi seguido (`parcial`/`não`), `mudou` é **obrigatório** — é ali que a mudança se
registra, em uma linha (a estrutura executada e o que foi abandonado vão no
`relatorio` da aula, que é o lugar da execução diferente); se o plano **foi**
seguido (`sim`), `mudou` fica **vazio** — e vazio quer dizer *nada mudou*. Os
documentos gerados declaram os dois estados ("nada — o plano foi seguido"), em vez
de ficarem em silêncio.

O formulário **sugere** a data e a duração da aula a partir do plano do ciclo: a
aula N é a N-ésima do período declarado, no intervalo declarado (`intervalo_dias`),
e a duração de referência é a do ciclo (`duracao_min`). São valores **iniciais**,
editáveis — a aula pode ter acontecido em outro dia ou durado outro tempo.

## 3. Fluxo

### 3.1 Antes da aula

**Mermaid:**

```mermaid
flowchart TD
  A["Professor abre o formulário"] --> B["Seleciona a aula no select"]
  B --> C["Lê o PO: apelidos, o que observar"]
  B --> D["Lê a aula: tipo, exercícios"]
  C --> E["Monta os campos daquela aula"]
  D --> E
  E --> F{"A aula já tem dados no JSON?"}
  F -->|sim| G["Carrega os dados lançados"]
  F -->|não| H["Campos em branco"]
```

**ASCII:**

```
Professor abre o formulário
    ↓
Seleciona a aula no <select>
    ↓
Formulário lê o PO (apelidos, o que observar)
    ↓
Formulário lê a aula (tipo, exercícios)
    ↓
Formulário monta os campos daquela aula
    ↓
Se a aula já tem dados no JSON → carrega
Se não → campos em branco
```

### 3.2 Durante a aula

```
Professor marca os valores no formulário
```

### 3.3 Depois da aula

```
Professor lança os dados → formulário atualiza o JSON em memória
    ↓
Escreve o texto do relatório → também vai para o JSON
    ↓
Cada gravação cria um ARQUIVO novo, com carimbo no nome, e o índice passa a
apontar para ele — o anterior permanece (ver §5.1)
    ↓
Baixa o JSON novo e o índice atualizado
    ↓
Commita no Git (repositório privado)
```

### 3.4 Visualizar

```
Professor abre o formulário
    ↓
Seleciona "Aula 03" → formulário carrega dados do JSON
    ↓
OU seleciona "Carol" no filtro → formulário calcula a vista por aluna
    ↓
OU o período do ciclo aparece como informação (não é filtro)
```

### 3.5 Gerar um entregável (sob demanda)

Os artefatos de saída — **caderno**, **relatório pós-aula** e **acompanhamento por
aluna** — são **vistas dos dados já lançados**: o professor clica em "Gerar" quando
precisa de um arquivo para entregar (enviar, imprimir, arquivar), com o filtro que
quiser. **Nada é mantido atualizado automaticamente.** O JSON é o armazenamento; os
`.md` são os entregáveis.

E não é escrever duas vezes: no modelo atual o caderno e o relatório são **escritos à
mão**; aqui eles são **lidos** do que já foi lançado.

Isso não muda o §3.3 — a gravação continua sendo lançar → baixar o JSON → commitar. O
que muda é que o documento entregue deixa de ser escrito à mão: ele é o espelho do
filtro, no momento em que se precisa dele.

## 4. Componentes

**Mermaid:**

```mermaid
flowchart TB
  subgraph NAV["Navegador"]
    F["Formulário<br/>HTML + JS"]
    V["Vistas<br/>calculadas em memória"]
    J[("JSON do ciclo")]
    F --> J
    V --> J
  end
  J -->|"download manual"| G["Git — repositório privado<br/>JSON é fonte · cada estado é um commit"]
```

**ASCII:**

```
┌─────────────────────────────────────────────┐
│              Navegador                       │
│  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Formulário    │  │     Vistas      │   │
│  │   (HTML + JS)   │  │  (calculadas)   │   │
│  └────────┬────────┘  └────────┬────────┘   │
│           │                     │             │
│           └──────────┬──────────┘             │
│                      │                        │
│           ┌──────────┴──────────┐             │
│           │        JSON         │             │
│           │   (ciclo-XX.json)   │             │
│           └─────────────────────┘             │
└─────────────────────────────────────────────┘
              │
              │ download / commit manual
              ▼
┌─────────────────────────────────────────────┐
│        Git (repositório privado)             │
│  - JSON é a fonte (entra no hash)            │
│  - Cada estado do JSON é um commit           │
└─────────────────────────────────────────────┘
```

## 5. Segurança

Os dados do JSON são os mesmos dos acompanhamentos atuais — dados de menores.
As proteções são as mesmas (ver `CONGELAMENTO.md`):

| Camada | O que protege |
|:--|:--|
| **Repositório privado** (GitHub) | O JSON não é legível publicamente |
| **Fora do Git?** | Decisão pendente — ver seção 7 |
| **Criptografia no site** | Se o JSON for publicado, é criptografado como os acompanhamentos hoje |
| **Acesso** | Só o professor (com senha) |

**Onde o JSON vive:** decisão pendente — ver seção 7.

## 5.1 Ajuste com prazo

O JSON pode ser **ajustado** dentro de um prazo de **48 horas** — contadas a partir
da **última gravação daquela aula** (não do arquivo, nem do ciclo). Cada vez que a
aula é salva — no lançamento **ou** num ajuste — o contador **dela** reinicia; o das
outras não é tocado. **Lançar a aula 05 não reabre a janela da aula 01.** Cada aula
fecha quando **ela** fica 48h sem ser tocada.

**O que é um ajuste (não é edição):**

- O professor abre a aula já lançada (modo leitura) → botão **"Ajustar
  lançamento"** (só dentro do prazo)
- O formulário **reabre em modo captura** com os dados atuais carregados
- O professor corrige, preenche o **"Motivo do ajuste"** (obrigatório) e o
  **"Gerado por"** — o ajuste fica registrado com autor — e salva
- Cada gravação cria um **arquivo novo, com carimbo no nome**
  (`dados-exemplo-2026-09-20T1430.json`), e o índice (`ciclos.json`) passa a apontar
  para ele. O arquivo anterior **permanece** — acessível, e não é o vigente
- O novo arquivo declara: `ajuste_de` (de onde veio), `ajustado_em`, `ajustado_por`,
  `motivo` — e `ajustes`, a lista do que mudou, **gravada no ato do ajuste**. O
  documento gerado depois (§3.4) reproduz o que mudou sem depender de o arquivo
  anterior estar acessível: sem servidor, ele pode ter ido para a pasta de downloads
  do navegador, e não para a pasta do ciclo

**Por que o prazo:**

A memória do professor é uma edição da realidade. Dentro de 48h, o ajuste é
memória fresca — vale corrigir. Depois, é reconstrução — não vale.

**Depois do prazo:**

O botão fica **cinza**, com aviso: *"Prazo encerrado em [data] — o registro
é definitivo."* O professor vê que a possibilidade existiu, mas não está mais
disponível.

**A regra de proveniência se mantém:** o JSON antigo não é editado, e o novo
declara de onde veio. A cadeia é íntegra — só ganha um elo novo.

> **No experimento** (`experimentos/captura-json/`), o prazo fechado pode ser visto
> sem esperar 48h: a página aceita `#agora=2026-10-01T10:00` no endereço. A gravação
> usa o relógio de verdade, sempre — o carimbo do arquivo não se simula.

### Aviso para implementação — colisão de nomes

O campo `ajustes` (lista de mudanças do lançamento, na **raiz** do JSON)
**não pode colidir** com `relatorio.ajustes` (o "O que foi ajustado" do
relatório pós-aula, **dentro de cada aula**).

**O risco:** um merge que grave a chave `ajustes` em qualquer nível de
indentação sobrescreve o relatório da aula com a lista — e o JSON continua
**válido** (o `JSON.parse` não pega), o que torna o bug silencioso. Aconteceu
de verdade na primeira versão do experimento: o campo nasceu como lista e o
relatório da aula virou array, sem que nada acusasse.

**As opções:**

- **(a)** O merge é **ciente do nível** — só toca a raiz, nunca o interior
  das aulas
- **(b)** O campo de raiz recebe **outro nome** (`ajustes_do_lancamento`)

No experimento ficou **(a)**: a gravação ancora a indentação exata da raiz (dois
espaços), e o harness ganhou asserção de regressão — `relatorio.ajustes` de uma
aula tem de continuar texto. A decisão para o gerador continua em aberto.

## 6. Estimativas

### 6.1 Tamanho do JSON

Por aula, com os campos do schema:

- ~500 bytes por aluna × 4-5 alunas = ~2,5 KB
- Mais os textos do relatório: ~1-2 KB
- Total por aula: **~4 KB**

Em 21 aulas (Ritmos): **~80 KB**. Em 12 aulas (Duo): **~50 KB**.

**Conclusão:** o JSON é pequeno. Carrega instantaneamente no navegador, mesmo no
celular.

### 6.2 Performance dos filtros

Filtrar 21 aulas por aluna = operação em ~80 KB. Instantâneo em qualquer
dispositivo moderno.

**Otimização só faz sentido acima de ~500 aulas.** Não é o caso.

### 6.3 Cenário de escola grande

O cenário atual (1 professor, 2 escolas, ~21 aulas por ciclo) é pequeno. Mas
vale medir o **limite físico** do domínio — para saber se a ideia continua
viável em escala maior.

Uma escola tem limites físicos:

| Fator | Limite |
|:--|:--|
| Salas | 3 (raro ter mais) |
| Horas por dia por sala | 8 |
| Dias por semana | 6 |
| Semanas por ano | 40 (descontando férias) |
| Alunos por aula | 20 |

**Total de aulas/ano** (3 salas × 8 h × 6 dias × 40 semanas): **~5.760
aulas/ano**.

**Volume de dados (JSON):**

- ~80 KB por ciclo de 20 aulas
- 5.760 aulas ÷ 20 aulas por ciclo = ~288 ciclos/ano
- **~23 MB/ano**

**Volume de dados (`.md`, o formato atual):**

- ~10 KB por aula
- **~58 MB/ano**

**Em 10 anos:** ~230 MB (JSON) ou ~580 MB (`.md`).

### 6.4 O que isso significa

**Em qualquer formato, o volume é trivial.**

| Volume | Tecnologia que aguenta |
|:--|:--|
| 580 MB (10 anos, `.md`) | Git lida — repositório grande, mas funcional |
| 230 MB (10 anos, JSON) | Git lida com folga |
| 230 MB (SQLite) | Trivial (SQLite lida com TB) |
| 230 MB (PostgreSQL) | Ridiculamente pequeno |

**Nenhuma migração para banco de dados é necessária por volume.** Nem agora, nem
em 10 anos, nem em 20.

## 7. Decisões tomadas

| Questão | Decisão | Consequência |
|:--|:--|:--|
| **Onde o JSON vive** | No Git do repositório privado, **não publicado** — como o PO e o relatório | O gerador lê JSON; cada aula lançada provoca reancoragem |
| **Coexistência com `.md`** | **Só as vistas são geradas**; o autorado continua `.md` | As vistas saem da cobertura do hash; o JSON entra |
| **O que migra primeiro** | O **guia** (é redundante com PO + plano). A **musicalidade** não migra — é autorada, e a vista **alimenta** o documento | O guia de produção é substituído; o documento de musicalidade permanece |
| **O JSON no hash** | **Sim** — como o PO (fonte coberta sem estar no `DOCS`) | Reancoragem por lançamento |
| **Escopo** | **Duo + Ritmos** | As duas formas (lista × prosa) testam o modelo |

> **7.1 — que campos montar para cada aula?** Fica **respondida na prática pelo experimento**:
> os campos saem do próprio ciclo (as alunas do índice + as colunas de técnica e funcional), e o
> que muda por aula é o **conteúdo**, não a forma. Vale até a implementação dizer o contrário.

**O que NÃO foi decidido ainda** (fica em aberto), com as hipóteses que o desenho levantou:

- **7.2 — o que acontece se o PO mudar no meio do ciclo?** (A) o JSON é migrado, em nova versão;
  (B) o JSON fica na versão do PO que existia quando foi criado; (C) o JSON declara a versão do
  PO, e a migração é manual. **Não decidido.**
- **7.4 — como o Netlify serve um JSON criptografado?** (A) o JSON é servido cifrado e o
  formulário o descriptografa no navegador (como o PageCrypt faz com os HTML hoje); (B) o JSON
  não é servido publicamente — só existe no computador do professor. **Não decidido.**
- **7.5 — durante a transição (JSON e `.md` coexistem), qual é a fonte?** (A) o `.md` continua
  sendo a fonte até o JSON estar completo; (B) a partir de uma data, o JSON passa a ser a fonte;
  (C) os dois coexistem — o JSON para as aulas novas, os `.md` para as antigas. **Não decidido.**
- **7.6 — o formulário roda onde?** (A) no pacote publicado (site do ciclo), como parte dos HTML;
  (B) fora do pacote — uma ferramenta separada do professor; (C) no VS Code, como extensão ou
  app. **Não decidido.**

## 8. As peças da migração (na ordem)

1. **Feita** — `ciclo-XX-dados.json` + `ARQUIVO_DADOS` no `lib-fontes.sh` + cobertura do FIPP
   (`86b06f2`): o JSON do Duo existe — **vazio**, porque o dado da Aula 01 está no caderno e no
   relatório; o primeiro lançamento entra pela página — e a âncora regerou (a Ritmos ficou intacta);
2. **Feita** — os builders saíram para **`tools/lib-vistas.js`** (`d65a247`), e o formulário passou
   a consumi-los: uma definição, dois consumidores. A igualdade foi medida: com o mesmo `prov`, o
   guia do **Node é idêntico** ao do formulário; sem `prov` (o caso do gerador), a diferença é só o
   carimbo — declarado;
3. **Feita** — o `gerar-ciclo.sh` **gera as páginas de vista**: `tools/gerar-vista.js` (novo) resolve as
   fontes pela precedência do `lib-fontes.sh`, passa o PO e o plano pelos **extratores** e chama a
   **lib das vistas** — o terceiro consumidor da mesma definição. A vista **substitui a fonte escrita à
   mão quando ela sai** (`e_vista()`): a migração é por variante, e apagar o `.md` é o ato. O Duo já
   migrou (o guia dele é gerado, sem carimbo — determinístico); a Ritmos segue com o dela até a vez dela.
   Medido: a página gerada traz a *Procedência* (7 de 7 blocos) que a escrita à mão não tinha, o rótulo
   do menu sai do mesmo texto (via `src_do_doc()`), e o PDF consolidado a inclui;
4. **Feita** (a parte que a peça 3 fecha) — **as vistas saem da cobertura**; o JSON entrou na peça 1. Das
   vistas, quem sai da cobertura é **o guia** — o único derivável por inteiro (o caderno e o relatório
   continuam fontes de registro, escritas por quem viveu a aula). A âncora do Duo regerou uma vez
   (`cb721612…` → `ddd514ef…`); a Ritmos ficou intacta;
5. **Duo (12 aulas) primeiro; Ritmos (21) depois** — as duas formas testam o modelo. O gerador já produz
   o guia da Ritmos (medido), e migrá-la é uma linha: apagar o `.md` dela.

## 9. O que isso revela

**Esta ideia não é sobre escala. É sobre navegação.**

O desenho da arquitetura mostrou que:

- A ideia **funciona** em qualquer volume (ver §6 — 10 anos de escola grande
  cabem em ~230 MB).
- O problema que ela resolve é **navegação**: o menu "Acompanhamento" fica imenso
  com N capturas e N relatórios; navegar entre aulas exige abrir arquivos
  separados.
- A migração para JSON **não é necessária por volume**. Se for feita, é para
  simplificar a interface.

Há **quatro perguntas em aberto** (§7) e **cinco decisões tomadas** — nenhuma das abertas
bloqueia a ideia; todas podem ser respondidas quando a implementação for decidida.

**A pergunta crítica era a §7.3 (onde o JSON vive) — decidida em 20/09: no Git do
repositório privado, não publicado** (ver a tabela da §7). Ela define se a ideia mantém a
arquitetura atual, sem servidor, ou exige backend: **mantém** — o JSON é mais um arquivo do
ciclo, e o formulário continua sendo HTML + JavaScript, sem backend.

## Referências

- `IDEIA-CAPTURA.md` — conceito (o "por quê")
- `ARQUITETURA-CAPTURA.md` — este documento (o "como")
- `PROTOCOLO.md` — as 22 pétreas
- `REGRAS.md` — as 17 regras
- `METODO.md` — a visão de mundo
- `CONGELAMENTO.md` — o que está congelado

