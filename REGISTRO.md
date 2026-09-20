# REGISTRO — Marcos metodológicos do Projeto Ciclo

Registro descritivo (P-06) dos marcos que constituem o Projeto Ciclo como
objeto metodológico. Não é caderno pedagógico; é log do sistema.

**Ordem das entradas:** cronológica — a mais **recente no fim**. É a última que
`tools/gerar-handoff.sh` extrai como "última entrada do REGISTRO".

## 18/09/2026 — PO do Ciclo 01 — Duo validado

**O que aconteceu.**
O primeiro PO do projeto foi declarado e validado. Cobre o Ciclo 01 do Duo:
quatro alunas, 11 anos, 12 aulas de fundamentos, professor Tiago Menegaz.
Estado: `Input_PO_Validado`.

**O que foi decidido.**
- PO é por escola (não por ciclo-base). Ritmos e Débora terão POs próprios.
- Linha de base declarada como campo próprio (P-10).
- Condições de contorno da execução declaradas (P-11).
- Registro específico das alunas é opcional, não obrigatório.
- Aulas de outros professores do Duo entram no recorte (processo contínuo).

**Com o quê.**
`PROTOCOLO.md`, `ciclos/ciclo-01-duo-po.md`, `tools/hash-ciclo.sh`,
`tools/validar-po-ciclo.js`.

**Referências.**
Taylor (2003); Polanyi (1966); Clippinger (2024); RAD (2015); Wulff;
Mirzabekiantz (2000); Parker (1990); Homans (2010); Paper FIPP
(operacionalização dos protocolos).

**O que ainda não está feito.**
POs de Ritmos e Débora; primeiro relatório pós-aula; Ciclo 02.

## 18/09/2026 — Estrutura por professor (P-13, P-14) e migração do material

**O que aconteceu.**
O projeto deixou de assumir um único professor. O material de observação do Tiago foi
movido para `professores/tiago/` (ciclos, cadernos, relatórios, campo) e as ferramentas
passaram a receber o professor como argumento. O que é metodológico e compartilhado
ficou na raiz: `biblioteca/`, `apresentacoes/`, `protocolo/`, `tools/` e os documentos do
projeto (`PROTOCOLO.md`, `REGRAS.md`, `REGISTRO.md`, READMEs, `HANDOFF.md`).

**O que foi decidido.**
- P-13: o PO é do **professor**, não do projeto. Dois professores com a mesma escola e as
  mesmas alunas têm POs distintos — o recorte observacional é decisão de cada um.
- P-14: o PO pode derivar de um **PO de departamento**, onde a escola tiver metodologia
  comum (`parentHash` = hash do PO de departamento); sem isso, o PO é raiz.
- Hoje **nenhuma** escola do projeto tem PO de departamento — inclusive o Duo, que vai
  adotar RAD sem estrutura departamental. `departamentos/` fica pronto, aguardando.
- O **guia do professor** entra no pacote de todo ciclo (`biblioteca/guia-do-professor.md`):
  explica em que posição o professor está e o que não muda em nenhuma das duas formas.
- Ferramentas: `tools/gerar-ciclo.sh <professor> <ciclo> <variante>`; sem o professor,
  assume `tiago` — os comandos antigos continuam valendo.
- As âncoras FIPP passam a declarar `professor:`; a cadeia segue intacta (o Ciclo 01 é
  raiz, `parentHash` vazio).

**Com o quê.**
`professores/`, `departamentos/README.md`, `biblioteca/guia-do-professor.md`,
`PROTOCOLO.md`, `tools/gerar-ciclo.sh`, `tools/hash-ciclo.sh`, `tools/gerar-handoff.sh`,
`tools/check-pacote.js`, `tools/check-glossario.js`, `tools/hooks/pre-commit`,
`tools/hooks/commit-msg`, `.gitignore`.

**Referências.**
RAD (2015; 2025); `REGRAS.md` (17 regras); `PROTOCOLO.md` (P-10, P-11, P-13, P-14);
`biblioteca/README.md` (as duas listas de referência).

**O que ainda não está feito.**
Primeiro relatório pós-aula do Duo; POs de Ritmos e Débora; Ciclo 02; um segundo
professor (a estrutura está pronta, aguardando o primeiro).

## 18/09/2026 — Publicação do repositório no GitHub (decisão da pesquisadora)

**O que aconteceu.**
O repositório passa a ser publicado no GitHub, **com o conteúdo integral** — incluindo o
PO, o material de observação e o de campo. A decisão foi tomada com a auditoria à vista:
o repositório tem **70 arquivos rastreados e nenhum binário** (3,2 MB), **nenhum dado de
contato, senha ou chave**; as alunas aparecem **somente por apelidos** (P-12). Há, sim,
descrições individuais na linha de base e nos relatórios — e o histórico de 75 commits
preserva tudo isso de forma permanente, o que a decisão assume conscientemente.

**O que foi decidido.**
- Repositório **público**, nome `danca`, com o conteúdo integral.
- As saídas geradas continuam fora do versionamento (P-04): o que se publica é fonte
  reconstruível, não artefato.
- As regras de privacidade do projeto permanecem as mesmas: **nome completo e contato das
  alunas não entram em nenhum arquivo do repositório**, em nenhum momento.

**Com o quê.**
`README.md` (nota "Sobre os dados deste repositório"), `.gitignore`, `REGRAS.md` (17
regras), `PROTOCOLO.md` (P-04, P-12).

**Referências.**
`professores/tiago/campo/README.md` (regra de privacidade de campo); `PROTOCOLO.md` P-12
(apelidos estáveis).

**O que ainda não está feito.**
Licença do repositório (a definir); o envio para o GitHub, que acontece fora do
repositório, na máquina da pesquisadora.

## 18/09/2026 — Pacotes de ciclo passam a ser versionados (deploy automático)

**O que aconteceu.**
O deploy do material passou a ser **automático a partir do GitHub** (Netlify, uma conta por
escola). Como o serviço lê o repositório, o pacote gerado precisa estar nele — e até aqui as
saídas ficavam fora do Git, por `.gitignore`.

**O que foi decidido.**
- Os pacotes (`professores/<p>/ciclos/ciclo-XX-<escola>/`: HTML, PDF e `assets/`) passam a
  ser **versionados** — inclusive os `assets/`, que são o estilo e os mapas sem os quais a
  página não funciona.
- **A P-04 continua valendo integralmente:** o hash FIPP segue cobrindo apenas as fontes
  (`.conf` e `.md`). Versionar a saída não altera âncora nenhuma — conferido com `--check`.
- O `pre-commit` deixa de barrar essas saídas (a regra que recusava arquivos gerados ganhou
  a exceção do pacote de ciclo). O `out/` da apresentação, os `.pptx` e os PNGs de slide
  seguem barrados.
- O que se aceita em troca: cada regeneração de pacote entra no histórico, e o diff passa a
  mostrar HTML e PDF além das fontes. Foi o custo escolhido para ter deploy automático.
