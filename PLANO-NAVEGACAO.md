# Plano — a navegação deixa de contar documentos

> **Status.** Desenho e listagem decididos em 23/10/2026; **nada foi implementado ainda**. Este
> documento descreve a reorganização que a escola de teste (calango) já exige hoje, e que ficará
> insustentável no ciclo seguinte. O que continua em aberto está na §8; as bancadas que sustentam as
> decisões estão em `experimentos/propostas/` (`proposta-navegacao.html` e
> `proposta-listagem.html`).
>
> **A regra central, em uma frase.** O menu é o **mapa dos destinos**; a listagem é o
> **índice dos documentos**. Hoje o menu faz o trabalho das duas coisas, e por isso cresce
> com o acervo — que é o único crescimento que não tem fim.

---

## 0. O que está medido

`node tools/montar-publicacao.js calango` → `publicacao/calango/nav.json`, hoje:

| Grupo | Tipo | Itens | Quais |
|:--|:--|--:|:--|
| Sistema Lastro | link | **1** | a raiz |
| Ciclos | menu | **6** | plano, referências e PDF × 2 turmas |
| Aulas | menu | **2** | aula 01 × 2 turmas |
| Planejamento | menu | **4** | glossário e notação × 2 turmas |
| Área do Professor | menu | **9** | 3 formulários + harmonização, captura e lançamento × 2 turmas |
| Bastidores | menu | **2** | estúdio e produção |
| **Total** | | **24** | com **duas** turmas e **uma** aula publicada por turma |

A conta é de **entradas na barra** — tudo o que se alcança pelo menu, incluindo a entrada «Sistema
Lastro». É a contagem que uma pessoa faz; a contagem só dos documentos das turmas dará sempre
**um a menos**.

**A lei de crescimento** (derivada do código, não estimada). Com `T` turmas e `A` aulas publicadas
por turma, as entradas são

    entradas = 6 + 8·T + A·T

Conferindo: `T=2, A=1` → `6+16+2 = 24`. ✔ É o número da tabela.

O que isso quer dizer para o próximo ciclo — a calango com as 18 aulas que o `.conf` já declara e
uma terceira turma vinculada:

    T=3, A=18 → 6 + 24 + 54 = 84 entradas num único menu.

Oitenta e quatro entradas não são um menu: são um índice impresso dentro de um menu. E nenhuma
delas é um destino — são todas **documentos**.

**E o que a medição desmentiu.** A suposição natural é que a barra cresce de altura. Não cresce:
com os grupos fechados ela mede **60 px** — os grupos são blocos `details` fechados, e fechados não
ocupam altura. O que cresce é **o que cada grupo abre**: medido no celular, com os grupos todos
abertos, o painel de hoje tem **1298 px**, ou **1,6 tela** de menu. Nenhuma reorganização de barra
resolve isso — só uma coisa resolve: deixar de pôr documentos no menu. É por isso que a listagem vem
antes do desenho.

**E a coluna, medida.** Fechada em quatro títulos, ela ocupa **217 px**; com o grupo do documento
aberto, **284 px**; com tudo aberto, **485 px**. A barra de cima, que continua a existir, mede 60 px
em qualquer dos casos — e a coluna de leitura paga os 248 px de largura: **1180 → 1032** numa janela
de 1280.

## 1. O diagnóstico — duas causas, não uma

**Causa 1 — o menu enumera arquivos.** `acrescentarAreaDoProfessor()` empurra, para cada turma, um
item por documento que existe no disco. É literalmente um `ls` transformado em navegação. O menu
nunca foi desenhado para crescer porque ninguém esperava um acervo; agora há um.

**Causa 2 — três itens carregam a turma na URL.** Esta é a causa que obriga a mexer em mais do que
o menu, e é a que explica porque é que «é só juntar» não funcionou até aqui:

    /plano-observacao/?professor=oculos-redondo&escola=calango-bale-nivel-1-teste-1&ciclo=01&fonte=po
    /plano-ensino/?professor=…&escola=…&ciclo=…&fonte=plano
    /anamnese/?professor=…&escola=…&ciclo=…

