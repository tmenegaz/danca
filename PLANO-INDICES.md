# Plano — Índices do acervo (a infraestrutura de busca)

> **Status.** Plano de implementação. **Nada foi implementado.** Este documento descreve a frente de
> indexação que precisa existir **antes** da Tabela de atividades.
>
> **Precedência declarada (18/10/2026).**
>
> 1. **Identidade visual — CONCLUÍDA (18/10/2026).** O item **2.8** fechou: três famílias, seis
>    temas, 186 pares medidos, e a checagem «Famílias» impede folha e validador de divergirem.
>    `node tools/check-identidade.js` passa nas **19** verificações e não resta nenhum `[ ]` no
>    `IMPLEMENTACAO-IDENTIDADE.md`. **A porta está aberta — nada mais bloqueia este plano.**
> 2. **Este projeto — os índices.** É infraestrutura: sem ela, cada filtro novo vira varredura.
>    **É por aqui que se começa a implementar.**
> 3. **O catálogo de perguntas** ([PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md))
>    — define **o que** o índice precisa de guardar para responder às perguntas da escola. A §7.5
>    deste documento é o handoff dele para cá. O **catálogo fechou em 19/10/2026** (76 perguntas
>    firmadas, 9 no Núcleo Comum); o que vem depois dos índices é a sua **implementação** (as
>    consultas determinísticas de L6), na ordem de `PLANO-PERGUNTAS` §12 — **Núcleo antes de
>    qualquer consulta analítica**.
> 4. **A Tabela de atividades** ([PLANO-TABELA-DE-ATIVIDADES.md](./PLANO-TABELA-DE-ATIVIDADES.md)),
>    que consome os índices e não os substitui.
>
> **Relação com o planejamento do produto.** Este projeto é a primeira entrega concreta de parte
> de **L1** (dicionário de campos), **L2** (identidade estável) e **L4** (mapa de relações e
> índice) do [PLANEJAMENTO-LASTRO.md](./PLANEJAMENTO-LASTRO.md) §4 — mas **não** as implementa por
> inteiro. O escopo aqui é o mínimo que a busca e os filtros exigem, declarado no §17.
>
> **Regra central.** O índice é **derivado, determinístico e reconstruível**. Ele não é fonte, não
> é âncora e não guarda conteúdo pedagógico: guarda **metadados, identificadores estáveis e
> relações**. O que não se pode reconstruir a partir dos arquivos e das âncoras não entra no
> índice.

---

## 0. O problema, em uma frase

O motor cria escolas, professores, ciclos, documentos, pacotes e âncoras — mas **não existe um
índice que os descreva em conjunto**. O que existe é: um inventário de arquivos por escola
(`escola/<slug>/indice.json`), que a aplicação quase não lê; um índice por ciclo (`ciclos.json`),
que é do pacote e não conversa com os outros; e listas no KV, que só existem em runtime. Cada
pergunta — «que documentos deste professor existem?», «que escolas têm ciclo ativo?», «que salas
desta escola já foram usadas?» — é respondida por varredura, e cada filtro novo repete a varredura.

O índice resolve isso uma vez. A Tabela de atividades, depois, escolhe **quais** filtros oferecer;
o índice já os terá pré-calculado.

---

## 1. Auditoria — o que existe hoje, com evidência

### 1.1 Artefatos de índice que já existem

| Artefato | Onde | Quem gera | Quem lê | O que é |
|:--|:--|:--|:--|:--|
| `escola/<slug>/indice.json` | `escola/` | `tools/criar-escola.sh` §8 | `escola/expurgar.js`, `motor/servidor/repo-escola.js` (chamado por `raiz.js`) | Inventário **de arquivos** do scaffold + lápide do expurgo |
| `ciclos.json` | pacote do ciclo | `tools/gerar-ciclo.sh` | `motor/nucleo/lancamento.js`, `tools/check-pacote.js`, formulário | Índice **por ciclo**: aulas, datas, prazos, config |
| `raiz/escolas-habilitadas.json` | `raiz/` | à mão (andaime) | `motor/servidor/raiz.js`, `escola/expurgar.js` | Estado de habilitação para o expurgo |
| `biblioteca/modalidades/modalidades.json` | `biblioteca/` | à mão | `bastidores.js`, plano | Catálogo **compartilhado** de modalidades |
| `.fipp` | ao lado do `.conf` do ciclo | `tools/hash-ciclo.sh` | validação, HANDOFF, humanos | Âncora de proveniência encadeada |

### 1.2 O que o índice atual **não** faz

1. **Não é de dados.** `escola/<slug>/indice.json` lista caminhos de arquivos do scaffold; não
   lista documentos pedagógicos, aulas, âncoras nem relações.
2. **Não é transversal.** Não há um arquivo que responda «todas as escolas», «todos os
   professores», «todos os ciclos». A raiz monta a lista varrendo a árvore do GitHub
   (`repo-escola.js`, `arvoreDeCaminhos`) a cada pedido.
3. **Não tem vocabulário de filtros.** Não há lista declarada de tipos de documento, categorias,
   estados ou valores possíveis.
4. **Não é atualizado pelo motor.** Só o `criar-escola.sh` escreve o inventário. `gerar-ciclo.sh`,
   `escrever-po.js`, `escrever-plano.js` e `escrever-ciclo.js` criam documentos e não tocam nele.
5. **Não é reconstruível por contrato.** Não há `--check`, não há teste de determinismo, não há
   validador que compare o índice com os arquivos.
6. **Não serve a busca.** Nada é servido estaticamente como índice; a raiz varre a API do GitHub.
7. **Não responde perguntas pedagógicas.** Não há como perguntar «o que já foi trabalhado com esta
   aluna», «em que aulas ela faltou», «que colunas do PO não foram observáveis»: o lançamento não
   tem leitor, a aluna não tem ID estável e o índice não guarda presença, marca nem condição de
   contorno. O catálogo que pede essas respostas está em
   [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md); o que ele exige
   daqui está na §7.5.

### 1.3 O que o motor cria (e que precisa de entrada no índice)

| Caminho de criação | O que nasce | Onde |
|:--|:--|:--|
| `tools/criar-escola.sh` | pasta do professor, 5 schemas, 2 manifestos, pacote zero, `wrangler.<slug>.jsonc`, `escola/<slug>/indice.json` | Git |
| `tools/gerar-ciclo.sh` | HTML + PDF + menu, `ciclos.json`, documentos derivados, `.fipp` | Git |
| `tools/hash-ciclo.sh` | `.fipp` do ciclo e das aulas | Git |
| `motor/servidor/escrever-po.js` | PO elicitado (`.md`) via GitHub Contents API | Git |
| `motor/servidor/escrever-plano.js` | plano de ensino (`.md`) via GitHub Contents API | Git |
| `motor/servidor/escrever-ciclo.js` | plano do ciclo / documentos derivados via GitHub | Git |
| `motor/nucleo/porta.js` | envelopes de anamnese, plano e PO; cofre cifrado | KV |
| `motor/servidor/bastidores.js` | professor, aluna, turma, curadoria, vocabulário, rubrica | KV |
| `motor/servidor/bastidores.js` (quando o módulo da Tabela existir) | espaço, evento, relação turma ↔ espaço | KV |
| `escola/expurgar.js` e `repo-escola.js` | elo de expurgo no inventário da escola | Git |
| Publicação da programação (futuro) | retrato publicado | KV + Git (espelho) |

### 1.4 Restrições que o desenho tem de respeitar

- **O KV não é pesquisável.** O contrato é `get/put/list(prefixo)`; não há filtro nem ordenação.
  Índice de busca **não** pode depender de `kv.list` na leitura.
- **A árvore do GitHub é uma chamada cara.** A raiz já a usa para listar professores; um índice
  estático elimina essa varredura do caminho de leitura.
- **O pacote do ciclo é público.** Tudo o que entra em `professores/<p>/ciclos/ciclo-XX-<escola>/`
  é servido pelo Worker da escola **sem autenticação** (asset-first). Índice com caminho de
  acompanhamento, apelido ou PO não pode ser copiado para lá.
- **A raiz é protegida.** `motor/servidor/raiz.js` exige `SENHA_RAIZ` antes de servir qualquer
  coisa, inclusive assets. Um índice interno servido pela raiz é estático **e** restrito.
- **`tools/` é congelado.** Os scripts e validadores novos exigem motivo declarado, entrada no
  `REGISTRO.md` e commit próprio (`CONGELAMENTO.md`).
- **A âncora é a fonte da proveniência.** O índice **copia** os campos do `.fipp`; nunca os
  recalcula. Se recalcolasse, haveria duas fórmulas de hash.

---

## 2. Princípios

1. **Derivado, nunca fonte.** O índice é reconstruível a partir dos arquivos e das âncoras. Apagar
   e regenerar produz o mesmo conteúdo.
2. **Determinístico.** Sem relógio no conteúdo, sem ordem de `readdir`, sem aleatoriedade. O mesmo
   commit produz os mesmos bytes.
3. **Identificador estável, caminho descartável.** O filtro usa o ID; o caminho é metadado.
   Renomear um arquivo não muda a identidade lógica do documento.
4. **Metadado, não conteúdo.** Título, tipo, data, ciclo, escola, âncora, estado. Nunca o corpo do
   documento, nunca apelido de aluna, nunca observação interna.
5. **Fora da âncora.** O índice não entra no `.fipp`. Se entrasse, cada regeneração reancoraria o
   ciclo — e a cadeia passaria a registrar o índice, não as fontes.
6. **Público é uma decisão, não um efeito.** O índice interno não é copiado para o pacote. Só o
   índice publicado (programação) é público, e ele é um recorte declarado.
7. **Estático para ler, vivo para editar.** A leitura é um GET de arquivo; a edição continua no KV
   e nas rotas autenticadas. Não se cria um segundo banco.
8. **Um vocabulário, não uma lista por página.** Os valores dos filtros vêm de declarações
   versionadas (`indices/esquema/`), não de arrays escritos em cada interface.

---

## 3. As três famílias de índice

