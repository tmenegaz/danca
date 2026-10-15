# Arquitetura — a integração PO ⇄ PE

> **Resumo (para o HANDOFF):** Especificação da arquitetura de integração entre o repositório
> atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE),
> utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.

> **Estado:** Especificação de arquitetura (sem alteração de código ou arquivos congelados).

> **Escopo:** Regras pétreas, separação estrita PE × PO, mecanismo de descoberta física em
> diretórios distintos, fluxo, espelhamento de caminhos e classificação prosa/chave-valor.

> **Leia antes de citar.** Este documento é do **Projeto Ciclo** — a memória da aula dada,
> **protótipo testado no universo da dança** (não é agnóstico: o projeto agnóstico será criado
> a partir dele). O **FIPP não é implementado aqui**: a proveniência deste repositório é a
> **âncora encadeada** (`tools/hash-ciclo.sh` → `.fipp`), uma **aproximação** do framework.
> O PE descrito abaixo **não roda neste repositório**, e a sua especificação de origem está no
> acervo do **projeto de mestrado** — que vive em outro diretório e **não** é documentação
> deste projeto. Onde este documento disser "o PE de origem", entenda-se essa fonte externa;
> onde disser "o PE", entenda-se o **módulo** que este documento desenha, no repositório
> separado. Nada aqui altera código: é desenho, e o que ele toca está declarado na §7.

## 1. As regras pétreas e as restrições da integração

Este documento **não** reescreve as regras do projeto: ele as **indexa**, e diz o que delas
restringe a integração. As fontes são `PROTOCOLO.md` (22 pétreas), `REGRAS.md` (17 regras + 5
pré-requisitos) e `CONGELAMENTO.md` (o que está congelado e como se altera). Quem for
implementar a integração lê esta seção primeiro.

### 1.1 As leis que não se negociam

| Lei | Onde está | O que ela proíbe na integração |
|:--|:--|:--|
| **A proveniência acrescenta, não edita** | P-03, P-04 | Reescrever um artefato elicitado para "encaixá-lo" no PE. Um ajuste é elo novo, com âncora nova |
| **FIPP alinha; Git ramifica** | P-03 | Fundir os dois repositórios num só histórico. "Não há ramificação — há acúmulo": o elo é o `parentHash`, e o passado **se incorpora**, não se reescreve |
| **Material não é evidência** | P-05, P-06, P-07 | O PE produzir classificação, análise ou achado. O que sai dele é **material bruto** |
| **Os campos do ciclo são declarados em schema** | P-08 | O PE impor campos de domínio. Quem manda nos campos é o PO, não o schema |
| **O PO declara a linha de base dos sujeitos** | P-10, P-11 | O PE **definir** a linha de base. Ele pode hospedar o recipiente; o conteúdo é do PO |
| **Apelidos estáveis** | P-12 | Nome completo, contato, dado de saúde ou acompanhamento em claro cruzando a fronteira |
| **Cada professor tem o seu próprio PO** | P-13 | Um PE compartilhado "da escola" reescrevendo o recorte de cada professor |
| **O PO pode derivar de um PO de departamento** | P-14 | Tratar o PO de departamento como obrigatório. Ele é **opcional**, e só existe onde a escola o declara |
| **Metodologia e notação são declaradas na Elicitação** | P-16 | O PE decidir o método. A elicitação pergunta **qual** é o método (RAD, Vaganova, …), **qual** a notação e **quem** o define — e o ciclo só gera os artefatos que a resposta sustenta |
| **Mesmos tipos de artefato do ciclo piloto** | P-17 | Um ciclo novo produzir menos artefatos porque a integração está ausente |
| **Os prompts vivem no repositório** | P-19 | O PE guardar o prompt de Elicitação. O prompt é **conteúdo do PO**, versionado em `prompts/` |
| **Linguagem harmonizada no publicado** | P-21 | Publicar, pela via do PE, o material bruto em linguagem original |
| **Restrições físicas são declaradas, registradas e comunicadas** | P-22 | O PE avaliar ou inferir restrição física. Lesão, dor e limitação médica entram **na linha de base por sujeito**, declaradas pelo professor; ele **registra**, não avalia |
| **Terminologia RAD, fio condutor, causa e consequência** | Regras 1, 2, 7, 11 | O PE gerar prosa pedagógica. Ele não escreve aula |
| **Proveniência objetiva** | Regra 8 | Afirmação sem origem declarada. O que não tem fonte fica `[conferir]` |
| **Duração e contexto institucional** | Pré-requisitos 4 e 5 | Gerar ciclo sem duração e sem contexto — o gerador **recusa** |

### 1.2 O que está congelado — e o que isso significa para o PE

Desde **19/09/2026** (`CONGELAMENTO.md`) não mudam por padrão: `PROTOCOLO.md`, `REGRAS.md`,
`tools/` (o diretório inteiro, incluindo um arquivo novo), `tools/templates/`,
`prompts/`, `biblioteca/guia-do-professor.md` e `METODO.md`. Mudam só por **motivo
declarado**, que significa três coisas ao mesmo tempo: o commit tem corpo explicando o
**porquê**, o `REGISTRO.md` ganha entrada, e a mudança tem o **seu próprio commit** — não vai
junto com conteúdo.

Continua **livre**: conteúdo (aulas, cadernos, relatórios), POs novos, harmonizações,
correções de conteúdo e **novos documentos que sigam a estrutura já definida**. É sob essa
última cláusula que este `ARQUITETURA-PE.md` existe — e é por isso que **este documento não
precisa de entrada no `REGISTRO.md`**: ele não altera nada. O que ele fará, se a integração
for implementada, está na §7.

