# Plano — a ocupação: sala, professor e elenco

> **O que este documento é.** O desenho da validação que impede dois corpos no mesmo lugar à mesma
> hora. Ele **não está implementado**. O que já existe está medido (§2), a regra está formalizada
> (§3–§4), o que a mudança quebra está declarado (§6) e a ordem está em §7.
>
> **Porque ele existe.** A proprietária descreveu-o com precisão a 25/11/2026, e ao ir ver o código
> encontrei o contrário do que ela pede — §1.

---

## 1. O achado: a regra de hoje recusa exactamente o cenário que ela descreveu

> «A gente tem ciclos diferentes também e que podem estar no mesmo período de tempo, mas não pode ter
> essa colisão. O que vai separar se todos ocupam a sala às 2:00 da tarde, o que diferencia é o dia da
> semana. Se todos ocupam a sala nas segundas e quartas, o que diferencia é o horário.»

**O código de hoje diz o oposto, e diz porquê.** Está em `motor/nucleo/estado-da-turma.js:181-195`:

```js
return 'a sala «' + s + '» já está ocupada por ' + quem + '. Uma sala recebe UMA Turma por '
  + 'vez: duas Turmas na mesma sala são duas aulas no mesmo horário, no mesmo lugar.' + fim;
```

E a regra que a aplica (`salasOcupadas`, `estado-da-turma.js:138`) compara **só o nome da Sala** — não
lê `dias`, não lê `horarios`, não lê `duracaoMin`. A decisão de 09/11/2026 está escrita na íntegra no
comentário:

> «Duas Turmas na mesma Sala seriam duas aulas a acontecer no mesmo horário, no mesmo lugar: o
> cadastro diria que é possível, e a escola não tem duas salas físicas com o mesmo nome.»

**A premissa era «uma sala = um horário».** O que ela diz agora é que a sala tem **vários horários** —
a Sala é o ritmo (dias, hora de cada dia, duração, período), e duas Turmas nela em horas diferentes
são legítimas. **A regra não está errada no espírito; está a responder a outra pergunta.** O que ela
hoje garante é *exclusividade de sala*; o que se precisa é *exclusividade de tempo no recurso*.

**Isto é um bloqueio concreto e não um detalhe de estilo:** com a regra actual, a escola que tem balé 1
às 14h e balé 2 às 16h na mesma sala, nas mesmas segundas e quartas, **não consegue gravar a segunda
turma**. Recebe 409, com uma frase que afirma ser «no mesmo horário» sobre duas aulas que não são.

**E não é leitura de código — está medido.** Correndo a função verdadeira com duas curadorias na
mesma sala («Estúdio 1») e horas diferentes:

```
salasOcupadas diz que «Estúdio 1» está ocupada? true
por quem: {"id":"c1","professor":"demi-plie","modalidade":"Balé Clássico"}

A MENSAGEM QUE A ESCOLA RECEBE:
  a sala «Estúdio 1» já está ocupada por a Turma de demi-plie em Balé Clássico. Uma sala
  recebe UMA Turma por vez: duas Turmas na mesma sala são duas aulas no mesmo horário, no
  mesmo lugar. Não há nenhuma outra sala livre nesta escola — crie uma (aba Salas) ou libere
  uma (mude a Turma que a ocupa para outra sala).
```

**A frase «duas aulas no mesmo horário» é dita sobre duas aulas que estão a 14h e a 16h.** O
diagnóstico está errado no caso concreto, e a segunda metade — «não há nenhuma outra sala livre» —
empurra a escola para criar uma sala que ela não precisa. É o pior tipo de mensagem: verdadeira sobre
a regra, falsa sobre o mundo.

E há uma prova que fixa o comportamento antigo: `experimentos/provar-mudanca-de-sala.js`, **41
asserções**, cujo resumo diz «uma sala recebe uma Turma». Ela não está errada — está a afirmar a
decisão de 09/11. **Mudar a regra obriga a reescrevê-la**, e é isso que §6 declara.

---

## 2. O que já existe — medido