```
┌──────────────────────────────┐   ┌──────────────────────────────┐   ┌────────────────────────┐
│ 1. ACERVO (build)            │   │ 2. VIVO (runtime)            │   │ 3. PUBLICADO (publish) │
│                              │   │                              │   │                        │
│ Git · determinístico         │   │ KV · autenticado             │   │ KV + espelho Git       │
│ escolas, professores, ciclos │   │ turmas, espaços, eventos,    │   │ programação publicada  │
│ documentos, aulas, âncoras   │   │ curadorias, facetas          │   │ + facetas + dias       │
│                              │   │                              │   │                        │
│ Serve: raiz (protegida)      │   │ Serve: Produção (token)      │   │ Serve: página pública  │
└──────────────────────────────┘   └──────────────────────────────┘   └────────────────────────┘
            ▲                                  ▲                                  ▲
            └──────────── mesma gramática de IDs e de vocabulário ────────────────┘
```

- **Acervo** responde «o que existe e onde está» — é o índice do que o motor cria.
- **Vivo** responde «o que está valendo agora nesta escola» — é o índice da Produção.
- **Publicado** responde «o que o público pode consultar» — é o retrato da Tabela de atividades.

Os três partilham **os mesmos IDs e o mesmo vocabulário de filtros**. É isso que faz um filtro
novo ser uma linha na declaração, e não uma reescrita.

---

## 4. Modelo de dados

### 4.1 As declarações (`indices/esquema/`)

São a **fonte** do vocabulário. Versionadas, revisadas como código, validadas pelo
`check-indices.js`.

> **Regra de edição.** Em `indices/`, só `indices/esquema/` é escrito à mão. Todo o resto
> (`acervo.json`, `escolas/`, `ciclos/`, `publico/`) é **gerado**; editar à mão é sobrescrito na
> próxima regeneração e reprovado pelo `--check`.

| Arquivo | Conteúdo |
|:--|:--|
| `campos.json` | Dicionário mínimo de campos: nome, tipo, obrigatório, público/interno |
| `tipos.json` | Tipos de documento e o padrão que os reconhece no nome do arquivo |
| `relacoes.json` | Relações declaradas (entidade → entidade, chave, cardinalidade) |

Exemplo de `tipos.json`:

```json
{
  "versao": 1,
  "tipos": [
    { "id": "manifesto", "rotulo": "Manifesto do ciclo", "padrao": "ciclo-[0-9]{2}(-[a-z0-9-]+)?\\.conf$", "publico": false },
    { "id": "plano", "rotulo": "Plano do ciclo", "padrao": "ciclo-[0-9]{2}(-[a-z0-9-]+)?-plano\\.md$", "publico": false },
    { "id": "aula", "rotulo": "Aula", "padrao": "aula-[0-9]{2}\\.md$", "publico": false },
    { "id": "po", "rotulo": "Plano de Observação", "padrao": "-po\\.md$", "publico": false },
    { "id": "caderno", "rotulo": "Caderno", "padrao": "caderno-[0-9]{2}\\.md$", "publico": false },
    { "id": "relatorio", "rotulo": "Relatório pós-aula", "padrao": "relatorio-", "publico": false },
    { "id": "acompanhamento", "rotulo": "Acompanhamento por aluna", "padrao": "acompanhamento-", "publico": false, "pseudonimo": true },
    { "id": "notacao", "rotulo": "Notação", "padrao": "notacao", "publico": false },
    { "id": "glossario", "rotulo": "Glossário", "padrao": "glossario-", "publico": false },
    { "id": "harmonizacao", "rotulo": "Harmonização", "padrao": "harmonizacao", "publico": false },
    { "id": "ancora", "rotulo": "Âncora de proveniência", "padrao": "\\.fipp$", "publico": false },
    { "id": "pacote", "rotulo": "Pacote entregue", "padrao": "^ciclo-[0-9]{2}-[a-z0-9-]+/$", "publico": true }
  ]
}
```

Exemplo de `relacoes.json`:

```json
{
  "versao": 1,
  "relacoes": [
    { "de": "professor", "para": "escola", "chave": "escola.professores[].slug", "cardinalidade": "N:N" },
    { "de": "ciclo", "para": "professor", "chave": "professor", "cardinalidade": "N:1" },
    { "de": "ciclo", "para": "escola", "chave": "escola", "cardinalidade": "N:1" },
    { "de": "documento", "para": "ciclo", "chave": "ciclo_id", "cardinalidade": "N:1" },
    { "de": "aula", "para": "ciclo", "chave": "ciclo_id", "cardinalidade": "N:1" },
    { "de": "ancora", "para": "ciclo", "chave": "ciclo_id", "cardinalidade": "1:1" },
    { "de": "documento", "para": "ancora", "chave": "ancora.id", "cardinalidade": "N:1" }
  ]
}
```

O validador recusa relação cuja entidade ou chave não exista no dicionário — é o critério (iii) que
o `PLANEJAMENTO-LASTRO.md` §4/L4 já exigia.

### 4.2 Índice de acervo — `indices/acervo.json`

Visão transversal, **sem documentos**: entidades, contagens e vocabulário. Fica pequeno para ser
servido de uma vez.

```json
{
  "versao": 1,
  "gerado_em": "2026-10-18T22:00:00-03:00",
  "fonte": { "commit": "abc1234" },
  "escolas": [
    {
      "id": "escola:fita",
      "slug": "fita",
      "nome": "Fita",
      "worker": "fita",
      "habilitada": true,
      "expurgada": false,
      "professores": ["tiago-menegaz"],
      "ciclos": ["ciclo:tiago-menegaz/01/fita"],
      "contagens": { "ciclos": 1, "documentos": 3, "aulas": 5, "ancoras": 1 }
    }
  ],
  "professores": [
    {
      "id": "professor:tiago-menegaz",
      "slug": "tiago-menegaz",
      "nome": "Tiago Menegaz",
      "escolas": ["fita", "valse"],
      "ciclos": ["ciclo:tiago-menegaz/01/fita", "ciclo:tiago-menegaz/01/valse"]
    }
  ],
  "ciclos": [
    {
      "id": "ciclo:tiago-menegaz/01/fita",
      "professor": "tiago-menegaz",
      "numero": "01",
      "escola": "fita",
      "variante": "fita",
      "escola_nome": "Fita",
      "estado": "ativo",
      "inicio": null,
      "fim": null,
      "aulas": 5,
      "documentos": 3,
      "pacote": "professores/tiago-menegaz/ciclos/ciclo-01-fita/",
      "ancora": { "id": "ciclo-01-fita", "hash": "ef5ee2…", "parent_hash": "", "ancorado_em": "2026-10-16" }
    }
  ],
  "filtros": {
    "escolas": [{ "valor": "fita", "rotulo": "Fita", "contagem": 1 }],
    "professores": [{ "valor": "tiago-menegaz", "rotulo": "Tiago Menegaz", "contagem": 2 }],
    "tipos": [{ "valor": "aula", "rotulo": "Aula", "contagem": 10 }],
    "anos": [{ "valor": "2026", "rotulo": "2026", "contagem": 2 }],
    "estados": [{ "valor": "ativo", "rotulo": "Ativo", "contagem": 2 }]
  },
  "nao_indexado": [
    { "familia": "conteudo", "motivo": "o índice guarda metadados, nunca o corpo do documento" },
    { "familia": "alunas", "motivo": "dado sensível; o apelido não entra no índice" },
    { "familia": "kv-runtime", "motivo": "o índice vivo é servido pela Produção, autenticado" }
  ]
}
```

### 4.3 Índice por escola — `indices/escolas/<slug>.json`

É o arquivo que responde «o que existe nesta escola»: ciclos, documentos, aulas, âncoras.

```json
{
  "versao": 1,
  "gerado_em": "2026-10-18T22:00:00-03:00",
  "fonte": { "commit": "abc1234" },
  "escola": {
    "id": "escola:fita",
    "slug": "fita",
    "nome": "Fita",
    "worker": "fita",
    "habilitada": true,
    "expurgada": false,
    "criada_em": "2026-10-16T12:00:00-03:00"
  },
  "professores": [
    { "id": "professor:tiago-menegaz", "slug": "tiago-menegaz", "nome": "Tiago Menegaz" }
  ],
  "ciclos": [
    {
      "id": "ciclo:tiago-menegaz/01/fita",
      "professor": "tiago-menegaz",
      "numero": "01",
      "variante": "fita",
      "estado": "ativo",
      "periodo": { "inicio": null, "fim": null },
      "sucessor": "ciclo:tiago-menegaz/02/fita",
      "contagens": { "aulas": 5, "documentos": 3, "ancoras": 1 },
      "aulas": [
        { "n": "01", "data": "2026-10-16", "inicio": "19:00", "fim": "19:55",
          "marco": "marco 1 teste", "estado": "lancada", "lancada": true,
          "prazo": "2026-10-16T01:00", "ancora": null, "config": "captura-aula-01.json" }
      ],
      "ancora": { "id": "ciclo-01-fita", "hash": "ef5ee2…", "parent_hash": "", "ancorado_em": "2026-10-16" },
      "pacote": { "caminho": "professores/tiago-menegaz/ciclos/ciclo-01-fita/", "html": 1, "pdf": 0 }
    }
  ],
  "documentos": [
    {
      "id": "documento:plano:professores/tiago-menegaz/ciclos/ciclo-01-fita-plano.md",
      "tipo": "plano",
      "rotulo": "Plano do ciclo",
      "titulo": "Plano — Ciclo 01 · Fita",
      "caminho": "professores/tiago-menegaz/ciclos/ciclo-01-fita-plano.md",
      "ciclo_id": "ciclo:tiago-menegaz/01/fita",
      "escola": "fita",
      "professor": "tiago-menegaz",
      "data": null,
      "estado": null,
      "ancora": { "id": "ciclo-01-fita", "hash": "ef5ee2…" }
    }
  ],
  "aulas": [
    {
      "id": "aula:tiago-menegaz/01/fita/01",
      "numero": "01",
      "ciclo_id": "ciclo:tiago-menegaz/01/fita",
      "data": null,
      "inicio": null,
      "fim": null,
      "estado": "planejada",
      "lancada": false,
      "ancora": null
    }
  ],
  "filtros": {
    "tipos": [{ "valor": "plano", "rotulo": "Plano do ciclo", "contagem": 1 }],
    "professores": [{ "valor": "tiago-menegaz", "rotulo": "Tiago Menegaz", "contagem": 1 }],
    "ciclos": [{ "valor": "01", "rotulo": "Ciclo 01", "contagem": 1 }],
    "datas": []
  }
}
```

