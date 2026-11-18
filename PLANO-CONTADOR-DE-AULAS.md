# Plano — o contador de aulas

> **O que este documento é.** O desenho do contador que a unidade comercial de 17/11/2026 exige. Ele
> **não** está implementado: o que existe hoje está medido (§1), o que falta está desenhado (§3–§6)
> e o que depende de uma decisão dela está declarado como tal (§7). Cada afirmação sobre o código
> traz o caminho e a linha; nada foi preenchido por dedução.
>
> **A pergunta que ele responde.** «Quantas aulas esta escola processou neste mês?» — porque a
> franquia é de aulas (100 · 300 · 800), a renovação é mensal e não cumulativa, e o que passar da
> franquia é **excedente que se paga**. Sem esse número, a franquia é um número no ecrã.

---

## 1. O que já existe — medido

O contador não começa do zero. **O facto por aula já é registado**, e a contagem por ciclo já é
calculada; o que não existe é a agregação por escola e por mês.

### 1.1 A expectativa: o calendário do ciclo

| O quê | Onde | O que diz |
|:--|:--|:--|
| `TOTAL_AULAS`, `FREQUENCIA`, `DIAS`, `DURACOES`, `DATA_INICIO` | `professores/<prof>/ciclos/ciclo-NN-<escola>.conf` | **quantas aulas o ciclo prevê** e em que dias. É a estimativa, declarada no manifesto |
| o mesmo, por omissão, ao criar escola | `tools/criar-escola.sh:41` | `TOTAL_AULAS="5"` |
| a leitura e a obrigatoriedade | `tools/gerar-ciclo.sh:138` | os seis campos são exigidos: sem eles não há calendário |
| o `DIAS` do plano aplicado ao manifesto | `motor/servidor/escrever-ciclo.js:377` | o plano pode trazer os dias, e eles vencem a omissão |

**Esta é a expectativa que nasce quando o ciclo é criado** — e é ela que dá o alerta antecipado
(§4), não a contagem.

### 1.2 O índice por aula: a lista, com o facto e a janela

`tools/gerar-ciclo.sh:573-592` escreve, por aula, `n`, `data`, `inicio`, `fim`, `prazo`, `lancada`,
`marco` e (quando há folha) `config`. E o próprio ficheiro declara a regra que aqui importa:

> «O QUE FICA: o FATO (`lancada`, booleano — está ou não está no JSON de dados) e a JANELA
> (`prazo`, do calendário). O juízo, que precisa de um «agora», faz-se onde há um agora.»
> — `tools/gerar-ciclo.sh:562-564`

**`lancada` é o primeiro contador, e já existe.** Diz «esta aula está no JSON de dados», e não diz
nada sobre quando — a data da aula é `data`, e é ela que dá o mês.

### 1.3 O estado derivado: os quatro nomes, e onde se calculam

`planejada` · `dada` · `lancada` · `nao_dada`, derivados do cronograma, do prazo e do registo. O
gerador **não** os grava (`gerar-ciclo.sh:552` — «NINGUÉM OS LÊ»), e quem os calcula é o formulário
(`estadoDaAula()`), com o relógio da página. Ver `ARQUITETURA-AULA.md` §1.

### 1.4 O FATO: o JSON de dados, e a contagem que já corre

`motor/nucleo/derivar-ciclo.js:1388` — citado:

```js
const lancadas = Object.keys(aulas).length;
```

O `-dados.json` tem `aulas: { "01": { data, presentes, ausentes, duracao_min, condicoes_contorno,
…, ultimo_lancamento }, … }`, e **a chave é o número da aula**. Preservado entre gerações
(`derivar-ciclo.js:1363-1372`: uma fonte derivada não apaga o material).

A fusão de um lançamento é `fundirAulas` (`motor/servidor/acervo-lancamentos.js:87`), e ela tem uma
regra que o contador **tem de respeitar**: a aula que chega vence, **mas só se não for mais antiga**
— o carimbo `ultimo_lancamento` é comparado em texto. Um relançamento da mesma aula **não** é uma
segunda unidade.

### 1.5 O que já nasce sozinho: a aula 01

`motor/servidor/escrever-ciclo.js:588` chama `derivarAula01(...)` na geração do ciclo. **A primeira
aula nasce com o ciclo**, e é por isso que ela é a mais caro de todas, como a proprietária disse:
«ele é o primeiro que nasce. Então ele envolve maior tempo de consumo no GitHub.»

### 1.6 O resumo do estado, com honestidade

