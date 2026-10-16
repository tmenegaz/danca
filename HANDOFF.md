# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-16T09:48:03-0300`
Commit atual: `3d71d03` — docs(ideia): a identidade visual tem seis famílias em estudo — e o seletor não existe
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
263e48e refactor(estrutura): o molde sai de professores/ — molde não é professor
ec7ffb2 fix(estrutura): a página da Produção quebrava com professor cadastrado — `env` fora de escopo
9eade85 Merge origin/main (a escola fita) em main (a validação por caminho)
2e4607c fix(estrutura): a validação de criar escola é por caminho — o formulário tinha razão
1362156 feat(estrutura): criar a escola fita (motor completo)
e0b869c feat(estrutura): a identidade do professor é o slug — e o sobrenome separa homônimos
bb12041 fix(estrutura): restaurar o MODELO e publicar o conserto que estava só commitado
03bda14 chore(estrutura): expurgar a escola ponta
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

## 16/10/2026 — A identidade visual tem seis famílias em estudo, e o seletor ainda não existe

**O que aconteceu.**
O dono do produto explorou **visualmente** seis direções de paleta para o Sistema Lastro, cada uma
com uma variante **clara** e uma **noturna**, e pediu que o estudo fosse **documentado** — sem
eleger identidade nova, sem implementar seletor e sem tocar em tela, dado ou arquivo de produção.
A tarefa tinha uma armadilha embutida, e ela foi respeitada: as imagens de referência são **estudo
visual**, e o que nelas aparece em texto ou código pequeno **não** é especificação. O resultado é
**documentação**, e o registo diz isso por palavras de modo que a próxima leitura não confunda.

**O que foi decidido.**
- **A identidade vigente não muda.** Bordô e ouro continuam a ser a paleta do sistema, com os
  valores que os tokens já declaram. As seis famílias são **estudo** — elegíveis, não eleitas —, e
  nenhuma foi promovida a identidade padrão.
- **O catálogo tem seis famílias e doze combinações**, com nomes **provisórios**: Bordô de Cena
  (a vigente), Verde de Ensaio, Azul de Gala, Prata de Palco, Azul de Bastidores e Luz de Camarim.
  Cada uma com **Clara** e **Noturna** — e a noturna **não** é a clara invertida: é concebida para
  a família.
- **Nenhum hex foi inventado.** O estudo chegou a nomes e carácter, **não** a valores: a tabela
  `PARES` do validador mede contraste par a par, e um tom escolhido no olho é exactamente o que ela
  existe para reprovar. Cada família terá os seus valores **especificados e medidos** antes de
  qualquer implementação.
- **Registou-se a funcionalidade futura**, e ela **não foi implementada**: uma entrada de menu
  **«Identidade visual»** no painel administrativo, com o campo **«Paleta de cores»** e as doze
  opções, valendo para **todas** as telas — cabeçalho, navegação, formulários, tabelas, cartões,
  modais e mensagens.

**O que a medição encontrou — e é o que trava o desenho hoje.**
- **O caminho está aberto:** o corpo de `tools/templates/ciclo.css` **não escreve um único hex** e
  usa `var(--…)` **66 vezes**. Trocar os valores do `:root` re-veste todos os componentes sem
  reescrever uma regra — é o que torna o escopo global viável.
- **Mas a paleta é resolvida na geração, não no uso:** a cópia `assets/style.css` do pacote é
  **gerada**, e o validador exige que ela seja **idêntica** à fonte (a checagem «circuito»). Um
  estático não muda de cor porque alguém escolheu uma opção.
- **E não há usuário a quem pendurar a preferência.** Isto é o achado da rodada, e está medido:
  `senhaDaEscolaOk` (`motor/servidor/bastidores.js:468`) aceita a senha da **direção** *ou a de
  qualquer professor cadastrado*, e depois do portão a página guarda **a senha** — em
  `sessionStorage`, estado por aba. O sistema autentica **um segredo**, não **uma pessoa**. A
  tarefa manda **não presumir** que a escolha vale para todos os usuários de uma escola, e a
  presunção é justamente o que o modelo de acesso **não** autoriza. Entrou como **C15**.
- **Os leitores da fonte assumem um só `:root`:** `tools/lib-tokens.js` corta o bloco no primeiro
  `}` depois do primeiro `:root`, e `check-identidade.js` faz o mesmo (`lerTokens`). Doze paletas
  num arquivo exigem que os dois saibam **qual** ler — e o PDF é alimentado pelo primeiro.

