# Material de campo

Instrumentos de coleta **e** as respostas obtidas em campo. Tudo aqui é
**material bruto** (P-05): registro do que foi dito e respondido — não é evidência,
não é classificação e não tem análise (P-06).

## Estrutura

```
campo/
└── AAAA-MM-DD-<escola>/       um diretório por evento de campo
    ├── formulario.md          o instrumento aplicado, como foi aplicado
    ├── respostas.md           as respostas, digitadas (sem nome nem contato)
    └── (anexos, se houver)
```

O nome do diretório é a **data real do evento** mais a escola, no mesmo padrão do
calendário dos ciclos — assim o material de campo se liga ao ciclo correspondente
sem precisar de índice.

| Evento | Data | Escola | Instrumento |
|:--|:--|:--|:--|
| Formulário de prática e recepção | **03/10/2026** (sábado — dia de aula da Ritmos) | Ritmos e Movimento (Gabi) | [`2026-10-03-ritmos/formulario.md`](2026-10-03-ritmos/formulario.md) |

## Regras

1. **O instrumento é versionado como foi aplicado.** Se o formulário mudar para o
   próximo evento, cria-se um novo diretório — o anterior permanece intacto
   (mesma lógica do caderno: o passado não é reescrito, é acrescido).
2. **Nome e contato não entram no repositório.** O bloco de interesse (seção 9,
   opcional) pede nome e contato: esses dados ficam **fora** do Git, em arquivo
   local. Em `respostas.md` entra a resposta, sem identificação.
3. **As respostas são transcritas, não interpretadas.** Se algo precisar de
   leitura, a leitura vai para outro lugar — e só quando as condições da P-07
   existirem.
4. **A seção opcional é opcional de verdade:** formulário sem a seção 9 é
   formulário completo. Não se cobra, não se insiste.

## Relação com o protocolo

| Peça | Papel |
|:--|:--|
| **PE** (Protocolo de Elicitação) | o formulário é o **instrumento**: pergunta o que já existe na prática de quem responde |
| **P-05** | o que volta é material bruto — vira evidência só no PPQ, sob as condições da P-07 |
| **P-06** | transcrição descritiva: sem juízo, sem adjetivo essencializante sobre quem respondeu |
| **Pré-requisito 5** | cada evento de campo é de **uma** escola — não há mistura entre turmas |

Ver também [`PROTOCOLO.md`](../PROTOCOLO.md) e [`REGISTRO.md`](../REGISTRO.md).

---

# A linha de base — a forma canônica

> **Fixado em 26/09/2026.** A linha de base aparece em **duas formas** no projeto, e a decisão de qual
> é canônica nunca tinha sido escrita. Uma das formas é o **dado**; a outra é a **apresentação**. Esta
> seção fixa qual é qual, com a linha medida.

## A forma canônica é por aluna

A linha de base canônica é uma **lista, um objeto por aluna**, com exatamente estas três chaves:

```json
{ "aluno": "…", "traz": "…", "precisaDesenvolver": "…" }
```

- **`aluno`** — o apelido estável, o mesmo ao longo do ciclo (P-12).
- **`traz`** — o que a aluna traz, nas palavras do professor.
- **`precisaDesenvolver`** — o que o professor declara que ela precisa desenvolver.

Os nomes das chaves são estes, em camelCase, porque vêm do cabeçalho da tabela do PO pela regra de
tabela do contrato (`tools/lib-extracao-md.js:73–96`): `Precisa desenvolver` → `precisaDesenvolver`.

### Onde ela vive

Na seção `## Linha de base` do **PO**, na tabela `| Aluna | Traz | Precisa desenvolver |`, e no JSON
extraído do PO (`professores/<professor>/ciclos/ciclo-XX-<escola>/po-01.json`, chave `linhaDeBase`).
Medido, linha por linha:

| Documento | Linhas | O que está lá |
|:--|:--|:--|
| `professores/tiago/ciclos/ciclo-01-ritmos-po.md` | 89 (`## Linha de base`), 91–92 (intro: "O que cada um **traz** e o que **precisa desenvolver**, nas palavras do professor (P-10)"), 94–95 (cabeçalho `\| Aluno \| Traz \| Precisa desenvolver \|`), 96–99 (Carol, Dada, Tony, Pássaro Azul) | a tabela por aluna, limpa |
| `professores/tiago/ciclos/ciclo-01-duo-po.md` | 94 (`## Linha de base`), 110 (`### Linha de base do grupo (compartilhada)`), 133 (`### Linha de base por aluna`), 135–136 (`\| Aluna \| Traz \| Precisa desenvolver \|`), 137–140 (Ceci, Ana, Mel, Sofi) | a tabela por aluna existe no PO |
| `professores/tiago/ciclos/ciclo-01-ritmos/po-01.json` | chave `linhaDeBase`, 15 itens | 4 objetos `{aluno, traz, precisaDesenvolver}` + 11 strings (prosa e restrições da P-22) |
| `professores/fokini/ciclos/ciclo-01-diaghilev/po-01.json` | chave `linhaDeBase`, 8 itens | 4 objetos `{aluno, traz, precisaDesenvolver}` + 4 strings |
| `professores/tiago/ciclos/ciclo-01-duo/po-01.json` | chave `linhaDeBase`, 18 itens | 3 objetos `{dimensao, trazem, falta, dominam}` + 15 strings — **as linhas por aluna não estão lá** (ver a lacuna de extração abaixo) |
| `campo/2026-09-18-ritmos/respostas.md` | 96 (`### Linha de base`), 97–116 | material bruto, **em prosa por aluna** — foi o que se disse antes de virar tabela; **não é a forma canônica** |

Quem **consome** a forma por aluna é o formulário de lançamento, e é ele que a declara:

- `tools/templates/lancamento.html:916` — comentário: "Os itens da linha de base de uma pessoa: vêm do
  PO (`linhaDeBase`, por aluno, em lista)";
- `tools/templates/lancamento.html:918–921` — `objetosDe(po.linhaDeBase).find((x) => x.aluno === nome)`
  e a leitura de `eu.precisaDesenvolver` (separado por vírgula);
- `tools/templates/lancamento.html:1146–1152` — uma marca por **item** do PO, com a lista mantendo o
  texto do item (o slug perderia a redação que a professora leu).

## A outra forma é a apresentação, não o dado

A forma `{ "dimensao": "…", "trazem": "…", "falta": "…", "dominam": "…" }` — a tabela
`| Dimensão | O que as alunas trazem | O que falta | O que já dominam |`
(`professores/tiago/ciclos/ciclo-01-duo-po.md:99–103`, com Técnica, Funcional e Musicalidade) — é a
**apresentação** da linha de base do **grupo**: agrupa por dimensão de trabalho para leitura e **não
identifica aluna**. Ela não é o dado por sujeito, e não substitui a forma por aluna.

O próprio PO do Duo declara a relação entre as duas (`ciclo-01-duo-po.md:129–131`): "A heterogeneidade
declarada na tabela por dimensão aparece, abaixo, distribuída por aluna — declarada pela pesquisadora
antes da Aula 01 (P-10)." Ou seja: a forma por dimensão agrupa; a forma por aluna **distribui**.

A divergência medida fica registrada, para não ser redescoberta:

- `tools/lib-vistas.js:390` descreve a forma por **dimensão** como o que o extrator produz — é a
  redação do extrator, não a decisão de forma canônica;
- `tools/lib-vistas.js:426–440` (`dimensoesDe()`) aceita as **duas** — lê as chaves e decide pela
  presença de `dimensao`; `:446,454` usa `chaves.includes('dimensao') ? 'dimensao' : chaves[0]`;
- `professores/tiago/ciclos/ciclo-01-po-schema.json:33–36` descreve `linhaDeBase` como "uma **TABELA DE
  DIMENSÕES** no documento" — o schema foi escrito para a tabela de dimensões.

