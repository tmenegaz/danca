# Os fluxos de derivação — o real, e o caminho até ele

> **Estado:** aberto a 19/11/2026. **Dono das decisões:** a proprietária. **A bancada:**
> [`experimentos/provar-os-fluxos-da-derivacao.js`](experimentos/provar-os-fluxos-da-derivacao.js)
> (65 asserções). **O retrato do código:** [`ARQUITETURA-GERAL.md`](ARQUITETURA-GERAL.md) §3.4.

## O que ela pediu, e em que termos

> «Eu preciso que você faça uma verificação da verdade. […] Se eu mudar um professor de sala, preciso
> que dispare o processo todo e faça o ajuste respeitando a proveniência nos documentos gerados, que é
> o ciclo e a aula, se a aula ainda não ocorreu. […] Qualquer edição que eu fizer na turma, seja em
> sala ou seja em elenco, tem que disparar o fluxo. […] Se eu fizer mudanças no dicionário, não dispara
> o fluxo […] exceto se a mudança que eu fizer no dicionário for de um exercício no estilo exercícios
> com verbete que já esteja vinculado à turma. […] Se eu editar aqui em estilos qualquer exercício,
> dispara o verbete. […] A gente tem um calendário […] com a data da mudança, o que está para trás não
> se mexe e o que está para frente se altera. […] A gente tem que revisitar a partir de tudo isso que
> eu te falei e de forma paulatina, um a um. […] São fluxos de derivação, tá? Não são de edição. Tudo
> é derivação.»

E a regra de método que a acompanha: **um passo de cada vez**, cada um medido, cada um com os
documentos actualizados antes de se passar ao seguinte.

## A regra que governa o plano

**Tudo é derivação.** Um gesto que muda o que um documento já fixou não corrige o documento: cria um
**elo novo**, datado, com `ajuste_de` a apontar ao anterior, e o anterior fica como referência do
passado. O que muda com o gesto é **o que passa a valer**, nunca o que já valeu.

E a consequência que dá trabalho: **para saber o que já valeu, é preciso saber quando.** Sem data por
aula, a regra «o passado não se mexe» não é implementável — é o T7.

---

## O real, em uma tabela

| gesto | dispara hoje? | devia? |
|:--|:--:|:--:|
| Sala · `turma-editar` (corrigir o ritmo no lugar) | **sim** | sim |
| Sala · `turma-derivar` (ritmo novo, elo datado) | **sim** | sim |
| Sala · **`turma-professor`** (mudar o professor/modalidade) | **sim** desde o T2 | sim — e a modalidade **bloqueia** (T3) |
| Elenco · `linha-de-base` (gravar/concluir) | **sim** | sim |
| Elenco · `elenco-mover` (transferir aluna) | **sim** | sim |
| Elenco · `DELETE /linha-de-base` (apagar o elenco) | **não** | **sim** — deixa a Turma a apontar para o nada |
| Turma · `curadoria-derivar` | **sim** | sim |
| Turma · `curadoria` (gravar no lugar, sem plano) | **não** | **sim** quando o **elenco** muda |
| Turma · `turma-conteudo` (conteúdos, um a um) | **fechado** desde o T4 | — o mapa antigo foi migrado para o `repertorio`, e a rota recusa |
| Professor · `rubrica-do-professor` (a régua) | **não** | **a decidir** — muda o instrumento de medida |
| Professor · `professor-desligar` | **não** | **sim** — marca, mas não percorre |
| Estilo · `verbete` | **sim** desde o T5 | sim — **regera** (não deriva) |
| Dicionário · `termo` | **sim, se em uso** — desde o T6 | sim |

---

## Os passos, um a um

Cada passo tem: **o que é**, **por que antes dos outros** (a dependência), **o que muda**, **como se
mede** e **o que fica para ela decidir**. Nenhum passo começa antes de o anterior estar publicado,
medido e documentado.

### T1 — O professor da Turma deixa de ser uma cópia — **FEITO a 19/11/2026** *(estrada A)*

**O que é.** A Turma guarda hoje `professor`, `modalidade` e `tradicao` — copiados da Sala no dia em
que foi gravada. A Sala passou a ser a autoridade a 18/11/2026, e a cópia ficou: são **duas cópias do
mesmo facto**, e já divergem (medido: a Sala diz `redinha-rosa`, a Turma diz `pe-torto`).

