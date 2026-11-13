# Arquitetura — o agente do Lastro (Workers AI + MCP, sem RAG)

> **Resumo (para o HANDOFF):** Especificação do **copiloto pedagógico** do Sistema Lastro: um
> agente que lê os índices e os envelopes **por chave**, através de ferramentas com contrato
> explícito (MCP), e **propõe** texto ao professor — nunca grava. Modelo: Llama da Cloudflare
> (Workers AI), **`@cf/meta/llama-3.1-8b-instruct-awq`**. **Sem RAG**, por decisão: 100 % do que o
> agente consulta é chave-valor.

> **Estado:** desenho e plano. **Nada foi implementado** — nem o binding, nem o módulo, nem a rota.
> O que existe hoje é o **stub legado** (`motor/nucleo/ia.js`) e a rota `POST /api/ia`, que esta
> frente **não usa** e **não apaga** (P-03/P-04). Ver a §12.

> **Escopo:** o agente **dentro da Produção (Bastidores)**, ao lado dos quatro formulários —
> anamnese, plano de ensino, plano de observação e verbete do Estilo. Ficam **de fora**: a
> construção operacional (sala, elenco, dia, turma, professores, alunos, calendário), a gravação, a
> cobrança e a integração com o projeto das secretarias (que não existe — CONFIRMADO: não há código
> de integração no `motor/`).

> **Leia antes de citar.** Este documento é do **Projeto Ciclo** — a memória da aula dada,
> **protótipo testado no universo da dança** (não é agnóstico: o projeto agnóstico será criado a
> partir dele). O **FIPP não é implementado aqui**: a proveniência deste repositório é a **âncora
> encadeada** (`tools/hash-ciclo.sh` → `.fipp`), uma **aproximação** do framework de mestrado.
> E o sistema **não avalia**: ele registra. O agente herda as duas coisas.

---

## 1. O que o agente é, e o que ele não é

**É um copiloto de redação assistida, dentro da Produção.** Ele lê o que já está registado — o
plano anterior, a linha de base da turma, o vocabulário da modalidade, o envelope do PO — e ajuda o
professor a **formular** o que ele ainda não escreveu: um objetivo, um marco, um critério de
observação, a decomposição de um exercício.

**Não é um assistente geral, nem um mecanismo de consulta livre.** Esta é a fronteira que o
`PLANEJAMENTO-LASTRO.md` §L7 já declarava — e que a decisão de 12/11/2026 **alarga de propósito,
num ponto só**: o agente **passa a poder consultar os registos da própria escola** (índices e
envelopes), porque é isso que o torna útil dentro do formulário. O que continua proibido é a
consulta **fora do contexto do documento em edição**, e a consulta que **atravessa escolas**.

| O agente faz | O agente não faz |
|:--|:--|
| Explica um campo do PO, do plano ou da anamnese | Responde perguntas fora do documento em edição |
| Sugere objetivo, marco, volume e condições a partir do plano anterior e da linha de base | Decide no lugar do professor — a proposta é sugestão, o critério é dele |
| Sugere critérios de observação a partir do plano e da linha de base | Avalia, classifica, ordena ou julga aluna, turma ou aula (identidade do projeto) |
| Ajuda a decompor um exercício (tempos, compassos, células, direções, sinais) | Inventa exercício, tradição, categoria ou sinal que não esteja no vocabulário |
| Consulta o vocabulário, o alfabeto, a progressão e as tradições da modalidade | Dá conselho de saúde, lesão ou restrição (fronteira P-22) |
| Diz **qual foi a fonte** de cada afirmação (o id do envelope, o termo do vocabulário) | Grava, publica, apaga ou dispara `workflow_dispatch` |
| Recusa com o motivo, quando o dado não existe | Recusa em silêncio, ou inventa um zero que se lê como facto |

**A garantia mais forte não é uma instrução no prompt: é a ausência de ferramenta de escrita.** O
registo de ferramentas (§5) é **só de leitura**, e a prova (§9) verifica isso por construção — não
por confiança no modelo. Gravar segue o fluxo que já existe, com a proveniência e o
`workflow_dispatch` de hoje: o professor confirma, o formulário grava, a cadeia dispara.

---

## 2. Por que MCP + busca estruturada, e por que **não** RAG

**A decisão está fechada e este documento não a reabre.** O que ele faz é dar-lhe o fundamento
medido, para que a próxima sessão não a desfaça por hábito.

**Tudo o que o agente consulta é chave-valor.** Não é uma afirmação de princípio: é a forma dos
ficheiros.

| O que o agente lê | Forma, lida do ficheiro | O que se faz com ela |
|:--|:--|:--|
| `indices/acervo.json` | `{versao, fonte, gerado_em, ciclos[], escolas[], professores[], filtros, nao_indexado}` — `ciclos[]` traz `id`, `professor`, `escola`, `numero`, `aulas`, `documentos`, `estado`, `ancora{hash,parent_hash}` | Procura por chave (`id`), não por semelhança |
| `escola/<slug>/envelopes/.indice.json` | `{versao, nomes[], resumos{}}` | O nome **é** a chave; o resumo é o que se mostra antes de abrir |
| `escola/<slug>/envelopes/<id>.json` | O envelope, com `contexto` (professor, escola, ciclo, turma), `respostas` ou `campos`, `ancora` | Abre-se **pelo id** que o índice já deu |
| `biblioteca/modalidades/<modalidade>/vocabulario.json` | Lista de `{id, termo, categoria, tradicao, alternativos[], descricao, …}` | Procura por `id`/`termo`/prefixo — **não** por vizinhança vetorial |
| `biblioteca/modalidades/<modalidade>/notacao.json` | O alfabeto como dado: categorias, eixos de lado, direções, orientações, sinais de movimento | Lê-se a chave (`categoria`, `direcao`) |
| `biblioteca/modalidades/<modalidade>/descricoes.json` | Bloco de notação → frase em português | Mapa: a chave é o bloco |
| `biblioteca/modalidades/<modalidade>/progressao.json` · `tradicoes.json` | Turmas por nível e referência; tradições com fonte | Lista ordenada por `ordem` |
| `professores/<slug>/perfil.json` | `{slug, nome, modalidades[], criado, atualizado}` | Habilitação: uma lista de slugs |
| KV `bastidores/<escola>/curadorias` · `turmas` · `professores` · `linhas-de-base` | Listas JSON | Chave-valor, literalmente |

