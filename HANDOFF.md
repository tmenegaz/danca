# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-16T13:34:35-0300`
Commit atual: `f131362` — fix(estrutura): o carimbo é a hora da escola, não a do servidor
Para: sessão nova (retomar o diálogo)

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
- **Professores:** tiago-menegaz (1)
- **Ciclos com manifesto:** 1 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola. Não implementado.
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **treze frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
f131362 fix(estrutura): o carimbo é a hora da escola, não a do servidor
faa0895 fix(estrutura): a data da ficha é a da última mudança — e a edição do plano pede a senha
b159ad9 fix(estrutura): a condução trava com a senha — e o plano tinha o mesmo defeito de contexto
c57598a fix(estrutura): a senha autoriza o ATO, não a SESSÃO — e o formulário trava sem ela
66aec8b chore(entrega): o pacote da fita leva a porta corrigida — fora da cadeia, e por quê
7f52720 fix(estrutura): a estante diz o apelido, a edição pede a senha, e o obrigatório se anuncia
8b94c44 fix(estrutura): a falta no contexto do ato se anuncia — e o `?aluna=` do PO deixa de se perder
c27307b docs(estrutura): o handoff regenerado passa a levar o registo da identidade visual
3d71d03 docs(ideia): a identidade visual tem seis famílias em estudo — e o seletor não existe
ba5afc8 docs(ideia): incorpora a estratégia comercial e o modelo manual de cobrança
c8e6efa docs(regras): a convenção de nome — nomear pelo conceito, não pelo título da página
c95e7f7 fix(tools): o caminho e o rótulo da apresentação, e o modo que a regenera sem recriar a escola
d919bc9 refactor(biblioteca): a página de entrada é a apresentação do sistema, e se chama Sistema Lastro
b5c2f71 feat(estrutura): as rubricas ganham nome, e Turmas vira três abas
51479c5 fix(estrutura): o menu alinha com a barra do topo, e o repertório volta ao menu comum
30a9f27 fix(estrutura): o painel é centrado como o sistema, e a lista longa vira escolhedor
3b1652c fix(estrutura): os Bastidores usam o menu do sistema e a Produção vira duas colunas
24de473 docs(ideia): a credencial do provedor — as três medições de 15/10/2026
aa8ac22 docs(ideia): a frente L11 — a porta paga: cobrança, verificação e liberação de escolas
d6bc9fa fix(tools): o ciclo-modelo passa a morar em modelo/ — fora de professores/
```

## Por professor

### tiago-menegaz — 1 ciclo(s)

**Ciclo 01** — variante(s): fita

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| fita | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| fita | ciclo-01-fita.fipp | `4f73ff5149d6` | (vazio) | — |

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

## 16/10/2026 — A estante pagina de seis em seis, o roteiro é só da condução, e a ficha não fala a língua do motor

**O que motivou.** Três achados do teste do PO na `fita`, na mesma sessão:

1. **A estante não paginava.** Com as três fichas que havia, tudo bem; com trinta, a lista vira
   um rolo. O professor pediu **seis por linha de página** — a sétima abre a página 2.
2. **Na página da anamnese o roteiro não tem o que fazer, e o lugar dele ficava vazio.** O roteiro
   já só aparecia na condução (`#rail` nasce `oculto`), mas a grade do site reservava a coluna dele
   (17rem) mesmo assim: o texto do portal ficava espremido à esquerda e a direita era um buraco. O
   pedido: **o espaço do roteiro é dos blocos de texto**.
3. **A ficha era do motor, não do professor.** A folha de visualização dizia «O campo «Conhecimento
   prévio de balé clássico» é o gatilho: é o que decide se os módulos condicionais do fim desta
   ficha entram» — infraestrutura da ramificação na mão de quem só quer marcar o que viu. E tinha
   **barra de rolagem horizontal**, o que impede a impressão.

**O que foi decidido.**

