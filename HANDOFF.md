# Handoff — Projeto Ciclo

Gerado em: `2026-10-05T10:13:00-0300`
Commit atual: `b6a406b` — docs(estrutura): a documentação aponta para o Worker do Cloudflare, não mais para o Netlify
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
bf0e700 docs(experimentos): o README descreve o que existe hoje, e não o que foi previsto
528c824 docs(registro): regenera o HANDOFF sobre c000dcd
c000dcd docs(registro): a medição do GET /dados e o segundo papel do agente
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
- **A verificação do painel do Cloudflare não foi feita** — não é alcançável daqui. Fica para ela:
  se o projeto é **Worker** ou **Pages** (o `wrangler.jsonc` é assinatura de Worker), o **account
  ID**, se o `PADD_KV` está **ligado** ou só **criado**, quais **rotas ou domínios** estão
  configurados, como o `PADD_KV` é provido no **desenvolvimento local**, e se o build do painel
  **honra** o `assets.directory` do `wrangler.jsonc` ou usa um diretório próprio.
- **Os commits ficam locais** até a pesquisadora empurrar.

## O que está pendente

## 01/10/2026 — A grafia de "Elicitação" se propaga, e a pendência do prompt congelado ganha dono

A **publicação** do pacote da Ritmos segue **bloqueada por crédito
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
- **A verificação do painel do Cloudflare não foi feita** — não é alcançável daqui. Fica para ela:
  se o projeto é **Worker** ou **Pages** (o `wrangler.jsonc` é assinatura de Worker), o **account
  ID**, se o `PADD_KV` está **ligado** ou só **criado**, quais **rotas ou domínios** estão
  configurados, como o `PADD_KV` é provido no **desenvolvimento local**, e se o build do painel
  **honra** o `assets.directory` do `wrangler.jsonc` ou usa um diretório próprio.
- **Os commits ficam locais** até a pesquisadora empurrar.

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
- **23/09/2026** — A identidade do projeto entra na documentação (e a… → `REGISTRO.md` L2339
- **23/09/2026** — A varredura da deriva de identidade: o que ficou fora da… → `REGISTRO.md` L2420
- **23/09/2026** — A seção que só tinha citação, e o ciclo simulado da… → `REGISTRO.md` L2501
- **23/09/2026** — O gerador não herda mais o locale de quem o chama → `REGISTRO.md` L2592
- **25/09/2026** — O HANDOFF truncado: o glob que abortava a geração em… → `REGISTRO.md` L2660
- **25/09/2026** — "Não o que foi planejado": a memória da aula dada e o… → `REGISTRO.md` L2735
- **25/09/2026** — O campo `norma`: o PO ganha o padrão de referência que… → `REGISTRO.md` L2846
- **25/09/2026** — A identidade visual passa a existir como contrato, e a… → `REGISTRO.md` L3046
- **25/09/2026** — A hora da aula entra no `DIAS`, e o calendário passa a ter… → `REGISTRO.md` L3177
- **26/09/2026** — O `DOCS` deixa de ser lista à mão: as famílias por aula… → `REGISTRO.md` L3351
- **26/09/2026** — A P-13 deixa de sugerir que o dado é privado do professor:… → `REGISTRO.md` L3472
- **26/09/2026** — O prazo do §3 dizia "menor entre" — e dois números do… → `REGISTRO.md` L3625
- **26/09/2026** — O config da captura deixa de ser um por ciclo: um… → `REGISTRO.md` L3774
- **26/09/2026** — O `check-identidade.js` entra no `pre-commit`: a identidade… → `REGISTRO.md` L3974
- **26/09/2026** — O campo ganha a forma canônica da linha de base, a… → `REGISTRO.md` L4208
- **26/09/2026** — A data da aula deixa de ser adivinhada: o `ciclos.json`… → `REGISTRO.md` L4401
- **26/09/2026** — O JSON de dados ganha validador: o `-dados.json` deixa de… → `REGISTRO.md` L4668
- **26/09/2026** — O prazo por aula deixa de ser 48 h fixas: `aulas[].prazo`… → `REGISTRO.md` L4870
- **26/09/2026** — A âncora deixa de existir só por ciclo: um `.fipp` por… → `REGISTRO.md` L5151
- **26/09/2026** — O config da captura por aula passa a ser conferido pelo… → `REGISTRO.md` L5311
- **26/09/2026** — Os apelidos saem em claro: um ciclo sem lançamento passa a… → `REGISTRO.md` L5465
- **26/09/2026** — O formulário lê o config pela AULA: as quatro aulas… → `REGISTRO.md` L5654
- **27/09/2026** — A nav sai uma vez: o formulário deixa de ser a única… → `REGISTRO.md` L5856
- **27/09/2026** — O estado da aula deixa de ser declarado: quatro estados… → `REGISTRO.md` L5969 *(superado)*
- **27/09/2026** — A §5.1 para de dizer 48 h: o ajuste com prazo passa a… → `REGISTRO.md` L6161
- **27/09/2026** — O ajuste no plano deixa de ser promessa: o elo do plano da… → `REGISTRO.md` L6319
- **27/09/2026** — A Aula 05 declara o método RAD e o ciclo ganha notação… → `REGISTRO.md` L6483
- **28/09/2026** — O índice do formulário saía sem a vírgula: a gravação… → `REGISTRO.md` L6618
- **28/09/2026** — O formulário baixa **dois** arquivos, e o texto passa a… → `REGISTRO.md` L6738
- **28/09/2026** — O botão passa a ser `Salvar`, e o arquivo vai para a pasta… → `REGISTRO.md` L6854
- **28/09/2026** — A legenda ao lado do botão `Salvar` sai; o botão fica… → `REGISTRO.md` L7192
- **28/09/2026** — O cabeçalho do formulário passa à voz de professor: só… → `REGISTRO.md` L7293
- **28/09/2026** — O botão `Exportar ajuste do plano` sai do formulário: era… → `REGISTRO.md` L7419 *(superado)*
- **29/09/2026** — O botão `Salvar` deixa de abrir a pasta do computador: a… → `REGISTRO.md` L7540 *(superado)*
- **29/09/2026** — O fecho do Passo 1: o "Nível 2 do `tiago`" já estava… → `REGISTRO.md` L7665 *(superado)*
- **29/09/2026** — O Passo 0 entra: o `POST` ganha destino e a cadeia reancora… → `REGISTRO.md` L7813
- **29/09/2026** — Os dois congelados entram: o índice ganha o slug e a… → `REGISTRO.md` L7940
- **29/09/2026** — O `B8` medido: `podeAjustarPlano()` não existe, e o elo do… → `REGISTRO.md` L8010 *(superado)*
- **30/09/2026** — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor`… → `REGISTRO.md` L8088
- **30/09/2026** — O segundo papel do agente: o servidor local **não… → `REGISTRO.md` L8177
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