**Por que primeiro.** Todos os passos seguintes dependem de saber **quem** dá a turma. Enquanto
houver duas respostas, cada correcção de fluxo é um remendo: liga-se o gatilho e ele deriva o nome
errado.

**Duas estradas, e a escolha é dela:**

| estrada | o que acontece | o custo |
|:--|:--|:--|
| **A — a Turma lê da Sala** (recomendada) | a Turma deixa de guardar o par; `enquadramento`, a autorização do plano e a cadeia passam a ler `sala.professor` e `sala.modalidade` | uma migração de leitura em três sítios; nenhum dado se apaga (o campo fica no registo antigo como memória, como já acontece com `turma.professor` do cadastro velho) |
| **B — a Sala propaga para a Turma** | cada escrita da Sala sincroniza as Turmas que a usam, e uma guarda recusa deixá-las divergir | mais pequeno hoje; mantém duas cópias, e a sincronização é mais um sítio que se pode esquecer |

**A decisão dela (19/11/2026):** *«A, e a memória fica. Mas precisa ser verificado no expurgo para
não ficar para trás.»*

**O que ficou feito.** A direção de hoje lê-se da Sala em quatro sítios —
`enquadramentoDaTurma` (que o cartão da sala e a marca de `descontinuada` usam),
`GET /api/bastidores/curadoria-professor`, a autorização do plano em `POST /api/elicitar` e a cadeia
(`direcaoDeHoje`, `autoriaIntacta`, `professorEfetivo`). A cópia continua no registo como **memória**,
e responde só quando a Sala não declara o par — uma sala de antes de 18/11. O `id` da curadoria não
muda: é identidade, e o par faz parte dela. A **tradição** continua a vir da curadoria, porque não
está na Sala.

**E o expurgo foi conferido, como ela pediu** — e tinha um buraco: a lista declarada do expurgo
(a que vale no dia em que o `kv.list` não responde) não conhecia **`matriculas`** nem **`cadeia`**.
Duas chaves ficariam para trás numa escola expurgada, e a primeira é o vínculo de cada aluna com a
escola. As duas entraram, e a bancada compara agora a lista com as chaves que o **código** escreve —
para a próxima chave nova não ficar de fora em silêncio.

**Medido.** `provar-os-fluxos-da-derivacao` **34** — as duas asserções da lista inverteram-se (o
professor novo vê a turma, o antigo deixa de a ver), a cadeia passou a apanhar a troca com a frase da
autoria, e a §D é nova (o expurgo). `provar-a-autoria-na-troca-de-professor` 41,
`provar-turma-sem-professor` 23 (uma asserção invertida: o registo degenerado já não esconde a turma),
`provar-regua-do-professor` 44, `provar-salas-e-elencos` 132, `provar-pagina-do-professor` 17,
`provar-cadeia-do-ajuste` 34, `provar-remocao-do-elenco` 26, `provar-anamnese-da-aluna-certa` 18.

### T2 — «Mudar o professor de uma Sala» dispara o fluxo — **FEITO a 19/11/2026**

**O que era.** `POST /api/bastidores/turma-professor` gravava o par e não percorria nada. Das oito
rotas que deviam percorrer a cadeia e não o faziam, era a primeira — e a única que muda **quem dá a
aula**.

**O que passou a valer.** A rota chama `rodarCadeia` com o gatilho **`troca-de-direcao`** e devolve
`cadeia` e `trocou: {professor, modalidade}`, o mesmo contrato das outras cinco. E o que a cadeia faz
não é derivar: é **parar e dizer**. A etapa `plano-de-ensino` fica `bloqueada` com a frase da
autoria — *«a autoria não se reescreve — este professor escreve o plano dele»* —, o plano do anterior
fica `sem turma` a dizer quem o escreveu, e o professor novo escreve o dele. É a regra de 12/11/2026,
e ela já existia no motor: faltava alguém a correr.

**Três correcções que o gatilho obrigou a fazer primeiro** — e nenhuma delas é cosmética:

1. **A travessia só corre quando algo mudou.** A pergunta é feita **antes** da escrita, porque é aí
   que a resposta ainda existe. Sem ela, um gesto que reconfirma o mesmo par escrevia uma entrada no
   log sem fazer nada, o que se lê como trabalho e não é. A resposta di-lo: *«o par da sala não
   mudou — não há nada a percorrer»*.
2. **O gatilho passou a dizer o que mudou, nos dois caminhos que também mexem no par.** O
   `turma-editar` e o `turma-derivar` mandavam sempre `mudanca-de-sala` — o rótulo do **ritmo** —,
   mesmo quando quem mudou foi a direção. O log da cadeia lê-se por esse rótulo, e um rótulo que
   mente sobre o gesto é a mesma família do `.catch` que escreve no `.res`.
3. **`parouPor`.** A travessia passou a devolver **a frase** da etapa que a parou, e o aviso que
   atravessa a recarga leva-a. Sem isso a tela recebia `bloqueada` e não tinha o que dizer.

**E a ponte.** A cadeia não é montada dentro das rotas: `producao.js` tem a lista dos gestos para os
quais ela é montada, e um gesto fora dessa lista chama uma cadeia `null` — grava, devolve `200`, e a
travessia não acontece. Foi o que aconteceu aqui; a bancada passou a comparar as **duas listas**, e
uma rota nova que chame a cadeia sem entrar na lista reprova.

**Medido.** `provar-os-fluxos-da-derivacao` **34 → 57**: a resposta com `cadeia`, a travessia a
correr (`pedidos > 0`), o gatilho `troca-de-direcao`, o motivo a nomear os dois professores, o
`parouPor` com o nome da turma, o «nada mudou» a não fingir travessia, a modalidade a disparar
também, e as duas listas (rotas × ponte) a coincidir. **Controlo negativo: 14 de 56 reprovam**
contra o `bastidores.js` anterior. Vizinhas: `provar-autoria-na-troca-de-professor` 41,
`provar-salas-e-elencos` 132, `provar-turma-sem-professor` 23, `provar-cadeia-do-ajuste` 34,
`provar-regua-do-professor` 44, `provar-gravar-e-gravar` 49.

**O que fica para o T3, e não se resolveu aqui:** a **modalidade** mudou no mesmo gesto e passou a
percorrer a mesma travessia, mas **ainda não se decidiu** se ela deriva (mesmo autor, outro
referencial) ou bloqueia (outros níveis, outra régua). Hoje ela percorre e não encontra o que
bloquear, porque `direcaoDeHoje` só compara professor e sala.

### T3 — A troca de **modalidade** de uma Sala — **FEITO a 19/11/2026** *(a decisão dela: bloquear)*

**O que é.** O mesmo gesto (`turma-professor`) muda também a modalidade. Uma modalidade diferente não
é o mesmo professor noutra sala: é **outro corpo de referência** (as anamneses são por modalidade, os
níveis são outros, a régua pode ser outra).

**Por que separado do T2.** As duas mudanças têm o mesmo gatilho e efeitos diferentes: a de professor
**bloqueia** (autoria); a de modalidade **pode derivar** (o mesmo professor, outro enquadramento) — e
é preciso decidir se deriva ou se bloqueia também.

**O T2 deu-lhe o gatilho, e não a regra.** A modalidade passou a **percorrer** a travessia junto com
o professor (`turma-professor`, `turma-editar` e `turma-derivar` leem as duas), mas a travessia não a
**via**: `direcaoDeHoje` comparava professor e sala, e uma troca só de modalidade percorria tudo sem
encontrar o que dizer. O que faltava não era o disparo — era a decisão, e a regra que dela sai.

**O que se sabia do código antes de decidir** — três factos, e o segundo é o que dava peso à
pergunta:

| o quê | onde se leu | o que diz |
|:--|:--|:--|
| a travessia **corre** numa troca só de modalidade e **deriva** (mesmo autor) | medido: `nucleoCadeia.indice` devolve `pendente` no plano e no PO, não `bloqueada` | o comportamento de hoje já é «derivar com aviso» — a decisão não é implementar, é **confirmar ou bloquear** |
| a travessia **não vê** a modalidade | `motor/nucleo/cadeia.js`, `direcaoDeHoje` | compara `professor` e `turma`; uma troca só de modalidade percorre tudo e não encontra o que dizer |
| o PO derivado **não relê a régua** | `motor/servidor/cadeia.js`, `derivarPO` | as `respostas` são copiadas verbatim (é a regra: a cadeia preserva as respostas) — e é nelas que vivem os níveis contra os quais o PO mede. A régua muda com o par (`conferirOParDaSala`), o PO não |

