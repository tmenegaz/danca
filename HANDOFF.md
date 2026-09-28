# Handoff — Projeto Ciclo

Gerado em: `2026-09-28T10:30:34-0300`
Commit atual: `fcda6d7` — docs(registro): a entrada ⑲ corrige o que a mesma peça tornou falso
Para: sessão nova (retomar o diálogo)

## O que é este projeto

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
- **Professores:** fochini
tiago (2)
- **Ciclos com manifesto:** 3 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — painel de gestão para a direção da escola (aulas dadas, horas trabalhadas, valor-hora, cadeia de custódia, retenção) e a página pública da cadeia para pais e alunos. Não implementado.

## Últimos commits

```
fcda6d7 docs(registro): a entrada ⑲ corrige o que a mesma peça tornou falso
b1d85ab chore(ciclo-01): propaga o `Salvar` às três cópias empacotadas
ce69bc5 fix(template): o botão passa a ser `Salvar`, e o arquivo vai para a pasta do ciclo
6cf847e fix(template): o formulário declara os dois arquivos que baixa
84bc1db fix(template): o índice do formulário deixa de sair sem a vírgula
c18c0f2 docs(registro): o rito de 27/09/2026 — os elos das frentes que entraram
85844c1 feat(notacao): o ciclo ganha a notação Benesh, o glossário e o filtro
14daa27 feat(tools): o envelope passa a publicar os apelidos em claro
3338339 feat(entrega): o config da captura por aula passa a ser conferido no fim de toda geração
738caea fix(tools): o validador do `-dados.json` entra no repositório — o hook o chamava sem ele
ed3fce9 docs(campo): o campo ganha a forma canônica, o consentimento e o formulário da aula
3ef2274 feat(aula-01): a âncora passa a existir por aula, não só por ciclo (§5.2)
136361b feat(schema): o plano da aula ganha schema, validador e guarda no pre-commit
282fbcb feat(template): o estado derivado e o ajuste no plano no formulário
502f77d fix(tools): o DOCS deixa de ser lista à mão e passa a ser derivado do disco
349fe83 feat(entrega): a identidade visual passa a ser medida por comando
0fb5265 feat(ciclo-01): o DIAS declara a hora de início no schema e nos conf
8cf9960 feat(tools): o DIAS ganha a hora de início e o prazo conta do fim da aula
6e8749b docs(regras): o pré-requisito 5 passa a exigir a hora de início da aula
f1274f9 docs(estrutura): o plano é intenção enquanto "planejada", e o estado é derivado
```

## Por professor

### fochini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `a05f05c06c85` | (vazio) | Input_PO_Aguardando |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): duo, ritmos

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Duo | ciclo-01-duo-po.md | Input_PO_Aguardando | 2 |
| Ritmos e Movimento | ciclo-01-ritmos-po.md | Input_PO_Aguardando | 7 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| duo | ciclo-01-duo.fipp | `8bba2c5e8a27` | (vazio) | Input_PO_Aguardando |
| ritmos | ciclo-01-ritmos.fipp | `4175cdf1b410` | (vazio) | Input_PO_Aguardando |

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
- **P-16 — Metodologia e notação são declaradas na eliciação.
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

## 28/09/2026 — O botão passa a ser `Salvar`, e o arquivo vai para a pasta do ciclo

**O que motivou.**

A pesquisadora leu o texto de apoio que a entrada anterior (`:6705`) tinha acabado de escrever e
respondeu com a objeção que aquela entrada **não havia escutado**: *"Não é para entregar no Download
do usuário o XML pois ele não sabe o que é isso. Basta Enviar os dados fornecidos no preenchimento do
formulário lancamento.html faça o ajuste: Mudar o nome do botão e não fazer o download do xml para o
usuário"*. E, separando o essencial do acessório: *"Vc não respondeu as minhas perguntas. E o botão
continua com o nome Gerar JSON atualizado."*

A entrada anterior tinha medido **quantos** arquivos o botão baixa e ajustado **o texto** — mas deixou
**o rótulo** e **o destino** intocados, por ler a §7.3 de `ARQUITETURA-CAPTURA.md:599-601`
(*"sem servidor, ou exige backend: **mantém**"*) como proibição de mexer em qualquer coisa. A medição
mostra que a §7.3 mantém **o desenho** (não haver servidor nem backend), não **o lugar** onde o
arquivo cai: o File System Access API grava no disco a partir da página, sem backend nenhum. O que a
decisão anterior protegia era o desenho; o que ela deixou de pé foi o download na pasta do usuário —
que é justamente o que a pesquisadora recusa.

**O que foi decidido.**

- **O rótulo passa a ser `Salvar`.** A pesquisadora recusou `Enviar` — *"Coloca o nome Salvar pois é
  mais coerente do que Enviar"* — e a coerência é exata: nada é enviado a lugar nenhum; o que
  acontece é gravação local, seguida do **commit de quem lê**.
- **O par de arquivos passa a ir para a pasta do ciclo**, escolhida no seletor do navegador, e **não**
  para a pasta de downloads: o nome é estável e o carimbo vive no índice, então a página escreve no
  lugar do arquivo antigo, ao lado das fontes.
- **O `id` interno continua `gerar-json`.** O rótulo é contrato de gente; o `id` é contrato de teste.
  `experimentos/captura-json/teste.js` clica `els['gerar-json']` em **oito** pontos (`:318`, `:422`,
  `:443`, `:526`, `:550`, `:717`, `:742`, `:752`): renomear o `id` por causa de um rótulo quebraria a
  rede de regressão inteira.
- **O texto de apoio encolhe a duas linhas, e o parágrafo que a pesquisadora mandou apagar sai.** O
  trecho *"os dois vão para o **repositório**, não para a pasta de downloads"* (`:6728-6730`) **não
  está mais no texto visível** — nem no cabeçalho, nem no `summary`, nem na legenda, nem na mensagem
  pós-salvamento. A pesquisadora cortou a explicação no mesmo pedido em que pediu o rótulo novo.

**Onde entrou.**

`tools/templates/lancamento.html` — **um** arquivo. O diff contra `HEAD` são **63 inserções / 27
remoções**, em **onze hunks** (`git diff -U0`):

```
@@ -101,2  +101,2   @@  cabeçalho: "baixa" → "salvo na pasta do ciclo que você escolher"
@@ -150     +150     @@  summary: "Lançar uma aula (salva no JSON)"
@@ -154,7   +154,3   @@  <button id="gerar-json">Salvar</button> + legenda de 2 linhas
@@ -200     +196,2   @@  comentário do propósito da página: o que ela salva vai para a pasta
@@ -973,0   +971,27  @@  <-- O NOVO: `let pasta` (:974) + `gravarNaPasta()` (:980)
@@ -1011,2  +1035,2  @@  comentário da captura: "baixa" → "salva" (§3 do IDEIA-CAPTURA)
@@ -1662,4  +1686,4  @@  comentário §3.3: SALVA na pasta escolhida → o commit é de quem lê
@@ -1688,2  +1712,2  @@  a razão do download, reescrita
@@ -1717,3  +1741,16 @@  o bloco de escrita: `gravarNaPasta` + o fallback declarado
@@ -1722,3  +1759    @@  o `dizer()` de fechamento, encurtado
@@ -1958,2  +1993,3  @@  `trocarCiclo`: quem escreve no disco é o File System Access
```

As linhas, medidas no arquivo já alterado (**2088** linhas, era **2052**):

- **`:154`** — *a* mudança pedida: `<button id="gerar-json" type="button">Salvar</button>`. O `id`
  fica; **só o rótulo mudou**. **`:155-156`** é a legenda que sobrou: *"o ciclo com esta aula dentro,
  na pasta do ciclo — e só entra no Git quando você commitar."*
- **`:101-102`** — o cabeçalho da **Área do Professor**: *"o lançamento é **salvo** na pasta do ciclo
  que você escolher: a página grava, mas **não commita** — o commit é seu."*
- **`:197`** — o comentário do propósito da página: *"O que ela salva (o lançamento) vai para a pasta
  do ciclo que o professor escolher, ao lado de tudo isso."*
- **`:971-995`** — o corpo novo. `:971-973` o comentário da pasta escolhida **uma vez por carga**;
  `:974` `let pasta = null;` (escopo de módulo, é o cache); `:976-979` a razão do `false` que nunca
  lança; `:980` `async function gravarNaPasta(arquivos)`; `:981` a guarda
  `if (!globalThis.showDirectoryPicker || !globalThis.isSecureContext) return false;`; `:983` o
  `showDirectoryPicker({ id: 'ciclo', mode: 'readwrite' })`; `:984-985` `queryPermission` e
  `requestPermission` (`readwrite`); `:986-991` o laço `getFileHandle(create: true)` →
  `createWritable()` → `write(new Blob(...))` → `close()`; `:992` `return true`; `:993-995`
  `catch (e) { return false; }` — *"AbortError do seletor, ou falha de escrita no disco"*.
