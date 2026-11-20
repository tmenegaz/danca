# O custo dos fluxos — o recálculo, com os minutos medidos

> **Estado:** aberto a 19/11/2026. **Dono das decisões:** a proprietária. **A bancada:** os próprios
> runs do GitHub (`gh api …/actions/runs`), medidos neste dia. **O que isto complementa:** a §7.1 do
> [`ARQUITETURA-GERAL.md`](ARQUITETURA-GERAL.md), que conta as **requisições** (PUT/GET ao GitHub);
> este documento conta os **minutos de CI**, que são outra factura.

## O pedido, e em que termos

> «Agora que nós desenhamos todos esses fluxos, isso impacta diretamente no nosso custo. […] A gente
> tem que imaginar que as escolas vão, de forma bastante estressante, muitas vezes ao dia, gerar
> esses fluxos. […] Quando virar o mês, eu vou voltar para o GitHub privado no nosso projeto. E aí
> vai voltar a contar os minutos de cada vez que a gente tem um processo no CI/CD. Então a gente
> precisa agora estimar, com base no que já temos documentado, essa quantidade toda de fluxo.»

E a premissa de negócio que dá sentido à conta: **o preço do produto é por aula** — é a quantidade de
aulas que cada plano oferece. O custo de CI também é, na prática, **por aula gerada**.

---

## 1. O que se mediu, e o que não se mediu

**Medido**, neste dia, contra a API do GitHub:

- a **duração de cada job** dos últimos 100 runs do repositório, e os **passos** de cada job;
- **quantos jobs** cada execução tem — **um**, nos quatro workflows (já era a decisão de 17/11/2026);
- **que commits disparam que workflow**, cruzando o `head_sha` de cada run com os ficheiros do commit
  e com os `paths:` de cada workflow;
- a **tabela de preços** do GitHub (documentação oficial, consultada a 19/11/2026).

**Não medido, e por isso dito:** o **consumo real** em minutos. A conta está num repositório
**público**, e nesse regime o Actions não é facturado — a API de billing responde `{"billable":{}}` e
o `/timing` de cada workflow vem vazio. O que se mede é o **tempo de cada execução**; o preço é a
multiplicação. **Não houve ensaio de carga**: nada aqui foi provocado contra o ar.

**O preço** (documentação oficial, 19/11/2026):

| Plano | Compute incluído/mês | Equivalente a `$0,006/min` |
|:--|--:|--:|
| GitHub Free | **$12** | **2 000 min** |
| GitHub Pro / Team | **$18** | **3 000 min** |
| Excedente | — | **$0,006 por minuto** (runner Linux standard) |

O GitHub passou a facturar em **dólares de compute** e não em minutos; a conversão acima usa a tarifa
do runner Linux standard, que é o único que este repositório usa.

---

## 2. As constantes do CI — medidas

Um job por execução, e a facturação **arredonda ao minuto, por job**. O que se segue é a duração
medida do job e o que ele custa:

| workflow | quando | job medido | **min facturados** |
|:--|:--|--:|--:|
| **Gerar o ciclo** | dispatch do Worker (ou à mão) | 74–135 s (mediana **111 s**) | **2** (3 na cauda) |
| **Fechar os derivados** | push que toque `professores/**`, `escola/**`, `indices/esquema/**`, os geradores | 7–29 s | **1** |
| **Publicar o sistema** | push que toque `motor/**`, `biblioteca/modalidades/**`, `professores/**/ciclos/ciclo-*/**`, `*.conf`… | 24–44 s | **1** |
| **Criar a escola** | dispatch da página | 30–63 s | **1** (2 na cauda) |

> **O número que manda é o arredondamento, e não a média.** Um job de 61 s custa o mesmo que um de
> 120 s — **2 minutos**. E um de 59 s custa **1**. Todo o desenho de custo deste sistema vive nessa
> fronteira, e o §3 mostra que ela está a ser atravessada ao contrário.

---

## 3. Onde vão os segundos do job que domina o custo

Dos **117 s** do job «Gerar o ciclo», medidos passo a passo:

| passo | tempo | % |
|:--|--:|--:|
| `Set up job` | 3 s | 3 % |
| `checkout` | 5 s | 4 % |
| **`preparar-node`** (npm ci, `wrangler`) | **14–21 s** | 12–16 % |
| **`preparar-tex`** (pandoc, TeX, pdfinfo — dos `.deb` em cache) | **78 s** | **67 %** |
| **Gerar e validar o pacote** | **5 s** | **4 %** |
| Commitar o pacote | 2–8 s | 2–7 % |
| Publicar no Cloudflare | 5–7 s | 4–6 % |

**A geração do documento — o trabalho pelo qual se paga — são 5 segundos.** Os outros 112 são
**preparar a máquina** que o vai fazer, e ela é descartada no fim de cada execução.

