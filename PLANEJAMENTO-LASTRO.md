# Planejamento de frentes — Sistema Lastro

> **Resumo (para o HANDOFF):** o mapa de evolução do **Sistema Lastro** (o nome comercial do
> produto; `Projeto Ciclo` segue como o nome do protótipo e deste repositório). Diagnóstico do
> que existe hoje — as três fontes, o envelope, as famílias de chave, os identificadores, os
> relacionamentos, os índices, o versionamento e o comercial — e **onze frentes** com objetivo,
> lacunas, dependências, entregas, critérios verificáveis, riscos e prioridade. Nada foi
> implementado: este documento é o mapa, não a obra.
>
> **Escopo.** Este documento é do **Projeto Ciclo** — a memória da aula dada, **protótipo
> testado no universo da dança** (não é agnóstico: o projeto agnóstico será criado a partir
> dele). O nome comercial do produto é o **Sistema Lastro**; o **FIPP não é implementado
> aqui** — a âncora deste repositório é uma âncora de proveniência encadeada
> (`tools/hash-ciclo.sh` → `.fipp`), **aproximação** do framework, que pertence ao projeto de
> mestrado, em outro diretório. Onde este documento disser «proveniência», entenda-se essa
> âncora.

> **Como este documento foi produzido.** Leitura do repositório e **medição do que está no ar**
> — o KV de produção foi **listado e lido** (somente leitura), os `wrangler.*.jsonc` foram
> comparados, e cada afirmação traz o caminho `arquivo:linha` ou a chave medida. **Nenhuma
> linha de código de produto foi alterada** para escrevê-lo. Onde a evidência não fecha, está
> escrito «não verificado» — não preenchido por dedução. As duas descrições de frente que
> originaram este mapa são o **texto 1** (integridade dos dados, indexação semântica e
> proveniência documental) e o **texto 2** (consultas pedagógicas, cruzamento de dados e
> organização comercial dos planos).
>
> **Revisão de 15/10/2026 — contra os textos autoritativos.** Os dois textos foram recebidos
> como **arquivo** (e conferidos: **byte a byte idênticos** ao que já servira de base), e cada
> requisito foi reconferido um a um contra este documento. A conferência encontrou **quatro
> lacunas** — e o documento foi completado: **§2.10** (as quatro categorias — *existe · existe
> parcialmente · não existe · precisa de decisão* —, que **os dois** textos exigem por palavras
> próprias no seu último parágrafo), **§2.11** (as seis operações do «Gerar PO», classificadas —
> pedidas pelo texto 1 §2), **§7** (as oito perguntas do catálogo, uma a uma, com o dado
> existente e a classe) e **§8** (a matriz de cobertura: cada requisito dos dois textos e onde é
> respondido). Da conferência saiu também o achado **C10** e a frente **L10** (§3, §4): quatro
> dos conceitos com que o texto 2 formula as perguntas **não existem** no modelo de dados.
>
> **Incorporação de 15/10/2026 — a frente L11.** O dono do produto entregou um **rascunho** da
> frente «A porta paga» (cobrança, verificação e liberação de escolas) e pediu que ele fosse
> auditado contra o repositório e incorporado como **L11**. O rascunho foi reconferido item por
> item: o que ele afirma sobre o código foi **medido** (§L11, «Situação atual»), o que ele supõe
> sobre o provedor foi **conferido na documentação pública** (§L11, matriz do provedor) e o que
> não se confirmou ficou declarado como pendente. **Uma afirmação do rascunho não se confirmou no
> código** — ele descreve um «acesso público sem autenticação administrativa» que **não existe**
> (§C11): hoje a raiz inteira está atrás de senha. Isso muda o ponto de partida da frente, e está
> registado como contradição, não corrigido em silêncio. Nasceu também **C11** (§3). Nenhuma linha
> de código de produto foi alterada.

---

## 1. O nome e o que ele designa

O produto tem nome comercial próprio; o repositório continua a ser o **Projeto Ciclo** — o
protótipo a partir do qual o produto se constrói. Os dois convivem, e a convivência é
declarada (não é renomeação silenciosa):

| Nível | Forma | Quando usar |
|:--|:--|:--|
| Marca curta | **Lastro** | onde o contexto já é o produto (interface, ícone, assinatura) |
| Sistema | **Sistema Lastro** | o sistema como um todo (documentação, contrato, apresentação) |
| Solução | **Plataforma Lastro** | quando se fala da solução tecnológica (infraestrutura, integração) |
| Descrição | **Lastro — Sistema de Memória e Observabilidade Pedagógica em Dança** | documentos técnicos e apresentações — **proposta** de denominação descritiva, **não** um subtítulo confirmado |

**O conceito central, que nenhuma frente pode contrariar:** o Lastro **registra e organiza
evidências para apoiar a reflexão pedagógica; não substitui o professor nem toma decisões sobre
o aluno.** Toda frente abaixo tem um critério que reprova a solução que cruze essa linha.

---

## 2. Estado atual — inventário com evidência

### 2.1 O que existe, em peças

| Peça | Onde | O que é |
|:--|:--|:--|
| Fontes de verdade | `professores/*/ciclos/*.md`, `*.conf`, `*.json` | Markdown/JSON/`.conf` versionados no Git |
| Contrato de cada artefato | `ciclo-XX-{schema,po-schema,plano-schema,aula-schema,captura-schema}.json` | JSON Schema versionado (P-08) |
| Recipiente da elicitação | `porta/envelope/elicitacao-schema.json` | o **envelope** — versão `1.2.0`, `additionalProperties: false` no topo |
| Conteúdo dos formulários | `porta/conteudo/anamnese.json`, `porta/plano/conteudo/plano.json`, `porta/po/conteudo/po.json` | os nós respondíveis (o que a porta serve) |
| Motor (lógica pura) | `motor/nucleo/*` | `porta.js`, `elicitar.js`, `derivar-*.js`, `cofre.js`, `lancamento.js`, `ia.js` — sem IO |
| Adaptadores | `motor/adaptadores/{node,cloudflare}.js` | o contrato de 6 verbos (`ler/guardar/anexar/listar/existe/apagar`) |
| Servidor (rotas) | `motor/servidor/rotas.js` | **as rotas da porta, declaradas uma vez** |
| Painel da direção | `motor/servidor/bastidores.js` | a Produção (alunas, professores, turmas, vocabulário, curadoria) |
| Escritores (write-back) | `motor/servidor/escrever-{po,plano,ciclo}.js` | GitHub Contents API → fonte no repositório |
| Cofre de runtime | KV `PADD_KV` | envelopes, anamnese cifrada, lançamentos, bastidores, registro de custo |
| Gerador + validadores | `tools/gerar-ciclo.sh`, `tools/validar-*-ciclo.js`, `tools/check-pacote.js` | build (pandoc/pdflatex) e validação |
| Âncora | `tools/hash-ciclo.sh` → `ciclo-XX-<escola>.fipp` | SHA-256 encadeado (`parentHash`) |
| Índice por escola | `escola/<escola>/indice.json` | inventário do que a escola tem + log de expurgo |
| Andaime de habilitação | `raiz/escolas-habilitadas.json` | `{escola: {habilitada, desde?, pagante?, kv?}}` |

### 2.2 As três fontes, o envelope e os 111 nós

Medido hoje com `porta.mapa(conteudo)` (o próprio código que serve o formulário):

| Formulário | Nós respondíveis | Obrigatórios | Conteúdo |
|:--|--:|--:|:--|
| Anamnese | **53** | 49 | `porta/conteudo/anamnese.json` |
| Plano de ensino | **25** | 14 | `porta/plano/conteudo/plano.json` |
| Plano de Observação (PO) | **33** | 19 | `porta/po/conteudo/po.json` |
| **Total** | **111** | 82 | — |

As **formas de pergunta** hoje suportadas (contagem de nós que as usam): 101 são campo de texto
simples/valor escalar; 2 são **tabela** (grelha), 2 são **porMarco** (matriz objetivo × bloco),
e há 1 de cada: **medida**, **data**, **periodicidade**, **registro**, **escala**, **lista**;
5 são **múltipla escolha**, 7 têm **linha aberta**, 5 são **de contexto** (`deContexto`), 4 vêm
**da turma** (`daTurma`), 1 vem **da curadoria** (`daCuradoria`).

> **Contradição a registrar (C6).** `FRENTES.md:66-69` (laudo L4, de 12/10) declara
> «Plano de ensino **26** / PO **~35**». O medido hoje é **25** e **33** — o nó 17 saiu do
> plano (14/10) e os módulos condicionais mudaram a contagem do PO. O laudo **não foi
> corrigido aqui** (não é o objeto deste documento): fica registado para o próximo elo.

### 2.3 Onde o dado vive hoje — as famílias de chave, lidas do KV em produção

Listagem real (`npx wrangler kv key list --remote`), namespace **partilhado**
(`2ee331c7a5bc446ca86c8f2cb039ec16`, o que o `tools/criar-escola.sh:434-437` grava para toda
escola nova):

| Chave | Família | Quem escreve | Quem lê |
|:--|:--|:--|:--|
| `barra/envelope/anamnese-20261014-0035.json` | envelope (namespaçado pelo adaptador) | `motor/nucleo/porta.js:351-358` | a porta (`lerEnvelope`, `anamneses`, `planos`, `vinculos*`) |
| `barra/leticia/01/anamnese/anamnese-20261014-0035` | cofre da anamnese (cifrado) | `motor/nucleo/cofre.js:128` | `GET /api/anamnese` (`rotas.js:271`) |
| `bastidores/barra/{alunas,professores,turmas,vocabulario,curadorias,turma-conteudos}` | Produção | `motor/servidor/bastidores.js` | a própria Produção e a porta (`daTurma`, `daCuradoria`) |
| `diaghilev/fokini/01-2026-10-05T1453/{ciclo-01-…-dados-….json,ciclos.json}` | **lançamento** | `motor/nucleo/lancamento.js:92` | **ninguém** (ver C1) |
| `ia-registro/registro.jsonl` | registro de custo da IA | `motor/servidor/rotas.js:108` | **ninguém** (ver C7) |

No namespace **da Maria** (`f1d475e179954f17accb7bedb59de53f`, ligado por
`wrangler.maria.jsonc:32`) foram medidos **três envelopes de 12/10** —
`envelope/anamnese-20261012-1149.json`, `envelope/plano-20261012-1225.json`,
`envelope/po-20261012-1938.json` — **sem o prefixo da escola** (ver C2).

### 2.4 Identificadores — o que é estável e o que não é

Esta é a medição que sustenta a frente L2. Cada caso é dado real, não exemplo.

| Entidade | Identificador hoje | Onde | Estável? |
|:--|:--|:--|:--|
| Escola | slug (pasta, `ESCOLA_SLUG`, subdomínio) | `professores/*/ciclos/ciclo-XX-<escola>.conf` | **sim** |
| Ciclo | `"01"` (string, 2 dígitos) | `.conf`, YAML dos `.md`, chaves do KV | **sim** |
| Turma | `id` slug — ex. `bale-nivel-1` | `bastidores/<escola>/turmas` | **sim** |
| Termo do vocabulário | `id` slug — ex. `plie` | `bastidores/<escola>/vocabulario` | **sim** |
| Relação turma ↔ termo | chaveada por **id dos dois** | `bastidores/<escola>/turma-conteudos` | **sim** (é o bom exemplo) |
| **Aluna** | **o apelido, e nada mais** — `["Vavá"]` | `bastidores/<escola>/alunas` | **não** |
| **Professor** | `{nome, sal, hash}` — o **slug é derivado do nome** por `slugificar(p.nome)` | `bastidores.js:964-970` | **não** |
| **Curadoria → turma** | **o nome de exibição** — `turmas: ["Balé Nível 1"]` | `bastidores/<escola>/curadorias` | **não** |
| Curadoria → aluna / repertório | o apelido / o nome do passo | idem | **não** |
| Coluna da folha de captura | `chave` curta e estável, declarada | `ciclo-XX-captura-schema.json` → `_declaracao.porVariante.<v>.blocos.<t>.colunas.<rótulo>` | **sim** |
| Nó do formulário | `id` no conteúdo (ex. `contexto-frequencia`) | `porta/**/conteudo/*.json` | **sim** |
| Aula | `n` (`"01"`) no índice do ciclo | `ciclos.json` do pacote | **sim** |
| Vínculo aula ↔ marco do plano | **o TEXTO do marco** | `ciclos.json` → `aulas[].marco` | **não** (ver C4) |

**O precedente que resolve o problema existe, e é de uma só camada.** O
`ciclo-XX-captura-schema.json` já declara, por variante, o par **rótulo ↔ chave ↔ tipo** de cada
coluna, e o próprio arquivo diz por quê: *«A folha continua sendo a fonte dos RÓTULOS; esta
declaração é a autoridade sobre as CHAVES e os TIPOS»* (`_declaracao._nota`) — com as chaves
«escolhidas CURTAS e ESTÁVEIS». Ou seja: o mecanismo que a frente L1 pede **existe para a folha
de captura** e **não existe para os 111 nós** dos três formulários, cujo destino a jusante é o
`id` do nó (bom) mas cuja **chave no documento derivado é derivada do rótulo visível**
(`chaveDaColuna` em `tools/lib-extracao-md.js` — `Escola / espaço` → `escolaEspaco`).

### 2.5 Relacionamentos — como se ligam hoje

- **Derivados por varredura, não persistidos.** `vinculos()` (`porta.js:371`) e
  `vinculosDePlano()` (`porta.js:393`) **listam todos os envelopes de PO** (`listar('envelope/')`),
  leem cada um e verificam quem declara o apelido em `sujeitos` / o id do plano em
  `plano-de-ensino`. O comentário é explícito: *«É DERIVADO — […] não se grava nada»*.
- **Direção do fluxo, confirmada** (`FRENTES.md` L3): anamnese → (nada a jusante) · plano → PO ·
  PO consome as duas. Unidirecional.
- **O que liga o que**: PO → anamnese (por apelido, em `sujeitos`); PO → plano (por `id` de
  envelope, em `plano-de-ensino`); curadoria → turma/alunas (**por nome**); aula → marco
  (**por texto**).
- **O lançamento não declara vínculo nenhum.** O JSON de dados medido tem
  `{ciclo, escola, aulas, apelidos}` — `aulas.01` traz `data`, `presentes`, `ausentes`,
  `duracao_min`, `condicoes_contorno` e um objeto **por apelido × chave de coluna**
  (`eixo_peso.<apelido>.eixo_vertical`). Não há id de plano, nem de versão, nem de turma.

### 2.6 Índices

| Índice | Existe? | Evidência |
|:--|:--|:--|
| Índice por escola (inventário + expurgo) | **sim, gerado e não lido pela aplicação** | `escola/barra/indice.json`; `tools/criar-escola.sh:457-463`; lido só pelo andaime de expurgo |
| Listagem de envelopes por prefixo | **sim** (`listar(prefixo)`) | `porta.js:292-299` |
| Índice por aula do ciclo | **sim** | `ciclos.json` → `aulas[]` (`n`, `data`, `marco`, `estado`, `lancada`, `ancora`, `prazo`, `config`) |
| Índice invertido (elemento → ocorrências) | **não** | não encontrado: a única forma é varrer os envelopes |
| Índice de coluna/termo sobre os lançamentos | **não** | o lançamento é um blob por carimbo, sem leitor |
| Busca textual | **não** | não encontrado em `motor/`, `tools/`, `porta/` |
| Exportação (CSV/planilha) | **não** | não encontrado |

### 2.7 Versionamento, imutabilidade e proveniência

**O que existe e funciona:**

- A âncora `SHA-256(id : tipo : parentHash : hash_das_fontes)`. Cobre
  (`tools/lib-fontes.sh` → `fontes_do_ciclo`): os dois `.conf`, o `po.md` (`ARQUIVO_PO`), o
  **JSON de dados do ciclo**, os `.md` do `DOCS` **e os relatórios pós-aula da variante**
  (`relatorios/ciclo-NN/aula-*-<escola>.md`). **Não cobre**: os schemas, os conteúdos de
  `porta/`, o `tools/`, os JSON derivados (`po-XX.json`, `plano-XX.json`), os pacotes e os
  acompanhamentos.