Nada disso é contradição de dado: é o **schema e o extrator** cobrindo a tabela de dimensões, enquanto
o **consumidor** (o lançamento) lê a forma por aluna. As duas coexistem no mesmo bloco
`## Linha de base` do PO do Duo — e é isso que produz a lacuna abaixo.

## Lacuna medida: a extração perde a tabela por aluna quando o bloco tem duas

`tools/lib-extracao-md.js:94–96` fixa: **só a PRIMEIRA tabela do bloco** entra no campo; uma segunda
tabela no mesmo bloco gera **aviso** e fica de fora — "o contrato não escolhe qual das duas é o campo,
o documento precisa dar a cada tabela o seu bloco".

Consequência medida, bloco por bloco:

- **Ritmos** — o bloco `## Linha de base` do PO tem **uma** tabela (a por aluno, `:94–99`): sai por
  aluna no `po-01.json`. Correto.
- **Diaghilev** — idem: sai por aluna.
- **Duo** — o bloco `## Linha de base` tem **duas** tabelas (a de dimensões em `:99–103` e a por aluna
  em `:135–140`): só a **primeira** entra, e a `linhaDeBase` do `po-01.json` sai por dimensão. As
  linhas por aluna (Ceci, Ana, Mel, Sofi) **não chegam ao JSON** — embora o PO as declare.

É **lacuna de extração, não de PO**: o PO declara as quatro. A correção não é deste arquivo (o
documento precisa dar a cada tabela o seu bloco) — fica registrada em `[Preencher: dar à tabela por
aluna do PO do Duo um bloco próprio, para a extração pegá-la]`.

## A forma canônica não está nos `-dados.json`

`linhaDeBase` **não** aparece em nenhum `*-dados.json`. Medido: **0 ocorrências** em
`professores/tiago/ciclos/ciclo-01-duo-dados.json`, `professores/tiago/ciclos/ciclo-01-ritmos-dados.json`
e `professores/fokini/ciclos/ciclo-01-diaghilev-dados.json` — cujas chaves são
`[ciclo, escola, professor, criado_em, ultimo_lancamento, apelidos, aulas, _nota]`.

O dado por aluna vive no **PO** e no **JSON extraído do PO**. O `-dados.json` guarda os
**lançamentos**, não a linha de base.

---

# Consentimento — estrutura com lacunas

**Estado: ESTRUTURADO COM LACUNAS — NÃO FECHADO.** Nada aqui é texto jurídico. O que existe é a
**estrutura** do consentimento e as lacunas que dependem de decisão da pesquisadora; a redação de cada
uma está marcada `[Preencher: …]`. **Não há cláusula redigida neste arquivo.** O artefato é
[`consentimento.md`](consentimento.md), na raiz deste diretório.

## Por que ele existe

O campo grava dados de **menores de idade**: o instrumento pede faixa etária e a primeira faixa é
`☐ 3–6` (`2026-10-03-ritmos/formulario.md:16`), até `☐ 14–17`. A **P-12** resolve o **repositório** —
sujeito entra por apelido estável, nome e contato fora do Git — e **não** resolve o **consentimento de
responsável**. Medido: não existia termo de consentimento, TCLE ou assentimento em nenhum `.md` deste
repositório.

## Por que na raiz de `campo/`, e não dentro de um evento

O padrão que este `README.md` fixa (linhas 9–19) é **`AAAA-MM-DD-<escola>/` — um diretório por evento
de campo** —, contendo `formulario.md` (o instrumento **como foi aplicado**), `respostas.md` (as
respostas, digitadas, sem nome nem contato) e anexos. O consentimento **não é resposta** nem
instrumento-aplicado: é a **condição prévia** de qualquer evento, com a mesma estrutura em todos eles —
mudam só os campos que a pesquisadora preenche. E os diretórios de evento são material bruto "como foi
aplicado", que a regra 1 não reescreve.

Daí a decisão: **raiz de `campo/`**, ao lado do `README.md` que o descreve, e não em `biblioteca/` —
o guia compartilhado do professor é de lá, mas consentimento é material **de campo**, aplicado por
evento e por professor, não um guia compartilhado.