A validação não precisa de dados novos. **Tudo o que ela lê já está gravado.**

| o dado | onde | estado |
|:--|:--|:--|
| `dias[]` (dias da semana) | a Sala — `motor/servidor/bastidores.js:3636` | **existe**, normalizado |
| `horarios{dia: 'HH:MM'}` — a hora de início **de cada dia** | a Sala — `bastidores.js:3596` | **existe**, validado por regex e descartado se não casar |
| `duracaoMin` | a Sala — `bastidores.js:3653` | **existe** |
| `periodoInicio` / `periodoFim` | a Sala — `bastidores.js:3654-3655` | **existe** |
| `professor`, `modalidade` | a Sala (`enquadramento operacional`, 18/11) e a curadoria | **existe** nos dois |
| `alunas[]` (o elenco) | a curadoria | **existe** |
| a forma «comparar o que existe com o que se grava» | `salasOcupadas`, `alunasComprometidas` | **existe** — é o molde a seguir |

**O comentário do `horarios` já antecipa o que aqui se precisa** (`bastidores.js:3587-3592`): «é do
DIA, não da turma: a direção pode ter a turma às 9h na terça e às 11h na quarta». É exactamente essa
flexibilidade que torna a colisão um cálculo de **intervalos por dia**, e não uma comparação de nomes.

**E o que existe hoje a mais, que fica:** a regra das alunas (`alunasComprometidas`,
`bastidores.js:4159`) recusa uma aluna em duas turmas da **mesma modalidade**. Ela é mais restritiva do
que a nova regra — e a nova não a substitui sem decisão: §5.4.

---

## 3. A regra, na forma que o código pode testar

> **Duas Turmas colidem num recurso quando partilham o recurso E se sobrepõem no tempo.**

O tempo, para uma Turma, é um conjunto de intervalos — um por dia da semana em que ela existe:

```
intervalos(turma) = { (dia, inicio, fim) }
  para cada dia em turma.dias:
    inicio = turma.horarios[dia]           (HH:MM)
    fim    = inicio + turma.duracaoMin     (minutos)
```

**A sobreposição é por dia, e é de intervalos meio-abertos** — `[inicio, fim)`. Duas consequências que
importam e que se testam:

| caso | colide? | porquê |
|:--|:--|:--|
| 14:00–15:00 e 15:00–16:00 | **não** | `fim` não pertence ao intervalo: uma acaba quando a outra começa |
| 14:00–15:30 e 15:00–16:00 | **sim** | 15:00–15:30 é de ambas |
| segundas 14:00 e terças 14:00 | **não** | dias diferentes, mesmo que a hora seja a mesma |
| segundas **e** quartas 14:00, e só quartas 14:00 | **sim** | partilham a quarta |
| 14:00–15:00 e 14:30–15:00 | **sim** | o início da segunda cai dentro da primeira |

E a função, em uma linha: `colide(a, b) = ∃ dia ∈ (a.dias ∩ b.dias) : a.inicio[dia] < b.fim[dia] ∧ b.inicio[dia] < a.fim[dia]`.

---

## 4. Os três recursos, e o que cada um recusa

| recurso | o que se compara | a recusa | o que ela impede |
|:--|:--|:--|:--|
| **Sala** | o **nome** da Sala (é o lugar físico) | duas Turmas na mesma Sala com intervalos sobrepostos | dois corpos no mesmo lugar à mesma hora |
| **Professor** | o **slug** do professor | o mesmo professor em duas Turmas com intervalos sobrepostos | o professor em duas salas ao mesmo tempo |
| **Elenco / aluna** | cada **apelido** do elenco | a mesma aluna em duas Turmas com intervalos sobrepostos | uma pessoa em dois lugares |

**A leitura que a proprietária fez, e que a regra respeita à letra:**

> «um elenco, um integrante do elenco, ele pode sim fazer parte de duas turmas […] mas validando esse
> critério, que a turma não tá acontecendo no mesmo horário, no mesmo dia, na mesma sala.»

