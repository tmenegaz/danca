# Frentes em aberto — Projeto Ciclo

> **Data:** 13/10/2026 · **Natureza:** panorama consolidado das frentes (não é implementação).
> **Origem:** transcrição do laudo do Bloco 1 (Produção, curadoria e integração dos três
> formulários) e do panorama de três trilhos. Este arquivo é a **fonte versionada** do estado de
> hoje; ele não reescreve decisões anteriores — acrescenta o estado atual, como elo novo.

> **Onde vivem as frentes (15/10/2026).** Este arquivo é o panorama das frentes **do protótipo**
> — o que se está a construir aqui, nos trilhos A/B/C. O **mapa de evolução do produto** — o
> **Sistema Lastro** (o nome comercial; `Projeto Ciclo` é o nome do protótipo e deste
> repositório), com as nove frentes de produto (dicionário de campos, identidade estável,
> proveniência de entrada, índice, imutabilidade, catálogo de consultas, fronteira da IA,
> composição comercial e cotas) — é **[PLANEJAMENTO-LASTRO.md](PLANEJAMENTO-LASTRO.md)**, com o
> diagnóstico medido e o registo das contradições entre aquelas descrições e o código.

---

## 1. O que foi concluído recentemente (e estava disperso)

| Item | Estado | Onde |
|:--|:--|:--|
| Barra criada de ponta a ponta | ✅ | `tools/criar-escola.sh` → Worker `barra` (professor Letícia), aluna Vavá |
| Bloco 2 (anamnese) — «não foi medido» transversal | ✅ | `porta/index.html` + `porta/conteudo/anamnese.json` + `motor/nucleo/ficha.js` |
| Nó 50 (`matriz-metodologica-de-origem`) | ✅ decidido: **não semeia** o plano | sujeito aluna ≠ sujeito professor |
| Categoria etária re-derivada da idade + memória por escola/professor/ciclo | ✅ | `porta/index.html` |
| Senha por professor (não da escola) | ✅ | `motor/servidor/bastidores.js` |
| Bloco 3 (plano) — cadastro de turmas + vocabulário + relação turma↔termo | ✅ (sob revisão — ver B3) | `motor/servidor/bastidores.js` + `catalogo-seed.js` |
| Correções da Produção — menu lateral + secções, sessão persistente, labels | ✅ | `motor/servidor/bastidores.js` |
| Laudo do Bloco 1 (Produção/curadoria/integração, 7 achados) | ✅ | transcrito na §2 abaixo |
| **Alinhamento PO completo → derivados** (o nó respondível sem destino, a seção emitida e não extraída, a prosa dentro de campo alheio, os rótulos que derivaram) | ✅ feito — 9 chaves novas no `po-XX.json`, os rótulos vêm do CONTEÚDO, e a prova `experimentos/provar-po-completo.js` (17) percorre os 33 nós | `motor/nucleo/derivar-po.js` + `tools/validar-po-ciclo.js` (congelado, motivo declarado) — ver §3, frente B10 |
| **O mapa de evolução do produto — o diagnóstico medido** (o que existe, o que falta e as contradições entre as descrições e o código; **dez** frentes de produto com critérios verificáveis; a classificação *existe · parcialmente · não existe · a decidir*; as oito perguntas do catálogo uma a uma; e a matriz de cobertura dos dois textos) | ✅ feito — `PLANEJAMENTO-LASTRO.md` (o **Sistema Lastro**, o nome comercial; `Projeto Ciclo` segue sendo o protótipo) · revisão de 15/10/2026 contra os textos autoritativos: **+§2.10, §2.11, §7, §8**, o achado **C10** e a frente **L10** · **C3 decidida no mesmo dia** («o PO/plano publicado passa a ter versão explícita que o lançamento referencia»): **L5** reescrita com escopo e critérios; e o desenho **S1–S4 proposto e aprovado** e **S5–S7 decididas** no mesmo dia — **desenho completo**, pronto a implementar | trava nada: é diagnóstico e plano, **nenhum arquivo de produto foi alterado** |
| **Alinhamento PLANO completo → derivados** (o nó respondível sem destino, a seção fora do mapa descartada em silêncio, a ficha do ciclo em `[Preencher]` com o valor doze linhas acima, a vista lendo só a forma antiga) | ✅ feito — 5 chaves novas e o `contexto` no `plano-XX.json`, a ficha composta dele, o AVISO da seção não mapeada, e a prova `experimentos/provar-plano-completo.js` (17) percorre os 25 nós | `motor/nucleo/derivar-plano-ciclo.js` + `tools/validar-plano-ciclo.js` e `tools/lib-extracao-md.js` (congelados, motivo declarado) — ver §3, frente B11 |