A porta lê a turma do endereço. Enquanto o endereço tiver de estar no menu, «Anamnese do aluno»
**não pode** ser um item só — tem de ser um item por turma. A listagem resolve as duas causas de
uma vez: o item fixo abre uma página que **escolhe a turma**, e o endereço com parâmetros nasce ali,
no clique, em vez de estar escrito à mão na barra.

## 2. O menu novo — a coluna, e o Bastidores fora dela

**A coluna não é uma lista de doze destinos: são quatro títulos.** Ela é compacta, e cada grupo abre
no ponteiro, empurra os de baixo para baixo e fecha quando ele sai. Medido no navegador, a coluna
ocupa **217 px** assim — contra **485 px** com tudo aberto.

| Onde | O quê | Destino |
|:--|:--|:--|
| Coluna, topo | Sistema Lastro | `/index.html` |
| Coluna | **Ciclos** → Planos *(era Planos · Referências — ver §3.2)* | `/ciclos/planos/` |
| Coluna | **Aulas** (sem submenu — é destino) | `/aulas/` |
| Coluna | **Planejamento** → Glossário · Notação | `/planejamento/glossario/` · `/planejamento/notacao/` |
| Coluna | **Área do Professor** → Anamnese · Plano de ensino · Plano de Observação · Lançamento de aula | `/area-do-professor/…/` |
| **Barra, ponta direita** | **Bastidores** → Estúdio · Produção | `/bastidores/estudio` · `/bastidores/producao` |

**O Bastidores saiu da coluna** (23/10/2026) e foi para a barra de cima, na ponta oposta à marca.
A coluna fica com o trabalho de sala; o que é da escola e do sistema fica na barra. E deixa de haver
dois menus a competir pelo mesmo espaço.

**Onde está o documento.** A barra passa a dizer em que documento se está — «Planos do ciclo», o
título da aula —, entre a marca e o Bastidores. É a proposta 1 resolvida de graça: o título que se
perdia ao rolar passa a viver numa barra que não rola.

**No celular, a coluna é uma FOLHA INFERIOR** — a mesma solução da Produção (23/10/2026): uma linha
com o grupo e o documento, um botão «Seções», e a navegação sobe de baixo com o pegador, os cantos
de cima arredondados, o véu atrás e o limite de 78vh. Escolher um destino fecha a folha.

Duas coisas não são iguais às da Produção, e ficam declaradas:

- **o fundo é o da coluna (burgundy)**, não o branco da folha da Produção. A lei das duas
  navegações (`IDENTIDADE-VISUAL.md`) diz que a do **sistema** e a da **página** não são a mesma
  coisa, e a cor é o que as distingue. Empresta-se a mecânica, não o papel;
- **o gatilho é duplo**: o botão «Seções» (o da Produção) **e** o ☰ da barra. A lei manda o
  hambúrguer para a navegação global; ele continua a abrir a mesma folha, em vez de ficar sem
  função.

**A barra «Seções» é uma peça separada da coluna, e não um pedaço dela.** A coluna é `fixed` (e
folha `fixed` no celular); a barra tem de estar no fluxo, acima do documento. Foi esta separação
que revelou um defeito na bancada: com as duas dentro do mesmo `<aside>`, a troca de opção
substituía a coluna pela barra e a coluna desaparecia. Uma raiz por peça — a regra é a mesma que já
se aplica ao `nav.json`.

**O contrato do `nav.json` não muda de forma — e a barra também não.** As duas coisas foram testadas
antes de serem escritas aqui, com o `desenhar()` de produção:
`desenhar({ grupos: [Bastidores] }, pedido, '<span class="doc-atual">…</span>')` produz exatamente a
barra que a §2 descreve — marca, documento, ☰, Bastidores. O `extras` já existia e serve para isto.
**O que muda é CSS:** a posição da lista e o filete do documento. `motor/nucleo/nav.js` não é tocado
para pôr o Bastidores à direita.

Três consequências que é melhor dizer agora do que descobrir depois:

1. **O PDF do ciclo deixa de ser item de menu** e passa a ser **ação da linha** na lista de planos.
   Um PDF não é um destino: é uma saída do documento que a linha já nomeia.
2. **Aulas não tem submenu** (como você pediu): é um destino directo, tanto na coluna como na
   contagem.
3. **A harmonização sai da Área do Professor** e passa a viver só na Produção (Bastidores) — §4.

**Uma correção pequena que as etapas seguintes precisam, e é a que faz a coluna funcionar.**
`ehAtivo()` marca o **item**, mas não marca o **grupo**: em `/ciclos/planos/`, o `Ciclos` não ganha
marcas. Com a coluna compacta, o item está escondido dentro de um grupo fechado — a marca do
**grupo** passa a ser a única coisa que diz onde se está. É o que a opção C desenha com um filete
de ouro no título, e o que a Etapa 3 leva ao `nav.js`.

## 3. As listagens — o que cada uma mostra, e de onde vem cada coluna

O princípio: **nenhuma coluna é inventada**. Tudo o que aparece já existe num arquivo versionado.
Se um campo não existir, a coluna não existe — não se abre um campo novo no `.conf` para encher
uma tabela.

### 3.1 Planos do ciclo — `/ciclos/planos/`

**A lista não se desenha: ela é a de «Turmas cadastradas».** Decidido em 23/10/2026 — a peça da
Produção é copiada com os valores intactos, e a única coisa que muda é o nome do invólucro, porque
passa a servir duas listas. Não há uma segunda forma de dizer «lista» neste produto.

O cartão de um plano tem quatro camadas, e todas as informações que você pediu cabem nelas:

| Onde | O que mostra | De onde vem |
|:--|:--|:--|
| **Linha do nome** | o plano, e o estado do PO ao lado | `NOME` do `.conf` da turma · `po_state` do `.fipp` |
| **Linha de complemento** | o ciclo e o volume de aulas | `CICLO` e `TOTAL_AULAS` do `.conf` |
| **Ações** | *abrir o plano* · *referências* · *PDF do ciclo* | as saídas que já existem no pacote |
| **As três caixinhas** | **Turma · Professor · Cadeia**, cada uma com o «?» | `VARIANTE` por `nomeDaTurma()` · `PROFESSOR` do `.conf` · `ancorado_em` e `po_state` do `.fipp` |

**As caixinhas são Turma · Professor · Cadeia, e não Ritmo · Régua · Conteúdos** — decidido em
23/10/2026. A decoração é a mesma da lista de turmas; a matéria é a desta lista. O ritmo, a régua e
os conteúdos não se perdem: continuam a um toque, no cartão da turma, na Produção.

**Nenhum dado aparece duas vezes.** Como as caixinhas passam a carregar a identificação, a linha de
complemento fica com o ciclo e o volume — se dissesse também a turma e o professor, seria a mesma
informação em dois sítios, e a primeira a envelhecer seria a de baixo.

O `PROFESSOR` do `.conf` é o que a curadoria decidiu, e é o campo que distingue dois planos da mesma
escola — na calango, `Oculos Redondo` e `Perna Boa`, com o mesmo ritmo e a mesma régua. Sem ele as
duas linhas são indistinguíveis, e foi isso que originou o vazamento de ontem.

**A caixinha toda é clicável.** Na Produção o alvo é um `<button class="q">?</button>` de 20 px
dentro da caixinha; passa a ser a caixinha inteira — **48 px × 221 px** medidos, contra os ~20 px de
agora. O «?» fica, e passa a ser desenho (`aria-hidden`) em vez de controle: ele diz «há mais
dentro», e não é ele que se acerta. Ganha-se o alvo e perde-se um aninhamento de controles que um
leitor de ecrã anuncia duas vezes.

**O filtro** (acima da lista): busca livre · turma · professor. Todo o filtro é **no cliente**,
sobre a marcação já montada: nenhuma chamada de rede, nenhum KV, nenhuma linha da cota do ar.

