# Estado atual — Projeto Ciclo / Sistema Lastro

> **Este documento é a fotografia curada do estado do projeto.** É escrito à mão, atualizado
> pontualmente, e classifica o que afirma. Não é promocional, não é cópia da documentação e
> **não é gerado** — o gerado é o `HANDOFF.md`.
>
> **Última fotografia:** 25/11/2026 — **a cadeia passou a decidir sobre o docente da faixa, e o par de
> uma faixa passou a ser um gesto.** Duas correcções minhas, as duas achadas ao percorrer o cenário
> dela na Sala do Piano — o mesmo professor, Balé na faixa 1 e Contemporâneo na faixa 2. A guarda da
> autoria lia o docente da **raiz** (espelho da faixa 1) e bloqueava o plano a dizer que o professor
> «já não a dirige»: falso, ele dirige a faixa 2. E mudar o par de **uma** faixa respondia `200` com
> «o par da sala não mudou», sem disparar a cadeia. Ambas com controlo negativo. **O que continua
> medido e por decidir:** as duas Turmas são criadas e os ficheiros do ciclo **colidem** — a variante
> é `<escola>-<sala>`. Cada faixa de uma sala pode ter o seu docente e a sua modalidade — ou o mesmo nas duas, que
> é o caso comum. E o «não persistiu» que ela relatou era um defeito meu: o «Derivar» repunha o ritmo
> só na primeira faixa, e as outras desapareciam ao gravar sem erro nenhum. A aba Salas ganhou o «+»
> que acrescenta faixas, e a Turma passou a escolher qual ocupa — a funcionalidade existia no servidor
> e não existia para quem usa. Antes disso, no mesmo dia: **a sala ganhou faixas** — N aulas por dia,
> N modalidades, N professores. A regra da ocupação está nas duas rotas, e a Sala passou a poder declarar **mais do
> que uma aula por dia** — cada faixa com dias, hora, duração, **período, modalidade e professor**, que
> desceram para a faixa por decisão dela. A Turma diz qual faixa ocupa, e uma sala com várias **recusa**
> a Turma que não diz qual. Uma sala antiga, com o ritmo na raiz, vale como uma faixa só: **nenhum
> registo se toca.** A Sala que criaria colisão entre turmas existentes é **recusada no gesto**, e as
> mensagens deixaram de sugerir resolução. **Falta a tela** — o «+» e o campo —, e sem ela não é
> alcançável por quem usa.
> **A correcção que ela fez:** a tabela que apresentei dizia «recusa» onde a regra sempre permitiu; o
> que estava limitado era o modelo, e é isso que esta fotografia muda.
> A regra nova está **ligada aos dois sítios de gravação** (criar e derivar): pergunta «quem ocupa este
> dia, a esta hora?», nomeia o recurso, o dia e as duas horas, e a regra antiga das alunas por
> modalidade foi **substituída** (`alunasComprometidas` apagada). **E a implementação revelou o que
> nenhuma leitura tinha revelado: a curadoria não tem ritmo próprio** — o ritmo vive só no registo da
> Sala, e por isso duas turmas no mesmo registo têm a mesma hora por construção. O caso das 14h e das
> 16h na mesma sala **não é expressável** hoje; o que falta é o **modelo**, e a decisão é de produto
> (decisão 187). Ficam também as três decisões de custo da fotografia anterior.
> **O custo, medido:** a factura de Novembro fechou em **$0,00** (2 511 min, $15,07 bruto, $15,07 de
> desconto), mas ao medir os jobs apareceu o que faltava — **todos os jobs estão abaixo de 60 s e cada
> um factura 1 minuto**, e a geração, que o §12 media a 110 s p50, está hoje em **14–43 s**. E **um
> acto não é uma execução**: o «Guardar» do PO de 24/11 às 11:15 acordou **4 execuções — 3 do
> `derivados` (2 canceladas) e 1 geração** —, e as canceladas pagam-se. O modelo `2a` dava **85,7 %**
> de margem; **medido antes das ondas era `4a` e 63,6 %**; **medido depois é `3a` e 74,6 %**
> (R$ 235,80). **As ondas não melhoraram um cenário bom — recuperaram 11 pontos de margem** que
> estavam a ser pagos sem ninguém ver. E a alavanca seguinte está declarada com a conta: o
> `derivados.yml` deixar de observar o pacote gerado leva um acto a **2 min** e devolve os **85,7 %**.
> **O contador de aulas custa ZERO minutos de GitHub** — `aulas-dadas.js` já lê `ciclos.json` do
> **ASSETS, que não é rede**, e o `ciclos.json` real tem `data` e `lancada` por aula. Falta **uma
> função** (`contarAulasDoMes`); a comparação com a franquia, os quatro estados e a disciplina do
> `null ≠ 0` já existem. **E o bloqueio:** ela descreveu ciclos simultâneos que se separam por dia e
> horário, e a regra de 09/11 diz que **«uma sala recebe UMA Turma por vez»** — medido, duas
> curadorias na mesma sala a 14h e a 16h recebem **409**, com a frase «duas aulas no mesmo horário»
> sobre duas aulas que não são. O plano (`PLANO-DE-OCUPACAO.md`) formaliza a regra por intervalos,
> nos três recursos — **sala, professor e elenco** —, e declara o que a mudança quebra: as **41
> asserções** de `provar-mudanca-de-sala`.
>
> **Fotografia anterior (25/11/2026 — a analítica do Cloudflare já estava habilitada, e a limitação
> declarada era falsa).** Ela perguntou como se habilita a permissão de analítica para medir «os
> pedidos que são feitos por dia no worker, a escrita de KV por dia e a leitura de KV por dia».
> **Resposta: não é preciso habilitar nada.** O Worker `danca` já tem o `CLOUDFLARE_API_TOKEN` e o
> token já tem `Account Analytics: Read` — e o painel dizia, em letra escrita desde 17/11/2026, «que
> este Worker não tem». **Uma limitação declarada que é falsa não é neutra:** faz quem lê desistir de
> pedir o número. **O que passou a ser medido, no pico da janela de 7 dias:** pedidos 2 962 de
> 100 000 (**3,0 %**), leituras de KV 12 804 (**12,8 %**), **escritas de KV 234 de 1 000 (23,4 %)**,
> listagens 61 (6,1 %), apagamentos 31 (3,1 %) — e **o recurso que aperta não é o que parecia**: os
> pedidos estão a 0,5–3 %, e as **escritas de KV**, com cota de 1 000 por dia, são as que estão mais
> perto do tecto. **Três decisões, as três de medição:** **uma consulta e não duas** (as duas famílias
> vivem debaixo de `viewer.accounts`, e cada chamada é um subpedido num orçamento de 50); **a
> granularidade é o DIA** — a primeira sonda agregou por `datetime` com `limit: 10000` e deu **9 113
> grupos num só dia** com um tecto que corta em silêncio, e por `date` são **2 grupos por dia**, com a
> soma dos dois modos a conferir (2 029 pelos dois lados, diferença zero); e **o alerta lê o PICO**,
> não o hoje — a cota é diária e volta a zero, e o pico é estável. **O que não se inventa:** o zero de
> um dia sem tráfego é um facto e entra a zero; o de uma leitura falhada não se escreve; as quatro
> falhas são declaradas com o motivo (sem token, 403 com a permissão nomeada, `errors` com HTTP 200,
> rede a rebentar); o truncado diz-se; e os números são **do fornecedor**, de conjuntos com amostragem
> adaptativa. **43 asserções**, com o controlo negativo que importa: olhando só o hoje, um parque com
> as escritas a 90 % no pico dava «folga». De ponta a ponta pela rota verdadeira: **fria 1 chamada ao
> GraphQL, quente 0**, e o **pior indicador a ler 23,4 %**.
>
> **Fotografia anterior (25/11/2026 — os schemas do ciclo custavam 109 commits, e passam a um).**
> «Aí você tem que me dizer se der para economizar também com isso [o `.conf`], a gente economiza,
> senão deixa assim.» **O `.conf` não compensa, e a resposta é essa:** ele é escrito antes de o
> acervo entrar, num ponto em que não há lote aberto, e juntá-lo exigiria levantar a fila ao nível da
> rota; o ganho seria **um** commit. **Mas a pergunta fez encontrar outra coisa, e é grande:**
> `git log --all --grep='feat(schema)'` dá **109 commits**, e **20 pastas de professor têm exactamente
> cinco** cada. O `garantirSchemasDoCiclo` fazia **um `PUT /contents` por schema** — cinco commits,
> cinco pushes, cinco execuções do `derivados.yml`, que observa `professores/**`. Cada execução custa
> **1 minuto** e o `cancel-in-progress` mata as quatro seguintes — **e um job cancelado paga-se**.
> **20 atos × 4 a mais = 80 minutos** gastos a escrever cinco ficheiros para a mesma pasta, no mesmo
> segundo. Agora as escritas vão num **`gravarArquivosNumCommit`** só; os `GET` continuam um por
> schema (só se escreve o que falta), a ordem mantém-se (os schemas antes da fonte), e **degrada**
> para o `PUT` por ficheiro quando o adaptador não fala a API de Git — o caso das bancadas. **32
> asserções**, e a secção nova é vermelha sem a mudança. **E a segunda pergunta dela, o Cloudflare:
> não é preciso habilitar nada** — o Worker `danca` **já tem** o `CLOUDFLARE_API_TOKEN` e o token
> **já tem** `Account Analytics: Read`, medido pelo GraphQL: `kvOperationsAdaptiveGroups` devolveu
> **2 615 leituras e 25 escritas** de 23/11, e `workersInvocationsAdaptive` devolveu os pedidos por
> script. **A limitação declarada no `resumirCloudflare` está errada** — o comentário diz que o Worker
> não tem a permissão, e tem.
>
> **Fotografia anterior (25/11/2026 — o ato passou a custar um commit, e não quatro).** «O
> agrupamento que falta é dentro do ato e não dentro das aulas […] É importante que isso não estrague
> nada do que está funcionando.» **A medida, e é pior do que «2 a 4»:** nos runs de 23 e 24/11, **21
> execuções do «Fechar os derivados», 7 canceladas**, **4,6 min de trabalho e 21 min facturados** —
> **4,6× de desperdício**, porque cada job arredonda ao minuto e **um cancelado paga-se**. As sete
> canceladas duraram **22 segundos** e custaram **sete minutos**. **O ato, commit a commit:** o
> «Guardar» das 11:11:53 às 11:12:30 fez **quatro pushes em nove segundos** — o `.indice.json`, o
> envelope, o `.conf` e as dez fontes (essas já juntas desde 22/10). Cada um é um `PUT /contents`, e
> cada `PUT` é um commit, e cada commit é um push que acorda o `derivados.yml`. **E o custo não é só
> o CI:** `gravarArquivosNumCommit` gasta **cinco subpedidos por commit**, e quatro commits são vinte
> num orçamento de cinquenta. **O desenho:** o acervo ganhou um **lote** (`abrirLote`/`fecharLote`),
> acumulando as escritas do pedido num commit só; **sem lote nada muda** — é o controlo negativo da
> prova, e é a resposta ao «não estrague nada». O `criado` pergunta-se **antes** de guardar (o
> primeiro defeito: escrito ao contrário, todo o envelope novo passava por edição). Lote vazio não
> faz commit. O `apagar` **fecha** o lote antes, porque o commit único não sabe apagar. E a lição
> que valeu três provas vermelhas: **`typeof` não basta com um proxy que finge saber tudo** — o
> `acervo-envelopes.js` devolve uma **promessa rejeitada** para o verbo que não conhece, e um
> `try/catch` sem `await` não a apanha. **E a regressão que a mudança quase causou** —
> `provar-escola-do-documento` de 8/8 para 7/8, porque um `fetchImpl` de bancada não fala a API de
> Git — produziu o `degradado`: se o commit único falhar, as escritas são refeitas **uma a uma**, e
> a resposta di-lo. **Um ganho de cota não pode custar a gravação.** O `.conf` continua num commit
> próprio, e fica dito: o corte é de **quatro para três** nesse ponto. **182/277 provas, 0
> regressões.**
>
> **Fotografia anterior (25/11/2026 — o monitoramento deixou de reler o mês a cada abertura).** Ela
> sentiu-o antes de eu o medir — «a API demora muito tempo para carregar […] tenho a impressão que isso
> acontece porque a consulta está sem critério» —, e a hipótese estava **meio certa**: a janela **já
> era o ciclo** (dia 1 ao hoje, desde 17/11), e o que não tinha critério era a **paginação**. O corte do
> mês era aplicado *depois* de a lista vir: **medido com `curl`, 26 páginas e 2 600 execuções em 97,8 s
> sem filtro, contra 11 páginas e 1 000 em 54,7 s** com `created=>=2026-11-01` no pedido. O filtro
> passou a ir no URL, e com ele duas verdades que ficaram escritas: **`total_count` devolve ZERO** com o
> filtro (não é «não há execuções»), e a listagem filtrada **para em 1 000** — acima disso a janela é
> `truncado`, e diz-se. **Mas a causa maior era outra, e ela não a podia ver:** a janela **não tinha
> cache nenhuma**. Havia cache para os jobs, para as chaves de KV, para a factura e para a visibilidade
> — não para a lista de execuções, a única que se paga em **páginas**. Cada abertura relia o mês de
> fábrica: onze pedidos em série, sempre. Agora a lista fica **2 minutos**, com **validade por mês**,
> com o **`truncado` guardado** (senão a abertura seguinte apresentaria uma janela incompleta como
> completa), com **leitura falhada não guardada**, e com o **`ok` restituído** — um objecto vindo do KV
> não traz esse campo, e sem isso o painel diria «a janela falhou» sobre uma leitura que correu bem.
> **Medido de ponta a ponta**, com a rota verdadeira em processo e um GitHub de mentira que conta os
> pedidos: **fria 11 páginas + 12 medições; quente 0 páginas + 12 medições**. A poupança em segundos
> (~32 s) é **derivada**, e está dita como derivada — o tempo de rede não se mede contra um GitHub de
> mentira; o que **está** medido é a contagem de pedidos. **A idade do número passou a ser dita na
> página** — «As execuções do mês são as de 25/11 às 08:58 — relidas a cada dois minutos» —, e
> `janelaDaCache` é `null`, não `false`, quando não se sabe. **O controlo negativo apanhou um defeito
> meu:** o prazo era lido com `Number('2 * 60 * 1000')`, que dá `NaN`, e a cache **nunca caducava** —
> os dois controlos passavam sem medir nada, mesma família do `.every` sobre leitura vazia. **181/276
> provas, 0 regressões.**
>
> **Fotografia anterior (25/11/2026 — o §7.1 não existe, e o ponto de migração passou a ser dito).** Ela
> desconfiou de mim — «isso já não foi feito? […] Você precisa medir isso» — e tinha razão em desconfiar:
> **o agrupamento das gerações não está implementado.** O `disparar.js` faz um `POST` imediato por
> pedido, sem janela; o `concurrency` do `gerar-ciclo.yml` **serializa** (para não sobrescrever o pacote)
> e o do `derivados.yml` **cancela o pendente** — e um cancelado paga-se. Nos runs: **71 gerações, 4
> canceladas (5,6 %)**, e os intervalos de «0 minutos» são o **mesmo acto a disparar duas vezes**, a
> 12–15 segundos. **E o mais importante:** o §7.1 foi escrito para «dez aulas seguidas»; aqui são **16
> por dia, uma por hora**, com a geração a demorar **40–50 s** — a anterior termina **59 minutos antes**
> de a seguinte ser pedida. **Quando eu disse que ele «corta a factura a metade», apliquei a este
> cenário um ganho medido noutro.** O que a medição encontrou é maior: **um acto dispara 2–4 gerações e
> 1–7 derivações — 10 minutos por um gesto de trinta segundos** —, porque cada gravação pede a geração e
> cada geração escreve em `professores/**`, que dispara a derivação outra vez. **É esse o agrupamento
> que falta**, e é ele que entra na ordem de socorro no lugar do §7.1. **E o aviso do ponto de migração
> está no ar:** no monitoramento, na aba da receita, a lista das escolas que **vale a pena migrar** —
> **190** aulas/mês no Básico→Intermediário e **400** no Intermediário→Avançado, com a frase que o
> consultor leva. **A prova corrigiu o modelo:** o dinheiro perdido **cresce** com o crescimento (R$ 0 →
> 20 → 55) e as aulas «que paga sem receber» **encolhem** (130 → 90 → 20) — **o dinheiro mede a perda,
> as aulas descrevem a distância.** O bloco diz que **não** é a migração dos fornecedores, e **não tem
> botão de migrar**: a decisão é comercial, e o que ela pediu foi a lista para telefonar.
>
> **Fotografia anterior (25/11/2026 — a escada aplicada, as extensões simuladas e a mora.** As três
> coisas que ela pediu no mesmo dia, todas feitas. **A escada é o que o sistema promete**: as
> franquias do `planos.json` passaram a **130 / 320 / 500**, e o Financeiro e o cartão da escola
> mostram-nas **sem uma linha de código** — leem o catálogo. **O simulado das extensões, que faltava,
> inverte a intuição:** a extensão custa R$ 0,072 de CI e vende-se a R$ 0,50 — **85,6 % de margem**,
> melhor do que o Intermediário (76,9 %) e o Avançado (74,3 %) —, e a margem **sobe** com o
> crescimento (Intermediário 76,9 % → **79,4 %** às 400 aulas; Avançado 74,3 % → **81,5 %** às 1 000).
> **A escola paga mais por aula nas extensões do que no plano**, e nove escolas a crescer 50 % dão
> **65 % mais receita e 89 % mais lucro**. **Porque a alavanca dela é fraca, medido:** a aula custa 7
> centavos e o preço é 30; a R$ 12 seria preciso cortar a franquia **a metade** para o custo não subir;
> e corta justamente o produto mais rentável — cortar o Avançado de 500 para 450 devolve R$ 3,60 e abre
> 50 aulas vendáveis a R$ 0,50. **O que reduz a sério é a engenharia** (R$ 43,63/mês, 36 % do custo) e
> o **§7.1** (metade da factura). **A mora é a das contas de consumo:** 2 % de multa (CDC art. 52, §1º;
> REN ANEEL 1.000/2021, art. 343, §1º) e 1 % ao mês pro rata die, sem carência e sem anatocismo —
> R$ 100 a 30 dias = R$ 103,00; e a correção do IPCA **não se aplica, e diz-se**. **O monitoramento
> passou a medir a cota na unidade da casa** — 1 000 aulas/mês é onde o gratuito acaba, às duas câmbios
> (a do dia e a de R$ 6), e entra no **pior indicador**: sem ela o mesmo parque com as três cotas do
> fornecedor a 10 % dava «folga». **Seis provas, 248 asserções, 0 regressões**; duas delas novas com o
> controlo negativo que importa. **A lacuna declarada:** a norma de **luz** foi lida; a de **água**
> não — os números coincidem, a citação é mais fraca.
>
> **Fotografia anterior (25/11/2026 — a escada fechada em 130 / 320 / 500).**
> «Eu vou ficar com a proposta A, ela é a mais vantajosa para mim e também é razoável com a escola.» A
> conta refeita com a escolha dela e com o dólar de referência que ela fixou: às nove escolas cheias o
> custo **cai** de R$ 175,20 para **R$ 121,20** e a margem **sobe** de 81,1 % para **87,0 %**. **As
> aulas por semana:** 30,0 no Básico (5,0/dia, 1 sala), 73,8 no Intermediário (12,3/dia, 2 salas),
> 115,4 no Avançado (19,2/dia, 3 salas). **A migração:** às **190** aulas/mês o Básico deixa de
> compensar (43,8/semana) e às **400** o Intermediário (92,3/semana); a extensão vale a pena entre
> 131–190, 321–400 e **501+** — e no Avançado ela é a única saída e custa **1,79×** a aula do plano.
> **O custo é R$ 0,00 até 1 000 aulas/mês na conta inteira** e depois **R$ 0,072 por aula, para
> sempre**; **a margem não depende do número de escolas** (converge para 90,6 / 79,7 / 76,3 %) porque o
> custo e a receita crescem ambos com as aulas — o que desce é a fatia gratuita, e ela acaba uma vez.
> **O prejuízo só começa com o dólar a R$ 46,00** e os 50 % a R$ 23,00: oito vezes o que ela declarou
> suportar. **E a alavanca que ela propôs é fraca, medido:** cortar 10 % da franquia poupa R$ 0,94 /
> 2,30 / 3,60 por mês. A ordem certa, se o gatilho aparecer, é a engenharia (1 212 min/mês, 36 % do
> custo), a consolidação dos jobs (§7.1) e só no fim a franquia. **O que se vigia é o total de aulas
> lançadas no mês, não o número de escolas.** Falta escrever as três franquias no `planos.json` — o
> sistema ainda promete a escada antiga.
>
> **Fotografia anterior (25/11/2026 — o equilíbrio da escada).** Depois de a §10 fechar a conta do
> lucro, ela trouxe a viabilidade prática — «4 h/dia, 6 dias» no Básico, «12 h ou 2 salas» no
> Intermediário, «31 aulas/dia é impossível numa sala» no Avançado — e ela **confere ao minuto** com as
> franquias (3,8 · 11,5 · 30,8 aulas/dia). **E é por isso que o cenário dos 16 h/dia estava errado como
> retrato:** nenhuma escola do Básico trabalha dezesseis horas; trabalha quatro. **A resposta à
> pergunta dela não depende do plano:** o tecto dos 100 % é `2 000 min ÷ 2,0 = 1 000 aulas/mês no
> TOTAL` — **77 aulas/semana por escola com 3 escolas**, 26 com nove. Contra isso, o Básico (100) tem
> **folga de 3,3×**, o Intermediário (300) está **no ponto** e o Avançado (800) **excede 2,4×**. A razão
> é uma só: o compute custa o mesmo por aula e o Avançado vende a aula **quatro vezes mais barata** —
> a escada de valor é, do lado do custo, um subsídio. **Dois limites duros fecham o espaço de manobra:**
> o Básico **não passa de 139 aulas** (a extensão a R$ 0,50 tem de ser mais barata do que a aula do
> plano de entrada) e o Avançado tem de ter **mais de 448** com o Intermediário em 320. **A escada
> proposta: 139 / 320 / 500** — +39 % no Básico, +7 % no Intermediário, −37 % no Avançado (de 31 para
> 19 aulas/dia), com o compute sobre a receita a ir de 9/19/37 % para **13/21/23 %** e a margem das nove
> escolas de **83,0 % para 88,1 %**. Perde-se receita máxima gratuita (R$ 699 → R$ 489,30) e ganha-se
> 120 aulas de extensão antes de o upgrade compensar. **Recomendado; a decisão comercial é dela.**
>
> **Fotografia anterior (25/11/2026 — quantas escolas se sustentam).** Pergunta dela: «quantas
> escolas eu consigo ter lucro? […] parece que o meu custo aumenta mais do que a minha receita na
> medida em que eu tenho mais escola». **A resposta é: todas, e não existe ponto de prejuízo** —
> porque o custo de uma escola é sempre uma fracção da receita dela, e a escada do GitHub só acrescenta
> dois valores fixos (US$ 4 e US$ 21) que pesam **menos** à medida que o N cresce. A margem **desce**
> com N e **aplana** num piso que depende do **plano**: **90,7 %** no Básico, **80,5 %** no
> Intermediário, **62,9 %** no Avançado — e o zero exigiria o runner **2,7× mais lento**, no caso mais
> apertado. **A unidade é 2,0 min por aula**, e é o ciclo que a segura: `Gerar o ciclo` mede 40 s
> (16 runs pós-TeX) e `Fechar os derivados` 1,00 (395 runs), e o laço da geração percorre as aulas
> **do ciclo**, que tem **24** — a fronteira do minuto só é tocada às **67 aulas num ciclo só**.
> **E ela corrigiu-me em três coisas, todas certas:** a franquia **existe e é o teto** (100/300/800,
> em `assinaturas[].aulas`, com excedente a R$ 0,50 acima); a **C25 está resolvida** desde 17/11/2026
> (conta-se 440, e o `teto.aulas: null` é deliberado — «um teto comercial é uma promessa, e a promessa
> é a franquia»); e **a geração não percorre o mês** — percorre o ciclo, pelo que os 1 076 min que eu
> escrevi eram uma soma quadrática que não existe: são **704**. A 16 aulas/dia as três escolas custam
> **R$ 3,63** contra **R$ 461,70** de receita — margem **99,2 %**, e não 93,7 %. «Partilhar o mesmo
> workflow» continua a não poupar minuto nenhum (o `concurrency` lança e cancela, e a factura
> arredonda ao minuto por job). **O contador que daria o número à franquia está desenhado e não
> implementado** — `comercial.situacaoDaFranquia` já devolve `folga`/`perto`/`limite`/`passou`; falta
> quem lhe dê o `aulasUsadas` do mês.
>
> **Fotografia anterior (24/11/2026 — a mesa dos N ciclos).** Pergunta dela: «preciso saber se tem
> para quando a gente tem n ciclos e se esses ciclos não se misturam, o conteúdo deles». Havia cinco
> provas, e cada uma travava uma dimensão (a sequência estrita, o PO que herda o ciclo do plano, a
> exclusão que guarda o último, a Aula 01 e a Aula 02 que não imprimem o mesmo §1, o isolamento
> entre ESCOLAS) — **nenhuma punha dois ciclos da mesma turma** na mesma árvore. E o caso é o pior
> de propósito: a variante é `<escola>-<turma>` e não leva o ciclo, de modo que dois ciclos da mesma
> turma diferem, em todo o caminho, por `ciclo-NN` e mais nada. **`provar-ciclos-independentes`
> (34/34)**: nada colide, o ciclo 01 fica byte a byte igual, nenhuma fonte de um ciclo contém o
> marcador do outro, e a trava da aula dada é **por ciclo** (a aula 01 lançada do 01 não impede a do
> 02 de nascer). **E a mesa encontrou um defeito na primeira corrida:** a guarda dos caminhos dizia
> `if (!ciclo)` sobre um valor que vinha de `''.padStart(2,'0')` = `'00'` — verdadeiro —, e um
> contexto sem ciclo escrevia em `ciclo-00-…`. `numeroDoCiclo` passa a ser a leitura única.
> **A cadeia entre ciclos, medida:** editado o plano do 01 depois de o 02 estar ancorado, o `--check`
> do 02 **recusa** (exit 1, com os dois hashes e o remédio); reancorado, adopta o pai novo e o 01 não
> é tocado — e é o `derivados.yml` que o faz a cada push. **O custo, medido:** mil execuções em 10
> dias dão **485 min de relógio e 1102 min facturáveis** (o GitHub cobra cada job arredondado ao
> minuto, cancelados incluídos — 2,3×); média de **110 min/dia**, e hoje a factura é **zero** porque
> o repositório é público.
>
> **Fotografia anterior (24/11/2026 — o manifesto declara tudo o que o escritor grava).** Ela
> configurou a `breu` de ponta a ponta (professor `demi-plié`, plano de ensino, plano de observação,
> «Gerar») e não nasceu ciclo, aula nem documento — «e não tem nenhum erro no action do GitHub».
> **A execução estava vermelha**: «Gerar o ciclo · demi-plie/01/breu-piano» (run `45382567181`)
> terminou em `failure` no passo «Gerar e validar o pacote», com **20 erros**. Nenhum deles nomeava a
> causa: o `DOCS` do manifesto dizia `plano aula-01 captura-aula-01` enquanto o escritor gravava, ao
> lado, `-harmonizacao.md`, `-notacao.md`, `-glossario-codigo_de_danca.md` e `-referencias.md` — e o
> gerador publica o que o `DOCS` declara. A aula também só ganha as secções de exercício quando é
> composta com a notação, e é delas que vivem as 16 âncoras que a tabela dos objetivos cita.
> **A causa era uma lista com duas regras:** `docsGerados` sabia a lista inteira e só corria quando o
> manifesto ainda não tinha `aula-01`; o caminho normal caía no ramo que só acrescenta aulas, e a
> lista parava de crescer em silêncio. `docsCompletos` passa a ser a regra única (só acrescenta,
> nunca reordena o que não é dela), `gerar-ciclo.sh` deixa de citar âncoras que a página não vai ter,
> e o `.conf` foi reparado pela própria regra. **Ao ar:** a execução refeita (`45384285428`)
> concluiu `success`, e em `breu.padd.com.br/piano/` as nove páginas respondem 200 — as 16 âncoras
> existem todas na aula.
>
> **Fotografia anterior (23/11/2026 — o «Gravar» só acende quando o pedido mudaria).** Nas
> Habilitações do Estúdio, o botão nasce **apagado** e acende só quando o que se gravaria difere do
> que o servidor diz que está gravado — «para evitar custo», porque cada gravação escreve
> `professores/<slug>/perfil.json` e move a cadeia. A conta é **o pedido**, não o ecrã: a mesma
> função que monta o corpo é a que compara. E ela obrigou a fechar um buraco que já lá estava: o
> perfil tem **três** estados por modalidade desde 18/11 (chave ausente / vazia / com nomes) e o
> pedido só sabia exprimir dois — **13 dos 15 perfis reais** têm `tradicoes` ausente, e marcar «não
> ensina nenhuma» nesse estado não mudava o que se gravava. O `submit` passou a calar a chave quando
> ninguém respondeu. **E ficou declarado como padrão** («nessas situações em que não tem o botão de
> editar»): formulário **sem «Editar»** abre com o Gravar apagado; com «Editar», acende ao abrir.
>
> **Fotografia anterior (23/11/2026 — a seta só está onde ela a pediu, e gravar fecha o
> formulário).** Palavras dela: «Você colocou o botão de expandir de forma indiscriminada e não só
> onde eu te pedi ontem.» A dobra nascia em qualquer `.conteudo > h2[id]`, e o **índice de uma
> escola** (1 título) e a **apresentação do sistema** (9) ganhavam a seta por omissão — recolher o
> primeiro esconde a página inteira. `TELAS_SEM_DOBRA` passou a `{porta, raiz, escola, sistema}`, com
> as duas páginas a declararem-se no `<body data-tela>`. O **índice da escola** deixou de dizer «As
> turmas desta escola» (a redundância que ela leu), a frase passou a «o que se planeja para uma serve
> de base para a outra — é o lastro da próxima», a do ritmo e do calendário saiu, o aviso do ciclo
> ficou, e entrou o atalho «**comece por aqui** — Bastidores → Estúdio». E **gravar as habilitações
> fecha o formulário**, com a confirmação no aviso do gesto — escrita no `.res` de dentro, ela ficaria
> escondida pela própria recolha.
>
> **Fotografia anterior (23/11/2026 — o documento do professor pode ser CNPJ).** A entrada
> anterior pôs a lista a ler o documento pelo comprimento, mas não havia porta por onde um CNPJ
> entrasse: o Estúdio pedia «CPF do professor», onze dígitos. O campo passou a dizer **«CPF ou CNPJ do
> professor»** e quem decide é o número; gravar um **limpa** o outro (um documento, um sítio); a
> unicidade é por documento, e não entre documentos nem contra o CNPJ das escolas. O formulário de
> criar escola continua a pedir CPF — é a ordem dela —, e o CPF do proprietário continua a **não** ser
> obrigatório.
>
> **Fotografia anterior (23/11/2026 — a lista dos professores ganhou Ações, documento e contacto;
> e o Financeiro manda o professor para lá).** A coluna «Escolas vivas» passou a chamar-se **«Ações»**:
> quando há escola viva, cada uma é um botão com o **nome** dela que leva ao site, e o `title`
> diz se ele é o responsável por ela; quando não há, fica a etiqueta «sem escola viva», porque um botão para
> nenhum sítio não é uma ação. A lista passou a mostrar o **cadastro da pessoa** — documento (CPF
> **ou** CNPJ, decidido pelo comprimento e escrito como se lê) e contactos —, lido das fichas
> `professores/<slug>/contato` que a criação da escola e o Estúdio gravam: um `get` por professor,
> **nunca** um `list`. E o professor na aba «Os dados da escola» passou a ser **uma ligação** para
> esta página; o documento dele saiu do feed do Financeiro, para não haver duas cópias do mesmo dado.
>
> **Fotografia anterior (23/11/2026 — a senha do professor não se esconde com o modo do
> professor).** Ela foi criar uma escola, escolheu «um professor que já existe», clicou em continuar e
> leu «informe a senha do professor» — com o campo **dentro** do bloco do professor novo, que naquele
> modo está escondido. A regra pedia um valor que a tela não deixava escrever. O campo passou a ser
> **um só, visível nos dois caminhos**, com o recado a mudar de dono — porque a senha do professor é
> **por escola** (`senhaDoProfessorOk` responde «é DESTE professor NESTA escola») e reutilizar a
> pessoa não é reutilizar a senha dela noutra. A nota é a peça `.aviso` já catalogada: um `span.sub`
> novo reprovou a checagem 8 (Peça). E o controle negativo ganhou âncora escolhível
> (`--controle-negativo=<sha>`) — contra o formulário de antes das etapas, a asserção principal
> passava **por ausência**.
>
> **Fotografia anterior (23/11/2026 — a identidade fiscal entra à mão no ambiente de teste, e a
> criação também a herda).** As duas escolas de teste que ela vai recriar — `calango` e `batata` —
> passaram a ter CNPJ e e-mail **no registo que sobrevive ao expurgo** (`cadastros/<slug>`), com o
> motivo honesto do que são; o `breu` fica **sem cadastro** de propósito, porque ela quer preenchê-lo
> à mão para testar o caminho. Os dois CNPJ foram conferidos pelo dígito verificador antes de entrar.
> E o código que faltava: a **criação** com o mesmo nome herda o que o formulário não trouxe, pela
> mesma conta da recriação (`identidadeDoExpurgo`) — o CNPJ conferido contra as outras escolas, o que
> a escola declarou a mandar sempre, e o que foi herdado marcado como herdado. A chave escolhida
> (`cadastros/` e não `bastidores/<slug>/cadastro`) não é indiferente: a segunda faria a criação ser
> **recusada** pelo próprio número, porque `cnpjJaUsado` varre `bastidores/*/cadastro`.
>
> **Fotografia anterior (23/11/2026 — a recriação traz os dados da escola de volta).** A pergunta
> dela foi certeira: «O CNPJ a partir de então vai surgir junto? […] recriar é aquela escola que a
> gente já tinha antes, mas aí com os dados da escola também. É isso mesmo? O recriar já está
> alinhado com essa nossa nova diretriz?» **Não estava.** A véspera tinha posto o cadastro a
> sobreviver ao expurgo, mas nada o trazia de volta: a escola recriada ficava sem CNPJ, sem e-mail e
> sem telefone, o e-mail de boas-vindas saía só para o professor, e a aba mostrava «guardado no
> expurgo» sobre uma escola viva. A recriação passou a repor o cadastro (decisão 167), marcado como
> **«herdado do expurgo»** com a data — e **não herda um CNPJ que já seja de outra escola**, porque um
> CNPJ é uma escola.
>
> **Fotografia anterior (23/11/2026, à noite — os dados da escola sobrevivem ao expurgo, e há uma
> aba que os mostra).** Ela pediu duas coisas na mesma mensagem: saber, antes de criar, se uma «Breu»
> nova com outro CNPJ é outra escola; e ter no Financeiro os dados de cada escola para poder cobrar
> ou acionar quem deve. A resposta medida é que o **CNPJ** é outro registo e o **slug** é a mesma
> identidade da máquina (`breu`: mesma pasta, mesmo prefixo de KV, mesmo endereço, mesmo elo — e
> herda o livro das 7 mensalidades); um «Breu Dois» dá `breu-dois` e continua a carregar o fixture de
> teste, porque a regra do fixture é uma PALAVRA NO NOME. E a investigação encontrou o defeito que o
> pedido dela pressupunha: **o expurgo apagava o CNPJ** — o cadastro vive em `bastidores/<slug>/`,
> que a limpeza por prefixo leva. O CNPJ da `breu` expurgada **não é recuperável**; daqui em diante,
> o expurgo guarda a identidade fiscal em `cadastros/<slug>`, fora dos dois prefixos, e a aba nova
> «Os dados da escola» mostra-a — com a origem de cada dado e com as expurgadas na lista.
>
> **Fotografia anterior (23/11/2026, ao fim do dia — o financeiro de uma escola expurgada não se
> apaga).** Ela olhou o resultado do expurgo da `breu` no `danca.padd.com.br/financeiro` e disse: «O
> que não pode sair é a parte financeira. Tem que manter que ela é uma escola que tem um histórico de
> pagamentos e de ações. […] A parte financeira não pode expurgar, ela fica para histórico. E aí a
> gente diz numa linha seguinte que essa escola foi expurgada.» A regra de 17/11 era o contrário, e
> chegou a apagar as 7 linhas dela do livro. Invertida: o livro fica (é a receita que existiu), as
> **7 linhas foram repostas**, o extrato passa a mostrar a escola com a marca e a data, e o cartão
> dela deixa de oferecer cobrança — não se cobra uma escola que já não existe. A coluna da lista das
> apagadas passa a chamar-se **`Ações`**, no plural, e a regra está documentada em
> [IDENTIDADE-VISUAL.md](IDENTIDADE-VISUAL.md). E ficou medido o que **`Recriar` significa** (§8): a
> escola volta com os documentos enviados, **não** com as aulas, a turma nem as linhas de base.
>
> **Fotografia anterior (23/11/2026 — commits `edab6ae5`, `14d20091` e `3a29feee`: o expurgo da
> `breu` deixa de deixar restos).** Ela expurgou a escola e pediu «verifique se nada sobrou». O
> expurgo correu (`3ffa914f`: 267 arquivos no elo, 0 chaves no KV, o endereço morto), e ficaram três
> restos, nenhum deles sob um prefixo: o **derivado** continuava a dizer `expurgada: false` com 76
> registos que o repositório já não tinha — o workflow «Fechar os derivados» **falhou** no commit do
> expurgo, em `fatal: pathspec '*.fipp' did not match any files`, porque o expurgo levou a **última
> âncora** e um pathspec vazio é um erro (exit 128) e não um no-op; o **livro do financeiro** ficou
> com as 7 linhas da escola; e a **cache do monitor** guardava `"breu"`, porque o mapa só acrescentava.
> O derivado e a cache estão corrigidos, medidos e verificados ao vivo — o «Fechar os derivados»
> passou a verde **na mesma árvore sem âncoras** e a cache está `{}`. O livro era o terceiro, e a
> decisão de o limpar foi **invertida no mesmo dia** (ver a fotografia acima): as linhas ficaram, por
> decisão dela.
>
> **Fotografia anterior (22/11/2026 — commit `e73342a6`, o registo comercial que não se perde).**
> Ainda nesse dia, **o modal passou a deixar escrever**: os tempos e o compasso de cada exercício
> abrem preenchidos com o que o verbete declara e são editáveis — a música do verbete é a da escola,
> a da aula é decisão de quem a dá, e essas duas coisas estavam a ser a mesma. A secção «Música e
> vídeo de referência» do plano perdeu a lista derivada (é o campo da professora, não o repertório),
> e o **repertório do plano passou a acompanhar a Turma**: incluir um exercício no conteúdo chega ao
> plano, e daí ao diálogo que cria a aula. Medido nessa investigação: o «Battement fondu» **não** se
> pode incluir na `breu` — o menu só oferece os exercícios com notação nesta escola.
>
> **Fotografia anterior (22/11/2026 — commit `3673d403`, a música é a da escola).**
> Ainda neste dia, **a música deixou de vir das outras escolas**: o alfabeto guarda o registo do
> catálogo e o de cada escola, e a lista que alimenta o diálogo e a grelha tirava o dono e juntava
> tudo — o Battement jeté saía com duas músicas (a da `batata` e a da `breu`) e a tela pedia uma
> escolha onde a escola tem uma. E a música passou a **subir do verbete** quando a linha da sequência
> não a copiou: o §4 da Aula 02 dizia «nenhum exercício tem tempos e compasso» e passou a compor.
>
> **Fotografia anterior (22/11/2026 — commit `d562534a`).** Ainda neste dia, **a música no diálogo
> que cria a aula**: ele criava a aula com `Tempos` e `Compasso` vazios, e o §4 do documento saía a
> dizer «nenhum exercício desta aula tem tempos e compasso declarados na sequência». A música é do
> **exercício** e o verbete já a declara.
>
> **Fotografia anterior (22/11/2026 — commit `d562534a`, a aula que lê a aula anterior).** Ainda neste dia, **o diálogo que cria a aula passou a perguntar a música dela**: criava
> a aula com `Tempos` e `Compasso` vazios, e o §4 do documento saía a dizer «nenhum exercício desta
> aula tem tempos e compasso declarados na sequência» — medido na Aula 02 da `rosa`, publicada. A
> música é do **exercício** e o verbete já a declara: uma música → leitura; várias → escolha, e só
> as declaradas; nenhuma → à mão. **Tempos e compasso andam juntos**, e meio par é recusado.
>
> **Fotografia anterior (22/11/2026 — commit `49fb6f87`).** Ainda neste dia, **a aula que vem
> depois passou a ver o que a anterior deixou**: o §5 das aulas 02
> em diante ganha a coluna **Resultado na Aula N-1** (o nível que o professor marcou, agregado pela
> régua da turma — «1 de 2 em «Satisfatório» · 1 de 2 em «Razoável»»), e o §3.1 **«O que a aula
> anterior mostrou»** conta a presença em percentagem, o ânimo, o interesse e a harmonia, a data e a
> duração conferidas (OK / não OK), a sala, o plano seguido com a justificativa, a surpresa e o que
> aconteceu de novo. **A Aula 01 não tem nenhum dos dois** — não há anterior. O mesmo acto cortou
> duas repetições que ela apontou (o «Objetivo específico» do §1) e o botão redundante do §5, e deu
> a **toda** secção do documento um botão de colapsar e expandir.
>
> **Fotografia anterior (22/11/2026 — commit `e504f372`).** Ainda neste dia, **a aula passou a dizer
> quem a dá, em que sala e em que dia**: o §1 tinha o objetivo, o parâmetro, a duração e o volume, e
> nada de professor, sala ou data — e a data existia como lacuna declarada sobre uma fonte que a
> tinha. E o **§5 passou a levar ao formulário**: explica para que serve o guia, o que cada bloco do
> formulário pede, e leva lá com um botão.
>
> **Fotografia anterior (22/11/2026 — commit `a9a62ab1`, e a aula corrigida a seguir).** Ainda neste dia,
> **a aula deixou de dizer o que não é dela**: o §1 imprimia os três marcos do ciclo na Aula 01
> («cada aula tem o seu objetivo específico, ou seja, cada aula com o seu próprio marco») e o §5
> ensinava a matriz que o produto abandonou («✓ aconteceu · ~ parcial · …», texto fixo). O §1 passa
> a ler o marco **declarado** para aquela aula, e o §5 a nomear a **régua da turma**. E a escola
> `breu` continua a ser o campo de prova: os dois defeitos foram vistos no documento publicado.
>
> **Fotografia anterior (22/11/2026 — commit `a9a62ab1`).** Ainda neste dia, **a folha do menu deixou de
> ter uma altura fixa** («ela não cobre tudo na expansão, ela fica faltando um pedaço sempre»):
> medido a 1024×640, com os grupos abertos, 587px de conteúdo numa caixa de 499 — 88px de menu fora
> do fundo. A folha passa a medir o conteúdo, com o ecrã como único tecto, e o acordeão abandona o
> `15rem` por uma grade de uma linha, onde a altura é a do que está dentro. E **o painel inicial
> passou a empilhar** os quatro blocos numa coluna, como ela aprovou na bancada — o produto tinha-os
> em duas linhas e duas colunas.
>
> **Fotografia anterior (22/11/2026 — commit `d1127afd`).** Ainda neste dia, **o painel inicial ficou
> construído** — ela viu o modelo e respondeu «Quero a opção B», o número grande —, e ele conta o que
> interessa: alunas **ativas** (2 de 5 registos), professores **com o principal** (2), salas
> **vigentes** (1 de 23 encarnações), elencos pela **versão de hoje** de cada, modalidades pelas
> matrículas vivas. A **ocupação é a agenda** (aulas dadas sobre as previstas, lida do `ciclo` do
> pacote), e sem leitura o painel diz «—» em vez de zero. No mesmo dia, **a coluna dos Bastidores
> passou a abrir e a fechar a partir dos 769** — entre 769 e 1140 a coluna existia e o acordeão não,
> e o menu crescia para fora do ecrã («ele para ali no dicionário», medido: 671px num ecrã de 640) —
> e **o expurgo deixou de mentir no KV**: o elo da `calango` dizia `ok: true, restantes: 0` com
> **seis chaves vivas**, e o botão «Terminar a limpeza do KV» respondia «nada pendente». As seis
> foram apagadas; a `breu` não é acusada, porque foi recriada depois.
>
> **Fotografia anterior (22/11/2026 — commit `d85c42c1`).** Ainda neste dia, **Bastidores passou a ter um
> destino só**: a «cena» (o Estúdio de Dança) saiu — era um `<h1>`, um parágrafo e um link, e nunca
> teve conteúdo próprio — e a Produção **herdou o nome e o endereço**. Palavras dela: «Em bastidores
> a gente vai ter apenas a produção e tudo o que a gente já desenvolveu dentro dela. Só que nós
> vamos rebatizar a produção. A produção vai se chamar estúdio.» `/bastidores/estudio` serve a
> página com as dez secções todas dentro, e `/bastidores` e `/bastidores/producao` respondem **302**
> para lá, com a query — um favorito antigo chega ao mesmo sítio. O grupo «Produção» da coluna fica:
> é o BLOCO que continua dentro do estúdio. E o **modelo do painel inicial** — o novo ecrã de
> entrada — está em `experimentos/propostas/proposta-painel-do-estudio.html`, com os **números da
> escola viva** e a pergunta que só ela pode responder: «ocupação da sala» mede a **agenda** (aulas
> dadas de previstas — tem dado) ou o **corpo** (alunas sobre vagas — e vagas não existe: é campo
> novo na Sala)?
>
> **Fotografia anterior (22/11/2026 — commit `144115fc`).** Ainda neste dia, **a régua da turma passou a
> ser uma só** — e o corpo da folha de lançamento media-se por outra, chumbada no template
> (`ok / parcial / nao / nao_vi`). Palavras dela: «Nós temos duas matrizes, está errado isso. A
> régua da turma é só uma […] a parte do corpo está com uma régua que ela está chumbada no código.
> Está errado isso. Tem que ser a régua que foi definida lá pelo professor em bastidores.» A
> correção tem duas metades — a **declaração** (a coluna do corpo nasce `rubrica`, e o merge adopta
> o `tipo` derivado para os schemas já gravados deixarem de dizer `marca`) e a **página** (que,
> servida sozinha de um pacote de ontem, mede o corpo pela mesma escala que usa nos critérios). Uma
> folha inteira em marcas — o ciclo antigo — fica como estava. E **a escolha do plano de ensino
> passou a ter um só**: a excepção que deixava ficar o plano já apontado, dito «(versão anterior)»,
> punha dois planos com o mesmo objetivo no mesmo ciclo. Agora a lista segue a cadeia até ao topo,
> abre no vigente, e uma nota diz que a referência mudou. Medido em `provar-uma-regua-so` (**novo**,
> 17/17) e em `provar-estante-do-po` — que estava **morta desde o expurgo da `batata`** e **nunca
> esteve no repositório**; hoje corre, **33/33**, sobre a escola viva.
>
> **Fotografia anterior (22/11/2026 — commit `35d1c7fa`).** Nesta entrega, **o fluxo da Aula 02 ficou
> escrito e o expurgo ganhou um conferidor**. As duas perguntas dela eram «como é que nasce a aula
> dois» e «o expurgo atende o projeto?» — e a segunda **não admitia um sim**: o expurgo tem duas
> metades e só uma se mede daqui. A do repositório passou a ser medida por
> `escola/conferir-expurgo.js` (**novo**, só leitura, com o **mesmo** `escolaDosCaminhos` do
> expurgo — a autoridade sobre o que uma escola possui), e o resultado está na §9: `batata`,
> `calango` e `duo` com **0 arquivos**, **nenhum resíduo sem razão declarada** e o nome **livre**
> para criar; `breu` **viva**, com 266. O que fica depois de um expurgo fica por **três** razões, e
> as três são do desenho: o **elo** (a proveniência acrescenta, não edita), a **fixture** (dados
> sintéticos, ligados à *palavra* do nome) e o **índice derivado** (é saída). A metade do **KV**
> passou a ser consultada pelo mesmo leitor (`chavesDaEscola`), e quando não há token — ou a chave
> não autentica, que é o caso da que ela deu para este teste, **401**, 64 caracteres onde o
> Cloudflare usa 40 — o comando imprime **«NÃO MEDI o KV: <motivo>»**, nunca «está limpo».
> **Duas correções do mesmo dia, as duas dela:** o **nome da turma é escolha de quem a cria** — eu
> tinha escrito que a `breu` recriada precisaria de «outro nome», e isso não vem do código (o
> `criar-escola.sh` não olha para pacotes de turma, o `gerar-ciclo` escreve por cima, e a única
> recusa é a de duas salas vivas com o mesmo nome na mesma escola); e a **leitura** da metade do KV
> deixou de ser uma promessa para passar a ser um caminho provado (`--kv-de`). O fluxo, do zero à Aula 02, está em
> `ARQUITETURA-AULA.md` §4.5. Pelo caminho, **três provas vermelhas** passaram a medir o mundo de
> hoje: duas do expurgo (a lista de chaves cresceu de 9 para 16; a carência e a auditoria vêm antes
> da morada) e uma do índice do recorte (o bloco mudou de secção e de nome a 09/11 e a prova ficou
> treze dias a exigir o ecrã antigo). E uma frase deixou de afirmar o que ninguém mediu:
> `POST /api/apagar-escola` sobre uma escola **sem cadastro comercial** dizia «A escola está
> habilitada» — agora diz que não há cadastro, e recusa.
>
> **Fotografia anterior (21/11/2026 — commit `4809fb09`).** Nesta entrega, **a fonte do projeto é
> a Open Sans, e passa a ser ENTREGUE**. A alteração dela — `'Open Sans'` à frente na pilha —
> estava certa e **não era verdadeira**: não havia `@font-face`, nenhum `.woff2` no repositório e
> nenhum `<link>` para uma CDN, portanto o navegador só a usava se ela estivesse instalada na
> máquina de quem abre. Medido: nesta máquina está (`fc-list` → 13 cortes), e é por isso que
> parecia feito; num telemóvel caía no fallback, e o mesmo documento saía em duas fontes sem nada
> avisar. E a Georgia **nunca chegou a ser desenhada aqui** — `fc-match Georgia` responde `Noto
> Serif`. **DECIDIDO**: os dois `.woff2` (variáveis — um ficheiro desenha do 300 ao 800) vivem em
> `tools/templates/fontes/` com a licença OFL, viajam com a folha para `assets/fontes/` das três
> superfícies (pacote, raiz, pacote zero), e a ficha da anamnese aponta para o caminho **absoluto**
> porque é servida sozinha. **O fallback deixou de ser Georgia**: cai numa sans, que erra a favor
> de não parecer a fonte que não é. **CONFIRMADO** em `provar-a-fonte-do-site.js` (novo, **27/27**,
> com Chrome sobre o pacote real): o `.woff2` é pedido e chega com **200**, o `@font-face` está
> `loaded` com peso `300 800`, e a **largura da mesma frase** — 3022px em Open Sans contra 2544px
> numa serifa, a 100px — atesta que é a fonte que chegou que desenha, não a que a máquina já
> tinha. Com o ficheiro **recusado**, a página cai numa sans. **O PDF do ciclo não segue**: um
> `.woff2` não serve ao `pdflatex`, e papel e tela continuam em fontes diferentes — declarado, é
> a próxima peça desta frente.
>
> **Fotografia anterior (21/11/2026 — a Aula 02 existe de facto).** O caminho que faltava era o
> terceiro. O envelope `plano-20261121-1120` (o clique dela, já com a correção anterior no ar)
> **tem** `aula-2-parametro` e `aula-2-sequencia`: o motor gravou-as. O que não as recebeu foi o
> **manifesto**: com a turma no contexto, a escrita passa por `comporManifestoDaTurma`, e esse
> caminho **preservava** o `DOCS` como estava enquanto os outros dois o cresciam. **CONFIRMADO** em três cópias da mesma regra — `escrever-plano.js` (crescia),
> `compor-conf.js` (não crescia) e `escrever-ciclo.js` (crescia à mão). Sem `aula-02` no `DOCS`, o
> gerador não a publica, o derivador não a escreve e a coluna «Ação» continua a oferecer «Criar
> aula» para uma aula que já existe — que é exactamente o que ela viu. **DECIDIDO**: a regra é uma
> só (`docsComAsAulas`, em `aulas-do-ciclo.js`), e os **três** caminhos chamam-na; a família é
> reposta **em ordem numérica** (aula-01, captura-aula-01, aula-02, captura-aula-02), e não
> remendada. O manifesto dela foi regerado pela mesma regra a partir do envelope, as fontes
> `-aula-02.md` e `-captura-aula-02.md` foram derivadas, e o pacote publica `aula-02.html` com a
> linha «Abrir» na coluna «Ação». **CONFIRMADO** em `provar-manifesto-da-turma` (§9.1, nova) e
> `provar-criar-aula` **53/53**. E a **paginação** nasceu nas quatro listas que não a tinham —
> `/ciclos/planos/` e as três da Área do Professor — pela peça da casa, com a regra declarada: só
> aparece **a partir de duas páginas**, e é por isso que uma escola com 15 aulas não a vê.
>
> **Fotografia anterior (21/11/2026 — a aula 02 que ela criou e não existia).** Ela clicou em
> «Criar e gerar», leu «gravado. A aula 02 está a ser gerada», foi à lista de Aulas e **não
> encontrou nada**. E estava certo que não encontrasse: **a aula nunca foi criada**. **CONFIRMADO** no envelope `plano-20261121-0933` — o carimbo daquele clique —, que tem
> `aula-de-cada-objetivo` a apontar o objetivo 2 e **nem** `aula-2-parametro` **nem**
> `aula-2-sequencia`. **A CAUSA, e é de desenho, não de digitação:** a elicitação guarda as
> respostas cujo `id` o **conteúdo** declara (`prepararRespostas`, em `motor/nucleo/elicitar.js`),
> e o conteúdo do plano declara **uma** aula — o bloco «A Aula 1», com `aula-1-parametro` e
> `aula-1-sequencia`. As respostas da Aula 02 chegavam, não estavam na lista, e eram **descartadas
> em silêncio** — e sem `aula-2-sequencia` a regra que faz a aula existir diz que ela não existe, o
> `DOCS` não cresce, o gerador não a escreve e a lista não a mostra. **DECIDIDO**: o conteúdo
> declara a **família** (`aula-N-<campo>`, lida de volta por `lerChaveDaAula`), e o **número** é
> dado; o tecto é o `contexto-total-aulas` do próprio plano, e uma aula fora do ciclo continua a
> ser relatada como desconhecida. **E o gesto deixou de mentir** — três coisas que ela pediu,
> todas no mesmo sítio: o botão passou a dizer **«Criar»** («é confuso esses dois nomes para um
> usuário comum que não é de tecnologia»); **o véu** da casa (`LastroDaOperacao`) acende-se com o
> texto do processo, que é o que ela sentiu falta; e depois de mandar, o «Cancelar» vira
> **«Fechar»** e a janela fecha-se sozinha quando a resposta chega («não dá para ser cancelar
> porque parece que vai cancelar o processo»). A página **confere** o que o servidor relatou como
> descartado (`idsDesconhecidos`) antes de dizer «criada» — era a leitura que faltava, e é a guarda
> que teria apanhado isto no dia. **CONFIRMADO** em `provar-criar-aula` **52/52**, com a família
> desligada a cair em **3**.
>
> **Fotografia anterior (21/11/2026 — o que ela viu na tela).** Cinco defeitos, e nenhum deles era
> de gosto. **CONFIRMADO** em
> `provar-criar-aula` **39/39** e `provar-objetivos-por-aula` **55/55**. (1) **A coluna chama-se
> «Ação»**, e o «Abrir» passou a **botão**, com a estética do «Criar aula» ao lado — era um link
> cru: «Coloca como botão esse abrir para a gente manter a mesma estética». (2) **A coluna da
> tabela dos objetivos chama-se «Exercício», e a célula nomeia o exercício e liga a ele**
> (`aula-01.html#solo-plie-ob1`), não à secção dos exercícios da aula: as duas linhas do objetivo
> 01 — Solo e Barra — levavam ao **mesmo endereço**, e o professor que queria o de Barra tinha de
> o procurar sozinho. A âncora é **declarada no título do exercício** (`idDoExercicio`, com o
> número do objetivo porque o mesmo exercício serve o 01 e o 03) e lida da fonte — não é adivinhada
> por uma segunda cópia da regra do slug. (3) **O `404` do «Guardar e gerar»** — e a causa não era
> a rota: em produção só um **lista explícita** de `/api/*` é encaminhada para o motor, e as rotas
> da porta vivem debaixo dos prefixos dela. O caminho era `api/envelope/…` na raiz; passou a
> `/plano-ensino/api/envelope/…`. O sintoma que ela viu — `unexpected end of JSON input` — era a
> página a ler um corpo vazio de um 404. (4) **O modal passou a usar as peças da folha** (`.modal`,
> `.modal-fundo`, `.modal-caixa`, `.modal-acoes`, `.modal-x`, `.escolhas`/`.escolha`): era um
> `<dialog>` próprio com `<style>` inventado dentro da página gerada. (5) **A ordem dos botões** —
> «o botão cancelar ele fica do lado direito» — estava **escrita ao contrário** em
> `IDENTIDADE-VISUAL.md`, e um `provar` fixava a ordem errada: corrigiu-se a folha (com nota
> datada), as duas janelas do painel (`bastidores.js`, `painel-html.js`) e a asserção. **DECIDIDO,
> e por fazer:** nenhuma aula pode ser criada antes de a anterior ter os dados do formulário
> recolhidos — ela pediu para tomar nota e **não** construir agora.
>
> **Fotografia anterior (21/11/2026 — a aula nasce do calendário).** Nesta entrega, **a aula nasce
> do calendário**. Palavras dela: «a gente vai acrescentar aqui uma quinta coluna, que é a coluna do
> criar aula. […] É a coluna que vai criar o botão.» O calendário dizia **quando** cada aula
> acontece; o que não dizia era o que fazer com isso. **DECIDIDO**, e cada peça no sítio onde já era
> a verdade: (1) **a coluna** — `tools/calendario.py --criar-aula --aulas-prontas`, com o botão para
> a aula que não tem documento e a ligação para a que tem, o número em **dois dígitos** (`02`, como
> ela pediu) e a lista das aulas vinda do `DOCS` do manifesto; (2) **a regra que faz a aula existir**
> — a aula existe **quando o plano declara a sequência dela** (`aula-N-sequencia`), derivada do dado
> e não pedida a ninguém, numa função só (`aulasDeclaradasPeloPlano`) que serve os três sítios que
> precisam dela (o manifesto do plano, a lista de fontes a derivar e o `DOCS` do ciclo); (3) **o
> gesto** — o botão abre um diálogo na página do plano que recolhe o que falta para aquela aula (o
> objetivo/marco, os **exercícios** que o trabalham e os **blocos** onde acontece) e manda gravar por
> `POST /api/elicitar` com o plano anterior como `ajuste_de`, pelo caminho que já existia — **sem
> rota nova, sem escritor novo, sem segunda cópia da cadeia**; a sequência é o **cruzamento** entre
> blocos e exercícios, que é o modelo que o plano já tem. O diálogo **não** pede duração, volume,
> bloco da aula nem régua: são do ciclo. A data **não é copiada** — o botão traz só o número, e o
> script lê a data da linha da tabela. `?criar-aula=02` abre a caixa pelo endereço. **CONFIRMADO** em
> 21/11/2026: `provar-criar-aula` **38/38**, com a regra desligada a cair em **8**; e a secção F abre
> a página num Chrome de verdade e confere a caixa aberta, o marco preenchido, a data · dia ·
> duração da linha, os quatro exercícios e os quatro blocos. Ver `REGISTRO.md` (21/11/2026) e
> `ARQUITETURA-AULA.md` §4.4. **O que continua por fazer**: `Tempos` e `Compasso` nascem **vazios**
> no documento da aula nova — o lugar deles é o verbete do exercício, e é a próxima peça.
>
> **Fotografia anterior (21/11/2026 — o derivador por aula).** Nesta entrega, **o derivador passou a
> escrever a aula que lhe pedem**, e não sempre a primeira. `derivarAula01` chamava-se assim e o
> nome era literal: escrevia `aula: "01"`, «Plano para a Aula 01», lia `aula-1-sequencia` e
> `aula-1-parametro` à mão, e a §8 mandava sempre para a **Aula 02** — na Aula 03, **para trás**,
> para um marco que já foi dado. **CONFIRMADO**: o par da Aula 01 estava escrito à mão nas duas
> listas de fontes (o Worker e o `regerar-derivados.js`), e um ciclo que ganhasse a Aula 02 não a
> punha em dia por ali — a aula estava no `DOCS`, o gerador ia buscá-la, e não a encontrava.
> **DECIDIDO**: `derivarAula({ nn, … })`, com `derivarAula01` como o caso `nn = '01'` — um
> derivador só, porque duas derivações da mesma regra divergem ao primeiro caso novo; o número
> decide o `aula:`, o título, o objetivo (o marco NN, Regra 2), o parâmetro, a sequência e o
> «próximo passo»; o que **não** entra no número é o que é do ciclo (duração, volume, blocos,
> condições, guia, proveniência, auditoria); a chave leva o número **sem zero à frente**
> (`aula-2-sequencia`, e `aula-1-parametro` para a primeira — renomeá-la renomearia a resposta de
> todos os planos gravados); e a **lacuna não se herda** — a Aula 04 de um plano de três marcos
> declara a lacuna e **nomeia a chave que falta**, sem copiar a sequência da Aula 01, porque herdar
> atribuiria a esta aula o que foi respondido para outra (quem reusa é o formulário, com a pessoa a
> confirmar). **CONFIRMADO** em 21/11/2026: `provar-derivador-da-aula` **35/35**, e com o derivador a
> escrever sempre a primeira caem **14** das asserções; e a `-aula-01.md` e a `-captura-aula-01.md`
> da `breu-rosa`, derivadas pelo código do `HEAD` e pelo de agora **com os mesmos argumentos**, saem
> **idênticas** byte a byte — a generalização não mexeu no que está no ar. Ver
> `ARQUITETURA-AULA.md` §4.3 e a entrada de 21/11/2026 no `REGISTRO.md`. **O que continua por
> fazer**: o botão de criar a aula seguinte — o gesto que acrescenta a aula ao `DOCS` e recolhe as
> respostas dela.
>
> **Fotografia anterior (21/11/2026 — a aula que já foi dada não se reescreve).** Nesta entrega, **a
> aula que já foi dada deixou de poder ser reescrita por uma regeneração**. A regra é dela, e a
> letra é esta: «regenerar o ciclo afecta só a aula que ainda não foi dada; as outras ficam e não se
> apagam». **CONFIRMADO** que
> a regra não existia em lado nenhum: o `-aula-01.md` e a `-captura-aula-01.md` estavam escritos à mão
> na lista do `escrever-ciclo.js`, **sem condição** — e o «Guardar» do PO, que é o gesto da cascata do
> elenco, regera o ciclo inteiro. Corrigir o elenco hoje reescrevia o plano de uma aula que já tinha
> acontecido, mandava a versão verdadeira para `historico/` como elo, e o diff de proveniência passava
> a apresentar como **mudança do professor** uma mudança que ele não fez — que é a `P-03` violada no
> ponto exacto em que a cadeia de custódia é lida. **DECIDIDO**: o facto que tranca uma aula é o
> **registro do lançamento** (`aulas[NN]` no `-dados.json`), e não o juízo
> `planejada`/`dada`/`lancada`/`nao_dada` — esse depende de um relógio, e um derivador não tem relógio
> nem deve ter (é o mesmo critério que o índice já usa desde 15/11: guarda «o facto, não o juízo»). A
> regra vive **num sítio só** (`motor/nucleo/aulas-do-ciclo.js`) e serve os **dois** caminhos que
> regeram um ciclo: o Worker e o `tools/regerar-derivados.js` — duas cópias divergem ao primeiro caso
> novo. **CONFIRMADO** em 21/11/2026: `provar-aula-dada` **34/34**, com a regra desligada a cair em
> **10** asserções e o dano escrito no relatório (o plano e a folha a ir para `historico/`); e a
> `provar-um-commit-por-guardar`, que estava **5/21** já no `HEAD` por medir contagens escritas à mão,
> foi consertada pela **relação** e por **nome** — **22/22**. Ver `ARQUITETURA-AULA.md` §1.3 e a
> entrada de 21/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (15/11/2026 — as saídas do pacote deixaram de se carimbar).** Ela: «não tem
> sentido ficar carimbando toda hora. […] Se já foi comitado,
> se já subiu, não tem por que fazer de novo se não teve modificação». **CONFIRMADO**: o que havia era
> um laço sem ponto fixo, e não um carimbo lento — a data que o pdfTeX grava vinha de `git log` sobre a
> **pasta** do ciclo, e essa pasta contém as saídas que o gerador escreve: gravar o `ciclos.json` movia
> a data que o reescrevia. A data passou a ser a **de início do ciclo** (do calendário, portanto das
> fontes), o `gerado_em` saiu do índice e o `estado` do `aulas[]` também — o juízo calcula-o quem tem um
> *agora*, e era o que o formulário já fazia. A **proveniência não se mexeu**: os quatro `.fipp`
> verificam-se com o **mesmo hash**, e a cobertura declarada nunca incluiu o índice. **CONFIRMADO** em
> 15/11/2026: `provar-saidas-estaveis` **13/13** — duas gerações byte a byte iguais, também **depois**
> do commit —, controlo negativo **4/4** a confirmar o defeito de `HEAD`, `check-pacote` 0/0 nos quatro
> pacotes, e `gerar-indices --check` e `gerar-relacoes --check` em dia. O que **não** se mexeu: os
> `indices/` continuam com `gerado_em` e `fonte.commit` — ali o `--check` já os ignora por desenho, e
> fica declarado como dívida. Ver a entrada de 15/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (13/11/2026 — a listagem deixou de ser a proveniência).** Ela relatou que a
> correção de 12/11 (a autoria não se reescreve) deu certo e trouxe à tona o que já estava resolvido:
> as versões derivadas continuavam **empilhadas** por cima do plano vigente. **CONFIRMADO e medido** no acervo do `calango`: **18 planos numa só cadeia davam 5 linhas**
> na turma `Piano` — e o PO, 20 → 6 —, três delas **órfãs**. **DECIDIDO por ela**: a listagem mostra
> **o mais recente de cada professor** («dois planos mesmo, que é o do pé torto e o da redinha»), e o
> resto é proveniência, contada na linha do vigente. O grupo é **a raiz da cadeia + o professor** — a
> raiz, e não o nome da turma, que mudou no meio desta cadeia (`Rosa` → `Piano`) e por isso não pode
> parti-la em duas linhas. O que **não** mudou: o documento de quem escreveu continua à vista, e o
> «!» e o `sem turma` continuam a cair nas linhas certas. `provar-uma-linha-por-professor` **23/23**,
> com controlo negativo (a regra anterior dá 6). Ver a entrada de 13/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (12/11/2026 — o desenho do agente: documentação, sem código).** Nesta entrega, **o agente do Lastro ganhou
> desenho, plano e uma decisão fechada** — e não ganhou uma linha de código. A decisão: **Llama da
> Cloudflare** (Workers AI, `@cf/meta/llama-3.1-8b-instruct-awq`), **sem API externa**;
> arquitetura **MCP + busca estruturada**, e **sem RAG**, porque 100 % do que o agente consulta é
> chave-valor com `id` estável. O desenho completo está em
> [ARQUITETURA-AGENTE.md](ARQUITETURA-AGENTE.md) — oito ferramentas com contrato em JSON Schema, o
> prompt de sistema em oito blocos, os tectos do laço e ≈23 dias de estimativa (eram ≈20,5 antes das
> respostas abaixo). **As quatro respostas dela, no mesmo dia, fecharam o resto:** o painel começa nas
> **quatro** superfícies — plano de ensino, PO, Estilo **e a elaboração da aula N** —, e a quarta
> **não tem tela hoje** — pendência **já declarada** na §8 e medida há muito (`PLANO-NAVEGACAO.md`
> §9.2 propõe a lista e declara-a não feita) —, pelo que o painel entra nas três que existem e a
> quarta **espera a tela**; a sequência também é decisão dela: **testar e ajustar o que existe
> primeiro**, e a aula 2, 3, … N depois; **a anamnese saiu** da lista, por não ser redação pedagógica; **o crédito é o Neuron**;
> o agente **pode citar o apelido** (apelido e só apelido, P-12); e **antes de subir para o 70B
> aprimora-se** — a escada prompt → exemplos → ferramentas → amostragem, cada degrau medido com os
> mesmos 20 casos, e o 70B só depois, declarando o que já se tentou. **E o documento foi revisto por
> fora, e a revisão mudou contratos:** o contexto passou a ser **dois** (interface × autorização), e o
> furo que isso expôs é o item que importa — `ler_envelopes` **não recortava por professor**, num
> Worker cujas rotas `GET /api/envelopes` e `/api/envelope/:id` **não pedem senha** — o freio é
> `temProfessor(env)`, que não pergunta quem lê: dava a **estante inteira da escola** num pedido
> (§4.1, §5.2, agora corrigido, com o recorte do servidor e de graça); o schema do
> formulário vai **recortado pelo servidor** e **não inteiro**, porque o do PO são 27.538 B ≈ **77
> Neurons por interação** contra os ≈86 da interação toda (§4.2); a proveniência do documento
> (`ancora`, `gerado_em`, `ajuste_de`) vai na saída e **já existia** no envelope (§5.2); a **seleção**
> das ferramentas ganhou uma prova própria, porque a bancada com `env.AI` falso **não a mede** — e
> custa ~1.720 Neurons por passagem (§9.4); e as **quatro ausências** (não existe · vazia · não se
> aplica · indisponível) passaram a ser distintas, porque o código de hoje **funde** duas delas em três
> `catch` medidos (§5.10). Estimativa ≈23 → **≈25 dias**. **E a identidade do professor na Porta está
> decidida** (12/11/2026, opção (c) da §4.1): o painel usa o **professor declarado** e **declara-o na
> tela** — `.caixa.nota`, *«A Porta não identifica quem escreve»* —, e o recorte por professor fica
> sendo **aviso, não fronteira**; o identificador **vem depois** e depende de **L2**. Fica declarada,
> por medição, uma dívida **anterior** a esta frente: `GET /api/envelopes` e `/api/envelope/:id` são
> públicos dentro do Worker da escola, e o recorte do agente **não os fecha**. **CONFIRMADO que
> nada está implementado:** não há binding `ai` em nenhum `wrangler.<escola>.jsonc`, não há
> `motor/servidor/agente.js` nem `mcp.js`, não há rota. O que **mudou** foi a documentação: a
> frente **L15** nasceu no `PLANEJAMENTO-LASTRO.md`, o **§L7** (que dizia que a IA «não é mecanismo
> de consulta aos registos») ganhou nota datada de superação parcial, o **A3** do `FRENTES.md` foi
> anotado, e o stub `motor/nucleo/ia.js` ganhou a nota de obsolescência no cabeçalho **sem que uma
> linha de código mudasse**. Três achados que não estavam no pedido: o **contador de subpedidos não
> vê o KV** — e a Cloudflare conta KV como subpedido (`motor/servidor/subpedidos.js` embrulha só o
> `fetch`), dívida herdada do §5.26; o **rebuild do índice custa 14 subpedidos** medidos (1 árvore +
> 3 índices de escola + 1 de envelopes + 9 `.fipp`), contra **1 leitura de KV** com cache quente; e
> **10.000 Neurons/dia são da conta, não da escola** (≈116 interações/dia pela tabela de preços de
> 12/11/2026). `check-identidade` **8/8 ok**; nenhum deploy. As entregas de 11 e 12/11 (a autoria na
> troca de professor, o elo que já está trocado, o «!» da listagem) estão no `REGISTRO.md` e **não
> são reescritas** aqui. Ver as entradas de 12/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (10/11/2026 — a ordem da decomposição e a duplicação de uma linha).** Nesta entrega, **a decomposição passou a seguir a
> ordem em que foi escrita, e a duplicação passou a ser de uma linha**. Ela escreveu *frente, ao
> lado, atrás, ao lado* e viu a tabela reagrupada por direção — **CONFIRMADO e medido**: `celulas` é
> um mapa com a direção por chave, e um mapa não guarda a ordem entre gavetas; a mesma iteração
> existia no motor, e por isso o documento publicado tinha a mesma ordem. **DECIDIDO**: a ordem passa
> a ser **declarada na célula** (`ordem`), escrita pelo editor quando o trecho nasce, e uma só leitura
> (`ordemDasCelulas`) serve a tabela, a prévia, os compassos e o documento. **O que já estava gravado
> não muda de ordem** (P-03/P-04): a célula sem `ordem` recebe a posição antiga e o documento
> publica exactamente o de hoje. E o **«Duplicar o exercício» saiu** — duplicava as seis linhas
> quando ela queria uma; o botão passou a ser o de cada linha, e a cópia vai para o **fim**, com a
> ordem maior. `provar-ordem-e-duplicacao` **31/31**, com controle negativo. Ver a entrada de
> 10/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (10/11/2026).** Nesta entrega, **o passo 1 do Estilo procura no
> vocabulário**. Ela contou o que fazia para começar um verbete de um exercício que já existia —
> inventar um nome, uma categoria e a letra «T» para destrancar o passo 2 — e chamou-lhe
> **«burlar»**. **CONFIRMADO e medido**: `oQueFaltaNoPasso1` lia o nome escrito como «exercício
> novo» e **fechava o passo 2**, que é onde os exercícios existentes se escolhem; o único campo que
> pergunta «que exercício é este» trancava a porta para o responder. Agora o campo **procura**
> enquanto se escreve (sem acentos, por prefixo e por semelhança), um nome que casa **preenche** a
> categoria, a tradição e a definição, **escolhe** o exercício e **mantém o passo 2 aberto**; um nome
> inédito mantém os três campos abertos e obrigatórios; e o exercício que já existe **não volta a ser
> criado**. **DECIDIDO por ela — reversão declarada**: a categoria e a tradição deixam de ficar
> congeladas (era esta regra o impedimento), e o ajuste vale para o verbete, não para o termo. O
> rótulo do passo 1 passou de «O exercício novo» a «O exercício». `provar-busca-do-exercicio`
> **68/68**. Ver a entrada de 10/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (10/11/2026).** Nesta entrega, **o histórico do ajuste diz a mudança, não
> duas fotografias**. Ela perguntou para que servia o bloco «versões anteriores» do cartão — e a
> resposta expôs quatro defeitos: o rótulo `2 versão(ões) anterior(es)`, duas linhas para comparar
> de olho, a data em **dois formatos** (o bloco era um por lista) e o motivo **ausente** do cartão
> (só no log da cadeia). **DECIDIDO** — por ela — manter nos dois sítios, com o rótulo em português
> corrente, a **diferença** calculada («ter, qui: 18:00 → 19:00»), a data em BR nos dois, e o motivo
> gravado **no elo** num campo opcional. O elo **não herda** a razão do ajuste anterior — é o
> defeito que o `Object.assign` da derivação criaria, e está provado nos dois sentidos.
> `provar-historico-do-ajuste` **39/39**. Ver a entrada de 10/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (10/11/2026).** Nesta entrega, **a faixa de 1141 a 1919px deixa de ser
> território sem prova**: ela mudou a resolução do monitor de 1920×1080 para 1366×768 e a listagem
> ficou «acavalada» — **CONFIRMADO e medido**: a `.secao` dava ao formulário os 544px inteiros (o
> tecto funcionava como piso) e ao nome da linha sobravam **163px a 1366**, contra 338px a 768
> (telemóvel). O formulário passa a ceder primeiro (`min(34rem, 38%)`) e o nome ganha piso de
> `11rem`. **A tela larga não mudou**: a 1920 o formulário mede 544px e a listagem 1115px, como
> antes. `provar-largura-da-lista` **56/56**, com controle negativo. Ver a entrada de 10/11/2026 no
> `REGISTRO.md` e a secção «A faixa que ninguém media» do `IDENTIDADE-VISUAL.md`.
>
> **Fotografia anterior (09/11/2026, `da8085fe`).** Nesta entrega, **a mudança de sala
> entra na cadeia** — o ritmo é relido da Sala no elo novo do plano, o plano fica marcado «a rever»
> quando a Sala mudou depois dele, os desacordos entre plano e sala chegam à tela, e as duas rotas
> da Sala disparam a travessia. **E uma sala passa a receber UMA Turma**: até aqui, duas curadorias
> activas com a mesma Sala respondiam `201` (medido), e a Sala é o ritmo — duas Turmas nela são duas
> aulas no mesmo horário. A vigência futura do elo continua a **não** ser respeitada, por decisão.
> Ver a entrada de 09/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (09/11/2026, `9ed67911`).** Nesta entrega, **a troca e a saída
> deixam de ser «via crucis»** — a cadeia automática percorre `vínculos → plano de ensino → plano de
> observação → pacote` nos três gestos que mudam o corpo ou a direção de uma turma (transferir uma
> aluna, concluir o elenco, derivar a curadoria). **É uma reversão declarada**, por ela, da regra
> anterior («não por um botão que dispara tudo»): a automação preserva as respostas, acrescenta elos
> com `ajuste_de`, não decide pedagogia, só corre em registos com o fluxo completo e pára na
> primeira etapa que não fecha, dizendo o que falta com o link de cada etapa. O log das travessias
> lê-se em `GET /api/bastidores/cadeia`. Ver a entrada de 09/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (09/11/2026, `9ed67911`).** Nesta entrega, **a listagem de
> elencos da Audição ganha o filete pontilhado** que as outras listas já tinham — Estilo, Salas,
> Professores, Alunos — e que ali era **apagado** por uma regra de «reset» da própria página
> (`.lb-cartoes>li{border-bottom:0}`). A linha passa a vestir o mesmo fio e o mesmo respiro de
> `.lista li`, que é o padrão da «Exercícios com verbete»: `1px dotted var(--borda-campo)` e
> `padding: .35rem .1rem`. O cartão (`.trio-plano`) e o respiro entre cartões não mudam. Ver a
> entrada de 09/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (09/11/2026, `1691cc86`).** Nesta entrega, **o «Cancelar» da
> edição de elenco fica direto** — o rótulo passa a «Cancelar», como o da Turma, e a caixa de
> confirmação sai: um clique descarta o rascunho no servidor e fecha o formulário. E **a derivação
> de turma passa a aceitar um par novo**: o professor e a modalidade ficam editáveis no «Derivar»
> (continuam travados no «Editar»), e a rota `curadoria-derivar` confere e grava o par final —
> habilitação do professor, aluna repetida na modalidade e unicidade do trio. Ver a entrada de
> 09/11/2026 no `REGISTRO.md`.
>
> **Fotografia anterior (09/11/2026, `e967e2f2`).** Nesta entrega, **a transferência
> de aluna deixa de se perder no rascunho** — o defeito que ela viu na produção: a rota gravava as
> duas versões no repositório e não tocava no rascunho do KV, que é o que a listagem mostra por cima
> do acto; a contagem mentia nos dois elencos («tami — 2 alunas» com a aluna já no destino) e o
> «Concluir elenco» seguinte **desfazia** a transferência. Três correções: o rascunho acompanha o
> acto (`transferencia.ajustarRascunho`, que move a aluna na lista que o rascunho já tem e preserva
> o trabalho a meio); dois actos no mesmo minuto deixam de ser o mesmo ficheiro (`carimboLivre` —
> `…-2144`, `…-2144-2`), que era o `append-only` a ser contrariado em silêncio; e repetir uma
> transferência que os actos já dizem responde `ok` com `jaEstava` em vez de recusar. Entra também o
> **«Cancelar a edição»**, que existia na marcação desde 05/11 e **nunca aparecia** — e que agora
> descarta o rascunho **no servidor** (rota nova `/linha-de-base/descartar`: descartar não é apagar,
> o acto fica). Ver a decisão 128.
>
> **Fotografia anterior (09/11/2026, `49d6eef1`).** Nesta entrega, **a Audição
> ganha a segunda passagem** — os cinco ajustes que ela pediu depois de ver as abas no ar: o
> **respiro entre os cartões do elenco** (a regra da página vencia a margem da folha e as caixas
> encostavam; o vão passa a ser o da anamnese, porque é o mesmo `.trio-plano`, **medido no
> navegador** e com A/B); o **«Concluir elenco» limpa o formulário** (o id sai, e a gravação
> seguinte já não edita por engano o que acabou de ser criado); o **«O que já é bom» também
> dobra** (os quatro blocos de achados, e o parâmetro `dobrar` morreu com a exceção); a **aba 3
> viva** (a lista e a deteção de dois elencos atualizam-se do `carregarLinhas`, sem F5, e a
> transferência relê a lista em vez de recarregar a página); e a **ordem do acto** na
> transferência — origem → alunas **dela** → destino (sem a origem e sem os elencos que já têm a
> aluna) → motivo. Ver a decisão 127.
>
> **Fotografia anterior (09/11/2026, `03022b9b`).** Nesta entrega, **a Audição
> passa a ter três abas**: «Escolha de elenco» (o fluxo atual, inalterado), «Recorte» (o índice
> que antes ficava empilhado abaixo da lista; o rótulo foi corrigido no mesmo dia — nasceu como
> «O que os recortes olham», que era descrição e não nome) e «Transferência» (mover uma aluna
> entre elencos). A **listagem fica fora dos painéis** — é ela que tem de permanecer visível nas
> três —, a faixa dos quatro passos só existe na aba 1, e no telemóvel (≤560px) a tira dá lugar à
> pílula **«Abas»** que sobe uma folha, a mesma peça do «Ações» da anamnese. O passo 3 chama-se
> **«Anamneses»** e o estado concorda (**«lidas»**), e os blocos de **trabalho**, **musicalidade** e
> **o que o grupo tem em comum** passam a dobrar (`details open`; o «O que já é bom» fica como
> estava, porque não foi pedido). Na transferência, o **destino nasce vazio e nunca é a origem** —
> o cliente reescreve a lista quando a origem muda, e o núcleo continua a recusar `de === para`.
> Sinalizado por ela, e registado no `REGISTRO.md`: o bloco de transferência (08/11/2026) foi
> **além do pedido** — o agente do VS Code implementou-o sem ter sido solicitado. Ver a decisão 126.
>
> **Fotografia anterior (08/11/2026, `f8da8bc5`).** Nesta entrega, **a aluna que sai
> do elenco deixa de se ler «nova»**: o selo da anamnese e o da lista de pessoas respondiam só ao
> presente, e o presente de quem saiu é vazio — vazio lia-se «nunca esteve aqui», que é falso e
> apaga a história de quem já foi observada. Entra o quarto estado, **`desligada`** — **DERIVADO**
> (`desligamento.estadoDaAluna`: fora de todos os elencos vigentes, fora de todas as Turmas
> vigentes, **e com rasto** de que já esteve: um PO, uma Turma substituída, ou uma transferência),
> com a classe `legado` da folha e o mesmo vocabulário do professor desligado. **O gesto não muda**:
> o «Excluir» do cadastro continua (é limpeza), o «Novo registo» continua, e a anamnese continua
> travada enquanto um PO a declarar. **O mesmo pensamento vale para o professor**, e ele media-se
> errado do outro lado: `professorCurado` perguntava a **todas** as curadorias — inclusive às
> **substituídas** —, e por isso quem passava a turma a outro ficava «curado» **para sempre**, com
> o «Excluir» travado por um trabalho que já não era dele. Entra o quarto selo dele, **`sem turma`**
> — **DERIVADO** (`desligamento.estadoDoProfessor`) —, e `professorCurado` passa a contar só as
> vigentes. Não se chama `desligado` de propósito: essa palavra é sair da **escola**. E o **fluxo de
> mudança de sala** de uma turma foi documentado e **avaliado**: atende ao registo (`turma-derivar`,
> mesmo nome, conteúdos migram) e **não atende à cadeia** (a cascata não vê a Sala; `vigenteDe` é
> declarado e não respeitado). Ver a decisão 125 e o §3.3 do `ARQUITETURA-GERAL.md`.
>
> **Fotografia anterior (08/11/2026, `ea2c558c`).** Nesta entrega, **o
> «Guardar» do PO deixa de morrer a meio**: o Cloudflare corta em **50 subpedidos por invocação** (e
> no plano gratuito o `limits.subrequests` não sobe), o caminho do «Guardar» gastava mais — **26 só
> no escritor do ciclo**, medidos —, e a invocação morria **depois** de gravar o `-po.md` e **antes**
> de gravar as fontes: o pacote ficava com dois POs a discordar. O escritor desce a **16** (o
> conteúdo viaja na árvore, o elo pergunta à pasta em vez de arquivo a arquivo), o orçamento passa a
> ser **um só por pedido e contado**, e quando não cabe ele **recusa antes de escrever**. E a porta
> ganha o **véu da operação** — cobre, tranca (`inert`) e diz o passo até a geração terminar —, que
> é o que ela pediu duas vezes. Ver a decisão 122 e o §5.26 do `ARQUITETURA-GERAL.md`.
>
> **Fotografia anterior (08/11/2026, `ea2c558c`).** Nesta entrega, **a
> aluna que SAI do elenco passa a sair da aula — e o que ela já lançou continua legível**. A cascata
> que ela descreveu (`elenco → plano → PO`) **já existia**; o que não existia era o resto: `derivarDados`
> escrevia `aulas: {}` em toda a geração, e a geração é disparada pelo «Guardar» do PO — exactamente o
> gesto que a cascata exige. Tirar uma aluna e regravar o PO **apagava as aulas lançadas** da fonte,
> que só sobreviviam num elo de `historico/` que ninguém lê. Passa a haver três campos com três
> sentidos: `elenco` (quem se oferece hoje), `apelidos` (nomes de hoje **mais** os de quem já foi
> lançada) e `aulas` (preservadas). Ver a decisão 121 e o §5.25 do `ARQUITETURA-GERAL.md`.
>
> **Fotografia anterior (08/11/2026, `a5f89d85`).** Nesta entrega, **a
> anamnese da aluna que entra no elenco deixa de ficar «livre»**: o vínculo que a protege (não se
> edita, não se apaga) passou a ler o **elenco da turma que o Plano de Observação observa** — a linha
> de base —, e não só o `sujeitos` do PO, que é a herança do dia em que ele foi gravado. Medido na
> `batata`: a Aluna B entrou no elenco depois do `po-…-2211` e o documento derivado já a observava,
> enquanto a etiqueta dizia «livre» e as rotas de editar e apagar respondiam **200**. Passa a
> **409**. Ver a decisão 120 e o §5.24 do `ARQUITETURA-GERAL.md`.
>
> **Fotografia anterior (07/11/2026, `abf7bc8e`).** Nesta entrega, **quatro ajustes de
> Pedagogia, todos de rótulo, arrumação e fronteira — nenhum de modelo**: «Elenco» passou a
> **Audição** e «Verbetes da notação» a **Estilo**; os cinco elementos basilares passaram a **um
> bloco** no passo 4 (catorze blocos a dez, os mesmos 45 aspectos), o quadro do recorte virou
> **acordeão que nasce fechado** a carregar **três a três**, e o cartão do elenco ficou com **duas
> caixas** (alunas e recorte); e **o Bloco 10 saiu do plano de ensino** — «Aspecto físico — o corpo»
> deixou de se perguntar porque a Audição/Elenco já o declara e o Plano de Observação já o observa,
> com a secção «## Aspecto físico» a sair também do documento derivado e os blocos renumerados
> (1..11, sem falhas). Ver a decisão 119.
>
> **Fotografia anterior (06/11/2026, `d1901268`).** Nesta entrega, **o lançamento da
> aula deixou de ir para o KV** — que ninguém lê — e passou a gravar o `-dados.json` canónico no
> repositório, **fundindo por aula** e **disparando a geração**. A causa do relato dela («a tela
> disse lançada, e ao recarregar não havia aula nem caderno») era de uma linha: o armazenamento
> roteia pela FAMÍLIA da chave, e o lançamento não tinha família. O que já estava no KV não se
> perdeu: `POST /api/lancamentos/consolidar` resgata-o, e **dispara a geração** do pacote certo.
> E o `deploy-raiz` deixou de ser travado pelos pacotes das escolas
> (`check-identidade --sem-pacotes`). O «título solto» que ela viu na barra era o **comentário do
> código** a ser lido como `<h1>`: `tituloDaPagina` passou a descartar comentários, como já
> descartava `<style>`/`<script>`. Ver a decisão 118.
>
> **Fotografia anterior (06/11/2026, `28dfacde`).** Nesta entrega, **o mapa de relações
> do ciclo nasceu** (`tools/gerar-relacoes.js` → `indices/relacoes/<prof>/<NN>-<variante>.json`):
> **48 nós, 55 arestas, 0 lacunas** no ciclo real, e cada aresta **nomeia o campo que a produziu**.
> O mapa **não nomeia aluna nenhuma** — a verificação 7 do `check-indices` obrigou a corrigir isso, e
> a correcção foi a certa: a pessoa entra na cadeia pela **anamnese**, cujo carimbo é livre de nome.
> A cronologia, com os dois erros de direcção que o gerador pôs a descoberto, está no `REGISTRO.md`.
>
> **Fotografia anterior (06/11/2026, `ca2b4055`).** Nesta entrega, **o lançamento de aula deixou de
> ser um formulário de prosa e passou a ser uma MATRIZ** — as alunas por linha, os aspectos por
> coluna, 14 marcas por aluna e todas com dono —, **o índice de lançamentos nasceu** com a chave que
> faz a marca atravessar as aulas, e **a arquitetura de índices ficou escrita no
> `ARQUITETURA-GERAL.md` (§7.3)**, junto da resposta medida à pergunta «grafos ou índices?» (§7.4).
>
> **Fotografia anterior (05/11/2026).** Nesta entrega, **nasceu o índice do recorte** —
> o ranque do que os professores olham no corpo, os aspectos que ninguém escolhe, e os **pontos
> cegos** do olhar. (Ver as passagens de 05/11/2026 mais abaixo, na ordem em que foram escritas.)
>
> **Fotografia anterior (04/11/2026).** Nesta entrega, **o Plano de Observação passa a
> poder apagar-se**, e **o menu dos formulários ganha bancada**. (1) A linha do PO oferecia só
> «Ajustar»: não havia estado, nem botão, nem rota. Agora há o trio — `estadoDoPo` no núcleo (o PO é
> `solta` ou `legado` conforme tenha sucessor), `DELETE /api/po-vinculo/:id` com **409** quando
> derivado, e o botão «Apagar» na listagem. **A assimetria com o plano é do domínio**: nada
> referencia um PO — o ciclo gerado guarda a sua cópia —, por isso não existe aqui a trava «está
> vinculado». (2) Bancada nova `provar-menu-do-formulario` (**36**, Chrome): a primeira a medir a
> barra e a coluna **com o menu aplicado** — as outras servem a porta crua, sem `<nav>`, e é por isso
> que nunca viram o defeito. (3) **A causa dos dois sintomas de menu: `:has()`.** O layout da coluna
> dependia de `body:has(> .coluna)`, e o Firefox só a teve na 121 — o ESR 115 não a tem. Sem ela, a
> barra fica em `left: 0`, a coluna (`z-index: 21`) cobre-lhe os primeiros 248px e **o primeiro item
> do menu deixa de receber o clique** (medido: o `elementToPoint` devolve a marca da coluna). O
> `nav.js` passa a escrever `data-tem-coluna="sim"` no `<html>`, e a folha ganha as mesmas regras em
> **regras separadas** — pô-las na mesma lista de seletores faria o navegador sem `:has()` descartar
> a lista inteira, remendo incluído. Prova: `provar-menu-do-formulario` **40** (secção E, com
> controlo negativo: removido o atributo, o defeito volta) e `provar-apagar-da-listagem` **43**.
>
> **Entrega anterior** (árvore limpa). Nesta entrega, **os dois planos passam a ter
> dois nomes**: o do ciclo é «Plano do Ciclo NN» e o de cada aula é **«Plano para a Aula NN —
> objetivo»**, nas três superfícies que o mostram (o `<h1>` do documento, o cartão da listagem e o
> registo da geração). O documento mestre **já existia** — «Ciclos · Planos» abre-o direto, sem
> listagem encadeada —, e a redundância que parecia haver entre plano e aula é, medidamente,
> **derivação**: uma só linha era cópia literal (o *bullet* das condições preliminares). Objetivos,
> marcos, volume e repertório **ficam no plano** (Regras 9 e 10 e os validadores). O nome do
> ARQUIVO não mudou: é endereço, e entra na âncora. Prova: `provar-cartao-da-aula`, **31
> asserções**, com a secção 4b a exigir que o cartão seja prefixo do título da página.
>
> **Entrega anterior** (árvore limpa). Nesta entrega, **o corpo tem uma fonte só — e a
> origem está provada no envelope real**. (1) **O sentido do vínculo não mudou**: a aula deriva do
> plano, e o PE/PO são a origem; o que se arrumou foi onde cada **vista** mora — o plano declara a
> visão macro (N aspectos + link), a aula o detalhe (os N, um por linha), o PO o ponto de partida de
> cada sujeito. (2) A tabela dos aspectos fica na **aula** (secção «Corpo»); o plano publica a
> contagem e um **link** para `aula-01.html#corpo`. (3) **A linha por aluna saiu da aula**: com
> trinta alunas eram sessenta e uma linhas antes da primeira marca. (4) **A restrição física
> voltou** — numa citação, fora da tabela: é lesão/dor/limitação, e o próprio PO diz que «a
> ausência também é informação». (5) O título da secção do plano perdeu «força e flexibilidade».
> Prova: `provar-eixos-e-tempo-da-aula`, **61 asserções**, com a secção J a medir o **envelope real**
> do ciclo e o controlo negativo do aspecto inventado (reprova em quatro).
>
> **Entrega anterior** (base `b972267`, árvore limpa). Nesta entrega, **o ciclo
> apaga-se de trás para a frente, a sequência é estrita, e a anamnese é datada**. (1) **Apagar o
> ciclo gerado** leva o pacote, as fontes derivadas, o `.conf` e as âncoras — e os **POs** do ciclo
> —, e deixa a **anamnese** (é do sujeito) e o **plano de ensino**, que fica **livre sem se lhe
> tocar** (o vínculo PO ↔ PE é derivado, modelo da curadoria). A guarda: **só o último**, porque o
> `parentHash` do seguinte aponta para a âncora deste — a recusa diz o que impede e o que fazer.
> (2) A **sequência é estrita**: o campo do ciclo passa a `readOnly`, com o **próximo número
> válido** vindo de `GET /api/ciclos` (um ciclo existe porque tem documento), e **`null` quando há
> um buraco** — não se inventa o número que taparia a lacuna. (3) O **ciclo sai da anamnese**: ela é
> do sujeito, e uma aluna que entra no ciclo 50 não fez os 49 anteriores. (4) **«Ajustar» deu lugar
> a «Novo registo»**: o formulário abre preenchido com o retrato anterior e grava um documento
> **novo, com data nova e sem `ajuste_de`** — porque um retrato novo não substitui o anterior.
> (5) O **sinal de revalidação é derivado**, e a ordem é **PE e depois PO**. Prova nova:
> `provar-ciclos-e-anamnese`, **34 asserções**.
>
> **Entrega anterior** (base `a90058f`, árvore limpa). Nesta entrega, **o cabeçalho
> do ato cabe num telefone, as 156 asserções de produção passam, e a capacidade tem número**.
> (1) As cinco **leituras** do cabeçalho (frequência, duração, calendário, volume, condição de
> registo) **não são `<label>`** — são `.ctx-rotulo` + `.ctx-inscricao` —, e a regra que punha o
> rótulo na linha inteira cobria só o `label`. A grelha dava a coluna elástica ao rótulo e o `auto`
> ao valor; como o valor é uma **frase**, o rótulo encolhia até **0px** e o texto empilhava-se por
> cima — «totalmente acavalados», que é o que ela viu. Medido a 360px: rótulo 0px, valor 129px.
> (2) O `provar-producao` passou de **153/156** para **158/158**: duas falhas eram **lacunas da
> bancada** (o DOM falso não conhecia o selector `[data-secao]` nem `classList`; a lista das
> tradições e a contagem das pílulas estavam escritas à mão) e nenhuma era «pré-existente» no
> sentido de «não é nossa». (3) O **§2.2** da arquitetura deixou de dizer que o composto tem lista
> de verbos à mão — contra o §5.7 escrito no mesmo dia. (4) Nova **§7.2**: **26 criações ou 80
> edições por minuto**, e **5 a 62 escolas** conforme o cenário — projecções declaradas como tais.
> Prova nova: `provar-faixa-do-ato-no-celular`, **40 asserções**, a medir geometria no Chrome.
>
> **Entrega anterior** (base `a749ace`, árvore limpa). Nesta entrega, **o Plano de
> Observação passa a ter os três eixos, o corpo vem da anamnese de quem se observa, e o «Port de
> bras» sai do §1 da aula**. (1) As dimensões chamavam-se «Técnica — Musicalidade» e «Técnica —
> Expressão» porque o eixo estava **escrito no conteúdo** e concatenado a todos os blocos; são
> **poiésis**, e o mapa dos eixos passou a ser **um só** (`motor/nucleo/eixos.js` — havia duas
> cópias, e uma punha o corpo no eixo técnico). O eixo decide-se pelo **bloco**, e **nada é
> renomeado no dado** (P-03). (2) O **Corpo** é eixo próprio e carrega da **anamnese de cada
> sujeito**, pelos campos que o «Ponto de partida» já declarava; o seletor do sujeito passou a ser o
> **primeiro bloco**, antes das dimensões, para a cascata chegar a tempo. (3) O **«Port de bras»**
> que ela viu no §1 vinha da **matriz do parâmetro** e não da curadoria: a régua do repertório
> (`linhasDoRepertorio`) tinha blindado a sequência a 03/11 e **não** o parâmetro. Agora é uma régua
> só, e vale nos dois documentos. (4) A linha do cartão deixou de repetir a síntese por eixo (que já
> está no guia) e passou a dizer `Plano de Observação — <objetivo geral>`. Prova nova:
> `provar-eixos-do-po`, **34 asserções**.
>
> **Entrega anterior** (base `7cf8122`, árvore limpa). Nesta entrega, **o composto
> deixou de enumerar verbos, a modalidade deixou de ser constante, e o custo da API passou a ter
> número**. (1) O armazenamento que o Worker monta (`combinar`) **listava os verbos um por um**, e o
> que ficava fora da lista sumia sem aviso: o `criar` nunca chegou ao motor — a blindagem da decisão
> 85 era **inerte em produção** — e o `anexar` faltava, o que fazia a rota do registro de custo da IA
> chamar uma função inexistente. Uma camada abaixo havia um terceiro furo: os dois adaptadores de
> **base** não implementavam `criar`, que o contrato declara. A correção não foi acrescentar os que
> faltavam (deixaria a armadilha armada para o próximo): o composto passou a ser um **`Proxy`** que
> encaminha **qualquer** verbo, e só `criar` e `gravarComFusao` mantêm regra própria. (2) A
> **modalidade** estava em **29 ocorrências e 8 ficheiros** (os «10 sítios» de 03/11 contavam blocos,
> e um bloco continha dois literais); agora há **um único ponto de derivação** —
> `modalidadePrincipal()` — e `MODALIDADE_PADRAO` é derivada dela. (3) O **custo da escrita** ganhou
> número: **18 pontos** para criar um envelope, **7** para o editar, contra limites de 1 000 req/h
> (Actions) e 500/h · 80/min de criação de conteúdo — o que morde é a **rajada**, e é por isso que o
> expurgo é um commit só. Prova nova: `provar-verbos-do-armazenamento`, **29 asserções**, a ler os
> verbos **do ficheiro do contrato** e a passar pelo `criarArmazenamento`.
>
> **Publicado e confirmado no ar (05/11/2026).** O commit `aac98600` esteve no `main` sem deploy: o
> evento de `push` **não chegou ao Actions** (zero runs para o SHA, fila vazia, e os dois workflows
> cujos `paths` casavam — `deploy-escolas` por `motor/**` e `deploy-raiz` por `motor/servidor/**` — sem
> execução). O Worker da `calango` servia `d60baced`. Publicado por `workflow_dispatch` (run
> 42063204458, `success`) e **verificado ao vivo**: os cinco passos estão na página de Produção, e o
> `<script>` servido difere do motor local em **uma linha** — o `ALUNAS_TODAS`, que é dado da escola.
> Regra que fica: depois de um push que mexa em `motor/`, `tools/templates/` ou `porta/`, confirmar
> **no ar** o marcador que a mudança introduziu; se a run não existir, disparar o `workflow_dispatch`.
>
> **A linha de base é a fonte do elenco, e a cadeia mostra-se no PO (05/11/2026, quinta passagem).**
> A listagem da anamnese dizia **«nova»** e **«aluna nova — sem turma»** a duas alunas com linha de
> base feita e enviada. Não era mentira sobre o dado: era leitura da fonte errada — `turmaDaAluna()`
> perguntava a turma à **curadoria**, que deixou de declarar o elenco quando o passo 5 passou a ser o
> acto que o declara. Em `calango`, **medido por API**: `curadorias` vazio, e a linha de base `teste`
> enviada a 05/11/2026 para «Balé Nível 1 — Teste 1» com a Aluna A e a Aluna B. E o mesmo defeito
> doía mais fundo: `/anamnese/api/anamneses?turma=…` devolvia `{"opcoes": [], "recorte": []}` — o
> nó `sujeitos` do PO oferecia **zero** alunas. Decidido: **a linha de base é a fonte do elenco** e a
> curadoria é o **recurso declarado** (escola que nunca usou o fluxo novo continua a ver a lista de
> antes, em vez de uma lista vazia sem explicação); a direcção da cadeia é **turma → linha de base →
> alunas → corpo**, porque a turma **já** está no PO pelo `plano-de-ensino` obrigatório, e pedir a
> linha de base num campo próprio seria um segundo lugar a declarar o mesmo facto; «nova» passa a
> exigir **não ter linha de base**; e a etiqueta diz as duas coisas — «turma X · linha de base
> «…»» —, com o painel da caixa «Turma» a ganhar a linha `Linha de base`. O cabeçalho do PO passou a
> mostrar a **inscrição «linha de base»** ao lado da turma (nome e nº de alunas), porque a vinculação
> que existe no código e não existe para quem preenche é uma vinculação que ninguém sabe que tem.
> Prova: `provar-etiqueta-da-aluna`, **20 asserções**, e `provar-sujeitos-da-turma`, **41** (a
> secção G é o caso de produção).
>
> **A linha de base passou a ser um fluxo de cinco passos (05/11/2026, quarta passagem).** A
> secção era um formulário só; ela organizou-a como o verbete da notação: **1 Identificação · 2
> Alunas · 3 Leitura · 4 Recorte · 5 Turma**, com a mesma trava (não se chega a um passo com falta
> nos anteriores, e sem anamnese nenhuma nada se abre). A **leitura cruza os trinta campos em quatro
> eixos** — o que precisa de ser trabalhado, o que já é bom, a musicalidade, e o que o grupo tem em
> comum —, e vem **antes** da escolha do recorte, que é o que lhe dá sentido. **(Correcção de
> 05/11/2026: passaram a ser 45 — os 30 dos blocos e os 15 da observação inicial; ver a entrada de
> hoje na §11 e no `REGISTRO.md`. A redação anterior não se apaga: é o elo que registra o que se
> pensou antes.)** A lista de alunas é de
> **10 em 10** com rolagem, e cada aluna leva a etiqueta **«novo»** quando a anamnese dela é mais
> recente do que a última leitura — derivada, não guardada. O passo 5 **não escreve na turma** (a
> turma é o ritmo, decisão de 03/11): grava na linha de base que aquelas alunas foram para aquela
> turma, e a curadoria herda o elenco ao escolher a turma. **Achado nos dados:** o «melhor nível» era
> deduzido da primeira opção, e há um campo cuja lista começa pela limitação — passou a ser
> declarado. Prova: `provar-linha-de-base`, **63 asserções**, com a trava a correr em jsdom e dois A/B
> por reversão.
>
> **A linha de base oferece os TRINTA campos, musicalidade incluída (05/11/2026, terceira passagem).**
> Segundo erro de desenho meu no mesmo dia: eu tinha cortado os **seis campos de musicalidade** com o
> argumento de que «já são tratados nos verbetes da notação». Ela desmontou-o — «a musicalidade não
> nasce por geração espontânea, ela é trabalhada, nem tampouco acontece por osmose». O verbete é onde
> ela se **ensina**; a anamnese é onde ela se **mede**. São complementares, e cortar a segunda é tirar
> do professor o que ele precisa para decidir o que ensinar. O recorte passa a **30 campos** (9 de
> técnica, 15 de funcional, 6 de musicalidade); a dimensão viaja com cada um — com o rótulo do eixo —
> mas **não filtra**. Continua a ser um recorte: o professor escolhe entre os trinta. A asserção da
> bancada foi **invertida**, e não apagada; o A/B repõe o filtro e reprova em 5 de 49.
>
> **A linha de base é sobre ALUNAS, e a anamnese perdeu o ciclo (05/11/2026, segunda passagem).**
> Quatro correcções da mesma sessão de uso. (1) O campo **ciclo** continuava na barra e no painel da
> anamnese — e era ele que fechava o formulário: entrava na lista de obrigatórios e no bilhete do
> ato, e a porta, que não pede ciclo na anamnese, não o fazia casar; cada ato confere o contexto que
> **tem**. (2) O desenho da linha de base estava **errado**: pedia **turma**, e a turma não nasce com
> alunas — a turma só as tem depois da curadoria, e uma aluna nova chega na quinta aula de um ciclo
> em curso. Passa a guardar a lista de **alunas**. (3) Sem anamnese não há o que escolher: os campos
> não se desenham, o «Gravar» nasce `disabled` **no markup**, e a agregação responde
> `semAnamneses` com o motivo em vez de uma tabela vazia. (4) A seta do título não fazia nada —
> `tituloComAcordeao` com um **id** em vez do `data-acordeao` cai no recolhedor das turmas. Prova:
> `provar-linha-de-base`, **47 asserções**, com dois A/B por reversão controlada.
>
> **A linha de base do corpo é uma escolha do professor (05/11/2026).** A anamnese recolhe **24**
> aspectos do corpo; o plano lia **quinze**, escritos à mão no conteúdo desde 02/11/2026 e iguais
> para toda a escola e todo o ciclo — e sem caminho na tela para os mudar. Ficavam de fora o
> formato anatómico dos joelhos, a arquitetura do arco plantar e a impulsão do allegro. Agora há
> uma entidade **Linha de Base** (`bastidores/<escola>/linhas-de-base`), gerida em Bastidores →
> Pedagogia → Corpo, e o plano importa-a como importa a turma. O recorte é sobre **alunas** — a turma entra na curadoria,
e é a curadoria que diz qual linha de base a turma curada trata. Ela é **do professor** (é ele quem
> avalia, e a anamnese é uma fotografia), mas a leitura atravessa os professores — quem assume lê o
> que estava e cria a sua; **nada é herdado**. A cascata de revalidação passou a **três passos**,
> Produção → PE → PO, e o primeiro é derivado como os outros. Prova:
> `provar-linha-de-base`, **37 asserções**, com o A/B que desliga o passo 1. Pendente por decisão
> dela: as anotações textuais das anamneses — nenhum dos 24 campos é texto livre.
>
> **Correcção de 05/11/2026 — o validador cobrava um ficheiro chamado `.html`.** `DOCS=""`
> (o que `tools/criar-escola.sh` escreve em **toda** variante nova) virava `['']` — um array
> *truthy* com uma entrada vazia — e `tools/check-pacote.js` exigia o ficheiro `.html`. Medido na
> `calango`: **11 → 10 erros**, e o que sai é o único que não existia. `filter(Boolean)` faz `""`
> virar `[]`, e o ciclo-zero passa a ser exigido só do `index.html`, como já era no shell. A
> verificação 15 da `provar-geracao-do-ciclo` prova-o por comportamento (pacote sintético em
> diretório temporário, lista exacta dos ficheiros cobrados) **e** pelo negativo: com `DOCS="plano"`
> o validador continua a reprovar. `tools/` é congelado → motivo declarado no `REGISTRO.md`.
>
> **A secção do corpo nasceu fora do `</section>`, e as bancadas não o notaram (05/11/2026, quinta
> passagem).** Ela relatou três sintomas — «não tem nenhum step», «a seta de expandir não mostra
> nada», «o título está no lugar errado» — e era **uma** causa: a tira dos cinco passos, o formulário
> e a lista foram montados **depois** do `</section>` das Curadorias, e a `<section id="sec-corpo">`
> ficou com o título e três `</div>` órfãos. As asserções passavam porque perguntavam «está aqui?»
> por `getElementById`, que atravessa a árvore — **nunca perguntaram «de quem é este elemento?»**. O
> bloco 13 da `provar-linha-de-base` passou a medir a **pertença** (`contains`), e recolhida a secção
> a grade passa a uma coluna (o `.col-form` não é filho directo da `.secao`). **A regressão não era
> só a que ela viu:** a `provar-producao` tinha caído de 158/158 (em `c748e461`) para 154/158 quando
> a oitava secção entrou — três contagens (secções, `.col-form`, listas de sete) e a regra «nenhum
> formulário traz explicação», que passou a ter **duas secções isentas nomeadas e com motivo**, e uma
> asserção nova a exigir que as isentas **existam e sejam só aquelas**. Duas bancadas antigas
> apanharam ainda dois defeitos reais: a nota do elenco herdado partia o par rótulo ↔ escolhedor
> («Alunas» deixava de vestir o que os outros seis vestem), e `provar-cartao-da-turma` lia
> `button.passo` **sem dono** (passou a devolver catorze botões e a chamar-lhes «três»). Provas:
> `provar-linha-de-base` **68/68**, `provar-producao` **159/159**, `provar-curadoria-e-limpeza`
> **23/23**, `provar-ajustes-anamnese` **126/126** (a asserção do ciclo foi **invertida**, não
> apagada), `check-identidade` e `check-indices` **0 erros**. **PENDENTE:** `provar-cartao-da-turma`
> fica com 1 reprovação **pré-existente** (a lista de Termos saiu da página a 01/11 e a asserção
> ainda a procura), alheia a esta entrega.
>
> **Entrega anterior** (base `d3b623c`, árvore limpa). Nesta entrega, **as colunas da
> aula têm a largura do que levam dentro, e a notação sai do bloco de musicalidade**. (1) As doze
> tabelas de exercício saíam a **28/28/21/21** — o «1» do compasso com a mesma largura que o
> parágrafo da descrição. A causa **não era CSS**: o pandoc calcula a largura relativa de cada
> coluna pela **proporção dos traços** da linha de separação, e só quando ela **passa dos 72
> caracteres** (o `--columns` por omissão). Com traços iguais, colunas iguais; e uma linha
> proporcional mas curta é desfeita em silêncio — as duas coisas foram medidas. A proporção passou a
> `12/12/23/52`, e o espaço foi repartido **a favor de quem tem texto** (não em metade exacta: a
> repartição igual daria 14/14/35/35, e a descrição — 150 a 300 caracteres — ficaria com um terço).
> (2) A §4 da aula deixou de trazer a notação Benesh na célula da contagem: ela é o **código** em que
> a música se escreve, tem documento próprio (`-notacao.md`) e é lá que o botão «notação» a vai
> buscar. Prova nova: `provar-colunas-da-aula`, **23 asserções**.
>
> **Entrega anterior** (base `6ede613`, árvore limpa). Nesta entrega, **o cartão da
> aula diz os três dados do professor, e o guia são três eixos de verdade**. (1) Saiu o «Ciclo 01»
> da caixa da **Turma** — «o ciclo não é um atributo estrutural da turma» —, e ficou o operacional:
> turma, «aula N de M», dia, início, fim, duração e a Sala dita «não declarada». (2) O bloco do
> **Professor** deixou de mostrar o identificador e passou a mostrar os três dados que já existiam:
> **nome** e **modalidade** do perfil da pessoa, **tradição de referência** do plano («RAD») — e o
> rótulo da modalidade vem do catálogo, não de uma capitalização. (3) O **guia de observação** da
> aula deixou de ser uma tabela com uma coluna «Eixo» a repetir o rótulo: são **três tabelas, uma
> por eixo**, e o eixo é o **bloco** do documento (`### Corpo`, `### Técnica`, `### Poiesis`) — o
> contrato de extração lê uma tabela por bloco, e é por isso que o campo do schema passa de array a
> objecto com os três. E o **Corpo**, que existia só como frase de contagem, passa a ter linhas: os
> **15 aspectos físicos** do plano, o ponto de partida de cada aluna e as restrições declaradas.
> (4) Os links da **proveniência consolidada** deixaram de abrir a **porta** (o formulário) e passam
> a abrir a **folha** do documento — a mesma que o título abre na Área do Professor. Provas:
> `provar-cartao-da-aula` (**nova**, 25) e `provar-eixos-e-tempo-da-aula` (27 → **38**).
>
> **Entrega anterior** (base `edcd8a0`, árvore limpa). Nesta entrega, **duas edições
> do mesmo documento não se apagam** — a decisão 84, que estava aberta, foi decidida e
> implementada: quando duas pessoas (ou duas abas) gravam o mesmo plano/PO, os **campos
> diferentes unificam** (nada se perde), e o **mesmo campo decide pela recência ao milissegundo**
> (`escrito_em`), com o empate a ir para quem está a gravar. A regra é pura e mora no núcleo
> (`motor/nucleo/fusao.js`); a repetição do 409 mora no adaptador (`gravarComFusao`); e a resposta
> da gravação **declara** a fusão (`fundido`, `fusao: {unidos, conflitos}`), porque uma fusão
> silenciosa é indistinguível de uma sobrescrita. **Sem base não se adivinha** — grava-se como
> sempre. O `ARQUITETURA-GERAL.md` foi **reescrito de ponta a ponta**: dava o acervo como vivendo
> no KV e sob `professores/<professor>/escolas/`, e **nenhuma das duas é verdade**. Ao documentar
> a lista de verbos do `combinar` apareceu **um defeito vivo**: o `anexar` também faltava, e o
> registro de custo da IA é acrescentado por ele. Prova nova: `provar-fusao-da-edicao`,
> **29 asserções**, a passar pelo armazenamento composto.
>
> **Entrega anterior** (base `7091587`, árvore limpa). Nesta entrega, **dois
> «Guardar» no mesmo minuto não perdem mais um documento**. A auditoria da concorrência que a
> pesquisadora pediu respondeu «não» a quase tudo — as gerações do mesmo ciclo são **enfileiradas**
> (`concurrency` do `gerar-ciclo.yml`, `cancel-in-progress: false`), o `.fipp` é recomputado depois
> do rebase, e a escrita em lote é **um commit só** com a referência como último passo —, com **uma
> excepção medida**: o id de um envelope é um **carimbo de minuto**, e `identificar` perguntava
> «existe?» antes de gravar. Dois pedidos que perguntassem antes de qualquer escrita recebiam o
> **mesmo nome**, o segundo gravava por cima, **os dois respondiam «gravado»** e um documento
> evaporava sem erro. Agora o armazenamento tem `criar` (grava só se a chave não existir — no
> repositório, a escrita vai **sem `sha`** e o **422 «"sha" wasn't supplied»** do GitHub é o «já
> existe», **medido contra a API real**), o nome cedido passa ao sufixo seguinte, o índice passa a
> descrever o **arquivo** e não a tentativa perdida, a intenção é **declarada** (`substituir`) — a
> edição em sítio continua a reescrever o mesmo nome —, e o **expurgo**, que era o único escrito em
> lote sem repetição, passa a refazer a corrida que perdeu (chegava lá com o Cloudflare já
> apagado). Prova nova: `provar-corrida-da-escrita`, **27 asserções**.
>
> **Entrega anterior** (base `bff42d8`, árvore limpa). Nesta entrega, **o ajuste do
> plano de ensino arrasta o PO, e o cartão da aula mostra o que se observa**. (1) A pesquisadora
> corrigiu a proporção do Expressão no plano, e o «Guardar» fez o que a proveniência manda — um elo
> novo —, mas o **PO continuou a observar o plano substituído**: `po-20261104-1733` declara
> `plano-de-ensino: plano-20261103-2200`, medido no envelope real. Duas cadeias paralelas, e a aula
> a ler a proporção antiga. Agora a rota deriva **um elo do PO** quando o plano é ajustado (com
> `ajuste_de` do PO anterior e a referência do plano vigente), corre o caminho normal — `-po.md`,
> ciclo e disparo —, e **a referência de um PO segue o topo** da cadeia, com a correção declarada
> (`planoRetargetado`). A Aula 01 do envelope real passa a sair com **Expressão 27 · 30%**. (2) O
> **cartão da listagem de aulas** perde a frase de arquitetura («a aula não tem professor próprio»),
> concentra o horário na caixa **Turma** (com a Sala dita «não declarada»), e ganha a caixa **Guia
> de observação** — a conta, os itens por dimensão e uma linha de síntese por eixo, à mão, sem abrir
> a aula. Prova nova: `provar-cadeia-do-ajuste`, **34 asserções**.
>
> **Entrega anterior** (base `72436a9`, árvore limpa). Nesta entrega, **a fatia de tempo
> de cada bloco vem do plano pela coluna certa, e o guia lê as três frentes**. Duas coisas que a
> pesquisadora viu no ciclo da `breu`. (1) A fatia do bloco **Expressão** saía `[Preencher]` — e o
> motor tinha dois defeitos medidos: a proporção era lida pela **posição** da coluna, e a gravação
> não escreve célula vazia, de modo que a **justificativa** escorregava para o lugar da fatia quando
> «Proporção alvo» faltava; e a unidade **`minutos`** não se sabia ler (saía lacuna em todos os
> tempos, com a fatia certa ao lado). Agora a coluna é procurada pelo **nome**, as duas unidades
> convertem, e a lacuna **nomeia o bloco e o sítio** («proporção do bloco Expressão no plano») — e o
> próprio plano diz o mesmo ao pé da tabela. Sobre o valor: **ele não está no envelope** — a linha foi
> gravada sem proporção, e o sistema não a inventa. (2) O **guia de observação** imprimia tudo com o
> prefixo «Técnica —», inclusive Musicalidade e Expressão, que são poiésis. Passa a ter um **resumo
> por eixo** — **Corpo** (aspectos físicos do plano, ponto de partida e restrições), **Técnica**
> (Barra, Centro) e **Poiesis** (Musicalidade, Expressão) — e, abaixo, a tabela **item a item**, o
> detalhe que a folha de captura pede. **Nada foi renomeado no dado** (P-03), e o mapa dos eixos é
> **candidato**, declarado como tal. Prova nova: `provar-eixos-e-tempo-da-aula`, **27 asserções**.
>
> **Entrega anterior** (base `2d01773`, árvore limpa). Nesta entrega, **a estante mostra
> um documento por linha**. O professor ajustou o Plano de Observação três vezes até a geração
> passar, e a Área do Professor passou a mostrar **três linhas com o mesmo nome** — uma por envelope,
> que é o mecanismo de proveniência a aparecer no ecrã. A regra passou a ser **uma, do núcleo**
> (`porta.vigentesDaFamilia`): um envelope que outro aponta em `ajuste_de` está **substituído**, e as
> tentativas **irmãs** do mesmo documento (o plano observado, para o PO; a aluna, para a anamnese)
> colapsam na mais recente. **O plano de ensino não se agrupa por contexto** — dois planos da mesma
> turma e ciclo com objetivos diferentes são dois documentos, e foi a bancada
> `provar-apagar-da-listagem` que o mostrou, ao ficar vermelha. **Nada se perde**: os envelopes
> escondidos continuam no acervo, legíveis pelo id e no índice; os estados continuam a derivar de
> todos; e a linha diz «2 versões anteriores guardadas». Prova nova: `provar-vigente-na-listagem`,
> **21 asserções**.
>
> **Entrega anterior** (base `5ae2ea5`, árvore limpa). Nesta entrega, **a medida não é
> o repertório**. Ela relatou que a sequência mostrava «*Port de Bras*, vinculado ao Objetivo 2» com
> a curadoria em dois verbetes, e uma menção residual a um «Objetivo 3» que nunca preencheu — e
> suspeitou de *mock*, com razão para suspeitar. **Não havia mock**: havia duas portas abertas na
> mesma derivação. A coluna «Conteúdo do nível» lia os termos marcados na matriz do «Parâmetro de
> medição» **sem os conferir contra o repertório curado** — e medir não é curar; e a matriz dos
> **blocos**, que produz as sementes, não era filtrada pelos objetivos vivos, pelo que um `marco: 3`
> guardado gerava uma linha com o rótulo «3» e **sem texto de objetivo**. A regra passou a ser uma e
> está escrita em `motor/nucleo/sequencia.js`: **o conteúdo do exercício é o repertório curado da
> turma**, e sem sujeito não é linha. O que fica de fora é **dito** no rodapé, e a lacuna não se
> pune. `provar-sequencia-que-acompanha` **49 asserções** (eram 33), com **dois controlos negativos**;
> as outras sete bancadas e o `check-identidade` (20/20) verdes.
>
> **Entrega anterior** (base `1e29007`, árvore limpa). Nesta entrega, **a correção de
> uma explicação minha**: eu disse que três campos «não chegavam ao documento» e que a decisão era
> dela — e **estava errado**. Nenhum dos três é perda: a linha da **escola** saiu do corpo a
> 28/10/2026 (está no `title` e no `escola:` do cabeçalho); a **rubrica** deixou de ser a tabela
> Critério × níveis a 26/10 (o plano declara a **régua**, e o critério nasce no lançamento da
> aula); e a **relação objetivo ↔ aula** chega, na direção contrária — na tabela «Marcos parciais
> por aula», que é o trabalho dela. O que estava velho eram as **bancadas**, que descreviam o
> documento de antes dessas decisões. E a da sequência media-se a si mesma: dizia que o «Battement
> fondu» declara `2|4/4`, e o alfabeto só tem **Plié** (`4|2/4`) e **Battement tendu**
> (`8|2/4@breu`) — o fondu existe no vocabulário e **não tem verbete**, e criá-lo é acto de
> **conteúdo**. `provar-plano-completo` **18 verificações**, `provar-derivados-da-sequencia` **26
> asserções** — as duas verdes. **Nada se apaga**: nem no sistema, nem no acervo.
>
> **Entrega anterior** (base `38b13c1`, árvore limpa). Nesta entrega, **duas bancadas
> voltaram a medir** — e a resposta à pergunta que as destravou é um **não**. O `provar-plano-matriz`
> estava vermelho em «/api/mapa responde», e a mensagem aponta para a rota; a rota está boa. A prova
> servia `professores/leticia/ciclos/…`, e **a escola `barra` foi expurgada em 15/10/2026** — a pasta
> do professor com ela. Nenhum plano novo povoaria aquela pasta. Sob o vermelho havia **cinco
> asserções que mediam o dia em que foram escritas** (o número de nós, a secção «Estrutura de cada
> aula», a tabela da rubrica, o endereço da sequência, o bloco «(P-10)») — as bancadas morriam na
> primeira linha, portanto **nunca tinham corrido** desde 26/10. O fixture passa a ser `porta/` e o
> molde `modelo/ciclos/`, que não envelhecem com um expurgo. **E um defeito de verdade**: o rótulo
> «Turmas observadas» no documento × «Turma observada» no formulário — o plano é de UMA turma; o
> vermelho de cima escondia a asserção que o travava. As duas bancadas estavam **fora do Git** e
> entram agora. `provar-plano-matriz` **52/52**, `provar-po-completo` **17**.
>
> **Entrega anterior** (base `93a1dc1`, árvore limpa). Nesta entrega, **o registo
> solto voltou a poder ser apagado** — e o gesto passou a ser **botão**, não link. O «Apagar» sumiu
> da listagem do plano quando ela passou a ser a página da Área do Professor (a estante antiga da
> porta tinha-o); e na anamnese ele era um `<a>` para o **mesmo endereço** do «Editar» — dois
> botões, um destino, o segundo a prometer o que não fazia. A regra é a mesma das duas famílias:
> **solto** → Editar e Apagar; **vinculado a um PO** ou **derivado** → só Ajustar (e o servidor
> recusa o `DELETE` com 409); **PO** → nunca. O clique exige a senha já conferida no painel, nomeia
> o que vai apagar, e recarrega (a lista é do servidor). Três defeitos no caminho: a **rota
> relativa** não chegava (404 — faltava o prefixo da porta), o **`apagar` do acervo** exigia token e
> respondia 500 enquanto o `guardar` caía no KV (assimetria que o botão tornou alcançável), e o
> `\n` da confirmação **quebrava o script da página** (escape a atravessar duas linguagens). Prova
> nova: `provar-apagar-da-listagem`, **31 asserções em 6 secções**, com publicação mínima própria.
>
> **Entrega anterior** (base `9547aae`, árvore limpa). Nesta entrega, **a sequência
> deixou de inventar linha** — e é a correção de uma decisão da mesma sessão, horas antes. O repertório
> nasce nos **bastidores** (o verbete, com a música), é **acordado na curadoria** para aquela turma, e
> esta tabela é onde ele se **encontra** com o objetivo e o bloco. Acrescentar uma linha aqui — ou
> apagá-la — é um acordo que ninguém fez, publicado como se fosse a aula: **saiu o «Adicionar linha»,
> saiu o ✕, saiu o campo livre do conteúdo** (a mesma fraude por outra porta) e saiu o `extras` da
> derivação. O caminho legítimo fica inteiro: marcar mais um exercício em «Parâmetro de medição»
> acrescenta as linhas dele em cada bloco onde o objetivo é trabalhado, e a curadoria manda no
> repertório da turma. O rodapé passou a dizer **de onde a linha vem**, e por **forma** — a
> distribuição do volume, onde a proporção se escreve, mantém a frase dela. Duas asserções do
> `provar-plano-matriz` guardavam a regra de ontem e passaram a afirmar o contrário, com a razão ao
> lado. Prova: `provar-sequencia-que-acompanha`, **33 asserções em 6 secções**, agora com controlo
> positivo (mais um parâmetro → três linhas).
>
> **Entrega anterior** (base `53e8235`, árvore limpa). Nesta entrega, **a sequência
> de exercícios passou a acompanhar os objetivos**. Ela mostrava «Barra com objetivo específico 2» e
> «Centro com objetivo específico 3» depois de os objetivos terem sido reduzidos a um — e a pergunta
> era a certa: é dinâmica ou está presa a mock? **É dinâmica, e não há mock nenhum** (a pasta
> `teste/` só é lida pelos bancos). O que ficou preso foi o **objetivo**: medido no envelope dela,
> um objetivo e **oito** linhas, duas a nomear os 2 e 3. **(1) A linha de um objetivo que não existe
> sai** — ela não é memória (a coluna é só de leitura; quem a escreve é o sistema, e a autoria da
> semente vivia num `Map` que morre com a página), e a regra vive em `motor/nucleo/sequencia.js`, a
> mesma para a tela, o `.md` do plano e a `aula-01.md`. **(2) A chave da linha passou a ser o NÚMERO
> do objetivo** — pelo texto, corrigir a redacção de um objetivo duplicava a linha, com o texto
> velho e o conteúdo outra vez por escolher: era esse o «campo aberto/vazio» relatado. **(3) O ✕
> passou a existir** (`removivel: true`) — havia como acrescentar uma linha e não como removê-la.
> E o defeito que apareceu por baixo: a **trava da senha** reescrevia `disabled` em todos os
> controles, e acendia o ✕ das linhas derivadas no instante em que a senha era validada. Prova nova:
> `provar-sequencia-que-acompanha`, **27 asserções em 6 secções**, com dois controlos negativos.
>
> **Entrega anterior** (base `cbd9b18`, árvore limpa). Nesta entrega, **a metodologia
> deixou de se perguntar duas vezes**. O Bloco 1 do plano pedia-a em dois itens — «Metodologia de
> referência» e «Quem escolhe a metodologia» («Eu escolho · A escola impõe») — e os dois já estavam
> respondidos na **curadoria**. **(1) O item 5 deixou de existir**: a premissa passou a ser do
> domínio e é permanente — **o professor escolhe, a metodologia pertence ao professor**, como a
> modalidade. Um facto que não varia com o ciclo não se pergunta ciclo a ciclo. **(2) O item 4
> passou a leitura do cabeçalho** (`noCabecalho` + `daCuradoria: 'tradicao'`), com o **rótulo** do
> catálogo («Francesa», e não a chave `francesa`). **(3) O envelope continua a levar o valor
> semeado** — é dele que o `.md` do plano e o PO o extraem; sem isso o documento passaria a dizer
> «[a decidir]» sobre um dado que a curadoria declara. Dois defeitos apanhados pelo caminho:
> `daCuradoria()` lia uma string **caractere a caractere** (a tradição chegava como `f`), e os
> rótulos das tradições não chegavam à porta — passaram a vir na mesma resposta da curadoria. Prova
> nova: `provar-metodologia-no-cabecalho`, **20 asserções em 5 secções**, com controlo negativo.
>
> **Entrega anterior** (base `49fb3e6`, árvore limpa). Nesta entrega, **o dono da
> música deixou de aparecer no compasso**. A coluna «Compasso» da sequência do plano mostrava
> `2/4 @breu`: o sufixo é o **dono do registo do alfabeto** (`8|2/4@breu`), que existe para o
> catálogo e a escola poderem declarar a mesma música sem colidir — armazenamento, e não fórmula.
> Corrigido nos dois lados: **a fonte** (`musicasDosExercicios` limpa com `musicaDaChave` do núcleo
> e **deduplica** — quando o catálogo e a escola declaram a mesma música o alfabeto tem as duas
> chaves, e sem deduplicar o menu a oferecia duas vezes) e **a tela** (`musicasDoExercicio` corta o
> mesmo sufixo, para um adaptador que sirva o alfabeto em cru). **O dado NÃO se limpa**: a chave do
> alfabeto continua `8|2/4@breu`, e é isso que mantém as duas versões — P-03/P-04. Prova nova:
> `provar-compasso-limpo`, **16 asserções em 4 secções**, com o controlo da §C a provar primeiro
> que a bancada serve mesmo o sufixo.
>
> **Entrega anterior a essa** (base `85ff724`, árvore limpa). Nesta entrega, **o formulário
> da curadoria passou a prometer só o que existe**. **(1) A lista de conteúdos** oferecia o
> vocabulário inteiro — 93 palavras — e duas tinham decomposição; passa a oferecer os exercícios
> que **têm notação** (um verbete com música e, dentro dela, ao menos um trecho), por
> `exerciciosComNotacao()`. Cresce sozinha quando um verbete ganha trechos, e o que já está gravado
> continua a ler-se (as fichas vêm do registo, não do menu). **(2) Os oito rótulos do formulário**
> passaram a vestir a mesma peça: «Alunas» e «Conteúdos desta curadoria» eram `<label>` nu e o
> navegador desenhava-os em linha, com outra cor — e com eles três sítios que ninguém tinha visto.
> **(3) O formulário deixou de explicar**: saíram o «(nada escolhido ainda)», as legendas
> «— opcional; sem escolha…», a instrução de clique dos sinais, a frase da posição, os quatro
> avisos de estado vazio do passo 6 e do rodapé, e as opções que rotulavam a ausência de escolha
> («— sem grau —»…). **Ficou o feedback que informa** — nove blocos, contados um a um na §E da
> prova nova, `provar-curadoria-e-limpeza` (**22 asserções**). Efeito medido: a asserção
> «nenhum formulário traz explicação» do `provar-producao` estava vermelha desde antes e **passou**
> (153 de 156, era 151 de 155).
>
> **Entrega anterior a essa** (base `bb8d122`, árvore limpa). Esta entrega é uma
> **verificação a pedido** («o processo da curadoria até à geração dos documentos»), e achou um elo
> partido: `porta/index.html` tinha **duas funções com o mesmo nome** — `turmaDoPlano` —, e a
> segunda (a que devolve uma lista de nomes, nascida a 02/11 com o «Carregar das anamneses da
> turma») ganhava para todos os chamadores, por hoisting. Um array não dá erro: dava `undefined` no
> calendário, `NaN` na frequência e `termosDaTurma(undefined)` na coluna «Conteúdo do nível» — **o
> plano deixou de ler a turma e de mostrar o que a direção curou**, sem uma palavra na tela. As
> três funções homónimas (a da porta e duas na Produção: `cancelarEdicao` e `temposDaContagem`)
> foram renomeadas, e a prova nova — `provar-plano-e-curadoria`, **12 asserções** — mede a cadeia
> **e a classe** do defeito. Efeito medido: `provar-teste` passou de vermelho a **45 verificações
> verdes**, e `provar-cartao-da-turma` de 6 falhas a **4**. Do lado do estado: **a curadoria está
> registada e o `repertorio` dela já chega ao formulário** (medido no ar), mas **não há plano nem PO
> guardados** — e sem PO não há documentos.
>
> **Entrega anterior a essa** (base `9d636fe`, árvore limpa). **O conteúdo
> saiu do cadastro da turma**, e a turma passou a ter **três estados**. **(1) A auditoria que ela
> pediu mudou o diagnóstico:** a rota `turma-editar` já recusava (409) a turma presa a um plano, mas
> a turma que apenas **compunha uma curadoria** continuava editável — e a curadoria guarda o **nome**
> dela, portanto renomear partia a ligação **sem erro nenhum**. O defeito não era o botão: era a
> assimetria (o professor tinha três estados, a turma tinha dois). `motor/nucleo/estado-da-turma.js`
> nomeia-os — `livre` · `curada` · `vinculada` —, `motivoDaRecusa` diz por que não se edita, e a
> rota, o `DELETE` e o cartão perguntam ao mesmo sítio. **(2) A nota da turma saiu** do formulário e
> da lista de campos copiados; o que já está gravado fica (P-03/P-04). **(3) Os conteúdos passaram
> para a curadoria** — eram o último resto do enquadramento no cadastro —, e
> `motor/nucleo/conteudos.js` **compõe** o mapa antigo (`turma-conteudos`, que continua a ser lido)
> com o `repertorio` de cada curadoria: nada se perde, e o cartão continua a mostrar a lista.
> **(4) O formulário da curadoria ficou inteligente**: as modalidades filtram-se pelas habilitações
> do `perfil.json` do professor, e as tradições seguem a modalidade
> (`motor/nucleo/tradicoes.js`: a lista própria vence a compartilhada — e uma modalidade **sem**
> lista própria cai na compartilhada, em vez de ficar sem nenhuma). Nenhuma modalidade tem ainda o
> seu `tradicoes.json`, e a tela **diz** isso em vez de fingir. Prova nova:
> `provar-conteudos-e-estado-da-turma`, **74 asserções em 7 secções**. Também entrou
> `indices/esquema/tipos.json` (o tipo `perfil`): o `perfil.json` que ela criou pela tela em 03/11
> era o primeiro ficheiro do acervo **sem tipo declarado**, e o `check-indices` reprovava-o.
>
> **Entrega anterior** (base citada: `ddcd92a` — **corrigida** para `622071b`, ver §9; árvore
> limpa). **A turma
> deixou de ser o enquadramento** — e a decisão é dela, revendo a do mesmo dia. O nível, a
> modalidade, a tradição e o professor tinham sido postos na **turma** de manhã; à tarde ela reviu:
> «a turma deixa de ser carregada com definições rígidas de nível pedagógico», o cadastro fica
> «estritamente no que lhe é inerente (dias, horários e rotina)», e o enquadramento passa para a
> **curadoria** — para a escola poder «transitar turmas entre modalidades e níveis» sem destruir a
> estrutura operacional. **(1)** A curadoria ganhou `grau`, `nivel` e o `nivelReferencia`
> **composto** pela tradição («Grade 3» na RAD, «Intermediário 2» nas outras), e a derivação herda-o
> e **recompõe** o rótulo se a tradição mudar. **(2)** **A memória não se apaga** (P-03/P-04): uma
> turma cadastrada de manhã conserva o `nivelReferencia` que guardou — o campo deixou de ser tocado,
> não foi apagado —, e `nivelEfetivo` lê-o quando a curadoria não declara nível, dizendo de onde
> veio. **(3)** O enquadramento passou a ser um **módulo** (`motor/nucleo/enquadramento.js`), porque
> três leituras ficariam ambíguas — e a terceira doía: a marca de `descontinuada` lia
> `t.professor`/`t.modalidade`, campos que o cadastro novo já não tem, e um `undefined` numa
> comparação **não dá erro**: dá `false`, e a marca deixava de acender em silêncio. O módulo
> `niveis-da-turma.js` passou a `niveis.js` — o nome dizia «da turma» e deixou de ser verdade. Prova
> nova: `provar-enquadramento-da-turma`, **46 asserções**.
>
> **Entrega anterior a essa** (base `21089cb`, árvore **limpa**). A **habilitação passou a existir como
> dado** e a **turma passou a poder ficar descontinuada**. **(1)** As
> três decisões dela: a **habilitação vive no perfil do professor** (`professores/<slug>/perfil.json`
> → `modalidades`), **independente do tenant** — e o argumento é o expurgo: o KV de uma escola tem o
> prefixo dela, e guardar ali a competência faria dela um dado do contrato, que sai com ele. O
> perfil **nasce com a escola** (`tools/criar-escola.sh`, commit próprio por estar em
> `CONGELAMENTO.md`) e **não se sobrescreve** na segunda escola. **(2)** A **turma cuja modalidade o
> professor deixou de ter não se apaga**: fica `descontinuada`, com data e motivo, e o histórico
> intacto — e a marca é **revogável**, porque uma marca que só se acendesse seria uma pena perpétua
> por uma decisão que se corrige. **(3)** O **nível tem a forma da tradição**: a RAD numera em fila
> («Grade 3»), as outras agrupam em graus («Intermediário 2»); `grau` e `nivel` são campos da turma e
> `nivelReferencia` é **composto** deles. Nenhum «N» foi inventado. E o expurgo ganhou **regra com
> nome** (`ehPerfilDoProfessor`), **nome no relatório** do commit e uma **guarda** que recusa antes
> de apagar (`semPerfisNaLista`), com controlo negativo. Prova nova:
> `provar-habilitacao-do-professor`, **62 asserções**. **PENDENTE**: a modalidade continua escrita à
> mão em **10 sítios** de `motor/` — o dado existe, mas ainda não é ele que escolhe o alfabeto.
>
> **Entrega anterior** (base `cc150e6`, árvore **por commitar**). O **coupé e o sur le cou-de-pied
> passaram a poder escrever-se**, e a **modalidade passou a ter dono declarado**. **(1)** O que ela pediu como «adicionar os termos» encontrou-os **já no vocabulário** —
> `coupe` e `sur-le-cou-de-pied` existiam desde o dicionário dela. O que faltava era o **SIGNO**: o
> grupo «Posições dos pés e braços» tinha `prep` e os cinco números, e o `lerBloco` **recusa o bloco
> inteiro** quando um token não existe — escrever o battement frappé, que parte do cou-de-pied, era
> impossível. Entram `cp` e `cdp`, e o alfabeto vai à **versão 38**. **(2)** O **nome** de dois
> empréstimos contrariava a decisão D-67 (02/11/2026): `sur-le-cou-de-pied` dizia «sobre o colo do
> pé» — e cou-de-pied é o **peito** do pé — e `attitude` dizia «atitude». Os dois voltam ao nome
> internacional, e a prova passa a prendê-los. **(3)** **A modalidade pertence ao PROFESSOR**
> (**DECIDIDO** por ela): a escola herda por **derivação**, não por campo copiado. O acoplamento está
> medido — **10 sítios** de `motor/` escrevem a modalidade à mão —, e é essa a linha de base do
> trabalho de médio prazo. Prova nova: `provar-sinais-da-modalidade`, **29 asserções**.
>
> **Entrega anterior** (base `1b305e3` + `cc150e6`, árvore **limpa**). A **notação da listagem passou
> a três colunas** e o **passo 6 deixou de crescer com os trechos**.
> **(1)** A tabela tinha duas colunas, e uma delas era **a definição do exercício repetida em cada
> linha** — com dois trechos, duas vezes a mesma frase. Passa a `compasso` · `contagem` · `notação`,
> e a definição sobe para o topo do bloco **escrita uma vez**: ela é do **exercício**, não do trecho.
> Quando duas linhas têm frases **diferentes** — um trecho guardado com a frase com que foi escrito
> (P-03/P-04) — aparecem as duas, cada uma uma vez; escolher uma e calar a outra seria perder a
> diferença em nome da limpeza. **(2)** A coluna da contagem passou a dizer a **frequência por
> extenso** — «1–2 (duas vezes)» —, que existia na célula desde 02/11 (`repeticoes`) e **não chegava
> à listagem**. **(3)** O bloco «o que fica escrito em cada trecho», que despejava **dois parágrafos
> abertos por trecho**, passa a **uma dobra fechada por trecho**, com o resumo a dizer onde ele cai;
> a dobra **sobrevive ao repintar**, e por isso não se fecha no gesto seguinte. Prova nova:
> `provar-tabela-da-notacao`, **41 asserções**. **NÃO medido**: **pixéis** — não há navegador nesta
> bancada; mediu-se a **prosa** à vista (251 de 385 letras, 65%), que é a causa da altura.
>
> **Entrega anterior** (base `89d1f83` + `1b305e3`, árvore **limpa**). A **listagem deixou de
> mentir sobre a decomposição**. Ela gravou o «Battement tendu» com dois
> trechos — compasso 1 e compasso 3 — e a lista respondeu «A decomposição deste exercício não pode
> ser lida». **O dado estava lá, inteiro; a leitura é que estava errada**, e por **três** elos
> encadeados: **(1)** a composição usava o alfabeto **embutido no build** (`require`) e não o que a
> rota acaba de ler, pelo que uma escrita da tela só era legível no processo seguinte; **(2)** ia
> **sem `escola`**, e desde 03/11 o registo dela vive em `8|2/4@breu` — pedir `8|2/4` ao catálogo
> não o encontra, e o silêncio disso chama-se `musica-nao-coberta`; **(3)** quando a composição
> falhava, os trechos **gravados eram atirados fora** — o erro substituía o dado. **A hipótese do
> relatório não se confirma**: o salto de 1 para 3 **não** é lacuna nem numeração descontínua, são
> **dois compassos de 2/4** — o relógio corre por pista e `coberturaDe` toma a pista maior, não a
> soma linear. A leitura passa a ser `lerLinhas(…, alfabeto, escola)`, cada música traz o seu
> `motivo`, e a composição **parcial** deixou de ser erro para ser um estado declarado: as linhas que
> compõem aparecem, o trecho que não compõe diz porquê, a música sem trechos diz que ainda não tem.
> A frase «A decomposição deste exercício não pôde ser lida» **deixou de existir no código**. Prova
> nova: `provar-leitura-da-decomposicao`, **25 asserções** em 4 secções. **PENDENTE**: a conferência
> ao ar é a dela, no próximo `F5` — nesta sessão **nenhuma carga foi ao ar**.
>
> **Entrega anterior** (base `89d1f83`, árvore **por commitar**). Os **três defeitos** que ela
> relatou ao usar a Produção a sério estão corrigidos, e a **fase 1 fechou-se no alfabeto**. **(1)** Duplicar um trecho **não** mexe na música: era `declarado + bloco`
> escrito no campo, e uma música de 8 ia a 12 e crescia a cada cópia; agora a música é a base rítmica
> e o que a cópia muda é o que a decomposição **ocupa**. **(2)** O campo da música **deixou de estar
> bloqueado** — a trava de 02/11 existia porque mudar os tempos recomeçava o rascunho a partir da
> chave e apagava as células; a correcção certa era **não recomeçar** (`musicaMudou`), e não travar o
> campo. **(3)** O **desacordo entre a música e a decomposição passou de recusa a aviso**:
> `validarVerbete` devolve-o em `avisos`, a gravação passa, a tela mostra o selo «Os tempos da música
> estão em desacordo com a decomposição» no passo 3, e a listagem marca o verbete. **(4)** E a
> decisão dela — **«o dono do alfabeto é a escola»** — está implementada **como no vocabulário**: o
> registo do catálogo fica com a chave da música (`8|4/4`), o de uma escola leva o dono ao lado
> (`8|4/4@breu`) e o campo `escola` dentro; a precedência é uma só (`registosDaEscola`), lida pela
> composição do documento, pela listagem e pelos produtos; e o apagar é **por dono** — uma escola não
> apaga o catálogo. A prova nova (`provar-musica-do-verbete`) tem **33 asserções** e corre a página
> em jsdom.
>
> **Entrega anterior** (base `508d22f`, árvore **limpa**). Nesta entrega, a **Produção
> usou a tela pela primeira vez** — criou «Battement tendu» na escola `breu` —, e o exercício de
> medir o que isso fez encontrou três coisas. **(1)** A separação **funciona**: `batata` e `maria`
> viram o termo do **catálogo** (com `fonte`), a `breu` viu o dela. **(2)** Mas o termo era uma
> **sombra** de um que o catálogo já tinha, e na `breu` vencia **perdendo a origem** (a edição paga
> dela excluía **26**, contra **25** do catálogo); e o **verbete** foi para o alfabeto da
> **modalidade**, que **não tem campo `escola`** — o texto da escola passou a ser a decomposição do
> termo do catálogo, visível a todas. **DECIDIDO** por ela: retirar os dois. O catálogo voltou a
> **93 termos**, nenhum com `escola`, alfabeto **v32** e **1** verbete. **(3)** O defeito que isso
> revelou: `biblioteca/modalidades/**` não estava no filtro de `paths` do `deploy-escolas.yml`, e
> os dois commits da tela ficaram **sem run nenhum** — o termo entrava no repositório e
> **desaparecia no `F5`**, porque o Worker servia o bundle anterior. Corrigido e provado: `508d22f`
> publicou, e a página da `breu` em produção já não traz o texto da escola. **(4)** A `breu`
> **não** foi expurgada: ela decidiu não o fazer agora, e o cálculo dos 17 ficheiros ficou
> registado. **PENDENTE**: o **alfabeto continua sem dono** — é o buraco que resta da fase 1.
>
> **Entrega anterior** (base `885a2ad` + o `4e1593a` local, com a árvore de trabalho
> **por commitar**). Nesta entrega, as duas peças que faltavam **deixaram de faltar por inteiro**.
> A **fotografia datada** da licença passou a ser **calculada**: `catalogo@AAAA-MM-DD` sai do último
> commit que tocou o catálogo — a técnica do `SOURCE_DATE_EPOCH` —, medido em `catalogo@2026-11-02`
> (`23d4c0e`) e igual em duas execuções. E é **derivada**, com a **pendência declarada**: não é a
> data do contrato (C8), que a vence no dia em que existir; deixa de ser impeditivo e passa a ser
> dívida nomeada. E a **fase 1** passou a separar catálogo × escola por **campo**: `escola` ausente
> é do catálogo, `escola: '<slug>'` é daquela escola; o escritor grava o dono no termo, o leitor
> filtra-o pela mesma `compor`, e o `--escola` do CLI entrega a edição. O **ficheiro continua a ser
> um** — um caminho variável não se embute no bundle do Worker —, e é por isso que o critério 5
> passa **na substância** e não ao pé da letra. A **C11** decidiu, na parte que faltava, **onde** o
> `plano` vive: num **ficheiro declarativo do repositório** (o «`.conf`» no sentido genérico — um
> ficheiro com esse nome não existe), e **nunca no KV**. A prova dos produtos passou de 73 para **89
> asserções**.
>
> **Entrega anterior** (base `026c281`, com a árvore de trabalho **por commitar**).
> Nesta entrega, **a licença passou de decisão a texto**, e o motor passou a **executá-la**. Existem
> dois `LICENSE.md` — o da raiz para **a máquina** (que continua a não se licenciar) e o de
> `biblioteca/` para **o catálogo**, com as seis cláusulas da §10, a concessão da escola (§10.3) e a
> condição de conteúdo (§10.4). O gerador **lê-os**: o manifesto deixou de dizer «pendente» e cita o
> caminho, e a lacuna `sem-licenca` desapareceu (o dicionário caiu de **148 para 147** lacunas).
> E a condição de conteúdo ficou **executável** — há duas edições, `--edicao interna` (por omissão,
> mostra tudo) e `--edicao paga`, em que **a definição sem `fonte` não entra**, o documento diz no
> sítio dela porque está fora, e o manifesto conta: medido no catálogo a 02/11/2026, **25** — o
> mesmo número que a §10.4 tinha medido à mão. A **camada pedagógica** ganhou a regra que faltava:
> `exige` · `ensina` · `expressa` são **herdados do termo** (`vocabulario.json`) e **sobrepostos
> pela relação** (`progressao.json`), e o documento **escreve de onde veio** — porque apresentar
> como «do nível» o que veio do termo é uma afirmação falsa sobre quem declarou o quê.
> **Herdar não é faltar**: só a ausência nos dois lugares é lacuna. A prova do módulo passou de 52
> para **73 asserções**.
>
> **Entrega anterior** (base `2a59d98`).
> **O motor dos produtos começou, e são dois dos três**: o **dicionário** e o
> **syllabus** geram-se do catálogo por `node motor/produtos.js`, em módulos puros
> (`motor/nucleo/produtos/`) que não tocam no runtime. O que eles NÃO fazem é inventar: um termo
> sem definição ou sem origem sai em `[Preencher]`, um exercício sem verbete declara a lacuna, um
> verbete cujo `cobre` não fecha sai em `[conferir]` em vez da contagem errada, e um nível sem
> unidades diz que é a lacuna. Pela primeira vez o **fase 1** tem código — a **composição**
> catálogo × escola (`compor`), com a escola a ganhar e a marcar `origem` —, mas **os ficheiros
> continuam um só**: a separação que o plano exige não foi feita, e `termo-repo.js` continua a
> escrever no vocabulário do catálogo. Medido no catálogo de hoje: **93 termos** (59 com
> definição, 34 com origem declarada), **1 verbete** no alfabeto — o `Plié` em 4 tempos de 2/4,
> declarado **por ela pela Produção enquanto esta sessão escrevia** (versão **32**) —, **9
> associações** em **2 dos 13 níveis**. A **aula pronta** não foi começada.
>
> **Entrega anterior** (base `0e2ac45`). **A segunda correcção do dia sobre a mesma
> tela**, e ela reverteu três decisões da manhã: o **rótulo da tradição** passou de CAIXA ALTA
> a **Title Case** (`RAD` fica como sigla) e a `Compartilhada` duplicada saiu da lista do método; o
> **«Apagar o verbete» saiu do passo 6** e vive só na listagem; e a **navegação bloqueia para a
> frente** — o passo seguinte e o «Seguir» ficam desactivados até os obrigatórios da etapa estarem
> preenchidos, e o «Voltar» continua livre. O passo 1 passou a **ler o passo 2**: escolhido um
> exercício existente, categoria, tradição e «o que acontece» vêm do dicionário e ficavam
> **congelados** (`disabled`) — **o congelamento caiu a 10/11/2026**, por decisão dela, porque
> impedia começar um verbete de um exercício que já existia; ver a entrada dessa data no
> `REGISTRO.md`. Duas correcções de dados: o `ED`/`EI` do alfabeto deixaram de se
> chamar «en dehors»/«en dedans» e passaram a **«varredura para fora/dentro»**, e as fixtures do
> `breu` passaram a **Plié · Battement tendu · Battement fondu**, com a música e a decomposição
> pré-escritas. Também se corrigiu uma **regressão medida**: o preenchedor de fixtures chamava
> `modoExercicio (true)`, removida no passo 1 — nenhum termo chegava ao formulário.
>
> **Entrega anterior** (base `cc54844`). **O verbete ganhou proveniência.** O `DELETE` deixou de
> ser incondicional — se o exercício compõe um **plano de ensino** ou o repertório de uma
> **curadoria**, o `409` diz porquê e aponta o caminho («Descontinuar»). E o `UPDATE` deixou de
> reescrever o passado: ela escolheu **versões datadas**
> (opção B de três), e um verbete em uso passa a ser **ajustado** — o estado anterior fica no
> histórico com a data em que deixou de valer, e o documento compõe o estado que valia **na data do
> seu envelope**. Medido de ponta a ponta: o mesmo envelope, com a data de antes do ajuste, sai com
> a notação antiga. **E duas regras de tela:** o «Gravar verbete» fica desactivado sem decomposição,
> e o bloco do passo 1 (categoria, tradição, «o que acontece») só entra em vigor com um nome.
> *(A terceira parte desta entrega — a tradição em caixa alta — foi **corrigida na mesma data**:
> ver a nota da fotografia de cima.)*
>
> **Entrega anterior** (base `dbc3797`). Nesta entrega: **a música deixou de se poder mudar por
> baixo dos trechos.** Ela escreveu os tempos à mão, de 8 para 16, e os trechos
> desapareceram no mesmo instante, sem aviso. A saída escolhida foi **bloquear**: com trechos
> escritos, `#vbtempos` fica só de leitura e o compasso desactivado, e a nota manda ao «Duplicar o
> exercício» para a mesma decomposição noutra duração. **E o verbo apagar passou a existir** — a
> rota respondia 409 com um sermão sobre a P-03/P-04 e passou a apagar, com a consequência escrita
> na pergunta. **E os passos re-arrumaram-se:** a frase subiu ao passo 1, o passo 1 ficou
> condicional (sem nome, ninguém é obrigado a nada; com nome, os três seguintes são obrigatórios),
> e o campo «posição em que o exercício acontece» **saiu** — a posição escreve-se nos sinais do
> trecho. A decomposição ganhou o «lê-se» atrás de um clique e deixou de repetir a frase do
> exercício em cada linha.
>
> **Duas entregas antes** (base `b7acca6`). Nesta entrega: **a listagem do verbete
> passou a ser o cartão das turmas** — a opção 1 da bancada, escolhida por ela. O nome e o selo em
> cima, o complemento por baixo, e **três caixinhas** com o «?»: `Música`, `Direção`, `Notação`. A
> da notação abre a decomposição **trecho a trecho**, lida do motor. Nenhuma classe nova: as peças
> são as da folha, e a marcação é a da turma. Medido: **285 px por cartão a 320**, 192 a 390, 142 a
> 768, **sem transbordo** em nenhuma.
>
> **E o vocabulário cresceu**, a pedido dela: a categoria **Cabeça**; `↻` rotação para dentro e `○`
> abre (os pares que faltavam); os **lados nos três eixos** (`F`/`T` sagital, `C`/`B` vertical, além
> do `D`/`E`); as direções **para dentro** e **para fora**; e a orientação **de lado · perfil** — com
> o rótulo do `épaulement` corrigido, porque «ombros rodados» dizia que é o ombro que roda.
>
> **Entrega anterior** (base `544acf4`). Nesta entrega: **gravar uma edição
> passou a SUBSTITUIR.** Ela esticou o `Plié` de 8 para 16 tempos e o registo antigo ficou ao lado;
> a hipótese dela era `INSERT` onde devia ser `UPDATE`, mas a mecânica é outra: a **chave do registo
> é `<tempos>|<compasso>`**, e mudar os tempos muda a chave. Não havia verbo errado — faltava dizer
> **qual é a chave que sai**. A tela passa a mandar `musicaAnterior` e o servidor apaga-a, com nota
> a dizer o que vai acontecer **antes**; e há uma caixa explícita para «guardar como música nova»,
> que é a outra intenção. Medido antes de escrever: **nenhum plano de ensino usa o `Plié`**, e
> portanto nada fica em lacuna.
>
> **E a bancada que faltava.** O pedido de uma **página para ver e validar** a listagem dos verbetes
> — no computador e no telemóvel — não tinha sido entregue: eu implementei a listagem na Produção em
> vez de construir a bancada. Passa a existir
> `experimentos/propostas/proposta-verbetes.html`, com três opções medidas a **320, 390, 768 e 1280
> px**: 66 px por linha hoje, 198 px o cartão das turmas, 561 px com a notação à vista. E o
> `construir.js` deixou de ser tudo-ou-nada: uma bancada que lê o alfabeto não precisa de ciclo.
>
> **Duas entregas antes** (base `04e2597`). Nesta entrega: **a música duplicada
> passou a ter porta.** Ela duplicou o `Plié` de 8 para 16 tempos, gravou, e o registo «não apareceu»
> — mas **estava gravado**: o alfabeto, versão 17, tem as duas músicas. O que faltava era o caminho
> de volta: a listagem dizia «2 músicas» e o «editar» abria sempre `Object.keys(musicas)[0]`, isto é,
> **sempre a primeira**. Passa a haver **uma linha por música**, no modelo do cartão das turmas, com
> os tempos, o compasso, os trechos, as direções e as categorias — e a música vai no botão. De
> caminho: a **correcção volta a andar por passos** (um painel, não três), o **sinal troca-se no
> lugar** (clica-se a ficha, clica-se o sinal novo), e as etiquetas passaram a **português** — o
> `nome` é um campo do vocabulário, não uma tabela na tela.
>
> **Duas entregas antes** (base `1b99e51`). Nesta entrega: **a barra passou a
> duplicar-se.** Um botão «Duplicar o exercício» clona a decomposição inteira — todos os compassos,
> as pernas e os braços — e sobe os tempos sozinho, para o `Plié` em 1ª se repetir em 2ª, 4ª e 5ª
> sem se escrever tudo outra vez. Ele **não reescreve sinal nenhum**: no `Plié` o `1ª` está nas duas
> pistas (perna `ED 1ª ↓ ↑`, braço `⌒ 2ª → 1ª → 2ª`), e uma troca automática escreveria
> `⌒ 2ª → 2ª → 2ª`. A posição muda-se depois, no «Editar», onde se vê o que se está a mudar. De
> caminho ficou medido o que **não** se resolveu: mudar os tempos **apaga a decomposição em
> silêncio** — a duplicação não passa por lá, mas quem escreve à mão passa.
>
> **Duas entregas antes** (base `a3f99d5`). Nesta entrega: **um balde vazio deixou de
> bloquear a gravação.** O editor deixava ficar `celulas: { devant: [] }` quando o último trecho de
> uma direção saía — e um balde vazio é **invisível**, porque a tabela percorre células e zero
> células não desenham linha. Ela recebeu um `400` com «a direção «devant» não tem célula» e a frase
> que resolve o caso é a dela: «em nenhum momento eu escolhi «devant»». `semBaldesVazios` vive no
> **núcleo**, é usada pelos dois lados, e **não apaga o erro** — só a lista vazia sai; uma chave que
> não é lista continua a ser acusada. De caminho saiu uma **quarta** soma em linha, que não decidia
> nada e respondia `soma: 12` a um verbete aceite com 8.
>
> **Duas entregas antes** (base `b2d6816`). Nesta entrega: **a tela deixou de somar
> em fila** — a régua das pistas tinha sido aplicada em três sítios e ficou um quarto por corrigir: a
> conta que a página faz **antes de enviar**. Um `Plié` correcto (pernas 8, braços 4, em paralelo)
> era **recusado na tela** com «as células somam 12», antes de chegar ao servidor que já o aceitava.
> Passa a chamar `cobertura()` — a mesma função da tabela —, e a mensagem mostra as pistas. E a
> **recusa deixou de navegar**: era `irParaPasso(...)`, e atirava o professor para o passo da música
> sem o deixar ler o que estava errado.
>
> **Entrega anterior** (base `65326a2`). Nesta entrega: **«Acrescentar trecho»
> desaparece durante a correcção.** Os dois botões eram **um só**, com o rótulo a alternar entre
> «Acrescentar trecho» e «Guardar a alteração» — e um rótulo que muda não esconde nada. Passaram a
> ser **dois**: em correcção, o «Acrescentar» **sai de cena** e o «Guardar» entra. Uma função, dois
> botões, para não divergirem.
>
> **Entrega anterior** (base `9e04787`). Nesta entrega: **corrigir um trecho
> deixou de lhe reescrever o compasso.** A causa era uma linha — `splice` + `push`, que mandava a
> célula corrigida para o fim —, e como o compasso sai da **ordem** (um relógio por pista), corrigir
> uma descrição mudava a posição temporal. Passa a **substituir no lugar**. E os **três
> redirecionamentos** que ela relatou — «Acrescentar Trecho» a sair da decomposição, «Editar» a
> saltar para o passo 4, «Guardar» a mudar de passo — desapareceram: a correcção **abre a área do
> trecho onde se está** (os dois painéis e a decomposição, com o botão de guardar à vista) e nada
> muda de passo sem o utilizador. O «Cancelar» continua a fazer o que ela marcou como CORRECTO.
>
> **Entrega anterior** (base `de43a1b`). Nesta entrega: **as pistas na notação** —
> as células passam a ser contadas por **categoria** (Pé · Peso · Perna · Braço), e não em fila
> única, e é isso que **fecha o `Plié`**: ele somava 12 tempos numa música de 8 porque as pernas (8)
> e os braços (4) correm **em paralelo**. Com isso, **9 das 13 músicas fecham** (eram 8), e a Aula 01
> deixa de lhe pôr `conferir`. Também: a **contagem é por pista** (reverte, com razão, uma decisão de
> 29/10), a **métrica composta** oferece os fins que fecham pulso (6/8 são dois pulsos de três), a
> **repetição** passou a ser da célula (`1–2 ×2`, e entra na conta), e o bloco de posições passou a
> ser **«Posições dos pés e braços»** com a preparatória e a **3ª de rótulo duplo** («terceira ·
> quinta»). O **método** entrou no verbete como **herança com sobreposição**, porque o plano já o
> declara e é obrigatório.
>
> **Entrega anterior** (base `e323e60`). Nesta entrega: **a licença está decidida** —
> três camadas (a máquina é proprietária e **não** se licencia com os produtos; o catálogo licencia-se
> por escola, **vinculado à fotografia datada**; o que a escola acrescenta **é dela**, com uma
> concessão estreita para a via inversa), escrita na `ARQUITETURA-GERAL.md` §10 —, e **o produto é
> pacote próprio**, com âncora, versão e licença independentes do ciclo. A licença obrigou a medir uma
> coisa que faltava: **25 das 59 descrições não têm `fonte`**, e sem origem declarada não podem entrar
> na edição paga. E foi corrigida uma **citação minha, falsa em cinco sítios** — «a
> `ARQUITETURA-GERAL.md:109` diz a definir»; a frase verdadeira é do `REGISTRO.md:109`, na entrada de
> 18/09/2026. Nenhuma linha de código; o `LICENSE.md` **não** foi criado (ela vai testar a `breu`).
>
> **Entrega anterior** (base `377544c`). Nesta entrega: **a decisão dos três produtos**
> — dicionário, syllabus e aula pronta, gerados **antes do ciclo** e entregues **conforme o plano
> contratado** (o Avançado recebe; os outros fazem tudo) —, e o plano que a constrói:
> [PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md), em seis fases. A resposta à pergunta
> dela sobre **quantos motores**: **um motor, três saídas, três manifestos** — a granularidade que a
> negociação pede está nos manifestos, não no código. O plano declara ainda as **nove colisões** com
> os planos existentes e o ajuste de cada uma, e a **C22** ganhou a correção de leitura (o gerador
> não é o quarto produto: é o **meio**). Nenhuma linha de código mudou.
>
> **Entrega anterior** (base `273b62d`). Nesta entrega: **o modelo tem três eixos,
> não um** — a palavra «eixo» aparece uma vez porque o rótulo da dimensão é **prefixo por
> concatenação**, e é ele que rotula «Musicalidade» e «Expressão» como «Técnica — …»; **o ritmo
> nunca esteve em aberto** — é obrigatório no cadastro da turma, conferido em quatro portas do
> `bastidores.js`, e é **do contrato**, não do catálogo (a C19 fechou-se pela negativa); o **corpo já
> está no ciclo** (anamnese → PO → bloco 10 do plano), e o que falta é só a ligação **ao exercício**;
> e nasceu a **C22** no `PLANEJAMENTO-LASTRO.md` — o verbete como átomo do syllabus, os quatro
> degraus e o **veredicto de viabilidade do motor**: é viável, faltam quatro arrumações e cinco
> músicas por corrigir. **Nenhuma linha de código mudou nesta entrega** — é fotografia e registo.
>
> **Entrega anterior** (base `804000a`). Nesta entrega: o verbete passou a ter
> **seis passos**, e o **exercício novo é o passo 1** — o «+», o «Gravar exercício» e o «Cancelar»
> deixaram de existir, e quem grava o termo é o **«Seguir →»** que já existia; a **gravação do
> verbete confere a música** (as células têm de fechar os tempos declarados) e diz onde se corrige —
> passo 3 (a música) ou passo 4 (para onde); e a **Regra 15 foi substituída**, com nota no
> `REGRAS.md` e motivo declarado.
>
> **Entrega anterior** (base `2a7f13f`). Nesta entrega: a **§4 deixou de dizer
> uma coisa falsa** — afirmava «exercícios neste bloco: nenhum» sobre o bloco de musicalidade, e as
> três linhas de exercício tinham tempos e compasso; passou a ser uma **vista consolidada por
> compasso**, um exercício uma vez só, com a contagem *e* o que cai nela, e a «fatia do plano»
> (30% — 27 tempos) saiu porque repetia a §3 sem a tabela; o título da §3 passou a ser **«Distribuição
> do tempo pelos blocos»**; o **plano de ensino ganhou o bloco 10, «Aspecto físico — força e
> flexibilidade»**, lido das anamneses da turma e marcando o ponto de atenção pela ordem das opções
> da própria anamnese; e um **resíduo de expurgo** (`pe-torto/ciclos/ciclo-01-batata`, um ciclo criado
> e nunca preenchido) deixou de travar o commit de quem mexe em `porta/`.
>
> **Entrega anterior** (base `d74fda1`). Nesta entrega: o **molde dos
> schemas** ficou atrás dos professores e matou a geração do ciclo da `breu` («campo ausente»),
> e foi corrigido e **unificado** num leitor só (`570d900`, `e27e462`); a página do **Vocabulário
> saiu** e o botão de semear passou para o «+» do verbete (`ea6cd0d`); a **seta subiu ao título**,
> os **passos desceram para a linha inteira** e o vocabulário deixou de ser só do ballet — `Perna`
> em vez de `Plié`, e orientações com nome português (`a5275c3`); a **Aula 01 deixou de afirmar o
> que ninguém escreveu** — a §2 dizia «força e flexibilidade» sobre o campo da sala, a §4 tinha um
> «Pulso» fixo, a §6 chamava «simulado» a um ciclo publicado e a §8 era um `[Preencher]` mudo —, a
> **proveniência passou a ser dois links** com o objetivo de cada documento, o **próximo passo**
> passou a ter os três estados, e o **PDF ficou reproduzível** (`03be290`, `469c9d5`); a **força e
> a flexibilidade vêm da anamnese**, com os 15 campos que ela escolheu, pelo nome e com o registo
> completo a abrir noutra aba (`cf1ef52`); e a **musicalidade deixou de ser uma lacuna** — consolida
> o que o verbete e a sequência já dizem, por música (`d74fda1`).
> **Como pedir uma atualização:** ver [§13 — Rotina](#13-rotina-de-atualização-e-transferência).

## Quem é dono de quê

Cinco documentos falam do estado. Sem isto escrito, um deles morre por duplicação.

| Documento | Dono do quê | Como nasce |
|:--|:--|:--|
| **`ESTADO-ATUAL.md`** (este) | **Juízo**: o que funciona, o que não, o que está decidido, o que é hipótese | curado, à mão |
| **`HANDOFF.md`** | **Extração**: commit, professores, ciclos, âncoras, última entrada do REGISTRO | gerado por `tools/gerar-handoff.sh`, nunca à mão |
| **`REGISTRO.md`** | **Crónica**: a decisão datada, com motivo e o que a tornou necessária | à mão, ordem cronológica |
| **`FRENTES.md`** | **Panorama**: os três trilhos de trabalho em aberto | à mão |
| **`PLANEJAMENTO-LASTRO.md`** | **Mapa de produto**: para onde o Sistema Lastro evolui | à mão |

**A regra de leitura:** uma sessão nova lê o `HANDOFF.md` para saber onde está o repositório e
**este documento** para saber o que se pode afirmar sobre ele. O `HANDOFF.md` aponta para cá.

## Como se lê este documento

Toda afirmação leva uma etiqueta. Sem etiqueta, é prosa.

| Etiqueta | Significa |
|:--|:--|
| **CONFIRMADO** | verificado agora no código, num ficheiro, num comando ou em produção |
| **DECLARADO** | foi dito por uma pessoa; não verifiquei tecnicamente |
| **DECIDIDO** | decisão de projeto vigente, com data e motivo no `REGISTRO.md` |
| **HIPÓTESE** | interpretação minha, ainda não confirmada |
| **PENDENTE** | questão em aberto, à espera de decisão |

Não se afirmar que uma funcionalidade existe porque há um ficheiro com o nome dela. Um ficheiro
chamado `avaliacao.js` não é uma avaliação a funcionar.

---

## 1. Identificação

**Nome comercial:** o produto é o **Sistema Lastro**; este repositório é o **Projeto Ciclo**, o
protótipo a partir do qual ele se constrói. A convivência dos dois nomes é declarada, não é
renomeação. **DECIDIDO**.

**Finalidade:** a memória da aula dada. Cada aula é planeada antes de ser dada; o plano
(`aula-NN.md`) fixa objetivo, marcos e volume e dá a linha de base. O que se registra é o que
**mudou em relação ao plano**. **DECIDIDO**.

**Escopo atual — o que este projeto é e não é:**

- **É um protótipo, testado no universo da dança.** **Não é agnóstico.** O projeto agnóstico será
  criado a partir dele. **DECIDIDO**.
- **Não é o projeto de mestrado** — o mestrado está noutro diretório, e é de lá que vêm o PO e o
  FIPP. **DECIDIDO**.
- **Não implementa o FIPP.** A âncora `.fipp` (`tools/hash-ciclo.sh`) partilha o princípio —
  o passado incorpora-se, não se reescreve — mas é aproximação, não o framework. **CONFIRMADO**
  por leitura do script e do `PROTOCOLO.md`.
- **Não avalia.** Registra o cotidiano do professor em sala. A avaliação é fronteira de outro
  módulo, ainda não desenhado. **DECIDIDO**.
- **A integração com o projeto das secretarias não existe** — nem a fronteira de entrada nem a de
  saída foram desenhadas. **CONFIRMADO**: não há código de integração no `motor/`.

## 2. Estado confirmado

Verificado nesta fotografia, com os comandos da §9.

- **A entrega foi publicada em `d349ed0`;** após o push, `git fetch origin` confirmou `origin/main` alinhado, sem divergência. **CONFIRMADO** naquele momento.
- **O alfabeto do `bale-classico` tem CINCO categorias** — `Pé · Peso · Perna · Braço · Cabeça` —,
  **três eixos de lado** (`D`/`E` horizontal, `F`/`T` sagital, `C`/`B` vertical), **cinco direções**
  (`devant`, `a-la-seconde`, `derriere`, `para-dentro`, `para-fora`), **seis orientações** e
  **treze sinais de movimento**. Lido do ficheiro, versão 17 do alfabeto. **CONFIRMADO** 02/11/2026.
  A **Cabeça é uma pista** — um movimento de cabeça conta os seus tempos em paralelo com as pernas —
  e **não** um membro com posições: o vocabulário ainda não tem nenhuma posição de cabeça, e isso é
  conteúdo a escrever com fonte, não código.
- **19 professores** em `professores/`, e **uma variante**: a `breu`, criada por ela a 02/11/2026
  (`2fd6c07`) — `coqui-de-redinha/ciclos/ciclo-01-breu.conf`, com `DOCS=""` (é o **ciclo-zero**, sem
  documentos; existe o **pacote-zero** `ciclo-01-breu/`, com `assets`, `index.html` e
  `plano-observacao`). O `indices/acervo.json` diz **1 ciclo, 0 variantes**, com `estado: ancorado`.
  **CONFIRMADO** por contagem e por leitura do índice, depois do rebase, em 02/11/2026.
- **O mesmo número mudou DUAS vezes no mesmo dia, e isso é a lição.** Minutos antes desta linha, o
  expurgo da `batata` (`aeb2b2c`, **81 ficheiros**) tinha levado as **duas** variantes — o ciclo-zero
  (`pe-torto/01/batata`) e o pacote de teste (`pe-junto/01/batata-bale-nivel-1-teste-2`) — e o acervo
  ficou a **0 ciclos**. Contar sem `git fetch` antes teria dado um terceiro número errado. É a mesma
  família de erro do «o worktree não sabe que o remoto mudou»: **um `git status` limpo diz que nada
  aconteceu aqui, não que nada aconteceu.**
- **A licença existe em dois ficheiros, e são dois por uma razão.** `LICENSE.md` na raiz (a
  **máquina**: todos os direitos reservados, não licenciada com os produtos) e `biblioteca/LICENSE.md`
  (o **catálogo**: seis cláusulas, a concessão estreita da escola e a condição do `fonte`). São dois
  porque as duas camadas dizem o contrário uma da outra — «não se licencia» e «licencia-se com
  limites» — e um ficheiro só não consegue dizê-lo. **CONFIRMADO** 02/11/2026 por leitura.
  A **fotografia datada** (`catalogo@AAAA-MM-DD`) passou a ser **calculada** do último commit que
  tocou o catálogo — medido `catalogo@2026-11-02` (`23d4c0e`) — e é **derivada**: diz «a versão nesta
  data», não «a versão que esta escola contratou». Essa é do **contrato** (C8), e a data dele vence
  quando existir. **PENDENTE** declarada, e já não impeditiva. **CONFIRMADO** 02/11/2026 por
  `provar-produtos` §L.
- **17 regras** em `REGRAS.md` e **22 pétreas** em `PROTOCOLO.md`. **CONFIRMADO** (contagem).
- **O motor tem 52 ficheiros versionados, 31.850 linhas** entre `motor/nucleo/` e
  `motor/servidor/`. **CONFIRMADO** em 02/11/2026.
- **33 rotas** registadas em `motor/servidor/rotas.js`. **CONFIRMADO** em 02/11/2026.
- **91 provas versionadas** em `experimentos/provar-*.js` (104 no disco; as outras são bancadas
  locais que o `.gitignore` fecha). **CONFIRMADO** em 02/11/2026.
- **O molde dos schemas tem um leitor só.** `motor/nucleo/schemas.js` é o único sítio que lê
  `modelo/ciclos/`; o `tools/gerar-schemas.js` é a porta para o shell e o provisionador do Worker
  deixou de pedir o molde por HTTP (os cinco `GET` saíram). `gerar-schemas --conferir` corre no
  `pre-commit`. **CONFIRMADO** (`provar-schemas` 29/29, `check-schemas` TUDO CERTO).
- **A geração de um ciclo é REPETÍVEL byte a byte, e não só entre duas corridas seguidas.** Duas
  gerações dão o mesmo md5 nos quatro ciclos e deixam o `git status` limpo — inclusive **depois de
  um commit** que não toque nas fontes, que é o caso que estava a falhar: a data vinha de `git log`
  sobre a pasta do ciclo (que contém as saídas) e o `ciclos.json` levava `gerado_em` e `estado`. A
  data passou a ser a de início do ciclo, e os dois campos saíram. **CONFIRMADO** em 02/11/2026,
  **REMEDIDO** em 15/11/2026 (`provar-saidas-estaveis` 13/13).
- **A força e a flexibilidade chegam ao PO pela anamnese.** O nó `linha-de-base` declara 15 campos
  em dois grupos, e o mapa servido ao vivo em `batata.tmenegaz77.workers.dev` devolve-os com o nome
  do formulário («Flexibilidade dos isquiotibiais»). **CONFIRMADO** em 02/11/2026 por
  `provar-forca-e-flexibilidade` (17 asserções, com controle negativo) e por uma leitura ao ar.
- **A §4 da aula não pede nada a ninguém.** Consolida, por música, a grade de contagens do verbete e
  os exercícios que a usam; a música vem da sequência do plano. **CONFIRMADO** em 02/11/2026 por
  `provar-o-que-vem-do-dado` (mutação: trocar a música muda o documento).
- **4 workflows** em `.github/workflows/`: `criar-escola`, `derivados`, `gerar-ciclo` e `publicar`.
  **CONFIRMADO** em 17/11/2026. Eram **6** até 16/11 (`reancorar` + `regerar-indices` passaram a
  `derivados`, commit `774f239a`), e **5** até 17/11 (`deploy-raiz` + `deploy-escolas` passaram a
  `publicar`). A razão das duas fusões é a mesma e é de facturação: **o GitHub cobra cada JOB
  arredondado ao minuto**, e um push que tocasse em `motor/**` pagava três jobs para ~60 s de
  trabalho.
- **Produção da escola `batata` responde** (`batata.tmenegaz77.workers.dev`). **CONFIRMADO**
  em 25/10/2026:

  | Caminho | Código |
  |:--|:--|
  | `/` | 200 |
  | `/ciclos/planos/` | 200 |
  | `/ciclos/referencias/` | 200 |
  | `/aulas/` | 200 |
  | `/consulta/` | 200 |
  | `/area-do-professor/anamnese/` | 200 |
  | `/area-do-professor/plano-de-ensino/` | 200 |
  | `/area-do-professor/plano-de-observacao/` | 200 |
  | `/area-do-professor/notacao/` | 200 |
  | `/bastidores` | 302 (login) |

  Os caminhos antigos `/ciclos/`, `/glossario/`, `/notacao/`, `/producao/` dão **404** — foram
  removidos pelo reagrupamento de 24/10/2026. **CONFIRMADO**.

- **Publicação de 27/10/2026:** `Publicar as escolas` concluiu com sucesso no commit `d349ed0`,
  incluindo o job de Batata; a única conferência final em `/aulas/` respondeu HTTP 200 e confirmou
  os links da prosa e da ação «Abrir notação». **CONFIRMADO**.

- **Publicação da Aula 01 em 27/10/2026:** o commit `8b939d0` foi enviado a `origin/main`; o run
  #287 de `Publicar as escolas` e o job `publicar (batata)` concluíram com sucesso. Uma única
  requisição final à raiz respondeu HTTP 200 e o HTML contém o link para `/aulas/`. A rota não foi
  recarregada após este deploy. **CONFIRMADO**.

- **Publicação de 28/10/2026 (cabeçalho e cartão):** `a2bbdfa`, `29a95e5` e `3c3a29d` enviados a
  `origin/main`; `Publicar as escolas` #289, `Reancorar a cadeia` #404, `Regerar os índices` #206 e
  `Publicar a raiz` #105 concluídos com sucesso. A conferência ao ar foi à aula e ao glossário da
  Batata. **CONFIRMADO**.

- **Publicação de 28/10/2026 (leitura dos documentos):** os três commits foram enviados a `origin/main`; `Regerar os
  índices` #205, `Publicar as escolas` #288 e `Reancorar a cadeia` #403 concluíram com sucesso no
  commit `d9f085f`. A conferência ao ar foi à escola `batata`, que é a única com pacote. O plano
  publicado não tem subtítulo nem ficha, mostra os dois grupos do contexto, o calendário em duas
  partes e o rodapé do próprio documento. **CONFIRMADO**.

- **O `HANDOFF.md` estava desatualizado** — dizia `6bdb06a` com o `HEAD` em `7182307`.
  **CONFIRMADO** e corrigido nesta sessão por regeneração.
- **A publicação de 01–02/11/2026 foi verde em todas as Actions.** `Publicar as escolas`,
  `Publicar a raiz`, `Reancorar a cadeia` e `Regerar os índices` concluíram com sucesso nos commits
  `cf1ef52` e `d74fda1`. **CONFIRMADO** pela API do GitHub.
- **O ar serve a Aula 01 e o plano desta entrega.** Uma carga por página, no fim: `aula-01` **200**
  com os oito títulos, «3. Distribuição do tempo pelos blocos» e «Os compassos desta aula» (e
  «Exercícios neste bloco» já não aparece); `plano` **200** com «Aspecto físico — força e
  flexibilidade» antes da música. **CONFIRMADO** em 02/11/2026, depois do push — a Action
  `Publicar as escolas` corre em cada push e **publica sem passo manual**: dizer «não publiquei»
  teria sido falso. É a mesma família do «o worktree não sabe que o remoto mudou» — supor o que o
  outro lado faz, sem lá olhar.
- **«O push publica» é verdade, mas não é «todo o push» — e a diferença é de custo.** O
  `publicar.yml` tem **`paths:`**, e o que lá está é **a união do que a raiz empacota com o que a
  escola serve** (desde 17/11/2026, quando os dois fluxos passaram a um):
  `professores/**/ciclos/ciclo-*/**`, `professores/**/ciclos/*.conf`, `motor/**`, `workers/**`,
  `wrangler.*.jsonc`, `tools/templates/**`, `tools/montar-publicacao.js`, `tools/check-identidade.js`
  e `experimentos/propostas/**`. **Um commit que só toca `*.md` na raiz não publica nada** — medido
  em 02/11/2026: os pushes `377544c`, `e323e60` e `08551a9` (documentação) **não** geraram run de
  `Publicar as escolas`, enquanto `aeb2b2c` (expurgo) gerou três. **CONFIRMADO** pela API das Actions
  e pelo `paths` do workflow. **Corrige a frase que esta secção repetia** («o push publica» como se
  fosse incondicional): é verdade para o que chega ao site, e é falso para documentação — o que é
  bom, porque é exactamente o que a regra de «medir sem gastar a cota do ar» precisa.
- **A expectativa de que a publicação ficaria por fazer estava errada**, e vale a pena registá-lo: o
  plano era não publicar, porque ela vai expurgar a `batata`. Mas o `Publicar as escolas` é um
  workflow de push e correu — as quatro Actions de `8175264` ficaram `success`. Publicar não estraga
  nada (o expurgo apaga), e **não publicar não era uma opção que este repositório oferecesse.**
  **CONFIRMADO** pela API do GitHub e pela leitura das duas páginas.
- **O verbete tem SEIS passos, e o exercício novo é o primeiro.** O «+» que abria um cadastro, o
  «Gravar exercício» e o «Cancelar» **deixaram de existir**: o passo 1 são os campos do exercício
  novo (nome, categoria, tradição, carregar as turmas iniciais), o **«Seguir →»** é que grava o
  termo, e avançar sem nome não grava nada. O seletor do exercício é o passo 2; a música é o 3, o
  «para onde» o 4, os sinais o 5, a decomposição o 6. **CONFIRMADO** por `provar-celula` e por
  `provar-verbete`.
- **O passo 1 ficou condicional, e a frase do exercício vive lá** (02/11/2026). A regra, ao pé da
  letra dela: «se não preencher o nome, os campos seguintes permanecem opcionais e ele pode navegar
  livremente; se escrever o nome, os seguintes tornam-se estritamente obrigatórios». `oQueFaltaNoPasso1()`
  devolve **`[]` sem nome** e, com nome, exige a frase, a categoria e a tradição — a recusa diz o
  que falta pelo nome. A **categoria e a tradição deixaram de nascer escolhidas**: os dois
  `<select>` tinham a primeira opção já marcada, e por isso os dois obrigatórios nunca podiam
  faltar. E o campo **«posição em que o exercício acontece» saiu do formulário** — pedi-la era
  pedi-la duas vezes, porque ela escreve-se nos sinais do trecho. **O dado fica**: uma posição já
  gravada continua no alfabeto e continua a ler-se na listagem. **CONFIRMADO** por `provar-celula`
  §23 (203 asserções) e por `provar-verbete`.
- **A música não se muda por baixo dos trechos** (02/11/2026). Com uma célula que seja, `#vbtempos`
  fica `readOnly` e `#vbcompasso` `disabled`, com `aria-readonly` e uma nota que diz porque e para
  onde ir (o «Duplicar o exercício», que escreve tempos e células na mesma acção). **CONFIRMADO** em
  §23-B, e a libertação medida depois do «Apagar», que limpa o formulário.
- **O verbo apagar o verbete existe, e o que ele NÃO apaga está dito** (02/11/2026). O `DELETE
  /api/bastidores/verbete` respondia 409 e passou a apagar: exige token e **nome** (um `DELETE` sem
  corpo apagaria «o que estivesse lá»), sobe a versão do alfabeto e grava com
  `chore(notacao): apagar o verbete «X»`. O **vocabulário não se toca** — a notação sai, a palavra
  fica. A consequência (uma aula publicada passa a sair em lacuna) vai escrita na pergunta que a
  tela faz antes do gesto. **CONFIRMADO** por `provar-verbete` §C-2 e `provar-celula` §23-D.
- **O `DELETE` TEM GUARDA DE PROVENIÊNCIA, e a do `UPDATE` é o ajuste** (02/11/2026). Um verbete que
  compõe um **plano de ensino** (o exercício está no repertório de um envelope, ou associado a uma
  turma com plano) ou o repertório de uma **curadoria** não se apaga: `409` com a consequência e o
  caminho («Descontinuar»). `usos === null` (leitura falhada) conta como vinculado. E um `UPDATE`
  num verbete em uso **não reescreve** — passa a ser um **ajuste**, escolhido por ela entre três
  caminhos: o estado anterior vai para `versoes[]` com `ate` e o motivo, e a composição escolhe o
  estado que valia **na data do envelope** (`gerado_em`). Um verbete sem vínculo continua a editar-se
  como sempre, e um verbete sem `versoes` lê-se exactamente como antes — não houve migração.
  **CONFIRMADO** por `provar-verbete` §G (as três portas, e uma leitura só do índice), §I (as peças)
  e §J (fim a fim: o mesmo envelope com duas datas dá dois textos).
- **Os índices que o pedido nomeia não têm onde existir, e isso está medido, não suposto.** O
  dicionário é um JSON de 93 termos no repositório, lido inteiro para memória; os envelopes vivem
  num **índice de resumos** (`envelope/.indice.json`) que já traz `professor`, `turma`, `ciclo` e
  `repertorio` numa leitura. Não há base de dados, nem `tenant_id` — o isolamento é o `escola/` no
  caminho da chave. O que se fez foi o que o pedido queria no fundo: a guarda consulta o índice
  **uma vez** em vez de ler envelope por envelope, e a prova conta as leituras.
- **A tradição de referência é uma lista só, e o rótulo está no dado** (02/11/2026; **corrigido na
  mesma data**). Entra **CUBANA**; a ordem é RAD · Francesa · Vaganova · Cubana · Compartilhada. A
  primeira redação desta linha dizia «o ecrã mostra em caixa alta» e «o rótulo é derivação
  (`rotuloDaTradicao`)» — **está desactualizado**: ela reviu a decisão à tarde e pediu *Title Case*
  com **apenas as siglas em caixa alta**. O mapa de rótulos passou para o **próprio ficheiro**
  (`tradicoes.json` → `rotulos`), e `rotuloDaTradicao` só o lê: uma regra automática de maiúsculas
  não saberia que `RAD` é sigla e `Vaganova` é nome próprio. O **dado dos termos não é migrado**
  (`vocabulario.json` grava `francesa`, e `diferencasDeNomenclatura` tem uma coluna por chave).
  **CONFIRMADO** por `provar-verbete` §H, incluindo «em todos os selectores, o texto é o rótulo do
  ficheiro».
- **O «Apagar o verbete» vive só na LISTAGEM** (02/11/2026, segunda correcção do dia). Ele esteve
  também no passo 6 por pedido da manhã, e saiu: é a tela onde se escreve a decomposição, e apagar o
  verbete inteiro ao lado do «Acrescentar trecho» é um alvo a um clique do gesto mais frequente. O
  verbo e a guarda de proveniência ficam os mesmos — o que mudou foi o sítio. **CONFIRMADO** por
  `provar-celula` §24-F (o botão não existe nem na marcação nem no script, e o da lista continua).
- **A navegação bloqueia para a frente, e só para a frente** (02/11/2026, segunda correcção do dia).
  O passo seguinte e o «Seguir» ficam `disabled` enquanto faltar um obrigatório da etapa; **voltar
  continua livre**, porque não perde nada (o estado vive no DOM e o rascunho não é tocado). O
  `title` do botão diz o que falta, por nome. O «Acrescentar trecho» também espera os passos 1–5.
  A regra anterior — «a tira não bloqueia» — está **revogada**, e o comentário no código di-lo.
  **CONFIRMADO** por `provar-celula` §24-G e §24-H.
- **Escolher um exercício no passo 2 preenche e CONGELA o passo 1** (02/11/2026, segunda correcção
  do dia). Categoria e tradição vêm do termo; a frase vem do que está **gravado** e, quando não há
  nada, da definição do dicionário (P-03/P-04). Os três ficam `disabled` e a nota diz que a
  definição é do dicionário — para a mudar, edita-se o **termo**, não o verbete. Sem nome de
  exercício novo, o passo 1 também não pede nada. **CONFIRMADO** por `provar-celula` §24-C.
- **O `ED`/`EI` do alfabeto deixaram de se chamar «en dehors»/«en dedans»** (02/11/2026). Os glifos
  `↺`/`↻` já diziam «rotação para fora/dentro»; os dois que descrevem a **varredura** da perna
  passam a dizer «varredura para fora/dentro», sem nomenclatura estrangeira duplicada. Os **sinais
  não saíram**: `ED`/`EI` continuam válidos no dado, com o mesmo glifo e o mesmo significado —
  mudou o rótulo, e é isso que tira a redundância que ela viu no passo 5. Alfabeto na **versão 31**.
  **CONFIRMADO** por `provar-notacao` (48 asserções, 0 falhas).
- **As fixtures do `breu` passaram a Plié · Battement tendu · Battement fondu** (02/11/2026), com
  `musica` e `celulas` pré-escritas — o `Plié` em 8 tempos de 4/4 e os outros dois com um en croix
  completo. As três passam o `validarVerbete`, e as curadorias acompanham. **CONFIRMADO** por
  validação directa com `validarVerbete` e por `provar-teste` (a §7 mede o termo a chegar ao
  formulário). O limite fica dito: a fixture **não é conteúdo pedagógico** — é massa sintética, e
  nota-se nos textos.
- **O preenchedor de fixtures chamava uma função que já não existe** (02/11/2026, defeito medido).
  `modoExercicio(true)` saiu quando o «+» virou o passo 1; o `typeof` dava `undefined`, a função
  saía pela porta de emergência e **nenhum termo chegava ao formulário** — `provar-teste` falhava
  com `'' !== 'Jeté'` desde então. Agora o preenchimento **escolhe** o exercício no passo 2 (o termo
  já existe no vocabulário) e, quando há bloco `verbete`, põe a música e as células no estado da
  página. **CONFIRMADO** por `provar-teste` §7.
- **Os índices do dicionário e do syllabus estão DECLARADOS, e não implementados** (02/11/2026). O
  `PLANO-INDICES.md` §4.1 manda declarar antes de emitir: entraram `termo` e `verbete` em
  `indices/esquema/campos.json` (`estado: prevista`) e a relação `verbete → termo`. A relação de
  **proveniência** (verbete empregado em turma/plano/curadoria) **não** se declara ali: ela já é
  respondida pelo acervo — `vinculo`, repertório da turma e `registro` —, e declará-la duas vezes
  daria duas respostas para a mesma pergunta. **CONFIRMADO** por `check-indices` (14/14, e as 10
  contraprovas a reprovarem como deviam).
- **O motor dos produtos existe para dois dos três, e não inventa** (02/11/2026). O **dicionário**
  (`motor/nucleo/produtos/dicionario.js`) e o **syllabus** (`.../syllabus.js`) são puros,
  determinísticos e geram markdown a partir do catálogo já lido; o CLI `node motor/produtos.js`
  escreve-os em `publicacao/produtos/<modalidade>/` (pasta gerada, no `.gitignore`). O que falta
  sai **nomeado**: `[Preencher]` para o termo sem definição ou sem origem, lacuna para o exercício
  sem verbete, `[conferir]` **com o motivo** para o verbete cujo `cobre` não fecha os tempos — e a
  contagem errada **não é publicada**. O nível que ainda não declarou unidades diz que é a lacuna.
  A **aula pronta não foi começada**. **CONFIRMADO** por `provar-produtos` (52 asserções), que
  mede o mecanismo sobre uma fixture declarada e, no catálogo real, só as **contagens** — a lição
  de 02/11/2026 é que uma prova que mede o conteúdo reprova quando o conteúdo muda.
- **A composição catálogo × escola tem código, a separação dos ficheiros NÃO** (02/11/2026). O
  `plano` (fase 1) pede dois ficheiros e um leitor que os componha; o que existe é a **função
  única** (`compor`, em `produtos/comum.js`, com a escola a ganhar e a marcar `origem`) e o
  dicionário a **excluir as adições por omissão** — o produto que se vende é o do catálogo. O que
  **não** foi feito: `termo-repo.js` continua a escrever no `vocabulario.json` do catálogo, e
  `lerModalidade` continua a lê-lo inteiro. Logo, o **critério 5 do plano** («criar um termo numa
  escola não altera o ficheiro do catálogo») **não está cumprido** — é lacuna declarada, não uma
  verificação que se possa alegar.
- **O exercício novo já está na lista ao avançar, e nada disto toca no KV.** O `POST
  /api/bastidores/termo` grava no **repositório** (`biblioteca/modalidades/bale-classico/
  vocabulario.json`, por `termo-repo.js`) e devolve o termo; a lista que `GET
  /api/bastidores/verbete` serve lê o **mesmo ficheiro no GitHub**. **Zero chamadas ao KV** nas
  duas rotas — **CONFIRMADO** por leitura das rotas e dos módulos. A tela acrescenta o termo à
  lista local sem esperar por outra leitura, e o mesmo nome não entra duas vezes.
- **A gravação do verbete recusa um verbete que não fecha a música.** Antes só se conferia `cobre`
  contra a soma das próprias células — uma conta do formulário consigo mesmo; a música, que é a
  chave do verbete, não era comparada com nada. Foi por isso que o `Battement fondu` ficou em
  «2|4/4» com 6 tempos e o `Plié` em «8|4/4» com 12. A recusa diz onde se corrige — **passo 3** (a
  música) ou **passo 4** (para onde) —, e o número sai de `passoPorRotulo()`, sobre
  `PASSOS_DO_VERBETE`, não escrito à mão: com seis passos, os dois subiram de 2/3 para 3/4.
  **CONFIRMADO** por `provar-celula` (a recusa, com o recado medido) e por `provar-verbete`
  (o servidor valida a música como quarto argumento).
- **Corrigir um trecho não lhe muda o compasso nem o lugar na lista.** O handler fazia `splice` +
  `push` — a célula corrigida ia para o **fim** da lista —, e como o compasso sai da **ordem** (um
  relógio por pista), corrigir uma descrição **reescrevia a posição temporal** do trecho. Medido, no
  cenário dela: três trechos de `Perna` em 2/4 dão compassos **1, 1 e 2**, e corrigir o primeiro
  deixava-o no 2. Agora **substitui-se no lugar** e a sequência mantém-se. **CONFIRMADO** por
  `provar-celula`, secção 20-A (143 asserções).
- **Um balde vazio é ruído, não uma declaração — e não bloqueia a gravação.** Com a direção a ser a
  **chave** da célula, uma chave com zero células diz o mesmo que a chave não existir. `semBaldesVazios`
  (no **núcleo**, usada pelo `verbete.js` e pelo `compor`) tira-a; o editor nunca a manda (o `×`
  leva a direção consigo, e há uma última defesa antes de enviar); e a gravação **normaliza**, para o
  ficheiro não ficar com o lixo do pedido. **A normalização não apaga o erro**: uma chave que **não é
  lista** fica e é acusada. **CONFIRMADO** pelo payload real, por `provar-celula` §20-B e por
  `provar-notacao` (78 asserções).
- **A conta dos tempos tem UM nome, e é chamada nos quatro sítios.** A régua das pistas foi aplicada
  no motor, no validador e na cobertura da tabela — e **faltou a conta do `submit`**, que somava em
  fila **e sem a repetição**. Resultado medido: um `Plié` correcto (pernas 8 + braços 4, em paralelo)
  era **recusado na tela** com «as células somam 12», antes de chegar ao servidor que já o aceitava.
  Passou a `var soma = cobertura();` — a mesma função da tabela. **CONFIRMADO** por `provar-celula`
  §15-A (148 asserções).
- **A recusa de gravação NÃO navega.** Era `irParaPasso(...)`, e o professor era atirado para o passo
  da música sem ler a mensagem no sítio onde estava. A mensagem diz **onde** se corrige; **ir é
  decisão de quem lê**. E ela fica numa faixa na própria página (`.res.erro`, com o fundo e o bordo da
  falha), não num `alert()` que se fecha e leva a mensagem consigo. **CONFIRMADO** por
  `provar-celula` §15.
- **«Acrescentar trecho» não existe durante a correcção — são dois botões, e não um que muda de
  nome.** Era um só (`vb-cel-acrescentar`), com o rótulo a alternar; um rótulo que muda não esconde
  nada, e quem corrige vê o mesmo botão no mesmo sítio. Agora `vb-cel-acrescentar` («Acrescentar
  trecho») fica **escondido** em correcção e `vb-cel-guardar` («Guardar a alteração») é que aparece.
  **Uma função, dois botões** (`acrescentarOuGuardar`), para os dois não divergirem. **CONFIRMADO**
  por `provar-celula` (145 asserções) e medido no browser.
- **A correcção de um trecho abre a área do trecho onde se está, e não muda de passo.** Os três
  redireccionamentos que ela relatou vinham todos de `irParaPasso(PASSOS_DO_TRECHO[0])`. A regra
  passa a ser: em edição, os painéis **4, 5 e o último** ficam à vista — o último também, porque é
  lá que está o botão que guarda, e sem ele quem corrige os sinais teria de o procurar;
  **acrescentar** e **guardar** não mudam de passo; **cancelar** também não, que é o comportamento
  que ela marcou como CORRECTO. **CONFIRMADO** por `provar-celula`.
- **As células contam-se por PISTA, e é isso que fecha o `Plié`.** A pista é a **categoria** (Pé ·
  Peso · Perna · Braço): `à frente` e `atrás` são o mesmo corpo e somam-se; `Perna` e `Braço` são
  corpos diferentes e correm **em paralelo**. O que o verbete ocupa da música é a **maior** pista. O
  `Plié` somava 12 numa música de 8 (pernas 8 + braços 4) porque era contado em fila; com pistas dá
  **8 = 8**, e passa a `estado: composto`. **CONFIRMADO** por `provar-notacao` (76 asserções) e pelo
  próprio motor. **9 das 13 músicas fecham** — eram 8.
- **A contagem é por pista, e isso reverte uma decisão de 29/10/2026.** Aquela decisão impedia dois
  trechos de começarem no mesmo tempo, porque a aula diria «duas coisas diferentes para o mesmo
  instante». Medido: em **duas categorias** o mesmo instante não é contradição, é **simultaneidade**.
  `opcoesDeContagem(cat)` soma só a pista da categoria, e o compasso da tabela sai de um **relógio
  por pista**. **DECIDIDO** e implementado em 02/11/2026.
- **A métrica composta deixou de ser lida como simples.** A contagem só via o numerador: em 6/8
  oferecia `1` a `1–6` como um compasso de seis. `passoDaGrade()` distingue os **compostos** (`/8`
  com numerador múltiplo de 3) — 6/8 são **dois pulsos de três**, 9/8 três, 12/8 quatro — e a lista
  traz **primeiro os fins que fecham pulso**, no fim os de meio (que **não** são proibidos: `1–2` num
  6/8 é síncope, e existe). **CONFIRMADO** por `provar-celula` (134 asserções). **Correção da
  proposta:** 3/4 é ternário **simples** e 6/8 é composto **duplo**; o que decide é a subdivisão do
  pulso, e por essa régua as duas caem em lados opostos.
- **A repetição é da célula.** `repeticoes` (inteiro ≥ 1) diz quantas vezes o trecho acontece; a
  `contagem` é a de **uma** execução e o que a célula ocupa é o **produto**. Entra em toda a
  aritmética (`temposDaCelula`), e um `0` é **recusado**. Na tabela lê-se «1–2 **×2**».
  **CONFIRMADO** por `provar-verbete`.
- **A TURMA É O RITMO; O ENSINO É DA CURADORIA (03/11/2026, revendo a decisão da manhã).** O
  professor, a modalidade, a tradição e o nível saíram do cadastro da turma e passaram para a
  **curadoria** — para a escola poder mover uma turma de nível sem destruir a estrutura
  operacional dela. O nível da curadoria é `grau` + `nivel`, na forma da tradição, e o rótulo
  (`nivelReferencia`) é **composto**. **A memória não se apaga**: uma turma que guardou o nível
  antigo conserva-o, e ele é lido quando a curadoria não declara — com a origem dita. A regra
  inteira está em `motor/nucleo/enquadramento.js` e na **§2.3 da `ARQUITETURA-GERAL.md`**.
  **DECIDIDO e implementado** 03/11/2026.
- **O bloco de posições é um só: «Posições dos pés e braços».** Tem a **preparatória**, os cinco
  números **e, desde 03/11/2026, `cp` (coupé) e `cdp` (sur le cou-de-pied)** — o termo existia no
  vocabulário e o **sinal** não existia, e sem o sinal o battement frappé não se escrevia. A **3ª
  leva o rótulo duplo** — «terceira · quinta (braços)» —, porque os dois braços
  acima da cabeça são a 3ª na francesa e a 5ª na RAD. A **categoria do trecho** separa pés de braços
  (`[Pé: 3ª …]` / `[Braço: 3ª …]`). As posições de braços existiam no alfabeto **e não chegavam a
  nenhum ecrã**: `posicoesDeBracosDoMetodo` estava exportada e ninguém a chamava. **CONFIRMADO**.
- **O método no verbete é HERANÇA COM SOBREPOSIÇÃO, não uma segunda declaração.** O plano já declara
  «Metodologia de referência», **obrigatório** (`contexto-metodologia`); o campo do verbete tem como
  primeira opção «herda a metodologia do plano». Duas declarações do mesmo facto divergiriam ao
  primeiro caso. **DECIDIDO** 02/11/2026.
- **A §4 consolidava por MÚSICA e afirmava «exercícios neste bloco: nenhum».** As duas coisas
  estavam erradas: as três linhas de exercício da aula trazem `Tempos` e `Compasso`, e o verbete traz
  a grade das contagens. Passou a **consolidar por compasso**, um exercício uma vez só, e a prova
  guarda cinco asserções que tornam a afirmação falsa impossível — entre elas «não afirma que o bloco
  não tem exercícios» e «cada exercício aparece uma vez» (`provar-o-que-vem-do-dado`).
  **CONFIRMADO** no `.md` gerado e na prova.
- **A grade que não fechava era a régua, não o dado — e o `Plié` já fecha.** O documento punha
  `conferir` no **Plié** («12 tempos onde a música tem 8») e no **Battement fondu** (6 numa de 2). O
  `Plié` era o **defeito de conta**: duas pistas somadas em fila. Com a régua por pista dá 8 = 8 e
  ele compõe-se (`estado: composto`). O **fondu** continua a não fechar (6 numa de 2), e é conteúdo:
  ou a música é outra, ou as células. **CONFIRMADO** em 02/11/2026 pelo motor e por `provar-notacao`.
- **O primeiro dos três eixos macro passou a ter campo no PLANO.** O plano de ensino tem o **bloco
  10, «Aspecto físico — força e flexibilidade»**, com `aspecto-fisico` e o descritor
  `lidoDasAnamneses` (quinze campos da anamnese, em dois grupos). A porta consolida por aspecto com
  `derivarDasAnamnesesDaTurma`, e a **régua é a ordem das opções da própria anamnese** — não há
  segunda lista escrita à mão. **CONFIRMADO** por leitura e pela propagação do schema nos 18
  professores (`check-schemas` TUDO CERTO).
- **O ritmo da turma é OBRIGATÓRIO, e nunca esteve em aberto.** O formulário da turma pede os **dias
  da semana** e a **hora de início de cada um**, a **duração de cada aula** e o **início e o fim do
  período**; a **frequência** não se digita — é a contagem dos dias (`frequenciaDaTurma`), e o campo
  saiu do formulário em 18/10/2026 para os dois números não poderem discordar. O sistema **recusa**
  gravar a turma, atribuí-la a um professor e **gerar o ciclo** sem o ritmo
  (`faltaNoRitmoDaTurma`, quatro portas: `bastidores.js:7402`, `:7463`/`:7554`, `:8203`, `:8343`), e
  o cartão da turma **diz o que falta** em vez de deixar o botão apagado. **CONFIRMADO** por leitura
  do código em 02/11/2026 — e é a correção de uma afirmação minha («o ritmo continua em aberto»),
  que procurava o ritmo no **catálogo** em vez do **cadastro**.
- **Os três produtos estão decididos, e a arquitetura é um motor só.** A pesquisadora decidiu
  (02/11/2026) criar **dicionário, syllabus e aula pronta**, gerados **antes do ciclo** e entregues
  **conforme o plano contratado** — o Básico e o Intermediário «fazem tudo», o Avançado «recebe as
  benesses». A pergunta «um motor ou dois?» ficou respondida com medição: **um motor, três saídas,
  três manifestos**. **DECIDIDO** o produto; o plano está em
  [PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md) e **nada foi implementado**.
- **Sete das nove peças do motor já existem, e três estão na forma que os produtos exigem.** A
  **notação é derivada** (`notacao.js`, `categoria` + `sinais` → `[Pé: 5ª → +]`); o **glossário já é
  o dicionário aplicado a um ciclo** (`glossario-benesh`, com índice de símbolos e origem por
  verbete); e a **regra do volume já é norma** (Regra 9: teto pela duração, depois solo 30–40% · barra
  20–30% · centro 30–40% · musicalidade 5–10%, com as faixas no `.conf`). **CONFIRMADO** por leitura em
  02/11/2026.
- **O que falta para os produtos é CONTEÚDO, não código.** O mapa nível→termos tem **13 turmas e 9
  associações**, e só **2 dos 13 níveis** têm alguma (nível 1: quatro termos; nível 2: cinco); a
  camada pedagógica não existe em ficheiro nenhum do catálogo; as **4 músicas** continuam a não
  fechar; faltam a **licença** e a **separação** catálogo × escola. **CONFIRMADO** — e é o caminho
  crítico do plano.
- **A licença está decidida — três camadas, e nenhuma delas existia.** `ARQUITETURA-GERAL.md` §10:
  **a máquina** (`motor/` · `tools/` · `porta/` · `raiz/` · `.github/`) é **proprietária e não se
  licencia** com os produtos; **o catálogo** licencia-se **por escola**, em seis cláusulas, **vinculado
  à fotografia datada** (a lógica da C5a) e **perpétuo para a versão contratada** (a lógica da L9);
  **o que a escola acrescenta é dela**, com uma concessão **não exclusiva** para o projeto o servir de
  volta e **avaliar** a entrada no catálogo, que exige **aceitação explícita**. **DECIDIDO**
  02/11/2026. O texto **existe** nos dois ficheiros (`890937a`); o que faltava era **a data**, e ela
  passou a ser derivada do `git` (§2). **CONFIRMADO** 02/11/2026.
- **25 das 59 descrições do vocabulário não têm `fonte`.** Medido em `vocabulario.json` (93 termos):
  30 vêm do «Dicionário Técnico Completo de Ballet Clássico v1.0.0 — fornecido pela pesquisadora», 4
  são «redigida no projeto», e **59 têm `fonte` vazio** — e, destes, **25 têm descrição**. Sem origem
  declarada a descrição **não pode ser licenciada**, logo não entra na **edição paga** do dicionário.
  As duas saídas — declarar as 25 ou deixá-las fora — são dela. **CONFIRMADO** por contagem em
  02/11/2026.
- **Não há conteúdo de terceiros a acomodar** — o que a decisão da licença exigia saber. Os SVGs são
  da marca do projecto (`tools/templates/marca/`); a tipografia é `system-ui` + Georgia **sem ficheiro
  de fonte embutido** (`ciclo.css:76-77`); e a nomenclatura RAD/Vaganova são **nomes de posições**, que
  não são obra. O repositório é **privado**. **CONFIRMADO** em 02/11/2026.
  > **CORRIGIDO a 21/11/2026 — a segunda metade deixou de ser verdade.** A tipografia do projecto é
  > **Open Sans**, e o ficheiro da fonte **passou a ser embutido**: dois `.woff2` em
  > `tools/templates/fontes/`, sob **SIL Open Font License 1.1**, com o texto da licença ao lado
  > (`fontes/OFL.txt`). Passa a haver **um ativo de terceiros** no repositório. A conclusão da
  > decisão **não muda** — a OFL permite a redistribuição e a incorporação, e exige exactamente o
  > que foi feito (o texto da licença viaja com a fonte); o que muda é o facto, e o facto estava
  > escrito aqui. Ver `REGISTRO.md`, 21/11/2026.
- **O produto é um PACOTE PRÓPRIO**, com `.fipp` próprio, rota própria no Worker e a **licença do
  produto** — não a do ciclo. **DECIDIDO** 02/11/2026: é a única forma de o produto ter âncora, versão
  e licença independentes; a alternativa amarraria o dicionário ao ciclo daquela escola.
- **O plano contratado não existe em código, e já se sabe onde vai viver.** `raiz/escolas-habilitadas.json`
  tem `habilitada` e `pagante` (a trava do expurgo) e **não tem `plano`**. A **C11** decidiu a
  02/11/2026 a parte que faltava — **o sítio**: um **ficheiro declarativo do repositório, nunca o
  KV** («o conf faz o negócio acontecer e fica lá no repositório, e não há custo de KV»), e a norma
  do `PROTOCOLO.md` de 01/11/2026 confirma-o — o KV é do **cadastro dos Bastidores**, e estado
  comercial não é cadastro. **Nenhum ficheiro com o nome `ESCOLA.conf` existe**; o que existe, por
  escola e versionado, é `escola/<slug>/indice.json` → `estado` e os `vars` de
  `wrangler.<slug>.jsonc`, e é aí que a chave entra enquanto não houver ficheiro próprio. O resto
  da C11 — o lado público da porta, o pagamento, «desde/até quando» — continua aberto.
  **DECIDIDO** (o sítio) e **PENDENTE** (a chave e o resto).
- **A escada da C22 mudou de leitura: três produtos + um motor.** O gerador **não é o quarto
  produto** — é o **meio** pelo qual o Avançado recebe os três. Nota de correção datada na C22, sem
  reescrever a tabela (P-03/P-04). **DECIDIDO** 02/11/2026.
- **O ritmo é do CONTRATO, e por isso o catálogo não o transporta.** A mesma «Balé Nível 1» é
  2×/semana numa escola e 3× noutra: o ritmo não é do conteúdo, é da contratação. É o que fecha a
  **C19** pela negativa — a turma pronta vende-se **sem** ritmo, e o ritmo entra onde já entra hoje.
  **DECIDIDO** em 02/11/2026, e registado no `PLANEJAMENTO-LASTRO.md` (C19 e L14).
- **O corpo está no ciclo, e só falta a ligação ao exercício.** Anamnese (15 campos, 7 de
  flexibilidade e 8 de força) → PO `linha-de-base` (os mesmos 15, **pelo nome**, mais «o que traz /
  o que precisa desenvolver») → PO `restricoes` → PO `inclusao`/`exclusao` (critérios **sugeridos a
  partir da anamnese**) → o **recorte** que o professor escolhe na **Audição/Elenco**, e que o PO
  lê. O que **não** existe é o verbete a declarar o que **o exercício** exige do corpo — e é **de
  conteúdo** (P-16), não de código. **CONFIRMADO** em 02/11/2026 pela leitura dos cinco sítios.
  **Correção de 07/11/2026:** o **quinto sítio saiu** — o plano de ensino deixou de perguntar o
  corpo (`bloco 10`, `aspecto-fisico`), porque a Audição/Elenco já o declara e o PO já o observa.
  Desde então são **quatro** os sítios, e a `provar-forca-e-flexibilidade` — a prova citada aqui —
  **hoje não corre até ao fim**: para com `Cannot read properties of undefined (reading
  'registroDaAnamnese')` na leitura do mapa do PO. É **vermelho de antes** desta entrega (medido no
  `abf7bc8e` com `git stash`), e fica registado em vez de herdado: não se promove a verde o que não
  correu.
- **O modelo tem TRÊS eixos, e a palavra «eixo» aparecer uma vez não diz o contrário.** É **prefixo
  por concatenação** (`doPlano.eixo` + `" — "` + bloco): o envelope real da `batata` traz
  `["Técnica — Barra", "Técnica — Centro", "Técnica — Musicalidade", "Técnica — Expressão"]`, e o
  eixo come os dois blocos que não são lugares na sala. **CONFIRMADO** no envelope, e é a correção de
  uma afirmação minha («o modelo tem um eixo») — datada no `REGISTRO.md`, não reescrita.
- **Um resíduo de expurgo travava o commit de quem mexe em `porta/`.** O ciclo
  `pe-torto/01/batata` foi criado pelo `criar-escola.sh` em 01/11/2026 e **nunca recebeu documentos**
  (`DOCS=""`); o `gerar-ciclo.sh` não o pode regenerar, e a cópia da porta ficava congelada. A cópia
  foi refrescada e a pendência de fundo está registada: **o remédio é o expurgo da escola.**
  **CONFIRMADO** por `check-identidade` 20/20 depois do refresco.
- **O `gerar-handoff.sh` tem de ser corrido com `bash`, não com `node`.** Com `node` ele morre num
  `SyntaxError` (é um script de shell); a `skill` e a documentação dizem `tools/gerar-handoff.sh`,
  que é o que funciona. **CONFIRMADO** em 02/11/2026 — e é a razão de a linha `variantes:` do
  resumo dele continuar a imprimir `0` (§8).

## 3. Arquitetura atual

- **Cloudflare Worker por escola.** Cada escola é uma variante independente, publicada no seu
  próprio Worker (`wrangler.<escola>.jsonc`). **CONFIRMADO** pela estrutura de deploys.
- **Armazenamento em KV, não em banco.** A decisão de usar o sistema de ficheiros em vez de um
  backend com banco está em `ARQUITETURA-GERAL.md`. **DECIDIDO**.
- **Três camadas:** `motor/nucleo/` (derivação e HTML, puro), `motor/servidor/` (rotas, KV,
  cifra, GitHub), `porta/` + `tools/templates/` (a folha e o desenho). **CONFIRMADO** pela
  árvore.
- **O conteúdo pedagógico é fonte versionada** em `professores/<professor>/ciclos/*.md` e
  `.conf`; o HTML, PDF e CSS do pacote são **saídas geradas** e não se editam à mão.
  **DECIDIDO** (`AGENTS.md`).
- **Âncora de proveniência encadeada:** `tools/hash-ciclo.sh` escreve
  `ciclo-XX-<escola>.fipp`, que é **versionado** — é a âncora, não saída. **CONFIRMADO**.
- **Segurança:** dados sensíveis cifrados no pacote publicado e fora do Git em Markdown
  (`motor/servidor/cifrar-envelope.js`); os Bastidores pedem senha. **CONFIRMADO** pelo 302 em
  `/bastidores`.
- **Cinco caminhos de escrita no `main`** que não passam por um worktree local — três Actions e
  dois a escrever pela API do GitHub a partir das páginas. **DECIDIDO** (regra do «remoto
  primeiro», 21/10/2026, `AGENTS.md`).

## 4. Inventário funcional

### Implementado e verificado

| Frente | Estado | Onde |
|:--|:--|:--|
| Navegação: coluna + barra + caminho | **CONFIRMADO** | `motor/nucleo/nav.js` |
| Listas no padrão novo | **CONFIRMADO** | `motor/nucleo/lista-html.js` |
| Aulas: leitura em prosa e Notação Benesh | **CONFIRMADO em produção** em 27/10/2026 — o nome abre a prosa, «Abrir notação» fica ao lado da Aula 01, e o Glossário está no cabeçalho persistente da Notação, em nova aba; as provas locais confirmaram a montagem e a remoção das listas independentes. **Correção de 02/11/2026:** a rota `/aulas/` citada aqui deixou de existir no reagrupamento de 24/10 — o que se publica hoje é `<variante>/aula-NN.html` dentro do pacote da turma. | `tools/gerar-aula-prosa.js`, `tools/montar-publicacao.js`, `motor/nucleo/nav.js` |
| Aula 01: Guia preenchido com os itens do PO, Notação com a estrutura da Aula e PDF individual | **CONFIRMADO no pacote e no ar** — a variante é hoje `pe-junto/01/batata-bale-nivel-1-teste-2` (`/bale-nivel-1-teste-2/aula-01`, HTTP 200). O caminho antigo (`perna-boa`) foi expurgado em 01–02/11/2026 | `professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2-aula-01.md`, `tools/gerar-aula-prosa.js`, `tools/gerar-ciclo.sh`, `tools/montar-publicacao.js` |
| **A aula regenera-se das fontes com um comando, e diz o que muda** | **CONFIRMADO** 02/11/2026 — `tools/regerar-derivados.js <professor> <ciclo> <variante>` reescreve a aula, o plano, a captura, a harmonização, as referências, a notação e o glossário a partir dos envelopes; **não grava sem `--escrever`** e **não toca no `-dados.json`** (que é estado, não derivação). Antes dele, pôr um ciclo em dia exigia repetir à mão o que o Worker faz | `tools/regerar-derivados.js` |
| **A geração é reprodutível** | **CONFIRMADO** 02/11/2026 — duas gerações seguidas do mesmo ciclo dão o mesmo md5 nos dois PDFs e o `git status` fica limpo | `tools/gerar-ciclo.sh`, `tools/templates/ciclo-cabecalho.tex` |
| **Música e vídeo de referência** e **Repertório da aula** são dois blocos no plano | **CONFIRMADO** 02/11/2026 — o bloco 10 chamava-se «música e repertório» e prometia os dois; o repertório passou a bloco próprio (11) e a Origem desceu para 12. **Correção de 07/11/2026:** com a saída do Bloco 10 (`aspecto-fisico`) os blocos foram **renumerados** — «Música e vídeo de referência» é hoje o **9**, «Repertório da aula» o **10** e «Origem» o **11**; os números desta linha valem para 02/11/2026 | `porta/plano/conteudo/plano.json`, `motor/nucleo/derivar-plano-ciclo.js` |
| **O ponto de partida lê a anamnese** (força e flexibilidade, 15 campos) | **CONFIRMADO** 02/11/2026 — a caixa mostra os campos pelo **nome** e pelo **valor**, e o «abrir o registro completo» leva à anamnese da aluna noutra aba com o contexto do ato | `porta/po/conteudo/po.json`, `motor/nucleo/elicitar.js`, `porta/index.html` |
| As três listas da Área do Professor **com o contexto do ato dentro da listagem** | **CONFIRMADO** 25/10/2026 — painel com a caixinha do «Turma» e a seta, a regra dos três botões executada, o contexto guardado, o aviso da senha errada; 43 verificações no browser | `motor/servidor/listas-do-acervo.js` |
| As três listas do acervo pela ponte | **CONFIRMADO** | `motor/servidor/listas-do-acervo.js` |
| **A lista das aulas dadas**, servida pela ponte, com as regras no cartão (o prazo do ajuste, a proveniência, o que não se apaga, a senha e quem assina o entregável) | **CONFIRMADO no ar** em 06/11/2026 — `/area-do-professor/aulas-dadas/` responde 200 com «Aula 06 — 05/11/2026 ajustada», o item «Aulas dadas» está no menu, e o «Abrir o lançamento» leva à pasta que o pacote tem (`/bale-nivel-1-teste-1/lancamento.html?ciclo=01&aula=06`). Vazia, mostra a frase declarada: «Nenhuma aula foi realizada até o momento». A lista NÃO publica o nome de quem ajustou (é servida sem senha). 38 asserções, com a contraprova do formulário a voltar quando o índice falta | `motor/servidor/aulas-dadas.js`, `motor/servidor/producao.js`, `tools/montar-publicacao.js` |
| **O formulário do lançamento não se oferece para uma aula já dada** — nem na janela em que o pacote publicado ainda é o de antes | **CONFIRMADO** 06/11/2026: a página pergunta ao site (`POST /api/lancadas`, que lê a FONTE e devolve só número e carimbo) e o filtro não cai na aula lançada. Sem a rota, vale o pacote — um formulário a mais é um incómodo, um a menos esconde a aula que falta lançar | `motor/servidor/aulas-dadas.js`, `tools/templates/lancamento.html` |
| Anamnese: formulário, vínculo, ajuste | **CONFIRMADO** | `rotas.js` (11 rotas `/api/anamnese*`) |
| Plano de ensino: formulário e vínculo | **CONFIRMADO** | `rotas.js` (`/api/planos`, `/api/plano-*`) |
| PO: derivação e documento | **CONFIRMADO** | `motor/nucleo/derivar-po.js` |
| Lançamento da aula | **CONFIRMADO** | `motor/nucleo/lancamento.js` |
| Bastidores (Produção) com menu próprio | **CONFIRMADO** | `motor/servidor/{producao,bastidores}.js` |
| O alfabeto da notação na Produção — cinco passos, frase por exercício, trecho editável | **CONFIRMADO** 01/11/2026 na bancada local (115 asserções): o formulário percorre-se do passo 1 ao 5, um painel visível de cada vez, a tira fica fora do `<form>` e sai no modo do exercício, a frase escreve-se uma vez e entra em todos os trechos, e um trecho gravado abre em edição no passo 3 com os valores dele. **A conferência na página publicada fica para o deploy.** | `motor/servidor/bastidores.js`, `motor/servidor/verbete.js` |
| Criar escola / expurgar escola | **CONFIRMADO** | `provisionar-escola.js`, `expurgar-escola.js` |
| Índice de envelopes com resumo invalidável | **CONFIRMADO** | `motor/nucleo/porta.js` (`VERSAO_DO_RESUMO = 4`) |
| Âncora e cadeia de proveniência | **CONFIRMADO** | `tools/hash-ciclo.sh` |
| A §4 da aula como vista consolidada da musicalidade, por compasso | **CONFIRMADO** 02/11/2026 — uma linha por exercício (o mesmo em Barra, Centro e Expressão é uma só), com `Tempos` e a contagem *e* o que cai nela; `conferir` onde a grade do verbete não fecha. Medido no `.md` gerado e nas cinco asserções do `provar-o-que-vem-do-dado`. | `motor/nucleo/derivar-ciclo.js` (§4) |
| O exercício novo como passo 1 do verbete — seis passos, sem «+» nem botões próprios | **CONFIRMADO** 02/11/2026 — o passo 1 tem os quatro controlos e mais nada; «Seguir →» grava o termo no vocabulário do repositório e avança para o passo 2 com ele escolhido; avançar sem nome não grava nada; «Limpar» e «Editar» levam ao passo 2. **Zero KV.** | `motor/servidor/bastidores.js`, `motor/servidor/termo-repo.js` |
| A gravação do verbete confere a música | **CONFIRMADO** 02/11/2026 — as células têm de somar os tempos da música declarada; a recusa nomeia os passos 2 e 3, e o servidor recusa também (`validarVerbete` recebe a música). | `motor/servidor/verbete.js`, `motor/servidor/bastidores.js` |
| O aspecto físico — força e flexibilidade — no PLANO, lido das anamneses da turma | **CONFIRMADO** 02/11/2026 — bloco 10 do plano (`aspecto-fisico`, descritor `lidoDasAnamneses`, quinze campos em dois grupos); a porta consolida por aspecto e marca o ponto de atenção pela ordem das opções da anamnese. Sem leitura, a secção declara a lacuna. **Correção de 07/11/2026: este bloco deixou de existir.** Ela decidiu que ele era redundante — o corpo do ciclo é declarado na **Audição/Elenco** e observado no **Plano de Observação** —, e o `## Aspecto físico` saiu também do documento derivado. A chave `aspecto-fisico` **continua a ser lida** quando um envelope antigo a tem (proveniência: o passado não se reescreve). | `porta/plano/conteudo/plano.json`, `motor/nucleo/derivar-plano-ciclo.js` |
| **O dicionário como produto** — o vocabulário do catálogo com a decomposição | **CONFIRMADO** 02/11/2026 na bancada (`provar-produtos`, 52 asserções): agrupado por categoria na ordem de aula, com definição, origem, tradição e alternativos; a decomposição em tabela com o **compasso por pista**; o verbete que não fecha em `[conferir]` **com o motivo**, sem publicar a contagem; as adições de escola **excluídas por omissão**. Gerado por `node motor/produtos.js dicionario`. | `motor/nucleo/produtos/dicionario.js`, `motor/servidor/produtos.js`, `motor/produtos.js` |
| **O syllabus como produto** — a sequência por nível, com a camada pedagógica | **CONFIRMADO** 02/11/2026 na bancada (73 asserções, com o dicionário): um documento por nível na **ordem declarada** em `progressao.json`, mais um índice com as contagens; `exige` · `ensina` · `expressa` **herdados do termo ou sobrepostos pela relação**, com a origem escrita ao lado (`(herdado do termo)` / `(declarado no nível)`); `[Preencher]` só quando **nenhum dos dois** declara; o nível sem unidades diz que é a lacuna; `--nivel` gera um só, e um nível inexistente é **recusado**. Gerado por `node motor/produtos.js syllabus`. | `motor/nucleo/produtos/syllabus.js`, `motor/servidor/produtos.js`, `motor/produtos.js` |
| **A licença é lida e a condição de conteúdo é executável** | **CONFIRMADO** 02/11/2026 na bancada: o nome da licença vem do **título** de `biblioteca/LICENSE.md` (o manifesto cita o caminho, e a lacuna `sem-licenca` desapareceu); e `--edicao paga` deixa de fora a definição **sem `fonte`**, di-lo no sítio dela, mantém o termo, e conta — **25** no catálogo de hoje, o mesmo número que a §10.4 mediu à mão. | `motor/produtos.js` (`licencaDoDisco`), `motor/nucleo/produtos/dicionario.js` |
| **A composição catálogo × escola** — uma função só | **CONFIRMADO** 02/11/2026: `compor` dá precedência à escola e marca `origem`, mantendo a posição do catálogo na ordem. É a peça de código da fase 1 — **mas os ficheiros continuam um só** (ver §2 e §7). | `motor/nucleo/produtos/comum.js` |
| **O vínculo da anamnese lê o ELENCO, e não só o `sujeitos` do PO** | **CONFIRMADO** 08/11/2026 (`provar-vinculo-do-elenco`, 26 asserções, com os envelopes e a linha de base **reais** da `batata`): uma aluna está vinculada quando o **elenco da turma que o PO observa** a inclui — a linha de base manda, e o `sujeitos` do PO é a herança —, e as duas fontes **somam-se** (quem saiu do elenco continua vinculada: um cadeado que se abre quando uma das fontes esquece um nome não é cadeado). Sem o elenco, o A/B reproduz o defeito: «solta», `PUT`/`DELETE` a 200, e o «Guardar» a **sobrescrever** o registo. Com ele, a Aluna B passa a «vinculada», as duas rotas dão **409**, e a gravação empilha elo novo. Sem leitor de linha de base a derivação degrada para o `sujeitos`, sem inventar vínculo. | `motor/nucleo/porta.js` (`vinculos`), `motor/servidor/rotas.js`, `motor/servidor/listas-do-acervo.js` |
| **A turma tem três estados, e a edição pergunta antes** | **CONFIRMADO** 03/11/2026 (`provar-conteudos-e-estado-da-turma`, §B e §C): `livre` · `curada` · `vinculada`. A curada recusa a mudança de **nome** (a curadoria guarda o nome, e renomear partia a ligação em silêncio) e aceita o resto; a vinculada recusa tudo. A tela mostra o selo e desactiva o «Excluir»; a rota é quem decide. | `motor/nucleo/estado-da-turma.js`, `motor/servidor/bastidores.js` |
| **Os conteúdos são da curadoria — e o mapa antigo continua a ler-se** | **CONFIRMADO** 03/11/2026 (§A, §D, §F): `conteudosDaTurma` e `mapaDeConteudos` compõem `turma-conteudos` com o `repertorio` de cada curadoria, colapsados pelo mesmo `idDe`; a curadoria **substituída** não entra. O passo 3 da turma ficou sem o bloco, e o cartão continua a mostrar a lista. | `motor/nucleo/conteudos.js`, `motor/servidor/bastidores.js` |
| **O formulário da curadoria só oferece o que o professor pode ensinar** | **CONFIRMADO** 03/11/2026 (§G): as modalidades vêm do `perfil.json` do professor; a tradição segue a modalidade (lista própria a vencer a compartilhada, e queda para a compartilhada quando não há própria). **Nenhuma modalidade tem `tradicoes.json` próprio** — o conteúdo é dela (P-16). | `motor/nucleo/tradicoes.js`, `motor/servidor/bastidores.js` |

### Parcial

- **A aula 2..N.** Existem 26 lugares no calendário e 3 marcos; há 1 plano e 1 folha. Sem
  `captura-aula-02.json`, o formulário cai no `captura-01.json`. **CONFIRMADO** em
  `PLANO-AULA-E-OBSERVACAO.md` §5.
- **A sala da aula.** Não existe como campo. A decisão de arquitetura diz que a sala é do
  **evento**, não da aula (`PLANO-TABELA-DE-ATIVIDADES.md` §3.1/§3.3). **DECIDIDO**, não
  implementado. A pesquisadora acrescentou (25/10/2026): «não é opcional, mas é flexível» — a sala
  pode ser remarcada até ao prazo daquela aula. **DECIDIDO**.
- **Separação semântica plano × PO × aula.** Medida em `PLANO-AULA-E-OBSERVACAO.md` §2: **cinco**
  sobreposições reais (§2.2 a §2.6). **CONFIRMADO**, não corrigido. A sexta que a primeira redação
  listava — os 8 dos 12 itens do Contexto repetidos no PO — **não é defeito**: é repetição de
  **saída**, proposital e só de leitura. **DECIDIDO** em 25/10/2026.
- **A aula 2..N como objeto.** A pesquisadora decidiu que a aula nasce por um botão e que os
  documentos nascem **mesmo vazios**, «pra gente ter o objeto». **DECIDIDO**, não implementado.

### Planejado, não implementado

- **O motor dos produtos — a aula pronta (fase 2 do `PLANO-PRODUTOS-DO-MOTOR`).** O dicionário e o
  syllabus existem; a aula pronta — a sessão montada pelo teto da **Regra 9** e pelos tempos de
  cada unidade — **não foi começada**. Depende dos verbetes (hoje zero) e do conteúdo dos níveis.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo. **CONFIRMADO** como não
  implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Estúdio de Dança como ambiente da direção. **CONFIRMADO**
  como não implementado (a Produção existe; o Estúdio, não).
- **`ARQUITETURA-PE.md`** — integração com o repositório «dança e elicitação». **CONFIRMADO**
  sem código.
- **`ARQUITETURA-AULA.md`** — o estado derivado está feito; o ajuste no plano, não.

### Inexistente

- **Avaliação** de aluno. **DECIDIDO** que está fora.
- **Integração** com o projeto das secretarias. **CONFIRMADO**.
- **O FIPP.** **CONFIRMADO**.

## 5. Arquivos relevantes

### Fontes de verdade

| Caminho | Finalidade |
|:--|:--|
| `AGENTS.md` | identidade do projeto e regras operacionais (o «remoto primeiro») |
| `REGRAS.md` | as 17 regras pedagógicas e de versionamento |
| `PROTOCOLO.md` | as 22 pétreas |
| `CONGELAMENTO.md` | o que só muda com motivo declarado |
| `REGISTRO.md` | a crónica datada das decisões |
| `HANDOFF.md` | o estado extraído (gerado — nunca editar à mão) |
| `ESTADO-ATUAL.md` | **este documento** — o juízo sobre o estado, com etiquetas |
| `FRENTES.md` | o panorama dos três trilhos |
| `PLANEJAMENTO-LASTRO.md` | o mapa de evolução do produto |
| `IDENTIDADE-VISUAL.md` | o catálogo das peças que podem aparecer no ecrã |

### Documentos de análise e de plano

`PLANO-AULA-E-OBSERVACAO.md` · `PLANO-TABELA-DE-ATIVIDADES.md` · `PLANO-NAVEGACAO.md` ·
`PLANO-INDICES.md` · `PLANO-CICLO-DA-TURMA.md` · `PLANO-PERGUNTAS-DA-PROVENIENCIA.md` ·
`PLANO-FLUXOS-DE-DERIVACAO.md` (os nove passos dos fluxos, um a um) ·
`CUSTO-DOS-FLUXOS.md` (os minutos de CI medidos, por gesto — §20 para o custo por aula) ·
`PLANO-CONTADOR-DE-AULAS.md` (a franquia em aulas, contada; §9 para o impacto de o implementar) ·
`PLANO-DE-OCUPACAO.md` (sala, professor e elenco: a colisão de horário, e o bloqueio da regra de
09/11) ·
`DIAGNOSTICO-IDENTIDADE.md` · `IMPLEMENTACAO-IDENTIDADE.md` · `ARQUITETURA-*.md` · `IDEIA-*.md`

### Código

| Caminho | Finalidade |
|:--|:--|
| `motor/nucleo/` | derivação e HTML, sem I/O de servidor |
| `motor/servidor/` | rotas, KV, cifra, GitHub, montagem |
| `motor/servidor/rotas.js` | as **33** rotas do Worker |
| `motor/servidor/verbete.js` | o alfabeto da notação no **repositório** (CRUD, com proveniência) |
| `motor/servidor/termo-repo.js` | o vocabulário técnico no **repositório** — a única lista de termos |
| `motor/nucleo/produtos/` | os **produtos** (dicionário, syllabus): puros, determinísticos, sem `fs`/`path`/`http` |
| `motor/servidor/produtos.js` | a ponte do produto: os rótulos do catálogo e a leitura do repositório |
| `motor/produtos.js` | o **CLI** dos produtos — escreve em `publicacao/produtos/<modalidade>/` (gerado); `--edicao paga` é a condição de conteúdo da licença |
| `LICENSE.md` (raiz) | **a máquina** — proprietária, e **não** licenciada com os produtos (§10.1) |
| `biblioteca/LICENSE.md` | **o catálogo** — as seis cláusulas, a concessão da escola (§10.3) e a condição do `fonte` (§10.4) |
| `motor/nucleo/schemas.js` | **o único leitor** de `modelo/ciclos/` (o shell chega lá pelo `tools/gerar-schemas.js`) |
| `motor/nucleo/derivar-ciclo.js` | a fonte da aula: as oito secções, e a origem de cada uma |
| `motor/nucleo/notacao.js` | o compositor: verbete + música → a grade de contagens |
| `porta/`, `tools/templates/` | a folha e o desenho (peças do catálogo) |
| `experimentos/provar-*.js` | **257** provas versionadas (**270** no disco). Medido a 19/11/2026 — a linha dizia «91 (104)», e era um número escrito sem ser medido |
| `tools/regerar-derivados.js` | põe as fontes derivadas de um ciclo em dia a partir dos envelopes |
| `tools/` | infraestrutura — **congelado** |

## 6. Decisões vigentes

Só o que **não se pode ignorar**. O motivo completo de cada uma está no `REGISTRO.md`.

1. **O módulo de listagem é um só, com ordem fixa: de quem · quem fez · quando.** Muda o rótulo,
   nunca o lugar. Caixinha só onde há painel; onde não há, linha de factos. **DECIDIDO**
   24/10/2026.
2. **A Aula é a entrada comum às duas leituras.** O nome abre a versão em prosa; havendo Notação
   correspondente, «Abrir notação» fica ao lado; o Glossário abre pela Notação em nova aba. As
   listas independentes de Notação e Consulta deixam de ser geradas. **DECIDIDO** 27/10/2026.
3. **«Aulas» vive só dentro da Área do Professor.** Não há destino direto no topo.
   **DECIDIDO**.
4. **A coluna do sistema desenha-se em todas as páginas**, e o duplo com as páginas que têm
   menu próprio resolve-se em CSS (`body:has(.lateral)`), acima dos 1141px. **DECIDIDO**.
5. **A curadoria é a autorização.** Uma aluna só entra na anamnese de um professor se a curadoria
   o vinculou àquela turma. Não é regra de visibilidade — é a fonte do vínculo. **DECIDIDO**
   23/10/2026.
6. **A turma de um PO vem do plano de ensino que ele referencia**, não do PO. **DECIDIDO**
   25/10/2026.
7. **O resumo do índice invalida-se pela FORMA, não pela versão** — `gravarIndice` carimba sempre
   a versão de hoje, portanto o que denuncia um resumo velho é o conjunto de campos.
   **DECIDIDO** 25/10/2026.
8. **A sala não é da aula, é do evento.** **DECIDIDO**, não implementado.
9. **Saídas geradas ficam fora do Git** (P-04); os pacotes de ciclo são a exceção, porque o
   deploy automático lê o repositório. **DECIDIDO**.
10. **Qualquer coisa que apareça no ecrã nasce do catálogo de peças** de `IDENTIDADE-VISUAL.md`;
    a checagem 8 (`node tools/check-identidade.js`) reprova o que escapar. **DECIDIDO**.
11. **A ação que grava um formulário vai dentro da fileira `.par-botoes`, e é `.acao`**
    (`grande` quando é a principal). Um `.acao` solto depois do `<div class="res">` encosta no
    campo, porque o vão da folha é uma conta de vizinhança. **DECIDIDO** 26/10/2026.
12. **A Notação reproduz a estrutura da Aula em prosa e acrescenta os sinais Benesh.** O Guia de
    observação usa os itens do PO e explica o registro na Captura; o título do ciclo abre o Plano e
    a lista de Aulas oferece o PDF individual. **DECIDIDO** 27/10/2026.
13. **A DIREÇÃO DE UM VERBETE NÃO SE PERGUNTA: É A CHAVE DA CÉLULA.** Nas seis entradas do
    alfabeto, o campo `direcoes` era exactamente a lista das chaves de `celulas`; ele saiu do dado
    (alfabeto **versão 3**) e a direção passa a ser derivada. Uma direção existe num verbete se — e
    só se — esse verbete tem células para ela. É o dado a dizer o que o exercício é, e não o sistema
    a proibir. **DECIDIDO** 28/10/2026.
14. **O formulário do verbete tem dois modos que não coexistem** — ou se escolhe um exercício que
    existe, ou se cria um. No modo do exercício, os campos do verbete **não estão** no documento e o
    `select` e o «+» ficam bloqueados. **DECIDIDO** 28/10/2026.
15. **A NOTAÇÃO DE UM TRECHO COMPÕE-SE, E A CONTAGEM ESCOLHE-SE.** A célula declara `categoria` e
    `sinais`; a notação (`[Pé: 1ª → +]`) é **derivada**. A palavra «bloco» volta a significar só
    Solo · Barra · Centro, que é o que ela quer dizer no plano. A contagem é uma lista das que cabem
    no compasso — ela vai de 1 até o numerador e recomeça no seguinte, e o número do compasso é
    calculado. **DECIDIDO** 28/10/2026.
16. **A frase «o que acontece» vem de um dicionário, e é sugestão — não fonte.** O dicionário
    (`biblioteca/modalidades/<m>/descricoes.json`) é indexado pela **notação**, e o que fica gravado é
    a frase da célula: o dicionário pode melhorar sem reescrever o passado (P-03/P-04). **DECIDIDO**
    28/10/2026.
17. **O vocabulário técnico vive no REPOSITÓRIO, numa lista só** — `biblioteca/modalidades/<m>/vocabulario.json`.
    A tela lê o bundle que o deploy traz; o cadastro grava no repositório, pela API do GitHub. **Não
    há cópia por escola no KV**, e o botão «Carregar as turmas iniciais» já não semeia termos. A razão
    é dupla: o gerador lê o ficheiro do **disco**, no GitHub Actions (uma escrita em KV nunca chegaria
    ao documento), e duas listas divergem ao primeiro termo novo, em silêncio. **DECIDIDO** 28/10/2026.
18. **O KV é o último recurso, porque tem custo.** Só guarda o que é da ESCOLA (turmas, professores,
    alunas, a relação turma↔conteúdo, envelopes). Catálogo, alfabeto e vocabulário vão para o
    repositório. **DECIDIDO** 28/10/2026.
19. **A CÉLULA TEM DOIS EIXOS: DIREÇÃO DO MEMBRO E ORIENTAÇÃO DO CORPO.** A direção diz para onde o
    membro vai (à frente, ao lado, atrás — três) e dá a chave do trecho; a orientação diz como o corpo
    está voltado (en face, croisé, effacé, écarté, épaulement — cinco) e é um **campo opcional** da
    célula. «À frente en croisé» é **um** trecho, não dois. Omitir a orientação quer dizer `en face`, e
    é omitindo que se grava: escrevê-la em todas as células seria ruído. Até a versão 4 os dois eixos
    estavam numa lista só, e era por isso que a tabela mostrava oito blocos onde há três mais cinco.
    **DECIDIDO** 28/10/2026 (alfabeto **versão 5**).
20. **TUDO O QUE O PROFESSOR ESCOLHE NO TRECHO ESCOLHE-SE POR CLIQUE, NUNCA POR LISTA SUSPENSA.** Uma
    escolha única não escreve uma sequência: com o `<select>` dos sinais, escolher o segundo apagava o
    primeiro. Cada clique **acrescenta ao fim**, porque um bloco pode repetir um sinal
    (`[Pé: 1ª → + ● 1ª]`), e a remoção é só pelos «×» das fichas — numeradas, porque a ordem é o que a
    notação diz. A direção e a orientação **ficam** depois de acrescentar um trecho: é o que permite
    emendar o en croix sem reescolher tudo. **DECIDIDO** 28/10/2026.
21. **ESCOLHA ÚNICA E ESCOLHA MÚLTIPLA TÊM CAIXAS DIFERENTES: `radio` e `checkbox`.** A direção, a
    orientação e a contagem são **uma** escolha; os sinais são **lista**. Com `checkbox` na direção, o
    navegador marcava a nova e deixava a anterior, e a tela passava a dizer «à frente» enquanto o
    estado dizia «atrás» — foi o que a pesquisadora viu como «fiz à frente e apareceu atrás».
    **DECIDIDO** 29/10/2026.
22. **«EN FACE» É A OMSIÃO, E A OMSIÃO MOSTRA-SE.** O campo `orientacao` só existe quando não é
    `en face`; mas a pílula de `en face` aparece **marcada** quando nenhuma outra está. Uma omissão
    que não se vê é indistinguível de um campo que não funciona — e foi assim que ela o leu.
    **DECIDIDO** 29/10/2026.
23. **A CONTAGEM CONTINUA ONDE O COMPASSO ESTÁ, E O COMPASSO É CORRIDO.** O início da contagem de um
    trecho soma, na ordem da gramática, tudo o que vem antes — as direções anteriores inteiras e as
    células que a sua própria direção já tem, porque a nova entra no fim dela. A coluna do compasso
    sai da **mesma** soma. Duas contas diferentes para a mesma coisa põem dois trechos no mesmo
    tempo, e a página da aula passa a dizer duas coisas para o mesmo instante. **DECIDIDO** 29/10/2026.
24. **O FORMULÁRIO DO VERBETE ESCREVE-SE EM PASSOS, E UM TRECHO GRAVADO PODE SER CORRIGIDO.** Ela
    comparou as duas arrumações e escolheu os passos («o Step, apesar de ter mais cliques, ele é mais
    fácil de entender»). **DECIDIDO** 31/10/2026 em sete; **DECIDIDO** 01/11/2026 em **cinco** — o
    exercício, a frase e a posição são um passo só, porque são as três coisas que se decidem antes de
    haver trecho. Os cinco: **1 O exercício · 2 A música · 3 Para onde · 4 Os sinais · 5 A
    decomposição**. A tira vive **fora do `<form>`**, na coluna do formulário, como a faixa da turma,
    e sai do ecrã no modo do exercício. A tira em cima diz o que já está decidido e é a navegação; o passo
    1 fica **fora** do bloco do verbo, porque o modo do exercício o bloqueia em vez de o esconder.
    Corrigir um trecho é um **estado** (`EM_EDICAO`), não um botão: acende o «!» nos dois passos do
    trecho (5 e 6), leva ao 5, muda o rótulo do 7 para «Guardar a alteração», e a linha em edição
    **perde o «×»**. A peça reusa-se da faixa da turma (`.passos`/`.passo`/`.passo-alerta`); nenhuma
    classe nova. **DECIDIDO** 31/10/2026.
25. **«O QUE ACONTECE» É DO EXERCÍCIO, NÃO DO TRECHO — E ESCREVE-SE UMA VEZ.** A frase descreve o
    exercício; o que muda de trecho para trecho é o **«lê-se»**, que é derivado da notação. Escrevê-la
    por trecho era a redundância que sobrou depois de a quarta coluna sair da tabela («toda vez que eu
    vou acrescentar um trecho, eu preciso digitar novamente o que acontece»). O campo é **um**, no
    passo 2; o que fica **gravado** em cada célula é a frase seguida do «lê-se». A ordem de preferência
    do campo é do projeto, não do momento: **o que está gravado vence o dicionário** (P-03/P-04), e
    trocar a música do mesmo exercício não reescreve a frase. **DECIDIDO** 31/10/2026.
26. **O QUE ESTÁ ESCRITO NÃO SE REESCREVE — E A TELA DI-LO.** Ao abrir um verbete antigo, a frase que
    volta é a que está nas células; se um trecho guarda uma frase diferente da que está no passo 2, a
    prévia marca-o («guardado com a frase com que foi escrito») em vez de o reescrever em silêncio.
    **DECIDIDO** 31/10/2026.
27. **A LISTAGEM DIZ O QUE O VERBETE É, E AS ETIQUETAS SÃO DERIVADAS.** A posição em selo, e por baixo
    as direções, o compasso, em quantas músicas está escrito e quantos trechos tem — tudo lido do
    alfabeto, sem um segundo dado a manter. A chave crua da música («4|4/4») deixa de se mostrar.
    **DECIDIDO** 31/10/2026.
28. **OS TEMPOS E O COMPASSO DO PLANO VÊM DO VERBETE.** Juntos são a **chave do verbete**
    (`<tempos>|<compasso>`); o plano contribui exactamente com esses dois campos para a notação, e
    perguntá-los outra vez é pedir ao professor o que o sistema já sabe. Com **uma** música declarada,
    os dois vêm preenchidos e **travados** (como o Bloco e o Objetivo), e é esse par que fica gravado;
    com **várias**, são escolha, e **só as músicas declaradas se oferecem** — «8 tempos» não convive
    com «6/8»; **sem verbete**, ficam à mão (Arabesque e Jeté hoje), porque não há o que derivar e
    derivar seria inventar. A fonte é o **alfabeto**, lido do `notacao.json` que já viaja no Worker —
    **zero KV** —, não uma lista paralela na tela; e a tela diz de onde vêm e que **é o verbete que se
    altera**. **DECIDIDO** 31/10/2026. **As outras três colunas** (`Posição`, `Direção`,
    `Orientação`/`Lado`) ficam **PENDENTES**: hoje o motor lê-as do verbete, não do plano, e mexer
    nelas muda o que o documento publica.

29. **O NÚMERO QUE SE LÊ É O DO ROTEIRO — UM SÓ, NOS TRÊS DOCUMENTOS.** O título, o roteiro e a barra
    contavam coisas diferentes: o roteiro contava os **degraus** (os nós que se perguntam), o título
    contava o **índice do mapa** — com os nós de cabeçalho dentro —, e a barra contava o **mapa
    inteiro**. No plano, 18 dos 19 degraus tinham dois números (Δ −7); no PO, os 30. A anamnese
    estava certa, e foi por isso que o defeito passou: é o documento onde ele não aparece. Uma
    função (`numerosDoMapa`) conta os degraus, e os três leem dela. **O que não tem degrau continua a
    barrar o fecho** — a turma é obrigatória e não se caminha até ela —, e passa a ser **nomeado**:
    «Do contexto, na barra». **DECIDIDO** 01/11/2026.
30. **A «SEQUÊNCIA DE EXERCÍCIOS POR BLOCO» É DEMONSTRATIVO, NÃO UM SEGUNDO LUGAR DE DECISÃO.** O
    bloco vem de «Blocos de cada objetivo», o objetivo dos marcos, o conteúdo do nível da matriz do
    «Parâmetro de medição», e os tempos e o compasso do **verbete**. As duas primeiras colunas entram
    em `somenteLeitura`; ficam livres o **conteúdo** de um exercício sem parâmetro marcado e o
    «Adicionar linha» — sem os dois, um plano cuja turma não tem conteúdo associado não podia ser
    composto. **Ela não sai do formulário**: é dela que a página da aula lê a sequência
    (`sequenciaComoObjetos`). **DECIDIDO** 01/11/2026.
31. **O QUE A SEQUÊNCIA JÁ RESPONDE NÃO SE ESCREVE OUTRA VEZ.** O bloco do plano que hoje se chama
    **«Música e vídeo de referência»** (era o 10 em 01/11/2026; é o **9** desde 07/11/2026) deixou de
    perguntar a música: ela **sobe da sequência**, exercício por exercício, do **verbete** de cada um,
    e é mostrada acima do campo. O campo do nó 24 passou a ser o **link do vídeo** («Vídeo de
    referência»), que é a única parte que não existia em lugar nenhum. O **«Repertório desta aula»**
    passou a **`somenteLeitura`**: o valor é a sequência, semeada pela tela, e a chave `repertorio` do
    envelope continua a mesma — o que muda é **quem a preenche**, e é isso que faz a conta do
    `usosDosPlanos` ler uma lista exacta em vez de prosa. A regra geral: **um facto decide-se num
    lugar só; onde ele aparece, é lido.** **DECIDIDO** 01/11/2026.
32. **A SEQUÊNCIA SEMEIA-SE SOZINHA, E A AUTORIA MANDA.** A `aula-1-sequencia` era gravada **só
    quando o nó era aberto**: quem preenchesse a matriz e gerasse o documento sem passar por lá
    perdia a sequência inteira, e a página da aula saía sem exercício nenhum. Agora, a cada pintura
    do roteiro, o que a **própria grelha desenha** (`grelhaDaTabela` + `lerGrelha` — a mesma conta,
    uma vez, para a tela e para o dado) é colhido. `SEMENTE_ANTERIOR` guarda o valor **exacto** que se
    semeou: enquanto for esse, a semente refaz-se (mudar a marcação muda a sequência); assim que for
    outro, é do **professor** (ou de um plano antigo) e **não se toca**. A semente **não herda de si
    mesma** — sem isso, um exercício desmarcado deixava as linhas dele para trás. A grelha **com
    unidade** (a distribuição de volume, que grava `{unidade, linhas}`) fica de fora. **DECIDIDO**
    01/11/2026.
33. **O `;` SEPARA OS ITENS DO PO, E SÓ LÁ.** `itensDaDimensao()` corta por `;`, `\n` ou o array já
    pronto. O `emLista` geral **não** se alarga: o `;` é pontuação legítima noutros campos (o
    repertório, a proveniência), e alargar o corte em todo o lado partiria frases que são uma só. A
    separação é **pergunta do campo**. **DECIDIDO** 01/11/2026.
34. **A AULA N NASCE QUANDO O PROFESSOR A ELABORA — O PLANO NÃO DECLARA AS 26.** O plano declara
    **objetivos específicos** (poucos) e **em que aula** cada um cai (`aula-de-cada-objetivo`); os
    lugares do calendário que ainda não têm objetivo aparecem na lista como «Lugar do calendário —
    sem marco». **Isso não é lacuna a preencher: é o método.** O professor cria a aula 1, dá-a,
    lança-a — e é com o **registo dela** (o caderno) à frente que ele elabora a aula 2, mesmo que
    decida que ela é uma cópia da 1. A razão é a do domínio, não a do software: *«a situação do
    aluno, a capacidade do aluno, o desempenho dele, no que é observado na aula 1, vai se
    transformar na aula 2, na aula 3»*. **Consequência para o P1:** a ligação bloco ↔ dimensão é **por aula, no
    momento em que aquela aula nasce** — nunca uma derivação para as 26. **DECIDIDO** 01/11/2026 —
    e isto **responde** à pergunta que estava aberta desde 25/10/2026 («o que fazer com as 23 aulas
    que não têm marco»): **nada. Elas nascem à medida.**
35. **O FORMULÁRIO DA COLETA É A EXPRESSÃO DA JANELA, POR TODAS AS BANDAS.** O PO declara 4
    dimensões e **8 critérios**; a aula e a folha desenhavam **4** — os dois critérios de cada
    dimensão colados num rótulo só. Quem olha pela janela tem de poder marcar **cada critério**: o
    par não é observável. A fonte é **uma só** (`dimensoesEItens`) para a aula, a folha impressa e o
    config que o formulário lê — **um conserto que fica no código e não chega aos artefatos gravados
    não conserta nada**. **DECIDIDO** 01/11/2026.
36. **A FONTE DE UM DOCUMENTO TEM DE SER O QUE O CÓDIGO GERA.** A §5 da aula era a única parte
    escrita à mão (16 de 18 linhas divergentes), e nada o dizia: a próxima geração apagava-a em
    silêncio. A prova deixou de medir o texto e passou a medir a **propriedade** — mesma entrada,
    mesma saída, byte a byte. **DECIDIDO** 01/11/2026.
37. **NENHUMA SECÇÃO DO DOCUMENTO AFIRMA O QUE NINGUÉM ESCREVEU.** A origem de cada secção da aula
    mede-se por **mutação** — troca-se uma resposta do envelope e vê-se se a secção muda. Se não
    mudar, o texto é do código, e o documento está a afirmar sobre a aula de alguém o que ninguém
    decidiu. Foi assim que se apanharam quatro: um título sobre a sala a anunciar «força e
    flexibilidade», um «Pulso» fixo, um «Ciclo simulado» num ciclo publicado e um `[Preencher]` sem
    dizer o que se esperava. **DECIDIDO** 02/11/2026.
38. **A MUSICALIDADE NÃO SE PERGUNTA: ELA JÁ FOI DECIDIDA, NO VERBETE E NA SEQUÊNCIA.** O professor
    declara a grade de contagens no **verbete** (por música) e os tempos e o compasso no **plano**. O
    pulso é a contagem, o acento é o tempo do compasso em que ela cai, a frase é o exercício inteiro
    sobre a música. O que o documento faz é **consolidar** — nunca pedir outra vez, nunca declarar em
    falta. **DECIDIDO** 02/11/2026, e é a terceira vez que ele foi dito.
39. **A PROVENIÊNCIA É UM LUGAR AONDE SE VAI.** Um `id` de envelope (`po-20261101-1959`) não leva a
    lado nenhum: o que serve é o **link** para o documento, com o **objetivo** dele ao lado. E o
    gerador não se explica a quem abriu a aula. **DECIDIDO** 02/11/2026.
40. **O «PRÓXIMO PASSO» DIZ O ESTADO, NÃO EXPLICA O CONCEITO.** Uma linha, «Marco da Aula 02», e três
    casos: sem marco seguinte, diz que o plano declarou um só e aguarda; com marco e sem Aula 02, diz
    isso mesmo; com marco e com Aula 02, o título e o marco viram link para ela. **DECIDIDO**
    02/11/2026.
41. **A FORÇA E A FLEXIBILIDADE VÊM DA ANAMNESE, E OS CAMPOS SÃO ESCOLHA DELA.** O nó
    `linha-de-base` do PO declara os campos de que se alimenta (15, em dois grupos), os **nomes**
    vêm do mapa da anamnese — nunca de uma segunda lista —, e o registo completo abre noutra aba
    com o contexto do ato. A anamnese **informa**; «o que traz» e «o que precisa desenvolver»
    continuam a escrever-se, porque a formulação é da professora. **DECIDIDO** 02/11/2026.
42. **GERAR NÃO PODE SUJAR A ÁRVORE.** Um ficheiro versionado que muda por ter sido gerado não é
    derivado: é carimbado. O `/ID` do trailer do PDF é fixo, e a data que o pdfTeX grava
    (`SOURCE_DATE_EPOCH`) passou a ser a **data de início do ciclo**, derivada do calendário — não o
    relógio e não o commit: até 15/11/2026 ela vinha de `git log` sobre a **pasta** do ciclo, que
    contém as saídas, e por isso gravar as saídas movia a data e a data mudava as saídas (um laço
    sem ponto fixo). O `ciclos.json` deixou de levar `gerado_em` e `estado`: o facto (`lancada`) e a
    janela (`prazo`) ficam, o juízo calcula-o quem tem um *agora*. **DECIDIDO** 02/11/2026,
    **CORRIGIDO** 15/11/2026.
43. **O MOLDE DOS SCHEMAS TEM UM LEITOR SÓ, E A COMPARAÇÃO É DE CONTEÚDO.** `motor/nucleo/schemas.js`
    é o único que lê `modelo/ciclos/`; o shell chega lá pelo `tools/gerar-schemas.js`. Uma cópia sem
    comparação é uma segunda verdade — foi assim que o molde ficou cinco professores atrás.
    **DECIDIDO** 02/11/2026.
44. **A VISTA DA MUSICALIDADE CONSOLIDA POR COMPASSO, E UM EXERCÍCIO APARECE UMA VEZ.** A vista do
    exercício mostra os nove; a da musicalidade mostra os três que existem, agrupados pelo compasso
    (a forma que ela descreveu: «4 por 4, 3 por 4, 2 por 2 (…) de 1 até 3, de 1 até 4»). Repetir o
    mesmo fondu em Barra, Centro e Expressão é redundância: ela é do exercício, não do bloco. A célula
    é a **contagem e o que cai nela** — cortar pela contagem só deitava fora o que a tabela anterior
    mostrava. **DECIDIDO** 02/11/2026.
45. **REPETIR UM NÚMERO SEM A TABELA DELE CONFUNDE.** «30% do volume — 27 tempos (Regra 9, etapa 2)»
    na §4 repetia, sem a grelha, o que a §3 publica inteira. Saiu. O título da §3 passou a ser o do
    conteúdo — **«Distribuição do tempo pelos blocos»** —, e o subtítulo que dizia o mesmo duas vezes
    saiu. **DECIDIDO** 02/11/2026.
46. **UMA GRADE DE VERBETE QUE NÃO FECHA NOS TEMPOS DIZ `conferir`, E NÃO SE CORRIGE SOZINHA.** O que
    se corrige é o verbete, e a decisão é da professora; o documento mostra e não escolhe. Medido
    nesta aula: fondu soma 6 tempos numa música de 2; plié soma 12 onde a música tem 8. **DECIDIDO**
    02/11/2026.
47. **O ASPECTO FÍSICO FICA NO PLANO, ANTES DA MÚSICA E DO REPERTÓRIO.** É o primeiro dos três eixos
    (o corpo, a técnica, a poiésis) e é da família das condições do espaço: o que a aula precisa para
    acontecer. É **da turma, nunca da aluna** — o que elas mostram juntas —, e a régua é a ordem das
    opções da própria anamnese (a primeira é o melhor estado), sem segunda lista à mão. Resolve a
    **C20** do `PLANEJAMENTO-LASTRO.md` pela alternativa **(b)**; sobra só a redação da Regra 4, que é
    texto congelado. **DECIDIDO** 02/11/2026.
48. **UM CICLO CRIADO E NUNCA PREENCHIDO ENVELHECE EM SILÊNCIO E TRAVA O COMMIT DOS OUTROS.** O
    `pe-torto/01/batata` nasceu do `criar-escola.sh` com `DOCS=""`, o `gerar-ciclo.sh` não o regenera,
    e a cópia da porta ficou congelada no dia em que nasceu — quem mexesse em `porta/` reprovava no
    Circuito. A cópia foi refrescada (não apagada: apagar um ciclo é decisão da pesquisadora), e o
    remédio de fundo é o **expurgo da escola**. **DECIDIDO** 02/11/2026.
49. **O EXERCÍCIO NOVO É O PASSO 1 — E NÃO UM «+» NEM UM MODO.** Duas correções no mesmo dia. A
    primeira tirou o «modo» que substituía a página inteira; a segunda tirou o «+» e os dois botões
    que restavam, porque a pesquisadora queria **um passo a mais**, e um passo não tem vida própria:
    avança-se com a navegação que todos têm. São **seis**: o exercício novo, o exercício, a música, o
    para onde, os sinais, a decomposição. Quem grava o termo é o **«Seguir →»**; avançar sem nome não
    grava nada. **DECIDIDO** 02/11/2026.
50. **O QUE JÁ VAI PARA O REPOSITÓRIO NÃO PRECISA DE KV — E NÃO GASTA NENHUM.** O termo novo é
    escrito no vocabulário da modalidade (Contents API) e a lista de exercícios é lida do **mesmo
    ficheiro**. A tela acrescenta-o localmente enquanto não há outra leitura: o pedido menor é
    nenhum. **DECIDIDO** 02/11/2026.
51. **A GRAVAÇÃO CONFERE A MÚSICA, E APONTA ONDE SE CORRIGE.** `cobre` contra a soma das células é
    uma conta do formulário consigo mesmo; a música é a chave do verbete e tem de fechar com as
    células. A recusa nomeia os dois sítios — a música (passo 3) e os trechos (passo 4) — e o
    número dos passos vem da lista que desenha a tira, por isso a renumeração de 02/11/2026 levou a
    mensagem consigo. A regra vive nos dois lados: a tela recusa
    antes de enviar e o servidor garante que uma página em cache não a contorna. **DECIDIDO**
    02/11/2026.
52. **A REGRA 15 FOI SUBSTITUÍDA PELO QUE O CÓDIGO FAZ, E O `REGRAS.md` DIZ ISSO.** «Bloco próprio +
    arquivo paralelo do ciclo» foi escrito antes de o verbete existir; **nenhum arquivo paralelo
    existe**, e a musicalidade não é um bloco. O que a substitui — verbete com a grade, sequência
    com tempos e compasso, §4 consolidada — é **dado**, num sítio só. A regra **não é apagada nem
    renumerada**: ganha uma nota de substituição, com motivo declarado, e o commit da nota é só
    dela (`CONGELAMENTO.md`). **DECIDIDO** 02/11/2026.
53. **O MODELO TEM TRÊS EIXOS, E A PALAVRA «eixo» APARECER UMA VEZ NÃO DIZ O CONTRÁRIO.** O rótulo da
    dimensão do PO é **prefixo por concatenação** — `doPlano.eixo` + `" — "` + o bloco —, e o
    envelope real da `batata` mostra `["Técnica — Barra", "Técnica — Centro", "Técnica —
    Musicalidade", "Técnica — Expressão"]`. O eixo **come** os dois blocos que não são lugares na
    sala, e o conteúdo deles é **poiésis** com o rótulo da técnica por cima. Os três existem — corpo
    (anamnese → PO → o recorte da Audição), técnica (`notacao`/`vocabulario`/`progressao`), expressão (música,
    repertório, vídeo, 4 termos de `qualidade`) — e **nenhum está declarado como eixo**. **O objetivo
    não é um quarto eixo: é o cruzamento**, e já existe duas vezes (`estrutura-de-cada-aula` marca o
    objetivo por bloco, `aula-1-sequencia` amarra objetivo + bloco + tempos + compasso por linha).
    **CONFIRMADO** 02/11/2026 (correção de uma afirmação minha, datada no `REGISTRO.md`); o que fica
    por decidir — os três como eixos de primeira classe — é a **C20**.
54. **O RITMO É DO CONTRATO, E POR ISSO O CATÁLOGO NÃO O TRANSPORTA.** Ele é **obrigatório** e vive no
    **cadastro da turma** — dias e hora de cada um, duração, período; a frequência é **derivada**, não
    digitada. O sistema recusa gravar a turma, atribuí-la e **gerar o ciclo** sem ele
    (`faltaNoRitmoDaTurma`, quatro portas). A mesma «Balé Nível 1» é 2×/semana numa escola e 3×
    noutra: não é do conteúdo, é da contratação. **É o que fecha a C19 pela negativa** — a turma
    pronta vende-se **sem** ritmo, e o ritmo entra onde já entra hoje. **DECIDIDO** 02/11/2026.
55. **O VERBETE É O ÁTOMO DO SYLLABUS, E O MOTOR É VIÁVEL — FALTAM QUATRO ARRUMAÇÕES E CINCO
    MÚSICAS.** Os quatro degraus são **dicionário → syllabus → aula pronta → gerador**, e a ordem é de
    **dependência**, não de preferência. O motor não precisa de modelo novo: o átomo já é chave-valor
    por música, com a notação **derivada**. Precisa de (1) **identidade estável** por unidade (hoje o
    `id` deriva do nome, e o `PUT /termo` recusa renomear um termo em uso — é a **L2**), (2) a
    **separação catálogo × escola** (é o mesmo ficheiro: `termo-repo.js`), (3) a **camada pedagógica**
    (o que a unidade **exige**, **ensina** e **expressa** — **de conteúdo**, P-16), (4) **uma leitura
    só** do vocabulário (hoje `lerModalidade` lê do GitHub e `termos()` do bundle). E antes de tudo:
    **4 das 13 músicas** têm `cobre` diferente dos tempos (Rond de jambe en l'air 3 em 4, Battement
    dégagé 6 em 4, Battement fondu 6 em 2, Relevé 1 em 2) — o `Plié`, que era o quinto, saiu da lista
    quando a régua passou a ser a maior pista — e a gravação já as
    **recusa**, o que quer dizer que precisam de correção antes de qualquer regravação. A
    **licença** (não há `LICENSE`; estava a definir desde 18/09/2026, `REGISTRO.md:109` — **decidida a
    02/11/2026**, `ARQUITETURA-GERAL.md` §10) trava o degrau 1 tanto quanto a separação. **DECIDIDO** o diagnóstico e o veredicto; a **ordem comercial** é dela
    (**C22**).
56. **UM MOTOR, TRÊS SAÍDAS, TRÊS MANIFESTOS — E OS PRODUTOS VÊM ANTES DO CICLO.** Os três produtos
    (dicionário · syllabus · aula pronta) são **saídas de um motor só**, porque o trabalho é um: o
    núcleo já é único e a fronteira é provada por máquina (`provar-agnosticismo`), a leitura do
    catálogo já está duplicada uma vez e a C22 manda unificá-la, a notação é uma regra só, a âncora é
    uma convenção só, e a entrega vive em `tools/`, que é congelado. **O que parte é o MANIFESTO** —
    três objectos com `id`, `versao`, `licenca` e `ancora` —, e é ali que vive a granularidade da
    negociação. E são gerados **antes do ciclo**: são **matéria-prima** da anamnese, do plano e do PO,
    e tornam-se da escola **na curadoria**. Isso **não inverte** o pipeline — acrescenta-lhe uma etapa
    à frente. **DECIDIDO** 02/11/2026; o plano é o
    [PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md).
57. **OS PRODUTOS SÃO A CARA COMERCIAL DA BASE, NÃO A CARA ANALÍTICA.** O `PLANEJAMENTO` §5 proíbe
    implementar L6 antes de L1/L2/L3 e L10 — e os produtos **não são L6**: não consultam, não cruzam
    dado da escola, não respondem pergunta nenhuma. Podem por isso vir **antes** das camadas
    analíticas, e o que os trava é **conteúdo** e **L1 · L2 · L14**, não o índice nem o catálogo de
    consultas. **DECIDIDO** 02/11/2026.

58. **A LICENÇA TEM TRÊS CAMADAS, E O QUE A ESCOLA ACRESCENTA É DELA.** A **máquina** é proprietária e
    **não** se licencia com os produtos — a escola compra o uso do produto, não o motor que o produz.
    O **catálogo** licencia-se **por escola**: **vinculado à fotografia datada** (C5a), **perpétuo para
    a versão contratada** (L9), **não exclusivo/transferível/sublicenciável**, uso interno livre,
    **revenda proibida**, **atribuição preservada** no `fonte` de cada descrição. E o que **a escola
    acrescenta é dela**: concede ao projecto uso não exclusivo para o servir de volta e **avaliar** a
    proposta de entrada no catálogo, que exige **aceitação explícita**. **A condição que a licença
    impõe:** uma descrição **sem `fonte`** não entra na edição paga — e **25 das 59** estão nessa
    situação. Escrita na `ARQUITETURA-GERAL.md` §10. **DECIDIDO** 02/11/2026.
59. **AS CÉLULAS CONTAM-SE POR PISTA, E A PISTA É A CATEGORIA.** `à frente` e `atrás` são o mesmo
    corpo e **somam-se**; `Pé`, `Peso`, `Perna` e `Braço` são corpos diferentes e correm **em
    paralelo**. O que o verbete ocupa da música é a **maior pista**, e não a soma em linha. O `Plié`
    somava 12 numa música de 8 (pernas 8 + braços 4) e era recusado; com esta régua dá 8 = 8 e
    compõe-se. Foi aplicada com a mesma conta em quatro sítios — motor, validador, e duas funções da
    página —, porque três réguas diferentes para a mesma conta é o defeito que esta casa trata pior.
    **DECIDIDO e implementado** 02/11/2026. **Reverte, com razão, a decisão de 29/10/2026**: o «mesmo
    instante» que ali era contradição é, em duas categorias, **simultaneidade**.
60. **A REPETIÇÃO É DO TRECHO, E A MÉTRICA COMPOSTA CONTA POR PULSO.** `repeticoes` (inteiro ≥ 1)
    multiplica o que a célula ocupa — a `contagem` é a de uma execução, e o produto entra em toda a
    aritmética. E o compasso deixa de ser lido só pelo numerador: nos **compostos** (`/8` com
    numerador múltiplo de 3) o pulso vale **três** tempos, e a lista de contagens traz **primeiro** os
    fins que fecham pulso e **no fim** os de meio — que **não** se proíbem, porque `1–2` num 6/8 é uma
    síncope e existe. **DECIDIDO e implementado** 02/11/2026.
61. **CORRIGIR UM TRECHO NÃO LHE MUDA O COMPASSO, NEM O PASSO MUDA SEM O UTILIZADOR.** A edição
    **substitui no lugar** — nunca `splice` + `push` —, porque o compasso sai da **ordem** e o
    `push` reescrevia a posição temporal do trecho corrigido. E a correcção **abre a área do trecho
    onde se está**: os painéis onde ele se compõe **e o último**, que é onde vive o botão de
    guardar. Acrescentar, guardar e cancelar **não mudam de passo**; o «Cancelar» já era o
    comportamento correcto e passa a ser a regra escrita, em vez de um acidente que dava o mesmo.
    **DECIDIDO e implementado** 02/11/2026.
62. **DUPLICAR O EXERCÍCIO DUPLICA O BLOCO INTEIRO, TAL E QUAL, E SOBE OS TEMPOS.** O botão clona
    as células de **cada direção** e acrescenta-as ao fim da sua lista — o compasso sai da ordem, e
    por isso as cópias caem nos compassos **seguintes** (3 e 4 numa música de 8), que é o que «logo
    abaixo na sequência» quer dizer. Os tempos sobem **sozinhos**: duplicar um bloco de 8 numa música
    de 8 deixaria a música a declarar 8 e as células a cobrir 16, e a gravação recusaria com «sobram
    8 tempos» o resultado de uma acção que a própria tela ofereceu. `MUSICA_EM_FOCO` acompanha, senão
    o envio recarregava o rascunho da música antiga. **E não se reescreve sinal nenhum** — a
    Alternativa B da proposta, que perguntava a posição nova, foi recusada com medição: no `Plié` o
    `1ª` está nas **duas** pistas, e a troca automática escreveria `⌒ 2ª → 2ª → 2ª`. A posição muda-se
    no «Editar», onde se vê o que se está a mudar. **DECIDIDO por ela** (bloco = exercício inteiro;
    posição depois, Alternativa A) e **implementado** 02/11/2026.
63. **MUDAR OS TEMPOS É DECLARAR OUTRA MÚSICA — E OUTRA MÚSICA É OUTRA DECOMPOSIÇÃO.** Tentei
    conservar as células quando a música em foco ainda não existe, com o argumento de que elas são o
    gesto; **a suite revertou a ideia com números** — 13 asserções passaram a medir o exercício
    anterior, porque construir um cenário passa por declarar uma música nova. O `carregarRascunho`
    ficou como estava, e o bloqueio dos tempos resolveu-se **localmente**, dentro da duplicação.
    **DECIDIDO** 02/11/2026, contra a minha primeira proposta.
64. **CADA MÚSICA DE UM VERBETE TEM DE TER PORTA.** A listagem agregava («2 músicas») e o «editar»
    fazia `Object.keys(musicas)[0]` — sempre a primeira. Consequência medida: ela duplicou o `Plié`
    de 8 para 16 tempos, gravou, o alfabeto ficou com as duas, e **a segunda não aparecia em sítio
    nenhum**. A listagem passa a ter **uma linha por música**, com a música no `data-musica` do botão,
    e o servidor manda `detalhePorMusica` (tempos, compasso, `cobre`, trechos, direções, orientações,
    categorias — tudo derivado). **A regra geral:** um dado que se grava e não se consegue voltar a
    abrir é um dado perdido, ainda que esteja no ficheiro e a etiqueta o conte.
    **DECIDIDO e implementado** 02/11/2026.
65. **A CORRECÇÃO ANDA POR PASSOS — UM PAINEL DE CADA VEZ.** A decisão da manhã abria os painéis 4, 5
    e 6 durante a correcção de um trecho; ela respondeu que isso «abre tudo em um formulário único
    (página única)» e transforma os passos em «meros indicadores visuais». As duas coisas que ela
    pediu — **não saltar de passo** e **andar por passos** — não competem: o «Editar» não muda de
    passo (decisão 61, que fica), e o formulário mostra um painel só. **Corrige, com data, a decisão
    61 na parte da área do trecho. DECIDIDO e implementado** 02/11/2026.
66. **O SINAL TROCA-SE NO LUGAR.** Clicar uma ficha marca-a; clicar um sinal na paleta
    **substitui naquele índice**. Sem marca, a paleta acrescenta ao fim, como sempre. O «×» continua a
    tirar e **desfaz a marca quando os índices andam para trás** — uma marca esquecida em cima do
    vizinho trocaria o sinal errado em silêncio. A ordem é a informação: ela é a sequência em que o
    gesto acontece. **DECIDIDO e implementado** 02/11/2026.
67. **A ETIQUETA LOCALIZADA É UM CAMPO DO DADO, NÃO UMA TABELA NA TELA.** Cada termo do vocabulário
    pode ter `nome` — a etiqueta em português; a tela mostra `nome || termo`, e o `termo` continua a
    ser o que se grava e o que o documento escreve. Treze posições receberam `nome`; os empréstimos
    que se dizem assim em português (`retiré`, `attitude`, `arabesque`, `sur le cou-de-pied`) **não**
    foram traduzidos, porque traduzi-los seria inventar. A alternativa — uma tabela de tradução na
    camada de exibição — foi recusada: duas listas do mesmo vocabulário divergem ao primeiro termo
    novo. **DECIDIDO e implementado** 02/11/2026.
68. **GRAVAR UMA EDIÇÃO SUBSTITUI O REGISTO DE ONDE SE VEIO — E O «SUBSTITUIR» DIZ-SE ANTES.**
    A chave de uma música é `<tempos>|<compasso>`; mudar os tempos cria outro registo. Numa edição,
    a tela manda `musicaAnterior` e o servidor apaga a chave antiga depois de escrever a nova, com
    quatro guardas: só em edição; só com chave válida e **diferente** da nova; só se existir; e a
    mensagem do commit diz o que substituiu. A nota da tela di-lo **antes**, porque isto apaga
    dados. A outra intenção — «ficar com as duas» — existe numa caixa explícita que só aparece
    quando a música mudou. **A regra geral:** quando a chave de um registo é derivada de um valor
    editável, «guardar» e «guardar como novo» deixam de ser o mesmo gesto. **DECIDIDO por ela e
    implementado** 02/11/2026.
69. **AS BANCADAS DE LAYOUT NÃO SÃO TUDO-OU-NADA.** O `construir.js` saía por inteiro quando
    nenhuma escola tinha ciclo gerado, e uma bancada que lê o **alfabeto** (a da listagem dos
    verbetes) não precisa de ciclo. Passa a construir o que pode, e a bancada que mede a Aula 01
    sai como **página que explica a ausência**, com o motivo do registro e o comando que a faz
    voltar. Numa escola nova — que é quando a listagem se quer decidir — antes não se construía
    nada. **DECIDIDO e implementado** 02/11/2026.
70. **A LISTAGEM DO VERBETE É O CARTÃO DAS TURMAS.** Escolhida a opção 1 da bancada: `li.turma`,
    `.linha-turma`, o nome como botão, o selo, o complemento, e as três caixinhas `.trio` com o «?»
    — `Música`, `Direção`, `Notação`. A da notação abre a tabela do passo 6 em leitura, com o
    compasso **derivado pelo motor** (`compor`), e não por uma segunda conta. **Nenhuma classe
    nova:** as peças são da folha, e a marcação é a da turma. Medido: 285 px por cartão a 320, 192 a
    390, 142 a 768, 0 de transbordo. **DECIDIDO por ela e implementado** 02/11/2026.
71. **UMA PEÇA, UM COMPORTAMENTO — TAMBÉM NO JAVASCRIPT.** Escrevi um handler de clique para o «?»
    do cartão, e o botão não abria nada: a página **já tem** um ouvinte de `.trio-item` no
    `document` (o da turma), que dispara depois e **fechava** o painel que o meu acabara de abrir. A
    correção foi **apagar o meu** e usar o que existe — o cartão ganha o «abrir um fecha os outros» e
    o `Escape` de borla. **DECIDIDO e implementado** 02/11/2026.
72. **O VOCABULÁRIO DA MODALIDADE CRESCEU, E O GLIFO PODE TER DOIS PAPÉIS.** Entram a categoria
    **Cabeça** (uma pista, e não um membro com posições), `↻` rotação para dentro, `○` abre, os
    **lados nos três eixos** (`D`/`E` horizontal, `F`/`T` sagital, `C`/`B` vertical), as direções
    **para dentro** e **para fora**, e a orientação **de lado · perfil**. O rótulo `épaulement`
    deixou de ser «ombros rodados» — não é o ombro que roda, é a coluna — e passou a **«ombro à
    frente»**. **O mesmo glifo `↻`/`↺` é movimento (passo 5) e direção (passo 4)**, de propósito:
    é o que já acontecia com `+`, `-` e `×`, e um membro que vai para fora roda para fora.
    **DECIDIDO por ela e implementado** 02/11/2026 — em **conteúdo** (`notacao.json`), sem tocar em
    `tools/` nem no motor.
73. **O QUE APAGA TRABALHO NÃO SE DEIXA AO ALCANCE DE UM CLIQUE ACIDENTAL — BLOQUEIA-SE.** Era a
    terceira vez que o assunto dos tempos apareceu, e a resposta dela foi a mais simples: «não pode
    editar esse campo». Com trechos escritos, a música fica só de leitura e o compasso desactivado;
    quem quer a mesma decomposição noutra duração usa o «Duplicar o exercício», que é o gesto
    **explícito** para isso. A alternativa era um `confirm` a perguntar «isto descarta os trechos?»,
    e ela já disse o que pensa de um formulário que pergunta o que devia saber. **DECIDIDO por ela e
    implementado** 02/11/2026.
74. **A POSIÇÃO É DO TRECHO, E NÃO SE PEDE DUAS VEZES.** O campo «posição em que o exercício
    acontece» **saiu** do passo 2: a posição já se escreve nos sinais do trecho, com a direção e a
    contagem ao lado. O **dado fica** (`posicao: {membro, termo}`) — tirar o pedido não é tirar a
    informação, e um verbete antigo continua a ler-se. A frase do exercício subiu ao passo 1, porque
    é a **definição** dele e nasce onde ele nasce. **DECIDIDO por ela e implementado** 02/11/2026.
75. **O VERBETE PODE SER APAGADO — E O QUE ISSO INVERTE FICA ESCRITO.** A rota respondia 409 com a
    P-03/P-04; passou a apagar. O argumento antigo não era um capricho e não se apaga com o código:
    uma aula já publicada que citava o exercício passa a sair com a notação em **lacuna**. A
    diferença é que isso passa a ser **dito antes** do gesto, na pergunta que a tela faz, e não
    usado como recusa. O que **não** se apaga é o exercício no vocabulário: sai a notação, fica a
    palavra. **DECIDIDO por ela** («faltou fazer o verbo deletar o verbete») **e implementado**
    02/11/2026.
76. **O VERBETE EM USO NÃO SE APAGA NEM SE REESCREVE: AJUSTA-SE.** Duas metades, uma decisão. O
    `DELETE` fica guardado pela proveniência (plano de ensino, turma com plano, curadoria) e a
    recusa diz o caminho — «Descontinuar». O `UPDATE` de um verbete em uso passa a ser um **ajuste**:
    o estado anterior fica no histórico (`versoes[]`, com `ate` e motivo) e a composição escolhe o
    estado que valia **na data do envelope**. A opção escolhida por ela foi a **B** (versões
    datadas); a **A** (histórico sem tocar no gerador) não impedia o documento antigo de mudar ao ser
    regerado, e a **C** (bloquear a edição) obrigaria a duplicar o exercício no dicionário para o
    corrigir. **DECIDIDO por ela e implementado** 02/11/2026.
77. **A LISTA DE TRADIÇÕES É UMA, E A CAIXA ALTA É DERIVAÇÃO.** `tradicoes.json` é a fonte; os
    quatro selectores e as duas listagens geram-se dela, e por isso acrescentar **CUBANA** lá pôs a
    tradição em todas as telas sem tocar em mais nada. O **dado** continua a guardar a chave
    (`francesa`, `Vaganova`): subir as maiúsculas seria migrar 4 termos do vocabulário e deixar as
    colunas de `diferencasDeNomenclatura` sem ninguém, em silêncio. A Cubana **não** ganhou linhas
    de nomenclatura — inventá-las seria conteúdo sem fonte. **DECIDIDO por ela e implementado**
    02/11/2026.
78. **O QUE NÃO VALE NÃO SE PEDE — E O QUE SE PEDE ACENDE COM O NOME.** O «Gravar verbete» fica
    `disabled` sem decomposição (a guarda do `submit` e a do servidor ficam, e servem quando o
    JavaScript falha), e a categoria, a tradição e «o que acontece» só entram em vigor quando há um
    exercício — nome novo **ou** escolhido no passo 2. A segunda metade da condição não estava no
    pedido e é obrigatória: sem ela, corrigir um verbete que já existe fecharia a frase a quem a veio
    corrigir. **DECIDIDO por ela e implementado** 02/11/2026.
79. **A ESTANTE MOSTRA UM POR DOCUMENTO; A PROVENIÊNCIA NÃO SE EMPILHA NO ECRÃ.** Três ajustes do
    PO viravam três linhas com o mesmo nome. A regra é do núcleo (`porta.vigentesDaFamilia`) e tem
    duas metades: a **cadeia** (`ajuste_de` — quem derivou declarou de quem) e o **contexto** — duas
    tentativas irmãs do mesmo documento (o plano observado, para o PO; a aluna, para a anamnese)
    colapsam na mais recente. **O plano de ensino fica só com a cadeia**: dois planos da mesma turma
    e ciclo com objetivos diferentes são dois documentos, e agrupá-los escondia o plano que um PO
    observa — medido, é a bancada `provar-apagar-da-listagem` a dizê-lo. Os envelopes escondidos não
    se apagam nem se movem: continuam legíveis, no índice, e os **estados** e a regra de proveniência
    dos Bastidores continuam a derivar de todos. A linha diz quantas versões guardou. **DECIDIDO por
    ela** («o professor não tem por que entender os bastidores») **e implementado** 03/11/2026.
    > **Nota de 13/11/2026 — a segunda metade mudou.** «O plano de ensino fica só com a cadeia»
    > cumpriu a metade de que precisava — o documento verdadeiro não desaparece —, mas com **dois
    > professores a alternar-se na mesma cadeia** cada troca de autor deixava o elo à vista, porque a
    > regra de 12/11 impede que um sucessor de outro autor esconda o anterior. Medido no `calango`:
    > **18 planos numa cadeia → 5 linhas** na turma `Piano` (e o PO, 20 → 6), três delas **órfãs**.
    > **Decidido por ela:** «a gente vai listar somente aquele mais recente que é pertinente […]
    > dois planos mesmo, que é o do pé torto e o da redinha». O agrupamento passa a ser **a raiz da
    > cadeia + o professor**, e não «só a cadeia»; os outros elos são proveniência, contados na linha
    > do vigente. **E é a raiz, não a turma**: a cadeia mudou de nome no meio (`Rosa` → `Piano`) e
    > não pode partir-se em duas linhas. `provar-uma-linha-por-professor` **23**, com controlo
    > negativo (a regra anterior dá 6).
80. **A FATIA DE TEMPO LÊ-SE PELA COLUNA, E O GUIA TEM AS TRÊS FRENTES.** Duas correções de leitura.
    (1) A proporção de cada bloco era lida por `Object.values(linha)[1]`, e a gravação não escreve
    célula vazia — quando «Proporção alvo» falta, a justificativa ocupa o lugar dela e a aula
    imprime «Braços» como fatia. A coluna passa a ser procurada pelo **nome** (tolerante a acentos),
    as unidades **percentual** e **minutos** convertem nos mesmos tempos, a fatia em minutos diz a
    unidade, e a lacuna **nomeia o bloco e o sítio** — e o plano diz o mesmo ao pé da tabela. (2) O
    guia de observação lia tudo como «Técnica —»; passa a ter o **resumo por eixo** — **Corpo**
    (aspectos físicos do plano, ponto de partida, restrições), **Técnica** (Barra, Centro) e
    **Poiesis** (Musicalidade, Expressão) — com a tabela **item a item** logo abaixo. Nenhum rótulo
    do dado foi renomeado (P-03), e **o mapa dos eixos é candidato**, não taxonomia decidida: ele é
    dela, e o mapa vive numa constante documentada até ela decidir o lugar definitivo. **DECIDIDO
    por ela** («o guia contempla as três dimensões»; «a fatia está no plano») **e implementado**
    04/11/2026.
81. **O AJUSTE DO PLANO ARRASTA O PO — E O PO OBSERVA O PLANO QUE VALE.** A pesquisadora ajustou a
    proporção do Expressão no plano de ensino; o «Guardar» criou o elo novo (a proveniência manda) e
    o **PO continuou a apontar o plano substituído** — medido: `po-20261104-1733` declara
    `plano-de-ensino: plano-20261103-2200`. Para o professor foi «um ajuste»; o que ele viu foi um
    plano «livre» e uma aula com a proporção antiga. A regra passa a ser uma e derivada do
    `ajuste_de` (nada é inferido): a **cadeia** do plano tem um **topo** (`planoVigenteDaCadeia`), o
    PO do plano é o que observa qualquer elo e não foi substituído (`poDoPlano`), e ao gravar um
    plano ajustado a rota **deriva um elo do PO** com a referência nova e corre o caminho normal
    (fonte, ciclo, disparo). Um PO gravado a declarar um plano substituído **passa a apontar o
    vigente**, e o ajuste é **dito** na resposta. **Sem PO nada se inventa** — um plano livre
    ajustado continua sem observação. **DECIDIDO por ela** («o usuário sente que está apenas
    editando o plano que já possui, e a alteração deve reverberar de forma natural e integrada»)
    **e implementado** 04/11/2026.
82. **O CARTÃO DA AULA DIZ O QUE SE OBSERVA, E NÃO COMO O SISTEMA É FEITO.** Três mudanças na
    listagem: a frase «a aula não tem professor próprio: quem o tem é a turma…» **saiu** (é
    arquitetura, e o painel fica com o dado); a caixa **Horário** foi **absorvida** pela **Turma**
    (identificação, ciclo, «aula N de M», dia, início, fim, duração — e a **Sala** dita «não
    declarada», porque ela só existe no modelo com o `PLANO-TABELA-DE-ATIVIDADES`); e o **Guia de
    observação** entra como caixa — a conta, os itens por dimensão e uma **linha de síntese por
    eixo** ao lado do nome, para se ter à mão sem abrir a aula. O link «Aula N — objetivo» e os três
    botões (Lançar · Captura · PDF) ficam. **DECIDIDO por ela e implementado** 04/11/2026.
83. **O NOME DE UM DOCUMENTO NÃO SE DECIDE ANTES DE GRAVAR — QUEM DECIDE É A GRAVAÇÃO.** O id de um
    envelope é um carimbo de minuto, e `identificar` perguntava «existe?» para o escolher. Entre a
    pergunta e a gravação há uma janela; dois pedidos que perguntassem antes de qualquer escrita
    recebiam o **mesmo nome**, o segundo gravava por cima do primeiro, **os dois respondiam
    «gravado»** — e um ajuste evaporava. **MEDIDO** (04/11/2026, núcleo sobre a memória): dois
    `identificar`, duas gravações, **um** documento no acervo, e o índice a descrever o documento do
    B sob o nome que o A devia ter. **DECIDIDO**: (a) o contrato de armazenamento ganha `criar`
    (grava só se a chave não existir) — no repositório a escrita vai **sem `sha`** e o **422
    «"sha" wasn't supplied»** do GitHub é o «já existe», **medido contra a API real** num ramo
    descartável; um 422 por outro motivo é **erro**, e não «já existe». (b) Perdida a corrida, o
    nome cede ao sufixo seguinte — o mesmo `-2` que o `identificar` daria se tivesse visto a outra
    escrita —, e o `documento.id` viaja com o nome do arquivo. (c) **A intenção é declarada, não
    adivinhada**: `substituir: true` quando o id foi **dado** (edição em sítio, correção — grava por
    cima, como sempre), `false` quando foi **inventado agora** (elo novo, registo solto) —, e o
    omisso é `true` para nenhum chamador mudar por esquecimento. (d) O índice é **projeção**: o
    resumo do nome cedido passa a descrever o **arquivo**. (e) O **expurgo** — o único escrito em
    lote sem repetição — passa a refazer a corrida que perdeu, porque chegava lá com a metade do
    Cloudflare **já apagada**. **DECIDIDO por ela** («as duas correções») **e implementado**
    04/11/2026.
84. **A EDIÇÃO SIMULTÂNEA DO MESMO DOCUMENTO UNIFICA POR DIFF — E O MESMO CAMPO DECIDE PELA
    RECÊNCIA.** Fechada a corrida do *nome* (83), faltava o caso de **duas pessoas** na mesma escola
    a gravar **o mesmo** plano/PO: a segunda vencia em silêncio. **DECIDIDO por ela** (04/11/2026):
    (a) se as edições mexeram em **campos diferentes**, as duas ficam — nada se perde; (b) se
    mexeram no **mesmo campo**, vence a edição **mais recente, ao milissegundo** (`escrito_em`);
    (c) no empate vence a gravação que está a correr, que é o único desempate que não depende de
    relógios externos; (d) o **local** é a chave de `respostas` — uma resposta é uma unidade; (e)
    **sem base não se adivinha**: a fusão a três vias precisa do que o professor leu, e faltando
    ele grava-se como sempre. A regra é **pura e do núcleo** (`motor/nucleo/fusao.js`); a repetição
    do 409 é do adaptador (`gravarComFusao`). A fusão **nunca é silenciosa**: a resposta traz
    `fundido` e `fusao: { unidos, conflitos }`. **Implementado** 04/11/2026.
85. **O ID NÃO GANHA ENTROPIA — A UNICIDADE É UMA CONDIÇÃO VERIFICADA PELO STORE.** A ordem de
    serviço de 04/11/2026 pedia «sufixo aleatório combinado ao timestamp». **Não foi o que se
    adotou, e o motivo está declarado**: a solução é a **criação condicional** (o GitHub responde
    pela existência, com o 422) mais o **sufixo sequencial** (`-2`, `-3`). A entropia custaria três
    coisas que o projeto não quer — o id deixaria de ser **legível** (a estante mostra o carimbo),
    de ser **derivável** (a reconstrução do índice e as provas que fixam `anamnese-20261016-1351`)
    e a unicidade passaria a depender de um **gerador** em vez de uma **condição verificada pelo
    store**. O `-2` é determinístico e auditável. **DECIDIDO** 04/11/2026 — **divergência
    declarada** da ordem de serviço, não cumprimento.
86. **O CARTÃO DA AULA MOSTRA O QUE O DADO TEM — E O GUIA É O EIXO, NÃO O RÓTULO.** Três decisões
    dela, de 04/11/2026, e as três são a mesma: *o documento diz o que o dado tem.* (a) **O ciclo
    sai da caixa da Turma** — «o ciclo não é um atributo estrutural da turma» — e o operacional
    fica (aula N de M, dia, início, fim, duração, e a Sala dita «não declarada», porque ela só
    existe com o `PLANO-TABELA-DE-ATIVIDADES`). (b) **O professor são três dados**: nome e
    modalidade do **perfil da pessoa** (a habilitação é dela, não do tenant), e a **tradição de
    referência** do **plano**, que é quem a declara — pô-la no perfil diria que a pessoa só
    trabalha numa tradição, mais do que o dado afirma. O identificador deixa de ser o nome de
    ninguém. (c) **O guia são três tabelas, uma por eixo**, e o eixo é o **bloco** do documento
    (`### Corpo`, `### Técnica`, `### Poiesis`) — não por gosto: o contrato de extração lê **uma
    tabela por bloco**, e três tabelas num bloco só perderiam a segunda e a terceira. O eixo do
    **Corpo** passa a ter **linhas** (os aspectos físicos do plano, o ponto de partida de cada
    aluna, as restrições do PO); até aqui era uma frase de contagem, e uma tabela que salta um eixo
    dos três ensina que ele não se observa. **DECIDIDO por ela e implementado** 04/11/2026.
87. **A PROVENIÊNCIA LEVA À LEITURA, NÃO AO FORMULÁRIO.** Os dois links da §6 da aula abriam a
    **porta** (`/plano-observacao/?…&fonte=po`) — o formulário de elicitação. Quem clicava para
    reler o que tinha decidido caía dentro do formulário que ia reescrever esse documento. Passam a
    abrir a **folha** do documento (`api/po-preenchido.<id>?formato=html`), que é **a mesma** que o
    título abre na Área do Professor (o mesmo `fichaDeLeitura`), com o `id` do envelope. O
    `formato=html` viaja porque sem ele a rota devolve MARKDOWN. **Sem `id`** — envelope ainda não
    gravado — cai-se na porta, e não num link quebrado. **DECIDIDO por ela e implementado**
    04/11/2026.
88. **A LARGURA DE UMA COLUNA É A DO CONTEÚDO — E ELA MORA NA LINHA DE SEPARAÇÃO.** «Todas as
    colunas estão com o mesmo tamanho, espremendo os textos descritivos» era literal: as doze
    tabelas de exercício saíam a **28/28/21/21**, com o «1» do compasso tão largo como o parágrafo
    da descrição. **A causa não era CSS** (o `table { width: 100% }` da folha está certo, e o
    browser distribui por conteúdo quando não há largura declarada): era o `<colgroup>` que o
    pandoc escreve, e ele calcula a largura relativa pela **proporção dos traços** da linha de
    separação — **e só quando essa linha passa dos 72 caracteres** (`--columns` por omissão, que o
    `gerar-ciclo.sh` não muda). Uma linha proporcional mas curta é desfeita em silêncio; as duas
    condições foram medidas (67 caracteres → sem `colgroup`; 104 → larguras). **DECIDIDO**: a
    correção mora na linha de separação, e não numa regra de CSS por tabela — uma segunda fonte de
    verdade para uma decisão que o gerador já toma, e o PDF (LaTeX) lê a mesma proporção, de modo
    que o que se corrige vale nos dois suportes. A proporção passou a **12/12/23/52**. **A divisão
    não é a metade exacta do pedido**, e o motivo é medido: repartir o ganho igualmente entre
    notação e descrição daria 14/14/35/35, e a descrição — 150 a 300 caracteres — ficaria com um
    terço da tabela; o ganho vai a favor de quem tem texto. **DECIDIDO por ela e implementado**
    04/11/2026.
89. **A NOTAÇÃO NÃO ESTÁ NA MÚSICA — ESTÁ NO DOCUMENTO DELA.** O bloco de musicalidade da aula
    trazia, na célula da contagem, o bloco Benesh (`1–2 `[Perna: ED 1ª ○ - ● 1ª]``). Saiu. O bloco
    de musicalidade é a **música** da aula (compasso, exercício, tempos, contagem), e a notação é o
    **código** em que a música se escreve: tem documento próprio (`-notacao.md`, «Exercícios da Aula
    01») e é lá que o botão «notação» do cabeçalho da aula a vai buscar. Repeti-la aqui punha 24
    caracteres numa coluna de «1–2», a espremer as outras três. A dedução da contagem passa a ser
    **só pela contagem** (era contagem + bloco). **DECIDIDO por ela e implementado** 04/11/2026.

93. **O PLANO DE OBSERVAÇÃO TEM OS TRÊS EIXOS — E O CORPO VEM DA ANAMNESE.** As dimensões nascem do
    plano como `<eixo> — <bloco>`, com o eixo **escrito no conteúdo** (`doPlano.eixo: "Técnica"`), e
    por isso o documento listava «Técnica — Musicalidade» e «Técnica — Expressão». Musicalidade e
    expressão são **poiésis**, e o rótulo era uma afirmação falsa sobre o que se mede. O mapa passou
    a ser **um só** (`motor/nucleo/eixos.js` — havia duas cópias), o eixo decide-se pelo **bloco** (o
    prefixo gravado não manda), e **nada é renomeado no dado** (P-03): o que muda é a leitura. O
    **Corpo** é eixo próprio — não uma técnica — e alimenta-se da **anamnese de cada sujeito**, pelos
    campos que o «Ponto de partida» já declara (`registroDaAnamnese.grupos[].campos`). O seletor do
    sujeito passou a ser o **primeiro bloco**, antes das dimensões: é o que faz a cascata chegar a
    tempo. **DECIDIDO e implementado** 04/11/2026.

94. **A RÉGUA DO REPERTÓRIO É UMA SÓ — E ELA VALE EM TODOS OS DOCUMENTOS.** O «Port de bras» saiu do
    exercício da aula a 03/11/2026 (`linhasDoRepertorio`) e continuou a aparecer no **§1 da mesma
    aula**, na matriz do «Parâmetro de medição» — porque a régua foi aplicada a uma porta e não à
    outra. Agora `termoForaDoRepertorio`/`termosDoRepertorio` servem as duas formas de dado (a linha
    de tabela e o termo solto), e valem no §1 da aula, na ficha do plano e na sequência. Sem
    repertório declarado não se julga nada. **DECIDIDO e implementado** 04/11/2026.

95. **A LINHA DO CARTÃO É O OBJETIVO GERAL, E A SÍNTESE POR EIXO FICA NO GUIA.** «A linha de resumo
    (que lista os eixos e contagens) já está perfeitamente posicionada dentro do Guia de Observação,
    tornando redundante a sua exibição na listagem.» Entra o **objetivo geral do Plano de
    Observação** — o `horizonte`, que o próprio conteúdo do PO chama «Horizonte (objetivo geral de
    conjunto)» —, com o prefixo `Plano de Observação — `. A hierarquia fica completa: o título do
    cartão é o objetivo **específico** da aula, a linha é o **geral** do ciclo. **DECIDIDO e
    implementado** 04/11/2026.

90. **O COMPOSTO NÃO ENUMERA VERBOS — ELE ENCAMINHA.** O armazenamento que o Worker monta
    (`combinar`) listava os verbos um por um, e o que ficava de fora da lista desaparecia **sem
    aviso**: o `criar` nasceu no acervo e nunca chegou ao motor, de modo que a escrita condicional —
    a blindagem da decisão 85 — era inerte em produção; o `anexar` faltava, e a rota do registro de
    custo da IA chamava uma função que não existia. E havia um terceiro furo, mais fundo: os dois
    adaptadores de **base** não implementavam `criar`, que o contrato declara. A correção não foi
    acrescentar os verbos que faltavam — isso deixaria a armadilha armada para o próximo. O composto
    passou a ser um `Proxy` que encaminha **qualquer** verbo para quem atende a família da chave; só
    `criar` (degradação declarada) e `gravarComFusao` (exige o `sha`) mantêm regra própria. A regra
    fica verificável — *verbo no contrato ⇒ verbo nos dois adaptadores de base + no acervo + no
    composto* — e a bancada lê os verbos **do ficheiro do contrato**, passando pelo
    `criarArmazenamento`, que é o que a produção monta. **DECIDIDO e implementado** 04/11/2026.

91. **A MODALIDADE TEM UM ÚNICO PONTO DE DERIVAÇÃO.** O motor tratava a modalidade como constante
    em 8 ficheiros, e o número medido (**29 ocorrências**, das quais **6 decidiam comportamento**) é
    maior do que os «10 sítios» contados a 03/11 — a diferença é de método: contar sítios subestima o
    acoplamento, contar literais não. Agora `modalidadePrincipal()` é **a única derivação** (a primeira
    modalidade do catálogo com `temConteudo`, e `''` se não houver catálogo), `MODALIDADE_PADRAO` é
    **derivada** dela em vez de escrita, e a página da Produção lê `modalidadeDoCatalogo()`. **Um
    literal de modalidade não se escreve em `motor/`**: quem precisa do padrão chama a constante;
    quem precisa de *outra* modalidade recebe-a do perfil, do plano ou da query. **DECIDIDO e
    implementado** 04/11/2026.

92. **O CUSTO DA ESCRITA É EM REQUISIÇÕES, E O LIMITE MORDE A RAJADA — NÃO A MÉDIA.** Não é um
    gosto: é a aritmética que sustenta a decisão de nunca adoptar banco relacional. Medido: um
    «Guardar» de envelope novo custa **3 `GET` + 3 `PUT` = 18 pontos**; uma edição, **7**. Limites
    reais (documentação do GitHub): 5 000 req/h autenticado, **1 000/h com o `GITHUB_TOKEN` de
    Actions**, **500/h e 80/min de criação de conteúdo**, 900 pontos/min. A 7 pontos por edição, 500
    `PUT`/h dão ~70 edições por hora — mais do que um professor faz num mês. O que morde é a
    **rajada**, e é por isso que o expurgo é **um** commit e não 76 escritas. **O critério de
    revisão é explícito, e não é conforto:** a escolha só se revê se a escrita passar a ser *volume*
    (milhares de gravações por hora por escola) ou se o `80/min` for tocado no uso normal.
    **DECIDIDO e documentado** em `ARQUITETURA-GERAL.md` §7.1, 04/11/2026.

96. **O CABEÇALHO DO ATO EMPILHA NO TELEFONE — OS RÓTULOS DAS LEITURAS INCLUÍDOS.** As cinco
    leituras do cabeçalho (frequência, duração, calendário, volume, condição de registo) **não são
    `<label>`**: são um `.ctx-rotulo` e um `.ctx-inscricao`, porque não se preenchem. A regra que
    punha o rótulo na linha inteira cobria só o `label`, e a grelha do campo dava a coluna elástica
    ao rótulo e o `auto` ao valor — como o valor é uma **frase**, o rótulo encolhia até **0px** e o
    texto empilhava-se por cima dele. Medido a 360px: rótulo 0px, valor 129px. Agora ambos ocupam a
    linha inteira, na ordem em que se lê. **DECIDIDO e implementado** 04/11/2026.

97. **A CAPACIDADE É CALCULADA, E O TECTO QUE MANDA É O `PUT`.** Não a requisição: um `PUT` é uma
    criação de conteúdo. **26 criações ou 80 edições por minuto**; **166 ou 500 por hora**. Em
    escolas, com metade das gravações a serem criações: **5** em hora de ponta, **17** em uso
    corrente, **62** pequenas. São **projecções** — do custo medido nas bancadas e dos limites
    documentados do GitHub —, e **não** um ensaio de carga. O critério de revisão do §7.1 fica com
    número: a escrita passar a lote, o `80/min` tocado no uso normal, ou uma ordem de grandeza a
    mais de escolas (e aí a resposta é **outro repositório**, não um banco). **DECIDIDO e
    documentado** em `ARQUITETURA-GERAL.md` §7.2, 04/11/2026.

98. **A ANAMNESE NÃO REGENERA O CICLO — E NÃO DEVE.** O encadeamento é de **instantâneos**: a
    anamnese alimenta o `aspecto-fisico` do plano por um botão («Carregar das anamneses da turma»,
    que a professora **corrige**) e informa o `linha-de-base` do PO, que ela escreve por palavras.
    Nenhuma derivação lê a anamnese — `derivar-plano-ciclo.js` lê a tabela já consolidada. Regenerar
    sozinho desfaria a correção dela. Ficam duas notas **abertas**: o `fonte === 'anamnese'` está na
    condição da cadeia em `rotas.js` **sem ramo que o atenda**, e o instantâneo **não guarda de que
    anamneses nasceu** — a divergência não se detecta. **DECIDIDO (o comportamento está certo) e
    documentado** 04/11/2026.

99. **UM CICLO APAGA-SE DE TRÁS PARA A FRENTE — E SÓ O ÚLTIMO.** O `parentHash` de um ciclo é o
    `hash` da âncora do anterior; apagar um intermédio deixa o `parentHash` do seguinte a apontar
    para um hash que já não existe, e a cadeia fica partida **sem remédio** (P-03). A rotina leva o
    pacote gerado, o `.conf` da variante, as âncoras e os **POs** do ciclo; **não** leva a anamnese
    (é do sujeito) nem o plano de ensino (é a declaração que deu origem ao ciclo). E o plano fica
    **livre sem se lhe tocar**, porque o vínculo PO ↔ PE é derivado: apagados os POs, não há quem o
    declare — é o modelo da curadoria. **DECIDIDO e implementado** 04/11/2026.

100. **A SEQUÊNCIA DOS CICLOS É ESTRITA, E O CAMPO NÃO SE ESCREVE.** Um ciclo existe porque tem
     documento, e a lista vem do índice dos envelopes — não de um cadastro. `proximoCiclo` devolve
     `01` numa escola nova, o seguinte ao maior quando a sequência está inteira, e **`null` quando
     há um buraco**: inventar o número que taparia a lacuna esconderia o problema. O campo
     `#ctx-ciclo` passa a `readOnly` com a nota do motivo, e **desaparece da anamnese**. Nada é
     renomeado no dado. **DECIDIDO e implementado** 04/11/2026.

101. **A ANAMNESE É DATADA E IMUTÁVEL — O GESTO É «NOVO REGISTO».** Se ela é o retrato físico do
     corpo num momento, é historicamente datada; uma aluna que evoluiu ou se lesionou não teve um
     «ajuste» do passado, tem um **novo estado no tempo**. O «Ajustar» gravava `ajuste_de` e
     marcava o anterior como substituído — e um retrato novo não substitui o anterior: os dois
     aconteceram. O formulário abre **preenchido** com o retrato anterior e grava um documento
     novo, com data nova e sem `ajuste_de`. O «Editar» fica só para a anamnese **solta** (rascunho).
     **DECIDIDO e implementado** 04/11/2026.

102. **O QUE PRECISA DE REVALIDAÇÃO É DERIVADO — E A ORDEM É PE, DEPOIS PO.** «A anamnese de algum
     sujeito é mais recente do que este documento?» marca o PO e, pela cadeia, o plano que ele
     observa; o motivo do plano diz a ordem («Revalide ESTE plano PRIMEIRO»). Não há campo no
     envelope: um `revalidar: true` seria uma segunda declaração do mesmo facto, e um sinal que se
     esquece de apagar é um sinal que mente. O julgamento é do professor — o sistema não altera
     nada sozinho. **DECIDIDO e implementado** 04/11/2026.

103. **NÃO HÁ VALIDADE NEM PERIODICIDADE DA ANAMNESE.** Não se julga se ela está «velha»: quando
     se refaz o retrato é **política da escola**, e um motor que a impusesse estaria a decidir
     pedagogia por conta própria. Os **marcos do ciclo** — formativa (aula N/2) e somativa (última
     aula) — já são calculados pelo calendário e são a referência natural, se a escola quiser usá-la.
     **DECIDIDO** 04/11/2026.

104. **O CORPO TEM UMA FONTE SÓ: O DETALHE NA AULA 1, O PONTEIRO NO PLANO — E O VÍNCULO NÃO SE
     INVERTE.** A aula continua a derivar do plano: o PE e o PO são a origem (onde o professor
     escreve), e a aula é a vista que desce ao detalhe. O que a regra fixa é a **escala de cada
     vista** — o plano declara O(1) (a contagem e o link), a aula O(aspectos), o PO O(alunas) —
     nunca O(alunas) num documento de leitura. A **restrição física** fica na aula, citada e fora
     da tabela: é lesão/dor/limitação, e o PO declara que «a ausência também é informação». O aspecto físico (o
     eixo do corpo) era impresso **duas vezes** — no plano do ciclo e na aula 01 — a partir da
     **mesma** chave do envelope. Duas cópias do mesmo dado são duas versões à espera de divergir. A
     tabela dos aspectos fica na **Aula 1** (secção «Corpo» do guia), o plano publica a contagem e
     um **link** para `aula-01.html#corpo`, e o ponto de partida de cada aluna fica no **PO** — que é
     do sujeito, e é onde a Captura o pede. **A linha por aluna saiu da aula**: com trinta alunas
     eram sessenta e uma linhas antes da primeira marca. O título da secção do plano perdeu «força e
     flexibilidade» — declara o **eixo**, não a lista de capacidades, que é a da aula. **DECIDIDO e
     implementado** 04/11/2026.

105. **OS DOIS PLANOS TÊM DOIS NOMES — E AS TRÊS SUPERFÍCIES DIZEM O MESMO.** O documento do ciclo é
     «Plano do Ciclo NN»; o de cada aula é «Plano para a Aula NN — objetivo». O nome muda no
     `title:` do front-matter (que alimenta `<h1>`, menu e PDF), no cartão da listagem e no registo
     da geração — e a bancada exige que o nome do cartão seja **prefixo** do título da página:
     medir uma superfície só deixaria viva a divergência entre a lista e o documento que ela abre.
     **O nome do arquivo não muda**: `aula-01.md` é endereço, e entra na âncora `.fipp`, no `DOCS`
     do `.conf` e nos links internos. **DECIDIDO e implementado** 04/11/2026.

106. **O PO APAGA-SE — E O QUE O TRAVA É O SUCESSOR, NÃO O VÍNCULO.** A linha do Plano de
     Observação oferecia só «Ajustar» porque nunca houve estado, botão nem rota que o apagasse. O
     trio entrou: `estadoDoPo` (o PO é `solta` ou `legado` conforme tenha sucessor), `DELETE
     /api/po-vinculo/:id` (409 quando derivado, nomeando o sucessor) e o botão na listagem. **Nada
     referencia um PO** — o ciclo gerado guarda a sua própria cópia (`po-01.json`, `-po.md`) —, e é
     por isso que a trava «está vinculado», que o plano de ensino tem, não existe aqui. **DECIDIDO e
     implementado** 04/11/2026.

107. **O LAYOUT DA COLUNA NÃO DEPENDE SÓ DE `:has()`.** As cinco regras que põem a barra ao lado da
     coluna, dão os 248px de margem ao `body` e trocam a lista pelo ☰ existem **duas vezes**: com
     `body:has(> .coluna)` e com `[data-tem-coluna="sim"]`, escrito pelo `assets/nav.js`. `:has()`
     não existe no Firefox ESR 115, e sem ela o menu deixa de receber cliques (a coluna cobre os
     primeiros 248px da barra) — medido. **As duas versões ficam em REGRAS SEPARADAS**: um seletor
     inválido numa lista descarta a lista inteira, e o remendo cairia com ela. `:has()` mantém-se
     onde existe, para a regra valer antes de o script correr. **DECIDIDO e implementado** 04/11/2026.
108. **A SENHA É PRÉ-REQUISITO DE GRAVAR, NÃO DE ENTRAR — E «NOVO REGISTO» FALTAVA NA LISTA.** O
     `podePreencher` isenta de senha a edição e a derivação (`emEdicao = EDITANDO || DERIVANDO`),
     porque entrar não escreve nada. O `?novo=` da anamnese (`DUPLICANDO`) é o terceiro gesto da
     mesma família e ficou de fora: o formulário era pintado e a mesma trava, um instante depois,
     devolvia a pessoa à lista — «pisca e trava e volta». A mesma omissão existia no servidor
     (`PARAMS_DO_ATO` tinha `editar` e `ajustar`, não tinha `novo`). **DECIDIDO e implementado**
     05/11/2026: `emEdicao` inclui `DUPLICANDO`, e `novo` entra na lista de permissão do `302`.
109. **O CICLO TEM A FORMA DO QUE A FONTE FAZ.** A anamnese **não tem** campo de ciclo (ele sai da
     página, não fica escondido: um campo com `display: none` continua no documento e no leitor de
     ecrã); o plano de ensino trava no **próximo** número (ele cria um ciclo); e o PO é uma **lista
     dos ciclos que já têm plano de ensino** (`GET /api/ciclos` → `comPlano`), porque não se observa
     um ciclo sem plano. O `<input>` do PO é trocado por um `<select>` na fonte, com o valor do
     documento transferido; um PO cujo plano foi apagado continua a abrir no ciclo dele.
     **DECIDIDO e implementado** 05/11/2026.
110. **O REGISTO CONDENADO NÃO SE LÊ ENQUANTO A ROTA RESPONDE.** Apagar dispara uma Action no
     GitHub, e entre o clique e a resposta a linha continuava visível e interactiva — dava para
     abrir, ler e tentar ajustar um documento que estava a ser destruído. A linha passa a ficar
     **trancada** (`data-apagando` + `inert` + `aria-busy`) até a resposta chegar, e um 409
     **destranca** com o motivo escrito: um registo que existe e não se pode abrir é pior do que o
     defeito. **DECIDIDO e implementado** 05/11/2026, com peça nova na folha
     (`[data-apagando="sim"]`: véu, fio «apagando…» e spinner) e motivo declarado em
     `CONGELAMENTO.md`.
111. **A MOLDURA NUNCA FALTA — E ELA É UM ENQUADRAMENTO, NÃO UM SUBSTITUTO.** A barra e a coluna
     existem em 100% das telas que o Worker serve. A causa do desaparecimento era de mecanismo:
     `nav.aplicar` SUBSTITUI uma `<nav class="topnav">` que já exista, e a porta traz o marcador
     `<!-- NAV -->` (que a GERAÇÃO substitui — mas a porta é copiada). Num pacote que ficou com o
     marcador, `aplicar` devolvia `null` e a ponte servia a página nua: medido ao vivo, a porta com
     0 barra e 0 coluna, a listagem ao lado com as duas. `nav.enquadrar` cobre as três formas
     (barra existente, marcador, documento sem moldura) e é **idempotente**; a ponte
     (`comAparencia`) usa-o em toda resposta HTML e a montagem (`montar-publicacao.js`) enquadra a
     porta ao publicar. **DECIDIDO e implementado** 05/11/2026.
112. **OS TRÊS FORMULÁRIOS SÃO MOLDURA, E NÃO CONTEÚDO.** «Anamnese do aluno», «Plano de ensino» e
     «Plano de Observação» entram no menu de TODA escola, inclusive na recém-criada, sem turma
     nenhuma (era `if (turmas.length)`): a anamnese é o instrumento de ENTRADA (vem antes de haver
     turma) e o plano de ensino é o que CRIA o ciclo. O que continua dinâmico é o resto — «Aulas» e
     os documentos do ciclo nascem com o ciclo. **DECIDIDO e implementado** 05/11/2026.
113. **UMA BANCADA QUE CONSTRÓI O QUE DEVIA ENCONTRAR NÃO MEDE NADA.** A `provar-menu-do-formulario`
     media as telas de formulário aplicando o menu à mão (o mesmo `aplicar` da ponte) e dava 40/40
     sobre uma página sem moldura em produção. Passou a servir a porta pela ponte
     (`producao.fetch`). A regra: **quem aplica a moldura é quem serve, e é isso que se mede**.
     **DECIDIDO e implementado** 05/11/2026.
114. **A RELAÇÃO PE → PO É DO SERVIDOR, E NÃO DO MENU.** O menu suspenso com os ciclos que têm plano
     (`GET /api/ciclos` → `comPlano`) é conveniência; a REGRA — «o PO só nasce sobre um plano
     existente e do mesmo ciclo» — passou a ser imposta em `POST /api/elicitar`
     (`recusaDaRelacaoDoCiclo`), antes de qualquer gravação: (1) o plano declarado existe;
     (2) o ciclo do PO é o ciclo do plano; (3) sem plano declarado, o ciclo tem de ter plano. E a
     sequência estrita do plano: um plano novo só é do PRÓXIMO ciclo ou de um ciclo que já existe
     — a edição e o elo novo continuam um ciclo, e o `id` só isenta se o documento existir.
     Medido antes: os dois casos davam **200**. Sem leitor do acervo a rota SEGUE (não acusa o
     professor por uma limitação de quem mede), e a simulação passa. **DECIDIDO e implementado**
     05/11/2026.
115. **APAGAR UM REGISTO LEVA O CICLO QUE ELE PRODUZIU — EM CASCATA, E SÓ O DELE.** O `DELETE` do PO
     apagava o **envelope** e mais nada: o pacote do ciclo (o `index.html` que o menu lista, o
     plano, a aula, o lançamento, a captura, os PDF, as referências), o `.conf` da variante e as
     âncoras ficavam inteiros, e a cadeia devolvia o elo anterior à lista — «não sumiu». A cascata
     é a rotina da Produção (`apagarCicloDoRepo`, guarda do último ciclo), agora ligada ao gesto da
     listagem, com a **ordem** como garantia: cascata primeiro (se recusa, nada é apagado), os
     envelopes dos POs do ciclo pelo acervo depois (modo `soOProduto`, porque o `.indice.json` tem
     um dono só), e o envelope pedido por último. A anamnese e o plano de ensino não vão atrás — o
     plano fica **livre**. Sem repositório, o envelope sai e a resposta **diz** que o ciclo ficou.
     A sequência é da TURMA (a variante): dois ciclos de variantes diferentes são sequências
     independentes. **DECIDIDO e implementado** 05/11/2026.
116. **O «PONTO DE EXCLAMAÇÃO» NO ACTIONS NÃO ERA FALHA.** Apagar um registo não é um workflow: é
     um commit que o Worker faz pela API. O que aparece com o título do commit é o `Regerar os
     índices`, e o estado é **cancelado** — o commit de índice que ele próprio produz dispara uma
     execução nova, e o `concurrency: cancel-in-progress: true` cancela a anterior. A derivação é
     idempotente e sem estado, e o estado final converge (verificado no remoto: os envelopes
     saíram e o índice ficou sem eles). **Não se muda** o workflow: mudar um mecanismo justificado
     para o ícone ficar verde é tratar o sintoma. **CONFIRMADO** 05/11/2026.

117. **O MAPA DE RELAÇÕES É POR CICLO, E NÃO NOMEIA ALUNA.** `tools/gerar-relacoes.js` escreve
     `indices/relacoes/<prof>/<NN>-<variante>.json` — a lista de arestas `{de, para, tipo, chave}`
     que estava implícita nos nomes de ficheiro e de campo. **DECIDIDO** 05/11/2026, nas palavras
     dela: «*agora, pequeno e derivado — uma aresta descoberta tarde é uma ligação que ninguém
     testou, e o custo é um gerador, não um serviço*», e «*por ciclo*». Três regras que o gerador
     obedece, e que não se negociam depois: (a) **cada aresta nomeia em `chave` o campo que a
     produziu** — uma aresta sem origem é opinião guardada em JSON; (b) **o mapa não leva conteúdo**,
     e o bloco cifrado da anamnese nem aparece; (c) **nenhum nome de aluna entra no mapa** — o
     elenco não é uma relação, é conteúdo da linha de base, e a pessoa entra na cadeia pela anamnese
     (carimbo `anamnese-AAAAMMDD-HHMM`), que não diz de quem é. A regra (c) não é preferência: é a
     verificação 7 do `check-indices`, e a primeira versão do gerador reprovou-a. **CONFIRMADO**
     pelo `check-indices` — as 16 verificações passam. *(A prova `experimentos/provar-relacoes.js`,
     que aqui se citava com **35 asserções**, foi **apagada a 20/11/2026** por decisão da
     proprietária: as secções A–F mediam um ciclo da escola `calango`, expurgada e que **não será
     regenerada**. A funcionalidade não ficou sem guarda — o `check-indices` continua a correr no
     `pre-commit` e a regra (c) é uma das suas verificações.)*

118. **O LANÇAMENTO DA AULA GRAVA NA FONTE, E A FONTE VAI EM CLARO.** A chave é
     `lancamento/<escola>/<professor>/<ciclo>-<carimbo>/<nome>` e o destino é o `-dados.json`
     canónico (`motor/servidor/acervo-lancamentos.js`), não o KV. **DECIDIDO** 06/11/2026, depois
     de o relato dela mostrar o defeito: a aula «lançada» desaparecia ao recarregar porque o KV
     **não é lido por nada** — tudo o que o sistema mostra deriva do repositório. Quatro regras que
     não se negociam depois: (a) **a fonte vai em claro, e a cópia do pacote vai cifrada no mesmo
     acto** — `ler_lancadas()` lê `aulas` do ficheiro, e um `_cifrado` não tem `aulas`; o Worker
     escreve o `-dados.cifrado.json` que o gerador só copia (sem a cópia em dia, o
     `check-pacote` reprova e a aula não chega ao site);
     (b) **a gravação funde por aula** — o cliente manda o ficheiro inteiro, e um separador velho
     apagaria as aulas lançadas depois dele; e **a que chega só vence se o carimbo for mais novo**,
     porque o resgate do KV traz a versão antiga de uma aula já relançada;
     (c) **a gravação dispara a geração** — o site serve o
     pacote, e o pacote só muda quando ela corre; (d) **o `depois` não derruba o lançamento** — o
     que está gravado fica gravado, e a resposta diz o que falta. A variante que o disparo leva é a
     **declarada** (a que vem inteira no nome do ficheiro de dados), não a composta de
     `escola + turma` — o lançamento não traz turma, e sem esta regra o pedido pedia o
     `.conf`-esqueleto da escola e a geração morria. **CONFIRMADO** por
     `experimentos/provar-familia-do-lancamento.js` (**44 asserções**, contraprova **6 de 44**).

119. **O BLOCO 10 SAI DO PLANO DE ENSINO; O CORPO MORA NA AUDIÇÃO E NO PO.** «Aspecto físico — o
     corpo» (`linha-de-base-alvo` e `aspecto-fisico`) deixou de se perguntar no plano, e com ele
     saiu do documento derivado a secção «## Aspecto físico — força e flexibilidade». Os blocos
     foram **renumerados 1..11, sem falhas**. **DECIDIDO** 07/11/2026, por decisão dela: as duas
     informações já estão onde se decide sobre elas — a linha de base do corpo na **Audição/Elenco**
     e as particularidades na **observação**. O plano perguntava duas vezes o que já sabia. Três
     regras que não se negociam depois: (a) **a chave não é apagada da memória** — um envelope já
     gravado com `aspecto-fisico` continua a alimentar o eixo do Corpo da **Aula 01** (o que deixa
     de a imprimir é o plano derivado, e é a decisão), e o `MAPA_SECOES` do validador mantém o
     alias «aspecto físico» → `aspectoFisico` **com o motivo escrito**, porque um documento antigo
     tem de continuar a extrair as suas secções; (b) **a derivação não perde a fonte** — o eixo do
     Corpo lê `aspecto-fisico` **quando existe** e cai no `recorte` da linha de base quando não,
     que é o caso de todos os planos novos; (c) **o endereço da resposta muda de forma inofensiva**
     — `endereco` é `blocos[N].campo` mas as respostas são chaveadas pelo `id` do campo, e por isso
     a renumeração não toca em dado guardado. A prova é `provar-corpo-da-linha-de-base` (**30
     asserções**), `provar-linha-de-base` (**102**) e `provar-plano-completo` (**18**) — verdes, com
     o plano derivado a validar contra o `ciclo-01-plano-schema.json` e a âncora de proveniência
     intacta (`hash-ciclo --check`). **Fica por fazer, e sabe-se:** a secção removida era a única
     que apontava para a **Aula 01** no que toca ao corpo, e o link não foi reposto noutro sítio.

120. **O VÍNCULO DA ANAMNESE LÊ O ELENCO — E NÃO SÓ O `sujeitos` DO PO.** O cadeado que impede
     editar e apagar o registo de uma aluna em observação derivava de `po.sujeitos`, a cópia do dia
     em que o PO foi gravado. Quando o elenco cresce depois, a cópia fica para trás — e a aluna que
     entrou passa a estar a ser observada por um documento que a lista, com a etiqueta a dizer
     «livre» e as rotas de escrita a aceitarem o gesto. **CONFIRMADO** na `batata` (08/11/2026): o
     `po-…-2211`, de 22:11, declara `[Aluna A]`; a linha de base `tami` de 01:05 tem `[Aluna A,
     Aluna B]`; o `## Sujeitos` do documento e a §6 da Aula já listam as duas, e a anamnese da
     Aluna B respondia `200` ao `PUT` e ao `DELETE`. **DECIDIDO** 08/11/2026: a aluna está vinculada
     quando o **elenco da turma que o PO observa** a inclui — a linha de base manda, e o `sujeitos`
     é a herança (é a mesma regra do §5.20/§5.21, aplicada ao terceiro consumidor do facto) —, e as
     duas fontes **somam-se**, porque quem saiu do elenco foi observada e um cadeado que se abre
     quando uma das fontes esquece um nome não é cadeado. A mesma leitura decide **substituir vs
     empilhar** na gravação: sem ela, o «Guardar» de uma anamnese nova da Aluna B **sobrescrevia** o
     registo dela — o único caminho desta família que apaga em vez de acrescentar. Sem leitor de
     linha de base a derivação degrada para o `sujeitos`, sem inventar vínculo. Prova:
     `provar-vinculo-do-elenco` (**26**, com os envelopes e a linha de base reais; **15 falham** no
     núcleo de `HEAD`). **O que fica por fazer, e sabe-se:** o `sujeitos` do PO **continua** a ser o
     do dia em que foi gravado — não se re-semeia (re-semeá-lo inscreveria no documento de ontem uma
     turma que mudou hoje), e por isso o PO vive com as duas fontes a concordar por derivação, não
     por cópia.

121. **A ALUNA QUE SAI DO ELENCO SAI DA AULA — E O QUE ELA JÁ LANÇOU NÃO SE PERDE.** A cascata de
     revalidação (`linha-de-base → curadoria → plano-de-ensino → plano-de-observacao`) **já existia**
     para a remoção, e é o mesmo caminho da inclusão com o sinal trocado. **CONFIRMADO** no núcleo
     (`porta.revalidacaoPendente`), e é o que a tela dela mostra. O que **não** existia era a
     integridade do derivado: `derivarDados` escrevia `aulas: {}` em **toda** a geração, e a geração
     é disparada pelo «Guardar» do PO — exactamente o gesto que a cascata exige. Remover uma aluna e
     regravar o PO **apagava as aulas lançadas** da fonte `-dados.json`; elas sobreviviam apenas no
     elo de `historico/`, que ninguém lê. E o formulário oferecia `dados.apelidos` — o mapa de
     **nomes** — como se fosse a lista de quem marcar: sem a aluna que saiu, os relatórios das aulas
     antigas imprimiriam `aluna_a` no lugar do apelido. **DECIDIDO** 08/11/2026: três campos, três
     sentidos — `elenco` é quem a turma observa **agora** (o que se oferece), `apelidos` é o mapa de
     hoje **mais** o de quem aparece numa aula lançada, e `aulas` é **preservado** na geração (um
     derivado não reescreve o material; a fonte e a cópia cifrada passam a sair do **mesmo** texto).
     Numa aula já lançada a lista é a **daquela** aula (elenco + quem ela registou); sem `elenco` — um
     ficheiro de antes desta regra — vale o mapa inteiro. A anamnese de quem saiu continua
     **vinculada**: o cadeado não se abre só porque a turma mudou. Prova:
     `provar-remocao-do-elenco` (**26**, com um `-dados.json` semeado e o formulário num Chrome;
     **10 falham** no `HEAD`). **O que fica por fazer, e sabe-se:** o `sujeitos` do PO antigo não se
     reescreve — o elo novo acrescenta, não corrige; e a remoção **com aulas lançadas** ainda não tem
     dado real neste repositório (o ciclo da `tami` está em `aula 01`, sem lançamento).

122. **O «GUARDAR» CABE NOS 50 SUBPEDIDOS — E NÃO SE COMECE O QUE NÃO CABE.** O Cloudflare conta cada
     `fetch` do Worker como subpedido e corta em **50 por invocação** no plano gratuito; o
     `limits.subrequests` do wrangler só sobe numa conta paga, portanto o limite **não se configura**.
     **CONFIRMADO** em 08/11/2026: o «Guardar» do PO respondeu «Too many subrequests by single Worker
     invocation», o envelope e o `-po.md` entraram e as fontes do ciclo não — o pacote ficou com o
     `-po.md` de `po-…-0956` e o `-dados.json` de `po-…-2211`. **Medido** com um contador e as fontes
     reais: **26 subpedidos só no escritor**, dos quais 7 eram um `POST /git/blobs` por arquivo e 3
     eram um `GET` por nome de elo. **DECIDIDO**: (1) o custo desce — o conteúdo viaja na entrada da
     árvore (zero blobs) e a colisão do elo pergunta-se à pasta uma vez: **16**; (2) o orçamento é
     **um só por pedido, contado**, e o mesmo `fetch` contado serve todos os escritores e o acervo
     (um contador por módulo é o que faz cada um julgar-se dentro do limite enquanto o conjunto já o
     passou); (3) **não cabe, não se começa** — o escritor recusa antes do primeiro subpedido e a
     rota consulta a previsão antes do `-po.md`, para a cadeia ser atómica; e (4) a porta ganha o
     **véu da operação** (`.veu`), que cobre, põe o conteúdo `inert` e diz o passo até a geração
     terminar — o `disabled` no botão não bastava, porque a lista e o menu são caminhos para o mesmo
     repositório. No CI, o pacote do ciclo passa a ser **derivado para o `gerar-ciclo.yml`**: o
     conflito nos PDFs resolve-se regerando, não escolhendo. Prova: `provar-orcamento-do-guardar`
     (**16**; **8 de 16** no `HEAD`) e `provar-trava-da-operacao` (**19**, num Chrome; **2 de 19** no
     `HEAD`). **O que fica por fazer, e sabe-se:** a tranca é da porta — os passos da Produção
     (criar a aluna, elenco, turma) têm as suas telas e não passaram por aqui; e o pacote da
     `batata-sala-rosa` foi destravado re-derivando a fonte do PO 0956 com o elenco **em vigor
     quando ele foi gravado** (A,B) — a cópia cifrada só o Worker a refaz, e a Aluna C entra nos
     documentos no próximo «Guardar», que é o que a revalidação pendente já pede.
123. **A AULA QUE JÁ FOI DADA NÃO SE REESCREVE POR UMA REGENERAÇÃO.** Ela: «regenerar o ciclo afecta
     só a aula que ainda não foi dada; as outras ficam e não se apagam». **CONFIRMADO** que a regra não
     existia: o `-aula-01.md` e a `-captura-aula-01.md` estavam escritos à mão na lista do
     `escrever-ciclo.js`, sem condição — e o «Guardar» do PO, que é o gesto da cascata do elenco,
     regera o ciclo inteiro. Corrigir o elenco hoje reescrevia o plano de uma aula que já aconteceu,
     mandava a versão verdadeira para `historico/` e fazia o diff de proveniência apresentar como
     mudança do professor uma mudança que ele não fez. **DECIDIDO**: o facto que tranca uma aula é o
     **registro do lançamento** (`aulas[NN]` no `-dados.json`), e não o juízo `planejada`/`dada` — um
     derivador não tem relógio; a regra vive num sítio só (`motor/nucleo/aulas-do-ciclo.js`) e serve
     os dois caminhos que regeram um ciclo (o Worker e `tools/regerar-derivados.js`); ela faz três
     coisas — não reescreve, não inventa elo, não apaga (o `DOCS` passou a só crescer) —, e a excepção
     é uma reparação: fonte ausente de aula lançada reconstrói-se, e o relatório diz `reparadas`.
     Prova: `provar-aula-dada` **34/34**; com a regra desligada caem **10**. Ver `ARQUITETURA-AULA.md`
     §1.3 e a entrada de 21/11/2026 no `REGISTRO.md`.
124. **O DERIVADOR ESCREVE A AULA QUE LHE PEDEM — E A LACUNA DE UMA AULA NÃO SE HERDA DA OUTRA.**
     `derivarAula01` escrevia `aula: "01"`, «Plano para a Aula 01», lia as chaves `aula-1-*` à mão
     e a §8 mandava sempre para a Aula 02 — na Aula 03, para trás. **DECIDIDO**: `derivarAula({nn})`,
     com `derivarAula01` como o caso `nn = '01'` (um derivador só: duas derivações da mesma regra
     divergem ao primeiro caso novo); o número decide o cabeçalho, o título, o objetivo (o **marco
     NN**, Regra 2), o parâmetro (`aula-<N>-parametro`), a sequência (`aula-<N>-sequencia`) e o
     «próximo passo»; o que é do **ciclo** — duração, volume, blocos, condições do espaço, guia de
     observação, proveniência, auditoria — **não** entra no número, porque repeti-lo por aula daria a
     cada documento uma cópia da resposta com a possibilidade de divergirem; a chave leva o número
     **sem zero à frente**, que é a forma que o envelope já tem (renomeá-la renomearia a resposta de
     todos os planos gravados); e a **lacuna não se herda** — pedida a Aula 04 de um plano de três
     marcos, o documento declara a lacuna e **nomeia a chave que falta**, sem copiar a sequência nem
     a matriz da Aula 01, porque herdar atribuiria a esta aula o que foi respondido para outra (quem
     reusa é o formulário, com a pessoa a confirmar). Os dois caminhos — o Worker e o
     `regerar-derivados.js` — passam a escrever **todas** as aulas que o `DOCS` declara, e não o par
     escrito à mão da Aula 01. Prova: `provar-derivador-da-aula` **35/35** (mutação: **21/35**), e a
     `-aula-01.md`/`-captura-aula-01.md` da `breu-rosa` derivadas pelo código do `HEAD` e pelo de
     agora, com os mesmos argumentos, saem **idênticas**. Ver `ARQUITETURA-AULA.md` §4.3 e a entrada
     de 21/11/2026 no `REGISTRO.md`.
125. **A AULA NASCE DO CALENDÁRIO, E A REGRA QUE A FAZ EXISTIR É DERIVADA DO PLANO.** A quinta coluna
     do calendário do plano («Criar a aula») tem o botão para a aula que ainda não tem documento e a
     ligação para a que tem; o número vai em **dois dígitos** (`02`), e a lista das aulas vem do
     `DOCS` do manifesto. **DECIDIDO**: a aula existe **quando o plano declara a sequência dela**
     (`aula-N-sequencia`) — derivada do dado, e não pedida a ninguém, porque um clique que criasse a
     aula e esquecesse a lista deixaria o documento por publicar sem erro nenhum; a regra vive numa
     função só (`aulasDeclaradasPeloPlano`) e serve o manifesto do plano, a lista de fontes a derivar
     e o `DOCS` do ciclo; e o gesto manda gravar por `POST /api/elicitar` com o plano anterior como
     `ajuste_de`, sem rota nova, sem escritor novo e sem segunda cópia da cadeia. A **sequência é o
     cruzamento** entre os blocos onde o objetivo acontece e os exercícios que o trabalham — o modelo
     que o plano já tem —, e o diálogo **não** pede duração, volume, bloco da aula nem régua: são do
     ciclo. A data **não é copiada** para o botão: o script lê-a da linha da tabela, que é a única
     que a calcula. `?criar-aula=02` abre a caixa pelo endereço. Prova: `provar-criar-aula`
     **38/38** (mutação: **30/38**), com a secção F a abrir a página num Chrome. Ver
     `ARQUITETURA-AULA.md` §4.4 e a entrada de 21/11/2026 no `REGISTRO.md`.
126. **A COLUNA NOMEIA O QUE ENTREGA — E O ENDEREÇO É O DO EXERCÍCIO, NÃO O DA AULA.** A coluna do
     calendário passou a chamar-se **«Ação»** (era «Criar a aula») e a coluna da tabela dos objetivos,
     **«Exercício»** (era «Aula»). A razão não é de gosto: uma coluna chamada «Aula» que entregasse
     um exercício mentiria **no cabeçalho**, e foi isso que aconteceu — as duas linhas do objetivo 01,
     Solo e Barra, levavam ao **mesmo** `#exercicios-da-aula-01`, e o professor que queria o de Barra
     tinha de o procurar sozinho. **DECIDIDO**: a célula nomeia o exercício e liga à **âncora dele**
     (`aula-01.html#solo-plie-ob1`); a âncora é **declarada no título do exercício** por `idDoExercicio`
     e **lida da fonte** — nunca reconstruída por uma segunda cópia da regra do slug —, e leva o
     número do objetivo porque o mesmo exercício serve o 01 e o 03 (sem ele, `normalizar-ids.py`
     deduplicava por posição, e ninguém prevê a posição de fora). O documento sozinho, sem o índice
     dos exercícios, diz **«—»** e não inventa nome; a aula que ainda não nasceu diz «a criar na Aula
     NN». O «Abrir» do calendário passou a **botão** com a estética do «Criar aula», que é o que ela
     pediu. Prova: `provar-objetivos-por-aula` **55/55** e `provar-criar-aula` **39/39**.
127. **O CLIENTE FALA COM A PORTA DEBAIXO DO PREFIXO DELA — E A JANELA USA AS PEÇAS DA FOLHA.** O
     «Guardar e gerar» respondia **404** e a página dizia `unexpected end of JSON input`, que é o que
     se lê quando se faz `JSON.parse` do corpo vazio de um 404. **CONFIRMADO**: em produção só uma
     **lista explícita** de `/api/*` é encaminhada para o motor (`motor/servidor/producao.js`), e as
     rotas da porta vivem debaixo dos prefixos dela (`/plano-ensino/`, `/plano-observacao/`,
     `/anamnese/`). O cliente pedia `api/envelope/…` na raiz; passou a `/plano-ensino/api/envelope/…`.
     A janela do «Criar aula» era um `<dialog>` próprio com `<style>` **inventado dentro da página
     gerada**, e passou a usar `.modal`/`.modal-fundo`/`.modal-caixa`/`.modal-acoes`/`.modal-x` e as
     pílulas `.escolhas`/`.escolha`. E a **ordem dos botões** — «o botão cancelar ele fica do lado
     direito» — estava escrita **ao contrário** em `IDENTIDADE-VISUAL.md`, com uma `provar` a fixar a
     ordem errada: corrigiu-se a folha (com nota de correção datada), as duas janelas do painel
     (`bastidores.js`, `painel-html.js`) e a asserção, porque **uma prova que congela a ordem errada
     guarda o erro em vez de o apanhar**. Ver `REGISTRO.md` (21/11/2026).
128. **O CONTEÚDO DECLARA A FAMÍLIA DA AULA; O NÚMERO É DADO.** A elicitação só guarda as respostas
     cujo `id` o **conteúdo** declara, e o conteúdo do plano declara **uma** aula — o bloco «A Aula
     1». Por isso `aula-2-parametro` e `aula-2-sequencia` eram **descartadas em silêncio**: o
     envelope era gravado, a tela dizia «gravado — a aula 02 está a ser gerada», e a aula não
     existia em lugar nenhum (medido: `plano-20261121-0933`). **DECIDIDO**: o `id` de uma resposta
     da aula casa a **família** `aula-N-<parametro|sequencia|objetivo>` (`lerChaveDaAula`), e o
     número é dado; o tecto é o `contexto-total-aulas` do próprio plano, e o que ficar de fora
     continua a ser **relatado** como desconhecido — o silêncio é que não pode voltar. A família só
     abre para o **plano**: é o único documento com aulas por número. **E a tela passou a
     conferir**: ela lê `idsDesconhecidos` antes de dizer «criada», porque o servidor já o dizia e
     ninguém o lia.
129. **O BOTÃO DIZ O GESTO, O VÉU DIZ O PROCESSO, E O «CANCELAR» VIRA «FECHAR».** «Criar e gerar»
     dizia duas coisas e nenhuma delas era uma escolha do professor: gerar é o que o sistema faz a
     seguir. O botão passou a **«Criar»**. Enquanto a escrita corre, acende-se o **véu da casa**
     (`.veu-de-operacao` + `LastroDaOperacao.ocupar`), com o texto do processo — «é o mesmo véu em
     todos os gestos», e não um segundo. Depois de o pedido partir, o botão de criar fica
     desabilitado e o outro muda de nome para **«Fechar»**: «não dá para ser cancelar porque parece
     que vai cancelar o processo». A janela fecha-se sozinha quando a resposta chega, e o desfecho
     fica no véu uns segundos.

130. **A REGRA QUE CRESCE O `DOCS` É UMA SÓ — E ELA ESTAVA EM TRÊS CÓPIAS, DAS QUAIS UMA NÃO
     CRESCIA.** A Aula 02 foi criada, o envelope ficou com `aula-2-parametro` e
     `aula-2-sequencia`, e o manifesto continuou a declarar uma aula: com a turma no contexto, a
     escrita passa por `comporManifestoDaTurma`, e esse caminho **preservava** o `DOCS`. Os outros
     dois cresciam — um deles com a conta escrita à mão. **DECIDIDO**: `docsComAsAulas(docs, plano)`
     em `motor/nucleo/aulas-do-ciclo.js`, chamada pelos **três** caminhos; a lista **só cresce**,
     nunca perde uma entrada, e a família é reposta **em ordem numérica** (`aula-01`,
     `captura-aula-01`, `aula-02`, `captura-aula-02`), porque inserir «antes da primeira captura»
     dava `aula-01 aula-02 captura-aula-02 captura-aula-01` — funcional e ilegível. Uma aula fora
     do `contexto-total-aulas` não entra. Ver `REGISTRO.md` (21/11/2026).
131. **TODA LISTAGEM NASCE COM A PAGINAÇÃO — E O RODAPÉ SÓ APARECE A PARTIR DE DUAS PÁGINAS.**
     Palavras dela: «o ciclo e os planos já nascem com a paginação. A anamnese também tem que
     nascer com paginação, plano de ensino também, plano de observação também, as aulas também e as
     aulas dadas também.» A peça é **uma** (`.paginas`, `data-paginar`, o cliente `paginar()` do
     núcleo), o número é **um** (25), e as quatro listas que não a tinham passaram a tê-la:
     `/ciclos/planos/` e as três da Área do Professor — que são **um chamador só**, e é por isso
     que a regra não pode valer numa e faltar noutra. **A regra do aparecimento é a da folha**: o
     rodapé nasce `hidden` e o cliente acende-o a partir de **duas** páginas; com 15 aulas e 25 por
     página ele **não aparece**, e isso é o desenho, não a falha. O calendário do plano **não**
     pagina: é tabela de documento, e o documento imprime-se inteiro.

132. **A FONTE DO PROJETO É A OPEN SANS, E É ENTREGUE PELO PACOTE.** Palavras dela: «a gente não vai
     usar a Georgia […] a nossa fonte ela é a Open Sans. Essa fonte é para usar como padrão no site
     todo.» Declarar a família não é escolher a fonte: sem `@font-face` e sem o ficheiro, ela só
     aparece em quem já a tem instalada — e não são todos. Os dois `.woff2` (variáveis: um ficheiro
     desenha do 300 ao 800) moram em `tools/templates/fontes/`, **sob SIL OFL 1.1** com o texto da
     licença ao lado, e viajam com a folha para `assets/fontes/` das **três** superfícies — pacote,
     raiz e pacote zero — porque é ao lado da folha que o `@font-face` os procura. **Não é uma CDN**:
     as páginas abrem-se do disco, sem rede, e imprimem-se de lá. O **fallback deixou de ser Georgia**
     e passou a ser uma sans do sistema: erra a favor de não parecer a fonte que não é. O nome
     `--serif` fica (nomeia o papel, e não o desenho) e a `--ui` não muda. **O PDF do ciclo não
     segue** — um `.woff2` não serve ao `pdflatex`. **DECIDIDO** 21/11/2026.

137. **A LISTAGEM DA ANAMNESE, NO DOCUMENTO DA AULA, DIZ QUEM A FEZ E QUANDO.** Palavras dela:
     «tem que dizer aqui nessa listagem, ao lado do nome da aluna, quem é o que fez a anamnese e a
     data em que essa anamnese foi feita. A gente já tem isso nos arquivos de chave e valor, então é
     fácil colocar aqui.» Tem: o AUTOR é o `professor` do envelope da anamnese — quem a respondeu, e
     não quem dirige a sala —, e a DATA sai do CARIMBO, que é o nome do próprio ficheiro. O
     documento passa a dizer «Aluna B · por bom-bom em 19/11/2026», e isso é um facto do acervo: as
     duas anamneses desta turma foram feitas por professores diferentes. Sem autor declarado (os
     envelopes anteriores ao campo), a frase fica só com a data — não se inventa um nome.
     **DECIDIDO** 22/11/2026.

135. **O PLANO DE OBSERVAÇÃO MOSTRA AS DIMENSÕES, E SÓ ELAS; O VALOR LIDO É DA AULA.** Palavras
     dela: «Eu não espero que os resultados estejam aqui no plano de observação, tá? O plano de
     observação é exatamente o que está aqui. Não precisa ter isso. E essa parte que você colocou,
     "sem leitura neste elenco", esses elementos aqui você tem que tirar. Esse monte de texto que
     você incluiu aqui também você tem que tirar.» O painel do Corpo volta a desenhar os grupos e os
     aspectos, sem valor, sem nota e sem recado — o que eu tinha posto ali (nível, apoio, nota e o
     caminho de outro ecrã) sai. **O que se observa é a coluna da AULA**: é lá que a frase «1 de 2
     em «Bom» (com toque) · 1 de 2 em «precisa desenvolver» (por consciência própria)» tem de
     aparecer, e o PO é o CAMINHO que diz quais aspectos observar. **DECIDIDO** 21/11/2026.

136. **E A LEITURA NÃO APARECIA POR UM DEFEITO MEDIDO, NÃO POR FALTA DE GESTO.** Ela fez o passo
     («fiz exatamente o que você descreve ali, mas não surtiu efeito») e o acto do elenco continuou
     sem `leitura`. A causa são duas linhas que se somavam: (a) `estadosDasAnamneses` marca como
     vigente UMA anamnese por PESSOA (`alunaId`), e o envelope antigo, sem id, conta como outra
     pessoa — no `breu`, «Aluna A» tem dois envelopes, um de 16/11 sem id e um de 18/11 com
     `aluna-a-3`. A leitura de «Aluna A, Aluna B» devolvia `alunas: [A, B, A, B]`, medido ao vivo;
     (b) o «Gravar/Concluir» compara essa lista com a do elenco por `map(String).sort()` — ordenada,
     não um conjunto —, não batia, e **deitava a leitura fora em silêncio**. Consertado: uma
     anamnese por apelido (a mais recente) e comparação por conjunto. **DECIDIDO** 21/11/2026.

134. **A LEITURA DAS ANAMNESES É UM BOTÃO, E O ELENCO POR LER DIZ-SE EM TRÊS SÍTIOS.** Palavras
     dela: «eu entendi que eu tenho que ir em bastidores, pedagogia, audição, derivar o elenco e
     mandar gravar de novo […] o fato de eu ter mexido lá em elenco não gerou os valores que você
     disse que ia gerar […] seu texto não é claro pensando no ponto de vista de um professor.» Ela
     tinha razão nas duas coisas: a frase do painel mandava-a «fazer o passo 3 da linha de base do
     Corpo», que não é um sítio que se possa procurar, e **derivar o elenco e gerar o plano não
     fazem a leitura** — quem a faz é o botão **«Ler as anamneses»**, no passo 3 «Anamneses» da aba
     «Escolha de elenco» (Bastidores → Pedagogia → Audição). O acto do elenco confirma-o: o
     `tami--20261118-1807` é o último com `leitura`; no `--1908` o elenco ficou com `alunas: []` e a
     leitura caiu — e as nove versões seguintes, incluindo a de 21/11 que ela acabou de gravar,
     levaram `lida` (a proveniência dos carimbos, que sobrevive a tudo) e **nenhuma** `leitura`.
     Daí o «sem registo na anamnese» no meio do plano de observação, que ela leu — e leu bem — como
     mentira sobre o dado dela. **DECIDIDO** 21/11/2026: a falta da leitura passa a ser dita nos
     três sítios onde ela a pode encontrar (a frase do painel, com o nome do botão; o «!» do cartão
     do elenco, com a dica do caminho; a resposta do «Concluir»), e uma anamnese que a chave não
     abre deixa de se chamar «não há anamnese registada».

133. **«O QUE SE OBSERVA» É O QUE A ANAMNESE REGISTOU — NÍVEL, APOIO E NOTA.** Palavras dela: «não
     mostra os valores lidos de cada um, e é exatamente isso que a gente tem que ter lá […] tem
     algumas medições que têm duas etapas, tem que pegar as duas etapas quando elas existirem» e,
     na mesma mensagem, «se ele tomou nota de alguma coisa, essa anotação dele também tem que
     aparecer […] são todos os campos da anamnese que o professor usou». O NÍVEL e o APOIO são as
     duas etapas, e já vinham na frase que o passo 3 grava («1 de 1 em «Bom» (por consciência
     própria)»); a NOTA existe no registo da resposta desde a primeira elicitação e era **lida e
     deitada fora**. As três coisas passam a atravessar a leitura (`classificar` → `mostra`), o
     painel do Corpo e o documento da aula. O RECORTE É DO CORPO: os aspectos de musicalidade que
     o professor mediu e que ficaram fora do recorte viajam em `mostraCompleta`, e é dela que o
     eixo **Poiesis** da aula os lê. Um aspecto com nota e sem nível **não** é «sem registo» — foi
     observado, e entra em «o que precisa de ser trabalhado». **DECIDIDO** 21/11/2026.

138. **O EXPURGO TEM UM CONFERIDOR, E «SUMIU TUDO» DEIXOU DE SER UMA AFIRMAÇÃO.** Palavras dela:
     «Eu vou expurgar essa escola e vou recomeçar os testes dela. Eu preciso saber também se o
     expurgo está correto, já está validado, já atende sumir com todas as escolas, com tudo […]
     Se os resíduos que nós movemos não vão ficar de novo como resíduo.» A resposta não podia ser
     «sim»: o expurgo tem **duas metades** e só uma delas é medível daqui. A do **repositório**
     passou a ser medida por `escola/conferir-expurgo.js` — só leitura, sem rede, que usa o
     **mesmo** `escolaDosCaminhos` do expurgo (a autoridade sobre o que uma escola possui) e diz,
     por família: quantos arquivos ainda seriam apagados, o que fica **com a razão declarada**, e
     qualquer **resíduo sem razão** (✗). A do **KV/Cloudflare** não se mede sem o token, e a
     autoridade lá é o relatório da página, que confere **por leitura de cada chave** e oferece
     «Terminar a limpeza do KV», gravando a pendência no elo. Medido a 22/11/2026: `batata`,
     `calango` e `duo` com **0 arquivos**, último acto = expurgo, **nenhum resíduo sem razão**, e a
     criação do nome **livre**; `breu` **viva**, com 266 arquivos. **O que fica, fica por uma de
     três razões, e as três são do desenho**: o **elo** (`escola/<slug>/indice.json` — a
     proveniência acrescenta, não edita), a **fixture** (`teste/<slug>.json` — dados sintéticos,
     ligados à *palavra* do nome, não a dado de ninguém) e o **índice derivado** (`indices/**` — é
     saída, e o `orfaosNoDisco` apaga o que já não corresponde). **DECIDIDO** 22/11/2026.

139. **O NOME DA TURMA É ESCOLHA DE QUEM A CRIA — O SISTEMA NÃO O LIMITA, E EU TINHA DITO QUE
     SIM.** Palavras dela, ao ler o meu aviso de que a `breu` recriada precisaria de «outro nome de
     turma»: «não pode ser assim. não tem-se controle sobre as turmas que uma escola quer adotar.»
     Está certo, e a frase era **minha**, não do código. Medido: o `criar-escola.sh` recusa pela
     variante (`ciclo-NN-<escola>.conf`), pelo pacote da escola (`ciclo-NN-<escola>/`) e pelo
     wrangler — um `ciclo-NN-<escola>-<turma>/` não está em nenhuma das três; o `gerar-ciclo.sh`
     escreve por cima (`mkdir -p`) e nunca pergunta se a pasta existe; e a **única** recusa por nome
     de turma é `turmaVigentePorNome` — duas salas **vivas** com o mesmo nome na **mesma** escola,
     que é «esta sala já existe, abra-a em Editar». O pacote da turma é **artefacto da escola** (o
     slug está no caminho, e o `escolaDosCaminhos` apanha-o): o expurgo leva-o, e se algum sobreviver
     a um expurgo incompleto a geração escreve por cima. **O que pode morder é outra coisa**: com o
     KV por limpar, a sala velha **existe** — e aí `POST /turma` responde «já existe uma sala com o
     nome «Rosa»», o que é verdade. O remédio é **terminar o expurgo** («Terminar a limpeza do KV»),
     nunca renomear a turma. **DECIDIDO** 22/11/2026.

140. **A RÉGUA DA TURMA É UMA SÓ — E O CORPO DA FOLHA DE LANÇAMENTO TAMBÉM MEDE POR ELA.** Palavras
     dela: «Nós temos duas matrizes, está errado isso. A régua da turma é só uma, não pode ser
     duas, não pode ser duas matrizes para essa régua. Então a parte do corpo eu acho que está com
     uma régua que ela está chumbada no código. Ela é OK, parcial, não aconteceu e não vi. Está
     errado isso. Tem que ser a régua que foi definida lá pelo professor em bastidores […] Então já
     tem que nascer certo o formulário.» Estava exatamente assim: os blocos de critério mediam-se
     pela régua (`rubrica`), e a matriz do corpo — a «linha de base revisitada» — pelas cinco
     marcas escritas no template. Na tela eram **duas legendas** («Régua desta turma: …» e «Marcas:
     ✓ aconteceu · ~ parcial · X não aconteceu · ? não vi») para os critérios da mesma aula. A
     correção tem **duas metades**, e as duas são medidas: (a) a **declaração** passa a dizer
     `rubrica` na coluna do corpo, e o merge passa a **adoptar o `tipo` derivado** conservando a
     `chave` — sem isso os schemas já gravados continuavam a dizer `marca`; (b) a **página** —
     que é servida sozinha, de um pacote que pode ser de ontem — mede o corpo pela mesma escala
     que ela usa nos critérios, declarada ou de recurso. **Uma folha inteira em marcas (o ciclo
     antigo) fica como estava**: não se inventa escala nova em cima de um ciclo que nunca a teve.
     **O `tipo` é modo de leitura, não identidade de dado** — o valor gravado é uma string nos dois
     casos, e um valor que a régua já não declara continua visível (opção extra no formulário,
     `nivel-fora` na leitura). **DECIDIDO** 22/11/2026.

141. **UM PLANO DE ENSINO POR CICLO, NA ESCOLHA — A EXCEPÇÃO DE 07/11 SAIU.** Palavras dela: «o item
     dois do plano de observação aqui nos formulários, você preencheu com dois planos de ensino. A
     gente tem uma correção documentada a respeito disso do plano de ensino, que não é para ter
     dois aqui dentro do mesmo ciclo. E você colocou o mesmo objetivo deles, mas você tomou uma nota
     no segundo que diz versão anterior. E não pode ser assim, isso está errado.» O remédio de
     07/11 escondia os planos substituídos, **com uma excepção**: o que o documento já apontava
     ficava, dito «(versão anterior)», para a gravação seguinte não perder a referência em
     silêncio. Quando o documento aponta um elo que já foi ajustado, a lista mostra dois planos com
     o mesmo objetivo — que é precisamente o que ela recusa. Agora a lista segue a **cadeia**
     (`ajuste_de`) até ao topo e o campo abre no **vigente**, com uma **nota** que diz o que
     aconteceu: a referência muda À VISTA, e não em silêncio. O elo antigo não se perde — continua
     na estante, e é o histórico que o lê. A mesma regra nos **dois** clientes (a porta e o painel
     do acervo). **DECIDIDO** 22/11/2026.

142. **BASTIDORES TEM UM DESTINO SÓ, E ELE CHAMA-SE ESTÚDIO — O ENDEREÇO VAI COM O NOME.** Palavras
     dela: «Nós temos aqui bastidores, e bastidores tem dois endereços, o estúdio de dança e a
     produção. Esse endereço estúdio de dança vai deixar de existir. Em bastidores a gente vai ter
     apenas a produção e tudo o que a gente já desenvolveu dentro dela. Só que nós vamos rebatizar a
     produção. A produção vai se chamar estúdio. […] aqui dentro do estúdio nós temos o bloco
     produção, que aí tem um painel inicial, isso continua assim. Configuração com o que tem dentro
     dele continua. Pessoa também e pedagogia e tudo que tem dentro também.» **A cena sai** — era um
     `<h1>`, um parágrafo e um link, e nunca teve conteúdo próprio —, e **a produção herda o nome e
     o endereço**: `/bastidores/estudio` passa a servir a página que era a Produção, com as secções
     todas dentro (Painel inicial, Aparência e A escola, Professores e Alunas, Salas, Audição,
     Dicionário, Estilo e Turmas). O **grupo «Produção» da coluna fica** — é o BLOCO que continua
     dentro do estúdio, e é o que se lê. O `<h1>` e o título são «Estúdio»; o menu de Bastidores tem
     **um item**. **Os endereços antigos não se apagam**: `/bastidores` e `/bastidores/producao`
     respondem **302** para o novo, com a query, e o mês a mês idem nas duas formas antigas — é a
     regra que o `/bastidores/financeiro` já seguia desde 17/11. Um favorito antigo chega ao mesmo
     sítio; um 404 seria a mudança de nome a apagar o caminho de quem o tinha guardado.
     **DECIDIDO** 22/11/2026.

143. **O PAINEL INICIAL PASSA A SER O RETRATO DA ESCOLA EM BLOCOS — E «OCUPAÇÃO» AINDA NÃO TEM
     DEFINIÇÃO.** Palavras dela: «Sempre que entrar no [estúdio] a gente vai para o painel inicial.
     […] aliás, vários dashboards, que mostram para a gente em blocos quantos alunos existem na
     escola, qual é o nome da escola, quem é o responsável pela escola, quantos professores tem na
     escola, quais são as salas que essa escola possui, qual é a taxa de ocupação das salas, quantos
     elencos tem, esses elencos são compostos de quantas pessoas, quais modalidades a escola
     ensina. Mas primeiro você vai me apresentar lá no experimento um modelo.» O modelo está em
     `experimentos/propostas/proposta-painel-do-estudio.html`, com os **números da escola viva**
     (nenhum inventado, e cada um com a fonte ao lado), e a única decisão de desenho que ele põe é o
     **peso do número** — a caixinha que a Produção já usa (zero peças novas) ou uma peça nova com o
     número grande. **A pergunta que ele faz é outra**: «taxa de ocupação» mede a **agenda** (aulas
     dadas sobre as previstas no período — tem dado hoje, e é a conta do calendário do plano) ou o
     **corpo** (alunas do elenco sobre as vagas da sala — e **vagas não existe**: é campo novo na
     Sala, e essa é uma decisão de dados, não de desenho). O modelo mostra a agenda e **diz a outra
     com o seu custo**. **DECIDIDO** 22/11/2026.
144. **O PAINEL INICIAL ESTÁ CONSTRUÍDO — A OPÇÃO B, E CADA NÚMERO COM A SUA CONTA.** Depois de ver
     o modelo ela respondeu «Quero a opção B»: o número grande. O painel passou a existir na página
     do Estúdio (`sec-painel`), e a **conta é da rota** (`painelDoEstudio`, exportado): alunas
     **sem `desligadaEm`** e não os registos (2 de 5), professores **com o principal** (que não vive
     na lista: 2), salas **vigentes** e não as encarnações (1 de 23), elencos pela **versão mais
     recente de cada** (Tami com 2, Ami com 1), modalidades pelas **matrículas não substituídas**.
     A **ocupação é a agenda** — aulas dadas (`lancada` no `ciclos.json` do pacote, lido por
     `ASSETS`) sobre as previstas do período, na `.cota` que o Monitoramento já usa —, e sem leitura
     o painel **declara a lacuna em vez de mostrar zero**. O **nome** vem do cadastro da escola
     (`cadastro.escolaNome`), não do slug, e as datas saem em `dd/mm/aaaa`. A peça nasceu na folha
     (`painel-numeros`, `painel-numero`, `painel-rotulo`, `sala-do-painel`) e **não se chama
     `numero`**: a `porta/index.html` já escreve `.numero` com outro sentido — o número do degrau —
     e a peça vestiria os degraus de cartão. **DECIDIDO** 22/11/2026. O que **continua** em aberto é
     a pergunta da 143: se «ocupação» é a agenda ou o corpo (vagas não existe na Sala). E há um
     segundo facto que ela precisa de ver, encontrado na primeira carga ao vivo: o `lancada` de
     `/rosa/ciclos.json` está `false` nas **15** aulas da `breu`, embora `aula-01.html` e
     `aula-02.html` existam no pacote — pelo critério do próprio sistema (a chave `aulas['NN']` no
     JSON de dados) **nenhuma aula desta escola foi lançada**, e o `-dados.json` do repositório tem
     `aulas: []`. O painel não interpreta: diz zero onde o registo diz zero, e diz porquê.
     E o caminho até este número custou três correções medidas ao vivo: o prefixo da árvore de
     assets, a regra desse prefixo a mudar de casa (`motor/nucleo/arvore-de-assets.js`, para não
     fechar o ciclo de `require` entre `producao.js` e `bastidores.js`), e a verdadeira causa — o
     **id da turma tem carimbo** (`rosa-2026-11-20-11`) e a **pasta** dela não (`rosa`). As três
     ficam no `REGISTRO.md`, com o URL que o diagnóstico leu.
145. **A COLUNA DOS BASTIDORES ABRE E FECHA A PARTIR DOS 769 — O ACORDEÃO SEGUE O CORTE DA COLUNA.**
     Palavras dela: «quando eu entro, por exemplo, em produção e depois eu vou para aparência […]
     o menu ele fica expandido […] e essa parte que devia acompanhar o tamanho do menu não
     acompanha, esse background não acompanha o tamanho do menu. Ele para ali no dicionário». A
     causa **não era o fundo**: `.lateral` deixa de ser coluna e passa a barra+folha a 768px
     (`bastidores.js`), e o acordeão — `max-height:0`, `[data-aberto="sim"]`, `:hover` — vivia só
     no `@media (min-width:1141px)`, que é o corte da coluna do **Sistema Lastro**. Entre **769 e
     1140** a coluna existe e o acordeão não: os quatro grupos ficavam permanentemente abertos,
     `data-aberto` era ignorado, a seta não aparecia, e o menu crescia para fora do ecrã (medido a
     1024×640: último item a **671px** num ecrã de 640). A regra mudou para `@media (min-width:769px)`
     e as regras do `.coluna` ficaram onde estavam: `if (é coluna)` e `if (abre e fecha)` tinham
     deixado de ser a mesma pergunta. **DECIDIDO** 22/11/2026.
146. **UM ELO QUE NUNCA OLHOU NÃO É UM ELO LIMPO.** O expurgo da `calango` deixou o elo a dizer
     `{ok: true, apagadas: 0, restantes: 0, namespaceId: null}` — e **seis chaves vivas no KV**
     (alunas, curadorias, dono, linhas-de-base, rubricas, turmas). O botão «Terminar a limpeza do
     KV» respondia **«nada pendente»**, em silêncio, porque `pendenciaDoKv` só reconhecia
     `kv.pendente === true` e esse elo não tinha o sinal. `apagarChavesDeEscola` devolve `ok` para
     `namespaceId === null` («a escola não declara namespace»), e nas escolas de **shard** esse
     `null` era **falso**: elas escrevem, com prefixo próprio, no namespace do shard. A pergunta
     passou a ser uma só — `eloPedeLimpezaDoKv`, usada pelo anúncio **e** pelo fecho —, e ela
     reconhece o `null`, respeita a `retomada` e **a recriação**: o que a encarnação de agora
     escreveu é dado, não resíduo. As seis chaves foram apagadas (`apagadas: 6, restantes: 0`) e o
     KV das três escolas mortas lido a zero. **DECIDIDO** 22/11/2026.

147. **O PAINEL INICIAL EMPILHA — A ARRUMAÇÃO QUE ELA APROVOU.** Palavras dela: «você me
     apresentou no experimento […] os blocos empilhados e agora você colocou o breu do lado
     esquerdo, as salas do lado direito […] Então você me entregou duas linhas e duas colunas. Eu
     prefiro do jeito que eu aprovei.» A bancada é uma página própria com os cartões no fluxo; a
     página real põe a secção dentro da `.secao`, que é uma grade de duas colunas. Medido a 1440:
     bordas `[288,748,288,748]`, topos `[471,471,669,669]`. A secção passa a **uma coluna**
     (`#sec-painel{grid-template-columns:minmax(0,1fr)}`, a mesma solução de «A escola») e o vão é
     o que separa os blocos. **DECIDIDO** 22/11/2026.
148. **NENHUMA ALTURA DE MENU É UM NÚMERO FIXO.** «o folha do menu tem altura máxima e ela está
     fixa com um valor fixo […] porque aí ela não cobre tudo na expansão, ela fica faltando um
     pedaço sempre.» Eram dois: `.folha-do-menu{max-height:78vh}` — medido a 1024×640, 587px de
     conteúdo numa caixa de 499, **88px de menu fora do fundo** — e `.coluna-itens{max-height:15rem}`
     — o grupo que crescesse ficava cortado sem barra. A folha passa a `100dvh` com
     `overflow-y:auto` (o tecto é o ecrã, o único limite que a peça não inventa) e **nenhum tecto
     nas colunas**; o acordeão passa a uma **grade de uma linha** (`0fr`/`1fr`), onde `1fr` é o
     tamanho do conteúdo — não há valor a escolher, logo não há valor a errar. O miolo que a grade
     mede nasce nos dois produtores (`grupoDoMenu` e `motor/nucleo/nav.js`) no mesmo commit que a
     folha. **DECIDIDO** 22/11/2026.

149. **CADA AULA IMPRIME O SEU MARCO, E MEDE PELA RÉGUA DA TURMA.** Palavras dela, na Aula 01 da
     `breu`: «na linha que fala parâmetro de medição, tá aparecendo aqui todos os objetivos
     específicos […] aqui tem que ter apenas o marco que diz respeito a essa aula […] cada aula tem
     o seu objetivo específico». E, no §5: «tá usando uma matriz de medição que não existe mais.
     Aconteceu, parcial, não aconteceu, não vi. Isso aqui é texto escrito duro, não é criado
     dinamicamente.» Duas causas diferentes, uma forma só — o documento da aula a dizer o que não é
     dela. O §1 lia a matriz do CICLO inteira (o formulário grava os três marcos na chave da aula):
     passa a ler o escopo declarado — `marcosDaAula` lê `aula-de-cada-objetivo`, com a reserva da
     Regra 2, e `parametroEmLinhas` filtra por ele; **sem escopo não se filtra** (a bancada quer a
     matriz do ciclo) e **sem marco, a lacuna nomeia a aula em vez de herdar**. O §5 passa a dizer
     «o nível da régua desta turma: <níveis>», por `niveisDaRubrica` — a MESMA função e a mesma
     fonte do plano de ensino. A legenda da folha de captura muda com ela, porque dizia os níveis
     «por exemplo» e mandava o corpo pelas cinco marcas quando o corpo já se mede pela régua.
     **DECIDIDO** 22/11/2026.

150. **A AULA DIZ QUEM A DÁ, ONDE E EM QUE DIA — E O GUIA LEVA AO FORMULÁRIO.** Palavras dela: «falta
     dizer quem é o professor responsável pela aula, aonde essa aula acontece, aonde eu me refiro à
     sala […] e o dia da semana […] Você não vai transformar isso aqui num calendário, viu?» O §1
     ganha três linhas — `Professor responsável` (o nome do **perfil**, com o slug como reserva: o
     `PROFESSOR` do `.conf` é o slug e o `RESPONSAVEL` é o da escola), `Sala` (a turma do plano) e
     `Data e dia` (`segunda-feira, 14/12/2026`) —, e **uma data não é um calendário**. A conta do
     calendário passa a existir em JavaScript (`motor/nucleo/calendario-das-aulas.js`), com a regra
     do `calendario.py` copiada: as duas dão as mesmas 15 datas, medido contra o `ciclos.json`. A
     **lacuna `dataEHorarioDestaAula` saiu** do validador — era falsa: a data estava no `.conf` que
     a própria lacuna nomeava. E o §5 diz que o registo se faz no formulário, com **dois botões**
     (`.acao`, o da casa): o que abre a explicação bloco a bloco e o que leva lá — **relativo**
     (`lancamento.html`), porque o formulário viaja ao lado do documento no pacote. **DECIDIDO**
     22/11/2026.
151. **A AULA N LÊ O LANÇAMENTO DA AULA N-1 — E A COLUNA DO §5 É AGREGADA.** Palavras dela: «Aí
     tem uma coluna a adicionar [n]esses espaços […] uma outra coluna que pode ser o nome de
     resultado obtido na aula anterior […] Só vai ter a partir da aula dois.» O `-dados.json` já
     guardava o nível que o professor deu a cada aluna; o derivador **não o recebia**. Passa a
     receber (`contexto.lancamentos`, nos dois escritores: o do Worker e o `regerar-derivados`), e a
     aula 02 em diante ganha **`Resultado na Aula N-1`** nas tabelas do §5 e o bloco **`§3.1 O que a
     aula anterior mostrou`** logo depois da distribuição do tempo. A **Aula 01 não tem nenhum dos
     dois** — uma coluna que se imprime vazia em todas as linhas ensina a ignorá-la. O resultado é
     **agregado** (`1 de 2 em «Satisfatório» · 1 de 2 em «Razoável»`), pela ordem da régua da turma:
     com trinta alunas, trinta colunas não se leem, e é a mesma conta que a coluna do corpo já faz
     para a anamnese. Cada linha do §3.1 tem **três estados** e diz qual é — o dado, «a aula não foi
     lançada», «o campo ficou em branco» —, e nenhum vira zero. A **sala** é o único pedido dela que
     o formulário não pergunta: a linha diz o que sabe e nomeia o campo que falta, em vez de afirmar
     que foi na sala do plano. **DECIDIDO** 22/11/2026.
     *Ainda neste acto*: cada secção do documento ganhou um botão de **colapsar e expandir**
     (`.secao-dobra`, criado pelo `nav.js`, dentro do título, aberto por omissão, o índice a abrir o
     que estava fechado, e o papel sempre inteiro), e duas repetições saíram do §1 e do §5 —
     `Objetivo específico` (está no parâmetro e no título) e o botão «Como preencher o formulário»
     (o `<details>` abre sozinho no `summary`).
     **PENDENTE e declarado**: (a) a **hora de início** não é registada pelo formulário, e a linha da
         data diz isso; (b) a **sala onde a aula aconteceu** não é perguntada — é o campo que falta.
152. **A MÚSICA DA AULA PERGUNTA-SE QUANDO A AULA NASCE — NO DIÁLOGO, E DO VERBETE.** Palavras
     dela: «falta a gente colocar também tempo, a parte toda da musicalidade ali naquele modal
     quando ele abre». O diálogo criava a aula com `Tempos` e `Compasso` vazios, e o §4 da Aula 02
     da `rosa` saía a dizer «nenhum exercício desta aula tem tempos e compasso declarados na
     sequência». A regra passa a ser a que a grelha do plano já pratica: a música é do
     **exercício**, o **verbete** declara-a, e o número declarado decide a forma do campo — uma →
     leitura; várias → escolha, e só as declaradas; nenhuma → à mão, com a nota. O compasso
     acompanha os tempos, e **meio par é recusado** com o nome do exercício (a chave da notação é
     `tempos|compasso`). A leitura mudou de casa: `musicasDosExercicios` vive no núcleo
     (`notacao.js`) e o servidor delega nela. **As aulas já criadas não se reescrevem** — a Aula 02
     da `rosa` continua sem música até que a grelha da sequência a receba, porque o Battement jeté
     declara **duas** e escolher por ela seria decidir no lugar dela. **DECIDIDO** 22/11/2026.
153. **A MÚSICA É A DA ESCOLA — E SOBE DO VERBETE QUANDO A LINHA NÃO A COPIOU.** Palavras dela: «o
     Batman GT apareceu opções para eu escolher o tempo e opções para eu escolher o compasso. Está
     errado isso, porque o Batman GT já tem isso definido. Por que é que não está atualizado do
     mesmo lugar onde você pegou para os outros exercícios?» O alfabeto guarda o registo do catálogo
     e o de **cada escola** (`8|2/4@breu`, `4|4/4@batata`), e a lista que alimentava o diálogo e a
     grelha tirava o dono e juntava as de todas: o Battement jeté saía com duas músicas e a tela
     pedia uma escolha onde a `breu` tem uma. A lista passa a usar a regra que já existia e que
     compõe os documentos (`registosDaEscola`): **o registo de outra escola não entra**. E a segunda
     metade: `compor` levanta a música do verbete quando a linha da sequência não a declara e a
     escola declara **uma só** — a música é do exercício, e a linha é uma cópia; quando o verbete
     declara várias, a frase diz isso e a decisão fica com a professora. **DECIDIDO** 22/11/2026.
154. **A AULA DECIDE A SUA MÚSICA — O CAMPO ABRE PREENCHIDO E É DE ESCREVER.** Palavras dela: «tempos
     e compassos são editáveis, vão abrir como campos de formulário carregados com os valores
     reais, mas também editáveis, para que o professor possa editar. E aí ele vai decidir se
     realmente ele quer trabalhar nesse tempo e com esses compassos.» O campo era **leitura**
     quando o verbete declarava uma música — regra certa para o ESTILO, errada para a AULA: um
     campo travado obrigava-a a mudar a música do exercício no verbete, e isso mudaria a música de
     todas as aulas do ciclo. Agora abre preenchido, o `title` nomeia a origem, e o que fica
     gravado é `aula-N-sequencia` — o verbete não se toca. **DECIDIDO** 22/11/2026.
155. **«MÚSICA E VÍDEO DE REFERÊNCIA» É O CAMPO, NÃO A MÚSICA DOS EXERCÍCIOS.** Palavras dela: «é o
     que o professor coloca de música e de vídeo de referência, são links externos e não o
     repertório. O repertório já está escrito aqui no de baixo.» A lista derivada que ali estava
     desde 01/11 saiu: a música de cada exercício lê-se na **§4 da aula**, onde é consolidada por
     compasso e com a contagem. **DECIDIDO** 22/11/2026.
156. **O REPERTÓRIO DO PLANO ACOMPANHA A TURMA — A INCLUSÃO, E NÃO SÓ A PODA.** A poda já tirava
     do plano o que a Turma deixou de ensinar; a inclusão só acontecia pela declaração de
     objectivos, e por isso incluir um exercício no conteúdo da Turma não mudava documento nenhum.
     `sincronizarRepertorio` fecha a outra metade: o que a Turma ensina e o plano não declara entra
     no fim da lista, sem tocar no parâmetro, e a guarda da cadeia passa a olhar a lista inteira.
     **DECIDIDO** 22/11/2026. **CONFIRMADO por medição**, e com uma resposta negativa que importa:
     o «Battement fondu» **não pode** ser incluído na `breu` — o menu de Conteúdos só oferece os
     exercícios com notação **naquela escola**, e o fondu só a tem da `calango`. O menu da `breu` é
     `Plié · Battement tendu · Battement jeté · Relevé`.
     *E uma lição de método*: duas provas (`provar-compasso-limpo`, `provar-derivados-da-sequencia`)
     estavam a morrer com «Markdown is not defined» porque as bancadas serviam a porta em
     `/plano-ensino/` e a página pede o `markdown.js` num caminho **absoluto** — uma fixture que não
     serve o que a página pede não mede nada, e o silêncio dela lia-se como «não há nada a medir».

157. **A MUDANÇA CHEGA À AULA VIGENTE; AS DADAS FICAM IGUAIS AO ÚLTIMO REGISTO.** Palavras dela:
     «seja qual for o exercício […] no momento que isso for feito, então é para a aula vigente. Ah, e
     se eu trocar de sala? A mesma coisa. E se trocar de professor? A mesma coisa. E se entrar ou sair
     alguma aluna do elenco? A mesma coisa.» E a outra metade: «aquelas que já foram concluídas nas
     aulas dadas […] têm que ser igualzinhas ao último registro».
     **A regra das aulas dadas já existia** e não mudou: `aulas-do-ciclo.js` (`podeRegenerar`) lê o
     **registo do lançamento**, não o relógio, e o escritor recusa reescrever o que já é facto — com
     a excepção, declarada, da fonte que falta. O que **faltava era a outra metade**: a mudança não
     chegava à aula que ainda vem. A aula **N** lia só `aula-N-parametro`; e a chave dela **não
     existe** enquanto a aula não é criada — o §1 da Aula 03 dizia
     `[Preencher: parâmetro de medição da Aula 03 — o plano não respondeu «aula-3-parametro»]` sobre
     um plano que **tinha** respondido, na matriz do ciclo (`aula-1-parametro`, marco 3).
     **DECIDIDO** 22/11/2026: o §1 da aula que vem cai para a matriz do ciclo quando a chave dela não
     existe — a chave própria, mesmo vazia, **não** cai.
     **E o segundo defeito, que era meu.** `sincronizarRepertorio` (decisão 156) passou a encher o
     `repertorio` do plano com a lista da Turma, e o `ja-na-aula` — a regra que impede uma declaração
     de se aplicar duas vezes — lia **esse** campo. Resultado medido: incluir um exercício no conteúdo
     da Turma e declará-lo num objectivo respondia `ja-na-aula`, a janela do «a que objectivo serve
     este exercício?» **não abria**, e o exercício nunca entrava na matriz. A lista sincronizada
     tornou sem sentido a premissa de que ela só cresce pela declaração. A identidade passou a ser o
     **arranjo** — a matriz do parâmetro e as sequências.
     **O PREÇO, declarado:** quem desmarcar o exercício na matriz **e** ele não estiver na sequência
     vê a declaração voltar na derivação seguinte. Quem desmarcar só na matriz continua protegido
     enquanto a sequência o citar — e num ciclo real ela cita, porque é a sequência que o documento
     imprime. As duas direcções estão medidas.
     **E uma lição de arquitectura:** a declaração, a poda e a sincronização viviam soltas no
     `cadeia.js`, uma a seguir à outra, e a **ordem** era um comentário. A primeira tentativa de as
     medir copiou a ordem **ao contrário** (sincronizar primeiro) e concluiu que a declaração estava
     morta — a prova mediu o defeito dela própria. Passaram a ser uma função do núcleo,
     `aplicarAoPlano`, com a ordem dentro: duas cópias da mesma sequência divergem à primeira
     correcção.

158. **A MÚSICA DO EXERCÍCIO NÃO SE ESCREVE NO PLANO — DERIVA-SE, E O MODAL ABRE LARGO.** Palavras
     dela: «tem uma regra para a decomposição, que é o step cinco, que a conta dos tempos e compassos
     precisa estar correta no lançamento da decomposição […] a gente tem que ter uma outra solução
     aqui no modal. Essa solução não serve.» E a solução: «colocar um botão de derivar aqui no
     exercício […] vai direto para bastidores e em bastidores é direto no estilo e no estilo já
     aberto o derivar do que eu quero fazer o ajuste. […] O modal fecha.»
     **A REGRA QUE DESMANCHA O CAMPO DE ESCREVER**, e é ela que manda: no Estilo, a coluna do
     **compasso é calculada somando os trechos da decomposição** (passo 5), e a chave do verbete é
     `tempos|compasso` (`8|2/4@breu`); o desacordo entre a música declarada e os trechos é um
     **estado do dado**, com selo próprio na listagem («tempos em desacordo»). Um tempo escrito no
     plano que o verbete não cobre é uma música **sem decomposição nenhuma** — não é uma decisão da
     aula, é um verbete que falta.
     **DECIDIDO** 22/11/2026, e a solução é a que já existe: a tabela volta a ser **leitura**, ganha
     a coluna **Ações** com um **Derivar** por exercício, e o botão fecha o modal e leva a
     `/bastidores/estudio?derivar=<exercício>&musica=<tempos|compasso>#estilo`, onde o verbete abre
     no `editarVerbete`. O modal passa a usar a modificação **larga** da folha (`.modal-largo`, a do
     modal da duração: 880px, medidos) — «tem que ser esse mesmo padrão, não pode ser diferente».
     **O que a sequência grava:** a música que o verbete declara **sem dúvida** (uma). Com nenhuma
     ou com várias a linha nasce sem música, e é o núcleo (`compor`) que declara a lacuna — «não se
     escolhe por ninguém». A recusa do meio par morreu com o campo que a justificava.
     *E o registo de uma volta atrás:* os campos chegaram a ser de escrever nesse mesmo dia, com o
     argumento de que «o que a aula trabalha é uma decisão da aula». O argumento era bom e a
     conclusão falsa — a decisão da aula é **que exercício**.

159. **O PORTÃO DA AULA DADA — O BOTÃO ABRE DEPOIS DO LANÇAMENTO DA ANTERIOR.** Palavras dela:
     «todas as outras aulas que estão lá no nosso calendário com o botão […] ficam desabilitados até
     que os dados lançados da aula dada estejam registados no sistema, aí habilita o próximo e assim
     sucessivamente.» E, à pergunta «duas aulas seguidas?», **não**.
     **DECIDIDO e IMPLEMENTADO** 22/11/2026: o botão «Criar aula» da linha **N** nasce `disabled`
     enquanto a aula **N-1** não tiver o **registro do lançamento** (`aulas[NN]` no `-dados.json`) —
     o facto, e não a data, como na guarda da regeneração. A Aula 01 nunca espera. O `title` nomeia
     a aula que falta, e a regra diz-se uma vez por baixo da tabela. Sem `--dados`, nada é travado:
     «não sei» não é «não».
     **O QUE ELE NÃO FECHA, e fica dito:** o endereço `?criar-aula=NN` e um `POST` directo a
     `api/elicitar` passam ao lado do botão. Fechar a segunda porta é uma recusa no **servidor** —
     decisão dela, não minha. **PENDENTE**.

160. **A SETA DE ABRIR E FECHAR É UMA PEÇA SÓ — E O DOCUMENTO ABRE COM O PRIMEIRO TÍTULO.** Palavras
     dela: «Ele é maior, ele é grande, ele é redondo, tem uma borda redonda e tal. Vamos adotar isso
     como padrão […] onde é que vai ser padrão esse botão? Nesses títulos que a gente tem no
     contexto […] E aí começa com todos eles colapsados, exceto o primeiro […] registra isso,
     documenta isso, porque a gente vai seguir fazendo mudanças e isso é algo que tem que ser
     preservado.»
     **DECIDIDO e IMPLEMENTADO** 22/11/2026. A `.secao-dobra` dos títulos do pacote passa a ser a
     **mesma** `.alternar-form` dos Bastidores — **2rem × 2rem, `border-radius: 999px`, filete de
     1px, fundo de superfície, glifo `▸`/`▾`** —, e vale no **plano**, nas **aulas**, na **notação**
     e no **glossário**. Ficam pequenas, por decisão dela, a seta do índice (`.toc-dobra`) e a do
     menu (`.coluna-seta`). O documento abre com **todos os títulos recolhidos, excepto o
     primeiro**; do primeiro gesto em diante manda a memória da sessão.
     **O QUE A GUARDA, e é o que ela pediu que ficasse preservado:** a checagem **20 (Seta)** de
     `tools/check-identidade.js` lê as duas declarações — a da folha e a do HTML que o motor serve —
     e reprova se `width`, `height`, `border-radius`, `border` ou `font` se afastarem. Uma peça
     desenhada em duas folhas é a que diverge à primeira correcção; deixou de poder.
     **E dois defeitos medidos, os dois meus.** (1) O clique gravava a secção errada: o nome da
     variável dizia «aberto» quando queria dizer «estava fechada», e com a lista invertida clicar na
     segunda guardava a primeira. (2) A **janela de criar a aula era engolida pela última secção** —
     ela é a última coisa do plano, e a dobra apanha tudo o que vem depois do título; com as secções
     a nascer fechadas, o diálogo ficou dentro de uma caixa `display:none` e o botão «Criar» deixou
     de ser clicável. O sintoma, lido em voz alta, é «o modal abriu e não responde». O `.modal` não
     é conteúdo de secção: fica onde está.
     *Medido:* o título **não cresce** — 38px com e sem a peça (o `h2` tem 23px de tipo e a redonda
     de 32 cabe na linha), o mesmo número do pacote anterior.

161. **A CAMPANHA NÃO TEM A SETA — E O VAZIO DO «APAGAR ESCOLA» PASSA A DIZER A VERDADE.** Duas
     correcções no mesmo dia, e as duas são a mesma família: uma regra certa com uma frase (ou uma
     peça) errada por cima.
     **(1) A campanha.** Palavras dela: «Você também colocou o botão de colapsar e expandir no
     sistema lastro no endereço danca.padd.com.br, nesse não. […] Ele é uma campanha de marketing,
     não é como uma ferramenta, não. É a parte de venda. Isso também é a mesma coisa no endereço
     lastro.padd.com.br.» **DECIDIDO e CORRIGIDO**: a dobra nasce em qualquer `.conteudo > h2[id]`,
     e a página da raiz — a mesma que serve os dois endereços — tem onze títulos. Passa a haver uma
     lista por nome (`TELAS_SEM_DOBRA`) com `raiz` e `porta`; os documentos do pacote não declaram
     `data-tela` e continuam a ganhar a dobra.
     **A regra é por nome, e não «tem ou não tem `data-tela`»** — o contrário deixaria uma página
     nova sem dobra em silêncio, e um botão que falta não se anuncia.
     **(2) O vazio do apagar.** Palavras dela: «o botão apagar escola […] diz assim, carregando a
     lista de escolas e depois ele diz, não há escola para apagar. E não está certo, porque a escola
     Abreu ainda não foi expurgada.» **MEDIDO no KV**: a `breu` está `estado: "ativa"`, sem
     `desabilitadaEm` — e a regra de 16/11, dela, diz que a habilitada não aparece para expurgo
     («apagá-la seria apagar o que está a ser usado»). **A REGRA ESTAVA CERTA; a FRASE era falsa.**
     Existir uma escola que não pode ser apagada não é o mesmo que não existir escola. O vazio passa
     a nomear as escolas travadas, a repetir o motivo que o **servidor** mandou (`motivoDoExpurgo`,
     que já viajava na resposta e o ecrã deitava fora) e a dar o passo seguinte — é preciso
     **desabilitar primeiro**, e é nas escolas vivas que se faz.
     **O corte de 16/11 continua**, e a distinção é o que o salva: na LISTA com cartões não se explica
     escola a escola («imagina quando eu tiver 20.000 escolas»); no VAZIO não há lista para poluir, e
     o motivo é a única coisa que há para ler. Com muitas travadas, corta em 8 e diz «…e mais N».
     **E a dica muda com o motivo, porque há dois.** «Desabilite primeiro» é o caminho da escola que
     tem cadastro — e é mentira para a que não tem, porque não há estado a desabilitar. Medido no
     sistema real a 22/11/2026: a `breu` tem cadastro (`ativa`) e a `batata`, a `calango` e a `duo`
     **não têm** — as três continuam no índice e já não têm registo no KV. São o que fica de uma
     escola expurgada, e a tela diz isso em vez de as mandar procurar um botão que não existe.

162. **O REGISTO COMERCIAL NÃO SE PERDE AO DESABILITAR — E «NÃO HÁ CADASTRO» QUER DIZER ISSO.**
     Palavras dela: «Eu desabilitei a escola viva, que é a escola Breu, e eu respeitei o tempo para
     poder apagá-la, e agora eu não consigo apagar. […] Breu, não há cadastro comercial desta escola
     e sem cadastro não há como saber que ela está suspensa. […] Eu não sei que regra é essa que você
     colocou sobre cadastro comercial desta escola.»
     **MEDIDO, e a cadeia inteira.** O expurgo limpa o KV **por prefixo**
     (`prefixosDaEscola` = `['breu/', 'bastidores/breu/']`), e `bastidores/breu/comercial` está
     dentro do prefixo — **um expurgo que falha a meio apaga o registo que autoriza o expurgo**. Foi
     o que aconteceu: às 00:13 o contrato estava inteiro (plano `basico`, R$ 79,90, capacidade,
     `habilitadaEm`, 6 elos); às 00:42 já não existia. Quando ela desabilitou, o `gravarComercial`
     leu «nada» e **gravou o esboço da leitura**: `{"estado":"suspensa","semRegisto":true,
     "plano":null,…}`. A partir daí a guarda do expurgo — que existe para não afirmar um estado que
     ninguém leu — passou a afirmar o **contrário** do que o registo dizia, e a escola ficou
     impossível de apagar.
     **DUAS CORRECÇÕES.** (1) **A escrita**: o sinal de «não li nada» não se persiste —
     `gravarComercial` tira `semRegisto` e `motivo` do que lê e do que grava. (2) **A regra**: a
     evidência vence o booleano — `semCadastro` só vale quando não há plano, nem data de
     desabilitação, nem de habilitação, nem de criação, nem histórico.
     **A LIÇÃO, que é a mesma de outras três neste ficheiro: a forma de uma LEITURA não é a forma de
     uma ESCRITA.** Um objecto que responde «não há nada» não pode ser o que se persiste; persisti-lo
     transforma a ausência num facto, e um facto inventado é pior do que a ausência.
     **E O PRAZO**: a carência de teste passou a **1 minuto** (eram 5), por decisão dela na mesma
     mensagem. O regime continua a ser um interruptor (`null` = 3 meses, o de produção).
     **O registo da `breu` foi REPARADO**, com os valores que eu tinha medido nesta sessão antes do
     defeito (plano, valor, capacidade, datas e os 6 elos) mais o elo real da suspensão — nada
     inventado, e o estado `suspensa` que ela criou ficou. Verificado: `pode apagar? true`.
163. **O QUE O PREFIXO NÃO ALCANÇA, O EXPURGO LIMPA AO LADO — E UM PATHSPEC VAZIO É UM ERRO.**
     Palavras dela: «fiz o expurgo da escola breu. verifique se nada sobrou».
     **MEDIDO nos dois lados.** O expurgo em si correu (`3ffa914f`, **267 arquivos** registados um a
     um no elo, proveniência auditada antes de apagar, `0` chaves no KV sob os dois prefixos,
     `breu.padd.com.br` sem resolver, sem registo DNS e sem rota). Ficaram **três restos**, e nenhum
     estava onde se olhou primeiro: o **derivado** (a `breu` ainda `expurgada: false` com 76 registos
     que o repositório já não tinha), o **livro do financeiro** (7 linhas, as 7 dela) e a **cache do
     monitor** (`"breu": {…}`).
     1. **Um pathspec que não casa com nada é um ERRO, e não um no-op.** O workflow «Fechar os
        derivados» morreu em `fatal: pathspec '*.fipp' did not match any files` (exit 128): o expurgo
        levou a **última âncora do repositório**, e o passo começava por `git add -A -- '*.fipp'`.
        **Um repositório com zero ciclos ancorados é um estado LEGÍTIMO** — é o que o expurgo da
        última escola produz —, e a condição passa a ser **perguntada** (`acrescentar_ancoras`:
        `git ls-files -c -o` antes do `git add`), nunca suposta.
     2. ~~**Uma regra que existe numa porta e não na outra é meia regra.**~~ — **CORRIGIDO NO MESMO
        DIA, e a regra era a errada: ver a decisão 164.** A limpeza do livro
        (`apagarEscolaDoLivro`, 17/11/2026) só era chamada na **retomada**, e passou a ser chamada
        nas duas rotas. Ela viu o resultado do lado financeiro e inverteu a decisão: **o financeiro
        de uma escola expurgada não se apaga.** A função saiu do núcleo e as duas rotas deixaram de
        a chamar.
     3. **Uma cache que só acrescenta guarda o parque que já não existe.** A conta estava certa
        (`resumirCloudflare` soma sobre as escolas vivas); o **valor guardado** é que não. Três
        estados, e confundi-los seria o defeito novo: `null` = «não perguntei» (não risca nada),
        `[]` = «perguntei e não há» (risca tudo).
     **O QUE FICA, de propósito:** `escola/breu/indice.json` (a memória: 14 expurgos, 13 recriações,
     o elo com os 267 ficheiros e as âncoras), `indices/escolas/breu.json` (uma linha do acervo com
     **zero registos** e `expurgada: true`) e `teste/breu.json` (fixture sintética, sem dado pessoal).
164. **O FINANCEIRO DE UMA ESCOLA EXPURGADA NÃO SE APAGA — É HISTÓRIA.** Palavras dela: «O que não
     pode sair é a parte financeira. Tem que manter que ela é uma escola que tem um histórico de
     pagamentos e de ações. […] A parte financeira não pode expurgar, ela fica para histórico. E aí a
     gente diz numa linha seguinte que essa escola foi expurgada.» E o defeito, do lado dela: «Eu
     acessei o financeiro agora e ele não tem nada lá mais. E não pode isso.»
     **É A REVERSÃO DE UMA DECISÃO, e ela é declarada como tal.** A regra de 17/11/2026 era o
     contrário — «essa parte toda de pagamento e financeiro […] tem que deixar de existir» —, foi
     implementada, e chegou a apagar as **7 linhas** da `breu` do livro. O argumento que faltava é de
     negócio: uma escola que pagou sete meses e depois saiu é **receita que existiu**, e apagá-la do
     livro não limpa nada — falsifica o passado da operação.
     **A FRONTEIRA, e ela é precisa.** SAI o dado que **serve** a escola (contrato, senhas, alunas,
     documentos, endereço, Worker) — é o expurgo, e é irreversível. FICA a linha do livro
     (`financeiro/mensalidades`): mês, valor, quando, por quem, em que plano.
     **O QUE FALTAVA NO PAINEL, e era o defeito visível.** O livro sobrevivia por construção (é uma
     chave de todas as escolas, e nenhum prefixo a alcança); quem não o mostrava era o **extrato**:
     `extratoDasEscolas` recebia só as vivas, e a `situacaoDaEscola` contava os meses a partir da
     adesão — que uma escola expurgada perdeu. Resultado: a conta dela ficava **vazia**. Corrigido
     nos dois sítios: as apagadas **com histórico** entram no extrato com a marca e a data, e sem
     contrato a linha do tempo é o livro (os meses que ela **pagou**). Uma apagada **sem histórico**
     não entra: uma conta vazia com o nome de uma escola que já não existe é ruído.
     **E NÃO SE COBRA UMA ESCOLA QUE JÁ NÃO EXISTE:** o cartão dela não tem «Marcar pago», nem
     «Informar um pagamento», nem o ensaio, nem o formulário do contrato — quatro ganchos que gravam
     sobre um registo comercial que o expurgo levou. A viva continua com os quatro (medido).
     **A COLUNA CHAMA-SE «AÇÕES»**, no plural: «a última coluna tem que se chamar ação. Ações, né?»
     A regra está em [IDENTIDADE-VISUAL.md](IDENTIDADE-VISUAL.md) — o nome da coluna diz o que ali
     vive, não o rótulo do único botão que ela tem hoje.
     **A RECRIAÇÃO NÃO É UM «DESFAZER»** (medido, ver §8): ela devolve a escola, o contrato, as
     senhas e — desde a decisão 167 — a **identidade fiscal**, e traz de volta os **envelopes** (as
     anamneses, os planos de ensino, os POs) filtrados pela capacidade — mas **não** as aulas, a
     notação, as linhas de base, as âncoras nem o pacote gerado, que eram fontes e foram com o
     expurgo.
165. **A IDENTIDADE FISCAL DA ESCOLA SOBREVIVE AO EXPURGO — E OS DADOS DELA TÊM UMA ABA.** Palavras
     dela: «é importante lá no financeiro se, por exemplo, eu expurgar uma escola ou tiver com uma
     escola com pagamento atrasado, muito tempo atrasado e aí eu tive que expurgar ou eu vou ter que
     correr atrás. […] eu preciso de uma lista […] saber qual é o CNPJ dela e me mexer atrás dela.» E
     a descoberta, do lado dela: «eu não salvei o CNPJ inclusive antigo».
     **O DEFEITO, e é o mesmo do livro das mensalidades:** a limpeza do KV é por prefixo
     (`<slug>/` e `bastidores/<slug>/`), o cadastro da escola vive no segundo, e **expurgar apagava
     o CNPJ, o e-mail e o telefone**. Não havia segunda via: o cadastro nunca esteve no Git (o
     `check-indices` proíbe e-mail e telefone nos índices). O CNPJ da `breu` expurgada **não é
     recuperável** — medido, e dito na tela.
     **A CORRECÇÃO:** `guardarCadastroDoExpurgo` corre ANTES da limpeza e grava `cadastros/<slug>`,
     uma chave **fora dos dois prefixos** — e é só isso que a faz sobreviver. Guarda o registo
     fiscal e de contacto (escola: nome, CNPJ, e-mail, telefone; professor: nome, CPF, e-mail,
     telefone) e **não** o que serve a escola (alunas, curadorias, documentos, endereço, Worker).
     **Acrescenta, não edita:** um segundo expurgo deixa dois elos, o de ontem ao lado do de hoje.
     **A ABA:** «Os dados da escola», a quarta do Financeiro e a ÚLTIMA — é consulta, e quem abre o
     Financeiro vem ver «quem está em dia?». Tem as vivas **e** as expurgadas, a origem de cada dado
     (`cadastro` × `guardado no expurgo` × `sem cadastro`), e o «como falar» em `mailto:` e `wa.me`,
     as duas formas da página dos Contactos. O que falta é um traço, nunca um número deduzido.
166. **«OUTRA ESCOLA COM O MESMO NOME» — O CNPJ É OUTRO REGISTO, O SLUG É A MESMA IDENTIDADE.**
     Pergunta dela: «sendo outro CNPJ, é outra escola Breu, não é a mesma, né?»
     **MEDIDO, e as duas metades não se confundem.** O **CNPJ** é o registo comercial: outro número
     não colide (`cnpjJaUsado` → `null`) e a criação passa. O **SLUG** é a identidade da máquina:
     `slugificar('Breu')` = **`breu`** — a mesma pasta, o mesmo prefixo de KV, o mesmo endereço, e o
     mesmo elo (`escola/breu/indice.json` ganha a 14.ª `recriacao`, exactamente como o botão
     «Recriar» faria), **herdando o livro das mensalidades**. Para uma escola de teste genuinamente
     nova o caminho é um nome com outro slug — **`Breu Dois`** → `breu-dois` —, e ele **continua a
     carregar o fixture de teste**: a regra do fixture é uma PALAVRA NO NOME (`teste-fixtures.js`:
     `breu` → conjunto 3), nunca o CNPJ.
     **A criação não é recusada por nada** — medido: `escolaExiste('breu')` → 404 (é escola de shard,
     sem Worker próprio), `pendenciaDoKv` → nenhuma, `criar-escola.sh` → sem `.conf`, sem pacote e
     sem `wrangler.breu.jsonc`, o mapa `escolas/por-host` está `{}` e o KV tem 0 chaves nos dois
     prefixos.
167. **RECRIAR TRAZ OS DADOS DA ESCOLA DE VOLTA — MARCADOS COMO HERDADOS, E SEM HERDAR UM CNPJ
     OCUPADO.** Palavras dela: «O CNPJ a partir de então vai surgir junto? […] recriar é aquela
     escola que a gente já tinha antes, mas aí com os dados da escola também. É isso mesmo? O
     recriar já está alinhado com essa nossa nova diretriz?»
     **NÃO ESTAVA, e a pergunta apanhou-o.** A decisão 165 pôs o cadastro a sobreviver ao expurgo,
     mas nada o trazia de volta: a escola recriada ficava **sem CNPJ, sem e-mail e sem telefone**; a
     aba nova mostrava-lhe «guardado no expurgo» sobre uma escola **viva**; o e-mail de boas-vindas
     da recriação saía só para o professor; e o nome voltava derivado do slug («Breu») em vez do que
     a escola declarou («Escola Breu»). A página do convite prometia «os dados de identificação dela
     ficaram guardados» desde 16/11 — e era **falsa**.
     **A CORRECÇÃO, e a ordem importa.** A recriação **lê** o registo guardado cedo (é dele que saem
     o nome e os endereços do convite e da mensagem) e só o **repõe depois de a escola existir** —
     depois do `disparo` do motor e do registo comercial. Gravá-lo antes deixaria um cadastro a
     apontar para uma escola que uma recusa (plano inválido, 409) ainda pode não criar, e o CNPJ
     passaria a parecer ocupado por uma escola que não voltou.
     **DUAS GUARDAS.** (1) **Não se sobrepõe** um cadastro que já exista com conteúdo — o que foi
     declarado agora é mais recente. (2) **O CNPJ não se herda se já for de outra escola**: depois de
     um expurgo o número fica livre, e herdar sem perguntar criaria dois registos com o mesmo número,
     que é o defeito que a regra de 25/11 existe para impedir. O resto herda-se, e o desfecho diz
     qual é a escola que tem o número.
     **O QUE FICA ESCRITO NO DADO:** `origem: 'recriacao'` e `herdadoDe: { em, motivo }`. A aba diz
     **«herdado do expurgo»**, com a data — e não «cadastro»: um CNPJ herdado é o da encarnação
     anterior, e quem o lê tem de o saber antes de emitir uma cobrança com ele.
168. **A IDENTIDADE FISCAL HERDA-SE NAS DUAS PORTAS, E SÓ PREENCHE O QUE VEM VAZIO.** Palavras dela:
     «A gente está em ambiente de teste […] inclui […] no cadastro dessas escolas o CNPJ e o e-mail
     […] eu não quero ter que preencher de novo um formulário.»
     **A DECISÃO 167 cobria a recriação; faltava a criação com o mesmo nome** — que é o que ela vai
     fazer («vou continuar criando escola breu ou calango ou batata»). Sem isto, a escola nascia
     outra vez sem o CNPJ guardado e ela teria de o escrever à mão.
     **A CONTA É UMA** — `identidadeDoExpurgo({env, slug, cnpj, email, telefone})` —, e os dois
     chamadores são `herdarCadastroDoExpurgo` (recriação) e `gravarCadastro` (criação). Duas cópias
     divergiriam na primeira correcção, e é esta conta que decide se nascem duas escolas com o mesmo
     número.
     **TRÊS REGRAS, e cada uma tem a sua asserção:** (1) **o que a escola declarou agora manda** — a
     herança só preenche o vazio; (2) **o CNPJ não se herda se já for de outra escola** — um CNPJ é
     uma escola (regra de 25/11), e depois de um expurgo o número fica livre para outra; (3) **nada
     herdado, nada marcado** — um registo guardado sem dados não escreve `herdadoDe`, senão a aba
     diria «herdado do expurgo» sobre três traços. O **e-mail** é a excepção declarada: dois e-mails
     iguais não são duas pessoas.
     **ONDE O DADO MORA, e a escolha não é indiferente.** O CNPJ das escolas de teste entrou em
     **`cadastros/<slug>`** — o registo que sobrevive ao expurgo —, e **não** em
     `bastidores/<slug>/cadastro`. A segunda parece a mais directa e faria a criação ser **recusada
     pelo próprio número**: `cnpjJaUsado` varre `bastidores/*/cadastro`, e criar um `calango` com o
     CNPJ escrito no formulário responderia **409** — «o CNPJ já é da escola «calango»» — sobre a
     escola que se está a criar.
169. **A SENHA DO PROFESSOR NÃO SE ESCONDE COM O MODO DO PROFESSOR — E ELA É POR ESCOLA.** Palavras
     dela: «Como não tem campo aqui quando eu pego essa opção de um professor que já existe, não tem
     como eu inserir a senha do professor. […] Permitir que a senha do professor seja digitada.»
     **A causa era de marcação:** o `#senha-professor` vivia dentro de `#bloco-novo`, que
     `pintarModo()` esconde no modo «já existe», e a validação pergunta pela senha **antes** de olhar
     para o modo. A regra pedia um valor que a tela não deixava escrever.
     **A CORRECÇÃO É MOSTRAR O CAMPO, e não afrouxar a regra**, porque a senha é **por escola**:
     `senhaDoProfessorOk(env, kv, escola, senha)` responde «esta senha é DESTE professor NESTA
     escola» — reutilizar a pessoa não é reutilizar a senha dela noutra. O campo saiu dos dois
     blocos, ficou visível em ambos, e o recado muda de dono: no professor novo é a senha de estreia;
     num que já existe é a senha **desta** escola. A nota é a peça `.aviso` já catalogada — um
     `span.sub` novo reprovou a checagem 8 (Peça) do `check-identidade`, e a peça não se inventa.
     **E o controle negativo precisou de outra âncora:** contra `a4676abe` (o formulário sem etapas),
     «o campo não vive dentro de `#bloco-novo`» passava **por o bloco não existir**. A prova passou a
     aceitar `--controle-negativo=<sha>`, e contra `bd87f249` reprovam exactamente as quatro
     asserções que descrevem o defeito. **A mensagem «informe a senha» nunca foi o defeito** — o
     defeito era o campo ausente.

170. **O QUE É UM GESTO É UMA AÇÃO; O QUE É UM FACTO É UM FACTO — E O CADASTRO DA PESSOA VIVE NA
     LISTA DAS PESSOAS.** Palavras dela: «Aqui chama escolas vivas, a gente vai chamar aqui de ações.
     […] onde está escrito sem escola viva, que é só uma etiqueta, vai virar um botão de ação. […]
     Se tiver escola viva, aí o botão leva até a escola viva. Aí o botão vai ser o nome da escola.»
     E, do outro lado: «Você colocou o professor com o CNPJ ou CPF dele logo abaixo, né? Você vai
     mudar isso. Aqui você vai colocar o professor apenas como sendo um link.»
     **AS DUAS METADES DA FRASE SÃO A REGRA.** Sem escola não há gesto a fazer — fica a etiqueta;
     com escola há um destino — fica um botão com o **nome** dela. A peça é a `.acoes-da-linha` dos
     botões «Habilitar»/«Desabilitar», e não um estilo novo.
     **A ORDEM PASSA A SER A DO QUE ESTÁ ESCRITO:** a coluna ordena pelos nomes das escolas (o
     `title` diz «Ordenar pelas escolas»), porque ordenar por uma coisa e mostrar outra é o que faz
     uma coluna parecer desarrumada.
     **O CADASTRO DA PESSOA LÊ-SE ONDE É ESCRITO:** as fichas `professores/<slug>/contato` — a
     criação da escola e o Estúdio —, **um `get` por professor em paralelo e nenhum `list`** (a
     enumeração é a operação limitada por dia). O documento é lido **pelo comprimento** (11 = CPF,
     14 = CNPJ) e escrito como se lê; um número com forma inesperada mostra-se como está, sem rótulo.
     **UM DADO, UM SÍTIO:** o documento do professor saiu do feed do Financeiro (`professorCpf`), e
     não só da tela — a aba passou a ligar a esta lista. A segunda cópia é a que fica errada quando
     só a primeira é corrigida.
     **O QUE NÃO SE TOCA:** o formulário de criar escola — «continua do jeito que está».

171. **O DOCUMENTO DA PESSOA PODE SER CPF OU CNPJ — E O COMPRIMENTO É QUEM DECIDE.** Palavras dela:
     «O CNPJ ou CPF que o professor tenha, né, também vai estar lá. Professor pode ter CNPJ ou CPF,
     tá? Não necessariamente só CPF.»
     **A DECISÃO 170 pôs a lista a LER o documento pelo comprimento, mas não havia PORTA por onde um
     CNPJ entrasse:** o Estúdio pedia «CPF do professor», onze dígitos. Uma regra de leitura sem
     sítio de escrita é uma regra que nunca se aplica.
     **UM CAMPO, E O NÚMERO DECIDE:** catorze dígitos são um CNPJ, onze são um CPF. Dois campos
     obrigariam quem preenche a saber qual deixar em branco, e o sistema a decidir qual acreditar
     quando os dois viessem preenchidos.
     **UM DOCUMENTO, UM SÍTIO:** gravar um limpa o outro, senão a ficha teria dois documentos e a
     lista escolheria um por conta própria. O «em branco não apaga» continua a valer para os dois.
     **A UNICIDADE É POR DOCUMENTO:** um CNPJ de professor não colide com um CPF de professor, e
     nenhum dos dois é comparado com o CNPJ de uma **escola** — uma pessoa pode ser sócia de uma
     escola sem ser a escola.
     **O QUE CONTINUA A PEDIR CPF:** o formulário de criar escola (é a ordem dela na decisão 170), e
     o CPF do **proprietário** não é obrigatório — «não é obrigatório isso, é apenas uma sugestão».

172. **A SETA É PARA LER, E NÃO PARA TODA A PÁGINA QUE TEM TÍTULOS — E GRAVAR FECHA O FORMULÁRIO.**
     Palavras dela: «Você colocou o botão de expandir de forma indiscriminada e não só onde eu te pedi
     ontem.» […] «quando uma escola nasce […] Você colocou um botão de expandir e colapsar. Tira esse
     botão daqui, ele não existe aqui.» […] «quando clicar em gravar, tem que colapsar.»
     **O DEFEITO É O DE 22/11 OUTRA VEZ:** a dobra nasce em qualquer `.conteudo > h2[id]` de uma
     página que não se declare, e a lista das excepções só tinha `raiz` e `porta`. O índice de uma
     escola (1 título) e a apresentação dela (9) não são documentos de leitura — recolher o primeiro
     esconde a página inteira.
     **A REGRA NÃO MUDOU, A LISTA CRESCEU:** `TELAS_SEM_DOBRA = {porta, raiz, escola, sistema}`, e as
     duas páginas declaram-se no `<body data-tela="…">`. Exigir `data-tela` para ter dobra deixaria
     uma página nova sem ela em silêncio — o raciocínio de 22/11 continua bom.
     **O ÍNDICE DA ESCOLA** passou a «Turmas» (a página já é a da escola), a frase a «o que se planeja
     para uma **serve de base para a outra — é o lastro da próxima**», a do ritmo e do calendário
     saiu, o aviso do ciclo **ficou** («Isso está certo, tá? Isso pode deixar»), e entrou o atalho
     «**comece por aqui** — Bastidores → Estúdio».
     **GRAVAR AS HABILITAÇÕES FECHA** o formulário: as caixas ficam com o que o professor declara
     (é o estado certo, e ela disse-o), a moldura recolhe — e **a confirmação vai para o aviso do
     gesto**, porque escrita no `.res` de dentro ficaria escondida pela própria recolha.
     **E UMA LIÇÃO DE MEDIÇÃO:** a primeira execução da prova deu «zero setas» porque o `jsdom` não
     carrega `<script src>` sem `resources: 'usable'` — o `nav.js` nunca tinha corrido, e a asserção
     «não lançou» era verdadeira por o script não existir. A prova passou a exigir **uma marca do
     script** (a coluna que só ele desenha).

173. **O «GRAVAR» SÓ ACENDE QUANDO O PEDIDO MUDARIA — E O PERFIL PASSA A TER OS TRÊS ESTADOS QUE
     JÁ DIZIA TER.** Palavras dela: «para evitar custo, só vai habilitar o botão gravar quando mudar
     alguma coisa. […] se eu marcar as mesmas de novo, aí o gravar fica desabilitado de novo. […]
     Nessas situações em que não tem o botão de editar, a gente vai adotar isso como padrão.»
     **O CUSTO É A GRAVAÇÃO**, não o clique: escreve `professores/<slug>/perfil.json` e move a
     cadeia.
     **A CONTA É O PEDIDO, não o ecrã** — `tradicoesDasHabilitacoes()` é a conta única do `submit` e
     da comparação. Duas contas divergem à primeira correcção, e o sintoma é o pior: botão apagado
     sobre uma diferença que existe.
     **A BASE VEM DO SERVIDOR** (`retratoDoServidor`), com `~` para a chave declarada e vazia e `''`
     para a ausente. Calculada do que ficou pintado, perdia o caso mais comum — **13 dos 15 perfis
     reais** têm `tradicoes` ausente — e deixava o botão apagado sobre uma declaração verdadeira. Foi
     a primeira versão, e a prova apanhou-a.
     **E O PEDIDO APRENDEU O TERCEIRO ESTADO:** quando nem o generalista nem uma tradição estão
     marcados, a chave **não entra** — «ainda não foi perguntado». Antes mandava `[]` e as duas
     coisas ficavam indistinguíveis. O consumidor (`tradicoesDoPerfil`) já devolvia `null` para a
     chave ausente, portanto nada muda do lado de lá.
     **CINCO CONSEQUÊNCIAS, cada uma com asserção:** voltar ao estado de origem apaga o botão;
     cancelar apaga-o e devolve o estado; gravar faz do gravado a nova base (sem esperar pela
     releitura); trocar de professor apaga-o **antes** de ler; e **um estado que não se leu não se
     grava por cima** — botão apagado e a nota diz porquê. O botão **nasce apagado na marcação**, e
     o `title` explica a razão quando não é óbvia.
     **O PADRÃO, declarado:** formulário **sem «Editar»** abre com o Gravar apagado (acende com uma
     diferença); **com «Editar»**, acende ao abrir. Em `IDENTIDADE-VISUAL.md` e no resumo executável
     das instruções.
174. **O MANIFESTO DECLARA TUDO O QUE O ESCRITOR GRAVA — E A LISTA SÓ CRESCE.** O escritor do
     ciclo grava seis fontes e depois escreve o `DOCS`; uma fonte fora da lista existe no repositório
     e não entra no pacote, sem erro nenhum até à geração. **A REGRA É DERIVADA, e tem um dono só:**
     `docsCompletos` (em `motor/nucleo/aulas-do-ciclo.js`) — a família das aulas, mais harmonização,
     notação, glossário e referências, na ordem do pacote. Substituiu duas regras que conviviam:
     `docsGerados` (a lista inteira, que só corria com `aula-01` ausente) e `docsComAsAulas` (que só
     acrescenta aulas, e é o ramo por onde passa todo o ciclo que nasce). **NUNCA SE TIRA NADA: um
     documento que o escritor não conhece** (`pre-requisitos`, `musicalidade-aluna`, `caderno-NN`,
     `guia-de-observacao-NN`) **fica onde está**, porque a ordem declarada é a ordem do menu
     publicado. E **a tabela dos objetivos só cita a âncora de exercício quando `notacao` está na
     lista** — o que a página não vai ter, a tabela não cita. **DECIDIDO** 24/11/2026.
175. **CADA CICLO É UM MUNDO FECHADO, E A PROVA É UMA SÓ PARA OS N.** O que isola dois ciclos não é
     um `if` — é o **caminho carregar o ciclo** (`ciclo-NN` em toda fonte derivada) e a leitura ser
     **por ciclo** em cada sítio que decide alguma coisa. Dois ciclos da mesma turma são o pior caso,
     porque a variante (`<escola>-<turma>`) não leva o ciclo: diferem por `ciclo-NN` e mais nada.
     **A trava da aula dada é por ciclo** — `aulas[NN]` do `-dados.json` de um ciclo não tranca a
     aula do outro, senão o ciclo novo nasce sem a primeira aula, em silêncio. **Um ciclo não é
     zero:** um contexto sem ciclo é RECUSADO, não convertido em `00` (`numeroDoCiclo`). **E a cadeia
     atravessa os ciclos** — o `parentHash` do 02 é o `hash` do 01; editar o 01 faz o `--check` do 02
     recusar, e o `derivados.yml` reancora o 02 ao pai novo sem tocar no 01. **DECIDIDO** 24/11/2026.

176. **A AULA CUSTA 2,0 MINUTOS, O CICLO É QUE A SEGURA, E NÃO HÁ NÚMERO DE ESCOLAS QUE DÊ PREJUÍZO.**
     Medido a 25/11/2026 sobre 1 000 execuções: `Gerar o ciclo` mede **40 s** (16 runs desde 21/11) e
     `Fechar os derivados` **1,00 min** (395 runs) — **2,0 min por aula**, e não os 3 do §1 do
     `CUSTO-DOS-FLUXOS.md`. **A geração re-renderiza todas as aulas do ciclo a cada execução** (duas
     páginas `pandoc` de 59 ms + uma validação de 32 ms por aula), mas **o laço percorre o CICLO, não
     o mês**: um ciclo tem **24 aulas**, e a fronteira do minuto só é tocada às **67** — pelo que a
     unidade é constante. **O custo de uma escola é fração da receita dela, sempre:** os pisos da
     margem são **90,7 %** (Básico), **80,5 %** (Intermediário) e **62,9 %** (Avançado), e o zero
     exigiria **21,6 / 10,3 / 5,4 min por aula** — no caso mais apertado, o runner **2,7× mais lento**.
     **A margem desce com N e aplana; nunca cruza o zero**, porque o preço do minuto é constante e a
     escada só acrescenta dois valores fixos. **E «partilhar o mesmo workflow» não poupa minuto
     nenhum:** o `concurrency` lança e cancela, a factura arredonda ao minuto por job, e a uma aula por
     hora não há sobreposição. **DECIDIDO** 25/11/2026: **não há gatilho de prejuízo a vigiar** — o que
     se vigia é o minuto facturado, e a franquia é o limite comercial (100/300/800 em
     `assinaturas[].aulas`, com excedente a R$ 0,50 acima). A 16 aulas/dia o cliente está 3,5× acima
     do Básico e o preço já o empurra para o Avançado (R$ 0,557 → R$ 0,397 por aula).

177. **O TECTO DOS 100 % É DO DONO DA CONTA, NÃO DO PLANO — E A ESCADA PEDE 139 / 320 / 500.** A
     pergunta dela («quantas aulas por semana posso chegar para ainda ter 100 % de lucro?») tem uma
     resposta que não depende do plano: `2 000 min ÷ 2,0 min/aula = 1 000 aulas/mês no TOTAL`, o que dá
     **77 aulas/semana por escola com 3 escolas** e **26 com nove**. Medido contra as franquias: o
     **Básico (100) tem folga de 3,3×**, o **Intermediário (300) está no ponto** e o **Avançado (800)
     excede 2,4×**. A razão é uma só: **o compute custa o mesmo por aula e o Avançado vende a aula
     quatro vezes mais barata** — a escada de valor é, do lado do custo, um subsídio. **Dois limites
     duros fecham o espaço:** o **Básico ≤ 139 aulas** (a extensão a R$ 0,50 tem de ser mais barata do
     que a aula do plano de entrada) e o **Avançado > 448** se o Intermediário ficar em 320. **A escada
     proposta — 139 / 320 / 500** — dá +39 % ao Básico, +7 % ao Intermediário e −37 % ao Avançado (de
     31 para 19 aulas/dia, que é uma operação de três salas e não de trinta horas), leva o compute sobre
     a receita de 9/19/37 % para **13/21/23 %** e a margem das nove escolas de **83,0 % para 88,1 %**.
     **O que se perde:** a receita máxima a R$ 0 desce de R$ 699 para R$ 489,30 (o Básico ficou mais
     generoso) e a extensão passa a compensar até às 259 aulas em vez de 160 — **mais 120 aulas de
     extensão antes de o upgrade compensar**, o que é bom se a extensão se quer vender. **RECOMENDADO**
     25/11/2026; a decisão comercial é dela.

178. **A ESCADA É 130 / 320 / 500, O DÓLAR DE REFERÊNCIA É R$ 6, E NÃO HÁ PREJUÍZO EM NENHUM CENÁRIO
     PLAUSÍVEL.** Escolha dela: «Eu vou ficar com a proposta A, ela é a mais vantajosa para mim e também
     é razoável com a escola.» **Aulas por semana** (mês = 4,33): **30,0** no Básico (5,0/dia),
     **73,8** no Intermediário (12,3/dia), **115,4** no Avançado (19,2/dia). **Migração, com a extensão
     a R$ 0,50:** Básico → Intermediário às **190 aulas/mês** (43,8/semana), Intermediário → Avançado às
     **400** (92,3/semana); a janela em que a extensão compensa é 131–190, 321–400 e **501+** — no
     Avançado não há plano acima, e a extensão passa a custar **1,79×** a aula do plano. **O custo é
     R$ 0,00 até 1 000 aulas/mês na conta inteira** (7 do Básico, 3 do Intermediário, 2 do Avançado) e
     depois **R$ 0,072 por aula, para sempre**. **A margem não depende do número de escolas** — converge
     para o piso e fica lá (90,6 / 79,7 / 76,3 %), porque o custo é proporcional às aulas e a receita
     também; o que desce é a fatia gratuita, e ela acaba uma vez. **A R$ 6**: 3 de cada na franquia
     cheia = **R$ 121,20** contra R$ 929,10 → **87,0 %**; com metade da franquia, **97,4 %**. **O
     prejuízo só começa a R$ 46,00** e os 50 % só a R$ 23,00 — oito vezes o que ela declarou suportar.
     **A alavanca dela é fraca, e mediu-se:** uma aula custa R$ 0,072, pelo que cortar 10 % da franquia
     poupa R$ 0,94 / 2,30 / 3,60 por mês. Se o gatilho aparecer, a ordem é **engenharia** (1 212 min/mês,
     36 % do custo, não é promessa), **§7.1** (corta a unidade para metade) e só no fim a franquia.
     **O que se vigia é o total de aulas lançadas no mês** — não o número de escolas. **DECIDIDO**
     25/11/2026. ~~Por escrever: as franquias continuam 100/300/800~~ — **ESCRITAS** no mesmo dia, ver 179.

179. **A EXTENSÃO É O PRODUTO DE MAIOR MARGEM, E A MORA É A DAS CONTAS DE CONSUMO.** Três decisões no
     mesmo dia, todas dela, todas aplicadas. **(a)** As franquias passam a **130 / 320 / 500** no
     `planos.json` — e o Financeiro e o cartão da escola passaram a mostrá-las **sem uma linha de
     código**, porque leem o catálogo. **(b)** O **simulado das extensões**, que faltava: a extensão
     vende-se a R$ 0,50 e custa R$ 0,072 — **85,6 % de margem**, melhor do que o Intermediário (76,9 %)
     e o Avançado (74,3 %); e a margem **sobe** com o crescimento (Intermediário 76,9 % → **79,4 %** às
     400 aulas; Avançado 74,3 % → **81,5 %** às 1 000). Nove escolas a crescer 50 % dão **65 % mais
     receita e 89 % mais lucro**. **A alavanca de cortar aulas é fraca, e mediu-se** — a R$ 12 seria
     preciso cortar a franquia **a metade** para o custo não subir, e corta o produto mais rentável;
     o que reduz a sério é a **engenharia** (36 % do custo) e o **§7.1** (metade da factura). **(c)** A
     **multa e juros** são os das contas de consumo: **2 % de multa** (CDC art. 52, §1º; REN ANEEL
     1.000/2021, art. 343, §1º) e **1 % ao mês pro rata die** (art. 343, *caput*), sem carência e sem
     anatocismo — R$ 100 a 30 dias = R$ 103,00. **A correção do IPCA não se aplica e diz-se**: buscar
     um índice seria a dependência que falha em silêncio que o câmbio do painel já pagou. **E o
     monitoramento passou a medir a cota na unidade da casa** — **1 000 aulas/mês** é onde o gratuito
     acaba, e a cota entra no **pior indicador** (sem ela o mesmo parque dava «folga»). **DECIDIDO** e
     **APLICADO** 25/11/2026. **A lacuna declarada:** a norma de **luz** foi lida; a de **água** não —
     os percentuais coincidem, mas a citação é mais fraca.

180. **O §7.1 NÃO EXISTE — E NESTA OPERAÇÃO NÃO AJUDARIA. O QUE FALTA É O AGRUPAMENTO DENTRO DO ACTO.**
     Ela desconfiou: «isso já não foi feito? […] Você precisa medir isso.» **Medido: não.** O
     `disparar.js` faz um `POST` imediato por pedido, sem janela; o `concurrency` do `gerar-ciclo.yml`
     **serializa** (para não sobrescrever o pacote) e o do `derivados.yml` **cancela o pendente** — e
     um cancelado paga-se. Nos runs: **71 gerações, 4 canceladas (5,6 %)**, e os intervalos de
     «0 minutos» são o **mesmo acto a disparar duas vezes**, a 12–15 s. **E o mais importante:** o
     §7.1 foi escrito para «dez aulas seguidas»; aqui são **16 por dia, uma por hora**, com a geração a
     demorar **40–50 s** — a anterior termina **59 minutos antes** de a seguinte ser pedida. **Quando
     eu disse que ele «corta a factura a metade», apliquei ao cenário dela um ganho medido noutro.** O
     que a medição encontrou é maior: um acto dispara **2–4 gerações e 1–7 derivações** — **10 min por
     gesto de trinta segundos** —, porque cada gravação pede a geração e cada geração escreve em
     `professores/**`, que dispara a derivação outra vez. **É esse o agrupamento que falta**, e é ele
     que entra na ordem de socorro no lugar do §7.1; a engenharia continua em primeiro e cortar aulas
     continua em último. **DECIDIDO** 25/11/2026.

181. **O PONTO DE MIGRAÇÃO DA ESCOLA PASSA A SER DITO NO MONITORAMENTO — E O DINHEIRO MEDE A PERDA, NÃO
     AS AULAS.** «É ali que você vai me dizer quando vale a pena então migrar. É o ponto de migração da
     escola. E aí que eu vou pedir para o consultor entrar em contato.» O ponto deriva do catálogo:
     `viragem = franquia + (preço de cima − preço de baixo) ÷ preço da extensão` → **190** aulas/mês no
     Básico→Intermediário e **400** no Intermediário→Avançado. **No ponto a escola paga exactamente o
     preço do plano de cima e recebe menos** (190 em vez de 320; 400 em vez de 500), e acima dele o
     dinheiro começa a correr (a 230 aulas no Básico, **R$ 20,00/mês a mais**). **E a prova corrigiu o
     modelo:** o dinheiro perdido **cresce** com o crescimento (R$ 0 → 20 → 55) e as aulas «que paga
     sem receber» **encolhem** (130 → 90 → 20) — dizer «paga 90 aulas a menos» a quem está a 230 de 320
     é verdade e é inútil. **O dinheiro mede a perda; as aulas descrevem a distância.** O bloco vive na
     aba **da receita** e **não** na «migração» — aquela é a dos fornecedores e gasta, esta é a das
     escolas e rende, e o bloco começa por o dizer. **Não tem botão de migrar:** a decisão é comercial,
     e o que ela pediu foi a lista para telefonar. Três listas — **migrar**, **a chegar** (acima de 80 %
     do ponto) e **sem degrau** (o Avançado acima da franquia, que não pode ser calado). **DECIDIDO** e
     **APLICADO** 25/11/2026.

182. **O MONITORAMENTO RELÊ O MÊS A CADA ABERTURA — E A CAUSA MAIOR NÃO ERA A QUE ELA NOMEOU.**
     «A API demora muito tempo para carregar. E eu tenho a impressão que isso acontece porque a
     consulta está sem critério. Os planos se renovam a cada 30 dias.» A hipótese estava **meio
     certa**: a janela **já era o ciclo** (dia 1 ao hoje, desde 17/11/2026, quando o painel dizia
     3.623 min de uma cota em que a factura dizia 1.930), e o `Resend` já era mensal **e** diário. O
     que não tinha critério era a **paginação** — o corte do mês era aplicado *depois* de a lista
     vir. **Medido com `curl`: 26 páginas e 2 600 execuções em 97,8 s sem filtro, contra 11 páginas e
     1 000 em 54,7 s** com `created=>=2026-11-01` no pedido. O filtro passou a ir no **URL**, e com
     ele duas verdades escritas no código: **`total_count` devolve ZERO** com o filtro (não se lê
     como «não há execuções»), e a listagem filtrada **para em 1 000** — acima disso é `truncado`, e
     diz-se. **E a causa maior era a cache que não havia:** havia para os jobs, para o KV, para a
     factura e para a visibilidade, **não para a lista de execuções** — a única que se paga em
     páginas. Cada abertura relia o mês de fábrica: onze pedidos em série, sempre. A janela passou a
     ficar **2 minutos**, com **validade por mês**, com o **`truncado` guardado** (senão a abertura
     seguinte apresentaria uma janela incompleta como completa), com **leitura falhada não guardada**
     (senão uma falha de rede virava «sem execuções» por dois minutos), e com o **`ok` restituído**
     ao objecto vindo do KV — **um campo que falta não é um «não»**. **Medido de ponta a ponta**, com
     a rota verdadeira em processo: **fria 11 páginas + 12 medições + 3; quente 0 páginas + 12 + 2.**
     Onze pedidos a menos por abertura; a poupança em segundos (~32 s) é **derivada** e está dita como
     derivada — o tempo de rede não se mede contra um GitHub de mentira, e o que está medido é a
     contagem de pedidos. **A idade do número é dita na página** («As execuções do mês são as de 25/11
     às 08:58 — relidas a cada dois minutos»), e só quando veio da cache: dizer «agora» em cada
     abertura é ruído. **O controlo negativo apanhou um defeito meu:** o prazo era lido com
     `Number('2 * 60 * 1000')`, que dá `NaN`, e `qualquer coisa > NaN` é sempre falso — a cache
     **nunca caducava**, e os dois controlos passavam sem medir nada. É a família do `.every` sobre
     leitura vazia: uma validação que não mede nada não falha. **DECIDIDO** e **APLICADO** 25/11/2026.

183. **O ATO PASSA A CUSTAR UM COMMIT — E O CAMINHO DE SEMPRE FICA POR BAIXO.** «O agrupamento que
     falta é dentro do ato e não dentro das aulas […] É importante que isso não estrague nada do que
     está funcionando.» **A medida:** 21 execuções do «Fechar os derivados» em dois dias, **7
     canceladas**, **4,6 min de trabalho e 21 facturados** — 4,6× de desperdício, porque cada job
     arredonda ao minuto e **um cancelado paga-se** (as sete canceladas: **22 segundos** de trabalho,
     **sete minutos** de cota). **A causa:** um `PUT /contents` é um commit, e um commit é um push; o
     ato das 11:11:53–11:12:30 fez quatro. E cada commit custa **cinco subpedidos**, num orçamento de
     cinquenta. **A solução:** um **lote** no acervo — `guardar`/`criar` acumulam, `ler` vê o
     pendente, `fecharLote` aplica tudo com **um** commit pela `gravarArquivosNumCommit` que o
     escritor do ciclo já usava. **Sem lote nada muda** (é o controlo negativo da prova); o `criado`
     pergunta-se **antes** de guardar; lote vazio não faz commit; o `apagar` fecha o lote antes; e o
     `ok` que vale é o do **commit**, não o da promessa. **Duas lições que custaram provas
     vermelhas:** `typeof` não basta com o proxy do armazenamento — ele devolve uma **promessa
     rejeitada** para o verbo que não conhece, e um `try/catch` sem `await` não a apanha (três provas
     caíram por isto); e o commit único que falha tem de **degradar** para as escritas uma a uma, não
     rebentar — um `fetchImpl` de bancada não fala a API de Git, e sem a saída **o ato deixava de
     gravar**. **Um ganho de cota não pode custar a gravação.** Fica dito o que fica fora: o `.conf`
     continua num commit próprio, e o corte medido nesse ponto é de **quatro para três**.
     **DECIDIDO** e **APLICADO** 25/11/2026.

184. **O `.conf` NÃO COMPENSA; OS SCHEMAS DO CICLO CUSTAVAM 109 COMMITS E PASSAM A UM.** A pergunta
     dela — «se der para economizar também com isso, a gente economiza, senão deixa assim» — tem duas
     metades, e a segunda é um achado. **O `.conf` fica como está:** é escrito por `escrever-plano.js`
     antes de o acervo entrar, num ponto em que não há lote aberto; juntá-lo exigiria levantar a fila
     ao nível da rota, atravessando três módulos, e o ganho seria **um** commit. **Os schemas, esses,
     custavam caro:** `git log --all --grep='feat(schema)'` dá **109 commits**, e 20 pastas de
     professor têm **exactamente cinco** — porque `garantirSchemasDoCiclo` fazia um `PUT /contents`
     por sufixo. Cinco commits são cinco pushes, e cada um acorda o `derivados.yml`; cada execução
     custa 1 minuto e as quatro seguintes são canceladas — **e um cancelado paga-se.** **80 minutos**
     em 20 atos. Agora vão num `gravarArquivosNumCommit` só, com degradação para o `PUT` por ficheiro
     quando não há API de Git. **E o Cloudflare não precisa de habilitação nenhuma:** o Worker já tem
     o `CLOUDFLARE_API_TOKEN` e o token já tem `Account Analytics: Read` — medido pelo GraphQL, com
     **2 615 leituras e 25 escritas** de KV a 23/11. A limitação declarada no `resumirCloudflare` está
     **errada**, e fica como dívida a fechar. **DECIDIDO** e **APLICADO** 25/11/2026.

185. **A ANALÍTICA DO CLOUDFLARE JÁ ESTAVA HABILITADA — E A LIMITAÇÃO DECLARADA ERA FALSA.** «Precisa
     habilitar no worker do Cloudflare a permissão de analítica para […] os pedidos que são feitos por
     dia no worker, a escrita de KV por dia e a leitura de KV por dia. Como é que eu faço isso?» **Não
     é preciso habilitar nada:** o Worker já tem o `CLOUDFLARE_API_TOKEN` e o token já tem `Account
     Analytics: Read`. O painel dizia o contrário desde 17/11/2026 — «que este Worker não tem» —, e
     **uma limitação declarada que é falsa é pior do que uma omissão**, porque faz desistir de pedir o
     número. **O que se mede agora, no pico da janela:** pedidos **3,0 %**, leituras de KV **12,8 %**,
     **escritas de KV 23,4 %** (a cota mais apertada: 1 000/dia), listagens 6,1 %, apagamentos 3,1 %.
     **O desenho, e as três decisões são de medição:** uma consulta para as duas famílias (cada
     chamada é um subpedido); agregação por **dia** e não por minuto (a de minuto deu 9 113 grupos num
     só dia, com tecto que corta em silêncio; a de dia dá 2, e as duas somam o mesmo); e o alerta pelo
     **pico** e não pelo hoje (cota diária, e o pico é estável). **O que não se inventa:** zero de dia
     sem tráfego é facto; zero de falha não se escreve; as quatro falhas são declaradas com o motivo;
     o truncado diz-se; e os números são do fornecedor, com amostragem adaptativa. **DECIDIDO** e
     **APLICADO** 25/11/2026.

186. **O CUSTO POR AULA É 3 MINUTOS, NÃO 2 — E A REGRA DA SALA RECUSA O QUE ELA PEDIU.** Três
     decisões, e a terceira é um bloqueio. **(1) O modelo `2a` estava optimista.** Medido: todos os
     jobs estão abaixo de 60 s, cada um factura **1 minuto**, e a geração caiu de 110 s p50 para
     **14–43 s**; mas **um acto não é uma execução** — o «Guardar» do PO acorda **4 execuções** (3 do
     `derivados`, 2 canceladas, e um cancelado paga-se). Margem: **85,7 %** no modelo, **63,6 %**
     medido antes das ondas (`4a`), **74,6 %** medido depois (`3a`, R$ 235,80). **As ondas
     recuperaram 11 pontos de margem** que estavam a ser pagos sem ninguém ver. A alavanca seguinte,
     com a conta: o `derivados.yml` deixar de observar o pacote gerado → **2 min por aula** e os
     **85,7 %**. **(2) O contador de aulas custa zero minutos de GitHub** — lê `ciclos.json` do
     ASSETS, e o `ciclos.json` real tem `data` e `lancada`; falta **uma função**. **(3) A regra da
     sala bloqueia o cenário dela:** `estado-da-turma.js:181` diz «uma sala recebe UMA Turma por
     vez», e medido, duas curadorias na mesma sala a 14h e 16h recebem **409** com a frase «duas
     aulas no mesmo horário». A premissa de 09/11 era «uma sala = um horário»; a Sala é o ritmo e tem
     vários. O plano (`PLANO-DE-OCUPACAO.md`) põe a regra em intervalos por dia, nos **três
     recursos** — sala, professor, elenco/aluna —, e declara que `provar-mudanca-de-sala` (**41
     asserções**) terá de ser reescrita. **DECIDIDO** (o custo e o desenho) e **APLICADO** em parte
     (a regra pura e a prova, 46 asserções). **As quatro perguntas de §8 foram respondidas a 25/11**:
     alunas por modalidade — **substituir**; turma sem hora — **recusar a gravação** (mais forte do que
     eu recomendava, e a consequência é a certa: o dado fica completo e a colisão deixa de estar por
     conferir nas turmas antigas); períodos que não se tocam — **permitir**; dois elencos no mesmo
     horário — **recusar sempre**. **APLICADO nos passos 3 a 5 (25/11):** a guarda está nos dois
     sítios (criar e derivar), nomeia o **recurso**, o **dia** e **as duas horas**, e
     `alunasComprometidas` foi **apagada** — a regra das alunas por modalidade foi substituída, como
     ela decidiu. `provar-mudanca-de-sala` **48 asserções**, `provar-a-ocupacao` **49**.

187. **A SALA GANHOU FAIXAS: N AULAS POR DIA, N MODALIDADES, N PROFESSORES — e o problema era o
     MODELO, não a regra.** A tabela que apresentei dizia «mesma sala, mesmo dia, horas que não se
     tocam → recusa»; **a regra sempre permitiu**, e o que eu descrevi como recusa era a Sala declarar
     uma hora por dia. Foi corrigido por ela, e a decisão **APLICADA**: `faixasDaSala` lê a Sala como
     lista de faixas (uma Sala antiga, com o ritmo na raiz, vale como **uma** faixa — nenhum registo se
     toca), `normalizarFaixas` grava-as e `espelharFaixa1NaRaiz` põe a faixa 1 na raiz para o
     calendário e o plano continuarem a ler o ritmo. **Cada faixa leva dias, hora, duração, PERÍODO,
     modalidade e professor** — o par e o período desceram para a faixa por decisão dela (confirmado:
     com eles na Sala, a sala do piano só poderia ter uma modalidade o dia inteiro). A Turma escolhe a
     faixa (`faixa`), e uma sala com várias **recusa** a Turma que não diz qual: escolher a primeira
     poria a Turma a ocupar o horário errado em silêncio. **DECIDIDO** e **APLICADO**; falta a **tela**
     (o «+» na Sala e o campo na Turma) — **e ela está FEITA desde a tarde de 25/11** (decisão 190).
     `provar-a-ocupacao` **65**, `provar-mudanca-de-sala` **58**.

192. **O PLANO LÊ A FAIXA, NÃO A RAIZ — e o plano de observação segue-o.** Ela perguntou se derivar
     a Turma com a faixa escolhida gerava o plano correctamente. **A resposta medida foi NÃO**, e é
     consequência do modelo desta data: a raiz da Sala é o espelho da faixa 1, e o `.conf` do ciclo
     (`DURACOES`, `FREQUENCIA`, volume, total de aulas) e o ritmo que a cadeia compara liam a raiz.
     Com a Turma na faixa 2 (70 min, seg/qua), o plano saía com **55 min em três dias** — e a guarda
     `ritmoMudou` nunca disparava, porque a raiz não muda quando a faixa muda. **CORRIGIDO** por
     `salaEfetiva(sala, faixa)` — uma **projecção** da faixa na raiz, e não uma segunda leitura do
     ritmo, para não haver duas que divirjam. Uma sala de uma faixa devolve a própria Sala: a
     equivalência é exacta e dispensa migração. O `.conf` lê a faixa da **curadoria**, que chega por
     `lerCuradorias` — **recusado de propósito** pôr `faixa` no `contexto` do envelope, que mudaria
     `CAMPOS_DE_CONTEXTO` e o digest da âncora `.fipp`. **O PO segue:** `derivar-po.js:531` compõe a
     frequência e a duração **do plano referenciado**, e com o plano certo imprime o certo.
     `provar-o-plano-da-faixa.js` (**18**, 8 vermelhas sem a mudança).

193. **O LIMITE MEDIDO: duas Turmas do mesmo professor na mesma sala colidem no mesmo ficheiro.**
     A variante é `<escola>-<slug da sala>`, e o caminho é `professores/<professor>/ciclos/
     ciclo-NN-<variante>-plano.md`. Medido: a Turma na faixa 1 e a Turma na faixa 2 do **mesmo**
     professor dão a **mesma** variante (`escola-piano`) e o mesmo `ciclo-01-…-po.md` — a segunda
     deriva sobre a primeira. **PENDENTE**, e é decisão dela: incluir a faixa na variante
     **renomeia ficheiros**, e com eles a pasta do pacote e a âncora `.fipp`. Não se faz sem ela.

194. **O PAR NÃO SE REPETE NA MESMA SALA — a regra dela, e o limite que ela não fecha.** Decisão:
     «ou professor ou modalidade, diferentes do que já existe», validada no passo «Associar».
     **APLICADO** por `parRepetidoNaSala` e pela recusa `409` em `turma-professor`, que diz **qual**
     faixa e **qual** par. Lida em sentido **inclusivo** («pelo menos um difere»): uma faixa com os
     dois diferentes é legítima. **Porque é necessária, medido:** o id da Turma é `professor +
     modalidade + sala`; duas faixas com o mesmo par dão o **mesmo id** e a segunda **substitui** a
     primeira em silêncio. **O que já funcionava sem nada:** pares diferentes na mesma sala são
     aceites e os ids são distintos. **O LIMITE QUE FICA:** os **ficheiros** do ciclo continuam a
     colidir quando o **professor** é o mesmo — a variante é `<escola>-<sala>` e a pasta é do
     professor. Fechar isso exige que a variante carregue a modalidade (ou a faixa), e só toca em
     salas com mais de uma faixa, que são todas de hoje: **o custo de compatibilidade é nulo.**
     **PENDENTE por decisão dela.**

195. **A CADEIA PASSOU A DECIDIR SOBRE O DOCENTE DA FAIXA — e a frase que ela bloqueava era falsa.**
     `salaDaTurma` devolve a Sala inteira, e a raiz é o espelho da faixa 1. O ritmo já lia a faixa
     (194/192); a guarda da **autoria** não: comparava o plano com o docente da faixa 1 e, com a Sala
     dela (Balé na f1, Contemporâneo na f2), bloqueava a etapa a dizer que o professor «já não a
     dirige» — **falso**, ele dirige a faixa 2. **APLICADO** em `porTurma`, com `salaEfetiva` — a
     mesma projecção, não uma segunda leitura; uma Sala de uma faixa devolve-se a si própria.
     **CONFIRMADO** por `provar-o-plano-da-faixa.js` §F (21 asserções), com controlo negativo a
     correr: revertida a projecção, a frase falsa volta.

196. **MUDAR O PAR DE UMA FAIXA É UM GESTO — e não disparava nada.** A rota comparava a **raiz**;
     mudar só a faixa 2 devolvia `200` com «o par da sala não mudou — não há nada a percorrer», e a
     Turma daquela faixa ficava com o plano do professor antigo em silêncio. **APLICADO**: a rota
     guarda os pares de todas as faixas antes de escrever, compara um a um, e o motivo nomeia a
     faixa. **MEDIDO** pela rota verdadeira, antes e depois.

197. **MEDIDO COM A SALA DELA, E É MEIO CERTO: as duas Turmas são criadas, os ficheiros colidem.**
     `demi-plie-bale-classico-piano` (f1) e `demi-plie-danca-contemporanea-piano` (f2), ambas `201`,
     ids distintos — a regra 194 funciona. E as duas escrevem
     `professores/demi-plie/ciclos/ciclo-01-breu-piano-plano.md` (`COLIDEM no ficheiro? true`). O
     pacote gerado (`71eed979`) reflecte só o ritmo da faixa 1. **PENDENTE por decisão dela**: pôr a
     modalidade (ou a faixa) na variante quando a Sala tem mais de uma faixa; custo de
     compatibilidade nulo, mas renomeia `.conf`, plano, PO, pasta do pacote e âncora `.fipp`.

188. **A SALA NOVA NÃO PODE CRIAR COLISÃO EM SILÊNCIO — e as mensagens não sugerem resolução.** A
     edição da Sala já corria a cadeia, mas a cadeia relê o ritmo e deriva o plano; **não conferia a
     ocupação**. Medido: mudar a hora de uma sala com duas turmas podia criar a colisão **em silêncio**,
     e o conflito só apareceria quando alguém voltasse a mexer numa delas. `conflitosQueASalaCriaria`
     compara as turmas **entre si** com a sala nova, e as duas rotas da sala (`turma-editar`,
     `turma-derivar`) **recusam com 409 no gesto** — no ecrã onde aconteceu, que é o que ela pediu.
     E «Mude a hora ou o dia de uma delas» **saiu** das três mensagens: *«a gente não vai dar sugestão
     de como resolver nada. Resolver esses conflitos é papel do usuário e não nosso.»* O facto fica —
     recurso, dia, as duas horas, quem ocupa — e o caminho é de quem usa. **APLICADO**.

189. **O ACHADO QUE A IMPLEMENTAÇÃO REVELOU: A CURADORIA NÃO TEM RITMO PRÓPRIO.** Ela declara
     `turmas: [nome]` — o nome do registo da Sala —, e o ritmo (dias, hora de cada dia, duração,
     período) vive **só** no registo da Sala (`bastidores.js:3636-3656`). Duas curadorias no mesmo
     registo têm, por construção, o mesmo dia e a mesma hora. **Medido na rota verdadeira**
     (`provar-mudanca-de-sala`, B2.3): o cenário «balé 1 às 14h e balé 2 às 16h na mesma sala» **não é
     expressável no modelo de dados de hoje** — ou as duas apontam para o mesmo registo e têm a mesma
     hora, ou apontam para registos diferentes e são duas salas aos olhos do sistema. A regra pura
     aceita horas diferentes quando os ritmos são diferentes; **o que falta é onde os gravar.** A
     regra nova **endurece** (vê professor e elenco, que a antiga não via). **RESOLVIDO** pela decisão
     187: a Sala guarda faixas horárias, o ritmo **não** passa para a curadoria (a curadoria é a Turma,
     e o vínculo é dela), e a Turma diz qual faixa ocupa. A saída 2 foi **descartada por ela**.

190. **O «+» DA FAIXA E O CAMPO NA TURMA — o modelo passou a ter caminho até ele.** A aba Salas ganhou
     o «+ Acrescentar faixa horária»; cada bloco leva dias com hora, duração e período. O «+» **clona a
     faixa 1 e limpa os `id` do clone** (dois elementos com o mesmo nome no documento é o defeito que
     aparece longe da causa) e dá-lhe um `data-faixa` **novo**, `f<n>` de um contador que só cresce —
     reutilizar o número apontaria a Turma de uma faixa apagada para a que tomou o lugar dela. O «×»
     tira, renumera e **não tira a última** (uma sala sem faixa não tem ritmo). Na Turma, o campo
     **só aparece quando a sala tem mais de uma faixa**, e o rótulo de cada opção diz os dias, as duas
     horas e o par. **A leitura passou a ser POR BLOCO**: `marcados("dia")` e `horariosDoDia()` varrem
     o documento inteiro e, com duas faixas, davam os dias de todas à faixa 1 — o mesmo erro de âmbito
     que a `sincronizarHoras` tinha de evitar. **APLICADO**, com `provar-as-faixas-na-tela.js` (**51**,
     vermelha sem a mudança). O par por faixa é a decisão 191.

191. **O PAR (MODALIDADE, PROFESSOR) PASSOU A SER POR FAIXA — e o «não persistiu» era outro
     defeito.** Ela decidiu: *«faz o «Associar» perguntar o par por faixa pois precisa de docentes
     diferentes por faixa podendo até ser o mesmo».* **APLICADO**: o «Associar» continua a perguntar o
     par da faixa 1 no bloco de cima e ganhou «Quem dá as outras faixas desta sala», uma linha por
     faixa; `parDaFaixa` lê o par da **faixa escolhida** (a raiz como reserva) e a Turma deriva de lá
     o professor e a modalidade — sem isso a Turma das 10h nascia com o docente da das 9h. A rota
     `turma-professor` confere o par de cada faixa pela mesma função e **recusa a gravação inteira** se
     uma falhar, dizendo qual. **E o defeito que ela relatou** — «cliquei em derivar, acrescentei a
     faixa e não persistiu» — era meu: o «Derivar» repunha o ritmo **só na faixa 1**, com a reposição
     de antes das faixas, que escrevia os dias e as horas da sala em **todos** os blocos. A segunda
     faixa não chegava ao formulário nem ao corpo, e desaparecia ao gravar sem erro nenhum.
     `pintarFaixasNaSala` repõe cada bloco com o seu ritmo. **E um terceiro no mesmo dia:** a guarda
     da **derivação da Turma** é chamada com um objecto construído à mão e não levava `faixa` — ela
     escolhia a faixa, a tela enviava-a, e a guarda olhava para um objecto onde ela não estava
     (relato: «escolhi a faixa […] e dá a mensagem: é preciso dizer qual delas esta Turma ocupa»).
     O mesmo objecto levava `alunas: []`, e as colisões de elenco deixavam de ser vistas ao derivar.
     A guarda desceu para depois de `alunasFinais`. Do lado da tela, `pintarDaSala()` só corria
     quando o nome da sala casava com um registo vigente — «Piano» contra «Sala do Piano» caía fora
     e o campo nunca era pintado; passou a pintar sempre. Quatro defeitos meus na mesma sessão,
     todos da mesma família: **um campo novo que não chega a quem o lê**, e as construções à mão são
     o sítio onde ele se perde em silêncio. A costura que faltava medir —
     o formulário a enviar para a rota verdadeira — está em `provar-o-ciclo-das-faixas.js` (**33**,
     vermelha sem a mudança).

**A medida não é o repertório — e o objetivo 3 não tinha sujeito (03/11/2026).** Ela abriu um plano
novo, com **dois** objetivos, e a sequência mostrou «*Port de Bras*» em três blocos e uma linha a
nomear um **terceiro** objetivo. A hipótese dela era *mock data*, e a hipótese era razoável — mas
**não havia fixture**: o `wiring` da publicação não alcança a pasta de testes. O que havia eram duas
portas abertas na mesma derivação. (1) A coluna «Conteúdo do nível» lia `l.marcados` da matriz do
«Parâmetro de medição» **sem o conferir contra a curadoria** — e essa matriz aceita **qualquer**
termo, porque **medir não é curar**: o que se mede num exercício pode ser uma qualidade que a
curadoria não previu como exercício. (2) A matriz dos **blocos**, que produz as sementes, não era
filtrada pelos objetivos vivos: `marcos[n - 1] || ''` deixava passar um `marco` fora de `1..total` e
desenhava a linha com o rótulo «3» e **sem texto de objetivo**. **CONFIRMADO** por reprodução em
JSDOM, com a curadoria da turma reduzida a **Battement tendu** e **Plié**. **DECIDIDO**: *o conteúdo
de um exercício da aula é o repertório curado da turma, e só ele*; uma medida fora dele é a medida de
um exercício que já existe, e o sítio de a acordar é a **Curadoria**. A regra é uma e mora em
`motor/nucleo/sequencia.js` (`linhaForaDoRepertorio`, `linhasDoRepertorio`), consumida pelos **três**
sítios que publicam a aula: a tela, o `.md` do plano e a `aula-01.md`. A segunda metade — **sem
sujeito não é linha** — é a de `linhaOrfa`, agora aplicada também à matriz dos blocos.

**Três reservas, e as três são para não repetir o erro de sumir com o dado.** Sem repertório
carregado **não se julga** (apagar o que não se pode conferir seria a limpeza a destruir o dado); o
que fica de fora é **dito** — o rodapé nomeia o termo e aponta a Curadoria —; e a **lacuna não se
pune**: o objetivo sem exercício curado mostra `—`, a coluna continua travada, e o caminho legítimo
de ter mais é a marcação no parâmetro ou a curadoria. **CONFIRMADO** pela §7 da prova, que tem os
**dois controlos negativos**: curado o «Port de bras», os três exercícios dele aparecem; de volta o
terceiro objetivo, a linha do bloco dele volta.

**E o estado dela sobrevive em dois sítios que não são ficheiros** — vale escrevê-lo, porque é a
explicação provável de metade dos «fantasmas». O rascunho do plano vive no `localStorage` do
navegador (um plano novo, no mesmo navegador, herda as respostas do anterior) e a matriz do parâmetro
é uma grade de caixas: o que se marcou uma vez fica marcado até alguém desmarcar. **HIPÓTESE** — não
confirmada com ela. É a razão pela qual o remédio foi **filtrar na derivação**: é o único sítio por
onde todos os valores passam.

**O registo SOLTO edita-se e apaga-se; o VINCULADO só se ajusta (03/11/2026).** O «Apagar» tinha
sumido da listagem do plano — a estante antiga da porta tinha-o, e a migração para a página da Área
do Professor trouxe o «Editar» e deixou-o para trás. **CONFIRMADO** na página publicada da `breu`:
o plano solto mostrava um único `class="acao"`. E na anamnese ele era um `<a>` para o **mesmo
endereço** do «Editar», ou seja, um botão que prometia o que não fazia. **DECIDIDO**: o gesto é
**botão** (um `DELETE` não tem página de destino), exige a senha já conferida no painel, nomeia o
sujeito na confirmação, e **quem decide continua a ser o servidor** — o vinculado e o derivado não
têm o botão **e** o `DELETE` responde 409.

**Três defeitos no caminho, nenhum deles o pedido.** (1) A **rota relativa** não chegava: as rotas
de escrita vivem no roteador da porta, servido debaixo de `/anamnese` e `/plano-ensino`; relativa,
resolvia para `/area-do-professor/plano-ensino/api/…` — **404**, medido. (2) O **`apagar` do
acervo** exigia `GITHUB_TOKEN` e respondia **500** enquanto o `guardar` caía no armazenamento antigo:
assimetria invisível enquanto ninguém apagava, e que o botão tornou alcançável. (3) O `\n` da
confirmação, escrito no literal de template que gera o `<script>`, virava uma **quebra de linha
real** dentro de uma string — e o script da página inteira parava com `SyntaxError`. O escape
atravessa duas linguagens, e é preciso escrevê-lo duas vezes.

**A senha só é conferida no cliente, e isso é uma fronteira por nomear.** A rota `DELETE` não pede
senha (nunca pediu), e o Worker não tem sessão: a Área do Professor é protegida **pelo endereço**,
não por credencial. **PENDENTE**, e é decisão de segurança — não de tela.

**A sequência não inventa linha — o repertório nasce na curadoria (03/11/2026).** Ela corrigiu, horas
depois, o que eu tinha decidido na mesma sessão: **o «Adicionar linha» e o ✕ saem**, os dois. O
argumento é dela e é de negócio: «a curadoria ela é um plano também. Ela faz parte do que foi
acordado por um comitê de professores ou o diretor da escola e o professor. […] Isso quebra toda a
nossa regra de negócio, porque a gente tá gerando uma fraude. Não foi curado isso.» A origem é
descrita por ela com precisão — o exercício **nasce nos bastidores** (o verbete, com a música e o
compasso), é **acordado na curadoria** para aquela turma, e esta tabela é onde ele se **encontra**
com o objetivo e o bloco. **DECIDIDO**, e a justificativa que eu tinha dado para o ✕ («havia como
acrescentar e não como remover») estava certa na assimetria e errada na conclusão: o certo era não
haver nem um nem outro.

**O que saiu, e o que ficou no lugar.** Saíram os dois botões, o **campo livre** do «Conteúdo do
nível» (a mesma fraude por outra porta — escrever ali um exercício que não foi curado) e o `extras`
da derivação. Este último tinha um argumento que parecia bom — «não se perde o que o professor
escreveu» — e um pressuposto falso: **ele não pode escrever nenhuma célula desta tabela**. O que
sobrava era semente de uma sessão anterior. A célula derivada passou a ser **sempre** leitura, e a
lacuna mostra-se como lacuna (`—`). **CONFIRMADO** pela §5 da prova, que mede as três ausências e
tem **controlo positivo**: marcar um exercício a mais em «Parâmetro de medição» acrescenta as linhas
dele em cada bloco onde o objetivo é trabalhado — o caminho legítimo continua inteiro.

**O rodapé diz de onde a linha vem, e distingue as duas tabelas.** A sequência aponta a curadoria
como o sítio do repertório; a **distribuição do volume** — que também recebe as linhas dos blocos
marcados, mas onde a **proporção se escreve** — mantém a frase dela. A distinção é por **forma**
(`linhasDe.de`), não por id, e a prova mede as duas: uma mensagem só para as duas telas seria meia
verdade numa delas.

**A sequência acompanha os objetivos — e a pergunta «é mock?» teve resposta medida (03/11/2026).** A
tabela «Sequência de exercícios por bloco» mostrava linhas a nomear os objetivos 2 e 3 depois de a
lista ter ficado com **um**. **CONFIRMADO** no envelope dela (`plano-20261103-1644`): um objetivo e
**oito** linhas guardadas. E **não havia fixture**: a pasta `teste/` só é lida pelos bancos de
`experimentos/`, e o `wiring` da publicação (`tools/montar-publicacao.js` → `publicacao/breu` →
`wrangler.breu.jsonc`) não a alcança — o «lixo» era o que o próprio sistema tinha escrito. O bloco
estava certo (o solo saiu quando ela o desmarcou); o que ficou preso foi o **objetivo**. A linha de
um objetivo que não existe **não é memória** — a coluna é `somenteLeitura` e quem a escreve é o
sistema —, e a autoria da semente vivia num `Map` que morre com a página. **DECIDIDO**: a linha sai,
a regra é uma só (`motor/nucleo/sequencia.js`) e serve a tela, o `.md` do plano e a `aula-01.md`.

**A chave pelo NÚMERO, e é o segundo defeito do mesmo nó (03/11/2026).** A linha era reconhecida pelo
rótulo **inteiro** do objetivo; corrigir a sua redacção fazia a linha gravada não casar com a semente
e a tabela mostrava **duas** linhas do mesmo objetivo — a segunda com o texto velho e o «Conteúdo do
nível» outra vez por escolher. Era **esse** o «campo aberto/vazio» que ela relatou: o mesmo defeito
visto de outro ângulo, não um segundo. **CONFIRMADO** pela §4 da prova, e a correção é o número.

**O ✕ passou a existir, e a trava da senha deixou de o acender (03/11/2026).** Havia como
**acrescentar** uma linha e não como removê-la (`removivel: false` com `acrescentavel: true`) —
**DECIDIDO**: o ✕ existe, apagado nas linhas derivadas. E por baixo apareceu a razão de ele nunca ter
valido: `travarFormularioSemSenha` escrevia `disabled = trava` em *todos* os controles e, ao
destravar, `false` em *todos* — o ✕ acendia no instante em que a senha era validada. O mesmo com o
«−» do primeiro objetivo. Os controles travados por regra passam a ser marcados no desenho
(`data-travado-de-origem`). **CONFIRMADO** pela §5.

**A metodologia deixou de se perguntar dentro do plano (03/11/2026).** O Bloco 1 pedia duas coisas
que a curadoria já responde: «Metodologia de referência» (campo obrigatório) e «Quem escolhe a
metodologia» («Eu escolho · A escola impõe»). **O segundo deixou de existir**, e a razão não é
limpeza de tela: a resposta passou a ser **premissa do domínio** — **o professor escolhe, a
metodologia pertence ao professor**, como a modalidade —, e um facto que não varia com o ciclo não
se pergunta ciclo a ciclo. Perguntá-lo sugeria que podia variar. **O primeiro passou a leitura do
cabeçalho** (`noCabecalho: true` + `daCuradoria: 'tradicao'`), junto da escola, da turma e do
ritmo: **DECIDIDO**, e a maquinaria era a mesma que já existia — faltava a **origem**, porque havia
`daTurma` e não havia `daCuradoria`. O valor continua a ser **semeado no envelope**, e é a parte que
uma limpeza apressada teria perdido: é dele que o `.md` do plano e o PO o extraem. **CONFIRMADO** por
`provar-metodologia-no-cabecalho` (20 asserções, 5 secções, com controlo negativo: sem curadoria
não se inventa nada).

**Duas coisas que a tela mostrava e ninguém tinha visto.** `daCuradoria()` só sabia percorrer
listas — e o `for…of` de uma **string** percorre os **caracteres**: a tradição `francesa` chegava
como `f`, e o cabeçalho diria «Metodologia de referência: f». Estava latente desde que a curadoria
existe; nenhum leitor lia um campo escalar até esta volta. E os **rótulos** das tradições
(`francesa` → «Francesa») vivem em `tradicoes.json` e não chegavam à porta: passaram a vir na
**mesma resposta** de `/api/bastidores/curadoria-professor` (`rotulos`), e não numa rota nova — é o
mesmo ficheiro, é o mesmo pedido, e uma segunda leitura seria uma segunda cópia do mesmo mapa a
divergir.

**O formulário da curadoria promete só o que existe (03/11/2026).** A lista de conteúdos passou a
ser a dos **exercícios com notação** — um verbete com música e, dentro dela, ao menos um trecho —,
e não o vocabulário inteiro: eram **93** palavras para **duas** decomposições, e a lista cresce ou
encolhe sozinha com o alfabeto. **CONFIRMADO** por `provar-curadoria-e-limpeza` §A (a expectativa
derivada do alfabeto público) e pela §D (controlo negativo). Os **oito rótulos** do formulário
vestem a mesma peça, e o formulário perdeu as instruções e os estados vazios escritos por palavras
— **ficou o feedback que informa**, nove blocos contados na §E.

**O plano foi gravado, e a frase que dizia o contrário está corrigida (03/11/2026).** O primeiro
**plano de ensino** existe: `escola/breu/envelopes/plano-20261103-1644.json` (commit `b349c562`),
com o `-plano.md` derivado (`342c3ad6`) e o `.conf` da variante (`817229ff`) — a turma «Balé Nível 1
— Teste 3», o repertório da curadoria (`Battement tendu`, `Plié`, `Port de bras`) e as 27 respostas
validadas contra o contrato. **CONFIRMADO** no remoto. O que **não** existe é o **PO** — o segundo
acto, que pede esse plano —, e sem PO não há documentos. **PENDENTE**, e é o próximo passo dela.
O `GITHUB_TOKEN` do `.dev.vars` responde **401**, mas o Worker gravou: o caminho que a página usa
funciona, e o valor morto é o da bancada local.

**Um efeito da lista nova que é preciso dizer.** Um exercício entra no menu **no instante em que
ganha o primeiro trecho** — no alfabeto do repositório. Mas o Worker serve o alfabeto **embutido no
bundle**: o verbete criado pela Produção chega ao repositório e **só aparece no menu depois do
deploy** (o `deploy-escolas` dispara com `biblioteca/modalidades/**`, e é por isso que ele chega).
**CONFIRMADO** por leitura de `motor/nucleo/notacao.js` e do filtro de `paths` do workflow.

**A curadoria existe e o plano já a lê; o que falta é GRAVAR (03/11/2026).** A verificação a pedido
mediu o estado, elo por elo, e a resposta curta é: **a curadoria está registada**, o `repertorio`
dela (`Plié`, `Battement tendu`) já chega ao formulário do plano pela coluna «Conteúdo do nível», e
o ritmo da turma (qua/sex, 45 min, março a junho) já desce para o plano — **depois da correção
desta sessão**, que desfez um nome repetido em `porta/index.html`. O que **não** existe é o
**plano de ensino** e o **PO**: três medições independentes (o índice do acervo em git, o KV antigo,
e a lista ao vivo) dizem «nenhum». E o PO é o segundo ato — o formulário dele pede o plano de
ensino observado —, portanto a ordem é: **plano → PO → documentos**.

**Por que não foram gravados, e é o que trava agora.** O `GITHUB_TOKEN` do `.dev.vars` está **morto**
(401 em `/user` e na API do repositório). É o valor que `tools/criar-escola.sh --deploy` grava como
secret do Worker, e o que qualquer execução local usa. O token **do Worker** não se lê de fora — a
lista do acervo ao vivo responde com uma leitura limpa, o que é igualmente compatível com «token
válido e árvore vazia» —, mas **nenhuma gravação de envelope foi feita**, e a primeira que se tentar
dirá qual dos dois casos é (a mensagem é «o GitHub recusou a escrita: HTTP 401»). **PENDENTE**, e é
o próximo passo dela.

**A turma ficou só com o ritmo, e a auditoria que ela pediu mudou o diagnóstico (03/11/2026).** O
pedido era «auditar a edição da turma depois da curadoria»: se a turma já compõe uma curadoria, a
edição estrutural devia ser «bloqueada ou controlada». **CONFIRMADO** por leitura da rota e por
prova: o que existia era **meio bloqueio**, e o meio que faltava era o perigoso. A rota recusava
(409) a turma presa a um **plano de ensino** — a `vinculada` —, mas a turma apenas **curada**
continuava a gravar tudo, inclusive o **nome**; e a curadoria guarda o **nome**, não o id. Renomear
partia a ligação em silêncio: sem erro, sem vínculo, a curadoria a apontar para um nome que já não
existia. O defeito não era o botão que faltava — era a **assimetria** (o professor tinha três
estados, a turma tinha dois). Hoje há três nomes (`motor/nucleo/estado-da-turma.js`: `livre` ·
`curada` · `vinculada`), uma função que diz **por que** não se edita, e três leitores que a
consultam: a rota `turma-editar`, o `DELETE` e o cartão. **A turma curada não se apaga nem se
trava**: edita-se no lugar o que não parte a ligação, e renomear pede sair da curadoria primeiro.
A derivação continua a preservar a ligação, porque `turma-derivar` mantém o nome.

**O que saiu do cadastro nesta volta.** A **nota** da turma (não é usada na operação; o campo
deixou de ser copiado e o que está gravado fica) e os **conteúdos** — que eram o último resto do
enquadramento ali. A associação do conteúdo passou para o formulário da **curadoria**
(`#esc-conteudos`, o mesmo `escolhedor` das alunas, com o **nome** do termo como valor). Nada se
perde: `motor/nucleo/conteudos.js` **compõe** o mapa antigo (`turma-conteudos`, que continua a ser
lido) com o `repertorio` de cada curadoria, normalizando os dois lados pelo mesmo `idDe` — e o
cartão da turma continua a mostrar a lista. **O mapa antigo não se migra: lê-se.**

**O formulário da curadoria passou a ser inteligente.** As **modalidades** filtram-se pelas
habilitações do `perfil.json` do professor (e a nota diz quando o perfil não declara nenhuma: «o
professor não declarou modalidades»), e a **tradição** segue a modalidade. `motor/nucleo/tradicoes.js`
guarda a precedência — **a lista própria da modalidade vence a compartilhada** — e, quando a
modalidade **não tem** lista própria, cai na compartilhada: a regra nova não pode trancar o que já
funcionava (jazz, circo e contemporâneo continuam curados, e a tela diz que a lista é a
compartilhada). **NENHUMA modalidade tem ainda o seu `tradicoes.json`**: os nomes das tradições de
cada uma são **conteúdo dela** (P-16), não do agente. **PENDENTE.**

**O motor dos produtos está a meio, e o que falta é de conteúdo dela (02/11/2026).** O
`PLANO-PRODUTOS-DO-MOTOR` tem seis fases; a **2** está feita para **dois dos três** produtos
(dicionário e syllabus), com prova e CLI. O ponto exacto de continuidade:

- **A aula pronta** (o terceiro produto) não foi começada: ela é a **Regra 9** (norma congelada)
   aplicada ao nível, com o teto da faixa e os tempos de cada unidade. Depende dos verbetes e do
   conteúdo — e é a próxima peça de código.
- **A fase 1 passou a valer para os dois ficheiros, e o critério 5 fica na substância.** O **termo**
  declara o dono (`escola`), e o **verbete** passou a declarar o seu — por decisão dela a 03/11/2026,
  «o dono do alfabeto é a escola»: o registo do catálogo fica com a chave da música (`8|4/4`), o de
  uma escola leva o dono ao lado (`8|4/4@breu`) e o campo `escola` dentro, como no vocabulário. A
  precedência é uma só (`registosDaEscola`, no núcleo) e é lida pela **composição do documento**,
  pela **listagem** e pelos **produtos**: a `breu` compõe o seu texto, o catálogo e as outras escolas
  compõem o do catálogo — medido em `provar-musica-do-verbete` §C. **O ficheiro continua a ser um**:
  um caminho por escola não se embute no bundle do Worker, e é isso que mantém o critério 5 a passar
  **na substância** e não ao pé da letra.
- **A tela acompanhou a leitura.** A notação da listagem passou a três colunas — a definição do
  exercício uma vez, no topo, e a contagem com a frequência escrita —, e cada trecho do passo 6 é
  agora uma dobra fechada. Não é enfeite: com oito trechos, a versão de antes punha dezasseis
  parágrafos de prosa aberta entre o professor e o «Gravar».
- **A leitura acompanhou o dono, e esse era o último elo.** Com o alfabeto a ter dono, a listagem
  compunha com o alfabeto **embutido no build** e **sem `escola`** — e, quando a composição falhava,
  atirava fora os trechos gravados para mostrar o erro. A leitura passa a receber o alfabeto **lido**
  e a escola, cada música traz o seu `motivo`, e a composição parcial é um estado declarado em vez
  de uma frase única de falha. É o que torna visível, na tela, o que a fase 1 decidiu no núcleo.
- **A fase 3 (manifestos e pacote)** não começou. O produto tem manifesto em memória (`id`,
   `versao`, `edicao`, `licenca`, `fonte`) e **não tem âncora** — a `.fipp` própria é da fase 3. O
   campo `licenca` já **não** sai «pendente»: vem do título de `biblioteca/LICENSE.md`, com o caminho
   ao lado.
- **A fase 4 (distribuição por plano)** já sabe **o sítio** do `plano` — um ficheiro declarativo do
   repositório, nunca o KV (C11, 02/11/2026) —, e espera que a chave exista; a **5** (índice dos
   produtos) depende da 3.
- **A camada pedagógica tem lugar e não tem conteúdo.** O motor lê `exige` · `ensina` · `expressa`
   em **dois** sítios — o padrão no **termo** (`vocabulario.json`) e a sobreposição na **relação**
   (`progressao.json`), com a relação a vencer — e **escreve de onde veio** cada um. Os três nomes
   são dela (`PLANEJAMENTO-LASTRO.md` §C22) e o **lugar** foi decidido a 02/11/2026 (herança com
   sobreposição, ver §8). Hoje, **0 das 9 unidades** têm qualquer dos três — a lacuna é de conteúdo,
   e o documento diz `[Preencher]` em vez de a inventar.

**O segundo trabalho desta secção morreu, e é notícia boa:** o «plano da Batata vai ser refeito
porque o envelope perdeu Arabesque e Jeté» e o «expurgar a Batata» aconteceram — a Batata foi
expurgada e recriada, o `pe-junto` recebeu a turma `Balé Nível 1 — Teste 2`, e o ciclo existe e está
publicado (`e8a1700` e seguintes). O que resta é **um** trabalho em andamento, de código.

O que continua: a **Fase 1** do plano
(`PLANO-VERBETE-E-MUSICALIDADE.md`): o alfabeto mudou de casa e a âncora sela com que código
escreveu; o verbete ganhou posição, direção e lado; o CRUD está na Produção; o exercício é escolhido
de uma lista e o «+» cria-o no vocabulário do repositório; o formulário tem **dois modos** e a
**direção é derivada** da célula; e o **editor de célula** já cria a decomposição que faltava — sem
ele, «Gravar verbete» recusava criar o que não existisse (eram 55 exercícios para 4 verbetes). Das
**seleções no plano** (§1.6) ficou feita a primeira, e é a que se via: os **tempos e o compasso** do
«Sequência de exercícios por bloco» deixaram de ser perguntados — vêm do verbete, travados quando ele
declara uma música só e em escolha quando declara várias —, porque juntos são a **chave do verbete** e
pedi-los outra vez era a mesma redundância da quarta coluna. As outras três (`Posição`, `Direção`,
`Orientação`/`Lado`) continuam por fazer: hoje o motor lê-as do **verbete**, não do plano, e mexer
nelas muda o que o documento publica. Falta ainda a decisão dela sobre essa fronteira. O **bloco por pílulas** deixou de faltar: desde `9b318fe` não há
nenhuma lista suspensa no trecho, e a notação compõe-se de cliques. E a **arrumação do formulário**
deixou de estar em aberto: ela viu as duas bancadas e escolheu **os passos** — «o Step, apesar de ter
mais cliques, ele é mais fácil de entender» —, e o formulário passou a passos, um de cada vez, com o
trecho **editável** (`d7e71ff`). Desde 02/11/2026 são **seis**, e o primeiro é o **exercício novo**:
o «+» que abria o cadastro deixou de existir e criar o exercício é o passo. A **arrumação** também já não está em aberto: a 01/11/2026 ela pediu o contrário do
que se tinha feito a 31/10 — **o formulário volta ao padrão** (à esquerda, com a listagem presa à
direita) e a **tira dos passos sai para fora do `<form>`**, modelo da turma. Com a tira fora, os sete
passos ficaram **cinco**: o exercício, a frase e a posição são um só (`b0d781f`), e o alfabeto ganhou
**três verbetes de ensaio** (Grand battement, Arabesque, Rond de jambe à terre) para ela poder testar
sem escrever do zero — **versão 9**, selo renovado.


**O que ficou feito a 01/11/2026 (`ac6caa0`), e o que é o próximo passo.** O **P0** da revisão das
janelas deslizantes está fechado: o `;` separa os itens do PO, e os dois critérios que caíam numa
coluna são duas. O **bloco 10** do plano deixou de perguntar o que já estava respondido (a música e o
repertório), e a sequência passou a semear-se sozinha. O que falta é o **P1 — a ligação
bloco ↔ dimensão por id**: ela decidiu que `objetivosEspecificos[].blocos` (`Solo · Barra`) e as
dimensões do PO (`Técnica — Solo`) são **a mesma coisa com dois nomes**, e que a ligação é **por id**.
O recorte **já existe** no plano; o trabalho é **ligá-lo** e fazê-lo chegar ao formulário — e é
**ligação**, não invenção. O plano por fases está na resposta desta sessão e no `TRANSFERENCIA-IA.md`.

**O que ficou feito a 02/11/2026, na Aula 01 (§ secções 2, 4, 6 e 8).** A aula deixou de afirmar o
que ninguém escreveu: a §2 dizia «força e flexibilidade» sobre o campo da sala (o título vinha da
Regra 4, o corpo do formulário), a §4 tinha um «Pulso» fixo, a §6 chamava «simulado» a um ciclo
publicado e a §8 era um `[Preencher]` mudo. A **proveniência** passou a ser dois **links** com o
objetivo de cada documento ao lado (o `id` do envelope não leva a lado nenhum), o **próximo passo**
passou a dizer o **estado** em vez de explicar o conceito, com os três casos (sem marco seguinte, com
marco e sem Aula 02, com marco e com Aula 02 — aí com link), e a **musicalidade** passou a
**consolidar** o que o verbete e a sequência já dizem. De caminho: o bloco 10 do plano deixou de se
chamar «música e repertório» (são dois, com blocos próprios), a descrição fixa do verbete subiu para o
cabeçalho do exercício uma vez por igualdade medida, a **força e a flexibilidade** chegaram ao item 11
do PO vindas da anamnese, e a **geração ficou reproduzível** (o `gerado_em` vem das fontes; o `/ID` do
PDF está fixo). Novo `tools/regerar-derivados.js` põe as fontes derivadas em dia a partir dos
envelopes — mostra o que muda e só grava com `--escrever`.

**O agente é um copiloto com ferramentas de leitura — e não tem ferramenta de escrita (12/11/2026).**
Ela fechou a arquitetura do agente e pediu análise, plano e documentação. **DECIDIDO**: modelo
**Llama da Cloudflare** (Workers AI, `@cf/meta/llama-3.1-8b-instruct-awq`), **sem API externa**;
**MCP + busca estruturada**, e **sem RAG** — a chave é conhecida, e num sistema de proveniência uma
resposta aproximada é pior do que uma recusa; **o agente propõe, o professor grava**, e a garantia é
estrutural (o registo de ferramentas é só de leitura, e a prova mede-o por lista); **mesmo Worker, um
módulo**, sem Durable Object e sem sessão — a conversa vive no cliente, como em `POST /api/ia`, e o
estado do sistema continua a ser ficheiro (§4 do `ARQUITETURA-GERAL.md`). O escopo alargado, e
declarado: o agente **passa a consultar os registos da própria escola** por oito ferramentas com
contrato — o que **supera em parte** a frente **L7** e a regra 1 do §6 do `PLANEJAMENTO-LASTRO.md`,
que proibiam «consulta aos registos». O que **não** se alargou: a IA continua a não avaliar, a não
decidir e a não substituir o professor, e continua a não haver consulta livre nem entre escolas.
Documentação apenas — sem código, sem deploy, sem `wrangler` tocado; a implementação espera
aprovação do plano. **E as quatro respostas dela, no mesmo dia, fecharam o resto:** o painel começa
nas **quatro** superfícies — plano de ensino, PO, Estilo **e a elaboração da aula N** —, e a quarta
**não tem tela hoje** (pendência **já declarada**, §8), pelo que o painel entra nas três que existem
e a quarta **espera a tela**; **a anamnese saiu** da lista (é retrato, não redação pedagógica);
**o crédito é o Neuron**; o agente **pode citar o apelido** da aluna (apelido e só apelido, P-12); e
**antes de subir para o 70B aprimora-se** — a escada prompt → exemplos → ferramentas →
amostragem, cada degrau medido com os mesmos 20 casos; e, na **identidade do professor na Porta**,
ficou decidido **(c) agora, (b) depois**: o painel usa o professor declarado **e declara-o** (uma
`.caixa.nota`), o recorte por professor é **aviso e não fronteira**, e o identificador vem depois — a
fronteira que vale continua a ser a da escola. A dívida que isso expôs fica declarada:
`GET /api/envelopes` e `/api/envelope/:id` são **públicos dentro do Worker da escola**, e nenhum
recorte do agente os fecha. Ver [ARQUITETURA-AGENTE.md](ARQUITETURA-AGENTE.md)
(§1.1, §7.2, §7.2.1, §11.1), a frente **L15** e a entrada de 12/11/2026 no `REGISTRO.md`.

**Último ponto confirmado:** 02/11/2026 — `d74fda1` (a musicalidade consolida-se, e a prova da porta
volta a correr), com `cf1ef52` (a força e a flexibilidade vêm da anamnese), `469c9d5` (a proveniência
leva a algum lado) e `03be290` (a aula deixa de afirmar o que ninguém escreveu) por trás. Antes deles,
`e27e462` (o molde dos schemas passa a ter um leitor só), `570d900` (o molde volta a dizer o que a
derivação escreve), `a5275c3` (a seta sobe ao título, os passos descem à linha inteira) e `ea6cd0d`
(o exercício passa a nascer só no «+» do verbete).
A série anterior: `ac6caa0` (o que a sequência já responde não se escreve outra
vez, e o `;`), com `22b42ce` (o conteúdo da porta no scaffold), `b64bac4` (o registo do número do
roteiro) e `10bf6b6` (a correcção) por trás. Antes dele, `b0d781f` (a tira dos
passos sai do formulário, e o verbete fica em cinco). Antes dele, `885ea96` (os tempos e o
compasso vêm do verbete), `d7e71ff` (o verbete em seis passos, com o modo de edição) e `c3f0fb1` (o
plano diz por que um termo da turma não aparece). A base anterior: `b641acc` (o «lê-se»
dentro do campo e a quarta coluna fora), `48f43e2` (as definições no vocabulário), `9fb09dc` (a folha,
com motivo declarado), `4f4795a` (os dois modos, a direção derivada e o editor de célula). O
`GET /api/bastidores/termos` ao ar respondeu **200** com **87 termos** em 28/10/2026, 12 deles com
`membro` — campos que só existem no bundle atual, e que provam que o vocabulário servido é o do
repositório; o vocabulário do repositório tem hoje **93 termos**, e o ar só se confirma no deploy.

## 8. Pendências e dúvidas

### O portão da aula dada — IMPLEMENTADO a 22/11/2026, com duas portas que ele não fecha

**A REGRA, nas palavras dela.** «todas as outras aulas que estão lá no nosso calendário com o botão,
todos os outros botões, melhor dizendo, que estão no calendário, que é criar aula, eles ficam
desabilitados até que os dados lançados da aula dada estejam registados no sistema, aí habilita o
próximo e assim sucessivamente.» **DECIDIDO**: **bloquear**, e não avisar; e a aula seguinte só
depois de a anterior ser dada e lançada (a opção 2 dela).

**CONFIRMADO por medição.** O botão «Criar aula» da linha **N** nasce `disabled` enquanto a aula
**N-1** não tiver o **registro do lançamento** — `aulas[NN]` no `-dados.json`, o facto e não a data,
a mesma chave que a guarda da regeneração (`aulasLancadas`) e o índice do gerador já leem. A Aula 01
**nunca espera**. O `title` de cada botão nomeia a aula que falta, e a regra diz-se **uma vez** por
baixo da tabela — um botão desabilitado sem explicação visível parece avaria.

**Onde:** `tools/calendario.py` (`celula_da_coluna_criar`, `lancadas_do_dados`, `--dados`) e
`tools/gerar-ciclo.sh` (passa `--dados "$(fonte_dados)"`). Sem `--dados` nada é travado — «não sei»
não é «não», e é o que mantém as provas de datas iguais.

**O estado da `breu`, medido no pacote:** a Aula 02 existe e **não** foi lançada, portanto a Aula 03
está travada e as seguintes esperam a sua própria anterior. É a regra a funcionar sobre o ciclo que
ela criou fora dela de propósito, para testar. **Nota de 23/11/2026:** a `breu` foi **expurgada**, e
esta medição pertence a um pacote que já não existe — o que fica dela é o elo (267 ficheiros, as
âncoras e a impressão) e o índice do acervo com zero registos. O portão continua a valer para a
próxima escola.

**AS DUAS PORTAS QUE ELE NÃO FECHA — declaradas, porque uma trava que se contorna em silêncio é uma
promessa.** (1) O endereço `?criar-aula=NN` abre o diálogo sem passar pelo botão — é o gancho que a
prova e a partilha de ligação usam. (2) Um `POST` directo a `api/elicitar` cria a aula sem passar pela
página. Fechar a primeira exige levar o estado do lançamento até ao diálogo (que é derivado antes de o
calendário existir); fechar a segunda exige uma recusa no servidor — e uma recusa no servidor é
**decisão dela**, não minha: é a diferença entre um botão que não se clica e uma API que responde 409.
**PENDENTE** enquanto ela não disser.

### O que «Recriar» faz, e o que ele NÃO faz (23/11/2026) — medido antes de ela testar

**A PERGUNTA DELA.** «Quero que você verifique também se esse botão recriar, ele vai recriar a escola
Breu do jeito que ela estava, já com as aulas que ela tinha ou só o básico. É como se fosse criar a
escola nova, só que a escola Breu. Ela vai recriar com os alunos que já tinha? […] precisamos saber
exactamente o que que significa recriar.»

**A RESPOSTA, e ela é de desenho:** `Recriar` **não desfaz o expurgo**. Ele cria uma escola **nova com
o mesmo nome** e devolve-lhe os **documentos que foram preenchidos** e a **identidade fiscal** — não o
sistema como estava.

> **Nota de 23/11/2026 — a pergunta seguinte dela, e a resposta mudou.** «O CNPJ a partir de então vai
> surgir junto? Quer dizer, os dados da escola eles vão ser recriados também? […] recriar é aquela
> escola que a gente já tinha antes, mas aí com os dados da escola também. É isso mesmo?»
> **Era não, e passou a ser sim** (decisão 167): até aqui o cadastro guardado não voltava — a escola
> recriada ficava sem CNPJ, sem e-mail e sem telefone, o e-mail de boas-vindas saía só para o
> professor, e a aba «Os dados da escola» mostrava «guardado no expurgo» sobre uma escola viva. A
> recriação passa a repor o cadastro guardado, marcado como **herdado** (com a data de onde veio) e
> **sem herdar o CNPJ se ele já for de outra escola** — um CNPJ é uma escola.

**O CAMINHO, medido no código.** O botão de `/escolas-apagadas` **não recria**: manda um **convite**
(`POST /api/recriar-convite`) com um link de uso único, e é a escola que recria do outro lado,
escolhendo o plano e as senhas (`POST /api/recriar/<token>` → `recriarEscola`). O que esse caminho faz:

| o que | de onde |
|:--|:--|
| a escola existe outra vez (rota, Worker/shard, chaves do KV, senhas, contrato, Pix) | `criarEscola`, o mesmo da criação nova |
| a **identidade fiscal** — nome, CNPJ, e-mail e telefone da escola | `cadastros/<slug>`, o registo que o expurgo guarda antes de apagar (`herdarCadastroDoExpurgo`) |
| os **envelopes** — anamneses, planos de ensino, POs, lançamentos | `tools/restaurar-retrato.js`, a partir do `commit_antes` do elo |

**O QUE VEM DE VOLTA, medido na `breu`** (`node tools/restaurar-retrato.js --escola breu
--professores 10 --alunos 120 --seco`): retrato em `8b877844`, **76 documentos**, **2 professoras** e
**2 alunas**, nenhum documento descartado na capacidade de 10/120. Quem não couber sai — a regra é
dela: «a escolha do que fica é sequencial em ordem decrescente, ou seja, recupera os mais recentes».

**O QUE NÃO VEM DE VOLTA, e é o que ela precisa de saber antes de testar:**

- **As aulas.** Todo o `professores/demi-plie/ciclos/ciclo-01-breu-*` — na `breu` foram **169
  ficheiros**: as aulas, o plano de ensino em `.md`, o plano de observação, a notação, as capturas, o
  `-dados.json` e as âncoras `.fipp`. Eram **fontes** e foram com o expurgo. A escola volta com os
  envelopes (o que a professora **enviou**), e o ciclo é **reconstruído a partir deles** — não
  restaurado.
- **As linhas de base** (`escola/<slug>/linhas-de-base/`, 20 ficheiros na `breu`). **É uma lacuna do
  restaurador, e está declarada:** `restaurar-retrato.js` só copia `envelopes/`, e as linhas de base
  estão no mesmo commit do retrato. Elas existem lá e não são trazidas.
- **O elenco e a turma.** `bastidores/<escola>/alunas`, `/turmas` e `/curadorias` vivem no **KV**, não
  no repositório — o expurgo apaga-os, e a restauração só escreve ficheiros. As **anamneses** voltam
  (são envelopes, com o nome de cada aluna), mas a **curadoria** — quem está em que turma — tem de ser
  refeita.
- **O pacote gerado** (HTML/PDF) e as âncoras: são saída de P-04, e voltam se o ciclo for regerado.

**O QUE ISSO QUER DIZER PARA O TESTE DELA.** Recriar a `breu` dá uma escola com as fichas e os planos
enviados, **sem aulas nenhumas** e **sem turma** — o ciclo tem de ser gerado outra vez a partir do
plano de ensino. Se o que ela quer é testar o portão da aula dada, o caminho é criar a escola e
**gerar o ciclo**; se o que ela quer é ver as aulas de antes, elas **não voltam**, e o que fica delas
é o elo (o `commit_antes`, as âncoras e a impressão do conjunto) — que é o que a proveniência promete
guardar.

**PENDENTE, e é decisão de desenho:** trazer também `linhas-de-base/` no restaurador (é uma pasta do
mesmo commit, e a ausência não é intencional — é o resto de o restaurador ter nascido para os
envelopes). As fontes do ciclo **não** se trazem: elas são ancoradas, e restaurá-las sem as âncoras
faria a auditoria de proveniência falhar sobre uma escola recriada.

### O plano de observação em `/rosa/` não carrega o formulário (21/11/2026) — medido, não corrigido

**O SINTOMA.** A página em `https://breu.padd.com.br/rosa/plano-observacao/` abre e escreve «GET
/api/mapa devolveu 404»; a mesma página em `https://breu.padd.com.br/plano-observacao/` abre com o
formulário e o painel. **Medido com `curl`, uma chamada por endereço:**

| endereço | resposta |
|:--|:--|
| `/plano-observacao/api/mapa?fonte=po` | **200** |
| `/rosa/plano-observacao/api/mapa?fonte=po` | **404** |
| `/api/mapa?fonte=po` | **404** |
| `/api/saude` | 200 — o Worker está de pé, e diz `escola breu`, `origem mapa` |

**A CAUSA.** A porta pede a API **por caminho relativo** (`fetch('api/mapa')`, e são **24** chamadas
assim): a página em `/plano-observacao/` resolve para `/plano-observacao/api/…`, que o Worker serve;
a página em `/rosa/plano-observacao/`, um nível mais funda, resolve para
`/rosa/plano-observacao/api/…`, que ele **não** serve. Não é a chave nem o KV: é a profundidade.

**O QUE NÃO ESTÁ QUEBRADO.** O menu do topo aponta para `/plano-observacao/?…` **absoluto**, e é por
lá que se chega ao formulário. O endereço da cópia da turma é que fica a meio caminho.

**A CORREÇÃO, quando ela a pedir,** é de uma linha (24, na verdade) e tem de ser medida nas duas
profundidades: os `fetch('api/…')` da porta passam a absolutos (`/api/…`) — o que só é seguro se
nada servir a porta fora da raiz do Worker. Fica declarado aqui em vez de ser corrigido à socapa,
porque muda o contrato do pacote inteiro e não é o que ela pediu nesta sessão.

### O `regerar-derivados` apagava o Corpo das aulas que não conseguia reproduzir (22/11/2026) — corrigido

**O SINTOMA, medido a 22/11/2026 neste repositório.** Para pôr a listagem da anamnese em dia foi
preciso regerar as fontes derivadas. `node tools/regerar-derivados.js demi-plie 01 breu-rosa`
anunciou «linha de base: nenhuma enviada para esta turma» e, entre as linhas que saíam, as **onze
do Corpo** e todo o eixo Técnica da Aula 01 — os valores lidos das anamneses, acabados de obter
por ela. Com `--escrever` teria gravado a lacuna.

**A CAUSA não era do derivador.** Desde 07/11/2026 quem declara que uma turma lê um elenco é a
TURMA (`curadorias`, com `linhaDeBase`), e o elenco deixou de ter o campo `turma`. As curadorias
vivem no KV do Worker, e **não há no repositório um ficheiro que a ferramenta possa ler** para
refazer a ligação. Sem ela, a ferramenta não sabe qual é o elenco — e o que não se sabe não se
reescreve.

**O QUE FICOU.** Duas coisas, e nenhuma delas adivinha:

1. **Uma guarda.** Se o ficheiro no disco tem uma linha da forma `| <aspecto> | N de M em «<nível>»` —
   a marca que só a leitura do passo 3 produz — e o derivador novo não a pode produzir, o ficheiro
   é **travado**, com a frase que diz onde está a causa. É a regra de sempre: o que não se consegue
   reproduzir, não se apaga.
2. **`--elenco=<id>`**, porque quem sabe o vínculo é ela e o Worker: o id é o que
   `GET /api/bastidores/alunas-da-turma?turma=<nome>` devolve em `linhaDeBase.id`. Não é invenção —
   é o mesmo valor que a Turma declara.

`tools/` é congelado (`CONGELAMENTO.md`): a mudança tem motivo declarado, entrada no `REGISTRO.md` e
commit próprio.

### «A página não responde» no computador, e abre no telemóvel e em anónimo (21/11/2026)

**O SINTOMA, e ele custou uma manhã de investigação errada.** No Chrome do computador, o
`plano-observacao` abria uma aba que ficava «página sem resposta — aguarde ou saia da página»,
seguida de «algo deu errado»; no telemóvel abria normalmente. **Não era o sistema:** nenhum
ficheiro deste repositório escreve essas duas frases (`grep` em `motor/`, `porta/`, `tools/` →
nada) — são as telas do Chrome para o fio principal bloqueado e para o separador que caiu.

**O QUE MEDIU, E O QUE ISSO DESCARTOU.** Ao vivo: o documento responde **200** (570 KB), o
formulário abre em «respondidos 18/23», o roteiro tem 23 degraus; a timeline do Chrome não tem um
único pedido pendente (24 pedidos, 0 pendentes, 0 falhados) — **incluindo**
`/api/bastidores/alunas-da-turma?turma=Rosa`, que responde 200 em 0,55–1,11 s; 350 nós no DOM,
2–3 MB de heap, **sem crescimento** em 60 s; zero mutações de DOM e zero long tasks; e com a CPU
estrangulada a **40×** a página ainda responde em 45 ms. Em 1360×768 e em 390×844 o comportamento
é o mesmo.

**O QUE RESOLVEU.** `Ctrl+Shift+Delete` → «Todo o período» → *Cookies e outros dados do site* +
*Imagens e ficheiros em cache*. **Confirmado por ela:** «deu certo». E o diagnóstico fechou-se
com o teste que separa as duas causas: em **janela anónima abriu** — o anónimo corre sem
extensões e sem o estado do perfil.

**OS CABEÇALHOS DO SISTEMA ESTÃO CERTOS, e é isso que impede a cura de ser «limpar o cache de
vez em quando».** Medido: o HTML da porta e a lista da Área do Professor respondem
`cache-control: no-store, max-age=0`; o `assets/style.css` responde `must-revalidate` com ETag;
e o 302 de `/plano-observacao/` → `/area-do-professor/plano-de-observacao/` também vai com
`no-store`. O que estava velho era o **estado do perfil** (armazenamento local e cookies de
meses de teste), não a página servida.

**A RECEITA, para a próxima vez — e é para não repetir a investigação.** Se a página funcionar
em anónimo e no telemóvel e falhar no perfil normal: limpar os dados do site (ou o cadeado →
*Dados do site* → *Excluir*); se persistir, `chrome://extensions` e desligar tudo, religando por
metades — as suspeitas, por ordem, são o tradutor do Google (traduzir reescreve o DOM inteiro),
os modos escuros forçados e os bloqueadores. E a primeira pergunta a fazer é sempre **«abre em
anónimo?»**: são vinte segundos e separa «o sistema» de «o perfil».

**O QUE NÃO SE PERDE ao limpar.** O rascunho local (o «retomar de onde parei») desaparece; o que
está gravado no acervo não é tocado — vem do servidor.

### A modalidade mora no professor — IMPLEMENTADO a 03/11/2026, e o que resta

**As três perguntas que estavam abertas foram respondidas por ela no mesmo dia, e estão
implementadas:** a habilitação vive em `professores/<slug>/perfil.json` (nasce com a escola, edita-se
em **Bastidores · Produção → Professores → Habilitações**, e o expurgo **não lhe toca**); a turma
cuja modalidade o professor deixou de ter **não se apaga** — fica `descontinuada`, com data e motivo,
e a marca é **revogável**; e os níveis são **da turma**, com a forma da **tradição** (`grau` +
`nivel`, RAD numerada, as outras por graus). A análise completa está na **§2.2 da
`ARQUITETURA-GERAL.md`**.

**O acoplamento do código está a ZERO (04/11/2026).** Os literais de modalidade saíram: há **um único
ponto de derivação** (`modalidadePrincipal()`, em `motor/nucleo/perfil-do-professor.js`), do qual
`MODALIDADE_PADRAO` é **derivada**; a página da Produção lê `modalidadeDoCatalogo()`; e o CLI, o
`termo-repo` e o `notacao` leem a mesma origem. O número medido foi **29 ocorrências em 8 ficheiros**
— e não os «10 sítios» de 03/11: contavam-se blocos de código, e um só bloco da Produção continha
dois literais. Dos 29, **6 decidiam comportamento**; os outros eram comentários e `require`s.

**O que ainda falta — e não é acoplamento, é CONTEÚDO:** o sistema tem **uma** modalidade com
repertório (`biblioteca/modalidades/bale-classico/`). Um professor habilitado em «jazz» **vê** a
habilitação, e a escola **oferece-a** por derivação, mas não há repertório de jazz para oferecer —
porque nenhum foi escrito. O que resta não é refactor: é escrever o alfabeto de cada modalidade. A
regra que impede a recaída está dita no `ARQUITETURA-GERAL.md` §2.3 — *um literal de modalidade não
se escreve em `motor/`*.

### Nada valida os pacotes que já estão no repositório (04/11/2026)

**O `check-pacote` corre no FIM do gerador — nunca sobre o que está versionado.** Um pacote entra no
`main` quando é gerado, e a partir daí nenhum workflow olha para ele. O resultado, medido hoje:
`professores/coqui-de-redinha/ciclos/ciclo-01-breu` (12 ficheiros, versionados) reprova com **11
erros** — sem PDF, sem aulas (`aula-NN.html`), sem `-dados.json`, e com cinco ligações do
`index.html` para ficheiros que não existem. É um pacote de um formato anterior ao schema atual, e
ninguém sabe porque nada o pergunta.

**O que falta decidir, e é dela:** regerar (perde o que o pacote antigo guarda), **arquivar**
(tirar do caminho e dizer porquê), ou **aceitar como legado declarado** (uma lista de excepções com
data). O que não serve é o estado actual — um validador que só valida o que acabou de nascer.

### A decisão original, como foi tomada (contexto)

**DECIDIDO por ela a 03/11/2026.** A modalidade **nasce da competência de quem ensina**: uma escola
só oferece balé clássico porque tem quem o saiba ensinar. Pô-la na escola faria o contrário — a
escola declararia uma competência que ninguém lá tem, e o clássico viraria atributo do **edifício**
em vez do **ofício**. A escola **herda por derivação** (a união das habilitações de quem lá dá aula),
não por campo copiado.

| O quê | De quem é | Onde vive hoje |
|:--|:--|:--|
| O **conhecimento** (alfabeto + vocabulário) | da **modalidade** | `biblioteca/modalidades/<slug>/`, partilhado e versionado |
| A **habilitação** (que modalidades este professor ensina) | do **professor** | **não existe** — nenhum registo tem o campo |
| A **oferta** (o que a escola tem à venda) | **reflexo** das habilitações | **não existe** |
| A **escolha na aula** (que metodologia aquele ciclo segue) | do **ciclo** | `contexto-metodologia`, no plano (P-16) |

**O que já está feito, e o que falta — medido.** O núcleo tem a porta declarada (`MODALIDADE_PADRAO`
e os dois mapas) e a rota da Produção **já devolve** `modalidade` na resposta. Mas a modalidade está
escrita **à mão em 10 sítios de `motor/`** (dois mapas e o padrão no núcleo, dois no CLI dos
produtos, e cinco na página da Produção). **Esse número é a linha de base** do trabalho de médio
prazo: desacoplar é levá-lo a zero, e `provar-sinais-da-modalidade` §D mede-o. A ausência também
está medida: **nenhum** registo de escola declara `modalidade`.

**O que continua aberto, e é dela** (sem isto o campo nasceria com a forma errada): **(a)** onde vive
a habilitação — `professores/<slug>/perfil.json`, um campo do `.conf` do ciclo, ou o registo da
escola; **(b)** se a habilitação tem **níveis** («ensina até que nível») ou é sim/não; **(c)** o que
acontece a uma turma cuja modalidade o professor **deixou** de ter. A análise completa — com a
tabela do que fica onde e as três consequências — está na **§2.2 da `ARQUITETURA-GERAL.md`**.

### O contrato da camada pedagógica — o nome é dela, o lugar foi decidido (02/11/2026)

O motor do syllabus lê **três chaves**: `exige`, `ensina` e `expressa`. **O nome não é meu:** está no
`PLANEJAMENTO-LASTRO.md` §C22, com as palavras dela («o que ela exige do corpo, o que ela ensina, o
que ela expressa»). O que era meu era o **lugar** — e essa era a dúvida, agora **DECIDIDA a
02/11/2026**: **herança com sobreposição**.

- **o padrão vive no termo** (`vocabulario.json`): vale em todos os níveis;
- **a sobreposição vive na relação** (`progressao.json`): vale só naquele nível, e **vence sempre**.

A razão é a mesma pela qual o «método» do verbete não se repete: o mesmo passo, em dois níveis,
quase sempre **exige** a mesma coisa do corpo e quase nunca **expressa** a mesma coisa. Repetir a
exigência em cada relação faria do dado uma cópia, e a primeira correcção deixaria as cópias a
divergir. Escolher só o termo perderia a variação por nível; escolher só a relação obrigaria a
repetir o que não muda.

**E o documento diz de onde veio** — `(herdado do termo)` ou `(declarado no nível)` —, com a
contagem no manifesto (`camada_herdada` · `camada_declarada` · `camada_ausente`). Apresentar como
«do nível» o que veio do termo seria uma afirmação falsa sobre quem declarou o quê. **Herdar não é
faltar**: só a ausência nos dois lugares vira `[Preencher]` e conta como lacuna.

**O que continua aberto é o conteúdo, não a forma.** 0 das 9 unidades declaradas têm os três — e
declará-los é conteúdo (P-16), não código.

**E uma nota de leitura, que o plano já fez:** os três **não são eixos de medição** (C20) — são
prefixo de rótulo e declaração de programa. Quem mede o aluno mede nas dimensões do PO.

### As decisões sobre a aula — por nome, não por número

De `PLANO-AULA-E-OBSERVACAO.md` §9. **A numeração mudou duas vezes e já atrapalhou a própria leitura**
(a pergunta «a aula herda a sequência ou escolhe?» era a #3, não a #6). Passam a ser identificadas por
**nome** — um nome não deriva.

| Nome | Estado |
|:--|:--|
| **marco** | **DECIDIDO** — a aula **não nasce sem marco**, e o marco tem de ser **explícito**. Pode **repetir** o da aula anterior: repetir é decisão, calar não é. O plano passa a declarar um marco por lugar de aula |
| **fonte** | **DECIDIDO** — «Abrir a aula» cria a fonte `.md` e a folha de captura; o sistema pode escrever fontes |
| **sequência** | **DECIDIDO** — herança mista: herda as 14 linhas, **editáveis**, e pode acrescentar |
| **preencher** | **DECIDIDO** — os três lugares da aula **não são derivados nem perguntados em branco: são PROPOSTOS**. O sistema mostra o valor que já existe e o professor **mantém, edita, cria outro ou acrescenta** |
| **linha de base** | **DECIDIDO** — a aula N compara com o **registo da aula anterior**, alinhada ao PO |
| **materiais** | **DECIDIDO** — **entram no formulário**; a folha impressa mantém as caixas, e as duas superfícies passam a pedir o mesmo |
| **aula-object** | **DECIDIDO** — a aula nasce por um **botão**, e os documentos nascem **vazios**, «pra gente ter o objeto» |
| **sala** | **DECIDIDO** — é do **evento**: não é opcional, mas é **flexível**, remarcável até ao prazo daquela aula |
| **alinhamento** | **PENDENTE** — o passo de confirmação com o PO (peça 7) tem três perguntas próprias: a frequência (por aula ou por ciclo), a consequência de não confirmar, e se o registo entra na âncora de proveniência |
| **referências por aula** | **PENDENTE** — levantada de passagem, **não é requisito**. As referências hoje são do ciclo, não da aula; não existe campo |

**A palavra que faltava no vocabulário do projeto: «proposto».** Havia duas formas de tratar um campo
que já tem valor noutro documento — *perguntar em branco* (perde a origem) e *derivar* (perde a
decisão). A aprovada é a terceira: mostrar o que existe, com a origem declarada, e deixar o professor
manter, editar, criar ou acrescentar. **É a única que torna o delta legível** — e o delta é o que a
memória da aula registra.

**E uma correção de diagnóstico:** a §2.1 do documento de análise — «8 dos 12 itens do contexto estão
também no PO» — **não é defeito**. **DECIDIDO** que a repetição é proposital: o professor elabora o
plano de ensino e o PO em momentos diferentes e precisa dos valores à mão, **só de leitura**. A
análise foi emendada. **CONFIRMADO** que os campos não são editáveis no PO.

### Mudar os tempos apagava a decomposição em silêncio — **RESOLVIDO**, e a solução é o bloqueio

**Era uma pergunta; já tem resposta.** A dúvida, medida 02/11/2026: com as quatro células do `Plié`,
mudar os tempos de 8 para 16 — uma música que ainda não existe no alfabeto — deixava `CELULAS` em
**0** e a cobertura em **0**. Sem aviso e sem «descartar alterações?»: o trabalho desaparecia. As
três saídas propostas eram avisar antes, duplicar em vez de substituir, ou deixar como estava.

**A escolha foi dela, na terceira vez que o assunto apareceu:** «solução bloqueia. Não pode editar
esse campo.» Com uma célula que seja, os tempos ficam **só de leitura** e o compasso **desactivado**
(`aria-readonly` incluído), e a nota diz porque e qual é a saída — o **«Duplicar o exercício»**, que
escreve os tempos e as células na mesma acção e passa por cima do bloqueio **de propósito**.

**Duas coisas que o bloqueio preserva, e que se declaram:** o «Limpar» e o «Apagar» **libertam** o
campo (sem trechos, não há o que perder); e quem quer **outra música** começa outra — a
decomposição de uma música é daquela música, e isso é a decisão **63**, aplicada. **CONFIRMADO** em
`provar-celula` §23-B e §23-D (o campo travado, a nota, e a libertação depois do «Apagar»).

### A métrica da aula — o que falta declarar

A grade de exercícios mostra compasso e contagem, mas **só 1 dos 30 exercícios** os tem (o Plié do
solo), porque o plano os declarou em apenas **3 linhas**. As outras 27 saem em lacuna declarada. Não
é defeito do gerador: o plano só contribui com `Tempos` e `Compasso`, e o resto vem do verbete.

| Nome | Estado |
|:--|:--|
| **port de bras** | **DECIDIDO** — são **18 tempos, 3/4**. O verbete cobre **12** (4 compassos); os **2 últimos** saem em `conferir`. **PENDENTE** de verbete |
| **braço do port de bras** | **HIPÓTESE** — nos compassos 1 a 3 são **os dois braços juntos** («os braços abrem», plural); o compasso 4 é que separa a condução (D → E). O vocabulário de lados `D`/`E` **existe** em `ballet-classico.json` e não é usado. Acrescentar a coluna de lado resolve a pergunta «qual braço?». **PENDENTE de decisão** |
| **tendu ao lado** | **CONFIRMADO** — o Battement tendu vai à frente e depois atrás porque **o verbete é assim**: `1ª → +` e `1ª → ×`. Não há `→ lado` no verbete. Pedir o tendu ao lado é pedir verbete novo, não mudar o plano |
| **tempos e compasso dos 27** | **RESOLVIDO na origem** (`885ea96`) — vêm do **verbete** de cada exercício e não se perguntam no plano. O que continua por fazer é **preencher os verbetes** dos exercícios que ainda não os declaram: a lacuna mudou de lugar, e agora está onde o dado se decide |
| **bloco de musicalidade** | **PENDENTE** — ver abaixo |

### O bloco de musicalidade — RESOLVIDO, e a premissa estava errada

**Já não é uma pendência, e o que estava escrito aqui era um erro meu**, repetido três vezes e
corrigido pela pesquisadora:

> «Você continua insistindo que tem que haver uma pergunta a respeito da musicalidade. **Não tem que
> existir uma pergunta.** Isso já está elaborado pelo professor lá na produção (…) automaticamente
> isso já é respondido, não em forma de pergunta.»

**CONFIRMADO** que não falta nada perguntar, e a prova está no repositório: o professor **declara a
grade de contagens no VERBETE** (por música — `8|4/4` → cada célula com a contagem, a categoria e os
sinais) e **os tempos e o compasso no PLANO**. Juntos são o trabalho musical inteiro: o **pulso é a
contagem**, o **acento** é o tempo do compasso em que ela cai, a **frase** é o exercício inteiro
sobre a música.

A §4 passou a **consolidar**, em duas correções no mesmo dia:

- **a primeira** (`d74fda1`) — uma linha por **música**, com os exercícios que a usam e a grade tal
  como o verbete a declara, mais a fatia que o plano dá ao bloco. Tinha ainda duas coisas erradas: a
  linha «Exercícios neste bloco: **nenhum**» — **falsa**, porque as três linhas de exercício trazem
  `Tempos` e `Compasso` — e a «fatia do plano» dita em número solto;
- **a segunda** (esta entrega) — consolida **por compasso**, um exercício **uma vez só**, a célula
  com a contagem *e* o que cai nela, a fatia fora, e `conferir` onde a grade do verbete não fecha.

Sem nenhum `[Preencher]`. **CONFIRMADO** por `provar-o-que-vem-do-dado` (mutação: trocar a música
muda o documento; e cinco asserções que guardam a forma consolidada, entre elas «não afirma que o
bloco não tem exercícios») e pelo `.md` gerado.

**A Regra 15 — RESOLVIDA em 02/11/2026.** Ela dizia «bloco próprio em cada aula + arquivo paralelo do
ciclo»: doze palavras escritas **antes** de o verbete existir. Medido: **nenhum arquivo paralelo de
musicalidade existe no repositório** — essa metade nunca se implementou. E o «bloco próprio» partia
de uma premissa que não se sustenta. A regra **foi substituída pelo que o código faz**, e o
`REGRAS.md` — que é congelado — ganhou uma **nota de substituição** com motivo declarado, no commit
que é só dela. **CONFIRMADO**: a nota está no `REGRAS.md`, e o número das regras continua a ser 17
(o `gerar-handoff` conta 17, e nenhuma foi apagada nem renumerada).

### Os três eixos — medidos, e por isso já não são uma dúvida

A primeira leitura dizia que o modelo tinha **um** eixo (o técnico), porque `"eixo"` aparece uma vez
(`porta/po/conteudo/po.json:196`). É verdade sobre a string e falso sobre o modelo: o rótulo da
dimensão é `doPlano.eixo` + `" — "` + o bloco, o que dá «Técnica — Musicalidade» e «Técnica —
Expressão» — poiésis medida com o rótulo da técnica por cima. **CONFIRMADO** no envelope real da
`batata`.

Os três existem, em sítios diferentes, e **nenhum está declarado como eixo**:

- **corpo** — anamnese (15 campos) → PO `linha-de-base` e `restricoes` → o recorte da
  **Audição/Elenco**, que o PO lê. Falta a **ligação ao exercício**;
- **técnica** — `notacao.json`, `vocabulario.json`, `progressao.json`, plano e PO. Falta a **haste
  declarada**;
- **expressão** — música (verbete + sequência + §4), repertório, vídeo de referência, 4 termos de
  `qualidade`, e as dimensões «Musicalidade» e «Expressão» do PO. Faltam **oralidade, história da
  dança e carácter** — não têm campo nenhum.

**E o objetivo é o cruzamento, não um quarto eixo.** `estrutura-de-cada-aula` marca cada objetivo
**por bloco** (na `batata`: Barra, Centro, Musicalidade, Expressão), e cada linha da sequência traz
objetivo + bloco + exercício + tempos + compasso. Três dos quatro elementos da frase dela estão
ligados ao objetivo; **o corpo é o único que não está**. Medição inteira no `REGISTRO.md`
(02/11/2026, «CORREÇÃO: o modelo tem três eixos») e na **C20** do `PLANEJAMENTO-LASTRO.md`.

**O que fica por decidir:** transformar os três em eixos de primeira classe (nome, campo, lugar no
PO) muda a taxonomia das dimensões e a ligação bloco↔dimensão. **É da pesquisadora**, e nada foi
alterado no código.

### O motor dos verbetes — a proposta chegou, e o veredicto é VIÁVEL (C22)

A pesquisadora anunciou, a 02/11/2026: «essa parte toda aqui dos verbetes vai ter que gerar um motor,
e a gente vai criar arquivos JSON de chave e valor para o dicionário, para o syllabus e para outras
propostas que eu vou te apresentar.» E na mesma data trouxe a proposta: o **verbete é o átomo de um
syllabus**, e daí saem **quatro** degraus — **dicionário → syllabus → aula pronta → gerador**. A
verificação e o veredicto estão na **C22** do `PLANEJAMENTO-LASTRO.md`; o resumo:

- **É viável, e o átomo já tem a forma certa** — chave-valor por música, com a notação **derivada** e
  não escrita (`motor/nucleo/notacao.js` compõe `[Pé: 5ª → +]` a partir de `categoria` + `sinais`), e
  três consumidores que já o leem (a aula, o plano, o glossário). **Não precisa de modelo novo.**
- **Precisa de quatro arrumações**, e três não são invenção: (1) **identidade estável** por unidade —
  hoje o verbete é chaveado pelo **nome**, e o `PUT /api/bastidores/termo` recusa mudar o nome de um
  termo em uso porque o `id` deriva dele (é a **L2**); (2) a **separação catálogo × escola** (abaixo);
  (3) a **camada pedagógica** por unidade — o que a unidade **exige** do corpo, o que ela **ensina** e
  o que ela **expressa** (três campos, e são **de conteúdo**, P-16); (4) **uma leitura só** do
  vocabulário — hoje há duas (`lerModalidade` lê do **GitHub**, `termos()` lê do **bundle**), e é por
  isso que o termo criado não chega ao plano antes do deploy.
- **E há um pré-requisito de integridade, o mais barato de todos: 4 das 13 músicas do alfabeto têm
  `cobre` diferente dos tempos** (Rond de jambe en l'air 3 em 4, Battement dégagé 6 em 4, Battement
  fondu 6 em 2, Relevé 1 em 2). Um motor que gera produtos de átomos inconsistentes gera produtos
  inconsistentes — e a gravação **recusa** esses verbetes, o que quer dizer que os quatro precisam de
  correção **antes** de qualquer regravação. O `Plié` era o quinto: saiu da lista quando a régua
  passou a ser a **maior pista**. **É a primeira tarefa do degrau
  1, e é de conteúdo.**

**O que trava o degrau 1 não é técnico, e são duas coisas.** A **licença**: não há `LICENSE`, e a
a licença estava a definir desde 18/09/2026 (`REGISTRO.md:109`) — de quem é a descrição é pergunta
que o `fonte` distingue mas não resolve —, e foi **decidida a 02/11/2026** (`ARQUITETURA-GERAL.md`
§10, três camadas). E a **separação catálogo × escola**: `POST /api/bastidores/termo` grava em
`biblioteca/modalidades/bale-classico/vocabulario.json` (`termo-repo.js`), que é o **catálogo** — uma
escola que acrescente um termo altera o catálogo de todos. É a lacuna **(0)** da **L14**, e é
pré-requisito do degrau 1, não um detalhe dele.

**O que é dela decidir:** o que sobe para o planejamento e com que palavras; se os três eixos passam
a primeira classe (**C20**); e a ordem comercial entre os degraus. **Nada foi desenhado nem alterado
no código por causa da C22.**

**A 02/11/2026 ela decidiu avançar, e o plano está escrito.** São **três produtos** (dicionário ·
syllabus · aula pronta), gerados por **um motor** e entregues **conforme o plano contratado** — o
[PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md), em seis fases. O plano responde às três
perguntas dela — **quantos motores** (§3: um, com os manifestos a dar a granularidade), **em que
ordem** (§4: antes do ciclo, porque são matéria-prima das três fontes e tornam-se da escola na
curadoria) e **por qual plano** (§5) — e declara **nove colisões** com os planos que já existem
(§6), com o ajuste de cada uma. Três dessas colisões **mudaram texto hoje**: na **C22** (o gerador
não é o quarto produto, é o meio) e na **L14** (a turma pronta referencia o syllabus, não o contém).

**O que continua a travar, e não é código:** o mapa nível→termos (**11 dos 13 níveis vazios**), a
camada pedagógica, as **4 músicas**, a **separação** catálogo × escola — e, agora com nome e número,
**as 25 descrições sem `fonte`**, que a licença impede de entrar na edição paga. A **licença** deixou
de estar nesta lista: foi **decidida** (`ARQUITETURA-GERAL.md` §10), e falta apenas o `LICENSE.md`,
que é o texto que o contrato cita. E a fase 4 depende de **C11**: o plano contratado **não existe em
código** — `raiz/escolas-habilitadas.json` só tem `habilitada` e `pagante`.

O que **continua** em aberto desta família é outro: a **bancada**
`experimentos/propostas/proposta-musicalidade.html` (local, não versionada) propunha uma legenda de
compasso e contagem, os tempos à vista, a coluna de lado no port de bras e três colunas — e a decisão
sobre essas peças nunca foi tomada. **PENDENTE**, e agora é só sobre a apresentação, não sobre o dado.

### A aula N — pendência DECLARADA, e o que ela trava (nota de 12/11/2026)

**Isto não é achado desta fotografia.** Ela própria o declarou na sessão de 12/11/2026: *«nós até
agora temos apenas a aula um. Não criamos a aula dois, não criamos ainda uma forma de criar a aula
dois a partir dos dados coletados da aula um que foi dada. Isso está por fazer (…) esse achado não é
um achado de agora. A gente já sabia disso há algum tempo.»* E está registado desde muito antes:

- **A ordem que ela fixou a 01/11/2026** (§11): *ajustar a geração da aula → o formulário da coleta
  ser a expressão da janela → o caderno → só então o botão de criar a aula.* As duas primeiras estão
  feitas; **a terceira é o caderno**, e é a que falta.
- **A lacuna medida**, no §11: o formulário pergunta pela janela inteira, mas **a sequência executada
  não é perguntada em lugar nenhum** (o próprio `tools/lib-vistas.js` declara a lacuna) — e é o que se
  fez que a aula 2 herda. «**Definir o marco**» e «**Abrir a aula**» não existem no produto.
- **O desenho**, no `PLANO-NAVEGACAO.md` §9.2, que **propõe e declara não feita** a lista de
  documentos que dá acesso à aula.

**O que ela decidiu também a 12/11/2026, e é o que muda hoje:** primeiro **testar e ajustar o que
existe**, e só depois criar a aula 2, 3, … N. Ou seja — a pendência **não está esquecida, está
sequenciada**, e por decisão dela. **CONFIRMADO** o estado: há **uma** aula (`aula-01`) nos pacotes, e
nenhum caminho, rota ou formulário que crie a seguinte a partir do registo da anterior.

**O que a nota de hoje acrescenta, e é só isto:** a quarta superfície do agente (§1.1 do
`ARQUITETURA-AGENTE.md` — «a elaboração da aula N») **depende desta pendência**. Não é uma frente nova
nem um pré-requisito escondido: é a consequência de o painel da aula não se construir antes da tela
da aula, e de a tela da aula **ser** esta pendência. Por isso o painel do agente entra **já** nas três
superfícies que existem (plano de ensino, plano de observação, Estilo), e o da aula espera — como
espera tudo o resto que dependa dela. **PENDENTE**, com dono (a sequência da aula N) e sem data.

### As rotas de envelope não pedem senha — dívida declarada (12/11/2026)

**A exposição é anterior a esta frente; a medição é de hoje.** Lido no código a 12/11/2026: as
rotas `GET /api/envelopes` e `GET /api/envelope/:id`, servidas **sob o prefixo da porta**
(`/plano-observacao/`, `/plano-ensino/`, `/anamnese/`), **não têm conferência de senha**. O único
freio no caminho é `temProfessor(env)` (`producao.js`), que verifica se a escola **tem** professor
cadastrado — não **quem** pergunta.

**Por que isto apareceu agora.** O desenho do agente pôs `ler_envelopes` a ler a estante, e a
pergunta «o recorte por professor basta?» obrigou a olhar para a rota por baixo. Não basta — e por
isso ela fica declarada com as duas metades separadas:

- **O que o agente faz** (decidido): recorta por professor, e o recorte é **aviso e prevenção de
  acidente**, não fronteira.
- **O que o agente não faz**: fechar a rota. Quem conhece o slug continua a poder ler os envelopes
  por `curl`, com ou sem agente.

**O que fica por decidir, e é dela:** a rota passa a exigir senha (a da escola, a mesma dos
Bastidores), ou aceita-se como legado declarado — a estante é dado de aluno **cifrado em repouso**
nas anamneses, mas planos e POs vão em claro. **PENDENTE**, sem data e sem frente dona; a
`ARQUITETURA-AGENTE.md` §4.1 e §14 registam-na como dívida do projeto, para não se ler «o agente
recorta» como «a rota está fechada».

### Pendências de infraestrutura — de datas anteriores

- **A Regra 4 pede uma lista que nenhum formulário pergunta — e agora sabe-se porquê e onde está.**
  A Regra diz «pré-requisitos de força e flexibilidade declarados e contados à parte do volume», e o
  campo do plano que existe é «Condições do espaço». A força e a flexibilidade **estão na anamnese**
  e, desde `cf1ef52`, chegam ao item 11 do PO. O que fica por decidir é **a Regra**, não o código:
  ou ela passa a falar do espaço e do material, ou nasce o campo. **PENDENTE** de decisão dela.
- **O item 11 continua a pedir a formulação por palavras.** Os campos da anamnese são **lidos** ao
  lado; «o que traz» e «o que precisa desenvolver» escrevem-se. É o que o próprio `porQue` do nó diz
  desde antes — a anamnese informa, a formulação é da professora. **DECIDIDO**, não é pendência.
- **Os três aspectos macro do Lastro passaram a estar escritos — como MEDIÇÃO, não como modelo.**
  Ela declarou que toda a modalidade precisa de **força e flexibilidade**, do **elemento da
  técnica/código** e da **poiésis** (expressividade, olhar, condução, oralidade, história) — e é a
  razão de existirem o vídeo e a música. O mapa está na **C20** do `PLANEJAMENTO-LASTRO.md` e na §8
  acima. **O que continua PENDENTE** é o passo seguinte: transformá-los em **eixos de primeira
  classe** (nome, campo, lugar no PO), que mexe na taxonomia das dimensões.
- **A §3 da aula tem um título que promete mais do que o corpo.** «A sequência conectada (fio
  condutor)» encima a tabela da distribuição do tempo; a sequência está em «Exercícios da Aula 01».
  **PENDENTE** — a pesquisadora não viu o problema na descrição, e a mudança é de nome, não de dado.
- **A bancada da musicalidade** (`experimentos/propostas/proposta-musicalidade.html`, local e não
  versionada) propõe a legenda de compasso e contagem, os tempos à vista, a coluna de lado no port de
  bras e três colunas. Nunca foi aprovada nem recusada. **PENDENTE** — é apresentação, não dado.
- **Coluna única nos Bastidores:** fundir as secções `#hash` no `nav.json`. **PENDENTE**.
- **Comentário com `<h1>` literal** dentro de `tools/templates/lancamento.html`. **PENDENTE**.
- **11 provas não versionadas** que dependem de fixtures perdidas com a escola `calango`.
  **PENDENTE**.
- **O resumo do terminal do `gerar-handoff.sh` mente, e é a única coisa que mente nele.** A linha final imprime
  `variantes: $(… "$variantes" …)`, e `variantes` é a variável do **último ciclo do último
  professor** — não um total. Hoje imprime `variantes: 0` enquanto o documento diz, corretamente,
  «4 variante(s)». **CONFIRMADO** por leitura do script (linha 354) e contagem dos manifestos.
  **Não corrigido:** `tools/` é congelado e a correção não é do escopo desta fotografia.
- **A regeneração do `HANDOFF.md` não está em workflow nenhum** — depende de alguém se lembrar.
  Foi por isso que ele ficou em `6bdb06a` com o `HEAD` em `7182307`. **CONFIRMADO**.
  **HIPÓTESE** de que valha automatizar no push — não avaliado.

### Decisões à espera do utilizador — a proposta do acervo

- **A opção do «acervo com a porta» — DECIDIDA: A.** «Eu tô inclinado a usar a opção A… o botão que
  abre o acordeão pode ser do mesmo estilo do botão chamado Turma, só que ocupando a linha toda.»
  **DECIDIDO** em 25/10/2026. A bancada já mostra A com a caixinha do «Turma» na faixa inteira.
- **A regra dos botões — CONFIRMADA, não é preciso inventar.** Vive em `voltarAoPortal()`,
  `mostrarRetomada()` e no «recomeçar» de `porta/index.html`: sem memória → «Nova»; com memória →
  «Continuar de onde parei» + «Começar de novo», e «Nova» **escondido**; «Começar de novo» limpa e
  devolve «Nova». A bancada executa-a com `localStorage`.
- **A implementação no produto — FEITA em 25/10/2026.** Cinco regras novas na folha (congelada:
  motivo declarado + registo + commit próprio), a peça no catálogo, `paginaDeLista` com `painel` e
  `script`, e o painel a executar a regra da porta. **CONFIRMADO** por
  `provar-painel-do-ato` no browser (30 verificações) e `provar-listas-do-acervo` (65).
- **O ícone é a seta `▾`, não o «?»** — rodada 180° no `[open]`. **DECIDIDO** em 25/10/2026.
- **O contexto escolhido é guardado** (`ato-<escola>-<fonte>-1`), sem a senha. **DECIDIDO** — foi a
  correcção de um defeito que só a prova apanhou: sem ele o «continuar de onde parei» nunca aparecia.
- **A senha tem três estados**, e não dois: vazia, errada, certa. **DECIDIDO** — a verificação em
  produção mostrou que com a senha errada o botão ficava desabilitado sem uma palavra de explicação.

### Dúvidas sobre este próprio protocolo

- **Quem atualiza a fotografia?** Hoje, o agente, quando a mudança é material. Não há automação e
  não foi pedida. **PENDENTE**.

## 9. Validação

### Executado nesta fotografia (25/11/2026 — a analítica do Cloudflare ligada ao painel)

| Verificação | Resultado |
|:--|:--|
| a permissão de analítica, **medida** | o Worker `danca` tem o secret `CLOUDFLARE_API_TOKEN`, e o token responde ao GraphQL. `kvOperationsAdaptiveGroups` → **2 615 leituras** e **25 escritas** de 23/11; `workersInvocationsAdaptive` → os pedidos por script. **Não é preciso habilitar nada** |
| o pico da janela de 7 dias (18 a 24/11) | pedidos **2 962** de 100 000 (**3,0 %**) · leituras KV **12 804** (**12,8 %**) · **escritas KV 234** de 1 000 (**23,4 %**) · listagens **61** (6,1 %) · apagamentos **31** (3,1 %). Por Worker: `lastro-teste` 9 844, `danca` 2 574 |
| a granularidade, **medida contra a armadilha** | por `datetime` com `limit: 10000`: **9 113 grupos num só dia**, e um tecto que corta em silêncio. Por `date`: **2 grupos por dia**. Somados os dois modos no mesmo dia: **2 029 pelos dois lados, diferença zero** |
| `node experimentos/provar-a-analitica-do-cloudflare.js` (**nova**) | **43/43**. §A uma consulta e o filtro no pedido. §B os dias sem tráfego a **zero**, e um dia que falta não é o mesmo que zero pedidos. §C as quatro acções do KV e uma inventada que não entra em lado nenhum. §D as **quatro falhas declaradas**, com a permissão nomeada no 403. §E o **pico** a mandar no alerta, com o controlo negativo (só o hoje dava «folga» com as escritas a 90 %). §F o truncado. §G a página, e o aviso do «não mede» a desaparecer |
| a prova depende da mudança | **vermelha sem ela** (`git stash -u`: rebenta por não achar o módulo) |
| de ponta a ponta, pela rota **verdadeira** com a analítica **verdadeira** | **fria 1 chamada ao GraphQL, quente 0**; os 7 dias, as 5 operações e os 2 scripts; e o **pior indicador da casa a ler 23,4 %** — que é a cota das escritas de KV |
| as quatro conferências | `check-identidade` **0 problemas** (23) · `check-schemas` verde · `check-sem-destruicao` verde · `check-github-headers` 5 ok. **A classe `cota-bloco` que eu tinha inventado saiu** — a marcação passou a ser a das outras cotas |
| a regressão que a mudança causou, e o que ela ensinou | `provar-monitoramento` 104/105: a asserção dizia `naoMedido.length === 3`, e passaram a ser **5** — as **listagens** e os **apagamentos** estavam declarados nas cotas desde o início e nunca eram nomeados, e uma cota que existe e não se nomeia é uma cota que ninguém vigia. A prova passou a afirmar a **forma** (tudo o que não se mediu aparece, com a cota do plano ao lado) e não a contagem — a lição de sempre: uma prova que fixa um número de produto fica vermelha sobre um mundo melhor |
| as provas dos módulos tocados | 0 regressões depois disso (com `provar-teste` a ser a instável conhecida: **não toca no monitor**, e passa **3/3 isolada**) |

### Executado nesta fotografia anterior (25/11/2026 — os schemas num commit, e a analítica do Cloudflare)

| Verificação | Resultado |
|:--|:--|
| os commits de schema, contados no histórico | `git log --all --grep='feat(schema)'` → **109 commits**; **20 pastas** de professor com **exactamente 5** cada. Cinco `PUT /contents`, cinco pushes, cinco execuções do `derivados.yml` a 1 minuto cada, quatro canceladas **e pagas**. **80 minutos** em 20 atos |
| `node experimentos/provar-schemas-do-professor.js` | **32/32**. A secção **D** é nova: com um repositório que fala as cinco rotas do Git, **um commit** com os cinco ficheiros e **zero** `PUT`; com o `repoVirtual` de antes (só `/contents/`), os cinco entram por **cinco `PUT`** — a degradação. E a segunda passagem não escreve nada nem faz segundo commit |
| a secção D depende da mudança | **vermelha sem ela** (4 de 32), conferido com `git stash` |
| o `.conf` — a pergunta dela | **não compensa.** É escrito por `escrever-plano.js` antes de o acervo entrar, sem lote aberto; juntá-lo exigiria a fila ao nível da rota. O ganho seria **1** commit |
| a permissão de analítica do Cloudflare, **medida** | o Worker `danca` tem o secret `CLOUDFLARE_API_TOKEN`, e o token responde ao GraphQL: `kvOperationsAdaptiveGroups` devolveu **2 615 leituras e 25 escritas** de 23/11; `workersInvocationsAdaptive` devolveu os pedidos por script. **Não é preciso habilitar nada** — e a limitação declarada no `resumirCloudflare` está **errada** |
| a suite completa, e a instabilidade que ela tem | **182/278 verdes, 95 conhecidas** — e **1 a 2 «regressões» que MUDAM de prova em cada corrida** (`provar-teste`, `provar-o-parametro-do-plano`, `provar-as-tabelas-do-bloco`), todas de navegador e **todas verdes isoladas** (exit 0). **Conferido com `git stash` e a árvore limpa: a suite sem mudança nenhuma dá 2 regressões.** É o paralelismo (6 de cada vez) a competir por recursos, e é dívida do runner — declarada |

### Executado nesta fotografia anterior (25/11/2026 — o agrupamento dentro do ato)

| Verificação | Resultado |
|:--|:--|
| a factura dos runs de 23 e 24/11, lida na API | **21 execuções do «Fechar os derivados», 7 canceladas**. Duração somada dos jobs: **274 s = 4,6 min**. Facturado: **21 min** (cada job arredonda ao minuto). **4,6× de desperdício.** As 7 canceladas: 2 s, 2 s, 3 s, 3 s, 10 s, 1 s, 1 s — **22 segundos** que custaram **sete minutos** |
| o ato, commit a commit, lido no `main` | «Guardar» de 24/11 das **11:11:53 às 11:12:30**: `envelope/.indice.json` → `envelope/plano-….json` → o `.conf` → as dez fontes. **Quatro pushes em nove segundos**, quatro execuções do derivados, três canceladas. O ato das 11:15:38: três pushes, duas canceladas |
| `node experimentos/provar-o-ato-num-commit.js` (**nova**) | **30/30**. §A sem lote, dois commits (**controlo negativo**). §B com lote, um commit com os dois ficheiros. §C o pendente é visível e o mesmo nome não se cria duas vezes. §D o `criado` pergunta-se antes. §E lote vazio não faz commit, e abrir duas vezes não apaga. §F com o lote **e** o um-a-um a falhar, nada se anuncia como gravado. §G o apagar fecha o lote antes. §H degrada para um-a-um quando não há API de Git, e **diz que degradou** |
| a prova depende da mudança | **vermelha sem ela** (exit 1) e verde com ela (exit 0), conferido com `git stash` |
| as duas regressões que a mudança causou, e o que as fechou | `provar-escola-do-documento` 8/8 → 7/8: um `fetchImpl` de bancada não fala a API de Git, o fecho reprovava e **o ato deixava de gravar** → o fecho passou a **degradar** | `provar-anamnese-sem-cofre`, `provar-anamnese-da-aluna-certa`, `provar-ponte-do-worker`: o **proxy** do armazenamento devolve uma **promessa rejeitada** para o verbo que não conhece, e um `try/catch` sem `await` não a apanha → as três chamadas passaram a `await` |
| `node tools/correr-provas.js` | **277 provas, 182 verdes, 95 falhas conhecidas, 0 regressões** |
| `check-identidade` · `check-schemas` · `check-sem-destruicao` · `check-github-headers` | **0 problemas** (23 verificações) · verde · verde · 5 verificações ok |

### Executado nesta fotografia anterior (25/11/2026 — o monitoramento deixou de reler o mês)

| Verificação | Resultado |
|:--|:--|
| o filtro no pedido, **medido com `curl`** | **26 páginas e 2 600 execuções em 97,8 s** sem filtro, contra **11 páginas e 1 000 em 54,7 s** com `created=>=2026-11-01`. O tempo é a soma dos pedidos em série, que é como o Worker os faz |
| duas consequências declaradas no código | `total_count` devolve **ZERO** com o filtro — não é «não há execuções»; e a listagem filtrada **para em 1 000** (10 páginas), acima disso `truncado`. O tecto de páginas da rota desceu de 30 para **10** |
| `node experimentos/provar-a-velocidade-do-monitoramento.js` (**nova**) | **26/26**. §A o URL leva `created=>=AAAA-MM-01` e `per_page=100`. §B a paginação para quando a página sai do corte (2 páginas lidas, nenhuma quarta pedida). §C chegar ao tecto de páginas **declara-se** truncado. §D a segunda abertura não volta ao GitHub. §E **controlo negativo**: três minutos depois volta a pagar, e uma janela de outro mês não serve. §F a idade da janela chega ao retrato e à página |
| a medida de ponta a ponta, com a rota verdadeira em processo | GitHub de mentira que conta pedidos, KV em memória que persiste entre aberturas: **fria 11 páginas + 12 medições + 3 outros · quente 0 + 12 + 2**, `janelaDaCache` `false` → `true` → `true`. **Onze pedidos a menos por abertura.** A poupança em segundos (~32 s, a 2,87 s/página) é **derivada** dos dois pontos acima, e está dita como derivada |
| a conta dos subpedidos, corrigida | o comentário dizia `30 + 12 + 2 + 1 = 45` de 50; hoje são **26 na fria** e **15 na quente**, mais 1–2 de factura e conferência (de 6 em 6 horas) |
| o defeito que o controlo negativo apanhou | o prazo da cache era lido com `Number('2 * 60 * 1000')` → `NaN`, e `x > NaN` é sempre falso: a cache **nunca caducava** e os dois controlos passavam sem medir nada. Passou a ler o prazo como expressão e a afirmar que é finito antes de o usar |
| `node tools/correr-provas.js` | **276 provas, 181 verdes, 95 falhas conhecidas, 3 por tecto, 0 regressões** em **191,7 s**. Antes desta fotografia: 275/180/95 |
| `check-identidade` · `check-schemas` · `check-sem-destruicao` · `check-github-headers` | **0 problemas** (23 verificações) · verde · verde · 5 verificações ok |

### Executado nesta fotografia anterior (24/11/2026 — as ondas de higiene, cache e limpeza da suite)

| Verificação | Resultado |
|:--|:--|
| `git gc --prune=now` no clone local | **741 MB → 57 MB**. Objectos soltos: 11 501 (691 MB) → **0**. Antes do `gc`, `git fsck --unreachable` listou os 1540 inalcançáveis numa pasta de sessão; classificados como restos de `rebase`, `stash` antigos e **envelopes da `breu` que o expurgo levara** (a lista sobrevive fora do Git) |
| o `.git` depois | `git fsck` limpo, `HEAD` igual ao remoto, e `provar-ciclos-independentes` 34/34 e `check-identidade` verdes |
| `REGISTRO.md` partido por ano | **4,3 MB / 60 173 linhas → 4,5 KB de índice + `REGISTRO-2026.md` com as 812 entradas**, movidas byte a byte (`sha256 aaea6d85…`). O `gerar-handoff.sh` extrai a última entrada certa e o índice das pendências passou a citar `REGISTRO-2026.md L<n>` — conferido em L9/L46/L83 |
| `node experimentos/provar-cache-da-arvore.js` (**nova**) | **25/25**. Dois pedidos com o mesmo commit fazem **uma** árvore; um commit novo faz outra; sem KV vêm as duas; um commit que não se leu não vira chave; cache ilegível reconstrói-se. Controlo negativo: sem cache, dois pedidos fazem **duas** árvores |
| `node experimentos/provar-cache-por-tipo.js` (**nova**) | **28/28**. Página `max-age=60, must-revalidate`; asset `max-age=86400, stale-while-revalidate=604800`; nenhum `immutable`; **404 intocado**; 302 intocado; `.json` curto mesmo debaixo de `assets/`. Controlo negativo: sem o funil, página e asset saem iguais com `max-age=0` |
| **ao ar**, depois do deploy | `breu.padd.com.br/piano/plano` → `max-age=60, must-revalidate` · `…/piano/assets/style.css` → `max-age=86400, stale-while-revalidate=604800` · `…/piano/aula-99` (404) → **sem `cache-control` nenhum** |
| `node tools/correr-provas.js` (**novo**) | **272 provas, 177 verdes, 95 falhas** em **185 s**. Antes da limpeza: 301 provas, 177 verdes, 124 falhas. O que mudou foi só o lixo — ver abaixo |
| as 29 provas apagadas | medidas uma a uma antes de sair: **as 29 liam um caminho inexistente** (14 de `ciclo-01-breu-rosa/`, 11 de envelopes com carimbo fixo da `breu`, 4 de fixtures de escolas que nunca existiram). Depois: **zero** provas a ler caminhos ausentes |
| o diagnóstico corrigido | **«`python3` fora do `PATH`» estava errado.** `python3` está instalado (3.12.3) e o Node encontra-o; o `spawn` de `provar-criar-aula` falhava porque o **`cwd`** era a pasta apagada — o Node devolve `ENOENT` para um `cwd` inexistente |
| as 95 que continuam vermelhas | **NÃO foram apagadas.** São falhas de asserção (telas que mudaram, contratos que evoluíram) e apagá-las esconderia defeito real. Ficam declaradas como dívida de manutenção |
| `provar-isolamento-entre-escolas` · `provar-producao` | falham 2 e 17 — **igual com e sem** as mudanças desta fotografia (conferido com `stash`) |
| `check-identidade` · `check-schemas` · `check-sem-destruicao` · `check-github-headers` | **0 problemas** (23 verificações) · verde · verde · 5 verificações ok |

### Executado nesta fotografia anterior (24/11/2026 — a mesa dos N ciclos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-ciclos-independentes.js` (**nova**) | **34/34**. §A o caminho carrega o ciclo, `1` e `01` dão o mesmo ficheiro, e um contexto sem ciclo é **recusado**. §B duas passagens do escritor na mesma árvore não produzem um caminho em comum, e o ciclo 01 fica **byte a byte** igual. §C a aula de cada ciclo diz o seu número e o seu marcador, e **nenhuma** fonte de um ciclo contém o marcador do outro. §D a trava da aula dada é **por ciclo**: a aula 01 lançada do 01 não impede a do 02 de nascer. §E o `DOCS` é por manifesto. §F controlo negativo: sem `ciclo-NN` no caminho, os dois colidem no mesmo ficheiro |
| o defeito que a mesa encontrou | antes da correção, a asserção «um contexto SEM ciclo é recusado» **falhava**: `''.padStart(2,'0')` é `'00'`, e a guarda `if (!ciclo)` nunca disparava — o contexto escrevia em `ciclo-00-…`. O `rotas.js` já tinha um `/^0+$/.test(ciclo)` à mão, a cicatriz de uma vez anterior |
| `provar-aula-dada` · `provar-relacoes-do-ciclo` · `provar-ciclos-e-anamnese` · `provar-um-commit-por-guardar` · `provar-derivados-do-po` | 47/47 · 23/23 · 34/34 · 22/22 · 16/16 — as duas primeiras famílias depois da correção do `numeroDoCiclo` |
| `provar-manifesto-do-plano` · `provar-o-commit-do-po` · `provar-orcamento-do-guardar` · `provar-criar-aula` · `provar-o-portao-da-aula-dada` | falham, e **igual sem esta mudança** (conferido com `stash`): os dois primeiros por um `ciclo-01.conf` de escola e envelopes da `breu` que já não existem no disco, o terceiro por `python3` fora do `PATH` do processo, o quarto por ler `ciclo-01-breu-rosa/`, que o expurgo levou |
| a cadeia entre ciclos, **medida à mão** numa bancada | com o ciclo 02 ancorado (`parentHash` = `hash` do 01, `cadeia: 01-breu-piano → 02-breu-piano`), editar o plano do 01 faz o `--check` do 02 **recusar** — exit **1**, «a cadeia de ciclo-02-breu-piano deixou de bater», com os dois hashes e o remédio. Reancorado, adopta o pai novo, o 01 não é tocado, e o `--check` volta a **0**. **NÃO está numa prova automática**: quem o corre a cada push é o passo «Reancorar os ciclos que divergiram» do `derivados.yml` |
| o custo, medido nas execuções reais | **1000 execuções** entre 15/11 e 24/11: **485 min de relógio**, **1102 min facturáveis** (job arredondado ao minuto, cancelados incluídos — 2,3×). Por workflow: derivados 394→414 min (246 canceladas), publicar 230→233, gerar 81→131 (10 falhas), publicar-escolas 84→89, regerar-índices 87→87, raiz 66→66, criar-escola 20→44. **110 min/dia**, pico de **392** a 20/11. **Hoje a factura é zero**: o repositório é público |

### Executado na fotografia anterior (24/11/2026 — o manifesto declara tudo o que o escritor grava)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-aula-dada.js` (secção **F**, nova) | **47/47**. F mede o **invariante**, não uma lista copiada: *toda a fonte `.md` que o escritor grava nesta passagem está declarada no `DOCS`*. Um ciclo que nasce com `DOCS="plano aula-01 captura-aula-01"` sai com `plano harmonizacao aula-01 captura-aula-01 notacao glossario-codigo_de_danca referencias`; a ordem é a do manifesto de referência; o relatório diz o que acrescentou; um documento que o escritor não gera (`pre-requisitos`, `musicalidade-aluna`) **sobrevive** e não é atirado para o fim; e um manifesto já completo **não é tocado** |
| controle negativo | contra `aefcd3d2^` a secção F reprova **11** asserções (36/47), e o escritor aparece a gravar **seis** fontes sem declarar nenhuma — nenhuma delas `aula-01`, que já lá estava |
| `tools/gerar-ciclo.sh demi-plie 01 breu-piano` | **antes**: 20 erros (`P-17/P-21`, 3 links para páginas não publicadas, 16 «âncora inexistente») · **depois**: `OK: 0 erro(s), 1 aviso` — 9 páginas, 259 links |
| a guarda da tabela, no mesmo banco | com `notacao` retirado do `DOCS`, a tabela deixa de citar as 16 âncoras (**0** «âncora inexistente»); ficam só os dois links para `notacao.html`, que é a consequência honesta de a notação não ser publicada |
| execução `45384285428` (mesmos inputs da que falhou) | **`success`**; o pacote de `demi-plie/01/breu-piano` foi commitado (`00436bea`) com as nove páginas |
| ao ar, em `breu.padd.com.br/piano/` | `plano`, `aula-01`, `notacao`, `referencias`, `glossario-codigo_de_danca` e `captura-aula-01` respondem **200**; as **16** âncoras `#<bloco>-<exercício>-ob<N>` do plano existem todas na aula publicada. `harmonizacao.html` responde **404 por desenho** (`FORA_DA_PUBLICACAO`, decisão de 23/10/2026: vive só no pacote) |
| `check-schemas --professor demi-plie` · `check-identidade` · `check-sem-destruicao` | verde · **0 problemas** (23 verificações) · verde |
| `provar-manifesto-da-turma` · `provar-manifesto-do-plano` · `provar-manifesto-sem-base` | falham 3, 3 e 1 — **igual sem esta mudança** (conferido com `stash`): os dois primeiros são do `VOLUME_MIN_75` e de um `ciclo-01.conf` de escola que não existe no disco; o terceiro é o mesmo |
| **NÃO MEDIDO, e continua a ser o expurgo que o explica** | `provar-o-commit-do-po`, `provar-orcamento-do-guardar`, `provar-criar-aula` e `provar-o-portao-da-aula-dada` explodem em `ENOENT` **antes** de medir: os dois primeiros leem envelopes da `breu` que o expurgo levou, o terceiro não tem `python3` no ambiente desta sessão, e o quarto lê `ciclo-01-breu-rosa/`, que já não existe |

### Executado na fotografia anterior (23/11/2026 — o «Gravar» que só acende quando o pedido mudaria)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-gravar-que-so-acende.js` (**nova**) | **42/42**. §A o botão nasce `disabled` na marcação e fica apagado com o estado do professor à vista (ballet + «não ensina nenhuma»), e o `title` diz porquê. §B acende com uma modalidade nova, apaga ao desmarcá-la, e duas voltas completas devolvem-no ao apagado. §C as duas caixas que se desmentem contam nos dois sentidos. §D cancelar apaga-o e devolve as caixas. §E gravar: o pedido sai uma vez, o botão apaga-se **sem esperar pela releitura**, e mexer outra vez acende-o. §F trocar de professor apaga-o **antes** de ler; a leitura que falha deixa-o apagado com a nota e o `title` a dizer porquê. §G o mapa das tradições vai no pedido e a base acompanha. §H o perfil **sem mapa de tradições** (13 dos 15 reais): marcar «não ensina nenhuma» acende, o pedido leva a chave vazia, e desmarcá-la volta a acendê-lo com a chave ausente |
| controle negativo | `--contra=305171e6` reprova **19 de 42** |
| num Chrome, com a página real e o `fetch` de bolso | à chegada `disabled:true`, `opacity 0.4`, `cursor: not-allowed`, `title` «Nada mudou…»; ao marcar o jazz `disabled:false`, `opacity 1`, `pointer`, sem `title`; ao desmarcar volta ao apagado |
| `provar-habilitacao-do-professor` · `provar-cadastro-do-professor` · `provar-a-dobra-so-onde-ela-pediu` · `provar-o-painel-do-estudio` · `provar-ficha-na-listagem` · `provar-professor-secundario` | verde · 87/87 · 35/35 · 36/36 · 35/35 · 19/19 |
| `provar-editar-professor-principal` | 32/33 — a falha é **anterior** e igual sem esta mudança (o recado do servidor que não aparece na secção, em jsdom) |
| `check-identidade` | **0 problemas** (23 verificações) |

### Executado na fotografia anterior (23/11/2026 — a seta só onde ela a pediu, e o gravar que fecha)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-dobra-so-onde-ela-pediu.js` (**nova**) | **35/35**. §A o índice da escola (`data-tela="escola"`, 1 título) e a apresentação (`data-tela="sistema"`, 9 títulos) ficam com **zero setas**, e o `nav.js` **correu de facto** — a marca é a coluna da navegação, que só ele desenha. §B o **controle no próprio ficheiro**: a mesma página sem o atributo devolve as **9** setas (e a do índice, 1) — sem isso, «zero setas» provaria o nada. §C o título «Turmas», a frase do lastro, a ausência das duas frases recusadas, o aviso intacto, e o atalho para `/bastidores/estudio` **depois** do link da apresentação. §D gravar as habilitações **fecha** a secção, esconde o formulário, volta a seta a «Abrir o formulário», limpa o `.res` de dentro e põe a confirmação no **aviso do gesto** |
| controle negativo | `--contra=2741f55d` reprova **9**: 1 seta no índice, 9 na apresentação, e o gravar que não fecha (4) |
| num Chrome, com o pacote montado | índice **0 setas / 1 título**; apresentação **0 setas / 9 títulos**; a coluna da navegação desenhada nas duas |
| `provar-pagina-publica` · `provar-painel` · `provar-habilitacao-do-professor` · `provar-o-painel-do-estudio` · `provar-ficha-na-listagem` · `provar-cadastro-do-professor` | 79/79 · verde · verde · 36/36 · 35/35 · 87/87 |
| `check-identidade` · `hash-ciclo --check` | **0 problemas** (23 verificações) · íntegro (as âncoras não incluem `assets/`) |
| **NÃO MEDIDO, e é o expurgo que o explica** | `provar-a-seta-redonda`, `provar-dobra-do-indice` e `provar-a-raiz-sem-dobra-e-o-vazio-do-apagar` medem `ciclo-01-breu-rosa/`, o pacote que o expurgo da `breu` levou — explodem em `ENOENT` **antes** de medir, e explodem igual sem esta mudança (conferido em `stash`). O ciclo que existe hoje não tem documentos (`DOCS=""`), logo não há plano nem aula. A regra fica medida pela prova nova; quando houver um ciclo com documentos, as três revivem |

### Executado na fotografia anterior (23/11/2026 — o documento do professor pode ser CNPJ)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-cadastro-do-professor.js` (secção **D**, cinco asserções novas) | **87/87**. Um CNPJ de 14 dígitos é aceite e vai para a chave `cnpj` **com o `cpf` limpo**; a ficha devolve-o no campo próprio; voltar a um CPF **limpa** o CNPJ, para a troca não deixar os dois; um CNPJ que já é de outro professor é recusado (409) com o nome de quem o tem. O corpo aceita `documento`, `cpf` e `cnpj` — quem decide o que o número é é o comprimento, nunca a chave por onde entrou |
| `provar-editar-professor-principal` | 32/33 — a falha é **anterior** e igual sem esta mudança, conferido com o trabalho em `stash` (o recado do servidor que não aparece na secção, em jsdom) |
| `provar-professor-secundario` · `provar-estrutura-ao-criar-professor` · `provar-ficha-na-listagem` · `provar-ficha-visual` · `provar-o-painel-do-estudio` · `provar-uma-linha-por-professor` · `provar-slug-do-professor` | 19/19 · verde · 35/35 · 21/21 · 36/36 · 19/19 · verde |
| `provar-os-dados-da-escola` (**G4b** nova) | **80/80**: a criação da escola grava a ficha do professor (`professores/<slug>/contato`) com o CPF, o e-mail e o telefone que o formulário recolheu — é a mesma chave que a lista lê, e o circuito das duas portas fica fechado |
| `check-schemas` · `check-identidade` | verde · **0 problemas** (23 verificações) |
| a mensagem que nomeia a entidade certa | `normalizarCnpj(valor, {de})`, como o `normalizarCpf` já tinha desde 18/11: sem o rótulo, um número inválido no campo do professor respondia «o CNPJ da escola tem de ter 14 dígitos», e uma mensagem que nomeia a entidade errada manda corrigir o campo errado. O valor por omissão é o de sempre |

### Executado na fotografia anterior (23/11/2026 — Ações, documento e contacto na lista dos professores)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-painel.js` (secções **6a** e **6b** novas) | **110/110**. 6a: um professor com duas escolas vivas sai com **uma ação por escola** (a peça `.acoes-da-linha`); o rótulo é o **nome** da escola; o `title` marca a escola de que ele é **responsável** (e só essa); quem não tem escola viva fica com a **etiqueta**, e não com um botão vazio. 6b: o CPF sai como `CPF 233.238.240-24`, um CNPJ como `CNPJ 37.455.854/0001-72`, um `cpf` de 14 dígitos **não** é lido como CPF, o e-mail e o telefone saem com `mailto:`/`wa.me`, sem ficha são dois traços, e o nome vem da ficha quando o índice não o guarda |
| …e a **rota**, com um KV de bolso | a ficha chega do KV à página (CPF e `mailto:` à vista), o professor sem ficha fica com o traço, e **cada abertura custa um `get` por professor e nenhuma enumeração** (medido: 3 professores → 3 `get`, 0 `list`) |
| controle negativo, que a prova não tinha | `--contra=c7b1ee0f` reprova **14** asserções, e são exactamente as desta mudança. O mecanismo teve de levar `tools/` e `biblioteca/` no `git archive`: só com `motor/` o controle morria a carregar, e um controle que não corre não prova nada |
| `node experimentos/provar-os-dados-da-escola.js` | **79/79**. **D2b**: o nome do professor é `<a href="/professores">` e o CPF dele **já não aparece** na aba. **C4b**: `professorCpf` deixou de vir no feed — o documento mudou de casa, e a ausência é o que a mudança decidiu |
| `provar-recriar-escola` · `provar-o-financeiro-que-fica` · `provar-os-restos-do-expurgo` · `provar-pagina-publica` · `provar-form-escola` · `provar-painel-do-estudio` | 94/94 · 30/30 · verde · 79/79 · todas verdes · 36 asserções |
| `provar-financeiro-da-escola` | 129/136 — **as mesmas 7 falhas de antes** desta mudança |
| `check-identidade` · `check-indices` · `check-schemas` | **0 problemas** (23 verificações) · 16/16 · verde |
| a geometria, em Chrome, a 1366/1280/900px | cinco colunas; tabela de **900 · 900 · 852px**, sem transbordo; `Ações` com 156px e botões de 139×45, **dois empilhados** para o professor de duas escolas; **nenhuma rolagem horizontal** |
| a página com o acervo de produção | **31 linhas, 31 «sem escola viva», 0 botões** — as quatro escolas do índice estão expurgadas hoje, e é a verdade do índice; os botões aparecem quando houver escola viva |

### Executado na fotografia anterior (23/11/2026 — a senha do professor não se esconde com o modo)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-cadastro-em-etapas.js` (secção **D** com sete asserções novas) | **49/50**, e a única falha é **anterior** a esta mudança: «o público deixa de ter «Ver só as vivas»» — a string `/escolas-vivas` sobrevive dentro do `<script>` do «apagar escola», que `removerDoPainel` não reescreve (é um `href` que já não tem alvo: o `<a data-dono>` sai). O mesmo em `bd87f249`, com **42/49**. As novas: o campo existe; **não** vive dentro de `#bloco-novo` nem de `#bloco-existente`; com «já existe» escolhido o bloco do professor novo está escondido **e o campo da senha não tem nenhum avô escondido**; o recado diz «ESTA escola» nesse modo e muda de texto no modo «novo»; com a senha vazia a etapa pede a senha do professor (e não o professor); preenchida, a etapa 2 vai à 3 |
| a **árvore**, e não o `hidden` do elemento | é a forma do defeito: um campo pode ter `hidden = false` e estar dentro de um avô escondido. A asserção sobe pelos ancestrais à procura do primeiro escondido, e mede-se **com a etapa 2 à vista** — na etapa 1 o avô escondido seria a própria `#etapa-2`, e a prova mediria a etapa em que se está |
| controle negativo, com a âncora escolhida | `--controle-negativo=bd87f249` (o estado imediatamente antes) reprova **exactamente as quatro** asserções que descrevem o defeito: o campo dentro de `#bloco-novo`, o avô escondido `bloco-novo`, e o recado (duas). Contra a âncora antiga (`a4676abe`, o formulário sem etapas) a asserção principal passava **por ausência** — e uma asserção que passa por o bloco não existir não prova nada |
| `provar-form-escola` · `provar-pagina-publica` · `provar-painel` · `check-identidade` | 36 verificações, todas verdes · 79/79 · verde · **0 problemas** (23 verificações) |
| a peça, e o desvio que ela barrou | o `span.sub` usado para a nota reprovou a **checagem 8 (Peça)** — «a classe `sub` é usada em `raiz/index.html` e não é desenhada em lugar nenhum». A nota passou a ser a peça `.aviso` já catalogada, que a linha imediatamente abaixo já usava |

### Executado na fotografia anterior (23/11/2026 — o CNPJ entra à mão, e a criação herda)

| Verificação | Resultado |
|:--|:--|
| os dois CNPJ, antes de entrarem | conferidos pelo **dígito verificador**, em código: `37.455.854/0001-72` **VÁLIDO** e `62.728.967/0001-41` **VÁLIDO**. Um número com um dígito trocado seria recusado pelo formulário e ficaria a parecer um dado bom |
| **ao vivo**, no painel de produção, sem deploy | `calango` · 37.455.854/0001-72 · grimpacia@gmail.com · **guardado no expurgo** · `batata` · 62.728.967/0001-41 · grimpacia@gmail.com · **guardado no expurgo** · `breu` e `duo` continuam **sem cadastro** (o `breu` de propósito, para ela testar o preenchimento à mão) |
| `node experimentos/provar-os-dados-da-escola.js` (secção **G** nova) | **76/76**. G1 o que falta vem do registo guardado e diz de onde veio; G2 o que a escola declarou agora **não** é substituído; G3 com tudo declarado não há herança, sem registo devolve `null`, e um registo sem dados não escreve `herdadoDe`; G4 a criação grava o CNPJ e o e-mail herdados, marca-os e conta-o no desfecho; G5 o formulário que trouxe os campos não é sobreposto e nada fica marcado; G6 um CNPJ ocupado por **outra** escola não é herdado (o e-mail fica) e o desfecho nomeia a escola que o tem. Controle `--contra=f0186400`: **19 de 28 reprovam** |
| `provar-o-financeiro-que-fica` · `provar-recriar-escola` · `provar-painel` · `provar-pagina-publica` · `check-identidade` | 30/30 · 94/94 · verde · 79/79 · **0 problemas** (23 verificações) |
| `provar-financeiro-da-escola` | 129/136 — **as mesmas 7 falhas de antes** desta mudança |

### Executado na fotografia anterior (23/11/2026 — a recriação traz os dados da escola)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-os-dados-da-escola.js` (a secção **F** é nova) | **61/61**. **F1.** a recriação repõe o cadastro guardado — CNPJ, e-mail, telefone e nome —, com `herdadoDe` (a data do expurgo de onde veio) e `origem: 'recriacao'`. **F2.** um cadastro que já existe com conteúdo **não** é sobreposto. **F3.** um CNPJ que já é de **outra** escola **não** é herdado (o resto é), e o desfecho diz qual é a escola que o tem. **F4.** sem registo guardado não se escreve cadastro nenhum. **F5.** sem KV, `ok:false` — a recriação não cai por isso. **F6.** a escola recriada passa a ser lida como `herdado`, com a data, e a célula diz «herdado do expurgo». **F7.** um cadastro **vivo mas vazio** (três traços) não esconde o registo guardado. **F8.** `recriarEscola` chama a herança **depois** do `disparo` (a ordem está afirmada sobre o texto), e o nome sai do registo guardado quando não há vivo. **F9.** a página do convite só promete os dados quando os há. Controle `--contra=f0186400`: **18 de 27 reprovam** |
| o ciclo completo, num KV de bolso | expurgo guarda (`expurgos:1, cnpj:true`) → a limpeza apaga `bastidores/breu/cadastro` → a recriação herda (`herdado:true, cnpj:true`) → a aba lê `fonte:'herdado'` com o CNPJ e os contactos → um segundo expurgo deixa **2 elos**, com o mesmo CNPJ em cada |
| a promessa da página do convite, nos três casos | com registo e CNPJ: «o nome, o CNPJ e os contactos — ficaram guardados, e voltam com a escola» · com registo sem CNPJ: «o nome e os contactos… O CNPJ não está entre eles: a escola não o tinha declarado» · **sem** registo: «Não há dados de identificação desta escola guardados: o expurgo dela é anterior a 23/11/2026» |
| `provar-o-financeiro-que-fica` · `provar-recriar-escola` · `provar-painel` · `check-identidade` | 30/30 · 94/94 · verde · **0 problemas** (23 verificações) |
| `provar-financeiro-da-escola` | 129/136 — **as mesmas 7 falhas de antes** desta mudança (`jsdom` na página da escola) |

### Executado na fotografia anterior (23/11/2026 — a identidade fiscal sobrevive, e os dados têm aba)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-os-dados-da-escola.js` (**nova**) | **42/42**. **A.** `cadastros/breu` **não** é alcançada por `prefixosDaEscola('breu')` — é a razão de a chave sobreviver; o expurgo grava o CNPJ, o e-mail e o telefone da escola e o CPF, e-mail e telefone do professor, com o motivo e o instante; **não** grava alunas, documentos nem turmas; o KV que falha dá `ok:false` sem derrubar o expurgo; uma escola sem cadastro grava `cnpj: null` em vez de inventar. **B.** dois expurgos → dois elos, o mais antigo intacto, e o leitor devolve o último. **C.** a viva traz o cadastro dela, a expurgada traz o do expurgo, a sem registo traz `null`, o contacto do professor vem da chave da pessoa, e o cadastro **vivo manda** sobre o histórico numa escola recriada. **D.** a aba existe e é a última, o CNPJ está à vista, `mailto:` e `wa.me` funcionam, o selo «sem cadastro» e o aviso aparecem, a tabela é paginada. **E.** `slugificar('Breu')` = `breu` e `slugificar('Breu Dois')` = `breu-dois`; o fixture é 3 nos dois (o nome, não o CNPJ); um CNPJ novo não colide e o repetido devolve o slug. Controle `--contra=f0186400`: **13 de 22 reprovam** |
| as guardas da criação, medidas sem criar nada | `escolaExiste('breu')` → **404** (shard, sem Worker próprio) · `pendenciaDoKv` → nenhuma (elo com `kv.ok: true`) · `criar-escola.sh` → sem `ciclo-01-breu.conf`, sem pacote, sem `wrangler.breu.jsonc` · mapa `escolas/por-host` = `{}` · KV: **0** chaves sob `breu/` e `bastidores/breu/` · o CNPJ da `breu` expurgada **não existe** em sítio nenhum (KV, repositório e histórico do Git) |
| `node experimentos/provar-o-financeiro-que-fica.js` · `provar-recriar-escola` · `provar-painel` | 30/30 · 94/94 · verde |
| `node experimentos/provar-financeiro-da-escola.js` | **129/136** — a asserção das abas passou a exigir as **quatro**, com «Os dados da escola» no fim; as **7 falhas são as de antes** desta mudança (todas de `jsdom` na página da escola) |
| `node tools/check-identidade.js` | **0 problemas**, 23 verificações — a aba não inventa peça nenhuma (`abas`, `tabelaPaginada`, `selo`, `caixa nota`, `aviso`, `dono`); a regra nova do «como falar» é documento |

### Executado na fotografia anterior (23/11/2026 — o financeiro de uma escola expurgada não se apaga)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-financeiro-que-fica.js` (**nova**, substitui a de 17/11 que media a regra contrária) | **27/27**. **A.** Uma escola **sem contrato** tem os **7 meses que pagou**, tirados do livro (era zero); todos pagos, do mais recente para o mais antigo, com o valor e o plano de cada mês; sem contrato não se inventa valor a cobrar; e sem livro continua vazio. A escola **com** contrato continua a contar desde a adesão. **B.** `breu-rosa` só vê os meses dela — igualdade do slug, não prefixo. **C.** A expurgada **com** histórico entra no extrato com `expurgada: true` e a data; a **sem** histórico fica de fora; a viva entra sem marca e com o contrato em vigor. **D.** O cartão dela escreve «Escola expurgada em 22/11/2026 às 22:00» e **não tem nenhum** dos quatro ganchos de cobrança (`data-pagar`, `data-pagamento-gravar`, `data-ensaio-ligar`, `data-contrato-gravar`); o da viva tem os quatro. **E.** `mensalidades.apagarEscolaDoLivro` já não existe e a raiz não a chama. Controle `--contra=838938c2`: **16 de 27 reprovam** |
| o livro, no KV de produção | **as 7 linhas da `breu` repostas** (`2026-11` a `2027-05`, R$ 239,90 → R$ 159,90) a partir da cópia tirada antes de as apagar; `{"lista":[7 linhas]}` lido de volta do Cloudflare depois do `PUT` |
| `node experimentos/provar-os-restos-do-expurgo.js` (a secção do livro saiu — a regra mudou de dono) | **16/16**; o controle `--contra=8b877844` reprova **3 de 10** (o pathspec vazio e a poda da cache) |
| `node experimentos/provar-recriar-escola.js` | **94/94** — e a asserção da coluna passou a exigir **`Ações`**: `<th>Ações</th>` é a última, e `<th>Recriar</th>` já não existe |
| `node experimentos/provar-financeiro-da-escola.js` | **129/136** — as **7 falhas são as de antes** desta mudança (128/135 antes, mesmas sete, todas de `jsdom` na página da escola). A asserção «sem contrato datado não tem mensalidades» foi **actualizada** para a regra de hoje: sem contrato não há mês a cobrar, e os que estão no livro aparecem pagos |
| `node tools/check-identidade.js` | **0 problemas**, 23 verificações — a regra nova da coluna `Ações` é documento, não código: nenhuma peça nasceu |
| `provar-bancadas-e-expurgo` · `provar-lista-do-expurgo` · `provar-a-carencia-nao-se-burla` | 22/22 · 26/26 · 50/58 (as 8 falhas são anteriores, medidas com `git stash`) |

### Executado na fotografia anterior (23/11/2026 — o expurgo da `breu` não deixa restos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-os-restos-do-expurgo.js` (**nova**) | **25/25**. **A.** O passo do `derivados.yml` é **extraído do arquivo** e corrido num repositório de verdade: sem âncora nenhuma não morre (era exit 128) e o índice entra no commit; uma âncora solta entra; uma âncora **apagada** entra como apagamento (o `-A`). **B.** O livro perde as linhas da expurgada e **nenhuma outra**, reescreve o carimbo, devolve `removidas: 0` sem trabalho e `ok:false` quando não há KV ou quando o KV explode. **C.** O desfecho leva o livro; um livro falhado põe o bloco a `ok:false` (inclusive sem namespace declarado, onde antes o bloco era `null` e a falha desaparecia); a cache perde a morta, guarda a viva, não muta o mapa de entrada, e distingue `null` (não perguntei) de `[]` (perguntei e não há). Controle `--contra=8b877844`: **8 de 12 reprovam**, e o `A1` reproduz o `fatal: pathspec '*.fipp'` |
| `node tools/check-indices.js`, depois de regerar | **16/16** — antes: 2 falhas na verificação 1 (os dois mapas de relações órfãos). A `breu` passa a `expurgada: true` com **0 registos** e `expurgada_em` lido do elo, e saem `indices/ciclos/demi-plie/01-breu.json` e os dois `indices/relacoes/demi-plie/01-breu*.json` |
| a árvore, depois do expurgo | `268` arquivos no commit; **267** no elo (`apagado`), com `commit_antes`, `kv.ok` e a proveniência auditada (4 âncoras, impressão `04055f36…`). Ficam `escola/breu/indice.json`, `indices/escolas/breu.json` e `teste/breu.json` (fixture), e do professor fica o `perfil.json` e os 5 schemas |
| o KV, nos três namespaces | **0** chaves com «breu» no nome em `ciclos-escolas`, `ciclos-escolas-plano-b` e `ciclos-escolas-maria`; `escolas/por-host` e `contatos/entradas` sem o nome |
| o Cloudflare | scripts: só `danca` e `lastro-teste` · nenhuma rota de zona com «breu» · nenhum registo DNS com «breu» · `breu.padd.com.br` → `curl` exit **6** («could not resolve host») |
| **ao vivo**, depois do deploy `3a29feee` (e a nota de que o livro foi limpo por engano nesse dia — ver a fotografia acima) | «Fechar os derivados» **success** às 01:12:08 — na **mesma árvore sem âncoras** em que tinha falhado às 01:00:57 · «Publicar o sistema» success, script de 01:12:28Z com as funções novas · `financeiro/mensalidades` = `{"lista":[]}` — e **[CORRIGIDO às 22:20 do mesmo dia: as 7 linhas foram repostas, por decisão dela]** · `monitor/cache` = `chaves: {}` · `GET /api/escolas` devolve **lista vazia** e **nenhuma** ocorrência de «breu» no corpo |
| `provar-o-cadastro-comercial-nao-se-perde` · `provar-bancadas-e-expurgo` · `provar-lista-do-expurgo` · `check-identidade` | 29/29 · 22/22 · 26/26 · 0 problemas (23 verificações) |
| as duas que reprovam **antes e depois** | `provar-a-carencia-nao-se-burla` **50/58** e `provar-financeiro-da-escola` **128/135** — medido com `git stash`: idênticas com e sem esta mudança, portanto **anteriores** e não causadas por ela |

### Executado na fotografia anterior (22/11/2026 — o registo comercial não se perde ao desabilitar)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-cadastro-comercial-nao-se-perde.js` (**nova**) | **29/29**: desabilitar uma escola **com** contrato preserva plano, valor, capacidade, as datas e o histórico (que cresce em vez de recomeçar); desabilitar uma **sem** contrato grava um registo sem `semRegisto` nem `motivo`; o registo que ela viu (suspensa + data + `semRegisto`) passa a **pode: true**; o vazio de verdade continua a recusar com a frase honesta; a habilitada recusa pelo motivo certo; a carência devolvida é **exactamente 60 segundos**; e o ciclo inteiro (sem registo → desabilitar → 61 s → pode) fecha. Controle `--contra=e73342a6`: **12 de 29 reprovam** |
| o registo real da `breu`, antes e depois | **antes** (00:13): `{estado:ativa, plano:basico, valor:"R$ 79,90", capacidade:{aulas:120}, habilitadaEm, criadoEm, historico:[6]}` · **depois do defeito** (00:42): `{estado:suspensa, semRegisto:true, plano:null, historico:[1]}` · **reparado**: o contrato de volta + o elo real da suspensão, `semRegisto` fora. `estadoDoExpurgar` → `pode: true` |
| a causa da perda, medida | `prefixosDaEscola('breu')` = `['breu/', 'bastidores/breu/']` — a limpeza do KV do expurgo apaga `bastidores/breu/comercial`, que é o registo que autoriza o expurgo. **PENDENTE** como desenho: um expurgo falhado deixa a escola sem cadastro, e a recuperação é desabilitar outra vez (agora funciona, e leva 1 minuto) |
| `provar-pagina-publica` · `provar-painel` · `provar-a-raiz-sem-dobra-e-o-vazio-do-apagar` | 79/79 · verde · 21/21 |

### Executado na fotografia anterior (22/11/2026 — a campanha sem seta, e o vazio do apagar)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-raiz-sem-dobra-e-o-vazio-do-apagar.js` (**nova**) | **21/21**: a raiz (que serve `danca` e `lastro`) declara-se `data-tela="raiz"`, tem **10 títulos** de secção e **0 botões** de dobra e **0 corpos** de secção — o mesmo `nav.js` continua a dar os botões a um documento do pacote (o controle que impede «zero por a página não correr o script»). O vazio do apagar em quatro casos: sem escola → «não há escola nenhuma»; uma travada → nomeia-a, repete o motivo **do servidor** e liga às escolas vivas; 12 travadas → conta-as e corta em 8 com «…e mais 4»; sem cadastro comercial → o motivo do servidor é dito e **não** se manda desabilitar (não há estado); os dois motivos na mesma lista → a dica de desabilitar aparece e o rodapé conta as sem cadastro; uma expurgável → o cartão aparece e **nenhum** motivo se imprime (a regra de 16/11). Controle `--contra=02f53906`: **13 de 21 reprovam** — a campanha tinha **9 botões** e o vazio dizia «Não há escola para apagar» sobre uma escola que existe |
| `node tools/check-identidade.js` (checagem **20, Seta**, ampliada) | **0 problemas**, 23 verificações. Além de comparar a geometria das duas declarações, passou a exigir que `TELAS_SEM_DOBRA` exclua `raiz` e `porta` e que a raiz se declare `data-tela="raiz"`. Testada a recusar: sem `raiz` na lista, o erro nomeia a tela |
| o estado real da `breu`, medido no KV | `{"estado":"ativa","habilitadaEm":"2026-11-17T00:41:26.797Z"}` — **sem `desabilitadaEm`**. É por isso que ela não aparecia para expurgo: a regra de 16/11, não um defeito do modal. A carência em regime de teste é de **minutos**, portanto o caminho é desabilitar → esperar → apagar |
| `provar-pagina-publica` · `provar-painel` · `provar-a-seta-redonda` · `provar-a-musica-do-modal` | 79/79 · verde · 21/21 · 42/42 |
| `gerar-raiz` · `gerar-ciclo` · `check-pacote` | a raiz regerada sem dobra · 0 erros · 0 erros |

### Executado na fotografia anterior (22/11/2026 — a seta de abrir e fechar, peça única)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-seta-redonda.js` (**nova**) | **21/21**: a peça mede **32×32** com raio de 16, filete de 1px e fundo de superfície; o plano, a aula, a notação e o glossário abrem com o **primeiro** título aberto e todos os outros fechados; o gesto abre e fecha, a memória sobrevive ao recarregamento, um link do índice abre a secção fechada; o **diálogo de criar a aula não está dentro de nenhuma secção** e o «Criar» tem tamanho na tela; no papel a peça não se imprime e as secções saem inteiras. Controle `--contra=22354d71`: **15 de 21 reprovam** |
| `node tools/check-identidade.js` (checagem **20, Seta**, nova) | **0 problemas**, 23 verificações. A comparação das duas declarações reprova de facto: com a folha alterada para `1.9rem`, o erro é «a peça diverge entre as duas folhas — width: «1.9rem» na folha e «2rem» nos Bastidores» |
| o título com a peça, medido | **38px**, o mesmo do pacote anterior (onde a seta era um glifo de 13px) — a seta cresceu sem custar uma linha de altura |
| `provar-a-musica-do-modal` · `provar-criar-aula` · `provar-a-dobra-e-a-aula-anterior` | 42/42 · 53/53 · 31/31 (a asserção «todas as secções nascem ABERTAS» virou «FECHADAS menos a primeira», com o motivo escrito) |
| `provar-celular` | **14 de 15** — e a que passou a passar é «todo botão visível tem os quatro lados com a mesma espessura»: o glifo de antes não tinha moldura nenhuma, a redonda tem. A que falha («quando os botões descem, o nome ocupa a linha») já falhava antes |
| `provar-derivados-da-sequencia` · `provar-o-derivar-do-estilo` · `provar-a-aula-que-vem` | 27/27 · 12/12 · 70/70 |
| `gerar-ciclo` · `hash-ciclo --check` · `check-pacote` | 0 erros (1 aviso de PDF) · íntegro · 0 erros |

### Executado na fotografia anterior (22/11/2026 — o portão da aula dada)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-portao-da-aula-dada.js` (**nova**) | **35/35**: a Aula 01 nunca espera; sem lançamento a 02 fica `disabled` com o `title` a nomear a 01; com a 01 lançada a 02 abre e a 03 espera; com tudo lançado nada está travado; `None` («não sei») não tranca; a aula com documento continua a ser uma ligação «Abrir». No gerador de verdade, a tabela nasce com a 01 aberta e a 02–05 travadas, e a nota diz a regra uma vez («à espera do lançamento da **Aula 02**»). No pacote publicado, a 03 está travada. Controlo: o `plano.html` e o `calendario.py` de `22b99699` não travam nada, e o gerador antigo **recusa** o `--dados` (a flag é nova) |
| …a §E da mesma prova | o `lancadas_do_dados` do calendário e o `aulasLancadas` do núcleo dão a **mesma lista** para o `-dados.json` real da `breu` (**vazia**), e concordam no lixo: uma entrada `null` não é lançamento |
| `bash tools/gerar-ciclo.sh demi-plie 01 breu-rosa` | 0 erros (1 aviso de PDF). O `plano.html` passa a trazer a Aula 03 travada com `title="A Aula 02 ainda não foi lançada…"`, e a nota da regra |
| `provar-a-musica-do-modal` · `provar-o-derivar-do-estilo` · `provar-criar-aula` · `provar-a-identidade-da-aula` | 42/42 · 12/12 · 53/53 · 26/26 |
| `provar-cadeia-automatica` · `provar-a-aula-que-vem` · `provar-derivados-da-sequencia` · `provar-o-estilo-regera` | 136/136 · 70/70 · 27/27 · 19/19 |
| `hash-ciclo --check` · `check-pacote` · `check-identidade` | íntegro · 0 erros · **0 problemas** (22 verificações) |

### Executado na fotografia anterior (22/11/2026 — a música do exercício deriva-se no Estilo)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-musica-do-modal.js` | **42/42**: as quatro colunas (Exercício · Tempos · Compasso · **Ações**); a tabela **não tem um único campo** de escrever; as células leem 8 e 2/4 do verbete, com o `title` a nomear a origem; o «Derivar» leva `data-derivar="Battement tendu"` e `data-musica="8|2/4"`; o clique **pede** `/bastidores/estudio?derivar=Battement%20tendu&musica=8%7C2%2F4#estilo` (o pedido é interceptado e respondido com 204, para o documento não mudar antes de se medir) e **o modal está fechado**; o modal mede **880px** — o mesmo que o da duração, contra os 440 de antes; a tabela cabe na caixa (830 de 880). Com duas músicas o jeté grava-se **sem música**. Controle `--contra=c9a4168c`: **22 de 35 reprovam** |
| `node experimentos/provar-o-derivar-do-estilo.js` (**nova**) | **12/12**: o endereço abre o Estilo no exercício pedido, com a música pedida, no modo «atualizar»; o `?derivar` **sai** do endereço e o `#estilo` fica; **sem** o parâmetro a mesma página não abre verbete nenhum (é o parâmetro que abre); um exercício sem verbete é **dito**, com o Dicionário nomeado, e não abre o formulário em cima de outro. Controle `--contra=cbd1aa66`: **5 de 12 reprovam** |
| `provar-cadeia-automatica` · `provar-a-aula-que-vem` · `provar-o-exercicio-novo` · `provar-aula-dada` | 136/136 · 70/70 · 65/65 · 34/34 |
| `provar-criar-aula` · `provar-compasso-limpo` · `provar-derivados-da-sequencia` · `provar-a-dobra-e-a-aula-anterior` · `provar-o-estilo-regera` | 53/53 · verde · 27/27 · 31/31 · 19/19 |
| `regerar-derivados` · `gerar-ciclo` · `hash-ciclo --check` · `check-pacote` · `check-identidade` | o `plano.md` reescrito · 0 erros (1 aviso de PDF) · íntegro · 0 erros · **0 problemas** |

### Executado na fotografia anterior (22/11/2026 — a mudança chega à aula vigente)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-aula-que-vem.js` (**nova**) | **70/70**: as quatro mudanças (exercício, sala, professor, elenco) chegam à Aula 03 — o §1 dela diz o marco **dela** com os exercícios que o plano declara, o fondu incluído entre eles —, e as Aulas 01 e 02 ficam **byte a byte** como estavam, com a âncora igual, sem elo novo em `historico/`. O presente continua a corrigir-se. Controlo negativo `--contra=c9a4168c`: **4 de 70 reprovam**, e são exactamente as quatro asserções do §1 da Aula 03 (a lacuna `[Preencher: … não respondeu «aula-3-parametro»]`) |
| …a §C da mesma prova | sem o registo do lançamento, as mesmas aulas **são** reescritas, o texto muda e o elo em `historico/` abre — é a guarda que protege, e ela recusa |
| `node experimentos/provar-o-exercicio-novo.js` | **65/65** — duas asserções novas: o termo que a **sincronização** pôs no `repertorio` continua a ser `nova` (a janela abre), e o mesmo termo **assinalado na matriz** é `ja-na-aula`. Controlo `--contra=c9a4168c`: **2 de 65 reprovam**, e são essas duas |
| `node experimentos/provar-cadeia-automatica.js` · `provar-aula-dada.js` · `provar-criar-aula.js` | 136/136 · 34/34 · 53/53, com a cadeia a passar pela porta única (`aplicarAoPlano`) |
| `provar-a-musica-do-modal` · `provar-derivados-da-sequencia` · `provar-compasso-limpo` · `provar-a-dobra-e-a-aula-anterior` · `provar-a-identidade-da-aula` | 26/26 · 27/27 · verde · 31/31 · 26/26 |
| `tools/regerar-derivados.js demi-plie 01 breu-rosa --elenco=tami --escrever` | **9 ficheiros `igual`** — a correcção não muda o que está impresso hoje (a Aula 03 ainda não tem fonte); muda o que a Aula 03 vai imprimir quando nascer |
| `check-pacote` · `check-identidade` | 0 erros (1 aviso de PDF, por desenho) · **0 problemas** |

### Executado na fotografia anterior (22/11/2026 — a aula decide a sua música)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-musica-do-modal.js` | **26/26**: os campos abrem `type=text` **preenchidos** (8 e 2/4), sem `hidden` a fazer de campo travado; o tendu editado para **16 em 4/4** é o que a sequência grava, e o jeté que ela deixou como veio grava 8 e 2/4; com duas músicas da mesma escola, abre com a primeira e o `title` diz as duas. Controle `--contra=d562534a`: **17 de 22 reprovam** |
| `node experimentos/provar-o-exercicio-novo.js` | **61/61** — a §8 nova: o exercício que a Turma passou a ensinar entra no repertório do plano, **não** no parâmetro, e a ordem dos que já estavam não muda |
| `node experimentos/provar-cadeia-automatica.js` | **136/136**, com o controlo «exercício novo SEM declaração» **invertido** (passa a derivar — é a lista da Turma que manda) |
| `node experimentos/provar-derivados-da-sequencia.js` | **27/27** — a secção «Música e vídeo de referência» traz o link da professora, **não** traz a música dos exercícios, e diz para onde olhar |
| `provar-criar-aula` · `provar-compasso-limpo` · `provar-a-dobra-e-a-aula-anterior` · `provar-a-identidade-da-aula` · `provar-a-aula-diz-so-o-que-e-dela` | 53/53 · verde · 31/31 · 26/26 · 25/25 |
| `node tools/check-pacote.js` · `hash-ciclo --check` · `check-identidade` | 0 erros · íntegro · **0 problemas** |

### Executado na fotografia anterior (22/11/2026 — a música é a da escola)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-musica-do-modal.js` | **26/26**: o Battement jeté da `breu` com UMA música (`8|2/4`), preenchida e em leitura, e o `4|4/4` da `batata` ausente do diálogo; duas músicas da MESMA escola continuam a dar escolha, com o compasso a seguir os tempos; a sequência grava `"Tempos": "8", "Compasso": "2/4"` |
| `node experimentos/provar-compasso-limpo.js` | **verde** (§A–§E) — deixou de morrer na fixture do `markdown.js`; a §E mede a vista da escola: jeté → `8|2/4`, `4|4/4` fora, `Plié` do catálogo, `fondu` da `calango` ausente, e a `batata` a ver o dela |
| `node experimentos/provar-derivados-da-sequencia.js` | **26/26** (a mesma fixture) |
| `provar-a-dobra-e-a-aula-anterior` · `provar-a-identidade-da-aula` · `provar-criar-aula` | 31/31 · 26/26 · 53/53 |
| §4 da Aula 02 do ciclo da `rosa`, no pacote publicado | `| 2/4 | Battement tendu | 8 | 1–2 |` e `| 2/4 | Battement jeté | 8 | 1–2 |` — antes: «nenhum exercício tem tempos e compasso» |
| `node tools/check-pacote.js` · `hash-ciclo --check` · `check-identidade` | 0 erros · íntegro · **0 problemas** |

### Executado na fotografia anterior (22/11/2026 — a música no diálogo que cria a aula)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-musica-do-modal.js` | **22/22**, no navegador sobre a `plano.html` do pacote com a escrita stubada: a caixa nasce fechada e abre no primeiro exercício; uma música → 8 e 2/4 em leitura, sem campo por cima; duas músicas → dois `select`, e o compasso segue os tempos (4→4/4, 8→2/4); o corpo do POST leva `"Tempos": "8", "Compasso": "2/4"`; sem verbete → dois campos de escrever; meio par recusado, nada enviado. Controle `--contra=d562534a` (a `plano.html` daquele commit): **13 de 18 reprovam**, com `["",""]` na sequência |
| `node experimentos/provar-criar-aula.js` | **53/53** (inalterado) |
| `node tools/check-pacote.js professores/demi-plie/ciclos/ciclo-01-breu-rosa` | 0 erros (1 aviso: o PDF, por desenho) |
| `bash tools/hash-ciclo.sh demi-plie 01 breu-rosa --check` | íntegro, cadeia intacta |
| `node tools/check-identidade.js` | **0 problemas** |

### Executado na fotografia anterior (22/11/2026 — a aula que lê a aula anterior)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-dobra-e-a-aula-anterior.js` | **31/31** — com um lançamento de fixture: a Aula 01 sem o §3.1 e sem a terceira coluna; a Aula 02 com os sete itens do §3.1 (presença **100%**, ânimo 5 · interesse 4 · harmonia 3, data e duração **OK** contra a data da Aula 01, a sala a nomear o campo que falta, o plano «em parte» com a justificativa, a surpresa e o texto dele); a coluna a agregar `1 de 2 em «Satisfatório» · 1 de 2 em «Razoável»` pela ordem da régua, na linha da anamnese **e** na de um bloco de dimensão; «não marcado» onde ninguém marcou; sem lançamento, nenhuma coluna e o §3.1 a dizer «ainda não foi lançada»; no navegador, 9 secções / 9 botões / 9 corpos e nenhuma tabela solta, fechar, abrir, o índice a abrir o que estava fechado, e no papel a secção inteira com o botão escondido. Controle `--contra=49fb6f87`: **25 de 31 reprovam** |
| `node experimentos/provar-a-identidade-da-aula.js` | **26/26** (as duas asserções dos botões passaram a medir UM botão, como ela pediu) |
| `node experimentos/provar-a-aula-diz-so-o-que-e-dela.js` | 25/25 (inalterado) |
| `node tools/check-pacote.js professores/demi-plie/ciclos/ciclo-01-breu-rosa` | 0 erros (1 aviso: o PDF, por desenho) |
| `bash tools/hash-ciclo.sh demi-plie 01 breu-rosa --check` | íntegro, cadeia intacta |
| `node tools/check-identidade.js` | **0 problemas** |
| **geometria do botão**, medida no navegador | com e sem a dobra: título de **38px**, página de **10166px** — o botão não custa uma linha; o alvo do dedo é **23×15px** |
| `provar-derivador-da-aula` · `provar-escopo-da-aula` · `provar-eixos-e-tempo-da-aula` | **34/35 · 2 falhas · 4 de 52** — as três são **pré-existentes**: correm iguais num worktree limpo do `HEAD` |

### Executado na fotografia anterior (22/11/2026 — quem dá a aula, onde, e em que dia)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-identidade-da-aula.js` | **26/26** — as três linhas do §1 com o dado de cada uma (o nome do perfil, a turma do plano, a data da aula); a data igual à do `ciclos.json` publicado e o dia da semana conferido pelo `Intl` do Node; a Aula 02 com a data dela; **uma só data no §1**; a lacuna a nomear `DATA_INICIO`/`DIAS`/`TOTAL_AULAS` quando não há calendário; os dois botões, com o `lancamento.html` ao lado do documento; a explicação a nomear os cinco blocos; as seis peças na folha. Controle `--contra=e504f372`: **17 de 26 reprovam** |
| `node experimentos/provar-a-aula-diz-so-o-que-e-dela.js` | 25/25 (inalterado) |
| `node tools/check-pacote.js professores/demi-plie/ciclos/ciclo-01-breu-rosa` | 0 erros (1 aviso: o PDF, por desenho) |
| `bash tools/hash-ciclo.sh demi-plie 01 breu-rosa --check` | íntegro, cadeia intacta |
| `node tools/check-identidade.js` | **0 problemas** |
| `node experimentos/provar-aula-prosa.js` | **cai** na mesma asserção anterior (o critério «resposta ao pulso na marcação» não existe neste `.md`); a geração da prosa preserva os botões e o `<details>`, medido |

### Executado na fotografia anterior (22/11/2026 — a aula diz só o que é dela)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-aula-diz-so-o-que-e-dela.js` | **25/25** — o §1 da Aula 01 passa de três marcos a um; a Aula 02 mostra o 2; o escopo segue `aula-de-cada-objetivo` (objetivo em duas aulas aparece nas duas); sem escopo a matriz inteira continua a sair; sem parâmetro a lacuna nomeia o marco e não herda; o §5 nomeia os níveis declarados, e com outra régua no plano é a outra que imprime; a matriz morta não está em documento nenhum. Controle `--contra=070415c2`: **16 de 25 reprovam**, com `["1","2","3"]` no §1 e as marcas mortas nos quatro documentos |
| `node tools/check-pacote.js professores/demi-plie/ciclos/ciclo-01-breu-rosa` | 0 erros (1 aviso: o PDF, por desenho) |
| `bash tools/hash-ciclo.sh demi-plie 01 breu-rosa --check` | íntegro, cadeia intacta (`741fdb26…`) |
| `node tools/check-identidade.js` | **0 problemas** |
| `provar-cadeia-automatica` · `provar-o-exercicio-novo` · `provar-estante-do-po` · `provar-uma-regua-so` | 135/135 · 55/55 · 33/33 · 17/17 |
| `node experimentos/provar-aula-prosa.js` | **cai** numa asserção anterior (`resposta ao pulso na marcação` não existe no `.md` deste ciclo) — verificado com o `.md` de `HEAD`: falha no mesmo sítio |

### Executado na fotografia anterior (22/11/2026 — a altura da folha, o empilhado, e o caminho do pacote)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-a-coluna-da-vertical.js` | **38/38** — duas asserções novas: «aberto mede EXACTAMENTE o conteúdo» (168 de 168) e «a caixa da folha mede o conteúdo e cabe no ecrã» (436 de 436 a 1024×640). Antes da correção, a 1024×640 com tudo aberto: caixa **499** para **587** de conteúdo — 88px fora |
| `node experimentos/provar-o-painel-empilhado.js` | **20/20** a 1440×900, 1280×800, 1024×700 e 390×800: uma coluna, mesma borda esquerda, largura da secção, topo a crescer pela ordem da leitura. Controle `--contra=a61d4ddb`: **8 de 20 reprovam**, com as bordas `[288,748,288,748]` e os topos `[471,471,669,669]` |
| `node experimentos/provar-o-painel-do-estudio.js` | 36/36 (inalterado: a conta e o desenho do painel) |
| `node experimentos/provar-menu-da-producao.js` | 55/55 |
| `node experimentos/provar-a-moldura-em-todas-as-telas.js` | 111/111 |
| `node experimentos/provar-identidade-ao-lado.js` · `provar-acoes-da-linha.js` · `provar-o-estudio.js` | 33/33 · 75/75 · 33/33 |
| `node tools/check-identidade.js` · `check-pacote` (breu-rosa) | **0 problemas** · 0 erros (1 aviso: o PDF, por desenho) |
| `node experimentos/provar-acordeoes.js` | **cai** numa asserção anterior a esta mudança (`#semear` ausente na fixture, linha 337) — verificado que cai **no mesmo sítio** com o código de `HEAD`: falha anterior, não custo desta |

### Executado na fotografia anterior (22/11/2026 — o painel, a coluna, e o KV que dizia «nada pendente»)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-painel-do-estudio.js` | **36/36** — alunas ativas e não registos (2 de 5), professores com o principal (2), salas vigentes (1 de 23), elenco pela versão de hoje, ocupação pela agenda, «sem leitura» quando não há `ASSETS`, datas em `dd/mm/aaaa`, a peça na folha, e — acrescentado depois da primeira carga ao vivo — o **URL pedido** do pacote (`/breu/rosa/ciclos.json`, com o prefixo da árvore, e a pasta da turma a partir do id **carimbado** `rosa-2026-11-20-11`). Controle `--contra=de95569a`: **o painel é o parágrafo antigo, e não há número nenhum** |
| `node experimentos/provar-a-coluna-da-vertical.js` | **32/32** — em 1280×800, 1024×640 e 900×700 os grupos nascem fechados, a seta aparece, o último abre a 168px e o último item cabe no ecrã (436px); a 760×900 continua a folha, com tudo à vista. Controle `--contra=de95569a`: a 1024 os quatro grupos nascem **abertos** (`max-height: none`), a seta escondida, e o último item a **671px** num ecrã de 640 — o defeito, medido |
| `node experimentos/provar-limpeza-do-kv.js` | **14/14** — o elo da `calango` (namespace nulo, `ok: true`) é pendente e o `porque` diz «nunca chegou a olhar»; o elo que falhou mantém o erro; a `retomada` cala; a recriação encerra; fechar grava `namespaceId` e o expurgo de 16/11 não é reescrito. Controle `--contra=de95569a`: o mesmo elo é dado como **«nada pendente»** — 7 falhas |
| `node experimentos/provar-o-estudio.js` | 33/33 |
| `node experimentos/provar-menu-da-producao.js` | 55/55 |
| `node experimentos/provar-a-moldura-em-todas-as-telas.js` | 111/111 |
| `node experimentos/provar-identidade-ao-lado.js` | 33/33 |
| `node tools/check-identidade.js` | **0 problemas** (depois de uma correção: a peça do painel chamava-se `numero`, e a `porta` já usa `.numero` para o número do degrau — a checagem 8 reprovou, com razão) |
| `node tools/check-pacote.js professores/demi-plie/ciclos/ciclo-01-breu-rosa` | **0 erros**, 1 aviso (o PDF, por desenho) |
| O KV das escolas mortas, com o `CLOUDFLARE_API_TOKEN` do `.env` | `calango` **6 chaves → 0** (`apagadas: 6, restantes: 0`), `batata` **0**, `duo` **0**; `breu` 23 (viva) |
| `pendenciaDoKv` nos quatro elos | `calango`/`batata`/`duo` → pendência com `porque`; **`breu` → nada pendente** (recriada depois do expurgo) |

### Executado na fotografia anterior (22/11/2026 — o estúdio, e o modelo do painel)

| Verificação | Resultado |
|:--|:--|
| `provar-o-estudio` (**novo**, 33/33) | `/bastidores/estudio` responde 200 e diz «Estúdio» no título e no `<h1>`; `/bastidores` e `/bastidores/producao` são **302** para ele, e a **query atravessa** (`?abrir=pagar` chega); o mês a mês novo responde 200 e **as duas formas antigas** são 302; as dez secções continuam todas dentro; o grupo «Produção» da coluna fica; e o menu de Bastidores tem **um item**, «Estúdio», aceso na página |
| o controle negativo da mesma prova | `--contra=feac5b03` → **26 de 33 caem**. Na base, `/bastidores/estudio` é a «cena» (um parágrafo), `/bastidores/producao` serve o gabinete, e o menu tem dois itens. A prova mede a mudança |
| a busca do menu em 111 telas | `provar-a-moldura-em-todas-as-telas` **111/111** — a barra e a coluna continuam em todas as telas que o Worker serve, agora com o destino novo |
| o modelo do painel, medido no navegador | `proposta-painel-do-estudio.html`: cinco números (Alunas 2 · Professores 2 · Salas 1 · Elencos 2 · Modalidades 2), a cota da sala a `0/1000` e a nota «o período ainda não começou»; a bancada troca entre «hoje» (um parágrafo, zero cotas), «caixinhas da casa» (5) e «número grande» (5 da peça nova) |
| `check-identidade` · `check-indices` · `check-pacote` | **0 problemas** (depois de re-sincronizar as duas cópias da porta) · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) |
| **ao vivo, fim a fim, depois do deploy** | `/bastidores/estudio` **200** com `<h1>Estúdio</h1>` e `Bastidores · Estúdio · breu` · `/bastidores/producao` **302** para ele · **0** ocorrências de «Estúdio de Dança» na página · o `nav.json` publicado com **um** item em Bastidores · `/propostas/proposta-painel-do-estudio.html` **200** |
| **o defeito que só se viu ao vivo** | o primeiro deploy subiu o Worker CERTO e a COLUNA continuou com «Estúdio de Dança · Produção». A coluna não vem do Worker: é o `nav.json` extraído do `<summary>Bastidores</summary>` do **pacote**, e o pacote da `breu` foi escrito por `tools/criar-escola.sh` quando a escola nasceu — **a terceira cópia da mesma lista**, e a única que os testes não leem. Corrigida no script e o pacote regerado com `--somente-indice` (2 linhas de navegação) |

### Executado na fotografia anterior (22/11/2026 — uma régua só, e um plano só na escolha)

| Verificação | Resultado |
|:--|:--|
| `provar-uma-regua-so` (**novo**, 17/17) | a coluna do corpo nasce `rubrica` na declaração; o merge conserva a `chave` e adopta o `tipo`; na tela, os campos do corpo oferecem os **níveis da turma** e **nenhum** oferece as cinco marcas; a página tem **uma** legenda. Dois controlos: com a folha inteira em marcas (o ciclo antigo) o corpo mede-se pelas marcas e a legenda é uma só; com o **config antigo** a dizer `marca` e a turma a declarar régua, mede-se pela régua — o pacote de ontem não reabre o defeito |
| medido no navegador, sobre o pacote regenerado | `lb-aluna_a-0` passou de `não observei | ✓ ok | ~ parcial | X não aconteceu | ? não vi` a `não medido | Satisfatório | Razoável | Em desenvovimento | Não se aplica`; a legenda das marcas desapareceu, ficando só «Critério: um nível da RÉGUA desta turma» |
| `provar-estante-do-po` (**reaberta**, 33/33) | estava **morta desde o expurgo da `batata`** (lia `escola/batata/envelopes` e morria com `ENOENT`) e **nunca esteve no repositório** — o `.gitignore` fechava a pasta e nenhum `!` a abria, a mesma armadilha do `provar-barra-unica`. Fixture passada para a escola viva, e a regra nova medida em três pontos: um plano só; nenhuma opção diz «versão anterior»; o campo passa a apontar o **vigente da mesma cadeia** e uma **nota** diz que o plano foi ajustado |
| `provar-declaracao-da-captura` · `provar-regua-do-professor` · `provar-janela-do-lancamento` · `provar-corpo-da-linha-de-base` | **12/12** · **44/44** · **11/11** · **30/30** |
| `check-identidade` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 problemas** · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) · **cadeia intacta** |
| a chave do cofre **não é** um token do Cloudflare — medido | `GET /user/tokens/verify` → **401**; `GET /accounts/<id>/storage/kv/namespaces` → `code 10000 Authentication error`. Ela tem **64** caracteres e um token de API do Cloudflare tem **40**. É a `SENHA_MESTRA` — a chave de que se deriva a de cada escola (`HMAC(SENHA_MESTRA, «lastro/escola/<slug>»)`, também 64 hex), e não uma credencial da Cloudflare. O conferidor do KV passou a **consultar** o KV quando há `CLOUDFLARE_API_TOKEN` no ambiente, e a dizer **«NÃO MEDI o KV: <motivo>»** quando não há — nunca «está limpo» |

### Executado na fotografia anterior (22/11/2026 — o fluxo da Aula 02, e a conferência do expurgo)

| Verificação | Resultado |
|:--|:--|
| a bateria do expurgo, inteira | **14 provas verdes**: `bancadas-e-expurgo` 16 · `cartas-do-expurgo` 25 · `dono-do-expurgo` 11 · `elo-do-expurgo` ok · `expurgo-do-professor-compartilhado` 13 · `expurgo-por-carencia` 34 · `lista-do-expurgo` 26 · `o-expurgo-do-financeiro` 15 · `proveniencia-do-expurgo` 38 · `expurgo-sem-listagem` **49** · `expurgo-raiz` **ok** · `expurgo-leitura-atrasada` **45** · `conferir-expurgo` **24** · `os-fluxos-da-derivacao` **74** |
| o que estava vermelho, e porquê | três provas mediam o mundo de antes. (a) `expurgo-sem-listagem` fixava **9** chaves fixas — a lista tem **16** desde 17/11 e 19/11, e crescer a lista é o que se quer: a asserção passou a medir **cobertura** (as nove fundadoras continuam lá) e o número de **tentativas** (`fixas.length + 1`, o ponteiro da geração), que é o que não muda quando a lista cresce. (b) `expurgo-raiz` esperava a mensagem da **morada** em dois sítios onde hoje responde passo anterior: a **carência** (16/11) e a **auditoria da proveniência** (07/11) vêm antes. O cenário passou a ter o que precisa para medir o que diz medir — uma escola suspensa com a carência vencida —, e o caminho até à morada passou a ser o do **`forcar` declarado** (com o token real, uma leitura da árvore). (c) `indice-do-recorte` exigia `#lb-indice` **dentro de `sec-corpo`** e o título «O que os recortes olham»: o bloco mudou para a **aba 2 da Audição** em `ba76c401` (09/11) e o título foi corrigido para «Recorte» em `38cab0e2`. Estava vermelha há treze dias |
| a conferência do expurgo, medida nas quatro escolas | `batata` **0** arquivos · `calango` **0** · `duo` **0** · `breu` **266**. Nas três expurgadas o último acto é o expurgo, **nenhum resíduo sem razão declarada**, e `criar-escola.sh` **não recusa** o nome. Na `breu`, a criação é recusada por `ciclo-01-breu.conf` e `ciclo-01-breu/` — ficheiros **da própria escola**, que o expurgo leva. **Correção de 22/11/2026, no mesmo dia:** esta linha dizia «há pacote da turma `rosa` — a turma nova precisa de outro nome», e isso era **falso**; o `criar-escola.sh` não olha para pacotes de turma, o `gerar-ciclo` escreve por cima, e a única recusa por nome de turma é a de duas salas **vivas** com o mesmo nome na **mesma** escola. O nome da turma é escolha de quem a cria |
| a metade do KV — **não medida, e dita** | a chave recebida para a medir **não autentica**: `GET /user/tokens/verify` → **401**, e `GET /accounts/<id>/storage/kv/namespaces` → `code 10000 Authentication error`. Ela tem **64** caracteres; um token de API do Cloudflare tem **40**. O `node escola/conferir-kv.js --escola breu` respondeu `::warning::não conferi o KV da escola «breu» — não consegui listar «breu/»: Authentication error` — que é a resposta honesta: não medido, nunca impresso como «limpo». O caminho da leitura ficou provado com uma leitura gravada (`--kv-de`), sem rede |
| a frase da recusa sem cadastro | `POST /api/apagar-escola` para uma escola **sem registo comercial** dizia «A escola está habilitada» — uma afirmação sobre um estado que ninguém leu, e sobre uma escola cuja morada a raiz não conhece. `lerComercial` passou a marcar `semRegisto: true` e `estadoDoExpurgo` tem frase própria. A recusa continua a ser recusa (`pode: false`), e a prova mede as duas: a frase nova e o silêncio sobre «habilitada» |
| `provar-a-carencia-nao-se-burla` · `provar-conciliacao-do-painel` · `provar-financeiro` · `provar-financeiro-da-escola` · `provar-cofre-e-shard` · `provar-indice-do-recorte` | **58/58** · **35/35** · **58/58** · **135/135** · **138/138** · **24/24** |

### Executado na fotografia anterior (22/11/2026 — quem fez a anamnese, e quando)

| Verificação | Resultado |
|:--|:--|
| `provar-proveniencia-e-turma` | **53 de 56**, e as **3 falhas são as mesmas da linha de base** (medido com o worktree em `stash`): a notação não é o que a prova espera, e a verificação de classes «inventadas» reprova o `origem-da-aluna`, que existe desde 18/11 e nunca foi desenhado na folha. As **3 asserções novas** passam: a opção diz «Aluna A · por demi-plie em 05/11/2026», a data sai do carimbo e a Aluna B — sem autor no fixture — fica «em 05/11/2026» sem nome inventado, e a mesma frase está na linha das acções |
| medido no navegador, sobre o pacote montado | `/rosa/aula-01.html`: o `<select>` tem as duas opções com a frase; escolher a Aluna B mostra as acções dela com «anamnese por bom-bom em 19/11/2026 · origem metodológica não declarada» |
| as fontes e o pacote | `regerar-derivados … --elenco=tami --escrever` reescreveu as duas aulas **só nas opções e nas linhas das acções** (o Corpo ficou intacto, conferido no diff), as âncoras foram refeitas e o pacote regerado: `aula-01.html` e `aula-02.html` trazem a frase |
| `node tools/check-identidade.js` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **22 ok / 0 reprovações** · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) · **cadeia intacta** |
| `provar-derivador-da-aula` · `provar-corpo-da-linha-de-base` | **35/35** · **30/30** |

### Executado na fotografia anterior (21/11/2026 — o PO mostra as dimensões; o valor é da aula)

| Verificação | Resultado |
|:--|:--|
| o estado, medido ao vivo | `GET /api/bastidores/linha-de-base/leitura?id=tami&alunas=Aluna A,Aluna B` → **200**, e devolveu `alunas: ['Aluna A','Aluna B','Aluna A','Aluna B']` — **quatro** nomes para **duas** pessoas. O índice do acervo explica-o: `anamnese-20261116-2201` (Aluna A, **sem** `alunaId`) e `anamnese-20261118-1737` (Aluna A, `aluna-a-3`) são, pela regra do `vigente`, duas identidades. O mesmo para a Aluna B |
| o fio que faltava | o `POST /api/bastidores/linha-de-base` com `concluir` compara `leitura.alunas` com `linhas.alunas` por `map(String).sort()` — **ordenada, não um conjunto**. Com quatro nomes de um lado e dois do outro, não batia: a leitura era descartada e o acto saía sem ela. É a explicação inteira do «fiz o passo e nada apareceu», e o acto de 22:55 (que ela gravou) confirma-a: tem `lida` e não tem `leitura` |
| `provar-o-que-se-observa` | **49/49** (§E revista, §G nova). A §E passou a medir o CONTRÁRIO do que media: o painel do PO **não** mostra «em «nível»», **não** diz «sem leitura neste elenco», **não** traz instruções de outro ecrã — e fica igual com o elenco por ler. A §G mede a raiz: dois envelopes do mesmo apelido contam **uma** vez, a frase é «de 2» e não «de 4», a nota atravessa, e o «Concluir» leva a leitura mesmo com a lista repetida no rascunho |
| controle negativo | `--contra=75b91620` → caem **14 de 49**; `--contra=7839fed0` → caem **0**, e isso está agora escrito no ficheiro: as secções E, F e G medem a PÁGINA e as ROTAS, que o controle não reverte. Uma prova cujo controle nunca falha não é um controle — o número a citar é o da base do núcleo |
| a aula, derivada com a leitura real | o Corpo da Aula 01 passa a imprimir os **11** aspectos do recorte com a frase do passo 3: «1ª posição — pés — 1 de 2 em «Bom» (com toque) · 1 de 2 em «precisa desenvolver» (por consciência própria) — ponto de atenção», e assim por diante nos onze. É o que ela pediu («é lá nos resultados da aula que eu espero encontrar») e o que o PO deixa de repetir |
| `experimentos/mostrar-o-que-se-observa.js` (**novo**) | lê ao vivo e imprime, aspecto a aspecto, o que cada aluna registou e a frase que a aula vai imprimir. É o «mostra para mim lá no experimento» dela. Só `GET`; nada é escrito, e a saída não fica em ficheiro |
| as que atravessam o mesmo caminho | `provar-corpo-da-linha-de-base` **30/30**, `provar-leituras-do-po` **27/27**, `provar-derivador-da-aula` **35/35**, `provar-eixos-do-po` **42/42** |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 reprovações (22 ok)** · **ok** · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) · **cadeia intacta** |
| o pacote da `breu-rosa` | `porta/index.html` e as **duas** cópias do PO re-sincronizadas, publicação remontada — a primeira passagem da §E falhou porque servia o HTML de ontem |

### Executado na fotografia anterior (21/11/2026 — o elenco por ler diz-se, e diz o botão)

| Verificação | Resultado |
|:--|:--|
| o estado, medido no acervo | a série do elenco `tami` tem **treze** versões: as quatro primeiras (17 e 18/11, até ao `--1807`) têm `leitura`; a partir do `--1908`, em que `alunas` passou a `[]`, **todas** trazem `lida` e **nenhuma** `leitura`. As duas que a turma lê por data estão nesse grupo. É a explicação inteira do «sem registo na anamnese» — e não é o registo dela que falta |
| `provar-o-que-se-observa` (§E nova, §F nova) | **43/43** com Chrome sobre o pacote real em `127.0.0.1`. A §E mede a frase do painel no estado ao vivo: nomeia «Ler as anamneses», «Audição» e «Anamneses», e diz que derivar o elenco ou gerar o plano **não** fazem a leitura. A §F mede o caminho inteiro: a direção entra, o `POST /api/bastidores/linha-de-base` com `concluir: true` devolve `avisoLeitura` quando há alunas e não há leitura, o cartão do elenco na lista leva o «!» com a dica do caminho, **um rascunho sem recorte não o leva** (medido no DOM, depois de gravar um), e `abrirArquivoCifrado` com a chave errada responde **409** com a frase da chave — e não «não há anamnese» |
| controle negativo | `--controle-negativo --contra=75b91620` → **caem 14 de 43**. Ficou escrito no ficheiro por que o `HEAD` deixou de servir de linha de base: depois do commit, `HEAD` **é** a versão nova, e o controle comparava o novo com o novo (deu 41/41 e não provava nada) |
| as que atravessam o mesmo caminho | `provar-corpo-da-linha-de-base` **30/30**, `provar-leituras-do-po` **27/27**, `provar-o-registo-abre` **10/10**, `provar-curadoria-ilegivel` **19/19** |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 reprovações (22 ok)** — a marca reusa o `.selo.alerta` que já existia · **ok** · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) · **cadeia intacta** |
| o pacote da `breu-rosa` | `porta/index.html` re-sincronizado nas **duas** cópias do PO (a do ciclo sem escola e a da `rosa`, cada uma com a sua navegação) e a publicação remontada — sem isso a bancada mede a página de ontem, e foi o que aconteceu à primeira passagem: duas asserções da §E caíam contra o texto antigo |

### Executado na fotografia anterior (21/11/2026 — «o que se observa» tem o valor, o apoio e a nota)

| Verificação | Resultado |
|:--|:--|
| o estado antes, medido no acervo | as cinco anamneses de `escola/breu/envelopes/` têm **2** respostas cada e **nenhuma nota**; o acto real do elenco (`tami--20261120-2146`) tem `respostas: 0` e **não tem `leitura`**, e o mesmo acontece às **doze** versões de `tami` no disco — só as de 17 e 18/11 têm `leitura`, e as duas que a turma lê por data não têm. É a explicação inteira do «sem registo na anamnese» que ela viu, e **não** é o que ele dizia: o que falta é o passo 3, não o registo dela |
| `provar-o-que-se-observa` (**nova**) | **34/34**, com Chrome sobre o acervo real em `127.0.0.1`. (A) a nota atravessa `classificar` → `mostra` → o painel → o documento, com o apelido da aluna; (B) uma nota **sem nível** não cai em «sem registo» — foi observada, e entra em «o que precisa de ser trabalhado» (é o caso que a primeira versão desta correção perdia); (C) `mostra` é o **recorte** (10 aspectos) e `mostraCompleta` são os **45** campos, e é dela que a poiesis lê a musicalidade que o recorte do corpo deixa de fora; (D) o derivador imprime «1 de 1 em «Bom» (por consciência própria)» e «nota do professor: «…»» no Corpo, e as linhas de poiesis levam a nota; (D2) a **versão vigente** do elenco é a do carimbo maior — medido com a lista dada ao contrário, porque o `find` que lá estava devolvia a de 17/11 (3 aspectos) em vez da de 20/11 (10); (E) a rota serve `mostra`/`mostraCompleta`/`leitura`, o painel desenha o valor ao lado do nome, **e — sem leitura no elenco, que é o estado de hoje ao vivo — diz que falta o passo 3** em vez de deixar os nomes sozinhos |
| controle negativo contra o `HEAD` | **caem 6** asserções: todas as das notas e a da nota-sem-nível. As outras 28 passam nas duas versões, o que é o esperado — o que muda é o valor ao lado do nome, não a página |
| as que atravessam o mesmo caminho | `provar-corpo-da-linha-de-base` **30/30**, `provar-leituras-do-po` **27/27**, `provar-o-registo-abre` **10/10**, `provar-ajustes-anamnese` **126/126**, `provar-listas-do-acervo` **113/113**, `provar-curadoria-ilegivel` **19/19** — verdes |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 reprovações (22 ok)** · **ok** · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) · **cadeia intacta** |
| Falhas que **já existiam**, medidas na linha de base | `provar-linha-de-base` **9**, iguais antes e depois (medido com o worktree em `stash`); `provar-plano-preenchido` **16 de 21**, idem; `provar-eixos-e-tempo-da-aula` **4 de 52** — medido num worktree à parte no `75b91620`, com as **quatro frases de falha idênticas** («ponto de partida das alunas», as tabelas da Técnica e da Poiesis a darem 6 onde a prova fixa 4, e um envelope que ela procura em `escola/breu/envelopes`), o que mostra que a prova fixa números que o acervo já mudou |
| Ao vivo, **uma** carga (a regra) | `/api/bastidores/alunas-da-turma?turma=Rosa` → **200** em 1,9 s, e a resposta já traz `mostra`, `mostraCompleta` e `leitura`. `leitura` é **`null`** e `mostra` vem **vazia** — o servidor novo a ler o dado que existe, e a dizer a verdade sobre ele. **Só ela pode fechar isto**: as anamneses são cifradas; o passo 3 (Bastidores → Produção → Audição → elenco da turma Rosa) é dela |

### Executado na fotografia anterior (21/11/2026 — a fonte é Open Sans, e é entregue)

| Verificação | Resultado |
|:--|:--|
| o estado antes, medido | `grep -rn '@font-face\|fonts.googleapis'` → **nada**; `find -name '*.woff2'` → **nada**; `fc-list \| grep -ci 'open sans'` → **13** cortes nesta máquina, e `fc-match Georgia` → `Noto Serif`. É a explicação inteira do «acho que deu certo»: a fonte estava instalada aqui, e só aqui |
| `provar-a-fonte-do-site` (**nova**) | **27/27**, com Chrome sobre o pacote real em `127.0.0.1`. (A) o `.woff2` está em `assets/fontes/` das **três** superfícies, a folha declara o `@font-face` com `url('fontes/…')` relativo, e a licença viaja ao lado; (B) a página **pede** o ficheiro, o servidor do pacote responde **200**, o `@font-face` está `loaded` com peso `300 800`, e a **largura da mesma frase a 100px** — **3022px** em Open Sans contra **2544px** numa serifa — atesta que é a fonte que chegou que desenha, e não a que a máquina já tinha (é o que distingue «carregou» de «usou»); (C) com o `.woff2` **recusado** (404), a página não declara a fonte carregada e cai numa **sans**, não numa serifa; (D) a ficha aponta para `/assets/fontes/…` **absoluto**, e o `/assets/` partilhado da publicação tem a fonte |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 reprovações (22 ok)** · **ok** · **16/16** · **0 erros, 1 aviso** · **cadeia intacta** (as fontes são saída, não fonte — P-04) |
| `provar-criar-aula` · `provar-formulario-da-aula` · `provar-paginacao` · `provar-curadoria-ilegivel` · `provar-a-moldura-em-todas-as-telas` · `provar-ar-das-paginas` | **53/53 · 53 · 129/129 · 15/15 · 111 · verde** |
| `provar-assets-sem-worker` · `provar-fecho-do-pacote` | **36 · 57** — as duas atravessam o `assets/` do pacote, que é por onde a fonte entra |
| `indices/esquema/tipos.json` | `ativo-do-pacote` alargado de `/assets/[^/]+$` para `/assets/.+$`: o `assets/fontes/` é a mesma pele, numa pasta a mais. Sem isto, a verificação **8** reprovava **8** arquivos por «sem tipo declarado» |
| Falhas que **já existiam**, medidas na linha de base | `provar-largura-da-lista` **45 de 56** — medido **com a folha de `HEAD` no lugar**: os mesmos 45, e as 11 são todas E/F e o controlo negativo N, com a coluna do formulário a medir **0** na bancada (a secção que ela mede já não é desenhada). `provar-celular` **14 de 15** (idem); `provar-saidas-estaveis` **não corre** (precisa da escola `calango-piano`, expurgada); `provar-navegacao` não corre (a `calango` não tem pacote-zero) |
| Revertido no mesmo passo | **~16 mil linhas** de reformatação em quatro folhas e num HTML de estudo — um formatador que passou os comentários alinhados para linhas próprias. Não é a alteração dela, não foi pedida, e destruiria o alinhamento que a folha usa para explicar cada valor |

### Executado na fotografia anterior (21/11/2026 — a Aula 02 existe, e a paginação nas listagens)

| Verificação | Resultado |
|:--|:--|
| o envelope dela, lido | `escola/breu/envelopes/plano-20261121-1120.json` — `ajuste_de` `plano-20261121-0933`, `motivo` «a aula 02 foi criada a partir do calendário do plano», e **tem** `aula-2-parametro` e `aula-2-sequencia`. É o clique dela, e o motor gravou-o: o que faltava era a jusante |
| `provar-manifesto-da-turma` (§9.1, **nova**) | prova que o caminho **composto** cresce com a Aula 02 e que a família sai em ordem; prova que o caminho da **escrita** também, e que a Aula 01 não se perde; e prova o negativo — **sem** a aula no plano, nada é acrescentado. **Mutação medida**: com a regra desligada no `compor-conf` caem **8** asserções (a linha de base do ficheiro é 3, e continua 3) |
| `provar-criar-aula` | **53/53**, e a secção F deixou de estar presa ao número `02`: a prova **lê** da página qual é a primeira aula por criar, porque a `02` passou a existir — uma prova que fixa um número mede o dia em que foi escrita |
| `provar-paginacao` | **129/129**. A §8 (nova) monta a publicação e mede o **artefacto**: `/ciclos/planos/index.html` e `/aulas/index.html` têm `data-paginar`, `.paginas` `hidden` e o cliente. A §9 (nova) mede as três listas da Área do Professor: **um chamador só** para as três, e é ele que pede o `porPagina` — mais a página da anamnese **com** registo, com o rodapé escondido. **Mutação**: sem o `porPagina` no `montar-publicacao` caem **4**; sem ele no `listas-do-acervo` caem **3** |
| o pacote da `breu-rosa`, regerado | publica `aula-02.html` e `captura-aula-02.html`; a coluna «Ação» oferece **Abrir** à 01 **e** à 02, e «Criar aula» a partir da 03; o menu de todas as páginas lista as duas aulas |
| `provar-geracao` · `provar-aula-dada` · `provar-derivador-da-aula` · `provar-objetivos-por-aula` · `provar-aula-prosa` · `provar-indices` | **54 · 34/34 · 35/35 · 55/55 · 19 · 64/64** — verdes |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 reprovações (22 ok)** · **ok** · **16/16** · **0 erros, 1 aviso** · **cadeia intacta** |
| Falhas que **já existiam**, medidas na linha de base | `provar-manifesto-do-plano` **3** e `provar-manifesto-sem-base` **1** — iguais antes e depois desta entrega; `provar-navegacao` não corre (a `calango` não tem pacote-zero); `provar-celular` **14 de 15** e `provar-producao` **142 de 159** — idem |
| Ao vivo, medido depois do deploy (26de0e7f) | `/aulas/` lista **`rosa/aula-02.html`**; `/rosa/plano` mostra a coluna «Ação» com **Abrir** na 01 **e** na 02, e «Criar aula» a partir da **03**; `/rosa/aula-02.html` responde **200** (23 KB) com o título «Plano para a Aula 02 — transferir o peso entre os pés sem perder o alinhamento»; `/ciclos/planos/` e `/area-do-professor/anamnese/` servem `data-paginar data-por-pagina="25"` com o rodapé `hidden` — a peça está lá, e com 2 e 1 registos não aparece, que é a regra |

### Executado na fotografia anterior (21/11/2026 — a aula 02 que ela criou e não existia)

| Verificação | Resultado |
|:--|:--|
| `provar-criar-aula` | **52/52**. A secção **B2 é a que faltava**, e é a que mede o defeito: com o conteúdo de verdade (`porta/plano/conteudo/plano.json`) e as respostas da Aula 02, a `aula-2-sequencia` **atravessa** a elicitação, nada é relatado como desconhecido, e `aulasDeclaradasPeloPlano` devolve `01,02`. A família é lida de volta nas três formas e recusa o que não é dela (`aula-2-inventado`, `aula-x-sequencia`); uma aula **acima do total do ciclo** não entra e é **relatada**. **Mutação medida**: com a família desligada — o estado de ontem — a resposta cai, a aula 02 deixa de existir e o id aparece na lista de desconhecidos — **3 das 52** caem. E o desenho do gesto: o botão diz «Criar» (e não «Criar e gerar»), o guionista acende o véu da casa, o «Cancelar» vira «Fechar», e a página confere `idsDesconhecidos` antes de dizer «criada» |
| `provar-formulario-da-aula` · `provar-geracao` · `provar-aula-dada` · `provar-derivador-da-aula` | **53 · 54 · 34/34 · 35/35** — verdes, e são as que atravessam a elicitação que mudou |
| `provar-objetivos-por-aula` · `provar-salas-e-elencos` · `provar-aula-prosa` · `provar-indices` | **55/55 · 240/240 · 19 · 64/64** — verdes |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 reprovações (22 ok)** · **ok** · **16/16** · **0 erros, 1 aviso** (o PDF, por desenho) · **cadeia intacta** |
| O pacote da `breu-rosa` | regerado; o botão diz «Criar» na página publicada |
| `provar-producao` | **142 de 159** — **anterior** a esta entrega, e medido no `HEAD` num worktree à parte com o mesmo resultado. As 17 asserções fixam a página de bastidores com 8 secções (hoje 10) e com a palavra «curadoria» (hoje «turma») |
| Ao vivo | **CONFIRMADO, e sem escrever nada**: `POST /plano-ensino/api/elicitar` com `simular: true` (a rota não grava nem dispara nesse modo) e as respostas da Aula 02 sobre o envelope real `plano-20261121-0933` → **200**, `idsDesconhecidos: []`, e o documento devolvido **tem** `aula-2-sequencia`. É o mesmo caminho que falhava, medido no servidor que está no ar. E a página publicada, `https://breu.padd.com.br/rosa/plano`, já serve o botão **«Criar»**. **O gesto dela tem de ser repetido**: o clique de 21/11/2026 gravou um plano sem a aula, e reescrever o envelope à mão seria inventar o elo que a proveniência não viu |

### Executado na fotografia anterior (21/11/2026 — os cinco defeitos que ela viu na tela)

| Verificação | Resultado |
|:--|:--|
| `provar-criar-aula` | **39/39**. (A) a coluna chama-se **«Ação»**, o «Abrir» é **botão** com a estética do «Criar aula», e a aula com documento **não** tem botão de criar; (B) a janela usa as **peças da folha** (`.modal`, `.modal-fundo`, `.modal-caixa`, `.modal-acoes`, `.modal-x`) e **nenhuma inventada** — nada de `<style>` nem de `.fraco`; (C) a regra da aula declarada; (D) o escritor; (E) a tabela dos objetivos: **nomeia o exercício e liga a ele**, o documento sozinho (sem índice) diz «—» e **não inventa nome**, a aula que não nasceu diz «a criar na Aula 02»; (F) **num Chrome**: a janela abre com `?criar-aula=02` (`hidden` fora, e não um `<dialog open>` que já não existe), o título diz «Criar a aula 02», o marco vem do plano, a data · dia · duração vêm **da linha** |
| `provar-objetivos-por-aula` | **55/55**. A coluna é «Exercício»; as **duas linhas do objetivo 01 (Solo e Barra) levam a sítios diferentes** e cada âncora nomeia o bloco a que pertence; **todas as âncoras citadas existem** na `aula-01.html` |
| `provar-salas-e-elencos` | **240/240**. A asserção que fixava o «Cancelar» **antes** do «Gravar» foi corrigida — uma prova que congela a ordem errada guarda o erro em vez de o apanhar |
| `provar-geracao` · `provar-derivador-da-aula` · `provar-aula-dada` · `provar-aula-prosa` · `provar-formulario-da-aula` · `provar-indices` | **54 · 35/35 · 34/34 · 19 · 53 · 64/64** — verdes |
| `node tools/check-identidade.js` | **0 reprovações** — as 17 superfícies que emitem marcação usam só peças desenhadas ou ganchos declarados (16 ganchos); Aresta, Base e Respiro verdes |
| `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **ok** · **16/16** (índices regerados) · **0 erros, 1 aviso** (o PDF ausente, por desenho desde 20/11) · **cadeia intacta** |
| O pacote da `breu-rosa` | regerado: **9 páginas**, 0 erros. A tabela dos objetivos publica seis ligações de exercício — `#solo-battement-tendu-ob1`, `#solo-plie-ob1`, `#solo-releve-ob1`, `#barra-battement-tendu-ob1`, `#barra-plie-ob1`, `#barra-releve-ob1` |
| `provar-producao` | **142 de 159** — e é **anterior** a esta entrega: medido no `HEAD` (`030ef48c`) num worktree à parte, dá o **mesmo 142/159**. As 17 asserções fixam a página de bastidores com **8 secções** (hoje tem 10) e com a palavra «curadoria» (hoje «turma»). São provas mortas, e ficam nomeadas aqui em vez de contadas como verdes |
| Deploy / ao ar | **CONFIRMADO** em 21/11/2026, com **uma** requisição por caminho: `/plano-ensino/api/envelope/plano-20261120-2052` responde **200** com o envelope; o caminho antigo, `/api/envelope/plano-20261120-2052`, responde **404** — que é o defeito que ela viu, e é o diagnóstico a fechar-se pela boca do próprio servidor |

### Executado na fotografia anterior (21/11/2026 — a aula nasce do calendário)

| Verificação | Resultado |
|:--|:--|
| `provar-criar-aula` (**nova**) | **38/38**. (A) a coluna: botão para a aula sem documento, ligação para a que tem, **nenhuma** coluna quando o gerador não a pede, e nenhum botão quando todas existem; o número em dois dígitos; (B) o diálogo na página do plano, com o carimbo, o repertório, os marcos, os blocos e o contexto — e o ciclo sem repertório a **dizer** isso; (C) a regra: `aula-2-sequencia` declara a 02, uma sequência **vazia** não declara nada, e a forma com zero à frente é lida; (D) o escritor: o `DOCS` ganha `aula-02` e `captura-aula-02`, o `-aula-02.md` é escrito **com o número dela**, e a Aula 01 continua declarada e escrita; (E) a tabela dos objetivos: «Aula 02» vira ligação quando o documento existe; (F) **num Chrome**: a página abre com `?criar-aula=02`, a caixa fica aberta, o título diz «Criar a aula 02», o marco vem preenchido do plano, a data · dia · duração vêm **da linha**, e há 4 exercícios e 4 blocos para marcar. **Mutação**: com `aulasDeclaradasPeloPlano` a devolver só a 01, caem **8 das 38** |
| `provar-derivador-da-aula` · `provar-aula-dada` | **35/35** · **34/34** — verdes |
| `provar-formulario-da-aula` · `provar-geracao` · `provar-objetivos-por-aula` | **53 · 54 · 51** — verdes |
| `provar-aula-prosa` · `provar-colunas-da-aula` · `provar-eixos-do-po` · `provar-declaracao-da-captura` | **19 · 23 · 42 · 12** — verdes |
| `provar-derivados-do-po` · `provar-um-commit-por-guardar` · `provar-remocao-do-elenco` · `provar-orcamento-do-guardar` · `provar-o-commit-do-po` | **16 · 22 · 26 · 16 · 14** — verdes |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 erros (22 ok)** · **ok** · **16/16** (índices regerados) · **0 erros, 1 aviso** · **cadeia intacta** |
| O pacote da `breu-rosa` | regerado com o gerador: **9 páginas**, 238 links internos conferidos, 0 erros. A quinta coluna aparece no `plano.html` com o botão na 02 e a ligação na 01 |
| Deploy / ao ar | **Não executado** — a coluna e o diálogo são da página gerada; a conferência em produção é o passo seguinte ao push |

### Executado na fotografia anterior (21/11/2026 — o derivador por aula)

| Verificação | Resultado |
|:--|:--|
| `provar-derivador-da-aula` (**nova**) | **35/35**. (A) `aula-1-parametro` continua a ser a chave da Aula 01, e o número aceita as três formas; (B) `derivarAula01` e `derivarAula({nn:'01'})` dão o **mesmo texto**, e a Aula 01 declara o marco 1 e as chaves dela; (C) a Aula 02, com dados próprios: título, **marco 2**, matriz e sequência **dela** — e o exercício da Aula 01 não aparece; a §8 aponta e liga a Aula 03; a folha também diz Aula 02; (D) a Aula 04 de um plano de três marcos: lacuna que **nomeia** `aula-4-parametro`, **nenhuma herança** da 01, «apenas 3 marcos», e nenhum link para uma aula que o ciclo não declara; (E) o escritor grava `-aula-02.md` e `-captura-aula-02.md` a partir do `DOCS`, e — com a Aula 02 lançada — **não a reescreve**, dizendo qual travou. **Mutação medida**: com o derivador a escrever sempre a primeira, caem **14 das 35** |
| byte a byte, `HEAD` × agora | a `-aula-01.md` e a `-captura-aula-01.md` da `breu-rosa`, derivadas com **os mesmos argumentos** pelos dois códigos, saem **idênticas** — a generalização não mexeu no que está no ar |
| `provar-aula-dada` · `provar-aula-prosa` · `provar-formulario-da-aula` | **34/34** · **19** · **53** — verdes |
| `provar-geracao` · `provar-eixos-do-po` · `provar-objetivos-por-aula` | **54 · 42 · 51** — verdes |
| `provar-derivados-do-po` · `provar-um-commit-por-guardar` · `provar-remocao-do-elenco` · `provar-o-commit-do-po` · `provar-orcamento-do-guardar` | **16 · 22 · 26 · 14 · 16** — verdes |
| `provar-colunas-da-aula` · `provar-janela-do-lancamento` · `provar-novo-registo-e-ciclo` · `provar-menu-do-formulario` · `provar-declaracao-da-captura` | **23 · 11 · 27 · 40 · 12** — verdes |
| `node tools/check-identidade.js` · `check-sem-destruicao` · `check-indices` · `check-pacote` · `hash-ciclo --check` | **0 erros** · **ok** · **16/16** · **0 erros, 1 aviso** · **cadeia intacta** |
| `tools/regerar-derivados.js` (em seco) | mostra o diff e **não grava**; a diferença que ele mostra na `-aula-01.md` é a da **linha de base ausente** no caminho local, e é **a mesma** com o código do `HEAD` — não é desta entrega |
| Deploy / ao ar | **Não executado** — o derivador corre no Worker e no gerador; a conferência em produção é o passo seguinte ao push |

### Executado na fotografia anterior (21/11/2026 — a aula dada não se reescreve)

| Verificação | Resultado |
|:--|:--|
| `provar-aula-dada` (**nova**) | **34/34**. (A) a regra: `01`/`1`/`aula-01` normalizam para o mesmo, o registo é a chave de `aulas`, e a cópia cifrada (sem `aulas`) não tranca nada por engano; (B) com a aula 01 lançada, o «Guardar» do PO **não** escreve a aula nem a folha, diz `travadas` com o motivo, não inventa elo em `historico/` — e **continua** a corrigir o presente (harmonização, dados, cópia cifrada); (C) **controlo negativo**: sem lançamento, a aula **é** escrita e a versão anterior fica como elo; (D) a reparação: fonte ausente de aula lançada reconstrói-se, e o relatório diz `reparadas`; (E) `docsGerados` só cresce — a aula 02 já declarada sobrevive à lista nova. **Mutação medida**: com `podeRegenerar` a devolver sempre `true`, caem **10 das 34** — duas em A, seis na B, duas em D —, e o dano fica escrito: o plano e a folha vão para `historico/` como elos |
| `provar-um-commit-por-guardar` | **22/22** — estava **5/21 no `HEAD`**. Media «oito caminhos» e «seis escritas», contagens escritas à mão que envelheceram quando a notação e o glossário entraram no escritor; passou a medir a **relação** (árvore = escritas + `.conf` + declaração) e as fontes por **nome**. A mutação que tira a notação do lote faz cair a asserção por nome |
| `provar-derivados-do-po` · `provar-orcamento-do-guardar` · `provar-remocao-do-elenco` · `provar-o-commit-do-po` | **16 · 16 · 26 · 14** — verdes, sem tocar: a guarda nova não mexeu no que eles medem (o derivado muda com o PO; o elenco encolhe e as aulas ficam; o lote é um commit só) |
| `provar-geracao` · `provar-formulario-da-aula` · `provar-eixos-do-po` | **54 · 53 · 42** — verdes |
| `provar-novo-registo-e-ciclo` · `provar-declaracao-da-captura` · `provar-aula-prosa` · `provar-conteudos-e-estado-da-turma` | **27 · 12 · 19 · ok** — verdes |
| `node tools/check-identidade.js` · `node tools/check-sem-destruicao.js` | **0 erros** · **ok** (nenhum verbo destrutivo no endereço do repositório) |
| `node tools/check-indices.js` · `check-pacote` · `hash-ciclo.sh --check` | **16/16** · **0 erros, 1 aviso** (o PDF ausente, que é o desenho desde 20/11) · **cadeia intacta** na `breu-rosa` |
| `tools/regerar-derivados.js` (em seco) | mostra o diff e **não grava**; com as fontes da aula travadas pelo registo, diz `travada` e continua |
| Deploy / ao ar | **Não executado** — a regra é do motor; a conferência em produção é o passo seguinte ao push |

### Executado na fotografia anterior (13/11/2026 — uma linha por professor, dentro da cadeia)

| Verificação | Resultado |
|:--|:--|
| `provar-uma-linha-por-professor` (**nova**) | **PASSOU — 23 asserções**. (A) a cadeia de 6 elos alternando dois professores dá **2 linhas**, e são as mais recentes de cada um; (B) o histórico guarda os 4 restantes e `vigentes + histórico = acervo`; (C) a mesma cadeia com a turma renomeada no meio **não** parte em duas linhas; (D) duas cadeias independentes do mesmo professor continuam a ser dois documentos; (E) a cadeia sem alternância não regride (1 linha, 2 anteriores); (F) a anamnese não é tocada; (G) **controlo negativo** — a mesma cadeia pela regra anterior dá **6** linhas, e se desse 2 a prova não mediria nada; (H) o **acervo real** do `calango`: 18 planos → **2 linhas** · 16 em proveniência, 0 elos perdidos, 0 repetidos |
| `provar-a-autoria-na-troca-de-professor` | **41/41** — o «sem turma», o traço e o «!» continuam a cair nas linhas certas, e agora só nas duas que ficam |
| `provar-listas-do-acervo` | **109/109** |
| `provar-apagar-da-listagem` | **51/51** |
| `provar-cadeia-automatica` · `provar-cadeia-do-ajuste` | **62/62** · **34/34** |
| `provar-painel-do-ato` | **183/183** (na publicação de `calango`) |
| `provar-producao` | **164/166** — e as duas falhas são **iguais no `HEAD`**, verificadas com a alteração em stash: são da tradicional da curadoria, não desta mudança |
| `provar-listas-sem-repeticao` | **15/16** — a falha do `api/envelopes` é anterior, e está registada desde 12/11 |
| `node tools/check-identidade.js` | **8/8 ok**, 0 erros — nenhuma peça de identidade tocada |
| Deploy | **Não executado** — a mudança é do núcleo e da listagem; a conferência em produção é o passo seguinte ao push |

### Executado na fotografia de 12/11/2026 (o desenho do agente: documentação, sem código)

| Verificação | Resultado |
|:--|:--|
| `node tools/check-identidade.js` | **8/8 ok**, 0 erros — nenhuma peça de identidade visual foi tocada, e a checagem «Peça» continua a aprovar as 17 superfícies. **Executado** a 12/11/2026, depois das edições |
| Leitura dos ficheiros citados | **Executado** — `HANDOFF.md` · `ESTADO-ATUAL.md` · `ARQUITETURA-GERAL.md` §2/§4/§5.26/§7.3/§7.4 · `REGRAS.md` · `PROTOCOLO.md` · `PLANEJAMENTO-LASTRO.md` (L1–L15, §5, §6) · `CONGELAMENTO.md` · `PLANO-PERGUNTAS-DA-PROVENIENCIA.md` §1 · `motor/nucleo/ia.js` · `motor/nucleo/indices.js` · `motor/servidor/indice-acervo.js` · `motor/servidor/subpedidos.js` · `motor/servidor/producao.js` · `motor/servidor/rotas.js` · `indices/esquema/*.json` · `biblioteca/modalidades/bale-classico/*.json` · `professores/pe-torto/perfil.json`. O que **não** foi lido: o `REGISTRO.md` inteiro (43 mil linhas), que foi lido por amostragem no fim |
| Contagem do custo do rebuild do índice | **Executado** por contagem do repositório: 9 `.fipp`, 3 `escola/*/indice.json`, 1 `escola/*/envelopes/.indice.json` ⇒ com a árvore, **14 subpedidos**. O código (`construirDoAcervo`) confirma uma leitura por cada um |
| Tabela de Neurons e tecto diário | **Executado** — lido da página de preços da Cloudflare a 12/11/2026: **10.000 Neurons/dia** na conta gratuita; `llama-3.1-8b-instruct-awq` a **11.161/M de entrada** e **24.215/M de saída**. A conta de ≈86 Neurons por interação está escrita no `ARQUITETURA-AGENTE.md` §7.2 e **é uma estimativa por tabela, não uma medição** |
| Contador de subpedidos e KV | **CONFIRMADO por leitura**: `contarSubpedidos` embrulha o `fetch`, e o `kv.get` não passa por lá. A doc de limites da Cloudflare diz que KV **é** subpedido. **Não medido** — a correção é da frente L15 |
| Provas do motor | **Não executadas nesta entrega** — nenhuma linha de código de motor mudou. As provas da entrega anterior continuam como estavam, e o `HEAD` está verde no que estava verde |
| Deploy | **Nenhum deploy desta entrega** — nenhum `wrangler.<escola>.jsonc` e nenhum ficheiro do Worker foram tocados pelo desenho do agente. Um deploy aqui não publicaria nada e gastaria cota de KV à toa. **Distinto disto:** o `calango` foi republicado a 12/11/2026 para pôr ao ar a correção de 10/11 da cadeia que pára no teto — versão `f819a22d` —, e a conferência gastou **3** pedidos (raiz **200**; `POST /api/bastidores/cadeia-pacote` sem corpo **400** com «diga de que turma são os documentos»; rota inexistente **404**). A travessia inteira **não** foi percorrida ao ar, de propósito |

### Executado na fotografia anterior (10/11/2026 — a ordem da decomposição e a duplicação de uma linha)

| Verificação | Resultado |
|:--|:--|
| `provar-ordem-e-duplicacao` (**nova**) | **PASSOU — 31 asserções**, no motor e num Chrome de verdade. (A) o motor devolve os trechos na ordem cronológica declarada, o compasso acompanha (por pista), e a ordem vai em cada segmento; (B) sem `ordem` — o que está gravado até hoje — a leitura é **exactamente** a de antes, e um trecho novo entra no fim; (B2) a validação recusa `ordem` fraccionária ou zero e aceita a ausência; (C) a tabela da página mostra a MESMA ordem do motor, e os compassos nunca descem; (D) cada linha tem o seu «Duplicar», o botão global **não existe**, e a cópia — de uma linha só — vai para o fim, duas vezes seguidas se forem duas; (E) corrigir um trecho do meio não o move; (F) **controle negativo**: a leitura por gavetas reprova o caso dela |
| `provar-producao` · `provar-musica-do-verbete` | **166/166** · **33/33** — verdes |
| `provar-busca-do-exercicio` · `provar-historico-do-ajuste` · `provar-largura-da-lista` | **68 · 39 · 56** — verdes |
| `check-identidade` · `check-glossario` | **0 erros (21 ok)** · consistente (14 símbolos) |
| `provar-celula` · `provar-notacao` | **as mesmas falhas do `HEAD`** — 2 e 13, contadas igual num worktree à parte; anteriores a esta entrega |
| `check-pacote` (calango-rosa) | **1 erro, idêntico no `HEAD`**: o pacote mistura dois POs (fontes que vieram do remoto). Não é desta entrega, e o pacote não foi tocado |
| **o que NÃO mede / não passa** | Nada foi corrido **ao ar** nesta sessão. Não há reordenação manual — a ordem é a de criação, e mover uma linha exige apagar e reescrever as seguintes |

### Executado na fotografia anterior (10/11/2026 — a busca do exercício no passo 1)

| Verificação | Resultado |
|:--|:--|
| `provar-busca-do-exercicio` (**nova**) | **PASSOU — 68 asserções**, num Chrome de verdade, contra o código servido e um vocabulário de bancada. (A) o caminho que estava fechado: escrever o nome de um exercício que existe preenche categoria, tradição e definição, escolhe-o no passo 2 e **mantém o passo 2 aberto**; (B) a busca por acento (`plie` → `Plié`), por prefixo (`pli`), por meio (`tendu`) e por semelhança (`batman` → `Battement…`, `fondue` → `…fondu`), e uma letra só não lista nada; (C) a escolha pela lista, com a grafia do dicionário; (D) o exercício **novo**: os três campos abertos, vazios, e o passo 2 fechado até estarem preenchidos; (E) **não duplicar**, com **contraprova** — o termo inédito é gravado; (F) o teclado (setas, `Enter` escolhe sem criar, `Escape` fecha); (G) a classificação **editável** e o ajuste dela a sobreviver ao preenchimento; (H) o passo 1 a acompanhar o passo 2; (I) a geometria — a lista com a largura exacta do campo e **44px** por sugestão, a 1366 e a 390 |
| `provar-producao` · `provar-largura-da-lista` | **166/166** · **56/56** — verdes |
| `provar-vao-do-botao` · `provar-abas-da-audicao` · `provar-historico-do-ajuste` · `provar-celular` | **50 · 86 · 39 · 15** — verdes |
| `check-identidade` | **0 erros (21 ok)** — a lista de sugestões é declarada no `<style>` da própria página, o regime da checagem 4 |
| `provar-celula` | **NÃO CORRE ATÉ AO FIM** — pára em «a decomposição pede o exercício antes de o haver», e **falha exactamente no mesmo ponto no `HEAD`** (verificado num worktree à parte): é anterior a esta entrega |
| **o que NÃO mede / não passa** | Nada foi corrido **ao ar** nesta sessão. A busca é **local** (o vocabulário carregado com a página) e a semelhança é de **prefixo** — um erro no meio da palavra não é encontrado |

### Executado na fotografia anterior (10/11/2026 — o histórico do ajuste)

| Verificação | Resultado |
|:--|:--|
| `provar-historico-do-ajuste` (**nova**) | **PASSOU — 39 asserções**, contra o código servido e o KV falso. (A) o rótulo em português corrente, singular e plural, e **nenhum `(ões)`** na página; (B) a **diferença** calculada: a hora agrupada por transição («ter, qui: 18:00 → 19:00», e não repetida por dia), a duração, o dia que entrou, o dia que saiu, o fim do período — e «(sem alteração)» quando nada mudou; (C) a data em **BR nas duas listas** e no selo, sem nenhuma ISO crua; (D) o motivo aparece quando declarado, **cala-se** quando não, e **não é herdado** pelo elo seguinte; (E) as **rotas**: o motivo fica no elo novo com os espaços normalizados, o elo antigo não é tocado, e a segunda derivação sem motivo não herda o da primeira; (F) a Turma nomeia o **professor** (e não o slug), a sala que mudou, a modalidade, a tradição e as alunas. Só o `fetch` é falso (404 — bancada sem GitHub) |
| `provar-producao` · `provar-largura-da-lista` | **166/166** · **56/56** — verdes |
| `provar-mudanca-de-sala` · `provar-cadeia-automatica` · `provar-transferencia-e-desligamento` | **41 · 60 · 93** — verdes |
| `provar-vao-do-botao` · `provar-celular` | **50/50** · **15/15** — verdes (o campo novo é a peça `campo` de sempre, e o vão do botão não mudou) |
| `check-identidade` | **0 erros (21 ok)** |
| **o que NÃO mede / não passa** | Nada foi corrido **ao ar** nesta sessão. O **motivo não é obrigatório** — por decisão: quem deriva sem escrever nada continua a ter a diferença, e só não tem a razão |

### Executado na fotografia anterior (10/11/2026 — a faixa de 1141 a 1919px)

| Verificação | Resultado |
|:--|:--|
| `provar-largura-da-lista` (**nova**) | **PASSOU — 56 asserções**, num Chrome de verdade. Doze larguras (320, 390, 560, 768, 1024, 1141, 1200, 1280, 1366, 1440, 1600, 1920): (A) nada transborda; (B) acima de 1141 o nome da linha nunca desce de `11rem`; (C) ações e etiqueta ficam dentro da linha; (D) a listagem a 1366 tem ≥640px (era 561); (E) o formulário fica entre 20rem e 34rem — e a 1920 mede **exactamente 544px**; (F) a 1920 a listagem (1115px) e o nome (717px) são **os de antes**. **Controle negativo**: reposta a regra antiga, a listagem a 1366 desce abaixo de 640 e o nome a 1141 abaixo de 176 — a prova reprova o código antigo, portanto mede o que diz medir |
| `provar-producao` · `provar-celular` | **166/166** · **15/15** — verdes (a conferência da uniformidade do formulário passou a ler a expressão nova: o que ela guarda é o tecto de `34rem` e a uniformidade entre as secções, não a grafia) |
| `provar-menu-da-producao` · `provar-vao-do-botao` · `provar-abas-da-audicao` | **55 · 50 · 86** — verdes |
| `check-identidade` | **0 erros (21 ok)** |
| **o que NÃO mede / não passa** | Nada foi corrido **ao ar** nesta sessão. `provar-faixa-do-ato-no-celular` **não correu**: depende de `escola/breu/envelopes/`, que não existe neste clone — declarado, não silenciado |

### Executado na fotografia anterior (09/11/2026 — a mudança de sala)

| Verificação | Resultado |
|:--|:--|
| `provar-mudanca-de-sala` (**nova**) | **PASSOU — 41 asserções**. (A) a regra pura: sala ocupada, sala livre, a versão substituída e a direção **encerrada** não ocupam; (B) as duas rotas: 409 ao criar ou mover para uma sala ocupada, com quem ocupa e as livres; a Sala livre aceita; derivar mantendo a própria sala é aceite; (C) o ritmo relido: frequência pelos dias, duração em horas/minutos, calendário e total **calculados**; (D) o plano marcado quando a Sala mudou depois dele — e o controlo sem as Salas, que não marcava nada; (E) o gatilho corre com Turma e **não** corre com a sala livre; (F) os conflitos chegam à tela |
| `provar-derivacao-da-turma` · `provar-enquadramento-da-turma` | **118/138** (as **mesmas 20 falhas** do `HEAD`, comparadas falha a falha num worktree à parte; +6 asserções novas da prova, todas verdes) · **57/57** (as salas novas que a guarda exige nos cenários que reusavam a mesma sala) |
| `provar-cadeia-automatica` · `provar-producao` · `provar-transferencia-e-desligamento` | **60 · 166 · 93** — verdes |
| `provar-linha-de-base` · `provar-abas-da-audicao` · `provar-conteudos-e-estado-da-turma` | **102 · 86 · 77/78** (a falha é pré-existente, idêntica no `HEAD`) |
| `check-identidade` · `check-pacote` | **0 erros (21 ok)** · **0 erros** no pacote regenerado |
| **o que NÃO mede / não passa** | Nada foi corrido **ao ar** nesta sessão. A **vigência futura** não é respeitada — por decisão dela, registada no `REGISTRO.md` |

### Executado na fotografia anterior (09/11/2026 — a cadeia automática)

| Verificação | Resultado |
|:--|:--|
| `provar-cadeia-automatica` (**nova**) | **PASSOU — 60 asserções**. (A) o índice: quatro etapas na ordem da dependência, estados derivados e a porta do fluxo completo; (B) a travessia inteira: um elo novo de plano e um de PO, ambos com `ajuste_de`, a fonte do plano escrita, o pacote fechado e os vínculos sincronizados; (C) o registo **incompleto**: os vínculos fazem-se, nada é inventado, e a etapa bloqueada traz a frase e o caminho; (D) a idempotência: repetir não empilha elos; (E) o log; (F) as rotas: `elenco-mover` entrega os **dois** elencos à cadeia e devolve o resultado, e `GET /api/bastidores/cadeia` lê o log; (G) o orçamento: com o pedido no fim do teto, a travessia **não começa** e a Turma não é tocada |
| `provar-cadeia-do-ajuste` (o caminho extraído de `rotas.js`) | **34/34** — o bloco «PO concluído vira fonte, gera o ciclo e dispara» passou a `motor/servidor/concluir-po.js` com **três** consumidores, e o comportamento manteve-se |
| `provar-producao` · `provar-transferencia-e-desligamento` · `provar-linha-de-base` | **166 · 93 · 102** — verdes |
| `provar-linha-de-base-no-repo` · `provar-elenco-na-turma` · `provar-abas-da-audicao` | **39 · 25 · 86** — verdes |
| `provar-derivacao-da-turma` | **112/132** — as **mesmas 20 falhas** anteriores à mudança, iguais no `HEAD` (rótulos e campos que a prova ainda espera de uma versão antiga do formulário) |
| `check-identidade` | **0 erros** (21 verificações) |
| **o que NÃO mede / não passa** | Nada foi corrido **ao ar** nesta sessão: as provas são de bancada, e a conferência em produção é o passo seguinte ao deploy. A cadeia **não corre** num Worker sem `GITHUB_TOKEN` ou sem os conteúdos da porta — a rota diz isso, e o gesto fica gravado |

### Executado na fotografia anterior (08/11/2026 — o orçamento de subpedidos e a trava da operação)

| Verificação | Resultado |
|:--|:--|
| `provar-orcamento-do-guardar` (**nova**) | **PASSOU — 16 asserções**. Zero `POST /git/blobs`, uma listagem de `historico/`, um commit só, **16 subpedidos** (eram 26), e a recusa com `motivo: 'orcamento'` sem **nenhuma** escrita e sem gastar subpedido a descobrir isso |
| **a contraprova** | no `HEAD`: **FALHOU — 8 de 16** (26 subpedidos, sete blobs, e o orçamento curto a escrever na mesma) |
| `provar-trava-da-operacao` (**nova**) | **PASSOU — 19 asserções**, num Chrome sobre a porta publicada: o véu cobre a janela inteira, diz o passo, o conteúdo fica `inert`, o ponteiro encontra o véu mesmo em cima de um botão; `liberar()` devolve tudo; `esperarAGeracao` desiste quando não há geração; e o «Guardar» tranca antes de escrever e destranca num `finally` |
| **a contraprova** | no `HEAD`: **FALHOU — 2 de 19** |
| `provar-um-commit-por-guardar` · `provar-derivados-do-po` · `provar-remocao-do-elenco` · `provar-vinculo-do-elenco` | **21 · 16 · 26 · 26** — verdes |
| `provar-listas-do-acervo` · `provar-painel-do-ato` · `provar-acervo-envelopes` · `provar-producao` | **109 · 183 · 52 · 166** — verdes |
| `provar-senha-do-lancamento` · `provar-familia-do-lancamento` · `provar-vao-do-botao` · `provar-celular` | **19 · 44 · 50 · 15** — verdes |
| `check-identidade` · `check-schemas` | **0 erros** · verde |
| **o que NÃO mede / não passa** | `provar-aparencia` (76/77) e `provar-tema` (37/38) falham **identicamente no `HEAD`** — pré-existentes, comparadas falha a falha. O **ao ar** confirma-se no deploy desta entrega |

### Executado na fotografia anterior (08/11/2026 — a aluna que sai do elenco)

| Verificação | Resultado |
|:--|:--|
| `provar-remocao-do-elenco` (**nova**) | **PASSOU — 26 asserções**. (A) a cascata no núcleo: o `saiu` na curadoria a descer ao plano e ao PO; (B) a geração: as aulas **sobrevivem** a um «Guardar» de PO que rode com o elenco novo, o elenco encolhe, o mapa de nomes mantém quem já foi lançada e a cópia cifrada cifra o **mesmo** texto; (C) o formulário **num Chrome**: aula nova oferece só o elenco, aula lançada mostra quem lá esteve, com nome; (D) um `-dados.json` **sem** `elenco` lista o mapa inteiro; (E) o acervo: a anamnese de quem saiu continua **vinculada** |
| **a contraprova** | no `HEAD` (worktree à parte): **FALHOU — 16 de 26** (10 falham) |
| `provar-estante-do-po` (alterada) | **30/30** — deixou de congelar a contagem («os DOIS planos») e passou a afirmar a regra: a cadeia inteira aparece, cada elo substituído vem marcado, o topo é **um só**. Contraprova com a marca removida do núcleo: **23/30** |
| `provar-derivados-do-po` · `provar-senha-do-lancamento` · `provar-familia-do-lancamento` · `provar-um-commit-por-guardar` · `provar-vinculo-do-elenco` | **16 · 19 · 44 · 21 · 26** — verdes |
| `provar-listas-do-acervo` · `provar-painel-do-ato` | **109 · 183** — verdes |
| `check-identidade` · `check-schemas` · `check-indices` · `gerar-indices` · `gerar-relacoes` | **0 erros** · verde · **16/16** · sem pendências · sem pendências |
| **o que NÃO mede / não passa** | `provar-formulario-da-aula` falha **5 de 48 identicamente no `HEAD`** (pré-existente, comparada `FALHA` a `FALHA`), e `provar-lancamento` falha por `ENOENT` num `professores/tiago/` que não existe. O **ao ar** confirma-se no deploy desta entrega |

### Executado na fotografia anterior (08/11/2026 — o vínculo da anamnese lê o elenco)

| Verificação | Resultado |
|:--|:--|
| `provar-vinculo-do-elenco` (**nova**) | **PASSOU — 26 asserções**, com os envelopes e a linha de base **reais** da `batata`. Sem o elenco, a Aluna B sai «solta» (o defeito, reproduzido); com ele, «vinculada», com os três POs, e a Aluna A continua vinculada. As negativas: elenco de turma **sem** PO continua livre, quem saiu do elenco continua vinculada, e sem linhas de base não se inventa vínculo. As rotas: `PUT` e `DELETE` da Aluna B dão **409** (e a recusa nomeia os POs), a aluna que ninguém observa continua a apagar-se (**200**). A gravação: elo novo, e o A/B a mostrar que **sem o elenco o mesmo gesto sobrescrevia** o registo. A listagem servida pelo Worker: etiqueta «vinculada», sem «apagar» nem «editar» |
| **a contraprova** | no núcleo de `HEAD` (worktree à parte): **FALHOU — 11 de 26** |
| `provar-apagar-da-listagem` · `provar-listas-do-acervo` · `provar-anamnese-por-aluna` · `provar-anamnese-sem-cofre` · `provar-alunas-da-anamnese` | **51 · 109 · 15 · 13 · 14** — verdes |
| `provar-producao` · `provar-linha-de-base` · `provar-cadeia-do-ajuste` · `provar-ciclo-herdado-do-plano` · `provar-estante-do-po` | **166 · 102 · 34 · 20 · 29** — verdes |
| `provar-proveniencia-e-turma` · `provar-acervo-envelopes` · `provar-po-completo` · `provar-ciclo-do-painel-do-po` | **53 · 52 · 20 · 27** — verdes |
| `check-identidade` · `check-schemas` · `check-indices` · `gerar-indices --check` | **0 erros (21 ok)** · verde · **16/16** · **5 em dia** |
| **o que NÃO mede / não passa** | `provar-ajustes-anamnese` e `provar-recorte-do-po` falham **identicamente no `HEAD`** (medidas no worktree à parte, comparadas `FALHOU` a `FALHOU`) — pré-existentes. O **ao ar** só se confirma no deploy desta entrega |

### Executado na fotografia anterior (04/11/2026 — os ciclos apagam-se de trás para a frente, a sequência, e a anamnese datada)

| Verificação | Resultado |
|:--|:--|
| `provar-ciclos-e-anamnese` (**nova**) | **TUDO CERTO — 34 asserções**: o próximo ciclo é `01`/o seguinte, e **um buraco (01, 03) não tem próximo honesto**; a ordem é **numérica** (doze ciclos → 11); os ciclos vêm do índice (e a **anamnese sem ciclo não inventa um**); apagar um **intermédio é recusado** com o nome do que impede, e **nada é escrito no GitHub**; o **último** apaga, leva só o gerado e **não toca no ciclo 01**; um **422** refaz o caminho e entra à segunda; o padrão da variante **não come** `breu-bale-nivel-1-teste-3`; a chave da anamnese **não tem ciclo** (duas datas, um sujeito, uma linha vigente); e o gesto é **«Novo registo»**, não «Ajustar» |
| `provar-contexto-do-ato` | **39 asserções**, atualizadas à regra nova — a anamnese pede `escola · professor · aluna` e **não** ciclo; a explicação nomeia os campos DESTA fonte. **Controlo negativo**: com a regra antiga reintroduzida, a bancada volta a reprovar nos dez pontos que a medem |
| `provar-apagar-da-listagem` | **32** — a anamnese vinculada oferece «Novo registo» e **não** «Ajustar» |
| `ARQUITETURA-GERAL.md` | §5.4.1 (apagar um ciclo), §5.4.2 (a anamnese é do sujeito e é datada), §5.4.3 (revalidação e a ordem) — as **17 referências `§` resolvem**, as **14 cercas** emparelhadas |
| Regressão | `provar-faixa-do-ato-no-celular` · `provar-sequencia-que-acompanha` · `provar-eixos-do-po` · `provar-producao` · `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-colunas-da-aula` · `provar-verbos-do-armazenamento` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-acervo-envelopes` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-po-completo` · `provar-plano-completo` · `provar-indice-de-envelopes` — **todos verdes** |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| **o que NÃO mede** | a exclusão foi exercitada num **GitHub falso** (as três respostas que a rotina usa), não contra o ar · **a interface de exclusão não existe ainda** (a rota e a guarda estão prontas) · a listagem da anamnese **não** está em acordeão por aluna — mostra o vigente e diz quantas versões guardou |

### Executado na fotografia anterior (04/11/2026 — a faixa no telefone, as 3 asserções, e a capacidade)

| Verificação | Resultado |
|:--|:--|
| `provar-faixa-do-ato-no-celular` (**nova**) | **TUDO CERTO — 40 asserções** a 320, 360, 390 e 414px, no Chrome, com o **envelope verdadeiro** da `breu`: nenhum par de campos se sobrepõe, todo campo cabe na faixa, o controle cabe no campo, **todo rótulo tem ≥ 40px de largura**, rótulo e valor não se sobrepõem, e a página não transborda. **Reprovou antes da correção** (rótulo a 0px, valor a 129px a 360px) e passa depois |
| `provar-producao` | **158 de 158** (era 153/156). As três: o DOM falso passou a responder a `.lateral a[data-secao]` e a ter `classList`; a lista das tradições e a contagem das pílulas passaram a ser **lidas das fontes** (5 tradições, não 4; 23 pílulas, não 16) |
| `ARQUITETURA-GERAL.md` | §2.2 corrigida (o composto **encaminha**, não enumera) · **§7.2 nova** · conferido: as **17 referências `§` resolvem**, as **14 cercas** emparelhadas |
| Regressão | `provar-celular` · `provar-contexto-do-ato` · `provar-eixos-do-po` · `provar-eixos-e-tempo-da-aula` · `provar-cartao-da-aula` · `provar-sequencia-que-acompanha` · `provar-colunas-da-aula` · `provar-verbos-do-armazenamento` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-acervo-envelopes` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-po-completo` · `provar-plano-completo` · `provar-indice-de-envelopes` — **todos verdes** |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| **o que NÃO mede** | a faixa foi medida num servidor local com respostas **stubadas** (não no ar) · a capacidade do §7.2 é **projecção aritmética**, não ensaio de carga · o instantâneo do `aspecto-fisico` não guarda proveniência, e a divergência com a anamnese não se detecta |

### Executado na fotografia anterior (04/11/2026 — os três eixos do PO, o corpo da anamnese, e o §1 sem «Port de bras»)

| Verificação | Resultado |
|:--|:--|
| `provar-eixos-do-po` (**nova**) | **TUDO CERTO — 34 asserções**: o sujeito vem **antes** das dimensões (e o bloco dos sujeitos é o primeiro do roteiro); o eixo decide-se pelo **bloco** («Técnica — Musicalidade» lê-se **Poiesis**, e o Corpo é eixo próprio); o documento traz a coluna **Eixo** com Musicalidade e Expressão na Poiesis e **nenhuma** na Técnica; o Corpo aponta a «Linha de base» e diz as restrições; a linha sob o título é o **Fenómeno** (e não o horizonte nem a pergunta); e na tela (JSDOM) o painel do corpo **carrega da anamnese**, com o **nome** do campo, o **valor**, e sem inventar o que ela não respondeu |
| O §1 da aula, no envelope real | a matriz do parâmetro tinha `Port de bras` no objetivo 2 e o `repertorio` do **mesmo** envelope é `["Battement tendu","Plié"]` → o §1 sai sem ele; **controlo negativo**: sem repertório ele volta (não se julga o que não se pode conferir), e com o repertório a declará-lo ele volta também |
| A mesma régua na ficha do plano | `ficha-do-plano.js` passa a filtrar pelo repertório — era a segunda porta aberta da mesma janela |
| `gerar-ciclo` + `check-pacote` do ciclo da `breu` | **0 erro(s), 0 aviso(s)** — e a `-aula-01.md` foi regerada da mesma função e do mesmo envelope: o **diff é exactamente** a linha do parâmetro |
| A `-po.md` regerada | o diff são **as três mudanças pedidas** e nada mais: a linha do Fenómeno, os blocos sem prefixo, e a tabela com a coluna do eixo — validada contra o `ciclo-01-po-schema.json` (13 campos) |
| O HTML e o PDF gerados | `aula-01.html` e `aula-01.pdf` com **zero** ocorrências de «Port de bras» |
| A âncora | `.fipp` regerada e `--check` verde; `indices/` regerados; `check-indices` **14/14** |
| `check-identidade` | **20/20** (a cópia da porta nos dois pacotes refrescada) |
| Regressão | `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-sequencia-que-acompanha` · `provar-colunas-da-aula` · `provar-verbos-do-armazenamento` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-um-commit-por-guardar` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-sinais-da-modalidade` · `provar-professor-secundario` · `provar-plano-da-turma` · `provar-contexto-do-ato` · `provar-po-completo` · `provar-plano-completo` · `provar-indice-de-envelopes` — **todos verdes** |
| **o que NÃO mede** | a tela foi medida em JSDOM com a anamnese **stubada** (não no ar) · os POs já gravados noutras escolas continuam com «Técnica — …» **dentro do envelope** (P-03: a leitura corrige, o dado não se reescreve) · a captura **não** ganhou bloco de corpo |

### Executado na fotografia anterior (04/11/2026 — os verbos, a modalidade e o custo da API)

| Verificação | Resultado |
|:--|:--|
| `provar-verbos-do-armazenamento` (**nova**) | **TUDO CERTO — 29 asserções**: os **7 verbos lidos do ficheiro do contrato** chegam aos dois adaptadores de base, ao acervo e ao **composto**; o `criar` **funciona** nos três (a segunda criação sabe que o nome é de outro e **não** sobrescreve, e o `guardar` continua a gravar por cima); o motor vê o `criar` **pelo `criarArmazenamento`**, que é o que a produção monta; e o composto **deixou de enumerar** — um verbo inventado na hora atravessa-o, um que ninguém implementa é **recusado** (não devolvido vazio), e o `Proxy` **não** o torna uma *thenable* |
| O `criar` no adaptador `node` | 1.ª → `{criado:true}` · 2.ª → `{jaExiste:true}` · o conteúdo continua `um` · e o `guardar` ainda sobrescreve |
| A modalidade derivada | `MODALIDADE_PADRAO` = `bale-classico` **derivada do catálogo** · `modalidadePrincipal([])` → `''` · `modalidadePrincipal([{id:'jazz',temConteudo:false}])` → `'jazz'` · e **restam 7** ocorrências do literal, todas em caminhos de `require` ou comentário |
| `ARQUITETURA-GERAL.md` | conferido contra a árvore: **34 secções**, as **17 referências `§` resolvem**, as **14 cercas** emparelhadas, as **8 ligações internas** existem · novas **§5.7** (os verbos) e **§7.1** (o preço da escrita) |
| Regressão | `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-cadeia-do-ajuste` · `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-colunas-da-aula` · `provar-um-commit-por-guardar` · `provar-publicacao-da-escola` · `provar-habilitacao-do-professor` · `provar-sinais-da-modalidade` · `provar-professor-secundario` · `provar-plano-da-turma` · `provar-contexto-do-ato` — **todos verdes** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** |
| `check-pacote` do ciclo da `breu` | **0 erro(s), 0 aviso(s)** |
| **o que NÃO mede** | os limites da API vêm da **documentação** do GitHub, não de uma rajada provocada (provocá-la custaria cota no ar) · o KV **não** tem escrita condicional (a ressalva está dita no código) · e **nada valida os pacotes que já estão no repositório** — o `check-pacote` só corre dentro do gerador, e o `ciclo-01-breu` está no `main` com **11 erros** |

### Executado na fotografia anterior (04/11/2026 — as colunas da aula e a notação fora da música)

| Verificação | Resultado |
|:--|:--|
| `provar-colunas-da-aula` (**nova**) | **TUDO CERTO — 23 asserções**: a §4 do bloco de musicalidade sem **uma única** célula com `[Perna` e sem crase, a contagem reduzida a `1–2`, e o compasso/exercício ainda lá; a notação **no documento dela** e **ausente** da aula; a linha de separação **acima de 72 caracteres** (o gatilho do pandoc); a proporção **12/12/23/52** (compasso e contagem ≤ 15%, descrição > 45%, notação ≥ 20%); e o **pandoc a concordar** no `colgroup` que escreve, com tolerância de um ponto de arredondamento. Mede ainda a aula em prosa: três colunas, descrição > 55%, numéricas ≤ 20% |
| `gerar-ciclo` + `check-pacote` | **0 erro(s), 0 aviso(s)** — a §4 saiu `2/4 · Battement tendu · 8 · 1–2`, e as doze tabelas de exercício do documento de notação com as larguras novas |
| O HTML gerado | `notacao.html`: as **12** tabelas de exercício a **12/12/23/52** (eram 28/28/21/21) · `aula-01.html`: as 12 tabelas de prosa a **15/15/68** (eram 36/36/27), e **nenhuma** ocorrência de `Perna:` na página da aula |
| `validar-aula-ciclo` + extracção | o `-aula-01.md` passa, com **zero avisos** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** |
| `provar-cartao-da-aula` · `provar-eixos-e-tempo-da-aula` · `provar-cadeia-do-ajuste` · `provar-fusao-da-edicao` · `provar-publicacao-da-escola` · `provar-um-commit-por-guardar` | **25 · 38 · 34 · 29 · 63 · 21** — verdes |
| **o que NÃO mede** | as percentagens foram medidas no HTML que o pandoc escreve **localmente** — nada foi medido no ar · as outras tabelas de duas colunas (§1, eixo do Corpo, auditoria) continuam **50/50**: têm o mesmo defeito, e não foram tocadas porque foram aprovadas |

### Executado na fotografia anterior (04/11/2026 — o cartão da aula, os três eixos e os links)

| Verificação | Resultado |
|:--|:--|
| `provar-cartao-da-aula` (**nova**) | **TUDO CERTO — 25 asserções**: a Turma **sem «Ciclo»** e com o operacional (aula N de M, dia, início, fim, duração, Sala «não declarada»); o Professor com **nome**, **modalidade** («Balé clássico», rótulo do catálogo) e **tradição** («RAD», do plano) — e **nunca o slug**; a caixa do guia fechada a dizer «23 critérios · 3 eixos»; e o painel com Corpo 15 · Técnica 4 · Barra, Centro · Poiesis 4 · Musicalidade, Expressão. Mede também o que **não pode voltar**: a frase de arquitetura |
| `provar-eixos-e-tempo-da-aula` | **38** (eram 27): três blocos de eixo **nesta ordem**, uma linha por item em cada eixo, **a coluna «Eixo» ausente**, o **corpo com linhas próprias**, os **links da proveniência** a abrirem a folha com o `id` e o `formato=html` (e a caírem na porta quando não há `id`), e o **contrato de extração** a ler os três blocos **sem aviso de segunda tabela** |
| `gerar-ciclo` + `check-pacote` do ciclo da `breu` | **0 erro(s), 0 aviso(s)** — a §5 saiu com as três tabelas e o Corpo com 18 linhas (15 aspectos + 2 da linha de base + a restrição); a §6 com os dois links para as folhas |
| A extracção do `-aula-01.md`, com o contrato real | `guiaDeObservacao` com **Corpo 18 · Técnica 4 · Poiesis 4**, e **zero avisos** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** (a cópia da porta no pacote-zero refrescada) |
| `provar-cadeia-do-ajuste` · `provar-fusao-da-edicao` · `provar-corrida-da-escrita` · `provar-publicacao-da-escola` · `provar-um-commit-por-guardar` | **34 · 29 · 30 · 63 · 21** — verdes |
| **o que NÃO mede** | a folha de leitura **não foi aberta no ar** (a prova mede o endereço que o documento escreve, não a resposta do Worker) · `provar-listas-do-acervo` segue **NÃO FEITO** |

### Executado na fotografia anterior (04/11/2026 — a fusão das edições, e a arquitetura como espelho)

| Verificação | Resultado |
|:--|:--|
| `provar-fusao-da-edicao` (**nova**) | **TUDO CERTO — 29 asserções**: o `combinar` a encaminhar `criar`, `anexar` e `gravarComFusao`; **campos diferentes a unificar** (o objetivo de um e o repertório do outro, ambos no arquivo); o **mesmo campo** a decidir pela recência nos dois sentidos (900 ms de diferença, cada lado a vencer uma vez); o empate a ir para quem grava, e a repetir igual; sem base a não adivinhar; o **409 dentro da fusão** a repetir e a sair fundido; e o carimbo a preferir `escrito_em` sobre `gerado_em` |
| `provar-corrida-da-escrita` | **30** (eram 27) — duas asserções novas: a corrida do nome provada **pelo `combinar`**, e não pelo acervo direto |
| `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-indice-de-envelopes` | **48 · 55 · 44** — verdes |
| `provar-cadeia-do-ajuste` · `provar-vigente-na-listagem` · `provar-eixos-e-tempo-da-aula` | **34 · 21 · 27** — verdes |
| `provar-um-commit-por-guardar` · `provar-expurgo-sem-listagem` · `provar-apagar-professor-livre` · `provar-publicacao-da-escola` · `provar-porta-sem-contexto` · `provar-po-unico` · `provar-sujeitos-da-turma` | **21 · 49 · 56 · 63 · 44 · 18 · 30** — verdes |
| `ARQUITETURA-GERAL.md` | conferido contra a árvore: **14 caminhos citados, todos existem** · **as 14 referências `§` resolvem** para secções existentes · as **7 cercas de código** emparelhadas · **6 ligações internas**, nenhuma em falta |
| **o que NÃO mede** | a fusão **não foi medida com dois browsers reais contra o Worker publicado** (as bancadas correm sobre um GitHub falso) · `provar-listas-do-acervo` segue **NÃO FEITO** |

### Executado na fotografia anterior (04/11/2026 — a corrida da escrita e o expurgo)

| Verificação | Resultado |
|:--|:--|
| `provar-corrida-da-escrita` (**nova**) | **TUDO CERTO — 27 asserções**: o mesmo carimbo pedido por dois pedidos (a janela existe), as duas gravações a ficarem (nenhum documento evaporado), o índice a descrever o **arquivo** e não a tentativa perdida, a edição em sítio a reescrever o **mesmo** nome, o **422 «"sha" wasn't supplied»** como «já existe» (e um 422 por outro motivo como **erro**), o 409 de corrida a repetir, e o **expurgo** a publicar à segunda tentativa — com a **gravação cega ao lado, a perder um**, para o defeito medido ficar fixado |
| O **422 do GitHub** | **medido contra a API real**, num ramo descartável (`teste-corrida-do-carimbo`, criado e apagado no mesmo minuto): criar sem `sha` → `201`; criar sem `sha` sobre caminho existente → **`422 "Invalid request. \"sha\" wasn't supplied."`**. **Nada foi escrito no `main`** |
| `provar-acervo-envelopes` · `provar-carimbo-da-edicao` · `provar-indice-de-envelopes` | **48 · 55 · 44** — verdes. As duas primeiras foram as que **apanharam** a primeira versão da correção: a escrita condicional aplicada à edição em sítio inventava um `-2` a cada «Guardar» |
| `provar-cadeia-do-ajuste` · `provar-vigente-na-listagem` · `provar-eixos-e-tempo-da-aula` · `provar-publicacao-da-escola` · `check-identidade` · `check-indices` | **34 · 21 · 27 · 63 · 20/20 · 14/14** — verdes |
| **o que NÃO mede** | `provar-listas-do-acervo` segue **NÃO FEITO** (a única escola viva não tem ciclo publicado para servir) · o caso «duas pessoas no mesmo documento» **não tem prova**: é a decisão 84, em aberto |
| **regressões** | 13 bancadas comparadas com o `HEAD` limpo (`git stash`), **resultado idêntico asserção a asserção** — as falhas delas são pré-existentes (pacotes de escolas expurgadas, Puppeteer) |

### Executado na fotografia anterior (04/11/2026 — o ajuste arrasta o PO, e o cartão mostra o guia)

| Verificação | Resultado |
|:--|:--|
| `provar-cadeia-do-ajuste` (**nova**) | **TUDO CERTO — 34 asserções**: a cadeia do `ajuste_de` e o vigente, o PO achado por qualquer elo, a referência que segue o topo (com `planoRetargetado`), o elo do PO criado pelo «Guardar» do plano vinculado — fonte, ciclo e disparo —, a repetição que não multiplica elos, e o plano sem PO que não inventa observação |
| A ponta, com o **envelope real** `plano-20261104-1732` + o PO | a Aula 01 sai com **`Expressão \| 27 \| 30%`** — era `[Preencher]` |
| `montar-publicacao` numa árvore de prova (pacote-zero + uma turma) | o cartão passa a ter **Turma** (com o dia, as horas, a duração e a Sala «não declarada»), **Professor** sem a nota de arquitetura e **Guia de observação** («8 critérios · 4 dimensões», um par por dimensão), com a linha de síntese «Técnica — Solo, Barra, Centro · Poiesis — Musicalidade» |
| `provar-vigente-na-listagem` · `provar-acervo-envelopes` · `provar-indice-de-envelopes` · `provar-apagar-da-listagem` · `provar-publicacao-da-escola` | **21 · 48 · 44 · 31 · 63** — verdes |
| `check-identidade` · `check-indices` | **20/20** (a cópia da porta no pacote-zero foi refrescada) · **14/14** |
| **o que NÃO mede** | `provar-listas-do-acervo` — segue **NÃO FEITO**: a única escola viva (`breu`) não tem ciclo publicado para servir |

### Executado na fotografia anterior (04/11/2026 — a fatia de tempo e as três frentes do guia)

| Verificação | Resultado |
|:--|:--|
| `provar-eixos-e-tempo-da-aula` (**nova**) | **TUDO CERTO — 27 asserções**: a coluna da proporção lida pelo NOME (a linha com as colunas trocadas dá a mesma fatia), `minutos` e `percentual` com os mesmos tempos, a lacuna a nomear o bloco, a prosa não convertida, os três eixos (o prefixo «Técnica —» não decide), o corpo das três fontes e **nenhum item do PO perdido** |
| Aula da `breu`, regerada com o motor de hoje | `Expressão \| [Preencher] \| [Preencher: proporção do bloco Expressão no plano]` — a justificativa deixou de vazar para a fatia |
| Plano da `breu`, regerado | `> **Sem proporção alvo: Expressão.** … Preencha a coluna «Proporção alvo» acima` |
| Guia da `breu` | resumo de 3 frentes (Corpo 15 aspectos · Técnica 2 dimensões/4 itens · Poiesis 2 dimensões/4 itens) + tabela de 8 linhas com a coluna «Eixo» |
| `gerar-ciclo.sh coqui-de-redinha 01 breu-bale-nivel-1-teste-3` | **0 erro(s), 0 aviso(s)**; PDF de 29 páginas com as duas correções dentro (`pdftotext`) |
| `validar-aula-ciclo` na aula regerada | **ok** — 9 campos extraídos, 2 provisórios |
| `provar-plano-matriz` · `provar-plano-completo` · `provar-aula-e-plano-legiveis` · `provar-derivados-da-sequencia` | **52/52 · 18 · 12 · 26** — verdes |
| **o que NÃO mede** | `provar-aula-prosa` · `provar-escopo-da-aula` · `provar-cabecalho-do-documento` — a primeira e a segunda apontam fixturas de escolas expurgadas (`batata`); a terceira exige um pacote gerado, que o repositório não guarda. As três falham na árvore de `HEAD` sem estas alterações |

### Executado na fotografia anterior (03/11/2026 — a estante mostra um por documento)

| Verificação | Resultado |
|:--|:--|
| `provar-vigente-na-listagem` (**nova**) | **TUDO CERTO — 21 asserções**: as 4 gravações do PO do caso real (1 original + 2 irmãos + 1 derivado) dão **1 linha** com «2 versões anteriores guardadas»; outro plano observado dá a sua; as anamneses da mesma aluna colapsam (e as **sem sujeito** não); a derivação do plano substitui; e os envelopes escondidos **continuam legíveis e no índice** |
| O mesmo, sobre o **índice real da `breu`** | **2 envelopes de PO → 1 linha** (`po-20261103-2221`, histórico `po-20261103-2202`); anamnese 1 → 1; plano 1 → 1 |
| `provar-apagar-da-listagem` | **31 asserções, 0 falhas** — e foi ela que **reprovou** a primeira versão da regra: agrupar o plano por (turma, ciclo) escondia o plano que um PO observa |
| `provar-ficha-na-listagem` · `provar-lista-que-falha` · `provar-sujeitos-da-turma` · `provar-acervo-envelopes` · `provar-indice-de-envelopes` · `provar-indice-de-proveniencia` | **35 · 39 · 30 · 48 · 44 · 60** — verdes |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| `provar-listas-sem-repeticao` | **1 falha pré-existente** — a asserção «`api/envelopes` é pedido uma vez» mede uma estante que saiu da porta a 26/10; reproduzida na árvore de `HEAD` **sem** estas alterações, e por isso não é regressão desta entrega |
| **o que NÃO mede** | `provar-listas-do-acervo` — segue **NÃO FEITO**: a única escola viva (`breu`) não tem ciclo publicado para servir |

### Executado na fotografia anterior (03/11/2026 — a medida não é o repertório)

| Verificação | Resultado |
|:--|:--|
| `provar-sequencia-que-acompanha` | **TUDO CERTO — 49 asserções** (eram 33). Secção 7 nova: a medida marcada fora do repertório curado não vira exercício, o `marco` fora da lista não gera linha, e **dois controlos negativos** (curado o termo, ele aparece; de volta o objetivo, a linha volta) |
| «Port de bras» na sequência, com a curadoria em dois verbetes | **3 linhas → 0**, e o rodapé nomeia o termo que ficou de fora |
| linha a nomear «objetivo 3», com um `marco: 3` na matriz dos blocos | **aparecia → não aparece** — e a coluna do objetivo não sai vazia |
| o mesmo exercício no `.md` do plano | não entra na música quando está fora do `repertorio` do envelope; entra quando está dentro; **sem repertório declarado não se julga** |
| `provar-plano-matriz` · `provar-plano-completo` · `provar-derivados-da-sequencia` · `provar-po-completo` · `provar-teste` · `provar-apagar-da-listagem` · `provar-metodologia-no-cabecalho` | **52/52** · **18** · **26** · **17** · **45** · **31** · **TUDO CERTO** |
| `check-identidade` | **20/20** (o `plano-observacao/` do `ciclo-01-breu` foi regerado a partir de `porta/`) |
| **o que NÃO mede** | `provar-listas-do-acervo` · `provar-dimensoes-plano` · `provar-janela-do-lancamento` · `provar-lancamento` · `provar-geracao` — apontam a pastas de escolas expurgadas (`batata`, `calando-teste-1`) ou a professores que já não existem (`tiago`) |
| **de antes** | `check-pacote` no `ciclo-01-breu`: 11 erros (o pacote-zero não tem PDF, nem aulas, nem dados) |

### Executado na fotografia anterior (03/11/2026 — as bancadas passam a medir o documento de hoje)

| Verificação | Resultado |
|:--|:--|
| `provar-plano-completo` | **OK — 18 verificações** (antes: exceção na §5). Mede o documento de HOJE: a identificação no `## Contexto` com a reserva do guia, a **régua** na chave `reguaDaRubrica`, a sequência no documento da **notação**, a música nas duas origens, a **omissão da escola declarada com motivo**, e a relação objetivo ↔ aula na tabela dos marcos (nas duas direções) |
| `provar-derivados-da-sequencia` | **TUDO CERTO — 26 asserções** (antes: 2 falhas). A fixture passou a usar o alfabeto que existe (Plié, Battement tendu, Jeté sem verbete) |
| `provar-plano-matriz` · `provar-po-completo` · `provar-teste` | **52** · **17** · **45** — verdes |
| `provar-sequencia-que-acompanha` · `provar-metodologia-no-cabecalho` · `provar-aula-e-plano-legiveis` · `provar-apagar-da-listagem` | **TUDO CERTO** nas quatro |
| `check-identidade` · `check-indices` | **20/20** · **14/14** |
| **o que NÃO mede** | `provar-listas-do-acervo` · `provar-dimensoes-plano` · `provar-janela-do-lancamento` · `provar-lancamento` · `provar-geracao` — apontam a pastas de escolas expurgadas (`batata`, `calando-teste-1`) ou a professores que já não existem (`tiago`). O remédio é o desta entrega, e não lhes foi aplicado |
| **de antes** | `check-pacote` no `ciclo-01-breu`: 11 erros (o pacote-zero não tem PDF, nem aulas, nem dados) |

### Executado na fotografia anterior (03/11/2026 — as bancadas do plano e do PO voltam a medir)

| Verificação | Resultado |
|:--|:--|
| `provar-plano-matriz` | **52 de 52** — era vermelho na PRIMEIRA asserção («/api/mapa responde»), e a causa era o fixture: servia a pasta de uma escola expurgada em 15/10/2026 |
| `provar-po-completo` | **OK — 17 verificações** |
| `provar-teste` · `provar-metodologia-no-cabecalho` · `provar-aula-e-plano-legiveis` · `provar-sequencia-que-acompanha` | **45** · TUDO CERTO · TUDO CERTO · TUDO CERTO |
| `check-identidade` · `check-schemas` · `check-indices` | **20/20** · TUDO CERTO · **14/14** |
| `provar-derivados-da-sequencia` | **as mesmas 2 de antes** — e agora sabe-se por quê: o alfabeto não tem «Battement fondu» nem «Jeté», que o fixture dela usa |
| **vermelhos, e de antes** | `provar-plano-completo` — **três campos respondidos não chegam ao documento** (`contexto-escola`, o critério da `rubrica`, `aula-de-cada-objetivo`). É achado, não remendo: são três decisões de produto. · `check-pacote` no `ciclo-01-breu` (o pacote-zero não tem PDF nem aulas) |
| `provar-listas-do-acervo` · `provar-dimensoes-plano` · `provar-janela-do-lancamento` · `provar-lancamento` · `provar-geracao` | **NÃO MEDEM** — apontam a pastas de escolas expurgadas (`batata`, `calando-teste-1`) ou a professores que já não existem (`tiago`). O remédio é o desta entrega, e não foi aplicado a elas |

### Executado na fotografia anterior (03/11/2026 — o «Apagar» do registo solto)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-apagar-da-listagem.js` (novo) | **TUDO CERTO — 31 asserções em 6 secções**. Monta uma **publicação mínima** num diretório temporário — a listagem não depende de existir ciclo gerado — e serve a página a sério por `producao.fetch`, com KV em memória. **§1** o plano solto: Editar + Apagar, com o carimbo e a rota certos, e «Apagar» **não** é link. **§2** o vinculado: nem Editar nem Apagar, «Ajustar», e o `DELETE` **recusado** (409, com o motivo); o derivado também não. **§3** a anamnese, solta e vinculada. **§4** o clique em JSDOM: **sem** a senha conferida não se chama a rota e o painel diz porquê; **com** ela, chama-se uma vez com o carimbo. **§5** o PO não ganha o botão. **§6** a rota apaga **mesmo** (200, o envelope desaparece, a listagem deixa de o mostrar; a anamnese vinculada é recusada) |
| `provar-acervo-envelopes` | **TUDO CERTO — 48 asserções**, incluindo «sem GITHUB_TOKEN a gravação vai para o KV» |
| `provar-teste` · `provar-ajustes-anamnese` · `provar-ficha-na-listagem` | **45 verificações** · **126 provas** · **35 asserções** — verdes |
| `provar-producao` | **153 de 156** — as mesmas três de antes (o item de menu marcado, a ordem das tradições, a contagem das pílulas) |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** · **14/14** · **TUDO CERTO** |
| `provar-listas-do-acervo` | **NÃO FEITO** — a única escola viva (`breu`) não tem `aula-NN.html` no pacote, e a bancada procura um ciclo gerado para servir. É por isso que a prova nova monta a **própria** publicação |
| **vermelhos, e de antes** | `check-pacote` no `ciclo-01-breu`: 11 erros (o pacote-zero não tem PDF, nem aulas, nem dados — nunca gerado aqui) |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado duas fotografias atrás (03/11/2026 — a sequência não inventa linha)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-sequencia-que-acompanha.js` | **TUDO CERTO — 33 asserções em 6 secções**. **§1** o núcleo, com controlo negativo. **§2** o documento. **§3** a tela com os números do envelope dela (seis linhas, nenhuma a nomear os objetivos 2 e 3). **§4** a chave pelo número. **§5** reescrita: **nenhum** `[data-grelha-add]`, **nenhum** `[data-grelha-del]`, **nenhum** campo livre nem seletor; **controlo positivo** — marcar um exercício a mais no parâmetro acrescenta **três** linhas (uma por bloco); sem parâmetro marcado a célula fica vazia, travada, com `—`; e a distribuição do volume **não** herda a frase da curadoria. **§6** a tela desenha exactamente as linhas que o núcleo deixa passar |
| `provar-teste` · `provar-ajustes-anamnese` | **45 verificações** · **126 provas** — verdes |
| `provar-plano-e-curadoria` · `provar-curadoria-e-limpeza` · `provar-aula-e-plano-legiveis` · `provar-metodologia-no-cabecalho` · `provar-compasso-limpo` | **TUDO CERTO** nas cinco |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **vermelhos, e de antes** | `provar-plano-matriz` — a bancada não serve `/api/mapa` e a prova **não corre**; as duas asserções que ela guarda (reescritas hoje para a regra nova) ficam medidas pela §5 do `provar-sequencia-que-acompanha` · `provar-derivados-da-sequencia` (as mesmas 2) · `provar-plano-completo` · `provar-po-completo` · `provar-notacao` |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado três fotografias atrás (03/11/2026 — a sequência acompanha os objetivos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-sequencia-que-acompanha.js` (novo) | **TUDO CERTO — 27 asserções em 6 secções**, com **dois controlos negativos**. **§1** o núcleo (`numeroDoObjetivo`, `linhaOrfa`, `linhasVivas`) — e, com os três objetivos de volta, as oito linhas ficam. **§2** o documento: a música deixa de publicar o exercício do objetivo apagado, e com os três objetivos o «Port de bras» **reaparece**. **§3** a tela, com os números do envelope dela: seis linhas, nenhuma a nomear os objetivos 2 e 3, o conteúdo preenchido e travado, e o envelope com seis ao gravar. **§4** a chave pelo número: corrigir a redacção de um objetivo **não** duplica a linha, e o rótulo acompanha o texto novo. **§5** o ✕: apagado nas derivadas **com a senha já validada**, activo na acrescentada, e remove só a ela; e o «−» do primeiro objetivo continua apagado. **§6** a tela e o núcleo concordam nas linhas que sobrevivem |
| `provar-teste` · `provar-ajustes-anamnese` | **45 verificações** · **126 provas** — as duas verdes, incluindo «com senha o controlo volta a habilitar» |
| `provar-plano-e-curadoria` · `provar-curadoria-e-limpeza` · `provar-compasso-limpo` · `provar-metodologia-no-cabecalho` · `provar-conteudos-e-estado-da-turma` · `provar-aula-e-plano-legiveis` | **TUDO CERTO** nas seis |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| `provar-derivados-da-sequencia` | **26 asserções, as mesmas 2 falhas de antes** (o *fondu* da fixture não declara música no alfabeto) — não tocada por esta mudança |
| **vermelhos, e de antes** | `provar-plano-completo` · `provar-po-completo` (o caminho do schema aponta para `professores/leticia/`) · `provar-notacao` (o alfabeto não tem os exercícios que a fixture do ciclo lista) · `provar-plano-matriz` (a rota `/api/mapa` da bancada) · `check-pacote` no `ciclo-01-breu` (o pacote-zero não tem PDF nem aulas — nunca gerado aqui) |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado três fotografias atrás (03/11/2026 — a metodologia é do professor)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-metodologia-no-cabecalho.js` (novo) | **TUDO CERTO — 20 asserções em 5 secções**. **§A** o conteúdo: o nó é do **cabeçalho**, declara `daCuradoria: 'tradicao'`, deixou de ser obrigatório e perdeu `forma`/`aberto`; o «Quem escolhe a metodologia» **não existe** em sítio nenhum, e a frase «A escola impõe» desapareceu. **§B** sem campo no corpo e sem degrau no roteiro. **§C** a barra mostra **«Francesa»** (o rótulo, não a chave), e a leitura do corpo diz de onde vem e que ali não se preenche. **§D** o `.md` publica a metodologia e deixou de publicar a autoria. **§E** o **controlo negativo**: sem curadoria não se semeia, não se mostra e o documento declara a lacuna |
| `provar-teste` | **45 verificações, TODAS verdes** — estava vermelho, e por uma razão que importa: afirmava «os nós do cabeçalho não são 7» em dois sítios e escrevia `- 7` num terceiro. A metodologia entrou no cabeçalho, a conta passou a **8**. O número passou a ser **derivado do mapa**: o que a asserção guarda é a igualdade entre os nós marcados e os que o roteiro salta |
| `provar-plano-e-curadoria` · `provar-compasso-limpo` · `provar-curadoria-e-limpeza` · `provar-aula-e-plano-legiveis` | **TUDO CERTO** nas quatro |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **vermelhos, e de antes** | `provar-plano-completo` · `provar-po-completo` (o caminho do schema aponta para `professores/leticia/`, que já não existe) · `provar-derivados-da-sequencia` (2 falhas) — medidos com o motor de HEAD, não tocados |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em JSDOM e no derivador |

### Executado quatro fotografias atrás (03/11/2026 — o compasso sem o dono da música)

| Verificação | Resultado |
|:--|:--|
| `/api/bastidores/termos` | **antes**, ao vivo: `Battement tendu → ["8\|2/4@breu"]`. **depois**, em processo: `["8\|2/4"]`. É a medida que abriu o trabalho |
| `node experimentos/provar-compasso-limpo.js` (novo) | **TUDO CERTO — 16 asserções em 4 secções**. **§A** a fonte não serve nenhuma música com `@`. **§B** a tela com a fonte limpa: a linha grava `Compasso: '2/4'`, os tempos continuam 8 e 4, e a leitura diz «8 tempos em 2/4». **§C** a **defesa da tela** com o adaptador a servir as chaves **em cru** — e o **controlo vem primeiro**, a provar que o stub serve mesmo o sufixo. **§D** o **dado intacto**: o alfabeto guarda `8\|2/4@breu`, `musicaDaChave` devolve a música, `chaveDoVerbete` recompõe a de armazenamento, e a vista da escola resolve a música limpa para o registo dela |
| `provar-plano-e-curadoria` · `provar-curadoria-e-limpeza` · `provar-plano-da-turma` | **TUDO CERTO** nas três |
| `provar-derivados-da-sequencia` · `provar-musica-no-plano` | **2 e 9 falhas — as mesmas de antes**, medidas com o motor de HEAD no worktree. A primeira é a leitura que agora diz «8 tempos em 2/4»: a asserção espera outro texto, e está vermelha por uma razão que não é esta |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **o que NÃO foi medido** | a página **ao vivo** depois do deploy: o caminho mede-se em bancada, com o adaptador a servir os dois formatos |

### Executado na fotografia anterior (03/11/2026 — a lista que só promete o que existe, e o formulário sem sermão)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-curadoria-e-limpeza.js` (novo) | **TUDO CERTO — 22 asserções em 5 secções**. **§A** o menu da curadoria = os exercícios **com notação**, derivado do alfabeto (não um número à mão); o «Jeté» da prova é termo e não entra; os dois escolhedores são a mesma peça. **§B** os **oito rótulos** com a mesma pele, medidos no **Chromium** (`display`, peso, tamanho, cor, margens). **§C** dez textos removidos, um a um. **§D** controlo negativo: vocabulário sem verbete → menu vazio, alunas intactas. **§E** os **nove** blocos de feedback que ficam |
| `provar-producao` | **153 de 156** (era **151 de 155**). A asserção «nenhum formulário traz explicação» estava vermelha desde antes (obtido 1, esperado 0) e **passou** — o único resto era a frase da posição, que saiu. As duas novas são as do menu. As três que restam são as de antes |
| `provar-conteudos-e-estado-da-turma` | **TUDO CERTO — 75 asserções** (era 74): a nova garante que o vocabulário não foi apagado do sistema |
| `provar-cartao-da-turma` | **4 falhas, antes e depois** — as mesmas do `--controle-negativo` sobre HEAD |
| `provar-teste` · `provar-plano-e-curadoria` · `provar-habilitacao-do-professor` · `provar-enquadramento-da-turma` · `provar-verbete` · `provar-tabela-da-notacao` | **45 verificações** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** · **14/14** · **TUDO CERTO** |
| `provar-celula` | **rebenta na secção 2**, com e sem esta mudança (`TypeError` sobre `cabecalho`, medido com o motor de HEAD). As duas asserções que afirmavam os textos removidos foram **invertidas** para não mentirem a quem reparar o banco — mas **não correram** |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push): ao vivo, o menu da `breu` deve passar de **94** para **3** opções |

### Executado na fotografia anterior (03/11/2026 — a curadoria chega ao plano)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-plano-e-curadoria.js` (novo) | **TUDO CERTO — 12 asserções em 5 secções**. **§A** `turmaDoPlano()` devolve a **turma**, e não uma lista. **§B** o ritmo desce: frequência 2 (qua e sex), 45 min, calendário 2027-03-03 → 2027-06-30, total de aulas. **§C** a coluna «Conteúdo do nível» oferece **Plié e Battement tendu** (o `repertorio` da curadoria). **§D** o **controlo negativo**: sem o mapa composto a coluna fica vazia e o ritmo continua a descer. **§E** a **classe** do defeito: nenhum bloco de cliente declara a mesma função duas vezes |
| `provar-teste` | **45 verificações, TODAS verdes** — estava vermelho («a frequência não saiu dos dias da turma») e a correção do nome devolveu-lhe a leitura da turma |
| `provar-cartao-da-turma` | **4 falhas** (eram **6**): o «Cancelar» da turma voltou a ser o da turma. As quatro que sobram são as mesmas do `--controle-negativo` sobre HEAD |
| `provar-producao` · `provar-verbete` · `provar-plano-da-turma` · `provar-conteudos-e-estado-da-turma` · `provar-tabela-da-notacao` | **151 de 155** (as quatro de antes) · **TUDO CERTO** · **46 provas, 0 falhas** · **TUDO CERTO** · **TUDO CERTO** |
| `check-identidade` · `check-indices` · `check-schemas` | **20/20** (a cópia da porta no pacote foi regerada) · **14/14** · **TUDO CERTO** |
| **no ar, uma leitura por sítio** | `/api/bastidores/curadoria-professor` devolve a curadoria com `repertorio: ['Plié','Battement tendu']`; `/api/bastidores/turmas` devolve a turma com o ritmo; `/api/bastidores/turma-conteudos` devolve `{"bale-nivel-1-teste-3":["battement-tendu","plie"]}`; a lista do PO diz «Ainda não há Plano de Observação nesta escola» |
| **provas vermelhas desde antes desta sessão** | `provar-plano-completo` · `provar-po-completo` · `provar-manifesto-do-plano` · `provar-geracao-do-ciclo` — medidas com o motor de HEAD no worktree, **não tocadas**: cada uma pede uma decisão de contrato ou de conteúdo |
| **o que NÃO foi medido** | o caminho `plano → .md → pacote` **ao vivo**: não há plano guardado. E o `GITHUB_TOKEN` do `.dev.vars` está **morto** (401 em `/user` e na API do repositório) — o token do Worker não se lê de fora, mas é este o valor que `criar-escola.sh --deploy` grava |

### Executado na fotografia anterior (03/11/2026 — os conteúdos na curadoria e os três estados da turma)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-conteudos-e-estado-da-turma.js` (novo) | **TUDO CERTO — 74 asserções em 7 secções**. **§A** o núcleo composto: o mapa antigo somado ao `repertorio`, colapsado pelo `idDe`, e a curadoria **substituída** a não entrar. **§B** os três estados e o motivo de cada recusa, **com os três do professor ao lado** — a assimetria era o defeito. **§C** a rota é a linha do servidor (o que a tela mostra é comodidade): `turma-editar` recusa a curada que muda o nome, **aceita** a que muda a hora, e recusa a vinculada. **§D** a tela: o passo 3 sem `#vinc-conteudos`, e a curadoria com o `escolhedor`. **§E** a nota saiu do cadastro e o que estava escrito **fica**. **§F** o termo ensinado numa curadoria de turma com plano **não** se apaga. **§G** o formulário inteligente: modalidade pelo perfil, tradição pela modalidade, e a queda para a compartilhada |
| `provar-producao` | **151 de 155** (era **149 de 153**; as duas asserções acrescidas são as novas). Duas foram **reescritas em vez de contornadas**: a de «concluir exige conteúdo» (o formulário já não os oferece) e a do menu de conteúdos no passo 3 (mudou para a curadoria). As **quatro falhas restantes são as de antes** — medidas uma a uma, e a da lista de tradições do **verbete** vem do `tradicoes.json` (a `cubana` entrou e `compartilhada` vem no fim), não desta mudança |
| `provar-cartao-da-turma` | **6 falhas, antes e depois**. As oito que esta mudança introduziu foram reescritas para medir a decisão nova (o passo 3 **sem** bloco de conteúdos, a curadoria **com** o `escolhedor`, a régua sem transbordar em 390px com a ressalva do `flex-wrap`). As seis que sobram são as mesmas do `--controle-negativo` sobre o motor de HEAD: os seletores globais `button.passo` apanham também a **segunda** barra de passos (a do verbete) |
| `provar-teste` | **a mesma falha de antes** («a frequência não saiu dos dias da turma»), confirmada com e sem a mudança |
| as outras sete (enquadramento, habilitação, tabela, sinais, verbete, produtos, linhas, música, leitura) | **TUDO CERTO** em todas |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · **TUDO CERTO** · **20/20** |
| `hash-ciclo.sh … --check` · `gerar-indices.js --check` · `check-pacote.js` | **cadeia intacta** · **12 arquivos em dia** · **11 erros, antes e depois** (o pacote da `breu` nunca foi gerado por inteiro: falta o PDF e o `-dados.json`) |
| **a correção do cabeçalho** | a fotografia anterior citava a base `ddcd92a`, que **não é ancestral** de `main` (sobra de um rebase). A base correta é `622071b` |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push) · **nenhuma curadoria real tem `repertorio`** hoje, e nenhuma modalidade tem lista própria de tradições — os dois caminhos medem-se com registos de ensaio |

### Executado na fotografia de 03/11/2026 — a turma é o ritmo, a curadoria é o ensino)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-enquadramento-da-turma.js` (novo) | **TUDO CERTO — 46 asserções em 5 secções**. **§A** o núcleo: a curadoria que enquadra (pelo nome), a vigente a vencer a substituída, o nível efetivo com a origem dita, **a curadoria a vencer a memória** (controlo negativo da ordem), e a leitura pelo enquadramento a achar a turma **mesmo sem os campos nela** — com o controlo negativo da leitura antiga. **§B** a turma grava o ritmo e **ignora** o enquadramento que o corpo ainda manda (página antiga aberta). **§C** a **memória**: a turma deriva, muda a hora, e o `nivelReferencia` antigo **não é apagado**. **§D** a curadoria: o nível grava, o rótulo é **composto** pela tradição, e a listagem da turma mostra o da curadoria. **§E** a tela: os campos saíram de um formulário, entraram no outro, e **o script compila** |
| `provar-producao` | **149 de 153, MELHOR do que antes** (era 147/152). Duas asserções foram **reescritas em vez de contornadas** — elas afirmavam que a turma tem a tradição em lista, que é agora o contrário da decisão —, e a lista de tradições esperada passou a ser **derivada do catálogo**: estava vermelha desde que a «cubana» entrou. As quatro falhas restantes são as de antes |
| `provar-habilitacao-do-professor` | **TUDO CERTO** — as quatro asserções dos campos do nível mudaram de `#tgrau`/`#tnivel` para `#cugrau`/`#cunivel`, e ganharam uma que mede o **contrário**: que a turma já não os tem |
| `provar-cartao-da-turma` · `provar-teste` · `provar-notacao` | **6 antes e depois** · **a mesma falha antes e depois** · as mesmas 11 antes e depois |
| as outras sete (verbete, tabela, leitura, sinais, produtos, linhas, música) | **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **89 asserções** · **TUDO CERTO** · **TUDO CERTO** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · **TUDO CERTO** · **20/20** |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push) · **nenhuma turma real tem curadoria com nível**: a `breu` ainda não tem turmas, e o caminho mede-se com registos de ensaio — o primeiro uso a sério é dela |

### Executado na fotografia anterior (03/11/2026 — o perfil do professor, a turma descontinuada, o nível)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-habilitacao-do-professor.js` (novo) | **TUDO CERTO — 62 asserções em 5 secções**. **§A** o núcleo: perfil que nasce habilitado, id desconhecido recusado, **zero modalidades aceite**, e as três turmas que **não** se descontinuam. **§B** o ficheiro pela rota de verdade: grava em `professores/<slug>/perfil.json` e **nada sob o prefixo da escola**, o `criado` não se reescreve, professor de outra escola → **403**, sem senha → **401**. **§C** a consequência: acende, **não apaga**, e **volta atrás**. **§D** o expurgo: preservado, e a guarda com **controlo negativo**. **§E** o nível: RAD numerada, graus nas outras, texto antigo preservado, e os quatro campos no formulário |
| `tools/criar-escola.sh` | **medido num clone de ensaio** (árvore do `HEAD` + o script): cria o perfil com a modalidade principal; na **2.ª** e **3.ª** escola do mesmo professor **reusa-o** e não sobrescreve o que ele já declara |
| `provar-producao` | **147 de 152, depois como antes** — contadas as falhas com e sem a mudança |
| `provar-cartao-da-turma` · `provar-teste` | **6 antes e depois** · **a mesma falha antes e depois** |
| `provar-verbete` · `provar-tabela-da-notacao` · `provar-leitura-da-decomposicao` · `provar-sinais-da-modalidade` · `provar-produtos` · `provar-linhas-da-lista` · `provar-musica-do-verbete` | **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **TUDO CERTO** · **89 asserções** · **TUDO CERTO** · **TUDO CERTO** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · **TUDO CERTO** · **20/20** |
| **o que NÃO foi medido** | a página **ao vivo** (o deploy corre depois do push) · a **migração** das turmas existentes: nenhuma tem `modalidade`, o campo nasce vazio, e uma turma sem modalidade **não** é descontinuada — é a decisão, não um esquecimento |

### Executado na fotografia anterior (03/11/2026 — os dois sinais novos e o dono da modalidade)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-sinais-da-modalidade.js` (novo) | **TUDO CERTO — 29 asserções em 4 secções**. **§A** o signo: `cp` e `cdp` no grupo das posições com o nome em francês; são sinais conhecidos do validador; **o bloco do frappé (`[Perna: ED cdp ↓ ↑]`) lê-se** e o do coupé também; um verbete que usa os dois **compõe**; e a **contraprova** — tirados os dois sinais, o mesmo verbete cai em `sinal-desconhecido`; versão ≥ 38 e o acrescento declarado no comentário. **§B** o nome: os quatro empréstimos da D-67 com o nome internacional, nenhum a dizer «colo» ou «atitude», e as cinco posições **a continuar em português**. **§C** a rota: 200, `modalidade` na resposta, os dois sinais no grupo certo com nome e significado, e a posição com o nome internacional. **§D** o acoplamento: **10 sítios** de `motor/` escrevem a modalidade à mão (impressos um a um), a porta declarada existe, e **nenhum** registo de escola declara `modalidade` |
| `node experimentos/provar-notacao.js` | **as mesmas 11 falhas de antes, contadas uma a uma (stash × unstash)** — e o acrescento ao alfabeto **esteve a ponto de introduzir a décima segunda**: a palavra «meia-ponta» é o nome de uma escola, e a varredura de nomes de escola dentro de `biblioteca/modalidades/` apanhou-a. O texto passou a «pé alongado». Fica dito porque é a armadilha: **um sinal novo escreve-se sem os nomes das escolas** |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** |
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** |
| `node experimentos/provar-tabela-da-notacao.js` · `provar-leitura-da-decomposicao.js` | **TUDO CERTO** · **TUDO CERTO** |
| `node tools/check-indices.js` · `check-schemas.js` · `check-identidade.js` | **14/14** · **TUDO CERTO** · **20/20** |
| **o que NÃO foi medido** | a página **ao vivo** — a conferência é dela, e o deploy só corre depois do push. Nenhum verbete real usa ainda os dois sinais: não havia nenhum para converter |

### Executado na fotografia anterior (03/11/2026 — a notação em três colunas e o trecho dobrado)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-tabela-da-notacao.js` (novo) | **TUDO CERTO — 41 asserções em 3 secções**. **§A** o dado: `repeticoes` em cada linha, os compassos **1 e 3**, o recurso a conhecer a mesma frequência; **§B** a listagem em jsdom: **três** colunas, o «o que acontece» fora do cabeçalho, **uma** definição acima da tabela e **nenhuma** dentro das linhas, as células a dizer «1 · 1–2 (duas vezes) · [Perna: …]» e «3 · …», e o caso das **duas frases diferentes** com as duas à vista; **§C** o passo 6: uma dobra por trecho, **todas fechadas**, o resumo com «compasso 1 · contagem 1–2 ×2», **um** parágrafo de prosa fora das dobras, abrir mostra a leitura, e o estado **sobrevive ao duplicar** |
| `node experimentos/provar-leitura-da-decomposicao.js` | **TUDO CERTO — 25 asserções** |
| `node experimentos/provar-musica-do-verbete.js` | **TUDO CERTO — 33 asserções** |
| `node experimentos/provar-verbete.js` · `provar-produtos.js` · `provar-linhas-da-lista.js` | **TUDO CERTO** · **TUDO CERTO — 89 asserções** · **TUDO CERTO** |
| `node tools/check-identidade.js` | **20/20 `ok`** — e o `dito` passou a **gancho declarado** (14): a dobra é comportamental, quem desenha é o `details` nativo |
| **o alfabeto real, pela rota da listagem** | `Battement tendu` (`8|2/4@breu`): **2** linhas, compassos **1 e 3**, contagem **1–2**, `repeticoes` **2** — «1–2 (duas vezes)» nos dois, e **uma** frase distinta |
| `node experimentos/provar-producao.js` | **147 de 152, depois como antes** — as cinco falhas são as de antes e nenhuma toca o que esta entrega mudou |
| **o que NÃO foi medido** | **pixéis** — sem navegador nesta bancada, a altura não se mede; mede-se a prosa à vista (251 de 385 caracteres). A geometria em navegador é a das provas `provar-celular`/`provar-producao` |

### Executado na fotografia anterior (03/11/2026 — a listagem lê o que está gravado)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-leitura-da-decomposicao.js` (novo) | **TUDO CERTO — 25 asserções em 4 secções**. **§A** o caso relatado: a rota responde 200, o exercício aparece, a música sai **sem o dono na chave** e **com** o dono declarado, os **dois** trechos são contados **e lidos** — «era aqui que a lista dizia 'não pôde ser lida'» —, sem motivo nenhum porque a composição fechou, o primeiro no **compasso 1** e o segundo no **3** (dois compassos de 2/4), a contagem e a frase que ela escreveu ao lado, e a página **já sem a frase**; **§B** a vista: a `breu` lê a sua, a `maria` e uma terceira leem a do catálogo; **§C** a leitura **não deita fora o gravado**: a conta que não fecha mostra as linhas **e** o motivo, com os dois números, uma numeração 1–2 / 5–6 também se lê, e sem trechos o motivo di-lo; **§D** o alfabeto usado é o **lido do repositório**, e não o embutido no build |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a planta passou a ser **música a música**: plantar «o exercício» dava por coberta a música do catálogo (`8|4/4`) só porque o exercício já existia com a música da escola (`8|2/4@breu`) |
| `node experimentos/provar-musica-do-verbete.js` | **TUDO CERTO — 33 asserções** |
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** |
| `node experimentos/provar-linhas-da-lista.js` | **TUDO CERTO** |
| `node tools/check-identidade.js` | **20/20 `ok`** |
| **o que NÃO foi medido** | a página **ao vivo** — **nenhuma carga ao ar** nesta sessão; a conferência é a dela, no próximo `F5` |

### Executado na fotografia anterior (03/11/2026 — a música sem trava, e o alfabeto com dono)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-musica-do-verbete.js` (novo) | **TUDO CERTO — 33 asserções**. **§A** a divergência sai em `avisos` e a gravação **passa**, com o verbete escrito; **§B** a página da Produção em **jsdom**: o campo da música está **aberto**, duplicar **não** reescreve os tempos (8 continua 8, e os trechos 8 → 16), o selo aparece e desaparece, e mudar tempos **e** compasso **não apaga** a decomposição; **§C** o dono do alfabeto: a chave com e sem dono, as três vistas (catálogo, breu, maria), a composição do documento a escolher a versão de cada uma, a escola a gravar sem tocar no catálogo, e o apagar a só levar os registos de quem apaga |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — com três asserções reescritas para a regra do dono (a escola **não** apaga o catálogo; apaga o que é dela; a lista da escola deixa de mostrar a versão dela) e a do `criar`, que passou a recusar por (dono, exercício, música) |
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** |
| `node experimentos/provar-linhas-da-lista.js` | **TUDO CERTO** |
| `node tools/check-identidade.js` | **20/20 `ok`** — os dois selos novos usam estados que já existem na folha (`alerta`, `discreto`, `dim`) |
| **os vermelhos de antes, comparados** | `provar-notacao` **11 antes e depois** · `provar-cartao-da-turma` **7 antes e depois** · `provar-derivados-da-sequencia` **2 antes e depois** · `provar-producao` **5 antes e depois**. Contados stashed/unstashed: **nenhuma regressão introduzida** |
| **o que NÃO foi medido** | a página **ao vivo** — nenhuma carga ao ar nesta sessão · o expurgo da `breu`, que é ela que faz pela tela |

### Executado na fotografia anterior (03/11/2026 — o termo da tela, o alfabeto sem dono e o deploy do catálogo)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções**. Esteve **vermelho duas vezes** por causa do termo criado na tela, e a causa era a régua: §G comparava a contagem do produto do catálogo com o comprimento do ficheiro, que passou a poder guardar termos de escola e a contar duas vezes o mesmo `id`. Agora compara com o **subconjunto do catálogo** (`separarPorEscola`) |
| `node experimentos/provar-verbete.js` | **TUDO CERTO**. §I e §J liam `celulas.devant[…]` de um verbete real que passou a existir com a pista `a-la-seconde` (o teste morria num `TypeError`); passam a percorrer as pistas que houver. E a asserção do bundle compõe o que **aquela** escola vê, em vez de comparar com o seed cru |
| `node tools/check-identidade.js` | **20/20 `ok`** |
| **o vocabulário, depois de retirar o termo da breu** | **93 termos**, **0** com `escola`; alfabeto **v32** com **1** verbete (`Plié`) |
| **a edição paga** | **25** fora, no catálogo e na `breu` — era **26** na breu enquanto a sombra sem `fonte` vencia |
| **as lacunas** | **147** (eram 146 com o verbete da escola, que dava decomposição ao termo do catálogo) |
| **as três escolas, pelo mesmo código** | `batata` 93 · `maria` 93 · `breu` 93 — e antes da limpeza a `breu` via o **seu** «Battement tendu» sem `fonte`, as outras o do catálogo **com** `fonte` |
| **o expurgo da `breu` — calculado, NÃO executado** | sairiam **17 ficheiros** + KV + Worker; sobreviveria `escola/breu/indice.json` com mais um elo. **Ela decidiu não purgar agora** |
| **o deploy do catálogo** | `508d22f` → «Publicar as escolas» **success**; `https://breu.tmenegaz77.workers.dev/bastidores/producao` responde **200** e tem **0** ocorrências do texto da escola («direcoes, devant») |
| **o que NÃO foi medido** | o **alfabeto com dono** (é decisão dela) · o **expurgo** (não pedido agora) · o contrato (C8) · a chave `plano` · a fase 3 · a aula pronta · os três `exige/ensina/expressa` (**0** das 9 unidades) |

### Executado na fotografia anterior (02/11/2026 — a fotografia datada, o dono do termo e o lugar do plano)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 89 asserções** (eram 73). **§L** a fotografia: a forma `catalogo@AAAA-MM-DD` com o commit, **a mesma duas vezes seguidas** (prova de que não é o relógio), catálogo inexistente **não inventa data**, a lacuna `sem-fotografia` quando não há, e a licença citável a levá-la. **§M** o dono do termo: sem dono = catálogo; sem `--escola` as adições de todas ficam **declaradas** (`deOutras`), não perdidas; o dicionário do catálogo não tem o termo de A nem o de B; a edição de A tem o de A e **não** o de B; e o `--escola` do CLI chega ao manifesto |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — o CRUD do verbete continua a gravar no repositório sem tocar no vocabulário |
| `node tools/check-identidade.js` | **20/20 `ok`** — nada na tela mudou, e a checagem confirma-o |
| **a fotografia, no catálogo de hoje** | `catalogo@2026-11-02` (`23d4c0e`) — calculada do `git`, igual em duas execuções |
| **as lacunas do dicionário** | **147** — a `sem-fotografia` **não** aparece, porque a data existe; continuam `termo-sem-fonte` 59 · `exercicio-sem-verbete` 54 · `termo-sem-definicao` 34 |
| **a edição paga** | **25 definições fora** — o mesmo número da §10.4 |
| `git fetch origin` | **feito com o token de `.dev.vars`** (via `GIT_ASKPASS`, a variável que faltava): `origin/main` em **`885a2ad`**, **0** commits atrás e **1** à frente (`4e1593a`). A primeira tentativa falhara por `could not read Username` — não era o remoto, era o ambiente |
| **o que NÃO foi medido** | o **contrato** (C8) · a chave `plano` num ficheiro do repositório (`ESCOLA.conf` não existe) · a **fase 1** ao pé da letra (o ficheiro é um) · a **fase 3** (a âncora do produto) · a **aula pronta** (não existe) · os três `exige/ensina/expressa` continuam a **0 das 9 unidades** (P-16) |

### Executado na fotografia anterior (02/11/2026 — a licença em texto e a camada herdada)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 73 asserções** (eram 52). Três secções novas. **§I** a herança: o campo que só o termo declara é **herdado**, o que a relação declara **sobrepõe**, o que nenhum declara fica **ausente**, a camada só está completa sem ausentes, e o manifesto conta `3 · 3 · 6` numa fixture de quatro unidades — a soma que impede uma unidade de desaparecer da conta sem desaparecer do documento. **§J** a licença: é lida do **título** de `biblioteca/LICENSE.md`, cita o caminho, o ficheiro existe, e o documento gerado pelo CLI traz a licença real — sem `--licenca`, e **não** «pendente». **§K** a edição paga: com três termos (sem origem · com origem · sem definição), a `paga` retira só a primeira, di-lo no sítio dela, **mantém o termo**, mantém a segunda, conta `1` no manifesto, muda o **tipo** da lacuna (`descricao-fora-da-edicao-paga`) e deixa o termo sem definição como lacuna **nas duas**. E o `--edicao paga` do CLI chega ao manifesto — a regra existiria no núcleo e não chegaria a quem gera, que é a forma mais comum de uma regra nascer morta |
| **a condição de conteúdo, medida no catálogo** | `--edicao paga` deixa fora **25 definições** — o **mesmo número** que a `ARQUITETURA-GERAL.md` §10.4 tinha medido à mão a 02/11/2026. Duas medições independentes, o mesmo 25 |
| **as lacunas do dicionário** | **147** (eram 148): a `sem-licenca` desapareceu porque o gerador passou a **ler** o ficheiro. Ficam `termo-sem-fonte` 59 · `exercicio-sem-verbete` 54 · `termo-sem-definicao` 34 |
| **o que NÃO foi medido** | a **fotografia datada** da licença — é do **contrato** (C8), e sem contrato não há data para nomear · a **fase 1** (a separação dos ficheiros), a **fase 3** (a âncora do produto), a **fase 4** (C11) · os três `exige/ensina/expressa` continuam a **0 das 9 unidades**: a forma está pronta, o conteúdo é dela (P-16) |

### Executado na fotografia anterior (02/11/2026 — o motor dos produtos: dicionário e syllabus)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-produtos.js` | **TUDO CERTO — 52 asserções**, numa prova **nova**. **§A** a fronteira (os três módulos de produto, nenhum com `fs`/`path`/`http`/`process`, nenhum a olhar o relógio). **§B** o dicionário sobre uma fixture declarada: a ordem das categorias, a definição e a origem em falta em `[Preencher]`, a tabela com o **compasso por pista** (1, 1, 2, 2), a notação composta, o verbete que **não fecha** em `[conferir]` com o motivo e **sem publicar** a contagem, o exercício sem verbete, e o `_comentario` que não vira exercício. **§C** o syllabus: a **ordem declarada**, a camada pedagógica quando existe, a relação órfã, o nível sem unidades, o `--nivel` e a **recusa** de um nível inexistente. **§D** as adições excluídas por omissão e incluídas quando pedidas, com o selo `origem`. **§E** o determinismo (mesma entrada, mesmo byte). **§F** o ritmo fora dos manifestos e dos documentos (C19). **§G** o catálogo de verdade — só **contagens**, e nenhuma afirmação sobre o conteúdo. **§H** o CLI: escreve no destino, o `--json` dá um manifesto legível, o `--out -` e o `--nivel` funcionam |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — sem regressão: `lerProgressao` foi acrescentada a `verbete.js` e o `lerModalidade` não mudou |
| `check-identidade` · `check-indices` | **20/20** · **14/14** — o produto não emite marcação, e o índice do acervo não muda |
| **o que NÃO foi medido** | a **aula pronta** (não existe), a **fase 1** (a separação dos ficheiros não foi feita — o critério 5 do plano **não passa**), a **fase 3** (sem âncora e sem `LICENSE.md`), a **fase 4** (depende de C11) · `provar-producao` e `provar-cartao-da-turma` continuam com os vermelhos de antes (iguais aos do `0e2ac45` limpo) · `provar-teste` continua a parar na asserção de frequência, também de antes |

### Executado na fotografia anterior (02/11/2026 — a segunda passagem: rótulos, travões e o apagar fora do passo 6)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **TUDO CERTO — 226 asserções** (eram 219). A **§24-C** passou a medir o contrário do que media: escolhido um exercício no passo 2, os três campos do passo 1 ficam **`disabled`**, com a categoria preenchida (`passo`) e a nota a dizer que a definição é do dicionário. A **§24-F** também: o «Apagar o verbete» **não está no passo 6** (nem na marcação nem no script) e continua na listagem. Novas: **§24-G** (só o passo 1 e o 2 abertos sem exercício nem música, do 3 em diante fechados, o «Voltar» desactivado no 1 e activo no 2, e o «Seguir» do passo 3 a dizer «quantos tempos» quando falta a música) e **§24-H** (o «Acrescentar trecho» desactivado sem sinais, com o motivo no `title`). A tradição passou de `FRANCESA` a `Francesa` em três asserções |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a §H foi **reescrita**: o rótulo é o do ficheiro (`Francesa`, `Vaganova`, `Cubana`, `Compartilhada`, `RAD`), o mapa `rotulos` tem uma entrada por tradição, os quatro selectores concordam, e **nenhum `value` se repete** — é a asserção que guarda a `Compartilhada` duplicada que ela viu. O dado continua a gravar as **chaves** |
| `node experimentos/provar-teste.js` | **falha mais adiante, e a falha de topo desapareceu.** A §7 («a Produção nasce com turma, rubrica, termo e aluna preenchidos») **passa** — era ela que estava vermelha com `'' !== 'Jeté'`. A prova pára agora na §«frequência, duração e calendário vêm do cadastro da turma», com `contexto-frequencia: null`; **medido em `0e2ac45` limpo com a asserção do termo relaxada, a mesma falha acontece** — não é regressão desta entrega, e não foi tocada |
| `provar-notacao` · `check-indices` · `check-identidade` | **48 asserções, 0 falhas** · **14/14, e as 10 contraprovas reprovam como deviam** · **20/20** (inclui a checagem 8 «Peça») |
| `provar-producao` · `provar-cartao-da-turma` | **147 de 152** · **6 falhas** — as duas listas são **iguais às do `0e2ac45` limpo**, verificadas por stash: o `className` do item do menu, as «explicações» dos formulários, e a contagem das pílulas. Anotadas como vermelho de antes no `TRANSFERENCIA-IA.md`, não como regressão |
| **as três fixtures do `breu`** | `validarVerbete` aceita as três: `Plié` (8\|4/4, duas repetições de `1–4` na pista `Perna`), `Battement tendu` e `Battement fondu` (en croix em `devant`/`derriere`, `cobre: 8`). O `Pirouette`/`Épaulement`/`Fondu` saíram do vocabulário **e** das curadorias |
| **não executado / vermelho de antes** | `provar-plano-completo` falha antes desta entrega (§14) · `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — proveniência do verbete, versões datadas e as tradições)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — três secções novas. **§G**: o `DELETE` recusado por plano (409, com «lacuna» e «descontinuar»), **o índice lido uma vez**, o mesmo `DELETE` aceite quando ninguém usa o verbete, e a **curadoria** como segunda porta (409, com o professor nomeado). **§I**: o `estadoDoVerbete` em seis casos (sem histórico, antes, no dia, depois, antes de tudo, e **duas versões fora de ordem**), a gravação sem vínculo a não criar histórico, com vínculo a criar (`ate` + motivo) e a manter o corrente, o segundo ajuste a acumular, e nenhuma versão com `versoes` dentro. **§J**: **fim a fim** — o mesmo envelope com data de antes do ajuste sai com a notação antiga, e com a de depois sai com a de hoje, com o alfabeto restaurado no fim. **§H**: a lista servida é a do ficheiro, a CUBANA, a ordem, o rótulo em caixa alta, os quatro selectores, e o `value="Francesa"` extinto |
| `node experimentos/provar-celula.js` | **219 de 219** (eram 203) — a **§24** é nova: o bloco do passo 1 desactivado sem nome (com `aria-disabled` e a nota), a acordar com o nome, a reabrir com o exercício escolhido; o método a herdar `FRANCESA` e depois `CUBANA`, a escolha à mão a sobreviver, e o valor gravado a ser a **chave**; o «Gravar» desactivado sem trechos, com título e nota; e o «Apagar» do passo 6 a existir só com exercício escolhido |
| `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **89/89** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — o «Apagar» do passo 6 usa a peça `.acao.perigo`: escrito na marcação servida, o gancho `.apagar` deixaria de ser gancho e passaria a classe sem desenho, e a checagem reprovou-o com razão |
| **o defeito que a §H apanhou** | o `<select>` do método tinha `value="Francesa"` e a tabela do alfabeto a coluna `francesa`: a nota dizia sempre «O alfabeto não declara esta posição em Francesa». O valor passou a ser a chave |
| **`provar-notacao`** | **48 asserções, 0 falhas, 7 NÃO MEDIDAS** — o alfabeto ficou sem verbetes (ela apagou os 11, versão 30), e as secções que compõem exercícios nomeados declararam-se não medidas em vez de se plantarem verbetes inventados. As provas deixaram de depender do conteúdo editorial: `provar-verbete` **planta** os exercícios de que precisa |
| **não executado / vermelho de antes** | `provar-plano-completo` falha **antes desta entrega** (medido no `cc54844` limpo: a §14 compara `['aula-de-cada-objetivo','aspecto-fisico']` com `[]`); não foi tocado, e a prova do versionamento fim a fim foi posta em `provar-verbete` §J, que é versionado e verde · `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a música travada, o verbo apagar e os passos arrumados)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **203 de 203** (eram 178) — a **§23** é nova, com 25 asserções: o campo da posição ausente e a nota que diz para onde ele foi; os tempos `readOnly` e o compasso `disabled` com trechos, com `aria-readonly` e a nota que manda ao «Duplicar»; o `<details class="dito">` **fechado** e o «lê-se»; a frase **zero** vezes na tabela e **uma** na prévia; o passo 1 condicional (sem nome, nada falta; com nome, faltam três); os dois escolhedores **vazios**; o `DELETE` com `{nome, modalidade, token}`; a pergunta que diz «lacuna» e «dicionário»; o recado com a versão nova; o formulário a sair de cima do verbete apagado; a música a **libertar-se**; e **a página não recarregar** |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a **§C-2** é nova: 401 sem token, 400 sem nome, 404 pelo nome, apaga e **sobe a versão**, o exercício sai com **todas** as músicas, os outros ficam, a mensagem do commit, a lista deixa de o mostrar, e **o vocabulário não é escrito nem apagado**. A §D passou a medir a guarda nova (400 sem nome) no lugar do 409 antigo |
| `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **89/89** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** |
| **dois defeitos encontrados a medir** | o compasso da prévia dizia sempre «—» (`compassosDosTrechos()[d.termo + ":" + k]`, com `d` a ser uma chave e não a direção); e o «Apagar» do verbete **recarregava a página**, porque caía no ouvinte genérico do `button.apagar` e mandava o corpo para `/api/bastidores/null`. Os dois corrigidos, e o segundo com uma asserção que conta as navegações |
| **não executado** | `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — o cartão da listagem e o vocabulário expandido)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **177 de 177** (eram 172) — a §21-B ganhou cinco: as três caixinhas do cartão, os valores da **música daquela linha**, o painel a abrir **só ele**, a tabela com o compasso e os sinais do motor, e o segundo toque a fechar |
| `node experimentos/provar-notacao.js` | **89 de 89** (eram 79) — dez novas: `Cabeça` é categoria **e** pista; `↻`/`↺` e `○`/`●` são pares; os lados cobrem os três eixos; as direções novas existem e nenhum termo se repete; `profil` existe e o épaulement já não diz «ombros rodados» |
| **a geometria do cartão** | fechado: **285 px a 320 · 192 a 390 · 142 a 768 · 161 a 1280**; aberto (a tabela da notação): sem transbordo em nenhuma largura, e a página com **0** |
| **o editor, no browser** | as pílulas mostram `○ abre`, `↻ rotação para dentro`, `↻ para dentro`, `↺ para fora`, `ombro à frente`, `de lado · perfil`; as categorias são **cinco**, com `Cabeça` |
| **uma célula de Cabeça, de ponta a ponta** | `validarVerbete` aceita; `pistasDe` devolve `Cabeça: 4`; e um verbete com o balde `para-fora` também passa |
| `provar-verbete` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | TUDO CERTO · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — a checagem «Peça» confirma que **não nasceu classe sem dono** |
| **não executado** | `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a substituição e a bancada da listagem)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — quatro asserções novas: com `musicaAnterior` a música antiga **sai** e a mensagem diz «substitui a música 4\|4/4»; **sem** ela ficam as duas; `musicaAnterior` **igual** à nova não apaga o trabalho |
| `node experimentos/provar-celula.js` | **172 de 172** (eram 167) — a **§20-E** é nova: antes de mexer na música não há substituição a anunciar; com a música mudada a nota e a caixa aparecem e dizem qual sai; o corpo leva `musicaAnterior: "4\|4/4"` sem a caixa e **não leva** com ela |
| **o risco, medido antes de escrever** | nenhum plano de ensino usa o `Plié` (`professores/**/*.json`) — apagar a música antiga não deixa ciclo em lacuna |
| `node experimentos/propostas/construir.js` | **10 páginas** (antes, sem pacote: **zero**) — a do título sai como página de ausência, com o motivo e o comando |
| **a bancada, em quatro larguras** | altura por cartão (320 · 390 · 768 · 1280 px): **linha 66 · 66 · 66 · 66** · **cartão 198 · 142 · 123 · 123** · **à vista 561 · 478 · 406 · 406**; **nenhum transbordo** |
| **a bancada, no browser** | o «?» de *Notação* abre **o painel do cartão em que se carregou** (não o do primeiro), com os 4 trechos do `Plié` e o compasso derivado pelo motor; `Escape` fecha; nenhum erro de JavaScript |
| `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **79/79** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** |
| **não executado** | `provar-agnosticismo` (o ficheiro não existe neste worktree) · `provar-o-que-vem-do-dado` (sem fixture) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a porta da música, os passos, a troca do sinal)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **167 de 167** (eram 158) — a secção **20-D** é nova e mede a troca no lugar: marcar a ficha 2 de cinco, trocar por outro sinal, vizinhos intactos, a marca a desaparecer, o «×» a desfazer a marca quando os índices andam para trás, o clique repetido a desistir, e a paleta a voltar a acrescentar sem marca. A **§20** e a **§21-B** passaram a medir **um painel de cada vez**; a listagem mede-se **por música**, e o francês tem de estar **ausente** |
| **o fluxo dela, de ponta a ponta** | abrir o `Plié` (`8\|4/4`, 4 células) → duplicar (**8 células, 16 tempos, `16\|4/4`**) → editar um trecho (passo 6, um painel) → ir ao 5 (só o 5) → voltar ao 6 → gravar. **O corpo enviado: `{musica: "16\|4/4", cobre: 16, celulas: 8}`** |
| **a listagem com o dado real** | **duas linhas** para o `Plié` — «8 tempos · 4/4 · 4 trechos · Perna, Braço» e «16 tempos · 4/4 · 8 trechos · Perna, Braço»; a segunda abre `16\|4/4` com cobertura **16** |
| **a listagem em quatro larguras** | 320 · 390 · 768 · 1280 px: **14 linhas, nenhum transbordo** — medido com os contentores **abertos** (um painel fechado mede zero, e zero passa em qualquer comparação) |
| `provar-verbete` · `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | TUDO CERTO · **79/79** · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — a peça nova (`.chip.em-troca`) passou «Peça» e «Aresta» |
| **não executado** | `provar-agnosticismo` — **o ficheiro não existe neste worktree** (nunca foi versionado; a fotografia anterior citava-o) · `provar-o-que-vem-do-dado` (sem fixture desde o expurgo) · `check-glossario` (sem par registro × glossário) |

### Executado na fotografia anterior (02/11/2026 — a duplicação do exercício)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **156 de 156** (eram 150) — a secção **20-C** é nova: o «Duplicar» aparece quando há trechos, duplicar duplica a decomposição (4→8 células) e a cobertura (4→8), os tempos sobem para 8 sozinhos e `MUSICA_EM_FOCO` acompanha (`8\|4/4`), as cópias caem nos compassos **1,1,2,2** e o `1ª` do braço fica onde está; e uma guarda de que **trocar de exercício limpa** a decomposição |
| `node experimentos/provar-notacao.js` | **79 de 79** (eram 78, e o ficheiro **estourava a meio**) — quatro fixtures afirmavam a forma de um dado que melhorou: a direção `devant` que o `Plié` já não tem, os braços «no primeiro compasso» quando atravessam dois, o `'devant'` escrito à mão, e a linha composta `[Perna: 1ª ↓]` copiada do dia |
| `provar-verbete` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | TUDO CERTO · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `check-indices` · `check-schemas` · `check-identidade` | **14/14** · TUDO CERTO · **20/20** — a peça nova é o `acao secundario` que a folha já tem |
| o script emitido | `node --check` passa no `<script>` que `paginaProducao` serve, e o botão está no HTML |
| **o que se tentou e reverteu** | conservar as células quando a música ainda não existe → **13 asserções** do `provar-celula` passaram a medir o exercício anterior. Revertido; o `carregarRascunho` ficou como estava |
| **não executado** | `provar-o-que-vem-do-dado` (sem fixture desde o expurgo da `batata`) · `check-glossario` (não há par registro × glossário) · `provar-producao` e `provar-cartao-da-turma`, cujas falhas conhecidas são anteriores a esta entrega |

### Executado na fotografia anterior (02/11/2026 — a correcção de um trecho não muda o compasso)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **143 de 143** (eram 134) — a secção **20-A** é nova e mede o cenário dela de ponta a ponta: três trechos de `Perna` em 2/4 dão compassos **1, 1 e 2**, corrigir o primeiro **não** muda a sequência e a linha corrigida continua a ser a **primeira**; a área do trecho está toda à vista em edição (4, 5 e 6) e fecha-se ao guardar; «Acrescentar trecho», «Guardar» e «Cancelar» não mudam de passo |
| `provar-verbete` · `provar-notacao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-forca-e-flexibilidade` · `provar-agnosticismo` | TUDO CERTO · **78/78** · TUDO CERTO · **50/50** · **17/17** · **44/44** — o agnosticismo confirma que a função nova não trouxe infraestrutura para o núcleo |
| `provar-celula` | **150 asserções** (eram 148) — a **20-B** é nova: `limparBaldesVazios` deixa o mapa sem chaves vazias e o `×` do último trecho leva a direção consigo. A 15-A é a e mede a conta no cenário dela (perna 8, braço 8, verbete **8**, não 12); a 15 ganhou duas: a recusa **não muda de passo** e a mensagem fica na página |
| `provar-producao` · `provar-cartao-da-turma` | **151/152** · **6 falhas** — as duas iguais a antes, **não são regressões** |
| `check-indices` · `check-identidade` | **14/14** · **20/20** |
| **não executado** | `provar-o-que-vem-do-dado` — continua sem fixture desde o expurgo da `batata` |

### Executado na fotografia anterior (02/11/2026 — as pistas, a repetição, a métrica e as posições)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **134 de 134** (eram 130) — as quatro novas medem o 6/8 ordenado por pulso, a legenda que nomeia a pista, o campo da repetição (1× a 4×) e o do método (com a herança na primeira opção) |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — sete asserções novas: duas pistas em paralelo fecham pela maior, o `cobre` que soma as pistas é recusado **com as duas contas na mensagem**, a repetição multiplica, a repetição inválida é recusada, o método-frase é recusado, o bloco de posições é um só com a preparatória e o rótulo duplo, e a rota serve as posições de braços |
| `node experimentos/provar-notacao.js` | **76 asserções, 0 falhas** (eram 74) — o `Plié` dá **quatro** segmentos em **duas** pistas, a das pernas atravessa os dois compassos e a dos braços vive no primeiro |
| `provar-producao` · `provar-acordeoes` · `provar-vao-do-botao` · `provar-menu-da-producao` · `provar-forca-e-flexibilidade` | **151/152** (a falha conhecida do item do menu) · TUDO CERTO · **50/50** · **55/55** · **17/17** |
| `provar-cartao-da-turma` | **6 falhas — as mesmas de antes**, e a própria saída mostra porquê: a lista de passos conta «1 O exercício novo … 6 A decomposição», a tira do verbete, junto dos três passos da turma. **Não é regressão** |
| `provar-o-que-vem-do-dado` | **NÃO CORREU** — depende dos envelopes da `batata`, expurgada hoje. A prova declara «conferência NÃO FEITA» em vez de passar por vácuo. **Fica sem fixture** |
| `node tools/check-indices.js` · `check-schemas.js` · `check-identidade.js` | **14/14** · TUDO CERTO · **20/20** |
| **o motor, medido à mão** | `compor` do `Plié` em «8\|4/4» → **`composto`**, cobertura **8**, resto **0**; o `Battement fondu` continua `parcial` (6 numa música de 2) |
| **não executado** | `tools/check-glossario.js` — não há nenhum par registro × glossário no repositório, porque a única escola com documentos foi expurgada |

### Executado na fotografia anterior (02/11/2026 — a licença e o pacote próprio)

Esta entrega **não alterou código**: é decisão, mais a correção de uma citação. O que se mediu foi o
que a decisão exigia saber.

| Verificação | Resultado |
|:--|:--|
| **o repositório é privado** | `tmenegaz/danca`, `private: true`, `license: null` — pela API do GitHub, 02/11/2026. Não há distribuição pública, logo a licença é decisão de negócio e não de compatibilidade |
| **não há conteúdo de terceiros** | `tools/templates/marca/` — 4 SVG da marca do projecto; `ciclo.css` — `--serif: 'Open Sans', …` e `--ui: system-ui…`. **CORRIGIDO 21/11/2026: há um ativo de terceiros** — os dois `.woff2` de `tools/templates/fontes/`, sob **SIL OFL 1.1** com o texto da licença ao lado (`fontes/OFL.txt`), que é o que a redistribuição exige; RAD/Vaganova continuam a ser nomes de posições |
| **a proveniência das descrições** | `vocabulario.json`: 93 termos, **59 com descrição**; `fonte` = 30 do dicionário fornecido, 4 «redigida no projeto», **59 vazio** — e **25 das 59 com descrição estão sem `fonte`** |
| **a citação da licença** | `sed -n '109p' ARQUITETURA-GERAL.md` → o diagrama do deploy; `grep -n 'licen'` → **uma** ocorrência (§5, «nem licença»); `git log --all -S'Licença do repositório' -- ARQUITETURA-GERAL.md` → **vazio**. A frase está em `REGISTRO.md:109`, entrada de 18/09/2026 |
| `node tools/check-indices.js` | **14 verificações, 0 falha(s)** — TUDO CERTO |
| `node tools/check-schemas.js` | TUDO CERTO — o molde e os professores dizem o mesmo contrato |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| **não executado** | as provas de browser — nenhuma linha de código do motor mudou nesta entrega |

### Executado na fotografia anterior (02/11/2026 — os três produtos e o plano do motor)

Esta entrega **não alterou código**: é decisão e plano. O que se correu foi o que a documentação pode
partir, e o que se mediu foi o que o plano afirma.

| Verificação | Resultado |
|:--|:--|
| **o núcleo é um só e a fronteira é provada** | `motor/nucleo/` — **21 ficheiros**, sem `fs`/`path`/`http`; `provar-agnosticismo.js` verifica por máquina. É o primeiro argumento do §3 do plano |
| **o glossário já é o dicionário de um ciclo** | `professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2-glossario-benesh.md` — índice de símbolos, verbetes, origem declarada |
| **a Regra 9 é norma e tem faixas no `.conf`** | `solo 30–40% · barra 20–30% · centro 30–40% · musicalidade 5–10%`; `VOLUME_MIN` 80–100 (60 min) e 150–200 (120 min) |
| **o catálogo, medido para as fases** | `progressao.json`: **13 turmas, 9 associações**, e só **2 níveis** com termos (4 e 5); `vocabulario.json`: 93 termos; `notacao.json` v15: 11 verbetes, 13 músicas, 43 células, **4 músicas que não fecham** (o `Plié` fechou com as pistas) |
| **o plano contratado não existe em código** | `raiz/escolas-habilitadas.json` tem `habilitada` e `pagante`; **nenhum campo `plano`** |
| **`tools/` é congelado** | `CONGELAMENTO.md` lista `tools/`, `tools/templates/`, `prompts/` — a entrega do produto **chama** os geradores sem os alterar |
| `node tools/check-indices.js` | **14 verificações, 0 falha(s)** — TUDO CERTO |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO · ok (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | ciclo íntegro, cadeia intacta — `b1097a0d…` — **medido ANTES do expurgo**: a variante foi apagada por ela no mesmo dia (`aeb2b2c`), e o comando hoje responde «manifesto da variante não encontrado». O valor fica como **registo datado**, não como estado |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** — **medido antes do mesmo expurgo**; hoje não há nenhum pacote no repositório para validar |
| `indices/acervo.json` depois do expurgo e da criação da `breu` | **1 ciclo, 0 variantes**, `estado: ancorado` — o índice é derivado e acompanhou as duas mudanças (`0e8d256`, `2fd6c07`) |
| **não executado** | as provas de browser — nenhuma linha de código do motor mudou nesta entrega |

### Executado na fotografia anterior (02/11/2026 — três eixos, o ritmo obrigatório e a C22)

Esta entrega **não alterou código**: é fotografia, decisão e registo. O que se mediu foi o código que
já estava lá, para as duas correções, e o que se correu foi o que o `.md` do planejamento pode
partir.

| Verificação | Resultado |
|:--|:--|
| **o modelo tem três eixos** — leitura do envelope real da `batata` | `"eixo"` aparece **uma vez** (`porta/po/conteudo/po.json:196`) e o rótulo é **prefixo por concatenação**: `["Técnica — Barra", "Técnica — Centro", "Técnica — Musicalidade", "Técnica — Expressão"]` |
| **o ritmo é obrigatório** — leitura das quatro portas de recusa | `faltaNoRitmoDaTurma` (`bastidores.js:829`) é chamada ao **gravar a turma** (`:7402`), ao **atribuir** (`:7463`, `:7554`) e ao **gerar o ciclo** (`:8203`, `:8343`); o formulário pede dias + hora, duração e período (`:3174`–`:3190`), e a frequência é derivada (`frequenciaDaTurma`, `:822`) |
| **o corpo está no ciclo** | medido a 02/11/2026: os cinco sítios lidos um a um (anamnese → `linha-de-base` → `restricoes` → `inclusao`/`exclusao` → plano bloco 10). **07/11/2026:** o quinto saiu (decisão 119), e são **quatro**. A `provar-forca-e-flexibilidade` citada nesta linha **não corre hoje até ao fim** — para em `Cannot read properties of undefined (reading 'registroDaAnamnese')`; vermelho de antes, medido no `abf7bc8e`. As provas do corpo que **correm e passam** a 07/11/2026 são `provar-corpo-da-linha-de-base` (**30 asserções**) e `provar-linha-de-base` (**102**) |
| **o átomo, medido para a C22** | `notacao.json` **v15**: 11 verbetes, 13 músicas, 43 células, 11 com `posicao`, 8 dos 13 pares `cobre == tempos`; `vocabulario.json`: 93 termos, 59 com descrição, 30 com `fonte`; `progressao.json`: 13 turmas, 9 associações |
| **as duas leituras do vocabulário** | `lerModalidade` (`verbete.js`) lê do **GitHub**; `termos()` (`bastidores.js:364`) lê do **bundle** — é a razão de o termo criado não chegar ao plano antes do deploy |
| **o catálogo é um ficheiro só** | `termo-repo.js`: `CAMINHO = 'biblioteca/modalidades/bale-classico/vocabulario.json'` — o que a escola acrescenta vai para o catálogo |
| `node tools/check-indices.js` | **14 verificações, 0 falha(s)** — TUDO CERTO |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO (o molde e os 18 professores dizem o mesmo contrato) · ok (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | ciclo íntegro, cadeia intacta — `b1097a0d…` |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| **não executado** | as provas de browser (`provar-celula`, `provar-verbete`, `provar-producao`, `provar-cartao-da-turma`) — nenhuma linha de código do motor mudou nesta entrega, e as duas falhas conhecidas (`provar-producao` 151/152, `provar-cartao-da-turma` 6) continuam a ser as de antes |
| **ao ar** | **nada foi publicado por esta entrega antes do push**; o push publica, como sempre (`Publicar as escolas` corre em cada push) |

### Executado na fotografia anterior (02/11/2026 — seis passos, e o exercício novo é o primeiro)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **130 de 130** — o mapa dos passos, as secções 1 e 3–6 reescritas: seis passos na tira, «não tem «+»», «nem «Gravar exercício» nem «Cancelar»», «o «Seguir →» manda UM pedido de termo», «avançar sem nome não grava nada», «o mesmo exercício não entra duas vezes na lista» |
| `node experimentos/provar-verbete.js` · `provar-producao.js` | TUDO CERTO · **151/152** (o item do menu — falha igual em `HEAD`) |
| `node experimentos/provar-acordeoes.js` · `provar-vao-do-botao.js` · `provar-menu-da-producao.js` | TUDO CERTO · **50/50** · **55/55** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| **ao ar** | o push publica (Action `Publicar as escolas`); a conferência é a da página da Produção a servir seis passos |

### Executado na fotografia anterior (02/11/2026 — o cadastro é o passo 1, e a gravação confere a música)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **128 de 128** (eram 122) — as cinco asserções do «modo» foram substituídas por dez do cadastro dentro do passo 1, e há duas secções novas: a recusa por a música não fechar, e o exercício novo sem duplicar a linha |
| `node experimentos/provar-verbete.js` | **TUDO CERTO** — a fixture passou a ser coerente (oito tempos de células para a música de oito), e há duas asserções novas: a tela compara a soma com os tempos, e o servidor valida a música |
| `node experimentos/provar-acordeoes.js` · `provar-vao-do-botao.js` · `provar-menu-da-producao.js` | **TUDO CERTO** · **50/50** · **55/55** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| **não são regressões, e ficam medidas** | `provar-producao` **151/152** (o item do menu com `className`) e `provar-cartao-da-turma` **6 falhas** (a tira do verbete entra na contagem dos passos da turma) — as duas falham **igual** com as alterações guardadas, confirmado nesta sessão |
| **ao ar** | **o push publica** — a Action `Publicar as escolas` corre em cada push e não há passo manual (medido na entrega anterior, `8175264`). O que se confere depois do push: que a página da Produção serve o cadastro dentro do passo 1 e que a Aula 01 continua a sair como saía |

### Executado na fotografia anterior (02/11/2026 — a §4 consolidada por compasso e o aspecto físico no plano)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-que-vem-do-dado.js` | **TUDO CERTO** — as asserções da §4 passaram a guardar a **forma consolidada**: consolida por compasso, mostra a contagem de cada exercício, cada exercício aparece **uma vez**, **não** afirma «exercícios neste bloco: nenhum», e a «fatia do plano» saiu |
| `node experimentos/provar-ajustes-anamnese.js` | **126 de 126** |
| `node experimentos/provar-forca-e-flexibilidade.js` | **17 asserções, 0 falhas** |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO (o molde e os **18** professores dizem o mesmo contrato, com `aspectoFisico`) · ok (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — depois de refrescada a cópia da porta do ciclo-zero |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** (os índices que só tinham mudado de `fonte.commit`/`gerado_em` foram revertidos) |
| `node tools/validar-plano-ciclo.js` · `validar-aula-ciclo.js` · `validar-po-ciclo.js` · `validar-captura-ciclo.js` | ok, **13** campos no plano (o novo `aspectoFisico` entre eles) · ok, 9 · ok, 13 · ok |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** — 9 páginas, 245 links, PDF de 25 páginas |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; **`b1097a0d…`** (ciclo) e **`73087073…`** (aula 01) |
| `node tools/regerar-derivados.js … --escrever` | **2 fontes reescritas** (`-plano.md` e `-aula-01.md`); as outras cinco iguais |
| **não executado** | `provar-plano-matriz.js` (falha na rota `/api/mapa` — **já falhava em `HEAD`**); `provar-aula-prosa.js` e `provar-escopo-da-aula.js` (fixtures de escolas expurgadas) |
| **ao ar** | uma carga por página, no fim: `/bale-nivel-1-teste-2/aula-01` **200** com «3. Distribuição do tempo pelos blocos» e «Os compassos desta aula»; `/bale-nivel-1-teste-2/plano` **200** com «Aspecto físico — força e flexibilidade». A Action `Publicar as escolas` publica em cada push — **não há passo manual**, e o registo anterior que dizia «fica para o deploy» estava a supor um controle que não existe |
| Actions de `8175264` | `Reancorar a cadeia`, `Publicar as escolas`, `Regerar os índices` e `Publicar a raiz` — as quatro `completed / success` |

### Executado na fotografia anterior (02/11/2026 — a aula deixa de afirmar o que ninguém escreveu)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-o-que-vem-do-dado.js` | **TUDO CERTO** — a origem de cada secção da aula, medida por mutação (troca-se uma resposta do envelope e vê-se se a secção muda). As asserções da §4 mudaram de pergunta: já não é «não tem de onde vir», é «a música vem da sequência, a grade vem do verbete, e não se pede nada a ninguém» |
| `node experimentos/provar-forca-e-flexibilidade.js` | **17 asserções, 0 falhas** (nova) — o conteúdo declara os 15 campos, todos existem na anamnese, o motor repassa a declaração, a caixa mostra o **nome** e o **valor**, e o **controle negativo** (sem a declaração, a caixa volta ao `id` cru) |
| `node experimentos/provar-ajustes-anamnese.js` | **126 de 126** — eram **56**, e a última asserção do ficheiro não corria. O mock do `location` não tinha `replace` e o `fetch` respondia `{ok:true}` a tudo; a página estava certa nas quatro coisas. **70 asserções nunca se tinham executado** |
| `node experimentos/provar-alunas-da-anamnese.js` | **14 de 14** |
| `node experimentos/provar-po-unico.js` | **18 asserções, 0 falhas** |
| `node experimentos/provar-aula-e-plano-legiveis.js` | **12 asserções, 0 falhas** |
| `node experimentos/provar-cabecalho-do-documento.js` · `provar-coerencia-do-po-no-pacote.js` | TUDO CERTO · **6 asserções** |
| `node experimentos/provar-schemas.js` · `provar-schemas-do-professor.js` | **29/29** · **24/24** |
| `node tools/check-schemas.js` · `gerar-schemas.js --conferir` | TUDO CERTO · o molde em disco e o módulo dizem o mesmo (5 schemas) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — incluindo a **cópia da porta do ciclo-zero**, que estava divergente e foi refrescada |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** |
| `node tools/check-pacote.js professores/pe-junto/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** — 9 páginas, 245 links, PDF de 27 páginas |
| `tools/hash-ciclo.sh pe-junto 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; **`54e37c70…`** |
| reprodutibilidade | **duas gerações seguidas** do mesmo ciclo: o **mesmo md5** nos dois PDFs e o `git status` **limpo** |
| `bash tools/gerar-handoff.sh` | o `HANDOFF.md` gerado no commit `d74fda1` |
| **não executado** | `provar-plano-matriz.js` (falha na rota `/api/mapa` — **já falhava em `HEAD`**, confirmado com a alteração guardada); `provar-aula-prosa.js` e `provar-escopo-da-aula.js` (apontam para fixtures de escolas expurgadas — `perna-boa` e um envelope de 27/10 da `batata`) |
| **ao ar** | uma carga por página, no fim: `/bale-nivel-1-teste-2/aula-01` **200** com as quatro correções; `api/mapa?fonte=anamnese` com os nomes dos campos; `api/mapa?fonte=po` com os 15 declarados |

### Executado na fotografia anterior (01/11/2026 — a janela por todas as bandas)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-janela-do-lancamento.js` | **11 asserções, 0 falhas** (nova) — jsdom, o pacote por HTTP |
| …o que ela mede | o config declara **8 colunas com chave**; a tela desenha **8 campos**, dois por banda; cada cabeçalho nomeia **um** critério; e o **controle negativo** — com o config antigo (os dois critérios numa coluna), os campos caem para **4** |
| `node experimentos/provar-aula-prosa.js` | **19 verificações** — passou a exigir **cada critério sozinho na sua linha**, e ganhou a prova de que **a fonte da aula é reproduzível pelo código, byte a byte** |
| `node experimentos/provar-aula-e-plano-legiveis.js` | **12 asserções, 0 falhas** — **falhava antes desta entrega** («coluna da folha não declarada: 'Linha de base revisitada'»); caiu ao corrigir o título da declaração e o `mesclarDeclaracao` por chave |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-celula.js` | **115 asserções, 0 falhas** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `provar-derivados-da-sequencia` · `provar-numeros-do-roteiro` · `provar-dimensoes-plano` · `provar-musica-no-plano` · `provar-plano-da-turma` · `provar-porta-sem-contexto` | **26** · **29** · **11** · **18** · **46** · **44**, todas sem falha |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`59e3063…`** — renovada (esta entrega reescreve fontes cobertas: a aula e a folha) |
| medido na tela | `captura-aula-01.json` com **8 colunas**; `plano-aula-01.json` com **8 entradas** em `guiaDeObservacao`; a folha impressa com **8 linhas** de critério |
| **não executado** | `provar-plano-matriz.js` e `provar-plano-completo.js` — falham **antes desta entrega** (a rota `/api/mapa`, e o nó `aula-de-cada-objetivo` sem destino declarado na prova); `provar-lancamento.js` **está morto** (aponta para `professores/tiago/ciclos/ciclo-01-maria`, que não existe); `provar-objetivos-por-aula.js` **não mede** (fixture expurgado) |
| **ao ar** | não recarregado na exploração (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (01/11/2026 — o que a sequência já responde, e o `;`)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-derivados-da-sequencia.js` | **26 asserções, 0 falhas** (nova) — jsdom, com o conteúdo, o alfabeto e a turma de verdade |
| …o que ela mede | a sequência **semeia-se sozinha** sem o nó ser aberto (7 linhas com os tempos do verbete); o **repertório** sem campo nenhum e com o valor igual à sequência; a **música acima** do campo único (o do vídeo); o exercício **sem verbete** dito por palavras; o **valor de fora** que passa como veio; a semente que **acompanha a decisão** (desmarcar o tendu tira-lhe as linhas); e o **documento** (a música derivada, o vídeo depois dela, o plano antigo intacto) |
| **controle negativo** (`porta/index.html` de `HEAD`) | **14 falhas** no código de antes |
| `node experimentos/provar-dimensoes-plano.js` | **11/11** — secção 11 nova: `;` e `\n` misturados dão **três colunas** (davam uma). A bancada estava **morta** (apontava para `professores/tiago/`, que não existe: o `markdown.js` nunca carregava); passou a servir o pacote-zero |
| `node experimentos/provar-teste.js` | **44 verificações** — foi ela que apanhou o `distribuicao-de-volume` apagado na primeira tentativa (a grelha com unidade grava `{unidade, linhas}`, não uma lista) |
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** |
| `node experimentos/provar-numeros-do-roteiro.js` | **29 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `provar-po-unico` · `provar-recorte-do-po` · `provar-leituras-do-po` · `provar-coerencia-do-po-no-pacote` | **18** · **26** · **27** · **6**, todas sem falha |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`3601081…`** — **sem renovação**: esta entrega não escreve o alfabeto, e o `plano.json` do formulário não está na cobertura do selo. O `ancorado_em` do scaffold mudou de data |
| medido na tela | o nó do repertório abre **sem campo nenhum** (nem a nota), com o selo «lido da sequência»; o nó do vídeo abre com a música acima e **um** campo |
| **não executado** | `provar-plano-matriz.js`, `provar-po-completo.js` e `provar-aula-e-plano-legiveis.js` — falham **antes desta entrega**, confirmado por `git stash`; `provar-objetivos-por-aula.js` **não mede** (o fixture foi expurgado) |
| **ao ar** | não recarregado na exploração (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (01/11/2026 — o número do roteiro, igual nos três documentos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-numeros-do-roteiro.js` | **29 asserções, 0 falhas** (nova) — jsdom, com o mapa de verdade de cada documento |
| …o que ela mede | nos **três** documentos: o número do título é o do item activo do roteiro em **todos** os degraus; a caminhada cobre 1..N sem salto; a barra conta os degraus (e os obrigatórios são os degraus obrigatórios); o «avançar» percorre os mesmos degraus; e o **fecho continua a barrar** o obrigatório que não tem degrau, nomeando-o |
| **controle negativo** (`--controle-negativo`, `porta/index.html` de `HEAD`) | **12 falhas** no código de antes — plano e PO reprovam, a anamnese passa (era o único documento já alinhado) |
| `node experimentos/provar-celula.js` | **115 asserções, 0 falhas** |
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** |
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`3601081…`**; selo na **versão 9** — sem renovação (esta entrega não escreve o alfabeto) |
| medido na tela | a `aula-1-sequencia` desenha **Bloco** e **Objetivo específico** como `travada`, e o **Conteúdo do nível** travado quando vem da matriz; os **Tempos/Compasso** seguem o verbete |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` — falham **antes desta entrega**, confirmado por `git stash` em 31/10/2026 |
| **ao ar** | não recarregado na exploração (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (01/11/2026 — a tira fora do formulário, e cinco passos)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **115 asserções, 0 falhas** (eram 106) — no navegador, sobre bancada local |
| …o que ela mede de novo | a tira **fora do `<form>`** (e antes dele); a tira **fora do ecrã no modo do exercício** — atributo `hidden` **e altura medida**, porque o atributo sozinho mentiria (`.passos{display:flex}` vence `[hidden]`); os **cinco** passos, numerados de 1 a 5; cada número com o seu painel; o valor do passo 1 com o nome e a posição; a **geometria de duas colunas** com a listagem à direita e **presa**; o `ULTIMO_PASSO` **lido da página** |
| `node experimentos/provar-verbete.js` | verde — o CRUD valida, grava no repositório e recusa apagar |
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** — versionada nesta entrega (faltava o `!` no `.gitignore` desde 31/10); o caso «sem verbete» passou a ser medido no **Jeté** |
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh … --check` | cadeia íntegra; **`3601081…`**; **selo renovado para a versão 9** do alfabeto |
| geometria da tira | **2 a 3 linhas** na coluna de 34rem (7,5rem por rótulo, valor com reticências); **nenhum transbordo** em 320, 390, 768 e 1280px |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` — falham **antes desta entrega** (o nó `aula-de-cada-objetivo` sem destino na prova, e `/api/mapa`), confirmado por `git stash` |
| **ao ar** | não recarregado na exploração, de propósito (a cota do KV). Uma carga no fim, depois do push |

### Executado na fotografia anterior (31/10/2026 — os tempos e o compasso vêm do verbete)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-musica-no-plano.js` | **18 asserções, 0 falhas** (nova) — jsdom, com o conteúdo e o alfabeto **de verdade**; a secção 6 é o **controle negativo** |
| …o que ela mede | uma música → `2` e `4/4` **travados** e já na resposta gravada; três músicas → dois `select` com só `4`/`8`/`12` e `4/4`, e `data-musicas` na linha; sem verbete → texto livre e os oito compassos; a nota diz a origem e onde se corrige; **sem o campo na rota, nada é derivado** |
| `node experimentos/provar-celula.js` | **106 asserções, 0 falhas** |
| `node experimentos/provar-verbete.js` | verde — o CRUD valida, grava no repositório e recusa apagar (fixture própria desde hoje: criava o «Battement fondu» do zero e recebia 409 agora que ele existe) |
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; **`3601081…`**; **sem renovação** — esta entrega lê o alfabeto, não o escreve |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` falham **antes desta entrega** (o nó `aula-de-cada-objetivo` sem destino na prova, e `/api/mapa`) — confirmado por `git stash` |
| **ao ar** — uma carga por sítio, no fim, e não na exploração | `/plano-ensino/?professor=perna-boa&escola=batata&ciclo=01` → **200**, com `musicasDoExercicio`, `MUSICAS_DO_TERMO` e a nota «vêm do verbete» no HTML servido; `GET /api/bastidores/termos` → **93 termos, 6 com `musicas`** (Plié `8\|4/4`; Battement tendu `4`, `8` e `12 em 4/4`; Battement dégagé `4\|2/4`; Rond de jambe en l'air `4\|2/4`; Battement fondu `2\|4/4`; Port de bras `12\|3/4`). A rota lê o alfabeto empacotado, **sem KV** |

### Executado na fotografia anterior (31/10/2026 — o plano acusa o termo que não existe)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-parametros-por-parametro.js` | **21 asserções, 0 falhas** (eram 14) — a secção 7 é o conteúdo órfão, com **controle negativo** |
| …o que ela mede no órfão | o aviso aparece, nomeia o id («rond-de-jambe»), nomeia o candidato («Rond de jambe à terre»), diz onde se corrige (Produção, Turmas) e nomeia a turma; a origem conta os **3 associados** e a matriz desenha os **2** que resolvem |
| `node experimentos/provar-plano-da-turma.js` | **46 provas, 0 falhas** |
| `node experimentos/provar-porta-sem-contexto.js` | **44 asserções, 0 falhas** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`**; selo renovado para a **versão 8** |
| reprodução com o **dado ao vivo** da `batata` | Nível 1 e Nível 2 → **Arabesque, Jeté** + aviso de «rond-de-jambe»; Nível 3 → **Arabesque, Jeté, Battement fondu** + o mesmo aviso |
| **não executado** | `provar-plano-completo.js` e `provar-plano-matriz.js` falham **antes desta entrega** (o nó `aula-de-cada-objetivo` sem destino na prova, e `/api/mapa`) — confirmado por `git stash` sobre `porta/index.html` |

### Executado na fotografia anterior (31/10/2026 — a frase no passo 2, e a listagem por baixo)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **106 asserções, 0 falhas** (eram 96) — no navegador, sobre bancada local |
| …o que ela mede na frase | a frase é escrita **uma vez** e entra nos **três** trechos (medido: três ocorrências no texto composto), acrescentar um trecho **não a limpa**, e a prévia mostra o texto **de cada célula** |
| …o que ela mede no sétimo passo | a tira tem os sete números e os sete rótulos, o segundo é «A frase», há um painel por passo, o último passo mostra a frase e o «lê-se» compostos |
| …o que ela mede na arrumação | a secção tem **uma coluna**, o formulário ocupa a largura dela (1048/1048 e 288/288), a listagem fica **abaixo** e já não é `sticky` |
| …o que ela mede na listagem | a posição vai em selo («Première position»), o complemento diz as direções, o compasso, as músicas e os trechos, e o nome continua a abrir o verbete |
| `node experimentos/provar-verbete.js` | tudo certo — e mede que o campo de frase **por trecho** não volta (`vb-cel-desc` ausente) |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768, 1024px) |
| `node experimentos/provar-vao-do-botao.js` | **62 de 62** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente** |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — incluindo a **8 (Peça)**: 16 superfícies, 13 ganchos |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** (o alfabeto não mudou) |
| geometria no navegador | a tira de **sete** passos: 2 linhas em 1280px (89px), 3 em 768px (136px), 7 em 390 e 320px (322px) — **sem transbordo** em nenhuma, e sem erro de JS |
| o dado real | Battement dégagé abre o passo 2 com a definição nova; Rond de jambe en l'air devolve a frase **gravada** («rondejambe en l'eir»), não a do dicionário |

### Executado na fotografia anterior (31/10/2026 — os seis passos e a edição do trecho)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **96 asserções, 0 falhas** (eram 85) — no navegador, sobre bancada local; a secção 18 é o modo de edição |
| …o que ela mede no modo de edição | «Editar» leva ao passo 4 com os valores do trecho, a contagem carregada é a dele (`1`, não `2`), o aviso diz o número, o «!» acende **só** nos passos 4 e 5, a linha perde o «×», «Cancelar» volta ao 6 e o trecho fica intacto |
| …e o que ela mede nos seis passos | um painel visível de cada vez, a tira diz o valor decidido, o passo 1 sobrevive ao modo do exercício (bloqueado, não escondido) |
| `node experimentos/provar-verbete.js` | tudo certo — o CRUD valida, grava no repositório e recusa apagar |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente**; as cinco que eu tinha aberto eram da bancada (o `#id`, o `closest` e a árvore da secção), não do motor |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram — incluindo a **8 (Peça)**: 16 superfícies, 13 ganchos, nenhuma classe inventada |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** |
| geometria no navegador | a tira de seis passos cabe em **320/390/768/1280** sem transbordo, e a página não tem erro de JS |

### Executado na fotografia anterior (28/10/2026 — a célula explicada)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **41 asserções, 0 falhas** — no navegador, sobre bancada local |
| `node experimentos/provar-verbete.js` | **66 asserções, 0 falhas** |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `node experimentos/provar-leituras-do-po.js` | **27 asserções, 0 falhas** |
| `node experimentos/provar-menu-da-producao.js` | **55 de 55** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768 e 1024px) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-glossario.js` | consistente — 18 símbolos, 18 verbetes, **0 avisos** |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`**; o alfabeto subiu a **versão 5** e o selo foi renovado |
| o texto dos PDFs gerados | **mesmo md5** que antes dos dois eixos — nenhuma célula declara orientação, e o documento não muda |
| `node experimentos/provar-celula.js` | **85 asserções**, 0 falhas — 3 direções e 5 orientações, caixas `radio`, três cliques em três direções deixam **uma** marcada, «en face» marca, nenhuma lista suspensa, três cliques = três sinais, sinal repetido, direção e orientação persistentes, `orientacao` no corpo gravado, e um en croix inteiro com o compasso corrido (`1\|1`, `1\|2`, `2\|1`) |
| geometria no navegador | contagem: `1`,`1–2` em 2/4 e até `1–4` em 4/4; frase sugerida pelo dicionário e preservada quando ajustada; sem transbordo em 320/390/768/1280; nenhum erro de JS |

### Executado na fotografia anterior (28/10/2026 — os dois modos e o editor de célula)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-celula.js` | **38 asserções, 0 falhas** — novo; num navegador de verdade, sobre bancada local |
| `node experimentos/provar-verbete.js` | **60 asserções, 0 falhas** (eram 50) |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-producao.js` | **151 de 152** — a falha «o item do menu fica marcado» é **pré-existente** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `node experimentos/provar-leituras-do-po.js` | **27 asserções, 0 falhas** |
| `node experimentos/provar-menu-da-producao.js` | **55 de 55** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768 e 1024px) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-glossario.js` | consistente — 18 símbolos, 18 verbetes, **0 avisos** |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** (não mudou: o alfabeto está fora da fórmula; só o selo foi renovado) |
| geometria dos modos (bancada local) | modo B: select e «+» bloqueados com opacidade **0.4**, foco no nome, sem transbordo em 320/390/768/1280; a tabela das direções muda de «não vai» para a descrição no gesto de acrescentar a célula |

### Executado na fotografia anterior (28/10/2026 — o vocabulário no repositório)

| Verificação | Resultado |
|:--|:--|
| `node experimentos/provar-verbete.js` | **50 asserções, 0 falhas** (eram 36; a secção F, nova, tem 14) |
| `node experimentos/provar-producao.js` | **151 de 152** — a única falha, «o item do menu fica marcado», é **pré-existente** (medida por stash) |
| `node experimentos/provar-notacao.js` | **74 asserções, 0 falhas** |
| `node experimentos/provar-teste.js` | **44 verificações** |
| `node experimentos/provar-leituras-do-po.js` | **27 asserções, 0 falhas** |
| `node experimentos/provar-menu-da-producao.js` | **55 de 55** |
| `node experimentos/provar-celular.js` | **15 de 15** (320, 360, 390, 414, 768 e 1024px) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram (a checagem 8 aceita o par do «+») |
| `node tools/check-glossario.js` | consistente — 18 símbolos, 18 verbetes, **0 avisos** |
| `node tools/check-pacote.js professores/perna-boa/ciclos/ciclo-01-batata-bale-nivel-1-teste-2` | **0 erro(s), 0 aviso(s)** |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2 --check` | cadeia íntegra; hash **`3601081…`** |
| geometria do «+» (bancada local, sem tocar no ar) | select e botão na mesma linha (topo 217 e 216; vão de 5px); caixa **0px** fechada e **296px** aberta; foco no primeiro campo; o termo criado entra no grupo certo; sem transbordo |

### Executado na fotografia anterior (28/10/2026 — a Sequência declarada e a métrica)

| Verificação | Resultado |
|:--|:--|
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` | pacote regerado; **0 erros e 0 avisos** |
| `node tools/check-pacote.js …` | **0 erro(s), 0 aviso(s)**; 26 verificações |
| validadores isolados | plano, PO, aula e captura satisfazem os schemas (o `pre-commit` reporta 10 lacunas declaradas no `-dados.json` e 1 provisório `[Preencher]` no plano — já existiam) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** |
| `tools/hash-ciclo.sh perna-boa 01 batata --check` | cadeia íntegra; hash **`1816e1eb…`** |
| `experimentos/provar-objetivos-por-aula.js` | **NÃO EXECUTADO** — o fixture `batata-bale-nivel-2-teste-2` foi expurgado; as asserções foram atualizadas por leitura, não por execução |
| conferência ao ar | Aula 01: **HTTP 200**, zero «Sequência declarada», «18 tempos, 3/4» presente; plano: link `aula-01.html#exercicios-da-aula-01` |
| workflows de `f4cc715` | Reancorar, Regerar os índices, Publicar as escolas, Publicar a raiz — **todos `success`** |
| bancada da musicalidade | sem transbordo em 420px, 760px e 1280px; a maior tabela mede 828px (a largura do conteúdo); 9 âncoras e 9 cabeçalhos, nenhum quebrado |

### Executado na fotografia anterior (28/10/2026 — cabeçalho e cartão da ficha)

| Verificação | Resultado |
|:--|:--|
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` | pacote regerado; **0 erros e 0 avisos** |
| `node tools/check-pacote.js …` | **0 erros, 0 avisos**; 9 páginas |
| validadores isolados | plano, PO, aula e captura satisfazem os schemas (captura com 2 avisos de mapeamento que já existiam) |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** |
| `experimentos/provar-ficha-visual.js` | **21 provas**, sem falhas (o bloco cercado, o traço até à borda, a ordem dos campos) |
| `experimentos/provar-titulo-e-barra.js` | tudo ok; o cabeçalho preso da aula mede **63px** e carrega o botão do documento |
| `experimentos/provar-publicacao-da-escola.js` | **63 asserções**, sem falhas |
| `experimentos/provar-cabecalho-do-documento.js` · `provar-celular.js` | ok · **15/15** em 320–1024px |
| `tools/hash-ciclo.sh …` + `--check` | âncoras regeradas; cadeia íntegra. Ciclo `7a0befc4…`, Aula 01 `f7effac1…` |
| `git push origin main` | três commits enviados; `pre-push` passou |
| workflows #105, #206, #289, #404 | todos `completed / success` no commit `3c3a29d` |
| conferência ao ar (Batata) | `/bale-nivel-1-teste-2/aula-01.html` responde 200 e traz «Abrir notação» no cabeçalho e «Condição desta aula» no corpo; `/glossario-benesh.html` responde 200 **sem** subtítulo. Nas duas, a fileira de etiquetas desapareceu e o menu é o atual |

### Publicação anterior (28/10/2026 — leitura dos documentos)

| Verificação | Resultado |
|:--|:--|
| `git fetch origin` + `git status -sb` | `main` alinhada com `origin/main` antes de editar; depois do push, `d9f085f` enviado sem divergência |
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` | pacote regerado; **9 páginas**, **292 links internos**, PDF consolidado de **34 páginas**, **0 erros e 0 avisos** |
| `node tools/validar-plano-ciclo.js` | satisfaz o schema; o `contexto` extrai as **11 chaves** com as duas tabelas somadas |
| `node tools/validar-po-ciclo.js` | satisfaz o schema, **13 campos de topo**; o aviso de secção fora do mapa desapareceu com o par corrigido |
| `node tools/validar-captura-ciclo.js` | **0 erros**, 2 avisos de mapeamento que já existiam |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram; o `pre-commit` repetiu-as |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** após regenerar os índices |
| `node experimentos/provar-ficha-visual.js` | **19 provas**, sem falhas |
| `tools/hash-ciclo.sh ... ` + `--check` | âncoras regeradas; cadeia íntegra. Ciclo `f934a3e8…`, Aula 01 `831ae856…` |
| `git push origin main` | três commits enviados; verificações do `pre-push` passaram |
| workflows `Regerar os índices` #205, `Publicar as escolas` #288, `Reancorar a cadeia` #403 | todos `completed / success` no commit `d9f085f` |
| conferência ao ar (Batata) | `/` → 200; `/aulas/` listou «Abrir notação · Lançar · Captura para impressão · PDF da aula»; o plano publicado **não** tem subtítulo nem ficha, traz os dois grupos do contexto e as âncoras `#aulas-01-13` e `#aulas-14-26`, e o rodapé «Referências Bibliográficas · PDF do ciclo» |

### Publicação anterior (27/10/2026 — entrega local da Aula)

| Verificação | Resultado |
|:--|:--|
| `git fetch origin` + `git status -sb` | após o push, o workflow de índices gerou `6029676`; fetch e rebase concluídos, `main` alinhada com `origin/main` |
| `provar-aula-prosa.js` | **19 verificações**, sem falhas |
| `provar-publicacao-da-escola.js` | **64 asserções**, sem falhas; prova de montagem em árvore temporária |
| `node tools/check-identidade.js` | **20 verificações**, todas passaram |
| `node --check` nos JavaScript alterados; `bash -n tools/gerar-ciclo.sh`; `git diff --check` | passaram |
| `tools/hash-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` + `--check` | âncoras do ciclo e da Aula 01 regeneradas; cadeia íntegra. Hashes: `297d7e77c8831c04d7d49c59544090e06a409f7148df2d69f6522e5fe54c07f7` e `9f72cebc97ee4157cf8c42b3f3b1d5a942e0550bfa7a1badb8a6f551269e3b21` |
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` + `node tools/check-pacote.js ...` | pacote gerado; **9 páginas HTML**, **325 links internos**, PDF consolidado de **34 páginas**, **0 erros e 0 avisos**; PDF individual `aula-01.pdf` com **10 páginas** |
| Validadores isolados do ciclo | schema, PO, plano, Aula e captura passaram; Captura com 2 avisos de mapeamento |
| `node experimentos/propostas/construir.js` + `node tools/montar-publicacao.js batata --com-propostas` | publicação local montada em `publicacao/batata`; lista de Planos e Aulas gerada |
| conferência de HTML e PDFs | Notação gerada com a estrutura da Aula e as tabelas Benesh; PDFs individuais e consolidado gerados; conferidos pelo agente de entrega |
| `git push origin main` | commit `8b939d0` enviado; verificações do pre-push passaram |
| workflow `Publicar as escolas`, run #287 | jobs `descobrir` e `publicar (batata)` concluídos com sucesso |
| conferência ao vivo, requisição única à raiz | `https://batata.tmenegaz77.workers.dev/` respondeu HTTP 200; HTML contém link para `/aulas/`. A rota específica não foi carregada após este deploy |

### Publicação anterior (27/10/2026 — entrega `d349ed0`)

| Verificação | Resultado |
|:--|:--|
| `git fetch origin` + `git status -sb` | após o push, `origin/main` estava alinhado com a entrega `d349ed0`, sem divergência |
| `node tools/check-indices.js` | **14 verificações, 0 falhas** após regenerar os índices derivados da âncora Batata |
| deploy automático (push → Actions) | `Publicar as escolas` **success** no commit `d349ed0`; job Batata **success** |
| conferência ao vivo | uma carga em `/aulas/`: **HTTP 200**, com o destino da prosa e a ação «Abrir notação» |
| `tools/gerar-ciclo.sh perna-boa 01 batata-bale-nivel-1-teste-2` + `node tools/check-pacote.js ...` | **9 páginas HTML**, PDF de **26 páginas**, 314 links internos; 0 erros e 0 avisos |
| Validadores isolados do ciclo | schema, PO e plano passaram; captura passou com 2 avisos sobre cabeçalho como grão e cabeçalhos repetidos |
| `tools/hash-ciclo.sh ... --check` | cadeia íntegra; hash `09ad8beef7d71a251cfc2163d7da086efc4c16bcc0004b6abdee02face8b5b15` |
| `provar-aula-prosa.js` / `provar-publicacao-da-escola.js` | 10 verificações / 61 asserções, sem falhas |
| `provar-barra-e-caminho.js` / `provar-barra-unica.js` | 48/48 / 109 asserções, sem falhas |
| `provar-painel-do-ato.js` | **TUDO CERTO**; Glossário disponível e persistente após rolagem em 1280 px e 390 px |
| `node tools/check-identidade.js` | 20 verificações, 0 erros |
| `node experimentos/propostas/construir.js` + `node tools/montar-publicacao.js batata --com-propostas` | concluído; atualizada apenas a saída local ignorada `publicacao/batata` |

### Executado nesta fotografia (26/10/2026)

| Verificação | Resultado |
|:--|:--|
| `git fetch` + `git status -sb` | `main` estava **2 commits à frente** de `origin/main` (`acfab1f`) ao abrir a sessão; push feito, `origin/main` em `fe71508` |
| deploy automático (push → Actions) | «Publicar as escolas» e «Publicar a raiz» **success** sobre `fe71508` |
| conferência ao ar, **uma carga** por destino | `/bastidores/producao` da `batata`: **200**, `par-botoes` **8×** (eram 6), e as três marcações novas no HTML servido. A raiz: **401** sem senha, como sempre |
| geometria do botão, medida em navegador | `provar-vao-do-botao` **62/62** em 1280px e 390px. Antes da correção: vão de **0px** no «Cadastrar aluna» e no «Cadastrar termo»; «Atribuir curadoria» com fundo `rgb(255,255,255)` e **45px**, contra `rgb(107,31,46)` e **49px** do «Cadastrar professor» |
| **controle negativo** da mesma prova (`git archive` do código de antes) | **46/62** — reprova 16, com o vão a 0px nos dois formulários e a curadoria no botão padrão da folha |
| `node experimentos/provar-celular.js` | **15/15**. Antes desta sessão saía com «bloco de estilo da Produção não encontrado»: a âncora era `position:sticky` e o menu passou a `fixed` |
| `node tools/check-identidade.js` | **20 ok, 0 erros** (é a checagem que roda também no `pre-commit`) |
| `node experimentos/provar-producao.js` | **150/151** — reprova «o item do menu fica marcado», e **a falha não é do produto**: a prova lê `className === "ativo"` no DOM falso e o `mostrarSecao` passou a usar `classList.add`. Na página real, com `#professores`, o link tem `class="ativo"` e `aria-current="page"` (medido no navegador) |
| `bash tools/gerar-handoff.sh` | regenerado |
| vão medido nos cinco formulários da Produção | **9px** (professor, aluna, termo, turma) e **13px** na curadoria — o anterior dela é o `.escolhedor`, e não um campo |

### Executado nesta fotografia (25/10/2026)

| Verificação | Resultado |
|:--|:--|
| `git fetch` + `git status -sb` | `main...origin/main`, sem divergência, `7182307` |
| contagem de `.md` na raiz | 28 (27 antes desta fotografia; o 28.º é este ficheiro) |
| estrutura de `.github/` | `agents/` 4 · `instructions/` 4 · `skills/` 3 · **`prompts/` não existe** |
| prompts do projeto | `prompts/` na raiz, 2 ficheiros (`elicitar-ciclo.md`, `instalar-ciclo.md`) |
| contagem de rotas em `rotas.js` | 31 |
| contagem de provas versionadas | 68 |
| contagem de ficheiros/linhas do motor | 52 / 26.311 |
| `curl` a 10 caminhos em produção | todos com o código esperado (tabela na §2) |
| leitura do `PLANO-AULA-E-OBSERVACAO.md` §9 | 6 perguntas abertas, confirmadas |
| contagem de regras e pétreas | 17 e 22 |
| contagem de manifestos de variante | 4 |
| `bash tools/gerar-handoff.sh` | regenerado, com o apontamento novo no cabeçalho |
| `node tools/check-identidade.js` | 20 ok, 0 erros |
| links relativos `.md` dos três ficheiros novos | 5 verificados, 0 quebrados |
| `marcos-por-aula` em `derivar-plano-ciclo.js` | é «objetivo específico (marco parcial)» — **conteúdo pedagógico**, não lugar |
| marcos declarados no plano da `batata` | **3**, para um ciclo de **26** lugares de calendário |
| `materiais` em `motor/nucleo/lancamento.js` | **0 ocorrências** — a folha impressa tem, o formulário não |
| `[Preencher]` na `aula-01` da `batata` | 6 marcadores em 3 secções (musicalidade, guia ×4, próximo passo) |
| as 8 secções da `aula-01` | 1 validação · 2 condições preliminares · 3 sequência · 4 musicalidade · 5 guia · 6 volume · 7 proveniência · 8 auditoria · 9 próximo passo |
| `materiais` na `captura-aula-01.md` | linha 65 — «**Materiais** ☐ fotos ☐ vídeo ☐ áudio ☐ comentário» |

**Um erro corrigido durante esta fotografia, e que fica registado de propósito:** a primeira versão
desta tabela dizia `.github/prompts/` com 1 ficheiro. **Não existe `.github/prompts/`** — os prompts
vivem em `prompts/`, na raiz, e são 2. A afirmação vinha de uma listagem anterior, não de uma
verificação. É exatamente o que a §12 avisa: «está no documento» não é «está no código».

### Não executado

- **A bateria completa de 68 provas não foi corrida.** Foram executadas as provas focadas na
  mudança, listadas acima.
- **`provar-listas-do-acervo.js` não foi executada.** A prova da publicação confirma que as listas
  independentes de Notação e Consulta deixaram de ser geradas.
- **A produção não foi percorrida página a página.** A conferência final foi uma única carga de `/aulas/` após o deploy; a tabela da §2 mantém a conferência geral anterior de 25/10/2026.

## 10. Próximos passos

**O que a sessão de 02/11/2026 mudou nesta lista.** A **ordem que ela fixou** continua a ser a régua
— *ajustar muito bem a geração da aula → o formulário da coleta → o caderno → o botão de criar a
aula* —, e o primeiro item deixou de estar «feito» para estar **verificado secção a secção**: a aula
já não afirma o que ninguém escreveu, e é isso que estava a impedir o passo seguinte. O que ela pediu
a seguir, nas palavras dela, foi **esmiuçar os exercícios da aula** («depois que você fizer esses
ajustes, a gente vai esmiuçar isso daqui porque tem um bocado de erros») — e é esse o próximo passo
concreto: **a tabela dos exercícios, a coluna a coluna**, com o mesmo método (o que vem do dado e o
que vem do código).

**Os três produtos estão decididos, e o primeiro passo deles NÃO é código.** O
[PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md) tem seis fases, e a **fase 0 é conteúdo**:
(1) o **mapa nível→termos** para os 13 níveis, começando pelo nível 1 (hoje: 13 turmas, **9
associações**, e só 2 níveis com alguma); (2) as **4 músicas** que não fecham os tempos (
Rond de jambe en l'air 3 em 4, Battement dégagé 6 em 4, Battement fondu 6 em 2, Relevé 1 em 2) — e a
gravação **já as recusa**, logo não se podem regravar sem corrigir; (3) ~~a licença~~ — **decidida**
(`ARQUITETURA-GERAL.md` §10), falta só o `LICENSE.md`; (4) a **proveniência das 25 descrições**, que a
licença exige para o dicionário poder ser vendido inteiro. Só depois a fase 1 (a separação
catálogo × escola) e a fase 2 (as três saídas em memória) entram em código.

**E há uma ordem que o plano recomenda e ela ainda não decidiu:** a **camada pedagógica**
(exige/ensina/expressa) pode ser o **mesmo trabalho** que o mapa nível→termos — quem declara «o nível
1 ensina `plié` e `tendu`» já está a dizer o que a unidade ensina, e fazer as duas na mesma passagem
poupa uma ida à curadoria.

**PENDENTE dela, e só ela pode decidir:** a **Regra 4** — «força e flexibilidade» no texto, ou o
campo do espaço —, agora que a força e a flexibilidade se sabe onde estão e já chegam ao PO.

**RESOLVIDO a 19/11/2026 — o filtro por escola do vocabulário está LIGADO.** O vocabulário é um
ficheiro só e cada termo declara o seu dono (`escola`); `termos()` separa os três grupos e `compor`
junta só dois — o termo de `breu` não aparece em `viva`. **É automático:** a escola é a do Worker
que serve a página (`ESCOLA_SLUG`, lido por `escolaDe`), e não há nenhum campo de escolha de escola
no Dicionário — perguntei-lho e a resposta é que não precisa, e não precisa mesmo: um `<select>` de
escola seria a segunda resposta para a mesma pergunta, e a que pode mentir. A ponte
(`catalogo-seed.js`) deixou de descartar o campo. Provas: `provar-dicionario` §G (a ponte não perde
campo) e §H (o mesmo pedido, com `ESCOLA_SLUG` diferente, dá listas diferentes).

**E fica um dado por corrigir, que o filtro tornou visível:** o «Plié» da `breu` está gravado com a
**definição do «Tandu»**. Com o filtro ligado, é essa versão que a `breu` vê (`origem: escola`), e
a do catálogo não aparece lá. Não é um defeito de código — é um termo mal preenchido, e a correcção
é dela: editar o termo no Dicionário, ou apagá-lo para a versão do catálogo voltar a valer.

**Da Fase 1 falta um item:** as **seleções no plano** (§1.6). Todo o resto do alfabeto está feito — o
verbete administrável, os dois eixos, o dicionário, o «lê-se», os cinco passos com o trecho editável, e
a frase escrita **uma vez** por exercício.

**Os três nós que ela questionou a 01/11/2026 estão fechados** (`ac6caa0`): a música **sobe da
sequência** e é leitura, o campo do nó 24 pede **só o link do vídeo**, e o **repertório** é
`somenteLeitura` — semeado com os exercícios da aula, o que torna exacta a conta do `usosDosPlanos`.
A **faixa** (o título da música) continua a não existir em lugar nenhum, e é a única coisa que este
bloco ainda pede por escrito, dentro da caixa do vídeo.

**O P1 — a ligação bloco ↔ dimensão por id — é o próximo passo, e é decisão dela** (01/11/2026:
«Sim, são a mesma coisa com dois nomes. Use ligação por id»). O recorte **já existe** em
`objetivosEspecificos[].blocos`; o trabalho é **ligá-lo** ao PO e fazê-lo chegar ao formulário — é
**ligação**, não invenção.

**E a ligação é POR AULA, não para as 26** (decisão 34): ela corrigiu a 01/11/2026 o enquadramento
que esta fotografia trazia — *«a aula é elaborada no momento que o professor acha oportuno (…). Não
dá pra fazer dessa maneira que você tá sugerindo. Não tem como. É completamente fora do mundo real.»*
O recorte lê-se **quando aquela aula nasce**, com o registo da anterior à frente.

**A ordem que ela fixou (01/11/2026), e o ponto em que estamos:** *ajustar muito bem a geração da
aula → o formulário da coleta ser a expressão da janela → o caderno → só então o botão de criar a
aula.* As duas primeiras estão feitas (`82d37ef`). **A terceira é a próxima, e é o caderno.**

**O que falta para o caderno ser a base da aula 2 — medido, não suposto.** O formulário já pergunta
pela janela inteira (os 8 critérios, as condições de contorno, o relatório), mas **a sequência
executada não é perguntada em lugar nenhum**: o próprio `tools/lib-vistas.js` declara a lacuna —
«Estrutura executada: [Preencher: a ordem dos blocos vem do plano da aula, que é uma das três
entradas — o JSON não a guarda]». Sem ela, o caderno diz o que se observou e **não diz o que se fez** —
e é o que se fez que a aula 2 herda.

**O caminho crítico medido, e não é o P1 — é a aula 2 existir.** Hoje:
- a **lista** mostra os 23 lugares sem marco como «Lugar do calendário — sem marco», e o
  `PLANO-AULA-E-OBSERVACAO.md` §5.1 prevê a ação **«Definir o marco»** — que **não existe no código**
  (busca em `motor/`, `porta/`, `tools/templates/`, `workers/`: zero ocorrências de «Definir o marco»);
- «**Abrir a aula**» também não existe no produto: só nos fixtures do `check-identidade` e nas
  propostas de desenho;
- o **caderno** (o *livro* de que ela fala) tem builder em `tools/lib-vistas.js`, mas o
  `gerar-vista.js` só gera `guia-de-observacao` — as outras vistas «entram quando a captura tiver o
  dado», e `aulas` está vazio.

**Custo do P1:** `porta/index.html`, `tools/templates/lancamento.html` e
`tools/validar-captura-ciclo.js` (**os dois congelados**: motivo declarado + entrada no `REGISTRO` +
commit próprio), a folha de **cada aula criada** (hoje **uma**) e a reancora.

**Pendente dela** (nada disto é código à espera de autorização, é olho dela):
- **Corrigir a associação** das turmas da `batata`: a relação guarda `rond-de-jambe`, que não existe no
  vocabulário. Em Produção → Turmas → Associar, remover e associar «Rond de jambe à terre».
- **Escolher a turma do plano**: os planos existentes são do Nível 1 e do Nível 2, e os termos que ela
  quer estão associados ao Nível 3 — ou se planeia o Nível 3, ou se associam os termos ao nível do
  plano em uso.
- **Usar o último passo a sério** — acrescentar vários trechos e ver que a frase não se pede outra vez.
- **As 4 linhas «a conferir»** das posições de braços no alfabeto — o dicionário dela só as responde em
  parte.
- **Revisão das quatro descrições que eu redigi agora** (dégagé, glissé, tendu jeté, jeté): a `fonte`
  diz que são minhas, a partir da distinção que ela própria registou, e que estão a conferir.
- **Revisão das frases que eu redigi** para os **32 exercícios sem definição** (23 de 55 têm).
- **A tira em cinco passos ocupa 2 a 3 linhas** na coluna de 34rem (e 5 no telefone): não transborda em
  320–1280px, mas come altura acima do formulário. Se incomodar, alarga-se a coluna do formulário só
  nesta secção — continua a ser «formulário à esquerda, listagem à direita» — ou esconde-se o valor dos
  passos abaixo de 700px.
- **Conferir os três modelos de ensaio** do alfabeto (versão 9): a decomposição é minha, e a música do
  Arabesque (`4|4/4`) e a do Grand battement (`8|4/4`) são escolha minha — e o plano passa a trazê-las
  **travadas**, porque o verbete passou a responder por elas.

**Publicação:** depois do push, uma única carga ao ar para confirmar os cinco passos e a listagem na
página publicada — é a conferência final, não a exploração (ver §12 e a regra da cota do ar).

**PENDENTE — a listagem das ALUNAS CADASTRADAS no padrão dos nichos (19/11/2026).** Pedido dela, na
letra: «Tem que ajustar agora a listagem das alunas cadastradas também, porque ela precisa seguir o
mesmo padrão que a gente adota, por exemplo, em salas. Nós temos aqui nichos na listagem que organiza
para não ficar bagunçado, porque alunas está cheia de etiquetas e de informações e está meio
bagunçado isso.» **CONFIRMADO** no código: o cartão da aluna (`paginaProducao`, secção das alunas)
acumula, na mesma linha, os selos (`livre`/`vinculada`/`desligada`, o da passagem anterior), a coluna
«turmas · …», o atalho do elenco, os botões, a linha de cada vínculo de modalidade com professor e
anamnese, e a nota da passagem — sem a grelha de **nichos** que o cartão da Sala usa para arrumar os
mesmos factos. **Não foi tocado** nesta entrega, por ordem dela (primeiro a anamnese); o registo da
correcção da anamnese está no `REGISTRO.md` a 19/11/2026.

**RESOLVIDO a 19/11/2026 — o gesto que gravava e depois dizia que não.** O relato dela juntava duas
frases que pareciam contraditórias — «deu `Erro: limparOVerbete is not defined`» e «apareceu a
mensagem informando que foi gravado» — e as duas eram verdadeiras: **o servidor gravou**, a resposta
chegou com `ok`, e a excepção veio **depois**, de uma função que ficou chamada e sem corpo numa
reescrita. O `.catch` escreveu-a no `.res`, e um erro de JavaScript ficou com a cara de uma recusa do
produto. **CONFIRMADO** por A/B: a prova nova, corrida contra o `bastidores.js` anterior, nomeia os
três nomes órfãos (`limparOVerbete` ×1, `recadoDoDicionario` ×2); hoje, zero. Correcção em
`ARQUITETURA-GERAL.md` §5.32, com a regra que sai dela: *o que vem depois da gravação não se reporta
como se fosse a gravação*.

**RESOLVIDO a 19/11/2026 — o glossário que travava o fecho dos derivados.** A verificação 8 do
`check-indices` reprovava o glossário do «Código de dança» (`.md` e `.html`) por «sem tipo
declarado», o passo «Commitar os derivados» ficava `skipped` e o derivado não fechava. **Causa:** o
`slugDe` escreve `_` (foi feito para **chaves**), e os padrões de declaração só conheciam `[a-z]` e
`[a-z0-9-]` — é o primeiro glossário cujo slug tem mais de uma palavra. Os dois padrões passaram a
aceitar `_`, e `indices/esquema/**` entrou nos `paths` do `derivados.yml`. **CONFIRMADO:** o
`derivados` voltou a passar (run 76, `success`).

**RESOLVIDO a 19/11/2026 — o gesto de gravar tem um rótulo, e o fim do gesto é o mesmo em todas as
secções.** Os oito botões dizem `Gravar` (de `ROTULO_DO_GRAVAR`, no servidor), e nenhum deles volta a
ser reescrito pelo cliente: o **efeito** (criar ou regravar) vive no `title` e na resposta, e não no
rótulo. O fim do gesto — aviso no canto, formulário limpo, secção recolhida — está nas sete secções
com formulário. **O que a prova mede é a ausência**, e não a presença: enquanto um `textContent = …`
decidir o texto de um botão, a nona secção divergirá na primeira vez que precisar de um caso novo.

**RESOLVIDO a 19/11/2026 — o T1: a Sala manda na direção da Turma.** Ela escolheu a estrada **A** («e a
memória fica»): a Turma **lê** o par da Sala, e a cópia continua no registo como memória do dia em que
o elo foi escrito. Quatro sítios passaram a ler a Sala — o `enquadramentoDaTurma`, o
`GET /api/bastidores/curadoria-professor`, a autorização do plano em `POST /api/elicitar` e a cadeia
(`direcaoDeHoje`, `autoriaIntacta`). **CONFIRMADO:** o professor novo vê a turma que passou a dar, o
antigo deixa de a ver, e a cadeia apanha a troca com a frase da autoria. O `id` da curadoria não muda
(é identidade) e a tradição continua na curadoria (não está na Sala). **E o expurgo foi conferido,
como ela pediu:** faltavam-lhe **`matriculas`** e **`cadeia`** na lista declarada — a que vale no dia
em que o `kv.list` não responde —, e a bancada passou a comparar a lista com as chaves que o **código**
escreve.

**RESOLVIDO a 19/11/2026 — o T2: o gesto de Salas percorre a cadeia.** `turma-professor` passou a chamar
`rodarCadeia` com o gatilho **`troca-de-direcao`** e devolve `cadeia` e `trocou: {professor, modalidade}`
— o mesmo contrato das outras cinco rotas. E o que a cadeia faz não é derivar: é **parar e dizer**. A
etapa `plano-de-ensino` fica `bloqueada` com a frase da autoria, o plano do anterior fica `sem turma` a
dizer quem o escreveu, e o professor novo escreve o dele — a regra de 12/11/2026, que já existia no
motor; faltava alguém a correr. Três correcções vieram antes do gatilho: a travessia **só corre quando
algo mudou** (a pergunta é feita antes da escrita, e a resposta di-lo); o gatilho passou a dizer **o que
mudou** também no `turma-editar` e no `turma-derivar`, que mandavam sempre `mudanca-de-sala`; e o estado
da cadeia devolve **`parouPor`**, a frase da etapa que parou, que o aviso leva através da recarga. **E a
ponte:** `producao.js` declara os gestos para os quais a cadeia é montada, e o `turma-professor` estava
de fora — um gesto fora dessa lista chama uma cadeia `null`, grava, responde `200` e não percorre nada.
**CONFIRMADO** por `provar-os-fluxos-da-derivacao` (57; **14 de 56** reprovavam contra o `bastidores.js`
anterior).

**RESOLVIDO a 19/11/2026 — o T3: a troca de modalidade bloqueia.** Decisão dela: *«bloquear»*. A
modalidade não é etiqueta — é o **corpo de referência** com que se mede: a régua vem com o par
(`conferirOParDaSala`), os níveis são outros, e as anamneses são por modalidade. E o pior é que até
aqui nada falhava: o PO copia as `respostas` verbatim (é a regra), e é nelas que vivem os níveis — a
escala mudava debaixo do documento, em silêncio. A guarda `modalidadeMudou(doc)` compara a modalidade
que o **documento** declara com a que a **Sala** declara hoje e põe a etapa do plano — e a do PO — em
`bloqueada`, com a frase que nomeia as duas e diz o que fazer. Nasceram duas peças para a guarda ter o
que comparar: o documento passou a **declarar** `contexto.modalidade` (`comAModalidadeDaSala`, na
porta, a partir da Sala — o campo já era admitido em `CAMPOS_DE_CONTEXTO`, e um comentário afirmava o
contrário); e os dois caminhos que produzem um elo passaram a ser **assimétricos de propósito** — a
derivação automática **preserva** a modalidade (senão o documento declarava-se conforme por construção
e a trava levantava-se sozinha), a porta **declara** (abrir o plano e gravar é o acto de quem escreve).
O vazio não é erro: um elo anterior a esta data não declara a modalidade, como um elo antigo não
declara o professor. **CONFIRMADO** por `provar-os-fluxos-da-derivacao` (65; **5 de 65** reprovavam
contra o `nucleo/cadeia.js` anterior) e por `provar-gestos-do-shard` (33; **2 de 33** contra o
`rotas.js` anterior). **Próximo:** o T4 — os **conteúdos** da Turma, e o mapa antigo (`turma-conteudos`), que ainda era
escrito e lido.

**RESOLVIDO a 19/11/2026 — o T4: os conteúdos passam para o `repertorio`, e o mapa antigo fecha.**
Decisão dela: *«migrar»* — e depois fechar a leitura também, porque enquanto o mapa for lido é um
segundo dono do mesmo facto. `migrarMapaAntigo` leva-o para o `repertorio` da curadoria **vigente**,
sem duplicar e na ordem da declaração, e **não inventa destino**: turma sem curadoria, ou curadoria
que ensina duas turmas, voltam em `semDestino` com o motivo. A rota `migrar-conteudos` só grava a
marca `conteudos-migrados` quando `semDestino` está vazio — senão a leitura fechava e apagava da tela
os conteúdos dessa turma (**409**); `simular` não escreve. As rotas antigas `turma-conteudo` recusam
com o caminho certo, o mapa **não se apaga** (fica como memória) e a chave nova entrou na lista do
expurgo no dia em que nasceu. **CONFIRMADO** por `provar-a-migracao-dos-conteudos` (24; **14 de 24**
reprovavam contra o código anterior) e pela §D do `provar-os-fluxos-da-derivacao` (65). **Próximo:** o
T5 — o Estilo: editar um exercício que uma Turma usa.

**RESOLVIDO a 19/11/2026 — o T5: o estilo regera os documentos.** Decisão dela: *«regerar»*, e
automaticamente. Gravar ou apagar um verbete percorre as Turmas que usam aquele exercício — a
pergunta responde-se pela **composição** do mapa, e não por uma lista à mão — e dispara **uma geração
por (professor, ciclo, turma) que já tenha plano**; sem Turma que o use, ou sem plano, nada se
dispara e a resposta diz porquê. **Aqui não se deriva**: o plano é o mesmo e o autor é o mesmo — o que
muda é a leitura que o documento faz do exercício, e um elo novo faria o passado dizer que alguém
reescreveu uma decisão que ninguém tocou. O miolo da geração, que vivia dentro do
`gerarOsCiclosDoElenco`, foi extraído para `gerarOsCiclosDasTurmas` — um caminho, um sítio. **O custo
é real** (uma geração são vários subpedidos) e é por isso que a resposta leva as Turmas e cada
disparo. **E a tela passou a dizê-lo** (fechado no mesmo dia, ver abaixo). **CONFIRMADO** por
`provar-o-estilo-regera` (12 → 19; **9 de 12** reprovavam contra o `bastidores.js` anterior). **Próximo:**
o T6 — o Dicionário, a mudança condicional.

**RESOLVIDO a 19/11/2026 — o T6: o dicionário regera, mas só quando alguém usa o exercício.** É a
regra dela por palavras próprias, e a condição não se escreve em nenhuma rota: as quatro que escrevem
o termo (`POST`, os dois caminhos do `PUT`, o `DELETE`) chamam a mesma colagem do T5
(`comAGeracaoDoTermo`), e é a travessia que pergunta quem usa o exercício — quando ninguém usa,
responde com o aviso e não dispara nada. Uma regra, um sítio. **CONFIRMADO** por
`provar-o-estilo-regera` (15 → 19; a §D nova, e **1 de 15** reprova contra o `bastidores.js` do T5 sem
o T6 — é exactamente a ligação).

**RESOLVIDO a 19/11/2026 — o recado da geração na tela.** O servidor disparava a geração e devolvia o
que aconteceu em `geracao`; as três telas que gravam liam `versao`/`ajustou`/`criouVersao` e
**ignoravam-no** — o comentário da rota dizia «para o gasto ficar à vista», e ficava à vista de quem
lesse o JSON com `curl`. Passou a haver **um segundo aviso, em atenção**, por cima do «gravado»: que a
geração partiu (e leva minutos), que **falhou** (e os documentos ficam com a notação antiga), que não
há ciclo (com o caminho) — e o **silêncio** quando ninguém usa o exercício. A Turma passa a ser
nomeada pelo nome que se ensina (o disparo levava só a `variante` do pacote), e a resposta passou a
dizer **`motivo`** (`sem-plano` × `sem-token`) para a frase não adivinhar por palavras o que o código
sabe. **CONFIRMADO** por `provar-avisos` (37; §F medida **na página**, **10 de 37** reprovavam antes) e
por `provar-o-estilo-regera` (19; **3 de 19** antes). **Próximo:** o T7 — o calendário. **E a premissa com que eu o abri estava errada** (ver abaixo).

**CORRIGIDO a 19/11/2026 — as datas das aulas existem, e vêm da Sala.** Estava escrito aqui que «não
há data por aula» e que a regra «o passado não se mexe» não tinha o dado de que precisa. **É falso**, e
ela corrigiu-o: *«temos a sala. […] Essa é a programação da aula. […] É assim que a gente tem a data de
cada aula.»* Medido em `publicacao/breu/rosa/ciclos.json`: `aulas` é uma lista de **24** entradas com
`n`, **`data`** (`2026-12-14`), `inicio`/`fim`, `marco`, `lancada`, `ancora` e `prazo`, calculadas do
ritmo da Sala pelo `calendario.py` dentro do `gerar-ciclo.sh` — e lidas por `aulas-dadas.js`. **O que
falta é o CORTE, não o dado:** a lista é recalculada a cada geração a partir do ritmo **actual**, e
uma aula já lançada move-se se os dias ou o período mudarem; e nada compara `a.data` com a data da
mudança. Ela decidiu que a data **vem do ritmo da Sala** (opção A). O código não mudou hoje: a
correcção mexe no `gerar-ciclo.sh`, que só corre inteiro com um ciclo real — e ela vai fazer o expurgo
da `breu` a seguir. Ver a nota datada na §3.4 do `ARQUITETURA-GERAL.md` e a reescrita do T7.

**ABERTO a 19/11/2026 — os fluxos de derivação, e o que falta neles.** A verificação da
verdade mediu o que dispara hoje: **seis** rotas percorrem a cadeia (`turma-editar`, `turma-derivar`,
`turma-professor` — desde o T2 —, `linha-de-base`, `elenco-mover`, `curadoria-derivar`), e **sete
gestos** que deviam percorrê-la continuam a não a percorrer: a Turma gravada no lugar (o buraco é o
**elenco**), os **conteúdos** (`turma-conteudo`, que escreve sem guarda nenhuma), o **Estilo**, o
**Dicionário** (condicional), a **régua** do professor, o `professor-desligar` (marca, não percorre) e
o `DELETE /linha-de-base`. A causa de fundo do primeiro caso era a **cópia** — resolvida no T1: a
direção de hoje lê-se da Sala. E, com o T7, falta o dado de que a regra «o passado não se mexe»
precisa: o sistema conhece o **período**, não a **data de cada aula** — só sabe que aulas foram
lançadas. **CONFIRMADO** por `provar-os-fluxos-da-derivacao` (57) e pela §3.4 do
`ARQUITETURA-GERAL.md`.

**PENDENTE dela — o nome de arquivo do glossário é `_` ou `-`?** O ficheiro ficou
`…-glossario-codigo_de_danca.md` porque o `slugDe` foi escrito para chaves e passou a nomear ficheiros.
Renomear para kebab-case (`…-glossario-codigo-de-danca.md`) alinharia com a convenção dos outros
nomes, mas mexe em **dado e em âncora**: o nome já está no `DOCS` do manifesto e no pacote publicado.
Não se muda sem ela decidir.

## 11. Histórico recente

Alterações materiais desde a fotografia anterior (não existia; a referência é o `REGISTRO.md`):

- **20/11/2026** — **A Sala derivou e os planos não, e a culpa era da data.** Derivação da Sala
  `Rosa` com ritmo novo (45 → 60 min, fim 05/02 → 08/01): a Sala persistiu, o plano e o PO ficaram
  nos elos antigos, e os documentos saíram a dizer «45 minutos». Causa: `novo(gerado_em || id)`
  compara strings, e `'2026-11-19T21:44' >= '2026-11-19'` dava o plano por mais novo que uma
  mudança feita duas horas depois. Duas guardas novas no núcleo: **o ritmo declarado** (as quatro
  chaves que a derivação relê, comparadas em minutos e com os dias como conjunto) e **o PO segue o
  plano** (se o plano vai derivar, o PO observa um plano que deixa de valer). `provar-os-fluxos-da-
  derivacao` 65 → 73, A/B **3 de 73** sem a correcção. **Custo do gesto quebrado: 1 execução,
  2 min, ≈1 m 44 s do clique aos documentos.** Lacuna declarada: a hora não está no plano, e uma
  mudança só de hora não dispara a guarda.

- **20/11/2026** — **Os dois defeitos que faziam o sítio parecer quebrado.** O `404` do ciclo e da
  aula era o **endereço** com a escola duas vezes (`/breu/rosa/plano`); sem o prefixo tudo responde
  200. Passou a haver um `302` para o caminho sem duplicação, e só onde o ASSETS responde 404. O
  «status pending» do PO era `falhou-no-disparo` com **«Too many subrequests by single Worker
  invocation»** e `escritas: 0` — o «Guardar» gastava os 50 subpedidos antes do último passo. A rota
  passou a **declarar** `fecharPacote` e o cartão da porta pede-o em invocação própria
  (`/api/bastidores/cadeia-pacote`). **E o elo maior:** num shard, `montarCadeia` lia
  `plano-observacao/…` em vez de `<escola>/plano-observacao/…`, desistia em silêncio e **a cadeia
  automática respondia «não está montada neste Worker» a todos os gestos** — troca de sala, troca de
  professor, saída de elenco, fecho do pacote. Corrigido, com o A/B medido:
  `provar-arvore-do-shard` 20 → 30 (sem o prefixo, 29 de 30) e `provar-geracao` 34 → 40 (sem o
  fecho, 4 de 36).

- **19/11/2026** — **Correção: as datas das aulas existem.** A §3.4 desta fotografia afirmava que não
  havia data por aula, e o `ciclos.json` publicado mostra 24 aulas datadas, calculadas do ritmo da
  Sala. O T7 passa a ser «**congelar** a data das aulas que já aconteceram», não «criar a data». Nenhum
  código mudou; a nota está na §3.4 do `ARQUITETURA-GERAL.md`, no T7 do plano e no `REGISTRO.md`.

- **19/11/2026** — **O recálculo do custo dos fluxos, sobre a auditoria do §L9f.** O
  `CUSTO-DOS-FLUXOS.md` parte da auditoria de 17/11/2026 (modelo conferido contra a fatura com 3,5% de
  erro) e acrescenta o que faltava: os fluxos novos e a **contagem de execuções por gesto**. E
  corrige-a num ponto, de factor 3: **uma aula custa 3 minutos, e não 1** — o lançamento pede a
  geração (`provar-o-custo-da-aula`, 12 asserções), o que baixa a capacidade de **1 478 para 492
  aulas/mês** e faz a franquia do Avançado (800) deixar de caber sozinha. **E uma lacuna declarada:** a
  bancada prova que a rota pede a geração, mas a produção não mostra nenhum lançamento a produzi-la —
  a diferença é uma pergunta em aberto, não um facto. Constantes medidas: `Gerar o ciclo` 2 min,
  `derivados` 1, `publicar` 1, `criar-escola` 1 — e **78 dos 117 s do job de gerar são o
  `preparar-tex`**, para 5 s de geração real. Por gesto, medido nos runs dela de 00:44: anamnese 1,
  plano 1, PO 1, verbete em uso 3, T2/T3/T4 0 (bloqueiam) — **seis commits custaram 1 minuto**, porque
  o `concurrency` do `derivados` funde o que cai no mesmo minuto. Cenários: 66 min/mês (escola
  pequena) · 1 166 (escola a sério, 58% do Free) · 10 170 (stress de três escolas). Seis alavancas com
  ganho calculado; **nenhuma aplicada** — a ordem é dela.

- **19/11/2026** — **O recado da geração.** As três telas que gravam passaram a mostrar o que a
  geração fez: partiu (e leva minutos), falhou (e os documentos continuam com a notação antiga), não
  há ciclo (com o caminho) — ou nada, quando ninguém usa o exercício. O aviso é de atenção, e não de
  êxito, porque «gravado» está feito e a geração está a caminho.

- **19/11/2026** — **T6: o dicionário regera, condicionado ao uso.** As quatro rotas que escrevem o
  termo chamam a mesma travessia do T5; a condição — «só se um exercício estiver vinculado à turma» —
  não se escreve em nenhuma delas, porque é a travessia que a responde. Um termo livre não dispara
  nada, e a resposta di-lo.

- **19/11/2026** — **T5: o estilo regera os documentos.** Editar o verbete de um exercício que uma
  Turma usa dispara a geração dos ciclos dela; a pergunta «que Turmas usam isto» responde-se pela
  composição, e o miolo da geração passou a ser um só (`gerarOsCiclosDasTurmas`). Não se deriva: o
  plano e o autor são os mesmos, o que muda é a leitura. Falta mostrar o `geracao` na tela.

- **19/11/2026** — **T4: os conteúdos da Turma passam para o `repertorio`, e o mapa antigo fecha.** O
  `turma-conteudos` deixou de ser escrito e de ser lido, depois de migrado para o `repertorio` da
  curadoria vigente — sem duplicar, sem inventar destino, e com a marca `conteudos-migrados` a fechar
  a leitura. A migração não fecha a leitura quando sobra uma turma sem para onde ir. Ver `REGISTRO.md`
  e o T5 aberto no `PLANO-FLUXOS-DE-DERIVACAO.md`.

- **19/11/2026** — **T3: a troca de modalidade bloqueia, e o documento passa a dizer sob que escala foi
  escrito.** A guarda `modalidadeMudou` compara a modalidade do documento com a da Sala, e bloqueia o
  plano e o PO — a régua vem com o par, e a cadeia não converte um instrumento noutro. A porta passou a
  gravar `contexto.modalidade` a partir da Sala; a derivação automática **preserva**, a porta
  **declara**, e é essa assimetria que impede a trava de se levantar sozinha. O vazio não é erro. Ver
  `REGISTRO.md` e a §3.4 do `ARQUITETURA-GERAL.md`.

- **19/11/2026** — **T2: o gesto de Salas percorre a cadeia, e o gatilho deixa de mentir.** Mudar o
  par (modalidade, professor) de uma Sala passou a chamar `rodarCadeia`, e a resposta traz `cadeia`,
  `trocou` e `parouPor`. A cadeia não deriva: **pára e diz** que a autoria não se reescreve. A
  travessia só corre quando algo mudou; o gatilho dos três caminhos que mexem no par passou a dizer o
  que mudou; e a ponte (`producao.js`) passou a montar a cadeia para esta rota — estava de fora, e uma
  rota fora dessa lista grava, responde `200` e não percorre nada. Ver `REGISTRO.md`, a §3.4 do
  `ARQUITETURA-GERAL.md` e o T3 aberto no `PLANO-FLUXOS-DE-DERIVACAO.md`.

- **19/11/2026** — **A verificação da verdade dos fluxos: um gatilho que falta, e as duas cópias do
  professor.** Nenhum código mudou — mediu-se. Cinco rotas percorrem a cadeia e oito gestos que deviam
  não a percorrem; o gesto de **mudar o professor de uma sala** grava a Sala e deixa a Turma a dizer o
  antigo, não traz `cadeia` na resposta, e o professor novo **não vê** a turma que passou a dar,
  enquanto o antigo continua autorizado a escrever-lhe o plano. A cadeia, com a cópia velha, **não
  apanha** a troca; com a cópia nova diz `bloqueada` com a frase da autoria. E a regra «o passado não
  se mexe» **não tem o dado de que precisa**: sabe-se o período, não a data de cada aula. Ver a §3.4
  nova do `ARQUITETURA-GERAL.md`, o `PLANO-FLUXOS-DE-DERIVACAO.md` (nove passos) e o `REGISTRO.md`.

- **19/11/2026** — **«Gravar é gravar»: oito botões, um rótulo, e o fim do gesto em todas as
  secções.** Os oito botões que gravam um formulário diziam oito frases diferentes — «Criar
  dicionário», «Gravar verbete», «Cadastrar aluna», «Gravar cadastrar professor», «Atribuir turma»,
  «Criar elenco»… — e cinco delas eram reescritas pelo cliente conforme o modo. Passaram todos a
  `ROTULO_DO_GRAVAR` (`'Gravar'`), uma constante no servidor, e as reescritas foram **apagadas**.
  **CONFIRMADO ao vivo:** a página servida tem oito «Gravar» na marcação e **zero** frases mortas no
  script. No mesmo dia: o Dicionário recusava um formulário inteiro (o `POST` lia `termo`, o
  formulário manda `nome`); a Audição não recolhia a secção nem tirava o recado de dentro do
  formulário — a cadeia ganhou sítio próprio (`#lb-cadeia`, na coluna da lista); o cadastro do
  professor limpava o passo 1 e deixava o 2, porque o fim do gesto esquecia o rascunho e não o foco
  nem o passo; e a aluna **livre** voltou a poder ser corrigida — saiu a guarda que o proibia por a
  anamnese já estar feita, porque **uma guarda nova não pode cobrar de quem não tem o que ela
  protege** («livre edita-se, vinculada deriva-se», 16/10/2026). Prova nova
  `provar-gravar-e-gravar` (**49**), **A/B: 29 de 49 reprovavam** contra o `bastidores.js` anterior.
  Ver `ARQUITETURA-GERAL.md` §5.33 e o `REGISTRO.md`.

- **19/11/2026** — **Um erro de código com a cara de uma recusa do produto.** O `limparOVerbete` ficou
  chamado e sem corpo, a gravação aconteceu e a tela mostrou `Erro: limparOVerbete is not defined`
  por cima do aviso a dizer «gravado». **CONFIRMADO** por A/B (a prova nova nomeia os três nomes
  órfãos no `bastidores.js` anterior; hoje, zero). A regra está na §5.32 do `ARQUITETURA-GERAL.md`:
  *o que vem depois da gravação não se reporta como se fosse a gravação*. No mesmo dia, o fecho dos
  derivados voltou a passar — a verificação 8 do `check-indices` reprovava o glossário do «Código de
  dança» por «sem tipo declarado», por causa do `_` que o `slugDe` põe nos nomes. Ver o `REGISTRO.md`.

- **18/11/2026** — **Uma prova que parecia morta estava viva: 26 de 30 passavam.** A
  `provar-passo-um-do-verbete` aparecia na §9 como vermelha, e a leitura fácil era «não serve
  ninguém». **CONFIRMADO**, contando as asserções uma a uma: **26 passavam e 4 falhavam**, e as 4
  eram a mesma coisa — o **bloqueio** de `vncategoria`/`vntradicao`, que a decisão de 10/11/2026
  («ajustes manuais») revogou de propósito. As outras 26 medem o que ninguém mais mede: a secção A
  é a única prova do repositório que verifica **o próprio script** (nenhum nome de topo declarado
  duas vezes, com contraprova do detector), e a E guarda as navegações da turma e da linha de base.
  **Não se apagou: corrigiram-se as 4.** A asserção que as substitui tem dentes — «uma correcção à
  mão não é reescrita pela sugestão do dicionário» —, e o controlo A/B reprova quando a condição do
  `sincronizarPasso1ComExercicio` sai. **CONFIRMADO**: `provar-passo-um-do-verbete` **29/29**.
  **E fica uma armadilha declarada:** esta prova imprime «26 de 30 asserções» para dizer quantas
  **passaram**, e a `provar-trecho-do-verbete` imprime «1 de 36 reprovaram» para dizer quantas
  **falharam**. A mesma expressão, dois sentidos — foi o que produziu o erro de leitura. Ver a
  entrada de 18/11/2026 no `REGISTRO.md`.

- **15/11/2026** — **As saídas do pacote deixaram de se carimbar.** Ela: «não tem sentido ficar
  carimbando toda hora». O diagnóstico **CONFIRMADO**: não era um carimbo lento, era um laço sem
  ponto fixo — o `SOURCE_DATE_EPOCH` vinha de `git log` sobre a **pasta** do ciclo, que contém as
  saídas que o gerador escreve, por isso gravar o `ciclos.json` movia a data que o reescrevia. A
  data passou a ser a de **início do ciclo** (do calendário), o `gerado_em` saiu do índice e o
  `estado` do `aulas[]` também — o juízo calcula-o quem tem um *agora*. A **proveniência não se
  mexeu**, e está medido: os quatro `.fipp` verificam-se com o mesmo hash, e o índice nunca esteve
  na cobertura. **CONFIRMADO**: `provar-saidas-estaveis` **13/13** e, o que faltava medir, a árvore
  fica limpa ao regerar os quatro pacotes **depois** do commit. Ver a entrada de 15/11/2026 no
  `REGISTRO.md`.

- **13/11/2026** — **A listagem não é a proveniência: uma linha por professor, dentro da cadeia.**
  Ela relatou que a correção de 12/11 (a autoria não se reescreve) deu certo e trouxe à tona o que
  já estava resolvido: as versões derivadas continuavam empilhadas por cima do plano vigente.
  **CONFIRMADO e medido** no acervo do `calango`: **18 planos numa só cadeia → 5 linhas** na turma
  `Piano` (o PO, **20 → 6**), e três delas **órfãs** — não escondidas por um sucessor (o sucessor é
  de outro autor, e a regra de 12/11 impede-o) e sem histórico próprio. **DECIDIDO por ela**: só o
  mais recente de **cada professor**, «dois planos mesmo, que é o do pé torto e o da redinha»; o
  resto é proveniência. E, na cadeia que mudou de nome de turma (`Rosa` → `Piano`), **duas linhas**,
  «só o mais recente de cada professor, na cadeia inteira». O grupo passa a ser **raiz da cadeia +
  professor** — a raiz, e não o nome da turma, que muda no meio. O que **não** mudou: o documento de
  quem escreveu continua à vista (é o mais recente daquele autor), e a proveniência continua
  acessível em «N versões anteriores». `provar-uma-linha-por-professor` **23**, com controlo
  negativo (a regra anterior dá 6). Sem regressão nas bancadas da autoria, das listas, da cadeia e
  do painel. Ver a entrada de 13/11/2026 no `REGISTRO.md`.

- **12/11/2026** — **O agente do Lastro: desenho completo, decisão fechada, e nenhuma linha de
  código.** Ela fechou a arquitetura (Llama da Cloudflare, MCP + busca estruturada, **sem RAG**) e
  pediu análise, plano e documentação. **CONFIRMADO que nada está implementado**: sem binding `ai`,
  sem `agente.js`, sem `mcp.js`, sem rota. **Entregue**: `ARQUITETURA-AGENTE.md` (**novo** — oito
  contratos de ferramenta em JSON Schema, prompt de sistema em oito blocos, tectos do laço, tipagem
  em três camadas, impacto no código, conflitos com a cadeia e com as pétreas, UI sem peça nova,
  ≈20,5 dias), a frente **L15** e uma camada 7 na sequência sugerida do `PLANEJAMENTO-LASTRO.md`, as
  notas datadas no **§L7**, na **regra 1 do §6** do mesmo documento e no **A3** do `FRENTES.md`, e a
  nota de obsolescência no cabeçalho de `motor/nucleo/ia.js` **sem tocar em código**. **Achados que
  não estavam no pedido**: o contador de subpedidos **não vê o KV**, e a Cloudflare conta KV como
  subpedido (dívida herdada do §5.26); o rebuild do índice custa **14 subpedidos** medidos contra
  **1 leitura de KV** com cache quente; **10.000 Neurons/dia são da conta**, ≈116 interações/dia; e
  o catálogo tem **76 perguntas** com **6** implementadas. `check-identidade` **8/8 ok**. Nenhum
  deploy. Ver as entradas de 12/11/2026 no `REGISTRO.md`.

- **10/11/2026** — **A decomposição segue a ordem em que foi escrita, e a duplicação é de uma
  linha.** Ela escreveu *frente, ao lado, atrás, ao lado* e viu a tabela reagrupada — **CONFIRMADO e
  medido**: `celulas` é um mapa com a direção por chave, e um mapa não guarda a ordem entre gavetas;
  a mesma iteração existia em `segmentosDe`, e por isso o documento publicado tinha a mesma ordem
  errada. **DECIDIDO**: a ordem passa a ser **declarada na célula** (`ordem`), escrita quando o
  trecho nasce, e **uma só leitura** — `ordemDasCelulas`, no motor, espelhada na página — serve a
  tabela, a prévia, os compassos e o documento. **O que já estava gravado não muda** (P-03/P-04): a
  célula sem `ordem` recebe a posição antiga, e o documento publica exactamente o de hoje; a
  correcção de um trecho não o move; e o trecho novo entra no fim (a próxima ordem é o maior valor
  **efectivo** mais um). O **«Duplicar o exercício» saiu** (reversão declarada): duplicava as seis
  linhas quando ela queria uma — o botão passou a ser o de **cada linha**, e a cópia vai para o
  **fim**, com ordem nova e no fim do balde. A validação passou a recusar uma `ordem` que não seja
  inteiro ≥ 1. `provar-ordem-e-duplicacao` **31/31** (novo, com controle negativo); sem regressão em
  `producao` 166, `musica-do-verbete` 33, `busca-do-exercicio` 68, `historico-do-ajuste` 39,
  `largura-da-lista` 56, `check-identidade` 0 erros. `provar-celula`, `provar-notacao` e
  `check-pacote` falham o mesmo que no `HEAD`. Ver a entrada de 10/11/2026 no `REGISTRO.md`.
- **10/11/2026** — **O passo 1 do Estilo procura no vocabulário, e um exercício que existe pode ser
  escolhido.** Ela contou o contorno a que foi obrigada: inventar um nome, uma categoria e a letra
  «T» no «o que acontece» para destrancar o passo 2 — e chamou-lhe **«burlar»**. **CONFIRMADO e
  medido** na bancada: `oQueFaltaNoPasso1` lia o nome escrito como «exercício novo» e fechava o
  passo 2 (o `disabled` com o título «Falta o que acontece…, a categoria, a tradição»), e
  `sincronizarPasso1ComExercicio` recusava preencher quando havia nome escrito — o campo que
  pergunta «que exercício é este» era o que trancava a porta. **DECIDIDO**: o campo procura (sem
  acentos, por prefixo e por semelhança, numa lista nossa e não num `<datalist>`); um nome que casa
  preenche os três campos, escolhe o exercício e mantém o passo 2 aberto; um nome inédito mantém os
  três abertos e obrigatórios; e o exercício existente **não volta a ser criado** (o «Seguir» não faz
  `POST`). **Reversão declarada, por ela**: a categoria e a tradição deixam de ficar **congeladas**
  sobre um exercício do dicionário — era essa a regra que impedia —, e o ajuste vale para o verbete;
  o termo não é reescrito (`reutilizar`). O rótulo do passo 1 passou de «O exercício novo» a «O
  exercício». `provar-busca-do-exercicio` **68/68** (novo, com contraprova em E e geometria em I);
  sem regressão em `producao` 166, `largura-da-lista` 56, `vao-do-botao` 50, `abas-da-audicao` 86,
  `historico-do-ajuste` 39, `celular` 15, `check-identidade` 0 erros. `provar-celula` falha no mesmo
  ponto do `HEAD`. Ver a entrada de 10/11/2026 no `REGISTRO.md`.
- **10/11/2026** — **O histórico do ajuste passa a dizer a mudança, e o porquê.** Ela perguntou,
  como quem opera a escola, para que servia o «versões anteriores» do cartão; a resposta honesta
  tinha duas metades. O bloco **existia por necessidade**, não por gosto: num registo vinculado a um
  plano de ensino, o «Editar» **deriva** (P-03/P-04), e a versão anterior tem de aparecer em alguma
  parte. **Mas não pagava o espaço:** o rótulo `2 versão(ões) anterior(es)` lê-se como defeito, eram
  duas fotografias para comparar de olho, a data saía em **dois formatos** (o bloco era uma cópia
  por lista) e o **motivo não estava no cartão** — só no log da cadeia. **DECIDIDO** por ela:
  manter nos dois sítios, com o rótulo em português corrente, a **diferença** calculada, a data em
  BR nos dois e o **motivo gravado no elo** (campo opcional ao lado da vigência). O bloco passou a
  ser **um só** (`historicoDoAjuste`) e a Turma fala **nomes, não slugs**. O defeito que a
  implementação tinha de evitar — o `Object.assign` da derivação a herdar a razão do ajuste
  anterior — está provado nos dois sentidos. Saiu também um `turmasSubstituidas` calculado e nunca
  lido. `provar-historico-do-ajuste` **39/39** (novo); sem regressão em `producao` 166,
  `largura-da-lista` 56, `mudanca-de-sala` 41, `cadeia-automatica` 60,
  `transferencia-e-desligamento` 93, `vao-do-botao` 50, `celular` 15, `check-identidade` 0 erros.
  Ver a entrada de 10/11/2026 no `REGISTRO.md`.
- **10/11/2026** — **A faixa de 1141 a 1919px deixa de ser território sem prova.** Ela mudou o
  monitor de 1920×1080 para 1366×768 e viu a listagem «acavalada» e as margens das etiquetas
  desaparecidas; no telemóvel funcionava. A hipótese dela (`px` em vez de `rem`, falta de `wrap`)
  foi verificada e **não** era a causa. **CONFIRMADO e medido** na bancada local: a `.secao` dava
  ao formulário os 544px inteiros — o tecto `minmax(0,34rem)` funcionava como **piso** — e ao nome
  da linha sobravam **163px a 1366** e **81px a 1141**, contra 338px a 768: entre 1141 e ~1500 a
  listagem estava **pior do que no telemóvel**. **DECIDIDO**: o formulário cede primeiro
  (`min(34rem,38%)`, piso `20rem`) e o nome ganha piso de `11rem`, com a **etiqueta das turmas** a
  ser quem encolhe com reticências (tem `title`, o nome não tem segunda fonte). **Nenhuma media
  query nova**, e a conversão `px`→`rem` **recusada** — `1rem` são 16px fixos; quem cede é a grade.
  A 1920 nada mudou (544px de formulário, 1115px de listagem, provado). `provar-largura-da-lista`
  **56/56** (novo, com controle negativo); sem regressão em `producao` 166, `celular` 15,
  `menu-da-producao` 55, `vao-do-botao` 50, `abas-da-audicao` 86, `check-identidade` 0 erros.
  Ver a entrada de 10/11/2026 no `REGISTRO.md` e a secção «A faixa que ninguém media» do
  `IDENTIDADE-VISUAL.md`.
- **09/11/2026** — **A mudança de sala entra na cadeia, e uma sala recebe uma Turma.** Ela perguntou
  o que faltava; o diagnóstico do §3.3 era verdadeiro. **CONFIRMADO e medido**: `turma-derivar`
  respondia 201 com **0 disparos**, o `.conf` não era recomposto, o plano **não era marcado**
  (`revalidacaoPendente` não recebia Salas) e continuava a declarar o ritmo antigo; o `comporConf`
  detetava os desacordos e a tela os descartava. **DECIDIDO** — por ela — fechar as quatro peças
  (gatilho, releitura do ritmo, marcação, conflitos na tela), manter a vigência como está, e
  acrescentar a guarda: **«somente poderá mover se existir ao menos uma outra sala vazia»** — que
  expôs um segundo defeito, medido: duas curadorias com a mesma Sala eram aceites. `provar-mudanca-
  de-sala` **41/41** (novo); sem regressão nas provas de `producao` 166, `cadeia-automatica` 60,
  `transferencia-e-desligamento` 93, `linha-de-base` 102, `abas-da-audicao` 86,
  `enquadramento-da-turma` 57 e `conteudos-e-estado-da-turma` 77/78; `provar-derivacao-da-turma`
  118/138, com as **mesmas 20 falhas** do `HEAD` (medidas num worktree à parte); `check-identidade`
  0 erros e `check-pacote` 0 erros. Ver a entrada de 09/11/2026 no `REGISTRO.md` e o §3.3.
- **09/11/2026** — **A cadeia automática: a troca e a saída deixam de ser «via crucis».** Pedido
  dela: eliminar o processo manual passo a passo na troca de aluna, na saída/abandono e na troca de
  professor ou modalidade, mantendo a possibilidade de derivar o plano à mão. **CONFIRMADO no
  código**: os três gestos deixavam a travessia aberta (`proximo: «reveja a TURMA, depois o plano…»`),
  e a `revalidacaoPendente` apenas marcava. **DECIDIDO** — e é **reversão declarada** da regra «não
  por um botão que dispara tudo»: a travessia passa a ser automática, com quatro etapas na ordem da
  dependência (`vínculos → plano-de-ensino → plano-de-observacao → pacote`), estados derivados
  (`feita`/`pendente`/`bloqueada`), **porta do fluxo completo** (sem plano e sem PO só os vínculos se
  fazem, e o que falta vem com o link), **paragem na primeira etapa que não fecha**, **elo novo** em
  cada derivação (`ajuste_de`), idempotência, um orçamento de subpedidos só por pedido, e log em
  `bastidores/<escola>/cadeia` (`GET /api/bastidores/cadeia`). `provar-cadeia-automatica` **60/60**;
  sem regressão em `provar-producao` 166, `provar-cadeia-do-ajuste` 34,
  `provar-transferencia-e-desligamento` 93, `provar-linha-de-base` 102,
  `provar-linha-de-base-no-repo` 39, `provar-elenco-na-turma` 25, `provar-abas-da-audicao` 86 e
  `provar-derivacao-da-turma` 112/132 (as mesmas 20 falhas anteriores); `check-identidade` 0 erros.
  Ver a entrada de 09/11/2026 no `REGISTRO.md` e o §4 do `ARQUITETURA-GERAL.md`.
- **09/11/2026** — **O filete pontilhado da listagem de elencos.** Ela pediu o tracejado inferior
  que Estilo, Salas, Professores e Alunos têm, e a equiparação com a «Exercícios com verbete».
  **CONFIRMADO no código e medido na bancada local**: a linha de `.lista` computava
  `1px dotted var(--borda-campo)` e a de `.lb-cartoes` computava `0px none` — havia um
  `'.lb-cartoes>li{padding:0;border-bottom:0;}'` de «reset» no bloco de estilo da página, a mesma
  família de regra que a véspera apagou o respiro dos cartões. **DECIDIDO**: o `li` da listagem
  passa a vestir o **mesmo** fio e o **mesmo** respiro de `.lista li` (`.35rem .1rem`), sem peça,
  classe ou cor novas; o `.trio-plano` e o `margin-bottom` de `.6rem` não mudam. A prova compara as
  duas arestas por **igualdade** em 1280 e 320px, com dois A/B (o `margin:0` leva o vão a zero; o
  `border-bottom:0` apaga o filete). `provar-abas-da-audicao` **86/86** (80 → 86); sem regressão em
  `provar-producao` 166, `provar-linha-de-base` 102, `provar-elenco-na-turma` 25,
  `provar-aluna-nova-no-elenco` 34, `provar-remocao-do-elenco` 26,
  `provar-transferencia-e-desligamento` 93, `provar-linha-de-base-no-repo` 39;
  `check-identidade` **0 erros**. Ver a entrada de 09/11/2026 no `REGISTRO.md`.
- **09/11/2026** — **O «Cancelar» direto, e a derivação que troca o par professor × modalidade.**
  **CONFIRMADO no código**: o «Cancelar» do elenco chamava `confirm()` antes de descartar, e o da
  Turma não — o mesmo gesto de recuo pedia duas confirmações diferentes. Passa a **«Cancelar»**, sem
  pergunta; o descarte no servidor (`/linha-de-base/descartar`) e o acto ficam como estavam. Na
  **derivação de turma**, o professor e a modalidade eram `disabled` nos dois modos; passam a
  **editáveis no «Derivar»** (continuam travados no «Editar», que substitui o registo no lugar), e a
  rota `curadoria-derivar` lê o par do corpo, guarda o professor como slug, confere a habilitação, a
  aluna repetida na modalidade **final** e a unicidade do trio, e compõe o id do derivado a partir do
  par final. O professor novo também não pode estar desligado. `provar-abas-da-audicao` **81/81**;
  `provar-derivacao-da-turma` **112/132** — as três asserções novas passam, e as 20 falhas restantes
  são anteriores à mudança e iguais no `HEAD`. `check-identidade` 0 erros. Ver a entrada de
  09/11/2026 no `REGISTRO.md`.
- **09/11/2026** — **A transferência que se perdia no rascunho.** Ela transferiu uma aluna de «tami»
  para «ami» e o estado ficou errado. **CONFIRMADO no código e na produção**: `elenco-mover`
  gravava as duas versões no repositório e **não tocava no rascunho do KV** — e é o rascunho que a
  `linhasDeBase` põe por cima do acto na listagem. Resultado: contagem errada nos dois elencos, e o
  «Concluir elenco» seguinte a gravar o rascunho velho como acto novo, **desfazendo** a
  transferência. O amplificador era o carimbo: o minuto é o nome do ficheiro, e dois actos no mesmo
  minuto **sobrescreviam-se** (o `escrever` lê o `sha` e regrava). Medido no estado guardado:
  `GET /api/bastidores/linhas-de-base` da `calango` devolve `ami` com `emEdicao: true` e 1 aluna,
  sobre um acto de 2. **DECIDIDO**: o rascunho acompanha o acto (`ajustarRascunho` — move a aluna
  na lista que o rascunho já tem, preserva o resto e derruba a `leitura`); o carimbo ganha sufixo
  quando o nome existe (`carimboLivre`, perguntado ao repositório); repetir uma transferência já
  feita responde `ok`/`jaEstava` e acerta só o rascunho; e o formulário aberto **relê** o elenco
  depois do acto (senão o «Seguir» gravava o elenco velho por cima). Entra o **«Cancelar a edição»**
  — botão que existia na marcação e nunca aparecia —, com a rota `POST
  /linha-de-base/descartar`: tira o rascunho do KV e **deixa o acto de pé** (não é o `DELETE`, que
  gravaria lápide). `provar-transferencia-e-desligamento` **93/93** e `provar-abas-da-audicao`
  **80/80**; sem regressão em `provar-producao` 166, `provar-linha-de-base` 102,
  `provar-linha-de-base-no-repo` 39, `provar-elenco-na-turma` 25, `provar-aluna-nova-no-elenco` 34,
  `provar-remocao-do-elenco` 26 e `check-identidade` 0 erros. **Fica um clique**: o rascunho
  atrasado da `calango` (`ami`) corrige-se em Editar → «Cancelar a edição». Ver a decisão 128.
- **09/11/2026** — **A Audição, segunda passagem: o respiro, o formulário limpo e a ordem do acto.**
  Depois de usar as três abas, ela pediu cinco ajustes. **CONFIRMADO**: (1) os cartões do elenco
  estavam encostados porque `.lb-cartoes>li{margin:0}` (0,1,1) vencia `.trio-plano{margin-bottom}`
  (0,1,0) na folha — a regra de «reset» da página apagava o respiro da peça; sai, e o vão medido
  passa a ser o da anamnese (9,6px a 1280 e a 320px, com A/B que reinjecta o `margin:0` e o vê
  cair a zero). (2) O «Concluir elenco» deixava o `#lb-modo` com o id do elenco: a gravação
  seguinte caía no MESMO elenco — agora `limparForm()` corre no sucesso, e o professor **não** é
  limpo (é quem está a trabalhar). (3) O «O que já é bom» ganha a dobra que ela pediu; com os
  quatro a dobrarem, o parâmetro `dobrar` saiu. (4) A aba 3 lê `d.elencos` em cada
  `carregarLinhas` e repinta-se — um elenco concluído na aba 1 aparece sem F5, e a escolha em
  curso sobrevive. (5) A ordem é a do acto: origem → alunas **dela** (antes era a escola inteira,
  e dava para escolher quem não estava no elenco) → destino (sem a origem e sem os elencos que já
  a têm, os dois casos que o núcleo recusa) → motivo; e o `mv-para` ganhou um `change` próprio,
  porque o estado do botão depende dos três e escolher o destino deixava o «Mover» apagado.
  `provar-abas-da-audicao` **67/67** (39 + 28); sem regressão: `provar-producao` 166,
  `provar-transferencia-e-desligamento` 62, `provar-linha-de-base` 102, `provar-elenco-na-turma`
  25, `check-identidade` **0 erros**. Ver a decisão 127.
- **09/11/2026** — **A Audição em três abas, e a transferência que não se oferece a si mesma.** Ela
  olhou a secção do corpo e pediu quatro ajustes: três abas, com a listagem sempre à vista e a
  solução do telemóvel «similar à que existe para a anamnese»; o passo 3 renomeado («leitura lida»
  não dizia de que era a leitura); expandir/colapsar em três dos quatro blocos de achados; e o
  destino da transferência **sem** o elenco de origem. **DECIDIDO** — por ela — que as abas são
  «Escolha de elenco», «Recorte» (o índice dos recortes da escola; nasceu como «O que os recortes
  olham» e foi corrigido no mesmo dia — ver a nota de correção no `REGISTRO.md`) e «Transferência»;
  que a faixa dos quatro passos só existe na aba 1; e que os blocos dobram **abertos**, porque o
  passo existe para ser lido. **Entregue**: a tira `role="tablist"` com teclado, a folha do
  telemóvel com as peças do «Ações» (nenhuma classe nova), a listagem e a faixa fora dos painéis, o
  `pintarDestinos` que reescreve o destino quando a origem muda, a guarda do `submit` (além da do
  núcleo), `[3, 'Anamneses']` com o estado «lidas», e `blocoDeAchados(dobrar)` — trabalho,
  musicalidade e o comum, com o «O que já é bom» intacto. Fica **sinalizado**, a pedido dela, no
  `REGISTRO.md`: o bloco de transferência (08/11/2026) foi além do pedido, implementado pelo agente
  do VS Code sem solicitação. `provar-abas-da-audicao` **41/41** (nova); sem regressão em
  `provar-producao` 166, `provar-transferencia-e-desligamento` 62, `provar-linha-de-base` 102 e
  `provar-elenco-na-turma` 25; `check-identidade` **0 erros**. Ver a decisão 126.
- **08/11/2026** — **A aluna desligada, e a turma que muda de sala.** Ela seguiu o fluxo de remover
  uma aluna do elenco na produção e leu o defeito: a anamnese dizia **«vinculada»** (o documento,
  travado por um PO) e, na mesma linha, **«aluna nova — sem turma e sem linha de base»** (a pessoa) —
  e a lista de pessoas dizia **«livre»**, com o «Excluir» à vista. **CONFIRMADO no código**, e as
  duas leituras estavam certas sobre perguntas diferentes: o selo respondia ao **presente**, e o
  presente de quem saiu é vazio. **DECIDIDO** — por ela — o nome **`desligada`** («indica que ela
  não é nova, que ela não está vinculada, mas dá a entender que ela já fez parte de algum elenco»), e
  o **mesmo pensamento para o professor**: `desligada`/`desligado` partilham o vocabulário e a
  classe `legado`, mas **não o mecanismo** — o professor sai por **ato** (data e motivo, marcado), a
  aluna sai por **efeito** de uma versão nova do elenco (derivado, cai sozinho no regresso).
  **Entregue**: `desligamento.estadoDaAluna` com os três rastos (PO · Turma substituída ·
  transferência), o selo e a linha da anamnese, o selo da lista de pessoas e a leitura do rasto do PO
  (`alunasDosPlanosDeObservacao`). A **mudança de sala** ficou documentada e avaliada no §3.3:
  atende ao registo, **não** atende à cadeia (a cascata não vê a Sala; a vigência declarada não é
  respeitada). **A mesma sorte para o professor**: o selo dele passa a ler `sem turma` quando a
  turma foi para outro, e `professorCurado` deixa de contar as curadorias substituídas — o defeito
  era o mesmo, e lia-se do outro lado da lista. `provar-etiqueta-da-aluna` **44/44** (36 da aluna +
  8 do professor); sem regressão nas bancadas da anamnese, do elenco, do desligamento, do
  enquadramento e da habilitação; `check-identidade` **0 erros**. Ver a decisão 125 e o §3.3.
- **08/11/2026** — **As duas portas do fluxo da escola: a aluna que muda de elenco, e o professor que
  sai.** Ela pediu o fluxo que faltava ao §3.3. **CONFIRMADO no código**, e eram dois buracos
  silenciosos: mudar uma aluna de elenco eram **dois atos**, e a metade feita deixava-a **fora de
  todos os elencos**; e **um professor que deu aula nunca podia sair da escola** (o `DELETE` exige
  curadoria removível, e a curadoria com plano não se apaga). **DECIDIDO** — por ela — que a
  **Turma não pára** (a direção decide remanejar, dar recreativa/ensaio ou nomear outro professor
  habilitado, e a substituição é fluxo futuro da Direção), e que o **dono não se desliga** (é a
  âncora; sucessão formal não existe). **Entregue**: `elenco-mover` (duas versões num ato, o destino
  primeiro, `transferida`/`recebida`), `professor-desligar` (registo marcado, curadorias
  **encerradas** com data, turmas `descontinuada` com motivo), o enquadramento a distinguir a
  direção encerrada da vigente, o desligado fora das listas de escolha, o recadastro do mesmo
  identificador a **reactivar**, e os dois blocos na Produção. `provar-transferencia-e-desligamento`
  **62/62** (o núcleo e as rotas, no entrypoint verdadeiro). Sem regressão nas sete bancadas do
  elenco, do professor e do enquadramento; `check-identidade` 0 erros. Ver a decisão 124 e o §3.3.
- **08/11/2026** — **A rotina da escola passa a estar num só desenho, com as duas portas do elenco.**
  Ela descreveu o fluxo — escola + sala + estilo → alunas (anamneses) → audição (elenco) → turma →
  plano de ensino → plano de observação → formulário da aula dada — e pediu-o documentado como
  **retrato do sistema atual**, com as correções onde a descrição divergisse. **CONFIRMADO** no
  código: o fluxo existe, mas em pedaços (§2.4, §5.9, §5.10, §5.18–5.25), e **cinco** pontos da
  descrição divergem — a pessoa só se apaga **depois** da Turma (409 antes disso); quem sai do elenco
  **continua vinculada** pelo `sujeitos` do PO; não há «atualizar a anamnese da turma» (é por aluna e
  datada); «regerar a turma» é a **Turma**, não a Sala; e a **Sala precede** a Turma. **DECIDIDO** o
  §3.3 novo do `ARQUITETURA-GERAL.md` — diagrama (Mermaid + ASCII), tabela de nomes, tabela do que
  cada passo grava, as duas portas, a fronteira automático × olhar do professor, o **piso** que o
  sistema exige e o **teto** que ele não verifica, e a tabela das divergências. Documentação apenas —
  sem código, sem schema, sem reancoragem. Ver a decisão 123 e o §3.3.
- **08/11/2026** — **O «Guardar» cabe nos 50 subpedidos, e a cadeia deixa de se atropelar.** Ela
  percorreu a cadeia depressa e o «Guardar» do PO respondeu «Too many subrequests by single Worker
  invocation»: o envelope e o `-po.md` entraram, as fontes do ciclo não, e o pacote ficou com dois
  POs a discordar. **Medido**: 26 subpedidos só no escritor (7 eram um blob por arquivo, 3 eram uma
  consulta por nome de elo). **DECIDIDO**: o custo desce a **16** (conteúdo na árvore; a pasta
  responde pelas colisões); o orçamento passa a ser **um por pedido e contado**; **não cabe, não se
  começa** (a rota consulta a previsão antes do `-po.md`); e a porta ganha o **véu da operação** que
  cobre, tranca e diz o passo até a geração terminar. No CI, o pacote do ciclo passa a ser derivado
  para o `gerar-ciclo.yml` — conflito nos PDFs resolve-se regerando. `provar-orcamento-do-guardar`
  **16** (8 no `HEAD`) e `provar-trava-da-operacao` **19** num Chrome (2 no `HEAD`). Ver a decisão
  122 e o §5.26 do `ARQUITETURA-GERAL.md`.
- **08/11/2026** — **A aluna que sai do elenco sai da aula, e o que ela já lançou não se perde.** Ela
  pôs o caso do mundo real antes de testar com a Aluna C: remover do elenco, rever plano e PO, deixar
  de a oferecer no formulário, e **nada do passado se perder**. A cascata (`elenco → plano → PO`)
  **já existia**; o que não existia era a integridade do derivado — `derivarDados` escrevia
  `aulas: {}` em toda a geração, e a geração é disparada pelo «Guardar» do PO, o gesto que a cascata
  exige: remover e regravar **apagava as aulas lançadas**. E o formulário oferecia o mapa de **nomes**
  como lista de quem marcar, o que também faria os relatórios antigos imprimirem `aluna_a`.
  **DECIDIDO**: `elenco` (quem se oferece hoje), `apelidos` (hoje **mais** quem já foi lançada) e
  `aulas` **preservadas** — a fonte e a cópia cifrada saem do mesmo texto; numa aula lançada a lista é
  a **daquela** aula. `provar-remocao-do-elenco` **26/26**, contraprova a reprovar **10** no `HEAD`;
  `provar-estante-do-po` passou a afirmar a **regra** em vez da contagem (**30/30**). Fica registado
  um achado **pré-existente e por resolver**: o pacote `ciclo-01-batata-sala-rosa` **mistura dois
  POs** (`-po.md` de `po-…-0956`, `-dados.json` de `po-…-2211`) porque a escrita das fontes no
  «Guardar» do PO não apareceu — só o `-po.md` foi commitado. Re-derivar a fonte destrava o
  `check-pacote`, mas a **cópia cifrada** só quem tem a chave da escola a produz, e deixá-la velha
  seria fabricar um derivado: o pacote ficou como estava. Ver a decisão 121 e o §5.25 do
  `ARQUITETURA-GERAL.md`.
- **08/11/2026** — **A aluna que entra no elenco deixa de ficar «livre».** Ela relatou que a Aluna B
  «já está sendo observada e a etiqueta ainda está como livre», com «editar» e «apagar» a funcionar.
  **CONFIRMADO** com os envelopes reais: o `po-…-2211` (22:11 de 07/11) declara `[Aluna A]`, a linha
  de base `tami` (01:05 de 08/11) tem as duas, e o documento derivado — `## Sujeitos` e §6 da Aula —
  já as lista; a anamnese da Aluna B respondia `200` ao `PUT` e ao `DELETE`. **DECIDIDO** que o
  vínculo lê o **elenco da turma que o PO observa** (a linha de base manda; o `sujeitos` é a
  herança), somando as duas fontes, e que a mesma leitura decide **substituir vs empilhar** na
  gravação — o «Guardar» de uma anamnese nova da Aluna B **sobrescrevia** o registo dela. Sem leitor
  de linha de base a derivação degrada para o `sujeitos`. `provar-vinculo-do-elenco` **26/26**, com
  a contraprova a reprovar **15** no `HEAD`; e a regressão das catorze bancadas da anamnese, do
  acervo e do ciclo ficou igual. Ver a decisão 120 e o §5.24 do `ARQUITETURA-GERAL.md`.

- **07/11/2026** — **A escola nova nasce num namespace que já tem história — e agora isso vê-se.**
  Ela perguntou: «você tem certeza que o expurgo está limpando o KV?». **CONFIRMADO que limpa** — a
  verificação é **por leitura**, e sete dos oito elos da `batata` dizem `restantes: 0`. **Mas há uma
  excepção datada:** o elo de **19/10/2026 18:02**, o único **sem metade do KV** (a cota do `kv.list`
  esgotada a meio, o caso que o `raiz.js` documenta). **E a premissa tinha um furo:** a `batata` não
  foi expurgada hoje — foi **criada de novo às 22:25 UTC** (`a2a0e571`, Worker às 22:24:47), 125,5
  horas depois do último expurgo (02/11 16:53); o resíduo era da encarnação de hoje. **PENDENTE e
  declarado:** *quem* escreveu aquela chave não se apura — o KV não guarda autor nem data. **DECIDIDO**
  que a criação de escola passa a **conferir o KV**, e que a conferência **avisa, não apaga e não
  trava**: criar pode ser recriar por cima de uma escola viva, e um aviso que aborta aprende-se a
  contornar. E sobretudo: **«não conferi» nunca sai como «está limpo»** — sem token ou com a listagem
  recusada, diz que não conferiu. `provar-kv-da-escola-criada` **22/22**, com dois A/B que desligam
  um ramo cada (o do token e o da listagem recusada — este é o cenário de 19/10 transformado em «está
  limpo»).

- **07/11/2026** — **O plano de ensino oferecia quatro exercícios onde a escola declarou dois.** No
  §9 «Parâmetro de medição» da `batata`, a lista trazia `Battement tendu` e `Battement fondu` além
  dos dois declarados. **CONFIRMADO**, lendo o KV e não supondo: o mapa antigo
  `turma-conteudos` = `{sala-rosa: [battement-fondu, battement-tendu, plie]}` era **somado** ao
  `repertorio` da curadoria (`[Battement jeté, Plié]`) — a composição decidida a 03/11/2026, com a
  razão boa de não perder o que se associou em Outubro, e com o custo de a lista poder ser maior do
  que a declaração. Os três ids antigos eram resíduo de uma rodada de testes anterior: não vinham
  de outra escola, nem de um índice mal aplicado. **DECIDIDO** que a curadoria **vigente** diz o
  que a turma aprende — mesmo que declare pouco, e mesmo que declare nada — e que o mapa antigo é
  memória: continua a ser a fonte das turmas **sem** curadoria (escolas de Outubro, sem migração),
  continua a ser devolvido em `doLegado`, e **nada é reescrito** no KV. A regra de 03/11 sobre as
  curadorias substituídas fica de pé. `provar-escopo-do-plano` **25/25** em três camadas (núcleo ·
  rota · a PÁGINA num Chrome, a resolver `aula-1-parametro` pelo próprio código e a desenhar a
  tabela), com o A/B a devolver as quatro linhas que ela viu; e as contraprovas: sem curadoria o
  antigo volta, a declaração vazia não o ressuscita. **O resíduo foi APAGADO do KV a pedido dela**
  (07/11/2026, 21:10): `bastidores/batata/turma-conteudos` =
  `{"sala-rosa":["battement-fondu","battement-tendu","plie"]}` deixou de existir — o namespace
  ficou com 5 chaves, a chave responde 404, e a rota ao ar devolveu o mesmo antes e depois
  (`{"sala-rosa":["battement-jete","plie"]}`), porque quem manda é a declaração. O valor
  apagado fica transcrito no `REGISTRO.md`: é o único sítio onde sobrevive.

- **07/11/2026** — **O «Seguir» do verbete não andava porque havia três `irParaPasso`.** Ela
  relatou duas coisas na mesma tela: caixas bloqueadas **vazias** («a definição do dicionário para
  «Battement jeté»…») e um «Seguir» habilitado que **não fazia nada**. **CONFIRMADO** que são dois
  defeitos independentes. (a) A página dos Bastidores é **uma folha de `function`**, e turma,
  verbete e linha de base declaravam **o mesmo nome** `irParaPasso` — em JavaScript a última vence,
  e desde 05/11 (`449dc3dc`) o «Seguir» do verbete e o «Avançar» da turma chamavam a navegação da
  **linha de base**: `Number("turma") || 1` dava 1, e o painel que mudava era o do PO. O mesmo com
  `podeIrPara` (2 declarações). (b) Os três campos do passo 1 são preenchidos a partir de
  `VERBETES.exerciciosDoVocabulario` — a fotografia do vocabulário no carregamento —, e um termo
  criado ou encontrado depois disso **não está lá**: a tela acrescentava o `<option>` e mais nada.
  (c) A frase era o único obrigatório que não repintava a navegação, e escrevê-la por último deixava
  o «Seguir» apagado. **DECIDIDO:** um nome, uma superfície (`irParaPassoTurma`,
  `irParaPassoVerbete`, `irParaPassoLb`; `podeIrParaVerbete`, `podeIrParaLb`); a rota do termo
  devolve o **registo** (`dados`) e o cliente inscreve-o no dicionário da página; o `input` da
  frase repinta a navegação. **E o que congela mudou de tamanho:** a 02/11 os três campos ficaram
  congelados, e a 07/11 ela corrigiu — a definição oficial é **referência bloqueada**
  (`#vb-oficial`) e a **frase é do professor**, editável; categoria e tradição continuam
  bloqueadas. Prova nova `provar-passo-um-do-verbete` **30/30**, a primeira que mede **o próprio
  script** (nenhum nome de topo repetido, com contraprova do detector), com dois A/B cirúrgicos
  (23/30 e 15/30). **PENDENTE:** a edição do termo não tem ecrã (a rota `PUT` existe e nada a
  chama), e `provar-celula` continua vermelho por um defeito próprio na secção 2.

- **07/11/2026** — **O termo que já existe é aproveitado, e não recusado.** Na `batata`, o passo 1
  do exercício respondeu `409 «Battement jeté» já está no vocabulário desta escola` e a tela ficou
  no passo 1 — sobre um termo que **ela própria** tinha criado horas antes (`08a088e1`).
  **CONFIRMADO** que a rota tratava a colisão como erro porque nasceu para *acrescentar*, e que o
  cliente, em `!d.ok`, escrevia o erro e **retornava sem chamar `depois`** — era a rota que mandava
  a tela travar. O passo 1 não pede um termo *novo*: pede **qual** é o exercício, e um formulário
  que nomeia uma coisa que pode já existir não colidiu — encontrou-a. **DECIDIDO** que a recusa
  continua a ser o padrão do repositório: `criarTermo` ganhou `reutilizar`, e só com ele a `true` a
  colisão no mesmo dono devolve `{ok:true, status:200, jaExistia:true, termo, commit:null}`; sem a
  opção o mesmo par continua a dar **409**. A rota pede o reuso e responde **201** quando criou e
  **200 + `jaExistia`** quando encontrou; a tela di-lo e o fluxo avança. **A definição guardada não
  é reescrita (P-03)** — o termo é fonte partilhada por todas as turmas da escola — e a tela avisa
  que o caminho para a mudar é editar o termo. `provar-verbete` com **13** asserções novas, secção
  **G** a correr a **rota** (e não a função, senão a prova passaria com a rota a pedir 409 — que era
  o caso antes de hoje), e o **A/B** a devolver a mensagem exacta que ela viu. **PENDENTE:** o
  vocabulário tem agora **dois** `battement-jete` (catálogo + `batata`), legal pela regra
  `(dono, id)` mas conteúdo duplicado — a faxina é decisão dela.

- **07/11/2026** — **A âncora de uma aula não tem manifesto próprio — e a auditoria exigia um, o
  que recusou o expurgo da `breu`.** A página respondeu «a proveniência não está em ordem — nada foi
  apagado», com um bloqueio só: `[ancora-orfa] …-aula-01.fipp não tem o manifesto
  …-aula-01.conf`. **CONFIRMADO que a cadeia estava íntegra** e que o defeito era da verificação 6,
  nascida nesta sessão: ela exigia `base + '.conf'` de toda a âncora, e para uma âncora de AULA o
  manifesto é o da **variante** (`…-sala-rosa.conf`) — a âncora da aula é aditiva a ele. Medido
  antes de mexer: `hash-ciclo --check` das duas variantes **íntegro**, coberturas todas a existir,
  `gerar-indices --check` 5 em dia, `check-indices` 16/0. A instrução da tela («reancorar e regerar
  os índices») era **impossível de cumprir**: reancorar não muda o nome que a regra procurava.
  Corrigido — a âncora de aula procura o manifesto da variante —, e a regra **não foi aliviada**:
  tirado o manifesto da variante, as duas âncoras reprovam por `ancora-orfa`.
  `provar-proveniencia-do-expurgo` **25/25** (eram 21), com A/B a reproduzir a mensagem exacta que
  ela viu; e a auditoria sobre a **árvore real do GitHub**, pela função que a página usa, devolve
  `ok: true`. O expurgo em si fica com ela.

- **07/11/2026** — **O elenco é fonte do ciclo, e concluí-lo passa a terminar na geração.** Ela
  refez o fluxo inteiro e o lançamento da aula continuou a oferecer só a **Aluna A**. **CONFIRMADO**
  que a correção anterior estava certa e **incompleta**: o ato do elenco tem as duas
  (`tami--20261107-2150.json`), a derivação sobre o envelope real devolve `{aluna_a, aluna_b}`, e o
  `-dados.json` FONTE tem as duas desde as 18:47. O que estava para trás era o **PACOTE** — última
  geração às **18:23**, e é a cópia do pacote que o lançamento lê
  (`publicacao/<escola>/<variante>/…-dados.json`). A causa estrutural: concluir o elenco gravava o
  ato **e parava**; quem mandava gerar era o «Guardar» do PO, e neste ciclo esse disparo não partiu
  (nenhuma execução entre 18:47 e 21:54). Agora `gerarOsCiclosDoElenco` acha as **Turmas que
  escolheram o elenco**, resolve o ciclo pelo índice dos planos, e dispara a geração pela **mesma**
  peça da ponte (`criarDisparador`) — «o ato termina na geração», a frase que o `cloudflare.js` já
  tinha para o resgate do lançamento. A falha do disparo **não desfaz o ato**; os três silêncios
  (sem Turma, sem plano, sem token) são ditos, e a mensagem da tela distingue **partiu / não
  partiu / não havia o que gerar**. `provar-aluna-nova-no-elenco` **34/34** (eram 23), com A/B.
  **O estado dela foi corrigido:** disparei a geração à mão (HTTP 204), ela correu verde às 21:54Z e
  o pacote passou a ter as duas (`{aluna_a, aluna_b}`, e o `po-01.json` publicado com
  `subjects: [Aluna A, Aluna B]`).

- **07/11/2026** — **A declaração da captura entra no índice, e o workflow deixa de travar.** O
  `Regerar os índices` estava **vermelho** em `362e8621` — o passo «Conferir o índice novo»
  reprovava e o commit do índice era saltado. A causa era a verificação 8 do `check-indices`:
  `…-breu-sala-rosa-captura-declaracao.json: sem tipo declarado`. O documento nasceu a 07/11/2026 e
  nem o `tipos.json` nem o motor o conheciam (`-captura.json$` não casa um nome com `-declaracao`
  no meio) — o mesmo defeito dos derivados do PO a 20/10/2026. **CONFIRMADO**: passa a haver o tipo
  `declaracao` (família `registro`, `publico: false`), o motor classifica-o **antes** da captura
  (a ordem é «o primeiro que casar vence»), e o índice foi regerado. `check-indices` passa de **1
  falha a 16 verificações / 0 falhas**; `provar-indices` de **5 para 4** falhas de 60 e
  `provar-declaracoes-do-indice` de **2 para 1** de 23 — medido com `git stash`, e as que ficam são
  as de antes.

- **07/11/2026** — **A aluna que entra num elenco existente chega à cadeia inteira — e a causa era
  um ato que deixou de ser escrito.** O professor editava o elenco, punha a aluna B, concluía,
  regravava a Turma e revia os planos — e «o vínculo da aluna B some». **CONFIRMADO**: a saída do
  passo 5 (07/11/2026, horas antes) levou consigo a **única** escrita do elenco no repositório, e o
  «Concluir elenco» passou a gravar só o rascunho no KV. O leitor da porta
  (`cloudflare.lerLinhasDeBaseDoEnv`) só aceitava do KV o registo com `turma` — a marca do regime
  antigo —, e por isso o elenco existia na **Produção** e **não existia para a porta**, que é quem
  alimenta o PO, o plano de ensino, a Aula 01 e a geração. Medido em bancada com o fluxo inteiro:
  «a PRODUÇÃO vê o elenco / a PORTA não → `[]`». Quatro correções: **concluir volta a escrever um
  acto** (carimbo, versão no repositório, rascunho fora do KV no mesmo passo); **o leitor reconhece
  o acto pela marca** (`carimbo`/`concluida_em`/`turma`) e não pelo regime; **um elenco escolhido
  por uma Turma é um facto** (a migração sem migração — os elencos da janela passam a ser lidos sem
  ter de ser reconcluídos); e a **filiação aprende a relação Turma → Elenco**, que é o que faz a
  aluna nova aparecer com a sala **antes** de a Turma ser regravada. Nada disto mudou o que a Turma
  declara. `provar-aluna-nova-no-elenco` **23/23**, com **quatro A/B** (4, 1, 5 e 1 falhas ao
  desligar cada regra). Fica por conferir ao ar: é do próximo deploy.

- **07/11/2026** — **O elenco recém-criado chega à Turma sem F5.** O professor concluía a Audição,
  ia à Turma escolher o elenco, e o que acabara de criar **não estava no `<select>`** — era preciso
  recarregar a página. A causa não era o dado (a rota já o devolvia): era a **lista estar fechada no
  instante em que a página nasceu**, e em **dois** sítios — as `<option>` escritas pelo servidor e o
  `ELENCOS` que a nota do elenco consulta. Atualizar um só deixaria a nota a mentir sobre um elenco
  que já se podia escolher. **CONFIRMADO** a 07/11/2026: a regra que decide o que é um elenco e como
  se rotula passou a ser **uma só** (`elencosParaATurma`, no servidor, exportada), usada pelo
  `paginaProducao` **e** devolvida pronta na rota `…/linhas-de-base`; o cliente repinta o `<select>`
  de dentro do `carregarLinhas()` — por onde passa **toda** a gravação do elenco (criar, editar,
  concluir, apagar, ler as anamneses) —, com a **escolha em curso preservada** e o elenco **apagado
  a sair** da lista e da nota. O cliente **não** ganhou uma segunda cópia da regra: se ganhasse,
  as duas divergiriam ao primeiro campo novo. `provar-elenco-na-turma` **25/25** em jsdom, com o
  **A/B** medido: desligada a repintura, a prova cai para 17 de 25 — a primeira asserção volta a ver
  «— nenhum elenco —», que é o defeito a correr. Fica por conferir ao ar: é do próximo deploy.

- **07/11/2026** — **A escola `breu` foi expurgada, e o expurgo deixou cinco ficheiros dela para
  trás — o buraco está fechado.** O expurgo da página correu certo: 22 ficheiros, 5 chaves de KV
  apagadas (0 restantes), as duas âncoras registadas **com os hashes antes de desaparecerem**, a
  escola marcada `expurgada: true` / `habilitada: false` no índice que sobrevive (a memória de que
  existiu), `breu.<conta>.workers.dev` a responder **404** e a raiz `danca` a **401** (viva, atrás
  da senha). Sobraram **cinco** ficheiros em `professores/coqui-de-redinha/ciclos/historico/` —
  quatro `-dados.antes-de-po-*.json` com o mapa de apelidos das alunas e uma `-aula-01.md` —, porque
  tanto a página como o CLI varriam só o primeiro nível de `ciclos/`. **CONFIRMADO** a 07/11/2026:
  `ehArquivoDaEscola` passou a aceitar `historico/` e o `escolaDosCaminhos` também (sem a segunda, a
  primeira não bastava), o `escola/expurgar.js` varre a pasta pelo prefixo, e os cinco saíram. A
  auditoria de proveniência **não** mudou: `artefatosDaEscola` tem regex própria e continua a ver só
  fontes e âncoras — o elo não entra na âncora. `provar-acervo-envelopes` **52/52** (com quatro
  asserções novas e três contraprovas). Também saiu a `publicacao/breu/` local (956 KB, `gitignore`,
  dado da escola em disco); **o expurgo não a limpa**, e fica registado como lacuna.

- **07/11/2026** — **A `provar-identidade-da-escola-recriada` estava vermelha sobre um elo
  correto.** Ela exigia `professores_anteriores` (a lista acumulada) no elo real da `calango`, que
  tem `professor_anterior` (o professor do topo) — o registrador grava as duas coisas em casos
  diferentes, e a informação **estava** registada. Passa a exigir o facto e não a chave, e a lista
  dos «fantasmas» passa a sair das duas — o que **fortalece** a conferência (o professor do topo
  estava invisível a ela). **CONFIRMADO**: **23/23**, e o vermelho era anterior (o
  `escola/calango/indice.json` não é tocado desde `b6473a6b`, de 05/11).

- **07/11/2026** — **O Bloco 10 saiu do plano de ensino: «Aspecto físico — o corpo» deixou de se
  perguntar.** Os dois nós que o compunham (`linha-de-base-alvo` e `aspecto-fisico`) saíram de
  `porta/plano/conteudo/plano.json`, e os blocos foram **renumerados 1..11 sem falhas** (antes eram
  1, 3..13 — o 2 já não existia, porque o bloco físico da aluna é da anamnese). A razão é de
  fronteira, e é dela: o corpo do ciclo é **declarado na Audição/Elenco** (a linha de base e o
  recorte) e **observado no Plano de Observação**; o plano perguntava pela terceira vez o que já
  sabia. O `## Aspecto físico — força e flexibilidade` saiu **também do documento derivado**
  (`derivar-plano-ciclo.js`), com o `opcoes.linhaDeBase` que só ele usava. **A memória fica**: a
  chave `aspecto-fisico` continua a ser lida quando um envelope antigo a tem (o eixo do Corpo cai no
  `recorte` quando não tem, que é o caso novo), e o `MAPA_SECOES` do validador mantém o alias com o
  motivo escrito — um documento antigo tem de continuar a extrair as suas secções. As três cópias do
  conteúdo (a fonte, a do ciclo da `breu` e a do pacote publicado) ficaram **idênticas** (md5
  `dcf185f0…`). **CONFIRMADO** a 07/11/2026: `provar-corpo-da-linha-de-base` **30/30**,
  `provar-linha-de-base` **102/102**, `provar-plano-completo` **18/18**, `provar-eixos-do-po`
  **42/42**, `provar-derivados-da-sequencia` **26/26**, `provar-salas-e-elencos` **65/65**,
  `provar-producao` **166/166**, `check-identidade` **0 erros**, `gerar-indices --check` **0**,
  `hash-ciclo --check` **intacta**, e o plano derivado valida contra o `ciclo-01-plano-schema.json`.
  `provar-eixos-e-tempo-da-aula` fica com **4 falhas de 52** — as **mesmas de antes** (medido com
  `git stash`: 4 de 51). **O que se perde, e sabe-se:** a secção removida era a única que, no que
  toca ao corpo, apontava para a **Aula 01**, e o link não foi reposto noutro lugar.

- **07/11/2026** — **Os basilares são um bloco no passo 4, o quadro do recorte virou acordeão, e a
  lista dos elencos ficou com três colunas.** O agrupamento é do NÚCLEO (`camposDaObservacaoInicial`):
  quem tem `subitens` é um bloco, e os cinco basilares (en dehors, tendu, passé, meia ponta,
  musicalidade) partilham **«Os elementos basilares»** — o rótulo que a porta já usava; o passo 4
  passa de **catorze blocos a dez**, e o universo continua **45 aspectos**. O `grupo` viaja para a
  leitura, para o recorte e para o documento derivado, e por isso a arrumação vale nos três.
  «Pontos cegos» e «Nunca escolhidos» passaram a **acordeão que nasce fechado**, com os chips a
  aparecerem **três a três** e «Mostrar mais (N)» a acrescentar três (sem pedido novo: o `indice` já
  vinha inteiro); a frase de depuração que apontava `api/bastidores/indice/recorte` **saiu**.
  «Mais escolhidos» continua em tabela. No cartão do elenco saíram **as caixas «Turmas» e «Elenco»**:
  ficam **Alunas e Recorte** (a grelha é a de dois, `.trio.trio-duo`), porque o nome do elenco já
  está no topo do cartão e repeti-lo numa caixa era a mesma palavra duas vezes. O «em que turmas
  está» não se perdeu — passou a **facto da linha `.fatos`** («em N turmas»), e os nomes leem-se em
  «Turmas». A listagem voltou a chamar-se **«Elencos»** (a de «Audições» foi corrigida no mesmo dia;
  ver a entrada de cima). **CONFIRMADO** no código e em jsdom; a conferência ao ar fica para o
  deploy.

- **07/11/2026** — **A nomenclatura de Pedagogia mudou: «Elenco» passou a «Audição» e «Verbetes da
  notação» a «Estilo».** É ajuste de **rótulo**, não de modelo: a secção onde o professor faz a
  seleção e a configuração chama-se agora **Audição**, e a que define os exercícios que conduzem o
  elenco ao domínio de um estilo chama-se **Estilo**. A **entidade continua a chamar-se elenco** —
  o campo do formulário é «Nome do elenco» e o da Turma é «Elenco»; a lista dentro da Audição
  chamou-se «Audições» por um dia e **voltou a «Elencos»** no mesmo dia (ver a entrada seguinte); a
  lista dentro do Estilo ficou «Exercícios com verbete», porque «verbete» é a ficha da notação e não
  o nome da secção. Na **Turma**, o antigo «conteúdo da aula» passou a
  **«Conteúdo do Estilo»**; a seleção (Elenco, Sala, Nível, Grau, Tradição, Modalidade, Professor)
  não mudou. Os `id` das secções ficaram (`#corpo`, `#verbetes`, `#curadorias`) — são âncoras de
  link e de prova. **CONFIRMADO** no código (`motor/servidor/bastidores.js`); a conferência ao ar
  fica para o deploy. O porquê e o alcance estão na entrada de 07/11/2026 do `REGISTRO.md`.

- **05/11/2026** — **Nasceu o índice do recorte (o passo 4), e com ele os pontos cegos do olhar.** O
  recorte mora no KV, e por isso o índice é da família **VIVA** (`PLANO-INDICES.md` §4.5 e a nova
  §4.12), não de `indices/`: o gerador do acervo não alcança o KV, e pô-lo lá seria uma segunda fonte.
  Três perguntas, um dado: o **ranque** (aspecto → em quantos recortes, em quantos chegou à turma), os
  **nunca escolhidos** — contra o **universo de 45** da anamnese, sem o qual «nunca» não existiria —,
  e os **pontos cegos**: aspecto que a leitura do passo 3 marcou como atenção e que recorte nenhum
  olhou. `cobertura` diz `todos`/`alguns`/`nenhum` (o «usado parcialmente»), rascunho fica fora do
  denominador, a escolha órfã vai para `desconhecidos` sem se apagar. O índice vai na resposta da
  lista que a página já pede (zero leituras extra) e tem rota própria com escopo por professor/turma —
  **escopo, nunca eixo**. Medido: **24/24** (desenho a correr em jsdom) · **104/104** · **159/159** ·
  `check-identidade` **0 erros** · `check-indices` **14/14** e **10/10** contraprovas.
  **PENDENTE, e é decisão dela:** (a) o «Gravar» do passo 4 **sobrescreve** a linha, portanto **não
  há série temporal** — «olhar para o passado» exige que o recorte passe a append-only (elo novo por
  decisão, como o `ajuste_de`); (b) o ranque entre escolas exige que todos os KV sejam alcançáveis
  pela mesma leitura, e hoje só a `calango` tem Worker.

- **06/11/2026** — **O Plano de Observação enxuga: sete nós saem, e o recorte do corpo entra.**
  Percorrido campo a campo, ela pediu que saíssem `campo-outro`, `contexto-outro`, `flutuantes`,
  `linha-de-base` («Ponto de partida»), `inclusao` e `exclusao` — *«o motivo da remoção é
  redundância, eles já estão contemplados»*. **O que os substitui é a linha de base da turma**: o
  recorte do passo 4 alimenta a secção «Linha de base», os dois critérios e o eixo do Corpo; o
  elenco alimenta `## Sujeitos`. **Uma leitura, três leitores** — `porta.linhaDeBaseDaTurma`
  escolhe o acto e serve o documento, a escrita da fonte e o painel do formulário. O painel do
  corpo deixou de despejar a anamnese de cada aluna (45 campos, uma leitura por sujeito) e passou a
  mostrar **só os blocos que têm aspectos escolhidos**, agrupados — «3 aspectos em 2 blocos».
  **Duas coisas NÃO saíram, e ela pediu que fosse sinalizado:** as **restrições físicas** (P-22)
  continuam no PO — a anamnese mede o corpo e não recolhe impedimento clínico, e este é o único
  sítio onde «lesão, dor, limitação médica» se declara; e os **itens de cada dimensão** também
  ficam — são a única fonte das colunas da folha de captura, e o plano declara exercícios, não
  critérios de observação. **O expurgo tinha uma lacuna e foi fechada:** `escolaDosCaminhos` só
  reconhecia `escola/<slug>/envelopes/`, e os actos da linha de base (de ontem) ficariam para trás
  numa escola expurgada. Medido: `provar-eixos-do-po` **35/35** (secção D reescrita),
  `provar-po-completo` **17**, `provar-sujeitos-semeados` **22/22**, `provar-producao` **159/159**,
  `validar-po-ciclo` **13 campos de topo sem erro**, `check-identidade` **0 erros**.

- **06/11/2026** — **O ciclo do Plano de Observação deixa de se escrever.** Ela voltou a pedi-lo, e
  com razão: o que se entregou a 05/11 foi a **metade de baixo** — um menu com os ciclos que têm
  plano e uma recusa no servidor. Um menu oferece o **leque**, e a recusa chega **depois** de o
  número estar escrito. Palavras dela: «quando eu escolho ele, automaticamente ele tem que
  preencher para mim qual é o ciclo». **Decidido:** o ciclo do PO deixou de ser um campo — é uma
  **inscrição** (`.ctx-rotulo` + `.ctx-inscricao`, as peças da turma e da linha de base), e o valor
  vem do plano escolhido (`PLANO_CICLO`, do envelope; a estante serve antes de ele chegar). No
  servidor, `cicloDoPlanoDeclarado` **sobrescreve** `contexto.ciclo` antes de qualquer conferência:
  não há dois números a comparar porque há um só. A recusa continua para onde a derivação não
  chega (plano antigo sem ciclo, acervo ilegível). O PO deixa de pedir `api/ciclos`; a lista fica
  para o Plano de Ensino, que é onde um ciclo NASCE. A cadeia, inteira e na ordem: **plano → ciclo
  → turma → linha de base → alunas**. Medido: `provar-ciclo-herdado-do-plano` **20/20** (novo, em
  jsdom, com controle negativo a reprovar **14 de 20** na página de HEAD),
  `provar-relacoes-do-ciclo` **23/23** (secção 2 invertida, não apagada), `provar-producao`
  **159/159**, `check-identidade` **0 erros**.

- **06/11/2026** — **…e o ciclo do PO também não se escreve no PAINEL da Área do Professor.** Ela
  apontou-o no dia seguinte: *«O plano de observação ainda está com o campo ciclo livre. Eu posso
  digitar qualquer ciclo ali.»* O sítio era **outro**: a entrega anterior corrigiu o **formulário**
  (`porta/index.html`) e deixou o **painel do ato** — a caixinha «Contexto do ato» dentro da
  listagem, e o caminho por onde se **entra** —, que vive em `motor/servidor/listas-do-acervo.js`.
  Ali o ciclo passou a **leitura** (`[data-ciclo-leitura]`, a peça da «turma observada»), com o
  `<input>` **oculto** — é ele que a chave da memória, o endereço e o resumo leem —, e o plano
  escolhe-se **antes** do ciclo. `pintarDoPlano` pinta turma e ciclo juntos, e antes de `pintar()`,
  para o estado do botão não decidir sobre um valor que ainda não foi escrito. O plano de ensino
  **continua a escrever** o ciclo (ali ele nasce) e a anamnese continua sem ciclo nenhum. Um plano
  antigo sem ciclo deixa a lacuna **nomeada** («o plano escolhido não declara ciclo»), em vez de
  «falta o ciclo» sobre um sítio onde nada se pode escrever. Medido:
  `provar-ciclo-do-painel-do-po` **27/27** (novo, jsdom; controle negativo a reprovar **4 de 7** no
  `listas-do-acervo.js` de HEAD), `provar-ciclo-herdado-do-plano` **20/20**,
  `provar-linha-de-base` **104/104**, `provar-producao` **159/159**, `check-identidade` **0 erros**,
  `check-indices` **16/16**. **NÃO FEITO na altura:** `provar-painel-do-ato` exigia Chrome e uma
  publicação — ver a entrada seguinte, que o resolveu.

- **06/11/2026** — **«Está funcionando o calango»: a bancada serve-se da escola VIVA, e o critério
  é o do deploy.** Ela corrigiu a premissa: *«está funcionando o calango, é essa que eu estou usando
  para teste… você tem que olhar o que está ativo.»* A `provar-painel-do-ato` — a que mede a
  caixinha do ato, a barra e o menu — nunca corria desde o expurgo da `batata`, e não por não haver
  escola: por a bancada procurar uma que já não existe. Eram **quatro nomes escritos à mão** no
  mesmo ficheiro: o diretório dos assets, a resposta do stub, o subdomínio do `Request` (que a ponte
  recusa com **500** ao comparar com o `ESCOLA_SLUG` — e a bancada lia o documento vazio como «a
  caixinha não existe»), e um `01` a mais na chave da memória da anamnese, que não tem ciclo desde
  05/11. **DECIDIDO:** `lib-pacote.publicacaoDeUmaEscolaComCiclo()` passa a usar o critério do
  `deploy-escolas.yml` — o pacote-zero existe e a escola está viva — e devolve
  `{ dir, escola, paginas }`; quem mede um documento pergunta por `paginas` e diz **NÃO FEITO**,
  quem mede o painel corre na mesma. Uma secção sem fixture deixa de matar a prova inteira (o
  `process.exit(2)` levava dezasseis secções boas), a página que navega sozinha passa a ser esperada
  (`seguro`), e a porta da anamnese passa a ser aberta com o bilhete que a lista emite, como em
  produção. Medido: `provar-painel-do-ato` **130 asserções verdes** com **2 secções NÃO FEITAS pelo
  nome**, `provar-listas-do-acervo` **109/109** (era «NÃO FEITO», depois 1 falha — a asserção «o PO
  não pede senha» media o script em vez da marcação), `provar-ciclos-e-anamnese` **34/34**,
  `provar-ficha-na-listagem` **35/35**, `provar-producao` **159/159**. **Continua por medir:**
  `provar-navegacao`, que precisa de um ciclo **gerado** — a `calango` é um esqueleto.

- **06/11/2026** — **A auditoria reversa dos «itens de cada dimensão».** Ela pediu a investigação e
  deu o método: *«olha pelo fim, lá pelo documento que gera… e vai andando para trás, passando pelo
  PO, passando pelo PE, passando pela linha de base»* — porque suspeitava que os itens **não** eram
  escrita nova. **O que a auditoria achou:** o documento imprime os itens numa tabela e a folha de
  captura usa-os como **colunas**; ambos leem `itens-por-dimensao`, que **não tinha derivação
  nenhuma**. A montante existem os objetivos (`marcos-por-aula`), os blocos de cada objetivo
  (`estrutura-de-cada-aula`), o que mede cada um (`aula-1-parametro` — e são **exercícios**, não
  critérios) e a justificativa do volume por bloco. **Medido termo a termo:** dos **30 termos
  distintos** dos 10 itens, **16 não aparecem em nenhum campo a montante**; e há um bloco inteiro
  (a Expressão) que **nenhum objetivo marca**. **DECIDIDO:** o campo é **redundante na origem e não
  derivável na forma** — derivá-lo perderia o critério e apagaria a Expressão. O defeito era outro:
  escrevia-se **sem ver o plano**. Cada repetição passou a mostrar, antes da caixa, os objetivos
  daquele bloco (recortados pelo bloco: a Musicalidade mostra só o 03), o que os mede, e a
  justificativa do volume; a caixa **não se pré-enche**; e um bloco sem objetivo di-lo («o que você
  escrever aqui é seu»). Uma leitura, quatro usos — o envelope já era buscado para os blocos.
  Medido: `provar-eixos-do-po` **42/42** (secção **E** nova), `provar-po-completo` **17**,
  `provar-linha-de-base` **104/104**, `provar-producao` **159/159**, `check-identidade` **0 erros**,
  `check-indices` **16/16**. **DECIDIDO por ela, no mesmo dia:** o **híbrido** — ver a entrada
  seguinte.

- **06/11/2026** — **O híbrido: os objetivos do plano entram como critérios, e o campo fica com o
  critério.** Decisão dela entre os três desenhos da auditoria reversa. `objetivosPorBlocoDoPlano`
  (em `motor/nucleo/derivar-po.js`) lê `marcos-por-aula` × `estrutura-de-cada-aula` e dá, por bloco,
  os objetivos que ali se perseguem — **sem** ler `aula-1-parametro`, porque um exercício («plié»)
  não é um critério. `itensComObjetivos` põe-nos à frente do que o professor escreveu, resolve o
  prefixo do eixo na dimensão (senão os POs anteriores a 04/11 perdiam os objetivos em silêncio) e
  não duplica. **O plano passou a chegar a três derivadores** — documento, folha de captura e
  declaração `porVariante` —, com `plano` **opcional** nas duas assinaturas que não o recebiam. O
  campo ficou **opcional** (o PO passa a **25 campos, 11 obrigatórios**), e a tela diz que os
  objetivos entram sozinhos. Medido: `provar-po-completo` **20/20** (verificações 18-20, cada uma
  com a sua negativa), `provar-eixos-do-po` **42/42** (a frase do bloco sem objetivo foi
  **atualizada**, não apagada), `provar-producao` **159/159**, `provar-linha-de-base` **104/104**,
  `check-identidade` **0 erros**, `check-indices` **16/16**.

- **06/11/2026** — **«Não vai se perder o que o professor escrever?»** A pergunta dela depois do
  híbrido, e a resposta foi medida, não afirmada. O texto escrito na dimensão chega a **cinco**
  leitores (documento `-po.md`, folha de captura, declaração `porVariante`, guia da aula e o
  `po-01.json` da extração). **Dois modos de o perder existiam, os dois calados:** o
  `GABARITO_VAZADO` casava com a **palavra** `Exemplo` no início da linha e comia um critério
  escrito «Exemplo prático do apoio na barra» — ficava fora da folha e da declaração e continuava
  no documento (o padrão passou a exigir a citação: `Ex\.:\s*[«"“]`); e a descrição depois dos dois
  pontos sumia do papel, porque `rotuloDoItem` corta no `:` — a folha passou a levar uma legenda em
  prosa por bloco, só quando há descrições. **Um terceiro, que não era perda mas era mentira:** o
  `escrever-ciclo.js` derivava a folha **sem** o plano e a declaração **com** ele, e nenhum
  validador o via — o `validar-captura-ciclo.js` só reprova no sentido folha→schema. Medido:
  `provar-observacao-do-professor` (nova) **20/20**, contraprova contra `HEAD` **18/20** (reprova
  exatamente as duas que medem os modos de perder), `provar-eixos-do-po` **42/42**,
  `provar-po-completo` **20/20**, `provar-derivados-do-po` **16/16**, `provar-cadeia-do-ajuste`
  **34/34**, `check-identidade` **0 erros**, `check-indices` **16/16**.

- **06/11/2026** — **O corpo da turma atravessa a cadeia até ao plano e à Aula 01.** Ela gerou o PO,
  abriu o plano e clicou no link para a Aula 01: nos dois documentos, a secção do corpo dizia
  `[Preencher: carregue a sugestão a partir das anamneses da turma…]`, e o plano ainda acrescentava
  «aqui fica o ponteiro — a tabela vive num lugar só». **Duas faltas, nenhuma de dado:** a **língua**
  (instrução de formulário e raciocínio de arquitectura impressos num documento que se lê) e a
  **ligação** (o recorte do passo 4 e a leitura do passo 3 não chegavam ao derivador, que só lia
  `aspecto-fisico`, campo do plano que se preenche à mão). `linhaDeBaseDaTurma` passa a devolver
  `mostra` — a frase que o passo 3 gravou, filtrada pelo recorte —, o **plano** dá o macro (nomes +
  link) e a **Aula 01** o detalhe linha a linha; `aspecto-fisico` continua a mandar quando existe, e
  toda a ligação é opcional (sem ela, a lacuna declara-se). `rotas.js` faz **uma** leitura para os
  dois documentos, e `regerar-derivados` lê-a do disco — sem isso, regerar um ciclo apagaria a
  derivação. Medido: `provar-corpo-da-linha-de-base` (nova) **31/31**, contraprova contra `HEAD`
  **13/31**; `provar-eixos-e-tempo-da-aula` **47/51** (4 já vermelhas em `HEAD`); `provar-eixos-do-po`
  **42/42**; `provar-po-completo` **20/20**; `provar-linha-de-base` **104/104**; `check-pacote` do
  ciclo **0/0**; `check-identidade` **0 erros**; `check-indices` **16/16**.

- **06/11/2026** — **A turma no alto dos documentos, e a anamnese de cada aluna na §6.** Dois pedidos
  na mesma frase: «vamos dizer qual é a turma do qual se aplica esse plano de ensino […] para o
  professor não se perder» e «uma lista para o professor escolher de qual aluna da turma ele quer
  olhar a proveniência […] dois links, um de edição da anamnese e um de imprimir». O plano de ensino
  e a aula passam a trazer a turma no **cabeçalho** (`subtitle`, por `turmaDoDocumento()`), debaixo do
  título na página e no PDF; a aula lê-a do **plano**, não do PO. A §6 «Proveniência consolidada»
  ganha, abaixo dos dois links de origem, **uma linha por aluna do elenco** com dois gestos: abrir o
  formulário e abrir a folha. **É lista e não `select`** porque o pandoc descarta HTML cru ao gerar
  LaTeX — um selector desapareceria do PDF com a secção inteira. O gesto segue a regra de 04/11: o
  servidor responde **409** a editar uma anamnese vinculada, por isso a linha diz **«novo registo»**
  (`?novo=`) nesse caso e «editar» (`?editar=`) quando está solta. O carimbo vem de
  `porta.anamneses` (o vigente de cada apelido, a mesma leitura da listagem), passado por `rotas.js`
  e por `regerar-derivados` — sem esse mapa a linha degrada para «fazer a anamnese» em vez de
  inventar um carimbo. Medido: `provar-proveniencia-e-turma` (nova) **32/32**, contraprova contra
  `HEAD` **14/32**; `provar-eixos-e-tempo-da-aula` **47/51** (4 já vermelhas em `HEAD`);
  `provar-derivados-do-po` **16/16**; `check-identidade` **0 erros**; `check-indices` **16/16**;
  `check-pacote` do ciclo **0/0**; `gerar-ciclo.sh` completo **0 erro(s)**.

- **06/11/2026** — **A §6 vira selector, e o elenco passa a vir da linha de base.** Segunda volta da
  mesma secção: «o dropdown … só pode exibir as alunas que fazem parte do elenco oficial daquela
  turma … alunas avulsas ou de outras turmas são rigidamente ignoradas» e «listar todas as alunas
  soltas na tela geraria uma poluição visual intransponível». **O defeito de dado:** o elenco vinha
  de `po.sujeitos`, e o PO da `calango` listava três alunas quando a linha de base tem duas — o PO
  declara sujeitos, mas quem diz quem está na turma é o acto do passo 2. A fonte passou a ser
  `linhaDeBase.alunas`, com o PO como reserva. **A forma:** medido com o pandoc 3.1.3, HTML cru cai
  no PDF como texto («editar imprimir editar imprimir»), e só o bloco `{=html}` é entregue a um
  escritor e **descartado** no outro — por isso o selector vive lá e o PDF fica com a frase que diz
  onde as anamneses estão. O `<select>` não leva classe (a folha já o desenha) e as acções são
  `a.acao secundario pequena`; sem JavaScript ficam todas à vista, que é a degradação certa. O
  contrato de extracção passou a saltar blocos declarados para outro alvo (commit próprio,
  `acc78228` — o `tools/` está congelado). Medido: `provar-proveniencia-e-turma` **42/42**,
  contraprova contra `HEAD` **21/42**; `provar-eixos-e-tempo-da-aula` **47/51** (4 já vermelhas);
  `provar-corpo-da-linha-de-base` **31/31**; `check-identidade` **0 erros**; `check-indices`
  **16/16**; `check-pacote` do ciclo **0/0**; `gerar-ciclo.sh` completo **0 erro(s)**.

- **06/11/2026** — **A auditoria das oito páginas: o ar é um só, e o rodapé tinha perdido o box
  model.** *«O mesmo rigor de identidade visual deve se estender e estar perfeitamente aplicado
  aos demais motores de geração e páginas correlatas.»* Medido nas oito páginas de documento do
  pacote, a 1280 e a 390, **dois defeitos e um terceiro de manhã**: (a) o vão depois da faixa do
  cabeçalho tinha **três valores** — 32px nos documentos que abrem por `##`, **16px** nos que
  abrem por citação e **8px** nos que abrem por prosa —, porque não era declarado: era o
  `margin-top` do primeiro filho. Passou a ser do `.conteudo` (`--esp-6`), com o primeiro filho
  sem margem; (b) o **rodapé** saía com `margin-top: 0` e `padding-top: 0` enquanto o `.rodape`
  declarava 40px e 16px — a faixa `header.doc, main, .rodape` nomeava `footer.rodape`, que pesa
  mais do que a peça; medido, o texto estava a **5px** do próprio filete e o filete a **0,4px**
  do último parágrafo; agora **21px** e **40px**; (c) a regra `header.doc > :last-child
  { margin-bottom: 0 }` da manhã estava escrita **antes** do `.subtitulo` e perdia o empate, e o
  vão de baixo do cabeçalho saía 20px nuns documentos e 12px noutros — passou para depois das
  peças. A checagem **10 «Respiro»** passou a medir os três lugares e a prova nova
  `provar-ar-das-paginas` mede as oito páginas em navegador. Medido: `provar-ar-das-paginas`
  **14/14** (contraprova contra `HEAD` **6/14**), `provar-titulo-e-barra` **31/31**,
  `check-identidade` **0 erros**, `check-indices` **16/16**, `check-pacote` **0/0**.

- **06/11/2026** — **A turma entra na notação, e a §6 ganha a fileira das acções da aluna.**
  *«Você colocou no documento plano para a aula um a turma … e não colocou a turma dentro da
  notação, precisa colocar»* e *«quando eu escolho a aluna, o botão novo registro e imprimir estão
  colados no dropdown … tem que ter um respiro»*. **A notação** passou a dizer a turma no
  `subtitle`, com a mesma função do plano e da aula (`turmaDoDocumento` do envelope do plano) — é o
  documento que se abre a partir do botão da aula, e chegava sem dizer de quem era. **O respiro:**
  cada par de gestos vivia num `<div>` **sem classe**, e um `<div>` nu não tem ar — medido no
  documento publicado, o menu acabava em 3139,6px e o botão começava em 3139,6px (**1px**), em 1280
  e em 390. A peça nova `.acoes-da-aluna` (folha + catálogo no `IDENTIDADE-VISUAL.md` + prova que a
  **mede** em navegador) dá **12px** do menu e **8px** entre os dois botões. Medido:
  `provar-proveniencia-e-turma` **53/53**, contraprova contra `HEAD` **8/53**; `check-identidade`
  **0 erros**; `check-indices` **16/16**; `check-pacote` **0/0**.

- **06/11/2026** — **O cabeçalho respira, e o respiro é padding.** *«Os botões estão colados na
  margem superior e o botão Abrir notação … completamente colado na linha.»* Medido no documento
  real: no estado **preso** o `h1` começava a **0,3px** da barra (**0px** no celular) e o botão
  acabava a **0px** da linha da sombra. A causa é de caixa, não visual: o ar era um `margin-top: 8px`,
  e `position: sticky` põe a **caixa** na barra e **descarta a margem** — o ar só existia com a
  página no topo. O respiro passou a `padding` (`--esp-3`, 12px acima e abaixo) numa declaração para
  os dois sítios que o mecanismo prende (`header.doc` e `.titulo-fixo`), e o último filho perde a
  margem inferior para o vão ter um responsável só. Resultado medido: **12/12px** no plano da Aula
  01, no plano de ensino e no lançamento, nas duas larguras. **Registado em dois sítios, como ela
  pediu:** a secção «O cabeçalho respira» no `IDENTIDADE-VISUAL.md` (com a tabela antes/depois) e a
  checagem **10 «Respiro»** do `tools/check-identidade.js`, que roda no `pre-commit` e reprova o ar
  abaixo de 12px **e** o ar posto em margem. **A lição:** as nove checagens e as 27 asserções da
  bancada davam todas `ok` com o título a 0,3px da barra — mediam presença, e o defeito era de
  distância. Medido: `provar-titulo-e-barra` **31/31**, contraprova contra `HEAD` **4/31** (as quatro
  novas); `check-identidade` **0 erros**.

- **06/11/2026** — **A matriz que não cabe rola dentro de si, e as setas dizem que há mais.** Três
  pedidos numa fala: *«Ele pode ocupar a mesma dimensão que os outros formulários ocupam somando a
  essa dimensão a parte do roteiro»*; *«as colunas vão crescer de forma dinâmica […] tem que prever
  que quando ultrapassar a largura da página precisa de um scroll horizontal […] Eu pensei em
  colocar aqueles botãozinhos dos carrosséis […] também não tá na nossa identidade visual; se ficar
  bom tem que incorporar»*; e *«se tiver aqui 50 alunos, como é que faz isso?»*. (a) A coluna do
  formulário era a de **leitura** (828px) com a coluna do índice **vazia** ao lado — o formulário
  não tem roteiro. Com `data-largura="matriz"` passa a **1132px**: a conta é literalmente a dela
  (828 de texto + 32 de vão + 272 de índice). (b) A casa já mandava a `table` rolar abaixo de 900px,
  e isso **não se vê**: colunas cortadas não dizem se é o desenho ou o fim do conteúdo. A peça
  `.rolagem` responde a essa pergunta e a mais nenhuma — a fileira das setas **só existe quando
  `scrollWidth > clientWidth`**, e a seta desliga-se no fim do caminho. `--colunas` é escrito pelo
  **dado** quando a tabela é montada (10rem por coluna); sem isso o `width: 100%` **espremia** as
  colunas em vez de as deixar rolar. (c) A presença passou a ser a mesma **caixa que abre** dos três
  eixos — contagem no título, marcar/desmarcar todos, aberta sozinha até doze alunas —, e **não um
  modal**: foco, `Esc`, rolagem de trás e devolução de foco são coisas que não se vêem numa captura
  e por isso se partem em silêncio, e o modal não é peça desta folha. A matriz **segue a marcação**
  (desmarcar reconstrói as linhas) e **não perde o que já estava escrito** — os `id` são estáveis
  por (bloco, aluna, coluna). Medido: `provar-formulario-da-aula` **48/48** (eram 34),
  `check-identidade` **0 erros**, `gerar-ciclo.sh` **0 erro(s)**, `check-pacote` **0/0**.

- **06/11/2026** — **O índice de lançamentos, e a chave que faz a marca encadear.** A pergunta dela
  — *«Em quantas aulas ele demorou para conseguir fazer o adágio?»* — não se respondia com a marca
  guardada: os itens da linha de base iam pelo **texto**, e a marca em duas aulas eram duas linhas
  sem nada em comum. `Vistas.helpers.chaveDoItem` (acento fora, caixa baixa, o resto em `_`)
  **reproduz as 11 chaves que o schema da captura declara à mão** — é a regra do projecto, não uma
  nova —, e o formulário grava `{chave, item, marca}`, a chave **uma vez e nunca recalculada**.
  Nasceu o leitor que o §4.9 dizia faltar: `tools/indice-lancamentos.js` extrai `presenca`,
  `marcas` (aula, data, aluna, coluna, bloco, marca), `condicoes` (`mudou` **booleano**), `ajustes`
  (`houve`) e `rubrica` (o nível), mais `surpresas`. **A prosa não sai** — nem o registro, nem o
  ajuste, nem o que mudou —, e a prova assere isso. `--check <aluna>` responde ao `AL03`. Saída
  determinística. O validador exige slug quando a chave existe e avisa quando falta. Medido:
  `provar-indice-de-lancamentos` **24/24** (contraprova **7/24**), `provar-formulario-da-aula`
  **34/34**, `check-identidade` **0 erros**, `check-indices` **16/16**, `check-schemas` ok,
  `gerar-ciclo.sh` **0 erro(s)**, `check-pacote` **0/0**. **Em aberto:** o índice é leitor de
  ficheiro; o §4.9 pede-o também **vivo** (`POST /api/bastidores/indice`, escopo por professor e
  ciclo).

- **06/11/2026** — **A matriz do lançamento: as alunas por linha, os aspectos por coluna.** Ela
  viu o formulário pronto e disse o que faltava: *«a gente tem que elaborar um outro modelo onde a
  parte de cima a gente tem por linha os alunos e por coluna a gente precisa acrescentar outras
  colunas […] Eu não tenho essa linha de base orientada por aluno e eu preciso ter isso»*. Eram
  **três blocos** para a mesma coisa, e dois errados: cinco tabelas com as mesmas duas colunas
  repetidas (seis perguntas iguais por aluna), um bloco «o que se observou» com os mesmos
  objectivos e **sem aluna**, e um bloco «linha de base revisitada» que **nunca funcionou** —
  procurava no PO uma lista por aluna que o PO não tem e imprimia a lacuna para toda a gente. Os
  quatro aspectos do recorte do passo 4 não tinham coluna nenhuma. Agora: o Corpo é uma tabela com
  os quatro aspectos como colunas; a Técnica tem uma tabela por objectivo com **Solo · Barra ·
  Centro** como colunas; a Poiesis, uma por objectivo com **Musicalidade · Expressão**. As colunas
  não se inventam — são as da folha de captura, a mesma tríade do índice (§4.9: aula, data,
  aluna, coluna, bloco, marca). Cada eixo é um `<details>` que diz no sumário quantas marcas tem
  dentro, e o Corpo abre aberto. **Altura 3 876 → 2 209px**; tabelas 8 → 5; 14 marcas por aluna, e
  todas com dono (antes 20, e 8 sem dono). **A pergunta do plano foi fundida:** «plano seguido» +
  «precisou de ajuste» diziam a mesma coisa e passaram a uma pergunta de três estados com um texto
  (`parcial`/`nao` → `mudou` e `relatorio.ajustes` recebem o mesmo texto). A data e a duração já
  vinham do índice e do plano — medido: `2026-11-05` e `60`. **O validador passou a olhar os blocos
  de itens** (`{aluna: [{item, marca}]}`), que passavam por «forma conferida pelo schema». Falta a
  Etapa 3: o slug estável de cada item, para o índice contar «em quantas aulas». Medido:
  `provar-formulario-da-aula` **34/34** (contraprova **7/34**), `provar-elenco-derivado` **12/12**,
  `provar-ar-das-paginas` **14/14**, `provar-proveniencia-e-turma` **53/53**,
  `provar-corpo-da-linha-de-base` **31/31**, `check-identidade` **0 erros**, `check-schemas` ok,
  `gerar-ciclo.sh` **0 erro(s)**, `check-pacote` **0/0**.

- **06/11/2026** — **O lançamento: a aluna que não existe, a página fora da casa, e os três textos
  que viram marcação.** Três coisas numa fala, e as três no **formulário do lançamento**. (a) *«aqui
  diz que tem presentes aluno A, B e C. Não é verdade»* — a turma tem **duas**; `derivarDados` e
  `derivarCaptura` liam `po.sujeitos` cada uma por sua conta, e o PO do ciclo ainda declarava três.
  Passaram a ler `elencoDoCiclo(po, linhaDeBase)`, com o PO como reserva (`alunas: []` cai na
  reserva — vazio não é resposta). (b) *«ele está completamente alheio»* à identidade — a página
  **redeclarava a base da casa** (`body` 15px/1.5 e coluna de 1000px, `h1` a 1.6rem, tabelas a
  .92rem): sem classe inventada, e por isso a checagem **8 «Peça»** passava verde — ela olha
  classes, e o que escapava era a redeclaração de **elementos**. Agora 17px/1.65, `h1` a 31px,
  `<header class="doc">` e `main > .conteudo` como as outras páginas. (c) *«não é fácil para o
  professor responder»* — os três textos passaram a **uma escrita e duas marcas**: «o que aconteceu
  de novo» (obrigatório), «surpreendeu?» (`sim`/`nao`, em branco = não respondi) e «precisou de
  ajuste?» com padrão **não** e o texto só no «sim». O que se **marca** são os itens do «Itens de
  cada dimensão» do PO, nos três eixos, com o texto do item verbatim — e o JSON ganhou `observado`.
  **O achado de raspão, e é o mais grave:** o `validar-dados-ciclo.js` exigia `tecnica` e `funcional`
  (os blocos do **Duo**) em toda aula, e o ciclo da calango declara `solo`, `barra`, `centro`… — o
  lançamento de um ciclo real era **reprovado pelo validador do próprio projecto**. Os dois nomes
  saíram do `required` e entrou a regra que eles garantiam: com gente presente, ao menos um bloco
  por pessoa. Medido: `provar-formulario-da-aula` **27/27** (contraprova **4/27**),
  `provar-elenco-derivado` **12/12** (contraprova **6/12**), `provar-ar-das-paginas` **14/14**,
  `provar-corpo-da-linha-de-base` **31/31**, `provar-proveniencia-e-turma` **53/53**,
  `check-identidade` **0 erros**, `check-indices` **16/16**, `check-schemas` ok, `check-pacote`
  **0/0**, `gerar-ciclo.sh` completo **0 erro(s)**.

- **05/11/2026** — **O cabeçalho que faltava: uma lista de `User-Agent` e um guarda que reprova.**
  O envio voltou a falhar com «leitura do sha: HTTP 403», e a mensagem de ontem cumpriu o que
  prometia (JSON, com a razão, rascunho intacto) — mas sem a **frase** do GitHub, porque o código
  lia `Response.texto`, propriedade que não existe (o método é `.text()`). **A correção do
  diagnóstico anterior:** o 403 não era da árvore. O GitHub recusa com 403 toda a requisição sem
  `User-Agent`, e o `fetch` do Worker não o põe sozinho — medido com o mesmo token, `git/trees`
  dá **200** com o cabeçalho e **403** sem ele. O módulo da linha de base nasceu ontem sem esse
  campo: **todas** as suas chamadas falhavam. Decidido: (1) **uma lista só**, em
  `motor/servidor/github-api.js` (havia doze cópias — a terceira vez que o defeito apareceu);
  (2) `detalheDe()` devolve `HTTP 403 — <frase>`, e não o número sozinho; (3) `GET
  /api/bastidores/diagnostico/repositorio` sonda repositório, árvore e os dois `.indice.json`
  com status **e frase** — o diagnóstico de ontem foi por dedução e a dedução errou; (4)
  `tools/check-github-headers.js` (estático, sem rede) no `pre-commit`, passo 8. O **índice das
  versões fica**, mas por CUSTO e não por recusa: a justificação falsa foi corrigida nos
  comentários, com data. Medido: `provar-cabecalhos-do-github` **34/34**,
  `provar-linha-de-base-no-repo` **39/39**, `provar-escrita-do-acto` **21/21**,
  `provar-acervo-envelopes` **48/48**, `provar-producao` **159/159**, `check-github-headers`
  **5 verificações**, `check-identidade` **0 erros**, `check-indices` **16/16**.

- **05/11/2026** — **O 403 da árvore: o índice das versões, e a árvore deixa de ser dependência.**
  O envio falhou com «não li a árvore do repositório: HTTP 403» — e a correcção anterior já valia:
  o erro chegou em JSON, com a razão, e o rascunho ficou intacto. Medido: com o MESMO token,
  `/contents/…` funciona (o acervo lê-se e escreve-se) e só `git/trees` recusa. O erro de desenho
  era meu: a **listagem** era dependência da **escrita**. Passou a haver
  `escola/<escola>/linhas-de-base/.indice.json` — o mesmo padrão do `envelope/.indice.json` —, e
  `vigentes`/`versoes`/`vigente` custam UMA leitura; a árvore é o último recurso (a primeira vez de
  uma escola) e, se ela recusar, a estante declara `fonte: nenhuma` com o `aviso`, porque um vazio
  silencioso lê-se como «as linhas de base desapareceram». O acto grava-se ANTES do índice e as
  duas escritas são independentes (`avisoIndice` quando a segunda falha). Provado com a árvore a
  responder 403: o envio dá 200, o segundo encadeia o `anterior` pelo índice, e o controlo negativo
  (sem índice e sem árvore) diz o motivo. Medido: `provar-linha-de-base-no-repo` **39/39**,
  `provar-escrita-do-acto` **21/21**, `provar-linha-de-base` **104/104**, `provar-producao`
  **159/159**, `check-identidade` **0 erros**, `check-indices` **16/16**.

- **05/11/2026** — **A escrita do acto não mente, e `/api/**` responde sempre JSON.** No «Concluir
  e enviar para a turma» a consola mostrou dois erros e os dois começavam por
  `Unexpected token '<'`: `/api/revalidacao` dava **404** (é rota da PORTA, servida só debaixo de
  `/anamnese/`, `/plano-ensino/` e `/plano-observacao/` — na raiz caía nos assets e voltava HTML,
  e o aviso da cascata nunca apareceu desde que foi escrito) e o `/enviar` dava **500 com uma
  página em HTML**, porque uma excepção no store subia até ao runtime. Corrigido nos dois sítios: a
  cascata passou a `/api/bastidores/revalidacao` (mesma função do núcleo), `concluir`/`apagar`
  deixaram de estourar e devolvem `{ok:false, erro}` com a razão (incluindo o `message` do GitHub),
  e `bastidores.fetch` passou a ser uma MOLDURA que responde JSON em `/api/**` mesmo quando a rota
  falha — a página pode falhar como página, uma rota de dados não. Achado ao revisitar: o `/enviar`
  lia a lista FUNDIDA e gravava-a no KV, copiando actos para lá; passou a `rascunhosDe`. Medido:
  `provar-escrita-do-acto` **20/20**, `provar-linha-de-base` **104/104**, `provar-producao`
  **159/159**, `check-identidade` **0 erros**. **PENDENTE:** a mensagem real do 500 em produção —
  o `wrangler tail` exige credencial que este ambiente não tem; o que ficou feito é tornar o erro
  impossível de esconder, e é a próxima tentativa que o diz.

- **05/11/2026** — **O recorte entrou no índice GERADO, com a série.** A limitação 1 do §4.12 do
  `PLANO-INDICES` («não há série temporal») fechou: a entidade `recorte` passou de `prevista` a
  `produzida`, e o índice de cada escola traz `recortes[]` (a vigente de cada linha com a cadeia
  `versoes[]` inteira), `aspectos[]` (a janela do tempo: `contagem` = recortes vigentes que o olham
  hoje, `versoes` = actos que alguma vez o escolheram, `primeira`/`ultima` = carimbos) e
  `filtros.aspectos` (a faceta, para o filtro rápido). `acesso: escola`: o transversal leva só
  `contagens.recortes`. Duas verificações novas no `check-indices` — **15** Acesso declarado (o que o
  dicionário marca como de escola não atravessa, e o que é `produzida` tem de existir) e **16**
  Recorte coerente (o ranque bate com os recortes que o sustentam) —, com as contraprovas 10 e 11.
  **Um erro meu, apanhado pela contraprova:** a verificação 15 procurava `acesso` na ENTIDADE, e o
  dicionário declara-o em cada CAMPO — não conferia nada e passava. Uma verificação que passa por não
  correr é pior do que nenhuma. Medido: `provar-recorte-no-indice` **40/40**, `check-indices`
  **16/16** e **12 contraprovas**, `provar-indice-do-recorte` **24/24**, `provar-linha-de-base`
  **104/104**, `provar-producao` **159/159**. **PENDENTE e é facto, não falha:** nenhum ficheiro de
  linha de base no repositório ainda — o primeiro nasce no próximo «Concluir e enviar para a turma»,
  e até lá o índice diz `recortes: []`, que é a verdade.

- **05/11/2026** — **A linha de base saiu do KV: o acto é um ficheiro, append-only.** O «Gravar» do
  passo 4 fazia `lista[idx] = linha` sobre um array no KV: o que existia antes desaparecia, e com
  ele a possibilidade de olhar para o passado. Decidido por ela: «é melhor mandar para um ficheiro,
  porque daí a gente consegue as soluções que precisamos e ter um índice robusto». Agora
  `escola/<escola>/linhas-de-base/<id>--<carimbo>.json`, um por acto — o ACTO é o «Concluir e
  enviar para a turma» (passo 5), e os passos 1–4, que são intenção, ficam no KV. O `id` não muda
  entre versões (é o ponteiro do plano), a vigente é a de carimbo maior, e apagar grava uma lápide
  em vez de esquecer. Duas listas: `linhasDeBase` (edição: acto + rascunho por cima) e
  `linhasConcluidas` (actos: o que a turma, o plano e o PO leem) — um rascunho que mexe no elenco
  sem ser concluído não muda o corpo que a turma observa. Sem `GITHUB_TOKEN` o acto fica no KV e a
  resposta DIZ isso; com o GitHub a recusar, 502 e o rascunho intacto. Medido:
  **28/28 · 104/104 · 22/22 · 41/41 · 20/20 · 24/24 · 159/159**, `check-identidade` **0 erros**,
  `check-indices` **14/14**. **PENDENTE:** (a) o índice gerado em `indices/` ainda não olha esta
  família — o ranque entre escolas e a série temporal estão desbloqueados, não feitos; (b) o
  `GITHUB_TOKEN` tem de existir no Worker da escola (existe em `calango`), senão a série não existe.

- **05/11/2026** — **A listagem da anamnese lia a turma da curadoria, e o elenco mudou de dono.**
  O selo dizia «nova» e o contexto «aluna nova — sem turma» à Aluna A e à Aluna B, que já tinham
  linha de base feita e enviada. `turmaDaAluna()` lia **curadorias**; em `calango` elas estão
  **vazias** (medido por API), e o elenco passou a ser declarado pelo passo 5 da linha de base.
  O mesmo erro, no PO, dava `{"opcoes": [], "recorte": []}` em `/api/anamneses?turma=…` — zero
  alunas para quem tinha tudo feito. Corrigido nas duas pontas: a linha de base é a fonte
  (`alunasDaTurma`, `alunasDoProfessor`), a curadoria fica como recurso declarado, «nova» passa a
  exigir **não ter linha de base**, a etiqueta diz o nome da linha («turma X · linha de base
  «…»»), e o cabeçalho do PO mostra a inscrição «linha de base» ao lado da turma. A cadeia é
  **turma → linha de base → alunas → corpo**, e a razão está escrita: a turma já vem do
  `plano-de-ensino` obrigatório, e um campo próprio para a linha de base seria o segundo lugar a
  declarar o mesmo facto. Medido: **20/20 · 41/41 · 104/104 · 159/159 · 24/24 · 34/34 · 17/17 ·
  34/34 · 18/18 · 44/44 · 26/26**, `check-identidade` **0 erros**, `hash-ciclo --check` íntegro.
  **PENDENTE:** (a) a decisão dela sobre tirar o nó `sujeitos` do PO (hoje é uma selecção dentro
  do elenco da turma, e não um campo aberto); (b) o `check-pacote` do `ciclo-01-calango` reprova
  **10 erros que já reprovava antes** (sem PDF, sem `dados.json`, e os links de topo) — a fonte
  daquele ciclo não está no repositório (`DOCS=""`), e corrigir exige eliciar o plano outra vez.

- **05/11/2026** — **«O que já é bom» passou a ser o que ALGUMA aluna tem de bom.** Depois da
  correcção do apoio, ela leu a tela e disse o que faltava: «a aluna B tem o tendu bom e faz por
  consciência própria — não achei em lugar nenhum o que ela já tem de bom». A definição era «todas
  no melhor nível», e numa turma em que as duas diferem em quase tudo o bloco ficava vazio. Passa a
  ser **alguma**: é o mérito individual, sem nomear quem (a linha diz o aspecto, o eixo e como está
  o grupo). A leitura «todas bem» não se perde — o item continua a declarar `noMelhorNivel`, e o
  `soExcelente` do recorte continua a usá-la. Nos dados dela: **36** aspectos em «o que já é bom»,
  entre eles o `tendu` e a `musicalidade`; **9** campos sem ninguém no melhor nível. Medido:
  **104/104 · 159/159 · 26/26**, `check-identidade` **0 erros**. **PENDENTE:** refazer a leitura no
  passo 3 (é um gesto, não acontece sozinho).

- **05/11/2026** — **«O que já é bom» ficava vazio porque o apoio da observação inicial era lido como
  nível.** A definição de excelência é de **grupo** («todas no melhor nível») e está documentada em
  `ARQUITETURA-GERAL.md` §5.13 e no `REGISTRO.md` — **CONFIRMADO** no código. O defeito era outro: a
  observação inicial grava `[escala, apoio]`, e a leitura juntava os dois com `join(' · ')`, tratando
  «Bom · com-barra» como nível — que nunca é igual a «Bom». Medido nos dados reais da `calango`:
  «2ª posição — pés» dava «2 de 2 em «Bom · consciencia-propria»» e ia para atenção; «o que já é bom»
  ficava em **zero**, com `atenção = 45/45`. Passa a ler a escala pela mesma regra da `ficha.js`, o
  apoio vai em português e entre parênteses quando é um só, «não foi medido» deixa de ser ponto de
  atenção, e cada aspecto passa a dizer `noMelhor` (quem está bem). Medido: **103/103 · 159/159 ·
  26/26**, `check-identidade` **0 erros**. **PENDENTE:** (a) a leitura guardada no KV é a antiga — é
  preciso **reler** no passo 3 depois do deploy; (b) a excelência de **cada aluna** como lista não
  tem onde se ler, e o que fazer com ela é decisão dela, em aberto.

- **05/11/2026** — **A linha de base lia 30 dos 49 nós, e a Curadoria prometia o verbete de outra
  escola.** Dois relatos da mesma sessão, e as duas causas eram de **leitura** — não havia cache.
  (1) `exerciciosComNotacao` lia o alfabeto **empacotado no Worker** e **não** aplicava a vista da
  escola; a listagem do verbete lê o **repositório** e aplica (`registosDaEscola`). O «Battement
  tendu» existe só na versão da `breu` (`8|2/4@breu`): a Curadoria da `calango` oferecia-o e a
  listagem não o mostrava — **CONFIRMADO** ao arranque. O menu da Curadoria passou a ser preenchido
  pelo **mesmo payload** que desenha a listagem (`/api/bastidores/verbete` → `d.exercicios`).
  (2) `camposDisponiveis` lia só `conteudo.blocos` (30 campos), e o campo que ela marcou —
  `cinco-posicoes-2a-pes`, «2ª posição — pés» — vive em `observacaoInicial`, que nunca era lida: o
  professor respondia, o sistema não via, e nada falhava. Passa a ler os **45** que se medem (15 da
  observação inicial + 30 dos blocos); os 4 da identificação ficam de fora, declarado. A/B contra o
  `HEAD`: a função anterior devolve 30 e não tem o campo. Medido: **100/100 · 159/159 · 26/26 ·
  50/50**, `check-identidade` **0 erros**. **PENDENTE:** a conferência no ar, e o menu de músicas do
  plano (mesma família, outro ecrã) — que fica declarado e **não** corrigido.

- **05/11/2026** — **A secção do corpo nasceu fora do `</section>`, e 63 asserções não o notaram.**
  A tira dos cinco passos, o formulário e a lista ficaram montados **depois** do `</section>` das
  Curadorias: `#sec-corpo` era uma casca com título e três `</div>` órfãos. A prova passava porque
  perguntava «está aqui?» por `getElementById`, que atravessa a árvore — a pergunta que faltava era
  **«de quem é este elemento?»**. O bloco 13 da `provar-linha-de-base` passou a medir a pertença.
  A regressão era maior do que o ecrã: `provar-producao` caíra de **158/158** (em `c748e461`) para
  **154/158** com a oitava secção — três contagens e a regra «nenhum formulário traz explicação», que
  agora tem **duas secções isentas nomeadas e com motivo**, mais uma asserção a exigir que as isentas
  existam e sejam só aquelas. E duas bancadas antigas apanharam defeitos reais: a nota do elenco
  herdado partia o par rótulo ↔ escolhedor, e `provar-cartao-da-turma` lia `button.passo` sem dono.
  Medido: **68/68 · 159/159 · 23/23 · 126/126**, `check-identidade` e `check-indices` **0 erros**.
  **PENDENTE:** uma reprovação **pré-existente** em `provar-cartao-da-turma` (a lista de Termos saiu
  da página a 01/11/2026 e a asserção ainda a procura).

- **04/11/2026** — **O ciclo apaga-se de trás para a frente, a sequência é estrita, e a anamnese é
  datada.** A exclusão guarda o **último** ciclo (o `parentHash` do seguinte aponta para a âncora
  deste) e leva só o **gerado** — o plano de ensino fica **livre sem se lhe tocar**, porque o
  vínculo PO ↔ PE é derivado. O campo do ciclo passa a `readOnly` com o próximo número válido, e
  **desaparece da anamnese**: ela é do sujeito, não do ciclo. «Ajustar» deu lugar a **«Novo
  registo»** — documento novo, data nova, sem `ajuste_de`. E o sinal de revalidação é derivado, com
  a ordem **PE e depois PO**. Prova nova: `provar-ciclos-e-anamnese`, 34 asserções.

- **04/11/2026** — **A faixa no telefone, as 3 asserções, e a capacidade.** As cinco leituras do
  cabeçalho são `.ctx-rotulo` + `.ctx-inscricao` (não `<label>`), e a regra do `grid-column` cobria
  só o `label`: o rótulo encolhia até 0px e o valor tomava a coluna — «totalmente acavalados». O
  `provar-producao` foi de 153/156 a **158/158**, e as três falhas eram duas lacunas da bancada e
  duas expectativas obsoletas (nada era «pré-existente» no sentido de alheio). A **§2.2** deixou de
  contradizer a §5.7, e há **§7.2** nova: **26 criações ou 80 edições por minuto**, 5 a 62 escolas,
  declarado como projecção. Prova nova: `provar-faixa-do-ato-no-celular`, 40 asserções.

- **04/11/2026** — **Os três eixos do PO, o corpo da anamnese, e o §1 sem «Port de bras».** O
  Plano de Observação listava «Técnica — Musicalidade» porque o eixo estava escrito no **conteúdo** e
  concatenado a todos os blocos; o mapa dos eixos passou a ser **um só** (`motor/nucleo/eixos.js`) e
  o eixo decide-se pelo **bloco**. O Corpo é eixo próprio e carrega da **anamnese de cada sujeito**;
  o seletor do sujeito passou a ser o primeiro bloco, antes das dimensões. E o «Port de bras» do §1
  vinha da **matriz do parâmetro**, não da curadoria: a régua do repertório tinha blindado a sequência
  e não o parâmetro — agora é uma régua só. A linha do cartão passou a ser o **objetivo geral** do
  PO. Prova nova: `provar-eixos-do-po`, 34 asserções.

- **04/11/2026** — **O composto não enumera verbos, a modalidade tem uma só origem, e o custo da API
  tem número.** O `combinar` — o armazenamento que o Worker monta — listava os verbos à mão, e o
  `criar` ficou de fora: a escrita condicional existia no acervo e **nunca chegava ao motor**. O
  `anexar` faltava pela mesma razão. Uma camada abaixo, os dois adaptadores de **base** também não
  tinham `criar`. A classe ficou fechada ao tirar a lista: o composto é um **`Proxy`** que encaminha
  qualquer verbo. A **modalidade** estava em **29 ocorrências e 8 ficheiros** (não 10 sítios: contar
  blocos subestima) e passou a ter **um único ponto de derivação**, com `MODALIDADE_PADRAO`
  derivada. O **custo da escrita** ganhou número medido — **18 pontos** para criar um envelope, **7**
  para o editar — e a decisão de não adoptar banco relacional passa a ter critério de revisão
  explícito. Prova nova: `provar-verbos-do-armazenamento`, 29 asserções.

- **04/11/2026** — **As colunas da aula e a notação fora da música.** As doze tabelas de exercício
  saíam a 28/28/21/21 — número com a largura de parágrafo. A causa não era CSS: o pandoc calcula a
  largura relativa pela **proporção dos traços** da linha de separação, e só quando ela passa dos 72
  caracteres; com traços iguais, colunas iguais. A proporção passou a **12/12/23/52**, com o ganho a
  favor de quem tem texto. E a §4 da aula deixou de trazer a notação Benesh na contagem — ela vive no
  documento dela (`-notacao.md`), que é onde o botão «notação» a vai buscar. Prova nova:
  `provar-colunas-da-aula`, 23 asserções.

- **04/11/2026** — **O cartão da aula, os três eixos e os links da proveniência.** Saíram o «Ciclo»
  da caixa da Turma e o identificador do bloco do Professor, que passou a mostrar **nome**,
  **modalidade** e **tradição de referência** — cada um do seu sítio, nenhum deduzido. O guia da
  aula deixou de ser uma tabela com coluna «Eixo» e passou a **três tabelas**, uma por eixo, com o
  eixo como **bloco** do documento (o contrato lê uma tabela por bloco — foi o que decidiu o
  desenho); o **Corpo**, que era uma frase, passou a ter as linhas dos 15 aspectos do plano, da
  linha de base e das restrições. E os links da proveniência deixaram de abrir a **porta** e passam
  a abrir a **folha** do documento. `guiaDeObservacao` passou de array a objecto com os três eixos
  (21 schemas: 20 professores e o `modelo/`). Provas: `provar-cartao-da-aula` (nova, 25) e
  `provar-eixos-e-tempo-da-aula` (27 → 38).

- **04/11/2026** — **A fusão das edições (decisão 84) e o `ARQUITETURA-GERAL.md` como espelho.** Duas
  pessoas no mesmo documento passam a unificar: campos diferentes ficam os dois, o mesmo campo
  decide pela recência ao milissegundo, o empate vai para quem grava, e sem base não se adivinha. A
  regra é pura (`motor/nucleo/fusao.js`), a repetição do 409 é do adaptador, e a resposta declara a
  fusão. O documento de arquitetura foi reescrito — dava o acervo no KV e sob
  `professores/<professor>/escolas/`, e nenhuma das duas é verdade —, com a **§5** nova
  («Concorrência, corrida e integridade»), medida e não desenhada. Ao documentar a lista de verbos
  do `combinar` apareceu **um defeito vivo**: o `anexar` faltava, e o registro de custo da IA é
  acrescentado por ele. Prova nova: `provar-fusao-da-edicao`, 29 asserções, pelo armazenamento
  composto.

- **04/11/2026** — **A corrida da escrita: dois «Guardar» no mesmo minuto não perdem um documento.**
  A auditoria da concorrência deu «não» a quase tudo (gerações enfileiradas, um commit por
  gravação, a referência como último passo, o `.fipp` reancorado depois do rebase) e **uma excepção
  medida**: o id do envelope é um carimbo de minuto escolhido por «existe?» antes da gravação, e
  dois pedidos no mesmo minuto ficavam com o mesmo nome — o segundo gravava por cima, os dois
  diziam «gravado», um documento evaporava. O contrato ganhou `criar` (condicional), o nome cede ao
  sufixo, o índice passa a descrever o arquivo, a intenção é declarada (`substituir`), e o
  **expurgo** — único escrito em lote sem repetição — passa a refazer a corrida que perdeu. O 422
  do GitHub foi medido contra a API real, num ramo descartável. Prova nova:
  `provar-corrida-da-escrita`, 27 asserções.

- **04/11/2026** — **O ajuste do plano arrasta o PO, e o cartão da aula mostra o guia.** O PO
  continuava a observar o plano substituído (`po-20261104-1733` → `plano-de-ensino:
  plano-20261103-2200`, medido), e o plano novo ficava «livre» na estante. Três funções derivadas do
  `ajuste_de` — `planosDaCadeia`, `planoVigenteDaCadeia`, `poDoPlano` — dizem qual é o topo; a rota
  deriva **um elo do PO** ao gravar o plano ajustado (e corre fonte, ciclo e disparo); e um PO a
  declarar um plano substituído passa a apontar o vigente, com a correção **dita**. A Aula 01 do
  envelope real passa a sair com **Expressão 27 · 30%**. Na listagem, a frase de arquitetura saiu, o
  horário foi para dentro da caixa **Turma**, e o **Guia de observação** entrou como caixa — com a
  conta, os itens por dimensão e uma linha de síntese por eixo. Prova nova:
  `provar-cadeia-do-ajuste`, 34 asserções.

- **04/11/2026** — **A fatia de tempo vem do plano pela coluna certa, e o guia lê as três frentes.**
  Dois defeitos medidos no motor: a proporção era lida pela **posição** da coluna — e a gravação não
  escreve célula vazia, de modo que a **justificativa** ocupava o lugar da fatia quando «Proporção
  alvo» faltava —, e a unidade **`minutos`** não se sabia ler (lacuna em todos os tempos, com a
  fatia certa ao lado). A coluna passa a ser procurada pelo **nome**, as duas unidades convertem, e
  a lacuna **nomeia o bloco e o sítio**; o plano diz o mesmo ao pé da tabela. O valor do Expressão
  **não está no envelope da `breu`** — a linha foi gravada sem proporção, e o sistema não a inventa.
  O **guia de observação** passa a ter o resumo por eixo (**Corpo** · **Técnica** · **Poiesis**) e a
  tabela item a item logo abaixo; nenhum rótulo do dado foi renomeado, e o mapa dos eixos é
  **candidato**. Prova nova: `provar-eixos-e-tempo-da-aula`, 27 asserções.

- **03/11/2026** — **A estante mostra um por documento.** Três ajustes do Plano de Observação viravam
  três linhas com o mesmo nome na Área do Professor — uma por envelope. A regra passou a ser uma, do
  núcleo (`porta.vigentesDaFamilia`): a **cadeia** (`ajuste_de`) substitui, e as tentativas **irmãs**
  do mesmo documento colapsam na mais recente. O **plano de ensino** fica só com a cadeia: dois
  planos da mesma turma e ciclo com objetivos diferentes são dois documentos, e a primeira versão da
  regra escondia o plano que um PO observa — foi `provar-apagar-da-listagem` que o apanhou, ao ficar
  vermelha. Nada se perde: os envelopes escondidos continuam no acervo e no índice, os **estados**
  derivam de todos, e a regra de proveniência dos Bastidores não passou por esta função. A linha diz
  quantas versões guardou. Prova nova: `provar-vigente-na-listagem`, 21 asserções.

- **03/11/2026** — **Uma correção minha: não eram «três decisões de produto».** Nenhum dos três
  campos é perda: a linha da escola saiu do corpo a 28/10 (está no `title` e no `escola:`); a
  rubrica deixou de ser tabela de critérios a 26/10 (o plano declara a régua); e a relação
  objetivo ↔ aula chega invertida, na tabela dos marcos. As **bancadas** é que descreviam o
  documento de antes. E a da sequência media-se a si mesma (pedia um verbete que o alfabeto não
  tem). `provar-plano-completo` 18 verificações; `provar-derivados-da-sequencia` 26 asserções.
  Nada se apaga.

- **03/11/2026** — **Duas bancadas voltam a medir, e o fixture é que tinha morrido.** O
  `provar-plano-matriz` servia a pasta de uma escola expurgada em 15/10/2026 e morria na primeira
  asserção; sob o vermelho havia cinco asserções que mediam o dia em que foram escritas (o número
  de nós, a secção «Estrutura de cada aula», a tabela da rubrica, o endereço da sequência, o bloco
  «(P-10)»). O fixture passa a ser `porta/` e o molde `modelo/ciclos/`. E um defeito de verdade:
  «Turmas observadas» no documento × «Turma observada» no formulário — o plano é de uma turma. As
  duas bancadas estavam fora do Git e entram agora. `provar-plano-matriz` 52/52,
  `provar-po-completo` 17.

- **03/11/2026** — **O «Apagar» do registo solto volta à listagem, e é botão.** Sumiu na migração
  para a página da Área do Professor, e na anamnese era um link para o formulário de edição. A regra
  é a mesma das duas famílias: solto → Editar e Apagar; vinculado a um PO ou derivado → só Ajustar
  (e o servidor recusa o `DELETE` com 409); PO → nunca. O clique exige a senha já conferida, nomeia
  o sujeito e recarrega. Três defeitos no caminho: a rota relativa sem o prefixo da porta (404), o
  `apagar` do acervo a exigir token enquanto o `guardar` caía no KV (500), e o `\n` da confirmação
  a quebrar o script gerado. Prova nova: `provar-apagar-da-listagem`, 31 asserções.

- **03/11/2026** — **A sequência não inventa linha.** Saiu o «Adicionar linha», saiu o ✕, saiu o
  campo livre do conteúdo e saiu o `extras` da derivação: o repertório nasce nos bastidores
  (verbete), é acordado na curadoria, e a tabela só o encontra com o objetivo e o bloco — uma linha
  acrescentada aqui seria um acordo que ninguém fez. O caminho legítimo fica (mais um parâmetro →
  mais linhas), e o rodapé passou a dizer de onde a linha vem, distinguindo a distribuição do
  volume, onde a proporção se escreve. Duas asserções do `provar-plano-matriz` guardavam a regra de
  ontem e passaram a afirmar o contrário, com a razão ao lado. Prova: `provar-sequencia-que-acompanha`,
  33 asserções.

- **03/11/2026** — **A sequência acompanha os objetivos.** A tabela mostrava linhas a nomear os
  objetivos 2 e 3 depois de a lista ter ficado com um. A pergunta «é dinâmica ou é mock?» teve
  resposta medida: **é dinâmica, e não há mock** (a pasta `teste/` só é lida pelos bancos). O que
  ficou preso foi o objetivo: a linha de um objetivo apagado **não é memória** — a coluna é
  `somenteLeitura` e quem a escreve é o sistema — e a autoria da semente morria com a página. A
  regra passou a viver em `motor/nucleo/sequencia.js` e serve a tela, o `.md` do plano e a
  `aula-01.md`. A **chave da linha passou a ser o NÚMERO** do objetivo (pelo texto, corrigir a
  redacção duplicava a linha — e era esse o «campo aberto/vazio»). O **✕ passou a existir**, e
  apareceu por baixo o defeito que o tornava inútil: a trava da senha acendia todos os controles
  travados por regra ao ser validada. Prova nova: `provar-sequencia-que-acompanha`, 27 asserções.

- **03/11/2026** — **A metodologia é do professor, e não se pergunta duas vezes.** O Bloco 1 do
  plano pedia «Metodologia de referência» e «Quem escolhe a metodologia» («Eu escolho · A escola
  impõe»), e os dois já estavam respondidos na curadoria. O **item 5 deixou de existir** (a
  premissa é do domínio e é permanente: o professor escolhe), e o **item 4 passou a leitura do
  cabeçalho** (`noCabecalho` + `daCuradoria: 'tradicao'`), com o rótulo do catálogo. O **envelope
  continua a levar o valor semeado** — é dele que o `.md` e o PO o extraem. Dois defeitos
  apanhados pelo caminho: `daCuradoria()` lia uma string caractere a caractere, e os rótulos das
  tradições não chegavam à porta. Prova nova: `provar-metodologia-no-cabecalho`, 20 asserções.
  `provar-teste` voltou a verde (45) ao deixar de escrever à mão o número de nós do cabeçalho.

- **03/11/2026** — **O dono da música não é compasso.** A coluna «Compasso» da sequência do plano
  mostrava `2/4@breu`; o sufixo é o dono do registo do alfabeto (armazenamento). Limpo na **fonte**
  (`musicasDosExercicios` usa `musicaDaChave` do núcleo e deduplica — catálogo e escola podem
  declarar a mesma música) e na **tela** (`musicasDoExercicio`), e o **dado fica como está**: a
  chave continua `8|2/4@breu` (P-03/P-04). Provado por `provar-compasso-limpo`, 16 asserções, com
  o controlo da §C a provar que a bancada serve mesmo o sufixo.

- **03/11/2026** — **A lista da curadoria só promete o que existe, os rótulos ficaram um só, e o
  formulário deixou de explicar.** O menu de conteúdos oferecia o vocabulário inteiro — 93
  palavras — e duas tinham decomposição; passa a oferecer os exercícios que **têm notação**
  (`exerciciosComNotacao()`: verbete com música e, dentro dela, ao menos um trecho), e o que já
  está gravado continua a ler-se (as fichas vêm do registo, não do menu). Os **oito rótulos** do
  formulário vestem a mesma peça — «Alunas» e «Conteúdos desta curadoria» eram `<label>` nu, e o
  navegador desenhava-os em linha, com outra cor e outro peso —, e com eles três sítios que
  ninguém tinha visto. Saíram dez textos: o «(nada escolhido ainda)» e o `mostrarVazio`, as
  legendas «— opcional; sem escolha…», a instrução de clique dos sinais, a frase da posição, os
  avisos de estado vazio do passo 6 e do rodapé, e as opções que rotulavam a ausência de escolha.
  **Ficou o feedback que informa** (nove blocos). Prova nova: `provar-curadoria-e-limpeza`, 22
  asserções. Efeito medido: `provar-producao` de 151/155 para **153/156** (a asserção «nenhum
  formulário traz explicação» estava vermelha e passou), e `provar-conteudos-e-estado-da-turma` de
  74 para **75**.

- **03/11/2026** — **A curadoria chegou ao plano, e o que a travava era um nome repetido.**
  `porta/index.html` tinha duas funções chamadas `turmaDoPlano` — a que devolve a turma e a que
  devolve uma lista de nomes (02/11) —, e a segunda ganhava para todos os chamadores, por hoisting.
  O plano deixou de ler a turma (calendário, frequência, duração, total de aulas) e a coluna
  «Conteúdo do nível» deixou de mostrar o que a direção curou — sem uma palavra na tela. Nas
  mesmas condições, e no mesmo dia, apareceram mais duas na Produção (`cancelarEdicao` e
  `temposDaContagem`): o «Cancelar» da turma corria o do verbete. As três foram renomeadas, e a
  prova nova (`provar-plano-e-curadoria`, 12 asserções) mede a **classe**: nenhum bloco de cliente
  declara a mesma função duas vezes. `provar-teste` passou de vermelho a **45 verdes**, e
  `provar-cartao-da-turma` de 6 falhas a 4. Do lado do estado: a curadoria está registada e o
  `repertorio` chega ao formulário, mas **não há plano nem PO guardados**, e o token do `.dev.vars`
  está morto (401).

- **03/11/2026** — **A auditoria da turma mudou o diagnóstico, e o conteúdo foi para a curadoria.**
  A pergunta era se editar uma turma já curada fere a proveniência. A resposta: a rota já recusava a
  turma **presa a um plano**, mas a turma apenas **curada** gravava tudo — inclusive o **nome**, que
  é o que a curadoria guarda. Renomear partia a ligação **em silêncio**. O defeito era a
  **assimetria** (três estados no professor, dois na turma), e a correção é
  `motor/nucleo/estado-da-turma.js` com três nomes (`livre` · `curada` · `vinculada`) lidos pela
  rota, pelo `DELETE` e pelo cartão. A **nota** da turma saiu do cadastro (o que está gravado fica),
  e os **conteúdos** passaram para o formulário da curadoria — `motor/nucleo/conteudos.js` compõe o
  mapa antigo com o `repertorio` das curadorias, e nada se perde. O formulário da curadoria passou a
  **filtrar modalidades pelas habilitações** do perfil do professor e a **seguir a modalidade** nas
  tradições (`motor/nucleo/tradicoes.js`, com a lista própria a vencer a compartilhada). Entrou
  `indices/esquema/tipos.json` com o tipo `perfil` — o `perfil.json` criado pela tela era o primeiro
  ficheiro do acervo sem tipo declarado.

- **02/11/2026** — **O motor dos produtos começou: dicionário e syllabus.** Dois módulos puros em
  `motor/nucleo/produtos/`, a ponte em `motor/servidor/produtos.js`, o CLI `motor/produtos.js`, e a
  prova `provar-produtos` (52 asserções). O produto **declara o que falta** — `[Preencher]` para a
  definição e a origem, lacuna para o exercício sem verbete, `[conferir]` para o verbete que não
  fecha (sem publicar a contagem), lacuna para o nível sem unidades. A **composição** catálogo ×
  escola passou a existir como função (`compor`) e as adições ficam **fora** do produto por omissão
  — mas os ficheiros continuam um só, e `termo-repo.js` não mudou. A **aula pronta** não foi
  começada.
- **02/11/2026** — **A segunda passagem sobre a mesma tela, e ela reverteu três decisões da manhã.**
  O rótulo da tradição passou de CAIXA ALTA a **Title Case** (`RAD` fica como sigla), com o mapa no
  próprio `tradicoes.json`; o **«Apagar o verbete» saiu do passo 6** e vive só na listagem; e a
  **navegação passou a bloquear para a frente** (o passo seguinte e o «Seguir» desactivados até os
  obrigatórios da etapa, o «Voltar» sempre livre). O passo 1 passou a **ler e congelar o passo 2**:
  escolhido um exercício, categoria, tradição e «o que acontece» vêm do dicionário e ficam
  `disabled`. E o `sugerirMetodo`, que punha uma `Compartilhada` a mais na lista, deixou de
  acrescentar a opção quando ela já existe.
- **02/11/2026** — **O `ED`/`EI` deixaram de se chamar «en dehors»/«en dedans».** Passam a
  **«varredura para fora/dentro»**: os glifos `↺`/`↻` já diziam «rotação», e as duas entradas com
  nome estrangeiro eram a redundância que ela viu no passo 5. Os sinais **não saíram**, e o dado
  antigo continua válido. Alfabeto na versão **31**.
- **02/11/2026** — **As fixtures do `breu` passaram a Plié · Battement tendu · Battement fondu**,
  com `musica` e `celulas` pré-escritas (`Plié` em 8 tempos de 4/4; os outros dois com um en croix
  completo). As curadorias acompanham. O preenchedor passou a **escolher** o exercício no passo 2 —
  e a regressão que o travava (chamava `modoExercicio`, removida no passo 1) está corrigida.
- **02/11/2026** — **O dicionário e o syllabus entraram no esquema dos índices como `prevista`**
  (`termo`, `verbete`, e a relação `verbete → termo`). É o §4.1 do `PLANO-INDICES.md` a funcionar:
  declarar antes de emitir. A proveniência não se declara ali — já é respondida pelo acervo.
- **02/11/2026** — **O alfabeto ficou sem verbetes, e as provas deixaram de depender do conteúdo.**
  Ela apagou os onze verbetes pela Produção (onze commits, versão **30**, só o `_comentario`). O
  `provar-verbete` passou a **plantar** os exercícios que precisa; o `provar-notacao` declara as
  secções de composição **NÃO MEDIDAS**, com o motivo — plantar verbetes meus para voltar a verde
  seria medir o meu conteúdo a fingir que é o dela.
- **02/11/2026** — **O verbete ganhou proveniência, e o `UPDATE` virou ajuste.** O `DELETE` recusa
  (409) quando o exercício compõe um plano de ensino ou o repertório de uma curadoria, e diz o
  caminho («Descontinuar»). Num verbete em uso, gravar é um **ajuste**: o estado anterior fica em
  `versoes[]` com a data em que deixou de valer, e a composição escolhe o estado que valia **na data
  do envelope**. Ela escolheu esta opção (B) entre três. Um verbete sem `versoes` lê-se como antes —
  não houve migração.
- **02/11/2026** — **A tradição de referência em caixa alta e com CUBANA.** *(Rótulo corrigido na
  mesma data — ver a entrada mais recente da lista: o ecrã passou a Title Case, com o mapa em
  `tradicoes.json`.)* A lista é uma só e alimenta os quatro selectores; o dado continua a guardar a
  chave. A Cubana não ganhou linhas de nomenclatura — não se inventam.
- **02/11/2026** — **O «Gravar verbete» desactivado sem decomposição, e o passo 1 a acender com o
  nome.** A categoria, a tradição e «o que acontece» só valem quando há exercício (nome novo **ou**
  escolhido no passo 2). E o método do exercício herda a tradição dele — sem atropelar uma escolha à
  mão.
- **02/11/2026** — **A música não se muda por baixo dos trechos: bloqueia-se.** Escrever os tempos à
  mão apagava a decomposição no mesmo instante, sem aviso — e ela foi categórica: «não pode editar
  esse campo». Com trechos, os tempos ficam só de leitura e o compasso desactivado, e a nota manda
  ao «Duplicar o exercício». O «Limpar» e o «Apagar» libertam o campo.
- **02/11/2026** — **O verbo apagar o verbete existe.** O `DELETE` respondia 409 com a P-03/P-04 e
  passa a apagar: exige o **nome** (um `DELETE` sem corpo apagaria «o que estivesse lá»), sobe a
  versão e grava com `chore(notacao): apagar o verbete «X»`. O **vocabulário não se toca**, e a
  consequência (aula publicada em lacuna) é dita na pergunta, antes do gesto.
- **02/11/2026** — **Os passos arrumaram-se, e o passo 1 ficou condicional.** A frase do exercício
  subiu para o passo 1 (é a definição, e nasce com o nome); sem nome nada é obrigatório, com nome
  são-no a frase, a categoria e a tradição — e os dois escolhedores deixaram de nascer respondidos.
  O campo «posição em que o exercício acontece» **saiu**. A decomposição ganhou o «lê-se» atrás de um
  clique e a frase deixou de se repetir em cada linha.
- **02/11/2026** — **A listagem do verbete passou a ser o cartão das turmas** (a opção 1, escolhida
  por ela): o nome e o selo em cima, o complemento por baixo, e as três caixinhas `Música` ·
  `Direção` · `Notação` com o «?». A da notação abre a decomposição trecho a trecho, com o compasso
  do motor. Um handler meu foi **apagado** no caminho: a página já tinha o ouvinte de `.trio-item` no
  `document`, e o meu desfazia o dele.
- **02/11/2026** — **O vocabulário cresceu:** a categoria **Cabeça**, `↻` rotação para dentro, `○`
  abre, os lados nos três eixos, as direções **para dentro** e **para fora**, e **de lado · perfil** —
  com o `épaulement` corrigido de «ombros rodados» para «ombro à frente». Tudo em **conteúdo**, sem
  tocar em `tools/` nem no motor.
- **02/11/2026** — **Editar e esticar a música SUBSTITUI — não havia INSERT, havia uma chave.** A
  chave de uma música é `<tempos>|<compasso>`; mudar os tempos cria outro registo, e o antigo ficava
  ao lado. A tela passa a mandar `musicaAnterior`, o servidor apaga a chave antiga com quatro
  guardas, e a nota di-lo **antes** de acontecer. A caixa «guardar como música nova» é a outra
  intenção, e só aparece quando a música mudou.
- **02/11/2026** — **A bancada da listagem dos verbetes, para ver e validar.** O pedido de uma
  proposta em `experimentos/propostas/` não tinha sido entregue — implementei a listagem na Produção
  em vez de a propor. Existe agora `proposta-verbetes.html`, com três opções medidas a 320, 390, 768
  e 1280 px (66 / 198 / 561 px por cartão a 320) e sem transbordo. E o `construir.js` deixou de ser
  tudo-ou-nada: sem ciclo gerado, constrói as bancadas que não dependem de pacote.
- **02/11/2026** — **«O item duplicado não aparece»: ele estava gravado, faltava a porta.** Ela
  duplicou o `Plié` de 8 para 16 tempos, gravou, e o registo não apareceu — mas o remoto dizia
  `04e2597 docs(notacao): editar «Plié» (16|4/4)`, e o alfabeto, versão 17, tinha as duas músicas. A
  falha era outra: a listagem dizia «2 músicas» e o «editar» abria sempre a primeira. Passa a haver
  **uma linha por música**, com a música no botão, e o servidor manda `detalhePorMusica`.
- **02/11/2026** — **A correcção volta a andar por passos, e o sinal troca-se no lugar.** Os três
  painéis abertos durante a correcção viravam «um formulário único (página única)» — volta a ser um
  painel de cada vez, sem o «Editar» voltar a saltar de passo. E a ficha do sinal passou a ser
  clicável: marca-se uma e clica-se o sinal novo, que entra **naquele índice**, com os vizinhos
  intactos.
- **02/11/2026** — **As etiquetas passaram a português.** «Première position» era lido em cru na
  listagem. O `nome` passou a ser um campo do vocabulário (13 posições), a tela mostra `nome ||
  termo`, e o `termo` continua a ser o que se grava. Os empréstimos que se dizem assim em português
  (`retiré`, `attitude`, `arabesque`) **não** foram traduzidos — traduzi-los seria inventar.
- **02/11/2026** — **«Duplicar o exercício»: a barra repete-se, e a posição não se toca.** O pedido
  dela: o `Plié` em 1ª, 2ª, 4ª e 5ª tem a mesma estrutura rítmica e os mesmos braços, e só a posição
  das pernas muda. O botão clona a decomposição de cada direção e acrescenta-a ao fim da sua lista,
  e **sobe os tempos sozinho** — senão a música declarava 8 com células a cobrir 16. **Não reescreve
  sinal nenhum**, e a razão é medida: o `1ª` está nas duas pistas, e a Alternativa B da proposta
  escreveria `⌒ 2ª → 2ª → 2ª`. A posição muda-se no «Editar». Uma tentativa pelo caminho — conservar
  as células ao declarar uma música nova — foi **revertida pela suite**: 13 asserções passaram a
  medir o exercício anterior. E o `provar-notacao` deixou de estourar: quatro fixtures afirmavam a
  forma de um dado que melhorou (a direção `devant` que o `Plié` já não tem).
- **02/11/2026** — **O 400 do «devant»: um balde vazio que ninguém escolheu.** A console dela deu
  `400` com «a direção «devant» não tem célula», e a chave do caso é a frase dela — «em nenhum
  momento eu escolhi «devant»». Não escolheu: o editor deixava ficar `celulas: { devant: [] }` quando
  o último trecho daquela direção saía, e um balde vazio é **invisível** — a tabela percorre células,
  e zero células não desenham linha. A validação estava certa; errado era o editor mandá-lo. `semBaldesVazios`
  passou ao **núcleo** e serve os dois lados, e **não apaga o erro**: só a lista vazia sai, e uma
  chave que não é lista continua a ser acusada — a primeira versão que escrevi engolia-a, e a prova
  apanhou. De caminho saiu uma **quarta** soma em linha (`somaTempos`), que não decidia nada e
  respondia `soma: 12` a um verbete aceite com 8: não bloqueava, só mentia.
- **02/11/2026** — **A tela ainda somava em fila — a régua das pistas tinha ficado a meio.** Ela
  relatou «as células somam 12 tempos e a música declara 8» e perguntou se o motor somava em linha. A
  resposta é sim, e não era o motor: a régua das pistas foi aplicada em **três** sítios e ficou um
  **quarto** — a conta que a página faz antes de enviar, que somava em fila **e sem a repetição**. Um
  `Plié` correcto era recusado na tela antes de chegar ao servidor que já o aceitava: o pior dos dois
  mundos. Passou a chamar `cobertura()`, a mesma função da tabela, e a mensagem mostra as pistas. E a
  **recusa deixou de navegar** — era `irParaPasso(...)`, e atirava o professor para o passo da música
  sem o deixar ler. **A lição:** um número calculado em quatro sítios é um número calculado em zero;
  a conta passou a ter um nome e a prova mede a conta, não a sua repetição.
- **02/11/2026** — **«Acrescentar trecho» desaparece durante a correcção — e eu tinha descrito mal o
  defeito.** Escrevi que, em edição, o «Acrescentar trecho» estava visível e **acrescentava** em vez
  de guardar. **Medido, é falso:** havia **um** botão cujo rótulo alternava, e em correcção ele dizia
  «Guardar a alteração» e guardava. Não havia acção errada. Mas o pedido resolve-se na mesma e o
  resultado é melhor: um rótulo que muda **não esconde**, e o que se pediu foi esconder. Passaram a
  ser **dois botões** — `vb-cel-acrescentar` sai de cena em correcção, `vb-cel-guardar` entra —, com
  **uma função** partilhada para não divergirem. 145 asserções em `provar-celula`.
- **02/11/2026** — **Corrigir um trecho reescrevia-lhe o compasso — a causa era uma linha.** O
  handler fazia `splice` + `push` e a célula corrigida ia para o fim; como o compasso sai da **ordem**
  (um relógio por pista, da entrega anterior), corrigir a descrição do braço do compasso 1 empurrava-o
  para o 2. Passa a **substituir no lugar** — e quando a direção muda, a célula entra na mesma
  posição ordinal, não no fim. No mesmo dia, os **três redireccionamentos** que ela relatou saíram:
  vinham todos de `irParaPasso(PASSOS_DO_TRECHO[0])`, e a regra nova é **a área do trecho abrir-se
  onde se está** — os painéis 4, 5 e o último, porque é no último que vive o botão de guardar.
  Acrescentar, guardar e cancelar não mudam de passo. O «Cancelar» já era o comportamento correcto;
  passa a ser regra escrita em vez de acidente.
- **02/11/2026** — **As pistas, e o `Plié` que estava certo.** As células passaram a ser contadas por
  **categoria** e não em fila única — e o defeito que isso resolve é o mais instrutivo do dia: o
  `Plié` somava **12** tempos numa música de **8**, e a gravação o recusava desde a manhã. Medido,
  ele tem **duas pistas**: as pernas fazem os dois compassos (8) e os braços fazem um (4), **em
  paralelo** — o port de bras acontece enquanto o plié acontece. O dado estava certo e a régua é que
  não estava. Com a maior pista, **9 das 13 músicas fecham** (eram 8). A mesma mudança pôs a
  **contagem por pista** (revertendo, com razão, a decisão de 29/10: em duas categorias o mesmo
  instante é simultaneidade, não contradição), a **métrica composta** a oferecer os fins que fecham
  pulso (6/8 são dois pulsos de três, e `1–2` continua possível porque é síncope), a **repetição** na
  célula (`1–2 ×2`, e a multiplicar na conta) e o bloco **«Posições dos pés e braços»** com a
  preparatória e a 3ª de **rótulo duplo** («terceira · quinta»). O **método** entrou no verbete como
  **herança com sobreposição** — o plano já o declara e é obrigatório, e duas declarações do mesmo
  facto divergem ao primeiro caso.
- **02/11/2026** — **A licença em três camadas, o pacote próprio, e uma citação minha que era falsa.** A
  licença estava aberta desde 18/09/2026 e ficou decidida: a **máquina** é proprietária e **não** se
  licencia com os produtos; o **catálogo** licencia-se **por escola**, vinculado à **fotografia
  datada**, perpétuo para a versão contratada, com uso interno livre e revenda proibida, atribuição
  preservada no `fonte`; e **o que a escola acrescenta é dela**, com uma concessão estreita para a via
  inversa. E o produto é **pacote próprio**, com âncora, versão e licença independentes do ciclo. A
  licença obrigou a medir o que faltava para a poder executar — **25 das 59 descrições não têm
  `fonte`**, e sem origem declarada não entram na edição paga. De caminho, **corrigi uma citação minha
  falsa em cinco sítios**: «a `ARQUITETURA-GERAL.md:109` diz a definir»; a frase existe, mas é do
  `REGISTRO.md:109` (entrada de 18/09/2026). O número estava certo; o ficheiro, não.
- **02/11/2026** — **Os três produtos, um motor só, e as nove colisões.** A pesquisadora decidiu
  criar **dicionário, syllabus e aula pronta** — gerados **antes do ciclo**, entregues conforme o
  plano contratado (Básico e Intermediário «fazem tudo»; o Avançado «recebe as benesses»). A
  pergunta dela — **um motor ou dois?** — ficou respondida com medição: **um motor, três saídas, três
  manifestos**. Um, porque o núcleo já é único e a fronteira é provada por máquina, porque a leitura
  do catálogo já está duplicada uma vez, porque a notação e a âncora são uma convenção só, e porque a
  entrega vive em `tools/`, que é congelado. Três, porque **o manifesto é que parte** — e é ali que
  vive a granularidade da negociação. O plano
  ([PLANO-PRODUTOS-DO-MOTOR.md](./PLANO-PRODUTOS-DO-MOTOR.md)) tem seis fases, declara **nove
  colisões** com os planos existentes e o ajuste de cada uma, e mostra que **o que falta é conteúdo**,
  não código: 11 dos 13 níveis estão vazios, a camada pedagógica não existe, 4 músicas não fecham,
  falta licença e falta a separação catálogo × escola. Mudaram de texto, hoje, a **C22** (o gerador
  não é o quarto produto: é o meio) e a **L14** (a turma pronta referencia o syllabus).
- **02/11/2026** — **Três eixos, o ritmo obrigatório, e a C22 com o veredicto do motor.** Três
  correções que a pesquisadora fez, e as três eram minhas: (1) **o modelo não tem um eixo, tem
  três** — `"eixo"` aparece uma vez porque o rótulo é **prefixo por concatenação**, e é ele que
  rotula «Musicalidade» e «Expressão» como «Técnica — …» enquanto o conteúdo delas é poiésis; (2)
  **o ritmo nunca esteve em aberto** — eu o procurei no **catálogo** e ele vive no **cadastro da
  turma**, obrigatório, conferido em quatro portas de recusa; e é **do contrato**, não do conteúdo,
  o que fechou a **C19 pela negativa** (a turma pronta vende-se sem ritmo); (3) **o corpo já está no
  ciclo**, em cinco sítios, e o que falta é só a ligação **ao exercício**. No mesmo dia nasceu a
  **C22** — o verbete como átomo do syllabus, os **quatro degraus** (dicionário → syllabus → aula
  pronta → gerador) com os bloqueios medidos, e o **veredicto: o motor é viável**, com quatro
  arrumações (identidade estável, separação catálogo × escola, camada pedagógica, uma leitura só do
  vocabulário) e **quatro músicas por corrigir** antes de qualquer regravação. A **L14** ganhou a
  lacuna **(0)** — a separação é pré-requisito do degrau 1 — e perdeu a entrega do ritmo no catálogo.
  **Nenhuma linha de código mudou**: é fotografia, decisão e registo.
- **02/11/2026** — **O exercício novo é o passo 1, e o «+» deixou de existir.** A primeira tentativa
  moveu os campos do cadastro para dentro do passo 1 e manteve o «+», o «Gravar exercício» e o
  «Cancelar» — «não é isso: eu vou ter um step a mais». A segunda tirou-os: são **seis passos**, o
  primeiro são os campos do exercício novo, e quem grava o termo é o **«Seguir →»** que já existia.
  Avançar sem nome não grava nada; «Limpar» e «Editar» levam ao passo 2, onde vive o seletor. O
  rótulo do passo 2 encurtou para «O exercício» porque a tira cortava o mais comprido. 130
  asserções em `provar-celula`.
- **02/11/2026** — **O cadastro do exercício é o passo 1, e a gravação confere a música.** O «+» do
  verbete abria um «modo» que escondia o formulário e a tira dos passos e bloqueava o `select`; a
  pesquisadora: «o professor não vai saber que quando ele clicar em cancelar, ele vai para onde de
  facto ele cria o verbete da aula». O cadastro passou a viver **dentro do passo 1** — a tira fica,
  nada é bloqueado, «Cancelar» fecha só o cadastro —, o exercício criado fica escolhido no campo que
  alimenta, e **nada disto toca no KV**: o termo vai para o vocabulário do repositório e a lista lê o
  mesmo ficheiro. No mesmo dia, a **gravação do verbete passou a conferir a música**: as células têm
  de somar os tempos declarados, e a recusa nomeia o passo 2 (a música) e o passo 3 (para onde) —
  era o buraco por onde passaram o `Battement fondu` (6 tempos numa música de 2) e o `Plié` (12 numa
  de 8). E a **Regra 15 foi substituída**, com nota no `REGRAS.md` e motivo declarado: nenhum
  arquivo paralelo de musicalidade existe, e a musicalidade não é um bloco. **CONFIRMADO** por
  `provar-celula` (128/128), `provar-verbete`, e um `alvoDoRecado` que passou a ignorar os recados de
  um widget aninhado — defeito que a prova apanhou e que a mudança tinha introduzido.
- **02/11/2026** — **A §4 dizia uma coisa falsa, e o aspecto físico chegou ao plano.** A §4 da Aula
  01 afirmava, em tabela, «Exercícios neste bloco | nenhum» sobre o bloco de musicalidade — e as três
  linhas de exercício da mesma aula traziam `Tempos` e `Compasso` preenchidos. O erro era de
  **modelo**: tratava a musicalidade como um bloco ao lado de Barra/Centro/Expressão, quando ela é uma
  **forma de olhar todos eles**. Passou a consolidar **por compasso**, um exercício **uma vez só** (o
  mesmo fondu em três blocos é a mesma música), com a contagem *e* o que cai nela, e `conferir` onde a
  grade do verbete não fecha nos tempos — medido: fondu 6 tempos numa música de 2, plié 12 onde a
  música tem 8. Saíram a «fatia do plano» (30% — 27 tempos, Regra 9) e o subtítulo repetido da §3, que
  passou a chamar-se **«Distribuição do tempo pelos blocos»**. No mesmo dia, o **plano de ensino**
  ganhou o **bloco 10, «Aspecto físico — força e flexibilidade»** — o primeiro dos três eixos macro,
  lido das anamneses da turma (quinze campos em dois grupos), consolidado por aspecto e **nunca por
  aluna**, com a régua na ordem das opções da própria anamnese. Resolve a **C20** do
  `PLANEJAMENTO-LASTRO.md` pela alternativa (b). Ficou também refrescada a cópia da porta de um ciclo
  criado e nunca preenchido (`pe-torto/01/batata`) que travava o commit de quem mexe em `porta/`.
  **CONFIRMADO** por `provar-o-que-vem-do-dado` (cinco asserções novas), `check-schemas` TUDO CERTO
  nos 18 professores, `check-pacote` 0/0 e `hash-ciclo --check` íntegro. **Não publicado**, de
  propósito: ela vai expurgar e recriar a escola.
- **02/11/2026** — **A aula deixa de afirmar o que ninguém escreveu; a musicalidade consolida-se; a
  prova da porta volta a correr.** Quatro secções da Aula 01 diziam coisas que ninguém escreveu (a §2
  anunciava «força e flexibilidade» sobre o campo da sala, a §4 tinha um «Pulso» fixo, a §6 chamava
  «simulado» a um ciclo publicado, a §8 era um `[Preencher]` mudo), e a pesquisadora foi secção a
  secção com a pergunta certa: «isso vem do lugar certo? é código duro?». O método de resposta foi
  **mutação** — trocar uma resposta do envelope e ver se a secção muda —, e é o que fica: uma secção
  que o gerador escreve à mão é uma afirmação do sistema sobre a aula de alguém. A §6 passou a dois
  **links** com objetivo, a §8 a dizer o **estado** com os três casos, a §4 a **consolidar** por música
  o que o verbete e a sequência já dizem, e a §2 a dizer o que o corpo é. A par disso: a **força e a
  flexibilidade** chegaram ao PO pela **anamnese** com os 15 campos que ela escolheu, e o registo
  completo abre noutra aba; o **bloco 10** do plano dividiu-se em dois (música/vídeo e repertório); a
  **geração ficou reproduzível** (o `gerado_em` vem das fontes, o `/ID` do PDF está fixo — duas
  gerações seguidas dão o mesmo md5 e a árvore fica limpa); e um **erro meu** de três sessões foi
  corrigido: a musicalidade **não** é uma lacuna. **CONFIRMADO** por `provar-o-que-vem-do-dado`,
  `provar-forca-e-flexibilidade` (17/0, com controle negativo), `check-pacote` 0/0, e a página ao ar.
  No mesmo dia, `provar-ajustes-anamnese` passou de **56** a **126** asserções: o mock do `location`
  não tinha `replace` e a prova morria a meio — **70 asserções nunca se tinham executado**, e doze
  mediam um aviso em vez da grade. A página estava certa nas quatro coisas.
- **02/11/2026** — **O molde dos schemas ficou atrás e matou a geração de um ciclo** (`570d900`), e
  depois passou a ter **um leitor só** (`e27e462`). Em 26/10 dois commits removeram `ciclo` e `rubrica`
  do `required` do plano nos doze professores e **não no molde**; cinco professores criados depois
  herdaram o contrato velho, e a `breu` falhou com «campo ausente». O molde é a fonte de todo professor
  novo, e uma cópia sem comparação é uma segunda verdade: agora `motor/nucleo/schemas.js` é o único que
  o lê, o `tools/gerar-schemas.js` é a porta para o shell, o provisionador do Worker deixou de o pedir
  por HTTP, e `check-schemas.js --professor` corre no `pre-commit` e no `gerar-ciclo.yml` — um contrato
  atrasado falha **antes** da geração, com o nome do comando que o corrige.
- **01–02/11/2026** — **A página do Vocabulário saiu; o exercício nasce no «+» do verbete**
  (`ea6cd0d`). O verbete já tem o termo, a categoria e a tradição, e o vocabulário técnico era a mesma
  coisa num segundo endereço. O botão «Carregar as turmas iniciais» foi para dentro do «+»; o futuro
  comercial dele (turmas prontas para o professor só curar) está registado como frente no
  `PLANEAMENTO-LASTRO.md` (L14), e a contradição com o «o professor cria a turma» também (C19).
- **02/11/2026** — **A seta sobe ao título, os passos descem para a linha inteira, o vocabulário deixa
  de ser só do ballet** (`a5275c3`). `tituloComAcordeao()` ganhou o `idDoBotao`; a faixa dos passos
  passou a atravessar a grelha em Turmas e no verbete; a categoria é `Pé · Peso · Perna · Braço` (o
  `Plié` estava errado) e as orientações do corpo têm **nome português** com a tradição ao lado.
- **01/11/2026** — **A janela vista por todas as bandas** (`82d37ef`). A §5 «Guia de observação» da
  aula era a **única** parte do documento que o código não reproduzia (16 de 18 linhas divergentes; a
  prosa não existia em código nenhum) — escrita à mão, e apagada em silêncio pela geração seguinte. E
  a regra do `;` estava no código desde `ac6caa0` sem ter chegado aos **três** artefatos gravados (a
  fonte da folha, a declaração do schema, o config do formulário). Agora a §5 deriva do PO pela mesma
  função da folha, e a tela desenha **8 campos de critério em vez de 4**. **CONFIRMADO** por
  `provar-janela-do-lancamento` (11/0, com controle negativo) e pela reprodutibilidade byte a byte da
  fonte da aula. De passagem caíram dois defeitos escondidos: `mesclarDeclaracao` casava blocos por
  título (a linha de base mudava de nome entre a derivação e a folha), e o título «(P-10)» fazia a
  **primeira** declaração de qualquer variante nova nunca validar — `provar-aula-e-plano-legiveis`,
  que falhava antes, passa a 12/12.
- **01/11/2026** — **O que a sequência já responde não se escreve outra vez** (`ac6caa0`), e o `;`
  que separa os itens do PO. O bloco 10 do plano pedia o compasso que o **verbete** já declara e os
  exercícios que a **sequência** já demonstra; agora a música **sobe** acima de um campo que pede só o
  link do vídeo, o repertório é **somente leitura** e semeado, e a **sequência semeia-se sozinha** (era
  gravada só se o nó fosse aberto — a página da aula podia sair sem exercício nenhum). A autoria é
  respeitada por comparação com a semente anterior, e a semente não herda de si mesma. De passagem:
  `itensDaDimensao()` corta por `;`, e dois critérios que caíam numa coluna da folha passaram a ser
  duas. **CONFIRMADO** por `provar-derivados-da-sequencia` (26/0, com 14 falhas no código de antes) e
  `provar-dimensoes-plano` (11/11 — a bancada estava morta e foi consertada de passagem).
  **NÃO CONFIRMADO ao ar**: só no deploy.
- **01/11/2026** — **O conteúdo da porta no scaffold, que é o que a escola publica.** A verificação ao
  ar mostrou a página da escola a servir a explicação **velha** do nó 19 e **sem** o `somenteLeitura`:
  a mudança estava no repositório, no pacote da turma e no ar da raiz, e não no ar da escola. A causa
  é o `montar-publicacao`, que copia a base do **pacote-zero**, e o `gerar-ciclo.sh` recusa correr
  sobre um ciclo-zero — a cópia do scaffold actualiza-se **à mão**. O «Circuito» do
  `check-identidade` compara páginas e assets, **não o conteúdo**. Medido antes de corrigir: contra
  `5bfb7ae` eram **25 nós e 0 divergentes** — não era dívida antiga, é uma armadilha do processo.
  **CONFIRMADO** ao ar em `22b42ce`. **A checagem que faltaria é em `tools/`, que é congelado** — fica
  registada, não feita.

- **01/11/2026** — **O número que se lê é o do roteiro, nos três documentos.** Três réguas para a
  mesma contagem: o roteiro contava os **degraus**, o título da página o **índice do mapa** (com os
  nós de cabeçalho dentro) e a barra o **mapa inteiro**. Medido: anamnese 53/53 (**0**
  desalinhados — e é por isso que o defeito passou, porque é o documento onde ele não aparece),
  plano de ensino 26 nós/19 degraus com **18 desalinhados** (Δ −7), plano de observação 33/30 com
  **os 30**. `numerosDoMapa()` passa a ser a régua única, e o que não tem degrau continua a barrar o
  fecho — **nomeado**, não somado. **CONFIRMADO**: `provar-numeros-do-roteiro` **29/0**, e **12
  falhas** com o código de `HEAD` (controle negativo). Publicado em `10bf6b6`.
- **01/11/2026** — **A «Sequência de exercícios por bloco» passa a demonstrativo.** `Bloco` e
  `Objetivo específico` entram em `somenteLeitura` — vêm de «Blocos de cada objetivo» e dos marcos, e
  o conteúdo do nível vem da matriz do «Parâmetro de medição», e os tempos e o compasso do verbete.
  O texto do nó passa a dizer que é «um DEMONSTRATIVO, e não um segundo lugar para decidir». Fica
  livre o conteúdo sem parâmetro marcado e o «Adicionar linha». **CONFIRMADO** na tela (as duas
  colunas saem `travada`). Publicado em `10bf6b6`.

- **01/11/2026** — **A tira dos passos sai do formulário, e o verbete fica em cinco.** Três pedidos
  numa frase: o formulário volta ao **padrão** (à esquerda, listagem **presa** à direita) — a regra que
  forçava a coluna única saiu, porque a causa dela (sete passos numa coluna de 34rem) desapareceu —; a
  tira passa a viver **fora do `<form>`**, modelo da turma; e o **exercício, a frase e a posição**
  fundem-se no passo 1. Ficam **cinco**: 1 O exercício · 2 A música · 3 Para onde · 4 Os sinais · 5 A
  decomposição, com `PASSOS_DO_TRECHO` em `[3, 4]`. **Uma armadilha paga:** com a tira fora, ela
  deixou de sair de borla no modo do exercício, e o `hidden` não chegava — a regra de autor vence a do
  navegador —, daí `.passos[hidden]{display:none;}`. O resumo do passo 1 passou a dizer o nome **e a
  posição**. **CONFIRMADO**: `provar-celula` **115/0** (eram 106), as restantes provas verdes,
  `check-identidade` 20/20, `check-pacote` 0 erro, âncora íntegra com o **selo na versão 9**.
  Publicado em `b0d781f`.
- **01/11/2026** — **Três verbetes de ensaio no alfabeto.** A pedido dela — «acrescenta também esses
  modelos de teste, pré-preenchidos… assim vai ficar mais fácil eu ficar fazendo os testes» —, entram
  **Grand battement** (`8|4/4`), **Arabesque** (`4|4/4`) e **Rond de jambe à terre** (`8|4/4`, com o
  nome que o **vocabulário** usa; até aqui o alfabeto tinha «Rond de jambe», que não é termo nenhum). O
  alfabeto vai à **versão 9**. Passam pela régua do motor e pela composição **antes** de serem
  escritos. **A decomposição é ensaio** e a música do Arabesque e do Grand battement é escolha minha —
  e o plano passa a trazê-las **travadas**, porque o verbete passou a responder por elas.
  **CONFIRMADO** localmente.
- **01/11/2026** — **Uma prova que o commit citava e o Git não tinha.** A `provar-musica-no-plano.js`
  de `885ea96` ficou fora do repositório (o `experimentos/*` fecha a pasta, faltava o `!`). Entra
  agora, com a razão escrita no `.gitignore`. O caso «sem verbete» passou a ser medido no **Jeté**,
  porque o Arabesque ganhou um.

- **31/10/2026** — **Os tempos e o compasso vêm do verbete.** Ela abriu o nó «Sequência de exercícios
  por bloco», no plano do Nível 3, e o **Battement fondu** — escrito no verbete, com a música `2|4/4` —
  estava com **Tempos** e **Compasso** vazios. O defeito não era o dado: o plano contribui com duas
  coisas para a notação, e juntas são a **chave do verbete** (`<tempos>|<compasso>`), que o verbete já
  declara. Agora, com **uma** música os dois campos vêm preenchidos e **travados** (o par viaja escondido
  e é o que fica gravado); com **várias** (o Battement tendu tem três) são escolha, e só as declaradas se
  oferecem; **sem verbete** (Arabesque, Jeté) fica como era. Uma nota diz de onde vêm e que é o **verbete
  que se altera**. A fonte é o **alfabeto**, lido do `notacao.json` que já vai no Worker — **zero KV** —,
  e o **controle negativo** da prova garante que a regra não está escrita na tela. **CONFIRMADO**:
  `provar-musica-no-plano.js` **18/0** (nova), `provar-celula` 106/0, `provar-parametros-por-parametro`
  21/0, `provar-plano-da-turma` 46/0, `provar-porta-sem-contexto` 44/0, `check-identidade` 20/20,
  `check-pacote` 0 erro, âncora **sem renovação** (esta entrega lê o alfabeto, não o escreve). A prova do
  CRUD do verbete ganhou **fixture própria**: criava o «Battement fondu» do zero e passou a receber 409
  no dia em que ele existe a sério. Publicado em `885ea96`.

- **31/10/2026** — **O plano diz por que um termo da turma não aparece.** Ela criou sete verbetes,
  associou quatro à turma **Balé Nível 3 — Teste 2** e no plano só viu **Jeté e Arabesque**. Duas
  causas, nenhuma visível: (1) os parâmetros de medição são o **conteúdo da turma do plano**, não o
  vocabulário — os planos existentes são do Nível 1 e do Nível 2, e o que ela associou foi ao 3; (2) a
  relação turma↔conteúdo guarda **`rond-de-jambe`**, um id que **nunca existiu** no ficheiro (o termo é
  «Rond de jambe à terre»), e um `filter(Boolean)` **escondia-o em silêncio** — os dois que sobravam
  pareciam a lista inteira. Agora a matriz diz de que turma vêm os parâmetros e quantos estão
  associados, e **acusa os órfãos** com os candidatos, a turma e onde se corrige; sem conteúdo nenhum,
  distingue «a turma não declarou» de «há conteúdo que já não existe». O id **não** se corrige sozinho:
  havia dois candidatos, e escolher seria decidir o que se mede. **CONFIRMADO** localmente: **21
  asserções** (eram 14) com controle negativo, `provar-plano-da-turma` 46/0, `provar-porta-sem-contexto`
  44/0, `check-identidade` 20/20, `check-pacote` 0 erro, âncora íntegra com o **selo na versão 8**, e a
  reprodução com o **dado ao vivo** a dar exactamente o que ela vê. Publicado em `c3f0fb1`.

- **31/10/2026** — **A frase é do exercício, e a listagem diz o que o verbete é.** Três coisas ditas na
  mesma sessão de uso. **Battement dégagé não tinha descrição** — a nota dizia o que os três termos
  *não* são («não tratar como sinônimos perfeitos») e não dizia o que ele é; agora a família do tendu
  tem quatro descrições com a tradição declarada (**59 termos com descrição**, e **23 de 55**
  exercícios com definição), com a `fonte` a dizer que são minhas e a conferir. **A redundância voltou
  pelo preenchimento**: a quarta coluna saíra da tabela, mas «o que acontece» continuava a ser pedido
  a **cada trecho**. A frase passou a ser do **exercício**, escrita uma vez no **passo 2** — nasce daí
  o **sétimo passo**, e o último deixou de ter campo de texto para mostrar o que **fica escrito** em
  cada trecho (frase + «lê-se»). A proveniência foi respeitada: o que está **gravado** vence o
  dicionário, e trocar a música não reescreve a frase. **A secção ficou numa coluna**, com o
  formulário na largura toda e a **listagem abaixo** (recolhido, fica só a listagem), e cada linha
  ganhou **etiquetas derivadas do alfabeto** — posição em selo, e por baixo direções, compasso,
  músicas e trechos. Ficou também corrigido um defeito de leitura: `descontinuado` era lido no topo do
  verbete, onde nunca está. **CONFIRMADO** localmente: **106 asserções** em navegador, `provar-verbete`
  e `provar-notacao` (74) verdes, `provar-celular` **15/15**, `provar-vao-do-botao` **62/62**,
  `check-identidade` **20/20**, `check-pacote` **0 erro**, âncora íntegra (`3601081…`). A conferência ao
  ar fica para depois do push.

- **31/10/2026** — **O verbete em seis passos, e o trecho que se pode corrigir.** Ela viu as duas
  bancadas e escolheu os **passos** («o Step, apesar de ter mais cliques, ele é mais fácil de
  entender»), e pediu o que faltava nelas: **editar um trecho já acrescentado**, com um sinal de que se
  está em edição. O formulário passa a **seis passos** — 1 O exercício · 2 A música · 3 A posição · 4
  Para onde · 5 Os sinais · 6 A decomposição —, um de cada vez, e a tira em cima mostra o que já está
  decidido e serve de navegação. Os três passos do trecho separam **o que o trecho é**, **como se
  escreve** e **o que a decomposição mostra**; a tabela deixou de estar ao lado das escolhas que a
  alimentam. **A peça não é nova**: `.passos`/`.passo`/`.passo-alerta` e o `!` já são a faixa da turma,
  nesta mesma página — só a largura da tira ganhou travas próprias. No **modo de edição**, a linha
  ganha «Editar» e «×»; ao editar, a página vai ao **passo 4** com os valores do trecho, o «!» acende
  nos passos **4 e 5**, o aviso diz **«Em edição — trecho N»**, o botão do 6 passa a **«Guardar a
  alteração»**, a linha perde o «×» e mostra «Cancelar». Defeito encontrado ao medir: a contagem
  recomeçava a contar a **célula em correcção** (um trecho em «1» de 2/4 abria a edição a oferecer
  «2»). **CONFIRMADO** localmente: **96 asserções** em navegador, `provar-producao` **151/152** (a
  falha pré-existente do menu), `check-identidade` **20/20** e a checagem **8 (Peça)** verde,
  `check-pacote` **0 erro**, âncora íntegra (`3601081…`). Publicado em `d7e71ff`; a conferência ao ar
  fica para depois do push.

- **31/10/2026** — **As definições do dicionário no vocabulário, o «lê-se» no campo, e a quarta coluna
  fora.** Ela achou o ajuste anterior incompleto: escolheu o **Grand battement** e a definição que
  apareceu era «Grande batimento da perna de trabalho.», não a que ela tem e leu em voz alta, com
  **detalhe técnico** incluído. O dicionário que forneceu (30 termos) foi fundido no **vocabulário** —
  a verdade única dos termos: **14 termos sem descrição passam a tê-la**, **10 são substituídos**, **6
  são criados** (Aplomb, Bras bas, Adagio, Allegro, Ballon, Legato); de **87 para 93** termos, de **35
  para 55** com descrição, e os exercícios de **12 para 19** com definição, em 55. A `fonte` está
  declarada em todos. O «**lê-se**» passou a ser a **segunda linha do campo** «o que acontece» — a
  definição em cima, «Lê-se: Pé, quinta posição, à frente, quinta posição» em baixo —, e a frase
  **gravada** é composta ao acrescentar, para não se perder quando ela reescreve o campo. A **quinta
  coluna** da tabela (a frase, editável por linha) **saiu**: com a frase a vir da definição, todas as
  linhas diziam o mesmo, e o que muda por trecho é função da notação. **CONFIRMADO** localmente (85
  asserções em navegador; PDF com o **mesmo md5**); a conferência ao ar fica para o deploy.
- **31/10/2026** — **Duas arrumações do formulário, para escolher.** `experimentos/propostas/
  proposta-verbete-acordeao.html` (Proposta 13: quatro painéis, as secções fechadas a dizer o que têm
  dentro) e `proposta-verbete-passos.html` (Proposta 14: quatro passos com uma tira de resumo que é
  também a navegação). Ambas funcionam sobre o dado real. A tira de passos passou a ser peça existente
  quando se viu que `.passos`/`.passo`/`.passo-alerta` já são a faixa da turma na mesma página.
  **DECIDIDO** no mesmo dia: ela escolheu os **passos** (ver a entrada acima, `d7e71ff`).

- **31/10/2026** — **«O que acontece» recebe a definição do exercício, e o «lê-se» desce.** A
  pesquisadora gravou o **primeiro verbete a sério** — *Rond de jambe en l'air* (`73f5330`, alfabeto
  **versão 6**) — e o dado mostrou o defeito: nos três trechos a `descricao` é «rondejambe en l'eir»,
  isto é, o **nome do exercício** escrito num campo que, vazio, não dizia o que queria. O campo passa a
  pré-encher com a **definição do exercício lida do vocabulário** (a rota leva `descricao` e `fonte` em
  cada termo), e a ordem de preferência é **três**: definição do exercício → dicionário **do trecho**
  (indexado pela notação) → vazio; sem o segundo, **43 dos 55** exercícios ficariam sem sugestão (o
  vocabulário tem definição em **12 de 55**). A definição aparece **assim que o exercício é escolhido**,
  a nota diz **de onde veio**, e o que se grava continua a ser a frase da célula (P-03/P-04). O
  «**como se lê**» passou para **abaixo** do campo: a ordem é a da leitura. As duas `.fipp` foram
  **regeradas** (selo desatualizado pela versão 6). Publicado em `7be42cb`. **CONFIRMADO** localmente
  (82 asserções em navegador); a conferência ao ar fica para o deploy.

- **29/10/2026** — **A direção é escolha única, «en face» marca, e a contagem continua o compasso.** A
  pesquisadora foi escrever o **Battement frappé** (16 tempos, 2/4, *sur le cou-de-pied*) e relatou
  três coisas: «en face» não marcava, não conseguia marcar duas direções sem perder a primeira, e o
  trecho escrito **à frente** apareceu como se fosse **atrás**. As três tinham a mesma raiz: as
  pílulas nasceram **todas `checkbox`**, e a direção não é uma lista — com `checkbox` e sem
  repintura, o navegador marcava a nova e **deixava a anterior**, e o estado ficava com a última.
  Reproduzido na bancada com o alfabeto real (as três liam `true` e `DIRECAO` dizia `derriere`).
  Passa a **`radio`** com `name` por grupo. «**En face**» era a única que nunca marcava; passa a
  aparecer marcada quando nenhuma outra está, e o estado continua vazio para ela — **o que se grava
  não muda**. E, **não relatado, encontrado ao medir**: a **contagem recomeçava por direção** e o
  compasso é corrido, o que punha «à frente» e «ao lado» no mesmo «compasso 1, contagem 1»; agora o
  início soma, na ordem da gramática, tudo o que vem antes, e sai da **mesma soma** que a coluna do
  compasso. Medido: `compasso 1 | 1`, `compasso 1 | 2`, `compasso 2 | 1`. As **22 células** do
  alfabeto continuam válidas e a âncora não mudou. Publicado em `5af8aff`. **CONFIRMADO** localmente
  (75 asserções em navegador); a conferência ao ar fica para o deploy.

- **29/10/2026** — **Os dois eixos da célula, e o trecho todo em pílulas.** A pesquisadora testou o
  formulário com **Battement fondu, 4 tempos, 2/4, quinta posição** e pediu «flexibilizar ainda mais»:
  não conseguia escolher mais de uma direção, e a mesma explicação repetia-se para oito coisas. Ao
  reproduzir o gesto num navegador, o defeito apareceu por baixo — **escolher o segundo sinal apagava o
  primeiro**, porque uma escolha única não escreve uma sequência. E o defeito de fundo era do **dado**:
  a tabela tinha **oito blocos** porque o alfabeto juntava a **direção do membro** (3) e a **orientação
  do corpo** (5) numa lista só. A célula ganhou o campo **opcional `orientacao`** — omitido vale
  `en-face`, e é omitido que se grava —, o motor leva-a ao segmento e à declaração e a prosa diz-a na
  legenda quando não é `en face`, e o servidor recusa uma orientação que não esteja na gramática
  (alfabeto **versão 5**). Na tela não há **nenhuma lista suspensa** no trecho: direção, orientação,
  contagem, categoria e sinais são pílulas; cada clique **acrescenta ao fim**, e a remoção é pelos «×»
  das fichas numeradas. A **direção e a orientação ficam** depois de acrescentar um trecho, e só os
  sinais, a contagem e a frase se limpam — é o que permite emendar o en croix. A tabela ganha a coluna
  da orientação, e a célula sem ela diz «en face» em palavras. Publicado em `4994b34` e `9b318fe`.
  **CONFIRMADO** localmente — 61 asserções em navegador, e o **texto dos PDFs com o mesmo md5** de
  antes; a conferência ao ar fica para o deploy (os 22 verbetes ainda não declaram orientação).

- **28/10/2026** — **A célula explicada: a contagem escolhe-se, os sinais compõem-se, a frase vem do
  dicionário.** A pesquisadora abriu o editor e não entendeu quatro campos — e no meio da pergunta
  estavam três defeitos meus: **«bloco» queria dizer duas coisas** (Solo · Barra no plano, e a
  notação na célula), a **legenda repetia as categorias** dentro da lista de sinais (22 sinais, 4
  deles eram as categorias), e as **duas tabelas diziam a mesma coisa**. A **contagem** deixou de ser
  campo de escrita: é uma lista das que cabem no compasso (vai de 1 até o numerador e recomeça no
  seguinte; o número do compasso é calculado). A notação passou a compor-se — categoria + sinais,
  cada um com o nome — e o dado acompanha (célula declara `categoria` e `sinais`, notação derivada,
  alfabeto **versão 4**), com os documentos publicados **idênticos** (mesmo md5 no texto dos PDFs). E
  a frase em português passou a vir de um **dicionário do balé** (`descricoes.json`, chave = a
  notação), que **sugere** — o que fica gravado é a frase da célula. Publicado em `4342f16`.
  **CONFIRMADO** localmente; a conferência ao ar fica para o deploy.

- **28/10/2026** — **Dois modos no verbete, a direção lida do dado, e o editor de célula.** O «+»
  abria uma caixa a meio do formulário, e o que vinha depois continuava a ser do verbete: dois botões
  primários à vista, os campos do verbete abaixo do botão que grava o exercício, e «informe o nome do
  exercício» com um exercício escolhido. O formulário passou a ter **dois modos que não coexistem**, e
  a **direção deixou de ser pergunta**: o campo `direcoes` era, seis de seis, a lista das chaves de
  `celulas` — saiu do dado (alfabeto versão 3) e a direção é derivada. A tela mostra uma tabela com
  três estados (coberta, sem célula nesta música, fora do exercício) e o «fouetté não vai às três»
  passa a ser um facto do alfabeto, não uma proibição do sistema. O **editor de célula** fecha o
  gargalo dos **55 exercícios para 4 verbetes**: «Gravar verbete» recusava criar o que não existisse
  porque as células vinham do que já estava gravado. Publicado em `4f4795a`, com a folha em `9fb09dc`
  (o campo bloqueado passa a ver-se — motivo declarado, commit próprio). **CONFIRMADO** localmente;
  a conferência ao ar fica para o deploy.

- **28/10/2026** — **O vocabulário passou a viver no repositório, numa verdade só, e o «+» cria o
  exercício.** Havia **duas** listas de termos — o ficheiro da modalidade e uma cópia por escola no
  KV, semeada pelo botão «Carregar catálogo inicial». A tela do verbete lia a do repositório; a do
  vocabulário escrevia na do KV; e o gerador lê o ficheiro do **disco**, no GitHub Actions, pelo que
  uma escrita em KV nunca chegaria ao documento. `termos()` passa a devolver o bundle;
  `motor/servidor/termo-repo.js` (novo) grava no repositório; o `PUT` do termo edita o nome (e o
  `id`, que deriva dele); e o semear passou a semear **só as turmas** — o botão diz «Carregar as
  turmas iniciais». O **«+»** ao lado do exercício (opção A) abre um cadastro breve que chama o
  mesmo cadastro de termos, e o exercício novo entra na lista local no grupo da categoria. Publicado
  em `4e09bc9`. **CONFIRMADO** localmente; a conferência ao ar fica para o deploy.

- **28/10/2026** — **O verbete ganhou posição, direção e lado — e passou a ser administrável na
  Produção.** O alfabeto mudou de casa (`biblioteca/modalidades/bale-classico/notacao.json`) e a
  âncora passou a **selar** o alfabeto no `.fipp` (opção B); o verbete passou a declarar `posicao`,
  `direcoes` e `lado`, o compasso deixou de ser escrito à mão e passou a ser calculado, a 4ª posição
  dos pés entrou, e as posições de braços passaram a ser declaradas **por método** (a 3ª francesa é
  a 5ª da RAD). A página em prosa passou a dizer a posição no cabeçalho do exercício. E uma secção
  nova em Produção › Pedagogia, **«Verbetes da notação»**, cria, edita e descontinua verbetes —
  gravando no **repositório**, porque é de lá que o gerador lê. Publicado em `5020b89` (alfabeto e
  selo), `8df6c0c` (forma nova, motor e fontes) e `3dcc344` (o CRUD); os quatro workflows de
  `3dcc344` **success**. **CONFIRMADO**.

- **28/10/2026** — **A «Sequência declarada» saiu, e a métrica ganhou a primeira explicação.** A
  secção era a grade em resumo, sem a notação e sem a descrição: saiu da aula e da notação (−69
  linhas em cada página gerada), e o link «Aula 01» do plano passou a apontar para a grade
  (`#exercicios-da-aula-01`). O Port de bras foi corrigido de 16 para **18 tempos** nas duas versões
  do envelope, o que expôs uma lacuna escondida: o verbete cobre 12 dos 18 tempos. O rastreio pedido
  apurou que compasso, contagem, notação e descrição vêm **do verbete**, não do plano — e que o bloco
  de musicalidade é uma linha **escrita à mão** no derivador, sem pergunta que a preencha. Publicado
  nos commits `6e248ac` (ferramentas, com motivo declarado), `ee99969` (fontes e pacote) e `f4cc715`
  (registo); os quatro workflows **success**. **CONFIRMADO** ao ar.

- **28/10/2026** — **O cabeçalho perdeu as etiquetas, e o cartão da ficha perdeu a moldura.** A
  fileira «Escola · 2x/semana · 50 min · Plano · Ciclo 01 · Volume semanal» saiu de todas as páginas
  do pacote; o subtítulo saiu de referências, aula, notação e glossário (na aula desceu ao corpo,
  como «Condição desta aula»); «Abrir notação» passou a botão do cabeçalho da Aula, preso com o
  título, e saiu da listagem; e o cartão da anamnese ficou sem a moldura `┌─┐`, com os campos
  reordenados e o traço até ao fim da linha. Publicado nos commits `a2bbdfa` (ferramentas, com
  motivo declarado), `29a95e5` (fontes e pacote) e `3c3a29d` (registo); workflows #105, #206, #289
  e #404 **success**. **CONFIRMADO**.

- **28/10/2026** — **O documento abre pela leitura, e o código interno saiu da tela.** O plano do
  ciclo deixa de ter resumo e etiquetas debaixo do título; o `## Contexto` passa a declarar dois
  grupos («Escola e espaço», «Professor, turma e método»); o calendário parte-se pelo marco; o
  rodapé passa a ser o de cada documento; e os códigos de pétrea (`P-06`, `P-10`, `P-11`, `P-15`,
  `P-16`, `P-21`, `P-22`) saem de tudo o que o professor lê. Publicado nos commits `973358b`
  (ferramentas, com motivo declarado), `dc8faec` (fontes e pacote da Batata) e `d9f085f`
  (registo); workflows #205, #288 e #403 **success**; o plano foi conferido ao ar. **CONFIRMADO**.

- **27/10/2026** — **A Aula 01 foi publicada na Batata.** O commit `8b939d0` foi enviado a
  `origin/main`; o run #287 de `Publicar as escolas` e o job Batata passaram. A única conferência
  ao vivo após o deploy foi à raiz: HTTP 200 e link de navegação para `/aulas/`. A rota específica
  não foi recarregada. **CONFIRMADO**.
- **27/10/2026** — **A Aula 01 e a Notação ficaram alinhadas.** O Guia usa os itens declarados no PO
  e esclarece o registro na Captura; a Notação compõe a estrutura completa da Aula com os sinais
  Benesh; o Plano abre pelo título e a lista de Aulas oferece PDF individual. Pacote real, publicação
  local, validadores, provas focadas e âncoras passaram. **PENDENTE** push, deploy e conferência ao
  vivo.
- **27/10/2026** — **Aulas passou a oferecer as duas leituras.** O título da Aula 01 abre a versão
  em prosa; «Abrir notação» fica ao lado; as listas independentes de Notação e Consulta deixam de
  ser geradas; a Notação oferece um atalho persistente para o Glossário em nova aba. Pacote,
  publicação local, provas focadas e âncora validados. A entrega em `d349ed0` foi publicada pelo
  workflow automático, job Batata **success**; `/aulas/` respondeu 200 com os dois links. **CONFIRMADO
  em produção**.
- **26/10/2026** — **a ação de cada formulário da Produção passou a ser uma só peça.** O
  «Cadastrar aluna» e o «Cadastrar termo» estavam a **0px** do campo: o `<div class="res">` entre o
  último controle e o botão parte a conta de vizinhança da folha (`input + button.acao` → 16px), e
  o `.acao` declara `margin: 0`. O «Atribuir curadoria» estava sem `.acao` e saía no botão **padrão**
  — fundo de papel, 45px — ao lado de ações cheias de bordô de 49px. Os três passaram à fileira
  `.par-botoes` com `.acao grande`, o modelo do «Cadastrar professor»; medido **9px** nos quatro
  (13 na curadoria). **Nada tocou a folha**, que está congelada — o defeito era a página a desfazer
  a conta dela. Prova nova: `experimentos/provar-vao-do-botao.js` (62/62; 46/62 no controle
  negativo). A `provar-celular.js`, que saía sem medir nada desde que o menu deixou de ser `sticky`,
  voltou a **15/15**. **CONFIRMADO** no navegador, **DECIDIDO** 26/10/2026 e **publicado**: o push
  levou também os dois commits do menu que estavam por enviar, os dois workflows de publicação
  terminaram em `success` sobre `fe71508`, e a página ao ar serve as três marcações novas.
- **25/10/2026** — **a opção A implementada no produto**: o contexto do ato passa a ser um painel
  dentro das três listas da Área do Professor, aberto pela caixinha do «Turma» na faixa inteira, com
  a seta `▾` a rodar para cima ao abrir. O botão solto do topo saiu (duas portas, e a segunda sem o
  contexto). A regra dos três botões da porta passa a ser executada, com a mesma chave de memória; o
  contexto escolhido é guardado sem a senha. Duas armadilhas da bancada ficaram escritas na prova.
- **25/10/2026** — **a opção A do «acervo com a porta», escolhida e corrigida**: a caixinha do
  «Turma» passa a abrir o painel, na faixa inteira (nove propriedades iguais às da caixa do cartão,
  provadas); «ver a ficha em branco» sai do painel e fica sempre à vista; com preenchimento
  interrompido o painel abre sozinho. A regra dos três botões foi confirmada em `porta/index.html` e
  a bancada passa a executá-la. Nada de produto alterado.
- **25/10/2026** — **a Área do Professor ficou sem porta e voltou a tê-la.** As três listas servidas
  pelo acervo nasceram com `acoes: []`, e a linha deixou de levar ao formulário quando deixou de ser
  uma turma e passou a ser um registo. Medido em produção: `/aulas/` com 27 acções, as três da Área do
  Professor com **zero**. Botão do topo (`a.acao` em `header.doc`) e destino por linha; 16 asserções
  novas na prova, geometria medida em 390/768/1280px.
- **25/10/2026** — segunda ronda de respostas: **o marco é obrigatório e explícito, mas pode repetir o
  da aula anterior**; os três lugares da aula passam a **propostos** (o professor mantém, edita, cria ou
  acrescenta); **os `materiais` entram no formulário**. As perguntas passam a ser identificadas por
  **nome** — a numeração mudou duas vezes e já atrapalhou a leitura.
- **25/10/2026** — a pesquisadora respondeu ao documento de análise: **uma correção de diagnóstico**
  (a repetição do contexto no PO é proposital, não é defeito), **três decisões** (marco por aula,
  herança mista da sequência, comparação com a aula anterior), **duas perguntas reabertas** por
  obscuridade da redação (`derivados`, `materiais`) e **uma pergunta nova** (o passo de alinhamento
  com o PO). Termos verificados no código e no repositório.
- **25/10/2026** — `7182307` a análise da aula, do plano e da observação.
- **25/10/2026** — o padrão de listagem aplicado: «Consulta», três caixas por registo, as três
  listas da Área do Professor servidas pelo acervo.
- **25/10/2026** — corrigidos três defeitos só visíveis em produção: a data «—», a versão do
  resumo e a turma do PO.
- **25/10/2026** — a bancada das propostas passou a ser construída antes de a escola ser montada.
- **24/10/2026** — o ☰ dentro da Produção passou a abrir o menu do sistema inteiro.
- **24/10/2026** — «Aulas» deixou de estar duplicado no menu.

## 12. Limitações de conhecimento

O que **não** consigo confirmar, e o senhor tem de decidir ou informar:

- **A produção não foi percorrida página a página.** Em 02/11/2026 carregou-se a **Aula 01** da
  `batata` (200, com as quatro correções) e leram-se duas respostas de `api/mapa`; **as outras
  páginas** do pacote (o plano, a notação, a captura) não foram conferidas ao vivo nesta fotografia.
  A rota `/aulas/` que aqui estava citada **deixou de existir** no reagrupamento de 24/10.
- **Não sei a distribuição real de uso em produção.** Não há telemetria; o que sei é o que os
  `curl` devolvem.
- **Não sei se o `TRANSFERENCIA-IA.md` serve o seu caso de uso.** Foi desenhado a partir de uma
  descrição, não de uma tentativa real de o anexar a outro assistente. A versão de 02/11/2026 é a
  primeira escrita **depois** de uma sessão inteira de correções, e não a partir de um resumo — é a
  melhor aproximação até agora, e continua por testar.
- **Não sei se as perguntas abertas da §8 foram decididas fora do repositório.** A §8 regista o que
  a pesquisadora respondeu em 25/10/2026, em duas rondas. Continua **sem resposta** apenas
  `alinhamento` (a frequência do passo de confirmação com o PO), e **sem decisão** a possibilidade de
  referências bibliográficas por aula — levantada de passagem, não pedida.
- **Não verifiquei as 11 provas não versionadas** — não sei se ainda são recuperáveis. Em
  02/11/2026 descobriu-se que uma delas, a `provar-ajustes-anamnese`, **estava versionada mas a
  correr pela metade**: 56 asserções em vez de 126. É a demonstração de que «está no `.gitignore`
  como exceção» não é o mesmo que «corre inteira».
- **Não sei o estado do KV em produção** — cota, ocupação e envelopes reais não foram medidos
  agora. Medir custa cota diária.
- **A fotografia envelhece no commit seguinte.** Se o `HEAD` avançou e este documento não, vale o
  código, não o documento.

## 13. Rotina de atualização e transferência

### Atualizar a fotografia

Peça **«atualiza a fotografia»**. O que acontece:

1. Verificar o remoto (`git fetch`, `git status -sb`) — regra do «remoto primeiro».
2. Recolher o que mudou materialmente desde a data da última fotografia.
3. Atualizar **só as secções afetadas** — nunca reescrever o documento inteiro.
4. Registar as decisões novas no `REGISTRO.md`, não aqui (aqui fica só o resumo da §6).
5. Correr as validações da §9 e escrever o resultado, mesmo quando é negativo.

### Gerar a transferência para outro assistente

Peça **«gera a transferência»** — ou **«gera a transferência sobre <assunto>»**, se a dúvida não
estiver clara. O procedimento está em
[.github/skills/fotografia-do-estado/SKILL.md](.github/skills/fotografia-do-estado/SKILL.md).

O resultado é `TRANSFERENCIA-IA.md` na raiz. **Não é versionado** (entra no `.gitignore`): é
contexto efémero de sessão, como as saídas geradas de P-04, e versioná-lo criaria conflito a cada
geração.

**A transferência é manual.** Nenhum agente anexa nem envia o documento a outro serviço; o senhor
anexa-o à conversa que quiser. Se algum dia houver integração configurada, isso será dito aqui.
