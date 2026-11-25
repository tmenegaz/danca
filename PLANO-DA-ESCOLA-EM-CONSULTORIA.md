# Plano — a escola em consultoria e o mês de demonstração

> **O que este documento é.** O desenho do limitador que ela pediu a 25/11/2026: uma escola criada
> como consultoria, entregue à escola por **um mês**, com **sete limites duros que não se renovam**, e
> congelada em só-leitura no fim — até ela contratar e a proprietária clicar «Habilitar». Ele fixa as
> decisões tomadas hoje, as fontes de verdade, as rotas onde a trava vive e a ordem da obra.
>
> **O que ele não é.** Não é implementação, e não autoriza implementar já. O passo que o resto não
> dispensa é o **contador de aulas** ([PLANO-CONTADOR-DE-AULAS.md](./PLANO-CONTADOR-DE-AULAS.md)), e
> é ele que fecha o sétimo limite. **Até o contador existir, o botão «Entregar à escola» fica
> desligado** — um mês de demonstração sem o limite de aulas seria um mês de 48 aulas, não de 3.
>
> **O que ele corrige, e é o achado maior.** A L12 promete hoje **três meses gratuitos** e proíbe
> desligar a escola automaticamente no fim. O que ela acaba de decidir é o contrário: **um mês**,
> **congelamento automático**, **só leitura**. O plano não finge que as duas coisas concordam: a
> decisão de hoje **substitui** a L12, e a substituição tem de ser registada (F8).

---

## 1. O que ela pediu, na letra

> «Eu vou criar uma escola como consultor e aí essa escola, ela pode se tornar uma escola que assine
> o plano básico, intermediário ou o avançado. Mas enquanto eu estou fazendo a consultoria, eu estou
> apresentando a forma de planejamento e alimentando a ferramenta Lastro. […] depois que eu terminar
> o processo, a escola pode contratar o serviço ou não. […] E aí eu vou deixar para a escola esse
> ambiente configurado com o nome dela, disponível para ela usar por um mês. Só que vai ter um
> limite. […] esse limite não se renova, tá? Isso é muito importante, ele não se renova. […] depois
> ele fica completamente congelado […] Ela só pode ler as coisas. […] Ele fica desabilitado
> automaticamente depois desse prazo de um mês.»

E, sobre a saída:

> «Aí se a escola pagar, ela contratar, aí eu clico em habilitar e a escola fica livre dentro daquele
> plano. Então esse limitador já é o nosso plano, porque cada plano também tem o seu limitador […]
> a gente vai ajustar isso de acordo com cada plano na sua franquia mais para frente.»

E, sobre a ordem:

> «[…] depois que a gente fizer o contador de aulas, eu acho que vai ser possível então a gente
> avançar para esse plano. Eu tenho a impressão que o contador de aulas é o limitador desse plano.»

**A intuição está certa: o contador de aulas é o limitador.** Os outros seis limites são contagens
que já existem; o sétimo é o único que ainda não tem número.

### 1.1 Os sete limites que ela deu

| Limite | Valor | O que conta, na letra dela |
|:--|--:|:--|
| **Professores** | **2** | «o titular e mais um» |
| **Alunas** | **5** | «apenas cinco alunos» |
| **Ciclos** | **2** | «no máximo dois ciclos» |
| **Modalidades** | **2** | «no máximo duas modalidades» |
| **Aulas** | **3** | «no máximo três aulas podem acontecer» |
| **Salas** | **2** | «só pode ter duas salas» |
| **Turmas** | **3** | «só pode formar três turmas» |

---

## 2. O que já existe, medido

O plano não começa no zero. A maior parte do que ele precisa já está no motor — mas **não com os
nomes que a tela usa**, e essa é a primeira armadilha.

| Peça | O que já existe | Onde |
|:--|:--|:--|
| **Criação com plano** | `comercial.validarEscolha` recusa um plano fora do catálogo; `podeDispensar` só vale para `origem === 'painel'`; a escola nasce `ativa` quando o pagamento é dispensado | `motor/servidor/raiz.js`, `motor/nucleo/comercial.js` |
| **Estados comerciais** | `aguardando` · `ativa` · `suspensa` (`ESTADOS`, em `comercial.js`), guardados em `bastidores/<escola>/comercial` (KV) | `motor/nucleo/comercial.js`, `motor/servidor/raiz.js` |
| **Só-leitura** | `suspensa` já bloqueia **toda** a escrita: `ehEscrita` recusa qualquer método que não seja `GET`/`HEAD`/`OPTIONS`, com uma lista curta de `POST` que só lêem; a resposta é `402` nas rotas de dados e uma página nas navegações | `motor/servidor/producao.js` |
| **A frase da recusa** | `MENSAGEM_DA_SUSPENSAO`: «é possível ler o que já foi criado, mas não criar nem editar» | `motor/nucleo/comercial.js` |
| **Botões** | «Habilitar» e «Desabilitar» na linha de cada escola viva; `gravarComercial` grava `habilitadaEm`/`desabilitadaEm` e um elo de histórico | `motor/servidor/painel-html.js`, `motor/servidor/raiz.js` |
| **Carência de expurgo** | 3 meses contados do `desabilitadaEm`; `estadoDoExpurgo` só responde «pode apagar» a uma escola `suspensa` com a carência vencida | `motor/servidor/raiz.js` |
| **Contador de aulas** | **Não existe.** `situacaoDaFranquia` já compara e devolve os quatro estados; falta a função que soma as aulas processadas | [PLANO-CONTADOR-DE-AULAS.md](./PLANO-CONTADOR-DE-AULAS.md) |
| **Catálogo comercial** | `planos.json` com três assinaturas (130/320/500 aulas), pacotes e extensões; `professores`/`alunos` são **referência interna, não limite** (§ADITIVO §2) | `biblioteca/comercial/planos.json` |
| **Trava do piso** | `travaDoPiso` devolve sempre `cabe: true` — é aviso para a controladoria, não bloqueio | `motor/nucleo/comercial.js` |
| **Contagens do KV** | `bastidores/<escola>/{professores,alunas,turmas,curadorias}`; leitura estrita disponível (`lerLista(..., estrito)`) | `motor/servidor/bastidores.js` |
| **Ciclos e aulas** | O índice do acervo (`indices/escolas/<escola>.json`) tem `ciclos` e `contagens`; o `ciclos.json` do pacote tem as aulas e o `lancada`; o facto é o `-dados.json` | `motor/nucleo/indices.js`, `ciclos.json`, `PLANO-CONTADOR-DE-AULAS.md` §3 |
| **Custo de um acto** | **3 minutos** de Actions por acto (medido, `CUSTO-DOS-FLUXOS.md` §20) | — |