> `[Preencher: se a orientação jurídica exigir uma via assinada versionada por evento, decidir se ela
> entra no diretório do evento (`AAAA-MM-DD-<escola>/`) ou se fica fora do Git, como o nome e o
> contato (regra 2).]`

## O que o projeto faz com o dado — medido, e por isso afirmável

Isto **não** é decisão jurídica: é o que está no código e nas regras hoje, e sustenta qualquer redação
que a pesquisadora venha a escrever.

| Camada | O que acontece | Onde está medido |
|:--|:--|:--|
| **Apelido** | o sujeito entra e permanece por apelido estável, o mesmo ao longo do ciclo, sem consulta a mapa externo. Nunca nome completo, contato ou dado de saúde em claro | P-12; `.github/instructions/ciclo-fontes.instructions.md` |
| **Nome e contato** | o bloco de interesse do instrumento (seção 9, opcional) pede nome e contato; esses dados ficam **fora** do Git, em arquivo local. Na transcrição entra a resposta, sem identificação | este `README.md:30–32`; `2026-10-03-ritmos/formulario.md:154–178` |
| **No repositório** | o repositório é **privado** (GitHub) — protege PO, relatórios, cadernos e `.md`. É ação **manual** da pesquisadora; até ela existir, valem as camadas abaixo | `CONGELAMENTO.md`, "Política de segurança dos dados sensíveis" |
| **No pacote publicado** | o PDF do ciclo sai **sem** os acompanhamentos; os acompanhamentos HTML vão **cifrados** (PageCrypt) e pedem senha; os `.md` de acompanhamento ficam **fora do Git** | `CONGELAMENTO.md`, idem |
| **JSON de lançamentos** | o `-dados.json` publicado no pacote é cifrado **por inteiro** (`{_cifrado, lancamentos, _nota}`), com a mesma senha e o mesmo esquema dos acompanhamentos; a senha vem por variável de ambiente, não por argumento | `tools/cifrar-dados.js`; `ARQUITETURA-CAPTURA.md` §5 |
| **Quem acessa** | só o professor, com senha | `ARQUITETURA-CAPTURA.md` §5 |

> **Lacuna medida, não resolvida aqui.** `ARQUITETURA-CAPTURA.md` §5 registra: "Fora do Git? Decisão
> pendente — ver seção 7". A decisão continua pendente. O que a tabela acima afirma é o que o código
> faz hoje — não o que foi decidido.

## As lacunas — decisão da pesquisadora

Cada item abaixo é decisão jurídica. Nenhum foi redigido no lugar dela.

- **A quem o termo se dirige e quem assina** — `[Preencher: o responsável legal pela aluna menor; a
  própria aluna quando maior; as duas vias, se for o caso]`
- **Quem assina sozinho, a partir de que idade** — `[Preencher: idade de consentimento autônomo e o
  que se aplica entre essa idade e a maioridade]`
- **Base legal** — `[Preencher: enquadramento aplicável a dados de menores. A LGPD dedica o art. 14 a
  dados de crianças e adolescentes; conferir o texto e o enquadramento com quem orienta a pesquisa —
  este arquivo não o interpreta]`
- **Assentimento da própria aluna** — `[Preencher: se há, além do consentimento do responsável, e a
  partir de que idade]`
- **Finalidade declarada** — `[Preencher: a redação da finalidade. O que se pode afirmar é o que o
  projeto faz — registra o cotidiano da aula para memória do professor; a formulação é da pesquisadora]`
- **Por quanto tempo o dado fica** — `[Preencher: prazo de retenção]`
- **Como se pede a exclusão** — `[Preencher: canal, forma do pedido e prazo de resposta]`
- **Quem é o responsável pelo tratamento** — `[Preencher: controlador e contato — e onde essa
  informação fica, sabendo que não é neste repositório, pela própria regra 2]`