Três consequências diretas para quem implementar:

- **Criar `tools/lib-pe.sh` é descongelar.** O diretório `tools/` está congelado como um
  todo; um arquivo novo ali exige motivo declarado, como qualquer alteração.
- **Tocar `.gitignore` não é descongelar** — o arquivo não está na lista —, mas é alteração de
  infraestrutura e segue o mesmo rito por prudência (motivo no corpo do commit).
- **Nada de fonte é reancorado por este documento.** Nenhuma fonte mudou; portanto nenhuma
  âncora `.fipp` muda, e `tools/hash-ciclo.sh --check` continua válido sem reancoragem.

### 1.3 As quatro camadas de proteção, e o que a integração acrescenta

`CONGELAMENTO.md` protege os dados sensíveis em quatro camadas: repositório privado; PDF do
ciclo sem acompanhamentos; acompanhamentos HTML cifrados no site (PageCrypt); acompanhamentos
`.md` fora do Git. A integração **não pode** enfraquecer nenhuma delas. O ponto de atenção é a
saída: se o PE hospedar elicitação que produza acompanhamento, a camada 4 continua valendo —
`professores/*/ciclos/*-acompanhamento-*.md` fica fora do Git, e `tools/check-pacote.js`
reprova o pacote que expuser qualquer acompanhamento em claro.

### 1.4 Duas premissas de escopo que a integração herda

- **O projeto não avalia.** Ele registra o cotidiano do professor em sala de aula. A avaliação
  é fronteira de outro módulo, não desenhado.
- **A integração ainda não existe.** Com o projeto das secretarias (Projeto Cultura), nem a
  fronteira de entrada nem a de saída foram desenhadas. O que este documento desenha é a
  fronteira **PO ⇄ PE**, que é outra.

## 2. A separação estrita: o recipiente (PE) × o conteúdo (PO)

### 2.1 A linha, em uma frase

**O PE define o recipiente; o PO define o conteúdo.** O PE diz **como** uma elicitação se
constrói, se persiste, se gerencia e **como ela ramifica** — o envelope, os estados, a
proveniência, a validação do insumo e a **mecânica de ramificação**: o como saltar de um nó
para outro, dado um valor de campo. O PO diz **o que** se pergunta, **quais** campos existem,
**quais** regras de domínio valem e **em que ponto** a elicitação ramifica. Nenhum dos dois
atravessa a linha do outro.

### 2.2 A tabela da fronteira

| Camada | O que é | Onde vive | De quem é |
|:--|:--|:--|:--|
| **PE** | motor estrutural **genérico e agnóstico** | repositório separado, **"dança e elicitação"** | o **recipiente**: como construir, persistir e gerenciar elicitações em arquivos JSON; os estados; a **mecânica de ramificação** (o como saltar de um nó para outro); a proveniência da elicitação |
| **PO** | implementação **aplicada** de um protocolo | **este** repositório | o **conteúdo**: as perguntas, as regras de domínio, os **10 blocos**, os campos, a linha de base; os **ramos** e os seus **gatilhos** |

### 2.3 A prova de que o conteúdo é do PO — medida, não declarada

O conteúdo é discricionário e **pertence ao PO**. Três medições, todas verificáveis no disco:

- **A palavra "bloco" tem três sentidos, e nenhum é do PE.** Em `prompts/elicitar-ciclo.md` há
  **dez blocos de entrevista**; no **plano** há **quatro blocos de volume** — solo, barra,
  centro, musicalidade (`ciclo-01-plano.md`, "Distribuição do volume pelos blocos"); na
  **folha de captura** há **blocos de registro** — técnica, funcional, musicalidade e linha de
  base revisitada (`ciclo-01-captura-aula-01.md`, "Bloco 1" a "Bloco 4"). São três listas
  independentes, no mesmo domínio. Isso é conteúdo de dança, não recipiente.
- **Quem manda nos campos é o PO, não o schema.** O cabeçalho de
  `tools/validar-dados-ciclo.js` declara isso, e o Duo o demonstra: onde a forma genérica
  escreve `alinhamento` e `tempo`, o Duo grava **`metatarsos`**. O conjunto de chaves **varia
  por variante** — o schema não determina o conteúdo.
- **O planejamento de dança está escrito dentro dos Blocos 1 a 4.** Objetivo geral, aluna,
  primeira aula, marcos aula a aula: é o plano de um ciclo de balé clássico, não um formulário
  genérico.

**Consequência direta:** este repositório **não é agnóstico**, e a razão está no conteúdo, não
no recipiente. É por isso que ele é o **protótipo**: ele prova o modelo num universo. O que se
extrai dele para o PE é o **recipiente** — e o que **fica** aqui são as perguntas.

### 2.4 O que o PE herda do PO de origem — e como isso se lê aqui

A especificação de origem do PE (acervo do projeto de mestrado, em outro diretório) define os
seus produtos como **três artefatos**: o **Arquivo metodológico**, a **Proveniência da
Elicitação** e a **ResearchConfiguration**. O Arquivo metodológico é **DADO DE EXECUÇÃO** — o
que se registra do processo — e nunca a **NORMA**, que é o que o PO estabelece. É exatamente a
fronteira medida aqui:

| PE de origem | Aqui, no Projeto Ciclo |
|:--|:--|
| Não modifica o Plano de Observação; não redefine fenômeno; não amplia nem reduz escopo; não altera a norma | **P-03/P-04** — a proveniência acrescenta, não edita. O PO é do professor (P-13) e a linha de base é declarada por ele (P-10) |
| O insumo é obrigatório e **imutável**; se a validação do insumo falhar, o PE **não prossegue** | A âncora `.fipp` é versionada e **verificável** (`tools/hash-ciclo.sh --check`). Uma fonte alterada sem reancoragem não confere |
| Não observa, não mede, não produz evidência, não produz achado | **P-05/P-07** — o ciclo produz **material**, não evidência. A análise é de outro módulo |
| Não gerencia a infraestrutura de proveniência | A infraestrutura de proveniência é **deste** repositório (a âncora encadeada) e do projeto de mestrado (o FIPP). O PE **consome**, não constrói |

**A mesma fronteira, uma segunda vez:** ela é idêntica à que separa
`biblioteca/guia-do-professor.md` (compartilhado, um só) de `professores/<professor>/…`
(aplicado, quantos houver). Um motor; N implementações.

### 2.5 A inversão de ordem — declarada, não resolvida por silêncio

Há uma tensão real entre as duas fontes, e este documento a declara em vez de contorná-la:

- **No PE de origem**, o insumo é o **Plano de Observação** — o PE vem **depois** do PO, e
  produz o Arquivo metodológico a partir dele.
- **Aqui**, a Elicitação vem **antes**: `prompts/elicitar-ciclo.md` produz, na mesma entrevista,
  o plano (Blocos 1 a 4) **e** o PO (Blocos 5 a 9). A Elicitação é o **primeiro elo da cadeia**.

São **duas elicitações diferentes**, em pontos diferentes do processo, e confundi-las é o
erro a evitar:

| | Elicitação de ciclo (a daqui) | PE (o da spec de origem) |
|:--|:--|:--|
| **Quem responde** | o professor | o especialista, sobre o *Arquivo* |
| **O que produz** | o **plano** e o **PO** — a NORMA | o **Arquivo metodológico** — o DADO DE EXECUÇÃO |
| **Quando** | **antes** do ciclo — é o primeiro elo | **depois** do PO estar consolidado e imutável |
| **De quem é** | **conteúdo do PO** (10 blocos de dança) | **recipiente do PE** |

**O que isso obriga este documento a dizer:** a entrevista de dez blocos **não é o PE**. Ela é
conteúdo de PO que, quando o PE existir, passa a ser **hospedada pelo recipiente dele** — sem
que a entrevista vire genérica e sem que o PE passe a saber o que é um `tendu`. As duas
convivem, e a §4 mostra onde cada uma entra no fluxo.

## 3. Descoberta do PE em Repositório Separado (Via Variável de Ambiente e `.env`)

Como o módulo do **Protocolo de Elicitação (PE)** — batizado externamente como o repositório
**"dança e elicitação"** — habita um diretório físico completamente independente e isolado do
projeto de dança (PO), a comunicação entre ambos não se dá por acoplamento de código ou
árvore de arquivos unificada, mas sim por uma **ponte de configuração baseada em ambiente**.

### 3.1 O Mecanismo de Ponte (`.env`)

1. **Configuração Externa:** O projeto de dança (PO) localiza a raiz do repositório PE por
   meio de uma variável de ambiente definida em um arquivo `.env` local (ex:
   `PE_RAIZ="/caminho/absoluto/para/danca-e-elicitacao"`).
2. **Contrato de Consulta:** Scripts auxiliares (no espírito das bibliotecas puras de
   verificação, como `tools/lib-fontes.sh`) realizam a checagem no disco:

   - Validam se a variável `PE_RAIZ` está declarada.
   - Verificam se o caminho físico apontado existe e se contém a estrutura esperada para o
     professor e a escola correspondentes.

3. **Degradação Graciosa (Fallback):**

   - **Presente:** Se o repositório do PE for localizado e possuir os artefatos de elicitação
     válidos, o PO assume o fluxo dinâmico de linha de base.
   - **Ausente:** Se o `.env` não estiver configurado, se o caminho estiver vazio ou se o
     repositório externo não for encontrado na máquina, o PO opera em seu formato tradicional
     e **independente**, tratando a ausência de forma declarada e graciosa.

### 3.2 O Princípio da Fronteira de Repositórios

Nenhum código-fonte, motor ou lógica de processamento do repositório **"dança e elicitação"** é
copiado ou versionado dentro deste repositório de dança (PO). A fronteira de troca entre os
dois sistemas é estritamente restrita a **artefatos de dados e prosa de especificação**
(arquivos estruturados em JSON e documentação textual), preservando a total independência de
ciclo de vida e versionamento Git de cada projeto.

### 3.3 O arquivo `.env` neste repositório

Esta subseção é complementar à §3.1 e à §3.2 — é a aplicação delas ao **disco deste
repositório**, que hoje não tem nem `.env` nem qualquer carregador de `.env`. A medição: as
únicas variáveis de domínio usadas em `tools/` são `CICLO` e `VARIANTE`, ambas com *default*
(`${CICLO:-01}`); `LC_ALL` e `FORCE_SOURCE_DATE` são internas às ferramentas. **Não há
precedente de `.env`** — a convenção `PE_RAIZ` nasce aqui.