### 2.1 A armadilha dos nomes: «sala» e «turma» estão trocadas no código

O menu da Produção mostra **«Salas»** e **«Turmas»**. No código, e no KV:

| A tela diz | A chave do KV | O que é |
|:--|:--|:--|
| **Salas** | `bastidores/<escola>/turmas` | a sala/horário, com `faixas` (dias, hora, duração, período, modalidade, professor) |
| **Turmas** | `bastidores/<escola>/curadorias` | o grupo formado (a curadoria, com o elenco e a linha de base) |

**Quem implementar sem esta tabela troca os dois limites** — e o sintoma seria uma escola com duas
turmas e três salas, exactamente ao contrário do que ela pediu. O plano usa **sempre** o nome da
tela, e diz a chave ao lado quando importa.

---

## 3. As cinco decisões tomadas hoje

| # | Pergunta | Decisão | Consequência |
|:--|:--|:--|:--|
| **D1** | O mês da consultoria e os 3 meses da L12 | **Substitui.** O período gratuito passa a ser este mês de consultoria | A L12 é revista; os critérios (i) e (ii) e as etapas J2/J3/J5 mudam |
| **D2** | Quando começa o mês | **Na entrega da escola**, por um botão «Entregar à escola» | O tempo da consultoria não come o mês da escola; `entregueEm` é um facto próprio |
| **D3** | O congelamento inicia a carência de expurgo? | **Não.** Congelada é só leitura; só o botão «Desabilitar» inicia a carência | O congelamento não torna a escola apagável; a decisão de apagar continua a ser dela |
| **D4** | Os limites contam o que a consultoria criou? | **Teto total.** O que a consultoria criar já ocupa o limite | Sem loophole: não se enche a escola na consultoria e ainda se ganham 2 ciclos depois |
| **D5** | As «3 aulas» são o quê? | **3 no total**, e a aula 01 de cada ciclo conta | Com 2 ciclos, 2 das 3 já estão gastas ao gerar; sobra 1 aula para a escola |

---

## 4. A contradição com a L12 — declarada, não escondida

A [L12](./PLANEJAMENTO-LASTRO.md) diz hoje:

- «o plano Básico com **três meses gratuitos**»;
- critério (ii): «ao fim dos três meses **sem** contratação, `ESCOLA_HABILITADA` **não** é desligada
  automaticamente»;
- J3: a contagem do período gratuito a partir do **`criado_em`** que já existe;
- J5: **bloqueio suave** — suspender bloqueia operações não autorizadas sem apagar dado.

A decisão de hoje diz:

- **um mês**, não três;
- **congelamento automático**, não «não desligar»;
- a contagem a partir da **entrega**, não da criação;
- **só-leitura** — que já é o que o `suspensa` faz, e portanto o bloqueio suave da J5 já existe; o
  que muda é **quem o acciona** (o relógio, não ela) e **o que ele significa** (fim da demonstração,
  não inadimplência).

**O que a L12 acertou e não se perde:** o fim do período gratuito **não é dívida**. É por isso que o
estado novo se chama `expirada` e não `suspensa`, e é por isso que ele **não** inicia a carência
(D3). A frase da L12 — «tratar o fim do período gratuito pela régua da inadimplência seria bloquear
quem nunca deveu nada» — continua verdadeira, e é a razão do estado separado.

**O que fica pendente:** a L12 é um documento de planeamento; a substituição tem de ser escrita lá
(ou num aditivo datado) e no `REGISTRO-2026.md`, com o motivo. F8.

---

## 5. O modelo

### 5.1 Os estados, e o estado **efectivo**

O estado comercial guardado continua a ser o que já é (`aguardando` · `ativa` · `suspensa`). O mês de
demonstração acrescenta um estado **calculado**, não gravado:

```
expirada(comercial, agora) =
     comercial.estado === 'ativa'
  && comercial.periodoDeConsultoria
  && comercial.periodoDeConsultoria.terminaEm <= agora
  && !planoPago(comercial.plano)
```

| Estado | Quem o põe | Lê? | Escreve? | Inicia a carência? |
|:--|:--|:--:|:--:|:--:|
| `aguardando` | a criação, sem pagamento conciliado | **não** (página de espera) | não | não |
| `ativa` | pagamento conciliado **ou** demonstração dentro do mês | sim | sim, dentro dos limites | não |
| `suspensa` | ela, pelo botão «Desabilitar» (ou inadimplência) | sim | **não** | **sim** |
| `expirada` | **o relógio** (calculado) | sim | **não** | **não** |
| `ESCOLA_HABILITADA=nao` | `vars` do Worker (técnica) | **não** (503) | não | não |