**A consequência aritmética, e é a alavanca maior deste documento:** o job precisa de baixar de
**111 s para ≤60 s** para passar a custar **1 minuto em vez de 2**. Como o `preparar-tex` sozinho são
78 s, isso **não se consegue afinando passos** — só tirando a instalação do caminho crítico.

---

## 4. O que dispara o quê — medido nos commits e nos `paths`

O `head_sha` de um run engana (é o topo do branch, e vários runs do mesmo minuto partilham-no); o que
decide é **o commit que toca um path observado**. Cruzando os dois:

| o commit toca | `Fechar os derivados` | `Publicar o sistema` | `Gerar o ciclo` |
|:--|:--:|:--:|:--:|
| `envelope/**` (o acervo: anamnese, plano, PO, lançamento) | **não** | **não** | só se o Worker o disparar |
| `escola/**` (linhas de base, índices da escola) | **sim** | não | — |
| `professores/**` (as fontes do ciclo) | **sim** | **sim**¹ | — |
| `biblioteca/modalidades/**` (notação, vocabulário) | não | **sim** | só se o Worker o disparar |
| `indices/esquema/**`, os geradores | **sim** | não | — |
| `motor/**`, `workers/**`, `raiz/**` (desenvolvimento) | não | **sim** | — |

¹ quando o caminho casa `professores/**/ciclos/ciclo-*/**` ou `*.conf`.

**A distinção que faz metade da conta:** **escrever no acervo (`envelope/**`) não custa CI nenhum.**
Uma anamnese, uma gravação de plano ou de PO gravam o envelope **e** o índice do acervo, e nenhum dos
dois está nos `paths`. O que custa é o **segundo** efeito: a **fonte** do ciclo (`-plano.md`, `-po.md`,
`-dados.json`) e o **disparo explícito** da geração.

---

## 5. A matriz do recálculo — cada gesto, em minutos

Cada linha soma: os commits que o gesto escreve **×** os workflows que eles disparam, mais o
`Gerar o ciclo` quando o Worker o pede. O caso base é **uma Turma com plano**.

| gesto (o que ela clica) | o que escreve | derivados | publicar | gerar | **min** |
|:--|:--|--:|--:|--:|--:|
| **Criar/editar a anamnese** | `envelope/*.json` + índice | 0 | 0 | 0 | **0** |
| **Criar Sala, professor, aluna** | KV | 0 | 0 | 0 | **0** |
| **Mudar o professor de uma Sala (T2)** | KV | 0 | 0 | 0² | **0** |
| **Trocar a modalidade (T3)** | KV | 0 | 0 | 0 | **0** |
| **Migrar os conteúdos (T4)** | KV | 0 | 0 | 0 | **0** |
| **Lançar uma aula** | `lancamento/` + envelope | 0 | 0 | 1 | **2** |
| **Gravar o Plano de Ensino** | 2 envelopes + `-plano.md` | 1 | 1 | 1 | **4** |
| **Gravar o PO** | 2 envelopes + `-po.md` | 1 | 1 | 1 | **4** |
| **Concluir o elenco** (1 Turma) | 2 em `escola/**` | 2 | 0 | 1 | **4** |
| **Transferir uma aluna** (2 lados) | 4 em `escola/**` | 4 | 0 | 2 | **8** |
| **Editar um verbete em uso (T5)** | `notacao.json` | 0 | 1 | 1 | **3** |
| **Editar um termo em uso (T6)** | `vocabulario.json` | 0 | 1 | 1 | **3** |
| **Editar um termo livre (T6)** | `vocabulario.json` | 0 | 1 | 0 | **1** |
| **Criar uma escola** | — | — | — | criar-escola | **1** |

² **o caso comum do T2 custa zero**, e é um resultado, não um bug: a cadeia **pára em `bloqueada`**
porque a autoria não se reescreve — e uma etapa bloqueada não chega à geração. O T3 bloqueia sempre.
Os três fluxos que ela mandou desenhar (T2, T3, T4) são, em CI, **os mais baratos de todos**: o que
eles fazem é **parar** e dizer.

**As três linhas que dominam, e porquê:**

| linha | min | o que a compõe |
|:--|--:|:--|
| **Concluir o elenco** | 4 | **dois** commits em `escola/**` (o ficheiro e o índice) = 2 × derivados; + 1 geração |
| **Gravar plano ou PO** | 4 | a fonte em `professores/**` dispara **derivados e publicar** (2), + geração (2) |
| **Editar um verbete em uso** | 3 | `biblioteca/modalidades/**` dispara **publicar** (1), + geração da Turma (2) |

E o **multiplicador** que ela tem de ver: o `Gerar o ciclo` corre **uma vez por (professor, ciclo,
Turma)**. Uma Turma com dois ciclos, ou um elenco que serve três Turmas, **multiplica** a parcela de
2 min por cada uma. É por isso que a §9 existe.