O que **deixa de ser verdade** é a restrição por modalidade: hoje uma aluna não pode estar em duas
turmas de «balé clássico» **mesmo em dias diferentes**. Com a regra nova, pode — e é ela quem o diz.
Ver §5.4: é uma decisão, e não um efeito colateral.

**E a excepção que o sistema NÃO prevê**, por decisão dela: dois elencos unificados na mesma sala, no
mesmo horário, num dia raro. «O ideal é que isso não aconteça e o sistema não vai prever isso.» A regra
recusa; o caminho é a direcção resolver fora do sistema, e isso fica escrito na mensagem — uma recusa
que não diz o caminho é uma parede.

---

## 5. As quatro perguntas que a implementação tem de fechar

### 5.1 E uma Turma sem `horarios`?

O campo é **aditivo** (`bastidores.js:3594`: «uma turma sem ela continua a ler-se»). Uma Turma antiga
tem dias e não tem horas. **A resposta não pode ser inventar uma hora** — seria afirmar uma colisão
sobre um dado que não existe, e recusar um acto legítimo é pior do que deixar passar um que a tela
mostra (é a mesma disciplina do `salasOcupadas`, que devolve `null` quando não consegue ler).

**A regra:** a Turma sem hora naquele dia **não é verificável naquele dia**. A conferência salta-a e a
resposta **diz que saltou** — «a turma X não declara hora nas quartas; não a conferi nesse dia». Um
silêncio aqui seria uma colisão por acontecer.

### 5.2 O período (`periodoInicio`/`periodoFim`)

Duas Turmas na mesma Sala, no mesmo dia e hora, mas com **períodos que não se tocam** (uma acabou em
Junho, a outra começa em Agosto) **não colidem**. O período é uma quarta dimensão do intervalo, e
ignorá-la recusaria a sucessão normal de uma sala: a turma que sai e a que entra.

**A regra:** se os dois períodos estão declarados e não se sobrepõem, **não há colisão**, mesmo com
dias e horas iguais. Período em falta é «não se sabe» — e aí compara-se como se se sobrepusessem,
dizendo-o.

### 5.3 A duração

`fim = inicio + duracaoMin`. Uma Turma com `duracaoMin` a zero ou em falta não tem intervalo — e cai
no caso de §5.1: não é verificável, e diz-se.

### 5.4 A regra das alunas por modalidade — **é uma decisão, não um detalhe**

`alunasComprometidas` recusa hoje uma aluna em duas turmas da **mesma modalidade**, sem olhar a horas.
A regra nova é mais permissiva. **As duas não podem conviver**: se a antiga ficar, a nova nunca decide
nada sobre alunas.

| opção | efeito | quem decide |
|:--|:--|:--|
| **(a) substituir** | a aluna passa a poder estar em duas turmas da mesma modalidade, em horas diferentes — que é o que ela descreveu | **ela** |
| **(b) manter as duas** | a antiga continua a mandar; a nova só acrescenta o caso de horas sobrepostas **entre modalidades diferentes** | **ela** |

**A recomendação é (a)**, e a razão é a frase dela: «ele pode até estar fazendo aula na mesma
modalidade no mesmo dia, mas são horários diferentes». A (b) contradi-la-ia. Mas é decisão dela, e o
plano não a toma.

---

## 6. O que a mudança quebra, e como se trata

| o quê | o que acontece | o que fazer |
|:--|:--|:--|
| `experimentos/provar-mudanca-de-sala.js` (41 asserções) | assere «uma sala recebe uma Turma» — fica vermelha | **reescrever a asserção**, e registar que a decisão de 09/11 foi revista a 25/11. Não se apaga a prova: muda-se a regra que ela afirma |
| `motor/nucleo/estado-da-turma.js` (`salasOcupadas`, `salasLivres`, `motivoDaSalaOcupada`) | a regra de exclusividade sai; `salasLivres` deixa de fazer sentido como está | manter as funções e mudar-lhes a pergunta: «quem ocupa esta sala **neste horário**» |
| as duas rotas que as usam (`bastidores.js:28201`, `28746`) | passam a receber a Turma que se grava, e não só o nome | a assinatura muda; a mensagem de recusa passa a nomear **o dia e a hora** do conflito |
| a tela (aba Salas) | mostra «livre/ocupada» por sala | passa a mostrar por **faixa horária** — e isso é peça da folha, não invenção |