---

## 2. O laudo do Bloco 1 — os 7 achados medidos

> O pedido «Produção, curadoria e integração dos formulários» manda o Bloco 1 ser **investigação
> primeiro** — medir e reportar, antes de tocar em código. Cada achado traz o que foi medido, o
> caminho no código e a conversão em item de trabalho.

### L1 — Estrutura actual da Produção

- Uma única página HTML em `/bastidores/producao`, montada por `paginaProducao()` em
  `motor/servidor/bastidores.js`. Tudo numa rota, a rolar.
- Rotas HTTP: `/bastidores`, `/bastidores/estudio`, `/bastidores/producao` (páginas) + as
  `/api/bastidores/*` (alunas, professores, dono, validar-senha/producao, turmas, termos,
  turma-conteudos, semear-catalogo…).
- A ponte (`motor/servidor/producao.js`) decide o prefixo da porta (`/anamnese`, `/plano-ensino`,
  `/plano-observacao`) e entrega os Bastidores ANTES da porta.

**→ Tarefa:** menu lateral + secções próprias. **Feito** (`8a6e8d6`, hash por seção). Rotas de
servidor `/producao/*` ficam como **opcional** posterior.

### L2 — A senha é pedida a cada operação (causa real)

- O código pede UMA vez (`SENHA_DIRECAO` em variável JS) e reenvia a senha em cada corpo.
- **Mas** toda operação bem-sucedida faz `location.reload()`, que zera a variável e re-mostra o
  portão — daí a senha parecer pedida a cada operação. Não usa `sessionStorage`.

**→ Tarefa:** sessão persistente (`sessionStorage`, login vale enquanto a aba fica aberta).
**Feito** (`a2f6a1d`).

### L3 — A direção do fluxo (confirmado contra o código)

**A crença da pesquisadora está certa:**

- **A anamnese NÃO alimenta o plano.** `motor/nucleo/derivar-plano-ciclo.js` lê **só** o envelope
  do plano (`tabelaDeContexto` lê `contexto-*`); nenhuma referência à anamnese.
- **O PO recebe AS DUAS.**
  - **Do plano:** `derivar-po.js` → `comporCampoEmpirico` (escola/turma/frequência/duração) e
    `comporContexto` (calendário/volume/condição de registro) leem `respostaDo(plano, 'contexto-*')`.
    Vínculo = `vinculosDePlano()` em `porta.js` (o PO referencia o plano pelo nó
    `plano-de-ensino`, `opcoesDe: api/planos`).
  - **Da anamnese:** o nó `sujeitos` do PO usa `opcoesDe: api/anamneses`; `linha-de-base` usa
    `repetirPor: sujeitos` (o «o que traz» / «o que precisa desenvolver» de cada aluna vem do
    envelope da anamnese).

**Direção medida:** anamnese → (nada a jusante) · plano → PO · PO consome as duas. Unidireccional.
**→ Tarefa:** nenhuma mudança de fluxo — é **seguir** essa direção na integração (Bloco 8), não
inventar a reversa.

### L4 — Inventário de campos/nós

| Formulário | Nós respondíveis | Obrigatórios | Fonte |
|:--|:--|:--|:--|
| Anamnese | 53 | 49 | `porta/conteudo/anamnese.json` |
| Plano de ensino | 26 | 16 | `porta/plano/conteudo/plano.json` |
| PO | ~35 respondíveis (40 ids) | 26 | `porta/po/conteudo/po.json` |

### L5 — Duplicações campo a campo

**Os três campos que a pesquisadora apontou para REMOVER do PO já não existem nele** — a
deduplicação já foi feita; o PO compõe `campo empírico` e `contexto` a partir do plano
referenciado:

| Campo | Onde vive | Duplicado? | O que fazer |
|:--|:--|:--|:--|
| frequência semanal | plano `contexto-frequencia` | não | nada (PO lê do plano) |
| duração por aula | plano `contexto-duracao` | não | nada |
| condição de registro | plano `contexto-registro` | não | nada |
| turma observada | plano `contexto-turma` | não | nada |
| metodologia de referência | plano `contexto-metodologia` | **não duplica, mas NÃO chega ao PO** | ✅ **ligado** (Bloco 8.2 · commit `3410db9`) |
| quem escolhe | plano `contexto-metodologia-origem` | idem | ✅ **ligado** |
| notação | plano `contexto-notacao` | idem | ✅ **ligado** |

