# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-18T18:44:03-0300`
Commit atual: `a1a750e` — fix(estrutura): o resumo da faixa desce em vez de se espremer, e a lista não mente
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
- **Ciclos com manifesto:** 2 variante(s)
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
a1a750e fix(estrutura): o resumo da faixa desce em vez de se espremer, e a lista não mente
a524428 feat(estrutura): o cabeçalho do ato cabe em 360px, e a barra vira a decisão tomada
4843ba3 feat(tools): o estado escondido passa a esconder — o `[hidden]` na base da folha
ecb3cac feat(estrutura): o cabeçalho do ato cresce, e o «Fechar» deixa de descontar
55ea429 feat(estrutura): a família é o segundo eixo da aparência
bca77bb feat(tools): a Cortina Turquesa — a segunda família, medida antes de existir
56459c1 feat(estrutura): a Aparência com a peça certa, e o catálogo que faltava
83f0413 feat(tools): o catálogo das peças — um nome antes do desenho
7702c9f feat(estrutura): a aparência é da escola, e o servidor aplica-a
b901058 feat(tools): a barra perde o botão da aparência — a decisão é da escola
d930cd5 docs(estrutura): a C15 foi decidida — a preferência de aparência é da escola
610e747 docs(estrutura): a conferência visual fecha, e a C15 ganha glosa nos dois documentos
ec57630 docs(estrutura): a leitura de fechamento dos dois documentos de identidade
ce874b9 feat(estrutura): a dobra do índice da página — recolhe no celular, aberta na tela larga
f9b416b fix(estrutura): a etiqueta é uma só — e o que está no ar é o motor
dbd1279 docs(experimentos): na S5 a marca sai SEMPRE ao rolar, não só quando não cabe
724f202 docs(experimentos): o ☰ da S5 andava, e a barra da página ficava presa
9444099 docs(experimentos): a S5 — a sessão sobe para a barra do sistema SEM levar o hambúrguer
7d8d6e3 docs(estrutura): a fase 7 fecha os passos, e a regra das duas linhas ganha o mecanismo
a35f5d7 feat(estrutura): a turma passa a ser três PASSOS, e o conteúdo vai para onde a turma já existe
```

## Por professor

### tiago-menegaz — 1 ciclo(s)

**Ciclo 01** — variante(s): fita, valse

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| fita | (sem PO) | — | — |
| valse | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| fita | ciclo-01-fita.fipp | `ef5ee269d784` | (vazio) | — |
| valse | ciclo-01-valse.fipp | `5bdd2e241b25` | (vazio) | — |

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

## 18/10/2026 — Regra: medir na bancada, e o ar só na conferência final

**O que motivou.** A cota diária de operações do Cloudflare KV acabou no meio do trabalho, e o
sintoma apareceu longe da causa: os endpoints de estado responderam **500**
(`Error: KV list() limit exceeded for the day`) e a lista de fichas ficou sem o nome das alunas e
sem os botões «editar» e «apagar». Leitura disso, na tela: «as fichas se perderam». Não se
perderam — e o store não chegou a ser escrito.

**A causa era de método, e foi minha.** Para conferir larguras e quebras de linha, carreguei as
páginas do ar **dezenas de vezes** num único dia. Cada carga da página da anamnese pede
`/api/envelopes`, `/api/anamnese-estados`, `/api/bastidores/alunas`, `/api/bastidores/professores`
— e as rotas de estado fazem `list()` no KV. Medir no ar gasta a cota que o **teste do usuário**
precisa, e não mede melhor do que a bancada: o navegador vê a mesma geometria servida de
`127.0.0.1`.

**O que foi decidido.**
- **Medir na bancada local, sempre.** O padrão já existia nas provas que precisam de navegador: um
  `http.createServer` em porta efêmera que serve `porta/index.html`, `tools/templates/ciclo.css`,
  `tools/templates/nav.js` e `/api/*` **stubado**; o Puppeteer navega para lá. Largura, geometria,
  estado, foco — tudo se mede assim.
- **Ao ar, uma carga por escola, no fim.** É conferência, não exploração.
- **Um 500 diagnostica-se pelo endpoint**, com um `curl` ao `/api/…` que falhou, e o motivo real em
  `npx wrangler tail --config wrangler.<escola>.jsonc`. Recarregar a página para «ver se melhorou»
  gasta mais e não diz nada de novo.
- **Uma prova não esconde o que gasta.** `provar-ambiente.js` — a única que vai à rede de propósito
  — passou a contar as requisições e a imprimir o total no fim: **14 (2 escolas × ~7)**, medido.
- **O sintoma fica escrito**, para não se perder tempo a procurar dado perdido: «sem apelido» em
  todas as fichas + nenhum botão de edição = 500 nos endpoints de estado, quase sempre cota.

**Onde entrou.**
- `AGENTS.md` — a secção **«Medir sem gastar a cota do ar»**, com os quatro pontos e a distinção que
  evita o erro seguinte: o domínio no código **não** quer dizer requisição (`provar-producao`,
  `provar-contexto-do-ato` citam `https://…workers.dev` no `Request` mas correm o motor em
  processo, com `bastidores.fetch(new Request(...), env)`). É o arquivo que toda sessão lê.
- `experimentos/README.md` — a secção «Medir sem gastar a cota do ar», com o esqueleto da bancada em
  código, porque é nesta pasta que os scripts de medição nascem.
- `experimentos/provar-ambiente.js` — o contador `requisicoesAoAr` e a linha de custo no fim.
- **Motivo declarado — os congelados.** Nenhum arquivo de `CONGELAMENTO.md` foi tocado: `AGENTS.md`,
  `experimentos/` e este registro são livres.

**Com o quê.** `AGENTS.md` · `experimentos/README.md` · `experimentos/provar-ambiente.js` · este
registro.

**Referências.** A mensagem do Worker, lida em `wrangler tail`:
`Error: KV list() limit exceeded for the day` (`at Object.nomesDeEnvelopes`) · a documentação de
limites do Workers KV (a tabela atual declara **leituras** 100.000/dia e **escritas** 1.000/dia por
conta no plano free; o limite de `list()` **não** está nessa tabela — o que é facto é o erro, e é
ele que fica registrado) · `experimentos/provar-ato-e-barra.js` (o padrão de bancada local, com o
`/api/anamnese-estados` a servir os dois desfechos: 200 e 500).

**O que ainda não está feito.** (a) O **número exacto** de `list()` por dia não está documentado na
página de limites consultada hoje — sabe-se que o limite existe, que é diário e que repõe às 00:00
UTC. Quem precisar do número mede-o, não o cita. (b) O consumo **por visita** não foi reduzido: a
anamnese faz um `list()` por família de envelopes, e a Produção lista várias; se a cota voltar a
apertar, o caminho é um **índice gravado** em vez de um `list()` por visita — decisão de produto,
que não se toma sem o dono.

## O que está pendente

## 18/10/2026 — A segunda família: a Cortina Turquesa, medida antes de existir

(a) **Cinco famílias continuam sem hex** — as direções estão no
catálogo e nenhum valor foi inventado; o formulário que elas têm de preencher está escrito.
(b) O *quando* a escola escolhe segue aberto, e é de produto. (c) O item de menu **Identidade
visual** não existe: o controlo vive na secção Aparência, e é lá que fica enquanto for
configuração e não frente própria. (d) As **imagens de referência não estão no repositório** — são
estudo, e o que se aproveitou delas está medido e escrito.

## 18/10/2026 — O cabeçalho do ato cresce, e o «Fechar» deixa de descontar

(a) O arranjo da **barra de botões** está proposto e **não**
escolhido — depende do dono do produto, e é ele que decide entre B1, B2 e B3. (b) O mesmo para as

## 18/10/2026 — O cabeçalho do ato cabe em 360px, e a barra de botões vira a decisão tomada

(a) A **senha do plano** (edição/derivação) não foi remedida a
360px nesta entrada — o `sinalDeSenha` é o mesmo, mas o fluxo do plano não passou pela bancada.
(b) Os **«?» da página de estudo**: I1 e I2 respondem ao clique, I3 tem o «Fechar» a fechar a
folha, mas o mock não tem botão que a abra — a folha nasce aberta, porque é um desenho. (c) O
`#fechar` continua com `disabled` **e** `hidden`: duas trancas para o mesmo estado, mantidas de
propósito (a de `disabled` é a que o servidor de prova alcança por nome).

## 18/10/2026 — Correção: o resumo da faixa desce, e a lista não mente quando não lê

(a) O `catch` de `carregarFichas()` (a lista de envelopes) continua
a cair na memória do navegador em silêncio — a falha dos ESTADOS passou a ser dita, a dos
ENVELOPES não; hoje o sintoma não se distingue de «não tenho fichas». (b) O consumo de `list()`
por visita não foi reduzido nem medido: a página da Produção lista várias famílias, e não há
contagem. Se o limite voltar a apertar, o caminho é um índice gravado, não um `list()` por visita
— decisão que **não** se toma sem o dono do produto. (c) A marca do produto continua fora da
página de estudo, à espera de ser vetorizada em SVG.

## 18/10/2026 — Regra: medir na bancada, e o ar só na conferência final

(a) O **número exacto** de `list()` por dia não está documentado na
página de limites consultada hoje — sabe-se que o limite existe, que é diário e que repõe às 00:00
UTC. Quem precisar do número mede-o, não o cita. (b) O consumo **por visita** não foi reduzido: a
anamnese faz um `list()` por família de envelopes, e a Produção lista várias; se a cota voltar a
apertar, o caminho é um **índice gravado** em vez de um `list()` por visita — decisão de produto,
que não se toma sem o dono.

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
- **16/10/2026** — A tela diz de quem é a ficha, e o obrigatório se anuncia → `REGISTRO.md` L13757
- **16/10/2026** — A senha autoriza o ATO, não a SESSÃO → `REGISTRO.md` L13862
- **16/10/2026** — A data da ficha é a da última mudança — e a edição… → `REGISTRO.md` L13985
- **16/10/2026** — O carimbo é a hora da escola, não a do servidor → `REGISTRO.md` L14104
- **16/10/2026** — A estante pagina de seis em seis, o roteiro é só da… → `REGISTRO.md` L14194
- **16/10/2026** — A sequência de exercícios chega ao `plano-XX.json` (e o… → `REGISTRO.md` L14310
- **16/10/2026** — O ciclo passa a ser DA TURMA (fase 1: a identidade da fonte) → `REGISTRO.md` L14434
- **16/10/2026** — A hora de início é do DIA da semana (e a turma passa a… → `REGISTRO.md` L14496
- **16/10/2026** — A turma deriva: o «editar» passa a ser um elo novo, com… → `REGISTRO.md` L14553
- **16/10/2026** — A curadoria é de UMA turma (e edita-se ou deriva-se como a… → `REGISTRO.md` L14690
- **16/10/2026** — A identidade visual fecha o circuito: raiz, porta,… → `REGISTRO.md` L14759
- **16/10/2026** — A curadoria é de UMA turma — e o id passa a dizê-lo → `REGISTRO.md` L14852
- **16/10/2026** — A camada de componentes: o desenho deixa de ser reescrito… → `REGISTRO.md` L14918
- **17/10/2026** — Os papéis e a variante noturna: a identidade passa a ter… → `REGISTRO.md` L14988
- **17/10/2026** — A aparência ganha prova própria — e o botão que… → `REGISTRO.md` L15063
- **17/10/2026** — A escola nasceu sem o botão da aparência: a barra tinha… → `REGISTRO.md` L15316
- **17/10/2026** — A lista de turmas deixa de ficar acavalada no celular → `REGISTRO.md` L15384
- **17/10/2026** — Os commits estavam certos e a produção estava velha: as… → `REGISTRO.md` L15689
- **17/10/2026** — O botão que parecia quebrado, o campo colado no botão e o… → `REGISTRO.md` L15743
- **17/10/2026** — As sete listas da Produção passam a folhear (o botão que… → `REGISTRO.md` L15839
- **18/10/2026** — A escola não é campo: o cabeçalho do ato separa o que se… → `REGISTRO.md` L15925
- **18/10/2026** — O nome da escola estava no JSON e vinha do cliente: o… → `REGISTRO.md` L15987
- **18/10/2026** — a S5 entra em produção, e os três passos ganham os… → `REGISTRO.md` L16393
- **18/10/2026** — o «Seções» vira botão, e a página começa na secção → `REGISTRO.md` L16454
- **18/10/2026** — a proveniência sai da curadoria e vale para tudo; o menu… → `REGISTRO.md` L16494
- **18/10/2026** — os três passos fecham as travas, e o «Editar» da turma… → `REGISTRO.md` L16545
- **18/10/2026** — o vocabulário escolhe em lista, e cada nome diz as suas… → `REGISTRO.md` L16606
- **18/10/2026** — o cancelar chega à curadoria, a turma perde dois campos, e… → `REGISTRO.md` L16661
- **18/10/2026** — o formulário recolhe para uma faixa, e a listagem ocupa a… → `REGISTRO.md` L16716
- **18/10/2026** — o nome do professor na curadoria abre o plano de ensino dele → `REGISTRO.md` L16763
- **18/10/2026** — a faixa dos passos numa linha só, com a seta no fim → `REGISTRO.md` L16801
- **18/10/2026** — a etiqueta é uma só, e o que está no ar é o motor → `REGISTRO.md` L16844
- **18/10/2026** — a dobra do índice da página, no celular → `REGISTRO.md` L16921
- **18/10/2026** — a C15 foi decidida: a preferência de aparência é da… → `REGISTRO.md` L17074
- **18/10/2026** — A aparência passou a ser da escola, e o servidor aplica-a → `REGISTRO.md` L17140
- **18/10/2026** — O catálogo das peças: um nome antes do desenho → `REGISTRO.md` L17229
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