**O argumento, em três linhas.** (a) Não há prosa solta para procurar: o que existe são documentos
com `id` estável e índices que dizem qual id responde a quê — a chave é **conhecida**, ou derivável
dos índices. (b) Um índice vetorial responderia «parecido com», e a pergunta do professor é
«qual é» — uma resposta aproximada num sistema de proveniência é pior do que uma recusa. Os índices
são a forma do dado, não uma camada a acrescentar. (c) Um índice vetorial é **infraestrutura nova** —
um índice a manter, um pipeline de ingestão a correr a cada gravação, uma cota a vigiar e um segundo
lugar onde o mesmo dado pode divergir — para resolver um problema que não existe: não há texto livre
para procurar.

**O que o MCP acrescenta, então.** Não é recuperação: é **contrato**. O MCP dá ao modelo uma lista
de ferramentas com nome, descrição e **esquema de entrada e saída** — e é isso que torna um 8B
utilizável: ele não tem de saber onde mora o dado, tem de escolher uma ferramenta e preencher os
argumentos. Um contrato explícito é o que substitui, num modelo pequeno, a capacidade de inferência
que ele não tem.

---

## 3. Onde o agente vive, e onde o MCP vive

### 3.1 A divisão que o motor já impõe

O `motor/nucleo/` é **puro** — não sabe onde corre, não lê nem escreve, não fala com a rede
(CONFIRMADO: nenhum ficheiro de `motor/nucleo/` requer `fs`, `http` ou `process` para trabalhar). O
`motor/servidor/` tem as rotas, o `env`, o KV, o token. **O agente atravessa as duas camadas**, e
cortá-lo ao meio é o que evita o defeito de sempre: lógica de decisão escondida na rota.

| Ficheiro (novo) | Camada | O que é |
|:--|:--|:--|
| `motor/nucleo/agente/ferramentas.js` | núcleo | O **registo**: nome, descrição, esquema de entrada, esquema de saída, e a função que responde — recebida por injeção. Não lê nada |
| `motor/nucleo/agente/conducao.js` | núcleo | O **laço**: quantas voltas, quantas ferramentas, quantos tokens de resultado, quando parar e o que dizer quando para |
| `motor/nucleo/agente/mensagens.js` | núcleo | A composição do pedido ao modelo (sistema + histórico + resultados de ferramenta) e o **recorte** do resultado (o que vai ao prompt é uma parte, não o envelope inteiro) |
| `motor/nucleo/agente/contrato.js` | núcleo | A **validação em tempo de execução** de uma chamada (entrada e saída), contra o mesmo esquema que o modelo vê |
| `motor/servidor/agente.js` | servidor | A rota `POST /api/agente`: liga os leitores reais ao registo, chama `env.AI.run`, grava a linha de custo |
| `motor/servidor/mcp.js` | servidor | O **transporte** MCP (JSON-RPC 2.0 sobre HTTP, sem sessão): `initialize`, `tools/list`, `tools/call` — **sobre o mesmo registo** |
| `prompts/agente-sistema.md` | congelado | O prompt de sistema, versionado (P-19). **Criá-lo exige o ritual dos congelados** — ver §10.5 |

**Uma só fonte de verdade.** O registo é do núcleo e é um só: o laço interno do `agente.js` e o
endpoint MCP chamam as **mesmas** funções. Duas listas de ferramentas divergiriam à segunda
alteração, e a prova (§9) mede a igualdade.

### 3.2 Mesmo Worker, e não um Worker separado

O MCP é servido **pelo Worker da escola**, sobre a mesma origem, em `POST /api/mcp`. Três razões, e
todas são restrições do projeto, não preferências:

1. **A identidade do tenant.** O Worker tem a trava `ESCOLA_SLUG` × subdomínio (`producao.js`), e é
   ela que garante que uma escola não lê os dados de outra. Um Worker separado teria de repetir a
   trava, o `GITHUB_TOKEN`, o KV e o `ASSETS` — quatro cópias, uma delas a divergir.
2. **O custo.** Uma chamada de ferramenta **em processo** é uma chamada de função: **zero
   subpedidos**. Se o MCP fosse outro Worker, cada ferramenta seria um pedido de saída — e o teto
   de 50 por invocação (§7) passaria a ser o teto de **uma** resposta, não de uma interação.
3. **Um deploy por escola, não dois.** O repositório monta um Worker por escola
   (`wrangler.<escola>.jsonc`); dois Workers por escola dobram a superfície de deploy, de segredo e
   de diagnóstico, para servir uma rota.

**Sem Durable Object e sem `McpAgent` com sessão.** A conversa vive no cliente (como já vive em
`POST /api/ia`), e cada pedido é autónomo. O estado do sistema é **ficheiro**, não memória de
processo (`ARQUITETURA-GERAL.md` §4) — e um Durable Object com sessão seria exactamente o "banco"
que este projeto decidiu não ter. No plano gratuito, isso também evita uma dependência de infra.

---

## 4. O fluxo de uma interação

```
[Produção]  o professor abre «Assistente» dentro do formulário em edição
     │        (contexto = escola, professor, ciclo, turma, documento, campo)
     ▼
POST /api/agente  {contexto, mensagens[]}
     │
     ├─ 1. CONTEXTO. `contextoFaltando` recusa se faltar professor, ciclo ou escola —
     │     a MESMA regra da Porta. Sem contexto não se chama o modelo: inventa-se.
     │
     ├─ 2. REGISTO. As 8 ferramentas são ligadas aos leitores reais (KV, ASSETS, token).
     │
     ├─ 3. LAÇO (tectos em §7.4)
     │     env.AI.run(modelo, {messages, tools})
     │        ├─ tool_calls?  → despacho EM PROCESSO → resultado RECORTADO → volta ao modelo
     │        └─ texto?        → é a resposta
     │
     ├─ 4. REGISTO DE CUSTO. Uma linha em `ia-registro/registro.jsonl`
     │     {contexto, turnos, chamadas, ferramentas[], tokens_in, tokens_out,
     │      neurons_estimados, modelo, carimbo}
     │
     └─ 5. RESPOSTA {ok, texto, fontes[{tipo, id, caminho}], uso{tokens, neurons, chamadas}}
              └─ o professor LÊ, EDITA e GRAVA com o botão que já existe
```

**A resposta carrega as fontes.** Toda afirmação que vem de um documento volta com o `id` de onde
saiu; toda afirmação que vem do vocabulário volta com o `termo`. É a forma da resposta de
proveniência (`medida + caminho + elo`, `PLANO-PERGUNTAS-DA-PROVENIENCIA.md` §1) aplicada à
conversa: sem fonte, o texto não é resposta — é opinião, e o prompt manda dizê-lo.

**Uma interação, uma invocação.** O laço inteiro (modelo → ferramenta → modelo) corre **dentro da
mesma invocação**; não há `waitUntil` nem trabalho de fundo. Se o tecto de subpedidos apertar, a
resposta é uma **recusa com motivo e com o que já se apurou** — nunca um 500 a meio, que é o defeito
que o §5.26 do `ARQUITETURA-GERAL.md` já pagou uma vez.

