# O custo dos fluxos — o recálculo, sobre a auditoria do §L9f

> **Estado:** aberto a 19/11/2026. **Dono das decisões:** a proprietária. **A base:** o §L9f do
> [`PLANEJAMENTO-LASTRO.md`](PLANEJAMENTO-LASTRO.md) — a auditoria de 17/11/2026, com o modelo
> `jobs × ⌈s/60⌉` **conferido contra a fatura real com 3,5% de erro**. **A bancada da correcção:**
> [`experimentos/provar-o-custo-da-aula.js`](experimentos/provar-o-custo-da-aula.js) (12 asserções).
> **O que isto complementa:** a §7.1 do [`ARQUITETURA-GERAL.md`](ARQUITETURA-GERAL.md), que conta as
> **requisições** — outra factura.

## O pedido, e o que este documento é

> «Agora que nós desenhamos todos esses fluxos, isso impacta diretamente no nosso custo. […] A gente
> tem que imaginar que as escolas vão, de forma bastante estressante, muitas vezes ao dia, gerar
> esses fluxos. […] Quando virar o mês, eu vou voltar para o GitHub privado. E aí vai voltar a contar
> os minutos de cada vez que a gente tem um processo no CI/CD.»

**Este documento não re-deduz a conta — ele actualiza-a.** O §L9f já mediu as constantes, já validou
o modelo contra a fatura e já tirou a conclusão comercial. O que faltava era o **efeito dos fluxos
novos** (T1–T7) e uma verificação que ninguém tinha feito: **quantos workflows cada gesto dispara de
facto**. E essa verificação encontrou uma divergência de **factor 3** na linha mais importante.

---

## 1. A correcção: a aula custa 3 minutos, e não 1

**O que o §L9f diz**, e está certo no que mediu: na linha «lançar uma aula», uma execução —
`Fechar os derivados`, 14 s, **1 minuto**. Foi essa a unidade que a franquia comercial adoptou
(100 / 300 / 800 aulas) e que a capacidade de 1 478 aulas/mês pressupõe.

**O que faltava na linha:** o `POST /api/receber` tem um `depois` que **pede a geração** — está
escrito e comentado em `motor/servidor/rotas.js` desde 06/11/2026 («o `depois` pede a geração —
porque o pacote publicado só muda quando ela corre»). O §L9f mediu **um dos dois fluxos do gesto**.

> **A ressalva, e ela é obrigatória.** O que se prova por execução é que a **rota pede** a geração.
> O que **não** se observou foi um lançamento real a produzi-la: nos 100 runs mais recentes há quatro
> `Gerar o ciclo`, e nenhum coincide com um lançamento. Não se distingue «não houve lançamento» de
> «o disparo não aconteceu» — **é uma lacuna declarada**, e resolve-se com um lançamento observado ao
> vivo, não com uma inferência. O número 3 é o da rota; o número 1 é o do §L9f; enquanto a lacuna
> existir, a diferença é uma pergunta em aberto e não um facto.

**Medido agora, por execução** (`provar-o-custo-da-aula`, §A): um lançamento que corre pede a geração
**uma vez**, com o contexto do acto (escola, professor, ciclo, variante). E os dois contra-factuais
provam que é ali que o disparo nasce: **sem disparador** nenhum disparo é contado, e **sem a porta do
lançamento** o pedido não é aceite e nada é disparado.

| o que um lançamento dispara | min |
|:--|--:|
| `Fechar os derivados` (o commit em `professores/**`) | **1** |
| `Gerar o ciclo` (o dispatch do `depois`) | **2** |
| **uma aula** | **3** |

**A consequência, pela fórmula do próprio §L9f** (`capacidade = (2 000 − engenharia) ÷ min/aula`):
`(2 000 − 522) ÷ 3` = **492 aulas/mês**, e não 1 478. E a franquia do Avançado (**800 aulas**) deixa
de caber sozinha na cota gratuita: 800 × 3 = 2 400 min, contra 1 478 disponíveis.

> **O que isto não põe em causa.** O preço por aula (R$ 0,033 de minuto contra R$ 0,175–0,699 de
> receita) continua a dar margem de 81–95 %: o compute nunca foi o problema económico. O que muda é a
> **capacidade** — quantas escolas cabem — e portanto o **gatilho de migração**, que o §L9f já
> definiu como sendo de disponibilidade e não de preço.

---

## 2. As constantes — medidas, e coincidentes com o §L9f

Medido hoje contra a API (últimos 100 runs, duração de cada job e dos seus passos). **Um job por
execução** nos quatro workflows, e a facturação **arredonda ao minuto, por job**:

| workflow | quando | job medido | **min** |
|:--|:--|--:|--:|
| **Gerar o ciclo** | dispatch (lançamento, plano, PO, estilo, dicionário) | 74–135 s (mediana 111 s) | **2** |
| **Fechar os derivados** | push em `professores/**`, `escola/**`, `indices/esquema/**`, os geradores | 7–29 s | **1** |
| **Publicar o sistema** | push em `motor/**`, `biblioteca/modalidades/**`, `professores/**/ciclos/ciclo-*/**`, `*.conf` | 24–44 s | **1** |
| **Criar a escola** | dispatch da página | 30–63 s | **1** (2 na cauda) |

**Preço:** `US$ 0,006/min` no runner Linux standard = **R$ 0,033** (câmbio 5,50, como no §L9f).
Cota: **US$ 12 de compute no Free** (≈ 2 000 min) e **US$ 18 no Pro/Team** (≈ 3 000 min) —
documentação oficial consultada a 19/11/2026.

**O que não se mediu, e por isso se diz:** o **consumo** em minutos. A conta está num repositório
público: a API de billing responde `{"billable":{}}` e o `/timing` de cada workflow vem vazio. Mede-se
o **tempo** de cada execução; o preço é a multiplicação. Não houve ensaio de carga.

---

## 3. Onde vão os segundos do job que domina o custo

O `Gerar o ciclo` são **2 dos 3 minutos de cada aula**. O que ele faz com eles, medido passo a passo
num job de 117 s:

| passo | tempo | % |
|:--|--:|--:|
| `Set up job` + `checkout` | 8 s | 7 % |
| **`preparar-node`** (`npm ci`, `wrangler`) | **14–21 s** | 12–16 % |
| **`preparar-tex`** (pandoc, TeX, pdfinfo — dos `.deb` em cache) | **78 s** | **67 %** |
| **Gerar e validar o pacote** | **5 s** | **4 %** |
| Commitar o pacote · publicar no Cloudflare | 7–15 s | 6–13 % |

**O trabalho pelo qual se paga são 5 segundos.** Os outros 112 são **preparar a máquina** que o faz, e
ela é descartada no fim.

**E o número que manda é o arredondamento, não a média:** um job de 61 s custa o mesmo que um de
120 s. O job está a **111 s — a nove segundos da fronteira**. Baixar a 60 s factura **1 minuto em vez
de 2**, e corta metade dos 2 minutos que cada aula carrega.

---

## 4. O que dispara o quê — e as duas inferências que os runs corrigiram

**Duas versões deste quadro estiveram erradas, e as duas por inferir dos `paths` sem verificar o
caminho real dos ficheiros.** Ficam registadas porque o erro é instrutivo:

| o que eu supus | o que é |
|:--|:--|
| «o acervo vive em `envelope/`, que não está nos `paths` — logo gravar uma anamnese custa 0» | o acervo da escola vive em **`escola/<escola>/envelopes/`**, e `escola/**` **está** nos paths do `derivados`. **Custa 1 min** |
| «gravar o plano escreve em `professores/**/ciclos/ciclo-*/**` — logo dispara `publicar`» | o ficheiro é `…/ciclos/ciclo-01-breu-rosa-plano.md`, um **ficheiro** e não uma pasta. **Não dispara `publicar`** |

**O que os runs de 20/11, 00:44 — um gesto real dela (gravou o plano e o PO) — mostram:**

| commit | ficheiros | workflow |
|:--|:--|:--|
| `feat(acervo)` | `escola/breu/envelopes/plano-…json` | `Fechar os derivados` |
| `feat(acervo)` | `escola/breu/envelopes/.indice.json` | `Fechar os derivados` |
| `feat(plano)` | `professores/demi-plie/ciclos/ciclo-01-breu-rosa-plano.md` | `Fechar os derivados` |
| `feat(acervo)` ×2 + `feat(po)` | idem, para o PO | `Fechar os derivados` |

**Seis commits, seis execuções de `Fechar os derivados` — e cinco canceladas.**