O precedente a imitar **não é de `.env`, mas de credencial local**: `tools/.senhas-locais` está
no `.gitignore`, e o repositório versiona só o **modelo** — `tools/.senhas-locais.exemplo`,
com senhas fictícias, que documenta o `cp` + `chmod 600` e o que acontece quando o arquivo não
existe. A mesma forma, para o `.env`:

| Arquivo | Versionado? | Papel |
|:--|:--|:--|
| `.env` | **não** — entra no `.gitignore` | o caminho real da máquina; específico de quem roda |
| `.env.exemplo` | **sim** | o modelo: a variável, um valor fictício (`PE_RAIZ="/caminho/absoluto/para/danca-e-elicitacao"`) e a degradação declarada |

Duas observações de mecânica, para quem implementar:

- **O `.env` precisa ser lido, não apenas existir.** Um `.env` não é exportado por magia: ou a
  biblioteca o lê explicitamente, ou o script exige a variável já exportada no ambiente. A
  escolha (ler o arquivo × exigir o *export*) fica para a implementação, mas precisa estar
  declarada — a degradação graciosa depende de distinguir "não configurado" de "configurado e
  inválido".
- **A ausência é silenciosa para quem não usa o PE.** Nenhum caminho existente hoje pode
  quebrar por falta de `.env`: sem `PE_RAIZ`, o comportamento tem de ser **idêntico** ao de
  antes da integração. Isso é a degradação graciosa vista do lado do código — e é exatamente o
  que a §7.1 verifica.

## 4. O fluxo de processos

### 4.1 A cadeia, com os artefatos reais

```
professor
   │  Elicitação (conteúdo do PO — os 10 blocos, prompts/elicitar-ciclo.md)
   ▼
[Blocos 1–4] plano do ciclo e das aulas      [Blocos 5–9] PO — a NORMA      [Bloco 10] documentos auxiliares
   │                                              │                              │
   └──────────────┬───────────────────────────────┘                              │
                  ▼                                                               ▼
      ciclo-XX-<escola>-plano.md / -po.md                          prompts/instalar-ciclo.md
                  │   (fontes; entram na âncora)                              │  instala as fontes
                  ▼                                                            ▼
      tools/gerar-ciclo.sh  ──►  pacote publicado (HTML/PDF/JSON)  ──►  lançamento.html consome
                  │                                                       ciclos.json + *-dados.json
                  ▼
      po-01.json — o PO extraído (question, phenomenon, norma, linhaDeBase, …)
                  │   a NORMA e a linha de base são campos DE DENTRO dele
                  │   { aluno, traz, precisaDesenvolver } por aluna (P-10)
                  ▼
      aula acontece ──► caderno · relatório pós-aula ──► tools/hash-ciclo.sh ──► .fipp (âncora)
                  │
                  ▼
      o PO do ciclo N+1 nasce do relatório pós-aula do ciclo N   ← P-02: é aqui que o PE entra
```

### 4.2 Quem estabelece o quê

- **O PO estabelece os objetivos de observação.** O **Bloco 2** (objetivo geral, verificável,
  com parâmetro) e o **Bloco 4** (marcos aula a aula) são **declarados pelo professor**. O PO
  é a leitura interrogativa do objetivo geral — mesma matéria, olhar invertido (P-01). Nada
  disso vem do PE.
- **O PE (quando presente) fornece a infraestrutura da elicitação.** O recipiente: onde a
  elicitação é construída, como ela é persistida em JSON, quais estados ela atravessa, **como
  ela ramifica** e como a sua proveniência é declarada. O **conteúdo** — as perguntas, os
  campos, os dez blocos — continua do PO.
- **A interface exibe o botão inteligente — e ele não inverte a precedência.** Quando o PE está
  presente, a interface oferece **um botão que importa automaticamente os objetivos do PO** para
  dentro do recipiente: em vez de o professor redigitar o objetivo geral, os marcos e a linha de
  base, a elicitação os **traz** do PO já declarado. O botão é **conveniência de transporte, não
  de decisão**: ele copia o escopo do PO para o PE, e nunca o contrário. A primazia do plano
  metodológico sobre a coleta permanece inalterada — o PE recebe o que o PO já estabeleceu, e
  não pode redefinir, ampliar nem reduzir o que importou (§4.4). Sem PE, o botão simplesmente
  não existe, e o fluxo tradicional segue idêntico.
- **O PO consome os artefatos e calibra o planejamento.** O que fecha o elo é o **P-02**: o PO
  declarado de um ciclo vem do **relatório pós-aula** do ciclo anterior. O ciclo N+1 se
  calibra pelo que se registrou do N.

### 4.3 A linha de base estruturada — a forma canônica, medida

A forma que o PO consome já está fixada em `professores/tiago/campo/README.md` (26/09/2026):

```
{ aluno, traz, precisaDesenvolver }   — um objeto por aluna
```

Ela é **extraída** da tabela `| Aluna | Traz | Precisa desenvolver |` do PO, e o produto é o
`po-01.json` do pacote, com **`norma`** e **`linhaDeBase`** separados — a norma é o que o PO
estabelece; a linha de base é o estado inicial de cada sujeito (P-10). Três pontos de
vocabulário que a integração **não pode** desfazer:

- **`po-01.json` é derivado, não fonte.** A fonte é `ciclo-XX-<escola>-po.md` (e a captura
  lançada, `ciclo-XX-<escola>-dados.json`, que **entra na âncora** e **não é publicada**).
- **`guia-de-observacao-NN` é vista.** Ele é **gerado** de PO + plano — é o que o `e_vista()`
  do `tools/lib-fontes.sh` declara: existe como vista enquanto o `.md` **não** existe no disco.
