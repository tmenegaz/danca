# Arquitetura da aula — o ciclo de vida, o prazo e a âncora por aula

> **Resumo (para o HANDOFF):** o ciclo de vida da aula (planejada → dada → lançada →
> ajustada), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por
> aula. Não implementado.

> **Documento de desenho.** Escrito em 23/09/2026, ao fim da conversa que definiu as
> regras. **Nada disto está implementado**: o que existe hoje está descrito em cada seção
> como "hoje", e o que se propõe como "proposto". O par de conceito está em
> `IDEIA-CAPTURA.md` (o porquê) e `ARQUITETURA-CAPTURA.md` (o como do JSON); este documento
> cobre **a aula como unidade** — o que ela é antes e depois de acontecer.

## 1. O ciclo de vida da aula

A aula tem **três estados**, e o que se pode fazer com ela depende do estado. O corte não
é a data: é **o ato de dar a aula**, declarado pelo professor.

| Estado | Como é reconhecido | O plano da aula | O lançamento |
|:--|:--|:--|:--|
| **Planejada** | existe a fonte `aula-NN.md`; o índice a declara | **intenção** — CRUD livre | não existe |
| **Dada** | o professor **declara** "aula dada" | **passa a fato** | o formulário é gerado |
| **Lançada** | existe o registro no JSON de dados | só **ajuste** | só **ajuste** |

**A declaração "aula dada" é o ato que institui o fato.** Ela não é uma formalidade: é o
que separa intenção de memória, e tem consequência fora do sistema — é o **indicativo de
folha de ponto**. Se o professor não declara, ele não recebe por aquela aula. O sistema
não precisa fiscalizar: a consequência é do processo, não do software.

**O que o sistema não faz.** Ele não julga por que o professor demorou a lançar, nem
verifica se ele guardou o material num papel, num vídeo ou na memória. Isso **não é
problema do sistema** — é do professor. O sistema faz o corte e declara o estado.

### 1.1 A regra, em uma linha

> **Aula não dada: CRUD comum. Aula dada: só ajuste — de jeito nenhum CRUD.**

E o ajuste, nos dois objetos (o plano e o lançamento), é o **mesmo mecanismo**: o anterior
permanece, o novo é um elo, e o **diff é a justificativa** — sem campo de motivo
obrigatório. O professor tem autonomia para mudar o plano seis horas antes da aula; o que
ele não tem é o direito de apagar que houve um plano antes.

### 1.2 Por que o diff basta

A cadeia de custódia é lida pela **escola**, e o que ela quer saber é *que decisões o
professor toma, que dificuldades ele tem, que caminho segue* — e se ele tem autonomia para
mudar. O diff responde isso sem que ninguém precise justificar por escrito: a mudança já
é o dado. Pedir justificativa transformaria autonomia em burocracia.

## 2. A linha de corte

> **A linha de corte de uma aula é o registro da última aula que teve dado — por ORDEM DE
> LANÇAMENTO, não por número de aula.**

Os dois cenários, que definem a regra:

| Cenário | Aula 01 | Aula 02 | Aula 03 | Linha de corte da aula 03 |
|:--|:--|:--|:--|:--|
| **A** | não dei | **dei** | — | o registro da aula **02** |
| **B** | **dei** | pulei | **dei** | o registro da aula **01** |

A aula pulada **não é uma falha**: é uma ausência legítima. A corrente simplesmente não tem
aquele elo, e segue da última observação real. Isso também responde o caso do lançamento
atrasado: se o professor lança a 02 **depois** de dar a 03, por ordem de lançamento é a 02
que passa a ser a linha de corte — porque a ordem pedagógica é a das aulas, não a da
digitação.

**O que já existe.** Em `tools/lib-vistas.js`, o acompanhamento já faz isto — filtra as
aulas com dado e pega a última:

```js
const comDado = aulas.filter((k) => !dados.aulas[k].ausentes.includes(chave));
const ultima = comDado[comDado.length - 1];
l.push(`*(Última observação registrada — fonte: aula ${ultima}, de ${dataBr(a.data)}.)*`);
```

A regra existe **como leitura**, e morre no documento (a comparação com a linha de base
está declarada como `[Preencher]`). O que falta é ela **alimentar** o formulário da aula
seguinte — e é isto que este desenho resolve.

**A base inicial.** O PO declara a linha de base **antes** do ciclo (P-10) — o estado
inicial dos sujeitos. É dela que a primeira aula parte. Depois da primeira aula lançada, a
linha de corte desloca: passa a ser a última observação.