> **CORRECÇÃO DE 20/11/2026, e ela desfaz a conclusão que aqui estava.** Este parágrafo dizia que o
> `concurrency` «funde» o que cai no mesmo minuto, e que «seis commits custaram 1 minuto, não seis».
> **Medido outra vez, não funde: LANÇA e CANCELA.** Oito commits em 33 segundos produziram **oito
> execuções**, sete `cancelled` ao fim de 3 a 5 segundos. Se a execução cancelada for faturada — e a
> documentação do GitHub manda arredondar ao minuto —, o `derivados` custa **8 minutos** onde esta
> nota dizia 1, e a «alavanca mais eficaz que o sistema já tem» **não existe**: o que reduz o custo é
> o número de commits, não o `concurrency`.
>
> **E não se resolve hoje por medição:** o `timing` do GitHub devolve `billable_ms: 0` em todas as
> execuções, porque o repositório é **público** e nesse regime nada é facturado. O teste decisivo é
> um gesto igual a este depois de o repositório voltar a privado, lido na página de facturação.
> Enquanto isso não acontecer, **os números de `derivados` deste documento têm duas leituras
> possíveis, com factor 8** — e apresentar uma delas como medida seria exactamente o erro que este
> documento existe para não cometer. Ver `REGISTRO.md` 20/11/2026.

**E nenhum `Publicar o sistema` nem `Gerar o ciclo` nesse gesto.** Gravar o plano e o PO, na porta,
**não** publica nem gera: o que fecha o ciclo é a geração, e ela é pedida por outros caminhos.

### O quadro, agora medido

| o commit toca | `derivados` | `publicar` | `Gerar o ciclo` |
|:--|:--:|:--:|:--:|
| `escola/**` (acervo, linhas de base, índices) | **sim** | não | — |
| `professores/**/ciclos/*.md` (a fonte do plano e do PO) | **sim** | **não** | não |
| `professores/**/ciclos/ciclo-*/**` (o pacote gerado) | **sim** | **sim** | — |
| `professores/**/ciclos/*.conf` | **sim** | **sim** | — |
| `biblioteca/modalidades/**` (notação, vocabulário) | não | **sim** | — |
| `indices/esquema/**`, os geradores | **sim** | não | — |
| `motor/**`, `workers/**`, `raiz/**` (desenvolvimento) | não | **sim** | — |

E o **dispatch** (`Gerar o ciclo`) vem de três sítios: o lançamento de uma aula, o estilo e o
dicionário (T5/T6), e a cadeia quando chega à etapa do pacote.

---

## 5. A matriz do recálculo — cada gesto, em minutos

Caso base: **uma Turma com plano**. A coluna «origem» distingue o que foi **observado nos runs** do
que foi **provado em bancada** — e é a parte que não se pode saltar.

| gesto (o que ela clica) | commits | der | pub | gerar | **min** | origem |
|:--|--:|--:|--:|--:|--:|:--|
| **Criar/editar a anamnese** | 2 (`escola/**`) | 1 | 0 | 0 | **1** | runs |
| **Gravar o Plano de Ensino** | 4 (`escola/**` ×2 + `*.md` ×2) | 1 | 0 | 0 | **1** | **runs de 00:44** |
| **Gravar o PO** | 4, idem | 1 | 0 | 0 | **1** | **runs de 00:44** |
| **Editar um termo livre (T6)** | 1 (`biblioteca/**`) | 0 | 1 | 0 | **1** | runs |
| **Editar um verbete em uso (T5)** | 1 + dispatch | 0 | 1 | 1 | **3** | **runs de 00:31** |
| **Editar um termo em uso (T6)** | 1 + dispatch | 0 | 1 | 1 | **3** | código (T6) |
| **Lançar uma aula** | 1 (`professores/**`) + dispatch | 1 | 0 | 1 | **3** | bancada (**lacuna**: não observado) |
| **Concluir o elenco** | 2 (`escola/**`) + dispatch | 1–2 | 0 | 1 | **3–4** | runs de 20:51 |
| **Transferir uma aluna** (2 lados) | 4 + 2 dispatch | 1–2 | 0 | 2 | **5–6** | por analogia |
| **Criar Sala, professor, aluna** | 0 (KV) | 0 | 0 | 0 | **0** | código |
| **T2 · T3 · T4** | 0 (KV) | 0 | 0 | 0¹ | **0** | código |
| **Criar uma escola** | — | — | — | criar-escola | **1** | §L9f |

¹ o caso comum do T2 **custa zero**, e é um resultado: a cadeia pára em `bloqueada` (a autoria não se
reescreve), e uma etapa bloqueada não chega à geração. O **T3** bloqueia sempre. Os três fluxos que
ela mandou desenhar são, em CI, **os mais baratos de todos** — o que eles fazem é **parar** e dizer.

**O cancelamento é a peça que faltava na conta.** Um gesto que escreve quatro commits no mesmo minuto
**não** custa quatro vezes: custa **um**, porque o `concurrency` do `derivados` mata as anteriores. Era
a isto que o §L9f chamava «a consolidação tirou o arredondamento que se pagava por trabalho que não
existia» — e vale também dentro de um gesto.