- **Seis por página, e o paginador só existe quando há mais de uma.** A paginação é da ESTANTE, não
  do armazenamento: o servidor devolve todas, a tela as reparte. Vale para as **três fontes**
  (anamnese, plano e PO) — a lista é a mesma, e um limite só evita três comportamentos. Um paginador
  de uma página é ruído: com até seis fichas a estante é a de sempre.
- **A página nunca sai da faixa.** O filtro, a exclusão e o recarimbo mudam a contagem por baixo: a
  tela limita a página ao que existe, em vez de ficar numa página que deixou de existir (e mostrar
  uma lista vazia).
- **O filtro é do CONJUNTO.** Mudou o que se procura, a leitura recomeça da página 1 — procurar
  algo e cair na página 3 de um resultado filtrado de duas linhas não faz sentido.
- **A ordem da estante NÃO mudou.** O professor achou-a boa; ela é a do servidor (mais recente
  primeiro, pelo carimbo). Isto é a estante, não uma classificação nova.
- **Main de uma coluna quando não há roteiro.** A regra de `abrirFormulario`/`voltarAoPortal` agora
  move uma classe (`sem-roteiro`) no `<main>`, junto com o `#rail` — as duas coisas são a MESMA
  decisão, e ficam no mesmo lugar. Com o roteiro à vista, a grade volta às duas colunas.
- **A ficha não fala a língua do motor.** Saíram DUAS linhas técnicas: a do **gatilho** (a que o
  professor apontou) e a do `*Ramifica a partir de:* cabecalho.conhecimentoPrevio` — o caminho
  interno do mesmo mecanismo, que é o mesmo defeito. Quem explica quando os módulos condicionais
  entram é o parágrafo em português que já estava acima delas.
- **A moldura tem limite de colunas (104), e o que não couber EMBRULHA.** A moldura é monoespaçada
  e tem a largura da sua linha MAIS LONGA: uma linha comprida alarga a caixa inteira e faz a folha
  rolar. A linha do gatilho era a mais longa — tirá-la estreitou a moldura de **132 para 105
  colunas** (≈943px → ≈757px numa folha de 816px), e foi isso que tirou a barra de rolagem. O limite
  fica como CINTO: a próxima linha comprida embrulha em vez de esticar a folha. A caixa (`☐`) não se
  separa do seu rótulo — `☐ Outro: __________` é uma unidade só.
- **A folha de visualização se imprime.** `@media print`: o rolo horizontal é desligado e a moldura
  encolhe para caber. No papel não há rolo — o que passa da página é CORTADO, e o que faz a moldura
  caber é o corpo da letra.

**Onde entrou.**

- `porta/index.html` — o paginador (`POR_PAGINA`, `pintarPaginacao`, `numerosDePagina`,
  `irParaPagina`, `filtrarFichas`), o markup `#paginacao`, o CSS `.paginacao`, e a classe
  `sem-roteiro` no `<main>`.
- `motor/nucleo/ficha.js` — a linha do gatilho saiu do cabeçalho; a do `ramificaPor` saiu dos
  módulos; `LARGURA_MAXIMA_DA_MOLDURA` + `embrulhar` limitam e embrulham a moldura;
  `cabecalhoDaFicha` perdeu o parâmetro `noGatilho` (não o lia mais).
- `motor/nucleo/ficha-html.js` — as regras de impressão.
- `professores/tiago-menegaz/ciclos/ciclo-01-fita/plano-observacao/index.html` — o pacote publicado
  (cópia de `porta/`, com a **nav do pacote preservada**).
- `experimentos/provar-ficha-visual.js` — prova nova: **19 provas**.
- `experimentos/provar-ajustes-anamnese.js` — **79 → 105 provas**.

**Como foi provado.**