---

## 5. Os contratos das ferramentas MCP

Oito ferramentas expostas ao modelo. **Oito, e não dezassete**, por uma razão medida: cada
ferramenta custa descrição em **todos** os pedidos, e um 8B escolhe pior quanto mais opções tem. O
que não está aqui é **leitor interno** de uma destas oito — não é ferramenta.

**Forma comum.** Entrada e saída em JSON Schema (draft 2020-12). Toda ferramenta devolve **ou** o
dado **ou** `{recusa: "<motivo>", pedido: "<o que faltou>"}` — nunca um vazio que se lê como zero.
Toda ferramenta é **pura leitura**: nenhuma recebe `metodo`, `url`, `caminho` ou `id` de escrita.

### 5.1 `ler_ciclos`

*Para que serve:* dizer quais ciclos a escola tem, com âncora e número de aulas. É a resposta `CT01`
do catálogo.

```json
{
  "nome": "ler_ciclos",
  "descricao": "Lista os ciclos de uma escola (ou de um professor), com âncora e nº de aulas. Use quando a pergunta for 'quais ciclos existem', 'quantas aulas tem o ciclo', 'que âncora'.",
  "entrada": {
    "type": "object",
    "properties": {
      "professor": { "type": "string", "description": "slug do professor; ausente = todos os da escola" }
    },
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "ciclos": { "type": "array", "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" }, "professor": { "type": "string" },
          "escola": { "type": "string" }, "numero": { "type": "string" },
          "aulas": { "type": "integer" }, "documentos": { "type": "integer" },
          "estado": { "type": "string" },
          "ancora": { "type": "object", "properties": {
            "hash": { "type": "string" }, "parent_hash": { "type": "string" } } }
        },
        "required": ["id", "professor", "numero", "estado"]
      } }
    },
    "required": ["ciclos"]
  },
  "fonte": "indices/acervo.json (cache em KV) · GET /api/indice/CT01",
  "custo": "0 subpedidos com cache quente; 14 no rebuild (§7.1)"
}
```

### 5.2 `ler_envelopes`

*Para que serve:* listar os documentos de um tipo (anamnese, plano, cartão, PO) e **abrir um pelo
id**. É a ferramenta que a anamnese e a derivação do plano mais usam: o plano anterior de uma turma
está aqui.

```json
{
  "nome": "ler_envelopes",
  "descricao": "Lista os envelopes da escola (nomes e resumos) ou abre um envelope pelo id. Use para 'qual o plano anterior', 'o que foi respondido na anamnese', 'que POs existem'.",
  "entrada": {
    "type": "object",
    "properties": {
      "tipo": { "type": "string", "enum": ["anamnese", "plano", "cartao", "po", "todos"] },
      "id": { "type": "string", "description": "id do envelope (ex.: plano-20261112-1450); ausente = lista" },
      "limite": { "type": "integer", "minimum": 1, "maximum": 20 }
    },
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "envelopes": { "type": "array", "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" }, "tipo": { "type": "string" },
          "resumo": { "type": ["string", "null"] },
          "contexto": { "type": "object", "properties": {
            "professor": { "type": "string" }, "turma": { "type": "string" },
            "ciclo": { "type": "string" }, "escola": { "type": "string" } } }
        },
        "required": ["id", "tipo"]
      } }
    },
    "required": ["envelopes"]
  },
  "fonte": "escola/<slug>/envelopes/.indice.json + GET /api/envelope/:id · GET /api/envelopes",
  "custo": "1 leitura de índice (KV) + 1 leitura de envelope por id pedido"
}
```

### 5.3 `ler_turma`

*Para que serve:* é a ferramenta que junta, num só resultado, o que o professor precisa para
**escrever um plano**: o ritmo (frequência, duração, calendário), a modalidade, o repertório, o
elenco (apelidos) e a linha de base. Uma ferramenta, e não cinco, porque a pergunta é sempre a
mesma e a composição é do servidor — não do modelo.

```json
{
  "nome": "ler_turma",
  "descricao": "Devolve o ritmo, a modalidade, o repertório, o elenco (apelidos) e a linha de base de uma turma. Use antes de sugerir objetivo, marco ou volume.",
  "entrada": {
    "type": "object",
    "properties": {
      "turma": { "type": "string", "description": "nome da turma, como a curadoria a declara" },
      "incluir": {
        "type": "array",
        "items": { "type": "string", "enum": ["ritmo", "modalidade", "repertorio", "elenco", "linha_de_base"] },
        "description": "ausente = tudo"
      }
    },
    "required": ["turma"],
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "turma": { "type": "string" },
      "ritmo": { "type": "object", "properties": {
        "frequencia": { "type": "array", "items": { "type": "string" } },
        "duracao_min": { "type": "integer" },
        "inicio": { "type": "string" }, "fim": { "type": "string" },
        "total_de_aulas": { "type": "integer" } } },
      "modalidade": { "type": "string" },
      "repertorio": { "type": "array", "items": { "type": "string" } },
      "elenco": { "type": "array", "items": {
        "type": "object",
        "properties": { "apelido": { "type": "string" }, "nivel": { "type": "string" } } } },
      "linha_de_base": { "type": "object" }
    },
    "required": ["turma"]
  },
  "fonte": "KV bastidores/<escola>/curadorias · turmas · linhas-de-base + motor/nucleo/estado-da-turma.js + linha-de-base.js",
  "custo": "1 a 4 leituras de KV"
}
```

### 5.4 `ler_vocabulario`

*Para que serve:* o Estilo. Procura no vocabulário da modalidade (por `id`, `termo`, prefixo e
semelhança de escrita — a mesma `normalizarBusca`/`pontuacaoDaBusca` que o passo 1 do verbete já usa
desde 10/11/2026) e devolve o verbete quando existe.

```json
{
  "nome": "ler_vocabulario",
  "descricao": "Procura um exercício ou termo no vocabulário da modalidade. Devolve o termo com id, categoria, tradição, definição e alternativos. Use SEMPRE antes de sugerir um exercício: se não estiver no vocabulário, diga que não está — não invente.",
  "entrada": {
    "type": "object",
    "properties": {
      "modalidade": { "type": "string", "description": "ex.: bale-classico" },
      "busca": { "type": "string", "description": "termo escrito pelo professor, com ou sem acento" },
      "limite": { "type": "integer", "minimum": 1, "maximum": 10 }
    },
    "required": ["modalidade", "busca"],
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "termos": { "type": "array", "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" }, "termo": { "type": "string" },
          "categoria": { "type": "string" }, "tradicao": { "type": "string" },
          "alternativos": { "type": "array", "items": { "type": "string" } },
          "descricao": { "type": "string" }
        },
        "required": ["id", "termo", "categoria"] } },
      "verbete": { "type": ["object", "null"] }
    },
    "required": ["termos"]
  },
  "fonte": "biblioteca/modalidades/<modalidade>/vocabulario.json (ASSETS) + verbetes do professor",
  "custo": "0 subpedidos (ASSETS)"
}
```