- **O que acontece com o dado ao fim do prazo** — `[Preencher: eliminação, anonimização ou guarda]`
- **Se a recusa impede a participação** — `[Preencher: o que se decide é se o campo pode ser aplicado
  sem o termo]`
- **Onde ficam as vias assinadas** — `[Preencher: e como se liga cada via ao apelido sem criar mapa
  externo em claro]`

**O consentimento não está fechado.** Enquanto as lacunas acima estiverem em aberto, não há termo
aplicável ao campo — e isso é uma lacuna **declarada**, não um consentimento existente.

---

# O formulário de campo da aula

O que está descrito acima é **outro instrumento**. Este diretório guarda o **instrumento de
eliciação**: o questionário aplicado a **outros professores**, para entender como eles organizam suas
aulas. Existe um terceiro artefato — o **formulário de campo da aula**, a folha que **a aula devolve**
—, e ele **não** mora aqui.

## O que é

É a folha que o professor usa **durante** a aula, impressa, para marcar. Não é questionário nem
transcrição: é uma folha de **marcação**, e o que ela marca são **âncoras de memória** — depois da
aula, o professor escreve a partir delas. Ela mesma o declara no cabeçalho
(`professores/fokini/ciclos/ciclo-01-diaghilev-captura-aula-01.md:12–13`):

> **Durante a aula, marque; depois, escreva** — as marcas são âncoras de memória, não classificação
> (P-06). Marcação: ✓ aconteceu · ~ parcial · X não aconteceu · ? não vi · vazio = não observei.

## Onde ele vive, e por que não aqui

Vive em **`professores/<professor>/ciclos/`**, com o sufixo da escola:
`ciclo-XX-<escola>-captura-aula-NN.md` — **uma folha por aula** (`captura-aula-01`, `captura-aula-02`, …).
Exemplos reais: `professores/tiago/ciclos/ciclo-01-ritmos-captura-aula-01.md` (141 linhas) e
`professores/fokini/ciclos/ciclo-01-diaghilev-captura-aula-01.md` (89 linhas).

Ele é **fonte de ciclo**, não material de campo — e a diferença é medida, não de estilo.
`tools/hash-ciclo.sh:18–45` declara que a âncora `.fipp` cobre **apenas fontes**: `ciclo-XX.conf`,
`ciclo-XX-<variante>.conf` e os `ciclo-XX-*.md` que não sejam de outra escola (as saídas — HTML, PDF —
não entram, porque são reconstruíveis, P-04). Os `ciclos/*.md`, portanto, **entram na âncora**; os
arquivos deste diretório (`campo/`) **não** entram. A folha de captura é fonte; o material de campo,
não.

**Ciclo de vida da folha:** alterada em `ciclos/`, ela segue o fluxo das fontes — `tools/gerar-ciclo.sh
<professor> <ciclo> <escola>`, depois `node tools/check-pacote.js professores/<professor>/ciclos/ciclo-XX-<escola>`
e, por fim, a reancoragem com `tools/hash-ciclo.sh <professor> <ciclo> <escola>` (confirmar com
`--check`). Na geração, a folha é validada contra `professores/<professor>/ciclos/ciclo-XX-captura-schema.json`
e escrita como `captura-aula-NN.json` no pacote (`tools/gerar-ciclo.sh:262–268`), que é copiado para
`captura-<ciclo>.json` (`:275–276`).

## A distinção dos três instrumentos

O ciclo é **planejar → dar → lançar**. A folha de captura é o instrumento da **aula**; a tela de
lançamento é o instrumento do **depois**:

| Peça | Quando | Onde vive | O que é |
|:--|:--|:--|:--|
| **Formulário de campo** (este diretório) | antes / fora da aula, aplicado a **outros** professores | `campo/AAAA-MM-DD-<escola>/formulario.md` | instrumento de **eliciação** — pergunta o que já existe na prática de quem responde |
| **Formulário de campo da aula** (folha de captura) | **durante** a aula, na mão do professor | `ciclos/ciclo-XX-<escola>-captura-aula-NN.md` | folha de **marcação** — o que a aula devolve; é **fonte** de ciclo |
| **Tela de lançamento** | **depois** da aula | `tools/templates/lancamento.html` (software) | o professor lança o que observou; lê o PO — a linha de base, por aluna — e a captura |

