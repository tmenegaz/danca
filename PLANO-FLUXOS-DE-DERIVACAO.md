# Os fluxos de derivação — o real, e o caminho até ele

> **Estado:** aberto a 19/11/2026. **Dono das decisões:** a proprietária. **A bancada:**
> [`experimentos/provar-os-fluxos-da-derivacao.js`](experimentos/provar-os-fluxos-da-derivacao.js)
> (29 asserções). **O retrato do código:** [`ARQUITETURA-GERAL.md`](ARQUITETURA-GERAL.md) §3.4.

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
| Sala · **`turma-professor`** (mudar o professor/modalidade) | **não** | **sim** — é o T2 |
| Elenco · `linha-de-base` (gravar/concluir) | **sim** | sim |
| Elenco · `elenco-mover` (transferir aluna) | **sim** | sim |
| Elenco · `DELETE /linha-de-base` (apagar o elenco) | **não** | **sim** — deixa a Turma a apontar para o nada |
| Turma · `curadoria-derivar` | **sim** | sim |
| Turma · `curadoria` (gravar no lugar, sem plano) | **não** | **sim** quando o **elenco** muda |
| Turma · `turma-conteudo` (conteúdos, um a um) | **não** | **sim** — escreve o que os documentos leem |
| Professor · `rubrica-do-professor` (a régua) | **não** | **a decidir** — muda o instrumento de medida |
| Professor · `professor-desligar` | **não** | **sim** — marca, mas não percorre |
| Estilo · `verbete` | **não** | **sim** — é o T5 |
| Dicionário · `termo` | **não** | **sim, se em uso** — é o T6 |

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

### T2 — «Mudar o professor de uma Sala» dispara o fluxo *(o T1 está feito; este é o próximo)*

**O que é.** `POST /api/bastidores/turma-professor` passa a percorrer a cadeia, e devolve `cadeia` como
as outras cinco rotas.

**O que a cadeia deve fazer neste caso** — e a regra já existe, é de 12/11/2026: **a autoria não se
deriva**. O plano do professor que saiu **não** é reescrito com o nome de quem entra: ele fica, marcado
`sem turma`, com «Quem fez» a dizer a verdade. O professor novo escreve o dele — e é isso que a etapa
`bloqueada` diz, com o «!» no cabeçalho da porta.

**O que muda.** A resposta do gesto; o aviso no canto («o plano de X fica com X — o novo escreve o
dele»); o véu, que passa a cobrir a travessia.

**Como se mede.** A bancada passa a exigir: resposta com `cadeia`; a etapa `plano-de-ensino`
`bloqueada` com a frase da autoria; o plano anterior listado com o selo `sem turma`; e o professor
novo a ver a turma na lista que autoriza o plano. Alargar
[`provar-a-autoria-na-troca-de-professor.js`](experimentos/provar-a-autoria-na-troca-de-professor.js),
que já mede o selo e a porta.

### T3 — A troca de **modalidade** de uma Sala, e a tradição que vem com ela

**O que é.** O mesmo gesto (`turma-professor`) muda também a modalidade. Uma modalidade diferente não
é o mesmo professor noutra sala: é **outro corpo de referência** (as anamneses são por modalidade, os
níveis são outros, a régua pode ser outra).

**Por que separado do T2.** As duas mudanças têm o mesmo gatilho e efeitos diferentes: a de professor
**bloqueia** (autoria); a de modalidade **pode derivar** (o mesmo professor, outro enquadramento) — e
é preciso decidir se deriva ou se bloqueia também.

**A decidir:** modalidade nova → deriva o plano (mesmo autor, outro referencial) ou exige plano novo?
A recomendação é **derivar com aviso**, porque o autor é o mesmo e o que muda é a leitura do cadastro;
mas os níveis e os conteúdos podem deixar de fazer sentido, e isso é pedagogia — provavelmente é
**bloquear e dizer**, como a autoria.