**A paginação vem com a peça** — o mesmo `.paginacao` de sete por página que «Turmas cadastradas»
já usa. Nas listas curtas ele fica escondido, como lá.

### 3.2 Referências — ~~`/ciclos/referencias/`~~ *(removida em 26/10/2026)*

**Esta lista não chegou a existir como plano, e a que existia foi removida.** A primeira versão
da coluna levava a «Ciclos → Planos · Referências», e a montagem chegou a gerar
`/ciclos/referencias/index.html` — uma página com «Procurar» e uma linha por turma. A pesquisadora
viu-a e disse o que ela era: «eu não preciso ter aqui em ciclos no menu referências e a listagem
das referências… É a partir dali [do plano] que eu chego até referências.»

O caminho até às referências é o plano do ciclo, em dois sítios que já dizem onde se está: o botão
«Referências» do cartão, na lista de **Planos**, e o «Referências» do próprio documento do plano.
O item do menu e a página saíram; o **documento** (`<turma>/referencias.html`) continua a existir e
a ser publicado, e **acende «Planos»** — aprofundar dentro de Planos não é sair de Planos.

~~As tabelas ABNT de cada turma. Mesmas colunas de identificação da §3.1, mais o contador de
referências (dá para ler do `referencias.html` publicado, ou de um manifesto, se existir).~~

### 3.3 Aulas — `/aulas/`

Uma lista só, da escola inteira: **Turma · Aula · Marco · Duração · aberta?**. O marco já existe
(`a.marco`); a duração tem de sair do `ciclos.json` do pacote. Se não existir, a coluna não existe.

### 3.4 Planejamento — `/planejamento/glossario/` e `/planejamento/notacao/`

Duas listas curtas: por turma, o glossário do código (Benesh) e a notação. Poucos itens, mas o
destino fica estável — e é isso que impede o menu de voltar a crescer quando a escola tiver dez
turmas.

### 3.5 Área do Professor — as três escolhas de turma, e o lançamento

**Anamnese · Plano de ensino · Plano de Observação** — cada um é uma **página de escolha**, não um
formulário: uma linha por turma do professor, com o nome da turma e, à direita, o que essa turma já
tem (fichas abertas? plano guardado?). O clique abre a porta **com os parâmetros que hoje estão
escritos no menu**. É aqui que os três itens deixam de ser `3+3T` e passam a ser `3`.

**Lançamento de aula** — a lista que absorve a captura para impressão, como você descreveu: uma
linha por aula de cada turma, com **duas** ações — *formulário electrónico* (`lancamento.html`) e
*captura para impressão* (`captura-aula-NN.html`). A lista é o filtro: turma, aula, estado.

### 3.6 Crescimento da própria listagem

Quando a lista passar de ~20 linhas, ela pagina. O rodapé já existe
(`rodapePaginacao()` na Produção, `data-paginar` / `data-por-pagina`) e entra sem peça nova. Não é
para fazer agora: é para a lista de aulas, que é a única que nasce grande.

## 4. A harmonização sai da parte pública

Você foi claro: harmonização de linguagem é assunto da **direção**, não da parte pública. Hoje ela
é um item de menu **e** um arquivo publicado em
`/<variante>/harmonizacao.html` — ou seja, tem URL aberta.

O plano: o **conteúdo continua** no repositório (a fonte `-harmonizacao.md` e a âncora que a cobre);
o que deixa de existir é a **publicação**. A harmonização passa a ser lida na Produção, por turma,
como já se lê o resto do que é da escola.

Isto é uma **remoção deliberada de URL**, e por isso tem de ficar declarada: quem tiver o endereço
guardado perde-o. É o objectivo — e está **decidido** (§7.2): a fonte e a âncora ficam, o que sai é
a publicação.

## 5. Onde se mexe

