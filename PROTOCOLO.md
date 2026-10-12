# Protocolo Metodológico — Projeto Ciclo

Este documento é **complementar** ao [`REGRAS.md`](REGRAS.md), não concorrente.
Os dois são irmãos e respondem a perguntas diferentes:

- o `REGRAS.md` diz **como dar aula com rigor** (17 regras + 5 pré-requisitos);
- este documento diz **como a aula se torna objeto de investigação sem que a
  investigação contamine a aula** (22 regras pétreas).

Nada aqui muda o que o ciclo faz: planejar aulas, elicitar necessidades, gerar
artefatos. O que se acrescenta é uma **camada metodológica** que faz do mesmo
ciclo, ao mesmo tempo, uma prática pedagógica e um **Protocolo de Observação (PO)
em ato**, com cadeia de proveniência encadeada.

> **Vocabulário desta camada** — **PO:** Protocolo de Observação · **PE:**
> Protocolo de Elicitação · **PPQ:** Protocolo de Pesquisa Qualitativa · **FIPP:**
> Framework de Infraestrutura de Proveniência Peirceana.
>
> **Ressalva de escopo (2026-09-23).** O **FIPP pertence ao projeto de mestrado**, em
> outro diretório, e a arquitetura dele **não está implementada aqui** — nem perto.
> O que este repositório tem é uma **âncora de proveniência encadeada**
> (`tools/hash-ciclo.sh` → `.fipp`) que compartilha o seu princípio (o passado se
> incorpora, não se reescreve), mas é uma **aproximação**. Neste repositório, onde se
> lê "FIPP" entenda-se essa âncora — e o Projeto Ciclo **não é** o projeto de mestrado.

## As 22 regras pétreas

**P-01 — O ciclo é PO latente.**
A estrutura do ciclo e do PO são as mesmas. A diferença é a direção do olhar:
o ciclo enuncia uma meta; o PO enuncia uma pergunta. Não há dois documentos —
há duas leituras de um só artefato.

**P-02 — O PO declarado de um ciclo vem do ciclo anterior.**
O relatório pós-aula do Ciclo N alimenta a declaração do PO do Ciclo N+1. Não se
declara depois de observar — declara-se antes do ciclo seguinte, com base no que
o anterior revelou.

**P-03 — FIPP alinha; Git ramifica.**
O hash FIPP de um ciclo inclui o hash do ciclo anterior (`parentHash`). Não há
ramificação — há acúmulo. O passado não é reescrito; é incorporado.

**P-04 — Hash SHA-256 sobre fontes, versionado.**
O hash cobre apenas os arquivos-fonte do ciclo (`.conf` + `.md`), em ordem
determinística (LC_ALL=C). As saídas (HTML, PDF) não entram. O `.fipp` é âncora
da cadeia, não saída reconstruível — é versionado.

> **Ressalva de escopo (2026-10-11) — a proveniência é condicional.** A garantia
> de proveniência (P-03/P-04) vale **para escolas habilitadas**. Uma escola
> **desabilitada** perde a garantia e, passado o prazo de expurgo, pode ser
> **apagada** — deixa de existir e libera espaço no servidor. A desabilitação é
> registrada com data; a reabilitação dentro do prazo **cancela** o expurgo e a
> escola volta a funcionar normalmente. É uma inversão explícita: a regra deixa de
> ser absoluta e passa a ser **condicional ao estado da escola** — não é um
> detalhe de implementação, é decisão de norma, e é por isso que fica escrita aqui.

> **Norma (2026-10-11) — a limpeza da escola expurgada no ambiente de
> desenvolvimento.** Quando uma escola é expurgada no servidor, **tudo o que diz
> respeito àquela escola é limpo no ambiente de desenvolvimento** — na próxima
> sincronização com o GitHub. O critério de identificação é o **slug da escola**
> (`diaghilev`, `diaghilev2`, `duo`, `ritmos`). O que se limpa: **a senha** (em
> `tools/.senhas-locais`, nunca versionado), os ficheiros locais fora do Git, e
> **qualquer resíduo** que carregue o slug — referências, chaves, ficheiros de
> teste. **Antes de apagar, verificar que a escola não está a pagar**: uma escola
> que pagou, mas cujo estado está desalinhado, **não deve ser apagada** — a
> verificação é obrigatória. **A limpeza é por checklist, não busca cega**: lê o
> índice da escola (gerado no nascimento pelo `criar-escola.sh`), verifica cada
> entrada e regista o que foi apagado e o que não foi. **A única exceção a «tudo»
> é o próprio índice**: ele **sobrevive** como a lápide — o elo que prova que a
> escola existiu, o que foi criado e por que foi apagada. A proveniência
> acrescenta, não edita (P-03/P-04); o índice é o que torna o expurgo um elo, não
> uma amnésia. O servidor apaga a escola; o desenvolvimento limpa os resíduos —
> são dois momentos, e a sincronização é o ponto de alinhamento entre eles. Vale
> para qualquer escola expurgada, a qualquer momento — é norma do sistema, não de
> um caso.

