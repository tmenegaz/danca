# Plano — o motor e os seus três produtos

> **Status.** Plano de implementação. **Nada foi implementado.** Este documento decide **quantos
> motores** existem (um), **o que se vende** (três produtos) e **em que ordem** (antes do ciclo,
> entregues conforme o plano contratado) — e mede, item por item, o que já existe para cada um.
>
> **Precedência declarada (02/11/2026).** Este plano **não reordena** nenhum dos que já existem; ele
> **entra por baixo** deles. A camada 0 do `PLANEJAMENTO-LASTRO.md` §5 (L1 · L2 · L10) e a **L14**
> (o catálogo de turmas prontas) continuam a ser o que é preciso fechar primeiro — os produtos são a
> **cara comercial da base**, e por isso podem ser vendidos **antes** das camadas analíticas (L4 · L6
> · L7 · L9), que respondem a perguntas sobre o dado que a escola ainda não produziu.
>
> **Regra central.** **Um motor, três saídas, três manifestos.** O motor lê o **catálogo** e produz
> **dados**; a entrega transforma os dados em **pacote** com a maquinaria que já existe; a
> **distribuição** decide o que cada plano libera. A granularidade que a negociação pede **não está
> no código** — está nos manifestos.
>
> **O que este documento não faz.** Não decide preço (é **C8** / L8), não decide licença (é de
> negócio e **bloqueia** o degrau 1), não mexe em `tools/` (congelado) e não inventa conteúdo
> (P-16: o que a unidade ensina **declara-se**).

---

## 0. O que a pesquisadora decidiu, nas palavras dela

Cinco frases, de 02/11/2026, e todas as cinco são decisão de produto — não são desenho:

1. **«A minha ideia (…) é criar os três produtos»** — dicionário, syllabus e aula pronta.
2. **«Um motor para a aula pronta, um motor para o syllabus e um motor para o dicionário, ou um
   motor só faz tudo, ou a gente faz dois motores?»** — a pergunta que o §3 responde.
3. **«Acho que talvez a granularidade (…) se a gente tiver, por exemplo, syllabus e dicionário junto
   em um motor e um outro motor para a aula pronta, porque daí a aula vai ser nutrida do syllabus,
   né, aí a gente consegue ter melhor possibilidade de negociação.»** — a hipótese a avaliar.
4. **«Isso é gerado antes do ciclo (…) antes da gente ter a anamnese, o plano de ensino e o plano de
   observação.»** — e **«só começam a fazer sentido (…) quando a gente faz a curadoria»**.
5. **«Se ela é do plano básico, ela vai ter só os formulários e ela tem que fazer tudo (…) e do
   plano avançado, aí que vai receber então essas benesses.»**

E o pedido que fecha: **«você precisa melhorar essa investigação, fazer o plano de implementação,
documentar esse plano de implementação e tem que ver se os outros planos que nós temos não colidem
com esse novo plano.»** É este documento; as colisões estão no **§6**, uma por uma, com o ajuste.

---

## 1. O que já existe — medido, antes de desenhar o que falta

O veredicto da **C22** foi «é viável», e este plano é a prova por dentro: **sete das nove peças do
motor já estão no repositório**, e três delas estão prontas na forma exacta que os produtos exigem.

