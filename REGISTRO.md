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

## 2026-09-20 — O contrato ganha as duas declarações (mapa de colunas e item/valor)

**O que motivou.**
Com o contrato na lib, faltavam as duas coisas que ele **não pode adivinhar** — e sem elas o plano
sai inutilizável: (1) o **nome das chaves** (o documento diz `Aula` e `Objetivo específico (marco
parcial)`; o alvo quer `n` e `marco`) e (2) a **forma** de um bloco cuja tabela é `| Item | Valor |`
— essa é um **objeto**, não um array de objetos.

**O que foi decidido.**
- A declaração do documento passa a ser **um objeto**: `extrair(linhas, schema, { secoes, colunas,
  pares })` — assim os mapas novos entram sem mexer na assinatura outra vez.
- `colunas`: chave **derivada** (do cabeçalho da tabela, ou do rótulo do par) → chave do alvo.
  É **declaração, não leitura**: o contrato não interpreta o texto — só aceita o nome que o
  documento declara.
- `pares`: os blocos cuja tabela é **item/valor**. O **valor** do mapa é o **campo que recebe** o
  objeto — `{ objetivoGeral: 'ciclo' }` —, porque no plano a identificação do ciclo está sob
  "Objetivo geral": um bloco pode ter prosa num campo e tabela noutro.
- O PO usa a mesma declaração (`oQueAsAlunasTrazem → trazem`, `oQueFalta → falta`,
  `oQueJaDominam → dominam`).

**O que se mediu.**
- PO do Duo: a linha de base passa a sair `{ dimensao, trazem, falta, dominam }` — **exatamente as
  chaves do `po-01.json` escrito à mão**. É a ÚNICA mudança: o diff contra o snapshot são as 9
  linhas (3 chaves × 3 dimensões), e o resumo humano e o exit code seguem iguais. O PO da Ritmos
  saiu **idêntico** (a linha de base dela é prosa, não tabela).
- Plano, prova local (`experimentos/captura-json/provar-declaracoes.js`, não versionado): com as
  duas declarações, `## Marcos parciais por aula` sai com os **12 objetos `{ n, marco }`** e a
  tabela de identificação sai como **`ciclo`**, com as 6 chaves (`duracaoAulas`, `duracaoMinutos`,
  `inicio`, `encerramento`, `volumeAtivoPorAula`, `professor`) — **sem tocar no documento**.

**O que ainda não está feito.**
- O **irmão** (o extrator do plano) e o **schema do plano** — próximo passo.
- As **conversões de valor** (`"60 minutos (Pré-requisito 4)"` → `60`; `"01"` → `1`) e as
  diferenças de **tipografia** (`17/09/2026` × `2026-09-17`; travessão `–` × `-`): declará-las
  exigiria regras de leitura, e a decisão foi **não ler prosa**.

**Com o quê.**
`tools/lib-extracao-md.js`, `tools/validar-po-ciclo.js`, `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `REGRAS.md` 8 (proveniência objetiva), 16 (formato de entrega) e 17 (versionamento com
Git); `experimentos/captura-json/provar-declaracoes.js` (a prova, local).

## 2026-09-20 — O extrator do plano (o irmão), e o diff classificado

**O que motivou.**
O guia de observação deriva do PO e do **plano**; o PO já tinha extrator. Faltava o irmão: o mesmo
contrato, o schema do plano e a declaração dos nomes — e, com ele, a resposta à pergunta que
decidia a automação: **as duas regras de declaração bastam?**

**O que foi decidido.**
- `tools/validar-plano-ciclo.js` (novo): o irmão. Usa o contrato compartilhado
  (`tools/lib-extracao-md.js`), declara o mapa das seções, o das colunas e o bloco item/valor, e
  valida contra o schema. `--json` despeja o objeto extraído.
- `ciclos/ciclo-01-plano-schema.json` (novo): os campos do plano, com os **tipos que o documento
  oferece** — `n` é `"01"`, `duracaoMinutos` é `"60 minutos (Pré-requisito 4)"`. O extrator devolve
  o que está escrito; converter exigiria ler prosa.
- **As lacunas são declaradas**: o que o documento não tem em forma de dado sai `[Preencher: …]` —
  no campo (o `calendario`, que é do `.conf`) ou em `_lacunas` (o `rubrica.aplicadaEm`, cuja casa
  seria um array). Não se lê prosa.
- O contrato ganhou a linha que o plano exigia: **comentário HTML não é conteúdo** — o
  `<!-- CALENDARIO -->` virava o TEXTO da seção, e a lacuna do calendário nunca apareceria. Nos
  POs não há comentário algum: a extração deles saiu **idêntica** (verificado).

**O que se mediu (o diff classificado).**
`experimentos/captura-json/diff-classificado.js` (local) compara o `--json` com a referência
`plano-01.json` e classifica cada diferença. **Nenhuma diferença ficou sem classe:**
`15 iguais · 42 tipografia · 11 conversão · 2 leitura · 1 lacuna · 11 só-no-extrator · 5 forma ·
2 do leitor`.
- **tipografia** (42): a referência foi digitada em ASCII — acento fora, `1a` por `1ª`, hífen por
  travessão. É a maior parte, e não é erro de nenhum dos dois.
- **conversão** (11): a referência usa número (`1`, `60`); o documento escreve texto (`"01"`,
  `"60 minutos (Pré-requisito 4)"`).
- **leitura** (2): o dado existe, mas só em prosa — `extensivelAte` (o texto diz "extensível a
  16") e a `proveniencia`, que a referência **condensou**.
- **lacuna** (1): `professor` — o documento ainda diz `[Nome do professor]`.
- **forma** (5): a referência tem outra forma (o volume como mapa; a `rubrica` envolvendo os
  critérios; o `calendario`; `condicoesPreliminares`) — e o `aplicadaEm`, que é prosa.
- **só no extrator** (11): a prosa que fica DENTRO dos arrays (o preâmbulo dos marcos, as duas
  linhas da rubrica, a lista numerada da estrutura) — o aviso "item que não é objeto" aponta isso.
- **do leitor** (2): `_fonte` e `_nota`, que a referência acrescentou.

**A resposta.** As duas regras de declaração **bastam para a FORMA**: os marcos saem `{ n, marco }`,
a linha de base do PO sai `{ dimensao, trazem, falta, dominam }` (as chaves da referência), a
rubrica sai com os cinco nomes do cabeçalho e o `ciclo` sai como objeto. O que resta **não é
forma**: é tipografia da referência, conversão que exigiria ler, prosa e lacuna — cada uma
declarada, não adivinhada.

**O que ainda não está feito.**
- Nada no fluxo de produção consome o extrator do plano: quem gera o guia e a musicalidade hoje é
  o experimento `captura-json`. Ligar isso é o passo seguinte.
- As conversões (número, data ISO) e a limpeza da prosa que fica nos arrays ficam **fora, por
  decisão**: converter é ler.
- O schema do plano **não** está no pre-commit: o plano ainda não é validado automaticamente.

**Com o quê.**
`tools/validar-plano-ciclo.js` (novo), `ciclos/ciclo-01-plano-schema.json` (novo),
`tools/lib-extracao-md.js` (o comentário HTML), `REGISTRO.md`, e — locais, não versionados —
`experimentos/captura-json/provar-declaracoes.js` e `diff-classificado.js`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `REGRAS.md` 8 (proveniência objetiva), 10 (estrutura de ciclos), 16 (formato de entrega)
e 17 (versionamento com Git); `PROTOCOLO.md` P-08 (o schema é do ciclo); `ARQUITETURA-CAPTURA.md`
(os entregáveis derivados de PO + plano).

## 2026-09-20 — O laço de validação vira lib (a segunda definição única)

**O que motivou.**
O laço de validação — campos obrigatórios, tipos, subcampos, os avisos da regra de tabela e os
provisórios `[Preencher]` — estava **duplicado** nos dois validadores (`validar-po-ciclo.js` e
`validar-plano-ciclo.js`). É a **mesma classe de risco** que a primeira lib fechou: duas cópias
divergem na primeira regra nova — e foi uma divergência assim que criou o `lib-fontes.sh`.

**O que foi decidido.**
- `tools/lib-validacao-md.js` (novo): `validar(campos, schema, opcoes)` devolve
  `{ ok, erros, avisos, provisorios, lacunas, extras }`.
- A FRASE do array vazio vem de `opcoes.arrayVazio`, porque ela é do **documento**: o PO fala do
  recorte ("o recorte precisa de ao menos um item"), o plano não diz nada — e as duas saídas
  continuam exatamente as de antes.
- `_algo` é **metadado**, não campo do schema: entra em `lacunas` (a convenção `_lacunas`, dos
  entregáveis que declaram o que não têm) e **nunca** conta como extra.
- **Desvio declarado** do que o pedido supunha: as lacunas saem em campo **próprio**, e não
  dentro de `avisos`. Dentro de `avisos`, o validador do plano ganharia uma linha por lacuna — e a
  prova pedida é byte a byte. Quem quiser a linha, usa a lista: é uma linha no tool.

**O que se mediu (a prova da refatoração).**
**42 arquivos** — `stdout`, `stderr` e `exit code` de **14 invocações** dos dois tools (os
caminhos felizes, os `--json`, os dois planos, o campo obrigatório ausente, o uso sem argumento, o
schema ilegível, o schema sem `required`) — capturados ANTES e DEPOIS: **`diff -r` vazio**, byte a
byte. Os três `node --check` passam. O laço não existe mais em nenhum dos dois tools (`grep` por
`erros.push`/`avisos.push`/`provisorios.push` não acha nada) e os dois importam as duas libs.
`check-pacote`: **OK 0 erro(s), 5 aviso(s)** nos dois ciclos.

**O que ainda não está feito.**
- A lib **não tem teste próprio**: quem a prova são os documentos e a captura.
- O que os documentos **não** exercitam (a frase do array vazio, `lacunas`, `extras`) foi
  conferido por chamada direta à lib, e não por um caso da captura.

**Com o quê.**
`tools/lib-validacao-md.js` (novo), `tools/validar-po-ciclo.js`, `tools/validar-plano-ciclo.js`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `tools/lib-fontes.sh` e `tools/lib-extracao-md.js` (os precedentes, e a mesma classe de
erro); `REGRAS.md` 8 (proveniência objetiva), 16 (formato de entrega) e 17 (versionamento com
Git).

## 2026-09-20 — O pre-commit passa a validar o PLANO (schema + tipos)

**O que motivou.**
O pre-commit validava o **PO** automaticamente desde que o PO existe; o **plano** não era
validado — o schema existia (`professores/tiago/ciclos/ciclo-01-plano-schema.json`), o validador existia
(`tools/validar-plano-ciclo.js`), e **nada os ligava**. O plano é a OUTRA entrada do guia de
observação: um plano com um campo obrigatório faltando passava pelo commit.

**O que foi decidido.**
- O hook valida o plano **ao lado do PO**, dentro do mesmo laço por variante.
- O schema é do **CICLO** (P-08), como o do PO; a FONTE pode ser própria da variante —
  `ciclo-XX-<escola>-plano.md` tem precedência sobre `ciclo-XX-plano.md`, que é a **mesma regra**
  do `tools/lib-fontes.sh`. (Medido: o Duo valida contra `ciclo-01-plano.md` e a Ritmos contra
  `ciclo-01-ritmos-plano.md`, com o mesmo schema.)
- **ERRO × AVISO** — a distinção que o PO já faz:
  - campo obrigatório faltando (ou tipo errado) → **recusa** o commit (`exit 1`);
  - **lacuna declarada** (`[Preencher]`) → **aviso**, e passa: a lacuna é legítima (a decisão da
    pesquisadora, ou o dado que vem do `.conf` — o calendário).
- Sem plano, ou sem schema, o hook **avisa e segue** (um ciclo sem plano ainda não é erro de
  commit).

**O que se mediu (os quatro casos).**
- plano válido, com lacunas → **`exit 0`**, os dois planos "validado(s)" e as lacunas em **aviso**
  (2 no Duo, 5 na Ritmos);
- campo obrigatório faltando → **`exit 1`**: `recusado — o plano do tiago/ciclo-01 (variante duo)
  não satisfaz o schema do plano` + `- campo ausente: condicoesPreliminares`;
- schema ausente → **`exit 0`** com `aviso — ... existe sem schema; plano não validado`;
- sem plano nenhum → o bloco do plano **pula** (nenhuma linha), e quem recusa é a **âncora FIPP**,
  ANTES: `os fontes do ciclo mudaram` / `a lista de fontes cobertas mudou (arquivo criado ou
  removido)`. Ou seja: quando o plano é fonte do FIPP, um ciclo que o perde é recusado por um
  motivo melhor — a validação do plano é, nesse caso, a segunda linha de defesa.

**O que ainda não está feito.**
- O plano do **Ciclo 02** (e o da Débora) não existe ainda: o hook simplesmente não valida.
- O aviso das lacunas só aparece no `git commit` de verdade (dentro do hook): não há um `--check`
  avulso que o mostre.

**Com o quê.**
`tools/hooks/pre-commit`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `REGRAS.md` 10 (estrutura de ciclos — camada 1), 16 (formato de entrega) e 17
(versionamento com Git); `PROTOCOLO.md` P-08 (o schema é do ciclo); `tools/lib-fontes.sh` (a
precedência da fonte por variante).

## 2026-09-20 — O experimento passa a consumir o extrator (o ciclo fecha)

**O que motivou.**
O guia de observação e a musicalidade derivam de duas entradas — o PO e o plano. O extrator estava
provado, mas o experimento ainda lia os `po-01.json`/`plano-01.json` **escritos à mão**: o
mecanismo funcionava, e o caminho de ponta a ponta **não existia**.

**O que foi decidido.**
- Os arquivos de entrada do experimento passam a ser **gerados**: `tools/validar-po-ciclo.js --json`
  e `tools/validar-plano-ciclo.js --json`. As duas leituras à mão foram guardadas como
  **referência** (`*-referencia-leitura-a-mao.json`) — é com elas que o diff classificado compara.
- Os dois construtores (`mdGuia`, `mdMusicalidade`) passaram a ler a estrutura do **extraído** — o
  extrator **não** mudou (ele está provado pelo diff). A adaptação é uma camada de
  leitura/exibição: re-junta a linha quebrada (um item que começa com minúscula é continuação) e
  aceita as **duas** formas, para o harness continuar podendo provar o contrafactual.
- O que a adaptação teve de **aceitar**, porque é o que o documento oferece: `phenomenon` é
  **prosa** (uma string); `linhaDeBase` e `distribuicaoDeVolume` são **arrays de objetos**; as
  listas misturam o que a tabela produziu com o texto do bloco; e `duracaoMinutos` é **texto** — a
  conversão ficou fora, por decisão.

**O que se mediu.**
O harness continua verde: **o guia sai com 7 de 7 blocos e 0 lacunas**, a musicalidade com **3 de
3**, e os dois contrafactuais com 1 de 7 e 1 de 3 (as lacunas declaradas). Duas asserções do
harness precisaram mudar — e são o registro honesto da troca de fonte: o texto passou a ser o **do
documento** (com acento e travessão), e não o da leitura à mão em ASCII.

**O que ainda não está feito.**
- As **conversões** (número, data ISO) e a limpeza da prosa que fica dentro dos arrays: fora, por
  decisão.
- O `phenomenon` como prosa dá **um** item no guia, onde a leitura à mão dava quatro: para voltar a
  quatro, a FONTE precisa listar os observáveis (e o schema declará-los como array).
- Nada disso está no fluxo de produção: quem gera ainda é o experimento.

**Com o quê.**
`experimentos/captura-json/` (local, **não** versionado) e `experimentos/README.md`.

**Referências.**
`ARQUITETURA-CAPTURA.md`; `REGRAS.md` 8 (proveniência objetiva) e 17 (versionamento com Git); as
entradas deste REGISTRO de 20/09 (o contrato lê tabela; as duas declarações; o extrator do plano).

## 2026-09-20 — O fenômeno do PO é uma LISTA (o schema declarava string)

**O que motivou.**
O guia de observação mostrava, em "O que observar (do PO)", **um** item de prosa — onde a leitura à
mão mostrava quatro. O extrator não tinha culpa: o schema do PO declarava `phenomenon` como
**string**, e a seção `## Fenômeno` do PO do Duo é uma **LISTA de sete observáveis** — o documento
sempre foi uma lista, e quem a achatava era o **schema**. A Ritmos escreve o fenômeno como
parágrafo, e o tipo tem de ser o que o **documento** oferece.

**O que foi decidido.**
- `phenomenon` passa de `string` para **array de strings**: o fenômeno é a definição OPERACIONAL
  (RN-PO-02), uma lista de comportamentos. O PO do Duo lista **sete**; a Ritmos escreve um parágrafo
  — que o extrator entrega como as linhas do parágrafo, como faz com qualquer campo array.
- **Nenhum documento foi reescrito**: o Duo já listava, e a Ritmos continua com a sua prosa.
- A camada de leitura do guia ganhou uma pista a mais para reunir a linha quebrada: **um item que o
  autor FECHOU (`;`, `.`, `:`) não recebe continuação** — sem isso, os observáveis (que começam com
  minúscula, porque continuam a frase "definida operacionalmente por:") se colariam ao parágrafo
  anterior. O limite fica declarado: o texto extraído **não guarda a indentação** que distinguiria
  as duas coisas com certeza.

**O que se mediu.**
"O que observar (do PO)" passou de **1** para **8** bullets — o parágrafo + os **sete** observáveis,
cada um na sua linha (a leitura à mão tinha quatro). O harness segue verde: guia **7 de 7** blocos e
0 lacunas, musicalidade **3 de 3**, contrafactuais 1 de 7 e 1 de 3. Os **dois** POs continuam
passando na validação (o da Ritmos, com o parágrafo), e o **schema não entra no FIPP**: nenhuma
âncora mudou.

**O que ainda não está feito.**
- A extração é por LINHA e não preserva a indentação: a pontuação é a pista que resta. Guardá-la no
  contrato é a alternativa estrutural — e mexeria em todo o texto extraído (é uma decisão maior).
- As conversões (número, data ISO) continuam fora, por decisão.

**Com o quê.**
`professores/tiago/ciclos/ciclo-01-po-schema.json`; `experimentos/captura-json/` (local, não
versionado).

**Referências.**
`PROTOCOLO.md` RN-PO-02 (a definição operacional do fenômeno); `REGRAS.md` 8 (proveniência
objetiva) e 17 (versionamento com Git); as entradas deste REGISTRO de 20/09 (o contrato lê tabela;
as duas declarações; o extrator do plano; o experimento consome o extrator).

## 2026-09-20 — O escopo `experimentos` entra na lista do commit-msg

**O que motivou.**
A área `experimentos/` tem **README versionado** e commits próprios — e **não tinha escopo**. O
commit que documentou os JSONs gerados usou `docs(ideia)`, emprestando um escopo que nomeia outra
coisa (as notas de ideia e de arquitetura da captura). Escopo emprestado é o começo do erro que a
própria lista de escopos existe para evitar.

**O que foi decidido.**
- `experimentos` entra na lista do `tools/hooks/commit-msg` — nos **dois** lugares: o regex
  `$escopos` (a verdade) e a **mensagem de ajuda**, que a repete.
- O espelho documental acompanha: o `README-ciclos.md` declara que "a lista é a do hook", e passa a
  incluí-lo (26 → **27** escopos, nos dois).
- **Nada foi afrouxado**: o escopo é exato — `experimentos` passa, `experimento` e `experimentosX`
  continuam recusando; o rodapé de proveniência segue obrigatório.

**O que se mediu.**
`tools/hooks/commit-msg` com mensagens de exemplo: `exit 0` para `docs(experimentos)`,
`fix(experimentos)` e `feat(tools)` (sem regressão); `exit 1` para `docs(experimento)` e
`docs(experimentosX)`; e a mensagem de ajuda já imprime a lista nova.

**O que ainda não está feito.**
- A tabela "Escopos" do **`REGRAS.md`** (Regra 17 em prática) **continua listando 10** escopos,
  enquanto o hook aceita 27. É a defasagem que o `HANDOFF.md` declarou (e que uma entrada anterior
  deste REGISTRO deu por corrigida — o que foi corrigido foi o `README-ciclos.md`, não o
  `REGRAS.md`). `REGRAS.md` é congelado: corrigir exige commit próprio, com motivo declarado. Fica
  proposto, não feito.

**Com o quê.**
`tools/hooks/commit-msg`, `README-ciclos.md`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `REGRAS.md` 17 (versionamento com Git); `README-ciclos.md` (*Regra 17 em prática* — a
lista de escopos); `experimentos/README.md` (a área e o que é versionado nela).

## 2026-09-20 — A tabela de escopos do REGRAS.md passa a listar os 27 do hook

**O que motivou.**
A tabela "Escopos" (Regra 17 em prática) listava **10** escopos, enquanto o hook
(`tools/hooks/commit-msg`) aceita **27** — e é essa tabela que faz errar o escopo do commit. O
`HANDOFF.md` já a declarou defasada, e uma entrada anterior deste REGISTRO a deu por corrigida: o
que havia sido corrigido era o `README-ciclos.md`, **não** o `REGRAS.md`. Com o escopo
`experimentos` recém-criado, a defasagem ficou maior — 10 de 27.

**O que foi decidido.**
- A tabela passa a listar os **27**, os mesmos do regex, com a mesma frase do `README-ciclos.md`:
  *"a lista é a do hook; escopo fora dela **recusa o commit**"*. A lista tem **um dono** (o hook) e
  dois espelhos; o `REGRAS.md` passa a apontar para ele em vez de repetir dez.
- Mantive a convenção de escrita do próprio arquivo (`ciclo-XX`, e não `ciclo-NN`).

**O que se mediu.**
Conferido por extração: o regex do hook e a lista do `README-ciclos.md` já batiam (27 = 27), e agora
o `REGRAS.md` lista o mesmo conjunto. Nenhuma linha de REGRA mudou — só a tabela de apoio.

**O que ainda não está feito.**
- Nada impede a defasagem de voltar: os dois espelhos são **texto**, e ninguém os compara. Um teste
  que confrontasse o regex com a documentação seria a garantia — o `pre-commit` não olha para isso.

**Com o quê.**
`REGRAS.md`.

**Referências.**
`CONGELAMENTO.md` (REGRAS.md é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `tools/hooks/commit-msg` (a lista, e o dono dela); `README-ciclos.md` (o espelho
principal); `HANDOFF.md` (a defasagem declarada).

## 2026-09-20 — Peça 1: o JSON de dados do Duo entra como fonte

**O que motivou.**
A migração decidida (as cinco decisões de 20/09) começa pelo arquivo de dados: `ciclo-XX-dados.json`
— a captura em JSON, que passa a ser a **fonte** do ciclo. Sem ele não há o que o gerador leia nem o
que o hash cubra (decisão 4: o JSON entra no hash como fonte).

**O que foi decidido.**
- `professores/tiago/ciclos/ciclo-01-duo-dados.json` (novo): a estrutura do §2.1 da arquitetura
  (`ciclo`, `escola`, `professor`, `criado_em`, `ultimo_lancamento`, `aulas`) — e **vazio**:
  `"aulas": {}`. O dado da Aula 01 existe no **caderno e no relatório**, não numa captura em JSON; o
  primeiro lançamento entra pela própria página quando o formulário estiver em produção. Um `_nota`
  diz isso a quem abrir o arquivo (a convenção `_` dos metadados).
- O `ARQUIVO_DADOS` entra como **resolvedor na lib** (`fonte_dados()`), e não no caller: o
  `ARQUIVO_PO`, que serve de modelo, é definido no `hash-ciclo.sh` — e criar um SEGUNDO ponto de
  definição do mesmo caminho é exatamente a divergência que o `lib-fontes.sh` existe para evitar. A
  precedência é a do `fonte_md()`: `ciclo-XX-<escola>-dados.json` vence `ciclo-XX-dados.json` (a
  captura é por ESCOLA, como o PO e os relatórios).
- `fontes_do_ciclo()` passa a incluir o JSON — **e só isso**: ele não entra em `DOCS`, logo **não é
  publicado**. Conferido: quem chama `fontes_do_ciclo()` é só o `hash-ciclo.sh`; o gerador monta o
  pacote por `DOCS` + `fonte_md`.

**O que se mediu.**
- O **Duo** reancorou: `hash_conteudo` `2bcae3f79b43…` → **`cb7216128a65…`** e `hash`
  `ab71e6c60ac8…` → **`c004b0ecbade…`**, com `ciclo-01-duo-dados.json` na cobertura do `.fipp` ✓.
- A **Ritmos não mudou** — o `fonte_dados()` dela não resolve arquivo nenhum: `--check` ok, com o
  mesmo `3aeaa3b6…`, e a cobertura dela **sem** o `dados.json` ✓. Sem churn desnecessário.
- `check-pacote`: **OK 0 erro(s), 5 aviso(s)** nos dois ciclos.

**O que ainda não está feito.**
- O JSON da **Ritmos** (Duo primeiro, por decisão) e o primeiro lançamento real.
- As **vistas ainda não saíram da cobertura** — convivem com o JSON até a peça 4, e é o que o
  comentário no `fontes_do_ciclo()` declara.
- O **gerador ainda não lê o JSON** (peça 3) e os **builders ainda vivem no experimento** (peça 2).

**Com o quê.**
`professores/tiago/ciclos/ciclo-01-duo-dados.json` (novo), `tools/lib-fontes.sh`,
`professores/tiago/ciclos/ciclo-01-duo.fipp` (reancorado).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `ARQUITETURA-CAPTURA.md` (§7 as decisões, §8 as peças — atualizados hoje);
`IDEIA-CAPTURA.md` (o JSON como fonte, e a linha da segurança corrigida hoje); `REGRAS.md` 8, 16 e
17; `PROTOCOLO.md` P-03/P-04 (a âncora alinha; o passado se incorpora).

## 2026-09-20 — Peça 2: os builders das vistas saem para uma lib

**O que motivou.**
Os cinco builders das vistas — caderno, relatório pós-aula, acompanhamento por aluna, guia de
observação e musicalidade — nasceram **dentro** do `formulario.html` do experimento. Na migração as
vistas passam a ser **geradas**, e quem gera é o **gerador** (Node), não só o formulário (browser):
duas cópias dos builders divergiriam na primeira regra nova. É a mesma classe de erro que criou o
`lib-fontes.sh` e a `lib-extracao-md.js`.

**O que foi decidido.**
- `tools/lib-vistas.js` (novo, ~530 linhas): **uma definição, dois consumidores**. UMD — no browser
  define `window.Vistas` (basta um `<script src>`); no Node, `module.exports`.
- A **interface é um objeto por vista**, para os nomes dizerem de onde vem cada coisa:
  `Vistas.caderno({ meta, dados, aulas, prov })`, `Vistas.relatorio({ meta, dados, aulas, prov })`,
  `Vistas.acompanhamento({ meta, dados, aluna, aulas, prov })`,
  `Vistas.guia({ meta, po, plano, aula, prov })` e `Vistas.musicalidade({ meta, po, plano, prov })`.
- O **CARIMBO É OPCIONAL**: quem passa `prov` ganha a linha *"gerado: …"*; **sem `prov`, a vista sai
  sem ela** — é o que o gerador vai querer, e é o que dá determinismo (nada de `data_geracao` dentro
  da lib). Na prática: os três `mdAjuste(prov.ajuste)` viraram `mdAjuste(prov && prov.ajuste)`, e o
  carimbo do cabeçalho do guia e o *"Gerado em"* da musicalidade ficaram condicionais.
- `Vistas.helpers` expõe as **19 peças puras** que o formulário já usava **fora** dos builders
  (`dataBr`, `lacuna`, `linhaGerado`, `mdCel`, `mdSim`, o balanço, a junção da linha quebrada…) —
  assim a Fase 2 remove as cópias do formulário sem criar cópia nova.
- O código foi **movido, não reescrito**: saiu por recorte (um script localiza os blocos e os copia
  por balanço de chaves/estilo do arquivo), com as duas mudanças acima declaradas.

**O que se mediu.**
- **Node**: `require` carrega ✓ e o guia sai com **50 linhas** usando os JSONs reais.
- **Browser**: num contexto de `vm` que só tem `self`, a lib define `self.Vistas` com `guia` e
  `helpers` ✓.
- **Determinismo**: duas chamadas com a mesma entrada dão o MESMO texto ✓ — e sem a linha *"gerado:"*.
- **Sem DOM**: nenhum acesso a `document`/`window`; as oito ocorrências da palavra são **comentários**
  ("documento"), e a prova é o guia ter saído num contexto **sem DOM**.
- `node --check` passa.

**O que ainda não está feito.**
- O formulário **ainda tem as suas cópias** (a Fase 2 as remove e passa a consumir a lib): até lá há
  duplicação **temporária e declarada**.
- O `gerar-ciclo.sh` **não lê o JSON** ainda — é a peça 3.
- O `comoLista` do formulário ficou **sem uso** (código morto de uma rodada anterior): sai na Fase 2.

**Com o quê.**
`tools/lib-vistas.js` (novo).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `ARQUITETURA-CAPTURA.md` §8 (as peças da migração — esta é a 2); `tools/lib-fontes.sh` e
`tools/lib-extracao-md.js` (os precedentes da mesma classe de risco); `REGRAS.md` 8, 16 e 17.


## 2026-09-20 — O gerador passa a GERAR a vista (peça 3 da migração)

**O que motivou.** O guia de observação é derivado do PO e do plano — mas, no ciclo, ele era um `.md`
escrito **à mão**, com o mesmo conteúdo digitado de novo, e que ninguém atualiza quando o PO muda. A lib
das vistas existia desde a peça 2, e só o formulário a consumia: o pacote tinha a própria vida.

**O que foi decidido.**
- `tools/gerar-vista.js` (novo) resolve as fontes pela precedência do `lib-fontes.sh`, roda os dois
  extratores (`validar-po-ciclo.js`, `validar-plano-ciclo.js` — `--json`) e chama `Vistas.guia`. Ele
  **não escreve arquivo**: imprime o `.md`, e quem decide onde o texto fica é quem chama.
- `e_vista()` (em `lib-fontes.sh`): a vista substitui a fonte escrita à mão **quando ela sai**. A
  migração é **por variante** e explícita — apagar o `.md` é o ato. Nenhuma escola migra por acidente:
  a Ritmos segue com o guia dela até a vez dela.
- `gerar-ciclo.sh`: no laço dos documentos, a vista é gerada (o texto vai para `$TMP/src/…de-vista.md`), e
  `src_do_doc()` dá a MESMA resposta ao corpo, ao menu e ao rodapé. Sem esse segundo ponto, `rotulo()` e
  `rodape_docs()` leriam um arquivo que não existe mais — o guia sairia **sem rótulo** e fora do rodapé.
- A lib ganhou o **front-matter** no guia (o relatório e o acompanhamento já o emitiam): sem ele, a
  página gerada sai sem `title:` — sem título na aba e sem rótulo no menu. Foi o que apareceu na
  primeira corrida. De quebra, o `frente:` do guia passa a dizer o que o documento é (a fonte dizia
  "Relatório" — resquício de quando a chave mentia).
- A fonte escrita à mão do Duo foi **removida**: é o ato da migração.

**O que se mediu.**
- O gerador roda: **0 erros, 5 avisos** de glossário — e os 5 são **pré-existentes** (nenhum dos
  símbolos vem do guia apagado, conferido no `git show`).
- A página gerada traz a **Procedência** (7 de 7 blocos, 0 lacunas) que a escrita à mão não tinha; o
  `<title>` e o rótulo do menu saem do mesmo texto (`Guia de observação — Aula 01`), e o PDF consolidado
  a inclui.
- **Determinismo**: o texto não tem carimbo (o gerador não passa `prov`) — o pacote é reconstruível.
- Âncora do Duo: a lista de fontes mudou (o guia saiu) → `cb721612…` → `ddd514ef…`. A **Ritmos ficou
  intacta** (`3aeaa3b6…`), porque a fonte dela não saiu.
- A Ritmos **já produz** o guia dela: `gerar-vista.js tiago 01 ritmos guia-de-observacao-01` sai com a
  escola e a carga dela. Migrá-la é apagar o `.md`.

**O que ainda não está feito.**
- O guia gerado **não traz** três coisas que só existiam no escrito à mão: a nota "este documento não é o
  relatório / onde ele está", a **data da aula** e o checklist "o que preencher depois" — este último,
  por desenho (quem preenche é o formulário). Os dois primeiros são bloco fixo + dado do calendário;
  **não foram inventados** — é decisão de quem escreve o guia.
- As outras vistas (caderno, relatório, acompanhamento) **não** são geradas pelo pacote: elas derivam do
  JSON de dados, que ainda está vazio (peça 1) e é alimentado pelo formulário.
- §7.2, §7.4, §7.5 e §7.6 seguem em aberto — nenhuma bloqueia.

**Com o quê.**
`tools/gerar-vista.js` (novo), `tools/lib-fontes.sh`, `tools/lib-vistas.js`, `tools/gerar-ciclo.sh`,
`professores/tiago/ciclos/ciclo-01-guia-de-observacao-01.md` (removido), o `.fipp` do Duo (regerado), o
pacote do Duo, `ARQUITETURA-CAPTURA.md` §8 e `professores/tiago/relatorios/README.md`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta entrada);
`ARQUITETURA-CAPTURA.md` §8 (as peças da migração — esta é a 3); `IDEIA-CAPTURA.md`; `tools/lib-vistas.js`
e `tools/lib-extracao-md.js` (os precedentes da mesma classe de risco); `REGRAS.md` 8, 16 e 17.


## 2026-09-20 — O guia gerado passa a emitir a data da aula

**O que motivou.** O guia escrito à mão trazia a data da aula ("sexta, 18/09/2026") e o gerado não:
a informação existia na fonte antiga e se perdia na migração. A data não se digita — ela é do
**calendário** (o `.conf` do ciclo).

**O que foi decidido.**
- `tools/calendario.py` ganhou o modo `--aula NN`: imprime SÓ a data daquela aula, em ISO. Duração e
  volume passam a ser dispensados nesse modo (a conta das datas não os usa) e continuam obrigatórios
  para o bloco — o bloco sai **byte a byte igual** ao de antes.
- `Vistas.guia({ …, data })` emite no cabeçalho, junto do ciclo e da duração:
  `**Ciclo 01 · Duo** · 60 minutos (Pré-requisito 4) · **Aula 01 — 18/09/2026**`. A data **não entra
  no balanço** da entrada: os 7 blocos são do PO + do plano, e a data é do calendário — o balanço
  continua 7 de 7.
- Sem data, a lacuna fica **declarada** no lugar do valor: `[Preencher: data da aula — ver o
  calendário do ciclo]`. Nada de data inventada.
- `gerar-vista.js` a resolve **chamando o `calendario.py`** — não recalcula: a regra do ajuste
  (início que não cai em dia de aula) e o sábado com duas aulas vivem lá.
- O formulário passa a data do JSON do ciclo (a MESMA que a tabela mostra) — sem isso o guia dele
  sairia com a lacuna, e o harness não admite `[Preencher]` com a entrada inteira.

**O que se mediu.**
- Duo: aula 01 → **18/09/2026**, que é **sexta** — exatamente a data que o guia escrito à mão
  declarava (o início declarado, 17/09, é quinta: o calendário ajusta). Aula 12 → 04/12/2026.
- **Ritmos: aulas 01 e 02 na MESMA data** (19/09/2026 — o sábado com duas aulas) e a 03 em
  22/09/2026. O caso que testaria o modelo, testado.
- Determinismo: duas corridas do `gerar-vista.js` dão o mesmo `sha256` (sem carimbo).
- Harness: `OK: renderizacao, paginacao e .md coerentes`, **0 falhas** — e o guia do formulário sai
  com `**Aula 01 — 18/09/2026**`, sem lacuna de data.
- Pacote do Duo: 0 erro(s), 5 aviso(s) (pré-existentes); a data aparece no **HTML e no PDF**
  consolidado. O `plano.html` **não mudou** — o bloco do calendário é o mesmo de antes.
- O guia escrito à mão do Ritmos ficou **intacto** (a peça 5 é a Fase 2).

**O que ainda não está feito.**
- A nota *"este documento não é o relatório"* **não volta** no guia gerado (decisão da
  pesquisadora, 20/09).
- A peça 5 — migrar o guia do Ritmos (Fase 2).

**Com o quê.**
`tools/calendario.py`, `tools/lib-vistas.js`, `tools/gerar-vista.js`,
`professores/tiago/ciclos/ciclo-01-duo/` (guia e PDF regerados).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `ARQUITETURA-CAPTURA.md` §8; `REGRAS.md` 10 (calendário), 16 e 17.


## 2026-09-20 — A linha de base renderiza o texto como veio (nada de `undefined`, nada escondido)

**O que motivou.** A peça 5 (migrar o guia do Ritmos) **parou antes de commitar**: o guia gerado do
Ritmos saía com **5 `undefined`** na `### Linha de base` — `**undefined:** trazem *undefined* · falta
*undefined*`. O PO do Ritmos declara a linha de base em **prosa, por pessoa**; a lib só entendia a
**tabela de dimensões** do Duo, e o que não casava saía como `undefined` — em silêncio.

**O que foi decidido** (pesquisadora, 20/09: *"o texto é do professor; esconder seria perder
informação"*).
- `linhaDaBase()`: cada item sai **como veio** — texto vira bullet; objeto vira `**rótulo:** campos`,
  com o rótulo vindo da PRIMEIRA coluna (`dimensao` quando existe) e os demais campos com o nome do
  campo.
- `dimensoesDe()`: a lista vem **como veio** (texto + objetos), com o texto passando pelo
  `juntarQuebras` (o extrator devolve uma entrada por LINHA do documento) e os objetos passando
  direto — juntá-los com `String()` os destruiria. Até então tudo passava por `objetosDe()`, que
  **descartava a prosa**.
- A subseção da própria linha de base (`### Linha de base do grupo`) sai como subtítulo, e não como
  bullet começando com cerquilha.

**O que se mediu.**
- Ritmos: **5 → 0 `undefined`**, e a prosa das quatro pessoas sai **inteira** (cada frase preservada),
  com as restrições físicas (P-22) depois.
- Duo: 0 `undefined` — e **ganhou informação que estava escondida**: o `dominam` de cada dimensão (o
  PO declara o que as alunas já dominam e a lib não mostrava) e a subseção **Linha de base do grupo
  (compartilhada)**, descartada junto com a prosa.
- Harness: `OK: renderizacao, paginacao e .md coerentes`, **0 falhas**.
- Pacote do Duo: 0 erro(s), 5 aviso(s) pré-existentes; âncoras **intactas** (`d0394adc…` Duo,
  `3aeaa3b6…` Ritmos) — a mudança é de render, não de fonte.

**O que ainda não está feito.**
- O **extrator não leva blockquotes** (`> **Nota …**`): o PO do Ritmos tem 3 e o do Duo 2, e nenhuma
  chega ao JSON — a nota P-22 está no documento e não na extração. É pré-existente e **não** foi
  mexido aqui (mudaria o que todos os balanços veem); fica declarado.
- A peça 5 — o guia do Ritmos gerado — segue na Fase 2, com a tabela do PO e a estrutura do plano.

**Com o quê.**
`tools/lib-vistas.js`; `professores/tiago/ciclos/ciclo-01-duo/` (guia e PDF regerados).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: alterar exige motivo declarado, commit próprio e esta
entrada); `ARQUITETURA-CAPTURA.md` §8 (a migração); `REGRAS.md` 8 (proveniência), 16 e 17.


## 2026-09-20 — O guia do Ritmos passa a ser gerado (peça 5) — e o render para de perder texto

**O que motivou.** A peça 5 existia para testar o modelo nas **duas formas**. O Duo (linha de base em
tabela, estrutura numerada) já migrara; o Ritmos (base em **prosa por pessoa**, plano **sem estrutura
declarada**) **não passava** — o guia gerado saía com 5 `undefined` e a estrutura em lacuna. A
migração foi feita com o que apareceu, e o que apareceu foram **três defeitos do render** e **duas
fontes por ajustar**.

**O que foi decidido** (pesquisadora, 20/09).
- **O PO do Ritmos vira tabela** — `| Aluno | Traz | Precisa desenvolver |`. A conferência foi
  **palavra a palavra**: nenhuma palavra de conteúdo se perdeu (366 → 355; a diferença são os rótulos
  de coluna, que viraram cabeçalho).
- A subseção das **restrições físicas (P-22)** — que pertence à linha de base por declaração da
  pesquisadora — passou a **texto declarado**: o contrato lê **uma tabela por bloco**, e uma segunda
  tabela no mesmo bloco é descartada com aviso (foi o próprio validador que o disse).
- **O plano do Ritmos declara a estrutura** — `## Estrutura de cada aula`, numerada (solo → barra →
  centro → musicalidade, com a aula de pas de deux no centro), como o plano do Duo.
- **A fonte escrita à mão saiu** (`git rm`): é o ato da migração, o mesmo do Duo.

**Três defeitos do render, achados e corrigidos no caminho.**
1. **`undefined` na linha de base em prosa** (5 ocorrências): a lista passava por `objetosDe()`, que
   **descartava o texto em silêncio** — corrigido no commit anterior (`69bfee3`).
2. **O separador injetado dentro de um `code`**: o PO declara um `[Preencher: …]` com a crase aberta
   numa linha e fechada noutra; o `join(' · ')` metia o separador **dentro** do code span —
   corrompia o texto e criava um `\texttt` enorme e inquebrável. Dentro do code, o separador é um
   espaço.
3. **A célula "O que entrou" repetia o texto inteiro do campo**. Numa **célula** o TeX não reflui, e o
   caminho do material bruto **saía da página** (medido: `xMax` 616,7 pt numa página de 612) — o
   `check-pacote` reprovava o pacote. A tabela é a **conta** e o texto está no corpo (é o que a nota
   dela diz): valor que não cabe entra como `*(no corpo, acima)*`.

**O que se mediu.**
- Guia do Ritmos: **5 → 0 `undefined`**; a prosa das quatro pessoas sai inteira; a estrutura sai da
  lista numerada do plano; a data da aula sai do calendário (**19/09/2026**, sábado).
- **`check-pacote`: 0 erro(s) nos dois ciclos** — a palavra fora da margem sumiu do PDF.
- Harness: `OK: renderizacao, paginacao e .md coerentes`, **0 falhas**.
- Âncoras: Ritmos regerada (`3aeaa3b6…` → `2f172493…`); **Duo intacta** (`d0394adc…`).
- O guia do Duo continua **byte a byte** o mesmo depois do conserto do join (`sha256` conferido).

**O que ainda não está feito (declarado).**
- O **extrator não leva blockquotes** (`> **Nota …**`): 3 no PO do Ritmos, 2 no do Duo — nenhuma
  chega ao JSON. Pré-existente; mudaria o que todos os balanços veem.
- **A Mari não tem linha de base** no PO (nem antes nem agora) — não foi inventada.
- **A musicalidade do Ritmos** segue declarada como lacuna na vista: o PO não tem uma dimensão
  "musical", e sim prosa por pessoa que a cita ("Carol — traz bastante musicalidade").
- `\texttt` longo **não quebra no PDF**: `\emergencystretch` e `hyphenat` foram testados e **não
  resolvem**; o `seqsplit` **quebra a compilação** (choca com os code spans que trazem `\ ` e
  chaves). O caminho que resta é não repetir o token numa célula — que é o que se fez.
- A §8 da `ARQUITETURA-CAPTURA.md` (peça 5 marcada) e o `README-ciclos.md` — Fase 3.

**Com o quê.**
`tools/lib-vistas.js`, `professores/tiago/ciclos/ciclo-01-ritmos-po.md`,
`professores/tiago/ciclos/ciclo-01-ritmos-plano.md`,
`professores/tiago/ciclos/ciclo-01-ritmos-guia-de-observacao-01.md` (removido),
`professores/tiago/ciclos/ciclo-01-ritmos.fipp`, os pacotes dos dois ciclos.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`ARQUITETURA-CAPTURA.md` §8 (a migração — esta é a peça 5); `REGRAS.md` 8, 10, 16 e 17.


## 2026-09-20 — O `pre-push` passa a existir — e a conferência do acompanhamento olha o alvo certo

**O que motivou.** A conferência antes do push existia só como **texto no ritual** (colada à mão, a
cada vez): não havia hook. E o alvo de uma das duas conferências estava **errado**:
`git ls-files | grep acompanhamento` casa também com `tools/gerar-acompanhamento.sh` (a ferramenta) e
com as **páginas cifradas**, que **são** parte do pacote — o alarme acendia **sempre**, e alarme que
sempre acende não avisa nada. Foi o que aconteceu hoje: o check acendeu, e a conferência mostrou que
os nove `.html` são as páginas cifradas e que **nenhum `.md` por aluna está versionado**.

**O que foi decidido.**
- `tools/hooks/pre-push` (novo), instalado por `tools/instalar-hooks.sh` como os demais.
- As senhas são lidas de `tools/.senhas-locais` (local, no `.gitignore`, **nunca commitado**): uma
  definição só. Sem o arquivo, a conferência é declarada **não feita** — em vez de passar em silêncio.
- O alvo da segunda conferência passa a ser o **`.md` VERSIONADO**
  (`git ls-files | grep 'acompanhamento.*\.md$'`), e o passe **diz quantas páginas cifradas existem**:
  é a informação que distingue *"nada a declarar"* de *"não olhei"*.
- O hook **barra o push** (`exit 1`) e diz como ir assim mesmo (`--no-verify`): é decisão de quem
  envia, não acidente.

**O que se mediu.**
- Estado real: as 3 senhas não estão em arquivo versionado; nenhum `.md` de acompanhamento versionado
  (9 páginas cifradas no pacote) → **exit 0**.
- Com um `.md` de acompanhamento **plantado** (`git add -N`): **ALERTA + exit 1**.
- Com uma senha de **teste** vazada num arquivo versionado (`SENHAS_LOCAIS` apontando para um arquivo
  de teste — o arquivo real não foi tocado): **ALERTA com arquivo e linha + exit 1**.
- Árvore limpa depois dos testes: nada foi commitado por eles.

**O que ainda não está feito (declarado).**
- O hook confere o que está **versionado na árvore**; segredo que já esteja **na história** não é
  visto (nem por ele, nem pelo `pre-commit`). Aqui isso foi conferido à parte:
  `git log -- tools/.senhas-locais` é **vazio** — nunca foi commitado.
- O push dos 37 commits segue **pendente de decisão** da pesquisadora.

**Com o quê.**
`tools/hooks/pre-push` (novo).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`tools/instalar-hooks.sh` (o instalador); `tools/.senhas-locais.exemplo`; `REGRAS.md` 17.


## 2026-09-20 — O gerador grava os JSONs do formulário no pacote (Fase 2.1)

**O que motivou.** A Fase 1 mostrou o que decide o desenho: o formulário lê **ao lado dele** (o
`fetch` é relativo à própria URL) e o deploy publica **só a pasta do pacote** (`deploy-netlify.sh` →
`netlify deploy --dir="$PACOTE"`). O pacote não tinha nenhum JSON — o formulário de produção não
teria o que ler.

**O que foi decidido.**
- O `gerar-ciclo.sh` grava, a cada geração, **três JSONs no pacote**, todos **DERIVADOS** (como o HTML
  e o PDF: não são fonte, não entram na âncora):
  - `po-$CICLO.json` — o PO extraído (`validar-po-ciclo.js --json`);
  - `plano-$CICLO.json` — o plano extraído (`validar-plano-ciclo.js --json`);
  - `ciclos.json` — o índice que o formulário lê primeiro.
- O extrator é o **mesmo** que o gerador já usava para as vistas (`gerar-vista.js`): agora **gravado**
  em vez de descartado depois de gerar a página. Uma definição só.
- O índice traz os campos que o **formulário** lê (`id`, `escola`, `inicio`, `fim`, `arquivo`), os que
  a **lib** lê (`duracao_min`) e o `total_aulas`. `inicio`/`fim` vêm do **calendário** — a primeira
  aula é a ajustada para dia de aula, não a data do `.conf`.
- `arquivo` sai **por convenção** (`ciclo-XX-<escola>-dados.json`), **não** do `fonte_dados()`: ele
  devolve o nome sem a escola quando o arquivo da variante ainda não existe, e o índice do Ritmos
  declarava `ciclo-01-dados.json` — **um arquivo que não existe**. Foi o defeito que apareceu no
  teste, e o conserto ficou no lugar do defeito: o nome é o do formulário, não o da resolução de
  leitura.

**O que se mediu.**
- Duo e Ritmos: **0 erro(s) em ambos**; âncoras **intactas** (derivado não entra na cobertura).
- Os três JSONs são parseáveis nos dois ciclos — e os dois de entrada do Duo são **idênticos aos do
  experimento** (mesmo `sha256`): a extração de produção é a mesma do laboratório, **provado**.
- Índice do Duo: `inicio 2026-09-18` (ajustado de 17/09), `fim 2026-12-04`, `total_aulas 12`,
  `duracao_min 60`, `arquivo ciclo-01-duo-dados.json`. Índice do Ritmos: `2026-09-19` a
  `2026-11-03`, 21 aulas, `arquivo ciclo-01-ritmos-dados.json`.
- O PO do Ritmos chega ao JSON com a forma que a lib agora renderiza: 15 itens — **4 objetos** (a
  tabela) + 11 textos (a prosa declarada).

**O que ainda não está feito (declarado).**
- **O JSON de dados do Ritmos não existe** (`ciclos/ciclo-01-ritmos-dados.json`): a peça 1 criou só o
  do Duo. O índice dele já aponta o nome certo, mas o arquivo só existirá quando a peça 1 chegar ao
  Ritmos — é **pré-requisito da Fase 2.2**, que é quem o leva cifrado para o pacote.
- O JSON de **dados** no pacote (cifrado) e a conferência cópia × fonte — Fase 2.2.
- O formulário no pacote e o menu (Apanhado Histórico fora, Captura renomeada) — Fase 2.3.

**Com o quê.**
`tools/gerar-ciclo.sh`; os pacotes dos dois ciclos (três JSONs cada).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`ARQUITETURA-CAPTURA.md` §8; `tools/deploy-netlify.sh` (o que se publica); `tools/lib-fontes.sh`
(`fonte_dados`); `REGRAS.md` 10 e 16.


## 2026-09-20 — O JSON de dados do Ritmos entra como fonte (peça 1 do Ritmos)

**O que motivou.** A peça 1 (o `ciclo-XX-dados.json` como **fonte**) começou pelo Duo. O formulário de
lançamento, agora em produção, precisa de um arquivo de dados **por ciclo** — e o índice que o
gerador escreve (Fase 2.1) já apontava `ciclo-01-ritmos-dados.json`, um arquivo que **ainda não
existia**.

**O que foi feito.**
- `professores/tiago/ciclos/ciclo-01-ritmos-dados.json` criado **vazio** (`"aulas": {}`), com o mesmo
  `_nota` do Duo: o dado da Aula 01 está no caderno e no relatório pós-aula; o primeiro lançamento
  entra pela própria página.
- `fonte_dados()` **já o resolve** pela precedência da variante (arquivo próprio vence o sem sufixo) —
  a lib **não foi tocada**, só conferida.
- `fontes_do_ciclo()` **já o inclui**: o JSON entra na cobertura do hash, como o do Duo.

**O que se mediu.**
- Âncora do Ritmos **regerada** (reancoragem declarada): `hash_conteudo 29344f18… → 4d06c495…`,
  `hash 2f172493… → 3cb3babf…` — a fonte nova entrou na cobertura.
- Âncora do **Duo intacta** (`d0394adc…`): o arquivo é do Ritmos e não toca o Duo.
- `check-pacote`: **0 erro(s) nos dois**.
- O índice do Ritmos (gerado na Fase 2.1) aponta `ciclo-01-ritmos-dados.json` — que **agora existe**.
  Era o **pré-requisito declarado da Fase 2.2** (é ele que vai cifrado para o pacote).

**Com o quê.**
`professores/tiago/ciclos/ciclo-01-ritmos-dados.json` (novo) e `…-ritmos.fipp` (regerado).

**Referências.**
`ARQUITETURA-CAPTURA.md` §8 (a peça 1); `tools/lib-fontes.sh` (`fonte_dados`, `fontes_do_ciclo`);
`professores/tiago/ciclos/ciclo-01-duo-dados.json` (o padrão).


## 2026-09-20 — O JSON de dados vai para o pacote cifrado (Fase 2.2)

**O que motivou.** O formulário de produção lê o JSON de dados **ao lado dele** — e o pacote é
**público**: o JSON traz o lançamento por aluna. Decisão da pesquisadora (20/09): vai **cifrado**,
como os acompanhamentos, com a mesma senha.

**O achado que definiu o desenho.** O PageCrypt **não exporta `decrypt`** — publica `encryptHTML` e
`generatePassword`, e o que ele produz é uma **página** que se autodecifra, inútil para um JSON. Mas
o esquema dele é simples e está **embutido** em cada página que ele gera:
`PBKDF2(senha, salt, 2e6, SHA-256) → AES-GCM 256`, endereço = `base64([salt 32][iv 16][ciphertext+tag])`.
A pesquisadora já autorizara a saída (*"a lib do PageCrypt **ou equivalente**"*), então o esquema
virou lib.

**O que foi feito.**
- `tools/lib-cifra.js` (novo, UMD): `cifrar`/`decifrar` (WebCrypto — **Node e navegador**) e
  `cifrarSync`/`decifrarSync` (Node, para o `check-pacote`, que é **síncrono** do começo ao fim).
- `tools/lib-senhas.sh` (novo): `senha_da_escola()` **saiu** do `gerar-acompanhamento.sh` e virou
  lib — os dois geradores precisam dela agora, e uma definição só evita a divergência de sempre.
- `tools/cifrar-dados.js` (novo): cifra o JSON e escreve o **envelope** — `_cifrado`, `_nota` e
  `lancamentos`, que **não é segredo** e é o que permite ao formulário abrir sem pedir a senha quando
  não há nada lançado. A senha chega por **ambiente**, não por argumento (argumento aparece na lista
  de processos do sistema).
- `gerar-ciclo.sh`: copia o JSON de dados para o pacote **cifrado**; sem senha, avisa e **não
  escreve** — e o `check-pacote` reprova (silêncio seria pior que erro).
- `check-pacote.js`: confere **cópia × fonte** — decifra a cópia e compara o **conteúdo**. Byte a byte
  é impossível (o sal muda a cada cifragem, como nos acompanhamentos); o que se compara é o que o
  formulário vai ler.

**O que se mediu.**
- **Compatibilidade com o PageCrypt, provada:** a lib abre um **acompanhamento real** (o do Ritmos,
  `acompanhamento-carol.html`) — 2 000 000 de iterações, 12 313 chars —, e as **duas implementações
  (async e sync) dão o mesmo resultado**; senha errada lança nas duas.
- `async→sync` e `sync→async` idênticos (round-trip nos dois sentidos).
- Os dois pacotes: `ok JSON de dados: a cópia cifrada do pacote decifra na fonte, byte a byte
  (0 lançamento(s))` — **0 erro(s)** nos dois; as **duas âncoras intactas**.
- **O teste que importa:** com a cópia do pacote **adulterada** (cifrada de novo, com conteúdo
  diferente — a **fonte intocada**), o `check-pacote` **reprova**: *"a cópia do pacote DIVERGE da
  fonte — o formulário trabalharia sobre dado velho"*. Regerado, volta a passar.
- Nada de texto puro no arquivo publicado: o envelope não contém o JSON, só o endereço cifrado.

**O que ainda não está feito (declarado).**
- A cópia cifrada **não é determinística** (o sal muda a cada cifragem, como nos acompanhamentos):
  ela aparece modificada depois de cada geração, e o commit carrega a versão do dia. Não é risco — a
  conferência é por conteúdo —, mas é churn conhecido.
- O formulário no pacote, o menu e o comportamento da senha na tela — **Fase 2.3**.

**Com o quê.**
`tools/lib-cifra.js`, `tools/lib-senhas.sh`, `tools/cifrar-dados.js` (novos); `tools/gerar-ciclo.sh`,
`tools/gerar-acompanhamento.sh`, `tools/check-pacote.js`; os pacotes dos dois ciclos (o JSON de dados
cifrado).

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`tools/.senhas-locais.exemplo`; `tools/gerar-acompanhamento.sh` (o precedente da cifra); `REGRAS.md`
16 e 17.


## 2026-09-20 — O formulário de lançamento vai para produção (Área do Professor)

**O que motivou.** O formulário nasceu no experimento (`experimentos/captura-json/`, **não
versionado**) e está provado lá (harness de 25 casos, exit 0). O que faltava era ele ser **uma página
do pacote** — porque o que se publica é o pacote, e o professor precisa da ferramenta no site.

**O que foi feito.**
- `tools/templates/lancamento.html` (novo): o formulário como **template versionado**. Ele lê tudo
  **ao lado dele** (as libs em `assets/`, o `ciclos.json`, os `po-XX/plano-XX.json` e o JSON de dados
  do ciclo), e o gerador o publica no pacote junto das duas libs.
- **A página ganhou a estrutura do pacote**: folha de estilo, barra de navegação — o gerador escreve
  a **mesma `gerar_nav`** no marcador `<!-- NAV -->` —, índice desta página e botão voltar ao topo.
- **O formulário descriptografa o JSON de dados.** O envelope diz **quantas aulas já têm dado** — e
  esse número não é segredo —, então com **zero lançamento a página abre SEM PEDIR SENHA**, e com
  lançamento pede a senha da escola (a mesma dos acompanhamentos), guardando-a na sessão. Era a
  decisão da pesquisadora, e o envelope da Fase 2.2 foi desenhado exatamente para isso.
- **Menu** (decisões de 20/09): o grupo **"Apanhado Histórico" saiu** — era um grupo de **um membro
  só**, e a regra "um padrão sem glob = link direto" o transformava em **link de topo**, que é o
  "solto" apontado. A página continua existindo e alcançável **pelo rodapé**; no menu, não está mais.
  A **"Captura em aula" virou "Captura em aula — para impressão"** (o `title:` é da fonte `.md`, nos
  dois ciclos) e o **formulário entrou na Área do Professor**, ao lado dela.
- **`check-pacote`**: páginas de **FERRAMENTA** (hoje só o formulário) não vão ao PDF e não têm título
  conferível lá — como as cifradas; e a exigência de "link marcado como página atual" passou a valer
  **só para página que está no menu**. Sem isso, o próprio check exigiria que a decisão do apanhado
  não valesse (a página sairia do menu **e** seria reprovada por isso).

**O que se mediu.**
- Os dois pacotes: **0 erro(s)** (6 avisos, um deles **declarando** o apanhado fora do menu).
- **Âncoras regeradas nos dois** (a fonte da captura mudou): Duo `d0394adc…` → `d135ecec…`, Ritmos
  `3cb3babf…` → `4d81d6f3…`.
- **O formulário SERVIDO DO PACOTE, em navegador** (Chrome headless, `--dump-dom`): lê o
  `ciclos.json` do pacote (monta "Ciclo 01 · Duo"), **abre sem erro e sem pedir senha** (0
  lançamentos) — o comportamento decidido, medido.
- **O harness de 25 casos roda contra o TEMPLATE de produção** (com a lib da cifra injetada):
  `OK: renderizacao, paginacao e .md coerentes`, **0 falhas**.
- O menu, conferido no pacote: grupos *Ciclos · Aulas · Acompanhamento · Planejamento · Área do
  Professor*; a Área do Professor termina com *Captura em aula — para impressão* e *Lançamento de
  aula — formulário eletrônico*; `apanhado-historico.html` **não** aparece no menu.

**O que ainda não está feito (declarado).**
- **O mapa de apelidos (`dados.apelidos`) não existe no JSON de produção** (o do experimento tinha):
  a tela **não quebra** — mostra a chave, que é o apelido em slug —, mas incluir esse mapa é decisão
  de **fonte** (muda o JSON e a âncora).
- Com mais de uma aula, os dois rótulos de captura ficariam iguais no menu (hoje há uma por ciclo).
- O envio (Fase 3) segue pendente de decisão.

**Com o quê.**
`tools/templates/lancamento.html` (novo); `tools/gerar-ciclo.sh`, `tools/check-pacote.js`;
`…ciclo-01-captura-aula-01.md` e `…ciclo-01-ritmos-captura-aula-01.md` (título);
os dois `.fipp` (regerados); os pacotes dos dois ciclos.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`ARQUITETURA-CAPTURA.md` §8; `tools/lib-cifra.js` e `tools/cifrar-dados.js` (Fase 2.2);
`experimentos/captura-json/` (onde o formulário foi provado); `REGRAS.md` 16 e 17.


## 20/09/2026 — Musicalidade e Guia de observação marcados "(remover)"

**O que aconteceu.**
A Musicalidade e o Guia de observação agora são gerados por demanda (o formulário). Foram **marcados
no menu** com o sufixo "(remover)" — um marcador de dívida explícito. A remoção de fato acontece
**quando a verificação da cadeia de custódia existir**.

**O que foi decidido.**
- As duas páginas **não saem do pacote** — continuam no `DOCS`, no PDF, e as âncoras não mudam (o
  menu é apresentação).
- A investigação provou que **não ficam órfãs**: o rodapé as alcança (e, no caso da Musicalidade, o
  índice também).
- Quando a verificação da cadeia de custódia existir, a remoção do menu é segura — o acesso continua
  pelo rodapé e pelo formulário.

**O que se mediu.**
- Menu, nos **dois** ciclos: `Musicalidade (remover)` e `Guia de observação — Aula 01 (remover)`, e o
  menu é o **mesmo em todas as páginas**.
- **Rodapé limpo** e **`<title>` das duas páginas limpos** ("Musicalidade"; "Guia de observação —
  Aula 01"): o que está marcado é a **navegação**, não o documento.
- **PDF do Duo: 0 ocorrências de "(remover)"** — o sumário não recebe a marca.
- As duas páginas seguem no pacote; **âncoras intactas** (`d135ecec…` Duo, `4d81d6f3…` Ritmos) —
  menu não é fonte, nada no hash mudou; `check-pacote`: **0 erro(s)** nos dois.
- O sufixo sai de `rotulo_no_menu()`, e **não** do `rotulo()`: ele serve o menu, o rodapé e o README,
  e mudá-lo teria posto a marca no rodapé e no título — o oposto da decisão.
- A investigação da Fase 1 também mediu o que sustenta esta decisão: a **Musicalidade é fonte** (está
  no `.fipp` e em `fontes_do_ciclo()` — tirá-la do `DOCS` mudaria o hash e deixaria **link morto no
  índice**, que a linka), o **Guia não é fonte** (nasceu vista; não aparece em nenhum dos dois), e
  **hoje há uma única página fora do menu** — o `apanhado-historico.html`, alcançado pelo rodapé.

**Com o quê.**
`tools/gerar-ciclo.sh` (o `gerar_nav()`), `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`ARQUITETURA-CAPTURA.md` §8; `tools/lib-fontes.sh` (a cobertura do hash); `REGRAS.md` 16 e 17.


## 20/09/2026 — O bloco de índice do formulário sai (atrapalhava a navegação)

**O que motivou.** A pesquisadora apontou, ao usar a página: o bloco fixo com *Lançar uma aula · O
ciclo · Entregáveis* **atrapalhava e quebrava a navegação**. Ele era o `toc-local` que a Fase 2.3
pôs no formulário para satisfazer a regra de estrutura do `check-pacote` — e o CSS do pacote o
transforma em **coluna presa à direita** a partir de 1200px, sobre um layout que **não é o de
documento**: o bloco fica **por cima do conteúdo**.

**O que foi decidido.**
- O `toc-local` **sai** de `tools/templates/lancamento.html`: o formulário **não é documento** — não
  tem índice de página. O botão "voltar ao topo" **fica** (é fixo no canto, não ocupa lugar no fluxo).
- A regra do "índice interno" deixa de ser exigida das **páginas de ferramenta** (hoje só o
  formulário) — como já não era a do título no PDF. Sem isso, o check exigiria o bloco que atrapalha.

**O que se mediu.** Os dois pacotes geram com **0 erro(s)**; a página do formulário segue com barra
de navegação, botão ao topo, rodapé, idioma e folha de estilo (as demais regras continuam valendo), e
o menu marca a página atual.

**Com o quê.**
`tools/templates/lancamento.html`, `tools/check-pacote.js`; as páginas `lancamento.html` dos dois
pacotes.

**Referências.**
`CONGELAMENTO.md` (tools/ é congelado: motivo declarado, commit próprio e esta entrada);
`tools/templates/ciclo.css` (a coluna presa do `toc-local`, que explica o efeito); `ARQUITETURA-CAPTURA.md` §8.


## 20/09/2026 — Os lançamentos da Aula 01 entram no JSON (transcrição dos registros)

**O que motivou.** A pesquisadora: *"existe os dados lançados da Aula 01 do Ritmos e do Duo; eles
precisam estar na listagem do formulário com os valores corretos"*. Os JSONs estavam **vazios** — o
dado existia **escrito à mão**, no caderno e no relatório —, então o formulário não tinha o que
mostrar.

**O que foi feito.** Transcrição da Aula 01, **dos registros para o JSON, sem interpretação**:
- **Duo** (18/09/2026, 60 min): 4 presentes (Ceci, Ana, Mel, Sofi), condições 5/5/5, plano seguido;
  técnica — metatarsos, tempo e transferência `ok` para todas, braço-perna `parcial` para todas;
  funcional — 60 min, fadiga antes do previsto **só na Mel**; o estado da aula e o que surpreendeu
  vão nos campos de texto do relatório.
- **Ritmos** (19/09/2026, 120 min): 4 presentes, **Mari ausente**, condições 5/5/5, plano seguido;
  funcional — 120 min, tônus parcial (Pássaro Azul sustenta até o fim), fadiga apareceu em três.

**O que a transcrição encontrou — e é decisão de MODELO, não de dados.** O ciclo de Ritmos tem
**dimensões próprias** (tendus/jetés, piqué arabesque, par/pas de deux, repertório em 3/4) e o modelo
de captura do formulário é o do Duo (alinhamento / tempo / transferência / braço-perna). Ficou no
JSON **só o que encaixa sem inventar** (transferência, funcional, condições, presença), e o resto está
no campo de texto, **nas palavras do relatório** — com a nota no próprio arquivo. Quando a
pesquisadora decidir se o formulário ganha as dimensões do ciclo, isto vira campo.

**O que se mediu.**
- Os dois JSONs são válidos; os dois pacotes geram com **0 erro(s)** — inclusive a conferência
  cópia × fonte do JSON cifrado.
- **Âncoras regeradas** nos dois (o JSON de dados é **fonte**): Duo `d135ecec…` → `71dbc003…`, Ritmos
  `4d81d6f3…` → `184213f5…`.
- **O formulário, no navegador, pede a senha** — o comportamento desenhado (havendo lançamento, a
  leitura pede a senha da escola): *"Detalhe: sem senha para ciclo-01-duo-dados.json"*.
- **Os valores, provados nas vistas** — pelo mesmo caminho do formulário (decifra o envelope do
  pacote e monta caderno, relatório e acompanhamento): no Duo — "Mel", "parcial", "leve reducao",
  "barra ao solo", "18/09/2026"; no Ritmos — "Pássaro Azul", "Mari", "Tóquio", "tornozelo",
  "19/09/2026". **10 de 10.**

**Com o quê.**
`professores/tiago/ciclos/ciclo-01-duo-dados.json` e `…ciclo-01-ritmos-dados.json` (transcritos), os
dois `.fipp` (regerados), os pacotes dos dois ciclos (o envelope cifrado, agora com 1 lançamento).

**Referências.**
`relatorios/ciclo-01/aula-01-duo.md` e `…aula-01-ritmos.md` (a fonte da transcrição);
`cadernos/ciclo-01/…` (conferência); `ARQUITETURA-CAPTURA.md` §2.1 (o modelo de dados); `REGRAS.md`
8 e 17.


## 20/09/2026 — O formulário abre com lançamento gravado, e pede a senha na tela

**O que aconteceu.** A pesquisadora abriu o formulário do Ritmos e a página respondeu *"Não consegui
abrir este ciclo … Detalhe: sem senha para ciclo-01-ritmos-dados.json"*: **a página morria** ✗. Com a
Aula 01 transcrita, o boot busca o JSON do ciclo, o decifrar falha sem a senha — e o `catch` do boot
trocava a página inteira por um erro. Quem só queria **lançar a Aula 02** ficava **sem a ferramenta**.

**O que foi decidido.** O caso "sem senha" (e o "senha recusada") deixa de ser **erro de página** e
vira **pedido**: o painel diz que o ciclo tem lançamento cifrado, o campo da senha é **focado**, e há
um botão **Abrir** (e Enter no campo) que tenta de novo. A página **segue viva** nos dois casos.

**O que se mediu.**
- No navegador, o formulário do Ritmos **abre**, monta os ciclos e mostra: *"Ciclo 01 · Ritmos e
  Movimento tem lançamento — e o lançamento vai cifrado no pacote. Digite a senha da escola no campo
  acima (ao lado de "Gerado por") e clique em Abrir."* — com o botão **Abrir** presente e o erro
  antigo **ausente**.
- A mensagem de `file://` do boot passou a aparecer **só** quando o protocolo é `file:` — antes ela
  encabeçava **qualquer** erro, inclusive este, e mandava procurar o problema no lugar errado.
- Os dois pacotes geram com **0 erro(s)**; o bloco do formulário passa em `node --check`; e o harness
  de 25 casos segue **OK**.

**Com o quê.**
`tools/templates/lancamento.html`; as páginas `lancamento.html` dos dois pacotes.

**Referências.**
`tools/lib-cifra.js` (a cifra) e `tools/cifrar-dados.js` (o envelope); a entrada de 20/09 da
transcrição da Aula 01 (que trouxe o caso à tona); `CONGELAMENTO.md` (tools/ é congelado: motivo
declarado, commit próprio e esta entrada).


## 20/09/2026 — A elicitação pergunta a forma de que a folha de captura precisa

**O que motivou.** O mapeamento da folha de captura mostrou que a elicitação **pergunta o conteúdo
certo** — inclusive *"defina como comportamentos observáveis"* (B5) e *"o que você sabe de cada aluna
antes do ciclo"* (B6) —, mas **não pergunta a forma**: os **itens, por pessoa, marcáveis**. Tudo o que
a folha imprime vem do PO/plano **como prosa**, e a decomposição em colunas é feita **à mão, ciclo a
ciclo**. A folha do Ritmos **registra isso**: *"a versão anterior trazia as colunas do ciclo do Duo e
**não** as do Ritmos."*

**O que foi feito — oito perguntas e uma regra de forma:**

| # | Onde entra | O que ela pede |
|:--|:--|:--|
| 1 | Como conduzir | *quando eu pedir uma lista, é uma linha por item — não prosa* |
| 2 | Bloco 3 | os **apelidos**, um por linha (com exemplo) |
| 3 | Bloco 3 | as **flutuantes**: quem entra e sai do ciclo, e os apelidos delas |
| 4 | Bloco 5 | os **itens** que se marca, por aluno(a), em cada dimensão |
| 5 | Bloco 5 | as **dimensões próprias** do ciclo, e os itens de cada |
| 6 | Bloco 5 | a **musicalidade** como dimensão observada, com os itens |
| 7 | Bloco 5 | as **condições de contorno (P-11)**: ânimo, interesse, harmonia 1–5 |
| 8 | Bloco 6 | a **linha de base por pessoa, item a item** |
| 9 | Bloco 10 | o **compasso** do repertório |
| 10 | Formato de saída | as listas saem como listas — não viram frase |

*(São as oito lacunas do mapeamento; a #1 e a #10 são a regra de forma que as sustenta.)*

**O que se mediu.** O documento vai de **105 para 154 linhas** (+52/−3), com os **dez blocos
intactos** e **todas as perguntas atuais preservadas**; as oito novas estão no bloco certo; e os
exemplos renderizam como **bloco de forma** — o formato esperado da resposta, distinguido das
instruções.

**Com o quê.**
`prompts/eliciar-ciclo.md`.

**Referências.**
As duas folhas de captura (`ciclo-01-captura-aula-01.md`, `…-ritmos-…`) — e, na do Ritmos, a nota que
declara como ela foi montada a partir do PO; `ARQUITETURA-CAPTURA.md` §2.1 (o modelo de dados);
`REGRAS.md` 16 e 17.


## 20/09/2026 — A folha de captura vira config legível por máquina (`captura-XX.json`)

**O que motivou.** O mapeamento mostrou que a folha de captura **varia por ciclo** porque é **escrita
à mão** — e que as colunas dela **já estão declaradas**, nos **cabeçalhos das tabelas**. O formulário,
ao contrário, tem as colunas do Duo **fixas em código**. Faltava o elo: um arquivo que diga, por
ciclo, quais são os blocos e as colunas — e que o formulário possa ler.

**O que foi feito.**
- `tools/validar-captura-ciclo.js` (novo) — **irmão** do `validar-po-ciclo.js` e do
  `validar-plano-ciclo.js`, com a diferença que é o motivo dele existir: **a folha varia por ciclo, e
  os títulos das seções também** ("Bloco 1 — Técnica (syllabus RAD)" no Duo; "…(método RAD)" e um
  "Bloco 2 — Par" a mais no Ritmos). Um mapa de seções — como o dos irmãos — teria de ser escrito **à
  mão por ciclo**, que é o problema a resolver. Então ele lê **por forma**: cada `## Seção` é um
  bloco; a **primeira tabela** dá as **colunas** (os cabeçalhos) e o **grão** ("Aluna" → `aluna`,
  "Dupla" → `dupla`); as linhas da tabela viram as **linhas**; e os **rótulos em negrito** viram os
  campos miúdos (o cabeçalho, o P-11, o fecho). As primitivas de leitura de tabela são **do contrato**
  (`lib-extracao-md.js`) — nenhuma cópia.
- `professores/tiago/ciclos/ciclo-01-captura-schema.json` (novo) — **o único dos quatro** (ciclo, PO,
  plano, captura) que não existia; declara a forma do config e valida o resultado.
- `gerar-ciclo.sh` grava `captura-$CICLO.json` no pacote, como já grava os JSONs de PO, plano e
  índice. Derivado: não é fonte, **não entra na âncora**.

**O que se mediu — e é a prova que a fase pedia:**
- **As colunas dos dois ciclos são DIFERENTES**, cada um com as suas: o **Duo** com 4 na técnica
  (Metatarsos · Tempo · Transfer. · Braço-perna), o **Ritmos** com 3 (Tendus/jetés · Transferência ·
  Piqué arabesque) **e um bloco a mais** — o **Par**, com **grão `dupla`**.
- Os grãos: `aluna` nos dois; **`dupla` só no Ritmos**; e o Bloco 5 do Ritmos (linha de base por
  aluno) com o grão vindo do próprio cabeçalho.
- Os dois pacotes geram com **0 erro(s)**; **âncoras intactas** (a folha não foi tocada — derivado não
  entra na cobertura); o extrator passa em `node --check`.

**O que ainda não está feito (declarado).**
- O **formulário ainda não lê** este config: as colunas do painel continuam **fixas em código**.
- O Bloco 5 do Ritmos sai com o grão como `oQueOPODeclaraQueElaPrecisaDesenvolver` — o cabeçalho da
  tabela, lido ao pé da letra; quando o formulário consumir, é ali que se decide o rótulo da tela.

**Com o quê.**
`tools/validar-captura-ciclo.js` e `professores/tiago/ciclos/ciclo-01-captura-schema.json` (novos);
`tools/gerar-ciclo.sh`; os pacotes dos dois ciclos (`captura-01.json`).

**Referências.**
As duas folhas de captura (`ciclo-01-captura-aula-01.md`, `…-ritmos-…`);
`tools/lib-extracao-md.js` (as primitivas); `tools/validar-plano-ciclo.js` (o molde); a entrada de
20/09 da elicitação revisada (que passa a produzir os itens); `CONGELAMENTO.md`.


## 20/09/2026 — Os marcos por aula: já eram legíveis; agora a eliciação os pede

**O que motivou.** A Fase 3 (c) pede duas coisas: (1) que o extrator do plano leia os marcos por
aula como lista estruturada; (2) que a eliciação os pergunte. A verificação respondeu a (1) — e
mudou o sentido do trabalho.

**(1) Já lê — verificado, não reimplementado.** O `validar-plano-ciclo.js` **já entrega**
`marcosPorAula` como array de objetos `{n, marco}`: 12 objetos no plano real (aulas 01–12), com `n`
e `marco` obrigatórios no schema. A lista **também traz prosa** (2 itens são o parágrafo que
apresenta a tabela) — e isso **não é defeito**: é o contrato **declarado** ("o que não é tabela entra
como texto"), o validador **avisa** ("campo marcosPorAula: 2 de 14 item(ns) não são objeto") e os
consumidores **filtram** (`objetosDe`, em `lib-vistas.js`, comentado como "uma lista que mistura
prosa"). Nada a mudar aqui.

**(2) A eliciação não perguntava os marcos — agora pergunta.** O prompt pedia o objetivo e o
parâmetro **da primeira aula** e mais nada: os doze marcos existiam no plano porque foram escritos
como tabela na compilação — a mesma assimetria (conteúdo sem forma) que a revisão anterior corrigiu
para as listas. Agora:
- **Bloco 4** vira *"Aulas: a primeira e os marcos"* e pede **os marcos parciais, aula a aula**, uma
  linha por aula com o número na frente — mais o limite do extensível (o ciclo piloto diz "12 aulas,
  extensível a 16": os marcos além das decididas vão como `[a decidir]`);
- **"Como conduzir"** ganha a regra da FORMA, ao lado da regra das listas: a compilação escreve os
  marcos como a tabela `| Aula | Objetivo específico (marco parcial) |` — é a tabela que o extrator
  lê como um objeto por aula. Ditada como item de lista, cada marco vira texto solto que quem
  consome precisa descartar;
- **"Formato de saída"** declara as duas formas (as listas, uma linha por item; os marcos, a tabela)
  e passa a citar a seção "aulas e marcos".

**A prova, ao vivo.** O mesmo conteúdo nas duas formas, pela mesma ferramenta:
- forma **pedida** (tabela): `{total: 2, objetos: 2, texto: 0}` — **zero prosa**, e nenhum aviso;
- forma **evitada** (lista): `{total: 3, objetos: 0, texto: 3}` — contaminação total, com o aviso
  "3 de 3 item(ns) não são objeto".

**Não-regressão.** As 58 perguntas anteriores seguem todas; os 10 blocos, idênticos em número (sem
renumeração); o único removido foram as três linhas que a revisão reescreveu. O prompt vai de
154 → 176 linhas.

**O que fica declarado.** O formulário **ainda não consulta os marcos** (é o objetivo depois das três
fases) e, hoje, **a folha de captura não imprime o marco da aula** — a folha é escrita à mão; se
passar a imprimir, é decisão de desenho, não de extração.

**Com o quê.** `prompts/eliciar-ciclo.md` (três edições: a regra da forma, o Bloco 4 e o formato de
saída).

**Referências.** `tools/validar-plano-ciclo.js` e `ciclos/ciclo-01-plano-schema.json` (a leitura
verificada); `tools/lib-vistas.js` (`objetosDe`); `ciclos/ciclo-01-plano.md` (a tabela real);
`tools/lib-extracao-md.js` (a regra da tabela).


## 20/09/2026 — O schema da captura declara a chave e o tipo de cada coluna

**O que motivou.** A verificação da peça (d) mostrou que as colunas da folha são **rótulos**
("Metatarsos", "Tempo (calcanhar t.1)", "Transfer. (t.2)") e os lançamentos usam **chaves** de outro
vocabulário (`alinhamento`, `tempo`, `transferencia`) — e que a folha **não diz o tipo** de cada
coluna (marca, número, booleano). Sem chave e sem tipo declarados, o formulário não tem como montar o
painel a partir do ciclo. As quatro decisões da pesquisadora (**rename**; **chave no schema**;
**tipo no schema**; **grão `dupla` como lista de pares**) fecham o caminho, e esta fase escreve a
declaração.

**O que foi feito.** O `ciclo-01-captura-schema.json` ganha `_declaracao`:
- `tipos` — o vocabulário dos cinco tipos (`marca` = os cinco do conjunto da folha · `numero` ·
  `booleano` · `texto` · `checkbox`), com o que cada um é. As **colunas de tabela** dos dois ciclos
  usam três (`marca`, `numero`, `booleano`); `texto` e `checkbox` existem para os campos de linha (o
  fecho é uma lista de caixas), que esta fase não declara;
- `porVariante` — por **slug da variante** (`duo`, `ritmos`: o do `VARIANTE` do `.conf` e o do nome do
  pacote, que não muda quando a redação do rótulo muda), a `escola` (que confere com o front-matter
  da folha) e, por **bloco da folha** (o título exato), o `grao` e as `colunas`, cada uma com
  `{ chave, tipo }`.

**As chaves foram escolhidas para a tabela de aliases ficar mínima** — e ficou:
- **Duo:** 13 colunas; os lançamentos precisam de **um** alias (`alinhamento` → `metatarsos`); as
  outras cinco já batem (`tempo`, `transferencia`, `braco_perna`, `duracao_min`, `fadiga_antes`);
- **Ritmos:** 14 colunas; os lançamentos **não precisam de alias nenhum** (`transferencia`,
  `duracao_min`, `tonus`, `fadiga_antes` já são as chaves declaradas);
- o **Par** declara `grao: "dupla"` e as suas quatro chaves (`eixo_individual`, `eixo_no_par`,
  `contrapeso`, `entrosamento`).

**A verificação.** Um conferidor roda o extrator de verdade nas duas folhas e compara, **coluna por
coluna**: as duas folhas estão **cobertas** (4 blocos/13 colunas no Duo; 5 blocos/14 colunas no
Ritmos), sem coluna nem bloco declarado a mais. Um único item é apontado — e é a lacuna **já
declarada** no `_estrutura` do Bloco 5 do Ritmos: a folha traz o cabeçalho literal
(`oQueOPODeclaraQueElaPrecisaDesenvolver`) onde o grão é `aluna` (a folha tem um `### <apelido>` por
aluna). O extrator atual lê o grão do primeiro cabeçalho, ao pé da letra — e **também mistura as
tabelas das seções** (o config sai com 25 "linhas", três delas cabeçalhos repetidos). Os dois são
defeitos **do extrator**, não da declaração: a Fase 2 os resolve, porque ele passa a ler o grão do
schema.

**O que fica declarado.**
- Os campos de **linha** da folha (data, P-11, fecho, relatório) **não** entram na declaração: as
  chaves deles são as mesmas em toda variante, e quem as fixa é o formulário.
- Nenhuma **coluna de tabela** é do tipo `texto` ou `checkbox` nestes dois ciclos.
- O schema é a autoridade que o extrator passa a consultar na Fase 2; a reancoragem acontece na
  Fase 3, com o rename do JSON de dados.

**Com o quê.** `professores/tiago/ciclos/ciclo-01-captura-schema.json`.

**Referências.** O relatório da Fase 1 da peça (d); as duas folhas de captura (os rótulos);
`tools/validar-captura-ciclo.js`; os `.conf` das duas variantes (o `VARIANTE`); `conferir-schema.js`
(a prova, em `/tmp` — não versionado).


## 20/09/2026 — O config da captura sai com chave e tipo por coluna

**O que motivou.** A Fase 1 declarou, no schema, o par rótulo ↔ chave e o tipo de cada coluna; a
declaração, sozinha, não serve a ninguém — **quem a lê é o extrator**. Esta fase faz o extrator
consultá-la e o pacote receber o config **enriquecido**.

**O que foi feito.**
- `tools/validar-captura-ciclo.js`:
  · lê o `_declaracao` do schema e resolve a **variante** — pelo `--variante <slug>` (o que o gerador
    passa, do `VARIANTE` do `.conf`) ou, sem ele, pela `escola:` do front-matter da folha (dedução
    verificada; com mais de uma candidata, ou nenhuma, **avisa** em vez de escolher);
  · cada coluna sai como `{ rotulo, chave, tipo }` — e **coluna ou bloco que o schema não declara NÃO
    é inventado**: sai `chave: null` e um **ERRO**, que faz o gerador parar **antes** de escrever o
    pacote, com a mensagem dizendo qual coluna falta declarar;
  · o **grão passa a vir da declaração** (o cabeçalho da folha é sugestão): no Bloco 5 do Ritmos o
    primeiro cabeçalho é a pergunta do PO, que não é grão — o aviso diz isso e usa o declarado;
  · o config ganha `variante` (qual declaração o produziu) e o bloco ganha `secoes` (os `### <nome>`),
    quando o bloco tem uma tabela por seção.
- `tools/gerar-ciclo.sh`: passa `--variante "$VARIANTE"` e, no erro, diz que a folha não fechou com o
  schema (em vez de "não consegui ler").
- `ciclo-01-captura-schema.json`: o `properties` acompanha a forma nova (`colunas` como **objetos**, e
  não strings) e ganha `secoes` e `variante` — sem isso o schema passaria a **mentir** sobre a forma
  do arquivo que ele mesmo descreve.

**Os dois defeitos do extrator, declarados na Fase 1, foram corrigidos:**
- o **grão** deixou de ser lido ao pé da letra do primeiro cabeçalho;
- a leitura **misturava as tabelas das seções**: o cabeçalho das tabelas seguintes virava linha de
  dado (a linha de base do Ritmos saía com 25 "linhas", três delas cabeçalhos). Agora o cabeçalho de
  uma tabela seguinte é reconhecido **pela estrutura** — o que o segue é a linha de traços — e não
  pelo texto: a folha escreve "que **ela** precisa desenvolver" numa seção e "que **ele** precisa"
  noutra, e comparar texto deixava passar. O Bloco 5 do Ritmos sai com **22 linhas** (era 25) e
  **5 seções** (era 4 — a primeira, a da aluna que vem antes da primeira tabela, não era colhida).

**A prova.** Os dois pacotes geram com **0 erro(s)**; o config do Ritmos traz o Par com
`grao: "dupla"`; **check-pacote 0 erro(s)** nos dois; **âncoras intactas** (a config é derivada — o
schema muda, mas não está no `.fipp`); e a fixture da coluna não declarada: **exit 1**, com
`chave: null` no JSON e a mensagem nomeando bloco e coluna.

**O que fica declarado.**
- O `linhas` de um bloco com `secoes` é a **união** das linhas das seções, **sem o vínculo** com ela:
  quem tem esse vínculo é o PO (`linhaDeBase`), e é de lá que o formulário lerá os itens de cada aluna.
- Uma seção pode não ter tabela (a da aluna ausente traz `[Preencher]`): o nome entra em `secoes` e
  ela não contribui linhas.
- Nada disto mudou os lançamentos nem as vistas — quem vai ler chave e tipo é a Fase 3.

**Com o quê.** `tools/validar-captura-ciclo.js`; `tools/gerar-ciclo.sh`;
`professores/tiago/ciclos/ciclo-01-captura-schema.json`; os dois `captura-01.json` do pacote.

**Referências.** A Fase 1 da peça (d) (o schema que declara); as duas folhas de captura;
`tools/lib-extracao-md.js` (as primitivas); a fixture e o relatório da coluna não declarada (em
`/tmp`, não versionados).


## 20/09/2026 — O formulário e as vistas leem as chaves do ciclo (o rename)

**O que motivou.** A declaração (Fase 1) e a config (Fase 2) existem, mas ninguém as consumia: o
formulário tinha **oito colunas fixas** (as do Duo) e o JSON de dados, as chaves do modelo fixo
(`alinhamento`, `tempo`…). As quatro decisões da pesquisadora fecharam o caminho — **rename**, chave
e tipo no schema, e o grão `dupla` como lista de pares —, e esta fase liga as pontas.

**O que foi feito.**
- **`tools/lib-vistas.js`** — os nomes fixos saíram dos **8 sítios, 3 funções**
  (`mdAcompanhamento`, `mdEntradaCaderno`, `mdRelatorio`). Entraram quatro definições: `blocosDaCaptura`
  (os blocos declarados), `marcasDaPessoa` (os pares rótulo → valor de um bloco, para uma pessoa ou
  um par), `linhaDoBloco` e `mdValor`. As três funções ganharam o parâmetro `captura`, e quem chama
  passa; **sem ele a vista imprime a lacuna** (`SEM_CAPTURA`) em vez de inventar colunas. As vistas
  passaram a imprimir **a musicalidade, a linha de base e o Par** — que não apareciam.
- **`tools/templates/lancamento.html`** — o painel deixa de ter oito colunas fixas e passa a ser
  montado pelo `captura-XX.json`: um bloco por dimensão declarada, com o rótulo e o **tipo** de cada
  coluna (marca → select · número → campo numérico · booleano → caixa). O **Par** vira uma lista de
  pares (o professor escolhe os dois apelidos); a **linha de base** vira uma marca **por item do PO**
  (`linhaDeBase.precisaDesenvolver`, em lista); a **presença** sai da tabela e vira uma linha só (a
  aula é uma); e o **marco da aula** (do `plano-XX.json`) aparece no topo do painel. O
  `coletarCaptura` grava **pelas chaves declaradas** — `aula.<chave do bloco>.<apelido>.<chave da
  coluna>`, `aula.par = [{p1, p2, …}]`, e `linha_de_base.<apelido> = [{item, marca}]` —, e o
  `limparCamposCaptura` limpa genericamente.
- **`tools/renomear-chaves-dados.js`** (novo) — a migração do rename, com dry-run por padrão. Ela
  roda sobre o **texto plano** (`ciclos/ciclo-XX[-<escola>]-dados.json`), que é FONTE: o envelope
  cifrado do pacote é DERIVADO, e o gerador o reescreve. **A primeira tentativa desta fase migrou o
  envelope errado** e foi perdida na geração seguinte — o tool agora **recusa** o envelope e diz onde
  migrar. Aplicado: `alinhamento` → `metatarsos` no Duo (4 trocas, uma por aluna); o Ritmos não
  precisou de nenhuma.
- **`tools/validar-captura-ciclo.js`** — cada BLOCO sai com `chave` e `rotulo`, da declaração; sem
  eles, o lançamento não saberia em que bloco do JSON gravar (era o que o prendia a
  `tecnica`/`funcional`). O schema (`ciclo-01-captura-schema.json`) declara os dois por bloco e o
  `properties` acompanha.

**A prova, ao vivo.** As funções do painel foram **extraídas do template e rodadas em node** com um
DOM falso (não é uma cópia da lógica — é a lógica):
- **Duo:** blocos na tela *Técnica · Funcional · Musicalidade · Linha de base*; **nenhuma** coluna que
  o ciclo não declara; **todas** as declaradas na tela; marco presente; gravação em
  `metatarsos`/`duracao_min`/`fadiga_antes`/`pulso`/`acento`/`linha_de_base.*` (a musicalidade e a
  linha de base **não eram lançáveis** antes);
- **Ritmos:** *Técnica · Par · Funcional · Musicalidade · Linha de base*; o Par grava
  `[{p1: "carol", p2: "dada", eixo_individual…}]`; a linha de base grava os **itens do PO** um a um.
- **A lib:** `- **Técnica:** Metatarsos ok · Tempo (calcanhar t.1) ok · Transfer. (t.2) ok ·
  Braço-perna parcial` — os rótulos do ciclo com o valor da chave renomeada.

**O que fica declarado.**
- O **grão `dupla`** grava uma lista de pares; o painel mostra 3 linhas em branco (como a folha) — o
  professor escolhe os dois apelidos, e par em branco não é gravado.
- A **linha de base** grava `{item, marca}` (com o texto do item, e não um slug): o slug perderia a
  redação que a professora leu.
- Os **marcos provisórios** (`[Preencher]`) e as **colunas sem dado** (8 no Duo, 10 no Ritmos)
  aparecem vazias — não se inventa marca.
- O `condicoes_contorno` e o `relatorio` continuam nas chaves fixas: são campos de LINHA, iguais em
  toda variante.
- Âncoras: o Duo **reancorado** (`4b49f2dd…` — o JSON de dados é fonte e mudou); o Ritmos **intacto**
  (`184213f5…`).

**Com o quê.** `tools/lib-vistas.js`; `tools/templates/lancamento.html` e os dois `lancamento.html` do
pacote (+ `assets/lib-vistas.js`); `tools/renomear-chaves-dados.js` (novo);
`tools/validar-captura-ciclo.js`; `ciclo-01-captura-schema.json`; `ciclo-01-duo-dados.json` (a fonte,
renomeada) e o `ciclo-01-duo.fipp` (a âncora); os `captura-01.json` e o envelope do Duo no pacote.

**Referências.** O relatório da Fase 1 da peça (d) (a tabela de aliases); as duas folhas de captura; o
`po-01.json` de cada ciclo (a linha de base); o `plano-01.json` (o marco); as duas provas, em `/tmp`
(não versionadas).



## 20/09/2026 — A leitura do formulário usa as colunas do ciclo

**O que motivou.** A peça (d) migrou **o painel** de captura para o `captura-XX.json`, mas a
**leitura** ficou para trás: `tabelaTecnica`, `blocoAula` e `blocoAluna` imprimiam as colunas do Duo
(`alinhamento`, `tempo`, `transferencia`, `braco_perna`, `tonus`, `fadiga_antes`) em **todo ciclo**.
No formulário do Ritmos, a leitura mostrava as colunas do Duo; as dele (tendus/jetés, piqué
arabesque, o Par, responde ao repertório) não apareciam, e a musicalidade e a linha de base não
apareciam em ciclo nenhum. O bloco **Par** (grão `dupla`) não tinha como ser renderizado.

**O que foi feito** (`tools/templates/lancamento.html`, +101/−32):
- **`tabelaTecnica` removida** (a tabela única, fixa) — no lugar, **`tabelaDoBloco(b, dados, a,
  pessoas)`**, que monta a tabela pelas **colunas declaradas**: rótulo do config, valor da chave, e
  o **tipo** decidindo o formato (`mdCelula`: marca → os símbolos da folha · numero · booleano →
  sim/não · texto);
- **o grão `dupla`** — `tabelaDoPar`: uma linha por par (`p1 + p2`), e **lista vazia declara**;
- **a linha de base revisitada** — `tabelaPorSecao`: uma tabela por aluna, uma linha por **item do
  PO** (com o texto do item, nunca um slug); aluna sem item é declarada;
- **`blocoAula(…, captura)`** e **`blocoAluna(…, soAula, captura)`** leem o config — a linha do tempo
  virou **a mesma leitura da aula, restrita a ela** (por aula, os blocos do ciclo com a linha dela);
  e o `render()` passa o `captura`;
- **sem o config, a leitura DECLARA** (`SEM_CAPTURA_LEITURA`) — não cai de volta nas colunas do Duo,
  que eram o defeito;
- `pessoas` desce até o par e a seção: na leitura por aluna, só os pares dela e só os itens dela.

**A prova.** O código do template **e a cópia publicada em cada pacote**, extraídos e rodados em
node, nos dois ciclos:
- **Duo** — *Técnica · Funcional · Musicalidade · Linha de base*; **nenhum** rótulo fixo fora do que
  o ciclo declara; tipos respeitados; `blocoAluna` só com a aluna filtrada;
- **Ritmos** — *Técnica · **Par** · Funcional · Musicalidade · Linha de base*; as três colunas
  técnicas dele, "Responde ao repertório do dia" na musicalidade, e o **Par** presente;
- **sem config**, os dois blocos declaram, e nenhuma coluna do Duo aparece.

**O que fica declarado.**
- O `duracao_min` que a lib ainda cita é a duração **da aula** e **do ciclo** (`a.duracao_min`,
  `m.duracao_min`) — campo de **linha**, igual em toda variante, não coluna de bloco.
- Os títulos dos blocos são `<h4>`, e o cabeçalho da aula na linha do tempo também — achatamento
  cosmético, sem efeito de dado.
- **Âncoras intactas** (o template não é fonte): `4b49f2dd…` (Duo) e `184213f5…` (Ritmos);
  `check-pacote` 0 erro(s) nos dois pacotes.

**Com o quê.** `tools/templates/lancamento.html`; os dois `lancamento.html` do pacote; `HANDOFF.md`.

**Referências.** A peça (d) (o painel, que já lia o config); o relatório da Fase 1 da peça (d) (a
tabela de colunas dos dois ciclos); as provas em `/tmp` (não versionadas).

## 22/09/2026 — Agentes de workspace: geração, auditoria e apresentação

**O que aconteceu.**
O repositório ganhou customizações de agente em `.github/` — ferramenta de trabalho, não
infraestrutura do método. Três agentes, um prompt e um arquivo de instruções:

- `.github/agents/ciclo-entrega.agent.md` — geração e validação de pacotes: `gerar-ciclo.sh`,
  `check-pacote.js`, validadores isolados, âncora FIPP, deploy;
- `.github/agents/ciclo-auditor.agent.md` — auditoria **somente leitura** contra `REGRAS.md`,
  `PROTOCOLO.md` e `CONGELAMENTO.md`, com laudo que cita a regra;
- `.github/agents/deck-rizoma.agent.md` — frente Marp: edição do deck, `check-overflow.js`,
  `check-mapa.js`, `medir-rotulos.js`, sincronização do mapa;
  > **Correção de 07/10/2026.** A redação original dizia *"sincronização do slide 68"*. Em
  > 22/09/2026 o mapa **era** o slide 68 — o número estava certo quando foi escrito. O bloco novo
  > de O Quebra-Nozes (Camadas Históricas, Raio-X das Personagens, A Política de O Quebra-Nozes)
  > entrou **antes** dele, e o deck passou de 72 para **87 slides**: o mapa hoje é o **slide 83**.
  > O elo fica registrado — não se reescreve o passado.
- `.github/prompts/instalar-ciclo.prompt.md` — instalação de ciclo a partir do Markdown
  elicitado (aponta para `prompts/instalar-ciclo.md`, que segue sendo o contrato);
- `.github/instructions/ciclo-fontes.instructions.md` — convenções das fontes de ciclo e
  material de observação, com `applyTo` sobre `professores/**`.

**O que foi decidido.**
- A divisão é por **fronteira de escrita**, não por assunto: o agente de entrega produz saídas
  a partir de fontes prontas; o de auditoria **verifica e não escreve**; o da apresentação
  edita só a fonte do deck e as saídas derivadas. O que os separa é o que cada um pode tocar —
  fundi-los recriaria o agente que faz tudo, que é o anti-padrão.
- Os três nascem com `tools: [read, search, execute]`, **sem `edit`**. Editar fonte de ciclo é
  decisão do professor; quem escreve conteúdo não deve ser quem confere o conteúdo.
- A restrição de escrita do auditor é **orientação, não bloqueio**: não há hook. É decisão
  declarada, não esquecimento — se for furada na prática, o passo seguinte é um `PreToolUse`
  que recuse `gerar-ciclo.sh`, `hash-ciclo.sh` sem `--check`, `normalizar-ids.py` e
  `deploy-netlify.sh`.
- **Nada de infraestrutura mudou.** `.github/` não está na lista congelada de
  `CONGELAMENTO.md`; `tools/`, `prompts/`, `PROTOCOLO.md`, `REGRAS.md` e `METODO.md` seguem
  intocados, e o fluxo continua sendo o dos comandos do `README.md`.
- `AGENTS.md` entra no versionamento: estava fora do Git e é o arquivo que orienta os agentes.

**Com o quê.**
`.github/agents/*.agent.md`, `.github/prompts/instalar-ciclo.prompt.md`,
`.github/instructions/ciclo-fontes.instructions.md`, `AGENTS.md`.

**Referências.**
`AGENTS.md` (orientações para agentes); `REGRAS.md` (pré-requisitos 4 e 5; Regras 9, 16 e 17);
`PROTOCOLO.md` (P-06, P-12, P-15/P-16, P-17, P-19, P-21, P-22); `CONGELAMENTO.md`;
`README-ciclos.md`; `apresentacoes/apresentacao-01-rizoma/README.md` (regras pétreas A e B).

**O que ainda não está feito.**
Hook `PreToolUse` para o auditor. Fica declarado que o `REGISTRO.md` apareceu no worktree em
variante divergente (15 entradas duplicadas e arquivo truncado) e foi restaurado do commit
anterior antes desta entrada — nenhuma daquelas reescritas foi aproveitada.

## 23/09/2026 — A identidade do projeto entra na documentação (e a ressalva do FIPP)

**O que motivou.**
A documentação não dizia o que este projeto é. Dizia o que ele *tem* (regras, pétreas,
ferramentas) e descrevia o balé como se fosse a identidade — quando o balé é o **protótipo**.
Pior: três documentos citavam "mestrado" e um anunciava "cadeia de proveniência FIPP", o que
leva qualquer leitor novo — pessoa ou IA — a concluir que (a) este repo é o projeto de
mestrado e (b) o FIPP está implementado aqui. Nenhuma das duas é verdade. O erro foi
cometido de fato por uma sessão de IA nesta data, e o sintoma é o que esta entrada corrige:
**quem entrava sem contexto, saía com o contexto errado.**

**O que foi decidido.**
- O projeto passa a se declarar, no topo dos documentos de entrada, como **a memória da aula
  dada** — o processo de ensino-aprendizagem que **de fato se aplicou**, não o planejado.
- **Não é o projeto de mestrado**: o mestrado está em outro diretório, e é de lá que vêm o PO
  e o FIPP. Este repositório **aplica** um PO (como experimentação) e **não implementa o
  FIPP**, nem perto do que a arquitetura dele desenha. O `.fipp` daqui é uma **âncora de
  proveniência encadeada** que compartilha o princípio — o passado se incorpora, não se
  reescreve — mas é uma **aproximação**.
- **Protótipo testado no universo da dança.** Este projeto **não é agnóstico**: ele é o
  protótipo, e o projeto que **deve ser agnóstico** será criado a partir dele, para transitar
  em todos os universos (oficina de matemática, improvisação em dança contemporânea,
  disciplina de mestrado).
- **Nenhum ciclo é igual a outro, nenhuma aula é igual a outra** — nem com o mesmo professor.
  O protótipo existe para provar que o modelo se sustenta nessa variação.
- **Não avalia**: registra o cotidiano do professor em sala de aula. A avaliação é fronteira
  de outro módulo, ainda não desenhado.
- **A integração ainda não existe** — com o projeto das secretarias (Projeto Cultura), nem a
  fronteira de entrada nem a de saída foram desenhadas.

> **Correção de 23/09/2026 (mesmo dia).** A primeira redação desta entrada dizia que o
> projeto era "**agnóstico e completamente adaptativo**". **Está errado**: o agnosticismo é
> a meta do **projeto sucessor**, não uma propriedade deste. O que existe aqui é o
> **protótipo**, sendo testado no universo da dança. A redação foi corrigida em todos os
> documentos onde a afirmação apareceu (`AGENTS.md`, `README.md`, `METODO.md`,
> `README-ciclos.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`, `CONGELAMENTO.md`, os
> agentes de `.github/` e este registro), e o próprio `tools/gerar-handoff.sh` passou a
> emitir a formulação correta. A versão anterior não é apagada: fica como o elo que registra
> o que se pensou antes da correção (P-03/P-04 — a proveniência acrescenta, não edita).

**Onde entrou.**
- `AGENTS.md` — seção nova **"O que é este projeto (leia antes de qualquer coisa)"**, no topo,
  com a armadilha de leitura declarada;
- `tools/gerar-handoff.sh` — o HANDOFF passa a **emitir a identidade** (é o artefato que uma
  sessão nova lê primeiro); `HANDOFF.md` regenerado;
- `README.md` — título passa a **"Projeto Ciclo — visão geral"**, com nova seção **"O que este
  repositório não é"**; a frase "pesquisa em andamento (mestrado)" sai;
- `METODO.md`, `README-ciclos.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`,
  `CONGELAMENTO.md` — nota de escopo no topo;
- `.github/` — os três agentes e as `ciclo-fontes.instructions.md` ganham a seção de escopo,
  para que agente algum volte a chamar isto de "projeto de mestrado" nem a âncora de "FIPP";
- `PROTOCOLO.md` e `REGRAS.md` — **congelados**, alterados com o motivo declarado abaixo.

**Motivo declarado — os dois congelados.**
`PROTOCOLO.md` e `REGRAS.md` estão na lista de `CONGELAMENTO.md`; a alteração é **cirúrgica e
só de escopo**, sem tocar em nenhuma das 22 pétreas nem das 17 regras: no `PROTOCOLO.md`,
"cadeia de proveniência **FIPP**" vira "cadeia de proveniência encadeada" e ganha a ressalva de
que o FIPP pertence ao outro projeto; no `REGRAS.md`, a Premissa 7 passa a dizer "o **mesmo
princípio** de encadeamento" e declara que a implementação do FIPP não está aqui. Nenhum
comando, validador ou hash muda: o `.fipp` continua com o mesmo nome e a mesma fórmula — a
**âncora não foi regerada**, e `hash-ciclo.sh … --check` segue passando. O porquê: a
documentação induzia ao erro sobre a natureza do projeto, e a correção exige tocar os dois
arquivos que enunciam o método.

**Com o quê.**
`AGENTS.md`, `README.md`, `README-ciclos.md`, `METODO.md`, `PROTOCOLO.md`, `REGRAS.md`,
`CONGELAMENTO.md`, `IDEIA-CAPTURA.md`, `ARQUITETURA-CAPTURA.md`, `tools/gerar-handoff.sh`,
`HANDOFF.md`, `.github/agents/*.agent.md`, `.github/instructions/ciclo-fontes.instructions.md`.

**Referências.**
`METODO.md` (declaração de princípio); `PROTOCOLO.md` (P-05/P-07 — material × evidência);
`CONGELAMENTO.md` (o procedimento de alteração com motivo declarado); `biblioteca/referencias.md`
(Taylor, *O Arquivo e o Repertório*; Polanyi, *The Tacit Dimension* — memória, repertório e
filosofia); `ARQUITETURA-CAPTURA.md` §7 (decisões em aberto — 7.2, 7.4, 7.5, 7.6).

**O que ainda não está feito.**
O desenho das duas fronteiras — a **entrada** (como o PO chega: hoje é um `.md` copiado à mão)
e a **saída** (o módulo de avaliação, que derivaria da cadeia de custódia em vez de aproximar
questões do plano). A porta de entrada na tela (modo IA × modo formulário) também segue por
fazer.

## 23/09/2026 — A varredura da deriva de identidade: o que ficou fora da primeira correção

**O que motivou.**
A correção da véspera (entrada acima) declarou a identidade **nos pontos de entrada** — mas a
varredura foi feita à mão, sobre a lista de arquivos de que se lembrava, e **não conferiu o
repositório inteiro**. Ficaram de fora: as `description:` de dois agentes de `.github/`, os
arquivos de **harmonização** dos dois ciclos, `biblioteca/README.md`, `biblioteca/guia-do-professor.md`,
`departamentos/README.md`, `experimentos/README.md`, `professores/README.md`, o `README.md` de
`cadernos/`, o `prompts/instalar-ciclo.md` e os **comentários internos de `tools/`**.

O achado mais grave é a contradição **dentro do mesmo arquivo**: a `description:` do
`ciclo-entrega.agent.md` anunciava "recalcular a **âncora FIPP**", enquanto o corpo do mesmo
agente proíbe — "não chame esta âncora de 'FIPP'". Como a `description` é a **superfície de
descoberta** (é por ela que o agente é convocado), a contradição entrega a identidade errada
**antes** de o corpo correto ser lido. O mesmo em `ciclo-auditor.agent.md`.

**O que foi decidido.**
- A deriva não é a **palavra** `FIPP` — é o uso **sem ressalva de escopo**. Onde o termo nomeia
  cadeia, arquivo ou campo (`parentHash`, `.fipp`), permanece legítimo; onde descreve o que **este
  repositório faz**, passa a "âncora de proveniência encadeada".
- Uma **skill de workspace** (`.github/skills/identidade-do-projeto/`) passa a manter isto:
  varredura de deriva, a decisão **congelado/gerado/livre**, o formato da entrada no `REGISTRO.md`
  e a regeneração do `HANDOFF.md`. Traz `scripts/varrer-deriva.sh` para que a próxima varredura
  seja mecânica, não de memória.
- A deriva foi encerrada **na raiz**, não só nos documentos de entrada: `tools/` (comentários) e
  as harmonizações também foram varridos.
- Fronteira mantida: o `ciclo-auditor` **não** acumula a checagem de identidade — ela vive na
  skill, por decisão da pesquisadora.

**Onde entrou.**
- `.github/skills/identidade-do-projeto/` (novo) — `SKILL.md`, `references/` (bloco canônico,
  mapa dos pontos de entrada, congelamento e registro) e `scripts/varrer-deriva.sh`;
- `.github/agents/ciclo-entrega.agent.md` e `ciclo-auditor.agent.md` — `description:` e o rótulo
  da âncora no formato de resposta;
- `professores/tiago/ciclos/ciclo-01-duo-harmonizacao.md` e `…-ritmos-harmonizacao.md` — **fontes
  do hash**: a redação mudou e a âncora foi **regerada**;
- `biblioteca/README.md`, `biblioteca/guia-do-professor.md`, `departamentos/README.md`,
  `experimentos/README.md`, `professores/README.md`, `professores/tiago/cadernos/README.md`,
  `prompts/instalar-ciclo.md`;
- `tools/hash-ciclo.sh`, `tools/lib-fontes.sh`, `tools/gerar-ciclo.sh`,
  `tools/gerar-acompanhamento.sh`, `tools/renomear-chaves-dados.js`, `tools/gerar-handoff.sh` —
  comentários e uma linha de emissão do HANDOFF.

**Motivo declarado — os congelados.**
`tools/`, `prompts/`, `biblioteca/guia-do-professor.md` e `METODO.md` estão em `CONGELAMENTO.md`.
As alterações são de **redação de escopo**, não de comportamento: nenhuma fórmula de hash, nenhum
validador, nenhuma regra e nenhuma pétrea mudou. Nos scripts, apenas **comentários** — exceto
`tools/gerar-handoff.sh`, em que muda **uma string emitida** (o rótulo "âncoras FIPP" vira
"âncoras de proveniência"), sem tocar na lógica de extração. O porquê: o repositório continuava
ensinando a identidade errada a quem lê o código, e a primeira correção havia declarado encerrada
uma varredura que não cobria o repositório.

**Reancoragem — declarada.**
As harmonizações são fontes dos dois ciclos; a redação mudou nelas, então **as duas âncoras foram
regeradas** e `hash-ciclo.sh … --check` passa nos dois. O que **não** mudou: a fórmula, a
cobertura (`docs`/`index`/PO/manifestos/relatórios) e a cadeia — `parentHash` segue vazio nos
dois (Ciclo 01 é raiz). Os pacotes HTML/PDF **não** foram regerados: as páginas publicadas ainda
portam a redação antiga e são saídas reconstruíveis (P-04); a próxima geração as atualiza.

**Com o quê.**
`.github/skills/identidade-do-projeto/{SKILL.md,references/*,scripts/varrer-deriva.sh}`,
`.github/agents/ciclo-entrega.agent.md`, `.github/agents/ciclo-auditor.agent.md`,
`professores/tiago/ciclos/ciclo-01-duo-harmonizacao.md`,
`professores/tiago/ciclos/ciclo-01-ritmos-harmonizacao.md`, `biblioteca/README.md`,
`biblioteca/guia-do-professor.md`, `departamentos/README.md`, `experimentos/README.md`,
`professores/README.md`, `professores/tiago/cadernos/README.md`, `prompts/instalar-ciclo.md`,
`tools/hash-ciclo.sh`, `tools/lib-fontes.sh`, `tools/gerar-ciclo.sh`,
`tools/gerar-acompanhamento.sh`, `tools/renomear-chaves-dados.js`, `tools/gerar-handoff.sh`,
`HANDOFF.md`, `professores/tiago/ciclos/ciclo-01-duo.fipp`,
`professores/tiago/ciclos/ciclo-01-ritmos.fipp`.

**Referências.**
`AGENTS.md` (a identidade canônica); `CONGELAMENTO.md` (o procedimento de alteração); a entrada
de 23/09/2026 acima (o precedente que esta varredura completa); `tools/hash-ciclo.sh` (a fórmula
e a cobertura da âncora).

**O que ainda não está feito.**
Os pacotes (HTML + PDF) dos dois ciclos **não** foram regerados, e portanto as páginas publicadas
ainda trazem "hash FIPP". Regerar exige `tools/gerar-ciclo.sh` e novo deploy — deixado para
quando o professor pedir. Fica também por fazer o desenho das fronteiras de entrada e saída, acima.

## 23/09/2026 — A seção que só tinha citação, e o ciclo simulado da Diaghilev

**O que motivou.**
Ao instalar um ciclo novo por eliciação, o plano foi **recusado** com `campo ausente:
proveniencia`. A seção existia, com título e conteúdo — o conteúdo é que era uma citação
(`> …`). O contrato de extração descarta as linhas `>` de propósito: blockquote é comentário do
documento, não conteúdo (é o que impede a nota de método de virar o TEXTO do campo, e o
`<!-- CALENDARIO -->` de virar valor). O efeito colateral não estava tratado: **seção cujo ÚNICO
conteúdo é citação não produz campo nenhum**, e o erro que aparecia dizia só `campo ausente` —
apontando para o sintoma, não para a causa. Quem escreveu o documento vai procurar o campo que
"faltou" em vez da citação que o engoliu.

**O que foi decidido.**
- O contrato **registra** as seções cujo único conteúdo foi citação (`secoesSoCitacao`), e cada
  validador as converte em **aviso nomeado** com o título e a LINHA: *"seção '## Registro de
  proveniência' (linha 9): só tem citação ('> …') — o campo 'proveniencia' não é criado"*.
- **Os avisos passam a sair também quando há erro.** Antes, o validador imprimia os erros e
  retornava — e o aviso que explica o erro ficava invisível, justamente no caso em que ele é a
  resposta. A ordem nova: erros, depois os avisos.
- O comportamento de extração **não mudou**: a citação continua fora do valor. O que mudou é o
  que se reporta, não o que se extrai — provado por comparação byte a byte (§adiante).
- **A escola nova foi mantida como teste permanente**: o ciclo simulado da **Diaghilev**
  (professor **Fochini**, 4 encontros) fica no repositório como o caso de escola que nasce do
  zero, com as suas quatro folhas de captura distintas.

**Onde entrou.**
- `tools/lib-extracao-md.js` — o rastreio (`secoesSoCitacao`) e `avisosDeSecaoSoCitacao()`
  (definição única, comum ao PO e ao plano);
- `tools/validar-po-ciclo.js` e `tools/validar-plano-ciclo.js` — o aviso entra na lista e os
  avisos saem também no erro;
- `professores/fochini/` (novo) — o professor e a escola **simulados**: manifesto base e da
  variante, `ciclo-01-schema.json`, `po-schema.json`, `plano-schema.json`, `captura-schema.json`,
  o PO, o plano, **quatro aulas** (`aula-01` a `aula-04`), **quatro folhas de captura**, o
  `index`, as `referencias`, a `harmonizacao`, o caderno e o JSON de dados;
- `professores/fochini/ciclos/ciclo-01-diaghilev.fipp` (novo) — a âncora do ciclo.

**Motivo declarado — o congelado.**
`tools/` está em `CONGELAMENTO.md`. A alteração é **de diagnóstico, não de contrato**: nenhuma
fórmula de hash, nenhum validador, nenhuma regra e nenhuma pétrea mudou. A **prova** de que nada
mudou no que se extrai: antes e depois da alteração, os cinco JSONs extraídos das fontes
existentes saem **idênticos** (comparação byte a byte de `po-01.json` do Duo e do Ritmos,
`plano-01.json`, `captura-01.json` do Duo e do Ritmos) — e as duas âncoras do Ciclo 01 seguem
íntegras, **sem reancoragem**. O porquê: um erro de extração que não nomeia a causa custa a
geração inteira, e o mesmo defeito voltaria no próximo ciclo escrito à mão.

**O ciclo simulado — e o que ele mediu.**
A **Diaghilev** (homenagem a Diaghilev, dos Ballets Russes; professor **Fochini**) é **fictícia**
e existe para testar a cadeia numa escola que nasce do zero. O ciclo foi gerado de ponta a ponta:
`tools/gerar-ciclo.sh fochini 01 diaghilev` → **14 páginas, 4 aulas, PDF de 31 páginas, 0 erro(s)
e 0 aviso(s)** — o campo `proveniencia` passou. A âncora saiu e verifica:
`hash: ae357e24766914ee3d7d4ba3adc14fab6e65c321368fb83bfa3acc7da1ddbd03` (`parentHash` vazio —
o Ciclo 01 abre a cadeia).

O teste dos **quatro formulários** revelou **dois achados que ficam em aberto**, ambos medidos e
não supostos:

1. **O config da captura é UM por ciclo, não um por aula.** O gerador extrai só
   `captura-aula-01` e o publica como `captura-XX.json`; a página monta o painel desse arquivo em
   **qualquer** aula. Resultado medido: as quatro folhas da Diaghilev — que declaram colunas
   genuinamente diferentes (eixo/peso, transferência/musicalidade, meia ponta/giro, frase/somativa)
   — produzem **quatro formulários IDÊNTICOS**, todos com as colunas da Aula 01. A prova do
   conceito está feita: entregando a config da aula certa, saem **quatro formulários diferentes**,
   com o `Funcional` e a `Linha de base` permanecendo comuns (são do ciclo, não da aula — e é
   correto que se repitam).
2. **O ciclo sem lançamento não lista os alunos.** O mapa de apelidos viaja **dentro** da parte
   cifrada do JSON de dados, e a página **não decifra** quando o envelope declara
   `lancamentos: 0` (decisão correta: sem lançamento não há o que ler, e a página abre sem pedir
   senha). Consequência: numa escola nova — na **primeira aula**, que é quando o formulário mais
   serve — o professor abre a tela e **não encontra quem marcar**: as tabelas saem sem linha.
   Medido contra o pacote real do Duo (que tem 1 lançamento, decifra e recebe os 4 apelidos) e
   contra o da Diaghilev (0 lançamentos, `apelidos` fica `{}`).

**Com o quê.**
`tools/lib-extracao-md.js`, `tools/validar-po-ciclo.js`, `tools/validar-plano-ciclo.js`,
`professores/fochini/` (o ciclo inteiro: `.conf` base e variante, quatro schemas, PO, plano,
`aula-01`–`aula-04`, `captura-aula-01`–`04`, `index`, `referencias`, `harmonizacao`, o caderno do
ciclo e o `-dados.json`), `professores/fochini/ciclos/ciclo-01-diaghilev.fipp` (regerado).

**Referências.**
`CONGELAMENTO.md` (o procedimento de alteração); `ARQUITETURA-CAPTURA.md` §7 (as decisões em
aberto — o config por aula entra aqui); `IDEIA-CAPTURA.md`; `PROTOCOLO.md` (P-08 — os campos
declarados em schema; P-17 — os mesmos tipos de artefato do ciclo piloto); `REGISTRO.md` (a
entrada de 20/09/2026, que fixou o JSON como fonte).

**O que ainda não está feito.**
Os **dois achados acima não foram corrigidos** — mudam comportamento em `tools/` (congelado) e a
decisão é da pesquisadora: (a) o config da captura passar a ser **por aula**; (b) o mapa de
apelidos sair da parte cifrada (ou a página decifrar quando a aula ainda não tem dado). Os
pacotes dos ciclos anteriores **não** foram regerados. A porta de entrada na tela (modo IA × modo
formulário) segue por fazer, como acima.

## 23/09/2026 — O gerador não herda mais o locale de quem o chama

**O que motivou.**
O commit do ciclo da Diaghilev foi recusado pelo `pre-commit` com `! LaTeX Error: Unicode
character � (U+FFFD)` — e o **mesmo ciclo**, gerado à mão minutos antes, passava com
`0 erro(s)`. Código igual não dá resultado diferente: o que mudou foi o **ambiente**. O commit
foi feito pelo **VS Code**, e processo lançado pela interface gráfica herda o ambiente **sem
`LANG`/`LC_*`** — locale **C**. Reproduzido de forma decisiva:
`LC_ALL=C tools/gerar-ciclo.sh fochini 01 diaghilev` corrompe o pacote e o `pdflatex` morre
(`exit=43`); o mesmo comando com o locale do terminal (`pt_BR.UTF-8`) passa.

A assinatura foi medida **antes** de qualquer hipótese: **um U+FFFD por byte**, não por
carácter. `é` (2 bytes) virava `��`; `—` (3 bytes) virava `���`; `çã` (4 bytes) virava `����` —
em todas as oito linhas afetadas, sem exceção. É a assinatura de decodificar UTF-8 como ASCII,
byte a byte. As **fontes estavam intactas** (o `--check` da âncora já o provava) e o defeito
nascia **dentro da geração**.

**O que foi decidido.**
- O gerador **não herda o locale do chamador**: `tools/lib-locale.sh` fixa um locale UTF-8 e
  **prova que ele resolve**, em vez de confiar no ambiente.
- A lib **falha alto** quando nenhum locale UTF-8 existe: sem ele, cada byte ≥ 0x80 vira
  U+FFFD — recusar é melhor que publicar corrupção em silêncio.
- O `check-pacote.js` passa a **procurar U+FFFD** nas saídas (HTML, CSS, JSON, Markdown) e
  **reprova**. Foi a lacuna que deixou o defeito chegar ao `pdflatex`: o pacote corrompido
  passava com **0 erro(s)**, 528 links internos e 31 páginas.

**Onde entrou.**
- `tools/lib-locale.sh` — **novo**; `exigir_locale_utf8()`, com prova do locale e falha explícita;
- `tools/gerar-ciclo.sh` — chama a lib no topo, antes de qualquer leitura ou escrita;
- `tools/check-pacote.js` — a checagem de U+FFFD nas saídas.

**Motivo declarado — os congelados.**
`tools/` está em `CONGELAMENTO.md`. A alteração **acrescenta um guarda e fixa o ambiente da
geração**: **não muda** a fórmula de hash, a cobertura da âncora, o contrato de extração, os
validadores, as regras nem as pétreas. O que se extrai das fontes sai **idêntico** — a correção
não toca o que se lê, e sim o locale sob o qual se lê. As âncoras dos ciclos existentes **não
foram regeradas**: as fontes nunca estiveram envolvidas. O porquê: a geração dependia do
ambiente de quem a invoca, e o defeito só aparecia no `pdflatex` — três camadas longe da causa.

**Com o quê.**
`tools/lib-locale.sh` (novo), `tools/gerar-ciclo.sh`, `tools/check-pacote.js`, `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` (o procedimento); `REGRAS.md` 16 (formato de entrega) e 17 (versionamento);
`PROTOCOLO.md` P-04 (saídas reconstruíveis — a geração não pode depender do ambiente de quem a
chama).

**O que ainda não está feito.**
- Os demais pontos de entrada que escrevem texto (`gerar-acompanhamento.sh`, `gerar-handoff.sh`,
  `gerar-vista.js`, `calendario.py`, `cifrar-dados.js`) **não** foram tocados: quando chamados
  pelo `gerar-ciclo.sh` herdam o locale corrigido, mas **invocados isoladamente** continuam
  dependendo do ambiente. Declarado, não resolvido.
- O ciclo da Diaghilev **ainda não foi commitado** — e é o commit seguinte a este.

- O `check-pacote.js` passa a **procurar U+FFFD** nas saídas (HTML, CSS, JSON, Markdown) e
  **reprova**. Foi a lacuna que deixou o defeito chegar ao `pdflatex`: o pacote corrompido
  passava com **0 erro(s)**, 528 links internos e 31 páginas.

> **Correção de 23/09/2026 (mesmo dia).** A primeira redação desta entrada dizia que "o pacote
> corrompido passava com 0 erro(s), 528 links internos e 31 páginas". **Está errado**: aquela
> medição — 0 erro(s), 528 links, 31 páginas — foi feita sobre um pacote **saudável**, gerado sob
> o locale do terminal; não mediu o pacote corrompido. O que se mediu no estado corrompido foi o
> contrário: o `check-pacote` **reprovou**, com 1 erro — `PDF: documentos ausentes no texto do
> PDF`, nomeando Caderno, Guia de observação e Método. A lacuna continua a existir (o check não
> procura U+FFFD, e se o PDF fosse regerado — impossível, o `pdflatex` morre antes — os dois lados
> estariam corrompidos e **coincidiriam**); mas o guarda existente **não** passou em silêncio. A
> versão anterior não é apagada: fica como o elo que registra o que se pensou antes da correção.

## 25/09/2026 — O HANDOFF truncado: o glob que abortava a geração em silêncio

**O que motivou.**
O `HANDOFF.md` — o **primeiro artefato que uma sessão nova lê** — estava sendo gerado **incompleto**.
A geração terminava com `exit=2`, o arquivo era escrito até a metade do laço e **duas seções inteiras
não saíam**: `## Documentos-chave (para leitura)` e `## Como retomar`. O arquivo no disco parecia
normal (464 linhas), e é justamente por isso que o defeito passou: **um HANDOFF truncado se lê como
um HANDOFF curto**. Quem abrisse a sessão seguinte não veria erro nenhum — veria menos.

A causa foi medida, não suposta. Em `tools/gerar-handoff.sh:189`, sob `set -euo pipefail`:

```bash
aulas_escritas="$(ls -1 "professores/$p/ciclos"/ciclo-"$c"-aula-*.md 2>/dev/null | wc -l)"
```

O glob era **cego ao sufixo da escola**: procurava `ciclo-01-aula-*.md`, e as aulas da Diaghilev se
chamam `ciclo-01-diaghilev-aula-0N.md`. Sem casamento, o `ls` saía com código **2**; o `2>/dev/null`
escondia a **mensagem**, não o **status** — e a atribuição herda o status do comando. O `set -e`
matava o script **sem imprimir nada**. O idioma `|| true` já é usado duas linhas abaixo, para
`eventos`/`n_eventos`: a armadilha era conhecida, e esta linha ficou de fora.

Como a iteração é `LC_ALL=C sort`, **fochini vem antes de tiago**: o aborto cortou também o
bullet que faltava ao tiago e as **duas seções finais**, que são escritas depois do laço.

**O que foi decidido.**
- O glob passa a ser **ciente da variante**: `find` com duas alternativas de nome
  (`ciclo-$c-aula-*.md` e `ciclo-$c-*-aula-*.md`), `-maxdepth 1` e **exclusão explícita de
  `*captura*`**.
- **Por que a exclusão importa:** `ciclo-01-diaghilev-captura-aula-01.md` casa com o padrão
  frouxo `ciclo-$c-*-aula-*.md`. Sem `! -name "*captura*"` o número **inflaria** — trocaríamos um
  defeito silencioso por outro, com o contador errado em vez do arquivo truncado. O `-maxdepth 1`
  impede descer para dentro das pastas de pacote (`ciclo-01-diaghilev/`).
- A contagem **não** muda de significado: continua sendo **aulas escritas em detalhe**, e folha de
  captura **não** é aula escrita.

**Onde entrou.**
- `tools/gerar-handoff.sh` — a linha 189 (`ls` → `find` ciente da variante) e, na mesma passagem,
  a redação de escopo da linha 213 (`âncoras FIPP` → `âncoras de proveniência`).

**Motivo declarado — os congelados.**
`tools/` está em `CONGELAMENTO.md`. Diferente das entradas de 23/09 — que declararam as mudanças em
`tools/` como **de redação, não de comportamento** —, **esta muda comportamento**, e por isso não
cabe naquelas: o gerador deixa de abortar e passa a **emitir seções que hoje não emite**. A
**fórmula de hash, a cobertura da âncora, o contrato de extração, os validadores, as regras e as
pétreas não foram tocados**; nenhuma âncora foi regerada e `--check` segue passando nos três ciclos.
O porquê: o HANDOFF é o ponto de entrada de toda sessão nova, e um gerador que falha em silêncio
deixa de ser fonte de verdade — sem que ninguém perceba, porque o resultado pela metade **parece
válido**. Não é obstáculo contornável: a correção foi levada ao usuário e aprovada antes de entrar.

**Prova de que o defeito é anterior a este trabalho.**
Em uma *worktree* limpa, destacada no `HEAD` (`ea80ad4`) e sem nenhuma alteração pendente,
`./tools/gerar-handoff.sh` reproduz **`exit=2`**, **462 linhas** e **zero** ocorrências de
`## Documentos-chave` e `## Como retomar`. A correção foi validada em isolamento nessa mesma
worktree — com ela, `exit=0`, as duas seções presentes, **486 linhas** e os bullets
`fochini · ciclo 01: aulas escritas em detalhe: 4 de 4` e `tiago · ciclo 01: … 2 de 12` (as quatro
capturas da Diaghilev **corretamente fora** da conta). No repositório real: `exit=0`, **489 linhas**,
as duas seções e a redação `âncoras de proveniência`. Rodado duas vezes seguidas, o resultado
difere **só** no carimbo `Gerado em:` — é idempotente no conteúdo.

**Com o quê.**
`tools/gerar-handoff.sh`, `HANDOFF.md` (regerado), `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` (o procedimento); a entrada de 23/09/2026 (o gerador e o locale) — é dela a
declaração de que as mudanças em `tools/` eram de redação, o que **valia para o que foi commitado
em `7accb29`** e não cobre esta; `REGRAS.md` 16 (formato de entrega) e 17 (versionamento);
`PROTOCOLO.md` P-04 (saídas reconstruíveis).

**O que ainda não está feito.**
O `HANDOFF.md` regerado passa a listar o **fochini** (que a versão anterior não via) e a trazer as
âncoras atuais — mas continua sendo saída gerada: nunca se edita à mão, corrige-se o gerador. As
**demais seções do laço** que usam glob direto não foram auditadas uma a uma; a única corrigida foi
a que abortava. Fica declarado, não resolvido.
---

## 25/09/2026 — "Não o que foi planejado": a memória da aula dada e o plano como linha de base

**O que motivou.**
O usuário contestou a frase canônica do projeto — *"a **memória da aula dada** … registra o processo
de ensino-aprendizagem que de fato se aplicou, **não o que foi planejado**"* — com um argumento
direto: **não existe memória da aula dada sem o planejamento da aula**. Se a eliciação fixa objetivo
específico, marcos por aula e volume, então **elicitar é também planejar**; e se o projeto de fato
não planejasse aula, estaria indo na direção errada.

O argumento foi verificado contra o repositório, e **o usuário estava certo**. Verificou-se:

- `professores/fochini/ciclos/ciclo-01-diaghilev-aula-02.md` é um **plano de aula completo** —
  front-matter (`objetivo-especifico`, `duracao: "60 minutos"`, `volume-total: "94 tempos"`,
  `referencias`) e nove seções, incluindo distribuição do tempo por parte da aula e a conta de
  volume que fecha em **94 tempos**, auditada contra as Regras 4 e 9. Há quatro irmãos (`aula-01`,
  `03`, `04`).
- E esses planos **entram na âncora**: `ciclo-01-diaghilev.conf` lista `aula-01 … aula-04` em
  `DOCS`. Entre os arquivos `aula-NN`, só `captura-aula-01` é artefato de captura — os demais são
  **planejamento**.
- `prompts/eliciar-ciclo.md` (congelado) **é** uma entrevista de planejamento: o Bloco 4 elicia o
  objetivo específico e o **parâmetro de medição da Aula 1** e "**os marcos parciais, aula a aula**",
  e impõe a forma da tabela de marcos "porque é a tabela que o extrator do plano lê como um objeto
  por aula (`{n, marco}`)". `prompts/instalar-ciclo.md` preenche, no passo 4, `-plano.md`,
  `-aula-01.md` e `-referencias.md`.
- `ARQUITETURA-AULA.md:3` descreve o ciclo de vida **planejada → dada → lançada → ajustada**, e a
  tabela de estados (`:20-21`) diz que **Planejada** é quando "existe a fonte `aula-NN.md`" e seu
  estado epistêmico é **intenção** — CRUD livre.
- O plano é **entrada do formulário**: `tools/templates/lancamento.html` carrega `po-<id>.json` e
  `plano-<id>.json` (`carregarEntradas`), e de `planoDoCiclo.marcosPorAula` sai o marco da aula —
  *"Sem o plano não há linha de marco — não se inventa o que a aula persegue."* E, quando a aula não
  segue o plano, o formulário **obriga** a responder *"O que mudou em relação ao plano:"*.

Diagnóstico: **a direção está certa, a redação estava errada.** A frase era uma oposição entre
**plano** e **registro** — mas, sem qualificação, lê-se como **negação de que se planeje**. Lida nos
**pontos de entrada** (é a primeira coisa que uma sessão nova encontra, e era também emitida pelo
`HANDOFF.md`), ela instituía uma identidade falsa — o mesmo tipo de defeito que a correção de
23/09 tratou: *quem entrava sem contexto saía com o contexto errado*.

**O que foi decidido.**
- A oposição **plano × registro** passa a ser declarada como **linha de base**, não como negação:
  > **Projeto Ciclo** — a **memória da aula dada**. Cada aula é **planejada** antes de ser dada: o
  > plano (`aula-NN.md`, que entra na âncora de proveniência) fixa objetivo, marcos e volume, e é
  > ele que dá a **linha de base**. O que a memória registra é o processo de ensino-aprendizagem que
  > de fato se aplicou — **o que mudou em relação ao plano** — e encadeia tudo o que muda.
- Acrescenta-se o par **intenção × fato**, que é a distinção real do projeto: o plano é **intenção**
  (editável enquanto a aula não foi dada); a partir da declaração **"aula dada"**, o registro passa a
  **fato** e **só se acrescenta ajuste** (`ARQUITETURA-AULA.md:35`).
- A formulação antiga entra na tabela de **"Formulações que não devem ser usadas"** do bloco
  canônico, para que a paráfrase errada não volte por imitação.
- **A versão curta** (nota de escopo do perfil `METODO.md`) e as seções "Escopo do projeto" dos
  agentes **não** carregavam a cláusula — nenhuma mudança nelas. `README-ciclos.md` já dizia
  "que de fato se aplicou." **com ponto final**, sem a negação — também fica como está.
- **`REGISTRO.md:2352` fica como está.** A redação antiga dentro da entrada de 23/09 é **elo**, não
  defeito: pela P-03/P-04 o passado se incorpora, não se reescreve. Esta entrada é que a corrige, e a
  aponta.

**Onde entrou.**
- `AGENTS.md` (bloco de identidade, o primeiro que se lê) e `README.md` — a versão longa nova, mais
  o bullet **intenção × fato**.
- `.github/instructions/ciclo-fontes.instructions.md` — o parágrafo de identidade.
- `.github/skills/identidade-do-projeto/SKILL.md` — a linha da tabela "A identidade canônica".
- `.github/skills/identidade-do-projeto/references/bloco-identidade.md` — a **fonte de cópia**: a
  versão longa, o bullet novo e a linha nova na tabela de formulações proibidas.
- `tools/gerar-handoff.sh` — a emissão da identidade no `HANDOFF.md`.

**Motivo declarado — os congelados.**
`tools/` está em `CONGELAMENTO.md`. A mudança é, como nas entradas de `tools/` de 23/09, **de
redação, não de comportamento**: o gerador passa a emitir o texto novo da identidade no lugar do
antigo, e continua emitindo as mesmas seções, na mesma ordem, a partir das mesmas fontes. **A
cláusula que motivou a mudança é uma afirmação sobre o objeto da memória — não uma regra de
geração.** A **fórmula de hash, a cobertura da âncora, o contrato de extração, os validadores, as
regras e as pétreas não foram tocados**; nenhuma âncora foi regerada e `--check` segue passando nos
três ciclos. O porquê: o HANDOFF é o primeiro artefato que uma sessão nova lê, e era ele que
repetia a identidade viciada — corrigir só os `.md` deixaria a emissão divergindo da fonte.
**Nenhuma fonte de ciclo mudou**, e por isso **não se reancora**.

**A redação anterior não é apagada.** Até esta entrada, a identidade publicada dizia, em `AGENTS.md`,
`README.md`, no bloco canônico e na emissão do `HANDOFF.md`:

> **Projeto Ciclo** — a **memória da aula dada**. Registra o processo de ensino-aprendizagem que de
> fato se aplicou, **não o que foi planejado**, e encadeia tudo o que muda.

**A cláusula está errada** — é ela que negava o planejamento da aula. O texto continua onde foi
escrito pela primeira vez: `REGISTRO.md:2352`, na entrada de 23/09/2026, e no histórico do Git. Fica
como o elo que registra o que se pensou antes da correção; esta entrada é a que o corrige.

**Com o quê.**
`AGENTS.md`, `README.md`, `.github/instructions/ciclo-fontes.instructions.md`,
`.github/skills/identidade-do-projeto/SKILL.md`,
`.github/skills/identidade-do-projeto/references/bloco-identidade.md`, `tools/gerar-handoff.sh`,
`HANDOFF.md` (regerado), `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` (o procedimento); a entrada de 23/09/2026 (a deriva de identidade e o segundo
passo da correção) — é dela o critério de que a redação antiga fica preservada como elo;
`ARQUITETURA-AULA.md` (planejada → dada → lançada → ajustada; intenção × fato);
`prompts/eliciar-ciclo.md` (a eliciação que planeja); `REGRAS.md` 17 (versionamento); `PROTOCOLO.md`
P-03/P-04 (a proveniência acrescenta, não edita).

**O que ainda não está feito.**
O **planejamento da aula ainda não tem todos os campos de que precisa** — o próprio
`experimentos/captura-json/RELATORIO.md` §4.6 declara a lacuna: **falta a estrutura executada** (que
viria do plano da aula e o JSON não carrega), o volume em tempos, o que foi abandonado, a linha de
base. E `ciclo-01-plano-schema.json` declara a sua própria: *"o calendário **NÃO** está no `.md`"*, e
os tipos do schema são os que **o documento oferece**, não os que o dado ideal teria. Corrigir a
redação **não** fecha essa lacuna — apenas deixa de negar a etapa que a tem. A ordem que o
repositório já registrou (`RELATORIO.md` §4.5) permanece: decidir onde o JSON vive, medir o custo do
hash-como-fonte, **escrever o validador do `dados.json`**, e só então um ciclo-piloto.

---

## 25/09/2026 — O campo `norma`: o PO ganha o padrão de referência que era o seu próprio produto

**O que motivou.**
O `po_ref/po.md` §6 é explícito: o produto do Plano de Observação **é a Norma** — "o PO estabelece a
NORMA que orientará toda a investigação", e "sem um Plano de Observação válido, a análise do ruído
não é possível". O §6.1 lista `Norma Estabelecida` ("padrão de referência contra o qual a execução
será confrontada") como componente **obrigatório**.

O PO deste repositório não tinha campo para ela. O schema declarava 12 campos de topo, e a norma só
existia de forma **implícita**, diluída em `linhaDeBase`. A consequência é a que o `po_ref` §6
nomeia: sem o campo, o padrão de referência não é explícito, e o ruído não pode ser identificado.
**A norma era o produto do PO e não tinha onde ser escrita.**

Junto com isso, uma medição. O cabeçalho do schema dizia `10 campos de topo (4 strings, 4 arrays, 2
objetos), que somam 17 folhas` desde `0dbd0af` — a criação. Medido com `python3` sobre `0dbd0af`,
sobre `HEAD` e sobre a árvore de trabalho, o schema **nunca** teve esses números: em `0dbd0af` media
`12 campos de topo (4 strings, 6 arrays, 2 objetos) = 19 folhas`. A prosa do cabeçalho contradizia o
próprio schema desde o dia em que foi commitada — 4 arrays declarados, 6 reais.

**O que foi decidido.**

- O campo de topo **`norma`** (string) entra depois de `subjects`, na **posição 6** de `required`.
  Posição ancorada: `po_ref` §5.3 `Definição dos Sujeitos` → §5.5 `Estabelecimento da Norma` → §5.6
  `Critérios de Conformidade`. O `linhaDeBase` é inserção **deste** repositório e não tem posição
  autoritativa — por isso a norma entra **antes** dele.
- O item de checklist **`normClearlyEstablished`** entra entre `scopeBoundariesClear` e
  `criteriaMutuallyExclusive`. O checklist vai de **5 para 6 itens**. Isto é **desvio deliberado** do
  `po_ref` §5.10, que lista cinco (`phenomenon_operationally_defined`, `scope_boundaries_clear`,
  `norm_clearly_established`, `justification_grounded`, `cut_feasible`). O desvio fica **declarado
  aqui**, não escondido.
- Fica declarada a distinção, para que os dois não se confundam: o **item do checklist** pergunta
  **SE** o padrão é identificável; o **campo `norma`** guarda **QUAL** é o padrão.
- A norma **não exige departamento formal**: pode ser a do próprio professor (a metodologia dele,
  que a P-13 já reconhece). A P-14 não se aplica a este campo.
- Quem escreve o campo é a **entrevista, nunca a dedução**. Enquanto a norma não for elicitada, o
  campo fica `[Preencher: norma — descreva o padrão de referência contra o qual a execução deste
  ciclo será confrontada]`.
- Os três `-po.md` ganham a seção `## Norma estabelecida` **entre `## Sujeitos` e `## Linha de
  base`**. A ordem foi **reordenada** neste commit: a seção estava depois de `## Linha de base`. A
  extração mapeia por **título**, não por ordem — a posição anterior era inofensiva em execução; a
  correção é pelo explícito, não por defeito funcional.
- O sexto item do checklist entra **desmarcado** (`- [ ]`). O `state` das três variantes é rebaixado
  de `Input_PO_Validado` para **`Input_PO_Aguardando`** — consequência visível e honesta: a norma
  ainda não foi elicitada.

**Onde entrou.**

`professores/fochini/ciclos/ciclo-01-po-schema.json` e
`professores/tiago/ciclos/ciclo-01-po-schema.json` (**byte-idênticos**,
`md5 c4dae983a15431d77d98fd4380b7404d`) — campo `norma`; item `normClearlyEstablished`; `required` de
topo 12 → 13; `validationChecklist.required` de 5 → 6; cabeçalho corrigido para `13 campos de topo
(5 strings, 6 arrays, 2 objetos), que somam 21 folhas`.

`professores/fochini/ciclos/ciclo-01-diaghilev-po.md`,
`professores/tiago/ciclos/ciclo-01-duo-po.md`,
`professores/tiago/ciclos/ciclo-01-ritmos-po.md` — seção `## Norma estabelecida` com a lacuna
explícita, reposicionada antes de `## Linha de base`; sexto item `### normClearlyEstablished`
desmarcado; `state` rebaixado a `Input_PO_Aguardando` no cabeçalho e nas notas de estado em prosa.

`REGISTRO.md` — esta entrada.

**Motivo declarado — os congelados.**
`tools/validar-po-ciclo.js` é congelado (`CONGELAMENTO.md`) e foi tocado: `MAPA_SECOES` ganha uma
chave, `'norma estabelecida': 'norma',` — 15 chaves agora, era 14. Sem isso o schema novo e o
documento novo não se encontrariam: a seção `## Norma estabelecida` seria **descartada** na extração,
e o validador acusaria `campo ausente: validationChecklist.normClearlyEstablished`. Comportamento
**verificado**, não suposto — foi o erro que apareceu antes do ajuste do mapa.

**O que não muda:** a fórmula do hash, a cobertura da âncora, `MAPA_COLUNAS`, a declaração
`DECLARACAO`, e a lógica de estado/saída — `estado declarado` continua sendo **eco**, nunca imposto;
nenhum estado novo é exigido ou validado. **Não há regra nem pétrea nova.** O campo é **aditivo**:
nenhum campo existente foi removido, renomeado ou teve tipo alterado.

O guarda-chuva do `pre-commit` é o que **obriga** este commit a ser único: o hook valida o PO em
**todo** commit, e os três `-po.md` já declaram o campo novo. Schema, mapa, três POs e as três âncoras
não podem landar separados — o repositório ficaria **incapaz de commitar**. Por isso um arquivo
congelado (`tools/validar-po-ciclo.js`) entra junto com conteúdo **aqui**, e o `PROTOCOLO.md` — que é
prosa pura e **não** está acoplado — foi deliberadamente deixado para um **commit próprio**, conforme
`CONGELAMENTO.md`: *"a mudança tem o seu próprio commit (não vai junto com conteúdo)"*.

**A redação anterior não é apagada.**
O cabeçalho do schema dizia, desde `0dbd0af`:

> "Estrutura: 10 campos de topo (4 strings, 4 arrays, 2 objetos), que somam 17 folhas."

Sempre foi falso — media 12 e 19 já na criação. A redação antiga fica como o **elo** que registra o
que se pensou antes; é recuperável pelo histórico do Git (`0dbd0af`). Não é reescrita silenciosamente.

E o elo maior: a entrada `## 25/09/2026 — "Não o que foi planejado"` (este mesmo dia) registrou o
argumento de que **não existe memória da aula dada sem o planejamento da aula**, e que **elicitar é
também planejar**. O campo `norma` continua essa linha — a norma do ciclo só existe se for elicitada,
e elicitá-la **é** planejar. O que aquela entrada deixou em aberto, *"o planejamento da aula ainda não
tem todos os campos de que precisa"*, é exatamente a lacuna que este campo começa a fechar, agora do
lado do PO.

**Com o quê.**

- `professores/fochini/ciclos/ciclo-01-po-schema.json`
- `professores/tiago/ciclos/ciclo-01-po-schema.json`
- `tools/validar-po-ciclo.js` (congelado)
- `professores/fochini/ciclos/ciclo-01-diaghilev-po.md`
- `professores/tiago/ciclos/ciclo-01-duo-po.md`
- `professores/tiago/ciclos/ciclo-01-ritmos-po.md`
- `professores/fochini/ciclos/ciclo-01-diaghilev.fipp`
- `professores/tiago/ciclos/ciclo-01-duo.fipp`
- `professores/tiago/ciclos/ciclo-01-ritmos.fipp`
- os pacotes regerados sob `professores/*/ciclos/ciclo-01-*` (passo 3 do `pre-commit`)
- `HANDOFF.md` (regerado)
- `REGISTRO.md`

**Reancoragem.** As três fontes de ciclo mudaram (os `*-po.md`), então os três `.fipp` foram
regerados com `tools/hash-ciclo.sh <professor> 01 <escola>` e conferidos com `--check`. O
`*-po-schema.json` **não** está na cobertura da âncora — o `3aeb3e7` já o provou: o schema sozinho
não reancoraria nada.

**Referências.**

- `po_ref/po.md` §5.3, §5.5, §5.6, §5.10, §6, §6.1 — a ordem autoritativa e a norma como produto.
- `REGISTRO.md` — a entrada `## 25/09/2026 — "Não o que foi planejado"`, deste mesmo dia.
- `PROTOCOLO.md` — P-03/P-04 (a proveniência acrescenta, não edita), P-13, P-14.
- `REGRAS.md` — Regra 8 (proveniência objetiva) e Regra 17 (versionamento com Git).
- `CONGELAMENTO.md` — o motivo declarado e o commit próprio.

**O que ainda não está feito.**

- **`PROTOCOLO.md:224` e `:229` estão desatualizados e não foram tocados aqui.** O `:224` lista os
  campos do PO e omite `norma`, `linhaDeBase` e `condicoesDeContorno` — a omissão é **anterior** a
  este campo; o `:229` diz *"os cinco itens do checklist"*, e agora são **seis**. Vão para um
  **commit próprio**, congelado, com o seu próprio motivo declarado. No mesmo `:224`,
  *"justificativa (4 subcampos)"* está **correto** (medido) e **não** muda.
- **A norma continua em `[Preencher]` nos três ciclos.** O campo existe; o conteúdo não. Quem o
  preenche é a **entrevista**, e ela ainda não foi reescrita — a próxima etapa é a versão amigável em
  `prompts/eliciar-ciclo.md`.
- O item `normClearlyEstablished` fica **desmarcado** até a norma ser elicitada; só então o `state`
  volta a `Input_PO_Validado`.
- **Pendência de forma em `ciclo-01-duo-po.md`:** o bloco `linha de base` tem **duas** tabelas; o
  extrator descarta a segunda e ainda assim sai com `exit=0` (2 avisos). Fica como dívida declarada,
  **não** corrigida neste commit.
---

## 25/09/2026 — `PROTOCOLO.md`: a tabela do PO passa a nomear o que o schema já exigia

**O que motivou.**
O commit `f5980c4` acrescentou o campo `norma` ao PO e levou o checklist de cinco para seis itens.
`PROTOCOLO.md` descreve, na seção `## Como o PO se materializa no ciclo`, **quais** campos o PO tem e
**quantos** itens o checklist exige. As duas frases ficaram desatualizadas no mesmo instante — e uma
delas já estava errada **antes**: o `:224` omitia `norma`, `linhaDeBase` e `condicoesDeContorno`
desde que esses campos entraram, muito antes deste dia.

A omissão é do tipo que custa caro. Um PO declara a norma; a norma é o **produto** do PO pelo
`po_ref` §6. Se `PROTOCOLO.md` — o documento que define o ciclo — não nomeia o campo, quem lê o
protocolo não sabe que ele existe. É o mesmo defeito que o `REGISTRO.md` já tratou como **defeito,
não detalhe de redação**: quem entrava sem contexto saía com o contexto errado.

**O que foi decidido.**

- **`:224`** passa a nomear os três campos ausentes, na ordem do schema: *"pergunta, fenômeno, campo
  empírico, contexto, sujeitos, **norma**, **linha de base**, critérios de inclusão e exclusão,
  justificativa (4 subcampos), **condições de contorno da execução**, limitações e checklist de
  validação"*.
- **`:229`** deixa de afirmar um número fixo. Em vez de trocar "cinco" por "seis" — o que só adiaria
  o mesmo defeito para a próxima mudança —, a redação passa a apontar para a **fonte**: *"quando
  **todos** os itens de `validationChecklist.required` estiverem marcados — hoje **seis**"*, com os
  seis nomeados. A contagem passa a ser a do **schema**, não a de `PROTOCOLO.md`. Acrescenta também a
  regra que o validador já pratica: item **presente e desmarcado** mantém o estado no aguardo.
- **`justificativa (4 subcampos)` não muda.** Foi medido: `justification` tem exatamente 4 subcampos.
  O texto estava correto e a correção não é varredura cega.
- **Nenhuma reancoragem.** Este é prosa sobre o PO, não fonte de ciclo. Os `professores/**/ciclos/
  ciclo-XX-*.md` não foram tocados, então os três `.fipp` permanecem válidos (`--check` sem
  alteração).

**Por que um commit próprio.**
`PROTOCOLO.md` é **congelado**. O `CONGELAMENTO.md` é explícito: a mudança em congelado *"tem o seu
próprio commit (não vai junto com conteúdo)"*. Por isso ela **não** entrou em `f5980c4`, mesmo sendo
consequência direta dele, e não entra em nenhum commit de conteúdo. É o mesmo desenho de `0b92a01`
(*"os congelados perdem a sigla"*): um motivo declarado, só arquivos congelados, zero conteúdo.

**Onde entrou.**

- `PROTOCOLO.md` (congelado) — as linhas `:224` e `:229` da tabela de `## Como o PO se materializa no
  ciclo`. Nada mais foi tocado no arquivo.
- `REGISTRO.md` — esta entrada.
- `HANDOFF.md` (regerado, porque é gerado e precisa emitir o estado novo).

**O que NÃO foi tocado.**

- `REGRAS.md`, `METODO.md`, `tools/`, `tools/templates/`, `prompts/`,
  `biblioteca/guia-do-professor.md` — congelados, sem motivo para mudar aqui.
- Os três `*-po.md` e os dois `*-po-schema.json` — já corrigidos em `f5980c4`.
- Os três `.fipp` — nenhuma fonte de ciclo mudou.

**Referências.**

- `f5980c4` — o commit que tornou as duas frases falsas.
- `po_ref/po.md` §6 — a norma como produto do PO; é a razão pela qual omitir o campo é grave.
- `CONGELAMENTO.md` — o motivo declarado e o commit próprio.
- `REGISTRO.md` — a entrada `## 25/09/2026 — O campo \`norma\`: …`, do mesmo dia.

---

## 25/09/2026 — A identidade visual passa a existir como contrato, e a paleta deixa de ter quatro cópias

**O que motivou.**
O pesquisador perguntou se "todos os projetos estão com a identidade visual". A varredura
respondeu que **não**, e por um motivo pior do que a ausência: a paleta **existia de fato** —
burgundy, ouro e creme, já em uso no site e no deck — e estava **copiada em quatro arquivos**,
cada um com o seu valor, **sem que nada avisasse** quando divergiam. A divergência era
silenciosa: o site saía com um ouro e o formulário com outro; o PDF não tinha cor nenhuma; e
nenhum validador olhava para nada disso.

Havia ainda uma armadilha de leitura que custou tempo. Neste projeto, **"harmonização" é a
P-21 — operação linguística** ("o fato permanece, o juízo sai"), não visual. Identidade visual
é outra coisa, e **não estava declarada em nenhum dos três repositórios**.

**O que foi decidido.**

- **A identidade passa a ter contrato escrito:** `IDENTIDADE-VISUAL.md`. Documento **novo** —
  logo, **livre** em `CONGELAMENTO.md`, que lista "novos documentos" entre o que continua livre.
- **A fonte de verdade é uma só: `tools/templates/ciclo.css`.** É o único arquivo do
  repositório onde um hex da paleta pode ser escrito; todo o resto **referencia**. Isso é a
  **Regra 16** levada à última consequência: `assets/style.css` é **cópia gerada** — muda-se a
  fonte e **regenera-se**, nunca se edita a cópia.
- **O critério é medido, não estimado:** WCAG 2.1 AA, **4,5:1** para texto e **3,0:1** para
  traço com função. A norma é aritmética.
- **O ouro se divide em quatro papéis, porque um só não serve.** Medido: `--gold` dá **3,65:1**
  sobre o burgundy — passa como **ornamento**, não como texto — e **2,92:1** sobre o creme, onde
  não passa como nada. Daí `--gold-claro` (texto sobre burgundy, 5,03:1), `--gold-texto` (texto
  sobre claro, ≥5,26:1), `--gold-escuro` (traço, ≥4,26:1) e `--sobre-ouro` (texto sobre o ouro,
  5,36:1). **O `--gold` permanece** — como ornamento. A regra que fica: **`--gold` nunca é cor
  de texto.**
- **O `--alerta` foi escurecido**, de `#a06000` para `#8f5a12`: o tom corrente dava **4,29:1**
  sobre o `--creme-2`, e o rótulo de parcial aparece em cabeçalho de tabela. Agora dá 4,92:1 no
  pior fundo.
- **Duas pilhas tipográficas, e a exceção é restrita.** `--serif` é a prosa institucional;
  `--ui` (sem serifa) fica **restrita ao maquinário de formulário** — os controles onde se
  digita e se clica. O texto em volta continua serifado.
- **O PDF entra na identidade.** O LaTeX não lê CSS, então as cores são **injetadas** da fonte na
  geração, via `tools/lib-tokens.js --latex`: 21 `\definecolor` + `\allsectionsfont` nos títulos
  (burgundy) + filete de ouro no rodapé. Verificado no PDF compilado: os títulos saem em
  `0.41962 0.12158 0.18039 rg` e o filete em `0.54118 0.4157 0.23137 rg` — os valores da fonte.
- **O deck declara, e o validador confere.** Sendo Marp (Markdown), o deck não consegue
  referenciar `var(--x)`; ele **declara** os tokens no bloco `style:` do frontmatter e o
  validador **reprova** o valor que não bater com a fonte — ou o token que não existir nela.
- **A checagem passa a existir:** `tools/check-identidade.js`, sem dependências externas, com
  **três** checagens — contraste (medido), cópia única (nenhum hex da paleta fora do `ciclo.css`)
  e circuito (a fonte chegou mesmo ao pacote). Era ela que faltava.

**Motivo declarado — os congelados.**
`tools/` e `tools/templates/` são **congelados** (`CONGELAMENTO.md`). A mudança entra com o seu
próprio motivo declarado, porque o congelamento só cede a quem diz **por quê**.

O motivo é que a identidade **não tinha como ser compartilhada** sem isso: enquanto cada
artefato mantivesse a sua cópia, "instituir a identidade" seria escrever um documento que o
código contradiz. O congelamento existe para proteger o que funciona — e o que ele estava
protegendo, neste ponto, era a divergência silenciosa.

**O que NÃO muda** — a fórmula de hash, a cobertura da âncora, as 17 regras, as 22 pétreas, as
5 validações do `pre-commit` e a estrutura de menu. Em especial: **a âncora não cobre a
identidade**. `tools/hash-ciclo.sh` hasheia as **fontes de ciclo** daquele professor
(manifestos, PO, documentos, relatórios); o `ciclo.css` **não entra**. Mudar a paleta **não
reancora** `.fipp` — o que exige é **regenerar os pacotes**, porque a cópia em `assets/` é
gerada. Foi verificado, não suposto: os três `--check` passam e **nenhum `.fipp` mudou**.

**O que foi corrigido por estar no caminho.**

- **A nav passou a ser um arquivo, não um bloco colado.** O `<script>` inline do `ciclo.html`
  virou `tools/templates/nav.js`, copiado para cada pacote — e o `gerar-ciclo.sh` passou a
  copiá-lo. Sem isso, a barra e o menu mobile dependeriam de código duplicado em cada template.
- **Um defeito pré-existente, acoplado:** o `rizoma-animado.html` saía com `xmlns` e `style`
  **em dobro** na tag `<svg>` (o gerador re-adicionava o que o SVG de origem já trazia).
  Inofensivo — o HTML resolve pelo primeiro atributo —, mas estava colado ao hex `#fbf8f3` que
  esta frente elimina, então foi corrigido junto.
- **Um defeito introduzido e corrigido nesta mesma frente:** o `@CORES@` do cabeçalho LaTeX é
  **citado** em dois comentários que documentam a injeção. A primeira versão da substituição era
  um `replace` global e injetou o bloco inteiro **dentro dos comentários** — o PDF compilava
  mesmo assim, com o primeiro `\definecolor` dentro do comentário e três cópias do bloco. A
  substituição passou a trocar **apenas a linha que é só o marcador**, e a **abortar** se não
  achar exatamente uma.
- **Um defeito de redação no próprio validador:** a checagem do deck fatiava o texto, e o número
  de linha reportado era **relativo ao recorte**, não ao arquivo. O fora-de-escopo passou a ser
  **mascarado** (vira espaço, mantendo as quebras), para o erro apontar a linha certa.

**Onde entrou.**

- `IDENTIDADE-VISUAL.md` — **novo**. O contrato: tokens, papéis, critério, exceções.
- `tools/templates/ciclo.css` — a fonte de verdade: 7 tokens viram 21 cores + 3 pilhas/medidas.
- `tools/lib-tokens.js` — **novo**. A ponte para quem não é CSS (JS e LaTeX).
- `tools/check-identidade.js` — **novo**. Contraste, cópia única, circuito.
- `tools/templates/nav.js` — **novo**. A nav compartilhada.
- `tools/templates/ciclo.html` — o script inline sai; entra `assets/nav.js`.
- `tools/templates/lancamento.html` — o `:root` local **sai** (era ele que fazia os valores
  locais vencerem o `style.css`); a camada de estilo passa a ser servida por tokens.
- `tools/templates/ciclo-cabecalho.tex` — recebe `xcolor`/`sectsty`, o marcador `@CORES@` e o
  filete de ouro do rodapé.
- `tools/gerar-ciclo.sh` — copia `nav.js` e injeta as cores.
- `tools/gerar-animacao.js`, `tools/sincronizar-slide.js` — leem a fonte por `lib-tokens`.
- `apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md` — nomes canônicos; o deck
  declara a identidade, e o validador confere.
- Os **três pacotes**, regenerados: `assets/style.css` idêntico à fonte e `assets/nav.js` no
  lugar. Diaghilev (0 erro, 0 aviso), Duo e Ritmos (0 erro, 6 avisos **pré-existentes** — são os
  símbolos do glossário sem uso no corpo, não da identidade).

**Com o quê.**
`IDENTIDADE-VISUAL.md`, `tools/lib-tokens.js`, `tools/check-identidade.js`,
`tools/templates/nav.js`, `tools/templates/ciclo.css`, `tools/templates/ciclo.html`,
`tools/templates/lancamento.html`, `tools/templates/ciclo-cabecalho.tex`,
`tools/gerar-ciclo.sh`, `tools/gerar-animacao.js`, `tools/sincronizar-slide.js`,
`apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md` e os três pacotes.

**Referências.**
WCAG 2.1 (contraste mínimo, níveis AA); `CONGELAMENTO.md` (rito dos congelados; "novos
documentos" entre os livres); `REGRAS.md` **Regra 16** (folha de estilo única) e **Regra 17**
(o `pre-commit`); `IDENTIDADE-VISUAL.md`; o Projeto Cultura, onde a identidade já era medida por
comando — o precedente do critério.

**O que ainda não está feito.**

- **O desenho do mapa não foi tocado.** O deck tem **três** falhas de contraste medidas —
  `#ffffff` sobre `#b08d57` (**3,09**), `#fdf6ea` sobre `#b08d57` (**2,88**) e `#8a6a3b` sobre
  `#e8dcc8` (**3,69**) — mas elas vivem no **desenho** (`rizoma-slide.svg`, o mapa embutido no
  deck e os outros SVGs), **não** no CSS. O gerador casa o SVG **como texto literal**, então um
  `var(--gold)` ali não resolveria: mudar essas cores é mudar o desenho, e por isso ficam como
  **dívida declarada**, não como correção deste commit.
- **O `check-identidade.js` ainda não entrou no rito.** Ele existe e passa, mas **não** é
  chamado pelo `pre-commit`. Enquanto não for, a checagem depende de alguém lembrar de rodá-la.
- **Nada foi commitado.** A frente espera o commit próprio do rito; o `prompts/eliciar-ciclo.md`
  tem modificação **pré-existente** e **não** pertence a esta mudança.
- **A Frente B segue intocada:** os dois defeitos do formulário (o `gerar-ciclo.sh` extrai só a
  `captura-aula-01`, e o `DOCS` é escrito à mão) e as decisões em aberto da captura (§7.2, §7.4,
  §7.5).

## 25/09/2026 — A hora da aula entra no `DIAS`, e o calendário passa a ter de onde contar o prazo

**O que motivou.**
A `ARQUITETURA-AULA.md` §3.1 define o prazo de lançamento como *"o menor entre 24 h antes da
próxima data de aula e o fim do bloco + 18 h"*, com piso de 18 h. A fórmula é aritmética sobre
**instantes** — e o sistema não conhecia **hora nenhuma**. O Pré-requisito 5 exigia
`ESCOLA FREQUENCIA DIAS DURACOES DATA_INICIO TOTAL_AULAS`: o `DIAS` era uma lista de números ISO
(`"5"`, `"2,6,6"`), sem hora, e nenhum documento de ciclo a declarava em campo próprio. O
`lancamento.html` compensava com um `HORAS_DO_PRAZO = 48` fixo, que **não é** a fórmula do §3 e
não tem como sê-la: sem a hora de início, "24 h antes da próxima aula" não é calculável.

Esta é a **peça 1 das dez** da ordem de execução declarada em `ARQUITETURA-AULA.md` §10 — a
única das dez que já estava especificada o bastante para executar sem antes decidir mais nada.
Sem ela, o prazo (§3, peça 7) não tem de onde contar.

**O que foi decidido.**

- **A hora entra no `DIAS`, junto do dia, com `@`:** `DIAS="2@19:00,6@08:00,6@09:00"` (Ritmos:
  terça às 19h, e as duas aulas do sábado às 8h e às 9h). A hora e o
  dia **não podem divergir**, então não podem ser listas paralelas — quem editasse o `DIAS` sem o
  `HORARIOS` desalinharia em silêncio, e o erro só apareceria no prazo. A forma antiga, só com o
  número, é **recusada com mensagem**, não aceita com valor padrão: assumir "19:00" faria o prazo
  sair errado sem que ninguém soubesse de onde veio o número.
- **A hora é a de INÍCIO; o fim é derivado** — `início + duração`, e a duração já vem do
  `DURACOES`. Nenhum campo novo de horário de término: seria dado redundante que pode contradizer
  o que já existe.
- **Cada ocorrência do dia traz a sua hora.** É isso que distingue as duas aulas do mesmo sábado
  (a do Ritmos, 8h e 9h) — o `DIAS="2,6,6"` já repetia o dia para contar duas aulas, mas as
  duas ficavam indistinguíveis no relógio.
- **O `calendario.py` publica a hora, não só a consome.** O bloco do calendário ganhou a linha
  `- **Horário:**` (e ela é derivada, como todo o resto do bloco: nada foi escrito à mão nos
  `.md`), e o modo novo `--aulas-arquivo` escreve uma **linha por aula** — `NN`, data ISO,
  início, fim — que é o que o índice por aula (§4.2) e o cálculo do prazo (§3.1) vão consumir.
  O contrato é TSV e o `fim` já vem calculado, porque o prazo conta do **fim do bloco**.
- **A hora do Diaghilev é declarada FICTÍCIA.** Aquele ciclo é declaradamente simulado e não
  houve aula real de onde transcrevê-la — o `.conf` diz isso na própria linha. Nos dois ciclos do
  Tiago a hora foi lida do caderno (`caderno-01-duo.md`: 18h30–19h30; `caderno-01-ritmos.md`:
  8h–10h), não estimada.

**A trava que o desenho não previa.**
O `.conf` não é validado só pelo `hash-ciclo.sh`: há um **schema JSON por professor**
(`ciclo-01-schema.json`) que trava `DIAS` com o `pattern ^[1-7](,[1-7])*$`. Mudar a sintaxe exige
mexer **nos dois** — o schema aborta antes de o hash ser comparado, com
`1 campo(s) com valor fora do padrão: DIAS="5@18:30"`. O `ARQUITETURA-AULA.md` §6 previa "o
schema, o Pré-requisito 5 e os três `.conf`"; os dois schemas existentes eram o item que a
contagem deixava implícito.

**Onde entrou.**

- `tools/calendario.py` — **a única ferramenta que precisou mudar**, e por um motivo que o
  desenho não previa: ele **é** quem interpreta o `DIAS`. Ganhou a gramática `dia@HH:MM` (hora
  obrigatória, com mensagem de recusa que diz o formato certo), `minutos_do_dia()` para a
  N-ésima aula de um dia, a hora e a duração por aula no bloco, a linha `Horário:` e o modo
  `--aulas-arquivo` (TSV `NN data início fim`).
- `professores/tiago/ciclos/ciclo-01-schema.json` e `professores/fochini/ciclos/ciclo-01-schema.json`
  — o `pattern` de `DIAS` vira `^[1-7]@HH:MM(,...)*$`, com a hora obrigatória na descrição.
- Os **três `.conf`** — `ciclo-01-duo.conf` (`5@18:30`), `ciclo-01-ritmos.conf`
  (`2@19:00,6@08:00,6@09:00`) e `ciclo-01-diaghilev.conf` (`2@19:00,4@19:00`, hora fictícia
  declarada).
- `REGRAS.md`, `README-ciclos.md` e `.github/agents/ciclo-entrega.agent.md` — o **Pré-requisito 5**
  passa a nomear o **horário de início** entre o que o contexto institucional exige. Os três são
  **documentação**, não infraestrutura — dos três, só `REGRAS.md` é congelado.
- `README.md` — só o **exemplo de comando** do `calendario.py` (`--dias 5` → `--dias 5@18:30`).
  Não é Pré-requisito 5 e não é congelado: sem o ajuste, o exemplo documentado seria
  **recusado** pelo próprio `parse_dias` que este commit instala.
- `ARQUITETURA-AULA.md` — §6 e §10 marcados como **feitos** (o desenho é da sessão anterior; o
  que muda aqui é o estado).
- Os **três pacotes**, regenerados, e os **três `.fipp`**, reancorados.

**Motivo declarado — os congelados.**
Toca **dois** arquivos congelados: `tools/calendario.py` (sob o congelamento de `tools/`) e
`REGRAS.md` (listado por nome no `CONGELAMENTO.md`). Cada um exige motivo declarado, entrada
neste arquivo e **commit próprio**, que não vai junto com conteúdo.

**O motivo, para os dois, é o mesmo fato:** o `DIAS` ganhou forma nova, e a hora passou a ser
**obrigatória**. No `calendario.py`, a consequência é direta — sem a hora ele não calcula o fim
do bloco, e sem o fim do bloco não há prazo (§3.1); a forma antiga, só com o número, é
**recusada com mensagem**, e é isso que impede o valor padrão silencioso. No `REGRAS.md`, o
Pré-requisito 5 deixaria de descrever o que o gerador de fato exige: o texto dizia "dias e
duração por dia" e o código passou a exigir "dias **com o horário de início de cada aula**".
Não há como mudar o formato sem mudar o texto que o declara e a ferramenta que o lê.

**Nota de correção — 25/09/2026.** A primeira redação desta entrada dizia que a frente tocava
`tools/gerar-vista.js` e `tools/gerar-ciclo.sh`, e os nomeava no rito. **Está errado**:
nenhum dos dois tem uma linha de alteração por B1 — `git diff` nos dois dá zero, e as 33
linhas que aparecem em `gerar-ciclo.sh` são da **Frente A** (`nav.js`, `lib-tokens`, `@CORES@`),
não desta. Os dois passam o `DIAS` adiante como texto opaco. Quem consome a gramática é só o
`calendario.py`. A redação foi corrigida; a versão anterior não é apagada: fica como o elo que
registra o que se pensou antes da conferência.

**Nota de correção — 25/09/2026 (segunda).** A primeira redação dizia também que o
`calendario.py` **não consta** da lista do §8 do `ARQUITETURA-AULA.md` e tratava isso como
"lacuna da lista". **Está impreciso**: o §8 é o roteiro **daquela frente** (o formulário), e
não tenta ser a lista dos congelados — essa lista é o `CONGELAMENTO.md`, que congela `tools/`
**em bloco**. Não há lacuna a corrigir no §8: havia, sim, um arquivo tocado (`calendario.py`)
que o roteiro da frente não previa, e o rito foi cumprido por isso mesmo. O mesmo vale para o
`REGRAS.md`, que a primeira redação tocava sem declarar.

**Nota de correção — 25/09/2026 (terceira).** A primeira redação contava "**6 saídas geradas**
… **17 arquivos ao todo**". **Está errado**: os três pacotes regenerados são **66 arquivos**
(não 3) — a regeneração reescreve o pacote inteiro —, mais os três `.fipp`, dá **69 saídas**.
A contagem foi corrigida; ficam declarados os **11 nomes** das fontes, que é o número que
importa para o rito, e as saídas ficam **sem contagem**, porque o pacote é gerado e o
`git diff` dele **mistura esta entrada com a Frente A**, ainda não commitada.

**O que não muda** — a fórmula de hash (o `hash = SHA256(id + ':' + type + ':' + parentHash + ':' + conteudo)`
fica intacta), a cobertura da âncora, as 17 regras, as 22 pétreas, as 5 validações do `pre-commit`
e a estrutura de menu. O `DURACOES` continua sendo quem manda na duração; `DURACAO_POR_DIA` segue
**descritivo**, como já era.

**Reancoragem — declarada.** O `.conf` **é fonte de ciclo** (o `hash-ciclo.sh` filtra por
`professores/<professor>/*`, e não só por `ciclos/*.md`), então mudar o `DIAS` mudou o hash dos
três. Os três foram reancorados com `tools/hash-ciclo.sh` e os três `--check` passam:
`duo` → `4f6e2183…`, `ritmos` → `b7a17a86…`, `diaghilev` → `a8b32d1f…`. **Regenerar o pacote,
sozinho, não reancora** — foi preciso rodar o `hash-ciclo.sh` depois. Os três abrem a cadeia
(`parentHash:` vazio), como antes.

**Com o quê.**
`tools/calendario.py`, `professores/tiago/ciclos/ciclo-01-schema.json`,
`professores/fochini/ciclos/ciclo-01-schema.json`, os três `.conf` de ciclo (`ciclo-01-duo.conf`,
`ciclo-01-ritmos.conf`, `ciclo-01-diaghilev.conf`), `README.md`, `README-ciclos.md`, `REGRAS.md`,
`.github/agents/ciclo-entrega.agent.md` e `ARQUITETURA-AULA.md` — **11 fontes** — mais os três
pacotes regenerados e os três `.fipp` reancorados — saídas geradas, que **não se editam à mão**.
Dos 11, **2 são congelados** (`tools/calendario.py` e `REGRAS.md`); os outros 9 não são.

**Referências.**
`ARQUITETURA-AULA.md` §3.1 (a fórmula do prazo), §4.2 (o índice por aula que consome o TSV), §6
(a hora no `DIAS`) e §10 (a ordem de execução); `CONGELAMENTO.md` (o rito dos congelados);
`REGRAS.md` **Regra 10** (camada 2 do calendário) e **Regra 17** (o `pre-commit`);
`professores/tiago/cadernos/ciclo-01/caderno-01-duo.md` e `caderno-01-ritmos.md` — a evidência da
hora.

**O que ainda não está feito.**

- **Nada foi commitado.** Esta entrada e as alterações esperam o commit próprio do rito, que
  precisa ser **separado** do commit da identidade visual (Frente A) — são duas mudanças
  distintas. O `prompts/eliciar-ciclo.md` tem modificação **pré-existente** que não pertence a
  nenhuma das duas e deve ficar de fora.
- **O consumidor do `--aulas-arquivo` ainda não existe.** O TSV está escrito e o formato está
  fechado, mas quem o lê é o índice por aula (§4.2, peça 4) e o prazo (§3, peça 7) — nenhum dos
  dois implementado. Hoje **não há teste de ponta a ponta** dessa ponte: só a geração do arquivo
  foi verificada.
- **As 48 h continuam valendo no `lancamento.html`.** O `HORAS_DO_PRAZO = 48` **não** foi
  trocado pela fórmula do §3: trocá-lo é a peça 7, e depende do índice por aula. Até lá o
  formulário segue como estava — agora com o dado que a fórmula vai precisar já disponível.
- **As outras nove peças do §10 seguem intocadas.** Os dois defeitos do formulário (o
  `gerar-ciclo.sh` extrai só a `captura-aula-01`; o `DOCS` é escrito à mão), a âncora por aula, a
  declaração "aula dada", o ajuste no plano, a P-13 e a eliciação.
- **O roteiro do §8 não previa o `calendario.py`.** A lista do `ARQUITETURA-AULA.md` §8 nomeia
  `gerar-ciclo.sh`, `lib-fontes.sh`, `hash-ciclo.sh`, `lancamento.html`,
  `validar-captura-ciclo.js`, `check-pacote.js`, `pre-commit`, `PROTOCOLO.md` e
  `eliciar-ciclo.md`. O `calendario.py` entrou sem estar nela. **Não é lacuna do §8** — o §8 é o
  roteiro daquela frente, e a lista que define o congelamento é o `CONGELAMENTO.md`, que congela
  `tools/` **em bloco**: o arquivo já era congelado antes de o roteiro mencioná-lo. Fica
  registrado como **arquivo tocado fora do roteiro**, e o rito foi cumprido por isso.
- **A Frente A continua sem commit.** `check-identidade.js` ainda não entrou no `pre-commit`, e
  as três falhas de contraste do **desenho** do mapa seguem como dívida declarada.

> **Correção de 26/09/2026 (nota de `B7`).** Esta entrada cita o §3.1 como *"o menor entre 24h
> antes da próxima data de aula e o fim do bloco + 18h"*. **O `menor` do §3.1 é erro de
> digitação**: medido contra os três cronogramas reais, o operador correto é **`maior`** — `max`
> reproduz os números da tabela do §3.2 (Duo **143 h**, Diaghilev **23 h** e **95 h**) e os
> literais de `prazo` do §4.2 **ao minuto**, enquanto `min` devolveria o piso de 18 h em **100%**
> das datas. A citação acima **não é apagada**: fica como o elo que registra o que se leu antes da
> correção (P-03/P-04). O §3.1 foi corrigido em `ARQUITETURA-AULA.md` — arquivo **livre**, fora da
> cobertura da âncora, logo **sem reancoragem**. **O que não muda nesta peça:** a hora no `DIAS`,
> o `calendario.py`, o schema, os três `.conf`, os três pacotes e as três âncoras — nada do que
> aqui se fez dependia do operador.
>
> Cai também, pelo mesmo motivo, a afirmação *"as outras nove peças do §10 seguem intocadas"*: a
> **peça 2** (o `DOCS` derivado) foi entregue em 26/09/2026 — é a entrada seguinte. **São oito.**
> E o `HORAS_DO_PRAZO = 48` do `lancamento.html` segue como estava: substituí-lo pela fórmula do
> §3 é a **peça 7**, com rito próprio.

## 26/09/2026 — O `DOCS` deixa de ser lista à mão: as famílias por aula entram na âncora

**O que motivou.**
O `ARQUITETURA-AULA.md` §4.1 registra dois defeitos medidos no formulário; este é o **Defeito 2**.
O `DOCS` do manifesto é uma **lista nominal escrita à mão**, herdada de quando só a primeira aula
estava escrita. Medido, no ciclo da Diaghilev:

```
DOCS declara:   captura-aula-01       (só a 01)
no disco:       captura-aula-01..04   (as 4 existem)
no .fipp:       captura-aula-01       (só a 01 é FONTE)
```

Consequência: **apagar a folha da aula 02 não quebrava a âncora** — a folha não era fonte, e o
`--check` passava. As folhas 02–04 existiam no disco e o sistema **não as via**.

**O que foi decidido.**
O `DOCS` deixa de ser lista nominal e passa a ser **tipos + ordem**: `aula-*` e `captura-aula-*`
expandem para todo NN existente no disco, **na posição do primeiro membro declarado** da família.

A expansão mora em `tools/lib-fontes.sh`, e a razão é medida: o gerador e o hasher leem o `DOCS`
em **processos separados**, e o único ponto que os dois atravessam é esta lib (`gerar-ciclo.sh:99`
e `hash-ciclo.sh:150`). Se a derivação ficasse só no gerador, a âncora cobriria um conjunto de
arquivos diferente do pacote publicado — e **cada `--check` acusaria uma divergência inexistente**.
A expansão roda ao carregar a lib, é **idempotente** (o `source` pode repetir), e o `DOCS` é
**exportado** porque o hasher o consome num subshell.

A família expande **uma vez**: os membros declarados seguintes são absorvidos. Sem essa regra, o
`DOCS` do fochini — que já declarava `aula-01` a `aula-04` — produziria 16 entradas em vez de 4.

**Decisão de escopo declarada: o `tools/check-pacote.js` permanece conservador.** Ele **não** passa
a expandir famílias; segue lendo o `DOCS` do `.conf` com regex própria. É seguro porque ele
**deriva** a lista de obrigatórios e a expansão apenas **acrescenta** páginas — as páginas novas
são conferidas pelo `<h1>` contra o texto do PDF (`check-pacote.js:349-361`), logo não há
falso-negativo. O validador será revisto na peça `B11` de qualquer forma.

Além da lib, uma decisão de **título**: as seis folhas de captura tinham `title:` **idêntico**
(`"Captura em aula — para impressão"`), e esse título é **impresso** — é o `<h1>` da página
(`ciclo.html:21`) e o nome da seção no PDF (`titulo_legivel()`). Sem tratamento, a Diaghilev
publicaria quatro páginas de `<h1>` idêntico e quatro seções de PDF de nome idêntico, e o
`check-pacote.js:349-361` — que confere o `<h1>` de cada página contra o PDF — não teria como
distingui-las. O título passa a carregar o NN, **na fonte** e não no gerador: é o mesmo padrão do
`guia-de-observacao-NN`, cujo título o gerador já deriva (`lib-vistas.js:526`). Tratar no gerador
faria o `<h1>` divergir da fonte, contra a decisão registrada em 20/09 (`gerar-ciclo.sh:574-580`).

**Onde entrou.**

- **`tools/lib-fontes.sh`** — **congelado** (`CONGELAMENTO.md`: `tools/` em bloco). Ganhou as
  funções `familias_por_aula()` e `docs_derivado()`, e o bloco que reescreve e exporta o `DOCS` ao
  carregar a lib. **+64 linhas, 0 removidas.**
- **`professores/fochini/ciclos/ciclo-01-diaghilev-captura-aula-0{1,2,3,4}.md`** — o `title:` passa
  a `"Captura em aula — Aula NN — para impressão"` (1+/1− cada).
- **`professores/tiago/ciclos/ciclo-01-captura-aula-01.md`** e
  **`professores/tiago/ciclos/ciclo-01-ritmos-captura-aula-01.md`** — idem (1+/1− cada).
- **`README-ciclos.md`** — **não congelado**. A receita do ciclo novo (linhas 254–258) documentava
  o `DOCS` como lista à mão; passa a documentar tipos + ordem.
- **`ARQUITETURA-AULA.md`** — **não congelado**. A §4.1 descrevia o Defeito 2 como aberto; recebeu
  nota datada de correção, sem apagar o elo anterior.
- **`REGISTRO.md`** — esta entrada.

**Não entrou, e é deliberado:** o `tools/check-pacote.js` (decisão acima) e o
`tools/gerar-ciclo.sh` — o caminho de páginas do gerador **já convergia**: ele chama `e_vista()`
antes de `fonte_md()`, e uma folha expandida nunca casa `e_vista`, então cai em `fonte_md` e é
descartada com tolerância por `[ -f "$src" ] || continue` (`gerar-ciclo.sh:329`).

**Motivo declarado — os congelados.**

- **`tools/lib-fontes.sh`** — único ponto comum entre o gerador e a âncora. Sem a expansão aqui, o
  Defeito 2 não tem correção possível: a âncora continuaria a não ver as folhas 02–N. O arquivo
  estava na lista autorizada pelo `ARQUITETURA-AULA.md` §8 (autorizada pela pesquisadora em
  23/09/2026).
- **As seis folhas de captura** estão em `professores/**/ciclos/`, que **não** é congelado. Foram
  tocadas por uma decisão de desenho de título (acima), não por conveniência.

**Com o quê.**
Conferido por medição, ponta a ponta:

- **Harness antes/depois** (`docs-de-cada-escola.sh`, reproduz a ordem de carga dos dois
  consumidores): Duo e Ritmos saem **idênticos** ao "antes" — onde nada foi declarado, nada muda.
  A Diaghilev ganha **exatamente** `captura-aula-02 captura-aula-03 captura-aula-04`, **na posição**
  da 01. Nenhum documento perdido, nenhuma ordem curada alterada.
- **Idempotência**: três `source` consecutivos da lib produzem o mesmo `DOCS` nas três escolas.
- **Precedência da escola preservada**: `fonte_md` continua resolvendo `captura-aula-01` para
  `ciclo-01-ritmos-captura-aula-01.md` no Ritmos e para `ciclo-01-diaghilev-…` na Diaghilev.
- **Os três pacotes regenerados, 0 erro**: Duo 21 páginas HTML, Ritmos 22, **Diaghilev 17**
  (era 14) — as três páginas novas são exatamente as folhas 02–04.
- **`check-pacote.js` nos três**: 0 erro (6, 6 e 0 avisos — os 6 pré-existentes das escolas do
  tiago).
- **`--check` nos três**: `íntegro; cadeia intacta`.
- **Cobertura da âncora da Diaghilev: 13 → 17 fontes.** As quatro folhas agora estão cobertas.
- **A prova do defeito, refeita depois da correção**: com a folha da aula 02 movida para fora, o
  `--check` **acusa** — `erro: a lista de fontes cobertas mudou (arquivo criado ou removido)`,
  apontando a linha da folha removida. Antes desta mudança, o mesmo teste passava em silêncio. O
  arquivo foi restaurado e o `--check` volta a ficar íntegro.
- **Os títulos, no artefato**: as páginas publicam `<h1>Captura em aula — Aula 0N — para
  impressão</h1>` distintos; aparecem distintos no menu e no rodapé; e as quatro seções do PDF saem
  com os quatro nomes distintos. O travessão `—` sobrevive ao `<h1>` e ao texto do PDF, e a
  comparação do `check-pacote.js` **normaliza** antes de comparar — logo não há falso negativo.

**Referências.**

- `ARQUITETURA-AULA.md` §4.1 (o Defeito 2), §4.2 (o índice por aula), §8 (a lista dos congelados).
- `CONGELAMENTO.md` — `tools/` é congelado em bloco.
- `README-ciclos.md` — a receita do ciclo novo, agora com o `DOCS` derivado.
- `lib-vistas.js:526` — o precedente do NN no título de uma vista gerada.
- `gerar-ciclo.sh:574-580` — o comentário de 20/09/2026 que fixa o título como pertencente à fonte.

**O que ainda não está feito.**

- **O Defeito 1 segue aberto.** O gerador continua extraindo **só** a `captura-aula-01`, e a página
  de qualquer aula monta esse mesmo painel: os quatro formulários ainda saem idênticos. Entregar a
  config da aula certa é a peça `B3` — a prova de que saem quatro diferentes já existe em
  `experimentos/provar-por-aula.js`.
- **O `tools/check-pacote.js` continua conservador**, como decidido acima. Se a peça `B11` não o
  revisar, ele seguirá sem saber expandir família — o que é suficiente, porque deriva os
  obrigatórios e confere as páginas pelo `<h1>`.
- **Nada foi commitado.** O commit desta peça é próprio e ainda não foi feito, como o de `B1` e o
  da Frente A — os três seguem pendentes e separados.
- **O `HANDOFF.md` não foi regenerado.** Ele ainda descreve o `DOCS` como escrito à mão; a
  regeneração acompanha o commit, não esta peça.

## 26/09/2026 — A P-13 deixa de sugerir que o dado é privado do professor: a escola entra no escopo

**O que motivou.**

A **P-13** fixa o eixo do sistema — o PO é do professor, e o recorte observacional é decisão
dele. Isso foi confirmado e **não muda**. O que ela erra é a oposição *"O PO é do professor, não
do projeto"*: ela é **falsa** e **deixa a escola de fora**, sugerindo que o material não interessa
a mais ninguém.

O que a pesquisadora definiu: a **organização e o lançamento são por professor** — é ele que sabe
o seu plano, é ele que lança, e a escola procura por ele (*"quero saber as aulas da professora
Rita"*); **o dado pertence à escola** — ela pagou pelo processo, e o professor **conduz**; e o
**acesso é por escola** — a senha é da escola. O texto do ajuste é a §9 do `ARQUITETURA-AULA.md`,
que já declara o seu próprio motivo: a pétrea *"induzia à leitura de que o material é privado do
professor, quando o dado é custodiado pela escola"*.

**O que foi decidido.**

- **Acrescentar, sem reescrever.** A §9 manda em texto: *"O ajuste é acrescentar a segunda e a
  terceira, sem tocar no que a pétrea já diz bem. Ela não precisa ser reescrita: precisa deixar de
  sugerir que o material não interessa a mais ninguém."* O parágrafo original da P-13 fica
  **intacto** — inclusive a frase da oposição, que é a redação da pétrea. O que entra é um
  **segundo parágrafo de escopo**: nomeia a premissa ("o que é do professor não é material privado
  dele") e os três pontos — dado → escola, acesso → escola, organização/lançamento → professor.
- **A ordem da frase foi corrigida antes de publicar.** O primeiro rascunho encadeava o acesso ao
  lançamento ("por isso a organização ... e o acesso é por escola"), sugerindo que o acesso
  **derivava** do lançamento. A versão publicada põe o **acesso** como consequência direta da
  custódia (é dela que a senha é) e a **organização** como consequência do recorte — que é a
  causalidade que a §9 descreve.
- **Um ponto de entrada da documentação corrigido.** `professores/README.md` era a **única**
  ocorrência em **prosa de documentação** — fora do log histórico (`REGISTRO.md`) e do comentário
  de script congelado (`tools/gerar-handoff.sh`) — que **repetia a oposição falsa** na instrução de
  criar um professor: *"declare o PO do professor: é dele, não do projeto (P-13)"*. Deixar um
  ponto de entrada repetindo a formulação que a §9 quer extinta perpetuaria exatamente a leitura
  errada. Passou a dizer que o **recorte** é dele — e que o **dado** pertence à escola.

**Onde entrou.**

- **`PROTOCOLO.md`** — **congelado**. Parágrafo novo ao fim da P-13 (`:93-98`), depois do corpo
  original (`:88-91`) e antes da P-14. **+7/−0.** As **22 pétreas** seguem as 22
  (`grep -c '^\*\*P-[0-9]'` → 22), e nenhuma linha da P-13 original foi tocada.
- **`professores/README.md`** — **não congelado**. `:43`, na receita de criação de professor.
  **+2/−1.**
- **`REGISTRO.md`** — esta entrada.

**Não entrou, e é deliberado:** nenhum outro arquivo. O parágrafo novo não cita comando, formato
de arquivo, schema nem fórmula — é texto de escopo, e a §9 declara que *"nenhuma outra pétrea,
nenhuma regra e nenhum comando mudam"*.

**Motivo declarado — os congelados.**

- **`PROTOCOLO.md`** — está na lista de congelados do `CONGELAMENTO.md:18` e é **nominalmente**
  autorizado pela §8 do `ARQUITETURA-AULA.md` (*"`PROTOCOLO.md` | **P-13 precisa de ajuste**"*),
  dentro do descongelamento autorizado pela pesquisadora em 23/09/2026 (*"vai ter que descongelar —
  a gente vai ajustar o que tiver que ajustar"*). O motivo é o da §9, transcrito acima: a pétrea
  **induzia à leitura de que o material é privado do professor**. A mudança é **cirúrgica e só de
  escopo** — a P-13 continua dizendo o mesmo sobre o PO; o que ela ganha é a escola.
- **Nada mais congelado foi tocado.** Nenhuma pétrea além da P-13, nenhuma regra do `REGRAS.md`,
  nenhum comando, nenhum validador, nenhuma fórmula de hash, nenhuma cobertura.
- **Exige, além do motivo, o seu commit próprio** — ainda pendente (abaixo).

**Com o quê.**
Conferido por medição:

- **A âncora não é afetada — e isso foi provado, não presumido.** `PROTOCOLO.md` **não** aparece em
  `tools/lib-fontes.sh` — a palavra não ocorre no arquivo (`grep -c 'PROTOCOLO'` → **0**).
  `fontes_do_ciclo()` (`:137-169`) emite apenas o `CONF_BASE`, o
  `CONF_VARIANTE`, o `ARQUIVO_PO`, o `fonte_dados()`, o `fonte_md($DOCS)` e os
  `relatorios/ciclo-NN/aula-*-<variante>.md`. A pétrea está **fora da cobertura da âncora**, logo
  **não há reancoragem**.
- **Os três `--check`, rodados depois da edição**: `tiago/duo`, `tiago/ritmos` e
  `fochini/diaghilev` — os três **`íntegro; cadeia intacta`**. Nenhum `.fipp` foi tocado por esta
  peça, e nenhuma âncora nova é versionada.
- **Nenhuma pétrea perdida**: `grep -c '^\*\*P-[0-9]' PROTOCOLO.md` → **22**, o número que o
  `CONGELAMENTO.md` declara.
- **O que resta da oposição falsa são exatamente cinco ocorrências**, e todas são legítimas ou
  decididas — discriminadas em "O que ainda não está feito".
- **Nenhuma saída gerada foi tocada**, e nenhum pacote precisou ser regenerado: a edição não
  alcança fonte de ciclo. (Os três pacotes têm de estar íntegros pelo `--check` acima, que é o
  contrato da âncora.)

**Referências.**

- `ARQUITETURA-AULA.md` §9 (`:367-397`) — o texto integral do ajuste: o que a pétrea acerta, o que
  ela erra, os três pontos e o motivo declarado.
- `ARQUITETURA-AULA.md` §10 item 9 (`:415-416`) — *"P-13 (§9) e a eliciação (§6.2) — os textos"*,
  a peça que este ajuste fecha pela metade (abaixo).
- `ARQUITETURA-AULA.md` §8 (`:360`) — a linha da tabela que autoriza nominalmente o `PROTOCOLO.md`
  (*"**P-13 precisa de ajuste** (§9)"*).
- `CONGELAMENTO.md:18` — `PROTOCOLO.md` na lista dos congelados; `:34`, a exigência do motivo
  declarado.
- `P-03` / `P-04` — a proveniência **acrescenta, não edita**: é o que sustenta manter as entradas
  históricas do `REGISTRO.md` como estão.
- `P-21` — a linguagem harmonizada: o parágrafo novo segue o estilo da pétrea (título em negrito e
  prosa corrida, sem listas).

**O que ainda não está feito.**

- **A eliciação segue pendente.** A §10 item 9 é um **par** — a P-13 **e** a eliciação (§6.2). Só a
  P-13 foi fechada aqui. O `prompts/eliciar-ciclo.md` estava fora de escopo por decisão do plano (e
  tem modificação pré-existente de outra sessão no worktree, preservada).
- **As cinco ocorrências residuais da oposição, deixadas de propósito:**

  | Onde | Por que fica |
  |---|---|
  | `PROTOCOLO.md:88` | É a **pétrea**. A §9 manda **não** reescrevê-la; o parágrafo novo é que passa a delimitar a leitura. |
  | `ARQUITETURA-AULA.md:372` | **Cita** "o texto de hoje" — é a transcrição que o próprio ajuste compara. |
  | `ARQUITETURA-AULA.md:381` | É o **diagnóstico** — chama a oposição de falsa na mesma frase. |
  | `REGISTRO.md:45` | Entrada **histórica** de 18/09/2026. P-03/P-04: a proveniência acrescenta, não edita. |
  | `tools/gerar-handoff.sh:16-17` | Comentário de **arquivo congelado**, que justifica por que o `HANDOFF` separa professores. Exigiria motivo próprio e commit próprio em `tools/`, e **não é onde alguém aprende a regra**. Fica registrado; corrigi-lo, se for o caso, é **peça própria**. |

- **`professores/README.md:12`, `departamentos/README.md:24`,
  `biblioteca/guia-do-professor.md:74` e `ciclo-01-ritmos-po.md:15`** citam a P-13 e **não** contêm
  a oposição falsa — dizem apenas que o PO é/continua sendo do professor, o que **segue correto**.
  **Não foram tocadas.** A última é **fonte sob a âncora** e transcreve a resposta do professor sem
  alteração; tocá-la exigiria reancorar o Ritmos.
- **A §10 do `ARQUITETURA-AULA.md` está desatualizada como quadro de progresso.** Ela ainda diz que
  a peça 1 foi *"a única peça desta lista já executada; as nove seguintes seguem intocadas"* — o que
  já não era verdade depois de `B2` (§10 item 2) e não é depois desta (§10 item 9). **Não foi
  corrigida aqui de propósito**: a §10 é um **quadro único** que cada peça da fila vai precisar
  atualizar, e N agentes escrevendo no mesmo parágrafo é colisão garantida. A harmonização da §10
  fica para **uma passada única**, quando a fila drenar.

> **Correção de 26/09/2026 (nota de `B7`).** Esta afirmação ficou ela mesma desatualizada,
> por duas vias. **Primeira**: o `b7` corrigiu a contabilidade das peças já entregues — o item 1
> perdeu a oração *"as nove seguintes seguem intocadas"*, que a entrega do **item 2** pelo `B2`
> já havia tornado **falsa**, e o item 2 passou a **Feito em 26/09/2026**. Deixar a oração de pé
> não era adiar: era publicar um erro. **Segunda**: aquela oração pressupunha **nove** peças
> seguintes; são **oito** (itens 3 a 10). A redação acima **não é apagada** (P-03/P-04).
> Isto **não contradiz** o "passada única": o que o `b7` tocou foi a **contabilidade factual** do
> quadro — que **não podia esperar** sem virar afirmação falsa —, e o "**mesmo parágrafo**" que a
> passada única reserva é o **texto de fundo do quadro de progresso**, território de outro
> tamanho. Restam **oito peças por fazer** (3 a 10); o **item 7 (o prazo)** segue **aberto** — o
> `b7` corrigiu a **fórmula** do §3, não entregou a peça que a aplica no índice e no fechamento.
> E o **item 9 está parcialmente entregue**: o `b12` escreveu o parágrafo da **P-13** sobre o
> sufixo da escola, mas a **elicitação do §6.2** segue aberta — por isso o item **não** foi
> marcado, e a contagem acima o mantém entre os pendentes.

- **Nada foi commitado.** O commit desta peça é **próprio** — ela é congelado — e ainda não foi
  feito, como os da Frente A, de `B1` e de `B2`, que seguem pendentes e **separados**.
- **O `HANDOFF.md` não foi regenerado**, e desta vez **não ficou desatualizado por esta edição**: ele
  lista apenas os **títulos** das pétreas, não os corpos — o `gerar-handoff.sh:167` extrai as linhas
  `^\*\*P-[0-9]\{2\} —` e emite só o título. A regeneração dele acompanha o commit das entradas do
  `REGISTRO.md`, não esta peça.

> **Fecho de 27/09/2026.** O *"commit próprio — ainda pendente"* do bullet acima **deixou de ser
> pendência neste dia**: `PROTOCOLO.md` e `professores/README.md` entraram no commit
> `docs(protocolo): … a P-13 deixa de sugerir que o dado é privado do professor`, **com o motivo
> declarado no corpo** — o rito do `CONGELAMENTO.md` cumprido. As duas frases acima **não são
> apagadas** (P-03/P-04): eram verdadeiras até 27/09/2026; esta nota é o elo novo.
> O `HANDOFF.md` **foi regenerado no mesmo dia**, no commit das entradas do `REGISTRO.md` — como o
> bullet acima previa, a regeneração acompanha aquelas entradas, não esta peça.

## 26/09/2026 — O prazo do §3 dizia "menor entre" — e dois números do Ritmos estavam errados

**O que motivou.**
`ARQUITETURA-AULA.md` §3.1 (`:94`) definia o prazo como:

```
prazo             = menor entre
                      (a) 24h antes da próxima data de aula
                      (b) fim do bloco + 18h          ← piso: tempo hábil
```

O operador **`menor` é erro de digitação**: contradizia cinco afirmações, quatro delas do
próprio documento. A mais próxima estava **uma linha abaixo** — `:96` rotula a cláusula `(b)`
como **"piso"**, e piso é **limite inferior**: um piso só é piso sob `max`. As outras:

| Onde | Diz | Sob `menor` | Sob `maior` |
|:--|:--|:--|:--|
| `:88-101` | o piso existe para dar tempo hábil no caso denso | o piso viraria o prazo **sempre** | verdadeira |
| `:114` | Duo **143 h** — vale "24h antes" | seria **18 h** | verdadeira |
| `:131` | "a última aula tem o **MAIOR** prazo já praticado" | não existiria "maior": todo prazo seria 18 h | verdadeira |
| **§4.2** | `prazo: "2026-10-07T19:00"` (timestamp resolvido) | 18 h → **07/10 14:00** ❌ | 23 h → **07/10 19:00** ✅ |

A contradição estava a **uma linha de distância** (`:94` vs `:96`) e passou despercebida por
duas medições anteriores — nas duas eu li `menor` ao pé da letra e medi contra o **mundo**, em
vez de medir a **coerência interna** do documento contra si mesmo. Uma dessas medições concluiu
que "o piso vence em 100% das datas"; **estava errada**.

Medido com o cronograma real (`tools/calendario.py --aulas-arquivo`), cláusula `(a)` contada do
**fim do bloco**:

| ciclo | de → para | gap (h) | (a) = gap−24 | (b) piso | `min` | **`max`** | doc |
|:--|:--|--:|--:|--:|--:|--:|:--|
| Duo | sexta → sexta (18:30) | 167,0 | **143,0** | 18,0 | 18 | **143** | **143** ✅ |
| Diaghilev | ter → qui (19:00) | 47,0 | **23,0** | 18,0 | 18 | **23** | **23** ✅ |
| Diaghilev | qui → ter (19:00) | 119,0 | **95,0** | 18,0 | 18 | **95** | **95** ✅ |
| Ritmos | sáb 10:00 → ter 19:00 | 81,0 | **57,0** | 18,0 | 18 | **57** | 47 ❌ |
| Ritmos | ter 19:00 → sáb 08:00 | 84,0 | **60,0** | 18,0 | 18 | **60** | 71 ❌ |

**`max` reproduz 143 / 23 / 95 literalmente** e os literais de `prazo` do §4.2 **ao minuto**
(`06/10 20:00 + 23 h = 07/10 19:00`; `08/10 20:00 + 95 h = 12/10 19:00`). `min` devolveria
**18 h em 100% dos intervalos** — não é um modelo de prazo, é o piso. Sob `maior`, as cinco
afirmações ficam verdadeiras **de uma vez**.

O segundo defeito é numérico e independente: a **tabela do §3.2** publicava **47 h** e
**71 h** para o Ritmos, e a coluna se chamava **"Janela que resulta"** — logo media o **gap**,
não o prazo. Os cinco valores do documento eram cláusula `(a)`; dois estavam errados.

**A proveniência de 47 e 71 — medida.** O Ritmos é o **único ciclo com mais de um relógio**
(`DIAS="2@19:00,6@08:00,6@09:00"`: ter 19:00, sáb 08:00, sáb 09:00). Uma medição que leia a
*data* da próxima aula mas **pisque o horário** para o relógio do bloco atual calcula o gap do
sábado como `09:00 → ter 08:00` = **71,0 h**, em vez do correto `10:00 (fim do bloco) → ter
19:00` = **81,0 h**:

- **71 h** = esse gap de 71,0 h **sem** subtrair as 24 h;
- **47 h** = **esse mesmo gap de 71,0 h menos 24 h**.

Os dois são **o mesmo erro** (relógio congelado), e nenhum dos dois é prazo. A correção de uma
conclusão anterior minha: *"47 h não é reproduzível"* **está errado** — é reproduzível, por dois
erros compostos.

**O padrão de defeito é o mesmo do `DOCS` (Defeito 2).** Nos dois casos a regra foi redigida a
partir de um exemplo que **não exercita o ramo decisivo**: Duo e Diaghilev têm **um único
relógio** no `DIAS` (18:30, 19:00), então o erro de relógio é **invisível** neles — só aparece no
Ritmos. Um exemplo tirado do Duo nunca o revelaria.

**O que foi decidido.**
- **`:94` — `menor entre` → `maior entre`.** Uma palavra. **Decisão fechada** pela aritmética:
  `max` reproduz o documento inteiro; `min` o destrói.
- **`:96` — a cláusula `(b)` fica.** Sob `maior` ela é o que o rótulo diz: o piso.
- **`:99-106` — o piso ganha uma nota medida.** O piso **não dispara** em nenhum intervalo de
  nenhum dos três ciclos vivos: a menor janela real é **23,0 h** (Diaghilev, ter → qui), acima
  das 18 h. Uma rede de segurança que não dispara é normal — o caso que ela cobre (aula às 20h,
  próxima às 8h = 12 h) não ocorre hoje. **Não é código morto**, e o documento agora o diz, para
  que ninguém (como eu, numa passada) conclua que a cláusula pode ser removida.
- **`:112` — `Janela que resulta` → `Prazo que resulta`.** A coluna contém cláusula `(a)`, que é
  o **prazo**; o rótulo antigo é o que fez os dois números errados passarem desapercebidos.
- **`:117` e `:118` — Ritmos `47 → 57 h` e `71 → 60 h`**, cada valor **na sua própria linha**.
  As duas **não** recebem o mesmo valor: `:117` usa o gap **ímpar** (sábado, bloco → terça) e
  `:118` o **par** (terça → sábado).
- **`:134-135` — a regra do §3.3 ("MAIOR prazo já praticado")**: Ritmos `71 → 60 h`. O §3.3
  mede do **início** da aula; o §3.2 mede do **fim do bloco**. Os dois referenciais dão o mesmo
  `60 h` para o Ritmos e **coincidem** em `143`/`95` — com um relógio único, os dois referenciais
  colapsam.
- **§10 itens 1 e 2 — marcados.** Achado **auto-infligido** durante esta peça: o item 1 dizia
  *"é a única peça desta lista já executada; as nove seguintes seguem intocadas"*, e a **peça 2**
  (o `DOCS` derivado) já havia sido entregue em 26/09/2026 — eu mesmo havia escrito essa nota no
  §4.1 na entrada anterior. O item 1 perde a oração falsa; o item 2 ganha *"Feito em
  26/09/2026 — ver a nota do §4.1"*. **Não é uma das dez peças do §10 — é a contabilidade delas.**

**Onde entrou.** Uma linha por arquivo:

- `ARQUITETURA-AULA.md` — as **7 edições** acima (o bloco `:91-97`, a nota do piso `:99-106`, o
  rótulo `:112`, as duas linhas do Ritmos `:117-118`, a medição do §3.3 `:134-135`, e os itens 1
  e 2 da §10 `:406-409`).
- `REGISTRO.md` — esta entrada, e uma **nota de correção** dentro da entrada de `B1` (25/09/2026),
  que cita o §3.1 na redação antiga. A redação **não é apagada** (P-03/P-04).

**Motivo declarado — os congelados.** **Não se aplica.** `ARQUITETURA-AULA.md` **não está
congelado** — medido: `grep -n 'ARQUITETURA' CONGELAMENTO.md` → **não citado** (o `CONGELAMENTO.md`
congela `PROTOCOLO.md`, `REGRAS.md`, `tools/`, `tools/templates/`, `prompts/`,
`biblioteca/guia-do-professor.md` e `METODO.md`). O arquivo também **está fora da cobertura da
âncora**: o filtro do `hash-ciclo.sh:130-165` cobre `${BASE%/ciclos}/*` (as fontes de ciclo), e o
`ARQUITETURA-AULA.md` está na **raiz** do repositório. É citado em três `.conf` — **em comentário,
não como fonte**. Confirmado por medição: os três `--check` seguem **verdes** após as edições
(`ok: ciclo 01-<escola> íntegro; cadeia intacta`). Logo: **sem rito, sem reancoragem, sem
regeneração de pacote**.

**Com o quê.** Lista exaustiva dos arquivos tocados:

- `ARQUITETURA-AULA.md` — **+11 / −7** (7 edições). ⚠️ O `git diff` bruto do arquivo acusa
  **+29 / −7**: os **+18** restantes **não são desta peça** — são a nota do `DOCS` no §4.1
  (`:192-204`) e a do Pré-requisito 5 no §6.1 (`:286-298`), ambas do **`B2`**, já no worktree
  antes desta peça começar. Separadas por hunk, a conta fecha: `B2` **+18 / −0** (só acréscimo,
  dois hunks), `b7` **+11 / −7** (sete hunks: cinco substituições de uma linha, uma de duas
  linhas — as duas linhas do Ritmos — e a nota do piso, de quatro linhas).
- `REGISTRO.md` — esta entrada + a nota de correção na entrada de `B1`.

**Nenhum outro arquivo foi tocado.** Não foram tocados: os três `.conf`, o `calendario.py`, o
`ciclo-01-schema.json`, os três `.fipp`, os três pacotes, o `lancamento.html`, o
`tools/templates/lancamento.html`, o `hash-ciclo.sh`, o `lib-fontes.sh` e o `pre-commit`.

**Referências.**
- `ARQUITETURA-AULA.md` §3 (`:84-159`), §4.2 (`:207`), §10 (`:404-419`).
- `CONGELAMENTO.md` `:16-32` — a lista dos congelados e a dos livres.
- `tools/calendario.py` `--aulas-arquivo` (`:196-214`) — o cronograma real, fonte de todos os
  números desta entrada.
- `PROTOCOLO.md` **P-03/P-04** — a proveniência acrescenta, não edita (a redação de `B1` foi
  preservada com nota, não corrigida).
- **Medição de apoio:** `files/B7-medicao-prazo.md` (sessão) — as cinco contradições, a tabela
  `(a)/(b)/min/max`, a proveniência provada de 47/71 e os 6 itens de correção.

**O que ainda não está feito.**
- **O `HORAS_DO_PRAZO = 48` do formulário continua como estava** (`tools/templates/lancamento.html:745`).
  Esta entrada corrigiu a **coerência textual** do documento; **substituir o 48 fixo pela fórmula
  do §3 é a peça 7** da ordem do §10, que **toca `tools/templates/`** (congelado) e por isso
  **exige rito próprio** — motivo declarado, entrada no `REGISTRO.md` e commit próprio. **Nada
  disso foi feito aqui.**
- **O §10 tem oito peças por fazer** (3 a 10). A contabilidade da §10 está correta agora, mas o
  trabalho que ela conta **não começou**.
- **O §10 `:403-404` continua factualmente falso.** A frase sobre o TSV *"não existe hoje"* ficou
  desatualizada quando o `B1` entregou o `--aulas-arquivo`. **Não foi corrigida nesta passada**
  (é a passada única de fechamento da §10) — e fica registrado para que a próxima sessão não a
  tome por verdadeira.
- **A última linha da §3.3 mede "o maior prazo já praticado" com um exemplo do Duo**, e essa é
  exatamente a classe de exemplo que esconde o defeito de relógio (um só relógio no `DIAS`).
  **Não foi trocada** — a regra está certa; o exemplo é que não exercita o ramo.
- **O `FECHAMENTO` (§3.4) segue não implementado** — é campo opcional do `.conf`, e nenhum dos
  três o declara. Não entrou nesta rodada.

## 26/09/2026 — O config da captura deixa de ser um por ciclo: um `captura-aula-NN.json` por folha em disco

**O que motivou.**
O `ARQUITETURA-AULA.md` §4.1 registra dois defeitos medidos no formulário; o **Defeito 2** foi
fechado pelo `B2` (entrada anterior). Esta entrada fecha o **Defeito 1**.

O gerador extraía **só** a folha da aula 01 e publicava o resultado num arquivo único — nomeado
pelo **ciclo**:

```bash
node "$RAIZ/tools/validar-captura-ciclo.js" "$CICLOS/ciclo-$CICLO-captura-schema.json" \
  "$(fonte_md captura-aula-01)" --variante "$VARIANTE" --json > "$PACOTE/captura-$CICLO.json"
```

A página monta esse painel em **qualquer** aula (`lancamento.html` lê
`peca(c.id, 'captura')` → `captura-<id do ciclo>.json`). Medido com o ciclo simulado da
Diaghilev, que tem **quatro folhas com colunas diferentes**: os quatro formulários saíam
**idênticos**, todos com as colunas da Aula 01. A prova de que sairiam quatro diferentes já
existia em `experimentos/provar-por-aula.js` desde 23/09/2026 — faltava publicar os arquivos.

O `B2` acabou de tornar isso visível: as folhas 02–04 passaram a ser **fontes** da âncora. Com as
quatro folhas cobertas e um config só, o pacote publicava quatro formulários iguais a partir de
quatro folhas ancoradas e distintas — o sistema já tinha o dado e o descartava.

**O que foi decidido.**

- **Um config por aula: `captura-aula-NN.json`, para toda folha que existe no disco.** O laço
  percorre a família derivada e resolve a folha de cada NN:

  ```bash
  for cap_nn in $(familias_por_aula captura-aula); do
    cap_src="$(fonte_md "captura-aula-$cap_nn")"
    [ -f "$cap_src" ] || continue
    node "$RAIZ/tools/validar-captura-ciclo.js" "$CAP_SCHEMA" "$cap_src" \
      --variante "$VARIANTE" --json > "$PACOTE/captura-aula-$cap_nn.json" ...
  done
  ```

- **A lista de aulas vem da derivação que o repositório já tem, não de uma nova.** Os NN saem de
  `familias_por_aula captura-aula` — a **mesma** função que o `DOCS` derivado usa em
  `lib-fontes.sh`. Derivar `NN` de `01` até `$TOTAL_AULAS` foi descartado: seria uma segunda
  regra para a mesma pergunta, e divergiria da âncora (o `TOTAL_AULAS` do Duo e do Ritmos nem
  coincide com o número de folhas escritas) — exatamente o risco que motivou o `B2` a centralizar
  a expansão na lib. A folha de cada NN resolve por `fonte_md`, então a **sufixo da escola**
  continua vencendo a compartilhada, sem código novo.

- **O `[ -f "$cap_src" ]` é obrigatório, e é a única trava contra o falso positivo.** `fonte_md`
  **sempre imprime um caminho** — inclusive quando o arquivo não existe —, e o glob de
  `familias_por_aula` varre `professores/<p>/ciclos/` inteiro, então um NN de folha de **outra
  escola** entra na lista. Sem o teste, o gerador tentaria extrair um arquivo inexistente (o
  extrator sai com `ENOENT`) e derrubaria o pacote por causa de uma folha que não é dele.

- **Um processo por folha.** `tools/validar-captura-ciclo.js` não tem modo batch: a interface é
  `<schema.json> <folha.md> [--variante] [--json]`. Daí o laço — não há como validar as N folhas
  numa chamada só, e inventar um batch no extrator seria mexer no validador sem necessidade.

- **O config do ciclo continua saindo, e sai por `cp` do arquivo já validado.** O formulário
  **publicado** lê `captura-<id do ciclo>.json` (`lancamento.html`), e o `B3b` — que fará a página
  ler o config **da aula do filtro** — ainda não existe. Remover o arquivo agora quebra o
  formulário em produção. Ele **é** o config da aula 01, então:

  ```bash
  if [ -f "$PACOTE/captura-aula-01.json" ]; then
    cp "$PACOTE/captura-aula-01.json" "$PACOTE/captura-$CICLO.json"
  else
    echo "erro: a folha de captura da aula 01 ($(fonte_md captura-aula-01)) não está no disco — sem ela não há captura-$CICLO.json." >&2
    exit 1
  fi
  ```

  A cópia sai do **disco**, não de uma segunda extração: assim os dois arquivos são **byte a
  byte iguais por construção** (conferido com `cmp`), não por coincidência de duas execuções.

- **A semântica de falha é a mesma de antes.** Qualquer folha que não feche com o schema derruba o
  gerador (`exit 1`), como já derrubava, e a mensagem passou a **nomear o NN e o arquivo de
  saída** (`a folha de captura da aula 02 não fechou … (captura-aula-02.json)`) — antes dizia só
  `captura-$CICLO.json`, que não localiza a folha culpada. O caminho da folha ausente não mudou de
  desfecho: a invocação antiga também saía com código 1 (`erro: não consegui ler … ENOENT`).

**Onde entrou.**

- **`tools/gerar-ciclo.sh`** — **congelado** (`CONGELAMENTO.md`: `tools/` em bloco). O bloco
  antigo de 3 linhas (`255-258`) deu lugar a 25: o laço por aula (linhas `262-269`), o comentário
  do Defeito 1 (`256-261`), a publicação do config do ciclo por `cp` (linhas `271-274`) e o novo
  erro da aula 01 (`276-280`). **Medido: +25 / −3** — o hunk é o único desta peça
  (`@@ -256,3 +256,25 @@`). O `git diff --numstat` do **arquivo** mostra `+58 / −7`, mas esse
  número **não é desta peça**: o arquivo carrega trabalho de outras frentes ainda não commitado
  (o `nav.js` da identidade visual, as cores do PDF em `lib-tokens.js`). Nada disso foi tocado
  aqui.
- **Nenhum outro arquivo-fonte — por esta peça.** O `tools/validar-captura-ciclo.js`, o
  schema, os `.conf` e as folhas de captura **não** foram tocados aqui: o validador é o mesmo
  processo de antes, só chamado N vezes. (O `git diff` do worktree **mostra** alterações nesses
  arquivos — são do `B2`, do `B1` e de outras frentes ainda não commitadas, não desta.)
- **Saídas derivadas regeradas** nos três pacotes (não são fontes, não entram na âncora):
  `professores/tiago/ciclos/ciclo-01-duo/`, `professores/tiago/ciclos/ciclo-01-ritmos/` e
  `professores/fochini/ciclos/ciclo-01-diaghilev/` — cada um ganhou `captura-aula-01.json`, e o
  da Diaghilev `captura-aula-02..04.json`. Os `captura-01.json` antigos seguem nos três, e
  seguem **idênticos ao que já estava commitado** (`git diff` vazio para eles).

**Não entrou, e é deliberado:** `tools/templates/lancamento.html` — a página **continua** lendo o
config do ciclo. Fazê-la ler o da aula é o `B3b`, e o desenho dele depende do **índice por aula**
(§4.2, peça 4), que ainda não existe. Publicar os configs sem tocar na página é o que mantém o
formulário publicado funcionando.

**Motivo declarado — os congelados.**

- **`tools/gerar-ciclo.sh`** — congelado em bloco. É o **único** lugar onde o Defeito 1 podia ser
  corrigido: é o gerador que extrai a folha, nomeia o arquivo e publica no pacote. O arquivo está
  na lista que o `ARQUITETURA-AULA.md` §8 declara como necessária ao desenho (a pesquisadora
  autorizou o descongelamento em 23/09/2026), e a peça é a **número 3** da ordem do §10.
- **A mudança altera comportamento, e por isso ela está declarada em detalhe aqui:** o pacote
  passa a levar **mais arquivos** do que levava. Não é redação. O que a justifica é que o defeito
  é de comportamento — e o rito do congelamento existe justamente para que a mudança de
  comportamento fique registrada, não para impedi-la.
- **O que NÃO muda:** a fórmula e o algoritmo de hash; a cobertura da âncora (as folhas já eram
  fontes desde o `B2`, e continuam as mesmas); o schema da captura; o extrator
  `validar-captura-ciclo.js` (não foi tocado); os validadores `check-pacote.js` e
  `validar-captura-ciclo.js`; o `DOCS` derivado da lib; as pétreas e as regras; e o
  `captura-<id do ciclo>.json`, que **continua existindo** — o formulário publicado não vê
  diferença alguma.

**Com o quê.**
Conferido por medição, ponta a ponta, com os três pacotes regerados
(`tiago 01 duo`, `tiago 01 ritmos`, `fochini 01 diaghilev`):

- **Um config por folha em disco.** Medido, os pacotes saem com
  `duo` **1** `captura-aula-0*.json`, `ritmos` **1** e `diaghilev` **4** — exatamente as folhas
  que existem em disco (`ciclo-01-captura-aula-01.md` serve o Duo,
  `ciclo-01-ritmos-captura-aula-01.md` o Ritmos, e as quatro `ciclo-01-diaghilev-captura-aula-0N.md`).
- **Os quatro configs da Diaghilev são distintos, e distintos no que importa.** Tamanhos
  `3068` / `3373` / `3526` / `3462` bytes, md5 `e9de04650810…` / `a9148a26453f…` / `675bc700fb46…` /
  `98a364d5c657…`. As colunas, lidas dos próprios JSONs (6 blocos cada):

  | Aula | Colunas observacionais |
  |:--|:--|
  | 01 | Eixo vertical · Distribuição do peso · Olhar sustentado |
  | 02 | Eixo em movimento · Chegada do peso antes do passo · Travessia completa (4 passos) · Passo cai no tempo · Acento no 1º de cada grupo |
  | 03 | Pelve no apoio estreito · Retenção (3 tempos) · Descida controlada · Quarto de giro · Giro completo · Retorno ao eixo (2 tempos) · Ponto focal reencontrado |
  | 04 | Eixo mantido · Peso sem interrupção · Frase fecha no tempo · Direção sustentada · O que avançou · O que ficou a desenvolver |

  É o defeito medido, agora ao contrário: **quatro diferentes**, como o
  `experimentos/provar-por-aula.js` previa.
- **O config do ciclo continua saindo e é o da aula 01.** `cmp` entre `captura-01.json` e
  `captura-aula-01.json` dá **idêntico** nos **três** pacotes. E `git diff` para os
  `captura-01.json` sai **vazio** — o arquivo publicado não mudou um byte.
- **`check-pacote.js` na Diaghilev: `OK: 0 erro(s), 0 aviso(s)`** — **17 páginas** e **751 links
  internos**, idêntico ao estado de partida. O validador **não conhece** os configs de captura,
  então os arquivos novos são inertes para ele; o número está aqui para provar que nada regrediu.
- **Os três `--check` seguem íntegros, com o hash intacto:** `duo`
  `52f437f26c02459143a0b4e939fc2156046d480cab3b850228c4d5f31ea331fb`, `ritmos`
  `899ccd321922c6b1d401c0c6c2dffd4f733c48fb4f877935c69073d11c9d98ed` e `diaghilev`
  `78daf7e4cb233c4f8f44937232db0a8ecdd6df27658b39c50258f92d82e6839e` — `íntegro; cadeia
  intacta` nos três. **Era o esperado, e é a prova de que os configs são derivados:** eles não
  entram na âncora, e se entrassem o hash teria mudado.
- **A semântica de falha, provada por harness isolado.** O bloco foi extraído **verbatim** do
  arquivo (conferido por `diff` contra as linhas reais) e exercitado sobre um ciclo falso, com
  quatro cenários:

  1. **Folha ausente** (a da aula 01 removida): `familias_por_aula` imprime `02 03 04` — ela
     **não** sintetiza o 01 — e o bloco sai com código **1** pelo caminho explícito do erro da
     aula 01. É o mesmo desfecho da invocação antiga, que também saía com código 1 e um `ENOENT`.
  2. **NN de outra escola** (`ciclo-01-outra-captura-aula-09.md` ao lado): o glob imprime `09`,
     `fonte_md` devolve o caminho compartilhado **inexistente**, o `[ -f ]` **descarta** e
     `captura-aula-09.json` **não** é publicado. Sem a trava, o pacote morria por causa de folha
     alheia.
  3. **Folha que não fecha com o schema** (a da aula 02 trocada por um arquivo sem bloco nenhum):
     código **1**, com a mensagem nomeando a aula e o arquivo de saída, e o pacote contendo só o
     que veio antes — **sem** o config do ciclo e **sem** as aulas seguintes. A falha continua
     derrubando o gerador, como antes.
  4. **Nenhuma folha:** código **1** com o erro da aula 01 e pacote vazio.

**Referências.**

- `ARQUITETURA-AULA.md` §4.1 (o Defeito 1), §4.2 (o índice por aula, que declara
  `"config": "captura-aula-NN.json"`), §8 (a lista dos congelados), §10 (esta é a peça **3**).
- `CONGELAMENTO.md` — `tools/` é congelado em bloco.
- `tools/lib-fontes.sh` — `familias_por_aula()` e `fonte_md()`; a derivação reaproveitada, não
  reescrita. A entrada do `B2` (26/09/2026) explica por que a expansão de família mora na lib.
- `tools/templates/lancamento.html` — o que fixa o `captura-<id do ciclo>.json` como contrato
  vigente enquanto o `B3b` não chega.
- `experimentos/provar-por-aula.js` — a prova de conceito de 23/09/2026, que esta peça
  transformou em arquivo publicado.

**O que ainda não está feito.**

- **O formulário ainda não lê o config da aula.** Esta peça **publica** os arquivos; quem os
  consome é o `B3b`, e ele **não** foi feito. Até lá, a página do formulário continua montando o
  painel da aula 01 em todas as aulas — os quatro formulários da Diaghilev seguem **idênticos no
  navegador**. O que mudou é que os dados para torná-los diferentes já estão no pacote.
- **O índice por aula (§4.2) não existe.** É a peça **4**, de que o `B3b` depende: sem
  `aulas[].config`, a página não tem como saber **qual** dos quatro arquivos pedir.
- **O `tools/check-pacote.js` não exige o config de cada aula** — ele não conhece config de
  captura. Enquanto isso, um pacote publicado com a folha da aula 03 fora do disco **passa** no
  `check-pacote.js` (o gerador é que derruba, na geração). Rever o validador é a peça `B11`.
- **Nada foi commitado.** O commit desta peça é próprio (o `tools/` congelado exige commit
  separado) e ainda não foi feito — como o do `B1`, o do `B2` e o da Frente A, que seguem
  pendentes. **Este arquivo é a entrada do `REGISTRO.md`, ainda fora dele.**
- **O `HANDOFF.md` não foi regenerado** e a §4.1 do `ARQUITETURA-AULA.md` continua marcando o
  Defeito 1 como aberto: a nota de fechamento e a regeneração acompanham o commit.

## 26/09/2026 — O `check-identidade.js` entra no `pre-commit`: a identidade deixa de depender de alguém lembrar

**O que motivou.**
A entrada de 25/09/2026 ("A identidade visual passa a existir como contrato…") deixou o
validador pronto e **desligado**. `tools/check-identidade.js` existia, passava nas **quatro**
checagens e não era chamado por ninguém: a última linha do seu "O que ainda não está feito"
dizia, literalmente, *"Enquanto não for, a checagem depende de alguém lembrar de rodá-la"*.

A lacuna é maior do que uma conveniência. A identidade visual é o **único** contrato do
repositório que **não** tem trava automática:

- as **fontes de ciclo** estão cobertas pela âncora `.fipp` — mexeu, o `--check` acusa e o
  `pre-commit` recusa (seção 2 do hook);
- os **ciclos tocados** são regerados e validados pelo `tools/check-pacote.js` (seção 3);
- o **deck** está coberto pelos validadores do Marp (seção 4);
- a **paleta não está coberta por nada disso** — e a razão é estrutural, não um esquecimento:
  `tools/hash-ciclo.sh` hasheia as fontes de ciclo **daquele professor**, e a fonte de verdade
  da paleta, `tools/templates/ciclo.css`, **mora em `tools/`**. Ela nunca entra na âncora. Mexer
  num hex da paleta **não reancora nada** e, sem este hook, **não acusa nada**.

O modo de falha é o pior possível: silencioso e assimétrico. Quem editasse `tools/templates/ciclo.css`
sem regenerar os três pacotes passaria por todos os validadores existentes — a página servida
continuaria com o hex antigo e o site divergiria do formulário exatamente como divergia antes da
frente de identidade. O `check-identidade.js` fecha isso pela checagem "Circuito", que compara
`assets/style.css` e `assets/nav.js` de cada pacote **byte a byte** com a fonte. Só faltava
chamá-lo na hora certa.

**O que foi decidido.**

- **O validador entra como a seção 5 do `tools/hooks/pre-commit`**, depois das cinco
  existentes e antes do `exit 0`. Não vira um sexto hook: o `pre-commit` já é o dono da
  Regra 17, e um validador fora dele repetiria o defeito que esta entrada corrige.
- **Guard de caminho ESTREITO, decidido pelo que o validador de fato LÊ** — não por precaução
  genérica. Três famílias de caminho, e nada além delas:

  | Família | O que o validador lê ali |
  |:--|:--|
  | `tools/` | a **fonte** (`tools/templates/ciclo.css`, `tools/templates/nav.js`) e os seis consumidores que ele varre atrás de hex redeclarado (`templates/ciclo.html`, `templates/lancamento.html`, `gerar-ciclo.sh`, `gerar-animacao.js`, `sincronizar-slide.js`, `hash-ciclo.sh`) |
  | `professores/<p>/ciclos/ciclo-NN-<escola>/assets/` | a checagem **Circuito** — é a **única** parte de `professores/` que o script lê |
  | `apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md` | o **deck** — único consumidor que **declara** os hex (Marp não referencia token) |

- **O deck entra sozinho, e não todo o `apresentacoes/`.** O validador lê *um* arquivo do deck,
  não a frente de apresentações: `README.md` da pasta, os SVGs e o `rizoma-animado.html` **não**
  o afetam. Usar o guard largo da seção 4 (`^apresentacoes/`) faria o validador rodar por nada
  em qualquer mexida de slide — e ele só lê **um** dos arquivos daquela frente.
- **Um commit que não toca essas três famílias NÃO pode mudar o resultado do validador** — docs,
  `biblioteca/`, `experimentos/`, PO, plano de aula, manifesto `.conf`, âncora `.fipp`, folhas
  `aula-NN.md` e relatórios ficam **de fora** do guard, de propósito. O hook já é pesado (a
  seção 3 chega a **regenerar o pacote de cada ciclo tocado** e compilar PDF, e a seção 2
  chama o `hash-ciclo.sh` para reancorar a fonte); acrescentar-lhe um validador
  que não pode ser afetado seria pagar custo por nenhuma proteção. A tabela de caminhos foi
  medida (abaixo), não estimada.
- **A ordem é deliberada: depois da seção 4.** É o `tools/gerar-ciclo.sh` que **recopia**
  `tools/templates/ciclo.css` e `nav.js` para dentro de `assets/` do pacote tocado. Se a
  checagem de Circuito rodasse **antes**, ela compararia a cópia **velha** — e recusaria o
  commit justamente de quem regenerou o pacote como mandam as regras. Rodar depois faz a
  checagem ver o pacote **já regenerado**.
- **A saída segue o estilo do arquivo**, sem inventar formato: log em
  `/tmp/pre-commit-identidade.log` (mesma convenção `/tmp/pre-commit-<nome>.log` das seções
  2–4); no sucesso, uma linha `pre-commit: identidade visual ok (N verificações passaram)` com
  o N **contado** do log (`grep -c '^ok: '`); na falha, `pre-commit: recusado — …` no **stderr**,
  o `grep` das linhas de erro (`^erro: `, o prefixo que o validador de fato usa no
  `console.error`) e `exit 1`.
- **O comentário do bloco declara o que a âncora não cobre.** Está escrito no hook, não só aqui:
  *"A âncora .fipp NÃO cobre isto: o tools/templates/ciclo.css mora em tools/, que não é fonte
  de ciclo — logo este validador é a ÚNICA trava da identidade."* Quem for mexer na seção no
  futuro lê o porquê antes de afrouxar o guard.

**Onde entrou.**

- `tools/hooks/pre-commit` — **congelado**. Recebe o item **6** na lista "O que faz" do
  cabeçalho e a **seção 5** nova (guard + chamada + sucesso + falha), entre o fim da seção 4 e
  o `exit 0` final. **+38 linhas, −1** (a única remoção é o `;` que virou `.` no fim do item 5
  da lista do cabeçalho). Medido com `git diff --numstat tools/hooks/pre-commit`: `38  1`.
  O arquivo passa de **192** linhas (como está no `HEAD`) para **229**.
- `REGISTRO.md` — esta entrada. **Não congelado.**

**Nada mais foi tocado.** O `tools/check-identidade.js` **não** foi editado: entrou no hook como
está. Nenhum arquivo de `professores/` foi aberto para escrita, nenhuma âncora foi regerada,
nenhum pacote foi regenerado — e não precisava: o hook **chama**, não corrige.

**O que está no worktree e NÃO pertence a esta mudança.** O worktree carrega as frentes
anteriores ainda sem commit (`tools/templates/ciclo.css`, `ciclo.html`, `lancamento.html`,
`gerar-animacao.js`, `sincronizar-slide.js`, `lib-tokens.js`, `IDENTIDADE-VISUAL.md`, o deck…),
mais arquivos de **outros agentes** (`tools/gerar-ciclo.sh`, `tools/lib-fontes.sh`,
`PROTOCOLO.md`, `professores/`). Esta entrada responde só pelo
`tools/hooks/pre-commit` — o commit do rito não deve arrastar o resto.

**Motivo declarado — os congelados.**

- **`tools/hooks/pre-commit` é congelado** (`CONGELAMENTO.md`: `tools/` em bloco). A mudança
  entra com motivo declarado e commit próprio, porque **o congelamento só cede a quem diz por
  quê**.

  O motivo é que **a identidade visual não tem outra trava**. As fontes de ciclo têm a âncora;
  as páginas têm o `check-pacote.js`; o deck tem os validadores Marp. A paleta tem **um arquivo
  em `tools/`** — que a âncora não hasheia por definição — e um validador que ninguém chamava.
  Deixar assim é aceitar que a divergência de cores volte pela porta dos fundos: bastaria mudar
  um token e não regenerar o pacote. O congelamento existe para proteger o que funciona; o que
  ele estava protegendo, aqui, era a identidade **desligada**.

- **O que NÃO muda.** Esta alteração é **aditiva e de controle** — não muda comportamento de
  nada que já passava:
  - a **fórmula de hash** e a **cobertura da âncora** `.fipp` — intocadas;
  - as **17 regras** e as **22 pétreas** — intocadas;
  - as **cinco seções anteriores** do hook (1, 2, 2b, 3 e 4) — nenhuma linha alterada, exceto
    a pontuação do item 5 da lista do cabeçalho;
  - os validadores existentes (`check-pacote.js`, `check-glossario.js`, `check-overflow.js`,
    `check-mapa.js`, `validar-*.js`) — nenhum invocado de forma diferente;
  - os três pacotes, os três `.fipp` e as fontes de ciclo — **nenhum arquivo tocado**;
  - a Regra 17 — **reforçada**, não afrouxada: o guard só **acrescenta** uma recusa possível.

  **Sem reancoragem.** Este arquivo **não é fonte de ciclo**: não é coberto pelo `.fipp`, e o
  `--check` não muda de resultado por causa dele. Não houve reancoragem — e não deve haver.

**Com o quê.**
Medido, comando e resultado:

- **O validador, direto** — `node tools/check-identidade.js` → **exit 0**, na casa das dezenas
  de milissegundos (`/usr/bin/time -f "%e"`: `0.03`–`0.05` s em oito medições — `0.03 0.05 0.03
  0.03 0.03` e `0.04 0.03 0.03`), e as quatro linhas no stdout:
  ```
  ok: Contraste: 21 pares medidos, todos em AA ou acima
  ok: Cópia única: nenhum dos 21 hex da paleta fora de tools/templates/ciclo.css
  ok: Deck: os 7 tokens declarados batem com tools/templates/ciclo.css
  ok: Circuito: assets/style.css e assets/nav.js de cada pacote batem com a fonte
  ```
  Custo de dezenas de milissegundos: o guard **não** é sobre tempo de execução, é sobre
  **não rodar por nada**.
- **Sintaxe do hook** — `bash -n tools/hooks/pre-commit` → sem saída, **exit 0**.
- **O guard, medido numa tabela de 19 caminhos** (o regex extraído do hook, aplicado linha a
  linha). **RODA** para `tools/templates/ciclo.css`, `tools/templates/nav.js`,
  `tools/lib-tokens.js`, `tools/hooks/pre-commit`, `tools/gerar-animacao.js`,
  `professores/tiago/ciclos/ciclo-01-ritmos/assets/style.css`,
  `professores/tiago/ciclos/ciclo-01-ritmos/assets/nav.js`,
  `professores/tiago/ciclos/ciclo-01-ritmos/assets/style.css.bak` e
  `apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md`. **pula** para `README.md`,
  `AGENTS.md`, `IDENTIDADE-VISUAL.md`, `biblioteca/guia-do-professor.md`,
  `experimentos/teste.html`, `professores/tiago/ciclos/ciclo-01-ritmos/ritmos.conf`,
  `professores/tiago/ciclos/ciclo-01-ritmos.fipp`,
  `professores/tiago/ciclos/ciclo-01-ritmos/aula-01.md`,
  `apresentacoes/apresentacao-01-rizoma/README.md` e
  `apresentacoes/apresentacao-01-rizoma/rizoma-animado.html`. As três famílias entram, o
  resto não — exatamente como desenhado (**9 RODA / 10 pula** nos 19). (O `.bak` da oitava
  linha é a borda conhecida, declarada no fim desta entrada.)
- **A seção nova, rodada isolada e VERBATIM.** `git diff --cached` está **vazio** neste worktree
  (0 arquivos no stage), e o hook sai 0 na linha 23 antes de qualquer seção — logo o teste
  ponta-a-ponta exigiria um `git add`, que a tarefa proíbe. Em vez disso, extraí as **linhas
  216–227** do hook (`sed -n '216,227p'`) para um arquivo, **conferi por `diff` que o trecho
  extraído é idêntico ao do hook** e rodei-o **cinco** cenários com `arquivos` predefinido:
  | Cenário | Saída | Exit |
  |:--|:--|:--:|
  | `tools/templates/ciclo.css` no stage, validador **real** | `pre-commit: validando a identidade visual ...` / `pre-commit: identidade visual ok (4 verificações passaram)` | **0** |
  | `README.md` + `biblioteca/guia-do-professor.md` | **nada impresso** — o validador **não é chamado** | **0** |
  | `tools/templates/ciclo.css` no stage, com um `node` **shim** no `PATH` que emite dois `erro:` e sai 1 | stdout: só `pre-commit: validando a identidade visual ...`; **stderr**: `pre-commit: recusado — a identidade visual não se sustenta.` + os dois `erro:` + as duas linhas de orientação (separados com `2> err.txt` e `1> out.txt`) | **1** |
  | **só o deck** (`apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md`) | `identidade visual ok (4 verificações passaram)` | **0** |
  | **só `assets/` de um pacote** (`professores/tiago/ciclos/ciclo-01-ritmos/assets/style.css`) | `identidade visual ok (4 verificações passaram)` | **0** |

  As duas últimas linhas provam que as **três** famílias do guard disparam cada uma por si — o
  deck sozinho e um asset de pacote sozinho bastam para chamar o validador. O terceiro cenário é
  o que prova o **caminho de recusa**: sem ele, a falha da seção ficaria não exercitada.
- **O hook inteiro, no estado atual do worktree** — `bash tools/hooks/pre-commit` com o stage
  vazio → **exit 0**, sem saída (sai na linha 23, como esperado).
- **O hook continua instalável** — `bash tools/instalar-hooks.sh` → `instalado: .git/hooks/commit-msg`,
  `pre-commit`, `pre-push` (links simbólicos), **exit 0**, **idempotente**; `.git/hooks/pre-commit`
  é link simbólico para `/home/mti/bibTex/danca/tools/hooks/pre-commit`, e os três hooks ficam
  ativos.
- **As quatro checagens continuam passando** — a chamada é a mesma do `node` direto; o hook só
  **redireciona** o log. Nada foi editado no validador: `md5sum` = `78bad985797e2601fda8580c8b978764`,
  11.609 bytes.

**Referências.**
`CONGELAMENTO.md` (rito dos congelados; `tools/` em bloco — logo `tools/hooks/`);
`REGRAS.md` **Regra 17** (todo conteúdo versionado, com commit auditável — o `pre-commit` é a
trava dela e o `commit-msg` impõe o formato) e **Regra 16** (formato de entrega: PDF único
consolidado + pacote HTML interligado — é a razão de o `assets/` de cada pacote ter de bater
com a fonte, o que a checagem "Circuito" fiscaliza); `IDENTIDADE-VISUAL.md` (os tokens e por
que a paleta é única); a entrada de `REGISTRO.md` de **25/09/2026** ("A identidade visual passa a
existir como contrato…"), cujo "O que ainda não está feito" **nomeia esta lacuna** —
`check-identidade.js` existia e **não** era chamado; e a entrada de **26/09/2026** ("O `DOCS`
deixa de ser lista à mão…"), cuja seção "Congelados" é o **modelo de estrutura** desta.

**O que ainda não está feito.**

- **A frente A continua SEM COMMIT.** Este trabalho está no worktree e **não** foi commitado:
  a tarefa proíbe, e o rito dos congelados exige **commit próprio** para `tools/hooks/pre-commit`.
  Enquanto o commit não existir, a seção 5 roda **de fato** (o `.git/hooks/pre-commit` é link
  simbólico para o arquivo do repositório, e a alteração já está viva), mas **não está no
  histórico** — é o único ponto que falta para fechar a frente A.
- **A prova ponta-a-ponta fica devida.** Foi testado o trecho **isolado** e o hook com o stage
  vazio; **não** houve uma execução real do `git commit` com `tools/` no stage, porque isso
  exigiria um `git add` que a tarefa proíbe. **Quem commitar deve ver a seção 5 disparar** e
  conferir a linha `pre-commit: identidade visual ok (4 verificações passaram)`.
- **`tools/check-identidade.js` segue UNTRACKED (`??`).** Ele nasceu nesta frente e **precisa
  entrar no mesmo commit** que o hook — se só o hook for commitado, o `pre-commit` passa a
  chamar um arquivo que não existe no repositório, e **todo commit com `tools/` no stage
  falha** com "No such file or directory". É a armadilha desta frente: **os dois arquivos vão
  juntos**, e o commit é do rito (motivo declarado + commit próprio).
- **E o resto da frente de identidade ainda não foi commitado.** O validador não basta a si
  mesmo: lê `tools/templates/ciclo.css` (**modificado**, sem commit) e `tools/templates/nav.js`
  (**untracked**), compara com o deck e com os `assets/` dos pacotes — e a **seção 3** do hook,
  que roda antes dele, chama o `tools/gerar-ciclo.sh`, que por sua vez invoca o
  `tools/lib-tokens.js` (`--latex`) e é `require`'d por `gerar-animacao.js` e
  `sincronizar-slide.js`. Num clone limpo, **o commit do rito não pode levar só o hook e o
  validador**: tem de levar as **fontes da identidade** (`tools/templates/ciclo.css`,
  `tools/templates/nav.js`, `tools/lib-tokens.js`) e o `IDENTIDADE-VISUAL.md` — que o validador
  **não abre** (ele só o cita no comentário e na mensagem de erro), mas para onde ele **manda
  quem lê a recusa**, e que não existe no `HEAD`. Sem as fontes, o `pre-commit` passa a recusar
  a si próprio. Medido com `git status --short` sobre cada arquivo que o script abre.
- **A entrada NÃO foi inserida no `REGISTRO.md`.** Ela existe neste arquivo de sessão; quem
  commitar **acrescenta no FIM** do `REGISTRO.md` (cronológico crescente) — o
  `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO",
  e inserir no topo publicaria o marco errado no `HANDOFF.md`.
- **Uma borda real e declarada, que o teste da tabela toca.** O 20º caminho da minha primeira
  medição foi `identidade nao existe` — e ele **casou** o guard: `^tools/` casa `tools/hooks/…`,
  e qualquer caminho que **comece** com uma das famílias entra, **mesmo que o arquivo não exista**
  (o `grep` só olha texto). É o comportamento correto — o hook trabalha sobre **nomes no stage**,
  não sobre o disco — e note que isso **não** cria caminho de falha falsa: `git diff --cached
  --name-only` só lista caminhos que existem no índice. A tabela publicada tem **19** caminhos
  reais (**9 RODA / 10 pula**); o caminho inventado foi retirado da contagem por não ser um
  arquivo do repositório.
- **A borda do regex.** `assets/style.css.bak` **casa** o guard (a família termina em `/assets/`,
  sem exigir extensão) e `apresentacoes/apresentacao-01-rizoma/README.md`
  **não** casa. A primeira borda é inofensiva — o pior caso é rodar o validador uma vez a mais
  num commit que já mexe em assets — e ficou **medida**, não suposta. Fechar a família com
  `/assets/(style\.css|nav\.js)$` seria mais preciso; não foi feito para manter o regex legível.
  Note-se que a seção 1 **não** cobre esse caso (medi: o regex dela não casa `.bak`), então a
  borda é real, ainda que inócua. **Não é dívida**; é uma borda conhecida, e está declarada.
- **Segue em aberto, da entrada de 25/09:** o **desenho do mapa** tem três falhas de contraste
  (`#ffffff`/`#b08d57` = 3,09; `#fdf6ea`/`#b08d57` = 2,88; `#8a6a3b`/`#e8dcc8` = 3,69) que
  vivem nos SVGs, **fora** do alcance do `check-identidade.js` — o validador não as vê e este
  hook **não** as barra. E a **Frente B** (os dois defeitos do formulário e as decisões de
  captura §7.2/§7.4/§7.5) permanece intocada.

## 26/09/2026 — O campo ganha a forma canônica da linha de base, a estrutura do consentimento e o formulário da aula

**O que motivou.**
Três lacunas no **material de campo**, todas medidas antes de qualquer escrita, nenhuma delas de
código.

1. **A linha de base tinha duas formas e nenhuma decisão escrita.** O `-dados.json` não guarda
   linha de base nenhuma (medido: `linhaDeBase` ocorre **0** vezes nos três `-dados.json` — chaves
   `[ciclo, escola, professor, criado_em, ultimo_lancamento, apelidos, aulas, _nota]`). O PO declara
   duas coisas diferentes: no Duo, uma **tabela de dimensões** (`ciclo-01-duo-po.md:99–103`) **e**
   uma **tabela por aluna** (`:133–140`); em Ritmos, só a por aluna (`ciclo-01-ritmos-po.md:94–99`).
   A tela de lançamento lê **por aluna** (`tools/templates/lancamento.html:916`, `:918–921`), o
   `lib-vistas.js` documenta e aceita **as duas** (`:390`, `:426–440`, `:446`, `:454`), e o schema do
   PO descreve a chave como "uma TABELA DE DIMENSÕES no documento"
   (`ciclo-01-po-schema.json:33–36`). Quem lê o schema hoje conclui o contrário de quem lê a tela.
   Pior: o extrator só põe **a primeira tabela de cada bloco** (`tools/lib-extracao-md.js:94–96`),
   então as linhas por aluna do PO do Duo **não existem** no `po-01.json` (medido: Duo = 3 objetos
   `{dimensao,trazem,falta,dominam}` + 15 strings; Ritmos = 4 objetos `{aluno,traz,precisaDesenvolver}`
   + 11 strings).
2. **Não existia consentimento em lugar nenhum.** Varredura em 26/09/2026: **nenhum** TCLE, termo de
   consentimento ou assentimento em nenhum `.md` do repositório fora de `po_ref/`. E o instrumento
   de campo pede faixa etária com a primeira faixa em `☐ 3–6`
   (`2026-10-03-ritmos/formulario.md:16`). A **P-12** resolve o **repositório** (apelido estável
   basta; nome e contato fora do Git) — ela **não** resolve o **consentimento de responsável**.
3. **O `campo/README.md` descrevia um instrumento só.** Ele descrevia o **instrumento de eliciação**
   (o questionário aplicado a outros professores) e **não** o **formulário de campo da aula** — a
   folha de captura que a aula **devolve**, que o professor usa **durante** a aula e cujo conteúdo
   alimenta o lançamento. Esse artefato existe de fato (`ciclo-01-ritmos-captura-aula-01.md`, 141
   linhas; `ciclo-01-diaghilev-captura-aula-01.md`, 89 linhas) e vivia sem descrição.

**O que foi decidido.**

- **A forma canônica da linha de base é POR ALUNA, e as chaves são `{aluno, traz, precisaDesenvolver}`**
  — em camelCase, porque é o que sai do cabeçalho da tabela do PO pela regra de tabela do contrato
  (`Precisa desenvolver` → `precisaDesenvolver`, `tools/lib-extracao-md.js:73–96`). Ela vive na seção
  `## Linha de base` do **PO** e no JSON **extraído do PO**
  (`professores/<professor>/ciclos/ciclo-XX-<escola>/po-01.json`, chave `linhaDeBase`). É a forma que
  o `lancamento.html` de fato consome (`:916`, `:918–921`, marcas em `:1146–1152`).
- **A forma por dimensão `{dimensao, trazem, falta, dominam}` é a APRESENTAÇÃO, não o dado.** Ela
  agrupa a mesma informação por eixo, para leitura do grupo — é o que o `lib-vistas.js` renderiza
  (`:390`, `:446`, `:454`) e o que o PO do Duo chama de "linha de base do grupo (compartilhada)"
  (`:110`). **Não** é o lado autoritativo.
- **A divergência fica escrita, não resolvida por decreto.** O `ciclo-01-po-schema.json:33–36`
  descreve `linhaDeBase` como tabela de dimensões enquanto o consumidor lê por aluna; ambas as
  leituras passam hoje porque o `lib-vistas.js` aceita as duas. O que a decisão fixa é **qual é o
  dado** — a outra vira apresentação. Corrigir o schema e o extrator é trabalho de outra frente, e
  ficou registrado como lacuna com `[Preencher: …]`.
- **O consentimento é ESTRUTURADO COM LACUNAS — não fechado, e o artefato é novo em `campo/`.** A
  estrutura entra como `professores/tiago/campo/consentimento.md`, na **raiz** do diretório, e não
  dentro de um evento: o padrão que o próprio `README.md` fixa (`:9–19`, `AAAA-MM-DD-<escola>/`, um
  diretório **por evento de campo**) vale para o instrumento-aplicado e para as respostas, que são
  **daquele** evento e não se reescrevem; o consentimento é a **condição prévia** de qualquer evento
  e a estrutura dele é a mesma em todos. **Não** em `biblioteca/`: lá mora o **guia compartilhado do
  professor**, que é um guia; consentimento é material **de campo**.
- **Nenhuma cláusula jurídica foi redigida — de propósito.** O arquivo afirma o que o projeto **faz**
  com o dado (medido no código e nas regras, portanto afirmável) e marca **todo** o resto com
  `[Preencher: …]`: a quem se dirige e quem assina, idade de consentimento autônomo, assentimento da
  própria aluna, base legal (com a remissão ao art. 14 da LGPD **sem interpretá-lo**), redação da
  finalidade, prazo de retenção, o que se faz ao fim do prazo, canal de exclusão, controlador e
  contato, se a recusa impede a participação, onde ficam as vias assinadas e se elas são versionadas
  por evento. **Dez** lacunas jurídicas no artefato, mais as duas de aplicação — todas `[Preencher: …]`.
- **O `campo/README.md` ganha os três assuntos, sem perder nada.** O arquivo tinha **48 linhas /
  2 359 B** e descrevia `Material de campo`, `Estrutura`, `Regras` e `Relação com o protocolo`. A
  linha 48 (`Ver também [PROTOCOLO.md]… e [REGISTRO.md]…`) **ficou onde estava**; o texto novo entra
  **depois** dela. Nenhuma linha foi removida (`git diff --numstat`: `278  0`).
- **O formulário de campo da aula é descrito onde ele não mora — e o README diz isso.** Ele é
  **fonte de ciclo**: vive em `professores/<professor>/ciclos/ciclo-XX-<escola>-captura-aula-NN.md`,
  é hasheado pela âncora (`tools/hash-ciclo.sh:18–45` cobre `ciclo-XX-*.md` que não sejam de outra
  escola) e **não** é material de `campo/` (nada em `campo/` entra na âncora). O README descreve o
  ciclo de vida (`tools/gerar-ciclo.sh:262–268` valida a captura contra o schema e emite
  `captura-aula-NN.json`; `:275–276` copia para `captura-XX.json`) e a **distinção dos três
  instrumentos**: o de eliciação (outros professores), a folha de captura (durante a aula, por ciclo)
  e a tela de lançamento (depois da aula, software).

**Onde entrou.**

- `professores/tiago/campo/README.md` — **+278 linhas, −0**. Não é congelado. Passa de **48** para
  **326 linhas** e de **2 359** para **21 670 bytes**. É **um único hunk**: `@@ -48,0 +49,278 @@`.
  Repartido pelas três peças pelas faixas que cada seção ocupa:
  **b13** = `+49–152` (**104** linhas, seções `# A linha de base — a forma canônica`,
  `## A forma canônica é por aluna`, `## A outra forma é a apresentação, não o dado`,
  `## Lacuna medida: a extração perde a tabela por aluna quando o bloco tem duas`,
  `## A forma canônica não está nos -dados.json`);
  **b14 (a nota de lacuna)** = `+153–232` (**80** linhas, `# Consentimento — estrutura com lacunas`);
  **b15** = `+233–326` (**94** linhas, `# O formulário de campo da aula`).
  104 + 80 + 94 = **278**. ✓
- `professores/tiago/campo/consentimento.md` — **criado**, `??` no status (untracked), **112 linhas /
  6 717 bytes**. Não é congelado (não existia). É o artefato que a seção b14 do `README.md` linka.

**Motivo declarado — os congelados.** **Não se aplica.** Nenhum arquivo congelado foi tocado por
escrito: `PROTOCOLO.md`, `REGRAS.md`, `tools/` (inteiro), `tools/templates/`, `prompts/`,
`biblioteca/guia-do-professor.md`, `METODO.md` e `ARQUITETURA-CAPTURA.md` foram **lidos** como
evidência (as remissões acima apontam linha por linha) e **não** editados. `tools/templates/lancamento.html`
e `lancamento.html` em geral são outra frente de trabalho — a tela é lida pelo que ela consome, não
alterada. Nada congelado entra nesta mudança, logo não há motivo declarado a registrar.

**Com o quê.**

- O **PO** como fonte do dado: `professores/tiago/ciclos/ciclo-01-duo-po.md` (seção
  `## Linha de base` na linha **94**; tabela de dimensões em **99–103**; `### Linha de base do grupo
  (compartilhada)` em **110**; nota da pesquisadora em **129–131**; `### Linha de base por aluna` em
  **133**; cabeçalho `| Aluna | Traz | Precisa desenvolver |` em **135–136**; as quatro linhas em
  **137–140**) e `professores/tiago/ciclos/ciclo-01-ritmos-po.md` (`## Linha de base` em **89**;
  introdução **91–92**; cabeçalho `| Aluno | Traz | Precisa desenvolver |` em **94–95**; linhas
  **96–99**; `### Restrições físicas declaradas (P-22)` em **101–110**).
- As **respostas** transcritas, que são **material bruto** e ficaram intocadas:
  `professores/tiago/campo/2026-09-18-ritmos/respostas.md:96–116` — a linha de base do professor
  entrevistado escrita **em prosa, um bullet por aluno**. É a prova de que a forma canônica **não**
  é a prosa: o dado por aluna tem três chaves, e a prosa é matéria-prima da transcrição.
- As **folhas de captura reais**, lidas para descrever o artefato que descrevemos:
  `professores/tiago/ciclos/ciclo-01-ritmos-captura-aula-01.md` (**141** linhas) e
  `professores/fochini/ciclos/ciclo-01-diaghilev-captura-aula-01.md` (**89** linhas). Delas vieram a
  legenda (`Durante a aula, marque; depois, escreva`, `✓ · ~ · X · ? · vazio`), o frontmatter, o bloco
  P-11 (`O que mudou em relação ao plano:`), o bloco P-10 (`### <Aluno>` com a tabela
  `| O que o PO declara que ele precisa desenvolver | Observado na aula |`), as `Notas soltas`, o
  `Fecho da aula` e `Abandonado?`/`Materiais`; e, em Ritmos, a nota de montagem em **66–78**
  (*"Forma escolhida: (b) — uma tabela por aluno"*) e o `[Preencher: o PO não declara linha de base
  individual da Mari …]` em **124–125**.
- O **instrumento de eliciação** (`2026-10-03-ritmos/formulario.md`, 184 linhas) — lido para a faixa
  etária (`:16`) e o bloco opcional de nome/contato (`:154–178`). **Não** foi editado.
- Os **consumidores e as regras**, todos congelados e apenas lidos: `tools/templates/lancamento.html`
  (`:916`, `:918–921`, `:945`, `:1146–1152`), `tools/lib-vistas.js` (`:390`, `:426–440`, `:446`,
  `:454`, `:594`), `tools/lib-extracao-md.js` (`:73–96`, a REGRA DE TABELA de 2026-09-20),
  `tools/gerar-ciclo.sh` (`:262–268`, `:275–276`), `tools/hash-ciclo.sh` (`:18–45`),
  `tools/cifrar-dados.js` (cifra do JSON inteiro), `toolstools/../ciclo-01-po-schema.json` (`:33–36`,
  `:115`), `CONGELAMENTO.md` (política de segurança dos dados sensíveis) e `ARQUITETURA-CAPTURA.md`
  §5 (`Os dados do JSON são os mesmos dos acompanhamentos atuais — dados de menores`; `Fora do Git?
  Decisão pendente — ver seção 7`; `Acesso — Só o professor (com senha)`).
- Medições por comando: `git diff --numstat -- professores/tiago/campo/` → `278 0 README.md`;
  `git diff -U0` da mesma pasta → **1** hunk; `grep -c linhaDeBase` nos três `-dados.json` → **0**,
  **0**, **0**; contagem de objetos por forma em `po-01.json` (Ritmos 4 + 11 strings; Diaghilev
  4 + 4; Duo 3 + 15).

**Referências.**

- Regras do projeto: **P-12** (apelido estável no repositório — e o que ela **não** cobre), **P-10**
  (o PO declara a linha de base), **P-11** (condições de contorno), **P-17** (todo ciclo produz os
  mesmos tipos de artefato), **P-04** (saídas são reconstruíveis), **P-05** (material de campo é
  bruto), **P-06** (descritivo, sem julgamento), **P-22** (restrições físicas declaradas).
- `.github/instructions/ciclo-fontes.instructions.md` — sufixo da escola, um arquivo por artefato,
  apelidos estáveis, lacunas explícitas, saídas geradas.
- `.github/instructions/registro-md.instructions.md` — as sete seções desta entrada, ordem
  cronológica crescente, nota de correção datada.
- `AGENTS.md` e `README-ciclos.md` — o campo como material de observação; o ciclo como unidade.
- O próprio `campo/README.md:9–19` — o padrão `AAAA-MM-DD-<escola>/` que justifica a raiz de `campo/`
  para o consentimento.

**O que ainda não está feito.**

- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. A tarefa proíbe commit, `add`,
  branch, `reset` e `checkout`; a disciplina do projeto exige commit próprio com motivo declarado, e
  aqui nem há congelado para justificar.
- **Esta entrada NÃO está no `REGISTRO.md`.** Ela existe neste arquivo de sessão; quem mesclar
  **acrescenta no FIM** do `REGISTRO.md` (ordem cronológica crescente, a mais recente no fim)
  porque `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO"
  e inserir no topo publicaria o marco errado no `HANDOFF.md`.
- **O consentimento continua NÃO FECHADO, e agora isso está declarado em dois lugares** (a seção do
  `README.md` e o cabeçalho do `consentimento.md`). Ele é **estrutura com lacunas**: enquanto houver
  `[Preencher: …]`, **não existe termo aplicável ao campo** — e a decisão de parar aí é deliberada,
  porque a redação jurídica não é do protótipo. **Nenhum dos professores tem consentimento
  assinado**; nem há onde arquivá-lo sem que se decida se as vias entram no Git (a decisão está entre
  as lacunas).
- **`linhadebase-duo-forma-canonica` NÃO EXISTE no banco de todos.** A tarefa dizia que esta peça o
  destravaria; medido, `SELECT … WHERE id='linhadebase-duo-forma-canonica'` devolve **0 linhas**. A
  forma canônica **está** fixada no `README.md` (26/09/2026, linhas 52–151), mas não há todo a marcar
  como `done` — o destravamento é declarado aqui, não registrado no banco.
- **A divergência do schema não foi corrigida.** `ciclo-01-po-schema.json:33–36` continua descrevendo
  `linhaDeBase` como tabela de dimensões, e a regra do extrator (`lib-extracao-md.js:94–96`) continua
  descartando a segunda tabela de um bloco — de modo que as linhas por aluna do PO do Duo **seguem
  fora** do `po-01.json` (medido: 3 objetos de dimensão, 0 por aluna). Ficou `[Preencher: dar à tabela
  por aluna do PO do Duo um bloco próprio …]` no `README.md`. Os dois arquivos são **congelados**, e
  corrigi-los é outra frente.
- **Fica pendente, e é medido, o `Fora do Git?` de `ARQUITETURA-CAPTURA.md` §5.** A tabela de
  comportamento do `consentimento.md` afirma o que o código **faz hoje** — apelido, nome e contato
  fora do Git, PDF sem acompanhamentos, HTML cifrado, JSON cifrado por inteiro, acesso só do
  professor — e **não** o que foi decidido. A pendência continua pendente.
- **Um elo morto e pré-existente, que NÃO foi corrigido para não misturar frentes:** a linha 48 do
  `README.md` aponta para `../REGISTRO.md` — e não existe `professores/tiago/REGISTRO.md`. É anterior a
  esta mudança e ficou como estava.
- **Nota datada de correção — 26/09/2026, mesma sessão.** Duas afirmações escritas **acima**, nesta
  entrada, saíram erradas e **não foram apagadas** (a regra do projeto — o passado se incorpora, não se
  reescreve — vale também para os artefatos de sessão). A correção segue aqui, datada:
  1. Onde está escrito *"**Dez** lacunas jurídicas no artefato, mais as duas de aplicação"*: **medido**,
     o `professores/tiago/campo/consentimento.md` tem **12** marcadores `[Preencher:` no corpo
     (linhas 71, 73, 75, 80, 83, 89, 90, 91, 92, 97, 100 e 102 — mais 2 ocorrências que são remissão
     ao próprio marcador no cabeçalho, linhas 16 e 18, que **não** são lacunas). A repartição é:
     Partes e assinatura **3**, Base legal e finalidade **2**, Guarda e ciclo de vida **4**, Aplicação
     **3** = **12**. A seção de lacunas do `README.md` (linhas 203–226) tem **11** marcadores, mais
     **1** no aviso de fronteira (linha 181) = **12**. O total correto é **12**, não dez.
  2. Onde está escrito *"`toolstools/../ciclo-01-po-schema.json`"* na lista **Com o quê.**: é erro de
     digitação. O caminho correto é **`professores/tiago/ciclos/ciclo-01-po-schema.json`** (linhas
     33–36 e 115, medido). Os demais caminhos daquela lista foram conferidos e estão certos.

## 26/09/2026 — A data da aula deixa de ser adivinhada: o `ciclos.json` passa a declarar `aulas[]`

> **Nota de mesclagem (para quem mescla).** Esta entrada existe no arquivo de sessão
> `/home/mti/.copilot/session-state/f4d16739-cbc4-4204-a8c4-a98e7eb73fdd/files/registro-b4.md`.
> **Acrescente-a no FIM do `REGISTRO.md`** — a ordem é cronológica crescente e
> `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO";
> inserir no topo publicaria o marco errado no `HANDOFF.md`. Nada foi commitado.

**O que motivou.**
O formulário de lançamento mostrava a **data planejada errada em 23 das 25 aulas** dos dois ciclos
não semanais. A causa é um default mudo no consumidor:

```js
const passo = Number(m.intervalo_dias) || 7;   // tools/templates/lancamento.html
```

`dataPlanejada()` calculava a data como `inicio + (n − 1) × 7`. Medido nas três escolas:
`intervalo_dias` **não existe** em nenhum pacote — as chaves de cada ciclo em `ciclos.json` eram
`['arquivo','duracao_min','escola','fim','id','inicio','total_aulas']` — e `grep -n
'intervalo_dias' tools/gerar-ciclo.sh` **não achava nada no produtor**. O passo **7** é o intervalo
do **Duo**, e só dele.

A divergência, medida aula a aula contra o cronograma real do TSV
(`python3 -B tools/calendario.py --aulas-arquivo`):

| escola | aulas | datas | divergentes ANTES |
|:--|--:|--:|--:|
| `duo` | 12 | 12 | **0/12** ✅ (coincidência — é o único semanal) |
| `ritmos` | 21 | 14 | **20/21** ❌ |
| `diaghilev` | 4 | 4 | **3/4** ❌ |

O Ritmos é o caso que denuncia o modelo: **21 aulas em 14 datas**, sete datas com **duas** aulas
(`2@19:00`, `6@08:00` + `6@09:00`) — 21 aulas e 14 datas, com uma hora de diferença entre as duas
do mesmo dia. A Diaghilev dá em semanas de **5** e de **2** dias. Qualquer data derivada por passo
fixo erra a partir da segunda aula do dia; e qualquer prazo contado **por aula** em vez de por
bloco erra pelo mesmo motivo.

**O que foi decidido.**

- **`aulas[]` entra no `ciclos.json`, uma entrada por aula, para as três escolas** (§4.2). Cada
  entrada sai com as chaves do desenho, na ordem do desenho: `{n, data, inicio, fim, marco,
  estado, lancada, config, ancora, prazo}`. `n` é **string** (`"01"`) e `config` é
  **`"captura-aula-NN.json"`** — a convenção que o `b3a` já publica em disco.
- **A data passa a ser DECLARADA, não derivada.** Com `aulas[]` presente, a precedência correta é
  `aulas[n].data` **quando existir**; `dataPlanejada()` é **rebaixada a fallback** para a aula que
  o índice ainda não declara. Foi essa a razão de escolher o consumidor: emitir `aulas[]` sem
  corrigir a precedência manteria o formulário mentindo, porque `dataPlanejada()` continuaria
  sendo alcançável.
- **`intervalo_dias` NÃO é emitido, e isso é deliberado.** Medido, o passo só é uniforme numa das
  três escolas:

  | escola | diferenças entre datas consecutivas (dias) | uniforme? |
  |:--|:--|:--|
  | `duo` | `7 7 7 7 7 7 7 7 7 7 7` | **sim** |
  | `ritmos` | `0 3 4 0 3 4 0 3 4 0 3 4 0 3` (os `0` são as datas de duas aulas) | **não** |
  | `diaghilev` | `2 5 2` | **não** |

  Emitir um número único para os dois cronogramas não uniformes **seria trocar um erro silencioso
  por outro**. A chave fica de fora, e o `ARQUITETURA-AULA.md` §4.2 já a listava como default que
  o índice não substitui.
- **O `|| 7` foi neutralizado no ponto de uso, não no valor.** `dataPlanejada(m, id)` agora
  **exige** um `Number(m && m.intervalo_dias)` explícito; sem ele — ou sem `inicio`, ou sem `n` —
  devolve **string vazia**. Ou seja: onde não há fonte, o formulário mostra uma **lacuna
  declarada** (campo de data vazio, que o professor preenche), e **não um palpite**. Onde o passo
  **é** declarado, a aritmética antiga (`inicio + (n − 1) × intervalo_dias`) **continua valendo** —
  e é o que mantém os fixtures de `experimentos/` verdes.
- **Encadeamento implementado:** `dataDaCaptura(m, id) = dataDeclarada(m, id) || dataPlanejada(m, id)`.
  A data do índice ganha; o passo declarado sobrevive como fallback.
- **O seletor de aula e a primeira-sem-dado passam a ler o índice.** `primeiraSemDado(m, dados)`
  iterava `1..max(total_aulas, …)` e **inventava** os ids (`dados.aulas["01"]`); `opcoes()` montava
  o seletor pela **união dos ids já lançados** em todos os ciclos. Agora os dois leem `m.aulas[]`
  primeiro. `opcoes()` faz **união aditiva** — acrescenta os `n` declarados ao conjunto que já
  existia; **nunca substitui**. É a união que mantém o caso 13 do harness verde
  (`01,02,03,04,05`, sem `06`). Os dois guardam o laço antigo como fallback para índice **sem**
  `aulas[]` (os fixtures, os ciclos já publicados).
- **`ancora` e `prazo` saem `null` e ficam declarados como sem fonte.** `prazo` depende do `B7`
  (§3) e `ancora` do `B5` (§5); nenhum dos dois tem produtor. **Não foi inventado valor.**
- **`estado`/`lancada` são derivados de `dados.aulas[NN]`, e a lacuna é declarada.** O §1 nomeia
  o "ato declarado" (planejada → dada → lançada), mas **não existe código que o leia ou escreva**:
  a varredura do repositório não acha leitor nem gravador de `estado`/`lancada`. O único sinal
  legível por máquina é a chave `dados.aulas[NN]` existir — logo `estado='dada'` e `lancada=true`
  quando ela existe, `estado` ausente e `lancada=false` quando não. **É a melhor aproximação
  disponível, não o desenho**; está declarado em "O que ainda não está feito".
- **A leitura da linha de corte NÃO foi acoplada — e o motivo é medido.** `tools/lib-vistas.js`
  já faz a leitura pedida (`comDado = aulas.filter(k => !dados.aulas[k].ausentes.includes(chave))`;
  `ultima = comDado[comDado.length − 1]`; *"Última observação registrada — fonte: aula ${ultima}"*),
  e o `ARQUITETURA-AULA.md` a cita como o que já existe. Mas ela é **inline dentro de
  `mdAcompanhamento()`** (`:115–159`) e **não é exportada**; e a grandeza que ela mede é **outra**:
  é a última aula com **observação de uma aluna** (filtra por `ausentes.includes(chave)`), não a
  última aula **lançada** do ciclo. Acoplar faria "linha de corte" significar uma segunda coisa
  diferente. `grep -c 'linha de corte' tools/templates/lancamento.html` → **0**; as oito ocorrências
  de "linha de base" ali são a base por aluna do PO (e `lib-vistas.js:132`/`:157` carregam as duas
  lacunas `[Preencher: linha de base …]`). Puxar essa leitura para o formulário exigiria refatorar
  arquivo congelado além do escopo desta peça. **Declarado, não duplicado** — não foi escrita uma
  segunda leitura da mesma coisa.
- **A cópia divergente de template fica divergente, e declarada.**
  `experimentos/captura-json/formulario.html` é uma cópia mantida à mão que **não** é carregada pelo
  harness (`teste.js:7` e `:62` leem `tools/templates/lancamento.html`); ela segue com o comentário
  antigo (`:669`), com `const passo = Number(m.intervalo_dias) || 7;` em `:715` e com a remissão ao
  passo em `:1175`. **Não foi silenciosamente espelhada** — espelhá-la seria propagar uma segunda
  redação do mesmo contrato. `experimentos/` é demonstrativo e não entra em pacotes, hashes nem
  publicação.

**Onde entrou.**

- `tools/gerar-ciclo.sh` — **congelado.** (a) a invocação do `calendario.py` ganhou
  `--aulas-arquivo "$TMP/aulas.tsv"`; (b) o heredoc que emite o índice ganhou o bloco de
  comentário que fixa a precedência, as três variáveis de ambiente (`AULAS_TSV`, `PLANO_JSON`,
  `DADOS_FONTE`), três funções puras em Python (`ler_aulas`, `ler_marcos`, `ler_lancadas`) e a
  compreensão que monta `aulas[]`; (c) `'aulas': aulas` entra como **última** chave do ciclo.
- `tools/templates/lancamento.html` — **congelado.** Seis edições: o comentário da precedência;
  o bloco `dataDeclarada` / `dataPlanejada` / `dataDaCaptura`; o chamador do campo de data; o
  texto de ajuda; `primeiraSemDado` lendo o índice; `opcoes()` unindo os `n` declarados.
- `professores/<professor>/ciclos/ciclo-01-<escola>/` — os **três** pacotes **regerados**
  (`tiago 01 duo`, `tiago 01 ritmos`, `fochini 01 diaghilev`). **Nenhuma saída gerada foi editada
  à mão.**

**Motivo declarado — os congelados.**

- **`tools/` e `tools/templates/` são dois itens congelados distintos** (`CONGELAMENTO.md:10–46`).
  Os dois foram tocados, e cada um tem a sua razão: o **produtor** porque é o único lugar onde o
  índice pode nascer (§4.2 diz que o índice é pré-produzido pelo gerador); o **consumidor** porque
  emitir o índice sem corrigir a precedência deixaria `dataPlanejada()` alcançável, e o defeito
  seguiria vivo. Este é o `b4`, peça **4** da ordem do §10.
- **Autorização do descongelamento:** a pesquisadora autorizou explicitamente em 23/09/2026
  (`ARQUITETURA-AULA.md:367`): *"vai ter que descongelar — a gente vai ajustar o que tiver que
  ajustar; afinal de contas, a gente tá num protótipo"*. Cada item exige, ainda assim, o seu motivo
  declarado e o seu commit — o motivo está aqui, o **commit não é desta peça**.
- **A mudança altera comportamento, e é por isso que ela está declarada em detalhe.**
  `ciclos.json` passa a levar `aulas[]` (12 / 21 / 4 entradas) e o formulário passa a mostrar data
  declarada em vez de data calculada. Não é redação.
- **O que NÃO muda:** a fórmula e o algoritmo de hash; a **cobertura da âncora** (medido:
  `ciclos.json` **não** está na lista de cobertura — só o par `.conf` e os `.md` fontes, 18 / 18 /
  17 entradas —, logo a âncora **não** precisa ser refeita); os schemas; os validadores
  (`check-pacote.js` **não lê** `ciclos.json`, logo não podia detectar regressão de índice);
  o extrator `validar-plano-ciclo.js` (não foi tocado); o `DOCS` derivado da lib; o engine do PDF
  (`pdflatex` fica); as pétreas e as regras; e o `captura-<id do ciclo>.json`, que continua saindo
  idêntico.

**Com o quê.**
Conferido por medição, ponta a ponta. **Os números abaixo são do diff DESTA peça, hunk a hunk**
(`git --no-pager diff -U0 -- <arquivo>`, agrupado por `@@ -a,b +c,d @@`). O worktree tinha hunks
**não commitados de outras frentes** nos dois arquivos, e `git diff --numstat` os **mistura** — o
`numstat` acusa `143 9` no produtor e `111 47` no consumidor; **esses números NÃO são desta peça**:

| arquivo | o que a peça fez | hunks |
|:--|:--|:--|
| `tools/gerar-ciclo.sh` | **+85 / −3** | 6 de 11 (`@@ -185`, `@@ -223`, `@@ -226`, `@@ -230`, `@@ -234`, `@@ -242`) |
| `tools/templates/lancamento.html` | **+54 / −14** | 10 de 19 (`@@ -691`, `@@ -693`, `@@ -804`, `@@ -843`, `@@ -845`, `@@ -850`, `@@ -856`, `@@ -960`, `@@ -968`, `@@ -1384`) |

Os outros hunks são de peças vizinhas e **não** foram tocados por esta: no produtor, o laço de
`captura-aula-NN` (**b3a**) e a injeção de `@CORES@` + `nav.js` (**Frente A**); no consumidor, os
nove hunks de tokens/identidade (**Frente A**).

- **O defeito morreu, medido aula a aula** contra o TSV real:

  | escola | divergentes ANTES (passo 7) | divergentes DEPOIS (`aulas[]`) |
  |:--|--:|--:|
  | `duo` | 0/12 | **0/12** |
  | `ritmos` | **20/21** | **0/21** |
  | `diaghilev` | **3/4** | **0/4** |

  Medida independente, comparando a função real `dataDaCaptura` extraída do template vivo contra
  `aulas[].data`: **duo 12/12, ritmos 21/21, diaghilev 4/4** coincidências, **0** divergências.
- **`node tools/check-pacote.js` nos três** → `duo` **`OK: 0 erro(s), 6 aviso(s)`**,
  `ritmos` **`OK: 0 erro(s), 6 aviso(s)`**, `diaghilev` **`OK: 0 erro(s), 0 aviso(s)`**; código 0
  nos três. Nenhuma regressão.
- **`tools/hash-ciclo.sh <professor> 01 <escola> --check` nos três** → **`íntegro; cadeia
  intacta`**: `duo` `52f437f26c02459143a0b4e939fc2156046d480cab3b850228c4d5f31ea331fb`, `ritmos`
  `899ccd321922c6b1d401c0c6c2dffd4f733c48fb4f877935c69073d11c9d98ed`, `diaghilev`
  `78daf7e4cb233c4f8f44937232db0a8ecdd6df27658b39c50258f92d82e6839e`.
- **A cobertura da âncora foi MEDIDA, não suposta:** `ciclos.json` **não** aparece na lista de
  fontes cobertas (só o par `ciclo-01.conf` + `ciclo-01-<variante>.conf` e os `.md`); a cobertura
  tem **18 / 18 / 17** entradas. **Não houve reancoragem, e não era para haver** — o índice é
  derivado. Se ele entrasse na âncora, o hash teria mudado e o `--check` teria divergido.
- **O índice emitido, medido nos três pacotes:** chaves do ciclo
  `['id','escola','inicio','fim','total_aulas','duracao_min','arquivo','aulas']` — `aulas` é a
  **última**, como o `indiceComArquivo()` do produtor precisa (ele faz emenda textual de linha);
  chaves da aula exatamente as dez do §4.2. `duo` **12 aulas / 12 datas / 12 marcos**,
  `ritmos` **21 aulas / 14 datas / 2 marcos**, `diaghilev` **4 aulas / 4 datas / 4 marcos**;
  `lancada=true` só na aula `01` do Duo e do Ritmos; `config` = `captura-aula-01.json`; `ancora` e
  `prazo` `null` em **37/37** aulas. `intervalo_dias` **ausente** nos três.
- **A lacuna de `marco` do Ritmos é medida, não inventada.** `marcosPorAula` do plano do Ritmos tem
  **5** entradas: duas de prosa (descartadas) e três com `n` — `01`, **`02–20`** (travessão U+2013,
  uma faixa) e `21`. O extrator só casa `n` numérico, então a cobertura de marco é **2/21** — e
  fica assim, como lacuna, em vez de um valor fabricado para 19 aulas.
- **`node experimentos/provar-por-aula.js` continua rodando, código 0.** É a prova do **Defeito 1**,
  que é do `B3b` — **não foi consertado, e não era para ser.**
- **`python3 -B -m py_compile tools/calendario.py`** → OK, código 0. O `tools/__pycache__/` criado
  foi **removido** (`find . -name __pycache__ -not -path './.git/*'` → vazio).
- **O harness não regrediu.** `experimentos/captura-json/teste.js` rodado antes e depois, com diff
  normalizado: a **única** diferença é o deslocamento de `:870` → `:903` (+33 linhas). Nenhuma
  mudança funcional. **O caso 10 já quebrava ANTES das edições** — `TypeError:
  alvo.querySelectorAll is not a function` em `limparCamposCaptura`, porque o stub `mk(id)` do
  harness não tem `querySelectorAll`. É **pré-existente**, não desta peça, e **mascara os casos
  11–20 nos dois estados**. Os casos que ele mascara foram conferidos por fora do harness: aula
  `'05'` → `2026-10-16` (caso 11) ✅, aula `'06'` → `2026-10-23` (caso 20) ✅, dado da aula 02 →
  `2026-09-25` (caso 15) ✅, e `opcoes()` sobre o ciclo de fixture → **`01,02,03,04,05`** (caso 13)
  ✅, sem `06` e sem `12`.

**Referências.**

- `ARQUITETURA-AULA.md` — **§1** (os três estados da aula: planejada → dada → lançada) e **§2**
  (a linha de corte, com a leitura de `lib-vistas.js` citada como o que já existe); **§4.1**
  (Defeito 2 fechado pelo `B2`; *"O Defeito 1 segue aberto — é o `B3`"*); **§4.2** (a
  especificação do índice — a tabela de derivação campo a campo e a nota de que `duracao_min`,
  `total_aulas` e `intervalo_dias` **seguem como defaults**); **§5** (a âncora por aula, `B5`);
  **§6** (`DIAS` com hora); **§10** (a ordem das peças); **`:367`** (a autorização do
  descongelamento, verbatim).
- `CONGELAMENTO.md:10–46` — `tools/` e `tools/templates/` como itens congelados autônomos e o rito
  do motivo declarado.
- `tools/calendario.py` — `--aulas-arquivo` (implementado pelo `B1`): `por_aula()`, o escritor do
  TSV `NN ⇥ data ⇥ início ⇥ fim` e o driver. Não tem outro consumidor — esta peça é o primeiro.
- `tools/lib-fontes.sh` — `familias_por_aula()` / `docs_derivado()` / `fontes_do_ciclo()` (do
  `B2`); é o que confirma por medição que `ciclos.json` **não** entra na cobertura da âncora.
- `tools/validar-plano-ciclo.js` — `marcosPorAula`, a fonte da chave `marco`.
- `tools/lib-vistas.js:144–149` — a leitura da linha de corte, inline em `mdAcompanhamento()`,
  e as duas lacunas `[Preencher: linha de base …]` em `:132`/`:157`.
- `.github/instructions/registro-md.instructions.md` — as sete seções, ordem cronológica
  crescente, motivo declarado, nota de correção datada.
- `.github/instructions/ciclo-fontes.instructions.md` — sufixo da escola, apelidos estáveis,
  lacunas explícitas, saídas geradas.
- Regras do projeto: **P-04** (saídas são reconstruíveis), **P-06** (descritivo, sem julgamento),
  **P-10** (o PO declara a linha de base), **P-17** (todo ciclo produz os mesmos tipos de
  artefato), **P-12** (apelido estável).
- A medição de entrada da peça: `files/B4-medicao-intervalo-dias.md`, mais os TSV por escola e a
  prova aula a aula do defeito, no diretório de sessão.

**O que ainda não está feito.**

- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. A tarefa proíbe `commit`, `add`,
  branch, `reset` e `checkout`. O congelamento exige **commit próprio** para `tools/` e para
  `tools/templates/` — o motivo está declarado nesta entrada, o commit fica para quem mescla.
- **Esta entrada NÃO está no `REGISTRO.md`.** Ela existe no arquivo de sessão; quem mesclar
  **acrescenta no FIM**.
- **`prazo` e `ancora` não têm produtor.** Saem `null` em **37/37** aulas. `prazo` é o `B7` (§3);
  `ancora` é o `B5` (§5, o `.fipp` por aula). **Nenhum valor foi fabricado** — quando os dois
  existirem, o índice passa a preenchê-los sem mudar de forma.
- **O "ato declarado" continua sem código.** O §1 descreve planejada → dada → lançada, mas nada lê
  ou escreve `estado`/`lancada`. Por isso os dois são **derivados** da existência de
  `dados.aulas[NN]`. **Isso não distingue "aula dada" de "aula lançada"** e não conhece a aula
  pulada (que o §2 trata como ausência legítima). Enquanto não houver o ato, `estado`/`lancada` do
  índice são aproximação, e é isto que a próxima sessão precisa saber.
- **O `B3b` continua pendente, e é o Defeito 1.** O formulário ainda lê `peca(c.id, 'captura')` —
  o config do **ciclo** — em vez de `peca(c.id, 'captura-aula-' + aula)`. Os arquivos por aula já
  existem em disco (o `b3a` os publica) e o índice agora dá a **chave** (`config`); falta a página
  consumir. **Este índice é pré-requisito do `B3b`, não o desfecho dele.**
- **`experimentos/provar-por-aula.js` segue provando o Defeito 1, com código 0** — é a prova que o
  `B3b` vai ter de virar verde de comportamento, não de arquivo presente.
- **O `check-pacote.js` não lê `ciclos.json`** e portanto **não pode** detectar regressão de
  índice. Foi por isso que a verificação desta peça é por fora dele (medição do `aulas[]`,
  conferência aula a aula do defeito e a execução das funções reais do template). Um validador de
  índice é trabalho aberto.
- **`experimentos/captura-json/formulario.html` continua divergente** — comentário em `:669`,
  `|| 7` em `:715`, remissão em `:1175`. Declarado, **não** espelhado. Se a decisão for convergir as
  duas cópias, é outra peça.
- **`primeiraSemDado` e `opcoes()` ainda têm o caminho de contagem** como fallback para índice sem
  `aulas[]` (os fixtures de `experimentos/`, que declaram `intervalo_dias` e não têm índice). A
  remoção desse caminho só é segura quando todos os ciclos publicados tiverem `aulas[]`.
- **A linha de corte não foi acoplada.** Ela continua vivendo só em `tools/lib-vistas.js` e só
  alimenta o acompanhamento por aluna; **o formulário da aula seguinte ainda não a recebe**. Essa é
  a fronteira declarada no §2 e **fica aberta**.
- **O caso 10 do harness quebra antes e depois.** `mk(id)` não tem `querySelectorAll`, e
  `limparCamposCaptura` precisa dele; a quebra **aborta o resumo final** e mascara os casos 11–20.
  É pré-existente, **não foi tocado** (consertar o harness é outra frente) e é o motivo de a
  verificação desses casos ter sido feita por fora.

## 26/09/2026 — O JSON de dados ganha validador: o `-dados.json` deixa de ser conferido a olho (§4.6)

> **Nota de mesclagem (para quem mescla).** Esta entrada existe no arquivo de sessão
> `/home/mti/.copilot/session-state/f4d16739-cbc4-4204-a8c4-a98e7eb73fdd/files/registro-b10.md`.
> **Acrescente-a no FIM do `REGISTRO.md`** — a ordem é cronológica crescente e
> `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO";
> inserir no topo publicaria o marco errado no `HANDOFF.md`. Nada foi commitado.

**O que motivou.**

O `ciclo-XX[-<escola>]-dados.json` é o **segundo artefato de dados** do ciclo — depois do `ciclos.json`
do `B4`, é ele que carrega o lançamento de cada aula: `apelidos`, `aulas[NN]`, as cinco
`condicoes_contorno` (`plano_seguido`, `animo`, `interesse`, `harmonia`, `mudou`), os blocos `tecnica`
e `funcional` por presente, a `duracao_min` e o `relatorio`. Nada disso tinha validador. A conferência
era **a olho**, e a §4.6 do relatório de captura **enumera o que falta** sem que ninguém possa
distinguir, hoje, "campo que o JSON não tem por decisão" de "campo que ninguém preencheu".

O `ARQUITETURA-AULA.md` §4 diz, no item 6 (§4.6), o que fazer com isso: *"Isto entra no §4.5 **antes**
do ciclo-piloto"*. E o §4.3 já nomeia a peça, no espírito de um validador irmão:

> *"um **validador** do JSON (no espírito de `validar-po-ciclo.js`): o par `plano_seguido` × `mudou`, o
> `ultimo_lancamento` de cada aula, a ordem do schema"*

O que **não** existia e passou a existir: um arquivo que recusa, com código de saída, um
`-dados.json` cuja forma não bate — e que **declara** as lacunas do §4.6 em vez de as deixar
implícitas. Sem isso o §4.5 fica sem a etapa 3, e o ciclo-piloto entra com uma fonte não conferida.

**O que foi decidido.**

- **As regras vivem *inline* no validador, não num `-dados-schema.json`.** Não existe — e não passou a
  existir — um arquivo de schema para o JSON de dados. Criar um exigiria **um schema por variante**
  (os sub-blocos de `tecnica`/`funcional` mudam por escola, porque quem manda neles é o PO — §7.1,
  leitura 1 da §4.6), o que já é o padrão dos `.conf` mas não o do `-dados.json`, cuja **fonte é única
  e compartilhada** dentro do ciclo. O validador usa o motor que já existe
  (`tools/lib-validacao-md.js`, `validar()`) com um esquema **declarado em constante**, ao lado da
  tabela de regras no cabeçalho. Se um dia o schema virar arquivo, a troca é local.
- **A cópia dentro do pacote é o ENVELOPE, não a fonte.** `{_cifrado, lancamentos, _nota}` é saída
  gerada (`cifrar-dados.js`); o validador a **recusa** com o mesmo idioma do
  `renomear-chaves-dados.js:50–53` (`/_cifrado/` nos primeiros 400 bytes) e aponta a fonte em claro.
  Editar o envelope à mão continua proibido — quem quiser conferir, confere a fonte.
- **As três leituras da §4.6 foram adotadas como regra de julgamento, não como nota de rodapé.** (1)
  quem manda nos campos é o **PO**, e por isso as chaves de bloco **não são fixadas** — o validador
  confere que as chaves de `tecnica`/`funcional` batem **exatamente** com `presentes`, e não quais são.
  (2) `relatorio` é **do caderno**: `texto`, `surpresas`, `ajustes` são prosa crua, e o nome do campo é
  decisão do professor — o validador exige a **forma**, não o vocabulário. (3) a precedência do caderno
  é o **histórico do Git** mais a lista `ajustes` gravada no ato — não há carimbo dentro do JSON.
- **As tolerâncias medidas nos três ciclos reais são deliberadas e ficam declaradas**, não silenciosas:
  `ultimo_lancamento` é **opcional na raiz** (a Diaghilev não tem: 7 chaves contra 8) e **por aula**
  (hoje nenhum ciclo tem, e o validador **avisa** — a §4.1 decide que ele é *dentro* da aula, e o
  formulário antigo gravava na raiz); `_nota` é opcional na raiz e na aula; o `ciclos.json` da Ritmos
  tem **8** chaves por aula contra as **9** canônicas; **um ciclo com zero aulas lançadas é estado
  legítimo** (a Diaghilev está exatamente assim, `aulas = {}`). Sem essas tolerâncias o validador
  recusaria os três ciclos que existem — o que seria o defeito oposto.
- **As lacunas da §4.6 são DECLARADAS, em lista, com o motivo de cada uma** — 10 itens: onde o campo
  não é deste JSON (`pergunta_emergente` é do **caderno**; `musicalidade`/`linha_de_base` são do **PO**,
  e esse a declara **por aluna**), onde o dado existe mas com outra forma (`duracao_min` guarda a
  **duração**, não o horário; o previsto está no `.conf`), onde **não há campo nenhum**
  (`ocorrencias_fisicas` — **P-22**, que o protocolo *exige* registrar e hoje vai à mão no documento) e
  onde o valor é do **plano** (`estrutura_executada`, `volume_em_tempos`, `o_que_foi_abandonado`).
  Declarar a lacuna é a decisão: **nada foi inventado** para preenchê-la.
- **Reservado, tolerado, não implementado:** `dada_em` (**B6**, a distinção planejada × dada) e a
  `linha_de_base` **por aluna** (**B13**) passam pelo validador sem reprovar, mas não têm regra de tipo
  própria enquanto não houver produtor. `prazo` é **reportado e não conferido** — o cálculo é do
  `ciclos.json` (`ancora`/`prazo` saem nulos enquanto o `B5`/`B7` não existirem).

**Onde entrou.**

- `tools/validar-dados-ciclo.js` — **NOVO, não congelado** (o arquivo é novo; a frente `tools/` já
  estava autorizada). **534 linhas.** `node --check` passa. Mesmo contrato dos quatro irmãos:
  argumento **posicional**, `uso:` no cabeçalho, **exit 2** para uso errado (stderr), **exit 1** para
  problema (stderr, cabeçalho + `N problema(s):` + lista `  - `), **exit 0** com resumo. `--json`
  imprime o payload em **stdout** e o resumo humano em **stderr**, zero dependências externas.
- `tools/hooks/pre-commit` — **CONGELADO, +20 −2 em dois hunks, ambos desta peça**:
  - `@@ -10 +10,2 @@` — **+2 −1** — o comentário de cabeçalho: o item **2)** passa a dizer que o hook
    valida *"a âncora FIPP, o PO, o plano e **os dados** (o `-dados.json` do lançamento por aula) de
    cada ciclo tocado"*.
  - `@@ -93,0 +97,18 @@ for alvo in $alvos_hash; do` — **+18 −0** — o bloco `DADOS`, dentro do
    `for v in $variantes_hash`, **depois** do aviso do PO e **antes** do bloco `PLANO`. Resolve a
    precedência de variante como os irmãos (`ciclo-$numero-$v-dados.json`, e só cai no sem sufixo se
    o da variante não existir), roda o validador, e — em falha — imprime a recusa e `exit 1`; em
    sucesso, imprime o número de lacunas declaradas.
  - ⚠️ **A geometria de partida já não era limpa.** O `git diff --numstat` do arquivo era **`38 1`**
    **antes** desta peça — os hunks `@@ -14 +15,3 @@` (`+3 −1`) e `@@ -191,0 +213,35 @@` (`+35 −0`)
    são da frente **`A5`** (o `check-identidade.js` no hook) e **não** são desta peça; foram
    preservados intactos. Depois desta peça o numstat é **`58 2`** = `A5` (38/1) + esta (20/1).
- `tools/validar-captura-ciclo.js` — **CONGELADO pelo `plan.md:738`, mas NÃO EDITADO.** Está listado
  como o outro alvo congelado do `B10`; a leitura dos quatro irmãos mostrou que o padrão já estava
  certo e **nada** precisou mudar. **Diff de trabalho: nenhum.** O toque é **declarativo** — ele é o
  material de referência, e a única coisa que esta entrada faz é registrar que ele foi lido e
  deliberadamente deixado como está.

**Motivo declarado — os congelados.**

`CONGELAMENTO.md:10–46` lista **`tools/` inteiro** como item congelado autônomo (*"geradores,
validadores, hooks, criptografia dos acompanhamentos"*) e exige, para mexer nele: **motivo declarado
aqui**, e **commit próprio** (que não é desta peça — nada foi commitado). A autorização do
descongelamento é da pesquisadora, **23/09/2026** (`ARQUITETURA-AULA.md:367`):

> *"vai ter que descongelar — a gente vai ajustar o que tiver que ajustar; afinal de contas, a gente tá
> num protótipo"*

O motivo, arquivo a arquivo:

- **`tools/hooks/pre-commit`** — é **o único portão automático** que existe. Sem esta linha, o
  validador novo seria mais um script que alguém precisa lembrar de rodar, e é exatamente essa a
  falha que a entrada anterior do `REGISTRO` (o `check-identidade.js`) descreve e que a `A5` fechou. O
  hook **já** chama os irmãos (PO, PLANO) no mesmo laço; a simetria é o argumento — o `-dados.json` é
  o terceiro artefato de dados do ciclo e era o único sem portão.
- **`tools/validar-captura-ciclo.js`** — **sem mudança**. Declara-se aqui para que a ausência de diff
  não seja lida como esquecimento: a peça foi lida inteira (304 linhas), serviu de padrão para os
  marcadores `  ERRO  `/`  aviso ` e para o idioma de recusa, e continua válida como estava.
- **`tools/validar-dados-ciclo.js`** — arquivo **novo**, sem reescrita de nada: não altera o
  comportamento de nenhum artefato existente e **não é chamado por `tools/check-pacote.js`** (isso é o
  `B11`, outra frente). O raio de alcance é o hook e quem o invocar à mão.

**Com o quê.**

Verificação executada sobre o worktree, saída real:

| alvo | duo | ritmos | diaghilev |
|:--|--:|--:|--:|
| `validar-dados-ciclo.js` (**novo**) | **0** | **0** | **0** |
| `validar-po-ciclo.js` | 0 | 0 | 0 |
| `validar-plano-ciclo.js` | 0 | 0 | 0 |
| `validar-schema-ciclo.js` | 0 | 0 | 0 |

Chamado como os irmãos são chamados — os **dois** `.conf` (base **e** variante), na ordem que o
próprio cabeçalho do script fixa, porque a união é que satisfaz o schema.

- O validador novo, nos três: `ok: … satisfaz as regras do JSON de dados (7 campos obrigatórios na
  raiz, 8 por aula)`. Duo: `1 aula(s) lançada(s) · 4 apelido(s)`, `aulas conferidas: 01 (2026-09-18: 4
  presente(s) · 0 ausente(s))`, `avisos: 1`. Ritmos: `1 aula(s) · 5 apelido(s)`, `2026-09-19: 4
  presente(s) · 1 ausente(s)`, `avisos: 1`. Diaghilev: `0 aula(s) lançada(s)`, *"nenhuma aula lançada
  — estado legítimo"*, `avisos: 0`. Em todos: `lacunas declaradas: 10`.
- Recusas exercitadas: **exit 1** no envelope do pacote (`é o ENVELOPE CIFRADO (derivado), não a
  fonte`), **exit 2** sem argumento, **exit 1** num fixture deliberadamente quebrado (12 problemas + 5
  avisos). `--json` devolve o payload em stdout.
- ⚠️ **Uma nota sobre este item, para não virar lenda.** Numa leitura anterior desta frente, o
  `validar-schema-ciclo.js` apareceu com **exit 1** (`faltam 3 campo(s) obrigatório(s): CICLO,
  OBJETIVO_GERAL, TOTAL_AULAS`). Medido com o cuidado de chamá-lo como o **cabeçalho dele manda** —
  `validar-schema-ciclo.js <schema.json> <conf1> [conf2 ...]`, com o `.conf` **base** e o da
  **variante** — ele **passa nos três** (`ok: … satisfaz ciclo-01-schema.json (11 campos
  obrigatórios)`, exit 0). O exit 1 era da **invocação**, não do arquivo: só o `.conf` de variante não
  carrega `CICLO`, `OBJETIVO_GERAL` nem `TOTAL_AULAS`, que ficam no base. Fica registrado porque a
  conclusão errada é a que se propaga. O hook **nunca** o chama — ele chama PO, PLANO e, agora, DADOS.
- `bash -n tools/hooks/pre-commit` → **exit 0**. `node tools/check-identidade.js` → **exit 0**, com os
  **4** `ok:` (contraste 21 pares; cópia única 21 hex; deck 7 tokens; circuito assets).
- Bloco `DADOS` do hook **simulado à mão** (mesmos argumentos posicionais, mesma precedência de
  variante): imprime exatamente as linhas de sucesso que o hook imprimiria.
- Inventário do worktree: `git diff --numstat` → `58 2 tools/hooks/pre-commit` (e `1616 0
  REGISTRO.md`, de **outras** frentes); `tools/validar-captura-ciclo.js` **sem diff**; untracked real
  (`git ls-files --others --exclude-standard`) = **40**, sendo o `+1` desta peça o próprio
  `tools/validar-dados-ciclo.js`. **Nada commitado.**

**Referências.**

- `ARQUITETURA-AULA.md` — **§4** inteira; **§4.2** (a tabela campo a campo do `ciclos.json`, o nível
  acima deste JSON); **§4.6** (a peça: *"entra no §4.5 antes do ciclo-piloto"*); **§8** (a ordem das
  peças); **`:367`** (a autorização do descongelamento, verbatim).
- `experimentos/captura-json/RELATORIO.md` — **§4.1** (`ultimo_lancamento` **dentro** da aula),
  **§4.3** (o validador nomeado, *"no espírito de `validar-po-ciclo.js`"*), **§4.4**, **§4.5** (o
  validador é a etapa 3, **antes** do piloto) e **§4.6** (a lista de campos que faltam, item a item).
- `CONGELAMENTO.md:10–46` — `tools/` como item congelado autônomo e o rito do motivo declarado.
- `tools/lib-validacao-md.js` — o motor `validar(campos, schema, opcoes)` reaproveitado como está
  (arrays vazios, recursão de `[Preencher`, chaves `_` fora de `extras`).
- Os quatro irmãos: `tools/validar-po-ciclo.js`, `tools/validar-plano-ciclo.js`,
  `tools/validar-schema-ciclo.js`, `tools/validar-captura-ciclo.js` — o padrão de CLI, mensagem e
  código de saída.
- `tools/renomear-chaves-dados.js:50–53` — o idioma de recusa do envelope (`/_cifrado/` nos primeiros
  400 bytes).
- `tools/templates/lancamento.html` e `experimentos/captura-json/formulario.html` — os dois produtores
  do formato que este validador confere (o segundo **declaradamente divergente**, conforme a entrada
  anterior).
- `.github/instructions/registro-md.instructions.md` e `.github/instructions/ciclo-fontes.instructions.md`
  — as sete seções da entrada, a ordem crescente, o motivo declarado, a nota de correção datada, as
  lacunas explícitas, os apelidos estáveis.
- Regras do projeto: **P-04** (o hash é sobre as **fontes** — o envelope cifrado do pacote é saída
  reconstruível e por isso não entra), **P-06** (descritivo, sem julgamento), **P-10** (o PO declara a
  linha de base), **P-12** (apelido estável), **P-17** (todo ciclo produz os mesmos tipos de artefato),
  **P-22** (ocorrências físicas **exigidas** pelo protocolo, e que o §4.6 mostra ainda sem campo).
- Medição de partida: `ARQUITETURA-AULA.md` §4.6 e as chaves reais dos três `-dados.json`, lidas
  **declarando o nível** (raiz × `aulas[NN]`).

**O que ainda não está feito.**

- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. O `CONGELAMENTO.md` exige **commit
  próprio** para `tools/` — o motivo está declarado nesta entrada; o commit fica para quem mescla.
- **`ultimo_lancamento` por aula continua sem produtor.** O validador o **exige quando existe**
  (formato de data) e **avisa quando falta** — nos três ciclos, avisa. A §4.1 decide que ele é
  **dentro** da aula; hoje só a raiz o carrega (herança do formulário antigo). Enquanto o produtor não
  mudar, o aviso é o registro honesto disso — **nenhum valor foi fabricado** para calar o aviso.
- **`dada_em` (`B6`) e a `linha_de_base` por aluna (`B13`) são tolerados, não implementados.** Passam
  pelo validador sem regra de tipo própria; quando os produtores existirem, é onde a regra entra.
- **As lacunas da §4.6 são declaradas, não fechadas.** Nove das dez continuam sem campo; a décima
  (`pergunta_emergente`) é do caderno e não deste validador. Em particular, **P-22** continua indo à
  mão no documento — o validador **diz isso** em vez de o esconder.
- **O validador não é chamado por `tools/check-pacote.js`.** Ele entra pelo `pre-commit`; a validação
  de pacote por aula é o **`B11`**, frente separada e arquivo de outra peça.
- **A âncora `.fipp` não precisou ser reancorada** por esta peça: `tools/` **não** entra na cobertura
  de `fontes_do_ciclo()` (`tools/lib-fontes.sh:137`), e a conferência `tools/hash-ciclo.sh tiago 01
  duo --check` continua **exit 0** (*"ciclo 01-duo íntegro; cadeia intacta"*).

## 26/09/2026 — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo` sai calculado do calendário (§3)

> **Nota de mesclagem (para quem mescla).** Esta entrada existe no arquivo de sessão
> `/home/mti/.copilot/session-state/f4d16739-cbc4-4204-a8c4-a98e7eb73fdd/files/registro-b7-impl-prazo.md`.
> **Acrescente-a no FIM do `REGISTRO.md`** — a ordem é cronológica crescente e
> `tools/gerar-handoff.sh` extrai a **última** entrada como "última entrada do REGISTRO";
> inserir no topo publicaria o marco errado no `HANDOFF.md`. Nada foi commitado.

**O que motivou.**

O `aulas[]` do `ciclos.json` existe desde o `B4` e traz, por aula, a chave `prazo`. Ela saía **NULA em
37 de 37 aulas** nos três ciclos (duo 12, ritmos 21, diaghilev 4) — medida declarando o nível:
raiz → `ciclos[0]` → `aulas[]`. O comentário do próprio gerador já dizia por quê: *"Só `ancora` (§5)
ainda não tem produtor e sai NULO: não se inventa valor sem fonte medida."* O `prazo` estava na mesma
situação, e a fonte medida **já existia e estava escrita** — o TSV de `calendario.py --aulas-arquivo`
(peça `B1`) — mas **sem consumidor**. A entrada anterior do `REGISTRO.md` declarou os dois débitos
literalmente:

- `:3315` — *"**O consumidor do `--aulas-arquivo` ainda não existe.** O TSV está escrito e o formato
  está fechado, mas quem o lê é o índice por aula (§4.2, peça 4) e o prazo (§3, peça 7) — nenhum dos
  dois implementado."*
- `:3319` — *"**As 48 h continuam valendo no `lancamento.html`.** O `HORAS_DO_PRAZO = 48` **não** foi
  trocado pela fórmula do §3: trocá-lo é a peça 7."*

A peça 7 da ordem do §10 é **esta**. Do lado do formulário, o prazo continuava sendo a regra antiga —
**48 h contadas da última gravação daquela aula** (`ARQUITETURA-CAPTURA.md` §5.1), que **reinicia a cada
escrita**. Não é isso que o §3.1 pede: o §3.1 pede um prazo **fixo por aula**, derivado do calendário.

E havia um erro de leitura a desfazer. A entrada anterior (`b7-prazo`) corrigiu a **redação** da §3.1 de
`menor` para `maior`; a medição de apoio (`files/B7-medicao-prazo.md`, 142 linhas) prova que a correção
está certa e que a leitura antiga não sobrevive à aritmética:

> *"`min` devolveria 18 h em 100% dos intervalos."* — §2 do `B7-medicao-prazo.md`

Sob `min`, **todas** as cinco linhas da tabela de aceitação da §3.2 ficam falsas de uma vez, porque o
piso de 18 h (tempo hábil) venceria sempre. Sob `maior`, os cinco números saem **literais**: 143 / 23 /
95 / 57 / 60 h. A medição foi refeita nesta peça, contra o código que de fato roda, e reproduziu os
cinco — a tabela está no `**Com o quê.**`.

**O que foi decidido.**

- **A fórmula é `maior` — a §3.1 é a autoridade.** `prazo = max(24h antes da próxima DATA, fim do bloco
  + 18h)`. O piso de 18 h **não pode** ser deletado: ele nunca dispara nos três ciclos reais (a menor
  janela praticada é 23,0 h), mas é ele que garante tempo hábil quando a janela real encolher. `min`
  colapsaria tudo no piso e está **rejeitado**.
- **"Bloco" é a ÚLTIMA aula daquela DATA, não a aula.** Aula dupla lança-se **uma vez só**: as duas
  aulas da mesma data recebem o **mesmo** `prazo`, contado do fim do bloco (Ritmos, sábado 08:00 + 09:00
  → bloco termina 10:00).
- **"Próxima" é a próxima DATA, não a próxima aula.** É esta decisão que satisfaz a §3.3: *"Os prazos são
  independentes. … pular a 02 não desloca o prazo da 03."* Como a referência é a data (e não a aula
  seguinte), tirar a 02 do TSV deixa a 03 exatamente onde estava.
- **A última aula do ciclo herda a MAIOR JANELA já praticada nele** (§3.3, medido *sobre a janela* —
  não sobre o instante do prazo, que é o defeito que a §3.3 descreve com o exemplo do Duo). O Duo tem
  um só relógio e por isso a última aula coincide com o máximo; o Diaghilev **alterna** 23 / 95 h e a
  última (n=04) cai numa janela de 95,0 h, que é o máximo praticado.
- **Ciclo de uma única data não pratica janela nenhuma → vale o piso.** O ramo "sem próxima data" foi
  escrito com guarda (`max(janelas) if janelas else …`): sem ela, um ciclo de uma data só levantaria
  `ValueError: max() arg is an empty sequence`. Fica registrado porque o caso não existe nos três
  ciclos e foi encontrado por leitura, não por teste.
- **`FECHAMENTO` (§3.4) é TETO, não piso.** `FECHAMENTO="DD/MM/AAAA"` no `.conf` trunca para baixo tudo
  o que passar dele; **vazio = só os prazos por aula**. Data malformada **não** é ignorada em silêncio:
  o gerador **morre** com `erro: FECHAMENTO="…" não é DD/MM/AAAA.` **Nenhum dos três `.conf` o
  declara**, e **não foi inventado** — campo opcional sem fonte não se preenche.
- **No formulário, o `prazo` passa a ser DECLARADO, não contado.** Antes o formulário calculava
  `48 h da última gravação`; agora ele **lê** o `prazo` do índice (`f.meta.aulas[]`, que o
  `carregarCiclo` guarda como `meta: c`). A regra das 48 h **não foi apagada**: virou
  `HORAS_DE_RESSALVA = 48`, o fallback para quando o índice não traz o prazo (aula antiga, `ciclos.json`
  sem `aulas[]`). Trocar o `HORAS_DO_PRAZO` por outra constante fixa seria trocar o erro de lugar.
- **`prazoDaAula` foi renomeado para `carimboDaAula`.** Com a entrada do prazo declarado, o nome antigo
  passou a significar a coisa errada (ele devolve o *carimbo* da última escrita, não o prazo) — dois
  consumidores atualizados. **Nenhuma chave de `.conf` foi criada** e `ancora` continua `null`: esta
  peça dá produtor a **uma** chave, não a duas.

**Onde entrou.**

- `tools/gerar-ciclo.sh` — **congelado.** Quatro hunks meus. (a) `@@ -223,0 +225,11 @@` — o bloco de
  comentário da §4.2 foi **corrigido no lugar** onde ele dizia que o `prazo` não tinha produtor; agora
  ele declara o bloco (§3.2), o piso de 18 h (§3.1) e o teto opcional (§3.4), e diz que **só `ancora`**
  segue sem produtor. (b) `@@ -226,0 +239,2 @@` — `FECHAMENTO="${FECHAMENTO:-}"` entra no prefixo de
  ambiente do heredoc, ao lado de `DADOS_FONTE`. (c) `@@ -230,0 +245,142 @@` — as duas funções que fazem
  a conta: `ler_fechamento(br)` (aceita `''` → `None`; data inválida → `SystemExit`) e
  `calcular_prazos(aulas, fechamento)` (monta `fim_do_bloco`/`inicio_da_data` por data,
  `proxima` da data seguinte, o `max(antes, piso)`, a herança da maior janela na última data e o teto).
  (d) `@@ -234 +390,4 @@` — a chamada `prazos = calcular_prazos(aulas, fechamento)` antes do `indice`, e
  `'prazo': prazos.get(nn)` na entrada da aula. **A forma de `aulas[]` não mudou**: a chave `prazo` já
  existia e a ordem das chaves (`n`, `data`, `inicio`, `fim`, `marco`, `estado`, `lancada`, `config`,
  `ancora`, `prazo`) também. O laço de campos obrigatórios **não** foi tocado.
- `tools/templates/lancamento.html` — **congelado.** Treze hunks meus. Funções novas: `prazoDeclarado`
  (`:768`), `fimDoPrazo` (`:779`), `prazoAberto` (`:803`), `podeAjustar` (`:854`), mais `semZona` e
  `dataHora` de apoio, e a constante `HORAS_DE_RESSALVA = 48` (`:765`) no lugar de `HORAS_DO_PRAZO`.
  `prazoDaAula` → `carimboDaAula` (`:851`, consumidores em `:1413` e `:1415`; `podeAjustar` em
  `:1409`). O tooltip do campo (`:116-120`) passa a mostrar a data e a hora do prazo em vez do texto
  fixo das 48 h. Comentários de cabeçalho das funções explicam a mudança de dono do prazo.
- `professores/<professor>/ciclos/ciclo-01-<escola>/` — os **três** pacotes **regerados**
  (`tiago 01 duo`, `tiago 01 ritmos`, `fochini 01 diaghilev`). **Nenhuma saída gerada foi editada à
  mão** — nem o `lancamento.html` do pacote, que é cópia (`cp "$TPL/lancamento.html" …`, `:465`), nem
  o `ciclos.json`.
- `professores/<professor>/ciclos/ciclo-01-<escola>.fipp` — os **três** reancorados e conferidos.
  **Os hashes não mudaram**, e isso é o esperado: o `FECHAMENTO` não foi escrito em `.conf` nenhum e
  nenhuma fonte de ciclo foi tocada, então `fontes_do_ciclo()` devolve o mesmo conjunto. `tools/` e
  `tools/templates/` **não** entram na cobertura do hash (`tools/lib-fontes.sh:137`).
- **Inventário dos hunks** (para não confundir o meu trabalho com o das outras frentes do worktree):
  `git diff --numstat` → `221 10 tools/gerar-ciclo.sh`, `158 76 tools/templates/lancamento.html`;
  contagem de linhas **967 → 1044** e **1633 → 1651**. `git diff -U0 | grep '^@@'` dá **12** hunks no
  gerador e **32** no formulário — mas **só 4 e 13** são meus. Os outros são das frentes que **já
  estavam no worktree**: a identidade/paleta (`@@ -9,8 +9,19 @@`, que tira o `:root` e aponta para
  `assets/style.css`), o `nav.js` (`@@ -158,0 +179,5 @@`), a config de captura e o `--aulas-arquivo`
  do `B1`, e o `b3a`/`b4`. A classificação foi feita **por conteúdo do hunk**, não pela posição do
  cabeçalho: como esta peça **insere** linhas, todo cabeçalho posterior desliza e um diff contra o
  conjunto de hunks do baseline **superconta** os meus. Fica o aviso para quem for repetir a medida.

**Motivo declarado — os congelados.**

Dois itens congelados são tocados, e cada um tem o seu motivo — `CONGELAMENTO.md:10–46` trata `tools/` e
`tools/templates/` como **dois** itens autônomos, não como um.

- **`tools/` → `tools/gerar-ciclo.sh`.** Motivo: o `prazo` de `aulas[]` estava nulo em **37/37** e o
  TSV de `--aulas-arquivo` (peça `B1`) estava **sem consumidor** — a §3.1 não tinha produtor. O gerador
  é o único lugar onde a conta pode ser feita a partir do calendário real, porque é ele que tem o TSV
  em mãos. Colocar a conta no formulário exigiria que o navegador soubesse o cronograma completo, e ele
  só vê a aula aberta.
- **`tools/templates/` → `tools/templates/lancamento.html`.** Motivo: manter o `HORAS_DO_PRAZO = 48`
  depois de o índice passar a carregar `prazo` faria o formulário **divergir** do JSON — duas
  respostas para a mesma pergunta, e a do formulário reiniciava a cada gravação. Era o débito
  declarado em `REGISTRO.md:3319` e em `:3749`.
- **Quem autorizou:** a **pesquisadora**, em **23/09/2026**, verbatim de `ARQUITETURA-AULA.md:367`:
  *"vai ter que descongelar — a gente vai ajustar o que tiver que ajustar; afinal de contas, a gente tá
  num protótipo"*. O `ARQUITETURA-AULA.md` §8 nomeia as duas peças na ordem do §10.
- **O que NÃO muda.** A **fórmula do hash** e a **cobertura** de `fontes_do_ciclo()`
  (`tools/lib-fontes.sh:137`) ficam intactas — por isso os três `.fipp` seguem íntegros com o **mesmo**
  hash. Os **validadores** (`validar-po-ciclo.js`, `validar-plano-ciclo.js`, `validar-schema-ciclo.js`,
  `validar-captura-ciclo.js`) e o `check-pacote.js` não foram tocados. **Nenhuma regra e nenhuma pétrea
  foi alterada**; a redação da §3.1 já estava corrigida pela entrada anterior e **não** foi reeditada.
  O `ARQUITETURA-AULA.md`, o `PROTOCOLO.md`, o `REGRAS.md`, o `METODO.md`, `prompts/` e
  `po_ref/` **não** foram tocados.
- O **commit próprio** de cada item segue **devido** e **não** foi feito nesta peça.

**Com o quê.**

Medições e verificações, todas executadas nesta peça. O nível do JSON é **declarado** em cada leitura
(raiz → `ciclos[0]` → `aulas[]`) porque comparar níveis diferentes fabrica regressão falsa.

| Verificação | Comando | Resultado real |
| --- | --- | --- |
| Sintaxe do gerador | `bash -n tools/gerar-ciclo.sh` | `SINTAXE OK` |
| Sintaxe do JS do formulário | `sed -n '185,1645p' tools/templates/lancamento.html > inline.js && node --check inline.js` | `JS SINTAXE OK` (node v24.12.0) |
| Sintaxe do `calendario.py` | `python3 -B -m py_compile tools/calendario.py` | OK (`tools/__pycache__/` removido depois) |
| Geração ×3 | `tools/gerar-ciclo.sh <prof> 01 <escola>` | exit 0 nos três |
| Pacote ×3 | `node tools/check-pacote.js professores/<prof>/ciclos/ciclo-01-<escola>` | duo/ritmos `OK: 0 erro(s), 6 aviso(s)`; diaghilev `OK: 0 erro(s), 0 aviso(s)` |
| Âncora ×3 | `tools/hash-ciclo.sh <prof> 01 <escola> --check` | `íntegro; cadeia intacta` nos três |
| Schema do `.conf` | idem, dentro do `hash-ciclo.sh` | `satisfaz ciclo-01-schema.json (11 campos obrigatórios)` nos três |

`prazo` por aula, **antes × depois** (o "antes" foi medido antes de qualquer edição):

| Escola | aulas | `prazo` nulo ANTES | `prazo` nulo DEPOIS |
| --- | --- | --- | --- |
| duo | 12 | 12 | **0** |
| ritmos | 21 | 21 | **0** |
| diaghilev | 4 | 4 | **0** |

A tabela de aceitação da **§3.2**, refeita contra o código que roda — as **cinco** linhas saem
literais (a janela é medida do **fim do bloco** até o `prazo`):

| Escola | Regra de calendário | Janela praticada | §3.2 |
| --- | --- | --- | --- |
| Duo | sextas, 1×/semana | **143,0 h** (×12) | 143 h ✅ |
| Diaghilev | terça → quinta | **23,0 h** | 23 h ✅ |
| Diaghilev | quinta → terça | **95,0 h** | 95 h ✅ |
| Ritmos | sábado, 2 aulas na mesma data | **57,0 h** | 57 h ✅ |
| Ritmos | terça → sábado | **60,0 h** | 60 h ✅ |

Os `prazo` reais, por aula (`ciclos.json`, nível `aulas[]`):

- **Duo** (12 aulas, todas `143,0 h`): `01 → 2026-09-24T18:30` … `12 → 2026-12-10T18:30` (sextas
  18:30–19:30; 24 h antes da sexta seguinte = quinta 18:30; piso = 19:30 + 18 h = 13:30 do sábado → o
  `max` é a quinta).
- **Ritmos** (21 aulas, 14 datas): `01` e `02` — a **mesma** data 2026-09-19, 08:00–09:00 e
  09:00–10:00 — saem **com o mesmo `prazo`**, `2026-09-21T19:00` (57,0 h e 58,0 h, contadas do **bloco**
  que termina 10:00 e da aula que termina 09:00); `03 → 2026-09-25T08:00` (60,0 h); … ; a última,
  `21 → 2026-11-06T08:00`.
- **Diaghilev** (4 aulas): `01 → 2026-10-07T19:00` (23,0 h), `02 → 2026-10-12T19:00` (95,0 h),
  `03 → 2026-10-14T19:00` (23,0 h), `04 → 2026-10-19T19:00` (95,0 h).

Os quatro casos-limite da **§3.3** e o teto da **§3.4**, provados contra o **código extraído do próprio
gerador** (não uma reimplementação):

- **(i) A aula pulada não tem prazo.** Com as 4 aulas do Diaghilev: `com` → `['01','02','03','04']`;
  removendo a 02 do TSV: `sem` → `['01','03','04']`. A 02 **some**, não sai nula nem com valor herdado.
- **(ii) A última aula do ciclo tem o MAIOR prazo já praticado nele.** Janelas do Diaghilev:
  `{'01': 23,0, '02': 95,0, '03': 23,0, '04': 95,0}` — a última (n=04) é `95,0 h`, que é o `max`.
- **(iii) Pular a aula 02 não desloca o prazo da 03.** `com['03'] == sem['03'] == 2026-10-14T19:00` →
  **IGUAL**. É a prova de que a referência é a próxima **DATA**.
- **(iv) Datas com mais de uma aula não dão prazo negativo.** Bloco 2026-09-19 08:00+09:00 (termina
  10:00) e próxima data 2026-09-22 19:00: as duas aulas da data saem com janela **+57,0 h** e a 03 com
  **+139,0 h** — todas positivas. Para contraste, a regra **ingênua** ("24 h antes da próxima **aula**,
  fim = fim da **própria** aula") dá **−24,0 h** na primeira aula do bloco, porque a próxima aula é 1 h
  depois e o "24 h antes" cai no dia anterior. É exatamente o defeito que o piso + o bloco fecham.
- **(§3.4) `FECHAMENTO`.** Vazio → os 4 prazos naturais. `12/10/2026` → teto: `01` fica em
  `2026-10-07T19:00`, e `02`, `03` e `04` caem todas em `2026-10-12T00:00`. `32/13/2026` →
  `SystemExit: erro: FECHAMENTO="32/13/2026" não é DD/MM/AAAA.` (data inválida **não** passa calada).

Estado do worktree depois: untracked real (`git ls-files --others --exclude-standard`) = **51**
(28 não-scratch; o baseline era 27), `git diff --name-only` = **106** modificados — imensa maioria de
**outras** frentes. **Nada commitado.**

**Referências.**

- `ARQUITETURA-AULA.md` — **§3** inteira: **§3.1** (`:84-100`, a fórmula com `maior`), **§3.2**
  (`:102-124`, a tabela de aceitação 143/23/95/57/60), **§3.3** (`:126-148`, as regras de fecho e
  *"pular a 02 não desloca o prazo da 03"*), **§3.4** (`:149-160`, o `FECHAMENTO` opcional); **§4.2**
  (o índice por aula e a chave `prazo`); **§5** (a `ancora`, que segue sem produtor); **§8/§10** (a
  ordem das peças — esta é a peça 7); **`:367`** (a autorização do descongelamento, verbatim).
- **Medição de apoio:** `files/B7-medicao-prazo.md` (sessão) — os cinco números da §3.2 refeitos
  **contando do fim do bloco**, a prova de que *"`min` devolveria 18 h em 100% dos intervalos"*, e a
  §4 sobre por que o piso de 18 h **não pode** ser removido mesmo sem disparar hoje.
- `CONGELAMENTO.md:10–46` — `tools/` e `tools/templates/` como **dois** itens congelados autônomos e o
  rito do motivo declarado + entrada no `REGISTRO.md` + commit próprio.
- `tools/lib-fontes.sh` — a precedência do sufixo da escola (a fonte própria da variante vence a
  compartilhada) e **`:137`**, que mostra que `tools/` **não** entra na cobertura do hash.
- `tools/calendario.py --aulas-arquivo` (`:196-214`) — o TSV `NN \t data \t início \t fim`, com `fim`
  **já incluindo** a duração. É a fonte de todos os números desta entrada; **não** foi tocado.
- `ARQUITETURA-CAPTURA.md:313` **§5.1** — a regra antiga das **48 horas** contadas da última gravação,
  que é o que o formulário fazia e que esta peça substitui pelo `prazo` declarado.
- `experimentos/captura-json/formulario.html` (+ `teste.js`) — o outro consumidor da regra das 48 h.
  **Demonstrativo**, fora de pacotes, hashes e publicação: **deixado como estava**, de propósito.
- `PROTOCOLO.md` **P-03/P-04** — a proveniência acrescenta, não edita. É por isso que a redação
  histórica da §3.1 (`menor`) **não** foi apagada: a correção da entrada anterior é o elo, e a §3.1
  implementada aqui é a redação corrigida. **P-06** — descritivo, sem julgamento. **P-17** — todo ciclo
  produz os mesmos tipos de artefato.
- `tools/gerar-ciclo.sh:225-235` — o comentário do próprio artefato, que já declarava o `prazo` sem
  produtor e que foi **corrigido no lugar** (hunk `@@ -223,0 +225,11 @@`).
- `.github/instructions/registro-md.instructions.md` e `.github/instructions/ciclo-fontes.instructions.md`
  — as sete seções da entrada, a ordem crescente, o motivo declarado, a nota de correção datada, as
  lacunas explícitas.

**O que ainda não está feito.**

- **NADA FOI COMMITADO.** O trabalho está inteiro no worktree. O `CONGELAMENTO.md` exige **commit
  próprio** para `tools/` **e** para `tools/templates/` — **dois** commits, ou um para cada item, e
  **separados** do trabalho das outras frentes que hoje dividem o worktree. Os motivos estão declarados
  nesta entrada; os commits ficam para quem mescla.
- **Dois débitos do `REGISTRO.md` ficam resolvidos por esta peça** — e ficam registrados aqui para não
  serem relidos como verdade: `:3315` (*"O consumidor do `--aulas-arquivo` ainda não existe"*) —
  **agora existe**, é o `aulas[]` do `B4` mais o `prazo` desta peça, e o prazo tem teste de ponta a
  ponta contra o `ciclos.json` de verdade; `:3319` e `:3749` (*"As 48 h continuam valendo no
  `lancamento.html`"* / *"O `HORAS_DO_PRAZO = 48` … continua como estava"*) — **o 48 fixo saiu**; o
  prazo passou a ser lido do índice e as 48 h sobrevivem só como `HORAS_DE_RESSALVA`, o fallback.
  As redações antigas **não** foram apagadas (P-03/P-04): esta é a nota datada de que envelheceram.
- **O `FECHAMENTO` (§3.4) segue não declarado em `.conf` nenhum.** O código **honra** o campo (teto,
  validado, com data inválida recusada), mas **nenhum dos três ciclos o usa** — e **não foi inventado**,
  porque inventar data é proibido. Quem o elicia é `prompts/eliciar-ciclo.md` (campo *"data de
  fechamento"*), que é **congelado de `prompts/`** e **não foi tocado** aqui. Enquanto ele não
  perguntar, o campo nasce vazio — que é o normal declarado na §3.4.
- **`ARQUITETURA-CAPTURA.md:313` ainda diz "48 horas".** O §5.1 descreve a regra antiga — renovada a
  cada gravação — e agora ela é só ressalva. **Não foi corrigido aqui**: é documento de outro escopo
  (captura, não aula) e a redação precisa da mesma passada de coerência que a §3.1 teve. Fica o aviso
  para a próxima sessão não o tomar por verdade.
  > **Nota datada — 27/09/2026. Este aviso foi cumprido; a pendência está FECHADA.** O §5.1 foi
  > corrigido na entrada *"A §5.1 para de dizer 48 h"* (mesmo dia, no fim deste arquivo): ele agora
  > dá a fórmula da §3.1, as medições das janelas e a ressalva das 48 h **nomeada como ressalva**. As
  > duas redações antigas — as 48 h renovadas e a Nota do `ultimo_lancamento` — **não** foram
  > apagadas (P-03/P-04): viraram notas datadas. A linha citada (`:313`) **não vale mais**: o arquivo
  > cresceu, e o bloco hoje está em `§5.1`. **O que continua aberto é só outra coisa:** o motivo
  > obrigatório do formulário, que a `§5.1` passou a declarar como **divergência** (a resolver no
  > `B8` ou na revisão do formulário). A frase do aviso **não** foi reescrita: fica como o elo que
  > registra o que se pensou antes da correção.
- **`experimentos/captura-json/formulario.html` continua com a regra das 48 h.** É demonstrativo e
  está fora de pacotes, hashes e publicação; alinhá-lo ao `prazo` declarado é decisão de outra peça.
- **`lancamento.html` mudou de comportamento, não só de redação.** O prazo era **dinâmico** (reabria a
  cada gravação) e passou a ser **fixo por aula**, lido do índice. É a consequência direta da §3.1, mas
  é mudança de comportamento visível para quem lança — e está aqui declarada como tal.
- **`ancora` por aula (§5) continua SEM produtor** e sai `null` nos três ciclos. Esta peça deu produtor
  a **uma** chave (`prazo`), não a duas — e o comentário do gerador agora diz isso com precisão.
- **O `launch.json` do pacote não traz `intervalo_dias`**, então `dataPlanejada()` no formulário segue
  **caminho morto** — outro item do §10, fora desta peça.
- **As demais peças do §10 seguem intocadas:** a âncora por aula, a declaração "aula dada", o ajuste no
  plano, o painel por escola e a eliciação. A contabilidade do §10 está correta; o trabalho que ela
  conta **não** começou.

---

## 26/09/2026 — A âncora deixa de existir só por ciclo: um `.fipp` por aula (§5.2)

> **Nota de mesclagem (para quem mescla).** Esta entrada foi preparada e medida na sessão de
> 26/09/2026; os números vêm de execução real, não de previsão. **Nada foi commitado.**

**O que motivou.**

O `.fipp` de hoje guarda `id type professor ciclo variante hash_conteudo parentHash hash
algoritmo po po_state cobertura` — e mais nada (§5.1 do `ARQUITETURA-AULA.md`). Duas
consequências disso estão declaradas lá, com estas palavras: o arquivo **"não guarda data"**, e
o hash **"não diz qual aula mudou — é um número só para o ciclo inteiro"**.

Sem data, o projeto não distingue **plano mudado antes** da aula — CRUD legítimo, o professor
ainda está decidindo — de **plano mudado depois** — que já não é CRUD, é **ajuste**, e ajuste é
elo novo, não sobrescrita. Sem âncora por aula, uma mudança na aula 03 move o hash do ciclo
inteiro, e o rastro do que mudou se perde no número único.

**O que foi decidido.**

Um `.fipp` por aula, ao lado do `.fipp` do ciclo, com:

- `id` = `ciclo-XX-<escola>-aula-NN` e `type: Aula` (o `type` já existia para ciclo; agora
  distingue as duas espécies de âncora);
- `parentHash` **vazio, por desenho** — a âncora de uma aula **não** encadeia com a da anterior
  nem com a do ciclo. É o que faz *"apagar a aula 02"* ser um **fato registrado** (a âncora da
  aula 02 não tem par) e não uma diferença de hash a decifrar;
- `ancorado_em: AAAA-MM-DD` como **campo informativo, FORA da fórmula** — mesmo precedente do
  `po_state`. Obrigatório que seja fora: o `--check` **recalcula o hash sobre as fontes vivas**;
  se a data entrasse na fórmula, o `--check` passaria a falhar **no dia seguinte** à ancoragem e
  o arquivo nunca mais fecharia;
- a peça é **ADITIVA**: a âncora de aula que ainda não existe é **`aviso:`**, não `erro:` — quem
  ancorou sobre o passado não é obrigado a já ter a peça nova. A que existe tem de bater com as
  fontes de hoje.

**Onde entrou.**

- `tools/hash-ciclo.sh` — **congelado.** **13 hunks meus**, por ordem de posição no arquivo:

  | # | Hunk | O que faz |
  |:--|:--|:--|
  | 1 | `@@ -29,0 +30,6 @@` | cabeçalho: a fórmula declarada em prosa |
  | 2 | `@@ -39,0 +46,8 @@` | cabeçalho: a peça é aditiva; o `--check` recalcula sobre fontes vivas |
  | 3 | `@@ -52,0 +67,5 @@` | `PROFESSOR_DIR="$PROFESSOR"` + comentário do porquê (ver a lacuna (vi)) |
  | 4 | `@@ -82,0 +102,5 @@` | comentário da data + `ANCORADO_EM="$(date +%F)"` + `TIPO_AULA="Aula"` |
  | 5 | `@@ -181 +205 @@` | `$PROFESSOR` → `$PROFESSOR_DIR` (dica de comando — ver (vi)) |
  | 6 | `@@ -187,0 +212,50 @@` | seção 5b (`AULAS`, `fontes_da_aula()`) + seção 5c (`fontes_da_aula_filtradas()`, o laço por aula, `AULA_HASH`) |
  | 7 | `@@ -191 +265 @@` | `$PROFESSOR` → `$PROFESSOR_DIR` (dica) |
  | 8 | `@@ -204 +278 @@` | `$PROFESSOR` → `$PROFESSOR_DIR` (dica) |
  | 9 | `@@ -233,0 +308,45 @@` | checagem (d) — âncoras de aula existentes têm de bater — + o laço das órfãs |
  | 10 | `@@ -257,0 +377 @@` | `ancorado_em:` na âncora **do ciclo** |
  | 11 | `@@ -261,0 +382,27 @@` | seção 7b — gravação dos campos da âncora **da aula** |
  | 12 | `@@ -266,0 +414 @@` | eco do ciclo estendido |
  | 13 | `@@ -269,0 +418,8 @@` | eco das aulas |

  As **9 âncoras** versionadas no worktree (3 de ciclo ` M` + 6 de aula `??`):
  `fochini/ciclos/ciclo-01-diaghilev{,-aula-01..04}.fipp` e
  `tiago/ciclos/ciclo-01-{duo,ritmos}{,-aula-01}.fipp`.

- Nenhum outro arquivo. A fórmula do ciclo, a cobertura, os validadores, o `pre-commit` e o
  `gerar-ciclo.sh` **não foram tocados por esta peça**.

**Motivo declarado — os congelados.**

- `tools/hash-ciclo.sh` — **congelado.** `CONGELAMENTO.md` congela `tools/` **em bloco**
  ("geradores, validadores, hooks, criptografia") e exige motivo declarado para **"alterar a
  lógica de hash, validação ou geração"**. É exatamente o caso.
- Adicionalmente, é **o item nomeado no roteiro**: o §8 do `ARQUITETURA-AULA.md` traz, na tabela
  de descongelamento, a linha `` | `tools/hash-ciclo.sh` | a âncora por aula e a data na âncora | ``
  — ou seja, esta peça **não** é trabalho fora de roteiro.
- **Quem autorizou:** a pesquisadora (23/09/2026), verbatim: *"vai ter que descongelar — a gente
  vai ajustar o que tiver que ajustar; afinal de contas, a gente tá num protótipo"*. Cada item
  exige, ainda assim, o seu motivo declarado e o seu commit.
- **O que NÃO muda.** A fórmula do **ciclo** continua `SHA256(ID:TIPO:PARENT_HASH:HASH_CONTEUDO)`
  — quatro insumos, inalterada; todo campo novo fica **depois** do `hash:` e **fora** do cálculo.
  A cobertura continua sendo `FONTES`, filtrada por `professores/<professor>/*` (nada de `tools/`
  entra). Os validadores, as regras e as pétreas: intocados. O `--check` mantém o contrato de
  tolerância — o que não existe é `aviso:`, não `erro:`.
- O **commit próprio** desta peça segue **devido** e **não** foi feito nesta peça.

**Com o quê.**

| Verificação | Comando | Resultado real |
|:--|:--|:--|
| Tamanho | `wc -l tools/hash-ciclo.sh` | **426** (HEAD: **270**) |
| Diff | `git diff --numstat -- tools/hash-ciclo.sh` | **`159 3`** |
| Hunks | `git diff -U0 \| grep -c '^@@'` | **13** = 10 aditivos + 3 de substituição |
| Aritmética do diff | — | aditivos `6+8+5+5+50+45+1+27+1+8 = 156`; as 3 substituições puras dão `+3/−3`; total **`159 3`** |
| Sintaxe | `bash -n tools/hash-ciclo.sh` | OK |
| Cadeia — duo | `tools/hash-ciclo.sh tiago 01 duo --check` | `exit 0` · `ok: ciclo-01.conf + ciclo-01-duo.conf satisfaz ciclo-01-schema.json (11 campos obrigatórios)` · `ok: ciclo 01-duo íntegro; cadeia intacta` · **0 aviso, 0 erro** |
| Cadeia — ritmos | `tools/hash-ciclo.sh tiago 01 ritmos --check` | `exit 0` · idem · **0 aviso, 0 erro** |
| Cadeia — diaghilev | `tools/hash-ciclo.sh fochini 01 diaghilev --check` | `exit 0` · idem · **0 aviso, 0 erro** |
| Materialização | `tools/hash-ciclo.sh <prof> 01 <escola>` (3×) | `exit 0`; criadas as **6** âncoras de aula |
| Pacote — diaghilev | `node tools/check-pacote.js professores/fochini/ciclos/ciclo-01-diaghilev` | `exit 0` · **0 erro / 0 aviso** |
| Pacote — duo | `node tools/check-pacote.js professores/tiago/ciclos/ciclo-01-duo` | `exit 0` · **0 erro / 6 aviso** (pré-existentes) |
| Pacote — ritmos | `node tools/check-pacote.js professores/tiago/ciclos/ciclo-01-ritmos` | `exit 0` · **0 erro / 6 aviso** (pré-existentes) |

O **hash do ciclo NÃO mudou** com a peça — prova de que a data ficou fora da fórmula:

| Escola | `hash` do ciclo (12) | antes | veredito |
|:--|:--|:--|:--|
| diaghilev | `78daf7e4cb23…` | `78daf7e4cb23…` | **idêntico** |
| duo | `52f437f26c02…` | `52f437f26c02…` | **idêntico** |
| ritmos | `899ccd321922…` | `899ccd321922…` | **idêntico** |

As **6** âncoras de aula criadas, com a cobertura **real** — que **não é uniforme**, e a razão é
a existência do arquivo, não um defeito:

| Âncora | `hash` (12) | fontes | onde |
|:--|:--|--:|:--|
| `ciclo-01-diaghilev-aula-01..04.fipp` | `cff9dee11637` · `51bc98854f14` · `0395634f3638` · `c7dc935b9538` | **2** cada | só `aula-NN.md` + `captura-aula-NN.md` (o fochini tem `relatorios/ciclo-01/` **vazia**) |
| `ciclo-01-duo-aula-01.fipp` | `7dbb125c6ea7` | **3** | o `.md`, a captura **e** `relatorios/ciclo-01/aula-01-duo.md` |
| `ciclo-01-ritmos-aula-01.fipp` | `56533949d50f` | **3** | idem, com `aula-01-ritmos.md` |

Conferências de forma: `grep -c '^ancorado_em: 2026-09-26'` = **1 em cada uma das 9** âncoras ·
`type=Aula` e `parentHash` vazio em **6/6** âncoras de aula.

**Referências.**

- `ARQUITETURA-AULA.md` §5.1/§5.2 (o estado do `.fipp` e os três ganhos), §8 (o roteiro de
  descongelamento, com a linha do `hash-ciclo.sh`) e a autorização de 23/09/2026.
- `CONGELAMENTO.md` (o congelamento em bloco de `tools/`; o motivo declarado como corpo do
  commit + entrada no registro + commit próprio).
- `REGISTRO.md` — as entradas do `B4` (o índice por aula) e do `B7` (o prazo), que esta peça
  sucede na ordem do §10.

**O que ainda não está feito.**

- **A metade do gerador.** O campo `ancora` do índice continua gravado como `None`
  (`gerar-ciclo.sh:383`); **ninguém aponta** do `ciclos.json` para o `-aula-NN.fipp`. A âncora
  existe no disco; o índice ainda não sabe dela.
- **O `pre-commit` não valida `-aula-NN.fipp`.** A linha `:63` do hook monta o caminho
  **literalmente** como `ciclo-$numero-$v.fipp` — logo as 6 âncoras de aula passam **fora** da
  checagem automática de commit. Hoje só `--check` manual as confere.
- **O `gerar-handoff.sh` não as lista.** A tabela de âncoras (`:152-163`) tem 5 colunas fixas
  (`Variante | .fipp | hash | parentHash | po_state`): um campo novo **não a quebra**, mas o
  `ancorado_em` **não aparece** ali e as âncoras de aula **não são relacionadas**.
- **A tolerância e as órfãs ficam como contrato declarado, sem teste.** A âncora de aula ausente
  é `aviso:` e a órfã também — mas não há caso de teste que force os dois caminhos.
- **O critério de inclusão do relatório na âncora da aula** é o que faz duo/ritmos terem **3**
  fontes e o diaghilev **2**. Está implementado e medido; **não** está justificado por escrito.
- **A correção do slug — defeito PRÉ-EXISTENTE, corrigido de passagem.** A variável `PROFESSOR`
  tem **dois papéis**: é o **slug do diretório** (de `$1`) e o **nome de exibição** (do `.conf`,
  via `source`) — e o `source` acontece **no meio** do script. As dicas de comando impressas nos
  `aviso:`/`erro:` usavam `$PROFESSOR`, que naquele ponto **já é o nome de exibição**; a
  instrução que o professor lia mandava rodar `tools/hash-ciclo.sh Fochini 01 diaghilev`, que
  **falha**. Provado pré-existente: `git show HEAD:tools/hash-ciclo.sh` traz as **3** linhas
  antigas (`HEAD:181`, `HEAD:191`, `HEAD:204`) com `$PROFESSOR`. Corrigido com `PROFESSOR_DIR`
  (linha `:70`, antes do `BASE` e dos `source`) e as **5** dicas — **3 das 5 eram o defeito
  antigo**, e são elas as **3 deleções** do `159 3`. **Não tocado de propósito:** o
  `echo "professor: $PROFESSOR"` **dentro** dos `.fipp`, que grava o nome de exibição
  **intencionalmente**.
- **Nota datada — redação que envelheceu.** Os últimos bullets da entrada do `B7`
  (`b7-impl-prazo`) afirmam que *"`ancora` por aula (§5) continua SEM produtor"* e listam *"a
  âncora por aula"* entre as peças do §10 **intocadas**. A segunda frase **deixou de valer em
  26/09/2026**: a âncora por aula agora existe, materializada, com `--check` verde nos 3 ciclos.
  A primeira **continua valendo para o índice** — o `ancora` do `ciclos.json` segue `None`. A
  redação antiga **não** foi apagada (P-03/P-04); esta nota é o elo novo.

**Nada commitado.**

## 26/09/2026 — O config da captura por aula passa a ser conferido pelo `check-pacote.js`

**O que motivou.**

O config da captura deixou de ser **um por ciclo** e passou a ser **um por aula** (`ARQUITETURA-AULA.md`
§4.1, "Defeito 1"; o índice `aulas[]` do `ciclos.json`, §4.2, carrega o campo `config`). O
`check-pacote.js`, que é o **último passo** de toda geração, **não sabia disso** — medido, não
suposto: `grep -n 'captura' tools/check-pacote.js` devolvia **zero** ocorrências antes desta
entrada. Consequência prática: **nada** conferia o vínculo aula → config. Uma geração que
**perdesse** o `captura-aula-NN.json` de uma aula sairia **verde** e o defeito só apareceria na
mão, no formulário de lançamento em campo.

Não é conserto de código quebrado: o `check-pacote.js` **não conhecia** a matéria. Foi
**construção** de uma checagem nova, num arquivo **congelado** (`CONGELAMENTO.md`).

**O que foi decidido.**

- A conferência é feita **nos dois sentidos**, e o critério **não** é "todo `config` declarado tem
  arquivo" — é a **folha de captura na FONTE**, a mesma resolução que o produtor usa (`fonte_md`
  de `tools/lib-fontes.sh`: a da variante vence a compartilhada).
- **Por que o critério não pode ser ingênuo — armadilha medida em 26/09/2026.** O produtor
  (`gerar-ciclo.sh:382`) emite `'config': 'captura-aula-%s.json' % nn` de forma
  **incondicional**, para todo `nn` de `aulas[]`; mas o **arquivo** só é emitido quando a folha
  existe na fonte (`gerar-ciclo.sh:416-440`, guardado por `[ -f "$cap_src" ]`):

  | Escola | aulas com `config` declarado | `captura-aula-NN.json` no pacote |
  |:--|--:|--:|
  | tiago / duo | 12 | 1 (só o `-01`) |
  | tiago / ritmos | 21 | 1 (só o `-01`) |
  | fochini / diaghilev | 4 | 4 (`-01..-04`) |

  Uma regra ingênua ("exijo o arquivo de todo `config` declarado") **reprovaria duo e ritmos por
  desenho** — 11 e 20 erros artificiais — e quebraria os 3 pacotes hoje. O §4.2 do
  `ARQUITETURA-AULA.md`, no próprio exemplo, já **omite** `config` na aula que não tem folha.
- **Sentido estrito** (o que o §4.1 Defeito 1 quer garantir): aula com `config` declarado **E**
  folha existente na fonte ⇒ o arquivo do `config` **tem** de estar no pacote (e não pode estar
  vazio). Ausente/vazio ⇒ **erro**. É este sentido que pega a geração quebrada — a lacuna de hoje.
- **Sentido inverso (órfãos):** todo `captura-aula-NN.json` **presente no pacote** tem de ser
  declarado por **exatamente uma** aula de `aulas[]`. Presente e não declarado ⇒ **erro**;
  declarado por duas ⇒ **erro**.
- **Declarado sem folha ⇒ aviso, não erro.** Quando o `config` está declarado mas a folha **não
  existe na fonte**, o produtor promete um config que não tem fonte. **Não** é defeito do pacote —
  é **defeito do produtor**, e a correção é ele **parar de declarar** (§4.2 já mostra `config`
  omitido nesse caso). Sai como **aviso explícito**, e a correção do `gerar-ciclo.sh` é
  **follow-up**, fora da fronteira deste arquivo. **Este é o achado desta peça.**
- **O legado `captura-<id-do-ciclo>.json` é isolado por desenho:** é a cópia do config da aula 01
  que o `lancamento.html` publicado ainda lê (até o `B3b`). **Não** é órfão e **não** é exigido —
  a checagem o descarta explicitamente, antes de montar o mapa de declarações.
- **Formato antigo não falha:** se `aulas[]` **não existir** no `ciclos.json` (pacote de formato
  anterior), sai **aviso** e **não** há falha — mesma postura que o arquivo já adota quando o
  manifesto (`.conf`) não é achado ao lado do pacote.
- **A fronteira não muda:** o `check-pacote.js` **não** chama o validador de dados
  (`tools/validar-dados-ciclo.js`) — são fronteiras diferentes, já declaradas.
- **Estilo preservado:** empurra para os arrays `erros`/`avisos`/`ok` que o arquivo já tem; **não**
  troca exit code, **não** cria framework, **não** muda nada fora do bloco novo.
- **Números exatos, medidos com `git diff --numstat -- tools/check-pacote.js`** (plano é previsão;
  registro é fato): **83 inserções, 0 deleções**, em **dois** hunks — `@@ -22,0 +23,5 @@` (o item
  `8)` no cabeçalho de comentário, 5 linhas) e `@@ -423,0 +429,78 @@` (o bloco de checagem, 78
  linhas), inseridos **antes** do bloco de relatório.
- **A âncora de proveniência não muda — provado, não presumido.** `tools/check-pacote.js` **não é
  fonte** e `tools/hash-ciclo.sh` **não cobre `tools/`**: `--check` continua **exit 0** nos três
  ciclos (`tiago 01 duo`, `tiago 01 ritmos`, `fochini 01 diaghilev`). Nenhum `.fipp` foi tocado.

**Onde entrou.**

`tools/check-pacote.js` — único arquivo tocado. `git diff --numstat` (medido **antes** de escrever
esta entrada): **`83  0  tools/check-pacote.js`** — 83 inserções, 0 deleções.

- linhas `23-27` — item `8)` no cabeçalho de comentário do arquivo, declarando a checagem nova (os
  itens `1)`–`7)` ficam como estavam).
- linhas `429-506` — o bloco `8) o config da captura POR AULA (§4.1, Defeito 1)`, inserido entre o
  bloco do JSON de dados (`2b`) e o bloco `// ---- relatório`.

**Nada mais.** Não tocado: `tools/gerar-ciclo.sh` (outra frente o está escrevendo — ver "O que
ainda não está feito"), nenhum pacote, nenhuma saída gerada, nenhum `.fipp`.

**Motivo declarado — os congelados.**

`tools/check-pacote.js` está congelado por `CONGELAMENTO.md`, e a alteração é declarada aqui, no
corpo do commit e em commit **próprio** (a mudança não vai junto com conteúdo).

- **Por que.** Sem esta checagem, o **Defeito 1** do `ARQUITETURA-AULA.md` §4.1 fica sem rede: o
  config por aula existe no índice e ninguém o confere. O `check-pacote.js` é o **único** ponto que
  roda ao fim de toda geração (`tools/gerar-ciclo.sh`) — é onde a rede pode existir. A lacuna foi
  **medida** (zero ocorrências de `captura` no arquivo), não suposta.
- **O que NÃO muda.** A **fórmula de hash** e a **cobertura** da âncora (`check-pacote.js` não é
  fonte; `tools/` não entra no `.fipp`) — confirmado com `--check` verde nos 3 ciclos. **Não**
  mudam as regras e pétreas, **não** muda o exit code do script (1 se e somente se há `erros`),
  **não** muda a estrutura do relatório, **não** muda nenhuma das checagens `1)`–`7)`, **não** há
  chamada nova a outro validador (a fronteira com `tools/validar-dados-ciclo.js` fica como está).
- **Vale registrar o alerta do `registro-md.instructions.md`:** alteração que muda
  **comportamento** (não só redação) pede confirmação do usuário. Aqui **houve** mudança de
  comportamento — mas ela foi **explicitamente autorizada** no escopo desta peça
  (`b11-check-pacote-por-aula`), com contrato fechado nas quatro regras acima. Não foi
  contornamento do congelamento: é a construção pedida, com motivo declarado.

**Com o quê.**

- `tools/check-pacote.js` (**+83 / −0**, congelado) — o item `8)` no cabeçalho e o bloco de
  checagem do config por aula. Único arquivo alterado por esta peça.

**Referências.**

- `ARQUITETURA-AULA.md` **§4.1** (Defeito 1: o config por aula) e **§4.2** (o índice por aula,
  `aulas[]`, com `config` **omitido** no exemplo da aula sem folha).
- `tools/lib-fontes.sh` — `fonte_md`: a precedência da variante sobre a fonte compartilhada, que é
  o critério de "folha existe na fonte" replicado na checagem.
- `tools/gerar-ciclo.sh:382` (declaração **incondicional** do `config`) e `:416-440` (geração do
  arquivo só quando a folha existe) — a assimetria que define o desenho.
- `CONGELAMENTO.md` (o rito do arquivo congelado) e `.github/instructions/registro-md.instructions.md`
  (as sete seções).
- `.github/instructions/ciclo-fontes.instructions.md` (sufixo da escola, lacunas explícitas).
- Medição de campo: `git diff --numstat -- tools/check-pacote.js` e as três execuções do
  `check-pacote.js` sobre os pacotes como estão no disco.

**O que ainda não está feito.**

- **O produtor continua declarando `config` sem folha — achado desta peça, NÃO corrigido.** O
  `gerar-ciclo.sh:382` segue emitindo `'config': 'captura-aula-%s.json' % nn` **incondicionalmente**.
  Resultado medido: **duo** leva **11** avisos (`aulas 02..12`), **ritmos** leva **20**
  (`aulas 02..21`) — todos dizendo que o produtor promete um config que não tem folha na fonte. A
  correção é **condicionar a declaração à existência da folha** (§4.2 já omite `config` nesse
  caso). **Não foi feita aqui**: o `tools/gerar-ciclo.sh` está fora da fronteira de escrita desta
  peça — está sendo alterado **em paralelo** por outra frente (`b7-impl-prazo`) — e editá-lo
  causaria conflito. **Follow-up declarado.**
- **Os 3 pacotes NÃO foram regerados — por decisão.** Esta peça valida contra os pacotes **como
  estão no disco**. O `b7-impl-prazo` vai regerá-los; **é esperado**. Se o produtor passar a
  omitir o `config` sem folha, os avisos de duo/ritmos (11 e 20) **desaparecem** na próxima
  geração, sem que o `check-pacote.js` mude uma linha.
- **Não há teste automatizado da checagem nova.** A prova foi um **teste destrutivo controlado**,
  manual, feito fora do pacote real: com uma cópia do pacote da diaghilev, (a) removido o
  `captura-aula-02.json` (folha existe na fonte) ⇒ **FALHOU: 1 erro**; (b) criado um
  `captura-aula-99.json` órfão ⇒ **FALHOU: 1 erro**; (c) removido o `aulas[]` do índice ⇒
  **OK: 0 erro, 1 aviso** (formato antigo não falha); (d) declarado o mesmo config por 4 aulas ⇒
  **FALHOU: 6 erros** (duplicidade + os 3 órfãos decorrentes). O diretório de teste foi **removido**
  ao fim. **Nenhum caso de teste ficou no repositório** — a cobertura do caminho de erro é manual.
- **A procedência do teste destrutivo foi adaptada.** O escopo pedia a cópia "para `/tmp`"; a
  política de segurança desta sessão **proíbe** escrita em `/tmp`, `/var/tmp` e `mktemp`. A cópia
  foi feita em `.b11-tmp/` **dentro do repositório** (para que o `dirFontes` — o diretório das
  fontes, irmão do pacote — continuasse resolvendo o `.conf` e as folhas), e o diretório foi
  **removido ao fim**. `git status --porcelain` não tem vestígio dele. O **intento** do escopo
  (verificar que a checagem pega) foi cumprido; só o **caminho** do diretório temporário mudou.
- **A checagem só confere vínculo, não conteúdo.** Ela olha **existência** e **não-vazio** do
  arquivo do config, e o **alinhamento** com `aulas[]`. A validade do **conteúdo** do config por
  aula (schema, campos, coerência com o PO) é da fronteira do `tools/validar-dados-ciclo.js` —
  **não** desta.
- **`config` apontando para fora do pacote** (caminho absoluto ou com `..`) não é conferido; o
  `path.join` aceita e resolve. Não há caso desses nos 3 pacotes hoje.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O
  `REGISTRO.md` **não** foi tocado por esta peça: esta entrada é o artefato de sessão que o agente
  principal mescla, preservando a ordem cronológica do arquivo.

---

## 26/09/2026 — Os apelidos saem em claro: um ciclo sem lançamento passa a listar as alunas

**O que motivou.**

O `-dados.json` publicado é **um envelope cifrado** — e a cifra é do arquivo **inteiro**, de
propósito, para o formulário não pedir a senha à toa. Medido, não suposto: `cifrar-dados.js`
expunha só `lancamentos` (o booleano que diz *se* há o que mostrar) e `_nota`; **todo o resto** —
incluindo o mapa `apelidos` — ficava **dentro** do `endereco` cifrado.

Consequência medida, e é um defeito real: **um ciclo com zero lançamentos abria o formulário sem
nenhuma aluna na lista**. O `lerDadosDoCiclo` devolvia **string vazia** no ramo `lancamentos`
falso — o gate que evita pedir a senha à toa — e era o `carregarCiclo` que, ao ver o texto vazio,
montava a estrutura do ciclo com `apelidos: {}`. O professor digitava o primeiro lançamento de um
ciclo novo e a tela não tinha a quem atribuí-lo — o formulário é **integralmente** dependente de
`dados.apelidos` (20 pontos de uso na página **medidos no `HEAD`**, antes desta peça: o
`<select>` de aluna em `:1505`, a linha de
presença em `:1189`, a checagem `!(aluna in dados.apelidos)` em `:600` e `:1463`, e o
`alunas.set(k, v)` em `:1495`). O defeito não é hipotético: ele está no ramo
`lancamentos === 0`, que é exatamente o ramo por onde o ciclo começa.

> **Nota de correção — 26/09/2026.** A **primeira redação** desta entrada descrevia o defeito por
> um encadeamento que **não existe**, e citava três símbolos que **não estão** no
> `lancamento.html`: `capAulas` e `criarZip()` (`grep -c` = **0** cada) e um `conferirApelido`
> (também **0**). O defeito real é outro, e foi provado relendo o `HEAD`: `lerDadosDoCiclo`
> devolvia `''` no ramo `lancamentos` falso, e o **`carregarCiclo`** montava `apelidos: {}` no
> fallback `if (!texto)`. O elo anterior fica **registrado aqui**, não apagado — o passado se
> incorpora, não se reescreve. A lição é a mesma do §4.0.1 e vale para **nomes de símbolo**, não
> só para contagens de linha: antes de citar uma função, medir que ela existe.

Não é conserto de segurança: é **compatibilidade**. O motivo está no **próprio pacote**: o
`po-01.json` viaja **em claro** e **já nomeia as alunas** (`subjects`). Logo, publicar o mapa de
apelidos ao lado dele **não expõe nada que o pacote já não publique** — o custo marginal é zero.
O que os apelidos são, e o que **não** são, está fixado pela P-12: são o **nome de exibição** de
um apelido **estável** (`vronsky` ⟶ `Vronsky`), **nunca** o nome completo, contato ou dado de
saúde.

**O que foi decidido.**

- O envelope passa de **três** para **quatro** chaves: `_cifrado`, `lancamentos`, **`apelidos`**,
  `_nota`. O `apelidos` sai **em claro**, por `(dados && dados.apelidos) || {}` — tolerante ao
  ciclo que ainda não tem mapa nenhum.
- **O que a chave contém é o mapa de EXIBIÇÃO, não a identidade.** Chave = apelido estável
  (`vronsky`), valor = nome de exibição (`Vronsky`). Nada de nome civil, nada de contato — a
  P-12 continua valendo para o que entra, e é o `po-01.json` que sustenta a decisão de publicá-lo.
- **O `_nota` foi estendido** para declarar a quarta chave e o motivo dela. Sem isso, a próxima
  sessão leria um campo em claro num envelope cifrado e concluiria **vazamento** — quando é
  decisão declarada.
- ⭐ **`dados.escola` é o SLUG, não o nome de exibição.** O índice (`ciclos.json`) traz
  `escola: "Duo"` / `"Ritmos e Movimento"` / `"Diaghilev"` — **exibição** — e
  `arquivo: "ciclo-01-duo-dados.json"` etc. O **formulário precisa do slug**: o consumidor de
  `dados.escola` é o `nomeDoArquivo()`, que monta nomes de arquivo em disco
  (`relatorio-aula-<aula>-<escola>.md`, `caderno-<id>-<escola>.md`), e a fonte em claro traz
  `escola: "duo"` — slug. A derivação passa a ser `escolaDoArquivo(c.arquivo)`, com regex
  **ancorada**: `/^ciclo-\d+(?:-(.+))?-dados\.json$/`.
  **Alternativas medidas e rejeitadas:** normalizar `c.escola` (❌ `"Ritmos e Movimento"` daria
  `ritmos-e-movimento`, e o slug de verdade é `ritmos`); ler o `ESCOLA_SLUG` do `.conf` (❌ não
  chega ao navegador); criar um campo `slug` novo no índice (❌ o slug **já está** em `arquivo`).
  **A âncora do regex é fail-safe de propósito:** sem ela, uma mudança futura no formato do índice
  devolveria `''` **em silêncio** e o `|| id` do `nomeDoArquivo()` — que sempre tem um nome —
  mascararia o defeito.
- ⭐ **`c.escola` continua INTACTO onde é exibição** — o `selo` da página e o `<option>` do seletor
  seguem lendo o nome de exibição do índice. Só a **derivação do nome de arquivo** mudou de fonte.
- ⭐ **`dados.ciclo` NÃO foi corrigido, de propósito: é dado morto.** Medido —
  `grep -nE "dados\.ciclo|[^a-zA-Z]f\.dados\.ciclo"` no `lancamento.html` devolve **zero**. Não há
  consumidor; corrigir seria mexer sem efeito.
- **O experimento passa a extrair as funções REAIS de produção**, em vez de parafraseá-las — e por
  isso ele **quebrou três vezes** ao acompanhar a fonte (abaixo). É o preço de um experimento que
  não mente sobre o que prova.

**Onde entrou.**

- `tools/cifrar-dados.js` — o cabeçalho de "três coisas" passa a "quatro coisas — e uma delas NÃO
  é segredo, de propósito"; o bullet novo que justifica o `apelidos` pelo `po-01.json` do mesmo
  pacote; a chave `apelidos` no objeto `envelope`; o `_nota` estendido.
- `tools/templates/lancamento.html` — o helper `escolaDoArquivo()` com o comentário que registra a
  decisão; a assinatura `lerDadosDoCiclo(texto, arquivo, c)` (o `c` é o 3º parâmetro novo); o
  ramo `!bruto.lancamentos`, que agora devolve `escola: escolaDoArquivo(c && c.arquivo)` e
  `apelidos: bruto.apelidos || {}` em vez do invólucro vazio; o fallback do `carregarCiclo`
  (fetch vazio), com a mesma troca; e o comentário do mapa de apelidos.
- `experimentos/diagnosticar-apelidos.js` *(não versionado — `.gitignore`)* — o `extrairFuncao`
  reescrito para cobrir as três formas (`function`, `async function`, `const NOME = `); a extração
  e a injeção do `escolaDoArquivo` como dependência explícita; e a CONCLUSÃO com as **duas formas
  de `escola`** e a nota da leitura antiga.
- Os **3 `-dados.json` publicados** (dentro do pacote) — **saídas geradas, regeneradas, nunca
  editadas à mão**. `8/2`, `8/2`, `9/2`.
- **Nada mais.** Não tocado: `tools/gerar-ciclo.sh` (outra frente o está escrevendo — B3b), as
  **3 fontes em claro** (`professores/*/ciclos/ciclo-01-*-dados.json`), os `.conf`, os `.fipp` e o
  `tools/hash-ciclo.sh`.

**Motivo declarado — os congelados.**

Dois arquivos, os dois congelados **por bloco** (`CONGELAMENTO.md` congela `tools/` e
`tools/templates/`):

- **`tools/cifrar-dados.js`** — a pergunta que o conteúdo do envelope responde. **O que NÃO
  muda:** a cifra continua sendo do **arquivo inteiro**, com a mesma senha da escola (PBKDF2-SHA256
  + AES-GCM, via `lib-cifra.js`); o `lancamentos` continua sendo o booleano de porta; o
  `_nota` continua em ASCII sem acento; nada no formato do `endereco` mudou. O que muda é
  **quantas** chaves o envelope declara em claro — de 3 para 4.
- **`tools/templates/lancamento.html`** — a derivação do slug e a leitura do mapa de apelidos.
  **O que NÃO muda:** o caminho de gravação (o texto do JSON é reescrito por `textoComAula` +
  `camposNaRaiz`, com a âncora de **dois** espaços); o gate da senha (`pedirSenha`, `:1516`); o
  `carregarCiclo` — que segue lendo `captura`/`po`/`plano` por `peca(c.id, 'captura')` e não teve
  o nome de arquivo alterado; a exibição (`selo`, `<option>`, tabela de presença); e a fórmula do
  prazo. A página continua
  carregando o cifrado e **decifrando no navegador** — a decisão §7.4 do
  `ARQUITETURA-CAPTURA.md` **(A) já implementado** segue valendo.

**Não reancorou — e isso é MEDIDO, não presumido.** A prova é estrutural e depois foi confirmada
por comando: `fontes_do_ciclo()` filtra por `${BASE%/ciclos}/*` = `professores/<professor>/*`, e
portanto **a cobertura da âncora não alcança `tools/`**. A edição do `lancamento.html` e a do
`cifrar-dados.js` vivem em `tools/`, fora da cobertura; e as 3 fontes em claro **não foram
tocadas** (`git status --porcelain` nas três devolve **vazio**). Os 3 `--check` foram rodados
**depois** das edições e **depois** da regeneração e os três dizem
`íntegro; cadeia intacta` — diaghilev `78daf7e4…`, duo `52f437f2…`, ritmos `899ccd32…`.

**Com o quê.**

- `tools/cifrar-dados.js` — **9/2** (`git diff --numstat`).
- `tools/templates/lancamento.html` — **193/83** no numstat, e **este número MISTURA quatro
  frentes não commitadas**: a Frente A (`nav.js`, o `:root`), o **B9**, o `b7-impl-prazo` (o texto
  do prazo) e o `b4` (as aulas do índice). ⚠️ **O B9 responde por 34+/7−**, e só: os hunks do
  helper `escolaDoArquivo` (`+233..+243`), a renomeação da assinatura (`-208 +246`), o gate
  (`+246,14`), o fallback (`-240 +291`, `+293,4`) e o comentário dos apelidos (`@222,5`).
- Os **3 `-dados.json` publicados** — `8/2`, `8/2`, `9/2`. ⚠️ **SÃO VERSIONADOS** (`git status` os
  marca `M`): a diferença do envelope regenerado **tem de ser versionada junto**, senão o pacote
  publicado e o repositório divergem.
- `experimentos/diagnosticar-apelidos.js` — **não versionado** (`.gitignore:44`) ⇒ **fora do
  rito**. Foi reescrito para extrair a função real e consertado **três vezes**: (1) o `extrairFuncao`
  descartava o `async` ao fatiar a partir de `function`, e o `new Function` estourava
  `await is only valid in async functions`; (2) a função extraída chama `escolaDoArquivo`, que
  **não era injetada** ⇒ `ReferenceError: escolaDoArquivo is not defined`, e só no ramo do ciclo
  **sem lançamento** — os dois ramos do experimento é que o pegaram; (3) o extrator só entendia
  `function NAME(`, e no ramo `const NOME = …` devolvia a **declaração**, que
  `new Function(\`return const X = …\`)` recusa com `Unexpected token 'const'` — passou a devolver
  só o **valor**.
- Verificações rodadas, todas verdes: `node tools/check-pacote.js` × 3 (**0 erro**; avisos
  **0 / 17 / 26**, idênticos à baseline ⇒ regeneração sem regressão) ·
  `node tools/validar-dados-ciclo.js` nas 3 fontes em claro (`ok`; o aviso de duo e ritmos é
  **pré-existente**) · `python3 -c json.load` no envelope × 3 (**4 chaves**;
  `apelidos` = **4/4/5**, `lancamentos` = **0/1/1**) · a sintaxe do bloco `<script>` da página
  (1 bloco, 78287 chars) · `grep -c escolaDoArquivo` = **4** nos **4** arquivos (a fonte + os 3
  pacotes ⇒ a correção chegou aos três) · `escolaDoArquivo` contra os 3 `ciclos.json` **reais**
  (`Duo`⟶`duo`, `Ritmos e Movimento`⟶`ritmos`, `Diaghilev`⟶`diaghilev`) e 5 casos de borda
  (todos `''`).

**Referências.**

- `po-01.json` — **a justificativa**: vai em claro no pacote público e **já nomeia as alunas**.
  ⚠️ Ele **não** entra na cobertura da âncora (o que a âncora cobre é `ciclo-01-<escola>-po.md`).
- `ARQUITETURA-CAPTURA.md` §7.4 — **(A) já implementado**: o JSON vai cifrado no pacote e o
  formulário decifra no navegador.
- `REGRAS.md` **P-12** — apelidos **estáveis**; nada de nome completo, contato ou dado de saúde.
- `ARQUITETURA-AULA.md` §4.1 (Defeito 1) e §4.2 (`aulas[]`) — o contexto em que a peça foi
  executada.
- `CONGELAMENTO.md` — `tools/` e `tools/templates/` **em bloco**.
- `P-03`/`P-04` — a proveniência **acrescenta, não edita**: é o que sustenta manter a nota da
  leitura antiga no experimento.

**O que ainda não está feito.**

- ⚠️ **A caixa do `escola` está FECHADA na decisão, mas continua sendo uma caixa**: o índice
  declara **exibição** e o nome de arquivo exige **slug**, e as duas coisas convivem no mesmo
  campo do índice. A decisão tomada aqui — derivar do `c.arquivo` com regex ancorada — **contorna**
  a ambiguidade sem resolvê-la **na origem**. A origem é o `gerar-ciclo.sh`, que grava
  `'escola'` (exibição) e `'arquivo'` (o nome) lado a lado; unificar isso é outra peça, e não foi
  feita.
- **`dados.ciclo` é dado morto** e **continua morto**. Não foi tocado nem removido — removê-lo
  mudaria a forma do JSON de produção, e não há consumidor que justifique.
- **`carregarCiclo` não mudou de forma, só de dependência**: ele continua sendo quem monta o
  objeto `cache[c.id]` com `captura`/`po`/`plano` por `peca(c.id, …)`. O que mudou é que o
  fallback `if (!texto)` **deixou de acontecer** no ciclo sem lançamento — o
  `lerDadosDoCiclo` já devolve a estrutura com os apelidos, e é ele que passa a ser o único ponto
  onde `apelidos` nasce. A lista de alunas **abre preenchida**; o que a página ainda não faz, com
  zero lançamento, é outra coisa — e não era o escopo desta peça.
- **A regeneração não é reancoragem — e não precisou ser.** Os 3 pacotes foram regerados e os 3
  `.fipp` **não** mudaram por causa do B9. Os `.fipp` que aparecem `M` no worktree são de outras
  peças (B1/B5), não desta.
- **As 3 fontes em claro não foram tocadas** ⇒ a mudança vive **só no envelope publicado**, que é
  saída gerada. Quem roda o gerador amanhã reproduz o mesmo envelope **desde que** o
  `cifrar-dados.js` seja o desta commit — sem ele, o envelope volta a ter 3 chaves e o defeito
  volta.
- **`b3b` (o formulário lê o config da aula) ainda não foi feito** — é a próxima peça, toca o
  **mesmo** `lancamento.html`, e por isso ficou bloqueada até esta entrada existir.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O
  commit próprio desta peça — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.

---

## 26/09/2026 — O formulário lê o config pela AULA: as quatro aulas deixam de renderizar o mesmo formulário

**O que motivou.**

**Defeito 1** do `ARQUITETURA-AULA.md` (`:175`): *o config da captura é um por ciclo, não um por
aula*. O formulário de lançamento buscava o config assim — `captura: await peca(c.id, 'captura')`
(`HEAD:254`, medido com `git show HEAD:tools/templates/lancamento.html`) — e o `peca()` monta o
nome pelo **id do ciclo** (`captura-XX.json`). Resultado: as **4 aulas do Diaghilev renderizavam o
MESMO formulário**, porque as quatro liam o mesmo arquivo. As questões da aula 02 não apareciam na
aula 02; apareciam as da aula 01, sempre.

A prova não é argumento, é medição — e ela já existia: `node experimentos/provar-por-aula.js` roda
a **mesma página de produção** 4 vezes, uma por aula. **Antes**, contra o template do `HEAD`:

```
  aula 01: Eixo e peso · Presença no lugar · Funcional · Linha de base
  aula 02: Eixo e peso · Presença no lugar · Funcional · Linha de base
  aula 03: Eixo e peso · Presença no lugar · Funcional · Linha de base
  aula 04: Eixo e peso · Presença no lugar · Funcional · Linha de base
  → as quatro são apenas 1 distintas ✗
```

E o mesmo valia para o caminho B, em que o config é **re-extraído das fontes `.md`** — ou seja: não
era o arquivo publicado que estava velho, era o formulário que **não sabia perguntar por aula**.
**Depois**, a mesma prova, sem tocar no experimento:

```
  aula 01: Eixo e peso · Presença no lugar · Funcional · Linha de base
  aula 02: Transferência · Musicalidade · Funcional · Linha de base
  aula 03: Meia ponta · Giro e retorno · Funcional · Linha de base
  aula 04: A frase inteira · Leitura somativa · Funcional · Linha de base
  → as quatro são QUATRO FORMULÁRIOS DIFERENTES ✓
  → e batem com o publicado (A): SIM ✓
```

Os **dois** pré-requisitos já estavam de pé, e foram conferidos antes de começar: o **`b4`** deixou
`aulas[]` no índice com o campo `config`
(`professores/fochini/ciclos/ciclo-01-diaghilev/ciclos.json`, cada aula com
`config: "captura-aula-NN.json"`) — e a entrada do próprio `b4` já dizia que *"este índice é
pré-requisito do `B3b`, não o desfecho dele"*; e o **`b3a`** faz o gerador emitir um
`captura-aula-NN.json` por aula no pacote (`ls` confirma `captura-01.json` **e**
`captura-aula-01..04.json`). O que faltava era **só** o consumidor: o formulário.

**O que foi decidido.**

- ⭐ **O nome do config da aula vem DECLARADO, não é convenção do formulário.** Quem sabe qual
  arquivo é o da aula 03 é o índice — o formulário passa a ler `aulas[].config` e buscar **aquele**
  nome. Inventar o sufixo no cliente (montar `captura-aula-` + `NN`) seria uma segunda convenção
  para a mesma verdade, e a primeira ficaria escondida no índice.
- **Daí o `pecaArquivo(nome)`** (novo, ao lado do `peca(ciclo, nome)`): o `peca()` **termina** o
  nome com o id do ciclo; o arquivo da aula **não** termina com o id do ciclo. São dois formatos
  de nome, e agora são dois helpers — nenhum dos dois adivinha o outro.
- ⭐ **O config da aula é PRÉ-CARREGADO, não buscado na troca de aula.** A troca de aula é
  **síncrona** (`renderCaptura`/`camposCaptura` não têm `await`), e o professor não pode esperar um
  `fetch` para ver a folha. Por isso o `carregarCiclo` busca **todos** os configs declarados em
  paralelo (`Promise.all` sobre `aulasDoIndice`) e guarda em `capturas[String(a.n)]`. A troca de
  aula passa a ser uma **leitura de mapa**, não uma ida à rede.
- **O que continua vindo do CICLO, e de propósito:** o **PO** e o **plano** seguem por
  `peca(c.id, …)` — eles são do ciclo, não da aula. Só a captura mudou de dono. A prova C mostra
  isso: `Funcional` e `Linha de base` continuam **presentes nas quatro** aulas, porque são blocos
  do ciclo; o que varia por aula é o resto.
- ⭐ **Compatibilidade para trás, com três redes e nenhuma delas opcional:** (1) `configDaAula(m, id)`
  devolve `''` quando o índice **não tem** `aulas[]`; (2) o `const legado = await peca(c.id,
  'captura')` continua sendo buscado, e a leitura do mapa é `(pecas.capturas || {})[sel.aula.value]
  ?? pecas.captura` — **nullish**, não `||`, para o mapa vazio cair no legado; (3) o mesmo fallback
  no ponto de **gravação** (`coletarCaptura`), senão a página mostraria a folha da aula e gravaria
  a antiga. **Medido, não presumido:** rodando a prova com um pacote **antigo** (índice sem
  `aulas[]` e sem nenhum `captura-aula-NN.json`) as quatro voltam a `apenas 1 distintas ✗` e o
  experimento **sai com código 0** — o pacote velho continua abrindo, só que com o comportamento
  de antes.
- **Sem reancoragem — e isso é MEDIDO.** O template vive em `tools/`, e a cobertura da âncora é
  `professores/<professor>/*`; os três `--check` continuam verdes **depois** da edição e da
  regeneração. Não é escolha: é o resultado do comando.

**Onde entrou.**

- `tools/templates/lancamento.html` **(CONGELADO — ver o motivo declarado abaixo)** — o comentário
  que registra a exceção ("o CONFIG DA AULA é a exceção: o nome está DECLARADO no índice"), o
  `pecaArquivo(nome)`, o `configDaAula(m, id)`, o pré-carregamento no `carregarCiclo` (`legado` +
  `capturas`), a leitura no `renderCaptura` e a leitura no `coletarCaptura`. Mais a lacuna
  `[Preencher: …]` de `camposCaptura`, que passou a **nomear o arquivo que falta** — e não um
  `captura-XX.json` adivinhado — para a lacuna do professor dizer qual folha o pacote não trouxe.
- Os **3 `lancamento.html` de pacote** (diaghilev, duo, ritmos) — **saídas geradas, regeradas por
  `tools/gerar-ciclo.sh`, nunca editadas à mão**. Cada um carrega os **9** símbolos da peça
  (`configDaAula`/`pecaArquivo`/`capturas`) e difere do template **só no bloco `NAV` gerado**.
- **Nada mais.** Não tocado: `tools/gerar-ciclo.sh`, `tools/check-pacote.js`, `tools/hash-ciclo.sh`,
  os três `.conf`, os três `.fipp`, as fontes `.md` das folhas, `experimentos/provar-por-aula.js`
  (o experimento é a prova; consertá-lo para provar seria provar com a própria mão) e o
  `prompts/eliciar-ciclo.md`, que tem alterações **pré-existentes** de outra sessão no worktree.

> **Correção de 26/09/2026 (nota de auditoria).** A primeira redação desta entrada dizia que cada
> `lancamento.html` de pacote carrega "os **9** símbolos da peça". **Está errado**: são **10**
> ocorrências dos três nomes — `configDaAula` **2** (a definição e o uso na lacuna de
> `camposCaptura`), `pecaArquivo` **3** (a definição e as duas chamadas do pré-carregamento) e
> `capturas` **5** (a construção do mapa no `carregarCiclo`, as duas leituras de consumo e o
> próprio nome da chave). Medido com `grep -o … | wc -l` sobre os quatro arquivos (template e os
> três pacotes), que dão **10 = 10**, e conferido contra as linhas `+` dos oito hunks desta peça no
> `git diff`. O número **9** veio de contar **linhas** em vez de **ocorrências** (`grep -c`); a
> contagem por nome está correta, só o total estava subestimado. A redação foi corrigida aqui; a
> versão anterior não é apagada: fica como o elo que registra o que se pensou antes da correção.

**Motivo declarado — os congelados.**

Um arquivo, congelado **por bloco** (`CONGELAMENTO.md` congela `tools/` inteiro, e
`tools/templates/` com ele):

- **`tools/templates/lancamento.html`** — **Por que.** Ele é o **único consumidor** do config de
  captura: o defeito não tem outro remédio que não passe por aqui. Enquanto o formulário buscar o
  config pelo ciclo, qualquer config por aula que o gerador emita é **arquivo morto** — o `b3a` já
  os emite, e as quatro aulas continuariam idênticas. A lacuna não foi suposta: foi **medida**
  pelo `provar-por-aula.js` antes de tocar no arquivo (`apenas 1 distintas ✗`).
- **O que NÃO muda.** A **fórmula do hash** e a **cobertura da âncora** (o `hash-ciclo.sh` não
  conhece `tools/`; confirmado com `--check` verde nos 3 ciclos, `íntegro; cadeia intacta`); os
  validadores; os gates do `check-pacote.js` (**0 erro** nos 3, avisos idênticos à baseline); o
  **caminho de gravação** (`textoComAula`/`camposNaRaiz`, a âncora de dois espaços); o **gate da
  senha** (`pedirSenha`); a leitura do **PO** e do **plano**, que seguem por ciclo; o **seletor de
  aula** e o texto do prazo; e as regras/pétreas. Nenhum código de saída mudou.
- **Vale registrar o alerta do `registro-md.instructions.md`:** este é um arquivo congelado cuja
  mudança **altera comportamento** — e a orientação geral ali é *"pare e confirme"*. A mudança
  **é a peça pedida**, está declarada no escopo do `B3b` e foi autorizada por quem a encomendou;
  não é contornamento do congelamento, é a construção pedida **com motivo declarado**. Sem esta
  entrada, a orientação do próprio arquivo manda tratar como contornamento — daí ela existir.

**Com o quê.**

- `tools/templates/lancamento.html` — **242/91** (`git diff --numstat`). ⚠️ **Este número
  MISTURA cinco frentes não commitadas**: a **Frente A** (o `:root`/CSS, hunk 1), o **B9**
  (`escolaDoArquivo`, hunks 3/4/8/9/10/11), o **b4** (as aulas do índice, hunk 12), o
  **`b7-impl-prazo`** (o texto do prazo, hunk 20) e o **`b3b`**. Dos **21** hunks (`-U3`), o
  **B3b responde por 8** — e só:

  | hunk | cabeçalho | Δ |
  |---|---|---|
  | 5 | `@@ -223,6 +274,16 @@ async function lerDadosDoCiclo` | +10/−0 |
  | 6 | `@@ -230,6 +291,18 @@ async function peca` | +12/−0 |
  | 7 | `@@ -237,21 +310,34 @@ async function carregarCiclo` | +17/−4 |
  | 13 | `@@ -866,7 +1003,8 @@ function camposCaptura` | +2/−1 |
  | 14 | `@@ -945,8 +1083,9 @@ function camposCaptura` | +3/−2 |
  | 17 | `@@ -1011,14 +1150,17 @@ function renderCaptura` | +5/−2 |
  | 18 | `@@ -1086,7 +1228,8 @@ function coletarCaptura` | +2/−1 |
  | 19 | `@@ -1094,7 +1237,9 @@ function coletarCaptura` | +3/−1 |

  ⇒ **o B3b é +54/−11** do total. A linha antiga do defeito está em `HEAD:254`
  (`captura: await peca(c.id, 'captura'),`), dentro do hunk 7.
- Os **3 `lancamento.html` de pacote** — `292/92` (diaghilev), `297/92` (duo), `298/92` (ritmos).
  ⚠️ **SÃO VERSIONADOS**: o formulário publicado tem de ser versionado junto do template, senão o
  pacote e o repositório divergem.
- Os **3 `ciclos.json`** — `52/2` (diaghilev), **`148/2`** (duo), **`256/2`** (ritmos). ⚠️ São do
  **`b4`** (o índice por aula), não desta peça; entram aqui só porque **são eles que declaram o
  `config`** que o formulário passou a ler.
- Os **configs por aula do pacote** — **NÃO VERSIONADOS** (`??`): `captura-aula-01..04.json` do
  diaghilev, `captura-aula-01.json` do duo e do ritmos. São **saída gerada** e é correta a
  assimetria com as fontes: o diaghilev é o ciclo **simulado com as 4 folhas escritas**, e as
  escolas do tiago têm **uma** folha de captura real (`ciclo-01-<escola>-captura-aula-01.md`).
- As **4 fontes das folhas** do diaghilev (`ciclo-01-diaghilev-captura-aula-0N.md`) — `1/1` cada
  ⚠️ também do **`b7-impl-prazo`**, não desta peça.
- Verificações rodadas, todas verdes: `node experimentos/provar-por-aula.js` (**4 diferentes ✓**,
  `A ≡ B: SIM ✓`, exit 0; e a mesma prova contra o template do `HEAD` dá `apenas 1 distintas ✗`) ·
  o **teste de compatibilidade acima** (pacote sem `aulas[]` ⇒ `1 distintas ✗`, exit 0) ·
  `tools/gerar-ciclo.sh` × 3 (exit 0) · `node tools/check-pacote.js` × 3 (**0 erro**; avisos
  **0 / 17 / 26**, idênticos à baseline ⇒ regeneração sem regressão) ·
  `tools/hash-ciclo.sh <prof> 01 <escola> --check` × 3 (exit 0, `íntegro; cadeia intacta`, hashes
  **inalterados**: `78daf7e4…`, `52f437f2…`, `899ccd32…`) · `node tools/check-identidade.js`
  (**verde**, 4 `ok:`).

**Referências.**

- `ARQUITETURA-AULA.md` **§4.1 / Defeito 1** (`:175`) — o defeito que a peça fecha; **§4.2** — o
  índice por aula (`aulas[].config`) de onde sai o nome do arquivo; e o **item 3** do plano
  (`:410`), que descreve exatamente esta peça.
- `CONGELAMENTO.md` — `tools/` **em bloco**, `tools/templates/` incluído.
- `.github/instructions/registro-md.instructions.md` — a estrutura desta entrada, o rito dos
  congelados e a ordem cronológica (recente no **fim**: é por isso que este elo é o último).
- `experimentos/provar-por-aula.js` — **a prova**, e o que ela mede: a página de **produção**, com
  o config que o **índice** e o **disco** entregam (A) e com o config **re-extraído das fontes
  `.md`** (B), para o resultado não depender de o arquivo publicado estar fresco.
- `tools/gerar-ciclo.sh` — `cp` do template para o pacote (~`:464`) e a geração dos
  `captura-aula-NN.json` (`:416-440`); e o `:382`, que **declara** o `config` de todas as aulas
  **mesmo quando a folha não existe** — é a origem dos avisos de duo e ritmos, e é peça de outra
  frente.

**O que ainda não está feito.**

- ⚠️ **Os avisos de duo e de ritmos são PRÉ-EXISTENTES e continuam de pé** — não foram causados por
  esta peça e não foram resolvidos por ela. Medido no duo: **11** avisos
  `config da aula NN: captura-aula-NN.json declarado no índice, mas a folha de captura não existe
  na fonte — o produtor declara "config" sem folha` (aulas 02 a 12) e **6** avisos antigos de
  glossário/menu. A assimetria é do **produtor**: o `gerar-ciclo.sh:382` declara `config` para
  toda aula, e o `:416-440` só gera o arquivo quando a folha existe. Consertar isso é mexer no
  gerador — **fora desta peça**, e sem isso o aviso é honesto: a folha daquelas aulas **ainda não
  foi escrita**.
- **O formulário não valida que o config declarado é o config da aula certa.** Ele confia no
  índice, como confiava no id do ciclo. Uma divergência entre `aulas[].n` e o conteúdo do
  arquivo declarado passaria silenciosa — quem garante o par é o `b3a`, não o consumidor.
- **A página continua sem regenerar sozinha.** O `lancamento.html` publicado é cópia do template
  feita pelo gerador. Quem roda o gerador amanhã reproduz este formulário **desde que** o template
  seja o desta peça — sem ele, o pacote volta a ler o config **do ciclo** e o defeito volta.
- **`HANDOFF.md` não foi regenerado** por esta peça (é saída gerada, e a frente dele é outra). Ele
  está **desatualizado** no worktree — declarado aqui para não virar surpresa.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O
  commit próprio desta peça — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.

## 27/09/2026 — A nav sai uma vez: o formulário deixa de ser a única página com o `id` dela duplicado

**O que motivou.**

A varredura de `id="…"` duplicado pelos três pacotes desta frente — conferência que **nenhum**
validador fazia — encontrou **um** caso: `id="nav-links"` **duas vezes** no `lancamento.html`, nos
**três** pacotes (`diaghilev`, `duo`, `ritmos`). As outras **20** páginas de cada pacote traziam o
`id` **uma** vez. O `lancamento.html` era a única página com a barra duplicada.

**Causa raiz — o comentário, não o marcador.** `tools/templates/lancamento.html` trazia o literal
`<!-- NAV -->` **duas vezes**: no marcador real (`:94`, logo antes do `<a class="topo" href="#top">`
de uma página cujo `<body>` é `id="top"`) e **dentro de um comentário em prosa** (`:182`), escrito
para explicar por que o formulário carrega o `nav.js` que as demais páginas não carregam. O
`gerar-ciclo.sh` injetava a barra com `str.replace()` **sem contagem** — substitui **todas** as
ocorrências — e a segunda injeção caía dentro do comentário, deixando um segundo `id="nav-links"` no
HTML. **Pré-existente, não desta frente:** `git show HEAD:tools/templates/lancamento.html | grep -c
'<!-- NAV -->'` dá **1**; o segundo literal nasceu com a peça `B3b` (`REGISTRO.md:5637`), a mesma que
passou a reaproveitar o `nav.js`.

**Por que nenhum validador pegou.** `tools/check-pacote.js:209` monta os ids com `new Set(...)` — um
`id` repetido **colapsa** no conjunto e some da conferência. O defeito era silencioso **por
construção**: não havia gate para `id` duplicado em página alguma.

**O que foi decidido.**

1. **O comentário deixa de escrever o literal.** Ele descreve o marcador sem citá-lo por extenso —
   porque o template inteiro, comentários inclusive, é copiado **verbatim** para a página gerada.
   ⚠️ **Armadilha medida:** a primeira redação desta correção citava `id="nav-links"` textualmente e
   **reintroduziu a contagem 2**; o texto final não escreve **nenhum** identificador nem o literal
   dos marcadores. A regra fica declarada no próprio comentário, para quem editar o bloco depois.
2. **Dois guardas de contagem no `gerar-ciclo.sh`** — o defeito não era do marcador, era do `replace`
   sem limite; o remédio fecha os **dois** pontos onde o script troca marcador:
   - **`<!-- NAV -->`** (`:750-759`): conta as ocorrências; `0` ⇒ erro (como antes), `>1` ⇒ erro
     *"a nav sairia duplicada"*, `1` ⇒ `replace(…, 1)`.
   - **`<!-- CALENDARIO -->`** (`:524-529`): mesma contagem; `!= 1` ⇒ erro. **Risco latente, medido:**
     os templates têm **0** marcadores e as **9** fontes que usam o marcador têm **exatamente 1** —
     hoje não duplica, e passa a falhar alto em vez de duplicar calado.

**Onde entrou.** `tools/templates/lancamento.html` (o comentário em prosa) e `tools/gerar-ciclo.sh`
(os dois guardas). Nenhum arquivo de conteúdo, nenhuma fonte de ciclo, nenhum `.conf`.

**Motivo declarado — os congelados.**

Dois arquivos congelados (`CONGELAMENTO.md` congela `tools/` inteiro e `tools/templates/` com ele):

- **Por que.** O `CONGELAMENTO.md` já exige este rito, nominalmente, para **"alterar a estrutura de
  menu ou navegação"** — é exatamente o caso: a correção decide **quantas vezes a barra é injetada**.
  E não havia como corrigir sem tocar nos dois: o literal está no template (é ele que some) e a
  contagem está no gerador (é ele que passa a conferir).
- **A mudança de lógica RESTAURA a intenção; não altera a saída correta.** O `replace(…, 1)` não
  decide nada de novo: ele entrega o que a peça `B3b` **quis** entregar — uma barra por página. Onde
  havia **um** marcador, o resultado é **byte a byte o mesmo** de antes. O guarda também não muda o
  que o gerador produz num template são; ele só se recusa a produzir um pacote **defeituoso**.
- **O que NÃO muda.** A **fórmula do hash** e a **cobertura da âncora** (o `hash-ciclo.sh` não
  conhece `tools/`; confirmado com `--check` verde nos 3 ciclos, `íntegro; cadeia intacta`, hashes
  `a05f05c0…` / `8bba2c5e…` / `4175cdf1…`); os validadores; os gates do `check-pacote.js` (**0 erro**
  nos 3, avisos **idênticos à baseline** — 0 / 17 / 26); a navegação de todas as demais páginas; as
  regras/pétreas. Nenhum código de saída mudou.
- **Vale registrar o alerta do `registro-md.instructions.md`:** este é um arquivo congelado cuja
  mudança **altera comportamento** — e a orientação geral ali é *"pare e confirme"*. A alteração foi
  **explicitamente pedida e autorizada** por quem a encomendou (*"ajusta para ter nav-links, como os
  demais, e justifica para poder alterar"*); não é contornamento do congelamento, é a construção
  pedida **com motivo declarado**. Sem esta entrada, a orientação do próprio arquivo mandaria tratar
  como contornamento — daí ela existir.

**Com o quê.**

- `tools/templates/lancamento.html` — **248/91** (`git diff --numstat`). ⚠️ **MISTURA as frentes não
  commitadas** já declaradas na entrada do `B3b` (`REGISTRO.md:5760`); **desta peça é só o bloco de
  comentário `:179-188`, e dele apenas as 4 linhas finais `:185-188`** — o resto do bloco veio com o
  `B3b`. Estado final: `<!-- NAV -->` **1** vez no template.
- `tools/gerar-ciclo.sh` — **239/13** (`git diff --numstat`). ⚠️ **MISTURA as frentes já declaradas**;
  desta peça são **dois hunks** (`git diff -U3`: `@@ -335,7 +518,15 @@` e `@@ -556,9 +747,16 @@`).
  `grep -n "replace('<!--"` devolve **só `:529` e `:759`** — os dois pontos de troca de marcador — e
  **ambos** agora têm guarda de contagem. (Os `:902`/`:903` que o `git diff` também mostra são a
  reescrita de âncoras do PDF: legítimos e fora desta peça.)
- **As medições da verificação:** `id="nav-links"` = **1** nos 3 `lancamento.html`; **nenhum `id`
  duplicado** em nenhuma página dos 3 pacotes; `plano.html` com **1** `<h2 id="calendario-do-ciclo">`;
  os 3 pacotes regenerados nos gates da baseline; `--check` **verde** nos 3.
- **Os dois guardas provados end-to-end** (backup → injeção → execução → restauração conferida por
  `sha256sum`): com **2** `<!-- NAV -->` no template, o `gerar-ciclo.sh` sai **`EXIT=1`** com
  *"marcador `<!-- NAV -->` aparece 2 vezes (esperado 1) — a nav sairia duplicada…"*; com **2**
  `<!-- CALENDARIO -->` na fonte, sai **`EXIT=1`** com *"ciclo-01-plano.md: marcador
  `<!-- CALENDARIO -->` aparece 2 vezes (esperado 1)."*. Template e fonte foram restaurados byte a
  byte (sha256 do plano conferido: `ebf72e8d…`).

**Referências.**

- `CONGELAMENTO.md` — os congelados e o caso nominal *"alterar a estrutura de menu ou navegação"*.
- `ARQUITETURA-AULA.md §8` (`:328`) — a autorização da pesquisadora (23/09/2026) para descongelar
  `tools/` neste protótipo.
- `.github/instructions/registro-md.instructions.md` — os três requisitos do congelado, "o que não
  muda", e o alerta de parar-e-confirmar quando a mudança altera comportamento.
- `REGISTRO.md:5637` — a peça `B3b`, que introduziu o defeito e cuja entrada já declarava o `tools/`
  em obra.
- `tools/check-pacote.js:209` — o `new Set(...)` que torna o `id` duplicado invisível.

**O que ainda não está feito.**

- **A conferência de pacote segue cega a `id` duplicado.** O defeito foi achado por varredura
  **minha**, não por gate. Enquanto o `check-pacote.js:209` usar `new Set(...)`, um `id` repetido
  volta a passar em silêncio. Fechar isso é mexer no validador — **fora desta peça**.
- **Um terceiro marcador nasceria sem guarda.** Os guardas cobrem `<!-- NAV -->` e
  `<!-- CALENDARIO -->`; qualquer marcador novo que o gerador venha a trocar precisa do mesmo
  tratamento, e nada obriga a isso.
- **A âncora não cobre esta classe de defeito.** O `hash-ciclo.sh` hasheia **fontes**; o
  `lancamento.html` é **saída gerada** e fica fora, de propósito. Isso significa que a âncora
  **não** detectaria uma nav duplicada — o gate do pacote é que teria de fazer isso.
- **`HANDOFF.md` não foi regenerado** por esta peça (é saída gerada, e a frente dele é outra). Ele
  segue **desatualizado** no worktree — declarado aqui para não virar surpresa.
- **Nada commitado.** As alterações ficam no worktree, junto das dezenas de outras frentes. O commit
  próprio desta peça — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.

## 27/09/2026 — O estado da aula deixa de ser declarado: quatro estados derivados do cronograma e do prazo

**O que motivou.**

A pergunta era simples e a resposta não existia em lugar nenhum: **onde está escrito que a aula
foi dada?** A varredura pelos três ciclos mostrou que em **nenhum** lugar — não há campo, não há
botão, não há lista. O critério era **o ato**, e o ato não tinha registro. A orientação do §8
mandava abrir `tools/` para resolver isso, e o desenho que eu havia proposto — um campo `dada_em`
carimbado pelo professor — foi **recusado pela pesquisadora**, com o modelo na mão:

> o professor estabeleceu lá no PO a sua linha de base, aí ele fez o seu plano de aula, aí gerou o
> nosso formulário, ele foi lá no fato e deu a aula, pegou os dados importantes, voltou no
> formulário e preencheu, agora ele tem condições de estabelecer uma nova linha de base ou
> atualizar… aí ele elabora a aula 2 e aí por algum motivo até a data da aula 2 — né, que ele pode
> editar, mudar, fazer o que quiser até a aula ser considerada a aula dada — então até a data lá
> aquele plano de aula… enfim, chegou o dia da aula […] ele não deu aula, e aí passou esse dia, ele
> vai ter que dar aula três conforme está planejado lá no calendário do cronograma […] essa aula 2
> não precisa ter nenhum lugar dizendo "aula dada" porque passou o fato, passou o período dele de
> lançamento […] tem impacto lá na folha de pagamento — significa que ele não vai receber — então é
> simples assim, não precisa ter nenhum campo para isso no meu entendimento.

**O que foi decidido.**

- **O estado é DERIVADO, e são quatro** — não três: `planejada`, `dada`, `lancada` e **`nao_dada`**.
  O corte não é a data solta: é **a data casada com o prazo** (§3.1–§3.3), que é o que sabe
  distinguir "ainda vai acontecer" de "não aconteceu".
- **A precedência é a do código:** `lancada` (há registro) → `nao_dada` (prazo vencido sem
  registro) → `dada` (o prazo corre e a aula já terminou) → `planejada` (a aula ainda não
  terminou, CRUD livre do §1).
- **A aula não dada não é declarada — é o que sobra.** Sem campo, sem botão, sem lista de
  "aulas dadas". A ausência de registro **até o prazo vencer** basta, e é o cenário **B do §2**:
  pulei a 02, dou a 03, e a linha de base continua a da 01.
- **O único campo novo é `gerado_em`** (ISO, na raiz do `ciclos.json`) — o **carimbo do instante**
  do juízo. Quem quiser `aula_dada` deriva: `aula_dada = estado ∈ {dada, lancada}`.
- **Nada foi acrescentado a nenhum arquivo de dados.** O `estado` do índice é um **carimbo**, não
  um atributo; o formulário **re-deriva com o próprio relógio** (`estadoDaAula()`), então a página
  acompanha o tempo sem depender do build.
- **A `nao_dada` é a única em que o painel não abre** — não houve aula, não há o que lançar, e o
  ajuste já estaria fora do prazo. `planejada`, `dada` e `lancada` abrem: fechar a `planejada`
  seria **regressão** (o painel sempre abriu nela — é a intenção).

**Onde entrou.**

- `tools/gerar-ciclo.sh` — `derivar_estado()` e o campo `estado` por aula no índice; `gerado_em` na
  raiz.
- `tools/templates/lancamento.html` — `estadoDaAula()` (o espelho em JS, com `agora()` injetável),
  `pulada()`, o veto em `renderCaptura()` e em `render()`, e `primeiraSemDado()` pulando as puladas.
- `ARQUITETURA-AULA.md` — **§1 reescrito** para os quatro estados derivados (com a tabela, a folha
  de ponto e dois blockquotes novos: "Implementado (B6)" e "A aula não dada não é declarada — é o
  que sobra"); §1.1 passou de *"aula não dada: CRUD comum"* para *"aula `planejada`: CRUD comum"*,
  porque o termo antigo passou a nomear **a outra coisa**; o Resumo do topo, §3.3 (duas redações),
  a tabela do §4.2 (`estado` e `lancada` separados) e os itens 6 e 8 do §10.
- `AGENTS.md` e `HANDOFF.md` — os dois espelhos do §1: caíram *"a partir da declaração 'aula
  dada'"* nas duas casas. No `HANDOFF.md` a correção foi feita **na fonte** (`tools/gerar-handoff.sh`,
  onde a frase é literal) e o arquivo foi **regerado**.
- `.github/instructions/ciclo-fontes.instructions.md` e
  `.github/skills/identidade-do-projeto/references/bloco-identidade.md` — a **mesma redação do §1**,
  que é o bloco de identidade do projeto e aparece copiada nesses pontos de entrada. Sem isso, a
  próxima sessão de agente repetiria a redação velha — foi exatamente o que a deriva de identidade
  já tinha feito uma vez.

**Motivo declarado — os congelados.**

`tools/` e `tools/templates/` são congelados (`CONGELAMENTO.md`), e a peça toca três arquivos de
lá. O motivo é o que a §8 já autorizava: **fechar a peça 6 do §10** — *"o estado derivado (§1): o
cronograma + o prazo + o registro; é o que gera o formulário"* —, que não existia. A autorização
nominal da pesquisadora para descongelar `tools/` neste protótipo é a de 23/09/2026, citada no
`§8:328` e já usada na entrada da nav (`REGISTRO.md:5839`). **O que não muda:** a fórmula de hash, a
cobertura da âncora, os validadores, as regras e as pétreas — **nada**. Em particular, **nenhuma
fonte de ciclo foi tocada**, e as três âncoras seguem **`íntegro; cadeia intacta`** com os hashes
**byte a byte idênticos** aos de antes da peça (`a05f05c0…` diaghilev · `8bba2c5e…` duo ·
`4175cdf1…` ritmos).

A terceira ponta é `tools/gerar-handoff.sh`: o **§1 do `HANDOFF.md` é texto literal do gerador**,
não do `ARQUITETURA-AULA.md`. Editar o `HANDOFF.md` à mão não se sustenta — a próxima geração
desfaz. Por isso a frase do §1 foi corrigida **na fonte** e o `HANDOFF.md` foi **regerado**, que é
como ele deve receber qualquer mudança.

**Com o quê.**

- `tools/gerar-ciclo.sh` — **272/13** (`git diff --numstat`). ⚠️ **MISTURA as frentes não
  commitadas** já declaradas nas entradas do `B3b`, do `B7` e da nav; **desta peça** são o hunk
  `@@ -230,0 +245,171 @@` (o bloco `derivar_estado` + o loop) e o `@@ -234 +419,8 @@`
  (`'estado'`/`'gerado_em'`). `grep -n "derivar_estado"` devolve `:374`, `:378` e `:407`;
  `grep -n "gerado_em"` devolve `:426`.
- `tools/templates/lancamento.html` — **290/94** (`git diff --numstat`). ⚠️ **MISTURA** as frentes
  do `B3b`, do `B5` e da nav. **Desta peça** são os hunks `@@ -691,2 +783,5 @@` e
  `@@ -693,0 +789,12 @@` (`primeiraSemDado`), `@@ -726,3 +854,6 @@` e `@@ -729,0 +861,27 @@`
  (`estadoDaAula`, `pulada`) e os de `renderCaptura`/`render` (`@@ -1009,2 +1189,3 @@`,
  `@@ -1303 +1490,4 @@`). `grep -n "function estadoDaAula"` → `:871`; `"const pulada"` → `:887`.
- `ARQUITETURA-AULA.md` — **105/34**; `AGENTS.md` — **4/3**; `tools/gerar-handoff.sh` — **4/3**;
  `HANDOFF.md` — **675/56** (regerado: carrega junto a regeneração pendente de outras frentes).
- **As medições da verificação:** os 3 pacotes regenerados; `node tools/check-pacote.js` nos 3 com
  **0 erros**; `node --check` no JS extraído do template OK; as **4 medições no navegador** (CDP
  headless, `--remote-debugging-port`) em **3 cenários** — `ritmos` com `#agora=2026-10-02T00:00`
  (as `02`–`05` `nao_dada` **não abrem**; a `06` `dada` **abre**; a `01` `lancada` abre em leitura +
  ajuste), `duo` com `#agora=2026-09-30T00:00` (a `02` `dada` **abre** — o cenário "não dei, dei"
  do §2-B, confirmado em dado real) e `diaghilev` **sem** `#agora` (as cinco `planejada` **abrem** —
  **não-regressão preservada**) — todas conformes ao gabarito calculado em Node.
- **O gabarito em dados reais** (o que os estados *são* hoje): `diaghilev` — as 5 `planejada`;
  `duo` — `01` `lancada`, `02` `dada`, `03`…`12` `planejada`; `ritmos` — `01` `lancada`, `02` e `03`
  `nao_dada` (**o cenário da pesquisadora já existia nos dados, sem ninguém saber**), `04` e `05`
  `dada`, `06` em diante `planejada`.

**Referências.**

- `ARQUITETURA-AULA.md §1` e `§1.1` — o ciclo de vida da aula e a regra em uma linha; **§2** — a
  linha de corte, e o **cenário B**, que é literalmente o modelo descrito pela pesquisadora; §3.1 e
  **§3.3** — o prazo e as duas regras de caso-limite; **§4.2** — o índice por aula; **§8** — o que
  precisa descongelar; **§10** — as peças, na ordem (a 6 fecha aqui).
- `CONGELAMENTO.md` — `tools/` e `tools/templates/` congelados; o caso nominal *"alterar a
  estrutura de menu ou navegação"* é da entrada da nav, não desta.
- `REGISTRO.md:5839` — a entrada da nav, que já declarava o `tools/` em obra e é a autorização
  imediatamente anterior a esta.
- `tools/validar-dados-ciclo.js:514-518` — a conferência do `-dados.json`, que segue dizendo que o
  `prazo` sai nulo enquanto não tiver produtor (**desatualizada**: o `B7` já o produz).
- `IDEIA-PAINEL-ESCOLA.md:15` — *"O painel **não cria dado nenhum**. Ele **relê**"*, que é a mesma
  regra vista do lado do admin.

**O que ainda não está feito.**

- **O `B8` — o ajuste no plano (§1.2) — não foi feito.** É a última das treze peças, e é a que o
  `podeAjustar()` espera.
- **`podeAjustar()` continua fechado** (`tools/templates/lancamento.html:948`): o ajuste do plano
  não é oferecido em lugar nenhum.
- **`lib-vistas.js:148-154` — `capturarDepois()` não tem chamador.** Bug latente, **não corrigido
  aqui**; fica para o `B8`.
- **Efeito colateral confirmado, a rever no `B8`:** numa aula `dada` **sem** registro, o bloco
  `#acoes-ajuste` fica **oculto** — `barraAjuste.hidden = !!captura || !temAula` e o painel de
  captura está aberto. **Não é perda de ação** (quem a oferece é o painel de captura), mas é uma
  assimetria que o `B8` deve olhar de frente.
- **O ramo `prazo is None` de `derivar_estado` é código morto no caminho real:**
  `calcular_prazos` (`tools/gerar-ciclo.sh:318`) grava prazo para **toda** aula, inclusive a última
  data, que herda o `max(janelas)`. O `if` é **guarda defensiva** — e o comentário no código agora
  diz isso, para que ninguém leia aquele ramo como "o `planejada` normal".
- **O `ancora` do índice continua `null`** nos três ciclos (o `B5` pela metade). Está **registrado
  no `§4.2` como promessa**, não como estado; o conserto é **fora desta peça**.
- **A conferência de pacote segue sem gate para o `estado`** — nenhum validador lê o campo; o único
  consumidor do `ciclos.json` é o `check-pacote.js`, e ele só olha `aulas[].config`.
- **Nada commitado.** Como na entrada da nav: as alterações ficam no worktree, junto das dezenas de
  outras frentes, e o commit próprio — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido
  explícito.

> **Correção de 27/09/2026 (mesmo dia).** Quatro afirmações dos bullets acima **não se sustentam**
> depois do `B8`, e uma delas nunca se sustentou. Corrigem-se aqui, como elo — o texto anterior
> não é apagado (P-03/P-04).
>
> 1. *"O `B8` — o ajuste no plano — não foi feito"* e *"é a última das treze peças"*. **As duas
>    envelheceram.** O `B8` **foi feito** em 27/09/2026 (a entrada própria dele está adiante
>    neste arquivo), e o rótulo *"treze peças"* **não corresponde à §10**: lá são **dez itens**,
>    e a `B13` nunca foi um deles — é item do validador de dados (`linha_de_base` por aluna),
>    **tolerado, não implementado** (`REGISTRO.md:4721` e `:4851`), e continua assim. Da §10,
>    **as oito de implementação estão feitas**; a **9** entregou só a **P-13** (a eliciação segue
>    pendente, `HANDOFF.md:655`), e a **10** (o painel) é *"para depois"* por decisão.
> 2. *"`podeAjustar()` continua fechado (`tools/templates/lancamento.html:948`)"*. **A linha está
>    errada e a afirmação é falsa.** `podeAjustar()` está em ~~**`:1194`**~~ e é **consumido** — em
>    ~~`:1761` (o `disabled` do botão *ajustar*) e `:1767` (o texto do aviso)~~. O que a peça `B6`
>    mediu em `:948` foi outra coisa. ~~Quem **governa o plano** não é `podeAjustar()`: é
>    **`podeAjustarPlano()` (`:618`)**, com o comentário de `:612` explicando que são **dois
>    relógios** — aquele é o do lançamento (depois da aula, dentro do prazo), este o do plano
>    (antes ou depois da aula, até o lançamento). O `B8` entregou o segundo; o `:1784` é quem
>    o consome.~~ **Superado em 29/09/2026.** As coordenadas deslocaram outra vez — e a função que
>    esta correção nomeia como *"quem manda"* **não existe**: `podeAjustarPlano()` saiu com a barra
>    `#acoes-plano` na peça de 28/09/2026 (`17ed444`), e a varredura do nome no template volta
>    **zero**. Do par resta **um** relógio só, o do lançamento — `podeAjustar()` em **`:970`**,
>    consumida em **`:1566`** (o `disabled` do botão) e **`:1572`** (o texto do aviso). A redação
>    antiga **não é apagada**: fica como o elo do que se mediu naquele momento.
> 3. *"`lib-vistas.js:148-154` — `capturarDepois()` não tem chamador"*. **A função não existe** —
>    nunca existiu. `grep -c 'capturarDepois' tools/lib-vistas.js` → **0**, e
>    `git log --all -S'capturarDepois'` volta **vazio**. Não há bug latente ali; há um nome que
>    foi citado de memória. **Retirado de todas as listas de pendência.**
> 4. *"`grep -n "function estadoDaAula"` → `:871`; `"const pulada"` → `:887`"*. **Os números
>    deslocaram** — com o `B8` o arquivo cresceu: ~~hoje são **`:1109`** e **`:1125`**~~.
>    **Superado em 29/09/2026:** hoje são **`:885`** e **`:901`**. O `B8` morava **depois** destas
>    duas funções: quando a barra do plano saiu, na peça de 28/09/2026, o arquivo perdeu 1 110
>    linhas **abaixo** delas e as coordenadas voltaram para perto das originais. As duas funções
>    estão no arquivo e fazem o que a entrada diz; só as coordenadas mudaram — duas vezes.
>
> Uma quinta afirmação **estava certa e continua certa**: o *"Efeito colateral confirmado"* — na
> aula `dada` **sem** registro o bloco `#acoes-ajuste` fica oculto ~~(`barraAjuste.hidden = !!
> captura || !temAula`, `:1757`)~~ (**`barraAjuste.hidden = !!captura || !temAula`**, hoje em
> `:1562`). O `B8` **olhou de frente**, como a entrada pedia: ~~a ação não se
> perde, porque quem a oferece é a **barra do plano** (`#acoes-plano`, `:1780`), que vive fora do
> painel e não depende de o painel estar aberto. Fica como assimetria **deliberada** e comentada
> no código, não como pendência.~~ **Superado em 29/09/2026.** A **barra do plano não existe** —
> `#acoes-plano` saiu na peça de 28/09/2026 e a varredura do id no template volta **zero**. O que
> resta é o predicado do formulário: `const captura = …` (`:1536`), `const emFormulario = !!
> captura || emAjuste` (`:1538`) e o `hidden` de `:1562`. A assimetria, portanto, **não está
> resolvida por desenho**: volta a ser **pendência** — e é assim que fica registrada aqui, com o
> comentário de `:1555–1557` no código como o único elo. A redação antiga **não é apagada**: fica
> como o elo do que se mediu naquele momento.

## 27/09/2026 — A §5.1 para de dizer 48 h: o ajuste com prazo passa a descrever o prazo que o `B7` implementou

**O que motivou.**

A pesquisa sobre o ciclo de vida da aula — "uma aula que não foi dada não precisa ter nenhum campo
para isso" — pediu duas coisas: confirmar o modelo contra a documentação e **acabar com informação
conflitante entre documentos**. A verificação mostrou que o modelo está documentado e implementado
(`ARQUITETURA-AULA.md §1` e o `B6`, 27/09/2026, com o cenário da pesquisadora já existindo nos dados
do Ritmos *sem ninguém saber*). Achou também **uma contradição concreta**: o `§5.1` do
`ARQUITETURA-CAPTURA.md` continuava descrevendo o prazo **antigo**, de **48 h renovadas a cada
gravação**, quando o `B7` (26/09/2026, `REGISTRO.md:4862`) já havia decidido que **o prazo é
declarado pelo índice e calculado do cronograma** — e que as 48 h sobrevivem **só como ressalva**,
em `HORAS_DE_RESSALVA = 48`, para ciclos anteriores à regra.

O `HANDOFF.md` já carregava o aviso, e ele é literal:

> **`ARQUITETURA-CAPTURA.md:313` ainda diz "48 horas".** O §5.1 descreve a regra antiga — renovada a
> cada gravação — e agora ela é só ressalva. **Não foi corrigido aqui**: é documento de outro
> escopo… Fica o aviso para a próxima sessão não o tomar por verdade.

Uma segunda redação tinha envelhecido junto, e não estava no aviso: a **Nota do `:156`**, que dizia
que o `ultimo_lancamento` *"é o que ancora o prazo do ajuste (§5.1)"*. Desde o `B7` o prazo vem do
**índice** (`aulas[].prazo`), e o carimbo da **raiz** — que ainda existe no JSON — **não é mais
escrito** pelo formulário. A frase apontava para uma âncora que mudou de dono.

**O que foi decidido.**

- **A §5.1 passa a descrever o prazo que existe.** O texto agora dá a fórmula da `§3.1` do
  `ARQUITETURA-AULA.md` — `maior` entre *24 h antes da próxima **DATA** de aula* e *fim do bloco +
  **18 h*** — e as medições reais: **143 h** (Duo), **23 h** e **95 h** (Diaghilev), **57 h** e
  **60 h** (Ritmos). O caso `DIAS="2,6,6"` (7 datas com mais de uma aula em 21) fica citado pela
  consequência que interessa ao JSON: o prazo conta do **fim do bloco**, não da aula.
- **As 48 h não foram apagadas: viraram RESSALVA, e a ressalva agora está dita.** O que as
  substitui, em dois bullets, é o inverso exato do que o documento afirmava: **o prazo é fixo por
  aula e nenhuma gravação o renova** (salvar a 05 não reabre a janela da 01 — e um ajuste da 01
  também não a reabre), e **os prazos são independentes** (pular a 02 não desloca o prazo da 03).
  A ressalva vale para um caso só — ciclo anterior à regra, que não declara o prazo — e **nos
  ciclos atuais não dispara**.
- **"Motivo do ajuste" fica como DIVERGÊNCIA DECLARADA, resolvida por decisão da pesquisadora.**
  O `ARQUITETURA-AULA.md §1.1`/`§1.2` diz que, nos **dois** objetos (o plano e o lançamento), o
  ajuste é o **mesmo mecanismo** e **o diff é a justificativa — sem campo de motivo obrigatório**,
  porque *"pedir justificativa transformaria autonomia em burocracia"*. O formulário implementado
  exige motivo **e** autor, e **bloqueia** a gravação sem eles. Perguntada sobre como harmonizar
  (o `lancamento.html` é congelado), a pesquisadora decidiu **alinhar o `§5.1` ao
  `ARQUITETURA-AULA` e registrar o motivo do formulário como divergência declarada, a resolver
  quando o formulário for revisto**. Foi o que entrou: o bullet perdeu o *"(obrigatório)"*, e um
  blockquote separa o que o documento passou a dizer do que o código faz, com a justificativa do
  código citada, e aponta a peça que unifica os dois — **o item 8 do §10 do `ARQUITETURA-AULA.md`,
  o `B8`**.
- **Escreveu-se como nota datada, não como reescrita (P-03/P-04).** A proveniência **acrescenta, não
  edita**: as três redações antigas (as 48 h, a Nota do carimbo, o *"sem esperar 48h"* do
  experimento) ficam visíveis no arquivo, com nota do dia dizendo o que envelheceu. A nota de
  correção seguiu o formato já praticado — `REGISTRO.md:5285` (`- **Nota datada — redação que
  envelheceu.**`) e `IDEIA-CAPTURA.md:29` (`> **Nota (2026-09-20).**`) — e a licença literal de
  `.github/skills/identidade-do-projeto/references/congelamento-e-registro.md:66-76`, que manda
  **não apagar** a redação errada já publicada. As notas entraram **antes do `### Aviso para
  implementação — colisão de nomes`**, porque **não existe `## 5.2`** e uma nota solta depois
  pareceria pertencer ao Aviso.
- **A lista de Referências do `ARQUITETURA-CAPTURA.md` ganhou o `ARQUITETURA-AULA.md`.** O documento
  passou a citar a `§3.1`, a `§3.3`, a `§1.1`, a `§1.2` e o `item 8 do §10` de um arquivo que ele
  **não** listava — o único dos dois arquiteturais que faltava ali, apesar de ser o **modelo
  canônico** (o "como" da captura não se sustenta sem o "quando" da aula).

**Onde entrou.**

- `ARQUITETURA-CAPTURA.md` — **59 inserções, 12 remoções**. `§5.1 Ajuste com prazo`: o parágrafo de
  abertura (as 48 h → a fórmula + as medições), dois bullets novos (prazo fixo por aula; prazos
  independentes), o blockquote `**A ressalva das 48 h (27/09/2026).**`, o bullet do professor (saiu
  o *"(obrigatório)"*), o blockquote `**Divergência declarada — o "Motivo do ajuste"
  (27/09/2026).**`, o `**Por que o prazo:**` (saiu *"dentro de 48h"*, entrou o parágrafo da última
  aula herdando a maior janela) e o blockquote do experimento (saiu *"sem esperar 48h"*). Fora da
  `§5.1`: a Nota do `:156` e a lista de `## Referências`.

**Com o quê.**

- `git --no-pager diff --numstat ARQUITETURA-CAPTURA.md` → **59/12**, um arquivo — e **nenhum outro**
  arquivo tocado nesta peça.
- `grep -n "48" ARQUITETURA-CAPTURA.md` → de **4 para 5** ocorrências, todas legítimas: `:321` (a
  fórmula), `:336-337` (o próprio texto citado na nota), `:340` (a ressalva) e `:343`
  (`HORAS_DE_RESSALVA = 48`). Nenhuma delas afirma que o prazo **é** 48 h.
- `grep -n "obrigat" ARQUITETURA-CAPTURA.md` → `:166` (o par `plano_seguido`/`mudou`, **fora do
  alvo**, intacto) e `:368` (a citação do `§1.1` dentro da divergência declarada).
- **Nenhum validador roda sobre este arquivo**: `ARQUITETURA-*.md` **não** entra em
  `fontes_do_ciclo()`, logo `tools/hash-ciclo.sh --check` segue **exit 0** nos três ciclos — a
  âncora de proveniência **não** é afetada, e **não há reancoragem** nesta peça.
- Medições das quais o texto depende, todas já tomadas e registradas: as janelas 143/23/95/57/60 h
  (`B7-medicao-prazo.md`, resumidas no `§3.2` do `ARQUITETURA-AULA.md`); o piso de 18 h **nunca
  disparando** (menor janela real, 23 h); e o `carimboDaAula()`
  (`tools/templates/lancamento.html:958-965`) lendo `aulas[id].ultimo_lancamento` com queda para a
  raiz, mais o comentário de que **a raiz não é mais escrita**.

**Referências.**

- `ARQUITETURA-AULA.md` — **`§3.1`** (a fórmula e o piso de 18 h, calibrado com a pesquisadora),
  **`§3.2`** (a tabela medida), **`§3.3`** (a aula pulada não tem prazo; os prazos são
  independentes; a última aula herda a maior janela), **`§1.1`** (`:70`, *"o diff é a
  justificativa — sem campo de motivo obrigatório"*), **`§1.2`** (*"pedir justificativa
  transformaria autonomia em burocracia"*), **`§10` item 8** o `B8` (o ajuste **no plano**, o mesmo
  mecanismo aplicado à fonte `aula-NN.md`) e **`§11`**.
- `REGISTRO.md:4862` — a entrada do `B7`, que **já havia decidido** o prazo declarado, o
  `HORAS_DE_RESSALVA = 48` e o rename `prazoDaAula` → `carimboDaAula`, **sem corrigir a `§5.1`** —
  é exatamente a pendência que esta entrada fecha.
- `HANDOFF.md:930` — o aviso do `:313`, que esta peça cumpre; `:920` — *"as redações antigas
  **não** foram apagadas (P-03/P-04): esta é a nota datada de que envelheceram"*.
- `tools/templates/lancamento.html:832-851` — a fonte do texto correto (prazo **declarado** = fixo;
  **ressalva** = 48 h contadas do último carimbo, só para ciclo que não declara o prazo);
  `:958-965` — `carimboDaAula()`; `:1269-1276` — a validação que **bloqueia** sem motivo e autor, com
  a justificativa citada na divergência declarada (`:1447` grava o `ultimo_lancamento` na raiz).
- `.github/skills/identidade-do-projeto/references/congelamento-e-registro.md:66-76` — o modelo
  literal da nota de correção datada e a licença P-03/P-04; `IDEIA-CAPTURA.md:29` e
  `REGISTRO.md:5285` — as duas outras formas da mesma convenção, praticadas no repositório.
- `CONGELAMENTO.md` — `ARQUITETURA-*.md` **não** está na lista de congelados; a lista cobre
  `PROTOCOLO.md`, `REGRAS.md`, `tools/`, `tools/templates/`, `prompts/`,
  `biblioteca/guia-do-professor.md` e `METODO.md`. **Nenhum deles foi tocado aqui**, e por isso esta
  entrada **não** tem seção de motivo declarado nem commit próprio de congelado.

**O que ainda não está feito.**

- **A divergência do motivo fica ABERTA por decisão, não por esquecimento.** O `§5.1` agora **diz**
  que o formulário exige motivo e autor; ele **não** deixa de exigir. Fechar a divergência é mexer no
  `lancamento.html` (congelado) — **a resolver quando o formulário for revisto**, e a decisão da
  pesquisadora foi explicitamente essa: alinhar o documento e **declarar** a divergência.
- **A varredura de deriva não foi estendida.** A autorização cobria **só a `§5.1`**. Ficam de fora,
  e ficam como estão: a **janela de detecção no `§3.3`** do `ARQUITETURA-AULA.md`;
  `tools/validar-dados-ciclo.js:505-516` (o comentário que segue dizendo que o `prazo` sai nulo — o
  `B7` já o produz); o `experimentos/captura-json/formulario.html`; e o **`B8`**. Nada disso foi
  tocado.
- **O `B8` — o ajuste no plano — continua não feito.** É a última das treze peças do `§10`, é o que o
  `podeAjustar()` espera, e é ele que unifica o ajuste do plano ao do lançamento. A `§5.1` agora
  aponta para ele como a peça que resolve a divergência — **o ponteiro existe; a peça, não**.
- **`podeAjustar()` continua fechado** (`tools/templates/lancamento.html:948`) e
  `lib-vistas.js:148-154` (`capturarDepois()`) continua sem chamador — os dois seguem como estavam
  na entrada do `B6`.
- **Nada foi regenerado além do `HANDOFF.md`, e nada foi commitado.** `ARQUITETURA-CAPTURA.md` não
  entra em pacote, âncora ou validador; as alterações ficam no worktree, junto das dezenas de outras
  frentes, e o commit depende de pedido explícito.

> **Correção de 27/09/2026 (mesmo dia).** Dois dos bullets acima **envelheceram** na mesma jornada.
> Corrigem-se aqui, como elo — o texto anterior **não é apagado** (P-03/P-04).
>
> 1. *"`tools/validar-dados-ciclo.js:505-516` (o comentário que segue dizendo que o `prazo` sai
>    nulo — o `B7` já o produz)"*. **Consertado.** O comentário dizia que *"o `ancora` **e o
>    `prazo`** saem nulos"*, o que era **falso desde o `B7`**. Ele hoje está em **`:516-518`** (o
>    arquivo cresceu) e diz o que é verdade: o **prazo é reportado, nunca afirmado** — quem o calcula
>    é o `ciclos.json`, a partir do calendário e do `horario` de cada aula (§3.1) — e só a `ancora`
>    sai nula enquanto não houver produtor. **Deixou de ser pendência.**
> 2. *"O `B8` — o ajuste no plano — continua não feito. É a última das treze peças do `§10`."*
>    **As duas afirmações envelheceram.** O `B8` **foi feito** em 27/09/2026 (entrada própria,
>    adiante neste arquivo), e o rótulo *"treze peças"* **não corresponde à §10**: lá são **dez
>    itens**, e a `B13` nunca foi um deles. Da §10, **as oito de implementação estão feitas**
>    (`ARQUITETURA-AULA.md:8-13`). O ponteiro do `§5.1` **e** a peça existem, ambos.
>
> O que **não** envelheceu nesta entrada: a *"divergência do motivo fica ABERTA por decisão"* —
> segue aberta, declarada em `ARQUITETURA-CAPTURA.md:23-33` — e a **varredura de deriva não
> estendida** (a janela de detecção do §3.3 e o `experimentos/captura-json/formulario.html` seguem
> fora). O bullet *"`capturarDepois()` … continua sem chamador"* **nunca se sustentou** e já foi
> retirado na correção da entrada do `B6`.

## 27/09/2026 — O ajuste no plano deixa de ser promessa: o elo do plano da aula, do schema ao guard do `pre-commit`

**O que motivou.**

O `ARQUITETURA-AULA.md` §1.2 fechou a doutrina — **o plano é a linha de base, e ele é intenção
até a aula acontecer**; depois disso, o que se ajusta é o registro, e o ajuste do plano é um elo
novo, nunca uma sobrescrita. A doutrina estava escrita e **nada a sustentava**: em `§10` a peça 8
(o `B8`) era a única das oito de implementação que faltava, o `§5.1` apontava para ela como "a peça
que resolve a divergência", e o `pre-commit` **não distinguia** plano antes × depois da aula —
editar o `aula-NN.md` de uma aula já lançada passava liso. A peça tinha quatro partes, e três delas
tocam arquivos congelados; entra aqui com o rito que o congelamento exige.

**O que foi decidido.**

- **O elo é anexado, não escrito à mão.** O bloco `## Ajuste do plano da aula NN` vai para o **fim**
  do `aula-NN.md` e ~~é o **próprio formulário** que o exporta (`exportarAjusteDoPlano`). O professor
  baixa o `.md`, anexa, e **o Git registra**. Ninguém transcreve ajuste — do mesmo jeito que o elo
  do lançamento já funcionava.~~ **Superado em 29/09/2026.** O exportador **não existe**:
  `exportarAjusteDoPlano` saiu do formulário na peça de 28/09/2026 (`17ed444`), com a barra
  `#acoes-plano` e o `mdAjusteDoPlano()` — a varredura dos três nomes no template volta **zero**. O
  elo do plano, hoje, **não tem produtor no formulário**: o que o professor baixa e anexa é o elo do
  **lançamento**. Quem sustenta a distinção é o guard `§2c` do `pre-commit`, que difere a fonte
  `aula-NN.md` contra o `HEAD` e não lê id nenhum de HTML. A redação antiga **não é apagada**: fica
  como o elo do que se mediu naquele momento.
- **O que já estava acima do elo não se toca.** O guard compara **o prefixo** (tudo antes do
  primeiro `## Ajuste do plano da aula `) com o do `HEAD`, e o elo do `HEAD` linha a linha. Prefixo
  diferente ⇒ **recusa**; elo anterior alterado ou removido ⇒ **recusa**; elo novo **anexado**
  depois do antigo ⇒ passa. É a §1.1 na forma executável.
- **Quem manda é o índice do PACOTE da variante, não o `.md`.** O estado é **derivado** (§1): lê-se
  `ciclos[].aulas[].lancada` do `ciclos.json` do pacote. **Uma fonte compartilhada alimenta todas as
  variantes do professor** (`tools/lib-fontes.sh`) — logo, se **qualquer** variante que ela alimenta
  está lançada, o acréscimo é exigido, e a mensagem **diz quais**.
- **A ausência de estado é aviso, nunca recusa.** Sem schema, sem índice ou sem `HEAD`: **aviso**.
  O hook não inventa uma trava que a fonte não sustenta.
- **Não bastava o `podeAjustar()`.** Ele é o relógio do **lançamento** (só se ajusta o que já foi
  lançado, e só dentro do prazo). O plano é o **outro** relógio — libera **antes** da aula. ~~Entrou
  `podeAjustarPlano()` (`lancamento.html:618`), e o comentário de `:612` registra por que os dois
  nunca ficam abertos ao mesmo tempo: o predicado dos dois é o mesmo estado derivado.~~ **Superado em
  29/09/2026.** O segundo relógio **saiu do formulário** na peça de 28/09/2026 (`17ed444`): nem
  `podeAjustarPlano()` nem o comentário de `:612` existem — as duas coordenadas são do estado
  pré-remoção. Do par resta **um** relógio na página, o do lançamento: `podeAjustar()` em **`:970`**,
  consumida em **`:1566`** (o `disabled` do botão) e **`:1572`** (o texto do aviso). O predicado
  compartilhado que o comentário descrevia **não está mais no formulário** — quem aplica os dois
  relógios é o guard `§2c` do `pre-commit`, sobre a fonte. A redação antiga **não é apagada**: fica
  como o elo do que se mediu naquele momento.
- **O antigo não se perde.** Antes de o gerador sobrescrever `plano-aula-NN.json`, o que estava lá
  vira **`plano-aula-NN-anterior.json`** — é esse par que o formulário compara para emitir o elo
  ("o ajuste não se declara, ele se **vê**"). A ordem `cp` → `mv` é deliberada: interrompida entre
  os dois, o anterior fica **igual** ao atual (o estado "sem elo"), e o que não se admite — o
  anterior virar cópia do novo — fica impossível.
- **O `-captura-aula-NN.md` fica fora.** É material de observação, não plano. E o `grep -v` não é
  precaução: a fonte **compartilhada** `ciclo-NN-captura-aula-NN.md` casa com o padrão do plano e
  seria lida como variante `captura`.

**Onde entrou.**

- `professores/fochini/ciclos/ciclo-01-aula-schema.json` e
  `professores/tiago/ciclos/ciclo-01-aula-schema.json` — **o schema da fonte `aula-NN.md`**, um por
  professor (como o do PO e o do plano). Gêmeos byte a byte: **68 linhas, 7641 bytes, md5
  `15fb13bca48c639b2ebdf23476a828f7`** nos dois.
- `tools/validar-aula-ciclo.js` — **novo**, 192 linhas: extrai as seções do `aula-NN.md`, valida
  contra o schema e sai em `--json` para o gerador.
- `tools/gerar-ciclo.sh` — o `plano-aula-NN.json` por aula, com o `-anterior.json` e o guarda de
  schema ausente; `CAP_FOLHAS` (§4.2) para não prometer `config` sem folha na fonte.
- `tools/templates/lancamento.html` — ~~a barra do ajuste do plano (`#acoes-plano`),
  `podeAjustarPlano()`, `mdAjusteDoPlano()` e `exportarAjusteDoPlano()`.~~ **Superado em 29/09/2026.**
  Os quatro **saíram** na peça de 28/09/2026 (`17ed444`), 273 linhas a menos, só deleções; a varredura
  dos três nomes e do id no template volta **zero**. O que a peça entregou de **durável** não morava
  na página: é o guard `§2c` do `pre-commit` (o bullet seguinte) e o par
  `plano-aula-NN-anterior.json` do `gerar-ciclo.sh`. A redação antiga **não é apagada**: fica como o
  elo do que se mediu naquele momento.
- `tools/hooks/pre-commit` — o bloco §2c, o guard do plano.
- `ARQUITETURA-AULA.md` (§1, §1.2, §3.1, §5, §10) e `ARQUITETURA-CAPTURA.md` — o estado de cada peça.

**Motivo declarado — os congelados.**

`tools/`, `tools/templates/` e `tools/hooks/` estão em `CONGELAMENTO.md`, e esta entrada é o motivo
declarado do que mudou ali. **O que NÃO muda:**

- **A fórmula de hash e a cobertura da âncora.** `tools/hash-ciclo.sh` não foi tocado nesta peça; o
  `.fipp` continua cobrindo os mesmos `ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e `ciclo-XX-*.md`.
- **Nenhum validador existente afrouxa.** `check-pacote.js`, `validar-po-ciclo.js`,
  `validar-plano-ciclo.js` e `validar-dados-ciclo.js` seguem como estavam. O `validar-aula-ciclo.js`
  é **novo** e não substitui nenhum: a validação do plano **do ciclo** (§4.1) continua sendo do
  `validar-plano-ciclo.js`.
- **Nenhuma regra e nenhuma pétrea muda.** `REGRAS.md` e `PROTOCOLO.md` não foram tocados. O que o
  `pre-commit` faz de novo é **aplicar** a §1.1/§1.2 que já estava escrita — não cria regra nova.
- **O caso nominal do congelamento** — *"alterar a estrutura de menu ou navegação"* — é da entrada
  da nav, não desta. Aqui não se mexeu em menu.
- **A decisão de comportamento é da pesquisadora** e está registrada: **opção A** — o formulário
  exporta o elo e o professor anexa; **o Git registra**. Não há script que escreva na fonte.

**Com o quê.**

| Verificação | Comando | Resultado real |
|:--|:--|:--|
| Os 7 planos de aula | `node tools/validar-aula-ciclo.js professores/fochini/ciclos/ciclo-01-aula-schema.json <fonte>` | **exit 0** nos 7 — `diaghilev` 01–05, `tiago/ciclo-01-aula-01.md` (compartilhada), `ritmos-aula-01.md` |
| Campos extraídos | idem | 10, 10, 10, 11, 11, 11, 7 — nenhum `[Preencher]` bloqueia |
| Avisos | idem | pré-existentes, **nunca** causam exit 1: `distribuicaoDoVolume` segunda tabela em todos; `só tem citação` no `guiaDeObservacao` (linha 218) em `ciclo-01-aula-01.md` |
| Gêmeos do schema | `md5sum` | `15fb13bca48c639b2ebdf23476a828f7` nos **dois**; 68 linhas / 7641 bytes cada |
| O par do elo existe | `ls professores/tiago/ciclos/ciclo-01-duo/` | `plano-aula-01.json` **e** `plano-aula-01-anterior.json` |
| Os 3 pacotes | `node tools/check-pacote.js professores/<p>/ciclos/ciclo-01-<escola>` | **0 erros** nos três. `diaghilev`: 0 avisos. `duo` e `ritmos`: 6 avisos cada, **pré-existentes** (5 × *"símbolo no glossário mas não usado no corpo"* e 1 × *"apanhado-historico.html: fora do menu"*) |
| O guard do plano, isolado | `/tmp/bloco2c.sh` sobre `/tmp/t2c-repo` (repo próprio, fonte de partida com elo) | **11 casos isolados** |
| O guard do plano, ponta a ponta | `git commit` real em `/tmp/integ2` (cópia do **worktree**, `git init` + commit de base + hook copiado para `.git/hooks/`) | **12 commits** — 2 aprovados, 3 recusas, 1 aviso sem schema, 1 aviso sem índice, ramo sem-estado confirmado |
| A recusa correta | e2e | com a fonte **compartilhada** editada e `duo` lançada, o hook **recusa** e nomeia a variante que obriga o acréscimo |
| O bug do `config` | `check-pacote.js` antes/depois | o gerador declarava `config: captura-aula-NN.json` para **toda** aula; corrigido com `CAP_FOLHAS` — **0 órfãos** nos três |

- `tools/validar-aula-ciclo.js` — 192 linhas; `MAPA_COLUNAS` **deliberadamente vazio** (os dialetos
  divergem: `Dimensão` no `fochini`, `Critério` no `tiago`); `required` é **só** `["identificacao"]`.
  ⚠️ **O modo de falha silenciosa ficou documentado:** `MAPA_SECOES` casa **literalmente** contra o
  título em minúsculas (`tools/lib-extracao-md.js:244-249`), e **um título fora do mapa não produz
  aviso** — ausência de aviso não é prova de que a seção foi lida.
- **O `pre-commit` tem 5 hunks** (`-U0`); o §2c é o `@@ -145,0 +171,138 @@`, e o `@@ -191,0 +355,35 @@`
  é o fecho. Os 2 primeiros hunks são o **cabeçalho de comentário** (a lista de seções passou de 6
  para 7 itens) — é o motivo declarado **em forma de comentário**, e vai **junto** com a peça 4.

**Referências.**

- `ARQUITETURA-AULA.md` — **§1.1** (*"o plano é a linha de base; ajustar antes da aula é autonomia,
  pedir justificativa transformaria autonomia em burocracia"*), **§1.2** (o ajuste no plano), **§2**
  (o cenário B), **§5** (*"distinguir plano antes × depois da aula"* — a razão declarada),
  **§8** (o que precisa descongelar), **§10** (as peças, na ordem — **a 8 fecha aqui**).
- `CONGELAMENTO.md` — `tools/`, `tools/templates/`, `prompts/`, `METODO.md`, `PROTOCOLO.md`,
  `REGRAS.md`, `biblioteca/guia-do-professor.md`; a exigência de motivo declarado + entrada +
  commit próprio.
- `.github/instructions/registro-md.instructions.md` — a estrutura desta entrada e a trava
  *"se a alteração muda **comportamento**, pare e confirme com o usuário"*.
- `tools/hooks/pre-commit:171-193` — **a razão declarada, em forma de comentário**, dentro do
  próprio arquivo congelado.
- `tools/gerar-ciclo.sh:239-258` — o porquê do `-anterior.json`; `:281`, `:472`, `:487` — o
  `ancora` nulo e o que ele significa.
- `REGISTRO.md:5961` — a entrada do `B6`, que é a doutrina do estado derivado e a **autorização
  imediatamente anterior** a esta; a **Correção de 27/09/2026** dentro dela retira as afirmações
  que o `B8` envelhece.
- `ARQUITETURA-CAPTURA.md:23-33` — os *três referentes* e os dois ajustes, agora com a nota datada.

**O que ainda não está feito.**

- **O `ancora` do índice continua `null` nas 38 aulas** — medido nos **três** `ciclos.json`
  (`diaghilev` 5, `duo` 12, `ritmos` 21). O `.fipp` por aula existe (§5, `B5`), mas o gerador **não
  o consulta**: `tools/gerar-ciclo.sh:472` escreve `'ancora': None` com o comentário *"sem produtor
  ainda"*. **A coluna é a promessa, não o estado.**
- **A `B13` — a `linha_de_base` por aluna — segue tolerada, não implementada.** O validador a aceita
  e ela **não tem regra de tipo** (`REGISTRO.md:4721`, `:4851`).
- **O `check-pacote.js` não tem portão de `estado`.** Ele valida a captura por aula, não o estado
  derivado; um pacote com estado estranho não é recusado por ele.
- **A divergência do *"Motivo do ajuste"* fica ABERTA por decisão.** O §1.1 e o formulário não
  dizem a mesma coisa sobre exigir motivo; alinhar é mexer no `lancamento.html` (congelado) —
  **a resolver quando o formulário for revisto**, e a divergência está **declarada** em
  `ARQUITETURA-CAPTURA.md:23-33`.
- **A varredura de deriva não foi estendida além do escopo autorizado.** Ficam de fora e ficam como
  estão: a **janela de detecção no §3.3** do `ARQUITETURA-AULA.md` e o
  `experimentos/captura-json/formulario.html`. **`ARQUITETURA-CAPTURA.md:23-33` e o `:50-53` foram
  reconciliados** nesta sessão (a nota datada e a mudança de *"seria implementado"* para
  *"contrato do que foi implementado onde há nota datada"*).
- **`capturarDepois()` nunca existiu** — `grep -c` devolve **0** em `tools/lib-vistas.js`, e
  `git log --all -S'capturarDepois'` volta vazio. Foi um nome citado de memória na entrada do `B6`;
  **retirado de todas as listas de pendência.**
- **O `B6` — o estado derivado — está pronto mas NÃO COMMITADO no mesmo worktree.** Esta entrada
  cobre a peça 8; o `lancamento.html` carrega **as duas frentes** e o commit dele tem de dizer isso.
- **Nada foi commitado.** As quatro peças ficam no worktree, junto das dezenas de outras frentes;
  o commit próprio de cada congelado — com `Refs:`/`Regras:`/`Auditoria:` — depende de pedido
  explícito.

## 27/09/2026 — A Aula 05 declara o método RAD e o ciclo ganha notação (P-15)

**O que motivou.**

A pesquisadora pediu uma aula de teste no ciclo do Diaghilev — o mesmo ciclo, uma aula a mais —
para verificar a **notação Benesh** numa aula de balé com *tendu*, *jeté*, *fondu* e braços
básicos. O pedido esbarrou numa regra que já estava escrita e **não estava sendo cumprida**:
a **P-15** manda que a notação siga a **metodologia declarada** — *"se a metodologia usa notação
(ex.: RAD usa Benesh), o ciclo gera o documento de notação naquela notação"* — e a **P-16** manda
declarar o par na eliciação. O Diaghilev declara **RAD** e **não tinha documento de notação
nenhum**: o `.conf` dizia, em comentário, que a ausência era deliberada porque o ciclo "não
declarou metodologia com notação". **A premissa do comentário era falsa** — é a mesma deriva que
já tinha sido corrigida no Ritmos em 19/09/2026 (`REGISTRO.md:652-668`), onde a referência dizia
*"nenhum sistema de notação foi adotado"* e o ciclo publicava o glossário.

Havia ainda um segundo problema, e era o que assustava mais: **a notação não escalava**. Se toda
aula de todo ciclo passar a ter Benesh, o menu "Planejamento" fica carregado de uma lista de
notações — uma por aula. A correção que a pesquisadora pediu não foi *"mais um documento"*, foi
**um filtro**: um só registro de notação por ciclo, que se **recorta por aula, por exercício,
por ciclo e por data**.

**O que foi decidido.**

- **A notação passa a ser um documento do CICLO, com filtro — não um documento por aula.** O
  `ciclo-01-notacao.md` é um só, e traz a **"Legenda completa (código do ciclo)"**; o que muda por
  aula é o **recorte**. Sem isso, a leitura por aula vira lista.
- **Os quatro estados do filtro, na redação canônica** (`ciclo-01-notacao.md:306-334`):
  - **nenhum campo preenchido** ⇒ *"Nenhum filtro foi aplicado"* e a legenda inteira aparece;
  - **data sem exercício** ⇒ *"Não existe(m) registro(s) de exercício(s) para essa data"*;
  - **filtro sem correspondência** (com data ou sem) ⇒ *"Nenhum exercício corresponde ao filtro
    aplicado."*;
  - **exercício sem aula e sem ciclo** ⇒ o próprio campo fica **desabilitado** —
    `var fe = (fc || fa) ? selEx.value : '';`. *"Ciclo contém aulas e exercícios; aula sem ciclo
    contém exercícios"* é a hierarquia, e ela está no código, não na prosa.
  - **Nenhum campo é obrigatório** — a regra é a de cima, e a lista de exercícios funciona por
    interseção: o que casa com **todos** os campos preenchidos sobrevive.
- **A data sai do calendário, nunca chumbada.** Este foi um ajuste pedido no meio da peça: a
  primeira redação tinha as datas fixas no arquivo, e a pesquisadora recusou — *"use o calendário"*.
  O filtro passou a montar a lista de datas de **duas fontes, ambas do planejamento**:
  `datasDoCalendario()` lê a **tabela `## Calendário do ciclo`** da própria página, e
  `datasDoPlanejamento()` lê `ciclos[].aulas[].data` do `ciclos.json` do pacote. **Nada é
  digitado.** As duas notações do Tiago receberam a **mesma** correção: perderam o `data:` do
  front matter e ganharam o marcador `<!-- CALENDARIO -->`.
- **As quatro estruturas que já existiam continuam existindo**, e são a espinha do registro:
  **`Blocos de categorias`** (7 itens), **`Direções e movimento`** (7) e **`Posições e lados`**
  (6) — as três da legenda, com o rótulo **exato** que a pesquisadora escreveu — e as **tabelas de
  exercício**, cada uma com o seu comentário em blockquote. O filtro **não as substitui**: ele as
  recorta (`montarGrupos()` reconstrói as caixas a partir dos sobreviventes).
- **A linha informativa fica ACIMA do filtro, e o "Como usar em aula" ABAIXO dos resultados.**
  Acima: *"Todos os sinais estão no [Glossário do código Benesh](glossario-benesh.html), verbete
  por verbete, com o significado, a origem e onde cada um aparece."* Abaixo: `## Como usar em aula`
  e `## Limites do registro`. A ordem é a lição, não o enfeite: primeiro **onde ler**, depois
  **filtrar**, depois **como usar**.
- **A Aula 05 é suplementar — ela não reabre o módulo.** O ciclo passa de 4 para 5 encontros, e o
  plano diz o que isso significa na redação canônica: *"é um módulo fechado de quatro encontros — o
  quinto é suplementar. A Aula 05 não reabre o módulo nem substitui nenhuma das quatro"*. **Nenhum
  marco se move**; é a P-17 no caso-limite.
- **A ordem dos `DOCS` é intencional e não é numérica.** `notacao` e `glossario-benesh` entram
  **antes** das páginas de aula, para que a *página anterior* de `notacao.html` seja `aula-05.html`
  — a leitura encadeada vai da aula para o registro. É desvio deliberado da ordem por número, e
  está comentado no `.conf`.

**Onde entrou.**

- `professores/fochini/ciclos/ciclo-01-notacao.md` — **novo**, 490 linhas. A legenda (§`Legenda
  completa (código do ciclo)`), o filtro, os **5 exercícios** registrados — 1.1 tendu · 1.2 tendu
  devant e derrière · 2.1 jeté · 3.1 fondu · 4.1 braços básicos, todos da Aula 05 —, `## Como usar
  em aula` e `## Limites do registro`.
- `professores/fochini/ciclos/ciclo-01-glossario-benesh.md` — **novo**, 202 linhas / **20
  verbetes**. `node tools/check-glossario.js ciclo-01-notacao.md ciclo-01-glossario-benesh.md` →
  **`20 símbolos no corpo, 20 verbetes`**, `exit 0` ⇒ o portão §2b do `pre-commit` passa.
- `professores/fochini/ciclos/ciclo-01-diaghilev-aula-05.md` — **novo**. O objetivo específico é
  literal: *"Syllabus RAD na barra — tendu, jeté e fondu — e braços básicos, com o exercício
  registrado em notação Benesh."* 60 minutos (Pré-requisito 4), volume ativo de 88 tempos.
- `professores/fochini/ciclos/ciclo-01.conf` e `ciclo-01-diaghilev.conf` — **`TOTAL_AULAS` 4→5**,
  **`OBJETIVO_GERAL` "quatro"→"cinco"**, e o **`DOCS`** com `aula-05 notacao glossario-benesh`
  (e o comentário da P-15/P-16 substituindo o que declarava a ausência).
- `professores/fochini/ciclos/ciclo-01-index.md` — as três ligações novas (`aula-05.html`,
  `notacao.html`, `glossario-benesh.html`) e *4 encontros* → *5 encontros*.
- `professores/fochini/ciclos/ciclo-01-plano.md` — a linha **`**05** | Suplementar…`**, a
  `**Duração**` e o critério de extensão.
- `professores/fochini/ciclos/ciclo-01-referencias.md` — a seção **`## Notação em Benesh`**:
  Mirzabekiantz (2000) e Parker (1990).
- `professores/tiago/ciclos/ciclo-01-notacao.md` e `ciclo-01-ritmos-notacao.md` — a **correção do
  calendário**, e só ela: o `data:` do front matter sai, o `<!-- CALENDARIO -->` entra. **O filtro
  é do `fochini`** — medido: `filtro-notacao` aparece **0** vezes nas duas notações do Tiago.
- Os pacotes regerados: `aula-05.html`, `notacao.html`, `glossario-benesh.html`,
  `plano-aula-05.json` (+ `-anterior.json`), `captura-aula-05.{html,json}` e as cópias
  `notacao.html` / `glossario-benesh.html` dos dois pacotes do Tiago.
- `professores/fochini/ciclos/ciclo-01-captura-schema.json` — os **dois blocos da Aula 05**
  (`Bloco 1 — Barra RAD`, com `tendu`/`jete`/`fondu`, e `Bloco 2 — Braços básicos e registro
  Benesh`). O material de observação da aula nova não é opcional: a captura é o que registra o que
  de fato se aplicou.
- `professores/fochini/ciclos/ciclo-01-diaghilev-aula-05.fipp` — a **âncora por aula** da aula nova
  (§5.2 do `ARQUITETURA-AULA.md`; o produtor é a `B5`, mas o elo é desta aula).

**Com o quê.**

`professores/fochini/ciclos/`: `ciclo-01-notacao.md` e `ciclo-01-glossario-benesh.md` (**novos**),
`ciclo-01-diaghilev-aula-05.md` (**novo**), `ciclo-01-captura-schema.json` (**novo** — o material de
observação da aula nova), `ciclo-01.conf`, `ciclo-01-diaghilev.conf`, `ciclo-01-index.md`,
`ciclo-01-plano.md`, `ciclo-01-referencias.md`, `ciclo-01-diaghilev-aula-05.fipp`;
`professores/tiago/ciclos/`: `ciclo-01-notacao.md` e `ciclo-01-ritmos-notacao.md` (a correção do
calendário); e os **três pacotes regerados**.

**Nada de `tools/` mudou por esta frente.** O `DOCS` do `.conf` é quem manda emitir as páginas — a
medida é `grep -n 'notacao\|glossario' tools/gerar-ciclo.sh`: só texto pré-existente.

**Referências.**

- `PROTOCOLO.md:106` — **P-15**, na redação canônica: *"Se a metodologia usa notação (ex.: RAD usa
  Benesh), o ciclo gera o documento de notação naquela notação. Se não usa notação formal, o ciclo
  **não gera** documento de notação — e declara a ausência com justificativa."*
- `PROTOCOLO.md:111` — **P-16** (metodologia e notação declaradas na eliciação); `:116` e `:120` —
  **P-17** (todo ciclo produz os mesmos tipos de artefato, *"e notação + glossário **quando a
  metodologia exigir**"*).
- `tools/check-glossario.js` — o validador que sustenta a exaustividade do par; o `pre-commit` §2b
  (`:146-166`) é o portão.
- Mirzabekiantz, Muriel. *Grammaire de la notation Benesh.* Paris: Centre national de la danse,
  2000 (132 p.). Parker, Rudolph. *Benesh Movement Notation: Elementary Solo Syllabus — Ballet
  Application.* Londres: Benesh Institute of Choreology.
- `REGISTRO.md:652-668` — a correção do Ritmos em 19/09/2026, **mesmo defeito e mesma regra**: é o
  elo anterior desta frente.

**O que ainda não está feito.**

- **A notação do `tiago` continua sem filtro.** A correção lá foi só a do calendário; o filtro
  existe **apenas** no `fochini`. Não há decisão tomada sobre estender — está declarado, não
  esquecido.
- **A `notacao.html` do `tiago` não é a mesma página do `fochini`.** Quando o filtro for estendido,
  é outra peça.
- **A entrada fica no worktree junto do resto.** O commit próprio desta frente — com
  `Refs:`/`Regras:`/`Auditoria:` — depende de pedido explícito.
- **Nada foi commitado.**

## 28/09/2026 — O índice do formulário saía sem a vírgula: a gravação passa a recusar índice inválido

**O que motivou.**

A pesquisadora usou o formulário de lançamento e trouxe o `ciclos.json` que ele baixou, pedindo
conferência contra o que existe no repositório. A comparação campo a campo mostrou **uma** diferença
de valor — `arquivo` apontando para o nome carimbado, que é o desenho do formulário — e **uma
diferença de forma**: no arquivo baixado, a linha de `"arquivo"` ficava **sem a vírgula** que a
separa de `"aulas": [`. O `JSON.parse` do próprio navegador recusava o arquivo: *"Expected ',' or '}'
after property value in JSON at position 914 (line 13 column 7)"*.

Não era artefato de cópia. O `indiceComArquivo()` do formulário localizava `"arquivo"`, achava o
`\n` seguinte e reescrevia **até o `\n`** — e a vírgula mora **antes** desse `\n`. Ela era consumida
e nunca reemitida. Enquanto `"arquivo"` foi a **última** chave do objeto do ciclo, a escrita saía
byte-correta e o defeito **não disparava**. Quando `"aulas": [` passou a vir depois dele, toda
gravação do formulário produzia um índice inválido.

**O que foi decidido.**

- **A vírgula é do TEXTO, não do valor.** O fix relê o trecho que está sendo substituído e reemite a
  vírgula **só se ela já estava lá** (`const virgula = …trimEnd().endsWith(',') ? ',' : '';`). A
  função **nunca inventa** uma vírgula: não há como ela criar JSON inválido por excesso, e a forma
  antiga (`arquivo` por último) sai **byte-idêntica** ao que saía antes. Essa preservação é medida,
  não afirmada: o harness compara, para a ordem com `arquivo` por último, a saída do código novo com
  a do código anterior — **iguais**.
- **O índice passa a ter o mesmo guard do arquivo de dados.** O `gerarJson()` já validava o
  `-dados.json` com `JSON.parse` antes de baixar; o índice saía sem essa conferência. Agora o
  índice é calculado, submetido a `JSON.parse` e **só então** liberado. A guarda roda **antes** das
  mutações em memória (`f.dados`, `f.texto`, `f.meta.arquivo`) e **antes** dos dois `baixar` — de
  modo que um índice inválido aborta com **zero download e zero mutação**, a mesma semântica do
  guard que já existia. A mensagem segue a forma do irmão: `não gerei: o índice sairia inválido (…)`.
- **A atribuição fica registrada com a correção.** O defeito foi **escrito** em `e5c45ae`
  (*"o formulário de lançamento vai para produção"*), mas nasceu **adormecido**: naquele commit o
  índice `ciclos.json` **não existia** no repositório, e a ordenação que o manteve inofensivo
  sobreviveu a vários commits. Ele foi **acordado** quando `"aulas": [` entrou no índice gerado —
  e o primeiro commit cujo índice realmente carrega `aulas[]` é **`85844c1`**, desta mesma série
  (`feat(notacao): …`). O `tools/gerar-ciclo.sh` é quem fixa a adjacência que acorda o defeito:
  `'arquivo'` e `'aulas'` são chaves vizinhas no dicionário do ciclo. Não é falha da frente da
  notação — é defeito latente que uma mudança legítima de forma expôs. Registrar assim é o que
  mantém a proveniência honesta: o elo diz o que se pensou **antes**, não o que convém agora.
- **O defeito era vivo nos três pacotes.** Cada índice dos três ciclos tem uma ocorrência de
  `"aulas":` — `diaghilev`, `duo` e `ritmos` estavam todos sujeitos.
- **O `indiceComArquivo()` é o escritor único do índice.** A varredura mostra uma única chamada
  (`:1702`) e uma única escrita (`:1715`); o bootstrap da página apenas **lê** o arquivo
  (`JSON.parse` em `:1962`, já sob `rIndice.ok`). Não há segunda rota a corrigir.

**Onde entrou.**

- `tools/templates/lancamento.html` — `indiceComArquivo()`, agora `:1646-1660`: a vírgula é lida do
  trecho substituído e reemitida. E `gerarJson()`, agora `:~1701-1715`: `novoNome` e `indiceNovo`
  subiram **para antes** das mutações em memória, com o `try { JSON.parse(indiceNovo) } catch` que
  aborta sem efeito.
- `professores/fochini/ciclos/ciclo-01-diaghilev/lancamento.html`,
  `professores/tiago/ciclos/ciclo-01-duo/lancamento.html`,
  `professores/tiago/ciclos/ciclo-01-ritmos/lancamento.html` — as **três cópias empacotadas**, regeradas.

**Motivo declarado — os congelados.**

`tools/templates/` está em `CONGELAMENTO.md`, e esta entrada é o motivo declarado do que mudou no
formulário. **O que NÃO muda:**

- **A fórmula de hash e a cobertura da âncora.** `tools/hash-ciclo.sh` não foi tocado; o `.fipp`
  continua cobrindo os mesmos `ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e `ciclo-XX-*.md`. Nenhuma
  fonte de ciclo mudou — `lancamento.html` **não** entra em `fontes_do_ciclo()`, e as três âncoras
  seguem **exatamente** as de antes.
- **Nenhum validador afrouxa.** `check-pacote.js`, `validar-po-ciclo.js`, `validar-plano-ciclo.js`,
  `validar-dados-ciclo.js`, `check-glossario.js` e `check-identidade.js` seguem como estavam; esta
  peça não os toca.
- **Nenhuma regra e nenhuma pétrea muda.** `REGRAS.md`, `PROTOCOLO.md` e `CONGELAMENTO.md` não foram
  tocados. O que muda é **como** o formulário grava, não o que ele promete gravar: o carimbo no nome
  do arquivo, o `arquivo` do índice apontando para o vigente e a proveniência pelo commit continuam
  sendo o desenho declarado.
- **O caso nominal do congelamento** — *"alterar a estrutura de menu ou navegação"* — não é desta
  peça: não se mexeu em menu.
- **A decisão de comportamento é da pesquisadora**, e foi pedida antes de escrever: as duas
  alterações foram autorizadas em separado — a correção da vírgula e, na mesma frente, a guarda do
  índice — depois de apresentado o motivo declarado.

**Com o quê.**

| Verificação | Comando | Resultado real |
|:--|:--|:--|
| A função, extraída **do template** | `/tmp/prova5.js` — `eval` do trecho lido do arquivo, 3 ordens de chave | as 3 saem `JSON VALIDO` **com o valor aplicado** |
| Controle negativo, **o mesmo insumo** | idem — o código **anterior** sobre a forma do repositório | `INVALIDO -> Expected ',' or '}' after property value in JSON at position 914 (line 13 column 7)` — **a mensagem exata da pesquisadora** |
| Não-regressão da forma antiga | idem — ordem com `arquivo` por último | saída do fix **===** saída anterior (`true`) |
| A guarda, na cópia **empacotada** | `/tmp/prova6.js` — função extraída de `professores/fochini/…/lancamento.html` | caminho feliz: **2 downloads**, valor aplicado. Índice inválido: **aborta**, `baixados=[]`, `texto` e `meta.arquivo` **intactos** |
| O fix chegou aos três pacotes | `grep -c 'const indiceNovo'` nas três cópias | **1** em cada |
| As três âncoras | `tools/hash-ciclo.sh <prof> 01 <escola> --check` | **exit 0** nos três; `a05f05c0…` (diaghilev), `8bba2c5e…` (duo), `4175cdf1…` (ritmos) — **inalteradas** |
| Os três pacotes | `node tools/check-pacote.js` | diaghilev **0 erros, 0 avisos**; duo e ritmos **0 erros, 6 avisos** (pré-existentes) |
| A identidade visual | `node tools/check-identidade.js` | **exit 0** — Contraste, Cópia única, Deck e Circuito, os quatro `ok:` |
| O escritor único | `grep -n 'indiceComArquivo'` e `baixar('ciclos.json'` | **1** chamada (`:1702`), **1** escrita (`:1715`); a leitura em `:1962` |

- **O churn da regeração foi descartado, não commitado.** Rodar o gerador reescreve `gerado_em` e o
  `-dados.json` cifrado (IV aleatório) e o acompanhamento minificado — nada disso é desta peça. As
  três cópias corrigidas foram preservadas em `/tmp`, o resto voltou com `git checkout --
  professores/`, e as cópias foram repostas. O `diff --numstat` de cada `lancamento.html` é só o
  fix.
- **`SOURCE_DATE_EPOCH` não pinar `gerado_em`** — daí o churn ser esperado e não perseguido.

**Referências.**

- `tools/templates/lancamento.html` — `indiceComArquivo()` e `gerarJson()`; o irmão bem-comportado é
  `camposNaRaiz()` (`:1629`), que já preservava a vírgula pela captura `(,?)`.
- `tools/gerar-ciclo.sh` — o dicionário do índice, com `'arquivo'` e `'aulas'` vizinhos: é a
  adjacência estrutural que acorda o defeito. E a linha `ARQUIVO="ciclo-…-dados.json"` — o gerador
  **nunca** carimba o nome; o carimbo é do formulário.
- `tools/check-pacote.js` — o validador do pacote, e `check-identidade.js` — o §5 do `pre-commit`.
- `REGISTRO.md:5856` — a outra frente que mexeu no mesmo formulário (*"A nav sai uma vez: o
  formulário deixa de ser a única página com o `id` dela duplicado"*): lá o problema era `id`
  duplicado, aqui é JSON inválido. É o elo anterior desta família.

**O que ainda não está feito.**

- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** É congelado, a
  alteração é anterior a esta frente, e nenhuma entrada a reivindica — precisa de motivo próprio ou
  de reversão. Está declarado, não esquecido.
- **A causa de raiz do carimbo não mudou de dono, e não precisa:** o `arquivo` carimbado é por
  desenho. A consequência prática continua valendo — o índice baixado aponta para um arquivo que
  **ainda não existe** no repositório até o commit da gravação, e até lá o ciclo responde 404.

## 28/09/2026 — O formulário baixa **dois** arquivos, e o texto passa a dizer isso

**O que motivou.**

A pesquisadora enviou o formulário, trouxe o `ciclos.json` que ele baixou e perguntou: *"por que o
xml não tem os campos que preenchi? para onde foram os dados? e por que precisa gerar o xml para o
usuário?"* A medição respondeu as duas primeiras: **os dados não se perderam** — o lançamento está
no `~/Downloads/ciclo-01-diaghilev-dados-2026-09-28T0840.json` (2963 B, 28/09 08:40:32, **em claro**,
a aula 01 com as onze chaves de aula), e o índice baixado (`ciclos (10).json`, 2949 B, 08:40:41) é
**inválido** e **anterior** à correção `84bc1db` — é forma do código antigo, não defeito novo.

Mas a pergunta que sobrava era a terceira, e ela não era sobre JSON: era sobre **quantos arquivos o
botão baixa**. O texto de apoio dizia *"baixa o JSON **do ciclo inteiro** com esta aula dentro"* — um
arquivo. E o botão baixa **dois**: o JSON de dados carimbado e o `ciclos.json`. Quem lê *"baixa o
JSON"* e abre **o** arquivo do índice não encontra lá o lançamento — porque o índice guarda
metadados de aula, **nunca** o lançamento. A dúvida *"não tem os campos que preenchi"* nasce daí.

**O que foi decidido.**

- **O rótulo do botão fica como está** — `Gerar JSON atualizado`. A pesquisadora decidiu manter, e a
  pergunta escolhida foi a outra: ajustar o **texto de apoio**. Renomear o botão para `Enviar` não
  cabe: não há servidor, e nada é enviado a lugar nenhum — o que sai é arquivo para o professor
  commitar.
- **O texto passa a declarar os dois arquivos e o papel de cada um** — o JSON de dados guarda o
  lançamento; o `ciclos.json` é o índice e passa a apontar para aquele nome. E fica dito que os dois
  vão para o **repositório**, não para a pasta de downloads.
- **A cauda é preservada palavra a palavra:** *"a proveniência do JSON é o commit, não um carimbo
  dentro dele"* — é a regra que a redação anterior já carregava, e ela não muda.

**Onde entrou.**

- `tools/templates/lancamento.html` — o `span.fraco` do bloco de exportação, agora `:155-162` (era
  `:155-157`). O rótulo do botão (`:154`) e a mensagem de `gerarJson()` **não** foram tocados.
- `professores/fochini/ciclos/ciclo-01-diaghilev/lancamento.html` (`:210`),
  `professores/tiago/ciclos/ciclo-01-duo/lancamento.html` (`:209`),
  `professores/tiago/ciclos/ciclo-01-ritmos/lancamento.html` (`:210`) — as **três cópias
  empacotadas**, regeradas.

**Motivo declarado — os congelados.**

`tools/templates/` está em `CONGELAMENTO.md`, e esta entrada é o motivo declarado do que mudou no
formulário. **O que NÃO muda:**

- **A fórmula de hash e a cobertura da âncora.** `tools/hash-ciclo.sh` não foi tocado; o `.fipp`
  continua cobrindo os mesmos `ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e `ciclo-XX-*.md`.
  `lancamento.html` **não** entra em `fontes_do_ciclo()`, e as três âncoras seguem **exatamente** as
  de antes — medidas, não supostas (tabela abaixo).
- **Nenhum validador afrouxa.** `check-pacote.js`, `validar-po-ciclo.js`, `validar-plano-ciclo.js`,
  `validar-dados-ciclo.js`, `check-glossario.js` e `check-identidade.js` seguem como estavam; esta
  peça não os toca.
- **Nenhuma regra e nenhuma pétrea muda.** `REGRAS.md`, `PROTOCOLO.md` e `CONGELAMENTO.md` não foram
  tocados. O que muda é **o que o formulário declara baixar**, não o que ele baixa: as duas chamadas
  `baixar()` e seus destinos já eram os do desenho — o texto é que contava um arquivo só.
- **O caso nominal do congelamento** — *"alterar a estrutura de menu ou navegação"* — não é desta
  peça: não se mexeu em menu.
- **É redação, não comportamento.** Nenhuma linha de JavaScript mudou; a alteração é de texto
  visível. A decisão foi pedida antes de escrever.

**Com o quê.**

| Verificação | Comando | Resultado real |
|:--|:--|:--|
| O texto novo chegou nas **quatro** cópias | `grep -c 'baixa <strong>dois</strong> arquivos'` | **1** em cada (`:155`, `:210`, `:209`, `:210`) |
| O diff é só a redação | `git diff --numstat` | **6/3** em cada um dos quatro arquivos — nada mais |
| Nada além dos quatro foi tocado | `git status --porcelain` | os 4 `lancamento.html` + o `prompts/eliciar-ciclo.md` pré-existente + `po_ref/` não versionado |
| As três âncoras | `tools/hash-ciclo.sh <prof> 01 <escola> --check` | **exit 0** nos três; `a05f05c0…` (diaghilev), `8bba2c5e…` (duo), `4175cdf1…` (ritmos) — **inalteradas** |
| Os três pacotes | `node tools/check-pacote.js` | diaghilev **0 erros, 0 avisos**; duo e ritmos **0 erros, 6 avisos** (pré-existentes) |
| A identidade visual | `node tools/check-identidade.js` | **exit 0** |

- **O churn da regeração foi descartado, não commitado** — mesmo procedimento da entrada anterior. A
  regeração suja **20** arquivos gerados (`ciclos.json` × 3 só com `gerado_em`; `-dados.json` × 3
  com o cifrado; `.pdf` × 3; `acompanhamento-*.html` × 10 com o blob `data-i`), **todos sem conteúdo
  novo**. As três cópias corrigidas foram preservadas em `/tmp/cap-b4`, o resto voltou com
  `git checkout -- professores/`, e as cópias foram repostas — sha256 conferido antes e depois.
- **⭐ Achado novo, declarado e NÃO tratado: o gerador não é determinístico.** Medido com
  `sha256sum` → `tools/gerar-ciclo.sh fochini 01 diaghilev` → `sha256sum`: o mesmo `-dados.json` sai
  `a8ef59d9…` numa rodada e `110abab2…` na seguinte. A causa é o IV aleatório de `cifrar-dados.js`
  (`tools/gerar-ciclo.sh:540-556`). **Consequência prática:** propagar **qualquer** mudança de
  template suja os artefatos selados, e commitar isso seria ruído que **parece** mudança de
  conteúdo. **Não se mexeu em `tools/`** para "consertar": a cifra é comportamento congelado, e
  pinar o IV mudaria a cadeia de âncoras. Fica declarado como nota operacional.
- **`SOURCE_DATE_EPOCH` não pinar `gerado_em`** — daí o churn do índice ser esperado e não
  perseguido.

**Referências.**

- `tools/templates/lancamento.html` — o bloco de exportação (`:145-175`); `baixar()` em `:972`;
  `gerarJson()` em `:1663-1730`, com as **duas** chamadas `baixar()` em `:1714` e `:1715`.
- `ARQUITETURA-CAPTURA.md:240-262` (§3.3) — *"Baixa o JSON novo e o índice atualizado"*: o desenho já
  dizia **dois** arquivos. É o documento que o texto de apoio agora cumpre.
- `ARQUITETURA-CAPTURA.md:385-391` — o precedente `dados-exemplo-2026-09-20T1430.json` e a nota
  *"sem servidor, ele pode ter ido para a pasta de downloads do navegador"* — que é **o que de fato
  aconteceu** com o lançamento da pesquisadora.
- `ARQUITETURA-CAPTURA.md:599-601` (§7.3) — a decisão *"sem servidor, ou exige backend: **mantém**"*:
  é ela que impede renomear o botão para `Enviar`.
- `tools/check-pacote.js:381` — o validador **recalcula** o nome do arquivo de dados a partir da
  variante e **nunca lê o `"arquivo"` do índice**; os dois podem divergir sem aviso. Declarado, não
  corrigido (é comportamento congelado).
- `tools/check-pacote.js:375-440` — o validador que decifra e compara com `fonte_dados()`.
- `REGISTRO.md:6585` — a entrada anterior, do mesmo formulário: lá o defeito era o JSON inválido;
  aqui é o texto que contava um arquivo só.

**O que ainda não está feito.**

- **O lançamento da pesquisadora ainda não está no repositório.** O
  `~/Downloads/ciclo-01-diaghilev-dados-2026-09-28T0840.json` precisa chegar a
  `professores/fochini/ciclos/` — com o carimbo e no nome estável de `fonte_dados()` — junto do
  `ciclos.json` corrigido, e então regerar. **Isso moverá a âncora do diaghilev, e corretamente.**
  Não é desta peça, e não foi feito sem autorização.
- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** É congelado, a
  alteração é anterior a esta frente, e nenhuma entrada a reivindica — precisa de motivo próprio ou
  de reversão. Está declarado, não esquecido.
- **`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda ignorada"* — a
  medição mostra que não cai** (a regex é ancorada em `$`). É arquivo livre, então a correção é
  barata; não foi feita nesta peça.

## 28/09/2026 — O botão passa a ser `Salvar`, e o arquivo vai para a pasta do ciclo

**O que motivou.**

A pesquisadora leu o texto de apoio que a entrada anterior (`:6705`) tinha acabado de escrever e
respondeu com a objeção que aquela entrada **não havia escutado**: *"Não é para entregar no Download
do usuário o XML pois ele não sabe o que é isso. Basta Enviar os dados fornecidos no preenchimento do
formulário lancamento.html faça o ajuste: Mudar o nome do botão e não fazer o download do xml para o
usuário"*. E, separando o essencial do acessório: *"Vc não respondeu as minhas perguntas. E o botão
continua com o nome Gerar JSON atualizado."*

A entrada anterior tinha medido **quantos** arquivos o botão baixa e ajustado **o texto** — mas deixou
**o rótulo** e **o destino** intocados, por ler a §7.3 de `ARQUITETURA-CAPTURA.md:599-601`
(*"sem servidor, ou exige backend: **mantém**"*) como proibição de mexer em qualquer coisa. A medição
mostra que a §7.3 mantém **o desenho** (não haver servidor nem backend), não **o lugar** onde o
arquivo cai: o File System Access API grava no disco a partir da página, sem backend nenhum. O que a
decisão anterior protegia era o desenho; o que ela deixou de pé foi o download na pasta do usuário —
que é justamente o que a pesquisadora recusa.

> **Nota de 29/09/2026.** A medição acima descrevia o estado **de então**: o File System Access API
> gravava no disco a partir da página, e não havia backend nenhum. **O Passo 0 mudou isso** — a
> Function `netlify/functions/receber.js` passou a escrever o lançamento no **servidor**, e o
> formulário deixou de exportar para a máquina do professor. A redação acima **não é apagada**: fica
> como o elo do que se mediu em 28/09/2026, antes de o transporte existir.

**O que foi decidido.**

- **O rótulo passa a ser `Salvar`.** A pesquisadora recusou `Enviar` — *"Coloca o nome Salvar pois é
  mais coerente do que Enviar"* — e a coerência é exata: nada é enviado a lugar nenhum; o que
  acontece é gravação local, seguida do **commit de quem lê**.
- **O par de arquivos passa a ir para a pasta do ciclo**, escolhida no seletor do navegador, e **não**
  para a pasta de downloads: o nome é estável e o carimbo vive no índice, então a página escreve no
  lugar do arquivo antigo, ao lado das fontes.
- **O `id` interno continua `gerar-json`.** O rótulo é contrato de gente; o `id` é contrato de teste.
  `experimentos/captura-json/teste.js` clica `els['gerar-json']` em **oito** pontos (`:318`, `:422`,
  `:443`, `:526`, `:550`, `:717`, `:742`, `:752`): renomear o `id` por causa de um rótulo quebraria a
  rede de regressão inteira.
- **O texto de apoio encolhe a duas linhas, e o parágrafo que a pesquisadora mandou apagar sai.** O
  trecho *"os dois vão para o **repositório**, não para a pasta de downloads"* (`:6728-6730`) **não
  está mais no texto visível** — nem no cabeçalho, nem no `summary`, nem na legenda, nem na mensagem
  pós-salvamento. A pesquisadora cortou a explicação no mesmo pedido em que pediu o rótulo novo.

**Onde entrou.**

`tools/templates/lancamento.html` — **um** arquivo. O diff contra `HEAD` são **63 inserções / 27
remoções**, em **onze hunks** (`git diff -U0`):

```
@@ -101,2  +101,2   @@  cabeçalho: "baixa" → "salvo na pasta do ciclo que você escolher"
@@ -150     +150     @@  summary: "Lançar uma aula (salva no JSON)"
@@ -154,7   +154,3   @@  <button id="gerar-json">Salvar</button> + legenda de 2 linhas
@@ -200     +196,2   @@  comentário do propósito da página: o que ela salva vai para a pasta
@@ -973,0   +971,27  @@  <-- O NOVO: `let pasta` (:974) + `gravarNaPasta()` (:980)
@@ -1011,2  +1035,2  @@  comentário da captura: "baixa" → "salva" (§3 do IDEIA-CAPTURA)
@@ -1662,4  +1686,4  @@  comentário §3.3: SALVA na pasta escolhida → o commit é de quem lê
@@ -1688,2  +1712,2  @@  a razão do download, reescrita
@@ -1717,3  +1741,16 @@  o bloco de escrita: `gravarNaPasta` + o fallback declarado
@@ -1722,3  +1759    @@  o `dizer()` de fechamento, encurtado
@@ -1958,2  +1993,3  @@  `trocarCiclo`: quem escreve no disco é o File System Access
```

As linhas, medidas no arquivo já alterado (**2088** linhas, era **2052**):

- **`:154`** — *a* mudança pedida: `<button id="gerar-json" type="button">Salvar</button>`. O `id`
  fica; **só o rótulo mudou**. **`:155-156`** é a legenda que sobrou: *"o ciclo com esta aula dentro,
  na pasta do ciclo — e só entra no Git quando você commitar."*
- **`:101-102`** — o cabeçalho da **Área do Professor**: *"o lançamento é **salvo** na pasta do ciclo
  que você escolher: a página grava, mas **não commita** — o commit é seu."*
- **`:197`** — o comentário do propósito da página: *"O que ela salva (o lançamento) vai para a pasta
  do ciclo que o professor escolher, ao lado de tudo isso."*
- **`:971-995`** — o corpo novo. `:971-973` o comentário da pasta escolhida **uma vez por carga**;
  `:974` `let pasta = null;` (escopo de módulo, é o cache); `:976-979` a razão do `false` que nunca
  lança; `:980` `async function gravarNaPasta(arquivos)`; `:981` a guarda
  `if (!globalThis.showDirectoryPicker || !globalThis.isSecureContext) return false;`; `:983` o
  `showDirectoryPicker({ id: 'ciclo', mode: 'readwrite' })`; `:984-985` `queryPermission` e
  `requestPermission` (`readwrite`); `:986-991` o laço `getFileHandle(create: true)` →
  `createWritable()` → `write(new Blob(...))` → `close()`; `:992` `return true`; `:993-995`
  `catch (e) { return false; }` — *"AbortError do seletor, ou falha de escrita no disco"*.
- **`:1741-1759`** — onde a gravação acontece. `:1741-1742` a ordem: **o arquivo de dados primeiro**
  (*"se o índice chegasse ao disco apontando para um arquivo que não está lá, a próxima abertura da
  página leria um ciclo inexistente"*); `:1743-1746` o vetor `arquivos` (`novoNome` e `ciclos.json`);
  **`:1747`** `const gravou = await gravarNaPasta(arquivos);`; `:1748-1750` o comentário do recuo;
  **`:1751`** `if (!gravou) arquivos.forEach((a) => baixar(a.nome, a.texto, a.tipo));`;
  **`:1752-1755`** o `onde` — *"salvo na pasta do ciclo"* **ou** o
  `<span class="erro">este navegador não escreve na pasta — os arquivos foram para a pasta de
  downloads: mova-os para a pasta do ciclo, no lugar dos antigos</span>`; `:1756-1759` o `dizer()`.
- **`:1035-1038`** — o comentário da captura: *"lança → atualiza o JSON em memória → salva →
  commita"* (era *"baixa"*).
- **`:1686-1689`** — o comentário do §3.3: *"SALVA o arquivo do ciclo na pasta escolhida → o commit é
  de quem lê"*.
- **`:1993-1995`** — `trocarCiclo`: *"Não há servidor: quem escreve no disco é o File System Access,
  na pasta que o professor escolhe — e, onde ele não existir, o par desce como download."*

**Motivo declarado — os congelados.**

`tools/templates/` está em `CONGELAMENTO.md`, e esta entrada é o **motivo declarado** da peça. O
próprio `CONGELAMENTO.md` manda *"diga **o que não muda**"* e, se a alteração muda **comportamento**
(e não só redação), *"pare e confirme com o usuário"*. **A alteração muda comportamento** — e isso
não é suposição, é a decisão que a pesquisadora tomou: ela escolheu, entre as opções apresentadas, a
**opção (a)** — gravar na pasta pelo File System Access, com o rótulo `Salvar`. A confirmação que a
regra exige **existe e está datada**; a entrada anterior afirmava o contrário, e é corrigida adiante.
**O que NÃO muda:**

- **A fórmula de hash e a cobertura da âncora.** `tools/hash-ciclo.sh` não foi tocado. Medido, não
  suposto: o `.fipp` do diaghilev cobre **21 caminhos** e `grep -c "lancamento"` neles dá **0** —
  `lancamento.html` **não** entra em `fontes_do_ciclo()`. As três âncoras seguem **exatamente** as de
  antes, e `--check` sai **exit 0** nos três.
- **Nenhum validador afrouxa.** `check-pacote.js`, `validar-po-ciclo.js`, `validar-plano-ciclo.js`,
  `validar-dados-ciclo.js`, `check-glossario.js` e `check-identidade.js` seguem como estavam.
- **Nenhuma regra e nenhuma pétrea muda.** `REGRAS.md`, `PROTOCOLO.md` e `CONGELAMENTO.md` não foram
  tocados.
- **O caso nominal do congelamento** — *"alterar a estrutura de menu ou navegação"* — não é desta
  peça: não se mexeu em menu. O rótulo do botão e a gravação não são estrutura de navegação.
- **A regra da proveniência não se perdeu — mudou de casa.** A entrada anterior guardou a cauda
  *"a proveniência do JSON é o commit, não um carimbo dentro dele"* como texto **visível**. Ela sai do
  texto visível (a pesquisadora cortou a explicação), mas a regra continua **escrita no próprio
  arquivo**, no comentário de `:1605`: *"o commit — que é a proveniência do JSON — viraria um diff
  ilegível"*. O que saiu foi a explicação ao professor; a regra ficou onde governa o código.

**Com o quê.**

| Verificação | Comando | Resultado real |
|:--|:--|:--|
| O rótulo novo chegou | `grep -c '>Salvar<'` | **1** no template; **0** em cada uma das três cópias — *ainda não propagadas* |
| O rótulo velho saiu | `grep -c 'Gerar JSON atualizado'` | **0** no template; **1** em cada cópia (stale) |
| O `id` **não** foi renomeado | `grep -rn 'salvar-json'` | **0** ocorrências em todo o repositório |
| O tamanho do diff | `git diff --numstat` | **63 / 27** em `tools/templates/lancamento.html` |
| O script embutido continua válido | `new vm.Script(<script>)` | **1 script, OK** |
| O formulário real roda em Node | `node experimentos/simulacao-marau/simular-formulario.js` | **exit 0** |
| O caminho FSA grava e devolve `true` | `sonda-gravar.js fsa` | **verde** (stub de `showDirectoryPicker`; 1 seletor para 2 cliques) |
| O recuo por download ainda funciona | `sonda-gravar.js download` | **verde** |
| O caminho real no navegador | Chromium headless via CDP | **tudo verde**, inclusive `condicoes_contorno` |
| O recuo se **declara** | Firefox 156.0.1 | `showDirectoryPicker` **undefined**; rótulo `Salvar`; a mensagem diz que o par desceu |
| A rede de regressão | `node experimentos/captura-json/teste.js` | **exit 1** em `caso 2` — **pré-existente, provado** (ver abaixo) |
| As três âncoras | `tools/hash-ciclo.sh <prof> 01 <escola> --check` | **exit 0** nos três; `a05f05c0…`, `8bba2c5e…`, `4175cdf1…` — **inalteradas** |
| A identidade visual | `node tools/check-identidade.js` | **exit 0** (a tabela de `:123` já listava o template) |

- **⭐ O `teste.js` já falhava antes — e foi provado, não argumentado.** O harness morre em `caso 2`
  com `TypeError` dentro de `carimboDaAula`/`render`, alcançado por `trocarCiclo` (`teste.js:139`):
  a fixture "todos os ciclos" traz `f.dados = null` e o código lê `f.dados.aulas`
  (`lancamento.html:1009`, `:1633`, `:1769`). Rodei o **harness de base** contra o template de `HEAD`
  (`lancamento-baseline.html`, cópia fiel de `6cf847e`) e ele morre **no mesmo `caso 2`**, com o mesmo
  erro; os `caso 1` e `1b` passam nos dois. **Não é regressão desta peça, e não foi "consertado"
  aqui** — consertar a fixture seria mudar a rede para acomodar a peça, que é o contrário do que ela
  serve para fazer.
- **A gravação é uma só por carga, e a ordem importa.** O `pasta` é cache de módulo (`:974`), então o
  seletor abre **uma vez** e os salvamentos seguintes reusam a pasta — medido: dois cliques, um
  seletor. E o arquivo de dados é escrito **antes** do índice (`:1741-1746`): se a página falhasse no
  meio, o índice nunca apontaria para um arquivo ausente.
- **`globalThis`, não `window`** — os dois harnesses de Node (`teste.js` e `simular-formulario.js`)
  fazem `eval()` do template, onde `window` não existe. Com `window`, o helper lançaria no harness.
- **O recuo é obrigatório, não gentileza.** Firefox e Safari **não têm** `showDirectoryPicker`; sem o
  `baixar()` de `:1751` a peça tiraria do professor o único transporte que ele tinha. O recuo
  **declara-se** (`:1752-1755`): o professor não pode descobrir na pasta errada que o arquivo não
  chegou onde ele esperava.

**Referências.**

- `tools/templates/lancamento.html` — o botão em `:154`; `baixar()` em `:972` (preservado: serve o
  `.md` e o recuo); `gravarNaPasta()` em `:980-996`; `gerarJson()` a partir de `:1690`, com o bloco de
  escrita em `:1741-1759`; a regra da proveniência em `:1605`.
- `CONGELAMENTO.md` — a lista que inclui `tools/` e `tools/templates/`; a exigência de motivo
  declarado, entrada no `REGISTRO.md` e **commit próprio**; e a cláusula *"se a alteração muda
  comportamento… pare e confirme"*, que é o que a opção (a) da pesquisadora satisfaz.
- `ARQUITETURA-CAPTURA.md:599-601` (§7.3) — a decisão *"sem servidor, ou exige backend: **mantém**"*.
  Continua valendo **para o desenho**; o que ela não diz é que o arquivo tenha de cair na pasta de
  downloads. É a distinção que a entrada anterior não fez.
- `ARQUITETURA-CAPTURA.md:385-391` — o precedente do `dados-exemplo-…json`, e a nota *"sem servidor,
  ele pode ter ido para a pasta de downloads do navegador"*: era descrição do que acontecia, não
  decisão de que devesse acontecer.
- `ARQUITETURA-CAPTURA.md:190-195` — o modelo da nota datada que corrige redação envelhecida sem
  apagá-la (*"A redação antiga **não** foi apagada (P-03/P-04): esta nota é o elo novo"*).
- `IDEIA-CAPTURA.md:138` — *"**Nenhum backend:** … **Salvar = baixar o arquivo.**"*: a equação
  **envelheceu**. Salvar continua não exigindo backend, e o File System Access o prova; mas salvar
  **deixou de ser** baixar. Fica declarado como defeito de documento livre, não corrigido nesta peça.
- `tools/gerar-ciclo.sh:563` — a propagação é `cp` puro (`cp "$TPL/lancamento.html"
  "$PACOTE/lancamento.html"`): **sem templating**, o rótulo novo chega verbatim às três cópias.
- `experimentos/captura-json/teste.js:318`, `:422`, `:443`, `:526`, `:550`, `:717`, `:742`, `:752` —
  os oito cliques em `gerar-json`, razão de o `id` não mudar.
- `REGISTRO.md:6705` — a entrada anterior, do mesmo formulário no mesmo dia: lá o defeito medido era
  **quantos** arquivos o botão baixa; aqui é **para onde** eles vão e **como o botão se chama**.

**O que ainda não está feito.**

- **As três cópias empacotadas ainda dizem `Gerar JSON atualizado`** — propagadas nesta mesma peça
  logo adiante; a tabela acima registra o estado medido **antes** da propagação.
- **O `HANDOFF.md` ainda não foi regenerado.** Ele carrega o rótulo antigo (`:168`) e a cauda
  preservada (`:175`) da entrada anterior. Regerado depois do commit, como manda o método.
- **O lançamento da pesquisadora continua fora do repositório** — o
  `~/Downloads/ciclo-01-diaghilev-dados-2026-09-28T0840.json` precisa chegar a
  `professores/fochini/ciclos/`. Herdado da entrada anterior; **não é desta peça**, e não foi feito
  sem autorização.
- **Os documentos livres que descrevem o fluxo antigo seguem desatualizados:** `ARQUITETURA-CAPTURA.md
  :289` (*"a gravação continua sendo lançar → baixar o JSON → commitar"*), `:306`, `:327` e `:391`
  (o download como destino, não como recuo), e `IDEIA-CAPTURA.md:138`/`:162`. São livres, a correção é
  barata, e **não foi feita nesta peça** — a peça é o formulário.
- **O `prompts/eliciar-ciclo.md` segue alterado no worktree e fora de todo commit.** Herdado, e ainda
  sem dono.

> **Correção de 28/09/2026 (mesmo dia).** Cinco afirmações da entrada imediatamente acima (`:6705`)
> **não se sustentam** depois desta peça — a pesquisadora reverteu, no mesmo dia, o rótulo e o texto
> que aquela entrada tinha decidido preservar. Corrigem-se aqui, como elo — o texto anterior **não é
> apagado** (P-03/P-04).
>
> 1. *"**O rótulo do botão fica como está** — `Gerar JSON atualizado`. A pesquisadora decidiu
>    manter…"* (`:6724-6726`). **Revertido no mesmo dia.** O rótulo **é** `Salvar` (`:154`). A decisão
>    de manter durou uma mensagem; a pesquisadora voltou pedindo exatamente o contrário — *"Mudar o
>    nome do botão"* — e recusou `Enviar` por coerência. O que a entrada anterior acertou foi a
>    **razão** (`Enviar` não cabe sem servidor); o que ela errou foi concluir que, por isso, **nenhum**
>    rótulo novo caberia: `Salvar` descreve gravação local, não envio.
> 2. *"Renomear o botão para `Enviar` não cabe: não há servidor, e nada é enviado a lugar nenhum"*
>    (`:6725-6727`). **Continua verdadeiro, e foi o que a pesquisadora escolheu honrar** — ela recusou
>    `Enviar` pelo mesmo motivo. O erro não estava nesta frase; estava na §7.3 lida como veto ao
>    rótulo.
> 3. *"E fica dito que os dois vão para o **repositório**, não para a pasta de downloads"*
>    (`:6728-6730`). **Revertido.** A pesquisadora mandou cortar o parágrafo explicativo, e ele saiu
>    do texto visível. Além disso a afirmação **descrevia o errado**: os dois **iam** para a pasta de
>    downloads — é para lá que o navegador baixa — e só chegariam ao repositório se a professora os
>    movesse à mão. É exatamente a confusão que motivou esta peça: **a frase dizia "repositório" e o
>    comportamento dizia "downloads".** Agora o comportamento **é** o repositório.
> 4. *"O rótulo do botão (`:154`) e a mensagem de `gerarJson()` **não** foram tocados"* (`:6737`).
>    **Os dois foram tocados.** O rótulo está em `:154` com outro texto; a mensagem de `gerarJson()`
>    foi reescrita (`:1752-1759`), e agora **diz onde o arquivo foi parar** em vez de o silenciar.
> 5. ⚠️ *"**É redação, não comportamento.** Nenhuma linha de JavaScript mudou; a alteração é de texto
>    visível."* (`:6760-6761`). **A afirmação mais séria, e é falsa em dobro — naquela peça e nesta.**
>    Nesta peça, **27 linhas de JavaScript entraram** (`:971-995`, o `gravarNaPasta()`) e o bloco de
>    escrita foi reescrito (`:1741-1759`): o comportamento **mudou** — no Chromium o arquivo **não**
>    desce mais para a pasta de downloads, ele é escrito no disco. E na própria peça anterior a frase
>    já era falsa: aquele diff **não** era só redação, ele mudava o **texto de apoio** e nada mais —
>    mas o texto de apoio **é** o contrato visível da página, e chamá-lo de "não comportamento" foi o
>    que autorizou deixar o rótulo de pé. **A regra do `CONGELAMENTO.md` pede parada e confirmação
>    quando o comportamento muda; a frase pulou a parada.** Nesta peça **não se pulou**: as opções
>    foram apresentadas, a pesquisadora escolheu a (a), e a escolha está registrada acima, em
>    "Motivo declarado".
>
> **Nota de método, como elo.** A cauda que a entrada anterior diz ter preservado *"palavra a palavra"*
> (`:6731-6732`) **saiu do texto visível** nesta peça, por pedido da pesquisadora. Ela não se perdeu:
> a **regra** continua escrita em `tools/templates/lancamento.html:1605` (*"o commit — que é a
> proveniência do JSON — viraria um diff ilegível"*), e a **frase** continua em `REGISTRO.md:6731`.
> Quem lê a entrada anterior precisa saber que a preservação valeu para a redação da **página**, e não
> como proibição de mexer no assunto depois.
>
> **Segunda nota de método — a citação fantasma da entrada anterior.** O bullet de `:6817-6819`
> afirma que *"`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda
> ignorada"*"*. **A citação não se sustenta: a frase não existe naquele arquivo.** Medido:
> `grep -c "cauda" ARQUITETURA-CAPTURA.md` → **0**; `:260` é uma seta `↓`, `:261` é *"Baixa o JSON
> novo e o índice atualizado"*, `:266` é `### 3.4 Visualizar`. No repositório inteiro a frase aparece
> em **5** lugares, todos em Markdown: `REGISTRO.md:6731` e `:6817`, `HANDOFF.md:175`, `:261` e
> `:1261` — ou seja, **ela nasceu nesta própria entrada e foi espelhada para o `HANDOFF.md`**. A
> origem foi rastreada: `git log --all -S"cauda ignorada"` devolve `991aa83` e `6cf847e`, que são a
> **mesma** mudança (o `991aa83` é o checkpoint da sessão, `…/checkpoints/turn/8`; o `6cf847e` é o
> commit na `main`). A regra **verdadeira** que a entrada queria citar está em
> `ARQUITETURA-CAPTURA.md:190-195` — a `> **Nota datada — 27/09/2026**` sobre o `ultimo_lancamento`.
> O próprio bullet declara *"não foi feita nesta peça"*, e é isso que **autoriza** o conserto aqui: a
> frase **já foi publicada**, e a correção é o elo. Corrigido nesta peça, junto dos dois espelhos no
> `HANDOFF.md`.

> **Correção de 28/09/2026 (mesmo dia) — o que esta própria entrada tornou falso, e o conserto
> que ela autorizou.** Cinco afirmações feitas acima **não se sustentam** depois que a peça
> terminou de andar. Corrigem-se aqui, como elo — o texto anterior **não é apagado** (P-03/P-04).
>
> 1. *"**As três cópias empacotadas ainda dizem `Gerar JSON atualizado`** — propagadas nesta mesma
>    peça logo adiante"* (`:6999-7000`). **Verdadeiro na hora em que foi escrito, falso depois do
>    commit `b1d85ab`.** A propagação aconteceu, e as três cópias foram commitadas. Medido agora:
>    `grep -c 'Gerar JSON atualizado'` → **0** em cada uma das três, e `grep -c '>Salvar<'` → **1**
>    em cada uma. O bullet descrevia o **durante**, não o **depois**.
> 2. *"**O `HANDOFF.md` ainda não foi regenerado.** Ele carrega o rótulo antigo (`:168`) e a cauda
>    preservada (`:175`)"* (`:7001-7002`, ecoado em `HANDOFF.md:1402-1405`). **Verdadeiro na hora,
>    falso desde a regeneração.** O `HANDOFF.md` foi regerado com `:4` = `b1d85ab`, e o rótulo
>    antigo não existe mais no arquivo. A **estrutura** do bullet, porém, é o que importa para o
>    método: o gerador **colhe todo** bloco *"O que ainda não está feito"* e **não reinicia** em
>    linhas `> ` (medido: o `HANDOFF.md` carrega a nota de correção inteira, `:1417-1470`). Por
>    isso os dois primeiros bullets ficam **cumulativos** no handoff, e é **aqui** que eles são
>    contrapostos — nunca lá.
> 3. As duas linhas da tabela *"Com o quê"* que mediam o estado das cópias (`:6938` *"**0** em cada
>    uma das três cópias — *ainda não propagadas*"*; `:6939` *"**1** em cada cópia (stale)"*).
>    **Estão invertidas hoje, e a §Referências acima (`:6972-6973`) já as qualificava como "o estado
>    medido na hora".** A qualificação é o que as salva como **instantâneo**, e é o que se mantém:
>    elas continuam verdadeiras *para o instante da geração*. O que se corrige é a leitura — quem lê
>    depois **re-deriva com o próprio relógio**, exatamente como o `_nota` do índice manda. Medido
>    agora: `:6938` → **1** em cada cópia; `:6939` → **0** em cada.
> 4. ⭐ **A linha falsa da entrada anterior.** Ela afirma que *"O texto novo chegou nas **quatro**
>    cópias"*, com a medição *"`grep -c 'baixa <strong>dois</strong> arquivos'` → **1** em cada"*
>    (`:6767`), e dá `git diff --numstat` **`6/3`** (`:6768`). **As duas não se sustentam.** Medido
>    agora: `grep -c 'baixa <strong>dois</strong> arquivos'` → **0** nas quatro; e o `--numstat`
>    real do commit `ce69bc5` é **`63 27`** em `tools/templates/lancamento.html` — não `6/3`. Uma
>    entrada anterior que mede errado contamina a tabela de quem vem depois; o conserto é a medição
>    nova, e não a reescrita da antiga.
> 5. ⭐ **A citação fantasma — a régua verdadeira.** O bullet de `:6817-6819` afirma que
>    *"`ARQUITETURA-CAPTURA.md:260-266` afirma que o carimbo de hora *"cai na cauda ignorada"*"*.
>    **A citação não se sustenta: a frase nunca existiu naquele arquivo** (medido:
>    `grep -c "cauda" ARQUITETURA-CAPTURA.md` → **0**). A regra verdadeira é a `> **Nota datada —
>    27/09/2026**` de `ARQUITETURA-CAPTURA.md:190-195`, sobre o `ultimo_lancamento`. A nota de método
>    acima (`:7057-7070`) conclui com *"Corrigido nesta peça, junto dos dois espelhos no
>    `HANDOFF.md`"* — e **essa conclusão estava adiantada**: o arquivo livre seguia intocado. Ela
>    passa a valer **agora**, com o conserto do item 6 abaixo, e a enumeração de `:7062-7063`
>    (`REGISTRO.md:6731` e `:6817`; `HANDOFF.md:175`, `:261` e `:1261`) troca pelos cinco lugares
>    medidos hoje: `REGISTRO.md:6817` e `:7064`, `HANDOFF.md:392`, `:1395` e `:1467`.
> 6. ⭐ **Os documentos livres foram corrigidos nesta peça — era o que faltava, e a entrada os
>    declarava intocados.** O bullet de `:7007-7010` dizia *"a correção é barata, e **não foi feita
>    nesta peça** — a peça é o formulário"*. Correção barata que fica para depois envelhece quem a
>    lê: quem abrisse `ARQUITETURA-CAPTURA.md` aprenderia que o lançamento *"baixa o JSON"*. Feito
>    agora, com nota datada no próprio arquivo livre (P-03/P-04), nos quatro pontos do fluxo:
>    - `ARQUITETURA-CAPTURA.md:261` (*"Baixa o JSON novo e o índice atualizado"*) → *"Salva o JSON
>      novo e o índice atualizado na pasta do ciclo"*, sob **nota datada 28/09/2026** na §3.3, que
>      declara o recuo para download onde não há File System Access API;
>    - `:306` (Mermaid, `-->|"download manual"|`) → `-->|"gravação na pasta do ciclo"|`;
>    - `:327` (caixa ASCII, `│ download / commit manual`) → `│ gravação na pasta do ciclo / commit
>      manual`;
>    - `:391` (*"pode ter ido para a pasta de downloads do navegador"*) → o download como **recuo**,
>      não como destino.
>    E em `IDEIA-CAPTURA.md`, os dois pontos que descreviam a gravação como download de saída:
>    `:138` (*"Salvar = baixar o arquivo"*) e `:162` (*"Gravação (download do JSON atualizado)"*).
> 7. ⭐ **O texto de apoio da página — pedido novo, feito nesta peça.** A pesquisadora pediu, depois
>    da decisão, que a redação do cabeçalho (`tools/templates/lancamento.html:97-103`) fosse
>    reescrita em linguagem mais legível, cobrindo os quatro verbos do que a página faz — **lê** o
>    índice e os dados do ciclo (que viajam cifrados no pacote, como os acompanhamentos), **salva**
>    o lançamento na pasta do ciclo escolhida, **ajusta** o que precisar e **gera** os relatórios.
>    A consequência **verdadeira** foi preservada palavra a palavra: as vistas são calculadas na
>    memória, a página **grava mas não commita**, e **o commit é do professor**.
> 8. ⭐ **A alteração das 10:04 — descartada, e registrada como método.** Entre esta entrada e a
>    anterior, o VS Code reescreveu os quatro `lancamento.html` no disco (`files.autoSave:
>    "onFocusChange"` + `editor.formatOnSave`, ambos em `~/.config/Code/User/settings.json`). O delta
>    de conteúdo foi a **remoção de uma frase** — a legenda *"o ciclo com esta aula dentro, na pasta
>    do ciclo — e só entra no Git quando você commitar"* —, idêntica nos quatro arquivos, com o
>    JavaScript **inalterado** (medido: os quatro reduzem a exatamente **−97** caracteres, e o JS
>    tem os mesmos 79754 caracteres nos dois lados). Um formatador **não apaga texto**: a assinatura
>    é de **"Replace in Files"**. A pesquisadora foi consultada e escolheu **descartar** —
>    `git checkout --` nos quatro caminhos. **A remoção de uma linha de texto, se ela um dia quiser,
>    é mudança de uma linha com entrada própria**, como qualquer outra. O remédio durável, oferecido:
>    fechar as abas, ou desligar `editor.formatOnSave` para HTML.
>
> **O que continua valendo sem correção.** O "Motivo declarado", a tabela "Onde entrou" na sua
> parte de código (`:6940`, `:6941`, `:6942` — medidos de novo, corretos), a §"O que motivou" e
> todo o parágrafo 5 desta nota, que registra a parada que a peça anterior não fez. A regra do
> `CONGELAMENTO.md` segue: quando o **comportamento** muda, para-se e confirma-se; foi o que
> aconteceu aqui, e a escolha está em "Motivo declarado".

## 28/09/2026 — A legenda ao lado do botão `Salvar` sai; o botão fica sozinho

**O que motivou.**

Depois de a entrada `:6821` trocar o rótulo e o destino do botão, sobrou-lhe ao lado um texto de
apoio que continuava falando de repositório: *"o ciclo com esta aula dentro, na pasta do ciclo — e só
entra no Git quando você commitar."* A pesquisadora leu e pediu a remoção, sem nada no lugar:
*"tira isso 'o ciclo com esta aula dentro, na pasta do ciclo — e só entra no Git quando você
commitar'. deixa o botão Salvar sem nenhum texto o acompanhando"*.

A frase era **endereçada a quem programa**, não a quem dá aula: nomeia Git, commit e a pasta de
destino — três coisas que a professora que lança a aula não precisa saber para usar a página. O
botão diz o que faz (`Salvar`), e o resultado da gravação aparece em `#aviso-json`, que a peça
anterior já escrevia. Ficar sem legenda é a redação correta, não uma lacuna a preencher.

Esta é a **entrada própria** que a nota de correção desta mesma entrada prometeu, no item 8
(`:7137-7146`): *"A remoção de uma linha de texto, se ela um dia quiser, é mudança de uma linha com
entrada própria, como qualquer outra."* Aquele item registrou a remoção que o VS Code fez às 10:04
como **descartada**, por ter vindo de fora da conversa — restaurada com `git checkout --`. Esta é
outra remoção: pedida, medida e assumida. **O item 8 não é reescrito** (P-03/P-04): ele fica como o
elo que registra o que se pensou antes.

**O que foi decidido.**

- O `<span class="fraco">` que acompanhava o botão **sai**, e nada ocupa o lugar dele.
- O botão **fica sozinho** antes de `<span id="aviso-json">` — que **permanece**, porque é onde o
  JavaScript escreve o resultado da gravação e o que a suíte de teste lê.
- **Só isso.** Nenhuma outra frase do formulário é tocada nesta peça. O cabeçalho (`:98-104`) e as
  demais redações em voz de programador continuam como estão — a pesquisadora as deixou para depois
  (*"podemos editar depois"*).
- **Sem reancoragem.** A âncora cobre as fontes de ciclo; o `lancamento.html` não está entre os 21
  caminhos cobertos (`grep -c 'lancamento'` na `.fipp` → **0**).

**Onde entrou.**

`tools/templates/lancamento.html` — a remoção de **duas linhas**, medidas com `git diff -U0`:

```diff
@@ -156,2 +155,0 @@
-    <span class="fraco">o ciclo com esta aula dentro, na pasta do ciclo — e só entra no Git
-      quando você commitar.</span>
```

A fonte é congelada e é **a única**: as três cópias empacotadas saem dela por `cp` direto
(`tools/gerar-ciclo.sh:563`), sem templating. Regeneradas com
`tools/gerar-ciclo.sh <professor> <ciclo> <escola>`:

| arquivo | antes | depois | `>Salvar<` | legenda | `Gerar JSON atualizado` |
|---|---|---|---|---|---|
| `tools/templates/lancamento.html` | 2089 | **2087** | 1 | 0 | 0 |
| `professores/fochini/ciclos/ciclo-01-diaghilev/lancamento.html` | 2144 | **2142** | 1 | 0 | 0 |
| `professores/tiago/ciclos/ciclo-01-duo/lancamento.html` | 2143 | **2141** | 1 | 0 | 0 |
| `professores/tiago/ciclos/ciclo-01-ritmos/lancamento.html` | 2144 | **2142** | 1 | 0 | 0 |

`git diff --numstat` → **`0 2`** em cada um dos quatro: nenhuma linha reflui, nada mais mudou.

**Motivo declarado — os congelados.**

`tools/templates/lancamento.html` está em `CONGELAMENTO.md`. O motivo é o de cima: a legenda
endereçava-se a quem programa (Git, commit, pasta de destino), e a pesquisadora pediu que o botão
ficasse sozinho.

**O que NÃO muda:** a fórmula de hash (`tools/hash-ciclo.sh`), a cobertura da âncora, os validadores
e as pétreas. A mudança é **de redação visível**, não de comportamento: o botão continua gravando o
mesmo arquivo, no mesmo lugar, com o mesmo `id` (`gerar-json`) e o mesmo aviso. A cláusula do
`CONGELAMENTO.md` — *"quando o comportamento muda, pare e confirme"* — **não dispara**.

**Com o quê.**

- `tools/templates/lancamento.html` (a fonte, 2087 linhas)
- as três cópias empacotadas listadas acima
- este `REGISTRO.md`

**Referências.**

- `REGISTRO.md:6821` — a entrada do botão `Salvar`; `:7137-7146` — o item 8, que prometeu esta
  entrada própria; `:7014` e `:7072` — as duas notas de correção daquela entrada.
- `tools/templates/lancamento.html:155` — `<button id="gerar-json" type="button">Salvar</button>`;
  `:156` — `<span id="aviso-json"></span>`; `:98-104` — o cabeçalho, **não** tocado aqui.
- `CONGELAMENTO.md` — a lista dos congelados e a regra do comportamento.
- `AGENTS.md` — a ordem de trabalho sobre `tools/templates/`.

**O que ainda não está feito.**

- **Nada foi empurrado.** No momento em que esta entrada foi escrita, `main` estava **4 commits à
  frente** de `origin/main`; o push não foi pedido.
- **O `HANDOFF.md` precisa ser regenerado** depois deste commit: ele extrai a **última** entrada do
  `REGISTRO.md` (`tools/gerar-handoff.sh:177`), e passa a ser esta.
- **A voz de professor no resto do formulário segue pendente.** O cabeçalho (`:98-104`) ainda diz
  *"índice de ciclos"*, *"cifrados no pacote"*, *"não commita"*; o `<summary>` (`:151`) diz *"salva
  no JSON"*; a ajuda do botão de relatórios e as mensagens de erro falam de `assets/`,
  `lib-vistas.js` e `tools/gerar-ciclo.sh`. A pesquisadora deferiu a reescrita.

> **Correção de 28/09/2026 (mesmo dia).** O pendente acima dizia *"A voz de professor no resto do
> formulário segue pendente. O cabeçalho (`:98-104`) ainda diz "índice de ciclos", …"*. A **primeira**
> cláusula — a do cabeçalho — **deixou de valer** na entrada seguinte, que a pesquisadora ditou e que
> está logo abaixo. O pendente **não é reescrito**: ele fica como está, porque registra o estado em
> que a peça anterior foi fechada. O que continua valendo dele, sem correção, é a **segunda** parte:
> o `<summary>`, a ajuda do botão de relatórios e as mensagens de erro — e é essa parte que a entrada
> seguinte retoma como lista verdadeira.

## 28/09/2026 — O cabeçalho do formulário passa à voz de professor: só o que a página faz por ele

**O que motivou.**

A entrada anterior (`:7153`) registrou, no seu "O que ainda não está feito", que *"a voz de professor
no resto do formulário segue pendente"* — o cabeçalho (`:98-104`) ainda dizia *"índice de ciclos"*,
*"cifrados no pacote"*, *"não commita"*; o `<summary>` dizia *"salva no JSON"*; a ajuda do botão de
relatórios e as mensagens de erro falavam de `assets/`, `lib-vistas.js` e `tools/gerar-ciclo.sh`. A
pesquisadora tinha deferido a reescrita (*"podemos editar depois"*).

Nesta peça ela ditou a redação do **cabeçalho** e só dele: *"O texto deve ficar apenas assim
"**Área do Professor.** Aqui você lê os dados da aula, **salva** o lançamento, faz ajustes e gera os
relatórios.""*

O critério é o mesmo das duas peças anteriores — o texto é **para o professor**, não para quem
programa. Depois de uma redação que ainda nomeava *índice*, *cifrado*, *pacote*, *pasta*, *memória*
e *commit*, a pesquisadora recusou explicitamente esse vocabulário: *"ele não precisa saber de
commit, git, cifrado, pacote, pasta, índice etc. Ele precisa saber o que a página faz por ele, qual
a utilidade da página."*

**O que foi decidido.**

- O aviso do topo passa a ser **duas linhas**: o realce `**Área do Professor.**` seguido de uma
  frase que diz o que a página faz pelo professor — **lê** os dados da aula, **salva** o lançamento,
  **faz ajustes** e **gera os relatórios**. O realce em `salva` é da pesquisadora e fica.
- **Sai** toda a menção a implementação: o índice de ciclos, os dados que viajam cifrados no pacote,
  a pasta do ciclo, as vistas calculadas na memória e o commit que é do professor.
- **A consequência verdadeira não se perde — ela sai da página.** A que o texto antigo preservava
  (*"a página grava, mas não commita"*) é verdade de **operação do repositório**, não informação de
  quem lança a aula; o professor não precisa dela para usar o formulário, e ela continua registrada
  onde pertence — neste `REGISTRO.md`, em `ARQUITETURA-CAPTURA.md` e nas regras de versionamento.
- **Só o cabeçalho.** O `<h1>` (`:97`), o `<summary>` (`:148`), o `#captura-campos` (`:149`), a nota
  do painel de captura (`:1409`), a ajuda do botão de relatórios (`:171`), as mensagens de erro e o
  comentário dos *"TRÊS entregáveis"* (`:159`) **não** são tocados aqui. A pesquisadora limitou o
  pedido: *"o texto deve ficar apenas assim"*.
- **Sem reancoragem.** A âncora cobre as fontes de ciclo; o `lancamento.html` não está entre os 21
  caminhos cobertos (`grep -c 'lancamento'` na `.fipp` → **0**).

**Onde entrou.**

`tools/templates/lancamento.html` — **cinco linhas viram duas** (`2 5` no `git diff --numstat`),
medidas com `git diff -U0 HEAD`:

```diff
@@ -99,5 +99,2 @@
-  <strong>Área do Professor.</strong> Lê o índice de ciclos e, sob demanda, os dados do ciclo
-  escolhido — que viajam <strong>cifrados</strong> no pacote, como os acompanhamentos. Aqui você
-  lança a aula, <strong>salva</strong> o lançamento na pasta do ciclo que escolher, faz ajustes e
-  gera os relatórios. As vistas são calculadas na memória: a página grava, mas
-  <strong>não commita</strong> — o commit é seu.
+  <strong>Área do Professor.</strong> Aqui você lê os dados da aula, <strong>salva</strong> o
+  lançamento, faz ajustes e gera os relatórios.
```

O `<h1>` (`:97`) e o `</div>` (`:101`) ficam intactos — são as linhas de contexto do hunk. A fonte é
congelada e é **a única**: as três cópias empacotadas saem dela por `cp` direto
(`tools/gerar-ciclo.sh:563`), sem templating. Regeneradas com
`tools/gerar-ciclo.sh <professor> <ciclo> <escola>`:

| arquivo | antes | depois | novo cabeçalho em | hunk | `>Salvar<` | `id="aviso-json"` |
|---|---|---|---|---|---|---|
| `tools/templates/lancamento.html` | 2087 | **2084** | `:99` | `@@ -99,5 +99,2 @@` | 1 | 1 |
| `professores/fochini/ciclos/ciclo-01-diaghilev/lancamento.html` | 2142 | **2139** | `:154` | `@@ -154,5 +154,2 @@` | 1 | 1 |
| `professores/tiago/ciclos/ciclo-01-duo/lancamento.html` | 2141 | **2138** | `:153` | `@@ -153,5 +153,2 @@` | 1 | 1 |
| `professores/tiago/ciclos/ciclo-01-ritmos/lancamento.html` | 2142 | **2139** | `:154` | `@@ -154,5 +154,2 @@` | 1 | 1 |

**A regeneração churnou 21 arquivos e 18 foram descartados.** O `gerar-ciclo.sh` não é
determinístico: o `ciclos.json` carimba `gerado_em`, o `-dados.json` é recifrado com IV aleatório, os
dez `acompanhamento-*.html` trazem uma linha longa que reflui e os três PDFs mudam por carimbo de
tempo. `git checkout -- professores/` com três `:(exclude)` — os três `lancamento.html` — restaurou
os 18, e sobraram exatamente **quatro** arquivos modificados, todos `2 5`: a fonte e as três cópias.
O churn não é entrega e não vai no commit.

**O elo anterior não é reescrito.** O item 7 da nota de correção da entrada `:7153`
(`REGISTRO.md:7128-7136`) registrou a **primeira** redação do cabeçalho como feita, citando
`tools/templates/lancamento.html:97-103`. A pesquisadora **mudou a redação depois**; esta entrada é
o elo novo e **não** substitui aquele texto. Fica valendo o que o item 7 registrava sobre o
**método** (a redação em voz de professor, pedida depois da decisão), e o que fica no arquivo é a
**segunda** redação — a ditada nesta peça. Nada foi apagado: o elo anterior permanece legível em
`:7128-7136`.

**Motivo declarado — os congelados.**

`tools/templates/lancamento.html` está em `CONGELAMENTO.md`. O motivo é o de cima: o texto do
cabeçalho endereçava-se a quem programa — nomeava o índice, o cifrado, o pacote, a pasta e o commit
— e a pesquisadora pediu que ele dissesse apenas o que a página faz pelo professor.

**O que NÃO muda:** a fórmula de hash (`tools/hash-ciclo.sh`), a cobertura da âncora, os validadores
e as pétreas. A mudança é **de redação visível**, não de comportamento: o aviso é `display` de texto
estático, sem `id` próprio que o JavaScript leia, sem seletor em folha de estilo e sem asserção em
teste. Medido: nenhum teste ou artefato de `experimentos/`, `tools/` ou `.github/` fixa o texto
antigo. A cláusula do `CONGELAMENTO.md` — *"quando o comportamento muda, pare e confirme"* —
**não dispara**.

**Com o quê.**

- `tools/templates/lancamento.html` (a fonte, 2084 linhas)
- as três cópias empacotadas listadas acima
- este `REGISTRO.md`

**Referências.**

- `REGISTRO.md:7153` — a entrada da legenda do `Salvar`; `:7128-7136` — o item 7 da nota de correção,
  que registrou a primeira redação do cabeçalho; `:7241-7244` — o pendente que esta entrada cumpre
  em parte.
- `biblioteca/guia-do-professor.md` — o **modelo de voz** que o cabeçalho novo passa a seguir:
  realce de abertura, segunda pessoa, prosa de utilidade e **zero** palavra de implementação.
- `AGENTS.md` — a ordem de trabalho sobre `tools/templates/`; `CONGELAMENTO.md` — a lista dos
  congelados e a regra do comportamento.
- `tools/gerar-ciclo.sh:563` — o `cp` que propaga a fonte às cópias, sem templating.

**O que ainda não está feito.**

- **Nada foi empurrado.** No momento em que esta entrada foi escrita, `main` estava **6 commits à
  frente** de `origin/main`; o push não foi pedido.
- **O `HANDOFF.md` precisa ser regenerado** depois deste commit: ele extrai a **última** entrada do
  `REGISTRO.md` (`tools/gerar-handoff.sh:177`), e passa a ser esta.
- **O resto da voz de programador no formulário segue pendente**, e **esta** é agora a lista
  verdadeira: o `<h1>` (`:97`) e o `<title>` (`:6`) dizem *"formulário eletrônico"*; o `<summary>`
  (`:148`) diz *"salva no JSON"*; o `#captura-campos` (`:149`) e a nota do painel de captura
  (`:1409`) falam do *"índice do ciclo"*; a ajuda do botão de relatórios (`:171`) diz *"gera o filtro
  inteiro em arquivo"*; a mensagem *"o JSON é por ciclo"* (`:1690`) e as mensagens de erro das libs
  (`:1980`) e do `pedirSenha` (`:1918`) nomeiam `assets/`, `lib-vistas.js` e o JSON; e o comentário
  dos *"TRÊS entregáveis"* (`:159`) contradiz os cinco de `ORDEM_ENTREGAVEIS` (`:902`). A
  pesquisadora limitou esta peça ao cabeçalho.

## 28/09/2026 — O botão `Exportar ajuste do plano` sai do formulário: era erro de assistente

**O que motivou.** A pesquisadora pediu a remoção **completa** do botão *"Exportar ajuste do
plano"* (`#ajustar-plano`, a segunda barra do formulário) e que ficasse **registrado** que aquilo
foi **erro de assistente** e não faz sentido existir. A pergunta dela foi direta e continua sem
resposta possível: *"por que é que ele iria usar um exportar ajuste do plano? Vai exportar para
onde? Para fazer o quê com isso?"* Uma explicação anterior já tinha sido recusada por citar
documentação em vez de justificar o ponto de vista do usuário — **documentado ≠ justificado**.

**O que foi decidido.** O botão e tudo que só ele sustentava **saem**; a distinção dos dois
relógios e o arquivamento do plano anterior **ficam**.

- **A distinção fica.** O relógio do **plano** fecha no **lançamento**; o do **lançamento** fecha
  no **prazo** (`§3.1`). É o que impede os dois ajustes de estarem abertos ao mesmo tempo, e é o
  que o guard do `pre-commit` (`§2c`, `:172–305`) aplica — **ele difere a fonte `aula-NN.md`
  contra o `HEAD`, não lê nenhum id de HTML**, e por isso não é afetado por esta remoção.
- **O arquivamento fica.** `plano-aula-NN.json` → `plano-aula-NN-anterior.json` continua sendo
  produzido por `tools/gerar-ciclo.sh`. É a proveniência do estado anterior do plano.
- **O que sai é a exportação.** A fonte `aula-NN.md` é do professor; o que o formulário ajusta é
  o **lançamento**, que tem o seu próprio par (o `#ajustar` da barra 1, com `podeAjustar()`).
  Não havia **consumidor** para o elo do plano: a página montava um `.md` que ninguém anexava.

**A assinatura do erro — verificada, não presumida.** `git log -1 -S'Exportar ajuste do plano'`
aponta **`282fbcb`** — *"feat(template): o estado derivado e o ajuste no plano no formulário"*,
28/09/2026, commit **co-assinado por Copilot** (`Co-authored-by: Copilot`), que trouxe o `B8`
(peça 7) inteiro. O botão nasceu aí, **não** de um pedido da pesquisadora. O pedido dela, na
origem, era outro: um botão para ajustar **quando o "Plano seguido" fosse diferente de *sim***,
com o campo *"O que mudou em relação ao plano"* — que é o **ajuste do lançamento**, e esse
`#ajustar` **está funcionando e foi aprovado**. O que se registra aqui é o elo errado, não uma
mudança de rumo dela.

**O que NÃO se toca.** O ajuste do lançamento (barra 1) fica inteiro: `#acoes-ajuste`, `#ajustar`,
`#cancelar-ajuste`, `#aviso-ajuste`, a gate `podeAjustar()` (~~`:975`~~), o bloco do `render()`
(`:1560–1574`) e o listener (~~`:1761`~~). Também ficam os auxiliares **compartilhados** com ele
(`diffAulas`, `baixar`, `legivel`, `nomeDoAutor`, `carimboArquivo`, `pecaArquivo`, `estadoDaAula`,
`semZona`, `carimboDaAula`, `escolaDoArquivo`, `podeAjustar`, `esc`, `pulada`, `fimDoPrazo`,
`gravarNaPasta`, `#gerar-json` e `#aviso-json` — este último pinado pelo teste de regressão).
O `mdAjuste` de ~~`biblioteca/lib-vistas.js:48`~~ é o elo do **lançamento** — função **diferente** da
`mdAjusteDoPlano` que saiu.

**Superado em 29/09/2026.** As listas continuam certas — a varredura confirma que **todos** os ids e
auxiliares nomeados acima existem no template —, mas **três coordenadas** desta entrada estavam
erradas: a gate `podeAjustar()` está em **`:970`** (o `:975` é linha em branco); o listener do
`#ajustar` está em **`:1753`** — o `:1761` é `renderCaptura();`, e pertence ao listener do
`#cancelar-ajuste` de `:1758`; e a `lib-vistas` vive em **`tools/lib-vistas.js`**, não em
`biblioteca/` — `tools/lib-vistas.js:48` é `function mdAjuste(aj) {`. O bloco do `render()` citado
(`:1560–1574`) **confere** com o medido. A redação antiga **não é apagada**: fica como o elo do que
se mediu naquele momento.

**Onde entrou.**

- `tools/templates/lancamento.html` — a remoção. 273 linhas a menos, **só deleções, zero
  adições**: HTML da barra (5 linhas), o CSS dela, o `render()`, os dois listeners, o `motivo` do
  ajuste do plano, e os **12** auxiliares exclusivos dela (`podeAjustarPlano`, `escolaDaAula`,
  `nomeFonteDaAula`, `canonico`, `carregarPlanoDaAula`, `contarFolhas`, `MAPA_DO_PLANO`,
  `mapaDoPlano`, `semPrefixoDaAula`, `montarAjusteDoPlano`, `mdAjusteDoPlano` e
  `exportarAjusteDoPlano`).
- Os três pacotes gerados — `professores/fochini/ciclos/ciclo-01-diaghilev/lancamento.html`,
  `professores/tiago/ciclos/ciclo-01-duo/lancamento.html` e
  `professores/tiago/ciclos/ciclo-01-ritmos/lancamento.html` — reconstruídos a partir do template
  limpo com o `<nav>` próprio de cada um reposto no lugar do marcador `<!-- NAV -->`.
- `ARQUITETURA-AULA.md` — correção datada no `§1.2` (a nota do `B8`) e no item 8 do `§10`.
- `ARQUITETURA-CAPTURA.md` — correção datada na nota dos *"dois ajustes"* e na **caixa da
  divergência declarada** do `§5.1` (*"a resolver quando o formulário for revisto"* — a revisão
  chegou, e resolveu a divergência **do plano**; a do **lançamento** segue aberta).
- `tools/gerar-ciclo.sh` — o comentário do plano por aula, que dizia *"o botão do modo 'ajuste do
  plano' não tem entrada"*.

**Motivo declarado — os congelados.** `tools/templates/lancamento.html` e `tools/gerar-ciclo.sh`
estão em `tools/` (`CONGELAMENTO.md`), e por isso mudam **só com motivo declarado, entrada no
`REGISTRO.md` e commit próprio** — que é esta entrada. O motivo: o template **é** a peça; não há
como remover um botão dele sem alterá-lo. No `gerar-ciclo.sh` a mudança é **só de comentário**
(nenhuma linha executável): o texto vigente descrevia um consumidor que deixou de existir, e
deixá-lo faria o próximo leitor procurar um botão que não está lá.

**Com o quê.** Verificação medida, não presumida:

- `node tools/check-pacote.js` nos três pacotes ⇒ `0 erro(s)`.
- `node --check` no JS embutido do template ⇒ OK; `simular-formulario.js` ⇒ `EXIT=0`.
- Os 18 símbolos exclusivos da barra 2 ⇒ **0 ocorrências** no template e nas três cópias;
  `#acoes-ajuste`/`#ajustar` ⇒ **7** em cada.
- `tools/gerar-ciclo.sh fochini 01 diaghilev` (execução real) ⇒ `EXIT=0` e o `lancamento.html`
  emitido **idêntico** à cópia reconstruída à mão — a propagação é o que o próprio gerador
  produz, a menos de uma linha em branco.
- Os artefatos de arrasto da execução de teste (`ciclos.json`, `-dados.json`, o PDF) foram
  revertidos; o diff final é **deleção pura**.
- Âncora: **não** exige reancorar — o `.fipp` cobre 21 caminhos por ciclo e **nenhum** é
  `lancamento.html` (`grep -c lancamento` ⇒ 0). Os três `--check` seguem `EXIT=0`.

**Referências.**

- O commit que introduziu o erro: **`282fbcb`** (*"o estado derivado e o ajuste no plano no
  formulário"*, co-assinado por Copilot).
- `ARQUITETURA-AULA.md` §1.1 (os quatro estados e o CRUD da aula planejada), §1.2 (a distinção
  dos dois relógios), §10 item 8 (o `B8`).
- `ARQUITETURA-CAPTURA.md` §5.1 (a caixa da divergência declarada) e a nota dos *"dois ajustes"*.
- `CONGELAMENTO.md` — a lista dos congelados e a regra do comportamento.
- `tools/hooks/pre-commit:172–305` — o guard do `B8`, que difere a **fonte**, não o HTML.
- `prompts/eliciar-ciclo.md` foi deixado **de fora** do commit (modificação anterior, sem relação
  com esta peça), e `po_ref/` continua não versionado e no `gitignore`.

**O que ainda não está feito.**

- **O `HANDOFF.md` precisa ser regenerado** depois deste commit: ele extrai a **última** entrada do
  `REGISTRO.md` (`tools/gerar-handoff.sh:177`), e passa a ser esta.
- **O par `plano-aula-NN.json` / `-anterior.json` fica órfão de leitor** — segue produzido (é
  proveniência e é o que o guard lê), mas nenhuma página o consome. **Decisão em aberto**:
  continuar produzindo ou parar.
- ~~**A automação do `Salvar` continua em aberto.** A regra declarada pela pesquisadora é que o
  lançamento vai **para dentro do sistema**, não para a máquina do usuário, e que o download do
  `.json` não deve existir. Isso **reabre duas decisões registradas** — o `§7.3` do
  `ARQUITETURA-CAPTURA.md` (*"sem backend"*, 20/09/2026) e a *"opção A"* da entrada de
  27/09/2026 deste registro — e por isso exige motivo declarado e entrada própria, não mudança
  silenciosa.~~ **Superado em 29/09/2026.** O motivo declarado e a entrada própria são os da entrada
  de **29/09/2026** (o Passo 0), que dá destino ao `POST` e reancora por push. O que **continua em
  aberto** é a metade que falta — a **consolidação agendada** —, e está declarada lá com as
  perguntas. A redação antiga **não é apagada**: fica como o elo do que estava aberto em 27/09/2026.
- **A revisão dos demais botões segue pendente**, e a pergunta feita pela pesquisadora — *como o
  processo fica automático quando o sistema roda no servidor, sem assistente na jogada* — ainda
  **não foi respondida**.

## 29/09/2026 — O botão `Salvar` deixa de abrir a pasta do computador: a causa era a cópia, não o template

**O que motivou.** A pesquisadora relatou o mesmo defeito **duas vezes**, a segunda com
impaciência — *"o botão salvar no lancamento.html ainda está abrindo a janela do gerenciador de
arquivos do SO. Não pode fazer isso. eu fiz o click em cancelar e foi feito o download de 2
arquivos para Downloads. Vc entendeu o que deve ser feito? acho que vc não me entendeu ainda"*.
O relato tem **dois** sintomas e o segundo é o mais grave: **cancelar não cancelava** — o
`gravou` colapsava *cancelou* / *navegador sem suporte* / *erro de disco* no mesmo `false`, e o
recuo para download disparava nos três casos. Cancelar a janela do sistema produzia o download
que o usuário estava recusando. Depois do cancelamento os campos digitados também se perdiam,
porque o `showDirectoryPicker` fechava o ajuste em curso.

**A causa real — e por que o defeito sobreviveu à peça anterior.** O que a pesquisadora abre
**não é o template**: o `tools/gerar-ciclo.sh` **copia** o template para dentro de cada pacote
(`tools/gerar-ciclo.sh:564`, `cp "$TPL/lancamento.html" "$PACOTE/lancamento.html"`), e é uma das
**três cópias empacotadas** que se abre no navegador. Editar o template **não muda o que a
pesquisadora vê** até a cópia ser propagada.

Medido, e não presumido: o commit anterior (`07c5b95`) ainda traz o `showDirectoryPicker` **×3 no
template** *e* **×3 em cada uma das três cópias** — ou seja, a peça do `Enviar` (rótulo, `POST`,
remoção do seletor) **não estava commitada**: vivia apenas no worktree. Esta peça é o commit que a
leva, e o primeiro commit a leva **só ao template** (`193287b`, `+58/−61` em um arquivo) — as
cópias vieram no commit imediatamente seguinte (`+58/−61` em três). É a lição do dia: **enquanto a
cópia não é propagada, o defeito continua no navegador**, por mais correto que esteja o template.

**O que foi feito.** As três cópias foram reescritas a partir do template já corrigido, cada uma
mantendo o `<nav>` **próprio** (o `class="ativo"` e os rótulos de cada escola), reposto no lugar
do marcador `<!-- NAV -->` — que é exatamente o que o gerador faz
(`tools/gerar-ciclo.sh:844–860`, um heredoc Python que exige **uma** ocorrência do marcador e
faz `replace(..., 1)`). O diff das quatro (template + três cópias) é **idêntico**: **18 hunks,
+58/−61**. A nav **não** foi tocada: `git diff -U0 | grep -c topnav` ⇒ **0** nas três.

O que a alteração faz, em comportamento:

- **`showDirectoryPicker` não existe mais** em nenhuma das quatro — nem `File System Access`,
  `getFileHandle`, `createWritable` ou `gravarNaPasta`. `grep` ⇒ **0** em todas.
- **O botão não abre mais o gerenciador de arquivos do SO**, e por consequência **cancelar não
  produz mais download nenhum**: o caminho que fazia isso deixou de existir.
- **O rótulo é `Enviar`** nas quatro (`id="gerar-json"`), e o envio é um `POST` para
  `/.netlify/functions/receber` (`const RECEBER`).
- **Os campos digitados não se perdem em caso de falha**: a mutação do estado em memória passou a
  acontecer **depois** do sucesso do envio (`try { await enviar(arquivos) } catch { dizer(erro);
  return }`).
- As mensagens de falha passaram de *"não gerei"* para *"não enviei"* (5×), a prosa interna
  deixou de dizer *"baixar um arquivo"* e o comentário do bloco de captura passou a
  *"envia ao site → é o site que guarda"*.

**O que NÃO foi tocado.** A função `baixar()` **fica**: ela não é da gravação, é do `.md` do
relatório (`baixar(prov.arquivo, ...)`), e ali o download é legítimo. Ficam também o cabeçalho da
`Área do Professor` na redação pedida pela pesquisadora, o ajuste do lançamento (barra 1) inteiro,
e o `#aviso-json` — pinado pelo teste de regressão.

**Motivo declarado — os congelados.** `tools/templates/lancamento.html` está em
`tools/` (`CONGELAMENTO.md`) e muda só com **motivo declarado, entrada no `REGISTRO.md` e commit
próprio** — que é esta entrada. O motivo: o template **é** a peça, e não há como remover o
caminho de gravação dele sem alterá-lo. As três cópias **empacotadas** não são congeladas (são
saídas versionadas), mas são a **mesma peça** vista pelo navegador, e é por isso que entram no
mesmo commit: deixar o template corrigido e a cópia não seria correção, seria divergência.

**Com o quê.** Verificação medida, não presumida:

- `node tools/check-pacote.js` nos três pacotes ⇒ **`0 erro(s)`**. Os avisos de glossário do `duo`
  e do `ritmos` (6 cada) são **pré-existentes** e não têm relação com esta peça.
- O servidor local (`python3 -m http.server`, `127.0.0.1:8000`) entrega o `lancamento.html` do
  `diaghilev` com **HTTP 200** e **0** ocorrências de `showDirectoryPicker` — o mesmo arquivo que
  a pesquisadora abriu.
- Âncora: **não** exige reancorar. O `.fipp` das três escolas não cita `lancamento.html`
  (`grep -c lancamento` ⇒ **0** nas três) e o `tools/lib-fontes.sh` confirma em código que o HTML
  não é fonte hasheada. Os três `--check` seguem **`EXIT=0`**.
- O teste de regressão (`experimentos/captura-json/teste.js`, **não versionado**) roda com os
  casos **1–9 passando**; o **caso 10** agora falha pelo motivo **novo e correto** — a rota
  ausente devolve `HTTP 404`, a página diz *"não enviei: HTTP 404. Os dados continuam aqui — tente
  de novo."* e **nenhum download acontece** (`baixados: (nenhum)`). É a **prova de execução** de
  que o caminho proibido está morto e de que a falha de transporte **não** limpa os campos.

**Referências.**

- O commit `17ed444` (o botão `Exportar ajuste do plano` sai do formulário) é o elo imediatamente
  anterior desta cadeia no template; a remoção do seletor de pasta, o rótulo `Enviar` e o `POST`
  entram **nesta** peça, em dois commits: o template e, depois, as três cópias.
- `tools/gerar-ciclo.sh:564` (a cópia do template) e `:844–860` (a injeção da nav).
- `CONGELAMENTO.md` — a lista dos congelados e a regra do comportamento.
- ~~`ARQUITETURA-CAPTURA.md` §7.3 — *"sem backend"* (`:625`), **reaberto** pela peça anterior e
  **ainda não resolvido**: o `POST` aponta para uma função que **não existe** no repositório.~~
  **Superado em 29/09/2026.** A função **existe** — `netlify/functions/receber.js` —, o
  `netlify.toml` existe e o `.github/workflows/reancorar.yml` fecha a reancoragem; o que **não**
  existe é a **consolidação agendada**, e é isso que mantém o §7.3 parcialmente aberto. A redação
  antiga **não é apagada**: fica como o elo do que se mediu naquele momento.
- `prompts/eliciar-ciclo.md` (congelado, modificação anterior, sem relação com esta peça) foi
  deixado **de fora** do commit, e `po_ref/` continua não versionado.

**Nota datada — superação da entrada de 28/09/2026 (o `Exportar ajuste do plano`).** Aquela
entrada lista `gravarNaPasta` entre os auxiliares **"compartilhados"** que *ficam* (`:7416`), e o
`HANDOFF.md` repete a lista (`:185`). **A afirmação está superada por esta peça.** O
`gravarNaPasta` **saiu** — não era compartilhado: existia só para a gravação em pasta, e a barra 1
do ajuste não o usa. O elo não se apaga: fica registrado que naquele momento se acreditou que ele
era compartilhado, e que esta peça mediu o contrário. O `#gerar-json` e o `#aviso-json`, esses
**continuam** pinados pelo teste, como aquela entrada diz.

**O que ainda não está feito.**

- **O `HANDOFF.md` precisa ser regenerado** depois deste commit: ele extrai a **última** entrada do
  `REGISTRO.md` (`tools/gerar-handoff.sh:177`), e passa a ser esta.
- ~~**⚠️ O `POST` não tem destino.** `netlify/functions/receber.js` **não existe**, `netlify.toml`
  **não existe** e o repositório **não tem** `.github/workflows/`. Enquanto isso, o `Enviar`
  falha com `HTTP 404` — **honestamente** (avisa e preserva os campos), mas **falha**. O
  transporte decidido — Netlify Function + Blobs + consolidação agendada — **não foi implementado**.
  É o próximo bloco, e reabre formalmente o `§7.3` do `ARQUITETURA-CAPTURA.md`.~~ **Superado em
  29/09/2026.** Os três arquivos **existem** desde aquela data — `netlify.toml`,
  `netlify/functions/receber.js` e `.github/workflows/reancorar.yml` —, mas o transporte ficou
  **pela metade**: a Function que recebe o `POST` e a reancoragem entraram, a **consolidação
  agendada** não. O `HTTP 404` só continua possível onde **não há site publicado**; a falha deixou
  de ser de destino inexistente e passou a ser de site ausente. A redação antiga **não é apagada**:
  fica como o elo do que se mediu naquele momento.
- **O teste de regressão diverge do contrato novo.** Os casos 10–17 ainda leem `baixados[]` pelo
  contrato **antigo** de download, e o caso 10 espera o JSON na ordem de schema obsoleta
  (`tecnica`/`funcional` no lugar de `eixo_peso`). A suíte **não fica verde** até esses casos
  serem realinhados. O arquivo é `gitignored` (`experimentos/`), logo **não entra em commit nenhum**.
- **A `simulacao-marau/simular-formulario.js`** ainda tem dublê de `fetch` só para `GET`.
- ~~**Os passos 0 a 3 da fila da pesquisadora seguem abertos**: o nível 2 `tiago`, o `id` duplicado
  do `plano.html`, e o `B6`→`B8` (aula dada / não dada pela LB da aula anterior).~~ **Superado em
  29/09/2026.** Os passos **1, 2 e 3** já estavam cumpridos no repositório quando esta linha foi
  escrita — ela não foi remedida. Só o **passo 0** segue aberto, e o motivo está na entrada de
  29/09/2026 abaixo. A redação antiga **não é apagada**: fica como o elo do que se acreditava.

## 29/09/2026 — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava cumprido, e a pendência era eco de uma nota minha

**O que motivou.** A pesquisadora pediu *"feche o passo 1 e 0"*. A fila dela — transcrita verbatim na
entrada de 28/09/2026 deste registro — traz o **Passo 1** como *"**Nível 2 `tiago`** — aplicar o mesmo
tratamento"*, com o Passo 0 (o transporte Netlify) declarado **depois** do Passo 3. Fechar o Passo 1
exige, antes de qualquer edição, **medir se ele ainda estava aberto** — e a medição diz que **não**.

**O que foi decidido.** O Passo 1 **já estava cumprido** quando a pendência foi listada, e o commit
que o cumpriu é o **`85844c1`** — `feat(notacao): o ciclo ganha a notação Benesh, o glossário e o
filtro`, **ancestral do `HEAD`** (`git merge-base --is-ancestor` ⇒ sim). O corpo daquele commit
declara a peça verbatim:

> *"`professores/tiago/ciclos/ciclo-01-notacao.md` e `ciclo-01-ritmos-notacao.md` — a **correção do
> calendário**, e só ela: o `data:` do front matter sai e o `<!-- CALENDARIO -->` entra.
> `ciclo-01-plano.md` e `ciclo-01-ritmos-plano.md` — a remoção do título `## Calendário do ciclo`,
> duplicado, pelo mesmo motivo."*

**"O mesmo tratamento" é o do `fochini`** — o precedente é **`4462d6a`**, anterior a esta frente.

**Onde entrou.** Só neste registro, em duas peças: a **nota de superação** que tacha a linha que dava
os passos 1 a 3 como abertos (na entrada de 29/09/2026 anterior a esta) e **esta entrada**. **Nenhuma
fonte de ciclo foi tocada** — as quatro já estavam corrigidas desde o `85844c1` —, **nenhum ciclo foi
regenerado** e **nenhuma âncora foi reancorada** (o `--check` das três segue válido, porque a lista de
fontes cobertas não mudou).

**Os passos 2 e 3, pela mesma medição.** A linha stale dava **três** passos como abertos, não um. Os
outros dois também foram **remedidos** e também **já estavam cumpridos**, cada um com o seu commit:
o **Passo 2** (o `id` duplicado do `plano.html`) ⇒ `id="calendario-do-ciclo"` aparece **exatamente 1×**
nos **três** `plano.html` entregues, e `nav-links` **2×** nos três; o commit que alinhou os do `tiago`
é **`53f41f4`** (o `fochini` já os tinha desde `4462d6a`). O **Passo 3** (`B6`→`B8`, a aula dada / não
dada pela linha de base) ⇒ `derivar_estado` em `tools/gerar-ciclo.sh:439`, `estadoDaAula` em
`tools/templates/lancamento.html:885`, e a regra da **linha de corte** documentada em
`ARQUITETURA-AULA.md` §2 — commit **`282fbcb`**. **Os três são ancestrais do `HEAD`.**

**A regra que sustenta a peça.** O **Nível 2 é a Camada 2 da Regra 10** — `REGRAS.md:39`: *"Camada 1:
objetivo geral + marcos por aula + rubrica. **Camada 2: escola, frequência, duração por dia, volume
semanal e datas reais** (formativa e somativa)"*. A "correção do calendário" é exatamente a Camada 2
entrando no documento pelo caminho certo: a data **não se chumba no front matter** — ela é
**injetada na geração**.

**O consumidor do marcador.** `tools/gerar-ciclo.sh:614–631` injeta o calendário real (calculado da
variante) no lugar do marcador — *"Regra 10, camada 2"*, diz o comentário ali. E ele **falha alto**
se o contrato do marcador for violado:

```python
marca = texto.count('<!-- CALENDARIO -->')
if marca != 1:
    sys.exit('%s: marcador <!-- CALENDARIO --> aparece %d vezes (esperado 1).' % (alvo.name, marca))
```

O comentário interno nomeia a armadilha: *"o `replace` sem limite injetaria o calendário em TODAS as
ocorrências do marcador, e o bloco duplicado repetiria o `id="calendario-do-ciclo"` na página.
Falha alto em vez de duplicar calado."* ⇒ **o marcador é o contrato: sem ele, ou duplicado, o
calendário não é injetado.**

**Os hunks exatos — medidos com `-U0`, não presumidos.** Os diffs da peça dizem qual era o
**defeito de cada arquivo**, e eles **não são o mesmo**:

| Arquivo | Hunk | O que muda |
|:--|:--|:--|
| `ciclo-01-notacao.md` | `@@ -7 +6,0 @@` | sai `data: "17/09/2026"` |
| `ciclo-01-notacao.md` | `@@ -49,0 +49,2 @@` | entram `<!-- CALENDARIO -->` + linha em branco |
| `ciclo-01-ritmos-notacao.md` | `@@ -8 +7,0 @@` | sai `data: "18/09/2026"` |
| `ciclo-01-ritmos-notacao.md` | `@@ -32,0 +32,2 @@` | entram `<!-- CALENDARIO -->` + linha em branco |
| `ciclo-01-plano.md` | `@@ -52,2 +51,0 @@` | sai `## Calendário do ciclo` + linha em branco |
| `ciclo-01-ritmos-plano.md` | `@@ -50,2 +49,0 @@` | sai `## Calendário do ciclo` + linha em branco |

⇒ Nas duas `-notacao.md` o defeito era o **`data:` do front matter**; nas duas `-plano.md` o
**marcador já existia** e o defeito era o **título `## Calendário do ciclo` duplicado**. Tratar os
quatro como um só caso teria escondido a diferença.

**Volume medido.** `git show --name-only --format='' 85844c1 | wc -l` ⇒ **116**; dos quais **63**
têm `/tiago/` no caminho. O `--stat` total é **116 files changed, 10689 insertions(+), 5189
deletions(-)**.

> ⚠️ **Armadilha de contagem, registrada por ter custado um erro nesta medição.** `git show --stat
> 85844c1 | grep -c "tiago"` devolve **36** — errado. A barra de truncamento do `--stat`
> (`.../tiago/...`) colapsa caminhos diferentes numa mesma linha, e o cabeçalho também casa. A
> contagem correta sai de `--name-only` com o filtro `grep -c '/tiago/'` ⇒ **63**.

**A medição que confirma o fecho.** As **quatro fontes** estão, hoje, com `data:0` e `cal:1` —
`grep -c '^data:'` e `grep -c '<!-- CALENDARIO -->'`. Não há nada a editar.

**O contraexemplo legítimo — NÃO EDITAR.** `data:` **continua válido** onde o documento é **um
achado com data própria**, e não um documento cujo calendário a geração injeta. Medido nesta rodada:

| Arquivo | `data:` | `<!-- CALENDARIO -->` | Leitura |
|:--|:--|:--|:--|
| `fochini/ciclos/ciclo-01-glossario-benesh.md` | 1 | 0 | **legítimo** |
| `tiago/ciclos/ciclo-01-glossario-benesh.md` | 1 | 0 | **legítimo** |
| as quatro fontes do Passo 1 | 0 | 1 | contrato correto |

O mesmo vale para os `captura-aula-NN.md`. **O defeito nunca foi o `data:` em si** — era o `data:`
num documento cuja data **vem** do calendário.

**Correção datada — a pendência era eco de uma nota de sessão, escrita antes do commit.** A linha
que dava o Passo 1 como aberto **não veio de uma medição do repositório**: ela reproduzia uma nota
redigida **durante a sessão de trabalho**, **antes** de o `85844c1` existir, e que ficou congelada no
artefato de planejamento daquela sessão (`plan.md`, §0.3). Quando lida depois, ela parecia afirmação
sobre o repositório — e não era. **P-03/P-04: a proveniência acrescenta, não edita.** A redação antiga **não é apagada**; ela foi **tachada e superada** na entrada de 29/09/2026 acima
desta, com nota datada, e fica como o elo do que se acreditava.

**O elo documental já existia.** A entrada de 28/09/2026 deste registro **já registrava** a peça —
*"As duas notações do Tiago receberam a **mesma** correção: perderam o `data:` do front matter e
ganharam o marcador `<!-- CALENDARIO -->`"*. ⇒ Esta entrada **não descobre nada novo**: ela fecha
**formalmente** o que já estava registrado, e corrige a contagem de estado.

**Com o quê.** Verificação medida, não presumida: `git merge-base --is-ancestor 85844c1 HEAD` ⇒
**sim**; `git show --name-only --format='' 85844c1 | grep -c '/tiago/'` ⇒ **63** de **116**;
`git show 85844c1 -U0 --format='' -- <as quatro fontes>` ⇒ os hunks da tabela; `grep -c` de `^data:`
e de `<!-- CALENDARIO -->` nas **quatro fontes** ⇒ `0`/`1`; o mesmo `grep` nos **dois glossários** ⇒
`1`/`0`; `derivar_estado` em `tools/gerar-ciclo.sh:439`; o bloco do marcador em
`tools/gerar-ciclo.sh:614–631`; a Regra 10 em `REGRAS.md:39`.

**Referências.** `85844c1` (a peça) · `4462d6a` (o precedente do `fochini`) · `REGRAS.md:39`
(Regra 10, Camada 2) · `tools/gerar-ciclo.sh:614–631` (o consumidor) · `PROTOCOLO.md:38/42`
(P-03/P-04) · entrada de 28/09/2026 deste registro (o elo) · a entrada imediatamente acima desta
(a nota de superação da linha stale).

**O que ainda não está feito.**

- **⚠️ O Passo 0 segue aberto, e agora com o represamento medido.** ~~`netlify.toml` **não existe**,
  `netlify/` **não existe** e o repositório **não tem** `.github/workflows/`.~~ **Superado em
  29/09/2026:** os três **existem**. A CLI `netlify` está
  **ausente** da máquina. E as **6 chaves** de `tools/.netlify-tokens` estão **vazias**
  (`NETLIFY_TOKEN_DUO`, `NETLIFY_SITE_DUO`, `NETLIFY_TOKEN_RITMOS`, `NETLIFY_SITE_RITMOS`,
  `NETLIFY_TOKEN_DEBORA`, `NETLIFY_SITE_DEBORA` — valor com comprimento zero, medido). ⇒ **não há
  site ID local e nada foi publicado por este repositório**; o site do Ritmos existe **só no painel
  do Netlify da pesquisadora**. **O Passo 0 depende de credencial que só ela tem** — e isso
  **continua verdadeiro**: os arquivos existem, mas sem site publicado o `Enviar` ainda falha com
  `HTTP 404`, honestamente (avisa e preserva os campos).
- **⚠️ Uma decisão continua aberta para o Passo 0**, e não é resolvível só no código:
  **onde vivem as Functions** — o `tools/deploy-netlify.sh` publica `--dir="$PACOTE"`, o pacote do
  ciclo, **não a raiz**. O `netlify.toml` da raiz fica no disco como a peça que a pressupõe.
  ~~**A outra decisão** — **quem reancora a cadeia** quando a consolidação commita pela API do
  GitHub, que não roda hook nenhum (o `hash-ciclo.sh` é bash puro) — a saída provável é um
  `.github/workflows/` rodando o `hash-ciclo.sh`.~~ **Superado em 29/09/2026:** está **respondida**
  — o `.github/workflows/reancorar.yml` reancora **por push**, rodando o `hash-ciclo.sh --check`
  antes de gerar, com o commit do próprio workflow. A redação antiga **não é apagada**: fica como
  o elo do que se supunha antes de medir.
- **O `HANDOFF.md` precisa ser regenerado** depois do commit desta entrada: ele extrai a **última**
  entrada do `REGISTRO.md` (`tools/gerar-handoff.sh:177`), e passa a ser esta.
- **A entrada de 29/09/2026 acima desta** (o botão `Salvar`) mantém em `:7485` a pergunta pela
  **revisão dos demais botões**, ainda sem resposta — e ela é do mesmo bloco do Passo 0.
- Permanecem, sem mudança nesta peça: o **par `plano-aula-NN.json` / `-anterior.json` órfão de
  leitor**; o **teste de regressão divergente** (caso 10 e seguintes; `gitignored`); e o **dublê de
  `fetch`** da `simulacao-marau/simular-formulario.js`, que ainda só trata `GET`.

## 29/09/2026 — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora por push

**O que motivou.** A pesquisadora pediu *"feche o passo 1 e 0"*. O **Passo 1** foi fechado na entrada
imediatamente acima desta. O **Passo 0** é o transporte que o formulário de lançamento espera desde
que o `POST` entrou no template: o `Enviar` apontava para uma rota que não existia em lugar nenhum, e
o `ARQUITETURA-CAPTURA.md` §7.3 continuava reaberto por isso. A decisão de arquitetura já estava
tomada e registrada desde a peça anterior — *"Netlify Function + Blobs + consolidação agendada"* —,
mas **nenhuma das três partes estava implementada**.

**O que foi decidido.** Implementar as partes do transporte que **não dependem de credencial**, e
deixar a terceira como pendência declarada, com as perguntas em aberto. Três arquivos novos:

1. **`netlify/functions/receber.js`** — a Function que recebe o `POST` do formulário. CommonJS, como
   o resto do repositório (o Netlify não faz *bundle*: publica `netlify/functions/*.js` como estão e
   roda `npm install` na raiz). Grava os dois JSON do lançamento em **Netlify Blobs**, no store
   `lancamentos`, com `consistency: 'strong'`. Três decisões de contrato que importam:
   - **A ordem de escrita é a do cliente.** O `gerarJson()` do template grava primeiro o arquivo de
     **dados** e só depois o `ciclos.json`, porque *"se o índice chegasse ao destino apontando para
     um arquivo que não está lá, a próxima abertura da página leria um ciclo inexistente"*. A
     Function preserva esse invariante: grava na ordem em que os `arquivos[]` chegam.
   - **A Function não inventa nome nem carimbo.** O `nomeNovo()` do template garante monotonicidade
     minuto a minuto, e o carimbo é `YYYY-MM-DDTHHmm` em hora **local** do professor. Reconstruir
     isso no servidor daria nome diferente do que o cliente escreveu no índice. A Function usa o
     `nome` que o cliente mandou, verbatim, com `{ onlyIfNew: true }` como rede de segurança: se a
     chave já existe, `store.set` devolve `{ modified: false }` e a Function **não** sobrescreve —
     responde colisão, não grava por cima.
   - **Falha de negócio não é erro de transporte.** O cliente trata sucesso como **HTTP 2xx + `ok`
     truthy**; falha de negócio como **HTTP 200 + `{ ok: false, erro }`**. A Function segue isso, e
     trata a ausência de ambiente de Blobs como erro legível — não como `500`.

2. **`netlify.toml`** — mínimo, e **sem `publish`**. O *publish directory* é **por site**, não do
   repositório: a decisão de 18/09/2026 já registrava *"Configurar o publish directory de cada site
   no Netlify"* como pendência de configuração. Pôr `publish` aqui obrigaria todos os sites à mesma
   pasta e contrariaria aquela decisão. O que o arquivo faz é declarar
   `[functions] directory = "netlify/functions"`.

3. **`.github/workflows/reancorar.yml`** — o **primeiro workflow** deste repositório. Lançar uma
   aula desatualiza a âncora do ciclo, e até aqui a reancoragem era manual. O workflow roda em
   `push` para `main` tocando `professores/**` ou `tools/lib-fontes.sh`, **descobre a matriz do
   disco** (`professores/*/ciclos/ciclo-*-*.conf`) em vez de hardcodá-la, e para cada variante
   **valida antes de gerar** (`hash-ciclo.sh … --check`): se a âncora já está em dia, não toca em
   nada. ⭐ **Não é detalhe.** `hash-ciclo.sh` carimba `ANCORADO_EM="$(date +%F)"`, que fica **fora**
   da fórmula do hash — sem o `--check` primeiro, o arquivo mudaria de conteúdo todo dia só pela
   data, gerando um commit diário por variante. Depois de gerar, revalida, e só commita se algo
   mudou de fato. O commit sai como `github-actions[bot]`, com `chore(estrutura):` e os três
   rodapés.

**Onde entrou.** `netlify/functions/receber.js` · `netlify.toml` · `.github/workflows/reancorar.yml`
· esta entrada · `package.json` / `package-lock.json` (a dependência `@netlify/blobs ^11.1.1`, que a
Function usa). **As três fontes de ciclo não mudaram** — nenhuma âncora precisa ser regerada por esta
peça, e as dez âncoras do repositório seguem passando `--check`.

**Motivo declarado — os congelados.** Nenhum arquivo congelado foi **alterado**: `netlify.toml`,
`netlify/` e `.github/workflows/` são arquivos **novos**, e `CONGELAMENTO.md` lista o que exige
motivo declarado, não o que é novo. Mas esta peça cai em duas das categorias que **sim** exigem
declaração: **altera a lógica de geração/deploy** (o `netlify.toml` passa a valer para os sites, e a
reancoragem deixa de ser manual) e **reabre um congelado por decisão** — o `§7.3` do
`ARQUITETURA-CAPTURA.md`, que dizia *"sem backend"*. O motivo vai no corpo do commit, e é este: o
formulário **deixa de exportar e passa a enviar**; o elo passa a ser escrito no servidor em vez de
anexado à mão pelo professor.

> **O que esta peça supera — e o elo que se preserva.** A entrada que registrou a decisão de
> 20/09/2026 declarava, verbatim: *"a **opção A** — o formulário exporta o elo e o professor anexa;
> **o Git registra**. **Não há script que escreva na fonte.**"* **O Passo 0 supera a opção A.** Agora
> há escrita no servidor (Blobs) e há escrita no Git (o workflow commita a âncora). As quatro
> ocorrências de *"sem backend"* que ficam superadas — `REGISTRO.md:6836`, `:7482`, a seção
> *Referências* da entrada do botão `Salvar`, e `ARQUITETURA-CAPTURA.md:625` — recebem nota datada
> ou são tachadas na própria entrada, conforme o caso. **A redação antiga não é apagada**: fica como
> o elo do que se decidiu antes, e do que se acreditava naquele momento.

**Com o quê.** Medição, não presunção: `node --check netlify/functions/receber.js` ⇒ **OK**;
`require('@netlify/blobs')` resolve a partir da raiz; o `netlify.toml` e o workflow passam pelo
parser de YAML; a matriz do workflow foi **provada** enumerando o glob do disco ⇒
`fochini 01 diaghilev`, `tiago 01 duo`, `tiago 01 ritmos` (o `ciclo-01.conf` base não entra, porque
não casa o padrão `ciclo-*-*.conf`); `fontes_do_ciclo()` em `tools/lib-fontes.sh` **já declara o
`-dados.json` do ciclo como FONTE** — e a `cobertura:` do `ciclo-01-duo.fipp` **já o inclui**, o que
fecha a questão de saber se o lançamento entra no hash (entra). Varredura de "consolidação":
`grep -n -i "consolid" REGISTRO.md` ⇒ só `:7591` e `:7735`, e `find . -name 'consolidar*'` ⇒ **vazio**.

> **Nota de 29/09/2026.** A medição acima descrevia o estado **de então**, e o que ela **não** media é
> o que importava: `node --check` prova que o arquivo *parseia*, não que ele **funciona**. Publicada
> a Function, o caminho feliz foi exercitado pela primeira vez — e ele falhava **sempre**. O `find`
> do `dadosDe` usava `/-dados\.json$/`, que exige que `dados.json` **encerre** o nome; mas o cliente
> **nunca** envia esse nome: o `gerarJson()` manda o nome **carimbado** por `nomeNovo()`, e o carimbo
> de `carimboArquivo()` (`AAAA-MM-DDTHHMM`, hora local, sem segundos) fica **entre** `dados` e
> `.json`. O `dadosDe` ficava `undefined` e a Function recusava em `faltou o arquivo de dados ou o
> ciclos.json` — **antes de qualquer `store.set`**: nenhum lançamento real seria aceito. Corrigido
> oito minutos depois, no mesmo dia (`50f73f9` 16h40, `9a0b5c3` 16h48): o regex passa a aceitar as
> duas formas — `/-dados(-[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{4})?\.json$/`, em
> `netlify/functions/receber.js:36` — e a forma do carimbo é **copiada** de `carimboArquivo()`. O
> `slugDe` do **mesmo** arquivo já usava o regex prefixado correto — os dois estavam
> **inconsistentes entre si**, e só a **detecção** dependia do defeituoso. A redação acima **não é
> apagada**: fica como o elo de uma medição que era verdadeira e **insuficiente**. A lição vale
> também para o **irmão gêmeo** desta peça — o `yaml.safe_load` que validou o workflow: parser e
> `--check` provam **sintaxe**; quem prova contrato é **executar o caminho feliz**.

**Referências.** `tools/hash-ciclo.sh:105` (`ANCORADO_EM`) · `tools/lib-fontes.sh`
(`fontes_do_ciclo`) · `tools/hooks/pre-commit:67–82` (a trava de âncora desatualizada) ·
`tools/gerar-ciclo.sh:455–525` e `:614–631` (o índice e o calendário) · `tools/templates/lancamento.html`
(`:722–745` o contrato do `POST`; `:925–960` o carimbo e o `nomeNovo`; `:1440–1525` o `gerarJson`) ·
`ARQUITETURA-CAPTURA.md` §7.3 e §7.6 · `ARQUITETURA-AULA.md` §5.2 · `README.md:93–96` · a entrada de
18/09/2026 deste registro (o deploy a partir do Git, uma conta por escola) · a entrada de 20/09/2026
(a "opção A") · a entrada de 28/09/2026 (o botão `Salvar`) · a entrada imediatamente acima desta (o
fecho do Passo 1).

**O que ainda não está feito.**

- **⚠️ A consolidação agendada não existe — e é a metade que falta.** Hoje a Function **grava** o
  lançamento no Blob, mas **nada move o Blob de volta para o Git**: o `-dados.json` do pacote
  continua o antigo, a âncora não regera sozinha e o workflow não tem o que commitar. As perguntas
  em aberto, para quem pegar esta peça: **o que varre** (o store `lancamentos` por prefixo?) · **o
  que commita**, e **por qual API** (o workflow tem `contents: write`, mas a consolidação não
  conhece o caminho do arquivo no pacote) · **com que frequência** · e **se regenera o pacote**
  depois. Enquanto isso, o lançamento **não vira fonte**. **Não implementado — decisão explícita da
  pesquisadora nesta rodada: documentar como pendência e commitar só as três partes prontas.**
- **⚠️ "Onde vivem as Functions" continua aberta** (`ARQUITETURA-CAPTURA.md` §7.6 = *"o formulário
  roda onde?"*). O `tools/deploy-netlify.sh:118/120` publica `netlify deploy --prod --dir="$PACOTE"`
  — o **pacote do ciclo**, não a raiz. Se o deploy continuar por esse caminho, o `netlify.toml` da
  raiz **pode não ser lido**, e as Functions podem não subir. É inferência forte, **não medida**.
- **O `HANDOFF.md` precisa ser regenerado** depois do commit desta entrada: ele extrai a **última**
  entrada do `REGISTRO.md` (`tools/gerar-handoff.sh:177`), e passa a ser esta.
- **A pergunta de `REGISTRO.md:7485`** pela **revisão dos demais botões** do formulário **segue sem
  resposta**, e é do mesmo bloco do Passo 0.
- Permanecem, sem mudança nesta peça: o **par `plano-aula-NN.json` / `-anterior.json` órfão de
  leitor**; o **teste de regressão divergente** (caso 10 e seguintes; `gitignored`); e o **dublê de
  `fetch`** da `simulacao-marau/simular-formulario.js`, que ainda só trata `GET`.

## 29/09/2026 — Os dois congelados entram: o índice ganha o slug e a entrevista declara dois artefatos

**O que motivou.** Duas alterações estavam paradas no worktree, ambas em arquivo congelado, e
nenhuma com entrada neste registro. A primeira é de outra sessão: o `ciclos.json` que o
`gerar-ciclo.sh` escreve não traz o **slug** da pasta do professor, e o backend que passou a existir
hoje (`receber.js`) o procura ali — o `slugDe` tem `c.professor` como **primeira** regra, e sem ela
cai no nome do arquivo de dados. A segunda é uma deriva documental: o prompt da entrevista dizia, na
abertura, que ela compila *"tudo num documento único em Markdown"*, quando a seção `## O que esta
entrevista produz` — já no mesmo arquivo — diz o contrário: *"dois artefatos do mesmo ciclo — não
um só"*. Documento com informação conflitante é o que a pesquisadora proibiu explicitamente.

**O que foi decidido.** Publicar as duas, com o motivo declarado que o `CONGELAMENTO.md` exige, e
deixar registrado o que **não** foi feito.

1. **`tools/gerar-ciclo.sh` — o índice passa a declarar `professor`.** O contrato que a Function
   implementa é: o slug da pasta (`professores/<slug>/`) é o que endereça o pacote, e o pacote
   publicado não tem de onde tirá-lo — a chave do store é montada como
   `<professor>/<ciclo>-<carimbo>`.
   - **Por que `professor` e não `escola`.** `escola` é o **nome de exibição** (`"Diaghilev"`), e o
     slug da variante só existe dentro do nome do arquivo de dados. Trocar um pelo outro daria
     chave com espaço, acento e maiúscula.
   - **A ordem das regras resolve o caso.** `slugDe` lê `c.professor`, depois `dados.professor`,
     depois o regex sobre `c.arquivo`. Enquanto o índice não traz o campo, a primeira regra nunca
     dispara e a chave sai do nome do arquivo de dados.
   - **`PROFESSOR_SLUG` já existia no escopo.** Ele é o `$1` do script (default `tiago`) e é ele que
     resolve a pasta de trabalho; a emenda só o repassa ao processo Python que monta o índice.

2. **`prompts/eliciar-ciclo.md` — a entrevista declara os dois artefatos.** A abertura passa a
   nomear **o plano das aulas** e **o recorte do que eu vou observar**, ganha a seção `## O que esta
   entrevista produz`, e dois itens em *"Como conduzir"*.
   - **A cauda de `:4` foi corrigida nesta peça.** Ela dizia *"você compila tudo num documento único
     em Markdown"* — o resíduo que contradizia a seção nova. Agora diz *"você compila os dois
     artefatos do mesmo ciclo em Markdown"*. A varredura por `documento único` no repositório volta
     vazia: era o último.
   - **As linhas de `:3`/`:4` não foram tocadas.** Elas já estavam corretas — nomeavam o plano e o
     recorte. O erro era só a cauda.

**Onde entrou.** `tools/gerar-ciclo.sh` — `PROFESSOR_SLUG` no ambiente do bloco Python (`:298`) e o
campo `'professor'` no `indice` (`:501`), com o comentário que explica por que não é `escola` ·
`prompts/eliciar-ciclo.md` — abertura, seção nova e dois itens de conduta · `REGISTRO.md` — esta
entrada.

**Motivo declarado — os congelados.** Os dois arquivos são congelados, e a mudança de cada um tem
motivo próprio. `tools/gerar-ciclo.sh` **não muda o que gera** — não toca layout, hash, âncora nem
nome de arquivo; acrescenta **um campo de metadado** ao índice, e o índice já era o artefato que
declara quem é o ciclo. Sem ele, o transporte que entrou hoje (a Function e o store) **não teria
como saber o dono do pacote**: o `ciclos.json` publicado hoje traz só `id`, `escola`, `inicio`,
`fim`, `total_aulas` e `aulas[]`, e o slug não está em nenhum deles. A alteração é **aditiva e
retrocompatível** — quem lê o índice hoje ignora o campo novo, e o `receber.js` só o consulta como
primeira tentativa. `prompts/eliciar-ciclo.md` **não é consumido por nenhum gerador**: é texto de
entrevista, lido por humano e por sessão de IA. A emenda só o alinha ao que ele mesmo já dizia
adiante; a correção da cauda remove a única contradição que restava no repositório. Em nenhum dos
dois casos há dependência nova, mudança de contrato de arquivo ou efeito sobre ciclo publicado.

**Com o quê.** `tools/gerar-ciclo.sh`, `prompts/eliciar-ciclo.md`, `REGISTRO.md`. Commit próprio,
separado das alterações livres do mesmo worktree, como o `CONGELAMENTO.md` pede.

**Referências.** `CONGELAMENTO.md` (a regra do motivo declarado) · `netlify/functions/receber.js`
(`slugDe` e a ordem das regras) · a entrada de 29/09/2026 acima, *"o `POST` ganha destino e a cadeia
reancora por push"* · `ARQUITETURA-PE.md` e `ARQUITETURA-ANAMNESE.md`, que já citam o prompt como
produtor de dois artefatos.

**O que ainda não está feito.** A emenda do `gerar-ciclo.sh` **não foi propagada**: medido nos três
índices publicados (`fochini/ciclo-01-diaghilev`, `tiago/ciclo-01-duo`, `tiago/ciclo-01-ritmos`), o
campo `professor` está **ausente nos três** — a fonte mudou, os pacotes não. Enquanto não forem
regerados, o `slugDe` cai na segunda e na terceira regras, e é por isso que o `receber.js` as
mantém. Regerar exige rodar `tools/gerar-ciclo.sh` nos três pacotes e reancorar os três ciclos.
Nada disso é fonte de ciclo: nenhum dos dois arquivos entra na âncora, então nenhum `.fipp` precisa
ser refeito por causa desta peça.

## 29/09/2026 — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do que se acreditava

**O que motivou.** A pergunta *"fizemos os passos 0, 1, 2 e 3?"* obrigou a **medir** o formulário em
vez de citá-lo — e a medição derrubou uma premissa que este registro sustentava desde 27/09: o `B8`,
o ajuste **no plano**, era descrito como vivo em **oito** pontos deste arquivo. Ele **saiu do
código** em 28/09/2026 (`17ed444`, *"O botão `Exportar ajuste do plano` sai do formulário"*), e o
que sobrou foram afirmações conflitantes: um documento dizendo que a coisa existe e o código dizendo
que não. A pesquisadora foi explícita: *"não dá para ter informações conflitantes em documentos
diferentes"*.

**O que foi decidido.** Nenhuma redação antiga é apagada (P-03/P-04). Os oito pontos ganham **nota
de superação datada, no lugar**, e esta entrada é o elo que a nota do `ARQUITETURA-AULA.md` já
citava pelo título.

1. **A varredura de código é zero.** `podeAjustarPlano`, `#acoes-plano` e `mdAjusteDoPlano` não
   existem em `tools/templates/lancamento.html` nem em `tools/`; de `exportarAjusteDoPlano` resta
   **um comentário** — `tools/hooks/pre-commit:184` —, resíduo que o hook ainda carrega ao explicar
   de quem é o elo. A remoção não foi parcial: os quatro saíram juntos, com a barra que os
   sustentava.
   - **O que fica de pé é o guard, não a página.** A distinção que a redação de 27/09 atribuía ao
     formulário nunca dependeu dele: `tools/hooks/pre-commit` aplica a sub-seção **`§2c`** (bloco
     `:172–305`) sobre a **fonte** `aula-NN.md`, deferindo-a contra o `HEAD` — **não lê id nenhum de
     HTML**, e por isso a remoção não o alcança.
   - **O `§8` não é do hook.** Ele é a seção do `ARQUITETURA-AULA.md` que lista os arquivos
     congelados, e é o próprio guard que a cita (`pre-commit:175`). As duas referências permanecem:
     `§8` é do documento, `§2c` é do hook.

2. **O relógio do formulário é um só — e a assimetria voltou a ser pendência.** `podeAjustar()` está
   em `tools/templates/lancamento.html:970` e é consumida em **`:1566`** (o `disabled` do botão) e
   **`:1572`** (o texto do aviso); `estadoDaAula`/`pulada` estão em **`:885`**/**`:901`**. O "efeito
   colateral" que a quinta afirmação descrevia — a aula `dada` sem registro deixar o bloco do ajuste
   oculto — **não tem mais o desenho que o resolvia**: o mecanismo hoje é o predicado de
   `:1536`/`:1538` sobre `:1562`, e o comentário-elo de `:1555–1557` continua declarando a intenção.
   ~~Fica registrado como **pendência**, não como virtude.~~ **Superado em 30/09/2026.** A medição
   do mesmo template mostrou que o comportamento é **correto**: o predicado de `:1562` esconde a
   barra **só no modo lançamento** (`captura`/`emAjuste`), onde não haveria o que ajustar; no **modo
   leitura** ela aparece, com o botão habilitado dentro do prazo (`podeAjustar()`, `:970`) ou **cinza
   com a data visível** fora dele (`:1572–1574`). A redação antiga **não é apagada**: fica como o elo
   do que se mediu naquele momento.
   - **Nenhum auxiliar do "O que NÃO se toca" foi perdido.** A varredura confirmou os catorze
     (`diffAulas`, `baixar`, `legivel`, `nomeDoAutor`, `carimboArquivo`, `pecaArquivo`,
     `estadoDaAula`, `semZona`, `carimboDaAula`, `escolaDoArquivo`, `podeAjustar`, `esc`, `pulada`,
     `fimDoPrazo`) e os ids da barra 1 (`#acoes-ajuste` `:118`, `#ajustar` `:119`,
     `#cancelar-ajuste` `:120`, `#aviso-ajuste` `:121`, `#gerar-json` `:131`, `#aviso-json` `:132`).
   - **Três coordenadas da entrada de 28/09 estavam erradas.** A gate é **`:970`** — o `:975` é
     linha em branco; o listener do `#ajustar` é **`:1753`** — o `:1761` é `renderCaptura();`, e
     pertence ao listener do `#cancelar-ajuste` de `:1758`; e a `lib-vistas` vive em
     **`tools/lib-vistas.js`** — `:48` é `function mdAjuste(aj) {` —, não em `biblioteca/`.

**Onde entrou.** `REGISTRO.md` — esta entrada e os oito pontos superados (o item 2, o item 4 e a
quinta afirmação de *"o ajuste no plano deixa de ser promessa"*; os três da entrada do `B8`; e a
imprecisão tripla da entrada de 28/09) · `ARQUITETURA-AULA.md` — a nota de 29/09/2026 no `§1`
(`:113–132`), que cita esta entrada pelo título.

**Com o quê.** `REGISTRO.md`, `ARQUITETURA-AULA.md`. Nenhum dos dois é congelado
(`CONGELAMENTO.md`), e nenhum é fonte de ciclo: nenhum `.fipp` precisa ser refeito por causa desta
peça.

**Referências.** `git show --stat 17ed444` (8 arquivos, 160 inserções, 1 110 deleções) · a entrada de
28/09/2026 acima, *"O botão `Exportar ajuste do plano` sai do formulário: era erro de assistente"* ·
`tools/gerar-ciclo.sh:221–231` (o par `plano-aula-NN-anterior.json` **segue** produzido como
proveniência, e o `cp` de `:258` vem antes do `mv` de `:259`) · `ARQUITETURA-AULA.md`, a nota de
29/09/2026 que esta entrada fecha.

**O que ainda não está feito.** ~~A assimetria do item 2 **precisa de decisão**: hoje, a aula `dada`
sem registro deixa o bloco do ajuste oculto, e não há mais o desenho que resolvia isso — o professor
não tem por onde ajustar um lançamento vencido. Some-se a isso o resíduo de
`tools/hooks/pre-commit:184`, que ainda nomeia `exportarAjusteDoPlano` como coisa viva: ele é
congelado, e corrigi-lo exige motivo declarado e commit próprio.~~ **Superado em 30/09/2026.** As
duas pendências caíram **por medição**, não por remendo: a assimetria **não se aplica** ao
comportamento real — o predicado de `:1562` esconde a barra só no **modo lançamento** —, e o
comentário do `pre-commit` deixou de nomear a função que não existe. A redação antiga **não é
apagada**: fica como o elo do que se mediu naquele momento. Quanto ao `HANDOFF.md`, ele **precisa
ser regenerado depois** da entrada de 30/09/2026, que passa a ser a última deste registro.

**A baixa do que estava pendente acima está declarada e medida na entrada de 30/09/2026**, abaixo
— inclusive a coordenada do `pre-commit` que esta redação deixa de nomear.

## 30/09/2026 — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor` e duas pendências que a medição derrubou

**O que motivou.** Três pendências declaradas neste registro se tocavam, e por isso foram fechadas
na mesma rodada, numa ordem que não podia ser invertida: a grafia `fochini` → `fokini` **antes** de
regerar os pacotes (senão o `ciclos.json` sai com o nome errado e o trabalho é feito duas vezes), a
baixa do ponto 3 **junto** com o rito do comentário do `pre-commit`, e a reancoragem **por último**.
O rito do `CONGELAMENTO.md` vale para `tools/`: motivo declarado, entrada neste arquivo e commit
próprio.

**O que foi decidido.** Quatro frentes, nenhuma delas reescrevendo fonte pedagógica:

1. **O rename — `fochini` → `fokini`.** O diretório `professores/fochini/` virou
   `professores/fokini/`, o campo `PROFESSOR=` do `ciclo-01.conf` acompanhou, e as citações de
   **caminho** em documentos e prosa foram corrigidas. Os nomes de **exibição** dentro dos `.fipp`
   **não** foram tocados: aqueles gravam o rótulo intencionalmente, e se ele deve acompanhar é
   decisão separada, que **não foi tomada aqui**. A varredura fechou: `grep -rn -i "fochini" .`
   volta **zero** fora de `REGISTRO.md` e `HANDOFF.md`, e ali o que resta é **elo histórico** (as
   entradas antigas, que não se apagam) e o **espelho gerado**, que cai na regeneração.
2. **A regeração propaga o campo `professor`.** Fecha a pendência que a entrada *"Os dois congelados
   entram: o índice ganha o slug e a entrevista declara dois artefatos"* deixou declarada: o campo
   estava **ausente nos três** índices publicados, e os pacotes não tinham acompanhado a fonte.
   Rodado `tools/gerar-ciclo.sh` nos três ciclos, o campo sai **preenchido** em
   `ciclos.json:7` — `"fokini"`, `"tiago"`, `"tiago"`, o **nome do diretório**. Com isso a
   **primeira** regra do `slugDe()` (`netlify/functions/receber.js:40`) passa a valer; as duas
   outras viram **fallback declarado**, e é por isso que continuam no arquivo.
3. **O ponto 3 baixa por medição.** O comportamento do botão de ajuste **está correto**, e foi
   medido no template em vez de citado: no **modo lançamento** o predicado de
   `tools/templates/lancamento.html:1562` esconde a barra (`!temAula`) — não há o que ajustar,
   porque não há lançamento; no **modo leitura** ela aparece, e o botão fica **habilitado** dentro do
   prazo (`podeAjustar()`, `:970`, consumida em `:1566` e `:1572`) ou **cinza com a data visível**
   fora dele. O professor **vê que a possibilidade existiu**, em vez de o botão sumir sem
   explicação. A "assimetria do efeito colateral" **não se aplica**: ela supunha oculto o bloco no
   modo leitura, e o que o código faz é ocultá-lo no modo lançamento. As duas notas de superação
   datadas ficam na entrada do `B8` (*"O `B8` medido: `podeAjustarPlano()` não existe, e o elo do que
   se acreditava"*), no item 2 e no pendente dela.
4. **O comentário do `pre-commit` deixa de nomear o que não existe.** `tools/hooks/pre-commit:182–188`
   passa a dizer o que é verdade: `exportarAjusteDoPlano` — e a barra `#acoes-plano` que a sustentava
   — saíram de `tools/templates/lancamento.html` em 28/09/2026 (`17ed444`), e **o guard da `§2c`
   nunca dependeu delas**: ele lê a fonte `aula-NN.md` e a defere contra o `HEAD`, **não lê id nenhum
   de HTML**. O `echo` de `:296`, que orientava o professor a usar o botão, foi corrigido na mesma
   direção.

**Onde entrou.** `REGISTRO.md` — esta entrada e as duas notas de superação na entrada do `B8` ·
`ARQUITETURA-AULA.md` — a nota de 30/09/2026 no `§1` · `ARQUITETURA-ANAMNESE.md` — a §3 nova (a
observação inicial e os elementos basilares), com a renumeração das seções seguintes · os três
pacotes regerados (`fokini/ciclo-01-diaghilev`, `tiago/ciclo-01-duo`, `tiago/ciclo-01-ritmos`),
com os índices, os dados e os PDFs · `tools/gerar-ciclo.sh:241`, `tools/lib-fontes.sh:85` e
`tools/validar-aula-ciclo.js:14`/`:32` — quatro linhas de **prosa** que ainda diziam `fochini`.

**Motivo declarado — os congelados.** `tools/` é congelado (`CONGELAMENTO.md`), e esta rodada o
tocou em **quatro arquivos**. O que **não muda**: a fórmula de hash da âncora, a cobertura da
âncora, os validadores, as regras pedagógicas e as pétreas. Em `gerar-ciclo.sh`, `lib-fontes.sh` e
`validar-aula-ciclo.js` a alteração é **prosa** — o nome do professor num comentário —, e **nada**
de comportamento: o `PROFESSOR_SLUG` de `:298` e o campo `'professor'` de `:501` já liam o nome do
**diretório**, e é justamente por isso que a regeração do item 2 era necessária. Em
`tools/hooks/pre-commit` a alteração é **só o texto** do comentário e da mensagem; o guard da `§2c`
(`:172–305`) tem o **mesmo** comportamento: continua deferindo `aula-NN.md` contra o `HEAD`, e
continua recusando o commit nos mesmos casos. Nenhum dos quatro arquivos é fonte de ciclo — nenhum
`.fipp` foi refeito por causa desta peça.

**Com o quê.** `tools/gerar-ciclo.sh`, `tools/lib-fontes.sh`, `tools/validar-aula-ciclo.js`,
`tools/hooks/pre-commit`, `REGISTRO.md`, `ARQUITETURA-AULA.md`, `ARQUITETURA-ANAMNESE.md`. Os quatro
de `tools/` são congelados ⇒ **commit próprio**, separado das alterações livres do mesmo worktree,
como o `CONGELAMENTO.md` pede. O rename e a reancoragem já foram declarados em `31d97fe`, *"o slug e
o nome de exibição"* — esta entrada **não duplica** aquele motivo (P-04), apenas o refere: a âncora
mudou porque a **fonte mudou de caminho**, não porque o conteúdo pedagógico mudou.

**Referências.** `31d97fe` (o rename e a reancoragem declarados) · `17ed444` (a saída do botão
`Exportar ajuste do plano`) · os três `--check` de `tools/hash-ciclo.sh` — **verdes nos três
ciclos** antes deste commit · o harness de `netlify/functions/receber.js` — 17/17 · `node
tools/check-pacote.js` — 0 erro nos três pacotes · a entrada de 29/09/2026, *"Os dois congelados
entram: o índice ganha o slug e a entrevista declara dois artefatos"*, que declara a pendência do
campo `professor` que o item 2 fecha · `tools/templates/lancamento.html:118`, `:885`, `:901`,
`:970`, `:1535–1538`, `:1555–1557`, `:1562`, `:1566`, `:1572–1574`, `:1753` (a medição do item 3).

**O que ainda não está feito.** O **Passo 0** segue aberto, e continua dependendo de **credencial
que só a pesquisadora tem**: as **6 chaves** de `tools/.netlify-tokens` estão **vazias**, e sem site
publicado o `Enviar` do formulário ainda falha com `HTTP 404` — honestamente: avisa e preserva os
campos. Do mesmo bloco, **segue aberta** a decisão de **onde vivem as Functions** (o
`tools/deploy-netlify.sh` publica `--dir="$PACOTE"`, o pacote do ciclo, **não a raiz**, e o
`netlify.toml` da raiz pode não ser lido), e **segue sem resposta** a pergunta pela **revisão dos
demais botões** do formulário, feita em `REGISTRO.md:7536` e repetida em `:7808` e `:7934` — a
medição desta rodada corrigiu a coordenada que a última delas cita: é **`:7536`**, não `:7485`.
Permanecem, sem mudança nesta peça: o par `plano-aula-NN.json` / `-anterior.json` **órfão de
leitor**; o **teste de regressão divergente** (caso 10 e seguintes; `gitignored`); o **dublê de
`fetch`** da `simulacao-marau/simular-formulario.js`, que ainda só trata `GET`; e o comentário
resíduo de `tools/templates/lancamento.html:133`. Por fim, o `HANDOFF.md` precisa ser **regenerado
depois** desta entrada — ele espelha a **última** deste registro, e passa a ser esta.

## 30/09/2026 — O segundo papel do agente: o servidor local **não existe**; e o Ponto 1 fecha como diagnóstico

**O que motivou.** O prompt que abriu esta rodada descreve o agente com **dois papéis**: o papel 1
escuta o `salvar` (o `POST`, que já estava descrito), e o papel 2 serviria os dados ao formulário
por `GET /dados/<professor>/<ciclo>`, lendo o repositório local — para o professor continuar
lançando **sem internet**, quando o pacote publicado não está acessível. Antes de implementar o
papel 2, era preciso **medir se ele existe**. Na mesma rodada, o **Ponto 1** (a publicação do
`ciclo-ritmos` no Netlify) arrastava desde 19/09 sem causa declarada.

**O que foi decidido.** Seis pontos, todos medidos nesta rodada.

1. **O papel 2 não existe.** É hipótese do prompt, não código. O único arquivo de
   `netlify/functions/` é `receber.js` (4 988 B, 29/09 16:47), e a resposta dele a `GET` é um
   *health check* puro — `receber.js:47`, `{ ok: true, receber: 'pronto' }`. Nenhuma especificação
   de leitura local do repositório aparece em `prompts/`, `.github/`, `ARQUITETURA-*.md`,
   `METODO.md`, `PROTOCOLO.md`, `REGRAS.md`, `CONGELAMENTO.md` ou `tools/`.
2. **O papel 1 também não grava no repositório.** `receber.js:82` grava em **Netlify Blobs**
   (`store.set(chave + '/' + basename(a.nome), a.texto, { onlyIfNew: true })`), não em arquivo
   versionado. A **consolidação do Blob de volta ao repositório não existe** — é a metade aberta da
   §7.3 do `ARQUITETURA-CAPTURA.md`, declarada na nota de 29/09/2026.
3. **A leitura local, em parte, já funciona.** `lancamento.html:187` fixa `const P = './'` — tudo é
   lido **ao lado da página** —, e há **seis** leituras relativas, `fetch(P + …)`, em `:285`,
   `:291`, `:313`, `:564`, `:992` e `:1720`; o **único** `POST` do arquivo é `:733`,
   `fetch(RECEBER, …)`, com `RECEBER` declarado em `:731`. Um `python3 -m http.server` sobre o
   pacote **já entrega** o `ciclos.json` e o `ciclo-NN-<escola>-dados.json`. Falta ler do
   **repositório canônico** — e isso é o papel 2, que não existe.
4. **É decisão aberta, não atraso.** No `ARQUITETURA-CAPTURA.md` §7 estão **"Não decidido"** a §7.2
   (`:561`), a §7.4 (`:564`), a §7.5 (`:567`) e a §7.6 (`:568`); a §7.3 (`:622`) foi decidida em
   20/09, e a nota de 29/09 (`:627`) declara que ela "deixou de valer integralmente". O próprio
   documento resume: "Há **quatro perguntas em aberto** (§7) e **cinco decisões tomadas**"
   (`:619–620`). Implementar o agente local decidiria, por código, o que a §7.6 mantém em aberto.
5. **`tools/` é congelado.** Se o agente local nascer ali, paga o rito do `CONGELAMENTO.md` (motivo
   declarado + entrada neste registro + commit próprio) — e exige decidir antes a **porta** e o
   **CORS**, porque a página é servida por `python3 -m http.server` e o agente seria outro serviço.
6. **O Ponto 1 fica fechado como diagnóstico**, por declaração da pesquisadora. A causa **não é
   código**: é **crédito da conta**. Medido pelo token de `tools/.netlify-tokens` (usado, **nunca
   impresso**) — o site `ciclo-ritmos` tem `published_at: None`; o último deploy `ready` é de
   19/09/2026T22:48:49Z; são **44 deploys** (35 `error` e 9 `ready`), **44/44** com `deploy_source:
   api` e `manual_deploy: False`, e **os 35 erros** trazem a mesma `error_message`, *"Skipped due to
   account credit usage exceeded"*. O mais novo é de 30/09/2026T11:32:33Z — recusado **antes do
   build**, com `commit_ref` no `5309cc3`. A conta `tmenegaz77` se declara `type_name: Free`,
   `plan_credits: 300`, `usages_exceeded: []` — uma contradição que **não** invalida a medição,
   porque a recusa é de crédito e vem do serviço, não do cadastro. O pacote no ar é de **19/09**,
   anterior aos JSONs do formulário. O que está feito é a **decisão de parar**; publicar depende de
   **terceiro**.

> **Correção de 30/09/2026 (mesmo dia).** Duas redações declaram as **6 chaves** de
> `tools/.netlify-tokens` como **vazias**: o bloco abaixo, nesta entrada, e a entrada anterior
> (`REGISTRO.md:7789`). Está **errado** — medido por **comprimento** (não pelo `sed`, que mente):
> **RITMOS está preenchido** (token de 40 caracteres, site ID de 36); só **DUO** e **DEBORA**
> seguem em `=""`. A redação anterior **não é apagada**: fica como o elo do que se mediu primeiro
> (P-03/P-04).

**Onde entrou.** `REGISTRO.md` — esta entrada, e mais nada. Nenhum arquivo de
`ARQUITETURA-CAPTURA.md` foi tocado: as decisões §7.2 a §7.6 continuam onde estão, e é lá que o
desenho do agente local deve ser declarado, se e quando for decidido.

**Com o quê.** Só `REGISTRO.md`. **Nenhum** arquivo do `CONGELAMENTO.md` foi tocado, **nenhuma**
fonte de ciclo foi alterada e **nenhuma** âncora de proveniência foi regerada — os três
`tools/hash-ciclo.sh --check` (diaghilev, duo e ritmos) seguem **verdes**. Sem commit e sem push
nesta peça.

**Referências.** `netlify/functions/receber.js` — `:38` (o `slugDe`), `:39` (a primeira regra,
sobre o índice), `:40–42` (as duas seguintes), `:47` (o `GET`, *health check*), `:82` (o
`store.set`), `:89` (a resposta) · `tools/templates/lancamento.html` — `:187`, `:731`, `:733`,
`:970`, `:1562` (o predicado da barra de ajuste), `:1555–1557` · `ARQUITETURA-CAPTURA.md` — §7
(`:543`), §7.2 `:561`, §7.4 `:564`, §7.5 `:567`, §7.6 `:568`, §7.3 `:622`, e a nota de 29/09 em
`:627–634` · as medições de rede: `GET /sites/<id>`, `GET /sites/<id>/deploys?per_page=100`,
`GET /sites/<id>/deploys/<deploy>` e `GET /accounts` · a entrada de 29/09/2026, *"Os dois congelados
entram: o índice ganha o slug e a entrevista declara dois artefatos"*.

**O que ainda não está feito.** O **agente local** continua **não implementado** — e agora se sabe
que ele era **hipótese**, não pendência de código: a medição desta rodada **derrubou** a premissa do
prompt. Segue **sem existir** a consolidação dos lançamentos do Blob de volta ao repositório (§7.3).
Seguem **"Não decidido"** a §7.6 (onde o formulário roda), a §7.2, a §7.4 e a §7.5 — e é a §7.6 que
governaria o agente local. A **publicação do `ciclo-ritmos`** está bloqueada por **crédito da
conta**; reabre por **faturamento**, não por código. Permanecem sem resposta a pergunta pela
**revisão dos demais botões** do formulário, feita em `REGISTRO.md:7536` e repetida em `:7808` e
`:7934` (a medição desta rodada **confirma** a coordenada `:7536`); a decisão de **onde vivem as
Functions** (o `tools/deploy-netlify.sh` publica `--dir="$PACOTE"`, o pacote do ciclo, não a raiz);
e a decisão sobre o **nome de exibição** dentro dos `.fipp`, que **não** acompanha a correção de
grafia do diretório — é pergunta separada, e não foi tomada. A anotação do "comentário resíduo de
`tools/templates/lancamento.html:133`", herdada da entrada anterior, **não se confirma**: medido por
texto, nenhum comentário do template nomeia função removida, e `:133` é o fecho de um `<div>`. Por
fim, o `HANDOFF.md` precisa ser **regenerado depois** desta entrada — ele espelha a **última** deste
registro, e passa a ser esta.

## 01/10/2026 — A grafia de "Elicitação" se propaga, e a pendência do prompt congelado ganha dono

**O que motivou.** Duas coisas se tocaram e foram fechadas na mesma rodada. A primeira é a **grafia**
do termo que nomeia a entrevista que abre todo ciclo: o repositório estava **partido** — cinco
lugares no `HEAD` já escreviam **"Elicitação"**, com o `t` (*"Protocolo de Elicitação"* em
`PROTOCOLO.md:16`, os três de `ARQUITETURA-PE.md:135`/`:162`/`:176`, e o glossário de
`professores/tiago/campo/README.md:43`). E **as cinco são o desdobramento da sigla `PE:`** — a
tabela *"Vocabulário desta camada"* (`:15–17`) define `PE:` e, na linha seguinte, `Protocolo de
Elicitação` —, e o repositório inteiro usa a sigla. Ou seja, o texto minúsculo contradizia a própria
sigla que ele escrevia ao lado, e são 73 ocorrências em 17 arquivos versionados, fora `REGISTRO.md` e
`HANDOFF.md`. Duas grafias para o mesmo termo é a deriva que a pesquisadora proibiu; e este é o único
caso em que a forma **certa** já estava declarada, de modo que o trabalho é **propagação**, não
invenção de termo (P-04). A segunda é a **pendência herdada**: desde 28/09/2026 este registro
declara, em três entradas, que o `prompts/eliciar-ciclo.md` *"segue alterado no worktree e fora de
todo commit… precisa de motivo próprio ou de reversão"* (`:6731`, `:6847`, `:7050`). Nenhuma
entrada a reivindicou. Ela fica com dono aqui.

**O que foi decidido.** Propagar a grafia com `t` (**"Elicitação"**/**"Elicitar"** onde é prosa) e
resolver a pendência pela via do **motivo declarado** — não pela reversão.

1. **A grafia se separa por natureza, e é isso que a mantém segura.** Em **prosa**, o termo passa a
   ser **"Elicitação"** e o verbo **"elicitar"**. Em **identificador de código**, **nome de
   diretório** e **nome de arquivo**, a grafia fica **minúscula e sem acento** — porque ali não é a
   palavra que se lê, é um **endereço** que precisa casar byte a byte: `tools/hash-ciclo.sh`,
   `PROFESSOR_SLUG` e os `.fipp` resolvem caminho, não texto. A varredura fecha assim: a única
   ocorrência de `elicia*` minúsculo que **sobrevive** em arquivo versionado fora de
   `REGISTRO.md`/`HANDOFF.md` é o **nome real** do arquivo simulado,
   `00-eliciacao-simulada.md` (`experimentos/README.md:125`) — que **não se renomeia**: renomeá-lo
   quebraria a referência. O erro que a rodada corrigiu foi o **contrário**: a varredura cega
   havia geminado a consoante e escrito `00-elicitacao-simulada.md`, um arquivo **que não existe**.
   Medição final: `git grep -E 'elicia[çc]|eliciar' -- ':!REGISTRO.md' ':!HANDOFF.md' .` devolve
   **uma** linha — essa —, o que mostra que a regra parou onde devia e não alcançou o que **não**
   devia ser tocado. Em particular, o `PROFESSOR_SLUG` e os diretórios ficaram **intactos**: a
   rodada não renomeou pasta, não mexeu em `experimentos/` (a não ser no texto que o descreve) e
   não tocou em nenhum caminho resolvido por `tools/lib-fontes.sh`.
2. **A regra vale para o que um gerador lê.** Os **títulos** de pétrea entram no `HANDOFF.md` pela
   `grep` de `tools/gerar-handoff.sh:168`, que casa `^\*\*P-[0-9]\{2\} —`. A linha da **P-16** mudou
   de redação no `PROTOCOLO.md:111`, e por isso a regeneração **publica** a forma nova — sem que
   ninguém edite o `HANDOFF.md` à mão, que é o que a skill proíbe.
3. **A pendência do prompt congelado é reivindicada, não revertida.** O
   `prompts/eliciar-ciclo.md` → `prompts/elicitar-ciclo.md` é um **rename** com correção de **duas
   linhas** (`:1` e `:32`), que também diziam `elicia`. Não é reversão: é o mesmo arquivo, com o
   termo certo e o endereço certo. As três declarações de `:6731`/`:6847`/`:7050` ficam **fechadas
   por esta entrada** — é ela o **dono** que faltava.
4. **O que o `HANDOFF.md` continua dizendo, e por quê — isto foi medido, não suposto.** O gerador
   **não** copia só o bloco da última entrada: ele copia **todos** os 76 blocos *"O que ainda não
   está feito."* do registro (`tools/gerar-handoff.sh:185`), e por isso as **quatro** menções
   espelhadas a `prompts/eliciar-ciclo.md` que trazem a frase *"segue alterado no worktree"* —
   `grep -c` → **4** no `HANDOFF.md` — **não desaparecem** com esta regeneração. Elas continuam lá
   porque são **citação** das entradas de 28/09 e 29/09/2026, e citar o passado é o que o
   `HANDOFF.md` faz. Quem **lê** o handoff precisa saber disso: as quatro linhas são **história
   declarada**, não pendência viva — a pendência viva é esta entrada, e ela a fecha. Se o
   `HANDOFF.md` fosse editado à mão para removê-las, a próxima regeneração as traria de volta, e é
   exatamente por isso que **não se edita o `HANDOFF.md` à mão**. (Nota de método: por isso esta
   entrada **não** cita número de linha do `HANDOFF.md` — o bloco da última entrada é copiado para
   dentro dele, e todo número de linha de lá se desloca quando este texto muda.)

**Onde entrou.** `PROTOCOLO.md` — quatro linhas de prosa: `:10` (*elicitar necessidades* — verbo em
minúscula, **de propósito**: ali é o ato de perguntar, não o nome do artefato `PE`), o título
da **P-16** (`:111`) e o corpo (`:112`), a **P-19** (`:130`) · `prompts/instalar-ciclo.md` — `:11` e
`:157` · `prompts/eliciar-ciclo.md` **removido** e `prompts/elicitar-ciclo.md` **criado** (as duas
linhas de `elicia`; o resto é 1:1 com o arquivo anterior) · `CONGELAMENTO.md` — o rótulo da pasta
congelada (`:22`) · `ARQUITETURA-ANAMNESE.md` (9 linhas), `ARQUITETURA-AULA.md` (7) e
`ARQUITETURA-PE.md` (8) — prosa · `.github/prompts/instalar-ciclo.prompt.md` (4),
`.github/skills/identidade-do-projeto/SKILL.md` (1) e as duas `references/*.md` (1 cada) — prosa ·
`experimentos/README.md` — cinco linhas de prosa **e** a reparação do nome de arquivo de `:125` ·
`professores/tiago/campo/README.md` (2) e `.../2026-09-18-ritmos/respostas.md` (3) — prosa ·
`professores/tiago/ciclos/ciclo-01-ritmos-po.md` (2) e `-referencias.md` (1) — prosa ·
`.../ciclo-01-ritmos/referencias.html` — a peça gerada acompanha a fonte · o `.fipp` da Ritmos —
reancorado · `HANDOFF.md` — regenerado depois desta entrada · `REGISTRO.md` — esta entrada.

**Motivo declarado — os congelados.** Dois arquivos do `CONGELAMENTO.md` foram tocados:
**`PROTOCOLO.md`** e **`prompts/`** (a raiz — que é congelada; `.github/prompts/` não é, e é outra
pasta). A alteração de cada um é **só redação**: a mesma frase, com o `t` que o próprio
`PROTOCOLO.md` já usava na sua tabela de vocabulário (`:16`). **O que não muda**, e foi conferido
nesta rodada: a **fórmula de hash** da
âncora (`SHA256(id + ':' + type + ':' + parentHash + ':' + conteudo)`, intacta no cabeçalho do
`.fipp`), a **cobertura** do `.fipp`, os **validadores**, as **regras** e as **pétreas** — as
**22** continuam **22**, com o mesmo número na P-16, e os títulos só ganharam a letra. O
`prompts/elicitar-ciclo.md` **não é consumido por nenhum gerador** — é texto de entrevista, lido por
humano e por sessão de IA (o mesmo motivo já declarado na entrada de 29/09/2026); o nome antigo
sobrevive só em `REGISTRO.md` (elo histórico, que **não se apaga**) e no `HANDOFF.md` gerado — onde
**continua**, porque é citação (ponto 4). Nenhuma dependência nova, nenhum contrato de arquivo
alterado, nenhum comportamento novo. Os **dois** arquivos congelados entram no commit **da própria
propagação de grafia**, e **não** no commit do **conteúdo** — que é o que o `CONGELAMENTO.md` separa
(«não vai junto com conteúdo»). A regra é satisfeita: nenhum `.md` de aula, caderno, relatório ou
acompanhamento entra junto com o que é congelado.

**Com o quê.** `PROTOCOLO.md`, `prompts/instalar-ciclo.md`, `prompts/eliciar-ciclo.md` (removido),
`prompts/elicitar-ciclo.md` (criado), `CONGELAMENTO.md`, `ARQUITETURA-ANAMNESE.md`,
`ARQUITETURA-AULA.md`, `ARQUITETURA-PE.md`, `.github/prompts/instalar-ciclo.prompt.md`,
`.github/skills/identidade-do-projeto/SKILL.md`, `.github/skills/identidade-do-projeto/references/
bloco-identidade.md`, `.github/skills/identidade-do-projeto/references/congelamento-e-registro.md`,
`experimentos/README.md`, `professores/tiago/campo/README.md`,
`professores/tiago/campo/2026-09-18-ritmos/respostas.md`,
`professores/tiago/ciclos/ciclo-01-ritmos-po.md`, `professores/tiago/ciclos/ciclo-01-ritmos-
referencias.md`, `professores/tiago/ciclos/ciclo-01-ritmos/referencias.html`,
`professores/tiago/ciclos/ciclo-01-ritmos.fipp`, `HANDOFF.md`, `REGISTRO.md`. Do lado dos congelados:
`prompts/eliciar-ciclo.md` é a **remoção** e `prompts/elicitar-ciclo.md` a
**adição** do mesmo rename; vão juntos para não deixar o caminho congelado sem o arquivo.

**Reancoragem.** `PROTOCOLO.md` **não** é fonte de ciclo, e nenhum `.md`/`.conf` de ciclo foi
alterado pela grafia — **exceto** dois, que são: `ciclo-01-ritmos-po.md` e
`ciclo-01-ritmos-referencias.md` são **cobertos** pelo `.fipp`. A âncora da Ritmos foi regerada com
`tools/hash-ciclo.sh tiago 01 ritmos`: `hash_conteudo` passa a `166f15b9…` e o `hash` a
`18649803…6f92c`, com `ancorado_em: 2026-10-01`. O `--check` responde **verde** — *"ciclo 01-ritmos
íntegro; cadeia intacta"*. As outras duas cadeias **não se movem** e foram conferidas verdes:
`01-duo` (`8bba2c5e…`) e `01-diaghilev`. O `ciclo-01-ritmos-aula-01.fipp` **não** difere do `HEAD`:
fonte coberta dele não mudou.

**Referências.** Os cinco pontos que já escreviam `Elicitação` no `HEAD`: `PROTOCOLO.md:16`,
`ARQUITETURA-PE.md:135`/`:162`/`:176`, `professores/tiago/campo/README.md:43` — a forma declarada
que esta entrada **propaga** · as três declarações de pendência que esta entrada **fecha**:
`REGISTRO.md:6731` (entrada `:6618`), `:6847` (entrada `:6738`) e `:7050` (entrada `:6854`), todas
de 28/09/2026, herdadas em `:7517`/`:7628` e tocadas pela última vez em `:7967`/`:7979` (entrada de
29/09/2026, commit `ebc62bb`) · `tools/gerar-handoff.sh:168` (a `grep` das pétreas) e `:185` (o
bloco *"O que ainda não está feito."*) · `tools/hash-ciclo.sh` — os três `--check` verdes ·
`.github/instructions/registro-md.instructions.md` e `.github/skills/identidade-do-projeto/SKILL.md`
— a decisão congelado/gerado/livre · `CONGELAMENTO.md:22` · dois precedentes do **rito** (não do
termo): a entrada de 30/09/2026, *"Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`…"* —
que trata de **outra** grafia (`fochini` → `fokini`) e é citada só pelo **modo**: congelado ⇒ motivo
declarado, entrada aqui e commit próprio — e a de 29/09/2026, *"Os dois congelados entram: o índice
ganha o slug e a entrevista declara dois artefatos"*, que é a que **criou** a pendência da entrevista
fechada por esta entrada (commit `ebc62bb`).

**O que ainda não está feito.** A **publicação** do pacote da Ritmos segue **bloqueada por crédito
da conta**, não por código — herdado e sem mudança nesta peça. A âncora da Ritmos foi regerada, mas
o **pacote não foi regerado** para acompanhar: o `referencias.html` publicado traz a prosa nova, e
as demais saídas (PDF, `dados.json`, `ciclos.json`) **não** foram refeitas nesta peça — a regeração
é a próxima do fluxo, se o pacote for publicado. Os **18** `eliciação` minúsculos de `REGISTRO.md`
ficam **como estão**, de propósito: a proveniência **acrescenta, não edita** (P-03/P-04), e reescrevê-los
apagaria o elo do que se pensou antes. Pelo mesmo motivo, a documentação que o **`HANDOFF.md`**
espelha continua dizendo `eliciar-ciclo.md` — é **citação** do registro, não texto do handoff. Como
medido acima, são **quatro** as linhas espelhadas, e elas **permanecem** na regeneração: só sairiam
reescrevendo-se as entradas de 28/09 e 29/09/2026 que as contêm, o que a proveniência proíbe.
Permanecem **abertas** e sem relação com esta peça: a decisão de **onde vivem as Functions**
(§7.6), a consolidação dos
lançamentos do Blob de volta ao repositório (§7.3), e a pergunta pela **revisão dos demais botões**
do formulário (`REGISTRO.md:7536`). Não foi feito **push**. Por fim, o `HANDOFF.md` precisa ser
**regenerado depois** desta entrada — ele espelha a **última** deste registro, e passa a ser esta.

## 01/10/2026 — A view gerada e a regra de leitura cresciam com o arquivo: a colheita passa a ter limite e o `REGISTRO.md` deixa de ser lido inteiro

**O que motivou.**
Uma varredura de custo de contexto mediu, pela primeira vez, o que uma sessão nova paga para se
situar. O gerador prescreve a leitura de quatro arquivos nesta ordem — o `HANDOFF.md`, o
`PROTOCOLO.md`, o `REGISTRO.md` inteiro e o PO do ciclo ativo. Medido, isso dá **754 723 B**, dos
quais **726 830 B (96 %) são dois arquivos**: o `REGISTRO.md` (599 433 B, 79 %) e o `HANDOFF.md`
(127 397 B, 17 %). Todo o resto da pilha documental é ruído estatístico.

Duas medições localizaram o mecanismo. A primeira é a anatomia do `HANDOFF.md`: **105 618 B
(82,9 %)** do arquivo são a *colheita de pendências* — derivada do `REGISTRO.md`. A segunda é o
experimento de isolamento, que rodou o gerador sobre uma cópia com o insumo **dobrado**: **104 845 B
(82,3 %)** do `HANDOFF.md` **escalam** com o `REGISTRO.md` e **22 552 B (17,7 %)** não escalam
(identidade, estado, tabelas por professor). ⇒ O `HANDOFF.md` nunca desce abaixo de ~22,6 KB, e o
custo cresce **duas vezes por entrada nova**: o `REGISTRO.md` cresce (e a sessão o lê inteiro) **e**,
se a entrada trouxer bloco de pendência, o `HANDOFF.md` engorda **para sempre** — porque o awk do
gerador **nunca corta**.

O custo do crescimento foi localizado em **duas linhas de awk** do `tools/gerar-handoff.sh`
(`:177` e `:185`), e a auditoria dessas linhas revelou **cinco defeitos**:

1. **`## ` engolido.** O awk para em `/^\*\*/`, não em `/^## /`, e solta o que engoliu apenas ao
   encontrar o primeiro `**` da entrada seguinte. Medido: **52 headings** engolidos em **52
   transbordos · 125 linhas**, **6 262 B** — e o transbordo não é uniforme: **48** têm 2 linhas,
   **1** tem 5 e **3** têm 8 (o resto é o preâmbulo da entrada seguinte, quando ela traz prosa
   antes do primeiro rótulo).
2. **Marcador exato.** A regex `\.\*\*$` não casa `**O que ainda não está feito (declarado).**`.
   **Seis pendências reais e abertas** (`L1542, L1591, L1639, L1726, L1782, L2010` — **2 716 B / 36
   linhas**) **nunca entraram no `HANDOFF.md`**.
3. **Nunca corta.** Todo bloco já escrito fica para sempre.
4. **Prefixo de marcador na mesma linha descartado.** O `{flag=1; next}` joga fora o resto da linha
   do marcador, e **cinco blocos** (`L8002, L8074, L8163, L8248, L8389`) perdem a **primeira
   frase**. Fecha exato: `grep -c '^\*\*O que ainda não está feito\.\*\*$'` = **71**; sem `$` =
   **76**; `71 + 5 = 76`.
5. **Primeiro bloco órfão.** O marcador da primeira entrada está em `L32` e a linha de data em
   `L31`, que nunca entra em região alguma — a colheita abria com prosa sem data e sem título.

**O que foi decidido.**
Substituir a colheita irrestrita por uma **colheita limitada** e a leitura integral do `REGISTRO.md`
por uma **regra de leitura limitada**:

- **Colheita limitada.** O awk do `:185` passa a emitir os blocos de pendência das **últimas 5
  entradas**, com **título próprio** para cada um, mais um **índice das anteriores** — para que
  pendência antiga e ainda aberta **não desapareça** do primeiro arquivo lido. A escolha de **N=5**
  é medida, não suposta: o corte foi otimizado sobre `colheita + índice` (o índice **cresce** quando
  a colheita encolhe), e **N=5 minimiza a soma em 12 592 B**. Um corte por *número de blocos* ou por
  *teto em bytes* foi **refutado pela medição**: o maior bloco tem **13 721 B e está a 12 do fim**,
  quase igualando os últimos 10 somados (14 077 B) — qualquer regra por N ou por byte oscila, e
  **N=12 chega a dobrar** o valor de N=10. Uma regra por idade/data também não é estável: só o dia
  26/09/2026 responde por 38 181 B (35 % do arquivo).
- **Os cinco defeitos são corrigidos na mesma passagem** — o `## ` volta a delimitar, as **duas**
  formas de marcador são casadas, o corte existe, o resto da linha do marcador é preservado e o
  primeiro bloco recebe data e título.
- **Regra de leitura limitada.** O `:231` deixa de dizer `3. \`REGISTRO.md\`;` e passa a dizer que se
  leem **as últimas 5 entradas** — não o arquivo inteiro —, com ponteiro explícito para o índice
  antes de abrir o `REGISTRO.md` por causa de pendência antiga. Medido: as últimas 5 entradas são
  **38 751 B (6,4 %)** do arquivo.

**Nada foi apagado.** O `REGISTRO.md` permanece **inteiro**, com as 8 403 linhas e as 94 entradas. O
que encolheu foi a **view gerada** (`HANDOFF.md`) e a **regra de leitura** — as duas eram as que
pagavam o mesmo crescimento duas vezes. P-03/P-04 valem para esta varredura também: o que fosse
superado viraria nota datada, não remoção. **O `HANDOFF.md` é saída gerada — não foi editado à mão;
foi o gerador que mudou, e o artefato foi regenerado no mesmo commit.**

**Onde entrou.**
`tools/gerar-handoff.sh` — três pontos:

- `:185` — o awk da colheita de pendências (a região que produzia 104 807 B);
- `:231` — a linha da ordem prescrita de leitura (`REGISTRO.md` inteiro → últimas 5 entradas);
- `:234` — quatro linhas de ponteiro acrescentadas depois da frase que fecha a ordem de leitura,
  dizendo que acima estão a última entrada por inteiro, as pendências recentes e o índice das
  anteriores, e que se consulta o índice **antes** de abrir o `REGISTRO.md` para pendência antiga.

**Motivo declarado — os congelados.**
`tools/` é congelado (`CONGELAMENTO.md`), e foi tocado — de propósito, pelo rito, e não por atalho.
O motivo é que a view gerada e a regra prescrita de leitura **cresciam com o `REGISTRO.md`**, e as
duas pagavam o **mesmo** crescimento duas vezes: o `HANDOFF.md` já carrega 118 048 B extraídos do
`REGISTRO.md` e, no passo seguinte da **mesma** lista, a sessão é mandada ler o `REGISTRO.md`
**inteiro** — **5,1× maior** que a cópia (599 433 / 118 048). O gerador não é a vítima do
crescimento; é o seu **multiplicador**: uma alteração custa o rito **uma vez**, e o ganho é pago a
**cada** sessão. Congelar o gerador sem medir o que ele emite era congelar sem conhecer o custo — e
o custo agora está medido.

Dois outros objetos congelados foram **deliberadamente não tocados**, e a medição sustenta a recusa:
a duplicação das **22 pétreas** e das **17 regras** dentro do `HANDOFF.md` é de **1 910 B (0,25 %)**
— não há prêmio que justifique arriscar o piso de rigor; e a **identidade do projeto** (`L1–32`,
1 917 B) não foi substituída por ponteiro, porque é ela que impede a deriva de leitura, e trocá-la
por 1,9 KB seria economizar token perdendo rigor. O `prompts/elicitar-ciclo.md` (congelado) também
não foi tocado nesta rodada: o ganho dele é real (~3,3 KB por turno de eliciação) mas é **por turno**,
não por sessão, e o arquivo está **em produção** — fica para decisão própria, depois.

**Com o quê.**
`tools/gerar-handoff.sh` (239 → 318 linhas), `HANDOFF.md` (regenerado: **127 397 → 35 674 B**, 1 682
→ 469 linhas), `REGISTRO.md`.

**Reancoragem.**
Nenhuma. `tools/hash-ciclo.sh` cobre **somente** `professores/<professor>/ciclos/ciclo-XX.conf`,
`ciclo-XX-<escola>.conf` e os `ciclo-XX-*.md`. Toda esta varredura vive **fora** desse conjunto:
nenhum `.md` nem `.conf` de ciclo foi alterado, e nenhum `.fipp` foi tocado.

**Referências.**
Os números de custo vêm da medição direta sobre o `HEAD` anterior a esta entrada: `wc -c` e `wc -l`
sobre cada arquivo da ordem prescrita, a simulação byte-a-byte do awk do `:185` (104 904 B em 1 360
linhas) e o experimento de isolamento com o insumo dobrado (`127 397 / 232 242 / 104 845 / 22 552`).
O corte acumulado do fim para o começo está tabelado (últimos 5 = 4 561 B; últimos 12 = 29 272 B; os
76 = 104 904 B). O inventário de redundância e o de duplicação estão no plano da varredura, no
espaço de sessão — não são artefato do repositório.

**O que ainda não está feito.**
- **A Frente 3** — declarar onde acaba o *desenho* e começa o *estado* nos `ARQUITETURA-*.md`. Medido:
  `ARQUITETURA-AULA.md` tem **31 %** de cauda de estado, `ARQUITETURA-ANAMNESE.md` **21 %** e
  `ARQUITETURA-PE.md` **19 %**. É a única frente **livre** com ganho real — mas o ganho é de **quem
  implementa**, não da sessão nova: nenhum `ARQUITETURA-*` está na ordem prescrita de leitura.
- **A Frente 4** — índice no `prompts/elicitar-ciclo.md` (congelado), adiada acima.
- **A auditoria de quais dos 76 blocos estão de fato abertos hoje.** A varredura sabe quais existem e
  onde estão; **não** sabe quantos estão abertos. O índice mitiga, mas não substitui essa auditoria.
- **A verificação de qualidade.** A varredura prova que o custo **caiu** (754 723 → **101 788 B**,
  −86,5 %); não prova que a resposta **não piora**. Isso só se verifica rodando uma sessão nova.
- **Bytes não são tokens.** Toda a medição é em bytes. A proporção (~96 % em dois arquivos) é o
  achado robusto; a conversão para token **não foi medida**.

## 02/10/2026 — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev fica sozinho

**O que motivou.**
O `professores/tiago/` guardava dois ciclos que **nunca tiveram aula dada** — a Duo (Fundamentos do
Balé Clássico, 12 aulas) e a Ritmos e Movimento (pas de deux, 21 encontros). Eram **protótipos do
modelo**: nasceram para exercitar o pipeline de geração, o PO, a captura e a âncora, e cumpriram
esse papel. O que existe hoje com **entrega real** é o Diaghilev, do professor Fokini. Cada ciclo
morto custa manutenção a cada evolução do modelo — schema, gerador, validador, glossário —, e a
manutenção de protótipo não é manutenção de conteúdo: **ela consome o rito sem produzir elo**.

**O que foi decidido.**
- **Saem 125 arquivos versionados** — 115 em `ciclos/`, 4 em `campo/`, 3 em `relatorios/` e 3 em
  `cadernos/` (43 HTML, 38 MD, 23 JSON, 6 JS, 4 SVG, 4 `.fipp`, 3 `.conf`, 2 PDF, 2 CSS). Nada sai
  como informação: o histórico preserva a árvore inteira em `be806f4`, e o que este movimento remove
  é o **caminho ativo**, não o passado (P-04).
- **O ciclo da Débora não entra na lista porque já não existia.** As cópias que traziam o nome dela
  — manifesto, PO, âncora e pacote — saíram em `b60830b` (18/09/2026), como a entrada de `:149`
  registrou: *"o ciclo dela ainda não existe"*. Nenhuma variante viva com o nome dela resta no HEAD.
- **9 `acompanhamento-*.md` saíram do disco.** São **vista derivada** —
  `tools/gerar-acompanhamento.sh`, chamado por `tools/gerar-ciclo.sh:586` —, regeneráveis das
  fontes, e deliberadamente **fora do Git** (`.gitignore:33`, camada 4 da política de dados
  sensíveis do `CONGELAMENTO.md`). Não aparecem no diff porque nunca estiveram no histórico.
- **Os documentos livres foram ajustados em dois registros distintos**, e a distinção é deliberada.
  Onde a citação é **medição** — as contagens de 12 e 21 aulas que dimensionaram o problema —, entra
  **nota de escopo datada** e a narrativa permanece (`IDEIA-CAPTURA.md`, `ARQUITETURA-ANAMNESE.md`,
  `ARQUITETURA-PE.md`). Onde a citação é **forma** — o corpus vivo do pipeline —, o texto é
  **atualizado** para o Diaghilev (`README-ciclos.md`, `README.md`, `professores/README.md`,
  `departamentos/README.md`).
- **Os quatro schemas do ciclo ativo** ganharam a mesma `_nota_escopo_02-10-2026`, que carimba o
  corte e diz por que as `description` antigas ficam: são o caso **medido** que justifica a
  tolerância declarada, não exemplo de forma.
- **`CONGELAMENTO.md`** — arquivo livre — recebeu só o alinhamento da seção *"Por que congelar"* ao
  estado real: 1 ciclo publicado (Diaghilev), 1 PO validado, âncora e caminho de deploy prontos.

**Onde entrou.**
- `08c0be9` — `chore(estrutura)`: os 125 `D`, os 11 documentos livres e os 4 schemas.
- `3736757` — `docs(tools)`: os 11 arquivos de `tools/`, em **commit próprio**, como o congelamento
  exige.

**Motivo declarado — os congelados.**
`tools/` é congelado (`CONGELAMENTO.md`), e o commit `3736757` o toca em 11 arquivos. O motivo: os
comentários, os cabeçalhos de uso e as mensagens de erro citavam os ciclos-protótipo como **exemplo**
e como **ponteiro padrão** — quem lia o cabeçalho do script para descobrir como chamá-lo era mandado
para uma árvore ausente desde `08c0be9`.

O que mudou, por arquivo: `calendario.py:8,14` (os exemplos do Pré-requisito 5),
`check-glossario.js:9-16,46-47` (o `PADRAO` reapontado de `professores/tiago/...` para
`professores/fokini/...`, com comentário novo que declara o reapontamento e a data),
`check-pacote.js:42`, `deploy-netlify.sh:6,8-14,35,73-74` (inclusive o template de
`.netlify-tokens`, que perde os pares `DUO`, `RITMOS` e `DEBORA`), `gerar-ciclo.sh:13-16`,
`gerar-vista.js:8,38`, `hash-ciclo.sh:13-15,25,30`, `lib-fontes.sh:9-10,61,89-90`,
`validar-dados-ciclo.js:432` e `validar-schema-ciclo.js:10`.

**Três defaults não mudaram**: `PROFESSOR_SLUG="tiago"` em `gerar-acompanhamento.sh:50`,
`gerar-ciclo.sh:61`, e `PROFESSOR="${PROFESSOR:-tiago}"` em `hash-ciclo.sh:65` continuam `tiago`,
agora com comentário inline dizendo que é **default histórico, pendente desde 02/10/2026**, e que
quem chama deve passar o professor. Trocar o default seria mudar **comportamento** — outra decisão,
que não entra aqui.

**O que NÃO muda:** a fórmula de hash da âncora, a cobertura da âncora, os validadores, as regras
pedagógicas e as pétreas. Nenhuma linha de **código executável** foi alterada — as mudanças são
comentários, cabeçalhos de uso, mensagens de erro e o template do arquivo de tokens. A única
alteração com efeito verificável é o `PADRAO` de `check-glossario.js`, e ele **não é alcançado por
nenhum chamador automático**: `check-pacote.js` e `hooks/pre-commit` sempre passam os caminhos
explícitos, então o `PADRAO` só governa o uso manual sem argumentos.

**Com o quê.**
- `git diff --cached --numstat` → **140 arquivos, 93 inserções, 28 966 deleções**; os 125 de
  `professores/tiago/` são **todos `D`** (`git diff --cached --name-status | grep -v '^D'` vazio).
- **Nada foi perdido:** `git ls-tree -r 08c0be9^ professores/tiago | wc -l` → **125** — a mesma
  árvore, recuperável no commit anterior.
- Validações: `bash -n` (5 scripts), `node --check` (5) e `python3 -m py_compile` (1) — todos ok;
  `tools/hash-ciclo.sh fokini 01 diaghilev --check` → **ok**, hash
  `7e32e5a49c0a5b5c0ab7a1467ba807db4f713eb957c83f2dcaa4a026b68b5738`.
- **A âncora não precisou de reancoragem:** os schemas não entram na cobertura (só `ciclo-XX.conf`,
  `ciclo-XX-<escola>.conf` e os `ciclo-XX-*.md`), e as **fontes do Diaghilev não foram tocadas** — o
  `--check` confirma.
- **O churn de regeneração foi medido e revertido.** O `pre-commit` §3 regenerou o pacote do
  Diaghilev (os 4 schemas do fokini estavam no stage), e 3 arquivos versionados sujaram com carimbo
  puro: `ciclos.json` **só** o `gerado_em`, `dados.json` **só** o nonce do cifrado, e o PDF **só** o
  `/ID` do `XRef` — nenhuma fonte pedagógica mudou. Os três foram **restaurados** com `git restore`:
  o pacote do HEAD já corresponde às fontes, e carimbo de relógio não é elo (P-04). Registrar que a
  alternativa — um commit só de carimbo — não tem precedente no histórico: os dois únicos commits que
  tocaram esses arquivos (`bf98e68`, `31d97fe`) traziam mudança real de fonte.

**Referências.**
`CONGELAMENTO.md` (a política de dados sensíveis em 4 camadas; o rito do motivo declarado);
`REGISTRO.md:149` (a saída das cópias da Débora); `b60830b` (o commit dessa saída — modelo desta
classe); `52b44f3` (o precedente do `docs(tools)`); `31d97fe` (o precedente que declara a mudança de
caminho sem tocar o `REGISTRO.md`, P-04); `tools/hooks/pre-commit` §3 (a origem do churn).

**O que ainda não está feito.**
- **⚠️ Um achado que a remoção expôs, e que a política de dados sensíveis precisa enfrentar.** O
  dado de saúde individual de uma aluna **estava em claro em 7 arquivos versionados** da árvore que
  saiu: `ciclo-01-ritmos-po.md:107`, `ciclo-01-ritmos-dados.json:40`,
  `ciclo-01-ritmos/caderno-01.html:235`, `ciclo-01-ritmos/guia-de-observacao-01.html:188`,
  `ciclo-01-ritmos/po-01.json:58`, `relatorios/ciclo-01/aula-01-ritmos.md:145` e
  `cadernos/ciclo-01/caderno-01-ritmos.md:100` (*"lesão no tornozelo esquerdo"*). **A leitura que
  dizia que o dado nunca esteve no Git estava errada**, e a correção fica aqui, como elo. O commit
  `08c0be9` tira os 7 do caminho ativo, mas **o histórico do Git os preserva**: a camada 4 cobre os
  acompanhamentos `.md`, e **não** cobre o dado que vazou para as fontes. O que fazer com isso — o
  histórico é imutável por P-04, e a decisão é da pesquisadora — **não foi decidido aqui**.
- **O ciclo vivo não repete o caso:** a §"Restrições físicas declaradas (P-22)" do PO do Diaghilev
  diz *"Nenhuma restrição declarada até o início do ciclo"*, e nenhuma fonte de `professores/fokini/`
  traz dado de saúde individual.
- **A segunda frente não foi implementada** — a flag de escola habilitada/desabilitada. Ela vive no
  `.conf` da variante, com **motivo e data**; entra em `properties` do `ciclo-01-schema.json`, nunca
  em `required`; e exige **reancoragem**, porque toca o `.conf` (o `hash-ciclo.sh:129` valida os
  `.conf` contra o schema antes de ancorar).
- **O push fecha a rodada:** estes commits vão para o `origin/main` como a última ação. O
  `experimentos/README.md` mudou no worktree e **fica fora** deles, de propósito.

---

## 02/10/2026 — A escola passa a poder ser desabilitada, com motivo e data

**O que motivou.** A segunda frente declarada no fim da entrada anterior — *"a flag de escola
habilitada/desabilitada"* — e o que o `IDEIA-PAINEL-ESCOLA.md` já supõe: o painel da escola precisa
mostrar *«desabilitada»* e, ao lado, **por que** e **desde quando**. Não é um booleano: quando a
direção lê *«desabilitada»*, ela precisa saber **a causa** (inadimplência, *churn*, queda do
sistema) e **a data**, ou a tela não responde a pergunta que a fez olhar.

No caminho, um defeito do validador apareceu — e teve de ser consertado **antes** da flag, porque a
flag depende dele. O `validar-schema-ciclo.js` conferia o `pattern` **só** nos campos `required`: um
campo **opcional** com padrão declarado — exatamente o que uma flag precisa ser — passava com
qualquer valor. A causa: o laço iterava `obrigatorios` em vez das propriedades declaradas.

E, para exigir motivo e data **por máquina**, o validador precisava de uma capacidade que não tinha:
o `if`/`then` do JSON Schema. O schema de ciclo é achatado por desenho; nada nele usava condicional.

**O que foi decidido.**

- **`ESCOLA_HABILITADA="sim|nao"`, no `.conf` da variante** — a flag é **por escola**, não por
  professor: desabilitar `ciclo-01-diaghilev` não toca nas outras escolas do mesmo professor. O
  arquivo da escola já é o manifesto dela; a flag não mora em arquivo separado.
- **A desabilitação exige motivo e data.** `ESCOLA_HABILITADA="nao"` dispara, por `allOf`+`if/then`
  do schema, a obrigatoriedade de `ESCOLA_HABILITADA_MOTIVO` e `ESCOLA_HABILITADA_DESDE`
  (dd/mm/aaaa). Não é booleano solto, e o validador é quem recusa.
- **O campo é opcional de propósito.** A **ausência** vale como habilitada: nenhum ciclo já ancorado
  precisou ser tocado, e o rito não reescreve o passado para acomodar capacidade nova (P-04).
  Declarar `"sim"` é escolha de quem quer o estado **conferido** no arquivo em vez de herdado da
  ausência — foi o que o Diaghilev fez.
- **A ordem foi: consertar o validador, dar-lhe o `if/then`, e só então declarar a flag** — três
  commits, com a flag no último. Declarar a flag sobre um validador que não confere padrão em campo
  opcional seria declarar uma garantia que não existia.
- **O `if/then` é lido onde o draft-07 o declara:** no nível do **objeto**, numa entrada de `allOf`
  ou na raiz do schema — **não** dentro de `properties.X`, onde o `if` operaria sobre a string. Não
  é dialeto próprio: `experimentos/pe/ramificacao/ramificacao-schema.json` (§222) já usa essa forma.
- **Discriminante ausente não dispara ramo.** É o que sustenta a opcionalidade: quem não declara a
  flag não entra no contrato condicional.
- **O bloqueio da geração NÃO entrou** (decisão da pesquisadora, via pergunta direta): a flag é
  **declarada e validada**, não **imposta**. Hoje um ciclo com `ESCOLA_HABILITADA="nao"` ainda é
  gerado por `tools/gerar-ciclo.sh`. Impor é capacidade própria, e virá depois.

**Onde entrou.**

- `tools/validar-schema-ciclo.js` — laço de forma passou a iterar as **propriedades declaradas**, e
  não os `required` (commit `1a65840`); `if/then/else` de `allOf` e da raiz (commit `99ae163`).
- `professores/fokini/ciclos/ciclo-01-schema.json` — as três propriedades novas e o `allOf` que
  torna motivo e data obrigatórios quando `ESCOLA_HABILITADA="nao"`.
- `professores/fokini/ciclos/ciclo-01-diaghilev.conf` — `ESCOLA_HABILITADA="sim"` declarado.
- `README-ciclos.md` — a seção «Habilitar e desabilitar uma escola», com a recusa real transcrita.
- `professores/README.md` — o estado da escola na tabela, e a distinção escola × professor.

**Motivo declarado — os congelados.** `tools/validar-schema-ciclo.js` é de `tools/`, congelado, e
foi tocado em **dois commits próprios**, cada um com motivo no corpo.

- **`1a65840` — o defeito.** O `pattern` passa a valer em qualquer campo declarado com ele,
  obrigatório ou opcional: `required` governa presença, `pattern` governa forma.
- **`99ae163` — a capacidade.** O validador aprende o `if/then/else` do draft-07.

**O que NÃO muda:** a fórmula de hash, a cobertura da âncora (`.fipp` continua cobrindo só
`ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e os `ciclo-XX-*.md`), os demais validadores, as regras e
as pétreas. Medido antes de mexer: o **único** campo opcional com `pattern` em todo o repositório é
`gerado_em`, de `experimentos/pe/envelope/elicitacao-schema.json`, e ele **não passa por este
validador** — por isso o conserto não altera a validação de nenhum artefato existente. Os 4 schemas
do ciclo ativo seguem achatados, e o único `if/then` preexistente é aninhado (dentro de itens de
array) e tem validador próprio (`experimentos/pe/motor/validar.js`).

**Com o quê.**

- `tools/validar-schema-ciclo.js` — **um arquivo, dois commits** (o defeito e a capacidade).
- `professores/fokini/ciclos/ciclo-01-schema.json` · `ciclo-01-diaghilev.conf` ·
  `ciclo-01-diaghilev.fipp` e os **5 `.fipp` por aula** (reancoragem) · `README-ciclos.md` ·
  `professores/README.md` · `REGISTRO.md` (esta entrada).

**Provas.**

- **16 casos isolados** contra 5 schemas de prova: habilitado sem motivo/data passa; desabilitado
  sem motivo/data **falha listando os dois** e a causa (`ramo "then": exige …`); desabilitado com
  motivo e data passa; flag ausente passa; valor fora de `^(sim|nao)$` falha; `then` e `else`
  disparam cada um sozinho; `else` satisfeito passa; campo do `if` ausente não dispara; `pattern`
  dentro do `then` é conferido; `if` vazio casa vacuamente.
- **5 casos contra o schema REAL do ciclo** (`$d/a..e`): sem a flag ok; `nao` sem motivo/data
  recusado; `nao` com motivo e data ok; data em ISO recusada pelo padrão dd/mm/aaaa; `"talvez"`
  recusado.
- **Não-regressão:** `node --check` ok; baseline dos **11 campos obrigatórios** intacto;
  `tools/hash-ciclo.sh fokini 01 diaghilev --check` → **ok, cadeia intacta**, hash reancorado
  `899d17e4343d33fc8d3ecbcf8838e7fe23ad6fe8bb14dc57f6efac5e5bd4d2af`;
  `node tools/check-pacote.js professores/fokini/ciclos/ciclo-01-diaghilev` → **0 erro(s),
  0 aviso(s)**, 21 páginas, 52 páginas de PDF.

**O churn de regeneração foi medido e revertido, de novo.** A reancoragem tocou o `.conf`, e o
`pre-commit` §3 regenerou o pacote: `ciclos.json` (**só** o `gerado_em`), `-dados.json` (**só** o
nonce do cifrado) e o PDF (**só** o `/ID` do `XRef`) sujaram com carimbo puro — nenhuma fonte
pedagógica mudou, e **nenhum dos 21 HTML divergiu**. Os três foram **restaurados** com `git restore`,
como no precedente desta mesma rodada. O pacote do HEAD corresponde às fontes, e carimbo de relógio
não é elo (P-04).

**Referências.**
`IDEIA-PAINEL-ESCOLA.md` (o painel que lê a flag); `CONGELAMENTO.md` (o rito do motivo declarado);
`experimentos/pe/ramificacao/ramificacao-schema.json:222` (a forma canônica de `allOf`+`if/then` já
usada no repositório); `tools/hash-ciclo.sh:128` (o chamador que herda a capacidade — reancorar já
valida a flag); `1a65840` e `99ae163` (os dois commits próprios sobre o congelado);
`REGISTRO.md` (a entrada anterior, que declarou esta frente como pendente).

**O que ainda não está feito.**
- **O bloqueio da geração não existe.** `tools/gerar-ciclo.sh` **não** consulta a flag: hoje ele
  gera um ciclo desabilitado do mesmo jeito. É capacidade própria, decidida para depois — não foi
  tocado nesta rodada, por decisão explícita.
- **A flag não tem consumidor.** O painel (`IDEIA-PAINEL-ESCOLA.md`) continua **não implementado**;
  a flag é o campo que ele vai ler, e hoje quem a lê é só o validador.
- **`ESCOLA_HABILITADA` não entrou em nenhum `enum` nem no `DOCS`.** Ela é campo de schema, não
  documento, e por isso não aparece no pacote gerado — verificar, quando o painel existir, se ele
  precisa lê-la do `.conf` ou de um JSON derivado.
- **`experimentos/README.md` mudou no worktree** (frente anterior) e **fica fora** destes commits,
  de propósito.
- **O push é da pesquisadora** — os commits ficam locais até ela empurrar.

---

## 07/10/2026 — O cofre dos lançamentos sai do Netlify e entra no Cloudflare KV

**O que motivou.** O pedido veio da pesquisadora, em cinco passos ordenados: medir o que existia de
Netlify, criar o `wrangler.jsonc`, ajustar o JavaScript para usar o KV, **apagar a configuração do
Netlify inteira** (Functions, Blobs, tokens) e relatar — pedindo a ela o que faltasse do Cloudflare.
O motivo declarado é **custo**: *«Cada `*/ciclos/ciclo-*/` tem a sua própria rota no Cloudflare —
para ser acessado sem saber os dados das outras escolas. **O objetivo é economizar com o servidor.**»*
Ela já tinha criado o namespace **`ciclos-escolas`** (`2ee331c7a5bc446ca86c8f2cb039ec16`) e ligado
um projeto **`diaghilev`** ao repositório pelo painel.

**Medido antes de mexer.**

- A **estrutura-alvo já existia**: `professores/fokini/ciclos/ciclo-01-diaghilev/` **é** o
  «app/motor central da escola». Não havia ciclo interno a separar em `dados/01.json`,
  `dados/02.json` — o modelo do pedido estava atendido, e **só a peça de rota/deploy era nova**.
- A superfície Netlify eram **três arquivos versionados** (`netlify.toml`,
  `netlify/functions/receber.js`, `tools/deploy-netlify.sh`) e **20 arquivos** com a palavra.
- **Não existe leitura do store em tempo de execução** — só a escrita. O ponto de leitura do
  pedido («onde se lê os dados JSON em tempo de execução») é, hoje, **hipotético**: quem lê o
  lançamento é a **geração do pacote seguinte**, no disco. Registrado, não inventado.
- **Zero rastros de Cloudflare** no histórico do Git, no disco e no scratch da sessão. O ambiente
  **não tinha `wrangler`** — precisou ser instalado.
- O `.github/workflows/reancorar.yml` é o **único** workflow e **não** menciona Netlify: nada a
  editar na cadeia de CI.
- **`REGISTRO.md:8212` provou que o token do Netlify era credencial viva** (foi usado para medir
  crédito da conta), não arquivo inerte. Ele foi apagado — ver «O que ainda não está feito».

**O que foi decidido.**

- **Um Worker por escola, e o mesmo Worker serve as duas coisas, na mesma origem.** O pacote
  publicado **é** a pasta do ciclo, então o asset estático e o `POST` do lançamento saem do mesmo
  host. O Cloudflare **serve o asset primeiro** e só entrega ao script o que não casa com arquivo —
  por isso `assets.run_worker_first` fica **desligado**, e o pacote continua barato. Como cliente e
  API são a mesma origem, o formulário chama `'/api/receber'`, **caminho relativo**: acaba o CORS e
  acaba a URL absoluta de Worker no HTML gerado.
- **O `wrangler.jsonc` fica na raiz, com `name: "diaghilev"`** — o mesmo nome do projeto que já
  existe no painel. A **rota pública não entra no arquivo**: mora no painel, para a mesma
  configuração servir `workers.dev` e domínio próprio.
- **O KV é um só para todas as escolas**, e por isso **cada chave começa com o prefixo da escola**:
  `escola/professor/ciclo-carimbo/nome-do-arquivo`. Era a divisão do `netlify.toml` (um arquivo,
  várias escolas, cada uma publicando a sua pasta) — ela **continua valendo**, só mudou o provedor.
- **O corpo continua tratado como opaco.** O texto que chega **é JSON em claro** (quem cifra é o
  cliente, com a senha da escola); o Worker **não cifra, não vê senha, não interpreta** — grava
  verbatim. O princípio segue: **o store é o cofre, o pacote é a vitrine.**
- **A rota antiga não fica como alias.** `/.netlify/functions/receber` **não** é mantido: nenhum
  pacote chegou a ser publicado no Netlify, então não há cliente antigo a atender, e um caminho com
  o nome do provedor que saiu é configuração do provedor que saiu. `ROTAS_API = ['/api/receber']`.

**As duas diferenças de comportamento, anotadas no código em vez de escondidas.** O KV **não tem
`onlyIfNew`** — a proteção contra carimbo repetido virou **get-then-put**, e a atomicidade que o
Blob dava **não existe mais**; e **não tem consistência forte** — o `{consistency:'strong'}` do
Blob não tem equivalente, e uma releitura pode vir defasada. As duas estão marcadas no
`workers/receber.js` como `ONDE MUDOU (1 de 2)` (o prefixo da escola) e `(2 de 2)`.

**Onde entrou.**

- `wrangler.jsonc` (novo, raiz) — `name`, `compatibility_date`, `observability`, `main`, `assets`,
  `kv_namespaces` com **`PADD_KV`**.
- `workers/receber.js` (novo) — a função portada do Netlify.
- `tools/templates/lancamento.html` — `const RECEBER = '/api/receber';` e o comentário do bloco.
- `experimentos/receptor-local/servidor.js` — `ROTA_RECEBER = '/api/receber'` (fora do Git).
- `package.json` · `package-lock.json` — sai `@netlify/blobs`, entra `wrangler` (devDependency).
- `README.md` (a seção de deploy virou «Deploy no Cloudflare — um Worker por escola») ·
  `AGENTS.md` · `README-ciclos.md` · `CONGELAMENTO.md` · `experimentos/README.md` ·
  `experimentos/captura-json/RELATORIO.md` · `.github/agents/ciclo-auditor.agent.md` ·
  `.github/agents/ciclo-entrega.agent.md` · `ARQUITETURA-CAPTURA.md` (a **Nota de 07/10/2026**) ·
  `.gitignore` (o cabeçalho, o `.wrangler/` e o bloco de credenciais).

**Apagado.**

- `netlify.toml` · `netlify/functions/receber.js` · `netlify/` ·
  `tools/deploy-netlify.sh` · `tools/.netlify-tokens`.
- `node_modules/@netlify/` · as **46** dependências de `@netlify/blobs`.

**Motivo declarado — os congelados.** `tools/templates/lancamento.html` (editado) e
`tools/deploy-netlify.sh` (apagado) são de `tools/`, congelado.

- **`tools/templates/lancamento.html` — uma linha de rota.** O endereço do POST passa de
  `/.netlify/functions/receber` para `/api/receber`. Não é reescrita de forma: é o **endereço do
  mesmo POST**, e o caminho novo é relativo de propósito — sobrevive a qualquer provedor, e é o
  que tira o CORS. O pacote foi **regenerado**, e o `lancamento.html` gerado tem a rota na
  **linha 790**.
- **`tools/deploy-netlify.sh` — apagado, não substituído.** O caminho manual virou
  **`npx wrangler deploy`**, documentado no `README.md`. Não foi criado um
  `tools/deploy-cloudflare.sh`: o script antigo existia para preencher o token por escola do
  arquivo de tokens, e essa peça **deixou de existir** — o Worker é ligado ao GitHub pelo painel e
  o deploy automático sai do próprio `wrangler.jsonc`. Criar um script novo seria inventar um
  rito que ninguém pediu. Se a pesquisadora quiser o script de volta, é capacidade própria.

**Provas.** Quatro camadas independentes, todas antes e depois da remoção do alias.

- **Bancada de teste com KV falso** (`harness-kv/`, no scratch da sessão, **fora do Git**):
  **18/18** casos, com o **ritual discriminante** — quebrando a regex dos nomes de arquivo o teste
  **falha** (`EXIT=1`), restaurada volta a passar (`EXIT=0`). Cópia do Worker **byte-idêntica**
  (`diff -q`).
- **`npx wrangler deploy --dry-run`** — `Read 50 files`; `Total Upload: 4.19 KiB`; bindings
  `env.PADD_KV (2ee331c7a5bc446ca86c8f2cb039ec16) KV Namespace` e `env.ASSETS Assets`.
- **`npx wrangler dev --local`, duas vezes** (a segunda com `.wrangler/state` apagado, depois da
  remoção do alias): `GET /api/receber` → `{"ok":true,"receber":"pronto"}`; `GET /` → 200;
  `GET /lancamento.html` → **307** para `/lancamento` (é o *assets-first* do Cloudflare largando o
  `.html`) → **200**; POST válido grava **duas** chaves; repetido recusa; e
  `POST /.netlify/functions/receber` → **404, corpo vazio, nenhuma escrita**.
- **Não-regressão dos validadores** — `tools/gerar-ciclo.sh fokini 01 diaghilev` →
  **0 erro(s), 0 aviso(s)**; `node tools/check-pacote.js` → **0 erro(s), 0 aviso(s)**. A rota do
  `lancamento.html` gerado mudou de 786 para **790**, e nada mais divergiu.

**O churn de regeneração foi o mesmo de sempre, e o mesmo tratamento.** O `lancamento.html` mudou
porque a **fonte** mudou — é o artefato que carrega a rota nova, e por isso **fica**. O carimbo
puro (`gerado_em`, nonce do cifrado, `/ID` do PDF) **não é elo** (P-04): foi restaurado com
`git restore`, como no precedente da entrada anterior.

**O que NÃO muda:** a fórmula de hash, a cobertura da âncora (`.fipp` continua cobrindo só
`ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e os `ciclo-XX-*.md` — editar `README.md`, `AGENTS.md` ou
`.github/` **não** exige reancorar), os validadores, as regras e as pétreas.

**Referências.**
`wrangler.jsonc` · `workers/receber.js` · `tools/templates/lancamento.html` ·
`CONGELAMENTO.md` (o rito do motivo declarado) · `ARQUITETURA-CAPTURA.md` §7.4 e a **Nota de
29/09/2026** (o elo do Netlify, que **não é apagado**) · `REGISTRO.md:7813` (a entrada-modelo da
migração para o Netlify) e `:8212` (o token medido) · `netlify/functions/receber.js` (a fonte
portada, apagada) · `README.md` (o deploy no Cloudflare).

**O que ainda não está feito.**

- **A leitura do KV em tempo de execução não existe** — nunca existiu, nem no Netlify. O pedido
  supunha um ponto de leitura; o que há é a escrita. A consolidação dos lançamentos **de volta para
  o repositório continua não existindo**: é a **§7.3**, aberta na mesma metade de sempre.
- **A pergunta 7.4 continua aberta** — o que vai ao KV é o JSON **em claro**, e o KV **não** é
  servido por GET. Ver a **Nota de 07/10/2026** em `ARQUITETURA-CAPTURA.md`.
- **O token do Netlify do `RITMOS` foi destruído junto com o arquivo.** Ele era **credencial
  viva** (`REGISTRO.md:8212`), e a escola `RITMOS` já tinha saído do repositório em `08c0be9`.
  Nada no Git o versionou, então **nenhuma rotação é forçada** — mas **revogá-lo no painel do
  Netlify** é decisão da pesquisadora, e o pedido fica registrado aqui.

  > **Correção de 07/10/2026 (mesmo dia).** A primeira redação deste bullet dizia que o token
  > *"foi destruído junto com o arquivo"*. **Está errado.** A medição seguinte — `GET
  > /api/v1/sites` com esse token — autenticou como `tmenegaz77@gmail.com` e devolveu `200`, ou
  > seja: **o token está VIVO**. O que foi destruído foram os **dois sites** que ele alcançava;
  > a credencial continua válida e não expira sozinha. Continua **não versionada** (nenhum arquivo
  > do repositório a contém), mas "não versionada" ≠ "destruída". **A revogação no painel deixou
  > de ser opcional:** enquanto o token existir, ele dá acesso à conta. O elo fica registrado
  > porque a proveniência acrescenta — não reescreve.

- **A verificação do painel do Cloudflare não foi feita** — não é alcançável daqui. Fica para ela:
  se o projeto é **Worker** ou **Pages** (o `wrangler.jsonc` é assinatura de Worker), o **account
  ID**, se o `PADD_KV` está **ligado** ou só **criado**, quais **rotas ou domínios** estão
  configurados, como o `PADD_KV` é provido no **desenvolvimento local**, e se o build do painel
  **honra** o `assets.directory` do `wrangler.jsonc` ou usa um diretório próprio.
- **Os commits ficam locais** até a pesquisadora empurrar.

---

## 07/10/2026 — O Netlify antigo é destruído, o mapa anda para o slide 83 e a espiral vira fonte

**O que motivou.** Três coisas, na mesma rodada, e a pesquisadora pediu as três de uma vez:
*"o meu time não existe mais no netlify. pode remover o token da ritmos e destroi o netlify velho.
faz os commits dos arquivos da apresentação também"*. A primeira é limpeza: dois sites órfãos
continuavam publicando sozinhos. A segunda é renumeração: o bloco novo de O Quebra-Nozes entrou
**antes** do mapa, e todo número de slide posterior a ele ficou defasado. A terceira é a
apresentação: os quatro arquivos satélites do deck carregavam os números velhos.

**Medido antes de mexer.**

- `/api/v1/sites?per_page=100` com o token do `RITMOS` ⇒ `200`, **14 344 B, exatamente 2 sites**.
  Ambos com `build_settings.repo_url = github.com/tmenegaz/danca`, publicando
  `professores/tiago/ciclos/ciclo-01-ritmos` e `…/ciclo-01-duo`, ambos `404`, **42 deploys em
  `error`** cada um.
- As pastas-fonte dos dois foram removidas em `08c0be9` ⇒ **órfãos**: o repositório não as tem
  mais, os sites continuavam no ar apontando para o nada.
- `ritmos.netlify.app`, `danca.netlify.app` e `danaca.netlify.app` devolvem `404` **com este
  token** ⇒ pertencem a **outra conta**. O critério de posse é `build_settings.repo_url`, não o
  título do HTML.
- Deck **HEAD: 72 slides**; worktree: **87 slides**. Alinhamento título a título ⇒ **a primeira
  divergência é o índice 50**; os **slides 1–49 são byte-idênticos**. **Delta = +15 uniforme a
  partir do slide 50**, provado em 6 medições independentes.
- `git diff --numstat` do deck ⇒ **`452 0`** — só inserções, nenhuma deleção.
- Varredura de número de slide *hardcoded* em `tools/*.js` ⇒ **um único hit, e é falso positivo**
  (o `70%` de um `@keyframes` em `gerar-animacao.js:130`). Nenhum script numerava slides.

**O que foi decidido.** *(o "como" foi meu; o "o quê" era dela)*

- **Destruir os dois sites, com confirmação nominal antes.** Pedi o alvo por extenso — nome, `id`,
  diretório e a contagem de deploys — e ela respondeu *"Sim — destruir os dois"*. Um `DELETE`
  cego em `/api/v1/sites` teria levado junto o que não era nosso se a conta fosse outra.
- **Não tocar nos três hosts de terceiros.** Foram reconsultados **depois** da destruição e
  continuam `404` — a contra-prova de que o estrago foi cirúrgico.
- **Corrigir todos os números, incluindo os que já estavam errados antes.** Medido o `HEAD`: a
  tabela do deck `README.md` já apontava `Exemplos (30–31)` e `Progressão (28–29)` quando eles
  sempre foram **42–43** e **40–41** — deriva **pré-existente**, não causada pelo bloco novo. Ela
  autorizou corrigir tudo de uma vez.
- **A espiral vira fonte, com injetor próprio.** O SVG da espiral dos criadores é **texto** ⇒
  versionável, como o mapa. Ganha um script espelho do `sincronizar-slide.js`, com a mesma
  convenção: marcadores `ESPIRAL:INICIO`/`ESPIRAL:FIM` no deck, SVG ao lado, idempotência.

**Onde entrou.**

- **5 arquivos modificados:** `apresentacoes/apresentacao-01-rizoma/README.md` (**32 edições**),
  `apresentacoes/apresentacao-01-rizoma/apresentacao-ballet.md` (**+454, 0 deleções**),
  `apresentacoes/apresentacao-01-rizoma/slides/rizoma-mapa-inline.md`,
  `.github/agents/deck-rizoma.agent.md`, `README.md` (raiz).
- **4 arquivos novos:** `quebra-nozes-48-68.md` (Marp standalone dos slides 48–68),
  `quebra-nozes-guia-de-narracao.md`, `quebra-nozes-espiral.svg` (a fonte) e
  `tools/sincronizar-espiral.js` (o injetor).
- **Renumerados:** o mapa do rizoma **68 → 83**; o agradecimento **72 → 87**; a contagem
  **72 → 87 slides** em todas as superfícies que a citam.
- **`_notes` do deck, linha 1709** — dizia *"No mapa do slide 68…"* ⇒ **83**.
- **Tabela de classes do deck `README.md`** — estava defasada em três linhas: `mid` dizia 10 slides
  (são **19**), `table-xl` dizia 28–29 (são **40–41**), `table-lg` dizia 40 (é **67**), e
  `dense` constava como *"reservas na CSS — não usadas"* quando está **em uso nos slides 56–60**.
- **Créditos da capa** — a `README.md` mandava preencher `[Nome da apresentadora]`, `[Data]` e
  `[Contato]`; varredura no repositório inteiro achou **exatamente 1 ocorrência, e era essa mesma
  linha**. Os três campos **não existem** no slide: a capa traz `**Tiago Menegaz**`,
  `**3 de outubro de 2026**` e `**Studio Ritmo e Movimentos — Passo Fundo, RS**`.

**Motivo declarado — o congelado.**

`tools/sincronizar-espiral.js` entra em `tools/`, que é **congelado**. O motivo: a espiral é
**fonte do deck**, como o mapa, e sem injetor próprio ela só existiria como SVG solto — sem
marcador, sem verificação de sincronia e sem o `check-mapa.js` para prová-la. O script é **espelho
fiel** do `sincronizar-slide.js`: mesma convenção de marcadores, mesmo `require('./lib-tokens')`,
mesma leitura de `process.env.APRESENTACAO`, mesma idempotência. Nada de novo é inventado — a
única diferença é o par de marcadores e o arquivo de SVG.

**Com o quê.** `wrangler 4.147.0`, node `v24.12.0`, o CLI do Netlify por `curl` (não há `netlify`
instalado), `python3` para o mapeador linha→slide, `sed`/`awk` para conferência byte a byte.
O mapeador linha→slide **precisa descartar o front-matter YAML** do deck, que fecha na linha 125 —
incluí-lo superconta os slides em **+2**.

**Referências.**

- `CONGELAMENTO.md:19` — a lista dos congelados, e `tools/` entre eles.
- `REGISTRO.md:8757` — a entrada anterior, *"O cofre dos lançamentos sai do Netlify e entra no
  Cloudflare KV"*, onde nasceu a afirmação errada sobre o token. Corrigida ali com nota datada.
- `08c0be9` — o commit que tirou `professores/tiago/` do repositório e deixou os dois sites órfãos.
- `a265450` (2026-09-17) — o commit **original** do deck, com **72 slides**. `git log -S "Contexto
  Soviético" --all` ⇒ **0 hits**: o título nunca existiu como slide; era nome informal do professor.
- `1d01c9d` — a entrada do Cloudflare, que apagou o Netlify do repositório.
- `apresentacoes/apresentacao-01-rizoma/README.md:348–349` — a calibração da animação do mapa,
  consistente com o `check-mapa.js` (26 caixas + 33 arestas).

**Provas.**

1. **Destruição:** `DELETE /api/v1/sites/{id}` ⇒ **HTTP 204, 0 B** nos dois. Depois:
   `/api/v1/sites` ⇒ `200`, **2 B, 0 sites**; cada `id` ⇒ **404**; os três hosts de terceiros ⇒
   **404**, intocados.
2. **Renumeração:** `grep` de `slide 68|slide 69|slide 72|72 páginas|72 slides|slide-72|slide.072`
   nos **três** arquivos de documentação ⇒ **EXIT=1, zero hits**.
3. **Validadores, todos EXIT=0:** `check-overflow.js` ⇒ **87 slides, 0 com overflow**;
   `check-mapa.js` ⇒ **26 nós / 33 arestas / 0 colisões**; `check-identidade.js` ⇒ **21 pares AA**,
   4 linhas `ok:`.
4. **Idempotência dos dois injetores, por sha256:** o deck fechou em
   `274f9e4bab218d89b75aeaf70fe6c13658893fe6b99b19a46c6b700b66833d83` **antes e depois** de
   rodar os dois. O comportamento verbatim: *"já estava sincronizado — nada a fazer"* (160 linhas
   de SVG, 22 caixas; e 73 linhas de SVG, 6 caixas).
5. **Varredura de identidade:** o script da skill `identidade-do-projeto` sobre os 14 pontos de
   entrada ⇒ **todos os achados legítimos**, com ressalva de escopo. Nenhum arquivo de
   apresentação aparece.

**O que NÃO muda.**

- **A fórmula do hash** (`tools/hash-ciclo.sh`) e a **cobertura da âncora** (`.fipp`): o deck, o
  `README.md` da apresentação, `.github/agents/` e o `README.md` da raiz **não** são fontes de
  ciclo ⇒ **nenhum `.fipp` precisa ser reancorado**. O `.fipp` cobre só
  `professores/<professor>/ciclos/ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e os `ciclo-XX-*.md`.
- **As 17 regras**, as **22 pétreas** e o `CONGELAMENTO.md` — nenhuma regra mudou; a renumeração
  corrige **referência**, não princípio.
- **Os validadores** — a assinatura das quatro linhas de `check-identidade.js` é a mesma, e o
  `pre-commit` continua rodando a seção 5 sem alteração.

**O que ainda não está feito.**

- **O token do `RITMOS` continua VIVO.** Ver a **nota de correção datada** em `REGISTRO.md:8886`
  — ele autentica como `tmenegaz77@gmail.com` e agora alcança **0 sites**, mas **não expira
  sozinho**. A API do Netlify administra sites, **não** PATs: a revogação é no painel
  (*User settings → Applications → Personal access tokens → Revoke*). Não há nada editável no
  repositório.
- **O export não foi rodado.** Nenhum PDF, PPTX ou HTML da apresentação foi gerado nesta rodada —
  a pesquisadora pediu os **commits**, não a entrega.
- **A temporada de commits é local** até ela empurrar.

## 07/10/2026 — O prompt de elicitação herda oito decisões do formulário do experimento

**O que motivou.** O formulário do PO do experimento (`experimentos/po/conteudo/po.json`, 36 nós)
foi construído *a partir* do prompt congelado — e evoluiu além dele. O plano de 06/10/2026 já
registrava a coexistência: *"é o elo textual; o PO continua a poder nascer por prosa"*. A
pesquisadora pediu que a diferença fosse **medida** e que as melhorias **voltassem ao prompt**,
*"para que o prompt continue sendo o caminho de entrada — com a mesma qualidade do formulário"*.
Medi as duas peças, nó a nó e bloco a bloco.

**O que foi decidido.** Oito decisões do formulário entram no prompt; o resto **não** entra, e o
porquê fica escrito na mesma entrada. Entram:

1. **O porquê de cada pergunta.** O formulário traz `explicacao.porQue` em **todos** os 36 nós; o
   prompt tinha a *ponte* (o termo do protocolo entre crases) e **nunca** o motivo. Regra nova em
   «Como conduzir»: uma linha de porquê junto da ponte.
2. **Obrigatório × opcional.** 28 dos 36 nós declaram `obrigatorio: true`; o prompt não tinha a
   distinção. A compilação passa a separar a **lacuna explícita** (`[a decidir]`) do **branco
   declarado** — e a suposição continua sendo o defeito.
3. **O checklist perguntado.** Os seis critérios de validação são, no formulário, seis nós
   **obrigatórios** (`blocos[7]`); no prompt eram uma menção — *"relê o PO contra o checklist de
   validação"* — **sem os seis nomes em lugar nenhum**. Agora o fechamento pergunta os seis, um a
   um, e um «não» volta ao campo que o critério nomeia.
4. **Campo e contexto como dois grupos nomeados, com «outro».** O formulário organiza a observação
   inicial em `Campo empírico` e `Contexto da observação`, cada um com campo aberto. O Bloco 1 era
   lista plana **sem catch-all** — e daí saíram **quatro lacunas de conteúdo**, não de estilo:
   `campo-turma` (**qual turma**), `contexto-volume`, `contexto-registro` e os dois «outro».
5. **A derivação da linha de base.** O formulário deriva inclusão/exclusão do que a anamnese já
   declara; o prompt perguntava a frio. O Bloco 7 passa a pedir um **rascunho** do agente, sujeito
   a edição — *sugestão, não decisão*.
6. **P-12 e a estabilidade do apelido.** O formulário declara `apelidoObrigatorio: "P-12"`; o
   prompt pedia apelidos, citava P-01, P-11 e P-22 — e **não** P-12. O Bloco 3 passa a citá-la, com
   a estabilidade entre ciclos.
7. **Perguntas condicionais declaradas.** O formulário declara `condicaoDeEntrada` em dois módulos;
   o prompt perguntava tudo sempre. Os Blocos 2 e 4 passam a declarar as duas condições (P-14 e a
   extensão).
8. **P-16 — declarado, nunca deduzido.** Regra que o formulário repete (`listaAberta.regra`) e o
   prompt não tinha.

**O que NÃO entrou, e por quê.** A proveniência de três estados, o KV, a leitura lazy, os selos de
estado, o `repetirPor` auto-preenchido, `exclusiva`/`multipla` e o versionamento do envelope são
decisões de **sistema** — o prompt não tem estado, não tem leitor e não tem tela. As 22 regras de
corte também não: o prompt ganhou a **capacidade** de derivar, não as regras. E o
`explicacao.oQueE`/`preencher` já estavam lá — o `oQueE` *é* a pergunta, o `preencher` *é* a forma
(a regra das listas e a dos marcos).

**Onde entrou.** `prompts/elicitar-ciclo.md` — 213 → **277 linhas** (9 928 → **14 087 B**):
**+78 linhas, 14 removidas — todas reescritas**, em quatro pontos (o fechamento, as linhas
dispersas do Bloco 1, a linha dos apelidos e o bullet da extensão), conferidas uma a uma. Os
**dez blocos** continuam — e é o que o `derivar-plano.js` declara
(`espacosDeNomes.entrevista.blocos: 10`).

**Motivo declarado — os congelados.** `CONGELAMENTO.md` congela `prompts/`. O motivo: o prompt é o
**elo textual** do PO (P-19), e o formulário — construído a partir dele — resolveu oito problemas
que o texto ainda não resolvia. Deixá-lo como estava criaria **duas qualidades** de elicitação: a
do formulário e a da prosa. A alteração é de **redação e de conteúdo de entrevista**; não é de
comportamento de sistema. **O que não muda:**

- **A fórmula do hash e a cobertura da âncora.** `prompts/` **não** está em `tools/lib-fontes.sh`, e
  o `.fipp` cobre só `professores/<professor>/ciclos/ciclo-XX.conf`, `ciclo-XX-<escola>.conf` e os
  `ciclo-XX-*.md` ⇒ **nenhum `.fipp` precisa ser reancorado**. Provado: `tools/hash-ciclo.sh fokini
  01 diaghilev --check` ⇒ *"ciclo 01-diaghilev íntegro; cadeia intacta"* — rodado **depois** da
  alteração.
- **Os validadores, os extratores e os geradores.** Nenhum lê o prompt: as duas referências no
  repositório são **citações** — `derivar-plano.js:246` (uma string `fonte:`) e
  `prompts/instalar-ciclo.md:11` (uma remissão em prosa).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou. As pétreas novas citadas
  (P-12, P-14, P-16) **já existiam** — o prompt é que não as citava.

**Com o quê.** `prompts/elicitar-ciclo.md` — oito acréscimos, um por decisão, mais a escopagem de
uma linha do «Formato de saída» (`Onde algo **obrigatório** não foi respondido, [a decidir]`), que
senão contradiria a regra nova do opcional em branco. `REGISTRO.md` — esta entrada.

**Referências.** `experimentos/po/conteudo/po.json` (o formulário: 36 nós, 28 obrigatórios) ·
`experimentos/po/README.md` §4 e §8 · `.github/instructions/registro-md.instructions.md` ·
`CONGELAMENTO.md` · `PROTOCOLO.md` (P-12, P-14, P-16) · precedente de prompt congelado editado:
`ebc62bb`. A via anterior do arquivo está no workspace da sessão (md5
`b7e455a75f27a670f96df2425f350a3a`).

**O que ainda não está feito.**

- **As Frentes 2 e 3 do pedido não começaram:** o botão «Usar IA para fazer o PO» (que deve acionar
  **este** prompt, agora atualizado) e a lista de sujeitos e anamneses para o agente inteligente.
- **A alteração não foi vista por um agente em uso.** O que se mediu foi o **texto** — oito
  acréscimos presentes e verificados. Se a entrevista conduzida pelo prompt atualizado produz PO
  melhor, isso só se sabe **rodando-o**.
- **A via anterior não está no repositório.** Ficou em `files/elicitar-ciclo.ANTES.md`, no workspace
  da sessão, **fora do Git**.

## 09/10/2026 — O menu «Área do Professor» ganha o acesso ao Plano de Observação

**O que motivou.** A migração do experimento para produção (o PO completo deve gerar o ciclo) tem
um requisito de entrada: o professor precisa **chegar** à porta de elicitação a partir do site. Sem
um item de menu, a porta existe mas é inalcançável pela navegação do pacote. O pedido da
pesquisadora (09/10/2026) é exatamente esse: «vai para o menu área do professor … o acesso ao que
é plano de observação».

**O que foi decidido.**

- O grupo **«Área do Professor»** do menu ganha um item **«Plano de Observação»**, ao fim da lista
  de ferramentas (depois do `lancamento`), apontando para a porta de elicitação.
- O item é um **link externo** — uma rota do Worker, não um `$doc.html` do pacote — e por isso é
  tratado à parte em `gerar_nav()`, não por `item_menu()`. Ele leva o **contexto do ciclo**
  (`professor`, `escola`, `ciclo`), para a porta abrir já identificada.
- A porta abre na **abertura** (a explicação + os dois botões «anamnese» / «PO»), não direto no
  formulário do PO — é o fluxo decidido na mesma data.

**Onde entrou.** `tools/gerar-ciclo.sh` — `PO_URL` (o link, com o contexto) e o bloco que o emite
no fim do grupo «Área do Professor».

**Motivo declarado — os congelados.** `CONGELAMENTO.md` congela `tools/` e «a estrutura de menu ou
navegação». O motivo: a porta de elicitação (o experimento promovido) só é alcançável pelo menu, e
sem ele o professor não tem caminho de entrada — a migração ficaria com o elo da navegação em
aberto. **O que não muda:**

- **A fórmula do hash e a cobertura da âncora.** `fontes_do_ciclo()` (a lista que o
  `hash-ciclo.sh` ancora) cobre os manifestos, o PO, os documentos e o `-dados.json` — **não** o
  gerador nem os templates. `tools/gerar-ciclo.sh` **não** é fonte de `.fipp` ⇒ **nenhuma âncora
  precisa ser reancorada**.
- **A fórmula do hash, a cobertura da âncora e os demais validadores.** Nenhum muda. A única
  mudança de comportamento é **no `check-pacote.js`**, e é declarada: o link interno passa a
  **pular** `href`/`src` que começam com `/` (rota do Worker, mesma origem), em vez de reprová-los
  como arquivo local. Foi a decisão da pesquisadora (09/10/2026, escolha entre URL absoluto ×
  ensinar o validador). Os links **relativos** do pacote continuam a ser conferidos um a um — a
  regra de checagem não afrouxou para o conteúdo publicado.
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou; a mudança é de navegação
  (o próprio `CONGELAMENTO.md` a lista como «o que exige motivo declarado», e é isto aqui).

**Com o quê.** `tools/gerar-ciclo.sh` — `PO_URL` + o item externo no grupo «Área do Professor».
`tools/check-pacote.js` — o link interno passa a **pular** `href`/`src` que começam com `/`
(rota do Worker, mesma origem), distinguindo-os dos links relativos do pacote. `REGISTRO.md` —
esta entrada.

**Referências.** `CONGELAMENTO.md` («Alterar a estrutura de menu ou navegação») · a sequência do
menu em `tools/gerar-ciclo.sh` (decisões da pesquisadora, 19/09/2026) ·
`porta/index.html` (a abertura com os dois botões) ·
`motor/servidor/escrever-po.js` e `motor/nucleo/derivar-po.js` (a ponte que a
porta serve) · `tools/lib-fontes.sh` (`fontes_do_ciclo`, para o que entra na âncora).

**Como foi fechado (09/10/2026, à tarde).**

- **O `[conferir]` saiu.** A rota definitiva é `/plano-observacao/` — o prefixo que o Worker de
  produção passou a servir.
- **A promoção foi feita.** O motor agnóstico e a porta saíram de `experimentos/pe/` para
  `motor/` e `porta/` (versionados), e o Worker de produção (`workers/principal.js` →
  `motor/servidor/producao.js`) passou a servir, na mesma origem, o pacote, o lançamento e a
  porta sob `/plano-observacao/`. Verificado no ar em `diaghilev` (landing, APIs e assets 200).
- **A regeneração foi feita.** `tools/gerar-ciclo.sh fokini 01 diaghilev` — o item novo aparece
  nos 21 HTML do pacote, e o `check-pacote.js` (agora pulando a rota) aceita o link.
- **O commit do menu é este** (o anterior, do congelado); a **promoção** entra no commit próprio
  de estrutura, na sequência.

## 09/10/2026 — A escola Diaghilev é declarada escola de TESTE, fora da conferência de senha

**O que motivou.** O `pre-push` (conferência de vazamento de senha) barrou o envio porque a senha
de `SENHA_DIAGHILEV` é o próprio slug da escola (`diaghilev`), que aparece em texto puro em
dezenas de arquivos versionados. A conferência estava correta para uma escola real — mas a
Diaghilev **é uma escola de TESTE: todos os dados são falsos, nenhuma aluna real**. Não há
segredo a proteger ali; a "senha" é um placeholder conhecido, não uma credencial.

**O que foi decidido.** A Diaghilev passa a ser **declarada escola de teste**, com uma exceção
**explícita e estreita** — não um silenciamento da conferência:

- A conferência de senha do `pre-push` ganha uma lista de **escolas de teste** (`tools/.escolas-teste`,
  local, no `.gitignore`), uma slug por linha. Uma escola listada ali **pula a conferência 1** —
  e o hook **declara o porquê** a cada vez, em vez de passar em silêncio.
- A exceção vale **só para a conferência de senha** (a senha de uma escola de teste não é segredo).
  A conferência 2 (acompanhamento em texto puro versionado) e todas as demais continuam valendo
  para qualquer escola, inclusive as de teste.

**A fronteira da exceção.** Uma escola **real** nunca pode entrar em `tools/.escolas-teste` — seria
abrir a porta que a conferência fechou. O arquivo é local e o seu propósito está documentado no
próprio hook e no `.gitignore`.

**Motivo declarado — os congelados.** `tools/hooks/pre-push` faz parte de `tools/` (congelado) e é
lógica de validação (o `CONGELAMENTO.md` lista "alterar a lógica de hash, validação ou geração"
como algo que exige motivo declarado). O motivo: a conferência de senha, aplicada sem exceção,
bloqueia o envio de uma escola de teste cuja "senha" não é um segredo — um alarme que acende sem
proteger nada. **O que não muda:** a conferência 1 continua aplicada a todas as escolas reais; a
conferência 2 e o resto do hook continuam idênticos; as 17 regras, as 22 pétreas e o
`CONGELAMENTO.md` não mudam.

**Com o quê.** `tools/hooks/pre-push` — a conferência 1 passa a pular as escolas listadas em
`tools/.escolas-teste` (lidas do `SENHA_<ESCOLA>`, com a slug em minúsculas). `.gitignore` — a nova
entrada `tools/.escolas-teste` (local, como as senhas). `tools/.escolas-teste` — local, com
`diaghilev`. `REGISTRO.md` — esta entrada.

**Referências.** `tools/hooks/pre-push` (a conferência de senha) · `tools/.senhas-locais.exemplo`
(a convenção `SENHA_<ESCOLA>`) · `CONGELAMENTO.md` ("alterar a lógica de hash, validação ou
geração") · `tools/gerar-acompanhamento.sh` (quem consome as senhas).

## 09/10/2026 — A porta do Plano de Observação ganha a navegação do site e o comportamento de saída

**O que motivou.** Com a porta publicada sob `/plano-observacao/` (mesma origem do pacote), dois
fenômenos apareceram no uso: (1) ao abrir a porta, a barra de navegação do site **desaparecia** —
o professor não tinha o menu e não percebia estar no mesmo sistema; e (2) o botão **voltar** do
navegador saltava para o início do ciclo, em vez de devolver à tela anterior. O pedido da
pesquisadora (09/10/2026) detalha o comportamento esperado: voltar do navegador devolve à página
anterior; «começar de novo» limpa a memória e volta ao portal do Plano de Observação; dentro do
formulário há um botão **Sair** que preserva na memória e volta ao portal; e, no PO, o botão de
troca diz **«Voltar para a anamnese»**.

**O que foi decidido.**

- A porta recebe a **MESMA navegação do site** (a `gerar_nav`), com o item «Plano de Observação»
  marcado como ativo. Os links saem de **raiz** (`/index.html`, `/aula-01.html`, …) porque a porta
  vive um nível abaixo do pacote (`/plano-observacao/`); as chamadas de API continuam relativas,
  ancoradas pelo `<base href="./">`.
- O `body` volta a reservar `var(--header-height)` (a navbar fixa não cobre o conteúdo), e a
  `.barra` de contexto gruda **abaixo** da navbar (`top: var(--header-height)`). A altura da `.barra`
  passa a viver em `--barra-height` (o `--header-height` é da navbar, publicado pelo `nav.js`).
- **Navegação por histórico:** abrir a condução marca uma entrada (`pushState`); o **Sair** a
  desempilha (`history.back()`). O `popstate` reabre o portal. Assim o voltar do navegador: dentro
  do formulário → portal; no portal → página anterior do ciclo (uma pressão só).
- **«Começar de novo»** limpa a memória (depósito + respostas/notas/sugeridas) e volta ao portal.
  **«Sair»** preserva na memória (padrão) e volta ao portal, que então mostra «continuar / começar
  de novo». O botão de troca de fonte, no modo PO, diz **«Voltar para a anamnese»**.

**Onde entrou.** `tools/gerar-ciclo.sh` (a `gerar_nav` ganha o prefixo de link e a cópia da porta
com a navegação injetada no marcador `<!-- NAV -->`) · `porta/index.html` (a navegação, o
`body id="top"`, o `--barra-height`, o botão Sair e a máquina de histórico) ·
`professores/fokini/ciclos/ciclo-01-diaghilev/plano-observacao/index.html` (regenerado).

**Motivo declarado — os congelados.** `tools/gerar-ciclo.sh` é infraestrutura congelada, e a
mudança toca a **geração** (o `CONGELAMENTO.md` lista "alterar a lógica de hash, validação ou
geração" e "alterar a estrutura de menu ou navegação"). O motivo: a porta promovida precisa da
navegação do site para o professor perceber continuidade — e a navegação tem de ser **gerada**,
não copiada à mão. **O que não muda:** a fórmula do hash e a cobertura da âncora (o gerador não é
fonte de `.fipp`); as 17 regras, as 22 pétreas e o `CONGELAMENTO.md`; o comportamento das páginas
do pacote (a `gerar_nav` com prefixo vazio gera exatamente os mesmos links relativos de antes).

**Com o quê.** `tools/gerar-ciclo.sh` — `link_href()` (prefixo de link), a cópia da porta em
`1b` com a injeção do marcador, e o item «Plano de Observação» ativo na porta. `porta/index.html` —
o `<!-- NAV -->`, o `body id="top"`, o `--barra-height`, o `scroll-padding-top`, o botão `#sair` e
a máquina de histórico (`abrirFormulario`/`voltarAoPortal`/`popstate`). `REGISTRO.md` — esta entrada.

**Referências.** `tools/gerar-ciclo.sh` (`gerar_nav`, o bloco `1b` da porta) · `porta/index.html`
(a navegação e a máquina de histórico) · `tools/templates/nav.js` (a barra compartilhada) ·
`CONGELAMENTO.md` ("alterar a lógica de hash, validação ou geração" / "alterar a estrutura de menu
ou navegação").

## 09/10/2026 — A criação de escola vira um comando: o CLI de scaffolding, e a porta deixa de nascer com escola fixa

**O que motivou.** A migração da porta para produção foi feita "à mão" três vezes (Diaghilev no
pacote, e a escola de teste do zero): criar a pasta do professor, copiar os schemas, escrever os
manifestos, montar o pacote, gerar o `wrangler` e fazer o deploy. A pesquisadora pediu que esse
processo fosse **empacotado** — "quando eu tiver um cliente novo, uma escola nova, eu tenho que
poder fazer tudo isso" por **linha de comando** (nomes iniciais de entrada + `--deploy`). Ao mesmo
tempo, a inspeção da porta revelou que os campos de contexto (`escola`, `professor`, `ciclo`,
`aluna`) nasciam **pré-preenchidos** com `Diaghilev`/`fokini`/`01`/`P-12` — o que contradiz o
princípio agnóstico e faria uma escola nova abrir com a escola errada.

**O que foi decidido.**

- Nasce `tools/criar-escola.sh`: o CLI que cria do zero o ambiente de uma escola — a pasta do
  professor (se nova), os `ciclo-NN-*.json` de schema (copiados de um ciclo-modelo, padrão
  `fokini/01`), os manifestos `ciclo-NN.conf` + `ciclo-NN-<escola>.conf` (objetivo geral como
  lacuna `[Preencher: …]` e `DOCS=""`), o pacote zero (índice mínimo + a porta + os assets
  compartilhados) e o `wrangler.<worker>.jsonc`. Com `--deploy`, sobe o Worker e grava o segredo
  `GITHUB_TOKEN`. Sem argumentos, pergunta interativamente o que faltar; recusa **sobrescrever**
  o que já existe (a proveniência acrescenta, não edita).
- A porta **deixa de nascer com escola fixa**: os quatro campos de contexto vêm vazios, e a URL do
  menu (`?escola=…&professor=…&ciclo=…`) os preenche. É a pré-condição do "do zero".
- Nasce a escola de teste **diaghilev2** (professor `fokini2`, ciclo `02`, Worker `diaghilev2`),
  no KV compartilhado — para exercitar a elicitação a partir de nada: anamnese → PO → geração.

**Onde entrou.** `tools/criar-escola.sh` (novo) · `porta/index.html` (os defaults de contexto
vazios) · `professores/fokini2/` (a escola de teste) · `wrangler.diaghilev2.jsonc` (o Worker
irmão) · `REGISTRO.md` (esta entrada).

**Motivo declarado — os congelados.** `tools/criar-escola.sh` é **adição** a `tools/` (a pasta
congelada): o motivo é que a criação de escola é um caminho repetitivo e o empacotamento evita
divergência e reescrever à mão — e **adiciona** um gerador novo, sem alterar nenhum congelado
existente. **O que não muda:** a fórmula do hash e a cobertura da âncora (o script não toca
`.fipp`); os validadores e as 17 regras / 22 pétreas; `tools/gerar-ciclo.sh`, `tools/hash-ciclo.sh`
e os templates existentes (o script os **consome**, não os edita).

**Com o quê.** `tools/criar-escola.sh` — o CLI completo (argumentos nomeados + prompts +
`--deploy` + recusa de sobrescrever). `porta/index.html` — `ctx-escola`/`ctx-professor`/`ctx-ciclo`/
`ctx-aluna` com `value=""`. `professores/fokini2/` — `ciclo-02.conf`, `ciclo-02-diaghilev2.conf`,
os `ciclo-02-*.json` de schema e o pacote `ciclo-02-diaghilev2/`. `wrangler.diaghilev2.jsonc` — o
Worker irmão do `diaghilev`.

**Referências.** `professores/README.md` ("Como adicionar um professor" — o processo manual que o
CLI agora automatiza) · `CONGELAMENTO.md` ("tools/ — geradores, validadores, hooks") ·
`tools/gerar-ciclo.sh` / `tools/hash-ciclo.sh` (consumidos, não editados).

**O que ainda não está feito.** A lacuna do ciclo vazio: `tools/gerar-ciclo.sh` exige `DOCS`
não-vazio (`: "${DOCS:?}"`), então a geração disparada pela conclusão do PO vai parar pedindo um
documento. Decidir, na etapa seguinte: (a) o PO elicitado gera um esboço de plano como primeiro
`DOCS`, ou (b) o gerador passa a aceitar `DOCS=""`. A escola `diaghilev2` ainda não foi **ancorada**
(`tools/hash-ciclo.sh fokini2 02 diaghilev2`) — é o primeiro ciclo do professor, sem `parentHash`.

## 09/10/2026 — A porta passa a elicitar o PLANO, e o ciclo do zero passa a nascer com plano + PO

**O que motivou.** A porta de elicitação foi promovida elicitando só o PO (a metade observacional);
o PLANO — objetivo geral, marcos por aula e rubrica (Regra 10) — ficou no caminho por prosa
(`prompts/elicitar-ciclo.md`, Blocos 1 a 4). A consequência apareceu ao criar a escola de teste
`diaghilev2` do zero: o ciclo nasce com `DOCS=""`, e o `gerar-ciclo.sh` exige `DOCS` não-vazio — a
geração disparada pela conclusão do PO parava sem documento. A análise do fluxo antigo confirmou a
raiz: **plano e PO nasciam JUNTOS na mesma entrevista**, e o `instalar-ciclo` os separava em
arquivos; a tela havia herdado só a metade PO.

**O que foi decidido.**

- A porta ganha a fonte **`plano`** (terceira, ao lado de `anamnese` e `po`): a tela conduz
  **anamnese → plano → PO**, na mesma ordem dos blocos do prompt congelado.
- O plano é elicitado campo a campo (`porta/plano/conteudo/plano.json`): objetivo geral, marcos por
  aula, estrutura, distribuição de volume, condições, rubrica, extensão, referências e proveniência
  — os `required` do `plano-schema` (objetivo geral, marcos, rubrica, proveniência). As tabelas
  nascem de listas (uma linha por item), como manda o prompt.
- Nasce `motor/nucleo/derivar-plano-ciclo.js` (irmão do `derivar-po.js`): o envelope do plano vira o
  `ciclo-XX-<escola>-plano.md`. A tabela de identificação do ciclo (duração, datas, volume) vem do
  `.conf` — sai como lacuna `[Preencher: …]`, nunca inventada.
- Nasce `motor/servidor/escrever-plano.js`: escreve o `-plano.md` E liga o plano à geração — quando
  o `DOCS` do `.conf` está vazio, vira `DOCS="plano"` (a primeira fonte do ciclo).

**Onde entrou.** `porta/plano/conteudo/plano.json` (novo) · `motor/nucleo/derivar-plano-ciclo.js`
(novo) · `motor/servidor/escrever-plano.js` (novo) · `motor/nucleo/porta.js` (a fonte `plano` no
`elicitar`) · `motor/servidor/rotas.js` (o mapa e a conclusão do plano) ·
`motor/servidor/cloudflare.js` e `node.js` (carregam o conteúdo do plano; o node.js também tem os
caminhos da migração corrigidos) · `porta/index.html` (a terceira fonte e o ciclo de troca) ·
`tools/criar-escola.sh` (a documentação do fluxo) · `REGISTRO.md` (esta entrada).

**Motivo declarado — os congelados.** `tools/criar-escola.sh` é adição a `tools/` (congelado), e
esta mudança só **ajusta a redação do fluxo** no script que a própria sessão criou — não toca a
fórmula do hash, os validadores, as 17 regras nem as 22 pétreas. Os validadores congelados
(`validar-plano-ciclo.js`, etc.) são **consumidos**, não editados: o `-plano.md` emitido passa por
eles.

**Com o quê.** `porta/plano/conteudo/plano.json` · `motor/nucleo/derivar-plano-ciclo.js` ·
`motor/servidor/escrever-plano.js` · `motor/nucleo/porta.js` · `motor/servidor/rotas.js` ·
`motor/servidor/cloudflare.js` · `motor/servidor/node.js` · `porta/index.html` ·
`tools/criar-escola.sh` · `REGISTRO.md`.

**Referências.** `prompts/elicitar-ciclo.md` (Blocos 1 a 4 — o plano) · `prompts/instalar-ciclo.md`
(o separador do Markdown único) · `tools/validar-plano-ciclo.js` (o contrato de extração) ·
`tools/validar-po-ciclo.js` · `motor/nucleo/derivar-po.js` (o irmão) · `CONGELAMENTO.md`.

**O que ainda não está feito.** O commit da escola `diaghilev2` **vazia** (antes de qualquer
elicitação) segue bloqueado pelo `pre-commit`, que tenta gerar o pacote de um ciclo sem `DOCS` — o
estado "zero" que o gerador ainda não reconhece. Decidir, na próxima etapa: (a) o `pre-commit` pula
ciclos com `DOCS` vazio (o estado legítimo de uma escola recém-criada), ou (b) a geração aceita
`DOCS=""`. O teste de ponta a ponta (elicitar plano → `-plano.md` + `DOCS="plano"` → elicitar PO →
geração) ainda não foi exercido contra o GitHub real.

## 10/10/2026 — O menu separa a Anamnese do Plano de Observação, e a navegação da porta muda de modelo

**O que motivou.** Testando a porta, a pesquisadora viu que o item «Plano de Observação» caía na
anamnese (o `?fonte=` ausente entrega a anamnese), com os três botões «Começar pela anamnese» /
«Ver a ficha em branco» / «Fazer o plano» — e que «Sair», dentro do plano, devolvia à anamnese em
vez do portal do plano. O pedido (10/10/2026): separar os formulários por item de menu, fazer o
plano entrar pelo PO, e corrigir a saída e os rótulos dos botões («Começar…» → «Fazer…»).

**O que foi decidido.**

- A **anamnese** e o **PO** passam a ser **dois itens de menu** na «Área do Professor»:
  «Anamnese do aluno» (a porta sem `fonte`, a anamnese) e «Plano de Observação» (a porta com
  `?fonte=po`). O **plano** deixa de ter item próprio: entra pelo PO («Fazer o plano»).
- A **anamnese** perde o botão «Fazer o plano» (não há navegação cruzada a partir dela); ganha, no
  fecho (ao gravar), o atalho «Criar o Plano de Observação».
- O **PO** passa a ter o botão «Fazer o plano» (→ plano) em vez de «Voltar para a anamnese».
- O **plano** volta ao PO («Voltar ao Plano de Observação») e, no passo de definir a aluna, o
  atalho de criar a anamnese passa a voz de professor («Ainda não fez a anamnese desta aluna?»).
- Os rótulos de início trocam o verbo: «Fazer a anamnese», «Fazer o plano», «Fazer o plano de
  observação» (em vez de «Começar…»).
- **«Sair»** passa a voltar ao **portal da fonte atual** (plano → portal do plano), não à página
  anterior.

**Onde entrou.** `porta/index.html` — rótulos, o `link-fonte` por fonte, o flag `EM_AUTOABERTURA`
(para o «Sair»), o atalho `link-criar-po` no fecho e o texto do `criarEm`. `tools/gerar-ciclo.sh` —
`ANAMNESE_URL` + `PO_URL` (com `&fonte=po`) e o item novo «Anamnese do aluno».

**Motivo declarado — os congelados.** `CONGELAMENTO.md` congela `tools/` e «a estrutura de menu ou
navegação». O motivo: o menu passou a expor **um** item («Plano de Observação») que caía na
anamnese, deixando o PO sem porta própria e confundindo a entrada; a separação por item de menu é
a única forma de o professor chegar a cada formulário pelo caminho certo. **O que não muda:**

- **A fórmula do hash e a cobertura da âncora.** `tools/gerar-ciclo.sh` não é fonte de `.fipp`
  (a cobertura cobre manifestos, PO, documentos e `-dados.json`) ⇒ **nenhuma âncora precisa ser
  reancorada**.
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou; a mudança é só de
  navegação (o próprio `CONGELAMENTO.md` a lista como «o que exige motivo declarado»).
- **Os validadores.** Nenhum mudou; a mudança é de rótulo e de estrutura de menu, não de conteúdo.

**Com o quê.** `tools/gerar-ciclo.sh` — `ANAMNESE_URL`/`PO_URL` e o item «Anamnese do aluno».
`porta/index.html` — rótulos, `link-fonte`, `EM_AUTOABERTURA`, `link-criar-po` e o texto do
`criarEm`. `REGISTRO.md` — esta entrada.

**Referências.** `CONGELAMENTO.md` («Alterar a estrutura de menu ou navegação») · a entrada
anterior do menu (09/10/2026) · `porta/index.html` (o fluxo `?fonte=`) ·
`motor/servidor/README.md` (as rotas e a ponte) · `tools/gerar-ciclo.sh` (`gerar_nav`).

**O que ainda não está feito.** O **pacote ainda não foi regerado** — a mudança do menu só aparece
nos HTML após `tools/gerar-ciclo.sh <professor> <ciclo> <escola>`. O estado ativo do item
(«Plano de Observação» ativo vs «Anamnese do aluno» ativo) continua **único** na porta: a nav é
gerada uma vez (`atual=plano-observacao`) e não distingue `?fonte=` — a marcação de «ativo» por
fonte fica em aberto.

## 11/10/2026 — «Nós, Por Exemplo» vira a página de entrada; o «Início» e a marca saem do menu

**O que motivou.** Testando o menu, a pesquisadora viu três redundâncias: (1) a **marca**
«Ciclo NN · escola» no canto esquerdo era idêntica ao «Início» (o mesmo destino); (2) o
**«Início»** (índice geral do ciclo) repetia, em forma de sumário, quase todo o conteúdo do
«Plano» — só sobrava o «Como usar este pacote», que é informação técnica e **não precisa
existir**; (3) a página de entrada do sistema, «Nós, Por Exemplo», ainda não era a página que
abre o pacote. Decisão (11/10/2026): remover a marca, remover o «Início» por completo, e fazer
**«Nós, Por Exemplo» ser o `index.html`** — a página de entrada de todo pacote, igual para todos.

**O que foi decidido.**

- A **marca** sai do menu. Fica um **espaço reservado sem texto** (`.marca` vazio), para o menu
  não colar à esquerda; a largura mora no CSS e **some no celular** (para o hamburger não ser
  empurrado).
- O **«Início»** (o índice geral do ciclo) é **removido por completo** — do menu e do rodapé. O
  grupo «Ciclos» fica com «Plano» + «Referências»; num ciclo "do zero" (DOCS vazio), o grupo
  simplesmente **não aparece** (não fica um dropdown vazio).
- **«Nós, Por Exemplo» passa a ser o `index.html`.** O `index` deixa de resolver para
  `ciclo-XX-index.md` (per-ciclo) e passa a resolver para a página compartilhada
  `biblioteca/nos-por-exemplo.md` — como `guia-do-professor` e `metodo`. A fonte
  `ciclo-01-index.md` foi **apagada**.
- A página «Nós, Por Exemplo» foi **reescrita** com a estrutura planeada (6 blocos): por que
  surgiu → o que resolve → o que ganha → como se usa (anamnese → PO → coleta → origem da coleta)
  → o que a escola guarda ao longo do tempo (o fecho, sem a palavra «proveniência») → onde pedir
  ajuda. Em **português do Brasil**, vendendo a consequência, sem jargão.

**Onde entrou.** `tools/gerar-ciclo.sh` — `gerar_nav` (marca vazia, `"Nós, Por Exemplo|index"`,
fim do rótulo «Início»), `rodape_docs` (começa no Plano). `tools/lib-fontes.sh` — `fonte_md
"index"` → `biblioteca/nos-por-exemplo.md`. `tools/templates/ciclo.css` — `.marca` vira espaçador
(`min-width: 9em`, anulado no tablet). `biblioteca/nos-por-exemplo.md` — a página reescrita.
`professores/fokini/ciclos/ciclo-01-index.md` — **apagada**.

**Motivo declarado — os congelados.** `CONGELAMENTO.md` congela `tools/`, `tools/templates/` e
«estrutura de menu ou navegação». O motivo: o menu carregava duas duplicatas da mesma página (a
marca e o «Início», ambas apontando para o índice do ciclo), e o índice repetia o «Plano»; a
página de entrada do sistema («Nós, Por Exemplo») merecia ocupar o `index.html` — uma só entrada,
sem duplicata. **O que não muda:**

- **A fórmula do hash.** Não mudou. **A cobertura, sim**: `ciclo-01-index.md` **sai** da cobertura
  (era fonte de ciclo) e o `index` passa a resolver para `biblioteca/`, que o hasher **já exclui**
  por viver fora de `professores/<professor>/`. A âncora foi **regerada** (ver abaixo).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou; a mudança é de navegação e
  de onde a página de entrada vive.
- **Os validadores.** Nenhum mudou; o `check-pacote` já excluía `index.html` da comparação de
  títulos do PDF.

**Reancoragem.** A remoção de `ciclo-01-index.md` (fonte de ciclo) mudou o hash. Regereada com
`tools/hash-ciclo.sh fokini 01 diaghilev` e confirmada com `--check` (cadeia íntegra).

**Com o quê.** `tools/gerar-ciclo.sh`, `tools/lib-fontes.sh`, `tools/templates/ciclo.css`,
`biblioteca/nos-por-exemplo.md` (nova), `professores/fokini/ciclos/ciclo-01-index.md` (apagada),
`professores/fokini/ciclos/ciclo-01.conf`, `professores/fokini/ciclos/ciclo-01-diaghilev.conf`
(`nos-por-exemplo` sai do DOCS), e o pacote regenerado (`.fipp` reancoradas + HTML/PDF).

**Referências.** `CONGELAMENTO.md` («estrutura de menu ou navegação») · a entrada de 10/10/2026
(o menu separa a Anamnese do PO) · o pedido consolidado «Nós, Por Exemplo» (10 frentes) ·
`tools/lib-fontes.sh` (a regra do hasher: só caminhos sob `professores/`).

**O que ainda não está feito.**

- **`tools/criar-escola.sh` ainda não foi alinhado.** O nav do pacote "do zero" (`gerar_nav_zero`)
  continua com a marca «Ciclo NN · escola» e o item «Início», e o `index.html` zero ainda é o
  «cartão de visita» (e não a página «Nós, Por Exemplo»). Falta decidir: o pacote zero abre em
  «Nós, Por Exemplo» (como o pacote cheio) ou mantém o cartão de visita de ciclo em construção?
- **Frentes do pedido ainda em aberto:** vídeos embutidos (F2), documento de fundamentação (F4),
  correção socrática (F5 — infraestrutura, prudência), item de menu «Bastidores» (F10).
- **Nada foi commitado** deste marco (aguardando validação da pesquisadora).

## 11/10/2026 — Atalhos da porta na página de entrada e aprofundamento do «Como se usa»

**O que motivou.** A página de entrada «Nós, Por Exemplo» tinha dois problemas de leitura: o
bloco «Como se usa, passo a passo» era abstrato (o professor não sabia **onde clicar** nem o que
ia encontrar), e os blocos de abertura traziam redação ainda não finalizada («coisa», a régua
das alunas, menção a protocolos ainda por construir).

**O que foi decidido.**

- **«O que é este sistema» reescrito** em três parágrafos (o que faz → o que permite → o que faz
  com o conhecimento), com a distinção repertório × arquivo, sem «coisa», sem jargão.
- **A passagem da «régua alta» corrigida:** a régua é do **serviço prestado** (dedicação, cuidado,
  o que a escola oferece), não das alunas. «A dança é para todas» ficou explícito. Saíram
  «régua», «qualidade» e «métrica».
- **«Como se usa, passo a passo» aprofundado:** passos numerados (Passo 1 a 4), contexto do que é
  um **ciclo** (nasce do Plano de Observação; dentro dele há aulas; cada aula tem seu registro), a
  lista do que mais existe na Área do Professor (caderno, captura, critérios, método, guia) e a
  nota de que a página é o mapa e o detalhe está dentro de cada formulário.
- **Dois atalhos com link** para a porta — «Anamnese do aluno» e «Plano de Observação» — com as
  URLs carregando os slugs do ciclo. Como o pandoc **não interpola variáveis no corpo** do
  documento, a página usa os marcadores `@ANAMNESE_URL@` e `@PO_URL@`, trocados pelo gerador
  **só no `index`**.

**Onde entrou.** `biblioteca/nos-por-exemplo.md` — os três blocos reescritos/aprofundados e os
dois marcadores de link. `tools/gerar-ciclo.sh` — a substituição `@ANAMNESE_URL@`/`@PO_URL@`
após o pandoc do `index`. `tools/criar-escola.sh` — a mesma substituição no índice do pacote
"zero" (que também renderiza `nos-por-exemplo.md`), com URL relativa à pasta do pacote.

**Motivo declarado — os congelados.** `CONGELAMENTO.md` congela `tools/`. O motivo: os dois
atalhos da página de entrada precisam levar o contexto do ciclo (`professor`, `escola`, `ciclo`)
na URL da porta, e esse contexto só existe no gerador — não dá para gravar slugs fixos na página
compartilhada (cada pacote tem o seu). **O que não muda:**

- **A fórmula do hash e a cobertura.** Não mudou; a página de entrada vive em `biblioteca/`, que
  o hasher já exclui, e nenhuma fonte de ciclo foi alterada. A âncora **não** foi regerada (o
  `--check` confirma a cadeia íntegra com o mesmo hash de antes).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou.
- **Os validadores.** Nenhum mudou; o `check-pacote` continua passando com 0 erros.

**Com o quê.** `biblioteca/nos-por-exemplo.md`, `tools/gerar-ciclo.sh`,
`tools/criar-escola.sh`, e o pacote `professores/fokini/ciclos/ciclo-01-diaghilev/` regenerado.

**Referências.** `CONGELAMENTO.md` (`tools/`) · a entrada de 11/10/2026 (o `index` →
«Nós, Por Exemplo») · o pedido «Ajustes finais na página» e o pedido «Aprofundar o bloco
«Como se usa, passo a passo»».

**O que ainda não está feito.**

- **O pacote `fokini2/02/diaghilev2` está com o `index.html` defasado** (ainda mostra o «cartão de
  visita» antigo, não a página «Nós, Por Exemplo»). É anterior a este marco — o `criar-escola.sh`
  já renderiza `nos-por-exemplo.md`, mas o pacote não foi regerado. Regerar exige rodar o
  `criar-escola.sh` (que cria uma escola nova), e não o `gerar-ciclo.sh` (que falha com `DOCS=""`).
- **Nada foi commitado** deste marco (aguardando validação da pesquisadora).

## 11/10/2026 — URLs próprias para a Anamnese e o Plano de Observação

**O que motivou.**
Os dois itens do menu «Área do Professor» — «Anamnese do aluno» e «Plano de Observação» —
apontavam para a mesma base `/plano-observacao/`, distinguidos só pelo `&fonte=po`. Para quem
lê a barra de endereço, os dois pareciam a mesma URL — e cada fonte precisa da sua.

**O que foi decidido.**
- «Anamnese do aluno» → `/anamnese/` (a anamnese é a fonte padrão da porta).
- «Plano de Observação» → `/plano-observacao/?fonte=po`.
- O «Plano do ciclo» continua interno — entra pelo botão «Fazer o plano», sem URL própria no menu.
- A PORTA continua sendo UM subdiretório do ASSETS (`plano-observacao/`); o que muda é o caminho
  que o professor digita — o Worker de produção reconhece os dois prefixos e serve a mesma porta.

**Onde entrou.**
`motor/servidor/producao.js` — o segundo prefixo `/anamnese`. `porta/index.html` — `urlParaFonte`
e o atalho «criar a anamnese» passam a produzir a URL da própria fonte. `tools/gerar-ciclo.sh` —
`ANAMNESE_URL` e `PO_URL`.

**Motivo declarado — os congelados.**
`CONGELAMENTO.md` congela `tools/`. O motivo: os dois atalhos do menu e da página de entrada
usam variáveis que só o gerador conhece (`ANAMNESE_URL`, `PO_URL`), e dar uma URL própria a cada
fonte exige trocá-las. **O que não muda:**

- **A fórmula do hash e a cobertura.** Nada muda; nenhuma fonte de ciclo é alterada, e a âncora
  **não** é regerada.
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou.
- **Os validadores.** Nenhum mudou; o `check-pacote` continua passando.

**Com o quê.**
`tools/gerar-ciclo.sh`, `motor/servidor/producao.js`, `porta/index.html`, e os pacotes
`professores/fokini2/ciclos/ciclo-02-diaghilev2/` e `professores/fokini/ciclos/ciclo-01-diaghilev/`
regenerados com as novas URLs.

**Referências.**
`CONGELAMENTO.md` (`tools/`) · o pedido «a URL da anamnese é a mesma do PO».

**O que ainda não está feito.**
- A marcação de «ativo» na barra de navegação da porta é estática (gerada com
  `atual=plano-observacao`): ao abrir `/anamnese/`, a barra ainda destaca «Plano de Observação».
  O título da página (H1) já distingue as duas — só a marcação do item de menu é que fica a dever.

## 11/10/2026 — As sete mudanças de comportamento e a proveniência condicional

**O que motivou.**
A pesquisadora definiu, depois de ver o fluxo dos Bastidores, sete precisões de comportamento
(o campo `aluna` como lista; o botão «criar senha»; a gestão de senhas na Produção; a senha do
administrador no `criar-escola.sh`; o hook de expurgo das escolas desabilitadas; o domínio raiz
com senha; e a criação de nova senha na Produção) — mais dois andaimes temporários (o mock de
alunas com nascimento e o mock de escola habilitada/desabilitada).

**O que foi decidido.**
- As sete mudanças são **plano** — incorporadas ao `IDEIA-PAINEL-ESCOLA.md` §17, **nada
  implementado** nesta rodada.
- A **proveniência passa de absoluta a condicional**: a garantia de P-03/P-04 vale **para escolas
  habilitadas**; uma escola desabilitada pode ser **apagada** depois do prazo de expurgo. É uma
  inversão de norma, registrada como **ressalva de escopo** no `PROTOCOLO.md` (após a P-04).
- Os dois andaimes (mock de alunas e mock de habilitação) são **temporários, declarados como tal**,
  com prazo e data para sair quando a Produção nascer.
- **Norma da limpeza no ambiente de desenvolvimento.** Quando uma escola é expurgada no servidor,
  **tudo o que diz respeito àquela escola é limpo no ambiente de desenvolvimento** — na próxima
  sincronização com o GitHub. O critério é o **slug da escola**; limpa-se **a senha**
  (`tools/.senhas-locais`), os ficheiros locais e qualquer resíduo que carregue o slug. **Antes de
  apagar, verificar que a escola não está a pagar.** Registrada em `PROTOCOLO.md`.
- **Índice por escola (andaime).** O `criar-escola.sh` passa a gerar `escola/<escola>/indice.json`
  — slug, data de criação, ficheiros criados, **referência** à senha (a chave, nunca o valor) e
  estado inicial. O hook de expurgo lê o índice e limpa **por checklist** (verifica cada entrada,
  apaga o que existe, regista o que não foi), verificando primeiro o pagamento. **O índice
  sobrevive ao expurgo** — é a lápide, o elo que prova o que foi criado e por que foi apagado, e é
  o que mantém o expurgo coerente com «a proveniência acrescenta, não edita» (P-03/P-04). É
  andaime até a Produção o gerar.

**Onde entrou.**
`IDEIA-PAINEL-ESCOLA.md` — §17 (as sete mudanças + os dois andaimes + a norma da limpeza + o
índice por escola) e §16 (novos itens em aberto). `PROTOCOLO.md` — a ressalva de escopo da
proveniência condicional + a norma da limpeza (agora por checklist, com o índice como exceção que
sobrevive).

**Motivo declarado — os congelados.**
`CONGELAMENTO.md` congela `PROTOCOLO.md` e `tools/`. O motivo: a regra da proveniência condicional
(e a norma da limpeza por checklist que a completa, com o índice como elo que sobrevive) é uma
**inversão de norma** que precisa ficar explícita no documento que guarda as pétreas; e o índice
nasce no `tools/criar-escola.sh` (congelado). Nada foi implementado — os dois são **declaração**,
com o descongelamento a exigir o seu próprio rito. **O que não muda:**

- **As 22 pétreas.** Nenhuma foi alterada nem renumerada; a ressalva é uma **nota de escopo**
  anexada à P-04, não uma pétrea nova.
- **A fórmula do hash e a cobertura.** Nada muda; nenhuma fonte de ciclo é alterada, e a âncora
  **não** é regerada.
- **Os validadores e o `check-pacote`.** Nenhum mudou.
- **As regras e os demais congelados.** `tools/`, `prompts/`, `REGRAS.md`, `METODO.md` intocados.

**Com o quê.**
`PROTOCOLO.md`, `IDEIA-PAINEL-ESCOLA.md`.

**Referências.**
`CONGELAMENTO.md` (congela `PROTOCOLO.md` e `tools/`) · o pedido «Senhas, hook de expurgo e o
domínio raiz» + as quatro extensões (mock de alunas com nascimento, mock de escola
habilitada/desabilitada, a norma da limpeza no ambiente de desenvolvimento, e o índice por
escola) · `IDEIA-PAINEL-ESCOLA.md` §10/§11.

**O que ainda não está feito.**
- **Nada foi implementado** — as sete mudanças são plano; os dois andaimes, a norma da limpeza e o
  índice por escola são declaração, não arquivos/scripts criados.
- **Nada foi commitado** — este marco (e o descongelamento de `PROTOCOLO.md` + `tools/criar-escola.sh`)
  exige commit próprio com o motivo declarado, aguardando validação da pesquisadora.
- **A limpeza não tem script nem hook.** O ponto natural é o `post-merge` (não existe hoje) ou um
  script próprio rodado após a sincronização — nada foi criado; a norma só declara o dever e o
  critério (slug + verificação «não está a pagar»).
- **O índice não é gerado.** O `tools/criar-escola.sh` ainda não escreve `escola/<escola>/indice.json`
  — a geração é declaração; o formato (slug, `criado_em`, professor, senha como chave, estado
  inicial, `arquivos[]`) está proposto no `IDEIA-PAINEL-ESCOLA.md` §17.5, mas o script é congelado
  e não foi tocado.
- **Quais congelados descongelam na implementação** — `tools/lib-senhas.sh` (senha por professor +
  administrador) e `tools/criar-escola.sh` (senha do administrador no nascimento) estão sob
  `tools/` (congelado). `workers/` **não está congelado** — o Cron Trigger e a senha do domínio
  raiz entram sem o rito dos congelados. Cada um entra com o seu próprio motivo/commit.

## 11/10/2026 — Ordem alfabética nos menus e rótulo da harmonização

**O que motivou.**
No menu «Área do Professor», a «Anamnese do aluno» (que começa com A) era o último item, e a
«Harmonização» saía com o rótulo vazio — a fonte derivada não tinha `title:` no front-matter. A
pesquisadora pediu ordem alfabética em **todos** os menus, e que o rótulo da harmonização
deixasse de sair vazio.

**O que foi decidido.**
- Os itens de cada grupo do menu passam a ser **ordenados pelo rótulo**, com acento e caixa
  normalizados antes da comparação (o `iconv` + `LC_ALL=C`); os itens externos (o PO e a
  anamnese) entram na **mesma** ordenação, não mais fixos no fim do grupo.
- A harmonização passa a nascer com `title:` (e `subtitle:`) no derivador, e o `rotulo()` ganha
  um caso de esteio para o documento — como o `metodo` já tinha.
- A barra de contexto da porta deixa de ser `sticky` e os campos ficam num acordeão
  (`<details>`); a marcação de «ativo» na nav passa a ser corrigida pelo caminho da URL
  (`/anamnese/` vs `/plano-observacao/`).

**Onde entrou.**
`tools/gerar-ciclo.sh` — `gerar_nav` ordena por rótulo; `rotulo()` com o caso `harmonizacao`.
`tools/criar-escola.sh` — `gerar_nav_zero` em ordem alfabética (anamnese antes do PO).
`motor/nucleo/derivar-ciclo.js` — o `derivarHarmonizacao` emite `title:`/`subtitle:`.
`porta/index.html` — `.barra` recolhível e não-grudada; `marcarAtivoDaPorta()`.

**Motivo declarado — os congelados.**
`CONGELAMENTO.md` congela `tools/` e exige motivo para «alterar a estrutura de menu ou
navegação». O motivo: a ordem alfabética é uma decisão de navegação que só o gerador conhece
(`gerar_nav`/`gerar_nav_zero`), e a correção do rótulo vazio exige o caso em `rotulo()` — ambos
vivem em `tools/`. **O que não muda:**

- **A fórmula do hash e a cobertura.** Nada muda; nenhuma fonte de ciclo é alterada por ESTA
  mudança (a âncora só foi regerada porque os títulos da harmonização — que são fonte — mudaram
  no mesmo pacote).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou.
- **Os validadores.** Nenhum mudou; o `check-pacote` continua passando.

**Com o quê.**
`tools/gerar-ciclo.sh`, `tools/criar-escola.sh`, `motor/nucleo/derivar-ciclo.js`,
`porta/index.html`, e os pacotes regenerados de `fokini/01/diaghilev` e
`fokini2/02/diaghilev2` (com a reancoragem correspondente).

**Referências.**
`CONGELAMENTO.md` (`tools/`, «alterar a estrutura de menu ou navegação») · o pedido «ordem
alfabética nos menus, barra recolhível e destaque correto no menu».

**O que ainda não está feito.**
- O `criar-escola.sh` continua sendo o único lugar com o nav «zero» duplicado; a ordenação foi
  alinhada, mas o nav mínimo ainda não é gerado pelo `gerar_nav` (sem DOCS ele não roda).

## 12/10/2026 — O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica sempre habilitada

**O que motivou.**
O texto «Nós, Por Exemplo» estava escrito em mais de um lugar: a fonte
`biblioteca/nos-por-exemplo.md` (que os ciclos já renderizavam via pandoc) e a página raiz
`raiz/index.html` (HTML à mão, sem os atalhos de link). Além disso, o Worker raiz (`danca`) foi
encontrado no ar servindo «Escola desabilitada» — porque o script implantado era o
`workers/principal.js` (a ponte das escolas, com o freio `ESCOLA_HABILITADA`), não o
`workers/raiz.js` (a ponte da raiz, que não tem freio).

**O que foi decidido.**
- O texto «Nós, Por Exemplo» passa a ter **fonte única** em `biblioteca/nos-por-exemplo.md`; a
  raiz e os `index.html` dos ciclos são **cópias** dela, replicadas por gerador. O texto não tem
  lastro nem vínculo com dados — é material de apresentação, **sem proveniência** (não entra em
  `.fipp`, não reancora).
- A única diferença entre a raiz e os ciclos é o link: a raiz **não tem links** (as linhas
  «Acessar …» saem), os ciclos têm (os marcadores `@ANAMNESE_URL@`/`@PO_URL@` viram link).
- A raiz (`danca`) **fica sempre habilitada**: não é escola, não tem `ESCOLA_HABILITADA`, e o
  freio de desabilitação nunca a toca. O código já funcionava assim; o incidente foi de deploy
  (script errado), não de lógica.

**Onde entrou.**
`tools/gerar-raiz.sh` — regera o corpo de `raiz/index.html` a partir da fonte, sem links.
`tools/check-nos-por-exemplo.js` — valida que toda página «Nós» (raiz + ciclos) é fiel à fonte.
`biblioteca/nos-por-exemplo.md` — fonte única; o link interno do «Onde pedir ajuda» saiu (a prosa
não tem mais links; só os atalhos «Acessar …» que os ciclos convertem).

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo para novo gerador/validador. O motivo: a deriva do texto
«Nós, Por Exemplo» era silenciosa (o ciclo `maria` ficou com a redação antiga sem aviso), e o
padrão do projeto para divergência silenciosa é **fonte única + cópia replicada + validador**
(o precedente é `tools/check-identidade.js` para o CSS). **O que não muda:**

- **A fórmula do hash e a cobertura.** Nada muda; nenhuma fonte de ciclo é alterada por esta
  mudança (a fonte da entrada é `biblioteca/nos-por-exemplo.md`, que **não** é fonte de ciclo —
  o `fonte_md index` a lê como material do sistema, fora do `.fipp`).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhuma mudou.
- **Os validadores existentes.** Nenhum mudou; o `check-pacote` continua passando.

**Com o quê.**
`tools/gerar-raiz.sh`, `tools/check-nos-por-exemplo.js`, `biblioteca/nos-por-exemplo.md`,
`raiz/index.html` (regenerado), e os pacotes de `fokini/01/diaghilev`, `fokini2/02/diaghilev2`
e `tiago/01/maria` (regenerados; o `maria` saiu da redação antiga).

**Referências.**
`CONGELAMENTO.md` (`tools/`) · `tools/check-identidade.js` (o precedente de fonte única + cópia
replicada + validador) · o pedido «texto do Nós, Por Exemplo num lugar só, replicado em todos».

**O que ainda não está feito.**
- O `tools/check-nos-por-exemplo.js` **não está ligado a nenhum hook** (não entrou no
  `pre-commit`, que é congelado). Ele roda manualmente; a deriva só é pega quando alguém o roda.
- A regeneração do `maria` (escola «zero», sem `DOCS`) continua manual — não há um caminho
  reproduzível equivalente ao `gerar-ciclo.sh` para o pacote zero; o `criar-escola.sh` só gera o
  índice no nascimento da escola, não numa atualização.
- O deploy da raiz continua manual (`npx wrangler deploy -c wrangler.danca.jsonc`); não há
  automação de deploy para o Worker `danca`.

## 12/10/2026 — O plano de ensino vira rota própria e o PO passa a puxar os dois

**O que motivou.** A porta servia três fontes, mas o menu da Área do Professor expunha só duas
(anamnese e PO); o plano entrava pelo PO, e a pesquisadora leu isso como «dois botões que fazem
a mesma coisa». Na verificação, confirmou-se que plano (Blocos 1–4) e PO (Blocos 5–9) são dois
artefatos distintos, mas que a nomenclatura («Fazer o plano» × «Fazer o Plano de Observação»)
era ambígua — e que os campos das alunas estavam **duplicados** entre os dois (o `alunas` do
plano e o `sujeitos` do PO puxavam a mesma lista da anamnese).

**O que foi decidido.**
- O plano de ensino vira uma fonte **agnóstica à turma**: perde `alunas`, `alunas-o-que-sabem` e
  `alunas-dificuldades` (a lista de alunas e a linha de base individuais vivem na anamnese e
  entram pelo PO).
- O PO é o **ponto de encontro**: puxa os dois — a anamnese (nos `sujeitos`) e o plano de ensino
  (na semeadura de contexto). A anamnese deixa de ser puxada pelo plano.
- O plano de ensino ganha rota própria (`/plano-ensino/`) e item de menu, no mesmo nível da
  anamnese e do PO.
- A semeadura plano→PO passa a ler o **envelope salvo** (não o rascunho do navegador, que some
  quando o plano é gravado).
- A seção de alunas sai do `-plano.md`; o grupo continua em `contexto-turma`, que se prepara para
  virar entidade estruturada (lista de turmas no Bastidores) quando o reaproveitamento de plano
  entre turmas for construído.

**Onde entrou.**
`porta/plano/conteudo/plano.json` — o bloco «Alunas» saiu.
`porta/index.html` — rota `/plano-ensino/`, portal do plano, sem o botão «Fazer o plano» no PO, e
semeadura assíncrona do envelope salvo.
`motor/nucleo/derivar-plano-ciclo.js` — a seção «Alunas» saiu do `-plano.md`.
`motor/servidor/producao.js` — a rota `/plano-ensino/` (terceiro prefixo da porta).
`tools/gerar-ciclo.sh` — o item «Plano de ensino» no menu (congelado).

**Motivo declarado — os congelados.**
`tools/` é congelado. O motivo para tocar `tools/gerar-ciclo.sh`: o menu da Área do Professor é
gerado por `gerar_nav`, e o plano de ensino deixou de ser interno ao PO para virar item próprio —
sem este ajuste a rota `/plano-ensino/` existiria no Worker mas não apareceria no menu.
**O que não muda:**

- **A fórmula do hash e a cobertura.** Nenhuma fonte de ciclo mudou por este ajuste de menu.
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhum mudou.
- **Os validadores existentes.** Nenhum mudou.

**Com o quê.**
`porta/plano/conteudo/plano.json`, `porta/index.html`, `motor/nucleo/derivar-plano-ciclo.js`,
`motor/servidor/producao.js`, `tools/gerar-ciclo.sh`, e o pacote de `tiago/01/maria` (propagado
manualmente: o `gerar-ciclo.sh` ainda não regenera escola sem `aula-*` no DOCS).

**Referências.**
`prompts/elicitar-ciclo.md` (Blocos 1–4 = plano; 5–9 = PO; «o contexto e as alunas alimentam os
dois») · `REGRAS.md` (Regra 10) · `CONGELAMENTO.md` (`tools/`).

**O que ainda não está feito.**
- As sugestões cruzadas objetivo→marcos→rubrica→dimensões ficaram para a leva seguinte (camada D).
- `restrições` (P-22) e `flutuantes` ainda não derivam da anamnese — a anamnese não tem esses
  campos; exige esquema novo.
- A lista de turmas no Bastidores (reaproveitar o plano entre turmas) é preparação, não
  implementação.
- O `gerar-ciclo.sh` ainda não regenera uma escola «zero» (sem `aula-*` no DOCS); a propagação do
  `maria` foi manual.

## 12/10/2026 — O plano de ensino ganha estante, edição em sítio e derivação (a regra da anamnese)

**O que motivou.** Com o plano de ensino dissociado do PO e da anamnese, a pesquisadora quis
reaproveitar planos já elaborados — «aninhar» um plano noutro, fazendo ajustes, sem nunca
editar o que já foi usado. A regra de proveniência da anamnese (solta edita em sítio; vinculada
vira elo novo) tinha de valer para o plano, e o PO tinha de saber qual plano ele observa.

**O que foi decidido.**
- **Estante de planos** (`/api/planos`): cada plano é listado com o **objetivo-geral como
  resumo** e o estado (solta / legado / vinculada).
- **A regra espelha a anamnese.** Solta → edita em sítio (o mesmo id, sem elo). Vinculada a um
  PO → não se reescreve: vira elo novo (`ajuste_de` + `motivo`). Derivar de um plano qualquer →
  elo novo. O estado «legado» é o plano que um sucessor ajustou (`ajuste_de` aponta para ele).
- **O PO referencia o plano** no nó `plano-de-ensino` (o id do envelope), com seletor na
  estante (Opção 1) — o vínculo plano→PO passa a ser derivável, e o gerador usa o plano
  referenciado (não mais «o mais recente do contexto»).
- Sem `derivado_de` novo: reusa-se o `ajuste_de` já existente no envelope para o «aninhar».

**Onde entrou.**
`motor/nucleo/porta.js` — `planos`, `vinculosDePlano`, `estadosDosPlanos`, `estadoDoPlano`,
`valorDe`, e o ramo `fonte === 'plano'` do `elicitar` (editar/derivar).
`motor/servidor/rotas.js` — `/api/planos`, `/api/plano-estados`, e a resolução do plano no
`/api/elicitar` (pelo id referenciado, com fallback por contexto).
`porta/po/conteudo/po.json` — o nó `plano-de-ensino` no cabeçalho (seletor, obrigatório).
`porta/index.html` — estante do plano (selo + editar/derivar), seleção única (`opcoesDe` vira
rádio quando não é `multipla`), e o envio de `ajuste_de`/`motivo`.

**Com o quê.**
`motor/nucleo/porta.js`, `motor/servidor/rotas.js`, `porta/po/conteudo/po.json`,
`porta/index.html`, e o pacote de `tiago/01/maria` (propagado manualmente).

**Referências.**
A regra da anamnese (`vinculos`, `estadosDasAnamneses`, `ajuste_de` em `porta.js`) ·
`prompts/elicitar-ciclo.md` (o plano e o PO são dois artefatos; o PO observa o plano).

**O que ainda não está feito.**
- A semeadura de contexto do PO lê o plano **mais recente**, não o plano que o professor
  **seleciona** no `plano-de-ensino` — a coerência (semear do plano escolhido) fica para a
  camada D.
- O rótulo da estante usa o `objetivo-geral` inteiro (pode ser longo); truncar ou dar um
  «nome curto» é decisão posterior.
- O `gerar-ciclo.sh` ainda não regenera uma escola «zero»; a propagação do `maria` foi manual.

## 12/10/2026 — A arquitetura geral ganha documento próprio (arquivo, não banco)

**O que motivou.** A pesquisadora quis um material de apresentação técnica que explique, para um
programador, por que a fonte de verdade do Projeto Ciclo é o sistema de arquivos (Git) e não um
backend com banco de dados — e por que isso é mais barato e mais rápido.

**O que foi decidido.**
- Criar o `ARQUITETURA-GERAL.md`, raiz, como a visão de conjunto: o mapa de componentes, o
  desenho de fluxo (elicitação → Git → geração → CDN), e a argumentação «arquivo, não banco»
  (proveniência é história; imutabilidade é estrutural; build no lugar de runtime; KV só como
  cofre de runtime que volta a ser arquivo).
- O documento reforça a identidade: é do protótipo testado na dança (não agnóstico), e a
  «proveniência» é a âncora encadeada `.fipp`, não o FIPP do mestrado.

**Onde entrou.**
`ARQUITETURA-GERAL.md` — novo documento raiz, irmão dos `ARQUITETURA-*.md` existentes.

**Com o quê.**
`ARQUITETURA-GERAL.md`, `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` («novos documentos» são livres) · os demais `ARQUITETURA-*.md` (captura, aula,
anamnese) · `IDEIA-PAINEL-ESCOLA.md`.

**O que ainda não está feito.**
- Nada pendente — é documentação; o conteúdo técnico cita o desenho já vigente.

> **Correção de 12/10/2026 (mesmo dia).** A primeira redação citava, na tabela de
> componentes, o Worker por escola como `workers/receber.js` / `motor/servidor/cloudflare.js`.
> **Está errado**: o entry do Worker por escola é `workers/principal.js` (o shim ESM) e a ponte é
> `motor/servidor/producao.js` — é o que os `wrangler.jsonc` de `diaghilev`, `diaghilev2` e
> `maria` declaram em `main`. A linha foi corrigida em 12/10/2026. A versão anterior não é
> apagada: fica como o elo que registra o que se pensou antes da correção.

## 12/10/2026 — O botão «Criar nova escola» alinha o menu da Área do Professor ao plano de ensino

**O que motivou.** O menu da Área do Professor passou a ter três itens (anamnese, plano de ensino,
PO) — mas o botão «Criar nova escola» (a raiz) gera a escola nova por `provisionar-escola.js`
(`scriptDaEscola`), um caminho DIFERENTE do `gerar-ciclo.sh`. Ele ficou com só dois itens
(anamnese e PO) e sem a rota `/plano-ensino/`.

**O que foi decidido.**
- O `scriptDaEscola` (o mock que a escola nova roda ao nascer) passa a listar os TRÊS itens na
  Área do Professor, na ordem alfabética: Anamnese do aluno · Plano de ensino · Plano de
  Observação.
- O dispatch do mock passa a servir `/plano-ensino/` (como já servia `/plano-observacao/` e
  `/anamnese/`).
- O `placeholderMotor` passa a rotular «Plano de ensino» (antes caía no padrão «Plano de
  Observação»).
- O aviso da área desabilitada cita os três, não só PO + anamnese.

**Onde entrou.**
`motor/servidor/provisionar-escola.js` — `pagina()` (menu), `placeholderMotor()` (rótulo) e o
dispatch (`/plano-ensino/`).

**Com o quê.**
`motor/servidor/provisionar-escola.js`, `REGISTRO.md`.

**Referências.**
A entrada anterior «o plano de ensino vira rota própria» (que mudou `tools/gerar-ciclo.sh` e o
menu do site) · `CONGELAMENTO.md` (`motor/` é livre).

**O que ainda não está feito.**
- O CLI `tools/criar-escola.sh` tem a MESMA deriva: o seu `gerar_nav_zero` lista só anamnese e PO
  (sem plano de ensino). É congelado (`tools/`) e exige motivo declarado + commit próprio.

## 12/10/2026 — O CLI «criar-escola» alinha o menu zero ao plano de ensino

**O que motivou.** O menu do ciclo «zero» gerado pelo CLI `tools/criar-escola.sh` (`gerar_nav_zero`)
listava só anamnese e PO — a mesma deriva do botão «Criar nova escola» (já corrigido em
`provisionar-escola.js`). Faltava o «Plano de ensino», que passou a ser rota e item próprios.

**O que foi decidido.**
- O `gerar_nav_zero` passa a listar os TRÊS itens da Área do Professor, na ordem alfabética:
  Anamnese do aluno · Plano de ensino · Plano de Observação (a mesma ordem do `gerar_nav` do
  `gerar-ciclo.sh`).

**Onde entrou.**
`tools/criar-escola.sh` — `gerar_nav_zero()` (o item «Plano de ensino» entrou no submenu).

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo para alteração. O motivo: o menu do ciclo «zero» ficou com uma
deriva em relação ao menu do site — o «Plano de ensino» virou rota/item próprio, mas o
`gerar_nav_zero` (que não passa pelo `gerar_nav` do `gerar-ciclo.sh`) continuou com dois itens.
**O que não muda:**

- **A fórmula do hash e a cobertura.** Nenhuma fonte de ciclo muda; o `gerar_nav_zero` escreve só
  o nav do pacote «zero» (que não é fonte do `.fipp`).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhum mudou.
- **Os validadores existentes.** Nenhum mudou.

**Com o quê.**
`tools/criar-escola.sh`, `REGISTRO.md`.

**Referências.**
`CONGELAMENTO.md` (`tools/`) · a entrada anterior «o plano de ensino vira rota própria».

**O que ainda não está feito.**
- A página de entrada (`biblioteca/nos-por-exemplo.md`) descreve o fluxo como «Passo 1 —
  Anamnese» → «Passo 2 — Plano de Observação», **sem o Plano de ensino** — e os dois atalhos
  (`@ANAMNESE_URL@`/`@PO_URL@`) não têm o par do plano. É arquivo livre, mas muda a prosa do
  «Nós, Por Exemplo» (e a `raiz/index.html` derivada) — decisão da pesquisadora.
- O `RODAPE_ZERO` do índice zero continua apontando só para o PO (um link de rodapé, não o menu).

## 12/10/2026 — A página de entrada ganha o «Plano de ensino»

**O que motivou.** O «Plano de ensino» virou artefato próprio (rota, menu, estante e seletor no
PO), mas a página de entrada «Nós, Por Exemplo» continuava com o fluxo em quatro passos sem ele —
«Passo 1 — Anamnese» → «Passo 2 — Plano de Observação» → «Passo 3 — Lançamento» → «Passo 4 —
Consulte». A deriva era a mesma que já tinha sido corrigida no menu do site, no botão «Criar nova
escola» e no CLI `criar-escola.sh`: a página contava uma história em que o plano não existia.

**O que foi decidido.**
- A página passa a ter CINCO passos, com o «Passo 2 — Plano de ensino» entre a anamnese e o PO,
  e o lançamento/consulta renumerados para 4 e 5.
- O novo passo fixa a posição do plano na cadeia: a anamnese dá o ponto de partida; o plano de
  ensino fixa a intenção; o PO lê essa intenção como pergunta. Reforça que o plano é reaproveitável
  e ajustável sem apagar o anterior.
- Entra o atalho `@PLANO_URL@` ao lado de `@ANAMNESE_URL@`/`@PO_URL@` — e a prosa do Passo 3 (PO)
  passa a citar o plano de ensino (não só a anamnese) como referência de partida.
- A lista da «Área do Professor» no Passo 5 cita o Plano de ensino (antes só PO + anamnese).

**Onde entrou.**
`biblioteca/nos-por-exemplo.md` — Passo 2 novo, renumeração, atalho `@PLANO_URL@`, prosa do PO,
lista da Área do Professor. É a fonte única; `raiz/index.html` e os `index.html` dos pacotes são
regerados dela.

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo. O motivo: o marcador `@PLANO_URL@` não existia — o gerador
(`gerar-ciclo.sh`), o CLI do ciclo zero (`criar-escola.sh`) e o validador de deriva
(`check-nos-por-exemplo.js`) precisavam saber que a página agora tem TRÊS atalhos e um passo novo.
**O que não muda:**

- **A fórmula do hash e a cobertura.** `biblioteca/nos-por-exemplo.md` não é fonte de `.fipp`;
  nenhum `.md`/`.conf` de ciclo muda; nenhuma reancoragem é necessária.
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhum mudou.
- **Os demais validadores.** Só o `check-nos-por-exemplo.js` ganha a normalização do atalho novo
  (que é a ÚNICA trava da deriva da página de entrada, como já fazia com anamnese e PO).

**Com o quê.**
`biblioteca/nos-por-exemplo.md`, `raiz/index.html`, `tools/gerar-ciclo.sh`,
`tools/criar-escola.sh`, `tools/check-nos-por-exemplo.js`, `REGISTRO.md`, e os pacotes regerados
`professores/fokini/ciclos/ciclo-01-diaghilev/`, `professores/fokini2/ciclos/ciclo-02-diaghilev2/`
e `professores/tiago/ciclos/ciclo-01-maria/index.html`.

**Referências.**
`CONGELAMENTO.md` (`tools/`) · a entrada anterior «o plano de ensino vira rota própria» · a entrada
«O CLI «criar-escola» alinha o menu zero ao plano de ensino» (que deixou a página de entrada como
pendência).

**O que ainda não está feito.**
- O pacote «zero» da Maria não regenera por `gerar-ciclo.sh` (DOCS="plano", sem `aula-*`) — o
  `index.html` foi propagado manualmente (precedente `95db237`); a rota `/plano-ensino/` é servida
  pelo Worker, não por arquivo estático.
- O `RODAPE_ZERO` do índice zero continua apontando só para o PO (link de rodapé, não o menu).
- `semearDoPlano()` ainda semeia pelo plano «mais recente», não pelo que o professor SELECIONOU no
  nó `plano-de-ensino` (camada D).

## 12/10/2026 — A raiz nunca é desabilitada pelo freio de escola

**O que motivou.** O domínio raiz (`danca.tmenegaz77.workers.dev`) voltou a aparecer como
«Escola desabilitada» depois de alguns minutos. A causa já era conhecida: o freio de escola
(`ESCOLA_HABILITADA`) vive em `producao.js` (e em `cloudflare.js`), e o código da raiz
(`raiz.js`) não tem freio — mas quando a ponte de produção era implantada no Worker `danca` por
engano, a flag ausente (a raiz não é escola) casava com `!== 'sim'` e desligava tudo. O incidente
era de deploy, mas a leitura de «ausente = desligada» deixava a raiz vulnerável a reincidir a
cada deploy errado.

**O que foi decidido.**
- O freio passa a ser **explícito**: só `ESCOLA_HABILITADA === 'nao'` desliga. A ausência da
  flag (a raiz, que não é escola) **não** desliga — a raiz fica sempre ligada, mesmo que a ponte
  de produção seja implantada nela por engano.
- Todas as escolas já declaram a flag explicitamente (`diaghilev` = "nao"; `diaghilev2`, `maria`
  = "sim"; `diaghilev-ia-stub` = "nao"), então nenhuma escola muda de comportamento: o freio
  continua desligando só o que foi explicitamente desligado.

**Onde entrou.**
`motor/servidor/producao.js` — o freio passa de `!== 'sim'` para `=== 'nao'` (e o comentário).
`motor/servidor/cloudflare.js` — `freioDaEscola()` passa de «só 'sim' libera» para «só 'nao'
desliga».
`motor/servidor/provisionar-escola.js` — o mesmo freio no script inline das escolas novas.

**Com o quê.**
`motor/servidor/producao.js`, `motor/servidor/cloudflare.js`,
`motor/servidor/provisionar-escola.js`, `REGISTRO.md`.

**Referências.**
A entrada anterior «O «Nós, Por Exemplo» passa a ter fonte única e a raiz fica sempre habilitada»
(que já decidia «a raiz fica sempre habilitada», mas só no `raiz.js`) · `CONGELAMENTO.md`
(`motor/` é livre).

**O que ainda não está feito.**
- O deploy das escolas (`diaghilev`, `diaghilev2`, `maria`, `diaghilev-ia-stub`) precisa subir o
  `producao.js`/`cloudflare.js` novo para o freio explícito ficar de fato no ar — o comportamento
  delas não muda (todas declaram a flag), mas o bundle fica defasado até o próximo deploy.

## 12/10/2026 — O rodapé do ciclo zero lista os três itens da Área do Professor

**O que motivou.** O rodapé do índice do ciclo «zero» (`RODAPE_ZERO`, no `criar-escola.sh`)
continuava apontando só para o «Plano de Observação» — a mesma deriva do nav, que já listava
anamnese, plano de ensino e PO. Com o plano de ensino como rota/item próprios, o rodapé ficou
defasado: citava um único caminho da porta onde agora há três.

**O que foi decidido.**
- O `RODAPE_ZERO` passa a listar os TRÊS itens da Área do Professor, na ordem alfabética (a
  mesma do `gerar_nav_zero`): Anamnese do aluno · Plano de ensino · Plano de Observação.

**Onde entrou.**
`tools/criar-escola.sh` — `RODAPE_ZERO` (a linha do `rodape-docs` do índice zero).

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo. O motivo: o rodapé do ciclo «zero» ficou com uma deriva em
relação ao nav — o plano de ensino virou rota/item próprio, mas o `RODAPE_ZERO` (que não passa
pelo `rodape_docs` do `gerar-ciclo.sh`) continuou com um único link. **O que não muda:**

- **A fórmula do hash e a cobertura.** Nenhuma fonte de ciclo muda; o `RODAPE_ZERO` escreve só o
  rodapé do pacote «zero» (que não é fonte do `.fipp`).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhum mudou.
- **Os validadores existentes.** Nenhum mudou.

**Com o quê.**
`tools/criar-escola.sh`, `REGISTRO.md`, e o pacote `professores/tiago/ciclos/ciclo-01-maria/`
(rodapé propagado manualmente — o `criar-escola.sh` só gera no nascimento da escola, não numa
atualização).

**Referências.**
`CONGELAMENTO.md` (`tools/`) · a entrada «O CLI «criar-escola» alinha o menu zero ao plano de
ensino» (que deixou o rodapé como pendência).

**O que ainda não está feito.**
- O `check-pacote.js` continua reprovando os links da porta no pacote zero (rotas do Worker, não
  arquivos estáticos) — a limitação do zero-state já documentada no precedente `95db237`.

## 12/10/2026 — A folha de captura ganha rótulo curto e transposição

**O que motivou.** A geração do pacote da Maria (a primeira escola a percorrer o fluxo completo:
anamnese → plano → PO → Guardar) falhou no `check-pacote.js` com «PDF: 10 palavra(s) fora da
margem». A causa era a folha de captura derivada: cada critério de observação virava uma COLUNA, e
o cabeçalho era o texto COMPLETO do critério («Título: descrição toda», 146–217 caracteres). Com 13
critérios no bloco «técnica», a tabela estourava a largura do papel (a descrição não é título de
coluna — ela já vive no PO e na guia de observação).

**O que foi decidido.**
- O cabeçalho de coluna passa a ser o RÓTULO CURTO (o «Título» antes do `:`), nunca a descrição.
- A folha TRANSPÕE quando há mais critérios que alunas: critérios viram LINHAS (quebram na página),
  alunas viram COLUNAS. É o caso típico de turma pequena (1 aluna, 13 critérios). O schema e o JSON
  de captura NÃO mudam de orientação (colunas = critérios, linhas = alunas) — só a folha impressa
  gira; o validador troca a LEITURA, não o modelo.

**Onde entrou.**
`motor/nucleo/derivar-ciclo.js` — `rotuloDoItem()` (o rótulo curto), `derivarCaptura()` (transposição
por proporção) e `declaracaoDeCaptura()` (chaves/colunas com o rótulo curto).
`tools/validar-captura-ciclo.js` — a leitura da folha TRANSPOSTA (o marcador é o primeiro cabeçalho
«Critério»): troca a leitura de `colunasBrutas`/`linhas` sem mudar o JSON de saída.

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo. O motivo: a folha transposta é uma ORIENTAÇÃO nova que o
validador não conhecia — sem a troca de leitura, o `validar-captura-ciclo.js` leria as alunas como
critérios (e vice-versa) e reprovaria a folha correta. **O que não muda:**

- **A fórmula do hash e a cobertura.** Nenhuma fonte de ciclo é adicionada/removida; o hash continua
  o mesmo (a mudança é de leitura, não de cobertura).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhum mudou.
- **O JSON de captura de saída.** Continua `colunas` = critérios e `linhas` = alunas — o lançamento
  não muda.

**Com o quê.**
`motor/nucleo/derivar-ciclo.js`, `tools/validar-captura-ciclo.js`, `REGISTRO.md`, as fontes
re-derivadas `professores/tiago/ciclos/ciclo-01-maria-captura-aula-01.md` e
`professores/tiago/ciclos/ciclo-01-captura-schema.json`, as âncoras regeradas e o pacote
`professores/tiago/ciclos/ciclo-01-maria/`.

**Referências.**
`CONGELAMENTO.md` (`tools/`) · o precedente da captura do Diaghilev (rótulos curtos, poucas colunas).

**O que ainda não está feito.**
- Rótulos curtos iguais (duas dimensões com o mesmo «Título») colidem na chave do schema — não
  tratado; é um caso-limite de dado, não de apresentação.

## 12/10/2026 — A senha de criptografia da Maria nasce mockada e chega ao CI

**O que motivou.** A geração da Maria também falhava com «JSON de dados ausente no pacote»: a
senha de criptografia `SENHA_MARIA` não existia. Ela é a senha do `-dados.json`/acompanhamentos
(`SENHA_<ESCOLA>`), que nenhum fluxo cria — nem `criar-escola.sh`, nem o botão «Criar nova escola»
(cria só a `SENHA_ADMIN`). A pesquisadora definiu a senha PROVISÓRIA «maria» (mockada).

**O que foi decidido.**
- `SENHA_MARIA="maria"` entra em `tools/.senhas-locais` (fora do Git), e «maria» entra em
  `tools/.escolas-teste` (a senha é o próprio slug, como Diaghilev — a conferência do pre-push não
  se aplica enquanto for mock).
- O `gerar-ciclo.yml` passa a montar `tools/.senhas-locais` no runner a partir do secret
  `SENHAS_LOCAIS` (o conteúdo inteiro do arquivo, uma definição só). Sem o secret, avisa e o
  `check-pacote` reprova — declarado, não silencioso.

**Onde entrou.**
`tools/.senhas-locais` — `SENHA_MARIA="maria"` (local, fora do Git).
`tools/.escolas-teste` — «maria» (local, fora do Git).
`.github/workflows/gerar-ciclo.yml` — o passo «Montar as senhas locais» antes da geração.

**Com o quê.**
`tools/.senhas-locais` (local), `tools/.escolas-teste` (local), `.github/workflows/gerar-ciclo.yml`,
`REGISTRO.md`.

**Referências.**
A entrada «O JSON de dados vai para o pacote cifrado» (20/09) · `PROTOCOLO.md` P-13 («a senha é da
escola») · `IDEIA-PAINEL-ESCOLA.md` §17.2–17.4 (o «criar senha» planejado, não construído).

**O que ainda não está feito.**
- O secret `SENHAS_LOCAIS` precisa ser criado no GitHub (Settings → Secrets → Actions) com o
  conteúdo de `tools/.senhas-locais` — o meu token não grava segredos; a pesquisadora o cria.
- Quando a senha deixar de ser mock, «maria» sai de `.escolas-teste` e a senha vira segredo real
  (fora do Git, nunca no repositório).

## 12/10/2026 — O PO referencia o plano por id e para de duplicar o contexto (fonte única)

**O que motivou.** O `-po.md` da Maria saía com «Campo empírico» e «Contexto» em `[a decidir]`: o
derivador lia `where`/`contexto` como campos do envelope, mas eles são GRUPOS — o dado real estava
nos 9 subcampos duplicados. Pior: o PO coletava turma, frequência, duração, calendário, volume,
registro, metodologia, metodologia-origem e notação — os MESMOS dados já declarados no plano de
ensino. Duas fontes para o mesmo fato, e o custo de gravar/relê-los em dobro (KV e formulário).

**O que foi decidido.**
- O PO para de coletar os 9 campos duplicados: ele referencia o plano por id (`plano-de-ensino`) e
  os LÊ na geração. Fonte única, zero duplicação, zero KV novo (o envelope do PO fica menor).
- O `horizonte` FICA no PO: é o objetivo geral de CONJUNTO (vários ciclos), distinto do objetivo do
  plano (um ciclo) — não é duplicação.
- O campo empírico e o contexto do `-po.md` passam a ser compostos a partir do envelope do plano
  referenciado (dose, calendário, volume, condição de registro). Sem plano, degradam para lacuna
  declarada — nunca se inventa dado.

**Onde entrou.**
`porta/po/conteudo/po.json` — remove os 9 subcampos; o cabeçalho mantém professor, escola,
horizonte e plano-de-ensino.
`motor/nucleo/derivar-po.js` — `comporCampoEmpirico`/`comporContexto` compõem as duas seções a
partir do plano; os formatters `comporPeriodicidade`/`comporMedida`/`comporData` mudam para cá (base
sem dependência) e são reexportados.
`motor/nucleo/derivar-plano-ciclo.js` — importa os formatters (antes definidos localmente).
`motor/servidor/rotas.js` — resolve o plano referenciado UMA vez, antes de escrever o PO e o ciclo.
`motor/servidor/escrever-po.js` — o escritor do PO recebe o plano e o passa ao derivador.
`porta/index.html` — `SEMEADURA_DO_PLANO` sem os campos que saíram.

**Reancoragem.** A fonte `ciclo-01-maria-po.md` mudou (as duas seções saíram do `[a decidir]` para
o valor lido do plano): a âncora `ciclo-01-maria.fipp` foi regerada e o pacote rederivado.

**Com o quê.**
`porta/po/conteudo/po.json`, `porta/index.html`, `motor/nucleo/derivar-po.js`,
`motor/nucleo/derivar-plano-ciclo.js`, `motor/servidor/rotas.js`, `motor/servidor/escrever-po.js`,
`professores/tiago/ciclos/ciclo-01-maria-po.md`, `professores/tiago/ciclos/ciclo-01-maria.fipp`,
`professores/tiago/ciclos/ciclo-01-maria/` (pacote regerado), `REGISTRO.md`.

**Referências.**
`ARQUITETURA-AULA.md` §1 (o ato de gerar institui o fato; antes, o rascunho é intenção) · a regra
de proveniência P-03/P-04 (acrescenta, não edita — e o PO referencia, não duplica).

**O que ainda não está feito.**
- O `IDEIA-PAINEL-ESCOLA.md` ainda cita `norma`, `norma-origem`, `notacao` como dados coletados do
  PO — precisa ser realinhado à fonte única (o painel lê do plano, não do PO).
- O «Norma estabelecida» do PO continua em `[Preencher]`: é o padrão de referência do PO (distinto
  da metodologia do plano) e a entrevista ainda não o elicitou.
- Os pacotes das outras escolas (Diaghilev e demais) ainda trazem o formulário antigo até serem
  regenerados — a fonte `porta/` já está corrigida, falta regerar cada variante.

## 12/10/2026 — O Diaghilev sai por expurgo DIRETO, e a trava de identidade torna o deploy trocado visível

**O que motivou.** O `danca.tmenegaz77.workers.dev` voltava a ficar «desabilitado» alguns
minutos depois do deploy: a config de ESCOLA (o `wrangler.jsonc`, que era o Diaghilev, com
`ESCOLA_HABILITADA:"nao"` e o KV do Diaghilev) caía no Worker da RAIZ por um `wrangler deploy`
sem `-c`. O erro era **silencioso** — a página «Escola desabilitada» não distinguia «escola
desligada de propósito» de «config no Worker errado». A pesquisadora decidiu: **apagar o
Diaghilev de vez**, sem passar pelo expurgo (o teste do expurgo será o Diaghilev II).

**O que foi decidido.**
- O Diaghilev (escola simulada, `fokini/01`) é REMOVIDO do repositório **diretamente** — a
  pasta `professores/fokini/` inteira e o `wrangler.jsonc` (a config dele). O Diaghilev II
  (`fokini2/02`) permanece e passa a ser o **teste do expurgo**; a Maria (`tiago/01`) é o
  teste ativo do fluxo.
- **Trava de identidade em `producao.js`** (a ponte de escola): o `ESCOLA_SLUG` tem de estar
  declarado **e** bater com o subdomínio do pedido. Sem isso, a ponte devolve **erro visível**
  (500), não o freio. Ganha também o endpoint **`/api/saude`** (sem auth), que responde `ok`,
  `tipo`, `slug` e `erro` — o deploy passa a ser verificado por `curl`, não por visita à
  página. O freio `ESCOLA_HABILITADA:"nao"` continua sendo o jeito de desligar uma escola
  REAL; a trava é o que separa «desligada» de «config trocada».
- **`/api/saude` também na raiz** (`raiz.js`), respondendo `{ok:true, tipo:"raiz"}` — para
  conferir que a ponte certa está no `danca`.
- Sem um `wrangler.jsonc` «padrão», o `wrangler deploy` **sem `-c` passa a falhar** — de
  propósito: cada Worker (raiz + escolas) só sobe com a sua config explícita.
- O `MODELO` do scaffolding (`criar-escola.sh`) e os defaults do `gerar-ciclo.yml` deixam de
  apontar para `fokini/01`/`diaghilev` e passam a `tiago/01`/`maria`.

**Motivo declarado — os congelados.**
`tools/` é congelado e exige motivo. O motivo: o expurgo do Diaghilev deixou órfãos os
ponteiros que viviam em `tools/` — o `MODELO` do `criar-escola.sh`, o `PADRAO` do
`check-glossario.js`, os comentários de default «o único ciclo ativo é o de fokini» e a
referência a `wrangler.jsonc` no template de lançamento. **O que não muda:**

- **A fórmula do hash e a cobertura.** Nenhuma fonte de ciclo é adicionada/removida pela
  ferramenta; o hash continua o mesmo (as mudanças são de ponteiro/redação, não de cobertura).
- **As 17 regras, as 22 pétreas e o `CONGELAMENTO.md`.** Nenhum mudou.
- **O comportamento dos validadores.** `check-glossario.js` só muda o caminho padrão do uso
  manual sem argumentos; os chamadores (`check-pacote.js`, `hooks/pre-commit`) já passavam os
  caminhos explícitos.
- O template de lançamento ganha `ESCOLA_SLUG` e `run_worker_first` na config gerada — é a
  pré-condição da trava, não uma mudança de motor.

**Onde entrou.**
`motor/servidor/producao.js` — trava de identidade + `/api/saude` + freio com o slug.
`motor/servidor/raiz.js` — `/api/saude`.
`tools/criar-escola.sh` — `MODELO="tiago/01"`, `vars` (ESCOLA_HABILITADA + ESCOLA_SLUG) e
`run_worker_first` no `wrangler.<escola>.jsonc` gerado.
`tools/check-glossario.js` — `PADRAO` para `tiago/01-maria`.
`tools/hash-ciclo.sh`, `tools/gerar-ciclo.sh`, `tools/gerar-acompanhamento.sh` — comentário do
default atualizado.
`tools/templates/lancamento.html` — referência a `wrangler.<escola>.jsonc`.
`.github/workflows/gerar-ciclo.yml` — defaults `tiago`/`maria`.
`wrangler.maria.jsonc`, `wrangler.diaghilev2.jsonc` — `ESCOLA_SLUG` + comentários.
`README.md`, `professores/README.md` — a seção de deploy e a tabela de professores.

**Com o quê.**
A remoção de `professores/fokini/` e de `wrangler.jsonc`; `motor/servidor/producao.js`,
`motor/servidor/raiz.js`, `motor/servidor/disparar.js`, `motor/servidor/escrever-po.js`,
`motor/adaptadores/cloudflare.js`, `workers/principal.js`; `tools/criar-escola.sh`,
`tools/check-glossario.js`, `tools/hash-ciclo.sh`, `tools/gerar-ciclo.sh`,
`tools/gerar-acompanhamento.sh`, `tools/templates/lancamento.html`;
`.github/workflows/gerar-ciclo.yml`; `wrangler.maria.jsonc`, `wrangler.diaghilev2.jsonc`;
`README.md`, `professores/README.md`, `REGISTRO.md`; e (locais, fora do Git)
`tools/.senhas-locais` sem `SENHA_DIAGHILEV` e `tools/.escolas-teste` sem `diaghilev`.

**Referências.**
`IDEIA-PAINEL-ESCOLA.md` §17.5 (o hook de expurgo, ainda por construir) · `CONGELAMENTO.md`
(`tools/`) · a entrada anterior «O PO referencia o plano por id» (a trava é a irmã de
infraestrutura da mesma operação de saneamento).

**O que ainda não está feito.**
- O hook de expurgo (`scheduled` no Worker + `escolas-habilitadas.json`) ainda NÃO existe —
  é o que o Diaghilev II vai testar quando nascer.
- O Worker e o subdomínio `diaghilev.tmenegaz77.workers.dev` no Cloudflare ainda NÃO foram
  removidos (o expurgo DIRETO aqui removeu o repositório, não o recurso vivo) — pendente de
  confirmação da pesquisadora, para não apagar o KV compartilhado que o Diaghilev II usa.
- O secret GitHub `SENHAS_LOCAIS` precisa ser reescrito SEM `SENHA_DIAGHILEV` (e sem a senha
  da raiz, do expurgo anterior).
- Os pacotes das escolas restantes carregam o `lancamento.html` com o comentário antigo até a
  próxima regeneração (a mudança é só de comentário; não exige reancorar).
