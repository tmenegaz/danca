# Plano — Espaços, Eventos e Tabela de atividades pública

> **Status.** Plano de implementação. **Nada foi implementado.** Este documento existe para ser
> conferido e aprovado antes da primeira linha de código — a auditoria da arquitetura atual é a
> Etapa 1, e sem ela o módulo seria desenhado contra uma suposição.
>
> **Origem.** Pedido de 18/10/2026: separar o ambiente que **prepara** a programação (Bastidores /
> Produção) do ambiente que **apresenta** a programação pronta (Tabela de atividades), sem
> duplicar entidades e sem criar uma segunda infraestrutura de armazenamento.
>
> **Regra central.** **Planejar ≠ publicar ≠ consultar.** A tabela pública mostra uma
> **programação publicada** — um retrato coerente, congelado no ato de publicar —, e não o que
> está a ser editado na Produção naquele momento.
>
> **O que este documento não é.** Não é o FIPP, não é avaliação e não é um caderno pedagógico.
> É engenharia de produto sobre o protótipo que existe neste repositório.
>
> **Precedência (18/10/2026).** Resta **uma** frente a fechar antes desta. A outra corre em
> paralelo, porque não bloqueia nada aqui:
> 1. **Identidade visual — CONCLUÍDA em 18/10/2026.** `tools/check-identidade.js` passa nas 19
>    verificações e o item 2.8 fechou (três famílias, seis temas). Nada mais bloqueia.
> 2. **Índices do acervo** — [PLANO-INDICES.md](./PLANO-INDICES.md). A Tabela de atividades
>    **consome** os índices; não os constrói. Sem eles, cada filtro seria uma varredura.
> 3. **O catálogo de perguntas** — [PLANO-PERGUNTAS-DA-PROVENIENCIA.md](./PLANO-PERGUNTAS-DA-PROVENIENCIA.md)
>    — consome os **mesmos** índices, com outro recorte (o percurso pedagógico, não a programação).
>    Corre **em paralelo** a este plano; não bloqueia nenhuma etapa dele, e nenhum dos dois altera
>    o índice do outro.
>
> A §1.8 diz exatamente o que este plano recebe da frente de índices. Se a frente não estiver
> concluída, a Etapa 0 não fecha e nenhuma etapa seguinte abre.

---

## 0. A decisão em uma frase

Acrescentar à Produção o cadastro de **espaços** e **eventos**, uma relação explícita entre
**turma e espaço**, e um ato de **publicação** que grava um retrato da programação no KV. A
**Tabela de atividades** é uma página nova do Worker de cada escola, sem credencial, que lê
**apenas** esse retrato.

As aulas já cadastradas nas **turmas** (dias, hora de início, duração e período do termo) entram
na programação **sem serem recadastradas**. Os eventos entram como registros próprios. Nenhuma
nova base de professores, turmas ou alunas é criada.

---

## 1. Auditoria — o que existe, com evidência

Esta seção é o diagnóstico exigido pelo pedido. Foi lida do código, não presumida.

### 1.1 Superfícies e rotas

| Superfície | Onde é tratada | Evidência |
|:--|:--|:--|
| Worker da escola (porta de entrada) | `motor/servidor/producao.js` | `producao.js` — identidade, freio da escola, Bastidores, pacote |
| Bastidores (Estúdio + Produção) | `motor/servidor/bastidores.js` | `fetch()` a partir de `/bastidores` e `/api/bastidores/*` |
| Porta de elicitação | `motor/servidor/rotas.js` | `/anamnese/`, `/plano-ensino/`, `/plano-observacao/` |
| Pacote estático do ciclo | `env.ASSETS` | `producao.js` — o `ASSETS` é o último recurso |
| Worker raiz | `motor/servidor/raiz.js` | apresentação + criação de escola; **não** é uma escola |

Rotas que já existem no Worker da escola, em resumo:

- `GET /bastidores/producao` — a página da Produção (HTML servido **sem** autenticação; o
  portão é cliente + rotas de escrita).
- `GET /api/bastidores/...` — leituras usadas pelos formulários (turmas, alunas, professores,
  curadorias, termos, rubricas).
- `POST`/`DELETE /api/bastidores/...` — escrita, sempre com `autorizacaoDirecaoOk`.
- `POST /api/bastidores/validar-producao` — login/token.
- `POST /api/receber`, `GET/POST /api/dados` — lançamento e leitura cifrada.
- `GET /...` do pacote — servido pelo `ASSETS`.

O Worker é `run_worker_first: true` em `wrangler.<escola>.jsonc` (ver `wrangler.fita.jsonc`). Ou
seja: **toda** requisição passa pelo script antes do asset; o que não casa com uma rota cai no
`ASSETS`. É por isso que uma rota pública nova não colide com o pacote.

### 1.2 Onde o dado vive

Cada Worker liga um `PADD_KV`. O caminho normal é o **namespace partilhado** (id
`2ee331c7a5bc446ca86c8f2cb039ec16` no `wrangler.fita.jsonc`); há escolas com namespace próprio
(a Maria, segundo o `PLANEJAMENTO-LASTRO.md` §2.3). Em qualquer dos casos, o isolamento é feito
por **prefixo de chave** com o slug da escola. As famílias relevantes:

| Chave | Conteúdo | Quem escreve | Quem lê |
|:--|:--|:--|:--|
| `bastidores/<escola>/professores` | lista `{nome, slug, sal, hash}` | `bastidores.js` | Produção, porta |
| `bastidores/<escola>/alunas` | lista de apelidos | `bastidores.js` | Produção, anamnese |
| `bastidores/<escola>/turmas` | lista de turmas (com histórico de derivações) | `bastidores.js` | Produção, plano, curadoria |
| `bastidores/<escola>/turma-conteudos` | relação turma ↔ termos | `bastidores.js` | Produção, plano |
| `bastidores/<escola>/curadorias` | professor × modalidade × turma | `bastidores.js` | Produção, plano |
| `bastidores/<escola>/vocabulario`, `rubricas` | catálogos | `bastidores.js` | Produção, plano |
| `bastidores/<escola>/aparencia` | `{modo, paleta}` | `bastidores.js` | todas as páginas |
| `bastidores/<escola>/dono` | nome exibido do dono | `bastidores.js` | Produção |
| `<escola>/...` | envelopes, anamnese cifrada | `motor/nucleo/porta.js` | porta |
| `ia-registro/<AAAA-MM>.jsonl` | custo da IA (um ficheiro por mês) | `nucleo/registro-de-custo.js` · `rotas.js` | — |

Duas consequências para este módulo:

1. **Não há tabela relacional.** O padrão é uma lista JSON por chave, lida inteira e regravada
   inteira (`lerLista` + `kv.put`). O módulo novo segue esse padrão.
2. **O expurgo já cobre o módulo novo.** `prefixosDaEscola()` devolve
   `[slug + '/', 'bastidores/' + slug + '/']` (`motor/servidor/expurgar-escola.js`). Qualquer
   chave nova sob `bastidores/<escola>/` é apagada com a escola, sem alterar o expurgo.

### 1.3 Identificadores e entidades reutilizáveis

| Entidade | Identificador | Estável? | Reutilização neste módulo |
|:--|:--|:--|:--|
| Escola | `ESCOLA_SLUG` / subdomínio | sim | prefixo de todas as chaves |
| Turma | `id` (slug do nome; a derivação ganha a data) + `nome` | o **nome** é estável entre derivações; o `id` muda na derivação | **fonte das aulas**; a relação turma ↔ espaço usa o **nome** (§3.3) |
| Professor | `slug` gravado (ou derivado do nome) | sim | responsável dos eventos e das aulas (via curadoria) |
| Curadoria | `professor + modalidade + turma` | sim | deriva o professor da turma sem novo cadastro |
| Aluna | apelido | não (dado sensível) | **não entra** na tabela pública |
| Termo | `id` slug | sim | não entra |
| Aula do ciclo | `n` (`"01"`) no pacote | sim | **não** é fonte da tabela: o pacote é estático e o Worker não lê `.conf` |

Campos da turma que já servem à programação (`normalizarTurma`, `bastidores.js`):

```
dias: ["qua", "sex"]                 // normalizados (seg, ter, qua, qui, sex, sáb, dom)
horarios: { qua: "19:00", sex: "19:00" }
duracaoMin: 60
periodoInicio: "2026-10-06"
periodoFim: "2026-12-15"
ativo: true
```