- **Uma âncora por documento** existe: `ciclo-01-maria.fipp` **e** `ciclo-01-maria-aula-01.fipp`.
- O **elo do ajuste**, implementado: `POST /api/anamnese-ajuste/:id` (`rotas.js:182`) grava um
  envelope **novo** com `ajuste_de` / `ajustado_em` / `motivo` (schema do envelope,
  `properties.ajuste_de`); `DELETE /api/anamnese-vinculo/:id` (`rotas.js:167`) **recusa** apagar
  o que está vinculado («a proveniência não a apaga — ajuste-a, que acrescenta um elo»); e
  `PUT /api/anamnese-editar/:id` (`rotas.js:222`) só edita em sítio **a solta**.
- O envelope é **versionado** — mas o que ele versiona é o **formato do envelope**, não o **plano
  de que ele fala**: `VERSAO_DO_ENVELOPE = '1.2.0'` (`motor/nucleo/elicitar.js:86`), com o motivo
  da subida escrito (1.1.0 → 1.2.0, pelo elo do ajuste, `elicitar.js:81`). É o **padrão** da casa
  para introduzir versão: constante declarada, motivo registado — e é esse padrão que faltava
  aplicar ao documento publicado.
- O envelope carrega **proveniência por campo**: cada resposta é
  `{valor, origem, respondente, nota}` — medido: 35 respostas do PO com `origem: "perguntado"`,
  `respondente: "professor"`.
- `git log` é a cadeia de custódia real do conteúdo (`ARQUITETURA-GERAL.md` §4.1).

**Os buracos medidos:**

- **`ancora: null`** em todos os envelopes lidos e em `ciclos.json → aulas[].ancora`: o campo do
  ponteiro de proveniência **existe e não tem produtor** (o próprio `_nota` do índice o declara).
- **`conteudo.digest: null`**: não se sabe **contra que versão do conteúdo** o professor
  respondeu.
- **O lançamento não é fonte versionada e não tem leitor** (C1) — embora o **relatório pós-aula**
  seja, esse sim, fonte da âncora, e as pastas `professores/tiago/{relatorios,cadernos,campo}/`
  estejam hoje **vazias**.
- **Duas políticas de escrita convivem** (C3 — a convivência **persiste** até L5): `escrever-po.js:71-92` e `escrever-plano.js`
  **sobrescrevem** (`sha` → `PUT`); `escrever-ciclo.js` **nunca sobrescreve** (só escreve o que
  não existe).
- **A âncora deteta a mudança e não a preserva** — medido em cópia de bancada (repositório
  intocado): editar o `ciclo-01-maria-po.md` muda o `hash_conteudo` e o `--check` **acusa**
  (`c1448825342a…` → `4f5d04223be8…`); mas o `.fipp` é **reescrito no lugar** — reancorar troca
  o `hash_conteudo` e o `ancorado_em` e **não deixa rasto do valor anterior**, e o `.fipp` não
  tem **nenhum** campo de elo ou de versão (`parentHash` encadeia **o ciclo anterior** na mesma
  variante, não o estado anterior do mesmo documento — `hash-ciclo.sh:195-210`). O estado
  anterior do PO publicado existe, hoje, **só no histórico do Git**.
- **O único elo do plano é derivado e sem consumidor**: `plano-aula-NN.json` →
  `plano-aula-NN-anterior.json` (`gerar-ciclo.sh:254-257`, `cp` **antes** do `mv`, e a ordem é
  deliberada) — a disciplina do elo **existe**, mas num artefacto **derivado** (fora da âncora,
  fora do `.conf`) e que a nota de correção de 28/09/2026 diz **não ser lido** por ninguém.
- **O lançamento já é imutável e já tem identidade própria**: `lancamento.js:88-92` grava
  **verbatim** e **recusa** carimbo já existente — o carimbo (`2026-10-05T1453`) **é** um id
  imutável de lançamento. O que falta não é imutabilidade: é a **referência de volta** à versão
  do plano observado.
- **A cobertura da âncora é lista declarada, não curinga**: `DOCS` (do `.conf`, expandido por
  `docs_derivado`) + um **único** `ARQUIVO_PO` (`lib-fontes.sh:131`) — logo uma versão guardada
  em **arquivo separado** não entra na âncora sozinha, e `ARQUIVO_PO` é um caminho só. É o
  constrangimento que pesa na escolha de S1 (§3).

### 2.8 Consultas existentes

Tudo o que a aplicação responde hoje é **leitura de uma chave** ou **listagem por prefixo**,
seguida de filtro em memória:

| Consulta | Rota | Como |
|:--|:--|:--|
| Seleção de sujeitos do PO | `GET /api/anamneses` (`rotas.js:136`) | varre envelopes, um por apelido vigente |
| Estante de planos | `GET /api/planos` (`rotas.js:143`) | varre envelopes de plano |
| Gestão (estados) | `GET /api/anamnese-estados`, `/api/plano-estados` | derivado por varredura |
| Listas da Produção | `GET /api/bastidores/*` | lê a coleção do KV |
| Vista por aluna | `tools/gerar-acompanhamento.sh` | deriva de PO + relatórios pós-aula, determinística |
| Vistas | `tools/lib-vistas.js` (`caderno`, `relatorio`, `acompanhamento`, `guia`) | derivadas, determinísticas |

**Não existe**: cruzamento entre entidades (aluna × objetivo × contexto × aula × ciclo), filtro
por período, agregação, ranking, nem qualquer resultado que ligue o lançamento ao plano. As
perguntas T01–T05 e P01–P03 do texto 2 **não são respondíveis hoje** — não por falta de dado,
mas por falta de **leitor** (o lançamento não tem rota) e de **chave estável** para cruzar
(2.4).

### 2.9 Comercial

**Não existe nada.** Verificado por varredura em `motor/`, `tools/`, `porta/`, `workers/`:
nenhum plano comercial, preço, assinatura, cobrança, gateway, multiusuário por plano ou cota por
plano. O que há:

- `raiz/escolas-habilitadas.json` → `pagante: true` como **trava do expurgo** (lido por
  `motor/servidor/raiz.js:73-74`, «escola pagante — não se apaga») — é a **única** pegada
  comercial no código, e é um andaime declarado, que «sai quando a Produção nascer».
- `motor/nucleo/ia.js:32` → `limiteTurnos = 30` (freio **de sessão**, não cota).
- `ia-registro/registro.jsonl` → medido: `tokens_in: 0`, `tokens_out: 0`,
  `custo_estimado: "0 (stub)"`.
- O custo da IA foi **medido em experimento** (`experimentos/pe/freio-custo.md`, ≈20 500
  tokens/PO, teto 33 000) — é evidência, **não** um medidor de produção.
- Os valores de referência (Básico R$ 62,38 · Intermediário R$ 99,88 · Avançado R$ 137,38; os
  compromissos trimestral/semestral/anual; adicionais R$ 49,90 + 20%; hora técnica R$ 120,00)
  existem **apenas no texto que originou este documento** — **em nenhum lugar do repositório**.

**Os componentes que a porta paga toca** — medidos em 15/10/2026 para a frente **L11** (§4), com
o detalhe e a evidência na tabela da própria frente. O resumo, porque ele corrige duas leituras:

- **A raiz não tem KV.** O `wrangler.danca.jsonc` tem **só** `ASSETS` e o Cron (`*/5 * * * *`);
  não há `kv_namespaces`. A rota de pagamento **não tem onde gravar** hoje — e é a razão do item
  **C11** (§3).
- **A porta tem um lado só, e é o autenticado.** `autorizado()` (`motor/servidor/raiz.js:32`) é
  conferido **uma vez** (`:268`) e cobre a página e todas as rotas de produto; a única rota sem
  senha é `/api/saude` (`:261`). Medido no ar: `/` sem credencial → **401**. O «fluxo público» que
  o rascunho de L11 supõe **não existe** — não é um defeito de configuração, é obra por fazer.
- **A habilitação não é dinâmica.** `ESCOLA_HABILITADA` é **var do Worker** (mudar = `deploy`), e
  `raiz/escolas-habilitadas.json` é **asset da raiz** (mudar = deploy da raiz). São **duas**
  fontes para a mesma ideia, e nenhuma delas serve para um webhook de pagamento.

### 2.10 As quatro categorias — o que existe, o que existe parcialmente, o que não existe, o que precisa de decisão

> **Por que esta secção existe.** Os **dois** textos exigem-no por palavras próprias: «o
> diagnóstico deve **separar claramente** o que já existe, o que existe parcialmente, o que não
> existe e o que ainda precisa de ser decidido» (texto 1 §9) e «o agente deve **separar** o que já
> existe, o que existe parcialmente, o que ainda não existe e o que depende de decisão comercial
> ou arquitetural» (texto 2 §10). As lacunas por frente (§4) dizem o que falta **a cada frente**;
> esta tabela diz o que está **em pé hoje**, numa leitura só — e é a que responde ao pedido.

| Categoria | O que está nela |
|:--|:--|
| **EXISTE** | Fonte de verdade em ficheiros + Git; contrato por artefacto (schema versionado); documento derivado por transformação determinística; as três fontes com chave-valor por `id` de nó no envelope; a **âncora encadeada** por ciclo **e por aula**; o **elo do ajuste** com `motivo` e a recusa de apagar o vinculado; o envelope **versionado** (`1.2.0`) com proveniência **por campo** (`{valor, origem, respondente, nota}`); o armazenamento por contrato de 6 verbos com adaptador `fs`↔KV; turma e termo com **id slug** e a relação turma↔termo chaveada por id; o **índice por aula** do ciclo (`aulas[]` com `estado`/`prazo`/`lancada`); a **vista determinística** por aluna; o isolamento por escola na família do envelope; o `pagante` como trava de expurgo; o cadastro de professores com **senha em hash + sal** (nunca em claro) |
| **EXISTE PARCIALMENTE** | **Chave estável dos campos**: existe para a folha de captura (`_declaracao`, rótulo↔chave↔tipo) e **não** para os 111 nós (a chave do derivado vem do rótulo visível); **identidade das entidades**: escola/ciclo/turma/termo têm id, **aluna e professor não**; **índice**: existe por escola (inventário, não lido pela aplicação) e por aula, **não** há índice invertido nem de consulta; **proveniência**: existe por campo e por elo de ajuste, **falta** o produtor de `ancora` e de `conteudo.digest`; **leitura do lançamento**: o dado **está gravado** e **não tem rota**; **relações**: existem derivadas por varredura (`vinculos`, `vinculosDePlano`) e faltam declaradas; **imutabilidade**: implementada para a anamnese (ajuste) e **não** para o PO (sobrescrito); **medidor de IA**: escrito e **nunca lido** |
| **NÃO EXISTE** | Cruzamento entre entidades, filtro, agregação e **busca textual**; **exportação**; leitor do lançamento; as cinco camadas de indexação do texto 1 §4 como camadas; o **conceito de «contexto»** (isolado × combinação), de **«componente»**, de **«intervenção docente»** e de **«resposta observada»** — medidos: **zero** ocorrências nos três conteúdos (§7); `modalidade` como campo (vive só na curadoria); a referência **curricular** versionada e os objetivos do **próximo nível**; tudo o comercial (plano, preço, assinatura, cobrança, cota, limite por plano); o vínculo persistido entre lançamento e versão do plano — **decidido em 15/10/2026 que passa a existir**, realiza-se em **L5** (§3 C3) |
| **PRECISA DE DECISÃO** | **C1** lançamento: fonte versionada × leitura do KV · **C2** namespace partilhado × separado (isolamento) · **C4** vínculo da aula ao marco por id · **C5** quais 3 e quais 7 consultas, e o que é «todas» quando o catálogo crescer · **C6** contagem de nós · **C7** leitor do medidor · **C8** valores comerciais como dado · **C9** a frase de B5 sobre os envelopes · **C10** os quatro conceitos ausentes do modelo (§3) — e, com ela, a ordem: acrescentar o vocabulário do domínio (L10) antes ou depois de L6 · **C11** onde vive o **estado comercial** (plano, período, pagamento, provisionamento) — KV × Git × D1 —, e, com ela, o achado de que **não existe lado público** na porta (§3). **Saiu desta lista em 15/10/2026: C3** — decidida (o PO/plano publicado passa a ter versão explícita que o lançamento referencia); as sub-decisões de desenho **S1–S4** foram **aprovadas no mesmo dia**, e as três **de produto** (**S5** o formato do ordinal · **S6** quando reancorar · **S7** como o formulário mostra a versão) foram **decididas em seguida** — o desenho de L5 está **completo** — §3 C3 e §L5 |

### 2.11 O que acontece quando o professor aciona «Gerar PO», operação por operação

> **Por que esta secção existe.** O texto 1 §2 pede-o literalmente: «o agente deve examinar o
> comportamento atual da aplicação para identificar **quais operações já acontecem** quando o
> professor gera o PO, **quais são executadas parcialmente** e **quais ainda não existem**» — e
> enumera seis. A tabela responde a essas seis, com o caminho no código.

| # | Operação (texto 1 §2) | Estado | Onde |
|:--|:--|:--|:--|
| 1 | **Publicação e disponibilização do PO** | **Acontece** | `escrever-po.js` → GitHub Contents API grava `ciclo-XX-<escola>-po.md`; o `.md` entra no `DOCS` e vai ao pacote |
| 2 | **Atualização dos menus e da navegação** | **Acontece, por regeneração** | o menu não é editado: é **reconstruído** por `tools/gerar-ciclo.sh` a partir do `DOCS` do `.conf`, e o `escrever-ciclo.js` liga o `DOCS` quando está vazio |
| 3 | **Disponibilização dos formulários de lançamento** | **Acontece parcialmente** | `declaracaoDeCaptura` + `derivarCaptura` geram a folha (`captura-aula-NN.md`) e a declaração de tipos; **mas** os `blocos`/`colunas` derivam das **dimensões do PO**, e o lançamento em si **não é lido por ninguém** (C1) |
| 4 | **Geração/atualização de documentos derivados** | **Acontece** | `escrever-ciclo.js` deriva **as outras seis fontes** (`aula-01`, `dados`, `referencias`, `notacao`, `glossario`, `harmonizacao`), e a política é **nunca sobrescrever** o que já existe |
| 5 | **Disponibilização das estruturas de consulta** | **Não acontece** | não há índice, tabela, view nem rota de consulta criada no «Gerar PO»; o que existe é o pacote estático + as leituras de chave da porta |
| 6 | **Criação/atualização dos vínculos** (plano ↔ ciclo ↔ aula ↔ elementos ↔ objetivos ↔ intervenções ↔ respostas) | **Acontece parcialmente, e só para dois elos** | **plano→PO**: `vinculosDePlano()` deriva do nó `plano-de-ensino` · **anamnese→PO**: `vinculos()` deriva de `sujeitos` · **aula→marco**: só o **texto** em `ciclos.json` (C4) · **elementos/objetivos/intervenções/respostas**: não existem como entidades — são **prosa** dentro de `dimensoes-observacao`/`itens-por-dimensao`, e «intervenção» e «resposta observada» **não existem** (§7) |

**A leitura honesta das seis:** duas acontecem por inteiro (1, 4), uma por regeneração (2), duas
parcialmente (3, 6) e uma não existe (5). E nenhuma delas **deixa rasto de vínculo**: o que o
«Gerar PO» produz é **documento**, não **relação** — a relação continua a ser recalculada por
varredura a cada leitura (`porta.js:371-414`).

---

## 3. Contradições — registadas para decisão, não decididas

> O pedido foi explícito: registar em vez de escolher em silêncio. Cada uma traz **o que o texto
> diz**, **o que o código faz** e **o que precisa de decisão**.

**C1 — O lançamento é gravado e não volta.** *O texto 1 §2* descreve o «Gerar PO» como o início
de operações derivadas, e *ARQUITETURA-GERAL.md §7* diz que o KV é rascunho e que «assim que
esses dados viram conteúdo de verdade, eles voltam a ser arquivo». **O código**: o lançamento
grava em `<escola>/<professor>/<ciclo>-<carimbo>/` (`lancamento.js:81-95`) e **nenhuma rota o
lê** — não há `listar` sobre essa família em `motor/`. O envelope é escrito e relido **só pela
porta**. Consequência: o registro da aula dada (o dado que o produto existe para guardar) está
no KV, sem leitor e sem caminho de volta ao Git. **Decisão**: o lançamento vira fonte
versionada (relatório pós-aula derivado, que a âncora já cobre) ou passa a ser lido direto do
KV por uma rota? *(Frentes L3, L4, L6.)*

