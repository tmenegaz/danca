# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-11-02T23:22:24-0300`
Commit atual: `5e109c1` — feat(estrutura): a fotografia datada, o dono do termo e o `--escola`
Para: sessão nova (retomar o diálogo)

**Este arquivo EXTRAI; não julga.** O que se pode afirmar sobre o estado — o que
funciona, o que não, o que está decidido, o que é ainda hipótese — está em
`ESTADO-ATUAL.md`, a fotografia curada, com etiquetas factuais. Leia-o depois deste:
aqui está onde o repositório está; lá está o que se pode dizer dele.

## O que é este projeto

**Nome comercial:** o produto é o **Sistema Lastro** — e este repositório é o **Projeto
Ciclo**, o protótipo a partir do qual ele se constrói. Os dois nomes convivem, e a
convivência é declarada (não é renomeação): **Lastro** é a marca curta; **Sistema Lastro**
é o sistema como um todo; **Plataforma Lastro** destaca a solução tecnológica; e
`Lastro — Sistema de Memória e Observabilidade Pedagógica em Dança` é a **proposta** de
denominação descritiva (proposta, não subtítulo confirmado). O conceito central não muda:
o Lastro **registra e organiza evidências para apoiar a reflexão pedagógica; não substitui
o professor nem toma decisões sobre o aluno.** O mapa de evolução do produto está em
`PLANEJAMENTO-LASTRO.md`.

**A memória da aula dada** — cada aula é **planejada** antes de ser dada: o plano
(`aula-NN.md`, fonte da âncora) fixa objetivo, marcos e volume, e é ele que dá a
**linha de base**. O que se registra é o processo de ensino-aprendizagem que de fato
se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.

- **Planejar e registrar são coisas distintas — e as duas acontecem.** O plano é
  **intenção** (editável enquanto a aula está `planejada`); depois que a aula acontece,
  o registro passa a **fato** e só se acrescenta ajuste (`ARQUITETURA-AULA.md`). O
  estado é **derivado** do cronograma, do prazo e do registro — não existe campo
  "aula dada". O formulário de lançamento **consome o plano** como
  entrada: sem ele não há marco da aula nem "o que mudou em relação ao plano".

- **Não é o projeto de mestrado** (outro diretório, de onde vêm o PO e o FIPP).
- **Não implementa o FIPP**: o `.fipp` daqui é uma **âncora de proveniência
  encadeada** (`tools/hash-ciclo.sh`), aproximação do framework — não ele.
- **PROTÓTIPO, testado no universo da dança** — este projeto **não é agnóstico**; o
  projeto agnóstico será criado a partir dele. Nenhum ciclo é igual a outro, nenhuma
  aula é igual a outra — nem com o mesmo professor.
- **Não avalia** — registra o cotidiano do professor; a avaliação é fronteira de
  outro módulo, ainda não desenhado.
- **Proveniência acrescenta, não edita**: um ajuste é um elo novo, nunca sobrescrita.
- **A integração ainda não existe** — com o projeto das secretarias não foram
  desenhadas nem a fronteira de entrada nem a de saída.

## Estado do projeto

- **Regras:** 17 em `REGRAS.md`
  + **22 pétreas** em `PROTOCOLO.md`