**O que mudou, arquivo por arquivo.**
- `IDENTIDADE-VISUAL.md` — o **contrato da forma**, e é ele que recebeu o grosso. Ganhou: o aviso
  datado no topo; «O catálogo planejado — seis famílias, doze variantes», com a tabela das seis, a
  lista das doze na ordem do catálogo e o aviso de que **as imagens são estudos, não
  especificação**; «A funcionalidade futura — configuração de aparência», com o fluxo de cinco
  passos, o escopo global e o que a troca **não** pode tocar; «As duas metades do problema», com as
  duas medições acima; «A pergunta sem resposta: a preferência é de quem?»; «Onde a preferência é
  guardada»; «Requisitos registados, para quando se implementar» (os onze, mais o
  `prefers-color-scheme`); e «Acessibilidade — o critério não muda, a superfície cresce». No fim,
  dois itens novos no «O que este documento não faz»: **não implementa o que planeja** e **não
  substitui a identidade vigente**.
- `PLANEJAMENTO-LASTRO.md` — o **mapa de evolução**. Ganhou: a nota datada no cabeçalho; a **C15** na
  §3; a **frente L13** (a identidade visual como escolha), com objetivo, o quadro «documentação
  concluída × funcionalidade implementada», situação medida, lacunas, dependências, entregas,
  as etapas **V0–V5**, critérios verificáveis e riscos; a **camada 6 — a forma** na §5, com o
  parágrafo «o que não se deve fazer na forma»; a **quarta matriz de cobertura** na §8, item por
  item da tarefa; e a secção «O que o registo da identidade visual não decidiu» na §9. O
  quadro-resumo passou a **treze** frentes e a §2.10 passou a declarar que a identidade **existe
  como contrato** e que o **catálogo não existe**.
- `REGISTRO.md` — esta entrada.
- **O que NÃO foi tocado:** `tools/templates/ciclo.css`, `tools/lib-tokens.js`,
  `tools/check-identidade.js`, `tools/templates/*.html`, qualquer arquivo de `motor/`, `raiz/`,
  `porta/` e os pacotes de ciclo. **Nenhuma linha de código de produto**, e **nenhuma regeração**.

**Por que isto não é a mudança de um congelado.** A rodada **não** mexeu em `tools/` nem no
`REGRAS.md`. O que ficou registado é que a **implementação** da L13 vai mexer — `ciclo.css`,
`lib-tokens.js`, `check-identidade.js` e, conforme o mecanismo, os templates —, e que ela será
**commit próprio com motivo declarado**, na hora. O `IDENTIDADE-VISUAL.md` é documento livre
em `CONGELAMENTO.md`, e por isso esta atualização é um commit normal.

**Como foi provado.** `node tools/check-identidade.js` — e ele é a prova de que a rodada **não**
mexeu na identidade: **21 pares** medidos, todos em AA ou acima; **21 hex** da paleta, nenhum fora
de `tools/templates/ciclo.css`; os **7 tokens** do deck batendo com a fonte; e o **circuito** — a
cópia `assets/style.css` e o `assets/nav.js` de cada pacote iguais à fonte. Se qualquer valor
tivesse mudado, ou se uma paleta nova tivesse entrado em falso, ele reprovava. As medições citadas
acima foram lidas do código, não supostas: as 66 ocorrências de `var(--…)` e a ausência de hex no
corpo do `ciclo.css`; o `indexOf(':root')` nos dois leitores; o `senhaDaEscolaOk`/`sessionStorage`
no portão da Produção; `motor/servidor/bastidores.js:550` para a folha compartilhada.

**Referências.** O estudo de paletas entregue pelo dono do produto (16/10/2026) ·
`IDENTIDADE-VISUAL.md` (o contrato, e o elo de 25/09/2026 que o criou) · `CONGELAMENTO.md`
(«alterar a estrutura de menu ou navegação») · os elos do mesmo dia: a estratégia comercial
(`PLANEJAMENTO-LASTRO.md` §L11–L12) e a apresentação do Sistema Lastro (a entrada anterior).

**O que ainda não está feito.**
- **Nada da funcionalidade.** Não há paleta nova no `ciclo.css`, não há item de menu «Identidade
  visual», não há campo «Paleta de cores», não há persistência e não houve regeração de pacote. O
  contrato está documentado e em vigor desde 25/09/2026; o **catálogo** desde hoje; a
  **funcionalidade não existe**.
- **A `C15` está aberta:** a preferência é **por escola**, **por usuário** ou **por navegador**.
  Sem ela não se desenha a persistência — e é ela que decide se há um campo novo no dado da escola.
- **A decisão do mecanismo está aberta:** aplicar **no navegador** (funciona em página estática, não
  regera pacote, não viaja entre dispositivos) ou **no servidor** (viaja, e cria um campo «de
  alguém»). O caminho do servidor existe: `"run_worker_first": true` nos `wrangler.<escola>.jsonc`.
- **Os hex das doze combinações não existem** — por desenho. Especificar e medir é a etapa **V1**.
- **Qual paleta o PDF e o deck passam a usar** continua por responder: o deck **declara** os tokens
  e o validador confere se batem com a fonte; o PDF recebe o `\definecolor` **injetado**. Com doze
  paletas, «a vigente» é a resposta provável — e continua a ser decisão.

## O que está pendente

## 15/10/2026 — Um conserto commitado e não publicado não conserta nada