**C2 — O isolamento entre escolas tem duas respostas.** O adaptador afirma *«O KV é
COMPARTILHADO entre escolas (o mesmo namespace)»* e namespaça `envelope/` e `ia-registro/` pelo
slug (`motor/adaptadores/cloudflare.js:28-47`); o `criar-escola.sh` grava o **mesmo** id para
toda escola nova — coerente. **Mas** `wrangler.maria.jsonc:32` liga **outro** namespace, e é
nele que estão os 3 envelopes da Maria — **sem** prefixo de escola. **Decisões**: (i) a Maria é
migrada para o namespace partilhado (e então as chaves existentes precisam ser renomeadas, ou o
adaptador procura `maria/envelope/…` e não acha); (ii) ou namespaces separados são a regra (e o
namespaçamento por slug vira redundante, e a consulta agregada entre escolas precisa de outra
porta). *(Frentes L1, L4, L9.)*

**C3 — Sobrescrita do PO/plano publicado.** *O texto 1 §6* pede que «a versão anterior não seja
silenciosamente sobrescrita» e que os registros sigam ligados à versão que os originou. **O
código**: o PO e o plano **são sobrescritos** (`escrever-po.js:71-92`, com `sha` — o histórico
fica no Git, o arquivo muda); as seis fontes derivadas **nunca** são (`escrever-ciclo.js`);
`ARQUITETURA-GERAL.md` §4.1-4.2 responde que «a história **é** o Git». **Decisão**: o histórico
do Git **basta** como versão de domínio, ou passa a haver versão explícita (`po` v1/v2) que o
lançamento referencia? *(Frentes L5, L3.)*

> ### ✅ C3 — RESOLVIDA em 15/10/2026
>
> *Registo como elo: o parágrafo acima é o que se pensava antes e **não** se apaga. O que segue é
> o que passou a valer.*
>
> **Decisão do produto, por palavras do dono do produto:** «**o PO/plano publicado passa a ter
> versão explícita que o lançamento referencia**». Isto responde à pergunta da frente L5 pelo
> lado que a torna maior, não menor: o Git **não basta** como versão de domínio — a versão passa
> a ser um **artefacto do sistema**, endereçável por quem lê o dado, e não um detalhe de quem
> versiona o repositório.
>
> **Os três factos medidos que delimitam a implementação** (todos em §2.7, medidos hoje):
>
> 1. **A deteção já existe; falta a preservação.** Editar um plano publicado **já** faz
>    `hash-ciclo.sh --check` acusar a divergência (provado em cópia de bancada), mas o `.fipp` é
>    **reescrito no lugar** e **não guarda o valor anterior** — e não tem campo de versão. A
>    mudança não é silenciosa para o **repositório**; é silenciosa para o **produto**.
> 2. **O padrão da casa para introduzir versão já existe** — `VERSAO_DO_ENVELOPE = '1.2.0'` com o
>    motivo da subida registado (`elicitar.js:81-86`). É esse padrão que se aplica ao plano.
> 3. **O lançamento já é imutável** (grava verbatim e recusa carimbo repetido,
>    `lancamento.js:88-92`) e **já tem identidade própria** (o carimbo). O que falta nele é
>    **uma linha**: a referência à versão do plano que ele observou.
>
> **O que a decisão ainda NÃO determina** — registado como sub-decisão, para não ser escolhido em
> silêncio (todas vivem em L5). **Nota do mesmo dia:** estas quatro foram **propostas e aprovadas**
> ainda em 15/10/2026, no fecho de §L5 — a lista abaixo fica como o **enunciado** delas, e o
> desenho aprovado está lá:
>
> - **S1 — Onde mora o ordinal da versão.** (a) no front-matter do próprio `.md` (`versao: N`) —
>   entra no `hash_conteudo`, e logo é **inforjável**: subir a versão muda o hash, e mudar o
>   conteúdo sem subir a versão também muda o hash, o que torna a edição não declarada
>   **detetável**; (b) em **arquivo por versão** — mas medido: a cobertura é **lista declarada**
>   (`DOCS` + um único `ARQUIVO_PO`), logo o arquivo da versão anterior **não entra na âncora
>   sozinho**, e declará-lo exigiria tocar `ARQUIVO_PO` no `.conf`; (c) em campo novo do `.fipp`
>   — ficaria **fora** da fórmula, como `po_state` e `ancorado_em` (por desenho,
>   `hash-ciclo.sh:32-34`).
> - **S2 — Onde mora o elo para a versão anterior.** O precedente existe e é bom
>   (`plano-aula-NN.json` → `-anterior.json`, `cp` antes do `mv`), mas está num artefacto
>   **derivado e sem consumidor**; esta decisão **dá-lhe o consumidor que faltava**. Falta dizer
>   se o elo é um **arquivo** (a disciplina do `cp`), um **campo do `.fipp`**, ou o **commit do
>   Git** — e, nesta última hipótese, qual commit fica declarado.
> - **S3 — A granularidade.** O PO e o plano são **por ciclo**; o lançamento é **por aula**. O
>   lançamento referencia a versão do plano **do ciclo em vigor**, a versão do **plano da aula**
>   (`plano-aula-NN`), ou ambas?
> - **S4 — A retroatividade.** O PO e o plano **já publicados** (Maria) **não têm versão**. São
>   declarados v1 **retroativamente** (derivado do facto de serem o estado publicado), ou ficam
>   «sem versão declarada» e a versão só passa a existir da próxima publicação em diante?
>
> **Não implementado.** Nesta fase — diagnóstico e planeamento — **nenhuma linha de produto foi
> escrita** para esta decisão; o que existe agora é a decisão, a medida e o desenho em L5.

**C4 — O vínculo da aula ao plano é por TEXTO.** `ciclos.json → aulas[].marco` guarda o **texto**
do marco do plano; se o plano muda a redação, o vínculo antigo não se reencontra. E o
lançamento não carrega referência nenhuma ao plano. **Decisão**: o vínculo passa a ser por id de
marco? *(Frentes L2, L5.)*

**C5 — O catálogo tem 8 e a distribuição pede 3/7/todas.** *O texto 2 §4* propõe oito perguntas
(T01–T05, P01–P03) e *§5* atribui 3 ao Básico, 7 ao Intermediário e «todas» ao Avançado — e o
próprio texto diz que *«a distribuição comercial exata deve ser validada quando o catálogo for
formalizado»*. **Decisão**: quais 3 e quais 7, e o que «todas» significa quando o catálogo
crescer (a cota acompanha o catálogo ou congela no que existia na contratação?). *(Frentes L6,
L9.)*

**C6 — Duas contagens de nós.** Ver §2.2. Registada; `FRENTES.md` não foi alterado.

**C7 — O medidor de uso é escrito e nunca lido.** Ver §2.9. O «acompanhamento da utilização» do
*texto 2 §2* não tem, hoje, como ser observado. *(Frente L7.)*

**C8 — Os valores comerciais não estão no sistema.** O *texto 2 §9* trata os valores como
«parâmetros comerciais a validar no sistema». No repositório **não existem**. Não os copiei para
o código (não há para onde); ficam aqui como **parâmetros declarados a implementar**, com a
origem nomeada. *(Frente L8.)*

**C9 — O registo de FRENTES B5 não corresponde ao medido.** `FRENTES.md:294` afirma «o «envelope
vivo» era **fantasma** — a KV não tem um único envelope». Medido hoje: existem **3 envelopes**
na Maria (12/10) e **1 anamnese** no cofre. Não sei se a frase se referia ao namespace
partilhado ou se foi medida antes daqueles dados existirem — **não escolho**: registo, e a
medição está em §2.3. *(Afecta a leitura das decisões de B5.)*

**C10 — Quatro conceitos com que os textos formulam as perguntas não existem no modelo.**
O texto 2 pergunta por «**componentes** técnicos», «**combinações**», por «**intervenções
docentes e respostas observadas**» e por uma **matriz de objetivos × contexto** — e o texto 1 §7
exige que o modelo relacione «elementos técnicos, **componentes**, exercícios e **combinações**» e
«**intervenção docente e resposta observada**». **Medido nos três conteúdos** (§7): `componente`
**0**, `combina` **0**, `interven` **0**, `resposta observada` **0** ocorrências; `modalidade`
aparece **2 vezes, em prosa** dentro de uma explicação da anamnese («tempo de exposição à
modalidade») e **não** como campo — a modalidade vive, hoje, só na **curadoria** do KV
(`bastidores/<escola>/curadorias`). O mais próximo que existe é `itens-por-dimensao` (PO) para
«componente», e `aula-1-sequencia`/`estrutura-de-cada-aula` (plano) para a ideia de sequência —
**mas o «contexto» (isolado × combinação) não é modelado como relação**, é prosa dentro de um
item. **A consequência é de escopo:** quatro das oito perguntas do catálogo **não** são
«implementar um filtro» — pedem **vocabulário novo no domínio**, e decidir esse vocabulário é
decisão de **conteúdo** (P-16), não de infraestrutura. **Não escolho** se ele se acrescenta antes
ou depois do catálogo: registo a contradição e proponho a frente **L10** (§4) como o lugar da
decisão. *(Afeta L6 — e é a razão pela qual L6 não pode ser a primeira.)*

**C11 — A porta não tem lado público, e a habilitação tem duas fontes — nenhuma delas do
pagamento.** Três medições, e as três afetam o ponto de partida de L11.

1. **O rascunho da frente L11 afirma** que existem «dois fluxos de acesso»: um administrativo
   autenticado e um «**acesso público sem autenticação administrativa**», que «permite iniciar a
   criação de uma nova escola». **O código não tem o segundo.** Há **um** portão — `autorizado()`
   em `motor/servidor/raiz.js:32`, conferido uma única vez em `raiz.js:268` — e ele cobre **tudo**
   menos uma rota: a página inteira (o ASSETS), `/api/criar-escola` (`raiz.js:457`),
   `/api/apagar-escola` (`:351`), `/api/escolas` (`:321`), `/api/professores` (`:307`) e
   `/api/expurgar` (`:281`). O **único** caminho sem senha é `/api/saude` (`:261`), que é sonda de
   saúde. Medido no ar: `/` sem credencial → **401**. **A consequência para L11 é de escopo:**
   «ampliar o fluxo público» não é ampliar — é **construir** o lado público e **separá-lo** do
   lado administrativo, que hoje é o mesmo. E o risco é o oposto do que o rascunho supõe: não é o
   público ver o administrativo, é **não haver público nenhum** para onde levar o pagamento.
2. **A habilitação de uma escola tem duas fontes, em dois Workers.** `ESCOLA_HABILITADA` é uma
   **variável do Worker da escola** (`wrangler.fita.jsonc`: `"ESCOLA_HABILITADA": "sim"`) — muda
   por `wrangler deploy` da escola; `raiz/escolas-habilitadas.json` é um **asset da raiz** — muda
   por deploy da raiz. O **expurgo** decide por esta segunda (`raiz.js:229`, `reg.pagante === true`
   → «escola pagante — não se apaga»), e o **Worker da escola** decide pela primeira. As duas
   concordam hoje por disciplina, não por **uma** regra — e nenhuma das duas **existe** para o
   pagamento.
3. **Nenhuma das duas é dinâmica, e nenhuma sabe de pagamento.** O andaime declara a própria
   morte — «Quando a Produção nascer, este arquivo SAI e a flag passa a viver no `ESCOLA.conf`» —
   e `pagante` é a **única** pegada comercial do código, com um significado só: **não apagar**
   (§2.9). Não há campo que diga *desde quando* a escola paga, *até quando*, *quanto*, nem *qual
   plano* — e as duas mudanças exigem **deploy**, que não é o que um webhook de pagamento pode
   fazer.

**A decisão que fica por tomar** — e que **precede** qualquer implementação de L11: **onde vive o
estado comercial** (plano, período, pagamento confirmado, provisionamento). Três candidatas, com o
que cada uma custa: **KV** (existe o `PADD_KV` compartilhado; o rascunho propõe um namespace novo
e exclusivo — mas o KV não oferece garantia transacional nem de unicidade, e é o lugar errado para
uma decisão de dinheiro); **Git** (já é o mecanismo com que o expurgo escreve estado — §L11, «o
commit do expurgo» —, é versionado e auditável, mas põe estado financeiro no histórico do produto
e depende do `GITHUB_TOKEN`); e uma terceira que este documento **não tinha considerado antes
desta frente**: o **Cloudflare D1** (banco com transação, no mesmo runtime, sem servidor nem VPS).
Escolher entre as três é decisão de **arquitetura**, e vem **antes** do modelo de estados —
registo-a aqui em vez de a presumir. *(Afeta L11 e L9: é a mesma pergunta que C2 e o «onde a
habilitação do plano vive» — §8, declarado — já faziam, agora com as mãos no dinheiro.)*

---

## 4. As frentes

Onze frentes. Cada uma traz os oito itens pedidos. A **prioridade** é sugerida — a decisão é sua.
A classificação do que existe hoje está em **§2.10**; o catálogo pergunta por pergunta, em **§7**;
e a cobertura de cada requisito dos dois textos, em **§8**.

**Quadro-resumo** (para priorizar — o detalhe de cada frente está na sua secção):

| # | Frente | Prioridade | Destranca | Depende de |
|:--|:--|:--|:--|:--|
| **L1** | Dicionário de campos: chave-valor para os 111 nós | **P0** | L2, L4, L6, L10 | — |
| **L2** | Identidade estável das entidades e das referências | **P0** | L3, L4, L6, L9 | — (cruza L1 em `sujeitos`) |
| **L10** | O vocabulário do domínio que falta (contexto · componente · intervenção · resposta) | **P1** | 4 das 8 perguntas (§7) | L1, L2 · **decisão de conteúdo (P-16)** |
| **L5** | **Versão explícita do plano publicado** — a que o lançamento referencia | **P1** | L3, L6 | **desenho completo**: C3 decidida · **S1–S4 aprovadas** · **S5–S7 decididas** (15/10/2026) |
| **L3** | O lançamento e o envelope deixam de ser rascunho | **P1** | L4, L6 | L1, L2 · decisão **C1** · **carrega a referência de versão de L5** |
| **L4** | Mapa de relações e índice | **P2** | L6 | L1, L2, L10, L3 |
| **L6** | O catálogo de consultas determinísticas | **P2** | L9 | L1–L4 **+ L10** |
| **L7** | A fronteira da IA e a medição de uso | **P2** | L9 | (independente do dado) |
| **L8** | Composição comercial e a fonte única dos valores | **P3** | L9 | confirmação dos valores (**C8**) |
| **L9** | Cotas, habilitação e limites por plano | **P3** | — | L6 + L7 + L8 · decisão **C2** |
| **L11** | A porta paga: cobrança, verificação e liberação de escolas | **P2** | o lado público da porta | L8 (o valor) · **decisão C11** (onde vive o estado) · **dependências externas** (provedor) |

> **A trilha mais curta até valor entregue:** L1 + L2 → L3 → L4 → **T01 ou P01** (as duas únicas
> perguntas do catálogo que ficam viáveis sem decisão de conteúdo — §7). O resto do catálogo
> espera por L10.

### L1 — Dicionário de campos: chave-valor para os 111 nós

- **Objetivo e justificativa.** Cada campo dos três formulários passa a ter **chave estável,
  declarada e independente do texto visível**, com significado, tipo, origem, obrigatoriedade e
  relações — de modo que uma alteração de redação na interface não rompa o que já foi
  registado. É a base de tudo o que vem depois: sem chave estável, nenhuma consulta, nenhum
  índice e nenhuma proveniência se sustentam.