- O `tools/deploy-netlify.sh` (deploy por linha de comando) continua disponível, mas com o
  deploy pelo Git ele passa a ser opcional.

**Com o quê.**
`.gitignore`, `tools/hooks/pre-commit`, `README.md`, `README-ciclos.md`,
`tools/gerar-handoff.sh`, `professores/tiago/ciclos/ciclo-01-{duo,ritmos,debora}/`.

**Referências.**
`PROTOCOLO.md` P-04 (hash sobre fontes); `REGRAS.md` 17 (versionamento);
`README-ciclos.md` (formato de entrega).

**O que ainda não está feito.**
Configurar o *publish directory* de cada site no Netlify; primeiro deploy de cada escola;
licença do repositório.

## 18/09/2026 — Ciclo próprio por escola: a Ritmos deixa de ser cópia da Duo

**O que aconteceu.**
Chegou a **entrega do professor** para a escola **Ritmos e Movimento** (ciclo de pas
de deux, 20 encontros). Ao instalar, verificou-se que as três "variantes" do Ciclo 01
liam o **mesmo conteúdo** — o da Duo: o gerador resolvia a fonte de cada documento sem
sufixo de variante (`ciclos/ciclo-01-plano.md`), e o hasher cobria **todos** os `.md`
do ciclo. O pacote da Ritmos saía com o plano e a aula da Duo, e a Débora com o ciclo
inteiro que não é dela. Era um erro de instalação anterior, não da entrega.

**O que foi decidido.**
- **Cada escola tem o seu ciclo.** O conteúdo — objetivo, plano, aulas, referências —
  é da escola, não do número do ciclo. Ficou uma regra única de resolução, em
  `tools/lib-fontes.sh`, usada pelo gerador **e** pelo hasher: `ciclo-XX-<escola>-<doc>.md`
  tem precedência sobre `ciclo-XX-<doc>.md`.
- **Removidas as cópias da Débora** (21 arquivos: manifesto, PO, âncora e pacote). O
  ciclo dela ainda **não existe** — será instalado quando houver entrega.
- **O ciclo da Duo não foi tocado**: continua sendo o dela (Fundamentos do Balé
  Clássico, 12 aulas). Sua âncora não mudou (`f99c8ef2879a`), o que confirma que a
  correção das ferramentas não alterou o que já estava certo.
- **Instalado o Ciclo 01 da Ritmos e Movimento** a partir da entrega do professor:
  conteúdo próprio, 20 encontros, 60 min (terças) e 120 min (sábados), início
  19/09/2026, PO com os campos dele. Nova âncora: `12a9ab9201f6`.
- **Duas correções de ferramenta** que o caso revelou, da mesma natureza do erro
  original: o rodapé do template e a lista de navegação do README **não** traziam os
  documentos do ciclo, mas as quatro páginas do ciclo de fundamentos, escritas à mão —
  num ciclo de pas de deux isso dava **links mortos** em todas as páginas; e o
  validador `check-pacote.js` **exigia** essas quatro páginas de todo pacote. Agora
  ambos derivam de `DOCS`, e a conferência de notação × glossário só roda quando o
  ciclo declara esses documentos.

**Com o quê.**
`tools/lib-fontes.sh` (novo), `tools/gerar-ciclo.sh`, `tools/hash-ciclo.sh`,
`tools/check-pacote.js`, `tools/templates/ciclo.html`, `tools/deploy-netlify.sh`,
`README.md`, `README-ciclos.md`, `professores/README.md`,
`professores/tiago/cadernos/README.md`,
`professores/tiago/ciclos/ciclo-01-ritmos{,.conf,-po.md,-index.md,-plano.md,-aula-01.md,-referencias.md,.fipp}`,
`professores/tiago/campo/2026-09-18-ritmos/respostas.md`.

**Referências.**
`PROTOCOLO.md` P-09/P-10 (PO por escola), P-13 (PO por professor), P-05/P-06 (material
bruto); `REGRAS.md` 9 (volume), 16 (entrega), 17 (versionamento); `README-ciclos.md`.

**O que ainda não está feito.**
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

**O que aconteceu.**
O ciclo do Ritmos e Movimento recebeu **quatro** dos oito artefatos auxiliares que
faltavam: **relatório-preview** (guia do que observar, com a dimensão do **par**),
**captura em aula** (folha de marcação com os cinco apelidos), **pré-requisitos**
(o piso que o professor declarou) e **apanhado histórico** (o repertório declarado,
com o pas de deux a identificar). O **PO foi corrigido**: apelidos estáveis fixados
(**Carol, Dada, Tony, Pássaro Azul, Mari**), **21 aulas** (era 20) e a duração
descrita como **3 aulas de 60 min por semana** (a terça é pas de deux; o sábado tem
balé como preparação + pas de deux). O manifesto acompanhou (21 aulas,
`DURACOES="60,60,60"`). **Cinco novas pétreas** foram declaradas (P-15 a P-19), e os
**dois prompts do projeto** passaram a viver versionados em `prompts/`.

**O que foi decidido.**
- A notação segue a metodologia declarada (P-15).
- Metodologia e notação são perguntadas na eliciação (P-16).
- Todo ciclo replica os artefatos do ciclo piloto (P-17).
- A metodologia pode ser imposta pela escola, não só escolhida (P-18).
- Prompts do projeto vivem no repositório (P-19).
- **Quatro artefatos não foram gerados**, e isso foi decisão, não esquecimento:
  `notacao`, `glossario-benesh`, `musicalidade` e `musicalidade-aluna` carregam, no
  ciclo piloto, o **conteúdo daquele ciclo** — o registro dos exercícios dele, as
  contagens das aulas dele, os exemplos dos passos dele. Replicá-los exigiria
  inventar o que o professor não deu, e a resposta dele sobre notação foi
  literalmente "[a decidir]". Proposta registrada: extrair a parte **conceitual**
  para a `biblioteca/` (como já se fez com o guia do professor, que é resolvido por
  caminho em todo pacote) e escrever, por ciclo, documentos curtos que só amarrem os
  conceitos à aula e à música daquela escola — que é a pergunta que a P-16 manda
  fazer na eliciação.

**Com o quê.**
`PROTOCOLO.md` (P-15 a P-19), `prompts/eliciar-ciclo.md`, `prompts/instalar-ciclo.md`,
`tools/hooks/commit-msg` (escopo `prompts`),
`professores/tiago/ciclos/ciclo-01-ritmos{,.conf,-po.md,-relatorio-aula-01.md,-captura-aula-01.md,-pre-requisitos.md,-apanhado-historico.md,.fipp}`
e o pacote gerado (9 páginas HTML, PDF de 22 páginas).

**Referências.**
RAD (2015); Taylor (2013); Polanyi (1966). *(A entrada prevista citava "Taylor
(2003)"; a biblioteca do projeto registra a edição de **2013** — conferido antes de
escrever.)*

**O que ainda não está feito.**
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

