# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-11-24T21:06:21-0300`
Commit atual: `1c8bf816` — feat(estrutura): a ocupação entra nas rotas — e o modelo que falta nela
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
- **Ciclos com manifesto:** 2 variante(s)
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
1c8bf816 feat(estrutura): a ocupação entra nas rotas — e o modelo que falta nela
b9071ef4 feat(estrutura): a regra da ocupação — sala, professor e elenco — com as quatro decisões dela
dfbaf973 docs(estrutura): o custo por aula é 3 minutos medidos, o contador custa zero, e a regra da sala recusa o que ela pediu
0e2340db feat(estrutura): a analítica do Cloudflare ligada ao painel — os pedidos e as operações de KV por dia
7f834e90 feat(estrutura): os schemas do ciclo passam de cinco commits a um, e a analítica do Cloudflare já está habilitada
c179465f fix(estrutura): a implementação do lote, que o commit anterior não levou
1251dd90 feat(estrutura): o ato passa a custar um commit, e não quatro
e803f8a0 fix(estrutura): o monitoramento deixou de reler o mês a cada abertura
0692e5a0 feat(estrutura): o §7.1 não existe (e aqui não ajudaria), e o aviso do ponto de migração
c1199018 feat(estrutura): a escada aplicada, o simulado das extensões e a política de mora
ad7d1c8a docs(estrutura): escada 130/320/500 com dólar a R$ 6, e a margem não depende do nº de escolas
87fdbdc0 docs(estrutura): o tecto dos 100% é do dono da conta, e a escada pede 139/320/500
36c09bc6 docs(estrutura): a franquia é o teto, a C25 está fechada, e o laço percorre o ciclo
5ef4d5d9 docs(estrutura): a variante dos 30 dias, e a margem que desce a 86,4 %
9bb55975 docs(estrutura): a aula custa 2,12 min, e a margem da escola a 16 h/dia é 93,7 %
7344f1aa feat(experimentos): provas seletivas no commit, e o primeiro portão de pull_request
726a0653 feat(entrega): a minificação do que vai ao browser — 545 KB viram 200
8c5645c3 chore(experimentos): vinte e nove provas apagadas — as que mediam o que já não existe
4b08d9ff feat(estrutura): a página revalida depressa, o asset fica em cache
10f5c242 feat(estrutura): a árvore do repositório pede-se uma vez por commit
```

## Por professor

### bom-bom — 0 ciclo(s)

### brise-volet — 0 ciclo(s)

### colo-de-pe — 0 ciclo(s)

### coqui-de-redinha — 0 ciclo(s)

### dedao-aberto — 0 ciclo(s)

### demi-plie — 1 ciclo(s)

**Ciclo 01** — variante(s): breu, breu-piano

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| breu | (sem PO) | — | — |
| breu | ciclo-01-breu-piano-po.md | Input_PO_Validado | 1 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| breu | ciclo-01-breu.fipp | `e81a3e1cf08c` | (vazio) | — |
| breu-piano | ciclo-01-breu-piano.fipp | `722580618ab1` | (vazio) | Input_PO_Validado |

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

## 25/11/2026 — A sala ganha faixas horárias: N aulas por dia, N modalidades, N professores

**A correcção dela veio antes do código, e a linha errada era a minha.** A tabela dos cenários que
apresentei dizia «mesma sala, mesmo dia, horas que não se tocam → **recusa**». **A regra sempre
permitiu** — o caso está em `provar-a-ocupacao.js` desde o primeiro dia: «O CASO DELA: 14h e 16h na
mesma sala, no mesmo dia → NÃO colidem». O que eu descrevi como recusa era o **modelo**: a Sala
declarava uma hora por dia, e duas turmas no mesmo registo ficavam com a mesma hora. Confundir a regra
com o modelo na mesma linha de tabela custou uma ronda inteira.

**A outra linha, a 10, era a chave do resto.** Eu escrevi «o professor é declarado na curadoria *ou*
na sala, os dois contam». Medido: desde 18/11/2026 a Turma **deriva** o professor e a modalidade **da
Sala** (`bastidores.js:28165`, `faltaNaSalaParaATurma`). Não são duas fontes: é uma, com uma cópia
antiga que pode ter derivado.

**O que a frase dela obrigou, e é mais do que eu tinha proposto.** «A sala do piano […] ali pode
acontecer N aulas durante o dia e de N modalidades, de N professores, com N elencos.» Com o par
(professor, modalidade) na **Sala**, a sala do piano só podia ter **uma** modalidade o dia inteiro.
Logo o par desce para a **faixa** — e o período com ele, senão o termo seguinte na mesma sala obrigava
a duplicar a sala, que é o problema de agora uma dimensão ao lado. Ela confirmou os dois.

**O que ficou feito.** `faixasDaSala` lê a Sala como uma lista de faixas, e uma Sala que ainda declara
o ritmo na raiz — **todas as que existem** — vale como uma faixa só: nenhum registo se toca.
`normalizarFaixas` grava as faixas e `espelharFaixa1NaRaiz` põe a faixa 1 na raiz, para o calendário,
o plano e as provas continuarem a ler o ritmo sem saber que as faixas existem. `faixaEscolhida` diz
qual a Turma ocupa, e recusa-se a adivinhar quando a sala tem mais de uma: escolher a primeira poria a
Turma a ocupar o horário errado em silêncio.

**O buraco do fluxo, medido.** A edição da Sala já corria a cadeia, mas a cadeia relê o ritmo e deriva
o plano — **não conferia a ocupação**. Mudar a hora de uma sala com duas turmas podia criar uma
colisão **em silêncio**, e o conflito só apareceria quando alguém voltasse a mexer numa delas.
`conflitosQueASalaCriaria` compara as turmas entre si com a sala nova, e as duas rotas da sala
recusam com 409 **no gesto**, no ecrã onde ele aconteceu — que é o que ela pediu.

**E as mensagens deixaram de sugerir.** «Mude a hora ou o dia de uma delas» saiu das três frases:
«a gente não vai dar sugestão de como resolver nada. Resolver esses conflitos é papel do usuário e não
nosso.» O facto fica; o caminho é de quem usa. Quatro asserções mediam a sugestão e passaram a medir a
**ausência** dela — inverteram de sentido, e é isso que as torna úteis.

**Três defeitos meus, apanhados pelas provas, e os três da mesma família** — o campo novo que não
chega a quem o lê: (1) a guarda da Turma era chamada com um objecto construído à mão que não levava
`faixa`, e a sala com duas respondia «é preciso dizer qual» a um pedido que já a tinha dito; (2)
`faixas` ficou fora de `CAMPOS_DO_FORMULARIO`, e a **derivação da sala descartava** as faixas que o
formulário mandava — o elo novo nascia com o ritmo velho, sem erro nenhum; (3) o período da faixa
vazia **apagava** o período da raiz no espelho. Nenhum destes aparecia a ler o código: os três
apareceram a correr a rota verdadeira.

**O que falta, e é só um passo.** A **tela**: o botão «+» que cria a segunda faixa na Sala, e o campo
que a escolhe na Turma. O modelo, as rotas e as provas estão fechados — `provar-a-ocupacao` **65**,
`provar-mudanca-de-sala` **58**, suite **185/280 com 0 regressões** —, mas sem os dois botões a
funcionalidade não é alcançável por quem usa, e dizê-lo ao contrário seria vender o que não está feito.

**Onde entrou.** `motor/nucleo/ocupacao.js` (`faixasDaSala`, `faixaEscolhida`, `intervalosDaFaixa`,
`rotuloDaFaixa`, `motivoDaFaixaEmFalta`, e as três mensagens sem sugestão), `motor/servidor/bastidores.js` (`normalizarFaixas`, `espelharFaixa1NaRaiz`, `conflitosQueASalaCriaria`, `faixa` na
curadoria e nas duas rotas da sala, `faixas` em `CAMPOS_DO_FORMULARIO`), `experimentos/provar-a-ocupacao.js` (secção I e as duas da mensagem), `experimentos/provar-mudanca-de-sala.js` (secções G e H), `PLANO-DE-OCUPACAO.md` (§9), `ESTADO-ATUAL.md`, `HANDOFF.md`.

## O que está pendente

## 24/11/2026 — A árvore do repositório pede-se uma vez por COMMIT, e não uma vez por pedido

Não se mediu no ar: o ganho é de bytes por pedido, e a única forma
de o confirmar em produção é o contador de subpedidos do Worker (`orcamentoDe`), que o painel ainda
não expõe por rota. E o `arvore-do-repo/` **não tem expurgo** — quando uma escola é apagada, a
chave continua lá com a árvore de um commit antigo (que não contém dado de aluno, só caminhos). É
lixo que expira por si, e fica declarado em vez de escondido.

## 24/11/2026 — A página revalida-se depressa, o asset fica em cache, e o 404 não se guarda

Não se mediu no ar: a política só vale no próximo deploy do shard,
e a confirmação é `curl -sI` em `breu.padd.com.br/piano/plano` (esperado: `max-age=60`) e em
`…/piano/assets/style.css` (esperado: `max-age=86400`). O **edge** do Cloudflare continua a não
guardar HTML sem uma Cache Rule — isso é configuração de conta, não de código, e não foi tocado.

## 24/11/2026 — Vinte e nove provas apagadas: as que mediam objetos que já não existem

As 95 falhas de asserção continuam sem trïagem — não se sabe
quantas são provas desatualizadas e quantas são defeitos do sistema. É o próximo trabalho da
suite, e agora há uma ferramenta para o fazer (`node tools/correr-provas.js --verboso`).

## 24/11/2026 — A minificação do que vai ao browser: 545 KB → 200 KB, e 143 → 51 KB comprimidos

Não se mediu em produção depois do deploy (`curl` a comparar o
`content-length` de `/piano/plano-observacao/` antes e depois). E as páginas **já geradas nos
pacotes do repositório** (`professores/*/ciclos/ciclo-*/`) continuam com os comentários: elas são

## 24/11/2026 — `correr-provas`, provas seletivas no commit, e o primeiro portão de `pull_request`

O `conferir.yml` **nunca correu** — não há nenhum PR aberto neste
repositório, e um workflow de `pull_request` só se mede com um. A primeira vez que alguém abrir um
PR é a primeira execução. E as **96** continuam sem trïagem: não se sabe quantas são provas
desatualizadas e quantas são defeitos — agora há ferramenta (`--verboso`) e há um número que não
mente.

## Pendências anteriores (índice)

- **18/09/2026** — PO do Ciclo 01 — Duo validado → `REGISTRO-2026.md` L9
- **18/09/2026** — Estrutura por professor (P-13, P-14) e migração do material → `REGISTRO-2026.md` L46
- **18/09/2026** — Publicação do repositório no GitHub (decisão da… → `REGISTRO-2026.md` L83
- **18/09/2026** — Pacotes de ciclo passam a ser versionados (deploy… → `REGISTRO-2026.md` L112
- **18/09/2026** — Ciclo próprio por escola: a Ritmos deixa de ser cópia da Duo → `REGISTRO-2026.md` L145
- **18/09/2026** — Ciclo do Ritmos completado (4 de 8 artefatos) + P-15 a P-19 → `REGISTRO-2026.md` L201
- **18/09/2026** — PO do Ritmos validado + P-22 → `REGISTRO-2026.md` L264
- **18/09/2026** — Publicação, primeira reancoragem da Duo e o caderno da Aula… → `REGISTRO-2026.md` L313
- **19/09/2026** — Congelamento da infraestrutura → `REGISTRO-2026.md` L358
- **19/09/2026** — Criptografia dos acompanhamentos (exceção pós-congelamento) → `REGISTRO-2026.md` L407
- **19/09/2026** — Política de segurança dos dados sensíveis → `REGISTRO-2026.md` L481
- **19/09/2026** — Caderno publicado e incluído no hash → `REGISTRO-2026.md` L515
- **19/09/2026** — Método, README-ciclos e campos de duração → `REGISTRO-2026.md` L552
- **19/09/2026** — README-ciclos: escopos e criação de ciclo → `REGISTRO-2026.md` L594
- **19/09/2026** — Correções cosméticas → `REGISTRO-2026.md` L615
- **19/09/2026** — Varredura de marcas de indecisão → `REGISTRO-2026.md` L647
- **19/09/2026** — METODO no pacote e reorganização do menu → `REGISTRO-2026.md` L691
- **20/09/2026** — O guia de observação passa a se chamar o que ele é → `REGISTRO-2026.md` L748
- **20/09/2026** — O contrato de extração passa a ler tabela → `REGISTRO-2026.md` L790
- **20/09/2026** — O índice da página sai do topo e vai para a direita, preso → `REGISTRO-2026.md` L847
- **20/09/2026** — O contrato de extração vira lib (definição única) → `REGISTRO-2026.md` L890
- **20/09/2026** — O contrato ganha as duas declarações (mapa de colunas e… → `REGISTRO-2026.md` L932
- **20/09/2026** — O extrator do plano (o irmão), e o diff classificado → `REGISTRO-2026.md` L976
- **20/09/2026** — O laço de validação vira lib (a segunda definição única) → `REGISTRO-2026.md` L1039
- **20/09/2026** — O pre-commit passa a validar o PLANO (schema + tipos) → `REGISTRO-2026.md` L1081
- **20/09/2026** — O experimento passa a consumir o extrator (o ciclo fecha) → `REGISTRO-2026.md` L1127
- **20/09/2026** — O fenômeno do PO é uma LISTA (o schema declarava string) → `REGISTRO-2026.md` L1167
- **20/09/2026** — O escopo `experimentos` entra na lista do commit-msg → `REGISTRO-2026.md` L1208
- **20/09/2026** — A tabela de escopos do REGRAS.md passa a listar os 27 do… → `REGISTRO-2026.md` L1244
- **20/09/2026** — Peça 1: o JSON de dados do Duo entra como fonte → `REGISTRO-2026.md` L1275
- **20/09/2026** — Peça 2: os builders das vistas saem para uma lib → `REGISTRO-2026.md` L1320
- **20/09/2026** — O gerador passa a GERAR a vista (peça 3 da migração) → `REGISTRO-2026.md` L1370
- **20/09/2026** — O guia gerado passa a emitir a data da aula → `REGISTRO-2026.md` L1424
- **20/09/2026** — A linha de base renderiza o texto como veio (nada de… → `REGISTRO-2026.md` L1471
- **20/09/2026** — O guia do Ritmos passa a ser gerado (peça 5) — e o render… → `REGISTRO-2026.md` L1514
- **20/09/2026** — O `pre-push` passa a existir — e a conferência do… → `REGISTRO-2026.md` L1575
- **20/09/2026** — O gerador grava os JSONs do formulário no pacote (Fase 2.1) → `REGISTRO-2026.md` L1616
- **20/09/2026** — O JSON de dados vai para o pacote cifrado (Fase 2.2) → `REGISTRO-2026.md` L1697
- **20/09/2026** — O formulário de lançamento vai para produção (Área do… → `REGISTRO-2026.md` L1754
- **20/09/2026** — A folha de captura vira config legível por máquina… → `REGISTRO-2026.md` L1990
- **22/09/2026** — Agentes de workspace: geração, auditoria e apresentação → `REGISTRO-2026.md` L2303
- **23/09/2026** — A identidade do projeto entra na documentação (e a ressalva… → `REGISTRO-2026.md` L2355
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO-2026.md` L2436
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO-2026.md` L2517
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO-2026.md` L2608
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO-2026.md` L2676
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o plano… → `REGISTRO-2026.md` L2751
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que era… → `REGISTRO-2026.md` L2862
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO-2026.md` L3062
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO-2026.md` L3193
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO-2026.md` L3367
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO-2026.md` L3488
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO-2026.md` L3641
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO-2026.md` L3790
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO-2026.md` L3990
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO-2026.md` L4224
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO-2026.md` L4417
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO-2026.md` L4684
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO-2026.md` L4886
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por aula… → `REGISTRO-2026.md` L5167
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO-2026.md` L5327
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO-2026.md` L5481
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas deixam… → `REGISTRO-2026.md` L5670
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única página… → `REGISTRO-2026.md` L5872
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO-2026.md` L5985 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO-2026.md` L6177
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO-2026.md` L6335
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO-2026.md` L6499
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação passa… → `REGISTRO-2026.md` L6634
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO-2026.md` L6754
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO-2026.md` L6870
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO-2026.md` L7208
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só o… → `REGISTRO-2026.md` L7309
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO-2026.md` L7435 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO-2026.md` L7556 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO-2026.md` L7681 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO-2026.md` L7829
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO-2026.md` L7956
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO-2026.md` L8026 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO-2026.md` L8104
- **30/09/2026** — O segundo papel do agente: o servidor local **não existe**;… → `REGISTRO-2026.md` L8193
- **01/10/2026** — A grafia de "Elicitação" se propaga, e a pendência do… → `REGISTRO-2026.md` L8280
- **01/10/2026** — A view gerada e a regra de leitura cresciam com o arquivo:… → `REGISTRO-2026.md` L8421
- **02/10/2026** — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev… → `REGISTRO-2026.md` L8542
- **02/10/2026** — A escola passa a poder ser desabilitada, com motivo e data → `REGISTRO-2026.md` L8656
- **07/10/2026** — O cofre dos lançamentos sai do Netlify e entra no… → `REGISTRO-2026.md` L8773
- **07/10/2026** — O Netlify antigo é destruído, o mapa anda para o slide 83 e… → `REGISTRO-2026.md` L8925
- **07/10/2026** — O prompt de elicitação herda oito decisões do formulário do… → `REGISTRO-2026.md` L9053
- **09/10/2026** — A criação de escola vira um comando: o CLI de scaffolding,… → `REGISTRO-2026.md` L9293
- **09/10/2026** — A porta passa a elicitar o PLANO, e o ciclo do zero passa a… → `REGISTRO-2026.md` L9345
- **10/10/2026** — O menu separa a Anamnese do Plano de Observação, e a… → `REGISTRO-2026.md` L9398
- **11/10/2026** — «Nós, Por Exemplo» vira a página de entrada; o «Início» e a… → `REGISTRO-2026.md` L9451
- **11/10/2026** — Atalhos da porta na página de entrada e aprofundamento do… → `REGISTRO-2026.md` L9520
- **11/10/2026** — URLs próprias para a Anamnese e o Plano de Observação → `REGISTRO-2026.md` L9574
- **11/10/2026** — As sete mudanças de comportamento e a proveniência… → `REGISTRO-2026.md` L9616
- **11/10/2026** — Ordem alfabética nos menus e rótulo da harmonização → `REGISTRO-2026.md` L9692
- **12/10/2026** — O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica… → `REGISTRO-2026.md` L9741
- **12/10/2026** — O plano de ensino vira rota própria e o PO passa a puxar os… → `REGISTRO-2026.md` L9798
- **12/10/2026** — O plano de ensino ganha estante, edição em sítio e… → `REGISTRO-2026.md` L9857
- **12/10/2026** — A arquitetura geral ganha documento próprio (arquivo, não… → `REGISTRO-2026.md` L9900
- **12/10/2026** — O botão «Criar nova escola» alinha o menu da Área do… → `REGISTRO-2026.md` L9934
- **12/10/2026** — O CLI «criar-escola» alinha o menu zero ao plano de ensino → `REGISTRO-2026.md` L9966
- **12/10/2026** — A página de entrada ganha o «Plano de ensino» → `REGISTRO-2026.md` L10004
- **12/10/2026** — A raiz nunca é desabilitada pelo freio de escola → `REGISTRO-2026.md` L10058
- **12/10/2026** — O rodapé do ciclo zero lista os três itens da Área do… → `REGISTRO-2026.md` L10096
- **12/10/2026** — A folha de captura ganha rótulo curto e transposição → `REGISTRO-2026.md` L10133
- **12/10/2026** — A senha de criptografia da Maria nasce mockada e chega ao CI → `REGISTRO-2026.md` L10179
- **12/10/2026** — O PO referencia o plano por id e para de duplicar o… → `REGISTRO-2026.md` L10213
- **12/10/2026** — O Diaghilev sai por expurgo DIRETO, e a trava de identidade… → `REGISTRO-2026.md` L10262
- **12/10/2026** — O hook de expurgo nasce e passa o teste no Diaghilev II → `REGISTRO-2026.md` L10350
- **12/10/2026** — O criar-escola.sh passa a gerar o índice da escola (fecha a… → `REGISTRO-2026.md` L10415
- **12/10/2026** — O expurgo ganha a reconciliação worker×slug e o hook… → `REGISTRO-2026.md` L10464
- **12/10/2026** — A senha de criptografia deixa de ser manual: nasce REAL no… → `REGISTRO-2026.md` L10519
- **12/10/2026** — A senha de criptografia nasce no Cloudflare (caminho a): o… → `REGISTRO-2026.md` L10572
- **12/10/2026** — A página «Criar nova escola» passa a subir o motor completo… → `REGISTRO-2026.md` L10640
- **12/10/2026** — O formulário vira mínimo e o Bastidores vira grupo (Estúdio… → `REGISTRO-2026.md` L10703
- **13/10/2026** — A contaminação entre escolas (o envelope sem escola) é… → `REGISTRO-2026.md` L10767
- **13/10/2026** — O hook deixa o ciclo-zero (scaffold de escola) passar → `REGISTRO-2026.md` L10850
- **13/10/2026** — A Produção exclui aluna e professor (o gabinete se mantém… → `REGISTRO-2026.md` L10881
- **13/10/2026** — O professor é o dono, a Produção pede senha e o professor… → `REGISTRO-2026.md` L10905
- **13/10/2026** — Bloco 2: o nó 50 não semeia, e «não foi medido» entra… → `REGISTRO-2026.md` L10945
- **13/10/2026** — «Não foi medido» chega aos basilares e às cinco posições;… → `REGISTRO-2026.md` L10975
- **13/10/2026** — A categoria etária é re-derivada da idade; a memória é por… → `REGISTRO-2026.md` L11010
- **13/10/2026** — A senha é por professor, e a categoria etária re-deriva ao… → `REGISTRO-2026.md` L11038
- **13/10/2026** — Cadastro de turmas e vocabulário técnico do balé (com… → `REGISTRO-2026.md` L11077
- **13/10/2026** — Norma revisada: o Bastidores cria e declara (caso a caso);… → `REGISTRO-2026.md` L11125
- **13/10/2026** — A base canónica do catálogo migra para… → `REGISTRO-2026.md` L11163
- **13/10/2026** — A curadoria nasce: a escola atribui a cada professor o que… → `REGISTRO-2026.md` L11196
- **13/10/2026** — Metodologia e notação chegam ao PO (ligar L5 — Bloco 8.2) → `REGISTRO-2026.md` L11229
- **13/10/2026** — A tela consome a curadoria: plano/PO travam sem curadoria e… → `REGISTRO-2026.md` L11256
- **13/10/2026** — Bastidores quebrou: a página da Produção referia `env` fora… → `REGISTRO-2026.md` L11294
- **13/10/2026** — A grelha das tabelas: a rubrica, as turmas em plural, o… → `REGISTRO-2026.md` L11317
- **13/10/2026** — A rubrica: o conteúdo alinha-se à decisão (Bloco 10,… → `REGISTRO-2026.md` L11421
- **13/10/2026** — A grelha não chegava à porta: duas listas brancas engoliam… → `REGISTRO-2026.md` L11460
- **14/10/2026** — A régua da turma mede o critério no LANÇAMENTO (frente B9) → `REGISTRO-2026.md` L11500
- **14/10/2026** — O PO completo chega inteiro aos derivados (frente B10) → `REGISTRO-2026.md` L11589
- **14/10/2026** — O plano completo chega inteiro aos derivados (frente B11) → `REGISTRO-2026.md` L11690
- **15/10/2026** — O Sistema Lastro: o nome comercial, e o mapa de evolução do… → `REGISTRO-2026.md` L11829
- **15/10/2026** — A dimensão observada deriva do PLANO (e o vocabulário do PO… → `REGISTRO-2026.md` L12160
- **15/10/2026** — A cifra do Worker respeita o teto do runtime, e a falha… → `REGISTRO-2026.md` L12278
- **15/10/2026** — A geração publica: o deploy entra na cadeia → `REGISTRO-2026.md` L12378
- **15/10/2026** — O guarda do pre-push passa a conferir a última linha do… → `REGISTRO-2026.md` L12442
- **15/10/2026** — A criação da escola diz onde guardar a senha de criptografia → `REGISTRO-2026.md` L12502
- **15/10/2026** — O prefixo do nome separa a chave da cifra da senha de acesso → `REGISTRO-2026.md` L12571
- **15/10/2026** — O arquivo de senhas vira um espelho por escola → `REGISTRO-2026.md` L12644
- **15/10/2026** — A chave de cifra vira interna do Worker: ninguém a vê,… → `REGISTRO-2026.md` L12724
- **15/10/2026** — O lançamento da aula confere a senha e grava cifrado no… → `REGISTRO-2026.md` L12837
- **15/10/2026** — O expurgo da escola sai do comando e vira botão, na raiz → `REGISTRO-2026.md` L12919
- **15/10/2026** — O expurgo apagava a escola e deixava o cadastro das alunas… → `REGISTRO-2026.md` L13026
- **15/10/2026** — `Buffer` não existe no runtime dos Workers: o expurgo não… → `REGISTRO-2026.md` L13135
- **15/10/2026** — O gerador do HANDOFF quebrava com o repositório sem escola → `REGISTRO-2026.md` L13242
- **15/10/2026** — O expurgo apagou o MODELO: a escola `ponta` não pôde nascer → `REGISTRO-2026.md` L13278
- **15/10/2026** — Criar escola para o professor do MODELO: o `cp` recusava o… → `REGISTRO-2026.md` L13339
- **15/10/2026** — Um conserto commitado e não publicado não conserta nada → `REGISTRO-2026.md` L13392
- **15/10/2026** — O professor homônimo: o identificador é o slug, e o… → `REGISTRO-2026.md` L13435
- **15/10/2026** — O molde sai de `professores/`: molde não é professor → `REGISTRO-2026.md` L13517
- **16/10/2026** — «Nós, Por Exemplo» sai: a página é a apresentação, e o nome… → `REGISTRO-2026.md` L13595
- **16/10/2026** — A identidade visual tem seis famílias em estudo, e o… → `REGISTRO-2026.md` L13665
- **16/10/2026** — A tela diz de quem é a ficha, e o obrigatório se anuncia → `REGISTRO-2026.md` L13768
- **16/10/2026** — A senha autoriza o ATO, não a SESSÃO → `REGISTRO-2026.md` L13873
- **16/10/2026** — A data da ficha é a da última mudança — e a edição do plano… → `REGISTRO-2026.md` L13996
- **16/10/2026** — O carimbo é a hora da escola, não a do servidor → `REGISTRO-2026.md` L14115
- **16/10/2026** — A estante pagina de seis em seis, o roteiro é só da… → `REGISTRO-2026.md` L14205
- **16/10/2026** — A sequência de exercícios chega ao `plano-XX.json` (e o… → `REGISTRO-2026.md` L14321
- **16/10/2026** — O ciclo passa a ser DA TURMA (fase 1: a identidade da fonte) → `REGISTRO-2026.md` L14445
- **16/10/2026** — A hora de início é do DIA da semana (e a turma passa a… → `REGISTRO-2026.md` L14507
- **16/10/2026** — A turma deriva: o «editar» passa a ser um elo novo, com… → `REGISTRO-2026.md` L14564
- **16/10/2026** — A curadoria é de UMA turma (e edita-se ou deriva-se como a… → `REGISTRO-2026.md` L14701
- **16/10/2026** — A identidade visual fecha o circuito: raiz, porta,… → `REGISTRO-2026.md` L14770
- **16/10/2026** — A curadoria é de UMA turma — e o id passa a dizê-lo → `REGISTRO-2026.md` L14863
- **16/10/2026** — A camada de componentes: o desenho deixa de ser reescrito… → `REGISTRO-2026.md` L14929
- **17/10/2026** — Os papéis e a variante noturna: a identidade passa a ter… → `REGISTRO-2026.md` L14999
- **17/10/2026** — A aparência ganha prova própria — e o botão que sumiria no… → `REGISTRO-2026.md` L15074
- **17/10/2026** — A escola nasceu sem o botão da aparência: a barra tinha uma… → `REGISTRO-2026.md` L15327
- **17/10/2026** — A lista de turmas deixa de ficar acavalada no celular → `REGISTRO-2026.md` L15395
- **17/10/2026** — Os commits estavam certos e a produção estava velha: as… → `REGISTRO-2026.md` L15700
- **17/10/2026** — O botão que parecia quebrado, o campo colado no botão e o… → `REGISTRO-2026.md` L15754
- **17/10/2026** — As sete listas da Produção passam a folhear (o botão que… → `REGISTRO-2026.md` L15850
- **18/10/2026** — A escola não é campo: o cabeçalho do ato separa o que se… → `REGISTRO-2026.md` L15936
- **18/10/2026** — O nome da escola estava no JSON e vinha do cliente: o… → `REGISTRO-2026.md` L15998
- **18/10/2026** — a S5 entra em produção, e os três passos ganham os botões… → `REGISTRO-2026.md` L16404
- **18/10/2026** — o «Seções» vira botão, e a página começa na secção → `REGISTRO-2026.md` L16465
- **18/10/2026** — a proveniência sai da curadoria e vale para tudo; o menu… → `REGISTRO-2026.md` L16505
- **18/10/2026** — os três passos fecham as travas, e o «Editar» da turma abre… → `REGISTRO-2026.md` L16556
- **18/10/2026** — o vocabulário escolhe em lista, e cada nome diz as suas… → `REGISTRO-2026.md` L16617
- **18/10/2026** — o cancelar chega à curadoria, a turma perde dois campos, e… → `REGISTRO-2026.md` L16672
- **18/10/2026** — o formulário recolhe para uma faixa, e a listagem ocupa a… → `REGISTRO-2026.md` L16727
- **18/10/2026** — o nome do professor na curadoria abre o plano de ensino dele → `REGISTRO-2026.md` L16774
- **18/10/2026** — a faixa dos passos numa linha só, com a seta no fim → `REGISTRO-2026.md` L16812
- **18/10/2026** — a etiqueta é uma só, e o que está no ar é o motor → `REGISTRO-2026.md` L16855
- **18/10/2026** — a dobra do índice da página, no celular → `REGISTRO-2026.md` L16932
- **18/10/2026** — a C15 foi decidida: a preferência de aparência é da escola → `REGISTRO-2026.md` L17084
- **18/10/2026** — A aparência passou a ser da escola, e o servidor aplica-a → `REGISTRO-2026.md` L17150
- **18/10/2026** — O catálogo das peças: um nome antes do desenho → `REGISTRO-2026.md` L17239
- **18/10/2026** — A segunda família: a Cortina Turquesa, medida antes de… → `REGISTRO-2026.md` L17329
- **18/10/2026** — O cabeçalho do ato cresce, e o «Fechar» deixa de descontar → `REGISTRO-2026.md` L17418
- **18/10/2026** — O cabeçalho do ato cabe em 360px, e a barra de botões vira… → `REGISTRO-2026.md` L17491
- **18/10/2026** — Correção: o resumo da faixa desce, e a lista não mente… → `REGISTRO-2026.md` L17586
- **18/10/2026** — Regra: medir na bancada, e o ar só na conferência final → `REGISTRO-2026.md` L17652
- **18/10/2026** — O catálogo de paletas fecha em três: a Verde de Ensaio… → `REGISTRO-2026.md` L17709
- **18/10/2026** — A família da escola chega a tudo o que ela serve, e a lista… → `REGISTRO-2026.md` L17792
- **18/10/2026** — As outras quatro secções recolhem, e a listagem fica com a… → `REGISTRO-2026.md` L17867
- **18/10/2026** — A marca entra na barra e o favicon existe: a cor vem do… → `REGISTRO-2026.md` L17947
- **18/10/2026** — O gerador diz o que falta: a guarda do DOCS, o… → `REGISTRO-2026.md` L18099
- **18/10/2026** — Por que o CI não ficava verde: o plano nunca preenchia o… → `REGISTRO-2026.md` L18168
- **18/10/2026** — O token vive em quatro lugares, e só um foi trocado → `REGISTRO-2026.md` L18238
- **19/10/2026** — A turma manda no ritmo: o `.conf` da variante passa a ser… → `REGISTRO-2026.md` L18284
- **19/10/2026** — O expurgo não mente: «sobraram 1» era a listagem a chegar… → `REGISTRO-2026.md` L18393
- **19/10/2026** — A geração deixa de ser muda: a tela passa a dizer o que… → `REGISTRO-2026.md` L18448
- **19/10/2026** — As escolas de teste passam a ter nome de palavra: Calango,… → `REGISTRO-2026.md` L18526
- **19/10/2026** — O repertório é da turma: sai do formulário da curadoria → `REGISTRO-2026.md` L18567
- **19/10/2026** — O expurgo errou para os dois lados: a leitura passa a ser a… → `REGISTRO-2026.md` L18621
- **19/10/2026** — O disparo manda dois slugs: o conteúdo é da variante, o… → `REGISTRO-2026.md` L18689
- **19/10/2026** — O `.fipp` não se escolhe: em conflito, regera-se → `REGISTRO-2026.md` L18757
- **19/10/2026** — Sem escola no repositório, o `Reancorar` não falha → `REGISTRO-2026.md` L18806
- **19/10/2026** — O `criar-escola` também perde a corrida do `push` → `REGISTRO-2026.md` L18843
- **19/10/2026** — A correcção da âncora ficou num workflow só — e o commit… → `REGISTRO-2026.md` L18894
- **19/10/2026** — A lista que falhava sem dizer porquê: `kv.list` tem cota, e… → `REGISTRO-2026.md` L18952
- **19/10/2026** — Todo pacote gerado nascia divergente da porta: a barra e a… → `REGISTRO-2026.md` L19004
- **20/10/2026** — O PO abre sem plano e com o checklist em branco: a lista… → `REGISTRO-2026.md` L19047
- **20/10/2026** — O expurgo apagou a escola e deixou o dado: a limpeza do KV… → `REGISTRO-2026.md` L19130
- **20/10/2026** — A cota do KV: o que ia para lá sem precisar, medido → `REGISTRO-2026.md` L19213
- **20/10/2026** — A anamnese nunca ia para o Git: ela vivia só no KV → `REGISTRO-2026.md` L19277
- **20/10/2026** — a lista não paga o que não mostra (fase 2 da dependência do… → `REGISTRO-2026.md` L19360
- **20/10/2026** — o envelope sai do KV: o acervo passa a ser o armazenamento… → `REGISTRO-2026.md` L19434
- **20/10/2026** — o índice do acervo: cada pergunta deixa de ser uma… → `REGISTRO-2026.md` L19522
- **20/10/2026** — dois `list` a menos: o cartão da geração e o cadastro no… → `REGISTRO-2026.md` L19604
- **20/10/2026** — o índice diz o mesmo nos dois níveis, e a âncora tem três… → `REGISTRO-2026.md` L19666
- **20/10/2026** — a tela mostra o endereço que existe, e diz que o cofre é… → `REGISTRO-2026.md` L19703
- **20/10/2026** — as declarações do índice: o vocabulário deixa de estar… → `REGISTRO-2026.md` L19742
- **20/10/2026** — a anamnese sai do KV, e o cofre deixa de existir → `REGISTRO-2026.md` L19802
- **20/10/2026** — o plano de ensino de teste chega preenchido inteiro, não… → `REGISTRO-2026.md` L19843
- **20/10/2026** — o índice passa a ser gerado, e o «passou» passa a ser medido → `REGISTRO-2026.md` L19895
- **20/10/2026** — a âncora da aula deixa de ficar solta, e o rebase diz a… → `REGISTRO-2026.md` L20026
- **20/10/2026** — o Worker da escola passa a servir o pacote da TURMA, não o… → `REGISTRO-2026.md` L20077
- **20/10/2026** — o expurgo da `breu` foi completo, e o índice ficou a… → `REGISTRO-2026.md` L20112
- **20/10/2026** — o PO da `batata` não gerava o ciclo: a declaração da… → `REGISTRO-2026.md` L20203
- **20/10/2026** — a aula derivada volta a ser legível: o mapa de secções e a… → `REGISTRO-2026.md` L20262
- **20/10/2026** — o primeiro pacote no repositório expôs o vocabulário do… → `REGISTRO-2026.md` L20318
- **20/10/2026** — o Plano de Observação de uma turma oferecia as alunas das… → `REGISTRO-2026.md` L20374
- **20/10/2026** — a escola publica um ÍNDICE DE TURMAS, e o menu deixa de… → `REGISTRO-2026.md` L20444
- **20/10/2026** — o hook recusava todo commit enquanto uma turma não tivesse… → `REGISTRO-2026.md` L20520
- **20/10/2026** — a escola não se criava: a publicação era montada só no ramo… → `REGISTRO-2026.md` L20580
- **20/10/2026** — o repositório sem ciclo expôs duas provas desactualizadas → `REGISTRO-2026.md` L20640
- **20/10/2026** — o filtro dos sujeitos continuava sem funcionar: a chave… → `REGISTRO-2026.md` L20670
- **20/10/2026** — clicar na logo leva à raiz do domínio → `REGISTRO-2026.md` L20740
- **20/10/2026** — o ciclo é gerado e o menu não o mostra: a barra passa a ser… → `REGISTRO-2026.md` L20813
- **20/10/2026** — a barra de navegação deixa de ser escrita e passa a ser… → `REGISTRO-2026.md` L20882
- **20/10/2026** — o registro de notação passa a compor-se: o alfabeto é dado,… → `REGISTRO-2026.md` L20979
- **20/10/2026** — o lançamento pedia uma senha cujo campo estava escondido → `REGISTRO-2026.md` L21087
- **20/10/2026** — duas bancadas para ESCOLHER o título e a paginação — e três… → `REGISTRO-2026.md` L21155
- **21/10/2026** — as propostas de layout foram refeitas: eram inoperáveis, e… → `REGISTRO-2026.md` L21253
- **21/10/2026** — o título que fica e a barra do lançamento no celular: as… → `REGISTRO-2026.md` L21325
- **21/10/2026** — a página de harmonização saía sem título: a fonte não abria… → `REGISTRO-2026.md` L21406
- **21/10/2026** — iPhone: o menu que não cabia e a rolagem que tremia → `REGISTRO-2026.md` L21481
- **21/10/2026** — a correção do iPhone foi longe demais: revertida, e o… → `REGISTRO-2026.md` L21553
- **21/10/2026** — a batata foi expurgada; as provas deixaram de nomear escolas → `REGISTRO-2026.md` L21627
- **21/10/2026** — o remoto primeiro: uma regra para não repetir o diagnóstico… → `REGISTRO-2026.md` L21678
- **22/10/2026** — O manifesto base deixa de ser obrigatório (ferramentas… → `REGISTRO-2026.md` L21720
- **22/10/2026** — A variante passa a ser um manifesto inteiro, e o `.conf` da… → `REGISTRO-2026.md` L21759
- **22/10/2026** — O professor que não criou a escola não fica sem validação → `REGISTRO-2026.md` L21814
- **22/10/2026** — A prova que nomeava a `valse` (a segunda vez) → `REGISTRO-2026.md` L21865
- **22/10/2026** — O expurgo pela página não regera os índices derivados → `REGISTRO-2026.md` L21887
- **22/10/2026** — A criação de escola passa a levar os índices derivados → `REGISTRO-2026.md` L21915
- **22/10/2026** — O cenário «a escola de um, a turma no plano de outro»,… → `REGISTRO-2026.md` L21944
- **22/10/2026** — O `deploy-escolas.yml` não publicava escola nenhuma, e nada… → `REGISTRO-2026.md` L21988
- **22/10/2026** — O TeX saía inteiro a cada execução, e o deploy subia por… → `REGISTRO-2026.md` L22044
- **22/10/2026** — Dois POs para um plano: a linha de base é uma só, e o… → `REGISTRO-2026.md` L22849
- **22/10/2026** — O terceiro laço de rebase, e os treze conflitos que eram só… → `REGISTRO-2026.md` L22972
- **22/10/2026** — O PO de um professor não vê o plano nem as alunas de outro → `REGISTRO-2026.md` L23000
- **22/10/2026** — A escola recriada pertence a quem a recriou → `REGISTRO-2026.md` L23064
- **23/10/2026** — O job do índice reescrevia o commit do vizinho, e o push… → `REGISTRO-2026.md` L23126
- **23/10/2026** — O menu deixa de contar documentos: doze destinos, e a lista… → `REGISTRO-2026.md` L23184
- **23/10/2026** — A escolha de turma antes do formulário, e a harmonização… → `REGISTRO-2026.md` L23279
- **23/10/2026** — A curadoria não se atribui incompleta: cinco campos, e a… → `REGISTRO-2026.md` L23396
- **23/10/2026** — A lista de alunas da anamnese não se contorna: a curadoria… → `REGISTRO-2026.md` L23458
- **23/10/2026** — A barra diz de onde se veio; o «true» sai do endereço; e os… → `REGISTRO-2026.md` L23582
- **23/10/2026** — O Bastidores chega à folha do celular, e o título deixa de… → `REGISTRO-2026.md` L23690
- **23/10/2026** — O ☰ dentro da Produção abre o menu do sistema inteiro → `REGISTRO-2026.md` L23768
- **24/10/2026** — O padrão da lista: as oito listas com o mesmo gesto, e o… → `REGISTRO-2026.md` L23886
- **26/10/2026** — O documento acende a lista de onde veio, e a norma de «onde… → `REGISTRO-2026.md` L25146
- **26/10/2026** — Referências deixa de ser um item do menu, e passa a ser um… → `REGISTRO-2026.md` L25245
- **26/10/2026** — O menu da Produção não rola com a página: era o `sticky`… → `REGISTRO-2026.md` L25330
- **26/10/2026** — O menu da Produção fica congelado: `sticky` não serve, e a… → `REGISTRO-2026.md` L25383
- **26/10/2026** — O botão que grava não encosta no campo: a fileira do… → `REGISTRO-2026.md` L25436
- **26/10/2026** — A porta não se abre por um endereço sem ato, e o índice… → `REGISTRO-2026.md` L25529
- **26/10/2026** — O plano publica o apanhado, e o detalhe fica na aula → `REGISTRO-2026.md` L25669
- **26/10/2026** — O objetivo é do ciclo, a estrutura é da aula, e a régua é… → `REGISTRO-2026.md` L25827
- **26/10/2026** — O formulário passa a perguntar em que aula cada objetivo é… → `REGISTRO-2026.md` L25980
- **26/10/2026** — O parâmetro de medição passa a mandar na matriz, e o dado… → `REGISTRO-2026.md` L26069
- **26/10/2026** — O que não se pergunta sai do roteiro, e aparece no cabeçalho → `REGISTRO-2026.md` L26143
- **26/10/2026** — A fronteira do cabeçalho fecha: o nó que só se lê mostra o… → `REGISTRO-2026.md` L26198
- **26/10/2026** — A anamnese é da aluna, e a marca «nova» sai quando ela já… → `REGISTRO-2026.md` L26241
- **27/10/2026** — O expurgo é um estado, e o sistema passou a lê-lo → `REGISTRO-2026.md` L26348
- **27/10/2026** — O expurgo da `breu` aconteceu, e as duas metades conversaram → `REGISTRO-2026.md` L26444
- **27/10/2026** — A escola recriada diz o presente, e o passado passa a ter… → `REGISTRO-2026.md` L26499
- **27/10/2026** — A `calango` saiu, e com ela saiu também um verde falso meu → `REGISTRO-2026.md` L26594
- **27/10/2026** — A correção passou pelo caminho real: a `batata` voltou pelo… → `REGISTRO-2026.md` L26664 *(superado)*
- **27/10/2026** — Ler não é editar: o nome do registo volta a abrir o… → `REGISTRO-2026.md` L26725 *(superado)*
- **27/10/2026** — A turma do plano é de quem a direção curou: a regra sai da… → `REGISTRO-2026.md` L26822 *(superado)*
- **27/10/2026** — O cabeçalho do Plano de Observação lê o plano que ele… → `REGISTRO-2026.md` L27072
- **27/10/2026** — A aula passa a ter leitura em prosa e em Notação Benesh → `REGISTRO-2026.md` L27154
- **27/10/2026** — A Notação herda a Aula; o Plano e a aula ganham o seu… → `REGISTRO-2026.md` L27244
- **27/10/2026** — A Aula 01 chegou à produção da Batata → `REGISTRO-2026.md` L27312
- **28/10/2026** — O documento abre pela leitura, e o código interno sai da… → `REGISTRO-2026.md` L27346
- **28/10/2026** — O cabeçalho deixa de ter etiquetas, e o cartão da ficha… → `REGISTRO-2026.md` L27462
- **28/10/2026** — A Sequência declarada sai, e a métrica ganha legenda → `REGISTRO-2026.md` L27557
- **28/10/2026** — O alfabeto muda de casa, e a âncora passa a selar com que… → `REGISTRO-2026.md` L27670
- **28/10/2026** — O verbete ganha posição, direção e lado — e a prosa passa a… → `REGISTRO-2026.md` L27752
- **28/10/2026** — O verbete passa a ser administrável na Produção → `REGISTRO-2026.md` L27834
- **28/10/2026** — O verbete em Produção: três defeitos meus, e a pergunta que… → `REGISTRO-2026.md` L27880
- **01/11/2026** — O `;` que separa os itens, e a coluna que deixa de ser duas → `REGISTRO-2026.md` L29043
- **01/11/2026** — O que a sequência já responde não se escreve outra vez → `REGISTRO-2026.md` L29080
- **01/11/2026** — As 23 aulas não são uma dívida: nascem à medida → `REGISTRO-2026.md` L29158
- **01/11/2026** — A janela vista por todas as bandas: a aula e o lançamento → `REGISTRO-2026.md` L29211
- **01/11/2026** — O que vive no KV, e o que não vive → `REGISTRO-2026.md` L29290
- **01/11/2026** — O elo do expurgo diz o que aconteceu ao KV → `REGISTRO-2026.md` L29381
- **01/11/2026** — O trecho sem direção: o relevé não vai a lado nenhum → `REGISTRO-2026.md` L29449
- **01/11/2026** — A escola nasce com a âncora, e não só com o scaffold → `REGISTRO-2026.md` L29518
- **01/11/2026** — A âncora antes dos índices, e não depois → `REGISTRO-2026.md` L29568
- **01/11/2026** — A página do Vocabulário saiu; o exercício vive no «+» do… → `REGISTRO-2026.md` L29607
- **01/11/2026** — A seta sobe ao título, os passos descem para a linha… → `REGISTRO-2026.md` L29668
- **01/11/2026** — O molde dos schemas ficou atrás, e a geração de um ciclo… → `REGISTRO-2026.md` L29764
- **01/11/2026** — O molde dos schemas passa a ter um leitor só → `REGISTRO-2026.md` L29836
- **01/11/2026** — A aula deixa de afirmar o que ninguém escreveu: cinco… → `REGISTRO-2026.md` L29903
- **02/11/2026** — A segunda passagem sobre a mesma tela: rótulos, travões e o… → `REGISTRO-2026.md` L32096
- **02/11/2026** — O motor dos produtos: o dicionário e o syllabus, e o que… → `REGISTRO-2026.md` L32181
- **02/11/2026** — A licença em texto, a condição de conteúdo executável, e a… → `REGISTRO-2026.md` L32260
- **02/11/2026** — A fotografia datada, o dono do termo, e o plano que vai… → `REGISTRO-2026.md` L32368
- **03/11/2026** — O termo que a Produção criou, o alfabeto que não tem dono,… → `REGISTRO-2026.md` L32487
- **03/11/2026** — A música deixou de se bloquear e de se multiplicar, e o… → `REGISTRO-2026.md` L32576
- **03/11/2026** — A listagem lia com o alfabeto errado, e deitava fora o que… → `REGISTRO-2026.md` L32658
- **03/11/2026** — A notação em três colunas, e o trecho que não estica a tela → `REGISTRO-2026.md` L32743
- **03/11/2026** — O sinal que faltava, o nome que não se traduz, e o dono da… → `REGISTRO-2026.md` L32811
- **03/11/2026** — A habilitação é da pessoa, a turma fica marcada, e o nível… → `REGISTRO-2026.md` L32890
- **03/11/2026** — A turma é o ritmo, e o ensino é da curadoria → `REGISTRO-2026.md` L32985
- **03/11/2026** — A auditoria da turma, o conteúdo na curadoria, e o… → `REGISTRO-2026.md` L33068
- **03/11/2026** — A curadoria chegou ao plano, e o que a travava era um nome… → `REGISTRO-2026.md` L33164
- **03/11/2026** — A curadoria só oferece o que tem notação, os rótulos… → `REGISTRO-2026.md` L33234
- **03/11/2026** — O dono da música não é compasso → `REGISTRO-2026.md` L33319
- **03/11/2026** — A metodologia é do professor, e não se pergunta duas vezes → `REGISTRO-2026.md` L33381
- **03/11/2026** — A sequência acompanha os objetivos, e a pergunta era a certa → `REGISTRO-2026.md` L33466
- **03/11/2026** — O PDF do ciclo compila outra vez: dois glifos do alfabeto… → `REGISTRO-2026.md` L33903
- **03/11/2026** — O elo em `historico/` não é documento do acervo, e a… → `REGISTRO-2026.md` L33983
- **03/11/2026** — A estante mostra um por documento: a proveniência fica… → `REGISTRO-2026.md` L34033
- **04/11/2026** — A fatia de tempo vem do plano pela coluna certa, e o guia… → `REGISTRO-2026.md` L34114
- **04/11/2026** — O ajuste do plano de ensino arrasta o PO, e o cartão da… → `REGISTRO-2026.md` L34203
- **04/11/2026** — Dois «Guardar» no mesmo minuto não perdem mais um documento → `REGISTRO-2026.md` L34300
- **04/11/2026** — A fusão das edições (decisão 84) e o espelho da verdade na… → `REGISTRO-2026.md` L34386
- **04/11/2026** — O cartão da aula é três dados do professor, e o guia são… → `REGISTRO-2026.md` L34473
- **04/11/2026** — As colunas da aula têm a largura do que levam dentro, e a… → `REGISTRO-2026.md` L34570
- **04/11/2026** — O composto deixou de enumerar verbos, a modalidade deixou… → `REGISTRO-2026.md` L34646
- **04/11/2026** — O PO passa a ter três eixos, o corpo vem da anamnese, e o… → `REGISTRO-2026.md` L34747
- **04/11/2026** — O cabeçalho do ato cabe no telefone, as três asserções de… → `REGISTRO-2026.md` L34849
- **04/11/2026** — O ciclo apaga-se de trás para a frente, a sequência é… → `REGISTRO-2026.md` L34938
- **05/11/2026** — A secção do corpo nasceu fora do `</section>`, e sessenta e… → `REGISTRO-2026.md` L35966
- **05/11/2026** — O elenco muda na linha de base, a cascata desce até ao PO,… → `REGISTRO-2026.md` L36053
- **05/11/2026** — O «Ler as anamneses» acende, e a folha de impressão deixa… → `REGISTRO-2026.md` L36122
- **05/11/2026** — A tira grava, o «Ler» grava, o excluir fecha o formulário —… → `REGISTRO-2026.md` L36179
- **05/11/2026** — O passo 5 sem turma diz o que falta, a curadoria deixa de… → `REGISTRO-2026.md` L36242
- **05/11/2026** — A linha de base lia 30 dos 49 nós, e a Curadoria prometia o… → `REGISTRO-2026.md` L36349
- **05/11/2026** — «O que já é bom» ficava vazio porque o apoio da observação… → `REGISTRO-2026.md` L36451
- **05/11/2026** — «O que já é bom» passa a ser o que ALGUMA aluna tem de bom,… → `REGISTRO-2026.md` L36518
- **05/11/2026** — O índice do recorte: o que os professores olham no corpo, e… → `REGISTRO-2026.md` L36577
- **05/11/2026** — O cabeçalho que faltava: uma lista de `User-Agent`, e um… → `REGISTRO-2026.md` L37034
- **06/11/2026** — O índice não é recorte: o ficheiro da casa entrou como dado… → `REGISTRO-2026.md` L37141
- **06/11/2026** — O ciclo do Plano de Observação deixa de se escrever → `REGISTRO-2026.md` L37176
- **06/11/2026** — O Plano de Observação enxuga: sete nós saem, e o recorte do… → `REGISTRO-2026.md` L37265
- **06/11/2026** — O ciclo do PO também não se escreve NA ÁREA DO PROFESSOR (e… → `REGISTRO-2026.md` L37372
- **07/11/2026** — O expurgo da última escola derrubava o job: «nada a fazer»… → `REGISTRO-2026.md` L38913
- **07/11/2026** — O repositório limpo para o novo ciclo de testes: três… → `REGISTRO-2026.md` L38966
- **07/11/2026** — O `ciclo-01.conf` que sobreviveu ao expurgo, e o dono que a… → `REGISTRO-2026.md` L39031
- **07/11/2026** — A declaração da captura mudou de casa, e o molde deixou de… → `REGISTRO-2026.md` L39089
- **07/11/2026** — A sala diz o que é dela, e o elenco deixa de esperar por… → `REGISTRO-2026.md` L39157
- **07/11/2026** — A proveniência é auditada antes do expurgo — e o elo guarda… → `REGISTRO-2026.md` L39236
- **07/11/2026** — O passo 2 do Elenco diz o que falta, e leva lá → `REGISTRO-2026.md` L39332
- **07/11/2026** — «Elenco» passa a «Audição» e «Verbetes da notação» a… → `REGISTRO-2026.md` L39386
- **07/11/2026** — Os basilares num bloco, o quadro do recorte em acordeão, e… → `REGISTRO-2026.md` L39443
- **07/11/2026** — O cartão do elenco fica com duas caixas: as alunas e o… → `REGISTRO-2026.md` L39516
- **07/11/2026** — O Bloco 10 sai do plano: o corpo mora na Audição e no PO → `REGISTRO-2026.md` L39566
- **07/11/2026** — O expurgo passa a levar o `historico/`, e o vermelho da… → `REGISTRO-2026.md` L39662
- **07/11/2026** — O elenco recém-criado chega à Turma sem F5 → `REGISTRO-2026.md` L39735
- **07/11/2026** — A aluna que entra num elenco existente chega à cadeia:… → `REGISTRO-2026.md` L39807
- **07/11/2026** — A declaração da captura entra no índice (e o workflow deixa… → `REGISTRO-2026.md` L39905
- **07/11/2026** — O elenco é fonte do ciclo, e concluí-lo tem de terminar na… → `REGISTRO-2026.md` L39949
- **07/11/2026** — A âncora de uma aula não tem manifesto próprio: o expurgo… → `REGISTRO-2026.md` L40028
- **08/11/2026** — O plano que já foi ajustado não se oferece duas vezes, e o… → `REGISTRO-2026.md` L40456
- **08/11/2026** — O vínculo da anamnese passa a ler o elenco: a aluna que… → `REGISTRO-2026.md` L40519
- **08/11/2026** — A aluna que sai do elenco sai da aula — e o que ela já… → `REGISTRO-2026.md` L40585
- **08/11/2026** — O «Guardar» do PO cabe nos 50 subpedidos, e a cadeia deixa… → `REGISTRO-2026.md` L40692
- **08/11/2026** — O Worker voltou a falar com a rede: o `fetch` da ponte era… → `REGISTRO-2026.md` L40807
- **08/11/2026** — O fluxo da escola, num só desenho — e as duas portas do… → `REGISTRO-2026.md` L40870
- **08/11/2026** — As duas portas do fluxo da escola: a aluna que muda de… → `REGISTRO-2026.md` L40931
- **08/11/2026** — A aluna desligada, e a turma que muda de sala → `REGISTRO-2026.md` L41004
- **09/11/2026** — A Audição em três abas, e a transferência que não se… → `REGISTRO-2026.md` L41105
- **09/11/2026** — A Audição, segunda passagem: o respiro, o formulário limpo… → `REGISTRO-2026.md` L41203
- **09/11/2026** — A transferência que se perdia no rascunho, e o «Cancelar»… → `REGISTRO-2026.md` L41275
- **09/11/2026** — O «Cancelar» direto, e a derivação que troca o par… → `REGISTRO-2026.md` L41357
- **09/11/2026** — O filete pontilhado da listagem de elencos, e o padrão das… → `REGISTRO-2026.md` L41407
- **09/11/2026** — A cadeia automática: a troca e a saída deixam de ser «via… → `REGISTRO-2026.md` L41457
- **09/11/2026** — A mudança de sala entra na cadeia, e uma sala passa a… → `REGISTRO-2026.md` L41524
- **10/11/2026** — A faixa que ninguém media: 1141 a 1919px → `REGISTRO-2026.md` L41594
- **10/11/2026** — O histórico do ajuste: o rótulo, a diferença e o motivo → `REGISTRO-2026.md` L41667
- **10/11/2026** — O passo 1 do Estilo procura no vocabulário, e um exercício… → `REGISTRO-2026.md` L41743
- **10/11/2026** — A decomposição pela ordem em que foi escrita, e a… → `REGISTRO-2026.md` L41825
- **10/11/2026** — A cadeia que pára no teto continua sozinha, e o «abrir»… → `REGISTRO-2026.md` L41905
- **10/11/2026** — O ajuste que não se perde no elo vencido, e a variante que… → `REGISTRO-2026.md` L41999
- **10/11/2026** — A capacidade cobra-se por volume, e a escada da assinatura… → `REGISTRO-2026.md` L42115
- **11/11/2026** — A Turma chama-se pelo elenco, e o mesmo elenco não ocupa… → `REGISTRO-2026.md` L42211
- **11/11/2026** — O véu que não se via, a listagem que não era a mesma, e o… → `REGISTRO-2026.md` L42275
- **11/11/2026** — A operação atravessa as abas, e o véu deixa ver a página → `REGISTRO-2026.md` L42355
- **11/11/2026** — As três formas do véu, e a página que pode pedir uma… → `REGISTRO-2026.md` L42446
- **11/11/2026** — O véu do produto passa a «o texto na tela, sem caixa» → `REGISTRO-2026.md` L42532
- **12/11/2026** — O elenco que ficaria sem ninguém não existe → `REGISTRO-2026.md` L42598
- **12/11/2026** — A troca de aluna desfaz o passo 3 e o recorte, e a lista… → `REGISTRO-2026.md` L42696
- **12/11/2026** — Um véu para todos os gestos: elenco, leitura, verbete e sala → `REGISTRO-2026.md` L42771
- **12/11/2026** — A sala diz o presente, e os três passos andam → `REGISTRO-2026.md` L42847
- **12/11/2026** — A Turma diz as suas três pontas → `REGISTRO-2026.md` L42910
- **12/11/2026** — «Em turma» vem da Turma, e não do plano → `REGISTRO-2026.md` L43062
- **12/11/2026** — A autoria não se reescreve: o documento que perde a turma… → `REGISTRO-2026.md` L43131
- **12/11/2026** — O agente do Lastro: Llama na Cloudflare, MCP, e o fim do… → `REGISTRO-2026.md` L43237
- **13/11/2026** — A listagem não é a proveniência: uma linha por professor,… → `REGISTRO-2026.md` L43499
- **13/11/2026** — A logomarca sobe para o alto da coluna, e as duas telas… → `REGISTRO-2026.md` L43571
- **13/11/2026** — A lista custa o índice, e não um arquivo por registo → `REGISTRO-2026.md` L43650
- **13/11/2026** — O CSS não gasta pedido do dia, e a lista não paga duas… → `REGISTRO-2026.md` L43726
- **13/11/2026** — O registo de custo da IA ganha mês no nome → `REGISTRO-2026.md` L43828
- **13/11/2026** — O isolamento entre escolas passa a ser provado, e decide-se… → `REGISTRO-2026.md` L43878
- **13/11/2026** — A escola deixa de ser `var` de deploy: o mapa… → `REGISTRO-2026.md` L43929
- **13/11/2026** — O endereço é por host: `<escola>.padd.com.br` → `REGISTRO-2026.md` L44015
- **13/11/2026** — A escola nasce com endereço próprio, e o expurgo leva-o… → `REGISTRO-2026.md` L44059
- **13/11/2026** — O domínio do painel, e a rota curinga que a zona tinha → `REGISTRO-2026.md` L44133
- **13/11/2026** — As senhas de teste entram no ficheiro local, e o push deixa… → `REGISTRO-2026.md` L44191
- **15/11/2026** — Audição: a tira obedece ao «Seguir», e o passo 2 fica vazio → `REGISTRO-2026.md` L44733
- **15/11/2026** — O formulário da anamnese não abria: o `markdown.js` era… → `REGISTRO-2026.md` L44808
- **15/11/2026** — Audição: as abas Recorte e Transferência esperam pelo… → `REGISTRO-2026.md` L44869
- **15/11/2026** — Estilo: os passos do trecho só abrem dentro de um trecho;… → `REGISTRO-2026.md` L44906
- **15/11/2026** — As saídas do pacote deixam de se carimbar: a data sai das… → `REGISTRO-2026.md` L44975
- **15/11/2026** — A etiqueta «PO aguardando» passa a dizer o que falta marcar → `REGISTRO-2026.md` L45039
- **15/11/2026** — O estado do PO lê-se das perguntas obrigatórias, e não do… → `REGISTRO-2026.md` L45104
- **15/11/2026** — O professor desligado não se oferece para um ato → `REGISTRO-2026.md` L45196
- **15/11/2026** — O carimbo do PDF deixa de depender do fuso de quem gera → `REGISTRO-2026.md` L45282
- **15/11/2026** — Quem assume os documentos de quem saiu: a definição da turma → `REGISTRO-2026.md` L45343
- **15/11/2026** — Os gestos 4 a 7 do shard não precisavam do modelo → `REGISTRO-2026.md` L45382
- **15/11/2026** — A chave mestra, o expurgo que a conhece, e o cofre → `REGISTRO-2026.md` L45446
- **15/11/2026** — A publicação do shard: uma árvore partilhada monta-se… → `REGISTRO-2026.md` L45555
- **15/11/2026** — A chave que não abre tem nome → `REGISTRO-2026.md` L45622
- **15/11/2026** — Quatro provas que mediam o desenho de ontem → `REGISTRO-2026.md` L45661
- **15/11/2026** — O shard não é uma escola, e a lista dizia que era → `REGISTRO-2026.md` L45728
- **15/11/2026** — O mapa de escolas não conhecia a escola de shard → `REGISTRO-2026.md` L45779
- **15/11/2026** — As três escolas nasceram dentro do shard, e a bateria passou → `REGISTRO-2026.md` L45882
- **15/11/2026** — O expurgo das três, e a sujeira que era minha → `REGISTRO-2026.md` L45934
- **24/11/2026** — a escola recém-criada volta a dizer que está a ser criada,… → `REGISTRO-2026.md` L45987
- **24/11/2026** — «usar este professor» existia e estava desabilitado → `REGISTRO-2026.md` L46040
- **16/11/2026** — o relógio não mente, a caixa não explica, e a etiqueta… → `REGISTRO-2026.md` L47293
- **16/11/2026** — os dois botões da coluna «Acesso» empilhados, com o ar da… → `REGISTRO-2026.md` L47364
- **16/11/2026** — a escola que nasceu hoje não podia ser apagada nunca → `REGISTRO-2026.md` L47414
- **16/11/2026** — a escola apagada volta a nascer, e o ciclo comercial fecha → `REGISTRO-2026.md` L47486
- **17/11/2026** — O elenco não se perdeu: a leitura falhou, e o ecrã disse… → `REGISTRO-2026.md` L49527
- **17/11/2026** — O ar entre a aba e o bloco que ela abre → `REGISTRO-2026.md` L49604
- **17/11/2026** — A escola como listagem: a proposta, para ela ver antes de… → `REGISTRO-2026.md` L49660
- **17/11/2026** — As bancadas de layout não atravessavam o shard → `REGISTRO-2026.md` L49724
- **17/11/2026** — «A escola» vira listagem: três caixas, o mês a mês noutra… → `REGISTRO-2026.md` L49761
- **17/11/2026** — O «Pagar» só quando se deve, o mês a mês vira tabela… → `REGISTRO-2026.md` L49835
- **17/11/2026** — O plano contratado dito por palavras, o mês a mês dentro da… → `REGISTRO-2026.md` L49908
- **17/11/2026** — A conciliação que faltava no painel: o mesmo mês dos dois… → `REGISTRO-2026.md` L50004
- **17/11/2026** — O login do professor volta a existir, e o ensaio passa a… → `REGISTRO-2026.md` L50066
- **17/11/2026** — O ensaio começa no mês que NÃO está pago, senão não há o… → `REGISTRO-2026.md` L50143
- **18/11/2026** — «O e-mail aparece na ficha e a rota diz que ele não existe» → `REGISTRO-2026.md` L51622
- **18/11/2026** — No professor vinculado, o botão diz «Derivar» (e abre a… → `REGISTRO-2026.md` L51671
- **18/11/2026** — «Pedi a anamnese da aluna C e abriu na aluna A» → `REGISTRO-2026.md` L51705
- **18/11/2026** — «Tá salvando isso aonde?» — a caixa de entrada do Fale… → `REGISTRO-2026.md` L51761
- **18/11/2026** — «Tem mais uma opção que tem que existir: a metodologia… → `REGISTRO-2026.md` L51823
- **18/11/2026** — «O formulário é para enviar direto» — e o canal em todas as… → `REGISTRO-2026.md` L51895
- **18/11/2026** — «Francesa e Cecchetti são coisas diferentes» — a matriz de… → `REGISTRO-2026.md` L51994
- **18/11/2026** — «Se é assim, apaga» — o campo `arquivos` do índice, e o que… → `REGISTRO-2026.md` L52056
- **18/11/2026** — «Eles não são derivar, eles são editar» — e a etiqueta que… → `REGISTRO-2026.md` L52119
- **20/11/2026** — «A gente pode tirar do modal essa parte» — a dose sai, e a… → `REGISTRO-2026.md` L55351
- **20/11/2026** — A caixinha da Produção: a marca e o menu a 10px do canto → `REGISTRO-2026.md` L55404
- **20/11/2026** — «O total é uma soma» — o modal da duração vira formulário,… → `REGISTRO-2026.md` L55451
- **20/11/2026** — «O professor cancela se quiser» — o «Cancelar» do modal faz… → `REGISTRO-2026.md` L55512
- **20/11/2026** — «Houve redução de custo?» — sim, mas é a fusão que a fez, e… → `REGISTRO-2026.md` L55548
- **20/11/2026** — «Recorte» e «Transferência» fecham enquanto há um elenco em… → `REGISTRO-2026.md` L55581
- **20/11/2026** — O «Professor responsável» sai da Audição, e a anamnese leva… → `REGISTRO-2026.md` L55628
- **20/11/2026** — O PDF sai do fluxo: quem imprime é o navegador → `REGISTRO-2026.md` L55682
- **20/11/2026** — O estudo do modal do Estilo, corrigido por ela: é na… → `REGISTRO-2026.md` L56003
- **20/11/2026** — Duas provas apagadas: as que mediam um mundo que já não… → `REGISTRO-2026.md` L56920
- **20/11/2026** — «Curadoria» saiu da tela, e a prova que media uma Turma sem… → `REGISTRO-2026.md` L56964
- **20/11/2026** — A matriz do formulário pergunta uma vez por par, e o eixo… → `REGISTRO-2026.md` L57042
- **20/11/2026** — A folha impressa deixou de perguntar duas vezes → `REGISTRO-2026.md` L57107
- **22/11/2026** — O fluxo da Aula 02 escrito, e o expurgo com um conferidor → `REGISTRO-2026.md` L57962
- **22/11/2026** — Uma régua só, e um plano só na escolha → `REGISTRO-2026.md` L58073
- **22/11/2026** — O estúdio, e o modelo do painel inicial → `REGISTRO-2026.md` L58154
- **24/11/2026** — O REGISTRO partido por ano: o índice e o arquivo anual → `REGISTRO-2026.md` L60174
- **demi-plie · ciclo 01:** aulas escritas em detalhe: 1 de 5 (as demais entram depois da aula anterior).

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