- **Situação atual.** O `id` do nó é estável e vive no conteúdo (`porta/**/conteudo/*.json`);
  o envelope é chave-valor por `id` do nó (`respostas.<id>`); **mas** a chave no documento
  derivado é **derivada do rótulo** (`chaveDaColuna`, `tools/lib-extracao-md.js`) — e o
  precedente certo existe **só** na folha de captura (`_declaracao.porVariante.…colunas.<rótulo>
  → {chave, tipo}`). Ver §2.4 e §2.2 (101 dos 111 nós são texto simples).
- **Lacunas.** (1) Não existe dicionário único dos 111 nós; (2) a chave derivada do rótulo muda
  quando a redação muda; (3) não há campo declarado «documentos/consultas que usam este campo»;
  (4) não há versão da definição do campo; (5) a distinção valor informado × valor derivado
  existe no envelope (`origem`/`respondente`) e **não** está declarada no dicionário.
- **Dependências técnicas e de domínio.** Do domínio: a redação final dos rótulos (trava
  P-16 — não inventar conteúdo). Técnicas: os validadores (`tools/validar-*-ciclo.js`) e o
  `porta.mapa()`; e a lacuna **(4)** desta frente — a versão da **definição** do campo, que é
  coisa distinta da versão do **documento** decidida em **C3**.
- **Entregas.** (a) O dicionário dos 111 nós num arquivo versionado, gerado do conteúdo (não
  escrito à mão) — id, rótulo, chave, tipo, obrigatoriedade, dono (formulário/nó), origem
  possível, documentos que o consomem; (b) o **validador** que reprova nó sem chave declarada e
  chave duplicada; (c) a migração das chaves derivadas do rótulo para as chaves declaradas,
  preservando a leitura das fontes já publicadas.
- **Critérios verificáveis.** (i) `node tools/<validador-do-dicionário>` sai 0 e cobre 111/111
  nós; (ii) renomear o rótulo de um nó **não** altera nenhuma chave extraída — provado por
  teste que troca o rótulo e reconfere o JSON derivado; (iii) o dicionário é **gerado**: rodar
  duas vezes produz o mesmo arquivo; (iv) as fontes publicadas (Maria, Marau) continuam
  extraindo exatamente os mesmos valores de hoje (regressão byte a byte).
- **Riscos e decisões por confirmar.** (a) a **lacuna (4)** — a versão da **definição** do campo
  (que **não** é a versão do documento, decidida em C3); (b) se a chave declarada
  substitui ou convive com a derivada (a convivência pode ser permanente para leitura legada);
  (c) C2 (o dicionário é por escola ou global?).
- **Prioridade.** **P0** — bloqueia L2, L4, L6. É a primeira a executar.

### L2 — Identidade estável das entidades e das referências

- **Objetivo e justificativa.** Dar identificador estável a **aluna** e a **professor** (hoje o
  da aluna é o apelido, o do professor é uma função do nome — §2.4), e converter as referências
  que hoje apontam para **texto visível** (curadoria → turma por nome; aula → marco por texto)
  em referências por id. Sem isto, renomear uma turma ou corrigir a grafia de um nome **rompe
  silenciosamente** o vínculo — e as consultas por trajetória devolvem nada.
- **Situação atual.** Estáveis e corretos: escola, ciclo, turma (`bale-nivel-1`), termo
  (`plie`) e a relação turma↔termo (chaveada por id — **o bom exemplo do repositório**, medido).
  Instáveis: `alunas: ["Vavá"]` (sem id), `professores: [{nome, sal, hash}]` (sem slug — o slug
  é derivado na leitura), `curadorias[].turmas: ["Balé Nível 1"]` (nome), `aulas[].marco`
  (texto).
- **Lacunas.** Não há registro de entidades com id; não há id na aluna; o professor não tem slug
  persistido; a curadoria referencia por rótulo; o apelido é a única chave de correlação entre
  anamnese, PO e lançamento (é ele que liga tudo — e é texto).
- **Dependências técnicas e de domínio.** Domínio: **P-12** (apelidos estáveis, nunca nome
  completo) — o id **não pode** ser o nome real nem dados de menor; e a decisão de se a aluna
  pertence à escola ou ao professor (P-13). Técnicas: as coleções do KV, o adaptador, a porta
  (`daCuradoria`), e L1 (a chave do campo `sujeitos`).
- **Entregas.** (a) Registro de entidades com id estável e migração dos dados existentes
  (alunas, professores) — preservando o apelido como **rótulo**, não como chave; (b) a regra de
  composição de id documentada e validada (slug estável, sem dado pessoal); (c) a conversão das
  referências por rótulo em referências por id, com **leitura legada** do que já está gravado;
  (d) o mapa de relações (§2.5) declarado em arquivo, não derivado por varredura de leitura.
- **Critérios verificáveis.** (i) Renomear uma turma **não** quebra a curadoria (teste: renomeia
  e reconfere o vínculo e a consulta); (ii) corrigir a grafia do nome do professor **não** muda
  a pasta nem o vínculo; (iii) nenhum id contém nome completo, contato ou dado de saúde (teste
  por padrão sobre os dados reais); (iv) os dados já gravados no KV continuam resolvendo depois
  da migração; (v) as consultas de trajetória (L6) devolvem o mesmo conjunto antes e depois da
  migração.
- **Riscos e decisões por confirmar.** (a) **Risco alto**: dois apelidos iguais em escolas
  diferentes / duas alunas com o mesmo apelido; (b) a fusão de identidades (duas fichas da mesma
  pessoa); (c) a aluna é da escola ou do professor — e o que acontece no expurgo de uma escola
  (`escola/<escola>/indice.json` já registra o que apagar); (d) **C4** (o vínculo por id) e o que
  a **versão** de L5 passa a congelar das referências.
- **Prioridade.** **P0** — paralela a L1 (L2 não depende de L1 para começar, mas as duas se
  cruzam no nó `sujeitos`).

### L3 — O lançamento e o envelope deixam de ser rascunho

- **Objetivo e justificativa.** Fechar o buraco maior do diagnóstico: o registro da aula dada é
  gravado e **não tem leitor** (C1), e a proveniência de entrada está declarada e vazia
  (`ancora: null`, `conteudo.digest: null`, §2.7). Sem isto, o produto guarda dados que não
  consegue devolver — e a própria âncora não sabe contra que versão do conteúdo se respondeu.
- **Situação atual.** Escrita: `lancamento.lancar` (`motor/nucleo/lancamento.js:81`),
  `gravarEnvelope` (`porta.js:351`), `guardarAnamnese` (`cofre.js:128`). Leitura: **só** o
  envelope (pela porta) e o cofre (`GET /api/anamnese`). O lançamento: **nenhuma**. E o
  envelope é lido por **varredura completa** da família (§2.5).
- **Lacunas.** Não há rota que leia um lançamento; o lançamento não vira fonte versionada nem
  alimenta os relatórios pós-aula **que a âncora já cobre**; `ancora` e `digest` não têm
  produtor; o envelope não fica ligado à versão do conteúdo nem à do plano.
- **Dependências técnicas e de domínio.** L1 (chaves das colunas) e L2 (id da aluna) para o
  lançamento ser legível por chave e não por apelido; `tools/lib-fontes.sh` para decidir o que
  entra na âncora; e a decisão C1.
- **Entregas.** (a) A rota de leitura do lançamento (listar/ler por escola-professor-ciclo);
  (b) a materialização do lançamento em **fonte** (o relatório pós-aula derivado, que a âncora
  já cobre, em `professores/<p>/relatorios/ciclo-NN/`), ou a decisão explícita de o manter no KV
  com leitor; (c) `conteudo.digest` preenchido (hash do conteúdo do formulário no momento da
  resposta) e `ancora` com produtor; (d) o registro de **aula planejada × aula realizada** com
  o mesmo rigor do resto (aula não realizada **não** é evidência de realização).
- **Critérios verificáveis.** (i) Lançar uma aula de teste e **ler de volta** pela rota, com o
  mesmo conteúdo; (ii) o documento derivado do lançamento entra na cobertura da âncora
  (`hash-ciclo.sh --check` passa a acusar divergência quando ele muda); (iii) `ancora` e
  `conteudo.digest` não nulos nos artefatos novos, e a ausência deles nos antigos declarada
  (não inventada); (iv) nenhuma ausência de observação é apresentada como resultado (teste
  sobre a saída).
- **Riscos e decisões por confirmar.** (a) C1 (fonte versionada × leitura do KV) — decide o
  desenho todo; (b) dados pessoais de menores no KV: o que se materializa como arquivo público
  (o pacote é público; a P-12 e a cifra existem por isso); (c) reancorar o passado quando o
  lançamento passa a ser fonte (o que muda em ciclos já ancorados).
- **Prioridade.** **P1** — depois de L1/L2 começarem; é o que transforma dado guardado em dado
  recuperável.

### L4 — Mapa de relações e índice

- **Objetivo e justificativa.** Substituir a varredura completa dos envelopes (§2.5) por
  **relações declaradas e consultáveis** e por **índices** adequados — sem inventar índice para
  cada propriedade, mas garantindo que exista o que as consultas reais precisam. É a diferença
  entre «o dado está lá» e «o dado se encontra».
- **Situação atual.** Relações **derivadas por varredura em memória** (`vinculos()`,
  `vinculosDePlano()`); índice por escola existe e a aplicação não o lê
  (`escola/<escola>/indice.json`); índice por aula existe (`ciclos.json → aulas[]`); **não há**
  índice invertido, busca textual nem exportação (§2.6). O KV oferece apenas `get/put/list` por
  prefixo (`motor/nucleo/armazenamento.js`).
- **Lacunas.** As cinco camadas que o texto 1 §4 separa não existem como camadas: há
  identificação semântica parcial (id de turma/termo), relacionamento informal (texto),
  indexação técnica inexistente, indexação documental inexistente, e indexação para consulta
  inexistente.
- **Dependências técnicas e de domínio.** L1 (chave dos campos) e L2 (id das entidades) —
  o mapa de relações é a consequência das duas. Decisão C2 (o índice é por escola ou
  transversal?).
- **Entregas.** (a) O **mapa de relações** declarado (entidade → entidade, por qual chave, com
  cardinalidade), versionado e validado; (b) os **documentos de índice** que o gerador
  reconstrói (por ciclo: aulas × marcos × blocos × aluna; por escola: turmas × termos ×
  alunos × curadorias) — reconstruíveis, como o resto (P-04); (c) a generalização do
  `escola/<escola>/indice.json` de inventário de arquivos para inventário **de dados**; (d) a
  definição do que **não** é indexado (e por quê — minimização de dados, §8 do texto 1).
- **Critérios verificáveis.** (i) O mesmo resultado de `vinculos()` antes e depois, com
  **zero** varredura de envelopes na rota (medido por contagem de leituras); (ii) os índices são
  **reconstruíveis**: apagá-los e regenerar produz o mesmo arquivo; (iii) o mapa de relações
  reprova relação declarada cuja chave não existe no registro de campos/entidades; (iv) o
  índice não expõe dado pessoal além do apelido (teste por padrão).
- **Riscos e decisões por confirmar.** (a) Índice é dado derivado (fora da âncora) ou fonte
  (dentro)? — se ele entrar na âncora, cada lançamento reancora o ciclo; (b) C2; (c) o índice
  por escola pode virar superfície de exposição entre escolas — precisa da decisão de
  isolamento antes de existir.
- **Prioridade.** **P2** — habilita L6; não bloqueia L3.

### L5 — Versão explícita do plano publicado, que o lançamento referencia

> **Decidida em 15/10/2026** (§3 C3): o PO/plano publicado **passa a ter versão explícita**, e o
> **lançamento a referencia**. O Git **não basta** como versão de domínio. A frente deixa de
> esperar decisão e passa a ter escopo; as sub-decisões de desenho **S1–S4** foram **aprovadas**
> em 15/10/2026 (ver o fecho desta secção), e as três de produto (**S5–S7**) foram **decididas em
> seguida** — o **desenho de L5 está completo** — §3 C3.

- **Objetivo e justificativa.** Que o PO publicado preserve a versão que serviu de referência à
  observação, e que uma alteração posterior **não** faça parecer que o professor observou o que
  não estava previsto — o pedido do texto 1 §6. Hoje o PO **é sobrescrito** e os registros
  **não referenciam versão nenhuma**.
- **Situação atual (medida — §2.7).** `escrever-po.js:71-92` e `escrever-plano.js` atualizam com
  `sha` (sobrescrevem; o histórico fica no Git); `escrever-ciclo.js` **não** sobrescreve; a
  âncora existe por ciclo **e por aula**; o `.fipp` **deteta** a mudança mas é **reescrito no
  lugar** e não tem campo de versão nem elo para o estado anterior; o único elo do plano
  (`plano-aula-NN-anterior.json`) é **derivado e sem consumidor**; `VERSAO_DO_ENVELOPE`
  (`elicitar.js:86`) é o **padrão** de como a casa introduz uma versão, mas versiona o envelope,
  não o plano; o lançamento **já é imutável** e tem carimbo próprio, faltando-lhe só a referência
  de volta.
- **Lacunas.** Não há **versão de domínio** do PO/plano (ordinal, identidade e regra de quando
  sobe); não há **elo** para a versão anterior fora do Git; o lançamento **não diz** a que versão
  se refere; não há regra verificável que separe «correção antes de publicar» de «mudança depois
  de observado»; o ajuste está implementado **para a anamnese** e não para o PO.
- **Dependências técnicas e de domínio.** L3 (é o registro que **carrega** a referência — sem
  leitor do lançamento, a versão fica declarada e não consultável); a âncora por aula
  (`ARQUITETURA-AULA.md` §5.2); a regra planejada → ajuste (`ARQUITETURA-AULA.md`); e, se S1
  escolher a opção (b), o **congelado** `tools/lib-fontes.sh` / `tools/hash-ciclo.sh` (a cobertura
  é lista declarada — §2.7).
- **Entregas.** (a) A **regra escrita**: o que pode ser editado e quando, e o que **cria** versão
  nova; (b) a **versão explícita** do PO e do plano, com o **elo** para a anterior no mesmo
  desenho do ajuste da anamnese (e, aqui, **dando consumidor** ao par `-anterior` que já existe);
  (c) o **vínculo do lançamento à versão** que ele observou; (d) o validador que **reprova**
  operação capaz de reescrever o passado.
- **Critérios verificáveis.** (i) Alterar um PO já utilizado por lançamentos **produz versão
  nova e elo** (ou é recusado) — **nunca** sobrescreve em silêncio: o teste altera e confere o
  estado antes/depois; (ii) cada lançamento **declara a versão que observou**, e «qual versão
  estava em vigor nesta aula?» é **respondível** a partir do lançamento; (iii) a versão anterior
  é **recuperável** sem depender de `git` — é artefacto do sistema; (iv) `hash-ciclo.sh --check`
  continua a acusar a divergência de uma fonte alterada (**já funciona** — provado) e **não**
  acusa o que não é fonte; (v) subir a versão **não** reescreve nenhum lançamento já gravado
  (o carimbo imutável é conferido no teste).
- **Riscos e decisões por confirmar.** (a) **S5–S7 decididas** (o desenho está **completo**); o que
  resta é a **obra** — e o risco de ela virar burocracia, que é o risco (c) abaixo; (b) custo de reconstruir o passado já publicado; (c) risco de a versão explícita virar burocracia que o
  professor evita — o produto **não pode punir a correção** (P-03/P-04: a proveniência
  acrescenta); (d) se a versão entrar no `hash_conteudo` (S1-a), **toda** mudança de versão
  reancora o ciclo — o que é correto, mas muda o hábito de ancoragem.
- **Prioridade.** **P1** — destravada por C3; destrava **L3** (a referência precisa de um registro
  que a guarde) e alimenta **L6** (a pergunta «qual versão estava em vigor?» só é respondível se
  existir). Começa pela **regra**, depois pelo ordinal, depois pelo vínculo no lançamento.

#### Proposta de desenho para S1–S4 *(15/10/2026, ainda sem código — a proposta tal como foi feita; a **aprovação** está no fecho desta secção)*

> Cada sub-decisão traz a **recomendação**, o que a sustenta **na medição** e o que ela **custa**.
> Nada aqui está decidido: está proposto.

**O que a medição mostrou antes de propor — o encaixe já existe, falta ligá-lo:**