**Porque calculado e não um cron.** Um cron que escrevesse `suspensa` no vencimento teria três
defeitos: dependeria de um agendador que o produto não tem; correria no fuso errado; e escreveria o
estado **antes** de alguém o ler, tornando o congelamento um facto consumado em vez de uma leitura.
O cálculo no pedido é idempotente, não precisa de agendador, e chega a todos os leitores ao mesmo
tempo. É a mesma disciplina do `estadoDaAula`: **o estado é o juízo de um instante, e quem tem um
`agora` é quem o calcula.**

**Porque o estado guardado fica `ativa`.** É o que faz o D3 funcionar sem tocar no expurgo:
`estadoDoExpurgo` só aceita apagar uma escola `suspensa` com `desabilitadaEm` e carência vencida. Uma
`expirada` guardada como `ativa` **não é apagável automaticamente** — e o painel tem de dizer as duas
coisas, porque são duas perguntas diferentes: «esta escola pode escrever?» (não) e «esta escola pode
ser apagada?» (não, enquanto ela não clicar «Desabilitar»).

### 5.2 As datas

```
periodoDeConsultoria: {
  entregueEm:  '2026-11-25T20:00:00.000Z',   // o instante do clique, em UTC
  terminaEm:   '2026-12-26T02:59:59.999Z',   // 25/12 às 23:59:59 em Passo Fundo (UTC−3)
  convertidaEm: '2027-01-10T…',              // quando a escola contratou (opcional)
}
```

- **O relógio começa na entrega** (D2), e `entregueEm` é um facto **único**. Não se recalcula, não se
  reinicia ao «Habilitar», não se reinicia ao desabilitar.
- **Um mês é um mês de calendário, no fuso de quem lê.** A conta é a de `motor/nucleo/fuso.js`: somar
  um mês à **data local** e fechar às 23:59:59 locais, guardando o instante em **UTC** (o exemplo
  acima: 25/12 às 23:59:59 em Passo Fundo é 26/12 às 02:59:59 UTC). Cortar os dígitos do ISO — o
  defeito que o `fuso.js` já pagou — daria um vencimento às 21:00 do dia anterior, e a escola
  perderia um dia sem ninguém entender porquê.
- **`terminaEm` é gravado uma vez**, não recalculado a cada leitura. Um valor derivado de «agora»
  mudaria com o relógio e faria a data mentir; a auditoria precisa do instante em que a promessa foi
  feita.
- **Uma escola criada há dois meses e entregue hoje tem o mês inteiro.** É a diferença entre D2 e a
  J3 da L12, e é o que impede a consultoria de consumir o prazo da escola.
- **Uma escola nunca entregue não tem relógio** — mas tem limites desde a criação (D4). O que ela não
  tem é um prazo a correr; a consultoria pode durar o tempo que durar.

### 5.3 Onde as regras e os factos vivem

| O quê | Onde | Porquê |
|:--|:--|:--|
| **As regras** (os sete números) | `biblioteca/comercial/planos.json` → `demonstracao.limites` | é o catálogo versionado; um número comercial não se escreve em código |
| **Os factos** (`entregueEm`, `terminaEm`, `convertidaEm`, o histórico) | o registo comercial `bastidores/<escola>/comercial`, no KV | é onde o estado comercial já vive, e é o que os dois leitores (a porta e a rota da senha) já sabem ler |
| **O espelho para auditoria** | `escola/<escola>/indice.json` → `estado.consultoria` | o índice é gerado; pode **mostrar** o período, não pode decidi-lo |
| **O livro das aulas da demonstração** | o registo comercial (`aulasDaDemonstracao`) | é o que faz o limite não se renovar (ver §7); não é a contagem da factura |

**Dívida declarada, e não resolvida aqui.** A L9b dizia «o lugar da verdade é
`escola/<slug>/indice.json` → `estado.plano`», e a C11 diz «repositório, nunca KV». O estado
comercial, na prática, vive no KV desde que o botão «Habilitar» passou a mudá-lo sem commit. Este
plano **não move a casa do estado**: seria uma migração maior do que o limitador, e faria o limitador
depender dela. O que ele faz é não agravar a divergência em silêncio: o período é um facto comercial,
vive onde os outros factos comerciais vivem, e o índice apenas o espelha. Quem quiser fechar a C11
abre uma frente própria.

### 5.4 A entrada `demonstracao` no catálogo

```json
{
  "id": "demonstracao",
  "nome": "Demonstração",
  "preco": 0,
  "aulas": 3,
  "publico": false,
  "limites": {
    "professores": 2,
    "alunas": 5,
    "ciclos": 2,
    "modalidades": 2,
    "aulas": 3,
    "salas": 2,
    "turmas": 3
  }
}
```

- **`publico: false`** — a entrada existe para o motor, não para a oferta. `catalogoDaPagina` e
  qualquer lista de planos têm de a filtrar; um plano de demonstração a aparecer ao lado dos pagos
  seria uma quarta porta na escada.
- **`preco: 0`** — `validarEscolha` continua a funcionar sem um caminho paralelo; a escola nasce com
  `valor: 0` e `pagamento: 'dispensado-pelo-proprietario'` (o mecanismo que já existe para o painel).
  A origem `consultoria` tem de ser autorizada a dispensar (`podeDispensar` hoje só aceita
  `origem === 'painel'`); a alternativa é criar com `origem: 'painel'` e guardar «consultoria» noutro
  campo, mas a primeira é a que dá proveniência — e a pergunta «esta escola entrou pelo consultor ou
  pela página dela?» já está escrita no registo.
- **`aulas: 3`** e `limites.aulas: 3` são o mesmo número dito duas vezes? **Não**: `aulas` é a
  franquia mensal que as páginas já lêem; `limites.aulas` é o teto **de vida** da demonstração. O
  plano guarda os dois porque são dois factos diferentes, e um deles (o de vida) é o que não se
  renova.

### 5.5 A diferença para os planos pagos — e o §ADITIVO §2

