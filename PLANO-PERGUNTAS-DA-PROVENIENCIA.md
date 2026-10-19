# Plano — As perguntas que a proveniência responde

> **Status.** Plano de produto e de engenharia. **Nada foi implementado.** Este documento define
> **quais perguntas** o acervo do Sistema Lastro deve responder, **com que dado**, **com que prova**
> e **em que plano comercial** — antes de qualquer consulta ser escrita.
>
> **Escopo (18/10/2026).** **55 perguntas firmadas**, em **8 famílias**, mais **18 candidatas**
> propostas pela grade (§4.9, Anexo D): nove que fecham dívidas e nove de **identificação** — vínculo,
> autoria e localização, incluindo o professor como atributo (§4.9.2). Exames externos e motivo de saída estão **fora de escopo**: não são
> entidades do sistema (§6), e a pergunta que os motivava permanece como **recusa** (§9). O
> **professor não é sujeito de medida** — não existe família PR (§4.9.1); ele **é** vínculo, autoria e
> escopo, e isso o índice guarda (§4.9.2).
>
> **Este catálogo é uma primeira passagem, não a versão final.** Ele só fecha quando a grade do §4.9
> tiver veredicto em todas as células — e é isso, não a contagem, que destrava a distribuição
> comercial (§5.1).
>
> **Por que as perguntas vêm primeiro.** A resposta é de cada escola, de cada professor, de cada
> comitê. O sistema não a produz: produz o **registro**, a **medida** e o **caminho até o original**.
> Um catálogo de perguntas é o contrato que diz o que o produto entrega — e é ele que dá sentido ao
> índice, ao catálogo de consultas (L6) e à distribuição comercial (C5, L9).
>
> **Precedência (18/10/2026).**
>
> 1. **Identidade visual — CONCLUÍDA em 18/10/2026** (item 2.8 fechado; 19 verificações passam).
> 2. **Índices do acervo** — [PLANO-INDICES.md](./PLANO-INDICES.md). É o que torna a resposta
>    rápida; sem ele, cada pergunta é uma varredura. **É a próxima a implementar.**
> 3. **Este catálogo** — define o que o índice precisa de guardar e o que a consulta precisa de
>    medir. **O desenho já está escrito**; o que falta é o que **você** decide (fechar a grade,
>    §4.9) e, depois, a implementação das consultas (L6).
> 4. **A Tabela de atividades** — [PLANO-TABELA-DE-ATIVIDADES.md](./PLANO-TABELA-DE-ATIVIDADES.md).
>
> A implementação segue as camadas do [PLANEJAMENTO-LASTRO.md](./PLANEJAMENTO-LASTRO.md) §5:
> L1+L2+L10 → L5+L3 → L4 → **L6 (este catálogo)** → L7/L8/L9 → L11/L12.

---

## 0. Onde está o plano comercial (o que se procurava)

O que existe **não é um arquivo de planos**: são **frentes** e **decisões** dentro do
[PLANEJAMENTO-LASTRO.md](./PLANEJAMENTO-LASTRO.md). O mapa:

| O que se procura | Onde está | O que diz |
|:--|:--|:--|
| **Os três planos e os valores** | `PLANEJAMENTO-LASTRO.md` §2.9 (linha ~344) | **Básico R$ 62,38 · Intermediário R$ 99,88 · Avançado R$ 137,38**; compromissos trimestral/semestral/anual; adicional **R$ 49,90 + 20%**; hora técnica **R$ 120,00** |
| **A composição comercial** | §4 **L8** | Fonte única dos valores, calculador por período, adicionais |
| **Cotas e limites por plano** | §4 **L9** | Professores, modalidades, consultas, cota de IA — e a regra «o plano não degrada o dado» |
| **A jornada comercial** | §4 **L12** | Oferta, 3 meses gratuitos do Básico, comunicação, estados |
| **A distribuição 3 / 7 / todas** | §3 **C5** | **Não decidida** — é a decisão que este documento precisa |
| **Os valores não estão no repositório** | §3 **C8** | Existem **apenas no texto que originou o planejamento** |
| **As quatro durações** | §3 **C12** | 2 h, 48 h, 3 meses, «30 dias» — a última **não existe** |
| **`pagante` com dois sentidos** | §3 **C18** | Trava de expurgo × estado comercial |

> **Consequência prática.** Não há onde ler «quais perguntas o Básico inclui» — o repositório diz
> apenas que o texto 2 §5 propõe **3 / 7 / todas**. Este plano preenche essa lacuna com uma
> proposta explícita, marcada como proposta.

---

## 1. O achado que muda a leitura: a âncora prova, o registro responde

«Olhar na proveniência» tem três camadas, e confundi-las produz a expectativa errada:

| Camada | O que é | O que responde | O que **não** responde |
|:--|:--|:--|:--|
| **Âncora** (`.fipp`) | hash encadeado + cobertura + `parentHash` | «este documento mudou?», «esta é a versão que foi publicada?», «o passado foi reescrito?» | **nada de conteúdo** — não guarda a aula, a marca nem o plano |
| **Registro** (PO, plano, lançamento, caderno, relatório) | os documentos e os dados da aula | «o que foi planejado», «o que foi observado», «o que mudou» | «por que» — causa não é dado, é interpretação |
| **Índice** (o que este plano exige) | metadados, IDs e facetas | «onde está», «quantos», «em que ordem», «com que recorrência» | a decisão e o juízo |

**A resposta a uma pergunta de proveniência é sempre: medida + caminho + elo.** A medida sai do
registro, o caminho aponta para o documento, o elo (hash) prova que o documento é o que era. Uma
resposta sem os três é opinião com aparência de dado.

**Consequência para o produto.** «A escola olha para trás» não é abrir um PDF: é **consultar o
índice**, filtrar, e chegar ao original. É por isso que o índice é pré-requisito, e não otimização.

---

## 2. A fronteira: o sistema não avalia

O projeto declara, em vários lugares, que **não avalia** e **não decide sobre o aluno**. Isso não
impede as perguntas da escola — muda a **forma** delas. Três reformulações, e são o núcleo deste
plano.

### 2.1 «Quais alunos precisam de ajuda?»

**Não.** O sistema não tem critério de necessidade, e qualquer critério seria dele, não da escola.
O que ele pode fazer é mostrar **onde a marca se repete**:

> **AL03** — Em que colunas a marca `parcial` ou `nao` se repete para esta aluna, em que aulas, e
> desde quando?

A leitura («esta aluna precisa de ajuda») é da escola. O dado é a **recorrência**, não a conclusão.

### 2.2 «Quais alunos se destacam?»

**Não.** «Destacar-se» é juízo e comparação por mérito. O sistema mostra **distribuição**:

> **AL04** — Em que colunas a marca `ok` se repete para esta aluna, em que aulas, e qual a
> distribuição da turma na mesma coluna?

`AL09` compara a aluna com a turma, mas **sem ordenar** e **sem produzir ranking** — mostra a
distribuição e o ponto da aluna nela.

### 2.3 «Quais professores conseguem ter êxito em suas propostas de observação?»

Esta é a pergunta que estava errada, e vale dizer por quê: ela mede **a pessoa**, não o
**instrumento**. Um professor pode não ter «êxito» porque a folha pediu o que não se vê à distância,
porque a turma tinha 28 alunas, ou porque a aula durou 40 minutos em vez de 60. O que se quer saber
é outra coisa:

> **OB01** — Quais colunas do Plano de Observação foram **observáveis na sala** e quais
> concentraram `nao_vi` (não vi) ou vazio?

Isso mede **a viabilidade do instrumento** — e é acionável: a escola ajusta o PO, não troca o
professor. E é a pergunta que sustenta a melhoria do método, que é o que o projeto promete.

> **A mesma correção vale para «quais observações são exitosas».** Uma observação não é «exitosa»:
> ela é **observável** ou **não observável** naquelas condições. `OB02` mede a distribuição das
> marcas por coluna; `OB03` encontra as colunas que nunca foram usadas; `OB06` cruza a
> observabilidade com as condições de contorno.

**As três reformulações estão aceitas (18/10/2026).** O catálogo usa `AL03`, `AL04` e `OB01` como
estão escritas acima, e não as perguntas originais. Quem citar «quais alunas precisam de ajuda»
encontra aqui a tradução — e a recusa, que é parte da resposta.

### 2.4 As demais perguntas que exigem reformulação