- `ciclos[].aulas[]` é o `ciclos.json` do pacote **trazido para a camada consultável**. É o que
  permite responder «qual é a próxima aula» sem o Worker ler o `.conf` nem o pacote. O `estado` e o
  `prazo` são do instante da geração: o índice carrega `gerado_em` e quem lê **re-deriva**.
- `sucessor` é derivado da ordem dos `numero` do mesmo professor × escola. Serve CT05 e não
  inventa herança: o que o próximo ciclo herda está declarado no documento dele.
- `aulas[]` aparece duas vezes (dentro do ciclo e no topo) por conveniência de consulta; o
  validador exige que as duas cópias sejam idênticas — uma divergência é erro, não estilo.

### 4.4 Índice por ciclo — `indices/ciclos/<professor>/<nn>-<escola>.json`

Recorte do anterior, para ser servido no domínio da escola **atrás de rota autenticada**. É o
único índice de acervo que pode ser estático e restrito ao mesmo tempo; na v1 ele fica fora do
pacote público (ver §6.3).

```json
{
  "versao": 1,
  "gerado_em": "2026-10-18T22:00:00-03:00",
  "escola": "fita",
  "professor": "tiago-menegaz",
  "ciclo": "01",
  "id": "ciclo:tiago-menegaz/01/fita",
  "ancora": { "id": "ciclo-01-fita", "hash": "ef5ee2…", "parent_hash": "", "ancorado_em": "2026-10-16" },
  "documentos": ["documento:plano:professores/tiago-menegaz/ciclos/ciclo-01-fita-plano.md"],
  "aulas": ["aula:tiago-menegaz/01/fita/01"],
  "filtros": { "tipos": [], "datas": [] }
}
```

### 4.5 Índice vivo — `POST /api/bastidores/indice`

Gerado em runtime a partir do KV da escola, **autenticado**. Não é gravado no Git e não é público.

```json
{
  "escola": "fita",
  "gerado_em": "2026-10-18T22:00:00-03:00",
  "entidades": {
    "turmas": [
      {
        "id": "turma:bale-nivel-1",
        "nome": "Balé Nível 1",
        "ativa": true,
        "dias": ["qua"],
        "horarios": { "qua": "19:00" },
        "duracao_min": 60,
        "periodo": { "inicio": "2026-10-06", "fim": "2026-12-15" },
        "espaco_id": "sala-1",
        "professor": "tiago-menegaz"
      }
    ],
    "espacos": [{ "id": "espaco:sala-1", "nome": "Sala 1", "ativa": true }],
    "eventos": [{ "id": "evento:ensaio-2026-10-21-1000", "data": "2026-10-21", "inicio": "10:00", "fim": "12:00", "situacao": "pronto" }],
    "professores": [{ "id": "professor:tiago-menegaz", "slug": "tiago-menegaz", "nome": "Tiago Menegaz" }],
    "curadorias": [{ "id": "curadoria:tiago-menegaz/bale-classico/bale-nivel-1", "professor": "tiago-menegaz", "turma": "Balé Nível 1" }],
    "envelopes": [
      { "id": "envelope:anamnese-20261012-1149", "tipo": "anamnese", "data": "2026-10-12", "vinculado": true },
      { "id": "envelope:plano-20261012-1225", "tipo": "plano", "data": "2026-10-12", "vinculado": true }
    ],
    "alunas": [
      { "id": "aluna:vava", "nome": "Vavá", "turmas": ["bale-nivel-1"], "desde": "2026-10-06", "ate": null }
    ],
    "presenca": [
      { "aula": "aula:tiago-menegaz/01/fita/01", "data": "2026-10-06", "presentes": ["aluna:vava"], "ausentes": [] }
    ],
    "marcas": [
      { "aula": "aula:tiago-menegaz/01/fita/01", "data": "2026-10-06", "aluna": "aluna:vava",
        "coluna": "eixo_vertical", "bloco": "eixo_peso", "marca": "parcial" }
    ],
    "condicoes": [
      { "aula": "aula:tiago-menegaz/01/fita/01", "plano_seguido": "sim", "duracao_min": 60,
        "animo": 5, "interesse": 4, "harmonia": 4, "mudou": false }
    ],
    "ajustes": [
      { "aula": "aula:tiago-menegaz/01/fita/01", "data": "2026-10-06", "houve": false }
    ],
    "rubrica": [
      { "aula": "aula:tiago-menegaz/01/fita/04", "data": "2026-10-20", "aluna": "aluna:vava",
        "criterio": "Eixo", "nivel": "Satisfatório" }
    ]
  },
  "filtros": {
    "turmas": [{ "valor": "bale-nivel-1", "rotulo": "Balé Nível 1", "contagem": 1 }],
    "espacos": [{ "valor": "sala-1", "rotulo": "Sala 1", "contagem": 1 }],
    "dias": [{ "valor": "qua", "rotulo": "Quarta", "contagem": 1 }],
    "alunas": [{ "valor": "vava", "rotulo": "Vavá", "contagem": 1 }],
    "marcas": [{ "valor": "parcial", "rotulo": "Parcial", "contagem": 1 }],
    "colunas": [{ "valor": "eixo_vertical", "rotulo": "Eixo vertical", "contagem": 1 }]
  }
}
```

**Não inclui** senhas, hashes, sal, o **texto** de ajustes/surpresas/relatório, nem conteúdo de
documentos. Inclui o que as consultas do catálogo precisam de contar — e o **apelido** entra como
`aluna:<slug>`, que é o identificador pseudônimo estável (§4.10), não um nome completo.

> **Mudança de escopo em 18/10/2026, e ela é deliberada.** A primeira versão deste índice dizia
> «não inclui alunas». O catálogo de perguntas
> ([PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md)) não tem como
> responder AL01–AL10 sem uma chave de aluna. A regra que fica: o **índice vivo** (autenticado)
> pode identificar a aluna pelo apelido; o **índice de acervo** (servido pela raiz) **não**; e
> nenhum dos dois guarda o texto do registro. O apelido é dado de menor, e por isso a superfície
> onde ele aparece é só a autenticada.

Os **envelopes** entram só pelo metadado que o próprio ID carrega: tipo (`anamnese`, `plano`,
`po`), data e se está vinculado. O `contexto.aluna` do envelope **não** entra — é justamente o
dado que a `anamneses()` usa para a tela e que o índice não precisa de conhecer. O construtor lê
`listar('envelope/')` uma vez, por pedido, e cacheia o resultado em memória enquanto a requisição
dura.

O **namespace das chaves** é o do `bastidores.js`: `bastidores/<escola>/…` para as listas, e o
adaptador do KV prefixa o envelope com o slug (`<escola>/envelope/…`). A rota reusa as funções de
leitura existentes (`lerLista`, `turmas`, `professores`, `curadorias`) em vez de repetir as chaves;
duas cópias da mesma chave divergiriam no dia em que uma mudasse.

**Duas granularidades, uma rota.** O exemplo acima é a forma completa. Sem parâmetro, a rota
devolve o índice **estrutural** — entidades e facetas, **sem** `presenca`, `marcas`, `condicoes`,
`ajustes` nem `rubrica` —, que é curto e serve para listar e filtrar entidades. Com `{ ciclo }`,
acrescenta as cinco famílias do §4.9 para aquele ciclo; com `{ ciclo, aluna }`, devolve o recorte
de uma aluna. É o que mantém a resposta abaixo de ~200 KB (§7.3) numa escola de quatro turmas.

### 4.6 Índice publicado

Não é uma estrutura nova: é o **retrato publicado** que o
[PLANO-TABELA-DE-ATIVIDADES.md](./PLANO-TABELA-DE-ATIVIDADES.md) §3.5 já define, com um campo
`filtros` pré-calculado no ato de publicar. Ele vive em duas cópias coerentes:

- `bastidores/<escola>/programacao-publicada` (KV) — serve a página;
- `indices/publico/<slug>.json` (Git, espelho) — versionado e deployável.

O espelho é escrito pelo mesmo ato de publicar, pelo mesmo caminho de escrita no GitHub que
`escrever-po.js` usa. O commit grava **duas** cópias do mesmo documento, com o mesmo conteúdo:

- `indices/publico/<slug>.json` — a cópia canônica no repositório;
- `professores/<professor>/ciclos/<pacote>/indices/publico.json` — a cópia que o Worker da escola
  serve pelo ASSETS.

Se o commit falhar, o KV continua a servir a página; o espelho é a cópia auditável, e a falha é
reportada na resposta. O push do commit dispara `deploy-escolas.yml`, e é ele que põe a cópia do
pacote no ar.

### 4.7 Identificadores estáveis

| Entidade | Forma | Exemplo |
|:--|:--|:--|
| Escola | `escola:<slug>` | `escola:fita` |
| Professor | `professor:<slug>` | `professor:tiago-menegaz` |
| Ciclo | `ciclo:<professor>/<nn>/<escola>` | `ciclo:tiago-menegaz/01/fita` |
| Documento | `documento:<tipo>:<caminho>` | `documento:aula:professores/tiago-menegaz/ciclos/aula-01.md` |
| Documento pseudônimo | `documento:<tipo>:<ciclo>:<n>` | `documento:acompanhamento:ciclo:tiago-menegaz/01/fita:01` |
| Aula | `aula:<professor>/<nn>/<escola>/<aula>` | `aula:tiago-menegaz/01/fita/01` |
| Âncora | `ancora:<id do .fipp>` | `ancora:ciclo-01-fita` |
| Espaço | `espaco:<id>` | `espaco:sala-1` |
| Turma | `turma:<id>` | `turma:bale-nivel-1` |
| Evento | `evento:<id>` | `evento:ensaio-2026-10-21-1000` |
| Atividade publicada | `atividade:<origem>:<fonteId>:<data>:<inicio>` | `atividade:turma:bale-nivel-1:2026-10-21:19:00` |

Regras:

- O ID **não muda** quando o título muda. O caminho pode mudar; o ID de documento, não — e é por
  isso que ele carrega o caminho **na criação** e uma tabela de renames não é necessária na v1.