**→ Tarefa:** ~~ligar~~ — **feito**: o PO agora lê `metodologia`/`quem-escolhe`/`notação` do
plano referenciado numa seção própria `## Metodologia e notação` (nunca deduzidas, P-16; a
«Norma estabelecida» continua elicitada). Fica em aberto: o PO tem `escola` (cabeçalho) **e**
`campo-escola` (observação inicial) — quase sempre o mesmo valor, candidato a **confirmar** com
a pesquisadora.

### L6 — O bug do `[Preencher]` na `distribuicao-de-volume` (medido, não fechado)

- Caminho coerente para string: `tabelaDeLista()` → `emLista()` (string→split por `\n`; array→map).
- `distribuicao-de-volume` é **texto livre** (sem `forma`/`opcoes`).
- **O sintoma não casa:** se fosse string, viraria tabela; se array de objectos, viraria
  `[object Object]` — não `[Preencher]`.
- **Conclusão:** o defeito está no **mapeamento do valor vivo** (o envelope guarda forma
  diferente da que o derivador lê). **Preciso do JSON do envelope real** (Maria em produção ou
  export do KV) para fechar.

**→ Tarefa (🔒 bloqueada):** obter o envelope vivo e re-mediar. Ver frente **B5**.

### L7 — A modalidade (comum × específico)

- A anamnese é hoje **100% balé clássico** no vocabulário, mesmo nos blocos "comuns"
  (força/flexibilidade falam em `plié`, `allegro`, `adágio`, `port de bras`).
- Separar comum × específico exige **reescrever o vocabulário dos blocos comuns em linguagem
  neutra** — trabalho de **conteúdo** (P-16), não de código.

**→ Tarefa (⏸ deferida):** ver frente **B6**. O pedido manda medir, não implementar.

### As 3 confirmações bloqueantes (Bloco 10) — estado