O ritmo é **obrigatório** para cadastrar a turma (`faltaNoRitmoDaTurma`): sem dias, duração e
período, a turma não nasce. Isso é o que torna a composição da programação bem definida — não há
turma sem janela temporal.

**O que a turma não tem:** sala, professor e descrição pública. O professor é derivável da
curadoria; sala e descrição pública exigem uma relação nova (ver §3.3).

### 1.4 Autenticação e isolamento

| Mecanismo | Como funciona | Evidência |
|:--|:--|:--|
| Senha da direção | `SENHA_ADMIN` **ou** `SENHA_PROFESSOR` (secrets do Worker) | `senhaDaDirecaoOk` |
| Token | HMAC-SHA256 sem estado, validade de 12 h; o navegador guarda o token, nunca a senha | `tokenDaDirecao`, `tokenDaDirecaoValido` |
| Porta das rotas de escrita | `autorizacaoDirecaoOk(env, corpo)` — aceita `token` ou a senha antiga | `bastidores.js` |
| Senha da escola (para abrir dados cifrados) | direção **ou** qualquer professor cadastrado | `senhaDaEscolaOk` |
| Identidade do Worker | `subdominio === env.ESCOLA_SLUG`, senão página de erro | `producao.js` |
| Escola desligada | `ESCOLA_HABILITADA === 'nao'` corta tudo, inclusive o pacote | `producao.js` |

**Não há contas novas a criar.** O módulo novo usa exatamente o mesmo token e as mesmas rotas
de escrita. A página pública **não** usa nenhum deles.

### 1.5 Navegação — três escritores, uma forma

A forma da barra (marca, hamburger, `.nav-links`) mora em `tools/templates/nav-html.js`, mas a
**lista de destinos** é escrita em três lugares:

| Escritor | Onde | Hoje |
|:--|:--|:--|
| `navSistema()` | `tools/templates/nav-html.js` | Sistema Lastro · Área do Professor · **Bastidores** (Estúdio, Produção) |
| `gerar_nav_zero()` | `tools/criar-escola.sh` | a mesma lista, para a escola recém-criada |
| `gerar_nav()` | `tools/gerar-ciclo.sh` | menu do ciclo (Sistema Lastro, grupos de documentos, Área do Professor) |

É uma duplicação conhecida. Para o destino ser alcançável de qualquer superfície, o item novo
tem de entrar nos três; a forma de o fazer sem criar uma quarta cópia é D8.

### 1.6 Renderização e identidade

- As páginas dos Bastidores são **HTML montado por concatenação** em `bastidores.js`, com um
  `<style>` próprio depois de `/assets/style.css`. Não há framework, bundler ou dependência de
  runtime.
- O CSS de identidade é `tools/templates/ciclo.css`, copiado para `assets/style.css` de cada
  pacote. `tools/check-identidade.js` mede contraste, cópia única de hex e peças declaradas.
- O JavaScript da Produção é uma **string concatenada**. Um comentário `//` numa linha só
  comenta todo o resto do script — foi um defeito real, provado por
  `experimentos/provar-producao.js`. O código novo usa `/* */` ou não comenta.
- As listas usam `data-paginar`, `data-por-pagina="7"`, `rodapePaginacao()` e `.lista`.
- Os formulários usam `postar()` + `location.reload()`; os selects usam `opcoesDe...`; as
  escolhas curtas usam `pilula()` e `escolhedor()`.

### 1.7 Lacunas medidas

1. **A turma não tem sala.** Sem uma relação nova, nenhuma aula apareceria com «Sala».
2. **A turma não tem professor.** A curadoria é a única ligação; pode estar ausente ou ambígua.
3. **A turma não tem descrição pública.** O campo `descricao` é «Notas sobre esta turma», de uso
   interno — publicá-lo exporia anotação administrativa.
4. **Não existe ato de publicação.** O KV guarda o estado corrente; não há retrato publicado.
5. **A página da Produção é servida sem autenticação** (o portão é cliente). Os dados das
   seções antigas já viajam no HTML. Para o módulo novo, isso é evitável (ver D10).
6. **O nome exibido da escola não está no KV.** Só existe o slug no Worker; o nome está no
   `.conf` do ciclo, que o Worker não lê. É preciso um campo novo (D12).
7. **A tabela pública não tem fonte de aulas em runtime.** O `calendario.py` roda na geração; o
   Worker não tem `.conf` nem pandoc. A fonte viva são as turmas no KV.
8. **Não há índice de acervo.** O que existe é inventário de arquivos por escola e `ciclos.json`
   por ciclo; não há vocabulário de filtros nem índice transversal. É a lacuna que a frente de
   índices fecha antes deste plano.

### 1.8 Dependência: o que este plano recebe da frente de índices

O [PLANO-INDICES.md](./PLANO-INDICES.md) entrega, e este plano **não repete**:

| O que a Tabela precisa | O que o índice entrega | Onde no plano de índices |
|:--|:--|:--|
| IDs estáveis de atividade | `atividade:<origem>:<fonteId>:<data>:<inicio>` | §4.7 |
| Vocabulário de categorias, espaços, professores e turmas | `indices/esquema/tipos.json` + `filtros` do índice vivo | §4.1, §4.5 |
| Filtros rápidos e pré-calculados | `filtros` com contagem e listas de IDs | §7 |
| Ligação com a proveniência | `ancora` copiada do `.fipp` | §8 |
| Espelho estático da programação | `indices/publico/<slug>.json` | §4.6, §6 |
| Isolamento entre escolas | um arquivo por slug; o acervo não vai para o pacote público | §6.3 |

O que este plano acrescenta por conta própria: a composição das aulas a partir das turmas, o
retrato publicado, a página por dia, a impressão e o compartilhamento.

---

## 2. Arquitetura proposta

### 2.1 As três responsabilidades

```
┌──────────────────────────────┐     ┌──────────────────────┐     ┌──────────────────────────┐
│ PRODUÇÃO (restrito)          │     │ PUBLICAÇÃO           │     │ TABELA (sem credencial) │
│                              │     │                      │     │                          │
│ Espaços                      │     │ revisa a composição  │     │ lê só o retrato          │
│ Eventos                      │ ──► │ confirma avisos      │ ──► │ por dia, com anterior/   │
│ Turma ↔ espaço               │     │ grava o RETRATO      │     │ próximo, imprimir e      │
│ Turmas (já existentes)       │     │ (uma chave de KV)    │     │ compartilhar             │
└──────────────────────────────┘     └──────────────────────┘     └──────────────────────────┘
```

### 2.2 Fluxo de dados

```
turmas (KV, já existe) ──┐
curadorias (KV) ─────────┼──► compor() ──► prévia + avisos ──► [Publicar] ──► programacao-publicada
turma-programacao (KV) ──┤       ▲                                              │
espacos (KV) ────────────┤       │                                              ▼
eventos (KV) ────────────┘       │                                   GET /tabela-de-atividades
                                 └── módulo puro (sem IO)            (lê só a chave do retrato)

indices/esquema (Git) ──► tipos, categorias e IDs estáveis ──┐
índice vivo (Produção) ──► turmas, espaços e professores ───┴──► filtros do retrato
indices/publico/<slug>.json (Git) ──► espelho estático do mesmo retrato
```

O `compor()` é **puro**: recebe listas, devolve a lista ordenada de atividades e os avisos. Não
lê KV, não escreve, não conhece HTTP. É testável sem Worker. Os **filtros** vêm das facetas
pré-calculadas (`PLANO-INDICES.md` §7), não de uma varredura na leitura.

### 2.3 Decisões propostas