- Documento com `pseudonimo: true` em `tipos.json` (hoje, só `acompanhamento`) **não carrega
  caminho nem título**: o ID usa o ciclo e o número da aula. O arquivo continua no disco; o índice
  não o nomeia.
- O ID de aula usa `n` (a posição no ciclo), não a data. A data é metadado.
- O ID de atividade usa a origem e a fonte. Para a turma, o `fonteId` é o **slug do nome**
  (`slugificar(nome)`): o `id` do registro muda na derivação, o nome não — e o slug é seguro em
  URL. O nome de exibição fica em `turma`.

### 4.8 O que **não** é indexado

| Família | Por quê |
|:--|:--|
| Corpo de documentos | O índice aponta; não copia. Copiar criaria uma segunda fonte. |
| Acompanhamentos nomeados | Dado sensível (P-12). O acompanhamento entra como `acompanhamento:<ciclo>:<n>`, sem apelido e sem caminho. |
| Sujeitos do PO | Dado sensível; o documento entra, o conteúdo não. O **vínculo** com `aluna:<slug>` entra só no índice vivo. |
| Senhas, hashes, sal, tokens | Credencial. O inventário antigo já guarda só a **chave** da senha. |
| Conteúdo de envelopes e do cofre | Runtime e cifrado; o índice vivo lê só tipo, data e vínculo do ID, nunca `contexto.aluna` nem respostas. |
| Texto de `ajustes`, `surpresas` e `relatorio` | O índice guarda **que houve**, **quando** e **em que aula**; a prosa é lida do original autenticado. Copiá-la criaria uma segunda fonte de conteúdo pedagógico e o risco de vazar nome de aluna num arquivo de metadados. |
| Observações internas | Nunca saem da Produção. |
| Conteúdo de `experimentos/` | Demonstrativo; não entra em pacotes, hashes nem publicação. |

### 4.9 Índice de lançamentos — o que o catálogo de perguntas exige

O lançamento é o dado que responde às perguntas da escola, e hoje **não tem leitor** (`L3`). O
índice vivo (§4.5) extrai dele **cinco famílias de metadado**, e só isso:

| Família | O que guarda | O que **não** guarda | Serve a |
|:--|:--|:--|:--|
| `presenca` | aula, data, presentes, ausentes (IDs `aluna:`) | nome completo, contato | AL02, PE05, TR04 |
| `marcas` | aula, data, aluna, coluna, bloco, marca | o texto de qualquer observação | AL03, AL04, AL08, OB01–OB03 |
| `condicoes` | `plano_seguido`, `duracao_min`, ânimo/interesse/harmonia, `mudou` (booleano) | o texto de `condicoes_contorno.mudou` | EN01, OB06 |
| `ajustes` | aula, data, `houve` (booleano) | o texto do ajuste | EN02, EN03, AL07 |
| `rubrica` | aula, data, aluna, critério, nível (rótulo) | — | OB05, EN05 |

**Por que não guardar o texto.** A prosa de `ajustes`, `surpresas` e `relatorio` é conteúdo
pedagógico e pode conter nome de aluna. O índice serve para **contar e localizar**; a leitura do
texto é do documento, sob autenticação, com a âncora ao lado. É a mesma regra que separa «o que
mudou» de «o que diz» na página pública da cadeia (`IDEIA-PAINEL-ESCOLA.md` §13).

**Volume.** Uma escola com 4 turmas × 3 ciclos × 12 aulas × 20 alunas × 6 colunas ≈ 17 mil marcas.
É um objeto JSON de ~1,5 MB — acima do alvo do §7.3. Por isso o índice vivo é **por ciclo**:

```
POST /api/bastidores/indice   { ciclo: "01" }        →  índice vivo do ciclo (≈ 200 KB)
POST /api/bastidores/indice   { ciclo: "01", aluna: "vava" }  → recorte por aluna (≈ 10 KB)
```

Sem `ciclo`, a rota devolve o índice **estrutural** (entidades e facetas), sem as marcas. É a
diferença entre «listar o que existe» e «medir o percurso».

### 4.10 Identidade da aluna — `aluna:<slug>`

Hoje a aluna é o **apelido e nada mais**, e o próprio planejamento mede isso como instável
(`PLANEJAMENTO-LASTRO.md` §2.4). As perguntas AL01–AL10 atravessam ciclos e anos: sem uma chave
estável, elas não cruzam.

| Regra | Decisão proposta |
|:--|:--|
| Forma | `aluna:<slug-do-apelido>` — ex.: `aluna:vava` |
| Estabilidade | O slug é **gravado na primeira aparição**; mudar o apelido de exibição **não** muda o ID |
| Pseudonimato | O ID não é nome completo, não é documento, não é contato. O apelido é o rótulo (P-12) |
| Onde aparece | Índice **vivo** (autenticado) e lançamento. **Nunca** no acervo servido pela raiz nem no pacote público |
| Renomeação | Um alias mantém `apelidos[]` históricos; o ID é o primeiro slug e não se reescreve |
| Ausência | Uma aluna sem ID estável é **reportada**, não inferida por semelhança de nome |

Sem esta regra, AL01, AL05, AL06, AL09, AL10 e PE01–PE05 não são implementáveis — e é a
lacuna **L2** que o catálogo de perguntas torna obrigatória.

---

### 4.11 O professor no índice — faceta, vínculo e autoria (nunca eixo)

Decidido em 18/10/2026, junto com o catálogo de perguntas
([PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) §4.9.1–§4.9.2):

> **Regra.** `professor` é **faceta, vínculo e autoria**. Não é **eixo de agregação**. O índice
> responde «de quem é», «quem fez», «onde está» — e não responde «quanto este professor».

A regra não é estética: é o que impede o índice de virar a base da tabela de professores. Um índice
com `aulas_por_professor` é a consulta que ordena pessoas, mesmo que ninguém a escreva hoje.

**O que já existe (§4.5, medido).**

| Onde | O que guarda |
|:--|:--|
| `entidades.professores[]` | `id`, `slug`, `nome` |
| `entidades.turmas[].professor` | o responsável **atual** da turma |
| `entidades.curadorias[].professor` | o par professor × modalidade × turma |
| `ciclos[].professor` | de quem é o ciclo |
| `filtros.professor` | já é filtro em §7.1 |

**O que falta, e este plano passa a exigir.**

| Falta | Por quê | Serve a |
|:--|:--|:--|
| `vinculos[]` com **vigência** | `turmas[].professor` guarda só o responsável de hoje: não responde «mudou de professor?», nem «quem era em março» | `TR11`, `TR13` |
| `papel` no vínculo — `titular`, `substituto`, `observador` | a observação partiu do olhar de alguém; o substituto que deu a aula não é o titular da turma | `PV09`, `OB09` |
| `autoria` por documento | hoje o documento tem caminho e âncora, não autor declarado. `git log` dá quem **commitou**; revisão e assinatura não existem | `PV08`, `OB09`, `CT10` |
| `professor` na aula (`aulas[]`) | `ciclos[].professor` é o do ciclo; a aula pode ter sido dada por outro | `PV09` |
| `filtros.papel` | filtrar «só titular» × «inclui substituto» | `TR11`, `GE09` |

**Forma proposta, e é curta.**

```json
{
  "vinculos": [
    { "professor": "tiago-menegaz", "turma": "bale-nivel-1", "papel": "titular",
      "de": "2026-10-06", "ate": null },
    { "professor": "ana-souza", "turma": "bale-nivel-1", "papel": "substituto",
      "de": "2026-11-04", "ate": "2026-11-18" }
  ],
  "autoria": [
    { "documento": "documento:po:professores/tiago-menegaz/ciclos/ciclo-01-fita-po.md",
      "autor": "tiago-menegaz", "papel": "autor", "versao": 2, "em": "2026-10-12" }
  ]
}
```

**Três invariantes.**

1. **Vínculo tem vigência.** `de` obrigatório, `ate` nulo enquanto vigente. Sem intervalo, «quem era o
   professor em março» não tem resposta — e a resposta errada é pior que nenhuma.
2. **Autoria é declarada, não inferida.** `git log` diz quem fez o commit; `autor` diz quem escreveu.
   O índice guarda os dois, em campos diferentes, e nunca um no lugar do outro.
3. **Nenhuma agregação por professor é gerada.** O `check-indices` reprova qualquer chave que conte,
   some ou ordene por `professor` — `aulas_por_professor`, `total_por_professor`, `ranking_*`. É a
   verificação 13 do §9.

**O que a faceta não faz.** Filtrar por professor **não** é medir o professor. «Os ciclos de Tiago» é
escopo; «quantos ciclos Tiago tem comparado a Ana» é a tabela que a regra proíbe — e a diferença está
no **agrupamento**, não no filtro.

---

## 5. Geração

### 5.1 O gerador — `tools/gerar-indices.js`

Um script Node, sem dependências externas (o repositório já usa Node puro nos validadores).

```
node tools/gerar-indices.js              # regenera tudo
node tools/gerar-indices.js --check      # não escreve; falha se houver divergência
node tools/gerar-indices.js --escola fita
node tools/gerar-indices.js --json       # resumo legível por máquina (para o CI)
```

O que ele lê:

1. `wrangler.*.jsonc` — a lista de escolas, o `assets.directory`, o `ESCOLA_SLUG`, o KV. O
   `wrangler.danca.jsonc` é **excluído**: a raiz não é escola;
2. `escola/<slug>/indice.json` — o inventário/lápide (nome do professor, expurgo, recriação).
   Ausência não é erro: a `maria` não tem esse arquivo, e o índice usa o que existir;
3. `professores/**` — os manifestos, os documentos e os pacotes;
4. `**/*.fipp` — a âncora de cada ciclo e de cada aula;
5. `*.json` do pacote (`ciclos.json`) — as aulas e o estado derivado;
6. `indices/esquema/*.json` — o vocabulário;
7. `git rev-parse --short HEAD` — o `fonte.commit` (única leitura de ambiente; não entra em hash).

O que ele **não** lê: o conteúdo dos `.md` (só o front-matter mínimo para o título, quando
existir), o KV, a rede, o relógio.

### 5.2 Determinismo