| # | Peça | Onde | Estado |
|:--|:--|:--|:--|
| 1 | **O núcleo é agnóstico e é um só** | `motor/nucleo/` — 21 ficheiros, contrato puro, sem `fs`/`path`/`http`; `provar-agnosticismo.js` verifica **por máquina** | **pronto** — é a razão do §3 |
| 2 | **A notação é DERIVADA, não escrita** | `motor/nucleo/notacao.js`: compõe `[Pé: 5ª → +]` a partir de `categoria` + `sinais` | **pronto** — e é o que torna o produto «dicionário» um render, não uma transcrição |
| 3 | **O glossário já é o dicionário, aplicado a um ciclo** | `ciclo-NN-<escola>-glossario-benesh.md`, gerado por `tools/gerar-ciclo.sh` e conferido por `tools/check-glossario.js` — índice de símbolos, verbetes e origem declarada por verbete | **pronto, e mal escalado** — falta a mesma função sobre o **catálogo inteiro** em vez do subconjunto do ciclo. *(O exemplar que serviu de leitura — o da `batata` — foi expurgado a 02/11/2026; o gerador e o verificador ficam.)* |
| 4 | **A ordem por nível já é dado** | `progressao.json`: 13 turmas com `ordem` e `nivelReferencia` | **pronto** — falta o **conteúdo** de cada nível (ver §7) |
| 5 | **A regra do volume já está escrita** | **Regra 9** (congelada): teto pela duração, depois solo 30–40%, barra 20–30%, centro 30–40%, musicalidade 5–10%; as faixas estão no `.conf` (`VOLUME_MIN` 80–100 para 60 min; `150–200` para 120 min) | **pronto** — é o algoritmo da aula pronta, e é **norma**, não escolha do motor |
| 6 | **A turma já manda no ritmo, e o `.conf` já é derivado** | `motor/servidor/compor-conf.js` («o manifesto da variante deixa de ser escrito à mão e passa a ser DERIVADO do cadastro da turma») | **pronto** — e é o que impede o produto de carregar ritmo (C19) |
| 7 | **A entrega já existe inteira** | `tools/gerar-ciclo.sh` (pacote + PDF), `tools/montar-publicacao.js` (o site), `tools/check-pacote.js` (a validação), `tools/hash-ciclo.sh` (a âncora) | **pronto — e congelado** (§6, colisão 7) |
| 8 | **O catálogo já se lê de um sítio só, para o conteúdo** | `motor/servidor/catalogo-seed.js` lê por `require` os cinco JSON de `biblioteca/modalidades/bale-classico/` | **pronto** |
| 9 | **O caminho catálogo → escola já existe** | `POST /api/bastidores/semear-catalogo` → `turmas` + `turma-conteudos` no KV → `Conteúdo do nível` (`selecoes.fonte = "termosDaTurma"`) → `aula-1-sequencia` | **pronto, e semeia 9 pares** (§7) |

**O que NÃO existe, e é o objecto deste plano:** as três saídas como **artefacto** (hoje não há
documento nenhum chamado «dicionário», «syllabus» ou «aula pronta»), os **manifestos** de produto, a
**separação** catálogo × escola, e a **porta** que decide o que cada plano libera.

---

## 2. As três saídas — o que cada uma é, e o que precisa de mais

| | **1. Dicionário** | **2. Syllabus** | **3. Aula pronta** |
|:--|:--|:--|:--|
| **O que é** | o vocabulário e os verbetes — o que cada passo **é** | a **sequência** de unidades por nível, com os três eixos por unidade | uma **sessão** montada: sequência + tempos + música, dentro do teto da duração |
| **O que lê** | `vocabulario.json` (93 termos) + `notacao.json` (11 verbetes, 13 músicas, 43 células) | o dicionário **+ `progressao.json`** (a ordem) **+ a camada pedagógica** | o syllabus **+ as faixas de volume** (Regra 9) **+ o tempo de cada unidade** (o `cobre` do verbete) |
| **O que acrescenta de entrada** | nada | a **ordem** (existe) e a **camada pedagógica** (não existe) | a **duração** e a **distribuição por bloco** (ambas existem, como norma) |
| **Granularidade de venda** | por modalidade | por **nível** (13) | por **nível × faixa** (13 × 2 = **26** sessões no balé) |
| **O que bloqueia hoje** | a **licença** e a **separação** catálogo × escola | a camada pedagógica **e** o conteúdo dos níveis | o mesmo do syllabus, **+ as 5 músicas que não fecham** |
| **Reutiliza** | o glossário (`glossario-benesh`) sobre o catálogo inteiro | — | o pacote (`gerar-ciclo.sh`) e a publicação (`montar-publicacao.js`) |