E a «Modalidade» que o documento impresso mostra **não é** a modalidade contratada da Sala: é a
**habilitação do professor** (`tools/montar-publicacao.js` → `perfilDoProfessor`). Logo, uma troca de
modalidade na Sala não muda o que o documento diz — mas muda a **escala** contra a qual ele mede.

**A decisão dela, a 19/11/2026:** *«bloquear»*. A modalidade não se converte — o plano e o PO escritos
sob uma escala não passam a valer sob outra.

**O que passou a valer.** A guarda `modalidadeMudou(doc)` compara a modalidade que o **documento**
declara (`contexto.modalidade`) com a que a **Sala** declara hoje, e põe a etapa `plano-de-ensino` — e
a do `plano-de-observacao` — em **`bloqueada`**, com a frase que nomeia as duas modalidades, diz que a
régua vem com o par e que os níveis são outros, e diz o que fazer: quem dirige escreve o dele, sob a
modalidade que vale hoje. `direcaoDeHoje` passou a ler a modalidade da Sala (a cópia da curadoria é o
recurso), e `direcao(doc)` passou a expor a do elo.

**Duas peças tiveram de nascer para a guarda ter o que comparar:**

1. **o documento passou a declarar a modalidade.** `contexto.modalidade` — campo que
   `CAMPOS_DE_CONTEXTO` já admitia desde sempre, e que ninguém escrevia; o comentário em
   `motor/servidor/cadeia.js` chegou a afirmar o contrário, e estava errado. A porta
   (`comAModalidadeDaSala`) escreve-o **a partir da Sala**, e não do que o cliente mandar: um cliente
   não é uma regra.
2. **a assimetria dos dois caminhos que produzem um elo**, e é ela que faz a trava ter sentido:
   a derivação **automática** (`contextoDoElo`) **preserva** a modalidade do elo anterior — se a
   escrevesse, o documento declarar-se-ia conforme por construção e a trava levantava-se sozinha; a
   **porta** declara, porque abrir o plano e gravar é o acto de quem escreve. É o caminho de saída, e
   tem de haver um.

**O que fica fora do bloqueio, de propósito:** um elo anterior a esta data **não declara** a
modalidade, e o vazio não é erro — pela convenção de sempre (`professor` vazio também não é). A
mesma modalidade dos dois lados não dispara nada.

**Medido.** `provar-os-fluxos-da-derivacao` **57 → 65** (a §E nova: a etapa bloqueada, as três frases,
o PO, o vazio, a mesma modalidade, e o gesto da Sala a nomear a modalidade). **Controlo negativo: 5 de
65 reprovam** contra o `motor/nucleo/cadeia.js` do `HEAD`. E `provar-gestos-do-shard` **31 → 33** (o
plano declara a modalidade, e ela vem da **Sala**, com a cópia da curadoria a divergir de propósito);
**controlo negativo: 2 de 33** contra o `rotas.js` anterior. Vizinhas verdes:
`provar-a-autoria-na-troca-de-professor` 41, `provar-cadeia-automatica` 62,
`provar-salas-e-elencos` 132, `provar-direcao-do-documento` 32, `provar-carimbo-da-edicao` 56.

### T4 — Os conteúdos da Turma, e o mapa antigo que escreve sem guarda — **FEITO a 19/11/2026** *(a decisão dela: migrar)*

**O que é.** Há dois caminhos para o mesmo facto: o `repertorio` da Turma (a via nova) e o mapa
`turma-conteudos` (a antiga, por Sala). O segundo **escreve sem guarda nenhuma** — nem a de a Turma ter
plano. É o que os documentos derivados leem.

**O que muda.** Um caminho só (o `repertorio`, que já é o dono desde 07/11/2026), com o mapa antigo lido
como memória e não escrito; e o gesto a disparar a cadeia.