- Chaves de objeto ordenadas (`JSON.stringify` com ordem fixa).
- Listas ordenadas por ID (`LC_ALL=C`).
- `gerado_em` **não** entra no `--check`; é o único campo volátil e é ignorado na comparação.
- `fonte.commit` idem: é informativo e muda a cada commit.
- Nada de `Date.now()` dentro do conteúdo comparável.

### 5.3 Gatilhos — quem regenera o quê

| Caminho | Índices afetados | Quem regenera |
|:--|:--|:--|
| `tools/criar-escola.sh` | acervo, escola, ciclo | o próprio script, no fim |
| `tools/gerar-ciclo.sh` | acervo, escola, ciclo | o próprio script, no fim |
| `tools/hash-ciclo.sh` (reancoragem) | ciclo (âncora) | quem o chama; se rodado sozinho, `gerar-indices` |
| `motor/servidor/escrever-po.js` | acervo, escola, ciclo | dispara `indices.yml` depois do commit |
| `motor/servidor/escrever-plano.js` | idem | idem |
| `motor/servidor/escrever-ciclo.js` | idem | idem |
| `motor/nucleo/porta.js` (anamnese, plano, PO) | vivo (`envelopes`) | sob demanda, na leitura; não há regeneração de Git |
| `escola/expurgar.js` / `apagarEscolaDoRepo` | acervo, escola (marca `expurgada`) | `gerar-indices`, depois do elo |
| Publicação da programação (futuro) | publicado | o ato de publicar |
| `tools/criar-escola.sh --somente-indice` | nenhum | — |

**Regra:** o índice é regenerado **no mesmo commit** em que a fonte nasce, quando quem cria é um
script local ou um workflow; e por **workflow dispatch** quando quem cria é o Worker, que não tem
o repositório inteiro à mão.

### 5.4 Workflow `indices.yml`

- **Gatilhos:** `push` em `professores/**`, `escola/**`, `indices/esquema/**`, `biblioteca/**`,
  `wrangler.*.jsonc`, `tools/gerar-indices.js`, `tools/check-indices.js`; e `workflow_dispatch`
  com um filtro opcional de escola.
- **No push:** roda `node tools/check-indices.js`. Se houver divergência, **falha** e diz o
  comando a correr. Não commita sozinho no push (evita laço e commit fantasma).
- **No dispatch:** roda `gerar-indices`, commita só `indices/` e `raiz/indices/`, e não dispara
  outro workflow (`GITHUB_TOKEN` não redispara).
- **Nos workflows que já criam:** `criar-escola.yml` e `gerar-ciclo.yml` passam a rodar o gerador
  antes do `git add`, e a incluir `indices/`, `escola/` e `raiz/indices/` no commit.

### 5.5 Hook local

`tools/hooks/pre-commit` passa a rodar `node tools/gerar-indices.js` e a **acrescentar**
`indices/` e `raiz/indices/` ao índice do commit. É a única forma de garantir que uma edição
manual de documento não deixa o índice velho sem depender da memória de quem edita.

> `tools/` e `tools/hooks/` são congelados: esta mudança exige motivo declarado, entrada no
> `REGISTRO.md` e commit próprio. A alternativa (só `--check` no hook, sem regenerar) é mais
> conservadora e deixa a correção para o CI; a decisão está em §17.

---

## 6. Serviço, deploy e acesso

### 6.1 Onde cada índice é servido

| Índice | Arquivo | Servido por | Acesso | Cache |
|:--|:--|:--|:--|:--|
| Acervo | `indices/acervo.json` + cópia `raiz/indices/acervo.json` | Worker raiz (ASSETS) | `SENHA_RAIZ` (Basic) | `no-store` ou curto |
| Escola | `indices/escolas/<slug>.json` | Worker raiz (ASSETS) | idem | idem |
| Ciclo | `indices/ciclos/<p>/<nn>-<escola>.json` | Worker raiz; cópia no pacote sob `/indices/` **apenas se** aprovado o recorte restrito (§6.3) | idem | idem |
| Vivo | resposta de `POST /api/bastidores/indice` | Worker da escola | token da direção | `no-store` |
| Publicado — espelho | `indices/publico/<slug>.json` (cópia no pacote) | Worker da escola (ASSETS) | público | `max-age=60` |
| Publicado — rota | retrato em `bastidores/<escola>/programacao-publicada` | Worker da escola (rota) | público | `no-store` |

### 6.2 Cópias e deploy

- `tools/gerar-raiz.sh` passa a copiar `indices/acervo.json` para `raiz/indices/acervo.json` (e,
  se aprovado, os por-escola). O `deploy-raiz.yml` já publica `raiz/**`.
- `tools/gerar-ciclo.sh` copia o índice **público** da escola para
  `<pacote>/indices/publico.json`; o `deploy-escolas.yml` já publica `professores/**`. O ato de
  publicar também grava essa cópia (ver §4.6), para o espelho não esperar a próxima geração.
- O índice de acervo **não** é copiado para o pacote público na v1. A cópia por ciclo no pacote
  fica condicionada a uma rota autenticada no Worker da escola (decisão §17, D-I4).
- `deploy-escolas.yml` e `deploy-raiz.yml` ganham `indices/**` nos `paths`, para uma regeneração
  sem mudança de fonte também publicar.

### 6.3 Por que o acervo não vai para o pacote público

O pacote é servido sem autenticação. Um índice por escola listaria caminhos e títulos de PO,
acompanhamentos e relatórios — e o nome do arquivo de um acompanhamento é o apelido da aluna.
Copiá-lo para o pacote seria **criar** a exposição que a política de dados sensíveis evita.

Portanto:

- o acervo completo fica **fora** do pacote e é servido pela raiz, que exige senha;
- o pacote recebe só `indices/publico.json`, que é o retrato publicado e não contém documento
  pedagógico nenhum;
- se a escola precisar consultar o acervo no próprio domínio, a rota é autenticada e o arquivo
  não fica sob um caminho servido pelo ASSETS.

Se a busca do acervo tiver de ser **pública**, o recorte é outro: um `indices/publico/acervo.json`
com escola, professor, ciclo, tipo e contagem — **sem** caminho, **sem** título de documento e
**sem** aula. É suficiente para um catálogo e não revela o material. A decisão está em D-I2.

### 6.4 Cabeçalhos

- Índice estático servido pelo ASSETS: deixar o default do Cloudflare ou declarar
  `Cache-Control: public, max-age=60, stale-while-revalidate=86400`.
- Índice interno (raiz): `Cache-Control: no-store`, para não deixar metadados em cache partilhada.
- Índice vivo e retrato servido por rota: `Cache-Control: no-store`, como as demais rotas
  dinâmicas.
- Espelho publicado (`indices/publico/<slug>.json`): `Cache-Control: public, max-age=60`, porque é
  um arquivo imutável entre publicações.
- `ETag` forte com o hash do arquivo é opcional na v1; o `--check` já garante o conteúdo.

### 6.5 A exportação do acervo — onde ela vive (decisão de 19/10/2026)

**Decisão.** A exportação do acervo é **capacidade do Núcleo Comum** e vive em **Bastidores →
Produção, seção «Acervo»**. É decisão de **localização**, não de desenho.

| O que fica decidido | Consequência |
|:--|:--|
| **Quem exporta** | a direção, autenticada — a mesma trava da Produção; a exportação não é consulta pública |
| **O que sai** | o acervo inteiro: fontes, lançamentos, cadastro, índice e programação publicada |
| **Em que plano** | em **qualquer** plano — o plano limita a **consulta**, não a **saída** (PLANO-PERGUNTAS §5.5) |
| **Qual índice serve de manifesto** | o índice de acervo (§4.2): ele já lista tipo, caminho e âncora de cada documento; a exportação não inventa uma segunda lista |
| **O que a exportação não faz** | não é consulta do catálogo (L6), não mede nada, e não altera o acervo |

**O que fica para a implementação.** O formato do pacote (diretório ou `.zip`), a tela e o registro
de quem exportou. Nada disso muda o contrato: **o que sai é o acervo, não um relatório do acervo.**

> **Por que a seção é «Acervo», e não uma rota nova.** A Produção já é a casa do cadastro, da
> curadoria e da programação; a exportação é a leitura do que essas seções produzem. Uma rota
> separada exigiria refazer a autenticação e a navegação para entregar o mesmo conteúdo.

---

## 7. Filtros e consulta

### 7.1 Filtros pré-determinados (v1)

| Chave | Valores | Onde é usado |
|:--|:--|:--|
| `escola` | slug | busca na raiz |
| `professor` | slug | busca na raiz e na Produção; **escopo**, não medida (§4.11) |
| `papel` | `titular`, `substituto`, `observador` | vínculo professor × turma, com vigência (§4.11) |
| `ciclo` | `NN` | busca na raiz |
| `tipo` | `tipos.json` | busca de documentos |
| `ano` | `AAAA` | busca por período |
| `data` | `AAAA-MM-DD` | aulas e programação |
| `estado` | `planejada`, `dada`, `lancada`, `nao_dada`, `ativa`, `expurgada`… | busca e painéis |
| `categoria` | `tipos.json` de atividade | Tabela de atividades |
| `espaco` | id | Tabela de atividades |
| `turma` | id | Tabela de atividades e percurso |
| `aluna` | `aluna:<slug>` | percurso da aluna (só no índice vivo) |
| `marco` | `n` do marco do plano | continuidade e objetivos |
| `marca` | `ok`, `parcial`, `nao`, `nao_vi`, `vazio` | percurso e instrumento |
| `coluna` | chave da coluna de captura | percurso e instrumento |
| `presenca` | `presente`, `ausente` | percurso |
| `plano_seguido` | `sim`, `parcial`, `nao` | ensino |

A Tabela de atividades escolhe **cinco** destes na v1 (`dia`, `categoria`, `espaco`, `professor`,
`turma`). O catálogo de perguntas usa `aluna`, `marco`, `marca`, `coluna` e `presenca` — e só no
índice vivo —, mais `professor` e `papel` para as consultas de vínculo (`TR11`, `TR13`, `GE09`).

> **Filtrar não é medir (§4.11).** `professor` e `papel` entram como **filtro** e como **escopo de
> leitura**. Nenhum deles é eixo de agrupamento: a consulta devolve as linhas do professor pedido, e
> nunca uma linha por professor.