**A leitura que decide o §3.** A aula pronta é uma **projecção** do syllabus: pega no nível, aplica
o teto da faixa, distribui pelos blocos pela Regra 9, e resolve os tempos e o compasso **no verbete**
de cada unidade. Não há nela **nenhum cálculo** que o syllabus não tenha — há um **selector** (nível
× faixa) e um **resolvedor** (unidade → tempos). É a diferença entre «outro motor» e «outra chamada
da mesma função».

---

## 3. Quantos motores? **Um motor, três saídas, três manifestos.**

Esta é a resposta à pergunta dela, e tem três partes: o que **não** se deve partir, o que **deve**
partir, e por que a hipótese dela (dois motores) fica a meio caminho de uma coisa que não existe.

### 3.1 Não se parte o motor — e a razão está medida, não é preferência

1. **O núcleo já é um, e a fronteira é provada por máquina.** `motor/nucleo/` não importa `fs`,
   `path` nem `http`, e `provar-agnosticismo.js` verifica isso. Partir em dois núcleos obrigaria a
   **duplicar a fronteira** ou a **cruzar** um núcleo dentro do outro — e o segundo caso é o que a
   fronteira existe para impedir.
2. **A duplicação já foi paga uma vez, e está registada.** Há hoje **duas leituras do vocabulário**:
   `lerModalidade` (lê do **GitHub**) e `termos()` (lê do **bundle**, `bastidores.js:364`). É por
   isso que um termo criado aparece na lista e **não** chega ao plano antes do deploy. A **C22** já
   manda unificar. Dois motores = duas leituras **de novo**, agora com nomes novos.
3. **A regra de composição da notação é uma só.** O dicionário precisa dela para desenhar os sinais;
   a aula pronta, para escrever as células; o glossário, para o índice. Duplicá-la é duplicar
   `categoria` + `sinais` → `[Pé: 5ª → +]` — a regra que o repositório mais usa.
4. **A âncora é uma convenção só** (`tools/hash-ciclo.sh` → `.fipp`, por ciclo **e por aula**). Dois
   motores produziriam **duas convenções de âncora** para o mesmo tipo de artefacto — e a proveniência
   é o que este repositório trata com mais cuidado.
5. **A entrega é uma só e está congelada em `tools/`.** `gerar-ciclo.sh`, `montar-publicacao.js` e
   `check-pacote.js` estão em `tools/`, que é **congelado** (`CONGELAMENTO.md`). Dois motores ou os
   chamam os dois (logo, são o mesmo motor) ou pedem **duas alterações** ao congelado em vez de uma.

### 3.2 O que **deve** partir: o **manifesto**, não o código

O que a negociação precisa não é de dois programas — é de **três objectos com identidade própria**,
para poder dizer «este plano leva o dicionário do balé, versão 3, licença X; o syllabus do nível 1
custa Y; a aula pronta do nível 1 é um adicional». Isso é **dado**:

```json
{
  "id": "bale-classico-dicionario",
  "produto": "dicionario",
  "modalidade": "bale-classico",
  "versao": 1,
  "licenca": "[Preencher: a decisão de negócio]",
  "inclui": { "termos": 93, "verbetes": 11, "musicas": 13 },
  "fonte": { "commit": "…", "ancora": "…" }
}
```

Três manifestos por modalidade (um por produto), em
`biblioteca/modalidades/<modalidade>/produtos/`. O do syllabus acrescenta `niveis: [...]`; o da aula
pronta acrescenta `sessoes: [{nivel, faixa, tempos}]`. **É a mesma forma que o `.conf` já tem** — o
que responde à colisão 5 do §6.

### 3.3 A hipótese dela — «syllabus + dicionário num motor, aula pronta noutro» — e o que ela resolve