| Pergunta da escola | O que o sistema entrega | O que ele recusa |
|:--|:--|:--|
| «Por que esta aluna saiu?» | o percurso completo: presença, marcas, ajustes, mudanças de turma, condições — e o elo de cada registro | **atribuir causa.** `PE02` mostra o que mudou; «por quê» é hipótese da escola |
| «Por que esta aluna não passou no exame?» | o registro dela e o das colegas, lado a lado, nas colunas que o PO cobre — **e só isso** | **explicar o resultado.** O exame é externo e não está no sistema; `AL04`/`OB02` mostram diferenças no registro, não a razão da banca |
| «Quem é o melhor professor?» | — | **não existe.** `OB01` mede instrumento; `EN01–EN04` medem aderência ao plano, não qualidade |
| «Esta aluna aprendeu?» | o que foi observado, quando, e o que não foi | **concluir aprendizagem.** `AL08` distingue «sem registro» de «não domina» |

---

## 3. A anatomia de uma pergunta

Toda pergunta do catálogo tem seis partes. Se faltar uma, ela não entra.

```
1. SUJEITO   aluna · turma · ciclo · professor · escola · sala · aula · instrumento · documento
2. RECORTE   período · ciclo · turma · modalidade
3. MEDIDA    contagem · distribuição · sequência · ausência · mudança · comparação · identificação
4. FONTE     documento (com âncora) · lançamento · cadastro
5. PROVA     o elo .fipp e o caminho até o original
6. RECUSA    o que a resposta NÃO afirma
```

> **`professor` está na lista de sujeitos, mas com uma medida só** (18/10/2026): `identificação` —
> «onde está», «quais turmas». Ele **não** é sujeito de `contagem`, `distribuição`, `sequência`,
> `ausência`, `mudança` nem `comparação`. A razão está em §4.9.1 e §4.9.2.

**Regra de ouro.** Toda resposta devolve, além do número, **o caminho para o original** e **a
âncora da versão**. Sem isso, a resposta não é proveniência: é relatório.

**Regra de ausência.** «Sem registro» é um resultado, não um zero. Toda medida distingue:

- **não observado** — a coluna ficou vazia ou `nao_vi`;
- **não aconteceu** — a aula não foi dada;
- **não registrado** — a aula foi dada e não lançada;
- **zero** — houve registro e a marca é `nao`.

As quatro são diferentes, e confundi-las viola a regra do projeto («ausência de evidência não é
prova de ausência de aprendizagem»).

---

## 4. O catálogo

**Legenda de classe** (a mesma do §7 do planejamento):

- **[S]** **Simples** — o dado existe e falta o leitor.
- **[C]** **Cruzamento** — o dado existe em pontas separadas e falta o vínculo.
- **[V]** **Vocabulário** — o conceito não existe no modelo; exige L10 antes de qualquer código.

**Legenda de plano.** As tabelas abaixo são **técnicas** — dizem se o dado existe. O plano
comercial de cada pergunta está no **§5**, que é a única fonte da distribuição (e é onde se muda).

---

### 4.1 CT — Continuidade: o que vem agora

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **CT01** | Qual é a **próxima aula** deste ciclo: quando, com que marco e até quando se lança? | `ciclos.json → aulas[]` com `data`, `inicio`, `fim`, `marco`, `prazo`, `estado`; a primeira com `estado ∈ {planejada, dada}` e data ≥ hoje | S |
| **CT02** | O que já foi **dado, lançado, não dado** e o que está em curso neste ciclo? | contagem por `estado` derivado (`lancada`, `nao_dada`, `dada`, `planejada`) | S |
| **CT03** | Que **marcos do plano** ainda não foram trabalhados? | `marcosPorAula` × `aulas[].marco` × lançamento (a aula com o marco foi dada e lançada?) | C |
| **CT04** | O que **ficou pendente** do ciclo anterior? | aulas `nao_dada` + marcos sem aula + ajustes declarados, por ciclo | C |
| **CT05** | Qual é o **próximo ciclo** e o que ele herda? | sequência de ciclos por professor × escola; herança declarada (nível, objetivo geral, turma, professor) | C |
| **CT06** | Que **decisão do plano** mudou entre a versão anterior e a vigente, e por quê? | versões do plano (L5) × campo alterado × data | C |

**Recusas da família.** CT01 não prevê se a aula será dada. CT05 não propõe o próximo ciclo — só
mostra o que existe e o que foi herdado. CT06 não julga a mudança: mostra o diff.

**O estado e o prazo são derivados no instante da leitura.** O índice guarda `gerado_em`; quem lê
re-deriva com o próprio relógio. Um `estado` guardado há dias mente sobre «não dada».

---

### 4.2 AL — O percurso da aluna

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **AL01** *(ex-T01)* | **O que já foi trabalhado** com esta aluna? | `sujeitos` do PO + marcos do plano + linha de base + lançamento por aluna × coluna | C |
| **AL02** | Em que aulas ela **esteve** e em que aulas **faltou**? | `aulas[].presentes` / `ausentes` por data | S |
| **AL03** | Onde a marca **`parcial`/`nao`** se repete para ela, em que aulas, desde quando? | contagem por coluna × aula; sequência temporal | C |
| **AL04** | Onde a marca **`ok`** se repete para ela, e qual a distribuição da turma na mesma coluna? | idem, com a distribuição da turma ao lado | C |
| **AL05** | Qual era a **linha de base** declarada no PO, e onde o registro posterior a toca? | `linha-de-base` (PO) × colunas do lançamento que correspondem à dimensão | C |
| **AL06** *(ex-T03)* | Como as **observações se distribuíram no tempo**? | série por data × coluna × marca | C |
| **AL07** | Que **ajustes** o professor declarou (para ela ou para a turma) e em que aulas? | `relatorio.ajustes` — presença, data e trecho | C |
| **AL08** | Em que proporção das aulas há **`nao_vi` ou vazio** para ela? | contagem de não-observação sobre o total de aulas com registro | S |
| **AL09** | Como o percurso dela se **compara à turma**? | distribuição da turma por coluna + ponto dela; **sem ordenação por mérito** | C |
| **AL10** | Que **mudanças de turma, nível ou professor** ela teve? | histórico de turma derivada + curadoria + data de vigência | C |

**Recusas da família.** AL03 não diz «precisa de ajuda»; AL04 não diz «se destaca»; AL09 não produz
ranking; AL05 não compara com o nível seguinte (isso é TR07/P03); AL08 não conclui aprendizagem —
distingue ausência de registro.

**Dado que falta hoje.** A aluna não tem identificador estável (hoje é o apelido, e o próprio
planejamento mede isso em §2.4). Sem `aluna:<id>` pseudônimo e estável, AL01–AL10 **não cruzam**
entre ciclos. É a exigência L2 que este catálogo torna obrigatória.

---

### 4.3 EN — O ensino: a proposta × o que aconteceu

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **EN01** | A aula **seguiu o plano** declarado? Em que aulas não seguiu? | `condicoes_contorno.plano_seguido` por aula | S |
| **EN02** | O que o professor **ajustou em tempo real**, e em que aulas? | `relatorio.ajustes` — presença, data, trecho | S |
| **EN03** | O que **surpreendeu** o professor, e em que aulas? | `relatorio.surpresas` — presença, data, trecho | S |
| **EN04** | A **distribuição de volume** planejada foi a executada? | `distribuicao-de-volume` (plano) × `duracao_min` por bloco (`funcional.duracao_min`) | C |
| **EN05** *(ex-P01)* | Que **objetivos** têm e não têm observação registrada? | marcos × rubrica × linha de base × lançamento; três estados explícitos | C |
| **EN06** *(ex-P02)* | Objetivos **por contexto** — matriz | marcos × itens do PO × contexto (não modelado) | V |
| **EN07** *(ex-T02)* | Em que **contextos** este elemento apareceu? | item do PO × sequência do plano × contexto (não modelado) | V |
| **EN08** *(ex-T04)* | Componentes **isolados** × **combinações** | `itens-por-dimensao` × `sequencia` × contexto (não modelado) | V |
| **EN09** *(ex-T05)* | **Intervenções docentes** e **respostas observadas** por ciclo | nada existe: `interven` = 0, `resposta observada` = 0 | V |

**Recusas da família.** EN01 não mede qualidade da aula — mede aderência declarada. EN02/EN03 não
classificam o ajuste como bom ou ruim. EN05 não diz que o objetivo foi alcançado: diz se há
observação, e de que tipo.

**Nota sobre EN09.** É a pergunta mais valiosa do ponto de vista do método — e a mais distante: os
dois conceitos não existem no modelo. Ela não se resolve com consulta; resolve-se com **vocabulário**
(L10) e com lugar de registro na captura.

---