**O que aconteceu.**
O PO do Ritmos passou para **`Input_PO_Validado`** (os cinco itens do checklist
marcados), depois de quatro correções: o total de encontros (20 → **21**, com nota de
correção no próprio campo), o `theoreticalBasis` (incorpora **Homans**, que o professor
declarou em "Documentos auxiliares"), as **condições de contorno (P-11)** preenchidas e a
linha de base com a subseção de **restrições físicas (P-22)**. O apanhado histórico foi
completado: os dois pas de deux de *O Quebra-Nozes* identificados, com produção de
referência, estrutura e elenco — e a exclusão da versão de Nureyev registrada como
decisão do professor. A **P-22** entrou no `PROTOCOLO.md` (**22 pétreas**) e foi aplicada
nos dois prompts e na governança do caderno.

**O que foi decidido.**
- **P-22:** as condições materiais de execução são **declaradas** (PO), **registradas**
  (caderno e relatório) e **comunicadas** (coordenação); o professor **não avalia** o que
  o sujeito não pode executar por restrição física.
- Restrições conhecidas neste ciclo: **Carol** (tornozelos, joelhos) e **Pássaro Azul**
  (ombro — provavelmente direito, a confirmar) — ambas declaradas pela **pesquisadora**,
  porque a entrega do professor é anterior à pétrea.
- Os dois pas de deux do ciclo: **PDD 1** (após a batalha com o Rei dos Ratos, Ato I) com
  **Mari**; **PDD 2** (Grand Pas, Ato II) com **Carol e Dada**, que revezam.
- A identificação dos números, da produção (Peter Wright, Royal Ballet) e do elenco é
  declaração da **pesquisadora**; o professor declarou as músicas e a obra.
- Exclusão da versão Nureyev: decisão pedagógica do professor, registrada no apanhado.

**Com o quê.**
`PROTOCOLO.md`, `prompts/eliciar-ciclo.md`, `prompts/instalar-ciclo.md`,
`protocolo/governanca-caderno.md`,
`professores/tiago/ciclos/ciclo-01-ritmos{,-po.md,-apanhado-historico.md,.fipp}` e o
pacote gerado.

**Referências.**
RAD (2015); Homans (2010); Taylor (2013); Polanyi (1966); Clippinger (2024).

**O que ainda não está feito.**
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

**O que aconteceu.**
- **Publicado:** os commits acumulados foram enviados ao `origin/main` (o bloqueio
  anterior — o nome próprio num documento publicado — tinha caído na harmonização). O
  Netlify reconstrói os dois sites a partir do push.
- **Caderno e relatório da Aula 01 do Duo** escritos a partir da aula de 18/09: o
  primeiro **ciclo completo** do projeto — PO declarado → aula dada → caderno escrito →
  relatório gerado.
- **Preview e PO da Duo corrigidos:** os dois caminhos pré-migração no preview do
  relatório, a formulação da nota da Ana e a nota de proveniência, que dizia que o
  primeiro relatório pós-aula ainda não existia — ele existe, e a nota passou a apontar
  o caminho.
- **Preview do Ritmos corrigido** (os mesmos dois caminhos), no commit imediatamente
  anterior a este.

**O que foi decidido.**
- **A âncora do ciclo da Duo muda pela primeira vez:** `f99c8ef2879a` → **`ae7e63fb7964`**.
  É o inverso do que está registrado mais acima, no mesmo dia: lá a âncora dela
  permaneceu intacta justamente porque o ciclo **não** tinha sido tocado; aqui foi, com
  autorização da pesquisadora.
- A formulação nova descreve o **processo** (escutar mais tempo, começar depois e
  responder certo), não o **efeito** (demorar). O que se observa não mudou; mudou o nome
  do que se observa.
- **O registro guarda os dois lados.** A nota de correção no próprio PO nomeia o termo
  antigo, como a tabela de harmonização faz com os termos do professor. Uma correção que
  apaga o que corrigiu não é proveniência — é edição.
- A âncora do **Ritmos** foi regerada duas vezes nesta rodada (na harmonização e no
  preview), e nenhuma delas mudou o conteúdo do ciclo.

**Com o quê.**
`professores/tiago/ciclos/ciclo-01-duo-po.md`, `…ciclo-01-relatorio-aula-01.md`,
`…ciclo-01-duo.fipp`, `…ciclo-01-ritmos-relatorio-aula-01.md`, `…ciclo-01-ritmos.fipp`,
`professores/tiago/cadernos/ciclo-01/caderno-01-duo.md`,
`professores/tiago/relatorios/ciclo-01/aula-01-duo.md`, `tools/hooks/commit-msg`.

**Referências.**
P-05 (proveniência), P-06 (registro descritivo), P-10 (linha de base), P-12 (apelidos),
P-21 (linguagem harmonizada).

**O que ainda não está feito.**
Ciclo da Débora; notação do Ritmos (depende do professor); gravações de referência e o
cruzamento fino entre passos e números (Ritmos); primeiro relatório pós-aula do Ritmos
(após 19/09); conferir os dois sites no Netlify.

## 19/09/2026 — Congelamento da infraestrutura

**O que aconteceu.**
A infraestrutura do Projeto Ciclo foi declarada congelada. O que está feito
(22 pétreas, 17 regras, ferramentas, templates, prompts) não muda por padrão.
Mudanças passam a exigir motivo declarado, commit próprio e entrada no
REGISTRO. A harmonização de linguagem foi institucionalizada como documento
estrutural obrigatório (P-17) e gerada para o Duo — faltava.

**O que foi decidido.**
- Congelamento declarado em `CONGELAMENTO.md`.
- Harmonização é obrigatória em todo ciclo com aulas.
- O que continua livre: conteúdo, POs novos, harmonizações.
- O que exige motivo: infraestrutura.
- **A verificação da P-17 virou código**, não declaração: o `check-pacote.js` reprova
  (erro, não aviso) ciclo com aula que não declare `harmonizacao` no `DOCS` ou que
  declare sem a fonte existir. A presença do `harmonizacao.html` já era exigida pelo
  `DOCS`; o novo é a checagem do manifesto e da fonte.
- **A P-17 é citada junto com a P-21 na checagem**, porque o texto da P-17 lista os
  artefatos do ciclo piloto **sem nomear a harmonização** — ela entrou nessa lista
  depois, pela P-21. Nenhuma pétrea foi alterada: a pétrea não se edita para caber no
  código; o código se explica.
- **A âncora do Duo mudou** (`ef0a60b08c97` → `a9ee549b18e6`) porque o conteúdo do
  ciclo mudou: o termo "cotovelos caídos" foi harmonizado no PO e o documento de
  harmonização entrou no `DOCS`.
- **A âncora do Ritmos também mudou** (`28df49bea510` → `16f5092e7120`) **sem o
  conteúdo dela mudar** — e isso é a regra funcionando, não um defeito: o
  `ciclo-01.conf` base é uma das fontes declaradas de qualquer variante, e foi nele
  que `harmonizacao` entrou no `DOCS` (o `.conf` da Duo não declara `DOCS`; herda o
  base). Foi por isso que o ciclo da Ritmos moveu: a fonte compartilhada mudou.