Os outros existem no vocabulário, mas não aparecem na interface até haver necessidade — é a regra do
pedido: «não criar filtros sem necessidade identificada».

### 7.2 Índice invertido

Cada índice publica, por chave de filtro, a lista de IDs que têm aquele valor:

```json
{
  "filtros": {
    "tipos": [
      { "valor": "aula", "rotulo": "Aula", "contagem": 10, "ids": ["documento:aula:…", "…"] }
    ]
  }
}
```

- O filtro é uma interseção de listas — O(n) sobre listas curtas, sem varrer documentos.
- As contagens vêm prontas; não se recalcula nada na interface.
- Para o índice de acervo mestre, as listas de IDs ficam **fora** (só contagem) e o detalhe fica
  no arquivo por escola, para manter o mestre pequeno.

### 7.3 Orçamento de leitura

| Arquivo | Tamanho-alvo | Tempo-alvo |
|:--|:--|:--|
| `indices/acervo.json` | < 100 KB | 1 GET |
| `indices/escolas/<slug>.json` | < 250 KB | 1 GET |
| `indices/ciclos/…json` | < 50 KB | 1 GET |
| `indices/publico/<slug>.json` | < 30 KB | 1 GET |
| `POST /api/bastidores/indice` | < 100 KB | 1 request, sem `kv.list` |

Nenhuma leitura de filtro chama `arvoreDeCaminhos`, `kv.list` ou o GitHub. É essa a diferença
entre «rápido» e «rápido até a escola crescer».

### 7.4 Como um filtro novo entra

1. Declarar o campo em `indices/esquema/campos.json`.
2. Declarar o valor em `tipos.json` (se for um tipo) ou na declaração da entidade.
3. Rodar `gerar-indices`.
4. A interface lê `filtros.<chave>` — nenhum array é escrito à mão na página.

Um filtro novo é uma declaração e uma regeneração, não uma alteração em cada tela.

### 7.5 As perguntas que o índice tem de servir

Esta seção é o **handoff** de
[PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) §7 para este plano. Cada
linha diz o que o índice precisa de expor — e o que a consulta faz com isso.

| Família de pergunta | O que o índice expõe | Como a consulta resolve | Classe |
|:--|:--|:--|:--|
| **CT** continuidade | `ciclos[].aulas[]` com `data`, `inicio`, `fim`, `marco`, `prazo`, `estado`, `ancora` | ordena por data e filtra por `estado`; o leitor **re-deriva** `estado`/`prazo` com o próprio relógio | S |
| **AL** percurso | `alunas[]`, `presenca[]`, `marcas[]`, `rubrica[]` | filtra por `aluna` e agrega por `coluna` × `data` | C |
| **EN** ensino | `condicoes[]`, `ajustes[]`, `marcos[]`, `distribuicao-de-volume` | cruza plano × lançamento pelo `marco` e pela `aula` | C |
| **OB** instrumento | `marcas[]` com `marca` e `coluna`; colunas declaradas no PO | conta `nao_vi`/vazio por coluna sobre as aulas com registro | S |
| **TR** turma e sala | `turmas[]` (com vigência), `espacos[]`, retrato publicado | junta por `turma` e `espaco`; TR05/TR06/TR09/TR10/TR12/TR13/TR14 dependem da Tabela. TR08 compara organização, nunca resultado | C |
| **PE** permanência | `alunas[]` com primeira e última aparição; série por ciclo | série por `aluna`; agregado sem sujeito para PE04. **Não** há entidade de saída: a medida é «sem registro posterior» | C |
| **PV** proveniência | `ancora` por ciclo e por aula; `fonte.commit`; `autoria[]` | compara `hash` do índice com o arquivo; `PV06` é formato de resposta; PV07 é a ordem do `git log` | S |
| **GE** gestão | acervo, `turmas[]`, `ia-registro` (quando houver leitor) | contagens e listas; GE10 lê o `ia-registro` (L7) | S |
| **Núcleo — vínculo e autoria** | `vinculos[]` com `de`/`ate`, `autoria[]`, `turmas[].professor` | devolve **nome ou vínculo**, nunca contagem por professor; TR11 devolve a série, não o estado atual | S |

**Cobertura (19/10/2026).** O catálogo tem **76 perguntas firmadas** — 9 no Núcleo Comum, 7 no
Básico, 14 no Intermediário e 46 no Avançado (PLANO-PERGUNTAS §5.5). A exportação do acervo (§6.5)
é capacidade do Núcleo e usa o índice de acervo como **manifesto** do que sai.

**Uma família que saiu (18/10/2026).** A família **EX** — exame externo. O índice chegou a prever
`resultados-externos[]` e `saidas[]`; com as duas entidades fora de escopo
([PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) §6), as duas listas
saem também. Nenhuma faceta e nenhum filtro dependia delas — e o `check-indices` não deve exigir
chave que nenhuma consulta lê.

**Três invariantes que o índice tem de cumprir para servir a estas perguntas.**

1. **Aula é unidade de junção.** Toda marca, presença, condição e rubrica carrega `aula` (o ID do
   §4.7) e `data`. Sem isso, o cruzamento plano × lançamento não tem chave.
2. **Ausência tem nome.** `nao_vi` e `vazio` são valores distintos de `nao`. A consulta precisa de
   os contar separadamente — e o índice não pode colapsá-los.
3. **Toda linha aponta para a âncora.** Uma `marca` sem o `ancora` do ciclo não serve a PV06, e a
   resposta deixa de ser proveniência.

**O que o índice não faz por estas perguntas.** Não calcula a medida: entrega as linhas e as
facetas. A agregação é da consulta (L6), que é determinística e testável — e que devolve a
`recusa` junto com o número.

---

## 8. Proveniência

### 8.1 O índice copia a âncora; não a calcula

Cada entrada de ciclo e de aula carrega `ancora: { id, hash, parent_hash, ancorado_em }`, lidos do
`.fipp`. O índice **nunca** recalcula SHA-256. A fórmula continua a ter uma só implementação:
`tools/hash-ciclo.sh`.

### 8.2 O índice fica **fora** da âncora

Decisão recomendada (D-I1):

- A âncora cobre as **fontes** do ciclo (`*.md` e `*.conf`), como hoje.
- O índice é **dado derivado**; se entrasse na cobertura, cada regeneração mudaria o hash do ciclo
  — e a cadeia passaria a registrar o índice, não o trabalho.
- Consequência: apagar `indices/` e regenerar não afeta nenhuma âncora. É o teste de reconstrução.

### 8.3 O que o índice acrescenta à proveniência

- **Rastro navegável:** o índice liga documento → ciclo → âncora, sem varrer o repositório.
- **Estabilidade:** o ID do documento sobrevive a rename e a mudança de título.
- **Diff:** comparar dois índices de commits diferentes mostra o que nasceu, mudou ou foi
  expurgado — o mesmo tipo de leitura que o `git log` já permite, mas em uma consulta.
- **Compatibilidade futura:** quando o módulo de proveniência do produto existir, ele encontra no
  índice os IDs e as relações de que precisa. O índice **não** substitui o `.fipp` nem o FIPP.

---

## 9. Validação

### 9.1 `tools/check-indices.js`

| # | Verificação | Falha quando |
|:--|:--|:--|
| 1 | Reconstrução | `gerar-indices` produz bytes diferentes do commit (ignorando `gerado_em` e `fonte.commit`) |
| 2 | Existência | um caminho declarado não existe |
| 3 | Âncora | `id`, `hash`, `parent_hash` ou `ancorado_em` divergem do `.fipp` |
| 4 | Unicidade | dois itens com o mesmo ID |
| 5 | Cobertura | um `wrangler.*.jsonc` não tem entrada, ou uma entrada não tem config |
| 6 | Cópias | `raiz/indices/*` ou `<pacote>/indices/*` divergem da fonte |
| 7 | Privacidade | aparece `senha`, `hash`, `sal`, `nome completo`, `observacoes`, `email`, `telefone`, `saude`, o **texto** de `ajustes`/`surpresas`/`relatorio`, ou um caminho `acompanhamento-*`. São **permitidos** o ID `aluna:<slug>` e o apelido **no índice vivo**; no acervo (`indices/acervo.json`, `indices/escolas/`, `indices/ciclos/`) o apelido é proibido. A lista `nao_indexado` é a exceção declarada: nomeia as famílias excluídas de propósito |
| 8 | Declaração | um tipo de documento existe no repositório e não está em `tipos.json`, ou vice-versa |
| 9 | Relações | uma relação aponta para entidade/chave inexistente |
| 10 | Facetas | a contagem de um `filtros` não bate com a lista de itens |
| 11 | Determinismo | duas execuções seguidas produzem o mesmo resultado |
| 12 | Expurgo | uma escola expurgada some do índice (deve ficar com `expurgada: true`) |
| 13 | **Sem eixo de professor** | o índice traz uma chave que **conta, soma ou ordena por `professor`** — `aulas_por_professor`, `total_por_professor`, `desempenho_*`, `ranking_*`. Faceta (`filtros.professor`), vínculo (`vinculos[]`) e autoria (`autoria[]`) são permitidos; agregação, não (§4.11) |

### 9.2 Contraprovas obrigatórias

Cada uma deve **reprovar** com a mensagem certa, e ser desfeita antes do commit:

1. apagar um `.fipp` → verificação 3;
2. alterar um caractere do `hash` no `.fipp` → verificação 3;
3. acrescentar `"apelido": "Vavá"` a um item → verificação 7;
4. renomear um documento sem regenerar → verificação 1;
5. duplicar um item → verificação 4;
6. remover uma escola do `acervo.json` sem removê-la do disco → verificação 1;
7. apagar `indices/` e regenerar → deve passar (prova de reconstrução);
8. acrescentar `"aulas_por_professor": { "tiago-menegaz": 12 }` a um índice → verificação 13;
9. um `vinculos[]` com `de` nulo, ou uma `autoria` sem `autor` → verificação 9.

---

## 10. Arquivos a criar e alterar

### 10.1 Criar