O desenho **não** pode transformar os planos pagos no que o §ADITIVO §2 proíbe. A distinção:

| Regime | Professores/alunas | Aulas | Renovação |
|:--|:--|:--|:--|
| **Demonstração** | **teto duro** (2 / 5) | **teto duro de vida** (3) | **não renova** |
| **Assinatura paga** | **referência interna**, não bloqueia (§ADITIVO §2) | **franquia mensal** com excedente que se paga | renova todos os meses |

O módulo de cotas tem, por isso, de receber o **regime** (`demonstracao` · `assinatura`) e não aplicar
a mesma regra aos dois. Um `limites` preenchido numa assinatura paga seria uma decisão nova — e
contradiria o aditivo. Se ela quiser tetos duros nos planos pagos, isso é uma revisão declarada do
aditivo, não um efeito colateral deste plano.

---

## 6. Os sete limites, um a um

A regra comum, e ela vale para todos: **a contagem é derivada, nunca um contador guardado**; a
leitura é **estrita** (uma falha de leitura **recusa**, não devolve zero); o que está desligado,
substituído ou inactivo **não conta**; **editar não é criar**; e a recusa nomeia o limite e o número.

| Limite | Valor | Fonte derivada | Onde recusa | Conta o quê |
|:--|--:|:--|:--|:--|
| **Professores** | 2 | `bastidores/<escola>/professores` | `POST /api/bastidores/professor` (criar **e** re-ligar) | activos (`!desligado_em`); o titular conta |
| **Alunas** | 5 | `bastidores/<escola>/alunas` | `POST /api/bastidores/aluna` | activas (`!desligadaEm`); o cadastro, não o elenco nem a curadoria |
| **Ciclos** | 2 | índice do acervo + `ciclos.json` | no disparo (`criarDisparador`), antes do `workflow_dispatch` | ciclos **distintos** `(professor, número, escola)`; regerar o mesmo não conta |
| **Modalidades** | 2 | `modalidade` das `faixas` das salas activas | `POST /api/bastidores/turma` (sala, criar/editar) | modalidades **em uso**; a habilitação declarada do professor não é modalidade da escola |
| **Aulas** | 3 | `contarAulas` (F0) + livro de identidades | `POST /api/receber`; e no disparo, pela aula 01 que o ciclo novo cria | aulas **processadas**, uma por `(ciclo, número)`, no total desde a criação |
| **Salas** | 2 | `bastidores/<escola>/turmas` | `POST /api/bastidores/turma` | salas activas (`ativo !== false`) |
| **Turmas** | 3 | `bastidores/<escola>/curadorias` | `POST /api/bastidores/curadoria` | turmas activas (`!substituidaPor`) |

### 6.1 O que cada recusa tem de dizer

A mensagem não é «o Básico não permite 2 professores». É:

> **«A demonstração inclui 2 professores, e já estão os 2 (o titular e mais um). Para acrescentar
> outro, contrate um plano.»**

E, na aula:

> **«A demonstração inclui 3 aulas processadas, e já foram as 3. O que está criado continua legível;
> para continuar a dar aulas, contrate um plano.»**

Duas coisas que a frase faz e uma que não faz: diz **o limite**, diz **o que já foi usado**, e
**oferece a saída**. Não diz «erro».

### 6.2 As três armadilhas

1. **`POST /api/bastidores/professor` cria *ou* re-liga.** A quota tem de ser conferida no resultado
   — o número de professores activos depois do gesto —, e não no corpo do pedido. Re-ligar um
   professor desligado ocupa uma vaga; criar um novo também.
2. **O ciclo nasce por três pontes, não por uma.** `bastidores.js` (o «Guardar» do PO, do plano ou do
   elenco), `node.js` (a ponte de Node) e `cloudflare.js` (a ponte do Worker) criam o disparador com
   `criarDisparador`, em `motor/servidor/disparar.js`. Uma trava só numa delas deixaria as outras
   duas abertas — e o sintoma seria o pior: o teto a funcionar no botão A e a não funcionar no botão
   B. A trava vive **no `criarDisparador`** (com a função de cota injectada, que as três pontes
   fornecem) e não numa rota só, com uma prova que reprova se alguma ponte criar um disparador sem
   cota. É a mesma disciplina do `copiar.js`: uma regra, num sítio, e nenhuma segunda cópia a
   divergir.
   A conferência é feita **antes do disparo**, porque depois dele o custo já foi pago e o ciclo já
   existe. E compara **identidades** `(professor, número, escola)`: os alvos que já existem não são
   ciclos novos, e uma regeneração não pode ser recusada por teto. A criação da escola pode já nascer
   com um ciclo (o `--ciclo` do `criar-escola.sh`); se nascer, conta — e a prova mede os dois casos.
3. **`POST /api/receber` é o lançamento da aula.** É a rota que grava o facto e dispara a geração; é
   aí que o teto de aulas morde. A conferência é antes da gravação, e a mensagem é a de negócio
   (`ok: false` com 200, como o contrato do formulário já exige), não um 5xx.

---

## 7. A não-renovação, que é o ponto que ela sublinhou

«Isso é muito importante, ele não se renova.» São **três** coisas diferentes, e só uma delas é um
problema de contagem:

| O que não se renova | Como se garante | O que **não** se faz |
|:--|:--|:--|
| **O mês** | `entregueEm` é um facto único; `terminaEm` é gravado uma vez; «Habilitar» não o reinicia; uma escola reabilitada sem plano continua `expirada` | não se recalcula `terminaEm` de `criado_em` nem de «agora» |
| **O teto de aulas (3)** | um **livro de identidades** no registo comercial: cada aula processada entra uma vez (`professor/numero/escola:aula`) e **nunca sai** | não se conta só o que está no disco: apagar um ciclo apagaria a prova e devolveria vagas |
| **O teto de gente/salas/turmas** | é um teto **concorrente**, não um total de vida: apagar um professor e criar outro é permitido, e não é «renovação» | não se guarda um total histórico de pessoas — seria uma segunda contagem a divergir |