**O que ela acerta, e é o essencial:** o syllabus e o dicionário **partilham tudo** (a mesma leitura,
a mesma ordem, a mesma licença, a mesma versão) e a aula pronta é a única que **acrescenta uma
entrada** (a duração) e a única que **depende do syllabus estar fechado**. A intuição sobre a
dependência está certa.

**Onde ela custa caro:** a aula pronta é **a projecção** do syllabus (§2), e a projecção vive no mesmo
núcleo que já sabe derivar documento. Um segundo motor chamar-se-ia «aula-pronta» e faria **três
chamadas** ao primeiro: ler o syllabus, ler o verbete, compor a notação. Seriam dois pacotes npm, dois
`README`, duas fronteiras e um `require` cruzado.

**A forma que dá a mesma granularidade sem duplicar:** **um motor, três funções de saída, três
manifestos**. Se um dia for preciso empacotar separado (por exemplo, vender o motor da aula a outra
escola), parte-se por **manifesto**, não por código — e a prova de que se pode partir é que as três
saídas partilham **o mesmo determinismo** (mesma entrada → mesmo byte), que é o que o
`SOURCE_DATE_EPOCH` já garante.

> **Resumo em uma linha.** O motor é **um** porque o trabalho é um; os produtos são **três** porque a
> oferta é três; e o que os separa é o **manifesto**, não o ficheiro.

---

## 4. A ordem: os produtos vêm ANTES do ciclo

Esta é a decisão mais estrutural das cinco, e ela **não inverte** o pipeline — **acrescenta-lhe uma
etapa à frente**. Medido, o encadeamento de hoje é:

```
escola → turma (ritmo) → curadoria → ciclo → anamnese/plano/PO → aula → pacote
```

O que ela decidiu põe em frente:

```
catálogo → [dicionário · syllabus · aula pronta]  ←  o que se vende
              ↓  (entra na escola ao nascer, conforme o plano)
escola → turma (ritmo) → curadoria → ciclo → anamnese/plano/PO → aula → pacote
```

**Três consequências, e nenhuma é cosmética:**

1. **A anamnese, o plano de ensino e o PO passam a ter um chão.** Hoje o plano pede o «Conteúdo do
   nível» e o que ele oferece é `termosDaTurma` — semeado com **9 pares** (§7). Com o syllabus
   pronto, o mesmo campo passa a oferecer o conteúdo **curado** do nível, e a curadoria deixa de ser
   «escolher entre quatro termos de exemplo».
2. **O produto não carrega ritmo, e o `.conf` continua a derivá-lo da turma.** É o que a **C19**
   fechou pela negativa, e é o que `compor-conf.js` já faz: a **turma** manda no ritmo, o **plano**
   manda no conteúdo, e a **identidade** vem do `.conf` da escola.
3. **Os produtos são geráveis sem escola nenhuma.** Medido: são **26 sessões** no balé (13 níveis ×
   2 faixas), e as duas entradas que faltam — o mapa nível→termos e a camada pedagógica — são
   **conteúdo** (P-16), não código. É por isso que eles podem ser produzidos **antes**, e é por isso
   que o degrau 1 não se destrava com programação.

**E o que isso NÃO quer dizer.** Não quer dizer que a escola recebe um ciclo pronto: recebe os
**três produtos**, e continua a fazer o seu ciclo, com a sua turma, o seu ritmo e as suas respostas.
O que muda é o **chão**: em vez de campos vazios e quatro termos de exemplo, o professor abre o plano
e o conteúdo do nível já está lá — curado, versionado e com origem.

**O ponto que ela própria marcou, e é a fronteira certa:** «só começam a fazer sentido (…) quando a
gente faz a curadoria». Ou seja: o produto é **matéria-prima**; a curadoria é o **acto** que o torna
dela. É a mesma distinção que o projecto já faz entre **plano** (intenção) e **registo** (facto) — e
é o que impede o produto de ser «a aula da escola» antes de a escola a ter dado.

---

## 5. A entrega por plano — o que cada um recebe

