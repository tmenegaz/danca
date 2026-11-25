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

> **Medida a 20/11/2026, e vale mais do que a estimativa.** Num gesto real de 30 segundos, o
> `Gerar o ciclo` foi pedido **duas vezes** para um só acto — 86 s e 41 s —, porque a conclusão do
> elenco e a gravação que fecha o lote pedem uma geração cada. Agrupar poupa **uma delas por acto**,
> e não só nas dez aulas seguidas. A contagem inteira, execução a execução, está na **§7.10**.

### 7.2 Tirar a instalação do TeX do caminho crítico — **até −18 % no total**

O job está a **111 s**; a fronteira dos 2 min é a 120 s. Tirando o `preparar-tex` do caminho (imagem
de container com o conjunto já instalado), o job cai a ~40 s e factura **1 min**.

- **Ganho:** a geração passa a valer 1 min; no cenário B, 1 166 → **814 min/mês** (US$ 7,00 →
  US$ 4,88); no C, da ordem de **−30 %** (US$ 61 → ~US$ 43).
- **O que verificar:** que o `pull` da imagem não acrescenta tempo de job; e que a verificação por
  `kpsewhich` (que hoje guarda a lista no `action.yml`) continua a existir, agora dentro da imagem.

> **Resolvida a 20/11/2026, e por um caminho mais barato do que este.** Não foi preciso imagem
> nenhuma: o **PDF saiu do fluxo**, e com ele o TeX. O `preparar-tex` continua a instalar pandoc
> (é dele que sai todo o HTML) mas já não instala TeX. Medido em três execuções: o passo caiu de
> **61–68 s** para **10–31 s**, e o job de **97–107 s** para **34–60 s**. Ver a §7.8 — e, lá, a
> ressalva: uma das três encostou nos 60 s, que é a fronteira da factura.

### 7.3 A conclusão do elenco escreve dois commits — **−1 min por conclusão**

O «Concluir elenco» escreve **o ficheiro** e **o índice da escola** em dois commits, e cada um
dispara o `derivados`. Um commit com os dois arquivos faz o mesmo por 1 minuto.

- **Ganho:** 1 min por conclusão (−22 min/mês no B). **O `concurrency` NÃO reduz este ganho** — ele
  cancela a segunda execução, mas cada execução lançada continua a ser uma linha na factura (ver a
  correcção de 20/11/2026 na §4). Pelo contrário: é esta alavanca que continua a valer, porque o que
  se poupa é **uma execução a menos**, e não uma execução interrompida.
- **O que verificar:** que os dois arquivos entram na mesma árvore de commit (§5.3).

> **Confirmada a 20/11/2026, e é a maior das três em execuções.** No gesto medido na **§7.10**,
> **três dos oito pushes são escrita de índice** — `linhas-de-base/.indice.json`,
> `envelopes/.indice.json` e outra vez `envelopes/.indice.json`, este último gravado **antes** do
> envelope que o justifica. Um commit com os dois faz o mesmo por uma execução menos, e há um ganho
> que não é de minutos: hoje o `derivados` pode ver o índice novo com o envelope velho, porque o
> índice chega primeiro.

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

## 7.7 O que mudou desde o recálculo — medido a 20/11/2026, sobre execuções reais

> **Porque esta secção existe.** «Para verificar o custo do processo […] a gente já vai ter também a
> medição daquele commits, que a gente diminuiu a quantidade de commits e também o uso do tex […]
> para verificar se tivemos uma redução de custo significativo. Alguma tivemos, né? Mas para a gente
> poder saber o quanto tivemos.»

Duas mudanças entraram desde o recálculo de 19/11, e as duas foram medidas na API — não estimadas:
**os workflows fundiram-se** (16/11: `Regerar os índices` + `Reancorar a cadeia` → `Fechar os
derivados`; `Publicar as escolas` + `Publicar a raiz` → `Publicar o sistema`) e **o TeX passou a ser
mínimo e em cache** (22/10).

### a) Execuções por gesto — a metade que mais pesa

Um gesto de geração («Guardar» do plano e do PO, e a geração que ele dispara), agrupado por janelas
de 2 minutos:

| | antes da fusão (15/11) | hoje (20/11) |
|:--|--:|--:|
| `Regerar os índices` | 8–12 (6–8 canceladas) | — |
| `Reancorar a cadeia` | 4 (2 canceladas) | — |
| `Publicar as escolas` + `Publicar a raiz` | 2–4 | — |
| **`Fechar os derivados`** | — | **7–8 (6–7 canceladas)** |
| **`Publicar o sistema`** | — | **1** |
| `Gerar o ciclo` | 1 | 1 |
| **execuções no gesto** | **15–19** | **8–10** |

**Jobs bem-sucedidos por gesto** (é o que se factura): **7, 9 e 9** antes → **3 e 2** hoje.

| gesto medido | jobs pagos | min |
|:--|--:|--:|
| 15/11 15:44 | 7 (regerar 2 · reancorar 2 · publicar 2 · gerar 1) | **8** |
| 15/11 16:48 | 9 (regerar 4 · reancorar 2 · publicar 2 · gerar 1) | **10** |
| 15/11 22:21 | 9 (idem + a raiz) | **10** |
| 20/11 15:28 | 3 (derivados 1 · publicar 1 · gerar 1) | **4** |
| 20/11 15:33 | 2 (derivados 1 · gerar 1) | **3** |

**De 8–10 para 3–4 minutos por gesto — cerca de 60 % menos**, e é a fusão dos workflows que o fez:
o mesmo trabalho passou de três ou quatro execuções para uma.

> **Duas reservas a esta linha, medidas a 20/11/2026 (§7.10).** Primeira: `Gerar o ciclo` **não é
> sempre 1** — num acto com elenco, plano e PO ele foi pedido **duas vezes** (86 s e 41 s), porque
> cada gravação que fecha uma etapa pede a sua geração. Segunda: o gesto completo custou **dez**
> execuções, e não oito — os commits do índice entram na conta. As duas reservas não desfazem a
> conclusão da fusão; desfazem é a ideia de que o número já está no chão.

**A ressalva das canceladas continua de pé.** Se as 6–8 execuções canceladas forem facturadas
(arredondadas ao minuto), o gesto de hoje custa **10–11 min** e o de 15/11 custava **16–18** — a
redução cai para ~35 %, mas não desaparece. Qual das duas leituras é a verdadeira **não se mede
enquanto o repositório for público** (`billable_ms: 0` em todas as execuções) — é a mesma lacuna que
a correcção de 20/11 já declarou.

### b) O TeX — a metade, e não o terço que se esperava

O passo que instala pandoc e TeX, medido em execuções reais de `Gerar o ciclo`:

| quando | passo | job | facturado |
|:--|--:|--:|--:|
| **antes do ajuste** (20/10, `Instalar pandoc, TeX e pdfinfo`) | **130 s · 170 s** | 177 s · 211 s | **3 · 4 min** |
| no dia do ajuste (22/10) | 84 s · 110 s | 141 s · 145 s | 3 min |
| 15/11 | 68 s | 100 s | 2 min |
| **hoje** (6 execuções) | **56 · 61 · 62 · 64 · 78 · 81** — mediana **63 s** | 89–128 s | **2 · 2 · 2 · 3 · 3 · 2** |

**O passo caiu ~55 %** (130–170 s → mediana 63 s). **A factura do job caiu menos:** 3,2 → 2,3 min em
média (−26 %), porque **duas das seis execuções de hoje passaram dos 120 s** e voltaram a custar 3
minutos. A média esconde a fronteira, e a fronteira é o que se paga.

**E o número que interessa para a §8:** para o `Gerar o ciclo` custar **1 minuto**, o job tem de
fechar em **60 s**. O TeX sozinho leva **56–81 s**. **Enquanto o TeX correr dentro do job, o minuto é
inalcançável** — não é uma questão de afinar: é a soma. O caminho para 1 minuto passa por **tirar o
PDF do job** (compilá-lo noutro sítio, ou só quando o conteúdo mudar), e não por acelerar o
`apt-get`.

### c) Commits por gesto — a redução já era de 22/10, e não mudou hoje

O `gravarArquivosNumCommit` (22/10) levou o «Guardar» de **11 commits para 8** («onze commits em
vinte e dois segundos» → 8 arquivos, 1 commit). Medido hoje, num gesto de 12:33: **8 commits de
fonte** — e é o mesmo número de 15/11. **Hoje não houve redução de commits**, e dizê-lo seria
atribuir à fusão uma poupança que veio de outra correcção.

### d) O que isto responde

| pergunta | resposta medida |
|:--|:--|
| «a gente diminuiu a quantidade de commits»? | nos **commits**, não (8, como antes); nas **execuções** por gesto, sim — **15–19 → 8–10** |
| «o uso do TeX»? | o passo caiu **~55 %**; o job, **~26 %** na média |
| «houve redução de custo significativa»? | **sim, ~60 %** no gesto, pela fusão dos workflows; **~35 %** se as canceladas forem facturadas |
| «dá para chegar a 1 minuto?» | **não com o TeX dentro do job** — ele sozinho já passa dos 60 s. **Chegou-se a 20/11/2026, tirando o TeX: ver a §7.8** |

## 7.8 O PDF saiu do fluxo — e o minuto do §7.7 chegou (20/11/2026)

**A pergunta dela.** «O PDF, a gente não pode colocar ele mediante demanda? […] eu acho que ele vai
ser gerado tão pouco e quando o professor clicar ali no PDF, aí sim dispara o processo.»

**A resposta é sim, e a medição mostra que o ganho é maior do que o PDF.** A decisão foi tomada na
mesma conversa: **o PDF deixa de existir como ficheiro; quem imprime é o navegador**.

### a) O PDF não era o custo — era a máquina que o compila

| passo | run 44770733345 | 44769892060 | 44767545583 |
|:--|--:|--:|--:|
| `preparar-node` | 8 s | 13 s | 7 s |
| **`preparar-tex`** | **61 s** | **67 s** | **68 s** |
| **Gerar e validar o pacote** (9 HTML **+ os 2 PDFs**) | **5 s** | **6 s** | **5 s** |
| Commitar · Publicar | 8 · 7 s | 6 s | 7 · 6 s |
| **job** | **97 s** | **107 s** | **107 s** |

Os dois PDFs (o consolidado e o da aula) cabiam nos 5–6 s do passo que também escreve as nove
páginas. **O que custava 61–68 s era instalar o TeX para os compilar** — em toda geração, mesmo
quando ninguém os ia abrir.

### b) O mesmo passo, sem TeX, na mesma infra

O `criar-escola` já chamava a **mesma ação** com `com-tex: false` (a chave existe desde o primeiro
dia, `action.yml:36`) — e serve de controlo, porque é o mesmo runner, a mesma cache e o mesmo
`apt`:

| | `preparar-tex` | job inteiro |
|:--|--:|--:|
| `gerar-ciclo` (com TeX) | **61–68 s** | 97–107 s |
| `criar-escola` (sem TeX) | **10–11 s** | **30 s** |

### c) O que se ganha — medido de ponta a ponta, no ar

Três execuções de verdade com o fluxo novo, na mesma infra e no mesmo dia:

| | `preparar-tex` | «Gerar e validar» | **job** |
|:--|--:|--:|--:|
| **antes** — 44770733345 | 61 s | 5 s | **97 s** |
| **antes** — 44769892060 | 67 s | 6 s | **107 s** |
| **antes** — 44767545583 | 68 s | 5 s | **107 s** |
| **depois** — 44776801265 | 10 s | 3 s | **34 s** |
| **depois** — 44777144712 | 31 s | 2 s | **60 s** |
| **depois** — 44777538667 | 25 s | 2 s | **49 s** |

| | antes | depois |
|:--|--:|--:|
| duração do job | 97–107 s | **34–60 s** |
| **minutos facturados por geração** | **2** | **1** |
| execuções de `gerar-ciclo` em 20/11/2026 | 22 (17 com sucesso) | — |
| minutos de geração nesse dia | ~44 | **~22** |

**E o número que não é confortável, e fica escrito.** Os 60 s de 44777144712 são **exactamente** a
fronteira do Actions: acima dela, a execução factura 2 minutos outra vez. A variação de 10 a 31 s no
`preparar-tex` é do caminho do `apt` — quando o cache dos `.deb` serve, são 10 s e o job fecha nos
34; quando não, o `apt-get update` volta e o job sobe. **O que isto quer dizer: a poupança é real
(~50 % na duração) mas a passagem a 1 minuto depende de o cache servir.** Se se quiser a folga, o
passo seguinte é tirar o `apt` do caminho (imagem de container — o §7.2), e essa conta muda.

**Isto é a alavanca do §7.2, e é a versão mais barata dela.** O §7.2 propunha uma imagem de
container com o TeX já instalado; não é preciso nada disso — basta não precisar de TeX. Não há
imagem para manter, nem `pull` a somar tempo de job.

### d) O que se perde, e está declarado

- **As quatro verificações do PDF** (bookmarks, links internos, páginas, rodapé em todas as
  páginas) deixam de correr em cada geração. O `check-pacote.js` mantém-nas para um pacote que
  ainda traga o PDF, e emite **aviso** quando ele falta — para a diferença entre «não foi gerado» e
  «foi esquecido» não desaparecer.
- **O índice navegável e os bookmarks.** O navegador imprime a página; não constrói um documento
  com barra lateral. Quem quer o ciclo inteiro num ficheiro percorre o menu.
- **A tipografia do LaTeX.** As páginas no papel são as mesmas que se vêem na tela.
- **O que NÃO se perde:** a âncora de proveniência. O `.fipp` hasheia as **fontes** (`.conf`,
  `.md`), e o PDF nunca esteve na cadeia.

### e) O que isto não decide

O `tools/templates/ciclo-cabecalho.tex` e o modo `--latex` do `lib-tokens.js` ficaram **sem
consumidor**. Não se apagaram: `tools/templates/` está em `CONGELAMENTO.md`, e mexer num congelado
pede motivo declarado e commit próprio. E, sobretudo: **não custam nada** — não são executados em
geração nenhuma. São 113 linhas de preâmbulo LaTeX que ficam como o caminho de volta, caso o PDF
regresse; apagá-las economizaria **zero segundos**.

### f) O que saiu a seguir, e o que **não** vale a pena tirar (20/11/2026, mesma data)

A ação de preparo chamava-se `preparar-tex` e passou a chamar-se **`preparar-pandoc`** — porque é o
que ela faz. Com ela saíram o TeX (já não estava a ser instalado), o **poppler** (`pdfinfo` e
`pdftotext`, que só liam PDFs) e a conferência por `kpsewhich` dos 20 `.sty`. Uma ação que diz
«TeX» e instala só pandoc é a mesma família de defeito que este documento persegue: a tela a
afirmar um facto que não leu.

**E o pandoc não sai.** Ele é o compilador: o `gerar-ciclo.sh` chama-o uma vez por documento com o
template `ciclo.html`, o `criar-escola.sh` para a apresentação da escola, e o `gerar-raiz.sh` para a
página da raiz. Sem ele não há HTML nenhum. Trocá-lo por um renderizador próprio (o
`motor/nucleo/ficha-html.js` já tem um, mínimo, para as fichas) seria reescrever a geração — índice,
template, `{#id}`, tabelas, `raw_tex` — com o `check-pacote` a medir 240 links internos por pacote.

**E, mesmo que se reescrevesse, não pouparia minuto nenhum.** A factura arredonda ao minuto: 49 s e
25 s custam o mesmo. Onde há minutos a ganhar é no **número de execuções por gesto** — a §7.1 —, não
na duração de cada uma.

**O que a medição da ação nova mostrou, e não era o que eu esperava.**

| run | `preparar-pandoc` | job |
|:--|--:|--:|
| 44781355240 — cache frio | 26 s | **59 s** |
| 44781717178 — cache a servir | 33 s | **75 s** |

Tirar o poppler **não poupou nada**: o custo não são os pacotes, é a cerimónia do `apt` (copiar os
`.deb`, o `Reading database` do dpkg, os gatilhos). Um pacote ou quatro, 25 a 33 s. E entre as duas
execuções o job variou **16 s** sem nada diferente no repositório — `preparar-node` de 9 para 16 s,
`Publicar` de 6 para 9 s. **Com este ruído, «1 minuto» é probabilidade, não garantia.**

### g) O `apt` saiu. O pandoc passou a ser um binário, não um pacote (20/11/2026)

O número que apontava o remédio: o binário do pandoc no Debian pesa **199 MB** (Haskell sem
`strip`), e era isso que o `apt` passava 25 s a instalar. A decisão foi tomada, e o método mudou:

| | pelo `apt` | binário estático (agora) |
|:--|--:|--:|
| o que se transfere | 4 pacotes, 28,3 MB de `.deb` | **1 arquivo, 28 MB** |
| o que se instala | 204 MB de disco, dpkg + gatilhos | **131 MB, `tar xzf`** |
| tempo do passo | **25–33 s** | **2 s** |
| versão | a do espelho do Ubuntu no dia | **3.1.3, fixada** |
| proveniência | o espelho do Ubuntu | **`sha256` conferido em toda execução** |

**A versão é a mesma que o `apt` instalava — 3.1.3 —, e isso é o que garante que nada muda no
pacote.** Antes de adoptar, mediu-se: cinco fontes reais (o plano, a aula, a notação, a captura e o
guia do professor) renderizadas pelas duas versões com o template `ciclo.html` — **byte a byte
idênticas**. E a confirmação mais forte, sobre a árvore inteira: o pacote do `demi-plie/01/breu-rosa`
gerado com cada um dos binários é **o mesmo, ficheiro por ficheiro** (`diff -r`, sem uma linha).

**A ação faz três coisas, e a terceira é a que faltava.**
1. Restaura o arquivo do cache (`actions/cache`, chave com a versão e o hash) ou baixa-o do release.
2. **Confere o `sha256`** e só então extrai. Um download truncado, um cache corrompido ou um asset
   substituído param aqui — antes de gerar nada.
3. **Compila um documento de prova com o template do projecto** (`--standalone --toc`, `{#id}` do
   `header_attributes`) e exige as três marcas no resultado. Esta é a diferença entre «o binário
   arranca» e «o binário compila o nosso documento»: um tar truncado que ainda descomprima daria um
   `--version` verde e falharia na geração, tarde, depois de metade do pacote escrita.

**O custo de manter o pin:** uma linha de versão, um nome de ficheiro, uma chave de cache e um
hash — os quatro mudam juntos, e o cache invalida sozinho. Está escrito no cabeçalho da ação.

#### Medido no ar, duas execuções de cada método

| | `preparar-pandoc` | **job** |
|:--|--:|--:|
| `apt`, cache frio — 44781355240 | 26 s | 59 s |
| `apt`, cache quente — 44781717178 | 33 s | 75 s |
| **binário, cache frio** — 44783606786 («Cache not found») | **2 s** | **45 s** |
| **binário, cache quente** — 44783646385 (download saltado) | **2 s** | **34 s** |

**O passo caiu de 25–33 s para 2 s — e é 2 s nos dois casos.** Com o cache vazio, o download do
release são 392 ms (144 MB/s) e o resto é o hash e o `tar`; com o cache cheio, o `actions/cache`
restaura o mesmo arquivo em 395 ms. Não há diferença prática entre os dois caminhos, o que é uma
propriedade e não uma coincidência: o que se paga é o mesmo arquivo de 28 MB, venha de onde vier.

**E o job ficou em 34–45 s** — os dois abaixo da fronteira dos 60 s, com margem. A variação que
resta é do `preparar-node` (7 a 14 s) e do ruído do runner, não da geração: o passo «Gerar e
validar» foi de 1 a 2 s nas quatro execuções.

> **A segunda execução não foi pedida por mim.** Ela partiu da página (Bastidores → Produção),
> com o mesmo commit da primeira — é o fluxo dela, ao vivo, e passou com a ação nova. Fica
> registado porque uma prova pedida por quem construiu a bancada e uma prova pedida por quem usa a
> página não têm o mesmo peso.

---

## 7.9 O modal do Estilo — a medição antes do desenho (20/11/2026)

**A pergunta dela.** «o estilo precisa de um modal […] quando eu incluo ou removo algum exercício,
isso tem impacto direto no plano de ensino. E eu vou precisar de um modal para poder dizer se aquele
exercício que eu incluí, ele vai atender todos os elementos daquela aula, por exemplo, solo, barra,
centro, musicalidade.» E, antes disso: «A gente vai fazer esse estudo de viabilidade de custo.»

**Este capítulo é o estudo, e o primeiro resultado é que a pergunta tem duas metades com respostas
opostas.**

### a) O Dicionário: o que ele dispara hoje

| rota | dispara geração? |
|:--|:--|
| `POST`/`PUT /api/bastidores/termo` (o termo do Dicionário) | **sim** — `comAGeracaoDoTermo` |
| `POST`/`PUT /api/bastidores/verbete` (a música e os trechos) | **sim** — o mesmo caminho |
| `DELETE /api/bastidores/verbete` e `/termo` | **sim** — para tirar a citação dos documentos |

E o número: `gerarOsCiclosDasTurmas` dispara **uma geração por par (professor, ciclo, turma)**. Na
`breu` há **1** par hoje (`demi-plie/01/Rosa`), logo **1 minuto** por termo corrigido. Numa escola com
cinco turmas e um termo comum, **5**.

**E o que muda no documento, quando ela troca a categoria de «passo» para «conceito»: nada.** Medido
nos nove HTML do pacote da `breu-rosa`:

| campo do termo | ocorrências nos documentos gerados |
|:--|--:|
| `categoria` («passo», «conceito», «giro»…) | **0** |
| `complexidade` | **0** |
| `tradicao` | **0** |