## 3. O prazo

### 3.1 A fórmula

O prazo para lançar **não é fixo em 48h**: ele é calculado do cronograma, que o sistema já
produz.

```
fim do bloco      = fim da ÚLTIMA aula daquela data (aula dupla lança-se uma vez só)
próxima data      = a próxima DATA de aula (não a próxima aula)
prazo             = menor entre
                      (a) 24h antes da próxima data de aula
                      (b) fim do bloco + 18h          ← piso: tempo hábil
```

O **piso de 18h** existe para o caso denso (aula às 20h, próxima às 8h): o professor tem de
ter tempo hábil para lançar. Ele foi calibrado com a pesquisadora como *"dezoito horas
atende bem"*.

### 3.2 O que a medição mostrou

Rode a fórmula contra os três ciclos reais do repositório (`tools/calendario.py` dá as
datas):

| Ciclo | Cronograma | Janela que resulta |
|:--|:--|--:|
| **Duo** | sextas, 1x/semana (gap 7d) | **143 h** — vale "24h antes" |
| **Diaghilev** | ter e qui (gap 2d) | **23 h** |
| **Diaghilev** | qui → ter (gap 5d, fim de semana) | **95 h** |
| **Ritmos** | sábado com **2 aulas na mesma data** | **47 h** |
| **Ritmos** | ter → sáb (gap 4d) | **71 h** |

**O caso que a regra ingênua quebrava.** O Ritmos tem `DIAS="2,6,6"` — terça com 1 aula e
sábado com **duas, na mesma data** (medido: **7 datas com mais de uma aula** num ciclo de
21). A regra "24h antes da próxima *aula*" dava **−24h**: a "aula seguinte" seria no mesmo
dia, e o prazo fecharia antes de a aula acontecer. A correção é o **bloco**: as aulas da
mesma data contam como uma, e o prazo sai da **última** delas — que é quando o professor
termina e vai lançar.

### 3.3 Duas regras que fecham os casos-limite

- **A aula pulada não tem prazo.** Não houve aula, não há o que lançar. Como o prazo mora
  **na aula** (não no ciclo), a aula pulada simplesmente não o tem — e não afeta nada.
- **A última aula do ciclo tem o MAIOR prazo já praticado nele.** Não há "próxima aula" de
  onde contar, então o número vem do próprio ciclo: se as aulas são semanais, ela tem uma
  semana; se são de dois em dois dias, tem dois dias. O professor já está acostumado àquele
  ritmo, e o fim do ciclo não o muda. Medido: Duo **143 h**, Diaghilev **95 h**, Ritmos
  **71 h**.

**Os prazos são independentes.** Cada prazo é função de duas datas — a daquela aula e a da
próxima. Nenhum prazo entra na conta de outro. Medido na Diaghilev:

```
aula 01  06/10 ter  →  prazo qua 07/10 19:00
aula 02  08/10 qui  →  prazo seg 12/10 19:00
aula 03  13/10 ter  →  prazo qua 14/10 19:00
```

Ou seja: **pular a 02 não desloca o prazo da 03.** O prazo que estoura é o da aula pulada,
e ele não existe.

### 3.4 A data de fechamento (opcional)

O `.conf` pode declarar uma **data de fechamento** — a data em que a escola exige os dados
completos. Se o campo estiver preenchido, o sistema **valida**: todos os lançamentos até
ali. Se não estiver, valem os prazos por aula.

```
FECHAMENTO="20/12/2026"     # opcional; vazio = só os prazos por aula
```

É o gancho da escola no ciclo — e é o que liga este desenho ao painel de gestão (§7).

## 4. O índice por aula

### 4.1 O que existe hoje (e o defeito)

O índice que o formulário lê (`ciclos.json`) declara o ciclo, **não** as aulas:

```json
{ "id": "01", "escola": "Diaghilev", "inicio": "2026-10-06", "fim": "2026-10-15",
  "total_aulas": 4, "duracao_min": 60, "arquivo": "ciclo-01-diaghilev-dados.json" }
```

`total_aulas: 4` é **só o número** — não há identidade por aula. E disso decorrem dois
defeitos medidos:

**Defeito 1 — o config da captura é um por ciclo, não um por aula.** O gerador extrai
**só** a folha da aula 01 (`$(fonte_md captura-aula-01)` → `captura-01.json`) e a página
monta esse mesmo painel em **qualquer** aula. Medido com o ciclo simulado da Diaghilev, que
tem **quatro folhas com colunas diferentes**: os quatro formulários saem **idênticos**,
todos com as colunas da Aula 01. Entregando a config da aula certa, saem **quatro
diferentes** — a prova está em `experimentos/provar-por-aula.js`.