- As fontes publicadas **já têm frente YAML**: `ciclo-01-maria-po.md` e `-plano.md` começam por
  `--- projeto: … frente: … ---`. Não é mecanismo novo — é uma chave nova numa estrutura viva.
- O leitor dessa frente **existe e está em uso**: `lerYamlCabecalho`
  (`tools/lib-extracao-md.js:56`) é chamado pelos **quatro** validadores (plano, PO, aula,
  captura). E o **`plano-NN.json` que o pacote publica é a saída JSON desse mesmo validador**
  (`gerar-ciclo.sh:215-216` → `validar-plano-ciclo.js --json`) — o artefacto que o formulário já
  lê passa exatamente pelo código que **já lê a frente**.
- O **formulário de lançamento já busca `po-XX.json` e `plano-XX.json`** no pacote, por convenção
  de nome (`tools/templates/lancamento.html:283-300`). O lançamento **pode declarar a versão que
  observou** sem rota nova.
- Os documentos **derivados já emitem frente** (`derivar-plano-ciclo.js:524` → `frente`, `ciclo`,
  `escola`, `professor`, `title`): uma frente que nomeia **versão** segue a mesma convenção.

**S1 — o ordinal mora na frente YAML da fonte. Recomendo `versao: N`.**
Sustentação: a frente inteira faz parte do conteúdo hasheado (o `hash_conteudo` é calculado sobre
o **arquivo**, `hash-ciclo.sh:191-193`), logo o ordinal fica **dentro da âncora e inforjável** —
subir a versão muda o hash, e mudar o conteúdo sem subir a versão **também** muda o hash, o que
torna a edição não declarada **detetável**. Custa: uma chave na frente de cada fonte, mais expor o
`meta` na saída `--json` dos validadores (**uma linha**) para a versão chegar ao pacote e ao
formulário. **Rejeito** a versão em **arquivo separado** (`po-v2.md`): medido, a cobertura é lista
declarada com um **único** `ARQUIVO_PO` — o irmão não seria testemunhado pela âncora, e apontar
`ARQUIVO_PO` para o novo tornaria a versão **antiga permanentemente não verificável** (o
`hash_conteudo` dela nunca mais poderia ser recalculado), que é o oposto do objetivo. **Rejeito** o
ordinal no `.fipp` como autoridade — o `.fipp` é regenerado e os seus campos ficam **fora** da
fórmula — mas **aceito-o como espelho**, opcional, para quem lê a cadeia à mão.

**S2 — o elo é o par no `.fipp` mais o lançamento.** Recomendo: (i) o gerador da âncora **lê o
`.fipp` anterior antes de o reescrever** (já o lê, no `--check`) e grava `versao_anterior` +
`hash_conteudo_anterior`, com a mesma disciplina do `cp` **antes** do `mv` de `gerar-ciclo.sh:254`
— interrompido, o resultado é «sem elo», como hoje; (ii) e o **lançamento**, declarando a versão
que observou, torna-se o **testemunho de domínio** da transição: se um lançamento diz v1 e o
seguinte diz v2, a passagem está testemunhada pelo **dado**, não por um artefacto — que é o
princípio da casa («o ajuste não se declara, ele se vê», P-03/P-04). Custa: um par de campos no
gerador e a ordem deliberada que ele já usa. **Isto dá o consumidor que `plano-aula-NN-anterior`
nunca teve.**

**S3 — a referência é às FONTES, por documento; o derivado não ganha ordinal próprio.**
Recomendo que o lançamento registe **duas** versões — a do **PO** e a do **plano** —, porque as
duas fontes são cobertas pela âncora e mudam **independentemente** (um ordinal conjunto não saberia
dizer qual das duas avançou). O `plano-aula-NN.json` **não** ganha ordinal: é derivado, regenerado
a cada geração, e já tem o seu elo (`-anterior`); dar-lhe versão própria criaria **duas
autoridades** para o mesmo facto. Custa: dois campos no JSON de lançamento, que hoje não tem
nenhum (`{ciclo, escola, aulas, apelidos}`).

**S4 — não retroagir: ausência de `versao` significa «legado», e a regra é declarada.**
Recomendo **não** declarar v1 retroativamente para o que já está publicado (Maria): afirmar que
«a versão em vigor era v1» é afirmar algo que **ninguém testemunhou**, e a casa não inventa valor
que não foi medido. Custa: a ausência vira um **estado com nome** — o validador **avisa** (não
reprova) quando a fonte não declara `versao`, e é o **escritor** que a carimba ao salvar, porque é
ele — o caminho que **sobrescreve** — que sabe que está produzindo uma versão nova. Nota que
facilita a decisão: **não existe hoje nenhum lançamento contra o PO da Maria** (o único lançamento
gravado é o de `diaghilev/fokini`), logo a retroatividade não tem consumidor.

**A regra de quando a versão sobe — e ela não é uma quinta decisão, é consequência de S1–S2.**
Sobe quando o **conteúdo muda**: o escritor compara o hash do que vai gravar com o `hash_conteudo`
em vigor; igual → **mesma versão, sem elo**; diferente → **versão nova + elo**. E a distinção que
o texto 1 §6 pede — «correção antes de publicar» × «mudança depois de observado» — **não é
questão de versionamento e sim de lançamento**: se **nenhum** lançamento referencia a versão N, a
edição é correção; se algum referencia, é mudança depois de observado, e o produto **recusa** ou
**avisa em alto e bom som**. É isto que os critérios (i) e (v) de L5 verificam.

**O que esta proposta não faz.** Não escolhe o **formato** do ordinal (número sequencial ou data
+ sequência), não decide se a mudança de versão **reancora na hora** ou no fecho do ciclo, e não
define como o formulário **apresenta** a versão ao professor — três pontos que ficam para a
aprovação, porque os três são **de produto** e não de encaixe técnico.

#### ✅ S1–S4 — APROVADAS em 15/10/2026, **como proposto**

> *A proposta acima fica **como está** — é o que se pensou e o que se propôs. O que segue é o que
> passou a valer. A proveniência acrescenta; não edita.*

**Decisão do dono do produto:** aprova **S1–S4 como propostos**. A aprovação é do **desenho**, não
da implementação. Valem, portanto, as quatro recomendações: **S1** ordinal na frente YAML da fonte
· **S2** elo no par do `.fipp` **mais** o lançamento como testemunho · **S3** referência às
**fontes**, por documento, sem ordinal no derivado · **S4** sem retroação, com a ausência
declarada como **legado**. E vale a regra que delas decorre: **a versão sobe quando o conteúdo
muda** (igual → mesma versão, sem elo), e a distinção «correção antes de publicar» × «mudança
depois de observado» **resolve-se pelo lançamento**, não pelo versionamento.

**O que a aprovação NÃO fechou — três pontos de produto, agora com nome próprio** (a proposta já os
declarava fora do seu escopo; a aprovação não os puxou para dentro):

- **S5 — o FORMATO do ordinal.** Número sequencial (`versao: 2`), ou data + sequência
  (`versao: 2026-10-15.1`)? O número é simples de ler e de comparar; a data diz **quando** sem
  consultar o Git.
- **S6 — QUANDO reancorar.** A subida de versão reancora **na hora** (o `.fipp` acompanha cada
  publicação) ou **no fecho do ciclo** (a âncora consolida o ciclo inteiro)? A primeira mantém a
  cadeia sempre verificável; a segunda escreve menos e deixa janelas de divergência.
- **S7 — COMO o formulário mostra a versão** ao professor — e **se** mostra. Mostrar é
  transparência; mostrar demais convida a que o professor «escolha» versão, o que o produto não
  quer.

Nenhum dos três bloqueia o começo da implementação — mas os três mudam o que se escreve, e por
isso **não** foram decididos por omissão.

**Estado deste elo:** **desenho aprovado, nada implementado.** Nenhuma linha de código de produto
foi escrita — nem na proposta, nem na aprovação.

#### ✅ S5–S7 — DECIDIDAS em 15/10/2026 *(o desenho de L5 fica completo)*

> *O enunciado acima fica como o que se perguntou. O que segue é o que passou a valer.*

**S5 — número sequencial inteiro** (`versao: 2`). O argumento não é gosto: é a **regra 6** do §6 —
*determinismo*. Uma data dentro da versão faz o artefacto **depender do relógio** e deixar de ser
reconstruível; e o «quando» **já existe em três lugares** — `ancorado_em` no `.fipp`, o **carimbo**
do lançamento e o Git. Pôr a data na versão **duplicaria** o que já existe, e informação duplicada
diverge. A função da versão é **ordenar e endereçar**, não datar. *(Nota técnica: o leitor da frente
devolve strings — `lib-extracao-md.js:67` —, logo o número precisa de coerção; o formato data
precisaria de um parser.)*

**S6 — reancorar na hora**, a cada publicação. **Medido: qualquer edição numa fonte coberta já faz o
`--check` falhar hoje.** Adiar para o fecho do ciclo **institucionalizaria um estado que a ferramenta
reporta como erro** — a janela de divergência passaria a ser o normal, e o `--check` deixaria de
servir como cadeia de custódia. E a versão e o `hash_conteudo` têm de **andar juntos**, senão podem
contradizer-se; o elo de **S2** só é inequívoco **no instante em que a versão sobe**. Custo: nenhum
novo — a exigência já existe hoje.

**S7 — mostrar discreto e somente-leitura.** O argumento é de produto: **o professor não pode
escolher a versão**. A referência é **observada e registada**, não **selecionada** — se fosse
selecionável, a evidência seria falsificável, e o produto perderia exactamente o que esta decisão
veio proteger. Em troca, ele **deve** ver contra que versão lançou: é isso que faz uma alteração
posterior não parecer que observou o que não estava previsto. O **alerta** (a versão mudou desde o
último lançamento) fica para quando **L3** der leitor ao lançamento — sem leitor, não há com o que
comparar.

**Com isto o desenho de L5 está completo:** a decisão (**C3**), o desenho (**S1–S4**) e as três
questões de produto (**S5–S7**) estão fechados. **Nada implementado** — o que falta é a obra, não a
decisão.

### L6 — O catálogo de consultas determinísticas

- **Objetivo e justificativa.** Responder, por **regras determinísticas**, às perguntas que o
  professor faz sobre a trajetória das suas alunas — organizando o que já está registrado e
  permitindo abrir o registro original. É a frente que dá valor comercial ao acervo, e a única
  em que o produto se diferencia sem tocar na qualidade do dado.
- **Situação atual.** **Nada existe** (§2.8). Não há cruzamento entre entidades, nem filtro,
  nem agregação. As listas que existem são leitura de chave ou varredura de prefixo. E das oito
  perguntas do texto 2, **nenhuma** é respondível hoje — três são de **cruzamento** (T01, T03,
  P01) e **quatro exigem vocabulário que o modelo não tem** (T02, T04, T05, P02): ver **§7**,
  pergunta por pergunta.
- **Lacunas.** (a) As 8 perguntas do texto 2 não têm especificação de entradas, filtros,
  agrupamentos e saídas — a **classe** de cada uma já está medida no **§7**; (b) o dado de que
  elas dependem **não é legível** (C1); (c) não há chave estável para cruzar (L1/L2); (d) não há
  identificador estável de consulta — o texto usa `T01…P03`, que é um começo, e a distribuição
  comercial precisa que os ids sejam estáveis; (e) **quatro perguntas dependem de L10** — não
  por falta de código, mas porque o conceito não existe (§3 C10).
- **Dependências técnicas e de domínio.** **L1, L2, L3, L4** e **L10**. Do domínio: o que
  «contexto» significa (exercício isolado × combinação × sequência × bloco) — e a proibição de
  juízo.
- **Entregas.** (a) O **catálogo** com identificador estável por consulta (`T01`…) e, por
  consulta: entradas, filtros, agrupamentos, saída e **os vínculos de proveniência que o
  resultado exibe**; (b) a classificação em **[SIMPLES] × [CRUZAMENTO] × [VOCABULÁRIO]** — já
  feita no §7, e é ela que ordena a implementação; (c) a implementação das de **[CRUZAMENTO]**
  primeiro (T01, T03, P01 — é o caminho curto até uma consulta que funcione); (d) o
  **dicionário de recusas**: o que a consulta **não** responde.
- **Critérios verificáveis.** (i) Cada consulta tem teste com dados sintéticos **e** com o dado
  real da escola; (ii) toda saída distingue «**sem registro**» de «não domina» — teste que
  verifica que a ausência aparece como ausência (é o critério que protege `não considere a
  ausência de evidência como prova de ausência de aprendizagem`); (iii) cada resultado traz o
  caminho para o registro original (aula, data, versão do plano); (iv) **nenhuma** consulta
  chama IA — teste que falha se a rota importar `ia.js`; (v) a consulta não decide, não
  classifica e não ordena por mérito (revisão de saída por lista de expressões proibidas).
- **Riscos e decisões por confirmar.** (a) **Risco central**: a consulta virar avaliação — a
  fronteira que o projeto declara e ainda não desenhou; (b) o «contexto» precisa de definição do
  domínio antes de ser implementável; (c) C5 (quais 3 e quais 7); (d) o que fazer com o dado
  que **não foi observado** (declarar, nunca inferir).
- **Prioridade.** **P2** — depois de L1–L4; é onde o produto passa a valer.

### L7 — A fronteira da IA e a medição de uso

- **Objetivo e justificativa.** Fixar o escopo da IA (auxiliar na elaboração de planos e
  anamneses) e **medir** o uso, para que o custo seja rastreável por escola/período e as cotas
  dos planos comerciais tenham base. O texto 2 §2 é explícito: a IA **não** é assistente geral
  nem mecanismo de consulta aos registros.
- **Situação atual.** A IA é um **stub** (`motor/nucleo/ia.js`) com contrato de turno e freio de
  sessão (`limiteTurnos = 30`); o registro de custo é **anexado e nunca lido**
  (`rotas.js:108`; `ia-registro/registro.jsonl`), com `tokens_in/out = 0` e
  `custo_estimado: "0 (stub)"`; existe um teto medido em experimento
  (`experimentos/pe/freio-custo.md`).
- **Lacunas.** Sem medidor lido não há cota, sem cota não há plano; e não há trava verificável
  que impeça a IA de ser usada para responder consultas (hoje não há consulta — o risco nasce
  com L6).
- **Dependências técnicas e de domínio.** L6 (para a trava de escopo fazer sentido) e a decisão
  de qual IA real substitui o stub. Do domínio: o que a IA pode e não pode fazer (§2 do texto 2).
- **Entregas.** (a) O medidor **lido**: rota de uso por escola/professor/período, alimentada
  pelo registro existente (com tokens reais); (b) a declaração explícita do escopo da IA, no
  código e no documento; (c) a trava que impede a IA de responder consulta do catálogo;
  (d) o limite por plano como **parâmetro declarado**, não espalhado em código.
- **Critérios verificáveis.** (i) O registro de custo tem leitor e a soma por período é
  conferível; (ii) com a IA real, uma elicitação de referência consome tokens medidos e o
  número aparece no registro; (iii) teste que falha se uma rota de consulta importar `ia.js`;
  (iv) o limite de turnos e o de tokens agem sobre a mesma sessão.
- **Riscos e decisões por confirmar.** (a) Qual provedor/limites reais (o stub mascara o custo);
  (b) o que conta como «um ciclo de referência» para a cota (o texto 2 usa essa unidade — ela
  precisa de definição verificável); (c) privacidade: o que do prompt pode ser registrado.
- **Prioridade.** **P2** — independente das frentes de dado; bloqueia L9.

### L8 — Composição comercial e a fonte única dos valores

- **Objetivo e justificativa.** Transformar a composição comercial (planos, capacidades,
  adicionais, períodos, descontos, hora técnica) em **dado declarado num lugar só** — para que o
  preço exibido, o calculado e o cobrado não divirjam. O texto 2 §9 pede exatamente isso:
  «identificar onde os preços, períodos, descontos, limites e adicionais estão definidos
  atualmente, verificar se há duplicação de regras e propor uma fonte consistente».
- **Situação atual.** **Não existe** (§2.9). Nem preço, nem plano, nem cota, nem cobrança. A
  única pegada é `pagante: true` no andaime de expurgo.