### 7.1 Porque o livro, e não um contador

O contador de aulas é **derivado** do `-dados.json`, e isso é certo para a factura: a fonte é o dado.
Mas um limite **de vida** que se lê do dado actual tem um buraco: apagar o ciclo apaga as aulas, e o
número desce. Uma escola (ou ela própria, a limpar) poderia «recuperar» aulas apagando ciclos.

O livro resolve-o sem inventar um contador: guarda **identidades de aulas que existiram**, não um
número que alguém incrementa. A diferença é a mesma que há entre o elo de proveniência e um campo
`total`:

- um número guardado pode divergir da fonte em silêncio;
- uma lista de identidades **pode ser conferida** contra a fonte, e uma identidade que já não existe
  é uma **aula que foi apagada**, não uma aula que não aconteceu.

O livro **não substitui** a contagem da factura: `situacaoDaFranquia` continua a receber
`aulasUsadas` derivado. O livro só responde à pergunta da demonstração: «quantas aulas distintas esta
escola já processou desde que nasceu?».

### 7.2 O que «não se renova» não quer dizer

- **Não quer dizer que o dado se apaga.** No fim do mês, a escola lê tudo; o que não pode é criar.
- **Não quer dizer que a escola não pode pagar depois.** Pode, a qualquer momento; o contrato é que
  levanta o congelamento.
- **Não quer dizer que se pode recomeçar apagando a escola.** Apagar é outro acto, com expurgo e
  carência; uma escola recriada é uma escola nova, com contrato novo — e uma nova demonstração só
  acontece se ela a criar.
- **Não quer dizer que o teto de gente é de vida.** É concorrente; quem sai liberta o lugar. Só as
  **aulas** são de vida.

---

## 8. O congelamento

### 8.1 O que a escola vê

- **Durante o mês:** uma faixa discreta com o fim («Demonstração até 25/12/2026») e o consumo dos
  sete limites. Sem pop-up, sem janela comercial a cada acesso — a regra da L12 que continua válida.
- **Nos últimos 7 dias:** a mesma faixa, com o aviso de que, no fim, o acesso passa a só-leitura.
- **No dia seguinte ao fim:** a página abre em **só-leitura**, com a frase do estado e o caminho para
  contratar. O que já foi criado continua legível — é a decisão dela, e é a certa.

### 8.2 O que o motor recusa

`ehEscrita` já é a regra certa; o congelamento só lhe dá um estado novo. A recusa é `402` (não `403`:
não é «não tens permissão», é «o acesso está suspenso»), com a mesma **forma** do `suspensa` — JSON
nas rotas de dados, página nas navegações — e **outra frase**. A do `suspensa` manda «regularizar» e
fala de pagamento em atraso; a da `expirada` diz o que aconteceu: «O período de demonstração terminou
em DD/MM. O que está criado continua legível; para continuar a criar, contrate um plano.» Duas frases
porque são dois factos: uma escola que parou de pagar não é a mesma coisa que uma demonstração que
chegou ao fim (L12, «o fim do período gratuito não é dívida»).

**O que continua a passar, e é de propósito:**

- `GET`/`HEAD` em tudo o que é leitura;
- `POST /api/bastidores/validar-senha`, `/validar-producao`, `/ficha-do-professor` — são `POST` por
  natureza (o dado não viaja no endereço), mas são leitura no efeito;
- `POST /api/bastidores/ato` **emite** o bilhete; `POST /api/bastidores/ato/consumir` **não** está na
  lista e é recusado — o bilhete não pode ser trocado por um acto. A prova tem de o afirmar, porque
  um `POST` na lista de leitura é uma porta que se abre por engano.

**O caminho para pagar não é desta escola.** A página de contratação vive na raiz
(`danca.padd.com.br`), que não está congelada; a página da escola só tem de manter o link vivo. É o
que faz o critério (ix) da L12 — «a suspensão não impede a escola de pagar» — continuar verdadeiro.

### 8.3 O painel dela

Na linha da escola viva, ao lado de «Habilitar»/«Desabilitar»:

- o plano (`Demonstração`), o estado **efectivo** (`expirada`, quando for o caso);
- «entregue em» e «termina em»;
- os sete consumos (`2/2`, `5/5`, `3/3`, …);
- o botão **«Entregar à escola»**, só enquanto não houver `entregueEm`;
- o botão **«Habilitar»** — que, numa `expirada` sem plano pago, **não levanta o congelamento**; e o
  `title` diz porquê: «contrate um plano e grave o contrato; habilitar sozinho não reinicia a
  demonstração».

---

## 9. A habilitação depois do pagamento

A ordem, e ela é a mesma que o painel já usa para contratos:

1. **Gravar o contrato** com o plano pago (a rota do contrato já existe; `contratadoEm` é carimbado
   quando a assinatura muda).
2. **Clicar «Habilitar»** — que passa o estado a `ativa`.
3. O estado **efectivo** deixa de ser `expirada` porque `planoPago` é verdadeiro; os limites passam a
   ser os do plano (franquia de aulas, sem tetos de gente), e a demonstração fica no histórico com
   `convertidaEm`.

**O contador da demonstração não transita para o plano.** As 3 aulas da demonstração foram o custo de
aquisição, não as primeiras 3 da franquia paga. A franquia mensal começa no `contratadoEm` e conta o
que for processado a partir dali; o livro da demonstração fica fechado, como facto.

