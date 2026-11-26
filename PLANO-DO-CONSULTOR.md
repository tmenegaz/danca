# O consultor — o cadastro, o link, o dinheiro e o guião

> **O que este documento é.** O plano do consultor: quem ele é no sistema, por onde entra, o que o
> link dele autoriza, quanto custa e quanto paga, e o que ele tem de saber dizer a uma escola. É o
> plano — o que está implementado e o que não está vai dito em cada secção, e a §11 diz a ordem.
>
> **O que ele não é.** Não é o plano da escola em consultoria — esse é o
> [PLANO-DA-ESCOLA-EM-CONSULTORIA.md](PLANO-DA-ESCOLA-EM-CONSULTORIA.md), com os sete limites já
> implementados. Este documento **usa** aquele, e não o reescreve.
>
> **A frase que decide tudo, e é dela:** «o risco do negócio é meu, não é nem do consultor». O
> consultor cobra R$ 120 a hora da escola e isso é dele. O que ele paga a ela é **R$ 10 por
> consultoria**, com êxito ou sem êxito. O sistema não cobra do consultor nem repassa a ele: o
> sistema **regista** o que é devido, e quem cobra é ela.

---

## 1. O que já existe, medido

Isto não se constrói do zero. Antes de propor, o que a árvore já tem:

| peça | onde | o que já faz |
|:--|:--|:--|
| **dois endereços, um Worker** | `motor/servidor/raiz.js` → `ehPaginaPublica` | `danca.padd.com.br` (e `*.workers.dev`) é o painel, atrás de senha; **todo o resto é público**. Um host desconhecido recebe a apresentação e o formulário — nunca a lista de escolas |
| **o endereço público já está ligado** | `tools/ligar-pagina-publica.js` | `lastro.padd.com.br` → Worker `danca`, com DNS e rota. Idempotente, e recusa sem token |
| **a criação pública de escola** | `POST /api/criar-escola` com `origem: 'publico'` | a escola cria-se sozinha: nome, CNPJ, e-mail, telefone, professor (nome, CPF, e-mail, telefone, senha, modalidade). Valida no servidor, e recusa o CNPJ repetido com a saída na frase |
| **o plano consultoria, com os sete limites** | `planos.json` → `consultoria.limites`, `motor/nucleo/cotas.js` | 2 professores · 5 alunas · 2 ciclos · 2 modalidades · 3 aulas · 2 salas · 3 turmas. Tetos **duros**, as aulas **de vida**, e sete recusas ligadas no motor |
| **o congelamento calculado** | `comercial.estadoEfetivo` | no fim do mês o estado vira `expirada` **sem cron**; a escola lê e não escreve; não inicia a carência do expurgo |
| **o registo comercial por escola** | `bastidores/<escola>/comercial` no KV | `estado`, `plano`, `periodoDeConsultoria`, histórico. É aqui que a atribuição ao consultor vai caber |
| **o padrão do token** | `motor/nucleo/convite.js` | 32 hex do CSPRNG, guardado **como hash**, com prazo e uso único. É o mesmo padrão que o link do consultor precisa |
| **o cadastro não vai para o git** | `gravarCadastro`, verificação 7 do `check-indices` | CNPJ, CPF, e-mails e telefones vivem no KV: o repositório é público para quem tem o token |
| **a coluna de navegação do painel** | `raiz/index.html` → `.rail-esq` | é lá que estão «Ver só as apagadas», «Ver só as vivas», «Professores». **É lá que o botão novo entra** |

**O que NÃO existe, e é o que este plano constrói:** o cadastro de consultores, o acesso dele, a
visita com o link, a atribuição da escola ao consultor, o livro dos R$ 10, e o guião do que ele
explica.

### 1.1 E uma porta que hoje está fechada, de propósito

`comercial.validarEscolha` recusa `plano: 'consultoria'` a quem não é o proprietário:

> «o plano consultoria é criado pela administração do Sistema Lastro, e não pela página da escola.»

Está certo e tem de continuar certo: uma escola que pedisse `consultoria` pela página pública estaria
a pedir **um mês grátis a si mesma**. O link do consultor abre uma **terceira porta** — e é o token
que a abre, não um campo do formulário. Sem token válido, a recusa de hoje mantém-se palavra por
palavra.

---

## 2. O que é novo, em cinco peças