**Medido primeiro: hoje não há onde isto morar.** `raiz/escolas-habilitadas.json` tem `habilitada` e
`pagante` (a trava do expurgo), e **não tem `plano`**. A composição comercial (L8) ainda não existe, e
as cotas (L9) também não. É a lacuna que este plano herda, e não a resolve sozinho.

| | **Básico** | **Intermediário** | **Avançado** |
|:--|:--|:--|:--|
| **Formulários** (anamnese · plano · PO) | **sim** | **sim** | **sim** |
| **Faz o ciclo do zero** | **sim** | **sim** | **sim** |
| **Dicionário** | — | — | **entregue** |
| **Syllabus** | — | — | **entregue** |
| **Aula pronta** | — | — | **entregue** |
| **O gerador** | — | — | **é o que produz as três** |

**A decisão dela, e o que ela implica:** «o plano avançado (…) vai receber então essas benesses». O
gerador **não é um quarto produto** — é **o meio** pelo qual o Avançado recebe os três. Isso ajusta a
leitura da **C22**, onde o gerador aparecia como o degrau 4 da escada (ver §6, colisão 1).

**Duas regras que a tabela impõe, e as duas já têm precedente no repositório:**

1. **Descer de plano não apaga.** É a regra da **L9** («a trava não pode ser punição ao dado»), e ela
   vale igual para os produtos: o que já foi **entregue** é do professor — fica legível, deixa de
   receber actualizações. O que se restringe é o **acesso ao gerador**, não o documento.
2. **Subir de plano não regenera o ciclo.** O produto é entregue **ao lado** do ciclo da escola, não
   dentro dele; subir de plano acrescenta uma secção ao site da escola, e não toca em nenhum pacote
   já publicado (nem na sua âncora).

**O que ainda não está decidido, e é dela:** se o produto é **incluído no pacote** da escola (uma
secção do site, servida pelo mesmo Worker) ou **entregue fora** (um pacote separado, com a sua âncora
e a sua licença). A primeira é mais barata e menos vendável; a segunda é o que «vender o dicionário»
exige. **A recomendação deste plano: o produto é um pacote próprio**, porque é a única forma de ele
ter âncora, versão e licença independentes do ciclo — que é o que a negociação pede.

---

## 6. Colisões com os planos existentes — e o ajuste de cada uma

É o que ela pediu expressamente. **Nove colisões, e nenhuma delas é fatal**; três são de leitura (o
que está escrito passa a significar outra coisa), três são aditivas (uma frente ganha um eixo) e três
são operacionais.