- **Professores:** acucar-branco
cafe-no-bule
coqui-de-redinha
luz-azul
manga-curta
meia-cortada
meia-ponta
murisoca-baiana
oculos-redondo
pe-junto
pe-torto
perna-boa
pirueta-aberta
sapo-bailarino
so-para-direita
teclado-abnt
tela-de-celular
tiago-menegaz
vaso-bonito (19)
- **Ciclos com manifesto:** 1 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola.
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **treze frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
5e109c1 feat(estrutura): a fotografia datada, o dono do termo e o `--escola`
4e1593a docs(biblioteca): a cláusula 1 diz de onde vem a data enquanto não há contrato
885a2ad docs(registro): a fotografia da licença e da camada herdada
890937a feat(estrutura): a licença em texto, a edição paga e a camada herdada
026c281 fix(estrutura): a repetição na decomposição, e o número que mudou no remoto
76d023c docs(registro): a fotografia dos dois produtos, e o que eles ainda não são
9760028 feat(estrutura): o motor dos produtos — o dicionário e o syllabus, gerados do catálogo
23d4c0e feat(notacao): declarar «Plié» (4|2/4) no alfabeto bale-classico
2a59d98 docs(registro): a segunda passagem sobre a mesma tela, e o que ela reverteu
dbb5ade fix(notacao): o rótulo em Title Case, a navegação que trava e o «Apagar» fora do passo 6
0e2ac45 fix(experimentos): as provas deixam de depender do conteúdo editorial do alfabeto
5dcfcf0 feat(notacao): proveniência do verbete — o DELETE guardado e a edição por ajuste
f64d54e chore(notacao): apagar o verbete «Grand battement» no alfabeto bale-classico
063dee1 chore(notacao): apagar o verbete «Battement fondu» no alfabeto bale-classico
4c90f58 chore(notacao): apagar o verbete «Battement dégagé» no alfabeto bale-classico
965faa8 chore(notacao): apagar o verbete «Arabesque» no alfabeto bale-classico
c6ce738 chore(notacao): apagar o verbete «Port de bras» no alfabeto bale-classico
ae7f5f3 chore(notacao): apagar o verbete «Relevé» no alfabeto bale-classico
8259894 chore(notacao): apagar o verbete «Rond de jambe» no alfabeto bale-classico
fa4ab07 chore(notacao): apagar o verbete «Rond de jambe à terre» no alfabeto bale-classico
```

## Por professor

### acucar-branco — 0 ciclo(s)

### cafe-no-bule — 0 ciclo(s)

### coqui-de-redinha — 1 ciclo(s)

**Ciclo 01** — variante(s): breu

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| breu | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| breu | ciclo-01-breu.fipp | `984c97ffc7a1` | (vazio) | — |

### luz-azul — 0 ciclo(s)

### manga-curta — 0 ciclo(s)

### meia-cortada — 0 ciclo(s)

### meia-ponta — 0 ciclo(s)

### murisoca-baiana — 0 ciclo(s)

### oculos-redondo — 0 ciclo(s)

### pe-junto — 0 ciclo(s)

### pe-torto — 1 ciclo(s)

**Ciclo 01** — variante(s): 

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|

### perna-boa — 0 ciclo(s)

### pirueta-aberta — 0 ciclo(s)

### sapo-bailarino — 1 ciclo(s)

**Ciclo 01** — variante(s): 

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|

### so-para-direita — 0 ciclo(s)

### teclado-abnt — 0 ciclo(s)

### tela-de-celular — 1 ciclo(s)

**Ciclo 01** — variante(s): 

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|

### tiago-menegaz — 0 ciclo(s)

### vaso-bonito — 0 ciclo(s)

## Pétreas (`PROTOCOLO.md`)

- **P-01 — O ciclo é PO latente.
- **P-02 — O PO declarado de um ciclo vem do ciclo anterior.
- **P-03 — FIPP alinha; Git ramifica.
- **P-04 — Hash SHA-256 sobre fontes, versionado.
- **P-05 — O ciclo produz material, não evidência.
- **P-06 — O caderno de ciclo é descritivo, não analítico.
- **P-07 — Nenhuma classificação tácito/arquivo sem as quatro condições.
- **P-08 — Os campos do ciclo são declarados em schema.
- **P-09 — Um caderno por ciclo, por escola.
- **P-10 — O PO declara a linha de base dos sujeitos.
- **P-11 — O PO declara as condições de contorno da execução.
- **P-12 — Os sujeitos são referidos por apelidos estáveis.
- **P-13 — Cada professor tem o seu próprio PO.
- **P-14 — O PO pode derivar de um PO de departamento.
- **P-15 — A notação segue a metodologia declarada.
- **P-16 — Metodologia e notação são declaradas na Elicitação.
- **P-17 — Todo ciclo produz os mesmos tipos de artefato do ciclo piloto.
- **P-18 — A metodologia pode ser imposta pela escola.
- **P-19 — Os prompts do projeto vivem no repositório.
- **P-20 — Problemas semelhantes recebem soluções semelhantes.
- **P-21 — Documentos publicados usam linguagem harmonizada.
- **P-22 — As condições materiais de execução são declaradas, registradas e comunicadas.

## Regras (`REGRAS.md`)

- **1. Terminologia RAD**
- **2. Fio condutor**
- **3. Estrutura espacial**
- **4. Condições preliminares**
- **5. Carga e volume**
- **6. Métrica musical**
- **7. Causa e consequência**
- **8. Proveniência objetiva**
- **9. Distribuição de volume**
- **10. Estrutura de ciclos (com calendário)**
- **11. Pensamento sistêmico**
- **12. Observação pedagógica**
- **13. Apanhado histórico**
- **14. Viés de agenciamento**
- **15. Musicalidade**
- **16. Formato de entrega**
- **17. Versionamento com Git**

## Última entrada do REGISTRO

## 02/11/2026 — A fotografia datada, o dono do termo, e o plano que vai para o `.conf`

**O que motivou.** Três perguntas dela, na mesma mensagem, e as três eram sobre **onde uma coisa
vive**. (1) A licença está escrita, mas a cláusula 1 exige uma fotografia datada e o contrato não
existe — «tem que colocar no registro que vai ficar uma pendência, porque por enquanto vai ser
apenas uma string». (2) A fase 1: «o problema é o caminho escrito, né?» — é, e ela propôs a saída:
«acrescente um campo que distingue que aquilo pertence à escola». (3) O plano comercial: «não vai
viver no KV. Pode viver no repositório ou pode viver no `.conf`» — e a escolha é o `.conf`.

**O que foi decidido.**

- **A fotografia datada é DERIVADA, e a pendência fica declarada.** O produto cita
  `catalogo@AAAA-MM-DD` tirado do **último commit que tocou o catálogo** — a mesma técnica que
  tornou o PDF reprodutível (`SOURCE_DATE_EPOCH`) —, nunca o relógio. **Medido: `catalogo@2026-11-02`
  (`23d4c0e`)**, e a mesma entrada dá a mesma data em duas execuções. **A pendência, por escrito:**
  ela diz «a versão do catálogo nesta data», **não** «a versão que esta escola contratou». Essa é do
  **contrato** (C8), e no dia em que ele existir **a data dele vence**. Deixa de ser **impeditivo** e
  passa a ser **dívida nomeada**: o critério 8 do plano **passa**, com a pendência declarada.
- **O dono do termo é um CAMPO, e não um ficheiro.** `escola` ausente = termo do catálogo;
  `escola: '<slug>'` = termo daquela escola. **Porquê:** o Worker lê o vocabulário do **bundle**
  (`require` de caminho fixo, embutido pelo esbuild), e um ficheiro de caminho variável
  (`biblioteca/escolas/<escola>/vocabulario.json`) **não** pode ser embutido. O escritor grava o dono
  no termo (`termo-repo.js`), o leitor separa-o pela mesma função (`separarPorEscola` + `compor`, em
  `comum.js`), e o `--escola` do CLI entrega a edição da escola. **Não há nada a migrar:** medido, os
  **5** commits que tocaram o vocabulário não têm a mensagem do formulário (`acrescentar «…»`) —
  nenhum termo foi criado pela tela até aqui.
- **O catálogo NÃO se puxa para dentro do domínio do professor.** A pergunta era justa — «a
  `biblioteca` está fora do domínio do professor?» — e a resposta é **sim, de propósito**: é o
  **terceiro dono**, o que se vende (camada B, §10.1). Puxá-lo para `professores/<professor>/` faria
  uma cópia por professor, e a primeira palavra nova punha as cópias a divergir — que é exactamente a
  cópia que o `termo-repo.js` matou em 28/10/2026. O que impede a contaminação entre escolas é o
  **dono no termo**, não o sítio do ficheiro.
- **O plano comercial vive no `ESCOLA.conf`, e nunca no KV.** Decisão dela a 02/11/2026, na parte da
  **C11** que faltava: «o conf faz o negócio acontecer e fica lá no repositório, e não há custo de
  KV». O `ESCOLA.conf` **ainda não existe**; enquanto não existir, `habilitada`/`pagante` continuam
  em `raiz/escolas-habilitadas.json`, andaime que já declara a própria morte.

> **Correção de 02/11/2026 (mesmo dia, minutos depois).** O bullet acima escreve `ESCOLA.conf` como
> se fosse um ficheiro — **e não é.** Ela corrigiu: «o conf que eu me referi foi de forma genérica,
> não especificamente o `ESCOLA.conf`». **Medido: nenhum `ESCOLA.conf` existe** no repositório. O que
> existe, versionado e por escola, é `escola/<slug>/indice.json` (que já guarda `estado`,
> `arquivos` e o histórico de `expurgo`) e os `vars` de `wrangler.<slug>.jsonc` (`ESCOLA_SLUG`,
> `ESCOLA_HABILITADA`); os segredos vivem nos **secrets** do Worker. A decisão **não muda no que
> importa** — o estado comercial vai para o **repositório, e nunca para o KV** —, e a norma do
> `PROTOCOLO.md` de 01/11/2026 confirma-o: o KV é do **cadastro dos Bastidores**, e o estado
> comercial não é cadastro. O que fica **PENDENTE** é só **onde a chave entra**: em
> `indice.json → estado`, ou num `ESCOLA.conf` próprio, que continua a ser o destino da
> **declaração pedagógica**.
>
> **E o mesmo exercício derrubou outra frase.** O `IDEIA-PAINEL-ESCOLA.md` abria com «Nada disto
> está implementado» — falso: o grupo **Bastidores** está no menu do sistema desde 15–18/10/2026, e
> a **Produção** serve sete secções (`bastidores.js:3008-3017`): **Painel inicial** (vazio por
> desenho) · **Configuração · Aparência** · **Pessoas · Professores e Alunas** · **Pedagogia ·
> Turmas, Verbetes da notação e Curadorias**. O documento ganhou uma tabela medida (§2.1) e notas
> datadas onde dizia o contrário (§9, §10, §11, §17.3, §17.4, §17.5). A redação anterior não é
> apagada: ela é o elo de antes.

**Onde entrou.** `motor/produtos.js` — `fotografiaDoCatalogo()` (git, não relógio), `--escola` e
`--edicao`, e a fotografia passada ao núcleo (a fronteira é a do `SOURCE_DATE_EPOCH`: o `git` existe
no CLI, não no núcleo) · `motor/nucleo/produtos/comum.js` — `separarPorEscola()`, `compor()` (a única
precedência: a escola vence) e `rotuloDaFotografia()`, com a nota do porquê do campo e não do
ficheiro · `motor/nucleo/produtos/dicionario.js` e `syllabus.js` — a fotografia no cabeçalho, a
lacuna `sem-fotografia`, e o dono no manifesto · `motor/servidor/termo-repo.js` — `escola` no termo
e a colisão por **(dono, id)**, e não só por `id` · `motor/servidor/produtos.js` —
`prepararCatalogo()` · `motor/servidor/bastidores.js` — `termos(kv, escola)` a compor pela mesma
função, e o termo a nascer com `env.ESCOLA_SLUG` · `experimentos/provar-produtos.js` — **§L** e
**§M** (73 → **89**) · `experimentos/provar-verbete.js` — as asserções do dono ·
`biblioteca/LICENSE.md` §1 — a nota de onde vem a data (commit `4e1593a`) ·
`ARQUITETURA-GERAL.md` §10.1 — a nota datada do sítio da camada C ·
`PLANEJAMENTO-LASTRO.md` — a nota datada na **C11** (a metade do «onde», e o que continua aberto) ·
`PLANO-PRODUTOS-DO-MOTOR.md` — fase 1, fase 4, §7-E, §9-5, §9-8, §10-4 e §11 ·
`IDEIA-PAINEL-ESCOLA.md` — §2.1 (a tabela medida do que está construído), §9, §10 (o campo
`PLANO` e o nome que não existe), §11, §17.3, §17.4 e §17.5 · `ESTADO-ATUAL.md` · `REGISTRO.md`.

**Motivo declarado — os congelados.** **Nenhum** ficheiro de `CONGELAMENTO.md` foi tocado.
`biblioteca/LICENSE.md` **não** está na lista congelada (o congelado em `biblioteca/` é só o
`guia-do-professor.md`), e é por isso que a nota da cláusula 1 pôde ser escrita sem motivo declarado
— ainda assim, em commit próprio (`4e1593a`), como o próprio texto exige.

**Com o quê.** `motor/produtos.js` · `motor/nucleo/produtos/comum.js` ·
`motor/nucleo/produtos/dicionario.js` · `motor/nucleo/produtos/syllabus.js` ·
`motor/servidor/termo-repo.js` · `motor/servidor/produtos.js` · `motor/servidor/bastidores.js` ·
`experimentos/provar-produtos.js` · `experimentos/provar-verbete.js` · `biblioteca/LICENSE.md` ·
`ARQUITETURA-GERAL.md` · `PLANEJAMENTO-LASTRO.md` · `PLANO-PRODUTOS-DO-MOTOR.md` ·
`IDEIA-PAINEL-ESCOLA.md` · `ESTADO-ATUAL.md` · `REGISTRO.md`.

**Referências.** `ARQUITETURA-GERAL.md` §10.1–§10.3 (as três camadas e a concessão da escola) ·
`PLANO-PRODUTOS-DO-MOTOR.md` §8-fases 1 e 4 e §9-critérios 5 e 8 · `PLANEJAMENTO-LASTRO.md` C11 (o
estado comercial) e C8 (o contrato) · `IDEIA-PAINEL-ESCOLA.md` §10 (o `ESCOLA.conf`) · L9 (a trava
não pode ser punição ao dado) · P-16 (declarar, nunca deduzir) · `SOURCE_DATE_EPOCH`
(`tools/gerar-ciclo.sh:367`).

**O que se mediu.**

| Verificação | Resultado |
|:--|:--|
| `provar-produtos` | **89 asserções, TUDO CERTO** (eram 73). **§L** a fotografia: a forma `catalogo@AAAA-MM-DD` com o commit, **a mesma duas vezes seguidas** (não é o relógio), catálogo inexistente **não inventa data**, a lacuna `sem-fotografia` quando não há, e a licença citável a levá-la. **§M** o dono: sem dono = catálogo; sem `--escola` as adições de todas ficam **declaradas** em `deOutras`; o dicionário do catálogo não tem o termo de A nem o de B; a edição de A tem o de A e **não** o de B; e o `--escola` do CLI chega ao manifesto |
| `provar-verbete` | **TUDO CERTO** — o CRUD do verbete continua a gravar no repositório sem tocar no vocabulário |
| `check-identidade` | **20/20 `ok`** — nada na tela mudou, e a checagem confirma-o |
| **a fotografia, no catálogo de hoje** | `catalogo@2026-11-02` (`23d4c0e`) — calculada do `git`, e igual em duas execuções |
| **as lacunas do dicionário** | **147**, as mesmas de antes: a `sem-fotografia` **não** aparece, porque a data existe |
| **a edição paga** | **25 definições fora**, o mesmo número da §10.4 |
| `git fetch origin` | **FALHOU**, e a causa é o ambiente: `could not read Username for 'https://github.com'` (não há credenciais nesta sessão). `origin/main` fica no último valor conhecido, `885a2ad`. O local está **1 commit à frente** (`4e1593a`, por publicar) e a árvore de trabalho tem as alterações deste marco **por commitar**. *(Não se afirma que o remoto não mudou: não foi possível olhá-lo.)* |
| **o que NÃO foi medido** | o contrato (C8) · a chave `plano` num ficheiro do repositório (`ESCOLA.conf` não existe) · a **fase 1** ao pé da letra (um ficheiro só) · a **fase 3** (a âncora do produto) · a **aula pronta** (não existe) · os três `exige/ensina/expressa` continuam a **0 das 9 unidades** (P-16) |

**O que ainda não está feito.** (a) **A fotografia é derivada** — a pendência está declarada e deixa
de ser impeditivo, mas continua a **não** ser a data do contrato: no dia em que C8 existir, há que
voltar aqui e trocar a string pela data e versão contratadas. (b) **A fase 1 fica pela metade**, e é
honesto dizê-lo: o critério 5 passa na substância (A não contamina B) e **não** ao pé da letra (o
ficheiro é um). (c) **O `ESCOLA.conf` não existe** — e não é um ficheiro, é uma intenção: a C11
decidiu o **sítio** (o repositório, nunca o KV) e falta decidir **onde a chave entra**. (d) **A aula
pronta** não foi começada; a **fase 3** (âncora do produto) e a **5** (índice) continuam por fazer.
(e) **O conteúdo** dos três campos e o mapa nível→termos são dela. (f) **O remoto foi conferido
depois de o token ser lido**: `git fetch origin` com o `GITHUB_TOKEN` de `.dev.vars` (via
`GIT_ASKPASS` — a variável que faltava) deu `origin/main` em **`885a2ad`**, **zero** commits atrás e
**um** à frente (`4e1593a`).

## O que está pendente

## 01/11/2026 — A aula deixa de afirmar o que ninguém escreveu: cinco secções, cinco origens


- **O bloco de musicalidade continua sem pergunta nos formulários.** O `porta/plano/conteudo/plano.json`
  não tem campo de musicalidade — o texto de ajuda da `distribuicao-de-volume` até promete «A
  musicalidade não entra aqui: ela tem o bloco dela», e o bloco dela nunca teve campo. A §4 agora
  declara a lacuna em vez de a disfarçar com um rótulo; o campo é que falta, e é decisão de desenho.

  **Correção de 02/11/2026 — a premissa estava errada, e o «campo que falta» não falta.** «Não tem
  que existir uma pergunta. Isso já está elaborado pelo professor lá na produção (…) automaticamente
  isso já é respondido.» O professor declara, no VERBETE, a grade das contagens de cada exercício
  (por música: `8|4/4` → cada célula com a sua contagem), e no PLANO os tempos e o compasso de cada
  linha da sequência. Os dois juntos são o trabalho musical — pulso é a contagem, acento é o tempo
  do compasso em que ela cai, frase é o exercício inteiro sobre a música. O que faltava não era uma
  pergunta: era a secção **consolidar** o que já existe. Ver a entrada de 02/11/2026.
- **`provar-aula-prosa` e `provar-escopo-da-aula` estão vermelhas por fixture, não por código.** A
  primeira aponta para `professores/perna-boa/ciclos/ciclo-01-batata-…`, a segunda para
  `escola/batata/envelopes/plano-20261027-1025.json` — ambos apagados por expurgos anteriores. Já
  falhavam em `HEAD`, e não foram corrigidas aqui: uma prova que aponta para uma escola expurgada é
  uma pergunta que se responde escolhendo outra fixture, não um defeito do gerador.

## 02/11/2026 — A segunda passagem sobre a mesma tela: rótulos, travões e o «Apagar» fora do passo 6

(a) A árvore **não foi commitada** — a entrega está no worktree, e o
`TRANSFERENCIA-IA.md` di-lo. (b) O `provar-teste` continua vermelho numa asserção de frequência, e a
investigação dessa asserção não faz parte desta entrega. (c) O `TRANSFERENCIA-IA.md` **não foi
regenerado** — a fotografia ficou actualizada, mas o documento de transferência é da sessão
anterior. (d) As entidades `termo` e `verbete` do índice estão **declaradas, não emitidas**: o
gerador continua a não as produzir, e a emissão exige decidir o que fazer com a segunda cópia do
vocabulário.

---

## 02/11/2026 — O motor dos produtos: o dicionário e o syllabus, e o que eles se recusam a inventar

(a) **A aula pronta** — o terceiro produto, e o próximo passo de
código: a Regra 9 como norma lida, o teto da faixa, os tempos por unidade. (b) **A fase 1 continua
pela metade**: a composição existe, os **ficheiros não** — `termo-repo.js` escreve no vocabulário do
catálogo, e o critério 5 do plano («criar um termo numa escola não altera o ficheiro do catálogo»)

## 02/11/2026 — A licença em texto, a condição de conteúdo executável, e a camada que se herda

(a) **A fotografia datada** — a cláusula 1 da licença diz
`catalogo@AAAA-MM-DD`, e a data vem do contrato: é **de negócio**, e o critério 8 do plano passa

## 02/11/2026 — A fotografia datada, o dono do termo, e o plano que vai para o `.conf`

(a) **A fotografia é derivada** — a pendência está declarada e deixa
de ser impeditivo, mas continua a **não** ser a data do contrato: no dia em que C8 existir, há que
voltar aqui e trocar a string pela data e versão contratadas. (b) **A fase 1 fica pela metade**, e é
honesto dizê-lo: o critério 5 passa na substância (A não contamina B) e **não** ao pé da letra (o
ficheiro é um). (c) **O `ESCOLA.conf` não existe** — e não é um ficheiro, é uma intenção: a C11
decidiu o **sítio** (o repositório, nunca o KV) e falta decidir **onde a chave entra**. (d) **A aula
pronta** não foi começada; a **fase 3** (âncora do produto) e a **5** (índice) continuam por fazer.
(e) **O conteúdo** dos três campos e o mapa nível→termos são dela. (f) **O remoto foi conferido
depois de o token ser lido**: `git fetch origin` com o `GITHUB_TOKEN` de `.dev.vars` (via
`GIT_ASKPASS` — a variável que faltava) deu `origin/main` em **`885a2ad`**, **zero** commits atrás e

## Pendências anteriores (índice)

- **18/09/2026** — PO do Ciclo 01 — Duo validado → `REGISTRO.md` L9
- **18/09/2026** — Estrutura por professor (P-13, P-14) e migração do material → `REGISTRO.md` L46
- **18/09/2026** — Publicação do repositório no GitHub (decisão da… → `REGISTRO.md` L83
- **18/09/2026** — Pacotes de ciclo passam a ser versionados (deploy… → `REGISTRO.md` L112
- **18/09/2026** — Ciclo próprio por escola: a Ritmos deixa de ser cópia da Duo → `REGISTRO.md` L145
- **18/09/2026** — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19 → `REGISTRO.md` L201
- **18/09/2026** — PO do Ritmos validado + P-22 → `REGISTRO.md` L264
- **18/09/2026** — Publicação, primeira reancoragem da Duo e o caderno da Aula… → `REGISTRO.md` L313
- **19/09/2026** — Congelamento da infraestrutura → `REGISTRO.md` L358
- **19/09/2026** — Criptografia dos acompanhamentos (exceção pós-congelamento) → `REGISTRO.md` L407
- **19/09/2026** — Política de segurança dos dados sensíveis → `REGISTRO.md` L481
- **19/09/2026** — Caderno publicado e incluído no hash → `REGISTRO.md` L515
- **19/09/2026** — Método, README-ciclos e campos de duração → `REGISTRO.md` L552
- **19/09/2026** — README-ciclos: escopos e criação de ciclo → `REGISTRO.md` L594
- **19/09/2026** — Correções cosméticas → `REGISTRO.md` L615
- **19/09/2026** — Varredura de marcas de indecisão → `REGISTRO.md` L647
- **19/09/2026** — METODO no pacote e reorganização do menu → `REGISTRO.md` L691
- **20/09/2026** — O guia de observação passa a se chamar o que ele é → `REGISTRO.md` L748
- **20/09/2026** — O contrato de extração passa a ler tabela → `REGISTRO.md` L790
- **20/09/2026** — O índice da página sai do topo e vai para a direita, preso → `REGISTRO.md` L847
- **20/09/2026** — O contrato de extração vira lib (definição única) → `REGISTRO.md` L890
- **20/09/2026** — O contrato ganha as duas declarações (mapa de colunas e… → `REGISTRO.md` L932
- **20/09/2026** — O extrator do plano (o irmão), e o diff classificado → `REGISTRO.md` L976
- **20/09/2026** — O laço de validação vira lib (a segunda definição única) → `REGISTRO.md` L1039
- **20/09/2026** — O pre-commit passa a validar o PLANO (schema + tipos) → `REGISTRO.md` L1081
- **20/09/2026** — O experimento passa a consumir o extrator (o ciclo fecha) → `REGISTRO.md` L1127
- **20/09/2026** — O fenômeno do PO é uma LISTA (o schema declarava string) → `REGISTRO.md` L1167
- **20/09/2026** — O escopo `experimentos` entra na lista do commit-msg → `REGISTRO.md` L1208
- **20/09/2026** — A tabela de escopos do REGRAS.md passa a listar os 27 do… → `REGISTRO.md` L1244
- **20/09/2026** — Peça 1: o JSON de dados do Duo entra como fonte → `REGISTRO.md` L1275
- **20/09/2026** — Peça 2: os builders das vistas saem para uma lib → `REGISTRO.md` L1320
- **20/09/2026** — O gerador passa a GERAR a vista (peça 3 da migração) → `REGISTRO.md` L1370
- **20/09/2026** — O guia gerado passa a emitir a data da aula → `REGISTRO.md` L1424
- **20/09/2026** — A linha de base renderiza o texto como veio (nada de… → `REGISTRO.md` L1471
- **20/09/2026** — O guia do Ritmos passa a ser gerado (peça 5) — e o render… → `REGISTRO.md` L1514
- **20/09/2026** — O `pre-push` passa a existir — e a conferência do… → `REGISTRO.md` L1575
- **20/09/2026** — O gerador grava os JSONs do formulário no pacote (Fase 2.1) → `REGISTRO.md` L1616
- **20/09/2026** — O JSON de dados vai para o pacote cifrado (Fase 2.2) → `REGISTRO.md` L1697
- **20/09/2026** — O formulário de lançamento vai para produção (Área do… → `REGISTRO.md` L1754
- **20/09/2026** — A folha de captura vira config legível por máquina… → `REGISTRO.md` L1990
- **22/09/2026** — Agentes de workspace: geração, auditoria e apresentação → `REGISTRO.md` L2303
- **23/09/2026** — A identidade do projeto entra na documentação (e a ressalva… → `REGISTRO.md` L2355
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2436
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2517
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2608
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2676
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o plano… → `REGISTRO.md` L2751
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que era… → `REGISTRO.md` L2862
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3062
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3193
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3367
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3488
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3641
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3790
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3990
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4224
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4417
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4684
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4886
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por aula… → `REGISTRO.md` L5167
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5327
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5481
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas deixam… → `REGISTRO.md` L5670
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única página… → `REGISTRO.md` L5872
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5985 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6177
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6335
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6499
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação passa… → `REGISTRO.md` L6634
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6754
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6870
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7208
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só o… → `REGISTRO.md` L7309
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7435 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7556 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7681 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7829
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7956
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8026 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8104
- **30/09/2026** — O segundo papel do agente: o servidor local **não existe**;… → `REGISTRO.md` L8193
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO.md` L8280
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO.md` L8421
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO.md` L8542
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO.md` L8656
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO.md` L8773
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83 e… → `REGISTRO.md` L8925
- **07/10/2026** — O prompt de elicitação herda oito decisões do formulário do… → `REGISTRO.md` L9053
- **09/10/2026** — A criação de escola vira um comando: o CLI de scaffolding,… → `REGISTRO.md` L9293
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO.md` L9345
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO.md` L9398
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o «Início» e a… → `REGISTRO.md` L9451
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO.md` L9520
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO.md` L9574
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO.md` L9616
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO.md` L9692
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica… → `REGISTRO.md` L9741
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar os… → `REGISTRO.md` L9798
- **12/10/2026** — O plano de ensino ganha estante, edição em sítio e… → `REGISTRO.md` L9857
- **12/10/2026** — A arquitetura geral ganha documento próprio (arquivo, não… → `REGISTRO.md` L9900
- **12/10/2026** — O botão «Criar nova escola» alinha o menu da Área do… → `REGISTRO.md` L9934
- **12/10/2026** — O CLI «criar-escola» alinha o menu zero ao plano de ensino → `REGISTRO.md` L9966
- **12/10/2026** — A página de entrada ganha o «Plano de ensino» → `REGISTRO.md` L10004
- **12/10/2026** — A raiz nunca é desabilitada pelo freio de escola → `REGISTRO.md` L10058
- **12/10/2026** — O rodapé do ciclo zero lista os três itens da Área do… → `REGISTRO.md` L10096
- **12/10/2026** — A folha de captura ganha rótulo curto e transposição → `REGISTRO.md` L10133
- **12/10/2026** — A senha de criptografia da Maria nasce mockada e chega ao CI → `REGISTRO.md` L10179
- **12/10/2026** — O PO referencia o plano por id e para de duplicar o… → `REGISTRO.md` L10213
- **12/10/2026** — O Diaghilev sai por expurgo DIRETO, e a trava de identidade… → `REGISTRO.md` L10262
- **12/10/2026** — O hook de expurgo nasce e passa o teste no Diaghilev II → `REGISTRO.md` L10350
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha a… → `REGISTRO.md` L10415
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO.md` L10464
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO.md` L10519
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO.md` L10572
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor completo… → `REGISTRO.md` L10640
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo (Estúdio… → `REGISTRO.md` L10703
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO.md` L10767
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO.md` L10850
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se mantém… → `REGISTRO.md` L10881
- **13/10/2026** — O professor é o dono, a Produção pede senha e o professor… → `REGISTRO.md` L10905
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO.md` L10945
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco posições;… → `REGISTRO.md` L10975
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é por… → `REGISTRO.md` L11010
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva ao… → `REGISTRO.md` L11038
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO.md` L11077
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO.md` L11125
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO.md` L11163
- **13/10/2026** — A curadoria nasce: a escola atribui a cada professor o que… → `REGISTRO.md` L11196
- **13/10/2026** — Metodologia e notação chegam ao PO (ligar L5 — Bloco 8.2) → `REGISTRO.md` L11229
- **13/10/2026** — A tela consome a curadoria: plano/PO travam sem curadoria e… → `REGISTRO.md` L11256
- **13/10/2026** — Bastidores quebrou: a página da Produção referia `env` fora… → `REGISTRO.md` L11294
- **13/10/2026** — A grelha das tabelas: a rubrica, as turmas em plural, o… → `REGISTRO.md` L11317
- **13/10/2026** — A rubrica: o conteúdo alinha-se à decisão (Bloco 10,… → `REGISTRO.md` L11421
- **13/10/2026** — A grelha não chegava à porta: duas listas brancas engoliam… → `REGISTRO.md` L11460
- **14/10/2026** — A régua da turma mede o critério no LANÇAMENTO (frente B9) → `REGISTRO.md` L11500
- **14/10/2026** — O PO completo chega inteiro aos derivados (frente B10) → `REGISTRO.md` L11589
- **14/10/2026** — O plano completo chega inteiro aos derivados (frente B11) → `REGISTRO.md` L11690
- **15/10/2026** — O Sistema Lastro: o nome comercial, e o mapa de evolução do… → `REGISTRO.md` L11829
- **15/10/2026** — A dimensão observada deriva do PLANO (e o vocabulário do PO… → `REGISTRO.md` L12160
- **15/10/2026** — A cifra do Worker respeita o teto do runtime, e a falha… → `REGISTRO.md` L12278
- **15/10/2026** — A geração publica: o deploy entra na cadeia → `REGISTRO.md` L12378
- **15/10/2026** — O guarda do pre-push passa a conferir a última linha do… → `REGISTRO.md` L12442
- **15/10/2026** — A criação da escola diz onde guardar a senha de criptografia → `REGISTRO.md` L12502
- **15/10/2026** — O prefixo do nome separa a chave da cifra da senha de acesso → `REGISTRO.md` L12571
- **15/10/2026** — O arquivo de senhas vira um espelho por escola → `REGISTRO.md` L12644
- **15/10/2026** — A chave de cifra vira interna do Worker: ninguém a vê,… → `REGISTRO.md` L12724
- **15/10/2026** — O lançamento da aula confere a senha e grava cifrado no… → `REGISTRO.md` L12837
- **15/10/2026** — O expurgo da escola sai do comando e vira botão, na raiz → `REGISTRO.md` L12919
- **15/10/2026** — O expurgo apagava a escola e deixava o cadastro das alunas… → `REGISTRO.md` L13026
- **15/10/2026** — `Buffer` não existe no runtime dos Workers: o expurgo não… → `REGISTRO.md` L13135
- **15/10/2026** — O gerador do HANDOFF quebrava com o repositório sem escola → `REGISTRO.md` L13242
- **15/10/2026** — O expurgo apagou o MODELO: a escola `ponta` não pôde nascer → `REGISTRO.md` L13278
- **15/10/2026** — Criar escola para o professor do MODELO: o `cp` recusava o… → `REGISTRO.md` L13339
- **15/10/2026** — Um conserto commitado e não publicado não conserta nada → `REGISTRO.md` L13392
- **15/10/2026** — O professor homônimo: o identificador é o slug, e o… → `REGISTRO.md` L13435
- **15/10/2026** — O molde sai de `professores/`: molde não é professor → `REGISTRO.md` L13517
- **16/10/2026** — «Nós, Por Exemplo» sai: a página é a apresentação, e o nome… → `REGISTRO.md` L13595
- **16/10/2026** — A identidade visual tem seis famílias em estudo, e o… → `REGISTRO.md` L13665
- **16/10/2026** — A tela diz de quem é a ficha, e o obrigatório se anuncia → `REGISTRO.md` L13768
- **16/10/2026** — A senha autoriza o ATO, não a SESSÃO → `REGISTRO.md` L13873
- **16/10/2026** — A data da ficha é a da última mudança — e a edição do plano… → `REGISTRO.md` L13996
- **16/10/2026** — O carimbo é a hora da escola, não a do servidor → `REGISTRO.md` L14115
- **16/10/2026** — A estante pagina de seis em seis, o roteiro é só da… → `REGISTRO.md` L14205
- **16/10/2026** — A sequência de exercícios chega ao `plano-XX.json` (e o… → `REGISTRO.md` L14321
- **16/10/2026** — O ciclo passa a ser DA TURMA (fase 1: a identidade da fonte) → `REGISTRO.md` L14445
- **16/10/2026** — A hora de início é do DIA da semana (e a turma passa a… → `REGISTRO.md` L14507
- **16/10/2026** — A turma deriva: o «editar» passa a ser um elo novo, com… → `REGISTRO.md` L14564
- **16/10/2026** — A curadoria é de UMA turma (e edita-se ou deriva-se como a… → `REGISTRO.md` L14701
- **16/10/2026** — A identidade visual fecha o circuito: raiz, porta,… → `REGISTRO.md` L14770
- **16/10/2026** — A curadoria é de UMA turma — e o id passa a dizê-lo → `REGISTRO.md` L14863
- **16/10/2026** — A camada de componentes: o desenho deixa de ser reescrito… → `REGISTRO.md` L14929
- **17/10/2026** — Os papéis e a variante noturna: a identidade passa a ter… → `REGISTRO.md` L14999
- **17/10/2026** — A aparência ganha prova própria — e o botão que sumiria no… → `REGISTRO.md` L15074
- **17/10/2026** — A escola nasceu sem o botão da aparência: a barra tinha uma… → `REGISTRO.md` L15327
- **17/10/2026** — A lista de turmas deixa de ficar acavalada no celular → `REGISTRO.md` L15395
- **17/10/2026** — Os commits estavam certos e a produção estava velha: as… → `REGISTRO.md` L15700
- **17/10/2026** — O botão que parecia quebrado, o campo colado no botão e o… → `REGISTRO.md` L15754
- **17/10/2026** — As sete listas da Produção passam a folhear (o botão que… → `REGISTRO.md` L15850
- **18/10/2026** — A escola não é campo: o cabeçalho do ato separa o que se… → `REGISTRO.md` L15936
- **18/10/2026** — O nome da escola estava no JSON e vinha do cliente: o… → `REGISTRO.md` L15998
- **18/10/2026** — a S5 entra em produção, e os três passos ganham os botões… → `REGISTRO.md` L16404
- **18/10/2026** — o «Seções» vira botão, e a página começa na secção → `REGISTRO.md` L16465
- **18/10/2026** — a proveniência sai da curadoria e vale para tudo; o menu… → `REGISTRO.md` L16505
- **18/10/2026** — os três passos fecham as travas, e o «Editar» da turma abre… → `REGISTRO.md` L16556
- **18/10/2026** — o vocabulário escolhe em lista, e cada nome diz as suas… → `REGISTRO.md` L16617
- **18/10/2026** — o cancelar chega à curadoria, a turma perde dois campos, e… → `REGISTRO.md` L16672
- **18/10/2026** — o formulário recolhe para uma faixa, e a listagem ocupa a… → `REGISTRO.md` L16727
- **18/10/2026** — o nome do professor na curadoria abre o plano de ensino dele → `REGISTRO.md` L16774
- **18/10/2026** — a faixa dos passos numa linha só, com a seta no fim → `REGISTRO.md` L16812
- **18/10/2026** — a etiqueta é uma só, e o que está no ar é o motor → `REGISTRO.md` L16855
- **18/10/2026** — a dobra do índice da página, no celular → `REGISTRO.md` L16932
- **18/10/2026** — a C15 foi decidida: a preferência de aparência é da escola → `REGISTRO.md` L17085
- **18/10/2026** — A aparência passou a ser da escola, e o servidor aplica-a → `REGISTRO.md` L17151
- **18/10/2026** — O catálogo das peças: um nome antes do desenho → `REGISTRO.md` L17240
- **18/10/2026** — A segunda família: a Cortina Turquesa, medida antes de… → `REGISTRO.md` L17330
- **18/10/2026** — O cabeçalho do ato cresce, e o «Fechar» deixa de descontar → `REGISTRO.md` L17419
- **18/10/2026** — O cabeçalho do ato cabe em 360px, e a barra de botões vira… → `REGISTRO.md` L17492
- **18/10/2026** — Correção: o resumo da faixa desce, e a lista não mente… → `REGISTRO.md` L17587
- **18/10/2026** — Regra: medir na bancada, e o ar só na conferência final → `REGISTRO.md` L17653
- **18/10/2026** — O catálogo de paletas fecha em três: a Verde de Ensaio… → `REGISTRO.md` L17710
- **18/10/2026** — A família da escola chega a tudo o que ela serve, e a lista… → `REGISTRO.md` L17793
- **18/10/2026** — As outras quatro secções recolhem, e a listagem fica com a… → `REGISTRO.md` L17868
- **18/10/2026** — A marca entra na barra e o favicon existe: a cor vem do… → `REGISTRO.md` L17948
- **18/10/2026** — O gerador diz o que falta: a guarda do DOCS, o… → `REGISTRO.md` L18100
- **18/10/2026** — Por que o CI não ficava verde: o plano nunca preenchia o… → `REGISTRO.md` L18169
- **18/10/2026** — O token vive em quatro lugares, e só um foi trocado → `REGISTRO.md` L18239
- **19/10/2026** — A turma manda no ritmo: o `.conf` da variante passa a ser… → `REGISTRO.md` L18285
- **19/10/2026** — O expurgo não mente: «sobraram 1» era a listagem a chegar… → `REGISTRO.md` L18394
- **19/10/2026** — A geração deixa de ser muda: a tela passa a dizer o que… → `REGISTRO.md` L18449
- **19/10/2026** — As escolas de teste passam a ter nome de palavra: Calango,… → `REGISTRO.md` L18527
- **19/10/2026** — O repertório é da turma: sai do formulário da curadoria → `REGISTRO.md` L18568
- **19/10/2026** — O expurgo errou para os dois lados: a leitura passa a ser a… → `REGISTRO.md` L18622
- **19/10/2026** — O disparo manda dois slugs: o conteúdo é da variante, o… → `REGISTRO.md` L18690
- **19/10/2026** — O `.fipp` não se escolhe: em conflito, regera-se → `REGISTRO.md` L18758
- **19/10/2026** — Sem escola no repositório, o `Reancorar` não falha → `REGISTRO.md` L18807
- **19/10/2026** — O `criar-escola` também perde a corrida do `push` → `REGISTRO.md` L18844
- **19/10/2026** — A correcção da âncora ficou num workflow só — e o commit… → `REGISTRO.md` L18895
- **19/10/2026** — A lista que falhava sem dizer porquê: `kv.list` tem cota, e… → `REGISTRO.md` L18953
- **19/10/2026** — Todo pacote gerado nascia divergente da porta: a barra e a… → `REGISTRO.md` L19005
- **20/10/2026** — O PO abre sem plano e com o checklist em branco: a lista… → `REGISTRO.md` L19048
- **20/10/2026** — O expurgo apagou a escola e deixou o dado: a limpeza do KV… → `REGISTRO.md` L19131
- **20/10/2026** — A cota do KV: o que ia para lá sem precisar, medido → `REGISTRO.md` L19214
- **20/10/2026** — A anamnese nunca ia para o Git: ela vivia só no KV → `REGISTRO.md` L19278
- **20/10/2026** — a lista não paga o que não mostra (fase 2 da dependência do… → `REGISTRO.md` L19361
- **20/10/2026** — o envelope sai do KV: o acervo passa a ser o armazenamento… → `REGISTRO.md` L19435
- **20/10/2026** — o índice do acervo: cada pergunta deixa de ser uma… → `REGISTRO.md` L19523
- **20/10/2026** — dois `list` a menos: o cartão da geração e o cadastro no… → `REGISTRO.md` L19605
- **20/10/2026** — o índice diz o mesmo nos dois níveis, e a âncora tem três… → `REGISTRO.md` L19667
- **20/10/2026** — a tela mostra o endereço que existe, e diz que o cofre é… → `REGISTRO.md` L19704
- **20/10/2026** — as declarações do índice: o vocabulário deixa de estar… → `REGISTRO.md` L19743
- **20/10/2026** — a anamnese sai do KV, e o cofre deixa de existir → `REGISTRO.md` L19803
- **20/10/2026** — o plano de ensino de teste chega preenchido inteiro, não… → `REGISTRO.md` L19844
- **20/10/2026** — o índice passa a ser gerado, e o «passou» passa a ser medido → `REGISTRO.md` L19896
- **20/10/2026** — a âncora da aula deixa de ficar solta, e o rebase diz a… → `REGISTRO.md` L20027
- **20/10/2026** — o Worker da escola passa a servir o pacote da TURMA, não o… → `REGISTRO.md` L20078
- **20/10/2026** — o expurgo da `breu` foi completo, e o índice ficou a… → `REGISTRO.md` L20113
- **20/10/2026** — o PO da `batata` não gerava o ciclo: a declaração da… → `REGISTRO.md` L20204
- **20/10/2026** — a aula derivada volta a ser legível: o mapa de secções e a… → `REGISTRO.md` L20263
- **20/10/2026** — o primeiro pacote no repositório expôs o vocabulário do… → `REGISTRO.md` L20319
- **20/10/2026** — o Plano de Observação de uma turma oferecia as alunas das… → `REGISTRO.md` L20375
- **20/10/2026** — a escola publica um ÍNDICE DE TURMAS, e o menu deixa de… → `REGISTRO.md` L20445
- **20/10/2026** — o hook recusava todo commit enquanto uma turma não tivesse… → `REGISTRO.md` L20521
- **20/10/2026** — a escola não se criava: a publicação era montada só no ramo… → `REGISTRO.md` L20581
- **20/10/2026** — o repositório sem ciclo expôs duas provas desactualizadas → `REGISTRO.md` L20641
- **20/10/2026** — o filtro dos sujeitos continuava sem funcionar: a chave… → `REGISTRO.md` L20671
- **20/10/2026** — clicar na logo leva à raiz do domínio → `REGISTRO.md` L20741
- **20/10/2026** — o ciclo é gerado e o menu não o mostra: a barra passa a ser… → `REGISTRO.md` L20814
- **20/10/2026** — a barra de navegação deixa de ser escrita e passa a ser… → `REGISTRO.md` L20883
- **20/10/2026** — o registro de notação passa a compor-se: o alfabeto é dado,… → `REGISTRO.md` L20980
- **20/10/2026** — o lançamento pedia uma senha cujo campo estava escondido → `REGISTRO.md` L21088
- **20/10/2026** — duas bancadas para ESCOLHER o título e a paginação — e três… → `REGISTRO.md` L21156
- **21/10/2026** — as propostas de layout foram refeitas: eram inoperáveis, e… → `REGISTRO.md` L21254
- **21/10/2026** — o título que fica e a barra do lançamento no celular: as… → `REGISTRO.md` L21326
- **21/10/2026** — a página de harmonização saía sem título: a fonte não abria… → `REGISTRO.md` L21407
- **21/10/2026** — iPhone: o menu que não cabia e a rolagem que tremia → `REGISTRO.md` L21482
- **21/10/2026** — a correção do iPhone foi longe demais: revertida, e o… → `REGISTRO.md` L21554
- **21/10/2026** — a batata foi expurgada; as provas deixaram de nomear escolas → `REGISTRO.md` L21628
- **21/10/2026** — o remoto primeiro: uma regra para não repetir o diagnóstico… → `REGISTRO.md` L21679
- **22/10/2026** — O manifesto base deixa de ser obrigatório (ferramentas… → `REGISTRO.md` L21721
- **22/10/2026** — A variante passa a ser um manifesto inteiro, e o `.conf` da… → `REGISTRO.md` L21760
- **22/10/2026** — O professor que não criou a escola não fica sem validação → `REGISTRO.md` L21815
- **22/10/2026** — A prova que nomeava a `valse` (a segunda vez) → `REGISTRO.md` L21866
- **22/10/2026** — O expurgo pela página não regera os índices derivados → `REGISTRO.md` L21888
- **22/10/2026** — A criação de escola passa a levar os índices derivados → `REGISTRO.md` L21916
- **22/10/2026** — O cenário «a escola de um, a turma no plano de outro»,… → `REGISTRO.md` L21945
- **22/10/2026** — O `deploy-escolas.yml` não publicava escola nenhuma, e nada… → `REGISTRO.md` L21989
- **22/10/2026** — O TeX saía inteiro a cada execução, e o deploy subia por… → `REGISTRO.md` L22045
- **22/10/2026** — Dois POs para um plano: a linha de base é uma só, e o… → `REGISTRO.md` L22850
- **22/10/2026** — O terceiro laço de rebase, e os treze conflitos que eram só… → `REGISTRO.md` L22973
- **22/10/2026** — O PO de um professor não vê o plano nem as alunas de outro → `REGISTRO.md` L23001
- **22/10/2026** — A escola recriada pertence a quem a recriou → `REGISTRO.md` L23065
- **23/10/2026** — O job do índice reescrevia o commit do vizinho, e o push… → `REGISTRO.md` L23127
- **23/10/2026** — O menu deixa de contar documentos: doze destinos, e a lista… → `REGISTRO.md` L23185
- **23/10/2026** — A escolha de turma antes do formulário, e a harmonização… → `REGISTRO.md` L23280
- **23/10/2026** — A curadoria não se atribui incompleta: cinco campos, e a… → `REGISTRO.md` L23397
- **23/10/2026** — A lista de alunas da anamnese não se contorna: a curadoria… → `REGISTRO.md` L23459
- **23/10/2026** — A barra diz de onde se veio; o «true» sai do endereço; e os… → `REGISTRO.md` L23583
- **23/10/2026** — O Bastidores chega à folha do celular, e o título deixa de… → `REGISTRO.md` L23691
- **23/10/2026** — O ☰ dentro da Produção abre o menu do sistema inteiro → `REGISTRO.md` L23769
- **24/10/2026** — O padrão da lista: as oito listas com o mesmo gesto, e o… → `REGISTRO.md` L23887
- **26/10/2026** — O documento acende a lista de onde veio, e a norma de «onde… → `REGISTRO.md` L25147
- **26/10/2026** — Referências deixa de ser um item do menu, e passa a ser um… → `REGISTRO.md` L25246
- **26/10/2026** — O menu da Produção não rola com a página: era o `sticky`… → `REGISTRO.md` L25331
- **26/10/2026** — O menu da Produção fica congelado: `sticky` não serve, e a… → `REGISTRO.md` L25384
- **26/10/2026** — O botão que grava não encosta no campo: a fileira do… → `REGISTRO.md` L25437
- **26/10/2026** — A porta não se abre por um endereço sem ato, e o índice… → `REGISTRO.md` L25530
- **26/10/2026** — O plano publica o apanhado, e o detalhe fica na aula → `REGISTRO.md` L25670
- **26/10/2026** — O objetivo é do ciclo, a estrutura é da aula, e a régua é… → `REGISTRO.md` L25828
- **26/10/2026** — O formulário passa a perguntar em que aula cada objetivo é… → `REGISTRO.md` L25981
- **26/10/2026** — O parâmetro de medição passa a mandar na matriz, e o dado… → `REGISTRO.md` L26070
- **26/10/2026** — O que não se pergunta sai do roteiro, e aparece no cabeçalho → `REGISTRO.md` L26144
- **26/10/2026** — A fronteira do cabeçalho fecha: o nó que só se lê mostra o… → `REGISTRO.md` L26199
- **26/10/2026** — A anamnese é da aluna, e a marca «nova» sai quando ela já… → `REGISTRO.md` L26242
- **27/10/2026** — O expurgo é um estado, e o sistema passou a lê-lo → `REGISTRO.md` L26349
- **27/10/2026** — O expurgo da `breu` aconteceu, e as duas metades conversaram → `REGISTRO.md` L26445
- **27/10/2026** — A escola recriada diz o presente, e o passado passa a ter… → `REGISTRO.md` L26500
- **27/10/2026** — A `calango` saiu, e com ela saiu também um verde falso meu → `REGISTRO.md` L26595
- **27/10/2026** — A correção passou pelo caminho real: a `batata` voltou pelo… → `REGISTRO.md` L26665 *(superado)*
- **27/10/2026** — Ler não é editar: o nome do registo volta a abrir o… → `REGISTRO.md` L26726 *(superado)*
- **27/10/2026** — A turma do plano é de quem a direção curou: a regra sai da… → `REGISTRO.md` L26823 *(superado)*
- **27/10/2026** — O cabeçalho do Plano de Observação lê o plano que ele… → `REGISTRO.md` L27073
- **27/10/2026** — A aula passa a ter leitura em prosa e em Notação Benesh → `REGISTRO.md` L27155
- **27/10/2026** — A Notação herda a Aula; o Plano e a aula ganham o seu… → `REGISTRO.md` L27245
- **27/10/2026** — A Aula 01 chegou à produção da Batata → `REGISTRO.md` L27313
- **28/10/2026** — O documento abre pela leitura, e o código interno sai da… → `REGISTRO.md` L27347
- **28/10/2026** — O cabeçalho deixa de ter etiquetas, e o cartão da ficha… → `REGISTRO.md` L27463
- **28/10/2026** — A Sequência declarada sai, e a métrica ganha legenda → `REGISTRO.md` L27558
- **28/10/2026** — O alfabeto muda de casa, e a âncora passa a selar com que… → `REGISTRO.md` L27671
- **28/10/2026** — O verbete ganha posição, direção e lado — e a prosa passa a… → `REGISTRO.md` L27753
- **28/10/2026** — O verbete passa a ser administrável na Produção → `REGISTRO.md` L27835
- **28/10/2026** — O verbete em Produção: três defeitos meus, e a pergunta que… → `REGISTRO.md` L27881
- **01/11/2026** — O `;` que separa os itens, e a coluna que deixa de ser duas → `REGISTRO.md` L29044
- **01/11/2026** — O que a sequência já responde não se escreve outra vez → `REGISTRO.md` L29081
- **01/11/2026** — As 23 aulas não são uma dívida: nascem à medida → `REGISTRO.md` L29159
- **01/11/2026** — A janela vista por todas as bandas: a aula e o lançamento → `REGISTRO.md` L29212
- **01/11/2026** — O que vive no KV, e o que não vive → `REGISTRO.md` L29291
- **01/11/2026** — O elo do expurgo diz o que aconteceu ao KV → `REGISTRO.md` L29382
- **01/11/2026** — O trecho sem direção: o relevé não vai a lado nenhum → `REGISTRO.md` L29450
- **01/11/2026** — A escola nasce com a âncora, e não só com o scaffold → `REGISTRO.md` L29519
- **01/11/2026** — A âncora antes dos índices, e não depois → `REGISTRO.md` L29569
- **01/11/2026** — A página do Vocabulário saiu; o exercício vive no «+» do… → `REGISTRO.md` L29608
- **01/11/2026** — A seta sobe ao título, os passos descem para a linha… → `REGISTRO.md` L29669
- **01/11/2026** — O molde dos schemas ficou atrás, e a geração de um ciclo… → `REGISTRO.md` L29765
- **01/11/2026** — O molde dos schemas passa a ter um leitor só → `REGISTRO.md` L29837
- **coqui-de-redinha · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- **pe-torto · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- **sapo-bailarino · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).
- **tela-de-celular · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).

## Documentos-chave (para leitura)

- `PROTOCOLO.md` — pétreas
- `REGRAS.md` — regras
- `REGISTRO.md` — marcos metodológicos
- `professores/<nome>/` — um professor por pasta (P-13): ciclos, cadernos, relatórios, campo
- `professores/<nome>/ciclos/ciclo-XX-<escola>-po.md` — POs por escola
- `professores/<nome>/ciclos/ciclo-XX-<escola>.fipp` — âncoras de proveniência
- `departamentos/` — PO de departamento, quando a escola tiver metodologia comum (P-14)
- `biblioteca/guia-do-professor.md` — o guia de posição (departamento ou PO próprio)

## Como retomar

A próxima sessão deve ler, nesta ordem:
1. este arquivo;
2. `PROTOCOLO.md`;
3. as últimas 5 entradas de `REGISTRO.md` — não o arquivo inteiro;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.

Acima: a última entrada do `REGISTRO.md` por inteiro, as pendências recentes e o
índice das anteriores. Consultar o índice antes de abrir o `REGISTRO.md` para
pendência antiga.