1. **Rubrica** — ✅ `satisfatório · razoável · em desenvolvimento · não se aplica`. **Decidida e
   alinhada** no conteúdo e na derivação (`porta/plano/conteudo/plano.json` +
   `derivar-plano-ciclo.js`, espelhados nas duas escolas). Os níveis que o código declarava antes
   (`Insatisfatório · … · Excelente`) tinham vindo do **experimento** (simulação Marau), não de uma
   decisão — ver `REGISTRO.md` (13/10/2026).
   **A régua virou leitura (14/10/2026).** No plano de ensino a rubrica **não é campo**: os quatro
   níveis aparecem preenchidos e não editáveis (`escala` no conteúdo; `escalaFixa` na porta). O
   **critério** de cada aula é declarado no **lançamento da aula dada**, não no plano — e a
   derivação do plano passa a emitir a régua (`NIVEIS_DA_RUBRICA` em `derivar-plano-ciclo.js`),
   com a coluna do critério como lacuna declarada. Na mesma data, o **marco parcial** deixou de ser
   prosa: virou **lista numerada** (`lista: {minimo}`), com o número do sistema e mínimo de um.
   **Os blocos e o parâmetro viraram relação com o marco (14/10/2026).** Os «blocos de cada aula»
   deixaram de ser prosa e passaram a **matriz por objetivo** (`porMarco`): uma linha por marco
   parcial, com os blocos canónicos (**Solo · Barra · Centro · Musicalidade** — `ARQUITETURA-PE.md`,
   §2.3; o «presença» do prompt não é um bloco) para marcar; o objetivo sem marcação não entra. A
   **distribuição do volume** deixou de pedir o bloco escrito: as linhas vêm dos blocos marcados
   (`tabela.linhasDe`), o bloco sai em leitura e só a proporção e a justificativa (em caixa larga)
   se preenchem — e o bloco é a chave que a Aula 1 usa para repartir o tempo. O **objetivo
   específico da Aula 1** deixou de ser campo: é o **marco parcial 1** (Regra 2). Na mesma
   data o nó **saiu** (`aula-1-objetivo`): o plano ficou com 25 nós (era 26), o widget
   `doMarco` saiu com ele, e a derivação passou a ler o objetivo **do marco** — o campo,
   quando ainda aparece num envelope antigo, só é lido se não houver marco nenhum (o que
   já foi declarado não se perde; o marco, quando existe, manda). O **Plano de
   Observação não perde nada**: ele não tem esse nó e compõe o campo empírico, o contexto
   e a metodologia dos nós `contexto-*` — a Aula 01, que o «Guardar» do PO escreve, tira
   o objetivo do marco 1 e continua a declarar «objetivo específico declarado | ok». O
   **parâmetro de medição** ficou **por marco** (`porMarco.opcoesDaTurma`): as opções são o
   **conteúdo do nível da turma** (a relação turma↔conteúdo da Produção) + um campo aberto de
   salvaguarda, porque a medida tem de falar a língua do que se ensina.
   **A expressão entra como bloco, e a sequência virou estrutura (14/10/2026).** Os blocos da
   aula passaram a cinco — **Solo · Barra · Centro · Musicalidade · Expressão** (`BLOCOS_DA_AULA`)
   —, porque a **expressão** (a parte artística, que costuma fechar os últimos minutos) não tinha
   lugar próprio e ficaria fora do volume e da captura; ela é discricionária, e é o professor que
   marca quando ela é trabalhada. A **sequência de exercícios por bloco** deixou de ser prosa: é uma
   **grelha** com uma linha por OBJETIVO EM CADA BLOCO onde ele é trabalhado (as mesmas marcações de
   «Blocos da aula»), o **conteúdo do nível da turma** para escolher, e só **tempos** e **compasso**
   escritos pelo professor — a lista do que existe tem um campo ao lado, porque o nível não esgota o
   que se faz em sala. A **musicalidade não entra na sequência** (`sem: [Musicalidade]`): ela é
   esmiuçada no bloco dela. E a **régua da rubrica passou a ser DA TURMA**: a Produção declara
   (`rubrica` no cadastro da turma, com formulário próprio para mudar em comitê — renomear,
   acrescentar, remover), o plano **adota e registra** a régua adotada (é a prova de contra que
   régua o ciclo foi medido), e a derivação usa a régua do envelope, caindo no **padrão declarado**
   (`NIVEIS_DA_RUBRICA` — a lista que nasce com uma turma nova e a reserva dos planos antigos).
   **A proporção alvo ganhou unidade e trava, e a condição de registro virou marcação
   (14/10/2026).** A distribuição do volume passou a ter **unidade** (minutos ou percentual) e a
   soma é medida contra o **laço do tempo**: em minutos, a duração da aula (vem da turma); em
   percentual, 100. **Passar do total impede a saída da tela** (a aula inteira é o laço; o
   professor corrige ali); **faltar apenas avisa** — fica o alerta de que a aula tem duração maior
   do que o declarado. As linhas da distribuição **não se removem** (os blocos são os que a aula
   tem), e por isso a coluna do ✕ saiu da tabela. A **condição de registro** deixou de ser prosa:
   dois grupos de marcação — **quem está na sala** (professor e as alunas da turma já vêm marcados;
   as alunas são todas, sem controle de frequência) e **quem observa** (observador externo ou o
   próprio professor), com uma linha livre para o que não couber. Na derivação, ela volta a ser a
   frase que o documento lê (`condicaoDeRegistroEmTexto`), a mesma no plano e no PO.
   **A origem do plano virou escolha, e a pendência do Estúdio ficou aberta (14/10/2026).** O
   «Registro de origem» deixou de ser uma frase escrita: passou a **lista para marcar** — RAD,
   Vaganova e tradição francesa, com e sem «adaptado ao âmbito da turma», mais a literatura de
   apoio sobre corpo e aula —, com `multipla` (o plano pode misturar tradições) e a linha livre
   para uma origem que não esteja na lista. No documento, a lista vira a frase da origem
   (`provenienciaEmTexto`), separando as origens por «;». **Fica aberto o B8**: o professor
   declara a **sua** origem (bibliografia, repertório da formação) no **Estúdio de Aula**, na
   Área do Professor — e o plano passa a remeter para lá em vez de só marcar o que a lista
   oferece.
   Na mesma data, a derivação
   do plano passou a declarar a **estrutura como uma linha por bloco** nomeando os objetivos que
   ele serve (`linhasDaEstrutura`) — é a forma do plano de referência (`- Solo - …`) e a que o
   contrato lê como lista.
   **O PO COMPLETO passa a chegar inteiro aos derivados (14/10/2026).** A verificação foi feita
   respondendo os **33 nós** do mapa servido com um valor marcado e seguindo cada um até o
   `po-XX.json`. Três famílias de falha apareceram, e as três eram caladas: (a) **nó respondível
   sem destino nenhum** — `horizonte`, `plano-de-ensino`, `dimensoes-de-observacao`,
   `itens-por-dimensao` e os **quatro campos dos módulos condicionais** não chegavam a documento
   algum; (b) **seção emitida e não extraída** — o `## Metodologia e notação` era escrito pela
   derivação desde a ligação L5 e o `MAPA_SECOES` do extrator não conhecia o título, então a
   metodologia, quem a escolhe e a notação **nunca entravam no pacote**; (c) **prosa dentro de
   campo alheio** — as flutuantes viajavam como bullet de `## Sujeitos` e as restrições físicas
   (P-22) como `###` de `## Linha de base`, e o extrator, que lê linha a linha, as recebia como
   itens daqueles campos (`subjects: ["Vavá", "**Flutuantes:** …"]`; `linhaDeBase` com o título e
   o valor dentro — o próprio validador avisava «2 de 3 item(ns) não são objeto»). **Cada nó
   ganhou a sua chave**: nove propriedades novas no `ciclo-01-po-schema.json`, todas **OPCIONAIS**
   (os POs já escritos continuam válidos e a obrigatoriedade do formulário não muda). Na mesma
   passagem, quatro correções de **rótulo e identidade**: os rótulos do checklist passam a vir do
   CONTEÚDO (o documento assinava «Fronteiras claras» onde o formulário diz «Fronteiras do escopo
   claras»), os **doze** rótulos do contexto viram **fonte única** (`ROTULOS_DO_CONTEXTO`, lida
   pelo PO e pelo plano — três tinham derivado), o **cabeçalho lê a RESPOSTA** e só cai no
   contexto quando ela falta (é o que deixa o professor corrigir o próprio nome: o documento
   publicado dizia `escola: maria`, `professor: tiago`), e a **folha de captura derivada do PO**
   passa a declarar o critério como `rubrica` — a régua da turma —, com a linha de base em `marca`,
   e o fecho dela usa os `BLOCOS_DA_AULA` (a lista fixa «☐ presença» saiu).

   **O PLANO COMPLETO passa a chegar inteiro aos derivados — e o `## Contexto` vira a fonte única
   (14/10/2026).** A mesma bancada da frente B10, aplicada ao plano: **dos 24 nós respondíveis, 21
   não chegavam ao `plano-XX.json`** e **2 não chegavam a documento nenhum**. Quatro causas, todas
   caladas: (a) **título divergente** — a derivação escreve `## Distribuição do volume pelos
   blocos` e o mapa pedia «… (regra 9, etapa 2)», um sufixo que documento nenhum escreve: o volume
   ficou fora do JSON de **todos** os planos e o guia imprimia «Lacunas — distribuição do volume»
   sobre tabela preenchida; (b) **seção fora do mapa** — `## Contexto` (doze fatos), `## Condições
   preliminares` e `## Critério de extensão` eram descartados em silêncio; (c) **seção não
   emitida** — `Músicas e vídeos` e `Repertório`, os dois nós do Bloco 10, não tinham seção; (d) **o
   silêncio** — o extrator descartava e o validador dizia `ok`, e é a causa que produziu as outras
   três. **A decisão da pesquisadora:** o `## Contexto` é a **fonte única** do que o professor
   declarou, e a tabela de identificação do ciclo é **alimentada por ele** — «os `[Preencher]`
   somem de campo que a professora preencheu». O plano declarava a mesma coisa em DUAS tabelas, com
   rótulos diferentes, e a que a máquina lia era a que ninguém preenchia: o `plano-01.json`
   publicado trazia `ciclo.duracaoMinutos`, `inicio` e `volumeAtivoPorAula` em lacuna enquanto o
   `## Contexto` logo acima carregava os valores reais — invisíveis à máquina. O **contrato passa a
   avisar**: `avisosDeSecaoNaoMapeada` diz a linha da seção cujo título não está no mapa **e que
   tinha conteúdo**, e o aviso fica **calado** nas fontes do repositório (prova de que mapa e
   documentos estão alinhados hoje). Na mesma passagem, três leituras da vista que não liam o que o
   dado dizia: a proporção alvo tem **duas chaves** (`proporcaoAlvo60Min`, do cabeçalho antigo, e
   `proporcaoAlvo`, do atual — sem as duas, um plano gerado hoje mostraria a proporção vazia no
   guia), a **estrutura da aula** sai em três formas (numerada, `- **Solo** — …` e a prosa antiga)
   e o guia só aceitava a primeira, e a **duração da aula** tem reserva no contexto (um `[Preencher]`
   não é duração). O guia de observação da Maria passa de «Lacunas — 2 de 7» para «**0 de 7**», com
   «**Estrutura da aula:** Solo → Barra → Centro e diagonal». Fica corrigido também o **parâmetro de
   medição da Aula 1**, que chegava ao `aula-01.md` como `[object Object]`: a matriz `porMarco`
   (`{marco, marcados}`) era passada por `prosa()`, que faz `String(valor)`.