O que os documentos chamam «categoria» é outra coisa: as categorias do **alfabeto** da notação
(`perna`, `pé`, `peso`, `braço`, `cabeça`), que vêm do `notacao.json` e não do vocabulário. Um termo
do vocabulário só chega ao documento **pelo verbete** — os trechos, a música, os sinais.

**Conclusão:** hoje, corrigir a categoria de um termo paga uma geração para não mudar um byte. A
regra certa não seria «nunca regerar» nem «regerar sempre», e sim **regerar quando o que mudou é o
que o documento lê**.

> **E ela decidiu deixar como está (20/11/2026).** Posta a escolha entre afinar a regra, adiar a
> geração, ou não mexer, a resposta foi **não mexer** — «nada». O que fica registado é o preço: uma
> geração por gravação de termo, mesmo quando o campo gravado não chega a documento nenhum. Não é
> erro de ninguém: é uma decisão tomada com o número à frente, e é reversível no dia em que a conta
> começar a pesar.

### b) O Estilo: o que a inclusão e a remoção fazem de facto

Medido no plano real da `breu` (`Rosa`, repertório `Battement tendu · Plié · Relevé`, 14 linhas na
sequência):

| o que se tira do repertório | linhas que ficam | tempos por bloco (Solo · Barra · Centro) |
|:--|--:|:--|
| — (hoje) | **14** | 36 · 32 · 28 |
| `Plié` | **10** | 32 · 24 · 24 |
| `Relevé` | **8** | 20 · 16 · 12 |
| `Battement tendu` | **10** | 20 · 24 · 20 |

**Remover tem impacto, e é automático:** as linhas que citam o exercício caem por
`linhasDoRepertorio`, os totais por bloco descem, e a linha do **Parâmetro de medição** daquele
objectivo perde o termo por `termosDoRepertorio`. Nada a decidir — o exercício desvincula-se, e o
documento segue a régua do repertório acordado sozinho.

> **E O «AUTOMÁTICO» NÃO ERA, até 20/11/2026 — o filtro era verdadeiro e o dado não chegava lá.**
> `linhasDoRepertorio` filtra o parâmetro contra o `repertorio` do **próprio plano**, e a derivação
> copiava esse `repertorio` do elo anterior: tirar o exercício da Turma não mudava o plano, o elo
> novo nascia igual, e o documento continuava a imprimir o exercício removido. Medido ao construir a
> poda (`podarForaDoRepertorio`, em `motor/nucleo/objetivos-do-repertorio.js`, chamada em
> `derivarPlano`): sem ela, o elo novo mantinha `['Battement tendu', 'Plié']` no `repertorio` e em
> `aula-1-parametro`, e o `-plano.md` ainda listava «Plié». Com ela, os dois perdem o termo, o elo
> ANTERIOR continua a declará-lo (a proveniência acrescenta), e o gesto diz o que saiu —
> `avisos: «saiu do plano o que já não está no conteúdo da Turma: Plié»`. **A poda é de identidade e
> não de gesto:** corre em toda a derivação, e uma Turma sem `repertorio` declarado não poda nada
> (comparar contra o vazio apagaria o plano inteiro).

> **CORRECÇÃO DE 20/11/2026, no mesmo dia, e ela é dela.** A primeira versão deste capítulo dizia que
> **incluir** não tinha impacto nenhum, e concluía que o modal só se justificava na remoção. Estava
> errado, e o erro foi de leitura: olhei para a sequência (`aula-1-sequencia`) e não para a matriz do
> **parâmetro de medição** (`aula-1-parametro`), que é `[{marco: N, marcados: [termos]}]` — «o
> objectivo N observa estes exercícios». É por ali que um exercício entra na aula, e é essa a
> declaração que hoje falta:
>
> «se eu vou lá no estilo e incluo pela derivação um novo exercício, eu tenho um impacto direto no
> parâmetro de medição. Aí eu preciso dizer […] em qual aspecto dos objetivos específicos […] o
> objetivo um, dois ou três, ele se encaixa. […] não faz sentido eu incluir um exercício e não dizer
> a qual objetivo ele serve. […] E aí isso impacta na construção do item 10, que é a sequência do
> exercício por bloco. […] o modal precisa existir quando inclui um exercício no estilo.»
>
> E a outra metade da frase dela fecha o desenho pelo lado oposto: **«quando eu removo, não tem
> impacto. […] o modal não precisaria existir para remover, porque aí ele se desvincula dos
> objetivos.»**

> **SEGUNDA CORRECÇÃO, no mesmo dia, e é a que fixa o LUGAR — ela testou e disse.** O modal **não é
> do Estilo e não pode ser**: «quando eu acrescento um exercício com verbete novo no estilo, ele
> nasce como livre. Ele não é uma derivação do estilo. […] Em que momento então é formado o elemento
> do exercício que vai para o caderno? É na turma, a antiga curadoria. Então quando eu vou derivar a
> turma é que vai nascer esse modal. […] eu escolho o conteúdo do estilo no formulário, nesse caso o
> novo que eu criei foi o Batman GT, e aí eu quando mando adicionar o Batman GT é que o modal tem
> que aparecer.»
>
> **E o gatilho tem uma condição, que é o que torna o custo defensável:** o modal só abre **se a
> Turma já tiver plano de ensino**. Sem plano, a Turma está «num interregno […] em suspensão», e não
> há processo a disparar — «porque aí é só custo». O plano, quando nascer, puxa o envelope da Turma e
> leva o conteúdo com ele.
>
> **Investigado no código a 20/11/2026, e ela está certa nos cinco pontos.** A regra que descreveu já
> é a que corre, e corre em três sítios: `turmasQueUsamOTermo` devolve vazio para um exercício que
> nenhuma Turma usa (e a resposta diz «associe-o a uma Turma e a geração parte desse ato»);
> `gerarOsCiclosDasTurmas` salta as Turmas sem plano em `paresComPlano` e devolve
> `motivo: 'sem-plano'` com a frase «ainda não têm plano de ensino — […] a geração parte do
> «Guardar» do plano»; e a rota de **edição** da Turma recusa (`409`) quando ela é vinculada —
> «já tem plano de ensino — ela não se edita: derive uma versão nova». **Ou seja: o gesto que muda o
> conteúdo de uma Turma com plano é sempre a derivação, e a derivação é a única que dispara a
> cadeia.** Não há buraco nenhum aqui, e a hipótese de o haver fica retirada.

### b.1) A cadeia, do exercício ao item 10

```
incluir um exercício no Estilo        ← LIVRE: nenhum processo dispara, e está certo
        ↓
a TURMA escolhe o conteúdo            ← é aqui que o modal abre (e só aqui)
        ↓   condição: a Turma já tem plano de ensino; sem plano, fica em suspensão e nada corre
a que OBJECTIVO ele serve?           → a resposta viaja na derivação, que é o gesto que já ia correr
        ↓
a derivação grava o elo novo          → curadoria/repertorio + a declaração do objectivo
        ↓
a cadeia deriva o PLANO               → o plano é anterior à mudança: `pendente` → elo novo
        ↓
o objectivo observa este exercício  → aula-1-parametro · marcados[] · «1 reconhecer… — observa: …»
        ↓
ele passa a poder ser escolhido     → item 10 · aula-1-sequencia (Bloco · Objetivo · Conteúdo)
        ↓
os tempos da linha somam por bloco  → a estimativa de Solo · Barra · Centro · Musicalidade
```

**O que o sistema NÃO pode decidir sozinho, e por isso o modal pergunta:** a que objectivo o exercício
serve. **O que ele pode mostrar:** o que a resposta implica — quantas linhas do item 10 passam a poder
citá-lo, e quanto isso muda a soma por bloco face aos minutos declarados.

**E a remoção fica sem janela** — mas não sem rasto: o `409` que hoje existe para o plano continua a
avisar que a linha caiu, e o aviso é uma frase, não uma pergunta.

### c) O que o modal da INCLUSÃO pergunta — e o que custa construí-lo

> **CONSTRUÍDO A 20/11/2026.** A tabela abaixo deixou de ser um plano. E numa coisa o plano estava
> errado: **não é um `409` com o pedido reenviado**, é uma pergunta **antes** do pedido. A janela da
> duração interrompe uma gravação já feita (o `409` chega depois de o servidor recusar); esta não
> interrompe nada, porque a ficha ainda não nasceu — ela pergunta primeiro, e só depois o «Gravar»
> da Turma leva a declaração no corpo. A diferença de forma vem da diferença de momento, e a segunda
> é mais barata: não há pedido para refazer.

| peça | onde | estado |
|:--|:--|:--|
| `objectivosDoPlano(plano)` — os marcos daquela turma, em texto | `motor/nucleo/derivar-plano-ciclo.js` (`marcosEmTexto` já existe) | **pronta** |
| `impactoDaInclusao({ plano, termo, objetivos, repertorio })` — o que muda no parâmetro e no item 10 | `motor/nucleo/objetivos-do-repertorio.js` | **pronta (20/11/2026)** — devolve a linha que ganha o termo (antes/depois), os blocos daquele objetivo, os marcos todos **sem pré-selecção**, as linhas do item 10 que já citam o exercício (`0` para um exercício novo, e dizê-lo evita a leitura de que o sistema fará a linha), e **quanto muda a soma dos tempos por bloco** (`soma`, por `efeitoNaSoma`) |
| a rota que enche a janela | `POST /api/bastidores/impacto-da-inclusao` | **pronta (20/11/2026, corrigida no mesmo dia)** — responde `precisaDecisao: 'objetivo'` só quando há o que perguntar; `sem-plano` (`motivo: 'sem-plano'`), `indice-ilegivel`, `plano-ilegivel`, `ja-na-aula`, `fora-do-repertorio` e `sem-objectivos` devolvem a ficha a entrar como sempre entrou, cada um com o seu motivo — **e o motivo vai à tela**. O plano é procurado **pelo professor da SALA** (a autoridade desde 19/11/2026) e só depois pelo da cópia da Turma: o atalho `curadoriaVinculadaA`, que casava a cópia com o plano, dava «sem plano» sobre uma Turma que o tinha — e foi esse o defeito que fez a janela não abrir |
| a gravação da declaração | **a Turma** — `objetivosDoRepertorio`, ao lado do `repertorio` | **pronta (20/11/2026)** — `declaracoesDaTurma` soma o que a janela respondeu, mantém o que já estava (P-03/P-04) e esquece o exercício que saiu do repertório |
| a janela | `bastidores.js` — `perguntarOObjetivo` | **pronta (20/11/2026)**, e **não** generalizada: são duas janelas, cada uma com a sua pergunta. A generalização que aqui se anunciava ficou por fazer, e é a dívida a pagar se aparecer a terceira |
| o gancho do cliente | `esc-conteudos` · o clique no «Adicionar» (e não no «Gravar») | **pronta (20/11/2026)** — é onde ela disse que a janela tem de abrir: «quando mando adicionar o Batman GT». O `adicionarFicha` fica intocado: quem pergunta é o gancho, e a ficha só nasce depois da resposta |

**A pergunta que a janela faz** é uma só, e é de escolha múltipla: *«A que objectivo(s) este exercício
serve?»* — com os marcos da turma, e sem pré-selecção. A partir dela o sistema sabe o que mostrar: a
linha do parâmetro que ganha o termo, e os blocos cujo total muda.

> **E uma TERCEIRA, e é a que explica as duas anteriores.** Medida ao vivo, com a senha da direção:
> a rota respondia `motivo: 'fora-do-repertorio'` — *«este exercício não está no conteúdo desta
> Turma»* — para o exercício que ela estava a acrescentar. Certo pelo código, absurdo pelo gesto: é
> precisamente ele que está a entrar. A distinção que faltava é entre **o termo a entrar** (o gesto,
> onde a lista gravada não manda) e **um termo que já é conteúdo** (a derivação, onde manda e é a
> guarda). `oTermoEntra` separa os dois. E as provas não viam porque todas as asserções usavam uma
> Turma que **já incluía** o termo — testavam uma situação que o gesto não produz.

> **E UMA SEGUNDA CORRECÇÃO, no mesmo dia e no mesmo sítio.** Publicada a primeira, ela testou ao
> vivo e leu «não era possível ler agora o plano de ensino». A causa era outra, e pior: a ponte monta
> a cadeia automática **só para as rotas de uma lista**, e a janela não estava nela — a cadeia era
> `null`, e não havia quem lesse o plano. **Uma leitura não pode depender da montagem de uma
> escrita**: `planoDaTurmaNaSala` passou a ler o acervo directo, e a janela saiu da lista. A lista em
> si mudou de casa — é uma constante de `bastidores.js` (`ROTAS_QUE_PRECISAM_DA_CADEIA`), e a ponte
> lê daqui —, porque em dois sítios ela divergiu duas vezes (`turma-professor` em 19/11,
> `impacto-da-inclusao` em 20/11). A prova `provar-as-rotas-da-cadeia.js` compara a lista com o uso
> no código e **não injeta a cadeia**: é a única que pode ver esta classe de defeito.

> **A CORRECÇÃO DE 20/11/2026, e o defeito foi meu.** Publicada a janela, ela testou ao vivo: removeu um
> exercício, derivou, e **ao incluir de novo não apareceu janela nenhuma** — o exercício entrou sem
> objectivo. O `provar-salas-e-elencos` passava porque montava o formulário à mão (`cuderivar` e
> `cumodo` escritos por `eval`), e assim nunca passou pela guarda do cliente. A guarda era
> `VINCULADAS[alvo]`, e esse mapa casa o professor **da cópia da Turma** com o do plano — uma
> autoridade que caiu a 19/11/2026, quando a Sala passou a ser quem dirige. Do lado do servidor, o
> mesmo atalho (`curadoriaVinculadaA`) dizia `sem-plano` sobre uma Turma com plano — e o cliente
> **descartava o motivo**, portanto a ficha entrava sem pergunta e sem uma palavra.
>
> **A regra que ficou: um filtro de cliente não é uma regra.** O cliente pergunta sempre que há uma
> Turma em curso, e quem decide é o servidor; o plano é procurado pelo professor da Sala; e quando
> não há nada a perguntar, **o motivo é dito**. Medido em bancada: a rota dava `sem-plano` nos dois
> casos (cópia certa e cópia vazia) e passa a dar `precisaDecisao: 'objetivo'`; na página, o caso
> «o mapa diz `false`, o servidor diz que há» — que antes falhava em duas asserções — passa a abrir
> a janela.

**O que a janela NÃO pergunta:** em que bloco ele entra. O bloco é do item 10, e o item 10 é do
professor, linha a linha — o sistema não escolhe pedagogia.

**A conta da soma por bloco existe, e a janela já não a mostra (20/11/2026).** Os tempos vêm das
linhas do item 10, e uma linha cujo exercício não está na lista acordada do plano é **filtrada** da
leitura (`linhasDoRepertorio`); quando o exercício entra, as linhas que já existiam com o seu nome
**voltam**, e é aí que os totais sobem. `impactoDaInclusao` calcula isso (`somaPorBloco`,
`efeitoNaSoma`), e continua a calcular: a conta está feita e provada. O que **saiu foi a frase na
janela** — «A soma dos tempos por bloco não muda e segue dizendo outras coisas. Tira, arranca fora.»
A razão dela é boa e é de desenho: o número não muda a decisão (a pergunta é a que objetivo o
exercício serve), e duas linhas de aritmética ao lado de três caixas de marcar fazem a janela parecer
um relatório. Pela mesma razão saiu o resumo «O parâmetro de medição passa a observar «X» no(s)
objetivo(s) N» — «é redundante, já são os objetivos que estão marcados aqui». **Uma janela que decide
não mostra o que não decide.**

**Duas decisões de desenho, e a primeira está decidida:**
1. **Onde a declaração é escrita — na TURMA, e não no plano.** A frase dela, na correcção de
   20/11/2026, fecha as duas hipóteses que aqui estavam abertas: «*quando eu incluir um outro
   exercício lá no estilo […] ele tem que ir para o mesmo lugar, para o termo de objetivos na
   curadoria. […] Na medida em que eu acrescento um objetivo, ele aumenta; na medida em que eu tiro um
   exercício, ele diminui.* […] *A gente não vai fazer nunca nenhum desvio para colocar direto, porque
   a gente estaria quebrando o nosso próprio sistema.*» Escrever `aula-1-parametro` a partir da
   derivação do Estilo seria exactamente esse desvio. **Fica recusado.** E a segunda correcção
   acrescenta o *lugar*: o modal é **da Turma**, porque é lá que os três factos se sabem ao mesmo
   tempo — a Turma tem plano, o exercício é novo nela, e é dela que o plano deriva.
   **O que continua em aberto é a *forma* do campo na Turma**, e é desenho, não princípio.
2. **O que acontece quando não há plano — nada, e está decidido.** Sem plano de ensino não há
   objectivos a que ligar o exercício, e por isso **não há janela e não há processo**: a Turma está em
   suspensão, e o plano, quando nascer, puxa o envelope dela e leva o conteúdo. Isto já é o que o
   código faz (`gerarOsCiclosDasTurmas` → `motivo: 'sem-plano'`), e é a razão de o custo ser
   defensável: «é só custo» deixou de ser o preço da regra.

**Custo de construção, medido:** um módulo de núcleo (`objetivos-do-repertorio.js`, 4 funções), uma
rota, uma janela e um gancho. **Custo de manutenção:** duas janelas a manter em paralelo, e **a
generalização ficou por fazer** — o que se disse que não se devia adiar foi adiado, e fica dito aqui
para não se descobrir por acidente: quem escrever a terceira janela paga as três.

**As provas.** `experimentos/provar-o-exercicio-novo.js` (55 asserções) mede o núcleo — que aplica uma
vez e só uma, que não aplica o que a Turma não acordou, e que escreve o termo no parâmetro **e** no
repertório do plano (sem o segundo, o documento apagava-o na leitura). A secção B3 de
`provar-cadeia-automatica.js` mede o caminho inteiro até ao elo novo do plano, e a secção N de
`provar-salas-e-elencos.js` mede a página: a janela abre ao acrescentar e não ao gravar, nenhum
objetivo vem pré-marcado, o «Cancelar» e o `Escape` não escrevem nada, e a ficha só nasce depois da
resposta, o «Cancelar» faz o mesmo gesto do «Cancelar» do formulário (limpa e colapsa) e a caixa é a
larga. **A/B feito nos três**: sem o gancho, 5 asserções falham; sem a aplicação na cadeia, 3.

**E o quarto defeito, que só apareceu no gesto inteiro (20/11/2026).** A declaração escolhida na
janela ficava na Turma e **não chegava ao plano**: o log da cadeia mostra seis travessias com
`plano-de-ensino · feita`, todas sobre o mesmo plano. A escada decidia pela **data** — a vigência da
Turma é `2026-11-20` e o plano é de `2026-11-20T14:11`, e a string do carimbo ganha. A guarda nova
compara o **conteúdo** (ver `REGISTRO.md`, 20/11/2026), e é o único caminho por onde a resposta da
janela chega ao papel. Fica a lição de método: as provas do núcleo passavam porque **injetavam** o
`conteudo` no `indice`; o que faltava era a travessia entregá-lo — e agora há asserção para as duas
metades (secções J e K de `provar-cadeia-automatica.js`).

### d) O que se economiza, e o que se **paga**

O gesto de hoje, quando se inclui um exercício, são **dois**: associá-lo à Turma, e depois ir ao
plano de ensino marcar a coluna do objectivo a que ele serve — sem o que o exercício entra no
repertório e não entra em aula nenhuma. Com a janela é **um**, e a declaração viaja no corpo do
«Gravar» que já ia acontecer. Cada gesto poupado é uma geração: **1 a 2 minutos**, e sobretudo um
segundo percurso que ninguém fazia — um exercício incluído e nunca declarado ficava no menu, com o
sistema a parecer que o ignorou.

**E a janela abre num sítio só:** ao **acrescentar a ficha** no conteúdo da Turma, e não ao gravar —
é a diferença entre perguntar enquanto se decide e perguntar depois de já estar decidido. Na edição
não há janela porque não há edição: a Turma com plano recusa-se a editar (`409`).

### e) O que dá para automatizar

| passo | automatizável? | porquê |
|:--|:--|:--|
| derrubar as linhas e o termo do exercício removido | **já é** | `linhasDoRepertorio` e `termosDoRepertorio`, na derivação |
| escrever o termo no parâmetro do objectivo escolhido | **sim, depois da resposta** | é o que a janela faz: a resposta é dela, a escrita é aritmética |
| contar as linhas do item 10 que passam a citar o exercício | **sim** | é a mesma filtragem do núcleo |
| somar os tempos por bloco | **sim** | é aritmética, e a janela mostra |
| **escolher o objectivo** | **não** | é a declaração pedagógica — e é a razão de a janela existir |
| escolher o bloco do exercício novo | **não** | o bloco é do item 10, e o item 10 é escrito linha a linha |
| redistribuir os **minutos** por bloco | **não** | a soma tem de fechar com a duração, e quem decide é ela |
| redistribuir em **percentual** | **sim** | 30 % de 90 são 27, de 165 são 49,5: a conta resolve-se, e não há modal |

**A conclusão do estudo, em uma linha:** o modal existe para a **inclusão** — porque incluir sem dizer
a que objectivo o exercício serve é incluir um exercício que nunca entra em aula —, e vive **na Turma**
e não no Estilo, porque só ali se sabe ao mesmo tempo que a Turma tem plano, que o exercício é novo
nela, e que é dela que o plano deriva. A remoção continua sem janela: desvincula-se sozinha. E o que
hoje custa minutos sem mudar um byte é outra coisa, e é do Dicionário.

---