---

## 6. Os três cenários — minutos por mês, e o que custam

Hipóteses declaradas, todas pessimistas do lado do custo: **22 dias úteis**, cada gesto com o valor
da §5, e a **média de 3 min por gesto** (a mistura real fica entre 0 e 4).

### A — Escola pequena, uso corrente (1 professora, 1 ciclo)

| por mês | quantidade | min |
|:--|--:|--:|
| aulas lançadas (3/semana) | 12 | 24 |
| plano + PO (1 ciclo) | 2 | 8 |
| verbetes editados | 8 | 24 |
| conclusão do elenco | 1 | 4 |
| **total** | | **60 min** |

**$0,36/mês** — 3 % da cota Free. O custo de CI desta escola **não é um problema**: é ruído.

### B — Escola em produção (5 professoras, 2 ciclos, uso corrente)

| por dia útil | quantidade | min |
|:--|--:|--:|
| aulas lançadas | 10 | 20 |
| planos e PO | 4 | 16 |
| verbetes e termos | 5 | 15 |
| elenco | 1 | 4 |
| trocas de sala/modalidade | 2 | **0** |
| **total/dia** | 15 | **55 min** |

**55 min/dia × 22 = 1 210 min/mês = $7,26.** É **60 % da cota Free** e **40 % da Pro** — uma escola
grande, sozinha, come mais de metade do que o plano inclui. Com **duas** escolas assim, a cota Free
acaba antes do fim do mês.

### C — Stress: o que ela pediu para imaginar

**Três escolas, cada uma com 40 gestos por dia** (muitas vezes ao dia, todos os dias):

| | |
|:--|--:|
| min/dia por escola (40 × 3) | 120 |
| min/mês por escola (× 30) | 3 600 |
| **três escolas** | **10 800 min** |
| custo | **$64,80** |
| menos o incluído do Pro ($18) | **$46,80/mês de excedente** |

**O número que importa não é o total: é que uma única escola em stress (3 600 min/mês) já estoura a
cota Free (2 000) e passa a Pro (3 000).** O stress não é um cenário de 40 escolas — é de **uma**.

### D — O que muda com os fluxos revistos (T1–T7)

A pergunta dela foi esta. A resposta, com os números de cima:

- **T1 (a Sala a mandar na direção): 0 min.** É leitura; não escreve no repositório.
- **T2 (mudar o professor): 0 min no caso comum**, porque **bloqueia**. Só custa se a cadeia derivar
  — e não deriva quando a autoria muda, que é o caso para que foi feito.
- **T3 (modalidade): 0 min**, por construção: bloqueia.
- **T4 (conteúdos migrados): 0 min.** É KV, e fecha um caminho que **gastava** (o mapa antigo
  escrevia sem guarda).
- **T5 (estilo): 3 min por verbete em uso** — o gesto mais caro dos novos, e é o único que **regera**.
  Era 0 antes *porque nada acontecia*; o custo novo é o preço de o documento deixar de mentir.
- **T6 (dicionário): 1 min se o termo é livre, 3 se está em uso.** A condição que ela fixou é, também,
  a condição do custo.
- **T7 (o calendário, por fazer): 0 min de CI**, mas mexe no que o `gerar-ciclo` faz — e é o único
  passo que pode **mudar** a duração do job (e portanto os 2 min de cada geração).

**Conclusão do recálculo:** os fluxos novos **não** são o que empurra a factura. O que a empurra é a
**geração** (73 % dos minutos, no cenário B) e o **arredondamento ao minuto** de um job que gasta 67 %
do tempo a instalar TeX para 5 segundos de trabalho.

---

## 7. Onde o custo está — e as cinco alavancas

Ranking do cenário B, por workflow:

| workflow | min/mês | % |
|:--|--:|--:|
| **Gerar o ciclo** | 880 | **73 %** |
| Publicar o sistema | 198 | 16 % |
| Fechar os derivados | 132 | 11 % |

As alavancas, por ordem de ganho, **com o que é preciso verificar antes de mexer**:

### 7.1 Tirar a instalação do TeX do caminho crítico — **até −50 % no total**

O job está a **111 s**, e a fronteira dos 2 minutos é a 120 s: **9 segundos de folga**. Se o
`preparar-tex` sair do caminho (imagem de container com TeX, ou runner com o conjunto já instalado), o
job cai para ~40 s e passa a facturar **1 min em vez de 2** — **metade do custo de 73 % da factura**.

- **Ganho, calculado sobre a §6:** o `Gerar o ciclo` é 73 % dos minutos do cenário B; cortá-lo a
  metade leva 1 210 → **~770 min/mês** (de $7,26 para $4,62), e o cenário C de **$64,80 para ~$41**.