| # | Plano / documento | O que ele diz hoje | Colide? | O ajuste |
|:--|:--|:--|:--|:--|
| 1 | **C22** (`PLANEJAMENTO-LASTRO.md` §3) | a escada tem **quatro degraus** e o **gerador** é o 4.º produto, «o plano Avançado da L8/L9» | **sim — de leitura** | o gerador **não é produto**: é o **meio**. A escada passa a **três produtos + um motor**. Nota de correção **datada** na C22 (P-03/P-04: não se reescreve, acrescenta-se) |
| 2 | **L14** (o catálogo de turmas prontas) | a **turma pronta** é o objecto que se vende | **sim** | a turma pronta passa a **referenciar** o syllabus (`syllabusId`, com versão), em vez de o conter. Sem isto ficam **dois catálogos** a divergir |
| 3 | **L8** (composição e a fonte única dos valores) | os valores dos planos, capacidades e adicionais | **sim — aditiva** | os três produtos entram como **itens da composição**: um por modalidade, com preço próprio e possibilidade de adicional (por nível) |
| 4 | **L9** (cotas e habilitação) | trava **quantidades**: professores, modalidades, consultas, tokens | **sim — aditiva** | ganha um **quarto eixo**: **conteúdo entregue**. E a regra «descer de plano não apaga» passa a cobrir os produtos já entregues |
| 5 | **`PLANO-CICLO-DA-TURMA.md`** (fases 2–5) | o `.conf` é **derivado** do cadastro da turma | **não colide — encaixa** | o manifesto do produto **alimenta** o `.conf`; o ritmo continua a vir da turma. É a mesma forma, dois leitores — é o que evita o segundo caminho de derivação |
| 6 | **`PLANO-INDICES.md`** | os índices vêm **antes** de L6 e da Tabela de actividades, e indexam o **acervo** (ciclos, professores, escolas) | **não colide — mas falta um índice** | os produtos não precisam do índice para **existir**; precisam dele para serem **encontráveis** (fase 5). O índice do acervo não muda; os produtos ganham o seu |
| 7 | **`CONGELAMENTO.md`** | `tools/` (geradores, validadores, hooks) e `tools/templates/` são **congelados** | **sim — operacional** | a entrega **chama** `gerar-ciclo.sh`/`montar-publicacao.js` **sem os alterar**. Se for preciso alterar, é **motivo declarado + entrada no REGISTRO + commit próprio** — o mesmo caminho da Regra 15 |
| 8 | **Decisão 17** (`ESTADO-ATUAL.md` §6) | «o vocabulário vive no **repositório**, numa lista só», sem cópia no KV | **não colide, se a separação for no repositório** | catálogo e adições são **dois ficheiros no repositório**, com **um leitor que compõe**. A decisão 17 proíbe a cópia em KV, não a separação em ficheiros — mas a nota tem de o dizer, senão a primeira leitura conclui que colide |
| 9 | **`ARQUITETURA-GERAL.md:109`** | a licença está «a definir» | **bloqueia a fase 1** | não é colisão de desenho: é **decisão de negócio**. Enquanto não houver licença e separação, o degrau 1 não se vende |

**E uma nona colisão que não é com um plano, é com uma frase deste repositório.** O `PLANEJAMENTO`
§5 diz «o que **não** se deve fazer: implementar L6 antes de L1/L2/L3 e de L10». Os produtos **não
são L6**: não fazem consulta nenhuma, não cruzam dado da escola, não respondem a pergunta. Por isso
podem vir antes — e é essa a diferença que este plano introduz no mapa: **os produtos são a cara
comercial da base, não a cara analítica**. A camada 3 (o valor) continua a esperar por L1–L4 e L10.

---

## 7. O que falta de **conteúdo** — e é isto que trava, não o código

Esta secção existe porque o veredicto «é viável» não é «está pronto». Medido, o que falta é quase todo
de **conteúdo** (P-16: declara-se, não se deduz), e é por isso que nenhuma linha de código o resolve.

| # | O que falta | Medido hoje | O que destrava |
|:--|:--|:--|:--|
| **A** | **O mapa nível → termos** | `progressao.json`: **13 turmas**, **9 associações** — e só **2 níveis** têm alguma (nível 1: 4 termos; nível 2: 5). Os outros **11 níveis estão vazios** | o syllabus de qualquer nível acima do 2, e a aula pronta correspondente |
| **B** | **A camada pedagógica por unidade** (o que **exige**, o que **ensina**, o que **expressa**) | não existe em nenhum dos três ficheiros do catálogo | o syllabus como **programa** e não como lista |
| **C** | **As 5 músicas que não fecham** | Plié 12 em 8 · Rond de jambe en l'air 3 em 4 · Battement dégagé 6 em 4 · Battement fondu 6 em 2 · Relevé 1 em 2 | a aula pronta **fecha** o teto: uma célula que não fecha estraga a aritmética da Regra 9. E a gravação **já as recusa** desde 02/11/2026 |
| **D** | **A licença** | não há `LICENSE`; `ARQUITETURA-GERAL.md:109` diz «a definir» | o degrau 1 inteiro |
| **E** | **A separação catálogo × escola** | `termo-repo.js`: **um** ficheiro (`biblioteca/modalidades/bale-classico/vocabulario.json`) para os dois | vender o dicionário sem vender as edições de cada escola |

