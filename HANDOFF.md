# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-15T11:32:43-0300`
Commit atual: `90af3f6` — docs(registro): a prova fim-a-fim da cifra passa, e o que falta é o deploy
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
- **Professores:** leticia
tiago (2)
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
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **dez frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
90af3f6 docs(registro): a prova fim-a-fim da cifra passa, e o que falta é o deploy
a7a99e5 chore(entrega): a geração da Barra absorve a página dos bastidores e a proveniência do plano
fff06ae Merge origin/main — o pacote da Barra gerado pela Action entra ao lado da correção da cifra
52da76e chore(entrega): gerar o pacote de leticia/01/barra
bf3b08f feat(ciclo): o «Guardar» do PO cifra ciclo-01-barra-dados.cifrado.json
1f11443 feat(po): o PO elicitado vira a fonte do ciclo
65f9d1b fix(estrutura): a cifra do Worker respeita o teto do runtime — e a falha deixa de ser muda
79aa8c3 feat(po): o PO elicitado vira a fonte do ciclo
4bd2afb chore(estrutura): reancorar a cadeia das fontes alteradas
f8dd1d5 feat(captura): declara a variante barra no schema de captura
225569d feat(ciclo): o contexto elicitado preenche o manifesto e liga o DOCS
6f2967e feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-glossario-benesh.md
9ae6620 feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-notacao.md
4f82465 feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-dados.json
0795a8b feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-harmonizacao.md
053d768 feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-captura-aula-01.md
10a4598 feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-referencias.md
cfffe53 feat(ciclo): o «Guardar» do PO deriva ciclo-01-barra-aula-01.md
e4cc290 feat(po): o PO elicitado vira a fonte do ciclo
e16b0b5 docs(registro): a decisão sobre os quatro arquivos presos da Barra
```

## Por professor

### leticia — 1 ciclo(s)

**Ciclo 01** — variante(s): barra

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| barra | ciclo-01-barra-po.md | Input_PO_Aguardando | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| barra | ciclo-01-barra.fipp | `db6233ad4475` | (vazio) | Input_PO_Aguardando |

### tiago — 1 ciclo(s)

**Ciclo 01** — variante(s): maria

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| maria | ciclo-01-maria-po.md | Input_PO_Aguardando | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| maria | ciclo-01-maria.fipp | `03fb63d2af3a` | (vazio) | Input_PO_Aguardando |

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

## 15/10/2026 — A geração publica: o deploy entra na cadeia

**O que motivou.** A prova fim-a-fim do mesmo dia mostrou o buraco, e ele é o último: o
`gerar-ciclo.yml` gerava, reancorava e **commitava** o pacote — e parava ali. O site serve os
**assets do Worker**, que só mudam num `wrangler deploy`. O comentário do workflow dizia «o deploy
lê o repositório», mas **nenhum** workflow fazia deploy e **nenhum** Worker estava ligado ao Git
(todas as dez implantações do `barra` são `source: "wrangler"`). O ciclo ficava gerado, versionado
e **invisível**: o menu seguia sem os documentos derivados, que é exatamente o que a pesquisadora
relatou («mandei gerar e nada disso foi feito»).

**O que foi decidido.**
- O **deploy é o último passo do próprio `gerar-ciclo.yml`**, depois do commit do pacote. O pacote
  gerado **é** o `assets.directory` do Worker da escola (`wrangler.<escola>.jsonc`): publicar é
  subir o pacote — não há artefato intermediário.
- **Mesmo padrão do `criar-escola.yml`**, que já subia o motor: `npx wrangler deploy -c
  wrangler.<escola>.jsonc` com `CLOUDFLARE_API_TOKEN` (secret do GitHub, já existente) e
  `CLOUDFLARE_ACCOUNT_ID`. **Nenhuma senha de professor ou de escola passa pelo CI** — a decisão de
  12/10 («a senha nasce no Cloudflare») fica intacta.
- **Publicar depois de commitar, e nunca depois de uma geração reprovada.** O `check-pacote.js`
  roda dentro do gerador: um pacote incompleto barra o job antes do commit e do deploy. Publicar um
  pacote pela metade seria pior que não publicar.
- A alternativa considerada e **não** escolhida: ligar o repositório à Cloudflare (Workers Builds),
  que dispensaria o secret mas poria a publicação **fora do repositório** — onde ela não é
  auditável nem reconstruível por quem lê o projeto.

**Onde entrou.**
- `.github/workflows/gerar-ciclo.yml` — o passo «Publicar o pacote no Cloudflare» e o comentário de
  cabeçalho corrigido (ele afirmava um deploy que não existia).

**Motivo declarado — os congelados.** Nenhum arquivo de `CONGELAMENTO.md` foi tocado. A geração, o
`check-pacote.js`, a âncora, as 17 regras e as 22 pétreas seguem iguais: o que muda é **onde a
cadeia termina** — no site, e não no repositório.

**Com o quê.** `.github/workflows/gerar-ciclo.yml`, `REGISTRO.md`, `HANDOFF.md`.

**Referências.** O elo anterior (15/10/2026) — a prova que expôs o buraco ·
`.github/workflows/criar-escola.yml` (o padrão de deploy já provado) · `wrangler.barra.jsonc`
(`assets.directory` = o pacote).

**O que ainda não está feito.**
- O passo de deploy **não** foi exercitado numa geração disparada pelo Worker depois desta mudança;
  é a próxima verificação.
- `SENHAS_LOCAIS` continua como secret do GitHub sem uso (a montagem foi removida em 12/10). Ela
  **não** cobre a `SENHA_CRIPTO` da Barra: com o caminho (a) funcionando, o CI não precisa de senha
  nenhuma para gerar — a cópia cifrada chega pronta pelo repositório. Decidir se o secret sai.
- As escolas `maria` e `danca` continuam sendo implantadas à mão quando preciso; o passo novo vale
  para todo ciclo gerado por este workflow, qualquer escola.

## O que está pendente

## 14/10/2026 — O plano completo chega inteiro aos derivados (frente B11)

(a) Como em B10, as chaves novas só aparecem num plano **gerado de
novo**: as fontes já escritas à mão (`ciclo-01-maria-plano.md`) não têm as seções `## Músicas e
vídeos` e `## Repertório`, e a ficha delas continua com as lacunas que o AUTOR escreveu — o
`contexto` agora carrega os valores reais, e é a vista que os lê; re-derivar do envelope não é
possível porque não há envelope no repositório. (b) A tabela do volume das fontes antigas tem
linhas de UMA célula (`| **15% no solo** |`), com proporção e justificativa vazias: a chave chega,
o valor não existe no documento — não se inventa. (c) No PO, `contexto-outro` e `campo-outro` continuam sem chave
própria: eles viajam dentro das linhas compostas do campo empírico e do contexto, como o próprio
conteúdo do PO declara — não é perda, é a forma declarada. (d) `projeto: 'Formação em Balé
Clássico'` segue escrito à mão e lido por ninguém — a frente B10 o declarou com a contagem de oito
derivadores; medida agora, são **onze** sítios em `motor/` e `tools/`. Fica declarado, não
alterado: mudá-lo mexeria em todas as fontes.