- **O que verificar:** que uma imagem de container não acrescenta `pull` (mede-se; o pull não é
  facturado, mas o tempo dele é); e que o `preparar-tex` continua a correr **onde ele é a garantia**
  (o `criar-escola`, que não compila LaTeX, não precisa dele).
- **Custo da mudança:** um `Dockerfile` e uma imagem a manter; a lista de pacotes deixa de viver no
  `action.yml` e passa a viver na imagem — com a mesma verificação de `kpsewhich` a ter de ser movida.

### 7.2 Um commit em vez de dois, no elenco — **−1 min por conclusão**

O «Concluir elenco» escreve **o ficheiro** e **o índice da escola** em dois commits, e cada um
dispara o `derivados`. **Um commit com os dois arquivos** faria o mesmo trabalho por 1 minuto.

- **Ganho:** 1 min por conclusão de elenco (cenário B: −22 min/mês; pequeno, mas é o gesto com mais
  escrita por clique).
- **O que verificar:** que o índice e o ficheiro são escritos pela mesma árvore de commit (§5.3), e não
  por duas chamadas independentes.

### 7.3 O `publicar` por causa de um verbete — **−1 min por edição de estilo/dicionário**

`biblioteca/modalidades/**` está nos `paths` do `publicar.yml`. Mas uma edição de verbete muda **o
glossário do pacote**, que é gerado pelo `gerar-ciclo` — e o Worker publicado não serve esse ficheiro
directamente.

- **Ganho:** 1 min por edição de verbete ou termo (cenário B: 5/dia → −110 min/mês).
- **O que verificar, e é obrigatório:** se algum Worker lê `biblioteca/modalidades/**` em runtime. Se
  ler, o `publicar` **não** é desperdício e a alavanca cai. **Não se mexe antes de responder a isto
  com uma medição**, e não com uma impressão.

### 7.4 Uma geração por lote, e não por Turma — **−30 a −60 s por Turma extra**

O `Gerar o ciclo` corre uma vez por (professor, ciclo, Turma). Um elenco que serve três Turmas são
**três execuções de 2 min**. Uma matriz dentro de um job pouparia o *setup* repetido (checkout,
`preparar-node`, `preparar-tex` = ~100 s × 2).

- **Ganho:** nas Turmas 2 e 3, ~1 min cada (o trabalho real, 5 s, mantém-se).
- **O que verificar:** que o `wrangler deploy` de cada variante continua isolado (um deploy por
  variante), e que uma falha numa Turma não derruba as outras.

### 7.5 `concurrency` por variante — não poupa minutos, poupa execuções inúteis

Duas gravações seguidas do mesmo plano disparam **duas** gerações; a primeira é descartada pelo
`cancel-in-progress`. Não reduz o minuto já facturado, mas evita a segunda.

- **O que verificar:** que o `cancel-in-progress` do `gerar-ciclo` está por **variante** e não global
  (uma geração cancelada a meio deixa o pacote por publicar).

---

## 8. O que este documento não é

- **Não é um ensaio de carga.** É a multiplicação de tempos medidos por contagens de gestos
  hipotéticas. O dia em que a dúvida voltar, o que se mede é o **painel de billing** com uma escola a
  usar a sério — não este documento.
- **Não é a factura das requisições.** Essa está na §7.1 do `ARQUITETURA-GERAL.md` (PUT/GET ao
  GitHub), e as duas somam-se: uma gravação pode gastar **0 minutos de CI** e **3 PUT**, ou o
  contrário.
- **Não inclui o KV nem o Worker.** As quotas do KV (leituras/escritas/`list` por dia) e as
  invocações do Worker são outra factura, e a regra de ouro continua a ser a de sempre: **medir na
  bancada, ir ao ar uma vez por escola.**
- **Não decide nada.** As cinco alavancas têm ganho estimado e uma verificação obrigatória cada; a
  ordem em que se aplicam é dela.

---

## 9. As três coisas que fariam esta conta mudar

1. **A geração passar a ser incremental.** Hoje cada geração refaz o pacote inteiro. Se regenerasse só
   o que mudou, o trabalho real (5 s) continuaria a ser 5 s — mas o *setup* é que manda, e por isso
   isto só vale **depois** do §7.1.
2. **O número de Turmas por elenco crescer.** O multiplicador do §5 é o mais sensível de todos: 5
   Turmas por elenco são 10 min por conclusão, e não 4.
3. **A conta voltar a público.** Em repositório público o Actions é gratuito: esta factura desaparece
   por completo, e o que sobra é a das requisições. É a única alavanca que não custa trabalho — e é
   uma decisão de negócio, não de engenharia: **um repositório público expõe o código e o histórico**
   (e, com eles, o que estiver mal guardado).