---

## 7. A ordem da obra, e o custo

| # | passo | custo | entrega |
|:--|:--|:--|:--|
| 1 | `motor/nucleo/ocupacao.js` — a regra pura: `intervalos(turma)`, `colide(a,b)`, `conflitos({ turma, outras, recurso })` | **0** | a regra, numa função testável |
| 2 | a prova, com os cinco casos-limite de §3 e os dois de §5.2/§5.3 | **0** | a regra provada antes de a ligar |
| 3 | trocar a pergunta do `salasOcupadas` pela regra nova, nos dois sítios | **0** | a sala deixa de ser exclusiva e passa a ser reservada por horário |
| 4 | acrescentar **professor** e **elenco** | **0** | os três recursos |
| 5 | reescrever as 41 asserções de `provar-mudanca-de-sala` | **0** | a decisão de 09/11 revista, e registada |
| 6 | a tela: a faixa horária na aba Salas | **0** | a recusa deixa de ser uma surpresa |

**Nenhum destes passos custa um minuto de cota.** É tudo leitura do KV que o Worker já tem em mãos e
cálculo em memória. O que custa é o que se segue — o contador de aulas
([`PLANO-CONTADOR-DE-AULAS.md`](PLANO-CONTADOR-DE-AULAS.md) §9), que depende desta regra estar certa
porque é dela que sai o calendário que o contador soma.

---

## 8. As quatro decisões — **respondidas a 25/11/2026**

| # | a pergunta | a decisão dela |
|:--|:--|:--|
| 1 | a regra das alunas por modalidade: substituir ou manter as duas? (§5.4) | **(a) SUBSTITUIR** — a aluna pode estar em duas Turmas da mesma modalidade, se não colidirem no horário |
| 2 | uma Turma **sem hora** num dia: salta-se, ou recusa-se a gravação? (§5.1) | **RECUSAR a gravação** — e é mais forte do que eu recomendava |
| 3 | dois períodos que não se tocam na mesma sala: permitir? (§5.2) | **PERMITIR** — é a sucessão normal de uma sala |
| 4 | dois elencos no mesmo horário: recusar sempre, ou um «forçar» declarado? | **RECUSAR SEMPRE** — o sistema não prevê a excepção |

**A decisão 2 muda a regra, e vale escrever porquê.** Eu recomendava saltar a verificação e dizê-lo,
para não transformar um dado antigo em parede. Ela escolheu **recusar**, e a consequência é a certa:
o dado fica **completo**, e a colisão deixa de estar por conferir exactamente nas turmas antigas — que
são as que já estão gravadas. Uma Turma que hoje não declara a hora de um dia passa a ser convidada a
preenchê-la na próxima gravação, e a mensagem nomeia **os dias em falta**. `diasSemHora()` é a função
que os nomeia.

---

## 9. O estado da obra — 25/11/2026 (a tabela fica; o resto do dia vem em §9.1 a §9.5)

| # | passo | estado |
|:--|:--|:--|
| 1 | `motor/nucleo/ocupacao.js` — a regra pura | **FEITO** |
| 2 | a prova, com os casos-limite | **FEITO** — `provar-a-ocupacao.js`, **65 asserções** |
| 3 | trocar a pergunta do `salasOcupadas` pela regra nova, nos dois sítios | **FEITO** |
| 4 | acrescentar professor e elenco às rotas | **FEITO** — na regra e nas duas rotas |
| 5 | reescrever as asserções de `provar-mudanca-de-sala` | **FEITO** — **58 asserções** |
| 6 | a tela: a faixa horária na aba Salas | **por fazer** — é o passo 9 de §9.5 |

### 9.1 O que os passos 3 a 5 fizeram, e o que eles **não** conseguiram