| # | Decisão | Recomendação | Por quê |
|:--|:--|:--|:--|
| D1 | Como separar rascunho de publicado | **Retrato único por publicação** em `bastidores/<escola>/programacao-publicada` | O KV é eventualmente consistente por chave; um único `put` publica uma versão coerente. Não há joins nem leitura de várias chaves na página pública. |
| D2 | Histórico de publicações | Lista **resumida** em `bastidores/<escola>/publicacoes` (data, responsável, janela, contagem, avisos) | Alinha com P-03 («acrescenta, não edita») sem guardar N cópias completas. Se não for aceito, a chave pode ficar só com a última publicação. |
| D3 | Sala das aulas | **Relação nova** `bastidores/<escola>/turma-programacao`, chaveada pelo **nome** da turma | O nome é estável entre derivações. Não mexe na regra de derivação da turma nem no plano. O retrato preserva o histórico da sala usada em cada publicação. |
| D4 | Professor das aulas | Derivado da **curadoria** vigente da turma; se ausente ou ambígua, fica vazio e gera aviso | Não se cria uma segunda base de professores nem se duplica o vínculo. |
| D5 | Descrição pública das aulas | Campo próprio na relação `turma-programacao`, nunca o `descricao` interno da turma | Evita publicar «Notas sobre esta turma». |
| D6 | Janela da programação | A escola declara `janelaDias` (padrão **30**) na Publicação; o retrato cobre `[hoje, hoje + janelaDias - 1]` | A tabela é diária; uma janela explícita evita programação infinita e mantém o retrato pequeno. |
| D7 | Item de menu | `Sistema Lastro · Área do Professor · **Tabela de atividades** · Bastidores` | Mantém Bastidores como último grupo (convenção do `IDEIA-PAINEL-ESCOLA.md` §2). |
| D8 | Onde o item é escrito | **Uma** função em `tools/templates/nav-html.js`, usada por `navSistema`, `gerar_nav_zero` e `gerar_nav` | Elimina a terceira cópia da lista. `tools/` é congelado: exige motivo declarado + REGISTRO + commit próprio. |
| D9 | Rota pública | `GET /tabela-de-atividades` no Worker da escola | Isolamento por Worker/subdomínio; sem credencial; sem API pública nova. |
| D10 | Dados de rascunho no HTML | As seções novas carregam os dados **depois do login**, por rota autenticada; a página nasce sem eles | Não repete a fragilidade das seções antigas (HTML sem autenticação). Ver §8.2. |
| D11 | Renderização | HTML no servidor, uma rota, sem framework nem dependência nova | É o padrão do sistema. |
| D12 | Nome da escola | `programacao.nomeExibicao`, editável na Publicação; padrão = slug | O Worker não tem o nome do `.conf`. |
| D13 | Cabeçalho da página pública | Cabeçalho enxuto (marca, nome da escola, dia, imprimir/compartilhar), **sem** links para Bastidores/Produção | A página é para quem consulta; não é uma porta de entrada administrativa. |
| D14 | Apagar espaço | **Nunca** apagar: só `ativo: false` | Preserva referências históricas e o retrato publicado. |
| D15 | Apagar evento | Só `situacao: "rascunho"`. Depois de publicado, **cancelar** | Preserva a programação que o público já viu. |
| D16 | Evento sem sala | Publicável como «Local a definir», com aviso | A falta de sala não impede a atividade de existir. |
| D17 | Cancelamento | Evento cancelado **aparece riscado com «Cancelada»** (sem descrição), se já estava no retrato anterior; se nunca foi publicado, não aparece | O público precisa de saber que a atividade não acontece — quem já contava com ela não deve aparecer à porta. O motivo interno fica fora. |
| D18 | Recorrência | **Não** na v1: eventos são ocorrências únicas; a recorrência das aulas vem da turma | É a complexidade necessária. Exceções e repetições ficam para depois. |
| D19 | Fuso | Usar `env.FUSO` (padrão `America/Sao_Paulo`); datas ISO `AAAA-MM-DD`, horas `HH:MM` | O Worker roda em UTC; a data da tabela é a data local da escola. |
| D20 | Validação | Só bloqueia o que impede publicar: título, data, início e fim válidos (`fim > início`). Conflitos e faltas são **avisos** | Não se bloqueiam exceções legítimas sem regra confirmada. |
| D21 | Fonte dos filtros | A página pública usa `filtros` **pré-calculados no ato de publicar**; não recalcula nem varre o KV na leitura | É o que torna o filtro O(1) e o que a frente de índices entrega (§1.8). |
| D22 | IDs das atividades | O ID é `atividade:<origem>:<fonteId>:<data>:<inicio>`, o mesmo do índice | Um só identificador entre Produção, índice, retrato e página; sem tradução. |
| D23 | Espelho estático | Publicar grava o retrato no KV **e** o espelho `indices/publico/<slug>.json` no Git | A página serve pelo KV; o espelho é a cópia versionada e deployável. Se o commit falhar, a publicação não falha. |

---

## 3. Modelo de dados

Todas as chaves novas vivem sob `bastidores/<escola>/`, logo entram no expurgo existente. Nenhuma
chave existente muda de forma.

### 3.1 Espaço físico — `bastidores/<escola>/espacos`

Lista JSON (mesmo padrão de `turmas`):

```json
[
  {
    "id": "sala-1",
    "nome": "Sala 1",
    "descricao": "Sala de balé com barra dupla",
    "localizacao": "2º andar",
    "capacidade": 25,
    "areaM2": 80,
    "dimensoes": "10 x 8 m",
    "equipamentos": ["barra", "espelho", "linoleo"],
    "modalidades": ["bale-classico"],
    "observacoes": "",
    "ativo": true,
    "criadoEm": "2026-10-18T14:00:00.000Z",
    "atualizadoEm": "2026-10-18T14:00:00.000Z"
  }
]
```

Regras:

- `id` = `idDe(nome)` (slug); colisão ganha sufixo `-2`, `-3`. O `id` é gravado e **não muda** se
  o nome for editado (é a referência estável).
- Só `nome` é obrigatório. Capacidade, área, dimensões, equipamentos e modalidades são opcionais.
- `equipamentos` são ids de um catálogo curto (ver §3.6). O que não estiver no catálogo vai em
  `observacoes`; o catálogo cresce por uma linha, sem migração.
- `modalidades` reutiliza `biblioteca/modalidades/modalidades.json` (não se cria outra lista).
- Não há `DELETE`. Desativar (`ativo: false`) mantém a sala nas publicações antigas e nas
  escolhas históricas. A lista da Produção mostra ativas e inativas, com selo.

### 3.2 Evento — `bastidores/<escola>/eventos`

```json
[
  {
    "id": "ensaio-do-espetaculo-2026-10-21-1000",
    "titulo": "Ensaio do espetáculo",
    "categoria": "ensaio",
    "data": "2026-10-21",
    "inicio": "10:00",
    "fim": "12:00",
    "espacoId": "sala-2",
    "professor": "tiago-menegaz",
    "turma": "",
    "descricao": "Ato II",
    "situacao": "rascunho",
    "publico": true,
    "observacoes": "",
    "criadoEm": "2026-10-18T14:00:00.000Z",
    "atualizadoEm": "2026-10-18T14:00:00.000Z"
  }
]
```

Regras:

- `id` é gerado na criação (`slugificar(titulo) + '-' + data + '-' + inicio`, com sufixo em caso
  de colisão) e **não muda** quando o título é editado.
- `categoria` ∈ `aula`, `ensaio`, `apresentacao`, `festival`, `familia`, `reuniao`,
  `manutencao`, `outro`.
- `situacao` ∈ `rascunho`, `pronto`, `cancelado`. Só `pronto` entra na composição normal;
  `cancelado` só entra no caso D17 (mostrar o cancelamento).
- `publico: false` mantém o evento fora da tabela mesmo com `situacao: "pronto"` (reuniões
  internas, manutenção).
- `professor` guarda o **slug** (ou vazio). `turma` guarda o **nome** (ou vazio), como a
  curadoria e o plano já fazem.
- `observacoes` é **interno** e nunca é renderizado na página pública.
- `descricao` é a única descrição pública do evento. Deve ser curta.
- Não há `DELETE` depois de publicado: `situacao = "cancelado"` (ver D15/D17).

### 3.3 Relação turma ↔ espaço — `bastidores/<escola>/turma-programacao`

Objecto chaveado pelo **nome** da turma (estável entre derivações):

```json
{
  "Balé Nível 1": {
    "espacoId": "sala-1",
    "descricaoPublica": "Turma intermediária",
    "atualizadoEm": "2026-10-18T14:00:00.000Z"
  }
}
```

- Ausência de entrada = aula sem sala e sem descrição pública; a composição gera aviso.
- `espacoId` pode apontar para uma sala inativa; a composição inclui o nome e avisa.
- O retrato guarda o nome da sala no momento da publicação; mudar a relação depois não reescreve
  o que já foi publicado.