| peça | existe? | evidência |
|:--|:--|:--|
| o facto por aula (`lancada`) | **sim** | `gerar-ciclo.sh:583` |
| a contagem por ciclo (`lancadas`) | **sim** | `derivar-ciclo.js:1388` |
| a data de cada aula | **sim** (`data`, `inicio`, `fim`) | idem |
| a estimativa (`TOTAL_AULAS`) | **sim** | o `.conf` |
| a agregação **por escola e por mês** | **não** | não encontrado em `motor/`, `tools/` |
| a comparação com a **franquia** | **não** | `comercial.situacaoDaFranquia` recebe `aulasUsadas` de fora e ainda ninguém lho dá |
| o estado calculado uma vez, no servidor | **não** | hoje é o browser que o recalcula |

**Tradução:** o dado está lá, por aula e por ciclo. Falta **somar** — e é só isso que o contador é.

---

## 2. A definição: o que é «uma aula processada»

A unidade que debita a franquia tem de ser uma, e o §ADITIVO §6 já a nomeia: **uma unidade por
aula/sessão pedagógica**, «independentemente de quantas operações técnicas internas sejam necessárias
para preparar, editar, validar, registrar ou processar essa mesma sessão».

**A regra, na forma que a implementação pode testar:**

> **Uma aula conta quando está no `aulas` do `-dados.json`, uma vez por número de aula.**

O que isso resolve, caso a caso:

| o gesto | conta? | porquê |
|:--|:--|:--|
| o ciclo é gerado (e a aula 01 nasce) | **sim, 1** | há um lançamento na origem … **ver §7, C25** |
| «Guardar» do lançamento da aula 03 | **sim, 1** | `aulas["03"]` aparece |
| regravar a aula 03 (ajuste) | **não** | a chave já existe; `fundirAulas` funde |
| regerar o pacote (o botão «Gerar os documentos») | **não** | a geração preserva `aulas` (`derivar-ciclo.js:1363-1372`) |
| reprocessamento por falha do sistema | **não** | não há chave nova |
| aula `nao_dada` (o prazo venceu sem registo) | **não** | não há registo — é o que sobra, e não um acto |

**E há um segundo número, que não se confunde com o primeiro:** a **aula criada** (o documento de
plano da aula existe) e a **aula processada** (o registo dela entrou). A proprietária distingue-os:
o contador alimenta-se do segundo — «no momento em que a aula nasce de verdade, em que é gerado esse
formulário da aula. É ali que é a contagem da aula.» O primeiro é a estimativa, e serve o alerta.

---

## 3. O contador — o desenho

### 3.1 Onde ele vive

**Não no KV, e a razão é a mesma que fez o estado da aula sair do índice:** um contador gravado é um
número que pode divergir da fonte que o justifica. A fonte é o `-dados.json` de cada ciclo, que está
no repositório e é versionado; a contagem é **derivada** dele, como `lancadas` já é.

| alternativa | por que não |
|:--|:--|
| um contador no KV, incrementado no lançamento | dois escritores para o mesmo número: o lançamento incrementa, a consolidação do KV reescreve, e um resgate antigo (`fundirAulas`) pode fazer voltar uma aula — o contador fica a mentir e ninguém sabe |
| um campo no `-dados.json` (`total_processadas`) | é o mesmo número que `Object.keys(aulas).length`, guardado duas vezes — e o dia em que divergirem não se sabe qual vale |

### 3.2 O que ele soma

```
aulasProcessadas(escola, competencia) =
  Σ sobre os ciclos da escola
    Σ sobre as aulas do `-dados.json` desse ciclo
      1, quando `competencia(aula.data) == competencia`
```

- **A competência é a da DATA DA AULA**, e não a do lançamento. Uma aula de 30 de novembro lançada a
  2 de dezembro é de novembro — é a mesma regra do livro das mensalidades, e evita que a virada do
  mês faça uma aula saltar de franquia.
- **Uma aula de outro professor da mesma escola conta para a escola.** A franquia é **única por
  escola** e «soma as actividades de todas as suas salas e endereços» (§ADITIVO §1).
- **A aula não dada não conta** — não há registo.

### 3.3 O que já está pronto para o receber

`comercial.situacaoDaFranquia({ contrato, aulasUsadas })` já existe e já devolve os quatro estados
(`folga` · `perto` · `limite` · `passou`), o `excedente`, o `restantes` e a frase. **Falta um
argumento** — é este:

```js
// o único sítio que falta: dar o número a quem já sabe compará-lo
const aulasUsadas = await contarAulasDoMes({ escola, competencia });
const franquia = comercial.situacaoDaFranquia({
  contrato: await comercial.lerComercial(kv, escola),
  aulasUsadas,
});
```

E a distinção que a implementação tem de manter: **`aulasUsadas: null` ≠ `aulasUsadas: 0`.** Um zero
é uma afirmação («a escola não lançou nenhuma aula»); um `null` é «não contei». O
`situacaoDaFranquia` já os separa, e o cartão da escola já cala o consumo quando é `null`.

### 3.4 De onde vem o número, concretamente

Três leituras, e a mais barata primeiro:

1. **O índice do acervo.** `motor/nucleo/indices.js` já lista, por escola, os ciclos e as aulas com
   âncora (`aulas: ordenar(aulas, 'numero')`, `indices.js:626`). **Falta a `data`** — o índice
   guarda o `numero` e a âncora, e não a data da aula.
2. **O `ciclos.json` de cada ciclo**, que tem `aulas[].data` e `aulas[].lancada`. É a fonte da
   janela e do facto, e é a que serve o contador sem inventar nada.
3. **O `-dados.json`**, que tem a chave por aula e é a fonte do FATO.

**A leitura 2 é a que se recomenda:** `data` (o mês) e `lancada` (o facto) já estão no mesmo sítio, e
o `ciclos.json` é publicado no pacote de cada escola. As leituras 1 e 3 ficam como conferência —
e a conferência é obrigatória, porque um índice pode estar velho.

---

## 4. O alerta — antes de passar, e não depois

A estimativa (`TOTAL_AULAS`) dá o aviso **antes** de a franquia estourar, e é o que a proprietária
pediu: «a cada vez que isso acontece a gente tem uma ideia e a gente pode ter um alerta, ó, está
perto, está no limite, vai passar, e passou.»

**Dois números, dois papéis, e não se misturam:**

| número | de onde | o que diz | serve para |
|:--|:--|:--|:--|
| **previstas** | `TOTAL_AULAS` do `.conf` | quantas aulas o ciclo planeia | o alerta **antes** — «este ciclo prevê 40 aulas e a franquia tem 23 livres» |
| **processadas** | `aulas` do `-dados.json` | quantas aconteceram | o **excedente** — o que se cobra |

**A regra que a proprietária fixou, e ela é dura:** «se ela não vai dar aquele tanto de aula que ela
planejou ou se ela planejar menos do que o que ela contratou, é problema dela. Agora, se ela der mais
aulas do que o que ela contratou, tem um excedente.» Ou seja: **planear não custa nada, processar
custa.** A prevista não entra na conta do excedente — entra só no aviso.

---

## 5. O botão «criar a aula N» — o que falta, e porque não é só um botão

Hoje **a aula 01 nasce com o ciclo** (`escrever-ciclo.js:588` → `derivarAula01`). A aula 02 em diante
**não tem produtor**: o ciclo prevê N aulas, e o documento de cada uma só existe quando o pacote é
gerado com a `aula-NN.md` na fonte. O botão que ela quer — «criar aula dois, criar aula três, criar
nova aula» — é o que **gera o documento da aula seguinte a partir do lançamento da anterior**.

**A regra que já existe e manda na ordem:** o estado é derivado, e a `aula-NN.md` é a Intenção
enquanto `planejada` e o Facto depois de acontecer (`ARQUITETURA-AULA.md` §1.1). Logo:

| passo | o que acontece | o que o botão tem de garantir |
|:--|:--|:--|
| 1 | a aula N-1 foi lançada (`lancada`) | **é o pré-requisito**: sem o lançamento anterior, a linha de base da aula N não existe |
| 2 | o professor pede «criar a aula N» | o número vem do `aulas[]` do índice, e não de um contador à parte |
| 3 | o documento `aula-NN.md` é gerado | herda o marco do plano, a linha de base do último lançamento, e a data do calendário |
| 4 | a aula passa a `planejada` | CRUD livre até acontecer |
| 5 | o ciclo é republicado | **um** commit, um job — 1 minuto de cota |

**O que o botão NÃO pode ser:** um segundo lugar onde as aulas nascem. Se ele criar a aula no índice
sem o documento, o `aulas[]` e a fonte divergem — e o §2 define a contagem pelo **registo**, não pelo
índice. A ordem é: **documento primeiro, índice depois.**

**O que isto custa, medido:** gerar o pacote de um ciclo = **2 minutos facturados** (1 job, 110 s
p50). Criar a aula N e republicar são **1 a 3 minutos por aula**. À franquia de 100 aulas, o compute
da franquia inteira são ~200 minutos de 2.000 — o custo não é o problema; a **contagem** é que é a
unidade comercial.

---

## 6. A ordem da obra

| # | passo | depende de | entrega |
|:--|:--|:--|:--|
| 1 | `contarAulasDoMes({ escola, competencia })` — lê os `ciclos.json`, soma por data | — | o número |
| 2 | ligá-lo ao `situacaoDaFranquia` na rota da escola e na do painel | 1 | a franquia deixa de ser um número no ecrã |
| 3 | a conferência: índice × `ciclos.json` × `-dados.json` | 1 | uma prova que reprova quando divergem |
| 4 | o alerta das previstas (`TOTAL_AULAS`) | 1 | o aviso antes de passar |
| 5 | o excedente no Financeiro (o que se cobra) | 1, 2 | a linha da cobrança |
| 6 | o botão «criar a aula N» | 1 | o produtor que falta |
| 7 | a telemetria separada de cadastro (§ADITIVO §6) | — | o custo interno medido |