**Se ela clicar «Habilitar» sem contrato pago**, o estado fica `ativa` mas o efectivo continua
`expirada`: a escola abre em só-leitura. É a garantia de que o botão não é uma porta de fuga — a
única porta é o contrato.

---

## 10. A verificação da lógica — o que os números dizem quando confrontados com o sistema

Ela pediu: «Você tem que verificar também essa lógica, tá? A gente nunca vai oferecer mais do que a
capacidade lógica que a gente consegue organizar.» Verificado. Há **uma tensão grande**, duas médias
e uma consequência operacional.

### 10.1 A tensão grande: 2 ciclos × 24 aulas vs 3 aulas

Medido no `ciclos.json` do breu: **um ciclo tem 24 aulas**. Dois ciclos são **48 aulas planeadas**.
O teto é **3 aulas processadas**, e a decisão D5 diz que a aula 01 de cada ciclo já conta. **Se essa
regra se confirmar** (ver 10.1-bis), a conta é:

- gerar o 1.º ciclo → **1 de 3**;
- gerar o 2.º ciclo → **2 de 3**;
- sobra **1 aula** para a escola processar.

**O que isto significa, dito sem rodeios:** a demonstração mostra o **planeamento** e as **primeiras
aulas**, não um ciclo vivido. Isso é coerente como funil comercial — o que se vende é a experiência,
não a operação —, mas **tem de estar escrito na oferta**. Se a escola ler «2 ciclos» e descobrir que
só pode dar 3 aulas, o limite parece um defeito; se ler «2 ciclos planeados e 3 aulas processadas»,
parece o que é.

**Se o objectivo for «experimentar um ciclo inteiro»**, os números têm de mudar: um ciclo com todas
as suas aulas, ou 3 aulas **por ciclo** (6 no total). Ela escolheu 3 no total (D5); o plano respeita,
e declara a consequência.

### 10.1-bis O dado medido contradiz o plano do contador — e isto decide a aritmética

O `ciclo-01-breu-piano-dados.json` de 25/11 (06:41) tem **`lancamentos: 0`**, e o `ciclos.json` do
mesmo ciclo tem **`lancada: false` nas 24 aulas**. Ou seja: **um ciclo recém-gerado não tem, hoje,
nenhuma aula processada — nem a 01.**

O [PLANO-CONTADOR-DE-AULAS.md](./PLANO-CONTADOR-DE-AULAS.md) §7.1 afirma o contrário («a aula 01
está lá desde o primeiro dia»), e a decisão D5 assenta nessa afirmação. **F0 tem de reconciliar as
duas antes de o teto de 3 ser usado:**

- **Leitura A** — o gerador passa a registar a aula 01 como processada no acto de gerar. Então 2
  ciclos gastam 2 das 3, e sobra 1.
- **Leitura B** — a aula 01 só conta quando é lançada. Então 2 ciclos gastam 0, e o teto de 3 é o das
  **primeiras 3 aulas lançadas**, independentemente de quantos ciclos existem.

As duas são defensáveis; a pior é escolher uma sem medir. A leitura A é a que D5 já decidiu, mas
**decidir não é tornar verdadeiro**: se o dado não a suporta, F0 tem de a implementar (escrever o
registo da aula 01 na geração) ou de a corrigir. **Q9**, em §14.

### 10.2 5 alunas para 3 turmas

5 ÷ 3 = 1,67. Se **todas** as turmas tiverem de ter elenco, pelo menos uma fica com **1 aluna**. Duas
turmas com 2 e uma com 1 é o arranjo máximo; três turmas com 2 cada precisam de **6 alunas**.

- **Coerente** se a terceira turma for um **modelo** (uma turma montada para mostrar a organização,
  sem elenco).
- **Incoerente** se a regra for «turma formada = turma com elenco»: aí o limite de 5 e o de 3
  contradizem-se, e o número certo é **6**.

**Recomendação:** manter os 5 e declarar que a terceira turma pode ser um modelo; ou subir para 6 se
o ponto é mostrar três turmas a funcionar. É uma linha no `planos.json`; ela decide.

### 10.3 2 salas para 3 turmas

3 turmas em 2 salas exigem, no mínimo, **dois horários** numa das salas. O sistema suporta-o: a sala
tem `faixas` (N aulas por dia, com dias, hora, duração, período, modalidade e professor). **Coerente**
— desde que a configuração da demonstração nasça com faixas que **não colidam**. A validação de
ocupação ([PLANO-DE-OCUPACAO.md](./PLANO-DE-OCUPACAO.md)) tem de correr; se as 3 turmas colidirem, o
teto de salas é irrelevante e o de turmas é que está a ser violado por baixo.

### 10.4 2 professores, 2 modalidades, 3 turmas

Coerente. Um professor por modalidade e um deles com duas turmas; ou os dois a cobrir as duas
modalidades. O «titular + 1» é literal: o titular **conta** como um dos dois.

### 10.5 3 aulas para 3 turmas

No máximo, uma aula por turma; nenhuma turma tem uma segunda aula. Para uma demonstração, chega para
ver o formulário, a captura e o documento. Para ver **progressão**, não chega — e é a mesma tensão de
10.1.

### 10.6 A consequência operacional do D4: a consultoria come o teto

O mês começa na entrega (D2), mas os limites contam tudo desde a criação (D4). Se ela, durante a
consultoria, montar **2 ciclos e 3 aulas**, a escola recebe uma demonstração **já gasta**: só pode
ler. Isso pode ser exactamente o desejado (a demonstração é o ambiente montado, não um mês de
trabalho), mas é uma decisão **por escola**, e não pode ser descoberta no dia da entrega.

**Recomendação operacional:** durante a consultoria, usar **no máximo 1 ciclo e 1–2 aulas**, e
deixar 1 ciclo e 1–2 aulas para a escola experimentar. Se a demonstração for deliberadamente
«montada e cheia», dizê-lo na entrega.

