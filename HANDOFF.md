# Handoff — Projeto Ciclo (o produto é o Sistema Lastro)

Gerado em: `2026-10-15T14:24:54-0300`
Commit atual: `4bee5dc` — fix(tools): o gerador do HANDOFF quebrava com o repositório sem escola
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
- **Professores:** tiago (1)
- **Ciclos com manifesto:** 0
0 variante(s)
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
4bee5dc fix(tools): o gerador do HANDOFF quebrava com o repositório sem escola
67ddfa0 chore(estrutura): expurgar a escola barra
21d8dcf chore(estrutura): expurgar a escola maria
bb0da30 feat(estrutura): o expurgo da escola vira botão, na raiz
b510383 chore(entrega): absorver o volteio do gerador (carimbo e sais novos)
0d009e6 chore(entrega): os pacotes da Barra e da Maria absorvem o lançamento autenticado
a88b9ae fix(template): o lançamento exige a senha e avisa quando grava sem cifra
f40f29c feat(estrutura): o lançamento da aula confere a senha e grava CIFRADO no cofre
4e4adf5 docs(registro): a árvore nunca fica limpa depois de um commit que toca fonte de ciclo
a45ec58 chore(entrega): absorver o volteio do gerador (carimbo e sais novos)
4f61a8b chore(entrega): absorver o volteio do gerador (carimbo e sais novos)
9a4e792 chore(entrega): os pacotes da Barra e da Maria absorvem o formulário que decifra pelo Worker
33e2299 fix(template): o formulário decifra pelo Worker — a chave sai do navegador
4c57a8c feat(estrutura): a chave de cifra vira interna do Worker — e a criação para de entregá-la
789e309 fix(tools): o arquivo de senhas vira um espelho por escola — e o modelo ensina a forma
b39b5b6 fix(tools): o prefixo do nome separa a chave de cifra da senha de acesso
281c7e1 docs(registro): a SENHA_LETICIA não é inerte — é o login da professora
83560fc fix(estrutura): a criação da escola diz onde guardar a senha de criptografia
e3fc795 fix(tools): o guarda do pre-push confere a última linha do arquivo de senhas
8c56058 docs(registro): o passo de deploy foi exercitado — a cadeia publica
```

## Por professor

### tiago — 0 ciclo(s)

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

## 15/10/2026 — O gerador do HANDOFF quebrava com o repositório sem escola

**O que motivou.** Ao expurgar a barra e a maria, o repositório ficou **sem nenhum professor** — o
estado de um repositório recém-nascido. E aí `tools/gerar-handoff.sh` passou a cuspir, no fim da
execução:

```
tools/gerar-handoff.sh: linha 330: variantes: variável não associada
```

A variável `variantes` é atribuída **dentro do laço de professores** e usada no resumo final. Com zero
professores o laço não roda, e sob `set -euo pipefail` o resumo quebra. O `HANDOFF.md` em si saía
correto — o erro era na linha de resumo, que passava a informar `variantes: 0` por acidente
(`printf '' | wc -w`), e não por medição.

**O que foi decidido.** Inicializar `variantes=""` junto das outras variáveis, com a nota do porquê.
Uma linha. O resumo passa a medir de verdade o caso «nenhuma escola», em vez de tropeçar nele.

**Motivo declarado — os congelados.** `tools/` está congelado (`CONGELAMENTO.md`). O motivo: o
`HANDOFF.md` é o **primeiro artefato que uma sessão nova lê**, e o gerador dele é quem o emite; um
gerador que falha no estado em que o projeto **está agora** (zero escolas, a caminho de uma escola
nova) precisa funcionar nesse estado. O que **não muda**: a fórmula de hash, a cobertura do `.fipp`,
os validadores, as 17 regras, as 22 pétreas e o próprio conteúdo do `HANDOFF.md` — só a
inicialização de uma variável de contagem. Sem reancoragem: `tools/` não é coberto pelo `.fipp`.

**Onde entrou.** `tools/gerar-handoff.sh` — a inicialização de `variantes`, com a nota.

**Com o quê.** `tools/gerar-handoff.sh` (commit próprio, só ele), mais as entradas de `REGISTRO.md` e o
`HANDOFF.md` regenerado, que vão com o elo do `Buffer` logo acima.

**Referências.** `CONGELAMENTO.md` · o elo de 15/10/2026 anterior (o expurgo da barra e da maria, que
esvaziou o repositório de professores).

**O que ainda não está feito.** Nada pendente nesta correção. O resumo do gerador não é lido por
nenhum outro script: é a última linha da saída do comando.

## O que está pendente

## 15/10/2026 — O lançamento da aula confere a senha e grava cifrado no cofre

- **Os lançamentos JÁ GRAVADOS em claro continuam em claro** — inclusive os do experimento
  (`diaghilev/fokini/…`). A cifra vale daqui para frente; migrar o que existe é outra operação, e
  ninguém a pediu.
- **Não há LEITOR do lançamento no KV.** O caminho é de mão única: o formulário grava, e nada lê de
  volta (o pacote é sempre a semente vazia). Quem for ler vai precisar decifrar com a mesma chave — e
  é isso que o envelope diz.
- **A Maria continua sem `SENHA_CRIPTO`**: ela aceita o lançamento e grava **em claro**, com a
  resposta dizendo `cifrado: false` e o formulário avisando. Criar o secret nela é decisão do dono do
  produto.
- O pacote **não** foi regenerado com aviso nenhum no PDF sobre o KV; e a `lib-cifra.js` continua
  copiada para o pacote sem uso no formulário (limpeza pequena, ainda não feita).

## 15/10/2026 — O expurgo da escola sai do comando e vira botão, na raiz

- **O expurgo da Barra e da Maria não foi executado.** O botão está no ar e provado nas duas
  metades; quem clica é o dono do produto — é o que ele pediu. Nada foi apagado até aqui.
- **A metade do Cloudflare não foi provada ao vivo.** `excluirEscola` é código que já existia (a
  varredura agendada), mas o `SENHA_RAIZ` é **write-only**: não há como testar a rota autenticada sem
  trocar a senha do dono, e trocar não se faz. O que se provou foi o portão (401) e a presença dos
  três secrets no Worker (`CLOUDFLARE_API_TOKEN`, `GITHUB_TOKEN`, `SENHA_RAIZ`).
- **A limpeza do KV depende de o `wrangler.<slug>.jsonc` ser legível.** Sem ele, ou ilegível, o
  expurgo cai no slug e **não toca no KV** — de propósito: o namespace é compartilhado, e apagar o
  errado apaga o dado de outra escola.
- **A varredura agendada (§17.5) continua no andaime** — `escolas-habilitadas.json` + prazo — e
  lista só a `maria`. Ela e o botão são dois caminhos para a mesma coisa; unificá-los (ou aposentar o
  andaime) é decisão do dono do produto, e não foi tomada.
- **`escola/expurgar.js` não apaga o `LOGIN_<PESSOA>` do professor** — nem ele nem a rota. Se o
  professor ficar sem escola, aquele login não abre mais nada, mas a linha fica: a pessoa pode entrar
  em outra escola, e é a mesma linha que a serviria.
- **Criar a escola nova — do começo ao fim — ainda não aconteceu.** É o próximo passo, e é do dono do
  produto.
- **A tabela de escolas do `README.md` (linhas 112 e seguintes) cita a Maria e a Barra**, e os
  exemplos de deploy citam `wrangler.maria.jsonc`. Depois do expurgo aquilo fica **mentindo**. Não
  entrou no automatismo de propósito: é prosa de gente numa tabela editada à mão, e um regex que
  reescreve tabela erra mais do que acerta. Fica como passo declarado, a fazer junto com o expurgo.
- **`raiz/escolas-habilitadas.json` lista a `maria`** — é o andaime da varredura agendada, e ele
  **não** é tocado pelo botão. Expurgada a Maria por ali, o Cron seguinte procuraria uma escola que
  já não existe (a chamada falha e o relatório do Cron diz).

## 15/10/2026 — O expurgo apagava a escola e deixava o cadastro das alunas no KV

- **O expurgo da barra não foi executado** — quem executa é o dono do produto, e é o teste de
  aceitação: as 11 chaves estão lá, medidas, esperando. O relatório dele responde a pergunta aberta do
  token (se disser `11 de 11`, o token tem permissão e a causa do caso da Maria é outra; se disser
  que não limpou, é o token).
- **A chave `maria/tiago/01/anamnese/anamnese-20261012-1149` continua no KV** (namespace
  `ciclos-escolas-maria`), junto com as 3 `envelope/*` e as 2 `bastidores/maria/*`. Destino pendente.
- **Dois namespaces órfãos seguem com dado**: `ciclos-escolas-plano-b` (4 chaves, do experimento) e
  `ciclos-escolas-maria` (6). Nada em uso aponta para eles. Limpar ou apagar os namespaces é decisão
  do dono do produto.
- **O caminho do Cron (§17.5) continua limpando o KV só se o andaime declarar `kv`** — e, se declarar
  um `prefixo` único, perde `bastidores/<slug>/`. O andaime sai quando a Produção nascer; até lá, o
  botão é o caminho completo.
- **`raiz/escolas-habilitadas.json` ainda lista a `maria`** com `habilitada: true` — escola que já não
  existe. É andaime editado à mão; fica para a decisão do dono do produto.
- **Os órfãos não aparecem na lista**, e é a definição dela: só o repositório. Somar a lista do
  Cloudflare (`GET /accounts/{id}/workers/scripts`) e marcar os que só vivem lá deixaria o botão
  completo — não foi feito.
- **`tutu` e `diaghilev-ia-stub` foram apagados por fora do botão** (por comando, nesta sessão),
  porque não havia como alcançá-los pela página. O expurgo que não passa pelo botão é justamente o que
  deixa rastro nenhum — este elo é o rastro.

## 15/10/2026 — `Buffer` não existe no runtime dos Workers: o expurgo não achava o KV e reescrevia o índice

- **O passo do KV da rota não foi provado AO VIVO ponta a ponta.** Ele é provado por partes: a
  limpeza contra a API real, a leitura da morada no runtime real, e o contrato da rota no banco de
  provas. O caminho completo (`/api/apagar-escola` achando a morada, limpando o KV e apagando)
  depende de haver uma escola no registro — e **não há nenhuma**. Ele será executado, de fato, na
  primeira escola que nascer e for expurgada.
- **`raiz/escolas-habilitadas.json` continua listando a `maria`** (`habilitada: true`) — escola que já
  não existe, e um segundo registro de escolas que agora está vazio de verdade. Andaime editado à mão:
  decisão do dono do produto.
- **`escola/diaghilev2/`** é elo de um expurgo antigo (13/10) — e é assim que deve ser: o índice
  sobrevive. Não é sobra, é registro.
- **`ciclos-escolas-plano-b` segue com 4 chaves** (3 `envelope/*` do experimento antigo e
  `professores:maria`). Não é de escola alguma viva. Limpar ou apagar o namespace é decisão do dono
  do produto — ficou fora desta correção.
- **Os dois namespaces das escolas existem e estão vazios** (`ciclos-escolas-maria`,
  `ciclos-escolas-plano-b`). O expurgo apaga CHAVES, nunca namespaces — e é assim que tem de ser,
  porque o compartilhado serve as escolas vivas. Apagar namespace é operação de fora do botão.
- **Os órfãos continuam invisíveis na lista**: ela sai só do repositório. `tutu` não tinha rastro
  nenhum, e foi preciso ir à API da Cloudflare para saber que existia.
- **O caminho do Cron (§17.5) continua limpando o KV só se o andaime declarar `kv`.**

## 15/10/2026 — O gerador do HANDOFF quebrava com o repositório sem escola

Nada pendente nesta correção. O resumo do gerador não é lido por
nenhum outro script: é a última linha da saída do comando.

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