### 5.5 `ler_notacao`

*Para que serve:* decompor. Devolve o alfabeto (categorias, eixos de lado, direções, orientações,
sinais de movimento) e o dicionário `bloco → frase`, para o agente **nomear** o que o professor
compôs em vez de o inventar.

```json
{
  "nome": "ler_notacao",
  "descricao": "Devolve o alfabeto da notação de uma modalidade (categorias, eixos, direções, orientações, sinais) e as frases que cada bloco gera. Use para decompor um exercício em tempos, compassos, células e direções.",
  "entrada": {
    "type": "object",
    "properties": {
      "modalidade": { "type": "string" },
      "parte": { "type": "string", "enum": ["alfabeto", "descricoes", "tudo"] }
    },
    "required": ["modalidade"],
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "categorias": { "type": "array", "items": { "type": "string" } },
      "eixos": { "type": "object" },
      "direcoes": { "type": "array", "items": { "type": "string" } },
      "orientacoes": { "type": "array", "items": { "type": "string" } },
      "sinais": { "type": "array", "items": { "type": "string" } },
      "descricoes": { "type": "object", "description": "bloco → frase" }
    }
  },
  "fonte": "biblioteca/modalidades/<modalidade>/notacao.json · descricoes.json (ASSETS)",
  "custo": "0 subpedidos"
}
```

### 5.6 `ler_progressao`

*Para que serve:* a progressão e as tradições. É o que sustenta «sugerir a progressão» sem
inventar equivalência entre métodos: a lista declara a referência **sugerida**, e o agente repete
essa palavra.

```json
{
  "nome": "ler_progressao",
  "descricao": "Devolve os níveis/turmas e as tradições de referência de uma modalidade, com a fonte de cada uma. Use para situar o nível do repertório e para citar a tradição correta.",
  "entrada": {
    "type": "object",
    "properties": {
      "modalidade": { "type": "string" },
      "nivel": { "type": "string", "description": "ausente = todos os níveis" }
    },
    "required": ["modalidade"],
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "referencia": { "type": "string" },
      "turmas": { "type": "array", "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" }, "nome": { "type": "string" },
          "ordem": { "type": "integer" }, "programaReferencia": { "type": "string" },
          "nivelReferencia": { "type": "string" } } } },
      "tradicoes": { "type": "array", "items": {
        "type": "object",
        "properties": { "id": { "type": "string" }, "fonte": { "type": "string" } } } }
    }
  },
  "fonte": "biblioteca/modalidades/<modalidade>/progressao.json · tradicoes.json (ASSETS)",
  "custo": "0 subpedidos"
}
```

### 5.7 `ler_perfil_do_professor`

*Para que serve:* a habilitação. O agente não sugere uma modalidade que o professor não declara
saber ensinar, nem um vocabulário que a escola não oferece.

```json
{
  "nome": "ler_perfil_do_professor",
  "descricao": "Devolve as modalidades que um professor declara saber ensinar. Use antes de sugerir vocabulário de outra modalidade.",
  "entrada": { "type": "object", "properties": { "professor": { "type": "string" } }, "required": ["professor"], "additionalProperties": false },
  "saida": {
    "type": "object",
    "properties": {
      "nome": { "type": "string" },
      "modalidades": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["modalidades"]
  },
  "fonte": "professores/<slug>/perfil.json (ASSETS) · GET /api/bastidores/perfil",
  "custo": "0 subpedidos"
}
```

### 5.8 `perguntar_ao_catalogo`

*Para que serve:* a porta dos fundos **declarada**. Se uma pergunta do professor corresponde a uma
pergunta do catálogo de proveniência, o agente não a responde — **encaminha-a** para o catálogo, que
devolve `medida + caminho + elo`, ou recusa com o motivo.

```json
{
  "nome": "perguntar_ao_catalogo",
  "descricao": "Responde uma pergunta do catálogo de proveniência (GE01 contagens, CT01 ciclos, PV01 âncoras, AL01 registos por aluna, TR01 turmas com plano, OB01 recusa declarada). Se a pergunta não estiver no catálogo, devolve a recusa com o motivo. NÃO use para perguntas pedagógicas — para essas, use as outras ferramentas.",
  "entrada": {
    "type": "object",
    "properties": {
      "pergunta": { "type": "string", "enum": ["GE01", "CT01", "PV01", "AL01", "TR01", "OB01"] },
      "argumento": { "type": ["string", "null"], "description": "ex.: o apelido da aluna em AL01" }
    },
    "required": ["pergunta"],
    "additionalProperties": false
  },
  "saida": {
    "type": "object",
    "properties": {
      "pergunta": { "type": "string" },
      "medida": { "type": ["object", "array", "number", "null"] },
      "caminho": { "type": ["string", "null"] },
      "elo": { "type": ["string", "array", "null"] },
      "recusa": { "type": "string" }
    },
    "required": ["pergunta"]
  },
  "fonte": "motor/nucleo/indices.js (6 perguntas) · GET /api/indice/:pergunta",
  "custo": "0 com cache quente"
}
```

### 5.9 O que as ferramentas **não** devolvem

- **Nome completo, contato, dado de saúde ou acompanhamento em claro** (P-12). O índice da escola
  marca o apelido como `acesso: escola`; fora dela ele **não existe**, e a ferramenta recusa com
  esse motivo em vez de devolver o campo vazio.
- **Conteúdo de outra escola.** A ferramenta nem tem para onde ir: o `ESCOLA_SLUG` do Worker é a
  fronteira.
- **Um envelope de outro professor**, quando a pergunta é do PO de um professor — a estante já chega
  recortada, e uma ferramenta que a furasse recriaria o defeito da autoria trocada (12/11/2026).

---

## 6. O prompt de sistema

**Vive em `prompts/agente-sistema.md`** (P-19 — os prompts do projeto vivem no repositório). O
rascunho abaixo é a **especificação** do conteúdo, não o ficheiro: criá-lo é parte da implementação
e passa pelo ritual dos congelados (§10.5).

**Os oito blocos, e por que cada um existe.** Num 8B, uma regra que não está escrita **não é
cumprida** — e uma regra escrita duas vezes com palavras diferentes é cumprida pela metade.

1. **Papel e fronteira.** «És um copiloto de redação dentro do Sistema Lastro. Ajudas o professor a
   formular o que ele ainda não escreveu. Não avalias, não classificas, não julgas, não dás conselho
   de saúde.» *(identidade do projeto + P-22)*