- **Os acompanhamentos são derivados, e por isso ficam fora das fontes.** O
  `fontes_do_ciclo()` do `tools/lib-fontes.sh` deliberadamente **não** os inclui: eles são
  vista de PO + relatórios, e o `.gitignore` os mantém fora do Git.

> **Nota datada — 14/10/2026. Uma chave por nó respondível.** O `po-01.json` ganhou as chaves dos
> nós que não tinham destino (`planoDeEnsino`, `horizonte`, `dimensoesObservadas`,
> `itensPorDimensao`, `metodologiaENotacao`, `flutuantes`, `restricoes`, `horizonteDoConjunto`,
> `compromissoDeReavaliacao`), todas **opcionais**. Antes disso, dez dos trinta e três nós
> respondíveis não chegavam ao documento — o horizonte, o plano referenciado, as dimensões e os
> itens observados e os campos dos módulos condicionais; e dois escreviam dentro do campo de
> outro (as flutuantes como item de `subjects`, as restrições físicas como «linha» de
> `linhaDeBase`). A regra que fica: **cada nó respondível tem a sua chave**, e o `## Metodologia e
> notação` — emitido desde a ligação L5 — passa a ser extraído. Ver `REGISTRO.md` (14/10/2026) e
> `experimentos/provar-po-completo.js`.


> **Nota datada — 14/10/2026. A seção fora do mapa deixa de ser descartada em silêncio — e o
> `## Contexto` vira a fonte única.** A mesma regra da nota acima, cobrada do outro lado: o
> `plano-XX.json` ganhou as chaves dos nós que não tinham destino (`contexto`,
> `condicoesPreliminares`, `criterioDeExtensao`, `musicasVideos`, `repertorio`), todas
> **opcionais**. Vinte e um dos vinte e quatro nós respondíveis do plano não chegavam ao JSON, e
> dois não chegavam a documento nenhum; a causa comum era a seção cujo título não está no
> `MAPA_SECOES` — descartada **sem aviso**, com o validador imprimindo `ok`. Agora o contrato
> registra essas seções **quando tinham conteúdo** e o aviso nomeado diz a linha e o que se
> perde: uma seção nova sem destino passa a aparecer no dia em que nasce, e não três ciclos
> depois. E o que o professor declara passa a ser declarado **uma vez**: o `## Contexto` é a
> fonte, e a ficha do ciclo (`ciclo`) é composta dele. Ver `REGISTRO.md` (14/10/2026, frente B11)
> e `experimentos/provar-plano-completo.js`.

> **Nota datada — 15/10/2026. O nó `dimensoes-de-observacao` deixa de ser perguntado: ele DERIVA
> do plano.** A chave do PO continua a mesma, mas o valor não vem mais de uma `forma` fixa em
> prosa («técnica · musicalidade · par/pas de deux · repertório do dia» — vocabulário que não era
> nem o do plano nem o da anamnese). Ele passa a ser **derivado** na leitura do formulário, a
> partir do plano referenciado no nó `plano-de-ensino`: o eixo **Técnica** cruzado com os **blocos
> da aula que o plano marca** em `estrutura-de-cada-aula` (a união dos marcos), na ordem canónica
> dos blocos — «Técnica — Solo», «Técnica — Barra». Sem bloco marcado (o campo é opcional no
> plano), valem os cinco blocos canónicos da aula. O que o professor escreve continua a ser só os
> **itens** de cada dimensão, e é isso que vira a coluna da folha de captura.
>
> A derivação mora no **contrato**: o conteúdo declara `doPlano` (o nó de onde ler, o eixo, os
> blocos canónicos), e é o mesmo `forma`-de-ler dos nós que já vêm de outro sítio (`daTurma`,
> `daCuradoria`) — o PE não sabe o que é uma dimensão; ele sabe ler de onde o conteúdo manda. O
> valor derivado entra no envelope com `origem: "importado"` («o valor entrou pronto de outro
> artefato» — a descrição que o schema já dava para este caso), e **não** como `perguntado`, que
> seria falso. Ver `REGISTRO.md` (15/10/2026) e `experimentos/provar-dimensoes-plano.js`.

### 4.4 O que o PE nunca faz no fluxo

Não modifica o PO; não redefine o fenômeno; não amplia nem reduz o escopo; não altera a norma;
não observa; não mede; não produz evidência nem achado; não classifica; não substitui o
professor. Ele **hospeda e estrutura** — e quando o insumo não valida, ele **para** em vez de
melhorar o insumo por conta própria.

## 5. Espelhamento de diretórios

### 5.1 A estrutura medida hoje (verificada no disco)

Centrada no **professor**, ramificada por **ciclo** e, dentro do ciclo, por **escola**:

```
professores/<professor>/
├── ciclos/
│   ├── ciclo-XX.conf                        manifesto base (CICLO, NOME, OBJETIVO_GERAL,
│   │                                        PROFESSOR, TOTAL_AULAS, VOLUME_*, DOCS)
│   ├── ciclo-XX-<escola>.conf               variante da escola (Pré-requisito 5): VARIANTE,
│   │                                        ESCOLA, RESPONSAVEL, FREQUENCIA, DIAS (com hora),
│   │                                        DURACOES, DATA_INICIO, ACOMPANHAMENTO_CRIPTOGRAFADO
│   ├── ciclo-XX-<doc>.md                    fonte COMPARTILHADA (plano, musicalidade, …)
│   ├── ciclo-XX-<escola>-<doc>.md           fonte da VARIANTE — tem precedência quando existe
│   ├── ciclo-XX-<escola>-po.md              o PO — POR ESCOLA (P-09/P-10)
│   ├── ciclo-XX-<escola>-dados.json         a captura lançada: FONTE do hash, NÃO publicada
│   ├── ciclo-XX-{schema,po-schema,plano-schema,aula-schema,captura-schema}.json   os 5 schemas
│   ├── ciclo-XX-<escola>.fipp               a âncora do ciclo (VERSIONADA)
│   ├── ciclo-XX-<escola>-aula-NN.fipp       a âncora por aula
│   └── ciclo-XX-<escola>/                   o PACOTE PUBLICADO (saída gerada)
├── cadernos/ciclo-XX/caderno-XX-<escola>.md
├── relatorios/ciclo-XX/aula-NN-<escola>.md
└── campo/<AAAA-MM-DD>-<escola>/{formulario.md, respostas.md}
biblioteca/  ·  departamentos/  ·  experimentos/  ·  tools/  ·  apresentacoes/
```

### 5.2 Três camadas por ciclo — e a distinção é o que o espelho preserva

| Camada | Exemplo | Publicada? | No hash? |
|:--|:--|:--|:--|
| **Fonte** | `ciclo-01-diaghilev-po.md`, `ciclo-01-diaghilev-dados.json` | não (o JSON fica no repositório privado) | **sim** |
| **Saída do pacote** | `po-01.json`, `plano-01.json`, `captura-aula-01.json`, `ciclos.json` | sim | não — reconstruível (P-04) |
| **Âncora** | `ciclo-01-diaghilev.fipp` | não | é a âncora |

E a quarta camada que **não** se espelha por ser vista: `guia-de-observacao-NN` (gerado) e os
`*-acompanhamento-*.md` (fora do Git, com dados de menores protegidos pelas quatro camadas da
§1.3).

### 5.3 A resolução de fontes — a regra única que o PE deve herdar

`tools/lib-fontes.sh` é a **definição única** de resolução de fontes do projeto, e ela nasceu
de um erro real (18/09/2026): o gerador e o hasher resolviam fontes de formas diferentes, e a
âncora cobria um conjunto de arquivos distinto do pacote publicado. A regra que resolveu:

> **Regra única:** o documento `ciclo-XX-<doc>.md` pode ter uma versão PRÓPRIA da variante —
> `ciclo-XX-<variante>-<doc>.md` — que tem precedência quando existe. É isso que permite que
> cada escola tenha o seu próprio ciclo.

O PE herda o princípio, não o arquivo: **uma só biblioteca decide onde está cada coisa**, e
todos os consumidores passam por ela. É por isso que a §3.1 nomeia "bibliotecas puras de
verificação" como o modelo do contrato de consulta: funções que só **perguntam** ao disco, sem
efeito, usadas por ambos os lados.

### 5.4 A estrutura prevista do PE (o espelho)

O que se espelha é a **geografia do professor**, não a taxonomia da dança:

| No PO (aqui) | No PE (repositório separado) |
|:--|:--|
| `professores/<professor>/` | a raiz do módulo **por professor** — o endereço do profissional é o eixo |
| `professores/<professor>/ciclos/ciclo-XX-<escola>/` | o ciclo e a sua variante de escola — **endereço do conteúdo**, e o PE só o **referencia** |
| `tools/lib-fontes.sh` (resolução única) | a biblioteca pura equivalente: declarar se a raiz existe e se a estrutura esperada está lá |
| `ciclo-XX-<escola>.fipp` (a âncora) | a **proveniência da elicitação** — o estado e o encadeamento do que foi elicitado |
| `*schema.json` (o contrato dos campos) | o **envelope** do recipiente; os campos continuam vindo do PO (P-08) |

**O que o PE não tem:** `ciclos/` com aulas, cadernos, relatórios, harmonizações, `biblioteca/`
nem `apresentacoes/`. Isso é **conteúdo de dança**; no PE ele não é espelhado — é **referido**.
Espelhar a árvore inteira seria copiar o domínio, que é exatamente o que a §2 proíbe.

## 6. Prosa × chave-valor

### 6.1 O critério, antes do inventário

O critério já está formulado no `IDEIA-CAPTURA.md`: **o que é AUTORADO continua `.md`; o que é
VISTA é gerado** — e a vista é a chave-valor relida. Aplicado à fronteira: **prosa cruza a
fronteira como especificação e como conteúdo autoral; chave-valor cruza como artefato de
dados.** Código não cruza — nem de cá para lá, nem de lá para cá.

### 6.2 Chave-valor (JSON e afins)

| Artefato | Papel | É fonte? |
|:--|:--|:--|
| `ciclo-XX-<escola>-dados.json` | a captura lançada: apelidos, presença, condições de contorno, técnica, funcional | **sim** (entra na âncora; **não** é publicado) |
| `ciclo-XX-*-schema.json` (5) | o contrato dos campos de cada artefato | sim |
| `ciclo-XX-<escola>/po-01.json` | o PO extraído: pergunta, fenômeno, `norma`, `linhaDeBase` | não — derivado |
| `ciclo-XX-<escola>/plano-01.json` + `-anterior.json` | o plano extraído e o estado anterior | não |
| `ciclo-XX-<escola>/captura-aula-NN.json`, `captura-01.json` | o config por aula | não |
| `ciclo-XX-<escola>/ciclos.json` | o índice por aula: data, hora, marco, estado derivado, prazo | não |
| `ciclo-XX-<escola>.fipp` | a âncora — chave-valor em texto, com a lista `cobertura:` | é a âncora |
| `ciclo-XX-<escola>.conf`, `ciclo-XX.conf` | **chave-valor em *shell quoting*** — o manifesto | sim |
| `tools/.senhas-locais` (e o `.env` proposto) | configuração local, fora do Git | credencial |

