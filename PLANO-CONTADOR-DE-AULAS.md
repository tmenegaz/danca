# Plano — o contador de aulas

> **O que este documento é.** O desenho do contador que a unidade comercial de 17/11/2026 exige.
> **O contador está implementado desde 25/11/2026** — ver §10, que diz o que ficou feito, com que
> números, e o que continua a ser obra (o botão «criar a aula N» e o plano de consultoria). O que
> existe hoje está medido (§1), o desenho está em §3–§6 e as decisões dela em §7. Cada afirmação
> sobre o código traz o caminho e a linha; nada foi preenchido por dedução.
>
> **A pergunta que ele responde.** «Quantas aulas esta escola processou neste mês?» — porque a
> franquia é de aulas (**130 · 320 · 500**, a escada decidida a 25/11/2026; o §ADITIVO registou
> 100 · 300 · 800 e está declarado histórico), a renovação é mensal e não cumulativa, e o que passar
> da franquia é **excedente que se paga**. Sem esse número, a franquia é um número no ecrã.

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

## 7. As quatro perguntas — todas respondidas a 17/11/2026

Este plano deixou quatro perguntas abertas. A proprietária respondeu às quatro, e uma delas fecha uma
contradição que estava a mudar a capacidade do produto por um factor de 4. **A ordem em que ficam é a
da decisão, e não a da pergunta.**

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
agora, mas porque um teto comercial é uma promessa, e a promessa é a franquia (130/320/500, a escada
de 25/11/2026). O que a C25 decidia era a **capacidade da infraestrutura**, e o consumo dela está
decidido: **440 aulas/mês** para a escola no tamanho máximo.

**E o número que dela se deriva está em correcção, declarada a 27/11/2026.** Os «3 escolas no tamanho
máximo» do §L9c foram calculados a **1 min por aula** (`(2 000 − 522) ÷ 440 = 3,4`). Com a unidade
**medida** — **2,0 min por aula** — a mesma conta dá `1 478 ÷ 880 = 1,7`: **uma escola**, e não três.
A decisão da C25 (contar 440) não muda; o que muda é a capacidade que dela se tira, e é **menor**. O
§L9c continua a carregar o número antigo até ter a sua própria medição da engenharia, e esta nota
declara a divergência em vez de a esconder.

### 7.3 A inadimplência — a escada, e quem a percorre

> «A escola não pagou um mês, ela fica inadimplente. […] não pagou três meses, tá inadimplente, aí eu
> posso expurgar a escola. […] Pelo monitoramento eu vou saber se a escola está adimplente ou
> inadimplente e vou entrar em contato com a escola, ver o que que aconteceu, tentar resolver e não
> perder o cliente.»

**A resposta à pergunta que estava aberta: a escola fica DESABILITADA.** E o que «desabilitada»
significa já estava implementado, com as palavras dela: **«só tem acesso a ler as coisas que já foram
desenvolvidas […] mas fica impossível criar qualquer outro documento, fazer qualquer edição.»** É o
que `producao.js` faz — `ehEscrita(request, path)` devolve **402** com a frase do núcleo, e a leitura
passa toda. A decisão de **desabilitar é dela**, e não do sistema: «quem é que habilita ou
desabilita? Sou eu. Eu que faço isso. […] é uma estratégia minha para negociação.»

**A escada, e o que o sistema faz em cada degrau:**

| meses em atraso | o que o sistema diz | o que ela faz |
|:--|:--|:--|
| **0** | em dia | nada |
| **1 a 2** | `inadimplente` — a janela da conversa | contacta, percebe o que aconteceu, tenta resolver, não perde o cliente |
| **3 ou mais** | `para-expurgar` | decide: mais um mês, ou o expurgo (que exige a carência cumprida) |

**O que foi acrescentado ao monitor** (`monitoramento.inadimplencia`): a lista de quem deve, o mais
antigo primeiro, com os meses em atraso, o mês desde quando, a dívida e o degrau. **Só quem deve** —
uma lista com as escolas em dia ao lado faria procurar o que interessa no meio do que não interessa.
E o **mês que ainda não venceu não conta**: cobrá-lo seria contar o futuro.

**O que NÃO se automatizou, e é a decisão:** a suspensão não se deriva de uma contagem. Uma escola a
quem ela decidiu dar mais um mês apareceria como suspensa por um número, e não pela decisão dela — e
a alavanca da negociação é justamente essa. O sistema conta; ela decide.