**Feito:** a gravação deixou de perguntar «quem tem esta sala?» e passou a perguntar «quem ocupa este
dia, a esta hora?». A guarda está nos dois sítios (`bastidores.js`, criar e derivar), nomeia o
**recurso**, o **dia** e **as duas horas**, e a curadoria de origem não colide consigo mesma
(`excetoId` implícito). A regra antiga das alunas — «uma aluna pertence a UMA sala por modalidade» —
foi **substituída** por decisão dela: a mesma aluna em duas Turmas da mesma modalidade é legítima
quando os horários não se tocam.

**O achado, e é maior do que a regra.** A CURIADORIA NÃO TEM RITMO PRÓPRIO. Ela declara
`turmas: [nome]` — o nome do registo da Sala —, e o ritmo (dias, hora de cada dia, duração, período)
vive **só** no registo da Sala (`bastidores.js:3636-3656`). Duas curadorias que apontam para o mesmo
registo têm, **por construção**, o mesmo dia e a mesma hora.

Consequência, medida na rota verdadeira (`provar-mudanca-de-sala.js`, B2.3): **o cenário «balé 1 às
14h e balé 2 às 16h na mesma sala» não é expressável no modelo de dados de hoje.** Ou as duas apontam
para o mesmo registo e têm a mesma hora, ou apontam para registos diferentes e são, aos olhos do
sistema, duas salas.

Isto não é um defeito da regra — é o **modelo** que falta. A regra pura aceita horas diferentes
quando lhe dão ritmos diferentes (`provar-a-ocupacao.js`, secção A); o que não existe é onde as
gravar. Duas saídas, e é decisão de produto:

1. **A Sala passa a ter faixas** — o registo guarda uma lista de intervalos (dia, início, fim) em vez
   de um ritmo único, e cada curadoria reserva faixas. É o modelo que a frase dela descreve.
2. **O ritmo passa para a curadoria** — a Sala fica o espaço físico, sem horas, e cada Turma declara
   o seu ritmo. É a leitura mais próxima de «a turma atende nesses dias, com essa duração».

**A resposta chegou a 25/11, e foi a 1 — com um acrescento que eu não tinha visto:** o par
(modalidade, professor) e o período **também** descem para a faixa, porque com eles na Sala a sala só
podia ter uma modalidade o dia inteiro. `faixasDaSala`, `normalizarFaixas` e `espelharFaixa1NaRaiz`
são essa resposta; o que falta é a tela (§9.5, passo 9).

### 9.2 A SALA COM FAIXAS — «N aulas, N modalidades, N professores» (25/11/2026)

**A correcção que ela fez, e o erro era meu.** A tabela dos cenários dizia «mesma sala, mesmo dia,
horas que não se tocam → recusa». **A regra sempre permitiu** — o caso está na prova desde o primeiro
dia (`O CASO DELA: 14h e 16h na mesma sala → NÃO colidem`). O que eu descrevi como recusa era o
**modelo**: a Sala declarava uma hora por dia, e duas turmas no mesmo registo ficavam com a mesma
hora. Confundir a regra com o modelo numa linha de tabela foi o erro, e ele custou uma ronda.

**E a linha 10 era a chave do resto.** Eu escrevi «o professor é declarado na curadoria *ou* na sala».
Medido: desde 18/11/2026 a Turma **deriva** o professor e a modalidade **da Sala**
(`bastidores.js:28165`, `faltaNaSalaParaATurma`). Não são duas fontes — é uma, com uma cópia antiga
que pode ter derivado.

**O que a frase dela obriga.** «Ali pode acontecer N aulas durante o dia e de N modalidades, de N
professores, com N elencos.» Com o par (professor, modalidade) na **Sala**, a sala do piano só podia
ter uma modalidade o dia inteiro. Logo o par desce para a **faixa** — e o período com ele, senão dois
termos na mesma sala obrigavam a duplicar a sala, que é o problema de agora uma dimensão ao lado.