| Arquivo | Papel |
|:--|:--|
| `indices/esquema/campos.json` | Dicionário mínimo de campos |
| `indices/esquema/tipos.json` | Tipos de documento e padrões |
| `indices/esquema/relacoes.json` | Mapa de relações |
| `tools/gerar-indices.js` | Gerador determinístico |
| `tools/check-indices.js` | Validador (ou `gerar-indices.js --check`, se ficar num só) |
| `experimentos/provar-indices.js` | Provas de determinismo, privacidade e facetas |
| `HANDOFF.md` (regenerado) | Estado para a próxima sessão |

### 10.2 Alterar

| Arquivo | Alteração | Congelado? |
|:--|:--|:--|
| `tools/criar-escola.sh` | rodar o gerador no fim | **sim** |
| `tools/gerar-ciclo.sh` | rodar o gerador no fim; copiar o índice público para o pacote | **sim** |
| `tools/gerar-raiz.sh` | copiar o acervo para `raiz/indices/` | **sim** |
| `tools/hooks/pre-commit` | regenerar e acrescentar `indices/` (ou só `--check`) | **sim** |
| `.github/workflows/criar-escola.yml` | acrescentar `"indices"` e `"raiz/indices"` ao `git add` (hoje lista `professores/`, `escola/` e o wrangler) | não |
| `.github/workflows/gerar-ciclo.yml` | acrescentar `'indices'` e `'raiz/indices'` ao `git add` (hoje lista `$pasta` e `*.fipp`) | não |
| `.github/workflows/deploy-escolas.yml` | `paths` inclui `indices/**` | não |
| `.github/workflows/deploy-raiz.yml` | `paths` inclui `indices/**` | não |
| `.github/workflows/indices.yml` | novo: `--check` no push, regeneração no dispatch | não |
| `motor/servidor/programacao.js` (futuro) | servir `/indices/publico.json` e o índice vivo | não |
| `motor/servidor/bastidores.js` | `POST /api/bastidores/indice` | não |
| `motor/servidor/raiz.js` | servir a busca sobre `raiz/indices/acervo.json` | não |
| `motor/servidor/repo-escola.js` | `listarProfessores`/`listarEscolas` leem o acervo com fallback para a árvore | não |
| `escola/expurgar.js` / `motor/servidor/repo-escola.js` | marcar `expurgada` no índice derivado | não |
| `REGISTRO.md` | motivo declarado dos congelados + o marco | obrigatório |
| `CONGELAMENTO.md` | não muda: o congelamento continua o mesmo | — |

**Motivo declarado (congelados).** Acrescentar a geração do índice aos scripts de criação,
geração e à raiz, e ao hook local, **sem alterar** a fórmula de hash, a cobertura da âncora, os
validadores existentes, as regras ou as pétreas. O índice é derivado e fora da âncora. Cada
arquivo congelado tocado vai em **commit próprio**, com a entrada no `REGISTRO.md`.

---

## 11. Etapas

### Etapa 0 — Identidade — **CUMPRIDA (18/10/2026)**

- O item **2.8** fechou com três famílias e seis temas; as quatro famílias restantes foram
  abandonadas por decisão de produto, e o PDF fica declaradamente na paleta vigente.
- **Validação executada:** `node tools/check-identidade.js` → **19 verificações, todas `ok`**;
  `IMPLEMENTACAO-IDENTIDADE.md` sem nenhum `[ ]` aberto.
- **Estado (19/10/2026):** confirmada. A decisão da exportação (§6.5) é de localização e não
  reintroduz pendência aqui. Nada a fazer; a indexação começa na **Etapa 1**.

### Etapa 1 — Declarações

- Escrever `indices/esquema/campos.json`, `tipos.json` e `relacoes.json` a partir dos nomes de
  arquivo que **já existem** no repositório (não inventar tipos).
- **Validação:** um teste que percorre `professores/**` e classifica cada arquivo; o que não casar
  nenhum padrão aparece numa lista para decisão.
- **Paragem:** nenhum tipo «desconhecido» pode ficar sem decisão.

### Etapa 2 — Gerador e validador

- `tools/gerar-indices.js` e `tools/check-indices.js`, com as **13** verificações de §9.
- **Validação:** `node tools/gerar-indices.js && node tools/check-indices.js`; duas execuções
  seguidas idênticas; as 7 contraprovas reprovam.
- **Paragem:** se o resultado não for determinístico, corrigir antes de qualquer integração.

### Etapa 3 — Integração nos scripts

- `criar-escola.sh`, `gerar-ciclo.sh` e `gerar-raiz.sh` chamam o gerador no fim.
- **Validação:** criar uma escola de teste numa cópia do repositório e conferir que o índice da
  escola, o do ciclo e o acervo nascem juntos; gerar um ciclo e conferir a atualização.
- **Paragem:** se a criação de escola mudar de comportamento além do índice, separar.

### Etapa 4 — Serviço estático

- Cópias para `raiz/indices/` e `<pacote>/indices/publico.json`; ajuste dos `paths` dos deploys.
- **Validação:** `curl` na raiz (com e sem senha) e no domínio da escola; conferir `Content-Type`,
  `Cache-Control` e ausência de dados sensíveis no pacote.
- **Paragem:** se o pacote passar a expor caminho de acompanhamento, reverter a cópia.

### Etapa 5 — Workflow e hook

- `indices.yml` e o `pre-commit`.
- **Validação:** um commit com documento novo sem regenerar deve falhar (ou ser corrigido pelo
  hook, conforme a decisão); um commit só do índice não deve entrar em laço.
- **Paragem:** se o workflow criar commit em cascata, desligar o commit automático.

### Etapa 6 — Índice vivo, índice de lançamentos e primeiros consumidores

- `POST /api/bastidores/indice` e o consumo pela Produção.
- **Índice de lançamentos** (§4.9): `presenca`, `marcas`, `condicoes`, `ajustes`, `rubrica`, por
  ciclo e com recorte por aluna. É o que torna as perguntas AL/EN/OB baratas.
- **Identidade da aluna** (§4.10): `aluna:<slug>` gravado na primeira aparição, com alias.
- **Consumidor da raiz:** `listarProfessores`/`listarEscolas` passam a ler
  `raiz/indices/acervo.json` quando ele existir, com fallback para a árvore do GitHub. É o que
  prova que o índice substitui a varredura — e o que faz a lista de escolas deixar de depender de
  uma chamada à API por pedido.
- **Validação:** prova HTTP com KV em memória; nenhum dado sensível na resposta; `no-store`;
  `listarProfessores` devolve o mesmo resultado antes e depois, com **zero** leituras da árvore
  quando o índice existe; `nao_vi` e vazio contados separadamente.
- **Paragem:** se a rota fizer `kv.list` para responder a um **filtro**, corrigir. A única
  listagem admitida é a dos envelopes, uma vez por pedido, para montar o índice vivo.

### Etapa 7 — Índice publicado e ligação com a Tabela

- O ato de publicar passa a gravar `filtros` e o espelho `indices/publico/<slug>.json`.
- **Validação:** publicar, ler o espelho, conferir facetas e ausência de dados internos.
- **Paragem:** a Tabela de atividades só começa depois desta etapa.

### Etapa 8 — Fecho

- Regenerar `HANDOFF.md`, correr as provas, registrar no `REGISTRO.md`.
- **Entregável:** resumo com arquivos, estruturas, tempos medidos, testes e limitações.

---

## 12. Critérios de conclusão

1. Criar uma escola gera os índices de acervo, escola e ciclo **no mesmo commit**.
2. Gerar um ciclo, reancorar, escrever PO/plano e expurgar atualizam o índice.
3. `node tools/check-indices.js` passa; as 7 contraprovas reprovam.
4. Apagar `indices/` e regenerar produz o mesmo conteúdo.
5. O acervo **não** contém apelido, nome completo, senha, hash de senha, sal nem caminho de
   acompanhamento. O índice vivo contém `aluna:<slug>` e o apelido, porque é autenticado.
6. O acervo é servido pela raiz **atrás de senha**; o pacote público recebe só o índice publicado.
7. As consultas de filtro não chamam `kv.list` nem varrem o GitHub. (O índice vivo pode listar os
   envelopes uma vez, ao ser montado; o filtro em si não lista nada.)
8. A lista de escolas/professores da raiz lê o acervo e, quando ele existe, **não** lê a árvore do
   GitHub no caminho de leitura.
9. Um filtro novo entra por declaração + regeneração, sem alterar a interface.
10. O índice expõe `presenca`, `marcas`, `condicoes`, `ajustes` (presença/data) e `rubrica` por
    `aula` — o suficiente para as consultas CT/AL/EN/OB de
    [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) sem varrer o KV.
11. `nao_vi` e vazio são contados **separadamente** de `nao`; um teste falha se forem somados.
12. Nenhuma âncora `.fipp` muda por causa do índice.
13. Nenhuma regressão nas provas existentes (`check-identidade`, `provar-producao`,
    `provar-celular`, `check-pacote`).

---

## 13. Governança

- **Congelados:** `tools/criar-escola.sh`, `tools/gerar-ciclo.sh`, `tools/gerar-raiz.sh` e
  `tools/hooks/pre-commit` exigem motivo declarado, entrada no `REGISTRO.md` e commit próprio.
- **O que não muda:** fórmula de hash, cobertura da âncora, validadores existentes, regras,
  pétreas, estrutura de menu. O índice é um artefato novo e derivado.
- **Reancoragem:** nenhuma. O índice não entra na cobertura do `.fipp`, e os documentos que ele
  indexa não são alterados.
- **REGISTRO:** entrada com o marco, os arquivos tocados e o que ficou aberto.
- **HANDOFF:** regenerar no fecho.
- **Commits:** um por assunto — declarações, gerador, integração nos scripts, serviço estático,
  workflow/hook, índice vivo, índice publicado.

---

## 14. Riscos e mitigação