## 7.9f O que fica na Turma, e o botão que o leva ao ciclo (20/11/2026)

**A frase dela.** «Há derivações que são feitas, elas têm efeito diretamente na turma, mas elas param
ali. […] a gente vai colocar um aviso […] que diz que esses ajustes estão registados na turma, mas
serão vinculados ao ciclo […] E se ele quiser que seja gerado agora, a gente vai colocar um botão na
turma que dispara então a regeneração. […] Eu acho que isso vai ser executado poucas vezes, então
não vai impactar muito no nosso custo.»

**Quais são esses ajustes, e porque param.** A **régua** da sala viaja no envelope do plano como
fotografia — é o que ela confirmou («sim, continua assim»): o passado não se reescreve, e mudar os
níveis não marca o plano pendente. O **vocabulário** e o **verbete** chegam ao documento pela
geração, mas não criam plano novo. Nos três casos, o que está na Turma não está no papel.

**O botão, e porque é que ele FORÇA a derivação.** Se ele corresse só a etapa 4 (gerar), geraria
sobre o mesmo plano e **não mudaria um byte** — o encargo não está no plano antigo. O `forcar`
(`motor/nucleo/cadeia.js`) marca o plano como `pendente` mesmo em dia, com a falta escrita («o
professor pediu para levar a Turma ao ciclo agora»), e daí em diante a cadeia segue sozinha: plano →
PO → documentos. O gatilho novo (`atualizacao-pedida`) fica no log, para que um elo nascido de um
clique não se confunda com um elo nascido de um facto.

**O nome.** «Regeneração» descreve o mecanismo; **«Atualizar o ciclo»** descreve o que a pessoa leva.
É, além disso, vocabulário que o sistema já tem («Gerar o ciclo» é o fluxo, «os documentos gerados» é
a etapa 4).

**O custo, e é o que a torna aceitável.** O botão abre a travessia toda: um plano, um PO e uma
geração. A §7.10 mede o gesto em 2 a 3 minutos. Ele existe para ser usado **poucas vezes** — o caso
normal é a próxima derivação levar o que ficou — e é a autonomia que ela pediu em troca desse custo.

**O botão passou a validar antes de existir (20/11/2026), e o custo caiu para quase nada.** Até aqui
ele abria a travessia inteira a quem carregasse, mesmo quando os documentos já diziam o mesmo — um
botão que gasta 2 a 3 minutos «para não mudar um byte». Agora compara três coisas antes de se abrir:
a **régua** (a da Sala, em KV, contra a `rubrica` do plano), o **conteúdo** (o `repertorio` da Turma
contra o do plano) e a **habilidade do professor** (a tradição do **perfil** contra a
`contexto-metodologia` do plano). O que se lê: o plano vigente (uma leitura) e o perfil (uma por
professor). O que não se lê: nada de novo em KV — a régua e o conteúdo já estão lá.

O **dicionário** também entrou, e por uma porta que não existia. A frase anterior deste documento
dizia que ele ficava de fora «porque o corpo de um verbete não viaja no plano, portanto não há contra
o que comparar» — e era verdade enquanto se procurava o corpo. O que se compara é a **impressão** do
dicionário: um `sha256` do alfabeto (a notação) e do vocabulário (os verbetes) da modalidade,
calculado no Worker e guardado no selo do ciclo. Ela viu o defeito e disse-o com precisão: «Eu
alterei o dicionário do plié […] e o dicionário não aparece de jeito nenhum aqui». Com a impressão,
qualquer mudança — o nome do exercício, a categoria, a tradição de referência, a classificação, a
definição — acende o botão, porque todas elas mudam o ficheiro.

### A tabela que faltava: cada gesto, e por onde ele passa

Ela pediu-a com estas palavras: «verifica para mim se o que temos aqui […] está no botão», e «me
mostra isso em uma tabela». A coluna do meio é o que o **código faz hoje**, lido nas rotas e não
inferido; a última é o que ela decidiu.

| onde se mexe | o que acontece hoje | decidido |
|:--|:--|:--|
| **Régua / rubrica** do professor | fica registado; o contador do «Atualizar o ciclo» mostra-o | **botão** |
| **Habilitações** — modalidades e tradições | idem | **botão** |
| **Dicionário** — nome, categoria, tradição de referência, classificação, definição | idem (o sha do alfabeto e do vocabulário diverge) | **botão** |
| **Estilo / verbete derivado** — método, música, decomposição | idem | **botão** |
| **Cadastro do professor** — nome, CPF, telefone, e-mail, senha | nada | **nada** |
| **Habilidade** no step do cadastro | o campo é **somente leitura** desde 20/11/2026; muda-se na aba Habilitações | **nada** (é a mesma coisa que a linha 2) |
| **Alunas** — criar, editar | nada | **nada** («já nasce com a nova anamnese») |
| **Desligamento** | nada | **nada** |
| **Salas** — nome, dias, início e fim do período, e o **associar** | `POST /turma-editar`, `/turma-derivar` e `/turma-professor` correm `rodarCadeia` | **dispara já** — «é uma mudança delicada, tem que disparar» |
| **Audição** — nome do elenco, inclusão e exclusão de alunas, recortes | `POST /linha-de-base` e `/elenco-mover` correm `rodarCadeia` e `gerarOsCiclosDoElenco` | **dispara já** — «mexeu em qualquer coisa aqui, gera» |
| **A Turma em si** — `curadoria-derivar` | corre `rodarCadeia` | **dispara já** (é o gesto que cria o elo) |

**As duas maneiras de chegar ao ciclo, e porque não podem ser três.** Ou o gesto **corre a cadeia**
(`rodarCadeia`: plano → PO → documentos, no mesmo pedido), ou o gesto **só toca em KV** e o que ele
mudou fica à espera do botão. A diferença não é de gosto: um gesto que não tem plano para derivar não
tem nada que derivar. Por isso as Salas e a Audição — que mexem no que o plano **declara** — correm a
cadeia, e a régua, as habilitações, o dicionário e o estilo — que mudam o que os documentos **leem**,
sem tocar no plano — ficam à espera e são comparados.

**E uma garantia, porque ela perguntou por ela:** «tem certeza que os outros não estão mandando gerar
o ciclo por fora da turma?» A resposta, verificada nas rotas: **nada fora destas seis corre a
cadeia**. O dicionário tinha uma porta dessas até 20/11 (`gerarOsCiclosDoTermo`, chamada pelas cinco
rotas do termo) e essa porta está fechada — as rotas passaram a chamar `comAGeracaoDoTermo`, que
regista em vez de disparar. A função continua exportada e a prova `provar-o-estilo-regera.js` mede-a
como travessia, mas **nenhuma rota a chama**: é código de reserva, e é bom que se saiba que é isso.

**A frase vai no GESTO, e não no cartão (20/11/2026).** Ela viu a nota fixa na listagem das Turmas e
mandou-a embora: «Tira esse texto, não tem que existir esse texto. […] essa mensagem […] tem que
existir quando ajustes são feitos nesses lugares, tá? Aí sim é que aparece lá no canto superior
direito.» A regra é a mesma que governa todos os gestos desta página — `.res` é para o que se está a
compor, o canto é para o gesto concluído —, e a consequência prática é que a frase aparece **nos
gestos que ficam na Turma**, e não no cartão: a régua do professor (`avisarDoAjusteQueParaNaTurma`) e
o verbete e o termo (`avisarDaGeracao`). Há três coisas nela que não são decoração: diz que o ajuste
**está** registado, diz que ele **ainda não** chegou ao papel, e nomeia o botão que resolve. Sem a
segunda é uma promessa que o prazo de oito segundos não pode cumprir; sem a terceira é um problema
sem saída.

**A habilitação do professor entrou no grupo, e não dispara sozinha.** Era o único dos quatro itens
fora de todos os grupos: `POST /api/bastidores/perfil` grava o perfil, marca as Turmas que ficaram sem
quem as ensine, e não avisa mais ninguém. É de propósito que continua a não disparar — «ele tem que
ficar lá naquele grupo que é do botão atualizar ciclo lá nas turmas» —, e o custo é o de uma
comparação, não o de uma geração.

**E a derivação passou a entregar o que o botão promete.** A régua e a tradição viajam no envelope do
plano como fotografia, e `derivarPlano` copiava as respostas relendo só o ritmo: o elo novo nascia com
as duas velhas. O botão acendia, derivava, e o documento saía igual. Agora as duas são relidas do
cadastro, e o elo anterior fica intacto.

---

## 7.10 As execuções de um gesto, contadas uma a uma (20/11/2026)

A §7.1 dizia «8 a 10 execuções por gesto». **Está contado: são dez.** E a contagem devolve uma lei
mais útil do que a estimativa:

> **Uma execução = um push que casa o `paths:` de um workflow.** Não é a duração, não é o
> `concurrency`, e não é a quantidade de trabalho: é o **número de commits**.

### a) O gesto, medido

Um acto completo — concluir o elenco, gravar o plano, gravar o PO —, em **30 segundos**
(17:11:22–17:11:52 de 20/11/2026), lido em `actions/runs` e nos `jobs` de cada execução. A duração
que conta é a do **job**, e não a da execução: é o job que o GitHub arredonda ao minuto (a da
execução inclui a fila e engana — uma execução de 78 s tinha um job de 45 s).

| # | commit | o que mudou | execução | job |
|:--|:--|:--|:--|:--|
| 1 | `92bd63ce` | `escola/breu/linhas-de-base/tami--20261120-1711.json` — o dado | `Fechar os derivados` | 2 s, **cancelada** |
| 2 | `c33bff72` | `…/linhas-de-base/.indice.json` — **o índice** | `Fechar os derivados` | 9 s, **cancelada** |
| 3 | `0a79fee8` | `…/envelopes/.indice.json` — **o índice** | `Fechar os derivados` | 2 s, **cancelada** |
| 4 | `4b9d4056` | `…/envelopes/plano-20261120-1411.json` — o dado | `Fechar os derivados` | 10 s, **cancelada** |
| 5 | `e93ec298` | `…/envelopes/.indice.json` — **o índice, outra vez** | `Fechar os derivados` | 3 s, **cancelada** |
| 6 | `ff4034ce` | `…/envelopes/po-20261120-1411.json` — o dado | `Fechar os derivados` | 5 s, **cancelada** |
| 7 | `07d90b79` | `…ciclo-01-breu-rosa-po.md` — a fonte | `Fechar os derivados` | 15 s, **cancelada** |
| 8 | `bd689edf` | as fontes do ciclo, num lote — o derivado que fecha | `Fechar os derivados` | 21 s, sucesso |
| — | — | a geração pedida pela conclusão do elenco | `Gerar o ciclo` | **86 s → 2 min** |
| — | — | a geração pedida pelo lote | `Gerar o ciclo` | 41 s → 1 min |

**Dez execuções para um acto. Sete não fizeram trabalho nenhum** — foram canceladas entre 2 e 15
segundos. E **três dos oito pushes são escrita de índice**, um deles o mesmo ficheiro **duas vezes**
(`envelopes/.indice.json`, nos commits 3 e 5, a 30 segundos de distância): em `gravarEnvelope` o
índice é gravado **antes** do envelope, em dois `PUT` e portanto em dois commits
(`motor/nucleo/porta.js`, `registrarNoIndice` → `gravarEnvelope`).

### b) Os dois commits que não custaram nada

Na mesma janela, `b642dbfc` («o elo da cadeia automática») e `92733726` («o PO elicitado vira a
fonte do ciclo») têm **árvore idêntica à do pai** — zero ficheiros. São uma segunda escrita do mesmo
conteúdo, e ficaram no `main`.

**E não lançaram execução nenhuma** — nenhum dos dois aparece nas 13 execuções da janela, porque
nenhum casa um `paths:`. A nota fica pelo desenho, não pela factura: a escrita repetida não custa CI,
custa história.

### c) A conta, e as duas leituras que ela tem

| leitura | execuções | minutos do gesto |
|:--|:--|:--|
| **a cancelada factura** | 10 | 7×1 + 2 + 1 = **11 min** |
| **a cancelada não factura** | 10 | 0 + 2 + 1 = **3 min** |

A diferença é de factor **3,7** — e não se resolve daqui. O `timing` do GitHub devolve
`billable_ms: 0` em **todas** as execuções deste repositório, porque ele é **público**; e o token da
sessão é *fine-grained*, sem `manage_billing:read`, pelo que nem a facturação da conta se lê
(`/users/tmenegaz/settings/billing/actions` → 410, `/settings/billing/usage` → 404). O teste
decisivo é **este mesmo gesto depois de o repositório voltar a privado**, lido na página de
facturação — e é dela.

### d) O chão: de dez para três

Um acto tem exactamente três coisas para dizer ao mundo: **o dado**, **a geração** e **a
publicação**. O chão é portanto **três execuções**. Hoje são dez, e a diferença não é trabalho a
mais — é **commit a mais**.

### e) As três alavancas, por ordem de ganho neste gesto

| alavanca | o que faz | execuções | ganho |
|:--|:--|:--|:--|
| **§7.3 — o envelope e o índice no mesmo commit** | os commits 2, 3 e 5 desaparecem dentro dos 1, 4 e 6 | 10 → **7** | −3 min se a cancelada factura; −0 se não. **E ganha correcção**: hoje o `derivados` pode ver o índice novo com o envelope velho |
| **§7.1 — uma geração por acto** | as duas `Gerar o ciclo` viram uma | 7 → **6** | −2 min (a segunda levou 86 s), e um pacote intermédio que ninguém lê |
| **A margem dos 60 s** | já ganha no `gerar` (34–45 s após o pandoc estático) e no `publicar` (30–48 s) | — | evita o degrau de 1 → 2 min |

**A regra dela — «uma execução, um minuto» — está ganha na unidade.** Os três jobs medidos cabem
todos em 60 s. O que falta é o **número**, e o número é o dos commits.

**E o que não se deve prometer:** a mesma `Gerar o ciclo` correu **41 s e 86 s no mesmo minuto**, no
mesmo código — a variância do runner é maior do que qualquer optimização que falte. 34–45 s é margem,
não garantia.

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

---
## 10. Lucro, custo e margem — quantas escolas se sustentam *(25/11/2026, corrigida no mesmo dia)*

> «Eu preciso saber isso para saber qual é o excedente e aí eu consigo basear os meus custos porque
> daí eu só calculo esse excedente e subtraio do valor da receita.» — a proprietária, 25/11/2026
>
> «Cada plano roda uma quantidade de aulas. A quantidade de aulas que a pessoa contrata é o limite.
> […] Você disse que não tem limite. Tem limite. […] Acho que você está confundindo versão antiga do
> plano com a nova.» — a mesma, 25/11/2026, e **estava certa**: ver a §10.11.

**A pergunta:** com uma escola **em cada plano**, cada uma isolada, funcionando **16 horas por dia com
uma aula por hora**, **partilhando o mesmo workflow**, em repositório privado — há lucro ou prejuízo? E
quantas escolas se sustentam?

**A resposta, e são duas frases.** Há lucro em **todos** os planos e em **qualquer** número de escolas:
**não existe um ponto a partir do qual o prejuízo começa**, porque o custo marginal de uma escola é
sempre uma fracção da receita dela. A margem **desce** à medida que se sobe de plano — de **90,7 %** no
Básico a **62,9 %** no Avançado —, mas **nunca chega a zero**: para isso o runner teria de ficar
**2,7× mais lento**, e no Avançado, que é o caso mais apertado.

### 10.1 A unidade: 2,0 minutos por aula, e o ciclo é que a segura

Medido a 25/11/2026 sobre 1 000 execuções da API:

| workflow | runs | mediana | factura |
|:--|--:|--:|--:|
| **`Gerar o ciclo`** (desde 21/11, pós-TeX) | 16 | **40 s** | **1,00 min** |
| **`Fechar os derivados`** | 395 | 11 s | **1,00 min** |
| **uma aula** | | | **2,00 min** |

O `Gerar o ciclo` vinha de **1,55 min** (73 runs desde 20/11) e caiu a **1,12** quando o TeX saiu do
caminho — o §7.8 previu-o. **O 1,12 é a média de ciclos de uma aula**; num ciclo de 24 aulas o job fica
em **47 s**, que arredonda ao mesmo minuto. Por isso a unidade de trabalho é **1,00**, e não 1,12.

> **E a lição do §3 continua a mandar:** não é a média que factura, é o arredondamento. A 40 s o job
> está a **20 s da fronteira**; a 61 s custa o dobro. Toda esta conta vive nessa distância.

**O ciclo tem 24 aulas** — medido no único plano de ciclo que existe neste repositório
(`ciclo-01-breu-piano-plano.md`, «Número total de aulas: 24», de um calendário real de 3×/semana × 8
semanas). E é o ciclo que limita o laço da geração: ver a §10.3.

### 10.2 «Partilhando o mesmo workflow» — o que isso faz, e o que não faz

A intuição é razoável e a resposta é incómoda: **a partilha não poupa minuto nenhum.**

O mecanismo que existe é o `concurrency` com `cancel-in-progress` (§7.6): quando dois gestos caem quase
ao mesmo tempo, o segundo **cancela** o primeiro. Ele **lança e cancela** — não funde, não adia, não
junta trabalho. E a factura arredonda **ao minuto por job**, pelo que um job cancelado aos 4 s custa o
mesmo que um que correu 60 (correcção de 20/11/2026, e é medida: **246 das 395** execuções de `Fechar
os derivados` foram canceladas).

**Mas a 16 aulas por dia o problema não se põe:** uma execução demora 11 a 49 segundos e as aulas são
de hora a hora — não há sobreposição, e o `concurrency` **nunca dispara**. A partilha do workflow é
real (o mesmo ficheiro, o mesmo runner, a mesma cota), mas **não reduz a contagem de execuções**: 16
aulas são 16 `Fechar os derivados` e 16 `Gerar o ciclo`.

**O que pouparia é o §7.1** (agrupar as gerações dos lançamentos), e não existe.

### 10.3 O laço percorre o ciclo — e o ciclo é que o trava *(corrigido)*

O `tools/gerar-ciclo.sh` percorre **todas as aulas do ciclo a cada geração**: um `validar-aula-ciclo.js`
por aula (linha ~344) e **duas páginas `pandoc` por aula** (linha ~1227). Não há incrementalidade no
*render*; o que é incremental é a **escrita** das fontes (`escrever-ciclo.js` salta as que não mudaram).

Medido nesta máquina, por micro-bancada: **59 ms** por página de `pandoc` (20 chamadas em 1,187 s) e
**32 ms** por validação (50 em 1,629 s) — **150 ms por aula**. E acrescenta-se à base de 40 s, que é
onde o job já está.

**A pergunta que decide tudo é qual é o N — e a primeira versão desta secção respondeu mal.** Ela
supôs que a geração de uma escola a 16 aulas/dia percorria as 352 aulas do mês, e daí tirou uma soma
quadrática de 1 076 min. **Não é isso:** o laço percorre as aulas **do ciclo**, e o ciclo tem **24**. O
que uma escola a 352 aulas/mês tem são **~15 ciclos de 24**, e cada geração paga o seu próprio ciclo,
não o mês.

| aulas no ciclo | 24×0,30 s | total | min facturados |
|--:|--:|--:|--:|
| **24** (o ciclo real) | 7,2 s | 47,2 s | **1** |
| 50 | 15,0 s | 55,0 s | **1** |
| 66 | 19,8 s | 59,8 s | **1** |
| **67** | 20,1 s | **60,1 s** | **2** ← **a fronteira** |
| 200 | 60,0 s | 100,0 s | 2 |
| 352 (o que eu supus) | 105,6 s | 145,6 s | 3 |
| 467 | 140,1 s | 180,1 s | 4 |

**A fronteira está às 67 aulas num só ciclo.** Abaixo disso o laço não custa um minuto a mais — e o
maior ciclo que este repositório sabe declarar tem **24**. **A unidade de 2,0 min por aula não depende
do tamanho do mês: depende de o ciclo ficar abaixo das 67 aulas.**

> **O que fica por medir, e é honesto dizê-lo:** nenhum ciclo deste repositório passou de **uma** aula
> gerada, pelo que a curva acima é **calculada** a partir de duas micro-bancadas, não observada num
> job. O ensaio que a fecha é gerar um ciclo com 50 aulas e ler a duração. Enquanto não for feito, o
> número que sustenta esta secção é o que se **observou**: 40 s de base medidos em 16 execuções, e o
> resto abaixo da fronteira.

### 10.4 A franquia de cada plano — e o que acontece acima dela

Cada plano entrega uma **quantidade de aulas contratada**, e é esse o limite. Está no catálogo, em
`biblioteca/comercial/planos.json → assinaturas[].aulas`:

| plano | aulas/mês | preço | R$/aula | acima da franquia |
|:--|--:|--:|--:|:--|
| **Básico** | **100** | R$ 69,90 | R$ 0,699 | excedente a **R$ 0,50/aula** |
| **Intermediário** | **300** | R$ 99,90 | R$ 0,333 | excedente a **R$ 0,50/aula** |
| **Avançado** | **800** | R$ 139,90 | R$ 0,175 | excedente a **R$ 0,50/aula** |

O excedente tem nome e preço: `pacotesDeAulas` — 20 aulas por R$ 10, 50 por R$ 25, 100 por R$ 50 —
sempre a **R$ 0,50 a aula**, e o comentário do catálogo diz por que é esse valor: tem de ser **mais caro
que a aula do plano seguinte** (senão ninguém migra) e **mais barato que a aula do Básico** (senão
ninguém compra no degrau de entrada). A migração do Básico acontece às **160 aulas**, a do
Intermediário às **380**.