A folha de captura **não** é lançada: ela é preenchida à mão, e o que ela marcou alimenta o lançamento.
E a folha **não** é análise: as marcas são âncoras de memória (P-06).

## A forma da folha — o que ela de fato tem

Medido nas duas folhas reais citadas acima:

- **Frontmatter** com `projeto`, `frente: Captura`, `ciclo`, `aula`, `escola`, `title` ("Captura em
  aula — Aula NN — para impressão"), `subtitle` ("Folha de marcação para uso durante a aula") e `data`.
- **A legenda de marcação** e a regra "marque durante, escreva depois" (`✓ · ~ · X · ? · vazio`).
- **Data, presentes, início, fim, duração efetiva** — os presentes por **apelido**, em caixa de
  marcação.
- **Condições de contorno (P-11)**: "Plano seguido?", ânimo/interesse/harmonia em escala, e o campo
  **"O que mudou em relação ao plano"** — o mesmo que a memória registra.
- **Um bloco por dimensão do ciclo**, com **uma tabela por bloco**, uma linha por aluna. Os blocos
  mudam por escola: a folha da Ritmos tem Bloco 1 Técnica, Bloco 2 Par (o que o ciclo tem de próprio),
  Bloco 3 Funcional, Bloco 4 Musicalidade e Bloco 5 Linha de base revisitada; a do Duo tem Técnica,
  Funcional, Musicalidade e Linha de base revisitada. Nunca se copia o bloco de uma escola para outra.
- **Um bloco "Linha de base revisitada" (P-10)** — é aqui que a folha encosta no PO: a tabela é
  `| O que o PO declara que ele/ela precisa desenvolver | Observado na aula |`, com **uma seção por
  aluna** (`### <Apelido>`). A folha da Ritmos registra a construção e a escolha da forma
  (`ciclo-01-ritmos-captura-aula-01.md:66–78`): as linhas vêm da seção "Linha de base" do PO **deste**
  ciclo — a versão anterior trazia as colunas do ciclo do Duo, e não as do Ritmos —, e a forma
  escolhida foi **"(b) — uma tabela por aluno"**, porque "o PO declara conjuntos diferentes para cada
  um e não há item comum aos quatro". Onde o PO não declara linha de base individual, a folha **não
  inventa**: ela escreve `[Preencher: o PO não declara linha de base individual da Mari — a seção
  cobre quatro alunos. Sem linha de base, não há o que revisitar.]` (`:124–125`) e marca que as alunas
  flutuantes não têm linha de base declarada (`:127–130`).
- **Notas soltas**, **Fecho da aula** (blocos executados / estrutura, duração executada contra a
  planejada) e **Abandonado? / Materiais**.

A folha espelha a regra de forma das fontes de ciclo — **lista → uma linha por item, nunca prosa**
(`.github/instructions/ciclo-fontes.instructions.md`, "Listas e tabelas têm forma contratual"). É por
isso que a linha de base entra nela como **tabela**, e não como frase: escrita como prosa, o item
vira trabalho manual depois — na folha e no lançamento.

## Relação com o protocolo (o formulário de campo da aula)

| Peça | Papel |
|:--|:--|
| **P-17** | cada ciclo entrega os mesmos tipos de artefato, incluindo a captura em aula — a folha não é opcional |
| **P-10** | é o PO que declara a linha de base; a folha só **revisita** o que o PO declarou, aluna por aluna |
| **P-11** | as condições de contorno (plano seguido, o que mudou, ânimo/interesse/harmonia) são preenchidas na própria folha |
| **P-06** | as marcas são âncoras de memória, não classificação — a folha não avalia |
| **P-04** | a folha é **fonte**; o `captura-aula-NN.json`, o HTML e o PDF são saídas reconstruíveis |