### 3.4 Configuração da programação — `bastidores/<escola>/programacao`

```json
{
  "nomeExibicao": "Escola Fita",
  "janelaDias": 30,
  "atualizadoEm": "2026-10-18T14:00:00.000Z"
}
```

- `nomeExibicao` é o título público; padrão = `ESCOLA_SLUG` em forma legível.
- `janelaDias` é um inteiro entre 1 e 180; padrão 30.
- É lido pela Produção (para a prévia) e no ato de publicar. A página pública lê o nome já
  congelado no retrato, não esta chave.

### 3.5 Retrato publicado — `bastidores/<escola>/programacao-publicada`

```json
{
  "escola": "fita",
  "escolaNome": "Escola Fita",
  "publicadaEm": "2026-10-18T17:30:00.000Z",
  "por": "direcao",
  "janela": { "de": "2026-10-18", "ate": "2026-11-16" },
  "atividades": [
    {
      "id": "atividade:turma:bale-nivel-1:2026-10-21:19:00",
      "origem": "turma",
      "fonteId": "bale-nivel-1",
      "data": "2026-10-21",
      "inicio": "19:00",
      "fim": "20:00",
      "titulo": "Balé Nível 1",
      "descricao": "Turma intermediária",
      "espaco": { "id": "sala-1", "nome": "Sala 1" },
      "turma": "Balé Nível 1",
      "professor": "Tiago",
      "categoria": "aula",
      "estado": "confirmada"
    }
  ],
  "filtros": {
    "dias": [
      { "valor": "2026-10-21", "rotulo": "Quarta-feira · 21 de outubro", "contagem": 1,
        "ids": ["atividade:turma:bale-nivel-1:2026-10-21:19:00"] }
    ],
    "categorias": [{ "valor": "aula", "rotulo": "Aula", "contagem": 1,
      "ids": ["atividade:turma:bale-nivel-1:2026-10-21:19:00"] }],
    "espacos": [{ "valor": "sala-1", "rotulo": "Sala 1", "contagem": 1,
      "ids": ["atividade:turma:bale-nivel-1:2026-10-21:19:00"] }],
    "professores": [{ "valor": "tiago-menegaz", "rotulo": "Tiago", "contagem": 1,
      "ids": ["atividade:turma:bale-nivel-1:2026-10-21:19:00"] }],
    "turmas": [{ "valor": "bale-nivel-1", "rotulo": "Balé Nível 1", "contagem": 1,
      "ids": ["atividade:turma:bale-nivel-1:2026-10-21:19:00"] }]
  },
  "avisos": [
    { "tipo": "sala-inativa", "atividade": "atividade:turma:bale-nivel-1:2026-10-21:19:00", "texto": "Sala 1 está inativa" }
  ]
}
```

- `atividades` já vem **ordenada** e sem dados internos. É o único payload que a página pública
  conhece. `estado` ∈ `confirmada` | `cancelada` (este último só se D17 for «mostrar o
  cancelamento»).
- `fonteId` de uma aula é o **slug do nome da turma** (`slugificar(nome)`), não o `id` do registro:
  o `id` muda na derivação, o nome não. O campo `turma` guarda o nome de exibição.
- `filtros` vem **pré-calculado** (D21). A página não filtra no servidor: intersecciona as listas
  de IDs de `filtros`. É o contrato que a frente de índices fixa (`PLANO-INDICES.md` §7).
- `avisos` é o registro dos avisos aceitos no ato de publicar. Não é renderizado como lista
  pública; serve à auditoria e à próxima sessão.
- `por` é `direcao` (o sistema não individualiza o autor para além do token).
- Não há `dias` pré-calculado fora de `filtros`: os dias únicos derivam-se de `atividades` na
  leitura, e a lista ordenada de dias vem de `filtros.dias`.
- O **mesmo documento** é gravado em `indices/publico/<slug>.json` no ato de publicar (D23), como
  espelho versionado e deployável. Se o commit do espelho falhar, o KV continua a servir a página
  e a resposta reporta a falha.

### 3.6 Catálogo de equipamentos

Proposta: `biblioteca/espacos/equipamentos.json`, no padrão de
`biblioteca/modalidades/modalidades.json`:

```json
{
  "nota": "Equipamentos e características que uma sala pode declarar.",
  "equipamentos": [
    { "id": "barra", "nome": "Barra" },
    { "id": "espelho", "nome": "Espelho" },
    { "id": "ar-condicionado", "nome": "Ar-condicionado" },
    { "id": "linoleo", "nome": "Linóleo" },
    { "id": "pilar", "nome": "Pilar" },
    { "id": "tablado", "nome": "Tablado" }
  ]
}
```

O catálogo é **compartilhado** (não por escola), como `modalidades.json`. Se a escola precisar de
um item que não está na lista, usa `observacoes` na v1; acrescentar ao catálogo é uma alteração de
uma linha, sem migração de dados.

---

## 4. Composição da programação

### 4.1 Entrada

- `turmas` (vigentes e ativas)
- `curadorias` (vigentes)
- `espacos`
- `turma-programacao`
- `eventos`
- `janela: { de, ate }`
- `publicadoAnterior` (opcional; só para o caso D17 = «mostrar o cancelamento»)

### 4.2 Algoritmo (módulo puro)

```
compor(entrada) -> { atividades, avisos }

1. Para cada turma vigente e ativa:
   a. se falta dias, duração ou período -> aviso "turma-incompleta" e salta.
   b. datas = todos os dias D entre max(janela.de, periodoInicio) e min(janela.ate, periodoFim)
      cujo dia-da-semana ∈ turma.dias.
   c. para cada D:
      - inicio = turma.horarios[dia]; sem hora -> aviso e salta.
      - fim = inicio + duracaoMin.
      - espaco = turma-programacao[turma.nome].espacoId -> espacos.
      - professor = única curadoria vigente cuja turma = turma.nome; se 0 ou >1 -> vazio + aviso.
      - descricao = turma-programacao[turma.nome].descricaoPublica || "".
      - chave = slugificar(turma.nome)   /* estável entre derivações e seguro em URL */
      - id = "atividade:turma:" + chave + ":" + D + ":" + inicio.
      - atividade = { id, origem:"turma", fonteId:chave, ... }.

2. Para cada evento com situacao="pronto", publico=true e data dentro da janela:
   - valida título, data, inicio, fim (fim > inicio); se inválido -> bloqueio, não entra.
   - resolve espacoId -> espaco; resolve turma e professor (slug -> nome quando possível).
   - id = "atividade:evento:" + evento.id + ":" + evento.data + ":" + evento.inicio.
   - atividade = { id, origem:"evento", fonteId:evento.id, estado:"confirmada", ... }.

2.1 Se D17 = «mostrar o cancelamento»: para cada evento com situacao="cancelado" que exista em
    `publicadoAnterior` e cuja data esteja na janela, acrescenta a mesma atividade com
    `estado:"cancelada"` e sem descrição.

3. Ordena por data, inicio, fim, título (estável).
4. Calcula avisos de sobreposição (sala, professor, turma) sobre a lista ordenada.
```

### 4.3 Regras de composição

| Situação | Resultado |
|:--|:--|
| Turma sem sala | Atividade entra com `espaco: null`; aviso. |
| Turma com sala inativa | Entra com o nome da sala; aviso. |
| Turma sem professor (curadoria ausente) | Entra com `professor: ""`; aviso. |
| Turma com mais de uma curadoria vigente | Entra com `professor: ""`; aviso de ambiguidade. |
| Evento sem sala | Entra com `espaco: null`, «Local a definir» na página; aviso. |
| Evento cancelado | Se D17 = «sumir», não entra. Se D17 = «mostrar», entra com `estado: "cancelada"` quando já estava no retrato anterior; sem descrição. |
| Evento `publico: false` | Não entra. |
| Evento fora da janela | Não entra. |
| Turma cujo período não intersecta a janela | Não gera ocorrências. |
| Duas atividades no mesmo horário e sala | Ambas entram; aviso de sobreposição. Publicar continua possível. |

**Nada disto bloqueia a publicação** — exceto um evento sem título/data/início/fim, que nem
chega a ser gravado (validação da rota de escrita).

