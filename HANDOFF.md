# Handoff — Projeto Ciclo

Gerado em: `2026-10-05T12:33:20-0300`
Commit atual: `c64fe95` — feat(tools): a espiral dos criadores ganha injetor próprio, e o registro conta a rodada
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
ac071db docs(registro): regenera o HANDOFF sobre 7b46e5c
7b46e5c docs(ciclo-01): a grafia nova alcanca as fontes da Ritmos, e a ancora reancora
f000b10 docs(prompts): "Elicitação" se propaga pela prosa, e a pendência do prompt congelado ganha dono
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

## O que está pendente

## 01/10/2026 — A view gerada e a regra de leitura cresciam com o arquivo: a colheita passa a ter limite e o `REGISTRO.md` deixa de ser lido inteiro

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