**A régua da turma chega ao LANÇAMENTO, e o critério passa a se medir por ela (14/10/2026).** O
   lançamento da aula dada media os critérios com as **cinco marcas** fixas (`✓ ok · ~ parcial · X não
   aconteceu · ? não vi`), que não são a régua de ninguém: a mesma turma podia ter a sua régua
   declarada na Produção e ser medida por outra escala. Agora a régua **atravessa o pacote** — a
   derivação do plano emite a seção `## Régua da rubrica` (os níveis verbatim, em **lista**), o
   extrator a entrega em `plano-XX.json` (`reguaDaRubrica`) e o lançamento **lê** a régua do ciclo
   para montar o campo de cada critério. O **tipo** da coluna passa a decidir o registro:
   `rubrica` (o **critério** — um nível da régua, vazio = «não medido nesta aula») e `marca` (o que
   só se observa — a **linha de base revisitada** segue com as cinco marcas, porque «observado na
   aula» não é nota). Sem a seção (ciclo antigo), valem os **quatro níveis padrão**
   (`NIVEIS_DA_RUBRICA`); um nível **já lançado** que a régua atual não declara **continua
   selecionável** (a régua muda entre ciclos, e o registro antigo não some); e um valor fora da
   régua lê-se **marcado como fora**. O `rubrica` entrou no **vocabulário declarado** do schema da
   captura (`_declaracao.tipos`), e a régua ganhou a sua chave de extração em `MAPA_SECOES`
   (`tools/validar-plano-ciclo.js`) — sem a chave, a seção seria ignorada em silêncio (é a
   armadilha das **duas listas brancas**, de novo, agora do lado do extrator).
   A prova é `experimentos/provar-lancamento.js` — **16 verificações rodando a página** (jsdom
   servido pelo HTTP do próprio pacote), com a régua **trocada em memória** no meio: se a tela
   lesse uma lista escrita em código, a troca não mudaria nada. **Fica aberto**: (a) a folha de
   captura ainda traz os seus **critérios fixos** (13 de técnica e 5 de musicalidade) e não o
   critério declarado por aula a partir dos marcos/da sequência do plano; (b) o **marco** chega ao
   lançamento só como leitura (nome do marco da aula) — a sequência, os blocos e o parâmetro de
   medição do plano ainda não descem para a folha; (c) existe **uma folha por aula só na Aula 01**
   (`captura-aula-01.json`): a Aula 02 em diante usa a folha do ciclo.