### 10.7 O custo de operar o teste

2 ciclos + as 3 aulas podem custar **3 actos** (~9 minutos) ou **5 actos** (~15 minutos), conforme a
leitura de 10.1-bis: se a aula 01 for registada no acto de gerar, são 2 gerações de ciclo + 1
lançamento; se cada aula for um lançamento, são 2 gerações + 3 lançamentos. Em qualquer dos casos, o
custo é de **minutos de Actions por escola em demonstração**, além das leituras de KV e de
repositório. A demonstração não é gratuita de operar: é um investimento comercial. Quantas
demonstrações simultâneas se sustentam é uma decisão de negócio, não de código; o plano só declara o
número.

---

## 11. A ordem da obra

O contador de aulas é o primeiro, e a intuição dela está certa. A ordem não é estética: cada fase é a
condição de a seguinte poder ser verdadeira.

| # | Fase | O que é | Depende de | Critério de saída |
|:--|:--|:--|:--|:--|
| **F0** | **O contador de aulas** | `contarAulas` / `contarAulasDoMes` (a função pura), a conferência índice × `ciclos.json` × `-dados.json`, a regra da aula 01 reconciliada (10.1-bis), o alerta das previstas | — | o número existe; a prova reprova quando as três fontes divergem; a aula 01 conta (ou não) por uma regra medida, não por uma suposição |
| **F1** | **O módulo de cotas** | `motor/nucleo/cotas.js`, as sete dimensões puras, o regime (`demonstracao` · `assinatura`), a leitura estrita | F0 | N passa, N+1 recusa, falha de leitura recusa, desligado não conta |
| **F2** | **A criação como consultoria** | a entrada `demonstracao` não pública; a origem `consultoria`; o painel cria com `dispensarPagamento` | F1 | nasce `ativa`, com os sete tetos, e não aparece na oferta pública |
| **F3** | **A entrega e o relógio** | «Entregar à escola»; `entregueEm`/`terminaEm`; o estado efectivo `expirada`; o só-leitura | F2 | o mês conta da entrega; o dia local; sem cron; ler sim, escrever não |
| **F4** | **As travas nas rotas** | professor, aluna, sala, turma, ciclo (no disparador, não numa rota só), aula | F1, F3 | cada rota recusa N+1 com a frase que nomeia o limite |
| **F5** | **A não-renovação da aula** | o livro de identidades no registo comercial | F0, F4 | apagar um ciclo não devolve vagas de aula |
| **F6** | **As telas** | painel (consumo, entrega, estado), escola (faixa e fim), página congelada | F3, F4 | o painel e a escola dizem o mesmo número; a página congelada diz o caminho |
| **F7** | **A oferta** | o texto do mês e dos limites na página de planos (L12 J2) | C8, C13 | o texto é o mesmo do motor; sem preço inventado |
| **F8** | **A incorporação** | L12/L9 revistas, o `REGISTRO-2026.md`, o `ESTADO-ATUAL.md` | F1–F6 | a L12 deixa de prometer 3 meses; o motivo está datado |

**O portão.** O botão **«Entregar à escola»** só é ligado quando **F4 inteira** e **F5** estiverem
feitas. Antes disso, o plano `demonstracao` pode existir no catálogo e no painel, mas a escola não é
entregue — porque uma entrega sem o limite de aulas seria uma promessa de 48 aulas.

**O que se pode fazer em paralelo:** F0 e o desenho das telas (F6) não dependem um do outro; F1 pode
ser escrito com as seis dimensões que não são aulas e a sétima entrar quando F0 fechar. O que **não**
se faz é abrir a entrega antes do portão.

---

## 12. A prova que este plano exige

`experimentos/provar-a-escola-em-consultoria.js` (novo), com a disciplina da casa: cada asserção
morde, e os controlos negativos correm.

| Bloco | O que mede |
|:--|:--|
| **A. O catálogo** | `demonstracao` tem os sete números; `publico: false`; não aparece em `catalogoDaPagina`; os planos pagos **não** ganharam tetos de gente |
| **B. A criação** | `demonstracao` + `dispensarPagamento` nasce `ativa`; sem plano é recusada; um plano pago não recebe os tetos da demonstração |
| **C. Os sete tetos** | para cada um: N passa, N+1 recusa, e a frase nomeia o limite e o número |
| **D. As contagens** | desligada/substituída/inactiva não conta; editar não conta como criar; re-ligar conta; regerar o mesmo ciclo não conta; a leitura falhada **recusa** (não vira 0) |
| **E. O relógio** | entrega + 1 mês no calendário local; o último dia está aberto; o dia seguinte é `expirada`; uma escola criada há 2 meses e entregue hoje tem o mês inteiro |
| **F. O congelamento** | `GET` 200; `POST /api/receber` 402; `ato/consumir` 402; `validar-senha` e `ficha-do-professor` 200; o link para a raiz continua vivo |
| **G. A não-renovação** | «Habilitar» não reinicia `entregueEm`; apagar um ciclo não baixa o livro; a demonstração não recomeça com um novo clique |
| **H. O expurgo** | uma `expirada` **não** é apagável (`estadoDoExpurgo`); depois de «Desabilitar», entra em carência |
| **I. O pagamento** | contrato pago + «Habilitar» levanta os tetos; o livro da demonstração não transita; a franquia mensal começa no `contratadoEm` |
| **J. Controlos negativos** | sem o módulo de cotas, N+1 passa (o defeito); com contagem só derivada, apagar o ciclo renova as aulas; com `expirada` gravada como `suspensa`, a carência começa (o defeito que D3 evita) |

**A prova de identidade** (`node tools/check-identidade.js`) corre no fim, como sempre: as telas novas
usam as peças do catálogo, e nenhuma classe se inventa.