### 4.4 Por que não usar o `calendario.py` nem o `ciclos.json`

- `tools/calendario.py` roda **na geração** do pacote e lê o `.conf` da variante. O Worker não
  tem `.conf`, não tem Python e não tem o calendário em KV.
- `ciclos.json` é um artefato estático do pacote; não é atualizado pela Produção.
- A fonte viva da escola é a turma no KV. Usá-la evita duas verdades para a mesma aula.

O `calendario.py` continua a ser a fonte do **plano do ciclo**; não é substituído nem alterado.

---

## 5. Publicação

### 5.1 Ato

1. A direção abre **Produção → Publicação**.
2. O servidor compõe a prévia para a janela escolhida e devolve-a com os avisos.
3. A pessoa confere a lista, o intervalo e os avisos.
4. `POST /api/bastidores/programar-publicar` com `{ token, janelaDias }`:
   - recompõe no servidor (não confia na prévia do cliente);
   - grava o retrato completo numa única chave;
   - acrescenta um resumo à lista `publicacoes`;
   - devolve `{ ok, publicadaEm, total, avisos }`.

   O nome exibido e a janela podem ser gravados antes em `/api/bastidores/programacao`; o ato de
   publicar usa o que estiver gravado, e `janelaDias` no corpo é uma sobreposição explícita
   (também fica gravada para a próxima vez).

### 5.2 Garantias

- **Coerência:** um único `put` publica o retrato inteiro. A página pública nunca lê metade de uma
  versão.
- **Rascunho não vaza:** eventos `rascunho`, `publico: false` e `observacoes` não entram no
  retrato. Alterações na Produção não aparecem até nova publicação.
- **Histórico:** o retrato anterior é substituído, mas o resumo fica em `publicacoes` (D2). O
  retrato publicado é operacional, não é a cadeia pedagógica; a cadeia de custódia continua a
  ser o `.fipp` das fontes do ciclo.
- **Cancelamento:** se D17 for «mostrar o cancelamento», o retrato inclui a atividade com
  `estado: "cancelada"` (sem descrição interna); se for «sumir», o evento sai da lista. Em ambos
  os casos, publicar de novo é o ato que atualiza a tabela. `avisos` é interno e **não** é
  renderizado.
- **Escola desligada:** o freio `ESCOLA_HABILITADA` já corta a página pública, porque ela é
  servida pelo mesmo Worker.
- **Consistência do KV:** a leitura do retrato pode ter a janela de cache do KV (até 60 s). É
  aceitável para uma programação. A resposta leva `Cache-Control: no-store` (sem cache de
  navegador/CDN); os 60 s do KV são a única espera residual e não se contornam sem outro
  armazenamento.

### 5.3 Sem publicação ainda

A página pública responde **200** com o estado vazio:

> «A programação desta escola ainda não foi publicada.»

Não é 404: o destino existe, o conteúdo é que ainda não foi publicado. O menu não deve levar a
uma página de erro. Sem retrato, o título usa o slug da escola como nome — não há nome publicado
para mostrar.

---

## 6. Tabela de atividades pública

### 6.1 Rota e acesso

- `GET /tabela-de-atividades` e `GET /tabela-de-atividades?dia=AAAA-MM-DD`.
- Servida pelo Worker da escola, **sem** token, **sem** senha, **sem** cookie.
- Lê o retrato — uma chave, `bastidores/<escola>/programacao-publicada` — e a aparência da escola
  (`aparenciaDaEscola`, a mesma de todas as páginas). Não lê cadastros.
- Se o parâmetro `?filtro=` vier na URL, a página usa `filtros` do retrato; não há filtro novo no
  servidor.
- `GET /indices/publico.json` (asset do pacote) serve o **mesmo** retrato como espelho estático e
  auditável (`PLANO-INDICES.md` §4.6). É o mesmo documento, não uma segunda estrutura.
- Não chama `temProfessor`, não chama `autorizacaoDirecaoOk`, não lista o KV.

### 6.2 Apresentação

```
┌───────────────────────────────────────────────────────────────┐
│  Sistema Lastro · Escola Fita                                 │
│  Tabela de atividades                                         │
│                                                               │
│  ‹  Quarta-feira · 21 de outubro  ›        [Imprimir] [Link]  │
│                                                               │
│  08:00–09:30   Balé Nível 1                                   │
│                Sala 1 · Turma intermediária                   │
│                                                               │
│  10:00–12:00   Ensaio do espetáculo                           │
│                Sala 2 · Ato II                                │
│                                                               │
│  14:00–15:00   Preparação de figurinos                        │
│                Sala 3 · Separar figurinos para prova          │
└───────────────────────────────────────────────────────────────┘
```

Regras visuais:

- Hierarquia: **horário** primeiro, depois **título**, depois **sala**, depois **descrição**.
- Uma lista por dia, ordenada por hora. Sem cartões cheios de campos, sem formulário.
- `‹` e `›` percorrem **apenas os dias que existem no retrato**. Sem filtros, sem mês, sem
  semana na v1.
- Se o dia pedido não existe no retrato, cai no dia de hoje **se houver atividades nele**;
  senão no dia publicado mais próximo (o primeiro seguinte ou o último anterior). Nunca
  inventa um dia vazio.
- O dia é escrito por extenso em português (`Quarta-feira · 21 de outubro`), com `<time datetime>`.
- Atividade com `estado: "cancelada"` aparece riscada e com o selo «Cancelada», na posição do
  horário; sem descrição.
- Responsivo: uma coluna; horário e título na mesma linha quando couber; sala e descrição abaixo.
- A página carrega `/assets/style.css` (o pacote já o tem) e, depois, um `<style>` próprio, como
  as vistas dos Bastidores. O contraste e a tipografia vêm dos tokens de
  `tools/templates/ciclo.css`. Nenhum hex novo.
- O `<html>` recebe `data-modo` e `data-paleta` da **mesma** `aparenciaDaEscola` que os Bastidores
  usam (já exportada), para a página pública vestir a escola e não uma pele própria.

### 6.3 Impressão

- Usar o comando nativo do navegador (`Ctrl+P`). **Não** há módulo de impressão.
- `@media print`: esconder `‹ ›`, «Imprimir» e «Compartilhar»; manter o nome da escola, a data e
  a lista; evitar quebra de página dentro de uma atividade.
- O CSS de impressão fica no `<style>` da própria página, com tokens existentes.

### 6.4 Compartilhamento

- Botão «Compartilhar»:
  - se `navigator.share` existir, usa-o com `title`, `text` e `url`;
  - senão, copia `location.href` com `navigator.clipboard.writeText` e mostra «Link copiado»;
  - se nem isso existir, o botão não aparece — a URL continua visível e copiável.
- O link aponta para `/tabela-de-atividades` (ou `?dia=...`). Não inclui token nem parâmetro de
  Produção.
- Sem integrações com e-mail, WhatsApp ou outros aplicativos.

### 6.5 O que nunca é renderizado

- `observacoes` de evento ou de espaço.
- Apelidos de alunas, contagens, presenças, dados de saúde.
- Eventos `rascunho` ou `publico: false`.
- Salas inativas que não estejam numa atividade publicada.
- Qualquer chave interna, token, hash ou caminho de arquivo.
- O nome do professor só aparece se o retrato o tiver (e é o nome de exibição, não o slug).

---

## 7. Produção — as três seções

### 7.1 Menu

Acrescentar ao grupo lateral da Produção, depois de «Pedagogia»:

```
Programação
  Espaços
  Eventos
  Publicação
```

`#espacos`, `#eventos`, `#publicacao` seguem o mesmo mecanismo de seções (`data-secao`,
`<section class="secao" hidden>` e o script de `mostrarSecao`). Não se cria um segundo menu.

### 7.2 Espaços

Formulário à esquerda, lista à direita — o padrão de «Professores»/«Alunas».

Campos:

- Nome (obrigatório).
- Descrição e localização.
- Capacidade, área (m²), dimensões.
- Equipamentos (pílulas do catálogo; múltipla escolha).
- Modalidades compatíveis (pílulas de `modalidades.json`).
- Observações.
- Situação (ativa/inativa).

Lista: nome, capacidade, modalidades, selo `ativa`/`inativa`, ações «Editar» e
«Ativar/Desativar». Sem «Excluir».

