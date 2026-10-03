# Handoff — Projeto Ciclo

Gerado em: `2026-10-02T21:56:13-0300`
Commit atual: `f04551b` — docs(registro): os ciclos-prototipo saem, e o tools/ acha o ciclo ativo
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
5910dfc docs(estrutura): a observação inicial e a §9 Q10 no ARQUITETURA-ANAMNESE
5309cc3 docs(registro): regenera o HANDOFF sobre bf98e68
bf98e68 chore(ciclo-01): regera os três ciclos para propagar o campo professor
b2e8a6f docs(registro): a baixa do ponto 3 e o rito dos congelados
1484527 fix(tools): o comentário do pre-commit deixa de nomear função que não existe
52b44f3 docs(tools): as quatro linhas de prosa passam a dizer fokini
aa4c428 docs(estrutura): a observação inicial e os elementos basilares entram como §3
31d97fe refactor(estrutura): fochini → fokini (o slug e o nome de exibição)
12a5462 docs(registro): regenera o HANDOFF sobre ee1863f
```

## Por professor

### fokini — 1 ciclo(s)

**Ciclo 01** — variante(s): diaghilev

| Escola | PO | state | Marcadores [Preencher] |
|:--|:--|:--|--:|
| Diaghilev | ciclo-01-diaghilev-po.md | Input_PO_Aguardando | 3 |

| Variante | .fipp | hash (12) | parentHash | po_state |
|:--|:--|:--|:--|:--|
| diaghilev | ciclo-01-diaghilev.fipp | `7e32e5a49c0a` | (vazio) | Input_PO_Aguardando |

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

## O que está pendente

## 30/09/2026 — Os pontos 2, 3 e 4 fechados: a grafia, o campo `professor` e duas pendências que a medição derrubou

O **Passo 0** segue aberto, e continua dependendo de **credencial
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

O **agente local** continua **não implementado** — e agora se sabe
que ele era **hipótese**, não pendência de código: a medição desta rodada **derrubou** a premissa do
prompt. Segue **sem existir** a consolidação dos lançamentos do Blob de volta ao repositório (§7.3).
Seguem **"Não decidido"** a §7.6 (onde o formulário roda), a §7.2, a §7.4 e a §7.5 — e é a §7.6 que
governaria o agente local. A **publicação do `ciclo-ritmos`** está bloqueada por **crédito da
conta**; reabre por **faturamento**, não por código. Permanecem sem resposta a pergunta pela

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
