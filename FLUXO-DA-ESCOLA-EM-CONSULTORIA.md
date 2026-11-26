# O fluxo da escola em consultoria — o guião de quem vai operar

> **Para que serve este documento.** É o **manual de operação e de treino** do plano consultoria: a
> história que se conta ao consultor, o passo a passo do que ele faz em cada ecrã, o que ele diz
> quando a escola bate no limite, e o que ele **não** pode fazer. O desenho técnico e as decisões
> estão no [PLANO-DA-ESCOLA-EM-CONSULTORIA.md](PLANO-DA-ESCOLA-EM-CONSULTORIA.md); o dinheiro está no
> [CUSTO-DOS-FLUXOS.md](CUSTO-DOS-FLUXOS.md) §22.
>
> **A regra que atravessa tudo, e é dela:** «o risco do negócio é meu, não é nem do consultor». O
> consultor não cobra, não promete, não negocia e não decide. Ele **monta o ambiente, mostra, e
> entrega**. Quem cobra é o Sistema Lastro, e quem decide é ela.

---

## 1. O que é isto, em trinta segundos

Uma escola que **ainda não é cliente** recebe um ambiente **com o nome dela**, montado pelo
consultor, com o planeamento e as primeiras aulas já lá dentro — e usa-o **por um mês**. O mês não se
renova. No fim, ela **só lê**: o que foi criado fica legível, e o que ela não pode é criar mais. Se
contratar, ela clica «Habilitar» e a escola fica livre dentro do plano. Se não contratar, o ambiente
congela e o custo para o Sistema Lastro para naquele instante.

**Porque é que isto existe.** Porque o produto não se explica — mostra-se. Uma escola que ouve falar
de «memória da aula dada» não sabe o que isso é; uma escola que abre o ambiente dela e vê o plano da
própria turma, com as marcas que o professor marcou, sabe.

**Porque é que tem limites.** Porque a demonstração é um investimento com risco de quem a paga: se a
escola não contratar, o que ficou gasto é o custo do ambiente montado — e ele está calculado e é
pequeno (§22). Sem limite, uma demonstração podia correr um mês inteiro de aulas e custar oito vezes
mais.

---

## 2. Os dois papéis, e a fronteira entre eles

| | **Ela — a proprietária** | **O consultor** |
|:--|:--|:--|
| cria a escola | **sim** (é ela que abre o ambiente) | não |
| monta o plano, as salas, as turmas | supervisiona | **sim** |
| mostra à escola | não | **sim** |
| entrega o mês | **sim** — o botão «Entregar à escola» | não |
| prorroga | **sim**, com motivo | pede, não decide |
| cobra | **sim** | **não, nunca** |
| habilita depois do pagamento | **sim** | não |

**A fronteira é de risco, e não de hierarquia.** O consultor pode tudo o que é *montar e mostrar*; o
que ele não pode é **assumir compromisso comercial** — nem preço, nem prazo, nem «deixe que eu
resolvo». Uma promessa feita por quem não paga a conta é a origem mais comum de cliente irritado.

### 2.1 O que o consultor paga, e porquê — o guião de dez reais

**Ele cobra R$ 120,00 a hora da escola, e paga R$ 10,00 por consultoria a quem administra o
Sistema Lastro.** A taxa é por **consultoria que deu escola**, e não por hora nem por sessão: é ela que paga
a cota do serviço (R$ 10,00 compram 277 minutos de processamento, e o pior caso de uma demonstração são
26 — ver o [CUSTO-DOS-FLUXOS.md](./CUSTO-DOS-FLUXOS.md) §22).

**O que ele tem de saber dizer, e não é opcional:**

| a pergunta que ele vai ouvir | a resposta |
|:--|:--|
| «isto tem custo para mim?» | não. A escola paga a hora da consultoria a ele, e o mês de demonstração é grátis |
| «e para você?» | **R$ 10,00 por consultoria** — e ele diz o número, porque um preço escondido aparece sempre |
| «se eu não contratar, você perde?» | **não** — os R$ 10,00 são dele para ela, e o risco de a escola não contratar é dela, não dele |

**Quando é que ele paga:** a taxa conta quando a **escola nasce** pelo link dele. Um link que
ninguém abriu não custa nada a ninguém — não houve consultoria, houve um link. E o pagamento é
combinado **fora do sistema**: não há cartão nem repasse, e o sistema só guarda o que é devido e o
que já foi recebido.