- `experimentos/provar-ajustes-anamnese.js` (**105**): a página com **seis** linhas e a **sétima fora
  dela**; o paginador aparecendo só com duas páginas, dizendo «página 1 de 2» e contando os
  registros; o «anterior» desabilitado na primeira e a «seguinte» na última; a página 2 com as duas
  restantes; **ir para além da última sem inventar página vazia**; o filtro voltando à página 1; e o
  roteiro com o `sem-roteiro` ligando e desligando nas duas travessias portal ↔ condução.
- `experimentos/provar-ficha-visual.js` (**19**): a ficha real não diz «gatilho», nem «módulos
  condicionais do fim», nem «ramifica»; a moldura **cabe na folha** (105 ≤ 113 colunas, e as 113
  saem da aritmética de 54rem/.72rem, não de um chute); as laterais fecham e todas as linhas têm a
  mesma largura; uma opção sinteticamente longa **embrulha sem esticar** a moldura e sem perder
  texto; e a folha HTML traz `pre.moldura`, `@media print`, o rolo desligado e o encolhimento.
- **Controle negativo, em quatro frentes.** (a) `POR_PAGINA` gigante → **14 provas falham**. (b) a
  classe `sem-roteiro` não voltando na condução → **1 falha**. (c) sem o limite de colunas, a linha
  longa **passa da folha** — medido numa CÓPIA do módulo, dentro da própria prova (o repositório não
  é tocado). (d) `provar-carimbo-da-edicao.js` (**55**), `provar-contexto-do-ato.js` (**37**) e
  `node motor/ficha-html-cli.js --autoteste` (**41**) seguem verdes.
- **No ar, e conferido no ar.** Version `3acee37e-b858-4026-af13-d4b23fbba344`. A página da anamnese
  serve `id="paginacao"`, `class="sem-roteiro"` e `const POR_PAGINA = 6`; a ficha publicada
  (`/api/ficha?formato=html`) **não** traz «gatilho» nem «Ramifica», traz `@media print` e a moldura
  mede **105 colunas, todas iguais**; e as três fichas PREENCHIDAS do professor (Mari, Vavá, Dani)
  abrem sem as linhas técnicas.
- **Achado de plataforma (medido no KV).** A **listagem** do KV demora a enxergar uma chave nova E a
  esquecer uma apagada: durante ~1 min ela mostrou `anamnese-20261016-1501` enquanto o **GET** da
  mesma chave já dava 404. É a razão de `acomodarRecarimbo` existir (ele cobre o buraco na TELA); a
  API continua com a janela dela, e quem consultar a API direto logo após gravar pode ver o atraso.

**Motivo declarado — os congelados.** Nenhum arquivo de `CONGELAMENTO.md` foi tocado. A âncora
`.fipp` não muda.

**Com o quê.** `porta/index.html`, `motor/nucleo/ficha.js`, `motor/nucleo/ficha-html.js`,
`experimentos/provar-ficha-visual.js` (novo), `experimentos/provar-ajustes-anamnese.js`,
`professores/tiago-menegaz/ciclos/ciclo-01-fita/plano-observacao/index.html` (o pacote), `REGISTRO.md`,
`HANDOFF.md`.

**Referências.** `IDENTIDADE-VISUAL.md` (a medida de leitura e a grade do site), `ARQUITETURA-ANAMNESE.md`
(a ficha é o documento do professor), `PROTOCOLO.md` P-06 (o caderno é descritivo — e a ficha é a folha
dele).

**O que ainda não está feito.**

- **O `**negrito**` da alternativa marcada não renderiza na ficha HTML.** Na ficha PREENCHIDA, a
  alternativa escolhida sai como `**Vaganova**` — os asteriscos LITERAIS — porque a moldura vive
  dentro de um `<pre>`, e ali o markdown não é interpretado. É ANTERIOR a esta entrada e está
  declarado no próprio código («a marca é o NEGRITO»): quem escreveu sabia que a marca viaja como
  negrito, mas o `<pre>` não o desenha. Fica ABERTO: resolvê-lo pede decisão (tirar a moldura do
  `<pre>`, ou marcar de outro jeito), e não é o que o professor pediu nesta rodada.