Medidos no pacote do Duo: a fonte `ciclo-01-duo-dados.json` mede **3,6 KB** (~5,6 KB já
formatada dentro do pacote) e o config da aula `captura-aula-01.json`, **3,3 KB**. São arquivos
pequenos, e o painel de lançamento **lê o texto inteiro** de cada um — a decisão de desenho que
mantém o formulário dinâmico sem servidor.

### 6.3 Prosa

| Artefato | Papel |
|:--|:--|
| `REGRAS.md`, `PROTOCOLO.md`, `METODO.md`, `CONGELAMENTO.md`, este `ARQUITETURA-PE.md` | regra, método e desenho — **especificação** |
| `ciclo-XX-<escola>-po.md`, `-plano.md`, `-aula-NN.md`, `-notacao.md` | **autoral** — o que o professor escreve |
| `caderno-XX-<escola>.md`, `aula-NN-<escola>.md` | registro escrito por quem viveu a aula |
| `ciclo-XX-<escola>-harmonizacao.md` | P-21 — o professor revê e reescreve com as próprias palavras |
| `guia-de-observacao-NN` | **prosa GERADA** (vista) — não é autoral; some quando a fonte existe |
| `prompts/elicitar-ciclo.md`, `prompts/instalar-ciclo.md` | **prosa que É o conteúdo do PO** — os dez blocos e a instalação |
| `professores/<professor>/campo/**/*.md` | material bruto de campo (P-05/P-06) |
| `tools/**` (`.sh`, `.js`, `.py`) e `apresentacoes/**` | **código e frente própria** — infraestrutura, congelada |

### 6.4 O que cruza a fronteira, em uma tabela

| Direção | Cruza | **Não** cruza |
|:--|:--|:--|
| PO → PE | o **PO** (a norma, em Markdown), a **linha de base** estruturada, os **schemas** se o PE os adotar | o motor deste repositório, os geradores, os templates |
| PE → PO | o **envelope** da elicitação (JSON) e a **prosa de especificação** do recipiente | o código do PE, o motor, a lógica de processamento, o histórico Git |

## 7. O que precisará descongelar

`CONGELAMENTO.md` congela a infraestrutura: só muda com **motivo declarado**, entrada no
`REGISTRO.md` e **commit próprio**. A integração, quando implementada, toca:

| Arquivo | Por quê |
|:--|:--|
| `tools/lib-fontes.sh` | declarar o insumo opcional do PE na resolução de fontes — sem alterar a precedência da variante |
| `tools/gerar-ciclo.sh` | consumir a linha de base vinda do PE no `po-01.json` |
| `tools/hash-ciclo.sh` | decidir se o que vem do PE **entra** na cobertura da âncora e como isso é declarado |
| `tools/validar-dados-ciclo.js` | validar o envelope do PE sem impor campos (P-08: quem manda nos campos é o PO) |
| `tools/lib-pe.sh` (novo) | as funções puras do contrato de consulta (`PE_RAIZ` declarada, caminho existente, estrutura esperada). **`tools/` está congelado como diretório: criar arquivo ali é descongelar** |
| `.gitignore` | ignorar o `.env` real, no molde do bloco `tools/.senhas-locais` que já existe |
| `.env.exemplo` (novo) | o modelo versionado, no molde de `tools/.senhas-locais.exemplo` |

A pesquisadora já autorizou o descongelamento para os trabalhos desta frente (23/09/2026):
*"vai ter que descongelar — a gente vai ajustar o que tiver que ajustar; afinal de contas, a
gente tá num protótipo"*. **Cada item exige, ainda assim, o seu motivo declarado e o seu
commit.** Nenhum deles é tocado por este documento.

### 7.1 A prova da degradação graciosa

O teste que fecha a §3.1 é comportamental, e é barato:

1. **Sem `.env`** — `tools/gerar-ciclo.sh` e `tools/hash-ciclo.sh` produzem **byte a byte** o
   que produziam antes da integração, e a âncora `--check` continua válida.
2. **Com `PE_RAIZ` apontando para um caminho inexistente** — o comportamento é o mesmo, e a
   ausência é **declarada** na saída (não é erro fatal).
3. **Com `PE_RAIZ` válido** — o fluxo dinâmico assume; e o pacote publicado não ganha nada que
   viole as quatro camadas da §1.3.

Enquanto os três casos não forem provados, a integração não está pronta — porque hoje nenhum
deles existe, e o risco é quebrar o que já funciona.

## 8. Perguntas em aberto

Nada aqui está decidido, e nenhuma delas bloqueia este documento — que é desenho, não
implementação.

1. **PO por escola × PE endereçado por professor.** O PO deste repositório resolve-se **por
   escola** (`ciclo-XX-<escola>-po.md`), enquanto a organização do trabalho é **por professor**
   (P-13). Um PE endereçado só por `<professor>` precisa declarar como desambigua a escola.
   Hipóteses: **(A)** o endereço do PE carrega os dois (`<professor>/<escola>`); **(B)** o PE
   endereça por professor e a escola é atributo do artefato; **(C)** o PE endereça por escola,
   como o PO já faz. A **(A)** é a que menos força o modelo atual, mas cria dois eixos na
   árvore.