**E o sistema já sabe calcular isto:** `comercial.situacaoDaFranquia({ contrato, aulasUsadas })`
devolve os quatro estados — `folga` · `perto` · `limite` · `passou` —, o `excedente`, o `restantes` e a
frase. **O que falta não é a regra: é quem lhe dê o número.** O contador de aulas do mês está
desenhado e não implementado ([`PLANO-CONTADOR-DE-AULAS.md`](PLANO-CONTADOR-DE-AULAS.md) §3.3), e a
distinção que ele guarda é a que interessa: `aulasUsadas: null` («não contei») não é `0` («não lançou
nenhuma»).

### 10.5 A tabela — uma escola em cada plano, dentro da franquia

É o caso **normal**, e é o que a pergunta dela quer dizer: o cliente contrata 100, 300 ou 800 aulas e
não passa disso.

| | Básico | Intermediário | Avançado |
|:--|--:|--:|--:|
| aulas contratadas | 100 | 300 | 800 |
| minutos de Actions (× 2,0) | 200 | 600 | 1 600 |
| **receita** | **R$ 69,90** | **R$ 99,90** | **R$ 139,90** |
| custo de CI | **R$ 0,00** | **R$ 0,00** | **R$ 0,00** |
| **lucro** | **R$ 69,90** | **R$ 99,90** | **R$ 139,90** |
| **margem** | **100 %** | **100 %** | **100 %** |

**Cada uma sozinha custa zero** — 200, 600 e 1 600 minutos contra os 2 000 do plano gratuito. Só a
partir da **segunda escola do Avançado** é que a cota estoura.

### 10.6 Quantas escolas — e onde (não) começa o prejuízo

Ela perguntou: «quantas escolas eu consigo ter lucro?» A resposta é **todas**, e a razão é aritmética:
**o custo de uma escola é uma fracção da receita dela**, qualquer que seja o N.

Ela perguntou também se «o custo aumenta mais do que a receita». **Não:** a receita e o custo crescem
os dois **linearmente**, ao mesmo ritmo, porque o preço do minuto é constante (US$ 0,006). O que a
escada do GitHub acrescenta são **dois valores fixos** — US$ 4 (Team) e US$ 21 (Enterprise) —, que
pesam **menos** à medida que o N cresce.

**As quatro configurações que ela pediu, com 3 escolas dentro da franquia:**

| configuração | minutos | receita | custo de CI | lucro | **margem** |
|:--|--:|--:|--:|--:|--:|
| **3 × Básico** | 600 | R$ 209,70 | R$ 0,00 | R$ 209,70 | **100,0 %** |
| **3 × Intermediário** | 1 800 | R$ 299,70 | R$ 0,00 | R$ 299,70 | **100,0 %** |
| **3 × Avançado** | 4 800 | R$ 419,70 | R$ 79,92 | R$ 339,78 | **81,0 %** |
| **1 de cada** | 2 400 | R$ 309,70 | R$ 12,96 | R$ 296,74 | **95,8 %** |

**E a margem com N crescente, no plano mais apertado — que é o Avançado:**

| N escolas | minutos | degrau | custo | lucro | margem |
|--:|--:|:--|--:|--:|--:|
| 1 | 1 600 | Free | R$ 0,00 | R$ 139,90 | 100,0 % |
| 2 | 3 200 | Team + excedente | R$ 28,08 | R$ 251,72 | 90,0 % |
| 3 | 4 800 | Team + excedente | R$ 79,92 | R$ 339,78 | 81,0 % |
| 5 | 8 000 | Team + excedente | R$ 183,60 | R$ 515,90 | 73,8 % |
| 10 | 16 000 | Team + excedente | R$ 442,80 | R$ 956,20 | 68,3 % |
| 20 | 32 000 | Team + excedente | R$ 961,20 | R$ 1 836,80 | 65,6 % |
| 50 | 80 000 | Team + excedente | R$ 2 516,40 | R$ 4 478,60 | **64,0 %** |

**A margem desce e depois aplana — nunca cruza o zero.** O piso de cada plano é o custo de uma escola
dividido pela receita dela:

| plano | custo de uma escola | receita | **piso da margem** | o zero exigiria |
|:--|--:|--:|--:|:--|
| Básico | R$ 6,48 | R$ 69,90 | **90,7 %** | **21,6 min/aula** — 10,8× o de hoje |
| Intermediário | R$ 19,44 | R$ 99,90 | **80,5 %** | 10,3 min/aula — 5,1× |
| **Avançado** | **R$ 51,84** | **R$ 139,90** | **62,9 %** | **5,4 min/aula — 2,7× o de hoje** |

**O caso mais apertado é o Avançado, e mesmo nele o runner teria de ficar 2,7 vezes mais lento para o
prejuízo aparecer.** O Avançado é o mais apertado porque é o que dá mais aulas por real: 800 aulas por
R$ 139,90 são R$ 0,175 a aula, e cada aula custa R$ 0,065 de CI — o compute fica com **37 %** do que a
escola paga. No Básico fica com **9 %**.

### 10.7 O caso de 16 horas por dia — acima da franquia, e o excedente é que paga

352 aulas/mês passa a franquia do Básico (100) e a do Intermediário (300); só o Avançado a comporta.
Acima da franquia a escola **paga excedente**, e é ele que sustenta a conta:

| | Básico | Intermediário | Avançado | **soma** |
|:--|--:|--:|--:|--:|
| aulas no mês | 352 | 352 | 352 | 1 056 |
| excedente (R$ 0,50) | 252 | 52 | 0 | 304 |
| **receita** | **R$ 195,90** | **R$ 125,90** | **R$ 139,90** | **R$ 461,70** |
| minutos (× 2,0) | 704 | 704 | 704 | 2 112 |
| **custo de CI** | R$ 0,00 | R$ 0,00 | R$ 0,00 | **R$ 3,63** |
| **lucro** | R$ 195,90 | R$ 125,90 | R$ 139,90 | **R$ 458,07** |
| **margem** | 100,0 % | 100,0 % | 100,0 % | **99,2 %** |

**As 2 112 min passam os 2 000 do gratuito por 112 — US$ 0,67, R$ 3,63.** Com **30 dias** em vez de
22 são 480 aulas e 960 min por escola: as três somam 2 880 min, o degrau é o **Team** (US$ 4,00 =
R$ 21,60) e a receita sobe a R$ 589,70 — margem **96,3 %**.

**E o preço já empurra esta escola para cima sozinho:** a 352 aulas ela paga **R$ 0,557/aula** no
Básico e **R$ 0,397** no Avançado. Uma escola que trabalhe 16 horas por dia **poupa dinheiro** mudando
para o Avançado, e o ponto de viragem é às 240 aulas — ela está 47 % acima dele.

### 10.8 O `teto.aulas: null` — o que ele é, e o que ele não é

**A primeira versão desta secção leu isto ao contrário, e a correcção é dela.** Escreveu-se que «não há
teto» e que «o sistema não tem como dizer à escola que ela está fora do plano». **As duas coisas são
falsas**, e o que se passa é outro:

- **A promessa comercial é a franquia** — 100/300/800 aulas por mês. Está escrita, é o limite, e acima
  dela há **excedente com preço**. Não há um estado «fora do plano»; há uma factura.
- **O `teto.aulas` do `planos.json` é outra coisa**: é o parâmetro **interno** com que o §L9c calcula a
  capacidade da infraestrutura — quantas aulas/mês gera a escola no **tamanho máximo de referência**
  (20 professores, 500 alunas). Está `null` por decisão, e o próprio catálogo diz porquê: «um teto
  comercial é uma promessa, e a promessa é a franquia (100/300/800)».
- **A C25 está resolvida**, não aberta: a 17/11/2026 a proprietária decidiu **contar 440** para a
  escola no tamanho máximo, que é a leitura **prudente** — «Eu acho que a gente tem que contar com a
  capacidade menor, né? Para a gente ser prudente.» E a razão de não se poder derivar o número é dela:
  depende de a escola cobrar **percentual** ou **hora-aula**, e esse modelo de negócio ainda não existe.

**Consequência para esta secção:** a C25 não tem nada a ver com a margem comercial. O que ela decide é
**quantas escolas cabem na cota**, e esse número **muda com a unidade que aqui se mede**. As tabelas da
§10.6 usam a franquia, que é a grandeza certa para a pergunta do lucro.

> **E há uma divergência que fica declarada, porque é do mesmo tipo.** O §L9c e o
> [`PLANO-CONTADOR-DE-AULAS.md`](PLANO-CONTADOR-DE-AULAS.md) §7.2 dizem **«3 escolas no tamanho
> máximo»** — e fizeram essa conta com **1 min por aula**: `(2 000 − 522 de engenharia) ÷ 440 = 3,4`.
> Com a unidade medida nesta secção, **2,0 min por aula**, são `1 478 ÷ 880 = 1,7` — **uma escola**, e
> não três. **Não se corrige o §L9c aqui**: ele é o sítio da capacidade, e mexer-lhe pede a sua própria
> medição da engenharia. O que fica dito é que **a decisão da C25 (contar 440) continua válida** — o
> que muda é a capacidade que dela se tira, e ela é **menor** do que o §L9c escreveu, não maior.

### 10.9 Quando migrar — os gatilhos, com os números de hoje

| degrau | custo | gatilho **correto** | a que distância está |
|:--|--:|:--|:--|
| GitHub Free | US$ 0 | até 2 000 min | **3 do Básico** (600) e **3 do Intermediário** (1 800) cabem; **1 do Avançado** (1 600) cabe, **2 já não** (3 200) |
| Free + excedente | até US$ 4 | 2 000 – 2 667 min | **3 do Avançado** (4 800) já passaram; **4 do Intermediário** (2 400) caem aqui |
| **GitHub Team** | US$ 4/pessoa | acima de **2 667 min** | **3 do Avançado** (4 800 min) |
| GitHub Enterprise | US$ 21/pessoa | acima de 5 833 min | **a 4ª do Avançado** (6 400 min) |
| Cloudflare Paid | US$ 5/conta | 1 000 escritas de KV/dia | **não medido** (§10.10) |
| Resend Pro | US$ 20 | 3 000 e-mails/mês ou **100/dia** | **não medido** (§10.10) |

> **Uma divergência entre dois documentos do planeamento, e ela manda migrar cedo demais.** O §L9d
> escreve o gatilho do Team como «acima de 2 000 min facturados»; o §L9c, que fez a conta ao cêntimo,
> escreve **2 667**. O §L9c é o certo: entre 2 000 e 2 667 o excedente custa entre US$ 0 e US$ 4, e o
> Team custa US$ 4 fixos. **A escada do §L9d é a que o painel vai implementar**, e implementada como
> está escrita faria o painel recomendar a migração **antes** de ela compensar. Fica declarado;
> corrigir é mexer no painel.

### 10.10 O que é medição, e o que é modelo

| o que | estatuto |
|:--|:--|
| duração de cada workflow (mediana, cauda, % acima de 60 s) | **medido** — API dos runs, 1 000 execuções |
| 24 aulas por ciclo | **medido** — o plano do `ciclo-01-breu-piano` |
| `pandoc` 59 ms/página e validação 32 ms/aula | **medido** — micro-bancada nesta máquina |
| **a curva do laço acima das 24 aulas** | **calculado** a partir das duas micro-bancadas — **nenhum ciclo aqui passou de uma aula gerada** |
| a factura em repositório **privado** | **modelo** — o repositório é público e o `/timing` responde `billable.UBUNTU.total_ms = 0` em todas as execuções; o modelo é o do §L9f, conferido contra a factura real com 3,5 % de erro |

**O ensaio que fecha a lacuna** é barato e está identificado: **gerar um ciclo com 50 aulas e ler a
duração do job**. Ele mede a única coisa que aqui é calculada em vez de observada — e o resultado, seja
qual for, **não muda a conclusão**: a fronteira do minuto está às **67** aulas num ciclo só, e um ciclo
de 50 fica em **55 s**, abaixo dela.

### 10.11 O que eu errei nesta secção, e a correcção *(25/11/2026, mesmo dia)*

Três erros, todos meus, e a correcção é dela — ela viu dois de fora:

1. **«Não há teto.»** Falso. A franquia é o teto — **100/300/800** —, está no catálogo em
   `assinaturas[].aulas`, e acima dela há excedente a R$ 0,50. Confundi o `teto.aulas` (parâmetro
   interno do §L9c, `null` por decisão) com a franquia comercial. Ver a §10.8.
2. **«A C25 está aberta.»** Falso. Está **resolvida** a 17/11/2026: conta-se **440** para a escola no
   tamanho máximo, e o `null` do `teto.aulas` é deliberado. Ver a §10.8.
3. **«A geração percorre as 352 aulas do mês.»** Falso. Percorre as aulas **do ciclo**, e o ciclo tem
   **24**. Daí saiu uma soma quadrática de 1 076 min por escola que não existe: são **704**. Ver a
   §10.3.

**O que sobrevive da primeira versão:** a unidade de 2 min por aula medida nos jobs, a explicação de
que «partilhar o workflow» não poupa minuto, a divergência §L9c × §L9d no gatilho do Team, e a
conclusão de que **a infraestrutura não é o que limita a margem**. O que muda é **quanto**: a margem a
16 aulas/dia é **99,2 %** e não 93,7 %, e **não existe** um número de escolas a partir do qual dá
prejuízo.

### 10.12 O que o Cloudflare e o Resend custam neste cenário

**Zero, e o motivo não é medição — é o tecto.** O §L9c retirou a estimativa de escritas de KV («≈120/dia
por escola») precisamente por ser palpite, e **não se repete o erro com um número novo**. O que se sabe
é o limite: **1 000 escritas de KV por dia** no plano gratuito, **100 e-mails por dia** no Resend. O que
se não sabe é quanto uma escola escreve e envia.

**E a aula não é o que envia correio** — verificado no código: o `correio.enviar` de `bastidores.js`
(linha ~24 001) nasce do **pedido de anamnese**, não do lançamento. O risco do correio é o que o §L9d já
escreveu: **um lote**. Uma escola com 90 alunas que peça as 90 anamneses no mesmo dia gasta 90 dos 100
e-mails do dia — e isso acontece no arranque, não a cada aula. **Enquanto não houver medição, nenhum
dos dois entra na conta.**

---

## 11. O equilíbrio da escada — quantas aulas por semana cada plano pode dar *(25/11/2026)*

> «Eu tenho essa viabilidade prática, ela é meio fantasiosa para os planos básicos, intermediários e
> avançados. […] eu acho que está mal equilibrado isso. Eu acho que dá para aumentar algumas escolas,
> em dois planos, no básico e no intermediário, dá para aumentar a quantidade de aulas, alguma medida,
> né? E no avançado dá para diminuir a quantidade de aulas em alguma medida. Então vamos tentar
> equilibrar isso para ver se fica mais interessante para a escola e para mim.»
> — a proprietária, 25/11/2026

### 11.1 A viabilidade dela está certa, e cruza com a franquia ao minuto

A análise que ela trouxe («4 h/dia, 6 dias» para o Básico; «12 h seguidas ou 2 salas» para o
Intermediário; «31 aulas/dia é impossível numa sala» para o Avançado) **confere com o catálogo**, e
confere ao minuto:

| plano | franquia | por semana | por dia (6 dias) | a operação que ela descreveu |
|:--|--:|--:|--:|:--|
| **Básico** | 100 | **23,1** | **3,8** | 4 aulas/dia × 6 dias, 1 sala |
| **Intermediário** | 300 | **69,3** | **11,5** | 12 aulas/dia (1 sala 12 h, ou 2 salas × 6) |
| **Avançado** | 800 | **184,8** | **30,8** | 31 aulas/dia — **impossível numa sala a 1/h** |

**Não é uma coincidência: as franquias foram desenhadas sobre essas operações.** E é por isso que o
cenário dos «16 h por dia» da §10 estava errado como retrato — **nenhuma escola do Básico trabalha 16
horas**; ela trabalha quatro. A franquia é a realidade operacional, e é ela que manda nesta secção.

### 11.2 O tecto dos 100 % é do DONO DA CONTA, não do plano

**A resposta à pergunta literal dela** («quantas aulas por semana posso chegar para ainda ter 100 % de
lucro?») tem uma forma que surpreende: **o tecto é o mesmo nos três planos**, porque a cota é uma só —
a da conta.

```
2 000 min ÷ 2,0 min/aula = 1 000 aulas/mês  no TOTAL da conta
```

E daí:

| | franquia de hoje | tecto a 100 % | veredicto |
|:--|--:|--:|:--|
| **Básico**, 3 escolas | 23/semana cada | **77/semana cada** | **folga de 3,3×** — cabe muito mais |
| **Intermediário**, 3 escolas | 69/semana cada | **77/semana cada** | **folga de 1,1×** — está no ponto |
| **Avançado**, 3 escolas | 185/semana cada | **77/semana cada** | **excede 2,4×** — não cabe |

**E com 9 escolas (3 de cada), o tecto desce a 26 aulas por semana por escola** — 111 por mês, que é
pouco acima da franquia do Básico. **Nove escolas a 100 % de margem só existem se todas forem
pequenas**; a escada de hoje pede 7 200 minutos para as nove, contra os 2 000 do gratuito.

> **É exatamente o desequilíbrio que ela viu, e agora está quantificado:** o Básico promete **um terço**
> do que a conta aguenta, o Intermediário promete o que aguenta, e o Avançado promete **2,4 vezes** o
> que aguenta.

### 11.3 O que a conta aguenta, por plano — e a razão de ser

| plano | quantas escolas cabem a R$ 0 | receita a R$ 0 |
|:--|--:|--:|
| só Básico (100) | **10** | **R$ 699,00** |
| só Intermediário (300) | **3** | R$ 299,70 |
| só Avançado (800) | **1** | R$ 139,90 |

**Dez vezes mais receita gratuita com o Básico do que com o Avançado.** A razão é uma só: **o compute
custa o mesmo por aula, e o Avançado vende a aula quatro vezes mais barata.** A escada de valor — que
é deliberada, e está documentada no `planos.json` — **é, do lado do custo, um subsídio**: cada degrau
que sobe dá mais aulas por menos dinheiro, e o CI acompanha as aulas, não o dinheiro.

### 11.4 Dois limites duros que a renegociação não pode passar

Antes de propor números, dois invariantes do próprio catálogo que fecham o espaço de manobra:

**1. O Básico não pode passar de 139 aulas.** A extensão custa **R$ 0,50 por aula**
(`pacotesDeAulas`), e o catálogo diz por que esse preço é esse: *«a R$ 0,20 a extensão ficaria mais
barata do que a aula do Intermediário e ninguém migraria nunca»*. O outro lado do mesmo invariante é
que a extensão tem de ser **mais barata do que a aula do plano de entrada**, senão ela não se vende no
degrau onde existe:

```
69,90 ÷ aulas > 0,50   ⟹   aulas < 139,8   ⟹   Básico ≤ 139
```

**2. O Avançado tem de ter mais aulas do que o Intermediário por real.** Para continuar a ser o degrau
de cima:

| Intermediário | R$/aula | Avançado tem de ter |
|--:|--:|--:|
| 300 | 0,333 | **mais de 420** |
| 320 | 0,312 | **mais de 448** |
| 350 | 0,285 | **mais de 490** |

**E há uma segunda consequência, que é dela e não minha:** a R$ 0,50 a extensão fica **2,86×** a aula
do Avançado hoje (0,175) e só **1,79×** se o Avançado for a 500 (0,280). A extensão deixa de ser
punida no topo — o que é bom para quem já está lá e mau para a migração para cima, que no Avançado não
existe.

### 11.5 A escada proposta: **139 / 320 / 500**

| | Básico | Intermediário | Avançado |
|:--|--:|--:|--:|
| **hoje** | 100 | 300 | 800 |
| **proposto** | **139** | **320** | **500** |
| variação | **+39 %** | **+7 %** | **−37 %** |
| aulas/semana | 32,1 | 73,9 | 115,5 |
| aulas/dia (6 dias) | **5,4** | **12,3** | **19,2** |
| a operação que a gasta | 1 sala | 2 salas × 6,2 | 3 salas × 6,4 |
| **R$ por aula** | **0,503** | **0,312** | **0,280** |
| compute sobre a receita | **13 %** | **21 %** | **23 %** |
| minutos por escola | 278 | 640 | 1 000 |
| escolas a R$ 0 | 7 | 3 | 2 |

**O que isto faz, e são quatro coisas:**

1. **O Básico passa a dar 39 % mais aulas pelo mesmo preço** — e é o máximo que o invariante da
   extensão permite. A escola pequena ganha quase 10 aulas por mês, e a proprietária não paga nada por
   isso enquanto houver cota.
2. **O Avançado cai de 800 para 500** — de 31 aulas por dia para **19**, que é uma operação de três
   salas, não de trinta horas. E o compute sobre a receita cai de **37 % para 23 %**.
3. **A escada fica com passos reais, e menores:** a aula passa a custar 0,503 → 0,312 → 0,280, ou seja
   **−38 % e −10 %**. Hoje é −52 % e −47 %: um desconto que ela pagava em minutos.
4. **A margem sobe com as nove escolas cheias: de 83,0 % para 88,1 %** (R$ 929,10 de receita contra
   R$ 110,83 de CI, em vez de R$ 157,68).

**E as capacidades ficam mais honestas:** hoje cabem **10** escolas do Básico, **3** do Intermediário e
**1** do Avançado. Com a escada nova cabem **7 / 3 / 2**. **A receita máxima a R$ 0 desce** (de R$ 699
para R$ 489), porque o Básico ficou mais generoso — é o preço de dar mais valor no degrau de entrada,
e é um preço que se paga com a margem das nove.