| # | peça | onde vive | o que resolve |
|:--|:--|:--|:--|
| **P1** | o **cadastro do consultor** | KV `consultores/registos` + página `/consultores` no painel | quem ele é, que equipamento tem, se está activo |
| **P2** | o **acesso dele** | `lastro.padd.com.br/consultor/<token>` | gerar o link de uma visita, sem passar por ela |
| **P3** | a **visita** | KV `consultores/<id>/visitas` | «este consultor vai a esta escola» — e o link que a escola abre |
| **P4** | a **atribuição e o relógio** | `bastidores/<escola>/comercial` → `consultor` | que escola veio de que consultor, e quando o mês dela começou |
| **P5** | o **livro dos R$ 10** | KV `consultores/<id>/visitas` + o financeiro | quanto ele deve a ela, e quanto já pagou |

**Uma coisa que NÃO é nova, e é decisão:** o consultor **não ganha uma segunda identidade dentro da
escola**. Ele trabalha com o acesso da escola, na presença dela, e tudo o que ele fizer fica no
registo com a proveniência do sistema. Um segundo login dentro da escola seria um modelo de
permissões inteiro para resolver um problema que a presença resolve — e criaria a pergunta «quem
lançou esta aula?», que hoje tem uma resposta só.

---

## 3. A história, em seis actos

### Acto 1 — Ela cadastra o consultor e activa

No painel `danca.padd.com.br`, o botão **«Consultores»** na coluna da esquerda. A lista mostra o nome,
o documento, o equipamento declarado e o **estado**. O formulário pede o que ela pediu: nome, CPF,
CNPJ, carro e habilitação, notebook próprio.

Ao gravar, o consultor nasce **inactivo**. Ao clicar **«Activar»**, ele passa a poder gerar links —
e é aí que aparece o **endereço de acesso dele**, que ela lhe manda.

**Porque é que ele nasce inactivo, e não activo.** Um cadastro é um dado; o acesso é uma decisão. Se
nascesse activo, um cadastro feito à pressa (ou por engano) abria uma porta que ninguém decidiu abrir.

### Acto 2 — Ele entra na área dele

`lastro.padd.com.br/consultor/<token>`. A página diz o nome dele, quantas visitas gerou, quantas
escolas nasceram, e quanto deve — e tem **um botão: «Nova visita»**.

Se estiver inactivo, a página abre a dizer isso e o botão de gerar não existe. **E o servidor recusa
igualmente** — o botão ausente é a segunda barreira, não a primeira.

### Acto 3 — Ele declara a visita e gera o link

«Nova visita» pede **o nome da escola** (e, opcionalmente, a cidade e a data prevista). O sistema
devolve um endereço:

```
https://lastro.padd.com.br/visita/<token>
```

**O token tem as três propriedades do convite, e pelas mesmas razões:** é aleatório (128 bits), não se
guarda — guarda-se o SHA-256 —, **expira** (30 dias) e **usa-se uma vez**. Um link que valesse para
sempre seria uma porta que ninguém volta a fechar; e um link com o nome do consultor à vista
(`?consultor=joao`) seria forjável por quem soubesse escrever `joao`.

Ele manda-o para o dono da escola — por WhatsApp, por e-mail, como quiser. O sistema não manda: o
link é dele.

### Acto 4 — A escola abre o link e cria a escola

`/visita/<token>` mostra o formulário de criação **com o nome da escola já preenchido** (editável) e
uma faixa a dizer o que ela está a receber:

> **Demonstração com consultoria.** Este ambiente inclui 2 professores, 5 alunas, 2 ciclos, 2
> modalidades, 3 aulas, 2 salas e 3 turmas. Ele fica disponível por **um mês**, e depois continua
> legível mas deixa de aceitar coisa nova.

Ela preenche o CNPJ, o e-mail, o telefone, e o professor principal (nome, CPF, e-mail, telefone,
senha, modalidade) — o mesmo cadastro que a página pública já pede hoje. Carrega em criar.

**O que acontece no servidor, numa ordem que não se pode trocar:**

1. o token é validado e o consultor conferido **activo** — sem isso, recusa;
2. `validarEscolha` recebe `podeDispensar: true` **porque a porta é esta**, e o plano é `consultoria`;
3. a escola é criada (a mesma máquina de hoje, com o rollback que já existe);
4. o registo comercial nasce `ativa`, com `plano: 'consultoria'`, com
   `periodoDeConsultoria: { entregueEm: agora, terminaEm: +1 mês }` e com
   `consultor: { id, nome, visitaId, em }`;
5. a visita passa a `criada`, com o slug da escola — e **só agora o token é consumido**;
6. os R$ 10 entram no livro dele, com data.

**O token só se gasta no sucesso.** Uma recusa por CNPJ repetido, por CPF já registado ou por senha
fraca não queima o link: a escola corrige e tenta outra vez. O contrário obrigaria o consultor a
gerar um link novo por cada erro de digitação de quem ele está a atender.