### T4 — Os conteúdos da Turma, e o mapa antigo que escreve sem guarda

**O que é.** Há dois caminhos para o mesmo facto: o `repertorio` da Turma (a via nova) e o mapa
`turma-conteudos` (a antiga, por Sala). O segundo **escreve sem guarda nenhuma** — nem a de a Turma ter
plano. É o que os documentos derivados leem.

**O que muda.** Um caminho só (o `repertorio`, que já é o dono desde 07/11/2026), com o mapa antigo lido
como memória e não escrito; e o gesto a disparar a cadeia.

**Como se mede.** Adicionar um conteúdo a uma Turma com plano passa a marcar o plano «a rever»; e o
mapa antigo deixa de aceitar escrita nova (a rota passa a responder com o caminho certo).

### T5 — O Estilo: editar um exercício que uma Turma usa

**O que é.** Editar o verbete de um exercício muda a **notação** e o **glossário** que os documentos
derivados imprimem. Hoje não dispara nada.

**O que a cadeia deve fazer** — e aqui não é a mesma travessia: **o plano não muda** (o professor não
escreveu outra coisa), o que muda é a **derivação** dos documentos. É um **regerar**, não um derivar.

**A decidir:** regerar automaticamente, ou marcar «os documentos estão desactualizados» e deixar o
gesto de regerar ao professor? A recomendação é **marcar e oferecer**, porque uma geração custa
subpedidos (o teto de 50 por invocação, §5.26) e um professor a corrigir dez verbetes seguidos
dispararia dez gerações.

### T6 — O Dicionário: a mudança condicional

**O que é.** Ela foi explícita: mudar o dicionário **não** dispara — *excepto* se o exercício estiver
em uso por uma Turma (o «exercício com verbete que já esteja vinculado à turma»).

**O que é preciso primeiro.** O sistema **já sabe** responder «que turmas usam este termo»
(`turmasPorTermo`), mas usa-o só para a etiqueta «em turma» da listagem. O passo é usar a mesma
resposta como **condição do gatilho** — uma resposta, dois consumidores.

**O que muda.** O `PUT /api/bastidores/termo` passa a devolver, quando o termo está em uso, o mesmo
aviso do T5 (documentos desactualizados), e a lista de turmas que o usam.

**Como se mede.** Duas asserções que hoje não existem: editar um termo **livre** não avisa nada;
editar um termo **em uso** avisa, e nomeia a turma.

### T7 — O calendário: saber o que já passou *(o maior, e o que dá sentido aos outros)*

**O que é.** A regra dela — *«com a data da mudança, o que está para trás não se mexe e o que está
para frente se altera»* — exige um dado que hoje não existe: **a data de cada aula**.

**O que existe hoje:** o período (`contexto-calendario = {inicio, fim}`), os dias e a hora da Sala, a
duração, e o número total de aulas. Com esses cinco, **a data de cada aula é calculável** — e não é
inventada: é a mesma conta que o calendário escolar faz.

**O que muda.** Um `calendario` derivado (aula N → data) que:
1. entra no plano e no PO como **leitura do cadastro** (`daTurma`, como o ritmo já é);
2. permite à derivação **partir o ciclo**: o que é anterior à data da mudança **não se reescreve**;
   o que é posterior passa a valer;
3. permite à tela dizer, por aula, «dada» / «programada» / «fica como estava».

**A decidir:** a data de cada aula passa a ser um dado **calculado** (dias + hora + início) ou
**declarado** (a escola escreve as datas, com feriados e recessos)? Um calendário calculado mente nos
feriados; um declarado custa a quem o declara. A recomendação é **calculado, com a lista visível e
editável** — o cálculo é o padrão, a correcção é da escola.

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
T1 (a cópia) ─► T2 (professor dispara) ─► T3 (modalidade)
                     │
                     ├─► T4 (conteúdos)
                     ├─► T5 (Estilo) ─► T6 (Dicionário condicional)
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