### 11.6 O que muda na migração, e é a parte que ela não pediu

O ponto em que a extensão deixa de valer a pena e o degrau de cima passa a compensar **move-se com as
franquias**:

| migração | hoje | com 139 / 320 / 500 |
|:--|:--|:--|
| Básico → Intermediário | às **160** aulas | às **259** |
| Intermediário → Avançado | às **380** aulas | às **400** |

Com o Básico em 139, a extensão continua a fazer sentido até às 259 aulas — **mais 120 aulas** do que
hoje. E é aqui que a proposta tem um custo escondido: **a extensão passa a vender mais**, porque o
cliente do Básico tem de comprar mais 120 aulas antes de o upgrade compensar. Se a extensão é um
produto que se quer vender, isto é bom; se a migração é o que se quer, é mau. **A escolha é dela, e
não é uma conta — é uma política.**

### 11.7 As alternativas, e o que cada uma custa

| escada | R$/aula | margem (9 escolas) | computa a mais | cabe a R$ 0 |
|:--|:--|--:|--:|:--|
| **hoje** 100/300/800 | 0,699 / 0,333 / 0,175 | **83,0 %** | 25 % | 10 / 3 / 1 |
| **A** 130/320/500 | 0,538 / 0,312 / 0,280 | 88,3 % | 20 % | 7 / 3 / 2 |
| **B** 139/320/500 *(proposta)* | 0,503 / 0,312 / 0,280 | **88,1 %** | 20 % | 7 / 3 / 2 |
| **C** 139/350/560 | 0,503 / 0,285 / 0,250 | 86,2 % | 22 % | 7 / 2 / 1 |

**A diferença entre A e B é de 0,2 pontos de margem** — e B dá 9 aulas a mais no Básico. **C** dá 30
aulas a mais no Intermediário e 60 no Avançado, e custa 1,9 pontos de margem e uma escola de capacidade
em cada um dos dois planos de cima: é a mais generosa com a escola e a mais cara para ela.

### 11.8 O que é medição, e o que é decisão

- **Medido:** 2,0 min por aula (§10.1); 24 aulas por ciclo; o custo do minuto (US$ 0,006, câmbio
  5,40); as franquias (100/300/800) e os preços (69,90/99,90/139,90), do `planos.json`; a extensão a
  R$ 0,50 e o invariante que ela impõe, do mesmo ficheiro.
- **Calculado, e não medido:** a viabilidade por dia (a franquia ÷ 4,33 semanas ÷ 6 dias) — é
  aritmética sobre o que a escola declarar; **a operação real de uma escola não foi observada.**
- **Decisão dela, e não minha:** qual escada. A proposta desta secção é uma recomendação com a conta
  ao lado; o preço, o tamanho dos passos e a política de extensão são comerciais.

> **E o que continua a ser o número mais frágil desta conta:** a escola que **não** gasta a franquia.
> Toda esta secção supõe que a escola lança as 139, 320 ou 500 aulas — **o custo só existe quando elas
> são lançadas.** Uma escola que compre o Avançado e lance 50 aulas custa R$ 6,48, e o problema desta
> secção desaparece. É por isso que o contador de aulas do mês (o
> [`PLANO-CONTADOR-DE-AULAS.md`](PLANO-CONTADOR-DE-AULAS.md)) é mais útil do que qualquer tabela: ele
> mede o que a escola **usa**, não o que ela **pode**.

---

## 12. A escada escolhida — **130 / 320 / 500**, com o dólar a R$ 6 *(25/11/2026)*

> «Eu vou ficar com a proposta A, ela é a mais vantajosa para mim e também é razoável com a escola.
> […] Vamos fazer a estimativa com o dólar a R$ 6 para a gente ter uma sobra. […] Eu acho que até
> R$ 6 o dólar é onde eu posso suportar. […] E se a gente for mexer em alguma coisa para eu suportar
> o custo, a gente vai diminuir a quantidade de aulas, tá? E o que vier é lucro.»
> — a proprietária, 25/11/2026

**DECIDIDO: a escada é 130 / 320 / 500** (era 100 / 300 / 800), e **o dólar de referência é R$ 6,00**.
Esta secção refaz a conta com os dois — e o resultado é melhor do que o da escada anterior: às nove
escolas cheias o custo **cai** de R$ 175,20 para **R$ 121,20** (a R$ 6), e a margem **sobe** de 81,1 %
para **87,0 %**.

### 12.1 A tabela que ela pediu — as aulas por semana

| plano | aulas/mês | **por semana** | por dia (6 dias) | a operação | R$ por aula |
|:--|--:|--:|--:|:--|--:|
| **Básico** | **130** | **30,0** | **5,0** | 1 sala, 5 aulas/dia | R$ 0,538 |
| **Intermediário** | **320** | **73,8** | **12,3** | 2 salas × 6,2 | R$ 0,312 |
| **Avançado** | **500** | **115,4** | **19,2** | 3 salas × 6,4 | R$ 0,280 |

*(mês = 52 ÷ 12 = 4,33 semanas; dia = semana ÷ 6. É aritmética sobre a franquia — a operação real de
uma escola não foi observada.)*

**As três operações são reais**, e é isso que a §11 foi buscar: uma sala a cinco aulas por dia, duas
salas a seis, três salas a seis e meia. **Nenhuma delas exige mais de 12 horas de porta aberta.**

### 12.2 Quando é interessante migrar — e quando a extensão deixa de valer a pena

Com a extensão a **R$ 0,50 por aula**, a conta que a escola faz é comparar «ficar e comprar extensão»
com «subir de plano». Os dois pontos de viragem:

| migração | aulas/mês | **por semana** | por dia | por que |
|:--|--:|--:|--:|:--|
| **Básico → Intermediário** | **190** | **43,8** | 7,3 | `69,90 + (n−130)×0,50 = 99,90` |
| **Intermediário → Avançado** | **400** | **92,3** | 15,4 | `99,90 + (n−320)×0,50 = 139,90` |

**E, em espelho, a janela em que a extensão é o melhor negócio para a escola** — entre a franquia e o
ponto de migração:

| plano | a extensão vale a pena de… | até… | em semanas |
|:--|--:|--:|:--|
| **Básico** | 131 | **190** aulas/mês | **30,2 → 43,8 / semana** |
| **Intermediário** | 321 | **400** aulas/mês | **74,1 → 92,3 / semana** |
| **Avançado** | 501 | — | **115,6 / semana em diante** |

**Três leituras, e a terceira é a que importa para ela:**

1. **A janela do Básico tem 60 aulas de largura** (130→190) e a do Intermediário **80** (320→400). São
   janelas generosas: a escola que cresce passa alguns meses a comprar extensão antes de valer a pena
   mudar.
2. **No Avançado não há janela — não há plano acima.** Acima de 500 aulas a escola **só** pode comprar
   extensão, e aí ela paga **R$ 0,50** por uma aula que o plano lhe dava a R$ 0,280: **1,79×**. É o
   único degrau onde a extensão é a única saída, e é onde ela é mais cara em relação ao plano.
3. **E é exactamente por isso que «o que vier é lucro» é literal.** A extensão custa **R$ 0,072** de CI
   e vende-se a **R$ 0,50** — **85,6 % de margem**, tão boa quanto a do Básico (86,6 %) e **melhor do
   que a do Intermediário (76,9 %) e a do Avançado (74,3 %)**. Cada aula de extensão vendida rende mais
   do que uma aula de plano, em dois dos três degraus.

### 12.3 Quando os custos aumentam — e é uma vez só

**A resposta curta: o custo é R$ 0,00 até 1 000 aulas/mês na conta inteira, e depois é R$ 0,072 por
aula, para sempre.** Não há segundo degrau que assuste.

```
1 000 aulas/mês = 2 000 min = o fim do plano gratuito
```

Em escolas, o fim do gratuito chega a:

| só este plano | quantas escolas cabem a R$ 0 |
|:--|--:|
| **Básico** (260 min cada) | **7** |
| **Intermediário** (640 min cada) | **3** |
| **Avançado** (1 000 min cada) | **2** |
| **uma de cada** (1 900 min) | **3** — e ainda sobra |

E a escada do GitHub, a R$ 6,00:

| minutos na conta | o que ela paga |
|--:|:--|
| 0 – 2 000 | **R$ 0,00** |
| 2 000 – 2 667 | R$ 0,036 por minuto (= **R$ 0,072 por aula**) |
| 2 667 – 3 000 | **R$ 24,00 fixos** — o Team |
| acima de 3 000 | R$ 24,00 + R$ 0,036 por minuto |

### 12.4 A margem não depende do número de escolas

**E isto é a descoberta mais tranquilizadora desta secção.** Como o custo é **proporcional às aulas** e
a receita também, a margem de uma escola **não muda quando se acrescentam escolas** — ela converge
para o piso do plano e fica lá:

| plano | N=1 | N=3 | N=5 | N=10 | N=30 (o piso) |
|:--|--:|--:|--:|--:|--:|
| **Básico** | 100,0 % | 100,0 % | 100,0 % | 96,9 % | **90,6 %** |
| **Intermediário** | 100,0 % | 100,0 % | 93,8 % | 85,3 % | **79,7 %** |
| **Avançado** | 100,0 % | 94,3 % | 86,3 % | 80,3 % | **76,3 %** |

**O que desce é a fatia gratuita, e ela acaba uma vez.** O 100 % do N=1 não é mérito do plano: é o
gratuito do GitHub a pagar. Quando ele acaba, a margem cai para o piso e **fica lá** — não continua a
cair. **Não há um número de escolas em que o negócio vire.**

### 12.5 O caso dela, com o dólar a R$ 6 — 3 de cada, todas na franquia cheia

**9 escolas, 2 850 aulas/mês, 5 700 minutos, receita R$ 929,10.**

| dólar | US$ | custo R$ | lucro R$ | **margem** |
|--:|--:|--:|--:|--:|
| 4,00 | 20,20 | 80,80 | 848,30 | **91,3 %** |
| 5,00 | 20,20 | 101,00 | 828,10 | 89,1 % |
| 5,40 | 20,20 | 109,08 | 820,02 | 88,3 % |
| **6,00** | **20,20** | **121,20** | **807,90** | **87,0 %** |
| 8,00 | 20,20 | 161,60 | 767,50 | 82,6 % |
| 10,00 | 20,20 | 202,00 | 727,10 | 78,3 % |
| 12,00 | 20,20 | 242,40 | 686,70 | 73,9 % |
| 15,00 | 20,20 | 303,00 | 626,10 | 67,4 % |
| **23,00** | 20,20 | 464,60 | 464,50 | **50,0 %** |
| 46,00 | 20,20 | 929,20 | −0,10 | **0,0 %** |

**A R$ 6, o custo é 13,0 % da receita.** E o prejuízo só começa a um dólar de **R$ 46,00** — oito vezes
o que ela declarou suportar. **A margem de 50 % só é tocada a R$ 23.** A preocupação dela é legítima
como princípio e **não tem como se materializar** com esta escada.

**Por plano, o dólar em que cada um chega ao piso:**

| plano | 50 % de margem | prejuízo |
|:--|--:|--:|
| Básico | R$ 22,40 | R$ 44,81 |
| Intermediário | R$ 13,01 | R$ 26,02 |
| **Avançado** | **R$ 11,66** | **R$ 23,32** |

**O Avançado é o primeiro a apertar**, e mesmo ele só a R$ 11,66. A R$ 6, o piso dele é **74,3 %**.

### 12.6 A conta sem a franquia cheia — que é o caso real

Ela disse-o: «as escolas não chegam a tudo isso de aula». Toda a §12.5 supõe a franquia **gasta até ao
fim**, e é o **pior caso**. Se as escolas usarem metade:

| cenário (3 de cada) | aulas/mês | minutos | custo R$ (a R$ 6) | margem |
|:--|--:|--:|--:|--:|
| franquia cheia | 2 850 | 5 700 | 121,20 | 87,0 % |
| **metade da franquia** | 1 425 | 2 850 | **24,00** | **97,4 %** |
| um terço | 950 | 1 900 | **0,00** | **100 %** |

**A conta só custa dinheiro quando as escolas usam o que compraram** — e mesmo aí é 13 %.

### 12.7 A engenharia, que não é escola e paga a mesma cota

Medido entre 15 e 24/11/2026: **1 212 min/mês** de desenvolvimento. Somado às nove escolas:

| | minutos | custo R$ (a R$ 6) |
|:--|--:|--:|
| só as 9 escolas | 5 700 | 121,20 |
| **9 escolas + engenharia** | 6 912 | **164,83** |
| 9 escolas + um mês forte de engenharia (2 662) | 8 362 | 217,03 |

**A engenharia custa R$ 43,63 por mês a mais do que as nove escolas — 36 % do total.** É a maior
rubrica depois das escolas, e é a única que ela controla sem tocar na promessa comercial.

### 12.8 A alavanca que ela propôs — e por que ela é fraca

> «Se a gente for mexer em alguma coisa para eu suportar o custo, a gente vai diminuir a quantidade de
> aulas.»

**Medido: uma aula custa R$ 0,072.** Para poupar R$ 100 por mês seriam precisas **1 389 aulas** — mais
do que a conta inteira (2 850) —, e a partir daí ela pouparia **R$ 0,00**, porque já não teria aulas
nenhumas. O efeito real de cortar 10 % da franquia:

| plano | corte | poupa por mês | % da receita | o que sai da promessa |
|:--|:--|--:|--:|:--|
| Básico | 130 → 117 | R$ 0,94 | 1,3 % | 13 aulas |
| Intermediário | 320 → 288 | R$ 2,30 | 2,3 % | 32 aulas |
| Avançado | 500 → 450 | R$ 3,60 | 2,6 % | 50 aulas |

**Cortar aulas é a alavanca mais fraca que existe**, e é importante dizê-lo antes de ela a usar: tirar
50 aulas do Avançado devolve **R$ 3,60 por escola** e custa 50 aulas de promessa. **O que poupa a
sério é o número de escolas, não o tamanho delas** — e este ano nem isso, porque o custo a R$ 6 é 13 %
da receita.

**Se o gatilho for mesmo preciso**, a ordem certa é: (1) **o gratuito, que já está a ser usado**;
(2) **a engenharia**, que é 36 % do custo e não é promessa a ninguém; (3) **a consolidação dos jobs**
(§7.1), que corta a unidade de 2,0 para 1,0 min e **reduz esta factura a metade**; e só (4) a franquia,
que é a que dá menos por aula cortada.

### 12.9 A linha de alarme — o que vigiar

| aulas/mês na conta | minutos | custo R$ a R$ 6 | % de uma receita de R$ 929 |
|--:|--:|--:|--:|
| 500 | 1 000 | 0,00 | 0,0 % |
| **1 000** | **2 000** | **0,00** | **0,0 %** ← o fim do gratuito |
| 1 500 | 3 000 | 24,00 | 2,6 % |
| 2 850 | 5 700 | 121,20 | 13,0 % |
| 4 000 | 8 000 | 204,00 | 22,0 % |
| 6 000 | 12 000 | 348,00 | 37,5 % |

**A conta exacta, a R$ 6** (`a` = aulas/mês, `m = 2a`):

| se as aulas forem… | o custo é |
|:--|:--|
| `a ≤ 1 000` | **R$ 0,00** |
| `1 000 < a ≤ 1 500` | `(a − 1 000) × 0,072` |
| `a > 1 500` | `24 + (a − 1 500) × 0,072` |

**E a margem, que não depende de `a` depois de o gratuito acabar:**
```
margem ≈ 1 − 0,072 ÷ (preço do plano ÷ aulas do plano)
       = 86,6 % (Básico) · 76,9 % (Intermediário) · 74,3 % (Avançado)
```

> **A forma curta que quase funciona, e o erro dela.** `(a − 1 000) × 0,072` **exagera sempre** o
> custo, porque o Team cobre 1 000 minutos a mais do que o gratuito cobria: a 2 850 aulas ela dá
> R$ 133,20 em vez dos R$ 121,20 reais. **Erra por excesso, e por isso serve para orçamentar** — mas
> não é o número, e é preciso dizê-lo.

E **a única coisa que ela tem de vigiar**: o **total de aulas lançadas no mês**, todas as escolas
somadas. É esse número — e não o número de escolas, nem o plano de cada uma — que decide se a conta
está nos R$ 0 ou nos R$ 121. E é ele que o contador de aulas do mês
([`PLANO-CONTADOR-DE-AULAS.md`](PLANO-CONTADOR-DE-AULAS.md)) vai medir quando existir.

### 12.10 O que fica decidido, e o que fica por escrever

**DECIDIDO:** a escada é **130 / 320 / 500**; o dólar de referência é **R$ 6,00**; a R$ 6 a margem das
nove escolas cheias é **87,0 %**; não há prejuízo em nenhum cenário plausível (o zero só a R$ 46); e a
alavanca de socorro **não é cortar aulas** — é o número de escolas e a engenharia.

**POR ESCREVER, e não se fez aqui:** as três franquias continuam **100 / 300 / 800** em
`biblioteca/comercial/planos.json → assinaturas[].aulas`. Enquanto não forem escritas, **o sistema
promete a escada antiga** — o painel, o Financeiro e o `situacaoDaFranquia` leem aquele ficheiro.
Escrevê-las é mudar três números e publicar; **não se fez porque é decisão comercial e ela acabou de a
tomar, e porque o commit do catálogo merece ser o dele**, com o motivo declarado.

---

## 13. O simulado das extensões, e a política de mora *(25/11/2026)*

> «A gente tem uma parte que é relacionada às extensões da mensalidade. A gente tem um preço
> calculado aqui. Você não fez o simulado com esses preços calculados. […] se a escola vai crescer e
> precisa contratar extensões de aula até aquele limite que é interessante antes de mudar de plano
> com esses valores, qual é então a margem que eu vou passar a ter? E quanto é que a escola vai
> pagar também?»
> — a proprietária, 25/11/2026

### 13.1 A extensão é o produto de maior margem que a casa tem

A extensão custa **R$ 0,50 por aula** e custa **R$ 0,072** de CI (a R$ 6). Isso é **85,6 % de
margem** — e é preciso pôr os quatro números lado a lado, porque a conclusão inverte a intuição:

| o que se vende | receita por aula | custo (R$ 6) | **margem** |
|:--|--:|--:|--:|
| **extensão** | **R$ 0,500** | R$ 0,072 | **85,6 %** |
| plano Básico | R$ 0,538 | R$ 0,072 | 86,6 % |
| plano Intermediário | R$ 0,312 | R$ 0,072 | 76,9 % |
| plano Avançado | R$ 0,280 | R$ 0,072 | 74,3 % |

**«O que vier é lucro» é literal.** A extensão rende **mais** do que uma aula de plano em **dois** dos
três degraus — e no terceiro empata. Ela não é um mal necessário: é o melhor produto da tabela.

### 13.2 A escola que cresce: quanto paga, e qual a margem — degrau a degrau

**Básico (130 / migra às 190)**

| aulas/mês | extensões | mensalidade + ext. | custo de CI | lucro | **margem** | R$/aula |
|--:|--:|--:|--:|--:|--:|--:|
| 130 (franquia) | 0 | R$ 69,90 | R$ 9,36 | R$ 60,54 | 86,6 % | 0,538 |
| 140 | 10 | R$ 74,90 | R$ 10,08 | R$ 64,82 | 86,5 % | 0,535 |
| 160 | 30 | R$ 84,90 | R$ 11,52 | R$ 73,38 | 86,4 % | 0,531 |
| **190 (migra)** | **60** | **R$ 99,90** | R$ 13,68 | R$ 86,22 | **86,3 %** | 0,526 |

**Intermediário (320 / migra às 400)**

| aulas/mês | extensões | mensalidade + ext. | custo de CI | lucro | **margem** | R$/aula |
|--:|--:|--:|--:|--:|--:|--:|
| 320 (franquia) | 0 | R$ 99,90 | R$ 23,04 | R$ 76,86 | 76,9 % | 0,312 |
| 340 | 20 | R$ 109,90 | R$ 24,48 | R$ 85,42 | 77,7 % | 0,323 |
| **400 (migra)** | **80** | **R$ 139,90** | R$ 28,80 | R$ 111,10 | **79,4 %** | 0,350 |

**Avançado (500 / sem degrau acima)**

| aulas/mês | extensões | mensalidade + ext. | custo de CI | lucro | **margem** | R$/aula |
|--:|--:|--:|--:|--:|--:|--:|
| 500 (franquia) | 0 | R$ 139,90 | R$ 36,00 | R$ 103,90 | 74,3 % | 0,280 |
| 520 | 20 | R$ 149,90 | R$ 37,44 | R$ 112,46 | 75,0 % | 0,288 |
| 750 | 250 | R$ 264,90 | R$ 54,00 | R$ 210,90 | 79,6 % | 0,353 |
| 1 000 | 500 | R$ 389,90 | R$ 72,00 | R$ 317,90 | **81,5 %** | 0,390 |

**Três leituras, e a segunda é a que ninguém espera:**

1. **A margem SOBE em todos os degraus** à medida que a escola compra extensão — de 86,6 % para 86,3 %
   no Básico (desce um décimo), de 76,9 % para **79,4 %** no Intermediário, de 74,3 % para **81,5 %**
   no Avançado. **A extensão melhora a margem**, porque custa o mesmo que uma aula de plano e vende-se
   por mais.
2. **A receita por aula SOBE para a escola que cresce**, o que parece contra-intuitivo: no Avançado,
   de R$ 0,280 para R$ 0,390. **A escola paga mais por aula nas extensões do que no plano** — e é
   exactamente isso que o `planos.json` decidiu quando fixou R$ 0,50: «o custo unitário da aula da
   extensão é maior do que o custo unitário da aula do próximo plano».