| o quê | onde fica |
|:--|:--|
| **nome** — «a do piano», «a rosa», «a do janelão» | Sala |
| **faixa**: dias, hora de início, duração (→ hora final), período, modalidade, professor | Sala (**+**) |
| **qual faixa esta turma ocupa** | **Turma** — o vínculo, e é aqui que a validação decide |
| **elenco, nível, tradição** | Turma |

**Duas formas convivem, e é isso que dispensa migração.** Uma Sala que ainda declara o ritmo na raiz
— todas as que existem — vale como **uma faixa só** (`faixasDaSala`). Gravar faixas **espelha a faixa
1 na raiz** (`espelharFaixa1NaRaiz`), para o calendário, o plano e as provas — que leem a raiz —
continuarem a ver o ritmo. Nenhum registo antigo se toca (P-03/P-04).

### 9.3 O buraco do fluxo, medido, e o que o fecha

A edição da Sala **já corria a cadeia** (`mudanca-de-sala`), mas a cadeia relê o ritmo e deriva o
plano — **não conferia a ocupação**. Mudar a hora de uma sala com duas turmas podia criar uma colisão
**em silêncio**: nenhuma delas era regravada, e o conflito só aparecia no dia em que alguém voltasse a
mexer numa delas.

`conflitosQueASalaCriaria` compara as turmas **entre si** com a sala nova, e as duas rotas da sala
(`turma-editar` e `turma-derivar`) **recusam com 409** quando o gesto criaria a colisão — no ecrã onde
o gesto aconteceu, que é o que ela pediu.

**E as mensagens deixaram de sugerir.** «Mude a hora ou o dia de uma delas» saiu das três frases: «a
gente não vai dar sugestão de como resolver nada. Resolver esses conflitos é papel do usuário e não
nosso.» O facto fica — quem ocupa, que dia, que horas, que recurso — e o caminho é de quem usa.

### 9.4 O que a mudança partiu, e como se corrigiu

Cinco provas ficaram vermelhas, e **nenhuma era defeito da regra**: quatro mediam sobre um mundo que a
regra nova proíbe, e uma media a sugestão que a decisão removeu.

| prova | o que aconteceu | correção |
|:--|:--|:--|
| `provar-derivacao-da-turma` | as Turmas C, D, E, F, G e H nasciam **todas** às 09:00 de terça, com o mesmo professor | cada uma com o seu horário |
| `provar-identidade-da-turma` | as duas salas nasciam às 19:00; a recusa do professor chegava antes da regra do elenco | `Piano` às 20:00 |
| a mesma | «um elenco COM alunas é recusado pela regra da aluna» — a regra foi substituída | passa a **aceite** |
| `provar-transferencia-e-desligamento` | salas **sem hora**, que a decisão 2 recusa | hora em cada sala |
| `provar-a-ocupacao` e `provar-mudanca-de-sala` | mediam «Mude a hora ou o dia» / «pode estar nas duas» | passam a medir a **ausência** da sugestão |

E **três defeitos meus**, apanhados pelas provas: (1) a guarda da Turma era chamada com um objecto
construído à mão que não levava `faixa`, e a sala com duas respondia «é preciso dizer qual» a um
pedido que já a tinha dito; (2) `faixas` ficou fora de `CAMPOS_DO_FORMULARIO`, e a **derivação da sala
descartava as faixas que o formulário mandava** — o elo novo nascia com o ritmo velho, sem erro
nenhum; (3) o período da faixa vazia **apagava** o período da raiz no espelho.

**E uma asserção minha que passava sem a linha que a implementa**: a que devia provar que o professor
da Sala entra na união passava porque a curadoria do caso já declarava o mesmo professor. Reescrita, o
controlo negativo dá **3 falhas** sem a linha.

### 9.5 O estado da obra — 25/11/2026, fim do dia