### Acto 5 — O consultor trabalha, a escola usa

Ele entra no ambiente da escola (com o acesso dela, na presença dela), e faz o que ela descreveu:
explica como funciona, dá a aula, recolhe os dados reais, lança as alunas, lança-se como professor,
faz o plano, grava o PO, gera os ciclos, mostra como se lê o resultado.

Isto dura horas — e **o mês da escola já está a correr**, desde a criação. É a decisão do §6.1.

### Acto 6 — Os três desfechos

| | o que acontece | o que o sistema faz |
|:--|:--|:--|
| **A — ela contrata** | a escola faz o Pix **para ela**, e ela habilita | `plano` passa a pago, o estado a `ativa`, os sete tetos caem, a franquia mensal começa no `contratadoEm`. O mês da consultoria fica como história |
| **B — ela não contrata** | o mês acaba | o estado **calculado** vira `expirada`: só-leitura, nada apagado, e sem carência de expurgo |
| **C — ela pede mais um mês** | ela prorroga, com motivo | um elo novo, contado do fim já marcado. «Não se renova» continua verdadeiro |

**A activação é dela e só dela.** O consultor não habilita, não recebe, não confirma pagamento. Se o
Pix não chegar à conta dela, não há activação — e o sistema não tem opinião nenhuma sobre isso que a
impeça.

---

## 4. O cadastro do consultor (P1)

### 4.1 Os campos

| campo | obrigatório | porquê |
|:--|:--|:--|
| **nome** | sim | é o nome que a escola vê no «quem te atendeu» |
| **CPF** | um dos dois | a pessoa. Mesmo validador do professor (`normalizarCpf`, 11 dígitos) |
| **CNPJ** | um dos dois | se ele factura como empresa (`normalizarCnpj`, 14 dígitos) |
| **carro e habilitação** | não | declarado por ele, com data. É o que ela quis saber |
| **notebook próprio** | não | idem |
| **e-mail e telefone** | sim | é por onde ela o encontra, e é o que o «como falar» do painel já sabe desenhar |
| **activo** | — | nasce `false`; só o botão muda |

**CPF e CNPJ ao mesmo tempo, e nenhum dos dois a substituir o outro:** um consultor pode ser uma
pessoa que factura por MEI. Pede-se **pelo menos um**, e a recusa nomeia qual falta.

**O CPF do consultor não é conferido contra os CPFs dos professores.** São registos diferentes, e a
regra «um CPF é um professor» é do professor. Um consultor que também dá aula numa escola é as duas
coisas, e o sistema não tem de escolher.

### 4.2 Onde vive, e porquê

**No KV (`consultores/registos`), nunca no git.** O nome, o CPF e o CNPJ são dados pessoais, e a
regra da casa é a mesma do cadastro da escola: o repositório é público para quem tem o token, e a
verificação 7 do `check-indices.js` já proíbe `email`/`telefone`/afins nos índices do acervo.

O registo guarda **o hash do token**, nunca o token. Quem ler o KV — ou um backup dele — não
reconstrói o endereço de acesso de ninguém.

### 4.3 O «activo» é uma parede, e não um selo

Três sítios o conferem, e os três são necessários:

1. a **lista** do painel mostra o estado (é o que ela lê);
2. a **área dele** recusa gerar visita quando inactivo (é o que ele vê);
3. **`POST /api/consultor/visita` recusa no servidor** (é o que impede o pedido escrito à mão).

E há um quarto, que é o que fecha o ciclo: **um link já gerado continua a valer depois de ele ser
desactivado?** — **Não.** A validação do link confere o estado do consultor no momento em que a
escola o abre. Desactivar um consultor fecha também os links que ele já espalhou, sem ela ter de
correr atrás deles. O link expira de qualquer forma em 30 dias, mas a desactivação é imediata.

---

## 5. A visita e o link (P2, P3)

### 5.0 O que o token carrega — e o que ele não carrega *(decidido a 25/11/2026, ao implementar)*

Ela enumerou quatro coisas que o token «diz»: **quem é o consultor**, **qual é a escola**, **qual é a
praça**, e **que é de uso único**. Três delas não vão no token, e a distinção importa:

| o que ela disse | onde vive | porquê |
|:--|:--|:--|
| quem é o consultor | no **registo**, achado pelo hash | um token que carregasse o nome (`?consultor=joao`) seria forjável por quem soubesse escrever `joao` |
| a praça | no **registo** | é um atributo dele, não do link; e é a mesma praça em todas as visitas dele |
| qual é a escola | **no registo da visita**, como `escolaNome` provisório | o consultor escreve o nome para reconhecer a visita; quem dá o nome **definitivo** é a escola, ao abrir o link |
| uso único | no **registo da visita**, como `usadaEm` | um token que dissesse «já fui usado» estaria a mentir no dia em que fosse usado |