**Uma coisa que ele não faz, nunca:** cobrar a taxa à escola, ou descontá-la das horas. São dois
dinheiros diferentes, com dois donos diferentes — as horas são dele, a taxa é dela.

---

## 3. A história, em nove passos

### Passo 1 — A conversa, antes de haver sistema

O consultor explica o que vai acontecer, e **na letra certa**:

> «Eu vou montar o ambiente da sua escola com o seu nome — as suas salas, as suas turmas, o seu jeito
> de planejar. Você vai poder usar por um mês, e o que você criar fica. Depois do mês, se você quiser
> seguir, a gente contrata; se não quiser, o ambiente fica lá para você consultar, e nada mais é
> criado. **A demonstração inclui 2 professores, 5 alunas, 2 ciclos, 2 modalidades, 3 aulas, 2 salas e
> 3 turmas.** Para mais do que isso, é o plano contratado.»

**Porque é que os sete números são ditos agora, e não no fim.** Um limite descoberto no dia em que ela
bate nele parece um defeito. Dito no começo, é o que é: o tamanho da demonstração.

### Passo 2 — Ela cria a escola (plano consultoria)

No painel `danca.padd.com.br`, ela cria a escola com o plano **consultoria**. A escola nasce
**ativa** e **sem cobrança** — a consultoria não é dívida, e não há pagamento a conciliar.

O consultor recebe o endereço e as senhas (**na mão, nunca por e-mail em claro**).

Neste instante **ainda não há prazo a correr**: o mês começa na entrega (passo 8), e é isso que impede
o tempo da consultoria de comer o prazo da escola.

Custo: **2 minutos** — o job `criar` e o `derivados` que o commit dele acorda. Não acorda `publicar`:
uma escola nova entra no *shard*, e não ganha `wrangler` próprio.

### Passo 3 — O consultor monta quem trabalha

Na Produção, em `bastidores/estudio`:

| aba | o que ele faz | quanto pode |
|:--|:--|:--|
| **Pessoas → Professores** | o titular já existe; acrescenta **um** | **2** |
| **Pessoas → Alunas** | cadastra as alunas da escola | **5** |
| **Pedagogia → Salas** | cria as salas com dias, hora e duração (e a modalidade) | **2** |
| **Pedagogia → Turmas** | forma as turmas, escolhendo a sala | **3** |

**Isto não custa nada.** Cadastro vive no KV: zero minuto de Actions, zero centavo.

**A armadilha dos nomes, dita para não se perder tempo:** a aba **«Salas»** é o espaço e o horário; a
aba **«Turmas»** é o grupo formado. São duas coisas diferentes, e o limite conta as duas.

**O que ele não deve tentar:** criar a terceira sala «para ver o que acontece». O motor recusa, e a
recusa é correcta. Antes de bater, ele decide com a escola **quais são as duas salas que importam**.

**As três turmas não são três demonstrações.** Esta é a decisão que faz a conta fechar: ele monta as
três (o limite permite), mas **leva só uma até ao fim** — plano, PO e ciclos. É essa a turma que se
apresenta, e é a diferença entre uma demonstração de **16 minutos** e uma de **26** (§7-bis).

### Passo 4 — O consultor faz o plano de ensino

Na Produção, na Turma: o plano de ensino da turma, com os objectivos, o repertório e a régua. É aqui
que a escola vê, pela primeira vez, **o que o sistema entende por planejar**.

Custo: **1 minuto** (uma gravação, um commit, um `derivados`).

### Passo 5 — O consultor grava o PO

O Protocolo de Observação da turma — os marcos, os termos, o que se observa na aula. É a peça que
transforma «planejar» em «registrar o que aconteceu».

Custo: **2 minutos** — o PO é o único acto da Produção que **também pede a geração**: grava o elo, a
fonte, e acorda o `gerar` além do `derivados`. Medido em três gravações.

### Passo 6 — O consultor gera os ciclos

O botão que gera o pacote do ciclo: o plano do ciclo, o PO do ciclo, o calendário das aulas, o
pacote publicado.

Custo: **1 minuto** por ciclo **por turma**. Com **2** ciclos numa turma, **2 minutos**. Se ele gerar
os dois ciclos das **três** turmas, são 6 minutos — e é por isso que o guião diz, no passo 3, que a
demonstração monta **uma** turma que se mostra e as outras duas que o limite permite.

**A conta que ele tem de saber de cor, e que ela decidiu:** o teto é de **3 aulas**, e uma aula conta
**quando é lançada** — não quando o ciclo é gerado. Portanto:

> **2 ciclos gerados gastam 0 das 3 aulas. As 3 aulas são as três primeiras que a escola lançar.**

É por isso que a demonstração mostra **o planeamento** — dois ciclos inteiros, com todas as aulas
datadas — e **as primeiras aulas vividas**. Se ele quiser que a escola veja o ciclo inteiro com
registos, isso não é uma demonstração: é a operação, e é o plano pago.

### Passo 7 — A apresentação

O consultor abre o ambiente **com a escola**, e mostra — nesta ordem, e só isto:

1. **o plano da turma** — «foi isto que a gente combinou?»;
2. **o PO** — «é isto que a sua escola observa»;
3. **o calendário do ciclo** — as 24 aulas datadas, do ritmo que ela declarou;
4. **a primeira aula já lançada** — o formulário preenchido, com presença e observação;
5. **o relatório que sai dali** — a prova de que o registo não fica no caderno.

**Uma aula lançada no passo 7 gasta 1 das 3.** Se ele quiser a demonstração com as 3 disponíveis, ele
lança a primeira **com a escola e à frente dela** — que é exactamente o que se quer mostrar.

Custo de cada aula lançada: **3 minutos**.

### Passo 8 — Ela entrega o mês

No painel, na linha da escola, o botão **«Entregar à escola»**. É aqui que o relógio começa: um mês,
contado do dia local, até às 23:59:59 do último dia.

**Uma entrega, um clique.** Entregar de novo não reinicia o mês — o sistema recusa, e diz porquê.
Mais um mês é a **prorrogação** (passo 9-bis), que é um acto declarado.

Custo: **zero** (KV).

### Passo 9 — O mês da escola, e os três desfechos

A escola usa o ambiente sozinha. A faixa no «mês a mês» diz sempre **até quando** vai e **quanto**
usou dos sete limites. Nos últimos sete dias, a faixa avisa que no fim o acesso passa a só-leitura.

**Desfecho A — ela contrata.** Ela grava o contrato com o plano pago e clica «Habilitar». Os sete
tetos caem; a franquia mensal começa no `contratadoEm`; o livro das 3 aulas da demonstração fica
fechado como facto, e **não** transita para a franquia.

**Desfecho B — ela não contrata.** No dia seguinte ao fim, a escola abre em **só-leitura**: lê tudo,
não escreve nada. O ambiente **não é apagado**. O custo parou no minuto em que o limite fechou.

**Desfecho C — ela pede mais um mês.** Ela prorroga (passo 9-bis). A prorrogação conta **do fim que
já estava marcado** — não de hoje —, leva motivo, e fica no histórico. «Não se renova» continua
verdadeiro: a excepção tem dono e data.

### Passo 9-bis — A prorrogação

No painel, na mesma linha: **«Prorrogar 1 mês»**. Ele pede, ela clica. A regra que o consultor
transmite, e não negocia:

> «Mais um mês é possível, e é uma decisão da administração. O que eu não posso prometer é que ele se
> renove sozinho — não renova.»

---

## 4. O que o consultor diz quando a escola bate no limite

A frase não é «deu erro». Ela é a do sistema, e o consultor diz a mesma:

| limite | o que ele diz |
|:--|:--|
| **2 professores** | «A demonstração inclui 2 professores, e já estão os 2 — o titular e mais um. O que está criado continua legível; para acrescentar outro, é o plano contratado.» |
| **3 aulas** | «A demonstração inclui 3 aulas processadas, e já foram as 3 — cada aula conta uma vez, e não se renova. O que está criado continua legível; para continuar a dar aulas, é o plano.» |
| **2 salas / 3 turmas** | «A demonstração tem 2 salas e 3 turmas. Neste tamanho, é o que cabe.» |

**As três coisas que a frase faz, e nenhuma delas é desculpar-se:** diz **o limite**, diz **o que já
foi usado**, e **oferece a saída**. Uma frase que só diz «não dá» transforma uma demonstração boa numa
sensação de produto pequeno.

**O que ele NUNCA diz:** «eu libero para você», «deixa comigo que eu resolvo», «eu falo com ela e
ela abre». Nenhuma dessas frases é verdade — ele não tem o botão.

---

## 5. O que o consultor não pode fazer

- **Não cobra, não dá preço, não fecha contrato.** Se perguntarem quanto custa, a resposta é: «quem
  fala de plano é a administração do Sistema Lastro, e eu passo o seu contacto». E passa.