- **A `ponta` não existe mais** — foi criada (run #5, 17:40) e expurgada (17:53) pelo dono do produto.
  Não há escola nenhuma agora, e o repositório está no estado de repositório recém-nascido.
- **O expurgo da `ponta` deixou um rastro que vale saber**: o KV tinha **0 chave** (a escola nasceu e
  morreu antes de qualquer anamnese ser gravada), então a limpeza não teve o que limpar — e o índice
  `escola/ponta/indice.json` ficou com o elo, como deve.
- **A `ponta` foi criada com o manifesto base `NOME="Ciclo 01 — Ponta"` e o professor `tiago`** — e o
  mesmo arquivo é o MODELO do scaffolder. Criar escola para o professor do modelo deixou o modelo e a
  escola no mesmo lugar; o `cp` condicional resolve a cópia, mas a sobreposição de papéis (modelo ×
  escola real) é um desenho a revisar — fica registrado, não decidido.

## 15/10/2026 — O professor homônimo: o identificador é o slug, e o sobrenome o separa

- **A criação de escola e o cadastro conferem contra os diretórios do REPOSITÓRIO** (`professores/*`),
  não contra o KV das outras escolas. É o escopo certo — a pasta é global —, mas significa que a
  conferência depende de o repositório estar legível (a raiz já depende dele para tudo).
- **A sobreposição modelo × escola real continua de pé**: `professores/tiago/` é o MODELO do
  scaffolder e passa a ser também a pasta de um professor real quando a escola nasce. O `cp`
  condicional resolve a cópia; o desenho dos dois papéis no mesmo diretório **não** foi decidido.
- **Entradas antigas do cadastro (sem `slug`) só serão convertidas quando forem reescritas** — não há
  migração. A leitura funciona com as duas formas, e nenhuma escola viva tem cadastro adicional hoje.
- **O cadastro do Bastidores não pergunta o sobrenome em campo separado obrigatório**: ele é exigido
  **pela colisão** (o 409 explica). O dono do produto escolheu exigir o sobrenome sempre na **criação
  de escola**; no cadastro, a trava é o que reage.

## 15/10/2026 — O molde sai de `professores/`: molde não é professor

- **A pasta de um professor cadastrado nos Bastidores continua nascendo só na primeira fonte.** O dono
  do produto pode querer o contrário — a pasta já na criação. Não foi decidido: é a mesma questão de
  antes (o repositório registra o que foi produzido, ou quem foi cadastrado?), e agora está declarada.
- **O `ciclo-01.conf` e a âncora do `tiago-menegaz` seguem sem PO e sem plano** — o dono do produto faz
  a anamnese → plano → PO em seguida. A âncora vai ser regerada quando as fontes entrarem.
- **O `HANDOFF.md` contava o molde como professor** e agora não conta; mas o mesmo defeito pode existir
  em qualquer outro consumidor de `professores/*/` que apareça. O que se corrigiu foi o molde — a
  varredura de consumidores não foi exaustiva.

## 16/10/2026 — «Nós, Por Exemplo» sai: a página é a apresentação, e o nome diz isso

- **A `fita` é a única escola em uso, e é a única página de ciclo regerada.** Qualquer pacote
  antigo que apareça continua com o texto velho: a regeração é por escola.
- **`biblioteca/fundamentacao.md` segue não existindo** (o `FRENTES.md` o declara como pendência
  do Trilho C desde antes; a troca de nome não a resolve).
- **O `HANDOFF.md` não foi regenerado nesta entrada** — ele extrai a última entrada do REGISTRO, e
  a última agora é esta; a regeneração é passo próprio.

---

## 16/10/2026 — A identidade visual tem seis famílias em estudo, e o seletor ainda não existe

- **Nada da funcionalidade.** Não há paleta nova no `ciclo.css`, não há item de menu «Identidade
  visual», não há campo «Paleta de cores», não há persistência e não houve regeração de pacote. O
  contrato está documentado e em vigor desde 25/09/2026; o **catálogo** desde hoje; a
  **funcionalidade não existe**.
- **A `C15` está aberta:** a preferência é **por escola**, **por usuário** ou **por navegador**.
  Sem ela não se desenha a persistência — e é ela que decide se há um campo novo no dado da escola.
- **A decisão do mecanismo está aberta:** aplicar **no navegador** (funciona em página estática, não
  regera pacote, não viaja entre dispositivos) ou **no servidor** (viaja, e cria um campo «de
  alguém»). O caminho do servidor existe: `"run_worker_first": true` nos `wrangler.<escola>.jsonc`.
- **Os hex das doze combinações não existem** — por desenho. Especificar e medir é a etapa **V1**.
- **Qual paleta o PDF e o deck passam a usar** continua por responder: o deck **declara** os tokens
  e o validador confere se batem com a fonte; o PDF recebe o `\definecolor` **injetado**. Com doze
  paletas, «a vigente» é a resposta provável — e continua a ser decisão.

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