- **Lacunas.** Não há fonte de verdade de valores; não há representação de «professor
  adicional» e «modalidade adicional» (e **não há hoje multiusuário por plano** — o cadastro de
  professores é uma lista sem limite); não há como representar a diferença entre multa
  recorrente (20%) e implementação única (R$ 49,90); não há período contratado.
- **Dependências técnicas e de domínio.** L2 (professor e modalidade com id — o «adicional» é
  uma quantidade de entidades); decisões comerciais que **não** são minhas (os valores do §2.9
  do texto 2, e a regra do desconto).
- **Entregas.** (a) A **fonte única** dos parâmetros comerciais (arquivo versionado, com os
  valores como **dados** — hoje eles só existem no texto); (b) a representação da composição:
  plano × capacidades (professores, modalidades, consultas, cota) e adicionais; (c) o
  **calculador** do valor contratado para qualquer período (mensal/trimestral/semestral/anual),
  com o acréscimo sobre a **base do período** — o texto 2 §8 é explícito; (d) o registro da
  demanda personalizada (classificação, orçamento por hora técnica, escopo aprovado).
- **Critérios verificáveis.** (i) O calculador reproduz os valores de referência do texto 2 §9
  para os quatro períodos e para 0..N adicionais (tabela de casos, incluindo os descontos de
  5/10/20%); (ii) alterar um valor num lugar só muda o exibido e o calculado — teste que muda a
  fonte e reconfere; (iii) nenhum valor duplicado em código (varredura por número);
  (iv) a fonte é reconstruível/legível por humano.
- **Riscos e decisões por confirmar.** (a) Os valores são **de referência** — confirmar antes de
  virar dado; (b) a política de desconto (5/10/20 «em relação ao preço mensal de referência») e
  a soma com adicionais precisam de uma regra única (o acréscimo incide sobre a base do
  período, e o desconto também? a ordem importa); (c) tributação/faturamento — fora de escopo
  até haver decisão.
- **Prioridade.** **P3** — pode começar em paralelo (é independente das frentes de dado), mas os
  valores precisam da sua confirmação.

### L9 — Cotas, habilitação e limites por plano

- **Objetivo e justificativa.** Ligar a composição comercial ao acesso: quantos professores e
  modalidades a escola pode cadastrar, quais consultas do catálogo estão disponíveis, e qual a
  cota de IA — **sem degradar o dado**: o texto 2 §1 é explícito que «a base de dados e os
  registros pedagógicos não devem perder qualidade, integridade ou propriedade conforme o plano
  contratado».
- **Situação atual.** Não existe habilitação por capacidade. Existe o andaime
  `raiz/escolas-habilitadas.json` (`habilitada`, e `pagante` como trava de expurgo) lido por
  `motor/servidor/raiz.js`; existe `ESCOLA_HABILITADA` como variável do Worker; existe
  `limiteTurnos` de sessão. **Nada** liga plano a capacidade.
- **Lacunas.** Sem L6 não há catálogo para distribuir; sem L7 não há medição para cortar; sem L8
  não há composição para consultar; e falta decidir **onde** a trava vive (o andaime declara que
  «quando a Produção nascer, este arquivo SAI e a flag passa a viver no `ESCOLA.conf`»).
- **Dependências técnicas e de domínio.** L6 + L7 + L8; e a decisão do lugar canónico da
  habilitação (o `ESCOLA.conf` que a frente B3 já prevê).
- **Entregas.** (a) A habilitação declarada por escola (plano, capacidades, cota, período) na
  fonte única; (b) a **trava** no cadastro (não permitir o 2.º professor no Básico — e o que
  acontece quando a escola **desce** de plano com dados acima do limite: a regra não pode ser
  apagar dados); (c) a distribuição do catálogo por plano — com o conjunto de consultas
  disponíveis **derivado** do catálogo, não copiado; (d) a cota de IA efetiva, com aviso antes
  de esgotar.
- **Critérios verificáveis.** (i) Numa escola de teste no Básico, cadastrar o 2.º professor é
  **recusado** com mensagem clara; (ii) o mesmo dado continua **legível e íntegro** depois da
  recusa (nenhuma remoção de dado; teste que confere contagens antes e depois); (iii) subir de
  plano **libera** as consultas sem regenerar conteúdo; (iv) descer de plano **não apaga**
  nada — apenas restringe o acesso automatizado; (v) a cota esgotada não corrompe o registro em
  curso.
- **Riscos e decisões por confirmar.** (a) **Risco de produto**: a trava virar punição ao dado
  da escola — a regra acima existe para impedir; (b) C2 (multi-escola, namespace); (c) C5;
  (d) o preço e a cobrança reais e o momento de faturamento.
- **Prioridade.** **P3** — última; depende de L6, L7 e L8.

### L10 — O vocabulário do domínio que falta (identificadores estáveis · contexto · intervenção · resposta)

- **Objetivo e justificativa.** Dar existência modelada aos conceitos com que as perguntas do
  catálogo são formuladas — **componente técnico**, **combinação** (o «contexto»),
  **intervenção docente** e **resposta observada** — e à **modalidade** e ao **nível** como
  entidades referenciáveis. Sem isto, quatro das oito perguntas (T02, T04, T05, P02) **não têm
  como ser respondidas**: não é o dado que falta ler, é o conceito que não existe (§2.10, §3 C10,
  §7).
- **Situação atual.** Medido nos três conteúdos: `componente` **0**, `combina` **0**,
  `interven` **0**, `resposta observada` **0** ocorrências. `modalidade` só em prosa na anamnese e
  como atributo da **curadoria** no KV. `exercício` só no plano (5), `objetivo` no plano (53) e no
  PO (18). O que mais se aproxima: `itens-por-dimensao` (PO — os itens que o PO manda observar, que
  **são** o «componente» de facto) e `aula-1-sequencia`/`estrutura-de-cada-aula` (plano — a
  sequência e os blocos).
- **Lacunas.** (1) O «contexto» (isolado × combinação × sequência × bloco) não é uma **relação**,
  é prosa; (2) a intervenção docente não é registada em sítio nenhum; (3) a resposta observada só
  existe como célula do lançamento, sem entidade própria; (4) a modalidade não é campo; (5) o
  «componente» existe como **item de dimensão do PO** e não como **entidade reutilizável** entre
  ciclos — sem identidade, dois ciclos não sabem que falam do mesmo plié.
- **Dependências técnicas e de domínio.** **É uma frente de conteúdo (P-16) antes de ser de
  código**: o vocabulário tem de ser declarado e aprovado antes de ser modelado. Depende de L1
  (as chaves) e L2 (as identidades); alimenta L6 (§7 — é o que destranca T02/T04/T05/P02) e a
  ideia de «elemento técnico» que a proveniência (§2.7) e o índice (L4) usam.
- **Entregas.** (a) O **vocabulário declarado** dos conceitos em falta, com definição de domínio e
  o campo `[Preencher]` onde a decisão for da pesquisadora (não inventar a definição de
  «combinação» — ela difere entre tradições, e o texto 1 §7 proíbe presumir equivalência);
  (b) o **identificador estável** de cada conceito e a ligação ao que já existe
  (`itens-por-dimensao` do PO como origem do «componente»); (c) a **relação** componente ×
  contexto (o que transforma a prosa em cruzável); (d) o lugar de registo da **intervenção** e da
  **resposta** na captura — se forem registadas na aula, entram na folha; e a decisão de **não**
  os registar, se for essa.
- **Critérios verificáveis.** (i) Cada conceito novo tem definição **citável** (de onde vem) e
  `[Preencher]` onde não há fonte — nenhum definido por dedução; (ii) renomear o rótulo de um
  conceito não muda o seu id (herda o critério de L1); (iii) as quatro perguntas T02/T04/T05/P02
  passam a ter os dados que precisam **declarados** — verificado pelo quadro do §7 preenchido sem
  lacuna; (iv) nenhuma definição nova colapsa tradições distintas no mesmo conceito (revisão
  contra o princípio do texto 1 §7).
- **Riscos e decisões por confirmar.** (a) **Risco alto de conteúdo**: definir «combinação» por
  analogia com RAD quando a tradição é outra (Graham, Limón, Cunningham — a lista que o utente
  traz) — é a razão de a frente ser de conteúdo, não de engenharia; (b) C10 (ordem: L10 antes ou
  depois de L6); (c) o que fazer com o que já está escrito como prosa nos PO publicados —
  permanece prosa, declarado, e não se reinterpreta.
- **Prioridade.** **P1** — tem de correr **antes** de L6 (é o que a destranca parcialmente) e em
  paralelo com L1/L2; não bloqueia L3.

### L11 — A porta paga: cobrança, verificação e liberação de escolas

- **Objetivo e justificativa.** Fazer a porta de entrada do Lastro ser **paga e automática**: a
  pessoa entra na página pública, escolhe o plano, paga por **Pix**, e — **só depois de o
  pagamento estar confirmado pelo servidor** — a criação da escola é autorizada, sem ninguém
  conferir extrato à mão. A justificativa é do dono do produto e é comercial: hoje **não existe
  nada** de plano, preço, cobrança ou assinatura (§2.9), e a porta pública que a cobrança exige
  **também não existe** (C11). A frente existe para que a decisão de «abrir o sistema ao público»
  seja **um desenho**, não um improviso — e para que o dinheiro nunca seja o que autoriza uma
  escola sem verificação.

- **Origem — e o que este documento fez com ela.** A frente nasce de um **rascunho do dono do
  produto** (entregue em 15/10/2026, sobre «a porta paga»). O rascunho foi tratado como **texto a
  auditar**, não como especificação pronta: cada afirmação dele sobre o **código** foi medida
  (§«Situação atual»), cada capacidade que ele supõe do **provedor** foi conferida na
  documentação pública (§«O provedor em avaliação») e o que não se confirmou ficou **declarado
  como pendente**, não preenchido por dedução. **Uma afirmação sua não resistiu à medição** — a de
  que já existe um fluxo público (C11) —, e o efeito dela é de escopo, não de detalhe.

- **Situação atual — inventário medido.** Os sete componentes que a frente toca, um a um, com o
  que a medição mostrou. **Nada disto foi alterado**; é leitura.

  | # | Componente | O que existe hoje (medido) | Serve para L11? |
  |:--|:--|:--|:--|
  | 1 | **A página e o portão** — `raiz/index.html`, `motor/servidor/raiz.js:32` e `:268` | **Um** portão para tudo: Basic auth (`tmenegaz` + secret `SENHA_RAIZ`), conferido uma vez, cobrindo a página e todas as rotas de produto. Pública só `/api/saude` (`:261`). `/` sem credencial → **401** | **Não** — não há lado público. É a **obra** de C11-1 |
  | 2 | **O endpoint de criação** — `POST /api/criar-escola` (`raiz.js:457`) | Ativo atrás da senha; exige `CLOUDFLARE_API_TOKEN` + `GITHUB_TOKEN` (secrets); valida identidade do professor (homônimo/slug, `validarCriacaoEscola`); provisiona no Cloudflare e **dispara o Action** | **Sim** — é onde a autorização entra (E6) |
  | 3 | **O Action** — `.github/workflows/criar-escola.yml` | `workflow_dispatch`; 9 inputs, **8 obrigatórios**; monta professor + ciclo + pacote-zero + `wrangler.<escola>.jsonc`, sobe o motor e commita | **Sim** — é a consequência pesada (6.5 do rascunho) |
  | 4 | **O Cron** — `wrangler.danca.jsonc` → `triggers.crons: ["*/5 * * * *"]` → `scheduled()` (`raiz.js:176`) | A cada 5 min chama `expurgar(env)`: lê o andaime e apaga a escola **desabilitada** cujo prazo venceu | **Sim, como precedente** — é o único relógio que existe, e é o que pode retomar provisionamento (E7) |
  | 5 | **O andaime** — `raiz/escolas-habilitadas.json` | Fixture **editada à mão e reimplantada**; hoje lista só `maria` (escola já expurgada). Declara a própria morte: «este arquivo SAI e a flag passa a viver no `ESCOLA.conf`» | **Não** — e é a **evidência** de C11-3 |
  | 6 | **A flag** — `ESCOLA_HABILITADA` (`wrangler.fita.jsonc`) | Var do Worker da escola (`"sim"`); mudá-la é **deploy**. Lida pelo motor da escola, **não** pelo expurgo | **Não**, por agora — mas é onde a habilitação **deveria** viver (§8, declarado) |
  | 7 | **O commit do expurgo** — `motor/servidor/repo-escola.js:226-398` | Git Data API: lê `refs` → `commits` → `trees`, `POST /git/trees` com `base_tree`, `POST /git/commits` com `parents:[commitSha]`, `PATCH /git/refs/heads/main` | **Como precedente** — é o **único** mecanismo do repositório que escreve estado sem interação humana, e é **versionado** |

  **O que não existe, medido:** nenhum plano, preço, período, cobrança, gateway, assinatura, cota
  ou limite por plano (§2.9); **nenhum namespace KV na raiz** — o `wrangler.danca.jsonc` não tem
  `kv_namespaces` (só ASSETS e o Cron), logo a rota de pagamento **não tem onde gravar** hoje;
  nenhum webhook; nenhuma autorização de uso único; nenhum campo de dinheiro.

- **O provedor em avaliação — o que está documentado, o que não está, o que falta confirmar.**
  Provedor: **InfinitePay** (a brasileira — domínio `infinitepay.io`; API em
  `api.checkout.infinitepay.io`; a conta é identificada pela **InfiniteTag**, o `handle`, sem o
  `$`). **Confirmar que o domínio e o produto correspondem à conta efetivamente contratada** — a
  documentação conferida é esta e nenhuma outra, e nome parecido não é o mesmo serviço.

  | Capacidade | O que diz a documentação oficial | Estado |
  |:--|:--|:--|
  | Criar link de checkout | `POST https://api.checkout.infinitepay.io/links` | **documentado** |
  | Consultar pagamento | `POST https://api.checkout.infinitepay.io/payment_check` — corpo `{handle, order_nsu, transaction_nsu, slug}`; resposta `{success, paid, amount, paid_amount, installments, capture_method}` | **documentado** |
  | `order_nsu` (pedido no *seu* sistema) | opcional; se ausente, a InfinitePay gera | **documentado** |
  | `redirect_url` (volta ao site) | devolve `receipt_url`, `order_nsu`, `slug`, `capture_method`, `transaction_nsu` | **documentado** |
  | `webhook_url` (notificação) | responder **200 em menos de 1 s**; responder **400 faz a InfinitePay retentar** | **documentado** |
  | `capture_method` | `"credit_card"` ou `"pix"` | **documentado** |
  | **Verificação de autenticidade do webhook** (assinatura/segredo) | — | **NÃO documentado** |
  | **Sandbox / ambiente de teste** | varredura na página de Checkout: **zero** ocorrências de «sandbox», «homologação» ou «ambiente de teste» | **NÃO documentado** |
  | **API de planos e assinaturas** | a documentação de API cobre **links de Checkout**; a página de recorrência descreve a gestão **pelo App** | **NÃO documentado** |
  | **Recorrência por Pix** | a página de recorrência diz «Pix taxa zero **ou** cartão em até 12x», e que «**se o cliente usar cartão**, a cobrança acontece **automaticamente** todo mês» — para Pix, o que se promete é **enviar a cobrança** e **lembrar por WhatsApp** | **parcial** — cobrança repetida, sim; **débito automático por Pix, não** |
  | **Pix automático / recorrente por autorização** | nada | **NÃO confirmado** |
  | **Taxa zero no produto de API** | «Pix com taxa zero» aparece como **argumento de venda**; as condições do produto de API não estão na página | **NÃO confirmado** |
  | **Unidade de `amount`** | os exemplos (`amount: 1000`, total «R$ 10,00») **sugerem centavos** | **aparente — confirmar** |

  **A leitura honesta desta matriz:** o que a InfinitePay documenta cobre **cobrança avulsa com
  confirmação** — que é exactamente o que L11 precisa para **cada período** — e **não** documenta
  **gestão de assinatura por API**. Isto não invalida o provedor: sustenta a decisão de modelar a
  assinatura como **uma cobrança por período** (o que o rascunho já pede) em vez de confiar numa
  assinatura administrada pelo provedor. **O que a matriz NÃO autoriza** é presumir sandbox,
  assinatura por API ou débito automático por Pix — nenhum dos três está documentado.