**A consequência prática:** o token é **opaco**. Ele não afirma nada — é a chave que chega a um
registo, e é o registo que responde às quatro perguntas. Um token que afirmasse alguma coisa teria de
ser verificado nessa afirmação, e a verificação seria uma segunda fonte da mesma verdade.

### 5.1 A visita é uma coisa, e não um parâmetro

Uma **visita** é o registo de «este consultor vai a esta escola», e é ela que dá o link. Guarda:

```json
{
  "id": "v-20261125-a3f1",
  "escolaNome": "Studio Aurora",
  "cidade": "Santa Maria",
  "previstaPara": "2026-12-02",
  "tokenHash": "…",
  "criadaEm": "2026-11-25T20:10:00.000Z",
  "expiraEm": "2026-12-25T20:10:00.000Z",
  "estado": "aberta | criada | expirada",
  "escolaSlug": null,
  "criadaEmEscola": null
}
```

**Porque é que a visita é uma entidade e não um `?consultor=` no link.** Porque há três perguntas que
um parâmetro não responde: **quantas visitas ele marcou** (e quantas deram escola), **quando é que
esta expira**, e **qual delas é que produziu esta escola**. Um parâmetro responde a atribuição e mais
nada — e a atribuição, sozinha, não paga os R$ 10.

### 5.2 O que o link autoriza — e o que ele não autoriza

| autoriza | não autoriza |
|:--|:--|
| **uma** criação de escola, no plano consultoria, atribuída àquele consultor | escolher outro plano — a página oferece um só |
| corrigir e repetir enquanto a criação não passa | criar duas escolas |
| — | ver escola nenhuma: nem a lista, nem o cadastro, nem o movimento |
| — | habilitar, pagar, prorrogar, apagar |

**A direcção do erro é declarada:** um token inválido, expirado, gasto, ou de um consultor inactivo
recebe **404**, e não uma explicação. A explicação diria a quem tentasse que ali há uma porta — é a
mesma regra que a página pública já segue com `/api/escolas`.

### 5.3 As recusas que a escola pode ver, com a saída na frase

| situação | o que ela lê |
|:--|:--|
| CNPJ já é de uma escola | «o CNPJ … já é da escola «X» — um CNPJ é uma escola. Se é um ensaio, use outro nome; se é a mesma escola, ela já existe.» *(é a frase de hoje, palavra por palavra)* |
| CPF já é de um professor | «o CPF … já está registado … como professor «X» … escreva para a administração» *(idem)* |
| link expirado | «este link de demonstração expirou a <data>. Peça ao consultor <nome> um link novo.» |
| consultor inactivo | «a demonstração com consultoria está suspensa. Escreva para a administração do Sistema Lastro (<contacto>).» |

**A segunda e a terceira dizem a quem recorrer, e não «erro».** Uma recusa sem saída manda a escola
desistir — e a escola está ali porque alguém pagou três horas para a convencer.

---

## 6. A atribuição e o relógio (P4)

### 6.1 O mês começa na criação, e isso corrige o D2

O [PLANO-DA-ESCOLA-EM-CONSULTORIA.md](./PLANO-DA-ESCOLA-EM-CONSULTORIA.md) §5 decidiu **D2: o mês
começa na entrega**, e não na criação — porque lá quem criava era ela e quem entregava era ela, e o
tempo entre as duas coisas era o tempo da montagem.

**Neste fluxo a criação e a entrega são o mesmo gesto.** O consultor cria a escola já com a escola
presente, e é ele que a está a entregar — ele cobra as horas que passa ali dentro. Não há um segundo
momento para esperar, e fazer o mês depender de um clique dela **pararia o negócio do consultor**: ele
trabalharia três horas e a escola não poderia usar nada até ela abrir o painel.

**Fica declarado, e é a única regra que este plano muda:**
`origem === 'consultor'` → o período nasce com `entregueEm = criadaEm`, e `terminaEm = fimDeUmMes`.
A porta do painel continua a entregar à mão. Duas portas, duas regras, e a diferença é qual delas tem
uma pessoa a cobrar à hora.

### 6.2 A atribuição, no registo da escola

Dentro de `bastidores/<escola>/comercial`:

```json
"consultor": { "id": "c-…", "nome": "…", "visitaId": "v-…", "em": "2026-11-25T20:14:00.000Z" }
```