**Defeito 2 — as folhas 02..N não são fontes.** O `DOCS` do manifesto é uma **lista à
mão**, herdada de quando só a primeira aula estava escrita. Medido:

```
DOCS declara:   captura-aula-01       (só a 01)
no disco:       captura-aula-01..04   (as 4 existem)
no .fipp:       captura-aula-01       (só a 01 é FONTE)
```

Consequência: **apagar a folha da aula 02 não quebra a âncora** — ela não é fonte, e o
`--check` passa. As folhas 02–04 existem no disco e o sistema **não as vê**.

### 4.2 O proposto

O índice passa a declarar **uma entrada por aula** — é o que faz "o formulário da aula N
nascer do que é da aula N":

```json
{
  "id": "01", "escola": "Diaghilev", "total_aulas": 4,
  "aulas": [
    { "n": "01", "data": "2026-10-06", "inicio": "19:00", "fim": "20:00",
      "marco": "Isolar o eixo vertical e a distribuição do peso...",
      "estado": "dada", "lancada": true,
      "config": "captura-aula-01.json", "ancora": "ciclo-01-diaghilev-aula-01.fipp",
      "prazo": "2026-10-07T19:00" },
    { "n": "02", "data": "2026-10-08", "estado": "planejada", "prazo": "2026-10-12T19:00" }
  ]
}
```

**É 100% derivável do que já existe** — verificado:

| Campo | De onde sai |
|:--|:--|
| `data`, `inicio`, `fim` | `calendario.py` (datas) + `DIAS` com hora (§6) |
| `marco` | `plano.md` → `marcosPorAula` (extraído por `validar-plano-ciclo.js`) |
| `estado`, `lancada` | o ato declarado + o JSON de dados (`aulas['02']`) |
| `config` | a folha da aula (`captura-aula-NN.md` → `captura-aula-NN.json`) |
| `ancora` | o `.fipp` da aula (§5) |
| `prazo` | §3 |

Nada disto precisa ser escrito à mão: o índice é **pré-produzido** pelo gerador, a partir do
plano, do calendário e do `.conf`.

## 5. A âncora por aula

### 5.1 O que existe hoje

**Um `.fipp` por ciclo**, e o hash cobre as fontes todas num **hash de conteúdo único**.
Medido: apagar a fonte `aula-02.md` é detectado (`a lista de fontes cobertas mudou`), mas o
hash **não diz qual aula** mudou — é um número só para o ciclo inteiro.

E o `.fipp` **não guarda data**: os campos são `id type professor ciclo variante
hash_conteudo parentHash hash algoritmo po po_state cobertura`. Sem data, ele não sabe dizer
*quando* ancorou — e portanto não distingue o plano mudado **antes** da aula (legítimo, CRUD)
do plano mudado **depois** (proibido, só ajuste).

### 5.2 O proposto

**Um `.fipp` por aula**, além do do ciclo:

```
professores/<p>/ciclos/ciclo-01-<escola>.fipp              o do ciclo (fontes comuns)
professores/<p>/ciclos/ciclo-01-<escola>-aula-01.fipp      o da aula 01
```

Ganhos, e cada um responde a um problema medido:

- **Atribuição.** Apagar a aula 02 vira **fato registrado** ("a âncora da aula 02 não tem
  par"), e não diferença de hash a decifrar.
- **Reancoragem cirúrgica.** Lançar a aula 03 reancora **só** a âncora da 03 — não o ciclo
  inteiro. Hoje, *"cada aula lançada provoca reancoragem"* do ciclo todo (ARQUITETURA-CAPTURA
  §7).
- **O corte antes/depois.** A âncora da aula, com data, é o que permite ao `pre-commit`
  distinguir o plano mudado antes da aula (deixa) do mudado depois (recusa). Sem isso, a
  regra do §1 não é verificável — só declarada.

## 6. O que precisa entrar na eliciação

### 6.1 A hora da aula

**Hoje o sistema não conhece hora.** Verificado: nenhum documento de ciclo tem hora, e o
Pré-requisito 5 exige `ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS` — só **dia**.

A hora entra na eliciação (que horas começa, que horas termina) e no manifesto, **junto do
dia** — decidido: a hora e o dia não podem divergir, então não podem ser listas paralelas:

```
DIAS="2@19:00,6@09:00,6@11:00"     # terça 19h · sábado 9h e 11h
```

**Custo declarado.** O `pattern` do schema é `^[1-7](,[1-7])*$` e **não aceita** o formato
novo. Muda: o schema (`ciclo-01-schema.json`), o `Pré-requisito 5` (congelado) e os três
`.conf` existentes. A opção de lista paralela (`HORARIOS=`) foi **recusada**: quem editasse
o `DIAS` sem o `HORARIOS` desalinharia, e o erro seria silencioso.

### 6.2 As perguntas novas na eliciação

`prompts/eliciar-ciclo.md` (congelado) precisa dos campos que este desenho usa: **hora de
início e de fim** de cada dia de aula, e — quando a escola exigir — a **data de
fechamento**.

## 7. O painel da escola — a outra face do mesmo dado

> Esboço. A ideia tem documento próprio: `IDEIA-PAINEL-ESCOLA.md`.

**Por que ele entra nesta arquitetura e não em outra.** O dado que o professor lança é o
mesmo que a escola precisa para gerir. O painel **não cria dado** — ele **relê** o que já
existe, com outro recorte e outra permissão. É por isso que as duas coisas são um só
desenho.

**Acesso.** Mesma solução de login e senha do formulário, restrita à direção. A senha já é
**por escola** (`SENHA_DUO`, `SENHA_RITMOS`…) — verificado em `tools/lib-senhas.sh` —, então
o modelo de acesso para o painel já está pronto.

**O que ele faz (esboço):** acompanha as aulas dadas por professor, turma, modalidade ou
disciplina; calcula horas trabalhadas × valor-hora; verifica a cadeia de custódia (o que
mudou e o que não mudou); e gera os relatórios que a escola quiser.

**A página pública da cadeia de custódia** — pais e alunos consultam o que mudou. É a
**prestação de contas** virada para fora.

**A correção de linguagem no painel.** O mecanismo existe (P-21): a IA corrige o juízo
mantendo o fato — *"essa aluna é muito ruim fazendo demi-plié"* vira algo com o fato
preservado e o juízo fora —, o professor revê a tabela bruto × harmonizado
(`ciclo-XX-<escola>-harmonizacao.md`, que já existe nos três ciclos) e pode manter o termo
original. No painel, essa tabela também fica visível: é como a escola vê **como o professor
fala dos alunos**. Não é censura — o sistema *oferece uma segunda chance de dizer o que se
quis dizer*, e preserva a primeira.

<!-- ...existing code... -->
### 7.1 A retenção — selar, não apagar

> **Remissão.** O painel da escola detalha o mesmo assunto em `IDEIA-PAINEL-ESCOLA.md` §7;
> aqui está o que toca **a aula**.

**Decidido (23/09/2026):** ao fim da retenção, o conteúdo é **selado**, não apagado. Isto
fecha a tensão com a regra do §1 — *"apagar é proibido, senão não há proveniência"*:
apagar quebraria a cadeia; **selar a preserva**.

- **A duração é política de cada escola** — o sistema entrega o **campo**, não decide o
  número (5 anos, cem, "pra sempre", ou o prazo que a lei exigir).
- **A retenção sobrevive ao contrato** — o material **não segue o vínculo**; é da escola.
- **O que sobrevive ao selamento é a âncora** (§5.2) — hash com metadados e nenhum
  conteúdo. É por isso que a prestação de contas pode durar "para sempre".
- **Selar não é apagar nem liberar** — o conteúdo sai da **custódia corrente** e passa a
  uma **política de acesso ao passado**.
<!-- ...existing code... -->

## 8. O que precisa descongelar

`CONGELAMENTO.md` congela a infraestrutura: só muda com **motivo declarado**, entrada no
`REGISTRO.md` e **commit próprio**. Este desenho toca:

| Arquivo | Por quê |
|:--|:--|
| `tools/lib-fontes.sh` | o `DOCS` derivado; a âncora por aula |
| `tools/gerar-ciclo.sh` | o índice por aula; o config por aula; o `captura-aula-NN.json` |
| `tools/hash-ciclo.sh` | a âncora por aula e a data na âncora |
| `tools/templates/lancamento.html` | ler a config da aula; a declaração "aula dada" |
| `tools/validar-captura-ciclo.js` | validar a folha de cada aula |
| `tools/check-pacote.js` | exigir o config de cada aula declarada |
| `tools/hooks/pre-commit` | distinguir plano antes × depois da aula |
| `PROTOCOLO.md` | **P-13 precisa de ajuste** (§9) |
| `prompts/eliciar-ciclo.md` | hora de início e fim; data de fechamento |

**A pesquisadora autorizou o descongelamento** (23/09/2026): *"vai ter que descongelar — a
gente vai ajustar o que tiver que ajustar; afinal de contas, a gente tá num protótipo"*.
Cada item exige, ainda assim, o seu motivo declarado e o seu commit.

## 9. P-13 precisa de ajuste

**O texto de hoje:**

> **P-13 — Cada professor tem o seu próprio PO.**
> O PO é do professor, não do projeto. Dois professores com a mesma escola, os mesmos
> alunos, o mesmo objetivo geral — ainda assim têm POs distintos, porque o recorte
> observacional é decisão de cada um. Um PO nunca é compartilhado entre professores. A
> cadeia FIPP preserva a separação: cada PO tem a sua âncora.

**O que ela acerta:** o PO é do professor, e o recorte é decisão dele. Isso foi
**confirmado** e é o eixo do sistema — verificado no modelo de acesso e na estrutura de
pastas.

**O que ela erra:** a oposição *"do professor, não do projeto"* é falsa e deixa de fora a
escola. O que a pesquisadora definiu é:

- **a organização e o lançamento são por professor** — é o professor que sabe o seu plano, é
  ele que lança, e a escola procura por ele (*"quero saber as aulas da professora Rita"*).
  Não raro o professor **é** o dono da escola;
- **o dado pertence à escola** — ela pagou pelo processo, e o professor **conduz**;
- **o acesso é por escola** — a senha é da escola.

O ajuste é **acrescentar a segunda e a terceira**, sem tocar no que a pétrea já diz bem. Ela
não precisa ser reescrita: precisa **deixar de sugerir** que o material não interessa a mais
ninguém.

**Motivo declarado:** a pétrea induzia à leitura de que o material é privado do professor,
quando o dado é custodiado pela escola. Mudança **cirúrgica e só de escopo** — nenhuma
outra pétrea, nenhuma regra e nenhum comando mudam.

## 10. As peças, na ordem

Ordenadas por dependência — cada uma destrava a seguinte:

1. **A hora no `DIAS`** (§6) — sem ela, o prazo não tem de onde contar. Toca o schema, o
   Pré-requisito 5 e os `.conf`.
2. **O `DOCS` derivado** (§4.1, Defeito 2) — conserta a raiz: as folhas 02..N passam a ser
   fontes só por existirem. É o que permite a 3.
3. **O config por aula** (§4.1, Defeito 1) — `captura-aula-NN.json`, um por aula, e a página
   lê o da aula do filtro.
4. **O índice por aula** (§4.2) — a estrutura que a 3 e a 5 consultam.
5. **A âncora por aula** (§5) — com data, para o corte antes × depois ser verificável.
6. **A declaração "aula dada"** (§1) — o ato; é o que gera o formulário.
7. **O prazo** (§3) — a fórmula, os prazos por aula no índice, a data de fechamento.
8. **O ajuste no plano** (§1.2) — o mesmo mecanismo do ajuste do lançamento, aplicado à
   fonte `aula-NN.md`.
9. **P-13** (§9) e a eliciação (§6.2) — os textos.
10. **O painel da escola** (§7) — ideia nova; documento próprio, para depois.

## 11. O que NÃO está decidido

- **A estrutura da tela do painel** (§7) — o esboço está em `IDEIA-PAINEL-ESCOLA.md`; o
  desenho fica para quando a ideia for amadurecida.
- **O que a página pública expõe** — pais e alunos veem "o que mudou"; **o quanto** disso
  (todo diff? só os ajustes? só os relatórios?) não foi decidido.
- **O valor-hora e o cálculo de pagamento** — o painel administra; **como** o valor entra e
  quem o declara não foi decidido.
- **A política de retenção** — por quanto tempo uma aula dada continua no sistema, e o que
  acontece com o ciclo quando a escola encerra o contrato do professor.

## Referências

- `ARQUITETURA-CAPTURA.md` — o desenho do JSON, a §5.1 (o ajuste com prazo) e a §7 (as
  decisões tomadas e as abertas)
- `IDEIA-CAPTURA.md` — o conceito
- `IDEIA-PAINEL-ESCOLA.md` — o painel de gestão e a página pública
- `PROTOCOLO.md` — as pétreas (P-09, P-10, P-13, P-21); `REGRAS.md` — as regras
- `CONGELAMENTO.md` — o que está congelado e como se altera
- `tools/lib-vistas.js` — a linha de corte, hoje só como leitura
- `experimentos/provar-por-aula.js` — a prova de que o config por aula produz quatro
  formulários diferentes