### 4.4 OB — O instrumento de observação

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **OB01** | Quais colunas do PO foram **observáveis na sala** e quais concentraram **`nao_vi`**/vazio? | contagem por coluna × marca, sobre as aulas com registro | S |
| **OB02** | Qual a **distribuição** de marcas por coluna no ciclo (`ok/parcial/nao/nao_vi/vazio`)? | tabela coluna × marca | S |
| **OB03** | Quais colunas **nunca foram usadas** em nenhuma aula? | colunas do PO/captura com zero marca em todo o ciclo | S |
| **OB04** | Que colunas do PO **não têm correspondência** na folha de captura (ou vice-versa)? | PO × `captura-schema` por variante | S |
| **OB05** | A **régua da turma** foi usada? Em que níveis os critérios ficaram? | `rubrica` da turma × marca `rubrica` por critério × aula | S |
| **OB06** | Que observações se mostraram viáveis em **quais condições** (duração, presentes, `plano_seguido`)? | `nao_vi` × `condicoes_contorno` × `duracao_min` | C |
| **OB07** | O mesmo item, em **ciclos diferentes**, teve a mesma viabilidade? | série multi-ciclo por coluna | C |

**Recusas da família.** Nenhuma destas perguntas mede o professor. OB01–OB03 medem o
**instrumento**; a conclusão («esta coluna não serve») é da escola. OB06 não afirma causalidade —
mostra coocorrência.

**Por que esta família é a mais acionável.** Ela fecha o ciclo de melhoria do método: o PO é escrito,
usado, e então avaliado como instrumento. É a única família em que a resposta muda o **próximo** PO.

---

### 4.5 TR — Turma, sala e organização

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **TR01** | **Como esta turma foi organizada** (dias, duração, volume por bloco, sequência)? | `turma` (dias/horários/duração/período) + `estrutura-de-cada-aula` + `distribuicao-de-volume` | S |
| **TR02** | Que **mudanças de ritmo** a turma teve, e a partir de quando? | histórico de turma derivada (`substituidaPor`, vigência) | C |
| **TR03** | Quantas aulas foram **dadas, não dadas e lançadas** nesta turma? | `ciclos.json → aulas[].estado` | S |
| **TR04** | Qual a **taxa de presença** por aula e por turma? | `presentes`/`ausentes` ÷ alunas da turma | S |
| **TR05** | Quais **salas** foram usadas por esta turma, e em que aulas? | espaço × turma (depende da Tabela de atividades) | C |
| **TR06** | Que **eventos** ocuparam a sala e podem ter afetado a aula? | programação publicada × data da aula | C |
| **TR07** *(ex-P03)* | Distribuição entre o **nível atual** e o **nível seguinte** | objetivos do nível seguinte + currículo versionado — **não existem** | V |

**Recusas da família.** TR02 não diz se a mudança foi acertada. TR04 não avalia a aluna nem a
turma: mede presença. TR05/TR06 exigem a Tabela de atividades — são a única dependência cruzada
entre os dois planos.

---

### 4.6 PE — Permanência: entrada, tempo e última aparição

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **PE01** | Quando esta aluna **apareceu** pela primeira vez, em que turmas e ciclos, e até quando tem registro? | primeira e última aparição em `sujeitos`/curadoria e nos lançamentos; ciclos com registro | C |
| **PE02** | O que **mudou no registro** dela nos meses anteriores à última aparição? | série temporal: presença, marcas, ajustes, mudanças de turma | C |
| **PE04** | Quantas alunas **deixaram de ter registro** por ciclo/turma, e em que ponto do ciclo? | contagem agregada, **sem nome** | S |
| **PE05** | Que aulas ela **não frequentou** no período final do registro? | `ausentes` por aula | S |

> **`PE03` foi retirado** (18/10/2026) junto com a entidade `saida` — ver §6. O número **não** é
> reaproveitado: IDs de consulta são estáveis, e um id reusado com outro sentido é pior do que um
> buraco na sequência.

**Recusas da família.** PE02 **não** atribui causa. PE01 e PE04 falam de **última aparição
registrada**, nunca de «saída»: o sistema não sabe se a aluna saiu, se a escola parou de lançar ou se
ela mudou de professor — e essa diferença é uma das quatro ausências do §3. PE04 é agregado
justamente para não expor pessoas.

**A pergunta original — «por que ela saiu?» — não tem resposta no sistema, e isso é escopo, não
lacuna.** O que existe é o percurso registrado até a última aparição. A resposta é da escola; o
sistema entrega a base para que ela seja pensada com o registro à vista, em vez de com a memória de
quem estava lá.

---

### 4.7 PV — Proveniência e integridade

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **PV01** | Este **documento mudou**? Quando, e qual é o elo? | `.fipp` do ciclo/aula + `git log` | S |
| **PV02** | A **versão citada** numa resposta é a que está no ar? | `hash` do índice × `hash` do arquivo | S |
| **PV03** | Que **documentos compõem** este ciclo e qual a âncora de cada um? | índice por ciclo | S |
| **PV04** | **Quem** alterou e **quando**? | autor do commit; hoje não há autor por campo | S |
| **PV05** | O **plano foi reescrito** depois de a aula ser dada? | âncora da aula × data do lançamento | C |
| **PV06** | Esta resposta aponta para **qual versão do plano** e **qual aula**? | toda resposta carrega `plano_id`, `versao`, `aula`, `ancora` | C |

**Recusas da família.** PV04 responde «quem fez o commit», não «quem tomou a decisão» — o sistema
autentica um segredo por escola, não uma pessoa (C17). PV06 não é uma consulta: é um **requisito de
formato** de todas as respostas.

---

### 4.8 GE — Gestão e operação

| ID | Pergunta | Como se responde | Classe |
|:--|:--|:--|:--|
| **GE01** | Quantos **ciclos** a escola tem, ativos e encerrados? | índice de acervo | S |
| **GE02** | Que **professores, turmas e modalidades** estão ativos? | cadastro (KV) + índice | S |
| **GE03** | Qual a **carga semanal** por professor, turma e sala? | turma × horários × espaço | C |
| **GE04** | Que **documentos faltam** para o ciclo fechar (PO, harmonização, captura)? | validadores × índice | S |
| **GE05** | Que **escolas existem**, habilitadas, expurgadas? | acervo (só raiz) | S |
| **GE06** | Qual o **uso de IA** por escola e ciclo? | `ia-registro` — escrito e **nunca lido** (C7) | S |

**Recusas da família.** GE03 mede carga declarada, não horas trabalhadas. GE06 mede custo, não
qualidade de uso.

---

### 4.9 A grade — e como saber que o catálogo está completo

«Todas as perguntas possíveis» não se enumera: é um conjunto aberto. O que se pode fazer é
**demonstrar cobertura** sobre uma grade finita, e declarar o que sobra. É a diferença entre uma
lista (que sempre parece incompleta) e um **método** (que diz onde olhar e quando parar).

**Os dois eixos.** Toda pergunta deste catálogo tem um **sujeito** e uma **medida**. O recorte
(uma aula, um ciclo, vários anos) não é eixo: é modificador, e aparece na pergunta, não na célula.

| Sujeito ↓ · Medida → | contagem | distribuição | sequência | ausência | mudança | comparação | identificação |
|:--|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **aula** | 2 | 1 | 1 | · | 1 | · | 1 |
| **ciclo** | 1 | · | 1 | 3 | 1 | 2 | 1 |
| **turma** | 2 | 1 | · | · | 1 | · | 1 |
| **aluna** | 3 | 1 | 2 | 3 | 2 | 3 | 1 |
| **professor** | · | · | · | · | · | · | 1 |
| **escola** | 4 | 1 | · | 1 | · | · | 1 |
| **instrumento (PO)** | · | 4 | 1 | 1 | · | 4 | 1 |
| **espaço e programação** | · | · | 2 | · | · | · | 1 |
| **documento e âncora** | 1 | · | · | · | 3 | 2 | 1 |
| **Total** | **13** | **8** | **7** | **8** | **8** | **11** | **9** |

> **A coluna `identificação` foi acrescentada em 18/10/2026, e faltava.** Ela é a mais simples de
> todas — «**qual** é», «**quem** é», «**onde** está», «**de quem** é» — e as 55 perguntas firmadas
> **não fazem nenhuma pergunta desse tipo**: todas medem quanto, como varia, quando, o que falta, o que
> mudou, como compara. Sem esta coluna, a grade não tinha como expressar as perguntas de vínculo e de
> autoria, e foi por isso que a linha `professor` caiu para zero (§4.9.1, §4.9.2).
>
> **Ela está ocupada só por candidatas** (Anexo D): as nove de identificação ainda não são firmadas.
> Isso é o que separa «não há pergunta» de «ainda não escrevi a pergunta» — e é a diferença que
> destrava o índice de professor.

> **A linha `professor` tem uma única célula, e é `identificação`.** O professor **não é sujeito de
> medida** — não se conta, não se distribui, não se compara. Mas ele **é** sujeito de localização:
> «onde está», «quais turmas». Ver §4.9.2.

**Leitura da grade.** 9 × 7 = **63 células**. **38 estão ocupadas** — 29 pelas 55 perguntas firmadas,
9 só pelas candidatas de identificação. Sobram **25**:

| Veredicto | Células | O que significa |
|:--|--:|:--|
| **ocupada** | 38 | há pergunta firmada (29) ou candidata escrita (9) |
| **dívida** | 13 | a pergunta **pode** existir e não foi escrita — vira candidata (Anexo D) |
| **recusa** | 12 | a pergunta existe na cabeça de alguém, mas o sistema **não** a responde (§2, §9) |

**As doze recusas, por célula.** `professor ×` as **seis medidas de agregação** — `contagem`,
`distribuição`, `sequência`, `ausência`, `mudança`, `comparação` (mediria a pessoa — §4.9.1);
`turma × sequência` e `turma × ausência` (já cobertas por CT01/CT03, na linha do ciclo);
`aula × comparação` (aula contra aula não é decisão de ninguém); `instrumento × contagem` (o número de
colunas do PO não muda nada); `documento × distribuição` e `documento × ausência` (o acervo não é
amostra).

> **`professor × identificação` não é recusa.** Localizar não é avaliar: «onde está», «quais turmas»,
> «quem é o responsável desta turma» são perguntas de **vínculo**, e o vínculo é dado (§4.9.2).

**As treze dívidas, por sujeito.** `espaço` 5 (depende da Tabela de atividades), `escola` 3
(`GE07`, `GE08` e a comparação entre escolas), `aula` 1 (`CT07`), `ciclo` 1 (`CT09`), `turma` 1
(`TR08`), `instrumento` 1 (`OB08`), `documento` 1 (`PV07`). **Nove** têm candidata escrita no
Anexo D; **quatro** estão declaradas em espera (`espaço × distribuição`, `espaço × mudança`,
`espaço × comparação`, `escola × comparação`) — sem candidata porque ainda não há como escrevê-las
sem inventar o modelo do outro plano.

**Onde o catálogo é fino, e isso é achado.** A linha mais densa é **aluna** (7 de 7) — é onde o
projeto pensou. A mais vazia é **espaço** (2 de 7), porque depende do outro plano. E **professor** é
**1 de 7**, e a célula ocupada é justamente a de identificação (§4.9.2).

**A regra de saturação.** O catálogo está fechado quando **toda célula tem veredicto declarado** —
ocupada, dívida com candidata escrita, ou recusa com motivo. Não é quando «não há mais ideias»: é
quando não há célula silenciosa. Fechar a grade é o que destrava a distribuição (§5.1), e é o
trabalho que o dono do produto pediu: **elaborar as perguntas antes de reparti-las**.

### 4.9.1 O professor não é sujeito de **medida** — decisão de 18/10/2026

A grade mostrou a linha `professor` sem nenhuma célula ocupada, e a primeira leitura foi tratá-la
como omissão: propor uma nona família (**PR**, «prática declarada do professor») com três perguntas —
quantas aulas deu, quais estão dadas e não lançadas, o que mudou na prática dele entre ciclos.

**A decisão é não.** **Não vai existir família PR.** O professor **não é sujeito de medida** do
catálogo — o que **não** quer dizer que ele desapareça: como **vínculo, autoria e escopo** ele é dado
necessário, e o §4.9.2 trata disso.

**O motivo, e é o mesmo do §2.** Uma família cujo sujeito é a pessoa do professor tem uma única
trajetória possível: contar por professor, depois comparar professores, depois ordenar. As três
perguntas propostas eram inocentes — e nenhuma delas era o problema. O problema é o **eixo**: no dia
em que existe «perguntas por professor», existe a tabela de professores, e a recusa do §2 («quem é o
melhor professor? não existe») deixa de ser uma decisão de produto e passa a ser uma linha a menos
num relatório que o cliente pede.

**O que a recusa não custa.** `EN01`–`EN05` continuam a medir o **ensino** — a aula seguiu o plano, o
que foi ajustado, que objetivos têm observação. `OB01`–`OB07` continuam a medir o **instrumento**.
`AL09` continua a comparar o percurso da aluna com a turma. E as perguntas de **vínculo e autoria**
continuam todas a existir (§4.9.2): de quem é o plano, quem fez o PO, quem dá a aula, em que sala ele
está. O que não existe é a pergunta cujo sujeito é «este professor» **medido** — e é só a isso que a
fronteira se aplica.

**O que fica sem resposta, e é aceito.** O atraso de lançamento por professor (a antiga `PR02`) não
tem consulta. O `prazo` do ciclo continua a existir e a valer; o que não há é o ranking de quem
atrasa. Se a operação precisar disso um dia, é **relatório de gestão**, autenticado, sem plano
comercial e sem índice — não consulta do catálogo.

### 4.9.2 O professor como atributo — o que **não** é recusa

A decisão do §4.9.1 vale para **um** uso do professor: ele como **sujeito de uma medida de
agregação**. Fora desse uso, o professor é dado como qualquer outro — e o sistema **precisa** dele.
Sem isso não se responde «de quem é este plano», «quem observou esta aluna», «onde está a aula de
quinta».

**Quatro papéis, e só um é proibido.**

| Papel | Exemplo | Veredicto |
|:--|:--|:--|
| **Vínculo** — `professor` como atributo de outra entidade | «quem é o professor desta turma», «quais turmas ele tem», «em que sala ele está agora» | **permitido** — é localização e organização |
| **Autoria** — quem produziu um documento | «este PO foi feito por quem», «de quem é este plano de ensino» | **permitido** — a observação partiu do olhar de alguém, e isso é proveniência |
| **Escopo** — de quem é o acervo | «os ciclos deste professor», «filtrar por professor» | **permitido** — é o recorte de leitura, não uma medida sobre a pessoa |
| **Sujeito de agregação** — a pessoa como objeto da conta | «quem tem mais alunos exitosos», «quem está atrasado», «quantas aulas ele deu» | **recusado** (§4.9.1) |

**Por que a fronteira passa exatamente aí.** As três primeiras respondem «**quem**», «**onde**»,
«**de quem**» — e a resposta é um **nome ou um vínculo**, verificável, que não ordena ninguém. A
quarta responde «**quanto**» sobre uma pessoa, e quanto sobre pessoa, num sistema que a escola usa
para decidir, é nota com outro nome. É a mesma distinção do §2 entre **registrar** e **avaliar**,
agora aplicada ao professor.

**A consequência para o índice, e é grande.** `professor` é **faceta, vínculo e autoria** — e **não**
é eixo de agregação. Ou seja: existe filtro por professor, existe `vinculos[]` com vigência, existe
`autoria` em cada documento, e **não** existe `aulas_por_professor`. O
[PLANO-INDICES.md](./PLANO-INDICES.md) §4.11 declara isso como regra de geração, não como nota de
rodapé.

**As perguntas de vínculo que o catálogo passa a ter.** As nove de `identificação` (Anexo D) cobrem
exatamente o que o dono do produto pediu — e todas têm por sujeito **a outra entidade**, com o
professor como atributo:

| O que se quer saber | Pergunta | Sujeito |
|:--|:--|:--|
| Quem é o professor desta turma | `TR11` | turma |
| Quem é o professor desta aluna | `AL11` | aluna |
| Qual turma ocupa esta sala, e quando | `TR12` | espaço |
| Onde está este professor, em que sala | `TR13` | professor *(identificação)* |
| De quem é este ciclo, e qual plano ele adota | `CT10` | ciclo |
| Quem escreveu este PO, e qual versão assinou | `OB09` | instrumento |
| Quem produziu, revisou ou assinou este documento | `PV08` | documento |
| Quem deu esta aula, e quem a lançou | `PV09` | aula |
| Quais professores atuam nesta escola | `GE09` | escola |

**A pergunta da mudança de professor não precisa de ID novo.** «Esta turma teve sempre o mesmo
professor?» é `TR11` com `ate` preenchido na série de vínculos — a resposta é a **lista de vínculos
com vigência**, e a mudança aparece como duas linhas, não como medida de `mudança`. Isso evita
duplicar `TR02`, que já mede mudança **na turma**.

**Uma consequência que vale escrever.** Uma pergunta de `identificação` nunca tem `recusa` de
julgamento — a resposta é um fato. Mas tem as **quatro ausências** do §3: um ciclo sem professor
declarado é **não registrado**, não é «professor nenhum».

---

## 5. O que cada plano comercial entrega

### 5.1 O erro de partida: quantidade não é regra de negócio

**Correção de rota (18/10/2026).** A primeira versão deste documento propôs **6 / 15 / 55** e
escreveu a distribuição como se o número fosse a decisão. Não é. O número foi **bússola** — uma
forma de ver se havia caminho —, e a regra de negócio é outra: **o que cada plano dá poder de
fazer**.

Duas consequências, e as duas mudam este documento:

1. **A quantidade não se decide antes do catálogo.** «Quais 6 e quais 15» só tem resposta quando as
   perguntas existirem todas e tiverem sido lidas uma a uma. Com o catálogo em primeira passagem
   (§4.9), qualquer distribuição é chute com aparência de método.
2. **C5 deixa de bloquear.** Ela não é premissa de nada: é **consequência** do catálogo fechado. O
   que bloqueia é a grade do §4.9 saturar — não a distribuição.

### 5.2 «Todas» está decidido — a fotografia da data de vigência

> **Decisão (18/10/2026, dono do produto).** «Todas» significa **as perguntas disponíveis na data de
> vigência do contrato**. Contratado em 18/10/2026, o Avançado leva as perguntas que existem nesse
> dia. Pergunta que o produto ganhe depois **não entra**: fica para a renovação ou para o upgrade.

O que isso obriga:

| Obrigação | Consequência técnica |
|:--|:--|
| O catálogo tem **data** | `catalogo@AAAA-MM-DD`, versionado — uma sequência de fotografias, e a grade do §4.9 é o que se fotografa |
| O contrato guarda **qual fotografia** | `plano: { tier, catalogo: "2026-10-18" }` no registro de habilitação (L9) |
| O conjunto é **derivado**, não copiado | a lista de consultas de uma escola é `perguntas onde plano(catalogo@data) = tier` — nunca uma cópia à mão (L9 entrega c) |
| **Nenhum ID se retira** de contrato vigente | uma pergunta retirada (como `PE03`) vale só para fotografias novas; contrato antigo continua a responder, ou é substituído com aviso |

**O que a escola vê de novo.** Fica em aberto, e é decisão comercial pequena: quando surge uma
pergunta fora da fotografia contratada, a escola (a) não vê, (b) vê com a marca «disponível no
plano X», ou (c) vê parcialmente. A recomendação é **(b)** — é honesto, e é o único caminho de
upgrade que não depende de insistência comercial.

### 5.3 O critério: relevância é o escopo da decisão

Uma pergunta não vale pelo que ela mostra; vale pela **decisão que ela sustenta**. É isso que a
coloca num plano:

| Plano | A decisão que a resposta sustenta | Quem decide | Horizonte | Poder |
|:--|:--|:--|:--|:--|
| **Básico** | **a próxima aula** — o que dou, para quem, com que marco | o professor, sozinho | dias, dentro de um ciclo | **x** — saber e operar |
| **Intermediário** | **o ciclo e o instrumento** — o que ajusto, o que o PO não alcança | professor + direção | semanas, um ciclo | **x²** — cruzar e escolher |
| **Avançado** | **o programa** — currículo, continuidade, formação da equipe | a escola, o comitê | ano, vários ciclos | **x³** — decidir sobre o programa |

**A regra de colocação.** A pergunta pertence ao **menor** plano cuja decisão ela serve. Se a
resposta já é usada para dar a aula de amanhã, colocá-la no Avançado é vender menos do que o
produto entrega.

**A contra-regra.** Pergunta que só serve para **ordenar pessoas** não entra em plano nenhum — é a
fronteira do §2, e vale em x, x² e x³.

**O teste de três perguntas**, aplicado a cada item do catálogo:

1. **Que decisão muda** quando eu leio esta resposta?
2. **Quem** toma essa decisão — o professor, a direção, a escola?
3. **De quanto dado** ela precisa — uma aula, um ciclo, vários ciclos?

Se (1) não tiver resposta clara, a pergunta não é de produto: é curiosidade com consulta anexada.

### 5.4 Os três poderes

**x — saber o que aconteceu e o que vem agora.** Contagem e estado sobre um sujeito e um ciclo. É o
que faz o sistema substituir o caderno: «o que dou na quarta», «ela faltou», «esta aula foi lançada».

**x² — cruzar para escolher.** Dois ou mais conjuntos, dentro do ciclo: plano × lançamento,
instrumento × condição, aluna × turma. É o que transforma registro em leitura — e é o primeiro
poder que a escola não tinha antes do sistema.

**x³ — decidir sobre o programa.** Atravessar ciclos e anos, comparar instrumentos consigo mesmos,
sustentar decisão institucional: formar comitê, rever currículo, mudar o PO da escola, entender o
que aconteceu com quem tem registro até tal ponto.

> **Sobre o exemplo do «professor com mais alunos exitosos».** O *formato* da pergunta é x³ — a
> decisão por trás dela (quem conduz o comitê, quem vira coordenador) é institucional e legítima. O
> que o sistema **não** entrega é a tabela de professores: entrega `OB01` (o instrumento foi
> observável?), `EN01` (a aula seguiu o plano?) e `AL09` (o percurso se compara à turma?) — os
> insumos de uma conversa que a escola conduz. A decisão é da escola; a medida é do sistema. É a
> mesma fronteira do §2, agora aplicada a x³ — e é ela que faz o professor **não ser sujeito** de
> nenhuma consulta (§4.9.1).

### 5.5 O corte de exemplo — não é a decisão

O que segue é **ilustração de forma**: como a grade do §4.9 se distribui se aplicada ao catálogo de
hoje. Serve para ver o desenho dos três poderes; **não** é a distribuição aprovada — essa é
recalculada quando a grade saturar, e não herdada deste exemplo.

**Básico (6).** O que qualquer escola precisa no primeiro dia de uso:

| ID | Pergunta |
|:--|:--|
| **CT01** | Qual é a próxima aula, quando, com que marco e até quando se lança? |
| **CT02** | O que já foi dado, lançado e não dado neste ciclo? |
| **AL01** | O que já foi trabalhado com esta aluna? |
| **AL02** | Em que aulas ela esteve e em que faltou? |
| **TR01** | Como esta turma foi organizada (dias, duração, volume, sequência)? |
| **PV01** | Este documento mudou? Quando, e qual é o elo? |

**Intermediário (15 = as 6 + 9).** O percurso dentro do ciclo e o instrumento:

| ID | Pergunta |
|:--|:--|
| **CT03** | Que marcos do plano ainda não foram trabalhados? |
| **AL03** | Onde `parcial`/`nao` se repete para esta aluna? |
| **AL04** | Onde `ok` se repete, e qual a distribuição da turma na mesma coluna? |
| **AL08** | Em que proporção há `nao_vi` ou vazio para esta aluna? |
| **EN01** | A aula seguiu o plano declarado? |
| **EN02** | O que o professor ajustou em tempo real, e em que aulas? |
| **EN04** | A distribuição de volume planejada foi a executada? |
| **EN05** | Que objetivos têm e não têm observação registrada? |
| **OB01** | Quais colunas do PO foram observáveis, e quais concentraram `nao_vi`? |

**Avançado (55, todas).** As 40 restantes, por família:

| Família | Perguntas que entram |
|:--|:--|
| CT | CT04, CT05, CT06 |
| AL | AL05, AL06, AL07, AL09, AL10 |
| EN | EN03, EN06, EN07, EN08, EN09 |
| OB | OB02, OB03, OB04, OB05, OB06, OB07 |
| TR | TR02, TR03, TR04, TR05, TR06, TR07 |
| PE | PE01, PE02, PE04, PE05 |
| PV | PV02, PV03, PV04, PV05, PV06 |
| GE | GE01, GE02, GE03, GE04, GE05, GE06 |

> **Por que o Básico tem seis e não três.** Com três, a escola recebe «o que dou agora», «o que já
> foi dado» e «o que aconteceu com esta aluna» — mas não consegue responder «ela faltou?» nem
> «como a turma está organizada», que são perguntas de operação, não de análise. Seis é o menor
> conjunto que faz o produto funcionar sem prometer análise que o plano não vende.

### 5.6 O que a distribuição **não** pode fazer

| Não pode | Por quê |
|:--|:--|
| Ser vendida por **número** («10 consultas») em vez de por **poder** | número convida a comparar catálogos e a inflar perguntas irrelevantes só para engordar o plano |
| Esconder o **registro** de quem está no Básico | «o plano não reduz o dado» — a escola exporta e lê o que produziu |
| Vender a **mesma consulta** com nome diferente por plano | o catálogo é único; o plano muda o **conjunto**, não a definição |
| Limitar **quantas vezes** se consulta o próprio acervo | o custo é do índice, não da consulta; cota é de **IA**, não de leitura (L7) |
| Usar a consulta para **decidir** sobre a aluna | a fronteira do §2 |
| **Congelar** a fotografia sem dizer qual é | congelar é a regra (§5.2) — o que não pode é o contrato não nomear a data que congelou |

### 5.7 O que muda em relação ao texto 2 (3 / 7 / todas)

O texto 2 não errou os números: errou a **unidade**. Ele distribuiu **quantidade de perguntas** sobre
um catálogo de oito que ainda não existia. A unidade correta é o **poder** (§5.4), e a quantidade cai
fora da decisão:

| Texto 2 | Este documento | Por quê |
|:--|:--|:--|
| «3 no Básico» | **o que sustenta a próxima aula** (hoje, 6 perguntas) | o conjunto é derivado do critério do §5.3, não do número |
| «7 no Intermediário» | **o que sustenta o ciclo e o instrumento** (hoje, 15) | idem |
| «todas no Avançado» | **as disponíveis na data de vigência** (§5.2) | «todas» passou a ter definição verificável |

Os números do texto 2 continuam citáveis como **ordem de grandeza** — e é só isso que eles são.

---

## 6. O que falta no modelo (o que o catálogo revela)

| Falta | Perguntas afetadas | Frente |
|:--|:--|:--|
| **ID estável e pseudônimo da aluna** | AL01–AL10, PE01–PE05 | **L2** |
| **Leitor do lançamento** (hoje o `-dados.json` não tem rota) | AL03–AL08, EN01–EN05, OB01–OB07 | **L3** |
| **Versão explícita do plano** | CT06, PV05, PV06 | **L5** (C3 decidida) |
| **Contexto** (isolado × combinação) | EN06–EN08, TR07 | **L10** |
| **Intervenção docente e resposta observada** | EN09 | **L10** |
| **Currículo versionado e objetivos do nível seguinte** | TR07 | **L10 + currículo** |
| **Espaço físico e programação** | TR05, TR06, GE03 | [PLANO-TABELA-DE-ATIVIDADES.md](./PLANO-TABELA-DE-ATIVIDADES.md) |
| **Leitor do `ia-registro`** | GE06 | **L7** |

**Fora de escopo declarado (18/10/2026).** Duas entidades que a primeira versão deste catálogo
propôs **não entram** no sistema:

| Descartado | Por quê | Consequência |
|:--|:--|:--|
| **`resultado-externo`** (banca, exame, data, nível, resultado) | o exame é de outra instituição; o Sistema Lastro registra o cotidiano da aula e não certifica resultado de terceiro | a família **EX** (4 perguntas) sai do catálogo; «por que não passou» permanece como **recusa** (§9) |
| **`saida`** (data, motivo declarado) | o motivo da saída é declaração sensível sobre a família, e o sistema não é ferramenta de retenção | **PE03** sai; PE01 e PE04 falam de **última aparição registrada**, nunca de «saída» |

O exemplo do RAD que originou a família EX era **ilustração**, não requisito: mostra o tipo de
pergunta que uma escola faz, e a resposta do sistema a ela é «o que o registro dela mostra, lado a
lado com as colegas, nas colunas que o PO cobre» — sem o resultado do exame, que ele não tem.

Com isso, **nenhuma entidade nova** é exigida por este catálogo. Tudo o que as 55 perguntas pedem
ou já existe no modelo, ou é frente declarada na tabela acima (L2, L3, L5, L7, L10, o currículo e a
Tabela de atividades).

---

## 7. O que o índice precisa de guardar (handoff)

O índice não responde às perguntas; ele as torna **baratas**. Para este catálogo, o
[PLANO-INDICES.md](./PLANO-INDICES.md) precisa de acrescentar:

| Necessidade | Faceta/entrada | Serve a |
|:--|:--|:--|
| Aulas com data, horário, marco, estado, prazo, âncora | `aulas[]` do índice por ciclo (vindo de `ciclos.json`) | CT01–CT04, TR03, PV05 |
| Aluna com ID pseudônimo estável | `aluna:<slug>` e `alunas[]` no índice vivo | AL01–AL10, PE01–PE05 |
| Presença por aula × aluna | `presenca[]` (presente/ausente) | AL02, PE05, TR04 |
| Contagem de marcas por coluna × aluna × aula | `marcas[]` agregadas | AL03, AL04, AL08, OB01–OB03 |
| Condições de contorno por aula | `condicoes[]` | EN01, OB06 |
| Ajuste/surpresa: **presença e data**, nunca o texto | `ajustes[]`, `surpresas[]` | EN02, EN03, AL07 |
| Nível da rubrica por critério | `rubrica[]` | OB05, EN05 |
| Mudança de turma e curadoria | `turmas[]` com vigência e `substituidaPor` | AL10, TR02 |
| Sequência de ciclos | `ciclos[]` ordenados + `sucessor` | CT05, CT06 |
| Espaço e programação | `espacos[]`, `eventos[]`, retrato publicado | TR05, TR06, GE03 |

**O que o índice NÃO guarda**, e é decisão: o **texto** de `ajustes`, `surpresas` e `relatorio`. O
índice guarda **que houve**, **quando** e **em que aula**; o texto é lido do original autenticado.
Copiar a prosa para o índice criaria uma segunda fonte de conteúdo pedagógico — e o risco de vazar
nome de aluna num arquivo de metadados.

**E o que ele deixou de guardar** (18/10/2026): as listas `saidas[]` e `resultados-externos[]`, que
a primeira versão previa. Sem as entidades do §6, não há o que indexar — e um índice com uma chave
que nenhuma consulta lê é dívida.

---

## 8. Como uma consulta é implementada (e o que ela devolve)

### 8.1 O contrato de saída

Toda resposta obedece a este formato — sem exceção:

```json
{
  "pergunta": "AL03",
  "titulo": "Onde «parcial»/«nao» se repete para esta aluna",
  "sujeito": { "tipo": "aluna", "id": "aluna:vava", "nome": "Vavá" },
  "recorte": { "escola": "fita", "ciclo": "01", "de": "2026-10-06", "ate": "2026-12-15" },
  "medida": {
    "tipo": "contagem-por-coluna",
    "valores": [
      { "coluna": "eixo_vertical", "bloco": "eixo_peso", "parcial": 3, "nao": 1, "aulas": ["2026-10-16", "2026-10-22", "2026-11-05", "2026-11-12"] }
    ]
  },
  "ausencias": { "nao_observado": 2, "aula_nao_dada": 0, "nao_registrado": 1 },
  "prova": {
    "fonte": "professores/tiago-menegaz/ciclos/ciclo-01-fita-dados.json",
    "aulas": ["01", "02", "04", "06"],
    "ancora": { "id": "ciclo-01-fita", "hash": "ef5ee2…" }
  },
  "recusa": "não afirma necessidade de ajuda; mostra recorrência de marca"
}
```

- **`medida`** é sempre mecânica: contagem, distribuição, sequência, ausência ou mudança.
- **`ausencias`** é obrigatório e tem as quatro categorias do §3.
- **`prova`** é obrigatória: sem ela, a resposta não é proveniência.
- **`recusa`** é obrigatória: é o que impede a leitura avaliativa.

### 8.2 O que a interface mostra

1. a **pergunta**, na redação do catálogo — não uma paráfrase que prometa mais;
2. a **medida**, em tabela ou série;
3. as **ausências**, separadas;
4. o **caminho** («abrir a aula 04 no caderno», «abrir o PO na âncora»);
5. a **recusa**, em uma linha, no rodapé do resultado.

> A recusa visível é o que separa este produto de um boletim. Sem ela, o número vira veredito.

---

## 9. Recusas — as perguntas que o sistema não responde

| Pergunta | Por que não | O que oferece em vez disso |
|:--|:--|:--|
| «Esta aluna aprendeu?» | aprendizagem exige critério externo e juízo | o que foi observado, quando, e o que não foi (AL06, AL08) |
| «Quem é a melhor aluna?» | ranking por mérito | distribuição e recorrência (AL04, AL09) |
| «Quem é o melhor professor?» | juízo sobre pessoa | viabilidade do instrumento (OB01–OB07) e aderência declarada (EN01) |
| «Por que ela saiu?» | causa não é dado, e a saída não é registrada | percurso até a última aparição (PE02); se a escola quiser explicar, a explicação é dela |
| «Por que não passou no exame?» | a decisão é da banca, e o exame não está no sistema | o registro dela lado a lado com as colegas, nas colunas cobertas (AL04, OB02) |
| «Que nota dar?» | o sistema não avalia | a régua da escola e o que foi registrado (OB05) |
| «Qual o próximo ciclo?» | é decisão pedagógica | o que existe, o que foi herdado e o que ficou pendente (CT04, CT05) |

---

## 10. Riscos

