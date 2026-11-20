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
regra certa não é «nunca regerar» nem «regerar sempre»: é **regerar quando o que mudou é o que o
documento lê**.

### b) O Estilo: o que a inclusão e a remoção fazem de facto

Medido no plano real da `breu` (`Rosa`, repertório `Battement tendu · Plié · Relevé`, 14 linhas na
sequência):

| o que se tira do repertório | linhas que ficam | tempos por bloco (Solo · Barra · Centro) |
|:--|--:|:--|
| — (hoje) | **14** | 36 · 32 · 28 |
| `Plié` | **10** | 32 · 24 · 24 |
| `Relevé` | **8** | 20 · 16 · 12 |
| `Battement tendu` | **10** | 20 · 24 · 20 |

**Remover tem impacto real, e é automático:** as linhas que citam o exercício caem por
`linhasDoRepertorio`, e os totais por bloco descem com elas. É exactamente o que ela descreveu.

**Incluir não tem impacto nenhum, e isso é estrutural.** O exercício passa a estar *disponível* — não
entra sozinho na sequência, porque **o bloco não é uma propriedade do exercício**: o mesmo `Plié`
aparece em Solo, Barra e Centro, e quem escolhe onde é o professor, linha a linha, no plano. Não há
nada para o sistema calcular, e inventar uma proposta seria o sistema a decidir pedagogia.

**Consequência para o modal:** justifica-se **na remoção** — e só nela. «Vai atender todos os
elementos da aula?» não é uma pergunta que o sistema saiba responder sobre um exercício que acabou de
entrar; é uma pergunta sobre o que o professor ainda vai escrever.

### c) O que o modal da remoção mostraria — e o que custa construí-lo

O que já existe para a duração serve, e é a mesma forma: o `409` com `impacto`, o cliente a abrir a
janela, e o mesmo pedido reenviado com a decisão.

| peça | onde | estado |
|:--|:--|:--|
| `impactoDoRepertorio({ plano, de, para })` | `motor/nucleo/`, ao lado de `impactoDaDuracao` | **a construir** — ~80 linhas: filtra as linhas pelo repertório novo e soma por bloco |
| a rota devolve `409` com o impacto | `POST /api/bastidores/curadoria-derivar` | **a acrescentar** — o caminho do `409` já existe nesta página, para a duração |
| a janela | `bastidores.js`, a de `perguntarDaDuracao` | **a generalizar** — hoje ela sabe uma pergunta; passar a receber `{título, corpo, pergunta}` é o trabalho maior (~150 linhas, e as provas de uma e de outra) |
| a decisão de redistribuir | `volume.js` (`aplicarMinutos` já existe) | **pronta** — só passa a ser chamada por outra janela |

**Custo de construção:** pequeno. **Custo de manutenção:** duas janelas a manter em paralelo, se não
se generalizar — e é por isso que a generalização é a parte que não se deve adiar.

### d) O que se economiza, e o que se **paga**

O gesto de hoje, quando se tira um exercício, são **dois**: tirar do repertório (que corre a cadeia e
derruba as linhas do plano) e depois voltar ao plano para reescrever a distribuição. Com o modal é
**um**. Cada gesto poupado é uma geração — 1 a 2 minutos.

**E há um limite que não é medido em minutos:** a janela abre **só na derivação**, e não na edição —
foi ela quem o disse, e a razão é a mesma da duração: a edição é o presente; a derivação é o elo novo,
e é ele que pode ser interrogado antes de nascer.

### e) O que dá para automatizar

| passo | automatizável? | porquê |
|:--|:--|:--|
| derrubar as linhas do exercício removido | **já é** | `linhasDoRepertorio`, na derivação |
| somar os tempos por bloco | **já é** | é aritmética, e o modal mostra |
| redistribuir os **minutos** por bloco | **não** | a soma tem de fechar com a duração, e quem decide é ela — a mesma regra da duração |
| redistribuir em **percentual** | **sim** | 30 % de 90 são 27, de 165 são 49,5: a conta resolve-se, e não há modal |
| propor o bloco de um exercício novo | **não** | o bloco não é do exercício; é decisão pedagógica do professor |

**A conclusão do estudo, em uma linha:** o modal existe para a **remoção** (há impacto, há conta a
fechar) e não para a inclusão (não há impacto nenhum); e o que hoje custa minutos não é este modal —
é o Dicionário a regerar quando muda um campo que documento nenhum lê.

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