**Com o quê.**
`CONGELAMENTO.md`, `tools/check-pacote.js`, `professores/tiago/ciclos/ciclo-01-duo-harmonizacao.md`,
`professores/tiago/ciclos/ciclo-01.conf`, `professores/tiago/ciclos/ciclo-01-duo-po.md`
(a harmonização do termo e a nota de proveniência), `HANDOFF.md`.

**Referências.**
P-03/P-04 (proveniência acrescenta, não edita), P-05 (proveniência), P-17 (mesmos
artefatos do ciclo piloto), P-21 (linguagem harmonizada).

**O que ainda não está feito.**
Frente de conteúdo: revisão da Aula 01 do Duo (defeito do exercício no chão);
Aula 01 do Ritmos (19/09); caderno + relatório do Ritmos; Aula 02 do Duo.
E uma inconsistência declarada, para decisão da pesquisadora: a harmonização do
**Ritmos** diz que o plano e a aula-01 citam termos crus entre aspas e que "nenhum dos
dois entra em `DOCS` até essa decisão" — mas o `.conf` do Ritmos lista os dois em
`DOCS` desde então. Ou a nota fica, e os documentos saem; ou a decisão de harmonizar a
citação é tomada, e a nota é atualizada. Não mexi em nenhum dos dois.

## 19/09/2026 — Criptografia dos acompanhamentos (exceção pós-congelamento)

**O que aconteceu.**
A criptografia dos acompanhamentos foi implementada após o congelamento da
infraestrutura. Exceção justificada: decisão tomada antes do congelamento,
executada depois. Não altera o que existe — acrescenta componente novo. Os HTML
de acompanhamento por aluna passaram a ser publicados cifrados (PageCrypt): o
site pede senha para abrir cada um.

**O que foi decidido.**
- PageCrypt para criptografar os HTML de acompanhamento por aluna.
- As senhas **não ficam no repositório** (ele é público). Ficam em
  `tools/.senhas-locais` (não versionado, `chmod 600`).
- Se o arquivo não existir, o script pede a senha interativamente; sem terminal e
  sem senha ele **falha**, e o `check-pacote.js` reprova o pacote — um
  acompanhamento não chega ao site em claro.
- O `.conf` só declara `ACOMPANHAMENTO_CRIPTOGRAFADO="sim"` — sem valor.
- A criptografia roda **dentro do `gerar-ciclo.sh`**, depois de o HTML nascer e
  antes da validação. O `gerar-acompanhamento.sh` ganhou o modo
  `--criptografar`; o prompt previa essa etapa no script dos acompanhamentos,
  mas lá só existem os `.md` — o HTML nasce no gerador.
- A nota de harmonização do Ritmos foi atualizada (decisão 18/09: harmonização
  sempre, inclusive citações).

**Efeito colateral declarado.**
O HTML cifrado **não é determinístico**: cada execução usa sal e IV novos, então os
9 acompanhamentos mudam de bytes a cada geração — com a mesma senha e o mesmo
conteúdo. Regenerar o pacote deixa essas páginas "modificadas" no Git, e é por isso
que a árvore não fica limpa depois de gerar. O que não muda é o que a senha abre. A
segunda execução da criptografia sem regerar o HTML é recusada de propósito: sem
decifrar antes, ela cifraria a própria cifra e o arquivo deixaria de abrir.

**O que não está resolvido, e é o ponto sensível.**
A criptografia protege **o site**, não o conteúdo. Os mesmos acompanhamentos
continuam em claro em dois lugares do repositório público: o **PDF consolidado**
de cada ciclo (`ciclo-01-duo.pdf`, `ciclo-01-ritmos.pdf` — o gerador inclui os
acompanhamentos no PDF) e os **`.md` de origem**
(`professores/tiago/ciclos/ciclo-XX-<escola>-acompanhamento-<aluna>.md`, 19
arquivos rastreados). O conteúdo é pseudonimizado pelos apelidos (P-12) — não há
nome próprio nem dado clínico —, mas é o mesmo conteúdo. As duas saídas:

- **tirar os acompanhamentos do PDF** é uma linha no gerador (o PDF é montado de
  `$DOCS $ACOMP_DOCS`); o PDF não entra no hash, então a âncora não muda;
- **tirar os `.md` do repositório** (`.gitignore` + `git rm --cached`) é possível
  **sem tocar na cadeia FIPP**: `tools/lib-fontes.sh` os exclui do hash de
  propósito — são vista derivada do PO e dos relatórios, que são as fontes reais.
  O que continua necessário é tê-los em disco para o gerador montar o pacote antes
  de cifrar; quem clonar o repositório não os terá, e o pacote publicado (cifrado)
  é reconstruível a partir do PO e dos relatórios, que permanecem versionados.

Nenhuma das duas foi feita: as duas mudam o que o site publica, e a decisão é da
pesquisadora.

Também pendente, do mesmo tipo: uma linha residual de termo cru na tabela de
progressão do plano do Ritmos ("Braços caídos, desconectados" / "1ª alta demais",
`ciclo-01-ritmos-plano.md`) — registrada na harmonização daquele ciclo, não
reescrita por ser conteúdo publicado.

**Com o quê.**
`tools/gerar-acompanhamento.sh`, `tools/gerar-ciclo.sh`, `tools/check-pacote.js`,
`package.json` (dependência `pagecrypt`), `ciclos/*.conf`, `.gitignore`,
`tools/.senhas-locais` (não versionado), `tools/.senhas-locais.exemplo`,
`CONGELAMENTO.md`, `cadernos/README.md`,
`ciclo-01-ritmos-harmonizacao.md`.

**Referências.**
P-04 (proveniência), P-12 (apelidos), P-17 (artefatos do ciclo), P-21 (linguagem
harmonizada).

**O que ainda não está feito.**
Verificação no navegador (a pesquisadora testa: senha certa abre, errada não);
decisão sobre o PDF e os `.md` de acompanhamento; a linha residual do plano do
Ritmos.

## 19/09/2026 — Política de segurança dos dados sensíveis

**O que aconteceu.**
Depois da criptografia dos acompanhamentos (HTML), ficou claro que ela não
protegia tudo: o **PDF do ciclo** e os **`.md` versionados** expunham os mesmos
dados em texto claro. A verificação no PDF do Duo encontrou 17 ocorrências de
"Acompanhamento", com os apelidos e o conteúdo de cada aluna; os `.md` estavam
entre os arquivos rastreados do repositório público. A pesquisadora decidiu
proteger em camadas, em vez de apostar tudo numa só.

**O que foi decidido.**
- **Repositório privado** (GitHub) — camada 1, **ação manual da pesquisadora**.
- **PDF do ciclo sem acompanhamentos** — camada 2: o gerador passou a montar o
  consolidado só com `DOCS`, e não com `DOCS + ACOMP_DOCS`. O que era decisão de
  conteúdo ("o PDF do professor traz tudo") virou decisão de segurança.