---

## 13. O que **não** se faz

- **Não se trava pela tela.** A tela pode desabilitar o botão; quem recusa é o motor. A estratégia §9
  é explícita: «a interface não será considerada mecanismo suficiente de controle de acesso».
- **Não se conta com um contador guardado para a factura.** A contagem da franquia continua derivada;
  só a demonstração tem um livro de identidades, e ele é uma lista de factos, não um número.
- **Não se apaga automaticamente.** O congelamento não inicia a carência (D3); apagar é um acto dela.
- **Não se põem tetos duros nos planos pagos** sem rever o §ADITIVO §2. Hoje, o limite deles é a
  franquia de aulas com excedente.
- **Não se inventa um zero** quando a leitura falha. Uma escola com 5 alunas e uma leitura falhada
  não são a mesma resposta.
- **Não se confunde o cadastro com o elenco.** As 5 alunas são o cadastro (`alunas`), uma vez por
  apelido; a mesma aluna em duas turmas conta uma.
- **Não se trocam salas e turmas.** «Salas» é `turmas` no KV; «Turmas» é `curadorias` no KV.

---

## 14. O que fica por decidir

| # | Pergunta | Porque importa | Quem decide |
|:--|:--|:--|:--|
| **Q1** | 5 alunas e 3 turmas, ou 6 alunas? | com 5, pelo menos uma turma fica com 1 aluna (ou é um modelo sem elenco) | ela |
| **Q2** | 2 ciclos e 3 aulas é a demonstração que se quer vender? | mostra planeamento, não um ciclo vivido; o texto da oferta depende disto | ela |
| **Q3** | A consultoria deve deixar espaço (1 ciclo/1–2 aulas) ou entregar a demonstração cheia? | com D4, o que ela criar ocupa o teto da escola | ela, por escola |
| **Q4** | Uma prorrogação manual é permitida? | «não se renova» é a regra; uma excepção tem de ser um acto declarado, com motivo e registo, não um botão de renovação | ela |
| **Q5** | Haverá tetos duros nos planos pagos? | hoje o §ADITIVO §2 proíbe bloquear professores/alunos; mudar isso é revê-lo | ela |
| **Q6** | Quem cria a escola em consultoria: só a raiz, ou um papel de consultor? | a origem `consultoria` é uma proveniência; um papel novo é uma frente maior | ela |
| **Q7** | Quantas demonstrações simultâneas se sustentam? | ~9–15 min de Actions por demonstração; é um custo real | ela |
| **Q8** | Quando existe o canal de aviso (e-mail)? | sem ele, o aviso do fim vive só dentro do sistema (L12 J4) | ela, com custo externo |
| **Q9** | A aula 01 conta no acto de gerar o ciclo, ou só quando é lançada? | o dado medido hoje diz «só quando é lançada» (`lancamentos: 0`, `lancada: false`); D5 diz «conta na geração»; é esta resposta que decide se 2 ciclos gastam 2 das 3 ou nenhuma | ela, com F0 |

---

## 15. O que este plano muda no que já está escrito

| Documento | O que muda | Quando |
|:--|:--|:--|
| [PLANEJAMENTO-LASTRO.md](./PLANEJAMENTO-LASTRO.md) → **L12** | os 3 meses passam a 1 mês; o critério (ii) («não desligar automaticamente») passa a «congelar em só-leitura»; a J3 conta da entrega, não do `criado_em`; a J5 ganha o estado `expirada` | F8 |
| [PLANEJAMENTO-LASTRO.md](./PLANEJAMENTO-LASTRO.md) → **L9** | a demonstração é um regime novo; os planos pagos não mudam de semântica | F8 |
| [PLANO-CONTADOR-DE-AULAS.md](./PLANO-CONTADOR-DE-AULAS.md) | o contador ganha um modo **de vida** (para a demonstração), além do modo mensal (para a franquia) | F0/F5 |
| `biblioteca/comercial/planos.json` | entra `demonstracao` com `publico: false` e `limites`; os planos pagos ficam sem `limites` | F2 |
| `motor/nucleo/comercial.js` | `lerComercial` passa a devolver o **estado efectivo** (ou uma função ao lado, uma só, para os dois leitores) | F3 |
| `motor/servidor/producao.js` | o `ehEscrita` passa a cobrir `expirada` com a mesma recusa do `suspensa` | F3 |
| `motor/servidor/raiz.js` | a rota do comercial aceita «entregar»; `estadoDoExpurgo` não muda (o guardado fica `ativa`) | F3 |
| `motor/servidor/disparar.js` | a cota do ciclo antes do `workflow_dispatch`, com a cota injectada no `criarDisparador` (as três pontes passam a fornecê-la) | F4 |
| `experimentos/provar-a-escola-em-consultoria.js` | a prova do §12 | F1–F5 |

---

## 16. O resumo que se lê em trinta segundos

1. **Sete limites:** 2 professores, 5 alunas, 2 ciclos, 2 modalidades, 3 aulas, 2 salas, 3 turmas.
2. **Um mês, da entrega, não da criação; não renova.**
3. **No fim, só-leitura — calculada, sem cron; e sem iniciar a carência de expurgo.**
4. **Os limites contam o que a consultoria criou** (teto total, sem loophole).
5. **D5: as 3 aulas contam a aula 01 de cada ciclo** — se F0 confirmar essa regra (o dado medido hoje
   diz o contrário), com 2 ciclos sobram 1 aula; se não confirmar, as 3 são as primeiras 3 lançadas.
6. **O contador de aulas é o primeiro**, e o botão «Entregar à escola» só liga quando os sete limites
   estiverem fechados.
7. **Pagar levanta o congelamento; «Habilitar» sozinho, não.**
8. **A L12 é substituída, e a substituição tem de ser registada.**