| Risco | Mitigação |
|:--|:--|
| O catálogo virar **boletim** | a `recusa` é campo obrigatório da resposta (§8.1) e aparece na tela (§8.2) |
| **Ranking** por agregação indevida | AL09 devolve distribuição, nunca ordem; teste que reprova resposta ordenada por taxa |
| **Comparação entre escolas** expor dado de menores | consultas entre escolas só agregadas e sem sujeito; o índice de acervo é protegido pela raiz |
| **Ausência** lida como zero | `ausencias` obrigatório com as quatro categorias; teste que falha se `nao_vi` for somado a `nao` |
| O índice copiar **prosa** e vazar nome | só presença/data de ajustes e surpresas; verificação de privacidade no `check-indices` |
| **Causalidade** inferida pela interface | nenhuma resposta usa «porque»; o texto é «em que aulas», «com que recorrência» |
| Cota de plano **reduzir o dado** | L9: descer de plano restringe consulta, nunca apaga registro |
| Catálogo crescer sem **ID estável de consulta** | IDs por família (CT, AL, …) e fotografia datada na contratação (§5.2) |
| «Saída» inferida da última aparição lida como fato | PE01/PE04 dizem «sem registro posterior»; a interface nunca escreve «saiu» |
| **Catálogo incompleto vendido como completo** | a grade (§4.9) declara as células sem veredicto; a distribuição só fecha quando nenhuma célula é silenciosa |
| **Número virar promessa** («10 consultas») | a venda é por poder (§5.4), não por contagem (§5.6) |
| A pergunta de **vínculo** virar medida de pessoa | `TR11`/`TR13`/`PV08` devolvem **nome ou vínculo**, nunca contagem por professor; verificação 13 do `check-indices` reprova agregação por professor (§4.11 do plano de índices) |
| **Vínculo sem vigência** responder com o responsável de hoje sobre um fato de março | `vinculos[]` com `de` obrigatório e `ate` nulo enquanto vigente; `TR11` devolve a **série**, não o estado atual |
| **Autoria inferida** do `git log` | `autor` declarado e `commitado_por` são campos distintos; `PV08` mostra os dois e não confunde um com o outro |

---

## 11. Decisões em aberto (e o que bloqueia de fato)

**Nem toda decisão em aberto bloqueia.** A lista abaixo separa as três coisas que estavam misturadas:
o que já está decidido, o que não bloqueia nada, e o que **impede** a próxima etapa.

### 11.1 O que já está decidido (18/10/2026)

| Decisão | Conteúdo |
|:--|:--|
| **C5a — «todas»** | as perguntas **disponíveis na data de vigência** do contrato; o que vier depois fica para renovação ou upgrade (§5.2) |
| **A unidade da repartição** | é o **poder** (x · x² · x³), não a quantidade de consultas (§5.3, §5.4) |
| **Exame externo e motivo de saída** | **fora de escopo** — não são entidades do sistema (§6) |
| **O professor não é sujeito de medida** | **não existe família PR** (`PR01`–`PR03` recusadas). Contar, distribuir ou comparar por professor é recusa (§4.9.1) |
| **O professor é vínculo, autoria e escopo** | filtro por professor, `vinculos[]` com vigência, `autoria` por documento — e as nove perguntas de `identificação` que disto dependem (§4.9.2, Anexo D.1) |
| **As três reformulações** | AL03, AL04 e OB01 são a redação do catálogo; «precisa de ajuda», «se destaca» e «professor de êxito» permanecem como recusa (§2) |

### 11.2 O que não bloqueia, e não pode ser respondido agora

1. **C5b — a repartição por plano.** Depende do catálogo fechado (§4.9). Escrever «quais 6 e quais
   15» antes disso é decidir por número o que é decisão por relevância (§5.3).
   **Ordem correta: fechar a grade → ler as perguntas uma a uma → a distribuição cai.** Não é
   bloqueio: é sequência.
   - **Decisão pequena que sobra:** quando surgir pergunta fora da fotografia, a escola não vê,
     vê com a marca «disponível no plano X», ou vê parcialmente? (recomendação: **vê**, §5.2)

### 11.3 O que bloqueia de fato

1. **O texto de ajustes/surpresas é consultável?** (EN02, EN03). O índice guarda presença e data; o
   texto exige autenticação — confirmar que a leitura autenticada basta.
2. **Currículo versionado e objetivos do nível seguinte** (TR07). Sem eles, não há como medir a
   distribuição entre nível atual e seguinte.
3. **Comparação entre escolas** entra no Avançado? Se sim, agregada e sem sujeito — confirmar.
4. **A aluna tem ID pseudônimo estável?** (L2). Sem isso, AL01–AL10 não cruzam ciclos. O apelido
   pode mudar; o ID não.
5. **`aluna` no índice vivo**: o índice da Produção pode listar apelidos, mas o índice de acervo
   (servido pela raiz) **não**. Confirmar o recorte.

### 11.4 O que bloqueia a **grade**, não este documento

1. **A leitura da grade (§4.9).** Duas decisões ainda mudam veredicto:
   - `escola × comparação` depende de **comparação entre escolas** entrar ou não (hoje é o item 3);
   - `espaço × 5 células` depende da Tabela de atividades, e não deste catálogo.

A terceira fechou em 18/10/2026: **`professor × 6 medidas de agregação` é recusa**, por decisão —
não há família PR (§4.9.1). A sétima coluna, `identificação`, está ocupada por candidatas em todas as
linhas (§4.9.2, Anexo D.1). Restam **13 dívidas e 12 recusas** — número honesto, não número final.

---

## Anexo A — Cruzamento com o catálogo anterior (T01–T05, P01–P03)

| ID antigo | Pergunta antiga | ID novo | Mudança |
|:--|:--|:--|:--|
| T01 | O que já foi trabalhado com esta aluna? | **AL01** | sem mudança de conteúdo; entra no Básico |
| T02 | Em que contextos este elemento apareceu? | **EN07** | mantém [V] |
| T03 | Como as observações se distribuíram no tempo? | **AL06** | mantém [C] |
| T04 | Componentes isolados × combinações | **EN08** | mantém [V] |
| T05 | Intervenções docentes e respostas observadas | **EN09** | mantém [V] |
| P01 | Objetivos com e sem observação | **EN05** | mantém [C]; entra no Intermediário |
| P02 | Objetivos por contexto — matriz | **EN06** | mantém [V] |
| P03 | Nível atual × próximo nível | **TR07** | mantém [V + currículo] |

Os IDs antigos **continuam válidos** e citáveis: este anexo é a ponte, não a substituição. Onde o
planejamento diz «T01», este plano diz «AL01 (ex-T01)».

## Anexo B — As 55 perguntas firmadas, por família e por plano

Contagem **por entrada** (§5.5 é cumulativo: as do Básico também valem no Intermediário e no
Avançado):

| Família | Perguntas | Básico (novas) | Intermediário (novas) | Avançado |
|:--|--:|--:|--:|--:|
| CT — continuidade | 6 | 2 | 1 | 3 |
| AL — percurso da aluna | 10 | 2 | 3 | 5 |
| EN — ensino | 9 | 0 | 4 | 5 |
| OB — instrumento | 7 | 0 | 1 | 6 |
| TR — turma e organização | 7 | 1 | 0 | 6 |
| PE — permanência | 4 | 0 | 0 | 4 |
| PV — proveniência | 6 | 1 | 0 | 5 |
| GE — gestão | 6 | 0 | 0 | 6 |
| **Total** | **55** | **6** | **9** | **40** |

**Conferência.** 6 + 9 + 40 = **55**. A soma por família fecha: CT 2+1+3 = 6, AL 2+3+5 = 10,
EN 0+4+5 = 9, OB 0+1+6 = 7, TR 1+0+6 = 7, PE 4, PV 1+0+5 = 6, GE 6.

**O que saiu, e desde quando.** A família **EX** (4 perguntas) e **PE03** foram retiradas em
18/10/2026, com as entidades `resultado-externo` e `saida` (§6). O catálogo tinha 60; tem 55. Os
números de versões anteriores não se somam a estes.

## Anexo C — Exemplo de resposta auditável (PE02)

```json
{
  "pergunta": "PE02",
  "titulo": "O que mudou no registro desta aluna nos meses anteriores à saída",
  "sujeito": { "tipo": "aluna", "id": "aluna:vava", "nome": "Vavá" },
  "recorte": { "escola": "fita", "de": "2026-04-01", "ate": "2026-10-01" },
  "medida": {
    "tipo": "serie-temporal",
    "valores": [
      { "ciclo": "01", "aulas_presentes": 11, "aulas_ausentes": 1, "parcial": 4, "ok": 9 },
      { "ciclo": "02", "aulas_presentes": 7, "aulas_ausentes": 5, "parcial": 9, "ok": 3 },
      { "ciclo": "03", "aulas_presentes": 2, "aulas_ausentes": 6, "parcial": 2, "ok": 0 }
    ],
    "mudancas_declaradas": [
      { "data": "2026-07-14", "tipo": "turma", "de": "Balé Nível 1", "para": "Balé Nível 1", "motivo": "mudança de horário" }
    ]
  },
  "ausencias": { "nao_observado": 6, "aula_nao_dada": 2, "nao_registrado": 3 },
  "prova": {
    "fontes": ["ciclo-01-fita-dados.json", "ciclo-02-fita-dados.json", "ciclo-03-fita-dados.json"],
    "ancoras": ["ancora:ciclo-01-fita", "ancora:ciclo-02-fita", "ancora:ciclo-03-fita"]
  },
  "recusa": "não afirma causa da saída; mostra o que mudou no registro e o que foi declarado"
}
```