- **O cofre órfão apareceu nos dados REAIS.** Com o recarimbo e o fuso de hoje, as fichas da Vavá e
  da Dani passaram de `…-1404`/`…-1501` para `…-1314`/`…-1315` — e as chaves do cofre ficaram nas
  antigas: `fita/tiago-menegaz/01/anamnese/anamnese-20261016-1404` e `…-1501` seguem lá (órfãs), e os
  envelopes novos **não têm cópia cifrada**. É o gap já registrado na entrada anterior, agora
  OBSERVADO — não é novo, e fechá-lo pede uma decisão (o cofre re-cifra na edição? com que senha?).
- **A janela de consistência do KV** (acima) segue como está: a tela cobre o caso da estante; a API
  não tem o que a cubra.
- **A ordem da estante** é a do servidor (mais recente primeiro). O professor a aprovou; se quiser
  ordem alfabética pelo apelido, é uma linha — mas não se muda o que não se pediu.

## O que está pendente

## 16/10/2026 — A tela diz de quem é a ficha, e o obrigatório se anuncia

- **A correção não está no ar por si.** O deploy publica o pacote gerado, e o gerador copia `porta/`
  para dentro dele: a correção chega ao site no **próximo deploy** de cada escola (a geração
  disparada pelo PO, ou um `wrangler deploy`). A escola `fita` só a verá depois disso.
- **As duas anamneses da `fita` continuam homónimas.** As duas estão com o apelido «Mari» (a de
  14:04 era «Vavá» e foi renomeada na edição, pelo defeito (iii)). A tela corrigida mostra as duas
  com o mesmo nome — nomeadas, mas ainda ambíguas. Corrigir o **dado** (um ajuste renomeando uma de
  volta, ou apagando uma) é decisão de quem conhece o caso, e não foi tomada aqui.
- **A senha da edição é trava de CLIENTE.** Não há verificação no servidor: `POST /api/elicitar` e
  `PUT /api/anamnese-editar/:id` não recebem senha. Como o resto da autorização da porta, ela vale
  contra o engano (editar sem querer), não contra quem escreve o pedido à mão.

## 16/10/2026 — A senha autoriza o ATO, não a SESSÃO

- **A trava da senha é de CLIENTE.** Nem `PUT /api/anamnese-editar/:id` nem
  `DELETE /api/anamnese-vinculo/:id` recebem senha: quem monta o pedido à mão passa por fora. Vale
  contra o engano e o acesso casual no mesmo navegador — não contra quem forja o pedido. Pôr a
  conferência no servidor é decisão em aberto (e mexeria no contrato das rotas).
- **A `fita` recebeu isto fora da cadeia**, como o elo anterior: geração manual do pacote + `wrangler
  deploy`, porque o gerador só publica depois do PO (Pré-requisito 5). As demais escolas o recebem na
  próxima geração delas.
- **A senha continua não sendo pedida no `POST /api/elicitar`** (a anamnese nova): o portão é o
  «Começar», que exige `SENHA_VALIDA`. Mesma fronteira de cliente do item acima.

## 16/10/2026 — A data da ficha é a da última mudança — e a edição do plano também pede a senha


- **O cofre não se atualiza na edição** (gap que já existia, e que o recarimbo torna mais visível):
  `POST /api/anamnese` só é escrito na **criação**, e agora a sua chave é o carimbo **antigo** — o
  registro cifrado fica **desatualizado e órfão** depois de uma edição. Fechar isso pede uma decisão
  (o cofre re-cifra na edição? com a mesma senha?) e uma rota `DELETE /api/anamnese/:carimbo`, que
  **não existe**. Não foi feito aqui.
- **A trava de senha é de CLIENTE.** `PUT`/`DELETE` não recebem a senha no servidor: quem chamar a API
  direto não é barrado. É a decisão vigente (a senha cifra e autoriza na tela); se o modelo pedir
  autenticação de servidor, isto muda.