2. **Fonte obrigatória.** «Toda afirmação sobre um documento vem de uma ferramenta, e cita o id.
   Toda afirmação sobre um exercício cita o termo do vocabulário. Sem fonte, diz: “não tenho esse
   dado na escola”.» *(a resposta de proveniência)*
3. **Não inventar, e como se diz que não se sabe.** «Nunca inventes exercício, tradição, categoria,
   sinal, data, turma ou nome. Se não estiver no vocabulário, escreve exactamente:
   “este exercício não está no vocabulário de <modalidade>”.» *(o defeito mais provável)*
4. **O passado não se reescreve.** «Nunca proponhas alterar um documento já gravado. Um ajuste é um
   elo novo, e quem o cria é o formulário, não tu.» *(P-03/P-04)*
5. **Propor, não decidir.** «Apresenta no máximo **três** alternativas, curtas, e diz qual
   recomendas e por quê em uma linha. A escolha é do professor.»
6. **Linguagem.** «Português do Brasil, na voz do professor, sem adjetivo de valor, sem “excelente”,
   sem “infelizmente”. Vocabulário do domínio: usa os termos da modalidade como o vocabulário os
   escreve.» *(P-21)*
7. **Privacidade.** «Usa só o apelido da aluna. Nunca escrevas nome completo, contato, dado de
   saúde, diagnóstico ou acompanhamento.» *(P-12)*
8. **Forma da resposta.** «Responde em texto curto, sem tabela, sem código, sem markdown além de
   lista. Se a resposta depender de um dado que não tens, termina com a pergunta exacta que
   precisas.» *(a tela é um formulário, não um chat de parede)*

**O que fica de fora do prompt, e por quê.** As regras de negócio, os tectos de custo e a lista de
ferramentas **não** se escrevem no prompt: vão no pedido, como dado (os `tools` do MCP e os
parâmetros do laço). Um tecto escrito em prosa é uma sugestão; um tecto no código é um tecto.

---

## 7. Os limites

### 7.1 Subpedidos — medidos, não estimados

O §5.26 do `ARQUITETURA-GERAL.md` fixa a regra: **50 subpedidos por invocação** no plano gratuito, e
o contador é um só. O que a documentação da Cloudflare diz, lida hoje (12/11/2026) e citada porque
muda a conta:

> «A subrequest is any request a Worker makes using the Fetch API **or to Cloudflare services like
> R2, KV, or D1**.» — *Workers · Limits*
> «Subrequests to internal services: 1.000» (Workers Free)

**As três consequências, e a terceira é um achado:**

1. **`env.AI.run` não gasta dos 50.** É um serviço interno, e os serviços internos têm tecto próprio
   (1.000). O que ele gasta são **Neurons** (§7.2). *(DECLARADO pela documentação; a **medir** na
   primeira chamada real — é uma linha de doc, não uma medição nossa.)*
2. **A ferramenta em processo não gasta nada.** Despacho de função, sem rede.
3. **As leituras de KV gastam — e o contador do projeto não as vê.** `motor/servidor/subpedidos.js`
   embrulha o `fetch`; o `kv.get` não passa por lá. O número que o §5.26 publica está, por isso,
   **subestimado** sempre que a rota lê KV. Não é um defeito novo desta frente — é uma **dívida
   medida** que esta frente não pode herdar em silêncio: o laço do agente lê KV em quase todas as
   voltas, e um contador cego é pior do que nenhum. **Decisão de implementação:** o agente embrulha
   **também** a leitura de KV no contador (`contarSubpedidos` ganha uma variante que conta os dois),
   e a prova mede os dois números.

**O que uma interação custa de facto**, com os números de hoje:

| Operação | Subpedidos |
|:--|:--|
| Ler o índice do acervo **com cache quente** (KV) | 1 KV |
| Reconstruir o índice do acervo (**sem** cache) | **14** — 1 árvore + 3 `escola/*/indice.json` + 1 `envelopes/.indice.json` + 9 `.fipp` |
| Abrir um envelope | 1 KV (índice) + 1 KV (envelope) |
| Ler vocabulário/notação/perfil/progressão | 0 (ASSETS) |
| Chamada ao modelo | 0 dos 50 (serviço interno) |

**O resultado é tranquilizador, e por uma razão específica:** uma interação típica gasta
**1 a 6 subpedidos**, e a única operação que estoura é o **rebuild** do índice. Daí a regra: **o
agente lê o índice do cache e nunca o reconstrói dentro do laço.** Se o cache estiver frio, a
ferramenta responde com o índice que houver e diz que ele é de `<gerado_em>` — não reconstrói a
pedido de um modelo. *(É a mesma disciplina do §5.26: não cabe? Não se começa.)*

### 7.2 Neurons — o limite a sério

**10.000 Neurons por dia, no plano gratuito, por conta** — não por escola. Confirmado na página de
preços da Cloudflare (actualizada a 12/11/2026):

| Modelo | Neurons por M de tokens de entrada | por M de saída |
|:--|--:|--:|
| **`@cf/meta/llama-3.1-8b-instruct-awq`** (o escolhido) | **11.161** | **24.215** |
| `@cf/meta/llama-3.1-8b-instruct-fp8` (a alternativa se o AWQ falhar) | 13.778 | 26.128 |
| `@cf/meta/llama-3.1-8b-instruct` (sem quantização) | 25.608 | 75.147 |

**A conta, para uma interação com duas voltas de ferramenta** (≈6.000 tokens de entrada somados,
≈800 de saída): `6.000 × 11.161/10⁶ ≈ 67` + `800 × 24.215/10⁶ ≈ 19` ⇒ **≈ 86 Neurons** por
interação. Com 10.000 por dia: **≈ 116 interações por dia**, para **todas** as escolas da conta.

Isto não é um detalhe de fatura: é o que dá conteúdo à «assinatura avançada com créditos». **O
crédito não é uma unidade inventada — é o Neuron**, medido por interação e gravado no registo.
*(PENDENTE: o Neal — a unidade comercial — não é decidido aqui; a frente L9/L11 é que o decide.)*

### 7.3 O registo de custo, que já existe

`POST /api/ia` já escreve uma linha por sessão em `ia-registro/registro.jsonl`
(`{contexto, turnos, tokens_in, tokens_out, custo_estimado, carimbo}`), com `tokens = 0` porque o
stub não gasta. O agente **reusa a forma** e acrescenta três campos: `modelo`, `ferramentas[]` e
`neurons_estimados` (derivado da tabela do §7.2, com a conta escrita ao lado — não uma medição que
não temos). O registo continua a ser **anexado e nunca lido** até a frente L7 o dotar de leitor; o
agente não inventa um leitor novo.

### 7.4 Os tectos do laço, declarados