**P-05 — O ciclo produz material, não evidência.**
Evidência é produzida pelo PPQ, e o PPQ exige condições metodológicas que não
estão disponíveis durante a prática. Chamar material de evidência antes do tempo
é teleologia.

**P-06 — O caderno de ciclo é descritivo, não analítico.**
O caderno descreve o que aconteceu; não classifica, não avalia, não conclui.
Registra o *antes* da memória — a memória reescreve o passado para se tornar
coerente.

**P-07 — Nenhuma classificação tácito/arquivo sem as quatro condições.**
Distância reflexiva, auditabilidade externa, validação por pares, separação de
papéis. Enquanto essas condições não existirem, o material permanece bruto.

**P-08 — Os campos do ciclo são declarados em schema.**
Cada ciclo tem o seu `ciclo-XX-schema.json`. O `hash-ciclo.sh` valida os `.conf`
contra o schema antes de calcular o hash. Isso formaliza o que o paper do
mestrado chama de "formulário dinâmico".

**P-09 — Um caderno por ciclo, por escola.**
Reforça o Pré-requisito 5 no domínio dos artefatos de observação. Não há mistura
entre escolas — nem nos registros.

**P-10 — O PO declara a linha de base dos sujeitos.**
Antes de observar evolução, o PO declara o estado inicial dos sujeitos — o
que trazem, o que falta, o que já dominam. Sem linha de base, "evolução" não
tem referencial, e o ruído não pode ser distinguido de estado inicial.

**P-11 — O PO declara as condições de contorno da execução.**
O recorte é factível, mas a execução depende de variáveis relacionais
(interesse, ânimo, harmonia) que o plano não controla. O PO declara essas
condições — não como falha, mas como parte do que se observa.

**P-12 — Os sujeitos são referidos por apelidos estáveis.**
O PO declara os apelidos pelos quais os sujeitos são referidos no material do ciclo —
apelidos que eles já usam, não pseudônimos criados para o projeto. A referência é
estável ao longo do ciclo (a mesma pessoa é sempre o mesmo apelido) e não requer
consulta a mapa externo. Apelidos substituem nomes completos; não os acompanham em
nenhum arquivo do repositório.

**P-13 — Cada professor tem o seu próprio PO.**
O PO é do professor, não do projeto. Dois professores com a mesma escola, os mesmos
alunos, o mesmo objetivo geral — ainda assim têm POs distintos, porque o recorte
observacional é decisão de cada um. Um PO nunca é compartilhado entre professores. A
cadeia FIPP preserva a separação: cada PO tem a sua âncora.