- **Não promete prazo nem excepção.** Nem «mais uma semaninha», nem «acho que dá para mais 3 aulas».
- **Não pede nem guarda senha.** A senha da escola não sai dela; se precisar de mostrar algo, ela é
  quem entra.
- **Não cria a escola, nem entrega o mês, nem habilita.** Esses três botões são dela.
- **Não apaga nada.** Nem uma turma «para caber», nem uma aula «para libertar vaga». As aulas são de
  vida: apagar não devolve nada, e apagar o que a escola já viu é o oposto de demonstrar.
- **Não põe dados pessoais em claro** — nem no chat, nem num ficheiro, nem num print. Apelidos
  estáveis, e mais nada.
- **Não leva a demonstração para uma escola que não assinou o termo de uso.** O ambiente tem dado de
  aluna.

---

## 6. O treino do consultor — o guião de duas horas

O treino é **fazer**, e não ouvir. Duas horas, quatro blocos, e uma demonstração inteira montada do
zero por ele.

### Bloco 1 — a história (15 minutos)

O consultor conta **ele próprio**, em voz alta, os nove passos do §3. O que se corrige: os sete
números (tem de os dizer sem consultar) e as três frases de recusa do §4.

**Critério de saída:** diz os sete números de cor e não inventa preço nenhum.

### Bloco 2 — a montagem, com ele a clicar (45 minutos)

Uma escola de treino, criada por ela, com o nome de um caso real. Ele faz os passos 3 a 6 **sozinho**,
e erra à vontade: cada erro custa **1 a 3 minutos** de cota, e é para isso que o treino existe.

O que se observa, e se corrige na hora:

| o que se vê | o que significa |
|:--|:--|
| ele cria 2 salas antes de perguntar as modalidades | vai travar no limite de modalidades — perguntar primeiro |
| ele tenta a terceira sala | leu o limite como sugestão |
| ele gera o 3.º ciclo | não sabe que o teto é 2 |
| ele lança aulas durante a montagem | gastou o mês da escola antes de ela o ver |

**Critério de saída:** dois ciclos gerados, 2 salas, 3 turmas, 5 alunas, 2 professores, **0 aulas
lançadas** — e o ambiente a abrir.

### Bloco 3 — a apresentação, com um actor a fazer de escola (30 minutos)

Alguém faz de dono de escola e **interrompe**: «quanto custa?», «e se eu quiser mais 3 alunas?», «e
depois do mês?». O consultor responde sem sair do §4 e do §5.

**Critério de saída:** não prometeu nada, não inventou preço, e o actor ficou a saber exactamente
quanto tempo tem.

### Bloco 4 — o fim (30 minutos)

Faz-se o desfecho B — o mês a fechar —, e mostra-se a página em só-leitura. O consultor tem de saber
dizer «não é apagado, você continua a ler» sem hesitar: é a frase que evita a sensação de que o
trabalho foi perdido.

**Critério de saída:** ele mostra a leitura a funcionar e o criar a recusar, e explica as duas coisas
na mesma frase.

### O que o treino custa

| o que | em minutos de cota |
|:--|--:|
| uma demonstração canónica, uma turma ([CUSTO-DOS-FLUXOS.md](CUSTO-DOS-FLUXOS.md) §22.2) | **16** |
| uma repetição completa — inclui o desfecho e a página em só-leitura | **16** |
| **por consultor, com uma repetição** | **32** |

A **R$ 0,036/min**, são **R$ 1,15 por consultor treinado**. O tempo das pessoas é o custo que aqui
não se pode escrever, porque ele não é meu para fixar: são **duas horas de treino** e **três horas de
preparação** por escola do lado do consultor, e é ela quem lhes dá preço.

**O número a orçamentar é 26, e não 16.** Uma demonstração canónica — a turma que vai ser mostrada —
gasta 16 minutos; o pior caso que ainda cabe dentro das sete paredes (as três turmas montadas, com dois
ciclos cada) gasta 26. É esse o valor de que se fala com ela, porque é o único que não depende de o
consultor ter montado uma turma ou três.

**E o treino não se faz na escola do cliente.** Faz-se numa escola de treino, com dado inventado, que
se apaga depois — uma escola de treino não tem o risco de expor dado de aluna.

---

## 7. A checklist de cada demonstração

Antes de entregar o mês, o consultor confirma os sete, e **diz à escola que os confirmou**:

- [ ] 2 professores, e o titular entre eles
- [ ] 5 alunas, no cadastro
- [ ] 2 salas, com dias e horas que não colidem
- [ ] 3 turmas, cada uma a apontar a sua sala
- [ ] 2 modalidades — e nenhuma a mais nas faixas
- [ ] 2 ciclos gerados, com o calendário a bater com o ritmo da sala
- [ ] **quantas aulas já foram lançadas** — se foram 3, o mês da escola é só de leitura

E, no fim da conversa, a frase que fecha:

> «O ambiente é seu até <data>. Até lá, você pode criar dentro destes limites. Depois, ele continua
> legível e deixa de aceitar coisa nova. Se quiser seguir, a administração fala com você sobre o
> plano.»

---

## 7-bis. Quanto custa isto — a resposta a «não vai sair de graça»

A demonstração gasta **minutos de cota do GitHub Actions**, e cada execução é facturada ao minuto.
Medido no Actions (a conta e os casos estão em [CUSTO-DOS-FLUXOS.md](CUSTO-DOS-FLUXOS.md) §22):

| acto | min |
|:--|--:|
| criar a escola | 2 |
| gravar o plano de ensino | 1 |
| gravar o PO | 2 |
| gerar 1 ciclo (por turma) | 1 |
| **1 aula lançada** | **3** |
| entregar · prorrogar · habilitar | 0 |

| cenário | min | R$ |
|:--|--:|--:|
| **canónico** — 1 turma, 2 ciclos, 3 aulas | **16** | **R$ 0,58** |
| **pior caso dentro do limitador** — 3 turmas, 2 ciclos cada, 3 aulas | **26** | **R$ 0,94** |
| **sem o limitador** — as 48 aulas dos 2 ciclos | **151** | **R$ 5,44** |

**A frase que o consultor pode dizer, e é verdadeira:** «o pior caso desta demonstração é menos de um
real». É essa a garantia que o limitador compra — não um desconto, mas um **tecto conhecido antes de
começar**. Sem ele, a mesma demonstração custaria 9,4 vezes mais.

**E a frase que ele NÃO diz:** quanto é que a demonstração custou. O custo é da administração, e
transformá-lo em assunto de conversa convida a negociá-lo.

**Porque é que ele monta uma turma e não três.** A demonstração mostra **uma** turma em profundidade —
é a que se apresenta. As outras duas existem porque o limite as permite, e ficam montadas sem ciclo
gerado. Gerar os ciclos das três é o que leva o custo de 16 a 26 minutos, e não é preciso para
mostrar nada.

---

## 8. O guião — o que ele diz, com os números à frente

Esta secção é para ser **sabida de cor**, não lida em voz alta. Todos os números vêm do catálogo
(`biblioteca/comercial/planos.json`), e a prova `provar-o-guiao-do-consultor` recalcula-os de lá:
quando o catálogo mudar, ela reprova até este texto mudar também.

### 8.1 Os três planos

| plano | por mês | franquia | inclui | **vai até** |
|:--|--:|--:|:--|:--|
| **Básico** | **R$ 69,90** | 130 aulas/mês | 1 professor · 10 alunas | **2 professores · 39 alunas** |
| **Intermediário** | **R$ 99,90** | 320 aulas/mês | 3 professores · 40 alunas | **5 professores · 89 alunas** |
| **Avançado** | **R$ 139,90** | 500 aulas/mês | 6 professores · 90 alunas | **20 professores · 500 alunas** |

**As duas colunas de gente não são a mesma coisa, e confundi-las é o erro mais caro deste guião.**
«Inclui» é o **piso** — o que o plano traz. «Vai até» é o **teto** — o ponto em que o degrau de cima
começa. O Básico inclui **um** professor e **vai até dois**: uma escola que viu dois professores na
demonstração **não perde nenhum** ao assinar o Básico.

> Se ele disser «o Básico dá um professor» e a escola tiver dois, ele acabou de vender um medo. A
> frase certa é: **«o Básico inclui um e vai até dois.»**

**A frase que faz a escola escolher sozinha:** um ciclo tem **24 aulas**.

| plano | ciclos por mês | o que isso é |
|:--|--:|:--|
| Básico | **5 e meio** | duas turmas, duas vezes por semana (umas 17 aulas), cabe com folga |
| Intermediário | **13** | três a quatro turmas a rodar |
| Avançado | **20** | a escola inteira, sem contar |