| Arquivo | O que muda | Congelado? |
|:--|:--|:--|
| `tools/montar-publicacao.js` | `menuDaEscola()` passa a emitir a coluna; `acrescentarAreaDoProfessor()` perde a razão de existir; passam a ser **geradas** as páginas de listagem | **Sim** — motivo declarado + `REGISTRO.md` |
| `tools/montar-publicacao.js` | lê `PROFESSOR` do `.conf` e `ancorado_em`/`po_state` do `.fipp` | idem |
| `motor/nucleo/nav.js` | (Etapa 3) o `summary` do grupo marcado quando um filho está activo — **só isso**; a barra não muda | não |
| `tools/templates/ciclo.css` | (Etapa 2) a peça da lista vai **de `bastidores.js` para a folha**, com nome neutro — hoje ela é CSS inline da Produção e as duas listas precisam dela | **Sim** |
| `tools/templates/ciclo.css` | (Etapa 3) a coluna, a gaveta e o filete do documento | **Sim** |
| `tools/check-identidade.js` | (Etapas 2 e 3) os ganchos das peças novas | **Sim** |
| `IDENTIDADE-VISUAL.md` | o catálogo das peças novas (checagem 8) | não |
| `motor/servidor/bastidores.js` | (Etapa 2) a caixinha passa de `div > button.q` a `button` inteiro, e usa a peça da folha | não |
| `escola/expurgar.js` | nada | — |

**A peça da lista muda de casa, e é o único trabalho de risco.** As regras de `.turma`, `.metricas`,
`.metrica`, `.painel`, `.escala` e `.chip` estão hoje **inline** em `motor/servidor/bastidores.js`.
Enquanto estiverem lá, «usar a mesma peça» é copiar — e duas cópias divergem à primeira correcção.
A Etapa 2 tira-as de lá para `tools/templates/ciclo.css`, com nome neutro (`li.item`), e as duas
listas passam a apontar para o mesmo sítio. É congelado, e por isso vai com motivo declarado.

**O que muda na Produção, e o que não muda.** A caixinha passa de `<div class="metrica"><button
class="q">?</button></div>` a `<button class="metrica">…</button>`. O desenho é o mesmo; muda o alvo
do toque (20 px → a caixinha toda) e o ouvinte de clique, que deixa de procurar `.q` e passa a
procurar `.metrica`. É a única alteração de comportamento na Produção, e é a que você pediu.

**Custo medido de mexer no menu:** nenhum. `nav.json` é **dado**, não código — a mudança é de
conteúdo. O risco está nas páginas de listagem: elas são arquivos **gerados**, e `publicacao/` é
saída. A montagem já roda em `deploy-escolas.yml` a cada mudança de pacote, e o gatilho cobre
`tools/montar-publicacao.js`; nada de novo precisa ser vigiado.

## 6. As três etapas — cada uma entra sozinha

**Etapa 1 — o menu e a lista de planos.** A coluna com os quatro grupos, o Bastidores na barra, e
`/ciclos/planos/` a funcionar com a peça da Produção.
É a etapa que paga: o menu encolhe de 24 entradas para 4 títulos, e a lista mostra plano, turma,
professor e data num cartão só.
*Pronto quando:* `node tools/montar-publicacao.js <escola>` der a coluna com 1 e com 18 aulas; a
lista filtrar por professor e por turma; as caixinhas abrirem ao toque em toda a sua área;
`check-identidade` passar; uma prova em `experimentos/` afirmar a contagem (a conta `6+8T+A·T` fica
como controle negativo: se o menu voltar a crescer com `T`, a prova falha).

**Etapa 2 — a peça muda de casa, e as outras listagens.** As regras da lista saem do `bastidores.js`
para a folha; a caixinha vira botão na Produção; e nascem as listas de aulas, referências,
glossário/notação, as três escolhas de turma e o lançamento. A harmonização sai da parte pública.
É a etapa grande, e é mecânica depois da 1.

**Etapa 3 — a coluna na folha.** A coluna, a gaveta e o filete do documento entram em `ciclo.css`
como peças, com o gancho na checagem 8 e a linha no `IDENTIDADE-VISUAL.md`; e o `nav.js` ganha a
marca do grupo. **Não é pré-requisito das outras duas** — na Etapa 1 a coluna pode viver na folha da
própria listagem, sem tocar na folha do sistema. É o que as bancadas fazem hoje.