**O regime de teste está LIGADO, e é um risco declarado.** `CARENCIA_DE_TESTE_MINUTOS = 5` e a chave
`expurgo/regime-de-teste-desde` existe no KV (gravada a 16/11/2026): hoje a carência é de **cinco
minutos**, e não de três meses. O próprio código o diz — «uma escola suspensa por engano é apagada
cinco minutos depois». Enquanto a regra de negócio é de três meses, o interruptor tem de voltar a
`null` **antes** de existir uma escola de verdade a pagar.

### 7.4 O que fica aberto

**Nada, das quatro.** As duas primeiras foram respondidas em §7.1 e §7.2, a terceira em §7.3, e a
quarta — o `ensaio` e a franquia — fecha-se com uma regra e não com uma pergunta: o relógio comprimido
move os meses das **mensalidades**, e a franquia é do **mês civil**; o plano **não os liga**, e a razão
está escrita (uma franquia que muda de tamanho enquanto se testa não se pode comparar com nada). O
ensaio **nasce desligado** numa escola nova, e ligado começa no mês que não está pago — medido em
`provar-a-escola-que-nasce` (25 asserções).

**O que continua a ser obra, e não pergunta:** o contador de aulas do §6. Enquanto ele não existir, a
franquia mostra-se e o consumo cala-se — e o excedente da escola inadimplente não se pode calcular,
porque não há número de aulas usadas. **A escada da inadimplência não depende dele:** ela conta meses
do livro, e o livro já existe.

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

---

## 9. O impacto de o implementar agora — medido a 25/11/2026

> «Eu preciso que você elabore para mim o impacto da gente implementar agora o contador de aulas. Eu
> acho que nós já temos tudo para começar a fazer isso. Então eu quero saber o custo e se a gente tem
> tudo mesmo.»

### 9.1 O custo do contador é ZERO minutos de GitHub

E não é uma estimativa: é o que a leitura mostra.

`motor/servidor/aulas-dadas.js:112` já lê o índice de um ciclo por `lerAsset(variante + '/ciclos.json')`
— **do ASSETS do Worker, que não é rede.** O comentário no ficheiro diz isso mesmo: «Lido do ASSETS:
não é rede.» E o `ciclos.json` de cada variante é montado no pacote por `tools/montar-publicacao.js`
(`turmasDaEscola()`), que já junta **todas as variantes de uma escola**.

| o que o contador precisa | de onde vem | custo |
|:--|:--|:--|
| quais são os ciclos da escola | o KV `bastidores/<escola>/turmas` (já lido pelo Worker) ou os assets | **0** |
| a data de cada aula | `ciclos.json` → `aulas[].data` | **0** (ASSETS) |
| o facto de cada aula | `ciclos.json` → `aulas[].lancada` | **0** (ASSETS) |
| a franquia contratada | `biblioteca/comercial/planos.json` (empacotado) | **0** |

**A conclusão que isto autoriza: o contador não aumenta a factura em nada.** Ele lê o que já está
publicado. Não gera, não commita, não dispara workflow.

### 9.2 O que custa não é contar — é criar a aula

O contador mede; o **botão «criar a aula N»** (§5) é que produz, e produzir custa. Medido no §20 do
[`CUSTO-DOS-FLUXOS.md`](CUSTO-DOS-FLUXOS.md): um acto = **3 minutos** hoje, e é o mesmo custo de
qualquer gravação de aula — o botão não acrescenta um acto, **antecipa-o**.

Ou seja: **implementar o contador não muda a factura. Implementar o botão também não** — o que muda é
*quando* a aula passa a existir, não *quanto* ela custa.

### 9.3 O que está mesmo pronto — conferido, não suposto

| peça | estado | evidência |
|:--|:--|:--|
| `aulas[].data` e `aulas[].lancada` no pacote | **existe** | lido no `ciclo-01-breu-piano/ciclos.json`: as chaves são `n, data, inicio, fim, marco, lancada, ancora, prazo, config` |
| a leitura por ASSETS, sem rede | **existe** | `aulas-dadas.js:112` |
| a comparação com a franquia | **existe** | `comercial.situacaoDaFranquia` — recebe `aulasUsadas` e devolve `folga/perto/limite/passou`, o excedente e a frase |
| `aulasUsadas: null ≠ 0` | **existe** | `comercial.js:281-302` — sem contagem devolve `usadas: null` e cala o consumo |
| a agregação por escola e por mês | **NÃO existe** | é o que falta, e é **uma função pura** |
| o estado calculado no servidor | **NÃO existe** | hoje o browser recalcula |