- **Sandbox: não confirmado → a simulação local.** Como **não há sandbox documentado**, a primeira
  etapa técnica **não pode** depender do provedor. Entrega-se um **adaptador de pagamento** com
  duas implementações atrás da **mesma interface**: a **simulada** (local, sem rede, sem dinheiro)
  e a **real** (só depois da confirmação). A simulação produz os três desfechos que interessam —
  **aprovado**, **pendente** e **recusado** —, entrega webhook de teste e permite rodar o ciclo
  inteiro do Lastro sem tocar em conta de ninguém. **Duas travas de desenho**, e são critérios de
  aceite, não recomendações: a simulação **não pode** ser confundível com confirmação real (o modo
  é explícito na configuração e no log), e **nenhum pagamento simulado libera escola em
  produção**. Sem sandbox, o que se perde é a confiança nos **detalhes** do provedor (formato de
  erro, latência, repetição de webhook); é isso que a E8 fecha, quando a conta responder.

- **Lacunas.** (1) **Não há lado público** na porta (C11-1) — a frente começa por construí-lo;
  (2) **não há onde gravar** o pedido: a raiz não tem KV (medido) e a decisão de arquitetura está
  aberta (C11); (3) **não há fonte de valor** para o backend calcular (é L8 — §2.9, C8);
  (4) **não há assinatura nem período** modelados, nem regra de renovação, tolerância, suspensão
  ou reativação; (5) **não há webhook nem verificação** — e o provedor **não documenta** como
  autenticar a notificação, o que torna a verificação ativa (`payment_check`) **obrigatória**, não
  opcional; (6) **não há autorização de uso único** ligando o pagamento à criação; (7) **não há
  idempotência** em lugar nenhum do fluxo (a repetição de webhook é documentada como
  comportamento do provedor — «400 faz retentar» —, logo repetição é o caso **normal**);
  (8) **não há política** de inadimplência, cancelamento ou devolução; (9) **não há sandbox** e,
  portanto, **não há como ensaiar** contra o provedor.

- **Dependências técnicas e de domínio.**
  - **L8** (a fonte única dos valores) — o valor **calculado no backend** sai dela; sem ela, o
    preço voltaria a existir em dois lugares, que é o que L8 existe para impedir. Pode-se
    construir tudo o resto com um valor de teste **declarado como teste**.
  - **C11** (onde vive o estado comercial) — **precede** o modelo de estados. É decisão de
    arquitetura, não de implementação.
  - **Dependências externas** (não são minhas de decidir e **não** estão confirmadas): sandbox;
    gestão de assinaturas por API; recorrência por Pix e o que ela significa (cobrança enviada ×
    débito automático); condições de taxa **do produto de API**; unidade de `amount`; verificação
    de autenticidade do webhook.
  - **Decisões comerciais** que não são minhas: valores (C8), política de tolerância e de
    suspensão, e o que acontece com a escola na inadimplência.
  - **L9** — se L11 criar o estado de plano/período, é ele que L9 vai ler; a ordem entre as duas
    precisa de decisão (ver «Ordem de implementação», E7).

- **Entregas.** (a) O **lado público** da porta, separado do administrativo, sem enfraquecer o
  portão atual; (b) a **interface do adaptador de pagamento** + a **implementação simulada**; (c) a
  **fonte do valor** no backend (de L8) e o **pedido** registrado antes de falar com o provedor;
  (d) o **webhook** que responde rápido e **não confia em si mesmo** + a **verificação ativa**;
  (e) a **autorização de uso única**, ligada ao pedido, validada no servidor e consumida no
  provisionamento; (f) o **modelo de estados** do pedido e do período; (g) a **recuperação** pelo
  Cron dos pagamentos confirmados sem provisionamento; (h) a **matriz do provedor** com o que
  falta confirmar, para ir à conta com perguntas fechadas.

- **Ordem de implementação — por etapas, e por que nesta ordem.**

  | Etapa | O que é | Depende de | Critério de aceite da etapa |
  |:--|:--|:--|:--|
  | **E0** | **Decidir onde vive o estado comercial** (C11). Não é código | — | A decisão está escrita, datada e com o motivo; as três candidatas foram comparadas |
  | **E1** | **O adaptador + a simulação local.** Interface única; três desfechos; webhook de teste | E0 (para saber onde gravar) | O ciclo inteiro corre **sem rede**: aprovado → autoriza; pendente → não autoriza; recusado → não autoriza; **nenhuma** transação real |
  | **E2** | **O lado público da porta.** Separar público × administrativo em `raiz.js` e na página | C11-1 | `/` abre **sem senha**; as cinco rotas administrativas continuam **401** sem credencial; nenhum dado administrativo vaza para o público |
  | **E3** | **O pedido e a fonte do valor.** Cria, registra e calcula no backend | **L8** + E0 | O navegador **não** envia preço; o valor calculado vem da fonte única; o pedido existe **antes** de o provedor ser chamado; alterar a fonte muda o valor cobrado |
  | **E4** | **O checkout.** Criar o link e devolver à página | E3 · (provedor, se confirmado) | O pedido gera um checkout; a página mostra o QR/link; `order_nsu` volta identificável |
  | **E5** | **O webhook + a verificação.** O coração da segurança | E4 | Responde **<1 s**; **não** libera nada por si; verifica no provedor e confere pedido, valor, moeda e método; **notificação repetida não duplica efeito** (provado); notificação inválida **não** libera |
  | **E6** | **A autorização de uso único + o encaixe em `/api/criar-escola`** | E5 | Token aleatório, com validade, **consumido uma vez**, que **não** permite trocar plano nem dados; sem token válido o endpoint recusa; a página **não** emite token |
  | **E7** | **A recuperação (Cron) e a habilitação sem deploy** | E6 | Pagamento confirmado sem provisionamento é **retomado** pelo Cron, **idempotente**, sem duplicar escola; habilitar/desabilitar deixa de exigir `deploy` (desfecho de C11-3); a ordem com **L9** fica decidida |
  | **E8** | **A integração real** — só com o provedor confirmado | as respostas do provedor | Credenciais em **secrets**; o modo real **não** pode ser ativado por engano pelo ambiente de teste; cada item pendente da matriz do provedor tem resposta registada |

  **O que não se deve fazer.** Ligar a **E8** antes da **E1** (não há sandbox: ensaiar em produção
  é a única alternativa, e é a que não existe); e implementar a **E5** antes da **E0** (o webhook
  grava estado — sem saber onde, grava no lugar errado, e é dinheiro).

- **Critérios verificáveis.** Para além dos critérios por etapa acima, a frente só está pronta
  quando se demonstrar: **(i)** o valor vem do backend, e o navegador não o pode alterar;
  **(ii)** pedido não confirmado **não** libera criação; **(iii)** pagamento confirmado é
  **verificado no servidor**, não aceite da notificação; **(iv)** webhooks repetidos **não**
  duplicam escola nem período; **(v)** falha no Action **não** perde o pagamento confirmado;
  **(vi)** a recuperação retoma o provisionamento **sem** escola duplicada; **(vii)** a autorização
  é de **uso único** — o segundo uso é recusado; **(viii)** cada período da assinatura tem
  confirmação **própria** (o primeiro pagamento não autoriza o mês seguinte); **(ix)** o ambiente
  de teste **não** movimenta dinheiro e **não** alcança produção; **(x)** o acesso administrativo e
  o expurgo **continuam** funcionando — teste que os exerce depois da mudança; **(xi)** custos,
  limites e dependências externas estão **documentados**; **(xii)** nenhum segredo do provedor
  chega ao navegador.

- **Riscos e decisões por confirmar.**
  - **O risco maior não é técnico:** é o **preço**. Sem a confirmação de C8, o valor cobrado seria
    inventado — e cobrar é irreversível de outra forma. A E3 pode ser construída com valor de
    teste; a **E8 não**.
  - **Verificar sem mecanismo documentado.** Como a autenticidade do webhook **não** está
    documentada, a notificação é tratada como **sinal**, e a **prova** é a consulta ao provedor.
    Se o provedor documentar assinatura mais tarde, ela **soma** — não substitui a consulta.
  - **Estado de dinheiro em armazenamento sem transação.** Se a decisão de C11 cair no **KV**, a
    consequência tem de estar declarada: sem transação nem unicidade, a **idempotência passa a ser
    responsabilidade do código** (chave derivada do `order_nsu`/`transaction_nsu`, leitura antes de
    escrever, e a verificação ativa como árbitro). É aceitável para o volume previsto e **não** é
    aceitável se o volume crescer.
  - **Assinatura sem API de assinatura.** Modelar cada período como **uma cobrança** é o que a
    documentação sustenta. O que fica por decidir é **quem** dispara a cobrança do mês seguinte —
    o Cron do Lastro (o que exige gerar um link novo por período) ou a recorrência do App (o que
    devolve a gestão para a mão de alguém, exactamente o que a frente quer evitar). **Decisão de
    arquitetura e de operação**, e por isso registada, não escolhida.
  - **Política de inadimplência** — quanto tempo, o que suspende, o que acontece aos dados. **Não
    a invento:** decisão comercial (o rascunho também a pede e não a fixa).
  - **Exposição de dado pessoal.** A página pública passa a colectar dados de comprador
    (`customer`: nome, e-mail, telefone, opcionalmente). É o primeiro ponto do sistema que recebe
    dado de pessoa **de fora** do ciclo pedagógico: a regra 7 do §6 continua a valer, e a
    separação entre dado de pagamento e dado de aluna é critério de aceite, não estilo.
  - **Custo.** «Pix taxa zero» é **publicidade**, e as condições do produto de API não estão na
    página. Não presumir que a integração inteira seja gratuita; registar as taxas **da conta**,
    quando houver conta.
  - **Parcelamento ≠ assinatura.** Preservado do rascunho e sublinhado: `installments` aparece nas
    respostas do provedor e é **parcelamento de compra**. Se o cartão entrar algum dia, entra como
    **assinatura recorrente**, nunca como compra parcelada apresentada ao cliente como mensalidade.

- **Prioridade.** **P2** — **independente das frentes de dado** (L1–L7) e por isso pode começar
  desde já **em simulação**: E1 e E2 não dependem de nada externo nem do provedor. O que a segura
  é **E3** (o valor, que é L8/C8) e **E0** (a decisão de arquitetura). A **E8** espera o provedor —
  e é a única parte que espera.

---

## 5. Sequência sugerida

**Por camadas** — cada camada só começa quando a de baixo está fechada:

| Camada | Frentes | Por que nesta ordem |
|:--|:--|:--|
| **0 — a base** | **L1** (dicionário de campos) · **L2** (identidade estável) · **L10** (o vocabulário do domínio que falta) | sem chave estável não há o que cruzar, indexar ou provar — e sem o **conceito** (contexto, componente, intervenção, resposta) não há o que cruzar. L1, L2 e L10 correm em paralelo; cruzam-se no nó `sujeitos` e em `itens-por-dimensao` |
| **1 — a versão e a ponte** | **L5** (versão explícita do plano — **desenho completo**: C3 · S1–S4 · S5–S7) · **L3** (o lançamento e o envelope com leitor — e é ele que **carrega** a referência de versão) | C3 decidida destrava L5 e L3; L5 define **o que** a ponte referencia, L3 constrói **a ponte** — nesta ordem, porque uma referência sem registro onde morar não é consultável, e um registro sem versão não tem o que referenciar |
| **2 — o encontro** | **L4** (mapa de relações e índice) | é a consequência de L1+L2+L10 aplicada ao dado de L3; sem ela, cada consulta varre tudo |
| **3 — o valor** | **L6** (catálogo de consultas) | depende de L1–L4 **e de L10** (sem o vocabulário, quatro das oito perguntas não têm como ser respondidas — §7); é onde o produto passa a valer |
| **4 — o comercial** | **L7** (IA e uso) → **L9** (cotas por plano) · **L8** (composição e valores) | L9 depende de L6+L7+L8. **L8 é independente do dado** e pode começar a qualquer momento, depois da confirmação dos valores |
| **5 — a porta** | **L11** (o lado público, o adaptador e a simulação — E1, E2) | **corre em paralelo a tudo o resto**: não depende do dado nem do provedor. O que ela tem de comercial — **E3**, o valor — só entra depois de **L8/C8**; e a integração real (**E8**) só entra quando o provedor responder. É a única camada cujo começo **não** espera por outra camada |

**O que não se deve fazer.** Implementar L6 antes de L1/L2/L3 **e de L10** — produziria consultas
sobre chaves instáveis, sobre um dado sem leitor e sobre conceitos que o modelo não tem, e cada
consulta teria de ser reescrita depois. E implementar L9 antes de L6: não haveria catálogo para
distribuir nem medição para cortar.

---

## 6. Regras de desenho que valem para todas as frentes

1. **A IA não faz o que é determinístico.** Filtros, validações, consultas, agregações e
   relacionamentos são **regras**; a IA auxilia **a elaboração de planos e anamneses** e nada
   mais (texto 2 §2). Nenhuma consulta do catálogo passa por IA — é critério verificável, não
   recomendação.
2. **A ausência de registro é uma ausência, não um resultado.** Nunca apresentar «não há
   observação» como «não domina» ou «não aprendeu»; nunca apresentar «aula não realizada» como
   realização.
3. **O produto não avalia e não decide sobre o aluno.** Organiza evidência para a reflexão do
   professor. Toda saída de consulta é organizável, não classificatória.
4. **Proveniência acrescenta, não edita** — e o que já foi lançado continua ligado à versão que
   o originou.
5. **Isolamento entre escolas** não se negocia por conveniência de consulta; consulta agregada
   respeita permissão e não amplia exposição de dado pessoal (e de menores, em especial).
6. **Determinismo**: tudo o que é derivado é reconstruível — rodar duas vezes produz o mesmo
   arquivo (é o que torna uma vista conferível, como já é hoje o `gerar-acompanhamento.sh`).
7. **Dado pessoal**: apelidos estáveis (P-12), nunca nome completo, contato ou dado de saúde em
   claro; a cifra do que é sensível permanece.

---

## 7. O catálogo do texto 2, pergunta por pergunta

> **Por que esta secção existe.** O texto 2 §4 pede que se verifique «se os dados necessários
> estão **efetivamente disponíveis** no modelo atual e **identificar quais relações precisam ser
> desenvolvidas**», e o §10 pede o «**mapa das perguntas que já podem ser respondidas com os dados
> atuais**», a «**identificação dos dados e relacionamentos necessários para cada pergunta**» e a
> «**distinção entre consultas simples e cruzamentos mais complexos**». Esta é a resposta — com o
> que foi **medido**, não com o que se supõe.

**Classificação usada** (as três que o texto 2 §6 usa para orçamentar): **[SIMPLES]** = o dado
existe e falta só o leitor · **[CRUZAMENTO]** = o dado existe em pontas separadas e falta o
vínculo · **[VOCABULÁRIO]** = o conceito que a pergunta usa **não existe no modelo** e precisa de
L10 antes de qualquer código.