| Tecto | Valor | Por quê |
|:--|--:|:--|
| Voltas ao modelo por interação | **4** | Inicial + 3 rondas de ferramenta. Uma quinta ronda num 8B é sinal de que a ferramenta errada foi escolhida |
| Chamadas de ferramenta por interação | **8** | Duas por volta, no pior caso; acima disto o custo deixa de ser previsível |
| Tokens de resultado acumulados | **12.000** | O recorte (§3.1, `mensagens.js`) corta por ferramenta; este é o total. Passado o tecto, o laço fecha com o que tem |
| Turnos por sessão | **30** (herdado) | `motor/nucleo/ia.js` já o declara como freio de sessão, não cota |
| Subpedidos por invocação | **o do §5.26** (50) | O contador do pedido, agora a contar KV também |

**Quando um tecto fecha o laço**, a resposta diz **qual** fechou e o que ficou apurado — pela mesma
razão que a cadeia passou a dizer o que já tinha fechado (12/11/2026): um «não deu» sem inventário
manda o professor repetir às cegas.

### 7.5 CPU

O plano gratuito dá **10 ms de CPU por pedido**, e esperar pela inferência **não** conta como CPU
(«waiting on network requests does not count toward CPU time»). O risco não é o modelo: é o
**`JSON.parse` de um índice grande** dentro do laço. Mitigação declarada: ler o índice do KV **uma
vez** por invocação e partilhá-lo entre as ferramentas; nunca reparsear por chamada. *(Risco
declarado, não medido — a prova do §9 mede o tempo de CPU do caminho com o índice real.)*

---

## 8. Tipagem forte

O motor é JavaScript puro — e o projeto já resolveu isto duas vezes: `motor/nucleo/schemas.js` +
`indices/esquema/*.json` (schema declarado, P-08) e os validadores de ciclo. O agente segue o mesmo
caminho, em três camadas:

1. **O esquema é o contrato, e é um só.** Cada ferramenta declara `entrada` e `saida` em JSON Schema
   **no registo**. Desse mesmo objecto saem (a) os `tools` que o modelo vê, (b) o validador que
   corre em tempo de execução, e (c) a documentação da §5. Três cópias divergiriam; uma não pode.
2. **A validação é em tempo de execução, e recusa.** `contrato.js` valida a chamada **antes** de
   executar (argumento inválido ⇒ `{recusa: "argumento inválido: <campo>"}` devolvido ao modelo, que
   tem uma segunda chance) e valida a saída **antes** de a pôr no prompt. Um 8B inventa
   `{"tipo": "plano_anterior"}` em vez de `"plano"`; o validador é o que transforma isso numa
   correcção em vez de num erro silencioso.
3. **JSDoc nos leitores.** As funções do núcleo levam `@param`/`@returns` com os `typedef` das
   entidades (`Envelope`, `Turma`, `Termo`, `Vinculo`), para o editor acompanhar o que o schema não
   apanha.

**O que garante que não divergem:** a prova (§9) percorre o registo e, para cada ferramenta,
valida um exemplo positivo **e** um negativo mutado. Uma ferramenta sem os dois falha a prova — e
uma ferramenta nova não pode entrar sem eles.

---

## 9. O impacto no código

### 9.1 Ficheiros novos

| Ficheiro | O que é | Estimativa |
|:--|:--|--:|
| `motor/nucleo/agente/ferramentas.js` | O registo das 8 ferramentas + a ligação por injeção | 1,5 d |
| `motor/nucleo/agente/contrato.js` | Validação JSON Schema de entrada e saída | 0,5 d |
| `motor/nucleo/agente/conducao.js` | O laço e os tectos (§7.4) | 0,5 d |
| `motor/nucleo/agente/mensagens.js` | Composição do pedido + recorte do resultado | 0,5 d |
| `motor/servidor/agente.js` | `POST /api/agente`; leitores reais; registo de custo | 1,5 d |
| `motor/servidor/mcp.js` | `POST /api/mcp` (JSON-RPC 2.0, `initialize`/`tools/list`/`tools/call`) | 1 d |
| `prompts/agente-sistema.md` | O prompt de sistema (congelado — §10.5) | 0,5 d |
| `experimentos/provar-agente.js` | A prova (§9.3) | 3 d |
| `ARQUITETURA-AGENTE.md` | Este documento | — |

### 9.2 Ficheiros modificados

| Ficheiro | Mudança | Risco |
|:--|:--|:--|
| `wrangler.<escola>.jsonc` (× 3) | `"ai": { "binding": "AI" }` + `vars.SUBPEDIDOS` declarado | baixo — sem binding, `env.AI` é `undefined` e a rota recusa com motivo |
| `motor/servidor/producao.js` | Montar a rota do agente quando há binding; manter as outras intactas | baixo — a ponte só decide para onde vai o pedido |
| `motor/servidor/rotas.js` | Nada. A rota do agente **não** é a `/api/ia` do stub | nenhum |
| `motor/servidor/bastidores.js` | O painel «Assistente» dentro dos formulários (§11) e o cliente que fala com `/api/agente` | médio — é o ficheiro maior; a regra é não tocar em nada que já esteja lá |
| `motor/servidor/subpedidos.js` | Variante que conta **também** KV (§7.1, ponto 3) | **médio** — mexe no contador que o §5.26 congelou por decisão; exige corpo de commit próprio |
| `motor/nucleo/ia.js` | **Só** a nota datada de obsolescência no cabeçalho. Nenhuma linha de código | nenhum |
| `.gitignore` | `!experimentos/provar-agente.js` | nenhum |
| `IDENTIDADE-VISUAL.md` | Só se uma peça nova nascer (§11). A recomendação é **nenhuma** | nenhum |

### 9.3 A prova (`experimentos/provar-agente.js`)

Bancada local: `http.createServer` em 127.0.0.1, KV falso, GitHub falso, e um **`env.AI` falso** que
devolve `tool_calls` guionados. As asserções, com controlo negativo onde ele mede algo:

1. **Contexto faltando ⇒ recusa, e zero chamadas ao modelo.** (Negativo: sem a guarda, o modelo é
   chamado com `turma` vazia e inventa uma.)
2. **Cada ferramenta valida o seu positivo e recusa o negativo mutado** — as 8.
3. **O registo é só de leitura:** nenhuma ferramenta expõe `metodo`, `url` de escrita, `caminho` de
   escrita, e nenhum leitor chama `escrever*`/`disparar`. Medido por lista, não por confiança.
4. **`tools/list` do MCP é idêntico ao registo do núcleo** — mesma contagem, mesmos esquemas.
5. **Os tectos fecham o laço** e a resposta diz qual fechou.
6. **Os dois contadores:** subpedidos de `fetch` **e** de KV, somados, com um caso que estoura.
7. **O recorte corta:** um envelope grande não entra inteiro no prompt.
8. **A linha do registo** tem `modelo`, `tokens_in`, `tokens_out`, `neurons_estimados` e
   `ferramentas` não vazio.