3. **No Básico a margem é quase plana** (86,6 % → 86,3 %) porque a aula do plano já custa R$ 0,538,
   muito perto dos R$ 0,50 da extensão. **É o único degrau onde crescer não melhora quase nada** — e
   é por isso que a migração dele é a mais cedo (às 190).

### 13.3 O conjunto: nove escolas, e o efeito de crescerem

| cenário (3 de cada) | aulas/mês | minutos | receita | custo (R$ 6) | lucro | **margem** |
|:--|--:|--:|--:|--:|--:|--:|
| todas na franquia | 2 850 | 5 700 | R$ 929,10 | R$ 121,20 | R$ 807,90 | 87,0 % |
| **meio caminho até migrar** | 3 060 | 6 120 | R$ 1 034,10 | R$ 136,32 | R$ 897,78 | 86,8 % |
| **no ponto de migrar** | 3 270 | 6 540 | R$ 1 139,10 | R$ 151,44 | R$ 987,66 | 86,7 % |
| Avançado a dobrar (1 000) | 4 350 | 8 700 | R$ 1 679,10 | R$ 229,20 | R$ 1 449,90 | 86,3 % |

**Crescer 50 % em aulas dá 65 % mais receita e 89 % mais lucro**, e a margem mal se mexe (87,0 % →
86,3 %). **A extensão é o que faz o negócio crescer sem estragar a margem.**

### 13.4 A pergunta dela: «quando é que a escola deve migrar?»

Com a extensão a R$ 0,50, a conta que a escola faz é comparar «ficar e comprar extensão» com «subir»:

| migração | ponto de viragem | por semana | por dia |
|:--|--:|--:|--:|
| **Básico → Intermediário** | **190 aulas/mês** | **43,8** | 7,3 |
| **Intermediário → Avançado** | **400 aulas/mês** | **92,3** | 15,4 |

**E a janela em que a extensão é o melhor negócio PARA A ESCOLA** é o intervalo entre a franquia e o
ponto de migração: **131–190** no Básico (60 aulas de largura), **321–400** no Intermediário (80), e
**501 em diante** no Avançado — onde não há plano acima, e a extensão passa a ser a única saída, a
**1,79×** o preço da aula do próprio plano.

> **Um aviso que fica declarado, e é comercial:** no ponto de migração a escola paga **R$ 99,90 por
> 190 aulas** (R$ 0,526) quando poderia pagar **R$ 99,90 por 320** (R$ 0,312). **Ela só migra se
> souber** — e o sistema não lhe diz. A frase do `situacaoDaFranquia` avisa que a franquia está no
> fim, e não que existe um degrau acima mais barato. **É o que falta para a janela cumprir o que
> promete**, e é a próxima peça desta frente.

### 13.5 Por que cortar aulas é a alavanca fraca — a demonstração

Ela propôs: «se a gente for mexer em alguma coisa para eu suportar o custo, a gente vai diminuir a
quantidade de aulas». **Medido, e são quatro razões:**

**1. A aula custa sete centavos e o preço dela é trinta.** O custo é **13 %** da receita no Básico e
**26 %** no Avançado — nunca mais do que isso. Cortar o que custa 13 % não salva o que rende 100 %.

**2. Para segurar o custo quando o dólar sobe, é preciso cortar NA MESMA PROPORÇÃO:**

| dólar | franquia que segura o custo | corte | margem |
|--:|:--|--:|--:|
| 6,00 | 130 / 320 / 500 | 0 % | 77,9 % |
| 8,00 | 98 / 240 / 375 | **25 %** | 77,9 % |
| 10,00 | 78 / 192 / 300 | **40 %** | 77,9 % |
| 12,00 | 65 / 160 / 250 | **50 %** | 77,9 % |

**A R$ 12 seria preciso reduzir a franquia a METADE para o custo não subir** — e a margem nem assim
melhora, porque o preço fica igual e as aulas caem. **Cortar metade da promessa para proteger 13 % da
receita não é um bom negócio.**

**3. E corta justamente o produto mais rentável.** Toda aula que sai da franquia é uma aula que ela
**pode vender a R$ 0,50** em vez de dar dentro do plano. Cortar o Avançado de 500 para 450 devolve
**R$ 3,60** de custo por mês e abre **50 aulas vendáveis a R$ 0,50 = R$ 25,00** de receita possível.
**Ganha 3,60 e abre a porta a 25,00.**

**4. E a receita por aula sobe — o que é uma perda, não um ganho.** Com o preço fixo, uma franquia
menor encarece a aula:

| plano | hoje | com −10 % | a aula fica |
|:--|--:|--:|--:|
| Básico | 130 → R$ 0,538 | 117 → **R$ 0,597** | +11 % |
| Intermediário | 320 → R$ 0,312 | 288 → **R$ 0,347** | +11 % |
| Avançado | 500 → R$ 0,280 | 450 → **R$ 0,311** | +11 % |

**O que REALMENTE reduz o custo, por ordem de ganho:**

| alavanca | o que poupa | custa o quê |
|:--|:--|:--|
| **a engenharia** | **R$ 43,63/mês** (36 % do custo) | nada a ninguém — não é promessa |
| **o agrupamento dentro do acto** | **10 min por gesto → 2** (ver §14) | desenho e código |
| o gratuito | já em uso | — |
| **cortar aulas** | **R$ 0,94 / 2,30 / 3,60** por 10 % | 13 / 32 / 50 aulas de promessa |

### 13.6 A política de multa e juros — a das contas de consumo

> «A gente vai adotar a mesma política de multa e juros que tem em um serviço como, por exemplo,
> conta de água, conta de luz, que eu acho que são os mais básicos, os mais baixos também que tem no
> mercado.»

**A política foi pesquisada e verificada, e é esta:**

| componente | valor | norma |
|:--|:--|:--|
| **Multa de mora** | **2 %** sobre o valor da fatura, **uma vez** | **CDC art. 52, §1º** («não poderão ser superiores a dois por cento do valor da prestação») e **REN ANEEL nº 1.000/2021, art. 343, §1º** («no percentual de até 2 %») |
| **Juros de mora** | **1 % ao mês, pro rata die** | **REN ANEEL 1.000/2021, art. 343, *caput*** |
| **Carência** | **nenhuma** | nem a REN nem o CDC dão dias de graça |
| **Tolerância** | vencimento em sábado, domingo ou feriado + pagamento no 1.º dia útil = **não é atraso** | **art. 343, §3º** |
| **Base de cálculo** | o valor da fatura, **sem** multa e juros anteriores | **art. 343, §2º, III** |

**O exemplo que fecha a conta — R$ 100,00 com 30 dias de atraso:**

| item | conta | valor |
|:--|:--|--:|
| multa | 2 % × 100 | **R$ 2,00** |
| juros | (1 % ÷ 30) × 30 = 1 % × 100 | **R$ 1,00** |
| **total** | | **R$ 103,00** |

**E é este o número que a casa aplica** — conferido por
[`provar-a-mora.js`](experimentos/provar-a-mora.js), 24 asserções, com o controlo de que a 60 dias a
multa é a mesma e os juros dobram.

**Onde está implementado.** Em `motor/nucleo/mensalidades.js` (`encargos`), ligado ao extrato: cada
mês vencido leva os seus encargos, o extrato soma `totalEmMoraCentavos` e `encargosEmMoraCentavos`
separados, e o monitor conta a mora dentro da dívida (`moraTotalCentavos`) e ao lado dela. Um mês
**pago** não tem encargos — o atraso foi resolvido no acto do pagamento, e cobrá-lo outra vez seria
cobrar duas vezes a mesma mora.

**O que NÃO se aplica, e porquê.** A REN manda atualizar pelo **IPCA**; aqui **não se aplica**.
Buscar um índice oficial seria uma dependência externa que **falha em silêncio e muda o valor da
dívida sem ninguém saber** — o mesmo raciocínio que fez o câmbio do painel ser *declarado*
(`CAMBIO_USD_BRL`) em vez de descoberto. O campo `correcaoAplicada: false` existe em cada conta para
que a omissão seja **dita**, e para o dia em que houver um índice lido de fonte datada.

**E o que a mora NÃO é: não é a consequência do atraso.** A escada da inadimplência é outra — avisar,
desabilitar aos 1 mês, expurgar aos 3 (§7.3 do [`PLANO-CONTADOR-DE-AULAS.md`](PLANO-CONTADOR-DE-AULAS.md)).
Multa e juros são o **preço** do atraso, e não o castigo dele.

**Uma lacuna declarada, e é de fonte.** A conta de **luz** tem norma federal (a REN acima). A de
**água** não tem: os percentuais vêm do contrato de cada operador e da norma do regulador
estadual, e **reproduzem na prática o mesmo 2 % + 1 %**. A afirmação «água = 2 % + 1 %» está
sustentada pelo **CDC art. 52, §1º** e pelo padrão contratual do setor, **não** por uma resolução de
regulador estadual lida nesta sessão. Como os dois números são os mesmos, a política não muda; o que
muda é a força da citação, e isso fica dito.

### 13.7 O que se aplicou no sistema

| onde | o que |
|:--|:--|
| `biblioteca/comercial/planos.json` | as franquias passam a **130 / 320 / 500**; a nota dos pacotes passa a citar os pontos de viragem novos (190 e 400) |
| `motor/nucleo/monitoramento.js` | `projectarAulas` — a cota em **aulas**, o custo às duas câmbios, e a frase que diz onde a conta sai do zero; a cota entra no **pior indicador** do retrato |
| `motor/servidor/painel-html.js` | o bloco **«As aulas — a cota que decide»**, primeiro na aba do consumo; os encargos de mora na linha do mês e o total em mora no cartão do Financeiro |
| `motor/nucleo/mensalidades.js` | `encargos`, `MULTA_DE_MORA`, `JUROS_AO_MES`; encargos por mês, totais em mora, e a política que viaja com o extrato |
| `experimentos/provar-a-cota-em-aulas.js` | **novo** — 27 asserções, com o controlo de que sem a cota em aulas o retrato dava «folga» |
| `experimentos/provar-a-mora.js` | **novo** — 24 asserções, com o controlo da multa única e dos juros que correm |

**O Financeiro passou a mostrar as franquias novas sozinho**, sem uma linha de código: ele lê o
catálogo (`catalogoDaPagina`), e o catálogo é a única fonte do preço e da franquia. É a razão pela
qual o `planos.json` foi mudado em vez de os ecrãs.

---

## 14. O §7.1 não está feito — e nesta operação não ajudaria *(25/11/2026)*

> «Você me disse que para solucionar caso o dólar aumente o preço, a opção melhor é a de engenharia. E
> aí você diz que precisa agrupar as gerações, que isso corta a fatura pela metade. Mas eu te
> pergunto, isso já não foi feito? Eu acho que já. Por isso que eu propus a franquia ser diminuída,
> porque eu acho que essa solução de agrupar as gerações já está implementada. Você precisa medir
> isso.»
> — a proprietária, 25/11/2026

**A resposta é não, e a medição é de três ordens.**

### 14.1 O código não tem janela nenhuma

O `motor/servidor/disparar.js` faz **um `POST` imediato** ao `dispatches` do GitHub por cada pedido de
geração. Não há espera, não há atraso, não há agrupamento: o que existe é `dispararGeracao`, com o
`body` montado e a resposta devolvida. Um pedido, um disparo.

**O que ela pode estar a lembrar é de outra coisa, e é bom que se distinga:**

| o que existe | o que faz | não é |
|:--|:--|:--|
| `concurrency: gerar-ciclo-<prof>-<ciclo>-<variante>` com `cancel-in-progress: false` | **serializa** — duas gerações do mesmo pacote não correm juntas, para não o sobrescreverem | não funde, não adia, não junta. O comentário do próprio ficheiro diz o que é: «duas disparadas juntas sobrescreveriam o mesmo pacote» |
| `concurrency` do `derivados.yml`, com `cancel-in-progress: true` | **cancela o pendente** — a derivação é idempotente, e a última árvore ganha | cancela, e a factura arredonda ao minuto: um cancelado paga-se |
| a consolidação do `derivados.yml` num só job *(16/11/2026)* | um job em vez de vários | é consolidação de **jobs**, não de **execuções** |

### 14.2 O que se mediu nos runs

Sobre as execuções reais do repositório:

| o que | medido |
|:--|--:|
| `Gerar o ciclo`, total na janela | **71** |
| …concluídas com sucesso | 57 |
| …**canceladas** | **4 (5,6 %)** |
| intervalo entre execuções da mesma variante | **0 minutos** em 12 de 12 pares medidos |

**5,6 % de cancelamentos não é agrupamento — é o efeito de borda da fila.** E os intervalos de
«0 minutos» são o mesmo acto a disparar duas vezes, não dois lançamentos distintos: os pares medidos
estão a **12–15 segundos** um do outro (18:08:37 e 18:08:49; 18:31:11 e 18:31:25; 22:55:17 e
22:55:31; 11:49:08 e 11:49:23).

### 14.3 E o número que importa: nesta operação o agrupamento não pouparia nada

**§7.1 foi escrito para outro cenário** — «dez aulas lançadas seguidas disparam dez gerações». Isso é
verdade quando dez aulas são lançadas em rajada. **Na operação dela, não são:** 16 aulas por dia, uma
por hora, e uma geração demora **40 a 50 segundos**. **A geração anterior termina 59 minutos antes de
a seguinte ser pedida.** Não há nada para agrupar.

> **A correcção que eu devo:** quando disse que «o §7.1 corta a factura a metade», estava a aplicar
> ao cenário dela um ganho medido noutro. **Numa operação de hora a hora, agrupar gerações salva
> zero.** A afirmação estava errada, e a senhora tinha razão em desconfiar.

**O que a medição encontrou em vez disso — e é maior:** um único acto dispara **2 a 4 gerações** e
**1 a 7 derivações**. Medido nos 5 minutos seguintes a cada geração:

| acto | `Gerar` | `derivados` | total facturado |
|:--|--:|--:|--:|
| um acto simples | 1 | 0–1 | **1–2 min** |
| conclusão do elenco | **4** | **6–7** | **10 min** |

**Um gesto de trinta segundos custa dez minutos.** Não é o agrupamento entre aulas que falta — é o
**agrupamento dentro do acto**: cada gravação pede a geração, e cada geração escreve em
`professores/**`, que dispara a derivação outra vez. **É essa a alavanca que existe**, e é a que
substitui o §7.1 nesta operação.

**E a conta que fica:** numa aula isolada, **2 min** (1 `Gerar` + 1 `derivados`). É exactamente o
número em que a §12 se apoia — 2,0 minutos por aula —, e é a confirmação de que esse número está
certo para o caso dela.

### 14.4 A consequência para a alavanca de socorro

A ordem que a §12.8 escreveu **muda**, e a segunda posição passa a ser outra:

| antes | agora |
|:--|:--|
| 1. a engenharia | 1. a engenharia — **continua a primeira** (R$ 43,63/mês, 36 % do custo) |
| 2. ~~o §7.1~~ | 2. **o agrupamento DENTRO do acto** — 10 min por gesto para 2, e é ele que existe |
| 3. cortar aulas | 3. cortar aulas — **continua a última**, e a §13.5 mostra porquê |

**O que continua verdade, e é o que ela precisa de ouvir:** cortar aulas é a alavanca mais fraca, e a
razão **não** dependia do §7.1. A aula custa sete centavos; o custo é 13 % da receita no Básico; e a
R$ 12 seria preciso cortar a franquia **a metade** para o custo não subir. **A conclusão de que não se
corta a franquia mantém-se inteira** — muda só a alternativa que se lhe oferece.

---

## 15. O ponto de migração da escola — o aviso no monitoramento *(25/11/2026)*

> «A gente vai fazer essa implementação que avisa para mim lá no danca.padd.com.br na parte que a
> gente lida com o monitoramento. É ali que você vai me dizer quando vale a pena então migrar. É o
> ponto de migração da escola. E aí que eu vou pedir para o consultor entrar em contato e aí ele ganha
> uma grana e presta essa consultoria e mantém a escola viva.»
> — a proprietária, 25/11/2026

### 15.1 A conta, e o que a define

Uma escola que cresce tem duas saídas: **comprar extensão** a R$ 0,50 por aula, ou **subir de plano** e
pagar a diferença da mensalidade. A partir de um certo número de aulas a segunda fica mais barata:
**esse número é o ponto de viragem.**

```
viragem = franquia do plano + (preço do plano de cima − preço do plano) ÷ preço da extensão
```

| degrau | ponto de viragem | por semana | por dia |
|:--|--:|--:|--:|
| **Básico → Intermediário** | **190 aulas/mês** | 43,8 | 7,3 |
| **Intermediário → Avançado** | **400 aulas/mês** | 92,3 | 15,4 |

**No ponto, a escola paga exactamente o preço do plano de cima — e recebe menos aulas:**

| degrau | paga | e leva | no plano de cima levaria | **deixa de receber** |
|:--|--:|--:|--:|--:|
| Básico → Intermediário | **R$ 99,90** | 190 | **320** | **130 aulas** |
| Intermediário → Avançado | **R$ 139,90** | 400 | **500** | **100 aulas** |

**E acima do ponto o dinheiro começa a correr.** A 230 aulas no Básico, a escola paga **R$ 119,90** —
**R$ 20,00 a mais por mês** do que pagaria no Intermediário, que lhe daria 320 aulas.

### 15.2 A distinção que a prova obrigou a fazer

A primeira versão media a perda pelas **aulas**: «paga 130 aulas a menos». A prova reprovou-a, e com
razão:

| aulas/mês no Básico | paga | economia se migrasse | aulas «que paga sem receber» |
|--:|--:|--:|--:|
| 150 | R$ 79,90 | R$ 0,00 | — (folga) |
| **190 (o ponto)** | R$ 99,90 | **R$ 0,00** | **130** |
| 230 | R$ 119,90 | **R$ 20,00** | 90 |
| 300 | R$ 154,90 | **R$ 55,00** | 20 |

**As duas grandezas andam em sentidos opostos.** O dinheiro perdido **cresce** com o crescimento; as
aulas «que paga e não recebe» **encolhem** — porque a escola se aproxima da franquia do plano de cima.
Dizer «paga 90 aulas a menos» a quem está a 230 de 320 é verdade e é inútil.

> **A regra que ficou: o dinheiro mede a perda, as aulas descrevem a distância.** E, no próprio ponto,
> a economia é **zero** — ela paga exactamente o preço do plano de cima. É o que faz do ponto um
> ponto, e é a leitura honesta: no dia em que lá chega, ainda não perdeu nada; é dali para cima que
> perde.

### 15.3 Onde vive, e o que não é

**Na aba da receita do monitoramento**, e **não** na aba «A migração» — aquela é a **dos fornecedores**
(GitHub, Cloudflare, Resend), que só gasta; esta é a **das escolas**, que rende. **Duas palavras iguais
para duas coisas opostas**, e por isso o bloco **começa por dizer que não é a outra**.

**E não tem botão de migrar.** Mudar o plano de uma escola é uma decisão comercial com contrato
— e o que ela pediu foi a **lista para telefonar**, não um clique. A ação é «migrar» (o selo), e o
telefone é o do consultor.

**As três listas que o bloco dá:**

| lista | quem entra | o que se faz |
|:--|:--|:--|
| **migrar** | no ponto ou acima | telefonar — paga o mesmo ou mais e recebe menos |
| **a chegar** | acima de 80 % do ponto | ainda não compensa; vigiar |
| **sem degrau** | o Avançado acima da franquia | conversa à mão — não há plano acima, e **calá-la deixaria a maior escola sem resposta** |

**O número que decide é o medido quando existe, e o contratado quando não** — e o bloco **diz qual
está a usar**. Enquanto o contador de aulas do mês não existir, é a franquia contratada (plano +
pacotes), que é o **tecto**: uma escola que comprou pacotes até passar do ponto **já está a pagar a
mais**, mesmo sem se contar uma única aula.

### 15.4 Onde está implementado

| onde | o quê |
|:--|:--|
| `motor/nucleo/monitoramento.js` | `pontosDeMigracao` (a escada e o preço da extensão vêm do **catálogo**), `escolasParaMigrar`, e a entrada no `retrato` |
| `motor/servidor/painel-html.js` | `blocoDaMigracaoDasEscolas`, na aba da receita, **depois** da inadimplência: a ordem é a do dinheiro — a receita diz o tamanho, a inadimplência diz quem está fora dele, e esta diz quem devia pagar mais e não está |
| `motor/servidor/raiz.js` | calculado do **mesmo `extrato`** que a receita e a inadimplência já leem — uma segunda leitura dos contratos daria uma segunda lista de quem contactar |
| `experimentos/provar-o-ponto-de-migracao.js` | **novo** — 34 asserções, com os controlos dos dois lados da fronteira, do topo que não pode ser calado, e do dinheiro que cresce enquanto as aulas encolhem |

---

## 16. O monitoramento lento: duas causas, e uma delas ela não podia ver *(25/11/2026)*

> «Quando eu entro aqui em danca.pdd.com.br/monitoramento, a API demora muito tempo para carregar. E
> eu tenho a impressão que isso acontece porque a consulta está sem critério. Os planos se renovam a
> cada 30 dias, então a consulta precisa ser só do mês corrente. Tanto para o Cloudflare, não sei se
> está sendo feito também, quanto para o workflow do GitHub, quanto para o do envio de e-mails.»

A hipótese dela estava **meio certa**, e vale separar as metades — porque uma delas já estava
resolvida desde 17/11/2026 e a outra não, e a terceira ela não podia ver.

### 16.1 O que já estava certo