**O passo 1 é o único que o resto não dispensa**, e é pequeno: uma função pura que recebe os ciclos e
o mês, e devolve um número. Tudo o que está acima já existe para o receber.

---

## 7. As quatro perguntas — duas respondidas a 17/11/2026

Este plano deixou quatro perguntas abertas. A proprietária respondeu a duas, e a resposta a uma delas
fecha uma contradição que estava a mudar a capacidade do produto por um factor de 4.

### 7.1 A aula 01 conta? — **CONTA**, e não era pergunta

> «É claro que a aula um conta, que nasce com o ciclo. É a primeira aula, ela se chama aula um. É
> meio lógico isso.»

Tem razão, e a pergunta foi minha — não dela. A regra do §2 é a que vale, sem excepção: **uma aula
conta quando está no `aulas` do `-dados.json`**, e a aula 01 está lá desde o primeiro dia. O que a
pergunta tentava resolver era outra coisa, e fica dito para não voltar: **um ciclo gerado e nunca
usado consome uma unidade.** Isso é consequência da regra, não um defeito dela — a geração do ciclo é
o acto que cria a primeira aula, e é o mais caro de todos (2 minutos de Actions, medidos). Se um dia
incomodar, o remédio é comercial (o degrau de entrada tem folga de 7×, ver a C24 resolvida), e não um
contador que ignora o que aconteceu.

### 7.2 A C25 — **RESOLVIDA: conta-se 440**, e a prudência é dela

A contradição era esta: a escola no tamanho máximo gasta **110 aulas/mês** (a resposta que fechou a
C24, «5 por dia × 22 dias») ou **440** (§L9c, «20 professores × 1 aula/dia × 22 dias»)? Um factor de
4 que muda a capacidade de **13 escolas para 3**.

> «Depende, depende. Eu acho que a gente tem que contar com a capacidade **menor**, né? Para a gente
> ser prudente.»

**A decisão: 440 aulas/mês para a escola no tamanho máximo**, que é a leitura **conservadora** — 3
escolas na cota gratuita, e não 13. E ela acrescentou a razão pela qual o número real não se pode
saber hoje, que é a mais importante desta secção:

> «A escola vai gastar o 110 no mês é o valor da hora aula do professor que cobra por aula […] A
> gente não sabe como é que a escola vai adotar de fato dentro do seu negócio de verdade, se ela vai
> pagar percentual para o professor ou se ela vai pagar por hora aula.»

Ou seja: **o número não se deriva, porque depende de um modelo de negócio da escola que ainda não
existe.** A conta de «5 por dia» foi construída sobre um modelo (a hora-aula), e o modelo é uma
hipótese. Por isso a decisão certa é a prudente: **planear com o pior caso e medir com o contador**
quando houver escolas a lançar. O `planos.json → teto.aulas` fica **null** na mesma — não por indecisão
agora, mas porque um teto comercial é uma promessa, e a promessa é a franquia (100/300/800). O que a
C25 decidia era a **capacidade da infraestrutura**, e essa está decidida: 3 escolas no tamanho máximo.

### 7.3 O que fica aberto, e são duas

3. **O que acontece a um mês sem pagamento e com aulas processadas.** O excedente de um mês em aberto
   soma-se à dívida? Fica suspenso? O §ADITIVO não o diz, e a L11 (a porta paga) é quem o decide.
   *(Não foi perguntado, e não se decide por dedução.)*
4. **O `ensaio` e a franquia.** O relógio comprimido move os meses das mensalidades; a franquia é do
   mês civil. O plano **não os liga**, e a razão está escrita: uma franquia que muda de tamanho
   enquanto se testa não se pode comparar com nada. O ensaio **nasce desligado** numa escola nova, e
   ligado começa no mês que não está pago — medido em `provar-a-escola-que-nasce` (25 asserções).

---

## 8. A prova que este plano exige

Quando o passo 1 existir, a prova tem de fixar seis coisas — e cada uma reprova um defeito que já
aconteceu nesta casa:

1. **Um lançamento conta 1**, e regravar a mesma aula continua a contar 1 (o `fundirAulas`).
2. **Regerar o pacote não conta** — a geração preserva `aulas`, e o contador não pode ver ali uma
   aula nova.
3. **A competência é a da data da aula** — uma aula de 30/11 lançada a 02/12 é de novembro.
4. **A aula não dada não conta** — não há registo, e o contador não inventa.
5. **`null` ≠ `0`** — sem contagem, o cartão cala; com contagem, diz.
6. **A soma é inteira ou não é** — a mesma regra do painel: um contrato sem contagem faz o total do
   parque ser `null`, e não uma parte apresentada como o todo.