9. **Controlo negativo do prompt:** sem a regra 3 (§6), o guião devolve o nome de um exercício que
   não está no vocabulário — e é a regra que impede a resposta de sair.

---

## 10. Conflitos com o que já existe, e como se evitam

### 10.1 A cadeia automática

**Não há conflito, e há uma regra.** O agente **não** dispara `workflow_dispatch`, **não** grava
envelope, **não** mexe em vínculo: ele devolve texto. Quem grava é o formulário, e a gravação
continua a passar pela cadeia (`motor/servidor/cadeia.js`), com o orçamento dela. A fronteira é a
mesma que a cadeia já declarou: **o ato é do professor; a travessia é do sistema.**

### 10.2 As pétreas

| Pétrea | O que ela proíbe aqui | Como é cumprida |
|:--|:--|:--|
| **P-03/P-04** — a proveniência acrescenta | Reescrever um elo, "corrigir" um documento gravado | Nenhuma ferramenta de escrita; o prompt manda propor elo novo; o agente não tem o texto do documento para reescrever sem o citar |
| **P-08** — os campos são declarados em schema | Inventar campo | O agente lê o schema do PO/plano; não propõe campo que não exista |
| **P-12** — apelidos estáveis | Nome completo, contato, saúde | `acesso: escola` no índice; o prompt proíbe; a ferramenta não devolve o campo |
| **P-19** — os prompts vivem no repositório | Prompt escondido no código | `prompts/agente-sistema.md`, versionado |
| **P-21** — linguagem harmonizada | Texto genérico | O prompt fixa a voz e o vocabulário da modalidade |
| **P-22** — condições materiais declaradas | Custo escondido | §7 inteira: modelo, Neurons, tectos, registo |

### 10.3 O KV

**Usado, e não para sessão.** Três usos, todos já existentes: (a) o **índice com cache**
(`indice-acervo.lerComCache`) — que é o que segura os subpedidos; (b) as **curadorias/turmas/linhas de
base** (`bastidores/<escola>/…`); (c) o **registo de custo** (`ia-registro/`). **Nenhuma chave nova.**
A conversa não é estado do servidor — está no cliente, como em `/api/ia`. E a disciplina da cota
diária do KV (AGENTS.md) continua a valer: o agente mede-se na bancada, não a carregar páginas ao ar.

### 10.4 A identidade visual

**Nenhuma peça nova (§11).** O painel compõe-se de `.bloco-lista` (o `details` que já abre e fecha),
`.caixa` / `.caixa.falta` (a resposta e a recusa), `.campo` (a caixa de texto), `.acao` (enviar),
`.res` (o erro) e `.veu[data-ocupado="sim"]` (a espera). Se alguma vez for preciso um `.conversa`,
ele nasce na folha, no catálogo e na prova — não na página. `node tools/check-identidade.js` é a
porta.

### 10.5 O ritual dos congelados

`prompts/` é congelado (`CONGELAMENTO.md`). Criar `prompts/agente-sistema.md` **é acrescentar** um
prompt novo, não alterar os existentes — mas a leitura conservadora do congelamento exige as três
coisas: **motivo declarado** no corpo do commit, **entrada no `REGISTRO.md`** e **commit próprio**.
Fica assim, e não dentro do commit do módulo.

---

## 11. A peça de UI

**Onde: dentro de cada formulário, e não numa secção nova do menu.** Três razões:

1. **O contexto já está lá.** O agente precisa de saber **qual** documento se está a escrever; o
   formulário é o único sítio onde isso é evidente sem perguntar.
2. **A navegação é congelada.** «Alterar a estrutura de menu ou navegação» exige motivo declarado
   (`CONGELAMENTO.md`); um painel dentro da secção não mexe em menu nenhum.
3. **O gesto é o mesmo.** Escrever, ficar sem saber o que pôr, pedir ajuda, e continuar a escrever —
   no mesmo sítio.

**A forma, com as peças que existem:**

```
┌─ .bloco-lista (details) ────────────────────────────────┐
│ ▸ Assistente · PO · turma «Piano»        .seta-do-ato   │
│                                                          │
│   .caixa        a resposta (texto + .selo com a fonte)   │
│   .caixa.falta  a recusa, com o motivo e o que faltou    │
│   .campo        a caixa onde o professor escreve         │
│   .acao         «Perguntar»                              │
│   .res.erro     o erro de rede, se houver                │
└──────────────────────────────────────────────────────────┘
```

**A espera é o `.veu`**, o mesmo da operação do «Guardar»: cobre, põe `inert` e **diz** o que está a
acontecer («o assistente está a ler o plano anterior…»). Um `disabled` no botão não bastava em
Outubro e não basta aqui: a caixa de texto e o «Guardar» ao lado são caminhos para o mesmo
documento.

**O que o professor vê, e o que ele faz com isso.** O texto chega **como proposta**: um botão
«Usar» copia para o campo (sem gravar), e o «Guardar» que já existe é o que grava e dispara. É a
diferença entre sugerir e decidir — e é ela que mantém o sistema honesto.

---

## 12. A documentação de IA que já existia, e a nota de obsolescência

Cinco sítios, encontrados por varredura (`IA`, `LLM`, `agente`, `assistente`, `DeepSeek`,
`freio-custo`) em `*.md`, `*.js` e `*.json`. **Nenhum é apagado** (P-03/P-04).

| Onde | O que dizia | Estado desde 12/11/2026 |
|:--|:--|:--|
| `PLANEJAMENTO-LASTRO.md` §L7 (1605-1633) | «O escopo da IA (auxiliar na elaboração de planos e anamneses)» + «a IA **não** é assistente geral **nem mecanismo de consulta aos registros**» + «o medidor lido», com o stub como situação actual | **Superado em parte.** O agente continua a não ser assistente geral, mas **passa a consultar os registos da própria escola** por ferramentas com contrato. Nota datada aposta, com remissão para **L15** |
| `motor/nucleo/ia.js` (285 linhas) | «o stub, hoje; o **DeepSeek**, amanhã» + o contrato de turno e o freio de 30 turnos | **Obsoleto como plano.** Fica no repositório (P-03/P-04) e a rota `POST /api/ia` continua a servi-lo até a frente L15 o substituir. Nota datada no cabeçalho, sem tocar em código |
| `motor/servidor/rotas.js` — `POST /api/ia` + `ia-registro/registro.jsonl` | A conversa do stub e o registo de custo com `tokens = 0` | **O registo sobrevive** (o agente reusa a forma); **a rota é legado** |
| `experimentos/pe/freio-custo.md` | A instrução de escopo («a IA não conversa fora do PO»), o tecto de 30 turnos e o orçamento mensal por plano | **A instrução de escopo está superada**; o **freio** (limites + registo) sobrevive como princípio. **Não é versionado** — a nota vale aqui e no `REGISTRO.md`, e o ficheiro não se apaga |
| `FRENTES.md` §3, Trilho A (A1-A3) | «A3 — Freio de custo ✅ feito» | Nota datada: feito para o stub; a frente nova é a **L15** |