**E uma nota sobre a ordem entre A e B.** O mapa nível→termos (A) pode ser **o mesmo trabalho** que a
camada pedagógica (B): quem declara «o nível 1 ensina `plié` e `tendu`» já está a dizer o que a
unidade ensina. Fazer A primeiro, e B como **acréscimo de duas colunas** ao mesmo ficheiro, poupa uma
passagem pela curadoria. **É recomendação, não decisão.**

---

## 8. As fases de implementação

Seis fases. Cada uma é verificável **sozinha**, e a ordem é de dependência — **a fase 0 não é código**.

### Fase 0 — o conteúdo (não é código)

- **A**: o mapa nível→termos para os 13 níveis, em `progressao.json` (`relacoes`), declarado pela
  pesquisadora — começando pelo **nível 1 completo** (é o que a `batata` usa).
- **C**: corrigir as 5 músicas (ou os verbetes) para que `cobre` feche os tempos.
- **D**: a licença, como decisão de negócio, escrita em `ARQUITETURA-GERAL.md` (que é livre).
- **Verificação:** os 11 verbetes fecham; o nível 1 tem ≥ 8 termos associados; existe um `LICENSE`.

### Fase 1 — a separação catálogo × escola (C22, item 2 · L14, lacuna 0)

- `biblioteca/modalidades/bale-classico/vocabulario.json` passa a ser **só o catálogo**;
  `biblioteca/escolas/<escola>/vocabulario.json` recebe as adições; **um leitor compõe** os dois.
- `termo-repo.js` passa a escrever no **da escola**.
- **Verificação:** criar um termo numa escola **não altera** o ficheiro do catálogo; outra escola
  **não vê** o termo; o catálogo, lido em paralelo, não muda.

### Fase 2 — as três saídas, em memória

- `motor/nucleo/produtos/dicionario.js`, `syllabus.js`, `aula-pronta.js` — **puros**, sem `fs`/`path`,
  a respeitar a fronteira do núcleo (a prova de agnosticismo passa a cobri-los).
- `aula-pronta.js` implementa a **Regra 9** como norma lida do `.conf`, não como número escrito.
- **Verificação:** determinismo (mesma entrada → mesmo byte, duas execuções); a soma dos blocos fica
  dentro das percentagens da Regra 9; um verbete que não fecha produz **recusa**, não um documento
  torto.

### Fase 3 — os manifestos e o pacote

- `biblioteca/modalidades/bale-classico/produtos/{dicionario,syllabus,aula-pronta}.json`.
- A entrega **reutiliza** `montar-publicacao.js` e os templates, **sem os alterar** (§6, colisão 7).
- **Verificação:** `check-pacote` no pacote do produto (**0 erros**); cada manifesto tem `id`,
  `versao`, `licenca` e `fonte.ancora`.

### Fase 4 — a distribuição por plano

- A habilitação ganha `plano` — e o lugar é decisão de **C11** (o estado comercial). Até lá, o campo
  vive ao lado de `habilitada`/`pagante` em `raiz/escolas-habilitadas.json`, que é **andaime
  declarado**.
- **Verificação:** escola no Básico **não vê** a secção; no Avançado **vê**; **descer** de plano
  mantém o produto legível e corta o gerador; **subir** acrescenta a secção **sem** regenerar o ciclo
  e **sem** tocar na âncora.

### Fase 5 — o índice dos produtos

- O índice do **acervo** (`indices/acervo.json`) não muda: ele indexa ciclos, professores e escolas.
  Os produtos ganham o **seu** índice (`indices/produtos.json`), com `id`, `versao`, `licenca`,
  `modalidade`, `nivel` e `ancora`.
- **Verificação:** o índice é **reconstruível** a partir dos manifestos (a regra do
  `PLANO-INDICES.md` §«Regra central»), e `check-indices` continua verde.

---

## 9. Critérios verificáveis — o que fecha este plano

1. **Um motor.** `provar-agnosticismo` cobre os três módulos de produto, e não existe **nenhuma**
   segunda leitura do catálogo: `lerModalidade` e `termos()` passam a ser **um** leitor.