**Fica no registo comercial e não no índice** porque o índice é versionado e o nome do consultor é um
dado de pessoa — e porque a pergunta «quem trouxe esta escola?» é comercial, e ao lado do plano e do
estado é onde ela se responde sem uma segunda leitura.

No painel, a linha da escola passa a dizer **«consultoria por <nome>»** ao lado do estado. É o
controlo que ela pediu — e ele é **lido do registo**, nunca deduzido do link.

### 6.3 O que o link **não** faz

Não traz o nome do consultor no endereço, não o mostra à escola no formulário, e não é preciso que ele
apareça. A escola não precisa de saber o mecanismo; precisa de saber quem a atendeu — e isso o
consultor diz, não o sistema.

---

## 7. O dinheiro (P5) — três fluxos, e só um passa pelo sistema

| fluxo | valor | entre quem | o sistema faz |
|:--|:--|:--|:--|
| **a hora da consultoria** | **R$ 120** | a escola paga ao consultor | **registar** as horas que ele declarar (opcional), e nada mais. Não cobra, não repassa, não retém |
| **a taxa da consultoria** | **R$ 10** | o consultor paga a ela | **registar** o que é devido, por visita criada, e o que já foi recebido. É um livro, não uma cobrança |
| **a assinatura** | R$ 69,90 · R$ 99,90 · R$ 139,90 por mês | a escola paga a ela, por Pix, directo | já existe: o financeiro, a conciliação, o «Habilitar» |

### 7.1 Porque é que os R$ 10 são um livro e não uma cobrança

O sistema não tem como cobrar: não há cartão, não há débito, não há conta do consultor. O que ele pode
fazer — e é o que serve — é **dizer a verdade sobre o que é devido**:

- cada visita que **deu escola** acrescenta **R$ 10,00** ao livro daquele consultor;
- uma visita **expirada sem escola** não acrescenta nada — não houve consultoria;
- o botão **«Marcar recebido»** grava data, valor e (opcionalmente) a nota de quem recebeu;
- o livro é **monótono**: um valor recebido não se apaga. Um engano corrige-se com um elo novo, como
  tudo o resto nesta casa.

**A taxa é devida com êxito ou sem êxito — a frase dela, e ela está certa:** o custo do servidor é
dela, e ele existe mesmo que a escola não contrate. O que **não** gera taxa é uma visita que não
chegou a criar escola nenhuma: aí não houve consultoria, houve um link.

### 7.2 O número que mostra que os R$ 10 são justos

Do [CUSTO-DOS-FLUXOS.md](./CUSTO-DOS-FLUXOS.md) §22: uma demonstração canónica consome **16
minutos** de cota, o pior caso dentro das sete paredes **26**, e **1 minuto custa R$ 0,036**.

| | minutos | R$ |
|:--|--:|--:|
| a demonstração canónica | 16 | 0,58 |
| o pior caso (três turmas, dois ciclos cada) | 26 | **0,94** |
| **o que R$ 10,00 compram de cota** | **277** | 10,00 |

**Os R$ 10 cobrem 10,6 vezes o pior caso.** Numa linguagem de risco: o pior desfecho de uma
consultoria deixa R$ 9,06 de margem — e o que ela arrisca, no cenário em que a escola não contrata
nada, são **94 centavos**.

### 7.3 A margem que os R$ 10 **não** limitam, e fica declarada

O limitador fecha sete portas — professores, alunas, salas, turmas, modalidades, ciclos, aulas. **Não
fecha duas:** gravar o plano de ensino e gravar o PO, porque são actos de trabalho e não de estrutura,
e nenhuma escola aceitaria um teto de «quantas vezes posso corrigir o plano».

Cada gravação dessas custa **1 a 2 minutos**. Para gastar os 277 minutos do §7.2 só com elas seriam
precisas **125 gravações num mês** — o que não é um cenário, é um ataque. Fica escrito para
que ninguém descubra por acidente, e a resposta ao cenário não é um teto novo: é a desactivação do
consultor, que fecha o link e a área dele no mesmo gesto (§4.3).

---

## 8. O guião do consultor — o que ele tem de saber dizer

Isto é conteúdo, e o consultor não o improvisa: os números vêm do catálogo
(`biblioteca/comercial/planos.json`) e do que já está decidido. Quando isto for implementado, vira a
§9 do [FLUXO-DA-ESCOLA-EM-CONSULTORIA.md](./FLUXO-DA-ESCOLA-EM-CONSULTORIA.md) — **um sítio só**, e
este documento passa a apontar.

### 8.1 Os três planos, ditos com o número