Esta resposta ilustra as três regras: a **medida** é mecânica, as **ausências** são separadas, e a
**recusa** impede que o gráfico vire explicação.

## Anexo D — As candidatas que a grade revelou

Estas perguntas **não estão na contagem das 55** e não têm plano atribuído. Status: `proposta`.
Existem porque o §4.9 mostrou células vazias por **dívida**, e não por recusa. Cada uma passa pelo
teste do §5.3 antes de ser firmada — e nenhuma entra no produto sem a `recusa` escrita.

| ID | Célula | Pergunta proposta | Classe | Nota |
|:--|:--|:--|:--|:--|
| **CT07** | aula × ausência | Quais aulas do ciclo **não foram dadas**, e qual o motivo declarado? | S | hoje só existe na granularidade do ciclo (CT02) |
| **CT09** | ciclo × distribuição | Como as aulas do ciclo se **distribuem** por estado e por mês? | S | leitura de calendário, não de conteúdo |
| **TR08** | turma × comparação | Como **duas turmas do mesmo nível** se organizaram de forma diferente (dias, duração, volume)? | C | compara **organização**, nunca resultado |
| **TR09** | espaço × contagem | Quantas **horas-aula** cada sala recebeu no período? | C | depende da Tabela de atividades |
| **TR10** | espaço × ausência | Quando a sala ficou **ociosa** no período letivo? | C | depende da Tabela de atividades |
| **GE07** | escola × sequência | Qual a **linha do tempo** da escola: ciclos, entradas e saídas de professor, mudanças de PO? | C | é o índice de acervo virando narrativa |
| **GE08** | escola × mudança | O que **mudou na escola** entre dois anos (professores, turmas, modalidades, PO)? | C | compara estrutura, não desempenho |
| **OB08** | instrumento × mudança | O **PO mudou** entre ciclos? Que colunas entraram, saíram ou mudaram de nome? | S | fecha o ciclo de melhoria do método |
| **PV07** | documento × sequência | Em que **ordem** os documentos de um ciclo foram criados, e por quem? | S | hoje PV03 diz a composição, não a ordem |

**As treze dívidas originais** (sem contar `identificação`) continuam como estavam: nove com
candidata nesta tabela, quatro em espera. As nove de `identificação` são **acréscimo**, e não
substituem nenhuma.

**As quatro dívidas que ficam em espera, sem candidata.** `espaço × distribuição`,
`espaço × mudança`, `espaço × comparação` e `escola × comparação`. As três de `espaço` dependem da
Tabela de atividades ([PLANO-TABELA-DE-ATIVIDADES.md](./PLANO-TABELA-DE-ATIVIDADES.md)) — escrevê-las
agora seria inventar o modelo do outro plano. `escola × comparação` depende da decisão §11.3/3.

**As nove candidatas cobrem nove células** — uma cada: `CT07`→aula×ausência, `CT09`→ciclo×distribuição,
`TR08`→turma×comparação, `TR09`→espaço×contagem, `TR10`→espaço×ausência, `GE07`→escola×sequência,
`GE08`→escola×mudança, `OB08`→instrumento×mudança, `PV07`→documento×sequência. Nove + quatro = 13,
que é o total de dívidas do §4.9.

### D.1 As nove de `identificação` — vínculo, autoria e localização

Estas nasceram do §4.9.2 e ocupam a coluna que faltava na grade. Todas têm por sujeito **a outra
entidade**; o professor entra como **atributo**. Nenhuma conta, distribui ou compara pessoas.

| ID | Célula | Pergunta proposta | Classe | Nota |
|:--|:--|:--|:--|:--|
| **TR11** | turma × identificação | Qual é o **professor responsável** desta turma, e desde quando? | S | `turma.professor` + `vinculos[]` com vigência |
| **AL11** | aluna × identificação | Quem é o **professor desta aluna** agora, e em que turmas ela está? | S | derivado de `alunas[].turmas` × `turma.professor` |
| **TR12** | espaço × identificação | **Qual turma ocupa** esta sala em cada horário, e com que professor? | C | depende da Tabela de atividades |
| **TR13** | professor × identificação | **Onde está** este professor: que turmas, salas e horários? | C | única pergunta cujo sujeito é o professor — e é localização |
| **CT10** | ciclo × identificação | De **quem é este ciclo**, e qual plano de ensino ele adota? | S | `ciclo.professor` + autoria do plano |
| **OB09** | instrumento × identificação | **Quem escreveu** este PO, e qual versão assinou? | S | `autoria` do documento + versão (L5) |
| **PV08** | documento × identificação | **Quem produziu, revisou ou assinou** este documento? | S | `git log` para produção; campo declarado para revisão |
| **PV09** | aula × identificação | **Quem deu** esta aula, e **quem a lançou**? | S | autoria do registro ≠ autoria da aula |
| **GE09** | escola × identificação | Que **professores atuam** nesta escola, com que turmas e modalidades? | S | diretório; hoje sai do cadastro do KV |

**`PV09` separa duas autorias que hoje se confundem.** Quem **deu** a aula e quem **lançou** o
registro podem ser pessoas diferentes (substituto que deu, titular que lançou — ou o contrário). O
sistema precisa das duas, e a diferença é justamente o que dá valor à proveniência: o registro diz
quem viu, não só quem digitou.

**`TR13` é a única com o professor como sujeito**, e isso é coerente: ela não mede nada sobre ele —
devolve onde ele está. Se um dia essa pergunta virar «quanto ele trabalha», ela sai do catálogo e vira
relatório de gestão, como as recusadas de D.2.

### D.2 O que foi recusado, e não volta

**A família PR — prática declarada do professor.** Três perguntas foram propostas e **recusadas** em
18/10/2026 (§4.9.1):

| Recusada | O que era | Por que não |
|:--|:--|:--|
| ~~PR01~~ | Quantas aulas este professor **deu**, por ciclo e por turma | contagem por professor é o primeiro passo da tabela de professores |
| ~~PR02~~ | Que aulas estão **dadas e não lançadas**, por professor | idem: mede a pessoa, não a aula |
| ~~PR03~~ | O que mudou na **prática declarada** dele entre ciclos | idem |

> **Nota de leitura.** O que foi recusado é a **contagem por pessoa**, não o professor. `TR13`,
> `CT10`, `OB09`, `PV08`, `PV09` e `GE09` usam o professor como atributo e **são legítimas**
> (§4.9.2). A diferença entre elas e `PR01`–`PR03` é o sujeito da frase: lá, «**quantas aulas este
> professor deu**»; aqui, «**de quem é este plano**».

Os IDs `PR01`–`PR03` **não são reaproveitados**, pela mesma regra de `PE03`: um ID com dois sentidos é
pior que um buraco na sequência. Se a operação precisar de controle de atraso de lançamento, ele é
**relatório de gestão** — autenticado, sem plano comercial e sem índice —, não consulta do catálogo.

**A possibilidade que fica de fora, e fica registrada.** O professor que dá aula em mais de uma
escola e quer construir um **portfólio** — mostrar como ensina, que desafios enfrentou, que soluções
encontrou, para levar a outra escola. Não entra: é funcionalidade nova, muda o sujeito do produto (de
ferramenta da escola para ferramenta do professor) e merece plano próprio. Fica registrada como ideia,
não como dívida da grade.

## Anexo E — Vocabulário de estado de cada pergunta

| Estado | Significa | Conta na distribuição? |
|:--|:--|:--|
| `firmada` | passou pela fronteira do §2, tem recusa escrita e célula na grade | **sim** |
| `proposta` | veio de uma dívida da grade; ainda não passou pelo teste do §5.3 | não |
| `retirada` | saiu por decisão (PE03, família EX) — o ID não é reaproveitado | não |
| `recusada` | foi proposta e **recusada por fronteira** (`PR01`–`PR03`) — o ID também não se reaproveita | não |
| `bloqueada` | existe, mas depende de frente não construída (L2, L10, Tabela) | sim, com nota |

Hoje: **55 firmadas · 18 propostas · 5 retiradas · 3 recusadas**. Das 55 firmadas, **12** dependem de
frente não construída (EN06–EN09 → L10; TR05–TR06 → Tabela de atividades; TR07 → currículo
versionado; GE06 → leitor do `ia-registro`) e **14** só cruzam ciclos com `aluna:<slug>`
(AL01–AL10, PE01, PE02, PE04, PE05) — dentro de um ciclo, o apelido basta.