**Tradução honesta: falta uma função.** `contarAulasDoMes({ ciclos, competencia })` — recebe a lista
de índices que já se sabe ler, soma as `lancada` cuja `data` cai no mês, devolve um inteiro. Todo o
resto — a comparação, os quatro estados, a frase, o «sem contagem não se inventa um zero» — **já está
escrito e provado**.

### 9.4 A ordem, com o custo de cada passo

| # | passo | custo | entrega |
|:--|:--|:--|:--|
| 1 | `contarAulasDoMes` — uma função pura | **0** | o número |
| 2 | ligá-la ao `situacaoDaFranquia` na rota e no painel | **0** | a franquia deixa de ser um número no ecrã |
| 3 | a conferência: índice × `ciclos.json` × `-dados.json` | **0** | a prova que reprova quando divergem |
| 4 | o alerta das previstas (`TOTAL_AULAS`) | **0** | o aviso antes de passar |
| 5 | o excedente no Financeiro | **0** | a linha da cobrança |
| 6 | o botão «criar a aula N» | **3 min por aula** | o produtor que falta |

**Os passos 1 a 5 não custam um minuto de cota.** O passo 6 custa o que uma aula já custa hoje.

### 9.5 A condição que ela pôs, e ela muda a ordem

> «O que a gente tem que é um critério é que não dá para uma sala ser ocupada ao mesmo tempo por
> elencos […] completamente diferentes.»

Isso é a validação de ocupação, e ela **tem de vir antes do passo 1** — porque o contador soma por
escola, e uma escola com dois ciclos que colidem na mesma sala produz dois registos de aula no mesmo
minuto: o número continua certo, mas o **calendário** de onde ele sai deixa de ser verdadeiro.

E há um achado que impede começar sem decidir: **a regra de hoje recusa exactamente o cenário que ela
descreveu.** Está em [`PLANO-DE-OCUPACAO.md`](PLANO-DE-OCUPACAO.md) §1.

---

## 10. O contador está implementado — 25/11/2026

> «Vamos agora implementar o contador de aula.»

### 10.1 O que ficou feito, e onde

| peça | onde | o que faz |
|:--|:--|:--|
| `contarAulasDoMes`, `previstasDoMes`, `resumo`, `excedenteDoMes` | `motor/nucleo/contador-de-aulas.js` | **puro**. Recebe a contagem (ou os ciclos) e o mês, devolve o número |
| a contagem como conjunto de factos | idem, `fundirNaContagem` | guarda **quais** aulas e **em que dia**, nunca um total |
| a reconciliação e a cópia no KV | `motor/servidor/contador-da-escola.js` | lê os `ciclos.json` do ASSETS da escola, funde, grava **só quando muda** |
| a escrita | `bastidores.js` → `dadosDaEscolaParaProducao` | é o sítio que tem o ASSETS **e** as turmas; serve o cartão e o mês a mês |
| a leitura pela raiz | `raiz.js` → `lerContagemDeAulas` | **uma** chave por escola; é a ponte que faltava |
| o excedente na conta do mês seguinte | `mensalidades.situacaoDaEscola`, campo `excedente` | entra no `aPagarCentavos`, com as aulas, o preço e o mês de origem |
| o ecrã | `painel-html.js` (financeiro) e `bastidores.js` (cartão e mês a mês) | o excedente **discriminado**: `2 aula(s) × R$ 8,00 = R$ 16,00` |

**A prova:** `experimentos/provar-o-contador.js` — **46 asserções**, os seis pontos do §8 mais o
excedente, a escrita condicional e a leitura pela raiz. O A/B contra o `HEAD` anterior, num
`git worktree`: **35/46**, com as oito asserções que medem o comportamento novo a falhar.

### 10.2 A ponte que o plano não previa, e porque ela é um conjunto e não um contador

O §9.1 supunha que o contador leria o ASSETS em qualquer sítio. **Não é verdade para a raiz**: o
Worker do `danca.padd.com.br` serve `raiz/` como ASSETS e não vê `publicacao/`. E o `indices/
escolas/<slug>.json` não serve — tem o `numero` e a âncora, e **não tem a `data`**.