| plano | por mês | franquia | professores | alunas |
|:--|--:|--:|--:|--:|
| **Básico** | **R$ 69,90** | 130 aulas/mês | 1 | 10 |
| **Intermediário** | **R$ 99,90** | 320 aulas/mês | 3 | 40 |
| **Avançado** | **R$ 139,90** | 500 aulas/mês | 6 | 90 |

**E a frase que faz o cliente escolher sozinho:** um ciclo tem **24 aulas**. O Básico comporta
**cinco ciclos e meio** por mês; o Intermediário, treze; o Avançado, vinte. Uma escola que dá duas
turmas duas vezes por semana faz **~17 aulas por mês** — cabe no Básico com folga.

### 8.2 As três regras que ele não pode deixar para o fim

1. **O pagamento é antecipado.** «Você assina e usa» — não há mês a crédito, e a habilitação só
   acontece quando o dinheiro entra.
2. **O que passar da franquia custa R$ 8,00 por aula.** Entra discriminado na fatura do mês seguinte,
   com o número de aulas e a conta à vista. **Não interrompe o trabalho** — onera.
3. **A franquia é mensal e não acumula.** O que não foi usado não passa para o mês seguinte.

**E a distinção que ele tem de fazer sem hesitar, porque é a que gera queixa:** com **consultoria**, o
limitador **interrompe** (a escola bate na parede e a parede é a demonstração). Com **plano pago**, o
excedente **onera** (a escola continua a dar aula e paga R$ 8). Uma coisa é uma demonstração com
tamanho; a outra é uma assinatura com franquia.

### 8.3 As extensões, e quando falar delas

As extensões do catálogo são serviços de configuração (por exemplo «Turma pronta — configuração»), e
ele pode vendê-las já — **mas o dinheiro vai para ela**, como o da assinatura. Ele informa; não
transacciona.

**O momento de falar delas é um só, e é depois da primeira aula lançada**, nunca antes: a extensão
resolve um trabalho que a escola já viu dar trabalho. Oferecida antes, é um custo a mais numa conversa
que ainda não tem problema.

### 8.4 Quando é o melhor momento de migrar

| o sinal | o que significa | o que ele diz |
|:--|:--|:--|
| a escola pediu o 6.º aluno, ou o 2.º ciclo, ou a 3.ª aula | bateu no limite da demonstração | «isto é o plano, não o sistema: o Básico já lhe dá 10 alunas e 130 aulas por mês» |
| a escola perguntou «e depois do mês?» | já está a planear | é o momento; a pergunta é dela, não uma venda |
| a escola quer dois professores | a demonstração dá 2, e o Básico **inclui** 1 | «o Básico inclui um professor e **vai até dois** — os dois que você viu continuam lá. Se um dia forem três, o degrau é o Intermediário» |

**A última linha é onde quase se escreveu um defeito que não existe (25/11/2026).** A primeira
versão deste plano dizia: «a demonstração dá 2 professores e o Básico dá 1 — quem assina perde um».
**É falso, e a razão está medida:** o número de professores de um plano é um **piso** — o que ele
inclui —, e o **teto** de cada degrau é derivado do degrau de cima menos um
(`comercial.tetoDoPlano`). O teto do Básico é **2 professores** e **39 alunas**, exactamente o que a
demonstração dá. Não se perde nada, e não há parede nenhuma: numa assinatura paga
`limitesDoRegime` devolve `null` — os limites são do regime da consultoria, e não do plano pago.

**O erro era ler o piso como se fosse parede.** Fica registado porque é a família de erro que este
projecto persegue: um número lido fora do seu sítio a produzir uma conclusão que soa a rigor.

### 8.5 O que ele não diz, nunca

- preço que não esteja no catálogo, desconto, «eu vejo com ela se dá para fazer»;
- prazo de activação que não seja «assim que o pagamento entrar»;
- que a demonstração se renova (não se renova — §3, acto 6);
- que ele resolve a activação. **Ele não resolve: ele não tem o botão.**

---

## 9. Onde cada peça vai morar

| peça | ficheiro | natureza |
|:--|:--|:--|
| a regra do consultor (activo, visita, prazo) | `motor/nucleo/consultores.js` | **puro** — recebe o registo e a data, devolve «pode» ou a frase |
| o livro dos R$ 10 | `motor/nucleo/consultores.js` (mesmo módulo, contas puras) | puro |
| a leitura/escrita no KV | `motor/servidor/consultores-da-casa.js` | servidor |
| as rotas e as duas páginas | `motor/servidor/raiz.js` (+ `painel-html.js`) | servidor |
| o cadastro no painel | `painel-html.js` → `paginaDosConsultores` | o mesmo padrão de `paginaDosProfessores` |
| o botão | `raiz/index.html` → `.rail-esq` | uma linha, com `data-dono` |
| a porta nova da criação | `raiz.js` → `responderCriacao`, `origem: 'consultor'` | a mesma máquina, com `podeDispensar` vindo do token |
| o plano consultoria pela terceira porta | `comercial.js` → `validarEscolha` | `podeDispensar` deixa de significar «é o painel» e passa a significar «esta porta foi autorizada» |
| a atribuição no registo | `comercial.js` + `gravarComercial` | um campo novo, que o merge já aceita |
| o guião | `FLUXO-DA-ESCOLA-EM-CONSULTORIA.md` §9 | conteúdo |

