# Arquitetura da aula — o ciclo de vida, o prazo e a âncora por aula

> **Resumo (para o HANDOFF):** o ciclo de vida da aula (planejada → dada → lançada, mais a
> **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por
> aula. O **estado derivado** (`B6`), o **ajuste no plano** (`B8`), a **derivação por aula**
> (§4.3) e a **regra que tranca a aula dada** (§1.3) estão implementados; o resto, não.

> **Documento de desenho, com o que já foi implementado marcado.** Escrito em 23/09/2026, ao
> fim da conversa que definiu as regras. O que existe hoje está descrito em cada seção como
> "hoje", e o que se propõe como "proposto". Das peças da §10, **as oito de implementação
> estão feitas** (1 a 8; a 8, o **`B8`**, em 27/09/2026); a **9** entregou **só a P-13** — a
> Elicitação (§6.2) segue pendente —, e a **10** (o painel da escola) é ideia nova, *"para
> depois"* por decisão. A **`B13`** — a `linha_de_base` por aluna — **não é peça da §10**: é item
> do validador de dados, e segue **tolerada, não implementada** (`REGISTRO.md:4721`).
> Cada seção marca o seu estado, e onde não houver marca vale o proposto. O par de conceito
> está em
> `IDEIA-CAPTURA.md` (o porquê) e `ARQUITETURA-CAPTURA.md` (o como do JSON); este documento
> cobre **a aula como unidade** — o que ela é antes e depois de acontecer.

## 1. O ciclo de vida da aula

A aula tem **quatro estados**, e o que se pode fazer com ela depende do estado. O corte
**não é a declaração de um ato — não existe em lugar nenhum um campo "aula dada"**: é o
**cronograma casado com o prazo** (§3), lido contra o registro do lançamento. O estado é
**derivado**, e derivado a cada leitura.

| Estado | Como é reconhecido | O plano da aula | O lançamento |
|:--|:--|:--|:--|
| **Planejada** | a aula ainda não terminou | **intenção** — CRUD livre | não existe |
| **Dada** | o prazo corre e a aula já terminou | **passa a fato** | o formulário é gerado |
| **Lançada** | existe o registro no JSON de dados | só **ajuste** | só **ajuste** |
| **Não dada** | o prazo venceu **sem** registro | — a aula pulada (§3.3) | não há o que lançar |

**Quem institui o fato é o professor dar a aula e o prazo correr até o registro** — não uma
declaração à parte. O professor dá a aula no dia do cronograma (§6), lança dentro do prazo
(§3), e é o **registro** que fecha o ciclo. O sistema não pede que ele confirme o que já
fez.

**A consequência fora do sistema não se perde.** A folha de ponto continua sendo lida
daqui: **não recebe por aquela aula quem não tem registro até o prazo** — e a aula nesse
estado é a **não dada**, que é justamente o que o pulo deixa visível. A diferença é que a
consequência decorre do que **falta**, não de um ato que alguém teve de declarar; e o
professor não precisa ficar em dia com um carimbo para que o sistema saiba o que houve. O
sistema não fiscaliza: a consequência é do processo, não do software.

**O que o sistema não faz.** Ele não julga por que o professor demorou a lançar, nem
verifica se ele guardou o material num papel, num vídeo ou na memória. Isso **não é
problema do sistema** — é do professor. O sistema faz o corte e declara o estado.

> **Implementado (B6, 27/09/2026).** Os quatro estados continuam a valer — `planejada`, `dada`,
> `lancada`, `nao_dada` —, e o corte continua a ser o cronograma casado com o prazo e lido contra
> o registro. **O que mudou a 15/11/2026 é ONDE eles se calculam: o índice já não os declara.**
> Até essa data, `tools/gerar-ciclo.sh` gravava um `estado` por aula; hoje não grava, e a razão
> está escrita lá — ninguém o lia, e o `estado` é o juízo de um instante, que só quem tem um
> *agora* pode fazer. Quem o calcula é o formulário, em `estadoDaAula()`, com o próprio relógio;
> o índice guarda o **facto** (`lancada`), não o juízo. Nada foi acrescentado a nenhum arquivo de
> dados: o estado sai do cronograma, do prazo e do registro. A **aula não dada** é a única a que
> o formulário não serve — não houve aula, não há o que lançar, e o ajuste já estaria fora do
> prazo —, e o painel dela é o único que não abre.
>
> **A aula não dada não é declarada — é o que sobra.** Não há campo, nem botão, nem lista de
> "aulas dadas": o professor edita o plano da aula seguinte **livremente até a data dela**
> (é a intenção, §1.1), e o que não foi dado simplesmente não virou registro. A linha de base
> da aula seguinte continua sendo o registro da última aula que teve dado (§2) — que é
> exatamente o cenário B abaixo.

### 1.1 A regra, em uma linha

> **Aula `planejada`: CRUD comum. Aula que já aconteceu: só ajuste — de jeito nenhum CRUD.**

O corte é **o estado** (§1), não a data solta: enquanto a aula está `planejada` — a
**intenção** —, o plano é do professor, e ele o muda como quiser. Depois que a aula acontece,
a mesma fonte já é **fato**, e o que se acrescenta é um elo, nunca uma sobrescrita. **O
lançamento segue a mesma curva:** aberto enquanto `dada`, só ajuste quando `lancada`.

E o ajuste, nos dois objetos (o plano e o lançamento), é o **mesmo mecanismo**: o anterior
permanece, o novo é um elo, e o **diff é a justificativa** — sem campo de motivo
obrigatório. O professor tem autonomia para mudar o plano **até a aula acontecer**; o que
ele não tem é o direito de apagar que houve um plano antes.

### 1.2 Por que o diff basta

A cadeia de custódia é lida pela **escola**, e o que ela quer saber é *que decisões o
professor toma, que dificuldades ele tem, que caminho segue* — e se ele tem autonomia para
mudar. O diff responde isso sem que ninguém precise justificar por escrito: a mudança já
é o dado. Pedir justificativa transformaria autonomia em burocracia.

> **Feito em 27/09/2026** (peça 8 da §10) — o **`B8`**, o ajuste **no plano**. O mesmo
> mecanismo do lançamento passou a valer para a fonte `aula-NN.md`: o gerador arquiva o
> `plano-aula-NN.json` como `plano-aula-NN-anterior.json` antes de sobrescrevê-lo, o
> formulário exporta o elo (`## Ajuste do plano da aula NN`, com `De:` apontando a fonte que
> o professor vai abrir) e **o Git registra** — o elo não é escrito por ninguém, é anexado.
> **Quem manda é o relógio do PLANO**, que não é o do lançamento: `podeAjustarPlano()`
> libera enquanto a aula é `planejada`, `dada` ou `nao_dada`, e fecha no **lançamento**;
> `podeAjustar()` libera depois da aula e só dentro do prazo. Os dois nunca ficam abertos ao
> mesmo tempo, porque o predicado dos dois é o mesmo estado derivado. O guard do
> `pre-commit` (`§8`) aplica a distinção — plano mudado antes da aula deixa, depois recusa.
> ⇒ o *"hook ainda não a aplica"* do §5 fica **desatualizado por esta peça**.

> **Correção de 28/09/2026.** A redação acima descreve **metade** do que a peça 8 do §10 entregou,
> e a metade que ficou **não devia existir**. O que vale, medido em `tools/templates/lancamento.html`:
>
> - **A distinção dos dois relógios fica** — o do plano fecha no **lançamento**, o do lançamento
>   fecha no **prazo**; o guard do `pre-commit` (`§8`) continua aplicando a distinção, e o
>   `plano-aula-NN-anterior.json` continua sendo arquivado pelo gerador.
> - **O "formulário exporta o elo" era erro de assistente e saiu.** O botão
>   `#ajustar-plano` (*"Exportar ajuste do plano"*) foi introduzido em `282fbcb` — commit
>   co-assinado por Copilot — e a pesquisadora o recusou por inteiro: *"não faz sentido um usuário
>   querer exportar um ajuste do plano"*. Não há **consumidor** para o elo do plano: a fonte
>   `aula-NN.md` é do professor, e o ajuste que fecha no lançamento é o **do lançamento** (§3), que
>   já tem o seu par. A página exportava um `.md` que ninguém anexava.
> - **O que sobra do `B8`** é o estado derivado do §1 e o arquivamento do anterior — não a
>   exportação. Ver o `REGISTRO.md`, 28/09/2026, *"O botão `Exportar ajuste do plano` sai do
>   formulário: era erro de assistente"*.

> **Correção de 29/09/2026.** A medição de hoje fecha a conta das duas notas acima — e o que caiu
> não foi só a exportação. `podeAjustarPlano()`, a função que a redação de 27/09 nomeia como
> *"quem manda"*, **não existe**: saiu com a barra `#acoes-plano` na peça de 28/09/2026, e a
> varredura do nome em `tools/templates/lancamento.html` volta **zero**. Do par que a primeira
> nota descrevia resta **um** relógio só, o do lançamento — `podeAjustar()`
> (`tools/templates/lancamento.html:970`), consumida em **`:1566`** (o `disabled` do botão) e
> **`:1572`** (o texto do aviso). A frase *"os dois nunca ficam abertos ao mesmo tempo"* descrevia
> um par que já não existe no formulário.
>
> **O que fica de pé**, e é o que esta seção precisa guardar: a **distinção** entre plano e
> lançamento nunca dependeu do formulário. Ela é aplicada pelo guard do `pre-commit` — a
> sub-seção `§2c` do hook, que lê a fonte `aula-NN.md` e distingue plano antes × depois da aula
> —, e o `plano-aula-NN-anterior.json` continua sendo arquivado pelo gerador
> (`tools/gerar-ciclo.sh`, a ordem `cp` → `mv`). O `(§8)` das duas notas acima é a seção **deste**
> documento que lista os arquivos congelados, e é ali que o `tools/hooks/pre-commit` figura (a
> razão declarada do congelamento, citada pelo próprio guard); **não é erro de referência**.
>
> **A redação anterior não é apagada** (P-03/P-04): fica como o elo do que se acreditou naquele
> momento. Ver o `REGISTRO.md`, 29/09/2026, *"O `B8` medido: `podeAjustarPlano()` não existe, e o
> elo do que se acreditava"*.
>
> **Correção de 30/09/2026.** A medição do template fechou a pendência que a nota de 29/09 acima
> deixou aberta — e o que caiu não foi comportamento faltando: era redação descrevendo um defeito
> que não existe. O predicado da barra de ajuste é `tools/templates/lancamento.html:1562`
> (`barraAjuste.hidden = !!captura || !temAula`): ele esconde a barra **só no modo lançamento**
> (`captura`/`emAjuste`, onde não haveria o que ajustar) e **não** a esconde de uma aula `dada` sem
> registro. No **modo leitura**, a barra aparece, e o botão obedece a `podeAjustar()`
> (`:970`, o `disabled` de `:1566`): **habilitado** dentro do prazo, e **cinza com a data** visível
> fora dele (`:1572–1574`, *"Prazo encerrado em … — o registro é definitivo."*). O professor vê que
> a possibilidade existiu, em vez de o botão sumir sem explicação.
>
> **O comentário do `pre-commit` também deixou de mentir.** Ele nomeava `exportarAjusteDoPlano` e a
> barra `#acoes-plano` como coisa viva; a função e a barra saíram em `17ed444` (28/09/2026). O guard
> da `§2c` **nunca dependeu dela** — ele lê a fonte `aula-NN.md` e a defere contra o `HEAD`, não lê
> id nenhum de HTML. O texto passou a dizer isso; o comportamento do hook **não mudou**.
>
> **A redação anterior não é apagada** (P-03/P-04): fica como o elo do que se acreditou naquele
> momento. Ver o `REGISTRO.md`, 30/09/2026, *"Os pontos 2, 3 e 4 fechados: a grafia, o campo
> `professor` e duas pendências que a medição derrubou"*.

### 1.3 A regeneração derivada não reescreve a aula dada

> **Regra declarada pela pesquisadora, 21/11/2026:** *«regenerar o ciclo afecta só a aula que
> ainda não foi dada; as outras ficam e não se apagam.»*

A §1.1 vale para os dois sentidos: o professor ajusta o plano até a aula acontecer, e **o
derivador também não pode reescrevê-lo depois**. O artigo que faltava dizer é este: o
`-aula-NN.md` e o `-captura-aula-NN.md` são o plano e a folha de observação **daquela aula**, e
uma vez que a aula aconteceu eles são facto — pela mesma razão que fecha a autonomia do professor.

**O caminho que tornava isso um defeito era o mais banal do sistema.** O «Guardar» do PO é o gesto
da cascata do elenco: tira-se uma aluna, grava-se, e o `escrever-ciclo.js` regera o ciclo
inteiro. A lista de fontes tinha a aula escritas à mão, e sem condição: corrigir o elenco hoje
reescrevia o plano de uma aula que já tinha acontecido, arquivava a versão verdadeira em
`historico/`, e o diff de proveniência passava a mostrar como **mudança do professor** uma
mudança que ele não fez. A `P-03` é violada no ponto exacto em que a cadeia de custódia é lida.

**O que decide, e o que não decide.** O facto é o **registro do lançamento** — `aulas[NN]` no
`-dados.json` —, e não o juízo `planejada`/`dada`/`lancada`/`nao_dada`: esse depende de um relógio,
e um derivador não tem relógio nem deve ter. É o mesmo critério do índice (§4.2), que guarda o
facto (`lancada`) e deixa o juízo para quem tem um *agora*. A janela que sobra — aula já
acontecida, dentro do prazo, ainda sem lançamento — é exactamente a janela em que o plano ainda é
ajustável: enquanto o plano é intenção, ele continua a poder ser derivado.

**A regra é uma só, e vive num sítio só:** `motor/nucleo/aulas-do-ciclo.js`. Os dois caminhos que
regeram um ciclo usam-na — o escritor do Worker (`escrever-ciclo.js`, no «Guardar» do PO) e o
comando local (`tools/regerar-derivados.js`). Ela faz três coisas, e a terceira é um compromisso
com o pacote:

| o que | onde |
|:--|:--|
| não **reescreve** a fonte da aula lançada | os dois caminhos, e o relatório diz `travadas` com o motivo |
| não **arquiva elo** dela em `historico/` | não houve substituição, logo não há elo a inventar |
| não **apaga** nenhuma aula do ciclo | `DOCS` só cresce: a lista de documentos nunca tira uma aula |

**A excepção é uma reparação, e está medida.** Se a fonte da aula lançada **não existe** — alguém
apagou o ficheiro —, não há facto a preservar: reconstrói-se, e o relatório diz `reparadas`. Um
buraco no pacote não é prova de nada.

> **Prova:** `experimentos/provar-aula-dada.js` — **34 asserções**. Com a regra desligada caem
> **10** delas (duas na secção A, seis na B, duas na D), e o dano fica escrito no relatório: o plano
> e a folha vão para `historico/` como elos. A secção C — o controlo negativo — é a que impede o
> pior modo de passar: sem ela, uma prova verde poderia estar a medir um escritor que **não escreve
> nada**.

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
prazo             = maior entre
                      (a) 24h antes da próxima data de aula
                      (b) fim do bloco + 18h          ← piso: tempo hábil
```

O **piso de 18h** existe para o caso denso (aula às 20h, próxima às 8h): o professor tem de
ter tempo hábil para lançar. Ele foi calibrado com a pesquisadora como *"dezoito horas
atende bem"*.

Medido nos três ciclos vivos: **o piso nunca dispara** — a menor janela real é **23 h**
(Diaghilev, terça → quinta), acima das 18 h. Ele é rede de segurança para o caso denso, não
o prazo praticado; não é código morto.

> **Feito em 26/09/2026** (peça 7 da §10) — o **`B7`**. O prazo deixou de ser 48 h fixas:
> `aulas[].prazo` sai calculado do calendário pelo gerador, `HORAS_DE_RESSALVA = 48`
> sobrevive só para ciclo anterior à regra, e o rename `prazoDaAula` → `carimboDaAula`
> marcou que o prazo vem do **índice**, não do carimbo do último lançamento.
> (`REGISTRO.md:4862`.)

### 3.2 O que a medição mostrou

Rode a fórmula contra os três ciclos reais do repositório (`tools/calendario.py` dá as
datas):

| Ciclo | Cronograma | Prazo que resulta |
|:--|:--|--:|
| **Duo** | sextas, 1x/semana (gap 7d) | **143 h** — vale "24h antes" |
| **Diaghilev** | ter e qui (gap 2d) | **23 h** |
| **Diaghilev** | qui → ter (gap 5d, fim de semana) | **95 h** |
| **Ritmos** | sábado com **2 aulas na mesma data** | **57 h** |
| **Ritmos** | ter → sáb (gap 4d) | **60 h** |

**O caso que a regra ingênua quebrava.** O Ritmos tem `DIAS="2,6,6"` — terça com 1 aula e
sábado com **duas, na mesma data** (medido: **7 datas com mais de uma aula** num ciclo de
21). A regra "24h antes da próxima *aula*" dava **−24h**: a "aula seguinte" seria no mesmo
dia, e o prazo fecharia antes de a aula acontecer. A correção é o **bloco**: as aulas da
mesma data contam como uma, e o prazo sai da **última** delas — que é quando o professor
termina e vai lançar.

### 3.3 Duas regras que fecham os casos-limite

- **A aula pulada não tem prazo.** Não houve aula, não há o que lançar — e é a ausência de
  registro **até o prazo vencer** que a define (§1). Como o prazo mora **na aula** (não no
  ciclo), a aula pulada simplesmente não o tem — e não afeta nada.
- **A última aula do ciclo tem o MAIOR prazo já praticado nele.** Não há "próxima aula" de
  onde contar, então o número vem do próprio ciclo: se as aulas são semanais, ela tem uma
  semana; se são de dois em dois dias, tem dois dias. O professor já está acostumado àquele
  ritmo, e o fim do ciclo não o muda. Medido: Duo **143 h**, Diaghilev **95 h**, Ritmos
  **60 h**.

**Os prazos são independentes.** Cada prazo é função de duas datas — a daquela aula e a da
próxima. Nenhum prazo entra na conta de outro. Medido na Diaghilev:

```
aula 01  06/10 ter  →  prazo qua 07/10 19:00
aula 02  08/10 qui  →  prazo seg 12/10 19:00
aula 03  13/10 ter  →  prazo qua 14/10 19:00
```

Ou seja: **pular a 02 não desloca o prazo da 03.** O prazo da aula pulada é o dela, e
vencido sem registro é ele que a **define** como não dada (§1) — a 03 não herda nada disso.

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

> **Corrigido (B3, 27/09/2026).** O `config` saiu da raiz do ciclo e passou a ser **por
> aula** (`aulas[].config`), um `captura-aula-NN.json` por folha — o formulário lê o da aula
> do filtro.

**Defeito 2 — as folhas 02..N não são fontes.** O `DOCS` do manifesto é uma **lista à
mão**, herdada de quando só a primeira aula estava escrita. Medido:

```
DOCS declara:   captura-aula-01       (só a 01)
no disco:       captura-aula-01..04   (as 4 existem)
no .fipp:       captura-aula-01       (só a 01 é FONTE)
```

Consequência: **apagar a folha da aula 02 não quebra a âncora** — ela não é fonte, e o
`--check` passa. As folhas 02–04 existem no disco e o sistema **não as vê**.

> **Corrigido (B2, 26/09/2026).** O `DOCS` deixou de ser lista nominal e passou a ser
> **tipos + ordem**: `aula-*` e `captura-aula-*` expandem, em `tools/lib-fontes.sh`, para todo
> NN existente no disco, na posição do primeiro membro declarado. A expansão mora na lib
> porque é o único ponto que o gerador (`gerar-ciclo.sh:99`) e a âncora (`hash-ciclo.sh:150`)
> atravessam — fora dela, a âncora cobriria um conjunto diferente do publicado e cada
> `--check` acusaria divergência inexistente. Medido: a cobertura do `.fipp` da Diaghilev
> passou de 13 para 17 fontes, e **apagar a folha da aula 02 agora acusa**
> (`erro: a lista de fontes cobertas mudou`).

### 4.2 O proposto

O índice passa a declarar **uma entrada por aula** — é o que faz "o formulário da aula N
nascer do que é da aula N":

```json
{
  "id": "01", "escola": "Diaghilev", "total_aulas": 4,
  "aulas": [
    { "n": "01", "data": "2026-10-06", "inicio": "19:00", "fim": "20:00",
      "marco": "Isolar o eixo vertical e a distribuição do peso...",
      "lancada": true,
      "config": "captura-aula-01.json", "ancora": "ciclo-01-diaghilev-aula-01.fipp",
      "prazo": "2026-10-07T19:00" },
    { "n": "02", "data": "2026-10-08", "lancada": false, "prazo": "2026-10-12T19:00" }
  ]
}
```

**É 100% derivável do que já existe** — verificado:

| Campo | De onde sai |
|:--|:--|
| `data`, `inicio`, `fim` | `calendario.py` (datas) + `DIAS` com hora (§6) |
| `marco` | `plano.md` → `marcosPorAula` (extraído por `validar-plano-ciclo.js`) |
| `lancada` | o JSON de dados (`aulas['02']`) — o **facto**, não o juízo |
| `config` | a folha da aula (`captura-aula-NN.md` → `captura-aula-NN.json`) |
| `ancora` | o `.fipp` da aula (§5) — **o gerador ainda grava `null`**; ver adiante |
| `prazo` | §3 |

Nada disto precisa ser escrito à mão: o índice é **pré-produzido** pelo gerador, a partir do
plano, do calendário e do `.conf`.

> **O `estado` NÃO está no índice, e o `gerado_em` também não (15/11/2026).** Os dois eram
> juízos sobre o instante em que o ficheiro foi escrito, e o índice é **versionado**: um valor
> que muda quando o relógio passa suja a árvore sozinho e faz o commit seguinte levar dentro uma
> alteração que ninguém fez. O `estado` (§1) continua a existir — calcula-o quem tem um *agora*,
> o formulário, em `estadoDaAula()`, a partir de `prazo`; e o `gerado_em` foi substituído pelo
> `git log`, que diz a mesma coisa e ainda diz quem. É a mesma regra das vistas, escrita numa
> prova: «duas corridas, o mesmo texto».
>
> **`ancora` ainda sai `null`** nos três ciclos — o `.fipp` por aula existe (§5, `B5`), mas o
> gerador não o consulta. A coluna é a promessa, não o estado.

### 4.3 A derivação por aula — implementada a 21/11/2026

A §4.2 descreve o índice a declarar uma entrada por aula; o que faltava era o **documento** de
cada aula saber que é dela. Havia um derivador chamado `derivarAula01`, e o nome era literal:
escrevia `aula: "01"`, «Plano para a Aula 01», lia `aula-1-sequencia` e `aula-1-parametro`
escritos à mão, e o «próximo passo» da §8 mandava sempre para a **Aula 02**. Enquanto só a Aula
01 existiu, nada disso se notava.

**O que mudou.** `derivarAula({ nn, … })` — e `derivarAula01` passa a ser o caso `nn = '01'`, não
um caminho à parte. Uma função só, porque duas derivações da mesma regra divergem ao primeiro
caso novo. Cinco coisas passam a sair do número:

| o quê | de onde vem |
|:--|:--|
| `aula:` do cabeçalho e «Plano para a Aula NN» | `nn` |
| o objetivo específico | o **marco NN** do plano (Regra 2) |
| o parâmetro de medição | a chave `aula-<N>-parametro` |
| a sequência de exercícios | a chave `aula-<N>-sequencia` |
| o «próximo passo» da §8 | o marco da aula **seguinte**, e o link para ela |

**O que NÃO entra no número, de propósito.** A duração, o volume, os blocos, as condições do
espaço, o guia de observação, a proveniência e a auditoria são do **ciclo** — a mesma turma, o
mesmo plano, a mesma régua. Repeti-los por aula seria dar a cada documento uma cópia da resposta
com a possibilidade de divergirem.

**A chave leva o número SEM zero à frente** (`aula-2-sequencia`, não `aula-02-sequencia`): é a
forma que o envelope já tem, e renomeá-la renomearia a resposta de todos os planos gravados. A
regra vive em `motor/nucleo/aulas-do-ciclo.js`, junto da que tranca a aula dada (§1.3) — as duas
falam do mesmo número.

**A lacuna não se herda.** Pedida a Aula 04 de um plano de três marcos, o documento declara
`[Preencher: marco da Aula 04]` e `[Preencher: parâmetro de medição da Aula 04 — o plano não
respondeu «aula-4-parametro»]`, e **não** copia a sequência nem a matriz da Aula 01. Herdar
atribuiria a esta aula o que foi respondido para outra — e o diff de proveniência diria que o
professor escreveu ali o que ele nunca escreveu. Quem reusa é o **formulário**, com a pessoa a
confirmar; o derivador lê a resposta, e não a inventa.

**Os dois caminhos escrevem todas as aulas que o ciclo declara.** A lista de fontes do
`escrever-ciclo.js` e a do `tools/regerar-derivados.js` tinham o par da Aula 01 escrito à mão: um
ciclo que ganhasse a Aula 02 não a punha em dia por ali — a aula estava no `DOCS`, o gerador ia
buscá-la, e não a encontrava. Agora saem do `DOCS` do manifesto, mais a Aula 01, que todo o ciclo
tem; e a regra do §1.3 continua a valer por fonte, dentro do laço.

> **Prova:** `experimentos/provar-derivador-da-aula.js` — **35 asserções**. A secção B mede que a
> Aula 01 **não mudou** (o alias e o `nn = '01'` dão o mesmo texto, e o documento declara o marco 1
> e as chaves da 01); a C, a Aula 02 com dados próprios; a D, a aula sem dados; a E, o escritor a
> gravar uma fonte por aula — e a **não** gravar a que já foi lançada. Com o derivador a escrever
> sempre a primeira — o defeito que ele tinha — caem **14 das 35**.

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
  distinguir o plano mudado antes da aula (deixa) do mudado depois (recusa). A regra do §1
  **passou a ser verificável** com o `B6` — o estado é derivado, não declarado —, e **o
  `B8` fechou o outro lado**: o guard do `pre-commit` (§2c) aplica a distinção, lendo o
  estado do `ciclos.json` do pacote da variante.

## 6. O que precisa entrar na Elicitação

### 6.1 A hora da aula

**Hoje o sistema não conhece hora.** Verificado: nenhum documento de ciclo tem hora, e o
Pré-requisito 5 exige `ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS` — só **dia**.

A hora entra na Elicitação (que horas começa, que horas termina) e no manifesto, **junto do
dia** — decidido: a hora e o dia não podem divergir, então não podem ser listas paralelas:

```
DIAS="2@19:00,6@09:00,6@11:00"     # terça 19h · sábado 9h e 11h
```

**Custo declarado.** O `pattern` do schema é `^[1-7](,[1-7])*$` e **não aceita** o formato
novo. Muda: o schema (`ciclo-01-schema.json`), o `Pré-requisito 5` (congelado) e os três
`.conf` existentes. A opção de lista paralela (`HORARIOS=`) foi **recusada**: quem editasse
o `DIAS` sem o `HORARIOS` desalinharia, e o erro seria silencioso.

> **Feito em 25/09/2026** (peça 1 da §10). O padrão passou a
> `^[1-7]@HH:MM(,...)*$` nos dois schemas; os três `.conf` trazem a hora (a do Diaghilev é
> **fictícia** — o ciclo é simulado e não houve aula real de onde transcrevê-la); o
> `calendario.py` parseia, deriva a hora do bloco e ganhou `--aulas-arquivo` (TSV
> `NN  data  inicio  fim`); o bloco do calendário publica a linha `Horário:`. Os três
> pacotes foram regerados e os três `.fipp` **reancorados**. A forma antiga, só com o
> número, é **recusada com mensagem** — migrar três `.conf` é barato; descobrir depois que
> o prazo saiu errado, não.

### 6.2 As perguntas novas na Elicitação

`prompts/elicitar-ciclo.md` (congelado) precisa dos campos que este desenho usa: **hora de
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

> **Correção de 11/10/2026.** A senha da Produção é **própria** (`SENHA_<ESCOLA>_PRODUCAO`,
> Modelo 2) — a mesma solução da senha da escola, com variável separada. O **Estúdio de
> Dança** continua a usar a senha da escola. Ver o `IDEIA-PAINEL-ESCOLA.md` §4.

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

> **Remissão.** O painel da escola (agora o «Bastidores») detalha o mesmo assunto em
> `IDEIA-PAINEL-ESCOLA.md` §13; aqui está o que toca **a aula**.

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
| `tools/templates/lancamento.html` | ler a config da aula; o **estado derivado** (§1) |
| `tools/validar-captura-ciclo.js` | validar a folha de cada aula |
| `tools/check-pacote.js` | exigir o config de cada aula declarada |
| `tools/hooks/pre-commit` | distinguir plano antes × depois da aula |
| `PROTOCOLO.md` | **P-13 precisa de ajuste** (§9) |
| `prompts/elicitar-ciclo.md` | hora de início e fim; data de fechamento |

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
   Pré-requisito 5 e os `.conf`. **Feito em 25/09/2026.**
2. **O `DOCS` derivado** (§4.1, Defeito 2) — conserta a raiz: as folhas 02..N passam a ser
   fontes só por existirem. É o que permite a 3. **Feito em 26/09/2026** — ver a nota do §4.1.
3. **O config por aula** (§4.1, Defeito 1) — `captura-aula-NN.json`, um por aula, e a página
   lê o da aula do filtro.
4. **O índice por aula** (§4.2) — a estrutura que a 3 e a 5 consultam.
5. **A âncora por aula** (§5) — com data, para o corte antes × depois ser verificável.
6. **O estado derivado** (§1) — o cronograma + o prazo + o registro; é o que gera o
   formulário. **Feito em 27/09/2026** — ver a nota do §1.
7. **O prazo** (§3) — a fórmula, os prazos por aula no índice, a data de fechamento.
   **Feito em 26/09/2026** — ver a nota do §3.
8. **O ajuste no plano** (§1.2) — o mesmo mecanismo do ajuste do lançamento, aplicado à
   fonte `aula-NN.md`. **Feito em 27/09/2026** — ver a nota do §1.2. ⚠️ **Reduzido em
   28/09/2026:** a distinção dos relógios e o arquivamento do anterior ficam; **a exportação do
   elo pelo formulário saiu** (era erro de assistente). Ver a correção datada do §1.2.
9. **P-13** (§9) e a Elicitação (§6.2) — os textos.
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