**A decisão dela, a 19/11/2026:** *«migrar»* — o mapa antigo passa para o `repertorio` das curadorias,
e depois **fecha-se a leitura também**. Não basta fechar a escrita: enquanto o mapa for lido, é um
segundo dono do mesmo facto, e a memória pode acrescentar conteúdos que o professor já não declarou.

**O que passou a valer.** `migrarMapaAntigo` (núcleo) leva o mapa para o `repertorio` da curadoria
**vigente** de cada turma, sem duplicar (a comparação é por id: «Plié» e `plie` são o mesmo) e
mantendo a ordem da declaração. E **não inventa destino**:

| caso | o que acontece |
|:--|:--|
| a turma não tem curadoria vigente | fica em `semDestino` — o repertório vive na curadoria, e criá-la é um acto da direção |
| a curadoria ensina **mais de uma** turma | fica em `semDestino` — o repertório é um só, e migrar daria à outra o que não é dela |
| a curadoria está substituída | não recebe nada: quem manda é a vigente |
| correr outra vez | não muda nada (idempotente, e retomável) |

A rota `POST /api/bastidores/migrar-conteudos` escreve as curadorias e a marca **`conteudos-migrados`**
— e a marca só é escrita quando `semDestino` está vazio. Com uma turma sem destino, a resposta é
**409** e a leitura **não** fecha: fechá-la nessa altura apagaria da tela os conteúdos dessa turma.
`simular: true` mostra o plano sem escrever.

**O fecho.** `relacoesDosConteudos` (leitura) e `mapaAntigoParaEscrita` (os gestos que mudam o id de
uma turma: renomear, derivar, apagar) passam a responder **vazio/`null`** quando a marca existe. As
rotas antigas `POST`/`DELETE /api/bastidores/turma-conteudo` **recusam com 409** e nomeiam o caminho
(o formulário da Turma). O mapa **não se apaga**: fica no KV como memória, e a chave nova entra na
lista do expurgo no dia em que nasce.

**O que já estava certo, e não se mexeu:** a regra de 07/11/2026 — a **declaração viva vence a
memória**, e o mapa só fala pelas turmas que nunca tiveram curadoria. Foi ela que impediu o resíduo de
Outubro de voltar à tela. E o gatilho da cadeia: os conteúdos vivem no `repertorio`, que é gravado pelo
`curadoria-derivar` — uma das seis rotas que já percorrem a cadeia. O caminho no lugar (`curadoria`)
só acontece quando a Turma **não tem** plano, e nesse caso não há nada a re-derivar.

**Como se mede.** `provar-a-migracao-dos-conteudos` **24** (§A o núcleo, §B a rota, §C o par que prova
a mudança — antes da marca o mapa fala, depois cala-se —, §D o fecho da escrita); **controlo negativo:
14 de 24** contra o código anterior. `provar-os-fluxos-da-derivacao` 65 (§D: a chave nova do expurgo
entra na lista no dia em que nasce — **medido**: sem ela, a §D reprova).

### T5 — O Estilo: editar um exercício que uma Turma usa — **FEITO a 19/11/2026** *(a decisão dela: regerar)*

**O que é.** Editar o verbete de um exercício muda a **notação** e o **glossário** que os documentos
derivados imprimem. Hoje não dispara nada.

**O que a cadeia deve fazer** — e aqui não é a mesma travessia: **o plano não muda** (o professor não
escreveu outra coisa), o que muda é a **derivação** dos documentos. É um **regerar**, não um derivar.

**A decisão dela, a 19/11/2026:** *«regerar»* — automaticamente. É a mais directa, e é a que tem
custo; o que se faz para não mentir é **dizer o que se gastou**: a resposta leva as Turmas tocadas e
cada disparo.

**O que passou a valer.** Gravar ou apagar um verbete (`POST`/`PUT`/`DELETE /api/bastidores/verbete`)
percorre, depois da gravação, as **Turmas que usam aquele exercício** — a pergunta é respondida pela
**composição** (`mapaDeConteudos`), e não por uma lista à mão — e dispara **uma geração por
(professor, ciclo, turma) que já tenha plano**. Sem Turma que o use, ou sem plano, nada se dispara e
a resposta **diz porquê**.