**O que *não* é documentação de IA deste sistema, e fica como está:** `po_ref/id-projeto.md`
(«IA generativa para assistência à codificação») é documento de referência do projeto de mestrado —
outro diretório, outra natureza. E `PLANO-PERGUNTAS-DA-PROVENIENCIA.md` **não** é documentação de IA:
é o catálogo de perguntas que as ferramentas consultam (§5.8) — é fonte, e não se toca.

---

## 13. Custo de desenvolvimento

Dias de desenvolvimento, com uma desenvolvedora, incluindo as provas e o ritual dos congelados.

| Etapa | Dias | Por quê |
|:--|--:|:--|
| Configuração (binding `ai` nos três wrangler, modelo, `SUBPEDIDOS` declarado) | **1** | Três ficheiros de config e um deploy de teste por escola; a conta dos Neurons mede-se aqui |
| Núcleo do agente (registo, contrato, condução, mensagens) | **3** | Quatro ficheiros puros; a validação em tempo de execução é a parte que não se improvisa |
| As 8 ferramentas + os leitores que as alimentam | **4** | Cada uma liga a um leitor que já existe, mas o **recorte** e a **recusa** são trabalho novo |
| Servidor (`agente.js` + `mcp.js` + registo de custo) | **2,5** | O laço é curto; o JSON-RPC do MCP e o contador de KV são o que custa |
| UI (painel no formulário, sem peça nova) | **2** | `.bloco-lista` + `.campo` + `.acao` + `.veu`; o trabalho é o cliente e a acessibilidade |
| Contador e limites (KV no contador, tectos, leitura do registo) | **2** | Mexe no `subpedidos.js`, que é decisão congelada por §5.26 |
| Provas (`provar-agente.js` + negativos + bancada com `env.AI` falso) | **3** | Nove asserções, uma delas com controlo negativo do prompt |
| Avaliação da qualidade do 8B (20 casos reais, medidos) | **2** | Sem isto só se sabe que o encanamento funciona — não que o texto presta |
| Documentação (este ficheiro já está; nota de obsolescência, `REGISTRO`, `ESTADO`, `PLANEJAMENTO`) | **1** | — |
| **Total** | **≈ 20,5 dias** | |

**O que a estimativa não inclui, e deve ser dito:** a qualidade do Llama 3.1 8B em português
pedagógico é uma **incógnita medida, não resolvida** — os 2 dias acima são para a medir, e a
conclusão pode ser «subir para o 70B», que custa 2,7× o Neuron e muda a conta do §7.2.

---

## 14. Riscos e perguntas em aberto

**Riscos técnicos**

1. **O suporte a `tools` no 8B AWQ.** Se o modelo não aceitar `tools` no Workers AI, o contrato
   passa a «JSON no texto» + validação em tempo de execução. **A medir na primeira chamada** — o
   desenho do §5 não muda, muda o transporte.
2. **A CPU de 10 ms.** O `JSON.parse` do índice é o suspeito. Mitigação no §7.5; **a medir**.
3. **O contador que não vê o KV** (§7.1, ponto 3). É dívida herdada; se não se corrigir, o agente
   mente sobre o próprio custo. **Decidido:** corrige-se na mesma frente, com commit próprio.
4. **A cota de KV diária** (AGENTS.md). Cada interação lê KV; uma sessão longa soma. O tecto de
   chamadas (§7.4) é o que a contém.

**Riscos de produto**

5. **10.000 Neurons por dia são da conta, não da escola.** Com três escolas a usar o agente, a cota
   é a mesma. A cota por plano (L9) é que resolve — e é frente separada.
6. **A recusa é o comportamento mais importante e o mais difícil de afinar.** Um agente que recusa
   demasiado é inútil; um que inventa é pior do que inútil. A prova mede o mecanismo; a qualidade do
   limiar mede-se com os 20 casos.

**Perguntas para a pesquisadora** *(nenhuma bloqueia a documentação; todas bloqueiam a implementação)*

1. **Onde o painel abre primeiro** — nos quatro formulários, ou só no PO e no Estilo (onde a ajuda
   rende mais)? A recomendação é começar por dois.
2. **O crédito é o Neuron?** (§7.2) A conta está feita; a unidade comercial é decisão de L9/L11.
3. **O agente pode citar o apelido de uma aluna** ao sugerir um critério de observação, ou só a
   turma? A recomendação é o apelido, que é o que o PO já usa.
4. **Subir para o 70B** se os 20 casos mostrarem que o 8B não sustenta o português pedagógico? Custa
   2,7× o Neuron por token — a mesma cota diária dá ~43 interações em vez de ~116.

---

## Referências

- [ARQUITETURA-GERAL.md](ARQUITETURA-GERAL.md) — §2 (onde cada coisa vive), §4 (sistema de ficheiros,
  não banco), §5.26 (o orçamento de subpedidos), §7.3 (a arquitetura de índices), §7.4 (grafos ou
  índices)
- [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](PLANO-PERGUNTAS-DA-PROVENIENCIA.md) — as 76 perguntas, e a
  forma da resposta (`medida + caminho + elo`) que o §4 deste documento aplica
- [PLANEJAMENTO-LASTRO.md](PLANEJAMENTO-LASTRO.md) — L6 (o catálogo de consultas), L7 (a fronteira da
  IA, agora superada em parte), **L15** (esta frente), L9/L11 (cotas e porta paga)
- [PROTOCOLO.md](PROTOCOLO.md) — P-03/P-04, P-08, P-12, P-19, P-21, P-22
- [IDENTIDADE-VISUAL.md](IDENTIDADE-VISUAL.md) — o catálogo das peças (§11) e a checagem «Peça»
- `motor/nucleo/indices.js` — as **6** perguntas implementadas (GE01, CT01, PV01, AL01, TR01, OB01) do
  catálogo de 76
- `motor/servidor/indice-acervo.js` — o índice com cache, e o custo medido do rebuild (§7.1)
- `motor/nucleo/ia.js` — o stub legado (§12)
- Cloudflare — *Workers · Limits* (subpedidos, serviços internos, CPU) e *Workers AI · Pricing*
  (10.000 Neurons/dia; tabela de Neurons por modelo), lidas a 12/11/2026