## 15/10/2026 — O Sistema Lastro: o nome comercial, e o mapa de evolução do produto

(a) **Nenhuma das dez frentes foi iniciada** — por pedido: este
elo é diagnóstico e plano. (b) As dez contradições (C1–C10) **esperam decisão** — em especial C3
(o Git basta como versão de domínio?), que é a que decide o tamanho de L5, e C1 (o lançamento vira
fonte versionada ou passa a ser lido do KV?), que decide L3 inteira. (c) Os **valores comerciais**
do §9 continuam **apenas no texto** que originou o mapa — não foram copiados para o repositório,
porque não há onde pô-los sem a frente L8. (d) O subtítulo descritivo segue como **proposta**.
(e) `FRENTES.md` **não** foi corrigido nas duas medições que envelheceram (as contagens de nós do
laudo L4 — 26/35 contra 25/33 medidos — e a frase de B5 sobre os envelopes): ficam registadas no
mapa e nesta entrada, para o próximo elo decidir se a correção datada vale.

## 15/10/2026 — A dimensão observada deriva do PLANO (e o vocabulário do PO separa-se do da anamnese)

(a) O pacote da **Barra** recebeu a mudança
(sincronizado à mão, porque o gerador recusa aquele ciclo — ver abaixo) e foi **deployado**, mas **não
pôde ser commitado**: o hook roda `gerar-ciclo.sh leticia 01 barra` e o gerador falha. (b) O **motivo
dessa falha** é estado herdado de outra frente, não desta: o ciclo da Barra passou a ter `DOCS="plano"`
(o plano elicitado como primeiro documento) mas **não tem documento de aula**, e o bloco do
calendário **exige** o volume de uma aula (`calendario.py`: «--duracao-curta e --volume-curto são
obrigatórios para o bloco do calendário»); além disso o `DATA_INICIO` continua lacuna. Pela ordem
natural, a aula nasce quando o **PO** for concluído (é `escrever-ciclo.js` que deriva as demais
fontes); até lá, qualquer commit que toque o pacote da Barra é recusado pelo hook. (c) O
`linhaDeBase` do PO da Maria continua com **10 de 11 linhas que não são objeto** — o `traz` multilinha
da anamnese rompe a tabela markdown (o validador já o avisa); é defeito **pré-existente**, medido
nesta sessão e **não** corrigido aqui.

## 15/10/2026 — A cifra do Worker respeita o teto do runtime, e a falha deixa de ser muda

- **O deploy do pacote continua MANUAL — e é o maior buraco da cadeia.** O `gerar-ciclo.yml` gera,
  reancora e **commita** o pacote; o comentário dele diz «o deploy lê o repositório», mas **nenhum
  workflow faz deploy** e **nenhum Worker está ligado ao Git**: todas as implantações do `barra`
  têm `source: "wrangler"` (conferido em 15/10/2026). Mesmo com a geração verde, o site só passa a
  servir o ciclo depois de um `wrangler deploy` à mão. Enquanto isso não for decidido —
  `wrangler-action` no workflow, Workers Builds ligado ao repositório, ou o deploy manual assumido
  como parte do fluxo — «um clique e faz tudo» **não** se cumpre.
- A prova fim-a-fim (PO concluído → pacote publicado no site) **não** foi repetida depois desta
  correção; é a próxima etapa.
- `tools/gerar-acompanhamento.sh` continua lendo a senha de `tools/.senhas-locais` (pendência da
  entrada de 12/10).

## 15/10/2026 — A geração publica: o deploy entra na cadeia

- O passo de deploy **não** foi exercitado numa geração disparada pelo Worker depois desta mudança;
  é a próxima verificação.
- `SENHAS_LOCAIS` continua como secret do GitHub sem uso (a montagem foi removida em 12/10). Ela
  **não** cobre a `SENHA_CRIPTO` da Barra: com o caminho (a) funcionando, o CI não precisa de senha
  nenhuma para gerar — a cópia cifrada chega pronta pelo repositório. Decidir se o secret sai.
- As escolas `maria` e `danca` continuam sendo implantadas à mão quando preciso; o passo novo vale
  para todo ciclo gerado por este workflow, qualquer escola.

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
- PO de **leticia · barra** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **leticia · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
- PO de **tiago · maria** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **tiago · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).
- Material de campo de **tiago**: 0 evento(s) versionado(s).

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