A janela **já era o ciclo**: começa no dia 1 e vai até hoje (`primeiroDoMes`), e não é uma janela
rolante de 30 dias. Isso foi decidido em 17/11/2026, quando o painel dizia 3.623 min de uma cota em
que a factura dizia 1.930 — medir 30 dias rolantes e comparar com um tecto mensal compara duas coisas
que não se somam. **A parte «só do mês corrente» do pedido já estava feita.**

O `Resend` também já era mensal **e** diário (`resumirCorreio`), e o `Cloudflare` não tem cota de
operações exposta a este Worker — o painel diz isso em vez de mostrar um zero com cara de medição.

### 16.2 A causa que faltava: a paginação sem critério

O corte do mês era aplicado **depois** de a lista vir. Lia-se a lista de execuções do repositório,
página a página, e deitava-se fora o que fosse de outro mês — pagando 26 páginas para guardar 11.

| | páginas | execuções lidas | tempo |
|:--|--:|--:|--:|
| lista sem filtro, a paginar até ao fim | 26 | 2 600 | **97,8 s** |
| `created=>=2026-11-01` no pedido | 11 | 1 000 | **54,7 s** |

*(medido neste repositório, com `curl`, em 25/11/2026 — a coluna do tempo é a soma dos pedidos em
série, que é como o Worker os faz.)*

O filtro passou a ir **no URL**: `created=>=AAAA-MM-01`. Duas consequências que ficaram declaradas no
código, porque as duas enganam quem não as souber:

- **`total_count` devolve ZERO** quando o `created` vai no pedido. Não se lê como «não há execuções»;
  o número que serve é o `runs.length`.
- **As listagens filtradas do GitHub param em 1 000 resultados** (10 páginas de 100). Num mês com
  mais de mil execuções a janela fica **truncada**, e o `truncado` di-lo. Apresentar mil como se
  fosse o mês é a mesma mentira que o resto do painel existe para evitar.

O tecto de páginas da rota desceu de 30 para **10**, que é onde o filtro para — pedir a 30ª página
de uma listagem filtrada é pedir uma página que não existe.

### 16.3 A causa maior, e a que ela não podia nomear: a janela não tinha cache

O painel já tinha cache para os **jobs** de cada execução (`medidos`), para as chaves de **KV**
(`chaves`), para a **factura** e para a **visibilidade**. Não tinha para a **lista de execuções** —
a coisa mais cara das quatro, porque é a única que se paga em **páginas**, e não em pedidos soltos.

Consequência: **cada abertura do painel relia o mês de fábrica.** Onze pedidos em série, sempre,
mesmo que a página fosse aberta duas vezes no mesmo minuto.

O que passou a haver, e o que ela guarda sem mentir:

- a **lista** dos runs do mês, com o `lidoEm` — prazo de **2 minutos**;
- **`truncado` também se guarda**, senão a abertura seguinte apresentaria uma janela incompleta como
  completa;
- **uma leitura falhada não se guarda** — guardá-la faria o painel dizer «sem execuções» durante dois
  minutos depois de uma falha de rede;
- **o mês entra na validade**: uma janela guardada em Outubro não serve em Novembro;
- **o `ok` é restituído** ao objecto que vem do KV. Um objecto guardado não traz esse campo, e sem
  isto o painel passaria a dizer «a janela falhou» sobre uma leitura que correu bem. *Um campo que
  falta não é um «não».*

### 16.4 A conta dos subpedidos, corrigida

O comentário do orçamento dizia `30 páginas + 12 medições + 2 de KV + 1 de listagem = 45` de 50. Era
verdade antes do filtro. Agora:

| abertura | páginas de runs | medições | KV | listagem | **total** |
|:--|--:|--:|--:|--:|--:|
| **fria** (primeira, ou passados 2 min) | 11 | 12 | 2 | 1 | **26** |
| **quente** (dentro dos 2 min) | 0 | 12 | 2 | 1 | **15** |

Mais 1 ou 2 para a factura e a conferência, que são de 6 em 6 horas. Uma conta de orçamento que
envelhece é uma conta que deixa de avisar — e foi por isso que ela passou a estar escrita com as
parcelas de hoje.

As 12 medições continuam a acontecer em cada abertura, e é de propósito: medir os jobs de um run é o
que calibra o custo por fluxo, e cada abertura acrescenta 12 execuções medidas. Não é preciso medir
2.810 para saber quanto 2.810 custam — mas é preciso continuar a medir algumas.

### 16.5 A medida de ponta a ponta, e o que ela vale

A rota correu em processo, com um GitHub de mentira que conta os pedidos e um KV em memória que
**persiste entre as aberturas**:

| abertura | páginas de runs | medições | outros | `janelaDaCache` |
|:--|--:|--:|--:|:--|
| 1 (fria) | **11** | 12 | 3 | `false` |
| 2 (quente) | **0** | 12 | 2 | `true` |
| 3 (quente) | **0** | 12 | 2 | `true` |

Onze pedidos a menos por abertura, e é isso que o número de rede mede: a **2,87 s por página**,
derivado dos dois pontos acima (15 páginas a menos, 43,1 s a menos), a segunda abertura poupa cerca de
**32 s** — *derivado, não medido*, porque o tempo de rede não se mede contra um GitHub de mentira.

O que **está** medido é a contagem de pedidos, e é ela que a prova afirma.

### 16.6 O que ficou dito na página

Um número em cache sem a sua idade engana. O retrato leva `janelaDaCache` e `janelaLidaEm`, e a
página escreve-os: *«As execuções do mês são as de 25/11/2026 às 08:58 — relidas a cada dois
minutos.»* Quando a janela vem fresca, não se diz nada — dizer «agora» em cada abertura é ruído. E
`janelaDaCache` é `null` e não `false` quando não se sabe: um campo que falta não é um «não».

### 16.7 O que mudou

| ficheiro | o quê |
|:--|:--|
| `motor/servidor/leitura-do-monitor.js` | `created=>=AAAA-MM-01` no URL de `runsDoGithub`; o tecto de 1 000 declarado em `truncado` |
| `motor/servidor/raiz.js` | `CACHE_DA_JANELA_MS` (2 min) com validade por mês, `truncado` e `ok` guardados, leitura falhada não guardada; tecto de páginas 30 → 10; a conta dos subpedidos corrigida |
| `motor/nucleo/monitoramento.js` | `janelaDaCache` e `janelaLidaEm` no `retrato`, `null` quando não se sabe |
| `motor/servidor/painel-html.js` | a idade da janela escrita no cabeçalho do monitoramento, só quando veio da cache |
| `experimentos/provar-a-velocidade-do-monitoramento.js` | **novo** — 26 asserções, com os dois controlos negativos |

### 16.8 O controlo negativo, e o defeito que ele apanhou

A prova simula a cache e tem de provar que ela **se recusa** a servir: passados três minutos, volta a
pagar; e uma janela de outro mês não serve. Na primeira execução, os dois controlos passaram **sem
medir nada** — o prazo era lido com `Number('2 * 60 * 1000')`, que dá `NaN`, e `qualquer coisa > NaN`
é sempre falso, ou seja, a cache **nunca caducava**.

É a mesma família de erro que o `.every` sobre uma leitura vazia: uma validação que não mede nada não
falha. A prova passou a ler o prazo como **expressão** (multiplicando as parcelas) e a afirmar que ele
é finito antes de o usar.

---

## 17. O agrupamento dentro do ato — quatro commits, um *(25/11/2026)*

> «Agora eu entendi a sua proposta e ela faz sentido. Essa medição que encontrou coisa maior, o
> único ato dispara dois a quatro gerações e uma a sete derivações, que a gente acaba gastando
> muito. Então vamos fazer essa solução que você aponta aqui. O agrupamento que falta é dentro do
> ato e não dentro das aulas. Então vamos fazer esse ponto para economizar ainda mais. É importante
> que isso não estrague nada do que está funcionando.»

### 17.1 A medida, e ela é pior do que «2 a 4»

Os runs de 23 e 24/11, lidos na API:

| | |
|:--|--:|
| execuções do «Fechar os derivados» | **21** |
| delas, **canceladas** | **7** |
| duração somada dos jobs | **274 s = 4,6 min** |
| **facturado** (cada job arredonda ao minuto) | **21 min** |
| **desperdício** | **4,6×** |

As sete canceladas duraram **22 segundos ao todo** — 2 s, 2 s, 3 s, 3 s, 10 s, 1 s, 1 s — e
custaram **sete minutos**. Um job cancelado paga-se: o GitHub arredonda ao minuto o que correu, não
o que foi útil.

### 17.2 O ato, commit a commit

Lido no `main`, o «Guardar» das 11:11:53 às 11:12:30 de 24/11:

| instante | commit | ficheiros |
|:--|:--|--:|
| 11:11:53 | `feat(acervo): envelope/.indice.json` | **1** |
| 11:11:54 | `feat(acervo): envelope/plano-….json` | **1** |
| 11:11:59 | `feat(plano): o plano elicitado vira a fonte` | — |
| 11:12:01 | `feat(ciclo): o manifesto da variante…` | **1** |
| 11:12:30 | `chore(estrutura): fechar os derivados` | — |

**Quatro pushes em nove segundos, quatro execuções do `derivados.yml`, três canceladas.** E o
segundo ato, das 11:15:38: três pushes, duas canceladas.

O escritor das fontes **já estava resolvido** desde 22/10/2026 (`gravarArquivosNumCommit`, dez
ficheiros num commit). O que faltava eram os **três pequenos**: o índice de envelopes, o envelope, e
o `.conf`.

### 17.3 A causa, e não é o CI

Cada uma dessas três escritas é um `PUT /contents` — **um commit cada**, e o GitHub trata cada
commit como um push. O `derivados.yml` observa `escola/**` e `professores/**`, e por isso acorda
três vezes para o que devia acordar uma.

E o custo não é só o CI. `gravarArquivosNumCommit` gasta **cinco subpedidos** por commit — a
referência, o commit, a árvore, o commit novo, a referência nova. Quatro commits são **vinte
subpedidos** num orçamento de **cinquenta** por invocação do Worker. Um commit são cinco, e o
pedido volta a ter folga. Foi essa a conta que já tinha estourado o «Guardar» a 08/11/2026.

### 17.4 O desenho: um lote, e o caminho de sempre por baixo

`acervo-envelopes.js` ganhou um **lote**: `abrirLote()`, `fecharLote(mensagem)`, `emLote()`. Dentro
dele, `guardar`/`criar` **acumulam** e `ler` vê o que está pendente; `fecharLote` aplica tudo com
**um** commit, pela mesma `gravarArquivosNumCommit` que o escritor do ciclo já usava.

Cinco decisões que o desenho fixa, e as cinco estão na prova:

- **SEM LOTE NADA MUDA.** O lote é *opt-in*: quem não o abre fica exactamente como estava. É a
  resposta directa ao «não estrague nada do que está funcionando» — e o controlo negativo da prova
  mede-o (sem lote, dois commits).
- **O `criado` pergunta-se ANTES de guardar.** Escrito ao contrário — a olhar o lote já com a chave
  dentro —, todo o envelope novo passava por edição. Foi o primeiro defeito desta implementação.
- **O lote vazio não faz commit.** Quem só leu não escreve, e `nada: true` di-lo.
- **O apagar FECHA o lote primeiro.** O commit único sabe criar e substituir; apagar é uma entrada
  de `sha: null`, que ele não faz. Ensiná-lo seria mais uma peça no caminho que está verde; fechar
  antes é a resposta conservadora.
- **DEGRADA, NÃO REBENTA.** E esta nasceu de uma regressão apanhada por outra prova
  (`provar-escola-do-documento`): um `fetchImpl` que só conhece `/contents/` e a árvore — o das
  bancadas — não fala a API de Git do commit único. Sem saída, **o ato deixava de gravar**. Um ganho
  de cota não pode custar a gravação: se o commit único falhar, as escritas do lote são refeitas
  **uma a uma**, pelo mesmo `escrever` de sempre, e a resposta diz `degradado: true` com o motivo.

### 17.5 Onde ele entra

Em `elicitar` (`motor/nucleo/porta.js`), que é a fronteira do pedido: aqui começa a gravação de um
documento e aqui se sabe quando acabou. Abrir mais acima seria abrir em quem só lê; abrir dentro do
`gravarEnvelope` seria abrir em cada tentativa do carimbo — e três tentativas fariam três lotes.

E o `ok` que vem do lote é **o do commit**, não o da promessa: se o fecho falhar, a gravação passa
a `ok: false` com o motivo. Um registo que a tela anuncia como guardado e o repositório não tem é o
pior dos estados — é a mesma guarda que o `escrever-ciclo` já aplica do lado do ciclo.

### 17.6 O que fica fora, e é dito

- **O `.conf` continua num commit próprio.** Ele é escrito por `escrever-plano.js`, antes de o
  acervo entrar; juntá-lo exigiria a fila ao nível da rota, que atravessa três módulos. O corte
  feito é de **quatro para três** neste ponto — e o ganho medido abaixo não o conta.
- **A geração do ciclo (`gerar-ciclo.yml`) continua a ser uma por ato.** É a única que faz trabalho
  real sobre o pacote, e o commit dela já vai agrupado desde 22/10/2026.
- **O `publicar.yml` dispara no mesmo push.** Ele não observa `escola/**`, e por isso os envelopes
  não o acordam; os commits em `professores/**/ciclos/` acordam-no, e aí o ganho vem de graça com o
  mesmo corte.

### 17.7 A prova

`experimentos/provar-o-ato-num-commit.js` — **30 asserções**, com o GitHub de mentira a contar
commits. As secções: sem lote dois commits (o controlo negativo); com lote um; o pendente visível;
o `criado` antes; o lote vazio; o duplo falhanço a não anunciar nada; o apagar a fechar antes; e a
degradação sem API de Git.

**Ela é vermelha sem a mudança e verde com ela** — conferido com `git stash`.

E a regressão que a mudança quase causou — `provar-escola-do-documento` a passar de 8/8 para 7/8 —
foi o que produziu o `degradado`. Fica escrito porque é a lição: uma optimização de cota que corre
em bancadas com `fetchImpl` falso tem de saber o que fazer quando esse falso é mais pobre do que o
GitHub.

### 17.8 O que mudou

| ficheiro | o quê |
|:--|:--|
| `motor/servidor/acervo-envelopes.js` | `abrirLote`/`fecharLote`/`emLote`; `escrever`/`criar` acumulam; `conteudo` vê o pendente; `apagar` fecha o lote antes; degradação um-a-um |
| `motor/nucleo/porta.js` | `elicitar` abre o lote no início e fecha-o antes do `return`; o `ok` do commit manda no `gravado`; a resposta diz `commitDoLote`/`escritasDoLote` |
| `experimentos/provar-o-ato-num-commit.js` | **novo** — 30 asserções |

---

## 18. O `.conf` não compensa; os schemas compensavam muito *(25/11/2026)*

A pergunta dela, e a resposta vem em duas metades: **uma delas é não**, e a outra é um achado que
muda a conta.

> «Aí você tem que me dizer se der para economizar também com isso, a gente economiza, senão deixa
> assim.»

### 18.1 O `.conf`: não compensa, e o motivo é medido

O `.conf` é escrito por `escrever-plano.js` (`atualizarManifesto`) **antes** de o acervo entrar, e
num ponto do fluxo em que não há lote aberto — o acervo só é tocado depois. Juntá-lo exigiria
levantar a fila ao nível da rota, atravessando três módulos (`rotas.js` → `escrever-plano.js` →
`porta.js`), com o `escritor` a devolver as escritas que quer ver juntadas e o chamador a compô-las.

E o ganho seria **um commit**, não quatro. **Não compensa**, e a razão de não compensar está medida
abaixo: o que sobra depois do lote do acervo é pequeno, e o que era grande era outra coisa.

### 18.2 O achado: 109 commits de schema, cinco por pasta

O histórico, contado com `git log --all --grep='feat(schema)'`:

| | |
|:--|--:|
| commits `feat(schema): os schemas do ciclo na pasta de …` | **109** |
| pastas de professor com **exactamente cinco** | **20** |

`garantirSchemasDoCiclo` percorria os cinco sufixos (`schema`, `po-schema`, `plano-schema`,
`aula-schema`, `captura-schema`) e fazia **um `PUT /contents` por cada** — cinco commits, cinco
pushes, cinco execuções do `derivados.yml`, que observa `professores/**`. Cada execução custa **1
minuto** (o job arredonda ao minuto) e o `cancel-in-progress` mata as quatro seguintes — **e um job
cancelado paga-se**.

**20 atos × 4 commits a mais = 80 minutos** de CI gastos a escrever cinco ficheiros para a mesma
pasta, no mesmo segundo. E acontece de novo em cada professor × ciclo novo.

### 18.3 O que mudou

Os `GET` continuam um por schema — só se escreve o que **falta**, e um schema existente é do
professor. As escritas é que passaram a ir num `gravarArquivosNumCommit` só. E **degrada**: se o
adaptador não falar a API de Git (as bancadas com `fetchImpl` falso), volta-se ao `PUT` por
ficheiro, que é o que sempre valeu. Nada muda na ordem que importa: os schemas continuam a existir
antes da fonte.

### 18.4 A prova

`experimentos/provar-schemas-do-professor.js` — a secção **D** é a nova, e tem os dois lados: um
repositório de mentira que **fala as cinco rotas do Git** e conta os commits (**um**, com os cinco
ficheiros dentro, e **zero** `PUT`), e o `repoVirtual` de antes, que só conhece `/contents/` e
obriga à degradação (**cinco `PUT`, os cinco schemas entram na mesma**). Mais a segunda passagem,
que não reescreve nada nem faz um segundo commit.

**32 asserções**, todas verdes; e a secção D é vermelha sem a mudança (conferido com `git stash`:
4 de 32 falham, e a mensagem diz o que viu em vez de rebentar num `TypeError` — foi preciso
corrigir a prova para isso).

---

## 19. A analítica do Cloudflare — o número que faltava, e a frase que era falsa *(25/11/2026)*

> «Precisa habilitar no worker do Cloudflare a permissão de analítica para você poder fazer aqui um
> monitoramento dos pedidos que são feitos por dia no worker, a escrita de KV por dia e a leitura de
> KV por dia. Como é que eu faço isso?»

### 19.1 A resposta é: já está — e o painel dizia o contrário

Desde 17/11/2026 o `resumirCloudflare` declarava, em letra escrita:

> «a leitura de analítica exige um token do Cloudflare com permissão de analítica, **que este Worker
> não tem**»

**Medido a 25/11/2026, com o token que o Worker já tem: tem.** O secret `CLOUDFLARE_API_TOKEN` está
no Worker `danca`, e o token responde ao GraphQL. A sonda devolveu `kvOperationsAdaptiveGroups` com
2 615 leituras e 25 escritas de 23/11, e `workersInvocationsAdaptive` com os pedidos por script.

**Uma limitação declarada que é falsa é pior do que uma omissão.** Ela não é neutra: faz quem lê
desistir de pedir o número, e faz quem podia resolver acreditar que há algo a resolver. Foi a
proprietária que a desconfiou — e a desconfiança estava certa.

### 19.2 O que se mede, agora

| dia | pedidos | leituras KV | escritas KV | listagens | apagamentos |
|:--|--:|--:|--:|--:|--:|
| 18/11 | 2 482 | 10 032 | 114 (**11,4 %**) | 5 | 8 |
| 19/11 | 2 391 | 10 089 | 62 (6,2 %) | 3 | 8 |
| **20/11** | 2 962 | **12 804** | **234 (23,4 %)** | 2 | 8 |
| 21/11 | 2 029 | 6 630 | 50 (5,0 %) | 0 | 4 |
| 22/11 | 1 223 | 4 792 | 10 (1,0 %) | 26 | 6 |
| 23/11 | 819 | 2 615 | 25 (2,5 %) | 61 | 31 |
| 24/11 | 512 | 1 697 | 15 (1,5 %) | 11 | 5 |

*(percentagens sobre as cotas do plano gratuito; lidas em 25/11/2026. Por Worker, no período:
`lastro-teste` 9 844 pedidos, `danca` 2 574.)*

**A leitura que importa, e é uma correção de expectativa:** o recurso que aperta **não é o que
parecia**. Os pedidos estão a **0,5–3 %** de 100 000. As **escritas de KV** são o mais perto do tecto
— **23,4 %** em 20/11, e a cota é de **1 000 por dia**. As listagens, que já se sabiam caras, estão a
61 de 1 000.

### 19.3 Três decisões de desenho, e as três são de medição

**Uma consulta, não duas.** As duas famílias vivem debaixo de `viewer.accounts`, e cada chamada ao
GraphQL é **um subpedido** — o orçamento do Worker é de 50 por invocação e o painel já gasta 16 a 27.
Foi preciso verificar que uma consulta com os dois nós devolve os dois: devolve.

**A granularidade é o DIA, e isso foi medido contra a armadilha.** A primeira sonda agregou por
`datetime` (minuto) com `limit: 10000` sobre sete dias: **9 113 grupos num só dia com tráfego**, e um
tecto que corta **em silêncio**. A agregação por `date` dá **2 grupos por dia** (um por script) e
nenhum risco de corte. E confere: somados os dois modos no mesmo dia, **2 029 pelos dois lados,
diferença zero**. A agregação por minuto não foi posta de lado por ser mais fina — foi posta de lado
por ter um tecto que mente.

**O alerta lê o PICO, não o hoje.** A cota é diária e volta a zero à meia-noite UTC. Hoje às 0,5 %
não diz nada sobre o risco; o dia em que se escreveram 234 chaves diz tudo. E o pico é **estável** —
não oscila com a hora a que se abre o painel, ao contrário do número do dia. O hoje fica ao lado,
porque é a outra pergunta («como está agora?»). Na página, a barra é o pico e a linha de baixo diz
«hoje».