**O multiplicador que ela tem de ver:** o `Gerar o ciclo` corre **uma vez por (professor, ciclo,
Turma)**. Uma Turma com dois ciclos, ou um elenco que serve três Turmas, **multiplica** os 2 min.

---

## 6. Os três cenários — minutos por mês, e o que custam

Hipóteses: **22 dias úteis**, cada gesto com o valor da §5.

### A — Escola pequena, uso corrente (1 professora, 1 ciclo)

| por mês | qtd | min |
|:--|--:|--:|
| aulas lançadas (3/semana) | 12 | 36 |
| plano + PO | 2 | 2 |
| verbetes editados | 8 | 24 |
| conclusão do elenco | 1 | 4 |
| **total** | | **66** |

**66 min/mês = US$ 0,40** — **3,3 % da cota Free**. O CI desta escola é ruído.

### B — Escola em produção (5 professoras, 2 ciclos, uso corrente)

| por dia útil | qtd | min |
|:--|--:|--:|
| aulas lançadas | 10 | 30 |
| planos e PO | 4 | 4 |
| verbetes e termos | 5 | 15 |
| elenco | 1 | 4 |
| trocas de sala/modalidade | 2 | **0** |
| **total/dia** | | **53** |

**53 × 22 = 1 166 min/mês = US$ 7,00** — **58 % da cota Free**, 39 % da Pro. Uma escola grande
consome mais de metade do que o plano gratuito inclui.

### C — Stress: o que ela pediu para imaginar

**Três escolas, 113 gestos-minuto por dia** (25 aulas, 4 planos/PO, 10 verbetes, 1 elenco), todos os
dias:

| | |
|:--|--:|
| min/dia por escola | **113** |
| min/mês por escola (× 30) | 3 390 |
| **três escolas** | **10 170 min** |
| custo | **US$ 61,02** |
| excedente, no Pro | **US$ 43,02/mês** |

**O número que importa não é o total: uma única escola em stress (3 390 min/mês) já estoura a cota
Free (2 000) e a Pro (3 000).** O stress não é um cenário de 40 escolas — é de **uma**.

### D — O que muda com os fluxos revistos (T1–T7)

| passo | min de CI | porquê |
|:--|--:|:--|
| **T1** — a Sala a mandar na direção | **0** | é leitura; não escreve no repositório |
| **T2** — mudar o professor de uma Sala | **0** no caso comum | **bloqueia** (autoria) |
| **T3** — a troca de modalidade | **0** | bloqueia por construção |
| **T4** — os conteúdos migrados | **0** | é KV — e **fecha** um caminho que escrevia sem guarda |
| **T5** — o estilo a regerar | **3** por verbete **em uso** | era 0 *porque nada acontecia* |
| **T6** — o dicionário | **1 livre · 3 em uso** | a condição que ela fixou é também a do custo |
| **T7** — o calendário (por fazer) | **0** hoje | mas mexe no `gerar-ciclo`, e pode **mudar os 2 min** |

**Conclusão do recálculo:** os fluxos novos **não** empurram a factura — o T5, que é o mais caro
deles, custa o mesmo que uma aula. O que a empurra é a **geração**, e a alavanca que já existe
(o cancelamento) já lhe põe um travão.

---

## 7. Onde o custo está — e as seis alavancas

Ranking do cenário B (53 min/dia), por workflow:

| workflow | min/dia | min/mês | % |
|:--|--:|--:|--:|
| **Gerar o ciclo** | **32** | **704** | **60 %** |
| Fechar os derivados | 16 | 352 | 30 % |
| Publicar o sistema | 5 | 110 | 9 % |

**A geração é 60 % da factura e o `derivados` 30 %** — e é por isso que as alavancas atacam as duas.
O `publicar`, que parecia caro, é o mais barato dos três.

As alavancas, por ganho, **com o que verificar antes de mexer**:

### 7.1 Agrupar as gerações dos lançamentos — a maior, e a mais barata de desenhar

**Dez aulas lançadas seguidas disparam dez gerações** — 20 min para publicar um pacote que só muda no
fim. Um **agrupamento** (gerar uma vez, N segundos depois do último lançamento da mesma variante)
pouparia **9 de cada 10** dessas gerações.

- **Ganho, no cenário B:** 10 aulas/dia → 2 gerações em vez de 10 = **−16 min/dia = −352 min/mês**
  (−30 % do total — sensivelmente o mesmo que a alavanca do TeX, e sem tocar em infra).
- **O que verificar:** que o pacote continua a refletir o último lançamento (é o que a geração faz); e
  que um agrupamento não perde o que não couber na janela.