Abaixo, o bloco **«Turmas e salas»**: uma linha por turma vigente, com select de espaço e campo
de descrição pública. É a relação `turma-programacao` (D3/D5). O campo de descrição tem um
contador/limite suave (ex.: 140 caracteres) para manter a leitura rápida; o limite é uma
convenção de interface, não uma regra de negócio.

### 7.3 Eventos

Formulário:

- Título (obrigatório).
- Categoria (select).
- Data, início e fim.
- Espaço (select; vazio = «Local a definir»).
- Professor (select; opcional).
- Turma (select; opcional).
- Descrição pública (curta).
- Observações internas (nunca públicas).
- «Mostrar na tabela pública» (checkbox; padrão ligado).
- Situação: rascunho / pronto / cancelado.

Lista: data, horário, título, espaço, situação, ações «Editar», «Cancelar» (quando pronto) e
«Excluir» (só rascunho). Ordenação por data e hora; paginação com o componente existente.

O formulário valida no cliente o essencial (título, data, fim > início) e o servidor repete a
validação — a tela é comodidade, a regra é o servidor.

### 7.4 Publicação

- Nome exibido da escola (`nomeExibicao`).
- Janela em dias (padrão 30), com a data final calculada.
- Resumo: `N atividades em M dias`, `X eventos`, `Y aulas de turma`.
- Bloqueios (se houver): lista vermelha; o botão «Publicar» fica desativado.
- Avisos: lista âmbar; o botão continua ativo.
- Prévia da composição (a mesma lista que a tabela mostrará, sem os dados internos).
- Botão «Publicar programação».
- Estado: «Última publicação: 18/10/2026, 17:30 · 27 atividades · 3 avisos».
- Link «Abrir a tabela pública» (`target="_blank"`, sem token).
- Histórico resumido (D2), se aceito.

### 7.5 Padrão de implementação no cliente

- Reutilizar `postar()`, `TOKEN`, `location.reload()` e a paginação existente.
- **Não** usar comentários `//` dentro da string do script; usar `/* */` ou nada.
- Carregar os dados das seções novas **depois** do login (D10):
  - `POST /api/bastidores/programacao-dados` com `{ token }` devolve
    `{ espacos, eventos, turmasProgramacao, programacao, previa }`;
  - chamar em `abrirSessao()` e `retomarSessao()`;
  - enquanto não há sessão, as seções mostram um placeholder, não os dados.

---

## 8. Rotas e segurança

### 8.1 Rotas novas

| Método | Rota | Autenticação | Função |
|:--|:--|:--|:--|
| `GET` | `/tabela-de-atividades` | **nenhuma** | Página pública (lê só o retrato) |
| `POST` | `/api/bastidores/programacao-dados` | token | Dados das seções novas + prévia; aceita `janelaDias` para recalcular (POST para não pôr o token na URL) |
| `POST` | `/api/bastidores/programacao` | token | Gravar `nomeExibicao` e `janelaDias` |
| `POST` | `/api/bastidores/espaco` | token | Criar/editar espaço |
| `POST` | `/api/bastidores/espaco-situacao` | token | Ativar/desativar espaço |
| `POST` | `/api/bastidores/evento` | token | Criar/editar evento |
| `POST` | `/api/bastidores/evento-situacao` | token | Mudar situação (pronto/cancelado/rascunho) |
| `DELETE` | `/api/bastidores/evento` | token | Apagar **só** rascunho |
| `POST` | `/api/bastidores/turma-programacao` | token | Gravar espaço e descrição pública da turma |
| `POST` | `/api/bastidores/programar-publicar` | token | Compor, gravar o retrato e o espelho estático |

Todas as rotas de escrita usam `autorizacaoDirecaoOk(env, corpo)` e respondem `401` sem token
válido, exatamente como as rotas existentes. Nenhuma aceita `GET` para escrever.

O índice vivo (`POST /api/bastidores/indice`) é entregue pela frente de índices
(`PLANO-INDICES.md` §4.5); este plano o consome e não o cria.

### 8.2 Separação de acesso

- A página pública **não** importa `bastidores.js` nem partilha o seu `fetch`. Vive num módulo
  próprio (`motor/servidor/programacao.js`), montado em `producao.js` **antes de
  `bastidores.fetch`** (que casa todo `/api/bastidores/*`), **antes** do freio da Área do
  Professor e **antes** do `ASSETS`.
- A página pública lê o retrato (e a aparência) e renderiza apenas os campos do retrato. Não tem
  lista de chaves, não tem `kv.list`, não tem acesso a `professores`/`alunas`/`turmas`.
- Os endpoints de escrita continuam sob `/api/bastidores/`, atrás do token. Não há endpoint
  público de escrita, edição ou listagem de rascunhos.
- O isolamento entre escolas é o do Worker: `subdominio === ESCOLA_SLUG`; o prefixo do KV leva o
  slug. Um pedido `?escola=outra` não muda o prefixo quando `ESCOLA_SLUG` existe (e existe em
  produção).
- A resposta pública leva `Cache-Control: no-store` e não inclui `Set-Cookie`.

### 8.3 O que não se cria

- Não se cria um sistema de contas nem se altera a criação de escola.
- Não se cria um segundo namespace de KV.
- Não se cria um serviço de arquivos públicos separado.
- Não se expõe o KV directamente.

---

## 9. Validação e avisos

### 9.1 Bloqueios (impedem gravar/publicar)

| Condição | Onde |
|:--|:--|
| Espaço sem nome | rota do espaço |
| Evento sem título | rota do evento |
| Evento sem data, início ou fim válidos | rota do evento |
| `fim <= início` | rota do evento e composição |
| Data fora do formato `AAAA-MM-DD` | rota do evento |
| Publicação sem nenhuma atividade | rota de publicar (evita publicar uma tabela vazia por engano) |

### 9.2 Avisos (não impedem)

| Condição | Texto sugerido |
|:--|:--|
| Duas atividades no mesmo espaço e horário | «Sala 1 tem duas atividades às 19:00.» |
| Professor em duas atividades sobrepostas | «Tiago está em duas atividades às 19:00.» |
| Turma em duas atividades sobrepostas | «Balé Nível 1 tem duas atividades às 19:00.» |
| Aula sem sala | «Balé Nível 1 não tem sala definida.» |
| Sala inativa | «Sala 1 está inativa.» |
| Evento sem sala | «Ensaio … está sem sala (Local a definir).» |
| Turma sem professor | «Não há curadoria vigente para Balé Nível 1.» |
| Turma com mais de uma curadoria | «Balé Nível 1 tem mais de uma curadoria; o professor não foi definido.» |
| Sala incompatível com a modalidade | «Sala 2 não declara a modalidade Jazz.» |
| Turma incompleta (legado) | «Turma X não tem dias/duração/período; não entra na programação.» |

A composição calcula os avisos; a publicação grava-os no retrato; a interface mostra-os antes e
depois de publicar. Nenhum aviso é silencioso.

---

## 10. Arquivos a criar e a alterar

### 10.1 Criar

| Arquivo | Papel |
|:--|:--|
| `motor/nucleo/programacao.js` | Normalização, composição, conflitos, rótulos de dia. **Sem IO.** |
| `motor/servidor/programacao.js` | Rotas de Produção do módulo + página pública + leitura do KV |
| `biblioteca/espacos/equipamentos.json` | Catálogo de equipamentos (se §3.6 for aceito) |
| `experimentos/provar-programacao.js` | Prova do módulo puro (sem navegador) |
| `experimentos/provar-tabela-de-atividades.js` | Prova da página pública e do retrato (HTTP + DOM) |
| `indices/publico/<slug>.json` | Espelho estático do retrato (gerado no ato de publicar; estrutura definida em `PLANO-INDICES.md`) |
| `PLANO-TABELA-DE-ATIVIDADES.md` | Este documento |

### 10.2 Alterar