- **`:1741-1759`** — onde a gravação acontece. `:1741-1742` a ordem: **o arquivo de dados primeiro**
  (*"se o índice chegasse ao disco apontando para um arquivo que não está lá, a próxima abertura da
  página leria um ciclo inexistente"*); `:1743-1746` o vetor `arquivos` (`novoNome` e `ciclos.json`);
  **`:1747`** `const gravou = await gravarNaPasta(arquivos);`; `:1748-1750` o comentário do recuo;
  **`:1751`** `if (!gravou) arquivos.forEach((a) => baixar(a.nome, a.texto, a.tipo));`;
  **`:1752-1755`** o `onde` — *"salvo na pasta do ciclo"* **ou** o
  `<span class="erro">este navegador não escreve na pasta — os arquivos foram para a pasta de
  downloads: mova-os para a pasta do ciclo, no lugar dos antigos</span>`; `:1756-1759` o `dizer()`.
- **`:1035-1038`** — o comentário da captura: *"lança → atualiza o JSON em memória → salva →
  commita"* (era *"baixa"*).
- **`:1686-1689`** — o comentário do §3.3: *"SALVA o arquivo do ciclo na pasta escolhida → o commit é
  de quem lê"*.
- **`:1993-1995`** — `trocarCiclo`: *"Não há servidor: quem escreve no disco é o File System Access,
  na pasta que o professor escolhe — e, onde ele não existir, o par desce como download."*

**Motivo declarado — os congelados.**

`tools/templates/` está em `CONGELAMENTO.md`, e esta entrada é o **motivo declarado** da peça. O
próprio `CONGELAMENTO.md` manda *"diga **o que não muda**"* e, se a alteração muda **comportamento**
(e não só redação), *"pare e confirme com o usuário"*. **A alteração muda comportamento** — e isso
não é suposição, é a decisão que a pesquisadora tomou: ela escolheu, entre as opções apresentadas, a
**opção (a)** — gravar na pasta pelo File System Access, com o rótulo `Salvar`. A confirmação que a
regra exige **existe e está datada**; a entrada anterior afirmava o contrário, e é corrigida adiante.
**O que NÃO muda:**

- **A fórmula de hash e a cobertura da âncora.** `tools/hash-ciclo.sh` não foi tocado. Medido, não
  suposto: o `.fipp` do diaghilev cobre **21 caminhos** e `grep -c "lancamento"` neles dá **0** —
  `lancamento.html` **não** entra em `fontes_do_ciclo()`. As três âncoras seguem **exatamente** as de
  antes, e `--check` sai **exit 0** nos três.
- **Nenhum validador afrouxa.** `check-pacote.js`, `validar-po-ciclo.js`, `validar-plano-ciclo.js`,
  `validar-dados-ciclo.js`, `check-glossario.js` e `check-identidade.js` seguem como estavam.
- **Nenhuma regra e nenhuma pétrea muda.** `REGRAS.md`, `PROTOCOLO.md` e `CONGELAMENTO.md` não foram
  tocados.
- **O caso nominal do congelamento** — *"alterar a estrutura de menu ou navegação"* — não é desta
  peça: não se mexeu em menu. O rótulo do botão e a gravação não são estrutura de navegação.
- **A regra da proveniência não se perdeu — mudou de casa.** A entrada anterior guardou a cauda
  *"a proveniência do JSON é o commit, não um carimbo dentro dele"* como texto **visível**. Ela sai do
  texto visível (a pesquisadora cortou a explicação), mas a regra continua **escrita no próprio
  arquivo**, no comentário de `:1605`: *"o commit — que é a proveniência do JSON — viraria um diff
  ilegível"*. O que saiu foi a explicação ao professor; a regra ficou onde governa o código.

**Com o quê.**

| Verificação | Comando | Resultado real |
|:--|:--|:--|
| O rótulo novo chegou | `grep -c '>Salvar<'` | **1** no template; **0** em cada uma das três cópias — *ainda não propagadas* |
| O rótulo velho saiu | `grep -c 'Gerar JSON atualizado'` | **0** no template; **1** em cada cópia (stale) |
| O `id` **não** foi renomeado | `grep -rn 'salvar-json'` | **0** ocorrências em todo o repositório |
| O tamanho do diff | `git diff --numstat` | **63 / 27** em `tools/templates/lancamento.html` |
| O script embutido continua válido | `new vm.Script(<script>)` | **1 script, OK** |
| O formulário real roda em Node | `node experimentos/simulacao-marau/simular-formulario.js` | **exit 0** |
| O caminho FSA grava e devolve `true` | `sonda-gravar.js fsa` | **verde** (stub de `showDirectoryPicker`; 1 seletor para 2 cliques) |
| O recuo por download ainda funciona | `sonda-gravar.js download` | **verde** |
| O caminho real no navegador | Chromium headless via CDP | **tudo verde**, inclusive `condicoes_contorno` |
| O recuo se **declara** | Firefox 156.0.1 | `showDirectoryPicker` **undefined**; rótulo `Salvar`; a mensagem diz que o par desceu |
| A rede de regressão | `node experimentos/captura-json/teste.js` | **exit 1** em `caso 2` — **pré-existente, provado** (ver abaixo) |
| As três âncoras | `tools/hash-ciclo.sh <prof> 01 <escola> --check` | **exit 0** nos três; `a05f05c0…`, `8bba2c5e…`, `4175cdf1…` — **inalteradas** |
| A identidade visual | `node tools/check-identidade.js` | **exit 0** (a tabela de `:123` já listava o template) |

- **⭐ O `teste.js` já falhava antes — e foi provado, não argumentado.** O harness morre em `caso 2`
  com `TypeError` dentro de `carimboDaAula`/`render`, alcançado por `trocarCiclo` (`teste.js:139`):
  a fixture "todos os ciclos" traz `f.dados = null` e o código lê `f.dados.aulas`
  (`lancamento.html:1009`, `:1633`, `:1769`). Rodei o **harness de base** contra o template de `HEAD`
  (`lancamento-baseline.html`, cópia fiel de `6cf847e`) e ele morre **no mesmo `caso 2`**, com o mesmo
  erro; os `caso 1` e `1b` passam nos dois. **Não é regressão desta peça, e não foi "consertado"
  aqui** — consertar a fixture seria mudar a rede para acomodar a peça, que é o contrário do que ela
  serve para fazer.
- **A gravação é uma só por carga, e a ordem importa.** O `pasta` é cache de módulo (`:974`), então o
  seletor abre **uma vez** e os salvamentos seguintes reusam a pasta — medido: dois cliques, um
  seletor. E o arquivo de dados é escrito **antes** do índice (`:1741-1746`): se a página falhasse no
  meio, o índice nunca apontaria para um arquivo ausente.
- **`globalThis`, não `window`** — os dois harnesses de Node (`teste.js` e `simular-formulario.js`)
  fazem `eval()` do template, onde `window` não existe. Com `window`, o helper lançaria no harness.
- **O recuo é obrigatório, não gentileza.** Firefox e Safari **não têm** `showDirectoryPicker`; sem o
  `baixar()` de `:1751` a peça tiraria do professor o único transporte que ele tinha. O recuo
  **declara-se** (`:1752-1755`): o professor não pode descobrir na pasta errada que o arquivo não
  chegou onde ele esperava.

**Referências.**

- `tools/templates/lancamento.html` — o botão em `:154`; `baixar()` em `:972` (preservado: serve o
  `.md` e o recuo); `gravarNaPasta()` em `:980-996`; `gerarJson()` a partir de `:1690`, com o bloco de
  escrita em `:1741-1759`; a regra da proveniência em `:1605`.
- `CONGELAMENTO.md` — a lista que inclui `tools/` e `tools/templates/`; a exigência de motivo
  declarado, entrada no `REGISTRO.md` e **commit próprio**; e a cláusula *"se a alteração muda
  comportamento… pare e confirme"*, que é o que a opção (a) da pesquisadora satisfaz.
- `ARQUITETURA-CAPTURA.md:599-601` (§7.3) — a decisão *"sem servidor, ou exige backend: **mantém**"*.
  Continua valendo **para o desenho**; o que ela não diz é que o arquivo tenha de cair na pasta de
  downloads. É a distinção que a entrada anterior não fez.
- `ARQUITETURA-CAPTURA.md:385-391` — o precedente do `dados-exemplo-…json`, e a nota *"sem servidor,
  ele pode ter ido para a pasta de downloads do navegador"*: era descrição do que acontecia, não
  decisão de que devesse acontecer.
- `ARQUITETURA-CAPTURA.md:190-195` — o modelo da nota datada que corrige redação envelhecida sem
  apagá-la (*"A redação antiga **não** foi apagada (P-03/P-04): esta nota é o elo novo"*).
- `IDEIA-CAPTURA.md:138` — *"**Nenhum backend:** … **Salvar = baixar o arquivo.**"*: a equação
  **envelheceu**. Salvar continua não exigindo backend, e o File System Access o prova; mas salvar
  **deixou de ser** baixar. Fica declarado como defeito de documento livre, não corrigido nesta peça.
- `tools/gerar-ciclo.sh:563` — a propagação é `cp` puro (`cp "$TPL/lancamento.html"
  "$PACOTE/lancamento.html"`): **sem templating**, o rótulo novo chega verbatim às três cópias.
- `experimentos/captura-json/teste.js:318`, `:422`, `:443`, `:526`, `:550`, `:717`, `:742`, `:752` —
  os oito cliques em `gerar-json`, razão de o `id` não mudar.
- `REGISTRO.md:6705` — a entrada anterior, do mesmo formulário no mesmo dia: lá o defeito medido era
  **quantos** arquivos o botão baixa; aqui é **para onde** eles vão e **como o botão se chama**.

**O que ainda não está feito.**

- **As três cópias empacotadas ainda dizem `Gerar JSON atualizado`** — propagadas nesta mesma peça
  logo adiante; a tabela acima registra o estado medido **antes** da propagação.
- **O `HANDOFF.md` ainda não foi regenerado.** Ele carrega o rótulo antigo (`:168`) e a cauda
  preservada (`:175`) da entrada anterior. Regerado depois do commit, como manda o método.
- **O lançamento da pesquisadora continua fora do repositório** — o
  `~/Downloads/ciclo-01-diaghilev-dados-2026-09-28T0840.json` precisa chegar a
  `professores/fochini/ciclos/`. Herdado da entrada anterior; **não é desta peça**, e não foi feito
  sem autorização.
- **Os documentos livres que descrevem o fluxo antigo seguem desatualizados:** `ARQUITETURA-CAPTURA.md
  :289` (*"a gravação continua sendo lançar → baixar o JSON → commitar"*), `:306`, `:327` e `:391`
  (o download como destino, não como recuo), e `IDEIA-CAPTURA.md:138`/`:162`. São livres, a correção é
  barata, e **não foi feita nesta peça** — a peça é o formulário.
- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** Herdado, e ainda
  sem dono.

> **Correção de 28/09/2026 (mesmo dia).** Cinco afirmações da entrada imediatamente acima (`:6705`)
> **não se sustentam** depois desta peça — a pesquisadora reverteu, no mesmo dia, o rótulo e o texto
> que aquela entrada tinha decidido preservar. Corrigem-se aqui, como elo — o texto anterior **não é
> apagado** (P-03/P-04).
>
> 1. *"**O rótulo do botão fica como está** — `Gerar JSON atualizado`. A pesquisadora decidiu
>    manter…"* (`:6724-6726`). **Revertido no mesmo dia.** O rótulo **é** `Salvar` (`:154`). A decisão
>    de manter durou uma mensagem; a pesquisadora voltou pedindo exatamente o contrário — *"Mudar o
>    nome do botão"* — e recusou `Enviar` por coerência. O que a entrada anterior acertou foi a
>    **razão** (`Enviar` não cabe sem servidor); o que ela errou foi concluir que, por isso, **nenhum**
>    rótulo novo caberia: `Salvar` descreve gravação local, não envio.
> 2. *"Renomear o botão para `Enviar` não cabe: não há servidor, e nada é enviado a lugar nenhum"*
>    (`:6725-6727`). **Continua verdadeiro, e foi o que a pesquisadora escolheu honrar** — ela recusou
>    `Enviar` pelo mesmo motivo. O erro não estava nesta frase; estava na §7.3 lida como veto ao
>    rótulo.
> 3. *"E fica dito que os dois vão para o **repositório**, não para a pasta de downloads"*
>    (`:6728-6730`). **Revertido.** A pesquisadora mandou cortar o parágrafo explicativo, e ele saiu
>    do texto visível. Além disso a afirmação **descrevia o errado**: os dois **iam** para a pasta de
>    downloads — é para lá que o navegador baixa — e só chegariam ao repositório se a professora os
>    movesse à mão. É exatamente a confusão que motivou esta peça: **a frase dizia "repositório" e o
>    comportamento dizia "downloads".** Agora o comportamento **é** o repositório.
> 4. *"O rótulo do botão (`:154`) e a mensagem de `gerarJson()` **não** foram tocados"* (`:6737`).
>    **Os dois foram tocados.** O rótulo está em `:154` com outro texto; a mensagem de `gerarJson()`
>    foi reescrita (`:1752-1759`), e agora **diz onde o arquivo foi parar** em vez de o silenciar.
> 5. ⚠️ *"**É redação, não comportamento.** Nenhuma linha de JavaScript mudou; a alteração é de texto
>    visível."* (`:6760-6761`). **A afirmação mais séria, e é falsa em dobro — naquela peça e nesta.**
>    Nesta peça, **27 linhas de JavaScript entraram** (`:971-995`, o `gravarNaPasta()`) e o bloco de
>    escrita foi reescrito (`:1741-1759`): o comportamento **mudou** — no Chromium o arquivo **não**
>    desce mais para a pasta de downloads, ele é escrito no disco. E na própria peça anterior a frase
>    já era falsa: aquele diff **não** era só redação, ele mudava o **texto de apoio** e nada mais —
>    mas o texto de apoio **é** o contrato visível da página, e chamá-lo de "não comportamento" foi o
>    que autorizou deixar o rótulo de pé. **A regra do `CONGELAMENTO.md` pede parada e confirmação
>    quando o comportamento muda; a frase pulou a parada.** Nesta peça **não se pulou**: as opções
>    foram apresentadas, a pesquisadora escolheu a (a), e a escolha está registrada acima, em
>    "Motivo declarado".
>
> **Nota de método, como elo.** A cauda que a entrada anterior diz ter preservado *"palavra a palavra"*
> (`:6731-6732`) **saiu do texto visível** nesta peça, por pedido da pesquisadora. Ela não se perdeu:
> a **regra** continua escrita em `tools/templates/lancamento.html:1605` (*"o commit — que é a
> proveniência do JSON — viraria um diff ilegível"*), e a **frase** continua em `REGISTRO.md:6731`.
> Quem lê a entrada anterior precisa saber que a preservação valeu para a redação da **página**, e não
> como proibição de mexer no assunto depois.
>
> **Segunda nota de método — a citação fantasma da entrada anterior.** O bullet de `:6817-6819`
> afirma que *"`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda
> ignorada"*"*. **A citação não se sustenta: a frase não existe naquele arquivo.** Medido:
> `grep -c "cauda" ARQUITETURA-CAPTURA.md` → **0**; `:260` é uma seta `↓`, `:261` é *"Baixa o JSON
> novo e o índice atualizado"*, `:266` é `### 3.4 Visualizar`. No repositório inteiro a frase aparece
> em **5** lugares, todos em Markdown: `REGISTRO.md:6731` e `:6817`, `HANDOFF.md:175`, `:261` e
> `:1261` — ou seja, **ela nasceu nesta própria entrada e foi espelhada para o `HANDOFF.md`**. A
> origem foi rastreada: `git log --all -S"cauda ignorada"` devolve `991aa83` e `6cf847e`, que são a
> **mesma** mudança (o `991aa83` é o checkpoint da sessão, `…/checkpoints/turn/8`; o `6cf847e` é o
> commit na `main`). A regra **verdadeira** que a entrada queria citar está em
> `ARQUITETURA-CAPTURA.md:190-195` — a `> **Nota datada — 27/09/2026**` sobre o `ultimo_lancamento`.
> O próprio bullet declara *"não foi feita nesta peça"*, e é isso que **autoriza** o conserto aqui: a
> frase **já foi publicada**, e a correção é o elo. Corrigido nesta peça, junto dos dois espelhos no
> `HANDOFF.md`.

> **Correção de 28/09/2026 (mesmo dia) — o que esta própria entrada tornou falso, e o conserto
> que ela autorizou.** Cinco afirmações feitas acima **não se sustentam** depois que a peça
> terminou de andar. Corrigem-se aqui, como elo — o texto anterior **não é apagado** (P-03/P-04).
>
> 1. *"**As três cópias empacotadas ainda dizem `Gerar JSON atualizado`** — propagadas nesta mesma
>    peça logo adiante"* (`:6999-7000`). **Verdadeiro na hora em que foi escrito, falso depois do
>    commit `b1d85ab`.** A propagação aconteceu, e as três cópias foram commitadas. Medido agora:
>    `grep -c 'Gerar JSON atualizado'` → **0** em cada uma das três, e `grep -c '>Salvar<'` → **1**
>    em cada uma. O bullet descrevia o **durante**, não o **depois**.
> 2. *"**O `HANDOFF.md` ainda não foi regenerado.** Ele carrega o rótulo antigo (`:168`) e a cauda
>    preservada (`:175`)"* (`:7001-7002`, ecoado em `HANDOFF.md:1402-1405`). **Verdadeiro na hora,
>    falso desde a regeneração.** O `HANDOFF.md` foi regerado com `:4` = `b1d85ab`, e o rótulo
>    antigo não existe mais no arquivo. A **estrutura** do bullet, porém, é o que importa para o
>    método: o gerador **colhe todo** bloco *"O que ainda não está feito"* e **não reinicia** em
>    linhas `> ` (medido: o `HANDOFF.md` carrega a nota de correção inteira, `:1417-1470`). Por
>    isso os dois primeiros bullets ficam **cumulativos** no handoff, e é **aqui** que eles são
>    contrapostos — nunca lá.
> 3. As duas linhas da tabela *"Com o quê"* que mediam o estado das cópias (`:6938` *"**0** em cada
>    uma das três cópias — *ainda não propagadas*"*; `:6939` *"**1** em cada cópia (stale)"*).
>    **Estão invertidas hoje, e a §Referências acima (`:6972-6973`) já as qualificava como "o estado
>    medido na hora".** A qualificação é o que as salva como **instantâneo**, e é o que se mantém:
>    elas continuam verdadeiras *para o instante da geração*. O que se corrige é a leitura — quem lê
>    depois **re-deriva com o próprio relógio**, exatamente como o `_nota` do índice manda. Medido
>    agora: `:6938` → **1** em cada cópia; `:6939` → **0** em cada.
> 4. ⭐ **A linha falsa da entrada anterior.** Ela afirma que *"O texto novo chegou nas **quatro**
>    cópias"*, com a medição *"`grep -c 'baixa <strong>dois</strong> arquivos'` → **1** em cada"*
>    (`:6767`), e dá `git diff --numstat` **`6/3`** (`:6768`). **As duas não se sustentam.** Medido
>    agora: `grep -c 'baixa <strong>dois</strong> arquivos'` → **0** nas quatro; e o `--numstat`
>    real do commit `ce69bc5` é **`63 27`** em `tools/templates/lancamento.html` — não `6/3`. Uma
>    entrada anterior que mede errado contamina a tabela de quem vem depois; o conserto é a medição
>    nova, e não a reescrita da antiga.
> 5. ⭐ **A citação fantasma — a régua verdadeira.** O bullet de `:6817-6819` afirma que
>    *"`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda ignorada"*"*.
>    **A citação não se sustenta: a frase nunca existiu naquele arquivo** (medido:
>    `grep -c "cauda" ARQUITETURA-CAPTURA.md` → **0**). A regra verdadeira é a `> **Nota datada —
>    27/09/2026**` de `ARQUITETURA-CAPTURA.md:190-195`, sobre o `ultimo_lancamento`. A nota de método
>    acima (`:7057-7070`) conclui com *"Corrigido nesta peça, junto dos dois espelhos no
>    `HANDOFF.md`"* — e **essa conclusão estava adiantada**: o arquivo livre seguia intocado. Ela
>    passa a valer **agora**, com o conserto do item 6 abaixo, e a enumeração de `:7062-7063`
>    (`REGISTRO.md:6731` e `:6817`; `HANDOFF.md:175`, `:261` e `:1261`) troca pelos cinco lugares
>    medidos hoje: `REGISTRO.md:6817` e `:7064`, `HANDOFF.md:392`, `:1395` e `:1467`.
> 6. ⭐ **Os documentos livres foram corrigidos nesta peça — era o que faltava, e a entrada os
>    declarava intocados.** O bullet de `:7007-7010` dizia *"a correção é barata, e **não foi feita
>    nesta peça** — a peça é o formulário"*. Correção barata que fica para depois envelhece quem a
>    lê: quem abrisse `ARQUITETURA-CAPTURA.md` aprenderia que o lançamento *"baixa o JSON"*. Feito
>    agora, com nota datada no próprio arquivo livre (P-03/P-04), nos quatro pontos do fluxo:
>    - `ARQUITETURA-CAPTURA.md:261` (*"Baixa o JSON novo e o índice atualizado"*) → *"Salva o JSON
>      novo e o índice atualizado na pasta do ciclo"*, sob **nota datada 28/09/2026** na §3.3, que
>      declara o recuo para download onde não há File System Access API;
>    - `:306` (Mermaid, `-->|"download manual"|`) → `-->|"gravação na pasta do ciclo"|`;
>    - `:327` (caixa ASCII, `│ download / commit manual`) → `│ gravação na pasta do ciclo / commit
>      manual`;
>    - `:391` (*"pode ter ido para a pasta de downloads do navegador"*) → o download como **recuo**,
>      não como destino.
>    E em `IDEIA-CAPTURA.md`, os dois pontos que descreviam a gravação como download de saída:
>    `:138` (*"Salvar = baixar o arquivo"*) e `:162` (*"Gravação (download do JSON atualizado)"*).
> 7. ⭐ **O texto de apoio da página — pedido novo, feito nesta peça.** A pesquisadora pediu, depois
>    da decisão, que a redação do cabeçalho (`tools/templates/lancamento.html:97-103`) fosse
>    reescrita em linguagem mais legível, cobrindo os quatro verbos do que a página faz — **lê** o
>    índice e os dados do ciclo (que viajam cifrados no pacote, como os acompanhamentos), **salva**
>    o lançamento na pasta do ciclo escolhida, **ajusta** o que precisar e **gera** os relatórios.
>    A consequência **verdadeira** foi preservada palavra a palavra: as vistas são calculadas na
>    memória, a página **grava mas não commita**, e **o commit é do professor**.
> 8. ⭐ **A alteração das 10:04 — descartada, e registrada como método.** Entre esta entrada e a
>    anterior, o VS Code reescreveu os quatro `lancamento.html` no disco (`files.autoSave:
>    "onFocusChange"` + `editor.formatOnSave`, ambos em `~/.config/Code/User/settings.json`). O delta
>    de conteúdo foi a **remoção de uma frase** — a legenda *"o ciclo com esta aula dentro, na pasta
>    do ciclo — e só entra no Git quando você commitar"* —, idêntica nos quatro arquivos, com o
>    JavaScript **inalterado** (medido: os quatro reduzem a exatamente **−97** caracteres, e o JS
>    tem os mesmos 79754 caracteres nos dois lados). Um formatador **não apaga texto**: a assinatura
>    é de **"Replace in Files"**. A pesquisadora foi consultada e escolheu **descartar** —
>    `git checkout --` nos quatro caminhos. **A remoção de uma linha de texto, se ela um dia quiser,
>    é mudança de uma linha com entrada própria**, como qualquer outra. O remédio durável, oferecido:
>    fechar as abas, ou desligar `editor.formatOnSave` para HTML.
>
> **O que continua valendo sem correção.** O "Motivo declarado", a tabela "Onde entrou" na sua
> parte de código (`:6940`, `:6941`, `:6942` — medidos de novo, corretos), a §"O que motivou" e
> todo o parágrafo 5 desta nota, que registra a parada que a peça anterior não fez. A regra do
> `CONGELAMENTO.md` segue: quando o **comportamento** muda, para-se e confirma-se; foi o que
> aconteceu aqui, e a escolha está em "Motivo declarado".

## O que está pendente

POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.

## 18/09/2026 — Estrutura por professor (P-13, P-14) e migração do material

Primeiro relatório pós-aula do Duo; POs de Ritmos e Débora; Ciclo 02; um segundo
professor (a estrutura está pronta, aguardando o primeiro).

## 18/09/2026 — Publicação do repositório no GitHub (decisão da pesquisadora)

Licença do repositório (a definir); o envio para o GitHub, que acontece fora do
repositório, na máquina da pesquisadora.

## 18/09/2026 — Pacotes de ciclo passam a ser versionados (deploy automático)

Configurar o *publish directory* de cada site no Netlify; primeiro deploy de cada escola;
licença do repositório.

## 18/09/2026 — Ciclo próprio por escola: a Ritmos deixa de ser cópia da Duo

- **Publicação (decisão da pesquisadora):** o PO da Ritmos cita os rótulos que o
  professor usou ("Carol, Dafne, Anthony, Airton"), e ele mesmo observa que só "Carol"
  é apelido. Pela **P-12**, os sujeitos entram por apelido estável — os apelidos do
  ciclo estão `[Preencher]` no PO, e **o material não foi enviado ao GitHub** enquanto
  essa decisão não for tomada.
- Preparação de força e flexibilidade da Aula 01, gravação de referência da música,
  marcos das aulas 02–20 e aplicabilidade da Regra 9, etapa 2, a este ciclo — todos
  `[Preencher]` nas fontes, aguardando o professor.
- O manifesto base `ciclo-01.conf` ainda se descreve como "conteúdo compartilhado pelas
  escolas". Não foi corrigido porque alterá-lo invalidaria a âncora da Duo: a limpeza
  fica para quando o ciclo dela for reancorado por outro motivo.

## 18/09/2026 — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19

- **Calendário do projeto:** `tools/calendario.py` modela "uma aula por dia de
  aula" (`por_semana = len(DIAS)`). Com 2 dias e 3 aulas, o pacote publica **21
  aulas em 11 semanas** (o correto são 7) e um **volume semanal de 180 tempos** (o
  correto são 270). É mudança de código, fora do escopo das sete etapas — aguarda
  decisão da pesquisadora. **Enquanto isso, o pacote do Ritmos está pronto para
  publicar, mas com o calendário errado.**
- **Pacote do ciclo da Duo:** regenerado pelo template corrigido, ele ganha o rodapé
  derivado de `DOCS` (11 documentos, com os títulos reais). Não foi commitado — o
  ciclo da Duo não se altera sem autorização. A âncora dela não muda em nenhum caso.
- **Plano e Aula 01 do Ritmos:** ainda dizem "20 encontros", "60 e 120 min" e
  "Marcos 02–20"; a Aula 01 tem `volume-total-120` e um trecho sobre "o dia de 120
  minutos" (que deixou de existir). Não entraram no escopo das etapas.
- **P-12 na Aula 01 do Ritmos:** o documento publica o nome "Anthony"; os apelidos
  fixados e os quatro documentos novos usam "Tony".
- **Publicação:** 11 commits locais à frente do `origin/main`. Não houve push: a
  decisão dos apelidos (que era o bloqueio) está tomada, mas o push publicaria o
  nome citado acima. O deploy automático do Netlify continua esperando.
- Ciclo da Débora; primeiro relatório pós-aula do Duo; primeiro relatório pós-aula
  do Ritmos.

## 18/09/2026 — PO do Ritmos validado + P-22

- **A notação não existe ainda.** O documento está publicado como **moldura**, com
  `[Preencher: notação do passo]` em cada célula — quem escreve é o professor (P-15). Sem
  ela, o glossário Benesh fica à frente do registro: o validador avisa, e é esperado.
- **Gravações de referência** de cada pas de deux e o **cruzamento fino** entre os passos
  da Aula 01 e cada número do repertório: `[Preencher]` — ninguém declarou ainda.
- **Os termos entre aspas** no plano e na aula-01 ("execução ruim", "meninos travados")
  continuam crus: citar é diferente de descrever, e a decisão é da pesquisadora.
- **O pacote do ciclo da Duo** (rodapé derivado de `DOCS`) segue gerado e não commitado:
  o ciclo dela não se altera sem autorização.
- Ciclo da Débora; relatórios pós-aula do Duo e do Ritmos.
- **Push:** os commits desta rodada estão prontos e **não foram enviados** — aguardam
  decisão da pesquisadora.

## 18/09/2026 — Publicação, primeira reancoragem da Duo e o caderno da Aula 01

Ciclo da Débora; notação do Ritmos (depende do professor); gravações de referência e o
cruzamento fino entre passos e números (Ritmos); primeiro relatório pós-aula do Ritmos
(após 19/09); conferir os dois sites no Netlify.

## 19/09/2026 — Congelamento da infraestrutura

Frente de conteúdo: revisão da Aula 01 do Duo (defeito do exercício no chão);
Aula 01 do Ritmos (19/09); caderno + relatório do Ritmos; Aula 02 do Duo.
E uma inconsistência declarada, para decisão da pesquisadora: a harmonização do
Verificação no navegador (a pesquisadora testa: senha certa abre, errada não);
decisão sobre o PDF e os `.md` de acompanhamento; a linha residual do plano do
Ritmos.

## 19/09/2026 — Política de segurança dos dados sensíveis

A camada 1 (repositório privado) é ação manual da pesquisadora, no GitHub. O
push aguarda: só depois de a segurança estar fechada. A publicação do caderno no
pacote é a etapa seguinte.

## 19/09/2026 — Caderno publicado e incluído no hash

Repositório privado (ação manual da pesquisadora — pendente). O caderno **não** é
listado no índice: o índice cobre os documentos pedagógicos, e o caderno e os
acompanhamentos por aluna aparecem no menu, no grupo "Acompanhamento".

## 19/09/2026 — Método, README-ciclos e campos de duração

O push (aguardando confirmação da pesquisadora). E dois pontos de defasagem no
`README-ciclos.md` que **não** são números e ficaram fora do escopo desta rodada,
declarados para decisão: a tabela "Escopos" lista 10 dos ~24 escopos que o hook
`commit-msg` aceita (é a tabela que faz alguém errar o escopo do commit), e o
bloco "Criar um ciclo novo" traz caminhos e comandos que não existem mais.

## 19/09/2026 — README-ciclos: escopos e criação de ciclo

O push (aguardando confirmação da pesquisadora).

## 19/09/2026 — Correções cosméticas

O push — agora é o único item aberto da infraestrutura.

## 19/09/2026 — Varredura de marcas de indecisão

O push.

## 19/09/2026 — METODO no pacote e reorganização do menu

O experimento `captura-json` (em andamento).

* **O deploy** — o pacote regenerado **não** foi publicado; o deploy é do dono.
* O **relatório** continua escrito à mão; a geração sob demanda é a ideia do `captura-json` (não implementada).
* O **guia** também continua escrito à mão: ele **já é** derivado de PO + Aula no conteúdo, mas quem o
  escreve é a pesquisadora — a geração sob demanda não está implementada.

- Os dois POs **não** foram reescritos: os avisos apontam o que falta em cada um, e nenhum aviso
  reprova commit nem validação.
- O **extrator do plano** (o irmão) — próximo passo. Ele depende deste contrato, e o
  `plano-01.json` escrito à mão **não é uma extração: é uma leitura** (chaves renomeadas, coluna
  descartada, valores convertidos, e o calendário que não está no `.md`).
- O contrato vive **dentro** de `validar-po-ciclo.js`: para o irmão compartilhar o mesmo contrato —
  e não divergir, como os dois resolvedores de fonte que geraram o `lib-fontes.sh` — ele terá de
  sair para uma lib.

- **Não houve conferência visual** — não há navegador nesta máquina. A regra foi escrita
  para não depender de nada além da largura, e o comportamento em tela estreita é
  exatamente o de antes; a conferência visual é do dono.
- O **deploy** do pacote regerado é do dono.

- O **extrator do plano** (o irmão) — próximo passo.
- O **mapa de colunas** (cabeçalho da tabela → chave do alvo) e a regra de **tabela item/valor →
  objeto**: são as duas DECLARAÇÕES que ainda não existem.
- O contrato da lib ainda não é exercitado por um teste próprio: hoje quem o prova são os dois POs
  (e, de agora em diante, também o plano).

- O **irmão** (o extrator do plano) e o **schema do plano** — próximo passo.
- As **conversões de valor** (`"60 minutos (Pré-requisito 4)"` → `60`; `"01"` → `1`) e as
  diferenças de **tipografia** (`17/09/2026` × `2026-09-17`; travessão `–` × `-`): declará-las
  exigiria regras de leitura, e a decisão foi **não ler prosa**.

- Nada no fluxo de produção consome o extrator do plano: quem gera o guia e a musicalidade hoje é
  o experimento `captura-json`. Ligar isso é o passo seguinte.
- As conversões (número, data ISO) e a limpeza da prosa que fica nos arrays ficam **fora, por
  decisão**: converter é ler.
- O schema do plano **não** está no pre-commit: o plano ainda não é validado automaticamente.

- A lib **não tem teste próprio**: quem a prova são os documentos e a captura.
- O que os documentos **não** exercitam (a frase do array vazio, `lacunas`, `extras`) foi
  conferido por chamada direta à lib, e não por um caso da captura.

- O plano do **Ciclo 02** (e o da Débora) não existe ainda: o hook simplesmente não valida.
- O aviso das lacunas só aparece no `git commit` de verdade (dentro do hook): não há um `--check`
  avulso que o mostre.

- As **conversões** (número, data ISO) e a limpeza da prosa que fica dentro dos arrays: fora, por
  decisão.
- O `phenomenon` como prosa dá **um** item no guia, onde a leitura à mão dava quatro: para voltar a
  quatro, a FONTE precisa listar os observáveis (e o schema declará-los como array).
- Nada disso está no fluxo de produção: quem gera ainda é o experimento.

- A extração é por LINHA e não preserva a indentação: a pontuação é a pista que resta. Guardá-la no
  contrato é a alternativa estrutural — e mexeria em todo o texto extraído (é uma decisão maior).
- As conversões (número, data ISO) continuam fora, por decisão.

- A tabela "Escopos" do **`REGRAS.md`** (Regra 17 em prática) **continua listando 10** escopos,
  enquanto o hook aceita 27. É a defasagem que o `HANDOFF.md` declarou (e que uma entrada anterior
  deste REGISTRO deu por corrigida — o que foi corrigido foi o `README-ciclos.md`, não o
  `REGRAS.md`). `REGRAS.md` é congelado: corrigir exige commit próprio, com motivo declarado. Fica
  proposto, não feito.

- Nada impede a defasagem de voltar: os dois espelhos são **texto**, e ninguém os compara. Um teste
  que confrontasse o regex com a documentação seria a garantia — o `pre-commit` não olha para isso.

- O JSON da **Ritmos** (Duo primeiro, por decisão) e o primeiro lançamento real.
- As **vistas ainda não saíram da cobertura** — convivem com o JSON até a peça 4, e é o que o
  comentário no `fontes_do_ciclo()` declara.
- O **gerador ainda não lê o JSON** (peça 3) e os **builders ainda vivem no experimento** (peça 2).

- O formulário **ainda tem as suas cópias** (a Fase 2 as remove e passa a consumir a lib): até lá há
  duplicação **temporária e declarada**.
- O `gerar-ciclo.sh` **não lê o JSON** ainda — é a peça 3.
- O `comoLista` do formulário ficou **sem uso** (código morto de uma rodada anterior): sai na Fase 2.

- O guia gerado **não traz** três coisas que só existiam no escrito à mão: a nota "este documento não é o
  relatório / onde ele está", a **data da aula** e o checklist "o que preencher depois" — este último,
  por desenho (quem preenche é o formulário). Os dois primeiros são bloco fixo + dado do calendário;
  **não foram inventados** — é decisão de quem escreve o guia.
- As outras vistas (caderno, relatório, acompanhamento) **não** são geradas pelo pacote: elas derivam do
  JSON de dados, que ainda está vazio (peça 1) e é alimentado pelo formulário.
- §7.2, §7.4, §7.5 e §7.6 seguem em aberto — nenhuma bloqueia.

- A nota *"este documento não é o relatório"* **não volta** no guia gerado (decisão da
  pesquisadora, 20/09).
- A peça 5 — migrar o guia do Ritmos (Fase 2).

- O **extrator não leva blockquotes** (`> **Nota …**`): o PO do Ritmos tem 3 e o do Duo 2, e nenhuma
  chega ao JSON — a nota P-22 está no documento e não na extração. É pré-existente e **não** foi
  mexido aqui (mudaria o que todos os balanços veem); fica declarado.
- A peça 5 — o guia do Ritmos gerado — segue na Fase 2, com a tabela do PO e a estrutura do plano.

Hook `PreToolUse` para o auditor. Fica declarado que o `REGISTRO.md` apareceu no worktree em
variante divergente (15 entradas duplicadas e arquivo truncado) e foi restaurado do commit
anterior antes desta entrada — nenhuma daquelas reescritas foi aproveitada.

## 23/09/2026 — A identidade do projeto entra na documentação (e a ressalva do FIPP)

O desenho das duas fronteiras — a **entrada** (como o PO chega: hoje é um `.md` copiado à mão)
e a **saída** (o módulo de avaliação, que derivaria da cadeia de custódia em vez de aproximar
questões do plano). A porta de entrada na tela (modo IA × modo formulário) também segue por
fazer.

## 23/09/2026 — A varredura da deriva de identidade: o que ficou fora da primeira correção

Os pacotes (HTML + PDF) dos dois ciclos **não** foram regerados, e portanto as páginas publicadas
ainda trazem "hash FIPP". Regerar exige `tools/gerar-ciclo.sh` e novo deploy — deixado para
quando o professor pedir. Fica também por fazer o desenho das fronteiras de entrada e saída, acima.

## 23/09/2026 — A seção que só tinha citação, e o ciclo simulado da Diaghilev

Os **dois achados acima não foram corrigidos** — mudam comportamento em `tools/` (congelado) e a
decisão é da pesquisadora: (a) o config da captura passar a ser **por aula**; (b) o mapa de
apelidos sair da parte cifrada (ou a página decifrar quando a aula ainda não tem dado). Os
pacotes dos ciclos anteriores **não** foram regerados. A porta de entrada na tela (modo IA × modo
formulário) segue por fazer, como acima.

## 23/09/2026 — O gerador não herda mais o locale de quem o chama

- Os demais pontos de entrada que escrevem texto (`gerar-acompanhamento.sh`, `gerar-handoff.sh`,
  `gerar-vista.js`, `calendario.py`, `cifrar-dados.js`) **não** foram tocados: quando chamados
  pelo `gerar-ciclo.sh` herdam o locale corrigido, mas **invocados isoladamente** continuam
  dependendo do ambiente. Declarado, não resolvido.
- O ciclo da Diaghilev **ainda não foi commitado** — e é o commit seguinte a este.

- O `check-pacote.js` passa a **procurar U+FFFD** nas saídas (HTML, CSS, JSON, Markdown) e
  **reprova**. Foi a lacuna que deixou o defeito chegar ao `pdflatex`: o pacote corrompido
  passava com **0 erro(s)**, 528 links internos e 31 páginas.

> **Correção de 23/09/2026 (mesmo dia).** A primeira redação desta entrada dizia que "o pacote
> corrompido passava com 0 erro(s), 528 links internos e 31 páginas". **Está errado**: aquela
> medição — 0 erro(s), 528 links, 31 páginas — foi feita sobre um pacote **saudável**, gerado sob
> o locale do terminal; não mediu o pacote corrompido. O que se mediu no estado corrompido foi o
> contrário: o `check-pacote` **reprovou**, com 1 erro — `PDF: documentos ausentes no texto do
> PDF`, nomeando Caderno, Guia de observação e Método. A lacuna continua a existir (o check não
> procura U+FFFD, e se o PDF fosse regerado — impossível, o `pdflatex` morre antes — os dois lados
> estariam corrompidos e **coincidiriam**); mas o guarda existente **não** passou em silêncio. A
> versão anterior não é apagada: fica como o elo que registra o que se pensou antes da correção.

## 25/09/2026 — O HANDOFF truncado: o glob que abortava a geração em silêncio

O `HANDOFF.md` regerado passa a listar o **fochini** (que a versão anterior não via) e a trazer as
âncoras atuais — mas continua sendo saída gerada: nunca se edita à mão, corrige-se o gerador. As
O **planejamento da aula ainda não tem todos os campos de que precisa** — o próprio
`experimentos/captura-json/RELATORIO.md` §4.6 declara a lacuna: **falta a estrutura executada** (que
viria do plano da aula e o JSON não carrega), o volume em tempos, o que foi abandonado, a linha de
base. E `ciclo-01-plano-schema.json` declara a sua própria: *"o calendário **NÃO** está no `.md`"*, e
os tipos do schema são os que **o documento oferece**, não os que o dado ideal teria. Corrigir a
redação **não** fecha essa lacuna — apenas deixa de negar a etapa que a tem. A ordem que o
repositório já registrou (`RELATORIO.md` §4.5) permanece: decidir onde o JSON vive, medir o custo do
hash-como-fonte, **escrever o validador do `dados.json`**, e só então um ciclo-piloto.

---

## 25/09/2026 — O campo `norma`: o PO ganha o padrão de referência que era o seu próprio produto


- **`PROTOCOLO.md:224` e `:229` estão desatualizados e não foram tocados aqui.** O `:224` lista os
  campos do PO e omite `norma`, `linhaDeBase` e `condicoesDeContorno` — a omissão é **anterior** a
  este campo; o `:229` diz *"os cinco itens do checklist"*, e agora são **seis**. Vão para um
  **commit próprio**, congelado, com o seu próprio motivo declarado. No mesmo `:224`,
  *"justificativa (4 subcampos)"* está **correto** (medido) e **não** muda.
- **A norma continua em `[Preencher]` nos três ciclos.** O campo existe; o conteúdo não. Quem o
  preenche é a **entrevista**, e ela ainda não foi reescrita — a próxima etapa é a versão amigável em
  `prompts/eliciar-ciclo.md`.
- O item `normClearlyEstablished` fica **desmarcado** até a norma ser elicitada; só então o `state`
  volta a `Input_PO_Validado`.
- **Pendência de forma em `ciclo-01-duo-po.md`:** o bloco `linha de base` tem **duas** tabelas; o
  extrator descarta a segunda e ainda assim sai com `exit=0` (2 avisos). Fica como dívida declarada,
  **não** corrigida neste commit.
---

## 25/09/2026 — `PROTOCOLO.md`: a tabela do PO passa a nomear o que o schema já exigia


- **O desenho do mapa não foi tocado.** O deck tem **três** falhas de contraste medidas —
  `#ffffff` sobre `#b08d57` (**3,09**), `#fdf6ea` sobre `#b08d57` (**2,88**) e `#8a6a3b` sobre
  `#e8dcc8` (**3,69**) — mas elas vivem no **desenho** (`rizoma-slide.svg`, o mapa embutido no
  deck e os outros SVGs), **não** no CSS. O gerador casa o SVG **como texto literal**, então um
  `var(--gold)` ali não resolveria: mudar essas cores é mudar o desenho, e por isso ficam como
  **dívida declarada**, não como correção deste commit.
- **O `check-identidade.js` ainda não entrou no rito.** Ele existe e passa, mas **não** é
  chamado pelo `pre-commit`. Enquanto não for, a checagem depende de alguém lembrar de rodá-la.
- **Nada foi commitado.** A frente espera o commit próprio do rito; o `prompts/eliciar-ciclo.md`
  tem modificação **pré-existente** e **não** pertence a esta mudança.
- **A Frente B segue intocada:** os dois defeitos do formulário (o `gerar-ciclo.sh` extrai só a
  `captura-aula-01`, e o `DOCS` é escrito à mão) e as decisões em aberto da captura (§7.2, §7.4,
  §7.5).

## 25/09/2026 — A hora da aula entra no `DIAS`, e o calendário passa a ter de onde contar o prazo


- **Nada foi commitado.** Esta entrada e as alterações esperam o commit próprio do rito, que
  precisa ser **separado** do commit da identidade visual (Frente A) — são duas mudanças
  distintas. O `prompts/eliciar-ciclo.md` tem modificação **pré-existente** que não pertence a
  nenhuma das duas e deve ficar de fora.
- **O consumidor do `--aulas-arquivo` ainda não existe.** O TSV está escrito e o formato está
  fechado, mas quem o lê é o índice por aula (§4.2, peça 4) e o prazo (§3, peça 7) — nenhum dos
  dois implementado. Hoje **não há teste de ponta a ponta** dessa ponte: só a geração do arquivo
  foi verificada.
- **As 48 h continuam valendo no `lancamento.html`.** O `HORAS_DO_PRAZO = 48` **não** foi
  trocado pela fórmula do §3: trocá-lo é a peça 7, e depende do índice por aula. Até lá o
  formulário segue como estava — agora com o dado que a fórmula vai precisar já disponível.
- **As outras nove peças do §10 seguem intocadas.** Os dois defeitos do formulário (o
  `gerar-ciclo.sh` extrai só a `captura-aula-01`; o `DOCS` é escrito à mão), a âncora por aula, a
  declaração "aula dada", o ajuste no plano, a P-13 e a eliciação.
- **O roteiro do §8 não previa o `calendario.py`.** A lista do `ARQUITETURA-AULA.md` §8 nomeia
  `gerar-ciclo.sh`, `lib-fontes.sh`, `hash-ciclo.sh`, `lancamento.html`,
  `validar-captura-ciclo.js`, `check-pacote.js`, `pre-commit`, `PROTOCOLO.md` e
  `eliciar-ciclo.md`. O `calendario.py` entrou sem estar nela. **Não é lacuna do §8** — o §8 é o
  roteiro daquela frente, e a lista que define o congelamento é o `CONGELAMENTO.md`, que congela
  `tools/` **em bloco**: o arquivo já era congelado antes de o roteiro mencioná-lo. Fica
  registrado como **arquivo tocado fora do roteiro**, e o rito foi cumprido por isso.
- **A Frente A continua sem commit.** `check-identidade.js` ainda não entrou no `pre-commit`, e
  as três falhas de contraste do **desenho** do mapa seguem como dívida declarada.

> **Correção de 26/09/2026 (nota de `B7`).** Esta entrada cita o §3.1 como *"o menor entre 24h
> antes da próxima data de aula e o fim do bloco + 18h"*. **O `menor` do §3.1 é erro de
> digitação**: medido contra os três cronogramas reais, o operador correto é **`maior`** — `max`
> reproduz os números da tabela do §3.2 (Duo **143 h**, Diaghilev **23 h** e **95 h**) e os
> literais de `prazo` do §4.2 **ao minuto**, enquanto `min` devolveria o piso de 18 h em **100%**
> das datas. A citação acima **não é apagada**: fica como o elo que registra o que se leu antes da
> correção (P-03/P-04). O §3.1 foi corrigido em `ARQUITETURA-AULA.md` — arquivo **livre**, fora da
> cobertura da âncora, logo **sem reancoragem**. **O que não muda nesta peça:** a hora no `DIAS`,
> o `calendario.py`, o schema, os três `.conf`, os três pacotes e as três âncoras — nada do que
> aqui se fez dependia do operador.
>
> Cai também, pelo mesmo motivo, a afirmação *"as outras nove peças do §10 seguem intocadas"*: a
> **peça 2** (o `DOCS` derivado) foi entregue em 26/09/2026 — é a entrada seguinte. **São oito.**
> E o `HORAS_DO_PRAZO = 48` do `lancamento.html` segue como estava: substituí-lo pela fórmula do
> §3 é a **peça 7**, com rito próprio.

## 26/09/2026 — O `DOCS` deixa de ser lista à mão: as famílias por aula entram na âncora


- **O Defeito 1 segue aberto.** O gerador continua extraindo **só** a `captura-aula-01`, e a página
  de qualquer aula monta esse mesmo painel: os quatro formulários ainda saem idênticos. Entregar a
  config da aula certa é a peça `B3` — a prova de que saem quatro diferentes já existe em
  `experimentos/provar-por-aula.js`.
- **O `tools/check-pacote.js` continua conservador**, como decidido acima. Se a peça `B11` não o
  revisar, ele seguirá sem saber expandir família — o que é suficiente, porque deriva os
  obrigatórios e confere as páginas pelo `<h1>`.
- **Nada foi commitado.** O commit desta peça é próprio e ainda não foi feito, como o de `B1` e o
  da Frente A — os três seguem pendentes e separados.
- **O `HANDOFF.md` não foi regenerado.** Ele ainda descreve o `DOCS` como escrito à mão; a
  regeneração acompanha o commit, não esta peça.

## 26/09/2026 — A P-13 deixa de sugerir que o dado é privado do professor: a escola entra no escopo


- **A eliciação segue pendente.** A §10 item 9 é um **par** — a P-13 **e** a eliciação (§6.2). Só a
  P-13 foi fechada aqui. O `prompts/eliciar-ciclo.md` estava fora de escopo por decisão do plano (e
  tem modificação pré-existente de outra sessão no worktree, preservada).
- **As cinco ocorrências residuais da oposição, deixadas de propósito:**

  | Onde | Por que fica |
  |---|---|
  | `PROTOCOLO.md:88` | É a **pétrea**. A §9 manda **não** reescrevê-la; o parágrafo novo é que passa a delimitar a leitura. |
  | `ARQUITETURA-AULA.md:372` | **Cita** "o texto de hoje" — é a transcrição que o próprio ajuste compara. |
  | `ARQUITETURA-AULA.md:381` | É o **diagnóstico** — chama a oposição de falsa na mesma frase. |
  | `REGISTRO.md:45` | Entrada **histórica** de 18/09/2026. P-03/P-04: a proveniência acrescenta, não edita. |
  | `tools/gerar-handoff.sh:16-17` | Comentário de **arquivo congelado**, que justifica por que o `HANDOFF` separa professores. Exigiria motivo próprio e commit próprio em `tools/`, e **não é onde alguém aprende a regra**. Fica registrado; corrigi-lo, se for o caso, é **peça própria**. |

- **`professores/README.md:12`, `departamentos/README.md:24`,
  `biblioteca/guia-do-professor.md:74` e `ciclo-01-ritmos-po.md:15`** citam a P-13 e **não** contêm
  a oposição falsa — dizem apenas que o PO é/continua sendo do professor, o que **segue correto**.
  **Não foram tocadas.** A última é **fonte sob a âncora** e transcreve a resposta do professor sem
  alteração; tocá-la exigiria reancorar o Ritmos.
- **A §10 do `ARQUITETURA-AULA.md` está desatualizada como quadro de progresso.** Ela ainda diz que
  a peça 1 foi *"a única peça desta lista já executada; as nove seguintes seguem intocadas"* — o que
  já não era verdade depois de `B2` (§10 item 2) e não é depois desta (§10 item 9). **Não foi
  corrigida aqui de propósito**: a §10 é um **quadro único** que cada peça da fila vai precisar
  atualizar, e N agentes escrevendo no mesmo parágrafo é colisão garantida. A harmonização da §10
  fica para **uma passada única**, quando a fila drenar.

> **Correção de 26/09/2026 (nota de `B7`).** Esta afirmação ficou ela mesma desatualizada,
> por duas vias. **Primeira**: o `b7` corrigiu a contabilidade das peças já entregues — o item 1
> perdeu a oração *"as nove seguintes seguem intocadas"*, que a entrega do **item 2** pelo `B2`
> já havia tornado **falsa**, e o item 2 passou a **Feito em 26/09/2026**. Deixar a oração de pé
> não era adiar: era publicar um erro. **Segunda**: aquela oração pressupunha **nove** peças
> seguintes; são **oito** (itens 3 a 10). A redação acima **não é apagada** (P-03/P-04).
> Isto **não contradiz** o "passada única": o que o `b7` tocou foi a **contabilidade factual** do
> quadro — que **não podia esperar** sem virar afirmação falsa —, e o "**mesmo parágrafo**" que a
> passada única reserva é o **texto de fundo do quadro de progresso**, território de outro
> tamanho. Restam **oito peças por fazer** (3 a 10); o **item 7 (o prazo)** segue **aberto** — o
> `b7` corrigiu a **fórmula** do §3, não entregou a peça que a aplica no índice e no fechamento.
> E o **item 9 está parcialmente entregue**: o `b12` escreveu o parágrafo da **P-13** sobre o
> sufixo da escola, mas a **elicitação do §6.2** segue aberta — por isso o item **não** foi
> marcado, e a contagem acima o mantém entre os pendentes.

- **Nada foi commitado.** O commit desta peça é **próprio** — ela é congelado — e ainda não foi
  feito, como os da Frente A, de `B1` e de `B2`, que seguem pendentes e **separados**.
- **O `HANDOFF.md` não foi regenerado**, e desta vez **não ficou desatualizado por esta edição**: ele
  lista apenas os **títulos** das pétreas, não os corpos — o `gerar-handoff.sh:167` extrai as linhas
  `^\*\*P-[0-9]\{2\} —` e emite só o título. A regeneração dele acompanha o commit das entradas do
  `REGISTRO.md`, não esta peça.

> **Fecho de 27/09/2026.** O *"commit próprio — ainda pendente"* do bullet acima **deixou de ser
> pendência neste dia**: `PROTOCOLO.md` e `professores/README.md` entraram no commit
> `docs(protocolo): … a P-13 deixa de sugerir que o dado é privado do professor`, **com o motivo
> declarado no corpo** — o rito do `CONGELAMENTO.md` cumprido. As duas frases acima **não são
> apagadas** (P-03/P-04): eram verdadeiras até 27/09/2026; esta nota é o elo novo.
> O `HANDOFF.md` **foi regenerado no mesmo dia**, no commit das entradas do `REGISTRO.md` — como o
> bullet acima previa, a regeneração acompanha aquelas entradas, não esta peça.

## 26/09/2026 — O prazo do §3 dizia "menor entre" — e dois números do Ritmos estavam errados

- **O `HORAS_DO_PRAZO = 48` do formulário continua como estava** (`tools/templates/lancamento.html:745`).
  Esta entrada corrigiu a **coerência textual** do documento; **substituir o 48 fixo pela fórmula
  do §3 é a peça 7** da ordem do §10, que **toca `tools/templates/`** (congelado) e por isso
  **exige rito próprio** — motivo declarado, entrada no `REGISTRO.md` e commit próprio. **Nada
  disso foi feito aqui.**
- **O §10 tem oito peças por fazer** (3 a 10). A contabilidade da §10 está correta agora, mas o
  trabalho que ela conta **não começou**.
- **O §10 `:403-404` continua factualmente falso.** A frase sobre o TSV *"não existe hoje"* ficou
  desatualizada quando o `B1` entregou o `--aulas-arquivo`. **Não foi corrigida nesta passada**
  (é a passada única de fechamento da §10) — e fica registrado para que a próxima sessão não a
  tome por verdadeira.
- **A última linha da §3.3 mede "o maior prazo já praticado" com um exemplo do Duo**, e essa é
  exatamente a classe de exemplo que esconde o defeito de relógio (um só relógio no `DIAS`).
  **Não foi trocada** — a regra está certa; o exemplo é que não exercita o ramo.
- **O `FECHAMENTO` (§3.4) segue não implementado** — é campo opcional do `.conf`, e nenhum dos
  três o declara. Não entrou nesta rodada.

## 26/09/2026 — O config da captura deixa de ser um por ciclo: um `captura-aula-NN.json` por folha em disco


- **O formulário ainda não lê o config da aula.** Esta peça **publica** os arquivos; quem os
  consome é o `B3b`, e ele **não** foi feito. Até lá, a página do formulário continua montando o
  painel da aula 01 em todas as aulas — os quatro formulários da Diaghilev seguem **idênticos no
  navegador**. O que mudou é que os dados para torná-los diferentes já estão no pacote.
- **O índice por aula (§4.2) não existe.** É a peça **4**, de que o `B3b` depende: sem
  `aulas[].config`, a página não tem como saber **qual** dos quatro arquivos pedir.
- **O `tools/check-pacote.js` não exige o config de cada aula** — ele não conhece config de
  captura. Enquanto isso, um pacote publicado com a folha da aula 03 fora do disco **passa** no
  `check-pacote.js` (o gerador é que derruba, na geração). Rever o validador é a peça `B11`.
- **Nada foi commitado.** O commit desta peça é próprio (o `tools/` congelado exige commit
  separado) e ainda não foi feito — como o do `B1`, o do `B2` e o da Frente A, que seguem
  pendentes. **Este arquivo é a entrada do `REGISTRO.md`, ainda fora dele.**
- **O `HANDOFF.md` não foi regenerado** e a §4.1 do `ARQUITETURA-AULA.md` continua marcando o
  Defeito 1 como aberto: a nota de fechamento e a regeneração acompanham o commit.

## 26/09/2026 — O `check-identidade.js` entra no `pre-commit`: a identidade deixa de depender de alguém lembrar


- **A frente A continua SEM COMMIT.** Este trabalho está no worktree e **não** foi commitado:
  a tarefa proíbe, e o rito dos congelados exige **commit próprio** para `tools/hooks/pre-commit`.
  Enquanto o commit não existir, a seção 5 roda **de fato** (o `.git/hooks/pre-commit` é link
  simbólico para o arquivo do repositório, e a alteração já está viva), mas **não está no
  histórico** — é o único ponto que falta para fechar a frente A.
- **A prova ponta-a-ponta fica devida.** Foi testado o trecho **isolado** e o hook com o stage
  vazio; **não** houve uma execução real do `git commit` com `tools/` no stage, porque isso
  exigiria um `git add` que a tarefa proíbe. **Quem commitar deve ver a seção 5 disparar** e
  conferir a linha `pre-commit: identidade visual ok (4 verificações passaram)`.
- **`tools/check-identidade.js` segue UNTRACKED (`??`).** Ele nasceu nesta frente e **precisa
  entrar no mesmo commit** que o hook — se só o hook for commitado, o `pre-commit` passa a
  chamar um arquivo que não existe no repositório, e **todo commit com `tools/` no stage
  falha** com "No such file or directory". É a armadilha desta frente: **os dois arquivos vão
  juntos**, e o commit é do rito (motivo declarado + commit próprio).
- **E o resto da frente de identidade ainda não foi commitado.** O validador não basta a si
  mesmo: lê `tools/templates/ciclo.css` (**modificado**, sem commit) e `tools/templates/nav.js`
  (**untracked**), compara com o deck e com os `assets/` dos pacotes — e a **seção 3** do hook,
  que roda antes dele, chama o `tools/gerar-ciclo.sh`, que por sua vez invoca o
  `tools/lib-tokens.js` (`--latex`) e é `require`'d por `gerar-animacao.js` e
  `sincronizar-slide.js`. Num clone limpo, **o commit do rito não pode levar só o hook e o
  validador**: tem de levar as **fontes da identidade** (`tools/templates/ciclo.css`,
  `tools/templates/nav.js`, `tools/lib-tokens.js`) e o `IDENTIDADE-VISUAL.md` — que o validador
  **não abre** (ele só o cita no comentário e na mensagem de erro), mas para onde ele **manda
  quem lê a recusa**, e que não existe no `HEAD`. Sem as fontes, o `pre-commit` passa a recusar
  a si próprio. Medido com `git status --short` sobre cada arquivo que o script abre.
- **A entrada NÃO foi inserida no `REGISTRO.md`.** Ela existe neste arquivo de sessão; quem
  commitar **acrescenta no FIM** do `REGISTRO.md` (cronológico crescente) — o
  `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO",
  e inserir no topo publicaria o marco errado no `HANDOFF.md`.
- **Uma borda real e declarada, que o teste da tabela toca.** O 20º caminho da minha primeira
  medição foi `identidade nao existe` — e ele **casou** o guard: `^tools/` casa `tools/hooks/…`,
  e qualquer caminho que **comece** com uma das famílias entra, **mesmo que o arquivo não exista**
  (o `grep` só olha texto). É o comportamento correto — o hook trabalha sobre **nomes no stage**,
  não sobre o disco — e note que isso **não** cria caminho de falha falsa: `git diff --cached
  --name-only` só lista caminhos que existem no índice. A tabela publicada tem **19** caminhos
  reais (**9 RODA / 10 pula**); o caminho inventado foi retirado da contagem por não ser um
  arquivo do repositório.
- **A borda do regex.** `assets/style.css.bak` **casa** o guard (a família termina em `/assets/`,
  sem exigir extensão) e `apresentacoes/apresentacao-01-rizoma/README.md`
  **não** casa. A primeira borda é inofensiva — o pior caso é rodar o validador uma vez a mais
  num commit que já mexe em assets — e ficou **medida**, não suposta. Fechar a família com
  `/assets/(style\.css|nav\.js)$` seria mais preciso; não foi feito para manter o regex legível.
  Note-se que a seção 1 **não** cobre esse caso (medi: o regex dela não casa `.bak`), então a
  borda é real, ainda que inócua. **Não é dívida**; é uma borda conhecida, e está declarada.
- **Segue em aberto, da entrada de 25/09:** o **desenho do mapa** tem três falhas de contraste
  (`#ffffff`/`#b08d57` = 3,09; `#fdf6ea`/`#b08d57` = 2,88; `#8a6a3b`/`#e8dcc8` = 3,69) que
  vivem nos SVGs, **fora** do alcance do `check-identidade.js` — o validador não as vê e este
  hook **não** as barra. E a **Frente B** (os dois defeitos do formulário e as decisões de
  captura §7.2/§7.4/§7.5) permanece intocada.

## 26/09/2026 — O campo ganha a forma canônica da linha de base, a estrutura do consentimento e o formulário da aula


- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. A tarefa proíbe commit, `add`,
  branch, `reset` e `checkout`; a disciplina do projeto exige commit próprio com motivo declarado, e
  aqui nem há congelado para justificar.
- **Esta entrada NÃO está no `REGISTRO.md`.** Ela existe neste arquivo de sessão; quem mesclar
  **acrescenta no FIM** do `REGISTRO.md` (ordem cronológica crescente, a mais recente no fim)
  porque `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO"
  e inserir no topo publicaria o marco errado no `HANDOFF.md`.
- **O consentimento continua NÃO FECHADO, e agora isso está declarado em dois lugares** (a seção do
  `README.md` e o cabeçalho do `consentimento.md`). Ele é **estrutura com lacunas**: enquanto houver
  `[Preencher: …]`, **não existe termo aplicável ao campo** — e a decisão de parar aí é deliberada,
  porque a redação jurídica não é do protótipo. **Nenhum dos professores tem consentimento
  assinado**; nem há onde arquivá-lo sem que se decida se as vias entram no Git (a decisão está entre
  as lacunas).
- **`linhadebase-duo-forma-canonica` NÃO EXISTE no banco de todos.** A tarefa dizia que esta peça o
  destravaria; medido, `SELECT … WHERE id='linhadebase-duo-forma-canonica'` devolve **0 linhas**. A
  forma canônica **está** fixada no `README.md` (26/09/2026, linhas 52–151), mas não há todo a marcar
  como `done` — o destravamento é declarado aqui, não registrado no banco.
- **A divergência do schema não foi corrigida.** `ciclo-01-po-schema.json:33–36` continua descrevendo
  `linhaDeBase` como tabela de dimensões, e a regra do extrator (`lib-extracao-md.js:94–96`) continua
  descartando a segunda tabela de um bloco — de modo que as linhas por aluna do PO do Duo **seguem
  fora** do `po-01.json` (medido: 3 objetos de dimensão, 0 por aluna). Ficou `[Preencher: dar à tabela
  por aluna do PO do Duo um bloco próprio …]` no `README.md`. Os dois arquivos são **congelados**, e
  corrigi-los é outra frente.
- **Fica pendente, e é medido, o `Fora do Git?` de `ARQUITETURA-CAPTURA.md` §5.** A tabela de
  comportamento do `consentimento.md` afirma o que o código **faz hoje** — apelido, nome e contato
  fora do Git, PDF sem acompanhamentos, HTML cifrado, JSON cifrado por inteiro, acesso só do
  professor — e **não** o que foi decidido. A pendência continua pendente.
- **Um elo morto e pré-existente, que NÃO foi corrigido para não misturar frentes:** a linha 48 do
  `README.md` aponta para `../REGISTRO.md` — e não existe `professores/tiago/REGISTRO.md`. É anterior a
  esta mudança e ficou como estava.
- **Nota datada de correção — 26/09/2026, mesma sessão.** Duas afirmações escritas **acima**, nesta
  entrada, saíram erradas e **não foram apagadas** (a regra do projeto — o passado se incorpora, não se
  reescreve — vale também para os artefatos de sessão). A correção segue aqui, datada:
  1. Onde está escrito *"**Dez** lacunas jurídicas no artefato, mais as duas de aplicação"*: **medido**,
     o `professores/tiago/campo/consentimento.md` tem **12** marcadores `[Preencher:` no corpo
     (linhas 71, 73, 75, 80, 83, 89, 90, 91, 92, 97, 100 e 102 — mais 2 ocorrências que são remissão
     ao próprio marcador no cabeçalho, linhas 16 e 18, que **não** são lacunas). A repartição é:
     Partes e assinatura **3**, Base legal e finalidade **2**, Guarda e ciclo de vida **4**, Aplicação
     **3** = **12**. A seção de lacunas do `README.md` (linhas 203–226) tem **11** marcadores, mais
     **1** no aviso de fronteira (linha 181) = **12**. O total correto é **12**, não dez.
  2. Onde está escrito *"`toolstools/../ciclo-01-po-schema.json`"* na lista **Com o quê.**: é erro de
     digitação. O caminho correto é **`professores/tiago/ciclos/ciclo-01-po-schema.json`** (linhas
     33–36 e 115, medido). Os demais caminhos daquela lista foram conferidos e estão certos.

## 26/09/2026 — A data da aula deixa de ser adivinhada: o `ciclos.json` passa a declarar `aulas[]`

> **Nota de mesclagem (para quem mescla).** Esta entrada existe no arquivo de sessão
> `/home/mti/.copilot/session-state/f4d16739-cbc4-4204-a8c4-a98e7eb73fdd/files/registro-b4.md`.
> **Acrescente-a no FIM do `REGISTRO.md`** — a ordem é cronológica crescente e
> `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO";
> inserir no topo publicaria o marco errado no `HANDOFF.md`. Nada foi commitado.


- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. A tarefa proíbe `commit`, `add`,
  branch, `reset` e `checkout`. O congelamento exige **commit próprio** para `tools/` e para
  `tools/templates/` — o motivo está declarado nesta entrada, o commit fica para quem mescla.
- **Esta entrada NÃO está no `REGISTRO.md`.** Ela existe no arquivo de sessão; quem mesclar
  **acrescenta no FIM**.
- **`prazo` e `ancora` não têm produtor.** Saem `null` em **37/37** aulas. `prazo` é o `B7` (§3);
  `ancora` é o `B5` (§5, o `.fipp` por aula). **Nenhum valor foi fabricado** — quando os dois
  existirem, o índice passa a preenchê-los sem mudar de forma.
- **O "ato declarado" continua sem código.** O §1 descreve planejada → dada → lançada, mas nada lê
  ou escreve `estado`/`lancada`. Por isso os dois são **derivados** da existência de
  `dados.aulas[NN]`. **Isso não distingue "aula dada" de "aula lançada"** e não conhece a aula
  pulada (que o §2 trata como ausência legítima). Enquanto não houver o ato, `estado`/`lancada` do
  índice são aproximação, e é isto que a próxima sessão precisa saber.
- **O `B3b` continua pendente, e é o Defeito 1.** O formulário ainda lê `peca(c.id, 'captura')` —
  o config do **ciclo** — em vez de `peca(c.id, 'captura-aula-' + aula)`. Os arquivos por aula já
  existem em disco (o `b3a` os publica) e o índice agora dá a **chave** (`config`); falta a página
  consumir. **Este índice é pré-requisito do `B3b`, não o desfecho dele.**
- **`experimentos/provar-por-aula.js` segue provando o Defeito 1, com código 0** — é a prova que o
  `B3b` vai ter de virar verde de comportamento, não de arquivo presente.
- **O `check-pacote.js` não lê `ciclos.json`** e portanto **não pode** detectar regressão de
  índice. Foi por isso que a verificação desta peça é por fora dele (medição do `aulas[]`,
  conferência aula a aula do defeito e a execução das funções reais do template). Um validador de
  índice é trabalho aberto.
- **`experimentos/captura-json/formulario.html` continua divergente** — comentário em `:669`,
  `|| 7` em `:715`, remissão em `:1175`. Declarado, **não** espelhado. Se a decisão for convergir as
  duas cópias, é outra peça.
- **`primeiraSemDado` e `opcoes()` ainda têm o caminho de contagem** como fallback para índice sem
  `aulas[]` (os fixtures de `experimentos/`, que declaram `intervalo_dias` e não têm índice). A
  remoção desse caminho só é segura quando todos os ciclos publicados tiverem `aulas[]`.
- **A linha de corte não foi acoplada.** Ela continua vivendo só em `tools/lib-vistas.js` e só
  alimenta o acompanhamento por aluna; **o formulário da aula seguinte ainda não a recebe**. Essa é
  a fronteira declarada no §2 e **fica aberta**.
- **O caso 10 do harness quebra antes e depois.** `mk(id)` não tem `querySelectorAll`, e
  `limparCamposCaptura` precisa dele; a quebra **aborta o resumo final** e mascara os casos 11–20.
  É pré-existente, **não foi tocado** (consertar o harness é outra frente) e é o motivo de a
  verificação desses casos ter sido feita por fora.

## 26/09/2026 — O JSON de dados ganha validador: o `-dados.json` deixa de ser conferido a olho (§4.6)

> **Nota de mesclagem (para quem mescla).** Esta entrada existe no arquivo de sessão
> `/home/mti/.copilot/session-state/f4d16739-cbc4-4204-a8c4-a98e7eb73fdd/files/registro-b10.md`.
> **Acrescente-a no FIM do `REGISTRO.md`** — a ordem é cronológica crescente e
> `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO";
> inserir no topo publicaria o marco errado no `HANDOFF.md`. Nada foi commitado.


- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. O `CONGELAMENTO.md` exige **commit
  próprio** para `tools/` — o motivo está declarado nesta entrada; o commit fica para quem mescla.
- **`ultimo_lancamento` por aula continua sem produtor.** O validador o **exige quando existe**
  (formato de data) e **avisa quando falta** — nos três ciclos, avisa. A §4.1 decide que ele é
  **dentro** da aula; hoje só a raiz o carrega (herança do formulário antigo). Enquanto o produtor não
  mudar, o aviso é o registro honesto disso — **nenhum valor foi fabricado** para calar o aviso.
- **`dada_em` (`B6`) e a `linha_de_base` por aluna (`B13`) são tolerados, não implementados.** Passam
  pelo validador sem regra de tipo própria; quando os produtores existirem, é onde a regra entra.
- **As lacunas da §4.6 são declaradas, não fechadas.** Nove das dez continuam sem campo; a décima
  (`pergunta_emergente`) é do caderno e não deste validador. Em particular, **P-22** continua indo à
  mão no documento — o validador **diz isso** em vez de o esconder.
- **O validador não é chamado por `tools/check-pacote.js`.** Ele entra pelo `pre-commit`; a validação
  de pacote por aula é o **`B11`**, frente separada e arquivo de outra peça.
- **A âncora `.fipp` não precisou ser reancorada** por esta peça: `tools/` **não** entra na cobertura
  de `fontes_do_ciclo()` (`tools/lib-fontes.sh:137`), e a conferência `tools/hash-ciclo.sh tiago 01
  duo --check` continua **exit 0** (*"ciclo 01-duo íntegro; cadeia intacta"*).

## 26/09/2026 — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo` sai calculado do calendário (§3)

> **Nota de mesclagem (para quem mescla).** Esta entrada existe no arquivo de sessão
> `/home/mti/.copilot/session-state/f4d16739-cbc4-4204-a8c4-a98e7eb73fdd/files/registro-b7-impl-prazo.md`.
> **Acrescente-a no FIM do `REGISTRO.md`** — a ordem é cronológica crescente e
> `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO";
> inserir no topo publicaria o marco errado no `HANDOFF.md`. Nada foi commitado.


- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. O `CONGELAMENTO.md` exige **commit
  próprio** para `tools/` **e** para `tools/templates/` — **dois** commits, ou um para cada item, e
  **separados** do trabalho das outras frentes que hoje dividem o worktree. Os motivos estão declarados
  nesta entrada; os commits ficam para quem mescla.
- **Dois débitos do `REGISTRO.md` ficam resolvidos por esta peça** — e ficam registrados aqui para não
  serem relidos como verdade: `:3315` (*"O consumidor do `--aulas-arquivo` ainda não existe"*) —
  **agora existe**, é o `aulas[]` do `B4` mais o `prazo` desta peça, e o prazo tem teste de ponta a
  ponta contra o `ciclos.json` de verdade; `:3319` e `:3749` (*"As 48 h continuam valendo no
  `lancamento.html`"* / *"O `HORAS_DO_PRAZO = 48` … continua como estava"*) — **o 48 fixo saiu**; o
  prazo passou a ser lido do índice e as 48 h sobrevivem só como `HORAS_DE_RESSALVA`, o fallback.
  As redações antigas **não** foram apagadas (P-03/P-04): esta é a nota datada de que envelheceram.
- **O `FECHAMENTO` (§3.4) segue não declarado em `.conf` nenhum.** O código **honra** o campo (teto,
  validado, com data inválida recusada), mas **nenhum dos três ciclos o usa** — e **não foi inventado**,
  porque inventar data é proibido. Quem o elicia é `prompts/eliciar-ciclo.md` (campo *"data de
  fechamento"*), que é **congelado de `prompts/`** e **não foi tocado** aqui. Enquanto ele não
  perguntar, o campo nasce vazio — que é o normal declarado na §3.4.
- **`ARQUITETURA-CAPTURA.md:313` ainda diz "48 horas".** O §5.1 descreve a regra antiga — renovada a
  cada gravação — e agora ela é só ressalva. **Não foi corrigido aqui**: é documento de outro escopo
  (captura, não aula) e a redação precisa da mesma passada de coerência que a §3.1 teve. Fica o aviso
  para a próxima sessão não o tomar por verdade.
  > **Nota datada — 27/09/2026. Este aviso foi cumprido; a pendência está FECHADA.** O §5.1 foi
  > corrigido na entrada *"A §5.1 para de dizer 48 h"* (mesmo dia, no fim deste arquivo): ele agora
  > dá a fórmula da §3.1, as medições das janelas e a ressalva das 48 h **nomeada como ressalva**. As
  > duas redações antigas — as 48 h renovadas e a Nota do `ultimo_lancamento` — **não** foram
  > apagadas (P-03/P-04): viraram notas datadas. A linha citada (`:313`) **não vale mais**: o arquivo
  > cresceu, e o bloco hoje está em `§5.1`. **O que continua aberto é só outra coisa:** o motivo
  > obrigatório do formulário, que a `§5.1` passou a declarar como **divergência** (a resolver no
  > `B8` ou na revisão do formulário). A frase do aviso **não** foi reescrita: fica como o elo que
  > registra o que se pensou antes da correção.
- **`experimentos/captura-json/formulario.html` continua com a regra das 48 h.** É demonstrativo e
  está fora de pacotes, hashes e publicação; alinhá-lo ao `prazo` declarado é decisão de outra peça.
- **`lancamento.html` mudou de comportamento, não só de redação.** O prazo era **dinâmico** (reabria a
  cada gravação) e passou a ser **fixo por aula**, lido do índice. É a consequência direta da §3.1, mas
  é mudança de comportamento visível para quem lança — e está aqui declarada como tal.
- **`ancora` por aula (§5) continua SEM produtor** e sai `null` nos três ciclos. Esta peça deu produtor
  a **uma** chave (`prazo`), não a duas — e o comentário do gerador agora diz isso com precisão.
- **O `launch.json` do pacote não traz `intervalo_dias`**, então `dataPlanejada()` no formulário segue
  **caminho morto** — outro item do §10, fora desta peça.
- **As demais peças do §10 seguem intocadas:** a âncora por aula, a declaração "aula dada", o ajuste no
  plano, o painel por escola e a eliciação. A contabilidade do §10 está correta; o trabalho que ela
  conta **não** começou.

---

## 26/09/2026 — A âncora deixa de existir só por ciclo: um `.fipp` por aula (§5.2)

> **Nota de mesclagem (para quem mescla).** Esta entrada foi preparada e medida na sessão de
> 26/09/2026; os números vêm de execução real, não de previsão. **Nada foi commitado.**


- **A metade do gerador.** O campo `ancora` do índice continua gravado como `None`
  (`gerar-ciclo.sh:383`); **ninguém aponta** do `ciclos.json` para o `-aula-NN.fipp`. A âncora
  existe no disco; o índice ainda não sabe dela.
- **O `pre-commit` não valida `-aula-NN.fipp`.** A linha `:63` do hook monta o caminho
  **literalmente** como `ciclo-$numero-$v.fipp` — logo as 6 âncoras de aula passam **fora** da
  checagem automática de commit. Hoje só `--check` manual as confere.
- **O `gerar-handoff.sh` não as lista.** A tabela de âncoras (`:152-163`) tem 5 colunas fixas
  (`Variante | .fipp | hash | parentHash | po_state`): um campo novo **não a quebra**, mas o
  `ancorado_em` **não aparece** ali e as âncoras de aula **não são relacionadas**.
- **A tolerância e as órfãs ficam como contrato declarado, sem teste.** A âncora de aula ausente
  é `aviso:` e a órfã também — mas não há caso de teste que force os dois caminhos.
- **O critério de inclusão do relatório na âncora da aula** é o que faz duo/ritmos terem **3**
  fontes e o diaghilev **2**. Está implementado e medido; **não** está justificado por escrito.
- **A correção do slug — defeito PRÉ-EXISTENTE, corrigido de passagem.** A variável `PROFESSOR`
  tem **dois papéis**: é o **slug do diretório** (de `$1`) e o **nome de exibição** (do `.conf`,
  via `source`) — e o `source` acontece **no meio** do script. As dicas de comando impressas nos
  `aviso:`/`erro:` usavam `$PROFESSOR`, que naquele ponto **já é o nome de exibição**; a
  instrução que o professor lia mandava rodar `tools/hash-ciclo.sh Fochini 01 diaghilev`, que
  **falha**. Provado pré-existente: `git show HEAD:tools/hash-ciclo.sh` traz as **3** linhas
  antigas (`HEAD:181`, `HEAD:191`, `HEAD:204`) com `$PROFESSOR`. Corrigido com `PROFESSOR_DIR`
  (linha `:70`, antes do `BASE` e dos `source`) e as **5** dicas — **3 das 5 eram o defeito
  antigo**, e são elas as **3 deleções** do `159 3`. **Não tocado de propósito:** o
  `echo "professor: $PROFESSOR"` **dentro** dos `.fipp`, que grava o nome de exibição
  **intencionalmente**.
- **Nota datada — redação que envelheceu.** Os últimos bullets da entrada do `B7`
  (`b7-impl-prazo`) afirmam que *"`ancora` por aula (§5) continua SEM produtor"* e listam *"a
  âncora por aula"* entre as peças do §10 **intocadas**. A segunda frase **deixou de valer em
  26/09/2026**: a âncora por aula agora existe, materializada, com `--check` verde nos 3 ciclos.
  A primeira **continua valendo para o índice** — o `ancora` do `ciclos.json` segue `None`. A
  redação antiga **não** foi apagada (P-03/P-04); esta nota é o elo novo.


- **O produtor continua declarando `config` sem folha — achado desta peça, NÃO corrigido.** O
  `gerar-ciclo.sh:382` segue emitindo `'config': 'captura-aula-%s.json' % nn` **incondicionalmente**.
  Resultado medido: **duo** leva **11** avisos (`aulas 02..12`), **ritmos** leva **20**
  (`aulas 02..21`) — todos dizendo que o produtor promete um config que não tem folha na fonte. A
  correção é **condicionar a declaração à existência da folha** (§4.2 já omite `config` nesse
  caso). **Não foi feita aqui**: o `tools/gerar-ciclo.sh` está fora da fronteira de escrita desta
  peça — está sendo alterado **em paralelo** por outra frente (`b7-impl-prazo`) — e editá-lo
  causaria conflito. **Follow-up declarado.**
- **Os 3 pacotes NÃO foram regerados — por decisão.** Esta peça valida contra os pacotes **como
  estão no disco**. O `b7-impl-prazo` vai regerá-los; **é esperado**. Se o produtor passar a
  omitir o `config` sem folha, os avisos de duo/ritmos (11 e 20) **desaparecem** na próxima
  geração, sem que o `check-pacote.js` mude uma linha.
- **Não há teste automatizado da checagem nova.** A prova foi um **teste destrutivo controlado**,
  manual, feito fora do pacote real: com uma cópia do pacote da diaghilev, (a) removido o
  `captura-aula-02.json` (folha existe na fonte) ⇒ **FALHOU: 1 erro**; (b) criado um
  `captura-aula-99.json` órfão ⇒ **FALHOU: 1 erro**; (c) removido o `aulas[]` do índice ⇒
  **OK: 0 erro, 1 aviso** (formato antigo não falha); (d) declarado o mesmo config por 4 aulas ⇒
  **FALHOU: 6 erros** (duplicidade + os 3 órfãos decorrentes). O diretório de teste foi **removido**
  ao fim. **Nenhum caso de teste ficou no repositório** — a cobertura do caminho de erro é manual.
- **A procedência do teste destrutivo foi adaptada.** O escopo pedia a cópia "para `/tmp`"; a
  política de segurança desta sessão **proíbe** escrita em `/tmp`, `/var/tmp` e `mktemp`. A cópia
  foi feita em `.b11-tmp/` **dentro do repositório** (para que o `dirFontes` — o diretório das
  fontes, irmão do pacote — continuasse resolvendo o `.conf` e as folhas), e o diretório foi
  **removido ao fim**. `git status --porcelain` não tem vestígio dele. O **intento** do escopo
  (verificar que a checagem pega) foi cumprido; só o **caminho** do diretório temporário mudou.
- **A checagem só confere vínculo, não conteúdo.** Ela olha **existência** e **não-vazio** do
  arquivo do config, e o **alinhamento** com `aulas[]`. A validade do **conteúdo** do config por
  aula (schema, campos, coerência com o PO) é da fronteira do `tools/validar-dados-ciclo.js` —
  **não** desta.
- **`config` apontando para fora do pacote** (caminho absoluto ou com `..`) não é conferido; o
  `path.join` aceita e resolve. Não há caso desses nos 3 pacotes hoje.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O
  `REGISTRO.md` **não** foi tocado por esta peça: esta entrada é o artefato de sessão que o agente
  principal mescla, preservando a ordem cronológica do arquivo.

---

## 26/09/2026 — Os apelidos saem em claro: um ciclo sem lançamento passa a listar as alunas


- ⚠️ **A caixa do `escola` está FECHADA na decisão, mas continua sendo uma caixa**: o índice
  declara **exibição** e o nome de arquivo exige **slug**, e as duas coisas convivem no mesmo
  campo do índice. A decisão tomada aqui — derivar do `c.arquivo` com regex ancorada — **contorna**
  a ambiguidade sem resolvê-la **na origem**. A origem é o `gerar-ciclo.sh`, que grava
  `'escola'` (exibição) e `'arquivo'` (o nome) lado a lado; unificar isso é outra peça, e não foi
  feita.
- **`dados.ciclo` é dado morto** e **continua morto**. Não foi tocado nem removido — removê-lo
  mudaria a forma do JSON de produção, e não há consumidor que justifique.
- **`carregarCiclo` não mudou de forma, só de dependência**: ele continua sendo quem monta o
  objeto `cache[c.id]` com `captura`/`po`/`plano` por `peca(c.id, …)`. O que mudou é que o
  fallback `if (!texto)` **deixou de acontecer** no ciclo sem lançamento — o
  `lerDadosDoCiclo` já devolve a estrutura com os apelidos, e é ele que passa a ser o único ponto
  onde `apelidos` nasce. A lista de alunas **abre preenchida**; o que a página ainda não faz, com
  zero lançamento, é outra coisa — e não era o escopo desta peça.
- **A regeneração não é reancoragem — e não precisou ser.** Os 3 pacotes foram regerados e os 3
  `.fipp` **não** mudaram por causa do B9. Os `.fipp` que aparecem `M` no worktree são de outras
  peças (B1/B5), não desta.
- **As 3 fontes em claro não foram tocadas** ⇒ a mudança vive **só no envelope publicado**, que é
  saída gerada. Quem roda o gerador amanhã reproduz o mesmo envelope **desde que** o
  `cifrar-dados.js` seja o desta commit — sem ele, o envelope volta a ter 3 chaves e o defeito
  volta.
- **`b3b` (o formulário lê o config da aula) ainda não foi feito** — é a próxima peça, toca o
  **mesmo** `lancamento.html`, e por isso ficou bloqueada até esta entrada existir.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O
  commit próprio desta peça — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.

---

## 26/09/2026 — O formulário lê o config pela AULA: as quatro aulas deixam de renderizar o mesmo formulário


- ⚠️ **Os avisos de duo e de ritmos são PRÉ-EXISTENTES e continuam de pé** — não foram causados por
  esta peça e não foram resolvidos por ela. Medido no duo: **11** avisos
  `config da aula NN: captura-aula-NN.json declarado no índice, mas a folha de captura não existe
  na fonte — o produtor declara "config" sem folha` (aulas 02 a 12) e **6** avisos antigos de
  glossário/menu. A assimetria é do **produtor**: o `gerar-ciclo.sh:382` declara `config` para
  toda aula, e o `:416-440` só gera o arquivo quando a folha existe. Consertar isso é mexer no
  gerador — **fora desta peça**, e sem isso o aviso é honesto: a folha daquelas aulas **ainda não
  foi escrita**.
- **O formulário não valida que o config declarado é o config da aula certa.** Ele confia no
  índice, como confiava no id do ciclo. Uma divergência entre `aulas[].n` e o conteúdo do
  arquivo declarado passaria silenciosa — quem garante o par é o `b3a`, não o consumidor.
- **A página continua sem regenerar sozinha.** O `lancamento.html` publicado é cópia do template
  feita pelo gerador. Quem roda o gerador amanhã reproduz este formulário **desde que** o template
  seja o desta peça — sem ele, o pacote volta a ler o config **do ciclo** e o defeito volta.
- **`HANDOFF.md` não foi regenerado** por esta peça (é saída gerada, e a frente dele é outra). Ele
  está **desatualizado** no worktree — declarado aqui para não virar surpresa.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O
  commit próprio desta peça — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.

## 27/09/2026 — A nav sai uma vez: o formulário deixa de ser a única página com o `id` dela duplicado


- **A conferência de pacote segue cega a `id` duplicado.** O defeito foi achado por varredura
  **minha**, não por gate. Enquanto o `check-pacote.js:209` usar `new Set(...)`, um `id` repetido
  volta a passar em silêncio. Fechar isso é mexer no validador — **fora desta peça**.
- **Um terceiro marcador nasceria sem guarda.** Os guardas cobrem `<!-- NAV -->` e
  `<!-- CALENDARIO -->`; qualquer marcador novo que o gerador venha a trocar precisa do mesmo
  tratamento, e nada obriga a isso.
- **A âncora não cobre esta classe de defeito.** O `hash-ciclo.sh` hasheia **fontes**; o
  `lancamento.html` é **saída gerada** e fica fora, de propósito. Isso significa que a âncora
  **não** detectaria uma nav duplicada — o gate do pacote é que teria de fazer isso.
- **`HANDOFF.md` não foi regenerado** por esta peça (é saída gerada, e a frente dele é outra). Ele
  segue **desatualizado** no worktree — declarado aqui para não virar surpresa.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O commit
  próprio desta peça — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.

## 27/09/2026 — O estado da aula deixa de ser declarado: quatro estados derivados do cronograma e do prazo


- **O `B8` — o ajuste no plano (§1.2) — não foi feito.** É a última das treze peças, e é a que o
  `podeAjustar()` espera.
- **`podeAjustar()` continua fechado** (`tools/templates/lancamento.html:948`): o ajuste do plano
  não é oferecido em lugar nenhum.
- **`lib-vistas.js:148-154` — `capturarDepois()` não tem chamador.** Bug latente, **não corrigido
  aqui**; fica para o `B8`.
- **Efeito colateral confirmado, a rever no `B8`:** numa aula `dada` **sem** registro, o bloco
  `#acoes-ajuste` fica **oculto** — `barraAjuste.hidden = !!captura || !temAula` e o painel de
  captura está aberto. **Não é perda de ação** (quem a oferece é o painel de captura), mas é uma
  assimetria que o `B8` deve olhar de frente.
- **O ramo `prazo is None` de `derivar_estado` é código morto no caminho real:**
  `calcular_prazos` (`tools/gerar-ciclo.sh:318`) grava prazo para **toda** aula, inclusive a última
  data, que herda o `max(janelas)`. O `if` é **guarda defensiva** — e o comentário no código agora
  diz isso, para que ninguém leia aquele ramo como "o `planejada` normal".
- **O `ancora` do índice continua `null`** nos três ciclos (o `B5` pela metade). Está **registrado
  no `§4.2` como promessa**, não como estado; o conserto é **fora desta peça**.
- **A conferência de pacote segue sem gate para o `estado`** — nenhum validador lê o campo; o único
  consumidor do `ciclos.json` é o `check-pacote.js`, e ele só olha `aulas[].config`.
- **Nada commitado.** Como na entrada da nav: as alterações ficam no worktree, junto das dezenas de
  outras frentes, e o commit próprio — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido
  explícito.

> **Correção de 27/09/2026 (mesmo dia).** Quatro afirmações dos bullets acima **não se sustentam**
> depois do `B8`, e uma delas nunca se sustentou. Corrigem-se aqui, como elo — o texto anterior
> não é apagado (P-03/P-04).
>
> 1. *"O `B8` — o ajuste no plano — não foi feito"* e *"é a última das treze peças"*. **As duas
>    envelheceram.** O `B8` **foi feito** em 27/09/2026 (a entrada própria dele está adiante
>    neste arquivo), e o rótulo *"treze peças"* **não corresponde à §10**: lá são **dez itens**,
>    e a `B13` nunca foi um deles — é item do validador de dados (`linha_de_base` por aluna),
>    **tolerado, não implementado** (`REGISTRO.md:4721` e `:4851`), e continua assim. Da §10,
>    **as oito de implementação estão feitas**; a **9** entregou só a **P-13** (a eliciação segue
>    pendente, `HANDOFF.md:655`), e a **10** (o painel) é *"para depois"* por decisão.
> 2. *"`podeAjustar()` continua fechado (`tools/templates/lancamento.html:948`)"*. **A linha está
>    errada e a afirmação é falsa.** `podeAjustar()` está em **`:1194`** e é **consumido** — em
>    `:1761` (o `disabled` do botão *ajustar*) e `:1767` (o texto do aviso). O que a peça `B6`
>    mediu em `:948` foi outra coisa. Quem **governa o plano** não é `podeAjustar()`: é
>    **`podeAjustarPlano()` (`:618`)**, com o comentário de `:612` explicando que são **dois
>    relógios** — aquele é o do lançamento (depois da aula, dentro do prazo), este o do plano
>    (antes ou depois da aula, até o lançamento). O `B8` entregou o segundo; o `:1784` é quem
>    o consome.
> 3. *"`lib-vistas.js:148-154` — `capturarDepois()` não tem chamador"*. **A função não existe** —
>    nunca existiu. `grep -c 'capturarDepois' tools/lib-vistas.js` → **0**, e
>    `git log --all -S'capturarDepois'` volta **vazio**. Não há bug latente ali; há um nome que
>    foi citado de memória. **Retirado de todas as listas de pendência.**
> 4. *"`grep -n "function estadoDaAula"` → `:871`; `"const pulada"` → `:887`"*. **Os números
>    deslocaram** — com o `B8` o arquivo cresceu: hoje são **`:1109`** e **`:1125`**. As duas
>    funções estão no arquivo e fazem o que a entrada diz; só as coordenadas mudaram.
>
> Uma quinta afirmação **estava certa e continua certa**: o *"Efeito colateral confirmado"* — na
> aula `dada` **sem** registro o bloco `#acoes-ajuste` fica oculto (`barraAjuste.hidden = !!
> captura || !temAula`, `:1757`). O `B8` **olhou de frente**, como a entrada pedia: a ação não se
> perde, porque quem a oferece é a **barra do plano** (`#acoes-plano`, `:1780`), que vive fora do
> painel e não depende de o painel estar aberto. Fica como assimetria **deliberada** e comentada
> no código, não como pendência.

## 27/09/2026 — A §5.1 para de dizer 48 h: o ajuste com prazo passa a descrever o prazo que o `B7` implementou


- **A divergência do motivo fica ABERTA por decisão, não por esquecimento.** O `§5.1` agora **diz**
  que o formulário exige motivo e autor; ele **não** deixa de exigir. Fechar a divergência é mexer no
  `lancamento.html` (congelado) — **a resolver quando o formulário for revisto**, e a decisão da
  pesquisadora foi explicitamente essa: alinhar o documento e **declarar** a divergência.
- **A varredura de deriva não foi estendida.** A autorização cobria **só a `§5.1`**. Ficam de fora,
  e ficam como estão: a **janela de detecção no `§3.3`** do `ARQUITETURA-AULA.md`;
  `tools/validar-dados-ciclo.js:505-516` (o comentário que segue dizendo que o `prazo` sai nulo — o
  `B7` já o produz); o `experimentos/captura-json/formulario.html`; e o **`B8`**. Nada disso foi
  tocado.
- **O `B8` — o ajuste no plano — continua não feito.** É a última das treze peças do `§10`, é o que o
  `podeAjustar()` espera, e é ele que unifica o ajuste do plano ao do lançamento. A `§5.1` agora
  aponta para ele como a peça que resolve a divergência — **o ponteiro existe; a peça, não**.
- **`podeAjustar()` continua fechado** (`tools/templates/lancamento.html:948`) e
  `lib-vistas.js:148-154` (`capturarDepois()`) continua sem chamador — os dois seguem como estavam
  na entrada do `B6`.
- **Nada foi regenerado além do `HANDOFF.md`, e nada foi commitado.** `ARQUITETURA-CAPTURA.md` não
  entra em pacote, âncora ou validador; as alterações ficam no worktree, junto das dezenas de outras
  frentes, e o commit depende de pedido explícito.

> **Correção de 27/09/2026 (mesmo dia).** Dois dos bullets acima **envelheceram** na mesma jornada.
> Corrigem-se aqui, como elo — o texto anterior **não é apagado** (P-03/P-04).
>
> 1. *"`tools/validar-dados-ciclo.js:505-516` (o comentário que segue dizendo que o `prazo` sai
>    nulo — o `B7` já o produz)"*. **Consertado.** O comentário dizia que *"o `ancora` **e o
>    `prazo`** saem nulos"*, o que era **falso desde o `B7`**. Ele hoje está em **`:516-518`** (o
>    arquivo cresceu) e diz o que é verdade: o **prazo é reportado, nunca afirmado** — quem o calcula
>    é o `ciclos.json`, a partir do calendário e do `horario` de cada aula (§3.1) — e só a `ancora`
>    sai nula enquanto não houver produtor. **Deixou de ser pendência.**
> 2. *"O `B8` — o ajuste no plano — continua não feito. É a última das treze peças do `§10`."*
>    **As duas afirmações envelheceram.** O `B8` **foi feito** em 27/09/2026 (entrada própria,
>    adiante neste arquivo), e o rótulo *"treze peças"* **não corresponde à §10**: lá são **dez
>    itens**, e a `B13` nunca foi um deles. Da §10, **as oito de implementação estão feitas**
>    (`ARQUITETURA-AULA.md:8-13`). O ponteiro do `§5.1` **e** a peça existem, ambos.
>
> O que **não** envelheceu nesta entrada: a *"divergência do motivo fica ABERTA por decisão"* —
> segue aberta, declarada em `ARQUITETURA-CAPTURA.md:23-33` — e a **varredura de deriva não
> estendida** (a janela de detecção do §3.3 e o `experimentos/captura-json/formulario.html` seguem
> fora). O bullet *"`capturarDepois()` … continua sem chamador"* **nunca se sustentou** e já foi
> retirado na correção da entrada do `B6`.

## 27/09/2026 — O ajuste no plano deixa de ser promessa: o elo do plano da aula, do schema ao guard do `pre-commit`


- **O `ancora` do índice continua `null` nas 38 aulas** — medido nos **três** `ciclos.json`
  (`diaghilev` 5, `duo` 12, `ritmos` 21). O `.fipp` por aula existe (§5, `B5`), mas o gerador **não
  o consulta**: `tools/gerar-ciclo.sh:472` escreve `'ancora': None` com o comentário *"sem produtor
  ainda"*. **A coluna é a promessa, não o estado.**
- **A `B13` — a `linha_de_base` por aluna — segue tolerada, não implementada.** O validador a aceita
  e ela **não tem regra de tipo** (`REGISTRO.md:4721`, `:4851`).
- **O `check-pacote.js` não tem portão de `estado`.** Ele valida a captura por aula, não o estado
  derivado; um pacote com estado estranho não é recusado por ele.
- **A divergência do *"Motivo do ajuste"* fica ABERTA por decisão.** O §1.1 e o formulário não
  dizem a mesma coisa sobre exigir motivo; alinhar é mexer no `lancamento.html` (congelado) —
  **a resolver quando o formulário for revisto**, e a divergência está **declarada** em
  `ARQUITETURA-CAPTURA.md:23-33`.
- **A varredura de deriva não foi estendida além do escopo autorizado.** Ficam de fora e ficam como
  estão: a **janela de detecção no §3.3** do `ARQUITETURA-AULA.md` e o
  `experimentos/captura-json/formulario.html`. **`ARQUITETURA-CAPTURA.md:23-33` e o `:50-53` foram
  reconciliados** nesta sessão (a nota datada e a mudança de *"seria implementado"* para
  *"contrato do que foi implementado onde há nota datada"*).
- **`capturarDepois()` nunca existiu** — `grep -c` devolve **0** em `tools/lib-vistas.js`, e
  `git log --all -S'capturarDepois'` volta vazio. Foi um nome citado de memória na entrada do `B6`;
  **retirado de todas as listas de pendência.**
- **O `B6` — o estado derivado — está pronto mas NÃO COMMITADO no mesmo worktree.** Esta entrada
  cobre a peça 8; o `lancamento.html` carrega **as duas frentes** e o commit dele tem de dizer isso.
- **Nada foi commitado.** As quatro peças ficam no worktree, junto das dezenas de outras frentes;
  o commit próprio de cada congelado — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido
  explícito.

## 27/09/2026 — A Aula 05 declara o método RAD e o ciclo ganha notação (P-15)


- **A notação do `tiago` continua sem filtro.** A correção lá foi só a do calendário; o filtro
  existe **apenas** no `fochini`. Não há decisão tomada sobre estender — está declarado, não
  esquecido.
- **A `notacao.html` do `tiago` não é a mesma página do `fochini`.** Quando o filtro for estendido,
  é outra peça.
- **A entrada fica no worktree junto do resto.** O commit próprio desta frente — com
  `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.
- **Nada foi commitado.**

## 28/09/2026 — O índice do formulário saía sem a vírgula: a gravação passa a recusar índice inválido


- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** É congelado, a
  alteração é anterior a esta frente, e nenhuma entrada a reivindica — precisa de motivo próprio ou
  de reversão. Está declarado, não esquecido.
- **A causa de raiz do carimbo não mudou de dono, e não precisa:** o `arquivo` carimbado é por
  desenho. A consequência prática continua valendo — o índice baixado aponta para um arquivo que
  **ainda não existe** no repositório até o commit da gravação, e até lá o ciclo responde 404.

## 28/09/2026 — O formulário baixa **dois** arquivos, e o texto passa a dizer isso


- **O lançamento da pesquisadora ainda não está no repositório.** O
  `~/Downloads/ciclo-01-diaghilev-dados-2026-09-28T0840.json` precisa chegar a
  `professores/fochini/ciclos/` — com o carimbo e no nome estável de `fonte_dados()` — junto do
  `ciclos.json` corrigido, e então regerar. **Isso moverá a âncora do diaghilev, e corretamente.**
  Não é desta peça, e não foi feito sem autorização.
- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** É congelado, a
  alteração é anterior a esta frente, e nenhuma entrada a reivindica — precisa de motivo próprio ou
  de reversão. Está declarado, não esquecido.
- **`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda ignorada"* — a
  medição mostra que não cai** (a regex é ancorada em `$`). É arquivo livre, então a correção é
  barata; não foi feita nesta peça.

## 28/09/2026 — O botão passa a ser `Salvar`, e o arquivo vai para a pasta do ciclo


- **As três cópias empacotadas ainda dizem `Gerar JSON atualizado`** — propagadas nesta mesma peça
  logo adiante; a tabela acima registra o estado medido **antes** da propagação.
- **O `HANDOFF.md` ainda não foi regenerado.** Ele carrega o rótulo antigo (`:168`) e a cauda
  preservada (`:175`) da entrada anterior. Regerado depois do commit, como manda o método.
- **O lançamento da pesquisadora continua fora do repositório** — o
  `~/Downloads/ciclo-01-diaghilev-dados-2026-09-28T0840.json` precisa chegar a
  `professores/fochini/ciclos/`. Herdado da entrada anterior; **não é desta peça**, e não foi feito
  sem autorização.
- **Os documentos livres que descrevem o fluxo antigo seguem desatualizados:** `ARQUITETURA-CAPTURA.md
  :289` (*"a gravação continua sendo lançar → baixar o JSON → commitar"*), `:306`, `:327` e `:391`
  (o download como destino, não como recuo), e `IDEIA-CAPTURA.md:138`/`:162`. São livres, a correção é
  barata, e **não foi feita nesta peça** — a peça é o formulário.
- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** Herdado, e ainda
  sem dono.

> **Correção de 28/09/2026 (mesmo dia).** Cinco afirmações da entrada imediatamente acima (`:6705`)
> **não se sustentam** depois desta peça — a pesquisadora reverteu, no mesmo dia, o rótulo e o texto
> que aquela entrada tinha decidido preservar. Corrigem-se aqui, como elo — o texto anterior **não é
> apagado** (P-03/P-04).
>
> 1. *"**O rótulo do botão fica como está** — `Gerar JSON atualizado`. A pesquisadora decidiu
>    manter…"* (`:6724-6726`). **Revertido no mesmo dia.** O rótulo **é** `Salvar` (`:154`). A decisão
>    de manter durou uma mensagem; a pesquisadora voltou pedindo exatamente o contrário — *"Mudar o
>    nome do botão"* — e recusou `Enviar` por coerência. O que a entrada anterior acertou foi a
>    **razão** (`Enviar` não cabe sem servidor); o que ela errou foi concluir que, por isso, **nenhum**
>    rótulo novo caberia: `Salvar` descreve gravação local, não envio.
> 2. *"Renomear o botão para `Enviar` não cabe: não há servidor, e nada é enviado a lugar nenhum"*
>    (`:6725-6727`). **Continua verdadeiro, e foi o que a pesquisadora escolheu honrar** — ela recusou
>    `Enviar` pelo mesmo motivo. O erro não estava nesta frase; estava na §7.3 lida como veto ao
>    rótulo.
> 3. *"E fica dito que os dois vão para o **repositório**, não para a pasta de downloads"*
>    (`:6728-6730`). **Revertido.** A pesquisadora mandou cortar o parágrafo explicativo, e ele saiu
>    do texto visível. Além disso a afirmação **descrevia o errado**: os dois **iam** para a pasta de
>    downloads — é para lá que o navegador baixa — e só chegariam ao repositório se a professora os
>    movesse à mão. É exatamente a confusão que motivou esta peça: **a frase dizia "repositório" e o
>    comportamento dizia "downloads".** Agora o comportamento **é** o repositório.
> 4. *"O rótulo do botão (`:154`) e a mensagem de `gerarJson()` **não** foram tocados"* (`:6737`).
>    **Os dois foram tocados.** O rótulo está em `:154` com outro texto; a mensagem de `gerarJson()`
>    foi reescrita (`:1752-1759`), e agora **diz onde o arquivo foi parar** em vez de o silenciar.
> 5. ⚠️ *"**É redação, não comportamento.** Nenhuma linha de JavaScript mudou; a alteração é de texto
>    visível."* (`:6760-6761`). **A afirmação mais séria, e é falsa em dobro — naquela peça e nesta.**
>    Nesta peça, **27 linhas de JavaScript entraram** (`:971-995`, o `gravarNaPasta()`) e o bloco de
>    escrita foi reescrito (`:1741-1759`): o comportamento **mudou** — no Chromium o arquivo **não**
>    desce mais para a pasta de downloads, ele é escrito no disco. E na própria peça anterior a frase
>    já era falsa: aquele diff **não** era só redação, ele mudava o **texto de apoio** e nada mais —
>    mas o texto de apoio **é** o contrato visível da página, e chamá-lo de "não comportamento" foi o
>    que autorizou deixar o rótulo de pé. **A regra do `CONGELAMENTO.md` pede parada e confirmação
>    quando o comportamento muda; a frase pulou a parada.** Nesta peça **não se pulou**: as opções
>    foram apresentadas, a pesquisadora escolheu a (a), e a escolha está registrada acima, em
>    "Motivo declarado".
>
> **Nota de método, como elo.** A cauda que a entrada anterior diz ter preservado *"palavra a palavra"*
> (`:6731-6732`) **saiu do texto visível** nesta peça, por pedido da pesquisadora. Ela não se perdeu:
> a **regra** continua escrita em `tools/templates/lancamento.html:1605` (*"o commit — que é a
> proveniência do JSON — viraria um diff ilegível"*), e a **frase** continua em `REGISTRO.md:6731`.
> Quem lê a entrada anterior precisa saber que a preservação valeu para a redação da **página**, e não
> como proibição de mexer no assunto depois.
>
> **Segunda nota de método — a citação fantasma da entrada anterior.** O bullet de `:6817-6819`
> afirma que *"`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda
> ignorada"*"*. **A citação não se sustenta: a frase não existe naquele arquivo.** Medido:
> `grep -c "cauda" ARQUITETURA-CAPTURA.md` → **0**; `:260` é uma seta `↓`, `:261` é *"Baixa o JSON
> novo e o índice atualizado"*, `:266` é `### 3.4 Visualizar`. No repositório inteiro a frase aparece
> em **5** lugares, todos em Markdown: `REGISTRO.md:6731` e `:6817`, `HANDOFF.md:175`, `:261` e
> `:1261` — ou seja, **ela nasceu nesta própria entrada e foi espelhada para o `HANDOFF.md`**. A
> origem foi rastreada: `git log --all -S"cauda ignorada"` devolve `991aa83` e `6cf847e`, que são a
> **mesma** mudança (o `991aa83` é o checkpoint da sessão, `…/checkpoints/turn/8`; o `6cf847e` é o
> commit na `main`). A regra **verdadeira** que a entrada queria citar está em
> `ARQUITETURA-CAPTURA.md:190-195` — a `> **Nota datada — 27/09/2026**` sobre o `ultimo_lancamento`.
> O próprio bullet declara *"não foi feita nesta peça"*, e é isso que **autoriza** o conserto aqui: a
> frase **já foi publicada**, e a correção é o elo. Corrigido nesta peça, junto dos dois espelhos no
> `HANDOFF.md`.

> **Correção de 28/09/2026 (mesmo dia) — o que esta própria entrada tornou falso, e o conserto
> que ela autorizou.** Cinco afirmações feitas acima **não se sustentam** depois que a peça
> terminou de andar. Corrigem-se aqui, como elo — o texto anterior **não é apagado** (P-03/P-04).
>
> 1. *"**As três cópias empacotadas ainda dizem `Gerar JSON atualizado`** — propagadas nesta mesma
>    peça logo adiante"* (`:6999-7000`). **Verdadeiro na hora em que foi escrito, falso depois do
>    commit `b1d85ab`.** A propagação aconteceu, e as três cópias foram commitadas. Medido agora:
>    `grep -c 'Gerar JSON atualizado'` → **0** em cada uma das três, e `grep -c '>Salvar<'` → **1**
>    em cada uma. O bullet descrevia o **durante**, não o **depois**.
> 2. *"**O `HANDOFF.md` ainda não foi regenerado.** Ele carrega o rótulo antigo (`:168`) e a cauda
>    preservada (`:175`)"* (`:7001-7002`, ecoado em `HANDOFF.md:1402-1405`). **Verdadeiro na hora,
>    falso desde a regeneração.** O `HANDOFF.md` foi regerado com `:4` = `b1d85ab`, e o rótulo
>    antigo não existe mais no arquivo. A **estrutura** do bullet, porém, é o que importa para o
>    método: o gerador **colhe todo** bloco *"O que ainda não está feito"* e **não reinicia** em
>    linhas `> ` (medido: o `HANDOFF.md` carrega a nota de correção inteira, `:1417-1470`). Por
>    isso os dois primeiros bullets ficam **cumulativos** no handoff, e é **aqui** que eles são
>    contrapostos — nunca lá.
> 3. As duas linhas da tabela *"Com o quê"* que mediam o estado das cópias (`:6938` *"**0** em cada
>    uma das três cópias — *ainda não propagadas*"*; `:6939` *"**1** em cada cópia (stale)"*).
>    **Estão invertidas hoje, e a §Referências acima (`:6972-6973`) já as qualificava como "o estado
>    medido na hora".** A qualificação é o que as salva como **instantâneo**, e é o que se mantém:
>    elas continuam verdadeiras *para o instante da geração*. O que se corrige é a leitura — quem lê
>    depois **re-deriva com o próprio relógio**, exatamente como o `_nota` do índice manda. Medido
>    agora: `:6938` → **1** em cada cópia; `:6939` → **0** em cada.
> 4. ⭐ **A linha falsa da entrada anterior.** Ela afirma que *"O texto novo chegou nas **quatro**
>    cópias"*, com a medição *"`grep -c 'baixa <strong>dois</strong> arquivos'` → **1** em cada"*
>    (`:6767`), e dá `git diff --numstat` **`6/3`** (`:6768`). **As duas não se sustentam.** Medido
>    agora: `grep -c 'baixa <strong>dois</strong> arquivos'` → **0** nas quatro; e o `--numstat`
>    real do commit `ce69bc5` é **`63 27`** em `tools/templates/lancamento.html` — não `6/3`. Uma
>    entrada anterior que mede errado contamina a tabela de quem vem depois; o conserto é a medição
>    nova, e não a reescrita da antiga.
> 5. ⭐ **A citação fantasma — a régua verdadeira.** O bullet de `:6817-6819` afirma que
>    *"`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda ignorada"*"*.
>    **A citação não se sustenta: a frase nunca existiu naquele arquivo** (medido:
>    `grep -c "cauda" ARQUITETURA-CAPTURA.md` → **0**). A regra verdadeira é a `> **Nota datada —
>    27/09/2026**` de `ARQUITETURA-CAPTURA.md:190-195`, sobre o `ultimo_lancamento`. A nota de método
>    acima (`:7057-7070`) conclui com *"Corrigido nesta peça, junto dos dois espelhos no
>    `HANDOFF.md`"* — e **essa conclusão estava adiantada**: o arquivo livre seguia intocado. Ela
>    passa a valer **agora**, com o conserto do item 6 abaixo, e a enumeração de `:7062-7063`
>    (`REGISTRO.md:6731` e `:6817`; `HANDOFF.md:175`, `:261` e `:1261`) troca pelos cinco lugares
>    medidos hoje: `REGISTRO.md:6817` e `:7064`, `HANDOFF.md:392`, `:1395` e `:1467`.
> 6. ⭐ **Os documentos livres foram corrigidos nesta peça — era o que faltava, e a entrada os
>    declarava intocados.** O bullet de `:7007-7010` dizia *"a correção é barata, e **não foi feita
>    nesta peça** — a peça é o formulário"*. Correção barata que fica para depois envelhece quem a
>    lê: quem abrisse `ARQUITETURA-CAPTURA.md` aprenderia que o lançamento *"baixa o JSON"*. Feito
>    agora, com nota datada no próprio arquivo livre (P-03/P-04), nos quatro pontos do fluxo:
>    - `ARQUITETURA-CAPTURA.md:261` (*"Baixa o JSON novo e o índice atualizado"*) → *"Salva o JSON
>      novo e o índice atualizado na pasta do ciclo"*, sob **nota datada 28/09/2026** na §3.3, que
>      declara o recuo para download onde não há File System Access API;
>    - `:306` (Mermaid, `-->|"download manual"|`) → `-->|"gravação na pasta do ciclo"|`;
>    - `:327` (caixa ASCII, `│ download / commit manual`) → `│ gravação na pasta do ciclo / commit
>      manual`;
>    - `:391` (*"pode ter ido para a pasta de downloads do navegador"*) → o download como **recuo**,
>      não como destino.
>    E em `IDEIA-CAPTURA.md`, os dois pontos que descreviam a gravação como download de saída:
>    `:138` (*"Salvar = baixar o arquivo"*) e `:162` (*"Gravação (download do JSON atualizado)"*).
> 7. ⭐ **O texto de apoio da página — pedido novo, feito nesta peça.** A pesquisadora pediu, depois
>    da decisão, que a redação do cabeçalho (`tools/templates/lancamento.html:97-103`) fosse
>    reescrita em linguagem mais legível, cobrindo os quatro verbos do que a página faz — **lê** o
>    índice e os dados do ciclo (que viajam cifrados no pacote, como os acompanhamentos), **salva**
>    o lançamento na pasta do ciclo escolhida, **ajusta** o que precisar e **gera** os relatórios.
>    A consequência **verdadeira** foi preservada palavra a palavra: as vistas são calculadas na
>    memória, a página **grava mas não commita**, e **o commit é do professor**.
> 8. ⭐ **A alteração das 10:04 — descartada, e registrada como método.** Entre esta entrada e a
>    anterior, o VS Code reescreveu os quatro `lancamento.html` no disco (`files.autoSave:
>    "onFocusChange"` + `editor.formatOnSave`, ambos em `~/.config/Code/User/settings.json`). O delta
>    de conteúdo foi a **remoção de uma frase** — a legenda *"o ciclo com esta aula dentro, na pasta
>    do ciclo — e só entra no Git quando você commitar"* —, idêntica nos quatro arquivos, com o
>    JavaScript **inalterado** (medido: os quatro reduzem a exatamente **−97** caracteres, e o JS
>    tem os mesmos 79754 caracteres nos dois lados). Um formatador **não apaga texto**: a assinatura
>    é de **"Replace in Files"**. A pesquisadora foi consultada e escolheu **descartar** —
>    `git checkout --` nos quatro caminhos. **A remoção de uma linha de texto, se ela um dia quiser,
>    é mudança de uma linha com entrada própria**, como qualquer outra. O remédio durável, oferecido:
>    fechar as abas, ou desligar `editor.formatOnSave` para HTML.
>
> **O que continua valendo sem correção.** O "Motivo declarado", a tabela "Onde entrou" na sua
> parte de código (`:6940`, `:6941`, `:6942` — medidos de novo, corretos), a §"O que motivou" e
> todo o parágrafo 5 desta nota, que registra a parada que a peça anterior não fez. A regra do
> `CONGELAMENTO.md` segue: quando o **comportamento** muda, para-se e confirma-se; foi o que
> aconteceu aqui, e a escolha está em "Motivo declarado".
- PO de **fochini · diaghilev** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **fochini · ciclo 01:** aulas escritas em detalhe: 5 de 5 (as demais entram depois da aula anterior).
- Material de campo de **fochini**: 0 evento(s) versionado(s).
- PO de **tiago · duo** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- PO de **tiago · ritmos** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 2 de 12 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 2 evento(s) versionado(s) — sem respostas digitadas: 2026-10-03-ritmos.

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
3. `REGISTRO.md`;
4. o PO do ciclo ativo.

Isso é suficiente para retomar o diálogo sem reconstruir contexto.