- **A estante do PO** continua mostrando **só a data** e não tem estado nem ações — funcionalidade
  nunca construída.
- **`ARQUITETURA-ANAMNESE.md` §6.3** precisa ser harmonizado com a decisão de hoje (o caso livre).
- **O horário UTC** do carimbo não foi tocado: a estante mostra UTC, e alinhá-la ao fuso da escola é
  uma decisão que não foi tomada.

> **Correção de 16/10/2026 (mesmo dia).** O último bullet acima dizia que alinhar o carimbo ao fuso
> «é uma decisão que não foi tomada». **Está errado**: o dono do produto a tomou logo em seguida, e
> ela está na entrada seguinte — «O carimbo é a hora da escola, não a do servidor». O número de provas
> desta entrada cresceu com ela: `provar-carimbo-da-edicao.js` passou de **44** para **55**. A redação
> anterior não é apagada: fica como o elo que registra o que se pensou antes da resposta.

## 16/10/2026 — O carimbo é a hora da escola, não a do servidor


- **`tools/criar-escola.sh` não emite o `FUSO`** — é de `tools/`, congelado. Uma escola criada por
  ele nasce coberta pelo `FUSO_PADRAO` (São Paulo); declarar o fuso dela exige mexer no `tools/` com
  o ritual do congelamento. Se `criar-escola.sh -f` for rodado sobre a `fita`, o `"FUSO"` declarado
  no `wrangler.fita.jsonc` **se perde** (volta ao padrão da ponte).
- **`motor/servidor/provisionar-escola.js`** sobe a escola nova só com `ESCOLA_HABILITADA`; o fuso
  dela vem do padrão da ponte, não de uma binding. Também não foi tocado.
- **O `provisionar-escola.js` e a CLI** seguem sem fuso próprio — o que é certo para a CLI, e
  coberto pelo padrão para a provisão.
- E as pendências da entrada anterior seguem de pé: o **cofre** não se atualiza na edição, a trava de
  senha é de **cliente**, a estante do **PO** não tem estado nem ações.

## 16/10/2026 — A estante pagina de seis em seis, o roteiro é só da condução, e a ficha não fala a língua do motor


- **O `**negrito**` da alternativa marcada não renderiza na ficha HTML.** Na ficha PREENCHIDA, a
  alternativa escolhida sai como `**Vaganova**` — os asteriscos LITERAIS — porque a moldura vive
  dentro de um `<pre>`, e ali o markdown não é interpretado. É ANTERIOR a esta entrada e está
  declarado no próprio código («a marca é o NEGRITO»): quem escreveu sabia que a marca viaja como
  negrito, mas o `<pre>` não o desenha. Fica ABERTO: resolvê-lo pede decisão (tirar a moldura do
  `<pre>`, ou marcar de outro jeito), e não é o que o professor pediu nesta rodada.
- **O cofre órfão apareceu nos dados REAIS.** Com o recarimbo e o fuso de hoje, as fichas da Vavá e
  da Dani passaram de `…-1404`/`…-1501` para `…-1314`/`…-1315` — e as chaves do cofre ficaram nas
  antigas: `fita/tiago-menegaz/01/anamnese/anamnese-20261016-1404` e `…-1501` seguem lá (órfãs), e os
  envelopes novos **não têm cópia cifrada**. É o gap já registrado na entrada anterior, agora
  OBSERVADO — não é novo, e fechá-lo pede uma decisão (o cofre re-cifra na edição? com que senha?).
- **A janela de consistência do KV** (acima) segue como está: a tela cobre o caso da estante; a API
  não tem o que a cubra.
- **A ordem da estante** é a do servidor (mais recente primeiro). O professor a aprovou; se quiser
  ordem alfabética pelo apelido, é uma linha — mas não se muda o que não se pediu.

## Pendências anteriores (índice)