| Arquivo | Alteração | Congelado? |
|:--|:--|:--|
| `motor/servidor/producao.js` | Montar `programacao.fetch` **antes de `bastidores.fetch`** (e antes do freio e do `ASSETS`) — `bastidores.fetch` casa qualquer `/api/bastidores/*`, e devolveria 404 às rotas novas se viesse primeiro | não |
| `motor/servidor/bastidores.js` | Menu lateral, três seções, formulários, script, chamada ao carregamento autenticado; exportar `autorizacaoDirecaoOk` (e `lerLista`, se necessário) para o módulo novo | não |
| `tools/templates/nav-html.js` | Item «Tabela de atividades» (uma definição) | **sim** |
| `tools/criar-escola.sh` | Usar a definição do item no scaffold | **sim** |
| `tools/gerar-ciclo.sh` | Usar a definição do item no menu do pacote (D8) | **sim** |
| `REGISTRO.md` | Entrada com motivo declarado dos congelados + o marco | não (mas é obrigatório) |
| `HANDOFF.md` | Regenerar com `tools/gerar-handoff.sh` quando a implementação fechar | gerado |

**Dependência de leitura.** Este plano **não altera** o gerador de índices nem os esquemas de
`indices/esquema/`; consome-os. Se a frente de índices mudar a forma de `filtros` ou de
`indices/publico/<slug>.json`, a §3.5 e a §6.2 deste plano precisam de ser revistas antes da
Etapa 1.

**Nota sobre os congelados.** `tools/` e `tools/templates/` exigem, cada um, motivo declarado,
entrada no `REGISTRO.md` e commit próprio (`CONGELAMENTO.md`). O motivo é: **acrescentar um
destino de navegação sem alterar a forma da barra, a lógica de hash, os validadores ou as
regras**. O que **não** muda deve ser dito na entrada: forma da barra, `nav.js`, CSS, fórmulas de
hash, cobertura e pétreas.

**Reancoragem.** Nenhuma fonte de ciclo (`*.md`/`*.conf` cobertos pelo `.fipp`) é alterada. A
regeneração dos pacotes para incluir o item de menu muda **saídas geradas**, não as fontes; o
`.fipp` não muda. Ainda assim, cada pacote regenerado deve ser validado com
`node tools/check-pacote.js` e a entrada do REGISTRO deve dizer que a regeneração foi feita.

---

## 11. Etapas de execução

Cada etapa tem um **entregável** e uma **paragem**. Não se avança para a seguinte sem a anterior
validada.

### Etapa 0 — Precedência e confirmação das decisões abertas

- **Pré-requisito 1:** identidade visual fechada (`tools/check-identidade.js` e o item 2.8 do
  `IMPLEMENTACAO-IDENTIDADE.md`).
- **Pré-requisito 2:** [PLANO-INDICES.md](./PLANO-INDICES.md) implementado e validado — em
  especial `filtros`, IDs de atividade e `indices/publico/<slug>.json`.
- Confirmar as perguntas de §16 que bloqueiam a Etapa 2 (D1, D3, D7/D8, D10, D13).
- **Entregável:** decisões registadas numa nota datada neste documento ou no `REGISTRO.md`.
- **Paragem:** sem os dois pré-requisitos e sem as respostas, não se implementa.

### Etapa 1 — Auditoria registada

- Este documento (§1) é a auditoria.
- **Entregável:** revisão da auditoria pela pessoa responsável.
- **Paragem:** se a auditoria contradizer o código, ou se o índice entregue divergir da §1.8,
  corrigir antes de avançar.

### Etapa 2 — Núcleo puro + provas

- Criar `motor/nucleo/programacao.js` com:
  - normalização de espaço e evento;
  - `datasDaTurma()`, `compor()`, `detectarConflitos()`, `rotuloDoDia()`;
  - `facetas()` — calcula `filtros` a partir da lista de atividades, no mesmo formato de
    `PLANO-INDICES.md` §7.2;
  - sem `kv`, sem `fetch`, sem `Date.now()` implícito (recebe `hoje`).
- Criar `experimentos/provar-programacao.js` com:
  - turma de 2 dias/semana, período de 4 semanas → 8 ocorrências;
  - turma sem sala, sala inativa, evento sem sala, evento `publico:false`, evento `rascunho`;
  - conflito de sala e de professor;
  - turma sem hora num dia → aviso e salto;
  - janela que corta o período da turma;
  - `facetas()` com contagens corretas e listas de IDs que, interseccionadas, devolvem exatamente
    as atividades filtradas.
- **Validação:** `node experimentos/provar-programacao.js`.
- **Paragem:** se a composição não for determinística, corrigir antes da UI.

### Etapa 3 — Rotas de Produção (sem UI)

- Criar `motor/servidor/programacao.js` com as rotas de §8.1, reutilizando `autorizacaoDirecaoOk`
  e `lerLista`.
- Montar em `producao.js`.
- **Validação:** prova HTTP com KV em memória (padrão de `experimentos/provar-producao.js`):
  - escrita sem token → `401`;
  - escrita com token → grava;
  - rascunho não entra na prévia;
  - publicar grava o retrato e o espelho `indices/publico/<slug>.json`;
  - o espelho e o retrato do KV têm o mesmo conteúdo lógico (ignorando `geradoEm`/`publicadaEm`);
  - página pública sem token → `200`;
  - página pública com `?dia=` inválido → cai no dia correto.
- **Paragem:** se o retrato contiver dados internos, corrigir o `compor()`.

### Etapa 4 — UI da Produção

- Menu lateral + três seções + formulários + listas + carregamento autenticado.
- Reutilizar as peças existentes; não criar componentes novos sem desenho na folha.
- **Validação:** `node experiments/provar-producao.js` (regressão) e uma prova nova da UI.
- **Paragem:** se `provar-producao.js` quebrar, corrigir antes de seguir.

### Etapa 5 — Página pública

- Renderização por dia, anterior/próximo, impressão, compartilhamento, estado vazio.
- **Validação:** `node experimentos/provar-tabela-de-atividades.js` com:
  - retrato com dias e atividades;
  - dia sem atividades;
  - retrato ausente (estado vazio);
  - tentativa de acesso a dados internos (não aparecem no HTML);
  - `‹`/`›` limitados aos dias do retrato;
  - filtro por categoria/espaço/professor/turma usando só `filtros`, sem varrer `atividades`;
  - impressão (CSS presente);
  - compartilhamento (fallback sem `navigator.share`).
- **Paragem:** se a página pública ler outra chave que não o retrato, corrigir.

### Etapa 6 — Menu (arquivos congelados)

- Alterar `tools/templates/nav-html.js`, `tools/criar-escola.sh` e `tools/gerar-ciclo.sh` num
  **commit próprio**, com motivo declarado.
- Regenerar os pacotes existentes que devam mostrar o item; validar cada um com
  `node tools/check-pacote.js`.
- **Validação:** `node tools/check-identidade.js`, `node experiments/provar-menu-da-producao.js`,
  `node experiments/provar-celular.js`.
- **Paragem:** se a regeneração alterar conteúdo pedagógico, separar o commit.

### Etapa 7 — Provas finais e regressão

- Correr todas as provas afetadas:
  - `node experimentos/provar-programacao.js`
  - `node experimentos/provar-tabela-de-atividades.js`
  - `node experimentos/provar-producao.js`
  - `node experimentos/provar-menu-da-producao.js`
  - `node experiments/provar-celular.js`
  - `node tools/check-identidade.js`
- Verificar manualmente:
  - isolamento entre duas escolas (subdomínios diferentes, retratos diferentes);
  - página pública sem credencial;
  - token expirado → `401` nas rotas de escrita;
  - impressão em A4 e em celular;
  - nenhum dado de aluna na página pública.
- **Entregável:** resumo do que mudou, arquivos, estruturas, testes e limitações.
- **Paragem:** qualquer regressão nas funcionalidades atuais bloqueia a conclusão.

---

## 12. Critérios de conclusão

Copiados do pedido, com a evidência que os fecha:

0. **Pré-requisito:** identidade fechada e índices implementados (`PLANO-INDICES.md`), com
   `filtros` e IDs estáveis disponíveis. → Etapa 0.
1. Espaço físico e Evento disponíveis na Produção. → §7.2, §7.3 e prova da UI.
2. Registos nos mecanismos e padrões do Lastro. → §3 (KV, listas JSON, `lerLista`/`kv.put`).
3. Aulas e dados existentes aproveitados sem duplicação. → §4 (turmas + curadorias).
4. Programação composta e publicada de forma coerente. → §5 (retrato único).
5. Tabela acessível pelo menu principal, fora de Produção. → §7.1 e §6.1.
6. Página pública só com informação de consulta. → §6.5 e prova.
7. Impressão pelo navegador e compartilhamento nativo. → §6.3 e §6.4.
8. Separação entre escolas e acessos administrativos preservados. → §8.2.
9. Sem regressões nas funcionalidades atuais. → Etapa 7.