**Porque não se deriva nada aqui.** Nos outros passos a travessia acrescenta **elos** (o documento
muda porque alguém mudou uma decisão). Aqui não: o plano é o mesmo, o autor é o mesmo — o que muda é
a **leitura** que os documentos fazem do exercício (a notação e o glossário). Inventar um elo faria o
passado dizer que alguém reescreveu uma decisão que ninguém tocou. É um **regerar**.

**O miolo da geração passou a ser um só.** Estava dentro de `gerarOsCiclosDoElenco`; foi extraído
para `gerarOsCiclosDasTurmas` quando o **segundo** gesto precisou dele. Um caminho, um sítio — o dia
em que a geração mudar, muda-se uma vez. As frases de «não há alvo» entram por parâmetro, porque um
recado que mente sobre o que aconteceu é da mesma família do gatilho que mente sobre o gesto.

**O que fica por mostrar.** A tela do Estilo ainda **não exibe** o `geracao` da resposta: o gesto
regera, e o professor não vê a frase. É a peça que falta, e é de desenho — não se inventa aqui.

**Medido.** `provar-o-estilo-regera` **12** (§A quem usa, §B o disparo, §C o que não se perde);
**controlo negativo: 9 de 12** contra o `bastidores.js` anterior. E o fecho do T4 vale aqui: depois da
marca `conteudos-migrados`, o mapa antigo deixa de contar — a memória não faz regerar.

### T6 — O Dicionário: a mudança condicional — **FEITO a 19/11/2026**

**O que é.** Ela foi explícita: mudar o dicionário **não** dispara — *excepto* se o exercício estiver
em uso por uma Turma (o «exercício com verbete que já esteja vinculado à turma»).

**O que é preciso primeiro.** O sistema **já sabe** responder «que turmas usam este termo»
(`turmasPorTermo`), mas usa-o só para a etiqueta «em turma» da listagem. O passo é usar a mesma
resposta como **condição do gatilho** — uma resposta, dois consumidores.

**O que passou a valer.** As quatro rotas que escrevem o termo — `POST`, os dois caminhos do `PUT`
(os campos do Dicionário e o `novoNome`), e o `DELETE` — chamam `comAGeracaoDoTermo`, a mesma colagem
que o T5 usa no verbete. **A condição não se escreve em nenhuma delas:** é a travessia que pergunta
quem usa o exercício e, quando ninguém usa, devolve o aviso sem disparar nada. Uma regra, um sítio.

**Como se mede.** A §D do `provar-o-estilo-regera`: um termo **em uso** nomeia a Turma; um termo
**livre** não nomeia nenhuma, e a travessia responde com o aviso sem disparar. E, lido no **fonte**, os
quatro caminhos chamam a colagem — um sítio que a perca numa edição futura reprova. **Controlo
negativo: 1 de 15** contra o `bastidores.js` do T5 sem o T6, e é exactamente essa ligação.

### T7 — O calendário: a data existe, e o que falta é **congelar** a das aulas que já aconteceram

> **Correcção a 19/11/2026, no mesmo dia em que este passo foi escrito.** A primeira versão dizia que
> «não há data por aula» e que a regra dela não tinha o dado de que precisa. **É falso**, e ela
> corrigiu-o com a frase certa: *«temos a sala. Essa sala diz que na segunda, na quarta e na sexta às
> 16:30 […] Essa é a programação da aula. […] É assim que a gente tem a data de cada aula.»*

**O que já existe** — medido em `publicacao/breu/rosa/ciclos.json`: `aulas` é uma lista de 24
entradas com `n`, **`data`**, `inicio`/`fim`, `marco`, `lancada`, `ancora` e `prazo`. As datas vêm do
ritmo da Sala pelo `calendario.py` (dentro de `tools/gerar-ciclo.sh`), e são lidas — `aulas-dadas.js`
usa `a.data` e `a.prazo`.

**A decisão dela, e já está tomada:** a data **vem do ritmo da Sala** (opção A — dias, horários,
período), e a Sala associada ao professor e à Turma **é** a programação da aula. Se a secretaria mudar
alguma coisa, muda em Produção e a geração corre outra vez.

**O que falta, então, é o corte — e é o mais delicado:**