### 19.4 O que não se inventa

- **O zero de um dia sem tráfego é um facto**, e por isso entra a zero: a pergunta é «quantos pedidos
  houve» e a resposta é nenhum. É o oposto do zero de uma leitura falhada, que não se escreve.
- **O que falha é declarado, e nunca zerado.** Sem token; **403** (com a permissão nomeada — é o caso
  que a frase antiga descrevia); **`errors` no corpo com HTTP 200** (o GraphQL devolve assim, e ler só
  o `data` publicaria metade dos números como se fossem todos); rede a rebentar. Nos quatro,
  `ok: false` com motivo, e o painel volta a dizer que não mediu — agora com o **motivo da falha**.
- **Chegar ao tecto de 1 000 grupos faz do número um mínimo**, e diz-se na página.
- **Estes números são do fornecedor, não nossos.** Vêm de conjuntos com **amostragem adaptativa**: em
  volume baixo são exactos, em volume alto são extrapolações do Cloudflare. Está dito no painel, e é a
  diferença entre mostrar o número do fornecedor e apresentar uma segunda conta como se fosse igual.

### 19.5 A cache, e porquê 15 minutos

A cota é **diária**; o número muda de hora a hora, não de segundo a segundo. A janela de execuções do
GitHub ficou com 2 minutos porque um run novo entra a qualquer momento; esta ficou com **15**, porque
nada muda entre duas aberturas do painel. `0` subpedidos na segunda abertura, medido.

### 19.6 A prova

`experimentos/provar-a-analitica-do-cloudflare.js` — **43 asserções**, com um Cloudflare de mentira
que conta as chamadas e serve o que lhe mandarem. As sete secções, e as que mais importam:

- **B** — os dias sem tráfego entram a **zero**, e um dia que falta na resposta não é o mesmo que um
  dia com zero pedidos;
- **D** — as quatro falhas declaradas, com a permissão **nomeada** no 403;
- **E** — o pico a mandar no alerta, com o **controlo negativo**: olhando só o hoje, este parque dava
  «folga» com as escritas a 90 % no pico;
- **G** — o aviso do «não mede» **desaparece** quando se mede, e a frase falsa sobre a permissão não
  está na página; e **volta**, com o motivo da falha, quando não se mede.

**Vermelha sem a mudança** (conferido com `git stash -u`: rebenta por não achar o módulo).

E de ponta a ponta, pela rota verdadeira com a analítica **verdadeira** e o GitHub de mentira:
**fria 1 chamada ao GraphQL, quente 0**, com os sete dias, as cinco operações e os dois scripts — e o
**pior indicador da casa a ler 23,4 %**, que é a cota das escritas de KV.

### 19.7 O que mudou

| ficheiro | o quê |
|:--|:--|
| `motor/servidor/analitica-cloudflare.js` | **novo** — a consulta, o dia a dia, as quatro acções, o truncado e as falhas declaradas |
| `motor/nucleo/monitoramento.js` | `operacoesDoCloudflare`, `resumirCloudflare` com `analitica`, o motivo da falha no lugar da frase fixa, e `fraccaoOperacoes` no pior indicador |
| `motor/servidor/raiz.js` | a leitura com cache de 15 minutos (`CACHE_DA_ANALITICA_MS`), 1 subpedido, e a conta do orçamento corrigida para 27/16 |
| `motor/servidor/painel-html.js` | `blocoDasOperacoes` — cinco barras (o pico), a tabela dos dias, os Workers, o truncado e a nota da amostragem |
| `experimentos/provar-a-analitica-do-cloudflare.js` | **novo** — 43 asserções |

---

## 20. O custo por aula, medido — e o modelo `2a` estava optimista *(25/11/2026)*

> «Eu acho que o nosso cenário de custo melhorou. Então eu preciso que você atualize esse documento.»

**Melhorou, e está medido.** Mas ao medir apareceu uma coisa que o documento tinha por baixo: **o
modelo `m = 2a` conta só a geração, e uma aula não é uma geração.** É a correcção que este capítulo
traz.

### 20.1 A factura real de Novembro

| | |
|:--|--:|
| minutos facturados (`quantity`) | **2 511 min** |
| valor bruto (`grossAmount`) | **$15,07** |
| desconto (`discountAmount`) | **$15,07** |
| **a pagar (`netAmount`)** | **$0,00** |

Um mês de uso intenso — 1 000 execuções entre 15 e 24/11, com o desenvolvimento inteiro em cima —
**caberia na franquia de $12 mesmo sem o desconto de conta pública**. E com o desconto, sobram $0,40.

### 20.2 A descoberta: **todos os jobs estão abaixo de 60 segundos**

Medido em 16 execuções, duas por workflow:

| workflow | duração medida | facturado |
|:--|--:|--:|
| **Gerar o ciclo** | 14 s · 31 s · 35 s · 42 s · 43 s | **1 min** |
| Fechar os derivados | 2 s · 10 s · 13 s · 15 s · 21 s · 27 s | **1 min** |
| Publicar o sistema | 26 s · 27 s · 28 s · 32 s · 38 s · 40 s | **1 min** |
| Publicar as escolas (extinto) | — | 2 min (2 jobs) |

**Cada execução de hoje é UM job, e cada job arredonda a UM minuto.** O `p50` de 110 s que o §12
usava para a geração já não existe: o pandoc passou a binário estático e o job caiu para **14–43 s**.
A unidade do custo deixou de ser «dois minutos por geração» e passou a ser **«um minuto por
execução»** — o que torna o número de execuções a única coisa que importa.

### 20.3 E um acto não é uma execução

O «Guardar» do PO de 24/11 às 11:15, medido execução a execução:

| instante | execução | duração | facturado |
|:--|:--|--:|--:|
| 11:15:40 | Fechar os derivados | 4 s, **cancelada** | 1 min |
| 11:15:42 | Fechar os derivados | 16 s, **cancelada** | 1 min |
| 11:15:50 | Gerar o ciclo | 19 s | 1 min |
| 11:15:50 | Fechar os derivados | 30 s | 1 min |

**Quatro execuções, quatro minutos — e dois deles foram cancelados.** Um job cancelado paga-se: o
GitHub arredonda ao minuto o que correu, não o que foi útil.

E quando dois actos caem juntos — o plano e o PO, às 11:11 e às 11:15 — são **nove execuções, nove
minutos, cinco delas canceladas**.

**A causa é a mesma em todos: cada commit é um push, e cada push acorda o `derivados.yml`, que
observa `professores/**` e `escola/**`.** Uma gravação fazia quatro commits (índice, envelope,
`.conf`, fontes) e cada um pagava a sua execução.

### 20.4 A correcção do modelo, e o que as ondas de hoje valeram

| modelo | min por aula | 2 850 aulas/mês | custo a R$ 6 | margem de R$ 929,10 |
|:--|--:|--:|--:|--:|
| **o do documento (`2a`)** | 2 | 5 700 | R$ 133,20 | **85,7 %** |
| **medido ANTES das ondas (`4a`)** | 4 | 11 400 | R$ 338,40 | **63,6 %** |
| **medido DEPOIS das ondas (`3a`)** | 3 | 8 550 | R$ 235,80 | **74,6 %** |

**O que as ondas fizeram, então, não foi melhorar um cenário bom — foi recuperar 11 pontos de margem
que estavam a ser pagos sem ninguém ver (R$ 102,60 por mês, às nove escolas cheias).** E o documento
continua a ser optimista: o número honesto hoje é **R$ 235,80**, não R$ 133,20.

**E havia uma prova a dizer 3 minutos desde 19/11/2026** — `experimentos/provar-o-custo-da-aula.js`
—, enquanto este documento dizia 2. Mas ela acertava pelo motivo errado: afirmava `1 derivados + 2
geração`, e hoje é `2 derivados + 1 geração`. O total coincide (3) e a decomposição é oposta — a
geração **abaratou** (110 s → 14–43 s) e o derivados **encareceu** (1 → 2–3 execuções por gravação).
A prova passava pelo número certo com as parcelas trocadas, e é a mesma família de erro que a decisão
174 registou (`DOCS` que deixara de crescer). **Corrigida em 25/11/2026**: passa a afirmar os
**componentes**, um a um, e não só a soma.

A degradação que se recuperou, medida no histórico:

| o quê | antes | depois | o que valeu |
|:--|--:|--:|:--|
| commits do **acervo** por mês | **143** (72 `.indice` + 71 envelope) | 72 | **71 execuções**, ~R$ 12,80/mês |
| commits de **schema** por professor×ciclo | **5** (109 no histórico, 20 pastas) | 1 | **4 execuções** por ciclo novo |
| janela de execuções do monitoramento | 11 páginas por abertura | 0 na segunda | cotas do Cloudflare, não do GitHub |
| jobs da geração | 110 s p50 → 2 min | **14–43 s → 1 min** | metade da unidade |

### 20.5 O que ainda se pode cortar — e é a próxima alavanca

O que sobra num acto são **duas** execuções do `derivados.yml`, e uma delas é cancelada. Ambas
existem porque o commit do **pacote** (`professores/**/ciclos/ciclo-*/**`) cai na mesma lista de
`paths` que as fontes.

**Se o `derivados.yml` deixar de observar o pacote gerado** — ele não precisa: o pacote não muda
âncora nem índice, e quem o commita é o `gerar-ciclo.yml`, que já regera os índices no próprio commit
—, um acto passa a:

```
1 geração (1 min) + 1 derivados (1 min) = 2 min por aula
```

Ou seja: **de volta ao `2a` do documento, mas agora medido e não suposto.** Às nove escolas cheias
isso é **R$ 133,20 e 85,7 % de margem** — o cenário que ela achava que já tinha.

**Não foi feito hoje, e é de propósito:** é uma mudança em `paths` de um workflow que fecha os
derivados de tudo o que muda no repositório, e a regra é que um commit com o `GITHUB_TOKEN` não
redispara nada. Mexer nela sem prova pode deixar um derivado por fechar. Fica **declarada como a
alavanca seguinte**, com esta conta.

### 20.6 A margem com o consumo real

As escolas **não enchem a franquia** — o `breu-piano` tem 24 aulas previstas num ciclo e zero
lançadas. Com o custo medido de 3 min/aula:

| aulas/mês na conta | minutos | custo a R$ 6 | margem de R$ 929,10 |
|--:|--:|--:|--:|
| 500 | 1 500 | **R$ 0,00** | 100 % |
| **1 000** | **3 000** | **R$ 36,00** | **96,1 %** ← o fim do gratuito |
| 1 500 | 4 500 | R$ 90,00 | 90,3 % |
| 2 000 | 6 000 | R$ 144,00 | 84,5 % |
| 2 850 | 8 550 | R$ 235,80 | 74,6 % |
| 3 500 | 10 500 | R$ 306,00 | 67,1 % |

*(A tabela conta só as escolas. A engenharia — os commits de desenvolvimento, medidos em 522 min no
§L9f — soma 522 min e entra na mesma conta: às 2 850 aulas, 8 550 + 522 = 9 072 min, R$ 254,59.)*

**A fórmula corrigida** (`a` = aulas/mês, `c` = minutos por aula, medidos em 3):

```
minutos = c × a                                  (c = 3 medido · 2 se o derivados parar de seguir o pacote)
custo   = 0                                      se c·a ≤ 2 000
custo   = (c·a − 2 000) × 0,006 × 6              acima disso
```

### 20.7 O que fica decidido

**DECIDIDO:** o custo por aula é **3 minutos** (medido, 25/11/2026), e não os 2 que o §12 supunha. A
margem às nove escolas cheias é **74,6 %**, e sobe a **85,7 %** quando o `derivados.yml` deixar de
observar o pacote. **Não há prejuízo em nenhum cenário plausível** — o zero continua a exigir um
parque muito acima do que a operação real produz, e a factura de Novembro fechou em **$0,00**.

---

## 21. O custo da sala com faixas horárias — medido a 25/11/2026

**A pergunta dela:** «Essa solução que nós fizemos agora com a sala de aula, que tem horário, que a
gente ajustou, que ficou orgânica, agora ficou de fato como é no mundo real. Aumentou os nossos
custos. Precisa verificar isso também.»

**A resposta curta: aumentou, e não é uma regressão — é o modelo a passar a reflectir a realidade.**
Antes, uma sala só podia hospedar **uma** Turma; agora hospeda N. E o custo é exactamente o das N.

### 21.1 O que foi medido

| medida | antes das faixas | com as faixas | como se mediu |
|:--|--:|--:|:--|
| **alvos** da cadeia por alteração de Sala | 1 | **N** (N = Turmas na sala) | `criarCadeia` com uma sala de 1, 2 e 3 Turmas → **1, 2, 3 alvos** |
| pedidos de `/api/bastidores/perfil` ao abrir a Turma | 3 | **5** (com 3 faixas e 3 professores) | jsdom, contando `fetch`; sem a cache de `PERFIS` seriam **9** |
| duração e dias no `.conf` do ciclo | raiz (faixa 1) | **a faixa escolhida** | `provar-o-plano-da-faixa` |

**Um alvo = um plano + um PO + um pacote.** É a unidade de custo da cadeia, e ela é a mesma de
sempre: o que mudou é que uma sala com três aulas por dia tem **três** alvos, e não um.

### 21.2 Porque é que isto não é a conta a crescer sozinha

**O custo por aula não mudou.** A margem de 74,6 % (§20) é por ciclo gerado, e um ciclo continua a
custar o mesmo. O que mudou é o **número de ciclos que uma sala pode ter** — e esse número é a
estrutura real da escola, não uma escolha do código. Uma sala com três aulas por dia sempre foi três
aulas; antes o sistema obrigava a mentir (três salas com nomes diferentes para o mesmo espaço), e
agora não.

**O que impede a factura de disparar sem ninguém ver** é a guarda do ritmo: um alvo cuja faixa não
mudou fica em `feita` e **não gera** — só é conferido. Medido no código (`cadeia.js`: `ritmoMudou`
compara as respostas de hoje com as do documento), e é por isso que a correcção desta data importa
duas vezes: sem ela a guarda lia a raiz, **nunca** via a mudança de faixa, e um plano velho ficava
velho em silêncio, sem nem gerar nem avisar.

### 21.3 Onde o custo aparece de facto

1. **N alterações de Sala.** Mudar a hora de uma sala com três Turmas percorre **três** alvos. Se a
   mudança for só numa faixa, os outros dois são conferidos e dados por `feita` — custam a leitura,
   não a geração.
2. **N pacotes.** Cada Turma tem o seu ciclo, e cada ciclo o seu pacote. Três aulas por dia na mesma
   sala são três pacotes, e é o produto a funcionar como deve.
3. **Um pedido por faixa no browser, e só o primeiro paga.** A cache de `PERFIS` absorve os
   restantes: medido, 5 pedidos para 3 faixas × 3 professores, contra 9 sem cache.

### 21.4 A conclusão, dita sem enfeite

**A factura sobe na proporção das aulas que a escola realmente dá — e é essa a medida certa.** O que
não pode acontecer é subir sem que ninguém saiba porquê. A salvaguarda é a que já existe: o
`/monitoramento` mostra as execuções do mês, e o ponto de migração avisa antes. O que esta data
acrescenta é a garantia de que **uma faixa que não mudou não gera** — que é o que separa «a escola
cresceu» de «o sistema trabalha sem necessidade».

---

## 22. O custo de uma escola em consultoria — o limitador como orçamento *(25/11/2026)*

> «Isso vai ter custo, não vai sair de graça. […] No final, se a escola não contratar, esse limitador é
> o que garante que o custo seja mínimo. Afinal de contas, o risco do negócio é meu, não é nem do
> consultor, é só meu.»

**É a pergunta certa, e ela tem uma resposta numérica.** O plano consultoria é o único produto que se
entrega **antes** de haver receita: o ambiente é montado para uma escola que ainda não paga nada. Se
ela contratar, o custo entra no custo de aquisição do cliente; se não contratar, o custo é prejuízo,
inteiro, de quem assinou a factura. Por isso ele tem de ser **um número conhecido**, e não uma
sensação.

O guião de operação e de treino do consultor está em
[FLUXO-DA-ESCOLA-EM-CONSULTORIA.md](FLUXO-DA-ESCOLA-EM-CONSULTORIA.md). Este capítulo mede a conta que
o guião usa.

### 22.1 O que uma demonstração consome, acto a acto

Os sete limites estão no catálogo (`biblioteca/comercial/planos.json` → `consultoria.limites`) e
traduzem-se numa sequência de actos. Cada linha traz a sua base — e as que dizem **inferido** não foram
medidas:

| acto | execuções que acorda | min | base |
|:--|:--|--:|:--|
| criar a escola | `criar-escola` + `derivados` + `publicar` | **3** | o job está medido (§2); os dois observadores vêm dos `paths` — **inferido** |
| gravar o plano de ensino | o job + `derivados` | **2** | o §5 declara 1; o §20.3 mediu a gravação irmã em 4 — **inferido** |
| gravar o PO | o job + `derivados` | **2** | idem |
| gerar o 1.º ciclo | `gerar` + `derivados` + `publicar` | **3** | os três medidos, 1 min cada (§20.2) |
| gerar o 2.º ciclo | idem | **3** | idem |
| **3 aulas lançadas** | 2 `derivados` + 1 `gerar`, cada | **9** | **medido** (§20.4) |
| entregar, prorrogar, habilitar | nenhuma — é KV | **0** | `POST /api/escola/consultoria` |
| | | **22** | |

**22 minutos por demonstração**, a **R$ 0,036/min** — a taxa do §20 (`$0,006 × R$ 6`) —, dá
**R$ 0,79**.

**As três linhas inferidas são a parte que pode estar errada, e o erro é para baixo.** Se a criação da
escola e as duas gravações de factura custarem um minuto em vez de três e dois, o total cai a 18 e o
valor a R$ 0,65. Orçamenta-se pelo número de cima: **22 min, R$ 0,79**.

**E este capítulo mediu-se a si mesmo.** O commit que o escreveu (`df41c5e6`) **não acordou
workflow nenhum** — as últimas execuções do Actions param no commit anterior —, o que confirma a
terceira coluna da tabela por fora: **documentar custa 0 min**. Os 22 minutos são todos de actos que
geram ou lançam, e nenhum deles é de leitura.

### 22.2 Porque é que o limitador é o orçamento, e não uma restrição comercial

A conta acima **não depende de bom comportamento nenhum**: ela é o **tecto**, porque os sete limites
são paredes e não recomendações. É isso que o limitador compra.

Sem ele, a mesma demonstração não é uma demonstração — é um mês de operação:

| | aulas que pode lançar | minutos | a R$ 6 |
|:--|--:|--:|--:|
| **com o limitador** | **3** | **22** | **R$ 0,79** |
| sem o limitador, com os mesmos 2 ciclos | **48** (24 × 2) | **157** | **R$ 5,65** |
| sem o limitador e sem teto de ciclos | semanas de aulas | — | — |

**A diferença é de 7,1 vezes** para um mês, e ela deixa de ser mensurável a partir da terceira linha.
Vale a pena dizer o que isto significa em língua de risco: **o pior caso de uma demonstração é
R$ 0,79, e ele é conhecido antes de a demonstração começar.** É essa a frase que o limitador permite
escrever, e é a única coisa que ele garante.

*(O teto de 24 aulas por ciclo não é suposto: está medido no `ciclos.json` do breu — 24 entradas em
`aulas[]`, todas com `lancada: false`. A prova `experimentos/provar-o-custo-da-consultoria.js` lê-o de
lá, para o número não envelhecer sozinho.)*

### 22.3 Quantas demonstrações cabem na franquia

A franquia são **2 000 min/mês** (§2), e a engenharia consome **522 min** (§L9f). Sobram 1 478.

`1 478 ÷ 22` = **67 demonstrações por mês dentro da franquia, a custo zero em dinheiro.**

**É a resposta honesta a «isso vai ter custo?»: em dinheiro, só depois da sexagésima sétima. Em cota,
desde a primeira** — cada demonstração gasta 22 dos 2 000 minutos que também pagam o
desenvolvimento. A cota é o recurso escasso, e é ela que limita o número de demonstrações, não o
orçamento.

### 22.4 O custo do treino, que é o outro lado

O consultor não se treina a ler: treina-se a montar. Cada treino é **uma demonstração inteira**, numa
escola de treino com dado inventado (nunca na escola do cliente).

| o que | min |
|:--|--:|
| uma demonstração montada do zero | **22** |
| uma repetição completa | **22** |
| **por consultor, com uma repetição** | **44** |

**R$ 1,58 por consultor treinado**, e **duas horas de treino assistido** mais **três horas de
preparação por escola** do lado dele — horas que este documento não precifica porque não são minhas
para fixar. O que ele fixa é a parte técnica: **44 minutos de cota e R$ 1,58**, por consultor.

### 22.5 O que fica por medir, e é o próximo número honesto

1. **A criação da escola e as duas gravações de factura** — as três linhas inferidas do §22.1. Medem-se
   no histórico do Actions como se mediu a aula, e o total de 22 passa a 18 ou a 22 conforme o
   resultado.
2. **O `derivados.yml` a observar o pacote gerado** — o §20 já declarou esta alavanca e não a puxou:
   cada geração de ciclo acorda um `derivados` que não tem nada para fazer. Cortá-la vale 1 min por
   ciclo, ou seja **2 dos 22 minutos** de cada demonstração.
3. **Quantas demonstrações simultâneas** (Q7 do plano, em aberto) — não muda o custo unitário, muda a
   cota comprometida num mês.