2. **Faixa etária** — ✅ **corte em 14** (infantil ≤13, juvenil 14–17, adulto ≥18) — o código já
   faz exatamente isso (`>=18 ? Adulto : >=14 ? Juvenil : Infantil`); **nada a mudar**.
3. **«não se aplica» da metodologia** — ✅ redundante com «Escola livre» do nó 50; **não criar**
   opção nova.

---

## 3. O panorama das frentes em aberto — três trilhos

### Trilho A — O experimento PO/PE

| # | Frente | Estado | Bloqueio |
|:--|:--|:--|:--|
| A1 | **Levantamento de tokens PO+PE** (empírico) | ✅ medido — `experimentos/pe/freio-custo.md` §4 (≈20 500 tokens/PO, teto 33 000, orçamento por plano) | nenhum — já medido |
| A2 | **Plano B — binding KV real** (provas B1–B4) | ✅ resolvido — B1 ✅ B3 ✅ (binding real); B2 ✅ (o motor Node saiu do caminho: a porta agnóstica `cloudflare.js`+`rotas.js` serve as 14 rotas no Worker, com conteúdo de `ASSETS`/`plano-observacao/` e KV); B4 ⚪ raciocinado | A4 depende dos secrets de write-back (`GITHUB_TOKEN`/`SENHA_CRIPTO`), não do motor Node |
| A3 | **Freio de custo** (instrução de escopo · limite 30 turnos · registro) | ✅ feito — spec `freio-custo.md` + teto de 30 turnos em `motor/nucleo/ia.js` | nenhum |
| A4 | **Migração experimento → produção** | ⬜ aberto | só depois de A2/A3 + teste de botões |
| A5 | **Negócio** (franquia/excedente, gamificação, parceiros) | ⏸ deferido | **depois** de A4 |

### Trilho B — A Barra + a integração inteligente dos três formulários