## 7. Decidido

**23/10/2026 — manhã.**

1. **A listagem é a de «Turmas cadastradas».** A peça da Produção é adoptada com os valores
   intactos. *A matéria das caixinhas foi decidida à tarde — ver 9.*
2. **A caixinha toda é clicável**, no computador e no telemóvel. O «?» fica, e passa a ser desenho.
3. **A harmonização sai da parte pública** — a URL `/<variante>/harmonizacao.html` deixa de ser
   publicada. A fonte e a âncora ficam; o que se remove é a publicação (§4).

**23/10/2026 — tarde.**

4. **O menu é a coluna à esquerda, e o documento no topo.**
   *Custo aceite:* a coluna de leitura cai de 1180 para **1032 px** numa janela de 1280, e de 900
   para **852** aos 1100. No celular a coluna sai da frente e vira gaveta.
5. **A coluna é COMPACTA, com só o grupo actual marcado** — a opção C. Tudo fechado, e o grupo do
   documento leva um filete de ouro no título. Medido: **485 px** com tudo aberto, 284 px com o
   grupo actual aberto, **217 px** com tudo fechado. Os grupos abrem no ponteiro, empurram os de
   baixo e fecham quando ele sai.
6. **O Bastidores sai da coluna** e vai para a barra de cima, na ponta oposta à marca, com o Estúdio
   e a Produção (§2).
7. **Aulas não tem submenu**, nem na coluna nem na contagem: é destino.
8. **No celular a coluna é uma folha inferior**, com a mecânica da Produção (§2): barra «Seções»,
   pegador, véu, 78vh, fecha ao escolher.
9. **A listagem é a opção 2**: caixinhas **Turma · Professor · Cadeia**, com a linha de complemento
   no ciclo e no volume (§3.1). A opção 1 fica na bancada como comparação.

## 8. O que continua em aberto

1. **O canto direito da barra.** Hoje tem o documento e o Bastidores. Você disse que quer trabalhar
   mais essa zona — e é o único sítio da barra que ainda não tem desenho decidido.
2. **O filtro dos planos**: turma e professor chegam? Falta alguma coisa que você já saiba que vai
   querer? O `.fipp` já guarda `po_state`, e é por isso que o estado do PO está na caixinha *Cadeia*.
3. **Aulas**: lista única da escola, ou uma lista por turma dentro da turma? O `.conf` declara 18
   aulas por turma, e 3 turmas dão 54 linhas — ainda é uma lista só, mas é a que vai paginar
   primeiro.
4. **De onde sai o título do documento** que a barra mostra. Na listagem é o `<h1>` da página; nas
   páginas de aula também seria, mas a barra é desenhada pelo `nav.js` *antes* de a página existir.
   A solução barata é a mesma da proposta 1: um `<span class="doc-atual">` posto pela página, lido
   pelo `nav.js` do mesmo jeito que ele já lê o `extras`.
5. **A barra «Seções» some ao rolar?** Na Produção ela sai de quadro e o caminho sobe para a barra
   do sistema (a peça S5). Aqui o caminho já está na barra, e por isso a S5 não é necessária — mas
   a barra «Seções» rola para fora como qualquer conteúdo. Se quiser que ela fique ao alcance,
   é uma decisão de desenho, não de código.

## 9. Os documentos gerados dentro da Produção *(23/10/2026 — plano, não implementação)*

A harmonização saiu do menu público nesta etapa e **não** entrou na Produção. Não entrou porque o
sítio dela ainda não existe: a Produção vive do KV (professores, turmas, curadorias, vocabulário) e
**não lê um único documento do ciclo**. Pôr lá um item seria um link para uma página que ninguém
construiu.

O que o dono da escola precisa, dito por ele: saber **em que ponto cada turma está** e **poder ir
até ao documento**. As duas coisas juntas, e por esta ordem — o estado é o que se lê de relance; o
documento é o que se abre quando o estado levanta uma pergunta.