2. **O PE adota os schemas do ciclo ou define os seus?** Ou o PE lê
   `ciclo-XX-*-schema.json` (acoplamento ao formato daqui), ou define um envelope próprio com
   um adaptador. A tensão é real: adotar os schemas contamina o recipiente com o domínio;
   definir os seus exige o adaptador.
3. **O `.env` é lido pela biblioteca, ou a variável é exigida já exportada?** Muda o que
   significa "não configurado" — e é o que decide se a degradação é distinguível de erro.
4. **O nome da variável é `PE_RAIZ` ou `CICLO_PE_RAIZ`?** `PE_RAIZ` é o que o exemplo da §3.1
   usa; `CICLO_PE_RAIZ` marca que quem a lê é o projeto de dança e não o PE.
5. **O que vem do PE entra na cobertura da âncora `.fipp`?** Se entra, o PE passa a poder
   invalidar a âncora deste repositório — o que exige declarar a ordem de reancoragem. Se não
   entra, o dado elicitado fica fora da cadeia, e isso precisa ser dito.
6. **A entrevista de dez blocos deve ser reexpressa como *front-end* do PE, ou permanece
   distinta?** A §2.5 registra a inversão: aqui a elicitação precede o PO; no PE de origem ela
   o consome. Unificá-las exige uma decisão de método, não de código.
7. **O repositório "dança e elicitação" é único para todos os professores, ou um por
   professor?** A §5.4 espelha `professores/<professor>/` como raiz do módulo; se o repositório
   for único, o eixo por professor é **dentro** dele, não na raiz.
8. **Quem guarda o quê quando os dois discordam.** Se o PO e o PE divergirem sobre a linha de
   base, qual artefato é a norma? A leitura deste documento é que a norma é do PO (P-10) e o
   PE não a altera — mas isso precisa ser confirmado no desenho.

## Referências

- `PROTOCOLO.md` — as 22 pétreas (P-01, P-03 a P-05, P-07 a P-14, P-16, P-17, P-19, P-21,
  P-22); a nota metodológica (PO latente × PO declarado; material × evidência)
- `REGRAS.md` — as 17 regras e os 5 pré-requisitos obrigatórios
- `CONGELAMENTO.md` — o que está congelado, o que continua livre, o que exige motivo
  declarado e a política de segurança em quatro camadas
- `AGENTS.md` — a identidade do projeto: protótipo, não agnóstico; o FIPP não é implementado
  aqui; a integração com o Projeto Cultura não existe
- `ARQUITETURA-AULA.md` — o ciclo de vida da aula, o prazo e a âncora por aula; **§8** (o que
  precisa descongelar) e **§10** (as peças, na ordem) são o modelo da §7 deste documento
- `ARQUITETURA-CAPTURA.md` — o formulário dinâmico e o JSON por ciclo; §7 (as decisões
  tomadas e as abertas) é o modelo da §8 deste documento
- `IDEIA-CAPTURA.md` — o conceito de captura, incluindo o critério autoral × vista (§6.1)
- `tools/lib-fontes.sh` — a resolução única de fontes; `fonte_md()`, `fonte_dados()`,
  `e_vista()`, `docs_derivado()`, `fontes_do_ciclo()`; o modelo do contrato de consulta (§3.1)
- `tools/hash-ciclo.sh` — a âncora encadeada (`.fipp`) e a resolução do PO por variante
- `tools/gerar-ciclo.sh` — o gerador do pacote e dos JSON derivados
- `tools/validar-dados-ciclo.js` — a declaração de que quem manda nos campos é o PO (§2.3)
- `tools/gerar-handoff.sh` — varre `ARQUITETURA-*.md` e publica o `> **Resumo (para o
  HANDOFF):**`; o `HANDOFF.md` é regenerado por ele, nunca editado à mão
- `tools/.senhas-locais.exemplo` — o molde da configuração local fora do Git (§3.3)
- `prompts/elicitar-ciclo.md` — a entrevista de dez blocos: o **conteúdo** do PO (§2.3, §2.5)
- `prompts/instalar-ciclo.md` — o contrato que transforma o elicitado em fonte instalada
- `professores/tiago/campo/README.md` — a forma canônica da linha de base (26/09/2026)
- `departamentos/README.md` — o PO de departamento (P-14): o precedente de estrutura
  **prevista e vazia**, com pai opcional na cadeia — a mesma forma da descoberta opcional do PE

> **Nota datada — 02/10/2026. A redação acima envelheceu — em parte.** Os ciclos-protótipo
> `duo` e `ritmos` foram removidos do repositório nesta data; o ciclo ativo é o Diaghilev
> (professor Fokini). O que era **medição** do Duo continua verdadeiro como **evidência**:
> o `ciclo-01-duo-dados.json` citado na §2.3 e na §6.2 mediu o que mediu, e a variação de
> chaves que ele demonstra é o argumento que sustenta a §2.3. Já os **ponteiros** da §4.3
> e das Referências — `professores/tiago/campo/README.md` — **não têm alvo vivo**: nenhum
> `campo/` é rastreado no repositório. Ficam como registro do que se leu, não como caminho
> a seguir. A redação antiga **não** foi apagada (P-03/P-04): esta nota é o elo novo.