### 8.2 As três regras que ele não pode deixar para o fim

1. **O pagamento é antecipado.** «Você assina e usa.» Não há mês a crédito, e a habilitação só
   acontece quando o dinheiro entra na conta — e quem habilita é ela, não ele.
2. **O que passar da franquia custa R$ 8,00 por aula.** Entra **discriminado** na fatura do mês
   seguinte, com o número de aulas e a conta à vista. **Não interrompe o trabalho** — onera.
3. **A franquia é mensal e não acumula.** O que não foi usado não passa para o mês seguinte.

**E a distinção que gera queixa quando ele hesita:** na **consultoria**, o limitador **interrompe** —
a escola bate na parede e a parede é a demonstração. No **plano pago**, o excedente **onera** — a
escola continua a dar aula e paga R$ 8,00. Uma coisa é uma demonstração com tamanho; a outra é uma
assinatura com franquia. Ele diz isto com estas palavras, e não com «depende».

### 8.3 As extensões — e o que ele **não** pode dizer delas

O catálogo tem duas extensões de configuração (`Turma pronta — configuração` e `Turma pronta —
configuração e conteúdo`). **E as duas estão com preço zero**: não há preço declarado.

**Por isso ele não anuncia preço de extensão nenhum.** O que ele diz, e é verdade:

> «Há um serviço de arranque em que as turmas ficam já montadas — eu levanto isso com a administração
> e digo-lhe o valor.»

**O momento de falar delas é um só, e é depois da primeira aula lançada** — nunca antes. A extensão
resolve um trabalho que a escola já viu dar trabalho; oferecida antes, é um custo a mais numa conversa
que ainda não tem problema.

### 8.4 Quando é o melhor momento de migrar

| o sinal | o que significa | o que ele diz |
|:--|:--|:--|
| a escola pediu o 6.º aluno, o 3.º ciclo ou a 4.ª aula | bateu no limite da demonstração | «isto é o plano de demonstração, não o sistema: o Básico já lhe dá 10 alunas e 130 aulas por mês» |
| a escola perguntou «e depois do mês?» | já está a planear | **é o momento** — a pergunta é dela, não uma venda dele |
| a escola quer dois professores | a demonstração dá 2, o Básico inclui 1 | «o Básico inclui um e **vai até dois** — os dois que você viu continuam lá» |

**A regra de ouro:** ele não vende plano durante a consultoria. Ele **responde**. Uma venda feita no
meio da montagem interrompe o trabalho e faz a escola sentir-se pressionada — e a demonstração é o
argumento, não a tabela de preços.

### 8.5 O que ele não diz, nunca

- preço que não esteja no catálogo — **nem desconto**, nem «eu vejo com ela se dá para fazer»;
- preço de extensão (não está declarado — §8.3);
- prazo de activação que não seja «assim que o pagamento entrar»;
- que a demonstração **se renova** — não se renova, e prorrogar é decisão dela;
- que **ele** resolve a activação. Ele não resolve: **ele não tem o botão**.

### 8.6 As quatro perguntas que ele vai ouvir, e as respostas

| a pergunta | a resposta |
|:--|:--|
| «isto tem custo para mim?» | não. A hora da consultoria é paga a ele; o mês de demonstração é grátis |
| «e para você?» | **R$ 10,00 por consultoria** — ele diz o número, porque um preço escondido aparece sempre (§2.1) |
| «se eu não contratar, você perde?» | não. O risco de a escola não contratar é dela, não dele |
| «quanto tempo eu tenho?» | **um mês a contar do dia em que a escola nasceu**, e no fim fica em leitura — nada se apaga |

---

---

## 9. Onde isto está no sistema

| o que | onde |
|:--|:--|
| os sete números | `biblioteca/comercial/planos.json` → `consultoria.limites` |
| a regra dos limites | `motor/nucleo/cotas.js` |
| o estado efectivo (e o `expirada`) | `motor/nucleo/comercial.js` → `estadoEfetivo` |
| o fim do mês | `motor/nucleo/fuso.js` → `fimDeUmMes` |
| a entrega e a prorrogação | `POST /api/escola/consultoria` |
| o congelamento | `motor/servidor/producao.js` → `ehEscrita` |
| a faixa do prazo e do consumo | `bastidores/estudio/financeiro` (mês a mês) |
| a prova | `experimentos/provar-a-escola-em-consultoria.js`, `experimentos/provar-o-custo-da-consultoria.js` |