**A regra fica no núcleo e as páginas leem.** É a mesma disciplina do `cotas.js`: se a pergunta «este
consultor pode gerar um link?» for respondida em dois sítios, um deles vai responder mal — e o que
responde mal é sempre o que ninguém está a olhar.

---

## 10. O que este plano **não** faz

- **Não dá ao consultor acesso ao painel dela.** Ele vê a área dele: visitas, escolas que nasceram,
  quanto deve. Não vê a lista de escolas, o financeiro, nem o movimento de ninguém.
- **Não cria uma conta de utilizador.** O acesso dele é um token, como o do convite: um endereço que
  se guarda, se troca, e se revoga desactivando.
- **Não cobra nada.** Nenhum cartão, nenhum débito, nenhum repasse. O livro diz o que é devido; o
  dinheiro anda por fora, como anda hoje.
- **Não muda o plano consultoria.** Os sete limites, o congelamento calculado e as recusas ficam como
  estão — este plano **usa-os** e acrescenta quem os abriu.
- **Não põe dado pessoal em ficheiro versionado.** Nem CPF, nem CNPJ, nem e-mail, nem telefone do
  consultor.
- **Não apaga nada.** Uma visita expirada fica no livro como expirada: «quantas visitas ele marcou e
  quantas deram escola» é a informação que diz se o consultor vale o que custa.

---

## 11. As fases, e a ordem

| fase | o que entrega | porque nesta ordem |
|:--|:--|:--|
| **F1** | o cadastro, a lista e o activar/desactivar no painel | sem consultor não há link; e é a peça que ela usa sozinha, sem depender de ninguém |
| ~~**F2**~~ | a área dele, o token, e «Nova visita» — **IMPLEMENTADA a 25/11/2026** | é o que transforma o cadastro num serviço |
| **F3** | `/visita/<token>` e a criação com `origem: 'consultor'` | é onde o plano consultoria passa a nascer pela mão de outra pessoa — a fase com mais risco, e a que precisa das provas mais duras |
| **F4** | o livro dos R$ 10 e o «Marcar recebido» | só depois de haver visitas a cobrar |
| **F5** | o guião no `FLUXO-DA-ESCOLA-EM-CONSULTORIA.md` §9 | conteúdo; não bloqueia nada |

**O QUE A F2 DEIXA ABERTO, e é a fronteira dela:** o link nasce com o endereço **definitivo**
(`/visita/<token>`), e a página que ele abre é a **F3**. Até lá esse endereço responde 404 — o link
é gerado, guardado e entregue, mas não abre a criação de escola nenhuma. **Não se manda um link a uma
escola antes de a F3 estar no ar**, e é a única coisa que a F2 não pode prometer.

**F3 é a fase que não pode falhar em silêncio.** Uma escola criada com o plano errado, ou sem
atribuição, é um cliente que existe e não se sabe de onde veio — e o erro só aparece no dia em que ela
fizer as contas. As provas da §12 são, quase todas, para F3.

---

## 12. As provas

Cada uma mede um comportamento que, sem ela, se descobre em produção.

| prova | o que afirma | o controlo negativo |
|:--|:--|:--|
| `provar-o-cadastro-do-consultor` *(escrita, **88** asserções)* | o cadastro valida CPF/CNPJ pelo mesmo normalizador; nasce inactivo; o documento repetido é recusado; o KV mudo não é uma lista vazia | sem `ativo` no corpo, a rota recusa — activar por omissão seria a pior falha possível |
| `provar-o-link-do-consultor` *(escrita, **77** asserções)* | o token é aleatório, guardado só como hash, e o **âmbito** separa as três espécies; o endereço nasce do «Activar» e só existe uma vez; trocá-lo mata o anterior; a visita expira sem cron e o `tokenHash` nunca sai numa resposta | o consultor **inactivo** é recusado na rota (403), e não só pela ausência do botão; e o livro cheio **recusa** em vez de apagar |
| `provar-a-escola-do-consultor` | a criação pela visita nasce `consultoria`, `ativa`, com `entregueEm = criadaEm`, com os sete limites e com a atribuição no registo | a **mesma** criação pela porta pública continua a **recusar** `consultoria`, palavra por palavra como hoje |
| `provar-o-livro-do-consultor` | cada visita que deu escola soma R$ 10; a expirada soma zero; o recebido não se apaga | marcar recebido duas vezes não soma duas vezes |
| `provar-o-guiao-do-consultor` | os números do §8 são os do catálogo (preços, franquias, piso e teto, R$ 8) | mudar o catálogo faz a prova reprovar até o guião mudar |