- **Porque é a primeira:** não mexe em infra nem em imagem — mexe numa decisão de **quando** gerar.

### 7.2 Tirar a instalação do TeX do caminho crítico — **até −18 % no total**

O job está a **111 s**; a fronteira dos 2 min é a 120 s. Tirando o `preparar-tex` do caminho (imagem
de container com o conjunto já instalado), o job cai a ~40 s e factura **1 min**.

- **Ganho:** a geração passa a valer 1 min; no cenário B, 1 166 → **814 min/mês** (US$ 7,00 →
  US$ 4,88); no C, da ordem de **−30 %** (US$ 61 → ~US$ 43).
- **O que verificar:** que o `pull` da imagem não acrescenta tempo de job; e que a verificação por
  `kpsewhich` (que hoje guarda a lista no `action.yml`) continua a existir, agora dentro da imagem.

### 7.3 A conclusão do elenco escreve dois commits — **−1 min por conclusão**

O «Concluir elenco» escreve **o ficheiro** e **o índice da escola** em dois commits, e cada um
dispara o `derivados`. Um commit com os dois arquivos faz o mesmo por 1 minuto.

- **Ganho:** 1 min por conclusão (−22 min/mês no B). **O `concurrency` NÃO reduz este ganho** — ele
  cancela a segunda execução, mas cada execução lançada continua a ser uma linha na factura (ver a
  correcção de 20/11/2026 na §4). Pelo contrário: é esta alavanca que continua a valer, porque o que
  se poupa é **uma execução a menos**, e não uma execução interrompida.
- **O que verificar:** que os dois arquivos entram na mesma árvore de commit (§5.3).

### 7.4 Tirar `biblioteca/modalidades/**` do `publicar` — **−1 min por edição de estilo/dicionário**

Uma edição de verbete muda o **glossário do pacote**, que é gerado pelo `gerar-ciclo`.

- **Ganho:** 1 min por edição (no B: 5/dia → −110 min/mês).
- **Verificação obrigatória, e antes de tudo:** se algum Worker lê `biblioteca/modalidades/**` em
  runtime. **Se ler, a alavanca cai** — e não se decide isto por impressão.

### 7.5 Uma geração por lote, e não por Turma — **−1 min por Turma extra**

O `Gerar o ciclo` corre uma vez por (professor, ciclo, Turma). Uma matriz dentro de um job pouparia o
*setup* repetido (~100 s por Turma a mais).

- **O que verificar:** que o `wrangler deploy` de cada variante continua isolado, e que a falha de uma
  não derruba as outras.

### 7.6 `concurrency` por variante — não poupa minutos; evita a segunda execução

Duas gravações seguidas do mesmo plano disparam duas gerações; a primeira é descartada pelo
`cancel-in-progress`. Não reduz o minuto já facturado — evita o seguinte.

---

## 8. As três coisas que fariam esta conta mudar

1. **A geração deixar de correr a cada lançamento.** É a §7.1, e é a única que muda a **unidade
   comercial**: se a aula passar a custar 1 min em vez de 3, a capacidade volta a ~1 478 aulas/mês e
   a franquia do Avançado (800) volta a caber. **É a decisão com mais consequência comercial de todo
   este documento**, e é dela.
2. **A conta voltar a público.** Em repositório público o Actions é gratuito e esta factura
   desaparece; o §L9e já diz que isso é **temporário**, porque as fontes pedagógicas não se expõem.
3. **O número de Turmas por elenco crescer.** O multiplicador da §5 é o mais sensível: 5 Turmas por
   elenco são 10 min por conclusão, e não 4.

---

## 9. O que este documento não é

- **Não é um ensaio de carga.** É a multiplicação de tempos medidos por contagens de gestos
  hipotéticas; o §L9f já validou o **modelo** contra a fatura (3,5 % de erro), e o que aqui se
  acrescenta é a **contagem de execuções por gesto**, que era a parte que faltava.
- **Não é a factura das requisições** — essa está na §7.1 do `ARQUITETURA-GERAL.md`. As duas somam-se:
  **uma anamnese custa 1 a 2 minutos de CI** (dois commits em `escola/**`; o `concurrency` cancela
  um deles, mas não o apaga da factura — ver a correcção de 20/11/2026) e
  ~6 `PUT`; **uma aula custa 3 minutos** (por confirmar ao vivo) e ~10.
- **Não inclui KV nem invocações do Worker**: outra factura, e a regra de ouro continua a ser a de
  sempre — **medir na bancada, ir ao ar uma vez por escola.**
- **Não decide nada.** As seis alavancas têm ganho calculado e uma verificação obrigatória cada; a
  ordem é dela.