| # | Frente | Estado | Bloqueio |
|:--|:--|:--|:--|
| B1 | **Curadoria** — a peça central (atribuição por professor que pré-carrega os 3 formulários) | ✅ mecanismo pronto | `motor/servidor/bastidores.js` + `biblioteca/modalidades/modalidades.json` (commit `f8d367e`) |
| B2 | **Integração (Bloco 8)** — derivados, fluxo, campos que saem/vêm | ✅ fechada · metodologia/notação (`3410db9`) + consumo da curadoria (plano/PO travam sem curadoria, anamnese filtra alunas) | — |
| B3 | **Catálogo: base → biblioteca** — o CRUD de hoje vira `biblioteca/modalidades/` + `ESCOLA.conf`; a escola **declara** o que usa | ✅ base migrada | `biblioteca/modalidades/` (commit `14bfb2e`); falta o `ESCOLA.conf` |
| B4 | **Norma revisada** — Produção **pode criar/excluir** (caso a caso) | ✅ registrada | `REGISTRO.md` + `IDEIA-PAINEL-ESCOLA.md` §12 |
| B5 | **Bug do `[Preencher]`** na `distribuicao-de-volume` | ✅ resolvido — remedido: o `[Preencher]` era **literal** em `derivar-ciclo.js`, não um defeito de mapeamento. A grelha estrutura a proporção e a Aula 01 deriva Fatia/Tempos | o «envelope vivo» era **fantasma** — a KV não tem um único envelope |
| B6 | **Modalidade comum × específico** (anamnese 100% balé) | ⏸ deferido | reescrita de conteúdo (P-16) |
| B7 | **Bloco 4 (PO)** — rubrica clicável, turmas plural, checklist pré-preenchido | ✅ fechado — as turmas em plural, **5 das 6** folhas do checklist inferidas, e a **rubrica do plano** em grelha clicável (`grelhaDaTabela` na porta; o checklist do PO já era clicável) | — |
| B8 | **A ORIGEM com as próprias palavras do professor, no Estúdio de Aula** — o professor declara de onde vem o que ele ensina (as metodologias que seguiu, os livros — corpo e aula —, o repertório da sua formação) no **Estúdio de Aula**, na Área do Professor (`IDEIA-PAINEL-ESCOLA.md`); o plano **marca** a origem daquele ciclo e remete para lá | ⏸ **aberta** — hoje já se marca (as metodologias e o adaptado × não adaptado, com a linha livre para outra origem, em `proveniencia`) | falta o **Estúdio de Aula** (a área administrativa do professor) onde a declaração própria vive, e o `ESCOLA.conf` de B3 |
| B9 | **A régua da turma como medida do LANÇAMENTO** — o critério de cada aula declarado no lançamento (o professor diz o critério e o nível alcançado), com a régua declarada na Produção atravessando o pacote (plano → `plano-XX.json` → folha) | ✅ feito — `tipo: rubrica` na captura, régua lida do plano (queda nos quatro níveis padrão), prova `experimentos/provar-lancamento.js` (16) | ficam abertos: os **critérios fixos** da folha (13 técnica + 5 musicalidade) não vêm do plano; o **marco** só desce como leitura; folha por aula só na **Aula 01** |
| B10 | **O ALINHAMENTO do PO completo com os derivados** — cada nó respondível do PO com a SUA chave no documento e no `po-XX.json`; nada escrito como prosa dentro do campo de outro nó; os rótulos vindos do CONTEÚDO (o documento assina o nome que o professor marcou) | ✅ feito — 9 chaves novas (`planoDeEnsino`, `horizonte`, `dimensoesObservadas`, `itensPorDimensao`, `metodologiaENotacao`, `flutuantes`, `restricoes`, `horizonteDoConjunto`, `compromissoDeReavaliacao`), todas OPCIONAIS (os POs já escritos continuam válidos); a `## Metodologia e notação` passa a ser extraída; prova `experimentos/provar-po-completo.js` (17) | ficam abertos: as chaves novas nas fontes JÁ escritas (só um PO gerado de novo as traz); `norma` segue lacuna declarada mesmo com a metodologia preenchida — decisão de 25/09/2026, revisitável; `projeto: 'Formação em Balé Clássico'` está escrito à mão em 8 derivadores e não é lido por ninguém |
| B11 | **O ALINHAMENTO do PLANO completo com os derivados** — cada nó respondível do plano com a SUA chave no `plano-XX.json`; o `## Contexto` como FONTE ÚNICA (a ficha do ciclo composta dele, sem `[Preencher]` em campo declarado); a seção fora do mapa deixando de ser descartada em SILÊNCIO | ✅ feito — 5 chaves novas (`contexto`, `condicoesPreliminares`, `criterioDeExtensao`, `musicasVideos`, `repertorio`), todas OPCIONAIS; o título do volume que a derivação escreve passa a ser reconhecido (com o alias do antigo); `## Músicas e vídeos` e `## Repertório` ganham seção; o parâmetro de medição da Aula 1 chega composto (era `[object Object]`); prova `experimentos/provar-plano-completo.js` (17) | ficam abertos: as seções novas só existem num plano gerado de novo (as fontes à mão não as têm); a tabela do volume das fontes antigas tem linhas de uma célula (proporção vazia — não se inventa); `projeto:` em 11 sítios |

### Trilho C — «Sistema Lastro» (a apresentação do sistema)