**E há uma já escrita, para o próprio plano:** `experimentos/provar-o-plano-do-consultor.js`
(**54 asserções**) recalcula do catálogo, do `ciclos.json` real e das constantes de custo, e compara
com o texto deste documento. É ela que impede os números de apodrecerem — e foi ela que desfez o
«defeito» do §8.4: com o piso e o teto à frente, o Básico aceita os dois professores da demonstração.

**A última é a que impede o guião de apodrecer** — é a mesma ideia do
`provar-o-custo-da-consultoria`: um documento que repete números é um documento que envelhece, e dois
documentos a dizer o mesmo número mentem juntos.

---

## 13. As decisões que são dela

Nenhuma destas trava a F1, e três mudam o desenho. Ficam com a recomendação de quem escreveu.

| # | a pergunta | recomendação |
|:--|:--|:--|
| ~~**Q1**~~ | ~~os R$ 10 são por consultoria ou por sessão?~~ | **DECIDIDO 25/11/2026 — por consultoria:** uma visita que deu escola, dez reais. Por sessão obrigaria a definir o que é uma sessão |
| ~~**Q2**~~ | ~~a demonstração dá 2 professores e o Básico dá 1~~ | **DECIDIDO 25/11/2026 — deixar como está, e o motivo é que não há perda:** o Básico **vai até 2 professores**. A pergunta nasceu de ler o piso como se fosse parede (§8.4) |
| ~~**Q3**~~ | ~~o mês da escola começa na criação (§6.1)~~ | **DECIDIDO 25/11/2026 — na criação.** A alternativa pararia o negócio de quem cobra à hora |
| **Q4** | o consultor **declara as horas** na área dele? | **DECIDIDO 25/11/2026 — sim, opcional.** Não muda o que ele recebe; é o registo que lhe permite mostrar o que fez |
| ~~**Q5**~~ | ~~o link expira em **30 dias**?~~ | **DECIDIDO 25/11/2026 — sim, 30 dias** (`consultores.DIAS_DO_LINK`). É o mesmo prazo de um mês de demonstração, e um link que não expira é uma porta que ninguém fecha. A reemissão conta o prazo de novo |
| ~~**Q6**~~ | ~~ele pode gerar **quantas visitas** quiser?~~ | **DECIDIDO 25/11/2026 — sim, ao gerar.** Um tecto aqui não protege de nada: o que protege é a desactivação. Mas o **livro** recusa a partir de 1000 visitas, e recusa em vez de apagar — uma visita é uma linha de dinheiro, e o mais antigo não pode sair em silêncio como sai da lista de consultores |
| ~~**Q4-bis**~~ | ~~como é que ele gera o link?~~ | **DECIDIDO 25/11/2026 — pela área dele**, `lastro.padd.com.br/consultor/<token>`: ela manda-lhe o endereço ao activar (§3, acto 2). Não é ela que gera no painel |
| **Q8** | o consultor pode **activar-se** a si mesmo, ou só ela? | só ela. Nasce inactivo, e o «Activar» é o gesto que abre a porta (§3, acto 1) |
| **Q7** | uma visita que dá escola **duas vezes** por engano (rollback e nova criação) paga **duas vezes**? | não: a taxa é por **visita**, e o token gasta-se na primeira criação que passa. Uma segunda escola exige um segundo link |

---

## 14. O que fica por medir

1. **O custo de um mês de escola em consultoria a usar o ambiente sozinha.** O §7.2 mede a
   *demonstração* (o que o consultor monta). Os trinta dias a seguir, dentro dos sete limites, não
   foram medidos — e a conta honesta é a do §7.3: as duas portas que o limitador não fecha.
2. **Quantas consultorias um consultor faz por mês**, para o número de R$ 10 virar receita
   projectada. Não há dado: nenhuma consultoria aconteceu ainda.
3. **O tempo real de uma consultoria.** Ela disse «algumas horas» e «R$ 120 a hora»; as 3 horas do
   exemplo são dela, não uma medida.
