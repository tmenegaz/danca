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
  `check-mapa.js`, `medir-rotulos.js`, sincronização do slide 68;
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