A decisão dela foi a **B**: a escola grava no KV um **conjunto de factos** (`bastidores/<escola>/
aulas-processadas`, `{ '2026-11': { 'piano/01': '2026-11-04', … } }`), e a raiz lê-o. **Não é um
contador**, e a diferença não é de nome: um total guardado pode divergir da fonte e ninguém sabe
qual vale; um conjunto é idempotente — a mesma aula registada duas vezes continua a ser uma, e o
número é derivado (`Object.keys(...).length`). A reconciliação é **monótona** (o que já foi lançado
não sai) e **grava só quando o conjunto mudou**, comparando a assinatura do conteúdo: uma página
vista cinquenta vezes num dia sem lançamentos custa cinquenta leituras e **zero escritas**.

### 10.3 A decisão do excedente — R$ 8,00, e a razão

> «No caso da escola que está habilitada, que está pagando, essa escola quando ela excede a
> franquia e não contratou nenhum pacote adicional de aulas, ela vai ter que ser onerada por isso […]
> então a gente vai cobrar por aula a mais. Aliás, vamos cobrar melhor, vamos cobrar R$ 8 por aula
> a mais, que daí ela percebe que qualquer um dos três pacotes, se ela tivesse contratado eles, ela
> teria um custo por aula menor do que pagar R$ 8 por aula a mais.»

**A conta que justifica o número é do catálogo**, e a prova mede-a: o pacote mais caro por aula
(R$ 0,50) tem de continuar abaixo dos R$ 8,00 — senão o excedente deixaria de ser um comando que
empurra a escola para o pacote e passaria a ser uma multa. O número vive em
`contadorDeAulas.PRECO_DA_AULA_EXCEDENTE_CENTAVOS`, é **dado declarado** e não uma conta: no dia em
que o preço do pacote mudar, ele muda com ele, e a prova reprova enquanto os dois não estiverem
coerentes.

**O excedente é do mês FECHADO e cobra-se no mês ABERTO** — é o único arranjo em que a conta é
verificável: as aulas de novembro só se sabem em dezembro. Fica na linha do extrato como número
próprio (`excedente`), com as aulas, o preço e o mês de origem, e entra no `aPagarCentavos`. **A
fatura não muda**: `valorCentavos` continua a ser o que foi cobrado, e é ele que a mudança de plano
compara — misturar o excedente na fatura faria um mês com muitas aulas parecer um plano novo.

**O que fica declarado:** a mora incide sobre o saldo da fatura e **não** sobre o excedente; e o
excedente do mês corrente só é conhecido quando o mês fecha.

### 10.4 O que continua a ser obra

| # | passo | estado |
|:--|:--|:--|
| 1 | `contarAulasDoMes` | **feito** |
| 2 | ligado à franquia na escola e no painel | **feito** |
| 3 | a conferência índice × `ciclos.json` × `-dados.json` | **parcial** — a prova mede as duas primeiras; a terceira é do §8 |
| 4 | o alerta das previstas | **feito** no núcleo (`previstasDoMes`); a tela ainda só mostra o consumo |
| 5 | o excedente no Financeiro | **feito** |
| 6 | o botão «criar a aula N» | **não** — custa 3 min de Actions por aula |
| 7 | a telemetria separada de cadastro | **não** |

### 10.5 O plano de consultoria — nome e regra, decididos a 25/11/2026

> «Eu acho que a gente pode chamar de plano consultoria, alguma coisa assim, porque aí fica claro
> para mim que se trata daquele consultor, de um consultor que está usando o plano […] ele é o plano
> consultoria com o consultor fulano da escola X. Isso a gente tem que saber.»

**O NOME É «PLANO CONSULTORIA».** E o que ele é: o plano da escola que ainda está em consultoria,
que ainda não foi habilitada e não pagou — com a duração de um mês e os limites do
[`PLANO-DA-ESCOLA-EM-CONSULTORIA.md`](PLANO-DA-ESCOLA-EM-CONSULTORIA.md). **Quando o limite é
atingido, o uso é INTERROMPIDO**: a escola passa a funcionar como desabilitada — só lê —, e não
como a escola que paga, que é onerada pelo excedente. São dois desfechos diferentes para o mesmo
número, e é essa a distinção que o §10.3 não pode confundir.

**O que falta, e está declarado como obra e não como pergunta:** escolher o plano consultoria no
financeiro (ao lado dos três planos), prorrogá-lo por mais um mês a pedido da escola, e o
**cadastro do consultor** — qual escola está em consultoria e quem é o consultor que a atende. O
limite de aulas já tem contador; o que falta é a trava que o lê.