| # | Pergunta | Dado que existe hoje | O que falta | Classe |
|:--|:--|:--|:--|:--|
| **T01** | O que já foi trabalhado com esta aluna? | `sujeitos` (apelido) · `marcos-por-aula` (plano) · `linha-de-base` (PO, por aluna) · o lançamento por aluna × coluna, **no KV** | **identidade estável da aluna** (L2) · **leitor do lançamento** (L3) · distinguir planejado × realizado × observado (hoje `lancada` é derivado e o lançamento não tem rota) | **CRUZAMENTO** |
| **T02** | Em quais **contextos** este elemento apareceu? | `itens-por-dimensao` (o «elemento» ≈ item do PO) · `aula-1-sequencia`/`estrutura-de-cada-aula` (plano — a sequência e os blocos) | **o conceito de «contexto»**: medido, `combina` = **0** ocorrências nos três conteúdos. Não é relação, é prosa dentro de um item | **VOCABULÁRIO** |
| **T03** | Como as observações se distribuíram no tempo? | as datas **existem**: `ciclos.json → aulas[].data` e o `data` do lançamento · as observações por aluna × coluna | leitor do lançamento (L3) · identidade (L2) · o vínculo observação → elemento → contexto | **CRUZAMENTO** |
| **T04** | Componentes trabalhados **isoladamente** × observados nas **combinações** | `itens-por-dimensao` (o componente, parcialmente) · `aula-1-sequencia` (a sequência) | **os dois conceitos que a pergunta cruza**: `componente` = **0** e `combina` = **0** — e o registo de **onde** cada um foi trabalhado | **VOCABULÁRIO** |
| **T05** | **Intervenções docentes e respostas observadas** por ciclo | **nada**: `interven` = **0** e `resposta observada` = **0** em todo o conteúdo. A rubrica dá **critério × nível**, não intervenção nem resposta | **os dois conceitos inteiros** (L10) · o lugar de registo na captura · o vínculo ao elemento e ao ciclo | **VOCABULÁRIO** |
| **P01** | Objetivos do nível com e sem observação registrada | `marcos-por-aula` (os objetivos do ciclo) · `rubrica` (o critério) · `linha-de-base` (o que a aluna traz) · o lançamento (as observações) | **leitor do lançamento** (L3) · identidade (L2) · e a distinção explícita **três estados**: «sem observação» × «aula não realizada» × «observação registrada» — que hoje não existe como dado (o `estado`/`lancada` é derivado do índice, não do registo) | **CRUZAMENTO** — a mais próxima de viável |
| **P02** | Objetivos **por contexto** — matriz | `marcos-por-aula` · `itens-por-dimensao` · `dimensoes-observacao` | **o «contexto»** outra vez (`combina` = **0**) — a matriz que a pergunta pede é exactamente a relação que falta | **VOCABULÁRIO** |
| **P03** | Distribuição entre o **nível atual** e o **próximo nível** | `turma.nivelReferencia` e `programaReferencia` (na curadoria/turma, KV) · os objetivos do ciclo atual | **os objetivos do nível SEGUINTE** — não existem como dado em lugar nenhum (só a *referência* ao nível) · a **versão curricular/institucional** que o texto pede (a grade RAD não é versionada no repositório) · multi-ciclo | **VOCABULÁRIO + currículo** — a mais distante |

**O resultado, sem arredondar.** Das **oito** perguntas: **nenhuma** é respondível hoje;
**três** são **[CRUZAMENTO]** (T01, T03, P01) e ficam viáveis **depois de L2+L3+L4**; **quatro**
são **[VOCABULÁRIO]** (T02, T04, T05, P02) e **exigem L10** antes de qualquer linha de código; e
**uma** (P03) exige, além de L10, **dados curriculares que não existem** (os objetivos do próximo
nível e a versão da referência).

**A consequência para a prioridade.** O catálogo **não pode** ser a primeira frente — e o texto 2
também não o pede (`§4`: «o agente deve verificar se os dados necessários estão efectivamente
disponíveis»; `§10`: «proposta de implementação gradual, com dependências e prioridades
explícitas»). O caminho curto até uma pergunta que funcione é **T01 ou P01**, e ambas passam por
L2 → L3 → L4. O caminho até T02/T04/T05/P02 passa, antes, por uma decisão de **conteúdo**.

---

## 8. Cobertura — cada requisito dos dois textos, e onde é respondido

> **Por que esta secção existe.** Para que o mapa seja **auditável**: nenhum requisito dos textos
> fica sem resposta, e nenhuma resposta fica sem requisito. É a tabela que se relê quando se
> quiser saber «isto já foi pensado?».

### Texto 1 — Integridade dos dados, indexação semântica e proveniência documental

| § | Requisito | Onde é respondido |
|:--|:--|:--|
| §1 | Inventário dos formulários, campos, documentos e fluxos | §2.1, §2.2 (111 nós medidos) |
| §1 | «não presuma que as consultas/índices/relacionamentos existem» | §2.5, §2.6, §2.8 (medidos: não existem) |
| §2 | As **seis** operações do «Gerar PO», separando as que acontecem / parcialmente / não existem | **§2.11** (tabela dedicada) |
| §3 | Chave-valor para **todos** os campos (incl. orientação, validação, relação, auxiliares, sem destino, futuros) | §2.4 + §L1 (a chave existe por `id`; o derivado deriva do rótulo) |
| §3 | Os **11** atributos que se precisa conhecer de cada campo (chave, nome, significado, tipo, cardinalidade, dono, origem, validação, relações, uso, versão da definição) | §L1 entregas (a)+(b) — os 11 estão na entrega; a versão da definição em §L1 lacuna (4) |
| §3 | A chave **não** pode depender do rótulo visível | §2.4, §L1 entrega (c) — é o núcleo do defeito medido |
| §3 | Distinguir valor **informado** × **derivado** | §2.7 (o envelope já tem `origem`/`respondente`/`nota`) + §L1 lacuna (5) |
| §4 | As **cinco** camadas de indexação, distintas e não equivalentes | §2.6, §2.10 («NÃO EXISTE»), §L4 |
| §4 | Não criar índice indiscriminado | §L4 entrega (d) («o que **não** é indexado, e por quê») |
| §5 | Os **sete** itens que a proveniência deve permitir identificar | §2.7 (inventário do que existe e do que falta) + §L3 |
| §5 | «não presuma que logs técnicos bastam» | §2.7 + §L3 critério (ii) (o documento derivado entra na cobertura da âncora) |
| §5 | Distinguir **planejado** × **realizado**; aula não realizada ≠ evidência | §L3 entrega (d) + §6 regra 2 + §7 (P01 exige os três estados) |
| §5 | Ausência de observação ≠ ausência de aprendizagem | §6 regra 2 (critério verificável no §L6 (ii)) |
| §6 | Imutabilidade do PO publicado; versão anterior não sobrescrita em silêncio | **§3 C3 — RESOLVIDA em 15/10/2026** + §L5 (com o medido: o PO **é** sobrescrito, e a âncora deteta sem preservar) |
| §6 | Registos relacionados à versão que os originou | §3 C4 + §L5 entrega (c) |
| §6 | Identificar operações capazes de sobrescrever dados históricos | §2.7 (as duas políticas) + §L5 |
| §7 | As **onze** relações pedagógicas | §2.5 (quais existem) + **§3 C10 e §7** (intervenção, componente, combinação **não existem**) + §L10 |
| §7 | Relações **explícitas e consultáveis**; não depender de semelhança de texto | §2.4 (marco por texto), §3 C4, §L2, §L4 |
| §7 | Linguagem livre preservada, vinculada a conceito estruturado **mediante confirmação**; não presumir equivalência | §L10 entregas (a) e critério (iv) + §L10 risco (a) |
| §8 | Permissões e **isolamento entre escolas**; consulta agregada respeita limites | **§3 C2** + §L4 risco (c) + §L9 |
| §8 | Dados de menores; a indexação não amplia exposição | §L2 risco (a), §L4 crítica (iv), §6 regra 5 |
| §9 | Os **dez** entregáveis do diagnóstico | **§8 esta tabela** + §2, §3, §4, §5 |
| §9 | «separar claramente existe / parcialmente / não existe / a decidir» | **§2.10** (tabela dedicada) |
| §9 | Recuperar dados «sem depender da memória do professor… ou de interpretações automáticas por IA» | §6 regras 1, 2 e 6 + §L6 critério (iv) |

### Texto 2 — Consultas pedagógicas, cruzamento de dados e organização comercial

| § | Requisito | Onde é respondido |
|:--|:--|:--|
| §1 | Levantamento do que existe; não presumir consultas/índices/comercial | §2.8, §2.9 (medidos: nada) |
| §1 | O dado não perde qualidade/integridade/propriedade pelo plano | §L9 critério (ii)/(iv) + §6 regra 5 |
| §2 | IA com escopo restrito (planos e anamneses) | §6 regra 1 + §L7 entrega (b) |
| §2 | IA **não** é assistente geral nem consulta aos registos | §L7 entrega (c) + §L6 critério (iv) — verificável por máquina |
| §2 | Consultas por **regras determinísticas** | §L6 + §6 regra 1 |
| §2 | Custo associado ao uso efetivo, com limites e acompanhamento | §L7 (o medidor é escrito e **nunca lido** — §2.9) |
| §3 | O sistema **não** decide sobre a aluna | §6 regra 3 + §L6 critério (v) |
| §3 | As **seis** distinções que a consulta deve fazer (isolado, combinação, observado por contexto, sem observação, planejada × realizada, intervenção × resposta) | **§7** (as seis, pergunta a pergunta) — quatro delas dependem de L10 |
| §3 | «ausência de registo ≠ prova de ausência de aprendizagem» | §6 regra 2 + §L6 critério (ii) |
| §4 | Verificar se o dado está disponível e que relações faltam | **§7** (tabela com classe por pergunta) |
| §4 | **T01–T05, P01–P03** | **§7** (as oito, uma a uma) |
| §4 | O catálogo é evolutivo | §L6 entrega (a) + §9 (pendência) |
| §5 | Distribuição 3 / 7 / todas | **§3 C5** + §L9 entrega (c) — **não decidida** (é sua) |
| §5 | A diferença de plano **não** reduz o dado | §L9 critério (ii)/(iv) + §6 regra 5 |
| §5 | «quais consultas podem ser implementadas com o modelo atual…» | **§7** (a classificação SIMPLES/CRUZAMENTO/VOCABULÁRIO faz exactamente isto) |
| §6 | Hora técnica R$ 120,00; orçamento; escopo aprovado; entrega restrita | §L8 entrega (d) + §3 C8 (os valores **não** estão no repositório) |
| §6 | Classificação da demanda (disponível / variação / nova) e destinação | §L8 entrega (d) |
| §6 | Reaproveitar não expõe os dados de quem financiou | §6 regra 5 + §L8 risco (c) |
| §7 | Básico/Intermediário/Avançado: professores, modalidades, consultas, tokens | §L9 + **§3 C10** (a «modalidade» não existe como entidade) |
| §7 | «tokens ≠ consultas»; consulta determinística não consome IA | §L7 + §L6 critério (iv) |
| §8 | Adicional R$ 49,90 + 20% **sobre a base do período** | §L8 entrega (c) + critério (i) |
| §8 | «não aplicar o acréscimo sempre sobre o preço mensal» | §L8 critério (i) (a tabela de casos cobre os quatro períodos) |
| §8 | Preço exibido = calculado = cobrado | §L8 critério (ii) + §2.9 (não existe) |
| §9 | Os valores de referência e os descontos | §3 C8 + §L8 (declarados no documento, **não** no código) |
| §9 | Identificar onde preços/limites/adicionais estão definidos; duplicação; fonte consistente | §2.9 + §L8 entrega (a) e critério (iii) |
| §10 | Os **treze** entregáveis desta frente | **§8 esta tabela** + §2.8, §3, §4, §5, §7 |
| §10 | «separar o que existe / parcialmente / não existe / depende de decisão» | **§2.10** |

### O que os textos exigem e **ainda não tem resposta** — declarado

1. **A definição de «contexto», «componente», «intervenção» e «resposta observada»** (§3 C10) —
   é decisão de conteúdo, e sem ela o §7 mostra quatro perguntas bloqueadas. **Não a escrevi**: o
   texto 1 §7 proíbe presumir equivalência entre tradições, e definir «combinação» por analogia
   com o RAD seria fazê-lo.
2. **A especificação completa de cada consulta** (entradas, filtros, agrupamentos, saídas) —
   depende de (1) e dos ids de L1/L2; a **classe** de cada uma já está no §7.
3. **Quais 3 e quais 7 consultas** em cada plano (§3 C5) — decisão comercial, e o texto 2 a marca
   explicitamente como «a validar».
4. **Onde a habilitação do plano vive** (o `ESCOLA.conf` que o andaime promete) — depende de B3 e
   de C2.

---

## 9. O que este documento **não** decidiu

- **Não escolheu** as interpretações das contradições C1–C11 (§3); registou-as. **Exceção: C3**,
  resolvida em **15/10/2026** por decisão do dono do produto («o PO/plano publicado passa a ter
  versão explícita que o lançamento referencia») — e o **desenho** que a realiza (**S1–S4**) foi
  proposto por este documento e **aprovado no mesmo dia** (§3 C3, §L5). Propô-lo e aprová-lo não o
  implementa: o mapa continua a não ter código.
- **Não deixou por decidir** o que a frente L5 precisava: o **desenho está completo** em 15/10/2026
  — **C3** decidida, **S1–S4** aprovadas, **S5–S7** decididas (número sequencial · reancorar na
  hora · mostrar discreto e somente-leitura). O que falta é a **obra**, não a decisão.
- **Não definiu** «contexto», «componente», «intervenção docente» nem «resposta observada»
  (§3 C10, §L10) — é decisão de **conteúdo**, e o texto 1 §7 proíbe presumir equivalência entre
  tradições. É a razão pela qual quatro das oito perguntas ficam bloqueadas (§7).
- **Não inventou** valores comerciais, nem regras de cobrança, nem quais 3/7 consultas vão em
  cada plano (§2.9, C5).
- **Não alterou** nenhum arquivo de produto, nenhuma fonte de ciclo, nem o KV (a leitura foi
  somente leitura) — e **não implementou** a versão explícita decidida em C3: esta fase é
  diagnóstico e planeamento, e as três medidas que delimitam a implementação foram feitas em
  **cópia de bancada**, descartada depois.
- **Não escreveu** o dicionário dos 111 campos, o mapa de relações, o vocabulário do domínio nem
  a especificação completa de cada consulta — descreveu-os como entregas de L1, L4, L10 e L6; a
  **classe** de cada uma das oito perguntas está no §7.
- **Não confirmou** o subtítulo descritivo («Lastro — Sistema de Memória e Observabilidade
  Pedagógica em Dança») como denominação oficial: é a **proposta** declarada.
- **Não corrigiu** `FRENTES.md` (contagens de L4, frase de B5) — o que foi medido está em §2.2 e
  C9, para o próximo elo decidir se vale a correção datada.
- **Não decidiu a ordem** entre L10 e L6 (§3 C10): acrescentar o vocabulário do domínio antes de
  construir o catálogo, ou construir as três consultas de **[CRUZAMENTO]** primeiro e deixar as
  quatro de **[VOCABULÁRIO]** para depois.
- **Não confirmou** — e **não presumiu** — nenhuma capacidade da porta paga além do que a
  documentação do provedor efectivamente diz. Sandbox, gestão de assinaturas por API, recorrência
  por Pix, taxa do produto de API, unidade de `amount` e verificação de autenticidade do webhook
  ficam **declarados como pendentes**, item por item, na matriz de **L11** (§4) — com a distinção
  explícita entre o que está **documentado**, o que está **parcialmente** documentado e o que
  **não** está. A frente **não escolheu** provedor: registou a **InfinitePay como a em avaliação**.
- **Não decidiu onde vive o estado comercial** de L11 (§3 **C11**): KV, Git ou D1. A decisão é de
  **arquitetura** e **precede** o modelo de estados — e é a razão pela qual a primeira etapa de
  L11 (**E0**) não tem código.
- **Não construiu o lado público da porta** — registou que ele **não existe** (§3 C11-1): a raiz
  inteira está atrás de um só portão, e por isso L11 começa por **separar** o público do
  administrativo, em vez de «ampliar» um fluxo que não há.
- **Não escolheu** quem dispara a cobrança do mês seguinte (o Cron do Lastro, com um link novo por
  período, ou a recorrência do App — que devolveria a gestão à mão de alguém) nem a política de
  inadimplência, tolerância, suspensão, cancelamento ou devolução. São decisões **comerciais e de
  operação**.
- **Não tratou** parcelamento de cartão como assinatura — a regra veio do rascunho do dono do
  produto e fica preservada: se o cartão entrar, entra como **assinatura recorrente**, nunca como
  compra parcelada apresentada ao cliente como mensalidade.
- **Não implementou nada de L11.** A frente é plano — **E0 a E8** —, e nenhum arquivo de produto
  foi alterado para escrevê-la; o que se mediu foi lido, não mudado.
