# Handoff — Projeto Ciclo

Gerado em: `2026-10-07T23:42:02-0300`
Commit atual: `9f8a96e` — feat(prompts): a elicitação herda oito decisões do formulário do experimento
Para: sessão nova (retomar o diálogo)

## O que é este projeto

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
- **Professores:** fokini (1)
- **Ciclos com manifesto:** 1 variante(s)
- **Saídas geradas:** os pacotes de ciclo são versionados (o deploy automático lê o repositório); as demais saídas ficam fora do Git (reconstruíveis — P-04)

## Ideias documentadas

- **`ARQUITETURA-ANAMNESE.md`** — Desenho da malha de anamnese de balé clássico como **conteúdo do PO** — a **observação inicial** dos seis elementos basilares, os **nove blocos fixos** da ficha, os **dois módulos condicionais** (validação de nível prévio e contexto de origem) e as **três dimensões** da linha de base (Técnica, Funcional, Musicalidade) —, seguida da **malha de domínios declarados** (alinhamento ósseo, flexibilidade passiva, força ativa e potência, sistema vestibular, orientação espacial e lateralidade), com **ramificação condicional** pelo nível declarado (Básico, Intermediário, Avançado) e **soberania de CRUD autoral** do professor — o **recipiente** é do PE, o **conteúdo** é do PO.
- **`ARQUITETURA-AULA.md`** — o ciclo de vida da aula (planejada → dada → lançada, mais a **não dada**), a regra CRUD × ajuste, o prazo dinâmico por turma, o índice e a âncora por aula. O **estado derivado** (`B6`) e o **ajuste no plano** (`B8`) estão implementados; o resto, não.
- **`ARQUITETURA-CAPTURA.md`** — arquitetura técnica do formulário dinâmico com JSON por ciclo — modelo de dados, schema, fluxo, segurança e perguntas em aberto.
- **`ARQUITETURA-PE.md`** — Especificação da arquitetura de integração entre o repositório atual (implementação do PO) e o repositório separado **"dança e elicitação"** (módulo PE), utilizando descoberta por variável de ambiente (`.env`) e degradação graciosa.
- **`IDEIA-CAPTURA.md`** — formulário dinâmico com JSON por ciclo — substitui as capturas, relatórios e acompanhamentos `.md` individuais. Não implementado.
- **`IDEIA-PAINEL-ESCOLA.md`** — painel de gestão para a direção da escola (aulas dadas, horas trabalhadas, valor-hora, cadeia de custódia, retenção) e a página pública da cadeia para pais e alunos. Não implementado.

## Últimos commits

```
9f8a96e feat(prompts): a elicitação herda oito decisões do formulário do experimento
d94b991 feat(experimentos): o Worker ganha o cofre da anamnese — com leitura por GET
0b81ab1 docs(registro): regenera o HANDOFF sobre c64fe95
c64fe95 feat(tools): a espiral dos criadores ganha injetor próprio, e o registro conta a rodada
55d332d docs(apresentacao-01-rizoma): o deck passa de 72 para 87 slides e o mapa anda para o slide 83
f595506 docs(registro): regenera o HANDOFF sobre b6a406b
b6a406b docs(estrutura): a documentação aponta para o Worker do Cloudflare, não mais para o Netlify
791f3fb chore(entrega): o pacote do diaghilev recebe a rota nova do lançamento
878d3ae refactor(template): o endereço do POST do lançamento passa a `/api/receber`
1d01c9d refactor(tools): o Worker do Cloudflare substitui o Netlify — Functions e Blobs saem
a24179b docs(registro): a entrada do cofre — do Netlify para o Cloudflare KV
00bfe2f feat(schema): a escola pode ser desabilitada -- e a desabilitacao diz por que e desde quando
99ae163 feat(tools): o validador passa a entender if/then/else do schema
1a65840 fix(tools): o `pattern` do schema deixa de valer so para o campo obrigatorio
2a368a2 docs(registro): regenera o HANDOFF sobre f04551b
f04551b docs(registro): os ciclos-prototipo saem, e o tools/ acha o ciclo ativo
3736757 docs(tools): os exemplos e ponteiros passam a citar o ciclo ativo
08c0be9 chore(estrutura): saem os ciclos-prototipo, e o Diaghilev fica sozinho
be806f4 docs(estrutura): a regra de desmembramento da ficha entra na norma
bbe8867 docs(tools): a colheita do HANDOFF passa a ter limite, e a leitura do REGISTRO deixa de ser inteira
```

## Por professor

### fokini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `899d17e4343d` | (vazio) | Input_PO_Aguardando |

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

## O que está pendente

## 02/10/2026 — Os ciclos-prototipo saem do caminho ativo, e o Diaghilev fica sozinho

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


- **O token do `RITMOS` continua VIVO.** Ver a **nota de correção datada** em `REGISTRO.md:8886`
  — ele autentica como `tmenegaz77@gmail.com` e agora alcança **0 sites**, mas **não expira
  sozinho**. A API do Netlify administra sites, **não** PATs: a revogação é no painel
  (*User settings → Applications → Personal access tokens → Revoke*). Não há nada editável no
  repositório.
- **O export não foi rodado.** Nenhum PDF, PPTX ou HTML da apresentação foi gerado nesta rodada —
  a pesquisadora pediu os **commits**, não a entrega.
- **A temporada de commits é local** até ela empurrar.

## 07/10/2026 — O prompt de elicitação herda oito decisões do formulário do experimento


- **As Frentes 2 e 3 do pedido não começaram:** o botão «Usar IA para fazer o PO» (que deve acionar
  **este** prompt, agora atualizado) e a lista de sujeitos e anamneses para o agente inteligente.
- **A alteração não foi vista por um agente em uso.** O que se mediu foi o **texto** — oito
  acréscimos presentes e verificados. Se a entrevista conduzida pelo prompt atualizado produz PO
  melhor, isso só se sabe **rodando-o**.
- **A via anterior não está no repositório.** Ficou em `files/elicitar-ciclo.ANTES.md`, no workspace
  da sessão, **fora do Git**.

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
- PO de **fokini · diaghilev** segue `Input_PO_Aguardando` — será declarado quando houver aula (P-02).
- **fokini · ciclo 01:** aulas escritas em detalhe: 5 de 5 (as demais entram depois da aula anterior).
- Material de campo de **fokini**: 0 evento(s) versionado(s).

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