| # | passo | estado |
|:--|:--|:--|
| 1 | `motor/nucleo/ocupacao.js` — a regra pura | **FEITO** |
| 2 | a prova da regra | **FEITO** — `provar-a-ocupacao.js`, **65 asserções** |
| 3 | a guarda nos dois sítios de gravação da Turma | **FEITO** |
| 4 | professor e elenco nas rotas | **FEITO** |
| 5 | as asserções de `provar-mudanca-de-sala` | **FEITO** — **58 asserções** |
| 6 | **as faixas no núcleo e nas rotas** | **FEITO** — `faixasDaSala`, `faixaEscolhida`, `normalizarFaixas`, `espelharFaixa1NaRaiz` |
| 7 | **a colisão criada pela Sala recusa no gesto** | **FEITO** — `conflitosQueASalaCriaria`, nas duas rotas |
| 8 | **sem sugestão de resolução nas mensagens** | **FEITO** |
| 9 | **a tela: o «+» na Sala e a escolha da faixa na Turma** | **FEITO** — `provar-as-faixas-na-tela.js`, **51 asserções** |
| 10 | o par (modalidade, professor) por faixa no passo «Associar» | **por fazer** |

**O passo 9 fechou o caminho até o modelo.** A aba Salas ganhou o «+ Acrescentar faixa horária» — e
cada bloco leva os dias com a hora de cada um, a duração (que dá a hora final) e o período. O «+»
clona a faixa 1 e **limpa os `id` do clone**: dois elementos com o mesmo nome no documento é o defeito
que aparece longe da causa. O `data-faixa` novo é `f<n>` a partir de um contador que só cresce — um id
reutilizado apontaria a Turma de uma faixa apagada para a que tomou o lugar dela. O «×» tira e
renumera, e **não tira a última**: uma sala sem faixa não tem ritmo.

Na Turma, o campo «Faixa horária desta Turma» **só aparece quando a sala tem mais de uma** — com uma
faixa não há pergunta a fazer, e um campo que se mostra para não oferecer escolha ensina a ignorar
campos. O rótulo de cada opção diz os dias, as duas horas e o par, que é o que distingue «balé às 9h»
de «jazz às 10h» na mesma sala.

**A leitura é POR BLOCO.** `marcados("dia")` e `horariosDoDia()` varrem o documento inteiro, e com
duas faixas devolveriam os dias de todas — a faixa 1 ficaria com os dias da 2. A prova mede-o à letra:
a faixa 2 fica só com o dia dela. E o mesmo erro de âmbito estava na `sincronizarHoras`, que passou a
receber o bloco.

| 10 | **o par (modalidade, professor) por faixa no «Associar»** | **FEITO** — `provar-o-ciclo-das-faixas.js`, **33 asserções** |

**O passo 10 fechou o par por faixa, e com ele um defeito que o passo 9 tinha deixado.** Uma sala com
balé às 9h e jazz às 10h ficava com o **mesmo docente** nas duas, porque o par era um só por sala. O
«Associar» continua a perguntar o par da faixa 1 no bloco de cima — é o que quase todas as salas têm —
e ganhou o bloco «Quem dá as outras faixas desta sala», com uma linha por faixa. `parDaFaixa` lê o par
da **faixa escolhida** (a raiz como reserva), e a Turma deriva de lá o professor e a modalidade: sem
isso a Turma das 10h nascia com o docente da das 9h. A rota confere o par de cada faixa pela mesma
função e **recusa a gravação inteira** se uma falhar, dizendo qual.

**E o «não persistiu», que era outra coisa.** O «Derivar» repunha o ritmo só na faixa 1: a reposição
era a de antes das faixas, e escrevia os dias e as horas da sala em **todos** os blocos. A segunda
faixa não chegava ao formulário, e ao gravar desaparecia sem erro nenhum. `pintarFaixasNaSala` repõe
cada bloco com o seu ritmo.

**A costura que faltava medir.** `provar-as-faixas-na-tela` mede o DOM e `provar-mudanca-de-sala` mede
a rota com um corpo escrito à mão; **nenhuma media o que o formulário envia depois de abrir uma sala
existente**, e foi por aí que o defeito passou. `provar-o-ciclo-das-faixas.js` faz o caminho inteiro —
abre, repõe, clica no «+», lê o corpo, entrega-o à rota — e é vermelha sem a mudança.