| Risco | Mitigação |
|:--|:--|
| O índice virar uma segunda fonte | Ele é reconstruível e `--check` compara byte a byte; nenhuma decisão é tomada só nele |
| Índice grande demais | Mestre sem listas de IDs e sem documentos; por escola com documentos; por ciclo como recorte |
| Exposição de dados de aluna | Verificação 7 e regra de não copiar o acervo para o pacote |
| Índice velho por edição manual | Hook regenera (ou CI falha); as rotas do Worker disparam o workflow |
| Índice dentro da âncora | Decisão D-I1: fora; a âncora continua a cobrir só as fontes |
| Duas fórmulas de hash | O índice lê o `.fipp`; nunca calcula |
| Laço de commits no CI | `GITHUB_TOKEN` não redispara; o workflow só commita no `dispatch` |
| Custo de regeneração | Varredura local pequena; alvo < 2 s; sem rede |
| Filtro novo exigir mudança em cada tela | Vocabulário declarado em `indices/esquema/`; a interface lê `filtros` |
| Escola expurgada desaparecer do índice | `expurgada: true` + elo; a lápide permanece |

---

## 15. Fora do escopo (v1)

- Substituir o `escola/<slug>/indice.json` existente (ele é lápide e inventário do expurgo).
- Implementar L1/L2/L4 por inteiro (dicionário dos 111 nós, identidade de todas as entidades,
  todas as relações).
- Busca textual (full-text), ranking ou embeddings.
- Índice de conteúdo de documentos.
- Motor de consultas determinísticas (L6).
- Alterar o KV, a âncora ou a fórmula de hash.
- Servir o acervo sem autenticação.
- Indexar `experimentos/`.

---

## 16. Perguntas que bloqueiam a implementação

1. **D-I1 — O índice fica fora da âncora?** (Recomendado: sim. Dentro, cada regeneração
   reancoraria o ciclo.)
2. **D-I2 — O mestre é público ou protegido?** (Recomendado: protegido pela raiz. Um mestre
   público exigiria um recorte sem nome de professor.)
3. **D-I3 — O hook regenera ou só verifica?** (Recomendado: regenerar e acrescentar `indices/`;
   a alternativa é `--check` e correção manual.)
4. **D-I4 — O índice de acervo por escola é servido no domínio da escola?** (Recomendado: não na
   v1; só a raiz. Se for, exige rota autenticada e o arquivo não pode estar sob o ASSETS.)
5. **D-I5 — O `escola/<slug>/indice.json` ganha um campo `indice_acervo` apontando para o
   derivado?** (Recomendado: não. O arquivo antigo é lápide; misturar os dois confunde o expurgo.)
6. **D-I6 — O índice por ciclo é copiado para o pacote?** (Recomendado: não na v1; só o índice
   publicado. Se for, é atrás de rota autenticada.)
7. **D-I7 — Quais filtros entram na v1 da busca da raiz?** (Recomendado: escola, professor, ciclo,
   tipo, ano. Os da Tabela ficam para a etapa dela.)
8. **D-I8 — O espelho `indices/publico/<slug>.json` é commitado no ato de publicar?**
   (Recomendado: sim, pelo mesmo caminho de `escrever-po.js`; se o commit falhar, o KV continua a
   servir e a falha é reportada.)
9. **D-I9 — O índice vivo entra no Git?** (Recomendado: **não**. Ele tem apelido e marca; é
   runtime, autenticado, `no-store`. A cópia versionada seria uma segunda superfície de exposição.)
10. **D-I10 — A aluna tem ID pseudônimo estável (`aluna:<slug>`) gravado na primeira aparição?**
    (Recomendado: sim. Sem ele, AL01–AL10 e PE01–PE05 não cruzam ciclos. É a lacuna L2.)
11. **D-I11 — O texto de `ajustes`/`surpresas` entra no índice?** (Recomendado: **não**; só
    `houve` e `data`. O texto é lido do original autenticado.)
12. **D-I12 — O índice de lançamentos é por ciclo ou por escola?** (Recomendado: por ciclo, com
    recorte opcional por aluna. Por escola, uma escola de 4 turmas × 3 ciclos chega a ~1,5 MB.)
13. **D-I13 — `nao_vi` e vazio são valores distintos?** (Recomendado: sim, sempre. Colapsá-los
    viola a regra da ausência e faz o instrumento parecer pior do que é.)

---

## Anexo A — Exemplo mínimo de acervo

```json
{
  "versao": 1,
  "gerado_em": "2026-10-18T22:00:00-03:00",
  "fonte": { "commit": "abc1234" },
  "escolas": [
    { "id": "escola:fita", "slug": "fita", "nome": "Fita", "habilitada": true, "expurgada": false,
      "professores": ["tiago-menegaz"], "ciclos": ["ciclo:tiago-menegaz/01/fita"],
      "contagens": { "ciclos": 1, "documentos": 3, "aulas": 5, "ancoras": 1 } }
  ],
  "professores": [
    { "id": "professor:tiago-menegaz", "slug": "tiago-menegaz", "nome": "Tiago Menegaz",
      "escolas": ["fita"], "ciclos": ["ciclo:tiago-menegaz/01/fita"] }
  ],
  "ciclos": [
    { "id": "ciclo:tiago-menegaz/01/fita", "professor": "tiago-menegaz", "numero": "01",
      "escola": "fita", "estado": "ativo", "aulas": 5, "documentos": 3,
      "ancora": { "id": "ciclo-01-fita", "hash": "ef5ee2…", "parent_hash": "", "ancorado_em": "2026-10-16" } }
  ],
  "filtros": {
    "escolas": [{ "valor": "fita", "rotulo": "Fita", "contagem": 1 }],
    "professores": [{ "valor": "tiago-menegaz", "rotulo": "Tiago Menegaz", "contagem": 1 }],
    "tipos": [{ "valor": "aula", "rotulo": "Aula", "contagem": 5 }]
  },
  "nao_indexado": [
    { "familia": "conteudo", "motivo": "metadados, não corpo" },
    { "familia": "alunas", "motivo": "dado sensível" },
    { "familia": "kv-runtime", "motivo": "índice vivo autenticado" }
  ]
}
```

## Anexo B — Onde este plano toca o planejamento L1/L2/L4

| Item do `PLANEJAMENTO-LASTRO.md` | O que este plano entrega | O que fica aberto |
|:--|:--|:--|
| **L1 — dicionário de campos** | `indices/esquema/campos.json` com os campos que o índice usa | Os 111 nós dos três formulários |
| **L2 — identidade estável** | IDs de escola, professor, ciclo, documento, aula, espaço e turma; **`aluna:<slug>` pseudônimo** (§4.10); evento quando o módulo existir | Identidade de professor como pessoa (hoje o slug é derivado/gravado); exame externo e motivo de saída **fora de escopo** (18/10/2026) |
| **L4 — mapa de relações e índice** | `relacoes.json`, acervo, escola, ciclo, vivo, **lançamentos** e publicado | Busca textual, exportação, índice sobre os 111 nós dos formulários |
| **L6 — consultas determinísticas** | O substrato (IDs + facetas + marcas por aula) | O catálogo de consultas e as recusas — definido em [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) |

## Anexo C — Relação com a Tabela de atividades

A Tabela **consome** este projeto e não o repete:

| Necessidade da Tabela | O que o índice entrega |
|:--|:--|
| IDs estáveis das atividades | `atividade:<origem>:<fonteId>:<data>:<inicio>` (§4.7) |
| Vocabulário de categorias, espaços e turmas | `indices/esquema/` + `filtros` do índice vivo |
| Filtros pré-determinados e rápidos | `filtros` com contagens e listas (§7) |
| Ligação com a proveniência | `ancora` copiada do `.fipp` (§8) |
| Página pública sem varredura | `indices/publico/<slug>.json` (espelho do retrato) |
| Isolamento entre escolas | Um arquivo por slug; o acervo não vai para o pacote público |

O que a Tabela acrescenta por conta própria: a composição das aulas a partir das turmas, o retrato
publicado, a página por dia, a impressão e o compartilhamento.

## Anexo D — Relação com o catálogo de perguntas

O [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) **consome** este
projeto e define o que ele tem de guardar:

| Necessidade do catálogo | O que o índice entrega |
|:--|:--|
| Aulas com data, hora, marco, estado e prazo | `ciclos[].aulas[]` (§4.3) — vindo do `ciclos.json` |
| Presença, marca, condição e rubrica por aula | Índice vivo de lançamentos (§4.9) |
| Identidade estável da aluna | `aluna:<slug>` (§4.10) |
| Série temporal por aluna | `marcas[]` com `aula` e `data` |
| Prova de cada resposta | `ancora` por ciclo e por aula (§8) |
| Ausência com nome | `nao_vi` ≠ vazio ≠ `nao` (§7.5) |
| Filtros do catálogo | `aluna`, `marco`, `marca`, `coluna`, `presenca` (§7.1) |

O que o catálogo acrescenta por conta própria: a **medida**, a **recusa** e a distribuição por
plano comercial. O índice não mede nem julga — entrega linhas e facetas.

**O que o catálogo descartou não pede nada daqui.** O catálogo tem **76 perguntas firmadas em 8
famílias** (9 no Núcleo Comum, 7 no Básico, 14 no Intermediário, 46 no Avançado): a família EX
(exame externo), a entidade `saida` e as três de PR foram retiradas ou recusadas em 18/10/2026, e com
elas as listas `resultados-externos[]` e `saidas[]` que este plano chegou a prever (§7.5). Uma chave
de índice que nenhuma consulta lê é dívida; o `check-indices` não a exige.

**E o que ainda pode crescer.** A grade de cobertura
([PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md) §4.9) **fechou em
19/10/2026**: 48 células ocupadas, 12 recusas e 3 em espera declarada (`espaço × distribuição`,
`espaço × mudança` e `escola × comparação`). Nenhuma das três pede faceta nova hoje: as duas de
`espaço` dependem da Tabela e `escola × comparação` depende de decisão comercial. As doze candidatas
firmadas não acrescentaram faceta — usam `vinculos[]`, `autoria[]`, `git log` e o índice de acervo.

**`professor` é faceta, vínculo e autoria — nunca eixo.** Decidido em 18/10/2026: o professor **não é
sujeito de medida** do catálogo (não existe família PR), mas **é** dado necessário como vínculo,
autoria e escopo. O §4.11 é a regra completa: `filtros.professor`, `vinculos[]` com vigência e
`autoria[]` por documento **existem**; `aulas_por_professor` e qualquer contagem que ordene pessoas
**não existem**, e a verificação 13 (§9.1) reprova quem as acrescentar. Se a operação precisar de
controle de atraso de lançamento, ele é relatório de gestão, autenticado, e nasce fora do índice e
fora do catálogo.