2. **Três saídas, três manifestos.** Cada produto tem `id`, `versao`, `licenca` e `ancora` próprios, e
   a mesma entrada produz o mesmo byte em duas execuções.
3. **A aula pronta fecha o teto.** Para cada nível com conteúdo e cada faixa, a soma dos tempos cai
   dentro de `VOLUME_MIN`–`VOLUME_MAX`, e a distribuição por bloco respeita a Regra 9.
4. **O produto não carrega ritmo.** Nenhum manifesto tem `dias`, `frequencia`, `periodoInicio` nem
   `periodoFim`; o `.conf` continua a tirá-los da turma (C19, `compor-conf.js`).
5. **A separação é real.** Criar um termo numa escola não muda o catálogo (§Fase 1).
6. **O plano decide, e descer não apaga.** Os quatro casos da §Fase 4 passam, incluindo o downgrade.
7. **A âncora do produto é independente.** Publicar um produto não reancora nenhum ciclo, e nenhuma
   âncora de ciclo muda por causa dele.

---

## 10. Riscos, e o que continua por decidir

**Riscos medidos.**

- **O conteúdo é o caminho crítico, não o código** (§7). Um motor pronto sobre 2 de 13 níveis vende
  um syllabus que só serve para o nível 1 e 2.
- **O produto pode virar «a aula da escola» antes de a escola a ter dado.** É o risco de P-03/P-04: a
  proveniência acrescenta, não edita. O produto é **matéria-prima** e tem de estar declarado como tal
  no documento que entrega — com a **origem** e a **versão**, como o glossário já faz com cada verbete.
- **A licença é de negócio e trava o degrau 1.** Nenhuma fase técnica a resolve.
- **`tools/` é congelado.** A primeira alteração que os produtos exigirem lá custa motivo declarado,
  entrada no `REGISTRO.md` e commit próprio.
- **O `plano` da escola não existe em código** (§5). Até **C11** decidir onde vive o estado comercial,
  o gate é um andaime — e andaime mente quando ninguém o lê.

**Por decidir, e é dela.**

1. **Preço e empacotamento** dos três produtos (C8 / L8).
2. **A licença** (§7-D).
3. **Produto dentro do pacote ou pacote próprio** (§5 — a recomendação deste plano é pacote próprio).
4. **O lugar do `plano`** na habilitação (C11).
5. **Se a camada pedagógica (B) se faz junto com o mapa nível→termos (A)** (§7 — recomendação: sim).

---

## 11. Sequência, e a relação com o que já está planeado

| Ordem | O que | Depende de | Pode começar já? |
|:--|:--|:--|:--|
| — | **L1 · L2 · L10** (a base) — camada 0 do `PLANEJAMENTO` §5 | — | **sim, e continua a ser o primeiro** |
| — | **L14** (turma pronta) | L2 | sim, em paralelo |
| **0** | o conteúdo: nível→termos, 5 músicas, licença | dela | **sim — e é o caminho crítico** |
| **1** | a separação catálogo × escola | fase 0-D | sim, em paralelo com a base |
| **2** | as três saídas em memória | fases 0 e 1 | depois de 1 |
| **3** | manifestos + pacote | fase 2 · `tools/` congelado | depois de 2 |
| **4** | a distribuição por plano | fase 3 · **C11** · L8 · L9 | depois de 3, e **C11 decide onde** |
| **5** | o índice dos produtos | fase 3 | em paralelo com 4 |
| — | **L4 · L6 · L7** (o analítico) | L1 · L2 · L3 · L10 | **depois** — e os produtos **não** esperam por eles |

**A frase que resume o mapa.** Os produtos são o **primeiro degrau comercial** e o **último degrau
analítico**: vendem-se com a base fechada (L1 · L2 · L14) e sem nenhuma consulta, e é isso que os põe
**antes** do ciclo — que é exactamente onde ela os quer.