> A página chamou-se «Nós, Por Exemplo» até 16/10/2026. O nome saiu: era um título de página
> servindo de nome de arquivo, de pasta e de ferramenta. O registro do que foi feito com o nome
> antigo está no `REGISTRO.md`, que não se reescreve — ver a convenção «Nomear pelo conceito».

| # | Frente | Estado |
|:--|:--|:--|
| C1 | Página `biblioteca/apresentacao.md` + `fundamentacao.md` + `videos.json` | 🔨 parcial — página ✅ (fonte única) · `videos.json` ✅ (não embutido) · `fundamentacao.md` ❌ |
| C2 | Migrar o menu (`gerar-ciclo.sh`): Início→Ciclos, nasce a apresentação | ✅ feito — «Sistema Lastro» é a entrada + grupo «Ciclos»; `criar-escola.sh` (nav_zero) sem «Início», com «Bastidores» |
| C3 | Correção socrática (Frente 5) + modo desenvolvedor (Frente 6) | 🔨 parcial — F5 (correção socrática) ✅ no pacote; F6 (modo desenvolvedor) ⏸ fase 2 |

---

## 4. A decisão que B3 destrava — o catálogo é biblioteca, não CRUD

A pesquisadora reviu o cadastro de turmas/vocabulário que nasceu como CRUD no KV. A leitura
**corrigida**:

- **A base canónica** (RAD · Vaganova · francesa · Graham · Limón · Horton · Humphrey–Weidman) é
  **conteúdo da `biblioteca/modalidades/`**, versionado e compartilhado — como o
  `guia-do-professor`. Nenhuma escola duplica.
- **A escola declara** no `ESCOLA.conf` (formato chave=valor, já planeado no
  `IDEIA-PAINEL-ESCOLA.md` §10) **o que usa e como organiza** — modalidades, tradições, turmas.
- **O ciclo herda** modalidade/turma/tradição do `.conf` da variante, e o repertório vem da
  `progressao.json` da biblioteca, filtrado pela declaração da escola.
- **O professor pode acrescentar** passo fora do repertório, **com aviso** («não pertence à
  progressão declarada») — P-16, não se restringe nem se inventa equivalência.

**Consequência imediata:** o KV de hoje (`catalogo-seed.js` + rotas turma/termo/relação) é
**andaime temporário** — serve para a integração não parar, mas será **reconstruído** como
biblioteca + `ESCOLA.conf` em peça própria. O botão «Carregar catálogo inicial» **desaparece**
quando a base for para a biblioteca (a escola passa a escolher o que usa).

---

## 5. A norma revisada (o que muda no `IDEIA-PAINEL-ESCOLA.md` §12)

A regra antiga era *«O Bastidores **não cria dado nenhum**. Ele **relê** o que o lançamento do
professor já produz»*. **Revogada** — a pesquisadora decidiu **tratar cada caso**, porque escolas
e tradições variam e **não dá para exaurir tudo numa biblioteca compartilhada**.

A leitura nova, por entidade:

| Entidade | Onde vive | Por quê |
|:--|:--|:--|
| Alunas (P-12) | escola (KV) | o grupo é dela |
| Professores | escola (KV) | idem |
| Turmas | escola (KV) | o nome é dela, não da RAD |
| Vocabulário | biblioteca (base) **+** escola (o que a base não cobre) | a base é compartilhada; a escola acrescenta o que a tradição dela usa |
| Tradições/técnicas | biblioteca (base) **+** escola | idem |

**Regra geral de operação:** incluir e excluir, **não editar** (edição fica para peça própria, se
for preciso). A Produção **relê** o que o lançamento produz **e cria/declara** o que é próprio da
escola.

---

## 6. Ordem de trabalho recomendada

```
1. B4 — registrar a norma revisada (REGISTRO + IDEIA-PAINEL-ESCOLA)   ✅ feita
2. B3 — mover a base para biblioteca/modalidades (peça própria)       ✅ base migrada (falta ESCOLA.conf)
3. B1 — curadoria (a peça central)                                    ✅ mecanismo pronto (f8d367e)
4. B2 — integração dos 3 formulários (derivados, fluxo, saídas)       ✅ metodologia/notação (3410db9) · consumo da curadoria ✅
5. B7 — Bloco 4 do PO (rubrica clicável ✅ · turmas plural ✅ · checklist pré-preenchido ✅)   ✅ fechado
6. A4 — experimento: migrar para produção (A1/A2/A3 já feitos; falta só os secrets de write-back)
7. B5 — bug do [Preencher] na distribuição do volume                   ✅ resolvido (o bloqueio era fantasma)
8. C1 — «Sistema Lastro»: `fundamentacao.md` + embutir `videos.json`  (C2 já feito) ← paralelo, independente
```