---

## 13. Governança

- **Documento novo:** este plano é um documento livre; não altera infraestrutura.
- **Precedência:** os índices são pré-requisito. Nenhum arquivo de `indices/` é alterado por este
  plano; se a frente de índices mudar a forma de `filtros`, este documento é revisto antes da
  Etapa 1.
- **Congelados:** `tools/templates/nav-html.js`, `tools/criar-escola.sh` e `tools/gerar-ciclo.sh`
  exigem motivo declarado, entrada no `REGISTRO.md` e commit próprio.
- **REGISTRO:** a entrada deve dizer o que mudou, o que **não** mudou (forma da barra, CSS,
  `nav.js`, hash, validadores, regras), e o que ficou por fazer.
- **Reancoragem:** não há alteração de fontes de ciclo; o `.fipp` não é regerado por este módulo.
  Se algum pacote for regenerado, isso é saída gerada e deve ser declarado.
- **HANDOFF:** regenerar com `tools/gerar-handoff.sh` no fecho, para a próxima sessão não achar
  que o módulo está pela metade.
- **Commits:** um por assunto — núcleo, rotas, UI, página pública, menu congelado, regeneração de
  pacotes. Não misturar conteúdo pedagógico com infraestrutura.

---

## 14. Riscos e mitigação

| Risco | Mitigação |
|:--|:--|
| `bastidores.js` já tem 5.500 linhas; a UI nova aumenta o risco de quebrar o script | Novo módulo de servidor separado; na UI, seguir o padrão existente e correr `provar-producao.js` a cada passo |
| Comentário `//` na string do script mata o resto da página | Usar `/* */`; a prova `provar-producao.js` já detecta comentários de linha |
| KV eventualmente consistente | Retrato único por publicação; leitura pública só de uma chave |
| Duas fontes para a mesma aula (turma × `ciclos.json`) | A tabela lê só a turma; o pacote continua a ser o plano do ciclo |
| Navegação duplicada em três escritores | Centralizar o item em `nav-html.js` (D8) |
| Sala apagada quebra publicação histórica | Nunca apagar; só desativar (D14) |
| Evento publicado e depois apagado some sem rastro | Só cancelar; o retrato seguinte remove, mas o resumo fica em `publicacoes` (D2) |
| Nome da escola ausente no Worker | `nomeExibicao` com padrão derivado do slug (D12) |
| Fuso horário: Worker em UTC | `env.FUSO`; datas ISO e horas locais; sem aritmética de `Date` com hora |
| Publicar uma tabela vazia por engano | Bloqueio quando não há atividades (D20/§9.1) |
| Vazamento de notas internas no HTML da Produção | Carregar as seções novas só depois do login (D10) |

---

## 15. Fora do escopo (v1)

- Editor de recorrência, exceções e repetição de eventos.
- Arrastar e soltar, construtor de calendário, vista de mês/semana.
- Edição pública de qualquer natureza.
- Filtros públicos por sala, professor, modalidade ou turma.
- Módulo próprio de impressão, exportação em PDF/CSV.
- Integrações com e-mail, WhatsApp, Google Calendar ou similares.
- Reserva de sala com bloqueio impeditivo.
- Faturamento, cotas ou planos comerciais.
- Avaliação, presenças ou dados de alunas.
- Alteração do sistema de contas, da criação de escola ou do modelo de senhas.
- Migração de dados existentes: as chaves novas nascem vazias.

---

## 16. Perguntas que bloqueiam a implementação

Estas decisões não se resolvem só pelo código; precisam de confirmação.

1. **Sala das aulas (D3).** A relação `turma-programacao` (nome da turma → sala + descrição
   pública) é aceitável, ou a escola prefere um campo `espacoId` dentro da própria turma
   (sujeito às regras de derivação)?
2. **Publicação (D1/D2).** O retrato único + resumo histórico é suficiente, ou é preciso guardar
   o retrato completo de cada publicação?
3. **Menu (D7/D8).** «Tabela de atividades» fica entre «Área do Professor» e «Bastidores»? O item
   deve aparecer também no menu dos pacotes gerados, ou só na Produção e no scaffold?
4. **Dados no HTML (D10).** Aceita-se que as seções novas carreguem os dados só depois do login
   (mais seguro, um pouco mais de JS), ou seguimos o padrão das seções antigas (tudo no HTML,
   portão só no cliente)?
5. **Cabeçalho público (D13).** A página pública tem cabeçalho enxuto (sem links para
   Bastidores), ou mostra a barra do sistema inteira?
6. **Cancelamento (D17).** O evento cancelado deve aparecer riscado com «Cancelada»
   (recomendado), ou desaparecer da lista?
7. **Janela (D6).** 30 dias é o padrão aceitável? A escola deve poder escolher outro valor na
   Publicação?
8. **Nome da escola (D12).** `nomeExibicao` editável na Publicação resolve, ou o nome deve vir de
   uma variável do Worker (`ESCOLA_NOME`) configurada no deploy?
9. **Categorias (§3.2).** A lista `aula · ensaio · apresentação · festival · família ·
   reunião · manutenção · outro` cobre o vocabulário da escola?
10. **Manutenção.** Bloqueios de sala por manutenção devem aparecer na tabela pública como
    «Sala indisponível», ou são só internos (`publico: false`)?
11. **Contrato do índice.** A frente de índices entrega `filtros` com `valor`, `rotulo`, `contagem`
    e `ids` no retrato publicado (`PLANO-INDICES.md` §7.2)? Se a forma mudar, a §3.5 deste plano
    precisa de ser revista antes da Etapa 1.

---

## Anexo A — Exemplo de retrato mínimo

```json
{
  "escola": "fita",
  "escolaNome": "Escola Fita",
  "publicadaEm": "2026-10-18T17:30:00.000Z",
  "por": "direcao",
  "janela": { "de": "2026-10-18", "ate": "2026-11-16" },
  "atividades": [
    {
      "id": "atividade:turma:bale-nivel-1:2026-10-21:19:00",
      "origem": "turma",
      "fonteId": "bale-nivel-1",
      "data": "2026-10-21",
      "inicio": "19:00",
      "fim": "20:00",
      "titulo": "Balé Nível 1",
      "descricao": "Turma intermediária",
      "espaco": { "id": "sala-1", "nome": "Sala 1" },
      "turma": "Balé Nível 1",
      "professor": "Tiago",
      "categoria": "aula",
      "estado": "confirmada"
    },
    {
      "id": "atividade:evento:ensaio-do-espetaculo-2026-10-21-1000:2026-10-21:10:00",
      "origem": "evento",
      "fonteId": "ensaio-do-espetaculo-2026-10-21-1000",
      "data": "2026-10-21",
      "inicio": "10:00",
      "fim": "12:00",
      "titulo": "Ensaio do espetáculo",
      "descricao": "Ato II",
      "espaco": { "id": "sala-2", "nome": "Sala 2" },
      "turma": "",
      "professor": "Tiago",
      "categoria": "ensaio",
      "estado": "confirmada"
    }
  ],
  "avisos": []
}
```

## Anexo B — Mapa do pedido para este plano

| Pedido (§ do texto recebido) | Onde está neste plano |
|:--|:--|
| 1. Separação das áreas | §0, §2.1, §6.1, §8.2 |
| 2. Como deve ser a tabela publicada | §6.2–§6.4 |
| 3.1 Espaço físico | §3.1, §7.2 |
| 3.2 Evento | §3.2, §7.3 |
| 3.3 Relação com as atividades existentes | §1.3, §4 |
| 4. Tabela pública | §6 |
| 5. Publicação e ciclo de vida | §5 |
| 6. Acesso e segurança | §1.4, §8 |
| 7. Experiência de uso e interface | §6.2, §7 |
| 8. Validações | §9 |
| 9. Plano de execução | §11 |
| 10. Critérios de conclusão | §12 |
| Anexo: auditoria antes da interface | §1 |
| Precedência: identidade → índices → tabela | §1.8, Etapa 0, §13 |