- **18/09/2026** — PO do Ciclo 01 — Duo validado → `REGISTRO.md` L9
- **18/09/2026** — Estrutura por professor (P-13, P-14) e migração do… → `REGISTRO.md` L35
- **18/09/2026** — Publicação do repositório no GitHub (decisão da… → `REGISTRO.md` L72
- **18/09/2026** — Pacotes de ciclo passam a ser versionados (deploy… → `REGISTRO.md` L101
- **18/09/2026** — Ciclo próprio por escola: a Ritmos deixa de ser cópia da… → `REGISTRO.md` L134
- **18/09/2026** — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19 → `REGISTRO.md` L190
- **18/09/2026** — PO do Ritmos validado + P-22 → `REGISTRO.md` L253
- **18/09/2026** — Publicação, primeira reancoragem da Duo e o caderno da… → `REGISTRO.md` L302
- **19/09/2026** — Congelamento da infraestrutura → `REGISTRO.md` L347
- **19/09/2026** — Criptografia dos acompanhamentos (exceção… → `REGISTRO.md` L396
- **19/09/2026** — Política de segurança dos dados sensíveis → `REGISTRO.md` L470
- **19/09/2026** — Caderno publicado e incluído no hash → `REGISTRO.md` L504
- **19/09/2026** — Método, README-ciclos e campos de duração → `REGISTRO.md` L541
- **19/09/2026** — README-ciclos: escopos e criação de ciclo → `REGISTRO.md` L583
- **19/09/2026** — Correções cosméticas → `REGISTRO.md` L604
- **19/09/2026** — Varredura de marcas de indecisão → `REGISTRO.md` L636
- **19/09/2026** — METODO no pacote e reorganização do menu → `REGISTRO.md` L680
- **20/09/2026** — O guia de observação passa a se chamar o que ele é → `REGISTRO.md` L737
- **20/09/2026** — O contrato de extração passa a ler tabela → `REGISTRO.md` L779
- **20/09/2026** — O índice da página sai do topo e vai para a direita, preso → `REGISTRO.md` L836
- **20/09/2026** — O contrato de extração vira lib (definição única) → `REGISTRO.md` L879
- **20/09/2026** — O contrato ganha as duas declarações (mapa de colunas e… → `REGISTRO.md` L921
- **20/09/2026** — O extrator do plano (o irmão), e o diff classificado → `REGISTRO.md` L965
- **20/09/2026** — O laço de validação vira lib (a segunda definição… → `REGISTRO.md` L1028
- **20/09/2026** — O pre-commit passa a validar o PLANO (schema + tipos) → `REGISTRO.md` L1070
- **20/09/2026** — O experimento passa a consumir o extrator (o ciclo fecha) → `REGISTRO.md` L1116
- **20/09/2026** — O fenômeno do PO é uma LISTA (o schema declarava string) → `REGISTRO.md` L1156
- **20/09/2026** — O escopo `experimentos` entra na lista do commit-msg → `REGISTRO.md` L1197
- **20/09/2026** — A tabela de escopos do REGRAS.md passa a listar os 27 do… → `REGISTRO.md` L1233
- **20/09/2026** — Peça 1: o JSON de dados do Duo entra como fonte → `REGISTRO.md` L1264
- **20/09/2026** — Peça 2: os builders das vistas saem para uma lib → `REGISTRO.md` L1309
- **20/09/2026** — O gerador passa a GERAR a vista (peça 3 da migração) → `REGISTRO.md` L1359
- **20/09/2026** — O guia gerado passa a emitir a data da aula → `REGISTRO.md` L1413
- **20/09/2026** — A linha de base renderiza o texto como veio (nada de… → `REGISTRO.md` L1460
- **20/09/2026** — O guia do Ritmos passa a ser gerado (peça 5) — e o… → `REGISTRO.md` L1503
- **20/09/2026** — O `pre-push` passa a existir — e a conferência do… → `REGISTRO.md` L1564
- **20/09/2026** — O gerador grava os JSONs do formulário no pacote (Fase 2.1) → `REGISTRO.md` L1605
- **20/09/2026** — O JSON de dados vai para o pacote cifrado (Fase 2.2) → `REGISTRO.md` L1686
- **20/09/2026** — O formulário de lançamento vai para produção (Área do… → `REGISTRO.md` L1743
- **20/09/2026** — A folha de captura vira config legível por máquina… → `REGISTRO.md` L1979
- **22/09/2026** — Agentes de workspace: geração, auditoria e apresentação → `REGISTRO.md` L2292
- **23/09/2026** — A identidade do projeto entra na documentação (e a… → `REGISTRO.md` L2344
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2425
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2506
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2597
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2665
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o… → `REGISTRO.md` L2740
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que… → `REGISTRO.md` L2851
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3051
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3182
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3356
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3477
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3630
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3779
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3979
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4213
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4406
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4673
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4875
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por… → `REGISTRO.md` L5156
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5316
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5470
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas… → `REGISTRO.md` L5659
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única… → `REGISTRO.md` L5861
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5974 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6166
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6324
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6488
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação… → `REGISTRO.md` L6623
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6743
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6859
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7197
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só… → `REGISTRO.md` L7298
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7424 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7545 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7670 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7818
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7945
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8015 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8093
- **30/09/2026** — O segundo papel do agente: o servidor local **não… → `REGISTRO.md` L8182
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO.md` L8269
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO.md` L8410
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO.md` L8531
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO.md` L8645
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO.md` L8762
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83… → `REGISTRO.md` L8914
- **07/10/2026** — O prompt de elicitação herda oito decisões do… → `REGISTRO.md` L9042
- **09/10/2026** — A criação de escola vira um comando: o CLI de… → `REGISTRO.md` L9282
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO.md` L9334
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO.md` L9387
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o… → `REGISTRO.md` L9440
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO.md` L9509
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO.md` L9563
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO.md` L9605
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO.md` L9681
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz… → `REGISTRO.md` L9730
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar… → `REGISTRO.md` L9787
- **12/10/2026** — O plano de ensino ganha estante, edição em sítio e… → `REGISTRO.md` L9846
- **12/10/2026** — A arquitetura geral ganha documento próprio (arquivo, não… → `REGISTRO.md` L9889
- **12/10/2026** — O botão «Criar nova escola» alinha o menu da Área do… → `REGISTRO.md` L9923
- **12/10/2026** — O CLI «criar-escola» alinha o menu zero ao plano de ensino → `REGISTRO.md` L9955
- **12/10/2026** — A página de entrada ganha o «Plano de ensino» → `REGISTRO.md` L9993
- **12/10/2026** — A raiz nunca é desabilitada pelo freio de escola → `REGISTRO.md` L10047
- **12/10/2026** — O rodapé do ciclo zero lista os três itens da Área do… → `REGISTRO.md` L10085
- **12/10/2026** — A folha de captura ganha rótulo curto e transposição → `REGISTRO.md` L10122
- **12/10/2026** — A senha de criptografia da Maria nasce mockada e chega ao CI → `REGISTRO.md` L10168
- **12/10/2026** — O PO referencia o plano por id e para de duplicar o… → `REGISTRO.md` L10202
- **12/10/2026** — O Diaghilev sai por expurgo DIRETO, e a trava de identidade… → `REGISTRO.md` L10251
- **12/10/2026** — O hook de expurgo nasce e passa o teste no Diaghilev II → `REGISTRO.md` L10339
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha… → `REGISTRO.md` L10404
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO.md` L10453
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO.md` L10508
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO.md` L10561
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor… → `REGISTRO.md` L10629
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo… → `REGISTRO.md` L10692
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO.md` L10756
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO.md` L10839
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se… → `REGISTRO.md` L10870
- **13/10/2026** — O professor é o dono, a Produção pede senha e o… → `REGISTRO.md` L10894
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO.md` L10934
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco… → `REGISTRO.md` L10964
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é… → `REGISTRO.md` L10999
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva… → `REGISTRO.md` L11027
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO.md` L11066
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO.md` L11114
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO.md` L11152
- **13/10/2026** — A curadoria nasce: a escola atribui a cada professor o que… → `REGISTRO.md` L11185
- **13/10/2026** — Metodologia e notação chegam ao PO (ligar L5 — Bloco… → `REGISTRO.md` L11218
- **13/10/2026** — A tela consome a curadoria: plano/PO travam sem curadoria e… → `REGISTRO.md` L11245
- **13/10/2026** — Bastidores quebrou: a página da Produção referia `env`… → `REGISTRO.md` L11283
- **13/10/2026** — A grelha das tabelas: a rubrica, as turmas em plural, o… → `REGISTRO.md` L11306
- **13/10/2026** — A rubrica: o conteúdo alinha-se à decisão (Bloco 10,… → `REGISTRO.md` L11410
- **13/10/2026** — A grelha não chegava à porta: duas listas brancas… → `REGISTRO.md` L11449
- **14/10/2026** — A régua da turma mede o critério no LANÇAMENTO (frente… → `REGISTRO.md` L11489
- **14/10/2026** — O PO completo chega inteiro aos derivados (frente B10) → `REGISTRO.md` L11578
- **14/10/2026** — O plano completo chega inteiro aos derivados (frente B11) → `REGISTRO.md` L11679
- **15/10/2026** — O Sistema Lastro: o nome comercial, e o mapa de evolução… → `REGISTRO.md` L11818
- **15/10/2026** — A dimensão observada deriva do PLANO (e o vocabulário do… → `REGISTRO.md` L12149
- **15/10/2026** — A cifra do Worker respeita o teto do runtime, e a falha… → `REGISTRO.md` L12267
- **15/10/2026** — A geração publica: o deploy entra na cadeia → `REGISTRO.md` L12367
- **15/10/2026** — O guarda do pre-push passa a conferir a última linha do… → `REGISTRO.md` L12431
- **15/10/2026** — A criação da escola diz onde guardar a senha de… → `REGISTRO.md` L12491
- **15/10/2026** — O prefixo do nome separa a chave da cifra da senha de acesso → `REGISTRO.md` L12560
- **15/10/2026** — O arquivo de senhas vira um espelho por escola → `REGISTRO.md` L12633
- **15/10/2026** — A chave de cifra vira interna do Worker: ninguém a vê,… → `REGISTRO.md` L12713
- **15/10/2026** — O lançamento da aula confere a senha e grava cifrado no… → `REGISTRO.md` L12826
- **15/10/2026** — O expurgo da escola sai do comando e vira botão, na raiz → `REGISTRO.md` L12908
- **15/10/2026** — O expurgo apagava a escola e deixava o cadastro das alunas… → `REGISTRO.md` L13015
- **15/10/2026** — `Buffer` não existe no runtime dos Workers: o expurgo não… → `REGISTRO.md` L13124
- **15/10/2026** — O gerador do HANDOFF quebrava com o repositório sem escola → `REGISTRO.md` L13231
- **15/10/2026** — O expurgo apagou o MODELO: a escola `ponta` não pôde… → `REGISTRO.md` L13267
- **15/10/2026** — Criar escola para o professor do MODELO: o `cp` recusava o… → `REGISTRO.md` L13328
- **15/10/2026** — Um conserto commitado e não publicado não conserta nada → `REGISTRO.md` L13381
- **15/10/2026** — O professor homônimo: o identificador é o slug, e o… → `REGISTRO.md` L13424
- **15/10/2026** — O molde sai de `professores/`: molde não é professor → `REGISTRO.md` L13506
- **16/10/2026** — «Nós, Por Exemplo» sai: a página é a apresentação, e… → `REGISTRO.md` L13584
- **16/10/2026** — A identidade visual tem seis famílias em estudo, e o… → `REGISTRO.md` L13654
- **tiago-menegaz · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).

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