- **Acompanhamentos `.md` fora do Git** — camada 4: `git rm --cached` nos 9
  arquivos + regra no `.gitignore`. São **vista derivada** do PO e dos
  relatórios, e o `gerar-acompanhamento.sh` os reescreve no disco **antes** de o
  pacote ser montado — nada depende de estarem versionados. A cadeia FIPP não é
  tocada: eles já ficavam fora do hash por construção (`tools/lib-fontes.sh`).
- **HTML cifrado** (PageCrypt) — camada 3, em vigor desde a entrada anterior.

**Com o quê.**
`tools/gerar-ciclo.sh`, `.gitignore`, `CONGELAMENTO.md`, os dois pacotes
regerados (o PDF deixa de publicar as páginas de acompanhamento).

**Referências.**
P-04 (proveniência), P-12 (apelidos), P-22 (restrição e dado sensível).

**O que ainda não está feito.**
A camada 1 (repositório privado) é ação manual da pesquisadora, no GitHub. O
push aguarda: só depois de a segurança estar fechada. A publicação do caderno no
pacote é a etapa seguinte.

## 19/09/2026 — Caderno publicado e incluído no hash

**O que aconteceu.**
O caderno passou a ser publicado no pacote (HTML + PDF) e a ser fonte do hash
FIPP. Antes, ficava fora por decisão do `cadernos/README.md` ("a ausência de
forma final é parte da função"). O índice do Duo foi alinhado à taxonomia nova do
menu — e o item 5 do mesmo README, que afirmava o oposto do item 3, foi corrigido
junto: um guia que se contradiz não orienta ninguém.

**O que foi decidido.**
- O caderno entra no `DOCS` do ciclo. Foi preciso declará-lo nos **dois**
  manifestos (`ciclo-01.conf` **e** `ciclo-01-ritmos.conf`): o da variante
  sobrescreve o base, então pôr só no base não chegaria ao Ritmos.
- O `tools/lib-fontes.sh` ganhou o caso do caderno em `fonte_md()`, como já tinha
  o do `guia-do-professor`. É a definição **única** de fonte, compartilhada pelo
  gerador e pelo hasher: o caderno passa a ser copiado para o pacote e contado no
  hash sem nenhum caminho paralelo — que foi justamente a divergência que fez o
  pacote do Ritmos sair com o plano do Duo.
- O `rotulo()` e a geração do HTML ganharam tratamento porque o caderno **não tem
  front-matter** (é registro, não documento): o rótulo do menu vem do nome do
  documento ("Caderno") e o título da página é declarado na geração — sem isso o
  menu sairia vazio e a aba do navegador diria "ciclo-01-caderno-01".
- A regra 3 do `cadernos/README.md` foi atualizada, e com ela o item 5.

**Com o quê.**
`ciclos/ciclo-01.conf`, `ciclos/ciclo-01-ritmos.conf`, `tools/lib-fontes.sh`,
`tools/gerar-ciclo.sh`, `cadernos/README.md`, `ciclos/ciclo-01-index.md`, os dois
pacotes regerados.

**Referências.**
P-04 (proveniência), P-06 (registro descritivo), P-17 (artefatos do ciclo).

**O que ainda não está feito.**
Repositório privado (ação manual da pesquisadora — pendente). O caderno **não** é
listado no índice: o índice cobre os documentos pedagógicos, e o caderno e os
acompanhamentos por aluna aparecem no menu, no grupo "Acompanhamento".

## 19/09/2026 — Método, README-ciclos e campos de duração

**O que aconteceu.**
O `METODO.md` foi criado — a visão de mundo que o projeto pressupunha e não
declarava: o método é o norte, a aula é o caminho; o planejamento é feito sobre
pessoas reais. O `README-ciclos.md` teve os números desatualizados corrigidos
(seis, e não três — o caderno entrou no pacote e envelheceu os que sobravam). Os
campos de volume do relatório e da captura passaram a medir **duração em
minutos**, porque o professor não conta tempos musicais na aula.

**O que foi decidido.**
- **O volume continua em tempos** (Regra 5) — e a **duração, em minutos, calibra
  a faixa** (Regra 9, Pré-requisito 4). Nenhuma das duas regras foi tocada.
- O relatório e a captura medem **duração executada** (minutos). O campo existia
  em **quatro arquivos**, não em dois: além do relatório e do fecho da captura
  do Ritmos, também o Funcional do relatório do Duo, a coluna do Bloco 3 das
  duas capturas e o fecho da captura do Duo.
- **O caderno entrou na mesma unidade** (decisão da pesquisadora): ele registrava
  "Volume: planejado 120, executado 120" e "volume 120" por aluno. Sem isso, o
  caderno — que hoje é fonte do hash e página publicada — ficaria dizendo
  "volume" ao lado de um relatório que diz "duração executada".
- O `METODO.md` fica **congelado** (mudar exige motivo declarado).
- O repositório está **privado** — camada 1 da política de segurança, fechada.

**Com o quê.**
`METODO.md`, `README.md`, `CONGELAMENTO.md`, `README-ciclos.md`,
`relatorios/ciclo-01/aula-01-{duo,ritmos}.md`,
`ciclos/ciclo-01-{duo,ritmos}-captura-aula-01.md`,
`cadernos/ciclo-01/caderno-01-{duo,ritmos}.md`, os dois pacotes regerados.

**Referências.**
P-01 (ciclo é PO latente), P-02 (PO vem do ciclo anterior), P-06 (registro
descritivo), P-10 (linha de base), Regra 1 (método como referência), Regra 5
(unidade explícita), Regra 9 (faixa por duração).

**O que ainda não está feito.**
O push (aguardando confirmação da pesquisadora). E dois pontos de defasagem no
`README-ciclos.md` que **não** são números e ficaram fora do escopo desta rodada,
declarados para decisão: a tabela "Escopos" lista 10 dos ~24 escopos que o hook
`commit-msg` aceita (é a tabela que faz alguém errar o escopo do commit), e o
bloco "Criar um ciclo novo" traz caminhos e comandos que não existem mais.

## 19/09/2026 — README-ciclos: escopos e criação de ciclo

**O que aconteceu.**
Os dois pontos de defasagem declarados na entrada anterior — os que **não** eram
números — foram corrigidos. A tabela "Escopos" passou a listar os **24** escopos
que o hook `commit-msg` aceita (listava 10; é a tabela que faz errar o escopo do
commit, e errou duas vezes hoje), e o bloco "Criar um ciclo novo" deixou de trazer
caminhos que não existem (`ciclos/` na raiz) e um comando que o gerador não aceita
mais (`tools/gerar-ciclo.sh 02`, sem professor e sem escola).

**O que foi decidido.**
- O bloco de criação de ciclo passa a declarar o passo que mais causa erro — o
  `DOCS` precisa entrar nos **dois** manifestos, porque o da variante sobrescreve
  o base — e aponta o caderno como fonte que vive fora da pasta do ciclo.

**Com o quê.**
`README-ciclos.md`.

**O que ainda não está feito.**
O push (aguardando confirmação da pesquisadora).

## 19/09/2026 — Correções cosméticas

**O que aconteceu.**
Quatro pendências declaradas foram fechadas. O exemplo de restrição física no
`METODO.md` ficou genérico. A nota do preview do relatório passou a apontar o
arquivo real — e descobriu-se que o **Duo também estava em tempo futuro**: o
prompt supunha que o Duo já tinha resolvido isso, e o que foi atualizado em 18/09
foi a nota do **PO**, não a do preview. Corrigidos os dois. A linha residual de
termo cru no plano do Ritmos foi harmonizada. E o escopo `metodo` passou a existir
no hook.

**O que foi decidido.**
- O `METODO.md` continua **congelado** — mudanças com motivo declarado (esta foi
  uma: o exemplo coincidia com dois casos reais).
- O escopo `metodo` passa a existir no hook `commit-msg`.
- A **mensagem de erro** do mesmo hook foi corrigida: listava 10 escopos enquanto
  a regra aceitava 24, e foi ela que fez escolher dois escopos errados hoje
  (`cadernos`, `congelamento`). Agora lista a lista completa e aponta a variável
  `$escopos`, que é a fonte.
- A rubrica é **nível de avaliação**, não descrição de pessoa: o que se harmonizou
  na tabela de progressão foi o vocabulário do nível, e isso ficou registrado na
  harmonização do ciclo.

**Com o quê.**
`METODO.md`, `ciclos/ciclo-01-ritmos-relatorio-aula-01.md`,
`ciclos/ciclo-01-relatorio-aula-01.md`, `ciclos/ciclo-01-ritmos-plano.md`,
`ciclos/ciclo-01-ritmos-harmonizacao.md`, `tools/hooks/commit-msg`, os dois
pacotes regerados.

**O que ainda não está feito.**
O push — agora é o único item aberto da infraestrutura.

## 19/09/2026 — Varredura de marcas de indecisão

**O que aconteceu.**
Os documentos dos dois ciclos foram varridos em busca de marcas de indecisão
(`[a decidir]`, `em aberto`, `[Preencher]`, `[conferir]`). A varredura achou 78
linhas com marca, em 14 arquivos, e **15 arquivos limpos** — e classificou cada
uma em três tipos, não dois:

- **inconsistência** — a marca tinha resposta deliberada em outro lugar;
- **pendência legítima** — depende do professor ou de dado futuro;
- **decisão da pesquisadora** — nem uma coisa nem outra: o texto endereçava a
  pergunta a ela (a proporção por blocos), e era dela a resposta.

**O que foi decidido.**
- **Notação do Ritmos:** corrigida. A referência dizia *"nenhum sistema de
  notação foi adotado para este ciclo"* — falso, porque o ciclo publica o
  documento de notação e o glossário. A decisão estava na **P-15** (a notação
  segue a metodologia declarada: RAD usa Benesh) e na **P-16**. A resposta do
  professor (*"Notação: [a decidir]"*) continua citada como proveniência; o
  material bruto não foi tocado (P-05).
- **Divisão do sábado:** o `aula-01.md` declarava a divisão e, três linhas
  depois, pedia de novo o que estava dito. A marca saiu; o `.conf` já a definia.
  E a decisão fechou o modelo que estava aberto desde a investigação do volume:
  **a aula de 19/09/2026 cobre as aulas 01 e 02** (bloco contínuo de 120 min).
- **Proporção por blocos:** virou **nota da Regra 9** — a proporção se aplica em
  **minutos** (distribuição do tempo de aula), e o volume planejado permanece em
  tempos. É a mesma unidade da decisão dos campos de duração.
- **Duo (notação e glossário):** verificados. A Regra 8 **já estava satisfeita** —
  os dois declaram em prosa a natureza do registro ("código didático do ciclo"),
  as fontes e os limites ("Limites do registro"). O que faltava era dizer **de
  quem é a notação em forma completa**; a pedido da pesquisadora, cada documento
  ganhou uma **Nota (P-15)**, sem renomear nada.
- As **pendências legítimas foram mantidas** — as 12 da musicalidade do Duo, as
  13 da notação do Ritmos, as gravações de referência, os marcos 02–21, os
  `[conferir]` de edição/ano. Nenhuma foi apagada.

**Com o quê.**
`ciclos/ciclo-01-ritmos-referencias.md`, `ciclos/ciclo-01-ritmos-aula-01.md`,
`ciclos/ciclo-01-ritmos-plano.md`, `ciclos/ciclo-01-notacao.md`,
`ciclos/ciclo-01-glossario-benesh.md`, os dois pacotes regerados.

**O que ainda não está feito.**
O push.

## 19/09/2026 — METODO no pacote e reorganização do menu

**O que aconteceu.**
O `METODO.md` passou a aparecer no pacote (Área do Professor). O menu foi
reorganizado: "Acompanhamento" fica só com conteúdo real (acompanhamentos
por aluna + caderno); "Área do Professor" ganha as ferramentas (preview do
relatório + captura) e os guias (METODO).

O preview do relatório passou a se chamar **"Guia de observação — Aula NN"** no
menu, na aba, no cabeçalho e na seção do PDF. O `title:` da fonte dizia
"Relatório pós-aula 01 — Duo (preview)", e no menu ainda se lia como se fosse o
**relatório preenchido** — que é outro documento, e está fora do pacote. O
rótulo é declarado no gerador, não na fonte: a fonte entra no hash, o rótulo não.

O caderno tinha a mesma lacuna do METODO no PDF: sem front-matter, a seção saía
como `caderno-01`. Agora sai "Caderno — Ciclo 01 · Duo" (e "… · Ritmos e
Movimento") — o mesmo nome que a página mostra. Foi o `check-pacote` que apontou
a divergência: ele compara o título de cada página HTML com o texto do PDF.

**O que foi decidido.**
* O `METODO.md` entra no pacote como documento compartilhado (como o
  `guia-do-professor`). Não entra no hash.
* "Acompanhamento" = conteúdo; "Área do Professor" = ferramentas e guias.
* O relatório preenchido continua fora do pacote.
* O acompanhamento por aluna continua como vista.
* Rótulo de menu e título de página de documento sem front-matter são declarados
  **no gerador**, não acrescentados à fonte (a fonte é congelada e entra no hash).

**As âncoras FIPP foram regeradas (reancoragem declarada).**
O `METODO.md` **não** entra na cobertura da âncora — como o `guia-do-professor`:
vive fora do ciclo, e o hasher só aceita caminho sob `professores/<professor>/`
(0 referências na âncora). Mas o `hash_conteudo` mudou, porque o
`fontes_do_ciclo()` inclui **os dois manifestos**, e o `DOCS` de cada variante
passou a declarar `metodo`:

| Variante | hash_conteudo | hash |
|:--|:--|:--|
| duo | `cc1c3ad8c872…` → `05a471fb0233…` | `4ded616d92a1…` → `e9dbdd33bb39…` |
| ritmos | `38a1f2a50a6c…` → `8ce229646c9f…` | `1059d02874da…` → `72922e303930…` |

Não é escolha: para publicar um documento é preciso declará-lo em `DOCS`, e o
manifesto é fonte hasheada. O `pre-commit` recusaria o commit com a âncora antiga
(`hash-ciclo.sh --check`). A **lógica** de hash não foi alterada — a âncora foi
regerada, que é o caminho previsto (P-03: o passado não é reescrito, é
incorporado).

**Com o quê.**
`METODO.md`, `tools/gerar-ciclo.sh`, `tools/lib-fontes.sh`, `ciclos/ciclo-01.conf`,
`ciclos/ciclo-01-ritmos.conf`, os dois pacotes regerados.

**O que ainda não está feito.**
O experimento `captura-json` (em andamento).

**Referências.**
`CONGELAMENTO.md` (documentos congelados; alterar hash/validação/geração exige
motivo declarado); `README-ciclos.md` (menu e escopo); `tools/hooks/commit-msg`.

## 2026-09-20 — O guia de observação passa a se chamar o que ele é

**O que motivou.** O item de menu *"Guia de observação — Aula 01"* vinha de uma chave chamada
`relatorio-aula-01`: o arquivo, o `.md` e o `title:` da fonte diziam "Relatório pós-aula … (preview)", e o
rótulo era corrigido **no gerador** para disfarçar. Quem procurava *o relatório* no menu (ou *o guia*) se
perdia — e a chave ainda **colidia** com o nome que o relatório usa no experimento `captura-json`
(`relatorio-aula-NN-<escola>.md`, que **lá** é o relatório de verdade).

**O que foi decidido.**
* A chave passa a ser **`guia-de-observacao-<NN>`** — uma por aula, como as demais vistas por aula.
* O `title:` **da fonte** diz o que o documento é, e o **remendo do gerador saiu**: a razão dele era a chave
  mentirosa, e com a chave honesta o rótulo vem da fonte, como em todo documento com front-matter.
* Com isso, **`relatorio-aula-<NN>` volta a significar só o relatório** — o que a arquitetura da captura
  propõe gerar sob demanda (`ARQUITETURA-CAPTURA.md`, nova seção; `IDEIA-CAPTURA.md`, nota).
* As duas páginas órfãs (`relatorio-aula-01.html`, nos dois pacotes) foram **removidas**.

**As âncoras FIPP foram regeradas.** A âncora cobre os dois manifestos e os `.md` do ciclo — renomear fonte
muda o hash, e isso é o previsto (a âncora alinha; o passado não se reescreve, se incorpora):

| Variante | hash_conteudo | hash |
|:--|:--|:--|
| duo | `05a471fb0233…` → `590dc1c05be9…` | `e9dbdd33bb39…` → `6b60d0fc6848…` |
| ritmos | `8ce229646c9f…` → `64846cf0bd37…` | `72922e303930…` → `3aeaa3b6f3b1…` |

**Com o quê.**
`tools/gerar-ciclo.sh` (o caso do rótulo saiu; a **Área do Professor**, o grupo, o **PDF** e o **preview**
passam a citar `guia-de-observacao-*`), `ciclos/ciclo-01.conf`, `ciclos/ciclo-01-ritmos.conf`, as **duas
fontes renomeadas**, `professores/tiago/relatorios/README.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`,
os dois `guia-de-observacao-01.html` (novos), as duas páginas órfãs (removidas), os dois `.fipp` (regerados) e
os dois pacotes regerados — **`OK: 0 erro(s), 5 aviso(s)`** em ambos (os avisos são do glossário, antigos).

**O que ainda não está feito.**
* **O deploy** — o pacote regenerado **não** foi publicado; o deploy é do dono.
* O **relatório** continua escrito à mão; a geração sob demanda é a ideia do `captura-json` (não implementada).
* O **guia** também continua escrito à mão: ele **já é** derivado de PO + Aula no conteúdo, mas quem o
  escreve é a pesquisadora — a geração sob demanda não está implementada.

**Referências.**
`CONGELAMENTO.md` (alterar geração ou menu exige motivo declarado + commit próprio + esta entrada);
`REGRAS.md` 8 (proveniência objetiva), 16 (formato de entrega) e 17 (versionamento com Git);
`PROTOCOLO.md` P-03/P-04 (a âncora alinha; o passado não é reescrito, é incorporado).

## 2026-09-20 — O contrato de extração passa a ler tabela

**O que motivou.**
O guia de observação e a musicalidade derivam de duas entradas — o PO e o **plano** —, e automatizar
depende de ler as duas. O contrato de extração (`## Seção → campo`, `- item → array`) **não lê
tabela**: cada linha virava UMA string (`célula · célula`). Não é detalhe — é o impedimento: **6 dos
7 blocos que o guia consome no plano estão em tabelas** (identificação, marcos por aula, calibração
do volume, distribuição do volume, rubrica, critério de extensão), e a `linhaDeBase` do PO também.
Foi por isso que ela teve de ser estruturada **à mão** no experimento — o `po-01.json` declara o
motivo no próprio arquivo.

**O que foi decidido.**
- Regra nova, declarada: **tabela cujo bloco tem campo ARRAY vira um array de objetos** — uma linha
  de dados por objeto, o cabeçalho como chaves.
- A chave é um **identificador**: `**negrito**` fora, acento fora, não-alfanumérico vira fronteira,
  camelCase (`Dimensão` → `dimensao`, `Em desenvolvimento` → `emDesenvolvimento`).
- A **linha de separação** (`:---`) passa a ser ignorada de fato. Ela **vazava** para dentro dos
  campos string — `:-- · :--` estava dentro do `contexto` do PO do Duo —, porque o teste antigo
  removia `:`, `-` e espaço e depois casava `^-+$`, o que nunca casa. A correção tira esse ruído do
  texto extraído, sem mudar tipo nem presença de campo.
- `\|` dentro da célula é escape (não divide a célula); a célula vazia mantém a posição.
- Só a **primeira** tabela do bloco entra no campo; uma segunda tabela no mesmo bloco fica de fora
  e gera **aviso** — o contrato não escolhe qual é o campo: o documento precisa dar a cada tabela o
  seu bloco.
- `linhaDeBase` no schema do PO passa de `string` para **array de objetos** (P-10): era a forma do
  bloco, declarada à mão no experimento.
- `node tools/validar-po-ciclo.js <schema> <po.md> [--json]` — o `--json` despeja o objeto
  extraído (o extrator e o validador são o mesmo código). O `po-01.json` registrava essa saída como
  a que faltava.

**O que se mediu.**
- PO do Duo: `linhaDeBase` sai com **3 objetos** — `dimensao`, `oQueAsAlunasTrazem`, `oQueFalta`,
  `oQueJaDominam` — mais 15 itens de texto (a prosa do bloco). Dois avisos: a segunda tabela do
  bloco (a "por aluna", 4 linhas) ficou de fora; 15 de 18 itens não são objeto.
- PO da Ritmos: a linha de base é prosa e lista — **não é tabela**: 23 de 28 itens não são objeto.
  Os 5 objetos que saíram são a tabela das **restrições físicas (P-22)**, que está DENTRO do bloco
  da linha de base. É o mesmo achado do outro lado: cada tabela precisa do seu bloco.

**O que ainda não está feito.**
- Os dois POs **não** foram reescritos: os avisos apontam o que falta em cada um, e nenhum aviso
  reprova commit nem validação.
- O **extrator do plano** (o irmão) — próximo passo. Ele depende deste contrato, e o
  `plano-01.json` escrito à mão **não é uma extração: é uma leitura** (chaves renomeadas, coluna
  descartada, valores convertidos, e o calendário que não está no `.md`).
- O contrato vive **dentro** de `validar-po-ciclo.js`: para o irmão compartilhar o mesmo contrato —
  e não divergir, como os dois resolvedores de fonte que geraram o `lib-fontes.sh` — ele terá de
  sair para uma lib.

**Com o quê.**
`tools/validar-po-ciclo.js`, `ciclos/ciclo-01-po-schema.json`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar validação exige motivo declarado, commit próprio e
esta entrada); `PROTOCOLO.md` P-08 (o schema é do ciclo), P-10 (linha de base); `REGRAS.md` 8
(proveniência objetiva), 16 (formato de entrega) e 17 (versionamento com Git);
`experimentos/captura-json/po-01.json` (o motivo, declarado no próprio arquivo).

## 2026-09-20 — O índice da página sai do topo e vai para a direita, preso

**O que motivou.**
O índice da própria página (*"Nesta página"*) era um bloco no **topo** do conteúdo: para
voltar a ele era preciso rolar de volta, e numa página longa — a Aula 01 e o Plano têm 20+
seções — a navegação se perdia no meio da leitura. O pedido era: *à direita, fixo, para
rolar a página sem perder a navegação*.

**O que foi decidido.**
- O índice vira uma **coluna à direita, presa abaixo da navbar** (`position: sticky`) a
  partir de **1200px de largura**. Abaixo disso continua o bloco do topo: não há largura
  para duas colunas, e a medida de leitura não pode encolher para caber o índice.
- Quem decide é a **largura**, não o dispositivo — tablet largo, janela estreita e tela
  cheia seguem o mesmo critério.
- O contêiner da página alarga (900px → 1180px) **só quando há duas colunas**; a coluna de
  texto mantém os **900px** (a medida de leitura da Regra 16 não muda, e o cabeçalho e o
  rodapé continuam alinhados à esquerda com o texto).
- O DOM **não muda de ordem**: o índice continua *antes* do corpo — quem navega por teclado
  ou leitor de tela o encontra primeiro — e o CSS o coloca na coluna 2.
- O `.rail` (o invólucro da coluna) existe porque o elemento preso precisa de um pai mais
  alto para ter para onde subir: a coluna da grade estica, o índice não.
- `@media print` devolve o índice ao fluxo: no papel não há rolagem.

**O que se mediu.**
16 das 20 páginas de **cada** pacote carregam a coluna (são as 16 do template do ciclo; as
4 de acompanhamento são outro template, cifrado, e não têm este bloco). Os dois pacotes
regerados: **OK: 0 erro(s), 5 aviso(s)** em cada um.

**O que ainda não está feito.**
- **Não houve conferência visual** — não há navegador nesta máquina. A regra foi escrita
  para não depender de nada além da largura, e o comportamento em tela estreita é
  exatamente o de antes; a conferência visual é do dono.
- O **deploy** do pacote regerado é do dono.

**Com o quê.**
`tools/templates/ciclo.html`, `tools/templates/ciclo.css`, `README-ciclos.md`, os dois
pacotes regerados (HTML + `assets/style.css`).

**Referências.**
`CONGELAMENTO.md` (tools/templates é congelado: alterar exige motivo declarado, commit
próprio e esta entrada); `REGRAS.md` 16 (Formato de entrega — índice, links, navegação);
`README-ciclos.md` (*Regras de navegação implementadas*).

## 2026-09-20 — O contrato de extração vira lib (definição única)

**O que motivou.**
O passo seguinte da automação é o **extrator do plano** — irmão do `validar-po-ciclo.js`, com o
**mesmo** contrato de extração. Duplicar o contrato seria repetir, no mesmo dia, a divergência que
criou o `lib-fontes.sh`: o gerador e o hasher resolviam as fontes cada um do seu jeito, e o pacote
da Ritmos saiu com o plano da Duo. Dois documentos do mesmo tipo — PO e plano são Markdown com
`## Seção`, `### Subcampo`, listas e tabelas — não podem ter duas leituras.

**O que foi decidido.**
- O contrato passa a viver em **`tools/lib-extracao-md.js`**: `extrair`, a regra de tabela e as suas
  partes (`celulasDaLinha`, `semEnfase`, `textoDaCelula`, `chaveDaColuna`, `ehSeparador`),
  `lerYamlCabecalho`, `normalizar`, `tipoDe`.
- O **mapa das seções** (título em português → campo do schema) **não** vai para a lib: ele é DO
  DOCUMENTO e entra por argumento — `extrair(linhas, schema, mapaSecoes)`. A lib é o contrato; cada
  documento declara os seus nomes e o seu schema.
- O código movido **não foi redigitado**: o bloco saiu do arquivo por recorte (`sed` sobre a versão
  ancorada), e a única mudança de texto foi a assinatura (`schema, mapaSecoes`) e a linha que lê o
  mapa.

**O que se mediu (a prova da refatoração).**
Sem mudança de comportamento: a extração `--json` dos dois POs saiu **byte a byte idêntica** à de
antes — `duo 91358ce4da13f9f8fe8bc9e9e802eac1`, `ritmos c4aaeae9bdc0f0ef2ae07856fcc528f7`, os mesmos
MD5 do snapshot anterior —, com o resumo humano idêntico (avisos, provisórios, estado) e exit 0.
`node --check` passa nos dois arquivos. `validar-po-ciclo.js` foi de **384 → 170 linhas**; a lib tem
**264**.

**O que ainda não está feito.**
- O **extrator do plano** (o irmão) — próximo passo.
- O **mapa de colunas** (cabeçalho da tabela → chave do alvo) e a regra de **tabela item/valor →
  objeto**: são as duas DECLARAÇÕES que ainda não existem.
- O contrato da lib ainda não é exercitado por um teste próprio: hoje quem o prova são os dois POs
  (e, de agora em diante, também o plano).

**Com o quê.**
`tools/lib-extracao-md.js` (novo), `tools/validar-po-ciclo.js`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `tools/lib-fontes.sh` (a divergência da mesma classe, e o precedente); `REGRAS.md` 8
(proveniência objetiva), 16 (formato de entrega) e 17 (versionamento com Git).