O que é do professor não é material privado dele: **o dado pertence à escola**, que pagou
pelo processo e o custodia — o professor **conduz**. Por isso o **acesso é por escola**: a
senha é da escola. A **organização e o lançamento**, porém, são **por professor** — é ele
que conhece o plano, é ele que lança, e é por ele que a escola procura (*"quero saber as
aulas da professora Rita"*). Separar o PO separa o **recorte observacional**, não o
material: ele continua interessando a quem responde por ele.

**P-14 — O PO pode derivar de um PO de departamento.**
Quando a escola tem metodologia comum, existe um PO de departamento — a norma
institucional. Cada PO de professor derivado tem `parentHash` = hash do PO de
departamento. Quando a escola não tem metodologia comum, o PO do professor é raiz (sem
`parentHash`). O PO de departamento é opcional: só existe onde a escola o declara.

**P-15 — A notação segue a metodologia declarada.**
Se a metodologia usa notação (ex.: RAD usa Benesh), o ciclo gera o documento de
notação naquela notação. Se não usa notação formal, o ciclo **não gera** documento de
notação — e declara a ausência com justificativa.

**P-16 — Metodologia e notação são declaradas na Elicitação.**
A Elicitação pergunta explicitamente: (a) que metodologia o professor usa? (b) que
notação domina? (c) quem define a metodologia — o professor ou a escola? O ciclo só
gera os artefatos que a resposta sustenta.

**P-17 — Todo ciclo produz os mesmos tipos de artefato do ciclo piloto.**
O ciclo do Duo é o padrão mínimo. Todo ciclo novo produz: plano, aulas, PO,
relatório-preview, captura em aula, pré-requisitos, musicalidade, musicalidade-aluna,
apanhado histórico, referências, guia do professor — e notação + glossário **quando a
metodologia exigir** (P-15). Quando um artefato não se aplica, é declarado ausente com
justificativa.

**P-18 — A metodologia pode ser imposta pela escola.**
O professor pode não escolher a metodologia — ela pode vir da escola (por departamento
ou por decisão da direção). Nesse caso, o PO registra a origem da metodologia
(professor ou escola). Se a escola impõe, o PO deriva da norma institucional (P-14). Se
o professor escolhe, o PO é raiz.

**P-19 — Os prompts do projeto vivem no repositório.**
Os prompts que o projeto usa para elicitar e instalar ciclos ficam versionados em
`prompts/`. O pesquisador não precisa carregá-los na cabeça nem recopiá-los entre
ferramentas — o Cline os executa direto do repositório.

**P-20 — Problemas semelhantes recebem soluções semelhantes.**
Se o mesmo professor já definiu uma solução para um problema em um ciclo, a mesma
solução é aplicada em qualquer outro ciclo dele onde o mesmo problema apareça. A
solução é do professor, não da escola — porque quem conduz é ele. Vale para qualquer
problema (posterior, adutor, rotadores, coordenação braço-perna, hiperlordose, etc.),
não só os exemplos citados. A regra transporta **soluções para problemas recorrentes**
(exercícios, correções, preparações), não conteúdo específico do ciclo (objetivo
geral, música, repertório).

**P-21 — Documentos publicados usam linguagem harmonizada.**
Descrições de sujeitos em documentos publicados (pacote HTML/PDF) são harmonizadas —
o fato permanece, o juízo sai. Termos como "ruim", "precária", "travado", "sem" são
reescritos ("insuficiente", "em construção", "a desenvolver", "a aprimorar"). O
material bruto (em `campo/`) preserva a linguagem original; o documento publicado usa
a versão harmonizada.

> **A harmonização é proposta, não imposição.** O professor revê a tabela bruto ×
> harmonizado do seu ciclo (`ciclo-XX-<escola>-harmonizacao.md`) e pode reescrever
> com as próprias palavras — ou manter o termo original, com nota de proveniência. O
> sistema não censura; ele oferece uma segunda chance de dizer o que se quis dizer.
>
> Cada resposta do professor gera uma **nova versão** do ciclo, reancorada; a
> anterior permanece no histórico. A proveniência acrescenta, não edita (P-03/P-04).

**P-22 — As condições materiais de execução são declaradas, registradas e comunicadas.**
Restrições físicas individuais (lesões, dores, limitações médicas) que impedem ou
alteram a execução de um movimento são:
**(a) declaradas** no PO antes do ciclo (na linha de base por sujeito);
**(b) registradas** no caderno a cada ocorrência durante a aula, e no relatório
pós-aula quando significativa;
**(c) comunicadas** à coordenação/direção (no caso do Ritmos, à Gabi) quando impedem o
trabalho.
O professor **não avalia** o que o sujeito não pode executar por restrição física —
apenas registra. A decisão sobre o que fazer não é dele.

## Nota metodológica

### PO latente × PO declarado

Todo ciclo já é um protocolo de observação — só que **latente**. Quando o plano
diz "ao final da aula, a aluna mantém o calcanhar no chão no demi-plié", ele está
enunciando uma **meta**; o mesmo enunciado, lido como **pergunta**, é "como o
calcanhar se comporta no demi-plié enquanto a aluna aprende?".

| | Ciclo (como já existe) | PO declarado (camada nova) |
|:--|:--|:--|
| Enunciado | meta: "construir X" | pergunta: "observar como X se constrói" |
| Quando se escreve | antes da aula | **antes do ciclo seguinte**, com base no que o anterior revelou |
| Função | conduzir a prática | preservar comparabilidade entre ciclos |
| Artefato | `ciclos/ciclo-XX-*.md` | o mesmo artefato + a declaração do PO |

**Não são dois documentos.** São duas leituras do mesmo artefato. A declaração do
PO de um ciclo é escrita com o relatório pós-aula do ciclo anterior em mãos
(P-02) — declarar depois de observar seria descrever o resultado, não a pergunta.

### Material × evidência

| | Material bruto (o que o ciclo produz) | Evidência (o que o PPQ produz) |
|:--|:--|:--|
| O que é | registro descritivo do que aconteceu: caderno, planos, relatórios | material classificado contra uma norma |
| Quando existe | durante e logo após a prática | depois da análise, sob condições metodológicas |
| O que falta para virar evidência | as quatro condições da P-07 | — |
| Risco de confundir | teleologia: chamar de prova o que ainda é registro | — |

As quatro condições da **P-07** — distância reflexiva, auditabilidade externa,
validação por pares e separação de papéis — não estão disponíveis **durante** a
aula. Enquanto não estiverem, o material permanece bruto e é assim que ele deve
ser tratado (inclusive nos textos que o citam).

### FIPP alinha; Git ramifica

O Git guarda **linhas** de desenvolvimento: ramos divergem, e um rebase pode
reescrever o passado de um ramo sem que o outro saiba. O FIPP guarda
**acúmulo**: o hash de um ciclo incorpora o hash do anterior, então mexer no
passado deixa o presente sem bater — e a verificação acusa.

```
hash_conteudo = SHA256(fontes do ciclo, em ordem determinística)
hash_fipp     = SHA256(id + ":" + type + ":" + parentHash + ":" + hash_conteudo)
```

- `id` = `ciclo-01-duo` · `type` = `Ciclo` · `parentHash` = hash FIPP do ciclo
  anterior (vazio no Ciclo 01) · `conteudo` = hash das fontes.
- As fontes são os `.conf` e os `.md` do ciclo; as saídas (HTML, PDF) **não**
  entram: são reconstruíveis (P-04).
- O `.fipp` é **versionado** — é a âncora da cadeia, não uma saída.

Implementação: [`tools/hash-ciclo.sh`](tools/hash-ciclo.sh), com validação de
schema ([`tools/validar-schema-ciclo.js`](tools/validar-schema-ciclo.js)) e
verificação no `pre-commit`.

## Como o PO se materializa no ciclo

O PO não é um documento paralelo ao ciclo: ele é **um arquivo do ciclo**.

| Item | Como funciona |
|:--|:--|
| **Um arquivo por ciclo** | `ciclos/ciclo-XX-po.md` — pergunta, fenômeno, campo empírico, contexto, sujeitos, norma, linha de base, critérios de inclusão e exclusão, justificativa (4 subcampos), condições de contorno da execução, limitações e checklist de validação |
| **Compartilhado pelas variantes** | o PO é do **ciclo**, não da escola: as três turmas leem o mesmo PO. O que muda por escola é o **caderno** (P-09) e o calendário (Pré-requisito 5) |
| **Entra no hash FIPP** | `tools/hash-ciclo.sh` cobre os `ciclos/ciclo-XX-*.md`, então o PO aparece na `cobertura` do `.fipp`. Mudar o PO sem regerar a âncora faz o `--check` acusar — e o `pre-commit` recusa o commit |
| **Registrado no `.fipp`** | os campos `po:` (caminho ou "ausente") e `po_state:` ficam gravados na âncora; ciclo sem PO declarado não é erro, é aviso |
| **Validação** | `tools/validar-po-ciclo.js` confere o PO contra `ciclos/ciclo-XX-po-schema.json`: campo ausente reprova; `[Preencher: ...]` é aceito como provisório |
| **Ciclo de vida do estado** | nasce em `state: Input_PO_Aguardando` e só passa a "Aprovado" quando **todos** os itens de `validationChecklist.required` estiverem marcados — hoje **seis**: fenômeno, escopo, norma, critérios, justificativa e factibilidade do recorte. A contagem é a do schema, não a desta tabela: item presente e desmarcado mantém o estado no aguardo. Pela **P-02**, o PO do ciclo seguinte se declara *usando* o relatório pós-aula deste |

> **O que o validador não faz:** ele não julga o conteúdo do PO — não avalia se a
> pergunta é boa nem se o recorte é fecundo. Ele garante que os campos existem,
> têm o tipo declarado e que o material provisório está visível como provisório.
> O resto é decisão da pesquisadora, e é por isso que o estado não avança sozinho.

## Relação com `REGRAS.md`

| Pergunta | Onde está a resposta |
|:--|:--|
| Como montar a aula (estrutura, volume, musicalidade)? | `REGRAS.md` — regras 1 a 17 |
| Que dados o professor precisa informar antes? | `REGRAS.md` — os 5 pré-requisitos |
| Como registrar o que aconteceu sem contaminar a aula? | [`protocolo/governanca-caderno.md`](protocolo/governanca-caderno.md) |
| Como declarar a pergunta que o próximo ciclo persegue? | este documento — P-01 e P-02 |
| Como provar que o material não foi reescrito depois? | este documento — P-03 e P-04 + `tools/hash-ciclo.sh` |
| Quando o material pode ser chamado de evidência? | este documento — P-05 e P-07 |

> **Regra de convivência:** nenhuma regra pétrea altera uma regra do `REGRAS.md`.
> Se um dia houver conflito, o conflito é sinal de que falta uma regra — não de
> que uma das duas deve ceder em silêncio.