1. **A lista `aulas` é recalculada a cada geração a partir do ritmo ACTUAL.** Uma aula já lançada
   (`lancada: true`) recebe a data que o ritmo de hoje produz: se os dias ou o período mudarem, a data
   de uma aula que **já aconteceu** move-se. O passado reescrito, em silêncio.
2. **Nada no motor compara `a.data` com a data da mudança.** O `-plano.md` e o `-aula-01.md` são
   regerados inteiros.
3. O **lançamento** guarda quando se registou (`ultimo_lancamento`), não quando a aula foi — e é da
   `data` da lista, não do carimbo, que sai o «já passou».

**O que muda.** A geração passa a **preservar a data das aulas já lançadas** (a `data` que tinham no
`ciclos.json` anterior, que a própria geração escreve), e o corte a ser lido por quem decide o que se
reescreve. O que é futuro continua a ser recalculado — é isso que faz a mudança chegar a quem ainda
não teve a aula.

**Como se mede.** Com um `ciclos.json` anterior que tem uma aula lançada, e um ritmo novo: a data
dessa aula **não** muda, a das futuras muda, e `lancada`/`ancora` ficam. É uma prova sobre o que a
geração escreve — e é o sítio onde ela é mais difícil de provar: o `gerar-ciclo.sh` só corre inteiro,
com um ciclo real.

**Porque fica para o passo seguinte, e não se faz aqui.** Mexer no `gerar-ciclo.sh` sem o poder correr
contra um ciclo real é mexer no sítio onde um erro se paga em dados — e ela vai fazer o expurgo da
`breu` a seguir a estes testes.

### T8 — O véu que dura o que o GitHub durar

**O que é.** *«O véu vai durar na tela o tempo que for necessário para acabar o processo lá no GitHub
e aí trouxer a resposta de que já pode carregar a página.»*

**O que existe hoje.** O véu cobre o pedido ao Worker (que inclui a derivação dos envelopes, essa é
síncrona). A **geração** (pandoc/pdflatex no Actions) é assíncrona, e o véu não a espera — a página
recarrega e o pacote fica em dia minutos depois, com a frase da cadeia a dizê-lo.

**O que muda.** Um acompanhamento: o gesto pede a geração, e a tela consulta o estado dela (o mesmo
mecanismo de `cadeia-pacote`, com o orçamento de subpedidos a mandar) até a resposta dizer «pronto» —
ou desiste e diz o que falta, com o link.

**Por que por último.** É a única camada que não muda **o que** acontece, só **quando se sabe**. Fazê-la
antes das outras seria pôr um véu comprido sobre um fluxo que ainda não está certo.

### T9 — A documentação, a cada passo

Cada passo fecha com: a §3.3 e a §3.4 do `ARQUITETURA-GERAL.md` revistas, uma entrada no
`REGISTRO.md`, a fotografia no `ESTADO-ATUAL.md`, e a linha da bancada no `experimentos/README.md`.
A regra é a da casa: **nenhum número escrito sem ser medido**, e o controlo negativo medido no mesmo
dia em que a correcção entra.

---

## A ordem, e por que é esta

```
T1 (a cópia) ─► T2 (professor dispara) ─► T3 (modalidade bloqueia)
                     │
                     ├─► T4 (conteúdos: migrar e fechar)
                     ├─► T5 (Estilo: regera) ─► T6 (Dicionário: condicional)
                     └─► T7 (calendário) ─► T8 (o véu)
                                            └─► T9 (a cada passo)
```

- **T1 é a raiz.** Sem ela, ligar gatilhos deriva o nome errado — é o que o comentário da rota de
  hoje diz, e tem razão.
- **T7 é o que dá sentido à palavra «proveniência»** neste assunto: sem calendário, toda a derivação
  reescreve o passado.
- **T8 é conforto**, e é o único que pode esperar.

## O que já está garantido, e não se mexe

- a **ordem** da cadeia: elenco → Turma → PE → PO → pacote;
- **a autoria não se deriva** (12/11/2026);
- **o plano exige a Turma** (403 na porta) — «somente a partir da turma definida é que podemos ter um
  plano de ensino»;
- **o `aulas` do `-dados.json` é preservado** em cada geração: a evidência do que aconteceu não se
  reescreve;
- a cadeia **nunca derruba o gesto que a chamou** — uma falha vem na resposta, com o motivo.