### 9.1 O estado de uma turma, derivado e não declarado

O estado **não é um campo**. É derivado, como o estado da aula (§1 de `ARQUITETURA-AULA.md`): o que
existe no pacote e no `.fipp` diz o que já aconteceu. Um campo «harmonização feita» seria mais um
sítio para ficar dessincronizado — e o segundo a envelhecer.

| Pergunta do diretor | De onde sai a resposta (sem campo novo) |
|:--|:--|
| a **curadoria** foi feita? | há par (professor, turma) na curadoria → há `ciclo-NN-<escola>-<turma>.conf` |
| o **plano de observação** está completo? | `po_state` do `.fipp` |
| o **ciclo foi gerado**? | existe o pacote e a âncora `ciclo-NN-<variante>.fipp` |
| a **anamnese** foi feita? | há envelopes de anamnese da turma em `escola/<slug>/envelopes/` |
| o **Benesh** foi feito? | `DOCS` do `.conf` declara `notacao` e/ou `glossario-benesh` |
| a **aula foi elaborada**? | existe `aula-NN.html` (e o `-aula-NN.md`, que é a fonte) |
| a **aula foi dada**? | existe `<variante>-dados.json` para aquela aula — o lançamento |
| a **harmonização** foi produzida? | `DOCS` declara `harmonizacao`, e o `.fipp` a cobre |

Nenhuma destas linhas inventa dado: todas leem o que já existe. É a mesma lei da lista de planos —
*nenhuma coluna é inventada; o que não existir fica vazio, e a linha mostra menos*.

### 9.2 O acesso: uma lista por família, e o documento atrás dela

O que se propõe, e ainda **não** está feito:

- **`/bastidores/documentos`** — uma lista, com a peça da lista (a mesma dos planos), uma linha por
  **turma**, e o estado em selos: `curadoria` · `PO` · `ciclo` · `anamnese` · `Benesh` · `aula` ·
  `harmonização`. Cada selo é **estado**, e o que está feito é o que ganha ação.
- **O documento abre ao lado, não noutro sistema.** O Worker já serve `env.ASSETS`; a diferença é
  que hoje o `producao.js` só o usa para o `nav.json`. Passaria a haver uma rota
  `/bastidores/documento/<variante>/<nome>` que lê o HTML do ASSETS, **tira-lhe a barra pública** e
  o serve dentro da moldura da Produção. É o mesmo movimento que a ponte já faz com a barra, ao
  contrário: lá repõe-se a barra; aqui tira-se.
- **A harmonização é o primeiro caso, e o motivo é o mesmo de todos os outros**: ela é um documento
  gerado, e a Produção não tem hoje por onde os ler. Resolvida a rota, ela e a nota­ção e o glossário
  e o PDF do ciclo entram todos pelo mesmo caminho — e não um de cada vez.

### 9.3 O que isto obriga a decidir antes de escrever código

1. **O estado é da turma ou do ciclo?** Uma turma pode ter dois ciclos. A lista por turma mostra o
   ciclo corrente; o histórico fica no registo da escola.
2. **Quem vê o quê.** A harmonização é da direção; o `producao.js` não tem autenticação de página —
   tem a senha do lançamento. Servir documentos pelo Bastidores sem uma trava deixa-os ao alcance
   de quem tenha o URL, que é a mesma exposição de hoje com outro nome. **Isto tem de ser decidido
   antes**, e não depois.
3. **A ponte turma do KV ↔ variante do pacote não existe.** A variante nasce na **escrita**
   (`compor-conf.js`: `escola + '-' + turma.id`), não na leitura. Ou se guarda o id da variante na
   turma, ou se recompõe na leitura com a mesma função — e a segunda opção é a que não duplica a
   regra.

**Enquanto isto não existir**, a harmonização fica no repositório (`professores/…/harmonizacao.html`,
coberto pela âncora) e fora do site. O URL público `/ <variante>/harmonizacao.html` **deixou de
existir** nesta etapa; os links que apontavam para ele foram podados do rodapé e do `README.md` do
pacote publicado.
