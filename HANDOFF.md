# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-11-23T10:44:59-0300`
Commit atual: `f40dc797` — feat(estrutura): habilitar demi-plie em bale-classico
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
- **Professores:** bom-bom
brise-volet
colo-de-pe
coqui-de-redinha
dedao-aberto
demi-plie
fernando-franciose
grand-plie
lapis-rosa
pe-pequeno
pe-torto
rabo-gramde
redinha-rosa
rimel-preto
sapatilha-de-ponta (15)
- **Ciclos com manifesto:** 1 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-AGENTE.md`** — Especificação do **copiloto pedagógico** do Sistema Lastro: um agente que lê os índices e os envelopes **por chave**, através de ferramentas com contrato explícito (MCP), e **propõe** texto ao professor — nunca grava. Modelo: Llama da Cloudflare (Workers AI), **`@cf/meta/llama-3.1-8b-instruct-awq`**. **Sem RAG**, por decisão: 100 % do que o agente consulta é chave-valor. **Quatro superfícies** (decidido a 12/11/2026): plano de ensino, PO, Estilo **e a elaboração da aula N** — esta última **espera uma tela que não existe**.
- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor, fechando na **conclusão** — o campo **«Resultado da avaliação»** (apta/não apta + nível, sem turma/horário/frequência) — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`), o **ajuste no plano** (`B8`), a **derivação por aula** (§4.3), a **regra que tranca a aula dada** (§1.3) e o **nascimento da aula pelo calendário** (§4.4) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-GERAL.md`** — Arquitetura geral — por que sistema de arquivos, e não um backend com banco
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — o Bastidores é o ambiente da direção da escola: um grupo de menu com duas vistas — o Estúdio de Dança (que a direção partilha com o professor) e a Produção (só da direção) —, regido pelo princípio cena × bastidores, pela regra da reverberação (o que a escola declara desce para os documentos da cena) e pela proveniência própria da escola.
- **`PLANEJAMENTO-LASTRO.md`** — o mapa de evolução do **Sistema Lastro** (o nome comercial do produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os relacionamentos, os índices, o versionamento e o comercial — e **treze frentes** com objetivo, lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi implementado: este documento é o mapa, não a obra.

## Últimos commits

```
f40dc797 feat(estrutura): habilitar demi-plie em bale-classico
305171e6 fix(template): a seta só está onde ela a pediu, e gravar as habilitações fecha o formulário
2741f55d audit(experimentos): a criação da escola alimenta a lista dos professores
453d6f08 feat(estrutura): o documento do professor pode ser CNPJ, e não só CPF
9aa12256 feat(estrutura): os professores têm Ações, documento e contacto — e o Financeiro manda o professor para lá
6f11507e feat(estrutura): habilitar demi-plie em bale-classico
99e9edb8 feat(estrutura): habilitar demi-plie em bale-classico
ddbee1d5 feat(acervo): envelope/.indice.json
abbe291c feat(estrutura): criar a escola breu (motor completo)
c7b1ee0f fix(estrutura): a senha do professor não se esconde com o modo do professor
bd87f249 docs(estrutura): o CNPJ das escolas de teste, e a data que eu tinha escrito errada
c24e4636 feat(estrutura): a criação também herda a identidade fiscal, e não só a recriação
870895ce docs(estrutura): a recriação traz os dados da escola, e o convite deixa de prometer o que não tem
c71eefe2 fix(estrutura): recriar a escola traz os dados dela de volta, marcados como herdados
b39c3bf4 docs(estrutura): os dados da escola, o CNPJ que ficava pelo caminho, e o que «outra Breu» quer dizer
3b4e9746 feat(estrutura): a identidade fiscal sobrevive ao expurgo, e os dados da escola têm aba
f0186400 fix(estrutura): um mês que foi pago nunca se esconde do extrato
96535aaf docs(estrutura): a regra do financeiro que fica, e o que «Recriar» significa
1dc07e2a fix(estrutura): o financeiro de uma escola expurgada não se apaga — é história
838938c2 docs(estrutura): a fotografia do expurgo da breu, e o que ele deixou para trás
```

## Por professor

### bom-bom — 0 ciclo(s)

### brise-volet — 0 ciclo(s)

### colo-de-pe — 0 ciclo(s)

### coqui-de-redinha — 0 ciclo(s)

### dedao-aberto — 0 ciclo(s)

### demi-plie — 1 ciclo(s)

**Ciclo 01** — variante(s): breu

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| breu | (sem PO) | — | — |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| breu | ciclo-01-breu.fipp | `e81a3e1cf08c` | (vazio) | — |

### fernando-franciose — 0 ciclo(s)

### grand-plie — 0 ciclo(s)

### lapis-rosa — 0 ciclo(s)

### pe-pequeno — 0 ciclo(s)

### pe-torto — 0 ciclo(s)

### rabo-gramde — 0 ciclo(s)

### redinha-rosa — 0 ciclo(s)

### rimel-preto — 0 ciclo(s)

### sapatilha-de-ponta — 0 ciclo(s)

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

## 23/11/2026 — O «Gravar» das habilitações só acende quando o pedido mudaria

**O PEDIDO, e o motivo está na primeira linha:** «para evitar custo, só vai habilitar o botão gravar
quando mudar alguma coisa». O custo não é o clique — é a gravação: cada «Gravar» escreve
`professores/<slug>/perfil.json` no repositório e move a cadeia.

**A CONTA É O PEDIDO, NÃO O ECRÃ.** `retratoDasHabilitacoes()` devolve o que o formulário mandaria
agora, na mesma forma em que o pedido o manda — e `tradicoesDasHabilitacoes()` passou a ser a conta
única do `submit` e da comparação. Duas contas divergiriam no dia em que uma delas aprendesse um
campo, e o sintoma seria o pior: um botão apagado sobre uma diferença que existe.

**E ESSA CONTA OBRIGOU A FECHAR UM BURACO QUE JÁ LÁ ESTAVA.** O perfil guarda **três** estados por
modalidade desde 18/11 — chave ausente («ainda não foi perguntado»), chave vazia («não ensina
nenhuma») e chave com nomes —, mas o pedido só sabia exprimir dois: mandava `[]` também quando
ninguém tinha respondido. Medido no repositório: **13 dos 15** perfis têm `modalidades` e **nenhum
mapa de tradições**. Nesse estado a caixa do generalista aparece desmarcada; marcá-la era, no ecrã,
uma declaração — e no pedido, nada. O `submit` passou a **calar a chave** quando nem o generalista
nem uma tradição estão marcados, e é isso que faz a terceira linha do modelo existir de facto.

**A BASE VEM DO SERVIDOR, com uma marca para o que o ecrã não sabe exprimir.** `retratoDoServidor(d)`
usa `~` para a chave declarada e vazia e `''` para a ausente. Uma base calculada do que ficou pintado
perdia exactamente o caso mais comum — o perfil nunca perguntado — e teria deixado o botão apagado
sobre uma declaração verdadeira. Foi a primeira versão, e a prova apanhou-a.

**Cinco consequências, e cada uma é uma asserção:** voltar ao estado de origem apaga o botão;
cancelar apaga-o e devolve o estado; gravar faz do gravado a nova base (sem esperar pela releitura —
senão há um instante aceso sobre um estado já gravado); trocar de professor apaga-o **antes** de
ler; e **um estado que não se conseguiu ler não se grava por cima** — o botão fica apagado e a nota
diz porquê, porque as caixas de um professor que não se leu estão vazias e gravá-las apagaria a
declaração.

**O BOTÃO NASCE APAGADO NA MARCAÇÃO.** Nascer aceso e apagar-se à chegada da leitura daria um
instante em que se pode gravar sem saber o quê; e sem JavaScript não há gravação nenhuma — o pedido
é o `submit`. O `title` diz a razão («nada mudou» / «o estado ainda não foi lido»): um botão
desligado sem explicação é a mesma família do botão que falta.

**E FICOU DOCUMENTADO COMO PADRÃO, que foi o que ela pediu:** «Nessas situações em que não tem o
botão de editar, a gente vai adotar isso como padrão.»

| género | como abre | o «Gravar» |
|:--|:--|:--|
| com «Editar» | fechado, a mostrar o registo | acende ao abrir |
| **sem «Editar»** | aberto, já com o estado carregado | **apagado**; acende só com uma diferença |

Está em `IDENTIDADE-VISUAL.md` (capítulo «O «Gravar» que só acende quando algo muda») e no resumo
executável das instruções, que é o sítio que os agentes leem antes de escrever marcação.

**Com o quê.** `motor/servidor/bastidores.js` (`blocoDasTradicoes`, `tradicoesDasHabilitacoes`,
`retratoDasHabilitacoes`, `retratoDoServidor`, `pintarGravarDasHabilitacoes`,
`marcarBaseDasHabilitacoes`, `dizerQueNaoSeLeuAsHabilitacoes`, a marca `data-a-gravar` no
`ocuparBotao`/`liberarBotao`, os dois handlers de mudança, o `submit` e a marcação do botão),
`experimentos/provar-o-gravar-que-so-acende.js` (**novo**), `IDENTIDADE-VISUAL.md` e o resumo das
instruções.

**MEDIDO.** `provar-o-gravar-que-so-acende` **42/42**; controle `--contra=305171e6` reprova **19**.
Num Chrome, com a página real e o `fetch` de bolso: `disabled` à chegada com `opacity 0.4` e
`cursor: not-allowed`, aceso (`opacity 1`, `pointer`) ao marcar o jazz, e apagado outra vez ao
desmarcá-lo. `provar-habilitacao-do-professor` verde, `provar-cadastro-do-professor` 87/87,
`provar-a-dobra-so-onde-ela-pediu` 35/35, `provar-o-painel-do-estudio` 36/36,
`provar-ficha-na-listagem` 35/35, `provar-professor-secundario` 19/19, `check-identidade` **0
problemas** (23 verificações). `provar-editar-professor-principal` 32/33 — a falha é anterior e
igual sem esta mudança.

## O que está pendente

## 20/11/2026 — A matriz do formulário pergunta uma vez por par, e o eixo vem de uma regra só

Duas provas da família do lançamento continuam vermelhas e **já
estavam antes desta mudança** (conferido em worktree): `provar-lancamento` e
`provar-eixos-e-tempo-da-aula`.

## 20/11/2026 — A folha impressa deixou de perguntar duas vezes

A `-aula-01.md` continua com as linhas de técnica repetidas na §5 —
ela melhora com a mesma fusão, mas só quando for re-derivada com o elenco certo (ver acima).

## 22/11/2026 — O fluxo da Aula 02 escrito, e o expurgo com um conferidor

- **A metade do KV não foi medida daqui.** `provar-expurgo-kv` exige `CLOUDFLARE_API_TOKEN` e o
  namespace real (11 asserções, todas `HTTP 401` sem ele). Fica a autoridade do relatório da página.
- **Não há portão N-1**: a Aula N pode nascer antes de a N-1 ter os dados do formulário. Ela disse
  «por enquanto não faz, mas tome nota disso».
- **O pacote da turma `rosa` da `breu`** colide com uma escola nova com o mesmo nome: a escola passa,
  a **turma** é que recusa. Criar com **outro nome de turma**, ou deixar o expurgo levar o pacote.

## 22/11/2026 — Uma régua só, e um plano só na escolha

- **A metade do KV do expurgo continua por medir**: a chave recebida é a mestra, e não um token da
  Cloudflare. Falta um token de API (`Workers KV Storage: Edit`) ou uma corrida do workflow com o
  segredo do repositório.
- **`provar-lancamento`** morre com `ENOENT` no fixture `ciclo-01-maria` — a escola foi expurgada e a
  prova lê o pacote dela. Mesma família da `provar-estante-do-po`; não foi tocada hoje.

## 22/11/2026 — O estúdio, e o modelo do painel inicial

- **O painel não está construído.** O que existe é o modelo, e ele espera duas decisões: o **peso do
  número** (a caixinha da casa ou uma peça nova) e o que **«ocupação»** mede.
- **Se a ocupação for o corpo**, falta o campo **vagas** na Sala — e é um campo novo de dados, com o
  caminho que os outros tiveram (declarado no cadastro, lido pelo painel, provado).
- **A metade do KV do expurgo continua por medir**: a chave do cofre é a `SENHA_MESTRA`, não um token
  da Cloudflare. Fica à espera de um token de API.

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
- **01/11/2026** — A aula deixa de afirmar o que ninguém escreveu: cinco… → `REGISTRO.md` L29904
- **02/11/2026** — A segunda passagem sobre a mesma tela: rótulos, travões e o… → `REGISTRO.md` L32097
- **02/11/2026** — O motor dos produtos: o dicionário e o syllabus, e o que… → `REGISTRO.md` L32182
- **02/11/2026** — A licença em texto, a condição de conteúdo executável, e a… → `REGISTRO.md` L32261
- **02/11/2026** — A fotografia datada, o dono do termo, e o plano que vai… → `REGISTRO.md` L32369
- **03/11/2026** — O termo que a Produção criou, o alfabeto que não tem dono,… → `REGISTRO.md` L32488
- **03/11/2026** — A música deixou de se bloquear e de se multiplicar, e o… → `REGISTRO.md` L32577
- **03/11/2026** — A listagem lia com o alfabeto errado, e deitava fora o que… → `REGISTRO.md` L32659
- **03/11/2026** — A notação em três colunas, e o trecho que não estica a tela → `REGISTRO.md` L32744
- **03/11/2026** — O sinal que faltava, o nome que não se traduz, e o dono da… → `REGISTRO.md` L32812
- **03/11/2026** — A habilitação é da pessoa, a turma fica marcada, e o nível… → `REGISTRO.md` L32891
- **03/11/2026** — A turma é o ritmo, e o ensino é da curadoria → `REGISTRO.md` L32986
- **03/11/2026** — A auditoria da turma, o conteúdo na curadoria, e o… → `REGISTRO.md` L33069
- **03/11/2026** — A curadoria chegou ao plano, e o que a travava era um nome… → `REGISTRO.md` L33165
- **03/11/2026** — A curadoria só oferece o que tem notação, os rótulos… → `REGISTRO.md` L33235
- **03/11/2026** — O dono da música não é compasso → `REGISTRO.md` L33320
- **03/11/2026** — A metodologia é do professor, e não se pergunta duas vezes → `REGISTRO.md` L33382
- **03/11/2026** — A sequência acompanha os objetivos, e a pergunta era a certa → `REGISTRO.md` L33467
- **03/11/2026** — O PDF do ciclo compila outra vez: dois glifos do alfabeto… → `REGISTRO.md` L33904
- **03/11/2026** — O elo em `historico/` não é documento do acervo, e a… → `REGISTRO.md` L33984
- **03/11/2026** — A estante mostra um por documento: a proveniência fica… → `REGISTRO.md` L34034
- **04/11/2026** — A fatia de tempo vem do plano pela coluna certa, e o guia… → `REGISTRO.md` L34115
- **04/11/2026** — O ajuste do plano de ensino arrasta o PO, e o cartão da… → `REGISTRO.md` L34204
- **04/11/2026** — Dois «Guardar» no mesmo minuto não perdem mais um documento → `REGISTRO.md` L34301
- **04/11/2026** — A fusão das edições (decisão 84) e o espelho da verdade na… → `REGISTRO.md` L34387
- **04/11/2026** — O cartão da aula é três dados do professor, e o guia são… → `REGISTRO.md` L34474
- **04/11/2026** — As colunas da aula têm a largura do que levam dentro, e a… → `REGISTRO.md` L34571
- **04/11/2026** — O composto deixou de enumerar verbos, a modalidade deixou… → `REGISTRO.md` L34647
- **04/11/2026** — O PO passa a ter três eixos, o corpo vem da anamnese, e o… → `REGISTRO.md` L34748
- **04/11/2026** — O cabeçalho do ato cabe no telefone, as três asserções de… → `REGISTRO.md` L34850
- **04/11/2026** — O ciclo apaga-se de trás para a frente, a sequência é… → `REGISTRO.md` L34939
- **05/11/2026** — A secção do corpo nasceu fora do `</section>`, e sessenta e… → `REGISTRO.md` L35967
- **05/11/2026** — O elenco muda na linha de base, a cascata desce até ao PO,… → `REGISTRO.md` L36054
- **05/11/2026** — O «Ler as anamneses» acende, e a folha de impressão deixa… → `REGISTRO.md` L36123
- **05/11/2026** — A tira grava, o «Ler» grava, o excluir fecha o formulário —… → `REGISTRO.md` L36180
- **05/11/2026** — O passo 5 sem turma diz o que falta, a curadoria deixa de… → `REGISTRO.md` L36243
- **05/11/2026** — A linha de base lia 30 dos 49 nós, e a Curadoria prometia o… → `REGISTRO.md` L36350
- **05/11/2026** — «O que já é bom» ficava vazio porque o apoio da observação… → `REGISTRO.md` L36452
- **05/11/2026** — «O que já é bom» passa a ser o que ALGUMA aluna tem de bom,… → `REGISTRO.md` L36519
- **05/11/2026** — O índice do recorte: o que os professores olham no corpo, e… → `REGISTRO.md` L36578
- **05/11/2026** — O cabeçalho que faltava: uma lista de `User-Agent`, e um… → `REGISTRO.md` L37035
- **06/11/2026** — O índice não é recorte: o ficheiro da casa entrou como dado… → `REGISTRO.md` L37142
- **06/11/2026** — O ciclo do Plano de Observação deixa de se escrever → `REGISTRO.md` L37177
- **06/11/2026** — O Plano de Observação enxuga: sete nós saem, e o recorte do… → `REGISTRO.md` L37266
- **06/11/2026** — O ciclo do PO também não se escreve NA ÁREA DO PROFESSOR (e… → `REGISTRO.md` L37373
- **07/11/2026** — O expurgo da última escola derrubava o job: «nada a fazer»… → `REGISTRO.md` L38914
- **07/11/2026** — O repositório limpo para o novo ciclo de testes: três… → `REGISTRO.md` L38967
- **07/11/2026** — O `ciclo-01.conf` que sobreviveu ao expurgo, e o dono que a… → `REGISTRO.md` L39032
- **07/11/2026** — A declaração da captura mudou de casa, e o molde deixou de… → `REGISTRO.md` L39090
- **07/11/2026** — A sala diz o que é dela, e o elenco deixa de esperar por… → `REGISTRO.md` L39158
- **07/11/2026** — A proveniência é auditada antes do expurgo — e o elo guarda… → `REGISTRO.md` L39237
- **07/11/2026** — O passo 2 do Elenco diz o que falta, e leva lá → `REGISTRO.md` L39333
- **07/11/2026** — «Elenco» passa a «Audição» e «Verbetes da notação» a… → `REGISTRO.md` L39387
- **07/11/2026** — Os basilares num bloco, o quadro do recorte em acordeão, e… → `REGISTRO.md` L39444
- **07/11/2026** — O cartão do elenco fica com duas caixas: as alunas e o… → `REGISTRO.md` L39517
- **07/11/2026** — O Bloco 10 sai do plano: o corpo mora na Audição e no PO → `REGISTRO.md` L39567
- **07/11/2026** — O expurgo passa a levar o `historico/`, e o vermelho da… → `REGISTRO.md` L39663
- **07/11/2026** — O elenco recém-criado chega à Turma sem F5 → `REGISTRO.md` L39736
- **07/11/2026** — A aluna que entra num elenco existente chega à cadeia:… → `REGISTRO.md` L39808
- **07/11/2026** — A declaração da captura entra no índice (e o workflow deixa… → `REGISTRO.md` L39906
- **07/11/2026** — O elenco é fonte do ciclo, e concluí-lo tem de terminar na… → `REGISTRO.md` L39950
- **07/11/2026** — A âncora de uma aula não tem manifesto próprio: o expurgo… → `REGISTRO.md` L40029
- **08/11/2026** — O plano que já foi ajustado não se oferece duas vezes, e o… → `REGISTRO.md` L40457
- **08/11/2026** — O vínculo da anamnese passa a ler o elenco: a aluna que… → `REGISTRO.md` L40520
- **08/11/2026** — A aluna que sai do elenco sai da aula — e o que ela já… → `REGISTRO.md` L40586
- **08/11/2026** — O «Guardar» do PO cabe nos 50 subpedidos, e a cadeia deixa… → `REGISTRO.md` L40693
- **08/11/2026** — O Worker voltou a falar com a rede: o `fetch` da ponte era… → `REGISTRO.md` L40808
- **08/11/2026** — O fluxo da escola, num só desenho — e as duas portas do… → `REGISTRO.md` L40871
- **08/11/2026** — As duas portas do fluxo da escola: a aluna que muda de… → `REGISTRO.md` L40932
- **08/11/2026** — A aluna desligada, e a turma que muda de sala → `REGISTRO.md` L41005
- **09/11/2026** — A Audição em três abas, e a transferência que não se… → `REGISTRO.md` L41106
- **09/11/2026** — A Audição, segunda passagem: o respiro, o formulário limpo… → `REGISTRO.md` L41204
- **09/11/2026** — A transferência que se perdia no rascunho, e o «Cancelar»… → `REGISTRO.md` L41276
- **09/11/2026** — O «Cancelar» direto, e a derivação que troca o par… → `REGISTRO.md` L41358
- **09/11/2026** — O filete pontilhado da listagem de elencos, e o padrão das… → `REGISTRO.md` L41408
- **09/11/2026** — A cadeia automática: a troca e a saída deixam de ser «via… → `REGISTRO.md` L41458
- **09/11/2026** — A mudança de sala entra na cadeia, e uma sala passa a… → `REGISTRO.md` L41525
- **10/11/2026** — A faixa que ninguém media: 1141 a 1919px → `REGISTRO.md` L41595
- **10/11/2026** — O histórico do ajuste: o rótulo, a diferença e o motivo → `REGISTRO.md` L41668
- **10/11/2026** — O passo 1 do Estilo procura no vocabulário, e um exercício… → `REGISTRO.md` L41744
- **10/11/2026** — A decomposição pela ordem em que foi escrita, e a… → `REGISTRO.md` L41826
- **10/11/2026** — A cadeia que pára no teto continua sozinha, e o «abrir»… → `REGISTRO.md` L41906
- **10/11/2026** — O ajuste que não se perde no elo vencido, e a variante que… → `REGISTRO.md` L42000
- **10/11/2026** — A capacidade cobra-se por volume, e a escada da assinatura… → `REGISTRO.md` L42116
- **11/11/2026** — A Turma chama-se pelo elenco, e o mesmo elenco não ocupa… → `REGISTRO.md` L42212
- **11/11/2026** — O véu que não se via, a listagem que não era a mesma, e o… → `REGISTRO.md` L42276
- **11/11/2026** — A operação atravessa as abas, e o véu deixa ver a página → `REGISTRO.md` L42356
- **11/11/2026** — As três formas do véu, e a página que pode pedir uma… → `REGISTRO.md` L42447
- **11/11/2026** — O véu do produto passa a «o texto na tela, sem caixa» → `REGISTRO.md` L42533
- **12/11/2026** — O elenco que ficaria sem ninguém não existe → `REGISTRO.md` L42599
- **12/11/2026** — A troca de aluna desfaz o passo 3 e o recorte, e a lista… → `REGISTRO.md` L42697
- **12/11/2026** — Um véu para todos os gestos: elenco, leitura, verbete e sala → `REGISTRO.md` L42772
- **12/11/2026** — A sala diz o presente, e os três passos andam → `REGISTRO.md` L42848
- **12/11/2026** — A Turma diz as suas três pontas → `REGISTRO.md` L42911
- **12/11/2026** — «Em turma» vem da Turma, e não do plano → `REGISTRO.md` L43063
- **12/11/2026** — A autoria não se reescreve: o documento que perde a turma… → `REGISTRO.md` L43132
- **12/11/2026** — O agente do Lastro: Llama na Cloudflare, MCP, e o fim do… → `REGISTRO.md` L43238
- **13/11/2026** — A listagem não é a proveniência: uma linha por professor,… → `REGISTRO.md` L43500
- **13/11/2026** — A logomarca sobe para o alto da coluna, e as duas telas… → `REGISTRO.md` L43572
- **13/11/2026** — A lista custa o índice, e não um arquivo por registo → `REGISTRO.md` L43651
- **13/11/2026** — O CSS não gasta pedido do dia, e a lista não paga duas… → `REGISTRO.md` L43727
- **13/11/2026** — O registo de custo da IA ganha mês no nome → `REGISTRO.md` L43829
- **13/11/2026** — O isolamento entre escolas passa a ser provado, e decide-se… → `REGISTRO.md` L43879
- **13/11/2026** — A escola deixa de ser `var` de deploy: o mapa… → `REGISTRO.md` L43930
- **13/11/2026** — O endereço é por host: `<escola>.padd.com.br` → `REGISTRO.md` L44016
- **13/11/2026** — A escola nasce com endereço próprio, e o expurgo leva-o… → `REGISTRO.md` L44060
- **13/11/2026** — O domínio do painel, e a rota curinga que a zona tinha → `REGISTRO.md` L44134
- **13/11/2026** — As senhas de teste entram no ficheiro local, e o push deixa… → `REGISTRO.md` L44192
- **15/11/2026** — Audição: a tira obedece ao «Seguir», e o passo 2 fica vazio → `REGISTRO.md` L44734
- **15/11/2026** — O formulário da anamnese não abria: o `markdown.js` era… → `REGISTRO.md` L44809
- **15/11/2026** — Audição: as abas Recorte e Transferência esperam pelo… → `REGISTRO.md` L44870
- **15/11/2026** — Estilo: os passos do trecho só abrem dentro de um trecho;… → `REGISTRO.md` L44907
- **15/11/2026** — As saídas do pacote deixam de se carimbar: a data sai das… → `REGISTRO.md` L44976
- **15/11/2026** — A etiqueta «PO aguardando» passa a dizer o que falta marcar → `REGISTRO.md` L45040
- **15/11/2026** — O estado do PO lê-se das perguntas obrigatórias, e não do… → `REGISTRO.md` L45105
- **15/11/2026** — O professor desligado não se oferece para um ato → `REGISTRO.md` L45197
- **15/11/2026** — O carimbo do PDF deixa de depender do fuso de quem gera → `REGISTRO.md` L45283
- **15/11/2026** — Quem assume os documentos de quem saiu: a definição da turma → `REGISTRO.md` L45344
- **15/11/2026** — Os gestos 4 a 7 do shard não precisavam do modelo → `REGISTRO.md` L45383
- **15/11/2026** — A chave mestra, o expurgo que a conhece, e o cofre → `REGISTRO.md` L45447
- **15/11/2026** — A publicação do shard: uma árvore partilhada monta-se… → `REGISTRO.md` L45556
- **15/11/2026** — A chave que não abre tem nome → `REGISTRO.md` L45623
- **15/11/2026** — Quatro provas que mediam o desenho de ontem → `REGISTRO.md` L45662
- **15/11/2026** — O shard não é uma escola, e a lista dizia que era → `REGISTRO.md` L45729
- **15/11/2026** — O mapa de escolas não conhecia a escola de shard → `REGISTRO.md` L45780
- **15/11/2026** — As três escolas nasceram dentro do shard, e a bateria passou → `REGISTRO.md` L45883
- **15/11/2026** — O expurgo das três, e a sujeira que era minha → `REGISTRO.md` L45935
- **24/11/2026** — a escola recém-criada volta a dizer que está a ser criada,… → `REGISTRO.md` L45988
- **24/11/2026** — «usar este professor» existia e estava desabilitado → `REGISTRO.md` L46041
- **16/11/2026** — o relógio não mente, a caixa não explica, e a etiqueta… → `REGISTRO.md` L47294
- **16/11/2026** — os dois botões da coluna «Acesso» empilhados, com o ar da… → `REGISTRO.md` L47365
- **16/11/2026** — a escola que nasceu hoje não podia ser apagada nunca → `REGISTRO.md` L47415
- **16/11/2026** — a escola apagada volta a nascer, e o ciclo comercial fecha → `REGISTRO.md` L47487
- **17/11/2026** — O elenco não se perdeu: a leitura falhou, e o ecrã disse… → `REGISTRO.md` L49528
- **17/11/2026** — O ar entre a aba e o bloco que ela abre → `REGISTRO.md` L49605
- **17/11/2026** — A escola como listagem: a proposta, para ela ver antes de… → `REGISTRO.md` L49661
- **17/11/2026** — As bancadas de layout não atravessavam o shard → `REGISTRO.md` L49725
- **17/11/2026** — «A escola» vira listagem: três caixas, o mês a mês noutra… → `REGISTRO.md` L49762
- **17/11/2026** — O «Pagar» só quando se deve, o mês a mês vira tabela… → `REGISTRO.md` L49836
- **17/11/2026** — O plano contratado dito por palavras, o mês a mês dentro da… → `REGISTRO.md` L49909
- **17/11/2026** — A conciliação que faltava no painel: o mesmo mês dos dois… → `REGISTRO.md` L50005
- **17/11/2026** — O login do professor volta a existir, e o ensaio passa a… → `REGISTRO.md` L50067
- **17/11/2026** — O ensaio começa no mês que NÃO está pago, senão não há o… → `REGISTRO.md` L50144
- **18/11/2026** — «O e-mail aparece na ficha e a rota diz que ele não existe» → `REGISTRO.md` L51623
- **18/11/2026** — No professor vinculado, o botão diz «Derivar» (e abre a… → `REGISTRO.md` L51672
- **18/11/2026** — «Pedi a anamnese da aluna C e abriu na aluna A» → `REGISTRO.md` L51706
- **18/11/2026** — «Tá salvando isso aonde?» — a caixa de entrada do Fale… → `REGISTRO.md` L51762
- **18/11/2026** — «Tem mais uma opção que tem que existir: a metodologia… → `REGISTRO.md` L51824
- **18/11/2026** — «O formulário é para enviar direto» — e o canal em todas as… → `REGISTRO.md` L51896
- **18/11/2026** — «Francesa e Cecchetti são coisas diferentes» — a matriz de… → `REGISTRO.md` L51995
- **18/11/2026** — «Se é assim, apaga» — o campo `arquivos` do índice, e o que… → `REGISTRO.md` L52057
- **18/11/2026** — «Eles não são derivar, eles são editar» — e a etiqueta que… → `REGISTRO.md` L52120
- **20/11/2026** — «A gente pode tirar do modal essa parte» — a dose sai, e a… → `REGISTRO.md` L55352
- **20/11/2026** — A caixinha da Produção: a marca e o menu a 10px do canto → `REGISTRO.md` L55405
- **20/11/2026** — «O total é uma soma» — o modal da duração vira formulário,… → `REGISTRO.md` L55452
- **20/11/2026** — «O professor cancela se quiser» — o «Cancelar» do modal faz… → `REGISTRO.md` L55513
- **20/11/2026** — «Houve redução de custo?» — sim, mas é a fusão que a fez, e… → `REGISTRO.md` L55549
- **20/11/2026** — «Recorte» e «Transferência» fecham enquanto há um elenco em… → `REGISTRO.md` L55582
- **20/11/2026** — O «Professor responsável» sai da Audição, e a anamnese leva… → `REGISTRO.md` L55629
- **20/11/2026** — O PDF sai do fluxo: quem imprime é o navegador → `REGISTRO.md` L55683
- **20/11/2026** — O estudo do modal do Estilo, corrigido por ela: é na… → `REGISTRO.md` L56004
- **20/11/2026** — Duas provas apagadas: as que mediam um mundo que já não… → `REGISTRO.md` L56921
- **20/11/2026** — «Curadoria» saiu da tela, e a prova que media uma Turma sem… → `REGISTRO.md` L56965
- **demi-plie · ciclo 01:** aulas escritas em detalhe: 0 de 5 (as demais entram depois da aula anterior).

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
